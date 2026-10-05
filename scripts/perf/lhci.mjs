/**
 * `npm run lhci`: Lighthouse CI against a server that is already running.
 *
 *   npm run build && npm start              # or any running Oyelearn (dev: npm run dev, port 5173)
 *   LHCI_BASE_URL=http://127.0.0.1:8787 \
 *   LHCI_USERNAME=admin LHCI_PASSWORD=... npm run lhci
 *
 * The v5 routes need a session, so this signs in through POST /api/auth/login, takes the session
 * cookie and hands it to Lighthouse as an extra header. A **staff** account is needed for `?ui=v5`
 * (the override is staff-only) and for /design. The account must not be waiting on a password
 * change. Optional: LHCI_PATHS (comma list, default /learn, /learn/plan, /learn/library, /design),
 * LHCI_RUNS (default 3). Reports go to .lighthouseci/reports. Exits non-zero when a budget fails.
 */
import { spawnSync } from "node:child_process";

const base = process.env.LHCI_BASE_URL || "http://127.0.0.1:8787";
const username = process.env.LHCI_USERNAME;
const password = process.env.LHCI_PASSWORD;

async function main() {
  const health = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(10_000) }).catch(() => null);
  if (!health?.ok) {
    console.error(`No server answering at ${base}/api/health. Start one first (npm start), or set LHCI_BASE_URL.`);
    process.exit(2);
  }
  let headers;
  if (username && password) {
    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error(`Sign-in failed (${res.status}). Check LHCI_USERNAME / LHCI_PASSWORD.`);
      process.exit(2);
    }
    const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    headers = JSON.stringify({ Cookie: cookie });
  } else {
    console.warn("LHCI_USERNAME / LHCI_PASSWORD not set: signed-in routes will measure the login redirect.");
  }
  const result = spawnSync("npx", ["--no-install", "lhci", "autorun", "--config=./lighthouserc.cjs"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, LHCI_BASE_URL: base, ...(headers ? { LHCI_EXTRA_HEADERS: headers } : {}) },
  });
  process.exit(result.status ?? 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
