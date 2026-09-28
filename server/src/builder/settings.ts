import { eq } from "drizzle-orm";

import type { Env } from "../env";
import { hint, open, seal } from "../crypto/secretBox";
import { schema, type Db } from "../db";
import { now } from "../lib/ids";
import { makeSearchClient, makeVideoClient, type SearchClient, type VideoClient } from "./providers";
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
  /** True when both a provider with a key and a YouTube key are present. */
  configured: boolean;
  updatedAt: number | null;
}

function row(db: Db) {
  return db.select().from(schema.researchSettings).where(eq(schema.researchSettings.id, SETTINGS_ROW)).get();
}

export function getResearchSettings(db: Db): ResearchSettingsView {
  const found = row(db);
  if (!found) {
    return {
      provider: null,
      searchHint: null,
      youtubeHint: null,
      budgetTokens: 400_000,
      budgetSearches: 60,
      configured: false,
      updatedAt: null,
    };
  }
  return {
    provider: found.provider,
    searchHint: found.searchHint,
    youtubeHint: found.youtubeHint,
    budgetTokens: found.budgetTokens,
    budgetSearches: found.budgetSearches,
    configured: Boolean(found.provider && found.searchCiphertext && found.youtubeCiphertext),
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
  return getResearchSettings(db);
}

/**
 * Builds the two clients, or returns why it cannot.
 *
 * Returning a reason rather than throwing, because "no research key is set up" is a perfectly
 * ordinary state — the platform works without one, it simply cannot *generate* courses — and the
 * admin screen says so in words rather than showing an error.
 */
export function researchClients(
  db: Db,
  env: Env,
): { ok: true; search: SearchClient; video: VideoClient } | { ok: false; reason: string } {
  const found = row(db);
  if (!found?.provider) {
    return { ok: false, reason: "No research provider is set up. Add one under Admin → AI connection." };
  }
  if (!found.searchCiphertext || !found.searchIv || !found.searchTag) {
    return { ok: false, reason: `No API key for ${found.provider}. Add one under Admin → AI connection.` };
  }
  if (!found.youtubeCiphertext || !found.youtubeIv || !found.youtubeTag) {
    return { ok: false, reason: "No YouTube API key. Add one under Admin → AI connection." };
  }

  const searchKey = open(
    { ciphertext: found.searchCiphertext, iv: found.searchIv, tag: found.searchTag },
    env.masterKey,
  );
  const youtubeKey = open(
    { ciphertext: found.youtubeCiphertext, iv: found.youtubeIv, tag: found.youtubeTag },
    env.masterKey,
  );

  return { ok: true, search: makeSearchClient(found.provider, searchKey), video: makeVideoClient(youtubeKey) };
}
