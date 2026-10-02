import { useEffect, useState } from "react";
import { List, LoaderCircle, Map as MapIcon } from "lucide-react";

import { formatRange, type WeekResponse } from "@shared/weeklyPlan";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { adminWeekApi } from "@/features/plan/api";
import { Lanes } from "@/features/plan/Lanes";
import { LaneLegend, WeekTrail } from "@/features/plan/WeekTrail";
import { ViewToggle } from "@/pages/parts/ViewToggle";
import { formatMinutes } from "@/lib/utils";

/**
 * The learner's current week, drawn with the learner's own components, so "what will they see"
 * is answered by looking rather than by reading the admin's lane editor and imagining it.
 */
export function ViewAsLearner({
  userId,
  displayName,
  open,
  onOpenChange,
}: {
  userId: string;
  displayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [response, setResponse] = useState<WeekResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"trail" | "list">("list");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setError(null);
    adminWeekApi
      .get(userId, controller.signal)
      .then(setResponse)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load their week.");
      });
    return () => controller.abort();
  }, [open, userId]);

  const week = response?.week ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="lg" closeLabel="Close the learner view" className="w-full overflow-y-auto p-5 sm:w-[85vw] sm:p-6">
        <SheetTitle>As {displayName} sees it</SheetTitle>
        <SheetDescription className="mt-1">
          {week
            ? `Week ${week.weekNumber}, ${formatRange(week.startDate, week.endDate)}, ${formatMinutes(week.plannedMinutes)} planned.`
            : "Their current week."}
        </SheetDescription>

        <div className="mt-5">
          {error ? (
            <FormAlert>{error}</FormAlert>
          ) : !response ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Loading their week…
            </p>
          ) : !week ? (
            <p className="text-sm text-muted-foreground">{response.reason ?? "They have no week yet. It is built when they open their plan."}</p>
          ) : (
            <>
              <ViewToggle
                label="How to show their week"
                value={view}
                onChange={setView}
                options={[
                  { value: "list", label: "List", icon: <List aria-hidden="true" /> },
                  { value: "trail", label: "Trail", icon: <MapIcon aria-hidden="true" /> },
                ]}
              />
              <div className="mt-5">
                {view === "trail" ? (
                  <>
                    <LaneLegend week={week} />
                    <WeekTrail week={week} />
                  </>
                ) : (
                  <Lanes week={week} />
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
