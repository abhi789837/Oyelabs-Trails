import {
  MAX_TOPIC_RETRIES,
  coursePlanSchema,
  reviewPasses,
  reviewSchema,
  reviewScore,
  writtenTopicSchema,
  type CoursePlan,
  type CourseReview,
  type ScoredGap,
  type WrittenTopic,
} from "../../../shared/builder";
import {
  PROMPT_VERSION,
  PLAN_SYSTEM,
  REVIEW_SYSTEM,
  WRITE_SYSTEM,
  buildPlanUser,
  buildReviewUser,
  buildWriteUser,
} from "../ai/prompts/courseBuilder";
import type { AiService } from "../ai/service";
import { citationsSufficient, enforceCitations } from "./citations";
import type { SearchClient, VideoClient } from "./providers";
import { pickVideo, verifyLinks, type ResearchDeps, type SearchHit, type VerifiedSource } from "./research";

/**
 * Building one course: plan, search, verify, write, review.
 *
 * Deliberately free of the database and of the job queue. It takes clients and a budget, and it
 * returns a finished course or a reason it could not make one. That keeps the expensive, slow,
 * network-bound part testable with fakes — the cPanel end-to-end test drives this module directly —
 * and keeps the job handler down to "call this, store what comes back".
 */

export interface BuildBudget {
  tokens: number;
  searches: number;
}

export interface BuildProgress {
  (note: string): void;
}

export interface BuiltTopic {
  title: string;
  objective: string;
  estMinutes: number;
  written: WrittenTopic;
  sources: VerifiedSource[];
  videoTitle: string | null;
}

export interface BuiltCourse {
  plan: CoursePlan;
  sections: { title: string; summary: string; topics: BuiltTopic[] }[];
  review: CourseReview;
  score: number;
  passed: boolean;
  promptVersion: string;
  tokensUsed: number;
  searchesUsed: number;
}

export type BuildOutcome =
  | { ok: true; course: BuiltCourse }
  | { ok: false; reason: string; kind: "budget" | "research" | "model" };

export interface BuildDeps {
  ai: AiService;
  /**
   * Who this run is for. Every call carries it, so `ai_calls` can answer "what did building
   * Priya's cPanel course cost?" — which is the only per-learner view of spend there is, since a
   * shared credential cannot be attributed by the provider.
   */
  meta: { subjectUserId?: string; assessmentId?: string; courseId?: string };
  search: SearchClient;
  video: VideoClient;
  research: ResearchDeps;
  budget: BuildBudget;
  onProgress?: BuildProgress;
  /** Audit hook. Called per step with counts and scores — never with a prompt or an answer. */
  onStep?: (step: string, detail: Record<string, unknown>, tokens: { input: number; output: number }) => void;
}

/** Tracks spend and refuses to start work that would cross the line. */
class Budget {
  tokens = 0;
  searches = 0;
  constructor(private readonly limits: BuildBudget) {}

  spendTokens(input: number, output: number): void {
    this.tokens += input + output;
  }

  spendSearch(): void {
    this.searches += 1;
  }

  /* Checked *before* each step rather than after, so a run stops short of the limit instead of
     discovering it has already crossed it. A limit you only notice having passed is not a limit. */
  exceeded(): boolean {
    return this.tokens >= this.limits.tokens || this.searches >= this.limits.searches;
  }
}

