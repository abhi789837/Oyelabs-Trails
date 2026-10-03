import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";

import {
  DEFAULT_HOURS_PER_WEEK,
  LANE_ORDER,
  SKIP_ALERT_THRESHOLD,
  draftMinutes,
  flattenLanes,
  isWeekComplete,
  itemKey,
  toIsoDate,
  weekEnd,
  weekHasEnded,
  weekStart,
  type PlanLane,
  type WeekHistoryEntry,
  type WeekItemView,
  type WeekSource,
  type WeekView,
  type WeeklyPlanDraft,
} from "../../../../shared/weeklyPlan";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { newId, now } from "../../lib/ids";
import { notify, staffIds } from "../../lib/notify";
import { gatherLibrary } from "./candidates";
import type { CarriedItem } from "./types";

/**
 * Storing a week.
 *
 * Two rules shape everything here.
 *
 * **Completion is never stored twice.** `weekly_plan_items.status` exists, but `topic_progress` and
 * `course_progress` are the truth — a learner who finishes a lesson from the library has finished it,
 * and the week has to agree without anybody telling it. So every read reconciles first. What this
 * table genuinely owns is the part progress cannot know: which lane something was put in, why, what it
 * waits on, and how many weeks it has been carried.
 *
 * **Weeks are append-only.** A new week supersedes the old one rather than editing it, which is the
 * only reason "Week 1 · 11/12 done" is still answerable in March.
 */

type WeekRow = typeof schema.weeklyPlans.$inferSelect;
type ItemRow = typeof schema.weeklyPlanItems.$inferSelect;

/** The learner's weekly budget in minutes, from whatever the admin set at onboarding. */
export function budgetFor(db: Db, userId: string): { minutes: number; startsMonday: boolean } {
  const row = db.select().from(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, userId)).get();
  return {
    minutes: (row?.hoursPerWeek ?? DEFAULT_HOURS_PER_WEEK) * 60,
    startsMonday: row?.weekStartsMonday ?? false,
  };
}

export function activeWeek(db: Db, userId: string): WeekRow | null {
  return (
    db
      .select()
      .from(schema.weeklyPlans)
      .where(and(eq(schema.weeklyPlans.userId, userId), eq(schema.weeklyPlans.status, "active")))
      .orderBy(desc(schema.weeklyPlans.weekNumber))
      .get() ?? null
  );
}

export function weekById(db: Db, planId: string): WeekRow | null {
  return db.select().from(schema.weeklyPlans).where(eq(schema.weeklyPlans.id, planId)).get() ?? null;
}

function itemsOf(db: Db, planId: string): ItemRow[] {
  return db
    .select()
    .from(schema.weeklyPlanItems)
    .where(eq(schema.weeklyPlanItems.planId, planId))
    .orderBy(asc(schema.weeklyPlanItems.position))
    .all();
}

/**
 * Brings a week's item statuses in line with what the learner has actually done.
 *
 * Called on every read. Cheap — two indexed queries and only the rows that changed are written — and
 * it is what lets the trail's "you are here" marker move the moment a topic is passed, without the
 * completion path having to know that weekly plans exist at all.
 */
export function reconcile(db: Db, userId: string, planId: string): ItemRow[] {
  const items = itemsOf(db, planId);
  if (items.length === 0) return items;

  const topicIds = items.map((item) => item.topicId).filter((id): id is string => id !== null);
  const lessonIds = items.map((item) => item.lessonId).filter((id): id is string => id !== null);

  const doneTopics = new Set(
    topicIds.length
      ? db
          .select({ topicId: schema.topicProgress.topicId })
          .from(schema.topicProgress)
          .where(
            and(
              eq(schema.topicProgress.userId, userId),
              eq(schema.topicProgress.status, "completed"),
              inArray(schema.topicProgress.topicId, topicIds),
            ),
          )
          .all()
          .map((row) => row.topicId)
      : [],
  );

  const doneLessons = new Set(
    lessonIds.length
      ? db
          .select({ topicId: schema.courseProgress.topicId })
          .from(schema.courseProgress)
          .where(and(eq(schema.courseProgress.userId, userId), inArray(schema.courseProgress.topicId, lessonIds)))
          .all()
          .map((row) => row.topicId)
      : [],
  );

  const timestamp = now();
  return items.map((item) => {
    const done = item.topicId ? doneTopics.has(item.topicId) : item.lessonId ? doneLessons.has(item.lessonId) : false;
    const status = done ? "done" : item.status === "done" ? "pending" : item.status;
    if (status === item.status) return item;

    /* A completion can be undone — a course lesson can be un-ticked — so this moves in both
       directions. `completed_at` follows the status rather than being kept as a high-water mark,
       because a week that says "done at 14:02" for something not done reads as a lie. */
    const completedAt = status === "done" ? (item.completedAt ?? timestamp) : null;
    db.update(schema.weeklyPlanItems)
      .set({ status, completedAt })
      .where(eq(schema.weeklyPlanItems.id, item.id))
      .run();
    return { ...item, status, completedAt };
  });
}

