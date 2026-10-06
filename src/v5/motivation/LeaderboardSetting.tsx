import { Users } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/v5/design/cn";
import { v5Toast } from "@/v5/design/components/Overlays";

import { motivationApi } from "./api";

/**
 * The admin switch for the opt-in team board (app_meta `motivation.leaderboards`, default off).
 * Super admins only; it sits next to "Weekly email" on Reports. Learners still choose to join.
 */
export default function LeaderboardSetting() {
  const { user } = useAuth();
  const superadmin = user?.role === "superadmin";
  const [on, setOn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!superadmin) return;
    const ac = new AbortController();
    motivationApi
      .adminSettings(ac.signal)
      .then((s) => setOn(s.leaderboards))
      .catch(() => undefined);
    return () => ac.abort();
  }, [superadmin]);

  if (!superadmin) return null;

  const toggle = async () => {
    const next = !on;
    setOn(next);
    try {
      await motivationApi.setLeaderboards(next);
      v5Toast.success(next ? "Team boards are on. Learners who join see their team's weekly XP." : "Team boards are off. Nobody sees a board now.");
    } catch {
      setOn(!next);
      v5Toast.error("That didn't work", "Try again in a moment.");
    }
  };

  // A switch, not a status line (UX review Rp2): the knob shows it can be flipped, and the name stays
  // "Team boards" while `aria-checked` carries on/off. The visible "on"/"off" stays for sighted users.
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on ?? false}
      aria-label="Team boards"
      onClick={() => void toggle()}
      disabled={on === null}
      data-testid="leaderboard-toggle"
      className="inline-flex min-h-8 items-center gap-2 rounded-control border border-line-2/60 bg-surface-1 px-3 text-small font-medium text-fg-1 hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
    >
      <Users className="size-4" aria-hidden="true" />
      Team boards
      <span className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors duration-120", on ? "border-brand bg-brand" : "border-line-2 bg-sunken")} aria-hidden="true">
        <span className={cn("inline-block size-3.5 rounded-full bg-surface-1 shadow-e1 transition-transform duration-120", on ? "translate-x-4" : "translate-x-0.5")} />
      </span>
      <span className="w-6 text-left text-caption text-fg-2" aria-hidden="true">
        {on ? "on" : "off"}
      </span>
    </button>
  );
}
