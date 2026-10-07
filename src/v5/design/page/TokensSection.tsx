import { Check, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "../cn";

import { CONTRAST_MIN, TOKEN_PAIRS, contrastRatio, parseChannels, toHex, type ContrastNeed, type Rgb } from "../contrast";
import { LaneChip, LANES } from "../components/LaneChip";

/** Reads `--v5-*` (or any) custom properties from inside a themed pane. */
function useTokens(names: readonly string[]): [React.RefObject<HTMLDivElement | null>, Map<string, Rgb>] {
  const ref = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState(new Map<string, Rgb>());
  const key = names.join(",");
  useLayoutEffect(() => {
    const read = () => {
      if (!ref.current) return;
      const style = getComputedStyle(ref.current);
      const next = new Map<string, Rgb>();
      for (const n of key.split(",")) {
        const rgb = parseChannels(style.getPropertyValue(n.startsWith("--") ? n : `--v5-${n}`));
        if (rgb) next.set(n, rgb);
      }
      setValues(next);
    };
    read();
    // Re-read if the scope or theme on <html> changes after mount.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-ui", "class"] });
    return () => observer.disconnect();
  }, [key]);
  return [ref, values];
}

function Ratio({ ratio, need }: { ratio: number | null; need: ContrastNeed }) {
  if (ratio === null) return null;
  if (need === "none") return <span className="font-mono text-caption text-fg-2">{ratio.toFixed(2)}:1 · decorative</span>;
  const ok = ratio >= CONTRAST_MIN[need];
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-caption", ok ? "text-success-fg" : "text-danger-fg")}>
      {ok ? <Check className="size-3" aria-hidden="true" /> : <X className="size-3" aria-hidden="true" />}
      {ratio.toFixed(2)}:1
      <span className="text-fg-2">{need === "text" ? "text ≥ 4.5" : "UI ≥ 3"}</span>
      <span className="sr-only">{ok ? "passes" : "fails"}</span>
    </span>
  );
}

interface SwatchSpec {
  token: string;
  /** What this colour is checked against. */
  on?: string;
  need: ContrastNeed;
  use: string;
}

const GROUPS: { title: string; swatches: SwatchSpec[] }[] = [
  {
    title: "Surfaces (elevation 0–3)",
    swatches: [
      { token: "surface-0", on: "fg-1", need: "text", use: "The page" },
      { token: "surface-1", on: "fg-1", need: "text", use: "Cards, the top bar, the sidebar" },
      { token: "surface-2", on: "fg-1", need: "text", use: "Menus, popovers, a card above a card" },
      { token: "surface-3", on: "fg-1", need: "text", use: "Dialogs, sheets, toasts" },
      { token: "sunken", on: "fg-1", need: "text", use: "Wells, progress tracks, hover rows" },
    ],
  },
  {
    title: "Text and lines",
    swatches: [
      { token: "fg-1", on: "surface-1", need: "text", use: "Headings and body text" },
      { token: "fg-2", on: "surface-1", need: "text", use: "Secondary text, labels, meta" },
      { token: "fg-3", on: "surface-1", need: "text", use: "Placeholders; never the only copy of something" },
      { token: "line-1", on: "surface-1", need: "none", use: "Hairlines between regions (decoration)" },
      { token: "line-2", on: "surface-1", need: "ui", use: "Input borders, empty waypoints" },
      { token: "focus", on: "surface-0", need: "ui", use: "The focus ring (2 px, offset 2 px)" },
    ],
  },
  ...(["brand", "progress", "success", "warning", "danger", "info", "neutral"] as const).map((k) => ({
    title: {
      brand: "Brand (Oyelabs blue)",
      progress: "Progress (amber: progress and achievement only)",
      success: "Success",
      warning: "Warning",
      danger: "Danger",
      info: "Info",
      neutral: "Neutral",
    }[k],
    swatches: [
      { token: k, on: "surface-1", need: "ui" as const, use: "Fill: buttons, progress, dots" },
      { token: `on-${k}`, on: k, need: "text" as const, use: "Text on the fill" },
      { token: `${k}-fg`, on: "surface-1", need: "text" as const, use: "As text: links, status words" },
      { token: `${k}-soft`, on: "fg-1", need: "text" as const, use: "Tint behind badges and callouts" },
    ],
  })),
];

