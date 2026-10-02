import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import type { HandbookKind } from "../../../shared/handbook";
import type { AiService } from "../ai/service";
import type { Db } from "../db";
import * as schema from "../db/schema";
import type { Job } from "../jobs/queue";
import { enqueue } from "../jobs/queue";
import { now } from "../lib/ids";
import { notify, staffIds } from "../lib/notify";
import { getRow, nameOf } from "./repo";

/**
 * v4.2: when an admin changes what a handbook entry *says* (a term's definition, Oyelabs meaning
 * or impact; a rule's statement), every bank item that cites it may now have a wrong key. Those
 * items drop to `draft` and get one `bank.revalidate` job each. With AI, Haiku compares the item
 * with the new wording and puts it back if they still agree; without AI, staff are told to look.
 */

type Ref = { id: string; kind: string; version: number };

export function itemsCiting(db: Db, kind: HandbookKind, id: string) {
  const t = schema.questionBank;
  return db
    .select({ id: t.id, status: t.status, handbookRefs: t.handbookRefs })
    .from(t)
    .where(
      sql`exists (select 1 from json_each(${t.handbookRefs}) where json_extract(value, '$.kind') = ${kind} and json_extract(value, '$.id') = ${id})`,
    )
    .all();
}

const payloadSchema = z.object({
  itemId: z.string(),
  kind: z.enum(["term", "stage", "rule", "template"]),
  entryId: z.string(),
  /** The status to restore when the check agrees. */
  restore: z.enum(["active", "draft"]),
});
export type RevalidatePayload = z.infer<typeof payloadSchema>;

/**
 * Sets every live item citing the entry to draft and queues its re-check. Retired items are left
 * alone. Returns how many items are being re-checked.
 */
export function flagCitingItems(db: Db, ai: AiService, kind: HandbookKind, id: string): number {
  const items = itemsCiting(db, kind, id).filter((i) => i.status !== "retired");
  if (items.length === 0) return 0;
  db.update(schema.questionBank)
    .set({ status: "draft", updatedAt: now() })
    .where(inArray(schema.questionBank.id, items.map((i) => i.id)))
    .run();
  for (const item of items) {
    const payload: RevalidatePayload = { itemId: item.id, kind, entryId: id, restore: item.status === "active" ? "active" : "draft" };
    enqueue(db, { type: "bank.revalidate", payload });
  }
  if (!ai.isConfigured()) {
    const name = nameOf(getRow(db, kind, id)?.data ?? {}) || id;
    const n = items.length;
    for (const recipientId of staffIds(db)) {
      notify(db, {
        recipientId,
        kind: "handbook.revalidate",
        title: `${name} changed`,
        body: `${n} question-bank item${n === 1 ? "" : "s"} cite${n === 1 ? "s" : ""} ${name}, which changed. Review them in the question bank.`,
        link: "/admin/question-bank?status=draft",
      });
    }
  }
  return items.length;
}

const verdictSchema = z.object({ agrees: z.boolean(), reason: z.string().max(600) });

export const REVALIDATE_SYSTEM = `You check assessment items against a company handbook. An admin has just changed
a handbook entry. Decide whether the item's keyed answer and explanation still agree with the NEW
entry text. Answer agrees: false if the item now teaches or rewards something the entry contradicts,
or if the keyed answer depends on wording that changed in a way that makes it wrong. Minor wording
changes that keep the meaning are agreement. Return JSON {"agrees": boolean, "reason": "one sentence"}.`;

function entryText(kind: string, data: Record<string, unknown>): Record<string, unknown> {
  if (kind === "term") return { name: data.name, definition: data.definition, oyelabsMeaning: data.oyelabsMeaning, impact: data.impact };
  if (kind === "rule") return { name: data.name, statement: data.statement };
  return data;
}

export interface RevalidateDeps {
  db: Db;
  ai: AiService;
  log?: (message: string) => void;
}

export function bankRevalidateHandler(deps: RevalidateDeps) {
  return async (job: Job): Promise<void> => {
    const { db, ai } = deps;
    const payload = payloadSchema.parse(job.payload);
    const item = db.select().from(schema.questionBank).where(eq(schema.questionBank.id, payload.itemId)).get();
    const entry = getRow(db, payload.kind, payload.entryId);
    // Retired since, or the entry vanished: nothing to do. Without AI the item waits for a person.
    if (!item || item.status !== "draft" || !entry || !ai.isConfigured()) return;

    const result = await ai.generateJson({
      purpose: "item_check",
      task: "item_check",
      system: REVALIDATE_SYSTEM,
      user: JSON.stringify({
        entry: { kind: payload.kind, id: payload.entryId, ...entryText(payload.kind, entry.data) },
        item: { prompt: item.prompt, mcq: item.mcq, task: item.task },
      }),
      schema: verdictSchema,
      schemaName: "handbook_check",
      meta: {},
    });

    const name = nameOf(entry.data) || payload.entryId;
    if (result.data.agrees) {
      const refs = (item.handbookRefs as Ref[]).map((r) => (r.kind === payload.kind && r.id === payload.entryId ? { ...r, version: entry.version } : r));
      db.update(schema.questionBank)
        .set({ status: payload.restore, handbookRefs: refs, updatedAt: now() })
        .where(eq(schema.questionBank.id, item.id))
        .run();
      deps.log?.(`bank.revalidate: ${item.id} still agrees with ${payload.kind}:${payload.entryId}`);
      return;
    }
    deps.log?.(`bank.revalidate: ${item.id} disagrees with ${payload.kind}:${payload.entryId}: ${result.data.reason}`);
    for (const recipientId of staffIds(db)) {
      notify(db, {
        recipientId,
        kind: "handbook.revalidate",
        title: `Bank item ${item.id} needs a review`,
        body: `It may no longer agree with ${name}, which changed. ${result.data.reason}`.slice(0, 900),
        link: "/admin/question-bank?status=draft",
      });
    }
  };
}
