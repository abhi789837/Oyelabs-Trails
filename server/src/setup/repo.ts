import { asc, eq } from "drizzle-orm";

import { matchSkillByText, skillInputSchema, type Skill } from "../../../shared/catalog";
import {
  experienceBandFromYears,
  priorityToSlider,
  sliderToPriority,
  sortPriorities,
  yearsFromBand,
  type ExperienceBand,
  type LearnerSetup,
  type PriorityEntry,
  type SetupInput,
  type Slider,
} from "../../../shared/setup";
import { createSkill, getCatalog, getSkillsByIds } from "../catalog/repo";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { badRequest } from "../lib/errors";
import { now } from "../lib/ids";

/**
 * The admin's priorities and skip list, as rows (v4 Phase 3).
 *
 * This is the single source of truth. The older readers — `listTargets`, `getPriorities().mustHave`
 * and `.skip` — are projections of these tables, so the path spine, the weekly plan and the
 * assessment all see the same thing. That one-source rule is what fixes the v3 bug where the weekly
 * plan was still reading `must_have` after the admin screen had moved to `learner_targets`.
 */

export function departmentOf(db: Db, userId: string): string {
  const row = db
    .select({ departmentId: schema.learnerProfiles.departmentId })
    .from(schema.learnerProfiles)
    .where(eq(schema.learnerProfiles.userId, userId))
    .get();
  return row?.departmentId ?? "engineering";
}

export function listSkillPriorities(db: Db, userId: string): PriorityEntry[] {
  const rows = db
    .select()
    .from(schema.learnerSkillPriorities)
    .where(eq(schema.learnerSkillPriorities.userId, userId))
    .orderBy(asc(schema.learnerSkillPriorities.position))
    .all();
  return sortPriorities(
    rows.map((row) => ({ skillId: row.skillId, skillName: row.skillName, slider: row.slider as Slider, position: row.position })),
  );
}

export function listSkip(db: Db, userId: string): { skillId: string; skillName: string }[] {
  return db
    .select({ skillId: schema.learnerSkip.skillId, skillName: schema.learnerSkip.skillName })
    .from(schema.learnerSkip)
    .where(eq(schema.learnerSkip.userId, userId))
    .all();
}

/**
 * Replaces the priorities and the skip list in one transaction.
 *
 * A skill cannot be both prioritised and skipped; when the admin does both, skipping wins, because
 * "never test, never teach" is the stronger statement and the safer one to honour by mistake.
 */
export function replacePriorities(
  db: Db,
  userId: string,
  priorities: readonly { skillId: string; skillName: string; slider: Slider }[],
  skip: readonly { skillId: string; skillName: string }[],
): void {
  const at = now();
  const skipped = new Set(skip.map((s) => s.skillId));
  db.transaction((tx) => {
    tx.delete(schema.learnerSkillPriorities).where(eq(schema.learnerSkillPriorities.userId, userId)).run();
    tx.delete(schema.learnerSkip).where(eq(schema.learnerSkip.userId, userId)).run();
    const seen = new Set<string>();
    priorities.forEach((entry, position) => {
      if (skipped.has(entry.skillId) || seen.has(entry.skillId)) return;
      seen.add(entry.skillId);
      tx.insert(schema.learnerSkillPriorities)
        .values({ userId, skillId: entry.skillId, skillName: entry.skillName, slider: entry.slider, position, createdAt: at })
        .run();
    });
    const seenSkip = new Set<string>();
    for (const entry of skip) {
      if (seenSkip.has(entry.skillId)) continue;
      seenSkip.add(entry.skillId);
      tx.insert(schema.learnerSkip).values({ userId, skillId: entry.skillId, skillName: entry.skillName, createdAt: at }).run();
    }
  });
}

/**
 * Finds a catalog skill for a free-text name, or creates one in the learner's department.
 *
 * Only for data that predates the catalog (legacy targets, the old priorities endpoint). Created
 * skills are `active`: an admin already chose that name for a real person, so it is not a request.
 */
export function resolveSkillByText(db: Db, departmentId: string, text: string, actorId: string | null, catalog?: Skill[]): Skill {
  const skills = catalog ?? getCatalog(db, { departmentId, includeArchived: true }).skills;
  const found = matchSkillByText(skills, text);
  if (found) return found;
  const created = createSkill(db, skillInputSchema.parse({ departmentId, name: text.trim(), area: "Custom" }), {
    status: "active",
    requestedBy: actorId,
  });
  skills.push(created);
  return created;
}

// ---------------------------------------------------------------------------
// The whole setup
// ---------------------------------------------------------------------------

