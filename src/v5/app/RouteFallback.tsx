import { BrandLoader } from "@/components/brand/BrandLoader";

/**
 * Shown while a lazy route chunk loads, full page: the brand loader (rebrand Phase 3), which holds
 * still under reduced motion. Content inside a shell keeps its skeletons.
 */
export function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <BrandLoader size={44} />
    </div>
  );
}

/** A smaller fallback for a screen inside a shell, so the shell stays put while the screen loads. */
export function ScreenFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <BrandLoader size={32} />
    </div>
  );
}
