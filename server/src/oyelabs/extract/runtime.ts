/**
 * Loads an extraction library at run time instead of bundling it.
 *
 * `scripts/build-server.mjs` bundles the server with esbuild. Several extraction libraries cannot
 * be bundled: `@napi-rs/canvas` is a native addon, `tesseract.js` starts worker scripts by path,
 * and `unpdf` / `officeparser` / `mammoth` are large and only needed when a module is (re)read.
 * A specifier esbuild cannot see statically stays a plain `import()` in the bundle, and Node
 * resolves it from `node_modules` (copied into the runtime image) the first time a doc is read.
 *
 * CommonJS packages (mammoth, exceljs) come back as `{ default: … }`; `pick` unwraps that.
 */
export async function runtimeImport<T>(specifier: string): Promise<T> {
  const name = specifier;
  const mod = (await import(/* @vite-ignore */ name)) as T & { default?: unknown };
  return mod;
}

/** The CommonJS default export when there is one, else the namespace itself. */
export function pick<T>(mod: unknown): T {
  const m = mod as { default?: unknown };
  return (m && typeof m === "object" && "default" in m && m.default ? m.default : mod) as T;
}
