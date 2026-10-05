import type { Module } from "@/types/curriculum";

const V = "2026-10-05T10:00:00Z";

export default {
  id: "soft-explain-simply",
  trackId: "soft",
  name: "Explaining technical work simply",
  description:
    "Explaining technical work to people who do not share your background: start from what they need, lead with the impact, swap jargon for everyday words and comparisons, and check they understood.",
  refs: [
    { label: "Google Technical Writing One: Audience", url: "https://developers.google.com/tech-writing/one/audience", kind: "docs", verifiedAt: V },
    { label: "Lucid: How to explain technical ideas to a non-technical audience", url: "https://www.lucid.co/blog/how-to-explain-technical-ideas-to-a-non-technical-audience", kind: "article", verifiedAt: V },
  ],
  topics: [
    {
      id: "soft-explain-for-your-audience",
      moduleId: "soft-explain-simply",
      trackId: "soft",
      title: "Explaining for your audience",
      summary:
        "Engineers are often asked \"Why is this taking longer?\" or \"What is an API, and why do we need one?\" by people who do not share their background: clients, PMs, sales, a new teammate. Google's technical writing course puts it simply: what you need to explain is the knowledge your audience needs minus what they already know. So you start from them, not from the technology.\n\nThe main trap is the curse of knowledge. Once you know something, it is hard to remember what it was like not to know it, so you skip steps and use words that feel normal to you (\"endpoint\", \"cache\", \"migration\", \"deploy\") but mean nothing to the listener. A second trap is idioms and slang, which confuse readers and listeners whose first language is not English.\n\nA simple method works for most explanations. First, know the audience: what do they already know, and what decision do they need to make? Second, lead with the impact: what this means for them (\"Customers will be able to pay by card from Monday\") before how it works. Third, drop the jargon, or explain a term once in everyday words. Fourth, use a comparison or a picture: an API is like a waiter who takes your order to the kitchen and brings back the food; a cache is like keeping the most-used files on your desk instead of in the archive. Fifth, invite questions and check understanding.\n\nAdjust the depth to the person. A client deciding on budget needs the impact, the risk and the options, not the architecture. A new developer needs the how. Explaining the same idea at several levels, from a child to an expert, is a good exercise: each level keeps what matters to that listener and drops the rest. If you cannot explain it simply, you may not understand it well enough yet.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Google Technical Writing One: Audience", url: "https://developers.google.com/tech-writing/one/audience", kind: "docs", verifiedAt: V },
        { label: "Lucid: How to explain technical ideas to a non-technical audience", url: "https://www.lucid.co/blog/how-to-explain-technical-ideas-to-a-non-technical-audience", kind: "article", verifiedAt: V },
      ],
      video: {
        title: "Computer Scientist Explains Machine Learning in 5 Levels of Difficulty",
        channel: "WIRED",
        url: "https://www.youtube.com/watch?v=5q87K1WaoFI",
        videoId: "5q87K1WaoFI",
        durationLabel: "26:08",
        verifiedAt: V,
      },
      alternateVideos: [
        {
          title: "LEADERSHIP LAB: The Craft of Writing Effectively",
          channel: "UChicago Social Sciences (Larry McEnerney)",
          url: "https://www.youtube.com/watch?v=vtIzMaLkCaM",
          videoId: "vtIzMaLkCaM",
          durationLabel: "1:21:51",
          verifiedAt: V,
        },
      ],
      sections: [
        {
          heading: "For engineers",
          body:
            "When a PM or client asks why something is slow or late, answer in this order: the impact (\"The report will take about 3 seconds instead of 30\"), the cause in one everyday sentence (\"The database was reading every order to find this month's ones\"), and what happens next. Keep the technical detail ready in case they ask, but do not lead with it.\n\nWatch for words you use every day that the listener does not: deploy, merge, endpoint, staging, migration, cache, refactor. Either swap them (\"put live\" for deploy, \"test site\" for staging) or explain them once.",
        },
        {
          heading: "For PMs and BD",
          body:
            "You often translate between developers and clients. Ask the developer \"What does this mean for the client?\" until you get an answer in impact words: time, money, risk, what users can do. Then pass that on. When a client asks a technical question you cannot answer, do not guess: say you will check with the team and come back by a set time.",
        },
        {
          heading: "Useful comparisons",
          body:
            "- API: a waiter who carries requests between your app and another system and brings back the answer.\n- Cache: keeping the most-used files on your desk instead of walking to the archive each time.\n- Database index: the index at the back of a book, so you do not read every page.\n- Staging: a full rehearsal of the show before the audience arrives.\n\nA comparison is a door, not the whole house: use it to start, then check it did not mislead.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "soft-explain-for-your-audience-q1",
          prompt: "According to Google's technical writing course, what do you need to explain?",
          options: [
            "Everything you know about the topic",
            "What the audience needs to know minus what they already know",
            "Only the architecture",
            "The history of the technology",
          ],
          correctIndex: 1,
          explanation: "Start from the audience: their needs minus their current knowledge.",
        },
        {
          id: "soft-explain-for-your-audience-q2",
          prompt: "What is the curse of knowledge?",
          options: [
            "Knowing too little to explain",
            "Once you know something, it is hard to remember not knowing it, so you skip steps and use jargon",
            "Forgetting what you learned",
            "Clients who know more than you",
          ],
          correctIndex: 1,
          explanation: "Experts skip steps and use words that feel normal to them but not to the listener.",
        },
        {
          id: "soft-explain-for-your-audience-q3",
          prompt: "A client asks why the new report is late. Which answer leads with the impact?",
          options: [
            "\"We had to refactor the ORM layer and add a composite index.\"",
            "\"The report will be ready Thursday and will load in 3 seconds instead of 30. We found the database was reading every order; we are fixing that now.\"",
            "\"It's complicated, the backend is hard.\"",
            "\"The developer is still working on it.\"",
          ],
          correctIndex: 1,
          explanation: "Impact first (date, speed), then the cause in everyday words, then what happens next.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-explain-for-your-audience-q4",
          prompt: "Which steps are part of the method in this lesson? (Select all that apply.)",
          options: ["Know the audience", "Lead with the impact", "Use a comparison or a picture", "Invite questions and check understanding", "Show the code first"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Know the audience, lead with impact, drop jargon, use a comparison, invite questions. Code is detail for later, if they ask.",
        },
        {
          id: "soft-explain-for-your-audience-q5",
          prompt: "Why are idioms and slang risky in explanations at an agency?",
          options: [
            "They are too formal",
            "They confuse readers and listeners whose first language is not English",
            "They make the explanation too short",
            "They are not allowed in email",
          ],
          correctIndex: 1,
          explanation: "Many clients and teammates work in their second language; idioms often do not translate.",
        },
        {
          id: "soft-explain-for-your-audience-q6",
          prompt: "A client deciding on next quarter's budget asks about a proposed rewrite. What do they need most?",
          options: ["A diagram of the new architecture", "The impact, the risk and the options", "The list of libraries", "The code review comments"],
          correctIndex: 1,
          explanation: "Match depth to the decision: a budget decision needs impact, risk and options, not architecture.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-explain-for-your-audience-q7",
          prompt: "Which comparison from the lesson explains a database index?",
          options: ["A waiter carrying orders", "Files on your desk", "The index at the back of a book", "A rehearsal before the show"],
          correctIndex: 2,
          explanation: "An index lets you find the page without reading every page. The waiter is an API, the desk is a cache, the rehearsal is staging.",
        },
        {
          id: "soft-explain-for-your-audience-q8",
          prompt: "Which words should you swap or explain once when talking to a non-technical client? (Select all that apply.)",
          options: ["deploy", "staging", "migration", "Monday", "customers"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Deploy, staging and migration are everyday words for engineers but jargon for most clients.",
        },
        {
          id: "soft-explain-for-your-audience-q9",
          prompt: "You used a comparison and the client now thinks the API \"stores all our data like a waiter's notebook\". What should you do?",
          options: [
            "Nothing, comparisons are always approximate",
            "Check what they understood and correct it: a comparison is a door, not the whole house",
            "Use a more technical term instead",
            "Send them the documentation",
          ],
          correctIndex: 1,
          explanation: "Use the comparison to start, then check it did not mislead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "write",
        variant: "explain",
        prompt:
          "The client, who runs a chain of bakeries, asks: \"The developers keep saying we need an API for the delivery partner. What is that, and why do we need one?\" Answer in at most 3 sentences, in plain words.",
        context: "Background: the bakery's ordering app must send each new delivery order to the delivery partner's system automatically and get back the driver's arrival time. Today staff copy orders by hand into the partner's website.",
        wordLimit: 90,
        rubric: [
          { id: "correct", label: "Correct", description: "Explains that an API is a way for two systems to send requests and answers to each other automatically.", weight: 1.5 },
          { id: "impact", label: "Impact for the bakery", description: "Says what it means for them: orders reach the delivery partner automatically, no copying by hand, and they get the arrival time back.", weight: 1.5 },
          { id: "plain", label: "No jargon", description: "No unexplained technical words (endpoint, JSON, integration layer); a comparison is welcome.", weight: 1 },
          { id: "short", label: "Three sentences or fewer", description: "The whole answer fits in three sentences.", weight: 1 },
        ],
        sampleAnswer:
          "An API is like a waiter between two systems: your ordering app hands it an order, and it carries the order to the delivery partner and brings back their answer. With it, every new delivery order goes to the partner automatically and the driver's arrival time comes back into your app. Your staff no longer copy orders by hand, which saves time and avoids mistakes.",
      },
    },
  ],
} satisfies Module;
