import { ERROR_CODES, type ApiError, type ErrorCode } from "@shared/api";

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

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;

  let response: Response;
  try {
    response = await fetch(path, {
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
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "POST", body: body ?? {} }),
  put: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PUT", body: body ?? {} }),
  del: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
