import { CircleCheck, CircleDashed } from "lucide-react";

import { cn } from "@/lib/utils";
import { HANDBOOK_STATUS_LABELS, type HandbookStatus } from "@shared/handbook";

/**
 * "Confirmed by Oyelabs" (green) or "Industry standard – to confirm" (amber). The icon differs too,
 * so the status never rests on colour alone. `-strong` text tokens keep 4.5:1 in both themes.
 */
export function StatusChip({ status, className }: { status: HandbookStatus; className?: string }) {
  const confirmed = status === "confirmed";
  const Icon = confirmed ? CircleCheck : CircleDashed;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-px text-[11px] font-medium leading-5",
        confirmed ? "border-summit/50 bg-summit/10 text-summit-strong" : "border-trailmark/50 bg-trailmark/10 text-trailmark-strong",
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      {HANDBOOK_STATUS_LABELS[status]}
    </span>
  );
}
