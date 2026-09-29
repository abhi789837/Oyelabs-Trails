import { eq } from "drizzle-orm";

import { EMPTY_PRIORITIES, type LearnerPriorities, type ScoredGap } from "../../../../shared/builder";
import {
  LANE_KEYS,
  LANE_ORDER,
  draftMinutes,
  weeklyPlanDraftSchema,
  type WeekSource,
  type WeeklyPlanDraft,
} from "../../../../shared/weeklyPlan";
import { WEEK_PLAN_SYSTEM, buildWeekPlanUser } from "../../ai/prompts/weekPlan";
import type { AiService } from "../../ai/service";
import { getPriorities } from "../../builder/repo";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { enqueue } from "../../jobs/queue";
import { gatherLibrary, strengthsFor } from "./candidates";
import { buildWeek } from "./builder";
import { enforce } from "./enforce";
import {
  activeWeek,
  budgetFor,
  carryOverFrom,
  alertOnRepeatedSkips,
  hasWeekEnded,
  nextWeekNumber,
  pinnedKeys,
  saveWeek,
  weekDates,
} from "./repo";
import type { BuildWeekInput, CarriedItem } from "./types";

/**
 * Producing a week, end to end.
 *
 * The deterministic builder always runs. The model, when one is configured, is then given that week to
 * revise — see `server/src/ai/prompts/weekPlan.ts` for why that way round rather than asking it to
 * choose from the whole library. Either way the result goes through `enforce`, and if the revision
 * comes out worse than what went in, what went in is kept.
 *
 * Nothing in here throws on a missing model, a missing assessment or an empty gap map. A learner with
 * a plan and no assessment still gets a week, built from trail order — which is the honest answer to
 * "what should I do first" when nobody has told us anything else.
 */

export interface GenerateDeps {
  db: Db;
  content: ContentStore;
  ai: AiService;
  log?: (message: string) => void;
}

export interface GenerateOptions {
  userId: string;
  /** Skip the model. The admin's "rebuild from the rules" button, and every test that is not about AI. */
  rulesOnly?: boolean;
  /** Who pressed the button. Null when the system generated it on its own. */
  generatedBy?: string | null;
  /** Start the next week rather than reshaping the current one, carrying unfinished work forward. */
  advance?: boolean;
  nowMs?: number;
}

export interface GenerateResult {
  planId: string | null;
  weekNumber: number;
  source: WeekSource;
  /** Null on success; a plain sentence when no week could be built. */
  reason: string | null;
  adjustments: string[];
}

/** Gaps the builder should consider, read back from the gap map the course builder wrote. */
function storedGaps(db: Db, userId: string): ScoredGap[] {
  return db
    .select()
    .from(schema.skillGaps)
    .where(eq(schema.skillGaps.userId, userId))
    .all()
    .map((row) => ({
      skill: row.skill,
      severity: row.severity,
      /* Not stored on the row, and not needed here: the priority score it fed into is stored, and the
         ordering below uses that. Reported as 1 so `laneForGap` reads the weight, which is the number
         that actually decides a lane. */
      roleRelevance: 1,
      weight: row.priorityScore > 0 && row.severity > 0 ? row.priorityScore / row.severity : 0.5,
      source: row.source,
      priorityScore: row.priorityScore,
      evidence: row.evidence,
      skipped: row.skipped,
    }))
    .sort((a, b) => {
      const rank = (source: string) => (source === "ai_detected" ? 1 : 0);
      return rank(a.source) - rank(b.source) || b.priorityScore - a.priorityScore || a.skill.localeCompare(b.skill);
    });
}

/**
 * Gaps invented from the admin's must-have list alone.
 *
 * For a learner onboarded with priorities but no assessment yet. Without this their week would be
 * pure trail order and the admin's "DevOps is High" would have no effect until the test came back.
 */
function gapsFromPrioritiesOnly(priorities: LearnerPriorities): ScoredGap[] {
  const WEIGHTS = { high: 1, medium: 0.6, low: 0.3 } as const;
  return priorities.mustHave
    .filter((entry) => entry.skill.trim().length > 1)
    .map((entry) => ({
      skill: entry.skill,
      severity: 0.5,
      roleRelevance: 1,
      weight: WEIGHTS[entry.weight],
      source: "admin_priority" as const,
      priorityScore: 0.5 * WEIGHTS[entry.weight],
      evidence: {
        summary: `Your administrator marked ${entry.skill} as a ${entry.weight} priority.`,
        itemIds: [],
        missed: 0,
        asked: 0,
      },
      skipped: false,
    }));
}

