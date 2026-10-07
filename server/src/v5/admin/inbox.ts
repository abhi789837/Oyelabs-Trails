import { and, desc, eq, gte, inArray, or, gt } from "drizzle-orm";

import {
  dismissKey,
  groupInbox,
  inboxTotal,
  INBOX_DISMISSED_META_KEY,
  isDismissed,
  pruneDismissed,
  type InboxItem,
  type InboxResponse,
} from "../../../../shared/adminInbox";
import { MAX_FIX_ATTEMPTS } from "../../../../shared/builder";
import { getSettings, listCredentials } from "../../ai/credentials";
import { listReviewRequests } from "../../assessment/reviews";
import { failedLine } from "../../../../shared/connection";
import { getResearchProvider } from "../../builder/settings";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import type { Env } from "../../env";
import { learnerSignals } from "./activity";
import { emailSetupIssue } from "../email/setup";
import { brokenLinkInboxItems } from "../../oyelabs/media/inboxItems";

const DAY_MS = 86_400_000;
/** Test warnings older than this have been dealt with one way or another. */
const INTEGRITY_WINDOW_DAYS = 30;

export interface InboxDeps {
  db: Db;
  content: ContentStore;
  env: Env;
  usingMockProvider: boolean;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function clip(text: string, max = 90): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export function readDismissed(db: Db): Record<string, number> {
  const raw = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, INBOX_DISMISSED_META_KEY)).get()?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function writeDismissed(db: Db, map: Record<string, number>, now: number): void {
  const value = JSON.stringify(pruneDismissed(map, now));
  db.insert(schema.appMeta)
    .values({ key: INBOX_DISMISSED_META_KEY, value, updatedAt: now })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: now } })
    .run();
}

/** A topic's title, from the curriculum or an admin-written course. */
export function topicTitle(db: Db, content: ContentStore, topicId: string): string {
  const fromContent = content.getTopic(topicId)?.topic.title;
  if (fromContent) return fromContent;
  return db.select({ t: schema.courseTopics.title }).from(schema.courseTopics).where(eq(schema.courseTopics.id, topicId)).get()?.t ?? "a lesson";
}

/**
 * Builds "Needs your attention" from the existing tables. Each group is one or two queries; the
 * stuck rule reads every learner's latest activity in a few grouped queries (activity.ts).
 */
