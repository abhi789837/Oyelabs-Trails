import { useState } from "react";

import type { AssessmentSummary } from "@shared/assessment";

import { formatTimestamp } from "@/lib/utils";
import { AdminEvaluationView } from "../AdminEvaluationView";

/** An evaluation exists (or is being produced) only once the test has ended one way or another. */
const EVALUATED = ["submitted", "evaluating", "completed", "terminated"];

/**
 * The evaluation tab (brief §13). A thin wrapper: `AdminEvaluationView` already renders the full
 * result, so this only has to decide *which* attempt is being looked at.
 */
export function EvaluationTab({ userId, assessments }: { userId: string; assessments: AssessmentSummary[] }) {
  const evaluated = assessments.filter((a) => EVALUATED.includes(a.status));
  const [selected, setSelected] = useState<string | null>(null);
  const current = evaluated.find((a) => a.id === selected) ?? evaluated[0];

  if (!current) {
    return (
      <section aria-label="Evaluation">
        <h2 className="border-b pb-4 text-lg font-semibold">Evaluation</h2>
        <p className="mt-6 text-sm text-muted-foreground">
          Nothing to evaluate yet. One is produced automatically once an assessment is submitted or ends.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Evaluation">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-lg font-semibold">Evaluation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Attempt {current.attemptNo} · {formatTimestamp(current.submittedAt ?? current.createdAt)}
          </p>
        </div>
        {evaluated.length > 1 && (
          <label className="flex items-center gap-2 text-sm">
            Attempt
            <select
              value={current.id}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-md border border-input bg-surface px-2 py-1.5 text-sm"
            >
              {evaluated.map((attempt) => (
                <option key={attempt.id} value={attempt.id}>
                  {attempt.attemptNo} — {formatTimestamp(attempt.createdAt)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-6">
        <AdminEvaluationView key={current.id} assessmentId={current.id} userId={userId} />
      </div>
    </section>
  );
}
