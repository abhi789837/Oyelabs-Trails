/**
 * Runs a tool-calling agent loop against a (mock) model.
 * @param {(messages: object[]) => object} model  returns { stop_reason, content: [...blocks] }
 * @param {{ name: string, input_schema: object, run: (input: object) => any }[]} tools
 * @param {string} userMessage
 * @param {{ maxIterations?: number, maxRepeats?: number }} [options]
 * @returns {{ status: string, answer: string | null, iterations: number }}
 */
function runAgent(model, tools, userMessage, options = {}) {
  const { maxIterations = 10, maxRepeats = 1 } = options;
  const byName = new Map(tools.map((t) => [t.name, t]));
  const messages = [{ role: "user", content: userMessage }];
  const executedKeys = new Set();
  let repeats = 0;
  let iterations = 0;

  while (true) {
    const reply = model(messages);
    iterations += 1;
    messages.push({ role: "assistant", content: reply.content });

    if (reply.stop_reason === "end_turn") {
      const answer = reply.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
      return { status: "done", answer, iterations };
    }
    if (reply.stop_reason === "max_tokens") {
      return { status: "truncated", answer: null, iterations };
    }
    if (reply.stop_reason !== "tool_use") {
      return { status: "unexpected_stop", answer: null, iterations };
    }
    if (iterations >= maxIterations) {
      return { status: "max_iterations", answer: null, iterations };
    }

    const results = [];
    for (const block of reply.content) {
      if (block.type !== "tool_use") continue;
      const error = (text) => results.push({ type: "tool_result", tool_use_id: block.id, content: text, is_error: true });

      const tool = byName.get(block.name);
      if (!tool) {
        error(`Unknown tool: ${block.name}`);
        continue;
      }
      const problem = validateInput(block.input, tool.input_schema);
      if (problem) {
        error(`Invalid input: ${problem}`);
        continue;
      }
      const key = `${block.name}:${stableStringify(block.input)}`;
      if (executedKeys.has(key)) {
        repeats += 1;
        error(`Repeated call: ${block.name} was already called with these arguments`);
        continue;
      }
      executedKeys.add(key);
      try {
        const out = tool.run(block.input);
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: typeof out === "string" ? out : JSON.stringify(out),
        });
      } catch (e) {
        error(`Tool error: ${e.message}`);
      }
    }

    if (repeats > maxRepeats) {
      return { status: "loop_detected", answer: null, iterations };
    }
    messages.push({ role: "user", content: results });
  }
}

function validateInput(input, schema) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return "input must be an object";
  const properties = schema.properties || {};
  for (const field of schema.required || []) {
    if (!(field in input)) return `missing required field "${field}"`;
  }
  for (const [field, spec] of Object.entries(properties)) {
    if (field in input && spec.type && !matchesType(input[field], spec.type)) {
      return `field "${field}" must be ${spec.type}`;
    }
  }
  if (schema.additionalProperties === false) {
    for (const field of Object.keys(input)) {
      if (!(field in properties)) return `unexpected field "${field}"`;
    }
  }
  return null;
}

function matchesType(value, type) {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "integer":
      return Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "object":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    default:
      return true;
  }
}

// Serializes with object keys sorted, so { a: 1, b: 2 } and { b: 2, a: 1 } give the same string.
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

// ---- Test driver (leave as is) ----
// script: the model's replies in order (the last one repeats forever).
// toolSpecs: [{ name, input_schema, behavior: "add" | "lookup" | "echo" | "throw", table?, message? }]
function runAgentScenario(script, toolSpecs, options) {
  const observed = [];
  const executed = [];
  let turn = 0;
  const model = (messages) => {
    observed.push(summarize(messages));
    const reply = script[Math.min(turn, script.length - 1)];
    turn += 1;
    return JSON.parse(JSON.stringify(reply));
  };
  const tools = toolSpecs.map((spec) => ({
    name: spec.name,
    input_schema: spec.input_schema,
    run(input) {
      executed.push(spec.name);
      if (spec.behavior === "add") return input.a + input.b;
      if (spec.behavior === "echo") return input;
      if (spec.behavior === "lookup") {
        if (!(input.key in spec.table)) throw new Error(`no entry for ${input.key}`);
        return spec.table[input.key];
      }
      throw new Error(spec.message || "tool failed");
    },
  }));
  const result = runAgent(model, tools, "Start", options);
  return { result, observed, executed };
}

function summarize(messages) {
  const last = messages[messages.length - 1];
  const prev = messages.length > 1 ? messages[messages.length - 2].role : null;
  if (!last) return { empty: true };
  if (typeof last.content === "string") return { role: last.role, prev, text: last.content };
  return {
    role: last.role,
    prev,
    results: (last.content || [])
      .filter((b) => b.type === "tool_result")
      .map((b) => ({ id: b.tool_use_id, error: b.is_error === true, content: b.content })),
  };
}
