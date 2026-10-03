/**
 * The geometry of a trail: where the waypoints go and the one path that joins them.
 *
 * Pure: no DOM, no React. The component measures its own width and hands it in; everything the SVG
 * draws comes out of `computeTrail`, which is what the unit tests exercise.
 *
 * ## Why this exists
 *
 * The first weekly trail drew one cubic per pair of waypoints, each with its own `M`, and filled a
 * "walked" stretch only when *both* of its ends were done. Three things went wrong with that:
 * - the walked fill had gaps wherever a learner had done item 4 but not item 3;
 * - waypoints sat a fixed 118px apart, so a long title on one item ran into the next one's label;
 * - the summit stretch was computed from a different rule (`week.status`) from the summit marker
 *   (`every item done`), so the line and the marker could disagree.
 *
 * Here, positions come from **item order only** (never from where lane boxes happen to be laid
 * out), spacing comes from the label heights, the trail is **one** path with exactly one `M`, and
 * progress is a single arc length: from the trailhead to the furthest completed item.
 *
 * ## The curve
 *
 * The points are joined with a centripetal Catmull-Rom spline (α = 0.5, Yuksel, Schaefer & Keyser
 * 2009), converted segment by segment to cubic Béziers so the result is plain SVG `C` commands. The
 * centripetal form avoids the cusps and loops the uniform form makes when neighbouring segments
 * differ a lot in length, which is exactly what a zig-zag with label-driven spacing produces. The
 * two ends use phantom points reflected through the first and last waypoints, so the trail leaves
 * the trailhead and arrives at the summit along its own direction instead of kinking.
 *
 * Each control point's `y` is clamped between its segment's endpoints, which keeps every segment
 * monotonic downwards (a trail never climbs back up the page), and `x` is clamped to the container.
 */

export interface Point {
  x: number;
  y: number;
}

export type TrailMode = "desktop" | "mobile";
export type LabelSide = "left" | "right";

/** At or above this container width the trail winds across the page; below, it zig-zags down the left. */
export const DESKTOP_MIN_WIDTH = 768;

export interface TrailItemInput {
  id: string;
  /** What colours the marker and the stretch of trail leading into it: a lane, a part, anything. */
  tone: string;
  done: boolean;
  /**
   * The label's height in px, or a function of the width the label will get (so it can be
   * estimated from the text once the layout has decided how wide the column is).
   */
  labelHeight: number | ((labelWidth: number) => number);
}

export interface TrailInput {
  items: readonly TrailItemInput[];
  width: number;
  /** Heights of the trailhead and summit labels. */
  startLabelHeight?: number;
  endLabelHeight?: number;
  /** Tighter spacing, for past weeks and the overview. */
  compact?: boolean;
  /** Force a layout; by default decided by `width`. */
  mode?: TrailMode | "auto";
}

export interface LabelBox {
  side: LabelSide;
  /** Left edge and width of the label column, in px from the container's left. */
  left: number;
  width: number;
}

export interface TrailWaypoint {
  kind: "start" | "item" | "end";
  /** Index into `items` for an item; -1 for the trailhead and summit. */
  itemIndex: number;
  id: string;
  point: Point;
  label: LabelBox;
  labelHeight: number;
  /** Arc length from the trailhead to this waypoint. */
  length: number;
  tone: string;
  done: boolean;
}

export interface TrailSegment {
  /** Segment i runs from waypoint i to waypoint i + 1, so it *leads into* item i (or the summit). */
  index: number;
  from: Point;
  c1: Point;
  c2: Point;
  to: Point;
  /** The tone of the waypoint it leads into; `"summit"` for the last stretch. */
  tone: string;
  /** This stretch alone, as a sub-path (`M … C …`), for a coloured overlay. */
  d: string;
  startLength: number;
  endLength: number;
}

