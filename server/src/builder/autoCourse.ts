import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";

import {
  AUTO_PUBLISH_KEY,
  MAX_FIX_ATTEMPTS,
  NEW_COURSE_ITEM_PREFIX,
  coursesAddedMessage,
  plainReviewReason,
  reviewPasses,
  reviewScore,
  type CourseReview,
  type ScoredGap,
} from "../../../shared/builder";
import { PROMPT_VERSION } from "../ai/prompts/courseBuilder";
import type { AiService } from "../ai/service";
import { schema, type Db } from "../db";
import type { Env } from "../env";
import { newId, now } from "../lib/ids";
import { notify, staffIds } from "../lib/notify";
import { enqueue, JobWaitingSetupError, wakeWaitingJobs, type Job } from "../jobs/queue";
import { buildCourse, rebuildTopic, reviewCourse, type BuildDeps } from "./pipeline";
import type { SearchClient, VideoClient } from "./providers";
import {
  ACTIVE_JOB_STATUSES,
  auditStep,
  autoKeyOf,
  courseJobs,
  persistCourse,
  topicContent,
  writeTopicSources,
  type CourseJobPayload,
} from "./repo";
import type { ResearchDeps } from "./research";
import { normaliseSkill } from "./scoring";
import { researchClients } from "./settings";

/**
 * v4.4 Phase 5: a course nobody has written yet is made, checked and put in the shared library
 * without an admin's click.
 *
 * The path builder only *asks* for a course (`requestCourse`): it first looks for an equivalent one
 * in the library, then joins a job already making it, and only then queues `course.generate`. The
 * job writes the course with the verified research pipeline, runs the quality check, and on a pass
 * (with auto-publish on) publishes it for everyone and hands it to every learner whose path waits
 * for it. A course that fails is held for the admin ("Needs a look") with one plain reason.
 */

// ---------------------------------------------------------------------------
// Auto-publish
// ---------------------------------------------------------------------------

export function getGlobalAutoPublish(db: Db): boolean {
  const row = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, AUTO_PUBLISH_KEY)).get();
  return row ? row.value !== "false" : true;
}

export function setGlobalAutoPublish(db: Db, on: boolean): void {
  const timestamp = now();
  const value = on ? "true" : "false";
  db.insert(schema.appMeta)
    .values({ key: AUTO_PUBLISH_KEY, value, updatedAt: timestamp })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: timestamp } })
    .run();
}

/** The learner's own override ("on"/"off") when an admin set one, else the global setting. */
export function effectiveAutoPublish(db: Db, userId: string): boolean {
  const row = db
    .select({ override: schema.learnerPriorities.autoPublishOverride })
    .from(schema.learnerPriorities)
    .where(eq(schema.learnerPriorities.userId, userId))
    .get();
  if (row?.override === "on") return true;
  if (row?.override === "off") return false;
  return getGlobalAutoPublish(db);
}

// ---------------------------------------------------------------------------
// Keys, setup and the library
// ---------------------------------------------------------------------------

/** One key per thing to teach: the catalog skill, the practical case, or the skill's name. */
export function courseKey(input: { skillId?: string | null; caseId?: string | null; skill: string }): string {
  if (input.caseId) return `case:${input.caseId}`;
  if (input.skillId) return `skill:${input.skillId}`;
  return `name:${normaliseSkill(input.skill)}`;
}

export const markerFor = (key: string): string => `${NEW_COURSE_ITEM_PREFIX}${key}`;

export type ResearchClientsResult = ReturnType<typeof researchClients>;

export interface SetupDeps {
  db: Db;
  env: Env;
  ai: Pick<AiService, "isConfigured">;
  /** Overridable so tests can stand in a search and a YouTube client. */
  clients?: () => ResearchClientsResult;
}

function clientsOf(deps: SetupDeps): ResearchClientsResult {
  return deps.clients ? deps.clients() : researchClients(deps.db, deps.env);
}

