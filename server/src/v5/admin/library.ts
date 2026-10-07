import { and, count, eq, inArray, max } from "drizzle-orm";

import { schema, type Db } from "../../db";

/** What a course card says about it. */
export type LibraryStatus = "live" | "creating" | "needs-look" | "draft" | "not-used";

export interface LibraryCourse {
  id: string;
  title: string;
  summary: string;
  status: LibraryStatus;
  /** Made by our course writer rather than typed by a person. */
  generated: boolean;
  /** Who sees it once it's live: everyone, or only the people picked for it. */
  audience: "everyone" | "assigned";
  /** The plain reason a generated course needs a look. */
  reason: string | null;
  lessons: number;
  level: string | null;
  departmentId: string | null;
  /** v4.5: an Oyelabs course (badge; edited in the one-page Oyelabs editor). */
  oyelabs: boolean;
  /** v4.5: the departments whose library shows it (`course_departments`); empty = all departments. */
  departmentIds: string[];
  updatedAt: number;
  sources: { total: number; broken: number; lastVerifiedAt: number | null };
  versions: number;
}

export interface LibraryResponse {
  courses: LibraryCourse[];
  /** New courses still being written (queued or running), not yet in the list. */
  creating: number;
}

function statusOf(published: boolean, generated: string | undefined): LibraryStatus {
  if (generated === "draft") return "creating";
  if (generated === "needs_review" || generated === "pending_review") return "needs-look";
  if (generated === "rejected") return "not-used";
  return published ? "live" : "draft";
}

/** Every course with its status, lesson count, link health and how many saved versions it has. */
export function buildLibrary(db: Db): LibraryResponse {
  const courses = db.select().from(schema.courses).all();
  const generated = new Map(db.select().from(schema.generatedCourses).all().map((g) => [g.courseId, g]));
  const lessons = new Map(
    db.select({ courseId: schema.courseTopics.courseId, n: count() }).from(schema.courseTopics).groupBy(schema.courseTopics.courseId).all().map((r) => [r.courseId, r.n]),
  );
  const sources = new Map<string, { total: number; broken: number; lastVerifiedAt: number | null }>();
  for (const s of db.select({ courseId: schema.courseSources.courseId, dead: schema.courseSources.deadSince, at: schema.courseSources.verifiedAt }).from(schema.courseSources).all()) {
    const cur = sources.get(s.courseId) ?? { total: 0, broken: 0, lastVerifiedAt: null };
    cur.total += 1;
    if (s.dead !== null) cur.broken += 1;
    if (s.at !== null && (cur.lastVerifiedAt === null || s.at > cur.lastVerifiedAt)) cur.lastVerifiedAt = s.at;
    sources.set(s.courseId, cur);
  }
  const versionCounts = new Map(
    db
      .select({ id: schema.contentVersions.entityId, n: max(schema.contentVersions.version) })
      .from(schema.contentVersions)
      .where(eq(schema.contentVersions.entityType, "course"))
      .groupBy(schema.contentVersions.entityId)
      .all()
      .map((r) => [r.id, r.n ?? 0]),
  );
  const courseDepartments = new Map<string, string[]>();
  for (const row of db.select().from(schema.courseDepartments).all()) courseDepartments.set(row.courseId, [...(courseDepartments.get(row.courseId) ?? []), row.departmentId]);
  const creating = db
    .select({ n: count() })
    .from(schema.jobs)
    .where(and(eq(schema.jobs.type, "course.generate"), inArray(schema.jobs.status, ["queued", "running", "waiting_setup"])))
    .get()?.n ?? 0;

  const order: Record<LibraryStatus, number> = { "needs-look": 0, creating: 1, draft: 2, live: 3, "not-used": 4 };
  return {
    creating,
    courses: courses
      .map((c) => {
        const g = generated.get(c.id);
        return {
          id: c.id,
          title: c.title,
          summary: c.summary,
          status: statusOf(c.published, g?.status),
          generated: Boolean(g),
          audience: c.audience,
          reason: g?.status === "needs_review" ? (g.reviewReason ?? null) : null,
          lessons: lessons.get(c.id) ?? 0,
          level: c.level ?? null,
          departmentId: c.departmentId ?? null,
          oyelabs: c.oyelabs,
          departmentIds: (courseDepartments.get(c.id) ?? []).sort(),
          updatedAt: c.updatedAt,
          sources: sources.get(c.id) ?? { total: 0, broken: 0, lastVerifiedAt: null },
          versions: versionCounts.get(c.id) ?? 0,
        };
      })
      .sort((a, b) => order[a.status] - order[b.status] || b.updatedAt - a.updatedAt),
  };
}
