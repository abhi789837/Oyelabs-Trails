import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { TrackNav } from "./TrackNav";

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 flex-col border-r transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex-1 overflow-y-auto py-4", collapsed ? "px-2" : "px-3")}>
        <TrackNav collapsed={collapsed} />
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
          {!collapsed && "Collapse sidebar"}
        </Button>
      </div>
    </aside>
  );
}
