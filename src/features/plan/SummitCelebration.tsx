import { useEffect, useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Reaching the week's summit.
 *
 * A flag raise and a short burst of brand-coloured dots, once, when the last blocking item is ticked.
 *
 * Not `components/certificate/Confetti`, deliberately. That one is a hundred and ten particles under
 * gravity across the whole viewport, and it is what reaching a *track summit* looks like — the moment a
 * certificate is issued. A week is a smaller thing. Throwing the same burst at both would make the
 * certificate feel like a Tuesday, so this one stays inside its own card: eighteen dots, one flag, no
 * canvas, gone in under three seconds.
 *
 * Under `prefers-reduced-motion` there is no burst and no raise — the flag is simply there, which is
 * the same information without the movement.
 */

const DOTS = 18;
const LIFETIME_MS = 2600;

/** Fixed offsets rather than random ones, so the same week celebrates the same way twice. */
function scatter(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.24;
    const distance = 54 + ((i * 37) % 46);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 18,
      delay: (i % 6) * 0.045,
      size: 5 + (i % 3) * 2,
      // The three brand-ish tokens, so the burst belongs to this product rather than to a library.
      color: ["rgb(var(--summit))", "rgb(var(--trailmark))", "rgb(var(--primary))"][i % 3],
    };
  });
}

export function SummitCelebration({
  reached,
  weekNumber,
  minutes,
  onPlanNext,
  planning,
}: {
  reached: boolean;
  weekNumber: number;
  minutes: number;
  onPlanNext: () => void;
  planning: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [burst, setBurst] = useState(false);
  const dots = useMemo(() => scatter(DOTS), []);

  /* Fires on the transition into `reached`, not on every render while it is true — otherwise the burst
     replays each time the page re-renders after the week is finished. */
  useEffect(() => {
    if (!reached || reduceMotion) return;
    setBurst(true);
    const timer = setTimeout(() => setBurst(false), LIFETIME_MS);
    return () => clearTimeout(timer);
  }, [reached, reduceMotion]);

  if (!reached) return null;

  const hours = Math.round((minutes / 60) * 10) / 10;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative overflow-hidden rounded-lg border border-summit/40 bg-summit/[0.07] px-5 py-6 text-center"
      role="status"
    >
      <div className="relative mx-auto mb-3 h-12 w-12">
        {/* The dots come from behind the flag and fall outward. Transform and opacity only. */}
        <AnimatePresence>
          {burst &&
            dots.map((dot, i) => (
              <motion.span
                key={i}
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{ width: dot.size, height: dot.size, backgroundColor: dot.color }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{ x: dot.x, y: dot.y, opacity: [0, 1, 1, 0], scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, delay: dot.delay, ease: [0.2, 0.8, 0.2, 1] }}
              />
            ))}
        </AnimatePresence>

        <motion.span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center rounded-full bg-summit text-summit-foreground"
          initial={reduceMotion ? false : { scale: 0.5, rotate: -18 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 18, delay: reduceMotion ? 0 : 0.1 }}
        >
          <Flag className="h-5 w-5" />
        </motion.span>
      </div>

      <p className="font-display text-lg font-semibold">Week {weekNumber} summit reached</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Everything that was blocking you is done — about {hours} hour{hours === 1 ? "" : "s"} of it. The rest of this
        week is yours.
      </p>

      <button
        type="button"
        onClick={onPlanNext}
        disabled={planning}
        className="mt-5 inline-flex items-center justify-center rounded-md bg-summit px-4 py-2 font-medium text-summit-foreground transition-colors duration-[120ms] hover:bg-summit/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-summit disabled:opacity-60"
      >
        {planning ? "Scouting your next route…" : "Plan my next week"}
      </button>
    </motion.div>
  );
}
