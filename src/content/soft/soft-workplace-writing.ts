import type { Module } from "@/types/curriculum";

const V = "2026-10-05T10:00:00Z";

export default {
  id: "soft-workplace-writing",
  trackId: "soft",
  name: "Workplace writing (email, chat, docs)",
  description:
    "Writing that gets read and acted on: the bottom line first, a subject line that says the action, active voice, short words, and a calm tone even when the other side is angry.",
  refs: [
    { label: "Digital.gov: Writing for understanding (plain language)", url: "https://digital.gov/guides/plain-language/writing", kind: "spec", verifiedAt: V },
    { label: "Harvard Business Review: How to Write Email with Military Precision", url: "https://hbr.org/2016/11/how-to-write-email-with-military-precision", kind: "article", verifiedAt: V },
  ],
  topics: [
    {
      id: "soft-writing-bottom-line-first",
      moduleId: "soft-workplace-writing",
      trackId: "soft",
      title: "Email, chat and docs that get read",
      summary:
        "Most of your work is read, not heard: emails to clients, messages in the team chat, pull request descriptions, short docs. The reader is busy, often in another time zone, and often reading in their second language. They decide in a few seconds whether to act now or later. So the most important rule is: put the bottom line up front (BLUF). The first line says what you need or what has happened. The details come after, for those who need them.\n\nThe subject line does the same job for email. It states the topic and the action needed, for example \"Booking app: staging ready for review, feedback needed by Thu\". A subject like \"Update\" or \"Question\" tells the reader nothing. Some teams start subjects with ACTION, DECISION or FYI so readers can sort their inbox.\n\nPlain language makes the body easy to read. Use the active voice (\"We fixed the bug\", not \"The bug was fixed\"). Avoid hidden verbs: write \"we analyse\", not \"we conduct an analysis\". Use short words, short sentences and short paragraphs, and write for one specific reader. One topic per email: when an email has three topics, the reply usually covers only one. If you have more than one question, number them so the reply can answer \"1 yes, 2 no\".\n\nTone matters most when things go wrong. Stay calm and specific: what happened, what you are doing, when they will hear next. Never mirror an angry email; thank them for raising it, accept what is fair, and move to facts and next steps. Chat is shorter than email but follows the same rules: the ask in the first message, not \"hi\" and then a wait. Anything written can be forwarded, so write as if the client will read it.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Digital.gov: Writing for understanding (plain language)", url: "https://digital.gov/guides/plain-language/writing", kind: "spec", verifiedAt: V },
        { label: "Harvard Business Review: How to Write Email with Military Precision", url: "https://hbr.org/2016/11/how-to-write-email-with-military-precision", kind: "article", verifiedAt: V },
      ],
      video: {
        title: "8 Email Etiquette Tips - How to Write Better Emails at Work",
        channel: "Harvard Business Review",
        url: "https://www.youtube.com/watch?v=1XctnF7C74s",
        videoId: "1XctnF7C74s",
        durationLabel: "7:00",
        verifiedAt: V,
      },
      alternateVideos: [
        {
          title: "How to Write an Email (No, Really)",
          channel: "TEDx Talks (Victoria Turk)",
          url: "https://www.youtube.com/watch?v=SBTojgEHl90",
          videoId: "SBTojgEHl90",
          durationLabel: "15:44",
          verifiedAt: V,
        },
      ],
      sections: [
        {
          heading: "For engineers",
          body:
            "Pull request descriptions, bug reports and chat messages are workplace writing too. A good PR description starts with what changed and why in one or two lines, then how to test it, then anything risky. A good chat question includes the context in the first message: \"Hi Priya, the payment webhook returns 401 on staging since this morning. Did the Stripe keys change? I'm blocked on checkout testing.\" Never send only \"hi\" and wait: the other person cannot help until they know the ask.",
        },
        {
          heading: "For PMs and BD",
          body:
            "Client emails carry the most risk. Write a fresh email for the client instead of forwarding an internal thread, which may contain internal estimates or frustration. When a deadline slips, say it in the first line, give the new date and the reason in one sentence, and say what you are doing about it. Change the subject line when the topic changes, so the decision can be found later.",
        },
        {
          heading: "Rewriting a rude message",
          body:
            "Before: \"As I already told you twice, the bug is on your side. Check your server.\"\n\nAfter: \"Thanks for the details. We checked our side and the request reaches your server, which returns a 500 error (log attached). Could your team check the server logs for 10:42 UTC? Happy to join a call if that helps.\"\n\nThe rewrite keeps the facts, removes blame, gives evidence and makes one clear ask.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "soft-writing-bottom-line-first-q1",
          prompt: "What does BLUF mean for a work email?",
          options: [
            "Put the bottom line (what you need or what happened) in the first line",
            "Put the background first so the reader understands",
            "End with the most important point",
            "Bold every important word",
          ],
          correctIndex: 0,
          explanation: "Bottom line up front: the first line says what you need or what has happened. Details follow for those who need them.",
        },
        {
          id: "soft-writing-bottom-line-first-q2",
          prompt: "Which subject line is best?",
          options: ["Update", "Question", "Booking app: staging ready for review, feedback needed by Thu", "Re: Re: Fwd: notes"],
          correctIndex: 2,
          explanation: "It states the topic and the action needed, with a deadline.",
        },
        {
          id: "soft-writing-bottom-line-first-q3",
          prompt: "Which of these follow plain-language rules? (Select all that apply.)",
          options: [
            "\"We fixed the bug.\"",
            "\"We analyse the logs.\"",
            "\"The bug was fixed by the team.\"",
            "\"We conducted an analysis of the logs.\"",
            "Short sentences and short paragraphs",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 4],
          explanation: "Active voice and no hidden verbs. \"Was fixed by\" is passive; \"conducted an analysis\" hides the verb \"analyse\".",
        },
        {
          id: "soft-writing-bottom-line-first-q4",
          prompt: "You send a client one email asking them to approve the design and confirm the launch date. They reply \"Approved, thanks!\" What most likely went wrong?",
          options: [
            "The client is careless",
            "Two asks were in one paragraph, so they answered only one; number them",
            "The email was too short",
            "You should have used chat",
          ],
          correctIndex: 1,
          explanation: "When two asks share a paragraph, readers answer one. Numbered questions get numbered answers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-writing-bottom-line-first-q5",
          prompt: "A client sends an angry email blaming your team for a bug that is actually on their server. What is the best reply?",
          options: [
            "\"As I already told you, the bug is on your side.\"",
            "Thank them, share the evidence calmly, and make one clear ask (check their server logs at a given time)",
            "Ignore it until they calm down",
            "Forward it to the whole team with a comment",
          ],
          correctIndex: 1,
          explanation: "Never mirror anger. Keep the facts, remove blame, give evidence and one clear ask.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-writing-bottom-line-first-q6",
          prompt: "Why is sending just \"hi\" in chat and waiting a bad habit?",
          options: [
            "It is too informal",
            "The other person cannot help until they know the ask, so it wastes a round trip",
            "Chat tools block short messages",
            "It is fine; it is polite",
          ],
          correctIndex: 1,
          explanation: "Put the context and the ask in the first message so the reader can act straight away.",
        },
        {
          id: "soft-writing-bottom-line-first-q7",
          prompt: "To save time, a teammate wants to forward the whole internal thread to the client. What is the risk?",
          options: [
            "None, clients like transparency",
            "The client may read internal estimates, frustration or comments about them; write a fresh email instead",
            "The email will be too long to send",
            "Forwarding is blocked by email servers",
          ],
          correctIndex: 1,
          explanation: "Anything written can be forwarded. Write a fresh client email rather than exposing internal discussion.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "soft-writing-bottom-line-first-q8",
          prompt: "What should a good pull request description start with?",
          options: ["A list of every file changed", "What changed and why, in one or two lines", "A thank-you to the reviewers", "The ticket history"],
          correctIndex: 1,
          explanation: "What and why first, then how to test, then anything risky.",
        },
        {
          id: "soft-writing-bottom-line-first-q9",
          prompt: "When a deadline slips, what belongs in the first line of the client email? (Select all that apply.)",
          options: ["That the date has moved", "The new date", "A long apology", "The full history of the work"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Say the slip and the new date first; the reason and what you are doing come next in one or two sentences.",
        },
      ],
      practice: {
        kind: "write",
        variant: "email",
        prompt:
          "Rewrite the developer's draft below into a polite, clear reply to the client. Keep the facts. Write a subject line and the body.",
        context:
          "Client email (Mark, product owner): \"This is the third time the login is broken. Your team clearly doesn't test anything. I need this fixed TODAY.\"\n\nDeveloper's draft reply: \"Login is not broken on our side. Your SSO certificate expired yesterday, we told you about this last week. Renew it and it will work.\"\n\nFacts: the client's SSO certificate expired yesterday. Your team emailed a reminder last Tuesday. Once renewed, login works within minutes. Your team can join a call today to help their IT person.",
        wordLimit: 170,
        rubric: [
          { id: "subject", label: "Subject line", description: "States the topic and the action, e.g. 'Login issue: SSO certificate renewal needed today'.", weight: 1 },
          { id: "bluf", label: "Bottom line first", description: "The first lines say what is causing the problem and what will fix it.", weight: 1.5 },
          { id: "tone", label: "Calm, no blame", description: "Thanks or acknowledges the frustration once; does not say 'we told you' or blame; stays factual.", weight: 1.5 },
          { id: "ask", label: "Clear ask and offer", description: "Asks the client to renew the certificate and offers a call today with their IT person.", weight: 1 },
          { id: "plain", label: "Plain language", description: "Short sentences, active voice, no jargon the product owner would not know.", weight: 1 },
        ],
        sampleAnswer:
          "Subject: Login issue: SSO certificate renewal needed today\n\nHi Mark,\n\nI'm sorry login is down again; I understand how disruptive that is. We found the cause: the SSO certificate on your side expired yesterday. As soon as it is renewed, login will work again within minutes.\n\nCould your IT team renew the certificate today? We are happy to join a call with them this afternoon to help and to test login straight away.\n\nWe will also add an automatic reminder 30 days before the next expiry so this does not catch anyone out again.\n\nBest regards,\nAnita",
      },
    },
  ],
} satisfies Module;
