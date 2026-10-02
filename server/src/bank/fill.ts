import { and, eq } from "drizzle-orm";

import type { Db } from "../db";
import * as schema from "../db/schema";
import { enqueue } from "../jobs/queue";

/**
 * Queues a one-off `bank.fill` per thin skill and type, unless one is already waiting.
 *
 * Filling is for everyone: the items it adds are validated and join the shared bank, so the next
 * learner with the same priority finds them there and nothing is generated twice.
 */
export function queueBankFill(db: Db, departmentId: string, shortfalls: readonly { skillId: string; type: string; missing: number }[]): number {
  const waiting = db
    .select({ payload: schema.jobs.payload })
    .from(schema.jobs)
    .where(and(eq(schema.jobs.type, "bank.fill"), eq(schema.jobs.status, "queued")))
    .all()
    .map((job) => job.payload as { skillId?: string; type?: string });
  let queued = 0;
  const seen = new Set<string>();
  for (const shortfall of shortfalls) {
    const id = `${shortfall.skillId}:${shortfall.type}`;
    if (seen.has(id) || waiting.some((w) => w.skillId === shortfall.skillId && w.type === shortfall.type)) continue;
    seen.add(id);
    enqueue(db, { type: "bank.fill", payload: { departmentId, skillId: shortfall.skillId, type: shortfall.type } });
    queued += 1;
  }
  return queued;
}
