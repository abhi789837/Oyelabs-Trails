/**
 * @param {object} usage  Anthropic-style usage object from a Messages API response
 * @param {object} rates  { inputPerMTok, outputPerMTok, cacheWrite5m, cacheWrite1h, cacheRead, batchDiscount }
 * @param {{ batch?: boolean, contextWindow?: number }} [options]
 */
function estimateCost(usage, rates, options = {}) {
  const count = (value, field) => {
    const n = value === undefined ? 0 : value;
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0) {
      throw new Error(`${field} must be a non-negative integer`);
    }
    return n;
  };

  const input = count(usage.input_tokens, "input_tokens");
  const output = count(usage.output_tokens, "output_tokens");
  const cacheWrite = count(usage.cache_creation_input_tokens, "cache_creation_input_tokens");
  const cacheRead = count(usage.cache_read_input_tokens, "cache_read_input_tokens");

  let write5m = cacheWrite;
  let write1h = 0;
  if (usage.cache_creation) {
    write5m = count(usage.cache_creation.ephemeral_5m_input_tokens, "ephemeral_5m_input_tokens");
    write1h = count(usage.cache_creation.ephemeral_1h_input_tokens, "ephemeral_1h_input_tokens");
    if (write5m + write1h !== cacheWrite) {
      throw new Error("cache_creation breakdown doesn't add up to cache_creation_input_tokens");
    }
  }

  const perToken = rates.inputPerMTok / 1e6;
  const factor = options.batch ? 1 - rates.batchDiscount : 1;

  const inputCost = input * perToken * factor;
  const cacheWriteCost = (write5m * rates.cacheWrite5m + write1h * rates.cacheWrite1h) * perToken * factor;
  const cacheReadCost = cacheRead * rates.cacheRead * perToken * factor;
  const outputCost = output * (rates.outputPerMTok / 1e6) * factor;

  const round = (x) => Math.round(x * 1e6) / 1e6;
  const totalInputTokens = input + cacheWrite + cacheRead;
  const contextTokens = totalInputTokens + output;

  return {
    inputCost: round(inputCost),
    cacheWriteCost: round(cacheWriteCost),
    cacheReadCost: round(cacheReadCost),
    outputCost: round(outputCost),
    totalCost: round(inputCost + cacheWriteCost + cacheReadCost + outputCost),
    totalInputTokens,
    contextTokens,
    withinContextWindow: options.contextWindow === undefined ? null : contextTokens <= options.contextWindow,
  };
}

// ---- Test driver (leave as is) ----
function runCostScenario(usage, rates, options) {
  try {
    return estimateCost(usage, rates, options);
  } catch (e) {
    return { threw: true };
  }
}
