import { useEffect, useRef } from "react";

/**
 * A single burst of confetti, for reaching a summit.
 *
 * Hand-rolled rather than a dependency: the whole thing is a hundred particles under gravity on a
 * 2D canvas, and a package for that would cost more to audit than to write. It is the default
 * export of its own module so the page can `lazy()` it — the code does not reach anyone who has
 * not finished a trail, which is almost everyone, almost always.
 *
 * Rules it keeps:
 *
 * - **Nothing under `prefers-reduced-motion`.** The caller checks too, but a decorative animation
 *   is not something to leave guarded in only one place. There is no static fallback: the page
 *   already says "summit reached" in words, and a frozen spray of dots says nothing.
 * - **Nothing while the tab is hidden.** The loop stops dead and the timer stops with it, so a
 *   burst nobody watched is not played out to an empty room, or resumed three hours later.
 * - **It ends.** One burst, about two and a half seconds, then `onDone` and the canvas unmounts.
 *   Confetti that loops is a screensaver.
 * - **It is not in the way.** `pointer-events-none`, `aria-hidden`, and nothing under it moves.
 */

const PARTICLES = 110;
const DURATION_MS = 2600;
const GRAVITY = 0.00042; // px per ms², tuned against the fall height rather than physics
const DRAG = 0.9992;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  width: number;
  height: number;
  color: string;
}

/**
 * Turns a design token into a colour a canvas will accept.
 *
 * A canvas `fillStyle` is not CSS: it resolves no custom properties, and handing it
 * `rgb(var(--summit))` silently leaves the previous fill in place — which is black, on a page that
 * has no black in it. So the channels are read off the document and rebuilt as a literal. Reading
 * from `documentElement` also means the burst picks up the current theme rather than a hard-coded
 * light-mode colour.
 */
function tokenColor(token: string, alpha = 1): string {
  const fallback = alpha === 1 ? "rgb(217, 142, 43)" : `rgba(217, 142, 43, ${alpha})`;
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
    if (!raw) return fallback;
    const channels = raw.split(/[\s,]+/).slice(0, 3).join(", ");
    return alpha === 1 ? `rgb(${channels})` : `rgba(${channels}, ${alpha})`;
  } catch {
    return fallback;
  }
}

export interface ConfettiProps {
  /** A design token name, e.g. `summit`. The burst is mostly this, with two neutrals for depth. */
  accentToken: string;
  onDone?: () => void;
}

export default function Confetti({ accentToken, onDone }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doneRef.current?.();
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const size = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);

    // Two origins, low and wide, so the spray reads as coming from the page rather than raining
    // from a point above it.
    const accent = tokenColor(accentToken);
    const palette = [accent, accent, accent, tokenColor("foreground", 0.55), tokenColor("trailmark")];
    const particles: Particle[] = Array.from({ length: PARTICLES }, (_, index) => {
      const fromLeft = index % 2 === 0;
      const originX = fromLeft ? width * 0.18 : width * 0.82;
      const angle = (fromLeft ? -60 : -120) + (Math.random() * 44 - 22);
      const speed = 0.55 + Math.random() * 0.75;
      const radians = (angle * Math.PI) / 180;
      return {
        x: originX,
        y: height * 0.62,
        vx: Math.cos(radians) * speed,
        vy: Math.sin(radians) * speed,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.012,
        width: 5 + Math.random() * 5,
        height: 8 + Math.random() * 6,
        color: palette[index % palette.length],
      };
    });

    let frame = 0;
    let previous: number | null = null;
    let elapsed = 0;

    const step = (now: number) => {
      if (document.hidden) {
        // Freeze: no advance, no draw, no clock. The burst waits rather than being spent unseen.
        previous = null;
        frame = requestAnimationFrame(step);
        return;
      }
      previous ??= now;
      // Clamped so a dropped frame or a backgrounded tab cannot teleport everything off-screen.
      const delta = Math.min(now - previous, 48);
      previous = now;
      elapsed += delta;

      context.clearRect(0, 0, width, height);
      const fade = elapsed > DURATION_MS * 0.6 ? Math.max(0, 1 - (elapsed - DURATION_MS * 0.6) / (DURATION_MS * 0.4)) : 1;

      for (const particle of particles) {
        particle.vy += GRAVITY * delta;
        particle.vx *= DRAG;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.rotation += particle.spin * delta;

        context.save();
        context.globalAlpha = fade;
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
        context.restore();
      }

      if (elapsed < DURATION_MS) frame = requestAnimationFrame(step);
      else doneRef.current?.();
    };

    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", size);
    };
  }, [accentToken]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
    />
  );
}
