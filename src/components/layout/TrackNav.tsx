import type { ReactNode } from "react";
import { Compass } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { modulePath, useTracks, type ModuleMeta, type TrackMeta } from "@/content";
import { useModuleProgress, useTrackProgress } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { trackIcons } from "@/lib/track-meta";
import { cn } from "@/lib/utils";

interface TrackNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function TrackNav({ collapsed = false, onNavigate }: TrackNavProps) {
  const tracks = useTracks();
  return (
    <nav aria-label="Tracks" className="flex flex-col gap-1">
      <NavItemLink to="/" end label="Dashboard" collapsed={collapsed} onNavigate={onNavigate}>
        <Compass className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </NavItemLink>

      {!collapsed && <p className="mb-1 mt-5 px-3 text-xs font-medium text-muted-foreground">Trails</p>}
      {collapsed && <div className="my-3 h-px bg-border" />}

      {tracks.map((track) => (
        <TrackNavItem key={track.id} track={track} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

function NavItemLink({
  to,
  end,
  label,
  collapsed,
  onNavigate,
  children,
}: {
  to: string;
  end?: boolean;
  label: string;
  collapsed: boolean;
  onNavigate?: () => void;
  children: ReactNode;
}) {
  const link = (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
          collapsed && "justify-center px-0",
          isActive && "bg-accent",
        )
      }
    >
      {children}
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function TrackNavItem({ track, collapsed, onNavigate }: { track: TrackMeta } & TrackNavProps) {
  const { pathname } = useLocation();
  const { completed, total, pct } = useTrackProgress(track);
  const accent = accentClasses[track.accentToken];
  const Icon = trackIcons[track.id];
  const isActive = pathname.startsWith(`/track/${track.id}`) || pathname === `/report/${track.id}`;
  const progressLabel = `${completed} of ${total} topics complete`;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={`/track/${track.id}`}
            onClick={onNavigate}
            aria-label={`${track.name}, ${progressLabel}`}
            aria-current={isActive ? "page" : undefined}
            className={cn("flex flex-col items-center gap-1.5 rounded-md py-2 transition-colors hover:bg-accent", isActive && "bg-accent")}
          >
            <Icon className={cn("h-4 w-4", accent.text)} aria-hidden="true" />
            <Progress value={pct} className="h-1 w-6" indicatorClassName={accent.bg} aria-hidden="true" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          <span className="font-medium">{track.name}</span>
          <span className="block opacity-80">{progressLabel}</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <Link
        to={`/track/${track.id}`}
        onClick={onNavigate}
        aria-current={pathname === `/track/${track.id}` ? "page" : undefined}
        className={cn("group block rounded-md px-3 py-2.5 transition-colors hover:bg-accent", isActive && "bg-accent")}
      >
        <span className="flex items-center gap-2.5">
          <Icon className={cn("h-4 w-4 shrink-0", accent.text)} aria-hidden="true" />
          <span className="flex-1 text-sm font-medium leading-snug">{track.name}</span>
          <span className="font-mono text-xs text-muted-foreground tabular">
            {completed}/{total}
          </span>
        </span>
        <Progress value={pct} className="mt-2" indicatorClassName={accent.bg} aria-label={`${track.name}: ${progressLabel}`} />
      </Link>
      {isActive && (
        <ul aria-label={`${track.name} camps`} className="mb-2 ml-5 mt-1 border-l pl-2">
          {track.modules.map((module) => (
            <ModuleNavItem key={module.id} module={module} track={track} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ModuleNavItem({ module, track, onNavigate }: { module: ModuleMeta; track: TrackMeta; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { completed, total, isComplete } = useModuleProgress(module);
  const active = pathname.startsWith(modulePath(module));
  const accent = accentClasses[track.accentToken];

  if (!module.available) {
    return (
      <li className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground/70">
        <span className="h-1.5 w-1.5 shrink-0 rounded-[1px] border border-basalt/60" aria-hidden="true" />
        <span className="flex-1 truncate">{module.name}</span>
        <span className="font-mono text-[10px]">soon</span>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={modulePath(module)}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors hover:bg-foreground/[0.06]",
          active ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-[1px]",
            isComplete ? "bg-summit" : completed > 0 ? accent.bg : "border border-basalt",
          )}
        />
        <span className="flex-1 truncate">{module.name}</span>
        <span className="font-mono text-[10px] tabular">
          {completed}/{total}
        </span>
      </Link>
    </li>
  );
}
