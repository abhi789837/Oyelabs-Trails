// v2 curriculum model: tracks are made of modules ("camps"), modules of topics.
import type { TopicHandbookRefs, TopicInteractive, TopicSection } from "@shared/content";
import type { SpeakPractice } from "@shared/softSkills";
import type { Task } from "@shared/tasks";

export type ChallengeType = "code" | "quiz";
export type TopicLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type TrackId = "frontend" | "backend" | "fullstack" | "ai-driven" | "php" | "mobile" | "devops" | "pm" | "bd" | "soft";

/**
 * `glacier` extends the brief's tokens: the brief assigns `ridge` to both Full-Stack and
 * AI-Driven while also reserving it for AI-Driven only, so Full-Stack gets its own accent.
 */
export type AccentToken =
  | "trailmark"
  | "summit"
  | "ridge"
  | "glacier"
  | "basalt"
  /** Added for the v3 tracks. Hues chosen to sit clear of the five above on the colour wheel. */
  | "canyon"
  | "alpenglow"
  | "lichen";

export type ResourceKind = "docs" | "article" | "interview-prep" | "spec" | "repo";

export interface TopicResource {
  /** e.g. "MDN: Closures" or "javascript.info: Closure" */
  label: string;
  url: string;
  kind: ResourceKind;
  /** v4.1: ISO time the link last returned HTTP 200 with the right page. */
  verifiedAt?: string;
}

export interface VideoResource {
  title: string;
  channel: string;
  /** Full https://www.youtube.com/watch?v=... URL (or a results URL only as a flagged fallback). */
  url: string;
  /** Just the id, used to build the embed URL. Empty string for search-URL fallbacks. */
  videoId: string;
  /** Deep-link into a specific chapter of a long video. */
  startSeconds?: number;
  /** Chapter name shown when `startSeconds` is set, e.g. "Chapter 7: Flexbox". */
  chapterLabel?: string;
  /** e.g. "19:11" or "7:44:20", for display only. */
  durationLabel?: string;
  /** v4.1: ISO time the video last passed the oEmbed check. */
  verifiedAt?: string;
}

export interface QuizQuestion {
  id: string;
  /** Supports the content Markdown subset: `inline code`, fenced ```js blocks, "- " bullets. */
  prompt: string;
  options: string[];
  /** For multi-select questions this mirrors correctIndices[0]; grading uses correctIndices. */
  correctIndex: number;
  /** Present only for multi-select questions (two or more correct options). */
  correctIndices?: number[];
  explanation: string;
  isEdgeCaseOrInterviewQuestion?: boolean;
}

export interface CodeTestCase {
  args: unknown[];
  expected: unknown;
  description: string;
  isEdgeCase?: boolean;
}

export interface CodeChallenge {
  instructions: string;
  starterCode: string;
  functionName: string;
  testCases: CodeTestCase[];
}

export interface Topic {
  id: string;
  moduleId: string;
  trackId: TrackId;
  title: string;
  /** Senior-level framing: why it exists, tradeoffs, when to use it, a gotcha. Paragraphs split by blank lines. */
  summary: string;
  level: TopicLevel;
  estMinutes: number;
  isMilestone?: boolean;
  /** 2–4 references; the first is normally the official docs or spec. */
  webRefs: TopicResource[];
  video: VideoResource;
  alternateVideos?: VideoResource[];
  challengeType: ChallengeType;
  quiz?: QuizQuestion[];
  codeChallenge?: CodeChallenge;
  /**
   * v4: a hands-on task for departments that do not write code (PM, BD). Formative — the graded
   * challenge is still the quiz — so answers ship with it and are revealed after a check.
   */
  practice?: Task;
  /**
   * v4.4: a spoken practice (soft skills). Phase 3's Speak recorder plays it; until then `practice`
   * carries the same task in writing (`speak.writtenFallback`).
   */
  speak?: SpeakPractice;
  /**
   * v4.1: Oyelabs-specific procedures nobody outside the company can know (Keka settings, meeting
   * and email templates). Shown as "[Oyelabs SOP – admin to fill]" blocks until an admin fills them.
   */
  sop?: { title: string; prompt: string }[];
  /** v4.2: a handbook tool rendered after the summary. */
  interactive?: TopicInteractive;
  /** v4.2: structured guide sections after the summary (agenda, script, worked example…). */
  sections?: TopicSection[];
  /** v4.2: handbook stages, rules and templates shown live on the topic, by id. */
  handbook?: TopicHandbookRefs;
}

export interface Module {
  id: string;
  trackId: TrackId;
  name: string;
  description: string;
  /** Module-level reading list from the brief ("Module refs"). */
  refs?: TopicResource[];
  topics: Topic[];
}

export interface Track {
  id: TrackId;
  name: string;
  tagline: string;
  accentToken: AccentToken;
  modules: Module[];
}
