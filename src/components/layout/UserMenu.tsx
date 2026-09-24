import { useState } from "react";
import { Compass, LogOut, Moon, Route, ShieldCheck, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/AuthProvider";
import { useUiStore } from "@/store/uiStore";

/**
 * Who you are signed in as, and the two things you can do about it.
 *
 * The theme switch used to be a standalone button in the top bar, which spent a permanent slot on
 * something most people set once. It lives here now, as a radio pair rather than a toggle, so the
 * menu says which theme is on instead of only which one is next.
 *
 * There is no profile *page* to link to — accounts are created and edited by a superadmin, and a
 * learner has nothing of their own to change but their password — so the identity block at the top
 * is the profile, and it says everything the account holds.
 */
export function UserMenu({ context = "learner" }: { context?: "learner" | "admin" }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const isSuperadmin = user.role === "superadmin";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
        aria-label={`Account: ${user.displayName}`}
      >
        <Avatar name={user.displayName} elevated={isSuperadmin} />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-60">
        <div className="flex items-start gap-2.5 px-2.5 py-2">
          <Avatar name={user.displayName} elevated={isSuperadmin} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.displayName}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{user.username}</p>
            {isSuperadmin && (
              <p className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-primary-strong">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Superadmin
              </p>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        {context === "admin" ? (
          <DropdownMenuItem onSelect={() => navigate("/")}>
            <Compass aria-hidden="true" />
            Learner view
          </DropdownMenuItem>
        ) : isSuperadmin ? (
          <DropdownMenuItem onSelect={() => navigate("/admin")}>
            <ShieldCheck aria-hidden="true" />
            Admin console
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => navigate("/plan")}>
            <Route aria-hidden="true" />
            Your plan
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            if (value !== theme) toggleTheme();
          }}
        >
          <DropdownMenuRadioItem value="light">
            <Sun aria-hidden="true" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon aria-hidden="true" />
            Dark
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem tone="danger" onSelect={() => void handleSignOut()}>
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
