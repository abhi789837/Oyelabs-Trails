import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { BrandMark } from "@/components/layout/BrandMark";
import { useElementWidth } from "@/hooks/useElementWidth";
import { nameScale, type CertificateData } from "@/lib/certificate";
import { contourPaths } from "@/lib/contours";
import { cn, formatDate, formatMinutes } from "@/lib/utils";
import { Seal } from "./Seal";

const WIDTH = 1000;
const HEIGHT = 707; // A4 landscape proportions, matching the PDF

/**
 * The on-screen certificate. It's laid out on a fixed 1000×707 canvas and scaled to fit,
 * so it keeps the same composition as the PDF at every screen size. It stays paper-colored
 * in dark mode, like a printed document.
 */
export function CertificateView({ data }: { data: CertificateData }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const scale = width ? Math.min(width / WIDTH, 1) : 1;
  const contours = useMemo(
    () => contourPaths({ cx: 930, cy: 110, rings: 12, seed: data.topicsCount, spacing: 34, firstRadius: 26, xScale: 1.4 }),
    [data.topicsCount],
  );
  const hasName = data.name.length > 0;

  const stats = [
    { label: "Completed", value: formatDate(data.completedAt) },
    { label: "Topics", value: `${data.topicsCount} across ${data.campCount} camps` },
    { label: "Material", value: formatMinutes(data.totalMinutes) },
    { label: "Average best score", value: data.averageScore === null ? "n/a" : `${data.averageScore}%` },
  ];

  return (
    <figure ref={ref} className="w-full" aria-label={`${data.trackName} certificate preview`}>
      <div style={{ height: HEIGHT * scale }} className="overflow-hidden rounded-sm shadow-[0_1px_0_rgb(0_0_0/0.04),0_12px_40px_-12px_rgb(0_0_0/0.25)]">
        <div
          className="relative origin-top-left bg-paper text-ink"
          style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})` }}
        >
          <svg className="absolute inset-0" width={WIDTH} height={HEIGHT} aria-hidden="true">
            {contours.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={data.accentHex} strokeOpacity={0.16} strokeWidth={i % 4 === 3 ? 1.3 : 0.8} />
            ))}
          </svg>
          <div className="absolute inset-[18px] border-[1.5px] border-ink" />
          <div className="absolute inset-[24px] border border-ink/25" />

          <div className="relative flex h-full flex-col px-[72px] pb-[52px] pt-[64px]">
            <div className="flex items-center gap-3">
              <BrandMark className="h-8 w-8" onPaper />
              <span className="font-display text-[20px] font-semibold tracking-tight">Oyelearn</span>
            </div>

            <motion.div
              className="absolute right-[64px] top-[52px]"
              initial={reduceMotion ? false : { scale: 1.12, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Seal color={data.accentHex} />
            </motion.div>

            <p className="mt-12 font-display text-[22px] font-medium">Certificate of completion</p>
            <p className="mt-8 text-[16px] text-ink/65">This certifies that</p>
            <p
              className={cn(
                "mt-2 max-w-[780px] truncate font-display font-bold leading-[1.1] tracking-[-0.03em]",
                !hasName && "text-ink/25",
              )}
              style={{ fontSize: 54 * nameScale(data.name) }}
            >
              {hasName ? data.name : "Your name"}
            </p>
            <p className="mt-4 max-w-[640px] text-[17px] leading-[1.6]">
              reached the summit of the <span className="font-semibold">{data.trackName}</span> trail, completing all{" "}
              {data.topicsCount} topics and passing every graded challenge.
            </p>

            <dl className="mt-auto grid grid-cols-4 gap-6 border-t border-ink/20 pt-5">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-mono text-[11px] text-ink/60">{s.label}</dt>
                  <dd className="mt-1 font-display text-[17px] font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex items-end justify-between gap-6 font-mono text-[11px] text-ink/60">
              <span>
                Certificate ID <span className="text-ink">{data.certificateId}</span>
              </span>
              <span className="text-right">Issued in the browser by Oyelearn. Not verified by a server.</span>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
