// Loaded on demand (dynamic import) so @react-pdf/renderer stays out of every first download.
import { Circle, Document, Font, G, Line, Page, Path, pdf, Rect, Svg, Text } from "@react-pdf/renderer";
// The same TTF brand fonts as the older generator (src/components/certificate/generateCertificatePdf.tsx).
import plexMono400 from "@/assets/fonts/ibm-plex-mono-latin-400.ttf?url";
import sora400 from "@/assets/fonts/sora-latin-400.ttf?url";
import sora600 from "@/assets/fonts/sora-latin-600.ttf?url";
import sora700 from "@/assets/fonts/sora-latin-700.ttf?url";
import { contourPaths } from "@/lib/contours";

import { ART, artLayout, BRAND_BLUE, downloadBlob, fileBase, INK, MARK_PATHS, MUTED, PAPER, SUMMIT, type CertificateText } from "./art";
import type { QrShape } from "./qr";

/**
 * The v5 certificate as a PDF: the on-screen design (CertificateArt) in points, A4 landscape, with
 * the QR as vector paths and the verify URL as text. Extends the older @react-pdf generator's
 * approach (same library, same TTF fonts) with the v5 look and the verification code.
 */

Font.register({
  family: "Sora",
  fonts: [
    { src: sora400, fontWeight: 400 },
    { src: sora600, fontWeight: 600 },
    { src: sora700, fontWeight: 700 },
  ],
});
Font.register({ family: "IBM Plex Mono", src: plexMono400 });
Font.registerHyphenationCallback((word) => [word]);

/** Points per art unit: A4 is 841.89 × 595.28 pt; the art is 1123 × 794 px. */
const K = 841.89 / ART.width;
const W = ART.width;
const H = ART.height;

function CertificateDocument({ cert, qr, revoked }: { cert: CertificateText; qr: QrShape; revoked: boolean }) {
  const layout = artLayout(cert);
  const contours = contourPaths({ cx: 1010, cy: 120, rings: 12, seed: cert.id.length + cert.title.length, spacing: 34, firstRadius: 24, xScale: 1.4 });
  const qrSize = 132;
  const qrScale = qrSize / qr.size;
  const t = (size: number) => size * K;
  return (
    <Document title={`${cert.title}: ${cert.holderName}`} author="Oyelearn" subject={`${layout.kindLabel}, ${cert.title}`} creator="Oyelearn" producer="Oyelearn">
      <Page size="A4" orientation="landscape" style={{ backgroundColor: PAPER, fontFamily: "Sora" }}>
        {/* A hair shorter than the page: an SVG as tall as the page gets pushed onto its own page. */}
        <Svg width={841.89} height={593} viewBox={`0 0 ${W} ${H - 3}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {contours.map((d, i) => (
            <Path key={i} d={d} fill="none" stroke={BRAND_BLUE} strokeOpacity={0.09} strokeWidth={i % 4 === 3 ? 1.6 : 1} />
          ))}
          <Rect x={20} y={20} width={W - 40} height={H - 40} fill="none" stroke={INK} strokeWidth={1.6} />
          <Rect x={28} y={28} width={W - 56} height={H - 56} fill="none" stroke={BRAND_BLUE} strokeOpacity={0.35} strokeWidth={1} />
          <G transform={`translate(72 66) scale(${46 / 171}) translate(-14.5 -14.5)`}>
            {MARK_PATHS.map((p) => (
              <Path key={p.d} d={p.d} fill="none" stroke={BRAND_BLUE} strokeWidth={p.width} />
            ))}
          </G>
          <G transform={`translate(${W / 2 - 40} ${H - 150})`}>
            <Circle cx={0} cy={0} r={44} fill={SUMMIT} />
            <Circle cx={0} cy={0} r={37} fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={1.4} strokeDasharray="1 4" />
            <Path d="M-22 14 L-6 -12 L2 -1 L8 -8 L22 14 Z" fill="#FFFFFF" />
          </G>
          <Line x1={72} x2={420} y1={H - 150} y2={H - 150} stroke={INK} strokeOpacity={0.25} strokeWidth={1} />
          <Rect x={W - 72 - qrSize - 8} y={H - 72 - qrSize - 8} width={qrSize + 16} height={qrSize + 16} rx={10} fill="#FFFFFF" stroke={INK} strokeOpacity={0.15} />
          <G transform={`translate(${W - 72 - qrSize} ${H - 72 - qrSize}) scale(${qrScale})`}>
            <Path d={qr.path} fill={INK} />
          </G>
          {revoked ? <Rect x={W / 2 - 230} y={H / 2 - 44} width={460} height={88} rx={10} fill="#FFFFFF" fillOpacity={0.9} stroke="#B91C1C" strokeWidth={4} /> : null}
        </Svg>

        <Text style={{ position: "absolute", left: t(128), top: t(74), fontSize: t(30), fontWeight: 700 }}>
          <Text style={{ color: BRAND_BLUE }}>Oye</Text>
          <Text style={{ color: INK }}>learn</Text>
        </Text>
        <Text style={{ position: "absolute", right: t(72), top: t(82), fontSize: t(17), fontWeight: 600, color: MUTED }}>{layout.kindLabel}</Text>

        <Text style={{ position: "absolute", left: t(72), top: t(230), fontSize: t(20), color: MUTED }}>{layout.lead}</Text>
        <Text style={{ position: "absolute", left: t(72), top: t(262), fontSize: t(layout.nameSize), fontWeight: 600, color: INK }}>{cert.holderName}</Text>
        <Text style={{ position: "absolute", left: t(72), top: t(340 + layout.nameSize), fontSize: t(20), color: MUTED }}>{layout.completedLine}</Text>
        <Text style={{ position: "absolute", left: t(72), top: t(372 + layout.nameSize), fontSize: t(layout.titleSize), fontWeight: 600, color: BRAND_BLUE }}>{cert.title}</Text>

        <Text style={{ position: "absolute", left: t(72), top: t(H - 138), fontSize: t(17), fontWeight: 600, color: INK }}>Issued {layout.issued}</Text>
        <Text style={{ position: "absolute", left: t(72), top: t(H - 108), fontFamily: "IBM Plex Mono", fontSize: t(14), color: MUTED }}>Certificate ID {cert.id}</Text>
        <Text style={{ position: "absolute", left: t(72), top: t(H - 84), fontSize: t(13), color: MUTED }}>Oyelabs · Oyelearn</Text>

        <Text style={{ position: "absolute", right: t(72 + qrSize + 24), top: t(H - 136), fontSize: t(15), fontWeight: 600, color: INK, textAlign: "right" }}>Check it's real</Text>
        <Text style={{ position: "absolute", right: t(72 + qrSize + 24), top: t(H - 110), fontFamily: "IBM Plex Mono", fontSize: t(12.5), color: MUTED, textAlign: "right" }}>{layout.verifyText}</Text>
        {revoked ? (
          <Text style={{ position: "absolute", left: 0, right: 0, top: t(H / 2 - 26), textAlign: "center", fontSize: t(44), fontWeight: 700, color: "#B91C1C" }}>WITHDRAWN</Text>
        ) : null}
      </Page>
    </Document>
  );
}

export async function downloadCertificatePdfV5(cert: CertificateText, qr: QrShape, revoked = false): Promise<Blob> {
  const blob = await pdf(<CertificateDocument cert={cert} qr={qr} revoked={revoked} />).toBlob();
  downloadBlob(blob, `${fileBase(cert.id)}.pdf`);
  return blob;
}
