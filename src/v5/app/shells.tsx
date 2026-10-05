import { Suspense, useState } from "react";
import { BookOpen, CalendarRange, Inbox, LayoutDashboard, Library, Repeat, Sun, UserPlus, Users, UserRound, BarChart3, type LucideIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";

import { chooseDesign } from "./designFlag";
import { ScreenFallback } from "./RouteFallback";

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
  return (
    <a
      href="#main"
      className="sr-only z-50 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
    >
      Skip to content
    </a>
  );
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
          isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
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

export function LearnerShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SkipLink />
      <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur sm:px-6">
        <NavLink to="/learn" className={cn("rounded-md", focusRing)} aria-label="Oyelearn, Today">
          <Logo variant="horizontal" height={24} decorative />
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
        </nav>
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 pb-20 focus:outline-hidden md:pb-0">
          <Suspense fallback={<ScreenFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t bg-background md:hidden">
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
                      "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                      focusRing,
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )
                  }
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
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
          <Logo variant="horizontal" height={24} decorative />
        </NavLink>
        <span className="font-mono text-xs text-muted-foreground">Admin</span>
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
