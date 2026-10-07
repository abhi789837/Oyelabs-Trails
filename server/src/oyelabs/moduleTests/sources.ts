import fs from "node:fs";

import { and, asc, eq, inArray, sql } from "drizzle-orm";

import type { ExtractionMethod, ModulePassage, ModuleSourceKind, SourceTextStatus } from "../../../../shared/moduleTests";
import type { JobType } from "../../../../shared/enums";
import { schema, type Db } from "../../db";
import type { Env } from "../../env";
import { enqueue } from "../../jobs/queue";
import { newId, now } from "../../lib/ids";
import { createSttClient, type SttClient } from "../../speech/stt";
import { AudioUnavailableError, EMPTY_AUDIO_BYTES, ffmpegChunker, TRANSCRIBE_CHUNK_SEC, type AudioChunker } from "../extract/audio";
import { readLinkedDoc, readUploadedDoc, type DocReadResult } from "../extract/docs";
import { assertPublicUrl, type LookupFn } from "../extract/fetch";
import type { OcrFn } from "../extract/formats";
import { createTesseractOcr } from "../extract/ocr";
import { markdownBlocks, sha256, toPassages, type TextBlock } from "../extract/passages";
import { segmentBlocks, youtubeCaptions } from "../extract/youtube";
import { uploadPath } from "../media/storage";

/**
 * Gathering a module's text (v4.5 Phase 3): one `course_module_texts` row per source, holding its
 * citable passages, how it was read, and the hash of its input.
 *
 * Sources: the module's docs (uploads and links), its videos (YouTube captions, or Whisper over a
 * reachable file), its notes, and the course description. Each is read once per input: an
 * unchanged `content_hash` means it is never read again.
 */

export const NO_TRANSCRIPT_NOTE = "Questions use the docs and notes for this video.";

export interface ExtractDeps {
  db: Db;
  env: Env;
  fetchImpl?: typeof fetch;
  lookup?: LookupFn;
  /** OCR for scanned PDFs. Default: tesseract.js, data cached under DATA_DIR/ocr. */
  ocr?: OcrFn;
  stt?: SttClient;
  chunker?: AudioChunker;
  log?: (message: string) => void;
}

export type TextRow = typeof schema.courseModuleTexts.$inferSelect;
type SectionRow = typeof schema.courseSections.$inferSelect;
type CourseRow = typeof schema.courses.$inferSelect;
type TopicRow = typeof schema.courseTopics.$inferSelect;
export type DocRow = typeof schema.courseDocs.$inferSelect;
export type VideoRow = typeof schema.courseVideos.$inferSelect;

export interface ModuleContext {
  section: SectionRow;
  course: CourseRow;
  /** The module's managed lesson (`kind = 'module'`). */
  topic: TopicRow;
}

export function moduleContext(db: Db, sectionId: string): ModuleContext | null {
  const section = db.select().from(schema.courseSections).where(eq(schema.courseSections.id, sectionId)).get();
  if (!section) return null;
  const course = db.select().from(schema.courses).where(eq(schema.courses.id, section.courseId)).get();
  const topic = db
    .select()
    .from(schema.courseTopics)
    .where(and(eq(schema.courseTopics.sectionId, sectionId), eq(schema.courseTopics.kind, "module")))
    .orderBy(asc(schema.courseTopics.position))
    .get();
  return course && topic ? { section, course, topic } : null;
}

export function moduleContextForTopic(db: Db, topicId: string): ModuleContext | null {
  const topic = db.select().from(schema.courseTopics).where(eq(schema.courseTopics.id, topicId)).get();
  if (!topic || topic.kind !== "module") return null;
  return moduleContext(db, topic.sectionId);
}

export function moduleDocs(db: Db, sectionId: string): DocRow[] {
  return db.select().from(schema.courseDocs).where(eq(schema.courseDocs.sectionId, sectionId)).orderBy(asc(schema.courseDocs.position)).all();
}

export function moduleVideos(db: Db, topicId: string): VideoRow[] {
  return db.select().from(schema.courseVideos).where(eq(schema.courseVideos.topicId, topicId)).orderBy(asc(schema.courseVideos.position)).all();
}

export function textRows(db: Db, sectionId: string): TextRow[] {
  return db.select().from(schema.courseModuleTexts).where(eq(schema.courseModuleTexts.sectionId, sectionId)).all();
}

