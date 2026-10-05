import type { Module } from "@/types/curriculum";

const V = "2026-10-05T10:00:00Z";

export default {
  id: "soft-presenting-demoing",
  trackId: "soft",
  name: "Presenting and demoing",
  description:
    "Presenting work and demoing features: one clear idea, built for the audience, shown through the user's journey, rehearsed, and ending with a clear ask.",
  refs: [
    { label: "Atlassian: Sprint reviews", url: "https://www.atlassian.com/agile/scrum/sprint-reviews", kind: "docs", verifiedAt: V },
    { label: "Harvard Business Review: How to Give a Killer Presentation", url: "https://hbr.org/2013/06/how-to-give-a-killer-presentation", kind: "article", verifiedAt: V },
  ],
  topics: [
    {
      id: "soft-demo-show-the-value",
      moduleId: "soft-presenting-demoing",
      trackId: "soft",
      title: "Demo a feature so the value is obvious",
      summary:
        "At an agency, the sprint demo is where the client sees what they are paying for. A good demo makes the value obvious in a few minutes; a bad one shows screens in random order, gets lost in settings, and ends with \"so, yeah, that's it\". The difference is preparation, not talent.\n\nChris Anderson, who runs TED, says a great talk builds one idea in the listener's mind. For a demo, that idea is the change for the user: \"Patients can now rebook a missed appointment in two taps.\" Everything you show should support that one idea. Cut what does not, even if it took you days to build.\n\nA simple demo structure works almost every time. First, the context: who the user is and what problem they had. Second, the live walk-through of the user's journey, from the user's point of view, not the code's. Third, what is not done yet or known limits, said honestly. Fourth, the ask: the feedback or decision you need, and the next steps. Keep it short: three minutes for one feature is often enough.\n\nPrepare like it matters. Rehearse once out loud, with a timer. Use realistic test data (real-looking names and orders, not \"test test 123\"). Have a backup, such as a short screen recording, in case staging is down. Close every app and notification you do not need. Patrick Winston's advice on speaking applies: start with an empowerment promise (what they will get from the next minutes), repeat the key point, and end with something useful rather than \"thank you, any questions?\". Speak to the audience: a client wants impact and decisions; a technical lead may want to see edge cases.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Atlassian: Sprint reviews", url: "https://www.atlassian.com/agile/scrum/sprint-reviews", kind: "docs", verifiedAt: V },
        { label: "Harvard Business Review: How to Give a Killer Presentation", url: "https://hbr.org/2013/06/how-to-give-a-killer-presentation", kind: "article", verifiedAt: V },
      ],
      video: {
        title: "TED's secret to great public speaking",
        channel: "TED (Chris Anderson)",
        url: "https://www.youtube.com/watch?v=-FOCpMAww28",
        videoId: "-FOCpMAww28",
        durationLabel: "7:57",
        verifiedAt: V,
      },
      alternateVideos: [
        {
          title: "How to Speak",
          channel: "MIT OpenCourseWare (Patrick Winston)",
          url: "https://www.youtube.com/watch?v=Unzc731iCUY",
          videoId: "Unzc731iCUY",
          durationLabel: "1:03:42",
          verifiedAt: V,
        },
      ],
      sections: [
        {
          heading: "For engineers",
          body:
            "When you demo your own feature, resist explaining how hard it was or how it works inside. Show what the user can now do. Prepare the data before the call, log in beforehand, and know your click path. If something breaks live, stay calm: say what you expected to happen, switch to the backup recording, and note the issue as a follow-up. Mention known limits before the client finds them.",
        },
        {
          heading: "For PMs and BD",
          body:
            "Open the sprint review with the sprint goal and what was completed, then hand over to the developers for live demos of their features. Collect feedback as it comes and repeat it back. End with decisions needed and next steps, then send a written summary. In sales demos, show the prospect's own use case, not every feature.",
        },
        {
          heading: "A 3-minute demo plan",
          body:
            "1. Context (20 s): who the user is and the problem.\n2. The journey (90 s): the user's steps, live, with realistic data.\n3. Limits (20 s): what is not done yet.\n4. The ask (30 s): the feedback or decision you need and the next steps.\n\nRehearse it once, out loud, with a timer.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "soft-demo-show-the-value-q1",
          prompt: "According to Chris Anderson, what does a great talk do?",
          options: ["Shows as many features as possible", "Builds one idea in the listener's mind", "Uses many slides", "Tells the whole history of the project"],
          correctIndex: 1,
          explanation: "One idea, and everything supports it. For a demo, the idea is the change for the user.",
        },
        {
          id: "soft-demo-show-the-value-q2",
          prompt: "What is the order of the simple demo structure in this lesson?",
          options: [
            "Code, database, screens, questions",
            "Context, the user's journey live, known limits, the ask and next steps",
            "Thanks, history, features, goodbye",
            "Limits, apologies, journey, context",
          ],
          correctIndex: 1,
          explanation: "Context, then the journey, then honest limits, then the ask.",
        },
        {
          id: "soft-demo-show-the-value-q3",
          prompt: "Which are good demo preparation habits? (Select all that apply.)",
          options: ["Rehearse once out loud with a timer", "Use realistic test data", "Have a backup recording", "Use \"test test 123\" data to save time", "Close apps and notifications you don't need"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation: "Realistic data looks like the real product; \"test test 123\" distracts the client.",
        },
        {
          id: "soft-demo-show-the-value-q4",
          prompt: "Staging goes down in the middle of your client demo. What should you do?",
          options: [
            "Spend ten minutes debugging live",
            "Stay calm, say what should have happened, switch to the backup recording, and note the issue as a follow-up",
            "End the meeting",
            "Blame the DevOps team",
          ],
          correctIndex: 1,
          explanation: "A backup and a calm explanation keep the demo useful.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-demo-show-the-value-q5",
          prompt: "Your feature works except for one known issue with very long names. When should you mention it?",
          options: ["Never", "Before the client finds it, in the limits part of the demo", "Only if they ask", "In next month's report"],
          correctIndex: 1,
          explanation: "Saying known limits first builds trust; the client finding them builds doubt.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-demo-show-the-value-q6",
          prompt: "You spent three days on a clever caching layer the client will never see. Should it be in the client demo?",
          options: [
            "Yes, explain it in detail so they see the effort",
            "Only as impact (\"pages now load in under a second\"), or cut it: show what supports the one idea",
            "Yes, show the code",
            "Show it first",
          ],
          correctIndex: 1,
          explanation: "Cut what does not support the one idea, even if it took days; show impact, not internals.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-demo-show-the-value-q7",
          prompt: "What does Patrick Winston suggest instead of ending with \"thank you, any questions?\"",
          options: ["Ending abruptly", "Ending with something useful, such as the key point or the ask", "Ending with a joke", "Ending with the agenda"],
          correctIndex: 1,
          explanation: "End with something useful; for a demo, that is the ask and the next steps.",
        },
        {
          id: "soft-demo-show-the-value-q8",
          prompt: "Who should a client demo be built around? (Select all that apply.)",
          options: ["The user's journey", "The audience's needs and decisions", "The order you wrote the code in", "The database schema"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Show the user's journey and speak to what the audience needs to decide.",
        },
        {
          id: "soft-demo-show-the-value-q9",
          prompt: "How long is often enough to demo one feature?",
          options: ["About three minutes", "Thirty minutes", "As long as it takes to show every setting", "Under ten seconds"],
          correctIndex: 0,
          explanation: "A focused demo of one feature usually fits in about three minutes.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "You are demoing the new \"rebook a missed appointment\" feature to the clinic's operations manager in the sprint review. Put the parts of your demo in the best order.",
        items: [
          { id: "context", label: "Context: patients who miss an appointment today must phone the clinic to rebook" },
          { id: "journey", label: "Live walk-through: a patient opens the reminder, taps 'Rebook', picks a new slot" },
          { id: "staff", label: "Show what the staff calendar looks like after the rebooking" },
          { id: "limits", label: "Known limit: rebooking across different clinics is not done yet" },
          { id: "ask", label: "The ask: confirm the 48-hour rebooking window, and next steps" },
        ],
        correctOrder: ["context", "journey", "staff", "limits", "ask"],
        explanation:
          "Start with the problem so the value is clear, show the user's journey and then its effect for staff, be honest about limits before the client finds them, and end with the decision you need.",
      },
      speak: {
        kind: "speak",
        title: "Demo a finished feature",
        prompt: "Present a feature you finished recently (or the clinic 'rebook a missed appointment' feature) to the client as if you were sharing your screen: the problem, what the user can now do, any known limit, and the feedback you need.",
        audience: "client",
        prepSec: 20,
        maxSec: 90,
        lookFor: ["Starts with the user's problem, not the code", "Walks through what the user can now do, step by step", "Mentions a known limit honestly", "Ends with a clear ask or next step", "Easy to follow on the first listen; accent is never counted"],
        writtenFallback: "Write what you would say to demo a feature you finished recently to the client: the problem, what the user can now do, any known limit, and the feedback you need.",
        explanation: "A good demo builds one idea: what changed for the user. Problem, journey, limits, ask.",
      },
    },
  ],
} satisfies Module;
