import { and, eq, gte, inArray, sql } from "drizzle-orm";

import { buildBoard, LEADERBOARD_META_KEY, type BoardCandidate, type LeaderboardResponse } from "../../../../shared/motivation";
import { isoWeekKey, mondayOf } from "../../../../shared/streak";
import { schema, type Db } from "../../db";

/**
 * The opt-in team board. Off unless a super admin turns it on (app_meta `motivation.leaderboards`
 * = "on"); then each learner sees opted-in people from their own department, by this week's XP.
 */

export function leaderboardsOn(db: Db): boolean {
  return db.select().from(schema.appMeta).where(eq(schema.appMeta.key, LEADERBOARD_META_KEY)).get()?.value === "on";
}

export function setLeaderboards(db: Db, on: boolean, at = Date.now()): void {
  const value = on ? "on" : "off";
  db.insert(schema.appMeta)
    .values({ key: LEADERBOARD_META_KEY, value, updatedAt: at })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: at } })
    .run();
}

function departmentOf(db: Db, userId: string): string | null {
  return db.select({ d: schema.learnerProfiles.departmentId }).from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get()?.d ?? null;
}

export function leaderboardFor(db: Db, viewerId: string, nowMs = Date.now()): LeaderboardResponse {
  const week = isoWeekKey(nowMs);
  const viewerPrefs = db.select({ data: schema.userPrefs.data }).from(schema.userPrefs).where(eq(schema.userPrefs.userId, viewerId)).get()?.data ?? {};
  const optedIn = viewerPrefs.leaderboardOptIn === true;
  if (!leaderboardsOn(db)) return { enabled: false, optedIn, team: null, week, board: null };

  const department = departmentOf(db, viewerId);
  const team = department ? (db.select({ name: schema.departments.name }).from(schema.departments).where(eq(schema.departments.id, department)).get()?.name ?? null) : null;

  // Everyone who opted in (a small set), then narrowed to the viewer's department.
  const opted = db
    .select({ userId: schema.userPrefs.userId })
    .from(schema.userPrefs)
    .where(sql`json_extract(${schema.userPrefs.data}, '$.leaderboardOptIn') = 1`)
    .all()
    .map((r) => r.userId);
  if (opted.length === 0) return { enabled: true, optedIn, team, week, board: { entries: [], you: null, size: 0 } };

  const people = db
    .select({ id: schema.users.id, displayName: schema.users.displayName, status: schema.users.status, role: schema.users.role, departmentId: schema.learnerProfiles.departmentId })
    .from(schema.users)
    .leftJoin(schema.learnerProfiles, eq(schema.learnerProfiles.userId, schema.users.id))
    .where(inArray(schema.users.id, opted))
    .all();
  const since = mondayOf(nowMs);
  const xpRows = db
    .select({ userId: schema.xpEvents.userId, xp: sql<number>`coalesce(sum(${schema.xpEvents.xp}), 0)` })
    .from(schema.xpEvents)
    .where(and(inArray(schema.xpEvents.userId, opted), gte(schema.xpEvents.createdAt, since)))
    .groupBy(schema.xpEvents.userId)
    .all();
  const xpBy = new Map(xpRows.map((r) => [r.userId, Number(r.xp)]));
  const candidates: BoardCandidate[] = people.map((p) => ({
    userId: p.id,
    displayName: p.displayName,
    departmentId: p.departmentId ?? null,
    optedIn: true,
    active: p.status === "active" && p.role === "learner",
    xp: xpBy.get(p.id) ?? 0,
  }));
  return { enabled: true, optedIn, team, week, board: buildBoard(viewerId, department, candidates) };
}
