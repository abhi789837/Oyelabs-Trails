import type { ColumnDef } from "@tanstack/react-table";
import { Archive, BellRing, PauseCircle, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { agoLabel } from "@shared/adminInbox";

import { useTableQueryState, type BulkAction } from "@/components/data-table";
import { adminApi } from "@/features/admin/api";
import { useCatalog } from "@/features/admin/catalog/useCatalog";
import { useAuth } from "@/features/auth/AuthProvider";
import { Avatar, Badge, Button, ErrorState, ProgressBar, v5Toast } from "@/v5/design";
import { V5DataTable } from "@/v5/design/components/DataTable";

import { v5AdminApi } from "../api";
import { Page, PageHeader, plainMessage, useLoad } from "../parts/common";
import { PersonSheet } from "./PersonSheet";
import { personFields, personViews, toRows, type PersonRow } from "./views";

function StatusCell({ row }: { row: PersonRow }) {
  if (row.status === "archived") return <Badge tone="neutral">Archived</Badge>;
  if (row.status === "disabled") return <Badge tone="neutral">Suspended</Badge>;
  if (row.role !== "learner") return <Badge tone="outline">Staff</Badge>;
  if (row.stuck) return <Badge tone="warning">Stuck {row.idleDays ?? ""} days</Badge>;
  if (row.testPending) return <Badge tone="info">Test pending</Badge>;
  if (row.assessmentStatus === "in_progress") return <Badge tone="info">Taking the test</Badge>;
  if (row.planTopicCount > 0 && row.planCompletedCount >= row.planTopicCount) return <Badge tone="success">Plan done</Badge>;
  if (row.planTopicCount > 0) return <Badge tone="success">Learning</Badge>;
  return <Badge tone="outline">Getting set up</Badge>;
}

/** `/admin/people`: everyone, filterable, with a side sheet per person (`?person=id`). */
export default function PeoplePage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const { query, setQuery } = useTableQueryState();
  const { departmentOptions, departmentName } = useCatalog();
  const users = useLoad((signal) => adminApi.listUsers(signal));
  const signals = useLoad((signal) => v5AdminApi.people(signal));

  const rows = useMemo(() => (users.data ? toRows(users.data.users, signals.data?.people ?? {}) : null), [users.data, signals.data]);
  const fields = useMemo(() => personFields(departmentOptions), [departmentOptions]);
  const views = useMemo(() => personViews(departmentOptions), [departmentOptions]);

  // `?view=stuck` (from the inbox and the overview) applies a saved view once.
  const viewParam = params.get("view");
  useEffect(() => {
    if (!viewParam) return;
    const view = views.find((v) => v.id === viewParam);
    if (view) setQuery(view.build(Date.now()));
    setParams(
      (cur) => {
        const next = new URLSearchParams(cur);
        next.delete("view");
        return next;
      },
      { replace: true },
    );
  }, [viewParam, views, setQuery, setParams]);

  const personId = params.get("person");
  const person = (personId && rows?.find((r) => r.id === personId)) || null;
  const openPerson = useCallback(
    (id: string | null) =>
      setParams((cur) => {
        const next = new URLSearchParams(cur);
        if (id) next.set("person", id);
        else next.delete("person");
        return next;
      }),
    [setParams],
  );

  const reloadUsers = users.reload;
  const reloadSignals = signals.reload;
  const reload = useCallback(() => {
    reloadUsers();
    reloadSignals();
  }, [reloadUsers, reloadSignals]);

  const columns = useMemo<ColumnDef<PersonRow, unknown>[]>(
    () => [
      {
        id: "displayName",
        header: "Person",
        size: 220,
        cell: ({ row }) => (
          <span className="flex items-center gap-2.5">
            <Avatar name={row.original.displayName} size="sm" decorative />
            <span className="min-w-0">
              <span className="block truncate font-medium text-fg-1">{row.original.displayName}</span>
              <span className="block truncate text-caption text-fg-2">{row.original.roleTitle ?? row.original.username}</span>
            </span>
          </span>
        ),
      },
      { id: "departmentId", header: "Department", meta: { exportValue: (r) => (r.departmentId ? departmentName(r.departmentId) : "") }, cell: ({ row }) => (row.original.departmentId ? departmentName(row.original.departmentId) : <span className="text-fg-2">—</span>) },
      { id: "status", header: "Status", meta: { exportValue: (r) => (r.stuck ? "Stuck" : r.testPending ? "Test pending" : r.status) }, cell: ({ row }) => <StatusCell row={row.original} /> },
      {
        id: "planProgress",
        header: "Plan",
        meta: { exportValue: (r) => `${r.planDone}%` },
        cell: ({ row }) =>
          row.original.planTopicCount > 0 ? (
            <span className="flex min-w-28 items-center gap-2">
              <ProgressBar value={row.original.planDone} size="sm" label={`${row.original.displayName}: ${row.original.planDone}% of plan done`} />
              <span className="text-caption tabular-nums text-fg-2">{row.original.planDone}%</span>
            </span>
          ) : (
            <span className="text-fg-2">—</span>
          ),
      },
      {
        id: "lastActivityAt",
        header: "Last learned",
        meta: { exportValue: (r) => (r.lastActivityAt ? new Date(r.lastActivityAt).toISOString() : "") },
        cell: ({ row }) => <span className="text-fg-2">{row.original.lastActivityAt ? agoLabel(row.original.lastActivityAt, Date.now()) : "Not yet"}</span>,
      },
    ],
    [departmentName],
  );

  const bulkActions = useMemo<BulkAction<PersonRow>[]>(
    () => [
      {
        id: "nudge",
        label: "Send a reminder",
        icon: <BellRing aria-hidden="true" />,
        run: async (selected) => {
          const learners = selected.filter((r) => r.role === "learner" && r.status === "active");
          if (!learners.length) {
            v5Toast.info("Reminders go to active learners only.");
            return;
          }
          const { sent } = await v5AdminApi.nudge(learners.map((r) => r.id));
          v5Toast.success(`Reminder sent to ${sent} ${sent === 1 ? "person" : "people"}.`);
        },
      },
      {
        id: "suspend",
        label: "Suspend",
        icon: <PauseCircle aria-hidden="true" />,
        run: async (selected) => {
          const ids = selected.map((r) => r.id);
          await adminApi.bulkUsers({ ids, action: "disable" });
          reload();
          v5Toast.undo(`Suspended ${ids.length}. They can't sign in.`, () => void adminApi.bulkUsers({ ids, action: "activate" }).then(reload));
        },
      },
      {
        id: "archive",
        label: "Archive",
        icon: <Archive aria-hidden="true" />,
        run: async (selected) => {
          const ids = selected.map((r) => r.id);
          await adminApi.bulkUsers({ ids, action: "archive" });
          reload();
          v5Toast.undo(`Archived ${ids.length}. Their records are kept.`, () => void adminApi.bulkUsers({ ids, action: "restore" }).then(reload));
        },
      },
    ],
    [reload],
  );

  return (
    <Page wide>
      <PageHeader
        title="People"
        description="Everyone with an account. Click a row to see where they are without leaving the list."
        actions={
          <Button variant="primary" size="sm" asChild>
            <Link to="/admin/onboard">
              <UserPlus aria-hidden="true" />
              Onboard someone
            </Link>
          </Button>
        }
      />
      {users.error && !users.data ? (
        <ErrorState body={plainMessage(users.error)} onRetry={reload} />
      ) : (
        <V5DataTable<PersonRow>
          data={rows ?? []}
          columns={columns}
          fields={fields}
          getRowId={(r) => r.id}
          query={query}
          onQueryChange={setQuery}
          mode="client"
          defaultSort={[{ field: "createdAt", dir: "desc" }]}
          tableKey="v5.admin.people"
          accountId={user?.id ?? null}
          builtInViews={views}
          loading={rows === null}
          onRetry={reload}
          noun="person"
          exportName="people"
          searchPlaceholder="Search name, username or role"
          caption="Everyone with an account, their status and how far they are."
          emptyState={{
            title: "Nobody here yet",
            body: "Onboard your first person. We'll write their test straight away.",
            action: (
              <Button variant="primary" asChild>
                <Link to="/admin/onboard">Onboard someone</Link>
              </Button>
            ),
          }}
          bulkActions={bulkActions}
          onRowOpen={(r) => openPerson(r.id)}
          mobileCard={(r) => (
            <span className="flex items-center gap-3">
              <Avatar name={r.displayName} size="sm" decorative />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.displayName}</span>
                <span className="block text-caption text-fg-2">{r.lastActivityAt ? `Learned ${agoLabel(r.lastActivityAt, Date.now())}` : "Not started"}</span>
              </span>
              <StatusCell row={r} />
            </span>
          )}
          maxHeight="calc(100dvh - 16rem)"
        />
      )}
      <PersonSheet person={person} onClose={() => openPerson(null)} onChanged={reload} />
    </Page>
  );
}
