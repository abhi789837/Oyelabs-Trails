import type { ReactNode } from "react";
import { motion } from "motion/react";

import { Logo } from "@/components/brand/Logo";
import { RingDevice } from "@/components/brand/RingDevice";
import { fadeUp } from "@/lib/motion";

export interface AuthLayoutProps {
  /** A small line above the title: the signed-in username on the password screen. */
  eyebrow?: string;
  title: string;
  description: ReactNode;
  /** A closing note under a rule, below the form. */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * The branded frame of every auth screen (rebrand Phase 3, kit 05-web/signin-page-mockup).
 *
 * - Desktop (lg+): a split screen. Left, about 45%: Oyelabs Blue with the ring device, the `on-blue`
 *   logo top-left and "Learning never closes." at the bottom. Right: Cloud, the primary logo, the
 *   title and the form.
 * - Phone: one column. A slim blue band with the ring device at the top, the endorsed logo, the form.
 * - Dark: the panel is Night with Sky rings and the `dark` logo; the form side is Night Navy.
 *
 * The left panel is decoration and brand copy only, so it is an `aside` the form never depends on.
 * One motion moment: the form column rises on mount (reduced motion flattens it). The logos skip
 * their computed clear space: the panel's padding and the gaps under them are wider than it.
 */
export function AuthLayout({ eyebrow, title, description, footer, children }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh bg-cloud text-foreground lg:grid lg:grid-cols-[45%_minmax(0,1fr)] dark:bg-night-navy">
      <aside
        aria-label="Oyelearn"
        className="relative hidden overflow-hidden bg-oyelabs-blue px-16 py-14 text-white lg:flex lg:min-h-dvh lg:flex-col lg:justify-between dark:bg-night"
        data-testid="auth-brand-panel"
      >
        <RingDevice className="absolute -right-[22%] top-[-6%] h-[112%] w-auto text-white opacity-[0.14] dark:text-sky dark:opacity-25" />
        <div className="relative">
          {/* Visibility on wrappers: a display class on the logo itself would fight its inline-flex. */}
          <div className="dark:hidden">
            <Logo theme="on-blue" size={44} clearSpace={false} />
          </div>
          <div className="hidden dark:block">
            <Logo theme="dark" size={44} clearSpace={false} />
          </div>
        </div>
        <div className="relative max-w-lg">
          <p className="font-display text-[clamp(2.5rem,1rem+2.6vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-balance">Learning never closes.</p>
          <p className="mt-4 text-lg text-white/90">Your plan, your pace — built for the Oyelabs team.</p>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col lg:min-h-0">
        <div className="relative h-16 overflow-hidden bg-oyelabs-blue lg:hidden dark:bg-night" aria-hidden="true" data-testid="auth-brand-band">
          <RingDevice className="absolute -right-6 -top-10 h-36 w-auto text-white opacity-[0.16] dark:text-sky dark:opacity-30" />
        </div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[25rem]">
            <div className="mb-8 lg:hidden">
              <Logo variant="endorsed" size={48} clearSpace={false} />
            </div>
            <div className="mb-10 hidden lg:block">
              <Logo variant="primary" size={44} clearSpace={false} />
            </div>
            {eyebrow ? <p className="mb-2 font-mono text-xs text-muted-foreground">{eyebrow}</p> : null}
            <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.02em] text-foreground">{title}</h1>
            <p className="mt-2 text-base text-muted-foreground">{description}</p>
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-8 border-t pt-4 text-sm text-muted-foreground">{footer}</div> : null}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
