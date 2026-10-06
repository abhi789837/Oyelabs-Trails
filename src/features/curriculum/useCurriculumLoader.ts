import { useEffect } from "react";

import { useAuth } from "@/features/auth/AuthProvider";
import { clearModuleCache, useCurriculumStore } from "@/store/curriculumStore";
import { useProgressStore } from "@/store/progressStore";

/**
 * Loads the person's manifest and progress once they are signed in, and clears both when they are
 * not (both are per-person, so one person's plan must never show to the next). Shared by the old
 * `CurriculumProvider` and v5's `V5CurriculumProvider`, which differ only in their markup.
 */
export function useCurriculumLoader() {
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

  return { status, error, retry: () => void loadCurriculum() };
}
