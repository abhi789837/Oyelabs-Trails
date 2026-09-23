import { and, desc, eq, isNotNull } from "drizzle-orm";

import type { SessionUser } from "../../../shared/auth";
import type { PlanSource } from "../../../shared/enums";
import type { ContentStore } from "../content/store";
import { schema, type Db } from "../db";
import { newId, now } from "../lib/ids";

export interface PublishedPlan {
  id: string;
  version: number;
  source: PlanSource;
  assessmentId: string | null;
  topicIds: string[];
  rationale: unknown;
  publishedAt: number;
}

export function latestPublishedPlan(db: Db, userId: string): PublishedPlan | null {
  const row = db
    .select()
    .from(schema.learningPlans)
    .where(and(eq(schema.learningPlans.userId, userId), isNotNull(schema.learningPlans.publishedAt)))
    .orderBy(desc(schema.learningPlans.version))
    .get();
  if (!row) return null;
  return {
    id: row.id,
    version: row.version,
    source: row.source,
    assessmentId: row.assessmentId,
    topicIds: row.topicIds,
    rationale: row.rationale,
    publishedAt: row.publishedAt!,
  };
}

export function planHistory(db: Db, userId: string): PublishedPlan[] {
  return db
    .select()
    .from(schema.learningPlans)
    .where(eq(schema.learningPlans.userId, userId))
    .orderBy(desc(schema.learningPlans.version))
    .all()
    .map((row) => ({
      id: row.id,
      version: row.version,
      source: row.source,
      assessmentId: row.assessmentId,
      topicIds: row.topicIds,
      rationale: row.rationale,
      publishedAt: row.publishedAt ?? 0,
    }));
}

/**
 * What this caller is allowed to see.
 *
 * A superadmin gets `null`, meaning "the whole curriculum". A learner gets exactly their latest
 * published plan — and an **empty set** when they have none, not the whole curriculum. Getting
 * this fallback wrong is the difference between a gated app and an open one, so it is explicit.
 */
export function allowedTopicIdsFor(db: Db, user: SessionUser): ReadonlySet<string> | null {
  if (user.role === "superadmin") return null;
  return new Set(latestPublishedPlan(db, user.id)?.topicIds ?? []);
}

export interface PublishPlanInput {
  userId: string;
  topicIds: string[];
  source: PlanSource;
  assessmentId?: string | null;
  rationale?: unknown;
  publishedBy: string | null;
}

/**
 * Publishes a new plan version. Unknown topic ids are dropped and the rest are sorted into
 * curriculum trail order, so a plan can never reference content that does not exist or send a
 * learner through a module backwards.
 *
 * Plans are append-only: editing publishes version N+1 rather than mutating N, which keeps the
 * admin's diff view and the "what did the AI actually propose" question answerable.
 */
export function publishPlan(db: Db, content: ContentStore, input: PublishPlanInput): PublishedPlan {
  const topicIds = content.orderTopicIds(input.topicIds);

  const previous = db
    .select({ version: schema.learningPlans.version })
    .from(schema.learningPlans)
    .where(eq(schema.learningPlans.userId, input.userId))
    .orderBy(desc(schema.learningPlans.version))
    .get();

  const version = (previous?.version ?? 0) + 1;
  const timestamp = now();
  const id = newId();

  db.insert(schema.learningPlans)
    .values({
      id,
      userId: input.userId,
      version,
      source: input.source,
      assessmentId: input.assessmentId ?? null,
      topicIds,
      rationale: input.rationale ?? null,
      publishedAt: timestamp,
      publishedBy: input.publishedBy,
    })
    .run();

  return {
    id,
    version,
    source: input.source,
    assessmentId: input.assessmentId ?? null,
    topicIds,
    rationale: input.rationale ?? null,
    publishedAt: timestamp,
  };
}
