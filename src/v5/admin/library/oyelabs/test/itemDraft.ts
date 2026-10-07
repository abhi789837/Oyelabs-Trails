import type { ModuleItemKind, ModuleTestItemInput, ModuleTestItemView, ModuleTestStatus } from "@shared/moduleTests";

/** The "Add my own question" / "Edit" form's state, and its checks in plain words. */
export interface ItemDraft {
  kind: ModuleItemKind;
  prompt: string;
  options: string[];
  correct: number[];
  explanation: string;
}

export const KIND_LABELS: Record<ModuleItemKind, string> = { scenario: "What would you do", recall: "Understanding", hands_on: "Hands-on" };

export function emptyDraft(): ItemDraft {
  return { kind: "scenario", prompt: "", options: ["", "", ""], correct: [], explanation: "" };
}

export function draftFromItem(item: ModuleTestItemView): ItemDraft {
  return { kind: item.kind, prompt: item.prompt, options: [...item.options], correct: [...item.correctIndices], explanation: item.explanation };
}

/** Field → message. Empty when the draft can be sent. */
export function draftProblems(d: ItemDraft): Partial<Record<"prompt" | "options" | "correct", string>> {
  const out: Partial<Record<"prompt" | "options" | "correct", string>> = {};
  if (d.prompt.trim().length < 10) out.prompt = "Write the question (at least 10 characters).";
  const filled = d.options.map((o) => o.trim()).filter(Boolean);
  if (filled.length < 3) out.options = "Write at least 3 answers.";
  else if (new Set(filled.map((o) => o.toLowerCase())).size !== filled.length) out.options = "Two answers are the same. Make each one different.";
  const live = d.correct.filter((i) => d.options[i]?.trim());
  if (live.length === 0) out.correct = "Tick the right answer.";
  else if (live.length >= filled.length) out.correct = "At least one answer must be wrong.";
  return out;
}

/** Drops empty answer boxes and re-maps the ticked ones. Keeps the item's source (the server checks it). */
export function draftToInput(d: ItemDraft, citation: ModuleTestItemInput["citation"] = null): ModuleTestItemInput {
  const kept: number[] = [];
  d.options.forEach((o, i) => {
    if (o.trim()) kept.push(i);
  });
  return {
    kind: d.kind,
    prompt: d.prompt.trim(),
    options: kept.map((i) => d.options[i].trim()),
    correctIndices: d.correct.filter((i) => kept.includes(i)).map((i) => kept.indexOf(i)),
    explanation: d.explanation.trim(),
    citation,
  };
}

/** Still writing: poll the panel. */
export function isWorking(status: ModuleTestStatus): boolean {
  return status === "gathering" || status === "generating";
}
