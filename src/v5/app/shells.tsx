import { Suspense } from "react";
import { BookMarked, CalendarRange, Library, Repeat, ShieldCheck, Sun, UserRound, type LucideIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

// Each brand component from its own file, not the barrel (the lesson route's budget).
import { Logo } from "@/components/brand/Logo";
import { Mark } from "@/components/brand/Mark";
import { useAuth } from "@/features/auth/AuthProvider";
import { isStaffRole } from "@shared/uiFlag";
import { cn } from "@/lib/utils";

import { SkipLink as V5SkipLink } from "@/v5/design/components/SkipLink";

import { PRACTICE_LINKS } from "./practiceLinks";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { ScreenFallback } from "./RouteFallback";
import { UserMenu } from "./UserMenu";

/**
 * The v5 learner shell (the admin has its own frame, src/v5/admin/shell). Started in Phase 0,
 * deliberately plain. What must survive the swap is the
 * structure — skip link, one `main`, bottom nav on phones and side nav from `md` up, and every
 * screen rendered through a Suspense boundary so lazy screens never blank the shell.
 */

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const LEARNER_NAV: NavItem[] = [
  { to: "/learn", label: "Today", icon: Sun, end: true },
  { to: "/learn/plan", label: "My plan", icon: CalendarRange },
  { to: "/learn/library", label: "Library", icon: Library },
  { to: "/learn/review", label: "Review", icon: Repeat },
  { to: "/learn/me", label: "Me", icon: UserRound },
];

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong";

function SkipLink() {
  return <V5SkipLink target="main" tone="shared" />;
}

function SideNavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium",
          focusRing,
          isActive ? "bg-brand-soft text-brand-fg" : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )
      }
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {item.label}
    </NavLink>
  );
}

/**
 * Links under the main ones: the handbook for everyone, and the admin console for staff. The
 * practice pages follow as a plain text list (no icons: the lesson route's budget). On phones the
 * same links are on Me (the bottom bar is full). The theme switch is in the account menu and on
 * Me → Settings, as it was in the previous design's user menu.
 */
function learnerExtras(role: string | undefined): NavItem[] {
  const items: NavItem[] = [{ to: "/glossary", label: "Handbook", icon: BookMarked, end: true }];
  if (role && isStaffRole(role)) items.push({ to: "/admin", label: "Admin", icon: ShieldCheck });
  return items;
}

const PRACTICE = PRACTICE_LINKS.filter((l) => l.to !== "/glossary");

export function LearnerShell() {
  const { user } = useAuth();
  const extras = learnerExtras(user?.role);
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SkipLink />
      <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur sm:px-6">
        {/* The full logo from md up (24 px tall = 102 px wide, over the 96 px minimum); the mark on a phone. */}
        <NavLink to="/learn" className={cn("flex items-center rounded-md", focusRing)} aria-label="Oyelearn, Today">
          <Mark size={28} decorative className="md:hidden" />
          {/* A wrapper carries the breakpoint: the logo's own inline-flex would beat "hidden". */}
          <span className="hidden md:block">
            <Logo theme="auto" size={24} decorative />
          </span>
        </NavLink>
        {/* The account menu, at the far right. The XP and bell (src/v5/motivation/HostImpl.tsx) sit
            just to its left, over this header. */}
        <div className="ml-auto flex items-center">
          <UserMenu context="learner" />
        </div>
      </header>
      <div className="flex flex-1">
        <nav aria-label="Main" className="hidden w-56 shrink-0 border-r p-3 md:block">
          <ul className="space-y-1">
            {LEARNER_NAV.map((item) => (
              <li key={item.to}>
                <SideNavLink item={item} />
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1 border-t pt-4" aria-label="More">
            {extras.map((item) => (
              <li key={item.to}>
                <SideNavLink item={item} />
              </li>
            ))}
          </ul>
          <p className="mt-4 px-3 text-xs font-medium text-muted-foreground" id="nav-practice">
            Practice
          </p>
          <ul className="mt-1 space-y-0.5" aria-labelledby="nav-practice">
            {PRACTICE.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    cn("flex min-h-8 items-center rounded-md px-3 text-sm", focusRing, isActive ? "bg-brand-soft text-brand-fg" : "text-muted-foreground hover:bg-accent hover:text-foreground")
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 pb-20 focus:outline-hidden md:pb-0">
          <RouteErrorBoundary>
            <Suspense fallback={<ScreenFallback />}>
              <Outlet />
            </Suspense>
          </RouteErrorBoundary>
        </main>
      </div>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {LEARNER_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "group flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                      focusRing,
                      isActive ? "text-brand-fg" : "text-muted-foreground",
                    )
                  }
                >
                  {/* The active page's icon sits on a Mist pill, as in the admin's bottom bar. */}
                  <span className="grid h-7 w-12 place-items-center rounded-full transition-colors duration-200 group-aria-[current=page]:bg-brand-soft">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