/** What is missing before a course can be written, in plain words, or null when nothing is. */
export function setupProblem(deps: SetupDeps): string | null {
  if (!deps.ai.isConfigured()) return "the AI isn't connected";
  if (!clientsOf(deps).ok) return "the web search isn't connected";
  return null;
}

const STOP_WORDS = new Set(["and", "the", "for", "with", "of", "to", "in", "on", "a", "an", "your", "basics", "fundamentals", "intro", "introduction"]);

function words(text: string): Set<string> {
  return new Set(
    normaliseSkill(text)
      .replace(/[^a-z0-9.+#]+/g, " ")
      .split(" ")
      .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
      // A plain plural is the same word: "reviews" = "review".
      .map((word) => (word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word)),
  );
}

/** Word overlap (Jaccard) between two names. 1 = the same words. */
export function nameSimilarity(a: string, b: string): number {
  const left = words(a);
  const right = words(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return shared / (left.size + right.size - shared);
}

/** At or above this, two course names count as the same course (reuse, never a near-copy). */
export const SIMILAR_NAME = 0.6;

export type LibraryHit = { courseId: string; state: "published" | "held" };

/**
 * An equivalent course already in the library, or one made for the same key that is held for a
 * look. Same key or same skill name first; then a published library course whose skill or title
 * says the same thing in nearly the same words.
 */
export function libraryCourseFor(db: Db, key: string, skill: string): LibraryHit | null {
  const rows = db
    .select({
      courseId: schema.generatedCourses.courseId,
      skill: schema.generatedCourses.skill,
      status: schema.generatedCourses.status,
      scope: schema.generatedCourses.scope,
      library: schema.generatedCourses.library,
      reviewDetail: schema.generatedCourses.reviewDetail,
      published: schema.courses.published,
      title: schema.courses.title,
    })
    .from(schema.generatedCourses)
    .innerJoin(schema.courses, eq(schema.courses.id, schema.generatedCourses.courseId))
    .where(inArray(schema.generatedCourses.status, ["published", "needs_review", "pending_review"]))
    .orderBy(asc(schema.generatedCourses.createdAt))
    .all();

  const shared = rows.filter((row) => row.status === "published" && row.published && (row.library || row.scope === "global"));
  const same = (row: (typeof rows)[number]) => autoKeyOf(row.reviewDetail) === key || normaliseSkill(row.skill) === normaliseSkill(skill);

  const exact = shared.find(same);
  if (exact) return { courseId: exact.courseId, state: "published" };
  const held = rows.find((row) => row.status !== "published" && autoKeyOf(row.reviewDetail) === key);
  if (held) return { courseId: held.courseId, state: "held" };
  const similar = shared.find((row) => nameSimilarity(row.skill, skill) >= SIMILAR_NAME || nameSimilarity(row.title, skill) >= SIMILAR_NAME);
  return similar ? { courseId: similar.courseId, state: "published" } : null;
}

/** The job still making a course for this key, if any. */
function activeJobFor(db: Db, key: string) {
  return courseJobs(db, key).find((job) => (ACTIVE_JOB_STATUSES as readonly string[]).includes(job.status)) ?? null;
}

/** Makes sure a course reaches this learner. Harmless for an `everyone` course. */
export function assignCourse(db: Db, courseId: string, userId: string): void {
  db.insert(schema.courseAssignments).values({ courseId, userId, assignedBy: null, assignedAt: now() }).onConflictDoNothing().run();
}

// ---------------------------------------------------------------------------
// Asking for a course (from the path builder)
// ---------------------------------------------------------------------------

export interface CourseRequest {
  userId: string;
  skill: string;
  skillId?: string | null;
  caseId?: string | null;
  departmentId?: string | null;
  reason: string;
  targetRole: string;
  level: number;
}

export type CourseRequestResult =
  | { kind: "reuse"; courseId: string }
  | { kind: "pending"; marker: string; joined: boolean; waitingSetup: string | null };

/**
 * Library first, then a job already making it, then a new job. Never two jobs for one key: a second
 * learner needing the same skill joins the first job, and both are assigned when it finishes.
 */
export function requestCourse(deps: SetupDeps, input: CourseRequest): CourseRequestResult {
  const { db } = deps;
  const key = courseKey(input);
  const hit = libraryCourseFor(db, key, input.skill);
  if (hit?.state === "published") {
    assignCourse(db, hit.courseId, input.userId);
    return { kind: "reuse", courseId: hit.courseId };
  }
  if (hit?.state === "held") return { kind: "pending", marker: markerFor(key), joined: true, waitingSetup: null };

  const running = activeJobFor(db, key);
  if (running) {
    return { kind: "pending", marker: markerFor(key), joined: true, waitingSetup: running.status === "waiting_setup" ? running.lastError : null };
  }

  const payload: CourseJobPayload = {
    mode: "generate",
    key,
    skill: input.skill,
    skillId: input.skillId ?? null,
    caseId: input.caseId ?? null,
    userId: input.userId,
    departmentId: input.departmentId ?? null,
    reason: input.reason,
    targetRole: input.targetRole,
    level: input.level,
  };
  const jobId = enqueue(db, { type: "course.generate", payload });
  const problem = setupProblem(deps);
  if (problem) db.update(schema.jobs).set({ status: "waiting_setup", lastError: problem }).where(eq(schema.jobs.id, jobId)).run();
  return { kind: "pending", marker: markerFor(key), joined: false, waitingSetup: problem };
}

/** Saving the AI or web search settings: every course waiting for setup goes back in the queue. */
export function wakeWaitingCourses(db: Db): number {
  return wakeWaitingJobs(db, "course.generate");
}

/** The periodic check: wakes waiting courses once setup is complete (e.g. a key arrived by env). */
export function wakeIfReady(deps: SetupDeps): number {
  return setupProblem(deps) ? 0 : wakeWaitingCourses(deps.db);
}

/** How many courses wait for setup, and why (for the builder page's notice). */
export function waitingForSetup(db: Db): { count: number; problem: string | null } {
  const rows = db
    .select({ lastError: schema.jobs.lastError })
    .from(schema.jobs)
    .where(and(eq(schema.jobs.type, "course.generate"), eq(schema.jobs.status, "waiting_setup")))
    .all();
  return { count: rows.length, problem: rows[0]?.lastError ?? null };
}

// ---------------------------------------------------------------------------
// Publishing to the library
// ---------------------------------------------------------------------------

/**
 * Publishes a generated course to the shared library: visible to everyone, tagged with the skill
 * and department it was made for, and given to every learner whose path was waiting for it.
 */
export function publishToLibrary(db: Db, courseId: string, options: { approvedBy?: string | null } = {}): void {
  const row = db.select().from(schema.generatedCourses).where(eq(schema.generatedCourses.courseId, courseId)).get();
  if (!row) return;
  db.update(schema.courses)
    .set({ published: true, audience: "everyone", departmentId: null, updatedAt: now() })
    .where(eq(schema.courses.id, courseId))
    .run();
  db.update(schema.generatedCourses)
    .set({
      status: "published",
      library: true,
      scope: "global",
      reviewReason: null,
      ...(options.approvedBy ? { approvedBy: options.approvedBy, approvedAt: now() } : {}),
    })
    .where(eq(schema.generatedCourses.courseId, courseId))
    .run();
  const key = autoKeyOf(row.reviewDetail);
  if (key) announce(db, resolveWaiting(db, key, courseId, "generated"));
}

/** Points every path item waiting on this key at the course, and assigns it. Returns the paths. */
function resolveWaiting(db: Db, key: string, courseId: string, source: "generated" | "reuse"): string[] {
  const waiting = db
    .select({ id: schema.pathItems.id, pathId: schema.pathItems.pathId, userId: schema.learningPaths.userId })
    .from(schema.pathItems)
    .innerJoin(schema.learningPaths, eq(schema.learningPaths.id, schema.pathItems.pathId))
    .where(eq(schema.pathItems.moduleId, markerFor(key)))
    .all();
  for (const item of waiting) {
    db.update(schema.pathItems).set({ courseId, moduleId: null, source }).where(eq(schema.pathItems.id, item.id)).run();
    assignCourse(db, courseId, item.userId);
  }
  return [...new Set(waiting.map((item) => item.pathId))];
}

/**
 * One notice per learner per path build: once no course for that path is still being made, the
 * staff hear which new courses reached the library for them. Each course is announced once.
 */
function announce(db: Db, pathIds: readonly string[]): void {
  for (const pathId of pathIds) {
    const path = db.select().from(schema.learningPaths).where(eq(schema.learningPaths.id, pathId)).get();
    if (!path) continue;
    const items = db.select().from(schema.pathItems).where(eq(schema.pathItems.pathId, pathId)).all();
    const stillMaking = items.some(
      (item) => item.moduleId?.startsWith(NEW_COURSE_ITEM_PREFIX) && activeJobFor(db, item.moduleId.slice(NEW_COURSE_ITEM_PREFIX.length)) !== null,
    );
    if (stillMaking) continue;

    const announced = new Set(
      db
        .select({ detail: schema.aiAuditLog.detail })
        .from(schema.aiAuditLog)
        .where(and(eq(schema.aiAuditLog.pathId, pathId), eq(schema.aiAuditLog.step, "announce")))
        .all()
        .flatMap((row) => ((row.detail as { courseIds?: string[] } | null)?.courseIds ?? [])),
    );
    const courseIds = [
      ...new Set(items.filter((item) => item.source === "generated" && item.courseId && !announced.has(item.courseId)).map((item) => item.courseId!)),
    ];
    if (courseIds.length === 0) continue;
    const added = db
      .select({ id: schema.courses.id, title: schema.courses.title })
      .from(schema.courses)
      .innerJoin(schema.generatedCourses, eq(schema.generatedCourses.courseId, schema.courses.id))
      .where(and(inArray(schema.courses.id, courseIds), eq(schema.generatedCourses.library, true), eq(schema.courses.published, true)))
      .all();
    if (added.length === 0) continue;
    const ordered = courseIds.map((id) => added.find((course) => course.id === id)).filter((course): course is { id: string; title: string } => Boolean(course));

    const learner = db.select({ displayName: schema.users.displayName }).from(schema.users).where(eq(schema.users.id, path.userId)).get();
    const body = coursesAddedMessage(learner?.displayName ?? "a learner", ordered.map((course) => course.title));
    for (const recipientId of staffIds(db)) {
      notify(db, {
        recipientId,
        kind: "courses.added",
        title: ordered.length === 1 ? "A new course is in the library" : `${ordered.length} new courses are in the library`,
        body,
        link: `/admin/people/${path.userId}`,
      });
    }
    auditStep(db, { pathId, step: "announce", detail: { courseIds: ordered.map((course) => course.id) } });
  }
}

/** Tells the staff a new course needs a look, in plain words. */
function notifyHeld(db: Db, courseId: string, title: string, reason: string, userId: string): void {
  const learner = db.select({ displayName: schema.users.displayName }).from(schema.users).where(eq(schema.users.id, userId)).get();
  for (const recipientId of staffIds(db)) {
    notify(db, {
      recipientId,
      kind: "course.needs_review",
      title: `"${title}" needs a look`,
      body: `We made this course for ${learner?.displayName ?? "a learner"}, but it didn't pass the quality check: ${reason} Learners can't see it yet. You can fix it automatically or edit it.`,
      link: `/admin/generated?course=${courseId}`,
    });
  }
}

function notifyWaitingApproval(db: Db, title: string, userId: string): void {
  const learner = db.select({ displayName: schema.users.displayName }).from(schema.users).where(eq(schema.users.id, userId)).get();
  for (const recipientId of staffIds(db)) {
    notify(db, {
      recipientId,
      kind: "course.pending_review",
      title: `"${title}" is waiting for your OK`,
      body: `We made this course for ${learner?.displayName ?? "a learner"} and it passed the quality check. New courses aren't published on their own for this learner, so it waits for you.`,
      link: "/admin/generated",
    });
  }
}

// ---------------------------------------------------------------------------
// The job
// ---------------------------------------------------------------------------

export const DEFAULT_FETCH: ResearchDeps = {
  fetchUrl: async (url) => {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "user-agent": "Oyelearn course builder (link check)" },
    });
    return { status: response.status, headers: response.headers, text: () => response.text() };
  },
};

