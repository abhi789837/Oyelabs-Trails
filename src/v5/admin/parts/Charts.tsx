import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { chartValue } from "./chartFormat";

/**
 * The admin charts. Recharts is only ever loaded through `lazy()` from this file, so it stays out
 * of every other route's download (docs/v5/PLAN.md rule 2). Colours are the v5 tokens, so light
 * and dark both work; every chart sits next to a table or a sentence with the same numbers.
 */

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

export function SimpleBarChart({ data, unit = "", height = 220, title }: { data: BarDatum[]; unit?: string; height?: number; title: string }) {
  return (
    <figure aria-label={title} className="m-0">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} interval="preserveStartEnd" />
          <YAxis tickLine={false} axisLine={false} tick={AXIS} allowDecimals={false} tickFormatter={(v) => chartValue(v, unit)} width={52} />
          <Tooltip cursor={{ fill: "rgb(var(--v5-sunken))" }} contentStyle={TOOLTIP_STYLE} formatter={(v) => [chartValue(v, unit), title]} />
          <Bar dataKey="value" fill="rgb(var(--v5-brand))" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}

export function SimpleLineChart({ data, unit = "", height = 220, title }: { data: BarDatum[]; unit?: string; height?: number; title: string }) {
  return (
    <figure aria-label={title} className="m-0">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS} tickFormatter={(v) => chartValue(v, unit)} width={52} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [chartValue(v, unit), title]} />
          <Line type="monotone" dataKey="value" stroke="rgb(var(--v5-brand))" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
