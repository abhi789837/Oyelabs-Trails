import { useEffect, useId, useState } from "react";

import { ApiRequestError } from "@/api/client";
import { cn } from "@/v5/design/cn";
import type { LeaderboardResponse, MotivationPrefs } from "@shared/motivation";

import { motivationApi } from "./api";
import { GOAL_CHOICES, goalLabel } from "./logic";

/**
 * The weekly goal field and the opt-in team board. Shown in the "Your progress" panel (from the
 * XP button in the top bar) and in Me → Settings (`MotivationSettings`).
 */

/** Fired after the weekly goal changes, so Today can re-read its goal ring. */
export const GOAL_CHANGED_EVENT = "oyelearn:goal-changed";

const errorText = (e: unknown) => (e instanceof ApiRequestError ? e.message : "That didn't save. Try again.");

/** `hideLabel`: the surrounding card's heading already says "Weekly goal", so the label is for screen readers only (UX review M2). */
export function WeeklyGoalField({ prefs, onSaved, defaultMinutes = null, hideLabel = false }: { prefs: MotivationPrefs; onSaved: (prefs: MotivationPrefs) => void; defaultMinutes?: number | null; hideLabel?: boolean }) {
  const id = useId();
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const value = prefs.weeklyGoalHours === null ? "" : String(prefs.weeklyGoalHours);
  const choices = GOAL_CHOICES.includes(prefs.weeklyGoalHours) ? GOAL_CHOICES : [...GOAL_CHOICES, prefs.weeklyGoalHours];

  const save = async (raw: string) => {
    const hours = raw === "" ? null : Number(raw);
    setStatus("Saving…");
    setError(null);
    try {
      const res = await motivationApi.savePrefs({ weeklyGoalHours: hours });
      onSaved(res.prefs);
      setStatus("Saved.");
      window.dispatchEvent(new Event(GOAL_CHANGED_EVENT));
    } catch (e) {
      setStatus("");
      setError(errorText(e));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-small font-medium text-fg-1"}>
        Weekly goal
      </label>
      <p id={`${id}-hint`} className="text-caption text-fg-2">
        Reach it to keep your weekly streak. You get 1 freeze a month for a busy week.
      </p>
      <select
        id={id}
        aria-describedby={`${id}-hint ${id}-status`}
        value={value}
        onChange={(e) => void save(e.target.value)}
        className="h-(--v5-control-h) w-full max-w-xs rounded-control border border-line-2/60 bg-surface-1 px-3 text-small text-fg-1"
        data-testid="weekly-goal-select"
      >
        {choices.map((h) => (
          <option key={h ?? "none"} value={h === null ? "" : String(h)}>
            {goalLabel(h, defaultMinutes)}
          </option>
        ))}
      </select>
      <p id={`${id}-status`} role="status" aria-live="polite" className="min-h-5 text-caption text-fg-2">
        {error ? <span className="font-medium text-danger-fg">{error}</span> : status}
      </p>
    </div>
  );
}

/** A labelled on/off switch (button role="switch"). */
export function Switch({ checked, onChange, label, hint, disabled, testId }: { checked: boolean; onChange: (next: boolean) => void; label: string; hint?: string; disabled?: boolean; testId?: string }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-small font-medium text-fg-1">
          {label}
        </p>
        {hint ? (
          <p id={`${id}-hint`} className="text-caption text-fg-2">
            {hint}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        data-testid={testId}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50",
          checked ? "border-brand bg-brand" : "border-line-2 bg-sunken",
        )}
      >
        <span className={cn("inline-block size-5 rounded-full bg-surface-3 shadow-e1 transition-transform", checked ? "translate-x-6" : "translate-x-1")} aria-hidden="true" />
      </button>
    </div>
  );
}

export function TeamBoard({ prefs, onSaved }: { prefs: MotivationPrefs; onSaved: (prefs: MotivationPrefs) => void }) {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    motivationApi
      .leaderboard(ac.signal)
      .then(setData)
      .catch((e: unknown) => {
        if (!ac.signal.aborted) setError(errorText(e));
      });
    return () => ac.abort();
  }, [reload]);

  if (error && !data) return <p className="text-small text-fg-2">We couldn't load the team board. {error}</p>;
  if (!data) return <p className="text-small text-fg-2">Loading the team board…</p>;
  if (!data.enabled) return null;

  const toggle = async (next: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await motivationApi.savePrefs({ leaderboardOptIn: next });
      onSaved(res.prefs);
      setReload((n) => n + 1);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const board = data.board;
  return (
    <section aria-labelledby="team-board-title" className="flex flex-col gap-3" data-testid="team-board">
      <div>
        <h3 id="team-board-title" className="font-display text-h4 font-semibold text-fg-1">
          Team board{data.team ? `: ${data.team}` : ""}
        </h3>
        <p className="text-caption text-fg-2">This week's XP. Only people who join show here, by first name.</p>
      </div>
      <Switch checked={prefs.leaderboardOptIn} onChange={(v) => void toggle(v)} disabled={busy} label="Show me on the team board" hint="You can leave at any time." testId="board-opt-in" />
      {error ? <p className="text-caption font-medium text-danger-fg">{error}</p> : null}
      {board && board.entries.length > 0 ? (
        <ul className="flex flex-col divide-y divide-line-1 rounded-card border border-line-1" aria-label="This week's XP">
          {board.entries.map((e, i) => (
            <li key={`${e.firstName}-${i}`} className={cn("flex items-center justify-between gap-3 px-3 py-2 text-small", e.you && "bg-brand-soft")}>
              <span className="min-w-0 truncate text-fg-1">
                {e.firstName}
                {e.you ? <span className="text-fg-2"> (you)</span> : null}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-fg-1">{e.xp.toLocaleString("en-US")} XP</span>
            </li>
          ))}
          {board.you ? (
            <li className="flex items-center justify-between gap-3 bg-brand-soft px-3 py-2 text-small">
              <span className="text-fg-1">
                {board.you.firstName} <span className="text-fg-2">(you)</span>
              </span>
              <span className="font-medium tabular-nums text-fg-1">{board.you.xp.toLocaleString("en-US")} XP</span>
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="text-small text-fg-2">Nobody has joined yet. The board fills up as people join.</p>
      )}
    </section>
  );
}
