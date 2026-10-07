import {
  BookMarked,
  BookOpen,
  Boxes,
  ClipboardList,
  Building2,
  Cpu,
  Gauge,
  LayoutDashboard,
  Library,
  ListChecks,
  MessageSquareReply,
  Network,
  Radio,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Users,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { LayoutGroup, motion } from "motion/react";

import { useCurrentUser } from "@/features/auth/AuthProvider";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { Logo } from "@/components/brand/Logo";
import { Mark } from "@/components/brand/Mark";
import { NotificationCentre } from "@/components/layout/NotificationCentre";
import { UserMenu } from "@/components/layout/UserMenu";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The admin console shell. Deliberately not the learner shell: that sidebar is track navigation,
 * which means nothing here. Plain and dense, per brief §13 — no dashboard template look.
 *
 * The sections are grouped rather than listed flat: with seven of them a flat list gave no clue
 * that "Onboard learner" is a thing you do to a person while "Audit log" is a thing you read about
 * the system. Sections land as their phases do; these lists grow with them.
 */
interface Section {
  to: string;
  end: boolean;
  label: string;
  icon: LucideIcon;
  /** Hidden from a plain admin. The route guards it too — this only keeps the nav honest. */
  superadminOnly?: boolean;
}

interface SectionGroup {
  /** Null for the first group, which needs no heading above a single item. */
  label: string | null;
  items: Section[];
}

const groups: SectionGroup[] = [
  {
    label: null,
    items: [{ to: "/admin", end: true, label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "People",
    items: [
      { to: "/admin/people", end: false, label: "People", icon: Users },
      { to: "/admin/onboard", end: false, label: "Onboard learner", icon: UserPlus },
      { to: "/admin/departments", end: false, label: "Departments", icon: Building2 },
    ],
  },
  {
    label: "Assessments",
    items: [
      { to: "/admin/live", end: false, label: "Live", icon: Radio },
      { to: "/admin/integrity", end: false, label: "Integrity events", icon: ShieldAlert },
      { to: "/admin/reviews", end: false, label: "Review requests", icon: MessageSquareReply },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/ai", end: false, label: "AI connection", icon: Cpu, superadminOnly: true },
      { to: "/admin/ai-usage", end: false, label: "AI usage", icon: Gauge },
      { to: "/admin/audit", end: false, label: "Audit log", icon: ScrollText },
      { to: "/admin/curriculum", end: false, label: "Curriculum", icon: Library },
      { to: "/admin/skill-graph", end: false, label: "Skill graph", icon: Network },
      { to: "/admin/skill-groups", end: false, label: "Skill groups", icon: Boxes },
      { to: "/admin/question-bank", end: false, label: "Question library", icon: ListChecks },
      { to: "/admin/courses", end: false, label: "Courses", icon: BookOpen },
      { to: "/admin/sop", end: false, label: "Company SOPs", icon: ClipboardList },
      { to: "/admin/handbook", end: false, label: "Handbook", icon: BookMarked },
      { to: "/admin/generated", end: false, label: "Generated", icon: Sparkles },
    ],
  },
];

const allSections = groups.flatMap((group) => group.items);

/**
 * The nav this person actually gets.
 *
 * `currentSection` still matches against every section, not this filtered set: if an admin somehow
 * lands on a superadmin route the guard redirects them, and in the frame before it does, no marker
 * is better than the marker sitting on the wrong item.
 */
function visibleGroups(isSuperadmin: boolean): SectionGroup[] {
  if (isSuperadmin) return groups;
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.superadminOnly) }))
    .filter((group) => group.items.length > 0);
}

/** Exactly one current section, deepest match first, so the marker has one home. */
function currentSection(pathname: string): string {
  const match = allSections
    .filter((section) => (section.end ? pathname === section.to : pathname.startsWith(section.to)))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match?.to ?? "";
}

export function AdminLayout() {
  const { pathname } = useLocation();
  const current = currentSection(pathname);
  const me = useCurrentUser();
  const nav = visibleGroups(me.role === "superadmin");
  const sections = nav.flatMap((group) => group.items);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#admin-main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <Mark size={26} decorative className="sm:hidden" />
          <span className="hidden sm:block">
            <Logo theme="auto" size={24} decorative clearSpace={false} />
          </span>
          <span className="truncate rounded-sm bg-brand-50 px-1.5 py-0.5 text-xs font-medium leading-none text-primary-strong dark:bg-brand-900/60 dark:text-brand-300">
            Admin console
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <CommandPalette context="admin" />
            <NotificationCentre />
            <UserMenu context="admin" />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav aria-label="Admin sections" className="hidden w-52 shrink-0 border-r py-4 md:block">
          <LayoutGroup id="admin-nav">
            <div className="space-y-4">
              {nav.map((group, index) => (
                <div key={group.label ?? `group-${index}`}>
                  {group.label && (
                    <p className="mb-1 px-3 text-xs font-medium text-muted-foreground">{group.label}</p>
                  )}
                  <ul className="space-y-0.5 px-2">
                    {group.items.map(({ to, end, label, icon: Icon }) => (
                      <li key={to}>
                        <NavLink
                          to={to}
                          end={end}
                          className={({ isActive }) =>
                            cn(
                              "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                              isActive
                                ? "bg-surface-sunken font-medium text-foreground"
                                : "text-muted-foreground hover:bg-surface-sunken/60",
                            )
                          }
                        >
                          {current === to && (
                            <motion.span
                              layoutId="admin-nav-marker"
                              transition={spring}
                              aria-hidden="true"
                              className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary"
                            />
                          )}
                          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          {label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </LayoutGroup>
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

          <main id="admin-main" tabIndex={-1} className="min-w-0 flex-1 focus:outline-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