export interface CourseJobDeps extends SetupDeps {
  ai: AiService;
  /** The link fetcher; replaced in tests. */
  research?: ResearchDeps;
  log?: (message: string) => void;
}

const payloadSchema = z.object({
  mode: z.enum(["generate", "fix"]).default("generate"),
  key: z.string().min(1).max(200),
  skill: z.string().min(1).max(300),
  skillId: z.string().max(120).nullable().optional(),
  caseId: z.string().max(120).nullable().optional(),
  userId: z.string().min(1).max(64),
  departmentId: z.string().max(64).nullable().optional(),
  reason: z.string().max(1000).optional(),
  targetRole: z.string().max(300).optional(),
  level: z.number().int().min(1).max(5).optional(),
  courseId: z.string().max(64).optional(),
});

/** `auditCourseId` only for a course that already exists (the audit row points at it). */
function buildDeps(deps: CourseJobDeps, clients: { search: SearchClient; video: VideoClient }, meta: BuildDeps["meta"], auditCourseId: string | null = null): BuildDeps {
  const settings = deps.db.select().from(schema.researchSettings).get();
  return {
    ai: deps.ai,
    meta,
    search: clients.search,
    video: clients.video,
    research: deps.research ?? DEFAULT_FETCH,
    budget: { tokens: settings?.budgetTokens ?? 400_000, searches: settings?.budgetSearches ?? 60 },
    onStep: (step, detail, usage) =>
      auditStep(deps.db, { pathId: null, courseId: auditCourseId, step, promptVersion: PROMPT_VERSION, detail, inputTokens: usage.input, outputTokens: usage.output }),
  };
}

