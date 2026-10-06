import { useMemo } from "react";

import { contourPaths } from "@/lib/contours";

import { ART, artLayout, BRAND_BLUE, INK, MARK_PATHS, MARK_VIEWBOX, MUTED, PAPER, SUMMIT, type CertificateText } from "./art";
import type { QrShape } from "./qr";

/**
 * The certificate, on screen: one SVG in A4-landscape proportions, always light (it's a document,
 * and the PDF matches it). The verify URL is printed as text as well as the QR, so a printout
 * still works without a phone.
 */
export function CertificateArt({ cert, qr, revoked, className }: { cert: CertificateText; qr: QrShape | null; revoked?: boolean; className?: string }) {
  const layout = artLayout(cert);
  const contours = useMemo(() => contourPaths({ cx: 1010, cy: 120, rings: 12, seed: cert.id.length + cert.title.length, spacing: 34, firstRadius: 24, xScale: 1.4 }), [cert.id, cert.title]);
  const { width: W, height: H } = ART;
  const qrSize = 132;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={`${layout.kindLabel}: ${cert.title}, awarded to ${cert.holderName} on ${layout.issued}. Certificate ID ${cert.id}.`}>
      <rect width={W} height={H} fill={PAPER} />
      <g aria-hidden="true">
        {contours.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={BRAND_BLUE} strokeOpacity={0.09} strokeWidth={i % 4 === 3 ? 1.6 : 1} />
        ))}
        <rect x={20} y={20} width={W - 40} height={H - 40} fill="none" stroke={INK} strokeWidth={1.6} />
        <rect x={28} y={28} width={W - 56} height={H - 56} fill="none" stroke={BRAND_BLUE} strokeOpacity={0.35} strokeWidth={1} />

        {/* Logo: the mark plus the Sora wordmark, as in the kit. */}
        <svg x={72} y={66} width={46} height={46} viewBox={MARK_VIEWBOX}>
          {MARK_PATHS.map((p) => (
            <path key={p.d} d={p.d} fill="none" stroke={BRAND_BLUE} strokeWidth={p.width} />
          ))}
        </svg>
        <text x={128} y={101} fontFamily="Sora, sans-serif" fontWeight={700} fontSize={30}>
          <tspan fill={BRAND_BLUE}>Oye</tspan>
          <tspan fill={INK}>learn</tspan>
        </text>
        <text x={W - 72} y={97} textAnchor="end" fontFamily="Sora, sans-serif" fontWeight={600} fontSize={17} fill={MUTED}>
          {/* Sentence case, like every other label (UX review CT1). */}
          {layout.kindLabel}
        </text>

        <text x={72} y={250} fontFamily="Sora, sans-serif" fontSize={20} fill={MUTED}>
          {layout.lead}
        </text>
        <text x={72} y={250 + 22 + layout.nameSize} fontFamily="Sora, sans-serif" fontWeight={600} fontSize={layout.nameSize} fill={INK} letterSpacing={-0.5}>
          {cert.holderName}
        </text>
        <text x={72} y={360 + layout.nameSize} fontFamily="Sora, sans-serif" fontSize={20} fill={MUTED}>
          {layout.completedLine}
        </text>
        <text x={72} y={372 + layout.nameSize + layout.titleSize} fontFamily="Sora, sans-serif" fontWeight={600} fontSize={layout.titleSize} fill={BRAND_BLUE}>
          {cert.title}
        </text>

        {/* Summit seal. */}
        <g transform={`translate(${W / 2 - 40} ${H - 150})`}>
          <circle r={44} fill={SUMMIT} />
          <circle r={37} fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={1.4} strokeDasharray="1 4" />
          <path d="M-22 14 L-6 -12 L2 -1 L8 -8 L22 14 Z" fill="#FFFFFF" />
        </g>

        <line x1={72} x2={420} y1={H - 150} y2={H - 150} stroke={INK} strokeOpacity={0.25} />
        <text x={72} y={H - 120} fontFamily="Sora, sans-serif" fontWeight={600} fontSize={17} fill={INK}>
          Issued {layout.issued}
        </text>
        <text x={72} y={H - 94} fontFamily="'JetBrains Mono Variable', 'IBM Plex Mono', monospace" fontSize={14} fill={MUTED}>
          Certificate ID {cert.id}
        </text>
        <text x={72} y={H - 70} fontFamily="Sora, sans-serif" fontSize={13} fill={MUTED}>
          Oyelabs · Oyelearn
        </text>

        {/* QR + where to check it. */}
        <rect x={W - 72 - qrSize - 8} y={H - 72 - qrSize - 8} width={qrSize + 16} height={qrSize + 16} rx={10} fill="#FFFFFF" stroke={INK} strokeOpacity={0.15} />
        {qr ? (
          <svg x={W - 72 - qrSize} y={H - 72 - qrSize} width={qrSize} height={qrSize} viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges">
            <path d={qr.path} fill={INK} />
          </svg>
        ) : null}
        <text x={W - 72 - qrSize - 24} y={H - 120} textAnchor="end" fontFamily="Sora, sans-serif" fontWeight={600} fontSize={15} fill={INK}>
          Check it's real
        </text>
        <text x={W - 72 - qrSize - 24} y={H - 96} textAnchor="end" fontFamily="'JetBrains Mono Variable', 'IBM Plex Mono', monospace" fontSize={12.5} fill={MUTED}>
          {layout.verifyText}
        </text>

        {revoked ? (
          <g transform={`rotate(-14 ${W / 2} ${H / 2})`}>
            <rect x={W / 2 - 230} y={H / 2 - 44} width={460} height={88} rx={10} fill="#FFFFFF" fillOpacity={0.85} stroke="#B91C1C" strokeWidth={4} />
            <text x={W / 2} y={H / 2 + 16} textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight={700} fontSize={44} fill="#B91C1C">
              WITHDRAWN
            </text>
          </g>
        ) : null}
      </g>
    </svg>
  );
}
