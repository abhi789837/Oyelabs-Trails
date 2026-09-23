/**
 * Estimate the phi-quantile from a classic (cumulative) histogram.
 *
 * @param {number} phi                                   quantile in [0, 1]
 * @param {{ le: number | "+Inf", count: number }[]} buckets  cumulative bucket counts
 * @returns {number | null}
 */
function histogramQuantile(phi, buckets) {
  if (typeof phi !== "number" || Number.isNaN(phi) || phi < 0 || phi > 1) return null;
  if (!Array.isArray(buckets) || buckets.length < 2) return null;

  const finite = buckets.filter((b) => b.le !== "+Inf").sort((a, b) => a.le - b.le);
  const inf = buckets.find((b) => b.le === "+Inf");
  if (!inf || finite.length !== buckets.length - 1) return null;

  const total = inf.count;
  if (!total) return null;

  const rank = phi * total;

  let index = -1;
  for (let i = 0; i < finite.length; i++) {
    if (finite[i].count >= rank) {
      index = i;
      break;
    }
  }
  // The quantile lands in the +Inf bucket: the best we can say is the last finite bound.
  if (index === -1) return finite[finite.length - 1].le;

  const bucket = finite[index];
  const start = index === 0 ? 0 : finite[index - 1].le;
  const prevCount = index === 0 ? 0 : finite[index - 1].count;

  if (index === 0 && bucket.le <= 0) return bucket.le;

  const observations = bucket.count - prevCount;
  if (observations <= 0) return start;

  return start + (bucket.le - start) * ((rank - prevCount) / observations);
}
