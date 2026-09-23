import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/utils";
import type { TopicProgress } from "@/store/progressStore";

export function TopicStatusBadge({ progress }: { progress: TopicProgress }) {
  if (progress.status === "completed") {
    return (
      <Badge variant="success">
        Completed{progress.completedAt ? ` ${formatTimestamp(progress.completedAt)}` : ""}
        {progress.bestScore !== null ? `, best score ${progress.bestScore}%` : ""}
      </Badge>
    );
  }
  if (progress.status === "in-progress") {
    return (
      <Badge variant="progress">
        In progress
        {progress.attempts > 0 && progress.bestScore !== null ? `, best score ${progress.bestScore}%` : ""}
      </Badge>
    );
  }
  return <Badge variant="outline">Not started</Badge>;
}
