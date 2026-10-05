import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { LoginRequest, MeResponse, SessionDepartment, SessionUser } from "@shared/auth";

import { api, ApiRequestError } from "@/api/client";

interface AuthState {
  user: SessionUser | null;
  /** The signed-in person's department, for wording. Null for staff without one, or before v4. */
  department: SessionDepartment | null;
  /**
   * v5: which design the server says this person gets (`ui.v5` on /api/auth/me). Null when signed
   * out, or for a moment after sign-in on an older server. The staff `?ui=` override is applied
   * on top of this in `src/v5/app/designFlag.ts`, not here.
   */
  uiV5: boolean | null;
  /** True until the first /api/auth/me has settled, so guards do not redirect prematurely. */
  loading: boolean;
  /** Set when the session could not be loaded at all (server down), not when simply signed out. */
  error: string | null;
  signIn: (credentials: LoginRequest) => Promise<SessionUser>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<SessionUser>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [department, setDepartment] = useState<SessionDepartment | null>(null);
  const [uiV5, setUiV5] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const me = await api.get<MeResponse>("/api/auth/me", signal);
      setUser(me.user);
      setDepartment(me.department ?? null);
      setUiV5(me.ui?.v5 ?? null);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setUser(null);
      setDepartment(null);
      setUiV5(null);
      setError(err instanceof ApiRequestError ? err.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const signIn = useCallback(async (credentials: LoginRequest) => {
    const result = await api.post<MeResponse>("/api/auth/login", credentials);
    if (!result.user) throw new Error("Signed in but no account came back.");
    setUser(result.user);
    setUiV5(result.ui?.v5 ?? null);
    setError(null);
    // The login response carries no department; /me does. Not awaited: wording can follow a beat
    // behind, the redirect should not wait on it.
    if (result.department !== undefined) setDepartment(result.department ?? null);
    else
      void api
        .get<MeResponse>("/api/auth/me")
        .then((me) => {
          setDepartment(me.department ?? null);
          if (me.ui) setUiV5(me.ui.v5);
        })
        .catch(() => undefined);
    return result.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      // Clear locally even if the request failed: the intent was to sign out.
      setUser(null);
      setDepartment(null);
      setUiV5(null);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const result = await api.post<MeResponse>("/api/auth/change-password", { currentPassword, newPassword });
    if (!result.user) throw new Error("Password changed but no account came back.");
    setUser(result.user);
    if (result.ui) setUiV5(result.ui.v5);
    return result.user;
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, department, uiV5, loading, error, signIn, signOut, changePassword, refresh: () => load() }),
    [user, department, uiV5, loading, error, signIn, signOut, changePassword, load],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}

/** Convenience for the many places that only render for a signed-in person. */
export function useCurrentUser(): SessionUser {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser used outside an authenticated route");
  return user;
}

/** What a learner sees when no department came back: every account before v4 was an engineer. */
const DEFAULT_DEPARTMENT: SessionDepartment = {
  id: "engineering",
  name: "Engineering",
  assessmentFormat: "coding",
  practiceNoun: "Code",
};

/** The signed-in person's department, falling back to engineering so wording never goes blank. */
export function useDepartment(): SessionDepartment {
  return useAuth().department ?? DEFAULT_DEPARTMENT;
}
