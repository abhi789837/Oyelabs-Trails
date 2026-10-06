import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { CERTIFICATE_KIND_LABELS, formatIssueDate, type PublicCertificate } from "@shared/certificates";

import { ApiRequestError } from "@/api/client";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import "@/v5/design/styles";
import { Logo } from "@/v5/design/components/Showcase";
import { ContourBackground } from "@/v5/design/components/States";
import { cn } from "@/v5/design/cn";
import { useV5Root } from "@/v5/design/useV5Root";

import { certificateApi } from "./api";

const STATUS = {
  valid: { icon: CircleCheck, title: "This certificate is valid", tone: "border-success/40 bg-success-soft text-success-fg" },
  revoked: { icon: CircleX, title: "This certificate was withdrawn", tone: "border-danger/30 bg-danger-soft text-danger-fg" },
  changed: { icon: CircleAlert, title: "We can't confirm this certificate", tone: "border-warning/40 bg-warning-soft text-warning-fg" },
} as const;

/**
 * Public `/verify/:certId`: anyone with the link (or the QR) can check a certificate. No session,
 * minimal data: the holder, what it's for, the date, and whether it's still valid.
 */
export default function VerifyPage() {
  useV5Root();
  const { certId = "" } = useParams();
  const [cert, setCert] = useState<PublicCertificate | null>(null);
  const [missing, setMissing] = useState(false);
  const [failed, setFailed] = useState(false);
  useDocumentTitle("Check a certificate");

  useEffect(() => {
    const controller = new AbortController();
    certificateApi
      .publicView(certId, controller.signal)
      .then(({ certificate }) => setCert(certificate))
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiRequestError && err.status === 404) setMissing(true);
        else setFailed(true);
      });
    return () => controller.abort();
  }, [certId]);

  const status = cert ? STATUS[cert.status] : null;
  const Icon = status?.icon;

  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center overflow-hidden bg-surface-0 px-4 py-12 text-fg-1">
      <ContourBackground seed={5} className="-z-10 opacity-70" />
      <Logo className="mb-10 h-9" />
      <div className="w-full max-w-lg">
        <h1 className="font-display text-h2 font-semibold">Check a certificate</h1>
        <p className="mt-1 font-mono text-small text-fg-2">{certId}</p>

        {cert && status && Icon ? (
          <section aria-labelledby="verify-status" className="mt-6 overflow-hidden rounded-card border border-line-1 bg-surface-1 shadow-e2">
            <div className={cn("flex items-center gap-3 border-b px-5 py-4", status.tone)}>
              <Icon className="size-6 shrink-0" aria-hidden="true" />
              <h2 id="verify-status" className="font-display text-h4 font-semibold">
                {status.title}
              </h2>
            </div>
            <dl className="grid gap-4 px-5 py-5 text-body sm:grid-cols-[9rem_minmax(0,1fr)]">
              <dt className="text-small text-fg-2">Awarded to</dt>
              <dd className="font-display text-h4 font-semibold text-fg-1">{cert.holderName}</dd>
              <dt className="text-small text-fg-2">For</dt>
              <dd className="text-fg-1">
                {cert.title}
                <span className="block text-small text-fg-2">{CERTIFICATE_KIND_LABELS[cert.kind]} certificate</span>
              </dd>
              <dt className="text-small text-fg-2">Issued</dt>
              <dd className="text-fg-1">{formatIssueDate(cert.issuedAt)}</dd>
              {cert.revokedAt ? (
                <>
                  <dt className="text-small text-fg-2">Withdrawn</dt>
                  <dd className="text-fg-1">{formatIssueDate(cert.revokedAt)}</dd>
                </>
              ) : null}
              <dt className="text-small text-fg-2">Issued by</dt>
              <dd className="text-fg-1">Oyelabs, through Oyelearn</dd>
            </dl>
            {cert.status === "changed" ? <p className="border-t border-line-1 px-5 py-3 text-small text-fg-2">The record changed after it was issued. Ask Oyelabs to confirm it.</p> : null}
          </section>
        ) : missing ? (
          <section className="mt-6 rounded-card border border-line-1 bg-surface-1 px-5 py-5 shadow-e1">
            <h2 className="font-display text-h4 font-semibold">We couldn't find this certificate</h2>
            <p className="mt-1 text-small text-fg-2">Check the code against the one printed on the certificate. Codes look like OYL-AB12-CD34.</p>
          </section>
        ) : failed ? (
          <p role="alert" className="mt-6 text-body text-fg-2">
            We couldn't check it just now. Reload the page to try again.
          </p>
        ) : (
          <p role="status" className="mt-6 text-small text-fg-2">
            Checking…
          </p>
        )}
        <p className="mt-8 text-small text-fg-2">Oyelearn is Oyelabs' training platform. This page shows only what's needed to check a certificate.</p>
      </div>
    </main>
  );
}