export async function generateWeek(deps: GenerateDeps, options: GenerateOptions): Promise<GenerateResult> {
  const { db, content } = deps;
  const { userId } = options;
  const nowMs = options.nowMs ?? Date.now();

  const { candidates } = gatherLibrary({ db, content, userId });
  const open = candidates.filter((candidate) => !candidate.done);
  if (open.length === 0) {
    return {
      planId: null,
      weekNumber: 0,
      source: "rules",
      reason:
        candidates.length === 0
          ? "Nothing is unlocked yet. Your administrator will assign a plan or issue a placement assessment."
          : "You have finished everything in your library. Ask your administrator for more.",
      adjustments: [],
    };
  }

  const priorities = { ...EMPTY_PRIORITIES, ...getPriorities(db, userId) };
  const { minutes: budgetMinutes, startsMonday } = budgetFor(db, userId);

  const current = activeWeek(db, userId);
  const rolling = options.advance === true || (current !== null && hasWeekEnded(current, nowMs));

  /* Reshaping the current week keeps its number and dates: an admin who moves two items on Wednesday
     has not started a new week. Advancing takes the next number, new dates, and the unfinished work. */
  const carryOver: CarriedItem[] = current && rolling ? carryOverFrom(db, userId, current) : [];
  const weekNumber = current && !rolling ? current.weekNumber : nextWeekNumber(db, userId);
  const dates =
    current && !rolling ? { startDate: current.startDate, endDate: current.endDate } : weekDates(nowMs, startsMonday);

  const stored = storedGaps(db, userId);
  const gaps = stored.length > 0 ? stored : gapsFromPrioritiesOnly(priorities);

  const input: BuildWeekInput = {
    weekNumber,
    startDate: dates.startDate,
    endDate: dates.endDate,
    budgetMinutes,
    priorities,
    gaps,
    candidates,
    carryOver,
    pinned: current && !rolling ? pinnedKeys(db, current.id) : [],
    strengths: strengthsFor(db, userId),
  };

  const built = buildWeek(input);
  const protectedKeys = [...carryOver.map((item) => item.key), ...input.pinned];
  const base = enforce({ draft: built, candidates, priorities, protectedKeys });

  let chosen = base;
  let source: WeekSource = options.generatedBy ? "admin" : "rules";

  if (options.rulesOnly !== true && deps.ai.isConfigured()) {
    const revised = await revise(deps, userId, input, base.draft, candidates, protectedKeys);
    if (revised) {
      chosen = revised;
      source = "ai";
    }
  }

  if (carryOver.length > 0) alertOnRepeatedSkips(db, userId, carryOver, content);

  const row = saveWeek(db, {
    userId,
    draft: chosen.draft,
    source,
    generatedBy: options.generatedBy ?? null,
    carryOver,
    pinned: input.pinned,
    supersede: current,
  });

  for (const adjustment of chosen.adjustments) deps.log?.(`week ${weekNumber}: ${adjustment}`);

  return { planId: row.id, weekNumber, source, reason: null, adjustments: chosen.adjustments };
}

/**
 * Asks the model to improve the week, and keeps its answer only if it is actually better.
 *
 * "Better" is defined narrowly and mechanically, because a revision is worth having only when it is
 * a revision: it must keep the blocking lanes populated, must not lose more than a quarter of the
 * week, and must not drop carried-over work. Anything else and the built week is used instead. The
 * model's prose is still taken in that case — the summary and the narrative are the parts it is
 * genuinely better at, and they do not depend on its lane choices being right.
 */
