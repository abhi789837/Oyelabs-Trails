import type { Module } from "@/types/curriculum";

const V = "2026-10-05T10:00:00Z";

export default {
  id: "soft-teamwork",
  trackId: "soft",
  name: "Teamwork and collaboration",
  description:
    "What makes teams work: psychological safety, dependability, clear roles and working agreements, and the everyday habits of a good teammate on a project that changes every few months.",
  refs: [
    { label: "Google re:Work: Understand team effectiveness", url: "https://rework.withgoogle.com/intl/en/guides/understand-team-effectiveness", kind: "docs", verifiedAt: V },
    { label: "Atlassian Team Playbook: Working Agreements", url: "https://www.atlassian.com/team-playbook/plays/working-agreements", kind: "docs", verifiedAt: V },
  ],
  topics: [
    {
      id: "soft-teamwork-safety-and-agreements",
      moduleId: "soft-teamwork",
      trackId: "soft",
      title: "Psychological safety and working agreements",
      summary:
        "Agency teams form and re-form all the time: a new client, a new mix of developers, designers, QA and a PM, often across time zones. Google's Project Aristotle studied what makes teams effective and found that who is on the team matters less than how the team works together. It named five dynamics, in order of importance: psychological safety, dependability, structure and clarity, meaning, and impact.\n\nPsychological safety came first. It means people feel safe to take interpersonal risks: to ask a question, admit a mistake, say \"I don't understand\" or disagree, without being embarrassed or punished. Amy Edmondson, who coined the term, points out that it is not about being nice or lowering standards. It is what lets problems surface early, while they are cheap. On a team without it, the developer who broke the build stays quiet, and the client finds the bug.\n\nYou build safety with small habits. Ask questions yourself, so others feel they can. Thank people for raising problems, even unwelcome ones. When something goes wrong, ask \"what happened and how do we prevent it?\" instead of \"who did this?\". Invite quiet people in (\"Sana, what do you think?\").\n\nStructure and clarity come from working agreements: a short list the team writes together about how it works. Atlassian's Working Agreements play covers things like core hours across time zones, response times in chat, how code review works, what \"done\" means, and how decisions are made. Writing it down early stops many small conflicts, because nobody has to guess. Dependability, the second dynamic, is the simplest: do what you said, when you said, or say early that you cannot.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Google re:Work: Understand team effectiveness", url: "https://rework.withgoogle.com/intl/en/guides/understand-team-effectiveness", kind: "docs", verifiedAt: V },
        { label: "Atlassian Team Playbook: Working Agreements", url: "https://www.atlassian.com/team-playbook/plays/working-agreements", kind: "docs", verifiedAt: V },
      ],
      video: {
        title: "How to turn a group of strangers into a team",
        channel: "TED (Amy Edmondson)",
        url: "https://www.youtube.com/watch?v=3boKz0Exros",
        videoId: "3boKz0Exros",
        durationLabel: "13:07",
        verifiedAt: V,
      },
      alternateVideos: [
        {
          title: "Building a psychologically safe workplace",
          channel: "TEDx Talks (Amy Edmondson)",
          url: "https://www.youtube.com/watch?v=LhoLuui9gX8",
          videoId: "LhoLuui9gX8",
          durationLabel: "11:27",
          verifiedAt: V,
        },
      ],
      sections: [
        {
          heading: "For engineers",
          body:
            "Be the teammate who makes problems visible early: \"I think my migration broke staging, looking now\" in the team channel is worth more than a quiet fix two hours later. Share what you learn, offer help when you finish early, and review PRs promptly, because your teammate is waiting. When you disagree on a technical choice, argue for the idea with reasons, then commit to the team's decision.",
        },
        {
          heading: "For PMs and BD",
          body:
            "At project start, run a short working-agreements session: core hours, channels, response times, review rules, definition of done, and how decisions are made. Revisit it in retrospectives. Run blameless reviews when something goes wrong, and model the behaviour you want: admit your own mistakes and thank people who raise risks.",
        },
        {
          heading: "A starter working agreement",
          body:
            "- Core hours: 2 pm to 6 pm IST overlap with the client.\n- Chat: reply within 2 hours in core hours; urgent issues by call.\n- Code review: within one working day; two approvals for main.\n- Done means: merged, tested on staging, ticket updated.\n- Decisions: written in the project channel with the owner's name.\n- Problems: raised the same day, no blame.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "soft-teamwork-safety-and-agreements-q1",
          prompt: "What did Project Aristotle find mattered most for team effectiveness?",
          options: ["Who is on the team", "How the team works together, starting with psychological safety", "The size of the office", "Seniority of the members"],
          correctIndex: 1,
          explanation: "Team dynamics mattered more than team composition, and psychological safety came first.",
        },
        {
          id: "soft-teamwork-safety-and-agreements-q2",
          prompt: "Which are among the five dynamics Project Aristotle named? (Select all that apply.)",
          options: ["Psychological safety", "Dependability", "Structure and clarity", "Meaning", "Free lunches"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Psychological safety, dependability, structure and clarity, meaning, and impact.",
        },
        {
          id: "soft-teamwork-safety-and-agreements-q3",
          prompt: "What is psychological safety?",
          options: [
            "Everyone is always nice and never disagrees",
            "People feel safe to ask, admit mistakes and disagree without being embarrassed or punished",
            "Lower standards so nobody feels pressure",
            "Job security",
          ],
          correctIndex: 1,
          explanation: "It is not about being nice or lowering standards; it lets problems surface early.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-teamwork-safety-and-agreements-q4",
          prompt: "Staging breaks after a deploy. Which question builds psychological safety?",
          options: ["\"Who did this?\"", "\"What happened, and how do we prevent it?\"", "\"Why can't anyone test properly?\"", "Saying nothing and fixing it yourself"],
          correctIndex: 1,
          explanation: "Blameless questions get problems raised early next time.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-teamwork-safety-and-agreements-q5",
          prompt: "You think your migration broke staging, but you are not sure yet. What should you do?",
          options: [
            "Fix it quietly and hope nobody noticed",
            "Say so in the team channel now (\"I think my migration broke staging, looking now\")",
            "Wait until you are sure",
            "Blame the last deploy",
          ],
          correctIndex: 1,
          explanation: "Making problems visible early is what safety is for.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-teamwork-safety-and-agreements-q6",
          prompt: "What is a working agreement?",
          options: [
            "The employment contract",
            "A short list the team writes together about how it works: hours, response times, reviews, done, decisions",
            "The client's statement of work",
            "A list of tasks",
          ],
          correctIndex: 1,
          explanation: "It creates structure and clarity, so nobody has to guess.",
        },
        {
          id: "soft-teamwork-safety-and-agreements-q7",
          prompt: "Which belong in a working agreement? (Select all that apply.)",
          options: ["Core hours across time zones", "Chat response times", "How code review works", "What done means", "Each person's salary"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Agreements cover how the team works, not private matters.",
        },
        {
          id: "soft-teamwork-safety-and-agreements-q8",
          prompt: "You disagree with the team's choice of state library. After a fair discussion, the team picks the other option. What now?",
          options: ["Keep arguing in every PR", "Commit to the team's decision", "Use your library anyway", "Stop reviewing PRs"],
          correctIndex: 1,
          explanation: "Argue for the idea with reasons, then commit to the decision.",
        },
        {
          id: "soft-teamwork-safety-and-agreements-q9",
          prompt: "Which habits help build psychological safety? (Select all that apply.)",
          options: ["Asking questions yourself", "Thanking people who raise problems", "Inviting quiet people in", "Mocking simple questions"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Small daily habits build safety; mocking questions destroys it.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You have just joined a new client project: two developers in India, a designer in Poland and a PM. In the first week, reviews sit for days, people message each other privately about decisions, and a junior developer hides a bug they caused until QA finds it.",
        steps: [
          {
            id: "s1",
            question: "What is the most useful first step for the team?",
            options: [
              "Agree a short working agreement together: review times, where decisions live, core hours, what done means",
              "Ask the PM to tell everyone to work harder",
              "Do all the reviews yourself",
              "Escalate to management",
            ],
            correctIndex: 0,
            explanation: "Writing down how the team works gives structure and clarity and removes guessing.",
          },
          {
            id: "s2",
            question: "In the retrospective, how should the team talk about the hidden bug?",
            options: [
              "Ask what happened and how to make it easier to raise problems early, without blame",
              "Name the junior developer so it doesn't happen again",
              "Skip it to avoid an awkward moment",
              "Add a rule that bugs are punished",
            ],
            correctIndex: 0,
            explanation: "Blameless discussion builds the psychological safety that gets problems raised early.",
          },
          {
            id: "s3",
            question: "What can you personally do next week to help?",
            options: [
              "Raise your own mistakes openly, review PRs within a day, and post decisions in the project channel",
              "Wait for others to change first",
              "Only talk to the PM",
              "Work in private to avoid conflict",
            ],
            correctIndex: 0,
            explanation: "Model the behaviour: visible problems, prompt reviews, decisions where others can see them.",
          },
        ],
      },
    },
  ],
} satisfies Module;
