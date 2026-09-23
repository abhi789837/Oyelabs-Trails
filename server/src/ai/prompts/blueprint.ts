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
- 5 to 9 areas. Each covers one or more modules from the digest, by module id.
- Always include one fundamentals area, even if the notes skip it. Someone can be fluent in a framework and shaky on the language underneath, and that is exactly what the notes usually miss.
- Include one "probe" area adjacent to their claimed skills but not claimed by them, to find hidden strength. Say in its rationale that it is a probe.
- hypothesisLevel is your honest reading of the notes, from 1 to 5. It is a starting point for an adaptive test, not a verdict — being wrong costs a couple of items, so do not hedge everything to 3.
- Each rationale cites something specific from the notes or the claimed skills. "General coverage" is not a rationale.
- timeLimitMinutes: 60 unless the notes justify otherwise.
- targetItemCount: 25 to 40. More areas needs more items.
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