async function revise(
  deps: GenerateDeps,
  userId: string,
  input: BuildWeekInput,
  built: WeeklyPlanDraft,
  candidates: BuildWeekInput["candidates"],
  protectedKeys: readonly string[],
): Promise<{ draft: WeeklyPlanDraft; adjustments: string[] } | null> {
  try {
    const result = await deps.ai.generateJson({
      purpose: "week_plan",
      system: WEEK_PLAN_SYSTEM,
      user: buildWeekPlanUser({
        targetRole: input.priorities.targetRole,
        mustHave: input.priorities.mustHave,
        skip: input.priorities.skip,
        hoursPerWeek: Math.round(input.budgetMinutes / 60),
        daysPerWeek: input.priorities.daysPerWeek,
        strengths: input.strengths,
        gaps: input.gaps
          .filter((gap) => !gap.skipped)
          .slice(0, 12)
          .map((gap) => ({
            skill: gap.skill,
            severity: gap.severity,
            source: gap.source,
            evidence: gap.evidence.summary,
          })),
        candidates: candidates
          .filter((candidate) => !candidate.done)
          .slice(0, 80)
          .map((candidate) => ({
            key: candidate.key,
            kind: candidate.topicId ? ("topic" as const) : ("lesson" as const),
            title: candidate.title,
            context: candidate.context,
            minutes: candidate.minutes,
            level: candidate.level ?? "course",
          })),
        built,
        carried: input.carryOver.map((item) => item.key),
      }),
      schema: weeklyPlanDraftSchema,
      schemaName: "week_plan",
      meta: { subjectUserId: userId },
      maxOutputTokens: 8000,
      /* Well under the 120-second default. This call only reorders lanes and writes two short
         pieces of prose; a model that has not managed that in 45 seconds is not going to, and the
         built week is already a good answer waiting to be used. */
      timeoutMs: 45_000,
    });

    /* The week's identity is ours, not the model's. It was told the numbers and dates; if it returns
       different ones that is drift, and quietly accepting them would move a learner's week. */
    const candidateDraft: WeeklyPlanDraft = {
      ...result.data,
      weekNumber: built.weekNumber,
      startDate: built.startDate,
      endDate: built.endDate,
      weeklyBudgetMinutes: built.weeklyBudgetMinutes,
    };

    const revised = enforce({
      draft: candidateDraft,
      candidates,
      priorities: input.priorities,
      protectedKeys,
    });

    if (!goodEnough(revised.draft, built, protectedKeys)) {
      deps.log?.("week plan: the model's revision was weaker than the built week, so the built one was kept");
      /* Its prose is still the better prose. Lane choices and sentences fail independently. */
      return {
        draft: { ...built, summary: revised.draft.summary, roadmapNarrative: revised.draft.roadmapNarrative, nextWeekPreview: revised.draft.nextWeekPreview.length ? revised.draft.nextWeekPreview : built.nextWeekPreview },
        adjustments: [...revised.adjustments, "kept the rules-built lanes"],
      };
    }

    return revised;
  } catch (error) {
    /* A week is not worth failing over. The learner gets the built one and the admin sees the line in
       the log — an unconfigured or rate-limited provider must not leave somebody without a plan. */
    deps.log?.(`week plan: the model call failed (${error instanceof Error ? error.message : String(error)}); using the built week`);
    return null;
  }
}

/** The bar a revision has to clear to be used. */
function goodEnough(revised: WeeklyPlanDraft, built: WeeklyPlanDraft, protectedKeys: readonly string[]): boolean {
  const count = (draft: WeeklyPlanDraft) => LANE_ORDER.reduce((sum, lane) => sum + draft.lanes[LANE_KEYS[lane]].length, 0);
  if (count(revised) === 0) return false;
  if (count(revised) < Math.ceil(count(built) * 0.75)) return false;
  if (draftMinutes(revised.lanes) === 0) return false;

  const blocking = revised.lanes.doNow.length + revised.lanes.mustKnow.length;
  const builtBlocking = built.lanes.doNow.length + built.lanes.mustKnow.length;
  if (builtBlocking > 0 && blocking === 0) return false;

  const kept = new Set(
    LANE_ORDER.flatMap((lane) => revised.lanes[LANE_KEYS[lane]].map((item) => item.topicId ?? item.lessonId ?? "")),
  );
  return protectedKeys.every((key) => kept.has(key));
}

/**
 * The week the learner has, generating one if they need it.
 *
 * Lazily, on read, rather than by a scheduled job. There is no cron in this deployment and adding one
 * for this would mean a learner's Monday depended on a worker having woken up; generating on the
 * first visit of the week means it is always there when they look, and never generated for somebody
 * who is not looking. A week that has run out of days rolls over here, which is also how the existing
 * 204-lesson plans become weekly ones without a migration script.
 */
export async function ensureWeek(deps: GenerateDeps, userId: string, nowMs = Date.now()): Promise<GenerateResult | null> {
  const current = activeWeek(deps.db, userId);
  if (current && !hasWeekEnded(current, nowMs)) return null;

  /* **Rules only, always.** This runs inside `GET /api/me/week`, and a provider call inside a
     request is a page that never loads: a 120-second timeout, a retry policy and a concurrency
     semaphore of two meant the learner sat on the skeleton for minutes and usually for ever. The
     deterministic build is milliseconds and is always correct.

     The model's pass is queued instead, and improves the week in place a moment later. Somebody who
     never comes back still had a working week; somebody who reloads gets the better one. */
  const result = await generateWeek(deps, { userId, nowMs, advance: current !== null, rulesOnly: true });

  if (result.planId && deps.ai.isConfigured()) {
    enqueue(deps.db, { type: "week.refine", payload: { userId, planId: result.planId } });
  }

  return result;
}
