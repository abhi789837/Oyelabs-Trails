/**
 * Its own file: the learner shell imports it eagerly, without the account helpers in `./account`.
 */

export interface PracticeLink {
  to: string;
  label: string;
}

/** The handbook and practice pages from the previous design, shown in the v5 shell. */
export const PRACTICE_LINKS: readonly PracticeLink[] = [
  { to: "/glossary", label: "Handbook" },
  { to: "/glossary/practice", label: "Flashcards" },
  { to: "/tools/classify", label: "Classify a request" },
  { to: "/practice/roleplay", label: "Client role-play" },
];
