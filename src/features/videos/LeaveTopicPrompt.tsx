import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

/**
 * "You have 2 videos left" when a learner leaves a topic with unwatched videos.
 *
 * The app uses `<BrowserRouter>`, so React Router's `useBlocker` is not available. Instead, a
 * capture-phase click listener intercepts in-app links (it runs before React Router's own handler)
 * and shows a small inline prompt. It asks at most once per topic visit: after "Leave anyway" or
 * "Stay" it never asks again until the learner opens the topic afresh. Closing the tab gets the
 * browser's own prompt only if the learner played something during this visit.
 */
export function LeaveTopicPrompt({ remaining, playedThisVisit }: { remaining: number; playedThisVisit: boolean }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);
  const asked = useRef(false);
  const stayRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const active = remaining > 0;

  useEffect(() => {
    if (!active) return;
    const onClick = (event: MouseEvent) => {
      if (asked.current || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      asked.current = true;
      returnFocus.current = anchor;
      setPending(`${url.pathname}${url.search}${url.hash}`);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active]);

  useEffect(() => {
    if (!active || !playedThisVisit) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (asked.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active, playedThisVisit]);

  useEffect(() => {
    if (pending) stayRef.current?.focus();
  }, [pending]);

  if (!pending) return null;

  const stay = () => {
    setPending(null);
    returnFocus.current?.focus();
  };

  return (
    <div
      role="alertdialog"
      aria-labelledby="leave-topic-title"
      aria-describedby="leave-topic-desc"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-md border bg-background px-4 py-4 shadow-lg sm:inset-x-auto sm:right-6"
      onKeyDown={(event) => {
        if (event.key === "Escape") stay();
      }}
    >
      <p id="leave-topic-title" className="font-display font-semibold">
        You have {remaining === 1 ? "1 video" : `${remaining} videos`} left
      </p>
      <p id="leave-topic-desc" className="mt-1 text-sm text-muted-foreground">
        Your place is saved, so you can come back to them later.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button ref={stayRef} size="sm" variant="outline" onClick={stay}>
          Stay and watch
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const to = pending;
            setPending(null);
            navigate(to);
          }}
        >
          Leave anyway
        </Button>
      </div>
    </div>
  );
}
