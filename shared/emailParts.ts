/**
 * Rebrand Phase 6: the pieces every email body is built from, so the recap, the reminder, the admin
 * report, send-to-laptop and the certificate email look like one family. The frame around a body
 * (header image, footer, light/dark switch) is `server/src/v5/email/layout.ts`; it adds the classes
 * used here (`ol-text`, `ol-muted`, `ol-link`, `ol-code`) to its dark-mode block.
 *
 * Email clients only reliably honour inline styles, tables and plain fonts, so: inline styles,
 * table-based buttons, and Outfit with Arial behind it (most clients have no web fonts).
 * Colours are the kit's (brand guidelines p6): Oyelabs Blue leads, Night Navy text, Slate secondary
 * text, amber only for wins (its text shade #B45309 on white, the same as the app).
 */

export const EMAIL_COLORS = {
  blue: "#2067D3",
  navy: "#0B2347",
  slate: "#5B6B82",
  cloud: "#F4F7FB",
  mist: "#E1EBFA",
  white: "#FFFFFF",
  line: "#DBE3EE",
  amber: "#F59E0B",
  amberText: "#B45309",
  amberSoft: "#FDF3E0",
  night: "#0A1428",
  nightSurface: "#101E38",
  nightLine: "#253554",
  sky: "#5F93E3",
  onNight: "#ECF1F8",
  onNightMuted: "#A0AEC5",
} as const;

export const EMAIL_FONT = "Outfit, Arial, Helvetica, sans-serif";
export const EMAIL_MONO = "'JetBrains Mono', Consolas, Menlo, monospace";

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** A paragraph. `html` is already escaped (or built from escaped parts). */
export function emailP(html: string, options: { muted?: boolean; small?: boolean; strong?: boolean; spaceAfter?: number } = {}): string {
  const color = options.muted ? EMAIL_COLORS.slate : EMAIL_COLORS.navy;
  const size = options.small ? "13px" : "16px";
  const style = [
    `margin:0 0 ${options.spaceAfter ?? 12}px`,
    `font-family:${EMAIL_FONT}`,
    `font-size:${size}`,
    "line-height:1.5",
    `color:${color}`,
    options.strong ? "font-weight:600" : "",
  ]
    .filter(Boolean)
    .join(";");
  return `<p class="${options.muted ? "ol-muted" : "ol-text"}" style="${style}">${html}</p>`;
}

/** A section heading inside the body. */
export function emailHeading(text: string): string {
  return `<h1 class="ol-text" style="margin:0 0 12px;font-family:${EMAIL_FONT};font-size:22px;line-height:1.3;font-weight:600;color:${EMAIL_COLORS.navy}">${escapeHtml(text)}</h1>`;
}

/** A link in body text. */
export function emailLink(href: string, label: string, options: { muted?: boolean } = {}): string {
  const color = options.muted ? EMAIL_COLORS.slate : EMAIL_COLORS.blue;
  return `<a class="${options.muted ? "ol-muted" : "ol-link"}" href="${escapeHtml(href)}" style="color:${color};text-decoration:underline">${escapeHtml(label)}</a>`;
}

/** A bulleted list; each item is already-escaped HTML. */
export function emailList(itemsHtml: string[]): string {
  const items = itemsHtml.map((h) => `<li style="margin:0 0 4px">${h}</li>`).join("");
  return `<ul class="ol-text" style="margin:0 0 16px;padding-left:20px;font-family:${EMAIL_FONT};font-size:16px;line-height:1.5;color:${EMAIL_COLORS.navy}">${items}</ul>`;
}

/**
 * The primary action: a table-based ("bulletproof") button, Oyelabs Blue with white text
 * (5.2:1), so it survives clients that drop padding on links. Blue in both themes.
 */
export function emailButton(href: string, label: string): string {
  const url = escapeHtml(href);
  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;border-collapse:separate">`,
    `<tr><td bgcolor="${EMAIL_COLORS.blue}" style="border-radius:8px;background:${EMAIL_COLORS.blue}">`,
    `<a href="${url}" style="display:inline-block;padding:12px 22px;font-family:${EMAIL_FONT};font-size:16px;font-weight:600;line-height:1.2;color:${EMAIL_COLORS.white};text-decoration:none;border-radius:8px">${escapeHtml(label)}</a>`,
    `</td></tr></table>`,
  ].join("");
}

/** A block of code (send-to-laptop). Dark in both themes. */
export function emailCode(code: string): string {
  return `<pre class="ol-code" style="margin:0 0 16px;padding:12px;background:${EMAIL_COLORS.navy};color:${EMAIL_COLORS.onNight};border-radius:8px;font-family:${EMAIL_MONO};font-size:13px;line-height:1.45;white-space:pre-wrap;word-break:break-word">${escapeHtml(code)}</pre>`;
}

/**
 * What a builder hands the layout: the subject, the body HTML (no `<html>`, no frame) and the plain
 * text part. The layout adds the header, footer and the text footer.
 */
export interface EmailBody {
  subject: string;
  /** Inbox preview line (hidden in the body). Defaults to nothing. */
  preheader?: string;
  bodyHtml: string;
  text: string;
  /** "progress": a thin amber rule under the header, for wins (a certificate). Blue leads otherwise. */
  accent?: "progress";
}
