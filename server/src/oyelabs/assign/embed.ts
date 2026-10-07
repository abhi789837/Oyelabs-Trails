import { createHash } from "node:crypto";

import { eq, inArray } from "drizzle-orm";

import { schema, type Db } from "../../db";
import { listCredentials } from "../../ai/credentials";
import type { AiService } from "../../ai/service";
import { now } from "../../lib/ids";

/**
 * v4.5 Phase 4: course embeddings for catalog matching (PLAN.md §4.4).
 *
 * Two embedders, and vectors are only ever compared within one of them:
 *   - `text-embedding-3-small` (OpenAI) when an OpenAI credential is stored;
 *   - `local-hash-v1` otherwise: a deterministic hashed n-gram embedder, 512 dims. It needs no
 *     network and no key, so matching always works offline and in tests.
 *
 * The local one is cheap enough to compute on the fly, which is what the synchronous callers
 * (the onboarding preview, the weekly plan) do; the stored row is what the async callers use.
 */

export const LOCAL_EMBED_MODEL = "local-hash-v1";
export const LOCAL_EMBED_DIMS = 512;
export const OPENAI_EMBED_MODEL = "text-embedding-3-small";

export interface Embedder {
  model: string;
  embed: (texts: readonly string[]) => Promise<Float32Array[]>;
}

// ---------------------------------------------------------------------------
// Local hashed n-gram embedder
// ---------------------------------------------------------------------------

/** Too common to say anything about what a course is for. */
const STOPWORDS = new Set(
  "a an and are as at be by for from has have he her his how i in is it its of on or our she that the their them they this to was we were what when which who will with you your".split(" "),
);

function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Lowercased words, hyphens split ("white-label" → white, label), stopwords out. */
export function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * Word unigrams (weight 1), word bigrams (0.5) and character trigrams inside each word (0.3),
 * hashed into `dims` buckets with a hashed sign, then L2-normalised. Trigrams let "onboarding" meet
 * "onboard" and "clients" meet "client" without a stemmer.
 */
export function localEmbed(text: string, dims = LOCAL_EMBED_DIMS): Float32Array {
  const vector = new Float32Array(dims);
  const add = (feature: string, weight: number) => {
    const h = fnv1a(feature);
    vector[h % dims] += (h & 0x80000000) !== 0 ? -weight : weight;
  };
  const list = words(text);
  list.forEach((w, i) => {
    add(`w:${w}`, 1);
    if (i + 1 < list.length) add(`b:${w} ${list[i + 1]}`, 0.5);
    const padded = `^${w}$`;
    for (let j = 0; j + 3 <= padded.length; j++) add(`t:${padded.slice(j, j + 3)}`, 0.3);
  });
  return normalise(vector);
}

export const localEmbedder: Embedder = {
  model: LOCAL_EMBED_MODEL,
  embed: async (texts) => texts.map((t) => localEmbed(t)),
};

function normalise(vector: Float32Array): Float32Array {
  let sum = 0;
  for (const v of vector) sum += v * v;
  const norm = Math.sqrt(sum);
  if (norm === 0) return vector;
  for (let i = 0; i < vector.length; i++) vector[i] /= norm;
  return vector;
}

/** Cosine similarity. Different lengths (different models) are a programming error, not a 0. */
export function cosine(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) throw new Error("Vectors from different embedders can't be compared.");
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

export function encodeVector(vector: Float32Array): Buffer {
  const buffer = Buffer.alloc(vector.length * 4);
  vector.forEach((v, i) => buffer.writeFloatLE(v, i * 4));
  return buffer;
}

