import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";

import type { Skill } from "@shared/catalog";
import { SLIDER_LABELS, SLIDER_VALUES, type Slider as SliderValue } from "@shared/setup";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { canMove, sortedRows, type PriorityRow } from "./helpers";

const TONE: Record<SliderValue, string> = {
  5: "bg-destructive/10 text-destructive",
  4: "bg-trailmark/12 text-trailmark-strong",
  3: "bg-primary/10 text-primary-strong",
  2: "bg-foreground/[0.07] text-muted-foreground",
  1: "bg-foreground/[0.07] text-muted-foreground",
};

/**
 * The selected priorities, highest slider first.
 *
 * Rows re-sort as sliders change. Two details keep that from fighting the admin:
 * - while a thumb is being dragged with the pointer the order is held, and it settles on release,
 *   so the row does not jump out from under the cursor mid-drag;
 * - after a re-sort the control that was in use gets its focus back, because moving a DOM node
 *   drops focus in most browsers and a keyboard user would land back at the top of the page.
 */
export function PriorityRows({
  rows,
  skills,
  disabled,
  onSlider,
  onMove,
  onRemove,
}: {
  rows: readonly PriorityRow[];
  skills: ReadonlyMap<string, Skill>;
  disabled?: boolean;
  onSlider: (skillId: string, slider: SliderValue) => void;
  onMove: (skillId: string, delta: -1 | 1) => void;
  onRemove: (skillId: string) => void;
}) {
  const [held, setHeld] = useState<string[] | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const refocus = useRef<{ skillId: string; control: string } | null>(null);

  const sorted = sortedRows(rows);
  const display = held
    ? [
        ...held.map((id) => rows.find((row) => row.skillId === id)).filter((row): row is PriorityRow => Boolean(row)),
        ...sorted.filter((row) => !held.includes(row.skillId)),
      ]
    : sorted;

  // A drag that ends without a value change never fires `onValueCommit`; release the hold anyway.
  useEffect(() => {
    if (!held) return;
    const release = () => setHeld(null);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [held]);

  useLayoutEffect(() => {
    const target = refocus.current;
    if (!target || !listRef.current) return;
    refocus.current = null;
    const row = listRef.current.querySelector<HTMLElement>(`[data-skill-row="${CSS.escape(target.skillId)}"]`);
    let control = row?.querySelector<HTMLElement>(target.control) ?? null;
    // A move to the edge of its tie disables the button that did it; the slider is the next best place.
    if (control instanceof HTMLButtonElement && control.disabled) control = row?.querySelector<HTMLElement>('[role="slider"]') ?? null;
    if (control && document.activeElement !== control) control.focus();
  });

  if (rows.length === 0) return null;

  return (
    <ol ref={listRef} className="divide-y rounded-md border" aria-label="Selected priorities, highest first">
      {display.map((row) => {
        const skill = skills.get(row.skillId);
        const name = skill?.name ?? row.skillId;
        const upOk = canMove(rows, row.skillId, -1);
        const downOk = canMove(rows, row.skillId, 1);
        return (
          <li
            key={row.skillId}
            data-skill-row={row.skillId}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_15rem_auto]"
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="min-w-0 truncate font-medium">{name}</span>
                {skill?.status === "pending" && (
                  <span className="rounded-sm border border-trailmark/50 px-1.5 font-mono text-[10px] text-trailmark-strong">
                    pending
                  </span>
                )}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span className={cn("rounded-sm px-1.5 py-px font-mono text-[11px] font-medium", TONE[row.slider])}>
                  {SLIDER_LABELS[row.slider]}
                </span>
                {row.slider >= 4 && <span>Do it now</span>}
              </p>
            </div>

            <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-1 sm:col-start-2">
              <Slider
                min={1}
                max={5}
                step={1}
                value={[row.slider]}
                disabled={disabled}
                thumbLabels={[`${name} priority`]}
                valueText={(value) => SLIDER_LABELS[value as SliderValue]}
                onPointerDown={() => setHeld(sorted.map((r) => r.skillId))}
                onValueChange={([value]) => {
                  refocus.current = { skillId: row.skillId, control: '[role="slider"]' };
                  onSlider(row.skillId, value as SliderValue);
                }}
                onValueCommit={() => setHeld(null)}
              />
              <div className="mt-0.5 grid grid-cols-5 text-[10px] leading-tight text-muted-foreground" aria-hidden="true">
                {SLIDER_VALUES.map((value) => (
                  <span
                    key={value}
                    className={cn(
                      "truncate",
                      value === 1 ? "text-left" : value === 5 ? "text-right" : "text-center",
                      value === row.slider && "font-medium text-foreground",
                    )}
                  >
                    {SLIDER_LABELS[value]}
                  </span>
                ))}
              </div>
            </div>

            <div className="col-start-2 row-start-1 flex items-center gap-0.5 sm:col-start-3">
              <RowButton
                label={`Move ${name} up within ${SLIDER_LABELS[row.slider]}`}
                disabled={disabled || !upOk}
                data-control="up"
                onClick={() => {
                  refocus.current = { skillId: row.skillId, control: '[data-control="up"]' };
                  onMove(row.skillId, -1);
                }}
              >
                <ArrowUp aria-hidden="true" />
              </RowButton>
              <RowButton
                label={`Move ${name} down within ${SLIDER_LABELS[row.slider]}`}
                disabled={disabled || !downOk}
                data-control="down"
                onClick={() => {
                  refocus.current = { skillId: row.skillId, control: '[data-control="down"]' };
                  onMove(row.skillId, 1);
                }}
              >
                <ArrowDown aria-hidden="true" />
              </RowButton>
              <RowButton label={`Remove ${name}`} disabled={disabled} onClick={() => onRemove(row.skillId)}>
                <X aria-hidden="true" />
              </RowButton>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function RowButton({
  label,
  children,
  ...props
}: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement> & { "data-control"?: string }) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-strong disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-4"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
