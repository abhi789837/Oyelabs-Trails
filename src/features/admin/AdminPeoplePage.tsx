import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, ShieldCheck, ShieldOff, UserPlus, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";

import type { UserSummary } from "@shared/admin";

import { api, ApiRequestError } from "@/api/client";
import { DataTable, useTableQueryState, peopleBuiltInViews, peopleFields } from "@/components/data-table";
import { FormAlert } from "@/components/form/Field";
import { relativeTime } from "@/components/layout/notifications";
import { useConfirm } from "@/components/overlays";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { formatTimestamp } from "@/lib/utils";
import { adminApi } from "./api";
import { TemporaryPasswordNotice } from "./TemporaryPasswordNotice";

/**
 * The People table (brief §13), on the DataTable kit.
 *
 * `mode="client"`: the whole list arrives in one response, and client mode is the only one that can
 * count facets — "3 awaiting approval" next to the filter option is worth more here than it costs,
 * because this is the screen an admin scans rather than pages through. If the roster ever outgrows
 * that, `usersTableSpec` is already waiting in `server/src/lib/tableSpecs.ts` and the change is a
 * prop plus a paged route, not a rewrite.
 *
 * Four of the filterable fields — assessment status, overall level, the warning count and plan
 * progress — are assembled per row when the response is built rather than being columns anywhere,
 * which is exactly why they live in the client catalogue and not the server whitelist.
 */
