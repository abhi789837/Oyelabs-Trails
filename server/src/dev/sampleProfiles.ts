import type { LearnerProfile } from "../../../shared/profile";

/**
 * Three realistic learner profiles (brief's P4 prompt), used by the dev seed and by the
 * blueprint tests.
 *
 * They are written the way a manager actually writes notes: specific incidents, hedged opinions,
 * and gaps they have not thought to mention. A blueprint built from a tidy bullet list would look
 * better than it should — the point of these is that the prompt has to cope with prose.
 */
export interface SampleLearner {
  username: string;
  displayName: string;
  profile: LearnerProfile;
}

export const SAMPLE_LEARNERS: SampleLearner[] = [
  {
    username: "priya.sharma",
    displayName: "Priya Sharma",
    profile: {
      roleTitle: "Frontend Engineer",
      yearsExperience: 1.5,
      adminNotes: `Joined us straight from a bootcamp about eighteen months ago, and has shipped two internal dashboards on her own. She is genuinely good at building UI — components come out clean and she has an eye for when a design is wrong.

Where she struggles is anything asynchronous. Last sprint she had a race condition where two fetches updated the same piece of state and the slower one won; she could see the symptom but not the cause, and needed a pair session to get through it. Error handling tends to be an afterthought — the happy path is always solid, the failure path usually is not.

She has never touched a backend beyond calling an endpoint someone else wrote. I do not think she knows what a database index is, and I would not expect her to.

Works fast and asks good questions. If we can fix the async gap she will be a strong mid-level engineer inside a year.`,
      claimedSkills: [
        { area: "React", level: 3 },
        { area: "CSS", level: 3, note: "Better than most of us" },
        { area: "JavaScript", level: 2, note: "Promises and async/await are shaky" },
        { area: "TypeScript", level: 2 },
      ],
      targetTracks: ["frontend"],
    },
  },
  {
    username: "arjun.mehta",
    displayName: "Arjun Mehta",
    profile: {
      roleTitle: "Backend Engineer (PHP/Laravel)",
      yearsExperience: 4,
      adminNotes: `Four years on Laravel, almost all of it on one large client project that he largely maintained alone. Knows Eloquent extremely well — he is the person other people ask about relationships and eager loading. Has fixed several N+1 problems for other teams.

The concern is breadth. Everything he knows, he learned inside one framework, and I am not sure how much of it he could carry somewhere else. He talks about "Laravel does X" rather than "X is how this works". When we discussed moving a service to Node he was uncomfortable in a way that suggested the gap is the language, not the framework.

Testing is mixed: he writes feature tests reliably, but I have never seen him write a unit test that did not touch the database.

Solid, dependable, and I think under-levelled — I would like to know whether the ceiling is knowledge or confidence.`,
      claimedSkills: [
        { area: "PHP", level: 4 },
        { area: "Laravel", level: 4, note: "Eloquent especially" },
        { area: "SQL", level: 3 },
        { area: "JavaScript", level: 2, note: "Only what a Blade template needs" },
      ],
      targetTracks: ["backend", "fullstack"],
    },
  },
  {
    username: "sofia.reyes",
    displayName: "Sofia Reyes",
    profile: {
      roleTitle: "Senior Backend Engineer",
      yearsExperience: 8,
      adminNotes: `Eight years, the last three with us on Node and NestJS. She designed the queue architecture we run everything through and it has not needed a rewrite, which says a lot.

Strong on the things that are hard to teach: she thinks about failure modes before writing code, and her postmortems are the ones I circulate. Comfortable with Postgres to the point of reading query plans.

Two things I am unsure about. She has been deliberately away from frontend for years and describes herself as "hopeless" at it, which I suspect is out of date rather than true. And although she uses containers daily, she has never had to set up the infrastructure herself — someone else has always owned that.

She is the person I would most like a real reading on. If she is a 5 in her areas I want to know, because that changes what we ask her to do.`,
      claimedSkills: [
        { area: "Node.js", level: 5 },
        { area: "NestJS", level: 4 },
        { area: "SQL", level: 4, note: "Reads EXPLAIN plans comfortably" },
        { area: "System Design", level: 4 },
        { area: "React", level: 1, note: "Her own estimate; I think it is low" },
      ],
      targetTracks: ["backend", "fullstack", "ai-driven"],
    },
  },
];
