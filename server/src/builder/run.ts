import { and, eq, inArray } from "drizzle-orm";

import {
  MATCH_CONFIDENCE_THRESHOLD,
  courseMatchSchema,
  gapAnalysisSchema,
  type DetectedGap,
  type ScoredGap,
} from "../../../shared/builder";
import type { EvaluationResult } from "../../../shared/assessment";
import {
  GAP_SYSTEM,
  MATCH_SYSTEM,
  PROMPT_VERSION,
  buildGapUser,
  buildMatchUser,
} from "../ai/prompts/courseBuilder";
import type { AiService } from "../ai/service";
import { schema, type Db } from "../db";
import type { Env } from "../env";
import { staffIds, notify } from "../lib/notify";
import { buildCourse, type BuildDeps } from "./pipeline";
import {
  addPathItem,
  auditStep,
  getPriorities,
  makeCurrent,
  persistCourse,
  replaceGaps,
  setPathStatus,
  startPath,
} from "./repo";
import { planParts } from "./parts";
import { assertSpine, buildSpine, type PriorityPath, type StartLevel } from "./priorityPath";
import { normaliseSkill, scoreGaps } from "./scoring";
import { getFocus } from "../targets/repo";
import { LEARNER_TRACK_LABELS } from "../../../shared/targets";
import { researchClients } from "./settings";

/**
 * One run of the builder: read the assessment, decide what is missing, and fill the gaps.
 *
 * The order of the three outcomes per gap is deliberate and is the whole economy of the feature:
 *
 *   1. **unlock** an existing catalogue course — free, instant, and already reviewed by a person;
 *   2. **reuse** a course generated earlier for somebody else — free, instant, already reviewed;
 *   3. **generate** — minutes of work and real money.
 *
 * Generating something the catalogue already teaches is the expensive mistake, which is why
 * matching runs first and why its threshold is deliberately high: a wrong match sends a learner to
 * a course that does not cover what they are missing, and nobody finds out.
 */

export interface RunDeps {
  db: Db;
  env: Env;
  ai: AiService;
  /** Overridable so the tests can drive a run without a network. */
  research?: BuildDeps["research"];
  onProgress?: (note: string) => void;
}

export interface RunOutcome {
  pathId: string;
  unlocked: number;
  reused: number;
  generated: number;
  failed: number;
  status: "ready" | "failed" | "budget_reached";
  reason?: string;
  /**
   * Why some targets could not be given a generated course, on a run that otherwise succeeded.
   *
   * A missing research provider is not a failed run: every catalog course that matched is still
   * matched and still assigned, and the learner still has something to do. It is a thing the admin
   * needs to know, which is a different statement and now has a different field.
   */
  researchReason?: string;
  /** Targets left without a course because generation was unavailable. */
  waitingForResearch?: number;
}

const DEFAULT_FETCH: BuildDeps["research"] = {
  fetchUrl: async (url) => {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": "Oyelearn course builder (link check)" },
    });
    return { status: response.status, headers: response.headers, text: () => response.text() };
  },
};


/**
 * One thing to build, in the order it will be built.
 *
 * A target and its groundwork flatten into this so the loop below stays one loop — the alternative
 * is a nested walk that has to remember which target it is under, and gets it wrong the first time
 * a prerequisite fails to generate.
 */
interface PlannedItem {
  gap: ScoredGap;
  partNumber: number;
  partType: "track" | "ai_dev" | "general";
  startLevel: StartLevel;
  /** The target this belongs to. Null for the fixed parts and for a standalone gap. */
  targetSkill: string | null;
}

/**
 * Flattens the spine: each target, then the refreshers it depends on.
 *
 * Groundwork comes *after* its target in build order rather than before, deliberately. Build order
 * is not study order — the weekly plan decides that, and it puts refreshers in "Must know" above the
 * target. What matters here is that a target never fails to be built because a refresher ahead of it
 * used up the budget.
 */
