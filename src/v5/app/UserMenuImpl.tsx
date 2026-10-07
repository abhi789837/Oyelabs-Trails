import * as Menu from "@radix-ui/react-dropdown-menu";
import { Check, CircleHelp, Compass, KeyRound, Keyboard, LogOut, Monitor, Moon, ShieldCheck, Sun, Undo2, UserRound, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import type { Settings } from "@shared/me";
import { isStaffRole } from "@shared/uiFlag";

import { api } from "@/api/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/v5/design/cn";
import { applyTheme, themeFromDocument } from "@/v5/learner/me/settings";

import { CHANGE_PASSWORD_PATH, HELP_PATH, roleLabel, useSignOut } from "./account";
import { chooseDesign } from "./designFlag";
import { AccountFace, accountButtonClass, type UserMenuProps } from "./UserMenu";

/**
 * The account menu's body (see `UserMenu`, which loads this lazily). Radix DropdownMenu: arrow
 * keys move, Enter or Space picks, Escape closes and puts focus back on the button, and typing a
 * letter jumps to the item that starts with it.
 */

type Theme = Settings["theme"];

const THEMES: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Match my device", icon: Monitor },
];

const itemClass =
  "relative flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-control px-2.5 text-small text-fg-1 outline-none data-[highlighted]:bg-sunken data-[disabled]:pointer-events-none data-[disabled]:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-2";

function Item({ icon: Icon, onSelect, tone, children, testId }: { icon: LucideIcon; onSelect: () => void; tone?: "danger"; children: ReactNode; testId?: string }) {
  return (
    <Menu.Item
      onSelect={onSelect}
      data-testid={testId}
      className={cn(itemClass, tone === "danger" && "text-danger-fg data-[highlighted]:bg-danger-soft [&_svg]:text-danger-fg")}
    >
      <Icon aria-hidden="true" />
      {children}
    </Menu.Item>
  );
}

function Separator() {
  return <Menu.Separator className="-mx-1 my-1 h-px bg-line-1" />;
}

export default function UserMenuImpl({ context, onShortcuts, takeOpen, takeFocus }: UserMenuProps & { takeOpen: () => boolean; takeFocus: () => boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => themeFromDocument());
  const [leaving, setLeaving] = useState(false);
  const themeRead = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);

  // The button was pressed or focused while this code loaded: carry that over.
  useEffect(() => {
    if (takeFocus()) trigger.current?.focus();
    if (takeOpen()) setOpen(true);
    // Once, on arrival.
  }, []);

  // The saved theme can be "Match my device", which the page alone can't tell: read it on first open.
  useEffect(() => {
    if (!open || themeRead.current) return;
    themeRead.current = true;
    api
      .get<{ settings: Settings }>("/api/v5/me/settings")
      .then((r) => setTheme(r.settings.theme))
      .catch(() => undefined);
  }, [open]);

  if (!user) return null;
  const staff = isStaffRole(user.role);
  const landing = context === "admin" ? "/admin" : "/";

  const changeTheme = (value: string) => {
    const next = value as Theme;
    setTheme(next);
    applyTheme(next);
    void api.put("/api/v5/me/settings", { theme: next }).catch(() => undefined);
  };

  return (
    <Menu.Root open={open} onOpenChange={setOpen} modal={false}>
      <Menu.Trigger ref={trigger} aria-label={`Account: ${user.displayName}`} data-testid="v5-account-button" className={accountButtonClass}>
        <AccountFace name={user.displayName} elevated={user.role === "superadmin"} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align="end"
          sideOffset={6}
          collisionPadding={8}
          data-testid="v5-account-menu"
          className="z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] w-64 overflow-y-auto rounded-card border border-line-1 bg-surface-3 p-1 text-fg-1 shadow-e3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95"
        >
          <div className="flex items-start gap-2.5 px-2.5 py-2">
            <AccountFace name={user.displayName} elevated={user.role === "superadmin"} />
            <div className="min-w-0">
              <p className="truncate text-small font-semibold text-fg-1">{user.displayName}</p>
              <p className="truncate text-caption text-fg-2">{user.username}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-caption font-medium text-brand-fg">
                {staff ? <ShieldCheck className="size-3" aria-hidden="true" /> : null}
                {roleLabel(user.role)}
              </p>
            </div>
          </div>
          <Separator />

          {context === "learner" ? (
            <Item icon={UserRound} onSelect={() => navigate("/learn/me")}>
              Me
            </Item>
          ) : null}
          {context === "admin" ? (
            <Item icon={Compass} onSelect={() => navigate("/learn")}>
              Learner view
            </Item>
          ) : staff ? (
            <Item icon={ShieldCheck} onSelect={() => navigate("/admin")}>
              Admin
            </Item>
          ) : null}
          <Item icon={KeyRound} onSelect={() => navigate(CHANGE_PASSWORD_PATH)}>
            Change password
          </Item>

          <Separator />
          <Menu.Label className="px-2.5 pb-1 pt-1.5 text-caption font-medium text-fg-2">Theme</Menu.Label>
          <Menu.RadioGroup value={theme} onValueChange={changeTheme}>
            {THEMES.map((t) => (
              <Menu.RadioItem
                key={t.value}
                value={t.value}
                // Picking a theme keeps the menu open, so the change can be seen and undone.
                onSelect={(e) => e.preventDefault()}
                className={cn(itemClass, "pr-8")}
              >
                <t.icon aria-hidden="true" />
                {t.label}
                <Menu.ItemIndicator className="absolute right-2.5 flex items-center">
                  <Check className="!text-brand-fg" aria-hidden="true" />
                </Menu.ItemIndicator>
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>

          <Separator />
          {onShortcuts ? (
            <Item icon={Keyboard} onSelect={onShortcuts}>
              Keyboard shortcuts
            </Item>
          ) : null}
          <Item icon={CircleHelp} onSelect={() => navigate(HELP_PATH)}>
            Help: how Oyelearn works
          </Item>
          <Menu.Item
            disabled={leaving}
            onSelect={(e) => {
              e.preventDefault();
              setLeaving(true);
              void chooseDesign(false, landing).catch(() => setLeaving(false));
            }}
            className={itemClass}
          >
            <Undo2 aria-hidden="true" />
            {leaving ? "Opening the previous design…" : "Use previous design"}
          </Menu.Item>

          <Separator />
          <Item icon={LogOut} tone="danger" testId="v5-sign-out" onSelect={() => void signOut()}>
            Sign out
          </Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
