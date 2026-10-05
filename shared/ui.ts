import { z } from "zod";

/**
 * The `ui_v5` flag (docs/v5/PLAN.md, "The ui_v5 flag").
 *
 * Two layers: a global default in `app_meta` (`ui.v5_default`, "on" | "off", off until Phase 9) and
 * a per-user override in `user_prefs.data.uiV5` (true, false, or null/absent = follow the global
 * default). The server resolves both into one boolean on `/api/auth/me` so the client never has to
 * know the rule. Staff can also force either design for one browser session with `?ui=v5|old`;
 * that is client-only and never stored.
 */

export const UI_V5_DEFAULT_KEY = "ui.v5_default";

export const uiV5DefaultSchema = z.enum(["on", "off"]);
export type UiV5Default = z.infer<typeof uiV5DefaultSchema>;

/** `PUT /api/me/ui`. null clears the learner's choice so they follow the global default again. */
export const updateMyUiSchema = z.object({ v5: z.boolean().nullable() });
export type UpdateMyUi = z.infer<typeof updateMyUiSchema>;

export const myUiResponseSchema = z.object({
  /** What the learner chose; null = follow the global default. */
  v5Pref: z.boolean().nullable(),
  /** The design they get. */
  v5: z.boolean(),
});
export type MyUiResponse = z.infer<typeof myUiResponseSchema>;

/** `GET/PUT /api/admin/settings/ui` (superadmin to change). */
export const uiSettingsSchema = z.object({ v5Default: uiV5DefaultSchema });
export type UiSettings = z.infer<typeof uiSettingsSchema>;

/** The part of `/api/auth/me` that carries the effective flag. */
export const meUiSchema = z.object({ v5: z.boolean() });
export type MeUi = z.infer<typeof meUiSchema>;

/** Reads the stored preference out of the free-form `user_prefs.data` blob. Anything not boolean is "no choice". */
export function uiV5PrefFrom(
  data: Record<string, unknown> | null | undefined,
): boolean | null {
  const value = data?.uiV5;
  return typeof value === "boolean" ? value : null;
}

export { effectiveUiV5, parseUiOverride, type UiOverride } from "./uiFlag";
