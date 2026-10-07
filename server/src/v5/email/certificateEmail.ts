import { and, eq } from "drizzle-orm";

import { verifyPathFor } from "../../../../shared/certificates";
import { emailButton, emailLink, emailP, escapeHtml, type EmailBody } from "../../../../shared/emailParts";
import { schema, type Db } from "../../db";
import { newId, now } from "../../lib/ids";
import { brandEmail, originOf, publicOriginFromEnv } from "./layout";
import { emailConfigFromEnv } from "./sender";

/**
 * Rebrand Phase 6: "You earned a certificate" by email, through the same outbox as every other
 * email. The hook is the in-app notification the certificate code already sends
 * (`certificate.issued`, server/src/v5/certificates/repo.ts `issueCertificate`): lib/notify.ts
 * passes that one kind here, so issuing stays the certificate code's business and this file never
 * changes what is issued. Like the recap, nothing is queued when email isn't set up.
 */

export const CERTIFICATE_ISSUED_KIND = "certificate.issued";
export const CERTIFICATE_EMAIL_KIND = "learner.certificate_earned";

/** The certificate id from the notification's link (`/learn/certificate/<id>`), or null. */
export function certificateIdFromLink(link: string | null | undefined): string | null {
  const match = /^\/learn\/certificate\/([^/?#]+)$/.exec(link ?? "");
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export function certificateEarnedEmail(input: { firstName: string; title: string; certificateUrl: string; verifyUrl: string }): EmailBody {
  const subject = `You earned a certificate: ${input.title}`;
  const lead = `Well done, ${input.firstName}. You finished ${input.title}, and your certificate is ready.`;
  const share = "It has your name, the date and a link anyone can use to check it, so you can add it to LinkedIn or send it on.";
  return {
    subject,
    preheader: lead,
    accent: "progress",
    text: [lead, "", share, "", `See your certificate: ${input.certificateUrl}`, `Anyone can check it here: ${input.verifyUrl}`].join("\n"),
    bodyHtml: [
      emailP(escapeHtml(lead)),
      emailP(escapeHtml(share), { spaceAfter: 8 }),
      emailButton(input.certificateUrl, "See your certificate"),
      emailP(`Anyone can check it here: ${emailLink(input.verifyUrl, input.verifyUrl.replace(/^https?:\/\//, ""), { muted: true })}`, { muted: true, small: true, spaceAfter: 0 }),
    ].join(""),
  };
}

/**
 * Queues the email for a newly issued certificate. Never throws (a notification side effect must
 * not break issuing). Returns whether a row was queued. Once per certificate.
 */
export function queueCertificateEarnedEmail(
  db: Db,
  certificateId: string,
  options: { origin?: string; emailOn?: boolean; at?: number } = {},
): boolean {
  try {
    if (!(options.emailOn ?? emailConfigFromEnv().ok)) return false;
    const cert = db.select().from(schema.certificates).where(eq(schema.certificates.id, certificateId)).get();
    if (!cert || cert.revokedAt) return false;
    const user = db.select().from(schema.users).where(eq(schema.users.id, cert.userId)).get();
    if (!user || user.status !== "active") return false;
    const origin = originOf(options.origin ?? publicOriginFromEnv());
    const verifyUrl = `${origin}${verifyPathFor(cert.id)}`;
    const already = db
      .select({ text: schema.emailOutbox.text })
      .from(schema.emailOutbox)
      .where(and(eq(schema.emailOutbox.toUserId, user.id), eq(schema.emailOutbox.kind, CERTIFICATE_EMAIL_KIND)))
      .all()
      .some((r) => r.text.includes(verifyUrl));
    if (already) return false;
    const firstName = (user.displayName ?? "").trim().split(/\s+/)[0] || user.username;
    const mail = brandEmail(
      origin,
      certificateEarnedEmail({
        firstName,
        title: cert.title || "your course",
        certificateUrl: `${origin}/learn/certificate/${encodeURIComponent(cert.id)}`,
        verifyUrl,
      }),
    );
    db.insert(schema.emailOutbox)
      .values({ id: newId(), toUserId: user.id, toAddress: user.username, kind: CERTIFICATE_EMAIL_KIND, subject: mail.subject, html: mail.html, text: mail.text, status: "queued", createdAt: options.at ?? now() })
      .run();
    return true;
  } catch {
    return false;
  }
}

/** lib/notify.ts calls this for every notification; only `certificate.issued` sends an email. */
export function emailCopyOfNotification(db: Db, input: { kind: string; link?: string | null; at?: number }): void {
  if (input.kind !== CERTIFICATE_ISSUED_KIND) return;
  const id = certificateIdFromLink(input.link);
  if (id) queueCertificateEarnedEmail(db, id, { at: input.at });
}
