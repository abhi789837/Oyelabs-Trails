import { lazy, Suspense } from "react";

import { RouteFallback } from "@/v5/app/RouteFallback";

/**
 * Placeholder from v5 Phase 0, replaced by the Assessment group (P5) with the calm v5 UI.
 *
 * Until then it renders the existing assessment unchanged, so a learner on the new design can
 * still take their placement test. Lazy, because the old page pulls in MediaPipe (proctoring).
 */
const OldAssessmentPage = lazy(() => import("@/features/assessment/AssessmentPage"));

export default function AssessmentPage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <OldAssessmentPage />
    </Suspense>
  );
}
