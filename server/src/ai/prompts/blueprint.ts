import {
  DEFAULT_TIME_LIMIT_MIN,
  EXPLAIN_BUDGET_MIN,
  MAX_ITEM_TARGET,
  MAX_TIME_LIMIT_MIN,
  MAX_TOTAL_MIN,
  MIN_ITEM_TARGET,
} from "../../../../shared/assessment";
import type { LearnerProfile } from "../../../../shared/profile";
import type { ManifestDigest } from "../../assessment/digest";
import { MEASUREMENT_PRINCIPLES } from "./itemRules";

/**
 * AI call 1 (brief §9.2): decide what to test, before generating a single item.
 *
 * The blueprint is what makes the assessment about *this person*. It reads the admin's notes and
 * proposes 5-9 areas with a hypothesis level for each, which the adaptive selector then uses as
 * its starting point — so a senior engineer does not spend ten items proving they know what a
 * variable is.
 */
export const BLUEPRINT_SYSTEM = `You design placement assessments for a software engineering team.

${MEASUREMENT_PRINCIPLES}

You are given what an engineering manager knows about one person, plus the curriculum they could be placed into. Propose the skill areas worth testing.

## The five parts

Every area belongs to exactly one \`section\`, and the test is taken in this order:

1. \`track_basics\` — the fundamentals of the stack they work in day to day. **Always present.**
2. \`high_targets\` — one area per High-priority target their administrator listed.
3. \`other_targets\` — the Medium and Low targets, more lightly.
4. \`ai_working\` — how they work with AI tools today.
5. \`hands_on\` — short practical tasks. One area is enough.

Rules:
- 3 to 8 areas. Each covers one or more modules from the digest, by module id, and names its section.
- **Always include one \`track_basics\` area**, even if the notes skip it. Someone can be fluent in a framework and shaky on the language underneath, and that is exactly what the notes usually miss.
- **One area per High-priority target**, in the order they are listed. The administrator ranked them; do not re-rank them.
- Medium and Low targets share one or two \`other_targets\` areas. Do not give each its own.
- Include exactly one \`ai_working\` area. Its modules may be loosely related — what is being measured is judgement about AI-assisted work, not recall.
- Include one "probe" area adjacent to their claimed skills but not claimed by them, to find hidden strength. Put it in \`track_basics\` and say in its rationale that it is a probe.
- hypothesisLevel is your honest reading of the notes, from 1 to 5. It decides only whether that area *starts* easy or medium — the staircase climbs from there — so being wrong costs one easy question. Do not hedge everything to 3.
- Each rationale cites something specific from the notes, the claimed skills or a named target. "General coverage" is not a rationale.
- timeLimitMinutes: ${DEFAULT_TIME_LIMIT_MIN} unless the notes justify less. It may not exceed ${MAX_TIME_LIMIT_MIN}; a written section of ${EXPLAIN_BUDGET_MIN} more minutes is added on top, and the total sitting is capped at ${MAX_TOTAL_MIN} minutes.
- targetItemCount: ${MIN_ITEM_TARGET} to ${MAX_ITEM_TARGET}.
- Only use module ids that appear in the digest.

## This is a measurement, not a filter

The point is to find out where somebody is so their plan can start in the right place. It is not to
catch them out, and a blueprint that makes a competent engineer feel stupid has failed at its only
job. Pitch every area so that somebody at the level you hypothesised would answer the first question
comfortably.`;

export interface BlueprintFocus {
  track: string | null;
  stack: string | null;
  selfLevel: number | null;
  targets: { skill: string; priority: string; targetDate: string | null }[];
  skip: string[];
}

export function buildBlueprintUser(
  profile: LearnerProfile,
  digest: ManifestDigest,
  displayName: string,
  focus?: BlueprintFocus,
): string {
  const skills = profile.claimedSkills.length
    ? profile.claimedSkills.map((s) => `- ${s.area}: level ${s.level}/5${s.note ? ` (${s.note})` : ""}`).join("\n")
    : "- none recorded";

  const modules = digest.modules
    .map((m) => `- ${m.id} · ${m.track} / ${m.name} · ${m.topicCount} topics, levels ${m.levels.join("/")}`)
    .join("\n");

  /* The targets, in the administrator's own order, grouped so the model cannot mistake a Low for a
     High. This block is the single most important thing in the prompt: it is what makes the test
     about this person's job rather than about the curriculum. */
  const targets = focus?.targets.length
    ? focus.targets
        .map((t) => `- ${t.skill} · ${t.priority.toUpperCase()}${t.targetDate ? ` · by ${t.targetDate}` : ""}`)
        .join("\n")
    : "- none set; build the test from the notes and the claimed skills alone";

  return `## The person

Name: ${displayName}
Role: ${profile.roleTitle ?? "not recorded"}
Current track: ${focus?.track ?? "not recorded"}
Main stack: ${focus?.stack ?? "not recorded"}
Years of experience: ${profile.yearsExperience ?? "not recorded"}
Self-assessed level: ${focus?.selfLevel ? `${focus.selfLevel}/5` : "not recorded"}
Target tracks: ${profile.targetTracks.length ? profile.targetTracks.join(", ") : "not specified"}

### What they are being trained towards, in priority order

${targets}
${focus?.skip.length ? `\nDo not test: ${focus.skip.join(", ")}\n` : ""}

### What their manager wrote

${profile.adminNotes.trim() || "(no notes were written)"}

### Claimed skills, as estimated by their manager

${skills}

## Curriculum modules available

${modules}

Propose the assessment blueprint.`;
}
