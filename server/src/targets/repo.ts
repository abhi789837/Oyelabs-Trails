import { eq } from "drizzle-orm";

import { orderedTargets, type LearnerTarget, type LearnerTrack } from "../../../shared/targets";
import { schema, type Db } from "../db";
import { now } from "../lib/ids";
import { listSkillPriorities, targetsFromPriorities, writeLegacyTargets } from "../setup/repo";

/**
 * Reading and writing what a learner is being trained for.
 *
 * Targets are replaced wholesale on save rather than diffed. An admin editing this list is stating
 * the whole of it — "these, in this order" — and a merge would leave a target they deleted alive
 * because the form happened not to mention it. The ids are preserved across a save where the skill
 * is unchanged, so a reorder does not read as a delete and an insert in the audit log.
 */

export interface LearnerFocus {
  track: LearnerTrack | null;
  stack: string | null;
  yearsExperience: number | null;
  selfLevel: number | null;
  targets: LearnerTarget[];
}

/**
 * Always High-first, then by position: the order everything downstream is entitled to assume.
 *
 * v4: a projection of `learner_skill_priorities` (Critical and High → high, Medium → medium,
 * Low and Optional → low), so every v3 reader sees the admin's current sliders.
 */
export function listTargets(db: Db, userId: string): LearnerTarget[] {
  return orderedTargets(targetsFromPriorities(listSkillPriorities(db, userId)));
}

/** The track, the stack and the targets in one read — what the assessment builder needs. */
export function getFocus(db: Db, userId: string): LearnerFocus {
  const profile = db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get();
  return {
    track: (profile?.track as LearnerTrack | null) ?? null,
    stack: profile?.stack ?? null,
    yearsExperience: profile?.yearsExperience ?? null,
    selfLevel: profile?.selfLevel ?? null,
    targets: listTargets(db, userId),
  };
}

/**
 * Replaces this learner's targets.
 *
 * `position` is rewritten from the order given rather than trusted from the client: the form sends
 * what the admin dragged into place, and two targets claiming position 0 would make the ordering
 * depend on row insertion order, which is not a thing anybody dragged.
 */
export function setTargets(db: Db, userId: string, targets: readonly LearnerTarget[]): LearnerTarget[] {
  // v4: written through to the slider table. Kept for the v3 `/targets` endpoint for one release.
  writeLegacyTargets(db, userId, orderedTargets(targets), null, null);
  return listTargets(db, userId);
}

export interface FocusPatch {
  track?: LearnerTrack | null;
  stack?: string | null;
  yearsExperience?: number | null;
  selfLevel?: number | null;
}

/**
 * Writes the track and stack onto the profile.
 *
 * An upsert rather than an update: a learner onboarded before this existed may have no profile row
 * at all, and the track is required from now on, so the first save has to be able to create one.
 */
export function setFocus(db: Db, userId: string, patch: FocusPatch, actorId: string): void {
  const timestamp = now();
  const current = db.select().from(schema.learnerProfiles).where(eq(schema.learnerProfiles.userId, userId)).get();

  const values = {
    userId,
    roleTitle: current?.roleTitle ?? null,
    yearsExperience: patch.yearsExperience !== undefined ? patch.yearsExperience : (current?.yearsExperience ?? null),
    adminNotes: current?.adminNotes ?? "",
    claimedSkills: current?.claimedSkills ?? [],
    targetTracks: current?.targetTracks ?? [],
    track: patch.track !== undefined ? patch.track : (current?.track ?? null),
    stack: patch.stack !== undefined ? patch.stack : (current?.stack ?? null),
    selfLevel: patch.selfLevel !== undefined ? patch.selfLevel : (current?.selfLevel ?? null),
    updatedAt: timestamp,
    updatedBy: actorId,
  };

  db.insert(schema.learnerProfiles)
    .values(values)
    .onConflictDoUpdate({ target: schema.learnerProfiles.userId, set: values })
    .run();
}
