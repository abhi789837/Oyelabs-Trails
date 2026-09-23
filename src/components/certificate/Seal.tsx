/** Geometry shared by the on-screen seal and the PDF seal (both use a 132×132 box). */
export const SEAL_SIZE = 132;
export const SEAL_PEAK = "M42 82 L60 52 L68 62 L77 48 L92 82 Z";
export const SEAL_SNOW = "M60 52 L65 60 L68 62 L71 57 L77 48 L81 55 L74 58 L68 66 L62 58 Z";

/** The summit seal, filled in the track's accent color. */
export function Seal({ color, className }: { color: string; className?: string }) {
  const c = SEAL_SIZE / 2;
  return (
    <svg viewBox={`0 0 ${SEAL_SIZE} ${SEAL_SIZE}`} width={SEAL_SIZE} height={SEAL_SIZE} className={className} aria-hidden="true">
      <circle cx={c} cy={c} r={64} fill={color} />
      <circle cx={c} cy={c} r={56} fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.2} />
      <circle cx={c} cy={c} r={50} fill="none" stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={2.2} strokeDasharray="0.1 5.2" strokeLinecap="round" />
      <path d={SEAL_PEAK} fill="#FFFFFF" />
      <path d={SEAL_SNOW} fill={color} fillOpacity={0.35} />
      <text x={c} y={100} textAnchor="middle" fill="#FFFFFF" fontFamily="Sora, sans-serif" fontSize={12} fontWeight={600}>
        Summit
      </text>
    </svg>
  );
}
