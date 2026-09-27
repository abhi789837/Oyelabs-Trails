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

Rules:
- 3 to 6 areas. Each covers one or more modules from the digest, by module id. Fewer, deeper areas beat more shallow ones: the whole sitting is under half an hour.
- Always include one fundamentals area, even if the notes skip it. Someone can be fluent in a framework and shaky on the language underneath, and that is exactly what the notes usually miss.
- Include one "probe" area adjacent to their claimed skills but not claimed by them, to find hidden strength. Say in its rationale that it is a probe.
- hypothesisLevel is your honest reading of the notes, from 1 to 5. It is a starting point for an adaptive test, not a verdict — being wrong costs a couple of items, so do not hedge everything to 3.
- Each rationale cites something specific from the notes or the claimed skills. "General coverage" is not a rationale.
- timeLimitMinutes: ${DEFAULT_TIME_LIMIT_MIN} unless the notes justify less. It may not exceed ${MAX_TIME_LIMIT_MIN}; a written section of ${EXPLAIN_BUDGET_MIN} more minutes is added on top, and the total sitting is capped at ${MAX_TOTAL_MIN} minutes.
- targetItemCount: ${MIN_ITEM_TARGET} to ${MAX_ITEM_TARGET}. More areas needs more items, but the ceiling is the ceiling — with more areas, test each one less deeply rather than running long.
- Only use module ids that appear in the digest.`;

export function buildBlueprintUser(profile: LearnerProfile, digest: ManifestDigest, displayName: string): string {
  const skills = profile.claimedSkills.length
    ? profile.claimedSkills.map((s) => `- ${s.area}: level ${s.level}/5${s.note ? ` (${s.note})` : ""}`).join("\n")
    : "- none recorded";

  const modules = digest.modules
    .map((m) => `- ${m.id} · ${m.track} / ${m.name} · ${m.topicCount} topics, levels ${m.levels.join("/")}`)
    .join("\n");

  return `## The person

Name: ${displayName}
Role: ${profile.roleTitle ?? "not recorded"}
Years of experience: ${profile.yearsExperience ?? "not recorded"}
Target tracks: ${profile.targetTracks.length ? profile.targetTracks.join(", ") : "not specified"}

### What their manager wrote

${profile.adminNotes.trim() || "(no notes were written)"}

### Claimed skills, as estimated by their manager

${skills}

## Curriculum modules available

${modules}

Propose the assessment blueprint.`;
}
