import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { CommandPalette } from "./CommandPalette";
// Each brand component from its own file, not the `@/components/brand` barrel.
import { Logo } from "@/components/brand/Logo";
import { Mark } from "@/components/brand/Mark";
import { MobileNav } from "./MobileNav";
import { NotificationCentre } from "./NotificationCentre";
import { UserMenu } from "./UserMenu";
import { isStaff } from "@shared/enums";

/**
 * The shell's one piece of fixed chrome: brand on the left, and on the right the three things that
 * are not about the page you are on — find something, see what has happened, and the account.
 *
 * The theme toggle used to sit here as a fourth button. It lives in the user menu now (`UserMenu`
 * says why), which is what made room for the notification centre without the bar getting busier.
 */
export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/85 backdrop-blur-sm supports-backdrop-filter:bg-background/70">
      <div className="flex h-full items-center gap-2 px-3 sm:px-4">
        <MobileNav />
        <Link to="/" aria-label="Oyelearn home" className="flex items-center rounded-md py-1 pr-2">
          {/* The mark on a phone; the full logo from sm up (24 px tall = 102 px wide, over the 96 px minimum). */}
          <Mark size={28} decorative className="sm:hidden" />
          <span className="hidden sm:block">
            <Logo theme="auto" size={24} decorative clearSpace={false} />
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <CommandPalette />

          {/* A superadmin browsing the curriculum needs a way back to the console. */}
          {user && isStaff(user.role) && (
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/admin">
                <ShieldCheck aria-hidden="true" />
                Admin
              </Link>
            </Button>
          )}

          <NotificationCentre />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
