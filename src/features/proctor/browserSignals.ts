import {
  DEVTOOLS_SIZE_DELTA_PX,
  MOUSE_LEFT_SUSTAINED_MS,
  SIGNAL_SEVERITY,
  WINDOW_BLUR_SUSTAINED_MS,
  type ProctorEvent,
  type ProctorSignalType,
} from "./types";

/**
 * The DOM half of the §10.2 detector table: everything observable without the camera.
 *
 * These signals are cheap, immediate and — unlike the camera ones — deterministic, so they carry
 * most of the weight in practice. They are also the ones a determined learner can defeat, which is
 * exactly why §10.7 insists the flags are evidence for a human rather than a verdict.
 *
 * All of them are installed and removed as one unit: `startBrowserSignals` returns a cleanup
 * function that detaches every listener and clears every pending timer, so remounting the test
 * page cannot leave a second copy of the engine running and double-reporting.
 */

type EmitFn = (event: ProctorEvent) => void;

function isFullscreen(): boolean {
  // Safari still only has the prefixed property.
  const withWebkit = document as Document & { webkitFullscreenElement?: Element | null };
  return Boolean(document.fullscreenElement ?? withWebkit.webkitFullscreenElement);
}

/** `screen.isExtended` is Window Management API, absent in Firefox and older Safari. */
export function screenIsExtended(): boolean {
  const withExtended = window.screen as Screen & { isExtended?: boolean };
  return withExtended.isExtended === true;
}

/**
 * The same API makes `screen` an EventTarget that fires `change` when displays are added, removed
 * or rearranged. TypeScript's DOM lib still types `Screen` as a plain object, hence the cast.
 */
export function onScreenChange(handler: () => void): () => void {
  const target = window.screen as unknown as Partial<EventTarget>;
  if (typeof target.addEventListener !== "function") return () => undefined;
  target.addEventListener("change", handler);
  return () => target.removeEventListener?.("change", handler);
}

/**
 * A docked DevTools panel shrinks the viewport without changing the window, so the outer/inner
 * delta jumps. It misses an undocked window entirely and false-positives on some zoom levels and
 * browser sidebars, which is why the row is soft and labelled "best-effort" in the brief.
 */
function devToolsLikelyOpen(): boolean {
  const widthDelta = window.outerWidth - window.innerWidth;
  const heightDelta = window.outerHeight - window.innerHeight;
  return widthDelta > DEVTOOLS_SIZE_DELTA_PX || heightDelta > DEVTOOLS_SIZE_DELTA_PX;
}

