import type { CSSProperties } from "react";

import {
  LOGO_VIEWBOX,
  cx,
  logoClearSpace,
  logoFallsBackToMark,
  logoSrc,
  logoWidth,
  type BrandTheme,
  type LogoTheme,
  type LogoVariant,
} from "./brandAssets";
import { Mark } from "./Mark";

export interface LogoProps {
  /** `primary` (the ring is the O), `endorsed` ("by Oyelabs") or `tagline` ("Learning never closes"). */
  variant?: LogoVariant;
  /**
   * `auto` (default) follows the nearest theme: `light` on light surfaces, `dark` under `.dark`.
   * `on-blue` on Oyelabs Blue; `white`/`black` for one-colour use. Never place it on amber.
   */
  theme?: BrandTheme;
  /**
   * Rendered height of the lockup in pixels (the width follows its ratio). Below 96 px wide the
   * mark is shown instead (PDF p5). Omit to size it with `className` (e.g. `h-7`); then neither the
   * fallback nor the clear space can be computed, so the caller owns both.
   */
  size?: number;
  className?: string;
  /** Next to a visible "Oyelearn", or inside a link that names it: hide it from assistive tech. */
  decorative?: boolean;
  /** Keep the clear space (half the ring's height on every side). On by default; needs `size`. */
  clearSpace?: boolean;
}

/**
 * The Oyelearn logo: one of the kit's SVG files from `public/brand/logo/`, never re-typed or
 * recoloured. `auto` renders the light and the dark file and CSS shows the one for the theme
 * (`.brand-only-*` in src/index.css), so it is right on first paint with no script.
 */
export function Logo({ variant = "primary", theme = "auto", size, className, decorative = false, clearSpace = true }: LogoProps) {
  if (size !== undefined && logoFallsBackToMark(variant, size)) {
    return <Mark size={size} theme={theme} className={className} decorative={decorative} clearSpace={clearSpace} />;
  }

  const box = LOGO_VIEWBOX[variant];
  const width = size === undefined ? box.w : Math.round(logoWidth(variant, size));
  const height = size === undefined ? box.h : size;
  const pad = size !== undefined && clearSpace ? Math.round(logoClearSpace(variant, size)) : 0;
  const style: CSSProperties | undefined = pad ? { padding: pad } : undefined;

  const image = (file: LogoTheme, only?: "light" | "dark") => (
    <img
      key={file}
      src={logoSrc(variant, file)}
      alt={decorative ? "" : "Oyelearn"}
      width={width}
      height={height}
      draggable={false}
      className={cx("block max-w-none", size === undefined ? "h-full w-auto" : undefined, only && `brand-only-${only}`)}
      style={size === undefined ? undefined : { height: size, width: "auto" }}
    />
  );

  return (
    <span
      className={cx("inline-flex shrink-0", className)}
      style={style}
      aria-hidden={decorative || undefined}
      data-brand="logo"
      data-variant={variant}
    >
      {theme === "auto" ? [image("light", "light"), image("dark", "dark")] : image(theme)}
    </span>
  );
}
