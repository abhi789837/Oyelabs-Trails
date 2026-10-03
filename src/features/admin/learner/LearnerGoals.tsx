import { useCallback, useEffect, useState } from "react";
import { Check, Flag } from "lucide-react";

import { TARGET_LEVEL_LABELS, type CapstoneSummary, type LearnerGoal } from "@shared/goals";
import { SLIDER_LABELS, type Slider } from "@shared/setup";

import { ApiRequestError } from "@/api/client";
import { useConfirm } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { goalsApi } from "../setup/goalsApi";

/**
 * v4.3: the learner's goals and their capstones, for the admin. A goal is achieved when its
 * capstone is passed; most capstones are graded by code, but a client role-play, a written answer
 * or a form needs a person, so those get "Mark achieved" here.
 */
export function LearnerGoals({ userId, refreshKey = 0 }: { userId: string; refreshKey?: number }) {
  const [goals, setGoals] = useState<LearnerGoal[]>([]);
  const [capstones, setCapstones] = useState<Record<string, CapstoneSummary>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const confirm = useConfirm();

  const load = useCallback(
    (signal?: AbortSignal) =>
      goalsApi
        .list(userId, signal)
        .then((r) => {
          setGoals(r.goals);
          setCapstones(r.capstones ?? {});
        })
        .catch(() => {}),
    [userId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  if (goals.length === 0) return null;

  const achieve = async (goal: LearnerGoal) => {
    const ok = await confirm({
      title: `Mark "${goal.outcome.replace(/\.$/, "")}" achieved?`,
      body: "Do this once you have reviewed their capstone. The goal moves to achieved and the next level is suggested.",
      confirmLabel: "Mark achieved",
    });
    if (!ok) return;
    setBusy(goal.id);
    try {
      const r = await goalsApi.achieve(userId, goal.id);
      setGoals(r.goals);
      setCapstones(r.capstones ?? {});
      notify.success("Goal marked achieved.");
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="learner-goals-heading" className="space-y-3">
      <h2 id="learner-goals-heading" className="flex items-center gap-1.5 font-display text-base font-semibold">
        <Flag className="size-4 text-trailmark-strong" aria-hidden="true" />
        Goals and capstones
      </h2>
      <ul className="divide-y rounded-md border">
        {goals.map((goal) => {
          const capstone = capstones[goal.id];
          const achieved = goal.status === "achieved";
          return (
            <li key={goal.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{goal.outcome}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {SLIDER_LABELS[goal.slider as Slider]} · {TARGET_LEVEL_LABELS[goal.targetLevel]}
                  {capstone ? ` · Capstone: ${capstone.title}` : " · no capstone"}
                </p>
              </div>
              {achieved ? (
                <Badge variant="success">
                  <Check className="size-3" aria-hidden="true" />
                  Achieved
                </Badge>
              ) : capstone?.manual ? (
                <Button type="button" size="sm" variant="outline" loading={busy === goal.id} disabled={busy !== null} onClick={() => void achieve(goal)}>
                  Mark achieved
                </Button>
              ) : (
                <Badge variant="outline">{capstone ? "Graded when they pass it" : "Active"}</Badge>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
