/**
 * A chart axis or tooltip number with its unit: "$4", "0.23h", "12%". Money goes in front.
 * Small numbers keep two decimals, so 0.225 hours doesn't round to a misleading "0h".
 */
export function chartValue(value: unknown, unit = ""): string {
  const v = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(v)) return String(value ?? "");
  const n = Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 100) / 100;
  return unit === "$" ? `$${n}` : `${n}${unit}`;
}
