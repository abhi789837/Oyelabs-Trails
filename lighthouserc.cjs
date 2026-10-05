/**
 * Lighthouse CI budgets for v5 (docs/v5/PLAN.md). Assertions only; axe runs separately in the
 * Playwright scripts. Run it with `npm run lhci` against a running server (see
 * scripts/perf/lhci.mjs for how the session cookie and URLs are supplied).
 */
const base = process.env.LHCI_BASE_URL || "http://127.0.0.1:8787";
const paths = (process.env.LHCI_PATHS || "/learn?ui=v5,/learn/plan?ui=v5,/learn/library?ui=v5,/design?ui=v5").split(",");

module.exports = {
  ci: {
    collect: {
      url: paths.map((p) => `${base}${p.trim()}`),
      numberOfRuns: Number(process.env.LHCI_RUNS || 3),
      settings: {
        preset: "desktop",
        // The session cookie is added by scripts/perf/lhci.mjs as an extra header.
        extraHeaders: process.env.LHCI_EXTRA_HEADERS ? JSON.parse(process.env.LHCI_EXTRA_HEADERS) : undefined,
        skipAudits: ["uses-http2"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: process.env.LHCI_OUT || ".lighthouseci/reports",
    },
  },
};
