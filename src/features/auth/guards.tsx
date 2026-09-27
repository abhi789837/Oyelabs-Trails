import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import type { Role } from "@shared/enums";

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

/**
 * Admin console gate. A learner who lands here goes to their own plan rather than a dead end.
 *
 * `roles` is what the route requires. Most of the console is both staff roles; the AI connection is
 * the superadmin's alone, because that credential is shared by every learner on the deployment.
 * This only decides what is *rendered* — the server guards the same routes independently, and a
 * hidden page is not a protected one.
 */
export function RequireRole({ roles, children }: { roles: readonly Role[]; children?: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Pending />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  // An admin who reaches a superadmin-only page goes to the console, not to a learner's plan.
  if (!roles.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin" : landingPathFor(user)} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}

/** Anything in the admin console that is about learners: both staff roles. */
export function RequireStaff({ children }: { children?: ReactNode }) {
  return <RequireRole roles={STAFF_ROLES}>{children}</RequireRole>;
}

/** The two things an admin must not touch: the shared AI credential, and staff accounts. */
export function RequireSuperadmin({ children }: { children?: ReactNode }) {
  return <RequireRole roles={SUPERADMIN_ONLY}>{children}</RequireRole>;
}

const STAFF_ROLES = ["superadmin", "admin"] as const satisfies readonly Role[];
const SUPERADMIN_ONLY = ["superadmin"] as const satisfies readonly Role[];
