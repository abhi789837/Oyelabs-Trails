import type { ExtractionMethod } from "../../../../shared/moduleTests";
import { detectFormat, extractByFormat, type ExtractOptions } from "./formats";
import { safeFetch, SafeFetchError, type SafeFetchOptions } from "./fetch";
import { docFetchPlan, looksLikeSignIn } from "./google";
import { sha256, type TextBlock } from "./passages";

/**
 * Reading one module document, uploaded or linked, into text blocks (PLAN §4.3).
 * Every outcome is plain: either blocks, or a reason an admin can act on.
 */

export type DocReadResult =
  | { ok: true; method: ExtractionMethod; blocks: TextBlock[]; inputHash: string; title?: string }
  | { ok: false; reason: string; inputHash: string | null; method: ExtractionMethod | null };

export interface DocReadOptions extends ExtractOptions, SafeFetchOptions {}

/** An uploaded file's bytes (already on disk). `sha` is the upload's sha256, the source's hash. */
export async function readUploadedDoc(body: Uint8Array, mime: string | null, name: string, sha: string, options: DocReadOptions = {}): Promise<DocReadResult> {
  const format = detectFormat(body, mime, name);
  if (!format) return { ok: false, reason: "We can't read this kind of file. Upload a PDF, Word, PowerPoint, Excel, text or Markdown file.", inputHash: sha, method: null };
  try {
    const out = await extractByFormat(format, body, options);
    if (out.blocks.length === 0) return { ok: false, reason: out.emptyReason ?? "We found no text in this file.", inputHash: sha, method: out.method };
    return { ok: true, method: out.method, blocks: out.blocks, inputHash: sha };
  } catch (error) {
    return { ok: false, reason: `We couldn't read this file: ${plainError(error)}`, inputHash: sha, method: null };
  }
}

const PRIVATE_FIX: Record<string, string> = {
  gdoc: "In Google Docs: Share → General access → Anyone with the link → Viewer.",
  gsheet: "In Google Sheets: Share → General access → Anyone with the link → Viewer.",
  gslides: "In Google Slides: Share → General access → Anyone with the link → Viewer.",
  gdrive: "In Google Drive: Share → General access → Anyone with the link → Viewer.",
  onedrive: "In OneDrive: Share → Anyone with the link can view.",
  sharepoint: "In SharePoint: Share → Anyone with the link can view.",
};

/** A linked doc: fetched with no sign-in, then read by what came back. */
export async function readLinkedDoc(url: string, storedFetchUrl: string | null, options: DocReadOptions = {}): Promise<DocReadResult> {
  const plan = docFetchPlan(url);
  const fetchUrl = storedFetchUrl || plan.fetchUrl;
  const expect = fetchUrl === plan.fetchUrl ? plan.expect : null;
  let response;
  try {
    response = await safeFetch(fetchUrl, options);
  } catch (error) {
    return { ok: false, reason: error instanceof SafeFetchError ? error.message : "We couldn't reach that link.", inputHash: null, method: null };
  }
  const fix = PRIVATE_FIX[plan.kind] ?? "Make the link viewable by anyone who has it.";
  if (response.status === 401 || response.status === 403 || looksLikeSignIn(response.url, response.body, response.contentType)) {
    return { ok: false, reason: `This document isn't shared publicly, so we can't read it. ${fix} Then press Regenerate.`, inputHash: null, method: null };
  }
  if (response.status === 404) return { ok: false, reason: "That link points to nothing (not found). Check the link.", inputHash: null, method: null };
  if (response.status >= 400) return { ok: false, reason: `The link answered with an error (${response.status}). Try again later.`, inputHash: null, method: null };

  const inputHash = sha256(response.body);
  const format = expect ?? detectFormat(response.body, response.contentType, response.url);
  if (!format) return { ok: false, reason: "We can't read this kind of file from a link. Link a document or a web page.", inputHash, method: null };
  try {
    const out = await extractByFormat(format, response.body, { ...options, ...(plan.sheetName ? { sheetName: plan.sheetName } : {}) });
    const method: ExtractionMethod = plan.kind.startsWith("g") && plan.kind !== "gdrive" && out.method !== "ocr" ? "google_export" : out.method;
    if (out.blocks.length === 0) return { ok: false, reason: out.emptyReason ?? "We found no text at that link.", inputHash, method };
    return { ok: true, method, blocks: out.blocks, inputHash, ...(out.title ? { title: out.title } : {}) };
  } catch (error) {
    return { ok: false, reason: `We couldn't read that document: ${plainError(error)}`, inputHash, method: null };
  }
}

function plainError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text.replace(/\s+/g, " ").slice(0, 160) || "unknown problem";
}