export default function AdminPeoplePage() {
  useDocumentTitle("People");
  const confirm = useConfirm();
  const me = useCurrentUser();
  const { query, setQuery } = useTableQueryState();

  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ username: string; password: string } | null>(null);

  /* A bulk action reloads when it finishes, by which time the component may be gone.
     `alive` is re-armed on every run, not just initialised once: React's StrictMode mounts, cleans
     up and mounts again on the same instance, so a flag only set in the cleanup stays false for
     the whole life of the second mount and every load returns early into a permanently empty
     table. */
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await adminApi.listUsers(signal);
      if (!alive.current) return;
      setUsers(result.users);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!alive.current) return;
      setError(err instanceof ApiRequestError ? err.message : "Could not load people.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const handleReset = useCallback(
    async (user: UserSummary) => {
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
    },
    [confirm, load],
  );

  const handleStatus = useCallback(
    async (user: UserSummary) => {
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
    },
    [confirm, load],
  );

  const columns = useMemo<ColumnDef<UserSummary, unknown>[]>(
    () => [
      {
        id: "displayName",
        header: "Person",
        size: 200,
        cell: ({ row }) => <PersonCell user={row.original} />,
      },
      {
        id: "roleTitle",
        header: "Role",
        cell: ({ row }) =>
          row.original.role === "superadmin" ? (
            <StatusBadge kind="role" status="superadmin" />
          ) : (
            <span className="text-muted-foreground">{row.original.roleTitle ?? "Learner"}</span>
          ),
      },
      { id: "status", header: "Status", cell: ({ row }) => <StatusCell user={row.original} /> },
      {
        id: "assessmentStatus",
        header: "Assessment",
        cell: ({ row }) =>
          row.original.assessmentStatus ? (
            <StatusBadge kind="assessment" status={row.original.assessmentStatus} />
          ) : (
            <Dash />
          ),
      },
      {
        id: "overallLevel",
        header: "Level",
        meta: { align: "right" },
        cell: ({ row }) =>
          row.original.overallLevel === null ? <Dash /> : <span className="tabular">{row.original.overallLevel}</span>,
      },
      {
        id: "planProgress",
        header: "Plan",
        meta: {
          field: "planProgress",
          exportValue: (u) => (u.planTopicCount === 0 ? "" : `${u.planCompletedCount}/${u.planTopicCount}`),
        },
        cell: ({ row }) => <PlanCell user={row.original} />,
      },
      {
        id: "hardWarnings",
        header: "Warnings",
        meta: { align: "right" },
        cell: ({ row }) =>
          row.original.hardWarnings > 0 ? (
            <span className="tabular font-medium text-destructive">{row.original.hardWarnings}</span>
          ) : (
            <span className="tabular text-muted-foreground">0</span>
          ),
      },
      {
        id: "lastLoginAt",
        header: "Last seen",
        cell: ({ row }) =>
          row.original.lastLoginAt === null ? (
            <span className="text-muted-foreground">Never</span>
          ) : (
            <span className="whitespace-nowrap text-muted-foreground" title={formatTimestamp(row.original.lastLoginAt)}>
              {relativeTime(row.original.lastLoginAt)}
            </span>
          ),
      },
      {
        id: "createdAt",
        header: "Onboarded",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">{formatTimestamp(row.original.createdAt)}</span>
        ),
      },
      {
        id: "__actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        meta: { align: "right" },
        cell: ({ row }) => (
          <RowActions user={row.original} busy={busyId === row.original.id} onReset={handleReset} onStatus={handleStatus} />
        ),
      },
    ],
    [busyId, handleReset, handleStatus],
  );

  /* Bulk actions run one request per row rather than one batched call, because no batched endpoint
     exists and inventing one client-side would mean losing the per-person reason a row failed. The
     count is reported honestly: "4 of 6" with the reason for the rest, never a bare success. */
  const bulkActions = useMemo(
    () => [
      {
        id: "issue-assessment",
        label: "Issue assessment",
        icon: <Wand2 aria-hidden="true" />,
        run: async (rows: UserSummary[]): Promise<void> => {
          const learners = rows.filter((u) => u.role === "learner");
          if (learners.length === 0) {
            notify.error("Only learners take placement assessments.");
            throw new Error("no learners selected");
          }
          const ok = await confirm({
            title: `Issue an assessment to ${learners.length} ${learners.length === 1 ? "person" : "people"}?`,
            body: "Each one is generated by the AI provider, which takes a few minutes per person, and then waits for your approval before it reaches the learner. Anyone who already has a live assessment is skipped.",
            confirmLabel: "Issue",
          });
          if (!ok) throw new Error("cancelled");
          await runEach(learners, (u) => api.post(`/api/admin/users/${u.id}/assessments`, {}), "Issued", "assessment");
          await load();
        },
      },
      {
        id: "disable",
        label: "Disable",
        tone: "destructive" as const,
        icon: <ShieldOff aria-hidden="true" />,
        run: async (rows: UserSummary[]): Promise<void> => {
          const targets = rows.filter((u) => u.role !== "superadmin" && u.status === "active");
          if (targets.length === 0) {
            notify.info("Nothing to disable in that selection.");
            throw new Error("nothing to do");
          }
          // No typed phrase here: a bulk disable has no single username to type, so the count and
          // the names carry the weight instead.
          const ok = await confirm({
            title: `Disable ${targets.length} ${targets.length === 1 ? "account" : "accounts"}?`,
            body: `${targets.map((u) => u.displayName).join(", ")} are signed out of every device immediately and cannot sign in until you re-enable them. Progress, plans and assessment history are kept.`,
            confirmLabel: `Disable ${targets.length}`,
            variant: "destructive",
          });
          if (!ok) throw new Error("cancelled");
          await runEach(targets, (u) => adminApi.setStatus(u.id, "disabled"), "Disabled", "account");
          await load();
        },
      },
      {
        id: "enable",
        label: "Re-enable",
        icon: <ShieldCheck aria-hidden="true" />,
        run: async (rows: UserSummary[]): Promise<void> => {
          const targets = rows.filter((u) => u.status === "disabled");
          if (targets.length === 0) {
            notify.info("Nothing to re-enable in that selection.");
            throw new Error("nothing to do");
          }
          await runEach(targets, (u) => adminApi.setStatus(u.id, "active"), "Re-enabled", "account");
          await load();
        },
      },
    ],
    [confirm, load],
  );

  const count = users?.length ?? 0;

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">People</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users ? `${count} account${count === 1 ? "" : "s"} on the trail` : "Loading…"}
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

      {error && (
        <div className="mt-6">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      <div className="mt-6">
        <DataTable
          data={users ?? []}
          columns={columns}
          fields={peopleFields}
          getRowId={(u) => u.id}
          query={query}
          onQueryChange={setQuery}
          mode="client"
          defaultSort={[{ field: "createdAt", dir: "desc" }]}
          tableKey="admin.people"
          accountId={me.id}
          builtInViews={peopleBuiltInViews}
          loading={users === null}
          onRetry={() => void load()}
          noun="person"
          exportName="people"
          searchPlaceholder="Search name, username or role"
          caption="Everyone with an account, with their assessment and plan progress."
          emptyState={{
            title: "Nobody on the trail yet",
            body: "Onboard your first learner and the platform will generate their placement assessment straight away.",
            action: (
              <Button asChild>
                <Link to="/admin/onboard">
                  <UserPlus aria-hidden="true" />
                  Onboard learner
                </Link>
              </Button>
            ),
          }}
          bulkActions={bulkActions}
          renderDetail={(u) => <PersonDetail user={u} />}
          detailTitle={(u) => u.displayName}
          detailSubtitle={(u) => <span className="font-mono text-xs">{u.username}</span>}
          detailFooter={(u) =>
            u.role === "superadmin" ? null : (
              <Button asChild>
                <Link to={`/admin/people/${u.id}`}>Open full profile</Link>
              </Button>
            )
          }
          mobileCard={(u) => <PersonCard user={u} />}
        />
      </div>
    </div>
  );
}

