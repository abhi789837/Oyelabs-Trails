import { CircleAlert, CircleCheck, CircleX, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { formatIssueDate, type PublicCertificate } from "@shared/certificates";

import { ApiRequestError } from "@/api/client";
import { Logo } from "@/components/brand/Logo";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import "@/v5/design/styles";
import { cn } from "@/v5/design/cn";
import { useV5Root } from "@/v5/design/useV5Root";

import { certificateApi, certificateFiles } from "./api";

export type VerifyState = { kind: "loading" } | { kind: "failed" } | { kind: "missing" } | { kind: "found"; certificate: PublicCertificate };

const STATUS = {
  valid: { icon: CircleCheck, title: "This certificate is valid", mark: "✓", tone: "border-success/40 bg-success-soft text-success-fg" },
  revoked: { icon: CircleX, title: "This certificate was revoked", mark: null, tone: "border-danger/30 bg-danger-soft text-danger-fg" },
  changed: { icon: CircleAlert, title: "We can't confirm this certificate", mark: null, tone: "border-warning/40 bg-warning-soft text-warning-fg" },
} as const;

/**
 * Public `/verify/:certId` (rebrand Phase 5): anyone with the link or the QR can check a
 * certificate, signed in or not. A minimal branded page: the logo, valid / not found / revoked,
 * and for a valid one the holder's name, the course, the date and the certificate's picture.
 * No other personal data. `VerifyView` is pure, so its three states are tested without a server.
 */
export default function VerifyPage() {
  useV5Root();
  const { certId = "" } = useParams();
  const [state, setState] = useState<VerifyState>({ kind: "loading" });
  useDocumentTitle("Verify a certificate");

  useEffect(() => {
    const controller = new AbortController();
    setState({ kind: "loading" });
    certificateApi
      .publicView(certId, controller.signal)
      .then(({ certificate }) => setState({ kind: "found", certificate }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState(err instanceof ApiRequestError && err.status === 404 ? { kind: "missing" } : { kind: "failed" });
      });
    return () => controller.abort();
  }, [certId]);

  return <VerifyView certId={certId} state={state} />;
}

export function VerifyView({ certId, state }: { certId: string; state: VerifyState }) {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-surface-0 px-4 py-10 text-fg-1 sm:py-14">
      <Logo size={36} className="mb-8" />
      <div className="w-full max-w-xl">
        <h1 className="sr-only">Verify a certificate</h1>
        {state.kind === "found" ? (
          <Found certId={certId} cert={state.certificate} />
        ) : state.kind === "missing" ? (
          <section aria-labelledby="verify-status" className="rounded-card border border-line-1 bg-surface-1 px-5 py-5 shadow-e1">
            <div className="flex items-center gap-3">
              <SearchX className="size-6 shrink-0 text-fg-2" aria-hidden="true" />
              <h2 id="verify-status" className="font-display text-h4 font-semibold">
                Certificate not found
              </h2>
            </div>
            <p className="mt-2 text-small text-fg-2">
              No certificate has the code <span className="break-all font-mono text-fg-1">{certId}</span>. Check it against the link or QR code on the certificate.
            </p>
          </section>
        ) : state.kind === "failed" ? (
          <p role="alert" className="text-body text-fg-2">
            We couldn't check it just now. Reload the page to try again.
          </p>
        ) : (
          <p role="status" className="text-small text-fg-2">
            Checking the certificate…
          </p>
        )}
        <p className="mt-8 text-small text-fg-2">Oyelearn is Oyelabs' learning platform. This page shows only what's needed to check a certificate.</p>
      </div>
    </main>
  );
}

function Found({ certId, cert }: { certId: string; cert: PublicCertificate }) {
  const status = STATUS[cert.status];
  const Icon = status.icon;
  const valid = cert.status === "valid";
  return (
    <section aria-labelledby="verify-status" className="overflow-hidden rounded-card border border-line-1 bg-surface-1 shadow-e2">
      <div className={cn("flex items-center gap-3 border-b px-5 py-4", status.tone)}>
        <Icon className="size-6 shrink-0" aria-hidden="true" />
        <h2 id="verify-status" className="font-display text-h4 font-semibold">
          {status.title}
          {status.mark ? <span aria-hidden="true"> {status.mark}</span> : null}
        </h2>
      </div>
      {valid ? (
        <>
          <dl className="grid gap-x-4 gap-y-3 px-5 py-5 text-body sm:grid-cols-[8rem_minmax(0,1fr)]">
            <dt className="text-small text-fg-2">Awarded to</dt>
            <dd className="font-display text-h4 font-semibold text-fg-1">{cert.holderName}</dd>
            <dt className="text-small text-fg-2">For</dt>
            <dd className="text-fg-1">{cert.title}</dd>
            <dt className="text-small text-fg-2">Date</dt>
            <dd className="text-fg-1">{formatIssueDate(cert.issuedAt)}</dd>
            <dt className="text-small text-fg-2">Issued by</dt>
            <dd className="text-fg-1">Oyelabs</dd>
          </dl>
          <div className="border-t border-line-1 bg-white p-3">
            <img
              src={certificateFiles.preview(certId)}
              alt={`The certificate: ${cert.holderName}, ${cert.title}, ${formatIssueDate(cert.issuedAt)}.`}
              width={1754}
              height={1240}
              loading="lazy"
              className="block h-auto w-full"
            />
          </div>
        </>
      ) : cert.status === "revoked" ? (
        <p className="px-5 py-4 text-body text-fg-2">
          Oyelabs revoked this certificate{cert.revokedAt ? ` on ${formatIssueDate(cert.revokedAt)}` : ""}. It no longer counts as proof of completion.
        </p>
      ) : (
        <p className="px-5 py-4 text-body text-fg-2">The record changed after it was issued. Ask Oyelabs to confirm it.</p>
      )}
    </section>
  );
}
