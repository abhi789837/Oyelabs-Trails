import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  AUTO_APPROVE_AFTER_MS,
  blueprintSchema,
  criticBatchSchema,
  itemBatchSchema,
  looseItemBatchSchema,
  TIME_LIMIT_SEC,
  type Blueprint,
  type CriticVerdict,
  type GeneratedItem,
  type GenerationLogLine,
  type GenerationStage,
  type LooseItemBatch,
} from "../../../shared/assessment";
import { itemKindSchema, type ItemKind } from "../../../shared/enums";
import { learnerProfileSchema, type LearnerProfile } from "../../../shared/profile";
import { buildBlueprintUser, BLUEPRINT_SYSTEM } from "../ai/prompts/blueprint";
import { buildCriticUser, CRITIC_SYSTEM } from "../ai/prompts/critic";
import { buildExplainUser, buildItemsUser, EXPLAIN_SYSTEM, ITEMS_SYSTEM } from "../ai/prompts/items";
import type { AiService } from "../ai/service";
import type { GenerateJsonRequest } from "../ai/types";
import type { ContentStore } from "../content/store";
import { schema, type Db } from "../db";
import type { Job } from "../jobs/queue";
import { newId, now } from "../lib/ids";
import { notify } from "../lib/notify";
import type { CodeSandbox } from "../sandbox";
import { buildAreaDigest, buildManifestDigest, knownModuleIds } from "./digest";
import { GenerationLog } from "./generationLog";
import {
  splitItemBatch,
  validateGeneratedItem,
  verifyCodeItem,
  type MalformedItem,
  type RejectionCode,
} from "./validateItem";

const payloadSchema = z.object({ assessmentId: z.string() });

const EXPLAIN_ITEM_COUNT = 4;
/** Roughly 2-3 per difficulty level per area (brief §9.2 step 3). */
const ITEMS_PER_LEVEL = 3;
const MAX_CODE_ITEMS = 3;

/**
 * Below this many usable items, a batch is treated as a call that failed rather than a batch with
 * a bad item in it, and asked for once more.
 *
 * This is the line the whole per-item parse turns on. One item in twenty missing its `rationale`
 * is a dropped item — it is not worth another provider call, and it certainly is not worth
 * failing a generation over, which is exactly what it used to do. A batch nothing survives is a
 * different thing: the model has misunderstood the request, and asking again is the right move.
 */
const MIN_USABLE_BATCH_ITEMS = 3;

/** How many times one batch may be asked for before the area is left out of the assessment. */
const MAX_BATCH_ATTEMPTS = 2;

/** How many field paths one malformed item names in its log line before the rest are counted. */
const MAX_REPORTED_PATHS = 4;

/**
 * The fewest items an assessment can be released with at all.
 *
 * Generation does not fail for being thin. An admin who issues an assessment gets one, and how
 * good it is, area by area, is on the pool preview and in the log — visible enough that re-issuing
 * is an informed choice rather than the only option. It fails only when there would be nothing to
 * serve: below this the learner would answer a handful of questions and be placed on them, which
 * is worse than being told to try again. A healthy run keeps twenty-five or more, so one ruined
 * batch — or three — never reaches this floor.
 */