/** `course.generate`: makes one course (or fixes a held one), then publishes or holds it. */
export function courseGenerateHandler(deps: CourseJobDeps) {
  return async (job: Job): Promise<void> => {
    const payload = payloadSchema.parse(job.payload);
    const problem = setupProblem(deps);
    if (problem) throw new JobWaitingSetupError(problem);
    const clients = clientsOf(deps);
    if (!clients.ok) throw new JobWaitingSetupError("the web search isn't connected");

    if (payload.mode === "fix") {
      await fixCourse(deps, clients, payload);
      return;
    }

    const { db } = deps;
    // Another job or an admin may have filled this since it was queued.
    const hit = libraryCourseFor(db, payload.key, payload.skill);
    if (hit?.state === "published") {
      resolveWaiting(db, payload.key, hit.courseId, "reuse");
      return;
    }
    if (hit?.state === "held") return;

    const gap: ScoredGap = {
      skill: payload.skill,
      severity: 0.5,
      roleRelevance: 1,
      weight: 1,
      source: "admin_priority",
      priorityScore: 1,
      evidence: { summary: payload.reason ?? `Needed for the learning path: ${payload.skill}.`, itemIds: [], missed: 0, asked: 0 },
      skipped: false,
    };
    const courseId = newId();
    const built = await buildCourse(gap, { targetRole: payload.targetRole ?? "", level: payload.level ?? 2 }, buildDeps(deps, clients, { subjectUserId: payload.userId, courseId }));
    if (!built.ok) {
      auditStep(db, { pathId: null, step: "generate", detail: { skill: payload.skill, failed: built.kind, reason: built.reason } });
      throw new Error(built.reason);
    }

    const stored = persistCourse(db, {
      built: built.course,
      skill: payload.skill,
      userId: payload.userId,
      autoPublish: false,
      courseId,
      departmentId: payload.departmentId ?? null,
      extraDetail: { autoKey: payload.key, skillId: payload.skillId ?? null, caseId: payload.caseId ?? null },
    });
    auditStep(db, { pathId: null, courseId, step: "generate", promptVersion: built.course.promptVersion, detail: { skill: payload.skill, score: built.course.score, passed: built.course.passed } });

    if (!built.course.passed) {
      const reason = plainReviewReason(built.course.review);
      db.update(schema.generatedCourses).set({ reviewReason: reason }).where(eq(schema.generatedCourses.courseId, courseId)).run();
      notifyHeld(db, courseId, built.course.plan.title, reason, payload.userId);
      return;
    }
    if (effectiveAutoPublish(db, payload.userId)) {
      publishToLibrary(db, courseId);
    } else if (stored.status === "pending_review") {
      notifyWaitingApproval(db, built.course.plan.title, payload.userId);
    }
    deps.log?.(`course ${courseId} for "${payload.skill}": ${built.course.passed ? "passed" : "held"}`);
  };
}

