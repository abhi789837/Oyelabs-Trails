import type { IssuedAssessment } from "./api";

/**
 * What to tell the admin after Save & assign (v4.1): a background write says so, a bank-only one
 * carries the server's reason. Pure, so the copy is tested.
 */
export function describeIssued(issued: IssuedAssessment | null, name?: string): { message: string; notice: string | null } {
  if (!issued) return { message: name ? `${name} is set up.` : "Setup saved.", notice: null };
  if (issued.status === "generating") {
    return {
      message: name ? `${name} is set up. Writing their assessment — ready in about a minute.` : "Writing their assessment — ready in about a minute.",
      notice: issued.notice ?? null,
    };
  }
  return {
    message: name ? `${name} is set up and their assessment is ready.` : "Setup saved. Their assessment is ready.",
    notice: issued.notice ?? null,
  };
}