export async function buildCourse(gap: ScoredGap, context: { targetRole: string; level: number }, deps: BuildDeps): Promise<BuildOutcome> {
  const budget = new Budget(deps.budget);
  const progress = deps.onProgress ?? (() => {});

  // --- 1. plan -------------------------------------------------------------
  progress(`Planning a course on ${gap.skill}`);
  let plan: CoursePlan;
  try {
    const result = await deps.ai.generateJson({
      purpose: "course_plan",
      system: PLAN_SYSTEM,
      user: buildPlanUser({
        skill: gap.skill,
        targetRole: context.targetRole,
        evidence: gap.evidence.summary,
        level: context.level,
      }),
      schema: coursePlanSchema,
      schemaName: "course_plan",
      meta: deps.meta,
    });
    plan = result.data;
    budget.spendTokens(result.usage.input, result.usage.output);
    deps.onStep?.("plan", { skill: gap.skill, sections: plan.sections.length }, result.usage);
  } catch (error) {
    return { ok: false, kind: "model", reason: `Could not plan the course: ${messageOf(error)}` };
  }

  // --- 2..4. research and write, lesson by lesson ---------------------------
  const sections: BuiltCourse["sections"] = [];
  const totalTopics = plan.sections.reduce((sum, section) => sum + section.topics.length, 0);
  let done = 0;

  for (const [sectionIndex, section] of plan.sections.entries()) {
    const builtTopics: BuiltTopic[] = [];

    for (const topic of section.topics) {
      if (budget.exceeded()) {
        return {
          ok: false,
          kind: "budget",
          reason: `Stopped at the budget: ${budget.tokens} tokens and ${budget.searches} searches used.`,
        };
      }

      done += 1;
      progress(`Researching lesson ${done} of ${totalTopics}: ${topic.title}`);

      const sources = await gatherSources(topic.searchQueries, deps, budget);
      /* No verified source means no lesson. Writing one anyway is exactly the invented-citation
         failure this pipeline exists to prevent, and a lesson with nothing to read is not a
         lesson. The course can still be built from the sections that did find material. */
      if (sources.length === 0) {
        deps.onStep?.("search", { topic: topic.title, verified: 0, skipped: true }, { input: 0, output: 0 });
        continue;
      }

      const video = await findVideo(topic.videoQuery, deps, budget);

      progress(`Writing lesson ${done} of ${totalTopics}: ${topic.title}`);
      const written = await writeTopic(
        { plan, section, topic, sources, video },
        deps,
        budget,
      );
      if (!written) continue;

      builtTopics.push({
        title: topic.title,
        objective: topic.objective,
        estMinutes: topic.estMinutes,
        written,
        sources,
        videoTitle: video?.title ?? null,
      });
    }

    if (builtTopics.length > 0) {
      sections.push({ title: section.title, summary: section.summary, topics: builtTopics });
    } else {
      deps.onStep?.("write", { section: section.title, index: sectionIndex, dropped: true }, { input: 0, output: 0 });
    }
  }

  if (sections.length === 0) {
    return {
      ok: false,
      kind: "research",
      reason: "No lesson could be backed by a source that actually resolved. Nothing was written.",
    };
  }

  // --- 5. review -----------------------------------------------------------
  progress("Reviewing the course");
  const reviewed = await reviewCourse(
    {
      skill: gap.skill,
      courseTitle: plan.title,
      topics: sections.flatMap((section) =>
        section.topics.map((topic) => ({
          title: topic.title,
          objective: topic.objective,
          summary: topic.written.summary,
          references: topic.written.references.map((reference) => reference.url),
          questionCount: topic.written.test.questions.length,
        })),
      ),
    },
    deps,
  );
  if (!reviewed.ok) return { ok: false, kind: "model", reason: reviewed.reason };
  const review = reviewed.review;
  budget.spendTokens(reviewed.usage.input, reviewed.usage.output);

  return {
    ok: true,
    course: {
      plan,
      sections,
      review,
      score: reviewScore(review),
      passed: reviewPasses(review),
      promptVersion: PROMPT_VERSION,
      tokensUsed: budget.tokens,
      searchesUsed: budget.searches,
    },
  };
}

/** The review step on its own, so "Fix automatically" can re-check a course it partly rewrote. */
export async function reviewCourse(
  input: {
    skill: string;
    courseTitle: string;
    topics: { title: string; objective: string; summary: string; references: string[]; questionCount: number }[];
  },
  deps: Pick<BuildDeps, "ai" | "meta" | "onStep">,
): Promise<{ ok: true; review: CourseReview; usage: { input: number; output: number } } | { ok: false; reason: string }> {
  try {
    const result = await deps.ai.generateJson({
      purpose: "course_review",
      system: REVIEW_SYSTEM,
      user: buildReviewUser(input),
      schema: reviewSchema,
      schemaName: "course_review",
      meta: deps.meta,
    });
    deps.onStep?.("review", { score: reviewScore(result.data), weak: result.data.weakTopics.length }, result.usage);
    return { ok: true, review: result.data, usage: result.usage };
  } catch (error) {
    return { ok: false, reason: `Could not review the course: ${messageOf(error)}` };
  }
}