export function getSetup(db: Db, userId: string): LearnerSetup {
  const profile = db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get();
  const settings = db.select().from(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, userId)).get();
  return {
    departmentId: profile?.departmentId ?? "engineering",
    trackId: profile?.trackId ?? (profile?.track && profile.track !== "other" ? profile.track : null),
    stackIds: profile?.stackIds ?? [],
    experienceBand: (profile?.experienceBand as ExperienceBand | null) ?? experienceBandFromYears(profile?.yearsExperience ?? null),
    level: (profile?.selfLevel as Slider | null) ?? null,
    priorities: listSkillPriorities(db, userId),
    skip: listSkip(db, userId),
    hoursPerWeek: settings?.hoursPerWeek ?? 15,
    advanced: {
      weekStartsMonday: settings?.weekStartsMonday ?? false,
      deadlineWeeks: settings?.deadlineWeeks ?? null,
      courseCap: settings?.courseCap ?? 5,
      autoPublish: settings?.autoPublish ?? false,
    },
  };
}

/**
 * Saves the Setup screen. Validates every id against the catalog of the chosen department, so a
 * stale client cannot attach a PM skill to an engineer.
 */
export function saveSetup(db: Db, userId: string, input: SetupInput, actorId: string): LearnerSetup {
  const catalog = getCatalog(db, { includeArchived: true });
  const department = catalog.departments.find((d) => d.id === input.departmentId);
  if (!department) throw badRequest("Pick a department.", { departmentId: "Unknown department" });
  if (input.trackId && !catalog.tracks.some((t) => t.id === input.trackId && t.departmentId === department.id)) {
    throw badRequest("That track is not in this department.", { trackId: "Unknown track" });
  }
  const stackIds = input.stackIds.filter((id) => catalog.stacks.some((s) => s.id === id && s.departmentId === department.id));
  const byId = new Map(catalog.skills.map((s) => [s.id, s]));
  const wrong = [...input.priorities.map((p) => p.skillId), ...input.skip].find((id) => byId.get(id)?.departmentId !== department.id);
  if (wrong) throw badRequest("A selected skill is not in this department's catalog.", { priorities: `Unknown skill ${wrong}` });

  const at = now();
  db.transaction((tx) => {
    const current = tx.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get();
    const trackName = input.trackId ? catalog.tracks.find((t) => t.id === input.trackId)?.name : null;
    const stackNames = stackIds.map((id) => catalog.stacks.find((s) => s.id === id)!.name);
    const profile = {
      userId,
      roleTitle: current?.roleTitle ?? null,
      yearsExperience: input.experienceBand ? yearsFromBand(input.experienceBand) : (current?.yearsExperience ?? null),
      adminNotes: current?.adminNotes ?? "",
      claimedSkills: current?.claimedSkills ?? [],
      targetTracks: current?.targetTracks ?? [],
      // The v3 columns, kept in step for one release so nothing that still reads them goes blank.
      track: department.id === "engineering" ? (input.trackId ?? current?.track ?? null) : "other",
      stack: stackNames.length ? stackNames.join(" + ").slice(0, 120) : (current?.stack ?? trackName ?? null),
      selfLevel: input.level,
      departmentId: department.id,
      trackId: input.trackId,
      stackIds,
      experienceBand: input.experienceBand,
      updatedAt: at,
      updatedBy: actorId,
    };
    tx.insert(schema.learnerProfiles).values(profile).onConflictDoUpdate({ target: schema.learnerProfiles.userId, set: profile }).run();

    const existing = tx.select().from(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, userId)).get();
    const settings = {
      targetRole: existing?.targetRole ?? trackName ?? "",
      hoursPerWeek: input.hoursPerWeek,
      weekStartsMonday: input.advanced.weekStartsMonday,
      deadlineWeeks: input.advanced.deadlineWeeks,
      courseCap: input.advanced.courseCap,
      autoPublish: input.advanced.autoPublish,
      updatedBy: actorId,
      updatedAt: at,
    };
    tx.insert(schema.learnerPriorities)
      .values({ userId, ...settings })
      .onConflictDoUpdate({ target: schema.learnerPriorities.userId, set: settings })
      .run();
  });

  replacePriorities(
    db,
    userId,
    input.priorities.map((p) => ({ skillId: p.skillId, skillName: byId.get(p.skillId)!.name, slider: p.slider })),
    input.skip.map((id) => ({ skillId: id, skillName: byId.get(id)!.name })),
  );
  return getSetup(db, userId);
}

