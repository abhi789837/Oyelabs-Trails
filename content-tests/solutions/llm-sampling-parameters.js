/**
 * Turns raw logits into the probability distribution a sampler would draw the next token from.
 * @param {number[]} logits  raw scores, one per token id (index = token id)
 * @param {{ temperature?: number, topK?: number, topP?: number }} params
 * @returns {number[]} probabilities, same length as logits, rounded to 4 decimals
 */
function applySampling(logits, params = {}) {
  const n = logits.length;
  if (n === 0) return [];
  const { temperature = 1, topK = 0, topP = 1 } = params;
  const round = (p) => Math.round(p * 1e4) / 1e4;

  // Greedy decoding: all the mass on the argmax (lowest index wins a tie).
  if (temperature === 0) {
    let best = 0;
    for (let i = 1; i < n; i++) if (logits[i] > logits[best]) best = i;
    return logits.map((_, i) => (i === best ? 1 : 0));
  }

  // 1. Temperature scaling + numerically stable softmax.
  const scaled = logits.map((l) => l / temperature);
  const max = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - max));
  let probs = normalize(exps);

  // Token ids ordered by probability, highest first; ties go to the lower id.
  const order = () =>
    probs
      .map((p, i) => i)
      .filter((i) => probs[i] > 0)
      .sort((a, b) => probs[b] - probs[a] || a - b);

  // 2. Top-k: keep the k most likely tokens, then renormalize.
  if (Number.isInteger(topK) && topK > 0 && topK < n) {
    const keep = new Set(order().slice(0, topK));
    probs = normalize(probs.map((p, i) => (keep.has(i) ? p : 0)));
  }

  // 3. Top-p (nucleus): smallest prefix whose cumulative probability reaches topP.
  if (topP < 1) {
    const keep = new Set();
    let cumulative = 0;
    for (const i of order()) {
      keep.add(i);
      cumulative += probs[i];
      if (cumulative >= topP) break;
    }
    probs = normalize(probs.map((p, i) => (keep.has(i) ? p : 0)));
  }

  return probs.map(round);
}

function normalize(values) {
  const sum = values.reduce((a, b) => a + b, 0);
  return values.map((v) => v / sum);
}