/**
 * v4.4: researches and rewrites one lesson of an existing course ("Fix automatically" regenerates
 * only the lessons the review flagged). The same search, link check and citation rules as a new
 * course; null when no verified source could be found, so the old lesson is kept.
 */
export async function rebuildTopic(
  input: { skill: string; courseTitle: string; sectionTitle: string; topicTitle: string; objective: string; estMinutes: number },
  deps: BuildDeps,
): Promise<BuiltTopic | null> {
  const budget = new Budget(deps.budget);
  const sources = await gatherSources([`${input.skill} ${input.topicTitle}`, input.topicTitle], deps, budget);
  if (sources.length === 0) return null;
  const video = await findVideo(`${input.skill} ${input.topicTitle}`, deps, budget);
  const written = await writeTopic(
    { plan: { title: input.courseTitle }, section: { title: input.sectionTitle }, topic: { title: input.topicTitle, objective: input.objective }, sources, video },
    deps,
    budget,
  );
  if (!written) return null;
  return { title: input.topicTitle, objective: input.objective, estMinutes: input.estMinutes, written, sources, videoTitle: video?.title ?? null };
}

/** Runs the lesson's queries and keeps what resolves. Deduplicated by URL across queries. */
async function gatherSources(queries: string[], deps: BuildDeps, budget: Budget): Promise<VerifiedSource[]> {
  const seen = new Set<string>();
  const candidates: SearchHit[] = [];

  for (const query of queries) {
    if (budget.exceeded()) break;
    try {
      budget.spendSearch();
      for (const hit of await deps.search.search(query, 6)) {
        if (seen.has(hit.url)) continue;
        seen.add(hit.url);
        candidates.push(hit);
      }
    } catch {
      // One failed query is not a failed lesson; the others may still return enough.
    }
  }

  return verifyLinks(candidates, deps.research, { max: 6 });
}

async function findVideo(query: string, deps: BuildDeps, budget: Budget) {
  if (budget.exceeded()) return null;
  try {
    budget.spendSearch();
    return pickVideo(await deps.video.search(query, 8));
  } catch {
    // A quota error or a bad key costs the lesson its video, not the lesson.
    return null;
  }
}

/**
 * Writes one lesson, and rewrites it if the model cited something it was not given.
 *
 * The retry is the point. An invented citation is dropped by `enforceCitations`, and if too few
 * survive the lesson is written again against the same sources — up to `MAX_TOPIC_RETRIES`, after
 * which the lesson is skipped rather than shipped with one reference.
 */
async function writeTopic(
  input: {
    plan: Pick<CoursePlan, "title">;
    section: { title: string };
    topic: { title: string; objective: string };
    sources: VerifiedSource[];
    video: { videoId: string; title: string } | null;
  },
  deps: BuildDeps,
  budget: Budget,
): Promise<WrittenTopic | null> {
  for (let attempt = 0; attempt <= MAX_TOPIC_RETRIES; attempt += 1) {
    if (budget.exceeded()) return null;
    try {
      const result = await deps.ai.generateJson({
        purpose: "course_write",
        system: WRITE_SYSTEM,
        user: buildWriteUser({
          courseTitle: input.plan.title,
          sectionTitle: input.section.title,
          topicTitle: input.topic.title,
          objective: input.topic.objective,
          sources: input.sources,
          videoId: input.video?.videoId ?? null,
          videoTitle: input.video?.title ?? null,
        }),
        schema: writtenTopicSchema,
        schemaName: "written_topic",
        meta: deps.meta,
      });
      budget.spendTokens(result.usage.input, result.usage.output);

      const checked = enforceCitations(result.data, input.sources, input.video?.videoId ?? null);
      deps.onStep?.(
        "write",
        { topic: input.topic.title, attempt, invented: checked.invented.length, kept: checked.cleaned.references.length },
        result.usage,
      );

      if (citationsSufficient(checked.cleaned)) return checked.cleaned;
    } catch {
      // A schema mismatch or a provider error. Retried like an invented citation, because from
      // here they are the same thing: this attempt produced nothing usable.
    }
  }
  return null;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}