/**
 * Runs a per-row request and reports the outcome as one sentence.
 *
 * Failures are counted and the first reason is quoted, because with a selection of six the useful
 * information is "two were skipped because they already have a live assessment", not six toasts.
 */
async function runEach<T>(rows: T[], run: (row: T) => Promise<unknown>, verb: string, noun: string) {
  let done = 0;
  let firstFailure: string | null = null;
  for (const row of rows) {
    try {
      await run(row);
      done += 1;
    } catch (err) {
      firstFailure ??= err instanceof ApiRequestError ? err.message : `Could not change one ${noun}.`;
    }
  }
  const failed = rows.length - done;
  if (failed === 0) {
    notify.success(`${verb} ${done} ${done === 1 ? noun : `${noun}s`}.`);
  } else if (done === 0) {
    notify.error(firstFailure ?? `Could not change any ${noun}.`);
  } else {
    notify.info(`${verb} ${done} of ${rows.length}. ${firstFailure ?? ""}`.trim());
  }
}

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

/**
 * The person cell, with the name as a direct link to the full profile.
 *
 * The row itself opens the detail sheet, which is the right default — most of the time the question
 * is "who is this?" and a sheet answers it without losing the filtered list. But going straight to
 * the profile was a single click before the table was rebuilt, and taking that away to gain a
 * preview would be a trade, not an improvement. So both: the name navigates, the rest of the row
 * previews. A superadmin has no profile page, so their name is not a link.
 */
function PersonCell({ user }: { user: UserSummary }) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar name={user.displayName} size="sm" elevated={user.role === "superadmin"} />
      <div className="min-w-0">
        {user.role === "superadmin" ? (
          <span className="block truncate font-medium">{user.displayName}</span>
        ) : (
          <Link
            to={`/admin/people/${user.id}`}
            onClick={(event) => event.stopPropagation()}
            className="block truncate font-medium underline decoration-trailmark decoration-2 underline-offset-4"
          >
            {user.displayName}
          </Link>
        )}
        <span className="block truncate font-mono text-xs text-muted-foreground">{user.username}</span>
      </div>
    </div>
  );
}

