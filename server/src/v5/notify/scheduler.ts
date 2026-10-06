import type { ContentStore } from "../../content/store";
import type { Db } from "../../db";
import { drainOutbox, type DrainResult } from "../email/sender";
import { queueWeeklyRecaps, sendDueReminders } from "./jobs";

/**
 * The motivation tick: reminders (hourly is enough: a reminder goes out at the first tick at or
 * after the learner's time), the weekly recaps (inside their Monday-morning window), and then
 * the outbox drain, which also delivers the admin weekly report Phase 7 queues.
 *
 * Wall-clock, not the job queue, like the nightly streaks: a reminder delayed behind a long
 * evaluation is a reminder at the wrong time. `MOTIVATION_TICK_MS` shortens it (e2e only).
 */

export interface TickResult {
  reminders: number;
  recaps: number;
  email: DrainResult;
}

export interface TickOptions {
  db: Db;
  content: ContentStore;
  appUrl: string;
  nowMs?: number;
  /** Queue recaps now, whatever the day (the admin "run now"). */
  forceRecaps?: boolean;
}

export async function motivationTick(options: TickOptions): Promise<TickResult> {
  const nowMs = options.nowMs ?? Date.now();
  const reminders = sendDueReminders(options.db, options.content, options.appUrl, nowMs).filter((r) => r.decision.send).length;
  const recaps = queueWeeklyRecaps(options.db, options.content, { appUrl: options.appUrl, nowMs, force: options.forceRecaps });
  const email = await drainOutbox(options.db);
  return { reminders, recaps, email };
}

export function startMotivationScheduler(options: { db: Db; content: ContentStore; appUrl: string; log?: (message: string) => void; intervalMs?: number }): () => void {
  const fromEnv = Number(process.env.MOTIVATION_TICK_MS);
  const interval = options.intervalMs ?? (Number.isFinite(fromEnv) && fromEnv >= 1000 ? fromEnv : 60 * 60 * 1000);
  const run = () => {
    motivationTick(options)
      .then((r) => {
        if (r.reminders || r.recaps || r.email.sent || r.email.failed || r.email.skipped) {
          options.log?.(`motivation: ${r.reminders} reminder(s), ${r.recaps} recap(s) queued; email ${r.email.sent} sent, ${r.email.failed} failed, ${r.email.skipped} skipped`);
        }
      })
      .catch((error: unknown) => options.log?.(`motivation tick failed: ${error instanceof Error ? error.message : String(error)}`));
  };
  const initial = setTimeout(run, Math.min(interval, 90_000));
  initial.unref?.();
  const timer = setInterval(run, interval);
  timer.unref?.();
  return () => {
    clearTimeout(initial);
    clearInterval(timer);
  };
}
