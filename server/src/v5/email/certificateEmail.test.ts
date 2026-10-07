import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { schema } from "../../db";
import { now } from "../../lib/ids";
import { activeLearner, adminSession, createTestApp, type TestContext } from "../../test/harness";
import { issueCertificate } from "../certificates/repo";
import { CERTIFICATE_EMAIL_KIND, queueCertificateEarnedEmail } from "./certificateEmail";
import { EMAIL_ASSETS, EMAIL_FOOTER_TEXT } from "./layout";

let ctx: TestContext;
let learner: { id: string };
const saved = { SMTP_URL: process.env.SMTP_URL, SMTP_HOST: process.env.SMTP_HOST, MAIL_FROM: process.env.MAIL_FROM, PUBLIC_ORIGIN: process.env.PUBLIC_ORIGIN };

beforeEach(async () => {
  ctx = await createTestApp();
  learner = await activeLearner(ctx, await adminSession(ctx));
});

afterEach(async () => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await ctx.close();
});

const candidate = { kind: "course" as const, refId: "course-1", title: "Docker in practice", trackId: "", topicIds: [], averageScore: null, at: now() };
const outbox = () => ctx.db.select().from(schema.emailOutbox).where(eq(schema.emailOutbox.kind, CERTIFICATE_EMAIL_KIND)).all();

describe("certificate-earned email", () => {
  test("email off (no SMTP): issuing queues nothing, the notification still goes out", () => {
    delete process.env.SMTP_URL;
    delete process.env.SMTP_HOST;
    const id = issueCertificate(ctx.db, learner.id, candidate);
    expect(id).toBeTruthy();
    expect(outbox()).toHaveLength(0);
    expect(ctx.db.select().from(schema.notifications).where(eq(schema.notifications.kind, "certificate.issued")).all()).toHaveLength(1);
  });

  test("email on: issuing queues one branded email through the outbox, once", () => {
    process.env.SMTP_URL = "smtp://127.0.0.1:1";
    process.env.MAIL_FROM = "Oyelearn <learning@oyelabs.test>";
    process.env.PUBLIC_ORIGIN = "https://learn.oyegen.com";
    const id = issueCertificate(ctx.db, learner.id, candidate)!;
    const rows = outbox();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.status).toBe("queued");
    expect(row.toUserId).toBe(learner.id);
    expect(row.subject).toBe("You earned a certificate: Docker in practice");
    expect(row.html).toContain(`https://learn.oyegen.com${EMAIL_ASSETS.headerLight}`);
    expect(row.html).toContain(EMAIL_FOOTER_TEXT);
    expect(row.html).toContain(`https://learn.oyegen.com/learn/certificate/${id}`);
    expect(row.text).toContain(`https://learn.oyegen.com/verify/${id}`);
    expect(row.text).toContain(EMAIL_FOOTER_TEXT);

    // A second call for the same certificate (a retry, a re-sync) adds nothing.
    expect(queueCertificateEarnedEmail(ctx.db, id)).toBe(false);
    expect(outbox()).toHaveLength(1);
  });

  test("a revoked or unknown certificate gets no email", () => {
    const id = issueCertificate(ctx.db, learner.id, candidate)!;
    ctx.db.update(schema.certificates).set({ revokedAt: now() }).where(eq(schema.certificates.id, id)).run();
    expect(queueCertificateEarnedEmail(ctx.db, id, { emailOn: true })).toBe(false);
    expect(queueCertificateEarnedEmail(ctx.db, "OYL-NOPE-NOPE", { emailOn: true })).toBe(false);
  });
});
