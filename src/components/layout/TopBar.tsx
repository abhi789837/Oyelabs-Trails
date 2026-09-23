import { LogOut, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { SearchDialog } from "./SearchDialog";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-full items-center gap-2 px-3 sm:px-4">
        <MobileNav />
        <Link to="/" aria-label="Oyelearn home" className="flex items-center rounded-md py-1 pr-2">
          <Logo variant="mark" height={28} decorative className="sm:hidden" />
          <Logo variant="horizontal" height={26} decorative className="hidden sm:block" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <SearchDialog />
          {/* A superadmin browsing the curriculum needs a way back to the console. */}
          {user?.role === "superadmin" && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">
                <ShieldCheck aria-hidden="true" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </Button>
          )}
          <ThemeToggle />
          {user && (
            <Button variant="ghost" size="icon" onClick={() => void handleSignOut()} title={`Sign out ${user.username}`}>
              <LogOut aria-hidden="true" />
              <span className="sr-only">Sign out {user.username}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
