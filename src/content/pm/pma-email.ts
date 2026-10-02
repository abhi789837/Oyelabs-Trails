import type { Module } from "@/types/curriculum";

export default {
  id: "pma-email",
  trackId: "pm",
  name: "Email etiquette & professional writing",
  description:
    "Client and internal email for agency PMs: subject lines and structure, tone, To/CC/BCC and reply-all, attachments and signatures, Outlook features, polite chasing, writing for non-native readers, and the status, escalation and MoM emails that keep overseas clients informed.",
  refs: [
    { label: "Digital.gov: Plain language guide series", url: "https://digital.gov/guides/plain-language", kind: "spec", verifiedAt: "2026-10-02T09:35:40Z" },
    { label: "Purdue OWL: Email etiquette", url: "https://owl.purdue.edu/owl/general_writing/academic_writing/email_etiquette.html", kind: "article", verifiedAt: "2026-10-02T09:35:33Z" },
  ],
  topics: [
    // ------------------------------------------------------------------ 1
    {
      id: "pma-email-subject-structure",
      moduleId: "pma-email",
      trackId: "pm",
      title: "Subject lines and email structure",
      summary:
        "Your overseas client reads your email on a phone, between meetings, eight hours after you sent it. They decide in two seconds whether to open it now or later. The subject line and the first two lines decide that. If your Laravel release slipped and the subject says \"Update\", the client may not read it until the delay is already a surprise.\n\nA good subject line says what the email is about and what kind of action it needs. Put the project name first, then the topic, then the ask or deadline. For example: \"Acme Portal: staging build ready for UAT, feedback by Thu 14 Nov\". Words like ACTION, DECISION or FYI at the start help busy readers sort their inbox. Change the subject when the thread changes topic, so the next search finds it.\n\nThe body follows a simple order, often called BLUF (bottom line up front). First line: the purpose or the answer. Then the details the reader needs, in short paragraphs or bullets. Then the ask: who must do what. Then the deadline and what happens if it is missed. Close with one line, not three. If the email has more than one ask, number them so the reply can say \"1 yes, 2 no\".\n\nThe common mistake is writing in the order things happened: \"Yesterday we started testing, then we found an issue, then the developer looked at it...\" and putting the ask in the last line. The client stops reading before they reach it. Another mistake is one email with five unrelated topics; the reply covers one and the rest get lost. Write one topic per email, ask first, story after.\n\nYour team has a standard client email layout and subject-line format; see your team's SOP below and use it, so clients see the same shape from every Oyelabs PM.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "Digital.gov: Plain language guide series", url: "https://digital.gov/guides/plain-language", kind: "spec", verifiedAt: "2026-10-02T09:35:40Z" },
        { label: "Harvard Business Review: How to Write Email with Military Precision", url: "https://hbr.org/2016/11/how-to-write-email-with-military-precision", kind: "article", verifiedAt: "2026-10-02T09:35:46Z" },
        { label: "Purdue OWL: Email etiquette", url: "https://owl.purdue.edu/owl/general_writing/academic_writing/email_etiquette.html", kind: "article", verifiedAt: "2026-10-02T09:35:33Z" },
        { label: "Asana: Effective communication workplace: 12 tips & styles", url: "https://asana.com/resources/effective-communication-workplace", kind: "docs", verifiedAt: "2026-10-02T10:08:00Z" },
      ],
      video: {
        title: "8 Email Etiquette Tips - How to Write Better Emails at Work",
        channel: "Harvard Business Review",
        url: "https://www.youtube.com/watch?v=1XctnF7C74s",
        videoId: "1XctnF7C74s",
        verifiedAt: "2026-10-02T09:35:57Z",
      },
      alternateVideos: [
        {
          title: "How to Write Effective Email Subject Lines",
          channel: "Learn English with Rebecca · engVid",
          url: "https://www.youtube.com/watch?v=cG7fUjEjeAw",
          videoId: "cG7fUjEjeAw",
          verifiedAt: "2026-10-02T09:35:59Z",
        },
      ],
      sop: [
        {
          title: "Our client email layout and subject-line format",
          prompt:
            "[Oyelabs SOP – admin to fill] The subject-line format every PM uses (project code, topic, ACTION/DECISION/FYI tag, deadline), the standard body layout for client emails, and one good example email.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-email-subject-structure-q1",
          prompt: "You need the client to approve the UAT build on staging by Thursday. Which subject line is best?",
          options: [
            "Update",
            "Acme Portal: UAT build ready on staging, approval needed by Thu 14 Nov",
            "URGENT!!! Please check",
            "Re: Re: Fwd: kickoff call notes",
          ],
          correctIndex: 1,
          explanation:
            "It names the project, the topic, the action and the deadline. The others tell the reader nothing, shout, or hide a new topic inside an old thread.",
        },
        {
          id: "pma-email-subject-structure-q2",
          prompt: "What should the first line of a client email contain?",
          options: [
            "A long greeting and an apology for the length of the email",
            "The purpose or bottom line: what you need or what has happened",
            "The full history of the issue in date order",
            "Your signature",
          ],
          correctIndex: 1,
          explanation: "BLUF: the reader should know why the email exists before they scroll. The history can come after, for those who need it.",
        },
        {
          id: "pma-email-subject-structure-q3",
          prompt: "Which of these belong in a well-structured request email? (Select all that apply.)",
          options: [
            "A clear ask that names who must act",
            "A deadline, and what happens if it is missed",
            "Numbered items when there is more than one question",
            "Three unrelated topics so the client sees everything at once",
            "The ask hidden in the last sentence",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A named ask, a deadline with a consequence and numbered questions make replies fast and complete. Mixing topics and burying the ask are the two classic failures.",
        },
        {
          id: "pma-email-subject-structure-q4",
          prompt:
            "A long thread about the login page has turned into a discussion about the payment gateway. You are about to reply with the payment decision. What should you do?",
          options: [
            "Reply in the same thread with the same subject",
            "Start a new email (or change the subject) so the payment decision has its own clear subject",
            "Reply-all and add \"see below\"",
            "Wait for the next status call instead",
          ],
          correctIndex: 1,
          explanation:
            "A decision filed under \"Re: login page\" is impossible to find in three months when someone asks why the gateway was chosen. New topic, new subject.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-email-subject-structure-q5",
          prompt:
            "Your email to a US client asks two things: approve the design, and confirm the go-live date. The client replies \"Approved, thanks!\" What is the most likely cause?",
          options: [
            "The client is being difficult",
            "Both asks were buried in one paragraph, so the reply answered only the one they noticed",
            "The client did not receive the email",
            "Clients never answer two questions",
          ],
          correctIndex: 1,
          explanation:
            "When two asks share a paragraph, readers answer one. Number them (1. Approve design, 2. Confirm go-live date) and the reply usually mirrors the numbers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-email-subject-structure-q6",
          prompt: "Why do tags such as ACTION, DECISION or FYI at the start of a subject help?",
          options: [
            "They make the email look more formal",
            "They tell the reader at a glance whether they must act, decide or just read",
            "They bypass spam filters",
            "They are required by Outlook",
          ],
          correctIndex: 1,
          explanation: "Tags let a busy client triage the inbox in seconds. They are a convention, not a technical rule.",
        },
      ],
      practice: {
        kind: "write",
        variant: "email",
        prompt:
          "Rewrite the developer's note below as a client email to Sarah, the product owner at a UK client. The React web app's staging build is ready for her UAT. You need her feedback by Thursday 5 pm UK time so the release on Monday stays on track. Write a subject line and the body.",
        context:
          "Dev note (internal): \"hey, so we finally merged the checkout + profile stuff into staging last night after fixing the cart bug, also the email templates are in. client should test checkout, profile edit, order emails. if they don't come back by thu we can't make monday. link is staging.acmeshop.dev, test card in the doc.\"",
        wordLimit: 180,
        rubric: [
          { id: "subject", label: "Subject line", description: "Names the project, the topic (UAT on staging) and the deadline, e.g. 'Acme Shop: staging ready for UAT, feedback by Thu 5 pm UK'.", weight: 1 },
          { id: "bluf", label: "Bottom line first", description: "The first line says the build is ready for UAT and that feedback is needed by Thursday 5 pm UK time.", weight: 1.5 },
          { id: "ask", label: "Clear, numbered ask", description: "Lists what to test (checkout, profile edit, order emails) and where (staging link, test card details), so Sarah can act without asking questions.", weight: 1.5 },
          { id: "consequence", label: "Deadline and consequence", description: "States the deadline with the time zone and explains that later feedback puts Monday's release at risk, without sounding like a threat.", weight: 1 },
          { id: "tone", label: "Client tone", description: "Professional and friendly; no internal slang ('cart bug', 'merged'), no blame, short sentences.", weight: 1 },
        ],
        sampleAnswer:
          "Subject: Acme Shop: staging ready for UAT, feedback by Thu 5 pm UK\n\nHi Sarah,\n\nThe new checkout and profile features are ready for your testing on staging. Could you send us your feedback by Thursday at 5 pm UK time?\n\nPlease test:\n1. Checkout, using the test card in the UAT guide (attached link)\n2. Editing your profile\n3. The order confirmation emails\n\nStaging link: staging.acmeshop.dev\n\nIf we have your feedback by Thursday, we can fix anything you find and keep the release on Monday. If you need more time, let me know today and we will agree a new date together.\n\nThanks,\nPriya",
      },
    },
    // ------------------------------------------------------------------ 2
    {
      id: "pma-email-tone-client-vs-internal",
      moduleId: "pma-email",
      trackId: "pm",
      title: "Tone: client vs internal",
      summary:
        "The same fact needs a different tone for different readers. \"Payment API is broken again, backend guy is on it\" is fine in the team's Teams chat. Sent to a client in Australia, it sounds careless and blames a person. The client reads tone as a signal of control: calm, specific words say \"we have this\"; casual or emotional words say \"we are struggling\".\n\nClient tone is polite, calm and specific. Say what happened, what you are doing, and when they will hear next. Use \"we\", never a named developer, when something goes wrong: the agency owns delivery. Avoid slang, internal nicknames, emojis and jokes, because humour does not cross cultures well. Avoid over-apologising too: one clear apology plus a plan reads as confident; five apologies read as panic. Internal tone can be shorter and more direct, but it is still written down and can be forwarded, so keep it professional and never complain about the client in writing.\n\nA useful habit is to read your draft as the client. Ask: does any word blame someone? Does any word promise something we have not agreed (\"definitely\", \"guaranteed\")? Is there a word the client might not know (\"hotfix\", \"merge\", \"PR\")? Then replace it. \"We found an issue in the payment step and are fixing it now. We will update you by 3 pm your time\" is calm, specific and keeps a promise you can keep.\n\nThe classic mistake is forwarding an internal thread to a client to \"save time\". The client then reads the developer's frustration, the internal estimate that was later cut, or a comment about their own team. Always write a fresh email for the client. The second mistake is mirroring an angry client's tone. Stay calm, thank them for raising it, and move to facts and next steps.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "Microsoft Learn: Global communications - Microsoft Style Guide", url: "https://learn.microsoft.com/en-us/style-guide/global-communications/", kind: "docs", verifiedAt: "2026-10-02T09:35:44Z" },
        { label: "Purdue OWL: Tone in business writing", url: "https://owl.purdue.edu/owl/subject_specific_writing/professional_technical_writing/tone_in_business_writing.html", kind: "article", verifiedAt: "2026-10-02T09:35:33Z" },
        { label: "Grammarly: Tone in Email: Tips on Striking a Professional Tone", url: "https://www.grammarly.com/blog/emailing/email-tone/", kind: "article", verifiedAt: "2026-10-02T09:38:43Z" },
        { label: "Harvard Business Review: How to Write Email with Military Precision", url: "https://hbr.org/2016/11/how-to-write-email-with-military-precision", kind: "article", verifiedAt: "2026-10-02T09:35:46Z" },
      ],
      video: {
        title: "13 Must-see Tips for Perfect Email Writing",
        channel: "Grammarly",
        url: "https://www.youtube.com/watch?v=JuJRJRpenTk",
        videoId: "JuJRJRpenTk",
        verifiedAt: "2026-10-02T09:35:55Z",
      },
      alternateVideos: [
        {
          title: "8 Email Etiquette Tips - How to Write Better Emails at Work",
          channel: "Harvard Business Review",
          url: "https://www.youtube.com/watch?v=1XctnF7C74s",
          videoId: "1XctnF7C74s",
          verifiedAt: "2026-10-02T09:35:57Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-email-tone-client-vs-internal-q1",
          prompt: "Which sentence has the right tone for a client email about a bug found in UAT?",
          options: [
            "Rahul broke the payment flow again, sorry!!",
            "We found an issue in the payment step. We are fixing it now and will update you by 3 pm your time.",
            "This is a minor thing, don't worry about it.",
            "As we told you before, the payment provider is unreliable.",
          ],
          correctIndex: 1,
          explanation: "It is calm, specific, uses \"we\" and gives a time for the next update. The others blame, dismiss or argue.",
        },
        {
          id: "pma-email-tone-client-vs-internal-q2",
          prompt: "Which words should you usually remove from a client email? (Select all that apply.)",
          options: [
            "Internal jargon such as \"hotfix\", \"merge\" or \"PR\" without explanation",
            "A developer's name when describing a mistake",
            "\"Guaranteed\" or \"definitely\" for things not yet agreed",
            "A clear date for the next update",
            "\"Thank you for flagging this\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Jargon confuses, names shift blame away from the agency, and absolute words create promises. A date for the next update and a thank-you both help.",
        },
        {
          id: "pma-email-tone-client-vs-internal-q3",
          prompt:
            "A client sends an angry email in capital letters about a missed demo. What tone should your reply take?",
          options: [
            "Match their energy so they know you care",
            "Calm and factual: acknowledge the impact, take ownership, give the plan and the next update time",
            "Defend the team by listing what the client did late",
            "Wait two days until they calm down",
          ],
          correctIndex: 1,
          explanation:
            "Mirroring anger escalates. A calm reply that owns the problem and gives a plan lowers the temperature. Waiting looks like avoidance.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-email-tone-client-vs-internal-q4",
          prompt:
            "Your developer explains a delay well in an internal thread. To save time, you think about forwarding the thread to the client. What is the risk?",
          options: [
            "There is no risk; transparency is always good",
            "The client may read internal estimates, frustration or comments about their team that were never meant for them",
            "Outlook will block the forward",
            "The client will not understand the word \"forward\"",
          ],
          correctIndex: 1,
          explanation:
            "Internal threads carry context, blame and numbers that change. Write a fresh client email with only what the client needs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-email-tone-client-vs-internal-q5",
          prompt: "How many apologies does a good \"we missed the date\" client email usually need?",
          options: ["None, apologising is weak", "One clear apology, followed by facts and a plan", "One per paragraph", "As many as possible"],
          correctIndex: 1,
          explanation: "One sincere apology shows ownership. Repeated apologies read as panic and push the plan out of view.",
        },
        {
          id: "pma-email-tone-client-vs-internal-q6",
          prompt: "Why should internal emails stay professional, even though the tone can be shorter?",
          options: [
            "Because internal emails can be forwarded, quoted or end up in a client thread",
            "Because HR reads every email",
            "Because short emails are rude",
            "There is no reason; internal email can say anything",
          ],
          correctIndex: 0,
          explanation: "Anything written can travel. Never write about a client in a way you would not want them to read.",
        },
      ],
      practice: {
        kind: "write",
        variant: "email",
        prompt:
          "Rewrite this internal message as an email to Mark, the client's CTO in Sydney. The Laravel admin panel release planned for today will move to Thursday because a data export bug was found in final testing. Keep the facts, change the tone.",
        context:
          "Internal Teams message from the tech lead: \"Export to CSV is totally broken on big datasets, Amit's query times out lol. No way we ship today. Thursday maybe, if QA doesn't find more stuff. Client will freak out.\"",
        wordLimit: 160,
        rubric: [
          { id: "facts", label: "Facts kept", description: "Says the release moves from today to Thursday because an issue was found in the export feature during final testing.", weight: 1.5 },
          { id: "ownership", label: "Ownership without blame", description: "Uses 'we', names no developer, includes one clear apology.", weight: 1 },
          { id: "plan", label: "Plan and next update", description: "Explains what the team is doing and when Mark will hear next, with his time zone.", weight: 1.5 },
          { id: "tone", label: "Calm, professional tone", description: "No slang, jokes, 'lol', 'maybe' or emotional words; does not over-promise Thursday as certain if testing is still running.", weight: 1 },
        ],
        sampleAnswer:
          "Subject: Admin panel release moved to Thursday\n\nHi Mark,\n\nWe have moved today's admin panel release to Thursday. In final testing we found that the CSV export is too slow on large data sets, and we do not want to release it in that state. I am sorry for the late change.\n\nThe team is fixing the export query now, and QA will retest the full release on Wednesday. I will confirm the Thursday release time by Wednesday 5 pm Sydney time, or tell you straight away if anything changes.\n\nBest regards,\nPriya",
      },
    },
    // ------------------------------------------------------------------ 3
    {
      id: "pma-to-cc-bcc-reply-all",
      moduleId: "pma-email",
      trackId: "pm",
      title: "To / CC / BCC, reply-all and response times",
      summary:
        "The address fields are not decoration; they tell each person what you expect from them. \"To\" means: you need to act or reply. \"CC\" means: for your information, no action needed. \"BCC\" means: this person receives the email but the others cannot see that. In an agency, getting this wrong causes real trouble. Put the client's CEO in To on a routine update and they think you want them to act. Put the developer in CC on a task they own and they assume someone else is doing it.\n\nUse BCC carefully. It is right when you email many clients or external people who should not see each other's addresses, such as a release note to five separate clients. It is wrong as a secret copy: \"BCC my manager on a tough client email\" looks fine until the manager hits reply-all and the client sees it. If your manager needs to see the email, CC them openly or forward it afterwards.\n\nReply-all is a decision, not a habit. Before you press it, ask: does every person on this list need my reply? A \"Thanks!\" to fifteen people is noise. But removing the client's project lead from a decision reply is worse, because now the decision lives with one person. When you move people to BCC or drop them, say so in the first line (\"Moving the wider team to BCC\").\n\nResponse time is part of etiquette too. Clients judge an agency by how quickly it acknowledges an email, even when the full answer takes longer. A short \"Got it, I will come back with the estimate by Wednesday\" buys trust. Your team's SOP below sets the expected response times for clients and internal emails; follow those, not your own habit.\n\nThe common mistake is assuming everyone in CC has read and agreed. CC is not consent. If you need a person's decision, put them in To and ask them by name.",
      level: "beginner",
      estMinutes: 20,
      webRefs: [
        { label: "Elegant Themes: Email Etiquette: When Should You BCC, CC, or Reply-All?", url: "https://www.elegantthemes.com/blog/business/email-etiquette-when-should-you-bcc-cc-or-reply-all", kind: "docs", verifiedAt: "2026-10-02T10:06:42Z" },
        { label: "Purdue OWL: Email etiquette", url: "https://owl.purdue.edu/owl/general_writing/academic_writing/email_etiquette.html", kind: "article", verifiedAt: "2026-10-02T09:35:33Z" },
        { label: "Inbox Zero: Reply vs Reply All vs Forward: When to Use Each (Guide)", url: "https://www.getinboxzero.com/blog/post/reply-vs-reply-all-vs-forward", kind: "article", verifiedAt: "2026-10-02T10:06:51Z" },
      ],
      video: {
        title: "English for Emails: Cc and Bcc explained",
        channel: "British Council | English",
        url: "https://www.youtube.com/watch?v=ZnSfEklfo34",
        videoId: "ZnSfEklfo34",
        verifiedAt: "2026-10-02T09:35:53Z",
      },
      sop: [
        {
          title: "Our email response times",
          prompt:
            "[Oyelabs SOP – admin to fill] How fast a PM must acknowledge and fully answer client emails (and internal ones), how this works across time zones and weekends, and who covers a PM's inbox during leave.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-to-cc-bcc-reply-all-q1",
          prompt: "You need the client's product owner to approve a change request. Their CEO only wants to stay informed. Where does each go?",
          options: [
            "Both in To",
            "Product owner in To, CEO in CC",
            "CEO in To, product owner in CC",
            "Product owner in To, CEO in BCC",
          ],
          correctIndex: 1,
          explanation: "To is for the person who must act; CC is for people who should be informed. A hidden BCC to the client's own CEO would be odd and risky.",
        },
        {
          id: "pma-to-cc-bcc-reply-all-q2",
          prompt: "When is BCC the right choice? (Select all that apply.)",
          options: [
            "Sending one release announcement to several separate clients who should not see each other's addresses",
            "Inviting many external testers who do not know each other",
            "Secretly copying your manager on a tough client email",
            "Hiding the client's CTO from their own team",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "BCC protects people's addresses in group mails. Using it as a secret copy is risky: if the BCC'd person replies all, the secret is out.",
        },
        {
          id: "pma-to-cc-bcc-reply-all-q3",
          prompt:
            "You BCC'd your delivery head on a firm email to a client. The delivery head clicks reply-all to say \"Good email, they were late anyway.\" What happens?",
          options: [
            "Nothing; BCC replies are always private",
            "The client receives the comment, because reply-all from a BCC copy goes to the visible recipients",
            "Outlook blocks the reply",
            "Only you receive it",
          ],
          correctIndex: 1,
          explanation:
            "A BCC recipient who replies all writes to everyone on To and CC. This is why BCC is a poor way to keep a manager in the loop; forward the sent email instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-to-cc-bcc-reply-all-q4",
          prompt:
            "The client's tech lead is in CC on your email proposing a new API approach. Two days pass with no reply. Can you treat the approach as agreed?",
          options: [
            "Yes, silence from CC means agreement",
            "No; CC is for information. Ask the decision owner by name in To and get an explicit yes",
            "Yes, if the email was marked important",
            "Only if the tech lead opened the email",
          ],
          correctIndex: 1,
          explanation: "CC is not consent. Decisions need a named owner and an explicit answer, otherwise the disagreement appears at the demo.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-to-cc-bcc-reply-all-q5",
          prompt: "A thread has 14 people. You want to tell the sender \"Thanks, received.\" What should you do?",
          options: ["Reply-all so everyone knows", "Reply only to the sender", "Forward it to your team", "Do not answer at all"],
          correctIndex: 1,
          explanation: "A thank-you is for the sender. Reply-all with no new information is inbox noise for 13 people.",
        },
        {
          id: "pma-to-cc-bcc-reply-all-q6",
          prompt:
            "A client emails a question you cannot answer until the developer checks tomorrow. What is the best first move?",
          options: [
            "Wait until you have the full answer",
            "Acknowledge now and say when you will reply in full",
            "Forward the email to the developer and let them answer the client",
            "Answer with a guess",
          ],
          correctIndex: 1,
          explanation: "A fast acknowledgement with a promised time builds trust and stops the client chasing. Guesses become commitments.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "You are about to send the release note for version 2.3 of a client's React Native app. The client's product owner (Emma) must confirm the App Store release time; her CEO only wants to stay informed. Mark every line of the draft that is wrong.",
        segments: [
          { id: "s1", text: "To: Emma Clarke (Product Owner, client)", issue: null },
          { id: "s2", text: "CC: James Clarke (CEO, client)", issue: null },
          { id: "s3", text: "BCC: Ravi (Oyelabs delivery head) so he can see how I handle this", issue: "A secret copy to your own manager is risky; if he replies all, the client sees it. CC him openly or forward the sent email." },
          { id: "s4", text: "CC: dev-team@oyelabs (all 22 developers)", issue: "The whole developer list does not need a client release email; it exposes internal addresses and invites reply-all noise." },
          { id: "s5", text: "Subject: FYI", issue: "The subject gives no project, topic or ask, although Emma must confirm a release time." },
          { id: "s6", text: "Hi Emma,", issue: null },
          { id: "s7", text: "Version 2.3 is approved by Apple and ready to release.", issue: null },
          { id: "s8", text: "Could you confirm by Wednesday 10 am your time whether we release on Thursday at 9 am?", issue: null },
          { id: "s9", text: "James, I assume you have read and agreed to the earlier pricing email since you were in CC.", issue: "Being in CC is not agreement. Ask the decision owner for an explicit answer, in a separate email about pricing." },
          { id: "s10", text: "Best regards, Priya", issue: null },
        ],
        askExplanation: true,
      },
    },
    // ------------------------------------------------------------------ 4
    {
      id: "pma-attachments-links-signatures",
      moduleId: "pma-email",
      trackId: "pm",
      title: "Attachments, links and signatures",
      summary:
        "Files are where client emails go wrong most often. A PM attaches \"SOW_final_v3_REAL.docx\", the client edits it, a developer edits an older copy, and now there are three \"final\" versions. Or the PM attaches a 25 MB design export that bounces, or shares a link the client cannot open because it is limited to the Oyelabs domain. Each of these costs a day across time zones.\n\nPrefer links to a shared file over attachments for anything that will change, such as a PRD, an estimate sheet or a UAT log. In OneDrive or SharePoint, choose who the link works for: specific people is safest for client documents; \"anyone with the link\" means anyone the email is forwarded to. Choose view or edit on purpose. Test the link in a private browser window, or ask a colleague outside the folder to try it. Attach files only when they are final and must be kept as a record, such as a signed SOW or an invoice PDF. Name them clearly: project, document, version or date (\"AcmePortal_SOW_v2_2026-11-04.pdf\").\n\nIn the body, say what each link or file is and what you want done with it: \"The UAT checklist (link) lists 18 test cases; please mark each pass or fail by Friday.\" Never send passwords or API keys in the same email as the link or the username. Use your team's approved method for credentials.\n\nYour signature tells an overseas client who you are, your role, and how and when to reach you. Include your name, role, company, phone with country code, and your working hours with time zone, because \"call me anytime\" means nothing across a 10-hour gap. Keep it short, with no quotes or large images that turn into attachments. Your team's SOP below sets the exact signature format and the rules for sharing files and credentials; set it up once in Outlook and use it on every email.\n\nThe common mistake is the forgotten attachment: \"please find attached\" with nothing attached. Attach first, then write.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Microsoft Support: How to add and change an email signature in Outlook", url: "https://support.microsoft.com/en-us/outlook/mail/how-to-add-and-change-an-email-signature-in-outlook", kind: "docs", verifiedAt: "2026-10-02T09:38:54Z" },
        { label: "Microsoft Support: Share files and folders in Microsoft OneDrive", url: "https://support.microsoft.com/en-us/onedrive/share-files-and-folders-in-microsoft-onedrive", kind: "docs", verifiedAt: "2026-10-02T09:35:31Z" },
        { label: "Microsoft Support: Add pictures or attach files to emails in Outlook", url: "https://support.microsoft.com/en-us/outlook/mail/add-pictures-or-attach-files-to-emails-in-outlook", kind: "docs", verifiedAt: "2026-10-02T09:35:19Z" },
        { label: "Purdue OWL: Email etiquette", url: "https://owl.purdue.edu/owl/general_writing/academic_writing/email_etiquette.html", kind: "article", verifiedAt: "2026-10-02T09:35:33Z" },
      ],
      video: {
        title: "Top 20 Microsoft Outlook Tips & Tricks",
        channel: "Kevin Stratvert",
        url: "https://www.youtube.com/watch?v=edABo0VnHK8",
        videoId: "edABo0VnHK8",
        verifiedAt: "2026-10-02T09:35:57Z",
      },
      alternateVideos: [
        {
          title: "Microsoft Outlook Tutorial for Beginners",
          channel: "Kevin Stratvert",
          url: "https://www.youtube.com/watch?v=4e_ghbyXcJ0",
          videoId: "4e_ghbyXcJ0",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
      ],
      sop: [
        {
          title: "Our email signature",
          prompt:
            "[Oyelabs SOP – admin to fill] The exact signature block every PM uses (name, role, company line, phone format, working hours and time zone, logo or not, legal disclaimer if any), plus how to set it in Outlook.",
        },
        {
          title: "Sharing files and credentials with clients",
          prompt:
            "[Oyelabs SOP – admin to fill] Where client documents live (SharePoint/OneDrive folder structure), which link setting to use for clients, file-naming rules, and the approved way to share passwords, API keys and app-store logins.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-attachments-links-signatures-q1",
          prompt: "The client and your team will both keep editing the PRD over the next month. How should you share it?",
          options: [
            "Attach the Word file to every email",
            "Share one link to the file in OneDrive/SharePoint with the right people and edit rights",
            "Paste the whole PRD into the email body",
            "Send a PDF each time it changes",
          ],
          correctIndex: 1,
          explanation: "One shared file means one version. Attachments multiply copies and nobody knows which one is current.",
        },
        {
          id: "pma-attachments-links-signatures-q2",
          prompt: "When is an attachment better than a link? (Select all that apply.)",
          options: [
            "A signed SOW that must be kept as a fixed record",
            "An invoice PDF for the client's finance team",
            "A UAT log the client will update daily",
            "A sprint backlog that changes every day",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Final, fixed records suit attachments. Living documents belong behind one shared link.",
        },
        {
          id: "pma-attachments-links-signatures-q3",
          prompt:
            "You share a SharePoint link to the estimate with the client. They reply \"I get an access denied page.\" What most likely happened?",
          options: [
            "The client's browser is broken",
            "The link was set to people inside Oyelabs only, or not shared with the client's address",
            "SharePoint is down",
            "The file is too large",
          ],
          correctIndex: 1,
          explanation:
            "Organisation-only links fail for external people. Choose the right link setting and test it before you send, for example from a private window.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-attachments-links-signatures-q4",
          prompt: "What is the risk of an \"anyone with the link can edit\" setting on a client's pricing sheet?",
          options: [
            "None; it is the easiest option",
            "Anyone the email is forwarded to can open and change it, without signing in",
            "It makes the file read-only",
            "It only works inside Oyelabs",
          ],
          correctIndex: 1,
          explanation: "Anyone links travel with forwards. For commercial documents use specific people and the least access needed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-attachments-links-signatures-q5",
          prompt: "A client needs the staging admin login. What is the right approach?",
          options: [
            "Put the URL, username and password in one email",
            "Use the team's approved method for credentials, never the same email as the link and username",
            "Post it in the client's Teams channel",
            "Put the password in the subject so it is easy to find",
          ],
          correctIndex: 1,
          explanation: "One forwarded or hacked email should never contain everything needed to log in. Follow the SOP for credentials.",
        },
        {
          id: "pma-attachments-links-signatures-q6",
          prompt: "Which items belong in a PM's signature for overseas clients? (Select all that apply.)",
          options: [
            "Name and role",
            "Phone number with country code",
            "Working hours with time zone",
            "A long motivational quote",
            "Three large image banners",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Clients need who you are and when and how to reach you. Quotes add noise; large images often arrive as attachments.",
        },
        {
          id: "pma-attachments-links-signatures-q7",
          prompt: "Which file name is best for a document you attach to a client email?",
          options: ["final_final2.docx", "SOW.docx", "AcmePortal_SOW_v2_2026-11-04.pdf", "Document1.pdf"],
          correctIndex: 2,
          explanation: "Project, document, version and date make the file findable and stop version arguments.",
        },
        {
          id: "pma-attachments-links-signatures-q8",
          prompt:
            "You wrote \"Please find the updated estimate attached\" and pressed send. The client replies \"There is no attachment.\" Which habit prevents this?",
          options: [
            "Writing the body first and attaching at the end",
            "Attaching the file (or inserting the link) before writing the body, and checking before sending",
            "Never using attachments",
            "Sending a second email with the file and no explanation",
          ],
          correctIndex: 1,
          explanation:
            "Attach first, then write. Outlook can also warn you about a forgotten attachment, but the habit is more reliable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Review this email before it goes to the client's operations manager in Toronto. It shares the UAT material for a Laravel booking portal. Mark the lines with problems.",
        segments: [
          { id: "s1", text: "Subject: Booking Portal: UAT pack and staging access", issue: null },
          { id: "s2", text: "Hi Linda,", issue: null },
          { id: "s3", text: "The booking portal is ready for UAT on staging from today.", issue: null },
          { id: "s4", text: "The UAT checklist is here: [SharePoint link] (link set to Oyelabs people only)", issue: "An organisation-only link will show 'access denied' to the client. Share it with Linda's address." },
          { id: "s5", text: "Please mark each of the 18 test cases pass or fail by Friday 5 pm Toronto time.", issue: null },
          { id: "s6", text: "Staging: staging.bookings.example.com  Username: linda.admin  Password: Summer2026!", issue: "Link, username and password in one email: one forwarded email gives full access. Use the approved credentials method." },
          { id: "s7", text: "I have also attached the estimate sheet we are still updating (estimate_final_v5_new.xlsx).", issue: "A living document sent as an attachment with an unclear name creates version confusion; share one link instead." },
          { id: "s8", text: "If anything is unclear, reply here or call me.", issue: null },
          { id: "s9", text: "Priya Sharma | Project Manager, Oyelabs", issue: null },
          { id: "s10", text: "Call me anytime!", issue: "No phone number with country code and no working hours or time zone; 'anytime' means nothing across a 10-hour gap." },
        ],
        askExplanation: true,
      },
    },
    // ------------------------------------------------------------------ 5
    {
      id: "pma-outlook-features",
      moduleId: "pma-email",
      trackId: "pm",
      title: "Outlook features: rules, templates, scheduling, flags",
      summary:
        "A PM with five client projects gets two hundred emails a day: client replies, GitHub notifications, Keka approvals, Teams digests, newsletters. If everything lands in one inbox, the one email that matters, a client saying \"we cannot test until the API is fixed\", hides between build alerts. Outlook has four tools that fix most of this, and each takes ten minutes to set up.\n\nRules move or mark mail automatically. Create a rule from a message (right-click, Rules, Create rule) and choose conditions: from a sender, subject contains a project code, sent only to you. Good PM rules: move GitHub and CI notifications into a folder, put each key client's domain in a visible colour or category, and never auto-move client email out of the inbox where you would miss it. Rules run in order, and a rule with \"stop processing more rules\" can hide mail from later rules, so check the order.\n\nTemplates (My Templates or Quick Parts) store text you write every week: the status email skeleton, the UAT invitation, the change-request acknowledgement. They save time and keep your emails the same shape. Update a template when the SOP changes, or you will spread an old format.\n\nSchedule send (Delay delivery) lets you write at 6 pm India time and have the email arrive at 9 am in New York, at the top of the client's inbox. Use it for non-urgent messages; urgent news should go now. Remember the computer or server must send it, so check the scheduled time zone. Flags and follow-up reminders turn an email into a task: flag a client email \"Tomorrow\" when you owe an answer, or flag your own sent request so Outlook reminds you to chase.\n\nThe common mistake is building twenty clever rules once and never reviewing them, until an important client email sits unread in a folder for a week. Review rules each month, and keep every client's mail in view.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Microsoft Support: Manage email messages by using rules in Outlook", url: "https://support.microsoft.com/en-us/outlook/mail/manage-email-messages-by-using-rules-in-outlook", kind: "docs", verifiedAt: "2026-10-02T09:35:31Z" },
        { label: "Microsoft Support: Delay or schedule sending email messages in Outlook", url: "https://support.microsoft.com/en-us/outlook/mail/delay-or-schedule-sending-email-messages-in-outlook", kind: "docs", verifiedAt: "2026-10-02T09:35:38Z" },
        { label: "Microsoft Support: Outlook training", url: "https://support.microsoft.com/en-us/outlook/outlook-training", kind: "docs", verifiedAt: "2026-10-02T09:43:42Z" },
      ],
      video: {
        title: "How to Create Rules in Outlook",
        channel: "Kevin Stratvert",
        url: "https://www.youtube.com/watch?v=87cqwadac6Y",
        videoId: "87cqwadac6Y",
        verifiedAt: "2026-10-02T09:35:53Z",
      },
      alternateVideos: [
        {
          title: "How To Create Email Templates in Outlook | My Templates & Quick Parts",
          channel: "Leila Gharani",
          url: "https://www.youtube.com/watch?v=RSlfhjbIoK8",
          videoId: "RSlfhjbIoK8",
          verifiedAt: "2026-10-02T09:35:57Z",
        },
        {
          title: "Top 20 Microsoft Outlook Tips & Tricks",
          channel: "Kevin Stratvert",
          url: "https://www.youtube.com/watch?v=edABo0VnHK8",
          videoId: "edABo0VnHK8",
          verifiedAt: "2026-10-02T09:35:57Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-outlook-features-q1",
          prompt: "Which Outlook feature lets you write a status email at 6 pm IST and have it arrive at 9 am New York time?",
          options: ["Rules", "Delay delivery / Schedule send", "Quick Parts", "Focused Inbox"],
          correctIndex: 1,
          explanation: "Schedule send places the email at the top of the client's morning inbox. Rules sort mail; Quick Parts stores text.",
        },
        {
          id: "pma-outlook-features-q2",
          prompt: "Which rules are sensible for a PM? (Select all that apply.)",
          options: [
            "Move GitHub and CI notification emails into a 'Builds' folder",
            "Colour-code or categorise mail from each key client's domain",
            "Move all client email out of the inbox into one archive folder automatically",
            "Delete any email with 'invoice' in the subject",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Filter noise away and make clients stand out. Auto-moving client mail or deleting finance email makes you miss what matters.",
        },
        {
          id: "pma-outlook-features-q3",
          prompt:
            "Your rule moves anything with 'build' in the subject to a 'Builds' folder, and has \"stop processing more rules\". A client emails with the subject \"Build 2.4 crashes on login\". What happens?",
          options: [
            "It lands in the inbox because it is from a client",
            "It is moved to 'Builds', and your later client-highlight rule never runs, so you may miss it",
            "Outlook asks you where to put it",
            "It is deleted",
          ],
          correctIndex: 1,
          explanation:
            "Rules match words, not intent, and run in order. Add a sender condition (only from GitHub) and put client rules first.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-outlook-features-q4",
          prompt: "What is the best use of Outlook templates or Quick Parts for a PM?",
          options: [
            "Storing recurring emails such as the status email skeleton or the UAT invitation",
            "Storing client passwords",
            "Replacing the need to read client emails",
            "Sending the same email to every client without changes",
          ],
          correctIndex: 0,
          explanation: "Templates give a consistent shape and save time. You still tailor the content to each client.",
        },
        {
          id: "pma-outlook-features-q5",
          prompt: "You ask the client for logo files and need them by Friday. How can Outlook help you remember to chase?",
          options: [
            "Flag your sent email for follow-up with a reminder before Friday",
            "Mark it as read",
            "Move it to Deleted Items",
            "Add a rule to forward it to yourself",
          ],
          correctIndex: 0,
          explanation: "A follow-up flag on your own sent item turns it into a reminder, so the chase happens on time.",
        },
        {
          id: "pma-outlook-features-q6",
          prompt: "When should you NOT use schedule send?",
          options: [
            "For a routine weekly status email",
            "For urgent news, such as production being down, that the client must hear now",
            "For a newsletter",
            "For a meeting follow-up you finish late at night",
          ],
          correctIndex: 1,
          explanation: "Delaying urgent bad news looks like hiding it. Send urgent news immediately, and call if it is serious.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-outlook-features-q7",
          prompt: "Your status email template still has last quarter's sign-off and an old Keka link. What is the real risk?",
          options: [
            "None; templates are just a starting point",
            "Every PM who uses it spreads the outdated format and wrong link to clients",
            "Outlook will refuse to send it",
            "The template will delete itself",
          ],
          correctIndex: 1,
          explanation: "Templates multiply both good and bad content. Update them when the SOP changes.",
        },
        {
          id: "pma-outlook-features-q8",
          prompt: "Which habits keep an Outlook setup trustworthy over time? (Select all that apply.)",
          options: [
            "Reviewing rules monthly and deleting ones you no longer need",
            "Keeping client mail visible in the inbox, not hidden by rules",
            "Checking the 'Builds' and other rule folders daily",
            "Adding a new rule for every single email you receive",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Rules decay as projects change. Review them, keep clients visible, and check the folders rules fill.",
        },
      ],
      practice: {
        kind: "sim",
        app: "outlook",
        prompt:
          "These are the Outlook rules and scheduled emails on a PM's account for three client projects. Flag the ones that could make the PM miss a client email or send something at the wrong time, then answer the question.",
        title: "Rules and scheduled items - Priya's mailbox",
        columns: ["Type", "Condition", "Action", "Note"],
        rows: [
          { id: "r1", cells: ["Rule", "From notifications@github.com", "Move to folder 'Builds'", ""], issue: null },
          { id: "r2", cells: ["Rule", "Subject contains 'build'", "Move to 'Builds', stop processing more rules", "Runs first"], issue: "Matches client emails such as 'Build 2.4 crashes', and stops the client rule below from running." },
          { id: "r3", cells: ["Rule", "From @acmeshop.com", "Category 'Acme - client', keep in inbox", ""], issue: null },
          { id: "r4", cells: ["Rule", "From @brightfin.com.au", "Move to 'Archive', mark as read", "Old project"], issue: "BrightFin is still an active client; their emails are archived and marked read, so they will be missed." },
          { id: "r5", cells: ["Scheduled", "Weekly status to Acme", "Send Mon 9:00 New York time", ""], issue: null },
          { id: "r6", cells: ["Scheduled", "Production outage notice to BrightFin", "Send tomorrow 9:00 Sydney time", "Outage is now"], issue: "Urgent outage news must go out now, not tomorrow morning." },
          { id: "r7", cells: ["Rule", "From keka notifications", "Move to 'Keka'", ""], issue: null },
          { id: "r8", cells: ["Flag", "Sent: logo files request to Acme", "Reminder Thu 10:00", ""], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "What is the best fix for the 'Subject contains build' rule?",
            options: [
              "Delete all rules",
              "Add the condition 'from GitHub/CI only', and move the client rules above it",
              "Rename the folder",
              "Turn on Focused Inbox instead",
            ],
            correctIndex: 1,
            explanation: "Narrow the condition to the sender and order client rules first, so client mail is never caught by a keyword rule.",
          },
        ],
      },
    },
    // ------------------------------------------------------------------ 6
    {
      id: "pma-chasing-politely",
      moduleId: "pma-email",
      trackId: "pm",
      title: "Chasing politely and follow-ups",
      summary:
        "Agency projects stall on client inputs more than on code: content for the app, API keys for the payment gateway, UAT feedback, sign-off on a change request. Every day you wait is a day of the schedule gone, and on a fixed-bid project it is margin gone too. A PM who does not chase ends up explaining a delay that was never the team's fault, and the client remembers the delay, not the reason.\n\nA good chase is short, friendly and specific. Reply in the original thread so the history is there. Restate the ask in one line, say why it matters now (\"without the Stripe keys we cannot test payments, and UAT starts Monday\"), and make it easy: offer a short call, a template or the exact field you need. Give a new date. Do not repeat the whole first email, and do not write \"just checking in\", which tells the reader nothing.\n\nEscalate in steps. First reminder: polite and helpful, one or two working days after the deadline. Second: add the impact in days, and offer options (\"we can start with the content we have and add the rest later\"). Third: move channel, a call or a message on Teams, and if needed bring in the client's sponsor with a neutral note. At each step write down the date of the request and the reply. When the delay reaches the plan, record it in the status email and the RAID log, so the schedule change is visible and agreed.\n\nOutlook helps: flag your own sent request with a reminder, or use a follow-up rule, so chasing is a habit and not a memory test. Time it for the client's morning.\n\nThe common mistakes are passive-aggressive phrases (\"as per my last email\", \"gentle reminder\" three times) and chasing without saying what the delay costs. The reader should finish the email knowing exactly what to send, by when, and why it matters to their own launch.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Microsoft Support: Delay or schedule sending email messages in Outlook", url: "https://support.microsoft.com/en-us/outlook/mail/delay-or-schedule-sending-email-messages-in-outlook", kind: "docs", verifiedAt: "2026-10-02T09:35:38Z" },
        { label: "Grammarly: How to Write a Follow-Up Email, With Examples", url: "https://www.grammarly.com/blog/emailing/follow-up-email/", kind: "article", verifiedAt: "2026-10-02T09:35:30Z" },
        { label: "Harvard Business Review: How to Write Email with Military Precision", url: "https://hbr.org/2016/11/how-to-write-email-with-military-precision", kind: "article", verifiedAt: "2026-10-02T09:35:46Z" },
        { label: "Purdue OWL: Email etiquette", url: "https://owl.purdue.edu/owl/general_writing/academic_writing/email_etiquette.html", kind: "article", verifiedAt: "2026-10-02T09:35:33Z" },
      ],
      video: {
        title: "How to write a Follow-up Email that Gets You Responses?",
        channel: "Saleshandy",
        url: "https://www.youtube.com/watch?v=B4ODYPqlATQ",
        videoId: "B4ODYPqlATQ",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      alternateVideos: [
        {
          title: "Make Outlook Remind THEM for YOU (Easy Email Follow-Up Tip)",
          channel: "Paul O'Malley",
          url: "https://www.youtube.com/watch?v=lvJOLgvhF38",
          videoId: "lvJOLgvhF38",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-chasing-politely-q1",
          prompt: "The client promised the app content by Monday. It is Wednesday. Which first reminder is best?",
          options: [
            "\"As per my last email, we are still waiting.\"",
            "\"Hi Tom, a quick reminder about the app content. We need it to start the screens on Friday. Would a 15-minute call help? Could you send it by Thursday?\"",
            "\"Just checking in!\"",
            "Wait until the status call next week",
          ],
          correctIndex: 1,
          explanation: "It restates the ask, gives the reason and a new date, and offers help. The others are passive-aggressive, empty or late.",
        },
        {
          id: "pma-chasing-politely-q2",
          prompt: "Where should you send a reminder?",
          options: [
            "In a new email with a new subject",
            "As a reply in the original thread, so the history and the request are visible",
            "On the client's personal phone",
            "To the client's CEO first",
          ],
          correctIndex: 1,
          explanation: "Replying in the thread keeps the original ask and dates together, which matters if the delay is later questioned.",
        },
        {
          id: "pma-chasing-politely-q3",
          prompt: "Which elements make a chase email effective? (Select all that apply.)",
          options: [
            "The ask restated in one line",
            "Why it matters now, in terms of the client's own timeline",
            "A new, specific date",
            "An offer that makes it easier (a call, a template, the exact fields needed)",
            "A copy of the whole original email pasted again",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Short, specific, motivated and easy to act on. Repeating the whole first email adds length, not clarity.",
        },
        {
          id: "pma-chasing-politely-q4",
          prompt:
            "You have chased twice for payment gateway keys. UAT is due to start in three days. What is the right next step?",
          options: [
            "Send a third identical reminder",
            "Change channel (a call or Teams message), state the impact on the UAT date, offer options, and record the delay in the status report and RAID log",
            "Quietly push UAT back without telling anyone",
            "Ask the developer to fake the keys",
          ],
          correctIndex: 1,
          explanation:
            "After two emails, switch channel and make the impact visible. A schedule change caused by missing inputs must be recorded and agreed, not absorbed silently.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-chasing-politely-q5",
          prompt: "When should you involve the client's sponsor or manager in a chase?",
          options: [
            "On the first reminder, to show urgency",
            "Only after direct reminders and a call have failed and the delay affects the plan, with a neutral, factual note",
            "Never; it damages the relationship",
            "Whenever the client is a day late",
          ],
          correctIndex: 1,
          explanation:
            "Escalating too early insults your contact; never escalating lets the project slip. Escalate in steps and keep the tone factual.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-chasing-politely-q6",
          prompt: "Which phrases tend to sound passive-aggressive in a chase? (Select all that apply.)",
          options: ["\"As per my last email\"", "\"Gentle reminder\" sent for the third time", "\"Per my previous three emails\"", "\"Could you send it by Thursday?\""],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "These phrases signal irritation. A direct, polite question with a date does the job without friction.",
        },
        {
          id: "pma-chasing-politely-q7",
          prompt: "Your client is in New York and you work from India. When should a reminder arrive?",
          options: [
            "Whenever you finish writing it",
            "At the start of the client's working day, using schedule send if needed",
            "At midnight their time so it is first in the inbox",
            "On Saturday, when they have more time",
          ],
          correctIndex: 1,
          explanation: "Emails that arrive at the start of the reader's day get answered. Use schedule send for non-urgent chases.",
        },
        {
          id: "pma-chasing-politely-q8",
          prompt:
            "The client finally sends half of the content and asks if you can start. The rest will come \"next week\". What is the best reply?",
          options: [
            "Refuse to start until everything arrives",
            "Thank them, start with what you have, confirm in writing which screens wait for the rest and the date you need it by",
            "Start and say nothing about the missing half",
            "Ask your team to write the missing content",
          ],
          correctIndex: 1,
          explanation: "Keep momentum but make the dependency explicit and dated, so a later slip is clearly linked to the missing input.",
        },
      ],
      practice: {
        kind: "write",
        variant: "email",
        prompt:
          "Write the second reminder to Tom, marketing lead at a US client. On 3 November you asked for the product photos and copy for the React e-commerce app's 12 product pages; he promised them by 7 November. You sent one polite reminder on 9 November. It is now 12 November, and the design team will run out of work on 14 November. Launch is planned for 1 December. Be polite, specific and helpful.",
        context: "Original request (3 Nov): \"Hi Tom, could you send the photos and copy for the 12 product pages by 7 Nov? The template is attached.\"",
        wordLimit: 170,
        rubric: [
          { id: "ask", label: "Clear ask and new date", description: "Restates exactly what is needed (photos and copy for 12 product pages) and gives a specific new date, e.g. by 14 Nov.", weight: 1.5 },
          { id: "impact", label: "Impact in the client's terms", description: "Explains what happens if it does not arrive (design pauses on 14 Nov; the 1 Dec launch is at risk) without threatening.", weight: 1.5 },
          { id: "help", label: "Makes it easy", description: "Offers an option: a short call, sending pages in batches, or starting with placeholders for the rest.", weight: 1 },
          { id: "tone", label: "Polite, not passive-aggressive", description: "No 'as per my last email' or repeated 'gentle reminder'; friendly and brief.", weight: 1 },
        ],
        sampleAnswer:
          "Subject: Re: Product photos and copy for the 12 product pages\n\nHi Tom,\n\nFollowing up on the photos and copy for the 12 product pages. Could you send them by Thursday 14 November?\n\nOur designers finish the current screens that day. Without the content they will pause, and every day of pause moves the 1 December launch closer to risk.\n\nTo make it easier:\n1. Send the pages in batches; the first four would let us keep going.\n2. Or we can use placeholders now and swap in your content by 21 November.\n\nHappy to jump on a 15-minute call tomorrow if that helps.\n\nThanks,\nPriya",
      },
    },
    // ------------------------------------------------------------------ 7
    {
      id: "pma-writing-for-non-native-readers",
      moduleId: "pma-email",
      trackId: "pm",
      title: "Writing for non-native readers",
      summary:
        "Many Oyelabs clients read English as a second or third language: a founder in Germany, an operations team in the UAE, a product owner in Brazil. Often both sides are non-native, and sometimes the client pastes your email into a translation tool. Idioms, long sentences and vague words that seem friendly to you can cause a wrong decision on their side. \"We are on track, give or take\" can be read as \"we are late\".\n\nWrite so that a translation tool would get it right. Use short sentences with one idea each. Use plain, common words: \"start\" not \"kick off\", \"check\" not \"run it by\", \"finish\" not \"wrap up\". Avoid idioms, sports metaphors and humour (\"ballpark\", \"touch base\", \"low-hanging fruit\"). Keep the same word for the same thing: if you call it \"staging\" in one line, do not call it \"the test server\" in the next. Spell out abbreviations the first time (\"UAT (user acceptance testing)\").\n\nBe exact with dates, times and numbers, because formats differ by country. 03/04 is 3 April in India and the UK but 4 March in the US. Write \"Thursday 4 March 2027, 10:00 CET\". Name the time zone. Say \"5 working days\" instead of \"next week\". Use numbered lists for steps and questions so the reader can answer item by item. Put the decision or ask in its own short line.\n\nCheck your draft by reading it as if you knew English from school. Is there a phrase you could only understand if you grew up with it? Replace it. Is a sentence longer than about 20 words? Split it.\n\nThe common mistake is thinking simple writing looks unprofessional. The opposite is true: clear writing respects the reader's time and shows you are in control. A second mistake is assuming the client understood because they replied \"OK\". When the decision matters, ask them to confirm the key point in their own words, or confirm it in the next call.",
      level: "advanced",
      estMinutes: 35,
      webRefs: [
        { label: "Microsoft Learn: Global communications - Microsoft Style Guide", url: "https://learn.microsoft.com/en-us/style-guide/global-communications/", kind: "docs", verifiedAt: "2026-10-02T09:35:44Z" },
        { label: "Google developer style guide: Write for a global audience", url: "https://developers.google.com/style/translation", kind: "docs", verifiedAt: "2026-10-02T09:35:34Z" },
        { label: "Digital.gov: Plain language guide series", url: "https://digital.gov/guides/plain-language", kind: "spec", verifiedAt: "2026-10-02T09:35:40Z" },
      ],
      video: {
        title: "Communication Tips for Non-Native English Speakers",
        channel: "Stanford Graduate School of Business",
        url: "https://www.youtube.com/watch?v=5LOSNDJgkFs",
        videoId: "5LOSNDJgkFs",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-writing-for-non-native-readers-q1",
          prompt: "Which sentence is clearest for a client who reads English as a second language?",
          options: [
            "Let's touch base once the ball is in your court.",
            "Please send your feedback. We will call you when we receive it.",
            "We'll circle back after you've had a gander.",
            "Ping us when you're good to go and we'll take it from there.",
          ],
          correctIndex: 1,
          explanation: "Two short sentences with common words translate well. The others rely on idioms and slang.",
        },
        {
          id: "pma-writing-for-non-native-readers-q2",
          prompt:
            "You write \"UAT starts 03/04\" to a client in New York, meaning 3 April. What can go wrong?",
          options: [
            "Nothing; dates are universal",
            "A US reader may read it as 4 March, a month earlier",
            "Outlook converts it automatically",
            "The client will think it is a time, not a date",
          ],
          correctIndex: 1,
          explanation:
            "Day-month order differs by country. Write the month as a word and add the weekday: \"Friday 3 April 2027\".",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-writing-for-non-native-readers-q3",
          prompt: "Which habits make emails easier for non-native readers? (Select all that apply.)",
          options: [
            "Short sentences with one idea each",
            "The same word for the same thing throughout",
            "Abbreviations spelled out the first time",
            "Jokes and idioms to build rapport",
            "Long paragraphs that explain everything in one block",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Consistency, short sentences and expanded abbreviations survive translation. Idioms and long blocks do not.",
        },
        {
          id: "pma-writing-for-non-native-readers-q4",
          prompt: "Why should you avoid switching between \"staging\", \"test server\" and \"UAT environment\" in one email?",
          options: [
            "It is grammatically wrong",
            "A non-native reader may think they are three different systems",
            "Outlook flags it as spam",
            "It makes the email too short",
          ],
          correctIndex: 1,
          explanation: "Variety is good style in an essay but confusing in instructions. Pick one term and keep it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-writing-for-non-native-readers-q5",
          prompt: "Which is the clearest way to state a deadline to a client in Germany?",
          options: ["By EOD next week", "ASAP", "By Thursday 12 March 2027, 17:00 CET", "Early next month-ish"],
          correctIndex: 2,
          explanation: "Weekday, date with the month in words, time and time zone leave no room for guesswork. EOD and ASAP mean different things to different people.",
        },
        {
          id: "pma-writing-for-non-native-readers-q6",
          prompt:
            "You ask a client in the UAE to choose between two hosting options. They reply \"OK\". What should you do before you buy the server?",
          options: [
            "Buy option A; OK means the first one",
            "Confirm which option they chose, in a short question with the two options numbered",
            "Buy both to be safe",
            "Wait for the next monthly call",
          ],
          correctIndex: 1,
          explanation:
            "\"OK\" may mean \"I read it\", not \"I choose A\". For decisions that cost money, ask for an explicit, numbered answer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-writing-for-non-native-readers-q7",
          prompt: "Roughly how long should most sentences be in an email to a non-native reader?",
          options: ["Under about 20 words", "40 to 60 words", "As long as needed, with many commas", "Exactly 10 words"],
          correctIndex: 0,
          explanation: "Style guides for global audiences recommend short sentences. If a sentence has two ideas, split it.",
        },
        {
          id: "pma-writing-for-non-native-readers-q8",
          prompt: "Which replacements make a sentence more global-friendly? (Select all that apply.)",
          options: [
            "\"kick off\" → \"start\"",
            "\"ballpark figure\" → \"rough estimate\"",
            "\"wrap up\" → \"finish\"",
            "\"5 working days\" → \"next week-ish\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Plain verbs and nouns translate well. \"Next week-ish\" is vaguer than \"5 working days\", not clearer.",
        },
        {
          id: "pma-writing-for-non-native-readers-q9",
          prompt: "Why is it useful to imagine your email going through a translation tool?",
          options: [
            "Because many clients paste emails into tools like that, and idioms translate literally",
            "Because Outlook translates every email automatically",
            "Because translation tools fix unclear writing",
            "It is not useful",
          ],
          correctIndex: 0,
          explanation: "\"The ball is in your court\" becomes a sentence about tennis. Plain words survive the trip.",
        },
      ],
      practice: {
        kind: "write",
        variant: "email",
        prompt:
          "Rewrite this email for Carlos, the product owner of a Brazilian client, who reads English as a second language and often uses a translation tool. Keep all the facts. Today is Monday 8 March 2027.",
        context:
          "Draft: \"Hey Carlos! Quick heads-up: we're pretty much on track with the Android build, give or take. The ball's in your court on the push notification copy - if you can get that over to us by EOW we'll be golden and can kick off UAT on the test server 03/15. FYI staging creds are in the usual place. Holler if anything's unclear!\"",
        wordLimit: 150,
        rubric: [
          { id: "plain", label: "Plain words, no idioms", description: "Removes 'give or take', 'ball's in your court', 'EOW', 'golden', 'kick off', 'holler' and similar; uses common words.", weight: 1.5 },
          { id: "dates", label: "Exact dates and time zone", description: "Writes the deadline and UAT start as weekday + date with the month in words (e.g. Friday 12 March 2027; Monday 15 March 2027), with a time zone where a time is given.", weight: 1.5 },
          { id: "consistent", label: "One term per thing", description: "Uses one name for the test environment (e.g. 'staging') throughout, and expands UAT the first time.", weight: 1 },
          { id: "ask", label: "Clear ask on its own line", description: "The ask (send the push notification text by the date) stands out, ideally as a numbered or separate line; status is stated plainly (on schedule).", weight: 1 },
        ],
        sampleAnswer:
          "Subject: Android app: push notification text needed by Friday 12 March\n\nHello Carlos,\n\nThe Android app is on schedule.\n\nWe need one thing from you:\n1. Please send the text for the push notifications by Friday 12 March 2027, 17:00 São Paulo time.\n\nWhen we have it, we will start UAT (user acceptance testing) on staging on Monday 15 March 2027.\n\nThe staging login details are in the shared project folder.\n\nIf anything is not clear, please reply to this email.\n\nBest regards,\nPriya",
      },
    },
    // ------------------------------------------------------------------ 8
    {
      id: "pma-status-escalation-mom-emails",
      moduleId: "pma-email",
      trackId: "pm",
      title: "Status, escalation and MoM emails",
      summary:
        "Three emails carry most of a PM's relationship with an overseas client. The weekly status email tells them where the project stands without a meeting. The minutes of meeting (MoM) email turns a call into a written record of decisions and actions. The escalation email raises a serious problem early, with options. If these are clear and on time, clients trust you even when things slip. If they are vague, every small delay becomes a crisis.\n\nA status email starts with the overall status in one line, RAG (Red, Amber, Green) plus why: \"Amber: payment testing is two days behind because the gateway keys arrived late.\" Then: what was done this week, what is planned next, risks and blockers with owners, and decisions needed from the client with a date. Keep the same sections every week so changes stand out. Never send Green on a project you privately think is Amber; a surprise Red later destroys trust.\n\nThe MoM email goes out within 24 hours of the call, while memories are fresh. It lists attendees, decisions (who decided what), action items (owner, task, due date) and open questions. It ends with \"If anything here is wrong, please reply by Wednesday\", so silence means agreement and disagreement surfaces early. Write decisions in plain sentences, not as a transcript.\n\nAn escalation email is for a problem the PM cannot solve alone: a release that will miss its date, a scope dispute, a blocker on the client side. Use a clear subject (\"ESCALATION: Acme Portal go-live at risk\"), state the problem and impact in the first two lines, give the cause without blame, offer two or three options with their cost and date effect, recommend one, and ask for a decision by a set time. Send it early, while there are still options.\n\nYour team's SOP below defines the status, MoM and escalation templates and who must be copied. The common mistake is the \"watermelon\" status: green outside, red inside. The second is escalating with only a problem and no options.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Asana: Meeting Notes Tips: How to Take Notes & Track Actions", url: "https://asana.com/resources/meeting-notes-tips", kind: "docs", verifiedAt: "2026-10-02T10:06:59Z" },
        { label: "Atlassian: Project Status Report: Tips and Templates for Success", url: "https://www.atlassian.com/agile/project-management/status-report", kind: "article", verifiedAt: "2026-10-02T09:38:53Z" },
        { label: "Asana: Free Meeting Minutes Template (Examples + Tips)", url: "https://asana.com/templates/meeting-minutes", kind: "article", verifiedAt: "2026-10-02T10:07:03Z" },
        { label: "ProjectManager: Project Status Reports (Example & Template Included)", url: "https://www.projectmanager.com/guides/status-report", kind: "article", verifiedAt: "2026-10-02T09:38:48Z" },
      ],
      video: {
        title: "How to Write a Project Status Report in 5 Easy Steps | ClickUp",
        channel: "ClickUp",
        url: "https://www.youtube.com/watch?v=IKUGFME2tlI",
        videoId: "IKUGFME2tlI",
        verifiedAt: "2026-10-02T09:35:54Z",
      },
      alternateVideos: [
        {
          title: "How To Write a Follow Up Email After a Meeting | Mindmaven",
          channel: "Mindmaven",
          url: "https://www.youtube.com/watch?v=s7FK_iCrL1U",
          videoId: "s7FK_iCrL1U",
          verifiedAt: "2026-10-02T09:35:57Z",
        },
      ],
      sop: [
        {
          title: "Our status, MoM and escalation email templates",
          prompt:
            "[Oyelabs SOP – admin to fill] The weekly status email template (sections, RAG rules, send day and time), the MoM template and the 24-hour rule, and the escalation email template, with one filled-in example of each.",
        },
        {
          title: "Who we copy and when we escalate",
          prompt:
            "[Oyelabs SOP – admin to fill] Which Oyelabs people are copied on status and escalation emails (delivery head, account manager), when a PM must escalate internally before writing to the client, and who approves an escalation email.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-status-escalation-mom-emails-q1",
          prompt: "What should the first line of a weekly status email contain?",
          options: [
            "A greeting and the weather",
            "The overall RAG status and the main reason for it",
            "The full list of completed tickets",
            "The next meeting time",
          ],
          correctIndex: 1,
          explanation: "The client should know in one line whether to worry. Details follow.",
        },
        {
          id: "pma-status-escalation-mom-emails-q2",
          prompt:
            "Privately, you think the release is likely to slip a week, but the team hopes to catch up. What status should you report?",
          options: [
            "Green, to avoid worrying the client",
            "Amber, with the reason, the recovery plan and the date when you will know more",
            "Red, to be safe",
            "No status this week",
          ],
          correctIndex: 1,
          explanation:
            "A watermelon status (green outside, red inside) turns a manageable risk into a surprise. Amber with a plan is honest and calm.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-status-escalation-mom-emails-q3",
          prompt: "Which items must a MoM email include? (Select all that apply.)",
          options: [
            "Decisions, with who made them",
            "Action items with owner and due date",
            "Open questions",
            "A request to reply by a date if anything is wrong",
            "A word-for-word transcript of the call",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "A MoM is a record of outcomes, not a transcript. The correction request turns silence into agreement.",
        },
        {
          id: "pma-status-escalation-mom-emails-q4",
          prompt: "When should the MoM email go out after a client call?",
          options: ["Within 24 hours", "At the end of the sprint", "Only if the client asks", "Before the next call, whenever that is"],
          correctIndex: 0,
          explanation: "Within 24 hours, while memories are fresh and before anyone acts on a different understanding.",
        },
        {
          id: "pma-status-escalation-mom-emails-q5",
          prompt:
            "In the call, the client said \"maybe we could add Apple Pay later\". Your developer wrote it as a decision in the draft MoM. What should the MoM say?",
          options: [
            "Decision: Apple Pay added to scope",
            "Open question: the client is considering Apple Pay for a later phase; Oyelabs to send an estimate if requested",
            "Leave it out completely",
            "Decision: Apple Pay rejected",
          ],
          correctIndex: 1,
          explanation:
            "A \"maybe\" is not a decision. Recording it as one creates a scope commitment nobody priced. Put it under open questions.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-status-escalation-mom-emails-q6",
          prompt: "Which belong in an escalation email to the client's sponsor? (Select all that apply.)",
          options: [
            "The problem and its impact in the first two lines",
            "Two or three options with their cost and date effect",
            "A recommended option",
            "A decision deadline",
            "The name of the developer who caused it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Problem, impact, options, recommendation and a deadline make the escalation actionable. Blaming a person helps nobody.",
        },
        {
          id: "pma-status-escalation-mom-emails-q7",
          prompt: "When is the best time to send an escalation email about a go-live that may slip?",
          options: [
            "The day before go-live, when you are sure",
            "As soon as you see the risk is real, while options still exist",
            "After go-live has been missed",
            "Never; handle it internally",
          ],
          correctIndex: 1,
          explanation: "Early escalation keeps options open (cut scope, add people, move the date). Late escalation leaves only bad news.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-status-escalation-mom-emails-q8",
          prompt: "Why keep the same sections in the status email every week?",
          options: [
            "So readers can compare weeks quickly and changes stand out",
            "Because Outlook requires it",
            "So it can be written without thinking",
            "To make it longer",
          ],
          correctIndex: 0,
          explanation: "A familiar layout lets a busy client scan straight to risks and decisions.",
        },
        {
          id: "pma-status-escalation-mom-emails-q9",
          prompt: "Which subject line suits an escalation?",
          options: [
            "Quick question",
            "ESCALATION: Acme Portal go-live on 15 Nov at risk, decision needed by Wed",
            "Re: Re: weekly update",
            "Some issues",
          ],
          correctIndex: 1,
          explanation: "The tag, project, problem and deadline tell the sponsor this needs attention now.",
        },
      ],
      practice: {
        kind: "write",
        variant: "email",
        prompt:
          "Write an escalation email to David, the sponsor at a US client. The Laravel customer portal is due to go live on Friday 15 November. The client's own IT team has not yet given access to their SSO (single sign-on) system, which was due on 1 November. Without it, login cannot be tested and go-live will slip. Give options and recommend one. Today is Tuesday 12 November.",
        context:
          "Facts: SSO access requested 21 Oct, due 1 Nov; chased 4 Nov and 7 Nov (client IT lead Mike). Login testing needs 3 working days once access is given. Option A: move go-live to Wed 20 Nov if access arrives by Thu 14 Nov. Option B: go live on 15 Nov with email/password login and add SSO in a follow-up release (about 2 extra days of work, 16 hours). Option C: wait for SSO with no fixed date.",
        wordLimit: 260,
        rubric: [
          { id: "subject", label: "Escalation subject", description: "Subject marks it as an escalation and names the project, the risk and the decision deadline.", weight: 1 },
          { id: "lead", label: "Problem and impact first", description: "The first two lines say go-live on 15 Nov is at risk because SSO access has not been provided, and what that means.", weight: 1.5 },
          { id: "facts", label: "Neutral facts, no blame", description: "States the request and chase dates factually without blaming Mike or the client's IT team.", weight: 1 },
          { id: "options", label: "Options with effects", description: "Presents the options with their date and cost/effort effects (e.g. A: 20 Nov if access by 14 Nov; B: 15 Nov with SSO later, ~16 extra hours).", weight: 1.5 },
          { id: "decision", label: "Recommendation and deadline", description: "Recommends one option with a reason and asks David for a decision by a specific date and time with time zone.", weight: 1.5 },
        ],
        sampleAnswer:
          "Subject: ESCALATION: Customer portal go-live on 15 Nov at risk, decision needed by Wed 13 Nov\n\nHi David,\n\nThe customer portal go-live on Friday 15 November is at risk. We still do not have access to your SSO system, and we need 3 working days to test login once we do.\n\nWe asked for access on 21 October (due 1 November) and followed up with Mike on 4 and 7 November.\n\nOptions:\nA. Move go-live to Wednesday 20 November. This works only if access arrives by Thursday 14 November.\nB. Go live on 15 November with email and password login, and add SSO in a follow-up release. This adds about 16 hours of work.\nC. Wait for SSO with no fixed date.\n\nWe recommend option B. Your customers get the portal on time, and SSO follows as soon as access is ready.\n\nCould you confirm your choice by Wednesday 13 November, 12:00 EST? I am happy to join a short call with you and Mike today.\n\nBest regards,\nPriya",
      },
    },
  ],
} satisfies Module;
