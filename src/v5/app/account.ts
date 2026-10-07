import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import type { Role } from "@shared/enums";

import { useAuth } from "@/features/auth/AuthProvider";

/**
 * Account actions shared by the v5 user menu, the admin Menu sheet, the admin palette and Me
 * (docs/v5/PARITY.md). Kept tiny: the learner shell imports it eagerly.
 */

/** The existing change-password screen (App.tsx), shared by both designs. */
export const CHANGE_PASSWORD_PATH = "/change-password";

/** Replays the first-run welcome, which explains how Oyelearn works. The "Help" item. */
export const HELP_PATH = "/learn?welcome=1";

export function roleLabel(role: Role | string | undefined): string {
  if (role === "superadmin") return "Superadmin";
  if (role === "admin") return "Admin";
  return "Learner";
}

/** Signs out, then lands on the sign-in page with its "You're signed out" note. */
export function useSignOut(): () => Promise<void> {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return useCallback(async () => {
    const toSignIn = () => navigate("/login", { replace: true, state: { signedOut: true } });
    try {
      await signOut();
    } finally {
      toSignIn();
      // The sign-in guard (RequireAuth) also sends a signed-out page to /login, a render later and
      // with its own state. Say "You're signed out" again after it has done so.
      window.setTimeout(() => {
        if (window.location.pathname === "/login") toSignIn();
      }, 150);
    }
  }, [signOut, navigate]);
}

export { PRACTICE_LINKS, type PracticeLink } from "./practiceLinks";
