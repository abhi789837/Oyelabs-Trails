import { describe, expect, it } from "vitest";

import {
  assessmentStatusSchema,
  credentialStatusSchema,
  itemStatusSchema,
  jobStatusSchema,
  roleSchema,
  severitySchema,
  topicStatusSchema,
  userStatusSchema,
} from "@shared/enums";

import { statusMeta, type StatusKind } from "./status-badge";

/**
 * The registry is typed as `Record<StatusKinds[K], Entry>`, so a missing value already fails the
 * build. This catches the other direction: a value that exists in the registry but was renamed or
 * removed in `shared/enums.ts`, which types alone would not notice.
 */
const coverage: { kind: StatusKind; values: readonly string[] }[] = [
  { kind: "user", values: userStatusSchema.options },
  { kind: "assessment", values: assessmentStatusSchema.options },
  { kind: "credential", values: credentialStatusSchema.options },
  { kind: "job", values: jobStatusSchema.options },
  { kind: "item", values: itemStatusSchema.options },
  { kind: "severity", values: severitySchema.options },
  { kind: "topic", values: topicStatusSchema.options },
  { kind: "role", values: roleSchema.options },
];

describe("StatusBadge registry", () => {
  it("gives every value of every status enum a label and a tone", () => {
    for (const { kind, values } of coverage) {
      expect(values.length).toBeGreaterThan(0);
      for (const value of values) {
        const meta = statusMeta(kind, value as never);
        expect(meta, `${kind}/${value}`).toBeDefined();
        expect(meta.label.length, `${kind}/${value}`).toBeGreaterThan(0);
        expect(meta.tone, `${kind}/${value}`).toBeTruthy();
      }
    }
  });

  it("writes labels for people, not snake_case for machines", () => {
    expect(statusMeta("assessment", "awaiting_approval").label).toBe("Awaiting approval");
    expect(statusMeta("assessment", "in_progress").label).toBe("In progress");
    expect(statusMeta("role", "superadmin").label).toBe("Super admin");
  });

  it("lets only a hard severity warning pulse", () => {
    const pulsing = coverage.flatMap(({ kind, values }) =>
      values.filter((value) => statusMeta(kind, value as never).pulse).map((value) => `${kind}/${value}`),
    );
    expect(pulsing).toEqual(["severity/hard"]);
  });

  it("keeps failure on the destructive tone wherever it appears", () => {
    expect(statusMeta("assessment", "failed").tone).toBe("danger");
    expect(statusMeta("credential", "failed").tone).toBe("danger");
    expect(statusMeta("job", "failed").tone).toBe("danger");
  });
});
