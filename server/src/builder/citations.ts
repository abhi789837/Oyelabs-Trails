import type { WrittenTopic } from "../../../shared/builder";
import type { VerifiedSource } from "./research";

/**
 * The check that turns "we told the model not to invent URLs" into "it did not".
 *
 * The write prompt says, twice and in capitals, that only the supplied sources may be cited. That is
 * an instruction. This is the guarantee — and the difference matters, because the failure it guards
 * against is silent: a plausible-looking URL in a reference list is indistinguishable from a real
 * one until a learner clicks it and gets a 404, weeks later, and quietly concludes the platform's
 * recommendations are worthless.
 *
 * Applied before anything is written to the database, so an invented citation costs a regeneration
 * rather than reaching a person.
 */

/**
 * Compares two URLs the way a human would.
 *
 * A model handed `https://docs.cpanel.net/knowledge-base/` will sometimes return it without the
 * trailing slash, or with the scheme normalised, or with a `?ref=` the source did not have.
 * Treating those as different would reject correct citations; treating *any* URL on the same host
 * as equal would let an invented deep link through. The comparison is therefore: same host, same
 * path with a trailing slash ignored, query and fragment disregarded.
 */
export function sameUrl(a: string, b: string): boolean {
  const left = canonical(a);
  const right = canonical(b);
  return left !== null && left === right;
}

function canonical(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "").toLowerCase();
    return `${host}${path}`;
  } catch {
    return null;
  }
}

export interface CitationCheck {
  ok: boolean;
  /** URLs the model cited that were not in the verified list. */
  invented: string[];
  /** The topic with only verified citations kept — usable when enough of them survive. */
  cleaned: WrittenTopic;
}

/**
 * Drops any citation that was not in the verified list, and says what it dropped.
 *
 * Returns a cleaned topic rather than only a verdict, because the useful outcome is usually partial:
 * a model that cites four real sources and one invented one has written a fine lesson with one bad
 * line in it, and throwing the whole thing away would cost a regeneration for nothing. The caller
 * decides whether what survived is enough — `ok` is false when anything was invented, so the
 * decision is explicit rather than accidental.
 *
 * The video id is checked the same way: a lesson is handed one verified id or none, and anything
 * else is dropped rather than embedded.
 */
export function enforceCitations(
  topic: WrittenTopic,
  verified: VerifiedSource[],
  allowedVideoId: string | null,
): CitationCheck {
  const invented: string[] = [];

  const references = topic.references.filter((reference) => {
    const match = verified.find((source) => sameUrl(source.url, reference.url));
    if (!match) {
      invented.push(reference.url);
      return false;
    }
    return true;
  });

  /* Rewrite to the verified spelling rather than keeping the model's. They are equal by the
     comparison above but not necessarily byte-identical, and the stored URL should be the one that
     was actually fetched — that is the one `course_sources` will re-check every week. */
  const normalised = references.map((reference) => {
    const source = verified.find((candidate) => sameUrl(candidate.url, reference.url))!;
    return { ...reference, url: source.url };
  });

  let videoId = topic.videoId;
  if (videoId && videoId !== allowedVideoId) {
    invented.push(`video:${videoId}`);
    videoId = null;
  }

  return {
    ok: invented.length === 0,
    invented,
    cleaned: { ...topic, references: normalised, videoId },
  };
}

/** The floor below which a lesson has too few references to be worth keeping. */
export const MIN_REFERENCES = 2;

/**
 * Whether a cleaned lesson still stands up.
 *
 * Two rather than the three the schema asks for: three is what a lesson should have, two is what it
 * can survive on when a source was dropped. Below that the lesson is citing almost nothing and
 * should be rewritten against the sources that did verify.
 */
export function citationsSufficient(topic: WrittenTopic): boolean {
  return topic.references.length >= MIN_REFERENCES;
}
