interface ContourOptions {
  cx: number;
  cy: number;
  rings: number;
  seed: number;
  /** Distance between rings. */
  spacing: number;
  /** Horizontal stretch, so the terrain reads as a ridge rather than a cone. */
  xScale?: number;
  firstRadius?: number;
}

/** Nested, wobbly closed rings around one peak, as SVG path strings. Deterministic per seed. */
export function contourPaths({ cx, cy, rings, seed, spacing, xScale = 1.55, firstRadius = spacing }: ContourOptions): string[] {
  return Array.from({ length: rings }, (_, ring) => {
    const radius = firstRadius + ring * spacing;
    const wobble = 0.12 + ring * 0.012;
    const steps = 96;
    const points: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const noise =
        Math.sin(3 * t + seed) * 0.5 + Math.sin(5 * t + seed * 1.7 + ring * 0.15) * 0.3 + Math.sin(2 * t + seed * 0.3) * 0.2;
      const r = radius * (1 + wobble * noise);
      points.push(`${(cx + r * Math.cos(t) * xScale).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`);
    }
    return `M${points.join("L")}Z`;
  });
}
