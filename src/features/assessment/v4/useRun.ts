import { useState } from "react";

import { RUN_LIMIT, type RunResponse } from "@shared/assessmentV4";

import { ApiRequestError } from "@/api/client";

import { sheetApi } from "./api";
import type { RunOutput } from "./OutputPanel";

/**
 * One Run press, for a coding item or an MCQ snippet. The server counts it first (three per item,
 * enforced there); when the item runs in the browser the client then executes it locally.
 */
export function useRun({
  assessmentId,
  itemId,
  runsUsed,
  onCounted,
  onConflict,
  runLocally,
}: {
  assessmentId: string;
  itemId: string;
  runsUsed: number;
  onCounted: (response: RunResponse) => void;
  onConflict: (message: string) => void;
  runLocally: (code: string) => Promise<RunOutput>;
}) {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<RunOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (code: string) => {
    if (running || runsUsed >= RUN_LIMIT) return null;
    setRunning(true);
    setError(null);
    try {
      const response = await sheetApi.run(assessmentId, itemId, code);
      onCounted(response);
      if (response.runsOn === "browser") setOutput(await runLocally(code));
      else if (response.result) setOutput({ kind: "tests", ...response.result });
      else if (response.output) setOutput({ kind: "snippet", ...response.output });
      return response;
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "That run didn't go through. Try again.";
      setError(message);
      if (err instanceof ApiRequestError && err.status === 409) onConflict(message);
      return null;
    } finally {
      setRunning(false);
    }
  };

  return { run, running, output, error, runsLeft: Math.max(0, RUN_LIMIT - runsUsed) };
}
