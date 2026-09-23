/**
 * @param {{ kind: string, name: string }[]} changes
 * @param {string} runtimeVersion  e.g. "1.4.2"
 * @returns {{ channel: "update" | "build", reasons: string[], runtimeVersion: string }}
 */
function planRelease(changes, runtimeVersion) {
  const OTA_SAFE = ["js", "asset"];
  const list = Array.isArray(changes) ? changes : [];
  const blocking = list.filter((change) => !OTA_SAFE.includes(change.kind));

  if (blocking.length === 0) {
    return { channel: "update", reasons: [], runtimeVersion };
  }

  const reasons = Array.from(new Set(blocking.map((change) => change.name))).sort();
  const parts = String(runtimeVersion).split(".");
  const major = Number(parts[0]);
  const minor = Number(parts[1]);
  const isSdkUpgrade = blocking.some((change) => change.kind === "sdk-upgrade");
  const next = isSdkUpgrade ? `${major + 1}.0.0` : `${major}.${minor + 1}.0`;

  return { channel: "build", reasons, runtimeVersion: next };
}
