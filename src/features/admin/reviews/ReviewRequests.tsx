import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { ReviewRequestView } from "@shared/scoring";

import { api, ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { cn, formatTimestamp } from "@/lib/utils";

/**
 * v4.4: answers learners asked to have looked at again. Each shows the question, their answer and
 * why it was marked Not yet; the admin gives full marks or keeps Not yet. Used as its own page and,
 * filtered to one person, on the learner page.
 */
export function ReviewRequestsList({ userId, className }: { userId?: string; className?: string }) {
  const [status, setStatus] = useState<"open" | "all">("open");
  const [requests, setRequests] = useState<ReviewRequestView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const query = new URLSearchParams({ status, ...(userId ? { userId } : {}) });
      const result = await api.get<{ requests: ReviewRequestView[] }>(`/api/admin/review-requests?${query.toString()}`);
      setRequests(result.requests);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load the review requests.");
    }
  }, [status, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section aria-label="Review requests" className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={status === "open" ? "default" : "outline"} onClick={() => setStatus("open")}>
          Waiting
        </Button>
        <Button size="sm" variant={status === "all" ? "default" : "outline"} onClick={() => setStatus("all")}>
          All
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {requests && requests.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">{status === "open" ? "No answers are waiting for a review." : "Nobody has asked for a review yet."}</p>
      )}
      <ul className="mt-3 space-y-3">
        {(requests ?? []).map((request) => (
          <ReviewCard key={request.id} request={request} showLearner={!userId} onDecided={load} />
        ))}
      </ul>
    </section>
  );
}

function ReviewCard({ request, showLearner, onDecided }: { request: ReviewRequestView; showLearner: boolean; onDecided: () => Promise<void> }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"override" | "uphold" | null>(null);

  const decide = async (decision: "override" | "uphold") => {
    setBusy(decision);
    try {
      await api.post(`/api/admin/review-requests/${request.id}/decision`, { decision, note });
      notify.success(decision === "override" ? "Full marks given. Their results are updated." : "Kept as Not yet. They have been told.");
      await onDecided();
    } catch (err) {
      notify.error(err instanceof ApiRequestError ? err.message : "That did not work. Try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <li className="rounded-md border px-4 py-3 text-sm">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {showLearner && (
          <Link to={`/admin/people/${request.userId}?tab=assessment`} className="font-medium text-foreground underline-offset-2 hover:underline">
            {request.learnerName}
          </Link>
        )}
        <span>{request.where}</span>
        <span>{formatTimestamp(request.createdAt)}</span>
        <span
          className={cn(
            "ml-auto rounded-sm border px-1.5 py-px",
            request.status === "open" && "border-trailmark/50 text-trailmark-strong",
            request.status === "overridden" && "border-summit/50 text-summit-strong",
          )}
        >
          {request.status === "open" ? "Waiting" : request.status === "overridden" ? "Full marks given" : "Kept as Not yet"}
        </span>
      </div>
      <p className="mt-2 font-medium">Question</p>
      <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{request.question}</p>
      <p className="mt-2 font-medium">Their answer</p>
      <pre className="mt-0.5 max-h-60 overflow-auto whitespace-pre-wrap rounded-sm bg-surface-sunken/40 px-2 py-1 font-mono text-xs">{request.answer}</pre>
      <p className="mt-2 font-medium">Why it was marked Not yet</p>
      <p className="mt-0.5 text-muted-foreground">{request.reason}</p>
      {request.learnerNote && (
        <>
          <p className="mt-2 font-medium">Their note</p>
          <p className="mt-0.5 text-muted-foreground">{request.learnerNote}</p>
        </>
      )}
      {request.status === "open" ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note to the learner"
            rows={2}
            maxLength={600}
            aria-label="Note to the learner"
            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={busy === "override"} disabled={busy !== null} onClick={() => void decide("override")}>
              Give full marks
            </Button>
            <Button size="sm" variant="outline" loading={busy === "uphold"} disabled={busy !== null} onClick={() => void decide("uphold")}>
              Keep "Not yet"
            </Button>
          </div>
        </div>
      ) : (
        request.resolution && <p className="mt-2 text-xs text-muted-foreground">Decision: {request.resolution}</p>
      )}
    </li>
  );
}

export default function AdminReviewsPage() {
  useDocumentTitle("Review requests");
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Review requests</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Learners asked for these answers to be looked at again. Give full marks if the answer does the job.
      </p>
      <ReviewRequestsList className="mt-6" />
    </div>
  );
}
