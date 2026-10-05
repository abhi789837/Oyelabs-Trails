import type { Module } from "@/types/curriculum";

const V = "2026-10-05T10:00:00Z";

export default {
  id: "soft-client-team-communication",
  trackId: "soft",
  name: "Client and team communication",
  description:
    "Talking with clients and teammates so that nobody is surprised: agree how and when you communicate, give bad news early with a plan, stay calm in hard conversations, and confirm decisions in writing.",
  refs: [
    { label: "Atlassian Team Playbook: Stakeholder Communications Plan", url: "https://www.atlassian.com/team-playbook/plays/stakeholder-communications-plan", kind: "docs", verifiedAt: V },
    { label: "GitLab Handbook: Communication", url: "https://handbook.gitlab.com/handbook/communication/", kind: "docs", verifiedAt: V },
  ],
  topics: [
    {
      id: "soft-comms-no-surprises",
      moduleId: "soft-client-team-communication",
      trackId: "soft",
      title: "No surprises: talking with clients and teammates",
      summary:
        "Most client problems at an agency are not technical. They are surprises: a delay the client hears about on the deadline day, a feature that works differently from what they pictured, a question that sat unanswered for three days. Good communication is mostly about removing surprises.\n\nStart by agreeing how you will communicate. Atlassian's stakeholder communication plan maps who needs to know what, then agrees the channel (chat, email, call), the cadence (daily, weekly) and the content (status, decisions, risks) up front. When everyone knows where updates appear and when, fewer things fall through the gaps.\n\nGive bad news early, and give it with a plan. The pattern is simple: what happened, what it means for them, what you are doing, and when they will hear next. \"The payment integration will be two days late because the provider changed their API. The release moves from Monday to Wednesday. We have a fix in progress and will confirm by Friday noon.\" Early bad news with a plan builds trust; late bad news destroys it.\n\nIn hard conversations, manage your own reaction first. Notice when you feel defensive, slow down, and listen to understand before you answer. Celeste Headlee's advice applies: be present, do not multitask, use open questions, go with the flow, say \"I don't know\" when you don't, do not equate your experience with theirs, do not repeat yourself, stay out of the weeds, listen, and be brief. After any call where something was decided, confirm it in writing within the day, so both sides have the same record. With teammates, the same rules hold: say what you need clearly, say early when you are stuck, and keep decisions where others can find them.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Atlassian Team Playbook: Stakeholder Communications Plan", url: "https://www.atlassian.com/team-playbook/plays/stakeholder-communications-plan", kind: "docs", verifiedAt: V },
        { label: "GitLab Handbook: Communication", url: "https://handbook.gitlab.com/handbook/communication/", kind: "docs", verifiedAt: V },
      ],
      video: {
        title: "Celeste Headlee: 10 ways to have a better conversation",
        channel: "TED",
        url: "https://www.youtube.com/watch?v=R1vskiVDwl4",
        videoId: "R1vskiVDwl4",
        durationLabel: "11:44",
        verifiedAt: V,
      },
      alternateVideos: [
        {
          title: "How to Control Your Emotions During a Difficult Conversation",
          channel: "Harvard Business Review",
          url: "https://www.youtube.com/watch?v=OntE3tCaUR0",
          videoId: "OntE3tCaUR0",
          durationLabel: "6:39",
          verifiedAt: V,
        },
      ],
      sections: [
        {
          heading: "For engineers",
          body:
            "You may be on a client call when a question comes to you. Answer the part you know, say clearly what you will check, and give a time. If you find a problem that will affect the date, tell your PM the same day, with what you know so far; do not wait until you have the full answer. In team chat, keep decisions in the project channel, not in private messages, so the next person can find them.",
        },
        {
          heading: "For PMs and BD",
          body:
            "Set the communication plan at kickoff: who gets the weekly status, which channel is for urgent issues, the overlap hours across time zones, and expected reply times. When you explain a delay on a call, lead with the new date and the plan, then the reason in one sentence, then the options if there are any. Send a written summary after the call with decisions, owners and dates.",
        },
        {
          heading: "Bad news script",
          body:
            "1. What happened, in one sentence.\n2. What it means for them (date, cost, scope).\n3. What we are doing about it.\n4. Options, if they have a choice.\n5. When they will hear from us next.\n\nExample: \"The app store review rejected our build because of a privacy label. The launch moves from Tuesday to Thursday. We have fixed the label and resubmitted today. We will update you tomorrow by 11 am your time.\"",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "soft-comms-no-surprises-q1",
          prompt: "According to this lesson, what causes most client problems at an agency?",
          options: ["Bugs", "Surprises: delays, mismatched expectations, unanswered questions", "Slow servers", "Price"],
          correctIndex: 1,
          explanation: "Good communication is mostly about removing surprises.",
        },
        {
          id: "soft-comms-no-surprises-q2",
          prompt: "What does a stakeholder communication plan agree up front? (Select all that apply.)",
          options: ["Who needs to know what", "The channel", "The cadence", "The content", "Each developer's salary"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Map the people, then agree channel, cadence and content.",
        },
        {
          id: "soft-comms-no-surprises-q3",
          prompt: "Which delay message follows the bad-news pattern best?",
          options: [
            "\"Sorry, there were some issues, we'll try our best.\"",
            "\"The payment integration will be two days late because the provider changed their API. Release moves from Monday to Wednesday. A fix is in progress; we'll confirm by Friday noon.\"",
            "\"The developer made a mistake, so it's late.\"",
            "Saying nothing until Monday",
          ],
          correctIndex: 1,
          explanation: "What happened, what it means, what we are doing, when they hear next. No blame, no vagueness.",
        },
        {
          id: "soft-comms-no-surprises-q4",
          prompt: "On Tuesday you find a problem that will probably delay Friday's release, but you do not know by how much yet. What should you do?",
          options: [
            "Wait until you know the exact delay",
            "Tell your PM the same day with what you know so far, so the client hears early",
            "Work all night and hope",
            "Tell the client on Friday",
          ],
          correctIndex: 1,
          explanation: "Early bad news with partial facts beats late bad news with full facts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-comms-no-surprises-q5",
          prompt: "A client gets angry on a call and you feel yourself getting defensive. What is the best first step?",
          options: [
            "Defend the team straight away",
            "Notice the reaction, slow down and listen to understand before answering",
            "End the call",
            "Agree to everything they ask",
          ],
          correctIndex: 1,
          explanation: "Manage your own reaction first; then listen, then answer with facts and next steps.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-comms-no-surprises-q6",
          prompt: "Which of these come from Celeste Headlee's 10 ways to have a better conversation? (Select all that apply.)",
          options: ["Don't multitask", "Use open questions", "Say \"I don't know\" when you don't", "Repeat your point until they agree"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "One of her rules is the opposite: don't repeat yourself.",
        },
        {
          id: "soft-comms-no-surprises-q7",
          prompt: "After a call where the client agreed to move a feature to the next phase, what should happen?",
          options: [
            "Nothing, everyone heard it",
            "Confirm the decision in writing within the day",
            "Wait for the client to write it down",
            "Mention it at the next monthly meeting",
          ],
          correctIndex: 1,
          explanation: "A written record means both sides remember the same decision.",
        },
        {
          id: "soft-comms-no-surprises-q8",
          prompt: "Where should a team decision about the API format be recorded?",
          options: ["In a private message between two developers", "In the project channel or doc where others can find it", "Nowhere, it's obvious", "In your personal notes"],
          correctIndex: 1,
          explanation: "Keep decisions where the next person can find them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-comms-no-surprises-q9",
          prompt: "A client asks you a technical question on a call and you only know half the answer. What do you say?",
          options: [
            "Guess the other half",
            "Answer the part you know, say what you will check, and give a time",
            "Say nothing",
            "Ask them to email the PM instead",
          ],
          correctIndex: 1,
          explanation: "Clear about what you know, clear about what you will check, and when.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You are the developer on a food-delivery app for a client in Australia. On Wednesday you find that the maps provider has changed its pricing, and the live-tracking feature due on Friday needs two more days to switch providers. Your PM is on leave today and the client has a call with you at 4 pm.",
        steps: [
          {
            id: "s1",
            question: "When should the client hear about the delay?",
            options: [
              "On today's 4 pm call, with the new date and the plan",
              "On Friday, when the feature was due",
              "Only after the PM is back",
              "Never, if you can work over the weekend",
            ],
            correctIndex: 0,
            explanation: "Early bad news with a plan builds trust. Waiting turns a two-day delay into a broken promise.",
          },
          {
            id: "s2",
            question: "How do you open the topic on the call?",
            options: [
              "\"Live tracking will be two days late: Sunday instead of Friday. The maps provider changed its pricing, so we are switching to another provider. Everything else is on track.\"",
              "\"So, a lot happened this week, let me tell you the whole story...\"",
              "\"The maps provider messed up, it's not our fault.\"",
              "\"We might have a small issue, nothing to worry about.\"",
            ],
            correctIndex: 0,
            explanation: "Lead with the impact and the new date, give the reason in one sentence, no blame, no vagueness.",
          },
          {
            id: "s3",
            question: "The client asks if there is any way to keep Friday. What do you do?",
            options: [
              "Offer the honest option: release Friday without live tracking and add it on Sunday, and confirm the choice in writing after the call",
              "Promise Friday anyway",
              "Say no and move on",
              "Tell them to ask the PM next week",
            ],
            correctIndex: 0,
            explanation: "Give real options when they exist, then confirm the decision in writing within the day.",
          },
        ],
      },
      speak: {
        kind: "speak",
        title: "Explain a delay to a client on a call",
        prompt: "On a client call, explain that a feature due on Friday will be two days late because a third-party provider changed its pricing. Give the new date, the plan and when they will hear next.",
        audience: "client",
        prepSec: 20,
        maxSec: 90,
        lookFor: ["Leads with the impact and the new date", "Gives the reason in one sentence, without blame", "Says what the team is doing and offers an option if there is one", "Says when the client will hear next", "Calm and easy to follow; accent is never counted"],
        writtenFallback: "Write what you would say on the call to explain that the Friday feature will be two days late because a provider changed its pricing: the new date, the plan and when they will hear next.",
        explanation: "Good bad news is early, starts with the impact, gives a plan and says when the next update comes.",
      },
    },
  ],
} satisfies Module;
