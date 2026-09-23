import type { LearnerProfile } from "../../../shared/profile";
import type { ContentStore } from "../content/store";

/**
 * A compact view of the curriculum for the AI prompts (brief §9.2).
 *
 * The full manifest is ~293 topics across 37 modules. Sending all of it to every call would be
 * wasteful and would bury the relevant part, so the digest narrows to the tracks that matter for
 * this person — their target tracks, anything their claimed skills point at, plus the
 * fundamentals modules, which are included regardless because that is exactly where a confident
 * framework user is most often thin.
 */

export interface ModuleDigest {
  id: string;
  name: string;
  track: string;
  topicCount: number;
  /** The distinct levels present, so the model can see how deep a module goes. */
  levels: string[];
}

export interface TopicDigest {
  id: string;
  title: string;
  level: string;
  module: string;
}

export interface ManifestDigest {
  modules: ModuleDigest[];
  /** Every topic id in the digest, for validating what the AI tags items with. */
  topicIds: Set<string>;
}

export interface AreaDigest {
  topics: TopicDigest[];
}

/**
 * Modules that everyone is measured against, whatever they claim. These are the language and
 * platform foundations the rest of the curriculum assumes.
 */
const FUNDAMENTALS_MODULE_IDS = ["fe-js-core", "fe-js-advanced", "be-foundations", "fe-html-css"];

export function buildManifestDigest(content: ContentStore, profile: LearnerProfile): ManifestDigest {
  const targetTracks = new Set(profile.targetTracks);
  const claimed = profile.claimedSkills.map((s) => s.area.toLowerCase());

  const modules: ModuleDigest[] = [];
  const topicIds = new Set<string>();

  for (const track of content.manifest) {
    for (const module of track.modules) {
      if (!module.available || module.topics.length === 0) continue;

      const relevant =
        targetTracks.size === 0 ||
        targetTracks.has(track.id) ||
        FUNDAMENTALS_MODULE_IDS.includes(module.id) ||
        claimed.some((skill) => module.name.toLowerCase().includes(skill) || skill.includes(module.name.toLowerCase()));

      if (!relevant) continue;

      modules.push({
        id: module.id,
        name: module.name,
        track: track.name,
        topicCount: module.topics.length,
        levels: [...new Set(module.topics.map((t) => t.level))],
      });
      for (const topic of module.topics) topicIds.add(topic.id);
    }
  }

  return { modules, topicIds };
}

/** The topics an area covers, for the item-generation prompt. */
export function buildAreaDigest(content: ContentStore, moduleIds: string[]): AreaDigest {
  const topics: TopicDigest[] = [];
  for (const track of content.manifest) {
    for (const module of track.modules) {
      if (!moduleIds.includes(module.id)) continue;
      for (const topic of module.topics) {
        topics.push({ id: topic.id, title: topic.title, level: topic.level, module: module.name });
      }
    }
  }
  return { topics };
}

/** Module ids that actually exist, so a hallucinated one cannot reach the item prompt. */
export function knownModuleIds(content: ContentStore): Set<string> {
  const ids = new Set<string>();
  for (const track of content.manifest) {
    for (const module of track.modules) if (module.available) ids.add(module.id);
  }
  return ids;
}
