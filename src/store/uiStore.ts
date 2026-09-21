import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

// index.html applies the saved (or system) theme before first paint; start from that.
const initialTheme: Theme =
  typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light";

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: initialTheme,
      sidebarCollapsed: false,
      toggleTheme: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    // Key is also read by the inline script in index.html.
    { name: "oyelabs-ui" },
  ),
);
