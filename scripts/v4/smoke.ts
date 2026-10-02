/**
 * Post-deploy smoke test over HTTP (Phase 10). Exercises the v4 path that matters on a fresh box:
 * the catalog and bank are seeded, a learner can be set up and assigned, a v4 sheet is served, a
 * Python item runs in Piston, and Finish produces the report.
 *
 *   SMOKE_URL=https://learn.oyegen.com SMOKE_ADMIN=admin SMOKE_PASSWORD=... npx tsx scripts/v4/smoke.ts
 *
 * Creates one learner named `smoke-<timestamp>`; archive or delete it afterwards from People.
 */
const base = process.env.SMOKE_URL ?? "http://127.0.0.1:8899";
const adminUser = process.env.SMOKE_ADMIN ?? "admin";
const adminPassword = process.env.SMOKE_PASSWORD ?? "";
let failures = 0;

function check(label: string, ok: boolean, detail = ""): void {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

/** A tiny client that keeps the session cookie even over plain http (the cookie is `Secure`). */
function client() {
  let cookie = "";
  return async (method: string, path: string, body?: unknown) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.getSetCookie?.() ?? [];
    for (const c of set) if (c.startsWith("oyelearn_sid=")) cookie = c.split(";")[0];
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
    return { status: res.status, json: json as Record<string, any> };
  };
}

const admin = client();
const health = await admin("GET", "/api/health");
check("health", health.status === 200 && health.json.db === "ok");

let login = await admin("POST", "/api/auth/login", { username: adminUser, password: adminPassword });
check("admin login", login.status === 200, String(login.status));
if (login.json.user?.mustChangePassword) {
  const next = `${adminPassword}-v4`;
  await admin("POST", "/api/auth/change-password", { currentPassword: adminPassword, newPassword: next });
  login = await admin("POST", "/api/auth/login", { username: adminUser, password: next });
  console.log(`note: first login forced a password change; the admin password is now "${next}"`);
}

const catalog = await admin("GET", "/api/admin/catalog");
check("three departments seeded", catalog.json.departments?.length >= 3, `${catalog.json.departments?.length}`);
check("skill catalog seeded", catalog.json.skills?.length > 400, `${catalog.json.skills?.length} skills`);
const bank = await admin("GET", "/api/admin/question-bank?status=active&limit=1");
check("question bank live", bank.json.total > 3000, `${bank.json.total} active items`);

const username = `smoke-${Date.now()}`;
const created = await admin("POST", "/api/admin/users", {
  username,
  displayName: "Smoke Test",
  profile: { roleTitle: null, yearsExperience: null, adminNotes: "", claimedSkills: [], targetTracks: [] },
  issueAssessment: false,
});
check("onboard learner", created.status === 201);
const learnerId = created.json.user?.id as string;
const setup = await admin("PUT", `/api/admin/users/${learnerId}/setup`, {
  departmentId: "engineering",
  trackId: "backend",
  stackIds: ["stack-fastapi"],
  experienceBand: "1-2",
  level: 2,
  priorities: [
    { skillId: "eng-python", slider: 5 },
    { skillId: "eng-sql-joins", slider: 4 },
  ],
  skip: [],
  hoursPerWeek: 15,
  advanced: { weekStartsMonday: false, deadlineWeeks: null, courseCap: 5, autoPublish: false },
  assign: true,
});
check("setup + assign", setup.status === 200 && setup.json.issued?.status === "ready", JSON.stringify(setup.json.issued ?? setup.json).slice(0, 120));
const assessmentId = setup.json.issued?.assessmentId as string;

const learner = client();
const temp = created.json.temporaryPassword as string;
await learner("POST", "/api/auth/login", { username, password: temp });
const newPassword = "Smoke-Learner-Pass-2026!";
await learner("POST", "/api/auth/change-password", { currentPassword: temp, newPassword });
await learner("POST", "/api/auth/login", { username, password: newPassword });
await learner("POST", `/api/assessment/${assessmentId}/consent`, { agreed: true });
const started = await learner("POST", `/api/assessment/${assessmentId}/start`, {});
check("start", started.status === 200);
const sheet = await learner("GET", `/api/assessment/${assessmentId}/sheet`);
const items = (sheet.json.items ?? []) as { id: string; type: string; language?: string; runsOn?: string; starterCode?: string }[];
check("sheet has 25 items", items.length === 25, `${items.length}`);
check("18 hands-on + 7 MCQ", items.filter((i) => i.type === "mcq").length === 7);

const python = items.find((i) => i.type === "coding" && i.language === "python");
if (python) {
  const run = await learner("POST", `/api/assessment/${assessmentId}/items/${python.id}/run`, { code: python.starterCode ?? "" });
  check("python runs in Piston", run.status === 200 && run.json.runsOn === "server" && run.json.result && !run.json.result.compileError?.includes("not configured"), JSON.stringify(run.json.result ?? run.json).slice(0, 160));
} else check("python item present", false);

const finish = await learner("POST", `/api/assessment/${assessmentId}/submit`, {});
check("finish", finish.status === 200);
let status = "";
for (let i = 0; i < 60 && status !== "completed"; i += 1) {
  await new Promise((r) => setTimeout(r, 2000));
  status = ((await learner("GET", `/api/assessment/${assessmentId}/status`)).json.status as string) ?? "";
}
check("evaluated", status === "completed", status);
const evaluation = await learner("GET", "/api/me/evaluation");
check("learner report by skill, no raw score", Array.isArray(evaluation.json.evaluation?.v4?.skills) && !JSON.stringify(evaluation.json).includes("rawScore"));

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll smoke checks passed.");
process.exit(failures ? 1 : 0);
