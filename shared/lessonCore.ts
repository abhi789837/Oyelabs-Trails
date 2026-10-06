/**
 * v5 lesson player (Phase 3): the rules both sides share. No React, no database.
 *
 * A lesson is one curriculum topic, played as up to four steps: Watch, Read, Do, Check. A topic
 * only gets the steps it has content for (`availableSteps`), and each step has one plain rule for
 * when it counts as done (`stepRequirement`). The server re-checks every "done" claim against its
 * own records before it awards XP; the client uses the same rules to enable Next.
 *
 * zod-free on purpose: the lesson player imports its rules from here so zod stays out of the
 * lesson's first download. The request schemas live in `./lesson`, which re-exports all of this.
 */

export const LESSON_STEP_IDS = ["watch", "read", "do", "check"] as const;
export type LessonStepId = (typeof LESSON_STEP_IDS)[number];

export type StepDone = Record<LessonStepId, boolean>;
export const EMPTY_STEP_DONE: StepDone = { watch: false, read: false, do: false, check: false };

/** Checks run before the full solution (or the worked answer) opens without a trade-off. */
export const SOLUTION_MIN_ATTEMPTS = 3;
/** A Do step finishes after this many checks even when it never passed. */
export const DO_MAX_ATTEMPTS = 3;

// ---------------------------------------------------------------------------
// Which steps a topic has
// ---------------------------------------------------------------------------

/** The parts of a topic (served or authored) that decide its steps. */
export interface LessonTopicShape {
  video?: { videoId?: string } | null;
  alternateVideos?: { videoId?: string }[] | null;
  challengeType: "quiz" | "code";
  quiz?: unknown[] | null;
  codeChallenge?: unknown | null;
  practice?: unknown | null;
  speak?: unknown | null;
}

export function hasVideo(topic: LessonTopicShape): boolean {
  return Boolean(topic.video?.videoId) || (topic.alternateVideos ?? []).some((v) => Boolean(v.videoId));
}

/**
 * Watch when there is a video, Read always (every topic has a summary), Do when there is something
 * to practise (a coding challenge, a hands-on task or a spoken practice), Check when the topic has a
 * quiz-type test.
 */
export function availableSteps(topic: LessonTopicShape): LessonStepId[] {
  const out: LessonStepId[] = [];
  if (hasVideo(topic)) out.push("watch");
  out.push("read");
  if ((topic.challengeType === "code" && topic.codeChallenge) || topic.practice || topic.speak) out.push("do");
  if (topic.challengeType === "quiz" && (topic.quiz?.length ?? 0) > 0) out.push("check");
  return out;
}

/** The first available step that isn't done yet, or the last one when all are done. */
export function resumeStep(available: readonly LessonStepId[], done: Partial<StepDone>): LessonStepId {
  return available.find((s) => !done[s]) ?? available[available.length - 1] ?? "read";
}

/** A step can be opened once every earlier available step is done (the current one always). */
export function canOpenStep(step: LessonStepId, available: readonly LessonStepId[], done: Partial<StepDone>): boolean {
  if (!available.includes(step)) return false;
  for (const s of available) {
    if (s === step) return true;
    if (!done[s]) return false;
  }
  return false;
}

export function lessonComplete(available: readonly LessonStepId[], done: Partial<StepDone>): boolean {
  return available.length > 0 && available.every((s) => Boolean(done[s]));
}

/** Monotonic merge: once a step is done it stays done. */
export function mergeDone(prev: Partial<StepDone>, next: Partial<StepDone>): StepDone {
  return {
    watch: Boolean(prev.watch || next.watch),
    read: Boolean(prev.read || next.read),
    do: Boolean(prev.do || next.do),
    check: Boolean(prev.check || next.check),
  };
}

// ---------------------------------------------------------------------------
// When a step is done (the Next gate)
// ---------------------------------------------------------------------------

export interface StepFacts {
  /** Watch: true when the v4.3 rule lets the learner past the videos (all watched, warn mode, exempt). */
  videosCleared?: boolean;
  /** Read: scrolled to the end or pressed "Mark as read". */
  readToEnd?: boolean;
  /** Do: the practice passed. */
  doPassed?: boolean;
  /** Do: checks run so far. */
  doAttempts?: number;
  /** Do: a spoken-only practice was sent (it never has a pass mark). */
  speakSent?: boolean;
  /** Check: the topic test passed. */
  checkPassed?: boolean;
}

