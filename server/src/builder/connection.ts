import { and, eq, inArray } from "drizzle-orm";

import { isLegacyResearchNotice } from "../../../shared/builder";
import { connectedLine, problemLine, type ResearchCheck } from "../../../shared/connection";
import type { AiService } from "../ai/service";
import { schema, type Db } from "../db";
import type { Env } from "../env";
import { enqueue, wakeWaitingJobs } from "../jobs/queue";
import { now } from "../lib/ids";
import { classifyThrown, ProviderError, type SearchClient } from "./providers";
import { getResearchProvider, PROVIDER_NAMES, writeResearchCheck, type ResearchProviderResult } from "./settings";
import type { ResearchProviderId } from "./research";

/**
 * v4.5 Phase 0: "is it connected?", answered in one place.
 *
 * `getResearchProvider` (settings.ts) and `getAIProvider` (here) read the saved settings fresh on
 * every call. Everything that decides whether a new course can be made goes through them: the
 * path builder (`requestCourse`), the `course.generate` worker, the path banners, the learner page
 * status line, the inbox and the Test button.
 */

export type AiProviderResult = { ok: true } | { ok: false; state: "not_set_up"; reason: string };

/** The AI connection, read fresh (AiService reads the active credential from the database each call). */
export function getAIProvider(ai: Pick<AiService, "isConfigured">): AiProviderResult {
  return ai.isConfigured() ? { ok: true } : { ok: false, state: "not_set_up", reason: problemLine("ai", "not_set_up") };
}

/** A query every search service answers, so 0 results means something is wrong, not the query. */
export const TEST_QUERY = "JavaScript closures explained";
/** A long-lived public video (Namaste JavaScript, the event loop): one cheap videos.list call. */
const TEST_VIDEO_ID = "8zKuNo4ay8E";

function failureMessage(error: ProviderError, providerName: string): string {
  switch (error.state) {
    case "key_rejected":
      return `${providerName} rejected the key. Check it was copied in full and is a ${providerName} key, then save it again.`;
    case "quota":
      return `The ${providerName} key works, but its quota is used up. Raise the plan or wait for it to reset. Waiting courses start on their own after.`;
    case "unreachable":
      return `Our server can't reach ${providerName}. Check the server's internet access or firewall. We'll keep trying every 10 minutes.`;
    case "temporary":
      return `${providerName} had a temporary problem. We'll try again on our own.`;
  }
}

/**
 * Admin → AI connection → Test: a real search from the server with the saved key, and (when a
 * YouTube key is saved) one video lookup. The result is stored so the page and the inbox can show
 * it, and a passing test wakes every blocked course job at once.
 */
export async function testResearch(deps: { db: Db; env: Env; clients?: () => ResearchProviderResult }): Promise<ResearchCheck & { woken: number }> {
  const research = deps.clients ? deps.clients() : getResearchProvider(deps.db, deps.env);
  const checkedAt = now();
  if (!research.ok) {
    const check: ResearchCheck = { state: "not_set_up", message: `Not set up: ${research.detail}`, results: null, videos: null, checkedAt };
    writeResearchCheck(deps.db, check);
    return { ...check, woken: 0 };
  }
  const providerName = PROVIDER_NAMES[research.provider];
  let results: number;
  try {
    results = (await research.search.search(TEST_QUERY, 5)).length;
  } catch (error) {
    const failure = classifyThrown(error, "search");
    const check: ResearchCheck = { state: failure.state, message: failureMessage(failure, providerName), results: null, videos: null, checkedAt };
    writeResearchCheck(deps.db, check);
    return { ...check, woken: 0 };
  }

  let videos: ResearchCheck["videos"] = "missing";
  if (research.videos) {
    try {
      await research.video.lookup(TEST_VIDEO_ID);
      videos = "ok";
    } catch (error) {
      videos = classifyThrown(error, "youtube").state === "key_rejected" ? "rejected" : "error";
    }
  }
  const videoNote =
    videos === "ok"
      ? " The YouTube key works too."
      : videos === "missing"
        ? " No YouTube key is saved, so new lessons won't have a video."
        : videos === "rejected"
          ? " The YouTube key was rejected, so new lessons won't have a video until it's fixed."
          : " The YouTube check failed this time; lessons may come without a video.";
  const check: ResearchCheck = { state: "ready", message: `${connectedLine(results)}.${videoNote}`, results, videos, checkedAt };
  writeResearchCheck(deps.db, check);
  const woken = wakeWaitingJobs(deps.db, "course.generate");
  return { ...check, woken };
}