/**
 * The week the UI reads, with every title, link and dependency already resolved.
 *
 * Resolved server-side rather than on the client because the client would need the whole course table
 * and the whole curriculum manifest to do it, and one of those it is not allowed to have.
 */
export function weekView(
  db: Db,
  content: ContentStore,
  userId: string,
  row: WeekRow,
  options: { reconcile?: boolean } = {},
): WeekView {
  /* A past week is read as it was left (`reconcile: false`): reconciling would rewrite its
     statuses from today's progress and change the "11/12 done" its history row reports. */
  const items = options.reconcile === false ? itemsOf(db, row.id) : reconcile(db, userId, row.id);
  const { lessonCount } = gatherLibrary({ db, content, userId });

  const lessonIds = items.map((item) => item.lessonId).filter((id): id is string => id !== null);
  const lessonRows = lessonIds.length
    ? db
        .select({
          id: schema.courseTopics.id,
          title: schema.courseTopics.title,
          courseId: schema.courseTopics.courseId,
          courseTitle: schema.courses.title,
        })
        .from(schema.courseTopics)
        .innerJoin(schema.courses, eq(schema.courses.id, schema.courseTopics.courseId))
        .where(inArray(schema.courseTopics.id, lessonIds))
        .all()
    : [];
  const lessonById = new Map(lessonRows.map((lesson) => [lesson.id, lesson] as const));

  const trackNames = new Map(content.manifest.map((track) => [track.id, track.name] as const));
  const moduleNames = new Map(
    content.manifest.flatMap((track) => track.modules.map((module) => [module.id, module.name] as const)),
  );

  const titleOf = (item: ItemRow): string => {
    if (item.topicId) return content.topicIndex.get(item.topicId)?.meta.title ?? item.topicId;
    return item.lessonId ? (lessonById.get(item.lessonId)?.title ?? "A lesson") : "A lesson";
  };

  const views: WeekItemView[] = items.map((item) => {
    const location = item.topicId ? content.topicIndex.get(item.topicId) : undefined;
    const lesson = item.lessonId ? lessonById.get(item.lessonId) : undefined;

    const context = location
      ? `${moduleNames.get(location.moduleId) ?? location.moduleId} · ${trackNames.get(location.trackId) ?? location.trackId}`
      : (lesson?.courseTitle ?? "Course");

    const href = location
      ? `/track/${location.trackId}/module/${location.moduleId}/topic/${item.topicId}`
      : `/courses/${item.courseId ?? lesson?.courseId ?? ""}`;

    return {
      id: item.id,
      lane: item.lane,
      position: item.position,
      topicId: item.topicId,
      courseId: item.courseId,
      lessonId: item.lessonId,
      title: titleOf(item),
      context,
      level: location?.meta.level ?? null,
      minutes: item.minutes,
      reason: item.reason,
      source: item.source,
      status: item.status,
      href,
      dependsOn: item.dependsOn
        .map((key) => {
          const target = items.find((candidate) => itemKey(candidate) === key);
          return target ? { key, title: titleOf(target) } : null;
        })
        .filter((entry): entry is { key: string; title: string } => entry !== null),
      pinned: item.pinned,
      carried: item.carriedFrom !== null,
      skipCount: item.skipCount,
    };
  });

  return {
    id: row.id,
    weekNumber: row.weekNumber,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    source: row.source,
    summary: row.summary,
    roadmapNarrative: row.roadmapNarrative,
    nextWeekPreview: row.nextWeekPreview,
    budgetMinutes: row.budgetMinutes,
    plannedMinutes: views.reduce((sum, item) => sum + item.minutes, 0),
    items: views,
    libraryLessonCount: lessonCount,
    readyForNextWeek: isWeekComplete(views),
    generatedAt: row.createdAt,
  };
}

/**
 * "Week 1 · 11/12 done", newest first.
 *
 * Superseded rows are left out: a week that was reshaped on Wednesday was replaced by a row covering
 * the same seven days, and listing both would show the learner two Week 1s.
 */