export function textRow(db: Db, sectionId: string, kind: ModuleSourceKind, sourceId: string): TextRow | undefined {
  return db
    .select()
    .from(schema.courseModuleTexts)
    .where(and(eq(schema.courseModuleTexts.sectionId, sectionId), eq(schema.courseModuleTexts.sourceKind, kind), eq(schema.courseModuleTexts.sourceId, sourceId)))
    .get();
}

export interface TextWrite {
  courseId: string;
  sectionId: string;
  kind: ModuleSourceKind;
  sourceId: string;
  title: string;
  status: SourceTextStatus;
  method: ExtractionMethod | null;
  passages: ModulePassage[];
  contentHash: string | null;
  error: string | null;
}

export function writeText(db: Db, w: TextWrite): void {
  const at = now();
  const values = {
    courseId: w.courseId,
    sectionId: w.sectionId,
    sourceKind: w.kind,
    sourceId: w.sourceId,
    title: w.title.slice(0, 200),
    status: w.status,
    method: w.method,
    passages: w.passages,
    chars: w.passages.reduce((n, p) => n + p.text.length, 0),
    contentHash: w.contentHash,
    error: w.error ? w.error.slice(0, 500) : null,
    updatedAt: at,
  };
  db.insert(schema.courseModuleTexts)
    .values({ id: newId(), ...values })
    .onConflictDoUpdate({ target: [schema.courseModuleTexts.sectionId, schema.courseModuleTexts.sourceKind, schema.courseModuleTexts.sourceId], set: values })
    .run();
}

function touchText(db: Db, id: string): void {
  db.update(schema.courseModuleTexts).set({ updatedAt: now() }).where(eq(schema.courseModuleTexts.id, id)).run();
}

// ---------------------------------------------------------------------------
// Notes and the course description: read inline (no I/O)
// ---------------------------------------------------------------------------

/** Notes and description are plain text already; returns true when either changed. */
export function syncInlineSources(db: Db, ctx: ModuleContext): boolean {
  let changed = false;
  const inline: { kind: "note" | "description"; text: string; title: string }[] = [
    { kind: "note", text: ctx.section.notesText ?? "", title: `${ctx.section.title}: notes` },
    { kind: "description", text: ctx.course.summary ?? "", title: "Course description" },
  ];
  for (const source of inline) {
    const text = source.text.trim();
    const hash = text ? sha256(`${source.kind}:${text}`) : null;
    const existing = textRow(db, ctx.section.id, source.kind, ctx.section.id);
    if (existing && existing.contentHash === hash && existing.title === source.title) continue;
    const passages = text ? toPassages(markdownBlocks(text), { kind: source.kind, id: ctx.section.id, title: source.title }) : [];
    writeText(db, {
      courseId: ctx.course.id,
      sectionId: ctx.section.id,
      kind: source.kind,
      sourceId: ctx.section.id,
      title: source.title,
      status: passages.length ? "done" : "skipped",
      method: "notes",
      passages,
      contentHash: hash,
      error: passages.length ? null : source.kind === "note" ? "No notes yet." : "No course description yet.",
    });
    changed = true;
  }
  return changed;
}

// ---------------------------------------------------------------------------
// Docs
// ---------------------------------------------------------------------------

function docKind(doc: DocRow): ModuleSourceKind {
  return doc.source === "upload" ? "doc" : "doc_link";
}

/** True when a doc's text must be (re)read before the module test can be written. */
export function docNeedsReading(doc: DocRow, row: TextRow | undefined, upload: { sha256: string } | undefined): boolean {
  if (!row || row.status === "pending") return true;
  if (doc.source === "upload") return row.contentHash !== (upload?.sha256 ?? null);
  return row.updatedAt < doc.updatedAt;
}

function setDocTextStatus(db: Db, docId: string, status: SourceTextStatus): void {
  db.update(schema.courseDocs).set({ textStatus: status }).where(eq(schema.courseDocs.id, docId)).run();
}

export type ReadOutcome = "changed" | "unchanged" | "skipped" | "missing";

