/**
 * Resolve a route's metadata the way the App Router does.
 * @param {Array<object|null>} layouts  metadata exported by each segment's layout, root first;
 *   the last entry is the layout in the page's own segment (null when a segment exports none)
 * @param {object|null} page  metadata exported by the page
 * @returns {object}
 */
function resolveMetadata(layouts, page) {
  const items = [...layouts, page];
  const result = { title: null };
  let current = null; // { absolute, template } of the last title seen
  let stash = null; // template available to the next item

  items.forEach((metadata, i) => {
    if (metadata) {
      for (const key of Object.keys(metadata)) {
        if (key === "title") {
          current = resolveTitle(metadata.title, stash);
          result.title = current.absolute;
        } else {
          result[key] = metadata[key];
        }
      }
    }
    // The page's own segment (its layout) and the page itself don't pass templates on.
    if (i < items.length - 2) stash = current ? current.template : null;
  });

  if (result.openGraph && typeof result.openGraph === "object") {
    const og = { ...result.openGraph };
    if (!og.title && result.title) og.title = result.title;
    if (!og.description && result.description) og.description = result.description;
    result.openGraph = og;
  }
  return result;
}

function applyTemplate(template, title) {
  return template ? template.split("%s").join(title) : title;
}

function resolveTitle(title, stash) {
  if (typeof title === "string") return { absolute: applyTemplate(stash, title), template: null };
  if (!title || typeof title !== "object") return { absolute: "", template: null };
  let resolved = "";
  if ("default" in title) resolved = applyTemplate(stash, title.default);
  if (title.absolute) resolved = title.absolute;
  return { absolute: resolved, template: "template" in title ? title.template : null };
}

// ---- Test driver (leave as is) ----
// Snapshots the inputs, calls your resolver and reports an error if anything was mutated.
function resolveRouteMetadata(layouts, page) {
  const before = JSON.stringify([layouts, page]);
  const result = resolveMetadata(layouts, page);
  if (JSON.stringify([layouts, page]) !== before) return { error: "input metadata was mutated" };
  return result;
}
