import { Moon, Sun } from "lucide-react";
import { lazy, Suspense, useState } from "react";

import { useUiStore } from "@/store/uiStore";

import { Button } from "./components/Button";
import { V5Toaster } from "./components/Overlays";
import { TooltipProvider } from "./components/Tooltip";
import { Logo } from "./components/Showcase";
import { SkeletonLayout } from "./components/States";
import type { Density } from "./density";
import { V5MotionProvider } from "./V5MotionProvider";
import { DensityContext, DesignSection } from "./page/scaffold";
import { useV5Root } from "./useV5Root";
import "./styles";

/**
 * `/design`: the living style guide (staff only; the route guard is in V5App).
 *
 * Every section is its own lazy chunk and mounts as it nears the viewport, so opening the page
 * costs one small chunk. `?all=1` mounts everything at once (the e2e check and screenshots use it).
 */

const BrandSection = lazy(() => import("./page/BrandSection"));
const TokensSection = lazy(() => import("./page/TokensSection"));
const FoundationsSection = lazy(() => import("./page/FoundationsSection"));
const ComponentsCore = lazy(() => import("./page/ComponentsCore"));
const ComponentsProgress = lazy(() => import("./page/ComponentsProgress"));
const ComponentsFeedback = lazy(() => import("./page/ComponentsFeedback"));
const ComponentsLesson = lazy(() => import("./page/ComponentsLesson"));
const ComponentsShell = lazy(() => import("./page/ComponentsShell"));

const SECTIONS = [
  { id: "brand", title: "Brand", intro: "The Oyelearn brand kit v1.0: every logo on the backgrounds it's made for, the mark, the brand components, and what never to do. Learning never closes.", C: BrandSection },
  { id: "colour", title: "Colour", intro: "Every colour token in light and dark, with its measured contrast. Text needs 4.5:1; focus rings, input borders and meaningful fills need 3:1.", C: TokensSection },
  { id: "foundations", title: "Type, space and motion", intro: undefined, C: FoundationsSection },
  { id: "basics", title: "Basics", intro: "Buttons, fields, tabs and the small pieces everything else is built from.", C: ComponentsCore },
  { id: "progress", title: "Progress and the trail", intro: "How we show where someone is: rings, bars, skill levels, the weekly streak and the trail.", C: ComponentsProgress },
  { id: "feedback", title: "Status, states and overlays", intro: "Loading, empty, failed, and everything that floats above the page.", C: ComponentsFeedback },
  { id: "lesson", title: "Lesson parts", intro: "The pieces of the lesson screen: Watch, Read, Do, Check, hints, the tutor, review cards and certificates.", C: ComponentsLesson },
  { id: "shell", title: "Shell and tables", intro: "The frame around every screen, and the admin table.", C: ComponentsShell },
] as const;

export default function DesignPage() {
  useV5Root();
  const [density, setDensity] = useState<Density>("comfortable");
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const eager = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("all") === "1";

  return (
    <V5MotionProvider>
      <TooltipProvider delayDuration={300}>
        <DensityContext.Provider value={density}>
          <div className="min-h-dvh bg-surface-0 text-fg-1">
            <a href="#design-main" className="sr-only z-50 rounded-control bg-brand px-3 py-2 text-on-brand focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
              Skip to content
            </a>
            <header className="sticky top-0 z-40 border-b border-line-1 bg-surface-1/90 backdrop-blur">
              <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-3 px-4">
                <Logo className="h-7" />
                <span className="hidden font-display text-small font-semibold text-fg-2 sm:inline">Design system</span>
                <div className="flex-1" />
                <fieldset className="flex items-center gap-1 rounded-control bg-sunken p-1">
                  <legend className="sr-only">Density of the previews</legend>
                  {(["comfortable", "compact"] as const).map((d) => (
                    <label key={d} className="cursor-pointer rounded-[calc(var(--v5-radius-control)-2px)] px-2.5 py-1 text-caption font-medium text-fg-2 has-[:checked]:bg-surface-1 has-[:checked]:text-fg-1 has-[:checked]:shadow-e1 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus">
                      <input type="radio" name="design-density" value={d} checked={density === d} onChange={() => setDensity(d)} className="sr-only" />
                      {d === "comfortable" ? "Comfortable" : "Compact"}
                    </label>
                  ))}
                </fieldset>
                <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label={theme === "dark" ? "Use light mode for the page" : "Use dark mode for the page"}>
                  {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
                </Button>
              </div>
            </header>

            <div className="mx-auto flex max-w-[90rem] gap-10 px-4">
              <nav aria-label="On this page" className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-52 shrink-0 overflow-y-auto py-10 lg:block">
                <ul className="flex flex-col gap-0.5 text-small">
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="block rounded-control px-3 py-1.5 text-fg-2 hover:bg-sunken hover:text-fg-1">
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <main id="design-main" tabIndex={-1} className="min-w-0 flex-1 py-10 outline-none">
                <h1 className="font-display text-display font-semibold text-fg-1">Oyelearn design system</h1>
                <p className="mt-3 max-w-article text-lead text-fg-2">
                  The tokens and components behind the new design. Each preview shows light and dark side by side. Switch density at the top to see compact
                  admin sizes. Import from <code className="font-mono text-small">@/v5/design</code>.
                </p>
                {SECTIONS.map(({ id, title, intro, C }) => (
                  <DesignSection key={id} id={id} title={title} intro={intro} eager={eager}>
                    <Suspense fallback={<SkeletonLayout variant="card" label={`Loading ${title}`} />}>
                      <C />
                    </Suspense>
                  </DesignSection>
                ))}
              </main>
            </div>
            <V5Toaster />
          </div>
        </DensityContext.Provider>
      </TooltipProvider>
    </V5MotionProvider>
  );
}
