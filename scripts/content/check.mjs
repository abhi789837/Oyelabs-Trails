#!/usr/bin/env node
// Content quality gate (see docs/CONTENT_GUIDE.md and CLAUDE.md Section 6).
//
//   npm run content:check                         # everything that exists
//   npm run content:check -- --module fe-js-core  # one module (repeatable)
//   npm run content:check -- --no-solutions       # skip running reference solutions
//
// Errors fail the run. Warnings (e.g. search-URL video fallbacks) are listed but don't fail.
import fs from "node:fs";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { loadCurriculum, SOLUTIONS_DIR } from "./load.mjs";

const args = process.argv.slice(2);
const only = args.flatMap((a, i) => (a === "--module" ? [args[i + 1]] : []));
const runSolutions = !args.includes("--no-solutions");

const LEVELS = ["beginner", "intermediate", "advanced", "expert"];
const KINDS = ["docs", "article", "interview-prep", "spec", "repo"];
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

function checkResource(where, r) {
  if (!r || typeof r !== "object") return err(where, "resource missing");
  if (!r.label?.trim()) err(where, "resource label missing");
  if (!/^https:\/\//.test(r.url ?? "")) err(where, `resource url must be https: ${r.url}`);
  if (!KINDS.includes(r.kind)) err(where, `resource kind must be one of ${KINDS.join("/")}: got ${r.kind}`);
}

function checkVideo(where, v) {
  if (!v || typeof v !== "object") return err(where, "video missing");
  if (!v.title?.trim()) err(where, "video.title missing");
  if (!v.channel?.trim()) err(where, "video.channel missing");
  if (/^https:\/\/www\.youtube\.com\/results\?search_query=/.test(v.url ?? "")) {
    if (v.videoId !== "") err(where, "search-URL fallback must have videoId: \"\"");
    warn(where, `video is a search-URL fallback (needs a manual pick): ${v.url}`);
    return;
  }
  const m = /^https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})$/.exec(v.url ?? "");
  if (!m) return err(where, `video.url must be https://www.youtube.com/watch?v=<id> (no extra params): ${v.url}`);
  if (v.videoId !== m[1]) err(where, `video.videoId "${v.videoId}" doesn't match url id "${m[1]}"`);
  if (v.startSeconds !== undefined && !(Number.isInteger(v.startSeconds) && v.startSeconds >= 0)) {
    err(where, "video.startSeconds must be a non-negative integer");
  }
  if (v.startSeconds && !v.chapterLabel) warn(where, "video.startSeconds set without a chapterLabel");
  if (v.durationLabel !== undefined && !/^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(v.durationLabel)) {
    err(where, `video.durationLabel should look like 19:11 or 1:32:35: ${v.durationLabel}`);
  }
}

function checkQuiz(where, topic) {
  const quiz = topic.quiz;
  if (!Array.isArray(quiz) || quiz.length === 0) return err(where, "quiz topic has no questions");
  const min = topic.level === "beginner" ? 4 : 8;
  if (quiz.length < min || quiz.length > 12) err(where, `quiz needs ${min}–12 questions for a ${topic.level} topic, has ${quiz.length}`);
  const ids = new Set();
  let edge = 0;
  let multi = 0;
  for (const q of quiz) {
    const w = `${where} ${q.id ?? "(no id)"}`;
    if (!q.id?.startsWith(`${topic.id}-q`)) err(w, `question ids should look like ${topic.id}-q1`);
    if (ids.has(q.id)) err(w, "duplicate question id");
    ids.add(q.id);
    if (!q.prompt?.trim()) err(w, "prompt missing");
    if (!Array.isArray(q.options) || q.options.length < 3 || q.options.length > 6) err(w, "needs 3–6 options");
    else if (new Set(q.options.map((o) => o.trim())).size !== q.options.length) err(w, "duplicate options");
    const n = q.options?.length ?? 0;
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= n) err(w, "correctIndex out of range");
    if (q.correctIndices !== undefined) {
      multi++;
      const ci = q.correctIndices;
      if (!Array.isArray(ci) || ci.length < 2) err(w, "correctIndices needs at least 2 entries (otherwise use correctIndex)");
      else {
        if (new Set(ci).size !== ci.length) err(w, "correctIndices has duplicates");
        if (ci.some((i) => !Number.isInteger(i) || i < 0 || i >= n)) err(w, "correctIndices out of range");
        if (ci.length >= n) err(w, "at least one option must be wrong");
        if (!ci.includes(q.correctIndex)) err(w, "correctIndex must be one of correctIndices");
      }
    }
    if (!q.explanation?.trim()) err(w, "explanation missing");
    if (q.isEdgeCaseOrInterviewQuestion) edge++;
  }
  if (edge < 2) err(where, `needs at least 2 questions with isEdgeCaseOrInterviewQuestion, has ${edge}`);
  if (topic.level !== "beginner" && multi < 1) err(where, "non-beginner quizzes need at least one multi-select question");
}