function spineToItems(spine: PriorityPath): PlannedItem[] {
  const items: PlannedItem[] = [];
  let partNumber = 1;

  for (const plan of spine.targets) {
    items.push({
      gap: targetAsGap(plan),
      partNumber: partNumber++,
      partType: "general",
      startLevel: plan.startLevel,
      targetSkill: plan.target.skill,
    });
    for (const prerequisite of plan.prerequisites) {
      items.push({
        gap: prerequisite,
        partNumber: partNumber++,
        partType: "track",
        startLevel: "beginner",
        targetSkill: plan.target.skill,
      });
    }
  }

  return items;
}

/**
 * A target, as the thing the course builder already knows how to build from.
 *
 * The builder takes a `ScoredGap`, and a target is not one — it is a decision rather than a finding.
 * Where the assessment matched it, its evidence is reused so the learner reads what actually
 * happened; where it did not, the sentence says so plainly rather than inventing a result.
 */
function targetAsGap(plan: PriorityPath["targets"][number]): ScoredGap {
  if (plan.evidence) return { ...plan.evidence, skill: plan.target.skill };

  return {
    skill: plan.target.skill,
    severity: 0.5,
    roleRelevance: 1,
    weight: 1,
    source: "admin_priority",
    priorityScore: 1,
    evidence: {
      summary: `Your administrator set ${plan.target.skill} as a ${plan.priority} priority. The assessment did not cover it, so this starts at the beginning.`,
      itemIds: [],
      missed: 0,
      asked: 0,
    },
    skipped: false,
  };
}

/** At most 20 words. The full story lives behind the Evidence expander on the path tab. */
function shortReason(item: PlannedItem, gap: ScoredGap): string {
  const head = item.targetSkill && item.targetSkill !== gap.skill ? `Needed for ${item.targetSkill}. ` : "";
  const words = `${head}${gap.evidence.summary}`.split(/\s+/);
  return words.length <= 20 ? words.join(" ") : `${words.slice(0, 20).join(" ")}…`;
}

