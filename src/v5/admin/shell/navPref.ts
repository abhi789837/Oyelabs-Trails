/**
 * The admin nav's width: "rail" (icons) or "full" (icons and names). With no saved choice it
 * follows the screen: full from 1280 px, the rail below. The choice is a per-device convenience,
 * so it lives in localStorage and a blocked storage just means "follow the screen".
 */

export type NavPref = "rail" | "full" | null;

const KEY = "oyelearn.v5.admin.nav";

export function navMode(pref: NavPref, wide: boolean): "rail" | "full" {
  return pref ?? (wide ? "full" : "rail");
}

export function parseNavPref(raw: string | null | undefined): NavPref {
  return raw === "rail" || raw === "full" ? raw : null;
}

export function readNavPref(): NavPref {
  try {
    return parseNavPref(globalThis.localStorage?.getItem(KEY));
  } catch {
    return null;
  }
}

export function writeNavPref(pref: NavPref): void {
  try {
    if (pref) globalThis.localStorage?.setItem(KEY, pref);
    else globalThis.localStorage?.removeItem(KEY);
  } catch {
    // Private mode or blocked storage: the choice lasts until the page closes.
  }
}
