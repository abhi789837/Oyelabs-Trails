import { createHash } from "node:crypto";

import type {
  GroundingObjective,
  GroundingPassage,
  GroundingVideo,
  TopicGroundingContent,
} from "../../../shared/topicTests";
import type { AuthoredQuizQuestion, AuthoredTopic, AuthoredVideo } from "../content/store";

/**
 * The grounding source for a topic's test (v4.3 Phase 5).
 *
 * Grounded generation (Lewis et al. 2020, RAG; RESEARCH §5) only works if the generator is given the
 * teaching text and nothing else, and if every item can point back to the exact passage it came
 * from. So the topic's summary and sections are split into small numbered passages with stable ids
 * (`sum.p1`, `s2.p3`), and the generator must cite one by id with an exact quote.
 *
 * Videos are listed but never used as grounding: there is no approved way to read another creator's
 * captions (the Data API's `captions.download` needs edit rights on the video, and the YouTube ToS
 * forbids scraping; RESEARCH §4). Each video therefore carries `transcript: "none"` and
 * `usedForQuestions: false`, so the test never claims to check something the generator never saw.
 */

const SUMMARY_HEADING = "Summary";

/** `[[term:id|label]]` → label, `[[term:id]]` → the id in words: what a learner reads on the page. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/\[\[term:([a-z0-9-]+)\|([^\]]+)\]\]/gi, "$2")
    .replace(/\[\[term:([a-z0-9-]+)\]\]/gi, (_m, id: string) => id.replace(/-/g, " "))
    .replace(/\r\n/g, "\n");
}

/** Whitespace-normalised, for the "exact substring" check: collapses runs of whitespace, trims. */
export function normaliseWs(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Splits a body into paragraphs on blank lines. A list or a code block stays one paragraph. */
export function paragraphs(body: string): string[] {
  const out: string[] = [];
  let current: string[] = [];
  let inFence = false;
  for (const line of plainText(body).split("\n")) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (!inFence && line.trim() === "") {
      if (current.length) out.push(current.join("\n").trim());
      current = [];
      continue;
    }
    current.push(line);
  }
  if (current.length) out.push(current.join("\n").trim());
  return out.filter((p) => p.length > 0);
}

export function buildPassages(topic: Pick<AuthoredTopic, "summary" | "sections">): GroundingPassage[] {
  const passages: GroundingPassage[] = [];
  paragraphs(topic.summary).forEach((text, i) => {
    passages.push({ id: `sum.p${i + 1}`, source: "summary", heading: SUMMARY_HEADING, text });
  });
  (topic.sections ?? []).forEach((section, s) => {
    paragraphs(section.body).forEach((text, p) => {
      passages.push({ id: `s${s + 1}.p${p + 1}`, source: "section", heading: plainText(section.heading).trim(), text });
    });
  });
  return passages;
}

/**
 * Learning objectives. The content has no explicit objectives field today, so they are derived:
 * one from the summary's opening sentence (what the topic is for) and one per section heading.
 * If a topic ever gains `objectives: string[]`, those are used as written.
 */
export function deriveObjectives(topic: AuthoredTopic): GroundingObjective[] {
  const explicit = (topic as AuthoredTopic & { objectives?: unknown }).objectives;
  if (Array.isArray(explicit) && explicit.every((o) => typeof o === "string") && explicit.length > 0) {
    return (explicit as string[]).map((text, i) => ({ id: `o${i + 1}`, text, source: "explicit" }));
  }
  const objectives: GroundingObjective[] = [];
  const firstSentence = normaliseWs(plainText(topic.summary)).match(/^(.{20,300}?[.!?])(\s|$)/)?.[1];
  objectives.push({
    id: "o1",
    text: `Explain the core idea of ${topic.title}${firstSentence ? `: ${firstSentence}` : ""}`,
    source: "derived",
  });
  const summaryParagraphs = paragraphs(topic.summary);
  if (summaryParagraphs.length > 1) {
    objectives.push({ id: `o${objectives.length + 1}`, text: `Apply ${topic.title} to the trade-offs and pitfalls the summary describes`, source: "derived" });
  }
  for (const section of topic.sections ?? []) {
    objectives.push({ id: `o${objectives.length + 1}`, text: `Use: ${plainText(section.heading).trim()}`, source: "derived" });
  }
  return objectives;
}

function videoEntries(topic: AuthoredTopic): GroundingVideo[] {
  const all: AuthoredVideo[] = [topic.video, ...(topic.alternateVideos ?? [])].filter(Boolean);
  const seen = new Set<string>();
  const out: GroundingVideo[] = [];
  for (const video of all) {
    if (!video.videoId || seen.has(video.videoId)) continue;
    seen.add(video.videoId);
    out.push({
      videoId: video.videoId,
      title: video.title,
      channel: video.channel,
      transcript: "none",
      usedForQuestions: false,
      note: "Not used for questions: no transcript is read (YouTube ToS). Any AI notes would come from the title and description only.",
    });
  }
  return out;
}

export function sha(value: unknown): string {
  return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex").slice(0, 32);
}

export function buildGrounding(topic: AuthoredTopic): TopicGroundingContent {
  const passages = buildPassages(topic);
  return {
    version: 1,
    topicId: topic.id,
    title: topic.title,
    level: topic.level,
    passages,
    objectives: deriveObjectives(topic),
    videos: videoEntries(topic),
    passagesHash: sha(passages.map((p) => [p.id, p.heading, p.text])),
  };
}

/** Hash of one static question as authored; a change means the content file was edited. */
export function questionHash(question: AuthoredQuizQuestion): string {
  return sha([question.prompt, question.options, question.correctIndex, question.correctIndices ?? null, question.explanation]);
}

/**
 * What decides whether a topic's grounding and static import need refreshing: the teaching text,
 * the level, the videos and the static quiz. Stored in `topic_grounding.hash`.
 */
export function topicHash(topic: AuthoredTopic): string {
  return sha({
    v: 1,
    title: topic.title,
    level: topic.level,
    summary: topic.summary,
    sections: topic.sections ?? [],
    videos: [topic.video?.videoId, ...(topic.alternateVideos ?? []).map((v) => v.videoId)],
    quiz: (topic.quiz ?? []).map((q) => [q.id, questionHash(q)]),
  });
}

/** The relevance gate's code half: the quote must be an exact (whitespace-normalised) substring of the cited passage. */
export function citationProblem(
  grounding: Pick<TopicGroundingContent, "passages">,
  citation: { passageId: string; quote: string } | null | undefined,
): string | null {
  if (!citation) return "no citation";
  const passage = grounding.passages.find((p) => p.id === citation.passageId);
  if (!passage) return `cited passage ${citation.passageId} is not in this topic`;
  const quote = normaliseWs(citation.quote);
  if (quote.length < 8) return "the quote is too short to prove anything";
  if (!normaliseWs(passage.text).includes(quote)) return `the quote is not in passage ${citation.passageId}`;
  return null;
}
