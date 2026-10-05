import type { ColumnDef } from "@tanstack/react-table";
import { Bell, CalendarRange, Library, Repeat, Sun, UserRound } from "lucide-react";
import { useState } from "react";

import { useTableQueryState, type TableFieldDef } from "@/components/data-table";

import { AppShell, type NavItem } from "../components/AppShell";
import { Button } from "../components/Button";
import { V5DataTable } from "../components/DataTable";
import { Avatar, Badge } from "../components/Primitives";
import { ProgressBar } from "../components/Progress";
import { StatusLine } from "../components/Lesson";
import { Demo, Preview } from "./scaffold";

const NAV: NavItem[] = [
  { href: "#today", label: "Today", icon: Sun, active: true },
  { href: "#plan", label: "My plan", icon: CalendarRange },
  { href: "#library", label: "Library", icon: Library },
  { href: "#review", label: "Review", icon: Repeat, badge: 12 },
  { href: "#me", label: "Me", icon: UserRound },
];

interface Person {
  id: string;
  name: string;
  team: string;
  progress: number;
  status: "on_track" | "behind" | "done";
}

const PEOPLE: Person[] = [
  { id: "p1", name: "Rahul Mehta", team: "Backend", progress: 64, status: "on_track" },
  { id: "p2", name: "Priya Shah", team: "Frontend", progress: 22, status: "behind" },
  { id: "p3", name: "Ana Lopez", team: "QA", progress: 100, status: "done" },
  { id: "p4", name: "Sam Okafor", team: "Backend", progress: 48, status: "on_track" },
];

const STATUS = { on_track: { label: "On track", tone: "success" }, behind: { label: "Behind", tone: "warning" }, done: { label: "Done", tone: "brand" } } as const;

const FIELDS: TableFieldDef<Person>[] = [
  { name: "name", label: "Name", type: "string", searchable: true },
  { name: "team", label: "Team", type: "enum", quick: true, options: [{ value: "Backend", label: "Backend" }, { value: "Frontend", label: "Frontend" }, { value: "QA", label: "QA" }] },
  { name: "progress", label: "Progress", type: "number", min: 0, max: 100, step: 5, unit: "%" },
  { name: "status", label: "Status", type: "enum", quick: true, options: Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label })) },
];

const COLUMNS: ColumnDef<Person, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="flex items-center gap-2">
        <Avatar name={row.original.name} size="sm" decorative />
        {row.original.name}
      </span>
    ),
  },
  { accessorKey: "team", header: "Team" },
  { accessorKey: "progress", header: "Progress", cell: ({ row }) => (
      <span className="flex items-center gap-2">
        <ProgressBar value={row.original.progress} size="sm" label={`${row.original.name}'s progress`} className="w-24" />
        <span className="tabular-nums">{row.original.progress}%</span>
      </span>
    ),
  },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge tone={STATUS[row.original.status].tone}>{STATUS[row.original.status].label}</Badge> },
];

function TableDemo() {
  const { query, setQuery } = useTableQueryState();
  return (
    <V5DataTable
      data={PEOPLE}
      columns={COLUMNS}
      fields={FIELDS}
      getRowId={(p) => p.id}
      query={query}
      onQueryChange={setQuery}
      tableKey="design.demo"
      noun="person"
      exportName="design-demo"
      emptyState={{ title: "No one here yet", body: "Add someone from Onboard." }}
      caption="Example people table"
    />
  );
}

export default function ComponentsShell() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Demo
        id="c-shell"
        name="AppShell"
        use="Top bar with search (Ctrl K), a sidebar from 768 px up, and a five-item bottom nav on a phone: Today, My plan, Library, Review, Me. The skip link jumps to the main content. Resize the window to see both."
      >
        <Preview className="lg:grid-cols-1" paneClassName="p-0 sm:p-0">
          <div className="h-[28rem] overflow-hidden rounded-card [transform:translateZ(0)]">
            <AppShell
              preview
              nav={NAV}
              onSearch={() => setOpen(!open)}
              topRight={
                <>
                  <Button size="icon" variant="ghost" aria-label="Notifications">
                    <Bell aria-hidden="true" />
                  </Button>
                  <Avatar name="Rahul Mehta" size="sm" />
                </>
              }
              className="min-h-full"
            >
              <div className="p-4 md:p-6">
                <h3 className="font-display text-h2 font-semibold text-fg-1">Good morning, Rahul</h3>
                <StatusLine className="mt-4" tone="info" action={<Button size="sm" variant="primary">Continue</Button>}>
                  You're 12 minutes into "The event loop".
                </StatusLine>
              </div>
            </AppShell>
          </div>
        </Preview>
      </Demo>

      <Demo
        id="c-table"
        name="DataTable"
        use="The admin table: search, quick filters, saved views, CSV, row keyboard navigation. Compact density by default. Import it from components/DataTable so learner pages don't download it."
      >
        <Preview single>
          <div className="pt-4">
            <TableDemo />
          </div>
        </Preview>
      </Demo>
    </>
  );
}