export async function runBuilder(
  input: { userId: string; assessmentId: string | null; evaluation: EvaluationResult | null; adminNotes: string },
  deps: RunDeps,
): Promise<RunOutcome> {
  const { db } = deps;
  const stored = getPriorities(db, input.userId);
  const focus = getFocus(db, input.userId);

  /**
   * One list of targets, everywhere downstream.
   *
   * `learner_targets` is the source; `priorities.mustHave` is the column it replaced. Overlaying it
   * here rather than changing four signatures means `scoreGaps`, `reasonFor` and the gap map all
   * read the admin's real list — which is the same stale-field bug as the path itself had, one level
   * down: the gap map was still listing must-haves nobody had edited since the new screen shipped.
   *
   * `mustHave` keeps the shape those functions expect, so nothing else has to know.
   */
  const priorities = {
    ...stored,
    mustHave: focus.targets.map((target) => ({ skill: target.skill, weight: target.priority })),
    /* Derived from the track and the stack rather than typed separately. `targetRole` was a third
       free-text field saying roughly what those two already say, and three fields that mean the same
       thing drift apart the first time somebody edits one of them. A stored value still wins, for
       accounts set up before the track existed. */
    targetRole:
      stored.targetRole.trim() ||
      [focus.track ? LEARNER_TRACK_LABELS[focus.track] : "", focus.stack ?? ""].filter(Boolean).join(" · "),
  };

  const pathId = startPath(db, input.userId, input.assessmentId);
  const progress = (note: string) => {
    setPathStatus(db, pathId, { progressNote: note });
    deps.onProgress?.(note);
  };

  // --- gaps ----------------------------------------------------------------
  progress("Analysing skill gaps");
  let detected: DetectedGap[] = [];
  if (input.evaluation) {
    try {
      const result = await deps.ai.generateJson({
        purpose: "gap_analysis",
        system: GAP_SYSTEM,
        user: buildGapUser({
          targetRole: priorities.targetRole,
          adminNotes: input.adminNotes,
          mustHave: priorities.mustHave,
          overallLevel: input.evaluation.overallLevel,
          areas: input.evaluation.areas.map((area) => ({
            area: area.area,
            level: area.level,
            gaps: area.gaps,
            strengths: area.strengths,
          })),
          items: itemsFor(db, input.assessmentId),
        }),
        schema: gapAnalysisSchema,
        schemaName: "gap_analysis",
        meta: { subjectUserId: input.userId, assessmentId: input.assessmentId ?? undefined },
      });
      detected = result.data.gaps;
      auditStep(db, {
        pathId,
        step: "gap_analysis",
        promptVersion: PROMPT_VERSION,
        model: result.model,
        detail: { found: detected.length },
        inputTokens: result.usage.input,
        outputTokens: result.usage.output,
      });
    } catch (error) {
      /* A failed analysis is not a failed run. The admin's must-have list is a gap map on its own,
         and a path built from it alone is worse than one built from both but far better than none. */
      auditStep(db, { pathId, step: "gap_analysis", detail: { error: messageOf(error) } });
    }
  }

  const scored = scoreGaps(detected, priorities);
  const gapIds = replaceGaps(db, input.userId, input.assessmentId, scored);

  /* The admin's targets are the spine.

     This used to read `priorities.mustHave` — the old JSON column — while the admin screen wrote
     `learner_targets`. So every target set through that screen was invisible here and the path was
     built from whatever the model had noticed instead. That is the bug: a learner with two High
     targets got seven AI-found gaps and neither target.

     Now the targets come first, in the admin's order, and detected gaps are demoted to two jobs:
     deciding where a target starts, and being offered at the bottom as optional extras. See
     `priorityPath.ts`. */
  const spine = buildSpine({
    targets: focus.targets,
    gaps: scored,
    skip: priorities.skip,
    stack: focus.stack ?? undefined,
    areaLevels: input.evaluation?.areas.map((area) => ({ area: area.area, level: area.level })) ?? [],
  });

  /* Checked after the fact rather than trusted, and the result is stored where the admin can see
     it. A guarantee nobody verifies is a comment. */
  const spineProblems = assertSpine(spine, {
    targets: focus.targets,
    gaps: scored,
    skip: priorities.skip,
    stack: focus.stack ?? undefined,
  });
  if (spineProblems.length > 0) {
    auditStep(db, { pathId, step: "spine", detail: { problems: spineProblems } });
  }

  /* Targets first, each with its groundwork underneath, then the two fixed foundation parts for a
     learner who has no targets at all — which is the only case `planParts` still answers. */
  const todo: PlannedItem[] =
    spine.targets.length > 0
      ? spineToItems(spine)
      : planParts({
          track: focus.track,
          stack: focus.stack,
          gaps: scored,
          priorities,
          evaluation: input.evaluation,
          courseCap: priorities.courseCap,
        }).map((part) => ({
          gap: part.gap,
          partNumber: part.partNumber,
          partType: part.type,
          startLevel: "beginner" as const,
          targetSkill: null,
        }));

  if (todo.length === 0) {
    makeCurrent(db, input.userId, pathId);
    return { pathId, unlocked: 0, reused: 0, generated: 0, failed: 0, status: "ready" };
  }

  // --- fill each gap -------------------------------------------------------
  const clients = researchClients(db, deps.env);
  const settings = db.select().from(schema.researchSettings).get();
  const outcome: RunOutcome = { pathId, unlocked: 0, reused: 0, generated: 0, failed: 0, status: "ready" };
  let position = 0;

  for (const part of todo) {
    const gap = part.gap;
    const gapId = gapIds.get(gap.skill) ?? null;
    /* Short. The admin reads a list of targets, not a list of essays — the full evidence sits behind
       an expander on the path tab, and a paragraph here just pushes the next target off the screen. */
    const reason = shortReason(part, gap);

    setPathStatus(db, pathId, { status: "researching" });
    progress(`Looking for a course on ${gap.skill}`);

    const existing = await matchExisting(db, deps.ai, gap, input.userId, pathId);
    if (existing) {
      addPathItem(db, {
        pathId,
        courseId: existing.courseId,
        gapId,
        position: position++,
        source: existing.source,
        reason,
        partNumber: part.partNumber,
        partType: part.partType,
        targetSkill: part.targetSkill,
        startLevel: part.startLevel,
      });
      if (existing.source === "unlock") outcome.unlocked += 1;
      else outcome.reused += 1;
      // An unlocked course has to actually reach them, or "unlocked" is a word with no effect.
      assign(db, existing.courseId, input.userId);
      continue;
    }

    if (!clients.ok) {
      /* Not a failure of this target — a fact about the deployment. Counted separately so the run
         can finish `ready` with every catalog match assigned and one honest line about what is
         still waiting, rather than reporting a broken path when most of it works. */
      auditStep(db, { pathId, step: "generate", detail: { skill: gap.skill, skipped: clients.reason } });
      outcome.waitingForResearch = (outcome.waitingForResearch ?? 0) + 1;
      outcome.researchReason = clients.reason;
      continue;
    }

    setPathStatus(db, pathId, { status: "writing" });
    const built = await buildCourse(
      gap,
      { targetRole: priorities.targetRole, level: input.evaluation?.overallLevel ?? 2 },
      {
        ai: deps.ai,
        meta: { subjectUserId: input.userId, assessmentId: input.assessmentId ?? undefined },
        search: clients.search,
        video: clients.video,
        research: deps.research ?? DEFAULT_FETCH,
        budget: { tokens: settings?.budgetTokens ?? 400_000, searches: settings?.budgetSearches ?? 60 },
        onProgress: progress,
        onStep: (step, detail, usage) =>
          auditStep(db, {
            pathId,
            step,
            promptVersion: PROMPT_VERSION,
            detail,
            inputTokens: usage.input,
            outputTokens: usage.output,
          }),
      },
    );

    if (!built.ok) {
      outcome.failed += 1;
      auditStep(db, { pathId, step: "generate", detail: { skill: gap.skill, failed: built.kind, reason: built.reason } });
      if (built.kind === "budget") {
        setPathStatus(db, pathId, { status: "budget_reached", failureReason: built.reason });
        outcome.status = "budget_reached";
        outcome.reason = built.reason;
        break;
      }
      continue;
    }

    setPathStatus(db, pathId, {
      status: "reviewing",
      tokensUsed: built.course.tokensUsed,
      searchCalls: built.course.searchesUsed,
    });

    const stored = persistCourse(db, {
      built: built.course,
      skill: gap.skill,
      userId: input.userId,
      autoPublish: priorities.autoPublish,
    });
    addPathItem(db, {
      pathId,
      courseId: stored.courseId,
      gapId,
      position: position++,
      source: "generated",
      reason,
      partNumber: part.partNumber,
      partType: part.partType,
      targetSkill: part.targetSkill,
      startLevel: part.startLevel,
    });
    outcome.generated += 1;

    auditStep(db, {
      pathId,
      courseId: stored.courseId,
      step: "generate",
      promptVersion: built.course.promptVersion,
      detail: { skill: gap.skill, score: built.course.score, status: stored.status },
    });

    if (stored.status !== "published") notifyStaff(db, input.userId, built.course.plan.title, stored.status);
  }

  if (outcome.waitingForResearch) {
    setPathStatus(db, pathId, {
      notice: `${outcome.waitingForResearch} target${outcome.waitingForResearch === 1 ? "" : "s"} still need a generated course. ${outcome.researchReason}`,
    });
  }

  if (outcome.status === "ready") makeCurrent(db, input.userId, pathId);
  return outcome;
}

