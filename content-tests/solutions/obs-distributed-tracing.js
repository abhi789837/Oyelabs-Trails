/**
 * Parse a W3C `traceparent` header and build the one to send downstream.
 *
 * @param {unknown} header  the incoming traceparent header value
 * @param {string} spanId   the 16-hex id of the span this service just started
 * @returns {{ valid: boolean, traceId?: string, parentId?: string, sampled?: boolean, outgoing?: string }}
 */
function propagateTraceparent(header, spanId) {
  const invalid = { valid: false };
  if (typeof header !== "string" || header.length < 55) return invalid;

  const isHex = (s) => /^[0-9a-f]+$/.test(s);
  const allZero = (s) => /^0+$/.test(s);

  if (header[2] !== "-" || header[35] !== "-" || header[52] !== "-") return invalid;

  const version = header.slice(0, 2);
  if (!isHex(version) || version === "ff") return invalid;
  if (version === "00") {
    if (header.length !== 55) return invalid;
  } else if (header[55] !== "-") {
    return invalid;
  }

  const traceId = header.slice(3, 35);
  if (!isHex(traceId) || allZero(traceId)) return invalid;

  const parentId = header.slice(36, 52);
  if (!isHex(parentId) || allZero(parentId)) return invalid;

  const flags = header.slice(53, 55);
  if (!isHex(flags)) return invalid;

  const flagBits = parseInt(flags, 16);
  const sampled = (flagBits & 0x01) === 0x01;
  const outFlags = (flagBits & 0x03).toString(16).padStart(2, "0");

  return {
    valid: true,
    traceId,
    parentId,
    sampled,
    outgoing: `00-${traceId}-${spanId}-${outFlags}`,
  };
}
