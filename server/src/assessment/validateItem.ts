import {
  generatedItemSchema,
  TIME_LIMIT_SEC,
  type GeneratedItem,
  type ItemKey,
  type ItemPayload,
} from "../../../shared/assessment";
import type { CodeSandbox } from "../sandbox";

/**
 * Server-side validation of a generated item (brief §9.2 steps 4-5).
 *
 * `splitItemBatch` handles the shape, one element at a time, so that a batch with a bad item in it
 * loses the item rather than the batch. Everything after it is the semantic rules: does the kind match
 * the fields it carries, are its topic tags real, and — for code items — does the reference
 * solution actually pass while the starter code actually fails. An item that fails any of these
 * is dropped with a reason the admin can read, rather than silently reaching a real assessment.
 */

/**
 * Why an item was rejected, as a fixed tag.
 *
 * The prose `reason` beside it is written for the pool preview, which already shows answer keys,
 * so it is free to quote the expected output or the critic's own answer. Anywhere a key must not
 * go — the generation log the admin watches — carries this tag instead. A closed union, not a
 * string, so a new rejection has to be named deliberately rather than smuggling content along.
 */
export type RejectionCode =
  | "schema-invalid"
  | "unknown-topics"
  | "too-few-options"
  | "duplicate-options"
  | "no-correct-option"
  | "correct-index-out-of-range"
  | "every-option-correct"
  | "multi-needs-two-correct"
  | "needs-one-correct-option"
  | "prompt-names-option-positions"
  | "missing-expected-output"
  | "empty-expected-output"
  | "rubric-too-short"
  | "rubric-weights"
  | "bad-function-name"
  | "starter-missing-function"
  | "missing-reference-solution"
  | "too-few-visible-tests"
  | "too-few-hidden-tests"
  | "tests-not-plain-data"
  | "reference-does-not-run"
  | "reference-timed-out"
  | "reference-fails-tests"
  | "starter-already-passes";

export interface Rejection {
  ok: false;
  code: RejectionCode;
  reason: string;
}

/** One element of a batch that did not match `generatedItemSchema`, kept for the drop path. */
export interface MalformedItem {
  /** Where it sat in the batch, so a log line points at the same item the model numbered. */
  index: number;
  /**
   * Which fields were wrong — `items.14.rationale` — and nothing else.
   *
   * This is the part that may reach the generation log. A zod message can quote the value it
   * received, and the values here are correct answers, rationales and reference solutions.
   */
  paths: string[];
  /** Zod's own account, for the stored row the pool preview shows to an admin who may see keys. */
  detail: string;
  /** Whatever of the shape survived, for a row that has to name a kind and a difficulty. */
  raw: Record<string, unknown>;
}

/**
 * Splits a leniently-parsed batch into the items that match the schema and the ones that do not.
 *
 * A batch is parsed with `looseItemBatchSchema` and then comes here, rather than being parsed
 * strictly in one go, because a strict array parse is all-or-nothing: one item missing its
 * `rationale` used to discard the nineteen good items beside it, fail the retry on another single
 * bad item, and take the whole generation down with it. Everything downstream of this function
 * already knows how to drop an item it cannot use and carry on — this is what lets a malformed
 * item reach that machinery instead of dying in the parse.
 */
export function splitItemBatch(elements: readonly unknown[]): { items: GeneratedItem[]; malformed: MalformedItem[] } {
  const items: GeneratedItem[] = [];
  const malformed: MalformedItem[] = [];

  for (const [index, element] of elements.entries()) {
    const parsed = generatedItemSchema.safeParse(element);
    if (parsed.success) {
      items.push(parsed.data);
      continue;
    }

    malformed.push({
      index,
      paths: [
        ...new Set(
          parsed.error.issues.map(
            (issue) => `items.${index}${issue.path.length ? `.${issue.path.map(String).join(".")}` : ""}`,
          ),
        ),
      ],
      detail: `The model's item did not match the schema: ${parsed.error.issues
        .map((issue) => `${issue.path.map(String).join(".") || "(item)"}: ${issue.message}`)
        .join("; ")}`,
      raw: element !== null && typeof element === "object" ? (element as Record<string, unknown>) : {},
    });
  }

  return { items, malformed };
}

export type ValidationResult = { ok: true; payload: ItemPayload; key: ItemKey; topicIds: string[] } | Rejection;

const reject = (code: RejectionCode, reason: string): Rejection => ({ ok: false, code, reason });