export interface StepRequirement {
  met: boolean;
  /** What's left, in plain words, for the disabled Next button. */
  hint: string;
}

export function stepRequirement(step: LessonStepId, facts: StepFacts): StepRequirement {
  switch (step) {
    case "watch":
      return facts.videosCleared ? { met: true, hint: "" } : { met: false, hint: "Watch the videos to go on" };
    case "read":
      return facts.readToEnd ? { met: true, hint: "" } : { met: false, hint: "Read to the end, or mark it as read" };
    case "do": {
      if (facts.doPassed || facts.speakSent) return { met: true, hint: "" };
      const attempts = facts.doAttempts ?? 0;
      if (attempts >= DO_MAX_ATTEMPTS) return { met: true, hint: "" };
      const left = DO_MAX_ATTEMPTS - attempts;
      return { met: false, hint: `Pass the practice, or check ${left} more ${left === 1 ? "time" : "times"}` };
    }
    case "check":
      return facts.checkPassed ? { met: true, hint: "" } : { met: false, hint: "Pass the test to finish" };
  }
}

/** Whether the v4.3 video rule lets the learner past the Watch step. */
export function videosCleared(videos: { locked: boolean; exempt: string | null; watchedCount: number; total: number; lockMode: string } | null | undefined): boolean {
  if (!videos) return false;
  if (videos.exempt || videos.total === 0 || videos.watchedCount >= videos.total) return true;
  return videos.lockMode === "warn" || !videos.locked;
}

// ---------------------------------------------------------------------------
// Time left
// ---------------------------------------------------------------------------

/** Rough share of a lesson's time each step takes, normalised over the steps a topic has. */
export const STEP_WEIGHT: Record<LessonStepId, number> = { watch: 0.4, read: 0.2, do: 0.3, check: 0.1 };

export function minutesLeft(estMinutes: number, available: readonly LessonStepId[], done: Partial<StepDone>): number {
  if (!(estMinutes > 0) || available.length === 0) return 0;
  const total = available.reduce((sum, s) => sum + STEP_WEIGHT[s], 0);
  const left = available.filter((s) => !done[s]).reduce((sum, s) => sum + STEP_WEIGHT[s], 0);
  return Math.max(0, Math.round((estMinutes * left) / total));
}

// ---------------------------------------------------------------------------
// XP for a step
// ---------------------------------------------------------------------------

/**
 * The Do step's XP when the learner asked for the solution before their third check: half. After
 * three checks the solution is free (they earned it by trying).
 */
export function solutionCostsXp(attemptsAtReveal: number): boolean {
  return attemptsAtReveal < SOLUTION_MIN_ATTEMPTS;
}

export function halveXp(xp: number): number {
  return Math.floor(xp / 2);
}

// ---------------------------------------------------------------------------
// Hint ladder for a coding Do step (no AI needed)
// ---------------------------------------------------------------------------

export interface CodeHintInput {
  instructions: string;
  starterCode: string;
  functionName: string;
  /** The topic summary, for the "idea behind it" hint. */
  summary: string;
  /** Visible check descriptions, in order, with whether they're extra (edge) checks. */
  checks: { description: string; isEdgeCase?: boolean }[];
  /** The first check that failed in the latest run, if any. */
  firstFailing?: string | null;
}

export interface CodeHints {
  nudge: string;
  concept: string;
  partial: string;
}

/** First sentence of a block of text (Markdown markers stripped), or "" when there is none. */
export function firstSentence(text: string): string {
  const clean = stripInline(text).replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const m = /^(.{12,320}?[.!?])(\s|$)/.exec(clean);
  return (m ? m[1] : clean.slice(0, 220)).trim();
}

/** Removes the content Markdown subset's inline markers and term links. */
export function stripInline(text: string): string {
  return text
    .replace(/\[\[term:([a-z0-9-]+)\|([^\]]+)\]\]/gi, "$2")
    .replace(/\[\[term:([a-z0-9-]+)\]\]/gi, (_m, id: string) => id.replace(/-/g, " "))
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(?<!\*)\*(?!\s)([^*\n]+?)\*(?!\*)/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

