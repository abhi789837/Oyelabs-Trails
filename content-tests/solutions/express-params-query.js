/**
 * Express 5's default "simple" query parser (Node's querystring.parse).
 * @param {string} queryString  the part of the URL after "?", without the "?"
 * @param {{ maxKeys?: number }} [options]
 * @returns {Record<string, string | string[]>}
 */
function parseQuery(queryString, options = {}) {
  const maxKeys = options.maxKeys ?? 1000;
  const result = Object.create(null); // no inherited keys like "toString" or "__proto__"
  if (typeof queryString !== "string" || queryString === "") return result;

  let pieces = queryString.split("&");
  if (maxKeys > 0) pieces = pieces.slice(0, maxKeys);

  const decode = (text) => {
    const spaced = text.replace(/\+/g, " ");
    try {
      return decodeURIComponent(spaced);
    } catch {
      return spaced; // malformed escape: keep the raw text
    }
  };

  for (const piece of pieces) {
    if (piece === "") continue;
    const eq = piece.indexOf("=");
    const key = decode(eq === -1 ? piece : piece.slice(0, eq));
    const value = eq === -1 ? "" : decode(piece.slice(eq + 1));
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const existing = result[key];
      if (Array.isArray(existing)) existing.push(value);
      else result[key] = [existing, value];
    } else {
      result[key] = value;
    }
  }
  return result;
}
