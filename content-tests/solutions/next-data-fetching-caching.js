// Preset cacheLife profiles (seconds), as documented for Next.js 16.
// `stale` drives the client router cache and is ignored by this server-side simulator.
const PRESET_PROFILES = {
  default: { stale: 300, revalidate: 900, expire: Infinity },
  seconds: { stale: 30, revalidate: 1, expire: 60 },
  minutes: { stale: 300, revalidate: 60, expire: 3600 },
  hours: { stale: 300, revalidate: 3600, expire: 86400 },
  days: { stale: 300, revalidate: 86400, expire: 604800 },
  weeks: { stale: 300, revalidate: 604800, expire: 2592000 },
  max: { stale: 300, revalidate: 2592000, expire: 31536000 },
};

/**
 * @param {() => number} now  current fake time in seconds
 * @param {Record<string, object>} customProfiles  like `cacheLife` in next.config: adds or overrides profiles
 */
function createCache(now, customProfiles) {
  const entries = new Map();
  const defaultProfile = { ...PRESET_PROFILES.default, ...(customProfiles.default || {}) };

  function resolveProfile(profile) {
    if (profile === undefined) return defaultProfile;
    if (typeof profile === "object" && profile !== null) return { ...defaultProfile, ...profile };
    if (profile === "default") return defaultProfile;
    if (Object.prototype.hasOwnProperty.call(customProfiles, profile)) {
      return { ...defaultProfile, ...customProfiles[profile] };
    }
    if (Object.prototype.hasOwnProperty.call(PRESET_PROFILES, profile)) return PRESET_PROFILES[profile];
    throw new Error(`Unknown cacheLife profile "${profile}"`);
  }

  function store(key, fetcher, options) {
    const life = resolveProfile(options.profile);
    const entry = {
      value: fetcher(),
      storedAt: now(),
      revalidate: life.revalidate,
      expire: life.expire,
      tags: options.tags || [],
      markedStale: false,
      expireAt: null,
    };
    entries.set(key, entry);
    return entry;
  }

  function markTag(tag, windowSeconds) {
    for (const entry of entries.values()) {
      if (!entry.tags.includes(tag)) continue;
      entry.markedStale = true;
      const deadline = now() + windowSeconds;
      entry.expireAt = entry.expireAt === null ? deadline : Math.min(entry.expireAt, deadline);
    }
  }

  return {
    read(key, fetcher, options) {
      const entry = entries.get(key);
      if (!entry) return { value: store(key, fetcher, options).value, status: "MISS" };
      const age = now() - entry.storedAt;
      const expired = age >= entry.expire || (entry.expireAt !== null && now() >= entry.expireAt);
      if (expired) return { value: store(key, fetcher, options).value, status: "MISS" };
      if (age >= entry.revalidate || entry.markedStale) {
        const staleValue = entry.value;
        store(key, fetcher, options); // background regeneration
        return { value: staleValue, status: "STALE" };
      }
      return { value: entry.value, status: "HIT" };
    },
    revalidateTag(tag, profile) {
      let windowSeconds;
      if (profile === undefined) windowSeconds = 0;
      else if (typeof profile === "object" && profile !== null) windowSeconds = profile.expire;
      else windowSeconds = resolveProfile(profile).expire;
      markTag(tag, windowSeconds);
    },
    updateTag(tag, context) {
      if (context !== "action") throw new Error("updateTag can only be called from within a Server Action");
      markTag(tag, 0);
    },
  };
}

// ---- Test driver (leave as is) ----
// config: { keys: { [key]: { profile?, tags? } }, profiles?: {...}, summaryOnly?: boolean }
// events (sorted by `at`, in seconds):
//   { at, write: key, value }                  update the data source
//   { at, read: key }                          read through the cache
//   { at, revalidateTag: tag, profile? }       profile omitted = deprecated one-argument form
//   { at, updateTag: tag, from: "action" | "route" }
function runCacheScenario(config, events) {
  let clock = 0;
  const source = {};
  const log = [];
  const counts = { HIT: 0, STALE: 0, MISS: 0 };
  let fetches = 0;
  const cache = createCache(() => clock, config.profiles || {});
  for (const event of events) {
    clock = event.at;
    try {
      if ("write" in event) {
        source[event.write] = event.value;
      } else if ("read" in event) {
        const key = event.read;
        const options = (config.keys || {})[key] || {};
        const fetcher = () => {
          fetches++;
          return key in source ? source[key] : null;
        };
        const res = cache.read(key, fetcher, { profile: options.profile, tags: options.tags || [] });
        if (!res || typeof res !== "object") throw new Error("read() must return { value, status }");
        counts[res.status] = (counts[res.status] || 0) + 1;
        log.push({ at: clock, key, value: res.value, status: res.status });
      } else if ("revalidateTag" in event) {
        if ("profile" in event) cache.revalidateTag(event.revalidateTag, event.profile);
        else cache.revalidateTag(event.revalidateTag);
      } else if ("updateTag" in event) {
        cache.updateTag(event.updateTag, event.from);
      }
    } catch (e) {
      log.push({ at: clock, error: String((e && e.message) || e) });
    }
  }
  return config.summaryOnly ? { counts, fetches } : { log, fetches };
}
