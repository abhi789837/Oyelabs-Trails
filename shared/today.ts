import { z } from "zod";

import type { StreakWeekRecord } from "./streak";
import type { WinKind } from "./xp";
import type { PlanLane } from "./weeklyPlan";

/**
 * v5 Today (`/learn`): what the page reads, in one call (`GET /api/v5/today`), plus the
 * announcement contracts (learner read, admin CRUD) the admin screens also use.
 */

export type LessonStep = "watch" | "read" | "do" | "check";
export const LESSON_STEPS = ["watch", "read", "do", "check"] as const satisfies readonly LessonStep[];

/** Where the big Continue button goes. */
export interface TodayHero {
  /** `resume`: an unfinished lesson (exact step and video second). `plan`: the next item in this week's plan. */
  kind: "resume" | "plan";
  topicId: string | null;
  title: string;
  /** The step name shown: "Watch", "Read"… Null for a course lesson. */
  step: LessonStep | null;
  positionSec: number | null;
  minutesLeft: number | null;
  lane: PlanLane | null;
  /** "JavaScript Core · Frontend". */
  context: string | null;
  href: string;
}

export interface TodayTrailStop {
  id: string;
  title: string;
  lane: PlanLane;
  minutes: number;
  done: boolean;
  href: string;
}

export interface TodayWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  stops: TodayTrailStop[];
  doneCount: number;
  totalCount: number;
}

export interface TodayGoal {
  /** The ISO week the ring is about: "2026-W41". */
  week: string;
  /** Null when no weekly goal is set: then the week is met by 3 steps. */
  goalMinutes: number | null;
  loggedMinutes: number;
  steps: number;
  met: boolean;
}

export interface TodayStreak {
  current: number;
  best: number;
  freezesLeft: number;
  history: StreakWeekRecord[];
}

export interface TodayUpNextItem {
  id: string;
  title: string;
  href: string;
  minutes: number;
  lane: PlanLane;
  /** The chip: "Must know for Backend". */
  why: string;
  /** The plan's longer reason, for a tooltip or a second line. */
  reason: string;
}

export interface TodayWin {
  kind: WinKind;
  title: string;
  /** "Practical case passed". */
  label: string;
  xp: number;
  at: number;
  href: string | null;
}

export interface AnnouncementView {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: number;
  expiresAt: number | null;
  /** The admin's display name, or null when their account was removed. */
  author: string | null;
}

export interface TodayResponse {
  firstName: string;
  hero: TodayHero | null;
  week: TodayWeek | null;
  goal: TodayGoal;
  streak: TodayStreak;
  upNext: TodayUpNextItem[];
  /** Null when the Review feature isn't available yet. */
  review: { dueCount: number } | null;
  wins: TodayWin[];
  announcements: AnnouncementView[];
  xp: { total: number; thisWeek: number };
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export const announcementAudienceSchema = z
  .object({
    all: z.literal(true).optional(),
    departmentIds: z.array(z.string().trim().min(1).max(64)).max(100).optional(),
    userIds: z.array(z.string().trim().min(1).max(64)).max(500).optional(),
  })
  .strict()
  .refine((a) => a.all === true || (a.departmentIds?.length ?? 0) > 0 || (a.userIds?.length ?? 0) > 0, {
    message: "Choose who should see it: everyone, some departments or some people.",
  });
export type AnnouncementAudience = z.infer<typeof announcementAudienceSchema>;

export const announcementInputSchema = z.object({
  title: z.string().trim().min(1, "Add a title.").max(120, "Keep the title under 120 characters."),
  body: z.string().trim().min(1, "Add a message.").max(2000, "Keep the message under 2,000 characters."),
  audience: announcementAudienceSchema,
  pinned: z.boolean().default(true),
  /** Epoch ms. Null means it stays until removed. */
  expiresAt: z.number().int().positive().nullable().default(null),
});
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;

export const announcementPatchSchema = z
  .object({
    title: announcementInputSchema.shape.title.optional(),
    body: announcementInputSchema.shape.body.optional(),
    audience: announcementAudienceSchema.optional(),
    pinned: z.boolean().optional(),
    expiresAt: z.number().int().positive().nullable().optional(),
  })
  .refine((p) => Object.keys(p).length > 0, { message: "Nothing to change." });
export type AnnouncementPatch = z.infer<typeof announcementPatchSchema>;

/** What the admin list shows: the learner view plus who it's for. */
export interface AdminAnnouncementView extends AnnouncementView {
  audience: AnnouncementAudience;
  createdBy: string | null;
  expired: boolean;
}

/** Whether an announcement is live and meant for this person. Pure, so the server and tests share it. */
export function announcementVisibleTo(
  a: { audience: { all?: true; departmentIds?: string[]; userIds?: string[] }; expiresAt: number | null },
  viewer: { userId: string; departmentId: string | null },
  nowMs: number,
): boolean {
  if (a.expiresAt !== null && a.expiresAt <= nowMs) return false;
  if (a.audience.all === true) return true;
  if (a.audience.userIds?.includes(viewer.userId)) return true;
  return viewer.departmentId !== null && (a.audience.departmentIds?.includes(viewer.departmentId) ?? false);
}

/** The "why" chip on an Up next item. Plain words, short. */
export function whyChip(lane: PlanLane, target: string | null): string {
  const lead: Record<PlanLane, string> = {
    do_now: "Do it now",
    must_know: "Must know",
    medium: "Good to know",
    low: "Extra",
  };
  return target ? `${lead[lane]} for ${target}` : lead[lane];
}

/** The v5 link for a plan item: curriculum topics open in the lesson player. */
export function lessonHref(topicId: string, opts: { step?: LessonStep | null; t?: number | null } = {}): string {
  const params = new URLSearchParams();
  if (opts.step) params.set("step", opts.step);
  if (opts.t !== null && opts.t !== undefined && opts.t > 0) params.set("t", String(Math.floor(opts.t)));
  const qs = params.toString();
  return `/learn/lesson/${encodeURIComponent(topicId)}${qs ? `?${qs}` : ""}`;
}
