import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { LoginRequest, MeResponse, SessionUser } from "@shared/auth";

import { api, ApiRequestError } from "@/api/client";

interface AuthState {
  user: SessionUser | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const me = await api.get<MeResponse>("/api/auth/me", signal);
      setUser(me.user);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setUser(null);
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
    setError(null);
    return result.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      // Clear locally even if the request failed: the intent was to sign out.
      setUser(null);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const result = await api.post<MeResponse>("/api/auth/change-password", { currentPassword, newPassword });
    if (!result.user) throw new Error("Password changed but no account came back.");
    setUser(result.user);
    return result.user;
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, error, signIn, signOut, changePassword, refresh: () => load() }),
    [user, loading, error, signIn, signOut, changePassword, load],
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