/**
 * Looks for a course that already teaches this skill: the catalogue first, then anything generated
 * earlier that is still published.
 *
 * Both searches go through the same model call, with the candidates prefiltered lexically so the
 * prompt is not handed every course on the deployment. The prefilter is generous on purpose — it is
 * there to keep the prompt small, not to make the decision.
 */
async function matchExisting(
  db: Db,
  ai: AiService,
  gap: ScoredGap,
  userId: string,
  pathId: string,
): Promise<{ courseId: string; source: "unlock" | "reuse" } | null> {
  const candidates = db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.published, true))
    .all();
  if (candidates.length === 0) return null;

  const words = normaliseSkill(gap.skill).split(" ").filter((word) => word.length > 3);
  const withTopics = candidates.map((course) => ({
    id: course.id,
    origin: course.origin,
    title: course.title,
    summary: course.summary,
    topics: db
      .select({ title: schema.courseTopics.title })
      .from(schema.courseTopics)
      .where(eq(schema.courseTopics.courseId, course.id))
      .all()
      .map((topic) => topic.title),
  }));

  const shortlist = withTopics
    .filter((course) => {
      const haystack = normaliseSkill(`${course.title} ${course.summary} ${course.topics.join(" ")}`);
      return words.length === 0 || words.some((word) => haystack.includes(word));
    })
    .slice(0, 12);
  if (shortlist.length === 0) return null;

  try {
    const result = await ai.generateJson({
      purpose: "course_match",
      system: MATCH_SYSTEM,
      user: buildMatchUser(gap.skill, shortlist),
      schema: courseMatchSchema,
      schemaName: "course_match",
      meta: { subjectUserId: userId },
    });
    auditStep(db, {
      pathId,
      step: "match",
      promptVersion: PROMPT_VERSION,
      model: result.model,
      detail: { skill: gap.skill, candidates: shortlist.length, confidence: result.data.confidence },
      inputTokens: result.usage.input,
      outputTokens: result.usage.output,
    });

    if (!result.data.courseId || result.data.confidence < MATCH_CONFIDENCE_THRESHOLD) return null;
    const chosen = shortlist.find((course) => course.id === result.data.courseId);
    // A model naming a course that was not on the list is not a match, it is a mistake.
    if (!chosen) return null;

    return { courseId: chosen.id, source: chosen.origin === "generated" ? "reuse" : "unlock" };
  } catch {
    // No match rather than no run: an unmatched gap becomes a generated course, which is slower and
    // more expensive but never wrong in a way the learner would notice.
    return null;
  }
}

