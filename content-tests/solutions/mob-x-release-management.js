/**
 * @param {string} flagKey
 * @param {string} userId
 * @returns {number} a stable bucket in [0, 99]
 */
function bucketOf(flagKey, userId) {
  return fnv1a(flagKey + ":" + userId) % 100;
}

/**
 * @param {string} flagKey
 * @param {string} userId
 * @param {number} percent
 * @returns {boolean}
 */
function isEnabled(flagKey, userId, percent) {
  if (percent <= 0) return false;
  if (percent >= 100) return true;
  return bucketOf(flagKey, userId) < percent;
}

// ---- Test driver (leave as is) ----
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function runRollout(flagKey, userIds, percents) {
  const counts = [];
  const sample = [];
  for (const percent of percents) {
    counts.push(userIds.filter((id) => Boolean(isEnabled(flagKey, id, percent))).length);
    sample.push(userIds.slice(0, 5).filter((id) => Boolean(isEnabled(flagKey, id, percent))));
  }
  return { counts, sample };
}
