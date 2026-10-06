import { Copy, Download, ExternalLink, Image as ImageIcon, Share2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { formatIssueDate, type MyCertificate } from "@shared/certificates";
import { linkedInAddUrl } from "@shared/me";

import { ApiRequestError } from "@/api/client";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import "@/v5/design/styles";
import { Button } from "@/v5/design/components/Button";
import { Card } from "@/v5/design/components/Card";
import { Field, Input } from "@/v5/design/components/Field";
import { StatusLine } from "@/v5/design/components/Lesson";
import { v5Toast } from "@/v5/design/components/Overlays";
import { ErrorState, Skeleton } from "@/v5/design/components/States";
import { useV5Root } from "@/v5/design/useV5Root";
import { V5MotionProvider } from "@/v5/design/V5MotionProvider";
import { celebrate } from "@/v5/motivation/celebrate";

import { certificateApi } from "./api";
import type { CertificateText } from "./art";
import { CertificateArt } from "./CertificateArt";
import { useQr } from "./qr";

/**
 * `/learn/certificate/:certId`: the learner's certificate, with its public check link and QR, a PDF
 * and a 1200 × 630 share image (both made in the browser, lazily), LinkedIn, and the name printed
 * on it. The certificate itself is issued by the server; this page never decides completion.
 */
export default function CertificatePage() {
  useV5Root();
  const { certId = "" } = useParams();
  const [cert, setCert] = useState<MyCertificate | null>(null);
  const [error, setError] = useState<{ status: number; message: string } | null>(null);
  useDocumentTitle(cert ? `${cert.title} certificate` : "Certificate");

  const load = () => {
    setError(null);
    certificateApi
      .one(certId)
      .then(({ certificate }) => setCert(certificate))
      .catch((err) => setError({ status: err instanceof ApiRequestError ? err.status : 0, message: err instanceof ApiRequestError ? err.message : "Check your connection and try again." }));
  };
  useEffect(load, [certId]);

  // The moment: once per browser per certificate, through the motivation host (Phase 6).
  useEffect(() => {
    if (cert && !cert.revokedAt) celebrate("certificate", { ref: cert.id, detail: cert.title, once: `certificate:${cert.id}` });
  }, [cert]);

  return (
    <V5MotionProvider>
      <div className="min-h-full bg-surface-0 text-fg-1">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 md:py-10">
          {error ? (
            <ErrorState
              title={error.status === 404 ? "We couldn't find that certificate" : "We couldn't load your certificate"}
              body={error.status === 404 ? "It may belong to someone else. Your certificates are on your Me page." : error.message}
              onRetry={error.status === 404 ? undefined : load}
            />
          ) : !cert ? (
            <div role="status" aria-label="Loading your certificate" className="flex flex-col gap-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="aspect-[1.414/1] w-full" />
            </div>
          ) : (
            <CertificateView cert={cert} onChange={setCert} />
          )}
          <p className="text-small text-fg-2">
            <Link to="/learn/me" className="font-medium text-brand-fg underline-offset-4 hover:underline">
              All your certificates
            </Link>
          </p>
        </div>
      </div>
    </V5MotionProvider>
  );
}

function CertificateView({ cert, onChange }: { cert: MyCertificate; onChange: (next: MyCertificate) => void }) {
  const verifyUrl = `${window.location.origin}${cert.verifyPath}`;
  const qr = useQr(verifyUrl);
  const [busy, setBusy] = useState<"pdf" | "image" | null>(null);
  const revoked = cert.revokedAt !== null;
  const text: CertificateText = { holderName: cert.holderName, title: cert.title, kind: cert.kind, issuedAt: cert.issuedAt, id: cert.id, verifyUrl };

  const downloadPdf = async () => {
    if (!qr || busy) return;
    setBusy("pdf");
    try {
      const { downloadCertificatePdfV5 } = await import("./pdf");
      await downloadCertificatePdfV5(text, qr, revoked);
    } catch {
      v5Toast.error("The PDF couldn't be made", "Try again, or use the share image instead.");
    } finally {
      setBusy(null);
    }
  };

  const downloadImage = async () => {
    if (!qr || busy) return;
    setBusy("image");
    try {
      const { downloadShareImage } = await import("./shareImage");
      await downloadShareImage(text, qr);
    } catch {
      v5Toast.error("The image couldn't be made", "Try again in a moment.");
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      v5Toast.success("Link copied", "Anyone with it can check your certificate.");
    } catch {
      v5Toast.info("Copy this link", verifyUrl);
    }
  };

  return (
    <>
      <header className="flex flex-col gap-1">
        <p className="text-small font-medium text-brand-fg">{formatIssueDate(cert.issuedAt)}</p>
        <h1 className="font-display text-h1 font-semibold text-fg-1">{cert.title}</h1>
        <p className="text-body text-fg-2">Your certificate. Share it, print it, or add it to LinkedIn.</p>
      </header>

      {revoked ? (
        <StatusLine tone="danger">This certificate was withdrawn on {formatIssueDate(cert.revokedAt!)}. Its check page says so. Ask your manager if you think that's a mistake.</StatusLine>
      ) : null}

      <div className="overflow-hidden rounded-card border border-line-1 shadow-e2">
        <CertificateArt cert={text} qr={qr} revoked={revoked} className="block h-auto w-full" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => void downloadPdf()} loading={busy === "pdf"} disabled={!qr || revoked}>
          <Download aria-hidden="true" />
          Download PDF
        </Button>
        <Button variant="secondary" onClick={() => void downloadImage()} loading={busy === "image"} disabled={!qr || revoked}>
          <ImageIcon aria-hidden="true" />
          Download share image
        </Button>
        <Button variant="secondary" onClick={() => void copyLink()} disabled={revoked}>
          <Copy aria-hidden="true" />
          Copy check link
        </Button>
        {!revoked ? (
          <Button variant="secondary" asChild>
            <a href={linkedInAddUrl(cert, window.location.origin)} target="_blank" rel="noreferrer">
              <Share2 aria-hidden="true" />
              Add to LinkedIn
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
        ) : null}
        <Button variant="ghost" asChild>
          <a href={cert.verifyPath} target="_blank" rel="noreferrer">
            <ShieldCheck aria-hidden="true" />
            Open the check page
            <ExternalLink aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Button>
      </div>

      <HolderName cert={cert} onChange={onChange} />
    </>
  );
}

function HolderName({ cert, onChange }: { cert: MyCertificate; onChange: (next: MyCertificate) => void }) {
  const [name, setName] = useState(cert.holderName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = name.trim().replace(/\s+/g, " ") !== cert.holderName;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await certificateApi.setName(name);
      const updated = res.certificates.find((c) => c.id === cert.id);
      if (updated) onChange(updated);
      setName(res.holderName);
      v5Toast.success("Name updated", "It's on your certificates now.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "That didn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card elevation={0}>
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (changed) void save();
        }}
      >
        <Field label="Name on your certificates" hint="Spelled the way you want it to appear. It changes on all your certificates." error={error ?? undefined} className="flex-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
        </Field>
        <Button type="submit" variant="secondary" loading={saving} disabled={!changed || name.trim().length < 2}>
          Save name
        </Button>
      </form>
    </Card>
  );
}
