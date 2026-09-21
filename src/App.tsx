import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { BrowserRouter } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUiStore } from "@/store/uiStore";

export default function App() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={150}>
          <AppShell />
        </TooltipProvider>
      </MotionConfig>
    </BrowserRouter>
  );
}