/**
 * Three rungs: a nudge (what to look at), the idea (one sentence of the lesson), and part of the
 * code (the starter with a commented plan built from the checks). None of them is the answer.
 */
export function codeHints(input: CodeHintInput): CodeHints {
  const target = input.firstFailing ?? input.checks.find((c) => !c.isEdgeCase)?.description ?? null;
  const nudge = target
    ? `Start with one check: "${target}". Work out by hand what ${input.functionName} should return for it, then make just that case pass.`
    : `Re-read the first line of the task. What does ${input.functionName} take in, and what must it give back?`;
  const concept = firstSentence(input.summary) || firstSentence(input.instructions);
  const plan = input.checks.slice(0, 5).map((c) => `  // - ${c.description}`);
  const partial = withPlan(input.starterCode, input.functionName, plan);
  return { nudge, concept, partial };
}

function withPlan(starter: string, functionName: string, plan: string[]): string {
  const comment = ["  // A plan, one check at a time:", ...plan, "  // Handle the simplest case first, then the rest."].join("\n");
  const lines = starter.split("\n");
  const at = lines.findIndex((l) => l.includes(functionName) && l.includes("{"));
  if (at === -1) return `${comment}\n${starter}`;
  return [...lines.slice(0, at + 1), comment, ...lines.slice(at + 1)].join("\n");
}

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------

export type ShortcutAction = "togglePlay" | "back10" | "forward10" | "back5" | "forward5" | "note" | "focus" | "help";

export interface ShortcutDef {
  keys: string[];
  action: ShortcutAction;
  label: string;
  /** Only on the Watch step. */
  watchOnly: boolean;
}

export const LESSON_SHORTCUTS: readonly ShortcutDef[] = [
  { keys: ["Space", "K"], action: "togglePlay", label: "Play or pause", watchOnly: true },
  { keys: ["J"], action: "back10", label: "Back 10 seconds", watchOnly: true },
  { keys: ["L"], action: "forward10", label: "Forward 10 seconds", watchOnly: true },
  { keys: ["←"], action: "back5", label: "Back 5 seconds", watchOnly: true },
  { keys: ["→"], action: "forward5", label: "Forward 5 seconds", watchOnly: true },
  { keys: ["N"], action: "note", label: "Add a note at this moment", watchOnly: true },
  { keys: ["F"], action: "focus", label: "Focus mode on or off", watchOnly: false },
  { keys: ["?"], action: "help", label: "Show these shortcuts", watchOnly: false },
];

export interface KeyEventLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  /** The focused element's tag, upper case ("INPUT"). */
  targetTag?: string;
  /** The focused element's role attribute. */
  targetRole?: string | null;
  targetEditable?: boolean;
}

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);
const PRESSABLE_TAGS = new Set(["BUTTON", "A", "SUMMARY"]);
const PRESSABLE_ROLES = new Set(["button", "link", "switch", "tab", "radio", "checkbox", "menuitem", "option", "slider"]);

/**
 * The action for a key press, or null. Never fires while typing, with Ctrl/Cmd/Alt held, or for
 * Space on something Space already presses (a button, a checkbox). Player keys only on Watch.
 */
export function shortcutFor(event: KeyEventLike, step: LessonStepId): ShortcutAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.targetEditable || (event.targetTag && TYPING_TAGS.has(event.targetTag))) return null;
  const key = event.key;
  let action: ShortcutAction | null = null;
  if (key === "?") action = "help";
  else if (key === "f" || key === "F") action = "focus";
  else if (key === " " || key === "Spacebar" || key === "k" || key === "K") action = "togglePlay";
  else if (key === "j" || key === "J") action = "back10";
  else if (key === "l" || key === "L") action = "forward10";
  else if (key === "ArrowLeft") action = "back5";
  else if (key === "ArrowRight") action = "forward5";
  else if (key === "n" || key === "N") action = "note";
  if (!action) return null;
  const def = LESSON_SHORTCUTS.find((s) => s.action === action)!;
  if (def.watchOnly && step !== "watch") return null;
  const pressable = (event.targetTag && PRESSABLE_TAGS.has(event.targetTag)) || (event.targetRole && PRESSABLE_ROLES.has(event.targetRole));
  if (pressable && (key === " " || key === "Spacebar")) return null;
  // Arrow keys move sliders, radios and tabs; leave them alone there.
  if (pressable && (key === "ArrowLeft" || key === "ArrowRight") && event.targetRole && event.targetRole !== "button" && event.targetRole !== "link") return null;
  return action;
}

