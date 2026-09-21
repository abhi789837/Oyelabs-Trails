import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/uiStore";

export function ThemeToggle() {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const next = theme === "dark" ? "light" : "dark";

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
