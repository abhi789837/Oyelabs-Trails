import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import { describe, expect, test } from "vitest";

import { TASK_DEFAULTS } from "@shared/aiRouting";
import { PART_LABELS } from "@shared/builder";
import { LEVEL_BAND_LABELS } from "@shared/catalog";
import { EXPERIENCE_LABELS, SLIDER_LABELS, BUCKET_LABELS } from "@shared/setup";
import { TARGET_LEVEL_LABELS } from "@shared/goals";
import { HANDBOOK_STATUS_LABELS, TERM_CATEGORY_LABELS } from "@shared/handbook";
import { INTENT_TYPE_LABELS } from "@shared/intents";
import { PERSONALISATION_LABELS } from "@shared/personalise";
import { SCORING_MODE_LABELS, VERDICT_LABELS } from "@shared/scoring";
import { PRIORITY_LABELS } from "@shared/targets";
import { TASK_KIND_LABELS } from "@shared/tasks";

/**
 * v4.4 Phase 6: the copy guide (docs/v4.4/COPY_GUIDE.md), enforced.
 *
 * Admin-facing words must not use the engineering terms an admin should never have to learn:
 * blueprint, slot, mastery, prerequisite, topological, intent extraction, bank, rubric,
 * calibration, token, model, slider value, CEFR, core/edge tests. The scan reads the code, not the
 * screen: string literals, template text and JSX text in `src/features/admin/**`, the shared label
 * maps the admin screens show, `shared/nextAction.ts`, the server's error messages from admin
 * routes and the notifications it writes for staff.
 *
 * Not copy, so not scanned: imports, comments, identifiers, object keys, type literals, CSS class
 * strings, route paths and URLs, values compared against (`kind === "bank"`), and the values of
 * data-ish properties and attributes (`key`, `id`, `queryKey`, `value`, ...).
 *
 * A line may opt out with `// copy-ok: <reason>` (or `{/* copy-ok: <reason> *\/}`) on the line
 * above, for technical data shown inside a collapsed "Show details" (a model id, say).
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export const BANNED = [
  "blueprints?",
  "slots?",
  "mastery",
  "prerequisite graphs?",
  "prerequisites?",
  "topological(?:ly)?",
  "intent extraction",
  "banks?",
  "rubrics?",
  "calibrations?",
  "calibrat(?:e|ed|ing)",
  "slider values?",
  "tokens?",
  "models?",
  "cefr",
  "core tests?",
  "edge tests?",
];
const BANNED_RE = new RegExp(`(?<![\\w-])(${BANNED.join("|")})(?![\\w-])`, "gi");

/** Every banned word in a piece of copy, lower-cased. */
export function bannedIn(text: string): string[] {
  return [...text.matchAll(BANNED_RE)].map((m) => m[1]!.toLowerCase());
}

/** Properties and JSX attributes whose value is data, not words a person reads. */
const DATA_KEYS = new Set([
  "className",
  "class",
  "key",
  "id",
  "to",
  "href",
  "src",
  "path",
  "url",
  "link",
  "queryKey",
  "mutationKey",
  "kind",
  "type",
  "status",
  "value",
  "defaultValue",
  "name",
  "htmlFor",
  "role",
  "method",
  "mode",
  "tab",
  "variant",
  "size",
  "icon",
  "schemaName",
  "task",
  "purpose",
  "model",
  "action",
  "targetType",
  "autoComplete",
  "inputMode",
  "accept",
  "target",
  "rel",
  "form",
  "lang",
  "dir",
  "sort",
  "field",
  "accessor",
  "column",
  "format",
  "group",
  "source",
  "tier",
  "testId",
  "data-testid",
]);

/** Calls whose string arguments are data: classes, URLs, string tests, storage keys. */
const DATA_CALLS = new Set([
  "cn",
  "clsx",
  "cva",
  "twMerge",
  "navigate",
  "fetch",
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "del",
  "has",
  "set",
  "getItem",
  "setItem",
  "removeItem",
  "startsWith",
  "endsWith",
  "includes",
  "indexOf",
  "split",
  "replace",
  "replaceAll",
  "match",
  "test",
  "querySelector",
  "querySelectorAll",
  "addEventListener",
  "removeEventListener",
  "getElementById",
  "createElement",
  "useSearchParams",
  "invalidateQueries",
  "localeCompare",
  "toLocaleString",
  "Intl.NumberFormat",
  "DateTimeFormat",
  "NumberFormat",
  "join",
  "padStart",
]);

export interface CopyHit {
  file: string;
  line: number;
  text: string;
  words: string[];
}

function exemptLines(source: string): Set<number> {
  const lines = source.split(/\r?\n/);
  const exempt = new Set<number>();
  lines.forEach((line, index) => {
    if (/copy-ok:\s*\S/.test(line)) {
      exempt.add(index + 2); // the next line, 1-based
      // A comment on a line of its own exempts the next line; trailing ones also exempt their own.
      exempt.add(index + 1);
    }
  });
  return exempt;
}

function propertyNameText(name: ts.PropertyName | ts.JsxAttributeName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) return name.text;
  if (ts.isJsxNamespacedName(name)) return `${name.namespace.text}:${name.name.text}`;
  return null;
}