/**
 * "Fix automatically": rewrites only the lessons the quality check flagged (every lesson when it
 * named none), checks the whole course again, and publishes it on a pass. At most
 * `MAX_FIX_ATTEMPTS` times; after that a person edits it.
 */
async function fixCourse(deps: CourseJobDeps, clients: { search: SearchClient; video: VideoClient }, payload: z.infer<typeof payloadSchema>): Promise<void> {
  const { db } = deps;
  const courseId = payload.courseId;
  if (!courseId) return;
  const row = db.select().from(schema.generatedCourses).where(eq(schema.generatedCourses.courseId, courseId)).get();
  const course = db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).get();
  if (!row || !course || row.status !== "needs_review" || row.fixAttempts >= MAX_FIX_ATTEMPTS) return;

  const detail = (row.reviewDetail ?? {}) as Partial<CourseReview> & Record<string, unknown>;
  const weak = new Set((detail.weakTopics ?? []).map((title) => normaliseSkill(title)));
  const sections = new Map(db.select().from(schema.courseSections).where(eq(schema.courseSections.courseId, courseId)).all().map((s) => [s.id, s]));
  const topics = db.select().from(schema.courseTopics).where(eq(schema.courseTopics.courseId, courseId)).orderBy(asc(schema.courseTopics.position)).all();
  const flagged = topics.filter((topic) => weak.has(normaliseSkill(topic.title)));
  const targets = flagged.length > 0 ? flagged : topics;

  const build = buildDeps(deps, clients, { subjectUserId: payload.userId, courseId }, courseId);
  const timestamp = now();
  let rewritten = 0;
  for (const topic of targets) {
    const rebuilt = await rebuildTopic(
      {
        skill: row.skill,
        courseTitle: course.title,
        sectionTitle: sections.get(topic.sectionId)?.title ?? course.title,
        topicTitle: topic.title,
        objective: `Teach ${topic.title} well enough to pass a 10-question check.`,
        estMinutes: topic.estMinutes,
      },
      build,
    );
    if (!rebuilt) continue;
    db.update(schema.courseTopics).set(topicContent(rebuilt)).where(eq(schema.courseTopics.id, topic.id)).run();
    db.delete(schema.courseSources).where(eq(schema.courseSources.topicId, topic.id)).run();
    writeTopicSources(db, courseId, topic.id, rebuilt, timestamp);
    rewritten += 1;
  }

  const current = db.select().from(schema.courseTopics).where(eq(schema.courseTopics.courseId, courseId)).orderBy(asc(schema.courseTopics.position)).all();
  const reviewed = await reviewCourse(
    {
      skill: row.skill,
      courseTitle: course.title,
      topics: current.map((topic) => ({
        title: topic.title,
        objective: `Teach ${topic.title}.`,
        summary: topic.body,
        references: (topic.links ?? []).map((link) => link.url),
        questionCount: (topic.test as { questions?: unknown[] } | null)?.questions?.length ?? 0,
      })),
    },
    build,
  );
  if (!reviewed.ok) throw new Error(reviewed.reason);

  const passed = reviewPasses(reviewed.review);
  const reason = passed ? null : plainReviewReason(reviewed.review);
  db.update(schema.generatedCourses)
    .set({
      fixAttempts: row.fixAttempts + 1,
      reviewScore: reviewScore(reviewed.review),
      reviewDetail: { ...detail, ...reviewed.review },
      reviewReason: reason,
    })
    .where(eq(schema.generatedCourses.courseId, courseId))
    .run();
  auditStep(db, { pathId: null, courseId, step: "fix", detail: { rewritten, passed, attempt: row.fixAttempts + 1 } });

  if (passed) publishToLibrary(db, courseId);
  else notifyHeld(db, courseId, course.title, reason!, row.userId ?? payload.userId);
}

