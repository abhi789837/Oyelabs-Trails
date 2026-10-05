import { useState } from "react";

import { api } from "@/api/client";
import { PlainError } from "@/components/form/PlainError";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

import { SpeakReview } from "./SpeakReview";
import { needsListenItems, type V4AdminItem } from "./v4Helpers";

/**
 * v4.4 Phase 6: spoken answers no machine could mark ("needs a listen"). The admin plays each one
 * and gives **Full marks** or **Not yet** in one click; the result is worked out again.
 */
export function ListenAndMark({ assessmentId, items, onChanged }: { assessmentId: string; items: readonly V4AdminItem[]; onChanged: () => Promise<void> }) {
  const waiting = needsListenItems(items);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  if (waiting.length === 0) return null;

  const mark = async (item: V4AdminItem, value: "full" | "not_yet") => {
    setBusy(`${item.id}:${value}`);
    setError(null);
    try {
      const res = await api.post<{ ok: true; levelsChanged: boolean }>(`/api/admin/assessments/${assessmentId}/items/${item.id}/mark`, { mark: value });
      notify.success(value === "full" ? `Full marks given${res.levelsChanged ? ". Their skill levels changed." : "."}` : `Marked "Not yet"${res.levelsChanged ? ". Their skill levels changed." : "."}`);
      await onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section id="needs-listen" aria-labelledby="needs-listen-heading" className="space-y-3 rounded-md border border-trailmark/50 bg-trailmark/[0.05] px-4 py-3">
      <h4 id="needs-listen-heading" className="text-sm font-medium">
        Needs a listen: {waiting.length} spoken {waiting.length === 1 ? "answer" : "answers"}
      </h4>
      <p className="text-sm text-muted-foreground">We couldn&rsquo;t turn {waiting.length === 1 ? "this recording" : "these recordings"} into text. Play each one and mark it yourself.</p>
      {error != null && <PlainError error={error} />}
      <ol className="space-y-4">
        {waiting.map((item) => (
          <li key={item.id} className="space-y-2 rounded-md border bg-surface px-3 py-3">
            <p className="text-sm">
              <span className="text-muted-foreground">{item.skillName}: </span>
              {item.prompt}
            </p>
            {item.response && "task" in item.response && item.response.task.kind === "speak" && <SpeakReview response={item.response.task} feedback={item.feedback} />}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" loading={busy === `${item.id}:full`} disabled={busy !== null} onClick={() => void mark(item, "full")}>
                Full marks
              </Button>
              <Button size="sm" variant="outline" loading={busy === `${item.id}:not_yet`} disabled={busy !== null} onClick={() => void mark(item, "not_yet")}>
                Not yet
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
