import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { LearnerGoalView } from "../../../shared/goals";
import { gradeTask, taskResponseSchema, taskSchema, TERMINAL_PASS, toLearnerTask, type LearnerTask, type Task } from "../../../shared/tasks";
import { gradeForm, gradeWritten } from "../assessment/evaluateV4";
import { requireActiveUser } from "../auth/guards";
import { listUsableOutcomes } from "../goals/outcomes";
import { achieveGoal, capstoneOutcome, getGoal, learnerGoalViews } from "../goals/repo";
import { badRequest, notFound, parseOrThrow } from "../lib/errors";
import { departmentOf } from "../setup/repo";

const goalParams = z.object({ id: z.string().min(1).max(64) });

/** Code-graded capstones pass at 80%, like the terminal; rubric-graded ones (write, form) at 70%. */
export const CAPSTONE_PASS = TERMINAL_PASS;
export const CAPSTONE_RUBRIC_PASS = 0.7;

export type CapstoneResponse =
  | { goal: LearnerGoalView; capstone: { kind: "task"; title: string; task: LearnerTask } }
  | { goal: LearnerGoalView; capstone: { kind: "topic"; title: string; topicId: string } };

export interface CapstoneAttemptResult {
  score: number | null;
  passed: boolean;
  /** True when this attempt achieved the goal (false when it already was). */
  achieved: boolean;
  detail: string[];
  feedback: string | null;
  /** Set when it could not be graded now (a role-play, or no AI for a written answer). */
  message: string | null;
  /** The full task with its answers, once passed, for review. */
  review: Task | null;
}

/**
 * v4.3: the learner's goals and their capstones. Passing a capstone task here, or a capstone topic's
 * own practice (see progress/repo.ts), marks the goal achieved and suggests the next level.
 */
export async function registerGoalRoutes(app: FastifyInstance): Promise<void> {
  const findCapstone = (userId: string, goalId: string) => {
    const goal = getGoal(app.db, userId, goalId);
    if (!goal) throw notFound("No such goal.");
    const outcome = capstoneOutcome(goal, listUsableOutcomes(app.db, departmentOf(app.db, userId)), app.db);
    if (!outcome) throw notFound("This goal has no capstone yet.");
    const view = learnerGoalViews(app.db, userId).find((g) => g.id === goalId)!;
    return { goal, view, outcome };
  };

  app.get("/api/me/goals", async (request) => {
    const user = requireActiveUser(request);
    return { goals: learnerGoalViews(app.db, user.id) };
  });

  app.get("/api/me/goals/:id/capstone", async (request): Promise<CapstoneResponse> => {
    const user = requireActiveUser(request);
    const { id } = parseOrThrow(goalParams, request.params);
    const { view, outcome } = findCapstone(user.id, id);
    if (outcome.capstone.kind === "topic") return { goal: view, capstone: { kind: "topic", title: outcome.capstone.title, topicId: outcome.capstone.topicId } };
    const task = taskSchema.parse(outcome.capstone.task);
    return { goal: view, capstone: { kind: "task", title: outcome.capstone.title, task: toLearnerTask(task) } };
  });

  app.post(
    "/api/me/goals/:id/capstone/attempt",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request): Promise<CapstoneAttemptResult> => {
      const user = requireActiveUser(request);
      const { id } = parseOrThrow(goalParams, request.params);
      const { response } = parseOrThrow(z.object({ response: taskResponseSchema }), request.body);
      const { goal, outcome } = findCapstone(user.id, id);
      if (outcome.capstone.kind !== "task") throw badRequest("This capstone is a topic: pass its practice on the topic page.");
      const task = taskSchema.parse(outcome.capstone.task);
      if (response.kind !== task.kind) throw badRequest("That answer is for a different kind of task.");

      const meta = { subjectUserId: user.id } as { subjectUserId: string; assessmentId: string };
      let score: number | null = null;
      let detail: string[] = [];
      let feedback: string | null = null;
      let message: string | null = null;
      let pass = CAPSTONE_PASS;
      if (task.kind === "write" && response.kind === "write") {
        pass = CAPSTONE_RUBRIC_PASS;
        const graded = await gradeWritten(app.ai, task, response.text, meta).catch(() => null);
        if (graded) ({ score, feedback } = graded);
        else message = "Written answers are graded by AI, which is not available right now. Ask your admin to review it.";
      } else if (task.kind === "form" && response.kind === "form") {
        pass = CAPSTONE_RUBRIC_PASS;
        const graded = await gradeForm(app.ai, task, response.values, meta).catch(() => null);
        if (graded) {
          score = graded.score;
          feedback = graded.feedback;
          detail = graded.lines;
        } else {
          message = "This form is partly graded by AI, which is not available right now. Ask your admin to review it.";
        }
      } else if (task.kind === "roleplay") {
        message = "A client conversation is reviewed by your admin, who marks the goal achieved.";
      } else {
        const grade = gradeTask(task, response);
        score = grade.score;
        detail = grade.detail;
      }

      const passed = score !== null && score >= pass;
      const achieved = passed && goal.status === "active" ? achieveGoal(app.db, user.id, goal.id) : false;
      return { score, passed, achieved, detail, feedback, message, review: passed ? task : null };
    },
  );
}
