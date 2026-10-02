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
  /**
   * Defaults to `learner`, which is what this route is overwhelmingly used for.
   *
   * `superadmin` is deliberately not offerable: there is one, it is seeded at first boot, and a
   * route that can mint another is a route that can be used to take the deployment over. Promoting
   * someone is a deliberate, out-of-band act, not a dropdown.
   */
  role: z.enum(["learner", "admin"]).default("learner"),
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
  /** v4. Null for staff. */
  departmentId: z.string().nullable().default(null),
  /** v4 job track id. */
  trackId: z.string().nullable().default(null),
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

/**
 * Deleting a person, for real.
 *
 * The username is typed rather than clicked. Not theatre: this is the one action in the console with
 * no undo, and the difference between "disable" and "delete" is a word in a menu — typing the name
 * is the only step that cannot be completed by muscle memory.
 */
export const deleteUserRequestSchema = z.object({
  /** Must match the target's username exactly, lowercased. */
  confirmUsername: z.string().trim().min(1).max(64),
  /** Why. Stored on the audit row, since the row it describes will be gone. */
  reason: z.string().trim().max(500).optional(),
});
export type DeleteUserRequest = z.infer<typeof deleteUserRequestSchema>;

/** What a delete actually removed, so the confirmation can be specific and the audit row honest. */
export const deletionCountsSchema = z.object({
  sessions: z.number().int(),
  assessments: z.number().int(),
  integrityEvents: z.number().int(),
  snapshots: z.number().int(),
  plans: z.number().int(),
  weeks: z.number().int(),
  progress: z.number().int(),
  attempts: z.number().int(),
  certificates: z.number().int(),
  notifications: z.number().int(),
  generatedCourses: z.number().int(),
  /** Promoted to the catalogue, so kept and detached rather than deleted. */
  keptGlobalCourses: z.number().int(),
});
export type DeletionCounts = z.infer<typeof deletionCountsSchema>;

export const deleteUserResponseSchema = z.object({
  deleted: z.object({ id: z.string(), username: z.string(), displayName: z.string() }),
  counts: deletionCountsSchema,
});
export type DeleteUserResponse = z.infer<typeof deleteUserResponseSchema>;

/**
 * Everything the platform holds about one person, as a file.
 *
 * Offered before a delete, and downloadable on its own. It is their record: the profile an admin
 * wrote, what they were assessed on and how it went, what they completed, and what they earned.
 * Proctoring *images* are not in it — the events are, with their timestamps and severities, but a
 * JSON file full of base64 webcam frames is not something to hand around.
 */
export interface UserExport {
  exportedAt: number;
  exportedBy: string;
  user: { id: string; username: string; displayName: string; role: string; status: string; createdAt: number; lastLoginAt: number | null };
  profile: unknown;
  priorities: unknown;
  targets: unknown[];
  assessments: unknown[];
  evaluations: unknown[];
  integrity: unknown[];
  plans: unknown[];
  weeks: unknown[];
  progress: unknown[];
  attempts: unknown[];
  certificates: unknown[];
  courseProgress: unknown[];
  generatedCourses: unknown[];
}

export const listUsersResponseSchema = z.object({ users: z.array(userSummarySchema) });
export type ListUsersResponse = z.infer<typeof listUsersResponseSchema>;

export const learnerDetailSchema = z.object({
  user: userSummarySchema,
  profile: learnerProfileSchema,
});
export type LearnerDetail = z.infer<typeof learnerDetailSchema>;
