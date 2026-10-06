import { asc, eq, gte, sql } from "drizzle-orm";

import { schema, type Db } from "../../db";

/**
 * v5 Phase 6: the email sender. Drains `email_outbox` (the learner recaps and reminders queued
 * here, the admin weekly report Phase 7 queues) over SMTP with nodemailer.
 *
 * Configuration, all from the environment:
 * - `SMTP_URL` (e.g. `smtps://user:pass@smtp.example.com:465`), or `SMTP_HOST` + `SMTP_PORT`
 *   (+ `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE=true` for implicit TLS);
 * - `MAIL_FROM`, e.g. `Oyelearn <learning@oyelabs.com>` (falls back to `SMTP_USER` when that is an
 *   address);
 * - `MAIL_DOMAIN`, e.g. `oyelabs.com`: users have no email column, so a username without "@" is
 *   sent to `<username>@<MAIL_DOMAIN>`.
 *
 * Without SMTP every queued row is marked `skipped` with a plain reason, so nothing piles up and
 * the admin inbox can say "Email isn't set up yet".
 */

export interface MailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** The one method we use from a nodemailer transport. Tests pass a fake. */
export interface MailTransport {
  sendMail(message: MailMessage): Promise<unknown>;
}

export interface EmailConfig {
  smtp: string | { host: string; port: number; secure: boolean; auth?: { user: string; pass: string } };
  from: string;
  domain: string | null;
}

export type EmailConfigResult = { ok: true; config: EmailConfig } | { ok: false; reason: string };

export const NOT_SET_UP = "Email isn't set up yet. Add SMTP_URL and MAIL_FROM to the server settings.";

const looksLikeAddress = (s: string | undefined) => !!s && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s.trim());

export function emailConfigFromEnv(env: NodeJS.ProcessEnv = process.env): EmailConfigResult {
  const url = env.SMTP_URL?.trim();
  const host = env.SMTP_HOST?.trim();
  if (!url && !host) return { ok: false, reason: NOT_SET_UP };
  const from = env.MAIL_FROM?.trim() || (looksLikeAddress(env.SMTP_USER) ? env.SMTP_USER!.trim() : "");
  if (!from) return { ok: false, reason: "Email isn't set up yet. Add MAIL_FROM (the address emails come from)." };
  const domain = env.MAIL_DOMAIN?.trim().replace(/^@/, "") || null;
  if (url) return { ok: true, config: { smtp: url, from, domain } };
  const port = Number(env.SMTP_PORT ?? 587);
  const secure = env.SMTP_SECURE === "true" || env.SMTP_SECURE === "1" || port === 465;
  const auth = env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? "" } : undefined;
  return { ok: true, config: { smtp: { host: host!, port: Number.isFinite(port) ? port : 587, secure, ...(auth ? { auth } : {}) }, from, domain } };
}

/** Where a row goes: its address when it has "@", else `<username>@MAIL_DOMAIN`, else nowhere. */
export function resolveAddress(toAddress: string, domain: string | null): string | null {
  const a = toAddress.trim();
  if (looksLikeAddress(a)) return a;
  if (domain && /^[a-z0-9._-]+$/i.test(a)) return `${a}@${domain}`;
  return null;
}

let cachedTransport: { key: string; transport: MailTransport } | null = null;

/** nodemailer is loaded only when there is something to send. */
export async function smtpTransport(config: EmailConfig): Promise<MailTransport> {
  const key = JSON.stringify(config.smtp);
  if (cachedTransport?.key === key) return cachedTransport.transport;
  const nodemailer = await import("nodemailer");
  const create = (nodemailer.default?.createTransport ?? nodemailer.createTransport) as (options: unknown) => MailTransport;
  const transport = create(config.smtp);
  cachedTransport = { key, transport };
  return transport;
}

export interface DrainResult {
  sent: number;
  failed: number;
  skipped: number;
}

export interface DrainOptions {
  /** Defaults to reading the environment. */
  config?: EmailConfigResult;
  /** Defaults to an SMTP transport for `config`. */
  transport?: MailTransport;
  limit?: number;
  now?: () => number;
}

let draining = false;

/** Sends what is queued, oldest first. One call at a time per process; safe to call often. */
export async function drainOutbox(db: Db, options: DrainOptions = {}): Promise<DrainResult> {
  const result: DrainResult = { sent: 0, failed: 0, skipped: 0 };
  if (draining) return result;
  draining = true;
  try {
    const clock = options.now ?? Date.now;
    const rows = db
      .select()
      .from(schema.emailOutbox)
      .where(eq(schema.emailOutbox.status, "queued"))
      .orderBy(asc(schema.emailOutbox.createdAt))
      .limit(options.limit ?? 50)
      .all();
    if (rows.length === 0) return result;

    const config = options.config ?? emailConfigFromEnv();
    const mark = (id: string, status: "sent" | "failed" | "skipped", error: string | null) =>
      db
        .update(schema.emailOutbox)
        .set({ status, error, sentAt: status === "sent" ? clock() : null })
        .where(eq(schema.emailOutbox.id, id))
        .run();

    if (!config.ok) {
      for (const row of rows) mark(row.id, "skipped", config.reason);
      result.skipped = rows.length;
      return result;
    }

    const transport = options.transport ?? (await smtpTransport(config.config));
    for (const row of rows) {
      const to = resolveAddress(row.toAddress, config.config.domain);
      if (!to) {
        mark(row.id, "skipped", `We don't have an email address for "${row.toAddress}". Set MAIL_DOMAIN so usernames become addresses.`);
        result.skipped += 1;
        continue;
      }
      try {
        await transport.sendMail({ from: config.config.from, to, subject: row.subject, text: row.text, html: row.html });
        mark(row.id, "sent", null);
        result.sent += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        mark(row.id, "failed", `The mail server didn't accept it: ${message.slice(0, 300)}`);
        result.failed += 1;
      }
    }
    return result;
  } finally {
    draining = false;
  }
}

export interface OutboxCounts {
  queued: number;
  sent: number;
  skipped: number;
  failed: number;
}

export function outboxCounts(db: Db, sinceMs = 0): OutboxCounts {
  const out: OutboxCounts = { queued: 0, sent: 0, skipped: 0, failed: 0 };
  const rows = db
    .select({ status: schema.emailOutbox.status, n: sql<number>`count(*)` })
    .from(schema.emailOutbox)
    .where(gte(schema.emailOutbox.createdAt, sinceMs))
    .groupBy(schema.emailOutbox.status)
    .all();
  for (const row of rows) if (row.status in out) out[row.status] = Number(row.n);
  return out;
}
