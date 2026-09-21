import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TopicStatus } from "@/store/progressStore";

const statusLabels: Record<TopicStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

/** Small inline version of the roadmap's waypoint marker. */
export function StatusDot({ status, className }: { status: TopicStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
        status === "completed" && "bg-summit text-summit-foreground",
        status === "in-progress" && "bg-trailmark",
        status === "not-started" && "border-[1.5px] border-basalt",
        className,
      )}
    >
      {status === "completed" && <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden="true" />}
      <span className="sr-only">{statusLabels[status]}</span>
    </span>
  );
}

export { statusLabels };
