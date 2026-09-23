import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  AUTO_APPROVE_AFTER_MS,
  blueprintSchema,
  criticBatchSchema,
  itemBatchSchema,
  type Blueprint,
  type CriticVerdict,
  type GeneratedItem,
  type GenerationLogLine,
  type GenerationStage,
} from "../../../shared/assessment";
import { learnerProfileSchema, type LearnerProfile } from "../../../shared/profile";
import { buildBlueprintUser, BLUEPRINT_SYSTEM } from "../ai/prompts/blueprint";
import { buildCriticUser, CRITIC_SYSTEM } from "../ai/prompts/critic";
import { buildExplainUser, buildItemsUser, EXPLAIN_SYSTEM, ITEMS_SYSTEM } from "../ai/prompts/items";
import type { AiService } from "../ai/service";
import type { ContentStore } from "../content/store";
import { schema, type Db } from "../db";
import type { Job } from "../jobs/queue";
import { newId, now } from "../lib/ids";
import { notify } from "../lib/notify";
import type { CodeSandbox } from "../sandbox";
import { buildAreaDigest, buildManifestDigest, knownModuleIds } from "./digest";
import { GenerationLog } from "./generationLog";
import { validateGeneratedItem, verifyCodeItem, type RejectionCode } from "./validateItem";

const payloadSchema = z.object({ assessmentId: z.string() });

const EXPLAIN_ITEM_COUNT = 4;
/** Roughly 2-3 per difficulty level per area (brief §9.2 step 3). */
const ITEMS_PER_LEVEL = 3;
const MAX_CODE_ITEMS = 3;

export interface BlueprintDeps {
  db: Db;
  ai: AiService;
  content: ContentStore;
  sandbox: CodeSandbox;
  log?: (message: string) => void;
  /**
   * Pushes each stored generation-log line to the admin's live feed. Optional: without it the log
   * still persists and the admin console still reads it back, a poll later rather than at once.
   */
  publish?: (line: GenerationLogLine) => void;
}

/** Why an item did not make the pool, as a fixed tag safe to put in front of an admin. */
type DropCode = RejectionCode | "over-code-limit" | "critic-rejected" | "critic-disagreed";

/**
 * `assessment.blueprint` (brief §9.2).
 *
 * Blueprint, then a pool per area, then an independent critic pass, then code verification. Every
 * drop is recorded with its reason, so an assessment that comes out thin can be explained rather
 * than guessed at.
 *
 * The whole pool is generated before the learner starts. During the test the server only selects,
 * so no item is ever waiting on a model.
 */
