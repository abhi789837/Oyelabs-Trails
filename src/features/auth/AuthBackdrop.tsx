import { motion, useReducedMotion } from "motion/react";

import { Contours } from "@/components/trail/Contours";

/**
 * The one background effect on the two auth screens: a pair of very large, very soft spotlights
 * drifting behind the page's contour lines.
 *
 * Deliberately the cheapest of the three shapes considered. It is two `<div>`s carrying a
 * radial-gradient — no blur filter (a `closest-side` gradient is already soft, and `blur-3xl` on a
 * 36rem box is a real paint cost on a phone), no SVG beam paths to animate per frame, and nothing
 * that reads the pointer. The only work per frame is two composited transforms, and they are slow
 * enough — 22 and 26 seconds a cycle — that the page reads as still.
 *
 * It is a default export because `LoginPage` pulls it in with `lazy()`: the sign-in form is the
 * first thing anyone downloads, and decoration should not be in that chunk.
 *
 * Under `prefers-reduced-motion` the drift is dropped and the spotlights render where they start.
 * Losing the animation costs the page nothing — the composition is the effect, the drift is a
 * garnish — which is why this is static rather than absent.
 */
export default function AuthBackdrop() {
  const reduceMotion = useReducedMotion();
  const drift = (to: { x: number; y: number }, seconds: number) =>
    reduceMotion
      ? {}
      : {
          animate: { x: [0, to.x, 0], y: [0, to.y, 0], scale: [1, 1.08, 1] },
          transition: { duration: seconds, ease: "easeInOut" as const, repeat: Infinity },
        };

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-40 -top-56 h-[38rem] w-[38rem] rounded-full opacity-[0.16] dark:opacity-[0.22]"
        style={{ background: "radial-gradient(closest-side, var(--color-primary), transparent)" }}
        {...drift({ x: 60, y: 40 }, 22)}
      />
      <motion.div
        className="absolute -bottom-64 -right-40 h-[34rem] w-[34rem] rounded-full opacity-[0.14] dark:opacity-[0.20]"
        style={{ background: "radial-gradient(closest-side, var(--color-trailmark), transparent)" }}
        {...drift({ x: -48, y: -36 }, 26)}
      />
      {/* The house texture underneath the light, so the trail metaphor survives the effect. */}
      <Contours className="text-basalt/[0.13] dark:text-basalt/[0.09]" seed={3} rings={16} />
    </div>
  );
}
