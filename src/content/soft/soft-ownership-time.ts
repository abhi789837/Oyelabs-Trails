import type { Module } from "@/types/curriculum";

const V = "2026-10-05T10:00:00Z";

export default {
  id: "soft-ownership-time",
  trackId: "soft",
  name: "Ownership and time management",
  description:
    "Owning your work end to end: one clear owner for every task, promises you can keep, early warnings when they slip, and a simple way to decide what to do first.",
  refs: [
    { label: "Mind Tools: Eisenhower's Urgent/Important Principle", url: "https://www.mindtools.com/al1e0k5/eisenhowers-urgentimportant-principle/", kind: "docs", verifiedAt: V },
    { label: "GitLab Handbook: Directly Responsible Individuals", url: "https://handbook.gitlab.com/handbook/people-group/directly-responsible-individuals/", kind: "docs", verifiedAt: V },
  ],
  topics: [
    {
      id: "soft-ownership-own-the-outcome",
      moduleId: "soft-ownership-time",
      trackId: "soft",
      title: "Own the outcome, protect your time",
      summary:
        "Google's Project Aristotle found dependability to be one of the five things that make teams work: people do what they say, on time, to a good standard. At an agency, dependability is what clients pay for. Ownership means you care about the outcome, not just your task: the feature works for the user, it is tested, it is deployed, and the people who need to know, know.\n\nJocko Willink calls this extreme ownership: when something goes wrong in your area, you own it, including the parts you did not do yourself, and you fix the process rather than blame others. In practice that means: if your API change breaks the mobile app, you raise it, help fix it, and suggest a check so it does not happen again.\n\nGitLab uses a Directly Responsible Individual (DRI): one named person owns each decision or task. \"The team will look into it\" often means nobody will. When you take a task, say so; when you cannot finish it, hand it over clearly, with notes, instead of letting it go quiet.\n\nTime management is how you keep your promises. The Eisenhower principle sorts work by urgent and important: do important and urgent work now (a production bug blocking a client), schedule important but not urgent work (tests, refactoring, learning), delegate or batch urgent but less important work (most chat pings), and drop what is neither. Estimate honestly, add time for testing and review, and protect focus time for deep work. When a promise will slip, say so as soon as you know, with a new date: a missed deadline that was flagged early is a plan change; one that was hidden is a trust problem.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Mind Tools: Eisenhower's Urgent/Important Principle", url: "https://www.mindtools.com/al1e0k5/eisenhowers-urgentimportant-principle/", kind: "docs", verifiedAt: V },
        { label: "GitLab Handbook: Directly Responsible Individuals", url: "https://handbook.gitlab.com/handbook/people-group/directly-responsible-individuals/", kind: "docs", verifiedAt: V },
      ],
      video: {
        title: "Extreme Ownership",
        channel: "TEDx Talks (Jocko Willink)",
        url: "https://www.youtube.com/watch?v=ljqra3BcqWM",
        videoId: "ljqra3BcqWM",
        durationLabel: "13:49",
        verifiedAt: V,
      },
      alternateVideos: [
        {
          title: "How to gain control of your free time",
          channel: "TED (Laura Vanderkam)",
          url: "https://www.youtube.com/watch?v=n3kNlFMXslo",
          videoId: "n3kNlFMXslo",
          durationLabel: "11:54",
          verifiedAt: V,
        },
      ],
      sections: [
        {
          heading: "For engineers",
          body:
            "Ownership of a ticket does not end at \"merged\". Check it on staging, make sure the tests cover the change, update the ticket, and tell the PM if anything changed. When you pick up a task, give an estimate that includes testing and review. Block focus time in your calendar for the hard work, and answer chat in batches instead of every minute.",
        },
        {
          heading: "For PMs and BD",
          body:
            "Make sure every action item from a meeting has one named owner and a date; \"we\" and \"the team\" are not owners. Track promises made to the client as carefully as tasks. When you see a commitment slipping, raise it with the owner early and agree a new date before the client asks.",
        },
        {
          heading: "The urgent and important grid",
          body:
            "- Important and urgent: do now (a production bug blocking the client).\n- Important, not urgent: schedule (tests, documentation, learning, refactoring).\n- Urgent, less important: batch or delegate (most chat pings, routine requests).\n- Neither: drop it.\n\nMost real progress lives in the second box, which is why it needs time protected in your calendar.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "soft-ownership-own-the-outcome-q1",
          prompt: "What did Project Aristotle find about dependability?",
          options: [
            "It does not matter if people are talented",
            "It is one of the five things that make teams work: people do what they say, on time, to a good standard",
            "It only matters for managers",
            "It is less important than team composition",
          ],
          correctIndex: 1,
          explanation: "Dependability is one of the five team dynamics, along with psychological safety, structure and clarity, meaning and impact.",
        },
        {
          id: "soft-ownership-own-the-outcome-q2",
          prompt: "Your API change breaks the mobile app, which another developer maintains. What does extreme ownership look like?",
          options: [
            "Say the mobile app should have handled it",
            "Raise it, help fix it, and suggest a check so it does not happen again",
            "Wait for the mobile developer to notice",
            "Revert silently and say nothing",
          ],
          correctIndex: 1,
          explanation: "Own the outcome, including parts you did not do yourself, and fix the process rather than blame.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-ownership-own-the-outcome-q3",
          prompt: "What is a DRI?",
          options: ["A type of database index", "A Directly Responsible Individual: one named person who owns a decision or task", "A daily report", "A team of reviewers"],
          correctIndex: 1,
          explanation: "One named owner; \"the team will look into it\" often means nobody will.",
        },
        {
          id: "soft-ownership-own-the-outcome-q4",
          prompt: "In the urgent and important grid, what do you do with writing tests and refactoring?",
          options: ["Do now", "Schedule it and protect time for it", "Delegate it", "Drop it"],
          correctIndex: 1,
          explanation: "Important but not urgent: schedule it. Most real progress lives here.",
        },
        {
          id: "soft-ownership-own-the-outcome-q5",
          prompt: "On Wednesday you realise your Friday task will slip to Tuesday. When should you tell people?",
          options: ["Friday afternoon", "Now, with the new date", "Only if someone asks", "Tuesday, when it is done"],
          correctIndex: 1,
          explanation: "A slip flagged early is a plan change; a hidden one is a trust problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-ownership-own-the-outcome-q6",
          prompt: "Which show ownership of a ticket after it is merged? (Select all that apply.)",
          options: ["Check it on staging", "Make sure tests cover the change", "Update the ticket and tell the PM if anything changed", "Move on, merged means done"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Ownership ends when the outcome works for the user, not at the merge.",
        },
        {
          id: "soft-ownership-own-the-outcome-q7",
          prompt: "A meeting ends with \"The team will look into the login issue.\" What is missing?",
          options: ["Nothing", "One named owner and a date", "A longer discussion", "A new meeting"],
          correctIndex: 1,
          explanation: "\"We\" and \"the team\" are not owners. Every action needs one name and a date.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-ownership-own-the-outcome-q8",
          prompt: "What should an honest estimate include? (Select all that apply.)",
          options: ["The build work", "Testing", "Review", "Time for the client to change their mind three times"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Include testing and review; padding for imagined changes hides the real estimate.",
        },
        {
          id: "soft-ownership-own-the-outcome-q9",
          prompt: "How should you handle most chat pings during focus time?",
          options: ["Answer each one immediately", "Batch them: they are usually urgent but less important", "Ignore them for a week", "Turn off chat permanently"],
          correctIndex: 1,
          explanation: "Batch urgent but less important work, and protect focus time for deep work.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "It is 10 am on Thursday. Put these tasks in the order you should handle them today.",
        items: [
          { id: "prod", label: "Production bug: the client's customers cannot check out (reported 15 minutes ago)" },
          { id: "demo", label: "Prepare data and rehearse for tomorrow's client demo of your feature" },
          { id: "review", label: "Review a teammate's PR that is blocking their task for this sprint" },
          { id: "tests", label: "Add missing tests for last week's feature (important, not urgent)" },
          { id: "chat", label: "Reply to a non-urgent chat thread about next month's tool choice" },
        ],
        correctOrder: ["prod", "review", "demo", "tests", "chat"],
        explanation:
          "A production outage blocking customers comes first. Unblocking a teammate is next, because their sprint work waits on you. The demo is tomorrow, so prepare it today. Tests are important but not urgent: schedule them. The non-urgent chat thread can wait for a batch reply.",
      },
    },
  ],
} satisfies Module;