export function buildInbox(deps: InboxDeps, actor: { role: string }, now = Date.now()): InboxResponse {
  const { db, content, env } = deps;
  const items: InboxItem[] = [];
  const dismissed = readDismissed(db);
  const names = new Map(db.select({ id: schema.users.id, n: schema.users.displayName }).from(schema.users).all().map((u) => [u.id, u.n]));
  const nameOf = (id: string) => names.get(id) ?? "Someone";

  // Tests written and waiting for a person before they go out.
  for (const a of db
    .select({ id: schema.assessments.id, userId: schema.assessments.userId, since: schema.assessments.awaitingApprovalSince, createdAt: schema.assessments.createdAt })
    .from(schema.assessments)
    .where(eq(schema.assessments.status, "awaiting_approval"))
    .all()) {
    const who = nameOf(a.userId);
    items.push({
      id: `tests:${a.id}`,
      group: "tests",
      title: `${who}'s test is written`,
      detail: "Send it as it is, or open it to check the questions first.",
      at: a.since ?? a.createdAt,
      userId: a.userId,
      href: `/admin/people/${a.userId}?tab=assessment`,
      action: { kind: "approve-test", label: "Send the test", assessmentId: a.id },
      secondary: { kind: "open", label: "Check it first", href: `/admin/people/${a.userId}?tab=assessment` },
    });
  }

  // Learners with goals and no test yet (the "Plan ready · send the test" next action).
  const withGoals = new Set(
    db
      .select({ userId: schema.learnerGoals.userId })
      .from(schema.learnerGoals)
      .where(eq(schema.learnerGoals.status, "active"))
      .all()
      .map((g) => g.userId),
  );
  if (withGoals.size) {
    const tested = new Set(db.select({ userId: schema.assessments.userId }).from(schema.assessments).all().map((a) => a.userId));
    const waiting = db
      .select({ id: schema.users.id, createdAt: schema.users.createdAt })
      .from(schema.users)
      .where(and(eq(schema.users.role, "learner"), eq(schema.users.status, "active"), inArray(schema.users.id, [...withGoals])))
      .all()
      .filter((u) => !tested.has(u.id));
    for (const u of waiting) {
      items.push({
        id: `tests:user:${u.id}`,
        group: "tests",
        title: `${nameOf(u.id)}'s plan is ready`,
        detail: "Their goals are set. The test is the next step.",
        at: u.createdAt,
        userId: u.id,
        href: `/admin/people/${u.id}`,
        action: { kind: "send-test", label: "Send the test", userId: u.id },
        secondary: { kind: "open", label: "Open", href: `/admin/people/${u.id}?tab=setup` },
      });
    }
  }

  // "Please check this again" requests.
  const reviews = listReviewRequests(db, content, { status: "open" });
  for (const r of reviews) {
    items.push({
      id: `reviews:${r.id}`,
      group: "reviews",
      title: `${r.learnerName} asked us to check an answer again`,
      // Staff screens call it "the test" everywhere else ("Test sent", "Send the test").
      detail: clip(`${r.where.replace(/^Assessment(?=:|$)/, "Test")}: ${r.question}${r.learnerNote ? ` · "${r.learnerNote}"` : ""}`),
      at: r.createdAt,
      userId: r.userId,
      href: "/admin/reviews",
      action: { kind: "full-marks", label: "Give full marks", reviewId: r.id },
      secondary: { kind: "open", label: "Look first", href: "/admin/reviews" },
    });
  }

  // New courses that need a person.
  const waitingCourses = db
    .select({
      courseId: schema.generatedCourses.courseId,
      status: schema.generatedCourses.status,
      reason: schema.generatedCourses.reviewReason,
      fixAttempts: schema.generatedCourses.fixAttempts,
      createdAt: schema.generatedCourses.createdAt,
      title: schema.courses.title,
    })
    .from(schema.generatedCourses)
    .innerJoin(schema.courses, eq(schema.courses.id, schema.generatedCourses.courseId))
    .where(inArray(schema.generatedCourses.status, ["needs_review", "pending_review"]))
    .all();
  for (const c of waitingCourses) {
    const edit = `/admin/library/${c.courseId}/edit`;
    const needsFix = c.status === "needs_review";
    items.push({
      id: `courses:${c.courseId}`,
      group: "courses",
      title: `"${clip(c.title, 60)}" needs a look`,
      detail: needsFix ? clip(c.reason ?? "Our check found parts to improve.") : "It passed our check. Have a quick look, then publish it.",
      at: c.createdAt,
      href: edit,
      action: needsFix
        ? c.fixAttempts < MAX_FIX_ATTEMPTS
          ? { kind: "fix-course", label: "Fix automatically", courseId: c.courseId }
          : { kind: "open", label: "Edit it", href: edit }
        : { kind: "publish-course", label: "Publish", courseId: c.courseId },
      secondary: { kind: "open", label: "Open", href: edit },
    });
  }

  // v4.5 P0: new courses that failed 5 times, with Retry (the newest job per course only).
  for (const job of failedCourseJobs(db)) {
    const who = job.userId ? nameOf(job.userId) : "a learner";
    items.push({
      id: `courses:job:${job.id}`,
      group: "courses",
      title: `The new course "${clip(job.skill, 50)}" for ${who} couldn't be made`,
      detail: `${failedLine(job.lastError)}.`,
      at: job.at,
      userId: job.userId ?? undefined,
      href: job.userId ? `/admin/people/${job.userId}` : "/admin/generated",
      action: { kind: "retry-course", label: "Retry", jobId: job.id },
    });
  }

  items.push(...brokenLinkInboxItems(db, dismissed, now)); // v4.5 P2 (B): Oyelabs links that stopped working

  // "Report a problem" from the lesson player.
  for (const p of db
    .select()
    .from(schema.problemReports)
    .where(eq(schema.problemReports.status, "open"))
    .orderBy(desc(schema.problemReports.createdAt))
    .limit(200)
    .all()) {
    items.push({
      id: `problems:${p.id}`,
      group: "problems",
      title: `${nameOf(p.userId)} reported a problem in ${clip(topicTitle(db, content, p.topicId), 50)}`,
      detail: clip(`"${p.message}"`),
      at: p.createdAt,
      userId: p.userId,
      href: "/admin/problems",
      action: { kind: "resolve-problem", label: "Mark fixed", problemId: p.id },
      secondary: { kind: "open", label: "Open the lesson", href: `/learn/lesson/${encodeURIComponent(p.topicId)}` },
    });
  }

  // Learners who are stuck.
  for (const s of learnerSignals(db, now)) {
    if (!s.stuck) continue;
    const key = dismissKey("stuck", s.userId);
    if (isDismissed(dismissed, key, now)) continue;
    const days = s.idleDays ?? 0;
    items.push({
      id: `stuck:${s.userId}`,
      group: "stuck",
      title: s.lastActivityAt === null ? `${s.displayName} hasn't started their plan` : `${s.displayName} hasn't learned anything for ${days} days`,
      detail: `${s.planCompleted} of ${s.planTopicCount} lessons done. A short reminder often helps.`,
      at: s.lastActivityAt ?? now - days * DAY_MS,
      userId: s.userId,
      href: `/admin/people?person=${s.userId}`,
      action: { kind: "nudge", label: `Remind ${firstName(s.displayName)}`, userId: s.userId },
      secondary: { kind: "dismiss", label: "Mark as checked", key },
    });
  }

  // Tests with warnings or that ended early, recently.
  const since = now - INTEGRITY_WINDOW_DAYS * DAY_MS;
  for (const a of db
    .select({ id: schema.assessments.id, userId: schema.assessments.userId, status: schema.assessments.status, hard: schema.assessments.hardWarnings, at: schema.assessments.submittedAt, createdAt: schema.assessments.createdAt })
    .from(schema.assessments)
    .where(and(or(gt(schema.assessments.hardWarnings, 0), eq(schema.assessments.status, "terminated")), gte(schema.assessments.createdAt, since)))
    .all()) {
    const key = dismissKey("integrity", a.id);
    if (isDismissed(dismissed, key, now)) continue;
    const who = nameOf(a.userId);
    items.push({
      id: `integrity:${a.id}`,
      group: "integrity",
      title: a.status === "terminated" ? `${who}'s test ended early` : `${who}'s test had ${a.hard} ${a.hard === 1 ? "warning" : "warnings"}`,
      detail: "Look at what happened before you trust the results.",
      at: a.at ?? a.createdAt,
      userId: a.userId,
      href: `/admin/assessments/${a.id}/integrity`,
      action: { kind: "open", label: "Look now", href: `/admin/assessments/${a.id}/integrity` },
      secondary: { kind: "dismiss", label: "Mark as checked", key },
    });
  }

  // Setup that stops something from working.
  const superadmin = actor.role === "superadmin";
  const setup = (id: string, title: string, detail: string) => {
    const key = dismissKey("setup", id);
    if (!superadmin && isDismissed(dismissed, key, now)) return;
    items.push({
      id: `setup:${id}`,
      group: "setup",
      title,
      detail: superadmin ? detail : `${detail} A super admin can set this up.`,
      at: null,
      href: "/admin/ai",
      action: superadmin ? { kind: "open", label: "Set it up", href: "/admin/ai" } : { kind: "dismiss", label: "Got it", key },
    });
  };
  if (!deps.usingMockProvider) {
    const settings = getSettings(db);
    const active = settings.activeCredentialId ? listCredentials(db).find((c) => c.id === settings.activeCredentialId) : undefined;
    if (!active) setup("ai", "AI isn't connected", "Tests, marking and new courses need it.");
    else if (active.status === "failed") setup("ai", "The AI connection stopped working", "Check the key. Tests and marking wait until it works.");
  }
  // v4.5 P0: the same check the worker makes, read fresh, and the blocked courses in their own words.
  const research = getResearchProvider(db, env);
  const blocked = blockedCourseLines(db);
  if (blocked.count > 0) {
    setup(
      "research",
      `${blocked.count} new course${blocked.count === 1 ? "" : "s"} blocked: ${blocked.line}`,
      research.ok ? "Run Test on the AI connection page. A passing test starts them at once." : `${research.detail} They start on their own once it's set up.`,
    );
  } else if (!research.ok) {
    setup("research", "Web search for new courses isn't set up", "New courses wait until it is. Existing courses still work.");
  }
  if (env.isProduction && !env.sttBaseUrl) {
    setup("stt", "Spoken answers can't be marked on their own", "We'll ask you to listen to them instead.");
  }
  // Phase 6: emails (weekly recaps, reminders, this weekly report) are waiting on the mail settings.
  const email = emailSetupIssue(db, now);
  if (email && !isDismissed(dismissed, dismissKey("setup", "email"), now)) {
    items.push({ id: "setup:email", group: "setup", title: email.title, detail: email.detail, at: null, href: "/admin/reports", action: { kind: "dismiss", label: "Got it", key: dismissKey("setup", "email") } });
  }

  const groups = groupInbox(items);
  return { groups, total: inboxTotal(groups), generatedAt: now };
}

