import { create } from "zustand";

import type { ManifestResponse, ServedModule, TrackMeta } from "@shared/content";

import { api, ApiRequestError } from "@/api/client";

type Status = "idle" | "loading" | "ready" | "error";

interface CurriculumState {
  status: Status;
  tracks: TrackMeta[];
  /** The learner's plan, in order. Empty for a superadmin, who sees everything. */
  planTopicIds: string[];
  planVersion: number | null;
  unfiltered: boolean;
  error: string | null;
  load: () => Promise<void>;
  /** Called on sign-out so the next person does not briefly see the previous one's plan. */
  reset: () => void;
}

/**
 * The table of contents, fetched per person.
 *
 * In v2 this was a generated file bundled into the SPA. From v3 the server decides what each
 * person may see, so the manifest arrives over the wire and the whole UI — sidebar, trail maps,
 * search, dashboard, prev/next — reads from here (brief §7.3).
 */
export const useCurriculumStore = create<CurriculumState>()((set, get) => ({
  status: "idle",
  tracks: [],
  planTopicIds: [],
  planVersion: null,
  unfiltered: false,
  error: null,

  load: async () => {
    if (get().status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const result = await api.get<ManifestResponse>("/api/me/manifest");
      set({
        status: "ready",
        tracks: result.tracks,
        planTopicIds: result.planTopicIds,
        planVersion: result.planVersion,
        unfiltered: result.unfiltered,
        error: null,
      });
    } catch (error) {
      set({
        status: "error",
        error: error instanceof ApiRequestError ? error.message : "Could not load the curriculum.",
      });
    }
  },

  reset: () =>
    set({ status: "idle", tracks: [], planTopicIds: [], planVersion: null, unfiltered: false, error: null }),
}));

// ---------------------------------------------------------------------------
// Module content
// ---------------------------------------------------------------------------

const moduleCache = new Map<string, ServedModule>();
const inFlight = new Map<string, Promise<ServedModule>>();

export function getCachedModule(trackId: string, moduleId: string): ServedModule | undefined {
  return moduleCache.get(`${trackId}/${moduleId}`);
}

/**
 * Fetches one camp's full content. Cached for the session and de-duplicated, so opening several
 * topics in the same camp is a single request — the same contract the bundled loader had.
 */
export function loadModule(trackId: string, moduleId: string): Promise<ServedModule> {
  const key = `${trackId}/${moduleId}`;
  const cached = moduleCache.get(key);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = api
    .get<ServedModule>(`/api/content/modules/${trackId}/${moduleId}`)
    .then((mod) => {
      moduleCache.set(key, mod);
      return mod;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}

/** Content is per-person, so signing out must drop it along with the manifest. */
export function clearModuleCache(): void {
  moduleCache.clear();
  inFlight.clear();
}
