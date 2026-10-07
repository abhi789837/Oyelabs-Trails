import type { AdminCertificate, CertificateSignature, MyCertificate, MyCertificatesResponse, PublicCertificate } from "@shared/certificates";
import { linkedInCredentialName } from "@shared/certificates";
import { linkedInAddUrl } from "@shared/meCore";

import { api } from "@/api/client";

const base = (id: string) => `/api/v5/certificates/${encodeURIComponent(id)}`;

export const certificateApi = {
  mine: (signal?: AbortSignal) => api.get<MyCertificatesResponse>("/api/v5/certificates", signal),
  one: (id: string, signal?: AbortSignal) => api.get<{ certificate: MyCertificate }>(base(id), signal),
  publicView: (id: string, signal?: AbortSignal) => api.get<{ certificate: PublicCertificate }>(`${base(id)}/public`, signal),
  setName: (name: string) => api.put<{ holderName: string; certificates: MyCertificate[] }>("/api/v5/certificates/name", { name }),
};

/**
 * The server draws every certificate file (rebrand Phase 5); these are their addresses. `v` only
 * changes the URL when the printed name does, so an <img> shows a corrected name at once.
 */
export const certificateFiles = {
  pdf: (id: string, download = true) => `${base(id)}/file.pdf${download ? "?download=1" : ""}`,
  png: (id: string, opts: { download?: boolean; v?: string } = {}) => {
    const q = new URLSearchParams();
    if (opts.download) q.set("download", "1");
    if (opts.v) q.set("v", opts.v);
    const s = q.toString();
    return `${base(id)}/file.png${s ? `?${s}` : ""}`;
  },
  /** Public, valid certificates only: the verify page and link previews. */
  preview: (id: string) => `${base(id)}/preview.png`,
};

/** LinkedIn's "Add licence or certification": "Oyelearn – <Course>", Oyelabs, the issue date, the public link. */
export function linkedInUrlFor(cert: { id: string; title: string; issuedAt: number; verifyUrl: string }): string {
  let origin = "";
  try {
    origin = new URL(cert.verifyUrl).origin;
  } catch {
    origin = window.location.origin;
  }
  return linkedInAddUrl({ id: cert.id, issuedAt: cert.issuedAt, title: linkedInCredentialName(cert.title) }, origin);
}

export interface AdminCertificatesResponse {
  certificates: AdminCertificate[];
  signature: CertificateSignature | null;
}

export const adminCertificateApi = {
  list: (signal?: AbortSignal) => api.get<AdminCertificatesResponse>("/api/admin/v5/certificates", signal),
  revoke: (id: string, note = "") => api.post<{ certificate: AdminCertificate }>(`/api/admin/v5/certificates/${encodeURIComponent(id)}/revoke`, { note }),
  restore: (id: string) => api.post<{ certificate: AdminCertificate }>(`/api/admin/v5/certificates/${encodeURIComponent(id)}/restore`, {}),
  regenerate: (id: string) => api.post<{ certificate: AdminCertificate }>(`/api/admin/v5/certificates/${encodeURIComponent(id)}/regenerate`, {}),
  setSignature: (sig: CertificateSignature) => api.put<{ signature: CertificateSignature | null }>("/api/admin/v5/certificates/signature", sig),
  pdf: (id: string) => `/api/admin/v5/certificates/${encodeURIComponent(id)}/file.pdf`,
  reportPdf: "/api/admin/v5/certificates/report.pdf",
};
