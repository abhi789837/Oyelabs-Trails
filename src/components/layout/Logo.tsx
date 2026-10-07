import { Logo as BrandLogo } from "@/components/brand/Logo";
import { Mark } from "@/components/brand/Mark";

type Variant = "horizontal" | "mark" | "stacked";

/**
 * The previous design's logo API, kept so its callers don't change: it now renders the brand kit
 * v1.0 (src/components/brand). `horizontal` is the primary lockup (the ring is the O), `stacked`
 * the endorsed "by Oyelabs" lockup, `mark` the mark. The theme follows `.dark` (CSS, no script).
 */
export interface LogoProps {
  variant?: Variant;
  /** Rendered height in pixels; the width follows the ratio. */
  height?: number;
  /** True on a surface filled with Oyelabs Blue: the `on-blue` files. */
  onPrimary?: boolean;
  /** True on a surface that is "printed" light whatever the theme (the certificate). */
  onPaper?: boolean;
  className?: string;
  /** Next to a visible "Oyelearn", or inside a link that names it. */
  decorative?: boolean;
}

/** The primary lockup is 96 px wide at 22.6 px tall; smaller heights would turn it into the mark. */
const MIN_LOCKUP_HEIGHT = 23;

export function Logo({ variant = "horizontal", height = 32, onPrimary = false, onPaper = false, className, decorative = false }: LogoProps) {
  const theme = onPrimary ? "on-blue" : onPaper ? "light" : "auto";
  if (variant === "mark") return <Mark size={height} theme={theme} className={className} decorative={decorative} />;
  return (
    <BrandLogo
      variant={variant === "stacked" ? "endorsed" : "primary"}
      theme={theme}
      size={variant === "horizontal" ? Math.max(height, MIN_LOCKUP_HEIGHT) : height}
      className={className}
      decorative={decorative}
    />
  );
}
