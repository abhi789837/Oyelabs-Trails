import { BANK_MIN_PER_SKILL, bankItemSchema, type BankItem, type BankItemRow, type BankItemType } from "@shared/bank";
import type { AssessmentFormat, Skill } from "@shared/catalog";

/**
 * Pure helpers for the question-bank page, kept apart from the components so they can be tested
 * without a React tree.
 */

export const BANK_TYPE_LABELS: Record<BankItemType, string> = {
  coding: "Coding",
  mcq: "Multiple choice",
  task: "Hands-on task",
};

/**
 * Which item types a department's assessments draw on. A coding department never sees a task and a
 * tasks department never sees a coding problem; both get multiple choice.
 */
export function typesForFormat(format: AssessmentFormat | undefined): BankItemType[] {
  return format === "tasks" ? ["task", "mcq"] : ["coding", "mcq"];
}

/** Below the assembler's floor for this type, so it would ask for a gap fill. */
export function isThin(type: BankItemType, activeCount: number): boolean {
  return activeCount < BANK_MIN_PER_SKILL[type];
}

export interface CoverageRow {
  skillId: string;
  skillName: string;
  area: string;
  counts: Record<BankItemType, number>;
  /** The types (of the department's own) that are below the floor. */
  thin: BankItemType[];
}

/**
 * One row per live skill of the department, thinnest first so the gaps are at the top. Skills with
 * no items at all are included: they are the biggest gap of all, and the server's coverage map
 * simply has no key for them.
 */
export function coverageRows(
  skills: readonly Pick<Skill, "id" | "name" | "area" | "departmentId" | "status">[],
  coverage: Record<string, Partial<Record<BankItemType, number>>>,
  departmentId: string,
  format: AssessmentFormat | undefined,
): CoverageRow[] {
  const types = typesForFormat(format);
  const rows = skills
    .filter((skill) => skill.departmentId === departmentId && skill.status === "active")
    .map((skill) => {
      const raw = coverage[skill.id] ?? {};
      const counts = { coding: raw.coding ?? 0, mcq: raw.mcq ?? 0, task: raw.task ?? 0 };
      return {
        skillId: skill.id,
        skillName: skill.name,
        area: skill.area,
        counts,
        thin: types.filter((type) => isThin(type, counts[type])),
      };
    });
  return rows.sort((a, b) => b.thin.length - a.thin.length || a.skillName.localeCompare(b.skillName));
}

/** Mean score as a whole percentage, or an em dash before anyone has answered. */
export function formatMeanScore(meanScore: number | null): string {
  return meanScore === null ? "—" : `${Math.round(meanScore * 100)}%`;
}

export function formatDiscrimination(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}

const ROW_ONLY_KEYS = [
  "status",
  "source",
  "timesUsed",
  "meanScore",
  "discrimination",
  "retiredReason",
  "validatedAt",
  "updatedAt",
] as const;

/** The editable part of a row: exactly a `BankItem`, without stats or status. */
export function toEditableItem(row: BankItemRow): BankItem {
  const copy: Record<string, unknown> = { ...row };
  for (const key of ROW_ONLY_KEYS) delete copy[key];
  return copy as unknown as BankItem;
}

export type ParsedItem = { ok: true; item: BankItem } | { ok: false; errors: string[] };

/**
 * Parses the JSON editor's text and checks it against the same schema the server uses. The id is
 * fixed to the item being edited: renaming would create a second item, not edit this one.
 */
export function parseItemJson(text: string, id: string): ParsedItem {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    return { ok: false, errors: [`Not valid JSON: ${err instanceof Error ? err.message : String(err)}`] };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, errors: ["The item must be a JSON object."] };
  const parsed = bankItemSchema.safeParse({ ...(raw as object), id });
  if (parsed.success) return { ok: true, item: parsed.data };
  return {
    ok: false,
    errors: parsed.error.issues.slice(0, 8).map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message)),
  };
}
