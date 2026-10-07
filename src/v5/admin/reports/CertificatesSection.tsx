import { Download, FileText, RefreshCw, RotateCcw, Search, ShieldOff } from "lucide-react";
import { useMemo, useState } from "react";

import { CERTIFICATE_KIND_LABELS, formatIssueDate, signatureLines, SIGNATURE_NAME_MAX, SIGNATURE_TITLE_MAX, type AdminCertificate } from "@shared/certificates";

import { Badge, Button, Card, CardHeader, ErrorState, Field, Input, Skeleton, v5Toast } from "@/v5/design";
import { adminCertificateApi } from "@/v5/learner/certificate/api";

import { plainMessage, useLoad } from "../parts/common";

/**
 * Reports → Certificates (rebrand Phase 5): every certificate issued, with its PDF, "Draw again"
 * (after a template or signature change it happens by itself; this forces it now) and Revoke /
 * Restore; the optional signature printed on all of them; and a branded PDF list for the records.
 */
export default function CertificatesSection() {
  const list = useLoad((signal) => adminCertificateApi.list(signal));
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const shown = useMemo(() => {
    const rows = list.data?.certificates ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => [c.holderName, c.title, c.id].some((v) => v.toLowerCase().includes(q)));
  }, [list.data, query]);

  const replace = (next: AdminCertificate) => list.setData((cur) => (cur ? { ...cur, certificates: cur.certificates.map((c) => (c.id === next.id ? next : c)) } : cur));

  const act = async (id: string, action: "revoke" | "restore" | "regenerate") => {
    setBusy(`${action}:${id}`);
    try {
      const { certificate } = action === "revoke" ? await adminCertificateApi.revoke(id) : action === "restore" ? await adminCertificateApi.restore(id) : await adminCertificateApi.regenerate(id);
      replace(certificate);
      v5Toast.success(action === "revoke" ? "Certificate revoked" : action === "restore" ? "Certificate valid again" : "Certificate drawn again", action === "revoke" ? "Its check page now says it was revoked." : undefined);
    } catch (error) {
      v5Toast.error("That didn't work", plainMessage(error));
    } finally {
      setBusy(null);
      setConfirmRevoke(null);
    }
  };

  return (
    <Card id="certificates" className="scroll-mt-20">
      <CardHeader
        title="Certificates"
        description="Everyone's certificates. Open one, draw it again, or revoke it. Revoked ones say so on their check page."
        action={
          <Button variant="secondary" size="sm" asChild>
            <a href={adminCertificateApi.reportPdf} download>
              <Download aria-hidden="true" />
              Download list (PDF)
            </a>
          </Button>
        }
      />

      {list.data ? <SignatureSetting initial={list.data.signature} onSaved={(signature) => list.setData((cur) => (cur ? { ...cur, signature } : cur))} /> : null}

      {list.error && !list.data ? (
        <ErrorState body={plainMessage(list.error)} onRetry={list.reload} />
      ) : !list.data ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Loading certificates">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <>
          <label className="mb-3 mt-5 flex max-w-sm items-center gap-2">
            <Search className="size-4 shrink-0 text-fg-2" aria-hidden="true" />
            <span className="sr-only">Find a certificate</span>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, course or code" />
          </label>
          {shown.length === 0 ? (
            <p className="text-small text-fg-2">{list.data.certificates.length ? "No certificate matches that." : "No certificates yet. One is issued when someone finishes a course, a path or a goal."}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line-1 border-y border-line-1" aria-label="Certificates">
              {shown.map((c) => (
                <li key={c.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-fg-1">
                      {c.holderName} <span className="font-normal text-fg-2">for</span> {c.title}
                    </p>
                    <p className="text-caption text-fg-2">
                      {CERTIFICATE_KIND_LABELS[c.kind]}, issued {formatIssueDate(c.issuedAt)}, <span className="font-mono">{c.id}</span>{" "}
                      {c.revokedAt ? <Badge tone="danger">Revoked</Badge> : <Badge tone="success">Valid</Badge>}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" asChild>
                      <a href={adminCertificateApi.pdf(c.id)} target="_blank" rel="noopener noreferrer">
                        <FileText aria-hidden="true" />
                        Open PDF<span className="sr-only"> for {c.holderName} (opens in a new tab)</span>
                      </a>
                    </Button>
                    <Button size="sm" variant="secondary" loading={busy === `regenerate:${c.id}`} disabled={busy !== null} onClick={() => void act(c.id, "regenerate")}>
                      <RefreshCw aria-hidden="true" />
                      Draw again<span className="sr-only"> for {c.holderName}</span>
                    </Button>
                    {c.revokedAt ? (
                      <Button size="sm" variant="secondary" loading={busy === `restore:${c.id}`} disabled={busy !== null} onClick={() => void act(c.id, "restore")}>
                        <RotateCcw aria-hidden="true" />
                        Make valid again<span className="sr-only"> for {c.holderName}</span>
                      </Button>
                    ) : confirmRevoke === c.id ? (
                      <>
                        <Button size="sm" variant="danger" loading={busy === `revoke:${c.id}`} disabled={busy !== null} onClick={() => void act(c.id, "revoke")}>
                          Yes, revoke<span className="sr-only"> {c.holderName}'s certificate</span>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmRevoke(null)}>
                          Keep it
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => setConfirmRevoke(c.id)}>
                        <ShieldOff aria-hidden="true" />
                        Revoke<span className="sr-only"> {c.holderName}'s certificate</span>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}

function SignatureSetting({ initial, onSaved }: { initial: { name: string; title: string } | null; onSaved: (sig: { name: string; title: string } | null) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [saving, setSaving] = useState(false);
  const changed = name.trim() !== (initial?.name ?? "") || title.trim() !== (initial?.title ?? "");
  const preview = signatureLines(name.trim() ? { name, title } : null);

  const save = async () => {
    setSaving(true);
    try {
      const { signature } = await adminCertificateApi.setSignature({ name: name.trim(), title: title.trim() });
      onSaved(signature);
      setName(signature?.name ?? "");
      setTitle(signature?.title ?? "");
      v5Toast.success(signature ? "Signature saved" : "Signature removed", "Certificates show it from their next download.");
    } catch (error) {
      v5Toast.error("That didn't save", plainMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="rounded-control border border-line-1 bg-sunken p-4"
      aria-labelledby="signature-heading"
      onSubmit={(e) => {
        e.preventDefault();
        if (changed) void save();
      }}
    >
      <h3 id="signature-heading" className="font-display text-h4 font-semibold">
        Signature on certificates
      </h3>
      <p className="mt-1 text-small text-fg-2">
        Optional. The name and job title printed above and under the signature line. Leave the name empty and certificates show "Oyelabs" over "Issued by".
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={SIGNATURE_NAME_MAX} placeholder="Full name" autoComplete="off" />
        </Field>
        <Field label="Job title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={SIGNATURE_TITLE_MAX} placeholder="e.g. Head of Engineering" autoComplete="off" />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-fg-2" aria-live="polite">
          Prints as: <span className="font-semibold text-fg-1">{preview.above}</span> over <span className="text-fg-1">{preview.below}</span>
        </p>
        <Button type="submit" variant="secondary" size="sm" loading={saving} disabled={!changed}>
          Save signature
        </Button>
      </div>
    </form>
  );
}
