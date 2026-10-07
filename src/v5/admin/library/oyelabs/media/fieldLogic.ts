import type { LinkProblem, LinkStatus } from "@shared/videoSourcesCore";

/** v4.5 Phase 2: the pure parts of the editor's link fields (tested in fieldLogic.test.ts). */

/** Pasted text → links, one per line (or separated by spaces), without blanks or repeats. */
export function pastedLinks(text: string, existing: readonly string[] = []): string[] {
  const seen = new Set(existing.map((u) => u.trim()));
  const out: string[] = [];
  for (const raw of text.split(/[\s]+/)) {
    const url = raw.trim().replace(/[,;]+$/, "");
    if (url.length < 4 || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/** Moves one item; out-of-range moves return the list unchanged. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

export interface CardStatus {
  tone: "ok" | "problem" | "pending";
  /** "Plays ✓", "Can't play: …", "Checking…". */
  line: string;
  fix: string | null;
}

/** The one status line a card shows. */
export function cardStatus(status: LinkStatus | null, problem: LinkProblem | null, noun: "video" | "doc"): CardStatus {
  if (!status || status === "pending") return { tone: "pending", line: "Checking…", fix: null };
  if (status === "ok") return { tone: "ok", line: noun === "video" ? "Plays ✓" : "Readable ✓", fix: null };
  return { tone: "problem", line: `${noun === "video" ? "Can't play" : "Can't read"}: ${problem?.message ?? "this link doesn't work right now."}`, fix: problem?.fix ?? null };
}

/** Minutes typed by the admin → seconds (1 min to 24 h), or null when empty/invalid. */
export function minutesToSeconds(value: string): number | null {
  const n = Number(value.replace(",", "."));
  if (!value.trim() || !Number.isFinite(n) || n <= 0) return null;
  return Math.min(86_400, Math.max(60, Math.round(n * 60)));
}

/** "45 MB", "1.2 GB". */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
