/**
 * @param {number[]} heights          Height of each row, in render order.
 * @param {number} separatorHeight     Height of the separator drawn between rows.
 * @returns {(data: unknown, index: number) => { length: number, offset: number, index: number }}
 */
function createGetItemLayout(heights, separatorHeight) {
  const rows = Array.isArray(heights) ? heights : [];
  const separator = Number(separatorHeight) || 0;
  const offsets = new Array(rows.length);
  let running = 0;
  for (let i = 0; i < rows.length; i++) {
    offsets[i] = running + separator * i;
    running += rows[i];
  }
  return function getItemLayout(data, index) {
    if (!Number.isInteger(index) || index < 0 || index >= rows.length) {
      return { length: 0, offset: 0, index };
    }
    return { length: rows[index], offset: offsets[index], index };
  };
}

// ---- Test driver (leave as is) ----
function runGetItemLayout(heights, separatorHeight, indices) {
  const getItemLayout = createGetItemLayout(heights, separatorHeight);
  const data = heights.map((height, id) => ({ id, height }));
  return indices.map((index) => getItemLayout(data, index));
}
