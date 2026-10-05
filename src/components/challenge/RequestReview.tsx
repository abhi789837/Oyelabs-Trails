import { useState } from "react";

import type { ReviewSource } from "@shared/scoring";

import { api, ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * v4.4: "Request review" on a Not-yet answer. One click sends it to the admins; the button then
 * reads "Review requested". The answer is looked at by a person, who can give it full marks.
 */
export function RequestReview({
  source,
  refId,
  attemptId,
  className,
}: {
  source: ReviewSource;
  refId: string;
  attemptId?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setState("sending");
    setError(null);
    try {
      await api.post("/api/review-requests", { source, refId, ...(attemptId ? { attemptId } : {}), note: "" });
      setState("sent");
    } catch (err) {
      // Asked already (409) still means a review is on its way.
      if (err instanceof ApiRequestError && err.status === 409 && /already asked/i.test(err.message)) {
        setState("sent");
        return;
      }
      setState("idle");
      setError(err instanceof ApiRequestError ? err.message : "We couldn't send that. Try again.");
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {state === "sent" ? (
        <p className="text-xs text-muted-foreground" data-testid="review-requested">
          Review requested. A person will look at your answer and tell you what they decide.
        </p>
      ) : (
        <>
          <Button type="button" variant="outline" size="sm" loading={state === "sending"} onClick={() => void send()}>
            Request review
          </Button>
          <span className="text-xs text-muted-foreground">Think this answer deserves full marks? Ask a person to look.</span>
        </>
      )}
      {error && (
        <p role="alert" className="w-full text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
