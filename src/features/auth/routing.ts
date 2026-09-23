import type { SessionUser } from "@shared/auth";

/**
 * Where a signed-in person belongs right now (brief §6).
 *
 * The learner flow is a funnel: change the temporary password, then take the placement
 * assessment, then live on the plan.
 *
 * Learners land on `/plan`, which is also where the funnel is resolved: it sends them to the
 * assessment when one is waiting, and shows the plan once there is one. Keeping that decision in
 * one page rather than here means it can read state this function does not have.
 */
export function landingPathFor(user: SessionUser): string {
  if (user.mustChangePassword) return "/change-password";
  if (user.role === "superadmin") return "/admin";
  return "/plan";
}

/** Routes a person with a temporary password may still reach. */
export const PASSWORD_CHANGE_ALLOWED = new Set(["/change-password", "/login"]);
