import { Suspense, useState } from "react";
import { BookMarked, BookOpen, CalendarRange, Inbox, ShieldCheck, LayoutDashboard, Library, Repeat, Sun, UserPlus, Users, UserRound, BarChart3, type LucideIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

// Each brand component from its own file, not the barrel (the lesson route's budget).
import { Logo } from "@/components/brand/Logo";
import { Mark } from "@/components/brand/Mark";
import { useAuth } from "@/features/auth/AuthProvider";
import { isStaffRole } from "@shared/uiFlag";
import { cn } from "@/lib/utils";

import { SkipLink as V5SkipLink } from "@/v5/design/components/SkipLink";

import { chooseDesign } from "./designFlag";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { ScreenFallback } from "./RouteFallback";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Temporary v5 shells from Phase 0. Deliberately plain: the design system phase (P1) supplies the
 * real shell components, and these get swapped for them. What must survive the swap is the
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

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Inbox", icon: Inbox, end: true },
  { to: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/people", label: "People", icon: Users },
  { to: "/admin/onboard", label: "Onboard", icon: UserPlus },
  { to: "/admin/library", label: "Library", icon: BookOpen },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
];

/** Old admin pages still reachable from the v5 console, shown in the old design inside this shell. */
const ADMIN_OLDER: { to: string; label: string; superadmin?: boolean }[] = [
  { to: "/admin/departments", label: "Departments" },
  { to: "/admin/question-bank", label: "Question bank" },
  { to: "/admin/curriculum", label: "Curriculum" },
  { to: "/admin/skill-graph", label: "Skill graph" },
  { to: "/admin/skill-groups", label: "Skill groups" },
  { to: "/admin/courses", label: "Courses" },
  { to: "/admin/generated", label: "Generated courses" },
  { to: "/admin/reviews", label: "Score reviews" },
  { to: "/admin/live", label: "Live" },
  { to: "/admin/integrity", label: "Integrity" },
  { to: "/admin/sop", label: "SOP" },
  { to: "/admin/handbook", label: "Handbook" },
  { to: "/admin/ai-usage", label: "AI usage" },
  { to: "/admin/audit", label: "Audit log" },
  { to: "/admin/ai", label: "AI connection", superadmin: true },
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

function UsePreviousDesign({ landing }: { landing: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void chooseDesign(false, landing).catch(() => setBusy(false));
      }}
      className={cn("min-h-9 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60", focusRing)}
    >
      Use previous design
    </button>
  );
}

/** Links under the main ones: the handbook for everyone, and the admin console for staff. */
function learnerExtras(role: string | undefined): NavItem[] {
  const items: NavItem[] = [{ to: "/glossary", label: "Handbook", icon: BookMarked }];
  if (role && isStaffRole(role)) items.push({ to: "/admin", label: "Admin", icon: ShieldCheck });
  return items;
}

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
            <li>
              <ThemeToggle className="w-full" />
            </li>
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

export function AdminShell() {
  const { user } = useAuth();
  const superadmin = user?.role === "superadmin";
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SkipLink />
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
        <NavLink to="/admin" className={cn("rounded-md", focusRing)} aria-label="Oyelearn admin, Inbox">
          <Logo theme="auto" size={24} decorative />
        </NavLink>
        <span className="rounded-sm bg-brand-soft px-1.5 py-0.5 text-xs font-medium text-brand-fg">Admin</span>
        <div className="ml-auto flex items-center gap-1">
          <NavLink to="/learn" className={cn("flex min-h-9 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground", focusRing)}>
            Learner view
          </NavLink>
          <UsePreviousDesign landing="/admin" />
        </div>
      </header>
      <nav aria-label="Admin" className="overflow-x-auto border-b px-2 md:hidden">
        <ul className="flex gap-1 py-1">
          {ADMIN_NAV.map((item) => (
            <li key={item.to} className="shrink-0">
              <SideNavLink item={item} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex flex-1">
        <nav aria-label="Admin" className="hidden w-60 shrink-0 overflow-y-auto border-r p-3 md:block">
          <ul className="space-y-1">
            {ADMIN_NAV.map((item) => (
              <li key={item.to}>
                <SideNavLink item={item} />
              </li>
            ))}
          </ul>
          <p className="mt-6 px-3 font-mono text-[11px] text-muted-foreground">Older pages</p>
          <ul className="mt-1 space-y-0.5">
            {ADMIN_OLDER.filter((item) => !item.superadmin || superadmin).map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-8 items-center rounded-md px-3 text-sm",
                      focusRing,
                      isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 focus:outline-hidden">
          <Suspense fallback={<ScreenFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
