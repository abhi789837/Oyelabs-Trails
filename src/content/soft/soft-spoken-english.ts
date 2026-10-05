import type { Module } from "@/types/curriculum";

const V = "2026-10-05T10:00:00Z";

export default {
  id: "soft-spoken-english",
  trackId: "soft",
  name: "Spoken English at work",
  description:
    "Speaking English clearly at work: being understood on the first try, simple structure for every answer, checking understanding, and the phrases that keep a call moving. Your English level is about how easily people understand you, never your accent.",
  refs: [
    { label: "Council of Europe: CEFR Companion Volume (2020, PDF)", url: "https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4", kind: "spec", verifiedAt: V },
    { label: "British Council LearnEnglish: Business English", url: "https://learnenglish.britishcouncil.org/business-english", kind: "docs", verifiedAt: V },
  ],
  topics: [
    {
      id: "soft-english-clear-at-work",
      moduleId: "soft-spoken-english",
      trackId: "soft",
      title: "Speaking English clearly at work",
      summary:
        "At an agency, most of your spoken English happens on calls: the daily stand-up, a design review with a client in another country, a quick huddle with a teammate. The goal is not to sound like a native speaker. The goal is that the listener understands you on the first try, without effort. That is how English levels are judged too: by how much work the listener has to do, not by your accent. An accent that people can follow never lowers your level.\n\nEnglish levels describe what you can do. At A2 you can give short, simple answers about familiar work, with help from the listener. At B1 you can get the main point across in familiar work situations, with some pauses. At B2 you can explain your work clearly and give an opinion with reasons, without much searching for words. At C1 you speak fluently and precisely and choose the right style for a client or a teammate. Each level is a mix of five things: range (how many words and patterns you have), accuracy (how correct), fluency (how smooth), interaction (how well you take turns and check understanding) and coherence (how well your ideas link).\n\nThe fastest way to sound clearer is structure, not vocabulary. Say the main point first, in one short sentence, then add one or two details, then stop. Short sentences are easier to say correctly and easier to follow. Slow down a little: speaking fast makes small mistakes and an accent harder to follow, and does not make you sound more fluent.\n\nThe most useful skill is checking understanding. Repeat back what you heard (\"So you want the export as CSV, not Excel?\"), ask the other person to repeat when you did not catch something, and confirm next steps at the end. A short pause to think is fine; silence while you search for a perfect word is worse than a simple word that works.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Council of Europe: CEFR Companion Volume (2020, PDF)", url: "https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4", kind: "spec", verifiedAt: V },
        { label: "British Council LearnEnglish: Business English", url: "https://learnenglish.britishcouncil.org/business-english", kind: "docs", verifiedAt: V },
      ],
      video: {
        title: "Working with someone new? - 36 - English at Work",
        channel: "BBC Learning English",
        url: "https://www.youtube.com/watch?v=i5KWMkGsPOk",
        videoId: "i5KWMkGsPOk",
        durationLabel: "6:58",
        verifiedAt: V,
      },
      alternateVideos: [
        {
          title: "How to Speak So That People Want to Listen",
          channel: "TED (Julian Treasure)",
          url: "https://www.youtube.com/watch?v=eIho2S0ZahI",
          videoId: "eIho2S0ZahI",
          durationLabel: "9:58",
          verifiedAt: V,
        },
      ],
      sections: [
        {
          heading: "For engineers",
          body:
            "Your most common spoken moments are the stand-up, explaining a bug, and asking a question in a call. Prepare the first sentence of each before the call: \"Yesterday I finished the login API. Today I am starting the password reset. I am blocked on the SMTP keys.\" When you explain a bug, say what the user sees first, then the cause, then the fix.\n\nUseful phrases: \"Could you repeat the last part?\", \"Let me check I understood: ...\", \"I'll come back to you on that by 4 pm\", \"Can I share my screen to show you?\". If you do not know an answer, say so and give a time: that sounds more professional than guessing.",
        },
        {
          heading: "For PMs and BD",
          body:
            "Clients hear your English as a signal of control. A calm, simple sentence (\"The release is on track for Friday; one risk is the payment sandbox\") builds more trust than a long, fast answer. On client calls, summarise decisions at the end out loud (\"So we agreed: you send the logo files by Wednesday, we share the build on Friday\") and follow up in writing.\n\nWhen a client speaks fast or with an accent you find hard, it is fine to ask them to slow down or repeat. Repeating back the key point protects both sides from a misunderstanding that costs a week.",
        },
        {
          heading: "Practise in 60 seconds",
          body:
            "A good spoken answer at work has three parts: the main point in one sentence, one or two supporting details, and a close (a question, a next step, or \"that's all from me\"). Record yourself answering \"What are you working on this week?\" in under 60 seconds. Listen back once and check three things: was the main point in the first sentence, were the sentences short, and would someone outside your team understand every word?",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "soft-english-clear-at-work-q1",
          prompt: "What decides your English level at work, according to how English levels are judged?",
          options: [
            "How close your accent is to a native speaker",
            "How easily the listener understands you, across range, accuracy, fluency, interaction and coherence",
            "How many rare words you use",
            "How fast you speak",
          ],
          correctIndex: 1,
          explanation: "Levels are about how much effort the listener needs and what you can do. An accent people can follow never lowers your level.",
        },
        {
          id: "soft-english-clear-at-work-q2",
          prompt: "Which description fits B1?",
          options: [
            "Short, simple answers about familiar work, with help from the listener",
            "Gets the main point across in familiar work situations, with some pauses",
            "Explains work clearly and gives opinions with reasons, without much searching for words",
            "Fluent and precise, choosing the right style for each audience",
          ],
          correctIndex: 1,
          explanation: "The first is A2, the third is B2 and the fourth is C1.",
        },
        {
          id: "soft-english-clear-at-work-q3",
          prompt: "Which of these make you easier to understand on a call? (Select all that apply.)",
          options: [
            "Saying the main point first, in one short sentence",
            "Slowing down a little",
            "Repeating back what you heard to check it",
            "Speaking faster so you sound more fluent",
            "Waiting in silence until you find the perfect word",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Structure, a slightly slower pace and checking understanding all lower the listener's effort. Speed and long silences make it harder.",
        },
        {
          id: "soft-english-clear-at-work-q4",
          prompt: "A teammate from another office says your English is \"fine but the accent is strong\". They understood everything. What does this mean for your English level?",
          options: [
            "Your level drops one step because of the accent",
            "Nothing: an accent that people can follow does not lower your level",
            "You should stop speaking on calls",
            "You need to change your accent before you can reach B2",
          ],
          correctIndex: 1,
          explanation: "The level is judged on how easily people understand you. Accent features can remain at every level, including C1.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-english-clear-at-work-q5",
          prompt: "A client in the US speaks quickly and you miss the date they mentioned. What is the best move?",
          options: [
            "Nod and guess the date later",
            "Ask them to repeat it, then repeat it back: \"So the launch is the 14th, correct?\"",
            "Wait for the meeting notes",
            "Ask a teammate after the call",
          ],
          correctIndex: 1,
          explanation: "Asking to repeat and then repeating back is normal, professional behaviour. Guessing a date is how a week gets lost.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-english-clear-at-work-q6",
          prompt: "What is the fastest way to sound clearer, according to this lesson?",
          options: ["Learn more advanced vocabulary", "Use structure: main point first, one or two details, then stop", "Use more idioms", "Speak without pausing"],
          correctIndex: 1,
          explanation: "Structure helps more than vocabulary. Short sentences are easier to say correctly and easier to follow.",
        },
        {
          id: "soft-english-clear-at-work-q7",
          prompt: "Which of these are the parts that make up an English level? (Select all that apply.)",
          options: ["Range", "Accuracy", "Fluency", "Interaction", "Native accent"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Range, accuracy, fluency, interaction and coherence. Accent is not one of them; only how easily you are understood matters.",
        },
        {
          id: "soft-english-clear-at-work-q8",
          prompt: "You are asked a question in a client call and you do not know the answer. What should you say?",
          options: [
            "Guess, so you do not look unsure",
            "Say you will check and give a time: \"I'll come back to you on that by 4 pm\"",
            "Change the subject",
            "Stay silent until someone else answers",
          ],
          correctIndex: 1,
          explanation: "Saying you do not know and giving a time sounds more professional than guessing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-english-clear-at-work-q9",
          prompt: "What are the three parts of a good short spoken answer at work?",
          options: [
            "Greeting, apology, details",
            "Main point in one sentence, one or two details, a close",
            "Background, history, conclusion",
            "Question, joke, summary",
          ],
          correctIndex: 1,
          explanation: "Main point first, a little support, then a close such as a next step or a question.",
        },
      ],
      practice: {
        kind: "write",
        variant: "general",
        prompt:
          "Write what you would say (as a script) when a new teammate from the client's side joins the project call and asks: \"Hi, nice to meet you. What do you work on here?\" Keep it to what you could say in under 60 seconds.",
        context: "You are on a team building a booking app. Use your real role, or imagine one: for example, you build the backend APIs and you are working on payments this week.",
        wordLimit: 130,
        rubric: [
          { id: "point", label: "Main point first", description: "The first sentence says who they are and their role in one short sentence.", weight: 1.5 },
          { id: "details", label: "One or two details", description: "Adds one or two concrete details (what they are working on now, how they can help) without a long history.", weight: 1 },
          { id: "close", label: "A close", description: "Ends with a question, an offer or a next step (e.g. 'Ping me in the project channel if you need anything on the API').", weight: 1 },
          { id: "plain", label: "Short, plain sentences", description: "Sentences are short and easy to say aloud; no jargon a client teammate would not know.", weight: 1 },
        ],
        sampleAnswer:
          "Hi, nice to meet you too. I'm Arjun, and I build the backend for the booking app. This week I'm working on payments, so the checkout will talk to Stripe. If you have questions about the APIs or the data, I'm the right person. Feel free to message me in the project channel any time.",
      },
      speak: {
        kind: "speak",
        title: "Introduce yourself to a new teammate",
        prompt: "A new teammate from the client's side joins the call and asks: \"What do you work on here?\" Introduce yourself and your current work.",
        audience: "team",
        prepSec: 20,
        maxSec: 60,
        lookFor: ["Says who they are and their role in the first sentence", "Gives one or two concrete details about current work", "Ends with an offer, a question or a next step", "Easy to follow on the first listen; accent is never counted"],
        writtenFallback: "Write what you would say when a new teammate from the client's side asks \"What do you work on here?\" Keep it to what you could say in under 60 seconds.",
        explanation: "A clear introduction puts the role first, adds a little detail and closes with an offer. The listener should understand it on the first try.",
      },
    },
  ],
} satisfies Module;
