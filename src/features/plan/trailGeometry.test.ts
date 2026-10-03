import { describe, expect, it } from "vitest";

import { LANE_ORDER, type PlanLane } from "@shared/weeklyPlan";

import {
  DESKTOP_MIN_WIDTH,
  computeTrail,
  estimateLabelHeight,
  parsePath,
  pointAlong,
  type TrailItemInput,
} from "./trailGeometry";

const WIDTHS = [390, 768, 1280, 1440];
const COUNTS = [0, 1, 5, 12, 20];

type Mix = { name: string; lanes: (n: number) => PlanLane[] };

/** Lanes per item, already in plan order (do_now → must_know → medium → low). */
const MIXES: Mix[] = [
  { name: "all four lanes", lanes: (n) => spread(n, [0.25, 0.25, 0.25, 0.25]) },
  { name: "all in one lane (do_now)", lanes: (n) => Array(n).fill("do_now") },
  { name: "all in low", lanes: (n) => Array(n).fill("low") },
  { name: "empty must_know and medium", lanes: (n) => spread(n, [0.5, 0, 0, 0.5]) },
  { name: "only middle lanes", lanes: (n) => spread(n, [0, 0.3, 0.7, 0]) },
];

function spread(n: number, shares: number[]): PlanLane[] {
  const counts = shares.map((s) => Math.floor(s * n));
  let rest = n - counts.reduce((a, b) => a + b, 0);
  for (let i = 0; rest > 0; i = (i + 1) % 4) {
    if (shares[i] > 0) {
      counts[i]++;
      rest--;
    }
  }
  return LANE_ORDER.flatMap((lane, i) => Array<PlanLane>(counts[i]).fill(lane));
}

/** Done patterns: none, a gap (done items not contiguous), all. */
const DONE: { name: string; done: (i: number, n: number) => boolean }[] = [
  { name: "none done", done: () => false },
  { name: "scattered", done: (i) => i % 3 === 1 },
  { name: "all done", done: () => true },
];

const TITLES = [
  "Closures",
  "Promises deep dive: states, chaining and error propagation through long chains",
  "SQL joins",
  "A very long title about designing a rate limiter for a distributed system with several regions and a shared budget",
];

function items(lanes: PlanLane[], done: (i: number, n: number) => boolean): TrailItemInput[] {
  return lanes.map((lane, i) => ({
    id: `item-${i}`,
    tone: lane,
    done: done(i, lanes.length),
    labelHeight: (w: number) => estimateLabelHeight({ title: TITLES[i % TITLES.length], meta: "Must know  45m" }, w),
  }));
}

const near = (a: number, b: number) => Math.abs(a - b) <= 0.01;

