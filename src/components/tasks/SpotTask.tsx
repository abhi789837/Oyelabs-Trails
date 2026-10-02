import { useState } from "react";
import { Flag } from "lucide-react";

import { inputClasses } from "@/components/ui/input";
import { editorScopeProps } from "@/features/proctor/editorScope";
import { cn } from "@/lib/utils";

import type { TaskComponentProps } from "./types";

/**
 * Spot the issue: the document as segments; marking a segment says "this one is wrong".
 *
 * Each segment is a toggle button (`aria-pressed`), so click, Enter and Space all work and a screen
 * reader hears "pressed" — plus a polite announcement of the running count. Marked segments get a
 * flag icon and an underline as well as a tint, so the state never rests on colour.
 */
export function SpotTask({ task, value, onChange, readOnly, answer, idPrefix }: TaskComponentProps<"spot">) {
  const marked = new Set(value?.marked ?? []);
  const explanation = value?.explanation ?? "";
  const [announcement, setAnnouncement] = useState("");
  const issues = answer ? new Map(answer.segments.filter((s) => s.issue).map((s) => [s.id, s.issue as string])) : null;

  const toggle = (id: string, index: number) => {
    if (readOnly) return;
    const next = new Set(marked);
    const nowMarked = !next.has(id);
    if (nowMarked) next.add(id);
    else next.delete(id);
    onChange({ kind: "spot", marked: task.segments.map((s) => s.id).filter((sid) => next.has(sid)), explanation });
    setAnnouncement(`Segment ${index + 1} ${nowMarked ? "marked" : "unmarked"}. ${next.size} marked.`);
  };

  return (
    <div className="space-y-5">
      <p className="font-mono text-xs text-muted-foreground">
        {readOnly ? `${marked.size} marked.` : `Select every part that has a problem. ${marked.size} marked.`}
      </p>
      <div className="space-y-1.5 rounded-md border bg-surface px-2 py-2">
        {task.segments.map((segment, index) => {
          const isMarked = marked.has(segment.id);
          const issue = issues?.get(segment.id);
          return (
            <div key={segment.id}>
              <button
                type="button"
                aria-pressed={isMarked}
                disabled={readOnly}
                onClick={() => toggle(segment.id, index)}
                className={cn(
                  "flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm leading-relaxed transition-colors duration-[120ms]",
                  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-strong",
                  isMarked
                    ? "bg-warning/[0.14] underline decoration-warning-strong decoration-2 underline-offset-4"
                    : "hover:bg-surface-sunken",
                  readOnly && "cursor-default",
                )}
              >
                <Flag
                  className={cn("mt-1 h-3.5 w-3.5 shrink-0", isMarked ? "text-warning-strong" : "text-transparent")}
                  aria-hidden="true"
                />
                <span className="sr-only">Segment {index + 1}: </span>
                <span>{segment.text}</span>
              </button>
              {issues && (issue || isMarked) && (
                <p className={cn("ml-7 mt-0.5 text-xs", issue ? "text-summit-strong" : "text-muted-foreground")}>
                  {issue ? `${isMarked ? "Found" : "Missed"}: ${issue}` : "This part was fine."}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {task.askExplanation && (
        <div {...editorScopeProps()}>
          <label htmlFor={`${idPrefix}-spot-why`} className="text-sm font-medium">
            In one line, what is the most serious problem?
          </label>
          <input
            id={`${idPrefix}-spot-why`}
            type="text"
            maxLength={600}
            value={explanation}
            readOnly={readOnly}
            onChange={(event) =>
              onChange({ kind: "spot", marked: task.segments.map((s) => s.id).filter((sid) => marked.has(sid)), explanation: event.target.value })
            }
            className={cn(inputClasses, "mt-2 read-only:opacity-90")}
          />
        </div>
      )}
    </div>
  );
}
