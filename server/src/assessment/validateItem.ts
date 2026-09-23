import { TIME_LIMIT_SEC, type GeneratedItem, type ItemKey, type ItemPayload } from "../../../shared/assessment";
import type { CodeSandbox } from "../sandbox";

/**
 * Server-side validation of a generated item (brief §9.2 steps 4-5).
 *
 * The zod schema only proves the shape. These are the semantic rules: does the item's kind match
 * the fields it carries, are its topic tags real, and — for code items — does the reference
 * solution actually pass while the starter code actually fails. An item that fails any of these
 * is dropped with a reason the admin can read, rather than silently reaching a real assessment.
 */

export type ValidationResult =
  | { ok: true; payload: ItemPayload; key: ItemKey; topicIds: string[] }
  | { ok: false; reason: string };

export function validateGeneratedItem(item: GeneratedItem, knownTopicIds: ReadonlySet<string>): ValidationResult {
  const topicIds = item.topicIds.filter((id) => knownTopicIds.has(id));
  if (topicIds.length === 0) {
    return { ok: false, reason: `Tagged with topic ids that are not in the curriculum: ${item.topicIds.join(", ")}` };
  }

  const timeLimitSec = TIME_LIMIT_SEC[item.kind];

  switch (item.kind) {
    case "mcq":
    case "multi":
    case "find_bug": {
      if (!item.options || item.options.length < 3) return { ok: false, reason: "Needs at least three options." };
      if (new Set(item.options.map((o) => o.trim().toLowerCase())).size !== item.options.length) {
        return { ok: false, reason: "Has duplicate options." };
      }
      const correct = [...new Set(item.correctIndices ?? [])].sort((a, b) => a - b);
      if (correct.length === 0) return { ok: false, reason: "No correct option was marked." };
      if (correct.some((i) => i >= item.options!.length)) return { ok: false, reason: "A correct index is out of range." };
      if (correct.length >= item.options.length) return { ok: false, reason: "Every option is marked correct." };

      if (item.kind === "multi" && correct.length < 2) {
        return { ok: false, reason: "A multi-select item needs two or more correct options." };
      }
      if (item.kind !== "multi" && correct.length !== 1) {
        return { ok: false, reason: `A ${item.kind} item needs exactly one correct option.` };
      }
      // Options are shuffled before display, so a prompt that names a position is unanswerable.
      if (/\b(option|answer)s?\s+[A-D]\b|\bthe (first|second|third|fourth|last) option\b/i.test(item.prompt)) {
        return { ok: false, reason: "The prompt refers to option positions, but options are shuffled." };
      }

      return {
        ok: true,
        topicIds,
        payload: { prompt: item.prompt, options: item.options, ...(item.language ? { language: item.language } : {}), timeLimitSec },
        key: { correctIndices: correct, rationale: item.rationale },
      };
    }

    case "predict_output": {
      if (item.expectedOutput === undefined) return { ok: false, reason: "No expected output was given." };
      if (item.expectedOutput.trim().length === 0) return { ok: false, reason: "The expected output is empty." };
      return {
        ok: true,
        topicIds,
        payload: { prompt: item.prompt, ...(item.language ? { language: item.language } : {}), timeLimitSec },
        key: { expectedOutput: normaliseOutput(item.expectedOutput), rationale: item.rationale },
      };
    }

    case "explain": {
      if (!item.rubric || item.rubric.length < 2) return { ok: false, reason: "An explain item needs a rubric of at least two points." };
      const weight = item.rubric.reduce((sum, point) => sum + point.weight, 0);
      if (weight < 0.5 || weight > 2) return { ok: false, reason: `Rubric weights sum to ${weight.toFixed(2)}; they should sum to about 1.` };
      return {
        ok: true,
        topicIds,
        payload: { prompt: item.prompt, maxChars: item.maxChars ?? 1200, timeLimitSec },
        key: { rubric: item.rubric, rationale: item.rationale },
      };
    }

    case "code": {
      if (!item.functionName || !/^[A-Za-z_$][\w$]*$/.test(item.functionName)) {
        return { ok: false, reason: "The function name is missing or is not a valid identifier." };
      }
      if (!item.starterCode?.includes(item.functionName)) {
        return { ok: false, reason: `The starter code does not declare ${item.functionName}.` };
      }
      if (!item.referenceSolution) return { ok: false, reason: "No reference solution was given." };
      const visible = item.visibleTests ?? [];
      const hidden = item.hiddenTests ?? [];
      if (visible.length < 2) return { ok: false, reason: "Needs at least two visible tests." };
      if (hidden.length < 2) return { ok: false, reason: "Needs at least two hidden tests." };
      if (!isPlainData([...visible, ...hidden])) {
        return { ok: false, reason: "Test arguments or expected values are not plain JSON data." };
      }

      return {
        ok: true,
        topicIds,
        payload: {
          prompt: item.prompt,
          language: item.language ?? "javascript",
          starterCode: item.starterCode,
          functionName: item.functionName,
          visibleTests: visible,
          timeLimitSec,
        },
        key: { hiddenTests: hidden, referenceSolution: item.referenceSolution, rationale: item.rationale },
      };
    }
  }
}

/**
 * The brief requires a normalisation rule for `predict_output` (§9.2): trim, and collapse runs of
 * whitespace. Otherwise a correct answer fails on an extra space, and the item measures typing.
 */
export function normaliseOutput(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .join("\n")
    .trim();
}

function isPlainData(tests: { args: unknown[]; expected: unknown }[]): boolean {
  const check = (value: unknown): boolean => {
    if (value === null) return true;
    const type = typeof value;
    if (type === "string" || type === "number" || type === "boolean") return true;
    if (Array.isArray(value)) return value.every(check);
    if (type === "object") return Object.values(value as object).every(check);
    return false;
  };
  return tests.every((test) => test.args.every(check) && check(test.expected));
}

/**
 * Runs a code item's reference solution against every test, and the untouched starter code too.
 *
 * Both halves matter. A reference solution that fails means the item is simply wrong; a starter
 * that already passes means the item asks for nothing (§9.2 step 5).
 */
export async function verifyCodeItem(
  payload: ItemPayload,
  key: ItemKey,
  sandbox: CodeSandbox,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const testCases = [...(payload.visibleTests ?? []), ...(key.hiddenTests ?? [])];
  if (!key.referenceSolution || !payload.functionName) return { ok: false, reason: "Missing reference solution." };

  const solution = await sandbox.run({ code: key.referenceSolution, functionName: payload.functionName, testCases });
  if (solution.compileError) return { ok: false, reason: `The reference solution does not run: ${solution.compileError}` };
  if (solution.timedOut) return { ok: false, reason: "The reference solution timed out." };
  if (solution.passedCount !== testCases.length) {
    const failed = solution.outcomes.filter((o) => !o.passed);
    const first = failed[0];
    return {
      ok: false,
      reason: `The reference solution fails ${failed.length} of ${testCases.length} tests${
        first ? ` (expected ${first.expected}, got ${first.actual ?? first.error})` : ""
      }.`,
    };
  }

  const starter = await sandbox.run({ code: payload.starterCode ?? "", functionName: payload.functionName, testCases });
  if (!starter.compileError && !starter.timedOut && starter.passedCount === testCases.length) {
    return { ok: false, reason: "The starter code already passes every test, so the item asks for nothing." };
  }

  return { ok: true };
}
