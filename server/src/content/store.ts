import fs from "node:fs";
import path from "node:path";

import type { ModuleMeta, TopicMeta, TrackMeta } from "../../../shared/content";
import type { AccentTokenValue } from "../../../shared/content";
import type { TrackIdValue } from "../../../shared/enums";

/**
 * The authoring shape, as written to server/content/<track>/<module>.json by
 * scripts/content/build-server-content.mjs. This mirrors `Module` in src/types/curriculum.ts;
 * it is repeated here rather than imported so the server bundle stays free of SPA source.
 */
export interface AuthoredQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  correctIndices?: number[];
  explanation: string;
  isEdgeCaseOrInterviewQuestion?: boolean;
}

export interface AuthoredTestCase {
  args: unknown[];
  expected: unknown;
  description: string;
  isEdgeCase?: boolean;
}

export interface AuthoredCodeChallenge {
  instructions: string;
  starterCode: string;
  functionName: string;
  testCases: AuthoredTestCase[];
}

export interface AuthoredVideo {
  title: string;
  channel: string;
  url: string;
  videoId: string;
  startSeconds?: number;
  chapterLabel?: string;
  durationLabel?: string;
}

export interface AuthoredResource {
  label: string;
  url: string;
  kind: "docs" | "article" | "interview-prep" | "spec" | "repo";
}

export interface AuthoredTopic {
  id: string;
  moduleId: string;
  trackId: TrackIdValue;
  title: string;
  summary: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  estMinutes: number;
  isMilestone?: boolean;
  webRefs: AuthoredResource[];
  video: AuthoredVideo;
  alternateVideos?: AuthoredVideo[];
  challengeType: "quiz" | "code";
  quiz?: AuthoredQuizQuestion[];
  codeChallenge?: AuthoredCodeChallenge;
}

export interface AuthoredModule {
  id: string;
  trackId: TrackIdValue;
  name: string;
  description: string;
  refs?: AuthoredResource[];
  topics: AuthoredTopic[];
}

interface RegistryTrack {
  id: TrackIdValue;
  name: string;
  tagline: string;
  accentToken: AccentTokenValue;
  modules: { id: string; name: string }[];
}

export interface TopicLocation {
  trackId: TrackIdValue;
  moduleId: string;
  /** Position in the whole-curriculum trail order, used to sort a plan into curriculum order. */
  order: number;
  meta: TopicMeta;
}

/**
 * Holds the curriculum for the server.
 *
 * At boot it reads every module once to build the manifest and the topic index, then lets the
 * full objects go. Individual modules are re-read on demand and kept in a small cache, so steady
 * state is a few megabytes rather than the whole 24 MB corpus.
 */
export class ContentStore {
  private readonly cache = new Map<string, AuthoredModule>();
  private readonly cacheLimit = 8;

  readonly manifest: TrackMeta[];
  readonly topicIndex: Map<string, TopicLocation>;
  /** Every topic id in trail order. */
  readonly orderedTopicIds: string[];

  private constructor(
    private readonly contentDir: string,
    manifest: TrackMeta[],
    topicIndex: Map<string, TopicLocation>,
    orderedTopicIds: string[],
  ) {
    this.manifest = manifest;
    this.topicIndex = topicIndex;
    this.orderedTopicIds = orderedTopicIds;
  }

  static load(contentDir: string): ContentStore {
    const registryFile = path.join(contentDir, "registry.json");
    if (!fs.existsSync(registryFile)) {
      throw new Error(
        `No curriculum at ${contentDir}. Run \`npm run content:server\` (it runs automatically before dev and build).`,
      );
    }
    const registry = JSON.parse(fs.readFileSync(registryFile, "utf8")) as RegistryTrack[];

    const manifest: TrackMeta[] = [];
    const topicIndex = new Map<string, TopicLocation>();
    const orderedTopicIds: string[] = [];

    for (const track of registry) {
      const modules: ModuleMeta[] = [];
      for (const entry of track.modules) {
        const file = path.join(contentDir, track.id, `${entry.id}.json`);
        if (!fs.existsSync(file)) {
          modules.push({ id: entry.id, trackId: track.id, name: entry.name, description: "", topics: [], available: false });
          continue;
        }
        const mod = JSON.parse(fs.readFileSync(file, "utf8")) as AuthoredModule;
        const topics: TopicMeta[] = mod.topics.map((topic) => ({
          id: topic.id,
          moduleId: mod.id,
          trackId: track.id,
          title: topic.title,
          level: topic.level,
          estMinutes: topic.estMinutes,
          ...(topic.isMilestone ? { isMilestone: true as const } : {}),
          challengeType: topic.challengeType,
          challengeSize:
            topic.challengeType === "quiz" ? (topic.quiz?.length ?? 0) : (topic.codeChallenge?.testCases.length ?? 0),
        }));

        for (const meta of topics) {
          if (topicIndex.has(meta.id)) {
            throw new Error(`Duplicate topic id "${meta.id}" in ${entry.id}. Topic ids must be unique across the curriculum.`);
          }
          topicIndex.set(meta.id, { trackId: track.id, moduleId: mod.id, order: orderedTopicIds.length, meta });
          orderedTopicIds.push(meta.id);
        }

        modules.push({
          id: mod.id,
          trackId: track.id,
          name: mod.name,
          description: mod.description,
          ...(mod.refs?.length ? { refs: mod.refs } : {}),
          topics,
          available: true,
        });
      }
      manifest.push({ id: track.id, name: track.name, tagline: track.tagline, accentToken: track.accentToken, modules });
    }

    return new ContentStore(contentDir, manifest, topicIndex, orderedTopicIds);
  }

  /** Reads a module, cached. Returns null when the module does not exist. */
  getModule(trackId: string, moduleId: string): AuthoredModule | null {
    const key = `${trackId}/${moduleId}`;
    const hit = this.cache.get(key);
    if (hit) {
      // Refresh recency: delete then re-set moves it to the end of the Map's iteration order.
      this.cache.delete(key);
      this.cache.set(key, hit);
      return hit;
    }

    // Guard against a crafted id escaping the content directory.
    if (!/^[a-z0-9-]+$/.test(trackId) || !/^[a-z0-9-]+$/.test(moduleId)) return null;
    const file = path.join(this.contentDir, trackId, `${moduleId}.json`);
    if (!fs.existsSync(file)) return null;

    const mod = JSON.parse(fs.readFileSync(file, "utf8")) as AuthoredModule;
    this.cache.set(key, mod);
    if (this.cache.size > this.cacheLimit) {
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }
    return mod;
  }

  /** The authored topic, with its answer key. Never send this to a learner. */
  getTopic(topicId: string): { module: AuthoredModule; topic: AuthoredTopic } | null {
    const location = this.topicIndex.get(topicId);
    if (!location) return null;
    const mod = this.getModule(location.trackId, location.moduleId);
    const topic = mod?.topics.find((t) => t.id === topicId);
    return mod && topic ? { module: mod, topic } : null;
  }

  hasTopic(topicId: string): boolean {
    return this.topicIndex.has(topicId);
  }

  /** Drops unknown ids and sorts the rest into curriculum trail order within each module. */
  orderTopicIds(topicIds: string[]): string[] {
    const known = [...new Set(topicIds)].filter((id) => this.topicIndex.has(id));
    return known.sort((a, b) => this.topicIndex.get(a)!.order - this.topicIndex.get(b)!.order);
  }

  get topicCount(): number {
    return this.topicIndex.size;
  }
}
