import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CircleHelp, Flag, LayoutGrid, LoaderCircle, Lock, Maximize, ShieldAlert, Undo2 } from "lucide-react";

import type { ItemResponseV4, Sheet, SheetItem } from "@shared/assessmentV4";
import type { MyAssessment } from "@shared/assessment";

import { ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { FormAlert } from "@/components/form/Field";
import { useConfirm } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Sheet as Drawer, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProctorController } from "@/features/proctor/useProctor";
import { HardWarningModal, SoftWarningToasts, StatusStrip, Watermark } from "@/features/proctor/warnings";
import { cn } from "@/lib/utils";

import { assessmentApi } from "../api";
import { clearAllDrafts } from "../draftStore";
import { sheetApi } from "./api";
import { chipState, clockView, countStates, formatClock, isTypingTarget, skewMs } from "./clock";
import { CodingItem } from "./CodingItem";
import { McqItem } from "./McqItem";
import { Navigator, type NavigatorEntry } from "./Navigator";
import { TaskItem } from "./TaskItem";
import { fromLocalDraft, useAutosave, type SaveStatus } from "./useAutosave";

export type FinishReason = "submitted" | "deadline";

const CURRENT_KEY = (id: string) => `oyelearn.v4.current.${id}`;

function readCurrent(id: string): number {
  try {
    return Number(window.sessionStorage.getItem(CURRENT_KEY(id))) || 0;
  } catch {
    return 0;
  }
}

function writeCurrent(id: string, index: number): void {
  try {
    window.sessionStorage.setItem(CURRENT_KEY(id), String(index));
  } catch {
    // Storage blocked: the sheet still opens, on question 1.
  }
}

/**
 * The v4 assessment (shared/assessmentV4.ts): every question on one sheet, free navigation, one
 * calm overall clock, no per-question timer, "I don't know yet" everywhere, drafts autosaved.
 *
 * The server is the authority on time, runs and locking. This screen shows the state it is given,
 * saves what the learner does, and resyncs on any 409 rather than arguing with it.
 */
