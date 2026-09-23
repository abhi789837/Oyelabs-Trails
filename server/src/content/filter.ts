import type {
  ModuleMeta,
  ServedCodeChallenge,
  ServedModule,
  ServedQuizQuestion,
  ServedTopic,
  TrackMeta,
} from "../../../shared/content";
import type { AuthoredCodeChallenge, AuthoredModule, AuthoredQuizQuestion, AuthoredTopic } from "./store";

/**
 * Everything that decides what a caller is allowed to see.
 *
 * This module is the single choke point for "no answer key reaches a learner" (brief §15), so it
 * builds the served objects field by field rather than spreading the authored one and deleting
 * keys. A spread-and-delete would silently start leaking the day someone adds a field to the
 * authoring type; this will not compile until the new field is handled deliberately.
 */

export interface ViewOptions {
  /**
   * The topic ids this caller may see, or null for "everything" (superadmin).
   * A learner with no published plan has an empty set and therefore sees nothing.
   */
  allowedTopicIds: ReadonlySet<string> | null;
  /** Superadmin only: include correct answers, explanations and hidden tests. */
  includeKeys: boolean;
}

/** Correct answers as a plain list, whether the question is single- or multi-select. */
export function correctIndicesOf(question: AuthoredQuizQuestion): number[] {
  return question.correctIndices && question.correctIndices.length > 1
    ? [...question.correctIndices].sort((a, b) => a - b)
    : [question.correctIndex];
}

export function isMultiSelect(question: AuthoredQuizQuestion): boolean {
  return Array.isArray(question.correctIndices) && question.correctIndices.length > 1;
}

/**
 * How many of a challenge's tests the learner can run in the browser: the first half, but never
 * fewer than three, so there is always enough signal to iterate against (brief §7.2).
 */
export function visibleTestCount(total: number): number {
  return Math.min(total, Math.max(3, Math.floor(total / 2)));
}

function toServedQuestion(question: AuthoredQuizQuestion, includeKeys: boolean): ServedQuizQuestion {
  const base: ServedQuizQuestion = {
    id: question.id,
    prompt: question.prompt,
    options: question.options,
    multi: isMultiSelect(question),
  };
  if (!includeKeys) return base;
  return {
    ...base,
    correctIndices: correctIndicesOf(question),
    explanation: question.explanation,
    ...(question.isEdgeCaseOrInterviewQuestion ? { isEdgeCaseOrInterviewQuestion: true } : {}),
  };
}

function toServedChallenge(challenge: AuthoredCodeChallenge, includeKeys: boolean): ServedCodeChallenge {
  const total = challenge.testCases.length;
  const cut = visibleTestCount(total);
  const visible = challenge.testCases.slice(0, includeKeys ? total : cut);
  return {
    instructions: challenge.instructions,
    starterCode: challenge.starterCode,
    functionName: challenge.functionName,
    visibleTests: visible.map((test) => ({
      args: test.args,
      expected: test.expected,
      description: test.description,
      ...(test.isEdgeCase ? { isEdgeCase: true as const } : {}),
    })),
    hiddenTestCount: includeKeys ? 0 : total - cut,
  };
}

export function toServedTopic(topic: AuthoredTopic, includeKeys: boolean): ServedTopic {
  return {
    id: topic.id,
    moduleId: topic.moduleId,
    trackId: topic.trackId,
    title: topic.title,
    summary: topic.summary,
    level: topic.level,
    estMinutes: topic.estMinutes,
    ...(topic.isMilestone ? { isMilestone: true as const } : {}),
    webRefs: topic.webRefs,
    video: topic.video,
    ...(topic.alternateVideos?.length ? { alternateVideos: topic.alternateVideos } : {}),
    challengeType: topic.challengeType,
    ...(topic.quiz ? { quiz: topic.quiz.map((q) => toServedQuestion(q, includeKeys)) } : {}),
    ...(topic.codeChallenge ? { codeChallenge: toServedChallenge(topic.codeChallenge, includeKeys) } : {}),
  };
}

/**
 * Returns the module as this caller may see it, or null when none of its topics are assigned —
 * which the route turns into a 404, so the response does not reveal that the module exists.
 */
export function toServedModule(mod: AuthoredModule, options: ViewOptions): ServedModule | null {
  const topics = mod.topics.filter((t) => options.allowedTopicIds === null || options.allowedTopicIds.has(t.id));
  if (topics.length === 0) return null;

  return {
    id: mod.id,
    trackId: mod.trackId,
    name: mod.name,
    description: mod.description,
    ...(mod.refs?.length ? { refs: mod.refs } : {}),
    topics: topics.map((t) => toServedTopic(t, options.includeKeys)),
  };
}

/**
 * The manifest, pruned to what this caller may see: topics not in the plan are removed, modules
 * left with no topics are removed, and tracks left with no modules are removed. The sidebar,
 * trail maps, search, dashboard and prev/next all read from this, so pruning here is enough to
 * make the whole UI honest.
 */
export function filterManifest(manifest: TrackMeta[], allowedTopicIds: ReadonlySet<string> | null): TrackMeta[] {
  if (allowedTopicIds === null) return manifest;

  const tracks: TrackMeta[] = [];
  for (const track of manifest) {
    const modules: ModuleMeta[] = [];
    for (const mod of track.modules) {
      const topics = mod.topics.filter((t) => allowedTopicIds.has(t.id));
      if (topics.length === 0) continue;
      modules.push({ ...mod, topics });
    }
    if (modules.length === 0) continue;
    tracks.push({ ...track, modules });
  }
  return tracks;
}
