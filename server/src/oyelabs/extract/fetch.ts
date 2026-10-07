import {
  assertPublicUrl as assertPublic,
  BlockedUrlError,
  isBlockedAddress,
  safeFetch as mediaSafeFetch,
  type LookupFn,
} from "../media/safeFetch";

/**
 * Text gathering's view of builder B's shared `safeFetch` (server/src/oyelabs/media/safeFetch.ts):
 * no credentials, SSRF-guarded at every redirect hop, plus the PLAN §4.3 caps for documents
 * (50 MB, 20 s). An over-size body is refused rather than read half-way, and every failure becomes
 * a `SafeFetchError` with a plain message.
 */

export const FETCH_MAX_BYTES = 50 * 1024 * 1024;
export const FETCH_TIMEOUT_MS = 20_000;

export type { LookupFn };
export { isBlockedAddress };

export interface SafeFetchOptions {
  fetchImpl?: typeof fetch;
  lookup?: LookupFn;
  maxBytes?: number;
  timeoutMs?: number;
}

export interface SafeFetchResult {
  status: number;
  url: string;
  contentType: string;
  body: Buffer;
}

export class SafeFetchError extends Error {
  constructor(
    message: string,
    readonly code: "blocked" | "too_large" | "timeout" | "network",
  ) {
    super(message);
    this.name = "SafeFetchError";
  }
}

export async function safeFetch(input: string, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const maxBytes = options.maxBytes ?? FETCH_MAX_BYTES;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new SafeFetchError("That isn't a web address.", "blocked");
  }
  try {
    const response = await mediaSafeFetch(
      url,
      { timeoutMs: options.timeoutMs ?? FETCH_TIMEOUT_MS, maxBytes: maxBytes + 1 },
      { ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}), ...(options.lookup ? { lookup: options.lookup } : {}) },
    );
    if (response.truncated || response.body.length > maxBytes) throw new SafeFetchError("The file is bigger than 50 MB.", "too_large");
    return { status: response.status, url: response.url, contentType: (response.headers.get("content-type") ?? "").toLowerCase(), body: response.body };
  } catch (error) {
    if (error instanceof SafeFetchError) throw error;
    if (error instanceof BlockedUrlError) throw new SafeFetchError(error.message, "blocked");
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new SafeFetchError(timedOut ? "The page took too long to answer." : "We couldn't reach that page.", timedOut ? "timeout" : "network");
  }
}

/** Throws `SafeFetchError` unless the URL is http(s) on a public address (for ffmpeg, which fetches by itself). */
export async function assertPublicUrl(input: string, lookup?: LookupFn): Promise<void> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new SafeFetchError("That isn't a web address.", "blocked");
  }
  try {
    await assertPublic(url, lookup);
  } catch (error) {
    throw new SafeFetchError(error instanceof Error ? error.message : "That address is on a private network.", "blocked");
  }
}
