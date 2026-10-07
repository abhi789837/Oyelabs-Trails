import { eq } from "drizzle-orm";

import type { Env } from "../env";
import { hint, open, seal } from "../crypto/secretBox";
import { schema, type Db } from "../db";
import { now } from "../lib/ids";
import { problemLine, RESEARCH_CHECK_META_KEY, type ResearchCheck } from "../../../shared/connection";
import { makeSearchClient, makeVideoClient, NO_VIDEO_CLIENT, type SearchClient, type VideoClient } from "./providers";
import type { ResearchProviderId } from "./research";

/**
 * The research keys: stored sealed, read only where a client is built.
 *
 * Mirrors `ai/credentials.ts` deliberately, down to the shape of `revealSearchKey`. Two encrypted
 * secrets in one codebase should be handled identically, because the moment they differ is the
 * moment somebody reasons about one by looking at the other and gets it wrong.
 *
 * Nothing here returns plaintext to a caller that could hand it to a route. `researchClients()`
 * decrypts, builds the clients and drops the strings — the key never becomes a value anything
 * outside this module holds.
 */

const SETTINGS_ROW = "singleton";

/** What a route may see: which provider, whether keys exist, and their last four characters. */
export interface ResearchSettingsView {
  provider: ResearchProviderId | null;
  searchHint: string | null;
  youtubeHint: string | null;
  budgetTokens: number;
  budgetSearches: number;
  /**
   * True when a search service is picked (or clear from the key) and its key is saved. v4.5: the
   * YouTube key is no longer required; `videosConfigured` says whether lessons get a video.
   */
  configured: boolean;
  videosConfigured: boolean;
  /** The provider the saved key is used with (the saved one, or Tavily for a "tvly-" key). */
  effectiveProvider: ResearchProviderId | null;
  /** The last Test or re-check, if any. */
  lastCheck: ResearchCheck | null;
  updatedAt: number | null;
}

export function readResearchCheck(db: Db): ResearchCheck | null {
  const raw = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, RESEARCH_CHECK_META_KEY)).get()?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ResearchCheck;
  } catch {
    return null;
  }
}

export function writeResearchCheck(db: Db, check: ResearchCheck): void {
  const value = JSON.stringify(check);
  db.insert(schema.appMeta)
    .values({ key: RESEARCH_CHECK_META_KEY, value, updatedAt: check.checkedAt })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: check.checkedAt } })
    .run();
}

function row(db: Db) {
  return db.select().from(schema.researchSettings).where(eq(schema.researchSettings.id, SETTINGS_ROW)).get();
}

export function getResearchSettings(db: Db, env?: Env): ResearchSettingsView {
  const found = row(db);
  const lastCheck = readResearchCheck(db);
  if (!found) {
    return {
      provider: null,
      searchHint: null,
      youtubeHint: null,
      budgetTokens: 400_000,
      budgetSearches: 60,
      configured: false,
      videosConfigured: false,
      effectiveProvider: null,
      lastCheck,
      updatedAt: null,
    };
  }
  /* With the env, "configured" is exactly what the worker will decide (keys decrypted). Without it
     (the inbox), it is read from what is stored, which is the same unless the master key changed. */
  const live = env ? getResearchProvider(db, env) : null;
  const effective = live?.ok ? live.provider : found.provider;
  return {
    provider: found.provider,
    searchHint: found.searchHint,
    youtubeHint: found.youtubeHint,
    budgetTokens: found.budgetTokens,
    budgetSearches: found.budgetSearches,
    configured: live ? live.ok : Boolean(found.provider && found.searchCiphertext),
    videosConfigured: Boolean(found.youtubeCiphertext),
    effectiveProvider: effective,
    lastCheck,
    updatedAt: found.updatedAt,
  };
}

export interface UpdateResearchInput {
  provider?: ResearchProviderId | null;
  /** Omitted leaves the stored key alone; an empty string clears it. */
  searchKey?: string;
  youtubeKey?: string;
  budgetTokens?: number;
  budgetSearches?: number;
  updatedBy: string;
}

/**
 * Writes the settings, sealing any key that was supplied.
 *
 * "Omitted means leave it" matters more than it looks: the admin form cannot show a stored key, so
 * saving a change to the budget with the key fields untouched must not wipe the keys. An empty
 * string is the explicit clear.
 */