/** Reads one doc (upload or link) into passages. Never throws for a bad document. */
export async function extractDoc(deps: ExtractDeps, docId: string, options: { force?: boolean } = {}): Promise<ReadOutcome> {
  const { db } = deps;
  const doc = db.select().from(schema.courseDocs).where(eq(schema.courseDocs.id, docId)).get();
  if (!doc) return "missing";
  const kind = docKind(doc);
  const existing = textRow(db, doc.sectionId, kind, doc.id);
  const upload = doc.uploadId ? db.select().from(schema.mediaUploads).where(eq(schema.mediaUploads.id, doc.uploadId)).get() : undefined;
  const title = doc.title || upload?.originalName || doc.url || "Document";

  if (!options.force && existing && !docNeedsReading(doc, existing, upload)) return "unchanged";
  if (doc.source === "upload" && upload && existing?.status === "done" && existing.contentHash === upload.sha256 && existing.title === title) {
    touchText(db, existing.id);
    return "unchanged";
  }

  let ocrSession: ReturnType<typeof createTesseractOcr> | null = null;
  const ocr = deps.ocr ?? ((png: Uint8Array) => (ocrSession ??= createTesseractOcr(deps.env.dataDir)).ocr(png));
  let result: DocReadResult;
  try {
    if (doc.source === "upload") {
      if (!upload || upload.deletedAt) {
        result = { ok: false, reason: "The uploaded file is missing. Upload it again.", inputHash: null, method: null };
      } else {
        const body = await fs.promises.readFile(uploadPath(deps.env, upload.relPath));
        result = await readUploadedDoc(body, upload.mime, upload.originalName, upload.sha256, { ocr });
      }
    } else if (!doc.url) {
      result = { ok: false, reason: "This document has no link.", inputHash: null, method: null };
    } else {
      result = await readLinkedDoc(doc.url, doc.fetchUrl, { ocr, ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}), ...(deps.lookup ? { lookup: deps.lookup } : {}) });
    }
  } catch (error) {
    result = { ok: false, reason: `We couldn't read this document: ${error instanceof Error ? error.message.slice(0, 160) : "unknown problem"}`, inputHash: null, method: null };
  } finally {
    const session = ocrSession as ReturnType<typeof createTesseractOcr> | null;
    await session?.close();
  }

  if (result.ok && existing?.status === "done" && existing.contentHash === result.inputHash && existing.title === title) {
    touchText(db, existing.id);
    setDocTextStatus(db, doc.id, "done");
    return "unchanged";
  }
  const passages = result.ok ? toPassages(result.blocks, { kind, id: doc.id, title }) : [];
  writeText(db, {
    courseId: doc.courseId,
    sectionId: doc.sectionId,
    kind,
    sourceId: doc.id,
    title,
    status: result.ok && passages.length ? "done" : "failed",
    method: result.method,
    passages,
    contentHash: result.inputHash,
    error: result.ok ? (passages.length ? null : "We found no text in it.") : result.reason,
  });
  setDocTextStatus(db, doc.id, result.ok && passages.length ? "done" : "failed");
  deps.log?.(`oyelabs.text.extract ${doc.id}: ${result.ok ? `${passages.length} passages (${result.method})` : result.reason}`);
  return result.ok ? "changed" : "skipped";
}

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

const WHISPER_KINDS = new Set(["upload", "direct", "dropbox"]);

/** What identifies a video's audio: the upload's sha, the file URL, or the YouTube id. */
export function videoInputKey(video: VideoRow, upload: { sha256: string } | undefined): string {
  if (video.kind === "upload") return `upload:${upload?.sha256 ?? video.uploadId ?? ""}`;
  if (video.kind === "youtube") return `youtube:${video.providerId ?? video.inputUrl ?? ""}`;
  return `${video.kind}:${video.playbackUrl ?? video.inputUrl ?? ""}`;
}

export function videoNeedsReading(video: VideoRow, row: TextRow | undefined, upload: { sha256: string } | undefined): boolean {
  if (!row || row.status === "pending") return true;
  return row.contentHash !== sha256(videoInputKey(video, upload));
}

function setTranscriptStatus(db: Db, videoId: string, status: SourceTextStatus): void {
  db.update(schema.courseVideos).set({ transcriptStatus: status }).where(eq(schema.courseVideos.id, videoId)).run();
}

export interface TranscribeStep {
  outcome: ReadOutcome | "continue";
  /** When `continue`: the next chunk's start. */
  nextStartSec?: number;
}

/**
 * One step of a video's transcript. YouTube: the whole caption track at once. Uploads, direct files
 * and Dropbox: one 10-minute window through ffmpeg + Whisper, then `continue` with the next start.
 * Anything else (Drive, OneDrive, Box, Loom, Vimeo, embeds) is not used for questions.
 */
