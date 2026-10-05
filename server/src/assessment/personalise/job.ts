import { eq } from "drizzle-orm";

import { V4_MAX_MINUTES } from "../../../../shared/assessmentV4";
import { getCatalog } from "../../catalog/repo";
import * as schema from "../../db/schema";
import type { Job } from "../../jobs/queue";
import { now } from "../../lib/ids";
import { notify, staffIds } from "../../lib/notify";
import { getSetup } from "../../setup/repo";
import { assembleInto, getMinFinishMinutes, storeItems, type V4Config } from "../v4";
import { blueprintMix } from "./blueprint";
import { personalise, type PersonaliseDeps, type PersonaliseReport } from "./pipeline";

export interface PersonalisedConfig extends V4Config {
  personalisation: PersonaliseReport;
}

export function emptyReport(fallbackReason: string): PersonaliseReport {
  return {
    level: "balanced",
    understandingSource: "rules",
    intent: [],
    themes: [],
    reused: 0,
    generated: 0,
    fromBankAfterFailures: 0,
    regenerations: 0,
    rejected: [],
    estSeconds: 0,
    fallbackReason,
    costMicros: 0,
  };
}

/**
 * `assessment.personalise`: builds a learner's assessment in the background after "Save & assign".
 * Any failure falls back to the deterministic bank assembly, so an issued assessment always ends up
 * `ready` — and the admin is told which happened and why.
 */
export function personaliseHandler(deps: PersonaliseDeps) {
  return async (job: Job): Promise<void> => {
    const { assessmentId } = job.payload as { assessmentId: string };
    const { db } = deps;
    const assessment = db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId)).get();
    if (!assessment || assessment.status !== "generating") return;
    const user = db.select().from(schema.users).where(eq(schema.users.id, assessment.userId)).get();

    let config: PersonalisedConfig;
    try {
      const { picks, report } = await personalise(deps, assessmentId, assessment.userId);
      if (picks.length === 0) throw new Error("nothing could be generated or found in the bank");
      storeItems(db, assessmentId, picks);
      const setup = getSetup(db, assessment.userId);
      const catalog = getCatalog(db, { departmentId: setup.departmentId, includeArchived: true, withAreas: true });
      config = {
        format: "v4",
        departmentId: setup.departmentId,
        assessmentFormat: catalog.departments.find((d) => d.id === setup.departmentId)?.assessmentFormat ?? "coding",
        mix: blueprintMix(db, catalog, setup),
        minFinishMinutes: getMinFinishMinutes(db),
        maxMinutes: V4_MAX_MINUTES,
        shortfalls: [],
        personalisation: report,
      };
    } catch (error) {
      db.delete(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, assessmentId)).run();
      config = {
        ...assembleInto(db, assessmentId, assessment.userId),
        personalisation: emptyReport(`Personalisation failed (${error instanceof Error ? error.message.slice(0, 160) : String(error)}); built from the question bank instead.`),
      };
    }

    db.update(schema.assessments).set({ status: "ready", config, approvedAt: now() }).where(eq(schema.assessments.id, assessmentId)).run();
    const p = config.personalisation;
    const items = db.select({ est: schema.assessmentItems.estSeconds }).from(schema.assessmentItems).where(eq(schema.assessmentItems.assessmentId, assessmentId)).all();
    const minutes = Math.round(items.reduce((s, i) => s + (i.est ?? 0), 0) / 60);
    for (const recipientId of staffIds(db)) {
      notify(db, {
        recipientId,
        kind: "assessment.ready",
        title: `Assessment ready${user ? ` for ${user.displayName}` : ""}`,
        body: `${items.length} items · est. ${minutes} min · AI cost $${(p.costMicros / 1e6).toFixed(2)}${p.fallbackReason ? ` · ${p.fallbackReason}` : ""}`,
        link: `/admin/people/${assessment.userId}?tab=assessment`,
      });
    }
    notify(db, {
      recipientId: assessment.userId,
      kind: "assessment.ready",
      title: "Your assessment is ready",
      body: `About ${minutes || 30} minutes. Start it when you have a quiet half hour.`,
      link: "/assessment",
    });
  };
}
