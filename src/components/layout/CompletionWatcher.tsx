import { useEffect } from "react";

import { getTracks, modulePath } from "@/content";
import { summarizeModule, summarizeTrack } from "@/hooks/useTrackProgress";
import { useProgressStore, type TopicProgress } from "@/store/progressStore";
import { pushCompletionToast } from "@/store/toastStore";

function completedSets(progress: Record<string, TopicProgress>) {
  const modules = new Set<string>();
  const trackIds = new Set<string>();
  for (const track of getTracks()) {
    if (summarizeTrack(track, progress).isComplete) trackIds.add(track.id);
    for (const module of track.modules) {
      if (module.available && summarizeModule(module, progress).isComplete) modules.add(module.id);
    }
  }
  return { modules, trackIds };
}

/**
 * Watches progress and celebrates (quietly) when a learner finishes a camp or a whole trail.
 * It compares against the state it started with, so loading saved progress never fires toasts.
 */
export function CompletionWatcher() {
  useEffect(() => {
    let previous = completedSets(useProgressStore.getState().progress);
    return useProgressStore.subscribe((state) => {
      const current = completedSets(state.progress);
      for (const track of getTracks()) {
        if (current.trackIds.has(track.id) && !previous.trackIds.has(track.id)) {
          pushCompletionToast({
            tone: "summit",
            title: `Summit reached: ${track.name}`,
            body: "Every camp on this trail is complete. Your certificate is ready.",
            action: { label: "View certificate", to: `/report/${track.id}` },
          });
          continue;
        }
        const available = track.modules.filter((m) => m.available);
        available.forEach((module, i) => {
          if (current.modules.has(module.id) && !previous.modules.has(module.id)) {
            const next = available.slice(i + 1).find((m) => !current.modules.has(m.id));
            pushCompletionToast({
              tone: "camp",
              title: `Camp complete: ${module.name}`,
              body: `All ${module.topics.length} topics done. ${next ? `Next camp: ${next.name}.` : "On to the rest of the trail."}`,
              action: next ? { label: `Go to ${next.name}`, to: modulePath(next) } : { label: "Open the trail map", to: `/track/${track.id}` },
            });
          }
        });
      }
      previous = current;
    });
  }, []);

  return null;
}
