/**
 * Structure-aware chunking: paragraphs, then sentences, then hard word windows,
 * greedily packed up to maxTokens with best-effort overlap.
 * @param {string} text
 * @param {number} maxTokens
 * @param {number} overlapTokens
 * @returns {string[]}
 */
function chunkText(text, maxTokens, overlapTokens) {
  if (!Number.isInteger(maxTokens) || maxTokens < 1) throw new RangeError("maxTokens must be a positive integer");
  if (!Number.isInteger(overlapTokens) || overlapTokens < 0 || overlapTokens >= maxTokens) {
    throw new RangeError("overlapTokens must be an integer in [0, maxTokens)");
  }

  // 1. Split into units that each fit in one chunk, preferring the biggest natural boundary.
  const units = [];
  for (const paragraph of text.split(/\n\s*\n/)) {
    const paragraphWords = words(paragraph);
    if (paragraphWords.length === 0) continue;
    if (paragraphWords.length <= maxTokens) {
      units.push(paragraphWords);
      continue;
    }
    for (const sentence of paragraph.split(/(?<=[.!?])\s+/)) {
      const sentenceWords = words(sentence);
      if (sentenceWords.length === 0) continue;
      if (sentenceWords.length <= maxTokens) {
        units.push(sentenceWords);
        continue;
      }
      for (let i = 0; i < sentenceWords.length; i += maxTokens) {
        units.push(sentenceWords.slice(i, i + maxTokens));
      }
    }
  }

  // 2. Greedily pack units into chunks, carrying overlap from the previous chunk.
  const chunks = [];
  let current = [];
  for (const unit of units) {
    if (current.length + unit.length <= maxTokens) {
      current.push(...unit);
      continue;
    }
    chunks.push(current);
    let overlap = overlapTokens > 0 ? current.slice(-overlapTokens) : [];
    while (overlap.length + unit.length > maxTokens) overlap.shift();
    current = [...overlap, ...unit];
  }
  if (current.length > 0) chunks.push(current);
  return chunks.map((chunk) => chunk.join(" "));
}

// A "token" here is a whitespace-separated word. Real tokenizers differ, but the packing logic is the same.
function words(s) {
  return s.split(/\s+/).filter(Boolean);
}

// ---- Test driver (leave as is) ----
function runChunker(text, maxTokens, overlapTokens) {
  try {
    return chunkText(text, maxTokens, overlapTokens);
  } catch (e) {
    return { threw: true };
  }
}
