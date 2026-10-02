import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Globe, LinkIcon, RefreshCw, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";

import { REVIEW_PASS_SCORE } from "@shared/builder";

import { ApiRequestError } from "@/api/client";
import { DataTable, useTableQueryState, type TableFieldDef } from "@/components/data-table";
import { FormAlert } from "@/components/form/Field";
import { useConfirm } from "@/components/overlays";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/AuthProvider";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { notify } from "@/lib/toast";
import { cn, formatTimestamp } from "@/lib/utils";
import { ALL_DEPARTMENTS } from "../catalog/helpers";
import { useCatalog } from "../catalog/useCatalog";
import { builderApi, type GeneratedCourseRow } from "./api";

/**
 * Everything the AI wrote, and what happened to it.
 *
 * The column worth defending is **Review**. A generated course carries a score its own reviewer
 * gave it, and showing that score next to the approve button is the difference between an admin
 * rubber-stamping a queue and an admin reading the two that scored badly. A course below the pass
 * mark is marked, not hidden — the admin is the one who decides, and hiding the weak ones would
 * make that decision for them.
 */
export default function AdminGeneratedPage() {
  useDocumentTitle("Generated courses");
  const { departmentOptions } = useCatalog();
  const me = useCurrentUser();
  const confirm = useConfirm();
  const { query, setQuery } = useTableQueryState();

  const [rows, setRows] = useState<GeneratedCourseRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await builderApi.generated(signal);
      setRows(result.courses);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof ApiRequestError ? err.message : "Could not load the generated courses.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const decide = useCallback(
    async (row: GeneratedCourseRow, decision: "approve" | "reject") => {
      if (decision === "reject") {
        const ok = await confirm({
          title: `Reject "${row.title}"?`,
          body: "It is unpublished and the learner stops seeing it. It is kept rather than deleted — a rejected course is the most useful evidence there is about what the generator gets wrong.",
          confirmLabel: "Reject",
          variant: "destructive",
        });
        if (!ok) return;
      }
      setBusyId(row.courseId);
      try {
        await builderApi.decide(row.courseId, decision);
        notify.success(decision === "approve" ? `Published "${row.title}".` : `Rejected "${row.title}".`);
        await load();
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "That didn't work.");
      } finally {
        setBusyId(null);
      }
    },
    [confirm, load],
  );

  const promote = useCallback(
    async (row: GeneratedCourseRow) => {
      const ok = await confirm({
        title: `Put "${row.title}" in the catalogue?`,
        body: "Every learner will be able to see it, and the builder will offer it to anyone with the same gap instead of writing a new one. Read it first — a course written for one person sometimes assumes things about them.",
        confirmLabel: "Promote",
      });
      if (!ok) return;
      setBusyId(row.courseId);
      try {
        await builderApi.promote(row.courseId);
        notify.success(`"${row.title}" is in the catalogue.`);
        await load();
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "That didn't work.");
      } finally {
        setBusyId(null);
      }
    },
    [confirm, load],
  );

  const fields = useMemo<TableFieldDef<GeneratedCourseRow>[]>(
    () => [
      { name: "title", label: "Course", type: "string", searchable: true },
      { name: "skill", label: "Skill", type: "string", searchable: true },
      { name: "learnerName", label: "Learner", type: "string", searchable: true },
      {
        name: "status",
        label: "Status",
        type: "enum",
        quick: true,
        options: [
          { value: "pending_review", label: "Waiting for review" },
          { value: "needs_review", label: "Failed its review" },
          { value: "published", label: "Published" },
          { value: "rejected", label: "Rejected" },
          { value: "draft", label: "Draft" },
        ],
      },
      {
        name: "scope",
        label: "Scope",
        type: "enum",
        quick: true,
        options: [
          { value: "learner", label: "One learner" },
          { value: "global", label: "Catalogue" },
        ],
      },
      {
        name: "departmentId",
        label: "Department",
        type: "enum",
        quick: true,
        accessor: (row) => row.departmentId ?? ALL_DEPARTMENTS,
        options: [...departmentOptions, { value: ALL_DEPARTMENTS, label: "All departments" }],
      },
      { name: "reviewScore", label: "Review", type: "number", min: 1, max: 5, step: 0.1, quick: true },
      { name: "deadLinks", label: "Dead links", type: "number", min: 0, max: 50, quick: true },
      { name: "topicCount", label: "Lessons", type: "number", min: 0, max: 60 },
      { name: "createdAt", label: "Written", type: "date", quick: true },
    ],
    [departmentOptions],
  );

  const columns = useMemo<ColumnDef<GeneratedCourseRow, unknown>[]>(
    () => [
      {
        id: "title",
        header: "Course",
        size: 280,
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              to={`/admin/courses/${row.original.courseId}`}
              onClick={(event) => event.stopPropagation()}
              className="block truncate font-medium underline decoration-trailmark decoration-2 underline-offset-4"
            >
              {row.original.title}
            </Link>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">for: {row.original.skill}</span>
          </div>
        ),
      },
      {
        id: "learnerName",
        header: "Written for",
        cell: ({ row }) =>
          row.original.scope === "global" ? (
            <Badge variant="brand" className="gap-1">
              <Globe className="size-3" aria-hidden="true" />
              Catalogue
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">{row.original.learnerName ?? "—"}</span>
          ),
      },
      { id: "status", header: "Status", cell: ({ row }) => <StatusPill status={row.original.status} /> },
      {
        id: "reviewScore",
        header: "Review",
        meta: { align: "right" },
        cell: ({ row }) => <ReviewCell score={row.original.reviewScore} />,
      },
      {
        id: "deadLinks",
        header: "Links",
        meta: { align: "right" },
        cell: ({ row }) =>
          row.original.deadLinks > 0 ? (
            <span className="flex items-center justify-end gap-1 text-destructive">
              <LinkIcon className="size-3" aria-hidden="true" />
              <span className="tabular">{row.original.deadLinks} dead</span>
            </span>
          ) : (
            <span className="tabular text-xs text-muted-foreground">ok</span>
          ),
      },
      {
        id: "createdAt",
        header: "Written",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">{formatTimestamp(row.original.createdAt)}</span>
        ),
      },
      {
        id: "__actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        meta: { align: "right" },
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
            {row.original.status !== "published" && (
              <Button variant="ghost" size="sm" loading={busyId === row.original.courseId} onClick={() => void decide(row.original, "approve")}>
                <Check aria-hidden="true" />
                Approve
              </Button>
            )}
            {row.original.status === "published" && row.original.scope === "learner" && (
              <Button variant="ghost" size="sm" loading={busyId === row.original.courseId} onClick={() => void promote(row.original)}>
                <Globe aria-hidden="true" />
                Promote
              </Button>
            )}
            {row.original.status !== "rejected" && (
              <Button
                variant="ghost"
                size="icon-sm"
                loading={busyId === row.original.courseId}
                onClick={() => void decide(row.original, "reject")}
                className="text-destructive hover:text-destructive"
              >
                <X aria-hidden="true" />
                <span className="sr-only">Reject {row.original.title}</span>
              </Button>
            )}
          </div>
        ),
      },
    ],
    [busyId, decide, promote],
  );

  const waiting = (rows ?? []).filter((row) => row.status === "pending_review" || row.status === "needs_review").length;

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Generated courses</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Written by the AI for a gap no existing course covered. Each one was researched from
            pages that were fetched and checked — nothing here cites a URL that did not resolve when
            it was written.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCw aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {waiting > 0 && (
        <p className="mt-6 rounded-md border border-trailmark/50 bg-trailmark/[0.06] px-4 py-3 text-sm">
          <span className="font-medium">
            {waiting} course{waiting === 1 ? "" : "s"} waiting for you.
          </span>{" "}
          <span className="text-muted-foreground">
            Nothing reaches a learner until it is approved, unless auto-publish was set for them.
          </span>
        </p>
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
          getRowId={(row) => row.courseId}
          query={query}
          onQueryChange={setQuery}
          mode="client"
          defaultSort={[{ field: "createdAt", dir: "desc" }]}
          tableKey="admin.generated"
          accountId={me.id}
          loading={rows === null}
          onRetry={() => void load()}
          noun="course"
          exportName="generated-courses"
          searchPlaceholder="Search course, skill or learner"
          caption="Every course the AI has written."
          emptyState={{
            title: "Nothing generated yet",
            body: "A course is written when a placement assessment finds a gap that no existing course covers. Set a learner's priorities and issue their assessment to see one.",
            action: (
              <Button asChild variant="outline">
                <Link to="/admin/people">
                  <Sparkles aria-hidden="true" />
                  Go to people
                </Link>
              </Button>
            ),
          }}
          onRowOpen={(row) => window.open(`/admin/courses/${row.courseId}`, "_self")}
        />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: GeneratedCourseRow["status"] }) {
  const meta: Record<GeneratedCourseRow["status"], { label: string; variant: "success" | "danger" | "progress" | "outline" }> = {
    published: { label: "Published", variant: "success" },
    pending_review: { label: "Waiting for review", variant: "progress" },
    // Distinct from "waiting": this one failed its own review, and an admin should read it before
    // approving rather than clicking through a queue.
    needs_review: { label: "Failed its review", variant: "danger" },
    rejected: { label: "Rejected", variant: "outline" },
    draft: { label: "Draft", variant: "outline" },
  };
  const entry = meta[status];
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

function ReviewCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">—</span>;
  const passed = score >= REVIEW_PASS_SCORE;
  return (
    <span className={cn("tabular text-sm", passed ? "text-summit-strong" : "text-destructive")}>
      {score.toFixed(1)}
      <span className="text-xs text-muted-foreground">/5</span>
    </span>
  );
}
