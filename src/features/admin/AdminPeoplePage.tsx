import { useEffect, useMemo, useState } from "react";
import { KeyRound, LoaderCircle, Search, ShieldOff, ShieldCheck, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

import type { UserSummary } from "@shared/admin";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDate } from "@/lib/utils";
import { adminApi } from "./api";
import { TemporaryPasswordNotice } from "./TemporaryPasswordNotice";

/**
 * The People table (brief §13). Columns that depend on later phases — assessment status, overall
 * level, plan progress — render honestly as "—" until those phases fill them, rather than being
 * hidden and appearing later.
 */
export default function AdminPeoplePage() {
  useDocumentTitle("People");

  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ username: string; password: string } | null>(null);

  const load = async (signal?: AbortSignal) => {
    try {
      const result = await adminApi.listUsers(signal);
      setUsers(result.users);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof ApiRequestError ? err.message : "Could not load people.");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    if (!users) return null;
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        (u.roleTitle ?? "").toLowerCase().includes(q),
    );
  }, [users, query]);

  const handleReset = async (user: UserSummary) => {
    if (!window.confirm(`Reset ${user.displayName}'s password? Their current password stops working immediately.`)) return;
    setBusyId(user.id);
    try {
      const result = await adminApi.resetPassword(user.id);
      if (result.temporaryPassword) setIssued({ username: user.username, password: result.temporaryPassword });
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not reset that password.");
    } finally {
      setBusyId(null);
    }
  };

  const handleStatus = async (user: UserSummary) => {
    const next = user.status === "active" ? "disabled" : "active";
    if (next === "disabled" && !window.confirm(`Disable ${user.displayName}? They will be signed out everywhere.`)) return;
    setBusyId(user.id);
    try {
      await adminApi.setStatus(user.id, next);
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not change that account.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">People</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users ? `${users.length} account${users.length === 1 ? "" : "s"}` : "Loading…"}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/onboard">
            <UserPlus aria-hidden="true" />
            Onboard learner
          </Link>
        </Button>
      </div>

      {issued && (
        <TemporaryPasswordNotice
          className="mt-6"
          username={issued.username}
          password={issued.password}
          onDismiss={() => setIssued(null)}
        />
      )}

      {error && <div className="mt-6"><FormAlert>{error}</FormAlert></div>}

      <div className="relative mt-6 max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, username or role"
          aria-label="Search people"
          className="pl-9"
        />
      </div>

      {!filtered ? (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading people…
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          {query ? "Nobody matches that search." : "No accounts yet. Onboard your first learner."}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-md border">
          <table className="w-full min-w-4xl border-collapse text-sm">
            <thead>
              <tr className="border-b bg-surface-sunken/50 text-left">
                <Th>Person</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Assessment</Th>
                <Th className="text-right">Plan</Th>
                <Th className="text-right">Warnings</Th>
                <Th>Last active</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-surface-sunken/30">
                  <Td>
                    {user.role === "superadmin" ? (
                      <span className="font-medium">{user.displayName}</span>
                    ) : (
                      <Link
                        to={`/admin/people/${user.id}`}
                        className="font-medium underline decoration-trailmark decoration-2 underline-offset-4"
                      >
                        {user.displayName}
                      </Link>
                    )}
                    <span className="mt-0.5 block font-mono text-xs text-muted-foreground">{user.username}</span>
                  </Td>
                  <Td>
                    {user.role === "superadmin" ? (
                      <Badge variant="outline">Super admin</Badge>
                    ) : (
                      <span className="text-muted-foreground">{user.roleTitle ?? "Learner"}</span>
                    )}
                  </Td>
                  <Td>
                    <StatusCell user={user} />
                  </Td>
                  <Td className="text-muted-foreground">{user.assessmentStatus?.replace("_", " ") ?? "—"}</Td>
                  <Td className="text-right tabular">
                    {user.planTopicCount === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      `${user.planCompletedCount}/${user.planTopicCount}`
                    )}
                  </Td>
                  <Td className="text-right tabular">
                    {user.hardWarnings > 0 ? (
                      <span className="font-medium text-destructive">{user.hardWarnings}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-muted-foreground">
                    {user.lastLoginAt ? formatDate(new Date(user.lastLoginAt).toISOString()) : "Never"}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busyId === user.id}
                        onClick={() => void handleReset(user)}
                        title="Reset password"
                      >
                        <KeyRound aria-hidden="true" />
                        <span className="sr-only">Reset {user.displayName}'s password</span>
                      </Button>
                      {user.role !== "superadmin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === user.id}
                          onClick={() => void handleStatus(user)}
                          title={user.status === "active" ? "Disable account" : "Re-enable account"}
                        >
                          {user.status === "active" ? <ShieldOff aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
                          <span className="sr-only">
                            {user.status === "active" ? "Disable" : "Re-enable"} {user.displayName}
                          </span>
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusCell({ user }: { user: UserSummary }) {
  if (user.status === "disabled") return <Badge variant="outline">Disabled</Badge>;
  if (user.mustChangePassword) return <span className="text-trailmark-strong">Awaiting first sign-in</span>;
  return <span className="text-summit-strong">Active</span>;
}

// Sentence case, not the usual ALL-CAPS table header: the design system rules that out.
function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th scope="col" className={`px-3 py-2 text-xs font-semibold text-muted-foreground ${className ?? ""}`}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-top ${className ?? ""}`}>{children}</td>;
}
