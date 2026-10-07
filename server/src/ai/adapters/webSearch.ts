import { z } from "zod";

import type { WebSearchHit } from "../types";

/**
 * v4.5.1: shared pieces of the providers' built-in web search.
 *
 * Every adapter ends here: hits are trimmed, made http(s)-only, de-duplicated by URL and capped.
 * Nothing here decides whether a page is *good*; the course builder opens every URL from our own
 * server before a lesson may cite it (builder/research.ts `verifyLinks`).
 */

/** What the CLI is asked to reply with after its WebSearch tool ran. */
export const cliSearchReplySchema = z.object({
  results: z
    .array(
      z.object({
        url: z.string().max(2000),
        title: z.string().max(500).default(""),
        snippet: z.string().max(2000).default(""),
      }),
    )
    .max(25),
});

/** The prompt for a tool-using model: search once, then list exactly what the search returned. */
export function searchInstruction(query: string, limit: number): string {
  return [
    `Use your web search tool once to search for: ${JSON.stringify(query)}`,
    `Then list up to ${limit} of the results the search returned, best first: official documentation and well-known references before blogs.`,
    "Copy each URL exactly as the search returned it. Never add a URL the search did not return, and never guess one.",
  ].join("\n");
}

export function normaliseHits(raw: readonly Partial<WebSearchHit>[], limit: number): WebSearchHit[] {
  const seen = new Set<string>();
  const out: WebSearchHit[] = [];
  for (const hit of raw) {
    const url = (hit.url ?? "").trim();
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      continue;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") continue;
    if (seen.has(parsed.href)) continue;
    seen.add(parsed.href);
    out.push({
      url: parsed.href,
      title: (hit.title ?? "").trim().slice(0, 300),
      snippet: (hit.snippet ?? "").trim().slice(0, 500),
      publishedAt: hit.publishedAt ?? null,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** Anthropic reports `page_age` loosely ("April 30, 2025", "3 days ago"); keep only real dates. */
export function isoOrNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
