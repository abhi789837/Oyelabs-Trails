import { useEffect, useRef, type RefObject } from "react";

import { activeIncrement, ESTIMATED_MAX_SAMPLE_SEC, ESTIMATED_SAMPLE_INTERVAL_SEC, type ActiveTimeSample } from "@shared/videoSourcesCore";

/**
 * v4.5 Phase 2: active time for an embed we can't read (Drive, OneDrive, Box, Loom, other pages).
 *
 * Time counts, second by second, only while all of these hold:
 * - the tab is visible (`document.visibilityState`) and the embed is at least half on screen;
 * - the window has focus (`document.hasFocus()`, which stays true while the learner is using the
 *   player inside the iframe);
 * - the learner isn't idle: there was pointer, key, scroll or touch input on the page within
 *   `ESTIMATED_IDLE_AFTER_SEC`, or focus is inside this embed (they clicked into the player, whose
 *   own clicks we can't see).
 *
 * A sample goes to the server every `ESTIMATED_SAMPLE_INTERVAL_SEC` (and when the page hides), and
 * one 0-second sample on start sets the server's clock. The server caps every sample again.
 */
export function useActiveTime(frameRef: RefObject<HTMLIFrameElement | null>, enabled: boolean, send: (sample: ActiveTimeSample, exiting: boolean) => void): void {
  const sendRef = useRef(send);
  sendRef.current = send;

  useEffect(() => {
    if (!enabled) return undefined;
    let lastInput = performance.now();
    let lastTick = performance.now();
    let pending = 0;
    let sinceSend = 0;
    let onScreen = true;

    const onInput = () => {
      lastInput = performance.now();
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
    for (const e of events) window.addEventListener(e, onInput, { passive: true });

    let observer: IntersectionObserver | null = null;
    if (frameRef.current && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) => {
        onScreen = entries.some((en) => en.intersectionRatio >= 0.5);
      }, { threshold: [0, 0.5, 1] });
      observer.observe(frameRef.current);
    }

    const flush = (exiting: boolean) => {
      if (pending <= 0 && !exiting) return;
      const activeSeconds = Math.min(ESTIMATED_MAX_SAMPLE_SEC, Math.round(pending * 100) / 100);
      pending = 0;
      sinceSend = 0;
      if (activeSeconds > 0) sendRef.current({ activeSeconds, visible: true, focused: true }, exiting);
    };

    sendRef.current({ activeSeconds: 0, visible: document.visibilityState === "visible", focused: document.hasFocus() }, false);

    const timer = window.setInterval(() => {
      const t = performance.now();
      const dtSec = (t - lastTick) / 1000;
      lastTick = t;
      const inEmbed = document.activeElement !== null && document.activeElement === frameRef.current;
      if (inEmbed) lastInput = t;
      pending += activeIncrement({
        dtSec,
        visible: document.visibilityState === "visible" && onScreen,
        focused: document.hasFocus(),
        idleSec: (t - lastInput) / 1000,
      });
      sinceSend += dtSec;
      if (sinceSend >= ESTIMATED_SAMPLE_INTERVAL_SEC) flush(false);
    }, 1000);

    const onHide = () => {
      if (document.visibilityState === "hidden") flush(true);
    };
    const onPageHide = () => flush(true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.clearInterval(timer);
      for (const e of events) window.removeEventListener(e, onInput);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      flush(true);
    };
  }, [enabled, frameRef]);
}
