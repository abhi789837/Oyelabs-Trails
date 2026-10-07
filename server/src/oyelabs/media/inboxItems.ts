import { eq, isNotNull } from "drizzle-orm";

import { dismissKey, isDismissed, type InboxItem } from "../../../../shared/adminInbox";
import type { LinkProblem } from "../../../../shared/videoSources";
import { schema, type Db } from "../../db";

/**
 * v4.5 Phase 2: broken Oyelabs links in the admin inbox ("courses" group). One line per course:
 * "1 link in "White-label delivery" stopped working: This Drive video is private." It opens the
 * course editor, where each card shows the fix and "Check again". A link that works again clears
 * `broken_since`, and the line goes away by itself.
 *
 * "Mark as checked" hides the line until another link of that course breaks (the dismiss key carries
 * the newest break time). Drive/OneDrive/Box links shared with "Oyelabs" only look private to our
 * anonymous check, so this is how an admin says "that's on purpose".
 */
export function brokenLinkInboxItems(db: Db, dismissed: Readonly<Record<string, number>> = {}, at = Date.now()): InboxItem[] {
  const rows = [
    ...db
      .select({ courseId: schema.courseVideos.courseId, since: schema.courseVideos.brokenSince, problem: schema.courseVideos.problem, title: schema.courses.title })
      .from(schema.courseVideos)
      .innerJoin(schema.courses, eq(schema.courses.id, schema.courseVideos.courseId))
      .where(isNotNull(schema.courseVideos.brokenSince))
      .all(),
    ...db
      .select({ courseId: schema.courseDocs.courseId, since: schema.courseDocs.brokenSince, problem: schema.courseDocs.problem, title: schema.courses.title })
      .from(schema.courseDocs)
      .innerJoin(schema.courses, eq(schema.courses.id, schema.courseDocs.courseId))
      .where(isNotNull(schema.courseDocs.brokenSince))
      .all(),
  ];
  const byCourse = new Map<string, { title: string; since: number[]; problems: (LinkProblem | null)[] }>();
  for (const r of rows) {
    const entry = byCourse.get(r.courseId) ?? { title: r.title, since: [], problems: [] };
    entry.since.push(r.since ?? at);
    entry.problems.push(r.problem ?? null);
    byCourse.set(r.courseId, entry);
  }
  const items: InboxItem[] = [];
  for (const [courseId, c] of byCourse) {
    const key = dismissKey("courses", `links:${courseId}:${Math.max(...c.since)}`);
    if (isDismissed(dismissed, key, at)) continue;
    const n = c.since.length;
    const reason = c.problems.find(Boolean)?.message ?? "It can't be opened right now.";
    const title = c.title.length > 60 ? `${c.title.slice(0, 59)}…` : c.title;
    const href = `/admin/library/${courseId}/oyelabs`;
    items.push({
      id: `courses:links:${courseId}`,
      group: "courses",
      title: `${n} link${n === 1 ? "" : "s"} in "${title}" stopped working`,
      detail: n === 1 ? reason : `${reason} Open the course to see each one and how to fix it.`,
      at: Math.min(...c.since),
      href,
      action: { kind: "open", label: "Fix the link", href },
      secondary: { kind: "dismiss", label: "Mark as checked", key },
    });
  }
  return items;
}
