import { Moon, Sun } from "lucide-react";

import { api } from "@/api/client";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import { applyTheme } from "@/v5/learner/me/settings";

/**
 * One-press light/dark switch for the sidebars (learner and admin). The full choice, including
 * "Match my device", stays in Me → Settings. The new theme applies at once, and it's saved in
 * the background like the Settings switch; a failed save keeps the local choice (uiStore).
 * It reads the theme from uiStore, so a change made in the account menu or on Me shows here too.
 */
export function ThemeToggle({ compact = false, className }: { compact?: boolean; className?: string }) {
  const theme = useUiStore((s) => s.theme);
  const next = theme === "dark" ? "light" : "dark";
  const label = theme === "dark" ? "Light mode" : "Dark mode";

  const flip = () => {
    applyTheme(next);
    void api.put("/api/v5/me/settings", { theme: next }).catch(() => undefined);
  };

  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={compact ? `Switch to ${label.toLowerCase()}` : undefined}
      title={compact ? label : undefined}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        compact && "size-10 justify-center px-0",
        className,
      )}
    >
      <Icon className="size-[18px]" aria-hidden="true" />
      {compact ? null : label}
    </button>
  );
}
