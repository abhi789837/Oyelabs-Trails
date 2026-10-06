import "@/fonts/legacyFonts";
import { MotionConfig } from "motion/react";
import { OverlayProvider } from "@/components/overlays";
import { TooltipProvider } from "@/components/ui/tooltip";

import ChangePasswordPage from "@/features/auth/ChangePasswordPage";
import LoginPage from "@/features/auth/LoginPage";

/*
 * The public auth pages, loaded on demand. MotionConfig lives here (and in each design tree)
 * rather than in App, so motion is not part of every page's first download.
 */
export function LoginRoute() {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={150}>
        <OverlayProvider>
          <LoginPage />
        </OverlayProvider>
      </TooltipProvider>
    </MotionConfig>
  );
}

export function ChangePasswordRoute() {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={150}>
        <OverlayProvider>
          <ChangePasswordPage />
        </OverlayProvider>
      </TooltipProvider>
    </MotionConfig>
  );
}
