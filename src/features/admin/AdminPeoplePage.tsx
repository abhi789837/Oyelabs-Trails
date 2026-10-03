import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Archive,
  ArchiveRestore,
  Download,
  KeyRound,
  LogOut,
  MoreHorizontal,
  RotateCw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserPlus,
  Wand2,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { BulkUserAction, UserSummary } from "@shared/admin";
import type { UserStatus } from "@shared/enums";
import { isStaff } from "@shared/enums";

import { api, ApiRequestError } from "@/api/client";
import { DataTable, useTableQueryState, peopleBuiltInViews, peopleFieldsFor, type BulkAction } from "@/components/data-table";
import { FormAlert } from "@/components/form/Field";
import { relativeTime } from "@/components/layout/notifications";
import { useConfirm } from "@/components/overlays";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { formatTimestamp } from "@/lib/utils";
import { adminApi } from "./api";
import { bulkDeletePhrase, summariseBulk } from "./bulkSummary";
import { useCatalog } from "./catalog/useCatalog";
import { TemporaryPasswordNotice } from "./TemporaryPasswordNotice";

/** What the Role column says for someone with no role title of their own. */
const ROLE_FALLBACK: Record<UserSummary["role"], string> = {
  superadmin: "Super admin",
  admin: "Admin",
  learner: "Learner",
};

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
  const { departmentOptions, departmentName } = useCatalog();
  const fields = useMemo(() => peopleFieldsFor(departmentOptions), [departmentOptions]);
  /** Staff carry no department, so a missing one is a dash rather than "All departments". */
  const deptLabel = useCallback((u: UserSummary) => (u.departmentId ? departmentName(u.departmentId) : null), [departmentName]);
  const { query, setQuery } = useTableQueryState();

  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [issued, setIssued] = useState<{ username: string; displayName: string; password: string } | null>(null);

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
        if (result.temporaryPassword) {
          setIssued({ username: user.username, displayName: user.displayName, password: result.temporaryPassword });
        }
        await load();
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Could not reset that password.");
      } finally {
        setBusyId(null);
      }
    },
    [confirm, load],
  );

  /**
   * Moving an account between the three states.
   *
   * Suspend confirms with the typed username, because from this table the rows look alike and
   * suspending the wrong person locks them out of a machine they are working on right now. Archiving
   * is fully reversible, so it acts at once and offers Undo instead of a dialog (v4.3 P6).
   *
   * Going back to `active` never confirms. Letting somebody in is not the dangerous direction.
   */
  const handleStatus = useCallback(
    async (user: UserSummary, next: UserStatus) => {
      if (next === "disabled") {
        const ok = await confirm({
          title: `Suspend ${user.displayName}?`,
          body: "They are signed out of every device immediately and cannot sign in again until you lift it. Their progress, plan and assessment history are kept.",
          confirmLabel: "Suspend account",
          variant: "destructive",
          confirmPhrase: user.username,
        });
        if (!ok) return;
      }
      setBusyId(user.id);
      const previous = user.status;
      try {
        await adminApi.setStatus(user.id, next);
        if (next === "active") {
          notify.success(`${user.displayName} can sign in again.`);
        } else {
          /* `notify.undo` rather than a hand-built action: both of these genuinely restore the
             previous state, which is the condition its doc comment sets for using it at all. */
          notify.undo(
            next === "disabled" ? `${user.displayName} is suspended and signed out.` : `${user.displayName} is archived.`,
            {
              onUndo: () => {
                void adminApi
                  .setStatus(user.id, previous)
                  .then(() => load())
                  .catch(() => setError("Could not put that back."));
              },
            },
          );
        }
        await load();
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Could not change that account.");
      } finally {
        setBusyId(null);
      }
    },
    [confirm, load],
  );

  /**
   * Deleting, for real.
   *
   * Two dialogs rather than one. The first offers the export, because the moment *after* a deletion
   * is exactly when somebody discovers they wanted it; the second is the deletion, and it names what
   * goes. The server checks the typed username again \u2014 a confirmation that lives only in the
   * client is a confirmation that only exists for people using the client.
   */
  const handleDelete = useCallback(
    async (user: UserSummary) => {
      const wantsExport = await confirm({
        title: `Download ${user.displayName}'s record first?`,
        body: "Their profile, assessment results, progress and certificates, as a JSON file. This is the last moment it exists.",
        confirmLabel: "Download, then continue",
        cancelLabel: "Skip",
      });
      if (wantsExport) {
        /* A plain navigation rather than fetch-and-blob: the response already carries its filename in
           `content-disposition`, and the browser's own download is what an admin expects to happen. */
        window.location.href = adminApi.exportUserUrl(user.id);
      }

      const ok = await confirm({
        title: `Delete ${user.displayName} permanently?`,
        body:
          "This cannot be undone. Their account, sessions, profile, assessments and proctoring records " +
          "including webcam snapshots, plans, weekly plans, progress, attempts and certificates are all " +
          "removed. Courses saved to the system library stay \u2014 they belong to the catalogue now.",
        confirmLabel: "Delete permanently",
        variant: "destructive",
        confirmPhrase: user.username,
      });
      if (!ok) return;

      setBusyId(user.id);
      try {
        const { counts } = await adminApi.deleteUser(user.id, user.username);
        notify.success(`${user.displayName} is deleted.`, {
          description:
            `${counts.assessments} assessment${counts.assessments === 1 ? "" : "s"}, ` +
            `${counts.snapshots} snapshot${counts.snapshots === 1 ? "" : "s"} and ` +
            `${counts.progress} progress record${counts.progress === 1 ? "" : "s"} removed` +
            (counts.keptGlobalCourses > 0
              ? `. ${counts.keptGlobalCourses} course${counts.keptGlobalCourses === 1 ? "" : "s"} kept in the library.`
              : "."),
        });
        await load();
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Could not delete that account.");
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
          isStaff(row.original.role) ? (
            <StatusBadge kind="role" status={row.original.role} />
          ) : (
            <span className="text-muted-foreground">{row.original.roleTitle ?? "Learner"}</span>
          ),
      },
      {
        id: "departmentId",
        header: "Department",
        meta: { exportValue: (u) => deptLabel(u) ?? "" },
        cell: ({ row }) => {
          const label = deptLabel(row.original);
          return label ? <Badge variant="outline">{label}</Badge> : <Dash />;
        },
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
        /* Off by default. It is real, but it is rarely the question — and with it on, the row's
           reset-password and disable buttons fall off the right edge at 1440. View Options turns
           it back on, and that choice sticks. */
        meta: { defaultHidden: true },
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
          <RowActions
            user={row.original}
            busy={busyId === row.original.id}
            canDelete={me?.role === "superadmin" && row.original.id !== me.id}
            onReset={handleReset}
            onStatus={handleStatus}
            onDelete={handleDelete}
          />
        ),
      },
    ],
    [busyId, handleReset, handleStatus, handleDelete, me, deptLabel],
  );

  /**
   * Runs one bulk action on the server and reports it as one toast: how many worked, and every
   * person skipped with the reason the server gave (yourself, the last super admin, not allowed).
   */
  const runBulk = useCallback(
    async (targets: UserSummary[], action: BulkUserAction["action"], verb: string, confirmPhrase?: string): Promise<string[]> => {
      try {
        const { results } = await adminApi.bulkUsers({
          ids: targets.map((u) => u.id),
          action,
          ...(confirmPhrase ? { confirm: confirmPhrase } : {}),
        });
        const summary = summariseBulk(results, new Map(targets.map((u) => [u.id, u.displayName])), verb);
        notify[summary.tone](summary.message, summary.description ? { description: summary.description } : undefined);
        return results.filter((r) => r.ok).map((r) => r.id);
      } catch (err) {
        notify.error(err instanceof ApiRequestError ? err.message : "That bulk action did not go through.");
        throw err;
      } finally {
        await load();
      }
    },
    [load],
  );

  /** Bulk actions. Status changes go through one server call with a result per person. */
  const bulkActions = useMemo(() => {
    const names = (rows: UserSummary[]) => rows.map((u) => u.displayName).join(", ");
    const nothing = (message: string): never => {
      notify.info(message);
      throw new Error("nothing to do");
    };
    const actions: BulkAction<UserSummary>[] = [
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
            body: "Each one is assembled from the question bank for their department. Anyone who already has a live assessment is skipped.",
            confirmLabel: "Issue",
          });
          if (!ok) throw new Error("cancelled");
          await runEach(learners, (u) => api.post(`/api/admin/users/${u.id}/assessments`, {}), "Issued", "assessment");
          await load();
        },
      },
      {
        id: "revoke",
        label: "Sign out everywhere",
        icon: <LogOut aria-hidden="true" />,
        run: async (rows: UserSummary[]): Promise<void> => {
          const targets = rows.filter((u) => u.id !== me.id);
          if (targets.length === 0) nothing("You cannot sign yourself out from here.");
          const ok = await confirm({
            title: `Sign ${targets.length} ${targets.length === 1 ? "person" : "people"} out everywhere?`,
            body: `${names(targets)} are signed out of every device. They can sign straight back in; nothing else changes.`,
            confirmLabel: "Sign out",
          });
          if (!ok) throw new Error("cancelled");
          await runBulk(targets, "revoke", "Signed out");
        },
      },
      {
        id: "disable",
        label: "Disable",
        tone: "destructive",
        icon: <ShieldOff aria-hidden="true" />,
        run: async (rows: UserSummary[]): Promise<void> => {
          const targets = rows.filter((u) => !isStaff(u.role) && u.status === "active");
          if (targets.length === 0) nothing("Nothing to disable in that selection.");
          // No typed phrase here: a bulk disable has no single username to type, so the count and
          // the names carry the weight instead.
          const ok = await confirm({
            title: `Disable ${targets.length} ${targets.length === 1 ? "account" : "accounts"}?`,
            body: `${names(targets)} are signed out of every device immediately and cannot sign in until you re-enable them. Progress, plans and assessment history are kept.`,
            confirmLabel: `Disable ${targets.length}`,
            variant: "destructive",
          });
          if (!ok) throw new Error("cancelled");
          await runBulk(targets, "disable", "Disabled");
        },
      },
      {
        id: "activate",
        label: "Re-enable",
        icon: <ShieldCheck aria-hidden="true" />,
        run: async (rows: UserSummary[]): Promise<void> => {
          const targets = rows.filter((u) => u.status === "disabled");
          if (targets.length === 0) nothing("Nobody in that selection is disabled.");
          await runBulk(targets, "activate", "Re-enabled");
        },
      },
      {
        id: "archive",
        label: "Remove from programme",
        icon: <Archive aria-hidden="true" />,
        run: async (rows: UserSummary[]): Promise<void> => {
          const targets = rows.filter((u) => !isStaff(u.role) && u.status !== "archived");
          if (targets.length === 0) nothing("Nothing to archive in that selection.");
          // Reversible: acts at once and offers Undo rather than a dialog.
          const done = await runBulk(targets, "archive", "Archived");
          if (done.length > 0) {
            notify.undo(`${done.length} archived.`, {
              onUndo: () => {
                void adminApi
                  .bulkUsers({ ids: done, action: "restore" })
                  .then(() => load())
                  .catch(() => setError("Could not put them back."));
              },
            });
          }
        },
      },
      {
        id: "restore",
        label: "Restore",
        icon: <ArchiveRestore aria-hidden="true" />,
        run: async (rows: UserSummary[]): Promise<void> => {
          const targets = rows.filter((u) => u.status === "archived");
          if (targets.length === 0) nothing("Nobody in that selection is archived.");
          await runBulk(targets, "restore", "Restored");
        },
      },
    ];

    if (me.role === "superadmin") {
      actions.push({
        id: "delete",
        label: "Delete permanently",
        tone: "destructive",
        icon: <Trash2 aria-hidden="true" />,
        run: async (rows: UserSummary[]): Promise<void> => {
          // Never yourself: the server refuses too, but the dialog should not count you in.
          const targets = rows.filter((u) => u.id !== me.id);
          if (targets.length === 0) nothing("You cannot delete your own account.");
          const phrase = bulkDeletePhrase(targets.length);
          const ok = await confirm({
            title: `Delete ${targets.length} ${targets.length === 1 ? "person" : "people"} permanently?`,
            // Spans, not divs: the confirm body renders inside a <p>.
            body: (
              <>
                <span className="block">
                  This cannot be undone. Accounts, assessments, proctoring records, plans, progress and certificates
                  are removed.{rows.length !== targets.length && " Your own account is left out."} Download
                  anyone&apos;s record first:
                </span>
                <span className="mt-2 block max-h-40 space-y-1 overflow-y-auto pr-1">
                  {targets.map((u) => (
                    <span key={u.id} className="flex items-center justify-between gap-3">
                      <span className="truncate text-foreground">{u.displayName}</span>
                      <a
                        href={adminApi.exportUserUrl(u.id)}
                        download
                        className="inline-flex shrink-0 items-center gap-1 rounded-sm text-xs font-medium text-foreground underline decoration-trailmark decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark"
                      >
                        <Download className="size-3" aria-hidden="true" />
                        Export data
                      </a>
                    </span>
                  ))}
                </span>
              </>
            ),
            confirmLabel: `Delete ${targets.length}`,
            variant: "destructive",
            confirmPhrase: phrase,
          });
          if (!ok) throw new Error("cancelled");
          await runBulk(targets, "delete", "Deleted", phrase);
        },
      });
    }
    return actions;
  }, [confirm, load, me, runBulk]);

  const handleRebuildAll = useCallback(async () => {
    let queued = 0;
    const ok = await confirm({
      title: "Rebuild every learner's path?",
      body: "Every active learner's path is rebuilt under the current priority rules, one queued job each. Progress and certificates are kept.",
      confirmLabel: "Rebuild all paths",
      onConfirm: async () => {
        queued = (await adminApi.rebuildAllPaths()).queued;
      },
    });
    if (ok) notify.success(`Queued ${queued} path${queued === 1 ? "" : "s"}.`);
  }, [confirm]);

  /**
   * Archived accounts appear only when the filters ask about status.
   *
   * "Removed from the programme" has to mean removed from the list somebody scans every morning, or
   * it means nothing. Rather than a hidden exception, the rule is one sentence: the moment a filter
   * mentions `status` this stops applying and you see exactly what you asked for — including from
   * the Archived view, whose whole filter is a status.
   */
  const asksAboutStatus = useMemo(
    () => query.filters.conditions.some((condition) => condition.field === "status"),
    [query.filters],
  );
  const rows = useMemo(
    () => (asksAboutStatus ? users : (users?.filter((user) => user.status !== "archived") ?? null)),
    [users, asksAboutStatus],
  );

  const archivedCount = useMemo(() => users?.filter((user) => user.status === "archived").length ?? 0, [users]);
  const count = rows?.length ?? 0;

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">People</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows ? `${count} account${count === 1 ? "" : "s"} on the trail` : "Loading…"}
            {archivedCount > 0 && !asksAboutStatus && (
              <>
                {" "}
                <span aria-hidden="true">·</span>{" "}
                <button
                  type="button"
                  onClick={() =>
                    setQuery(
                      (current) => ({
                        ...current,
                        filters: {
                          combinator: "and",
                          conditions: [{ field: "status", operator: "eq", value: "archived" }],
                        },
                      }),
                      { push: true },
                    )
                  }
                  className="rounded-sm underline decoration-dotted underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trailmark"
                >
                  {archivedCount} archived
                </button>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button asChild>
            <Link to="/admin/onboard">
              <UserPlus aria-hidden="true" />
              Onboard learner
            </Link>
          </Button>
          {me.role === "superadmin" && (
            <DropdownMenu open={toolsOpen} onOpenChange={setToolsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="More people actions">
                  <MoreHorizontal aria-hidden="true" />
                  <span className="sr-only">More people actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => void handleRebuildAll()}>
                  <RotateCw aria-hidden="true" />
                  Rebuild all paths
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {issued && (
        <TemporaryPasswordNotice
          className="mt-6"
          kind="reset"
          username={issued.username}
          displayName={issued.displayName}
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
          data={rows ?? []}
          columns={columns}
          fields={fields}
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
          renderDetail={(u) => <PersonDetail user={u} department={deptLabel(u)} />}
          detailTitle={(u) => u.displayName}
          detailSubtitle={(u) => <span className="font-mono text-xs">{u.username}</span>}
          detailFooter={(u) =>
            isStaff(u.role) ? null : (
              <Button asChild>
                <Link to={`/admin/people/${u.id}`}>Open full profile</Link>
              </Button>
            )
          }
          mobileCard={(u) => <PersonCard user={u} department={deptLabel(u)} />}
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
      <Avatar name={user.displayName} size="sm" elevated={isStaff(user.role)} />
      <div className="min-w-0">
        {isStaff(user.role) ? (
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

/**
 * The row menu.
 *
 * A menu rather than a row of icon buttons, because the lifecycle now has five entries and five
 * icons in a table cell is a puzzle. Reset stays a button: it is the one an admin reaches for
 * constantly, and burying the common action to make room for the rare ones is the wrong trade.
 *
 * Delete only appears for a super admin, and never on their own row. Hiding it is not the security
 * boundary \u2014 the route checks both \u2014 it is so the menu does not offer something that will
 * be refused.
 */
function RowActions({
  user,
  busy,
  canDelete,
  onReset,
  onStatus,
  onDelete,
}: {
  user: UserSummary;
  busy: boolean;
  canDelete: boolean;
  onReset: (user: UserSummary) => void | Promise<void>;
  onStatus: (user: UserSummary, next: UserStatus) => void | Promise<void>;
  onDelete: (user: UserSummary) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const staff = isStaff(user.role);

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

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={busy} title={`More actions for ${user.displayName}`}>
            <MoreHorizontal aria-hidden="true" />
            <span className="sr-only">More actions for {user.displayName}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {user.status !== "active" && (
            <DropdownMenuItem onSelect={() => void onStatus(user, "active")}>
              <ShieldCheck aria-hidden="true" />
              {user.status === "archived" ? "Restore to the programme" : "Lift the suspension"}
            </DropdownMenuItem>
          )}

          {!staff && user.status === "active" && (
            <DropdownMenuItem onSelect={() => void onStatus(user, "disabled")}>
              <ShieldOff aria-hidden="true" />
              Suspend
            </DropdownMenuItem>
          )}

          {!staff && user.status !== "archived" && (
            <DropdownMenuItem onSelect={() => void onStatus(user, "archived")}>
              <Archive aria-hidden="true" />
              Remove from programme
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onSelect={() => (window.location.href = adminApi.exportUserUrl(user.id))}>
            <Download aria-hidden="true" />
            Export their data
          </DropdownMenuItem>

          {canDelete && (
            <DropdownMenuItem tone="danger" onSelect={() => void onDelete(user)}>
              <Trash2 aria-hidden="true" />
              Delete permanently
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** The card a row becomes below 768px: the same facts, stacked, with nothing cut off. */
function PersonCard({ user, department }: { user: UserSummary; department: string | null }) {
  const pct = user.planTopicCount === 0 ? null : Math.round((user.planCompletedCount / user.planTopicCount) * 100);
  return (
    <div className="space-y-3">
      <PersonCell user={user} />
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusCell user={user} />
        {user.assessmentStatus && <StatusBadge kind="assessment" status={user.assessmentStatus} />}
        {isStaff(user.role) && <StatusBadge kind="role" status={user.role} />}
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
        <Fact label="Role">{user.roleTitle ?? ROLE_FALLBACK[user.role]}</Fact>
        <Fact label="Department">{department ?? "—"}</Fact>
        <Fact label="Level">{user.overallLevel ?? "—"}</Fact>
        <Fact label="Plan">{pct === null ? "—" : `${user.planCompletedCount}/${user.planTopicCount}`}</Fact>
        <Fact label="Last seen">{user.lastLoginAt === null ? "Never" : relativeTime(user.lastLoginAt)}</Fact>
      </dl>
    </div>
  );
}

/** What a row opens into: enough to decide, with the full profile one click further on. */
function PersonDetail({ user, department }: { user: UserSummary; department: string | null }) {
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
        {isStaff(user.role) && <StatusBadge kind="role" status={user.role} />}
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
        <Fact label="Role">{user.roleTitle ?? ROLE_FALLBACK[user.role]}</Fact>
        <Fact label="Department">{department ?? "—"}</Fact>
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
