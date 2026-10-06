import {
  BarChart3,
  BookOpen,
  BookOpenCheck,
  Bot,
  CircleHelp,
  FileWarning,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  Megaphone,
  PlusCircle,
  Undo2,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import type { UserSummary } from "@shared/admin";

import { useAuth } from "@/features/auth/AuthProvider";
import { adminApi } from "@/features/admin/api";
import { chooseDesign } from "@/v5/app/designFlag";
import { ScreenFallback } from "@/v5/app/RouteFallback";
// Direct imports, not the `@/v5/design` barrel: the barrel loads every design module (Phase 9 performance).
import { Button } from "@/v5/design/components/Button";
import { CommandPalette, Dialog, useCommandShortcut, type CommandGroup } from "@/v5/design/components/Overlays";
import { Kbd } from "@/v5/design/components/Primitives";
import { Tooltip } from "@/v5/design/components/Tooltip";
import { useV5Root } from "@/v5/design/useV5Root";
import { V5MotionProvider } from "@/v5/design/V5MotionProvider";

import { BiggerScreenNote } from "../parts/BiggerScreen";
import { AdminFrame, type FrameLink } from "./AdminFrame";

import { ADMIN_SHORTCUTS, createKeySequence, isTypingTarget } from "./keys";
import { filterPalette } from "./palette";
import { isOlderPage } from "./routes";

/**
 * The v5 admin frame (docs/v5/PLAN.md: admin routes). Compact density, a left nav, the ⌘K palette
 * (verbs, pages and people), two-key shortcuts and a `?` sheet. Every screen renders through a
 * Suspense boundary so lazy screens never blank the shell.
 */

interface ShellState {
  inboxCount: number | null;
  setInboxCount: (n: number | null) => void;
  openPalette: () => void;
}

const ShellContext = createContext<ShellState>({ inboxCount: null, setInboxCount: () => undefined, openPalette: () => undefined });

export function useAdminShell(): ShellState {
  return useContext(ShellContext);
}

interface Page {
  href: string;
  label: string;
  icon: FrameLink["icon"];
  keywords?: string[];
  end?: boolean;
}

/** Main nav, in order. The first four are the phone's bottom bar; the rest are under Menu. */
const MAIN: Page[] = [
  { href: "/admin", label: "Inbox", icon: Inbox, end: true, keywords: ["attention", "home", "todo"] },
  { href: "/admin/people", label: "People", icon: Users, keywords: ["learners", "team"] },
  { href: "/admin/onboard", label: "Onboard", icon: UserPlus, keywords: ["add", "new", "invite"] },
  { href: "/admin/library", label: "Library", icon: BookOpen, keywords: ["courses", "content"] },
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard, keywords: ["dashboard", "numbers"] },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, keywords: ["charts", "export", "csv"] },
];

const MORE: Page[] = [
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone, keywords: ["message", "news"] },
  { href: "/admin/problems", label: "Problems reported", icon: FileWarning, keywords: ["report", "bug"] },
  { href: "/admin/tutor-answers", label: "Tutor answers", icon: Bot, keywords: ["ai", "helpful", "thumbs"] },
];

/** Older pages, shown unchanged inside this frame until each is replaced. */
const OLDER: { href: string; label: string; superadmin?: boolean }[] = [
  { href: "/admin/reviews", label: "Answer reviews" },
  { href: "/admin/generated", label: "New courses (older page)" },
  { href: "/admin/courses", label: "Courses (older page)" },
  { href: "/admin/departments", label: "Departments" },
  { href: "/admin/question-bank", label: "Question library" },
  { href: "/admin/curriculum", label: "Curriculum" },
  { href: "/admin/skill-graph", label: "What to learn first" },
  { href: "/admin/skill-groups", label: "Skill groups" },
  { href: "/admin/live", label: "Tests happening now" },
  { href: "/admin/integrity", label: "Test warnings" },
  { href: "/admin/sop", label: "How-to guides" },
  { href: "/admin/handbook", label: "Handbook" },
  { href: "/admin/ai-usage", label: "AI usage" },
  { href: "/admin/audit", label: "Activity log" },
  { href: "/admin/ai", label: "AI settings", superadmin: true },
];

