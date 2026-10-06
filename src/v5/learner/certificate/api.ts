import type { MyCertificate, MyCertificatesResponse, PublicCertificate } from "@shared/certificates";

import { api } from "@/api/client";

export const certificateApi = {
  mine: (signal?: AbortSignal) => api.get<MyCertificatesResponse>("/api/v5/certificates", signal),
  one: (id: string, signal?: AbortSignal) => api.get<{ certificate: MyCertificate }>(`/api/v5/certificates/${encodeURIComponent(id)}`, signal),
  publicView: (id: string, signal?: AbortSignal) => api.get<{ certificate: PublicCertificate }>(`/api/v5/certificates/${encodeURIComponent(id)}/public`, signal),
  setName: (name: string) => api.put<{ holderName: string; certificates: MyCertificate[] }>("/api/v5/certificates/name", { name }),
};
