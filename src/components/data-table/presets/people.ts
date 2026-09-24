import type { UserSummary } from "@shared/admin";
import { EMPTY_TABLE_QUERY, type TableQuery } from "@shared/table";

import type { BuiltInView, TableFieldDef } from "../types";

/**
 * The People table's field catalogue and its built-in views.
 *
 * Kept in the kit rather than in the page so that the screen (U7) is layout and copy, and the
 * question of *what may be filtered* stays next to the machinery that filters it. It mirrors
 * `usersTableSpec` in `server/src/lib/tableSpecs.ts` for the columns that exist in the database,
 * and adds four that only exist on `UserSummary` — the assessment status, the warning count and
 * the two plan counts are assembled per row when the response is built, so they are filterable
 * here and deliberately absent from the server whitelist.
 */

export const peopleFields: TableFieldDef<UserSummary>[] = [
  { name: "displayName", label: "Name", type: "string", searchable: true },
  { name: "username", label: "Username", type: "string", searchable: true },
  { name: "roleTitle", label: "Role title", type: "string", searchable: true },
  {
    name: "role",
    label: "Account",
    type: "enum",
    quick: true,
    options: [
      { value: "learner", label: "Learner" },
      { value: "superadmin", label: "Super admin" },
    ],
  },
  {
    name: "status",
    label: "Status",
    type: "enum",
    quick: true,
    options: [
      { value: "active", label: "Active" },
      { value: "disabled", label: "Disabled" },
    ],
  },
  {
    name: "assessmentStatus",
    label: "Assessment",
    type: "enum",
    quick: true,
    options: [
      { value: "generating", label: "Generating" },
      { value: "awaiting_approval", label: "Awaiting approval" },
      { value: "ready", label: "Ready" },
      { value: "in_progress", label: "In progress" },
      { value: "submitted", label: "Submitted" },
      { value: "evaluating", label: "Evaluating" },
      { value: "completed", label: "Completed" },
      { value: "terminated", label: "Terminated" },
      { value: "failed", label: "Failed" },
    ],
  },
  { name: "yearsExperience", label: "Experience", type: "number", min: 0, max: 20, unit: "yrs", quick: true },
  { name: "hardWarnings", label: "Hard warnings", type: "number", min: 0, max: 3 },
  {
    name: "mustChangePassword",
    label: "Temporary password",
    type: "boolean",
    trueLabel: "Not yet changed",
    falseLabel: "Changed",
  },
  { name: "createdAt", label: "Onboarded", type: "date", quick: true },
  { name: "lastLoginAt", label: "Last seen", type: "date" },
  {
    name: "planProgress",
    label: "Plan progress",
    type: "number",
    min: 0,
    max: 100,
    unit: "%",
    // Derived: there is no such column anywhere. A plan with no topics is 0, not a division by zero.
    accessor: (row) => (row.planTopicCount === 0 ? 0 : Math.round((row.planCompletedCount / row.planTopicCount) * 100)),
  },
];

const DAY = 86_400_000;

function base(query: Partial<TableQuery>): TableQuery {
  return { ...EMPTY_TABLE_QUERY, ...query };
}

/**
 * The three questions this table gets asked most, as one click each.
 *
 * Functions of `now` rather than stored queries, because "inactive for 14 days" written down as a
 * timestamp is correct on the day it is written and wrong every day after (see `types.ts`).
 */
export const peopleBuiltInViews: BuiltInView[] = [
  {
    id: "flagged",
    name: "Flagged",
    description: "integrity",
    build: () =>
      base({
        filters: { combinator: "and", conditions: [{ field: "hardWarnings", operator: "gt", value: 0 }] },
        sort: [{ field: "hardWarnings", dir: "desc" }],
      }),
  },
  {
    id: "needs-assessment",
    name: "Needs assessment",
    build: () =>
      base({
        filters: {
          // Never issued, or issued and ended badly. Both mean "this person still has no result",
          // which is the thing being looked for.
          combinator: "or",
          conditions: [
            { field: "assessmentStatus", operator: "isNull" },
            { field: "assessmentStatus", operator: "in", value: ["failed", "terminated"] },
          ],
        },
        sort: [{ field: "createdAt", dir: "asc" }],
      }),
  },
  {
    id: "inactive-14d",
    name: "Inactive 14d+",
    /* Someone who has *never* signed in has no `lastLoginAt`, and a comparison against NULL is
       never true, so they are not here. That is the flat filter set's one real limitation — it
       cannot say "before this date OR never" without nesting — and they are not lost: an account
       that has never been signed into has no assessment either, so it sits under
       "Needs assessment", which is the list someone would actually act from. */
    build: (now) =>
      base({
        filters: {
          combinator: "and",
          conditions: [
            { field: "status", operator: "eq", value: "active" },
            { field: "lastLoginAt", operator: "lt", value: now - 14 * DAY },
          ],
        },
        sort: [{ field: "lastLoginAt", dir: "asc" }],
      }),
  },
];
