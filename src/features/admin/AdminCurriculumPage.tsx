import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";

import type { TopicLevelValue, TrackIdValue } from "@shared/enums";

import { DataTable, useTableQueryState, type TableFieldDef } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { topicPath, useTracks } from "@/content";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { levelLabels } from "@/lib/track-meta";
import { formatMinutesCompact } from "@/lib/utils";

interface CurriculumRow {
  id: string;
  title: string;
  /* Carries the manifest's own types rather than plain strings, so `topicPath` and `levelLabels`
     take the row directly instead of being cast into accepting it. */
  trackId: TrackIdValue;
  trackName: string;
  moduleId: string;
  moduleName: string;
  level: TopicLevelValue;
  estMinutes: number;
  challengeType: string;
  challengeSize: number;
  isMilestone: boolean;
  available: boolean;
}

/**
 * An admin's window onto the whole curriculum — 715 topics across 67 camps and 7 trails.
 *
 * It exists because the learner-facing trail is, correctly, a *journey*: it shows one camp at a
 * time in an order that means something. That is the wrong shape for "which topics are expert-level
 * and have a code challenge?", which is the question an admin assembling a plan actually has.
 *
 * `mode="client"`: the manifest is already in the store, so there is nothing to fetch and nothing
 * to page. 715 rows is comfortably inside what the kit filters in one pass, and client mode is the
 * only one that can put counts next to the facet options — which on a curriculum browser is most of
 * the value ("Expert 84" tells you something before you have clicked it).
 *
 * Opening a row navigates to the ordinary topic page. There is no admin-only view of a topic, and
 * inventing one here would be a second place for the curriculum to be rendered.
 */
export default function AdminCurriculumPage() {
  useDocumentTitle("Curriculum");
  const navigate = useNavigate();
  const tracks = useTracks();
  const { query, setQuery } = useTableQueryState();

  const rows = useMemo<CurriculumRow[]>(() => {
    const out: CurriculumRow[] = [];
    for (const track of tracks) {
      for (const module of track.modules) {
        for (const topic of module.topics) {
          out.push({
            id: topic.id,
            title: topic.title,
            trackId: track.id,
            trackName: track.name,
            moduleId: module.id,
            moduleName: module.name,
            level: topic.level,
            estMinutes: topic.estMinutes,
            challengeType: topic.challengeType,
            challengeSize: topic.challengeSize,
            isMilestone: topic.isMilestone === true,
            available: module.available,
          });
        }
      }
    }
    return out;
  }, [tracks]);

  const fields = useMemo<TableFieldDef<CurriculumRow>[]>(() => {
    const distinct = (pick: (row: CurriculumRow) => string) =>
      [...new Set(rows.map(pick))].sort().map((value) => ({ value, label: value }));

    return [
      { name: "title", label: "Topic", type: "string", searchable: true },
      { name: "id", label: "Topic id", type: "string", searchable: true },
      { name: "trackName", label: "Trail", type: "enum", quick: true, options: distinct((r) => r.trackName) },
      { name: "moduleName", label: "Camp", type: "enum", quick: true, options: distinct((r) => r.moduleName) },
      {
        name: "level",
        label: "Level",
        type: "enum",
        quick: true,
        // Ordered by difficulty rather than alphabetically, because that is the order the words
        // mean something in.
        options: [
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
          { value: "expert", label: "Expert" },
        ],
      },
      {
        name: "challengeType",
        label: "Challenge",
        type: "enum",
        quick: true,
        options: [
          { value: "quiz", label: "Quiz" },
          { value: "code", label: "Code" },
        ],
      },
      { name: "estMinutes", label: "Estimated time", type: "number", min: 0, max: 240, step: 5, unit: "min", quick: true },
      { name: "challengeSize", label: "Questions or tests", type: "number", min: 0, max: 30 },
      { name: "isMilestone", label: "Milestone", type: "boolean", trueLabel: "Milestones", falseLabel: "Ordinary topics" },
      { name: "available", label: "Written", type: "boolean", trueLabel: "Written", falseLabel: "Not written yet" },
    ];
  }, [rows]);

  const columns = useMemo<ColumnDef<CurriculumRow, unknown>[]>(
    () => [
      {
        id: "title",
        header: "Topic",
        cell: ({ row }) => (
          <div className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="font-medium">{row.original.title}</span>
              {row.original.isMilestone && <Badge variant="brand">milestone</Badge>}
            </span>
            <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">{row.original.id}</span>
          </div>
        ),
      },
      {
        id: "moduleName",
        header: "Camp",
        cell: ({ row }) => (
          <div className="text-muted-foreground">
            {row.original.moduleName}
            <span className="mt-0.5 block text-xs">{row.original.trackName}</span>
          </div>
        ),
      },
      {
        id: "level",
        header: "Level",
        cell: ({ row }) => <span className="text-sm">{levelLabels[row.original.level]}</span>,
      },
      {
        id: "challengeType",
        header: "Challenge",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.challengeType === "code" ? "Code" : "Quiz"}
            <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
              {row.original.challengeSize} {row.original.challengeType === "code" ? "tests" : "questions"}
            </span>
          </span>
        ),
      },
      {
        id: "estMinutes",
        header: "Time",
        meta: { align: "right" },
        cell: ({ row }) => (
          <span className="tabular text-sm text-muted-foreground">{formatMinutesCompact(row.original.estMinutes)}</span>
        ),
      },
    ],
    [],
  );

  const minutes = rows.reduce((total, row) => total + row.estMinutes, 0);

  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold">Curriculum</h1>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        {rows.length} topics across {new Set(rows.map((r) => r.moduleId)).size} camps and {tracks.length} trails —
        about {Math.round(minutes / 60)} hours of material. Opening one goes to the topic as a learner sees it.
      </p>

      <div className="mt-6">
        <DataTable
          data={rows}
          columns={columns}
          fields={fields}
          getRowId={(row) => row.id}
          query={query}
          onQueryChange={setQuery}
          mode="client"
          tableKey="admin.curriculum"
          loading={rows.length === 0}
          noun="topic"
          exportName="curriculum"
          searchPlaceholder="Search topic or id"
          caption="Every topic in the curriculum."
          emptyState={{
            title: "No curriculum loaded",
            body: "The manifest has not arrived yet. If this persists, the content bundle on the server may be missing.",
          }}
          onRowOpen={(row) => navigate(topicPath(row))}
          mobileCard={(row) => (
            <div className="space-y-1.5">
              <span className="block font-medium">{row.title}</span>
              <span className="block font-mono text-[11px] text-muted-foreground">{row.id}</span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>{row.moduleName}</span>
                <span>·</span>
                <span>{levelLabels[row.level]}</span>
                <span>·</span>
                <span>{formatMinutesCompact(row.estMinutes)}</span>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
