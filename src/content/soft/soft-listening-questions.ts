import type { Module } from "@/types/curriculum";

const V = "2026-10-05T10:00:00Z";

export default {
  id: "soft-listening-questions",
  trackId: "soft",
  name: "Listening and asking good questions",
  description:
    "Active listening and good questions: paying full attention, reflecting back what you heard, asking open and follow-up questions, and clarifying a request before you estimate or build it.",
  refs: [
    { label: "Mind Tools: Active Listening", url: "https://www.mindtools.com/az4wxv7/active-listening", kind: "docs", verifiedAt: V },
    { label: "Harvard Business Review: What Great Listeners Actually Do", url: "https://hbr.org/2016/07/what-great-listeners-actually-do", kind: "article", verifiedAt: V },
    { label: "Harvard Business Review: The Surprising Power of Questions", url: "https://hbr.org/2018/05/the-surprising-power-of-questions", kind: "article", verifiedAt: V },
  ],
  topics: [
    {
      id: "soft-listening-clarify-first",
      moduleId: "soft-listening-questions",
      trackId: "soft",
      title: "Listen, reflect back, then ask",
      summary:
        "Many wasted sprints start with a request that was heard but not understood. A client says \"we need a dashboard\" and the team builds charts, when the client wanted a list of overdue orders they can export. Listening well and asking good questions before you build is one of the cheapest ways to save time.\n\nActive listening, as Mind Tools describes it, has five parts: pay attention, show that you are listening, reflect back what you heard (\"What I'm hearing is...\"), hold back judgment, and respond respectfully. Reflecting back is the most useful one at work: \"So you need overdue orders, filterable by branch, exported to Excel every Monday, is that right?\" It catches misunderstandings while they are still free to fix.\n\nGood listening is more than staying quiet while the other person talks. Research by Zenger and Folkman in Harvard Business Review found that the best listeners act like a trampoline, not a sponge: they ask questions that help the other person think, they make the conversation feel safe, and they add ideas that build on what was said.\n\nQuestions are a skill you can learn. Brooks and John, also in HBR, found that follow-up questions in particular get better information and build rapport, because they show you heard the answer. Use open questions to explore (\"What should happen when a payment fails?\", \"Who will use this screen, and how often?\") and closed questions to confirm (\"So the limit is 50 rows per page?\"). Before you estimate a task, ask about the goal, the users, the edge cases, what is out of scope, and the deadline. A short list of good questions makes you look more senior, not less.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Mind Tools: Active Listening", url: "https://www.mindtools.com/az4wxv7/active-listening", kind: "docs", verifiedAt: V },
        { label: "Harvard Business Review: What Great Listeners Actually Do", url: "https://hbr.org/2016/07/what-great-listeners-actually-do", kind: "article", verifiedAt: V },
        { label: "Harvard Business Review: The Surprising Power of Questions", url: "https://hbr.org/2018/05/the-surprising-power-of-questions", kind: "article", verifiedAt: V },
      ],
      video: {
        title: "5 ways to listen better",
        channel: "TED (Julian Treasure)",
        url: "https://www.youtube.com/watch?v=cSohjlYQI2A",
        videoId: "cSohjlYQI2A",
        durationLabel: "7:50",
        verifiedAt: V,
      },
      alternateVideos: [
        {
          title: "How to talk to customers properly, with Rob Fitzpatrick (The Mom Test)",
          channel: "Playbook",
          url: "https://www.youtube.com/watch?v=fJrF1peewt4",
          videoId: "fJrF1peewt4",
          durationLabel: "1:05",
          verifiedAt: V,
        },
      ],
      sections: [
        {
          heading: "For engineers",
          body:
            "Before you estimate or start a ticket, ask: What problem does this solve, and for whom? What does done look like? What happens in the unusual cases (empty data, errors, a slow network)? What is out of scope? When is it needed? Write the answers in the ticket. If the request came on a call, reflect it back in one sentence before the call ends.",
        },
        {
          heading: "For PMs and BD",
          body:
            "In discovery and requirement calls, talk less than the client. Ask about their past behaviour and real problems (\"How do you handle this today?\", \"What happened the last time it went wrong?\") rather than asking them to imagine features. Follow-up questions (\"Tell me more about that\", \"Why does that matter?\") uncover the real need. Summarise what you heard at the end and confirm it in writing.",
        },
        {
          heading: "Open and closed questions",
          body:
            "Open questions explore: \"What should happen when...?\", \"How do your staff use this today?\", \"What worries you about the launch?\"\n\nClosed questions confirm: \"So the report runs every Monday?\", \"Is Excel the only export format you need?\"\n\nUse open questions first to understand, then closed questions to lock in the details.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "soft-listening-clarify-first-q1",
          prompt: "Which are parts of active listening as described by Mind Tools? (Select all that apply.)",
          options: ["Pay attention", "Reflect back what you heard", "Hold back judgment", "Plan your reply while they talk", "Respond respectfully"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation: "Pay attention, show you are listening, reflect back, hold judgment, respond respectfully. Planning your reply while they talk is the opposite of listening.",
        },
        {
          id: "soft-listening-clarify-first-q2",
          prompt: "Which sentence is an example of reflecting back?",
          options: [
            "\"That's easy, we'll do it.\"",
            "\"So you need overdue orders, filterable by branch, exported to Excel every Monday, is that right?\"",
            "\"We did something similar for another client.\"",
            "\"Let me tell you how we usually do it.\"",
          ],
          correctIndex: 1,
          explanation: "Repeating the request in your own words catches misunderstandings while they are free to fix.",
        },
        {
          id: "soft-listening-clarify-first-q3",
          prompt: "According to Zenger and Folkman, the best listeners act like:",
          options: ["A sponge that absorbs everything silently", "A trampoline: they ask questions, make it safe, and build on what was said", "A recorder that captures every word", "A judge who evaluates each point"],
          correctIndex: 1,
          explanation: "Good listening is more than staying quiet; it helps the other person think.",
        },
        {
          id: "soft-listening-clarify-first-q4",
          prompt: "Why do follow-up questions work so well, according to Brooks and John?",
          options: [
            "They make the meeting longer",
            "They show you heard the answer, get better information and build rapport",
            "They let you change the topic",
            "They are easier to ask",
          ],
          correctIndex: 1,
          explanation: "Follow-up questions prove you listened and dig deeper into the real need.",
        },
        {
          id: "soft-listening-clarify-first-q5",
          prompt: "A client asks for \"a dashboard\". What should you do before estimating?",
          options: [
            "Estimate a standard dashboard with charts",
            "Ask about the goal, the users, the edge cases, what is out of scope and the deadline",
            "Copy a dashboard from another project",
            "Ask for double the time to be safe",
          ],
          correctIndex: 1,
          explanation: "\"Dashboard\" can mean many things. Clarify before you build, or the estimate is for the wrong thing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-listening-clarify-first-q6",
          prompt: "Which is an open question?",
          options: ["\"Is Excel the only format you need?\"", "\"So the report runs on Monday?\"", "\"What should happen when a payment fails?\"", "\"Is the limit 50 rows?\""],
          correctIndex: 2,
          explanation: "Open questions explore; the others are closed questions that confirm a detail.",
        },
        {
          id: "soft-listening-clarify-first-q7",
          prompt: "A junior developer worries that asking many questions will make them look inexperienced. What does this lesson say?",
          options: [
            "They are right; seniors never ask",
            "A short list of good questions makes you look more senior, not less",
            "Only PMs should ask questions",
            "Ask questions only after the work is done",
          ],
          correctIndex: 1,
          explanation: "Good clarifying questions are a sign of experience: they prevent wasted work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-listening-clarify-first-q8",
          prompt: "In a discovery call, which questions get more reliable answers? (Select all that apply.)",
          options: [
            "\"How do you handle this today?\"",
            "\"What happened the last time it went wrong?\"",
            "\"Would you use a feature that does X?\"",
            "\"Wouldn't it be great if the app did everything automatically?\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Ask about past behaviour and real problems, not imagined features or leading questions.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-listening-clarify-first-q9",
          prompt: "What is the right order for open and closed questions when clarifying a request?",
          options: ["Closed first, then open", "Open first to understand, then closed to lock in details", "Only closed questions", "Only open questions"],
          correctIndex: 1,
          explanation: "Explore first, then confirm.",
        },
      ],
      practice: {
        kind: "write",
        variant: "general",
        prompt:
          "Before you estimate the request below, write the five clarifying questions you would send the client. Number them. Make each one specific to this request.",
        context:
          "Client message: \"Hi team, can you add a 'notifications' feature to our clinic booking app? Patients keep missing appointments. We'd like it in the next sprint if possible.\"",
        wordLimit: 160,
        rubric: [
          { id: "goal", label: "Goal and users", description: "Asks what the notifications should achieve and for whom (patients, staff), e.g. reminders before appointments.", weight: 1 },
          { id: "channel", label: "Channel and timing", description: "Asks which channel (SMS, email, push) and when reminders go out (e.g. 24 hours before).", weight: 1 },
          { id: "edge", label: "Unusual cases", description: "Asks about at least one edge case: cancellations or reschedules, patients without a phone or email, opt-out, time zones.", weight: 1 },
          { id: "scope", label: "Scope and deadline", description: "Asks what is out of scope or what 'next sprint' must include, and any cost or provider constraints (SMS costs).", weight: 1 },
          { id: "specific", label: "Specific and clear", description: "Five numbered, specific, open or confirming questions; no generic 'please send requirements'.", weight: 1 },
        ],
        sampleAnswer:
          "1. Is the main goal appointment reminders for patients, or should staff get notifications too (for example, new bookings)?\n2. Which channels do you want: SMS, email, app push, or a mix? Do you already have an SMS provider?\n3. When should reminders go out: for example, 24 hours and 2 hours before the appointment?\n4. What should happen when an appointment is cancelled or moved, and should patients be able to opt out?\n5. For the next sprint, is a first version with SMS reminders only enough, with other channels later?",
      },
    },
  ],
} satisfies Module;
