import type { MyUiResponse } from "@shared/ui";
import { isStaffRole as isStaff, parseUiOverride, type UiOverride } from "@shared/uiFlag";
import type { Role } from "@shared/enums";

import { api } from "@/api/client";

/**
 * The client half of the ui_v5 flag. The server sends the effective value on /api/auth/me; staff
 * may force either design with `?ui=v5` or `?ui=old`, which lasts for this browser tab only
 * (sessionStorage) so it survives navigation but is never saved to the account.
 *
 * Kept tiny on purpose: App.tsx imports it eagerly, before either design's chunk loads.
 */

const OVERRIDE_KEY = "oyelearn-ui-override";

function readStored(): UiOverride {
  try {
    return parseUiOverride(window.sessionStorage.getItem(OVERRIDE_KEY));
  } catch {
    return null;
  }
}

function writeStored(value: UiOverride): void {
  try {
    if (value) window.sessionStorage.setItem(OVERRIDE_KEY, value);
    else window.sessionStorage.removeItem(OVERRIDE_KEY);
  } catch {
    // Storage blocked: the override then lasts only while the query parameter is in the URL.
  }
}

/** The `?ui=` value in the current URL, else the one remembered for this tab. */
export function currentUiOverride(): UiOverride {
  if (typeof window === "undefined") return null;
  const fromUrl = parseUiOverride(new URLSearchParams(window.location.search).get("ui"));
  if (fromUrl) {
    writeStored(fromUrl);
    return fromUrl;
  }
  return readStored();
}

/** What App.tsx renders. Learners never get the override, even if they type the parameter. */
export function effectiveDesignV5(role: Role, serverV5: boolean | null): boolean {
  if (isStaff(role)) {
    const override = currentUiOverride();
    if (override) return override === "v5";
  }
  return serverV5 === true;
}

/**
 * Saves the person's choice and reloads into the chosen design. A full reload rather than a state
 * flip: the two designs are separate trees with their own stores, and the reload also drops any
 * staff override so the saved choice is what they see.
 */
export async function chooseDesign(v5: boolean | null, landing: string): Promise<void> {
  await api.put<MyUiResponse>("/api/me/ui", { v5 });
  writeStored(null);
  window.location.assign(landing);
}
