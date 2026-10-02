import { parseTests, type BankItem } from "../../../shared/bank";
import { checkTask } from "../../../shared/tasks";
import { runTests, type PolyglotDeps } from "../sandbox/polyglot";

/**
 * Whether a bank item may go live. Shared by the seed validator script, the admin editor and the
 * gap-fill job, so "validated" means the same thing everywhere:
 *
 * - tasks: answers refer to things that exist (`checkTask`);
 * - MCQs: no duplicate options;
 * - coding: the reference solution passes **every** sample and hidden test, and the starter code
 *   does **not** pass every hidden test (a starter that already passes tests nothing).
 */
export async function validateBankItem(deps: PolyglotDeps, item: BankItem): Promise<string[]> {
  const problems: string[] = [];
  if (item.type === "task" && item.task) problems.push(...checkTask(item.task));
  if (item.type === "mcq" && item.mcq && new Set(item.mcq.options).size !== item.mcq.options.length) problems.push("duplicate options");
  if (item.type === "coding" && item.coding) {
    const c = item.coding;
    let samples;
    let hidden;
    try {
      samples = parseTests(c.mode, c.sampleTests);
      hidden = parseTests(c.mode, c.hiddenTests);
    } catch (error) {
      return [`tests do not match mode ${c.mode}: ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`];
    }
    const reference = await runTests(deps, { language: c.language, mode: c.mode, functionName: c.functionName, code: c.referenceSolution, tests: [...samples, ...hidden], timeoutMs: 3000 });
    if (reference.compileError) problems.push(`reference does not compile: ${reference.compileError.slice(0, 200)}`);
    else if (reference.passedCount !== reference.total) {
      const failed = reference.outcomes.filter((o) => !o.passed).slice(0, 2);
      problems.push(
        `reference passes ${reference.passedCount}/${reference.total}: ${failed
          .map((o) => `#${o.index} expected ${o.expected} got ${o.actual ?? o.error}`)
          .join("; ")
          .slice(0, 300)}`,
      );
    }
    const starter = await runTests(deps, { language: c.language, mode: c.mode, functionName: c.functionName, code: c.starterCode, tests: hidden, timeoutMs: 3000 });
    if (!starter.compileError && starter.passedCount === starter.total) problems.push("starter code already passes every hidden test");
  }
  return problems;
}
