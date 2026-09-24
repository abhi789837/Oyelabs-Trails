import type { ReactNode } from "react";
import { Compass } from "lucide-react";
import { LayoutGroup, motion } from "motion/react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { modulePath, useTracks, type ModuleMeta, type TrackMeta } from "@/content";
import { useModuleProgress, useTrackProgress } from "@/hooks/useTrackProgress";
import { accentClasses } from "@/lib/accent";
import { spring } from "@/lib/motion";
import { trackIcons } from "@/lib/track-meta";
import { cn } from "@/lib/utils";

interface TrackNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  /**
   * Namespaces the "you are here" marker. The sidebar and the mobile sheet can both be mounted at
   * once, and two elements sharing one `layoutId` fight over it — the marker flies between the two
   * navs instead of moving within one.
   */
  group?: string;
}

/** The single marker that slides between items as the route changes. */
const MARKER_ID = "trail-nav-marker";

/**
 * Which one item is the current one.
 *
 * Exactly one, deliberately: a module is inside a track, so without this both would light up and
 * the shared marker would have two homes. The deepest match wins, which is what "you are here"
 * means on a trail.
 */
function currentKey(pathname: string, tracks: TrackMeta[]): string {
  for (const track of tracks) {
    for (const module of track.modules) {
      if (module.available && pathname.startsWith(modulePath(module))) return `module:${module.id}`;
    }
    if (pathname.startsWith(`/track/${track.id}`) || pathname === `/report/${track.id}`) return `track:${track.id}`;
  }
  return pathname === "/" ? "dashboard" : "";
}

export function TrackNav({ collapsed = false, onNavigate, group = "trail-nav" }: TrackNavProps) {
  const tracks = useTracks();
  const { pathname } = useLocation();
  const current = currentKey(pathname, tracks);

  return (
    <LayoutGroup id={group}>
      <nav aria-label="Tracks" className="flex flex-col gap-1">
        <NavItemLink to="/" end label="Dashboard" collapsed={collapsed} current={current === "dashboard"} onNavigate={onNavigate}>
          <Compass className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </NavItemLink>

        {!collapsed && <p className="mb-1 mt-5 px-3 text-xs font-medium text-muted-foreground">Trails</p>}
        {collapsed && <div className="my-3 h-px bg-border" />}

        {tracks.map((track) => (
          <TrackNavItem
            key={track.id}
            track={track}
            collapsed={collapsed}
            current={current}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </LayoutGroup>
  );
}

/**
 * The marker itself: a short bar on the leading edge, the same amber the trail uses for "this is
 * where you are". It is one element that moves, not one per item that fades.
 */
function Marker({ className }: { className?: string }) {
  return (
    <motion.span
      layoutId={MARKER_ID}
      transition={spring}
      aria-hidden="true"
      className={cn("absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-trailmark", className)}
    />
  );
}

function NavItemLink({
  to,
  end,
  label,
  collapsed,
  current,
  onNavigate,
  children,
}: {
  to: string;
  end?: boolean;
  label: string;
  collapsed: boolean;
  current: boolean;
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
          "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
          collapsed && "justify-center px-0",
          isActive && "bg-accent",
        )
      }
    >
      {current && <Marker />}
      {children}
      {!collapsed && <span className="truncate">{label}</span>}
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

function TrackNavItem({
  track,
  collapsed,
  current,
  onNavigate,
}: {
  track: TrackMeta;
  collapsed: boolean;
  current: string;
  onNavigate?: () => void;
}) {
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
              "relative flex flex-col items-center gap-1.5 rounded-md py-2 transition-colors hover:bg-accent",
              isActive && "bg-accent",
            )}
          >
            {current === `track:${track.id}` && <Marker />}
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
        className={cn("group relative block rounded-md px-3 py-2.5 transition-colors hover:bg-accent", isActive && "bg-accent")}
      >
        {current === `track:${track.id}` && <Marker />}
        <span className="flex items-center gap-2.5">
          <Icon className={cn("h-4 w-4 shrink-0", accent.text)} aria-hidden="true" />
          <span className="flex-1 truncate text-sm font-medium leading-snug">{track.name}</span>
          <span className="font-mono text-xs text-muted-foreground tabular">
            {completed}/{total}
          </span>
        </span>
        <Progress value={pct} className="mt-2" indicatorClassName={accent.bg} aria-label={`${track.name}: ${progressLabel}`} />
      </Link>
      {isActive && (
        <ul aria-label={`${track.name} camps`} className="mb-2 ml-5 mt-1 border-l pl-2">
          {track.modules.map((module) => (
            <ModuleNavItem
              key={module.id}
              module={module}
              track={track}
              current={current === `module:${module.id}`}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ModuleNavItem({
  module,
  track,
  current,
  onNavigate,
}: {
  module: ModuleMeta;
  track: TrackMeta;
  current: boolean;
  onNavigate?: () => void;
}) {
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
          "relative flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors hover:bg-foreground/6",
          active ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {current && <Marker className="inset-y-0.5 -left-2.5" />}
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
