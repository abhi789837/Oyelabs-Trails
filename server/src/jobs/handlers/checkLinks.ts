import { eq, isNull } from "drizzle-orm";

import { schema, type Db } from "../../db";
import { now } from "../../lib/ids";
import type { Job } from "../queue";

/**
 * `links.check` — re-fetches every link a generated course cites.
 *
 * A course written today cites pages that were live today. Documentation moves, blogs get taken
 * down, and a course that quietly rots into a list of 404s is worse than no course, because a
 * learner reads the dead links as the platform's fault rather than the internet's.
 *
 * It **flags rather than deletes**. A page that 404s once may be a deployment, a rate limit, or a
 * host having a bad afternoon; and a lesson that silently loses two of its three references is a
 * lesson nobody chose to weaken. `dead_since` is a date an admin can act on, and it clears itself
 * the moment the link comes back.
 */
export function checkLinksHandler(deps: { db: Db; log?: (message: string) => void; fetchUrl?: typeof fetch }) {
  const fetchUrl = deps.fetchUrl ?? fetch;

  return async (_job: Job): Promise<void> => {
    const { db } = deps;
    const sources = db.select().from(schema.courseSources).all();
    if (sources.length === 0) return;

    let checked = 0;
    let newlyDead = 0;
    let revived = 0;

    for (const source of sources) {
      // A video is checked by the YouTube API elsewhere; fetching a watch page proves nothing,
      // since YouTube returns 200 for a removed video.
      if (source.kind === "video") continue;

      let status: number | null = null;
      try {
        /* HEAD first: most hosts answer it, and it avoids pulling a megabyte of HTML to learn a
           number. A host that rejects HEAD gets a GET, because rejecting HEAD is a quirk rather
           than a broken link. */
        const head = await fetchUrl(source.url, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(10_000),
        });
        status = head.status === 405 || head.status === 501 ? null : head.status;

        if (status === null) {
          const get = await fetchUrl(source.url, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
          status = get.status;
        }
      } catch {
        status = 0; // Unreachable: DNS, TLS, timeout. All the same to a reader.
      }

      checked += 1;
      const alive = status !== null && status >= 200 && status < 400;

      if (alive && source.deadSince !== null) revived += 1;
      if (!alive && source.deadSince === null) newlyDead += 1;

      db.update(schema.courseSources)
        .set({
          httpStatus: status,
          verifiedAt: now(),
          deadSince: alive ? null : (source.deadSince ?? now()),
        })
        .where(eq(schema.courseSources.id, source.id))
        .run();
    }

    deps.log?.(`link check: ${checked} checked, ${newlyDead} newly dead, ${revived} back from the dead`);
  };
}

/** Courses with at least one dead link, for the admin list's warning badge. */
export function coursesWithDeadLinks(db: Db): Map<string, number> {
  const rows = db
    .select({ courseId: schema.courseSources.courseId, deadSince: schema.courseSources.deadSince })
    .from(schema.courseSources)
    .all()
    .filter((row) => row.deadSince !== null);

  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.courseId, (counts.get(row.courseId) ?? 0) + 1);
  return counts;
}

/** Sources never verified — a course written before the check existed, or one mid-generation. */
export function unverifiedSources(db: Db) {
  return db.select().from(schema.courseSources).where(isNull(schema.courseSources.verifiedAt)).all();
}
