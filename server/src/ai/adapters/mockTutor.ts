/**
 * Mock "Ask Oye" output (v5 Phase 3). Deterministic and grounded: it cites the first passage in the
 * lesson (`[sum.p1] {Summary} text` lines in `system`) with a quote copied from it, so the citation
 * check passes; and it answers with a question back, as the tutor rules ask.
 */
export function fixtureTutorAnswer(system: string, user: string): { answer: string; citations: { passageId: string; quote: string }[] } {
  const m = /^\[([a-z0-9.]+)\] \{[^}\n]*\} (.+)$/m.exec(system);
  const question = /QUESTION: (.+)$/m.exec(user)?.[1]?.trim() ?? "your question";
  const doing = /^STEP: do$/m.test(user);
  if (!m) {
    return { answer: `The lesson doesn't cover "${question}". Try asking a teammate.`, citations: [] };
  }
  const words = m[2].split(/\s+/).slice(0, 10).join(" ");
  const quote = words.length >= 8 ? words : m[2].slice(0, 60);
  const answer = doing
    ? `Good question. Here's a nudge rather than the answer: re-read where the lesson says "${quote}". What does that tell you to try first?`
    : `The lesson puts it like this: "${quote}". In your own words, what does that mean for "${question}"?`;
  return { answer, citations: [{ passageId: m[1], quote }] };
}

/** A "solution" that defines the function but can't pass real tests, so it is never shown. */
export function fixtureTutorSolution(user: string): { code: string; explanation: string } {
  const name = /Function name: ([A-Za-z_$][\w$]*)/.exec(user)?.[1] ?? "solution";
  return { code: `function ${name}() {\n  return undefined;\n}`, explanation: "A placeholder from the development mock. It is checked like any other solution." };
}