/** Makes sure an `assigned` course actually reaches this learner. Harmless for an open one. */
function assign(db: Db, courseId: string, userId: string): void {
  const course = db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).get();
  if (!course || course.audience === "everyone") return;
  db.insert(schema.courseAssignments)
    .values({ courseId, userId, assignedBy: null, assignedAt: Date.now() })
    .onConflictDoNothing()
    .run();
}

function notifyStaff(db: Db, userId: string, title: string, status: string): void {
  const learner = db
    .select({ displayName: schema.users.displayName })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();
  for (const recipientId of staffIds(db)) {
    notify(db, {
      recipientId,
      kind: `course.${status}`,
      title: status === "needs_review" ? `"${title}" needs a look` : `"${title}" is waiting for review`,
      body:
        status === "needs_review"
          ? `A generated course for ${learner?.displayName ?? "a learner"} did not pass its own review. It is not published.`
          : `A course was generated for ${learner?.displayName ?? "a learner"} and is waiting to be published.`,
      link: "/admin/courses",
    });
  }
}

/** The per-item facts the gap prompt reads: area, difficulty, right or wrong, and how long it took. */
function itemsFor(db: Db, assessmentId: string | null) {
  if (!assessmentId) return [];
  const rows = db
    .select()
    .from(schema.assessmentItems)
    .where(
      and(
        eq(schema.assessmentItems.assessmentId, assessmentId),
        inArray(schema.assessmentItems.status, ["answered", "skipped"]),
      ),
    )
    .all();

  return rows.map((row) => ({
    id: row.id,
    area: row.area,
    difficulty: row.difficulty,
    correct: row.autoScore === null && row.aiScore === null ? null : (row.autoScore ?? row.aiScore ?? 0) >= 50,
    timeMs: row.timeMs,
  }));
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}
