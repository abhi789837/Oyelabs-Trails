/**
 * Error codes with no zod import, so the client fetch wrapper (loaded on every page) does not pull
 * the schema library into the first download. `shared/api.ts` re-exports them.
 */

/** Error codes the client branches on. Anything else is treated as a generic failure. */
export const ERROR_CODES = {
  BAD_REQUEST: "bad_request",
  UNAUTHENTICATED: "unauthenticated",
  PASSWORD_CHANGE_REQUIRED: "password_change_required",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  RATE_LIMITED: "rate_limited",
  LOCKED: "locked",
  /** v4.3: the topic test is locked until every video of the topic is watched (409). */
  VIDEOS_UNWATCHED: "videos_unwatched",
  AI_NOT_CONFIGURED: "ai_not_configured",
  AI_OUTPUT_INVALID: "ai_output_invalid",
  INTERNAL: "internal",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
