import type { ItemKey, ItemPayload } from "../../../shared/assessment";
import type { ItemKind } from "../../../shared/enums";
import type { CodeSandbox } from "../sandbox";
import { normaliseOutput } from "./validateItem";

/**
 * Auto-scoring during the test (brief §9.4).
 *
 * Returns 0..1, or null for an item that cannot be scored yet — `explain`, which is graded
 * against its rubric by the evaluation job.
 *
 * The learner is never told the result. This score only drives the adaptive staircase; telling
 * them would turn the test into a search for the level at which they stop being told "wrong".
 */
export interface ItemResponse {
  /** mcq, multi, find_bug: chosen original option indices. */
  selected?: number[];
  /** predict_output: what they think it prints. */
  text?: string;
  /** code: the submitted source. */
  code?: string;
}

export async function autoScoreItem(
  kind: ItemKind,
  payload: ItemPayload,
  key: ItemKey,
  response: ItemResponse,
  sandbox: CodeSandbox,
): Promise<number | null> {
  switch (kind) {
    case "mcq":
    case "find_bug": {
      const correct = key.correctIndices ?? [];
      const chosen = response.selected ?? [];
      return chosen.length === 1 && correct.includes(chosen[0]) ? 1 : 0;
    }

    case "multi": {
      // All-or-nothing, as elsewhere in the platform: partial credit would let someone who
      // selects everything score well on every multi-select item.
      const correct = [...(key.correctIndices ?? [])].sort((a, b) => a - b);
      const chosen = [...new Set(response.selected ?? [])].sort((a, b) => a - b);
      return chosen.length === correct.length && chosen.every((value, i) => value === correct[i]) ? 1 : 0;
    }

    case "predict_output": {
      if (key.expectedOutput === undefined) return 0;
      return normaliseOutput(response.text ?? "") === normaliseOutput(key.expectedOutput) ? 1 : 0;
    }

    case "code": {
      const tests = [...(payload.visibleTests ?? []), ...(key.hiddenTests ?? [])];
      if (tests.length === 0 || !payload.functionName) return 0;
      const run = await sandbox.run({ code: response.code ?? "", functionName: payload.functionName, testCases: tests });
      // Proportional here, unlike the curriculum's code challenges: the staircase needs to tell
      // "nearly right" from "no idea", and §9.4 treats 0.5 or more as a pass for stepping up.
      return run.total === 0 ? 0 : run.passedCount / run.total;
    }

    case "explain":
      return null;
  }
}

/** Whether a response is present at all, so a skipped item is not scored as a wrong answer. */
export function hasResponse(kind: ItemKind, response: ItemResponse): boolean {
  switch (kind) {
    case "mcq":
    case "multi":
    case "find_bug":
      return (response.selected?.length ?? 0) > 0;
    case "predict_output":
      return (response.text ?? "").trim().length > 0;
    case "code":
      return (response.code ?? "").trim().length > 0;
    case "explain":
      return (response.text ?? "").trim().length > 0;
  }
}
