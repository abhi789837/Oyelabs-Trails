import { cn } from "@/lib/utils";

type Variant = "horizontal" | "mark" | "stacked";

/**
 * The Oyelearn logo, from `public/brand/`.
 *
 * Two files per variant, one per theme, toggled by the `.dark` class rather than by
 * `prefers-color-scheme`: the app has its own theme switch, so a media query would show the wrong
 * lockup whenever a viewer has overridden the system setting. Both files are in the markup and CSS
 * picks one, which costs a second (small) request but means the swap happens with the theme
 * instead of a paint later.
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
  // The mono-white file is only supplied as a mark, so `onPrimary` always measures as one.
  const ratio = onPrimary ? RATIO.mark : RATIO[variant];
  const width = Math.round((ratio.w / ratio.h) * height);
  const alt = decorative ? "" : "Oyelearn";
  const shared = cn("block h-[var(--logo-h)] w-auto", className);
  const style = { "--logo-h": `${height}px` } as React.CSSProperties;

  if (onPrimary) {
    return (
      <img
        src="/brand/oyelearn-mark-mono-white.svg"
        alt={alt}
        aria-hidden={decorative || undefined}
        width={width}
        height={height}
        style={style}
        className={shared}
      />
    );
  }

  const file = FILES[variant];

  if (onPaper) {
    return (
      <img
        src={file.light}
        alt={alt}
        aria-hidden={decorative || undefined}
        width={width}
        height={height}
        style={style}
        className={shared}
      />
    );
  }

  return (
    <>
      <img
        src={file.light}
        alt={alt}
        aria-hidden={decorative || undefined}
        width={width}
        height={height}
        style={style}
        className={cn(shared, "dark:hidden")}
      />
      <img
        src={file.dark}
        alt={alt}
        aria-hidden={decorative || undefined}
        width={width}
        height={height}
        style={style}
        className={cn(shared, "hidden dark:block")}
      />
    </>
  );
}
