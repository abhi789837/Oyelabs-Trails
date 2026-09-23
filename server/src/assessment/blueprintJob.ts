import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  blueprintSchema,
  criticBatchSchema,
  itemBatchSchema,
  type Blueprint,
  type CriticVerdict,
  type GeneratedItem,
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
import { validateGeneratedItem, verifyCodeItem } from "./validateItem";

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
}

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

    try {
      const profile = readProfile(db, assessment.userId);
      const user = db.select().from(schema.users).where(eq(schema.users.id, assessment.userId)).get();
      const displayName = user?.displayName ?? "the learner";

      const digest = buildManifestDigest(content, profile);
      if (digest.modules.length === 0) {
        throw new Error("No curriculum modules matched this person's target tracks, so there is nothing to test.");
      }

      // ---- AI call 1: the blueprint ----
      const blueprintResult = await ai.generateJson({
        purpose: "blueprint",
        system: BLUEPRINT_SYSTEM,
        user: buildBlueprintUser(profile, digest, displayName),
        schema: blueprintSchema,
        schemaName: "blueprint",
        meta: { subjectUserId: assessment.userId, assessmentId },
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

      // ---- AI call 2: one pool per area, sequentially (the concurrency cap is 2) ----
      let codeItemsSoFar = 0;
      const dropped: { area: string; reason: string }[] = [];
      let kept = 0;

      for (const area of blueprint.areas) {
        const areaDigest = buildAreaDigest(content, area.moduleIds);
        if (areaDigest.topics.length === 0) {
          dropped.push({ area: area.name, reason: "No topics were found for this area's modules." });
          continue;
        }

        const batch = await ai.generateJson({
          purpose: "blueprint",
          system: ITEMS_SYSTEM,
          user: buildItemsUser(area, areaDigest, ITEMS_PER_LEVEL),
          schema: itemBatchSchema,
          schemaName: "items",
          meta: { subjectUserId: assessment.userId, assessmentId },
        });

        const verdicts = await critique(ai, batch.data.items, assessment.userId, assessmentId);

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
          });

          if (outcome.stored) {
            kept += 1;
            if (item.kind === "code") codeItemsSoFar += 1;
          } else {
            dropped.push({ area: area.name, reason: outcome.reason });
          }
        }

        deps.log?.(`area "${area.name}": ${kept} items kept so far`);
      }

      // ---- The written-answer items, for the whole assessment ----
      const explainBatch = await ai.generateJson({
        purpose: "blueprint",
        system: EXPLAIN_SYSTEM,
        user: buildExplainUser(blueprint.areas, [...digest.topicIds].slice(0, 120), EXPLAIN_ITEM_COUNT),
        schema: itemBatchSchema,
        schemaName: "explain_items",
        meta: { subjectUserId: assessment.userId, assessmentId },
      });

      const explainVerdicts = await critique(ai, explainBatch.data.items, assessment.userId, assessmentId);
      for (const [index, item] of explainBatch.data.items.entries()) {
        const outcome = await storeItem({
          db,
          sandbox,
          assessmentId,
          area: "Written answers",
          // The prompt asks for explain items; anything else here is a generation slip.
          item: { ...item, kind: "explain" },
          verdict: explainVerdicts.get(index) ?? null,
          knownTopicIds: digest.topicIds,
          codeBudgetLeft: 0,
        });
        if (outcome.stored) kept += 1;
        else dropped.push({ area: "Written answers", reason: outcome.reason });
      }

      if (kept < 10) {
        throw new Error(
          `Only ${kept} items survived validation, which is not enough for a meaningful assessment. ${dropped.length} were dropped; the reasons are on each item.`,
        );
      }

      db.update(schema.assessments).set({ status: "ready" }).where(eq(schema.assessments.id, assessmentId)).run();

      notifyAdmins(db, {
        kind: "assessment.ready",
        title: `Assessment ready for ${displayName}`,
        body: `${kept} items across ${blueprint.areas.length} areas. ${dropped.length} were dropped in review.`,
        link: `/admin/people/${assessment.userId}`,
      });

      deps.log?.(`assessment ${assessmentId} ready: ${kept} items kept, ${dropped.length} dropped`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
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
): Promise<Map<number, CriticVerdict>> {
  const verdicts = new Map<number, CriticVerdict>();
  if (items.length === 0) return verdicts;

  try {
    const result = await ai.generateJson({
      purpose: "item_critic",
      system: CRITIC_SYSTEM,
      user: buildCriticUser(items),
      schema: criticBatchSchema,
      schemaName: "critic",
      meta: { subjectUserId, assessmentId },
    });
    for (const verdict of result.data.verdicts) {
      if (verdict.index >= 0 && verdict.index < items.length) verdicts.set(verdict.index, verdict);
    }
  } catch {
    // Left empty: every item is then stored with criticVerdict null.
  }

  return verdicts;
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
}

/**
 * Validates one item and writes it, kept or dropped.
 *
 * Dropped items are stored too. The admin's pool preview shows what was rejected and why, which
 * is the only way to tell "the model wrote weak items" from "the critic is too strict".
 */
async function storeItem(input: StoreItemInput): Promise<{ stored: true } | { stored: false; reason: string }> {
  const { db, item, verdict } = input;

  const record = (status: "pool" | "dropped", reason: string | null, payload: unknown, key: unknown, topicIds: string[]) => {
    db.insert(schema.assessmentItems)
      .values({
        id: newId(),
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
    return { stored: false, reason: validation.reason };
  }

  if (item.kind === "code" && input.codeBudgetLeft <= 0) {
    const reason = `Over the limit of ${MAX_CODE_ITEMS} code items for one assessment.`;
    record("dropped", reason, validation.payload, validation.key, validation.topicIds);
    return { stored: false, reason };
  }

  if (item.kind === "code") {
    const verified = await verifyCodeItem(validation.payload, validation.key, input.sandbox);
    if (!verified.ok) {
      record("dropped", verified.reason, validation.payload, validation.key, validation.topicIds);
      return { stored: false, reason: verified.reason };
    }
  }

  if (verdict && verdict.verdict === "drop") {
    const reason = `The critic rejected it: ${verdict.issues.join("; ") || "no reason given"}`;
    record("dropped", reason, validation.payload, validation.key, validation.topicIds);
    return { stored: false, reason };
  }

  if (verdict && !verdict.agreesWithKey) {
    const reason = `The critic answered differently: it said "${verdict.answer.slice(0, 200)}"`;
    record("dropped", reason, validation.payload, validation.key, validation.topicIds);
    return { stored: false, reason };
  }

  record("pool", null, validation.payload, validation.key, validation.topicIds);
  return { stored: true };
}

function notifyAdmins(db: Db, message: { kind: string; title: string; body: string; link: string }): void {
  const admins = db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "superadmin")).all();
  for (const admin of admins) notify(db, { recipientId: admin.id, ...message });
}

export { now };
