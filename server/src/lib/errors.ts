import type { ZodError, ZodType } from "zod";

import { ERROR_CODES, type ApiError, type ErrorCode } from "../../../shared/api";

/**
 * The only error type route handlers should throw. Anything else that escapes a handler is
 * logged with its stack and reported to the client as a generic 500, so internal details
 * (SQL, file paths, provider responses) never reach a browser.
 */
export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
  }

  toBody(): ApiError {
    return { error: { code: this.code, message: this.message, ...(this.fields ? { fields: this.fields } : {}) } };
  }
}

export const badRequest = (message = "That request was not valid.", fields?: Record<string, string>) =>
  new HttpError(400, ERROR_CODES.BAD_REQUEST, message, fields);

export const unauthenticated = (message = "Please sign in.") => new HttpError(401, ERROR_CODES.UNAUTHENTICATED, message);

export const forbidden = (message = "You do not have access to that.") => new HttpError(403, ERROR_CODES.FORBIDDEN, message);

/**
 * Used for content a learner has not been assigned as well as for things that truly do not exist,
 * so the response never reveals which (brief §6).
 */
export const notFound = (message = "Not found.") => new HttpError(404, ERROR_CODES.NOT_FOUND, message);

export const conflict = (message: string, fields?: Record<string, string>) =>
  new HttpError(409, ERROR_CODES.CONFLICT, message, fields);

export const locked = (message: string) => new HttpError(423, ERROR_CODES.LOCKED, message);

export const internal = (message = "Something went wrong.") => new HttpError(500, ERROR_CODES.INTERNAL, message);

/** Turns zod issues into `{ "field.path": "message" }` for inline form errors. */
export function fieldsFromZod(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}

/** Parses a request body/query and throws a 400 with per-field messages instead of a 500. */
export function parseOrThrow<T>(schema: ZodType<T>, value: unknown, message = "Please correct the highlighted fields."): T {
  const result = schema.safeParse(value);
  if (!result.success) throw badRequest(message, fieldsFromZod(result.error));
  return result.data;
}
