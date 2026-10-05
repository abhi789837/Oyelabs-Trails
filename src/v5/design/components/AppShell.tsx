import { Search } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { cn } from "../cn";

import { Kbd } from "./Primitives";
import { Logo } from "./Showcase";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  active?: boolean;
  /** A small count ("3 due"). Announced with the label. */
  badge?: string | number;
}

/** Router-agnostic link: pass react-router's `Link` adapter from V5App, or leave the plain anchor. */
export type LinkLike = ComponentType<{ href: string; className?: string; children: ReactNode; "aria-current"?: "page" | undefined; "aria-label"?: string }>;

const Anchor: LinkLike = ({ href, children, ...rest }) => (
  <a href={href} {...rest}>
    {children}
  </a>
);

export interface AppShellProps {
  /** Sidebar on desktop; the first five are the mobile bottom nav. */
  nav: NavItem[];
  /** Extra sidebar groups below the main nav (admin sections). */
  sidebarExtra?: ReactNode;
  /** Right side of the top bar: notifications, the user menu. */
  topRight?: ReactNode;
  onSearch?: () => void;
  link?: LinkLike;
  homeHref?: string;
  children: ReactNode;
  /** In the /design preview: no landmarks or skip link, so the page keeps one of each. */
  preview?: boolean;
  className?: string;
}

/**
 * The v5 frame: top bar, sidebar (≥ 768 px), bottom nav (< 768 px), and the main landmark.
 *
 * Breakpoints are **container** queries on the shell itself, so the shell behaves the same in the
 * /design preview box as in the full window. The skip link targets `#v5-main`.
 */
export function AppShell({ nav, sidebarExtra, topRight, onSearch, link: L = Anchor, homeHref = "/learn", children, preview = false, className }: AppShellProps) {
  const mobileNav = nav.slice(0, 5);
  const Header = preview ? "div" : "header";
  const Main = preview ? "div" : "main";
  const Nav = preview ? "div" : "nav";
  const navLabel = preview ? undefined : "Main";
  return (
    <div className={cn("@container/shell relative flex min-h-dvh flex-col bg-surface-0 text-fg-1", className)}>
      {preview ? null : (
      <a
        href="#v5-main"
        className="sr-only z-50 rounded-control bg-brand px-3 py-2 text-on-brand focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      )}
      <Header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line-1 bg-surface-1/90 px-4 backdrop-blur">
        <L href={homeHref} className="flex h-7 items-center rounded-control" aria-label="Oyelearn home">
          <Logo className="h-7" />
        </L>
        <div className="flex-1" />
        {onSearch ? (
          <button
            type="button"
            onClick={onSearch}
            className="flex h-9 items-center gap-2 rounded-control border border-line-1 bg-surface-0 px-3 text-small text-fg-2 hover:border-line-2 @3xl/shell:w-64"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden @3xl/shell:inline">Search</span>
            <span className="sr-only @3xl/shell:hidden">Search</span>
            <span className="ml-auto hidden gap-0.5 @3xl/shell:flex" aria-hidden="true">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
        ) : null}
        {topRight}
      </Header>

      <div className="flex min-h-0 flex-1">
        <Nav aria-label={navLabel} className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-line-1 bg-surface-1 p-3 @3xl/shell:flex">
          <ul className="flex flex-col gap-0.5">
            {nav.map((item) => (
              <li key={item.href}>
                <L
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "flex h-(--v5-control-h) items-center gap-3 rounded-control px-3 text-small font-medium transition-colors duration-120",
                    item.active ? "bg-brand-soft text-brand-fg" : "text-fg-2 hover:bg-sunken hover:text-fg-1",
                  )}
                >
                  <item.icon className="size-[18px]" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined ? <span className="rounded-full bg-brand px-1.5 text-caption font-semibold text-on-brand">{item.badge}</span> : null}
                </L>
              </li>
            ))}
          </ul>
          {sidebarExtra}
        </Nav>

        <Main id={preview ? undefined : "v5-main"} tabIndex={preview ? undefined : -1} className="min-w-0 flex-1 pb-20 outline-none @3xl/shell:pb-0">
          {children}
        </Main>
      </div>

      <Nav aria-label={navLabel} className="fixed inset-x-0 bottom-0 z-30 border-t border-line-1 bg-surface-1/95 pb-[env(safe-area-inset-bottom)] backdrop-blur @3xl/shell:hidden">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${mobileNav.length}, minmax(0, 1fr))` }}>
          {mobileNav.map((item) => (
            <li key={item.href}>
              <L
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn("flex h-16 flex-col items-center justify-center gap-1 text-caption font-medium", item.active ? "text-brand-fg" : "text-fg-2")}
              >
                <span className={cn("relative grid h-7 w-12 place-items-center rounded-full transition-colors duration-200", item.active && "bg-brand-soft")}>
                  <item.icon className="size-5" aria-hidden="true" />
                  {item.badge !== undefined ? <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-brand px-1 text-[0.625rem] font-semibold leading-4 text-on-brand">{item.badge}</span> : null}
                </span>
                {item.label}
              </L>
            </li>
          ))}
        </ul>
      </Nav>
    </div>
  );
}
