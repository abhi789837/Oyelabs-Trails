import { BrandLoader, Logo, Mark, ProgressRing } from "@/components/brand";
import type { LogoTheme, LogoVariant } from "@/components/brand";

import { Demo, Preview } from "./scaffold";

/**
 * /design → Brand: every logo lockup on the backgrounds the kit allows (Oyelearn-Brand-Guidelines.pdf
 * p4, p8), the mark's sizes, the clear space, the brand components and the don'ts (p9).
 * Backgrounds are the kit's own colours, set with the global tokens so they stay in step with it.
 */

const SURFACES: { theme: LogoTheme; label: string; bg: string; note: string; dark?: boolean }[] = [
  { theme: "light", label: "light", bg: "bg-white", note: "On white and Cloud." },
  { theme: "dark", label: "dark", bg: "bg-night", note: "On Night #0A1428 or Night Navy.", dark: true },
  { theme: "on-blue", label: "on-blue", bg: "bg-oyelabs-blue", note: "On Oyelabs Blue.", dark: true },
  { theme: "black", label: "black (one colour)", bg: "bg-cloud", note: "One-colour, on light." },
  { theme: "white", label: "white (one colour)", bg: "bg-night-navy", note: "One-colour, on Night Navy.", dark: true },
];

const VARIANTS: { variant: LogoVariant; name: string; use: string }[] = [
  { variant: "primary", name: "Primary", use: "The default: the ring is the O, followed by “yelearn”." },
  { variant: "endorsed", name: "Endorsed (by Oyelabs)", use: "Where Oyelearn meets people outside the team: the sign-in page on a phone, emails." },
  { variant: "tagline", name: "With tagline", use: "Brand moments with room: covers, title slides." },
];

const DONTS = [
  "Stretch or squash it: width and height always keep the file's ratio.",
  "Rotate it.",
  "Change its colours, or recolour a file with a filter. Use the colourway made for the background.",
  "Add shadows, outlines, glows or other effects.",
  "Add an extra “O” after the mark, or type the wordmark yourself: the mark is the O.",
  "Place it on a low-contrast colour, or on amber.",
  "Crowd it: keep clear space of half the ring's height on every side.",
  "Use the full logo below 96 px wide (use the mark), or the mark below 16 px.",
];

function LogoGrid({ variant }: { variant: LogoVariant }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {SURFACES.map((s) => (
        <li key={s.theme} className="overflow-hidden rounded-card border border-line-1">
          <div className={`grid min-h-36 place-items-center ${s.bg}`}>
            <Logo variant={variant} theme={s.theme} size={44} />
          </div>
          <p className="border-t border-line-1 bg-surface-1 px-3 py-2 text-caption text-fg-2">
            <span className="font-mono text-fg-1">theme=&quot;{s.label.split(" ")[0]}&quot;</span> · {s.note}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function BrandSection() {
  return (
    <div>
      {VARIANTS.map((v) => (
        <Demo key={v.variant} name={`Logo: ${v.name}`} use={<>{v.use} <code className="font-mono">{`<Logo variant="${v.variant}" theme=… size={…} />`}</code></>}>
          <LogoGrid variant={v.variant} />
        </Demo>
      ))}

      <Demo
        name="Theme auto"
        use="The default. Follows the nearest theme with CSS (no script), so it is right on first paint: light in the light pane, dark in the dark pane."
      >
        <Preview>
          <div className="flex flex-wrap items-center gap-6">
            <Logo size={36} />
            <Logo variant="endorsed" size={40} />
          </div>
        </Preview>
      </Demo>

      <Demo name="Clear space and minimum size" use="Clear space on every side is half the ring's height (the dashed box). Below 96 px wide the logo becomes the mark; the mark never goes below 16 px.">
        <Preview single>
          <div className="flex flex-wrap items-end gap-8">
            <span className="inline-flex outline-1 outline-dashed outline-line-2">
              <Logo size={56} theme="light" />
            </span>
            <span className="flex flex-col items-center gap-2 text-caption text-fg-2">
              <Logo size={23} theme="light" />
              size 23: 98 px wide
            </span>
            <span className="flex flex-col items-center gap-2 text-caption text-fg-2">
              <Logo size={20} theme="light" />
              size 20: falls back to the mark
            </span>
          </div>
        </Preview>
      </Demo>

      <Demo name="Mark" use={<>App icon, favicon, avatar and tight spaces. The outer ring takes <code className="font-mono">currentColor</code> (Oyelabs Blue, Sky in dark).</>}>
        <Preview>
          <div className="flex flex-wrap items-end gap-6">
            {[16, 24, 32, 48, 72].map((n) => (
              <span key={n} className="flex flex-col items-center gap-2 text-caption text-fg-2">
                <Mark size={n} />
                {n}px
              </span>
            ))}
          </div>
        </Preview>
      </Demo>

      <Demo name="BrandLoader" use="Full-page loading and auth redirects only; content keeps its skeletons. The amber ring draws and spins but never closes; with reduced motion it holds still.">
        <Preview>
          <div className="flex flex-wrap items-center gap-8">
            <BrandLoader size={32} />
            <BrandLoader size={56} label="Signing you in" showLabel />
          </div>
        </Preview>
      </Demo>

      <Demo name="ProgressRing" use="Progress in the brand's shape: the amber arc fills to the value with the dot at its tip. It never closes: 100% stops at 92% and shows a check.">
        <Preview>
          <div className="flex flex-wrap items-center gap-6">
            {[0, 20, 50, 75, 100].map((v) => (
              <span key={v} className="flex flex-col items-center gap-2 text-caption text-fg-2">
                <ProgressRing value={v} size={56} label={`Example progress ${v}%`} />
                {v}%
              </span>
            ))}
          </div>
        </Preview>
      </Demo>

      <Demo name="Please don't" use="From the brand guidelines (p9). The PDF is the rulebook: Oyelearn-Brand-Kit/Oyelearn-Brand-Guidelines.pdf.">
        <ul className="grid max-w-article gap-2 text-small text-fg-1">
          {DONTS.map((d) => (
            <li key={d} className="flex gap-2 rounded-control border border-line-1 bg-surface-1 p-3">
              <span aria-hidden="true" className="font-semibold text-danger-fg">
                ×
              </span>
              <span>
                <span className="sr-only">Don&apos;t: </span>
                {d}
              </span>
            </li>
          ))}
        </ul>
      </Demo>
    </div>
  );
}
