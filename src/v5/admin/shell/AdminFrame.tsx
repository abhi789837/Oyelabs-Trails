import { History, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { useEffect, useId, useState, type ComponentType, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

// Direct imports, not the `@/v5/design` barrel: the barrel loads every design module (Phase 9 performance).
// Each brand component from its own file, not the `@/components/brand` barrel.
import { Logo } from "@/components/brand/Logo";
import { Mark } from "@/components/brand/Mark";
import { ThemeToggle } from "@/v5/app/ThemeToggle";
import { cn } from "@/v5/design/cn";
import { useMediaQuery } from "@/v5/design/hooks";
import { Sheet } from "@/v5/design/components/Overlays";
import { Kbd } from "@/v5/design/components/Primitives";
import { SkipLink } from "@/v5/design/components/SkipLink";
import { Tooltip } from "@/v5/design/components/Tooltip";

import { navMode, readNavPref, writeNavPref, type NavPref } from "./navPref";

/**
 * The admin frame (Phase 8). The design system's `AppShell` has one sidebar width (240 px from
 * 768 px up), which leaves a 528 px page on a tablet. Until it grows a rail option (requested in
 * DECISIONS, Phase 8 — admin), the admin draws its own frame with the same landmarks, skip link and
 * look:
 *
 * - below 768 px: top bar, a bottom bar (the first four pages and "Menu"), and a Menu sheet that
 *   lists every page, so nothing is reachable only through search;
 * - 768–1279 px: an icon rail (64 px) with each page's name as its link text and a tooltip;
 * - 1280 px and up: the full sidebar.
 *
 * "Collapse menu" / "Expand menu" overrides the automatic choice and is remembered on this device.
 */

export interface FrameLink {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  active: boolean;
  badge?: number;
}

export interface AdminFrameProps {
  main: FrameLink[];
  more: FrameLink[];
  older: { href: string; label: string; active: boolean }[];
  topRight?: ReactNode;
  onSearch: () => void;
  children: ReactNode;
}

/** How many main pages sit in the phone's bottom bar; the rest are under Menu. */
export const PHONE_BAR = 4;

export function AdminFrame({ main, more, older, topRight, onSearch, children }: AdminFrameProps) {
  const wide = useMediaQuery("(min-width: 1280px)");
  const [pref, setPref] = useState<NavPref>(readNavPref);
  const expanded = navMode(pref, wide) === "full";
  const [olderOpen, setOlderOpen] = useState(() => older.some((p) => p.active));
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navId = useId();

  // Following a link closes the phone menu.
  useEffect(() => setMenuOpen(false), [pathname]);

  const toggle = () => {
    const next: NavPref = expanded ? "rail" : "full";
    setPref(next);
    writeNavPref(next);
  };

  const openOlder = () => {
    if (!expanded) {
      setPref("full");
      writeNavPref("full");
    }
    setOlderOpen(true);
  };

  const inBar = main.slice(0, PHONE_BAR);
  const menuActive = !inBar.some((p) => p.active);

  return (
    <div className="relative flex min-h-dvh flex-col bg-surface-0 text-fg-1">
      <SkipLink target="v5-main" />
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line-1 bg-surface-1/90 px-4 backdrop-blur">
        {/* With the full sidebar, the full logo (24 px tall = 102 px wide, over the 96 px minimum); with the
            icon rail or on a phone, the mark. A small "Admin" label says which console this is. */}
        <Link to="/admin" className="flex items-center gap-2 rounded-control" aria-label="Oyelearn admin, Inbox" data-testid="admin-home">
          {expanded ? (
            <>
              <Mark size={26} decorative className="md:hidden" />
              <span className="hidden md:block">
                <Logo theme="auto" size={24} decorative clearSpace={false} />
              </span>
            </>
          ) : (
            <Mark size={26} decorative />
          )}
          <span className="rounded-sm bg-brand-soft px-1.5 py-0.5 text-caption font-medium leading-none text-brand-fg">Admin</span>
        </Link>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onSearch}
          className="flex h-9 items-center gap-2 rounded-control border border-line-1 bg-surface-0 px-3 text-small text-fg-2 hover:border-line-2 lg:w-64"
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="hidden lg:inline">Search</span>
          <span className="sr-only lg:hidden">Search</span>
          <span className="ml-auto hidden gap-0.5 lg:flex" aria-hidden="true">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        {topRight}
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          id={navId}
          aria-label="Main"
          data-nav-mode={expanded ? "full" : "rail"}
          className={cn(
            "sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 flex-col gap-1 overflow-y-auto overflow-x-hidden border-r border-line-1 bg-surface-1 py-3 transition-[width] duration-200 motion-reduce:transition-none md:flex",
            expanded ? "w-60 px-3" : "w-16 items-center px-2",
          )}
        >
          <ul className={cn("flex flex-col gap-0.5", !expanded && "items-center")}>
            {main.map((item) => (
              <li key={item.href}>
                <NavLink item={item} rail={!expanded} />
              </li>
            ))}
          </ul>

          <div className={cn("mt-4 flex flex-col gap-0.5 border-t border-line-1 pt-3", !expanded && "w-full items-center")}>
            {expanded ? <p className="px-3 pb-1 text-caption font-medium text-fg-2">More</p> : <span className="sr-only">More</span>}
            <ul className={cn("flex flex-col gap-0.5", !expanded && "items-center")}>
              {more.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} rail={!expanded} small />
                </li>
              ))}
            </ul>
            {expanded ? (
              <>
                <button
                  type="button"
                  aria-expanded={olderOpen}
                  onClick={() => setOlderOpen((o) => !o)}
                  className="mt-3 flex min-h-8 items-center justify-between rounded-control px-3 text-left text-caption font-medium text-fg-2 hover:bg-sunken"
                >
                  Older pages
                  <span aria-hidden="true">{olderOpen ? "−" : "+"}</span>
                </button>
                {olderOpen ? (
                  <ul className="flex flex-col gap-0.5">
                    {older.map((p) => (
                      <li key={p.href}>
                        <TextLink href={p.href} active={p.active}>
                          {p.label}
                        </TextLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <Tooltip content="Older pages" side="right">
                <button type="button" onClick={openOlder} aria-label="Older pages" className={cn(railItem, older.some((p) => p.active) ? railActive : railIdle)}>
                  <History className="size-[18px]" aria-hidden="true" />
                </button>
              </Tooltip>
            )}
          </div>

          <div className={cn("mt-auto flex flex-col gap-1 pt-3", !expanded && "items-center")}>
            <ThemeToggle compact={!expanded} />
            <Tooltip content={expanded ? "Collapse menu" : "Expand menu"} side="right">
              <button
                type="button"
                onClick={toggle}
                aria-label={expanded ? "Collapse menu" : "Expand menu"}
                aria-expanded={expanded}
                aria-controls={navId}
                className={cn(railItem, railIdle, expanded && "w-auto px-3")}
              >
                {expanded ? <PanelLeftClose className="size-[18px]" aria-hidden="true" /> : <PanelLeftOpen className="size-[18px]" aria-hidden="true" />}
                {expanded ? <span className="ml-2 text-small">Collapse</span> : null}
              </button>
            </Tooltip>
          </div>
        </nav>

        <main id="v5-main" tabIndex={-1} className="min-w-0 flex-1 pb-20 outline-none md:pb-0">
          {children}
        </main>
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line-1 bg-surface-1/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {inBar.map((item) => (
            <li key={item.href}>
              <Link to={item.href} aria-current={item.active ? "page" : undefined} className={cn(barItem, item.active ? "text-brand-fg" : "text-fg-2")}>
                <BarIcon active={item.active} badge={item.badge}>
                  <item.icon className="size-5" aria-hidden="true" />
                </BarIcon>
                {item.label}
                {item.badge ? <span className="sr-only">, {item.badge} waiting</span> : null}
              </Link>
            </li>
          ))}
          <li>
            <button type="button" onClick={() => setMenuOpen(true)} aria-haspopup="dialog" className={cn(barItem, "w-full", menuActive ? "text-brand-fg" : "text-fg-2")}>
              <BarIcon active={menuActive}>
                <Menu className="size-5" aria-hidden="true" />
              </BarIcon>
              Menu
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title="All pages" description="Everything in the admin console.">
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-0.5">
            {main.slice(PHONE_BAR).map((item) => (
              <li key={item.href}>
                <TextLink href={item.href} active={item.active} icon={item.icon}>
                  {item.label}
                </TextLink>
              </li>
            ))}
          </ul>
          <section aria-labelledby={`${navId}-more`}>
            <h3 id={`${navId}-more`} className="px-3 pb-1 text-caption font-medium text-fg-2">
              More
            </h3>
            <ul className="flex flex-col gap-0.5">
              {more.map((item) => (
                <li key={item.href}>
                  <TextLink href={item.href} active={item.active} icon={item.icon}>
                    {item.label}
                  </TextLink>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby={`${navId}-older`}>
            <h3 id={`${navId}-older`} className="px-3 pb-1 text-caption font-medium text-fg-2">
              Older pages (best on a bigger screen)
            </h3>
            <ul className="flex flex-col gap-0.5">
              {older.map((p) => (
                <li key={p.href}>
                  <TextLink href={p.href} active={p.active}>
                    {p.label}
                  </TextLink>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Sheet>
    </div>
  );
}

const railItem = "flex size-10 items-center justify-center rounded-control transition-colors duration-120";
const railActive = "bg-brand-soft text-brand-fg";
const railIdle = "text-fg-2 hover:bg-sunken hover:text-fg-1";
const barItem = "flex h-16 flex-col items-center justify-center gap-1 text-caption font-medium";

function BarIcon({ active, badge, children }: { active: boolean; badge?: number; children: ReactNode }) {
  return (
    <span className={cn("relative grid h-7 w-12 place-items-center rounded-full transition-colors duration-200", active && "bg-brand-soft")}>
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-brand px-1 text-[0.625rem] font-semibold leading-4 text-on-brand" aria-hidden="true">
          {badge}
        </span>
      ) : null}
    </span>
  );
}

function NavLink({ item, rail, small = false }: { item: FrameLink; rail: boolean; small?: boolean }) {
  if (rail) {
    return (
      <Tooltip content={item.badge ? `${item.label} (${item.badge})` : item.label} side="right">
        <Link to={item.href} aria-current={item.active ? "page" : undefined} className={cn(railItem, "relative", item.active ? railActive : railIdle)}>
          <item.icon className="size-[18px]" aria-hidden="true" />
          <span className="sr-only">
            {item.label}
            {item.badge ? `, ${item.badge} waiting` : ""}
          </span>
          {item.badge ? (
            <span className="absolute right-0 top-0 min-w-4 rounded-full bg-brand px-1 text-[0.625rem] font-semibold leading-4 text-on-brand" aria-hidden="true">
              {item.badge}
            </span>
          ) : null}
        </Link>
      </Tooltip>
    );
  }
  return (
    <Link
      to={item.href}
      aria-current={item.active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-control px-3 text-small transition-colors duration-120",
        small ? "min-h-8" : "h-(--v5-control-h) font-medium",
        item.active ? railActive : railIdle,
      )}
    >
      <item.icon className={small ? "size-4" : "size-[18px]"} aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined ? <span className="rounded-full bg-brand px-1.5 text-caption font-semibold text-on-brand">{item.badge}</span> : null}
    </Link>
  );
}

function TextLink({ href, active, icon: Icon, children }: { href: string; active: boolean; icon?: FrameLink["icon"]; children: ReactNode }) {
  return (
    <Link
      to={href}
      aria-current={active ? "page" : undefined}
      className={cn("flex min-h-10 items-center gap-3 rounded-control px-3 text-small transition-colors duration-120 md:min-h-8", active ? railActive : railIdle)}
    >
      {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
      {children}
    </Link>
  );
}
