/**
 * v4.5 Phase 0: path reasons that read naturally.
 *
 * The path algorithm (`pathOrder.ts`) wrote reasons by pasting the goal's label into a template:
 * "Next for your Build a validated form in React goal". The goal label is a sentence of its own, so
 * it now goes after a colon, with its first letter lowered unless that word is a name or an acronym:
 * "Next step towards your goal: build a validated form in React."
 *
 * `naturalReason` rewrites reasons stored by older builds, so existing paths read the same way
 * without a rebuild.
 */

/** Words that keep their capital at the start of a goal: product names, languages, acronyms. */
const PROPER_WORDS = new Set(
  [
    "react", "node", "node.js", "next.js", "nextjs", "vue", "angular", "svelte", "astro", "javascript", "typescript", "python", "django",
    "fastapi", "flask", "docker", "kubernetes", "git", "github", "gitlab", "bitbucket", "excel", "figma", "jira", "confluence", "sql",
    "postgresql", "postgres", "mysql", "mongodb", "redis", "aws", "azure", "gcp", "linux", "laravel", "php", "java", "kotlin", "swift",
    "flutter", "dart", "english", "hindi", "google", "microsoft", "slack", "tailwind", "express", "nestjs", "graphql", "html", "css",
    "wordpress", "shopify", "cpanel", "android", "agile", "scrum", "kanban", "claude", "copilot", "cursor", "chatgpt", "openai",
    "notion", "trello", "asana", "hubspot", "salesforce", "linkedin", "powerpoint", "word", "sass", "bootstrap", "vite", "jest",
    "vitest", "cypress", "playwright", "prisma", "stripe", "firebase", "supabase", "vercel", "netlify", "nginx", "apache", "oyelabs",
    "oyelearn", "webpack", "redux", "zustand", "npm", "c#", "c++", "go", "rust", "ruby", "rails", "unity",
  ],
);

/**
 * A goal label as it reads inside a sentence: "Build a validated form in React" → "build a
 * validated form in React"; "React Fundamentals", "AI-driven work", "API design" and "GitHub
 * flow" keep their capital.
 */
export function goalPhrase(label: string): string {
  const text = label.trim().replace(/\s+/g, " ").replace(/[.!]+$/, "");
  const match = /^(\S+)(.*)$/.exec(text);
  if (!match) return text;
  const [, first, rest] = match;
  const bare = first.replace(/[^A-Za-z0-9.+#-]/g, "");
  const head = bare.split("-")[0];
  if (!/^[A-Z]/.test(first)) return text;
  // An acronym or a name with a capital inside: AI, API, UI/UX, GitHub, JavaScript, iOS, SQL.
  if (/[A-Z]/.test(head.slice(1))) return text;
  if (PROPER_WORDS.has(bare.toLowerCase()) || PROPER_WORDS.has(head.toLowerCase())) return text;
  return `${first.charAt(0).toLowerCase()}${first.slice(1)}${rest}`;
}

/** "Next step towards your goal: build a validated form in React." */
export const nextStepReason = (goal: string): string => `Next step towards your goal: ${goalPhrase(goal)}.`;

/** "Comes before your goal: <goal>. It needs <skill>, which you're missing (0/5; it needs 3/5)." */
export const missingLinkReason = (goal: string, skill: string, at: string, needed: number): string =>
  `Comes before your goal: ${goalPhrase(goal)}. It needs ${skill}, which you're missing (${at}; it needs ${needed}/5).`;

/** "Moved up: <skill> comes first for your goal: <goal>." */
export const movedUpReason = (goal: string | null, skill: string): string =>
  goal ? `Moved up: ${skill} comes first for your goal: ${goalPhrase(goal)}.` : `Moved up: a more urgent goal needs ${skill} first.`;

/** "Critical goal: build a validated form in React. You're at 1/5 and it needs 3/5." */
export const goalLevelReason = (label: string, goal: string, at: string, needed: number): string =>
  `${label} goal: ${goalPhrase(goal)}. You're at ${at} and it needs ${needed}/5.`;

/**
 * Rewrites a reason stored by an older build into the natural form. Reasons in any other shape
 * (they were already plain) come back unchanged.
 */
export function naturalReason(reason: string): string {
  const r = reason.trim();
  let m = /^Next for your (.+?) goal(?:, after .+?)?\.?$/.exec(r);
  if (m) return nextStepReason(m[1]);
  m = /^Before (.+?) because \1 needs (.+?), which you're missing \((not measured yet|\d\/5); it needs (\d)\/5\)\.?$/.exec(r);
  if (m) return m[1] === "your goals" ? r : missingLinkReason(m[1], m[2], m[3], Number(m[4]));
  m = /^Moved up: (.+?) needs (.+?) first\.?$/.exec(r);
  if (m && !m[1].startsWith("the evaluation") && m[1] !== "a more urgent goal") return movedUpReason(m[1], m[2]);
  m = /^Next after (.+?): you've met your (.+?) goal, so this continues it\.?$/.exec(r);
  if (m) return `Next after ${m[1]}. You've met your goal (${goalPhrase(m[2])}), so this continues it.`;
  m = /^([A-Z][a-z-]*) goal (?!:)(.+?): you're at (not measured yet|\d\/5) and it needs (\d)\/5\.?$/.exec(r);
  if (m) return goalLevelReason(m[1], m[2], m[3], Number(m[4]));
  return reason;
}

/**
 * v4.5 Phase 4: why an Oyelabs course is on the path, from its own description:
 * "Added because it's Oyelabs' own process for white-label projects." (`oyelabsCourseReason`).
 * `naturalReason` leaves it as it is.
 */
export { oyelabsCourseReason as oyelabsReason } from "./oyelabsCore";
