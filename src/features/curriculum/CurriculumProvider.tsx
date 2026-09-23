import { useEffect, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { clearModuleCache, useCurriculumStore } from "@/store/curriculumStore";
import { useProgressStore } from "@/store/progressStore";

/**
 * Loads the person's manifest and progress once they are signed in, and clears both when they are
 * not. Both are per-person from v3, so leaving them in memory across a sign-out would briefly
 * show one person's plan to the next.
 *
 * Rendering waits for the manifest: every page below reads `tracks` synchronously, and rendering
 * an empty curriculum first would flash "nothing assigned" on every load.
 */
export function CurriculumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const status = useCurriculumStore((s) => s.status);
  const error = useCurriculumStore((s) => s.error);
  const loadCurriculum = useCurriculumStore((s) => s.load);
  const resetCurriculum = useCurriculumStore((s) => s.reset);
  const loadProgress = useProgressStore((s) => s.load);
  const resetProgress = useProgressStore((s) => s.reset);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      resetCurriculum();
      resetProgress();
      clearModuleCache();
      return;
    }
    void loadCurriculum();
    void loadProgress();
  }, [userId, loadCurriculum, loadProgress, resetCurriculum, resetProgress]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading your trail</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Your trail couldn't be loaded</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-6" onClick={() => void loadCurriculum()}>
          Try again
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
