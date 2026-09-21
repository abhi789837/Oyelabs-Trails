/**
 * @param {string} pattern  e.g. "/users/:id", "/files/*path", "/docs{/:section}"
 * @param {string} path     the request path, without a query string
 * @returns {null | { params: Record<string, string | string[]> } | { error: string }}
 */
function matchRoute(pattern, path) {
  // 1. Tokenise the pattern into text, params, wildcards and (non-nested) optional groups.
  const tokens = [];
  let current = tokens;
  let group = null;
  for (let i = 0; i < pattern.length; ) {
    const ch = pattern[i];
    if (ch === ":" || ch === "*") {
      const m = /^[A-Za-z_$][\w$]*/.exec(pattern.slice(i + 1));
      if (!m) throw new Error(`Missing parameter name at index ${i + 1}`);
      current.push({ type: ch === ":" ? "param" : "wildcard", name: m[0] });
      i += 1 + m[0].length;
    } else if (ch === "{") {
      if (group) throw new Error(`Unexpected { at index ${i}`);
      group = { type: "group", tokens: [] };
      tokens.push(group);
      current = group.tokens;
      i++;
    } else if (ch === "}") {
      if (!group) throw new Error(`Unexpected } at index ${i}`);
      group = null;
      current = tokens;
      i++;
    } else if ("()[]?+!".includes(ch)) {
      throw new Error(`Unexpected ${ch} at index ${i}`);
    } else {
      current.push({ type: "text", value: ch });
      i++;
    }
  }
  if (group) throw new Error("Unterminated group");

  // 2. Expand optional groups into alternatives, the version "with the group" first.
  let alternatives = [[]];
  for (const token of tokens) {
    alternatives =
      token.type === "group"
        ? alternatives.flatMap((alt) => [[...alt, ...token.tokens], alt])
        : alternatives.map((alt) => [...alt, token]);
  }

  // 3. Compile and try each alternative in order.
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
  for (const alt of alternatives) {
    const keys = [];
    let source = "";
    for (const t of alt) {
      if (t.type === "text") source += escape(t.value);
      else {
        keys.push(t);
        source += t.type === "param" ? "([^/]+)" : "([\\s\\S]+)";
      }
    }
    const m = new RegExp(`^${source}(?:/)?$`, "i").exec(path);
    if (!m) continue;
    const params = {};
    for (let k = 0; k < keys.length; k++) {
      const raw = m[k + 1];
      const parts = keys[k].type === "wildcard" ? raw.split("/") : [raw];
      const decoded = [];
      for (const part of parts) {
        try {
          decoded.push(decodeURIComponent(part));
        } catch {
          return { error: `Failed to decode param '${part}'` };
        }
      }
      params[keys[k].name] = keys[k].type === "wildcard" ? decoded : decoded[0];
    }
    return { params };
  }
  return null;
}

// ---- Test driver (leave as is) ----
function testRoute(pattern, paths) {
  try {
    return paths.map((p) => matchRoute(pattern, p));
  } catch (e) {
    return "invalid pattern";
  }
}
