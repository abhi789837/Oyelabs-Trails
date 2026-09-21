/**
 * Normalize a POSIX path the way path.posix.normalize does.
 * @param {string} p
 * @returns {string}
 */
function normalizePath(p) {
  if (p.length === 0) return ".";
  const isAbsolute = p[0] === "/";
  const trailingSlash = p[p.length - 1] === "/";
  const out = [];
  for (const segment of p.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (out.length > 0 && out[out.length - 1] !== "..") out.pop();
      else if (!isAbsolute) out.push("..");
      continue;
    }
    out.push(segment);
  }
  let result = out.join("/");
  if (result === "") {
    if (isAbsolute) return "/";
    return trailingSlash ? "./" : ".";
  }
  if (trailingSlash) result += "/";
  return isAbsolute ? "/" + result : result;
}