export function updateResearchSettings(db: Db, env: Env, input: UpdateResearchInput): ResearchSettingsView {
  const existing = row(db);
  const timestamp = now();

  const sealedSearch =
    input.searchKey === undefined
      ? null
      : input.searchKey === ""
        ? { ciphertext: null, iv: null, tag: null, hint: null }
        : { ...seal(input.searchKey, env.masterKey), hint: hint(input.searchKey) };

  const sealedYoutube =
    input.youtubeKey === undefined
      ? null
      : input.youtubeKey === ""
        ? { ciphertext: null, iv: null, tag: null, hint: null }
        : { ...seal(input.youtubeKey, env.masterKey), hint: hint(input.youtubeKey) };

  const values = {
    provider: input.provider === undefined ? (existing?.provider ?? null) : input.provider,
    ...(sealedSearch
      ? {
          searchCiphertext: sealedSearch.ciphertext,
          searchIv: sealedSearch.iv,
          searchTag: sealedSearch.tag,
          searchHint: sealedSearch.hint,
        }
      : {}),
    ...(sealedYoutube
      ? {
          youtubeCiphertext: sealedYoutube.ciphertext,
          youtubeIv: sealedYoutube.iv,
          youtubeTag: sealedYoutube.tag,
          youtubeHint: sealedYoutube.hint,
        }
      : {}),
    budgetTokens: input.budgetTokens ?? existing?.budgetTokens ?? 400_000,
    budgetSearches: input.budgetSearches ?? existing?.budgetSearches ?? 60,
    updatedBy: input.updatedBy,
    updatedAt: timestamp,
  };

  if (existing) {
    db.update(schema.researchSettings).set(values).where(eq(schema.researchSettings.id, SETTINGS_ROW)).run();
  } else {
    db.insert(schema.researchSettings).values({ id: SETTINGS_ROW, ...values }).run();
  }
  return getResearchSettings(db, env);
}

/** The saved provider, or the one a stored key clearly belongs to (Tavily keys start "tvly-"). */
function effectiveProvider(found: NonNullable<ReturnType<typeof row>>, searchKey: string | null): ResearchProviderId | null {
  if (found.provider) return found.provider;
  if (searchKey?.trim().startsWith("tvly-")) return "tavily";
  return null;
}

function openSealed(ciphertext: string | null, iv: string | null, tag: string | null, env: Env): { key: string | null; unreadable: boolean } {
  if (!ciphertext || !iv || !tag) return { key: null, unreadable: false };
  try {
    return { key: open({ ciphertext, iv, tag }, env.masterKey), unreadable: false };
  } catch {
    // Saved under a different APP_MASTER_KEY: it can't be read here, so it has to be entered again.
    return { key: null, unreadable: true };
  }
}

export type ResearchProviderResult =
  | { ok: true; provider: ResearchProviderId; search: SearchClient; video: VideoClient; videos: boolean }
  | {
      ok: false;
      state: "not_set_up";
      /** The plain clause the path and status lines use ("the web search isn't set up"). */
      reason: string;
      /** What exactly is missing, for the admin's AI connection page. */
      detail: string;
    };

/**
 * v4.5 P0: the ONE place that decides whether the web search can be used, read fresh from the
 * database and decrypted on every call. The routes, the job worker, the banners and the path
 * builder all go through it (they run in one process with one APP_MASTER_KEY, so there is no
 * second copy of the settings anywhere to go stale).
 *
 * Only the search service and its key are required. The YouTube key is optional: without it, new
 * lessons are written without a video. (Until v4.5 a missing YouTube key blocked every new course
 * and was reported as "the web search isn't connected", which is the Phase 0 bug.)
 */
export function getResearchProvider(db: Db, env: Env): ResearchProviderResult {
  const notSetUp = (detail: string): ResearchProviderResult => ({ ok: false, state: "not_set_up", reason: problemLine("search", "not_set_up"), detail });
  const found = row(db);
  if (!found) return notSetUp("No search service is picked and no key is saved.");
  const search = openSealed(found.searchCiphertext, found.searchIv, found.searchTag, env);
  if (search.unreadable) return notSetUp("The saved search key can't be read on this server (the app's master key changed). Enter the key again.");
  const provider = effectiveProvider(found, search.key);
  if (!provider) return notSetUp(search.key ? "A search key is saved, but no search service is picked. Pick the one the key is for." : "No search service is picked.");
  if (!search.key) return notSetUp(`No key for ${PROVIDER_NAMES[provider]} is saved.`);

  const youtube = openSealed(found.youtubeCiphertext, found.youtubeIv, found.youtubeTag, env);
  return {
    ok: true,
    provider,
    search: makeSearchClient(provider, search.key),
    video: youtube.key ? makeVideoClient(youtube.key) : NO_VIDEO_CLIENT,
    videos: Boolean(youtube.key),
  };
}

export const PROVIDER_NAMES: Record<ResearchProviderId, string> = { tavily: "Tavily", brave: "Brave Search", serper: "Serper" };

/** Kept for older callers and tests: the same check as `getResearchProvider`. */
export function researchClients(db: Db, env: Env): ResearchProviderResult {
  return getResearchProvider(db, env);
}
