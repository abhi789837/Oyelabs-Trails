import type { Module } from "@/types/curriculum";

const V = "2026-10-05T10:00:00Z";

export default {
  id: "soft-feedback",
  trackId: "soft",
  name: "Giving and receiving feedback",
  description:
    "Feedback that helps: Situation, Behaviour, Impact (SBI), asking about intent, kind and specific code review comments, and receiving feedback without getting defensive.",
  refs: [
    { label: "Center for Creative Leadership: Closing the gap between intent and impact (SBII)", url: "https://www.ccl.org/articles/leading-effectively-articles/closing-the-gap-between-intent-vs-impact-sbii/", kind: "article", verifiedAt: V },
    { label: "Mind Tools: Situation-Behavior-Impact Feedback Tool", url: "https://www.mindtools.com/ay86376/situation-behavior-impact-feedback-tool", kind: "docs", verifiedAt: V },
  ],
  topics: [
    {
      id: "soft-feedback-sbi",
      moduleId: "soft-feedback",
      trackId: "soft",
      title: "Feedback with SBI: situation, behaviour, impact",
      summary:
        "Feedback is how a team gets better, but vague feedback (\"your code is messy\", \"great job!\") does not help anyone change. The SBI model from the Center for Creative Leadership makes feedback specific and fair. Situation: when and where it happened (\"In yesterday's client demo...\"). Behaviour: what the person did, described as something you could see or hear, not a judgment about them (\"...you skipped the login step and went straight to the dashboard...\"). Impact: the effect it had (\"...so the client asked twice how users sign in, and we lost five minutes\").\n\nCCL adds a fourth step, intent: ask what the person was hoping to achieve (\"What were you aiming for there?\"). People judge themselves by their intent and others by their impact; asking closes that gap and turns feedback into a conversation, not a verdict. Often there was a good reason you did not know about.\n\nLeeAnn Renninger's research on great feedback fits the same pattern: start with a micro-yes question (\"Do you have a few minutes for some ideas on the demo?\"), give a data point instead of a blur word (\"you skipped the login step\" rather than \"it was confusing\"), say the impact, and end with a question so the other person can respond. Positive feedback uses SBI too: \"In the code review, you explained why you chose the queue, which saved me an hour of reading\" teaches far more than \"nice work\".\n\nReceiving feedback is a skill as well. Listen to the end, say thank you, ask for an example if it is vague, and separate the facts from how they feel. You do not have to agree on the spot; you can say \"Let me think about that.\" In code review, comment on the code, not the person, explain why, and mark what is a must-fix and what is a suggestion.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Mind Tools: Situation-Behavior-Impact Feedback Tool", url: "https://www.mindtools.com/ay86376/situation-behavior-impact-feedback-tool", kind: "docs", verifiedAt: V },
        { label: "Center for Creative Leadership: Closing the gap between intent and impact (SBII)", url: "https://www.ccl.org/articles/leading-effectively-articles/closing-the-gap-between-intent-vs-impact-sbii/", kind: "article", verifiedAt: V },
      ],
      video: {
        title: "The secret to giving great feedback (The Way We Work)",
        channel: "TED (LeeAnn Renninger)",
        url: "https://www.youtube.com/watch?v=wtl5UrrgU8c",
        videoId: "wtl5UrrgU8c",
        durationLabel: "5:02",
        verifiedAt: V,
      },
      alternateVideos: [
        {
          title: "How to Lead With Radical Candor",
          channel: "TED (Kim Scott)",
          url: "https://www.youtube.com/watch?v=vmxHUiiHgNk",
          videoId: "vmxHUiiHgNk",
          durationLabel: "15:24",
          verifiedAt: V,
        },
      ],
      sections: [
        {
          heading: "For engineers",
          body:
            "PR comments are written feedback, read without your tone of voice. Comment on the code, not the person: \"This query runs inside the loop, so a page with 50 orders makes 50 database calls\" is SBI in one line. Say why, suggest a fix, and label it: \"must fix\", \"suggestion\" or \"question\". Praise good choices specifically. When you receive a review, assume good intent, ask for an example if a comment is unclear, and reply to every comment.",
        },
        {
          heading: "For PMs and BD",
          body:
            "Give feedback soon after the event, in private, and with SBI. When a client gives harsh feedback about the team, thank them, ask for a specific example, and separate the facts from the frustration before you promise anything. Asking a teammate about their intent before you judge (\"What was the plan for the demo order?\") often shows a reason you missed.",
        },
        {
          heading: "SBI examples",
          body:
            "Vague: \"Your stand-up updates are too long.\"\n\nSBI: \"In this morning's stand-up (situation), you walked through each file you changed (behaviour), so the stand-up ran ten minutes over and two people missed their next call (impact). What were you hoping the team would get from the detail? (intent)\"\n\nPositive SBI: \"In the client call today, you explained the delay with the new date first, so the client stayed calm and agreed the plan in two minutes.\"",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "soft-feedback-sbi-q1",
          prompt: "What do the letters in SBI stand for?",
          options: ["Situation, Behaviour, Impact", "Summary, Background, Idea", "Skill, Bias, Improvement", "Start, Body, Index"],
          correctIndex: 0,
          explanation: "Situation (when and where), Behaviour (what they did), Impact (the effect).",
        },
        {
          id: "soft-feedback-sbi-q2",
          prompt: "Which is a description of behaviour, not a judgment?",
          options: ["\"You were careless.\"", "\"You skipped the login step and went straight to the dashboard.\"", "\"You don't care about the client.\"", "\"You're always confusing.\""],
          correctIndex: 1,
          explanation: "Behaviour is something you could see or hear. The others are judgments about the person.",
        },
        {
          id: "soft-feedback-sbi-q3",
          prompt: "Why does CCL add a step that asks about intent?",
          options: [
            "To make the feedback longer",
            "People judge themselves by intent and others by impact; asking closes that gap and often reveals a reason you missed",
            "To avoid giving feedback",
            "Because impact does not matter",
          ],
          correctIndex: 1,
          explanation: "Asking \"What were you aiming for?\" turns feedback into a conversation.",
        },
        {
          id: "soft-feedback-sbi-q4",
          prompt: "Which PR comment is best?",
          options: [
            "\"This is bad.\"",
            "\"Who wrote this??\"",
            "\"Must fix: this query runs inside the loop, so 50 orders make 50 database calls. Could we load them in one query before the loop?\"",
            "\"I would never do it this way.\"",
          ],
          correctIndex: 2,
          explanation: "It describes the code (not the person), says the impact, suggests a fix and labels the severity.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-feedback-sbi-q5",
          prompt: "Which are part of LeeAnn Renninger's feedback pattern? (Select all that apply.)",
          options: ["A micro-yes question to start", "A data point instead of a blur word", "The impact", "A question at the end", "A list of everything the person did wrong this year"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Micro-yes, data point, impact, question. Saving up a year of complaints is the opposite of timely feedback.",
        },
        {
          id: "soft-feedback-sbi-q6",
          prompt: "Why is \"great job!\" weak positive feedback?",
          options: [
            "Positive feedback is not needed",
            "It does not say what was good, so the person cannot repeat it; specific SBI praise teaches more",
            "It is too long",
            "It should be given only in writing",
          ],
          correctIndex: 1,
          explanation: "Specific praise (situation, behaviour, impact) tells the person what to keep doing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-feedback-sbi-q7",
          prompt: "You receive a review comment you think is wrong. What is a good response?",
          options: [
            "Ignore it",
            "Thank them, ask for an example or the reason, and discuss; you do not have to agree on the spot",
            "Reply angrily",
            "Rewrite everything to avoid discussion",
          ],
          correctIndex: 1,
          explanation: "Listen, thank, ask for specifics, separate facts from feelings, then decide.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-feedback-sbi-q8",
          prompt: "When and where should you usually give critical feedback to a teammate? (Select all that apply.)",
          options: ["Soon after the event", "In private", "In front of the client", "Months later in a review"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Timely and private keeps it useful and fair.",
        },
        {
          id: "soft-feedback-sbi-q9",
          prompt: "What labels help a PR author know what to act on?",
          options: ["\"must fix\", \"suggestion\", \"question\"", "\"red\", \"blue\", \"green\"", "No labels; they should guess", "\"urgent\" on every comment"],
          correctIndex: 0,
          explanation: "Labelling severity separates blocking issues from preferences.",
        },
      ],
      practice: {
        kind: "write",
        variant: "general",
        prompt:
          "Write a PR review comment for your teammate Dev using SBI (situation, behaviour, impact), and end with a question about intent or a suggested fix. Keep it kind and specific.",
        context:
          "Dev's pull request adds the order history page. In the controller, Dev fetches the list of orders, then for each order makes a separate database call to load its items. On the test account with 200 orders the page takes 6 seconds to load. The rest of the PR is clean and well tested.",
        wordLimit: 120,
        rubric: [
          { id: "situation", label: "Situation", description: "Points to where in the PR (the order history controller / the loop that loads items).", weight: 1 },
          { id: "behaviour", label: "Behaviour, not judgment", description: "Describes what the code does (one database call per order inside the loop) without judging Dev.", weight: 1.5 },
          { id: "impact", label: "Impact", description: "States the effect: 200 orders mean 200 extra calls and a 6-second page load.", weight: 1.5 },
          { id: "next", label: "Question or fix", description: "Asks about intent or suggests a fix (load all items in one query, or eager-load), and labels it, e.g. 'must fix'.", weight: 1 },
          { id: "kind", label: "Kind and specific", description: "Respectful; may note what is good about the PR specifically.", weight: 0.5 },
        ],
        sampleAnswer:
          "Must fix: in the order history controller, the loop loads each order's items with a separate database call. On the test account with 200 orders that is 200 extra queries, and the page takes about 6 seconds to load. Could we load all the items in one query before the loop (or eager-load them with the orders)? Was there a reason to load them one by one? The rest of the PR looks great, and the tests are really thorough.",
      },
    },
  ],
} satisfies Module;
