/**
 * ProgressRing's geometry, pure. Its own module so the shared brand constants (which the app entry
 * loads for the full-page loader) don't carry it.
 */
import { RING_RADIUS } from "./brandAssets";

const CENTRE = 100;
/** Where the mark's inner arc starts (its first point, 121.48 144.04): about 64°, clockwise from 3 o'clock. */
export const RING_START_DEG = (Math.atan2(144.04 - CENTRE, 121.48 - CENTRE) * 180) / Math.PI;
/** "Never fully closed": 100% draws 92% of the circle and shows a check instead. */
export const RING_MAX_FRACTION = 0.92;
/** The dot sits just ahead of the arc's end, as in the mark. */
export const RING_DOT_LEAD_DEG = 20;

export interface RingGeometry {
  /** 0–100, rounded and clamped. */
  value: number;
  /** Length of the drawn arc, in viewBox units (the circle's circumference is 2π·49). */
  arcLength: number;
  circumference: number;
  /** Rotation that puts the arc's start where the mark's starts. */
  startDeg: number;
  dot: { cx: number; cy: number };
  complete: boolean;
}

export function progressRingGeometry(raw: number): RingGeometry {
  const value = Number.isFinite(raw) ? Math.round(Math.min(100, Math.max(0, raw))) : 0;
  const circumference = 2 * Math.PI * RING_RADIUS;
  const fraction = (value / 100) * RING_MAX_FRACTION;
  const arcLength = fraction * circumference;
  const sweep = fraction * 360;
  // At 0 the dot sits where the ring will start; at 100 it sits on the tip (ahead of it, it would
  // touch the start and close the ring); otherwise just ahead of the tip.
  const dotDeg = RING_START_DEG + sweep + (value > 0 && value < 100 ? RING_DOT_LEAD_DEG : 0);
  const rad = (dotDeg * Math.PI) / 180;
  const dot = { cx: round(CENTRE + RING_RADIUS * Math.cos(rad)), cy: round(CENTRE + RING_RADIUS * Math.sin(rad)) };
  return { value, arcLength: round(arcLength), circumference: round(circumference), startDeg: round(RING_START_DEG), dot, complete: value === 100 };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
