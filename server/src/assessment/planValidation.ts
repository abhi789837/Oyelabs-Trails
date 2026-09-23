import type { ContentStore } from "../content/store";

/**
 * Server-side validation of an AI-proposed plan (brief §11.1 step 4).
 *
 * The model proposes; the server disposes. Four things are fixed here, because each of them is a
 * way a plausible-looking plan can be wrong in a way that costs a real person real time:
 *
 * 1. **Unknown ids are dropped.** A hallucinated topic would 404 forever.
 * 2. **Duplicates are removed.**
 * 3. **Order is corrected within each module**, while keeping the AI's module order. The model is
 *    better placed to decide "Laravel before Kubernetes"; the curriculum is better placed to
 *    decide the order inside a module, because that is what the author sequenced.
 * 4. **Prerequisites are filled in.** If the plan includes an advanced topic in a module but not
 *    the easier ones before it, those get added unless the learner demonstrated mastery — a plan
 *    that starts someone mid-module is how people end up quietly lost.
 */

export interface ValidatePlanInput {
  content: ContentStore;
  topicIds: string[];
  /** Topic ids the learner has already completed, which are never re-added as prerequisites. */
  completedTopicIds?: ReadonlySet<string>;
  /** Areas the evaluation judged at 4 or 5, used to decide what counts as demonstrated. */
  masteredModuleIds?: ReadonlySet<string>;
  minimumSize?: number;
}

export interface ValidatePlanResult {
  topicIds: string[];
  dropped: string[];
  /** Prerequisite topics added that the AI did not propose. */
  addedPrerequisites: string[];
  warnings: string[];
}

const LEVEL_ORDER = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 } as const;

export function validatePlan(input: ValidatePlanInput): ValidatePlanResult {
  const { content } = input;
  const minimumSize = input.minimumSize ?? 5;
  const completed = input.completedTopicIds ?? new Set<string>();
  const mastered = input.masteredModuleIds ?? new Set<string>();
  const warnings: string[] = [];

  const dropped = input.topicIds.filter((id) => !content.hasTopic(id));
  if (dropped.length > 0) {
    warnings.push(`${dropped.length} proposed topic id(s) are not in the curriculum and were dropped.`);
  }

  const known = [...new Set(input.topicIds.filter((id) => content.hasTopic(id)))];

  // The AI's module ordering is preserved: first appearance wins.
  const moduleOrder: string[] = [];
  const byModule = new Map<string, Set<string>>();
  for (const id of known) {
    const location = content.topicIndex.get(id)!;
    if (!byModule.has(location.moduleId)) {
      byModule.set(location.moduleId, new Set());
      moduleOrder.push(location.moduleId);
    }
    byModule.get(location.moduleId)!.add(id);
  }

  const addedPrerequisites: string[] = [];

  for (const moduleId of moduleOrder) {
    if (mastered.has(moduleId)) continue;
    const selected = byModule.get(moduleId)!;

    // The module's topics in authored order.
    const moduleTopics = [...content.topicIndex.entries()]
      .filter(([, location]) => location.moduleId === moduleId)
      .sort((a, b) => a[1].order - b[1].order);

    const lastSelectedIndex = moduleTopics.reduce((last, [id], index) => (selected.has(id) ? index : last), -1);
    if (lastSelectedIndex < 0) continue;

    const deepestLevel = Math.max(
      ...moduleTopics.filter(([id]) => selected.has(id)).map(([, l]) => LEVEL_ORDER[l.meta.level]),
    );

    for (let index = 0; index < lastSelectedIndex; index++) {
      const [id, location] = moduleTopics[index];
      if (selected.has(id) || completed.has(id)) continue;
      // Only fill in topics at or below the depth already being asked for. A plan that reaches an
      // expert topic does not need every beginner topic before it, but it does need the ones at
      // the same level that the author put first.
      if (LEVEL_ORDER[location.meta.level] > deepestLevel) continue;
      selected.add(id);
      addedPrerequisites.push(id);
    }
  }

  if (addedPrerequisites.length > 0) {
    warnings.push(`${addedPrerequisites.length} prerequisite topic(s) were added to avoid starting mid-module.`);
  }

  // Module order from the AI; topic order inside each module from the curriculum.
  const ordered: string[] = [];
  for (const moduleId of moduleOrder) {
    const ids = [...byModule.get(moduleId)!];
    ordered.push(...content.orderTopicIds(ids));
  }

  if (ordered.length < minimumSize) {
    warnings.push(`The plan has only ${ordered.length} topic(s), below the minimum of ${minimumSize}.`);
  }

  return { topicIds: ordered, dropped, addedPrerequisites, warnings };
}

/**
 * A fallback plan, for when the AI's proposal survives validation with too little left.
 *
 * Better a sensible default than an empty plan: an empty plan means the learner signs in and sees
 * nothing at all, which looks like the app is broken rather than like something needs attention.
 * The admin is notified either way.
 */
export function fallbackPlan(content: ContentStore, targetTracks: string[], size = 12): string[] {
  const tracks = targetTracks.length > 0 ? targetTracks : ["frontend"];
  const ids: string[] = [];

  for (const track of content.manifest) {
    if (!tracks.includes(track.id)) continue;
    for (const module of track.modules) {
      if (!module.available) continue;
      for (const topic of module.topics) {
        if (topic.level === "beginner" || topic.level === "intermediate") ids.push(topic.id);
        if (ids.length >= size) return content.orderTopicIds(ids);
      }
    }
  }

  return content.orderTopicIds(ids);
}
