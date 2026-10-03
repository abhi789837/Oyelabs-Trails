/**
 * MockProvider fixtures for v4.3 topic tests ("topic_test_items", "topic_test_relevance",
 * "topic_test_answer"). Deterministic and semantically coherent, so the gates can be exercised end to
 * end without a credential:
 *
 * - The writer builds each item from a real passage: the key is an exact quote from it, the
 *   distractors are the same words rotated (so the key is never the longest option). In round 1 it
 *   deliberately writes two bad items when asked for 4+: one with "All of the above" (format gate)
 *   and one citing a sentence that is not in the topic (relevance gate). Later rounds are clean.
 * - The relevance checker says "supported" when the keyed option's text appears in a passage.
 * - The blind answerer WITH content picks the options whose text appears in a passage; WITHOUT
 *   content it picks the option sharing the most words with the stem, confidently only when that
 *   overlap is unique and at least three words (a cue a real test-wise student would use).
 */

interface MockPassage {
  id: string;
  heading: string;
  text: string;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

function parsePassages(user: string): MockPassage[] {
  const out: MockPassage[] = [];
  for (const m of user.matchAll(/<passage id="([^"]+)" heading="([^"]*)">\n([\s\S]*?)\n<\/passage>/g)) {
    out.push({ id: m[1], heading: m[2], text: m[3] });
  }
  return out;
}

function parseObjectives(user: string): string[] {
  return [...user.matchAll(/<objective id="([^"]+)">/g)].map((m) => m[1]);
}

export function fixtureTopicTestItems(user: string): { items: unknown[] } {
  const passages = parsePassages(user).filter((p) => p.text.replace(/\s+/g, " ").trim().split(" ").length >= 8);
  const objectives = parseObjectives(user);
  const count = Number(/Write exactly (\d+) items/.exec(user)?.[1] ?? 5);
  const round = Number(/Round: (\d+)/.exec(user)?.[1] ?? 1);
  if (passages.length === 0) return { items: [] };

  const items: unknown[] = [];
  for (let i = 0; i < count; i++) {
    const passage = passages[(i + round * 3) % passages.length];
    const words = passage.text.replace(/\s+/g, " ").trim().split(" ");
    const offset = (i * 2 + round) % Math.max(1, words.length - 8);
    const quoteWords = words.slice(offset, offset + 8);
    const quote = quoteWords.join(" ");
    const rotate = (k: number) => [...quoteWords.slice(k), ...quoteWords.slice(0, k)].join(" ");
    const options = [
      { text: quote, correct: true, misconception: "" },
      { text: `${rotate(3)} instead`, correct: false, misconception: `Reverses the order of the idea in ${passage.heading} (variant ${i + 1}a)` },
      { text: rotate(5), correct: false, misconception: `Mixes up cause and effect from ${passage.heading} (variant ${i + 1}b)` },
    ];
    // Vary the key's position.
    const shift = i % 3;
    const ordered = [...options.slice(shift), ...options.slice(0, shift)];
    let citationQuote = quote;
    if (round === 1 && count >= 4 && i === 1) {
      const slot = ordered.findIndex((o) => !o.correct);
      ordered[slot] = { text: "All of the above", correct: false, misconception: "Hedges between options" };
    }
    if (round === 1 && count >= 4 && i === 3) citationQuote = "this sentence does not appear anywhere in the topic text";
    items.push({
      objectiveId: objectives[i % Math.max(1, objectives.length)] ?? "o1",
      band: i % 10 === 9 ? "harder_apply" : i % 2 === 0 ? "recall" : "apply",
      prompt: `Mock item ${round}.${i + 1}: which phrasing matches the topic's own wording under "${passage.heading}"?`,
      options: ordered,
      explanation: `The topic says exactly this in ${passage.heading}; the other options rearrange its words.`,
      citation: { passageId: passage.id, quote: citationQuote },
    });
  }
  return { items };
}

interface MockItem {
  n: number;
  question: string;
  options: { letter: string; text: string }[];
  keyed: string[];
  cited: { passageId: string; quote: string } | null;
}

function parseItems(user: string): MockItem[] {
  const blocks = user.split(/^### Item /m).slice(1);
  return blocks.map((block) => {
    const n = Number(/^(\d+)/.exec(block)?.[1] ?? 0);
    const question = /Question[^:]*: (.*)/.exec(block)?.[1] ?? "";
    const options = [...block.matchAll(/^([A-H])\) (.*)$/gm)].map((m) => ({ letter: m[1], text: m[2] }));
    const keyed = (/^Keyed: (.*)$/m.exec(block)?.[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const citedMatch = /^Cited: ([^ |]+) \| "(.*)"$/m.exec(block);
    return { n, question, options, keyed, cited: citedMatch ? { passageId: citedMatch[1], quote: citedMatch[2] } : null };
  });
}

export function fixtureTopicTestRelevance(user: string) {
  const passages = parsePassages(user);
  return {
    items: parseItems(user).map((item) => {
      const keyTexts = item.options.filter((o) => item.keyed.includes(o.letter)).map((o) => norm(o.text));
      const supporting = passages.find((p) => keyTexts.length > 0 && keyTexts.every((k) => norm(p.text).includes(k)));
      const cited = item.cited ? passages.find((p) => p.id === item.cited!.passageId) : undefined;
      const supported = Boolean(supporting) && (!cited || cited.id === supporting!.id);
      const keyedOriginal = item.options.find((o) => item.keyed.includes(o.letter))?.text ?? null;
      return {
        n: item.n,
        supported,
        passageId: supported ? supporting!.id : null,
        quote: supported ? (item.cited?.quote ?? keyedOriginal) : null,
        misconceptions: item.options.filter((o) => !item.keyed.includes(o.letter)).map((o) => `Picks "${o.text.slice(0, 40)}" by confusing it with the keyed idea`),
        reason: supported ? "The passage states the keyed answer." : "No passage states the keyed answer.",
      };
    }),
  };
}

const words = (s: string) => new Set(norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 3));

export function fixtureTopicTestAnswer(user: string) {
  const passages = parsePassages(user);
  const withContent = passages.length > 0;
  return {
    answers: parseItems(user).map((item) => {
      if (withContent) {
        const found = item.options.filter((o) => passages.some((p) => norm(p.text).includes(norm(o.text))));
        return { n: item.n, choices: found.map((o) => o.letter), confidence: found.length ? 85 : 10 };
      }
      const stem = words(item.question);
      const scored = item.options.map((o) => ({ letter: o.letter, overlap: [...words(o.text)].filter((w) => stem.has(w)).length }));
      const best = Math.max(0, ...scored.map((s) => s.overlap));
      const top = scored.filter((s) => s.overlap === best);
      if (best >= 3 && top.length === 1) return { n: item.n, choices: [top[0].letter], confidence: 95 };
      return { n: item.n, choices: [item.options[0]?.letter ?? "A"], confidence: 25 };
    }),
  };
}