export function decodeVector(buffer: Buffer): Float32Array {
  const out = new Float32Array(Math.floor(buffer.length / 4));
  for (let i = 0; i < out.length; i++) out[i] = buffer.readFloatLE(i * 4);
  return out;
}

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export function openAiEmbedder(apiKey: string, fetchImpl: FetchLike = fetch as unknown as FetchLike): Embedder {
  return {
    model: OPENAI_EMBED_MODEL,
    embed: async (texts) => {
      if (texts.length === 0) return [];
      const res = await fetchImpl("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: OPENAI_EMBED_MODEL, input: texts.map((t) => t.slice(0, 8000)) }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`The embeddings service answered ${res.status}.`);
      const body = (await res.json()) as { data?: { index: number; embedding: number[] }[] };
      const rows = [...(body.data ?? [])].sort((a, b) => a.index - b.index);
      if (rows.length !== texts.length) throw new Error("The embeddings service returned the wrong number of vectors.");
      return rows.map((row) => normalise(Float32Array.from(row.embedding)));
    },
  };
}

/** True when a usable OpenAI credential is stored (nothing is decrypted to find out). */
export function hasOpenAiCredential(db: Db): boolean {
  return listCredentials(db).some((c) => c.provider === "openai-api" && c.status !== "failed");
}

/**
 * The OpenAI embedder when a working OpenAI credential is stored; the local one otherwise. The key
 * is only ever decrypted inside `AiService.embedTexts` (the one place allowed to, ai.test.ts).
 */
export function resolveEmbedder(db: Db, ai: Pick<AiService, "embedTexts">): Embedder {
  if (!hasOpenAiCredential(db)) return localEmbedder;
  return {
    model: OPENAI_EMBED_MODEL,
    embed: async (texts) => {
      const out = await ai.embedTexts(texts);
      if (!out || out.model !== OPENAI_EMBED_MODEL) throw new Error("No OpenAI credential could be used for embeddings.");
      return out.vectors;
    },
  };
}

// ---------------------------------------------------------------------------
// What a course is about
// ---------------------------------------------------------------------------

/** Title, description, skill names and aliases, module titles and the start of the notes. */
export function courseEmbeddingText(db: Db, courseId: string): string | null {
  const course = db.select({ title: schema.courses.title, summary: schema.courses.summary }).from(schema.courses).where(eq(schema.courses.id, courseId)).get();
  if (!course) return null;
  const skillIds = db.select({ id: schema.courseSkills.skillId }).from(schema.courseSkills).where(eq(schema.courseSkills.courseId, courseId)).all().map((r) => r.id);
  const skills = skillIds.length
    ? db.select({ name: schema.skills.name, aliases: schema.skills.aliases }).from(schema.skills).where(inArray(schema.skills.id, skillIds)).all()
    : [];
  const sections = db
    .select({ title: schema.courseSections.title, notes: schema.courseSections.notesText, position: schema.courseSections.position })
    .from(schema.courseSections)
    .where(eq(schema.courseSections.courseId, courseId))
    .all()
    .sort((a, b) => a.position - b.position);
  return [
    course.title,
    course.summary,
    skills.map((s) => [s.name, ...s.aliases].join(", ")).join("; "),
    sections.map((s) => s.title).join("; "),
    sections.map((s) => s.notes).join(" ").slice(0, 2000),
  ]
    .filter((part) => part.trim().length > 0)
    .join("\n");
}

export const textHash = (text: string) => createHash("sha256").update(text).digest("hex");

/**
 * The `oyelabs.course.embed` job: writes (or refreshes) the course's embedding. Skips when the text
 * and the embedder are unchanged. An OpenAI failure falls back to the local embedder, so the course
 * is always matchable.
 */
export async function embedCourse(
  db: Db,
  embedder: Embedder,
  courseId: string,
  log: (message: string) => void = () => {},
): Promise<"written" | "unchanged" | "missing"> {
  const text = courseEmbeddingText(db, courseId);
  if (text === null) return "missing";
  const hash = textHash(text);
  const existing = db.select({ model: schema.courseEmbeddings.model, textHash: schema.courseEmbeddings.textHash }).from(schema.courseEmbeddings).where(eq(schema.courseEmbeddings.courseId, courseId)).get();
  if (existing && existing.textHash === hash && existing.model === embedder.model) return "unchanged";

  let model = embedder.model;
  let vector: Float32Array;
  try {
    [vector] = (await embedder.embed([text])) as [Float32Array];
  } catch (error) {
    log(`course embed ${courseId}: ${error instanceof Error ? error.message : String(error)}; using ${LOCAL_EMBED_MODEL}`);
    model = LOCAL_EMBED_MODEL;
    vector = localEmbed(text);
    if (existing && existing.textHash === hash && existing.model === model) return "unchanged";
  }
  const row = { model, dims: vector.length, vector: encodeVector(vector), textHash: hash, updatedAt: now() };
  db.insert(schema.courseEmbeddings)
    .values({ courseId, ...row })
    .onConflictDoUpdate({ target: schema.courseEmbeddings.courseId, set: row })
    .run();
  return "written";
}

/** Stored vectors for these courses, by course id. */
export function storedEmbeddings(db: Db, courseIds: readonly string[]): Map<string, { model: string; vector: Float32Array }> {
  if (courseIds.length === 0) return new Map();
  const rows = db.select().from(schema.courseEmbeddings).where(inArray(schema.courseEmbeddings.courseId, [...courseIds])).all();
  return new Map(rows.map((r) => [r.courseId, { model: r.model, vector: decodeVector(r.vector) }]));
}