const MIN_SERVABLE_ITEMS = 6;

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
      if (blueprint.areas.length === 0) {
        throw new Error("Every area the blueprint proposed referenced modules that do not exist, so there is nothing to test.");
      }
      const proposedAreas = blueprintResult.data.areas.length;
      if (blueprint.areas.length < proposedAreas) {
        // Not fatal: a narrower assessment is still an assessment. Said out loud so the admin can
        // see that the plan shrank before the items were even asked for.
        log.warn(
          "blueprint",
          `${proposedAreas - blueprint.areas.length} of ${proposedAreas} proposed areas named modules that do not exist and were dropped.`,
        );
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
      /** Areas the assessment will not cover, so the finish line can say how thin it came out. */
      const emptyAreas: string[] = [];
      let kept = 0;

      for (const area of blueprint.areas) {
        const areaDigest = buildAreaDigest(content, area.moduleIds);
        if (areaDigest.topics.length === 0) {
          emptyAreas.push(area.name);
          log.warn("items", `Area "${area.name}" skipped: none of its modules have topics.`);
          continue;
        }

        log.info("items", `Area "${area.name}": asking for items over ${areaDigest.topics.length} topics.`);
        const batch = await requestItemBatch({
          ai,
          log,
          stage: "items",
          what: `Area "${area.name}"`,
          request: {
            purpose: "blueprint",
            system: ITEMS_SYSTEM,
            user: buildItemsUser(area, areaDigest, ITEMS_PER_LEVEL),
            schema: looseItemBatchSchema,
            contractSchema: itemBatchSchema,
            schemaName: "items",
            meta: { subjectUserId: assessment.userId, assessmentId },
            onAttemptFailed: watchRetries("items", `Area "${area.name}"`),
          },
        });

        // Malformed items are dropped like any other unusable item, rather than above the drop
        // path: storing them is what puts "we asked for twenty and kept nineteen" in front of an
        // admin instead of quietly shipping a thinner area.
        for (const bad of batch.malformed) {
          const itemId = storeMalformedItem(db, assessmentId, area.name, bad);
          dropped.push({ area: area.name, reason: bad.detail });
          log.warn("items", describeMalformedDrop(area.name, itemId, bad));
        }

        const verdicts = await critique(ai, batch.items, assessment.userId, assessmentId, log);

        let areaKept = 0;
        for (const [index, item] of batch.items.entries()) {
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
          `Area "${area.name}": ${batch.returned} returned, ${areaKept} kept, ${batch.returned - areaKept} dropped (${kept} kept so far).`,
        );
        if (areaKept === 0) {
          // An area nothing survived is not a failed generation: the other areas still describe
          // this person. It is a hole in the assessment, so it is named as one.
          emptyAreas.push(area.name);
          log.warn("items", `Area "${area.name}" came back with nothing usable, so the assessment will not cover it.`);
        }
        deps.log?.(`area "${area.name}": ${kept} items kept so far`);
      }

      // ---- The written-answer items, for the whole assessment ----
      log.info("explain", `Asking for ${EXPLAIN_ITEM_COUNT} written-answer items.`);
      const explainBatch = await requestItemBatch({
        ai,
        log,
        stage: "explain",
        what: "Written answers",
        // Four items is the whole batch, so a single usable one is still worth keeping.
        minUsable: 1,
        request: {
          purpose: "blueprint",
          system: EXPLAIN_SYSTEM,
          user: buildExplainUser(blueprint.areas, [...digest.topicIds].slice(0, 120), EXPLAIN_ITEM_COUNT),
          schema: looseItemBatchSchema,
          contractSchema: itemBatchSchema,
          schemaName: "explain_items",
          meta: { subjectUserId: assessment.userId, assessmentId },
          onAttemptFailed: watchRetries("explain", "Written answers"),
        },
      });

      for (const bad of explainBatch.malformed) {
        const itemId = storeMalformedItem(db, assessmentId, "Written answers", bad);
        dropped.push({ area: "Written answers", reason: bad.detail });
        log.warn("explain", describeMalformedDrop("Written answers", itemId, bad));
      }

      const explainVerdicts = await critique(ai, explainBatch.items, assessment.userId, assessmentId, log);
      let explainKept = 0;
      for (const [index, item] of explainBatch.items.entries()) {
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
      log.info("explain", `Written answers: ${explainKept} kept, ${explainBatch.returned - explainKept} dropped.`);

      if (kept < MIN_SERVABLE_ITEMS) {
        throw new Error(
          `Only ${kept} items survived validation, which is not enough to serve an assessment at all. ${dropped.length} were dropped; the reasons are on each item.`,
        );
      }

      // How thin it came out, said plainly and at warn level, because a releasable assessment that
      // covers five areas instead of eight looks identical to a good one unless someone says so.
      const thin = emptyAreas.length > 0 || kept < blueprint.targetItemCount;
      if (thin) {
        log.warn(
          "finish",
          `This pool came out thinner than planned: ${kept} items kept of ${blueprint.targetItemCount} asked for` +
            (emptyAreas.length > 0
              ? `, and ${emptyAreas.length} of ${blueprint.areas.length} areas produced nothing (${emptyAreas.join(", ")})`
              : "") +
            `. It can still be approved and released — re-issue if you want a fuller one.`,
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
        body:
          `${kept} items across ${blueprint.areas.length - emptyAreas.length} areas. ${dropped.length} were dropped in review.` +
          (emptyAreas.length > 0 ? ` ${emptyAreas.length} areas produced nothing and are not covered.` : "") +
          ` It goes to ${displayName} automatically in ${graceMinutes} minutes unless you approve it first.`,
        link: `/admin/assessments/${assessmentId}`,
      });

      log.info(
        "finish",
        `Done: ${kept} items kept and ${dropped.length} dropped across ${blueprint.areas.length - emptyAreas.length} of ${blueprint.areas.length} areas. Awaiting your approval.`,
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

interface BatchOutcome {
  items: GeneratedItem[];
  malformed: MalformedItem[];
  /** How many elements the model returned, usable or not, so a count can be honest about both. */
  returned: number;
}

/**
 * Asks for one batch of items and splits it into what can be used and what cannot.
 *
 * The provider call is only made again when the batch is unusable *as a whole*. A batch that came
 * back with one bad item in twenty is not a failed call — that item is dropped and the other
 * nineteen are kept, which is what this pipeline has always done with items it cannot use. The
 * distinction is the whole point: a single missing `rationale` used to fail the parse, fail the
 * retry on another single bad item, and end a generation that already had a good blueprint and
 * nineteen good items in hand.
 *
 * Nothing here throws. An area that comes back with nothing is a hole in the assessment, not the
 * end of it.
 */
async function requestItemBatch(input: {
  ai: AiService;
  log: GenerationLog;
  stage: GenerationStage;
  /** Names what is being generated, in each line it writes: `Area "Async"`, or `Written answers`. */
  what: string;
  request: GenerateJsonRequest<LooseItemBatch>;
  /** Overrides the batch floor where a whole batch is only a handful of items. */
  minUsable?: number;
}): Promise<BatchOutcome> {
  const { ai, log, stage, what, request } = input;
  const floor = input.minUsable ?? MIN_USABLE_BATCH_ITEMS;
  let best: BatchOutcome = { items: [], malformed: [], returned: 0 };

  for (let attempt = 1; attempt <= MAX_BATCH_ATTEMPTS; attempt++) {
    const again = attempt < MAX_BATCH_ATTEMPTS;
    try {
      const result = await ai.generateJson(request);
      const split = splitItemBatch(result.data.items);
      log.info(stage, `${what}: ${result.data.items.length} items returned, ${split.items.length} usable.`, usageOf(result));

      // The better of the attempts is what gets used: a second try that comes back worse should
      // not cost the items the first one produced.
      if (split.items.length >= best.items.length) {
        best = { items: split.items, malformed: split.malformed, returned: result.data.items.length };
      }
      if (split.items.length >= floor) return best;

      log.warn(
        stage,
        `${what}: only ${split.items.length} of ${result.data.items.length} items were usable${again ? ", asking again" : ""}.`,
      );
    } catch (error) {
      log.warn(
        stage,
        `${what}: the request failed${again ? ", asking again" : ""} — ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return best;
}

/**
 * Writes a row for an item that never parsed, so it is counted and readable like any other drop.
 *
 * The row has to name a kind and a difficulty, and when those are the fields that were malformed
 * there is nothing true to put in them — the drop reason says so, nothing ever selects a dropped
 * row, and an admin only meets these placeholders next to the explanation. Zod's full account goes
 * on `dropReason`, which the pool preview shows to someone already allowed to see answer keys. It
 * never goes to the generation log.
 */
function storeMalformedItem(db: Db, assessmentId: string, area: string, bad: MalformedItem): string {
  const itemId = newId();
  const salvagedKind = itemKindSchema.safeParse(bad.raw.kind);
  const kind: ItemKind = salvagedKind.success ? salvagedKind.data : "mcq";
  const difficulty =
    typeof bad.raw.difficulty === "number" && bad.raw.difficulty >= 1 && bad.raw.difficulty <= 5
      ? Math.round(bad.raw.difficulty)
      : 1;
  const text = (value: unknown, missing: string) =>
    typeof value === "string" && value.trim().length > 0 ? value.slice(0, 4000) : missing;

  db.insert(schema.assessmentItems)
    .values({
      id: itemId,
      assessmentId,
      area,
      difficulty,
      kind,
      topicIds: Array.isArray(bad.raw.topicIds)
        ? bad.raw.topicIds.filter((id): id is string => typeof id === "string").slice(0, 3)
        : [],
      payload: { prompt: text(bad.raw.prompt, "(this item arrived without a usable prompt)"), timeLimitSec: TIME_LIMIT_SEC[kind] },
      key: { rationale: text(bad.raw.rationale, "(this item arrived without a rationale)") },
      criticVerdict: null,
      status: "dropped",
      dropReason: bad.detail.slice(0, 1000),
    })
    .run();

  return itemId;
}

/**
 * One line about an item that never parsed.
 *
 * Field paths and the fixed code, and nothing else. Zod's messages are deliberately left behind:
 * they can quote the value they received, and the values in an item are its correct answers, its
 * rationale and its reference solution. Same reason `describeDrop` carries a tag rather than the
 * prose reason — this log is not an answer key.
 */
function describeMalformedDrop(area: string, itemId: string, bad: MalformedItem): string {
  const code: DropCode = "schema-invalid";
  const shown = bad.paths.slice(0, MAX_REPORTED_PATHS);
  const rest = bad.paths.length - shown.length;
  return `Dropped a malformed item ${itemId} in "${area}" — ${code} (${shown.join(", ")}${rest > 0 ? `, and ${rest} more` : ""}).`;
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
