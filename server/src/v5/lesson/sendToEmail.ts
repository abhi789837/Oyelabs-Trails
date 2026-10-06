import type { FastifyInstance } from "fastify";
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";

import {
  SEND_TO_EMAIL_KIND,
  SEND_TO_EMAIL_MAX_CODE,
  SEND_TO_EMAIL_WINDOW_MS,
  continueLink,
  continueOnLaptopEmail,
  minutesUntilNext,
  type SendToEmailResponse,
} from "../../../../shared/sendToEmail";
import { requireActiveUser } from "../../auth/guards";
import { schema, type Db } from "../../db";
import { newId } from "../../lib/ids";
import { badRequest, parseOrThrow } from "../../lib/errors";
import { drainOutbox, emailConfigFromEnv, resolveAddress } from "../email/sender";
import { lessonTopic } from "./routes";

const params = z.object({ topicId: z.string().min(1).max(120) });
const body = z
  .object({
    courseId: z.string().regex(/^[A-Za-z0-9:_-]{1,120}$/).nullish(),
    code: z.string().max(SEND_TO_EMAIL_MAX_CODE * 2).nullish(),
  })
  .strict();

/**
 * What the route reads from the outside world. Tests swap these (the environment decides whether
 * email is set up; the drain would otherwise try a real mail server).
 */
export const sendToEmailDeps: {
  env: () => NodeJS.ProcessEnv;
  drain: (db: Db) => Promise<unknown>;
  now: () => number;
} = {
  env: () => process.env,
  drain: (db) => drainOutbox(db),
  now: () => Date.now(),
};

function firstNameOf(displayName: string | null | undefined, username: string): string {
  const name = (displayName ?? "").trim().split(/\s+/)[0];
  return name || username;
}

/** The newest "continue on laptop" email for this learner and lesson inside the window, if any. */
function recentSend(db: Db, userId: string, linkPath: string, now: number): number | null {
  const rows = db
    .select({ createdAt: schema.emailOutbox.createdAt, text: schema.emailOutbox.text })
    .from(schema.emailOutbox)
    .where(and(eq(schema.emailOutbox.toUserId, userId), eq(schema.emailOutbox.kind, SEND_TO_EMAIL_KIND), gte(schema.emailOutbox.createdAt, now - SEND_TO_EMAIL_WINDOW_MS)))
    .orderBy(desc(schema.emailOutbox.createdAt))
    .all();
  // The outbox has no lesson column; the deep link in the text names it.
  const hit = rows.find((r) => r.text.includes(`${linkPath}\n`) || r.text.endsWith(linkPath));
  return hit ? hit.createdAt : null;
}

/**
 * `POST /api/v5/lessons/:topicId/send-to-email`: the coding Do step's "continue on laptop" on a
 * phone. Registered inside the lesson routes (no new plugin in app.ts).
 */
export async function registerSendToEmailRoute(app: FastifyInstance): Promise<void> {
  app.post(
    "/api/v5/lessons/:topicId/send-to-email",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request): Promise<SendToEmailResponse> => {
      const user = requireActiveUser(request);
      const { topicId } = parseOrThrow(params, request.params, "Unknown lesson.");
      const input = parseOrThrow(body, request.body ?? {});
      const topic = lessonTopic(app, user, topicId);
      if (topic.challengeType !== "code" || !topic.codeChallenge) throw badRequest("This lesson has no coding practice to send.");

      const link = continueLink(app.env.publicOrigin, topic.id, input.courseId);
      const linkPath = link.slice(app.env.publicOrigin.replace(/\/+$/, "").length);
      const config = emailConfigFromEnv(sendToEmailDeps.env());
      const address = config.ok ? resolveAddress(user.username, config.config.domain) : null;
      if (!config.ok || !address) return { status: "not_set_up", link };

      const now = sendToEmailDeps.now();
      const last = recentSend(app.db, user.id, linkPath, now);
      if (last !== null) return { status: "already_sent", link, retryInMinutes: minutesUntilNext(last, now) };

      const mail = continueOnLaptopEmail({ firstName: firstNameOf(user.displayName, user.username), lessonTitle: topic.title, link, code: input.code });
      app.db
        .insert(schema.emailOutbox)
        .values({ id: newId(), toUserId: user.id, toAddress: user.username, kind: SEND_TO_EMAIL_KIND, subject: mail.subject, html: mail.html, text: mail.text, status: "queued", createdAt: now })
        .run();
      // Send now rather than at the next hourly tick; a failure is recorded on the row.
      void sendToEmailDeps.drain(app.db).catch((error: unknown) => request.log.warn({ err: error }, "send-to-email: drain failed"));
      return { status: "sent", link };
    },
  );
}