export async function transcribeVideoStep(deps: ExtractDeps, videoId: string, startSec = 0, options: { force?: boolean } = {}): Promise<TranscribeStep> {
  const { db } = deps;
  const video = db.select().from(schema.courseVideos).where(eq(schema.courseVideos.id, videoId)).get();
  if (!video) return { outcome: "missing" };
  const upload = video.uploadId ? db.select().from(schema.mediaUploads).where(eq(schema.mediaUploads.id, video.uploadId)).get() : undefined;
  const existing = textRow(db, video.sectionId, "video", video.id);
  const title = video.title || upload?.originalName || "Video";
  const inputHash = sha256(videoInputKey(video, upload));
  const base = { courseId: video.courseId, sectionId: video.sectionId, kind: "video" as const, sourceId: video.id, title };

  if (startSec === 0 && !options.force && existing && existing.status !== "pending" && existing.contentHash === inputHash) return { outcome: "unchanged" };

  const skip = (reason: string): TranscribeStep => {
    writeText(db, { ...base, status: "skipped", method: null, passages: [], contentHash: inputHash, error: reason });
    setTranscriptStatus(db, video.id, "skipped");
    return { outcome: "skipped" };
  };

  if (video.kind === "youtube") {
    const id = video.providerId;
    const segments = id ? await youtubeCaptions(id, { ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}), ...(deps.lookup ? { lookup: deps.lookup } : {}) }) : null;
    if (!segments?.length) return skip(`No captions we can read. ${NO_TRANSCRIPT_NOTE}`);
    const passages = toPassages(segmentBlocks(segments), { kind: "video", id: video.id, title });
    writeText(db, { ...base, status: "done", method: "captions", passages, contentHash: inputHash, error: null });
    setTranscriptStatus(db, video.id, "done");
    return { outcome: "changed" };
  }
  if (!WHISPER_KINDS.has(video.kind)) return skip(NO_TRANSCRIPT_NOTE);

  // Whisper over a file we can reach.
  let input: string;
  if (video.kind === "upload") {
    if (!upload || upload.deletedAt) return skip(`The uploaded file is missing. ${NO_TRANSCRIPT_NOTE}`);
    input = uploadPath(deps.env, upload.playbackRelPath ?? upload.relPath);
  } else {
    input = video.playbackUrl ?? video.inputUrl ?? "";
    try {
      await assertPublicUrl(input, deps.lookup);
    } catch {
      return skip(`We can't reach this file. ${NO_TRANSCRIPT_NOTE}`);
    }
  }
  const stt = deps.stt ?? createSttClient(deps.env, deps.fetchImpl);
  const chunker = deps.chunker ?? ffmpegChunker();
  const sofar = startSec > 0 && existing?.status === "pending" ? existing.passages : [];
  if (startSec === 0) {
    writeText(db, { ...base, status: "pending", method: "whisper", passages: [], contentHash: null, error: null });
    setTranscriptStatus(db, video.id, "pending");
  }

  let audio: Buffer;
  try {
    audio = await chunker.chunk(input, startSec, TRANSCRIBE_CHUNK_SEC);
  } catch (error) {
    if (error instanceof AudioUnavailableError) return skip(`${error.message} ${NO_TRANSCRIPT_NOTE}`);
    return skip(`We couldn't read the video's sound. ${NO_TRANSCRIPT_NOTE}`);
  }
  const finish = (passages: ModulePassage[]): TranscribeStep => {
    if (passages.length === 0) return skip(`We heard no speech in this video. ${NO_TRANSCRIPT_NOTE}`);
    writeText(db, { ...base, status: "done", method: "whisper", passages, contentHash: inputHash, error: null });
    setTranscriptStatus(db, video.id, "done");
    return { outcome: "changed" };
  };
  if (audio.length < EMPTY_AUDIO_BYTES) return finish(sofar);

  const heard = await stt.transcribe(audio, "audio/ogg");
  if (heard.status !== "done") return skip(`${heard.reason} ${NO_TRANSCRIPT_NOTE}`);
  const blocks = speechBlocks(heard.words, heard.transcript, startSec);
  const passages = [...sofar, ...toPassages(blocks, { kind: "video", id: video.id, title }, sofar.length)];
  const heardSec = heard.durationSec ?? (heard.words.length ? heard.words[heard.words.length - 1].end : 0);
  const knownEnd = video.durationSeconds ?? upload?.durationSeconds ?? null;
  const next = startSec + TRANSCRIBE_CHUNK_SEC;
  const ended = heardSec < TRANSCRIBE_CHUNK_SEC - 1 || (knownEnd !== null && next >= knownEnd);
  if (ended) return finish(passages);
  writeText(db, { ...base, status: "pending", method: "whisper", passages, contentHash: null, error: null });
  return { outcome: "continue", nextStartSec: next };
}

