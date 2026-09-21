/**
 * Predict which Dockerfile steps BuildKit reuses from its cache when you rebuild.
 * @param {string[]} dockerfile one instruction per element, e.g. "COPY . ."
 * @param {{ files?: string[], dockerignore?: string[], args?: string[], images?: string[], target?: string }} changes
 * @returns {string[]} "cached", "rebuilt" or "skipped" for each line
 */
function simulateBuild(dockerfile, changes) {
  const files = changes.files ?? [];
  const ignore = changes.dockerignore ?? [];
  const changedArgs = new Set(changes.args ?? []);
  const changedImages = new Set(changes.images ?? []);

  const globToRegex = (pattern) => {
    let re = "";
    for (let i = 0; i < pattern.length; i++) {
      const c = pattern[i];
      if (c === "*" && pattern[i + 1] === "*") {
        if (pattern[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 2;
        } else {
          re += ".*";
          i += 1;
        }
      } else if (c === "*") re += "[^/]*";
      else if (c === "?") re += "[^/]";
      else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
    return new RegExp("^" + re + "$");
  };
  const clean = (p) => p.replace(/^\.\//, "").replace(/^\/+|\/+$/g, "");
  // A pattern matches a path if it matches the path itself or one of its parent directories.
  const matchesPathOrParent = (pattern, path) => {
    const re = globToRegex(pattern);
    const parts = path.split("/");
    for (let i = parts.length; i >= 1; i--) if (re.test(parts.slice(0, i).join("/"))) return true;
    return false;
  };
  const isIgnored = (file) => {
    let excluded = false;
    for (const raw of ignore) {
      let line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const negated = line.startsWith("!");
      if (negated) line = line.slice(1).trim();
      line = clean(line);
      if (!line || line === ".") continue;
      if (matchesPathOrParent(line, file)) excluded = !negated;
    }
    return excluded;
  };
  const sentFiles = files.filter((f) => !isIgnored(f));
  const sourceMatches = (src) => {
    const s = clean(src);
    if (s === "" || s === ".") return sentFiles.length > 0;
    return sentFiles.some((f) => matchesPathOrParent(s, f));
  };
  const references = (text, names) =>
    [...names].some((n) => changedArgs.has(n) && new RegExp("\\$(\\{" + n + "\\}|" + n + "(?![A-Za-z0-9_]))").test(text));

  // Parse into global lines and stages.
  const globalArgs = new Set();
  const stages = [];
  const lineInfo = dockerfile.map((line) => {
    const trimmed = line.trim();
    const [kw = "", ...rest] = trimmed.split(/\s+/);
    return { keyword: kw.toUpperCase(), tokens: rest, text: trimmed.slice(kw.length).trim() };
  });
  lineInfo.forEach((info, i) => {
    if (info.keyword === "FROM") {
      const asIdx = info.tokens.findIndex((t) => t.toUpperCase() === "AS");
      const name = asIdx >= 0 ? info.tokens[asIdx + 1] : undefined;
      stages.push({ index: stages.length, name, image: info.tokens[0], lines: [i], deps: new Set() });
      info.stage = stages.length - 1;
    } else if (stages.length === 0) {
      if (info.keyword === "ARG") globalArgs.add(info.tokens[0].split("=")[0]);
      info.stage = -1;
    } else {
      stages[stages.length - 1].lines.push(i);
      info.stage = stages.length - 1;
    }
  });
  const stageRef = (ref, before) => {
    const byName = stages.findIndex((s, idx) => idx < before && s.name === ref);
    if (byName >= 0) return byName;
    if (/^\d+$/.test(ref) && Number(ref) < before) return Number(ref);
    return -1;
  };
  for (const st of stages) {
    const parent = stageRef(st.image, st.index);
    if (parent >= 0) st.deps.add(parent);
    for (const li of st.lines) {
      const info = lineInfo[li];
      if (info.keyword === "COPY" || info.keyword === "ADD") {
        const from = info.tokens.find((t) => t.startsWith("--from="));
        if (from) {
          const idx = stageRef(from.slice(7), st.index);
          if (idx >= 0) st.deps.add(idx);
        }
      }
    }
  }
  // Which stages does the target need?
  let target = stages.length - 1;
  if (changes.target !== undefined) target = stages.findIndex((s) => s.name === changes.target);
  const needed = new Set();
  const visit = (i) => {
    if (needed.has(i)) return;
    needed.add(i);
    stages[i].deps.forEach(visit);
  };
  if (target >= 0) visit(target);

  const result = dockerfile.map(() => "cached");
  const changedStage = new Set();
  for (const st of stages) {
    if (!needed.has(st.index)) {
      st.lines.forEach((li) => (result[li] = "skipped"));
      continue;
    }
    let cascade = false;
    const declared = new Set();
    for (const li of st.lines) {
      const info = lineInfo[li];
      let rebuilt = cascade;
      if (!rebuilt) {
        if (info.keyword === "FROM") {
          const parent = stageRef(st.image, st.index);
          rebuilt = parent >= 0 ? changedStage.has(parent) : changedImages.has(st.image) || references(st.image, globalArgs);
        } else if (info.keyword === "ARG") {
          rebuilt = false;
        } else if (info.keyword === "COPY" || info.keyword === "ADD") {
          const from = info.tokens.find((t) => t.startsWith("--from="));
          const paths = info.tokens.filter((t) => !t.startsWith("--"));
          if (from) {
            const ref = from.slice(7);
            const idx = stageRef(ref, st.index);
            rebuilt = idx >= 0 ? changedStage.has(idx) : changedImages.has(ref);
          } else {
            rebuilt = paths.slice(0, -1).some(sourceMatches);
          }
          rebuilt = rebuilt || references(info.text, declared);
        } else if (info.keyword === "RUN") {
          rebuilt = [...declared].some((n) => changedArgs.has(n));
        } else {
          rebuilt = references(info.text, declared);
        }
      }
      if (info.keyword === "ARG") declared.add(info.tokens[0].split("=")[0]);
      if (rebuilt) {
        cascade = true;
        changedStage.add(st.index);
        result[li] = "rebuilt";
      }
    }
  }
  return result;
}
