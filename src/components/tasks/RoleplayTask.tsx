import { useEffect, useState } from "react";
import { CircleCheck, MessagesSquare } from "lucide-react";

import type { RoleplaySessionView } from "@shared/roleplay";

import { ApiRequestError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { roleplayApi } from "@/features/roleplay/api";
import { RoleplayChat } from "@/features/roleplay/RoleplayChat";

import type { TaskComponentProps } from "./types";

export interface RoleplayTaskProps extends TaskComponentProps<"roleplay"> {
  /** Set inside an assessment: the session belongs to this item, and the server picks its scenario. */
  assessment?: { assessmentId: string; itemId: string };
}

/**
 * A conversation with an AI client (v4.2). The conversation lives on the server; the response only
 * points at it (`sessionId`) and mirrors the transcript, so a reload resumes the same session and
 * grading always reads the server's copy.
 */
export function RoleplayTask({ task, value, onChange, readOnly, idPrefix, assessment }: RoleplayTaskProps) {
  const [session, setSession] = useState<RoleplaySessionView | null>(null);
  const [loading, setLoading] = useState(Boolean(value?.sessionId));
  const [error, setError] = useState<string | null>(null);
  const savedId = value?.sessionId ?? null;

  // Resume the conversation the saved answer points at.
  useEffect(() => {
    if (!savedId || session?.id === savedId) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    roleplayApi
      .get(savedId, controller.signal)
      .then(({ session: found }) => setSession(found))
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [savedId, session?.id]);

  const update = (next: RoleplaySessionView) => {
    setSession(next);
    onChange({ kind: "roleplay", sessionId: next.id, transcript: next.transcript, ...(next.followUpEmail ? { followUpEmail: next.followUpEmail } : {}) });
  };

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const { session: started } = await roleplayApi.start(
        assessment
          ? { context: "assessment", assessmentId: assessment.assessmentId, itemId: assessment.itemId, scenarioId: task.scenarioId }
          : { context: "practice", scenarioId: task.scenarioId, personaId: task.personaId, maxTurns: task.maxTurns },
      );
      update(started);
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "The conversation could not start. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return <RoleplayChat session={session} onSession={update} brief={task.brief} followUp={task.followUp} readOnly={readOnly} idPrefix={idPrefix} />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-surface-sunken/60 px-4 py-3">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <MessagesSquare className="size-4 text-ridge-strong" aria-hidden="true" />A conversation with a client
        </p>
        <p className="mt-2 text-sm">
          <span className="font-medium">Your brief: </span>
          {task.brief}
        </p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Up to {task.maxTurns} messages{task.followUp ? ", then a short follow-up email" : ""}
        </p>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {task.rubric.map((r) => (
            <li key={r.label} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-summit-strong" aria-hidden="true" />
              {r.label}
            </li>
          ))}
        </ul>
      </div>
      {readOnly ? (
        <p className="text-sm text-muted-foreground">{loading ? "Loading the conversation…" : "No conversation was held."}</p>
      ) : (
        <Button onClick={() => void start()} loading={loading}>
          Start the conversation
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
