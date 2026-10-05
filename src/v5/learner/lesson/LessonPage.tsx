import { useParams, useSearchParams } from "react-router-dom";

import { ScreenPlaceholder } from "@/v5/app/ScreenPlaceholder";

/** Placeholder from v5 Phase 0. Replaced by the Lesson group (P3). `?step=watch|read|do|check`. */
export default function LessonPage() {
  const { topicId } = useParams();
  const [params] = useSearchParams();
  return (
    <ScreenPlaceholder title="Lesson">
      <p className="font-mono text-xs text-muted-foreground" data-testid="v5-lesson-topic">
        {topicId} {params.get("step") ?? "watch"}
      </p>
    </ScreenPlaceholder>
  );
}
