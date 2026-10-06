/**
 * Runs `run` once the page has loaded (the `load` event: the first screen's images and fonts are
 * in) and the browser is then idle. Returns a cancel function. Phase 9 performance: for work no
 * screen needs to show its content (warming the next lesson steps, the motivation host), so it
 * doesn't compete with the first screen on a slow connection.
 */
export function afterLoadIdle(run: () => void, idleTimeoutMs = 1500): () => void {
  let idle: number | null = null;
  let timer: number | null = null;
  const schedule = () => {
    if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(run, { timeout: idleTimeoutMs });
    else timer = window.setTimeout(run, 200);
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
  return () => {
    window.removeEventListener("load", schedule);
    if (idle !== null) window.cancelIdleCallback(idle);
    if (timer !== null) window.clearTimeout(timer);
  };
}
