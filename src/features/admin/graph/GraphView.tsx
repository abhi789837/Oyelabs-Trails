import { useMemo, type KeyboardEvent } from "react";

import type { SkillEdge } from "@shared/skillGraph";

import { cn } from "@/lib/utils";
import { NODE_H, NODE_W, layoutGraph, neighbourhood } from "./layout";

/** Above this, the drawing stops being readable; the view asks for a smaller depth instead. */
const MAX_NODES = 70;

const truncate = (text: string, max = 24) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export interface GraphViewProps {
  edges: readonly SkillEdge[];
  focus: string;
  depth: number;
  nameOf: (id: string) => string;
  onFocus: (id: string) => void;
}

/**
 * Read-only, layered drawing of one skill's neighbourhood. Earlier skills on the left. Solid lines
 * are prerequisites and dashed lines are recommended. Every node is a button that refocuses the view.
 */
export function GraphView({ edges, focus, depth, nameOf, onFocus }: GraphViewProps) {
  const ids = useMemo(() => neighbourhood(edges, focus, depth), [edges, focus, depth]);
  const layout = useMemo(() => (ids.length <= MAX_NODES ? layoutGraph(ids, edges) : null), [ids, edges]);

  if (!layout) {
    return (
      <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        {ids.length} skills around {nameOf(focus)} is too many to draw. Pick a smaller depth.
      </p>
    );
  }
  if (ids.length === 1) {
    return (
      <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        {nameOf(focus)} has no links yet.
      </p>
    );
  }

  const activate = (event: KeyboardEvent, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onFocus(id);
    }
  };

  return (
    <div className="overflow-auto rounded-md border bg-surface">
      <svg
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="group"
        aria-label={`Skills around ${nameOf(focus)}, earliest on the left`}
        className="block"
      >
        <defs>
          <marker id="skill-graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted-foreground" />
          </marker>
        </defs>
        <g aria-hidden="true">
          {layout.edges.map((e) => (
            <path
              key={`${e.from}->${e.to}`}
              d={e.path}
              fill="none"
              strokeWidth={e.from === focus || e.to === focus ? 1.75 : 1.25}
              strokeDasharray={e.type === "recommended" ? "5 4" : undefined}
              markerEnd="url(#skill-graph-arrow)"
              className={cn(e.from === focus || e.to === focus ? "stroke-trailmark" : "stroke-muted-foreground/60")}
            />
          ))}
        </g>
        {layout.nodes.map((n) => {
          const isFocus = n.id === focus;
          const name = nameOf(n.id);
          return (
            <g
              key={n.id}
              transform={`translate(${n.x} ${n.y})`}
              role="button"
              tabIndex={0}
              aria-label={isFocus ? `${name} (shown)` : `Show the skills around ${name}`}
              aria-pressed={isFocus}
              onClick={() => onFocus(n.id)}
              onKeyDown={(event) => activate(event, n.id)}
              className="group cursor-pointer outline-none"
            >
              <title>{name}</title>
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={8}
                strokeWidth={isFocus ? 2 : 1}
                className={cn(
                  "transition-colors group-focus-visible:stroke-primary-strong group-focus-visible:[stroke-width:3]",
                  isFocus ? "fill-trailmark/15 stroke-trailmark" : "fill-background stroke-border group-hover:fill-surface-sunken",
                )}
              />
              <text x={12} y={NODE_H / 2} dominantBaseline="central" className={cn("fill-foreground text-[12px]", isFocus && "font-semibold")}>
                {truncate(name)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
