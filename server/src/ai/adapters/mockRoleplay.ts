import { findScenario } from "../../../../shared/roleplay";

/**
 * TEST STAND-INS for the v4.2 role-play calls (`roleplay_reply`, `roleplay_score`), used by
 * `MockProvider` only — never in production, where the mock is refused.
 *
 * The reply follows the scenario's scripted line for the turn, prefixed so a test (or an e2e run)
 * can tell the mock answered rather than the no-AI fallback. The score quotes the learner's first
 * message verbatim, so the evidence check keeps it, and gives each line all but one point.
 */

interface ReplyInput {
  scenarioId?: string;
  turn?: number;
  finalTurn?: boolean;
}

export function fixtureRoleplayReply(userJson: string): { reply: string } {
  const input = JSON.parse(userJson) as ReplyInput;
  const lines = findScenario(input.scenarioId ?? "")?.scripted ?? ["Understood."];
  const turn = Math.max(1, input.turn ?? 1);
  const line = lines[Math.min(turn - 1, lines.length - 1)];
  return { reply: `${line}${input.finalTurn ? " I'll wait for your email." : ""}` };
}

interface ScoreInput {
  rubric?: { index: number; points: number }[];
  conversation?: { speaker: string; text: string }[];
  followUpEmail?: string;
}

export function fixtureRoleplayScore(userJson: string) {
  const input = JSON.parse(userJson) as ScoreInput;
  const first = input.conversation?.find((c) => c.speaker === "pm")?.text ?? "";
  const quote = first.split(/\s+/).slice(0, 8).join(" ");
  return {
    dimensions: (input.rubric ?? []).map((r) => ({ index: r.index, score: Math.max(0, r.points - 1), evidence: quote })),
    tips: ["Ask what is driving the client's request before you talk about process.", "Close with an owner and a date for the next step."],
  };
}
