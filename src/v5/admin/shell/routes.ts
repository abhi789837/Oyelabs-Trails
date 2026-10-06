/** The admin screens built for v5. Every other `/admin/...` page is an older page in the v5 frame. */
const V5_EXACT = new Set(["/admin", "/admin/overview", "/admin/people", "/admin/onboard", "/admin/library", "/admin/reports", "/admin/announcements", "/admin/problems", "/admin/tutor-answers"]);

/** `/admin/library/:id/edit` is v5; `/admin/people/:id` and `/admin/onboard/classic` are older pages. */
export function isOlderPage(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (!path.startsWith("/admin/")) return false;
  if (V5_EXACT.has(path)) return false;
  if (/^\/admin\/library\/[^/]+\/edit$/.test(path)) return false;
  return true;
}
