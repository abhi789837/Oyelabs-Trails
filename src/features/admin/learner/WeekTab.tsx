import { useCallback, useEffect, useState } from "react";
import { Clock, LoaderCircle, Pin, PinOff, RefreshCw, SkipForward } from "lucide-react";

import {
  LANE_ORDER,
  formatRange,
  itemsInLane,
  type PlanLane,
  type WeekItemView,
  type WeekResponse,
} from "@shared/weeklyPlan";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminWeekApi } from "@/features/plan/api";
import { LANE_META } from "@/features/plan/laneMeta";
import { levelLabels } from "@/lib/track-meta";
import { cn, formatMinutes, formatMinutesCompact } from "@/lib/utils";

/**
 * This learner's week, for the admin.
 *
 * Everything here is an override of a plan that was generated from the admin's *own* priorities, which
 * is why each control says so plainly and why each one is written to the audit log. The useful signal
 * is repetition: an admin who drags the same item into Do it now every Monday is telling us the
 * priorities need editing, not that the item needs pinning again — so the priorities live one tab away
 * and this tab says where to go.
 */
export function WeekTab({ userId, displayName }: { userId: string; displayName: string }) {
  const [response, setResponse] = useState<WeekResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setResponse(await adminWeekApi.get(userId, signal));
    },
    [userId],
  );

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    void load(controller.signal)
      .catch((err) => {
        if (alive && !controller.signal.aborted) {
          setError(err instanceof ApiRequestError ? err.message : "Could not load their week.");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [load]);

  const run = async (label: string, action: () => Promise<WeekResponse>) => {
    setBusy(label);
    setError(null);
    try {
      setResponse(await action());
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "That didn't work.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center" role="status">
        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading their week</span>
      </div>
    );
  }

  const week = response?.week ?? null;

  return (
    <div className="space-y-8">
      {error && <FormAlert>{error}</FormAlert>}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold">
            {week ? `Week ${week.weekNumber}` : "No week yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {week ? (
              <>
                {formatRange(week.startDate, week.endDate)} <span aria-hidden="true">·</span>{" "}
                {formatMinutes(week.plannedMinutes)} planned against a {formatMinutes(week.budgetMinutes)} budget{" "}
                <span aria-hidden="true">·</span> shaped by {week.source === "ai" ? "the AI" : week.source === "admin" ? "an admin" : "the rules"}
              </>
            ) : (
              (response?.reason ?? "It is built the first time they open their plan.")
            )}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Built from their goals; change hours or goals on <span className="font-medium">Setup</span>, then rebuild.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => void run("reshape", () => adminWeekApi.regenerate(userId, { rulesOnly: true }))}
          >
            <RefreshCw className={cn(busy === "reshape" && "animate-spin")} aria-hidden="true" />
            Rebuild this week
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => void run("advance", () => adminWeekApi.regenerate(userId, { advance: true }))}
          >
            <SkipForward aria-hidden="true" />
            Start their next week
          </Button>
        </div>
      </div>

      {week && (
        <>
          <div className="space-y-5">
            {LANE_ORDER.filter((lane) => week.items.some((item) => item.lane === lane)).map((lane) => (
              <AdminLane
                key={lane}
                lane={lane}
                items={itemsInLane(week, lane)}
                userId={userId}
                busy={busy}
                onAction={run}
              />
            ))}
          </div>

          <WeekHistoryList history={response?.history ?? []} currentId={week.id} displayName={displayName} />
        </>
      )}

      {!week && (response?.history.length ?? 0) > 0 && (
        <WeekHistoryList history={response!.history} currentId="" displayName={displayName} />
      )}
    </div>
  );
}

function AdminLane({
  lane,
  items,
  userId,
  busy,
  onAction,
}: {
  lane: PlanLane;
  items: WeekItemView[];
  userId: string;
  busy: string | null;
  onAction: (label: string, action: () => Promise<WeekResponse>) => Promise<void>;
}) {
  const meta = LANE_META[lane];
  const Icon = meta.icon;
  const minutes = items.reduce((sum, item) => sum + item.minutes, 0);

  return (
    <section className={cn("rounded-lg border", meta.border)}>
      <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5", meta.soft)}>
        <Icon className={cn("h-4 w-4 shrink-0", meta.text)} aria-hidden="true" />
        <h4 className="font-medium">{meta.label}</h4>
        <p className="font-mono text-[11px] text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"} <span aria-hidden="true">·</span> {formatMinutes(minutes)}
        </p>
      </div>

      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">
                {item.title}
                {item.status === "done" && (
                  <Badge variant="outline" className="ml-2 align-middle text-summit-strong">
                    done
                  </Badge>
                )}
                {item.pinned && <Pin className="ml-1.5 inline h-3 w-3 -translate-y-0.5 text-destructive" aria-label="Pinned" />}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-muted-foreground">
                <span className="min-w-0 truncate">{item.context}</span>
                {item.level && <span>{levelLabels[item.level]}</span>}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {formatMinutesCompact(item.minutes)}
                </span>
                {item.carried && <span>carried ×{item.skipCount}</span>}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.reason}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                disabled={busy !== null}
                onClick={() => void onAction(`pin-${item.id}`, () => adminWeekApi.pin(userId, item.id, !item.pinned))}
              >
                {item.pinned ? <PinOff aria-hidden="true" /> : <Pin aria-hidden="true" />}
                {item.pinned ? "Unpin" : "Pin to Do it now"}
              </Button>

              <MoveMenu item={item} lane={lane} userId={userId} busy={busy} onAction={onAction} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The house `DropdownMenu` is controlled — its open state drives the enter and exit animation. */
function MoveMenu({
  item,
  lane,
  userId,
  busy,
  onAction,
}: {
  item: WeekItemView;
  lane: PlanLane;
  userId: string;
  busy: string | null;
  onAction: (label: string, action: () => Promise<WeekResponse>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={busy !== null}>
          Move
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANE_ORDER.filter((target) => target !== lane).map((target) => (
          <DropdownMenuItem
            key={target}
            onSelect={() => void onAction(`move-${item.id}`, () => adminWeekApi.setLane(userId, item.id, target))}
          >
            <span className={cn("mr-2 h-2 w-2 rounded-full", LANE_META[target].dot)} aria-hidden="true" />
            {LANE_META[target].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WeekHistoryList({
  history,
  currentId,
  displayName,
}: {
  history: WeekResponse["history"];
  currentId: string;
  displayName: string;
}) {
  const past = history.filter((entry) => entry.id !== currentId);
  if (past.length === 0) return null;

  return (
    <section>
      <h3 className="font-display font-semibold">Past weeks</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        What {displayName} got through, week by week.
      </p>
      <ul className="mt-3 divide-y rounded-md border">
        {past.map((entry) => (
          <li key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5">
            <span className="font-medium">Week {entry.weekNumber}</span>
            <span className="font-mono text-[11px] text-muted-foreground tabular">
              {entry.doneCount}/{entry.totalCount} done
            </span>
            <Badge variant="outline" className="font-mono text-[10px]">
              {entry.status}
            </Badge>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {formatRange(entry.startDate, entry.endDate)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
