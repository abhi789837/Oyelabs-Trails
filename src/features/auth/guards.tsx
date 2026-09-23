import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./AuthProvider";
import { landingPathFor } from "./routing";

function Pending() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
      <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Gate for every signed-in route. Three redirects, in order:
 * no session → /login (remembering where they were headed); temporary password → /change-password;
 * otherwise render.
 */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Pending />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;

  return <>{children ?? <Outlet />}</>;
}

/** Admin console gate. A learner who lands here goes to their own plan rather than a dead end. */
export function RequireSuperadmin({ children }: { children?: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Pending />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (user.role !== "superadmin") return <Navigate to={landingPathFor(user)} replace />;

  return <>{children ?? <Outlet />}</>;
}
