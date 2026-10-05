/**
 * The zod-free half of the `ui_v5` flag (see `shared/ui.ts`). The client imports this before either
 * design's chunk loads, so it must not pull zod (or anything else) into every page's first download.
 */

export type UiV5Default = "on" | "off";

/** The learner's choice wins; with no choice (null or undefined) the global default applies. */
export function effectiveUiV5(
  userPref: boolean | null | undefined,
  globalDefault: UiV5Default | null | undefined,
): boolean {
  if (typeof userPref === "boolean") return userPref;
  return globalDefault === "on";
}

/** The staff-only `?ui=` override: "v5" forces v5, "old" forces the old UI, anything else is ignored. */
export type UiOverride = "v5" | "old" | null;
export function parseUiOverride(value: string | null | undefined): UiOverride {
  return value === "v5" || value === "old" ? value : null;
}

/** Same rule as `isStaff` in `shared/enums.ts`, without importing zod. */
export function isStaffRole(role: string): boolean {
  return role === "superadmin" || role === "admin";
}
