import type { AssessmentStatus } from "@shared/enums";

/**
 * The waiting screen's stage list, derived from the status the server actually reports.
 *
 * The rule this file exists to enforce: **no invented progress.** There is no percentage here, no
 * elapsed-time bar and no sub-step the server does not publish, because the only thing the learner
 * can be told truthfully is which of the server's own statuses the job is in. A bar that creeps to
 * 90% and sits there is a lie told to make waiting feel shorter, and someone who has just finished
 * an hour-long assessment has earned better than that.
 *
 * The admin's `GenerationLog` is the detailed version of the same job. The learner gets stages,
 * not detail: which provider call failed and how many items were dropped is their manager's
 * business, not theirs (brief §13).
 */

export type StageState = "done" | "current" | "pending" | "failed";

export interface WaitStage {
  id: string;
  label: string;
  state: StageState;
}

/** The two funnels a learner can be sitting in front of, each in the server's own status order. */
const PIPELINES = {
  generation: [
    { id: "generating", label: "Writing your questions", statuses: ["generating"] },
    { id: "awaiting_approval", label: "Final checks", statuses: ["awaiting_approval"] },
    { id: "ready", label: "Ready to start", statuses: ["ready"] },
  ],
  evaluation: [
    { id: "submitted", label: "Answers received", statuses: ["submitted"] },
    { id: "evaluating", label: "Marking your answers", statuses: ["evaluating"] },
    { id: "completed", label: "Your plan is ready", statuses: ["completed"] },
  ],
} as const satisfies Record<string, readonly { id: string; label: string; statuses: readonly AssessmentStatus[] }[]>;

function pipelineFor(status: AssessmentStatus): readonly { id: string; label: string; statuses: readonly AssessmentStatus[] }[] | null {
  if (PIPELINES.generation.some((stage) => (stage.statuses as readonly AssessmentStatus[]).includes(status))) {
    return PIPELINES.generation;
  }
  if (PIPELINES.evaluation.some((stage) => (stage.statuses as readonly AssessmentStatus[]).includes(status))) {
    return PIPELINES.evaluation;
  }
  return null;
}

/**
 * The stages to show for a status, or null when the status is not one of the two waits.
 *
 * `failed` is reported against generation, which is the only job that can fail in front of a
 * learner: an evaluation that fails leaves the assessment in `submitted` until it is retried, and
 * nothing about that is the learner's to act on.
 */
export function waitStages(status: AssessmentStatus): WaitStage[] | null {
  if (status === "failed") {
    return PIPELINES.generation.map((stage, index) => ({
      id: stage.id,
      label: stage.label,
      state: index === 0 ? "failed" : "pending",
    }));
  }

  const pipeline = pipelineFor(status);
  if (!pipeline) return null;

  const currentIndex = pipeline.findIndex((stage) => (stage.statuses as readonly AssessmentStatus[]).includes(status));
  const isTerminal = currentIndex === pipeline.length - 1;

  return pipeline.map((stage, index) => ({
    id: stage.id,
    label: stage.label,
    // The last stage of each pipeline is an arrival, not a step in flight, so it reads as done.
    state: index < currentIndex || (index === currentIndex && isTerminal) ? "done" : index === currentIndex ? "current" : "pending",
  }));
}

/** The heading above the stages. Deliberately plain: this screen is not an event. */
export function waitHeading(status: AssessmentStatus): string {
  switch (status) {
    case "generating":
      return "Building your assessment";
    case "awaiting_approval":
      return "Almost ready";
    case "failed":
      return "Your assessment could not be built";
    default:
      return "Evaluating your assessment";
  }
}
