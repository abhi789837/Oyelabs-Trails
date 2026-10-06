import { useEffect, useState } from "react";

/**
 * Registers /sw.js (built from ./sw.template.js) for the v5 design, and tells the page when a new
 * version is waiting. Nothing reloads on its own: the learner presses "Reload" in the prompt, and
 * only then does the new worker take over and the page reload. So no one is pulled out of a lesson.
 *
 * Only V5App calls this. People on the previous design never get a worker installed by it.
 */

let applyUpdate: (() => void) | null = null;
const listeners = new Set<(ready: boolean) => void>();
let started = false;
let reloadRequested = false;

function announce(worker: ServiceWorker) {
  applyUpdate = () => {
    reloadRequested = true;
    worker.postMessage({ type: "SKIP_WAITING" });
  };
  for (const l of listeners) l(true);
}

export function startServiceWorker(): void {
  if (started || typeof navigator === "undefined" || !("serviceWorker" in navigator) || !import.meta.env.PROD) return;
  started = true;
  const sw = navigator.serviceWorker;
  sw.addEventListener("controllerchange", () => {
    if (reloadRequested) window.location.reload();
  });
  sw.register("/sw.js", { scope: "/" })
    .then((reg) => {
      if (reg.waiting && sw.controller) announce(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const next = reg.installing;
        if (!next) return;
        next.addEventListener("statechange", () => {
          // "installed" with a page already controlled = an update, waiting for the go-ahead.
          if (next.state === "installed" && sw.controller) announce(next);
        });
      });
      // Long-lived tabs look for a new deploy hourly and whenever they come back into view.
      const check = () => void reg.update().catch(() => undefined);
      window.setInterval(check, 60 * 60 * 1000);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
    })
    .catch((error: unknown) => console.warn("[oyelearn] offline support is off:", error));
}

/** True once a new version is waiting; `reload()` switches to it and reloads. */
export function useServiceWorkerUpdate(): { ready: boolean; reload: () => void } {
  const [ready, setReady] = useState(applyUpdate !== null);
  useEffect(() => {
    listeners.add(setReady);
    return () => {
      listeners.delete(setReady);
    };
  }, []);
  return {
    ready,
    reload: () => {
      if (applyUpdate) applyUpdate();
      else window.location.reload();
    },
  };
}