export interface TrailGeometry {
  mode: TrailMode;
  width: number;
  height: number;
  /** The whole trail: exactly one `M`, then one `C` per segment. */
  d: string;
  waypoints: TrailWaypoint[];
  segments: TrailSegment[];
  totalLength: number;
  /** Index of the furthest completed item in plan order, or -1. */
  furthestDoneIndex: number;
  /** Arc length of the walked part: trailhead → furthest completed item (→ summit when all done). */
  progressLength: number;
  /** The walked part as its own path (a prefix of `d`), or "" when nothing is done. */
  progressD: string;
  /** "You are here": the first item not done, or -1 when every item is. */
  hereIndex: number;
  /** Every item done (and there is at least one). The same rule the marker and the line use. */
  summitReached: boolean;
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const TOP = 40;
const BOTTOM = 96;
const LABEL_PAD = 14;
const EDGE = 4;

/** Marker half-size plus breathing room, between a marker and its label. */
const DESKTOP_LABEL_GAP = 36;
/** On a phone the labels share one column right of the zig-zag. */
const MOBILE_X = [24, 60] as const;
const MOBILE_LABEL_LEFT = 84;

function minGap(mode: TrailMode, compact: boolean): number {
  if (compact) return mode === "desktop" ? 76 : 64;
  return mode === "desktop" ? 104 : 92;
}

const round = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) => String(round(n));
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function trailMode(width: number, mode: TrailInput["mode"] = "auto"): TrailMode {
  if (mode === "desktop" || mode === "mobile") return mode;
  return width >= DESKTOP_MIN_WIDTH ? "desktop" : "mobile";
}

/** Where waypoint `k` (0 = trailhead, last = summit) sits across the page, and its label column. */
function column(mode: TrailMode, width: number, k: number, last: number): { x: number; label: LabelBox } {
  if (mode === "mobile") {
    const x = k === 0 ? MOBILE_X[0] : k === last ? MOBILE_X[0] + 10 : MOBILE_X[(k - 1) % 2];
    return { x, label: { side: "right", left: MOBILE_LABEL_LEFT, width: Math.max(60, width - MOBILE_LABEL_LEFT - EDGE) } };
  }
  if (k === 0 || k === last) {
    const x = width / 2;
    const left = x + DESKTOP_LABEL_GAP;
    return { x, label: { side: "right", left, width: Math.max(60, width - left - EDGE) } };
  }
  // Items alternate either side of the centre line, labels on the outside.
  const leftSide = (k - 1) % 2 === 0;
  const x = width * (leftSide ? 0.36 : 0.64);
  if (leftSide) {
    const labelWidth = Math.max(60, x - DESKTOP_LABEL_GAP - EDGE);
    return { x, label: { side: "left", left: x - DESKTOP_LABEL_GAP - labelWidth, width: labelWidth } };
  }
  const left = x + DESKTOP_LABEL_GAP;
  return { x, label: { side: "right", left, width: Math.max(60, width - left - EDGE) } };
}

// ---------------------------------------------------------------------------
// Label height estimate
// ---------------------------------------------------------------------------

export interface LabelText {
  title: string;
  /** Characters on the small meta line under the title ("Must know  45m"). */
  meta?: string;
  /** Further short lines, such as "You are here". */
  extraLines?: number;
  compact?: boolean;
}

/**
 * A conservative guess at a label's rendered height.
 *
 * Measuring would mean a render, a read and a re-render; a slightly generous estimate costs a few
 * pixels of air and never an overlap. The factors are for Space Grotesk semibold at 16px (14px
 * compact) with `leading-snug`, plus 15% for words that wrap early.
 */
export function estimateLabelHeight(text: LabelText, labelWidth: number): number {
  const fontPx = text.compact ? 13 : 16;
  const lineHeight = Math.ceil(fontPx * 1.375);
  const charWidth = fontPx * 0.58;
  const usable = Math.max(40, labelWidth);
  const titleLines = Math.max(1, Math.ceil((text.title.length * charWidth * 1.15) / usable));
  const metaCharWidth = 6.8; // 11px mono
  const metaLines = text.meta ? Math.max(1, Math.ceil((text.meta.length * metaCharWidth) / usable)) : 0;
  const extra = text.extraLines ?? 0;
  return titleLines * lineHeight + metaLines * 20 + extra * 20;
}

// ---------------------------------------------------------------------------
// The curve
// ---------------------------------------------------------------------------

const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

/**
 * Bézier control points for the Catmull-Rom segment p1 → p2, given neighbours p0 and p3.
 * Centripetal (α = 0.5) knot spacing; falls back to the uniform tangent when a knot interval is 0.
 */