function calleeName(expression: ts.Expression): string | null {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return null;
}

/** Looks like a path, URL, class list or identifier rather than words. */
function looksLikeData(text: string): boolean {
  const t = text.trim();
  if (t === "") return true;
  if (/^(\/|https?:|mailto:|data:|#|\.\/|\.\.\/)/.test(t)) return true;
  if (t.includes("/api/")) return true;
  // One token with a dot, underscore, colon or camelCase: an id, a key, an audit action.
  if (!/\s/.test(t) && (/[._:=]/.test(t) || /[a-z][A-Z]/.test(t))) return true;
  // A Tailwind class list: several tokens, each with a dash or a colon, no capital letters.
  if (/\s/.test(t) && !/[A-Z]/.test(t) && t.split(/\s+/).every((w) => /[-:]/.test(w) || /^(flex|grid|block|hidden|inline|relative|absolute|sticky|fixed|truncate|underline|italic|uppercase|border|rounded|shadow|grow|shrink|transition|container|sr-only|contents)$/.test(w))) return true;
  return false;
}

/** Whether a string literal sits where its value is data (see the module doc). */
function isDataPosition(node: ts.Node): boolean {
  let child: ts.Node = node;
  let parent: ts.Node | undefined = node.parent;
  while (parent) {
    if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isExternalModuleReference(parent) || ts.isImportTypeNode(parent)) return true;
    if (ts.isLiteralTypeNode(parent) || ts.isTypeNode(parent)) return true;
    if (ts.isPropertyAssignment(parent)) {
      if (parent.name === child) return true;
      const key = propertyNameText(parent.name);
      return key !== null && DATA_KEYS.has(key);
    }
    if (ts.isShorthandPropertyAssignment(parent)) return true;
    if (ts.isJsxAttribute(parent)) {
      const key = propertyNameText(parent.name);
      return key !== null && (DATA_KEYS.has(key) || key.startsWith("data-"));
    }
    if (ts.isElementAccessExpression(parent)) return parent.argumentExpression === child;
    if (ts.isCaseClause(parent)) return parent.expression === child;
    if (ts.isBinaryExpression(parent)) {
      const op = parent.operatorToken.kind;
      if (
        op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
        op === ts.SyntaxKind.EqualsEqualsToken ||
        op === ts.SyntaxKind.ExclamationEqualsToken ||
        op === ts.SyntaxKind.InKeyword
      )
        return true;
    }
    if (ts.isCallExpression(parent) || ts.isNewExpression(parent)) {
      if (parent.expression.kind === ts.SyntaxKind.ImportKeyword) return true;
      const name = calleeName(parent.expression);
      if (name === "require") return true;
      return name !== null && DATA_CALLS.has(name);
    }
    if (ts.isTaggedTemplateExpression(parent)) return true;
    // Keep walking through wrappers that pass a value along unchanged.
    if (
      ts.isArrayLiteralExpression(parent) ||
      ts.isParenthesizedExpression(parent) ||
      ts.isConditionalExpression(parent) ||
      ts.isAsExpression(parent) ||
      ts.isSatisfiesExpression(parent) ||
      ts.isTemplateSpan(parent) ||
      ts.isTemplateExpression(parent) ||
      ts.isBinaryExpression(parent) ||
      ts.isJsxExpression(parent) ||
      ts.isSpreadElement(parent)
    ) {
      child = parent;
      parent = parent.parent;
      continue;
    }
    return false;
  }
  return false;
}

/** Strings, template text and JSX text in one file that a person reads. */
export function copyIn(file: string, source: string): { line: number; text: string }[] {
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const exempt = exemptLines(source);
  const out: { line: number; text: string }[] = [];
  const push = (node: ts.Node, text: string) => {
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
    if (exempt.has(line)) return;
    out.push({ line, text });
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      if (node.text.trim()) push(node, node.text.trim());
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!isDataPosition(node) && !looksLikeData(node.text)) push(node, node.text);
    } else if (ts.isTemplateExpression(node)) {
      const text = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(" … ");
      if (!isDataPosition(node) && !looksLikeData(node.head.text + "x")) push(node, text);
      // Spans may hold strings of their own.
      node.templateSpans.forEach((s) => visit(s.expression));
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

function walk(dir: string, accept: (file: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, accept));
    else if (accept(full)) files.push(full);
  }
  return files;
}

const isSource = (f: string) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.endsWith(".d.ts");

function hitsIn(files: readonly string[], pick: (file: string, source: string) => { line: number; text: string }[]): CopyHit[] {
  const hits: CopyHit[] = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const { line, text } of pick(file, source)) {
      const words = bannedIn(text);
      if (words.length) hits.push({ file: path.relative(root, file).replace(/\\/g, "/"), line, text: text.slice(0, 140), words });
    }
  }
  return hits;
}

