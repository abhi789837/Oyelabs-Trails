import { lazy, Suspense, type ReactNode } from "react";
import { motion } from "motion/react";

import { Logo } from "@/components/layout/Logo";
import { ShineBorder } from "@/components/ui/shine-border";
import { fadeUp, stagger } from "@/lib/motion";

/**
 * Decoration, in its own chunk. The sign-in form is the first thing anybody downloads on this
 * app and it should not wait on a background effect; `Suspense` falls back to nothing, so on a
 * slow connection the page simply renders without it and gains it a moment later.
 */
const AuthBackdrop = lazy(() => import("./AuthBackdrop"));

export interface AuthLayoutProps {
  /** The mono line under the logo — "Internal training", or the signed-in username. */
  eyebrow: string;
  /** Left-column copy. Desktop only: on a phone the form is the whole point of the screen. */
  aside: ReactNode;
  title: string;
  description: ReactNode;
  /** A closing note under a rule inside the card. */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * The shell both auth screens sit in: brand on the left, a single card on the right, one
 * background effect behind the pair.
 *
 * It is a two-column grid from `lg` up and one column below it, which is what makes 375px work —
 * the aside is not shrunk to fit, it is dropped, and what remains is a logo, a card and the
 * gutters. There is one motion moment on the page: the two columns rise together on mount, and
 * nothing else moves until the person does something.
 */
export function AuthLayout({ eyebrow, aside, title, description, footer, children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <Suspense fallback={null}>
        <AuthBackdrop />
      </Suspense>

      <motion.div
        variants={stagger(0.05)}
        initial="hidden"
        animate="visible"
        className="relative mx-auto grid min-h-dvh w-full max-w-6xl content-center gap-10 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-center lg:gap-20 lg:px-10"
      >
        <motion.div variants={fadeUp}>
          <Logo variant="stacked" height={72} />
          <p className="mt-3 font-mono text-xs text-muted-foreground">{eyebrow}</p>
          <div className="mt-10 hidden max-w-md lg:block">{aside}</div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <ShineBorder innerClassName="p-6 sm:p-8">
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <div className="mt-6">{children}</div>
            {footer && (
              <div className="mt-6 border-t pt-4 text-xs text-muted-foreground">{footer}</div>
            )}
          </ShineBorder>
        </motion.div>
      </motion.div>
    </div>
  );
}