function controls(p0: Point, p1: Point, p2: Point, p3: Point, alpha = 0.5): [Point, Point] {
  const d1 = Math.pow(dist(p0, p1), alpha);
  const d2 = Math.pow(dist(p1, p2), alpha);
  const d3 = Math.pow(dist(p2, p3), alpha);
  const eps = 1e-6;

  let c1: Point;
  if (d1 < eps || d2 < eps) c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
  else {
    const a = 2 * d1 * d1 + 3 * d1 * d2 + d2 * d2;
    const n = 3 * d1 * (d1 + d2);
    c1 = { x: (d1 * d1 * p2.x - d2 * d2 * p0.x + a * p1.x) / n, y: (d1 * d1 * p2.y - d2 * d2 * p0.y + a * p1.y) / n };
  }

  let c2: Point;
  if (d3 < eps || d2 < eps) c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
  else {
    const b = 2 * d3 * d3 + 3 * d3 * d2 + d2 * d2;
    const m = 3 * d3 * (d3 + d2);
    c2 = { x: (d3 * d3 * p1.x - d2 * d2 * p3.x + b * p2.x) / m, y: (d3 * d3 * p1.y - d2 * d2 * p3.y + b * p2.y) / m };
  }
  return [c1, c2];
}

/** A point on a cubic Bézier at t ∈ [0, 1]. */
export function cubicAt(p0: Point, c1: Point, c2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const e = t * t * t;
  return { x: a * p0.x + b * c1.x + c * c2.x + e * p3.x, y: a * p0.y + b * c1.y + c * c2.y + e * p3.y };
}

/** Arc length by sampling. 32 chords is well under a pixel of error at these sizes. */
function cubicLength(p0: Point, c1: Point, c2: Point, p3: Point, steps = 32): number {
  let length = 0;
  let prev = p0;
  for (let i = 1; i <= steps; i++) {
    const next = cubicAt(p0, c1, c2, p3, i / steps);
    length += dist(prev, next);
    prev = next;
  }
  return length;
}

const cmd = (c1: Point, c2: Point, to: Point) => `C${fmt(c1.x)},${fmt(c1.y)} ${fmt(c2.x)},${fmt(c2.y)} ${fmt(to.x)},${fmt(to.y)}`;
const move = (p: Point) => `M${fmt(p.x)},${fmt(p.y)}`;

// ---------------------------------------------------------------------------
// The trail
// ---------------------------------------------------------------------------