function checkCode(where, topic) {
  const c = topic.codeChallenge;
  if (!c) return err(where, "code topic has no codeChallenge");
  if (!c.instructions?.trim()) err(where, "instructions missing");
  if (!/^[A-Za-z_$][\w$]*$/.test(c.functionName ?? "")) err(where, "functionName must be a valid identifier");
  const declares = new RegExp(`(function\\s*\\*?\\s*${c.functionName}\\s*\\(|(const|let|var|class)\\s+${c.functionName}\\b)`);
  if (!declares.test(c.starterCode ?? "")) err(where, `starterCode doesn't declare ${c.functionName}`);
  if (!Array.isArray(c.testCases) || c.testCases.length < 5) err(where, `needs at least 5 test cases, has ${c.testCases?.length ?? 0}`);
  const edge = (c.testCases ?? []).filter((t) => t.isEdgeCase).length;
  if (edge < 2) err(where, `needs at least 2 test cases with isEdgeCase, has ${edge}`);
  for (const [i, t] of (c.testCases ?? []).entries()) {
    if (!t.description?.trim()) err(where, `test ${i + 1} needs a description`);
    if (!Array.isArray(t.args)) err(where, `test ${i + 1} args must be an array`);
    try {
      structuredClone(t.args);
      structuredClone(t.expected);
    } catch {
      err(where, `test ${i + 1} args/expected must be plain data (structured-cloneable)`);
    }
  }
}

// Mirrors the in-browser worker in src/lib/codeRunner.ts.
const HARNESS = `
const { parentPort, workerData } = require("node:worker_threads");
function deepEqual(a, b) {
  if (a === b || (a !== a && b !== b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}
(async () => {
  const { code, functionName, testCases } = workerData;
  let fn;
  try { fn = new Function(code + "\\n;return typeof " + functionName + " === 'function' ? " + functionName + " : undefined;")(); }
  catch (e) { parentPort.postMessage({ compileError: String(e && e.message || e) }); return; }
  if (typeof fn !== "function") { parentPort.postMessage({ compileError: "function not found" }); return; }
  const results = [];
  for (const tc of testCases) {
    try { const actual = await fn(...structuredClone(tc.args)); results.push({ passed: deepEqual(actual, tc.expected), actual: JSON.stringify(actual) }); }
    catch (e) { results.push({ passed: false, error: String(e && e.message || e) }); }
  }
  parentPort.postMessage({ results });
})();
`;

function runTests(code, challenge, timeoutMs = 6000) {
  return new Promise((resolve) => {
    const worker = new Worker(HARNESS, {
      eval: true,
      workerData: { code, functionName: challenge.functionName, testCases: challenge.testCases },
    });
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ timedOut: true });
    }, timeoutMs);
    worker.once("message", (msg) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(msg);
    });
    worker.once("error", (e) => {
      clearTimeout(timer);
      resolve({ compileError: e.message });
    });
  });
}

const { loaded, missing } = await loadCurriculum({ only });
const topicIds = new Map();
let topicCount = 0;
let questionCount = 0;
let codeCount = 0;
const solutionJobs = [];

