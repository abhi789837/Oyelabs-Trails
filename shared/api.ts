import { z } from "zod";

/**
 * Every error the API returns has this body. `code` is stable and machine-readable;
 * `message` is safe to show a user; `fields` carries per-field validation messages.
 */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const healthResponseSchema = z.object({
  ok: z.literal(true),
  name: z.literal("oyelearn"),
  version: z.string(),
  uptimeSec: z.number(),
  db: z.literal("ok"),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export { ERROR_CODES, type ErrorCode } from "./apiCodes";

/** Body size limits from brief §15. */
export const BODY_LIMIT_JSON = 64 * 1024;
export const BODY_LIMIT_SNAPSHOT = 200 * 1024;
