/**
 * v5 certificates (Phase 5): shared shapes and pure helpers.
 *
 * The server is the source of truth: it issues a row into `certificates` when a track, a course or
 * a goal is complete (`server/src/v5/certificates/repo.ts`), idempotently on (user, kind, ref). The
 * client only shows what it is given. `/verify/:certId` is public and shows the minimum: holder,
 * title, issue date and whether it is still valid.
 */

export type CertificateKind = "track" | "course" | "goal";

export const CERTIFICATE_KIND_LABELS: Record<CertificateKind, string> = {
  track: "Track",
  course: "Course",
  goal: "Goal",
};

/** A track certificate needs at least this many plan topics in that track, all completed. */
export const MIN_TRACK_TOPICS = 5;

/** The learner's own certificate, as `/api/v5/certificates` returns it. */
export interface MyCertificate {
  id: string;
  kind: CertificateKind;
  refId: string;
  title: string;
  holderName: string;
  issuedAt: number;
  trackId: string;
  topicCount: number;
  averageScore: number | null;
  revokedAt: number | null;
  /** Path only (`/verify/<id>`); the client adds its own origin. */
  verifyPath: string;
}

export interface MyCertificatesResponse {
  certificates: MyCertificate[];
  /** The name printed on new certificates (their own choice, else their display name). */
  holderName: string;
  /** Ids issued by this request, so the page can celebrate them once. */
  newlyIssued: string[];
}

export type CertificateStatus = "valid" | "revoked" | "changed";

/** `/api/v5/certificates/:id/public`: no session, minimal data. */
export interface PublicCertificate {
  id: string;
  holderName: string;
  title: string;
  kind: CertificateKind;
  issuedAt: number;
  status: CertificateStatus;
  revokedAt: number | null;
}

/** Admin list row. */
export interface AdminCertificate extends MyCertificate {
  userId: string;
}

export const HOLDER_NAME_MAX = 80;

/** One space between words, trimmed. */
export function normalizeHolderName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, HOLDER_NAME_MAX);
}

/** What the integrity hash covers (the server hashes this with SHA-256). Order matters. */
export function certificateHashInput(c: { id: string; kind: CertificateKind; refId: string; title: string; holderName: string; issuedAt: number }): string {
  return [c.id, c.kind, c.refId, c.title, normalizeHolderName(c.holderName), String(c.issuedAt)].join("|");
}

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * A short public code from random bytes: `OYL-XXXX-XXXX` (Crockford base32, no I, L, O or U, so
 * it reads aloud and types without confusion). 40 bits: unguessable enough for a public link
 * that only ever shows a name and a title.
 */
export function certificateCode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5 && out.length < 8) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
    value &= (1 << bits) - 1;
  }
  while (out.length < 8) out += "0";
  return `OYL-${out.slice(0, 4)}-${out.slice(4, 8)}`;
}

/** Accepts new codes (OYL-XXXX-XXXX) and the older browser ones (OYL-FE-XXXX-XXXX). */
export const CERTIFICATE_ID_RE = /^OYL-[0-9A-Z]{1,6}(-[0-9A-Z]{4}){1,2}$/;

export function isCertificateId(value: string): boolean {
  return CERTIFICATE_ID_RE.test(value);
}

export function verifyPathFor(id: string): string {
  return `/verify/${encodeURIComponent(id)}`;
}

/** "6 October 2026", in UTC so the same certificate reads the same everywhere. */
export function formatIssueDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// ---------------------------------------------------------------------------
// Share image (1200 × 630, the Open Graph size)
// ---------------------------------------------------------------------------

export const SHARE_IMAGE = { width: 1200, height: 630 } as const;

/**
 * The largest font size (px, whole numbers) at which `text` fits in `maxWidth`, never above `max`
 * or below `min`. `charEm` is the average glyph width in em for the font (Sora ≈ 0.6).
 */
export function fitFontSize(text: string, maxWidth: number, max: number, min: number, charEm = 0.6): number {
  const length = Math.max(1, [...text].length);
  const fits = Math.floor(maxWidth / (length * charEm));
  return Math.max(min, Math.min(max, fits));
}

export interface ShareLayout {
  width: number;
  height: number;
  /** Outer margin. */
  pad: number;
  /** QR square, bottom right. */
  qr: { x: number; y: number; size: number };
  name: { x: number; y: number; size: number; maxWidth: number };
  title: { x: number; y: number; size: number; maxWidth: number };
  kicker: { x: number; y: number; size: number };
  footer: { x: number; y: number; size: number };
  logo: { x: number; y: number; height: number };
}

/** Where everything goes on the share image. Pure, so the sizes are tested without a canvas. */
export function shareImageLayout(holderName: string, title: string): ShareLayout {
  const { width, height } = SHARE_IMAGE;
  const pad = 64;
  const qrSize = 168;
  const textWidth = width - pad * 2 - qrSize - 48;
  return {
    width,
    height,
    pad,
    qr: { x: width - pad - qrSize, y: height - pad - qrSize, size: qrSize },
    logo: { x: pad, y: pad, height: 44 },
    kicker: { x: pad, y: 210, size: 26 },
    name: { x: pad, y: 300, size: fitFontSize(holderName, textWidth, 72, 34), maxWidth: textWidth },
    title: { x: pad, y: 392, size: fitFontSize(title, textWidth, 44, 24), maxWidth: textWidth },
    footer: { x: pad, y: height - pad, size: 22 },
  };
}

// ---------------------------------------------------------------------------
// QR → SVG path (the matrix comes from `uqr`, loaded lazily by the client)
// ---------------------------------------------------------------------------

/**
 * One `M h v h z` square per dark module, in module units. Runs of dark modules on a row are
 * merged into one rectangle, which keeps the path short (and the PDF small).
 */
export function qrPathData(matrix: readonly (readonly boolean[])[]): string {
  const parts: string[] = [];
  matrix.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < row.length && row[x]) x += 1;
      parts.push(`M${start} ${y}h${x - start}v1h${start - x}z`);
    }
  });
  return parts.join("");
}
