// Structural checks for the curriculum data. Run with `npm run check:content`.
// Node 22.18+ strips TypeScript types natively, so the track files import directly.
import { frontendTrack } from "../src/data/tracks/frontend.ts";
import { backendTrack } from "../src/data/tracks/backend.ts";
import { fullstackTrack } from "../src/data/tracks/fullstack.ts";
import { aiDrivenTrack } from "../src/data/tracks/ai-driven.ts";

const tracks = [frontendTrack, backendTrack, fullstackTrack, aiDrivenTrack];
const problems = [];
const topicIds = new Set();
const fail = (where, message) => problems.push(`${where}: ${message}`);

for (const track of tracks) {
  if (track.topics.length === 0) fail(track.id, "track has no topics");

  for (const topic of track.topics) {
    const where = `${track.id}/${topic.id}`;
    if (topicIds.has(topic.id)) fail(where, "duplicate topic id");
    topicIds.add(topic.id);
    if (topic.trackId !== track.id) fail(where, `trackId is "${topic.trackId}"`);
    if (!topic.summary || topic.summary.length > 260) fail(where, "summary missing or over 260 chars");
    if (!(topic.estMinutes > 0)) fail(where, "estMinutes must be positive");

    for (const key of ["webRef", "videoRef"]) {
      const ref = topic[key];
      if (!ref?.label || !ref?.url?.startsWith("https://")) fail(where, `${key} needs a label and an https url`);
    }
    if (!/^https:\/\/www\.youtube\.com\/(watch\?v=[\w-]{11}$|results\?search_query=)/.test(topic.videoRef.url)) {
      fail(where, `videoRef is not a YouTube watch or search URL: ${topic.videoRef.url}`);
    }

    if (topic.challengeType === "quiz") {
      if (!topic.quiz?.length) fail(where, "quiz topic has no questions");
      const questionIds = new Set();
      for (const q of topic.quiz ?? []) {
        if (questionIds.has(q.id)) fail(where, `duplicate question id ${q.id}`);
        questionIds.add(q.id);
        if (q.options.length !== 4) fail(where, `${q.id} should have 4 options`);
        if (new Set(q.options).size !== q.options.length) fail(where, `${q.id} has duplicate options`);
        if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
          fail(where, `${q.id} correctIndex out of range`);
        }
        if (!q.explanation) fail(where, `${q.id} is missing an explanation`);
      }
    } else if (topic.challengeType === "code") {
      const c = topic.codeChallenge;
      if (!c) {
        fail(where, "code topic has no codeChallenge");
        continue;
      }
      if (!new RegExp(`function\\s+${c.functionName}\\s*\\(`).test(c.starterCode)) {
        fail(where, `starterCode doesn't declare function ${c.functionName}`);
      }
      if (c.testCases.length < 3) fail(where, "code challenges need at least 3 test cases");
      for (const t of c.testCases) {
        if (!t.description || !Array.isArray(t.args)) fail(where, "each test case needs a description and args[]");
      }
    } else {
      fail(where, `unknown challengeType "${topic.challengeType}"`);
    }
  }
}

if (problems.length) {
  console.error(`Content check failed with ${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
const count = tracks.reduce((n, t) => n + t.topics.length, 0);
console.log(`Content OK: ${tracks.length} tracks, ${count} topics.`);
