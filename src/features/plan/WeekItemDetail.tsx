import { ArrowDownToLine, Clock, Pin } from "lucide-react";
import { Link } from "react-router-dom";

import type { WeekItemView } from "@shared/weeklyPlan";

import { Button } from "@/components/ui/button";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatMinutesCompact } from "@/lib/utils";
import { LANE_META } from "./laneMeta";

/**
 * The body of the card a waypoint opens, and of a row expanded in the list.
 *
 * One component for both, so a popover on a desktop and a bottom sheet on a phone cannot say different
 * things about the same item — and so the "Why" line is written once. That line is the point of the
 * card: an item that appears without a reason reads as the platform deciding things about you, and the
 * same item with "you missed 4 of 5 deployment questions" reads as a consequence of something you did,
 * which is what it is.
 */
export function WeekItemDetail({ item, onNavigate }: { item: WeekItemView; onNavigate?: () => void }) {
  const meta = LANE_META[item.lane];
  const Icon = meta.icon;

  return (
    <div className="mt-2 space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] text-muted-foreground">
        <span className={cn("inline-flex items-center gap-1.5 font-medium", meta.text)}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {meta.label}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {formatMinutesCompact(item.minutes)}
        </span>
        {item.level && <span>{levelLabels[item.level]}</span>}
        {item.pinned && (
          <span className="inline-flex items-center gap-1 text-destructive">
            <Pin className="h-3 w-3" aria-hidden="true" />
            pinned
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{item.context}</p>

      <p className={cn("rounded-md px-3 py-2 text-sm", meta.soft)}>
        <span className="font-medium">Why: </span>
        {item.reason}
      </p>

      {item.dependsOn.length > 0 && (
        <p className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-muted-foreground">
          <ArrowDownToLine className="h-3 w-3 shrink-0 translate-y-0.5" aria-hidden="true" />
          <span className="font-medium">Needs:</span>
          {item.dependsOn.map((dependency, index) => (
            <span key={dependency.key}>
              {dependency.title}
              {index < item.dependsOn.length - 1 ? "," : ""}
            </span>
          ))}
          <span>— in Must know.</span>
        </p>
      )}

      {item.carried && (
        <p className="text-xs text-muted-foreground">
          Carried over from{" "}
          {item.skipCount > 1 ? `${item.skipCount} weeks ago — worth telling your administrator if it keeps slipping` : "last week"}.
        </p>
      )}

      <Button asChild className="w-full" onClick={onNavigate}>
        <Link to={item.href}>
          {item.status === "done" ? "Look at it again" : item.status === "skipped" ? "Pick it up" : "Start"}
        </Link>
      </Button>
    </div>
  );
}
