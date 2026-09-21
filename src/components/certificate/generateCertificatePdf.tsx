// Loaded on demand (dynamic import) so @react-pdf/renderer stays out of the main bundle.
import { Circle, Document, Font, Page, Path, pdf, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
// TTF copies of the brand fonts (see src/assets/fonts/README.md for why not WOFF).
import plexMono400 from "@/assets/fonts/ibm-plex-mono-latin-400.ttf?url";
import plexSans400 from "@/assets/fonts/ibm-plex-sans-latin-400.ttf?url";
import plexSans600 from "@/assets/fonts/ibm-plex-sans-latin-600.ttf?url";
import grotesk500 from "@/assets/fonts/space-grotesk-latin-500.ttf?url";
import grotesk700 from "@/assets/fonts/space-grotesk-latin-700.ttf?url";

import { nameScale, type CertificateData } from "@/lib/certificate";
import { contourPaths } from "@/lib/contours";
import { formatDate, formatMinutes } from "@/lib/utils";
import { SEAL_PEAK, SEAL_SIZE, SEAL_SNOW } from "./Seal";

Font.register({
  family: "Space Grotesk",
  fonts: [
    { src: grotesk500, fontWeight: 500 },
    { src: grotesk700, fontWeight: 700 },
  ],
});
Font.register({
  family: "IBM Plex Sans",
  fonts: [
    { src: plexSans400, fontWeight: 400 },
    { src: plexSans600, fontWeight: 600 },
  ],
});
Font.register({ family: "IBM Plex Mono", src: plexMono400 });
// Never hyphenate names or headings.
Font.registerHyphenationCallback((word) => [word]);

const INK = "#1B1F27";
const MUTED = "#5E6573";
const PAPER = "#FBFBF8";
// A4 landscape in points.
const W = 841.89;
const H = 595.28;

const styles = StyleSheet.create({
  page: { backgroundColor: PAPER, color: INK, fontFamily: "IBM Plex Sans" },
  content: { position: "absolute", top: 54, left: 60, right: 60, bottom: 44 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  brand: { fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 16, marginLeft: 8 },
  kicker: { fontFamily: "Space Grotesk", fontWeight: 500, fontSize: 18, marginTop: 38 },
  lead: { fontSize: 13, color: MUTED, marginTop: 24 },
  name: { fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 44, marginTop: 4, letterSpacing: -1 },
  body: { fontSize: 14, lineHeight: 1.55, marginTop: 10, maxWidth: 540 },
  strong: { fontWeight: 600 },
  spacer: { flexGrow: 1 },
  stats: { flexDirection: "row", borderTopWidth: 0.8, borderTopColor: "#C9CBC5", paddingTop: 12 },
  stat: { flex: 1, paddingRight: 12 },
  statLabel: { fontFamily: "IBM Plex Mono", fontSize: 8.5, color: MUTED },
  statValue: { fontFamily: "Space Grotesk", fontWeight: 500, fontSize: 13.5, marginTop: 3 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  mono: { fontFamily: "IBM Plex Mono", fontSize: 8.5, color: MUTED },
});

function CertificateDocument({ data }: { data: CertificateData }) {
  const contours = contourPaths({ cx: 782, cy: 92, rings: 12, seed: data.topicsCount, spacing: 29, firstRadius: 22, xScale: 1.4 });
  const c = SEAL_SIZE / 2;
  const stats = [
    { label: "Completed", value: formatDate(data.completedAt) },
    { label: "Topics", value: `${data.topicsCount}, incl. ${data.milestoneCount} milestones` },
    { label: "Material", value: formatMinutes(data.totalMinutes) },
    { label: "Average best score", value: data.averageScore === null ? "n/a" : `${data.averageScore}%` },
  ];

  return (
    <Document
      title={`${data.trackName} certificate: ${data.name}`}
      author="Oyelabs Trails"
      subject={`Certificate of completion, ${data.trackName} trail`}
      creator="Oyelabs Trails"
      producer="Oyelabs Trails"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* A hair shorter than the page: an SVG as tall as the page gets pushed onto its own page. */}
        <Svg fixed width={W} height={H - 2} viewBox={`0 0 ${W} ${H - 2}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {contours.map((d, i) => (
            <Path key={i} d={d} fill="none" stroke={data.accentHex} strokeOpacity={0.16} strokeWidth={i % 4 === 3 ? 1.1 : 0.7} />
          ))}
          <Rect x={15} y={15} width={W - 30} height={H - 30} fill="none" stroke={INK} strokeWidth={1.3} />
          <Rect x={20} y={20} width={W - 40} height={H - 40} fill="none" stroke={INK} strokeOpacity={0.25} strokeWidth={0.8} />
        </Svg>

        {/* Summit seal, same geometry as the on-screen one, scaled to 104pt. */}
        <Svg width={104} height={104} viewBox={`0 0 ${SEAL_SIZE} ${SEAL_SIZE}`} style={{ position: "absolute", top: 44, right: 54 }}>
          <Circle cx={c} cy={c} r={64} fill={data.accentHex} />
          <Circle cx={c} cy={c} r={56} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.2} />
          <Circle cx={c} cy={c} r={50} fill="none" stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={1.4} strokeDasharray="1 4.4" />
          <Path d={SEAL_PEAK} fill="#FFFFFF" />
          <Path d={SEAL_SNOW} fill={data.accentHex} fillOpacity={0.35} />
        </Svg>
        <Text
          style={{
            position: "absolute",
            top: 44 + 104 * (90 / SEAL_SIZE),
            right: 54,
            width: 104,
            textAlign: "center",
            fontFamily: "Space Grotesk",
            fontWeight: 500,
            fontSize: 9.5,
            color: "#FFFFFF",
          }}
        >
          Summit
        </Text>

        <View style={styles.content}>
          <View style={styles.brandRow}>
            <Svg width={24} height={24} viewBox="0 0 32 32">
              <Rect width={32} height={32} rx={7} fill={INK} />
              <Path d="M9 26c0-6 14-5 14-11S14 9 14 5" fill="none" stroke="#7B8496" strokeWidth={2} strokeDasharray="1 3" />
              <Circle cx={9} cy={25} r={3.2} fill="#2F6E5B" />
              <Circle cx={14} cy={6.5} r={3.6} fill="#D98E2B" />
            </Svg>
            <Text style={styles.brand}>Oyelabs Trails</Text>
          </View>

          <Text style={styles.kicker}>Certificate of completion</Text>
          <Text style={styles.lead}>This certifies that</Text>
          <Text style={[styles.name, { fontSize: 44 * nameScale(data.name) }]}>{data.name}</Text>
          <Text style={styles.body}>
            reached the summit of the <Text style={styles.strong}>{data.trackName}</Text> trail, completing all{" "}
            {data.topicsCount} topics and passing every graded challenge.
          </Text>

          <View style={styles.spacer} />

          <View style={styles.stats}>
            {stats.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.footer}>
            <Text style={styles.mono}>
              Certificate ID <Text style={{ color: INK }}>{data.certificateId}</Text>
            </Text>
            <Text style={styles.mono}>Issued in the browser by Oyelabs Trails. Not verified by a server.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadCertificatePdf(data: CertificateData): Promise<void> {
  const blob = await pdf(<CertificateDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `oyelabs-${data.trackId}-certificate.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
