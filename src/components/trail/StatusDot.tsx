import { Check } from "lucide-react";

import { statusMeta } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { TopicStatus } from "@/store/progressStore";

/**
 * Small inline version of the roadmap's waypoint marker. The visible mark is the dot; the label
 * comes from the shared status registry so the screen-reader text matches the badge's wording
 * exactly rather than drifting from its own copy of the same three strings.
 */
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
      <span className="sr-only">{statusMeta("topic", status).label}</span>
    </span>
  );
}
