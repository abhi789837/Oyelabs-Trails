import { z } from "zod";

import { displayNameSchema, passwordSchema, usernameSchema } from "./auth";
import { assessmentStatusSchema, roleSchema, skillLevelSchema, userStatusSchema } from "./enums";
import { learnerProfileSchema } from "./profile";

/**
 * Onboarding a learner (brief §13). `password` is optional: leaving it out makes the server
 * generate a readable temporary one and return it exactly once, which is the path the admin UI
 * uses by default.
 */
export const onboardLearnerRequestSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  password: passwordSchema.optional(),
  profile: learnerProfileSchema,
  /** The default at onboarding: queue the assessment blueprint as soon as the account exists. */
  issueAssessment: z.boolean().default(true),
});
export type OnboardLearnerRequest = z.infer<typeof onboardLearnerRequestSchema>;

/** One row of the admin People table. */
export const userSummarySchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  role: roleSchema,
  status: userStatusSchema,
  mustChangePassword: z.boolean(),
  createdAt: z.number(),
  lastLoginAt: z.number().nullable(),
  roleTitle: z.string().nullable(),
  yearsExperience: z.number().nullable(),
  /** Null until an assessment has been issued. */
  assessmentStatus: assessmentStatusSchema.nullable(),
  overallLevel: skillLevelSchema.nullable(),
  hardWarnings: z.number(),
  planTopicCount: z.number(),
  planCompletedCount: z.number(),
});
export type UserSummary = z.infer<typeof userSummarySchema>;

export const onboardLearnerResponseSchema = z.object({
  user: userSummarySchema,
  /** Present only when the server generated the password. Shown once, never retrievable again. */
  temporaryPassword: z.string().optional(),
});
export type OnboardLearnerResponse = z.infer<typeof onboardLearnerResponseSchema>;

export const updateProfileRequestSchema = z.object({ profile: learnerProfileSchema });
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const resetPasswordRequestSchema = z.object({
  /** Omit to have the server generate one. */
  password: passwordSchema.optional(),
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const resetPasswordResponseSchema = z.object({ temporaryPassword: z.string().optional() });
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>;

export const setUserStatusRequestSchema = z.object({ status: userStatusSchema });
export type SetUserStatusRequest = z.infer<typeof setUserStatusRequestSchema>;

export const listUsersResponseSchema = z.object({ users: z.array(userSummarySchema) });
export type ListUsersResponse = z.infer<typeof listUsersResponseSchema>;

export const learnerDetailSchema = z.object({
  user: userSummarySchema,
  profile: learnerProfileSchema,
});
export type LearnerDetail = z.infer<typeof learnerDetailSchema>;
