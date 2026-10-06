import type { ColumnDef } from "@tanstack/react-table";
import { Archive, BellRing, PauseCircle, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { agoLabel, UNDO_MS } from "@shared/adminInbox";
import type { UserStatus } from "@shared/enums";

import { useTableQueryState, type BulkAction } from "@/components/data-table";
import { adminApi } from "@/features/admin/api";
import { useCatalog } from "@/features/admin/catalog/useCatalog";
import { useAuth } from "@/features/auth/AuthProvider";
import { Avatar, Badge, Button, ErrorState, ProgressBar, cn, v5Toast } from "@/v5/design";
import { V5DataTable } from "@/v5/design/components/DataTable";

import { v5AdminApi } from "../api";
import { Page, PageHeader, plainMessage, useLoad } from "../parts/common";
import { createDeferredQueue } from "../parts/deferred";
import { runUndoable } from "../parts/undoable";
import { PersonSheet } from "./PersonSheet";
import { personFields, personViews, refusedIds, toRows, withStatusOverrides, type PersonRow } from "./views";

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

  // Suspend / archive show at once and are sent when the Undo window closes (parts/undoable.ts).
  const [overrides, setOverrides] = useState<Record<string, UserStatus>>({});
  const queue = useRef(createDeferredQueue(UNDO_MS));
  useEffect(() => {
    const q = queue.current;
    const flush = () => void q.flush();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  const rows = useMemo(
    () => (users.data ? withStatusOverrides(toRows(users.data.users, signals.data?.people ?? {}), overrides) : null),
    [users.data, signals.data, overrides],
  );
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

  const setUsers = users.setData;
  /** Show `status` for `ids` now; `null` takes the override away again. */
  const override = useCallback((ids: readonly string[], status: UserStatus | null) => {
    setOverrides((cur) => {
      const next = { ...cur };
      for (const id of ids) {
        if (status) next[id] = status;
        else delete next[id];
      }
      return next;
    });
  }, []);
  /** The server agreed: write the status into the loaded list and drop the override. */
  const settle = useCallback(
    (ids: readonly string[], status: UserStatus) => {
      setUsers((cur) => (cur ? { ...cur, users: cur.users.map((u) => (ids.includes(u.id) ? { ...u, status } : u)) } : cur));
      override(ids, null);
    },
    [setUsers, override],
  );

  const bulkActions = useMemo<BulkAction<PersonRow>[]>(() => {
    let seq = 0;
    const statusAction = (opts: { id: string; label: string; icon: ReactNode; to: UserStatus; send: "disable" | "archive"; back: "activate" | "restore"; done: (n: number) => string; fail: string }): BulkAction<PersonRow> => ({
      id: opts.id,
      label: opts.label,
      icon: opts.icon,
      run: (selected) => {
        const ids = selected.filter((r) => r.status !== opts.to).map((r) => r.id);
        if (!ids.length) {
          v5Toast.info("They already are.");
          return;
        }
        const before = new Map(selected.map((r) => [r.id, r.status]));
        runUndoable({
          queue: queue.current,
          id: `${opts.id}-${(seq += 1)}`,
          message: opts.done(ids.length),
          apply: () => override(ids, opts.to),
          rollback: () => override(ids, null),
          send: async () => {
            const { results } = await adminApi.bulkUsers({ ids, action: opts.send });
            const refused = refusedIds(results);
            settle(
              ids.filter((id) => !refused.includes(id)),
              opts.to,
            );
            override(refused, null);
            if (refused.length) v5Toast.error(`${refused.length} of ${ids.length} didn't change`, results.find((r) => !r.ok)?.error ?? "We weren't allowed to change them.");
          },
          reverse: async () => {
            await adminApi.bulkUsers({ ids, action: opts.back });
            // Put each one back the way it was (suspended people stay suspended after an archive is undone).
            for (const id of ids) settle([id], before.get(id) ?? "active");
          },
          failTitle: opts.fail,
          toasts: v5Toast,
          describe: plainMessage,
        });
      },
    });
    return [
      {
        id: "nudge",
        label: "Send a reminder",
        icon: <BellRing aria-hidden="true" />,
        run: (selected) => {
          const learners = selected.filter((r) => r.role === "learner" && r.status === "active");
          if (!learners.length) {
            v5Toast.info("Reminders go to active learners only.");
            return;
          }
          const n = learners.length;
          runUndoable({
            queue: queue.current,
            id: `nudge-${(seq += 1)}`,
            message: `Reminder going to ${n} ${n === 1 ? "person" : "people"}.`,
            apply: () => undefined,
            rollback: () => undefined,
            send: () => v5AdminApi.nudge(learners.map((r) => r.id)),
            failTitle: "We couldn't send the reminder",
            toasts: v5Toast,
            describe: plainMessage,
          });
        },
      },
      statusAction({
        id: "suspend",
        label: "Suspend",
        icon: <PauseCircle aria-hidden="true" />,
        to: "disabled",
        send: "disable",
        back: "activate",
        done: (n) => `Suspended ${n}. They can't sign in.`,
        fail: "We couldn't suspend them",
      }),
      statusAction({
        id: "archive",
        label: "Archive",
        icon: <Archive aria-hidden="true" />,
        to: "archived",
        send: "archive",
        back: "restore",
        done: (n) => `Archived ${n}. Their records are kept.`,
        fail: "We couldn't archive them",
      }),
    ];
  }, [override, settle]);

  // With someone open on a wide screen, the list makes room for the sheet instead of hiding under it.
  const sheetOpen = person !== null;

  return (
    <Page wide className={cn(sheetOpen && "xl:pr-[29.5rem]")}>
      <PageHeader
        title="People"
        description="Everyone with an account. Open someone to see where they are without leaving the list."
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
        // On a phone the shared toolbar squeezes the search box to nothing; give it its own row.
        <V5DataTable<PersonRow>
          className="max-md:[&_div:has(>label[for=data-table-search])]:basis-full"
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
