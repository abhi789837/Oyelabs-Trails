/**
 * v4.5 Phase 4: the zod-free parts of `oyelabsCourses.ts` that learner screens need (the path
 * badge and the plain reason). Importing `oyelabsCourses.ts` from a learner route would pull zod
 * into its first load (the same split as `weeklyPlanCore.ts`).
 */

/** The badge text. Equal to `OYELABS_BADGE` in oyelabsCourses.ts (asserted in its test). */
export const OYELABS_BADGE_TEXT = "Oyelabs";

/**
 * The plain "why" for an Oyelabs course on a path or in a suggestion, from the course's own
 * description: "Added because it's Oyelabs' own process for white-label projects."
 *
 * The first clause of the description is the course's own words for what it is, so it is used
 * as written. "Our …" becomes "Oyelabs' …"; a description that is a sentence about the course
 * ("This course covers …") is reduced to its subject. With no description, the title is used.
 */
export function oyelabsCourseReason(course: { title: string; summary: string }): string {
  const lowerFirst = (text: string) => (/^[A-Z][a-z]/.test(text) ? `${text.charAt(0).toLowerCase()}${text.slice(1)}` : text);
  const clause = (course.summary.split(/[.!?;:\n]|,\s|\s[—–-]\s/)[0] ?? "").trim().replace(/[\s,]+$/, "");
  let phrase: string;
  if (clause.length < 4) {
    phrase = `Oyelabs' own course: ${course.title.trim()}`;
  } else {
    const ours = /^(?:our|oyelabs(?:'s|')?)\s+(?:own\s+)?/i.exec(clause);
    const about = /^(?:this|the)\s+(?:course|sop|guide|module)\s+(?:covers|teaches|explains|shows|is about|walks you through)\s+/i.exec(clause);
    if (ours) phrase = `Oyelabs' own ${clause.slice(ours[0].length)}`;
    else if (about) phrase = `Oyelabs' own course on ${lowerFirst(clause.slice(about[0].length))}`;
    else if (/^how\s/i.test(clause)) phrase = `Oyelabs' own guide to ${lowerFirst(clause)}`;
    else phrase = `Oyelabs' own course on ${lowerFirst(clause)}`;
  }
  if (phrase.length > 140) phrase = `${phrase.slice(0, 140).replace(/\s+\S*$/, "")}…`;
  return `Added because it's ${phrase}.`;
}
