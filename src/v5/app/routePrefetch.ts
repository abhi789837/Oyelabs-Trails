import { currentUiOverride } from "./designFlag";
import { preloadModule } from "./preload";
import { bootPrefetch, designGuessV5, routePrefetchPlan } from "./routePlan";

/**
 * v5 Phase 9 performance: break the first-load waterfall (docs/v5/QUALITY.md, fix 1).
 *
 * Before, a v5 page loaded in a chain: `/api/auth/me` → V5App → `/api/me/manifest` → the page's
 * code → the page's query. Each link waited for the one before it. Now App.tsx calls
 * `startRoutePrefetch` once, at start-up, and on the last known design (`ui.v5`, remembered on this
 * device) it starts all of them at the same time:
 * - the v5 tree (`V5App`) and the matched page's code;
 * - the manifest and progress the curriculum loader asks for;
 * - the page's main query (`src/api/prefetch.ts`: `api.get` of the same path takes the response).
 *
 * A wrong guess costs a few wasted requests and nothing else: App.tsx still renders from the
 * server's answer, so the other tree loads exactly as before. With no guess (a first visit, or the
 * old UI) nothing is started, and the old UI behaves as it did.
 *
 * Kept tiny: App.tsx imports it eagerly. The `import()` calls below are the same specifiers the
 * route tree uses, so they share chunks with it.
 */

/**
 * The guess lives in localStorage ("v5" or "old"). Not a cookie: a cookie would ride on every
 * request, and tools that sign in with an injected Cookie header (Lighthouse, lhci) lose the
 * session once the page sets one of its own. The font preload in index.html reads the same key
 * (src/v5/app/routePlan.ts `designGuessV5`), so keep the name in step.
 */
const GUESS_KEY = "oyelearn-ui-guess";

/** Remembers the design this device last opened, for the next start-up. */
export function rememberDesign(v5: boolean): void {
  try {
    window.localStorage.setItem(GUESS_KEY, v5 ? "v5" : "old");
  } catch {
    // Storage blocked: every start-up is a first visit, as before.
  }
}

/** The design to bet on before `/api/auth/me` answers: a staff `?ui=` override, else the last one seen here. */
export function guessDesignV5(): boolean {
  return typeof window !== "undefined" && designGuessV5(window.location.search);
}

export { routePrefetchPlan } from "./routePlan";

const ignore = () => undefined;

/** The route modules, by the names V5App gives them (`lazyPreloaded`), so both share one download. */
export const ROUTE_MODULES = {
  v5app: () => import("./V5App"),
  today: () => import("@/v5/learner/today/TodayPage"),
  review: () => import("@/v5/learner/review/ReviewPage"),
  lesson: () => import("@/v5/learner/lesson/LessonPage"),
  admin: () => import("@/v5/admin/shell/AdminShell").then((m) => ({ default: m.AdminShell })),
  inbox: () => import("@/v5/admin/inbox/InboxPage"),
  oldDialogs: () => import("./oldDialogProviders"),
} as const;
type RouteModule = keyof typeof ROUTE_MODULES;
const isRouteModule = (name: string): name is RouteModule => name in ROUTE_MODULES;

let started = false;
/** The route modules this start-up asked for; DesignSwitch waits for them (see `whenRouteCodeSettled`). */
const pending: Promise<unknown>[] = [];
let settled = true;

/**
 * Resolves once every route module requested at start-up has loaded or failed, or after `capMs`.
 * App.tsx shows its plain loading screen until then instead of a Suspense fallback: React holds
 * back a suspended screen for about 300 ms after its fallback shows, and a chunk landing a moment
 * after `/api/auth/me` used to cost exactly that.
 */
export function whenRouteCodeSettled(capMs = 4000): Promise<void> {
  if (settled) return Promise.resolve();
  return Promise.race([Promise.allSettled(pending).then(() => undefined), new Promise<void>((r) => window.setTimeout(r, capMs))]);
}

/** True when nothing is still loading from the start-up prefetch (or none was started). */
export function routeCodeSettled(): boolean {
  return settled;
}

/** Called once by App.tsx, before the first render. */
export function startRoutePrefetch(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  // Reads (and remembers for the tab) a staff `?ui=` override, as App.tsx will.
  currentUiOverride();
  if (!guessDesignV5()) return;
  const { pathname, search } = window.location;
  // The public pages and the sign-in pages never render V5App.
  if (/^\/(login|change-password|verify)(\/|$)/.test(pathname)) return;

  // The queries (and fonts, and a lesson's poster): a build's index.html starts them in an inline
  // script (vite.config.ts `bootPrefetchScript`); the development server has no such script.
  if (import.meta.env.DEV) bootPrefetch([]);
  const plan = routePrefetchPlan(pathname, search);
  for (const name of ["v5app", ...plan.code].filter(isRouteModule)) pending.push(preloadModule(name, ROUTE_MODULES[name]).catch(ignore));
  settled = false;
  void Promise.allSettled(pending).then(() => {
    settled = true;
  });
}
