/**
 * Plain content constants with no zod import, so client code on every page (the progress store)
 * can use them without pulling the schema library into the first download. `shared/content.ts`
 * re-exports them.
 */

/** A quiz passes at this score (percent). */
export const QUIZ_PASS_THRESHOLD = 80;
