import { useEffect, useId, useState } from "react";

import { SCORING_MODE_LABELS, SCORING_MODES, type RescoreReport, type ScoringMode } from "@shared/scoring";

import { api, ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { formatTimestamp } from "@/lib/utils";

interface ScoringView {
  mode: ScoringMode;
  report: RescoreReport | null;
  rescoring: boolean;
}

/**
 * v4.4: the Advanced scoring setting (superadmin only). Changing it re-checks every stored answer
 * in the background; the last run's counts are shown in plain words.
 */
export function ScoringSettings() {
  const id = useId();
  const [view, setView] = useState<ScoringView | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<ScoringView>("/api/admin/settings/scoring", controller.signal)
      .then(setView)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Could not load the scoring setting.");
      });
    return () => controller.abort();
  }, []);

  const save = async (mode: ScoringMode) => {
    setSaving(true);
    try {
      const next = await api.put<ScoringView>("/api/admin/settings/scoring", { mode });
      setView(next);
      notify.success("Saved. Past answers are being checked again with the new setting.");
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "Could not save that setting.");
    } finally {
      setSaving(false);
    }
  };

  const recheck = async () => {
    setSaving(true);
    try {
      const next = await api.post<ScoringView & { queued: boolean }>("/api/admin/scoring/rescore");
      setView(next);
      notify.success(next.queued ? "Checking past answers again." : "A check is already running.");
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "That did not work. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <details className="mt-3 border-t pt-3">
      <summary className="cursor-pointer text-sm font-medium">Advanced</summary>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {view && (
        <fieldset className="mt-2 space-y-1.5" disabled={saving}>
          <legend className="text-sm">Scoring</legend>
          {SCORING_MODES.map((mode) => (
            <label key={mode} className="flex items-center gap-2 text-sm">
              <input type="radio" name={`${id}-mode`} checked={view.mode === mode} onChange={() => void save(mode)} />
              {SCORING_MODE_LABELS[mode]}
            </label>
          ))}
          <p className="text-xs text-muted-foreground">
            Full marks or Not yet: a good answer gets full marks even if it is written differently or misses a small extra.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="button" size="sm" variant="outline" onClick={() => void recheck()} disabled={view.rescoring}>
              Check past answers again
            </Button>
            <span className="text-xs text-muted-foreground">
              {view.rescoring
                ? "Checking past answers now."
                : view.report
                  ? `Last check ${formatTimestamp(view.report.at)}: ${view.report.items} answers, ${view.report.changed} changed, ${view.report.resultsChanged} results changed.`
                  : "Past answers have not been checked again yet."}
            </span>
          </div>
        </fieldset>
      )}
    </details>
  );
}
