import { useEffect, useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";

import { TARGET_LEVEL_LABELS, type GoalSuggestion } from "@shared/goals";

import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { goalsApi } from "../setup/goalsApi";

const KIND_LABEL: Record<GoalSuggestion["kind"], string> = { "next-level": "next level", gap: "gap", progression: "next step" };

/**
 * v4.3 "Suggested next": next-level outcomes once a goal is achieved, and gaps the assessment found.
 * Nothing is added without the admin's click (unless they turned on auto-add in Advanced).
 */
export function GoalSuggestions({ userId, onAdded }: { userId: string; onAdded: () => void }) {
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    goalsApi
      .list(userId, controller.signal)
      .then((r) => setSuggestions(r.suggestions))
      .catch(() => {});
    return () => controller.abort();
  }, [userId]);

  if (suggestions.length === 0) return null;

  const act = async (s: GoalSuggestion, action: "add" | "dismiss") => {
    setBusy(s.id);
    try {
      if (action === "add") {
        const r = await goalsApi.addSuggestion(userId, s.id);
        setSuggestions(r.suggestions);
        notify.success(`${s.title} added as a goal.`);
        onAdded();
      } else {
        const r = await goalsApi.dismissSuggestion(userId, s.id);
        setSuggestions(r.suggestions);
      }
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="suggested-next-heading" className="space-y-3">
      <h2 id="suggested-next-heading" className="flex items-center gap-1.5 font-display text-base font-semibold">
        <Sparkles className="size-4 text-ridge-strong" aria-hidden="true" />
        Suggested next
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {suggestions.map((s) => (
          <li key={s.id} className="flex flex-col rounded-md border bg-surface px-4 py-3">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium">{s.title}</span>
              <span className="rounded-sm border px-1.5 font-mono text-[10px] text-muted-foreground">{KIND_LABEL[s.kind]}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{s.outcome}</p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {s.reason} · {TARGET_LEVEL_LABELS[s.targetLevel]}
            </p>
            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" loading={busy === s.id} disabled={busy !== null} onClick={() => void act(s, "add")}>
                <Plus aria-hidden="true" />
                Add
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={busy !== null} onClick={() => void act(s, "dismiss")}>
                <X aria-hidden="true" />
                Dismiss
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