/** The plan as a bar plus the two numbers, so a glance and a read both work. */
function PlanCell({ user }: { user: UserSummary }) {
  if (user.planTopicCount === 0) return <Dash />;
  const pct = Math.round((user.planCompletedCount / user.planTopicCount) * 100);
  const done = pct === 100;
  return (
    <div className="w-28">
      <Progress
        value={pct}
        className="h-1"
        indicatorClassName={done ? "bg-summit" : "bg-trailmark"}
        aria-label={`${user.displayName}'s plan`}
      />
      <span className="mt-1 block tabular text-xs text-muted-foreground">
        {user.planCompletedCount}/{user.planTopicCount}
      </span>
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

function RowActions({
  user,
  busy,
  onReset,
  onStatus,
}: {
  user: UserSummary;
  busy: boolean;
  onReset: (user: UserSummary) => void | Promise<void>;
  onStatus: (user: UserSummary) => void | Promise<void>;
}) {
  return (
    // Stops a click on an action from also opening the row's detail panel.
    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon-sm"
        loading={busy}
        onClick={() => void onReset(user)}
        title={`Reset ${user.displayName}'s password`}
      >
        <KeyRound aria-hidden="true" />
        <span className="sr-only">Reset {user.displayName}'s password</span>
      </Button>
      {user.role !== "superadmin" && (
        <Button
          variant="ghost"
          size="icon-sm"
          loading={busy}
          onClick={() => void onStatus(user)}
          title={user.status === "active" ? `Disable ${user.displayName}` : `Re-enable ${user.displayName}`}
        >
          {user.status === "active" ? <ShieldOff aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
          <span className="sr-only">
            {user.status === "active" ? "Disable" : "Re-enable"} {user.displayName}
          </span>
        </Button>
      )}
    </div>
  );
}

/** The card a row becomes below 768px: the same facts, stacked, with nothing cut off. */
function PersonCard({ user }: { user: UserSummary }) {
  const pct = user.planTopicCount === 0 ? null : Math.round((user.planCompletedCount / user.planTopicCount) * 100);
  return (
    <div className="space-y-3">
      <PersonCell user={user} />
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusCell user={user} />
        {user.assessmentStatus && <StatusBadge kind="assessment" status={user.assessmentStatus} />}
        {user.role === "superadmin" && <StatusBadge kind="role" status="superadmin" />}
        {user.hardWarnings > 0 && (
          <Badge variant="danger">
            {user.hardWarnings} hard warning{user.hardWarnings === 1 ? "" : "s"}
          </Badge>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {/* A superadmin has no role title, and defaulting to "Learner" told the card's reader the
            opposite of the truth. The desktop column shows a badge instead of a title here for the
            same reason. */}
        <Fact label="Role">{user.roleTitle ?? (user.role === "superadmin" ? "Super admin" : "Learner")}</Fact>
        <Fact label="Level">{user.overallLevel ?? "—"}</Fact>
        <Fact label="Plan">{pct === null ? "—" : `${user.planCompletedCount}/${user.planTopicCount}`}</Fact>
        <Fact label="Last seen">{user.lastLoginAt === null ? "Never" : relativeTime(user.lastLoginAt)}</Fact>
      </dl>
    </div>
  );
}

/** What a row opens into: enough to decide, with the full profile one click further on. */
function PersonDetail({ user }: { user: UserSummary }) {
  const pct = user.planTopicCount === 0 ? null : Math.round((user.planCompletedCount / user.planTopicCount) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusCell user={user} />
        {user.assessmentStatus ? (
          <StatusBadge kind="assessment" status={user.assessmentStatus} />
        ) : (
          <Badge variant="outline">No assessment issued</Badge>
        )}
        {user.role === "superadmin" && <StatusBadge kind="role" status="superadmin" />}
      </div>

      {user.planTopicCount > 0 && (
        <div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Learning plan</span>
            <span className="tabular text-muted-foreground">
              {user.planCompletedCount} of {user.planTopicCount} topics
            </span>
          </div>
          <Progress
            value={pct ?? 0}
            className="mt-2"
            indicatorClassName={pct === 100 ? "bg-summit" : "bg-trailmark"}
            aria-label="Plan progress"
          />
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Fact label="Role">{user.roleTitle ?? (user.role === "superadmin" ? "Super admin" : "Learner")}</Fact>
        <Fact label="Experience">{user.yearsExperience === null ? "—" : `${user.yearsExperience} yrs`}</Fact>
        <Fact label="Overall level">{user.overallLevel === null ? "Not evaluated" : `${user.overallLevel} of 5`}</Fact>
        <Fact label="Hard warnings">
          {user.hardWarnings > 0 ? <span className="font-medium text-destructive">{user.hardWarnings}</span> : "None"}
        </Fact>
        <Fact label="Onboarded">{formatTimestamp(user.createdAt)}</Fact>
        <Fact label="Last seen">{user.lastLoginAt === null ? "Never signed in" : formatTimestamp(user.lastLoginAt)}</Fact>
      </dl>

      {user.mustChangePassword && (
        <p className="rounded-md border border-trailmark/40 bg-trailmark/5 px-3 py-2 text-sm text-muted-foreground">
          Their temporary password has not been used yet, so they have not signed in since being onboarded.
        </p>
      )}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