/** Skills referenced by a setup, for a client that has not loaded the whole catalog. */
export function setupSkills(db: Db, setup: LearnerSetup): Skill[] {
  return getSkillsByIds(db, [...setup.priorities.map((p) => p.skillId), ...setup.skip.map((s) => s.skillId)]);
}

// ---------------------------------------------------------------------------
// Projections for the v3 readers
// ---------------------------------------------------------------------------

/** `learner_targets`' shape, from the slider rows. Position is the rank within its bucket. */
export function targetsFromPriorities(entries: readonly PriorityEntry[]) {
  const counters: Record<string, number> = {};
  return entries.map((entry) => {
    const priority = sliderToPriority(entry.slider);
    const position = counters[priority] ?? 0;
    counters[priority] = position + 1;
    return { id: entry.skillId, skill: entry.skillName, priority, position, targetDate: null };
  });
}

/**
 * Writes v3-shaped targets (free text + high/medium/low) into the slider table.
 *
 * Kept so the v3 `/targets` and `/priorities` endpoints still work for one release; both resolve
 * each name against the catalog first.
 */
export function writeLegacyTargets(
  db: Db,
  userId: string,
  targets: readonly { skill: string; priority: "high" | "medium" | "low" }[],
  skipNames: readonly string[] | null,
  actorId: string | null,
): void {
  const departmentId = departmentOf(db, userId);
  const catalog = getCatalog(db, { departmentId, includeArchived: true }).skills;
  const priorities = targets
    .filter((t) => t.skill.trim().length >= 2)
    .map((t) => {
      const skill = resolveSkillByText(db, departmentId, t.skill, actorId, catalog);
      return { skillId: skill.id, skillName: skill.name, slider: priorityToSlider(t.priority) };
    });
  const skip =
    skipNames === null
      ? listSkip(db, userId)
      : skipNames
          .filter((name) => name.trim().length >= 2)
          .map((name) => {
            const skill = resolveSkillByText(db, departmentId, name, actorId, catalog);
            return { skillId: skill.id, skillName: skill.name };
          });
  replacePriorities(db, userId, priorities, skip);
}

/** Replaces only the skip list (by free-text names), keeping every slider exactly as it is. */
export function replaceSkipByNames(db: Db, userId: string, names: readonly string[], actorId: string | null): void {
  const departmentId = departmentOf(db, userId);
  const catalog = getCatalog(db, { departmentId, includeArchived: true }).skills;
  const skip = names
    .filter((name) => name.trim().length >= 2)
    .map((name) => {
      const skill = resolveSkillByText(db, departmentId, name, actorId, catalog);
      return { skillId: skill.id, skillName: skill.name };
    });
  replacePriorities(db, userId, listSkillPriorities(db, userId), skip);
}

// ---------------------------------------------------------------------------
// One-time migration of v3 data
// ---------------------------------------------------------------------------

const MIGRATION_KEY = "v4.priorities_migrated";

/**
 * Copies `learner_targets` (or, where a learner has none, `learner_priorities.must_have`) and the
 * old skip list into the slider tables, once per database. The old rows are left in place.
 */
export function migrateLegacyPriorities(db: Db): number {
  const done = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, MIGRATION_KEY)).get();
  if (done) return 0;

  const users = new Set<string>([
    ...db.select({ userId: schema.learnerTargets.userId }).from(schema.learnerTargets).all().map((r) => r.userId),
    ...db.select({ userId: schema.learnerPriorities.userId }).from(schema.learnerPriorities).all().map((r) => r.userId),
  ]);

  let migrated = 0;
  for (const userId of users) {
    if (listSkillPriorities(db, userId).length > 0 || listSkip(db, userId).length > 0) continue;
    const targets = db
      .select()
      .from(schema.learnerTargets)
      .where(eq(schema.learnerTargets.userId, userId))
      .orderBy(asc(schema.learnerTargets.position))
      .all();
    const old = db.select().from(schema.learnerPriorities).where(eq(schema.learnerPriorities.userId, userId)).get();
    const order = { high: 0, medium: 1, low: 2 } as const;
    const source = targets.length
      ? [...targets].sort((a, b) => order[a.priority] - order[b.priority] || a.position - b.position).map((t) => ({ skill: t.skill, priority: t.priority }))
      : (old?.mustHave ?? []).map((m) => ({ skill: m.skill, priority: m.weight }));
    const skip = old?.skip ?? [];
    if (source.length === 0 && skip.length === 0) continue;
    writeLegacyTargets(db, userId, source, skip, null);
    migrated += 1;
  }

  db.insert(schema.appMeta)
    .values({ key: MIGRATION_KEY, value: String(migrated), updatedAt: now() })
    .onConflictDoNothing()
    .run();
  return migrated;
}