const ALL_TOKENS = [...new Set(GROUPS.flatMap((g) => g.swatches.flatMap((s) => [s.token, s.on ?? s.token])).concat(TOKEN_PAIRS.flatMap((p) => [p.fg, p.on])))];

function ThemePane({ theme }: { theme: "light" | "dark" }) {
  const [ref, values] = useTokens(ALL_TOKENS);
  const pairResults = TOKEN_PAIRS.map((p) => {
    const a = values.get(p.fg);
    const b = values.get(p.on);
    return { ...p, ratio: a && b ? contrastRatio(a, b) : null };
  });
  const failing = pairResults.filter((r) => r.ratio !== null && r.ratio < CONTRAST_MIN[r.need]);
  return (
    <div ref={ref} className={cn(theme === "light" ? "v5-light" : "dark", "min-w-0 rounded-card border border-line-1 bg-surface-0 p-4 text-fg-1")}>
      <h3 className="font-display text-h3 font-semibold">{theme === "light" ? "Light" : "Dark"}</h3>
      {GROUPS.map((group) => (
        <div key={group.title} className="mt-6">
          <h4 className="text-small font-semibold text-fg-1">{group.title}</h4>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {group.swatches.map((s) => {
              const rgb = values.get(s.token);
              const other = s.on ? values.get(s.on) : undefined;
              const ratio = rgb && other ? contrastRatio(rgb, other) : null;
              return (
                <li key={s.token} className="flex items-center gap-3 rounded-control border border-line-1 bg-surface-1 p-2">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-md border border-line-1 text-small font-semibold"
                    style={{ background: rgb ? `rgb(${rgb.join(" ")})` : undefined, color: s.need === "text" && s.on && values.get(s.on) && s.token.startsWith("surface") ? `rgb(${values.get(s.on)!.join(" ")})` : undefined }}
                    aria-hidden="true"
                  >
                    {s.token.startsWith("surface") || s.token === "sunken" ? "Aa" : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-caption font-medium text-fg-1">--v5-{s.token}</span>
                    <span className="block text-caption text-fg-2">
                      {rgb ? toHex(rgb) : "…"} · {s.use}
                    </span>
                    <Ratio ratio={ratio} need={s.need} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="mt-6">
        <h4 className="text-small font-semibold text-fg-1">Lanes</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANES.map((lane) => (
            <LaneChip key={lane} lane={lane} />
          ))}
        </div>
      </div>
      <details className="mt-6 rounded-control border border-line-1 bg-surface-1 p-3">
        <summary className="cursor-pointer text-small font-medium text-fg-1">
          Every checked pair ({pairResults.length}, {failing.length === 0 ? "all pass" : `${failing.length} failing`})
        </summary>
        <table className="mt-3 w-full text-left text-caption">
          <caption className="sr-only">Contrast of every token pair in the {theme} theme</caption>
          <thead>
            <tr className="text-fg-2">
              <th scope="col" className="py-1 font-medium">Foreground</th>
              <th scope="col" className="py-1 font-medium">On</th>
              <th scope="col" className="py-1 font-medium">Ratio</th>
            </tr>
          </thead>
          <tbody>
            {pairResults.map((r) => (
              <tr key={`${r.fg}-${r.on}`} className="border-t border-line-1">
                <td className="py-1 font-mono">{r.fg}</td>
                <td className="py-1 font-mono">{r.on}</td>
                <td className="py-1">
                  <Ratio ratio={r.ratio} need={r.need} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

const BRAND_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** The kit's eight named colours (PDF p6), read from the global tokens so the page shows what ships. */
const KIT_COLOURS = [
  { name: "Oyelabs Blue", token: "--brand-600", use: "Primary, about 60%" },
  { name: "Night Navy", token: "--brand-950", use: "Text and dark surfaces, about 25%" },
  { name: "Amber", token: "--accent-500", use: "Progress and wins only, about 10%" },
  { name: "Sky", token: "--brand-400", use: "Blue on dark" },
  { name: "Night", token: "--bg-dark", use: "Dark backgrounds" },
  { name: "Mist", token: "--mist", use: "Tints and surfaces" },
  { name: "Cloud", token: "--cloud", use: "The page background" },
  { name: "Slate", token: "--muted", use: "Secondary text" },
] as const;

function KitColours() {
  const [ref, values] = useTokens(KIT_COLOURS.map((c) => c.token));
  return (
    <div ref={ref}>
      <h3 className="font-display text-h3 font-semibold text-fg-1">Brand colours</h3>
      <p className="mt-1 max-w-article text-small text-fg-2">Blue leads, amber celebrates. Amber is never a general button, link or large background; amber text on white is #B45309.</p>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {KIT_COLOURS.map((c) => {
          const rgb = values.get(c.token);
          return (
            <li key={c.name} className="overflow-hidden rounded-control border border-line-1 bg-surface-1">
              <span className="block h-16" style={{ background: rgb ? `rgb(${rgb.join(" ")})` : undefined }} aria-hidden="true" />
              <span className="block p-2 text-caption text-fg-2">
                <span className="block text-small font-semibold text-fg-1">{c.name}</span>
                <span className="font-mono">{rgb ? toHex(rgb) : "…"}</span> · {c.use}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Scale({ prefix, title, intro }: { prefix: "brand" | "accent"; title: string; intro: React.ReactNode }) {
  const [ref, values] = useTokens(BRAND_STEPS.map((s) => `--${prefix}-${s}`));
  const white: Rgb = [255, 255, 255];
  const ink: Rgb = [11, 35, 71];
  return (
    <div ref={ref}>
      <h3 className="font-display text-h3 font-semibold text-fg-1">{title}</h3>
      <p className="mt-1 max-w-article text-small text-fg-2">{intro}</p>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-11">
        {BRAND_STEPS.map((step) => {
          const rgb = values.get(`--${prefix}-${step}`);
          const onWhite = rgb ? contrastRatio(rgb, white) : 0;
          const onInk = rgb ? contrastRatio(rgb, ink) : 0;
          return (
            <li key={step} className="overflow-hidden rounded-control border border-line-1 bg-surface-1">
              <span className="block h-14" style={{ background: rgb ? `rgb(${rgb.join(" ")})` : undefined }} aria-hidden="true" />
              <span className="block p-2 font-mono text-[0.6875rem] text-fg-2">
                <span className="block text-caption font-semibold text-fg-1">
                  {prefix}-{step}
                </span>
                {rgb ? toHex(rgb) : "…"}
                <br />
                white {onWhite.toFixed(1)} · ink {onInk.toFixed(1)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function TokensSection() {
  return (
    <div className="flex flex-col gap-10">
      <KitColours />
      <Scale
        prefix="brand"
        title="Brand scale"
        intro={
          <>
            Oyelabs blue, hue 216. <span className="font-mono">brand-600</span> is #2067D3, the fill in light mode; <span className="font-mono">brand-400</span> (Sky) is the
            fill in dark mode; <span className="font-mono">brand-950</span> is Night Navy. Shared with the previous design, so the brand never shifts between them.
          </>
        }
      />
      <Scale
        prefix="accent"
        title="Amber scale"
        intro={
          <>
            <span className="font-mono">accent-500</span> is #F59E0B, the ring and dot of the mark; <span className="font-mono">accent-700</span> (#B45309) is amber text on white.
            In v5 use the <span className="font-mono">progress</span> tokens, which clear 3:1 as a mark in both themes.
          </>
        }
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <ThemePane theme="light" />
        <ThemePane theme="dark" />
      </div>
    </div>
  );
}
