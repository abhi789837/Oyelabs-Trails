import { and, eq, gte } from "drizzle-orm";

import { schema, type Db } from "../../db";
import { emailConfigFromEnv } from "./sender";

const DAY_MS = 86_400_000;

/**
 * The admin inbox's setup line for email. Only shown once something actually wanted to go out
 * (a row skipped in the last 30 days), so a team that never uses email isn't nagged.
 */
export function emailSetupIssue(db: Db, now = Date.now(), env: NodeJS.ProcessEnv = process.env): { title: string; detail: string } | null {
  if (emailConfigFromEnv(env).ok) return null;
  const skipped = db
    .select({ id: schema.emailOutbox.id })
    .from(schema.emailOutbox)
    .where(and(eq(schema.emailOutbox.status, "skipped"), gte(schema.emailOutbox.createdAt, now - 30 * DAY_MS)))
    .get();
  if (!skipped) return null;
  return {
    title: "Email isn't set up yet",
    detail: "Weekly summaries and reminders can't go out by email. Reminders still show in the app. Ask whoever runs the server to add the mail settings.",
  };
}
