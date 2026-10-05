import { asc, eq } from "drizzle-orm";

import { isAreaDepartment, matchSkillByText, skillInputSchema, skillUsableBy, type Skill } from "../../../shared/catalog";
import { intentSchema, unresolvedPhrase, unsureMessage, type Intent } from "../../../shared/intents";
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
import { PM_DEFAULT_SLIDER_CHANGES, PM_NEW_DEFAULTS, PM_PROCESS_SKILLS } from "../catalog/seed/pmProcess";
import type { Db } from "../db";
import * as schema from "../db/schema";
import { badRequest } from "../lib/errors";
import { now } from "../lib/ids";
import { listGoals, saveGoals, syncSkillGoalsFromPriorities, validateGoals } from "../goals/repo";

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
      personalisation: settings?.personalisation ?? "balanced",
      autoAddSuggestions: settings?.autoAddSuggestions ?? false,
    },
    description: profile?.adminNotes ?? "",
    goals: listGoals(db, userId),
    intents: storedIntents(settings?.intents),
  };
}

/** The saved intents, re-validated (a bad row reads as none rather than failing the page). */
export function storedIntents(value: unknown): Intent[] {
  if (!Array.isArray(value)) return [];
  const out: Intent[] = [];
  for (const raw of value) {
    const parsed = intentSchema.safeParse(raw);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

/**
 * Saves the Setup screen. Validates every id against the catalog of the chosen department, so a
 * stale client cannot attach a PM skill to an engineer.
 */
export function saveSetup(db: Db, userId: string, input: SetupInput, actorId: string): LearnerSetup {
  const catalog = getCatalog(db, { includeArchived: true });
  const department = catalog.departments.find((d) => d.id === input.departmentId);
  if (!department) throw badRequest("Pick a department.", { departmentId: "Unknown department" });
  if (isAreaDepartment(department)) throw badRequest("Pick the department they work in.", { departmentId: `${department.name} is a skill area, not a department` });
  // v4.4: never save while a phrase of the description is unanswered (an open Unsure, or intents
  // that leave a phrase uncovered). The same plain message everywhere.
  const open = unresolvedPhrase(input);
  if (open) throw badRequest(unsureMessage(open), { unsure: open });
  if (input.trackId && !catalog.tracks.some((t) => t.id === input.trackId && t.departmentId === department.id)) {
    throw badRequest("That track is not in this department.", { trackId: "Unknown track" });
  }
  const stackIds = input.stackIds.filter((id) => catalog.stacks.some((s) => s.id === id && s.departmentId === department.id));
  const byId = new Map(catalog.skills.map((s) => [s.id, s]));
  // v4.3: with goals, the priorities are derived from them (D2) and the sent priorities are ignored.
  const sentPriorities = input.goals ? [] : input.priorities;
  const usable = (id: string) => {
    const skill = byId.get(id);
    return skill != null && skillUsableBy(skill, department.id, catalog.departments);
  };
  const wrong = [...sentPriorities.map((p) => p.skillId), ...input.skip].find((id) => !usable(id));
  if (wrong) throw badRequest("A selected skill is not in this department's catalog.", { priorities: `Unknown skill ${wrong}` });
  if (input.goals) validateGoals(db, department.id, input.goals);
  const badIntent = (input.intents ?? []).flatMap((i) => i.skillIds).find((id) => !usable(id));
  if (badIntent) throw badRequest("A phrase was linked to a skill this department cannot use.", { intents: `Unknown skill ${badIntent}` });

  const at = now();
  db.transaction((tx) => {
    const current = tx.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get();
    const trackName = input.trackId ? catalog.tracks.find((t) => t.id === input.trackId)?.name : null;
    const stackNames = stackIds.map((id) => catalog.stacks.find((s) => s.id === id)!.name);
    const profile = {
      userId,
      roleTitle: current?.roleTitle ?? null,
      yearsExperience: input.experienceBand ? yearsFromBand(input.experienceBand) : (current?.yearsExperience ?? null),
      adminNotes: input.description !== undefined ? input.description : (current?.adminNotes ?? ""),
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
    // v4.4: the description and the intents read from it. Intents sent → saved; not sent → kept
    // while the description is unchanged, cleared when it changed (they no longer quote it).
    const description = input.description !== undefined ? input.description : (existing?.description || current?.adminNotes || "");
    const intents = input.intents !== undefined ? input.intents : description === (existing?.description ?? "") ? (existing?.intents ?? null) : null;
    const settings = {
      description,
      intents,
      targetRole: existing?.targetRole ?? trackName ?? "",
      hoursPerWeek: input.hoursPerWeek,
      weekStartsMonday: input.advanced.weekStartsMonday,
      deadlineWeeks: input.advanced.deadlineWeeks,
      courseCap: input.advanced.courseCap,
      autoPublish: input.advanced.autoPublish,
      personalisation: input.advanced.personalisation,
      autoAddSuggestions: input.advanced.autoAddSuggestions,
      updatedBy: actorId,
      updatedAt: at,
    };
    tx.insert(schema.learnerPriorities)
      .values({ userId, ...settings })
      .onConflictDoUpdate({ target: schema.learnerPriorities.userId, set: settings })
      .run();
  });

  const skip = input.skip.map((id) => ({ skillId: id, skillName: byId.get(id)!.name }));
  if (input.goals) {
    saveGoals(db, userId, input.goals, { departmentId: department.id, skip });
  } else {
    replacePriorities(
      db,
      userId,
      input.priorities.map((p) => ({ skillId: p.skillId, skillName: byId.get(p.skillId)!.name, slider: p.slider })),
      skip,
    );
    syncSkillGoalsFromPriorities(db, userId, listSkillPriorities(db, userId), input.level);
  }
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
  // v4.3: keep the goal box in step with what the legacy endpoint wrote.
  syncSkillGoalsFromPriorities(db, userId, listSkillPriorities(db, userId), null);
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

const DEFAULTS_KEY = "v4.1.department_defaults_applied";

/**
 * v4.1: gives learners whose admin never set any priority their department's default sliders
 * (PM: client management, meetings and email Critical; ...), once per database, and queues a path
 * rebuild for each. A learner with even one slider set is left exactly as the admin left it.
 */
export function applyDepartmentDefaults(db: Db): number {
  if (db.select().from(schema.appMeta).where(eq(schema.appMeta.key, DEFAULTS_KEY)).get()) return 0;
  const defaults = db.select().from(schema.skills).all().filter((s) => s.defaultSlider != null && s.status === "active");
  const learners = db
    .select({ userId: schema.learnerProfiles.userId, departmentId: schema.learnerProfiles.departmentId })
    .from(schema.learnerProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.learnerProfiles.userId))
    .where(eq(schema.users.role, "learner"))
    .all();
  let applied = 0;
  for (const learner of learners) {
    const mine = defaults.filter((s) => s.departmentId === (learner.departmentId ?? "engineering"));
    if (mine.length === 0) continue;
    if (listSkillPriorities(db, learner.userId).length > 0) continue;
    replacePriorities(
      db,
      learner.userId,
      mine.map((s) => ({ skillId: s.id, skillName: s.name, slider: s.defaultSlider as Slider })),
      listSkip(db, learner.userId),
    );
    db.insert(schema.jobs)
      .values({ id: `${now().toString(36)}-${learner.userId}`.slice(0, 64), type: "path.build", payload: { userId: learner.userId }, status: "queued", attempts: 0, maxAttempts: 3, runAfter: now(), createdAt: now() })
      .run();
    applied += 1;
  }
  db.insert(schema.appMeta).values({ key: DEFAULTS_KEY, value: String(applied), updatedAt: now() }).onConflictDoNothing().run();
  return applied;
}

const V42_DEFAULTS_KEY = "v4.2.pm_process_defaults_applied";

/**
 * v4.2, once per database (catalog seeding never updates existing rows):
 * - the agency skills whose default slider changed get the new default, unless an admin already
 *   changed it;
 * - the process academy skills move to the top of the PM catalog;
 * - PM learners whose sliders are still exactly the v4.1 defaults (nobody touched them) move to the
 *   v4.2 defaults — processes Critical — and their paths are rebuilt. Anyone an admin set up by
 *   hand is left exactly as they are.
 */
export function applyV42PmDefaults(db: Db): number {
  if (db.select().from(schema.appMeta).where(eq(schema.appMeta.key, V42_DEFAULTS_KEY)).get()) return 0;
  const pmSkills = db.select().from(schema.skills).where(eq(schema.skills.departmentId, "pm")).all();
  const byId = new Map(pmSkills.map((s) => [s.id, s]));

  // What the v4.1 defaults were, before this release changed them.
  const v41 = new Map<string, number>();
  for (const s of pmSkills) {
    if (s.defaultSlider == null || PM_PROCESS_SKILLS.some((p) => p.id === s.id)) continue;
    v41.set(s.id, s.defaultSlider);
  }
  for (const [id, old] of PM_DEFAULT_SLIDER_CHANGES) if (byId.has(id)) v41.set(id, old);
  for (const [id] of PM_NEW_DEFAULTS) v41.delete(id);

  for (const [id, old, next] of PM_DEFAULT_SLIDER_CHANGES) {
    if (byId.get(id)?.defaultSlider === old) db.update(schema.skills).set({ defaultSlider: next, updatedAt: now() }).where(eq(schema.skills.id, id)).run();
  }
  for (const [id, next] of PM_NEW_DEFAULTS) {
    if (byId.has(id) && byId.get(id)!.defaultSlider == null) db.update(schema.skills).set({ defaultSlider: next, updatedAt: now() }).where(eq(schema.skills.id, id)).run();
  }
  const top = Math.min(...pmSkills.filter((s) => !PM_PROCESS_SKILLS.some((p) => p.id === s.id)).map((s) => s.position), 0);
  PM_PROCESS_SKILLS.forEach((p, i) => {
    if (byId.has(p.id)) db.update(schema.skills).set({ position: top - PM_PROCESS_SKILLS.length + i }).where(eq(schema.skills.id, p.id)).run();
  });

  const v42 = db
    .select()
    .from(schema.skills)
    .where(eq(schema.skills.departmentId, "pm"))
    .all()
    .filter((s) => s.defaultSlider != null && s.status === "active");
  const learners = db
    .select({ userId: schema.learnerProfiles.userId, departmentId: schema.learnerProfiles.departmentId })
    .from(schema.learnerProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.learnerProfiles.userId))
    .where(eq(schema.users.role, "learner"))
    .all()
    .filter((l) => l.departmentId === "pm");
  let moved = 0;
  for (const learner of learners) {
    const current = listSkillPriorities(db, learner.userId);
    const untouched = current.length === v41.size && current.every((p) => v41.get(p.skillId) === p.slider);
    if (!untouched || current.length === 0) continue;
    replacePriorities(
      db,
      learner.userId,
      v42.map((s) => ({ skillId: s.id, skillName: s.name, slider: s.defaultSlider as Slider })),
      listSkip(db, learner.userId),
    );
    db.insert(schema.jobs)
      .values({ id: `v42-${now().toString(36)}-${learner.userId}`.slice(0, 64), type: "path.build", payload: { userId: learner.userId }, status: "queued", attempts: 0, maxAttempts: 3, runAfter: now(), createdAt: now() })
      .run();
    moved += 1;
  }
  db.insert(schema.appMeta).values({ key: V42_DEFAULTS_KEY, value: String(moved), updatedAt: now() }).onConflictDoNothing().run();
  return moved;
}