const SHORTCUT_ROUTES: Record<string, string> = {
  "g i": "/admin",
  "g o": "/admin/overview",
  "g p": "/admin/people",
  "g n": "/admin/onboard",
  "g l": "/admin/library",
  "g r": "/admin/reports",
};

function isActive(pathname: string, page: Page): boolean {
  return page.end ? pathname === page.href : pathname === page.href || pathname.startsWith(`${page.href}/`);
}

export function AdminShell() {
  useV5Root({ density: "compact" });
  const { user } = useAuth();
  const superadmin = user?.role === "superadmin";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [inboxCount, setInboxCount] = useState<number | null>(null);
  const [people, setPeople] = useState<UserSummary[] | null>(null);
  const peopleLoading = useRef(false);

  useCommandShortcut(setPaletteOpen);

  // People for the palette: read shortly after the console opens (so a name typed straight after
  // Ctrl+K is found), or at once if the palette opens first.
  const [wantPeople, setWantPeople] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setWantPeople(true), 1500);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (!(paletteOpen || wantPeople) || people || peopleLoading.current) return;
    peopleLoading.current = true;
    adminApi
      .listUsers()
      .then((r) => setPeople(r.users))
      .catch(() => setPeople([]))
      .finally(() => {
        peopleLoading.current = false;
      });
  }, [paletteOpen, wantPeople, people]);

  // Two-key shortcuts.
  useEffect(() => {
    const seq = createKeySequence([...Object.keys(SHORTCUT_ROUTES), "?"]);
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector("[role=dialog]")) return;
      const hit = seq.feed(e.key, Date.now());
      if (!hit) return;
      e.preventDefault();
      if (hit === "?") setHelpOpen(true);
      else navigate(SHORTCUT_ROUTES[hit]!);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const go = useCallback((href: string) => navigate(href), [navigate]);

  const groups = useMemo<CommandGroup[]>(() => {
    const actions: CommandGroup = {
      heading: "Do something",
      items: [
        { id: "act-onboard", label: "Onboard someone", icon: <UserPlus />, keywords: ["add", "new", "learner", "invite"], shortcut: ["G", "N"], onSelect: () => go("/admin/onboard") },
        { id: "act-onboard-many", label: "Onboard several people", icon: <Users />, keywords: ["bulk", "paste"], onSelect: () => go("/admin/onboard?mode=bulk") },
        { id: "act-course", label: "Create course", icon: <PlusCircle />, keywords: ["new", "write", "lesson"], onSelect: () => go("/admin/library?new=1") },
        { id: "act-usage", label: "Open AI usage", icon: <Bot />, keywords: ["cost", "spend", "ai"], onSelect: () => go("/admin/ai-usage") },
        { id: "act-announce", label: "Write an announcement", icon: <Megaphone />, keywords: ["message", "news"], onSelect: () => go("/admin/announcements?new=1") },
        { id: "act-export", label: "Download a report", icon: <BarChart3 />, keywords: ["csv", "export"], onSelect: () => go("/admin/reports") },
        { id: "act-learner", label: "See the learner view", icon: <GraduationCap />, keywords: ["preview"], onSelect: () => go("/learn") },
      ],
    };
    const pages: CommandGroup = {
      heading: "Go to",
      items: [...MAIN, ...MORE, ...OLDER.filter((p) => !p.superadmin || superadmin).map((p) => ({ ...p, icon: BookOpenCheck }))].map((p) => ({
        id: `go-${p.href}`,
        label: p.label,
        icon: <p.icon />,
        keywords: "keywords" in p ? (p.keywords as string[] | undefined) : undefined,
        onSelect: () => go(p.href),
      })),
    };
    const out = [actions, pages];
    if (people) {
      out.push({
        heading: "People",
        items: people.map((p) => ({
          id: `person-${p.id}`,
          label: p.displayName,
          hint: p.username,
          icon: <UserRound />,
          keywords: [p.username, p.roleTitle ?? ""].filter(Boolean),
          onSelect: () => go(`/admin/people?person=${encodeURIComponent(p.id)}`),
        })),
      });
    }
    return out;
  }, [people, go, superadmin]);

  const main: FrameLink[] = MAIN.map((p) => ({
    href: p.href,
    label: p.label,
    icon: p.icon,
    active: isActive(pathname, p),
    badge: p.href === "/admin" && inboxCount ? inboxCount : undefined,
  }));
  const more: FrameLink[] = MORE.map((p) => ({ href: p.href, label: p.label, icon: p.icon, active: isActive(pathname, p) }));
  const older = OLDER.filter((p) => !p.superadmin || superadmin).map((p) => ({ href: p.href, label: p.label, active: pathname === p.href }));
  const olderPage = isOlderPage(pathname);

  const state = useMemo(() => ({ inboxCount, setInboxCount, openPalette: () => setPaletteOpen(true) }), [inboxCount]);

  return (
    <V5MotionProvider>
    <ShellContext.Provider value={state}>
      <AdminFrame main={main} more={more} older={older} onSearch={() => setPaletteOpen(true)} topRight={<TopRight onHelp={() => setHelpOpen(true)} />}>
        {olderPage ? <BiggerScreenNote id="older-pages" className="mx-4 mt-4" /> : null}
        <Suspense fallback={<ScreenFallback />}>
          <Outlet />
        </Suspense>
      </AdminFrame>
      {/* Keyed on the people list so the best match is highlighted again when names arrive. */}
      <CommandPalette
        key={people ? "with-people" : "pages"}
        shouldFilter={false}
        open={paletteOpen}
        onOpenChange={(o) => {
          setPaletteOpen(o);
          if (!o) setSearch("");
        }}
        groups={filterPalette(groups, search)}
        value={search}
        onValueChange={setSearch}
        placeholder="Type a name, a page or what you want to do…"
      />
      <Dialog open={helpOpen} onOpenChange={setHelpOpen} title="Keyboard shortcuts" description="Press the keys one after the other, not together." size="sm">
        <ul className="flex flex-col gap-2">
          <li className="flex items-center justify-between gap-4 text-small">
            <span>Search, or jump anywhere</span>
            <span className="flex gap-1">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </li>
          {ADMIN_SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between gap-4 text-small">
              <span>{s.label}</span>
              <span className="flex gap-1">
                {s.keys.split(" ").map((k) => (
                  <Kbd key={k}>{k.toUpperCase()}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </Dialog>
    </ShellContext.Provider>
    </V5MotionProvider>
  );
}

function TopRight({ onHelp }: { onHelp: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <Tooltip content="Keyboard shortcuts (?)">
        <Button variant="ghost" size="icon" aria-label="Keyboard shortcuts" onClick={onHelp}>
          <CircleHelp aria-hidden="true" />
        </Button>
      </Tooltip>
      <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
        <Link to="/learn">Learner view</Link>
      </Button>
      <Tooltip content="Use previous design">
        <Button
          variant="ghost"
          size="icon"
          // Icon only on smaller screens; the words show from 1280 px (UX review I3). Same name either way.
          className="xl:w-auto xl:gap-1.5 xl:px-3"
          aria-label="Use previous design"
          loading={busy}
          onClick={() => {
            setBusy(true);
            void chooseDesign(false, "/admin").catch(() => setBusy(false));
          }}
        >
          <Undo2 aria-hidden="true" />
          <span className="hidden xl:inline" aria-hidden="true">
            Use previous design
          </span>
        </Button>
      </Tooltip>
    </div>
  );
}
