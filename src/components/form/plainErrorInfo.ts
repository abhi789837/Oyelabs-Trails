import { ERROR_CODES } from "@shared/api";

/**
 * v4.4 Phase 6: any failure as plain words for an admin, with the technical part kept for a
 * collapsed "Show details" (status, code and the raw message). Error codes are never in `message`.
 */

export interface PlainErrorAction {
  label: string;
  /** An in-app route. */
  to: string;
}

export interface PlainErrorInfo {
  message: string;
  /** Status, code and the original text, for "Show details". Null when there is nothing more. */
  details: string | null;
  action?: PlainErrorAction;
}

interface ErrorLike {
  status?: number;
  code?: string;
  message?: string;
}

/** Where an admin connects the AI; the research settings live on the same page. */
export const CONNECT_AI_ROUTE = "/admin/ai";

export function plainError(error: unknown, fallback = "That didn't work. Try again."): PlainErrorInfo {
  if (typeof error === "string") return { message: error, details: null };
  if (!error || typeof error !== "object") return { message: fallback, details: null };
  const e = error as ErrorLike;
  const raw = typeof e.message === "string" ? e.message.trim() : "";
  const details = e.status !== undefined || e.code ? [e.status ? `HTTP ${e.status}` : null, e.code ?? null, raw || null].filter(Boolean).join(" · ") : null;
  if (e.status === 0) return { message: "We couldn't reach Oyelearn. Check your internet connection, then try again.", details };
  if (e.code === ERROR_CODES.RATE_LIMITED || e.status === 429) return { message: "That was a lot of tries in a short time. Wait a minute, then try again.", details };
  if (e.code === ERROR_CODES.AI_NOT_CONFIGURED) return { message: "The AI isn't connected yet, so we couldn't do this. Connect it and we'll finish automatically after.", details, action: { label: "Connect it", to: CONNECT_AI_ROUTE } };
  if (e.code === ERROR_CODES.AI_OUTPUT_INVALID) return { message: "The AI gave an answer we couldn't use. Try again; it usually works the second time.", details };
  if (e.code === ERROR_CODES.UNAUTHENTICATED) return { message: "You were signed out. Sign in again, then try again.", details };
  if (e.code === ERROR_CODES.FORBIDDEN || e.status === 403) return { message: raw && !/^forbidden$/i.test(raw) ? raw : "Your account can't do this. Ask a super admin.", details };
  if (e.code === ERROR_CODES.INTERNAL || (e.status !== undefined && e.status >= 500)) return { message: "Something went wrong on our side. Try again in a minute.", details };
  // The server's own messages are written for people (the copy guide); show them as they are.
  return { message: raw || fallback, details };
}
