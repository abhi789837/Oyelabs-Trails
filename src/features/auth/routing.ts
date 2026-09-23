import type { SessionUser } from "@shared/auth";

/**
 * Where a signed-in person belongs right now (brief §6).
 *
 * The learner flow is a funnel: change the temporary password, then take the placement
 * assessment, then live on the plan.
 *
 * Learners land on the dashboard for now. Once `/assessment` and `/plan` exist, this becomes
 * "assessment if there is no completed one, otherwise /plan" — the one place that decision is
 * made, so the change is local to this function.
 */
export function landingPathFor(user: SessionUser): string {
  if (user.mustChangePassword) return "/change-password";
  if (user.role === "superadmin") return "/admin";
  return "/";
}

/** Routes a person with a temporary password may still reach. */
export const PASSWORD_CHANGE_ALLOWED = new Set(["/change-password", "/login"]);
