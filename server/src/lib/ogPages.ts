import fs from "node:fs";

import type { FastifyInstance } from "fastify";

import { isCertificateId, verifyPathFor } from "../../../shared/certificates";
import { certificateRow, publicView } from "../v5/certificates/repo";

/**
 * Rebrand Phase 6: link previews per page type (docs/branding/DECISIONS.md, "Phase 6").
 *
 * The app is an SPA, so a crawler (Slack, LinkedIn, WhatsApp, Teams) only ever sees index.html's
 * head. Every page shares the default from index.html (og-image-blue as /og-image.png). A public
 * certificate page (`/verify/:id`) is the one page people share outside the team, so the server
 * rewrites that page's head before sending it: og:title, og:description, og:url, og:image (the
 * certificate's own PNG when there is one) and the matching twitter:* and <title>.
 *
 * Only `<title>` and `<meta>` tags are touched. Inline scripts are byte-for-byte unchanged, so the
 * CSP's script hashes (lib/csp.ts, computed from the built index.html) stay valid.
 */

export interface OgMeta {
  title: string;
  description: string;
  /** Absolute URL of the page. */
  url: string;
  /** Absolute URL of the preview image. */
  image: string;
  imageAlt: string;
  /** Omit when the size isn't known; the default image's 1200×630 tags are then removed. */
  imageWidth?: number;
  imageHeight?: number;
}

export interface OgImage {
  /** A path on our origin (`/…`) or an absolute URL. */
  url: string;
  width?: number;
  height?: number;
}

/**
 * Where a certificate's public PNG lives: the certificate code's (Phase 5)
 * `GET /api/v5/certificates/:id/preview.png`, the 1x render of the A4 template (1754 × 1240), served
 * only while the certificate is valid. Only asked for valid certificates. Tests swap it.
 */
export const CERTIFICATE_PREVIEW_SIZE = { width: 1754, height: 1240 } as const;
export const ogDeps: { certificateImage: (id: string) => OgImage | null } = {
  certificateImage: (id) => ({ url: `/api/v5/certificates/${encodeURIComponent(id)}/preview.png`, ...CERTIFICATE_PREVIEW_SIZE }),
};

/** The default share image, as index.html links it. */
export const DEFAULT_OG_IMAGE: OgImage = { url: "/og-image.png?v=2", width: 1200, height: 630 };
export const DEFAULT_OG_IMAGE_ALT = "Oyelearn: learning never closes.";

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeRegExp = (s: string) => s.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");

/** Sets (or adds) one `<meta property|name="key" content="…">`; with `value` null, removes it. */
function setMeta(html: string, attr: "property" | "name", key: string, value: string | null): string {
  const re = new RegExp(`[ \\t]*<meta\\s+${attr}="${escapeRegExp(key)}"\\s+content="[^"]*"\\s*/?>[ \\t]*\\r?\\n?`, "i");
  if (value === null) return html.replace(re, "");
  const tag = `<meta ${attr}="${key}" content="${escapeAttr(value)}" />`;
  if (re.test(html)) return html.replace(re, (match) => {
    const indent = /^[ \t]*/.exec(match)?.[0] ?? "";
    const newline = /\r?\n$/.exec(match)?.[0] ?? "";
    return `${indent}${tag}${newline}`;
  });
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

/** Rewrites the head's title, description, OG and Twitter tags. Scripts and everything else are untouched. */
export function rewriteOgMeta(html: string, meta: OgMeta): string {
  let out = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttr(meta.title)}</title>`);
  out = setMeta(out, "name", "description", meta.description);
  out = setMeta(out, "property", "og:url", meta.url);
  out = setMeta(out, "property", "og:title", meta.title);
  out = setMeta(out, "property", "og:description", meta.description);
  out = setMeta(out, "property", "og:image", meta.image);
  out = setMeta(out, "property", "og:image:width", meta.imageWidth ? String(meta.imageWidth) : null);
  out = setMeta(out, "property", "og:image:height", meta.imageHeight ? String(meta.imageHeight) : null);
  out = setMeta(out, "property", "og:image:alt", meta.imageAlt);
  out = setMeta(out, "name", "twitter:title", meta.title);
  out = setMeta(out, "name", "twitter:description", meta.description);
  out = setMeta(out, "name", "twitter:image", meta.image);
  out = setMeta(out, "name", "twitter:image:alt", meta.imageAlt);
  return out;
}

const absolute = (origin: string, url: string) => (/^https?:\/\//i.test(url) ? url : `${origin.replace(/\/+$/, "")}${url.startsWith("/") ? "" : "/"}${url}`);

const KIND_LINE: Record<string, string> = { course: "completed", track: "completed the path", goal: "reached the goal" };

/** The preview for `/verify/:id`: the certificate when it is valid, a plain default otherwise. */
export function verifyPageMeta(app: Pick<FastifyInstance, "db" | "content">, origin: string, id: string): OgMeta {
  const url = absolute(origin, verifyPathFor(id));
  const fallback = (title: string, description: string): OgMeta => ({
    title,
    description,
    url,
    image: absolute(origin, DEFAULT_OG_IMAGE.url),
    imageAlt: DEFAULT_OG_IMAGE_ALT,
    imageWidth: DEFAULT_OG_IMAGE.width,
    imageHeight: DEFAULT_OG_IMAGE.height,
  });
  const row = isCertificateId(id) ? certificateRow(app.db, id) : undefined;
  if (!row) return fallback("Check a certificate · Oyelearn", "We couldn't find an Oyelearn certificate with that code.");
  const view = publicView(row, app.content);
  if (view.status === "revoked") return fallback("Certificate revoked · Oyelearn", "This Oyelearn certificate has been revoked and is no longer valid.");
  if (view.status !== "valid") return fallback("Check a certificate · Oyelearn", "This Oyelearn certificate can't be confirmed. Ask the person who shared it.");
  const image = ogDeps.certificateImage(row.id);
  const what = `${view.holderName} ${KIND_LINE[view.kind] ?? "completed"} ${view.title} on Oyelearn.`;
  return {
    title: `${view.title}: certificate for ${view.holderName} · Oyelearn`,
    description: `${what} Open the link to check that it's valid.`,
    url,
    image: absolute(origin, image?.url ?? DEFAULT_OG_IMAGE.url),
    imageAlt: image ? `Oyelearn certificate: ${view.holderName}, ${view.title}` : DEFAULT_OG_IMAGE_ALT,
    imageWidth: image ? image.width : DEFAULT_OG_IMAGE.width,
    imageHeight: image ? image.height : DEFAULT_OG_IMAGE.height,
  };
}

/**
 * `GET /verify/:id` with the certificate's preview in the head. Registered only when the SPA build
 * exists (production); the client route renders the page as before. index.html is read once: a
 * deploy replaces the process along with the file.
 */
export async function registerOgPages(app: FastifyInstance, indexHtmlPath: string): Promise<void> {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
  app.get("/verify/:id", { config: { rateLimit: { max: 120, timeWindow: "1 minute" } } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    let html = indexHtml;
    try {
      html = rewriteOgMeta(indexHtml, verifyPageMeta(app, app.env.publicOrigin, id.slice(0, 64)));
    } catch (error) {
      request.log.warn({ err: error }, "og: verify page meta failed; sending the default head");
    }
    return reply.type("text/html; charset=utf-8").header("cache-control", "no-cache").send(html);
  });
}
