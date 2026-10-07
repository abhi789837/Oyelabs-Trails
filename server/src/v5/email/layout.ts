import { EMAIL_COLORS as C, EMAIL_FONT, escapeHtml, type EmailBody } from "../../../../shared/emailParts";

/**
 * Rebrand Phase 6: the one frame every Oyelearn email goes out in (docs/branding/DECISIONS.md,
 * "Phase 6"). Builders return an `EmailBody` (shared/emailParts.ts); `brandEmail` wraps it:
 *
 * - the kit's `email-header-light` (05-web, 600 px, the 1200 px file as the 2x source), served from
 *   our own origin under /brand/email/ with absolute URLs, and its dark variant shown instead where a
 *   client supports `prefers-color-scheme` (Apple Mail, iOS Mail, Outlook for Mac). Elsewhere the
 *   light header shows, which is the kit's default;
 * - brand colours, Outfit with Arial behind it;
 * - a footer with the mark and "Oyelearn · by Oyelabs";
 * - tables and inline styles only (Outlook and Gmail ignore most CSS), `lang`, alt text on every image,
 *   `role="presentation"` on layout tables, and the plain-text part kept with a matching footer.
 *
 * The kit's 08-email folder has an email signature only (no message template), so this follows the
 * 05-web headers and the signature's lockup-plus-"Role · Oyelabs" pattern for the footer.
 */

/** Bumped when a header or mark file changes, so mail clients' image caches fetch the new one. */
const ASSET_VERSION = "1";

export const EMAIL_ASSETS = {
  headerLight: "/brand/email/email-header-light@600w.png",
  headerLight2x: "/brand/email/email-header-light@1200w.png",
  headerDark: "/brand/email/email-header-dark@600w.png",
  headerDark2x: "/brand/email/email-header-dark@1200w.png",
  markLight: "/brand/email/oyelearn-mark-light@64w.png",
  markDark: "/brand/email/oyelearn-mark-dark@64w.png",
} as const;

export const EMAIL_FOOTER_TEXT = "Oyelearn · by Oyelabs";

/** The configured public origin without a trailing slash (`PUBLIC_ORIGIN`, e.g. https://learn.oyegen.com). */
export function originOf(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

/** An absolute URL for a file under public/ (mail clients have no base URL). */
export function emailAssetUrl(origin: string, assetPath: string): string {
  return `${originOf(origin)}${assetPath}?v=${ASSET_VERSION}`;
}

/** Where emails get the origin when the caller has no `app.env` (the notifier). Same default as env.ts. */
export function publicOriginFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  return originOf(env.PUBLIC_ORIGIN?.trim() || "http://localhost:5173");
}

const STYLE = [
  ":root{color-scheme:light dark;supported-color-schemes:light dark}",
  "body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}",
  "img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}",
  "table{border-collapse:collapse}",
  "@media (max-width:620px){.ol-container{width:100%!important}.ol-pad{padding-left:20px!important;padding-right:20px!important}}",
  "@media (prefers-color-scheme:dark){",
  `.ol-bg{background:${C.night}!important}`,
  `.ol-card{background:${C.nightSurface}!important;border-color:${C.nightLine}!important}`,
  `.ol-text{color:${C.onNight}!important}`,
  `.ol-muted{color:${C.onNightMuted}!important}`,
  `.ol-link{color:${C.sky}!important}`,
  `.ol-rule{border-color:${C.nightLine}!important}`,
  `.ol-code{background:${C.night}!important}`,
  ".ol-light{display:none!important;max-height:0!important;overflow:hidden!important}",
  ".ol-dark{display:block!important;max-height:none!important;overflow:visible!important}",
  "}",
].join("");

function header(origin: string): string {
  const home = `${originOf(origin)}/learn`;
  const img = (src: string, src2x: string) =>
    `<img src="${escapeHtml(emailAssetUrl(origin, src))}" srcset="${escapeHtml(emailAssetUrl(origin, src))} 1x, ${escapeHtml(emailAssetUrl(origin, src2x))} 2x" width="600" height="150" alt="Oyelearn" style="display:block;width:100%;max-width:600px;height:auto;border:0">`;
  return [
    `<a href="${escapeHtml(home)}" style="display:block;text-decoration:none">`,
    `<div class="ol-light">${img(EMAIL_ASSETS.headerLight, EMAIL_ASSETS.headerLight2x)}</div>`,
    // Hidden unless the client applies the dark media block above; Outlook (mso) never shows it.
    `<!--[if !mso]><!--><div class="ol-dark" style="display:none;max-height:0;overflow:hidden;mso-hide:all">${img(EMAIL_ASSETS.headerDark, EMAIL_ASSETS.headerDark2x)}</div><!--<![endif]-->`,
    `</a>`,
  ].join("");
}