/** v4.5 P0: course jobs parked until setup is fixed: how many, and the first one's plain reason. */
function blockedCourseLines(db: Db): { count: number; line: string } {
  const rows = db
    .select({ lastError: schema.jobs.lastError })
    .from(schema.jobs)
    .where(and(eq(schema.jobs.type, "course.generate"), eq(schema.jobs.status, "waiting_setup")))
    .all();
  return { count: rows.length, line: rows[0]?.lastError ?? "the web search isn't set up" };
}

/** v4.5 P0: the newest job per course key, when it failed (an older failure retried since doesn't count). */
function failedCourseJobs(db: Db): { id: string; skill: string; userId: string | null; lastError: string | null; at: number }[] {
  const jobs = db
    .select()
    .from(schema.jobs)
    .where(eq(schema.jobs.type, "course.generate"))
    .orderBy(desc(schema.jobs.createdAt))
    .all();
  const seen = new Set<string>();
  const out: { id: string; skill: string; userId: string | null; lastError: string | null; at: number }[] = [];
  for (const job of jobs) {
    const payload = (job.payload ?? {}) as { key?: string; skill?: string; userId?: string };
    const key = payload.key ?? job.id;
    if (seen.has(key)) continue;
    seen.add(key);
    if (job.status !== "failed") continue;
    out.push({ id: job.id, skill: payload.skill ?? "a skill", userId: payload.userId ?? null, lastError: job.lastError, at: job.finishedAt ?? job.createdAt });
  }
  return out;
}
