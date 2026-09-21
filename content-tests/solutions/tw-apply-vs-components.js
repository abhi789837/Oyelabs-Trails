/**
 * A small tailwind-merge: resolve conflicting utility classes so the last one per group and context wins.
 * @param {string} classList
 * @returns {string}
 */
function mergeClasses(classList) {
  const tokens = classList.split(/\s+/).filter(Boolean);
  const claimed = new Set();
  const kept = [];

  // Walk right to left: the first class we meet in a group/context is the winner.
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    const parts = splitVariants(token);
    let base = parts.pop();
    let important = false;
    if (base.endsWith("!")) {
      important = true;
      base = base.slice(0, -1);
    }
    const group = groupOf(base);
    if (!group) {
      kept.push(token); // not a known utility: always kept
      continue;
    }
    const context = parts.slice().sort().join(":") + (important ? "!" : "") + "|";
    if (claimed.has(context + group)) continue;
    kept.push(token);
    claimed.add(context + group);
    for (const g of CONFLICTS[group] ?? []) claimed.add(context + g);
  }
  return kept.reverse().join(" ");
}

const DISPLAY = new Set(["block", "inline-block", "inline", "flex", "inline-flex", "grid", "inline-grid", "contents", "hidden"]);

// A class in the key group overrides earlier classes in these groups (same context).
const CONFLICTS = {
  p: ["px", "py", "pt", "pr", "pb", "pl"],
  px: ["pr", "pl"],
  py: ["pt", "pb"],
  m: ["mx", "my", "mt", "mr", "mb", "ml"],
  mx: ["mr", "ml"],
  my: ["mt", "mb"],
  size: ["w", "h"],
  "font-size": ["leading"],
};

// Split on ":" that isn't inside square brackets, e.g. "[&:hover]:bg-[color:red]".
function splitVariants(token) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < token.length; i++) {
    const c = token[i];
    if (c === "[") depth++;
    else if (c === "]") depth = Math.max(0, depth - 1);
    else if (c === ":" && depth === 0) {
      parts.push(token.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(token.slice(start));
  return parts;
}

function groupOf(base) {
  if (DISPLAY.has(base)) return "display";
  let m = /^p([xytrbl]?)-.+$/.exec(base);
  if (m) return "p" + m[1];
  m = /^-?m([xytrbl]?)-.+$/.exec(base);
  if (m) return "m" + m[1];
  if (/^size-.+$/.test(base)) return "size";
  if (/^w-.+$/.test(base)) return "w";
  if (/^h-.+$/.test(base)) return "h";
  if (/^leading-.+$/.test(base)) return "leading";
  if (/^bg-.+$/.test(base)) return "bg";
  if (/^text-(left|center|right|justify|start|end)$/.test(base)) return "text-align";
  if (/^text-(xs|sm|base|lg|xl|[2-9]xl)(\/.+)?$/.test(base)) return "font-size";
  if (/^text-\[\d[^\]]*\](\/.+)?$/.test(base)) return "font-size";
  if (/^text-.+$/.test(base)) return "text-color";
  return null;
}