// ---------------------------------------------------------------------------
// Reading: passages, takeaways, glossary, reading time
// ---------------------------------------------------------------------------

/**
 * Splits a body into paragraphs on blank lines, keeping a fenced code block whole. Mirrors the
 * server's grounding split (`server/src/topicTests/grounding.ts` `paragraphs`), so passage ids
 * (`sum.p1`, `s2.p3`) on the page match the ids the tutor cites.
 */
export function passageChunks(body: string): string[] {
  const out: string[] = [];
  let current: string[] = [];
  let inFence = false;
  for (const line of body.replace(/\r\n/g, "\n").split("\n")) {
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

export interface LessonPassage {
  id: string;
  heading: string | null;
  text: string;
}

/** Summary paragraphs `sum.pN`, then each section's paragraphs `sS.pN`. */
export function lessonPassages(summary: string, sections: readonly { heading: string; body: string }[] = []): LessonPassage[] {
  const out: LessonPassage[] = passageChunks(summary).map((text, i) => ({ id: `sum.p${i + 1}`, heading: null, text }));
  sections.forEach((section, s) => {
    passageChunks(section.body).forEach((text, p) => out.push({ id: `s${s + 1}.p${p + 1}`, heading: section.heading, text }));
  });
  return out;
}

/**
 * A paragraph's lead for a takeaway: its first sentence, or the first two when the first is a short
 * set-up line ("The stack is finite.") that says little on its own (UX review RD1).
 */
function takeawayLead(text: string): string {
  const first = firstSentence(text);
  if (first.split(/\s+/).filter(Boolean).length >= 6) return first;
  const clean = stripInline(text).replace(/\s+/g, " ").trim();
  const rest = clean.startsWith(first) ? clean.slice(first.length).trim() : "";
  const next = rest ? firstSentence(rest) : "";
  return next ? `${first} ${next}` : first;
}

/** Up to `max` takeaways: the lead of each summary paragraph, then of each section. */
export function extractTakeaways(summary: string, sections: readonly { heading: string; body: string }[] = [], max = 4): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    const t = s.trim();
    if (t.length < 12 || seen.has(t.toLowerCase())) return;
    seen.add(t.toLowerCase());
    out.push(t);
  };
  for (const para of passageChunks(summary)) {
    if (/^\s*```/.test(para) || /^\s*[-*] |^\s*\d+[.)] /.test(para)) continue;
    push(takeawayLead(calloutOf(para)?.body ?? para));
    if (out.length >= max) return out;
  }
  for (const section of sections) {
    const first = passageChunks(section.body).find((p) => !/^\s*```/.test(p));
    push(first ? takeawayLead(calloutOf(first)?.body ?? first) : stripInline(section.heading));
    if (out.length >= max) return out;
  }
  return out;
}

/** Words per minute for the "8 min read" estimate. */
export const READING_WPM = 230;

export function readingMinutes(text: string): number {
  const words = stripInline(text).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / READING_WPM));
}

export type CalloutKind = "tip" | "warning" | "oyelabs" | "note";

/** A paragraph that opens with "Tip:", "Watch out:", "At Oyelabs:" or "Note:" is shown as a callout. */
export function calloutOf(paragraph: string): { kind: CalloutKind; body: string } | null {
  const m = /^\s*(?:\*\*)?(tip|warning|watch out|gotcha|at oyelabs|note)(?:\*\*)?\s*:\s*(?:\*\*)?\s*/i.exec(paragraph);
  if (!m) return null;
  const word = m[1].toLowerCase();
  const kind: CalloutKind = word === "tip" ? "tip" : word === "at oyelabs" ? "oyelabs" : word === "note" ? "note" : "warning";
  return { kind, body: paragraph.slice(m[0].length).trim() };
}

export interface GlossaryEntryLike {
  id: string;
  name: string;
  aka?: readonly string[];
}