export function weekHistory(db: Db, userId: string, limit = 24): WeekHistoryEntry[] {
  const rows = db
    .select()
    .from(schema.weeklyPlans)
    .where(and(eq(schema.weeklyPlans.userId, userId), ne(schema.weeklyPlans.status, "superseded")))
    .orderBy(desc(schema.weeklyPlans.weekNumber))
    .limit(limit)
    .all();
  if (rows.length === 0) return [];

  const counts = db
    .select({ planId: schema.weeklyPlanItems.planId, status: schema.weeklyPlanItems.status })
    .from(schema.weeklyPlanItems)
    .where(
      inArray(
        schema.weeklyPlanItems.planId,
        rows.map((row) => row.id),
      ),
    )
    .all();

  const byPlan = new Map<string, { done: number; total: number }>();
  for (const row of counts) {
    const entry = byPlan.get(row.planId) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (row.status === "done") entry.done += 1;
    byPlan.set(row.planId, entry);
  }

  return rows.map((row) => ({
    id: row.id,
    weekNumber: row.weekNumber,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    doneCount: byPlan.get(row.id)?.done ?? 0,
    totalCount: byPlan.get(row.id)?.total ?? 0,
  }));
}

/**
 * What an unfinished week hands to the next one.
 *
 * Unfinished items only, and they keep their lane — an item that blocked the learner last week still
 * blocks them this week, and quietly demoting it to Medium would be the platform deciding a problem
 * had gone away because a Sunday passed.
 */
export function carryOverFrom(db: Db, userId: string, row: WeekRow): CarriedItem[] {
  const items = reconcile(db, userId, row.id);
  return items
    .filter((item) => item.status !== "done")
    .map((item) => ({
      key: itemKey(item),
      lane: item.lane,
      reason: item.reason,
      source: item.source,
      carriedFrom: item.carriedFrom ?? row.id,
      skipCount: item.skipCount + 1,
      pinned: item.pinned,
    }))
    .filter((item) => item.key !== "");
}

export interface SaveWeekInput {
  userId: string;
  draft: WeeklyPlanDraft;
  source: WeekSource;
  generatedBy: string | null;
  carryOver?: readonly CarriedItem[];
  /**
   * Item keys an admin pinned, carried across explicitly.
   *
   * It cannot be inferred from `carryOver`, which is empty when a week is reshaped rather than rolled
   * over — so without this, pinning an item and then regenerating put it in the red lane and quietly
   * forgot it was pinned, losing it at the next rollover.
   */
  pinned?: readonly string[];
  /** The week this one replaces, marked `superseded` rather than deleted. */
  supersede?: WeekRow | null;
}

/**
 * Writes a week, and retires whatever it replaces.
 *
 * One transaction, because a learner holding two active weeks is a state nothing downstream is
 * written to handle — `activeWeek` would pick one arbitrarily and the other's progress would vanish
 * from history.
 */
export function saveWeek(db: Db, input: SaveWeekInput): WeekRow {
  const { userId, draft } = input;
  const timestamp = now();
  const carried = new Map((input.carryOver ?? []).map((item) => [item.key, item] as const));
  const pinned = new Set(input.pinned ?? []);

  /* What happened to the week being replaced, decided by the *week number* rather than by how much of
     it got done.
     
     A new number means the learner moved on: that week ran its course and belongs in history, with
     however many of its items were ticked. The same number means it was reshaped mid-week and the row
     it replaces never happened, so it is superseded and history skips it. Conflating the two is what
     made a reshape collide with the one-week-per-number index, and what would have dropped an
     honestly-unfinished week out of history. */
  const rollingOver = !input.supersede || input.supersede.weekNumber !== draft.weekNumber;

  return db.transaction((tx) => {
    if (input.supersede) {
      tx.update(schema.weeklyPlans)
        .set({ status: rollingOver ? "completed" : "superseded", completedAt: timestamp })
        .where(eq(schema.weeklyPlans.id, input.supersede.id))
        .run();
    }

    /* Any other active week is retired too. Belt and braces: `supersede` is the caller's opinion of
       what is current, and a crashed generation could have left a second one behind. */
    tx.update(schema.weeklyPlans)
      .set({ status: "superseded", completedAt: timestamp })
      .where(
        and(
          eq(schema.weeklyPlans.userId, userId),
          eq(schema.weeklyPlans.status, "active"),
          input.supersede ? ne(schema.weeklyPlans.id, input.supersede.id) : undefined,
        ),
      )
      .run();

    const id = newId();
    tx.insert(schema.weeklyPlans)
      .values({
        id,
        userId,
        weekNumber: draft.weekNumber,
        startDate: draft.startDate,
        endDate: draft.endDate,
        budgetMinutes: draft.weeklyBudgetMinutes,
        summary: draft.summary,
        roadmapNarrative: draft.roadmapNarrative,
        nextWeekPreview: draft.nextWeekPreview,
        status: "active",
        source: input.source,
        generatedBy: input.generatedBy,
        createdAt: timestamp,
        completedAt: null,
      })
      .run();

    let position = 0;
    for (const { lane, item } of flattenLanes(draft.lanes)) {
      const key = itemKey(item);
      const history = carried.get(key);
      tx.insert(schema.weeklyPlanItems)
        .values({
          id: newId(),
          planId: id,
          topicId: item.topicId,
          courseId: item.courseId,
          lessonId: item.lessonId,
          lane,
          position: position++,
          minutes: item.minutes,
          reason: item.reason,
          source: item.source,
          dependsOn: item.dependsOn,
          status: "pending",
          carriedFrom: history?.carriedFrom ?? null,
          skipCount: history?.skipCount ?? 0,
          pinned: (history?.pinned ?? false) || pinned.has(key),
          completedAt: null,
        })
        .run();
    }

    return tx.select().from(schema.weeklyPlans).where(eq(schema.weeklyPlans.id, id)).get()!;
  });
}

