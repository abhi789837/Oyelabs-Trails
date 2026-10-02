/**
 * Validates question-bank seed files and records which items may go live.
 *
 *   npx tsx scripts/bank/validate.ts                       # every file
 *   npx tsx scripts/bank/validate.ts server/bank/engineering/eng-react.json [more files]
 *
 * For each item: the schema; task answer integrity (`checkTask`); MCQ answer in range; and for
 * coding items, the reference solution must pass **every** sample and hidden test while the starter
 * code must **not** pass every hidden test (a starter that already passes tests nothing). Passing
 * items are written to `<file>.validated.json` with a content hash; boot marks only those `active`.
 *
 * JS/TS run in a worker sandbox (seed content is ours, so the trust boundary is not needed here);
 * every other language runs in Piston at PISTON_URL (default http://127.0.0.1:2000).
 * Exit code 1 when any item fails, with one line per failure.
 */
import fs from "node:fs";
import path from "node:path";

import { bankItemSchema, type BankItem } from "../../shared/bank";
import { validateBankItem } from "../../server/src/bank/validate";
import { itemHash } from "../../server/src/bank/repo";
import { PistonClient } from "../../server/src/sandbox/polyglot";
import { WorkerSandbox } from "../../server/src/sandbox/workerSandbox";

const root = path.resolve(import.meta.dirname, "../..");
const bankDir = path.join(root, "server/bank");
const piston = new PistonClient({ url: process.env.PISTON_URL ?? "http://127.0.0.1:2000" });
const sandbox = new WorkerSandbox();

function seedFiles(args: string[]): string[] {
  if (args.length) return args.map((a) => path.resolve(a));
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith(".json") && !e.name.endsWith(".validated.json")) out.push(full);
    }
  };
  walk(bankDir);
  return out;
}

async function validateItem(item: BankItem): Promise<string[]> {
  return validateBankItem({ sandbox, piston }, item);
}

const files = seedFiles(process.argv.slice(2));
let failures = 0;
let passed = 0;
for (const file of files) {
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as unknown[];
  const sidecar = file.replace(/\.json$/, ".validated.json");
  const manifest: Record<string, string> = {};
  const ids = new Set<string>();
  for (const [index, value] of raw.entries()) {
    const parsed = bankItemSchema.safeParse(value);
    const where = `${path.relative(root, file)}[${index}]`;
    if (!parsed.success) {
      failures += 1;
      console.log(`FAIL ${where}: ${parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
      continue;
    }
    const item = parsed.data;
    if (ids.has(item.id)) {
      failures += 1;
      console.log(`FAIL ${where} ${item.id}: duplicate id`);
      continue;
    }
    ids.add(item.id);
    const problems = await validateItem(item).catch((error: unknown) => [`could not run: ${error instanceof Error ? error.message : String(error)}`]);
    if (problems.length) {
      failures += 1;
      console.log(`FAIL ${where} ${item.id}: ${problems.join(" | ")}`);
    } else {
      manifest[item.id] = itemHash(item);
      passed += 1;
    }
  }
  fs.writeFileSync(sidecar, `${JSON.stringify(manifest, null, 2)}\n`);
}
await sandbox.dispose?.();
console.log(`${passed} item(s) valid, ${failures} failed, across ${files.length} file(s).`);
process.exit(failures ? 1 : 0);