/** Queues "Fix automatically" for a held course. Returns the plain setup problem when it must wait. */
export function requestFix(deps: SetupDeps, courseId: string): { jobId: string; waitingSetup: string | null } {
  const { db } = deps;
  const row = db.select().from(schema.generatedCourses).where(eq(schema.generatedCourses.courseId, courseId)).get();
  if (!row) throw new Error("No such course.");
  const existing = db
    .select()
    .from(schema.jobs)
    .where(and(eq(schema.jobs.type, "course.generate"), inArray(schema.jobs.status, [...ACTIVE_JOB_STATUSES])))
    .all()
    .find((job) => (job.payload as CourseJobPayload).mode === "fix" && (job.payload as CourseJobPayload).courseId === courseId);
  if (existing) return { jobId: existing.id, waitingSetup: existing.status === "waiting_setup" ? existing.lastError : null };

  const payload: CourseJobPayload = { mode: "fix", key: `fix:${courseId}`, skill: row.skill, userId: row.userId ?? "system", courseId };
  const jobId = enqueue(db, { type: "course.generate", payload });
  const problem = setupProblem(deps);
  if (problem) db.update(schema.jobs).set({ status: "waiting_setup", lastError: problem }).where(eq(schema.jobs.id, jobId)).run();
  return { jobId, waitingSetup: problem };
}

// ---------------------------------------------------------------------------
// The shared resources list
// ---------------------------------------------------------------------------

/** Every source the library's courses cite, once each: the shared resources list. */
export function libraryResources(db: Db) {
  const rows = db
    .select({
      url: schema.courseSources.url,
      title: schema.courseSources.title,
      kind: schema.courseSources.kind,
      courseId: schema.courses.id,
      courseTitle: schema.courses.title,
      skill: schema.generatedCourses.skill,
      departmentId: schema.generatedCourses.departmentId,
      deadSince: schema.courseSources.deadSince,
    })
    .from(schema.courseSources)
    .innerJoin(schema.courses, eq(schema.courses.id, schema.courseSources.courseId))
    .innerJoin(schema.generatedCourses, eq(schema.generatedCourses.courseId, schema.courses.id))
    .where(and(eq(schema.generatedCourses.library, true), eq(schema.courses.published, true), isNotNull(schema.courseSources.url)))
    .all();
  const seen = new Set<string>();
  return rows
    .filter((row) => row.deadSince == null && !seen.has(row.url) && Boolean(seen.add(row.url)))
    .map(({ deadSince: _dead, ...row }) => row);
}