export function validateGeneratedItem(item: GeneratedItem, knownTopicIds: ReadonlySet<string>): ValidationResult {
  const topicIds = item.topicIds.filter((id) => knownTopicIds.has(id));
  if (topicIds.length === 0) {
    return reject("unknown-topics", `Tagged with topic ids that are not in the curriculum: ${item.topicIds.join(", ")}`);
  }

  const timeLimitSec = TIME_LIMIT_SEC[item.kind];

  switch (item.kind) {
    case "mcq":
    case "multi":
    case "find_bug": {
      if (!item.options || item.options.length < 3) return reject("too-few-options", "Needs at least three options.");
      if (new Set(item.options.map((o) => o.trim().toLowerCase())).size !== item.options.length) {
        return reject("duplicate-options", "Has duplicate options.");
      }
      const correct = [...new Set(item.correctIndices ?? [])].sort((a, b) => a - b);
      if (correct.length === 0) return reject("no-correct-option", "No correct option was marked.");
      if (correct.some((i) => i >= item.options!.length)) {
        return reject("correct-index-out-of-range", "A correct index is out of range.");
      }
      if (correct.length >= item.options.length) return reject("every-option-correct", "Every option is marked correct.");

      if (item.kind === "multi" && correct.length < 2) {
        return reject("multi-needs-two-correct", "A multi-select item needs two or more correct options.");
      }
      if (item.kind !== "multi" && correct.length !== 1) {
        return reject("needs-one-correct-option", `A ${item.kind} item needs exactly one correct option.`);
      }
      // Options are shuffled before display, so a prompt that names a position is unanswerable.
      if (/\b(option|answer)s?\s+[A-D]\b|\bthe (first|second|third|fourth|last) option\b/i.test(item.prompt)) {
        return reject("prompt-names-option-positions", "The prompt refers to option positions, but options are shuffled.");
      }

      return {
        ok: true,
        topicIds,
        payload: { prompt: item.prompt, options: item.options, ...(item.language ? { language: item.language } : {}), timeLimitSec },
        key: { correctIndices: correct, rationale: item.rationale },
      };
    }

    case "predict_output": {
      if (item.expectedOutput === undefined) return reject("missing-expected-output", "No expected output was given.");
      if (item.expectedOutput.trim().length === 0) return reject("empty-expected-output", "The expected output is empty.");
      return {
        ok: true,
        topicIds,
        payload: { prompt: item.prompt, ...(item.language ? { language: item.language } : {}), timeLimitSec },
        key: { expectedOutput: normaliseOutput(item.expectedOutput), rationale: item.rationale },
      };
    }

    case "explain": {
      if (!item.rubric || item.rubric.length < 2) {
        return reject("rubric-too-short", "An explain item needs a rubric of at least two points.");
      }
      const weight = item.rubric.reduce((sum, point) => sum + point.weight, 0);
      if (weight < 0.5 || weight > 2) {
        return reject("rubric-weights", `Rubric weights sum to ${weight.toFixed(2)}; they should sum to about 1.`);
      }
      return {
        ok: true,
        topicIds,
        payload: { prompt: item.prompt, maxChars: item.maxChars ?? 1200, timeLimitSec },
        key: { rubric: item.rubric, rationale: item.rationale },
      };
    }

    case "code": {
      if (!item.functionName || !/^[A-Za-z_$][\w$]*$/.test(item.functionName)) {
        return reject("bad-function-name", "The function name is missing or is not a valid identifier.");
      }
      if (!item.starterCode?.includes(item.functionName)) {
        return reject("starter-missing-function", `The starter code does not declare ${item.functionName}.`);
      }
      if (!item.referenceSolution) return reject("missing-reference-solution", "No reference solution was given.");
      const visible = item.visibleTests ?? [];
      const hidden = item.hiddenTests ?? [];
      if (visible.length < 2) return reject("too-few-visible-tests", "Needs at least two visible tests.");
      if (hidden.length < 2) return reject("too-few-hidden-tests", "Needs at least two hidden tests.");
      if (!isPlainData([...visible, ...hidden])) {
        return reject("tests-not-plain-data", "Test arguments or expected values are not plain JSON data.");
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
): Promise<{ ok: true } | Rejection> {
  const testCases = [...(payload.visibleTests ?? []), ...(key.hiddenTests ?? [])];
  if (!key.referenceSolution || !payload.functionName) {
    return reject("missing-reference-solution", "Missing reference solution.");
  }

  const solution = await sandbox.run({ code: key.referenceSolution, functionName: payload.functionName, testCases });
  if (solution.compileError) {
    return reject("reference-does-not-run", `The reference solution does not run: ${solution.compileError}`);
  }
  if (solution.timedOut) return reject("reference-timed-out", "The reference solution timed out.");
  if (solution.passedCount !== testCases.length) {
    const failed = solution.outcomes.filter((o) => !o.passed);
    const first = failed[0];
    return reject(
      "reference-fails-tests",
      `The reference solution fails ${failed.length} of ${testCases.length} tests${
        first ? ` (expected ${first.expected}, got ${first.actual ?? first.error})` : ""
      }.`,
    );
  }

  const starter = await sandbox.run({ code: payload.starterCode ?? "", functionName: payload.functionName, testCases });
  if (!starter.compileError && !starter.timedOut && starter.passedCount === testCases.length) {
    return reject("starter-already-passes", "The starter code already passes every test, so the item asks for nothing.");
  }

  return { ok: true };
}
