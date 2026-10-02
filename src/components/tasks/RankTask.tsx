import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical } from "lucide-react";

import { InlineText } from "@/components/content/RichText";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { TaskComponentProps } from "./types";

/** Moves one id to a new index. Pure, for the buttons, the keys and the drop alike. */
export function moveItem(order: readonly string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return [...order];
  const next = [...order];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Rank: put the items in order, first = top.
 *
 * Three ways to move an item, all of them equal: drag it (native drag events, no library), press
 * its up/down buttons, or focus the row and press Alt+↑ / Alt+↓. Each move is announced ("Moved
 * 'X' to position 2 of 5"), and focus follows the item so a keyboard user can keep moving it.
 */
export function RankTask({ task, value, onChange, readOnly, answer, idPrefix }: TaskComponentProps<"rank">) {
  const order = value?.order?.length ? value.order : task.items.map((item) => item.id);
  const labels = new Map(task.items.map((item) => [item.id, item.label]));
  const [announcement, setAnnouncement] = useState("");
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());

  const move = (from: number, to: number, refocus = false) => {
    if (readOnly || to < 0 || to >= order.length) return;
    const id = order[from];
    onChange({ kind: "rank", order: moveItem(order, from, to) });
    setAnnouncement(`Moved "${labels.get(id) ?? id}" to position ${to + 1} of ${order.length}.`);
    if (refocus) requestAnimationFrame(() => rowRefs.current.get(id)?.focus());
  };

  return (
    <div>
      <p id={`${idPrefix}-rank-help`} className="mb-3 font-mono text-xs text-muted-foreground">
        {readOnly ? "Your order, first at the top." : "First at the top. Drag a row, use its arrows, or focus it and press Alt+↑ / Alt+↓."}
      </p>
      <ol className="space-y-2" aria-describedby={`${idPrefix}-rank-help`}>
        {order.map((id, index) => (
          <li
            key={id}
            ref={(element) => {
              if (element) rowRefs.current.set(id, element);
              else rowRefs.current.delete(id);
            }}
            tabIndex={readOnly ? -1 : 0}
            draggable={!readOnly}
            aria-label={`${index + 1} of ${order.length}: ${labels.get(id) ?? id}`}
            onKeyDown={(event) => {
              if (!event.altKey) return;
              if (event.key === "ArrowUp") {
                event.preventDefault();
                move(index, index - 1, true);
              } else if (event.key === "ArrowDown") {
                event.preventDefault();
                move(index, index + 1, true);
              }
            }}
            onDragStart={(event) => {
              setDragging(id);
              event.dataTransfer.effectAllowed = "move";
              // Some browsers refuse to start a drag without data. An id, never the label.
              event.dataTransfer.setData("application/x-oyelearn-rank", id);
            }}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            onDragOver={(event) => {
              if (!dragging) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOver(index);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragging) move(order.indexOf(dragging), index);
              setDragging(null);
              setOver(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-md border bg-surface px-2 py-2 text-sm transition-colors duration-[120ms]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong",
              dragging === id && "opacity-50",
              over === index && dragging !== id && "border-primary bg-primary/[0.06]",
              !readOnly && "cursor-grab active:cursor-grabbing",
            )}
          >
            {!readOnly && <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-surface-sunken font-mono text-xs tabular"
            >
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 py-1">
              <InlineText text={labels.get(id) ?? id} />
            </span>
            {answer && (
              answer.correctOrder[index] === id ? (
                <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-summit-strong">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  In place
                </span>
              ) : (
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  Belongs at {answer.correctOrder.indexOf(id) + 1}
                </span>
              )
            )}
            {!readOnly && (
              <span className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label={`Move "${labels.get(id) ?? id}" up`}
                >
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === order.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label={`Move "${labels.get(id) ?? id}" down`}
                >
                  <ArrowDown aria-hidden="true" />
                </Button>
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {answer?.explanation && <p className="mt-3 text-sm text-muted-foreground">{answer.explanation}</p>}
    </div>
  );
}
