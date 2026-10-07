import { ERROR_CODES } from "../../../shared/api";
import { HttpError } from "../lib/errors";

/**
 * v4.5 contract stubs (docs/v4.5/PLAN.md). A route that exists so the API surface, the guards and
 * the 403 sweep in routes/admin/users.test.ts are in place before its builder writes it.
 * Every caller is a TODO for the builder named in the message; delete this file once none are left.
 */
export function notBuiltYet(owner: "A" | "B" | "C" | "D"): HttpError {
  return new HttpError(501, ERROR_CODES.INTERNAL, `Not built yet (v4.5 builder ${owner}).`);
}
