import type { UserSummary } from "@shared/admin";
import { EMPTY_TABLE_QUERY, type TableQuery } from "@shared/table";

import type { BuiltInView, FieldOption, TableFieldDef } from "@/components/data-table";
import { peopleFieldsFor } from "@/components/data-table";

import type { PersonSignal } from "../api";

/** A People row: the account summary plus the v5 signals (last activity, stuck). */
export interface PersonRow extends UserSummary {
  lastActivityAt: number | null;
  stuck: boolean;
  idleDays: number | null;
  /** The test is being written, waiting to be checked, or sent and not started. */
  testPending: boolean;
  /** 0–100 of their plan done. */
  planDone: number;
}

const PENDING = new Set(["generating", "awaiting_approval", "ready"]);

export function toRows(users: readonly UserSummary[], signals: Readonly<Record<string, PersonSignal>>): PersonRow[] {
  return users.map((u) => {
    const s = signals[u.id];
    return {
      ...u,
      lastActivityAt: s?.lastActivityAt ?? null,
      stuck: s?.stuck ?? false,
      idleDays: s?.idleDays ?? null,
      testPending: u.role === "learner" && u.assessmentStatus !== null && PENDING.has(u.assessmentStatus),
      planDone: u.planTopicCount ? Math.round((u.planCompletedCount / u.planTopicCount) * 100) : 0,
    };
  });
}

/** The old People fields plus the three v5 ones. Copy is plain (no "assessment" in admin labels here). */
export function personFields(departments: readonly FieldOption[]): TableFieldDef<PersonRow>[] {
  const base = peopleFieldsFor(departments) as unknown as TableFieldDef<PersonRow>[];
  const relabelled = base.map((f) => (f.name === "assessmentStatus" ? { ...f, label: "Test" } : f));
  return [
    ...relabelled,
    { name: "stuck", label: "Stuck", type: "boolean", quick: true, trueLabel: "Stuck", falseLabel: "Moving" },
    { name: "testPending", label: "Test pending", type: "boolean", trueLabel: "Waiting", falseLabel: "Not waiting" },
    { name: "lastActivityAt", label: "Last learned", type: "date" },
  ];
}

const DAY = 86_400_000;

function view(query: Partial<TableQuery>): TableQuery {
  return { ...EMPTY_TABLE_QUERY, ...query };
}

/** The saved views every admin starts with. Department views are added per department. */
export function personViews(departments: readonly FieldOption[]): BuiltInView[] {
  return [
    {
      id: "on-programme",
      name: "Everyone on the programme",
      description: "leaves out archived people",
      build: () => view({ filters: { combinator: "and", conditions: [{ field: "status", operator: "in", value: ["active", "disabled"] }] }, sort: [{ field: "createdAt", dir: "desc" }] }),
    },
    {
      id: "stuck",
      name: "Stuck",
      description: `no learning for 7 days`,
      build: () => view({ filters: { combinator: "and", conditions: [{ field: "stuck", operator: "eq", value: true }] }, sort: [{ field: "lastActivityAt", dir: "asc" }] }),
    },
    {
      id: "test-pending",
      name: "Test pending",
      description: "written, waiting or not started",
      build: () => view({ filters: { combinator: "and", conditions: [{ field: "testPending", operator: "eq", value: true }] }, sort: [{ field: "createdAt", dir: "desc" }] }),
    },
    {
      id: "active",
      name: "Learned this week",
      build: (now) => view({ filters: { combinator: "and", conditions: [{ field: "lastActivityAt", operator: "gte", value: now - 7 * DAY }] }, sort: [{ field: "lastActivityAt", dir: "desc" }] }),
    },
    {
      id: "suspended",
      name: "Suspended",
      build: () => view({ filters: { combinator: "and", conditions: [{ field: "status", operator: "eq", value: "disabled" }] } }),
    },
    ...departments.map((d) => ({
      id: `dept-${d.value}`,
      name: d.label,
      description: "department",
      build: () => view({ filters: { combinator: "and", conditions: [{ field: "departmentId", operator: "eq", value: d.value }] }, sort: [{ field: "displayName", dir: "asc" }] }),
    })),
  ];
}