export function V4Sheet({
  assessment,
  proctor,
  user,
  onFinished,
}: {
  assessment: MyAssessment;
  proctor: ProctorController;
  user: { displayName: string; username: string } | null;
  onFinished: (reason: FinishReason) => void;
}) {
  const confirm = useConfirm();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [items, setItems] = useState<SheetItem[]>([]);
  const [responses, setResponses] = useState<Record<string, ItemResponseV4 | null>>({});
  const [current, setCurrent] = useState(() => readCurrent(assessment.id));
  const [skew, setSkew] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [submittingItem, setSubmittingItem] = useState(false);
  /** What a learner had before pressing "I don't know yet", so Undo gives it back. */
  const beforeUnknown = useRef(new Map<string, ItemResponseV4 | null>());
  const endedRef = useRef(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;

  // ---- Load and resync ----
  const loadRef = useRef<() => Promise<void>>(async () => undefined);
  const autosave = useAutosave(assessment.id, () => void loadRef.current());
  const queueRef = useRef(autosave.queue);
  queueRef.current = autosave.queue;

  const load = useCallback(async () => {
    try {
      const sentAt = Date.now();
      const next = await sheetApi.sheet(assessment.id);
      const receivedAt = Date.now();
      if (next.status !== "in_progress") {
        if (!endedRef.current) {
          endedRef.current = true;
          clearAllDrafts();
          finishedRef.current(next.deadlineAt && next.serverNow >= next.deadlineAt ? "deadline" : "submitted");
        }
        return;
      }
      setSkew(skewMs(next.serverNow, Math.round((sentAt + receivedAt) / 2)));
      setSheet(next);
      setItems(next.items);
      setResponses((previous) => {
        const merged: Record<string, ItemResponseV4 | null> = {};
        for (const item of next.items) {
          if (item.state === "submitted") merged[item.id] = item.draft;
          else if (item.id in previous) merged[item.id] = previous[item.id];
          else if (item.draft) merged[item.id] = item.draft;
          else {
            // The server has nothing but this tab does (a save that never landed): restore and resend.
            const local = fromLocalDraft(item.id, item.type);
            merged[item.id] = local;
            if (local) queueRef.current(item.id, local);
          }
        }
        return merged;
      });
      setCurrent((index) => Math.min(index, Math.max(0, next.items.length - 1)));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "The questions couldn't be loaded. Check your connection.");
    }
  }, [assessment.id]);
  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  // A hard warning can extend the deadline by the time it paused; pick that up when it is dismissed.
  const hadWarning = useRef(false);
  useEffect(() => {
    if (proctor.hardWarning) hadWarning.current = true;
    else if (hadWarning.current) {
      hadWarning.current = false;
      void load();
    }
  }, [proctor.hardWarning, load]);

  // ---- Clock ----
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const clock = sheet?.startedAt && sheet.deadlineAt ? clockView(now, skew, sheet.startedAt, sheet.deadlineAt) : null;
  const finishOpensIn = sheet?.minFinishAt ? sheet.minFinishAt - (now + skew) : 0;
  const finishLocked = finishOpensIn > 0;

  /* Time up on this clock: check with the server first (a warning may have moved the deadline), then
     hand in. The server also does this on its own at the deadline; calling submit is belt and braces. */
  const timeUpRef = useRef(false);
  useEffect(() => {
    if (!clock?.over || timeUpRef.current || endedRef.current) return;
    timeUpRef.current = true;
    void (async () => {
      await autosave.flush();
      try {
        const fresh = await sheetApi.sheet(assessment.id);
        if (fresh.status === "in_progress" && fresh.deadlineAt && fresh.deadlineAt > fresh.serverNow) {
          timeUpRef.current = false;
          setSheet(fresh);
          setSkew(skewMs(fresh.serverNow, Date.now()));
          return;
        }
        if (fresh.status === "in_progress") await assessmentApi.submit(assessment.id).catch(() => undefined);
      } catch {
        await assessmentApi.submit(assessment.id).catch(() => undefined);
      }
      if (!endedRef.current) {
        endedRef.current = true;
        clearAllDrafts();
        finishedRef.current("deadline");
      }
    })();
  }, [clock?.over, assessment.id, autosave]);

  // ---- Answers ----
  const item = items[current] ?? null;
  const response = item ? (responses[item.id] ?? null) : null;

  const setResponse = useCallback(
    (itemId: string, next: ItemResponseV4 | null) => {
      setResponses((previous) => ({ ...previous, [itemId]: next }));
      autosave.queue(itemId, next);
    },
    [autosave],
  );

  const onResponse = useCallback(
    (next: ItemResponseV4 | null) => {
      if (!item || item.state === "submitted") return;
      setResponse(item.id, next);
    },
    [item, setResponse],
  );

  const updateItem = useCallback((itemId: string, patch: Partial<SheetItem>) => {
    setItems((previous) => previous.map((it) => (it.id === itemId ? ({ ...it, ...patch } as SheetItem) : it)));
    if (patch.state === "submitted" && patch.draft !== undefined) {
      setResponses((previous) => ({ ...previous, [itemId]: patch.draft ?? null }));
    }
  }, []);

  const go = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      if (item) void autosave.flush(item.id);
      setCurrent(index);
      writeCurrent(assessment.id, index);
      setNavOpen(false);
      // Back to the top of the new question; the header and the navigator are sticky.
      if ((mainRef.current?.getBoundingClientRect().top ?? 0) < 0) window.scrollTo({ top: 0 });
    },
    [items.length, item, autosave, assessment.id],
  );

  const toggleFlag = useCallback(async () => {
    if (!item) return;
    const flagged = !item.flagged;
    updateItem(item.id, { flagged });
    try {
      await sheetApi.saveDraft(assessment.id, item.id, { flagged });
    } catch (err) {
      updateItem(item.id, { flagged: !flagged });
      if (err instanceof ApiRequestError && err.status === 409) void load();
    }
  }, [item, updateItem, assessment.id, load]);

  const toggleUnknown = () => {
    if (!item || item.state === "submitted") return;
    if (response && "unknown" in response) {
      setResponse(item.id, beforeUnknown.current.get(item.id) ?? null);
      beforeUnknown.current.delete(item.id);
    } else {
      beforeUnknown.current.set(item.id, response);
      setResponse(item.id, { unknown: true });
    }
  };

  const submitItem = async () => {
    if (!item || !response || item.state === "submitted" || submittingItem) return;
    const ok = await confirm({
      calm: true,
      title: `Submit question ${current + 1}?`,
      body: "It is locked once submitted and can't be changed. You don't have to: anything you leave open is handed in as it stands when you finish.",
      confirmLabel: "Submit this answer",
      cancelLabel: "Keep editing",
    });
    if (!ok) return;
    setSubmittingItem(true);
    try {
      autosave.forget(item.id);
      const { item: locked } = await sheetApi.submitItem(assessment.id, item.id, response);
      setItems((previous) => previous.map((it) => (it.id === locked.id ? locked : it)));
      setResponses((previous) => ({ ...previous, [locked.id]: locked.draft }));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "That answer couldn't be submitted. Try again.");
      if (err instanceof ApiRequestError && err.status === 409) void load();
    } finally {
      setSubmittingItem(false);
    }
  };

  // ---- Navigator ----
  const entries: NavigatorEntry[] = useMemo(
    () => items.map((it, index) => ({ id: it.id, number: index + 1, state: chipState(it, responses[it.id] ?? null), flagged: it.flagged })),
    [items, responses],
  );
  const counts = countStates(
    entries.map((e) => e.state),
    entries.map((e) => e.flagged),
  );

  // ---- Finish ----
  const finish = async () => {
    if (finishLocked || finishing) return;
    const open = counts.unanswered;
    const ok = await confirm({
      calm: true,
      title: "Finish the assessment?",
      body: (
        <div className="space-y-2">
          <ul className="space-y-1">
            <li>
              {open} {open === 1 ? "question" : "questions"} not answered
            </li>
            <li>{counts.flagged} flagged to come back to</li>
            <li>{counts.unknown} marked "I don't know yet"</li>
          </ul>
          <p>Everything is handed in as it stands, and the assessment closes.</p>
        </div>
      ),
      confirmLabel: "Finish and hand in",
      cancelLabel: "Keep going",
    });
    if (!ok) return;
    setFinishing(true);
    try {
      await autosave.flush();
      await assessmentApi.submit(assessment.id);
      endedRef.current = true;
      clearAllDrafts();
      onFinished("submitted");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "The assessment couldn't be finished. Try again.");
      if (err instanceof ApiRequestError && err.status === 409) void load();
    } finally {
      setFinishing(false);
    }
  };

  // ---- Keyboard: [ and ] move, F flags. Never while typing. ----
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target as HTMLElement | null)) return;
      if ((event.target as HTMLElement | null)?.closest?.('[role="dialog"], [role="alertdialog"]')) return;
      if (event.key === "[") {
        event.preventDefault();
        go(current - 1);
      } else if (event.key === "]") {
        event.preventDefault();
        go(current + 1);
      } else if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        void toggleFlag();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, go, toggleFlag]);

  // ---- Render ----
  const locked = item?.state === "submitted";
  const unknown = Boolean(response && "unknown" in response);

  const finishButton = (
    <Button onClick={() => void finish()} loading={finishing} aria-disabled={finishLocked || undefined} className={cn(finishLocked && "opacity-50")}>
      Finish
    </Button>
  );

  return (
    <div className="relative min-h-dvh bg-background">
      <div className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6">
          <StatusStrip videoRef={proctor.videoRef} state={proctor.state} />
        </div>
        <div className="border-t">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setNavOpen(true)} aria-haspopup="dialog">
              <LayoutGrid aria-hidden="true" />
              Questions
            </Button>
            <p className="font-display text-sm font-semibold">
              {items.length ? `Question ${current + 1} of ${items.length}` : "Placement assessment"}
            </p>
            <p
              className={cn("ml-auto font-mono text-sm tabular", clock?.short ? "text-warning-strong" : "text-foreground")}
              aria-label={clock ? `${clock.elapsedLabel} elapsed, ends at ${clock.endsAtLabel}` : undefined}
            >
              {clock ? (
                <>
                  <span className="font-semibold">{clock.elapsedLabel}</span> elapsed
                  <span className="text-muted-foreground"> · ends at {clock.endsAtLabel}</span>
                </>
              ) : (
                "--:--"
              )}
            </p>
            <SaveIndicator status={autosave.status} />
            {finishLocked ? (
              <Tooltip>
                <TooltipTrigger asChild>{finishButton}</TooltipTrigger>
                <TooltipContent>Finish opens in {formatClock(finishOpensIn)}.</TooltipContent>
              </Tooltip>
            ) : (
              finishButton
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-44">
            <Navigator entries={entries} current={current} onSelect={go} counts={counts} />
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              <Kbd>[</Kbd> <Kbd>]</Kbd> previous and next, <Kbd>F</Kbd> flag. Most people take about {sheet?.targetMinutes ?? 30} minutes.
            </p>
          </div>
        </aside>

        <div ref={mainRef} className="min-w-0">
          {error && (
            <div className="mb-6">
              <FormAlert>{error}</FormAlert>
            </div>
          )}
          {proctor.cameraError && (
            <div className="mb-6 flex gap-3 rounded-md border border-destructive/40 bg-destructive/6 px-4 py-3 text-sm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              <p>{proctor.cameraError}</p>
            </div>
          )}

          <div className="relative">
            <Watermark name={user?.displayName ?? ""} username={user?.username ?? ""} assessmentId={assessment.id} />

            {proctor.needsFullscreen ? (
              <div className="rounded-md border border-trailmark/50 bg-trailmark/[0.07] px-5 py-6 text-center">
                <Maximize className="mx-auto h-6 w-6 text-trailmark-strong" aria-hidden="true" />
                <p className="mt-3 font-medium">Return to fullscreen to continue</p>
                <p className="mt-1 text-sm text-muted-foreground">The questions are hidden until you do. Leaving fullscreen has already been recorded.</p>
                <Button className="mt-4" onClick={() => void proctor.requestFullscreen()}>
                  Return to fullscreen
                </Button>
              </div>
            ) : !item ? (
              <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground" role="status">
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span className="sr-only">Loading the questions</span>
              </div>
            ) : (
              <article key={item.id} aria-labelledby={`q-${item.id}`} className="select-none">
                <header className="mb-4 flex flex-wrap items-center gap-2">
                  <h2 id={`q-${item.id}`} className="font-display text-lg font-semibold">
                    Question {current + 1}
                  </h2>
                  <Badge variant="outline">{item.skillName}</Badge>
                  {locked && (
                    <Badge variant="success">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      Submitted
                    </Badge>
                  )}
                  {item.flagged && (
                    <Badge variant="progress">
                      <Flag className="h-3 w-3" aria-hidden="true" />
                      Flagged
                    </Badge>
                  )}
                </header>

                <RichText text={item.prompt} size="base" className="max-w-prose text-[1.0625rem]" />

                {unknown && !locked && (
                  <p role="status" className="mt-5 flex items-start gap-2 rounded-md border border-basalt/40 bg-surface-sunken/70 px-3 py-2 text-sm">
                    <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    Marked "I don't know yet". Nothing is marked down for it — answer any time to change it.
                  </p>
                )}

                <div className="mt-6">
                  {item.type === "coding" && (
                    <CodingItem
                      assessmentId={assessment.id}
                      item={item}
                      response={response}
                      onResponse={onResponse}
                      onFlush={() => void autosave.flush(item.id)}
                      onItemUpdate={(patch) => updateItem(item.id, patch)}
                      onConflict={() => void load()}
                    />
                  )}
                  {item.type === "mcq" && (
                    <McqItem
                      assessmentId={assessment.id}
                      item={item}
                      response={response}
                      onResponse={onResponse}
                      onFlush={() => void autosave.flush(item.id)}
                      onItemUpdate={(patch) => updateItem(item.id, patch)}
                      onConflict={() => void load()}
                    />
                  )}
                  {item.type === "task" && (
                    <TaskItem
                      assessmentId={assessment.id}
                      item={item}
                      response={response}
                      onResponse={onResponse}
                      onFlush={() => void autosave.flush(item.id)}
                      onItemUpdate={(patch) => updateItem(item.id, patch)}
                      onConflict={() => void load()}
                    />
                  )}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
                  {!locked && (
                    <>
                      <Button onClick={() => void submitItem()} disabled={!response} loading={submittingItem}>
                        Submit answer
                      </Button>
                      <Button variant="outline" onClick={toggleUnknown}>
                        {unknown ? <Undo2 aria-hidden="true" /> : <CircleHelp aria-hidden="true" />}
                        {unknown ? "Undo \"I don't know yet\"" : "I don't know yet"}
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" onClick={() => void toggleFlag()} aria-pressed={item.flagged}>
                    <Flag aria-hidden="true" className={cn(item.flagged && "fill-warning text-warning-strong")} />
                    {item.flagged ? "Flagged" : "Flag for later"}
                  </Button>
                </div>

                <nav aria-label="Previous and next question" className="mt-6 flex items-center justify-between gap-3">
                  <Button variant="outline" onClick={() => go(current - 1)} disabled={current === 0}>
                    <ChevronLeft aria-hidden="true" />
                    Previous
                  </Button>
                  <span className="font-mono text-xs text-muted-foreground">
                    {current + 1} / {items.length}
                  </span>
                  <Button variant="outline" onClick={() => go(current + 1)} disabled={current >= items.length - 1}>
                    Next
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </nav>
              </article>
            )}
          </div>
        </div>
      </div>

      <Drawer open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="bottom" closeLabel="Close the question list" className="max-w-none px-4 pb-6 pt-5">
          <SheetTitle>Questions</SheetTitle>
          <SheetDescription className="mb-4">Jump to any question. Your answers are saved as you go.</SheetDescription>
          <Navigator entries={entries} current={current} onSelect={go} counts={counts} />
        </SheetContent>
      </Drawer>

      {proctor.hardWarning && (
        <HardWarningModal
          warning={proctor.hardWarning}
          needsFullscreen={proctor.needsFullscreen}
          onAcknowledge={proctor.acknowledgeHardWarning}
          onReenterFullscreen={() => void proctor.requestFullscreen()}
        />
      )}
      <SoftWarningToasts warnings={proctor.softWarnings} onDismiss={proctor.dismissSoftWarning} />
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return (
    <span className={cn("font-mono text-xs", status === "error" ? "text-destructive" : "text-muted-foreground")} role="status">
      {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Not saved, retrying"}
    </span>
  );
}
