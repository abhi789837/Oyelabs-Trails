import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import { TrackNav } from "./TrackNav";

/**
 * Collapsed keeps the trail icons and their progress bars; expanded adds the names and the camps
 * of whichever trail you are on.
 */
const WIDTH = { collapsed: 64, expanded: 256 } as const;

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const reduceMotion = useReducedMotion();

  return (
    <motion.aside
      /* Width is a layout property, so this is the one animation in the shell that is not pure
         transform — there is no transform that makes the main column give up space. It is one
         element for 200ms, and it is flattened outright when reduced motion is asked for. */
      initial={false}
      animate={{ width: collapsed ? WIDTH.collapsed : WIDTH.expanded }}
      transition={reduceMotion ? { duration: 0 } : transition.base}
      className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 flex-col overflow-hidden border-r lg:flex"
    >
      <div className={cn("flex-1 overflow-y-auto py-4", collapsed ? "px-2" : "px-3")}>
        <TrackNav collapsed={collapsed} group="sidebar" />
      </div>
      <div className={cn("border-t p-2", !collapsed && "px-3")}>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={toggleSidebar}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn("text-muted-foreground", collapsed ? "mx-auto flex" : "w-full justify-start")}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          {!collapsed && <span className="truncate">Collapse sidebar</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