export function blueprintHandler(deps: BlueprintDeps) {
  return async (job: Job): Promise<void> => {
    const { assessmentId } = payloadSchema.parse(job.payload);
    const { db, ai, content, sandbox } = deps;

    const assessment = db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment) return; // Deleted between enqueue and run.
    if (assessment.status !== "generating") {
      deps.log?.(`assessment ${assessmentId} is ${assessment.status}, not generating — skipping`);
      return;
    }

    // Every line is scrubbed by the AI service, which owns the credential; nothing here writes
    // its own scrubber. See generationLog.ts for what a line may say.
    const log = new GenerationLog({
      db,
      assessmentId,
      redactLine: (text) => ai.redactSecrets(text),
      publish: deps.publish,
    });

    /** Reports a provider call that failed and is about to be retried, while it is happening. */
    const watchRetries = (stage: GenerationStage, what: string) => (a: {
      attempt: number;
      maxAttempts: number;
      message: string;
      willRetry: boolean;
    }) =>
      log.warn(
        stage,
        `${what}: attempt ${a.attempt} of ${a.maxAttempts} failed${a.willRetry ? ", retrying" : ""} — ${a.message}`,
      );

    log.info("start", `Generation started (job attempt ${job.attempts} of ${job.maxAttempts}).`);

    try {
      const profile = readProfile(db, assessment.userId);
      const user = db.select().from(schema.users).where(eq(schema.users.id, assessment.userId)).get();
      const displayName = user?.displayName ?? "the learner";

      const digest = buildManifestDigest(content, profile);
      if (digest.modules.length === 0) {
        throw new Error("No curriculum modules matched this person's target tracks, so there is nothing to test.");
      }

      // ---- AI call 1: the blueprint ----
      log.info("blueprint", `Asking for a blueprint over ${digest.modules.length} modules.`);
      const blueprintResult = await ai.generateJson({
        purpose: "blueprint",
        system: BLUEPRINT_SYSTEM,
        user: buildBlueprintUser(profile, digest, displayName),
        schema: blueprintSchema,
        schemaName: "blueprint",
        meta: { subjectUserId: assessment.userId, assessmentId },
        onAttemptFailed: watchRetries("blueprint", "Blueprint"),
      });

      const blueprint = sanitiseBlueprint(blueprintResult.data, knownModuleIds(content));
      if (blueprint.areas.length < 3) {
        throw new Error("The blueprint's areas referenced modules that do not exist, leaving too few to test.");
      }

      const configured = (assessment.config as { timeLimitMinutes?: number } | null) ?? {};
      const timeLimitMinutes = configured.timeLimitMinutes ?? blueprint.timeLimitMinutes;

      db.update(schema.assessments)
        .set({ blueprint, config: { ...configured, timeLimitMinutes, areas: blueprint.areas.map((a) => a.name) } })
        .where(eq(schema.assessments.id, assessmentId))
        .run();

      log.info(
        "blueprint",
        `Blueprint accepted: ${blueprint.areas.length} areas, ${timeLimitMinutes} minute limit, model ${blueprintResult.model}.`,
        usageOf(blueprintResult),
      );

      // ---- AI call 2: one pool per area, sequentially (the concurrency cap is 2) ----
      let codeItemsSoFar = 0;
      const dropped: { area: string; reason: string }[] = [];
      let kept = 0;

      for (const area of blueprint.areas) {
        const areaDigest = buildAreaDigest(content, area.moduleIds);
        if (areaDigest.topics.length === 0) {
          dropped.push({ area: area.name, reason: "No topics were found for this area's modules." });
          log.warn("items", `Area "${area.name}" skipped: none of its modules have topics.`);
          continue;
        }

        log.info("items", `Area "${area.name}": asking for items over ${areaDigest.topics.length} topics.`);
        const batch = await ai.generateJson({
          purpose: "blueprint",
          system: ITEMS_SYSTEM,
          user: buildItemsUser(area, areaDigest, ITEMS_PER_LEVEL),
          schema: itemBatchSchema,
          schemaName: "items",
          meta: { subjectUserId: assessment.userId, assessmentId },
          onAttemptFailed: watchRetries("items", `Area "${area.name}"`),
        });
        log.info("items", `Area "${area.name}": ${batch.data.items.length} items returned.`, usageOf(batch));

        const verdicts = await critique(ai, batch.data.items, assessment.userId, assessmentId, log);

        let areaKept = 0;
        for (const [index, item] of batch.data.items.entries()) {
          const verdict = verdicts.get(index) ?? null;
          const outcome = await storeItem({
            db,
            sandbox,
            assessmentId,
            area: area.name,
            item,
            verdict,
            knownTopicIds: digest.topicIds,
            codeBudgetLeft: MAX_CODE_ITEMS - codeItemsSoFar,
            log,
          });

          if (outcome.stored) {
            kept += 1;
            areaKept += 1;
            if (item.kind === "code") codeItemsSoFar += 1;
          } else {
            dropped.push({ area: area.name, reason: outcome.reason });
            log.warn("items", describeDrop(area.name, item, outcome.itemId, outcome.code));
          }
        }

        log.info(
          "items",
          `Area "${area.name}": ${areaKept} kept, ${batch.data.items.length - areaKept} dropped (${kept} kept so far).`,
        );
        deps.log?.(`area "${area.name}": ${kept} items kept so far`);
      }

      // ---- The written-answer items, for the whole assessment ----
      log.info("explain", `Asking for ${EXPLAIN_ITEM_COUNT} written-answer items.`);
      const explainBatch = await ai.generateJson({
        purpose: "blueprint",
        system: EXPLAIN_SYSTEM,
        user: buildExplainUser(blueprint.areas, [...digest.topicIds].slice(0, 120), EXPLAIN_ITEM_COUNT),
        schema: itemBatchSchema,
        schemaName: "explain_items",
        meta: { subjectUserId: assessment.userId, assessmentId },
        onAttemptFailed: watchRetries("explain", "Written answers"),
      });
      log.info("explain", `${explainBatch.data.items.length} written-answer items returned.`, usageOf(explainBatch));

      const explainVerdicts = await critique(ai, explainBatch.data.items, assessment.userId, assessmentId, log);
      let explainKept = 0;
      for (const [index, item] of explainBatch.data.items.entries()) {
        const explainItem: GeneratedItem = { ...item, kind: "explain" };
        const outcome = await storeItem({
          db,
          sandbox,
          assessmentId,
          area: "Written answers",
          // The prompt asks for explain items; anything else here is a generation slip.
          item: explainItem,
          verdict: explainVerdicts.get(index) ?? null,
          knownTopicIds: digest.topicIds,
          codeBudgetLeft: 0,
          log,
        });
        if (outcome.stored) {
          kept += 1;
          explainKept += 1;
        } else {
          dropped.push({ area: "Written answers", reason: outcome.reason });
          log.warn("explain", describeDrop("Written answers", explainItem, outcome.itemId, outcome.code));
        }
      }
      log.info(
        "explain",
        `Written answers: ${explainKept} kept, ${explainBatch.data.items.length - explainKept} dropped.`,
      );

      if (kept < 10) {
        throw new Error(
          `Only ${kept} items survived validation, which is not enough for a meaningful assessment. ${dropped.length} were dropped; the reasons are on each item.`,
        );
      }

      // Not `ready`: the superadmin gets first look. The timestamp is what the auto-approval
      // deadline is measured from, so it is written in the same statement as the status.
      db.update(schema.assessments)
        .set({ status: "awaiting_approval", awaitingApprovalSince: now() })
        .where(eq(schema.assessments.id, assessmentId))
        .run();

      const graceMinutes = Math.round(AUTO_APPROVE_AFTER_MS / 60_000);
      notifyAdmins(db, {
        kind: "assessment.awaiting_approval",
        title: `Assessment ready to review for ${displayName}`,
        body: `${kept} items across ${blueprint.areas.length} areas. ${dropped.length} were dropped in review. It goes to ${displayName} automatically in ${graceMinutes} minutes unless you approve it first.`,
        link: `/admin/assessments/${assessmentId}`,
      });

      log.info(
        "finish",
        `Done: ${kept} items kept and ${dropped.length} dropped across ${blueprint.areas.length} areas. Awaiting your approval.`,
      );
      deps.log?.(`assessment ${assessmentId} awaiting approval: ${kept} items kept, ${dropped.length} dropped`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log.error("finish", `Generation failed: ${message}`);
      db.update(schema.assessments)
        .set({ status: "failed", terminatedReason: message.slice(0, 500) })
        .where(eq(schema.assessments.id, assessmentId))
        .run();

      notifyAdmins(db, {
        kind: "assessment.failed",
        title: "An assessment could not be generated",
        body: message.slice(0, 300),
        link: `/admin/people/${assessment.userId}`,
      });

      // Rethrown so the queue records the failure and the retry policy applies.
      throw error;
    }
  };
}

