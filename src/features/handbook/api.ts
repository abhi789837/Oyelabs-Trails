import { api } from "@/api/client";
import type { GlossaryTerm, HandbookEntry, TermCategory } from "@shared/handbook";

/** v4.2: the learner side of the Process Handbook API (see the contract in the v4.2 brief). */

export type FlashcardResult = "again" | "good" | "easy";

export interface DueCard {
  termId: string;
  box: number;
  dueAt: number;
  /** True for a term the learner has never reviewed. */
  isNew?: boolean;
}

export interface DueResponse {
  cards: DueCard[];
  /** Every card due now (the list may be cut by `limit`). */
  dueCount?: number;
  newCount: number;
}

export const handbookApi = {
  glossary: (signal?: AbortSignal) => api.get<{ terms: GlossaryTerm[] }>("/api/handbook/glossary", signal),

  term: (id: string, signal?: AbortSignal) =>
    api.get<{ entry: HandbookEntry<"term"> }>(`/api/handbook/terms/${encodeURIComponent(id)}`, signal),

  rules: (ids: string[], signal?: AbortSignal) =>
    api.get<{ rules: HandbookEntry<"rule">[] }>(
      `/api/handbook/rules?ids=${ids.map(encodeURIComponent).join(",")}`,
      signal,
    ),

  templates: (signal?: AbortSignal) => api.get<{ templates: HandbookEntry<"template">[] }>("/api/handbook/templates", signal),

  dueFlashcards: (options: { limit?: number; category?: TermCategory } = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams({ limit: String(options.limit ?? 20) });
    if (options.category) params.set("category", options.category);
    return api.get<DueResponse>(`/api/handbook/flashcards/due?${params.toString()}`, signal);
  },

  reviewFlashcard: (termId: string, result: FlashcardResult) =>
    api.post<{ box: number; dueAt: number }>(`/api/handbook/flashcards/${encodeURIComponent(termId)}`, { result }),
};

/** A same-origin link to a template file; the browser downloads it with the session cookie. */
export function templateDownloadUrl(templateId: string, variant: "blank" | "filled"): string {
  return `/api/handbook/templates/${encodeURIComponent(templateId)}/download?variant=${variant}`;
}
