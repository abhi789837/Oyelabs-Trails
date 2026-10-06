import type { ApiError } from "@shared/api";
import { ERROR_CODES, type ErrorCode } from "@shared/apiCodes";

import { takePrefetched } from "./prefetch";

/**
 * The one place the SPA talks to the server.
 *
 * The API is same-origin in both environments (Vite proxies /api in development), so the session
 * cookie rides along without any CORS or token handling here.
 */

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }

  /** True when signing in again would fix it. */
  get isUnauthenticated(): boolean {
    return this.code === ERROR_CODES.UNAUTHENTICATED;
  }

  get needsPasswordChange(): boolean {
    return this.code === ERROR_CODES.PASSWORD_CHANGE_REQUIRED;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ApiError).error?.code === "string"
  );
}

/** A prefetched response still honours the caller's abort signal. */
function withAbort(response: Promise<Response>, signal?: AbortSignal): Promise<Response> {
  if (!signal) return response;
  if (signal.aborted) return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
  return new Promise<Response>((resolve, reject) => {
    const onAbort = () => reject(new DOMException("The operation was aborted.", "AbortError"));
    signal.addEventListener("abort", onAbort, { once: true });
    response.then(
      (r) => {
        signal.removeEventListener("abort", onAbort);
        resolve(r);
      },
      (e: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(e);
      },
    );
  });
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;

  let response: Response;
  try {
    // v5: a GET the route started at app start (src/api/prefetch.ts). Empty for the old UI.
    const prefetched = method === "GET" && body === undefined ? takePrefetched(path) : null;
    response = prefetched
      ? await withAbort(prefetched, signal)
      : await fetch(path, {
          method,
          credentials: "same-origin",
          headers: body === undefined ? undefined : { "content-type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal,
        });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    // A network failure is not something the caller can branch on by code, but it should still
    // arrive as the same error type so every call site has one thing to catch.
    throw new ApiRequestError(0, ERROR_CODES.INTERNAL, "Could not reach the server. Check your connection.");
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let payload: unknown = undefined;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = undefined;
    }
  }

  if (!response.ok) {
    if (isApiError(payload)) {
      throw new ApiRequestError(
        response.status,
        payload.error.code as ErrorCode,
        payload.error.message,
        payload.error.fields,
      );
    }
    throw new ApiRequestError(response.status, ERROR_CODES.INTERNAL, `Request failed (${response.status}).`);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => apiFetch<T>(path, { method: "GET", signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) => apiFetch<T>(path, { method: "POST", body: body ?? {}, signal }),
  put: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PUT", body: body ?? {} }),
  /** For a partial update — moving one weekly-plan item rather than replacing the week. */
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PATCH", body: body ?? {} }),
  /* A body on a DELETE is unusual but correct here: deleting a user carries the typed confirmation
     and the reason, and neither belongs in a URL that ends up in a proxy log. */
  del: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "DELETE", ...(body === undefined ? {} : { body }) }),
};
