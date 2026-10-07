import { Copy, Download, ExternalLink, Image as ImageIcon, Share2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { certificateFileName, completionLine, formatIssueDate, type MyCertificate } from "@shared/certificates";

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

import { certificateApi, certificateFiles, linkedInUrlFor } from "./api";
import { SealMoment } from "./SealMoment";

const SEEN_KEY = "oyelearn.certificate.seen";

/** True the first time this browser opens this certificate (the moment plays once). */
function firstVisit(id: string): boolean {
  try {
    const seen = JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]") as string[];
    if (seen.includes(id)) return false;
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id].slice(-50)));
    return true;
  } catch {
    return false;
  }
}

/**
 * `/learn/certificate/:certId`: the learner's certificate. The server issues it and draws its PDF
 * and PNG from the kit's template (rebrand Phase 5); this page shows that picture, downloads the
 * files, copies the public check link and adds it to LinkedIn. It never decides completion.
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
              <Skeleton className="aspect-[1754/1240] w-full" />
            </div>
          ) : (
            <CertificateView cert={cert} onChange={setCert} />
          )}
          <p className="text-small text-fg-2">
            <Link to="/learn/me#certificates" className="font-medium text-brand-fg underline-offset-4 hover:underline">
              All your certificates
            </Link>
          </p>
        </div>
      </div>
    </V5MotionProvider>
  );
}

function CertificateView({ cert, onChange }: { cert: MyCertificate; onChange: (next: MyCertificate) => void }) {
  const revoked = cert.revokedAt !== null;
  const [play] = useState(() => !revoked && firstVisit(cert.id));
  const [imageState, setImageState] = useState<"loading" | "ready" | "failed">("loading");

  // The app-wide moment (toast-sized, through the motivation host), once per browser per certificate.
  useEffect(() => {
    if (!revoked) celebrate("certificate", { ref: cert.id, detail: cert.title, once: `certificate:${cert.id}` });
  }, [cert.id, cert.title, revoked]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(cert.verifyUrl);
      v5Toast.success("Link copied", "Anyone with it can check your certificate.");
    } catch {
      v5Toast.info("Copy this link", cert.verifyUrl);
    }
  };

  const alt = `Certificate of completion: ${cert.holderName} ${completionLine(cert.kind)} ${cert.title}, ${formatIssueDate(cert.issuedAt)}. Certificate code ${cert.id}.`;

  return (
    <>
      <header className="flex items-center gap-4">
        <SealMoment play={play} size={64} />
        <div className="min-w-0">
          <p className="text-small font-medium text-brand-fg">{revoked ? "Certificate" : `Certificate earned ${formatIssueDate(cert.issuedAt)}`}</p>
          <h1 className="font-display text-h1 font-semibold text-fg-1">{cert.title}</h1>
          <p className="text-body text-fg-2">{revoked ? "This certificate is no longer valid." : "Download it, share the link, or add it to LinkedIn."}</p>
        </div>
      </header>

      {revoked ? (
        <StatusLine tone="danger">This certificate was revoked on {formatIssueDate(cert.revokedAt!)}. Its check page says so. Ask your manager if you think that's a mistake.</StatusLine>
      ) : (
        <Card elevation={1} className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-control border border-line-1 bg-white">
            {imageState !== "ready" ? <Skeleton className="absolute inset-0 rounded-none" /> : null}
            <img
              src={certificateFiles.png(cert.id, { v: cert.holderName })}
              alt={alt}
              width={1754}
              height={1240}
              className="relative block h-auto w-full"
              onLoad={() => setImageState("ready")}
              onError={() => setImageState("failed")}
            />
            {imageState === "failed" ? (
              <p role="alert" className="absolute inset-0 grid bg-surface-1 place-items-center p-4 text-center text-small text-fg-2">
                The picture didn't load. The downloads still work.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" asChild>
              <a href={certificateFiles.pdf(cert.id)} download={certificateFileName(cert.id, "pdf")}>
                <Download aria-hidden="true" />
                Download PDF
              </a>
            </Button>
            <Button variant="secondary" asChild>
              <a href={certificateFiles.png(cert.id, { download: true })} download={certificateFileName(cert.id, "png")}>
                <ImageIcon aria-hidden="true" />
                Download image
              </a>
            </Button>
            <Button variant="secondary" onClick={() => void copyLink()}>
              <Copy aria-hidden="true" />
              Copy verify link
            </Button>
            <Button variant="secondary" asChild>
              <a href={linkedInUrlFor(cert)} target="_blank" rel="noopener noreferrer">
                <Share2 aria-hidden="true" />
                Add to LinkedIn
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
            <Button variant="ghost" asChild>
              <a href={cert.verifyPath} target="_blank" rel="noopener noreferrer">
                <ShieldCheck aria-hidden="true" />
                Open the check page
                <ExternalLink aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
          </div>
          <p className="break-all text-small text-fg-2">
            Verify link: <span className="font-mono">{cert.verifyUrl}</span>
          </p>
        </Card>
      )}

      {!revoked ? <HolderName cert={cert} onChange={onChange} /> : null}
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
      v5Toast.success("Name updated", "Your certificates now show it.");
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
        <Field label="Name on your certificates" hint="Spelled the way you want it printed. It changes on all your certificates." error={error ?? undefined} className="flex-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
        </Field>
        <Button type="submit" variant="secondary" loading={saving} disabled={!changed || name.trim().length < 2}>
          Save name
        </Button>
      </form>
    </Card>
  );
}
