import { useEffect, useId, useRef, useState, type FocusEvent, type PointerEvent } from "react";
import { BookOpenText } from "lucide-react";
import { Link } from "react-router-dom";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { GlossaryTerm } from "@shared/handbook";
import { StatusChip } from "./StatusChip";
import { humaniseId, isPlaceholder, withoutMarker } from "./termLinks";
import { useGlossary } from "./useGlossary";

const OPEN_DELAY_MS = 150;
const CLOSE_DELAY_MS = 200;

/**
 * An inline handbook term: a dotted-underline button that opens a small card with the definition,
 * what it means at Oyelabs and how to say it to a client.
 *
 * Opens on mouse hover, on keyboard focus and on tap. A click while it is hover-open pins it, so a
 * mouse user can move into the card and follow "Open in glossary". Escape closes it (Radix).
 * Unknown ids render as plain text: a broken link is worse than none.
 */
export function TermLink({ id, label }: { id: string; label?: string }) {
  const glossary = useGlossary();
  const term = glossary.byId.get(id);
  const text = label ?? term?.name ?? humaniseId(id);
  if (!term) return <>{text}</>;
  return <KnownTermLink term={term} text={text} />;
}

function KnownTermLink({ term, text }: { term: GlossaryTerm; text: string }) {
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentId = useId();

  useEffect(() => () => clearTimer(), []);

  function clearTimer() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }
  function later(next: boolean, ms: number) {
    clearTimer();
    timer.current = setTimeout(() => setOpen(next), ms);
  }

  const hoverIn = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    later(true, OPEN_DELAY_MS);
  };
  const hoverOut = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || pinned.current) return;
    later(false, CLOSE_DELAY_MS);
  };
  const onFocus = (event: FocusEvent<HTMLButtonElement>) => {
    // Keyboard focus only: a mouse click also focuses, and the click itself decides that case.
    if (event.currentTarget.matches(":focus-visible")) {
      clearTimer();
      setOpen(true);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        clearTimer();
        if (!next) pinned.current = false;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-describedby={open ? contentId : undefined}
          onPointerEnter={hoverIn}
          onPointerLeave={hoverOut}
          onFocus={onFocus}
          onClick={(event) => {
            // Already open from hover or focus: pin it rather than toggling it shut under the cursor.
            if (open && !pinned.current) {
              event.preventDefault();
              pinned.current = true;
            }
            // Enter or Space (a click with no pointer): move into the card so its link is reachable.
            if (event.detail === 0) {
              pinned.current = true;
              setOpen(true);
              requestAnimationFrame(() => document.getElementById(contentId)?.querySelector<HTMLElement>("a,button")?.focus());
            }
          }}
          className={cn(
            "inline cursor-help rounded-[2px] p-0 text-left font-[inherit] text-inherit underline decoration-dotted decoration-[1.5px] underline-offset-[3px]",
            "decoration-foreground/50 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark",
          )}
        >
          {text}
        </button>
      </PopoverTrigger>
      <PopoverContent
        id={contentId}
        align="start"
        className="w-80 max-w-[calc(100vw-2rem)] space-y-2.5 text-sm"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onPointerEnter={(event) => event.pointerType === "mouse" && clearTimer()}
        onPointerLeave={hoverOut}
      >
        <TermCardBody term={term} />
      </PopoverContent>
    </Popover>
  );
}

/** The card body, split out so it can be rendered (and tested) without a popover. */
export function TermCardBody({ term }: { term: GlossaryTerm }) {
  const placeholder = isPlaceholder(term.oyelabsMeaning);
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <p className="font-display text-base font-semibold leading-tight">
          {term.name}
          {term.aka.length > 0 && <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground">{term.aka.join(", ")}</span>}
        </p>
        <StatusChip status={term.status} />
      </div>
      <p className="leading-relaxed">{term.definition}</p>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">At Oyelabs:</p>
        {placeholder ? (
          <p className="leading-relaxed text-muted-foreground">
            <span className="font-medium text-trailmark-strong">To confirm. </span>
            {withoutMarker(term.oyelabsMeaning)}
          </p>
        ) : (
          <p className="leading-relaxed">{term.oyelabsMeaning}</p>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">Say it to a client:</p>
        <p className="italic leading-relaxed">&ldquo;{term.clientSentence}&rdquo;</p>
      </div>
      <Link
        to={`/glossary/${term.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark"
      >
        <BookOpenText className="size-4" aria-hidden="true" />
        Open in glossary
      </Link>
    </>
  );
}
