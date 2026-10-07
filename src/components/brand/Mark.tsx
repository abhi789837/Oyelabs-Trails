import type { CSSProperties } from "react";

import {
  MARK_COLOURS,
  MARK_DOT,
  MARK_INNER,
  MARK_INNER_WIDTH,
  MARK_MIN_SIZE,
  MARK_OUTER,
  MARK_OUTER_WIDTH,
  MARK_VIEWBOX,
  cx,
  markClearSpace,
  type BrandTheme,
} from "./brandAssets";

export interface MarkProps {
  /** Pixel size (square). Never below 16 px (PDF p5). Omit to size it with `className` (e.g. `h-7`). */
  size?: number;
  /**
   * `auto` (default): the outer ring is `currentColor` (`text-primary`: Oyelabs Blue in light, Sky in
   * dark, in both designs), so a caller may also set the colour with a text class, as the kit's
   * OyelearnMark does.
   */
  theme?: BrandTheme;
  className?: string;
  /** Next to a visible "Oyelearn", or inside a link that names it: hide it from assistive tech. */
  decorative?: boolean;
  /** Keep the brand's clear space (half the ring) around it. Off by default for an inline icon. */
  clearSpace?: boolean;
}

/**
 * The Oyelearn mark, inline (the kit's path data, no request): the outer ring is Oyelabs, the amber
 * ring is progress, the dot is "you are here".
 */
export function Mark({ size, theme = "auto", className, decorative = false, clearSpace = false }: MarkProps) {
  const px = size === undefined ? undefined : Math.max(MARK_MIN_SIZE, size);
  const colours = theme === "auto" ? { outer: "currentColor", inner: MARK_COLOURS.light.inner } : MARK_COLOURS[theme];
  const style: CSSProperties | undefined = clearSpace && px ? { margin: markClearSpace(px) } : undefined;
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      width={px}
      height={px}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Oyelearn"}
      aria-hidden={decorative || undefined}
      focusable="false"
      data-brand="mark"
      style={style}
      className={cx("shrink-0", theme === "auto" && "text-primary", px === undefined && "aspect-square h-full w-auto", className)}
    >
      {MARK_OUTER.map((d) => (
        <path key={d} d={d} fill="none" stroke={colours.outer} strokeWidth={MARK_OUTER_WIDTH} />
      ))}
      <path d={MARK_INNER} fill="none" stroke={colours.inner} strokeWidth={MARK_INNER_WIDTH} strokeLinecap="round" />
      <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill={colours.inner} />
    </svg>
  );
}
