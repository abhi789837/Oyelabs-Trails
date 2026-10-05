import { useParams } from "react-router-dom";

import { ScreenPlaceholder } from "@/v5/app/ScreenPlaceholder";

/** Placeholder from v5 Phase 0. Replaced by the Library group (P4). */
export default function CoursePage() {
  const { courseId } = useParams();
  return (
    <ScreenPlaceholder title="Course">
      <p className="font-mono text-xs text-muted-foreground">{courseId}</p>
    </ScreenPlaceholder>
  );
}