function readProfile(db: Db, userId: string): LearnerProfile {
  const row = db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get();
  if (!row) throw new Error("This learner has no profile, so there is nothing to build an assessment from.");
  return learnerProfileSchema.parse({
    roleTitle: row.roleTitle,
    yearsExperience: row.yearsExperience,
    adminNotes: row.adminNotes,
    claimedSkills: row.claimedSkills,
    targetTracks: row.targetTracks,
  });
}

/** Drops areas whose modules do not exist, rather than generating items for nothing. */
function sanitiseBlueprint(blueprint: Blueprint, knownModules: ReadonlySet<string>): Blueprint {
  const areas = blueprint.areas
    .map((area) => ({ ...area, moduleIds: area.moduleIds.filter((id) => knownModules.has(id)) }))
    .filter((area) => area.moduleIds.length > 0);
  return { ...blueprint, areas };
}

/**
 * Runs the critic and indexes its verdicts.
 *
 * A critic failure is not fatal: it downgrades the pass to "no independent review" rather than
 * losing a whole area's items. The items still went through schema and semantic validation, and
 * an assessment with unreviewed items is better than no assessment — but the admin can see which
 * items lack a verdict.
 */
async function critique(
  ai: AiService,
  items: GeneratedItem[],
  subjectUserId: string,
  assessmentId: string,
  log: GenerationLog,
): Promise<Map<number, CriticVerdict>> {
  const verdicts = new Map<number, CriticVerdict>();
  if (items.length === 0) return verdicts;

  log.info("critic", `Sending ${items.length} items for independent review.`);
  try {
    const result = await ai.generateJson({
      purpose: "item_critic",
      system: CRITIC_SYSTEM,
      user: buildCriticUser(items),
      schema: criticBatchSchema,
      schemaName: "critic",
      meta: { subjectUserId, assessmentId },
      onAttemptFailed: (a) =>
        log.warn(
          "critic",
          `Critic: attempt ${a.attempt} of ${a.maxAttempts} failed${a.willRetry ? ", retrying" : ""} — ${a.message}`,
        ),
    });
    for (const verdict of result.data.verdicts) {
      if (verdict.index >= 0 && verdict.index < items.length) verdicts.set(verdict.index, verdict);
    }
    log.info("critic", `Critic reviewed ${verdicts.size} of ${items.length} items.`, usageOf(result));
  } catch (error) {
    // Left empty: every item is then stored with criticVerdict null.
    log.warn(
      "critic",
      `The critic pass failed, so this batch is stored without an independent review — ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return verdicts;
}

/** Token and latency numbers from a finished provider call, for the line that reports it. */
function usageOf(result: { usage: { input: number; output: number }; latencyMs: number }) {
  return { inputTokens: result.usage.input, outputTokens: result.usage.output, elapsedMs: result.latencyMs };
}

/**
 * One line about a rejected item, for the admin watching.
 *
 * Deliberately built field by field from what is safe to show: the item's id so it can be found
 * in the pool preview, its kind, difficulty and area, and a fixed tag for why. The prose reason
 * stays on the item row, where it belongs — it quotes expected output and the critic's own
 * answer, and this log is not the place for an answer key.
 */
function describeDrop(area: string, item: GeneratedItem, itemId: string, code: DropCode): string {
  return `Dropped ${item.kind} ${itemId} (difficulty ${item.difficulty}) in "${area}" — ${code}.`;
}

interface StoreItemInput {
  db: Db;
  sandbox: CodeSandbox;
  assessmentId: string;
  area: string;
  item: GeneratedItem;
  verdict: CriticVerdict | null;
  knownTopicIds: ReadonlySet<string>;
  codeBudgetLeft: number;
  log: GenerationLog;
}

type StoreOutcome =
  | { stored: true; itemId: string }
  | { stored: false; itemId: string; reason: string; code: DropCode };

/**
 * Validates one item and writes it, kept or dropped.
 *
 * Dropped items are stored too. The admin's pool preview shows what was rejected and why, which
 * is the only way to tell "the model wrote weak items" from "the critic is too strict".
 *
 * The outcome carries a fixed `code` as well as the prose reason, because the two go to different
 * places: the prose to the item row, which the pool preview already shows keys on, and the code to
 * the generation log, which must not become one.
 */
async function storeItem(input: StoreItemInput): Promise<StoreOutcome> {
  const { db, item, verdict } = input;
  const itemId = newId();

  const record = (status: "pool" | "dropped", reason: string | null, payload: unknown, key: unknown, topicIds: string[]) => {
    db.insert(schema.assessmentItems)
      .values({
        id: itemId,
        assessmentId: input.assessmentId,
        area: input.area,
        difficulty: item.difficulty,
        kind: item.kind,
        topicIds,
        payload,
        key,
        criticVerdict: verdict,
        status,
        dropReason: reason,
      })
      .run();
  };

  const validation = validateGeneratedItem(item, input.knownTopicIds);
  if (!validation.ok) {
    record("dropped", validation.reason, { prompt: item.prompt }, { rationale: item.rationale }, item.topicIds);
    return { stored: false, itemId, reason: validation.reason, code: validation.code };
  }

  if (item.kind === "code" && input.codeBudgetLeft <= 0) {
    const reason = `Over the limit of ${MAX_CODE_ITEMS} code items for one assessment.`;
    record("dropped", reason, validation.payload, validation.key, validation.topicIds);
    return { stored: false, itemId, reason, code: "over-code-limit" };
  }

  if (item.kind === "code") {
    const verified = await verifyCodeItem(validation.payload, validation.key, input.sandbox);
    if (!verified.ok) {
      record("dropped", verified.reason, validation.payload, validation.key, validation.topicIds);
      return { stored: false, itemId, reason: verified.reason, code: verified.code };
    }
    // Worth a line of its own: this is the one step that actually executes generated code, and
    // when it is slow the admin should be able to see that it is running rather than stuck.
    input.log.info("verify", `Code item ${itemId} verified: the reference solution passes, the starter code does not.`);
  }

  if (verdict && verdict.verdict === "drop") {
    const reason = `The critic rejected it: ${verdict.issues.join("; ") || "no reason given"}`;
    record("dropped", reason, validation.payload, validation.key, validation.topicIds);
    return { stored: false, itemId, reason, code: "critic-rejected" };
  }

  if (verdict && !verdict.agreesWithKey) {
    const reason = `The critic answered differently: it said "${verdict.answer.slice(0, 200)}"`;
    record("dropped", reason, validation.payload, validation.key, validation.topicIds);
    return { stored: false, itemId, reason, code: "critic-disagreed" };
  }

  record("pool", null, validation.payload, validation.key, validation.topicIds);
  return { stored: true, itemId };
}

function notifyAdmins(db: Db, message: { kind: string; title: string; body: string; link: string }): void {
  const admins = db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "superadmin")).all();
  for (const admin of admins) notify(db, { recipientId: admin.id, ...message });
}

export { now };
