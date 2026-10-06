import { fitFontSize, formatIssueDate, type CertificateKind, CERTIFICATE_KIND_LABELS } from "@shared/certificates";

/**
 * Everything the three renderings (on screen SVG, PDF, share PNG) share: the brand colours from the
 * Oyelearn logo kit, the mark's paths, and the certificate's layout in A4-landscape units. Pure.
 */

/** Logo kit, light mode: mark and "Oye" #1D4ED8, "learn" #0F172A. Sora Bold. */
export const BRAND_BLUE = "#1D4ED8";
export const INK = "#0F172A";
export const MUTED = "#475569";
export const PAPER = "#FBFBF8";
export const SUMMIT = "#15803D";

/** The Oyelearn mark (from public/brand/oyelearn-mark-*.svg), in its own units: viewBox 14.5 14.5 171 171. */
export const MARK_VIEWBOX = "14.5 14.5 171 171";
export const MARK_PATHS: { d: string; width: number }[] = [
  { d: "M150.14 159.75A78 78 0 1 1 139.00 32.45", width: 15 },
  { d: "M157.97 47.81A78 78 0 0 1 166.15 141.33", width: 15 },
  { d: "M75.00 143.30A50 50 0 1 1 146.98 117.10", width: 14 },
  { d: "M138.30 132.14A50 50 0 0 1 91.32 149.24", width: 14 },
];

/** A4 landscape at 96 dpi; the PDF uses points (×0.75). */
export const ART = { width: 1123, height: 794 } as const;

export interface CertificateText {
  holderName: string;
  title: string;
  kind: CertificateKind;
  issuedAt: number;
  id: string;
  /** Full URL, for the QR. */
  verifyUrl: string;
}

export interface ArtLayout {
  kindLabel: string;
  lead: string;
  completedLine: string;
  issued: string;
  verifyText: string;
  nameSize: number;
  titleSize: number;
}

/** "Track certificate", the verb line by kind, sizes that fit the name and title on one line. */
export function artLayout(c: CertificateText): ArtLayout {
  const verb = c.kind === "goal" ? "reached the goal" : c.kind === "course" ? "completed the course" : "reached the summit of the track";
  return {
    kindLabel: `${CERTIFICATE_KIND_LABELS[c.kind]} certificate`,
    lead: "This certifies that",
    completedLine: verb,
    issued: formatIssueDate(c.issuedAt),
    verifyText: c.verifyUrl.replace(/^https?:\/\//, ""),
    nameSize: fitFontSize(c.holderName, 780, 60, 30),
    titleSize: fitFontSize(c.title, 780, 36, 20),
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** "oyelearn-certificate-OYL-AB12-CD34". */
export function fileBase(id: string): string {
  return `oyelearn-certificate-${id.replace(/[^A-Za-z0-9-]/g, "")}`;
}