/** The next week number for this learner. */
export function nextWeekNumber(db: Db, userId: string): number {
  const last = db
    .select({ weekNumber: schema.weeklyPlans.weekNumber })
    .from(schema.weeklyPlans)
    .where(eq(schema.weeklyPlans.userId, userId))
    .orderBy(desc(schema.weeklyPlans.weekNumber))
    .get();
  return (last?.weekNumber ?? 0) + 1;
}

/** The seven days a week generated now would cover. */
export function weekDates(nowMs: number, startsMonday: boolean): { startDate: string; endDate: string } {
  const start = weekStart(nowMs, startsMonday);
  return { startDate: toIsoDate(start), endDate: toIsoDate(weekEnd(start)) };
}

export function hasWeekEnded(row: WeekRow, nowMs: number): boolean {
  return weekHasEnded(row.endDate, nowMs);
}

/**
 * Tells the admin about work that keeps being pushed.
 *
 * Two weeks carried is the threshold, and it is deliberately the admin who is told rather than the
 * learner nagged: an item nobody gets to twice running is usually a sign the plan is wrong — too
 * long, wrongly prioritised, or blocked on something the platform cannot see — and that is a
 * conversation, not a reminder.
 */
export function alertOnRepeatedSkips(db: Db, userId: string, carryOver: readonly CarriedItem[], content: ContentStore): void {
  const stuck = carryOver.filter((item) => item.skipCount >= SKIP_ALERT_THRESHOLD);
  if (stuck.length === 0) return;

  const user = db
    .select({ displayName: schema.users.displayName })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();

  const names = stuck
    .slice(0, 3)
    .map((item) => content.topicIndex.get(item.key)?.meta.title ?? item.key)
    .join(", ");

  for (const recipientId of staffIds(db)) {
    notify(db, {
      recipientId,
      kind: "plan.stalled",
      title: `${user?.displayName ?? "A learner"} keeps carrying the same work forward`,
      body: `${stuck.length} item${stuck.length === 1 ? "" : "s"} skipped ${SKIP_ALERT_THRESHOLD} weeks running: ${names}. Their week may be too full or wrongly ordered.`,
      link: `/admin/people/${userId}`,
    });
  }
}

/** Moves one item between lanes, or pins it. The admin's edit, logged by the caller. */
export function updateItem(db: Db, itemId: string, patch: { lane?: PlanLane; pinned?: boolean }): ItemRow | null {
  const item = db.select().from(schema.weeklyPlanItems).where(eq(schema.weeklyPlanItems.id, itemId)).get();
  if (!item) return null;

  const lane = patch.pinned === true ? "do_now" : (patch.lane ?? item.lane);
  db.update(schema.weeklyPlanItems)
    .set({ lane, ...(patch.pinned === undefined ? {} : { pinned: patch.pinned }) })
    .where(eq(schema.weeklyPlanItems.id, itemId))
    .run();

  /* Lanes are rendered in `position` order within a lane, and a moved item has a position from the
     lane it left. Renumbering the whole week keeps "first item in this lane" meaningful. */
  renumber(db, item.planId);
  return db.select().from(schema.weeklyPlanItems).where(eq(schema.weeklyPlanItems.id, itemId)).get() ?? null;
}

function renumber(db: Db, planId: string): void {
  const items = itemsOf(db, planId);
  const ordered = LANE_ORDER.flatMap((lane) => items.filter((item) => item.lane === lane));
  ordered.forEach((item, index) => {
    if (item.position === index) return;
    db.update(schema.weeklyPlanItems).set({ position: index }).where(eq(schema.weeklyPlanItems.id, item.id)).run();
  });
}

/** Item keys an admin has pinned in the current week, so a regeneration keeps them. */
export function pinnedKeys(db: Db, planId: string): string[] {
  return itemsOf(db, planId)
    .filter((item) => item.pinned)
    .map(itemKey)
    .filter((key) => key !== "");
}

export function plannedMinutes(draft: WeeklyPlanDraft): number {
  return draftMinutes(draft.lanes);
}
