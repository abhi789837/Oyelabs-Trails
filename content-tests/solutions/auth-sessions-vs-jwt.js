/**
 * Validate the header and claims of a JWT whose signature has already been checked.
 * @param {{ alg?: unknown, typ?: string }} header decoded JOSE header
 * @param {Record<string, unknown>} payload decoded claims
 * @param {{ now: number, algorithms: string[], issuer: string, audience: string, clockToleranceSec?: number }} options
 * @returns {{ valid: true } | { valid: false, error: string }}
 */
function validateJwtClaims(header, payload, options) {
  const fail = (error) => ({ valid: false, error });
  const isNumericDate = (v) => typeof v === "number" && Number.isFinite(v);
  const tolerance = options.clockToleranceSec ?? 0;

  // 1. The verifier decides the algorithm, never the token. "none" is refused in any casing.
  const alg = header && typeof header === "object" ? header.alg : undefined;
  if (typeof alg !== "string" || alg.toLowerCase() === "none" || !options.algorithms.includes(alg)) {
    return fail("alg_not_allowed");
  }

  // 2. The claims set must be a plain object.
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return fail("malformed");

  // 3. exp is required; exp and nbf must be NumericDates (seconds since the epoch).
  if (payload.exp === undefined) return fail("missing_exp");
  if (!isNumericDate(payload.exp)) return fail("malformed");
  if (payload.nbf !== undefined && !isNumericDate(payload.nbf)) return fail("malformed");

  // 4. Time checks with leeway: valid while nbf - tolerance <= now < exp + tolerance.
  if (options.now >= payload.exp + tolerance) return fail("expired");
  if (payload.nbf !== undefined && options.now + tolerance < payload.nbf) return fail("not_yet_valid");

  // 5. Issuer: exact, case-sensitive match.
  if (payload.iss !== options.issuer) return fail("invalid_issuer");

  // 6. Audience: a string, or an array that contains our audience.
  const aud = payload.aud;
  const audienceOk = typeof aud === "string" ? aud === options.audience : Array.isArray(aud) && aud.includes(options.audience);
  if (!audienceOk) return fail("invalid_audience");

  return { valid: true };
}
