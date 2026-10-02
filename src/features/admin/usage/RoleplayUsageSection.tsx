import { useCallback, useEffect, useState } from "react";

import type { RoleplayUsage } from "@shared/roleplay";

import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Progress } from "@/components/ui/progress";
import { roleplayApi } from "@/features/roleplay/api";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { InfoTip } from "../catalog/InfoTip";
import { budgetTone, formatUsd } from "./helpers";

/**
 * Admin → AI usage → Client role-play (v4.2): this month's conversations, what one costs on
 * average, and the monthly cap on the two role-play tasks. Only the superadmin edits the cap.
 */
export function RoleplayUsageSection({ canEdit }: { canEdit: boolean }) {
  const [usage, setUsage] = useState<RoleplayUsage | null>(null);
  const [cap, setCap] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const next = await roleplayApi.usage(signal);
      setUsage(next);
      setCap(next.capUsd);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof ApiRequestError ? err.message : "Could not load role-play usage.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const save = async () => {
    if (cap === null) return;
    setSaving(true);
    try {
      setUsage(await roleplayApi.setCap(cap));
      notify.success(`Role-play cap set to ${formatUsd(cap)} a month.`);
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "Could not save the cap.");
    } finally {
      setSaving(false);
    }
  };

  const tone = usage ? budgetTone(usage.share) : "none";
  const pct = usage ? Math.min(100, Math.round(usage.share * 100)) : 0;

  return (
    <section className="mt-10" aria-labelledby="usage-roleplay">
      <div className="flex items-center gap-1">
        <h2 id="usage-roleplay" className="font-display text-lg font-semibold">
          Client role-play, this month
        </h2>
        <InfoTip label="About the role-play cap">
          The AI client&rsquo;s replies and the scoring (Haiku) count toward this cap. Over it, new practice conversations are
          refused until the month turns or the cap is raised; conversations inside an assessment always run.
        </InfoTip>
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {usage && (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Conversations" value={usage.sessions.toLocaleString()} hint={`${usage.scored} scored`} />
            <Stat label="Average per conversation" value={formatUsd(usage.avgCostUsd)} />
            <Stat label="Spent" value={formatUsd(usage.costUsd)} />
            <div
              className={cn(
                "flex min-w-0 flex-col rounded-lg border bg-background p-3 sm:p-4",
                tone === "warn" && "border-trailmark/60 bg-trailmark/[0.05]",
                tone === "over" && "border-destructive/50 bg-destructive/[0.05]",
              )}
            >
              <dt className="text-sm text-muted-foreground">Monthly cap</dt>
              <dd className="mt-2 font-display text-2xl leading-none font-semibold tabular">{formatUsd(usage.capUsd)}</dd>
              <dd className="mt-auto pt-2">
                <Progress
                  value={pct}
                  className="h-1.5"
                  indicatorClassName={tone === "over" ? "bg-destructive" : tone === "warn" ? "bg-trailmark" : "bg-summit"}
                  aria-label={`${pct}% of the role-play cap used`}
                />
                <span className="mt-1 block font-mono text-[11px] text-muted-foreground">{usage.overCap ? "Reached: practice paused" : `${pct}% used`}</span>
              </dd>
            </div>
          </dl>
          {canEdit && (
            <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border px-4 py-3">
              <div>
                <label htmlFor="roleplay-cap" className="text-sm font-medium">
                  Role-play cap (USD a month)
                </label>
                <NumberInput id="roleplay-cap" value={cap} onChange={setCap} min={0} max={10_000} step={5} containerClassName="mt-1.5 w-40" />
              </div>
              <Button size="sm" variant="outline" loading={saving} disabled={cap === null || cap === usage.capUsd} onClick={() => void save()}>
                Save
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-lg border bg-background p-3 sm:p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-2 font-display text-2xl leading-none font-semibold tabular">{value}</dd>
      {hint && <dd className="mt-auto pt-2 font-mono text-[11px] text-muted-foreground">{hint}</dd>}
    </div>
  );
}
