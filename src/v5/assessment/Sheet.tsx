import { ChevronLeft, ChevronRight, CircleHelp, Clock, CloudOff, Cloud, Flag, LayoutGrid, Lock, Maximize, Undo2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ItemResponseV4, Sheet, SheetItem } from "@shared/assessmentV4";
import type { MyAssessment } from "@shared/assessment";

import { ApiRequestError } from "@/api/client";
import { RichText } from "@/components/content/RichText";
import { assessmentApi } from "@/features/assessment/api";
import { clearAllDrafts } from "@/features/assessment/draftStore";
import { sheetApi } from "@/features/assessment/v4/api";
import { clockView, formatClock, isTypingTarget, skewMs } from "@/features/assessment/v4/clock";
import { CodingItem } from "@/features/assessment/v4/CodingItem";
import { McqItem } from "@/features/assessment/v4/McqItem";
import { TaskItem } from "@/features/assessment/v4/TaskItem";
import { fromLocalDraft, useAutosave } from "@/features/assessment/v4/useAutosave";
import type { ProctorController } from "@/features/proctor/useProctor";
import { Button } from "@/v5/design/components/Button";
import { Sheet as SideSheet } from "@/v5/design/components/Overlays";
import { Badge, Kbd } from "@/v5/design/components/Primitives";
import { Logo } from "@/v5/design/components/Showcase";
import { cn } from "@/v5/design/cn";

import { useCalmConfirm, Spinner } from "./Frame";
import { finishLines, navCounts, navEntries, nextUnanswered, saveLine } from "./navigator";
import { CalmWarning, ProctorBar, SoftNotices } from "./Proctor";
import { QuestionNavigator } from "./QuestionNavigator";
import { Watermark } from "./Watermark";

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
    // Storage blocked: the sheet still opens on question 1 after a reload.
  }
}

/**
 * The v5 test sheet. Same rules and the same calls as the v4 sheet (`V4Sheet`): every question on
 * one sheet, free movement, one overall clock counting up (no per-question timer), "I don't know
 * yet" everywhere, answers autosaved (`useAutosave`), Run counted by the server (3 per question).
 * The server is the authority on time, runs and locking; a 409 means "resync", never "argue".
 *
 * What's new is the look: calm and spacious, a navigator with filters, an autosave line that
 * always says where things stand, and proctoring status in plain words.
 */
