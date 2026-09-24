import { useEffect, useMemo, useState } from "react";
import { KeyRound, LoaderCircle, Search, ShieldOff, ShieldCheck, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

import type { UserSummary } from "@shared/admin";

import { ApiRequestError } from "@/api/client";
import { FormAlert } from "@/components/form/Field";
import { useConfirm } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
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
  const confirm = useConfirm();

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
    const ok = await confirm({
      title: `Reset ${user.displayName}'s password?`,
      body: "Their current password stops working the moment you confirm, and a temporary one is shown to you once — you have to pass it on yourself. They choose a new password at their next sign-in.",
      confirmLabel: "Reset password",
      variant: "destructive",
    });
    if (!ok) return;
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
    if (next === "disabled") {
      // Typed confirmation: from this table the rows look alike, and disabling the wrong person
      // signs them out of a machine they are working on right now.
      const ok = await confirm({
        title: `Disable ${user.displayName}?`,
        body: "They are signed out of every device immediately and cannot sign in again until you re-enable the account. Their progress, plan and assessment history are kept.",
        confirmLabel: "Disable account",
        variant: "destructive",
        confirmPhrase: user.username,
      });
      if (!ok) return;
    }
    setBusyId(user.id);
    try {
      await adminApi.setStatus(user.id, next);
      notify.success(
        next === "disabled" ? `${user.displayName} is disabled and signed out.` : `${user.displayName} can sign in again.`,
      );
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

      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery("")}
        leading={<Search />}
        placeholder="Search name, username or role"
        aria-label="Search people"
        containerClassName="mt-6 max-w-xs"
      />

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
                      <StatusBadge kind="role" status="superadmin" />
                    ) : (
                      <span className="text-muted-foreground">{user.roleTitle ?? "Learner"}</span>
                    )}
                  </Td>
                  <Td>
                    <StatusCell user={user} />
                  </Td>
                  <Td>
                    {user.assessmentStatus ? (
                      <StatusBadge kind="assessment" status={user.assessmentStatus} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Td>
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

/* "Awaiting first sign-in" is not a `UserStatus` — it is `active` plus an unused temporary
   password — so it borrows the in-progress tone rather than inventing one. */
function StatusCell({ user }: { user: UserSummary }) {
  if (user.status === "disabled") return <StatusBadge kind="user" status="disabled" />;
  if (user.mustChangePassword) return <Badge variant="progress">Awaiting first sign-in</Badge>;
  return <StatusBadge kind="user" status="active" />;
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
