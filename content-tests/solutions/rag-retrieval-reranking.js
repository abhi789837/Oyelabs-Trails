/**
 * Reciprocal Rank Fusion of several ranked result lists.
 * @param {string[][]} rankedLists  each list holds document ids, best first
 * @param {{ k?: number, weights?: number[], topN?: number }} [options]
 * @returns {{ id: string, score: number }[]}
 */
function reciprocalRankFusion(rankedLists, options = {}) {
  const { k = 60, weights, topN } = options;
  const scores = new Map();

  rankedLists.forEach((list, listIndex) => {
    const weight = weights ? weights[listIndex] : 1;
    const seen = new Set();
    let rank = 0;
    for (const id of list) {
      rank += 1; // ranks are positions in the list, 1-based, duplicates included
      if (seen.has(id)) continue; // only the best occurrence of an id counts
      seen.add(id);
      scores.set(id, (scores.get(id) || 0) + weight / (k + rank));
    }
  });

  const fused = [...scores].map(([id, score]) => ({ id, score: Math.round(score * 1e6) / 1e6 }));
  fused.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return topN === undefined ? fused : fused.slice(0, topN);
}