function footer(origin: string): string {
  const mark = (src: string) => `<img src="${escapeHtml(emailAssetUrl(origin, src))}" width="24" height="24" alt="" style="display:block;width:24px;height:24px;border:0">`;
  const home = originOf(origin);
  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">`,
    `<tr><td class="ol-pad" style="padding:20px 32px 28px" align="left">`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>`,
    `<td style="padding:0 10px 0 0;vertical-align:middle" width="24">`,
    `<div class="ol-light">${mark(EMAIL_ASSETS.markLight)}</div>`,
    `<!--[if !mso]><!--><div class="ol-dark" style="display:none;max-height:0;overflow:hidden;mso-hide:all">${mark(EMAIL_ASSETS.markDark)}</div><!--<![endif]-->`,
    `</td>`,
    `<td class="ol-text" style="vertical-align:middle;font-family:${EMAIL_FONT};font-size:14px;font-weight:600;line-height:1.3;color:${C.navy}">${escapeHtml(EMAIL_FOOTER_TEXT)}</td>`,
    `</tr></table>`,
    `<p class="ol-muted" style="margin:10px 0 0;font-family:${EMAIL_FONT};font-size:12px;line-height:1.5;color:${C.slate}">Learning never closes. <a class="ol-muted" href="${escapeHtml(home)}" style="color:${C.slate};text-decoration:underline">${escapeHtml(home.replace(/^https?:\/\//, ""))}</a></p>`,
    `</td></tr></table>`,
  ].join("");
}

/** The plain-text footer, after the standard "-- " signature line. */
export function textFooter(origin: string): string {
  return `-- \n${EMAIL_FOOTER_TEXT}\nLearning never closes. ${originOf(origin)}`;
}

/** Wraps a body in the Oyelearn frame. Returns the HTML and the text part (with its footer). */
export function brandEmail(origin: string, body: EmailBody): { subject: string; html: string; text: string } {
  const preheader = body.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.cloud};opacity:0">${escapeHtml(body.preheader)}</div>`
    : "";
  const accent = body.accent === "progress" ? `<tr><td style="height:4px;line-height:4px;font-size:0;background:${C.amber}" bgcolor="${C.amber}">&nbsp;</td></tr>` : "";
  const html = [
    `<!doctype html>`,
    `<html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml">`,
    `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="X-UA-Compatible" content="IE=edge">`,
    `<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">`,
    `<title>${escapeHtml(body.subject)}</title><style>${STYLE}</style></head>`,
    `<body class="ol-bg" style="margin:0;padding:0;background:${C.cloud};font-family:${EMAIL_FONT};color:${C.navy}">`,
    preheader,
    `<table role="presentation" class="ol-bg" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.cloud}" style="background:${C.cloud}">`,
    `<tr><td align="center" style="padding:24px 12px">`,
    `<table role="presentation" class="ol-container" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px">`,
    `<tr><td class="ol-card" bgcolor="${C.white}" style="background:${C.white};border:1px solid ${C.line};border-radius:12px;overflow:hidden">`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">`,
    `<tr><td style="padding:0;border-radius:12px 12px 0 0;overflow:hidden">${header(origin)}</td></tr>`,
    accent,
    `<tr><td class="ol-pad" style="padding:28px 32px 12px;font-family:${EMAIL_FONT};font-size:16px;line-height:1.5;color:${C.navy}">${body.bodyHtml}</td></tr>`,
    `<tr><td class="ol-pad" style="padding:0 32px"><div class="ol-rule" style="border-top:1px solid ${C.line};height:0;line-height:0;font-size:0">&nbsp;</div></td></tr>`,
    `<tr><td>${footer(origin)}</td></tr>`,
    `</table>`,
    `</td></tr>`,
    `</table>`,
    `</td></tr>`,
    `</table>`,
    `</body></html>`,
  ].join("");
  return { subject: body.subject, html, text: `${body.text.replace(/\s+$/, "")}\n\n${textFooter(origin)}\n` };
}
