import { z } from "zod";

import { skillLevelSchema, trackIdSchema } from "./enums";

/**
 * A skill the admin claims for the learner during onboarding. `area` is free text so the admin is
 * not boxed in by our track names, but the onboarding UI offers the curriculum's module names.
 */
export const claimedSkillSchema = z.object({
  area: z.string().trim().min(1).max(80),
  level: skillLevelSchema,
  note: z.string().trim().max(400).optional(),
});
export type ClaimedSkill = z.infer<typeof claimedSkillSchema>;

export const learnerProfileSchema = z.object({
  roleTitle: z.string().trim().max(120).nullable(),
  yearsExperience: z.number().min(0).max(60).nullable(),
  /** Free-text notes: what they know, how they perform, their background. Feeds the blueprint. */
  adminNotes: z.string().max(20_000),
  claimedSkills: z.array(claimedSkillSchema).max(40),
  targetTracks: z.array(trackIdSchema).max(12),
});
export type LearnerProfile = z.infer<typeof learnerProfileSchema>;

export const emptyLearnerProfile: LearnerProfile = {
  roleTitle: null,
  yearsExperience: null,
  adminNotes: "",
  claimedSkills: [],
  targetTracks: [],
};
