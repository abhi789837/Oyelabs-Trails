import { Users } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/v5/design/components/Button";
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

  return (
    <Button variant="secondary" size="sm" onClick={() => void toggle()} aria-pressed={on ?? false} disabled={on === null} data-testid="leaderboard-toggle">
      <Users aria-hidden="true" />
      {on ? "Team boards: on" : "Team boards: off"}
    </Button>
  );
}
