import type { UploadKind, UploadView } from "@shared/oyelabsCourses";
import type { LinkProblem, LinkStatus, ResolvedDocLink, ResolvedVideo, TrackingMode, VideoSourceKind } from "@shared/videoSourcesCore";

import { api, ApiRequestError } from "@/api/client";

/** v4.5 Phase 2 (builder B): the editor's calls for links and uploads. */

export interface VideoCheckResult {
  id: string;
  kind: VideoSourceKind;
  tracking: TrackingMode;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  status: LinkStatus;
  problem: LinkProblem | null;
  lastCheckedAt: number | null;
}

export interface DocCheckResult {
  id: string;
  title: string;
  status: LinkStatus;
  problem: LinkProblem | null;
  lastCheckedAt: number | null;
}

/** Pasted links are resolved once per page; the same link pasted twice reuses the answer. */
const videoCache = new Map<string, Promise<ResolvedVideo>>();
const docCache = new Map<string, Promise<ResolvedDocLink>>();

export const mediaApi = {
  resolveVideo(url: string, fresh = false): Promise<ResolvedVideo> {
    const key = url.trim();
    if (fresh || !videoCache.has(key)) {
      const p = api.post<ResolvedVideo>("/api/admin/oyelabs/links/resolve", { url: key });
      p.catch(() => videoCache.delete(key));
      videoCache.set(key, p);
    }
    return videoCache.get(key)!;
  },
  resolveDoc(url: string, fresh = false): Promise<ResolvedDocLink> {
    const key = url.trim();
    if (fresh || !docCache.has(key)) {
      const p = api.post<ResolvedDocLink>("/api/admin/oyelabs/docs/resolve", { url: key });
      p.catch(() => docCache.delete(key));
      docCache.set(key, p);
    }
    return docCache.get(key)!;
  },
  checkVideo: (id: string) => api.post<VideoCheckResult>(`/api/admin/oyelabs/videos/${encodeURIComponent(id)}/check`),
  checkDoc: (id: string) => api.post<DocCheckResult>(`/api/admin/oyelabs/docs/${encodeURIComponent(id)}/check`),
  getUpload: (id: string) => api.get<UploadView>(`/api/admin/oyelabs/uploads/${encodeURIComponent(id)}`),

  /** Multipart upload with progress (fetch has no upload progress, so XHR). */
  upload(kind: UploadKind, file: File, onProgress: (share: number) => void, signal?: AbortSignal): Promise<UploadView> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/admin/oyelabs/uploads?kind=${kind}`);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        let body: unknown = null;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          // not JSON (a proxy's 413 page)
        }
        if (xhr.status >= 200 && xhr.status < 300) return resolve(body as UploadView);
        const err = (body as { error?: { code?: string; message?: string } } | null)?.error;
        const message =
          err?.message ??
          (xhr.status === 413 ? "That file is too large for the server. Ask whoever runs Oyelearn to raise the upload limit." : "The upload didn't finish. Try again.");
        reject(new ApiRequestError(xhr.status, (err?.code ?? "internal") as never, message));
      };
      xhr.onerror = () => reject(new ApiRequestError(0, "internal" as never, "Could not reach the server. Check your connection."));
      xhr.onabort = () => reject(new DOMException("The upload was stopped.", "AbortError"));
      signal?.addEventListener("abort", () => xhr.abort(), { once: true });
      const form = new FormData();
      form.append("kind", kind);
      form.append("file", file);
      xhr.send(form);
    });
  },
};

export function errorText(error: unknown, fallback = "That didn't work. Try again."): string {
  return error instanceof ApiRequestError ? error.message : fallback;
}
