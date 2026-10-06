import { useEffect, useState } from "react";

import { Card, CardHeader } from "@/v5/design/components/Card";
import type { MotivationPrefs, MotivationSummary } from "@shared/motivation";

import { motivationApi } from "./api";
import { TeamBoard, WeeklyGoalField } from "./ProgressPanel";

/**
 * Me → Settings: the weekly goal (and the team board opt-in when an admin turned the board on).
 * Phase 4's settings API doesn't carry these keys, so this card saves through
 * `PUT /api/v5/motivation/prefs`. Lazy-loaded by the Me page.
 */
export default function MotivationSettings() {
  const [summary, setSummary] = useState<MotivationSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    motivationApi
      .summary(null, ac.signal)
      .then(setSummary)
      .catch(() => {
        if (!ac.signal.aborted) setFailed(true);
      });
    return () => ac.abort();
  }, []);

  const setPrefs = (prefs: MotivationPrefs) => setSummary((s) => (s ? { ...s, prefs } : s));

  return (
    <Card className="flex flex-col gap-4" data-testid="motivation-settings">
      <CardHeader title="Weekly goal" className="mb-0" />
      {failed ? (
        <p className="text-small text-fg-2">We couldn't load your goal. Reload the page to try again.</p>
      ) : summary ? (
        <>
          <WeeklyGoalField prefs={summary.prefs} onSaved={setPrefs} defaultMinutes={summary.defaultGoalMinutes ?? null} hideLabel />
          {summary.leaderboards ? <TeamBoard prefs={summary.prefs} onSaved={setPrefs} /> : null}
        </>
      ) : (
        <p className="text-small text-fg-2">Loading…</p>
      )}
    </Card>
  );
}