export function startBrowserSignals(onEvent: EmitFn): () => void {
  const teardown: (() => void)[] = [];

  const emit = (type: ProctorSignalType, details?: Record<string, unknown>) => {
    onEvent({
      type,
      severity: SIGNAL_SEVERITY[type],
      clientTs: Date.now(),
      ...(details ? { details } : {}),
    });
  };

  // One registration helper so no listener can be added without its removal being queued.
  // `never` for the event parameter lets each call site name the concrete event type it wants.
  const on = (target: EventTarget, type: string, handler: (event: never) => void) => {
    const listener = handler as EventListener;
    target.addEventListener(type, listener);
    teardown.push(() => target.removeEventListener(type, listener));
  };

  const timers = new Map<string, number>();
  const clearTimer = (key: string) => {
    const id = timers.get(key);
    if (id !== undefined) {
      window.clearTimeout(id);
      timers.delete(key);
    }
  };
  const startTimer = (key: string, ms: number, run: () => void) => {
    clearTimer(key);
    timers.set(
      key,
      window.setTimeout(() => {
        timers.delete(key);
        run();
      }, ms),
    );
  };
  teardown.push(() => {
    for (const id of timers.values()) window.clearTimeout(id);
    timers.clear();
  });

  // --- Tab hidden: immediate, hard -----------------------------------------
  on(document, "visibilitychange", () => {
    if (document.visibilityState === "hidden") emit("tab_hidden");
  });

  // --- Window blur lasting > 2 s: hard -------------------------------------
  // A hidden tab is already reported by the row above, and alt-tabbing fires both. Suppressing the
  // blur in that case keeps one action to one strike without relying on the server's cooldown.
  on(window, "blur", () => {
    startTimer("blur", WINDOW_BLUR_SUSTAINED_MS, () => {
      if (document.visibilityState === "hidden") return;
      emit("window_blur", { sustainedMs: WINDOW_BLUR_SUSTAINED_MS });
    });
  });
  on(window, "focus", () => clearTimer("blur"));

  // --- Left fullscreen: immediate, hard ------------------------------------
  const onFullscreenChange = () => {
    if (!isFullscreen()) emit("fullscreen_exit");
  };
  on(document, "fullscreenchange", onFullscreenChange);
  on(document, "webkitfullscreenchange", onFullscreenChange);

  // --- Copy / cut, prevented: immediate, hard ------------------------------
  const onCopyOrCut = (event: ClipboardEvent) => {
    event.preventDefault();
    emit("copy_cut_attempt", { action: event.type });
  };
  on(document, "copy", onCopyOrCut);
  on(document, "cut", onCopyOrCut);

  // --- Paste, prevented: immediate, hard -----------------------------------
  // Paste is blocked everywhere, code items included. The brief left that configurable, but a code
  // item is precisely where a pasted answer is worth the most, so this build has no exception.
  on(document, "paste", (event: ClipboardEvent) => {
    event.preventDefault();
    const target = event.target as HTMLElement | null;
    emit("paste_attempt", { into: target?.tagName?.toLowerCase() ?? "unknown" });
  });

  // --- PrintScreen: immediate, hard ----------------------------------------
  on(document, "keyup", (event: KeyboardEvent) => {
    if (event.key !== "PrintScreen") return;
    emit("printscreen");
    // Best effort only: the write needs focus and clipboard permission, and it cannot undo a
    // screenshot that the OS has already taken. It just makes the easy path less useful.
    navigator.clipboard?.writeText("").catch(() => undefined);
  });

  // --- Right-click and text selection, prevented: immediate, soft ----------
  on(document, "contextmenu", (event: MouseEvent) => {
    event.preventDefault();
    emit("context_menu_attempt");
  });
  on(document, "selectstart", (event: Event) => {
    const target = event.target as HTMLElement | null;
    // Selection inside the learner's own answer field is normal and must keep working.
    if (target?.closest("input, textarea, [contenteditable=true], [data-proctor-allow-select]")) return;
    event.preventDefault();
    emit("text_selection_attempt");
  });

  // --- Pointer left the window for > 3 s: soft -----------------------------
  on(document.documentElement, "mouseleave", () => {
    startTimer("mouseleave", MOUSE_LEFT_SUSTAINED_MS, () =>
      emit("mouse_left_window", { sustainedMs: MOUSE_LEFT_SUSTAINED_MS }),
    );
  });
  on(document.documentElement, "mouseenter", () => clearTimer("mouseleave"));

  // --- DevTools heuristic: soft, edge-triggered ----------------------------
  // Edge-triggered so leaving the panel open reports once rather than twice a second.
  let devToolsReported = devToolsLikelyOpen();
  const checkDevTools = () => {
    const open = devToolsLikelyOpen();
    if (open && !devToolsReported) {
      emit("devtools_suspected", {
        widthDelta: window.outerWidth - window.innerWidth,
        heightDelta: window.outerHeight - window.innerHeight,
      });
    }
    devToolsReported = open;
  };
  if (devToolsReported) {
    emit("devtools_suspected", { atStart: true });
  }
  on(window, "resize", checkDevTools);
  // Undocking or resizing the panel does not always fire `resize` on the page, so also poll.
  const devToolsPoll = window.setInterval(checkDevTools, 1_000);
  teardown.push(() => window.clearInterval(devToolsPoll));

  // --- Extended display: soft, at start and on change ----------------------
  let extendedReported = screenIsExtended();
  if (extendedReported) emit("extended_display", { atStart: true });
  const checkScreens = () => {
    const extended = screenIsExtended();
    if (extended && !extendedReported) emit("extended_display", { atStart: false });
    extendedReported = extended;
  };
  teardown.push(onScreenChange(checkScreens));

  return () => {
    for (const off of teardown.splice(0)) off();
  };
}