/** Server text an admin reads: error messages thrown from admin routes and staff notifications. */
function serverCopyIn(file: string, source: string): { line: number; text: string }[] {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const exempt = exemptLines(source);
  const out: { line: number; text: string }[] = [];
  const ERRORS = new Set(["badRequest", "notFound", "conflict", "forbidden", "locked", "internal", "HttpError", "unprocessable"]);
  const textOf = (node: ts.Node): string | null => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(" … ");
    return null;
  };
  const push = (node: ts.Node) => {
    const text = textOf(node);
    if (text === null) return;
    const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
    if (!exempt.has(line)) out.push({ line, text });
  };
  const visit = (node: ts.Node) => {
    if ((ts.isCallExpression(node) || ts.isNewExpression(node)) && node.arguments) {
      const name = calleeName(node.expression);
      if (name && ERRORS.has(name)) node.arguments.forEach(push);
      if (name === "notify") {
        for (const arg of node.arguments) {
          if (!ts.isObjectLiteralExpression(arg)) continue;
          for (const prop of arg.properties) {
            if (ts.isPropertyAssignment(prop) && ["title", "body"].includes(propertyNameText(prop.name) ?? "")) push(prop.initializer);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

const SHARED_LABEL_MAPS: Record<string, unknown> = {
  TASK_DEFAULTS: Object.fromEntries(Object.entries(TASK_DEFAULTS).map(([k, v]) => [k, { label: v.label, note: v.note }])),
  SLIDER_LABELS,
  TARGET_LEVEL_LABELS,
  TASK_KIND_LABELS,
  PART_LABELS,
  LEVEL_BAND_LABELS,
  EXPERIENCE_LABELS,
  BUCKET_LABELS,
  HANDBOOK_STATUS_LABELS,
  TERM_CATEGORY_LABELS,
  INTENT_TYPE_LABELS,
  PERSONALISATION_LABELS,
  SCORING_MODE_LABELS,
  VERDICT_LABELS,
  PRIORITY_LABELS,
};

function labelHits(): CopyHit[] {
  const hits: CopyHit[] = [];
  const visit = (where: string, value: unknown) => {
    if (typeof value === "string") {
      const words = bannedIn(value);
      if (words.length) hits.push({ file: `shared label map ${where}`, line: 0, text: value, words });
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) visit(`${where}.${k}`, v);
    }
  };
  for (const [name, map] of Object.entries(SHARED_LABEL_MAPS)) visit(name, map);
  return hits;
}

export function allCopyHits(): CopyHit[] {
  const admin = walk(path.join(root, "src/features/admin"), isSource);
  const sharedCopy = [path.join(root, "shared/nextAction.ts")];
  const serverDirs = ["server/src/routes/admin", "server/src/setup", "server/src/goals", "server/src/builder", "server/src/assessment", "server/src/speech", "server/src/handbook", "server/src/plans", "server/src/jobs", "server/src/courses"];
  const server = serverDirs.flatMap((d) => walk(path.join(root, d), isSource));
  return [...hitsIn(admin, copyIn), ...hitsIn(sharedCopy, copyIn), ...hitsIn(server, serverCopyIn), ...labelHits()];
}

describe("copy guide: banned words in admin copy", () => {
  test("the matcher finds whole words and plurals, case-insensitive, and nothing inside other words", () => {
    expect(bannedIn("Question Bank")).toEqual(["bank"]);
    expect(bannedIn("AI models and tokens")).toEqual(["models", "tokens"]);
    expect(bannedIn("CEFR level B2")).toEqual(["cefr"]);
    expect(bannedIn("the prerequisite graph")).toEqual(["prerequisite graph"]);
    expect(bannedIn("Slot 3 of the blueprint")).toEqual(["slot", "blueprint"]);
    expect(bannedIn("Banking, modelling, tokenizer, slotted")).toEqual([]);
    expect(bannedIn("Question library")).toEqual([]);
    expect(bannedIn("main checks and extra checks")).toEqual([]);
  });

  test("the scanner skips imports, keys, comparisons, class strings and paths, and honours copy-ok", () => {
    const source = [
      'import { bank } from "./bank";',
      "// the model is not copy",
      'const a = { bank: "x", queryKey: ["admin", "bank"], label: "Question bank" };',
      'if (kind === "model") go("/admin/bank");',
      'const el = <div className="bank-row">Pick a model</div>;',
      "// copy-ok: model id shown as data inside Show details",
      'const b = "claude-model-id model";',
      'const c = `${n} tokens used`;',
    ].join("\n");
    const found = copyIn("x.tsx", source).filter((c) => bannedIn(c.text).length > 0);
    expect(found.map((c) => c.line)).toEqual([3, 5, 8]);
  });

  test("no banned word in admin screens, shared labels, admin errors or staff notifications", () => {
    const hits = allCopyHits();
    if (process.env.COPY_REPORT) {
      const counts: Record<string, number> = {};
      for (const h of hits) for (const w of h.words) counts[w] = (counts[w] ?? 0) + 1;
      console.log(JSON.stringify({ total: hits.length, counts }, null, 1));
      console.log(hits.map((h) => `${h.file}:${h.line}  [${h.words.join(",")}]  ${h.text}`).join("\n"));
    }
    expect(hits.map((h) => `${h.file}:${h.line} [${h.words.join(", ")}] ${h.text}`)).toEqual([]);
  });
});
