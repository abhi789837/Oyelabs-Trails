/**
 * Installs the code runner's languages on first boot, in the background (v4).
 *
 * So a deploy is one command: the app asks Piston which runtimes it has and installs whatever is
 * missing (about 3 GB the first time; the `piston-packages` volume keeps them after that). Until a
 * language is installed, its questions report "not installed" and every other language works.
 * Runs inside Piston never have network access either way — Piston disables it per run.
 */
export const PISTON_PACKAGES: { language: string; version: string }[] = [
  { language: "python", version: "3.12.0" },
  { language: "php", version: "8.2.3" },
  { language: "sqlite3", version: "3.36.0" },
  { language: "java", version: "15.0.2" },
  { language: "dart", version: "3.0.1" },
  { language: "typescript", version: "5.0.3" },
  { language: "node", version: "20.11.1" },
];

export async function ensurePistonPackages(url: string, log: (message: string) => void): Promise<void> {
  // Piston may still be starting; give it a minute.
  let installed: { language: string; version: string; runtime?: string }[] | null = null;
  for (let attempt = 0; attempt < 30 && !installed; attempt += 1) {
    installed = await fetch(`${url}/api/v2/runtimes`, { signal: AbortSignal.timeout(5000) })
      .then((r) => (r.ok ? (r.json() as Promise<{ language: string; version: string; runtime?: string }[]>) : null))
      .catch(() => null);
    if (!installed) await new Promise((r) => setTimeout(r, 2000));
  }
  if (!installed) {
    log("code runner: Piston did not answer; languages other than JavaScript/TypeScript are unavailable");
    return;
  }
  const has = (p: { language: string; version: string }) =>
    installed!.some((r) => (r.language === p.language || r.runtime === p.language) && r.version === p.version);
  const missing = PISTON_PACKAGES.filter((p) => !has(p));
  if (missing.length === 0) return;
  log(`code runner: installing ${missing.map((p) => p.language).join(", ")} (first boot only, a few minutes)`);
  for (const pkg of missing) {
    const res = await fetch(`${url}/api/v2/packages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(pkg),
      signal: AbortSignal.timeout(15 * 60_000),
    }).catch((error: unknown) => ({ ok: false, status: 0, text: async () => String(error) }));
    const text = await res.text();
    log(`code runner: ${pkg.language} ${pkg.version} ${res.ok || /already installed/i.test(text) ? "installed" : `failed (${res.status}): ${text.slice(0, 160)}`}`);
  }
}
