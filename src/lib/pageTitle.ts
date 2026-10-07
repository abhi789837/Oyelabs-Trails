/**
 * Page titles (rebrand Phase 2): "Oyelearn" or "<Page> · Oyelearn", in both designs.
 *
 * Pages that know a better name (a course title, a learner's name) set it with `useDocumentTitle`
 * or v5's `PageHeader`. Every other route gets a title from its path (`routeTitle`), applied by
 * `RouteTitle` in App.tsx whenever the path changes, unless the page already set its own.
 */

export const BRAND_NAME = "Oyelearn";

export function pageTitle(page?: string | null): string {
  const p = page?.trim();
  return p ? `${p} · ${BRAND_NAME}` : BRAND_NAME;
}

/** The path a page last titled itself on. A page's effect runs before App's, so App can tell. */
let titledPath: string | null = null;

export function markPageTitled(path: string = typeof window === "undefined" ? "" : window.location.pathname): void {
  titledPath = path;
}

export function pageTitledFor(path: string): boolean {
  return titledPath === path;
}

/** Titles by the path's first two segments, then its first: "learn/plan", then "learn". */
const TITLES: Record<string, string> = {
  login: "Sign in",
  "change-password": "Set your password",
  verify: "Check a certificate",
  learn: "Today",
  "learn/plan": "My plan",
  "learn/library": "Library",
  "learn/review": "Review",
  "learn/me": "Me",
  "learn/lesson": "Lesson",
  "learn/certificate": "Certificate",
  assessment: "Assessment",
  design: "Design system",
  admin: "Admin",
  glossary: "Glossary",
  plan: "My plan",
  track: "Trail",
  report: "Certificate",
  goals: "Goal",
  practice: "Practice",
  tools: "Tools",
};

/** The title for a path when the page doesn't set one: `null` means just "Oyelearn". */
export function routeTitle(pathname: string): string | null {
  const [a, b] = pathname.split("/").filter(Boolean);
  return (b && TITLES[`${a}/${b}`]) || (a && TITLES[a]) || null;
}
