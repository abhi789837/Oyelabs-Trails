import type { Module } from "@/types/curriculum";

const V = "2026-10-05T10:00:00Z";

export default {
  id: "soft-standup-updates",
  trackId: "soft",
  name: "Stand-ups and status updates",
  description:
    "The daily stand-up and the written status update: done, next and blockers, tied to the sprint goal, kept short, with side topics parked for afterwards.",
  refs: [
    { label: "Atlassian: Stand-ups for agile teams", url: "https://www.atlassian.com/agile/scrum/standups", kind: "docs", verifiedAt: V },
    { label: "The Scrum Guide (Daily Scrum)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: V },
  ],
  topics: [
    {
      id: "soft-standup-done-next-blockers",
      moduleId: "soft-standup-updates",
      trackId: "soft",
      title: "A clear stand-up update in 60 seconds",
      summary:
        "The Scrum Guide describes the Daily Scrum as a 15-minute event for the developers to inspect progress toward the Sprint Goal and adapt the plan. It is not a status report to a manager. That changes how you speak in it: you are telling your teammates what they need to know to work together today, not proving you were busy.\n\nThe common shape, used by Atlassian and most teams, is three parts. Done: what you finished since the last stand-up, in terms of the goal (\"The booking API is merged and on staging\"), not a list of every task. Next: what you will do today. Blockers: anything stopping you, and who can help (\"I need the payment sandbox keys from the client; Priya, can you chase them?\"). A good update takes under a minute.\n\nThree habits make stand-ups useful. Come prepared: decide your three lines before the call, so you do not think aloud. Timebox it: keep your part short, and if a topic needs discussion, park it (\"Let's take that after stand-up\") so the whole team is not held for a two-person problem. Tie it to the goal: say how your work moves the sprint goal, and say early if the goal is at risk.\n\nThe most common mistakes are listing activity instead of results (\"I had meetings, looked at some code\"), hiding a blocker until it is too late, and turning the stand-up into a problem-solving session. A blocker said on day one is cheap; the same blocker found on the last day of the sprint is expensive. Written status updates in chat follow the same three parts, with links instead of explanations.",
      level: "intermediate",
      estMinutes: 25,
      webRefs: [
        { label: "Atlassian: Stand-ups for agile teams", url: "https://www.atlassian.com/agile/scrum/standups", kind: "docs", verifiedAt: V },
        { label: "The Scrum Guide (Daily Scrum)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: V },
      ],
      video: {
        title: "Daily Standups: How to Run Them - Agile Coach (2019)",
        channel: "Atlassian",
        url: "https://www.youtube.com/watch?v=er9gntPjTJU",
        videoId: "er9gntPjTJU",
        durationLabel: "4:13",
        verifiedAt: V,
      },
      alternateVideos: [
        {
          title: "Daily Scrum Explained: A Better Way to Run It",
          channel: "Mountain Goat Software",
          url: "https://www.youtube.com/watch?v=MZdK4SX0mfI",
          videoId: "MZdK4SX0mfI",
          durationLabel: "5:06",
          verifiedAt: V,
        },
      ],
      sections: [
        {
          heading: "For engineers",
          body:
            "A strong update: \"Yesterday I finished the search filters; they're on staging. Today I'm starting the export to CSV. One blocker: I need the client's sample data file. Rahul, could you ask for it in today's client call?\"\n\nA weak update: \"Yesterday I worked on some stuff, had a few meetings, looked into the search thing. Today I'll continue. No blockers, I think.\" It says nothing about results, nothing about the goal, and \"I think\" hides a possible blocker.",
        },
        {
          heading: "For PMs and BD",
          body:
            "If you run the stand-up, protect the timebox: let each person give done, next and blockers, then park discussions with the two or three people involved. Listen for risks to the sprint goal and for blockers that need the client; those become your actions for the day. A client-facing status update follows the same pattern: done, next, risks and decisions needed, with dates.",
        },
        {
          heading: "Your 60-second checklist",
          body:
            "- Done: results since last time, linked to the goal.\n- Next: what you will do today.\n- Blockers: what stops you, and who can help.\n- Under one minute; side topics parked for after.\n- Said early if the sprint goal is at risk.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "soft-standup-done-next-blockers-q1",
          prompt: "According to the Scrum Guide, what is the Daily Scrum for?",
          options: [
            "A status report to the manager",
            "A 15-minute event for developers to inspect progress toward the Sprint Goal and adapt the plan",
            "A place to solve every technical problem",
            "A weekly client meeting",
          ],
          correctIndex: 1,
          explanation: "It is for the developers, about the Sprint Goal. It is not a status report to a manager.",
        },
        {
          id: "soft-standup-done-next-blockers-q2",
          prompt: "Which three parts make up a typical stand-up update?",
          options: ["Done, next, blockers", "Problems, excuses, plans", "Greeting, history, summary", "Tickets, hours, meetings"],
          correctIndex: 0,
          explanation: "Done since last time, next for today, and anything blocking you.",
        },
        {
          id: "soft-standup-done-next-blockers-q3",
          prompt: "Which update is strongest?",
          options: [
            "\"Worked on some stuff, had meetings, will continue. No blockers, I think.\"",
            "\"Finished the search filters, they're on staging. Today: CSV export. Blocker: I need the client's sample data; Rahul, can you ask for it today?\"",
            "\"I fixed 14 small things and read the docs for 3 hours.\"",
            "\"Same as yesterday.\"",
          ],
          correctIndex: 1,
          explanation: "Results, today's plan and a blocker with a named helper. The others list activity or say nothing.",
        },
        {
          id: "soft-standup-done-next-blockers-q4",
          prompt: "Two developers start debugging a deployment issue in the middle of stand-up. What should happen?",
          options: [
            "Everyone waits until they finish",
            "Park it: they take it straight after stand-up, so the rest of the team is not held",
            "Cancel the stand-up",
            "The PM solves it live",
          ],
          correctIndex: 1,
          explanation: "Timebox the stand-up and park side topics for the people involved.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-standup-done-next-blockers-q5",
          prompt: "You think you might be blocked tomorrow by missing API keys, but you are not sure. What should you do in today's stand-up?",
          options: [
            "Say nothing until you are sure",
            "Mention it now as a possible blocker and who can help, because early blockers are cheap",
            "Wait for the last day of the sprint",
            "Only tell the PM in private next week",
          ],
          correctIndex: 1,
          explanation: "A blocker said on day one is cheap; the same blocker found late is expensive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-standup-done-next-blockers-q6",
          prompt: "Which are common stand-up mistakes? (Select all that apply.)",
          options: [
            "Listing activity instead of results",
            "Hiding a blocker until it is too late",
            "Turning the stand-up into problem-solving",
            "Preparing your three lines before the call",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Preparing is a good habit; the other three are the classic mistakes.",
        },
        {
          id: "soft-standup-done-next-blockers-q7",
          prompt: "How long should one person's stand-up update usually take?",
          options: ["Under a minute", "About five minutes", "As long as needed", "Fifteen minutes"],
          correctIndex: 0,
          explanation: "The whole event is 15 minutes; one update should be under a minute.",
        },
        {
          id: "soft-standup-done-next-blockers-q8",
          prompt: "You realise the sprint goal is at risk because a third-party API is down. When do you say it?",
          options: ["At the sprint review", "Early, in the next stand-up, tied to the goal", "Only if someone asks", "After the sprint ends"],
          correctIndex: 1,
          explanation: "Tie your update to the goal and say early when the goal is at risk.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-standup-done-next-blockers-q9",
          prompt: "What should a written status update in chat include? (Select all that apply.)",
          options: ["Done", "Next", "Blockers", "Links instead of long explanations", "Every meeting you attended"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "The same three parts as the spoken update, with links for detail.",
        },
      ],
      practice: {
        kind: "write",
        variant: "general",
        prompt:
          "Write the stand-up update you would give today (what you would say, in under 60 seconds). Use the notes below. Keep it to done, next and blockers.",
        context:
          "Your notes: yesterday you finished the forgot-password flow and it is on staging; you spent an hour in a design meeting; you also reviewed two PRs. Today you plan to start the email-verification screen. The SMTP provider keys for staging have not arrived from the client, so verification emails cannot be tested; Meera (PM) talks to the client today. Sprint goal: users can sign up and log in securely by Friday.",
        wordLimit: 110,
        rubric: [
          { id: "done", label: "Done as a result", description: "Says the forgot-password flow is finished and on staging, without listing every meeting or review.", weight: 1 },
          { id: "next", label: "Next", description: "Says today's work: starting the email-verification screen.", weight: 1 },
          { id: "blocker", label: "Blocker with a helper", description: "Names the missing SMTP keys and asks Meera to raise it with the client today.", weight: 1.5 },
          { id: "goal", label: "Tied to the goal", description: "Links the work or the risk to the sprint goal (secure sign-up and login by Friday).", weight: 1 },
          { id: "short", label: "Short", description: "Could be said in under a minute; no thinking aloud.", weight: 1 },
        ],
        sampleAnswer:
          "Yesterday I finished the forgot-password flow; it's on staging. Today I'm starting the email-verification screen. One blocker: we still don't have the client's SMTP keys for staging, so I can't test verification emails, and that puts Friday's sign-up goal at risk. Meera, could you ask for the keys in today's client call? That's all from me.",
      },
      speak: {
        kind: "speak",
        title: "Give your stand-up update",
        prompt: "Give today's stand-up update to your team: what you finished, what you will do today, and anything blocking you. Use your real work or the notes provided.",
        audience: "team",
        prepSec: 20,
        maxSec: 60,
        lookFor: ["Done: results since last time, not a list of activities", "Next: what they will do today", "Blockers: what stops them and who can help, or 'no blockers'", "Links the work to the sprint goal", "Under a minute and easy to follow; accent is never counted"],
        writtenFallback: "Write the stand-up update you would give today, in under 60 seconds of speech: done, next and blockers.",
        explanation: "A clear stand-up update covers done, next and blockers, ties them to the sprint goal and fits in under a minute.",
      },
    },
  ],
} satisfies Module;
