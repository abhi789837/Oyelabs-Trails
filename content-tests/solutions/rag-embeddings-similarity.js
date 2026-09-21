/**
 * Brute-force (exact) vector search with metadata pre-filtering.
 * @param {number[]} query
 * @param {{ id: string, vector: number[], metadata?: object }[]} documents
 * @param {number} k
 * @param {object} [filter]
 * @returns {{ id: string, score: number }[]}
 */
function searchTopK(query, documents, k, filter = {}) {
  if (!Array.isArray(query) || query.length === 0 || !(k > 0)) return [];
  const queryNorm = norm(query);
  if (queryNorm === 0) return [];

  const results = [];
  for (const doc of documents) {
    if (!matchesFilter(doc.metadata || {}, filter)) continue;
    if (!Array.isArray(doc.vector) || doc.vector.length !== query.length) continue;
    const docNorm = norm(doc.vector);
    if (docNorm === 0) continue;
    let dot = 0;
    for (let i = 0; i < query.length; i++) dot += query[i] * doc.vector[i];
    const score = Math.round((dot / (queryNorm * docNorm)) * 1e4) / 1e4;
    results.push({ id: doc.id, score });
  }

  results.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return results.slice(0, k);
}

function norm(v) {
  let sum = 0;
  for (const x of v) sum += x * x;
  return Math.sqrt(sum);
}

function matchesFilter(metadata, filter) {
  return Object.entries(filter).every(([key, condition]) => {
    const value = metadata[key];
    if (Array.isArray(condition)) return condition.includes(value);
    if (condition !== null && typeof condition === "object") {
      if (typeof value !== "number") return false;
      if (condition.gte !== undefined && value < condition.gte) return false;
      if (condition.lte !== undefined && value > condition.lte) return false;
      return true;
    }
    return value === condition;
  });
}
