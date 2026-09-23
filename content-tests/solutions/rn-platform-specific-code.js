/**
 * @param {"ios"|"android"|"web"|"macos"|"windows"} os
 * @param {Record<string, unknown>} spec
 * @returns {unknown} the selected value, or undefined when nothing matches
 */
function platformSelect(os, spec) {
  if (spec === null || typeof spec !== "object") return undefined;
  const has = (key) => Object.prototype.hasOwnProperty.call(spec, key);
  if (has(os)) return spec[os];
  if (os !== "web" && has("native")) return spec.native;
  if (has("default")) return spec.default;
  return undefined;
}
