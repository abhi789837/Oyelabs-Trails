import { lazy, Suspense, useEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/AuthProvider";

/**
 * The account menu at the top right of the v5 learner and admin shells: who you are, Sign out,
 * Change password, Me or the admin switch, theme, help and "Use previous design"
 * (docs/v5/PARITY.md).
 *
 * The button is drawn here, eagerly, with nothing heavier than this file. The menu itself
 * (`UserMenuImpl`, Radix DropdownMenu) is a separate chunk: it loads a moment after the page,
 * or at once when the button is hovered, focused or pressed, so the learner routes stay under
 * their 200 KB budget.
 */

export interface UserMenuProps {
  context: "learner" | "admin";
  /** The shell's keyboard shortcuts dialog, if it has one. */
  onShortcuts?: () => void;
}

const UserMenuImpl = lazy(() => import("./userMenuLoader").then((m) => m.loadUserMenuImpl()));

/** How long after the shell mounts the menu's code is fetched on its own. */
const IDLE_LOAD_MS = 2500;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export const accountButtonClass =
  "grid size-10 shrink-0 place-items-center rounded-full outline-none hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function AccountFace({ name, elevated }: { name: string; elevated: boolean }) {
  return (
    <span
      aria-hidden="true"
      // A plain string: "@/lib/utils" cn would read text-caption as a colour and drop it.
      className={`grid size-8 place-items-center rounded-full text-caption font-semibold ${elevated ? "bg-brand text-on-brand" : "bg-brand-soft text-brand-fg"}`}
    >
      {initials(name)}
    </span>
  );
}

export function UserMenu({ context, onShortcuts }: UserMenuProps) {
  const { user } = useAuth();
  const [wanted, setWanted] = useState(false);
  const openOnLoad = useRef(false);
  const focused = useRef(false);

  useEffect(() => {
    const id = window.setTimeout(() => setWanted(true), IDLE_LOAD_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (!user) return null;

  const label = `Account: ${user.displayName}`;
  const placeholder = (
    <button
      type="button"
      aria-label={label}
      aria-haspopup="menu"
      aria-expanded={false}
      data-testid="v5-account-button"
      className={accountButtonClass}
      onPointerEnter={() => setWanted(true)}
      onFocus={() => {
        focused.current = true;
        setWanted(true);
      }}
      onBlur={() => {
        focused.current = false;
      }}
      // Radix opens its menu on pointer down, so the menu may arrive between press and release:
      // the press already counts. Enter and Space arrive as a click.
      onPointerDown={() => {
        openOnLoad.current = true;
        setWanted(true);
      }}
      onClick={() => {
        openOnLoad.current = true;
        setWanted(true);
      }}
    >
      <AccountFace name={user.displayName} elevated={user.role === "superadmin"} />
    </button>
  );

  if (!wanted) return placeholder;
  return (
    <Suspense fallback={placeholder}>
      <UserMenuImpl
        context={context}
        onShortcuts={onShortcuts}
        // Read when the menu's code arrives: a press while it loaded opens it, and focus moves over.
        takeOpen={() => {
          const open = openOnLoad.current;
          openOnLoad.current = false;
          return open;
        }}
        takeFocus={() => focused.current}
      />
    </Suspense>
  );
}