for (const { track, entry, file, mod } of loaded) {
  const mw = `${entry.id}`;
  if (!mod) {
    err(mw, `${path.relative(process.cwd(), file)} has no default export`);
    continue;
  }
  if (mod.id !== entry.id) err(mw, `module id "${mod.id}" doesn't match registry/file name "${entry.id}"`);
  if (mod.trackId !== track.id) err(mw, `module trackId "${mod.trackId}" should be "${track.id}"`);
  if (!mod.name?.trim()) err(mw, "module name missing");
  if (!mod.description?.trim()) err(mw, "module description missing");
  for (const [i, r] of (mod.refs ?? []).entries()) checkResource(`${mw} refs[${i}]`, r);
  if (!Array.isArray(mod.topics) || mod.topics.length === 0) err(mw, "module has no topics");

  for (const topic of mod.topics ?? []) {
    topicCount++;
    const w = `${entry.id}/${topic.id}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(topic.id ?? "")) err(w, "topic id must be kebab-case");
    if (topicIds.has(topic.id)) err(w, `duplicate topic id (also in ${topicIds.get(topic.id)})`);
    topicIds.set(topic.id, entry.id);
    if (topic.moduleId !== entry.id) err(w, `moduleId should be "${entry.id}"`);
    if (topic.trackId !== track.id) err(w, `trackId should be "${track.id}"`);
    if (!topic.title?.trim()) err(w, "title missing");
    const summaryLength = topic.summary?.trim().length ?? 0;
    if (summaryLength < 350) err(w, `summary is too thin for senior-level framing (${summaryLength} chars, need 350+)`);
    if (summaryLength > 2400) warn(w, `summary is very long (${summaryLength} chars)`);
    if (!LEVELS.includes(topic.level)) err(w, `level must be one of ${LEVELS.join("/")}`);
    if (!Number.isInteger(topic.estMinutes) || topic.estMinutes <= 0) err(w, "estMinutes must be a positive integer");
    if (topic.isMilestone && !["advanced", "expert"].includes(topic.level)) warn(w, "milestones should generally be advanced or expert");

    const refs = topic.webRefs ?? [];
    if (refs.length < 2 || refs.length > 4) err(w, `needs 2–4 webRefs, has ${refs.length}`);
    refs.forEach((r, i) => checkResource(`${w} webRefs[${i}]`, r));
    if (new Set(refs.map((r) => r.url)).size !== refs.length) err(w, "duplicate webRef urls");
    if (refs.length && !refs.some((r) => r.kind === "docs" || r.kind === "spec")) err(w, "include the official docs or spec as a webRef");

    checkVideo(`${w} video`, topic.video);
    for (const [i, v] of (topic.alternateVideos ?? []).entries()) checkVideo(`${w} alternateVideos[${i}]`, v);

    if (topic.challengeType === "quiz") {
      questionCount += topic.quiz?.length ?? 0;
      checkQuiz(w, topic);
      if (topic.codeChallenge) err(w, "quiz topic shouldn't also have a codeChallenge");
    } else if (topic.challengeType === "code") {
      codeCount++;
      checkCode(w, topic);
      if (topic.quiz) err(w, "code topic shouldn't also have a quiz");
      const solutionFile = path.join(SOLUTIONS_DIR, `${topic.id}.js`);
      if (!fs.existsSync(solutionFile)) err(w, `missing reference solution content-tests/solutions/${topic.id}.js`);
      else if (runSolutions && topic.codeChallenge) solutionJobs.push({ w, topic, solutionFile });
    } else err(w, `challengeType must be "quiz" or "code"`);
  }
}

for (const { w, topic, solutionFile } of solutionJobs) {
  const c = topic.codeChallenge;
  const solution = await runTests(fs.readFileSync(solutionFile, "utf8"), c);
  if (solution.timedOut) err(w, "reference solution timed out");
  else if (solution.compileError) err(w, `reference solution didn't load: ${solution.compileError}`);
  else {
    solution.results.forEach((r, i) => {
      if (!r.passed) err(w, `reference solution fails test ${i + 1} ("${c.testCases[i].description}"): ${r.error ?? `got ${r.actual}`}`);
    });
  }
  const starter = await runTests(c.starterCode, c, 4000);
  if (!starter.timedOut && !starter.compileError && starter.results.every((r) => r.passed)) {
    err(w, "untouched starter code passes every test; it must fail at least one");
  }
}

for (const wmsg of warnings) console.warn(`warn  ${wmsg}`);
for (const emsg of errors) console.error(`error ${emsg}`);
console.log(
  `\n${loaded.length} module(s), ${topicCount} topics, ${questionCount} quiz questions, ${codeCount} code challenges` +
    (runSolutions ? `, ${solutionJobs.length} reference solutions run` : "") +
    (only.length ? "" : `. Not written yet: ${missing.length} module(s)${missing.length ? ` (${missing.map((m) => m.moduleId).join(", ")})` : ""}`),
);
if (errors.length) {
  console.error(`\nFAILED with ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`OK (${warnings.length} warning(s)).`);
