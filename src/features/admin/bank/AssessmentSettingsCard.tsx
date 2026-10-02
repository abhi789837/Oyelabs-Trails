import { useEffect, useId, useState } from "react";

import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/lib/toast";
import { adminApi } from "../api";
import { InfoTip } from "../catalog/InfoTip";
import { formatMinFinish, MAX_MIN_FINISH_MINUTES, parseMinFinish } from "./assessmentSettings";

/**
 * The one assessment-wide setting: a minimum time before a learner may press Finish. Off by
 * default. Any staff member can change it; the server audits every save.
 */
export function AssessmentSettingsCard({ className }: { className?: string }) {
  const id = useId();
  const [saved, setSaved] = useState<number | null | undefined>(undefined);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminApi
      .getAssessmentSettings(controller.signal)
      .then((result) => {
        setSaved(result.minFinishMinutes);
        setText(formatMinFinish(result.minFinishMinutes));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLoadError(err instanceof ApiRequestError ? err.message : "Could not load assessment settings.");
      });
    return () => controller.abort();
  }, []);

  const parsed = parseMinFinish(text);
  const error = "error" in parsed ? parsed.error : undefined;
  const dirty = saved !== undefined && !error && "value" in parsed && parsed.value !== saved;

  const save = async () => {
    if (!("value" in parsed)) return;
    setSaving(true);
    try {
      const result = await adminApi.saveAssessmentSettings(parsed.value);
      setSaved(result.minFinishMinutes);
      setText(formatMinFinish(result.minFinishMinutes));
      notify.success(
        result.minFinishMinutes ? `Finish unlocks after ${result.minFinishMinutes} minutes.` : "Minimum time before Finish is off.",
      );
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "Could not save that setting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby={`${id}-title`} className={className}>
      <div className="rounded-md border bg-surface px-4 py-3">
        <h2 id={`${id}-title`} className="text-sm font-semibold">
          Assessment settings
        </h2>
        {loadError ? (
          <p className="mt-2 text-sm text-destructive">{loadError}</p>
        ) : (
          <form
            className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (dirty) void save();
            }}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Label htmlFor={`${id}-min`}>Minimum time before Finish</Label>
                <InfoTip label="About the minimum time before Finish">
                  Learners cannot press Finish until this many minutes have passed. The 50-minute limit still applies.
                </InfoTip>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id={`${id}-min`}
                  inputMode="numeric"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Off"
                  disabled={saved === undefined || saving}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : `${id}-hint`}
                  className="h-9 w-20 tabular"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={!dirty} loading={saving}>
              Save
            </Button>
            {error ? (
              <p id={`${id}-error`} role="alert" className="w-full text-xs text-destructive">
                {error}
              </p>
            ) : (
              <p id={`${id}-hint`} className="w-full text-xs text-muted-foreground">
                Empty or 0 turns it off. Up to {MAX_MIN_FINISH_MINUTES}.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
