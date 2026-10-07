import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";

import type { AiService } from "../ai/service";
import type { ContentStore } from "../content/store";
import { schema, type Db } from "../db";
import { classifyThrown, type SearchClient } from "./providers";
import type { SearchHit } from "./research";
import { normaliseSkill } from "./scoring";

/**
 * v4.5.1: research for a new course with only the AI credential.
 *
 * When no search service (Tavily/Brave/Serper) is saved, the builder still makes the course. Where
 * the candidates come from, in order:
 *
 * 1. **The AI's own web search** (`ai_web_search`), when the active credential has one: Anthropic's
 *    server-side `web_search` tool, the Claude Code CLI's WebSearch tool, OpenAI's Responses search.
 * 2. **Sources we already trust**: the shared resources list (every live link the library's courses
 *    cite) and the curriculum's verified references, matched to the query by their words.
 * 3. **Official docs the AI proposes** (`ai_only`, or when a web search returned nothing or failed).
 *
 * None of these is trusted as given. The pipeline opens every candidate from our server
 * (`verifyLinks`, through the SSRF-safe fetch) and a lesson may only cite what resolved, so an
 * invented URL costs a fetch and is dropped like any dead link. Nothing here throws: a failed AI
 * call means fewer candidates, and a lesson with no verified source is skipped as before.
 */

export type AiResearchKind = "ai-web-search" | "ai-knowledge";

export interface AiResearchDeps {
  ai: Pick<AiService, "generateJson"> & Partial<Pick<AiService, "webSearch" | "webSearchAvailable">>;
  db: Db;
  content?: ContentStore;
  meta: { subjectUserId?: string; courseId?: string };
  /** Whether to try the AI's web search first. */
  webSearch: boolean;
  log?: (message: string) => void;
}

// ---------------------------------------------------------------------------
// Sources we already trust
// ---------------------------------------------------------------------------

/** Every source the library's courses cite, once each: the shared resources list. */
export function libraryResources(db: Db) {
  const rows = db
    .select({
      url: schema.courseSources.url,
      title: schema.courseSources.title,
      kind: schema.courseSources.kind,
      courseId: schema.courses.id,
      courseTitle: schema.courses.title,
      skill: schema.generatedCourses.skill,
      departmentId: schema.generatedCourses.departmentId,
      deadSince: schema.courseSources.deadSince,
    })
    .from(schema.courseSources)
    .innerJoin(schema.courses, eq(schema.courses.id, schema.courseSources.courseId))
    .innerJoin(schema.generatedCourses, eq(schema.generatedCourses.courseId, schema.courses.id))
    .where(and(eq(schema.generatedCourses.library, true), eq(schema.courses.published, true), isNotNull(schema.courseSources.url)))
    .all();
  const seen = new Set<string>();
  return rows
    .filter((row) => row.deadSince == null && !seen.has(row.url) && Boolean(seen.add(row.url)))
    .map(({ deadSince: _dead, ...row }) => row);
}

const STOP = new Set(["and", "the", "for", "with", "how", "what", "why", "when", "to", "in", "on", "of", "a", "an", "is", "are", "your", "you", "use", "using", "guide", "tutorial", "explained", "introduction", "intro", "basics", "docs", "documentation"]);

