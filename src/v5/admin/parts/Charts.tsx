import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { chartValue } from "./chartFormat";

/**
 * The admin charts. Recharts is only ever loaded through `lazy()` from this file, so it stays out
 * of every other route's download (docs/v5/PLAN.md rule 2). Colours are the v5 tokens, so light
 * and dark both work; every chart sits next to a table or a sentence with the same numbers.
 *
 * Brand kit p6, "Blue leads. Amber celebrates.": series are Oyelabs Blue, then Night Navy (a light
 * Sky tint in dark mode); amber is kept for a target line (`target`).
 */

const SERIES = ["rgb(var(--v5-brand))", "rgb(var(--v5-chart-2))"] as const;
const TARGET = "rgb(var(--v5-progress))";

/** Called as a function, not as <TargetLine>: Recharts only draws its own element types as direct children. */
function targetLine({ value, unit }: { value: number; unit: string }) {
  return <ReferenceLine y={value} stroke={TARGET} strokeWidth={2} strokeDasharray="6 4" ifOverflow="extendDomain" label={{ value: `Target ${chartValue(value, unit)}`, position: "insideTopRight", fill: "rgb(var(--v5-progress-fg))", fontSize: 12 }} />;
}

const AXIS = { stroke: "rgb(var(--v5-fg-2))", fontSize: 12 };
const GRID = "rgb(var(--v5-line-1))";
const TOOLTIP_STYLE = {
  background: "rgb(var(--v5-surface-3))",
  border: "1px solid rgb(var(--v5-line-1))",
  borderRadius: 8,
  color: "rgb(var(--v5-fg-1))",
  fontSize: 12,
};

export interface BarDatum {
  label: string;
  value: number;
}

export function SimpleBarChart({ data, unit = "", height = 220, title, target }: { data: BarDatum[]; unit?: string; height?: number; title: string; target?: number }) {
  return (
    <figure aria-label={title} className="m-0">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} tick={AXIS} allowDecimals={false} tickFormatter={(v) => chartValue(v, unit)} width={52} />
          <Tooltip cursor={{ fill: "rgb(var(--v5-sunken))" }} contentStyle={TOOLTIP_STYLE} formatter={(v) => [chartValue(v, unit), title]} />
          <Bar dataKey="value" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={36} />
          {target !== undefined ? targetLine({ value: target, unit }) : null}
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}

export function SimpleLineChart({ data, unit = "", height = 220, title, target }: { data: BarDatum[]; unit?: string; height?: number; title: string; target?: number }) {
  return (
    <figure aria-label={title} className="m-0">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS} tickFormatter={(v) => chartValue(v, unit)} width={52} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [chartValue(v, unit), title]} />
          <Line type="monotone" dataKey="value" stroke={SERIES[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
          {target !== undefined ? targetLine({ value: target, unit }) : null}
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
