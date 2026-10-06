/**
 * v5 Phase 8: "Send to my email to continue on laptop" from the coding Do step on a phone.
 *
 * `POST /api/v5/lessons/:topicId/send-to-email` with `{ courseId?, code? }` queues one email with a deep
 * link back to the Do step (`email_outbox`, sent by `server/src/v5/email/sender.ts`). At most one
 * per topic per learner per hour. Every outcome is a 200 with a `status`, so the phone can show the
 * right plain line (and the link to copy when email can't go out).
 */

export const SEND_TO_EMAIL_KIND = "learner.continue_on_laptop";
/** One email per topic per learner in this window. */
export const SEND_TO_EMAIL_WINDOW_MS = 60 * 60 * 1000;

export type SendToEmailStatus = "sent" | "already_sent" | "not_set_up";

export interface SendToEmailResponse {
  status: SendToEmailStatus;
  /** The full deep link, always included so it can be copied instead. */
  link: string;
  /** For `already_sent`: minutes until another one can go. */
  retryInMinutes?: number;
}

/** Plain words for each outcome (copy guide: say what happened and what to do next). */
export const SEND_TO_EMAIL_COPY = {
  sent: "Sent. Open it on your laptop to keep going.",
  notSetUp: "Email isn't set up yet. Copy the link instead",
  alreadySent: (minutes: number) => `We already sent this lesson to your email. You can send it again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}, or copy the link.`,
  failed: "That didn't send. Check your connection and try again, or copy the link.",
} as const;

const SAFE_ID = /^[A-Za-z0-9:_-]{1,120}$/;

/** `/learn/lesson/:topicId?step=do` (plus `&course=` for a library course lesson), on `origin`. */
export function continueLink(origin: string, topicId: string, courseId?: string | null): string {
  const base = origin.replace(/\/+$/, "");
  const course = courseId && SAFE_ID.test(courseId) ? `&course=${encodeURIComponent(courseId)}` : "";
  return `${base}/learn/lesson/${encodeURIComponent(topicId)}?step=do${course}`;
}

/** Minutes left in the one-an-hour window, rounded up, at least 1. */
export function minutesUntilNext(lastSentAt: number, now: number): number {
  return Math.max(1, Math.ceil((lastSentAt + SEND_TO_EMAIL_WINDOW_MS - now) / 60_000));
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Longest code we put in the email. */
export const SEND_TO_EMAIL_MAX_CODE = 20_000;

/**
 * The email: one line, the button, the link written out for mail apps that drop buttons, and the
 * learner's code so far (drafts live in the phone's browser, so the laptop wouldn't have them).
 */
export function continueOnLaptopEmail(input: { firstName: string; lessonTitle: string; link: string; code?: string | null }): { subject: string; text: string; html: string } {
  const subject = `Keep going on your laptop: ${input.lessonTitle}`;
  const code = input.code?.trim() ? input.code.slice(0, SEND_TO_EMAIL_MAX_CODE) : null;
  const body = `Hi ${input.firstName}, here's the coding practice you started on your phone. Open it on your laptop to keep going.`;
  const codeNote = "Your code so far is below. Paste it into the editor to pick up where you stopped.";
  return {
    subject,
    text: [body, "", `Open the practice: ${input.link}`, ...(code ? ["", codeNote, "", code] : [])].join("\n"),
    html: [
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>`,
      `<body style="margin:0;padding:24px;background:#F5F6F2;color:#1B1F27;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.5">`,
      `<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:24px">`,
      `<p style="margin:0 0 8px;font-weight:600">${escapeHtml(input.lessonTitle)}</p>`,
      `<p style="margin:0 0 16px">${escapeHtml(body)}</p>`,
      `<p style="margin:0 0 20px"><a href="${escapeHtml(input.link)}" style="display:inline-block;background:#1F5FBF;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Open the practice</a></p>`,
      `<p style="margin:0;font-size:13px;color:#4B5563;word-break:break-all">Or paste this link: ${escapeHtml(input.link)}</p>`,
      code
        ? `<p style="margin:20px 0 8px">${escapeHtml(codeNote)}</p><pre style="margin:0;padding:12px;background:#12151C;color:#EDEFF3;border-radius:8px;font-family:Consolas,Menlo,monospace;font-size:13px;line-height:1.45;white-space:pre-wrap;word-break:break-word">${escapeHtml(code)}</pre>`
        : "",
      `</div></body></html>`,
    ].join(""),
  };
}
