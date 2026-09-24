import { StatusBadge } from "@/components/ui/status-badge";
import { formatTimestamp } from "@/lib/utils";
import type { TopicProgress } from "@/store/progressStore";

/**
 * The topic page's status line, now drawn by the shared `StatusBadge` so a topic's state reads
 * the same here as it does in the admin console.
 *
 * `dot={false}` is deliberate: the topic screen is one of the two surfaces that must not move in
 * this overhaul, and it predates the dot. Everywhere else gets the dot.
 */
export function TopicStatusBadge({ progress }: { progress: TopicProgress }) {
  const score = progress.bestScore !== null ? `, best score ${progress.bestScore}%` : "";

  if (progress.status === "completed") {
    return (
      <StatusBadge kind="topic" status="completed" dot={false}>
        {progress.completedAt ? ` ${formatTimestamp(progress.completedAt)}` : ""}
        {score}
      </StatusBadge>
    );
  }

  if (progress.status === "in-progress") {
    return (
      <StatusBadge kind="topic" status="in-progress" dot={false}>
        {progress.attempts > 0 ? score : ""}
      </StatusBadge>
    );
  }

  return <StatusBadge kind="topic" status="not-started" dot={false} />;
}
