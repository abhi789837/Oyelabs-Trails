import { useEffect, useState } from "react";
import { LoaderCircle, ShieldCheck, Timer } from "lucide-react";
import { Link } from "react-router-dom";

import { AUTO_APPROVE_AFTER_MS, type AssessmentSummary } from "@shared/assessment";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Button } from "@/components/ui/button";
import { adminApi } from "./api";

/**
 * The review gate, wherever an admin meets a generated assessment.
 *
 * The countdown is the honest part: this is a gate the admin can walk through, not one that holds
 * the learner indefinitely. Saying exactly how long is left makes "I'll look at it later" an
 * informed choice rather than an accident.
 */
export function ApprovalBanner({
  assessment,
  onApproved,
  poolHref,
}: {
  assessment: AssessmentSummary;
  onApproved: () => void | Promise<void>;
  /** Offered where the pool is somewhere else; omitted on the pool page itself. */
  poolHref?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const msLeft = useCountdown(
    assessment.status === "awaiting_approval" && assessment.awaitingApprovalSince !== null
      ? assessment.awaitingApprovalSince + AUTO_APPROVE_AFTER_MS
      : null,
  );

  if (assessment.status !== "awaiting_approval") return null;

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      await adminApi.approveAssessment(assessment.id);
      await onApproved();
    } catch (err) {
      // A 409 here usually means the deadline beat the click, so the message matters.
      setError(err instanceof ApiRequestError ? err.message : "Could not approve this assessment.");
      setBusy(false);
    }
  };

  return (
    <div className="w-full rounded-md border border-trailmark/50 bg-trailmark/[0.06] px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Timer className="h-4 w-4 shrink-0 text-trailmark-strong" aria-hidden="true" />
        <p className="text-sm">
          <span className="font-medium">Waiting for you.</span>{" "}
          <span className="text-muted-foreground">
            The learner cannot start it until you approve it{" "}
            {msLeft === null ? (
              "or the deadline passes"
            ) : msLeft > 0 ? (
              <>
                — it goes out on its own in <span className="font-mono tabular">{formatCountdown(msLeft)}</span>
              </>
            ) : (
              "— the deadline has passed, so it is being released now"
            )}
            .
          </span>
        </p>
        <div className="ml-auto flex gap-1">
          {poolHref && (
            <Button asChild variant="ghost" size="sm">
              <Link to={poolHref}>Review the pool</Link>
            </Button>
          )}
          <Button size="sm" onClick={() => void approve()} disabled={busy}>
            {busy ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <ShieldCheck aria-hidden="true" />
            )}
            Approve and release
          </Button>
        </div>
      </div>
      {error && (
        <div className="mt-3">
          <FormAlert>{error}</FormAlert>
        </div>
      )}
    </div>
  );
}

/**
 * How an assessment came to be released, in one line, or null while nothing has been decided.
 *
 * "Nobody looked at this" is a materially weaker assurance than a human approval, so it is stated
 * rather than left to be inferred from an empty field.
 */
export function approvalNote(assessment: AssessmentSummary): string | null {
  if (assessment.approvedAt === null) return null;
  return assessment.approvedBy === null
    ? `Released automatically after ${Math.round(AUTO_APPROVE_AFTER_MS / 60_000)} minutes — nobody reviewed it`
    : "Approved by an admin";
}

/** Milliseconds until `deadline`, re-rendered each second. Null when there is no deadline. */
function useCountdown(deadline: number | null): number | null {
  const [msLeft, setMsLeft] = useState(() => (deadline === null ? null : deadline - Date.now()));

  useEffect(() => {
    if (deadline === null) {
      setMsLeft(null);
      return;
    }
    setMsLeft(deadline - Date.now());
    const timer = setInterval(() => setMsLeft(deadline - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  return msLeft;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
