import { ERROR_CODES, type ErrorCode } from "@shared/api";
import type { HandbookEntry, HandbookKind } from "@shared/handbook";

import { api, ApiRequestError } from "@/api/client";

export interface HandbookListResponse {
  entries: HandbookEntry[];
  counts: { toConfirm: number; confirmed: number; archived: number };
}

const enc = encodeURIComponent;

/** `/api/admin/handbook/*` (v4.2). Any staff member. */
export const handbookApi = {
  /** Every entry of every kind, archived included: the page filters on the client. */
  list: (signal?: AbortSignal) => api.get<HandbookListResponse>("/api/admin/handbook", signal),
  save: (kind: HandbookKind, id: string, data: unknown, confirm = false) =>
    api.put<{ entry: HandbookEntry; revalidating: number }>(`/api/admin/handbook/${kind}/${enc(id)}`, { data, confirm }),
  create: (kind: HandbookKind, data: unknown) => api.post<{ entry: HandbookEntry }>(`/api/admin/handbook/${kind}`, { data }),
  setArchived: (kind: HandbookKind, id: string, archived: boolean) =>
    api.post<{ entry: HandbookEntry }>(`/api/admin/handbook/${kind}/${enc(id)}/${archived ? "archive" : "unarchive"}`),
  revertUpload: (id: string) => api.del<{ entry: HandbookEntry }>(`/api/admin/handbook/templates/${enc(id)}/upload`),
  /** The raw file as the body; the JSON client cannot send bytes. */
  upload: async (id: string, file: File): Promise<{ entry: HandbookEntry }> => {
    const res = await fetch(`/api/admin/handbook/templates/${enc(id)}/upload`, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "content-type": file.type || "application/octet-stream" },
      body: file,
    });
    const payload = (await res.json().catch(() => null)) as { entry?: HandbookEntry; error?: { code: string; message: string } } | null;
    if (!res.ok || !payload?.entry) {
      throw new ApiRequestError(res.status, (payload?.error?.code ?? ERROR_CODES.INTERNAL) as ErrorCode, payload?.error?.message ?? `Upload failed (${res.status}).`);
    }
    return { entry: payload.entry };
  },
};

export const downloadUrl = (id: string, variant: "blank" | "filled") => `/api/handbook/templates/${enc(id)}/download?variant=${variant}`;
