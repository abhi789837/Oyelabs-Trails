import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { eq } from "drizzle-orm";

import {
  SEND_TO_EMAIL_KIND,
  SEND_TO_EMAIL_WINDOW_MS,
  continueLink,
  continueOnLaptopEmail,
  minutesUntilNext,
  type SendToEmailResponse,
} from "../../../../shared/sendToEmail";
import { schema, type Db } from "../../db";
import { activeLearner, adminSession, as, createTestApp, publishPlanFor, type Session, type TestContext } from "../../test/harness";
import { sendToEmailDeps } from "./sendToEmail";

const CODE_TOPIC = "js-call-stack";
const QUIZ_TOPIC = "lv-api-exceptions";
const SMTP_ENV = { SMTP_URL: "smtp://127.0.0.1:2599", MAIL_FROM: "Oyelearn <learn@example.test>", MAIL_DOMAIN: "example.test" } as NodeJS.ProcessEnv;

let ctx: TestContext;
let admin: Session;
let learner: { id: string; username: string; session: Session };
let env: NodeJS.ProcessEnv;
let now: number;
let drains: number;
const original = { ...sendToEmailDeps };

beforeEach(async () => {
  env = { ...SMTP_ENV };
  now = Date.UTC(2026, 9, 6, 9, 0, 0);
  drains = 0;
  sendToEmailDeps.env = () => env;
  sendToEmailDeps.now = () => now;
  sendToEmailDeps.drain = async (_db: Db) => {
    drains += 1;
  };
  ctx = await createTestApp();
  admin = await adminSession(ctx);
  learner = await activeLearner(ctx, admin);
  await publishPlanFor(ctx, admin, learner.id, [CODE_TOPIC, QUIZ_TOPIC]);
});

afterEach(async () => {
  Object.assign(sendToEmailDeps, original);
  await ctx?.close();
});

const send = (topicId: string, payload: Record<string, unknown> = {}, session: Session = learner.session) =>
  ctx.app.inject({ method: "POST", url: `/api/v5/lessons/${topicId}/send-to-email`, ...as(session), payload });

const outbox = () => ctx.db.select().from(schema.emailOutbox).where(eq(schema.emailOutbox.toUserId, learner.id)).all();

describe("POST /api/v5/lessons/:topicId/send-to-email", () => {
  test("queues one email with a deep link to the Do step and the learner's code, then sends it", async () => {
    const res = await send(CODE_TOPIC, { code: "function flattenDeep(input) {\n  return <b>;\n}" });
    expect(res.statusCode).toBe(200);
    const body: SendToEmailResponse = res.json();
    expect(body.status).toBe("sent");
    expect(body.link).toMatch(/\/learn\/lesson\/js-call-stack\?step=do$/);
    const rows = outbox();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: SEND_TO_EMAIL_KIND, status: "queued", toAddress: learner.username });
    expect(rows[0].text).toContain(body.link);
    expect(rows[0].text).toContain("function flattenDeep(input)");
    // HTML is escaped.
    expect(rows[0].html).toContain("&lt;b&gt;");
    expect(rows[0].html).not.toContain("<b>;");
    expect(drains).toBe(1);
  });

  test("adds the course to the link when there is one", async () => {
    const body: SendToEmailResponse = (await send(CODE_TOPIC, { courseId: "course_abc-1" })).json();
    expect(body.link).toMatch(/\?step=do&course=course_abc-1$/);
  });

  test("allows one email per topic per hour, and says when the next one can go", async () => {
    expect((await send(CODE_TOPIC)).json().status).toBe("sent");
    now += 20 * 60_000;
    const again: SendToEmailResponse = (await send(CODE_TOPIC)).json();
    expect(again).toMatchObject({ status: "already_sent", retryInMinutes: 40 });
    expect(again.link).toMatch(/step=do$/);
    expect(outbox()).toHaveLength(1);
    now += 40 * 60_000 + 1;
    expect((await send(CODE_TOPIC)).json().status).toBe("sent");
    expect(outbox()).toHaveLength(2);
  });

  test("the hour is per lesson: the same topic from a course is a different link", async () => {
    expect((await send(CODE_TOPIC)).json().status).toBe("sent");
    expect((await send(CODE_TOPIC, { courseId: "c1" })).json().status).toBe("sent");
    expect(outbox()).toHaveLength(2);
  });

  test("the hour is per learner", async () => {
    const other = await activeLearner(ctx, admin, "other.learner");
    await publishPlanFor(ctx, admin, other.id, [CODE_TOPIC]);
    expect((await send(CODE_TOPIC)).json().status).toBe("sent");
    expect((await send(CODE_TOPIC, {}, other.session)).json().status).toBe("sent");
  });

  test("without email set up it queues nothing and hands back the link to copy", async () => {
    env = {};
    const body: SendToEmailResponse = (await send(CODE_TOPIC)).json();
    expect(body.status).toBe("not_set_up");
    expect(body.link).toMatch(/\/learn\/lesson\/js-call-stack\?step=do$/);
    expect(outbox()).toHaveLength(0);
    expect(drains).toBe(0);
  });

  test("a username with no address and no MAIL_DOMAIN counts as not set up", async () => {
    env = { SMTP_URL: SMTP_ENV.SMTP_URL, MAIL_FROM: SMTP_ENV.MAIL_FROM };
    expect((await send(CODE_TOPIC)).json().status).toBe("not_set_up");
    expect(outbox()).toHaveLength(0);
  });

  test("only coding lessons in the learner's plan, and only signed in", async () => {
    expect((await send(QUIZ_TOPIC)).statusCode).toBe(400);
    expect((await send("js-closures")).statusCode).toBe(404);
    expect((await ctx.app.inject({ method: "POST", url: `/api/v5/lessons/${CODE_TOPIC}/send-to-email`, payload: {} })).statusCode).toBe(401);
  });

  test("rejects a malformed course id and unknown fields", async () => {
    expect((await send(CODE_TOPIC, { courseId: "../../x" })).statusCode).toBe(400);
    expect((await send(CODE_TOPIC, { to: "someone@else.test" })).statusCode).toBe(400);
  });
});

describe("send-to-email helpers", () => {
  test("continueLink trims the origin, encodes the topic and drops an unsafe course id", () => {
    expect(continueLink("https://learn.example.com/", "a b", "c1")).toBe("https://learn.example.com/learn/lesson/a%20b?step=do&course=c1");
    expect(continueLink("https://x.test", "t", "<script>")).toBe("https://x.test/learn/lesson/t?step=do");
  });

  test("minutesUntilNext rounds up and never says 0", () => {
    expect(minutesUntilNext(0, 0)).toBe(60);
    expect(minutesUntilNext(0, SEND_TO_EMAIL_WINDOW_MS - 1000)).toBe(1);
    expect(minutesUntilNext(0, SEND_TO_EMAIL_WINDOW_MS + 5000)).toBe(1);
  });

  test("the email has no code section when there is no code", () => {
    const mail = continueOnLaptopEmail({ firstName: "Asha", lessonTitle: "Call stack", link: "https://x.test/l" });
    expect(mail.subject).toBe("Keep going on your laptop: Call stack");
    expect(mail.text).not.toContain("Your code so far");
    expect(mail.text.endsWith("https://x.test/l")).toBe(true);
  });
});
