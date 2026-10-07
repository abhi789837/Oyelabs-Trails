/**
 * v5 certificates (Phase 5): shared shapes and pure helpers.
 *
 * The server is the source of truth: it issues a row into `certificates` when a track, a course or
 * a goal is complete (`server/src/v5/certificates/repo.ts`), idempotently on (user, kind, ref). The
 * client only shows what it is given. `/verify/:certId` is public and shows the minimum: holder,
 * title, issue date and whether it is still valid.
 *
 * Rebrand Phase 5: the PDF and the PNG are drawn by the server from the kit's A4 template
 * (`server/src/v5/certificates/template.ts`); the browser only shows and downloads them.
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
  /** Path only (`/verify/<id>`), for links inside the app. */
  verifyPath: string;
  /** The full public link on the configured origin (PUBLIC_ORIGIN): what the QR, LinkedIn and "copy link" use. */
  verifyUrl: string;
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
 * Random bytes for a new certificate code. Phase 5 (rebrand) raised it from 5 bytes (40 bits,
 * `OYL-XXXX-XXXX`) to 10 bytes (80 bits, `OYL-XXXX-XXXX-XXXX-XXXX`): the code is the only key to a
 * public page and a public image, and 80 bits can't be found by trying codes, even at the public
 * routes' rate limit. Codes already issued keep working.
 */
export const CERTIFICATE_CODE_BYTES = 10;

/**
 * A public code from random bytes: `OYL-` plus groups of four Crockford base32 characters (no I, L,
 * O or U, so it reads aloud and types without confusion). 5 bytes give two groups (the older
 * codes), 10 bytes four.
 */
export function certificateCode(bytes: Uint8Array): string {
  const chars = Math.floor((bytes.length * 8) / 5 / 4) * 4;
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5 && out.length < chars) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
    value &= (1 << bits) - 1;
  }
  while (out.length < chars) out += "0";
  return `OYL-${out.match(/.{4}/g)?.join("-") ?? ""}`;
}

/**
 * Accepts the current codes (OYL-XXXX-XXXX-XXXX-XXXX), the first v5 codes (OYL-XXXX-XXXX) and the
 * older browser ones (OYL-FE-XXXX-XXXX).
 */
export const CERTIFICATE_ID_RE = /^OYL-[0-9A-Z]{1,6}(-[0-9A-Z]{4}){1,3}$/;

export function isCertificateId(value: string): boolean {
  return CERTIFICATE_ID_RE.test(value);
}

export function verifyPathFor(id: string): string {
  return `/verify/${encodeURIComponent(id)}`;
}

/** `https://learn.oyegen.com/verify/<id>` on the configured public origin (no trailing slash twice). */
export function verifyUrlFor(origin: string, id: string): string {
  return `${origin.replace(/\/+$/, "")}${verifyPathFor(id)}`;
}

/** What the certificate prints under "Verify:": the link without its scheme. */
export function verifyDisplay(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

/** The credential name LinkedIn shows: "Oyelearn – <Course>". */
export function linkedInCredentialName(title: string): string {
  return `Oyelearn – ${title}`;
}

/** "oyelearn-certificate-OYL-AB12-CD34.pdf". */
export function certificateFileName(id: string, ext: "pdf" | "png"): string {
  return `oyelearn-certificate-${id.replace(/[^A-Za-z0-9-]/g, "")}.${ext}`;
}

/** The line between the name and the title, by kind. A course reads exactly as the kit's template. */
export function completionLine(kind: CertificateKind): string {
  if (kind === "goal") return "has reached the goal";
  if (kind === "track") return "has completed the path";
  return "has completed";
}

// ---------------------------------------------------------------------------
// Signature (admin setting)
// ---------------------------------------------------------------------------

/** The optional signatory printed above the signature line, e.g. a name and a job title. */
export interface CertificateSignature {
  name: string;
  title: string;
}

export const SIGNATURE_NAME_MAX = 60;
export const SIGNATURE_TITLE_MAX = 60;

/**
 * What the signature block prints: above the line and under it. With no signatory set it is the
 * organisation itself ("Oyelabs" over "Issued by"): a neutral placeholder, never an invented name.
 */
export function signatureLines(sig: CertificateSignature | null): { above: string; below: string } {
  const name = sig?.name.trim() ?? "";
  const title = sig?.title.trim() ?? "";
  if (!name) return { above: "Oyelabs", below: "Issued by" };
  return { above: name, below: title ? `${title}, Oyelabs` : "Oyelabs" };
}

/** "6 October 2026", in UTC so the same certificate reads the same everywhere. */
export function formatIssueDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
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
