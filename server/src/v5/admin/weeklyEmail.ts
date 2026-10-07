import { brandEmail, publicOriginFromEnv } from "../email/layout";
import { emailConfigFromEnv } from "../email/sender";
import { eq } from "drizzle-orm";

import {
  rangeForDays,
  WEEKLY_REPORT_KIND,
  WEEKLY_REPORT_LAST_META_KEY,
  WEEKLY_REPORT_META_KEY,
  weeklyReportDue,
  weeklyReportEmail,
} from "../../../../shared/reports";
import type { ContentStore } from "../../content/store";
import { schema, type Db } from "../../db";
import { newId } from "../../lib/ids";
import { buildReport, weeklyEmailState } from "./metrics";

/** app_meta: the staff member who turned the weekly email on (they receive it). */
export const WEEKLY_REPORT_TO_META_KEY = "v5.reports.weekly_email_to";

function setMeta(db: Db, key: string, value: string, at: number): void {
  db.insert(schema.appMeta).values({ key, value, updatedAt: at }).onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: at } }).run();
}

export function setWeeklyEmail(db: Db, on: boolean, actorId: string, at = Date.now()): void {
  setMeta(db, WEEKLY_REPORT_META_KEY, on ? "on" : "off", at);
  if (on) setMeta(db, WEEKLY_REPORT_TO_META_KEY, actorId, at);
}

/**
 * Queues the weekly report into `email_outbox` when it is due. There is no separate timer: this
 * runs whenever staff open the inbox or Reports, which an admin who wants a weekly email does at
 * least weekly, and it is idempotent (the last-queued time is checked and written together). The
 * sender (Phase 6) delivers whatever is queued, in the Oyelearn frame (email/layout.ts). `origin` is
 * PUBLIC_ORIGIN, for the header image and the Reports link.
 */
export function maybeQueueWeeklyReport(
  db: Db,
  content: ContentStore,
  now = Date.now(),
  emailOn = emailConfigFromEnv().ok,
  origin = publicOriginFromEnv(),
): boolean {
  if (!emailOn) return false;
  const state = weeklyEmailState(db);
  if (!weeklyReportDue(state.on, state.lastQueuedAt, now)) return false;
  const toId = db.select().from(schema.appMeta).where(eq(schema.appMeta.key, WEEKLY_REPORT_TO_META_KEY)).get()?.value;
  const to = toId ? db.select().from(schema.users).where(eq(schema.users.id, toId)).get() : undefined;
  if (!to || to.status !== "active") return false;
  const report = buildReport(db, content, rangeForDays(7, now));
  const mail = brandEmail(origin, weeklyReportEmail(report, to.displayName, `${origin.replace(/\/+$/, "")}/admin/reports`));
  db.transaction((tx) => {
    tx.insert(schema.emailOutbox)
      .values({ id: newId(), toUserId: to.id, toAddress: to.username, kind: WEEKLY_REPORT_KIND, subject: mail.subject, html: mail.html, text: mail.text, status: "queued", createdAt: now })
      .run();
    tx.insert(schema.appMeta)
      .values({ key: WEEKLY_REPORT_LAST_META_KEY, value: String(now), updatedAt: now })
      .onConflictDoUpdate({ target: schema.appMeta.key, set: { value: String(now), updatedAt: now } })
      .run();
  });
  return true;
}
