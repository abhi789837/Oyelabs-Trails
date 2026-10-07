import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";

import { isCertificateId, normalizeHolderName, SIGNATURE_NAME_MAX, SIGNATURE_TITLE_MAX, verifyUrlFor, type CertificateSignature } from "../../../../shared/certificates";
import { schema, type Db } from "../../db";
import { now } from "../../lib/ids";
import { renderCertificatePdf, renderCertificatePng } from "./render";
import { TEMPLATE_VERSION, type CertificateInput } from "./template";

/**
 * The certificate's files: a PDF, a 2× PNG (download, share) and a 1× PNG (the verify page and
 * link previews), drawn from one template and kept under `DATA_DIR/certificates/`.
 *
 * Each file's name carries a key over everything printed on it (the record's hash, which covers the
 * holder's name and the title; the signature setting; the public origin in the QR; the template
 * version). So the files are made once, served from disk after that, and a corrected name, a new
 * signature or a new template simply gives a new key: the next request draws it again and the old
 * files are deleted. `ensure` is idempotent and safe to call from two requests at once (each writes
 * a temporary file and renames it into place).
 */

type CertRow = typeof schema.certificates.$inferSelect;

export type CertificateFileKind = "pdf" | "png" | "preview";

const EXT: Record<CertificateFileKind, string> = { pdf: "pdf", png: "png", preview: "preview.png" };

export interface CertificateFilesConfig {
  dataDir: string;
  publicOrigin: string;
}

export function certificatesDir(dataDir: string): string {
  return path.join(dataDir, "certificates");
}

// ---------------------------------------------------------------------------
// Signature setting (app_meta; no migration)
// ---------------------------------------------------------------------------

const SIGNATURE_KEY = "certificate.signature";

export function getSignature(db: Db): CertificateSignature | null {
  const raw = db.select({ value: schema.appMeta.value }).from(schema.appMeta).where(eq(schema.appMeta.key, SIGNATURE_KEY)).get()?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CertificateSignature>;
    const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
    if (!name) return null;
    return { name, title: typeof parsed.title === "string" ? parsed.title.trim() : "" };
  } catch {
    return null;
  }
}

/** Sets (or, with an empty name, clears) the signatory. Every certificate redraws on its next request. */
export function setSignature(db: Db, sig: CertificateSignature | null): CertificateSignature | null {
  const name = normalizeHolderName(sig?.name ?? "").slice(0, SIGNATURE_NAME_MAX);
  const title = (sig?.title ?? "").trim().replace(/\s+/g, " ").slice(0, SIGNATURE_TITLE_MAX);
  if (!name) {
    db.delete(schema.appMeta).where(eq(schema.appMeta.key, SIGNATURE_KEY)).run();
    return null;
  }
  const value = JSON.stringify({ name, title });
  db.insert(schema.appMeta)
    .values({ key: SIGNATURE_KEY, value, updatedAt: now() })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: now() } })
    .run();
  return { name, title };
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export function inputFor(row: CertRow, title: string, signature: CertificateSignature | null, publicOrigin: string): CertificateInput {
  return { holderName: row.learnerName, title, kind: row.kind, issuedAt: row.issuedAt, verifyUrl: verifyUrlFor(publicOrigin, row.id), signature };
}

/** What the files' names depend on: change any of it and they are drawn again. */
export function fileKey(input: CertificateInput, rowHash: string | null): string {
  return createHash("sha256")
    .update(JSON.stringify([TEMPLATE_VERSION, rowHash ?? "", input.holderName, input.title, input.kind, input.issuedAt, input.verifyUrl, input.signature]))
    .digest("hex")
    .slice(0, 16);
}

function fileName(id: string, key: string, kind: CertificateFileKind): string {
  return `${id}.${key}.${EXT[kind]}`;
}

async function draw(input: CertificateInput, kind: CertificateFileKind): Promise<Buffer> {
  if (kind === "pdf") return renderCertificatePdf(input);
  return renderCertificatePng(input, kind === "png" ? 2 : 1);
}

/** Removes this certificate's files whose key isn't `keep` (all of them when `keep` is null). */
export function removeStale(dir: string, id: string, keep: string | null): void {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (!name.startsWith(`${id}.`)) continue;
    if (keep && (name.startsWith(`${id}.${keep}.`) || name.endsWith(".tmp"))) continue;
    fs.rmSync(path.join(dir, name), { force: true });
  }
}

const inflight = new Map<string, Promise<Buffer>>();

/**
 * The file for this certificate, drawn now if it isn't on disk yet. Returns the bytes.
 * The id must already be a valid certificate code (it becomes part of a file name).
 */
export async function ensureCertificateFile(config: CertificateFilesConfig, row: CertRow, title: string, signature: CertificateSignature | null, kind: CertificateFileKind): Promise<Buffer> {
  if (!isCertificateId(row.id)) throw new Error("not a certificate id");
  const input = inputFor(row, title, signature, config.publicOrigin);
  const key = fileKey(input, row.hash);
  const dir = certificatesDir(config.dataDir);
  const file = path.join(dir, fileName(row.id, key, kind));
  if (fs.existsSync(file)) return fs.readFileSync(file);

  const existing = inflight.get(file);
  if (existing) return existing;
  const job = (async () => {
    const bytes = await draw(input, kind);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, bytes);
    fs.renameSync(tmp, file);
    // Files drawn for an older name, signature or template are no longer what the record says.
    removeStale(dir, row.id, key);
    return bytes;
  })().finally(() => inflight.delete(file));
  inflight.set(file, job);
  return job;
}

/** Draws all three now (on issue, on a name change, on an admin's "Regenerate"). Never throws. */
export async function generateCertificateFiles(config: CertificateFilesConfig, row: CertRow, title: string, signature: CertificateSignature | null): Promise<boolean> {
  try {
    for (const kind of ["pdf", "png", "preview"] as const) await ensureCertificateFile(config, row, title, signature, kind);
    return true;
  } catch {
    return false;
  }
}
