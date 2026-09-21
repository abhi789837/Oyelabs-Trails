import { Compass } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { allTracks } from "@/data/tracks";
import { useTrackProgress } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { trackIcons } from "@/lib/track-meta";
import { cn } from "@/lib/utils";
import type { Track } from "@/types/curriculum";

interface TrackNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function TrackNav({ collapsed = false, onNavigate }: TrackNavProps) {
  return (
    <nav aria-label="Tracks" className="flex flex-col gap-1">
      <NavItemLink to="/" end label="Dashboard" collapsed={collapsed} onNavigate={onNavigate}>
        <Compass className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </NavItemLink>

      {!collapsed && <p className="mb-1 mt-5 px-3 text-xs font-medium text-muted-foreground">Trails</p>}
      {collapsed && <div className="my-3 h-px bg-border" />}

      {allTracks.map((track) => (
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
  children: React.ReactNode;
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

function TrackNavItem({ track, collapsed, onNavigate }: { track: Track } & TrackNavProps) {
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
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-md py-2 transition-colors hover:bg-accent",
              isActive && "bg-accent",
            )}
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
    <Link
      to={`/track/${track.id}`}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn("group block rounded-md px-3 py-2.5 transition-colors hover:bg-accent", isActive && "bg-accent")}
    >
      <span className="flex items-center gap-2.5">
        <Icon className={cn("h-4 w-4 shrink-0", accent.text)} aria-hidden="true" />
        <span className="flex-1 truncate text-sm font-medium">{track.name}</span>
        <span className="font-mono text-xs text-muted-foreground tabular">
          {completed}/{total}
        </span>
      </span>
      <Progress value={pct} className="mt-2" indicatorClassName={accent.bg} aria-label={`${track.name}: ${progressLabel}`} />
    </Link>
  );
}
