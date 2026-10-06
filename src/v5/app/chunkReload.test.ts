import { describe, expect, it } from "vitest";

import { GUARD_MS, RELOAD_KEY, claimChunkReload, isChunkLoadError, type ReloadStore } from "./chunkReload";

function memory(): ReloadStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe("stale chunk reload", () => {
  it("recognises the browsers' failed lazy-import messages", () => {
    expect(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: https://x/assets/a.js"))).toBe(true);
    expect(isChunkLoadError(new TypeError("error loading dynamically imported module"))).toBe(true);
    expect(isChunkLoadError(new TypeError("Importing a module script failed."))).toBe(true);
    expect(isChunkLoadError(new Error("Unable to preload CSS for /assets/x.css"))).toBe(true);
    expect(isChunkLoadError({ name: "ChunkLoadError", message: "x" })).toBe(true);
    expect(isChunkLoadError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });

  it("reloads once, then not again inside the guard window", () => {
    const store = memory();
    expect(claimChunkReload(store, 1_000_000, true)).toBe(true);
    expect(store.data.get(RELOAD_KEY)).toBe("1000000");
    expect(claimChunkReload(store, 1_000_000 + GUARD_MS - 1, true)).toBe(false);
    expect(claimChunkReload(store, 1_000_000 + GUARD_MS + 1, true)).toBe(true);
  });

  it("never reloads offline or without storage", () => {
    expect(claimChunkReload(memory(), 5, false)).toBe(false);
    expect(claimChunkReload(null, 5, true)).toBe(false);
    const throwing: ReloadStore = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => undefined,
    };
    expect(claimChunkReload(throwing, 5, true)).toBe(false);
  });
});