export function TestSheet({
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
  const [confirmElement, confirm] = useCalmConfirm();
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
  const [savedOnce, setSavedOnce] = useState(false);
  const beforeUnknown = useRef(new Map<string, ItemResponseV4 | null>());
  const endedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;

  // ---- Load and resync ----
  const loadRef = useRef<() => Promise<void>>(async () => undefined);
  const autosave = useAutosave(assessment.id, () => void loadRef.current());
  const queueRef = useRef(autosave.queue);
  queueRef.current = autosave.queue;

  useEffect(() => {
    if (autosave.status === "saved") setSavedOnce(true);
  }, [autosave.status]);

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
            const local = fromLocalDraft(item.id, item.type);
            merged[item.id] = local;
            if (local) queueRef.current(item.id, local);
          }
        }
        return merged;
      });
      if (next.items.some((i) => i.draft)) setSavedOnce(true);
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

  // A hard warning can extend the deadline by the time it paused; pick that up when it closes.
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
      window.scrollTo({ top: 0 });
      // Focus the new question's heading so a screen reader starts there.
      window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
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
      title: `Hand in question ${current + 1} now?`,
      body: "It's locked once handed in. You don't have to: anything left open is handed in as it stands when you finish.",
      confirmLabel: "Hand in this answer",
      cancelLabel: "Keep editing",
    });
    if (!ok) return;
    setSubmittingItem(true);
    try {
      await autosave.flush(item.id);
      autosave.forget(item.id);
      const { item: locked } = await sheetApi.submitItem(assessment.id, item.id, response);
      setItems((previous) => previous.map((it) => (it.id === locked.id ? locked : it)));
      setResponses((previous) => ({ ...previous, [locked.id]: locked.draft }));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "That answer couldn't be handed in. Try again.");
      if (err instanceof ApiRequestError && err.status === 409) void load();
    } finally {
      setSubmittingItem(false);
    }
  };

  // ---- Time actually spent: only the item on screen, only while the tab is visible and focused ----
  const trackedId = item && item.state !== "submitted" && !proctor.needsFullscreen && !proctor.hardWarning && !finishing ? item.id : null;
  const track = autosave.track;
  useEffect(() => {
    const update = () => track(document.visibilityState === "visible" && document.hasFocus() ? trackedId : null);
    update();
    window.addEventListener("focus", update);
    window.addEventListener("blur", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("blur", update);
      document.removeEventListener("visibilitychange", update);
      track(null);
    };
  }, [trackedId, track]);

  // ---- Navigator ----
  const entries = useMemo(() => navEntries(items, responses), [items, responses]);
  const counts = navCounts(entries);
  const nextOpen = nextUnanswered(entries, current);

  // ---- Finish ----
  const finish = async () => {
    if (finishLocked || finishing) return;
    const ok = await confirm({
      title: "Hand in your answers?",
      body: (
        <div className="space-y-3">
          <ul className="list-disc space-y-1 pl-5">
            {finishLines(counts).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p>Everything is handed in as it stands, and the test closes.</p>
        </div>
      ),
      confirmLabel: "Hand in my answers",
      cancelLabel: "Keep going",
    });
    if (!ok) return;
    setFinishing(true);
    try {
      autosave.track(null);
      await autosave.flush();
      await assessmentApi.submit(assessment.id);
      endedRef.current = true;
      clearAllDrafts();
      onFinished("submitted");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "The test couldn't be handed in. Try again.");
      if (err instanceof ApiRequestError && err.status === 409) void load();
    } finally {
      setFinishing(false);
    }
  };

  // ---- Keyboard: [ and ] move, F flags. Never while typing or in a dialog. ----
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
  const save = saveLine(autosave.status, savedOnce);
  const SaveIcon = save.tone === "warn" ? CloudOff : Cloud;

  return (
    <div className="relative min-h-dvh bg-surface-0 text-fg-1">
      <header className="sticky top-0 z-30 border-b border-line-1 bg-surface-1/95 shadow-e1 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
          <Logo variant="mark" className="hidden h-7 sm:inline-flex" />
          <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setNavOpen(true)} aria-haspopup="dialog">
            <LayoutGrid aria-hidden="true" />
            Questions
          </Button>
          <p className="font-display text-small font-semibold">{items.length ? `Question ${current + 1} of ${items.length}` : "Your test"}</p>
          <p
            className={cn("ml-auto inline-flex items-center gap-1.5 font-mono text-small tabular-nums", clock?.short ? "font-semibold text-warning-fg" : "text-fg-1")}
            aria-label={clock ? `Time: ${clock.elapsedLabel} so far, the test ends at ${clock.endsAtLabel}` : undefined}
          >
            <Clock className="size-4" aria-hidden="true" />
            {clock ? (
              <>
                {clock.elapsedLabel}
                <span className="text-fg-2"> of {clock.endsAtLabel}</span>
              </>
            ) : (
              "--:--"
            )}
          </p>
          <span role="status" data-testid="autosave" className={cn("inline-flex items-center gap-1 text-caption", save.tone === "warn" ? "font-medium text-warning-fg" : "text-fg-2")}>
            <SaveIcon className="size-3.5" aria-hidden="true" />
            {save.text}
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void finish()}
            loading={finishing}
            aria-disabled={finishLocked || undefined}
            title={finishLocked ? `You can hand in after ${formatClock(finishOpensIn)}.` : undefined}
          >
            Finish
          </Button>
        </div>
        <div className="border-t border-line-1">
          <ProctorBar proctor={proctor} className="mx-auto max-w-6xl px-4 py-1.5 sm:px-6" />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-8 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-36">
            <QuestionNavigator entries={entries} current={current} counts={counts} onSelect={go} />
            <p className="mt-5 text-caption leading-relaxed text-fg-2">
              <Kbd>[</Kbd> <Kbd>]</Kbd> previous and next, <Kbd>F</Kbd> flag. No timer per question: take the time each one needs.
            </p>
          </div>
        </aside>

        <main className="min-w-0">
          {error ? (
            <p role="alert" className="mb-6 rounded-card border border-danger/30 bg-danger-soft px-4 py-3 text-small text-danger-fg">
              {error}
            </p>
          ) : null}
          {proctor.cameraError ? (
            <p role="status" className="mb-6 rounded-card border border-warning/40 bg-warning-soft px-4 py-3 text-small text-fg-1">
              {proctor.cameraError}
            </p>
          ) : null}

          <div className="relative">
            <Watermark name={user?.displayName ?? ""} username={user?.username ?? ""} assessmentId={assessment.id} />

            {proctor.needsFullscreen ? (
              <div className="mx-auto max-w-md rounded-card border border-line-1 bg-surface-1 px-6 py-8 text-center shadow-e1">
                <Maximize className="mx-auto size-6 text-brand-fg" aria-hidden="true" />
                <p className="mt-3 font-display text-h4 font-semibold">Go back to full screen to carry on</p>
                <p className="mt-1 text-small text-fg-2">The questions are hidden until you do. Your answers are safe.</p>
                <Button variant="primary" className="mt-5" onClick={() => void proctor.requestFullscreen()}>
                  Return to fullscreen
                </Button>
              </div>
            ) : !item ? (
              <Spinner label="Loading the questions" />
            ) : (
              <article key={item.id} aria-labelledby={`q-${item.id}`} className="mx-auto max-w-3xl select-none">
                <header className="mb-5 flex flex-wrap items-center gap-2">
                  <h2 id={`q-${item.id}`} ref={headingRef} tabIndex={-1} className="font-display text-h3 font-semibold outline-none">
                    Question {current + 1}
                  </h2>
                  <Badge tone="outline">{item.skillName}</Badge>
                  {locked ? (
                    <Badge tone="success">
                      <Lock aria-hidden="true" />
                      Handed in
                    </Badge>
                  ) : null}
                  {item.flagged ? (
                    <Badge tone="warning">
                      <Flag aria-hidden="true" />
                      Flagged
                    </Badge>
                  ) : null}
                </header>

                <RichText text={item.prompt} size="base" className="max-w-prose text-[1.0625rem] text-fg-1" />

                {unknown && !locked ? (
                  <p role="status" className="mt-5 flex items-start gap-2 rounded-card border border-line-1 bg-sunken px-3 py-2 text-small">
                    <CircleHelp className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    Marked "I don't know yet". Nothing is taken off for it. Answer any time to change it.
                  </p>
                ) : null}

                <div className="mt-6">
                  {item.type === "coding" ? (
                    <CodingItem assessmentId={assessment.id} item={item} response={response} onResponse={onResponse} onFlush={() => void autosave.flush(item.id)} onItemUpdate={(patch) => updateItem(item.id, patch)} onConflict={() => void load()} />
                  ) : null}
                  {item.type === "mcq" ? (
                    <McqItem assessmentId={assessment.id} item={item} response={response} onResponse={onResponse} onFlush={() => void autosave.flush(item.id)} onItemUpdate={(patch) => updateItem(item.id, patch)} onConflict={() => void load()} />
                  ) : null}
                  {item.type === "task" ? (
                    <TaskItem assessmentId={assessment.id} item={item} response={response} onResponse={onResponse} onFlush={() => void autosave.flush(item.id)} onItemUpdate={(patch) => updateItem(item.id, patch)} onConflict={() => void load()} />
                  ) : null}
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line-1 pt-6">
                  <Button variant="ghost" onClick={() => void toggleFlag()} aria-pressed={item.flagged}>
                    <Flag aria-hidden="true" className={cn(item.flagged && "fill-warning text-warning-fg")} />
                    {item.flagged ? "Flagged" : "Flag for later"}
                  </Button>
                  {!locked ? (
                    <>
                      <Button variant="ghost" onClick={toggleUnknown}>
                        {unknown ? <Undo2 aria-hidden="true" /> : <CircleHelp aria-hidden="true" />}
                        {unknown ? `Undo "I don't know yet"` : "I don't know yet"}
                      </Button>
                      <Button variant="ghost" onClick={() => void submitItem()} disabled={!response} loading={submittingItem}>
                        <Lock aria-hidden="true" />
                        Hand in this answer
                      </Button>
                    </>
                  ) : null}
                </div>

                <nav aria-label="Previous and next question" className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <Button variant="secondary" onClick={() => go(current - 1)} disabled={current === 0}>
                    <ChevronLeft aria-hidden="true" />
                    Previous
                  </Button>
                  {nextOpen !== null && nextOpen !== current + 1 ? (
                    <Button variant="link" onClick={() => go(nextOpen)}>
                      Next not answered: {nextOpen + 1}
                    </Button>
                  ) : null}
                  {current < items.length - 1 ? (
                    <Button variant="primary" onClick={() => go(current + 1)}>
                      Next
                      <ChevronRight aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => void finish()} aria-disabled={finishLocked || undefined}>
                      Review and finish
                    </Button>
                  )}
                </nav>
              </article>
            )}
          </div>
        </main>
      </div>

      <SideSheet open={navOpen} onOpenChange={setNavOpen} side="bottom" title="Questions" description="Jump to any question. Your answers are saved as you go." closeLabel="Close the question list">
        <QuestionNavigator entries={entries} current={current} counts={counts} onSelect={go} />
      </SideSheet>

      {proctor.hardWarning ? (
        <CalmWarning
          warning={proctor.hardWarning}
          limit={proctor.hardLimit}
          needsFullscreen={proctor.needsFullscreen}
          onAcknowledge={proctor.acknowledgeHardWarning}
          onReenterFullscreen={() => void proctor.requestFullscreen()}
        />
      ) : null}
      <SoftNotices warnings={proctor.softWarnings} onDismiss={proctor.dismissSoftWarning} />
      {confirmElement}
    </div>
  );
}