describe("computeTrail", () => {
  for (const width of WIDTHS) {
    for (const count of COUNTS) {
      for (const mix of MIXES) {
        for (const pattern of DONE) {
          const name = `${width}px × ${count} items × ${mix.name} × ${pattern.name}`;
          it(name, () => {
            const lanes = mix.lanes(count);
            expect(lanes).toHaveLength(count);
            const input = items(lanes, pattern.done);
            const g = computeTrail({ items: input, width });

            expect(g.mode).toBe(width >= DESKTOP_MIN_WIDTH ? "desktop" : "mobile");

            // One M, then only C/L.
            const cmds = parsePath(g.d);
            expect(cmds[0].op).toBe("M");
            expect(cmds.filter((c) => c.op === "M" || c.op === "m")).toHaveLength(1);
            for (const c of cmds.slice(1)) expect(["C", "L"]).toContain(c.op);
            expect(cmds.length - 1).toBe(count + 1);

            // Continuity: each segment starts where the previous one ended.
            let cursor = { x: cmds[0].values[0], y: cmds[0].values[1] };
            const ends = [cursor];
            for (const [k, c] of cmds.slice(1).entries()) {
              const seg = g.segments[k];
              expect(near(seg.from.x, cursor.x) && near(seg.from.y, cursor.y)).toBe(true);
              cursor = { x: c.values[c.values.length - 2], y: c.values[c.values.length - 1] };
              expect(near(seg.to.x, cursor.x) && near(seg.to.y, cursor.y)).toBe(true);
              ends.push(cursor);
              // Each segment's own sub-path starts with its `from`.
              const sub = parsePath(seg.d);
              expect(sub[0].values).toEqual([seg.from.x, seg.from.y]);
            }
            for (let k = 1; k < g.segments.length; k++) {
              expect(near(g.segments[k].from.x, g.segments[k - 1].to.x)).toBe(true);
              expect(near(g.segments[k].from.y, g.segments[k - 1].to.y)).toBe(true);
            }

            // Every waypoint is a point the path passes through.
            expect(g.waypoints).toHaveLength(count + 2);
            g.waypoints.forEach((wp, k) => {
              expect(near(wp.point.x, ends[k].x) && near(wp.point.y, ends[k].y)).toBe(true);
            });

            // Inside the container, and always going down the page.
            for (const c of cmds) {
              for (let v = 0; v < c.values.length; v += 2) {
                expect(c.values[v]).toBeGreaterThanOrEqual(0);
                expect(c.values[v]).toBeLessThanOrEqual(width);
              }
            }
            for (let k = 1; k < g.waypoints.length; k++) {
              expect(g.waypoints[k].point.y).toBeGreaterThan(g.waypoints[k - 1].point.y);
            }
            for (const s of g.segments) {
              expect(s.c1.y).toBeGreaterThanOrEqual(s.from.y);
              expect(s.c2.y).toBeLessThanOrEqual(s.to.y);
            }
            expect(g.height).toBeGreaterThan(g.waypoints[count + 1].point.y);

            // Labels on the same side never overlap.
            const bySide = new Map<string, { top: number; bottom: number }[]>();
            for (const wp of g.waypoints) {
              const list = bySide.get(wp.label.side) ?? [];
              list.push({ top: wp.point.y - wp.labelHeight / 2, bottom: wp.point.y + wp.labelHeight / 2 });
              bySide.set(wp.label.side, list);
            }
            for (const list of bySide.values()) {
              for (let k = 1; k < list.length; k++) expect(list[k].top).toBeGreaterThanOrEqual(list[k - 1].bottom - 0.01);
            }

            // Progress: the furthest done item's cumulative length (the whole trail once all are done).
            const doneIdx = input.map((it, i) => (it.done ? i : -1)).filter((i) => i >= 0);
            const furthest = doneIdx.length ? doneIdx[doneIdx.length - 1] : -1;
            expect(g.furthestDoneIndex).toBe(furthest);
            const allDone = count > 0 && doneIdx.length === count;
            expect(g.summitReached).toBe(allDone);
            const expected = allDone ? g.totalLength : furthest >= 0 ? g.waypoints[furthest + 1].length : 0;
            expect(near(g.progressLength, expected)).toBe(true);
            if (expected === 0) expect(g.progressD).toBe("");
            else {
              const prog = parsePath(g.progressD);
              expect(prog.filter((c) => c.op === "M")).toHaveLength(1);
              // A prefix of the trail.
              expect(g.d.startsWith(g.progressD)).toBe(true);
              const end = prog[prog.length - 1].values.slice(-2);
              const target = allDone ? g.waypoints[count + 1].point : g.waypoints[furthest + 1].point;
              expect(near(end[0], target.x) && near(end[1], target.y)).toBe(true);
            }

            // Cumulative lengths increase along the trail.
            for (let k = 1; k < g.waypoints.length; k++) expect(g.waypoints[k].length).toBeGreaterThan(g.waypoints[k - 1].length);
            expect(near(g.waypoints[count + 1].length, g.totalLength)).toBe(true);

            // Segment i leads into item i and carries its lane; the last one the summit.
            g.segments.forEach((s, i) => expect(s.tone).toBe(i < count ? lanes[i] : "summit"));
            g.waypoints.slice(1, -1).forEach((wp, i) => expect(wp.tone).toBe(lanes[i]));

            // You are here: first not-done item.
            expect(g.hereIndex).toBe(input.findIndex((it) => !it.done));
          });
        }
      }
    }
  }

  it("spaces waypoints further apart when labels are taller", () => {
    const short = computeTrail({ items: [0, 1, 2].map((i) => ({ id: `${i}`, tone: "low", done: false, labelHeight: 30 })), width: 390 });
    const tall = computeTrail({ items: [0, 1, 2].map((i) => ({ id: `${i}`, tone: "low", done: false, labelHeight: 200 })), width: 390 });
    expect(tall.height).toBeGreaterThan(short.height);
    expect(tall.waypoints[2].point.y - tall.waypoints[1].point.y).toBeGreaterThanOrEqual(200 + 14 - 0.01);
  });

  it("ignores the lane order of the DOM: positions depend only on item order", () => {
    const a = computeTrail({ items: [{ id: "a", tone: "low", done: false, labelHeight: 40 }], width: 1280 });
    const b = computeTrail({ items: [{ id: "a", tone: "do_now", done: false, labelHeight: 40 }], width: 1280 });
    expect(a.d).toBe(b.d);
  });

  it("pointAlong returns waypoints at whole positions and stays between them otherwise", () => {
    const g = computeTrail({ items: items(["do_now", "medium", "low"], () => false), width: 1280 });
    expect(pointAlong(g, 0)).toEqual(g.waypoints[0].point);
    expect(pointAlong(g, 2)).toEqual(g.waypoints[2].point);
    const mid = pointAlong(g, 1.5);
    expect(mid.y).toBeGreaterThan(g.waypoints[1].point.y);
    expect(mid.y).toBeLessThan(g.waypoints[2].point.y);
  });
});

describe("parsePath", () => {
  it("reads commands and numbers, including negatives and exponents", () => {
    expect(parsePath("M1,2 C3,4 5,-6 7.5,8e1 L1 2")).toEqual([
      { op: "M", values: [1, 2] },
      { op: "C", values: [3, 4, 5, -6, 7.5, 80] },
      { op: "L", values: [1, 2] },
    ]);
  });
});
