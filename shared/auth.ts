import { z } from "zod";

import { roleSchema, userStatusSchema } from "./enums";

/** Brief §6: minimum 10 characters, and not the username or a common password. */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 200;

/**
 * Usernames are stored lowercase. Letters, digits, dot, dash and underscore only, so a username
 * is always safe in a URL and cannot be confused with an email or an id.
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(40, "Username must be at most 40 characters")
  .regex(/^[a-z0-9][a-z0-9._-]*$/, "Use letters, digits, dot, dash or underscore, starting with a letter or digit");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, "Password is too long");

export const displayNameSchema = z.string().trim().min(1, "Name is required").max(120);

export const loginRequestSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "Password is required").max(PASSWORD_MAX_LENGTH),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  newPassword: passwordSchema,
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

/** What `/api/auth/me` returns. Never includes the password hash or the session id. */
export const sessionUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  role: roleSchema,
  status: userStatusSchema,
  mustChangePassword: z.boolean(),
  lastLoginAt: z.number().nullable(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const meResponseSchema = z.object({
  user: sessionUserSchema.nullable(),
});
export type MeResponse = z.infer<typeof meResponseSchema>;

export const SESSION_COOKIE = "trails_sid";
/** 12 h sliding expiry, 7 day absolute cap (brief §6). */
export const SESSION_SLIDING_MS = 12 * 60 * 60 * 1000;
export const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;
/** Lock an account for 15 minutes after 8 failed logins (brief §6). */
export const LOGIN_MAX_FAILURES = 8;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;
