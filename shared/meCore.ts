import type { LengthBucket, LibraryFormat, LibraryLevel } from "./me";
import { plainTitle } from "./plainTitle";

/**
 * Me and Library helpers without zod (`./me` re-exports all of these). The v5 learner pages import
 * from here so their first download doesn't carry zod (Phase 9: about 26 KB gzipped, which put My
 * plan, Library, the course page and Me over the 200 KB budget). Server code keeps using `./me`.
 */

/** Notes whose body or lesson title contains every word of the query (case-insensitive). */
export function searchNotes<T extends { body: string; topicTitle: string }>(notes: readonly T[], query: string): T[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...notes];
  return notes.filter((n) => {
    const hay = `${n.body} ${n.topicTitle}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/**
 * LinkedIn "Add to profile" link for a certification. LinkedIn's help page (a528030) says the
 * button is a static URL that opens the certification form; the query below pre-fills it.
 */
export function linkedInAddUrl(cert: { title: string; issuedAt: number; id: string }, origin: string, organizationName = "Oyelabs"): string {
  const d = new Date(cert.issuedAt);
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: cert.title,
    organizationName,
    issueYear: String(d.getUTCFullYear()),
    issueMonth: String(d.getUTCMonth() + 1),
    certUrl: `${origin}/verify/${encodeURIComponent(cert.id)}`,
    certId: cert.id,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

export function lengthBucket(minutes: number): LengthBucket {
  if (minutes < 90) return "short";
  if (minutes <= 360) return "medium";
  return "long";
}

/**
 * Video-heavy when at least 60% of lessons have a video and the reading is light; reading-heavy when
 * under 30% have one, or under 60% with long reading. Everything else is a mix.
 */
export function formatOf(lessonsWithVideo: number, lessons: number, readingWords: number): LibraryFormat {
  if (lessons === 0) return "reading";
  const share = lessonsWithVideo / lessons;
  const wordsPerLesson = readingWords / lessons;
  if (share >= 0.6 && wordsPerLesson < 900) return "video";
  if (share < 0.3 || (share < 0.6 && wordsPerLesson >= 1500)) return "reading";
  return "mixed";
}

const VERBS = /^(build|write|use|set|deploy|create|design|explain|run|debug|test|handle|read|plan|ship|manage|configure|implement|understand|apply|choose|compare|model|measure|secure|scale|structure|work|lead|prepare|present|estimate|review|automate|optimi[sz]e|spot|avoid|fix|make|send|price|negotiate)\b/i;
const QUESTION_WORDS = /^(how|what|why|when|where|which)\b/i;
const LEVEL_VERB: Record<LibraryLevel, string> = { beginner: "Explain", intermediate: "Use", advanced: "Apply", expert: "Reason about" };

/** Turns a lesson or section title into a "You'll be able to…" line. Titles that already start with a verb are kept. */
export function outcomeLine(title: string, level: LibraryLevel | null): string {
  const clean = plainTitle(title).replace(/\s+/g, " ").replace(/[.:]+$/, "").trim();
  if (!clean) return "";
  if (VERBS.test(clean)) return clean[0].toUpperCase() + clean.slice(1);
  // "How JS code is executed" reads as "Explain how JS code is executed", not "Use How JS…" (Phase 9.2).
  if (QUESTION_WORDS.test(clean)) return `Explain ${clean[0].toLowerCase()}${clean.slice(1)}`;
  // Titles are kept as written (tech titles are full of proper nouns: "React Router", "Docker").
  return `${LEVEL_VERB[level ?? "intermediate"]} ${clean}`;
}
