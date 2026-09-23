import { Cpu, LayoutDashboard, LogOut, Radio, ScrollText, Users, UserPlus } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthProvider";

/**
 * The admin console shell. Deliberately not the learner shell: that sidebar is track navigation,
 * which means nothing here. Plain and dense, per brief §13 — no dashboard template look.
 *
 * Sections land as their phases do; this list grows with them.
 */
const sections = [
  { to: "/admin", end: true, label: "Overview", icon: LayoutDashboard },
  { to: "/admin/people", end: false, label: "People", icon: Users },
  { to: "/admin/onboard", end: false, label: "Onboard learner", icon: UserPlus },
  { to: "/admin/live", end: false, label: "Live", icon: Radio },
  { to: "/admin/ai", end: false, label: "AI connection", icon: Cpu },
  { to: "/admin/audit", end: false, label: "Audit log", icon: ScrollText },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#admin-main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <BrandMark className="h-6 w-6" />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold leading-none">Oyelabs Trails</p>
            <p className="mt-0.5 font-mono text-[11px] leading-none text-muted-foreground">Admin console</p>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{user?.username}</span>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav aria-label="Admin sections" className="hidden w-52 shrink-0 border-r py-4 md:block">
          <ul className="space-y-0.5 px-2">
            {sections.map(({ to, end, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive ? "bg-surface-sunken font-medium text-foreground" : "text-muted-foreground hover:bg-surface-sunken/60",
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Section tabs replace the sidebar under md, so the console stays usable on a tablet. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto border-b px-4 py-2 md:hidden">
            {sections.map(({ to, end, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-sm",
                    isActive ? "bg-surface-sunken font-medium" : "text-muted-foreground",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <main id="admin-main" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
