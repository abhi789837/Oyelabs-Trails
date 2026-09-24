import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";

type Variant = "horizontal" | "mark" | "stacked";

/**
 * The Oyelearn logo, from `public/brand/`.
 *
 * Two files per variant, one per theme. The theme is read from the store rather than expressed as
 * `dark:` classes on two stacked images: callers also pass responsive visibility (`hidden sm:block`
 * for the phone/desktop lockup swap), and Tailwind merges both sets onto one element, where
 * `sm:block` overrides the base `hidden` in *either* theme — which rendered both lockups at once.
 * One image, one source, and a caller's `className` now means exactly what it says.
 *
 * The SVGs already contain the wordmark, so nothing should set text beside `horizontal` or
 * `stacked`. They are never recoloured — `onPrimary` selects the supplied mono-white file rather
 * than filtering the coloured one.
 */
const FILES: Record<Variant, { light: string; dark: string }> = {
  horizontal: {
    light: "/brand/oyelearn-horizontal-light-mode.svg",
    dark: "/brand/oyelearn-horizontal-dark-mode.svg",
  },
  mark: {
    light: "/brand/oyelearn-mark-light-mode.svg",
    dark: "/brand/oyelearn-mark-dark-mode.svg",
  },
  stacked: {
    light: "/brand/oyelearn-stacked-light-mode.svg",
    dark: "/brand/oyelearn-stacked-dark-mode.svg",
  },
};

/**
 * Intrinsic ratios, so the browser reserves the right box before the SVG arrives. These are the
 * files' own viewBox dimensions -- check them against `public/brand/*.svg` if the kit is replaced,
 * because a wrong ratio here shows up as a layout shift on first paint, not as a visible error.
 */
const RATIO: Record<Variant, { w: number; h: number }> = {
  horizontal: { w: 786, h: 200 },
  mark: { w: 512, h: 512 },
  stacked: { w: 433, h: 329 },
};

export interface LogoProps {
  variant?: Variant;
  /** Rendered height in pixels. 32 suits a navbar; the width follows the ratio. */
  height?: number;
  /** True on a surface filled with the primary colour, where the mono-white mark is used. */
  onPrimary?: boolean;
  /**
   * True on a surface that is "printed" light whatever the theme -- the certificate. Pins the
   * light-mode file instead of letting the theme choose, since the surface never goes dark.
   */
  onPaper?: boolean;
  className?: string;
  /**
   * Set when the logo sits next to a visible "Oyelearn", or inside a link that already names the
   * destination — then the image is decorative and should not be announced twice.
   */
  decorative?: boolean;
}

export function Logo({
  variant = "horizontal",
  height = 32,
  onPrimary = false,
  onPaper = false,
  className,
  decorative = false,
}: LogoProps) {
  // `onPaper` surfaces are printed light whatever the app's theme, so they ignore it.
  const theme = useUiStore((s) => s.theme);
  const dark = theme === "dark" && !onPaper;
  // The mono-white file is only supplied as a mark, so `onPrimary` always measures as one.
  const ratio = onPrimary ? RATIO.mark : RATIO[variant];
  const width = Math.round((ratio.w / ratio.h) * height);
  const alt = decorative ? "" : "Oyelearn";
  const shared = cn("block h-(--logo-h) w-auto", className);
  const style = { "--logo-h": `${height}px` } as React.CSSProperties;

  const src = onPrimary ? "/brand/oyelearn-mark-mono-white.svg" : dark ? FILES[variant].dark : FILES[variant].light;

  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={decorative || undefined}
      width={width}
      height={height}
      style={style}
      className={shared}
    />
  );
}