/**
 * Wraps the search client for one job: records whether any search worked and the first failure.
 * The pipeline swallows a failed query (one bad query is not a bad lesson), so without this a
 * rejected key would surface as "the course had no sources" instead of its real reason.
 */
export function watchSearch(client: SearchClient): { client: SearchClient; problem: () => ProviderError | null } {
  let worked = 0;
  let first: ProviderError | null = null;
  return {
    client: {
      id: client.id,
      search: async (query, limit) => {
        try {
          const hits = await client.search(query, limit);
          worked += 1;
          return hits;
        } catch (error) {
          first ??= classifyThrown(error, "search");
          throw error;
        }
      },
    },
    problem: () => (worked === 0 ? first : null),
  };
}

/** The `course.generate` jobs parked until setup is fixed. */
function blockedJobs(db: Db) {
  return db
    .select({ id: schema.jobs.id, lastError: schema.jobs.lastError })
    .from(schema.jobs)
    .where(and(eq(schema.jobs.type, "course.generate"), eq(schema.jobs.status, "waiting_setup")))
    .all();
}

function relabel(db: Db, line: string): void {
  db.update(schema.jobs)
    .set({ lastError: line })
    .where(and(eq(schema.jobs.type, "course.generate"), eq(schema.jobs.status, "waiting_setup")))
    .run();
}

/**
 * v4.5.1: a saved search service failed during a course job and the job carried on with the AI's
 * own research. The failure is stored as the last check (shown on the AI connection page and in
 * the inbox), so the admin learns the key needs a look while new courses keep being made.
 */
export function noteProviderFallback(db: Db, provider: ResearchProviderId, failure: ProviderError): void {
  const message = `${failureMessage(failure, PROVIDER_NAMES[provider])} Until then, new courses are researched with the AI connection instead.`;
  writeResearchCheck(db, { state: failure.state, message, results: null, videos: null, checkedAt: now() });
}

/**
 * v4.5.1: current paths still carrying a pre-v4.4 research notice get one fresh `path.build` each
 * (unless one is already queued or running) and the notice is cleared, so it can't fire twice.
 * The rebuild asks for the missing courses through `requestCourse`, which now makes them with the
 * AI connection alone. Returns how many paths were queued.
 */
export function rebuildLegacyBlockedPaths(db: Db): number {
  const paths = db
    .select({ id: schema.learningPaths.id, userId: schema.learningPaths.userId, notice: schema.learningPaths.notice })
    .from(schema.learningPaths)
    .where(eq(schema.learningPaths.current, true))
    .all()
    .filter((path) => isLegacyResearchNotice(path.notice));
  if (paths.length === 0) return 0;
  const busy = new Set(
    db
      .select({ payload: schema.jobs.payload })
      .from(schema.jobs)
      .where(and(eq(schema.jobs.type, "path.build"), inArray(schema.jobs.status, ["queued", "running"])))
      .all()
      .map((job) => (job.payload as { userId?: string }).userId),
  );
  let queued = 0;
  for (const path of paths) {
    db.update(schema.learningPaths).set({ notice: null }).where(eq(schema.learningPaths.id, path.id)).run();
    if (busy.has(path.userId)) continue;
    enqueue(db, { type: "path.build", payload: { userId: path.userId } });
    busy.add(path.userId);
    queued += 1;
  }
  return queued;
}

/**
 * The scheduled re-check (every 10 minutes, and once at boot).
 *
 * v4.5.1: only the AI credential can block a new course now. With no working AI credential the
 * blocked lines are rewritten to say so; with one, every blocked course is woken (each one researches
 * with the search service, the AI's web search or the AI's own knowledge as it runs), and paths
 * built before v4.4 with a "no research provider" notice are built again. A woken job checks the AI
 * again as it runs, so a wrong guess costs one parked job, never a lost one.
 */
export async function recheckBlocked(deps: { db: Db; env: Env; ai: Pick<AiService, "isConfigured">; clients?: () => ResearchProviderResult }): Promise<number> {
  const ai = getAIProvider(deps.ai);
  if (!ai.ok) {
    relabel(deps.db, ai.reason);
    return 0;
  }
  rebuildLegacyBlockedPaths(deps.db);
  if (blockedJobs(deps.db).length === 0) return 0;
  return wakeWaitingJobs(deps.db, "course.generate");
}
