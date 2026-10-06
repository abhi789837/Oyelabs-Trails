import { useUiStore } from "@/store/uiStore";
import type { Settings } from "@shared/me";

/**
 * Applies the theme setting now. "system" follows the OS. The resolved light/dark goes into the
 * existing `uiStore` (persisted as `oyelabs-ui`, which index.html reads before first paint), so the
 * choice also holds on the next load and in the previous design.
 */
export function applyTheme(theme: Settings["theme"]): void {
  const dark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  useUiStore.setState({ theme: dark ? "dark" : "light" });
}

export function themeFromDocument(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