export type GlossarySegment = { kind: "text"; text: string } | { kind: "term"; text: string; termId: string };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Lowercased phrase → term id, longest phrases first. Phrases under 3 letters are ignored. */
export function glossaryPhrases(terms: readonly GlossaryEntryLike[]): { phrase: string; termId: string }[] {
  const out: { phrase: string; termId: string }[] = [];
  const seen = new Set<string>();
  for (const t of terms) {
    for (const p of [t.name, ...(t.aka ?? [])]) {
      const phrase = p.trim().toLowerCase();
      if (phrase.length < 3 || seen.has(phrase)) continue;
      seen.add(phrase);
      out.push({ phrase, termId: t.id });
    }
  }
  return out.sort((a, b) => b.phrase.length - a.phrase.length);
}

/**
 * Marks the first occurrence of each glossary term in `text`, skipping terms already in `used`
 * (which is updated), so a term gets one tooltip per article. Whole words only, case-insensitive.
 */
export function matchGlossary(text: string, phrases: readonly { phrase: string; termId: string }[], used: Set<string>): GlossarySegment[] {
  const candidates = phrases.filter((p) => !used.has(p.termId));
  if (!candidates.length || !text) return [{ kind: "text", text }];
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${candidates.map((p) => escapeRegExp(p.phrase)).join("|")})(?![\\p{L}\\p{N}])`, "giu");
  const out: GlossarySegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const hit = candidates.find((p) => p.phrase === m![1].toLowerCase());
    if (!hit || used.has(hit.termId)) continue;
    used.add(hit.termId);
    if (m.index > last) out.push({ kind: "text", text: text.slice(last, m.index) });
    out.push({ kind: "term", text: m[1], termId: hit.termId });
    last = m.index + m[1].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out.length ? out : [{ kind: "text", text }];
}

/** Code fence languages that get a "Try it" runner, and how they run. */
export function runnableKind(lang: string): "script" | "page" | null {
  const l = lang.toLowerCase();
  if (["js", "javascript", "mjs", "ts", "typescript"].includes(l)) return "script";
  if (["html", "css"].includes(l)) return "page";
  return null;
}

/** The iframe document for an HTML or CSS snippet preview. Scripts never run in it (sandbox=""). */
export function previewDocument(lang: string, code: string): string {
  if (lang.toLowerCase() === "css") {
    return `<!doctype html><html><head><meta charset="utf-8"><style>${code.replace(/<\/style/gi, "<\\/style")}</style></head><body><h1>Heading</h1><p>A paragraph with <a href="#">a link</a>.</p><button>Button</button><div class="box">.box</div></body></html>`;
  }
  return /<html[\s>]/i.test(code) ? code : `<!doctype html><html><head><meta charset="utf-8"></head><body>${code}</body></html>`;
}

/** "Last checked 3 Oct 2026" from an ISO date, or null when it's missing or unreadable. */
export function verifiedLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// ---------------------------------------------------------------------------
// Tutor ("Ask Oye")
// ---------------------------------------------------------------------------

export const TUTOR_CAP_KEY = "tutor.daily_cap";
export const TUTOR_DEFAULT_DAILY_CAP = 30;
export const TUTOR_QUESTION_MAX = 1000;
export const TUTOR_CODE_MAX = 8000;

/** Start of the UTC day containing `nowMs`: the daily cap resets at 00:00 UTC. */
export function dayStartUtc(nowMs: number): number {
  const d = new Date(nowMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Questions asked today, from their timestamps. */
export function countToday(createdAt: readonly number[], nowMs: number): number {
  const start = dayStartUtc(nowMs);
  return createdAt.filter((t) => t >= start && t <= nowMs + 60_000).length;
}

export function capLeft(usedToday: number, cap: number): number {
  return Math.max(0, cap - usedToday);
}

/** Reads the admin's cap from app_meta text; falls back to the default for anything odd. */
export function parseCap(raw: string | null | undefined): number {
  if (raw === null || raw === undefined || raw.trim() === "") return TUTOR_DEFAULT_DAILY_CAP;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= 1000 ? n : TUTOR_DEFAULT_DAILY_CAP;
}


export interface TutorCitation {
  passageId: string;
  /** The section heading, or "Summary". */
  heading: string;
  quote: string;
}

export interface TutorMessageView {
  id: string;
  step: LessonStepId | null;
  question: string;
  answer: string;
  citations: TutorCitation[];
  rating: -1 | 0 | 1;
  createdAt: number;
}

export interface TutorStatus {
  /** False when no AI is set up. */
  available: boolean;
  /** Why it can't be used right now, in plain words; null when it can. */
  reason: string | null;
  cap: number;
  usedToday: number;
  left: number;
  messages: TutorMessageView[];
}

export interface TutorAnswerResponse {
  message: TutorMessageView;
  left: number;
}


export interface TutorQualityReport {
  total: number;
  helpful: number;
  unhelpful: number;
  unrated: number;
  last7Days: number;
  unhelpfulAnswers: { id: string; topicId: string; topicTitle: string; learnerName: string; step: string | null; question: string; answer: string; createdAt: number }[];
}

// ---------------------------------------------------------------------------
// API shapes
// ---------------------------------------------------------------------------


export interface LessonFacts {
  codeAttempts: number;
  codePassed: boolean;
  quizPassed: boolean;
  /** The learner traded XP to see the solution early. */
  solutionTraded: boolean;
}

export interface LessonStateView {
  topicId: string;
  step: LessonStepId;
  stepDone: StepDone;
  videoId: string | null;
  positionSec: number | null;
  available: LessonStepId[];
  complete: boolean;
  minutesLeft: number;
  facts: LessonFacts;
  updatedAt: number | null;
}

export interface XpAward {
  kind: string;
  xp: number;
}

export interface LessonStatePutResponse {
  state: LessonStateView;
  awarded: XpAward[];
  /** True only on the save that finished the lesson. */
  justCompleted: boolean;
}

/** `GET /api/v5/lessons/resume`, for Today. */
export interface LessonResume {
  topicId: string;
  title: string;
  step: LessonStepId;
  positionSec: number | null;
  minutesLeft: number;
  /** The weekly-plan lane the topic sits in this week, or null. */
  lane: "do_now" | "must_know" | "medium" | "low" | null;
}

export interface QuickCheckQuestion {
  id: string;
  prompt: string;
  options: string[];
  multi: boolean;
}

export interface QuickCheckResponse {
  questions: QuickCheckQuestion[];
}


export interface QuickCheckResult {
  passed: boolean;
  results: { id: string; correct: boolean; correctIndices: number[]; explanation: string }[];
  awarded: XpAward[];
}


export interface RunSnippetResponse {
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface RunChecksResponse {
  results: { description: string; passed: boolean; isEdgeCase: boolean; expected?: string; actual?: string; error?: string }[];
  passedCount: number;
  total: number;
  compileError?: string;
  timedOut: boolean;
}


export interface SolutionResponse {
  /** A solution checked against every test, or null when we don't have one. */
  code: string | null;
  explanation: string | null;
  /** When `code` is null: why, in plain words. */
  message: string | null;
  traded: boolean;
}

// Notes

export const NOTE_BODY_MAX = 2000;

export interface LessonNote {
  id: string;
  topicId: string;
  videoId: string | null;
  atSec: number | null;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface LessonNoteWithTopic extends LessonNote {
  topicTitle: string;
}

/** Timestamped notes first, by time; then the rest, newest first. */
export function sortNotes<T extends Pick<LessonNote, "atSec" | "createdAt">>(notes: readonly T[]): T[] {
  return [...notes].sort((a, b) => {
    if (a.atSec !== null && b.atSec !== null) return a.atSec - b.atSec;
    if (a.atSec !== null) return -1;
    if (b.atSec !== null) return 1;
    return b.createdAt - a.createdAt;
  });
}

// Problems

export const PROBLEM_MESSAGE_MAX = 1000;

export interface ProblemReportView {
  id: string;
  topicId: string;
  topicTitle: string;
  step: LessonStepId | null;
  message: string;
  status: "open" | "resolved";
  createdAt: number;
  reporter: { id: string; displayName: string };
  resolvedBy: string | null;
  resolvedAt: number | null;
}

export interface ProblemListResponse {
  problems: ProblemReportView[];
  openCount: number;
}