export function computeTrail(input: TrailInput): TrailGeometry {
  const width = Math.max(120, input.width);
  const mode = trailMode(width, input.mode);
  const compact = input.compact ?? false;
  const items = input.items;
  const last = items.length + 1;
  const gap = minGap(mode, compact);

  // 1. Columns and label heights, from order alone.
  const slots = Array.from({ length: last + 1 }, (_, k) => column(mode, width, k, last));
  const heights = slots.map((slot, k) => {
    if (k === 0) return input.startLabelHeight ?? 40;
    if (k === last) return input.endLabelHeight ?? 44;
    const h = items[k - 1].labelHeight;
    return typeof h === "function" ? h(slot.label.width) : h;
  });

  // 2. Vertical spacing: at least `gap` after the previous waypoint, and far enough below the last
  //    label on the same side that the two labels cannot touch.
  const ys: number[] = [TOP];
  for (let k = 1; k <= last; k++) {
    let y = ys[k - 1] + gap;
    for (let j = k - 1; j >= 0; j--) {
      if (slots[j].label.side === slots[k].label.side) {
        y = Math.max(y, ys[j] + (heights[j] + heights[k]) / 2 + LABEL_PAD);
        break;
      }
    }
    ys.push(round(y));
  }

  const points: Point[] = slots.map((slot, k) => ({ x: round(clamp(slot.x, 0, width)), y: ys[k] }));

  // 3. Segments: centripetal Catmull-Rom → cubic Bézier, phantom ends reflected.
  const at = (k: number): Point => {
    if (k < 0) return { x: 2 * points[0].x - points[1].x, y: 2 * points[0].y - points[1].y };
    if (k > last) return { x: 2 * points[last].x - points[last - 1].x, y: 2 * points[last].y - points[last - 1].y };
    return points[k];
  };

  const segments: TrailSegment[] = [];
  let running = 0;
  for (let i = 0; i < last; i++) {
    const from = points[i];
    const to = points[i + 1];
    const [r1, r2] = controls(at(i - 1), from, to, at(i + 2));
    const c1 = { x: round(clamp(r1.x, 0, width)), y: round(clamp(r1.y, from.y, to.y)) };
    const c2 = { x: round(clamp(r2.x, 0, width)), y: round(clamp(r2.y, from.y, to.y)) };
    const length = cubicLength(from, c1, c2, to);
    segments.push({
      index: i,
      from,
      c1,
      c2,
      to,
      tone: i < items.length ? items[i].tone : "summit",
      d: `${move(from)} ${cmd(c1, c2, to)}`,
      startLength: running,
      endLength: running + length,
    });
    running += length;
  }
  const totalLength = running;

  const d = [move(points[0]), ...segments.map((s) => cmd(s.c1, s.c2, s.to))].join(" ");

  // 4. Waypoints with their arc lengths.
  const lengthAt = (k: number) => (k === 0 ? 0 : segments[k - 1].endLength);
  const waypoints: TrailWaypoint[] = points.map((point, k) => {
    const isItem = k > 0 && k < last;
    const item = isItem ? items[k - 1] : null;
    return {
      kind: k === 0 ? "start" : k === last ? "end" : "item",
      itemIndex: isItem ? k - 1 : -1,
      id: item ? item.id : k === 0 ? "start" : "end",
      point,
      label: slots[k].label,
      labelHeight: heights[k],
      length: lengthAt(k),
      tone: item ? item.tone : k === 0 ? "start" : "summit",
      done: item ? item.done : false,
    };
  });

  // 5. Progress: up to the furthest completed item, not "every item before it".
  let furthestDoneIndex = -1;
  items.forEach((item, i) => {
    if (item.done) furthestDoneIndex = i;
  });
  const summitReached = items.length > 0 && items.every((item) => item.done);
  const walkedSegments = summitReached ? last : furthestDoneIndex + 1;
  const progressLength = walkedSegments === 0 ? 0 : segments[walkedSegments - 1].endLength;
  const progressD =
    walkedSegments === 0 ? "" : [move(points[0]), ...segments.slice(0, walkedSegments).map((s) => cmd(s.c1, s.c2, s.to))].join(" ");

  waypoints[last].done = summitReached;

  return {
    mode,
    width,
    height: round(points[last].y + BOTTOM),
    d,
    waypoints,
    segments,
    totalLength,
    furthestDoneIndex,
    progressLength,
    progressD,
    hereIndex: items.findIndex((item) => !item.done),
    summitReached,
  };
}

/**
 * A point part-way along the trail, by waypoint position: 0 is the trailhead, 1 the first item,
 * 1.5 halfway (in curve parameter) between the first and second items. For markers that sit on the
 * line between waypoints, such as weeks on the overview.
 */
export function pointAlong(geometry: TrailGeometry, position: number): Point {
  const segments = geometry.segments;
  if (segments.length === 0) return geometry.waypoints[0].point;
  const p = clamp(position, 0, segments.length);
  const i = Math.min(segments.length - 1, Math.floor(p));
  const s = segments[i];
  const t = p - i;
  const point = cubicAt(s.from, s.c1, s.c2, s.to, t);
  return { x: round(point.x), y: round(point.y) };
}

// ---------------------------------------------------------------------------
// Path parsing (used by the tests and the e2e check; small enough to keep beside the writer)
// ---------------------------------------------------------------------------

export interface PathCommand {
  op: string;
  values: number[];
}

/** Splits an SVG path `d` into commands and numbers. Absolute commands only are produced here. */
export function parsePath(d: string): PathCommand[] {
  const out: PathCommand[] = [];
  const re = /([MmLlCcSsQqTtHhVvAaZz])([^MmLlCcSsQqTtHhVvAaZz]*)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(d)) !== null) {
    const nums = match[2].match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
    out.push({ op: match[1], values: nums.map(Number) });
  }
  return out;
}