function wordsOf(text: string): Set<string> {
  return new Set(
    normaliseSkill(text)
      .replace(/[^a-z0-9.+#]+/g, " ")
      .split(" ")
      .map((word) => word.replace(/^\.+|\.+$/g, ""))
      .filter((word) => word.length > 1 && !STOP.has(word))
      .map((word) => (word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word)),
  );
}

/** How well a source's words cover the query: shared words, and their share of the query. */
function match(query: Set<string>, text: string): number {
  if (query.size === 0) return 0;
  const words = wordsOf(text);
  let shared = 0;
  for (const word of query) if (words.has(word)) shared += 1;
  // Two shared words, or half the query, before a known source counts as relevant.
  return shared >= 2 || shared / query.size >= 0.5 ? shared / query.size : 0;
}

/** At most this many curriculum modules are read per query (each is a file read, cached). */
const MAX_MODULES_READ = 3;

/**
 * Known sources for one query: the shared resources list and the curriculum's references (module
 * references, and the topic references of the best-matching modules), best match first.
 */
export function knownSources(db: Db, content: ContentStore | undefined, query: string, limit: number): SearchHit[] {
  const wanted = wordsOf(query);
  const scored: { hit: SearchHit; score: number }[] = [];
  const add = (url: string, title: string, about: string, snippet: string) => {
    const score = match(wanted, `${title} ${about}`);
    if (score > 0) scored.push({ hit: { url, title, snippet, publishedAt: null }, score });
  };

  for (const row of libraryResources(db)) add(row.url, row.title ?? row.url, `${row.courseTitle} ${row.skill}`, `Cited by the library course "${row.courseTitle}".`);

  if (content) {
    const modules = content.manifest.flatMap((track) => track.modules.filter((mod) => mod.available).map((mod) => ({ track: track.id, mod })));
    for (const { mod } of modules) for (const ref of mod.refs ?? []) add(ref.url, ref.label, mod.name, `A reference for the curriculum module "${mod.name}".`);
    const best = modules
      .map((entry) => ({ ...entry, score: match(wanted, `${entry.mod.name} ${entry.mod.description}`) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_MODULES_READ);
    for (const { track, mod } of best) {
      const full = content.getModule(track, mod.id);
      for (const topic of full?.topics ?? []) {
        for (const ref of topic.webRefs) add(ref.url, ref.label, `${topic.title} ${mod.name}`, `A reference for the curriculum topic "${topic.title}".`);
      }
    }
  }

  const seen = new Set<string>();
  return scored
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.hit)
    .filter((hit) => !seen.has(hit.url) && Boolean(seen.add(hit.url)))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Official docs the AI proposes
// ---------------------------------------------------------------------------

export const proposalSchema = z.object({
  results: z
    .array(
      z.object({
        url: z.string().min(8).max(2000),
        title: z.string().max(300),
        snippet: z.string().max(600),
      }),
    )
    .max(8),
});

export const PROPOSE_SYSTEM = `You suggest reading material for one lesson of an internal engineering course.

Propose pages you are confident exist at exactly that URL, best first:
- the official documentation of the technology (for example developer.mozilla.org, react.dev, nodejs.org/docs, docs.python.org, postgresql.org/docs, docs.docker.com, kubernetes.io/docs);
- the specification or the project's own guide;
- a long-standing, well-known reference.

Rules:
- Every URL is opened by our server before anyone sees it. One that does not load is dropped, so never guess a deep link you are unsure of; a section's index page is better than an invented anchor.
- No content farms, no paywalled or login-only pages, no video sites.
- The snippet is one plain sentence on what the page covers.`;

export function buildProposeUser(query: string, limit: number): string {
  return `Lesson search: ${JSON.stringify(query)}\nPropose up to ${limit} pages.`;
}

function dedupe(hits: SearchHit[], limit: number): SearchHit[] {
  const seen = new Set<string>();
  const out: SearchHit[] = [];
  for (const hit of hits) {
    let key: string;
    try {
      const url = new URL(hit.url);
      if (url.protocol !== "https:" && url.protocol !== "http:") continue;
      url.hash = "";
      key = url.href;
    } catch {
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
    if (out.length >= limit) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The search client
// ---------------------------------------------------------------------------

/**
 * A `SearchClient` backed by the AI connection. Its id says which mode it ended up in: a web search
 * that fails once (not enabled for the organisation, a CLI without the tool) is not tried again in
 * the same job, and the rest of the course is researched from known sources and proposals.
 */
export function makeAiResearchClient(deps: AiResearchDeps): SearchClient & { readonly kind: AiResearchKind } {
  let webSearchOn = deps.webSearch && typeof deps.ai.webSearch === "function";
  const client = {
    get id(): AiResearchKind {
      return webSearchOn ? "ai-web-search" : "ai-knowledge";
    },
    get kind(): AiResearchKind {
      return webSearchOn ? "ai-web-search" : "ai-knowledge";
    },
    async search(query: string, limit: number): Promise<SearchHit[]> {
      let found: SearchHit[] = [];
      if (webSearchOn && deps.ai.webSearch) {
        try {
          found = await deps.ai.webSearch(query, limit, deps.meta);
        } catch (error) {
          webSearchOn = false;
          deps.log?.(`AI web search failed (${classifyThrown(error, "search").message}); using the AI's own knowledge for the rest of this course`);
        }
      }
      const known = knownSources(deps.db, deps.content, query, limit);
      let proposed: SearchHit[] = [];
      if (found.length === 0) {
        try {
          const result = await deps.ai.generateJson({
            purpose: "course_research",
            system: PROPOSE_SYSTEM,
            user: buildProposeUser(query, limit),
            schema: proposalSchema,
            schemaName: "proposed_sources",
            meta: deps.meta,
          });
          proposed = result.data.results.map((hit) => ({ url: hit.url.trim(), title: hit.title, snippet: hit.snippet, publishedAt: null }));
        } catch (error) {
          deps.log?.(`AI source proposals failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      // Search results first, then what we already trust, then proposals: verifyLinks keeps order
      // within a host preference, and stops at its cap.
      return dedupe([...found, ...known, ...proposed], Math.max(limit, 1) * 2);
    },
  };
  return client as SearchClient & { readonly kind: AiResearchKind };
}

/**
 * The saved search service first; once it fails (rejected key, used-up quota, unreachable), the
 * rest of this job uses the AI research client instead of waiting. `onFailure` hears the first
 * failure once, so the admin can be told the service needs a look while courses keep coming.
 */
export function withAiFallback(primary: SearchClient, fallback: SearchClient, onFailure: (error: ReturnType<typeof classifyThrown>) => void): SearchClient {
  let failed = false;
  return {
    get id() {
      return failed ? fallback.id : primary.id;
    },
    async search(query, limit) {
      if (!failed) {
        try {
          return await primary.search(query, limit);
        } catch (error) {
          failed = true;
          onFailure(classifyThrown(error, "search"));
        }
      }
      return fallback.search(query, limit);
    },
  };
}