/** Whisper words → sentence-ish blocks with absolute start/end seconds. */
export function speechBlocks(words: { w: string; start: number; end: number }[], transcript: string, offsetSec: number): TextBlock[] {
  if (words.length === 0) return transcript.trim() ? [{ text: transcript.trim(), locator: { startSec: offsetSec } }] : [];
  const blocks: TextBlock[] = [];
  let current: typeof words = [];
  const push = () => {
    if (!current.length) return;
    blocks.push({ text: current.map((w) => w.w).join(" "), locator: { startSec: offsetSec + current[0].start, endSec: offsetSec + current[current.length - 1].end } });
    current = [];
  };
  for (const word of words) {
    current.push(word);
    const text = current.map((w) => w.w).join(" ");
    if ((/[.!?]$/.test(word.w) && text.length > 120) || text.length > 400) push();
  }
  push();
  return blocks;
}

// ---------------------------------------------------------------------------
// Jobs bookkeeping
// ---------------------------------------------------------------------------

/** True when a job of this type for this source is already waiting or running. */
export function jobWaiting(db: Db, type: JobType, key: string, value: string): boolean {
  return (
    (db
      .select({ n: sql<number>`count(*)` })
      .from(schema.jobs)
      .where(and(eq(schema.jobs.type, type), inArray(schema.jobs.status, ["queued", "running"]), sql`json_extract(${schema.jobs.payload}, ${`$.${key}`}) = ${value}`))
      .get()?.n ?? 0) > 0
  );
}

/**
 * Queues reading for every source of a module that needs it. Returns how many are still being read
 * (queued now, already queued, or partway through a transcript).
 */
export function queueStaleSources(db: Db, ctx: ModuleContext, options: { forceLinks?: boolean } = {}): number {
  let waiting = 0;
  const rows = textRows(db, ctx.section.id);
  const byKey = new Map(rows.map((r) => [`${r.sourceKind}:${r.sourceId}`, r]));
  for (const doc of moduleDocs(db, ctx.section.id)) {
    const row = byKey.get(`${docKind(doc)}:${doc.id}`);
    const upload = doc.uploadId ? db.select({ sha256: schema.mediaUploads.sha256 }).from(schema.mediaUploads).where(eq(schema.mediaUploads.id, doc.uploadId)).get() : undefined;
    const force = Boolean(options.forceLinks && doc.source === "link");
    if (!force && !docNeedsReading(doc, row, upload)) continue;
    waiting += 1;
    if (!jobWaiting(db, "oyelabs.text.extract", "sourceId", doc.id)) {
      enqueue(db, { type: "oyelabs.text.extract", payload: { sectionId: ctx.section.id, sourceKind: docKind(doc), sourceId: doc.id, ...(force ? { force: true } : {}) } });
    }
    if (force) setDocTextStatus(db, doc.id, "pending");
  }
  for (const video of moduleVideos(db, ctx.topic.id)) {
    const row = byKey.get(`video:${video.id}`);
    const upload = video.uploadId ? db.select({ sha256: schema.mediaUploads.sha256 }).from(schema.mediaUploads).where(eq(schema.mediaUploads.id, video.uploadId)).get() : undefined;
    if (!videoNeedsReading(video, row, upload)) continue;
    waiting += 1;
    if (!jobWaiting(db, "oyelabs.transcribe", "videoId", video.id)) enqueue(db, { type: "oyelabs.transcribe", payload: { videoId: video.id } });
  }
  return waiting;
}

/** Text rows whose source no longer exists (a removed doc or video) are dropped. */
export function dropOrphanTexts(db: Db, ctx: ModuleContext): void {
  const docIds = new Set(moduleDocs(db, ctx.section.id).map((d) => d.id));
  const videoIds = new Set(moduleVideos(db, ctx.topic.id).map((v) => v.id));
  for (const row of textRows(db, ctx.section.id)) {
    const keep =
      row.sourceKind === "note" || row.sourceKind === "description" ? row.sourceId === ctx.section.id : row.sourceKind === "video" ? videoIds.has(row.sourceId) : docIds.has(row.sourceId);
    if (!keep) db.delete(schema.courseModuleTexts).where(eq(schema.courseModuleTexts.id, row.id)).run();
  }
}
