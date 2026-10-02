import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-d05",
  trackId: "pm",
  name: "Client meetings: Meeting craft",
  description:
    "The skills under every client meeting: clear English for clients and colleagues whose first language is not English, demoing and screen sharing in Microsoft Teams without accidents, and timeboxing a meeting so it ends with real decisions.",
  topics: [
    {
      id: "pmp-d05-craft-non-native",
      moduleId: "pmp-d05",
      trackId: "pm",
      title: "Communicating with non-native English speakers",
      summary: `Most Oyelabs meetings are in English, and in many of them nobody speaks English as a first language: a PM in India, a client in Oman, a reseller in Germany, a founder in Brazil. Misunderstandings here are expensive. A client who did not quite follow "we'll circle back on the CR once the keys land" may believe the change was agreed. Six weeks later it is a dispute about a [[term:change-request|change request]].

The fix is not simpler ideas; it is simpler language. Use short sentences with one idea each. Keep the small words that carry grammar ("that", "who", "the"). Avoid idioms, sports and cultural references, and stacked nouns like "client dependency resolution status update". Use one word per concept and keep it: if you said [[term:go-live|go-live]], do not switch to "launch", "release" and "cutover" in the same call. Explain agency terms the first time: say "a change request, which is a priced change to the agreed scope".

In meetings, slow down, pause after key points, and confirm understanding with open questions ("What will your team do first?") rather than "Does that make sense?", which almost everyone answers yes. Teams live captions help, but they are not a record. Teams does not save captions, so decisions must always go into written [[term:mom|minutes]].

The common mistake is assuming silence means agreement. In many cultures, people will not interrupt a vendor to say they are lost. Make it easy to ask, and always confirm decisions in writing.`,
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Microsoft Style Guide: Global communications, writing tips", url: "https://learn.microsoft.com/en-us/style-guide/global-communications/writing-tips", kind: "docs", verifiedAt: "2026-10-02T12:04:34Z" },
        { label: "Microsoft Support: Use live captions in Microsoft Teams meetings", url: "https://support.microsoft.com/en-us/teams/meetings/use-live-captions-in-microsoft-teams-meetings", kind: "docs", verifiedAt: "2026-10-02T12:04:34Z" },
        { label: "Digital.gov: Plain language guide series", url: "https://digital.gov/guides/plain-language", kind: "spec", verifiedAt: "2026-10-02T12:04:35Z" },
        { label: "HBR: Global Business Speaks English (Tsedal Neeley)", url: "https://hbr.org/2012/05/global-business-speaks-english", kind: "article", verifiedAt: "2026-10-02T12:04:35Z" },
      ],
      video: {
        title: "8. Don't Get Lost in Translation: How Non-Native Speakers Can Communicate With Confidence",
        channel: "Stanford Graduate School of Business",
        url: "https://www.youtube.com/watch?v=iP31KkbKdzI",
        videoId: "iP31KkbKdzI",
        verifiedAt: "2026-10-02T12:05:36Z",
      },
      alternateVideos: [
        {
          title: "Communication Tips for Non-Native English Speakers",
          channel: "Stanford Graduate School of Business",
          url: "https://www.youtube.com/watch?v=5LOSNDJgkFs",
          videoId: "5LOSNDJgkFs",
          verifiedAt: "2026-10-02T12:05:37Z",
        },
      ],
      sections: [
        {
          heading: "Why it matters at an agency",
          body: `At an agency, words become commitments. A sentence in a call can be read later as an agreement on scope, a date or a price. When the client understood something different from what you meant, you get disputed [[term:change-request|CRs]], missed [[term:client-dependency|client dependencies]] and "but you said" escalations.

This goes both ways. You may be the non-native speaker, talking to a native-speaking client who talks fast and uses idioms. The same rules help: slow the pace, ask for clarification, and confirm in writing.`,
        },
        {
          heading: "Speaking: pace, structure and checks",
          body: `- **Say the point first.** "The release moves to Friday. Here's why." Not three minutes of context and then the news.
- **One idea per sentence.** Pause between ideas.
- **Signpost.** "Three points today. First, the release. Second, the API keys. Third, the next demo."
- **Numbers and dates twice, in two forms.** "Friday the 14th, that's 14 March." Say "two weeks", not "a fortnight".
- **Name the decision.** "So the decision is: we go live on the 14th."
- **Check with open questions.** "What will your team do before Friday?" reveals understanding. "Does that make sense?" does not.
- **Give permission to ask.** "Please stop me if I go too fast. Your English is better than my Arabic."`,
        },
        {
          heading: "Words and phrases to avoid",
          body: `These are common in agency talk and often misunderstood:

- **Idioms:** "touch base", "circle back", "ballpark", "in the pipeline", "low-hanging fruit", "on the same page", "move the needle". Say "talk again", "a rough estimate", "planned", "easy first step", "agree", "improve".
- **Phrasal verbs with many meanings:** "put off" (delay? discourage?), "pick up" (start? collect?), "sort out". Use "delay", "start", "fix".
- **Soft or ambiguous yes/no:** "we'll look into it", "should be fine", "not a problem as such". Say exactly what you will do and when.
- **Stacked nouns:** "payment gateway key handover delay risk". Say "the risk that the payment keys arrive late".
- **Unexplained agency terms:** CR, UAT, AMC, SLA. Explain the first time.`,
        },
        {
          heading: "Writing: the global-English rules",
          body: `Microsoft's style guide for global audiences gives rules that fit client emails and minutes well:

1. Write short, simple sentences.
2. Keep "that" and "who", and keep articles ("the", "a"). They help readers and translation tools.
3. Avoid idioms, colloquial expressions and culture-specific references.
4. Avoid long chains of modifiers.
5. Use one word for one concept, and use it every time.
6. Use only common abbreviations, and spell out the rest.

Format helps too: bullets for actions, a bold line for decisions, dates written in full ("Friday 14 March", not "14/3", which reads as a different date in some countries).`,
        },
        {
          heading: "Using Teams captions well",
          body: `- Turn on live captions in Teams, and suggest them to the client at the start: "Captions are on if they help."
- Translated captions, where the client reads captions in their own language, need Teams Premium or Copilot. If the organiser has the licence, all participants can use them. Check before you promise it.
- Teams lists a fixed set of languages for translated captions. Check that the client's language is one of them.
- Teams does not save captions, and caption data is deleted after the meeting. Captions are not a record. Decisions go into the [[term:mom|minutes]].
- Captions get names and technical terms wrong. Spell key names and terms in the chat.`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **Taking silence as agreement.** Recover by asking a direct, open question: "Ahmed, what would your team need from us before Monday?"
- **Speaking more loudly instead of more simply.** Volume does not help. Shorter sentences do.
- **Correcting the client's English.** Never. Rephrase what they said as a check: "So you mean the store account is ready on Thursday?"
- **Sarcasm and humour.** They rarely travel. Keep it warm and literal.
- **"We'll look into it."** The client hears "yes". Say "I'll check with the tech lead and reply by 4 pm today."
- **Switching terms.** You said "release", "deploy" and "go-live" for the same thing. Pick one and repeat it.`,
        },
        {
          heading: "Your checklist",
          body: `- Point first, one idea per sentence, pauses between ideas.
- No idioms, no ambiguous phrasal verbs, no stacked nouns.
- Agency terms explained the first time; one term per concept.
- Dates in full, said twice.
- Understanding checked with open questions, not "makes sense?".
- Captions offered; translated captions only promised when the licence is confirmed.
- Every decision in written minutes the same day.`,
        },
      ],
      handbook: {
        rules: ["mom-after-every-client-meeting"],
        templates: ["mom"],
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-d05-craft-non-native-q1",
          prompt: "Which question best checks that a client understood the plan?",
          options: [
            "\"What will your team do before Friday?\"",
            "\"Does that make sense?\"",
            "\"Are we on the same page?\"",
            "\"Any questions?\"",
          ],
          correctIndex: 0,
          explanation:
            "An open question makes the client say the plan back in their own words. Yes/no questions almost always get a polite yes.",
        },
        {
          id: "pmp-d05-craft-non-native-q2",
          prompt: "Which phrases should you avoid with a client whose first language is not English? (Select all that apply.)",
          options: [
            "\"Let's circle back on that once the keys land.\"",
            "\"Can you give me a ballpark?\"",
            "\"We'll look into it.\"",
            "\"I'll reply by 4 pm today with the new date.\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Idioms and vague commitments are easily misread. The last option is short, literal and has a time.",
        },
        {
          id: "pmp-d05-craft-non-native-q3",
          prompt: "The client in Oman was silent for the whole CR discussion. At the end you ask \"OK?\" and they say \"OK.\" What should you assume?",
          options: [
            "Not that they agreed: confirm the decision with an open question and in written minutes",
            "That they agreed to the CR",
            "That they rejected the CR",
            "That they will raise objections by email",
          ],
          correctIndex: 0,
          explanation:
            "\"OK\" can mean \"I heard you\" rather than \"I agree\". Silence is not agreement, especially with a vendor. Confirm and write it down.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d05-craft-non-native-q4",
          prompt: "You write \"Release on 04/05\" to a client in the US and a team in India. What is the risk?",
          options: [
            "It reads as April 5 in the US and 4 May in India; write \"Monday 4 May\" in full",
            "There is no risk; dates are universal",
            "Only the year is missing",
            "Teams will convert it automatically",
          ],
          correctIndex: 0,
          explanation:
            "Day/month order differs by country. Write the weekday and the month name.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d05-craft-non-native-q5",
          prompt: "The client asks for translated captions in Teams. What should you check before promising them?",
          options: [
            "That the organiser has the licence translated captions need (Teams Premium or Copilot) and that the client's language is supported",
            "Nothing; all Teams meetings have translated captions",
            "That the client has a Teams Premium licence themselves",
            "That the meeting is recorded",
          ],
          correctIndex: 0,
          explanation:
            "Translated captions depend on the organiser's licence, and only certain languages are supported. If the organiser has it, all participants can use them.",
        },
        {
          id: "pmp-d05-craft-non-native-q6",
          prompt: "Why are Teams captions not enough as a record of decisions?",
          options: [
            "Teams does not save live captions, and caption data is deleted after the meeting",
            "Captions are saved but only in English",
            "Captions are only visible to the organiser",
            "Captions are saved but cannot be shared",
          ],
          correctIndex: 0,
          explanation:
            "Live captions are a live aid, not a record. Decisions belong in written minutes.",
        },
        {
          id: "pmp-d05-craft-non-native-q7",
          prompt: "Which of these follow the global-English writing rules? (Select all that apply.)",
          options: [
            "\"The tech lead who owns the migration will confirm the date.\"",
            "Using \"go-live\" every time, not switching to \"launch\" and \"cutover\" for the same event",
            "\"A change request, which is a priced change to the agreed scope, is needed.\"",
            "\"Payment gateway key handover delay risk raised.\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Keeping \"who\", one term per concept, and explaining terms all help. The stacked-noun sentence is hard to parse.",
        },
        {
          id: "pmp-d05-craft-non-native-q8",
          prompt: "The client says something you did not understand. What is the best response?",
          options: [
            "Rephrase what you think they said and ask them to confirm",
            "Nod and move on",
            "Ask them to speak better English",
            "Answer the question you think they asked",
          ],
          correctIndex: 0,
          explanation:
            "Rephrasing checks understanding without embarrassing anyone. Guessing creates the misunderstanding you were trying to avoid.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "This is a draft recap to a client whose first language is not English, after a call about a late release. Mark every line that a non-native reader could misunderstand or that hides a commitment.",
        segments: [
          { id: "s1", text: "Hi Ahmed, thank you for the call today.", issue: null },
          { id: "s2", text: "Quick recap: we're not out of the woods yet on the release.", issue: "Idiom. Say plainly: the release is still at risk." },
          { id: "s3", text: "The new UAT date is Thursday 14 March.", issue: null },
          { id: "s4", text: "Once the keys land, we'll circle back and firm up the go-live.", issue: "Two idioms and no date. Say: when we receive the payment keys, we will confirm the go-live date within one working day." },
          { id: "s5", text: "Your team needs to send the production payment keys by Monday 11 March.", issue: null },
          { id: "s6", text: "The CR for SMS reminders should be fine, we'll look into it.", issue: "Vague: the client may read it as approved or free. Say what happens next and when, and explain CR the first time." },
          { id: "s7", text: "Re the banner thing, let's park it for now.", issue: "Informal and unclear: is it rejected, deferred or still open? Say it is moved to phase 2, or that it needs a change request." },
          { id: "s8", text: "Decision: the partial UAT drop goes ahead on Friday 8 March.", issue: null },
          { id: "s9", text: "Ping me if anything's unclear, happy to hop on a call.", issue: "Slang. Say: please write to me if anything is unclear; I am happy to arrange a call." },
          { id: "s10", text: "Next update: Wednesday 13 March at 11:00 Gulf Standard Time.", issue: null },
        ],
        askExplanation: false,
      },
      sop: [
        {
          title: "Our client-communication language standards",
          prompt:
            "[Oyelabs SOP – admin to fill] Any house rules for client English (date and time-zone format, approved terms, a glossary to share with clients), whether translated captions are available on Oyelabs' Teams licence, and who to ask for help with a client in a language the PM does not speak.",
        },
      ],
    },
    {
      id: "pmp-d05-craft-demo-screenshare",
      moduleId: "pmp-d05",
      trackId: "pm",
      title: "Demoing and screen sharing in Teams",
      summary: `Most Oyelabs client meetings happen in Microsoft Teams, and most of them include a screen share: a sprint demo, a UAT walkthrough, a gap call, a status deck. The share is where meetings go visibly wrong. A chat notification from a colleague pops up on the client's screen. The demo hits a broken staging build. Nobody can hear the video. The developer driving the demo opens the admin panel with production data.

Teams gives you choices that prevent most of this. Share a single window instead of the whole screen, so notifications and other apps stay private. Turn on "Include sound" before sharing a video. Use PowerPoint Live for decks, so the client can follow and you can see your notes. Set meeting roles in advance (organiser, co-organiser, presenter, attendee), so only the right people can share, and give control of your screen only to people you trust.

A good demo is also a script. Show user journeys tied to the [[term:acceptance-criteria|acceptance criteria]], not a tour of screens. Use seeded test data on the [[term:staging-environment|staging]] or [[term:uat-environment|UAT environment]], never production. Rehearse the day before.

The common mistake is improvising: clicking around, apologising for test data, and leaving without decisions. End every demo with what was accepted, what changes, and what becomes a [[term:change-request|change request]], and record it in the [[term:mom|minutes]].`,
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Microsoft Support: Present content in Microsoft Teams meetings", url: "https://support.microsoft.com/en-us/teams/meetings/present-content-in-microsoft-teams-meetings", kind: "docs", verifiedAt: "2026-10-02T12:04:32Z" },
        { label: "Microsoft Support: Roles in Microsoft Teams meetings", url: "https://support.microsoft.com/en-us/teams/meetings/roles-in-microsoft-teams-meetings", kind: "docs", verifiedAt: "2026-10-02T12:04:32Z" },
        { label: "Microsoft Support: Start, stop, and find meeting recordings in Teams", url: "https://support.microsoft.com/en-us/teams/meetings/start-stop-and-find-meeting-recordings-in-microsoft-teams", kind: "docs", verifiedAt: "2026-10-02T12:04:32Z" },
        { label: "Atlassian Team Playbook: Demo Trust", url: "https://www.atlassian.com/team-playbook/plays/demo-trust", kind: "docs", verifiedAt: "2026-10-02T12:04:14Z" },
      ],
      video: {
        title: "PROPERLY Share Your Screen in a Microsoft Teams Meeting (For BEST Experience!)",
        channel: "Leila Gharani",
        url: "https://www.youtube.com/watch?v=BZ3JUjtywh0",
        videoId: "BZ3JUjtywh0",
        verifiedAt: "2026-10-02T12:05:35Z",
      },
      alternateVideos: [
        {
          title: "How to Present PowerPoint in Teams Like a Pro",
          channel: "Teacher's Tech",
          url: "https://www.youtube.com/watch?v=_e83XlmipBs",
          videoId: "_e83XlmipBs",
          verifiedAt: "2026-10-02T12:05:35Z",
        },
        {
          title: "Stephen Lead - how to give a kick-ass demo",
          channel: "Ignite Sydney",
          url: "https://www.youtube.com/watch?v=Cxl_3ANnE0A",
          videoId: "Cxl_3ANnE0A",
          verifiedAt: "2026-10-02T12:05:35Z",
        },
      ],
      sections: [
        {
          heading: "Choosing what to share",
          body: `Teams lets you share:

- **Your whole screen:** everything, including notifications and any app you switch to. Use it only when you must move between several apps, and turn on Do Not Disturb first.
- **A single window:** only that app. The safest default for a demo in a browser or simulator.
- **PowerPoint Live:** the deck loads inside Teams. Attendees can follow, and you see your notes and the next slide.
- **Excel Live and Whiteboard:** for working through a sheet or sketching with the client.

To play a video with sound, turn on **Include sound** before you share. On Teams for the web, sharing works only from Chrome or the latest Edge, and Microsoft lists Linux as not supported for it, so check the client's setup if they need to share.`,
        },
        {
          heading: "Roles and permissions",
          body: `Teams meetings have four roles: organiser, co-organiser, presenter and attendee.

- Make the PM the organiser or co-organiser, so you can manage the meeting.
- Make the developer driving the demo a presenter.
- Set clients as presenters only when they need to share; guests can be presenters.
- Attendees cannot record. If you need a recording, the organiser starts it, and you tell everyone first.
- Anonymous users who are promoted to presenter cannot mute or remove people.
- Use **Give control** only with people you trust, and take control back when they are done.

Presenter layouts (Content only, Standout, Side-by-side, Reporter) control how you appear next to your content. Standout keeps your face visible, which helps a hard conversation feel personal.`,
        },
        {
          heading: "Preparing the demo",
          body: `- **Write a demo script** of user journeys mapped to the [[term:acceptance-criteria|acceptance criteria]] for this [[term:sprint|sprint]]: "A patient books, pays and gets a confirmation."
- **Seed test data** on [[term:staging-environment|staging]] or the [[term:uat-environment|UAT environment]]: realistic names, prices and images, no "test test 123", and never production data.
- **Rehearse the day before** with the developer who will drive. Agree who clicks and who talks.
- **Have a fallback**: a short screen recording of each journey, in case staging fails on the day.
- **Clean the machine:** close chats and email, turn on Do Not Disturb, hide bookmarks and unrelated tabs, set the browser zoom so text is readable.
- **List the decisions you need** from the client at the end.`,
        },
        {
          heading: "Running the demo: step by step",
          body: `1. Join 10 minutes early; test the share and sound with a colleague.
2. Open with the goal and the decisions you need: "Today we show booking and payment, and we need your feedback on the confirmation screen."
3. Share a single window (or PowerPoint Live for slides).
4. Show each journey from the user's view, saying what the user is trying to do.
5. Pause after each journey for questions. Write feedback in a visible list, not only in your notes.
6. Classify each piece of feedback before you end: accepted, small change in scope, or a new idea that needs a [[term:change-request|CR]].
7. Stop sharing before the open discussion, so people look at each other, not at a frozen screen.
8. Close with decisions and next steps, and send the [[term:mom|minutes]] the same day.`,
        },
        {
          heading: "Traps and how to recover",
          body: `- **A notification pops up on the shared screen.** Say nothing dramatic, dismiss it, and switch to sharing a single window. Afterwards, check whether it showed anything confidential.
- **Staging is broken on the day.** Switch to the recorded fallback and say so honestly. Do not debug live in front of the client.
- **The client asks for something "while you're on that screen".** Write it on the feedback list and classify it at the end. Do not promise it during the demo.
- **The developer opens the production admin panel.** Stop the share. Demos never use production data.
- **Nobody can hear the video.** Stop sharing and re-share with Include sound on.
- **The recording started without warning.** Tell everyone and ask if they are comfortable. Recording rules vary by company and country.`,
        },
        {
          heading: "Your checklist",
          body: `- Demo script by user journey, mapped to acceptance criteria.
- Seeded test data on staging or UAT; never production.
- Rehearsed the day before; fallback recording ready.
- Do Not Disturb on; share a window, not the whole screen.
- Roles set: PM organiser or co-organiser, driver presenter.
- Include sound on for any video.
- Feedback list visible and classified before the end.
- Minutes with decisions sent the same day.`,
        },
      ],
      handbook: {
        stages: ["custom-sprints"],
        rules: ["mom-after-every-client-meeting"],
        templates: ["mom"],
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-d05-craft-demo-screenshare-q1",
          prompt: "You are demoing a booking app in a browser. What is the safest thing to share in Teams?",
          options: [
            "The browser window only",
            "Your whole screen",
            "Your whole screen with chat open, so you can see questions",
            "A photo of the screen",
          ],
          correctIndex: 0,
          explanation:
            "Sharing one window keeps notifications and other apps private. Whole-screen sharing shows everything, including pop-ups.",
        },
        {
          id: "pmp-d05-craft-demo-screenshare-q2",
          prompt: "You share a product video in the demo and the client hears nothing. What went wrong?",
          options: [
            "\"Include sound\" was not turned on before sharing",
            "The client's licence does not support video",
            "Teams never shares audio",
            "The video was in the wrong format",
          ],
          correctIndex: 0,
          explanation:
            "Teams shares computer sound only when \"Include sound\" is on. Stop and re-share with it turned on.",
        },
        {
          id: "pmp-d05-craft-demo-screenshare-q3",
          prompt: "Which are good preparation steps for a client demo? (Select all that apply.)",
          options: [
            "Seed realistic test data on staging",
            "Rehearse the day before with the developer who will drive",
            "Record a fallback video of each journey",
            "Demo on production so the data looks real",
            "Leave email open to answer questions quickly",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Realistic staging data, a rehearsal and a fallback prevent most demo failures. Production data and open email are exactly how demos go wrong.",
        },
        {
          id: "pmp-d05-craft-demo-screenshare-q4",
          prompt: "Halfway through the demo, staging returns a server error. What is the best move?",
          options: [
            "Switch to the recorded fallback, say so honestly, and continue",
            "Debug it live in front of the client",
            "End the meeting immediately",
            "Switch to production to show it working",
          ],
          correctIndex: 0,
          explanation:
            "A fallback keeps the meeting useful. Live debugging wastes the client's time; production must never be used for demos.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d05-craft-demo-screenshare-q5",
          prompt: "A client attendee wants to record the meeting but cannot find the button. Why?",
          options: [
            "Attendees cannot record in Teams; the organiser or a presenter starts it",
            "Recording is never allowed for guests",
            "Recording needs Teams Premium for everyone",
            "The meeting is too long to record",
          ],
          correctIndex: 0,
          explanation:
            "Recording depends on role. If a recording is useful, the organiser starts it and tells everyone.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d05-craft-demo-screenshare-q6",
          prompt: "During the demo, the client says: \"While you're on that screen, can you add a cancel button?\" What do you do?",
          options: [
            "Add it to the visible feedback list and classify it at the end: in scope, or a CR",
            "Promise it for the next sprint",
            "Ask the developer to code it live",
            "Ignore it to keep the demo on time",
          ],
          correctIndex: 0,
          explanation:
            "Capture everything, promise nothing in the moment. Classifying at the end keeps scope control without losing the idea.",
        },
        {
          id: "pmp-d05-craft-demo-screenshare-q7",
          prompt: "Which statements about Teams meeting roles are true? (Select all that apply.)",
          options: [
            "Guests can be made presenters",
            "Attendees cannot record",
            "Anonymous users promoted to presenter cannot mute or remove people",
            "Every attendee can share their screen by default in every meeting",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "These come from Microsoft's meeting-roles page. Sharing depends on the role and the meeting options, so set them before the demo.",
        },
        {
          id: "pmp-d05-craft-demo-screenshare-q8",
          prompt: "Why stop sharing before the open discussion at the end?",
          options: [
            "So people focus on each other and the decisions, not a frozen screen",
            "Because Teams limits sharing time",
            "To save bandwidth for the recording",
            "Because clients cannot speak while you share",
          ],
          correctIndex: 0,
          explanation:
            "Discussion and decisions go better face to face. A shared screen pulls attention away.",
        },
      ],
      practice: {
        kind: "rank",
        prompt: "You are running a sprint demo in Teams for a React Native fitness app. Put these steps in the order you would do them, from preparation to follow-up.",
        items: [
          { id: "script", label: "Write the demo script by user journey, mapped to the sprint's acceptance criteria" },
          { id: "data", label: "Seed realistic test data on the staging environment" },
          { id: "rehearse", label: "Rehearse with the developer who will drive, and record a fallback video" },
          { id: "prep", label: "Join 10 minutes early: Do Not Disturb on, share and sound tested" },
          { id: "open", label: "Open with the goal and the decisions you need today" },
          { id: "show", label: "Share the app window and show each journey, collecting feedback in a visible list" },
          { id: "classify", label: "Stop sharing; classify the feedback and confirm decisions and next steps" },
          { id: "mom", label: "Send the minutes with decisions and actions the same day" },
        ],
        correctOrder: ["script", "data", "rehearse", "prep", "open", "show", "classify", "mom"],
        explanation:
          "Script first (what to show), then data to show it with, then rehearsal. On the day: set up, open with the goal, demo, then decide and record. The minutes turn the demo into commitments.",
      },
      sop: [
        {
          title: "Our Teams meeting settings for client calls",
          prompt:
            "[Oyelabs SOP – admin to fill] Default meeting options for client calls (who can present, lobby settings, recording policy and consent wording), the staging demo accounts, and where demo recordings are stored.",
        },
      ],
    },
    {
      id: "pmp-d05-craft-timebox-decisions",
      moduleId: "pmp-d05",
      trackId: "pm",
      title: "Timeboxing and getting decisions",
      summary: `Client meetings at an agency are expensive: a PM, a tech lead and a designer for an hour is a day of someone's budget. Yet many end with "let's discuss offline" and no decision. Every meeting without a decision costs a second meeting, and a delay in the [[term:sprint|sprint]].

Two tools fix most of this. **Timeboxing** gives each agenda item a fixed amount of time. When the time is up, you decide, defer with an owner and a date, or explicitly extend. Scrum treats its timeboxes as maximums, not targets: a meeting that finishes early is a success. **DACI** names the roles for a decision: a Driver who gets it made by an agreed date, exactly one Approver who decides, Contributors who advise, and the Informed, who are told afterwards. In client meetings, the most common failure is not knowing who the Approver is.

How to use them: put the decision in the agenda as a question ("Approve the checkout design: yes, revise or reject?"), name the Approver before the meeting, send the options in advance, and close each item with the decision written where everyone can see it. Use a parking lot for topics that are important but not for today.

The common mistake is treating consensus as the goal. Everyone agreeing is nice, but the client's Approver deciding is enough. The second mistake is letting a meeting overrun into the next item and losing the decision you came for. Record every decision in the [[term:mom|minutes]] the same day.`,
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "Atlassian Team Playbook: DACI decision-making framework", url: "https://www.atlassian.com/team-playbook/plays/daci", kind: "docs", verifiedAt: "2026-10-02T12:04:33Z" },
        { label: "Scrum Guide (2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: "2026-10-02T12:04:11Z" },
        { label: "Confluence: DACI decision documentation template", url: "https://www.atlassian.com/software/confluence/templates/decision", kind: "docs", verifiedAt: "2026-10-02T12:04:34Z" },
        { label: "HBR: How to Run a Meeting (Antony Jay)", url: "https://hbr.org/1976/03/how-to-run-a-meeting", kind: "article", verifiedAt: "2026-10-02T12:04:34Z" },
      ],
      video: {
        title: "How to run the DACI Decision-making Framework play | Atlassian Training",
        channel: "Atlassian",
        url: "https://www.youtube.com/watch?v=63GcgUha0Vs",
        videoId: "63GcgUha0Vs",
        verifiedAt: "2026-10-02T12:05:35Z",
      },
      alternateVideos: [
        {
          title: "How to Run an Effective Meeting 5 Tips",
          channel: "Alexander Lyon Communication Coach",
          url: "https://www.youtube.com/watch?v=iQsw3cdJbbM",
          videoId: "iQsw3cdJbbM",
          verifiedAt: "2026-10-02T12:05:35Z",
        },
        {
          title: "Run Meetings that Don't Suck (10 Tips)!",
          channel: "Jeff Su",
          url: "https://www.youtube.com/watch?v=LCiQFwAwJvI",
          videoId: "LCiQFwAwJvI",
          verifiedAt: "2026-10-02T12:05:36Z",
        },
      ],
      sections: [
        {
          heading: "Why agency meetings end without decisions",
          body: `- **Nobody knows who decides.** The client's SPOC, the founder and the marketing lead all have opinions; none of them is clearly the Approver.
- **The question is vague.** "Let's discuss the design" invites discussion, not a decision. "Approve the checkout design: yes, revise or reject?" invites a decision.
- **Options arrive in the meeting.** People cannot decide on something they are seeing for the first time.
- **Time runs out.** The first item overruns, and the decision item at the end gets five rushed minutes.
- **Nothing is written down.** A decision that was "sort of agreed" is reopened next week.`,
        },
        {
          heading: "Timeboxing: how it works",
          body: `Give each agenda item a time and put it in the invite: "Checkout design decision (15 min)". When the time is up, choose one of three things, out loud:

1. **Decide now.**
2. **Defer,** with an owner, the missing information and a date.
3. **Extend,** by an explicit amount, and say what drops off the agenda to make room.

Timeboxes are maximums, not targets. The Scrum Guide treats its event lengths this way: a meeting that finishes early is fine. Put the decision items early in the agenda, while people are fresh, and the information items later.

Use a visible timer or a gentle signal: "Five minutes left on this item."`,
        },
        {
          heading: "DACI: one Approver",
          body: `DACI names four roles for one decision:

- **Driver:** makes sure the decision gets made by an agreed date. In client meetings, usually you, the PM.
- **Approver:** the one person who decides. Exactly one.
- **Contributors:** people whose knowledge the decision needs: your tech lead, the client's marketing lead.
- **Informed:** people told afterwards.

Agree the client's Approver for each type of decision early, ideally at kickoff: designs, scope and CRs, UAT sign-off, go/no-go. Write them in the kickoff [[term:mom|minutes]]. This is a natural extension of the [[term:raci|RACI]] for the project.`,
        },
        {
          heading: "Getting a decision in a client meeting: step by step",
          body: `1. **Before:** write the decision as a question, list two or three options with their effect on time, cost and [[term:scope-baseline|scope]], name the Approver, and send it 24 hours ahead.
2. **Open the item:** "We need a decision on X today. The options are in the note I sent."
3. **Contributors speak:** keep it to the timebox.
4. **Ask the Approver directly:** "Sarah, which option do you choose?"
5. **Say the decision back:** "So the decision is option B, with the Friday date."
6. **If they cannot decide:** agree what is missing, who provides it, and the date the decision will be made.
7. **Write it down** where everyone can see it, and send it in the minutes the same day.`,
        },
        {
          heading: "Sample lines",
          body: `- "We have 15 minutes for this. At the end, I'd like a decision or a clear next step."
- "We're at time on this item. Do we decide now, or park it with an owner and a date?"
- "That's an important point, but not for today. I'll put it in the parking lot and we'll schedule it."
- "Before we go on: who is the final approver for designs on your side?"
- "Sarah, you're the approver on this. Which option do you choose?"
- "Let me read back what we decided, so we all leave with the same version."`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **Waiting for consensus.** Ask the Approver to decide; record the dissent in the minutes if it matters.
- **Two approvers.** "The founder and the marketing lead both approve designs" means nobody does. Ask the client to name one, and record it.
- **The decision is reopened next week.** Show the minutes that recorded it. Reopening it is allowed, but treat it as a new change, with its own effect on time and cost, possibly a [[term:change-request|CR]].
- **An overrun pushes out the decision item.** Move decision items to the start of future agendas.
- **"Let's take it offline."** Agree who, when and by which date the decision comes back.
- **The PM decides for the client.** You drive; the client approves anything that is their call (designs, scope, go-live).`,
        },
        {
          heading: "Your checklist",
          body: `- Each decision written as a question, with options, sent 24 hours before.
- One named Approver per decision, agreed at kickoff where possible.
- Every agenda item timeboxed; decision items first.
- At time: decide, defer with owner and date, or extend explicitly.
- Parking lot for off-topic items.
- Decision read back in the meeting.
- Minutes with decisions sent the same day.`,
        },
      ],
      handbook: {
        rules: ["mom-after-every-client-meeting", "design-revision-rounds"],
        templates: ["mom", "kickoff-agenda"],
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-d05-craft-timebox-decisions-q1",
          prompt: "In DACI, how many Approvers should a decision have?",
          options: ["Exactly one", "Two, for balance", "Everyone affected", "None; the group decides"],
          correctIndex: 0,
          explanation:
            "DACI is explicit: one person makes the decision. Two approvers usually means nobody decides.",
        },
        {
          id: "pmp-d05-craft-timebox-decisions-q2",
          prompt: "Your 15-minute timebox for the checkout design runs out without agreement. What are your valid options? (Select all that apply.)",
          options: [
            "Ask the Approver to decide now",
            "Defer with an owner, the missing information and a date",
            "Extend by a stated amount and drop another item to make room",
            "Keep discussing until everyone agrees, however long it takes",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "At the end of a timebox you decide, defer with an owner, or extend on purpose. Open-ended discussion is what timeboxing prevents.",
        },
        {
          id: "pmp-d05-craft-timebox-decisions-q3",
          prompt: "The client says: \"Our founder and our marketing lead both approve designs.\" What is the risk, and what do you do?",
          options: [
            "Nobody clearly decides and approvals get reversed; ask the client to name one Approver and record it",
            "No risk; two approvals are safer",
            "Ask both to sign every design",
            "Let the marketing lead decide, since they attend more often",
          ],
          correctIndex: 0,
          explanation:
            "With two approvers, one can overturn the other after work has started. Agree one and write it in the minutes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d05-craft-timebox-decisions-q4",
          prompt: "Where should decision items go on the agenda?",
          options: [
            "Early, while people are fresh and before anything can overrun",
            "At the end, after all updates",
            "Anywhere; order does not matter",
            "In a separate email instead",
          ],
          correctIndex: 0,
          explanation:
            "Decisions put last are the first to be squeezed by an overrun.",
        },
        {
          id: "pmp-d05-craft-timebox-decisions-q5",
          prompt: "Two weeks after the client approved the checkout design, they want to reopen it. Development has started. How do you treat it?",
          options: [
            "Show the recorded decision; a reopening is a new change with its own effect on time and cost, possibly a CR",
            "Accept it as part of the original design round",
            "Refuse to discuss it",
            "Restart the design phase at no cost",
          ],
          correctIndex: 0,
          explanation:
            "Clients may change their minds, but a recorded decision makes the cost of the change visible and fair.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d05-craft-timebox-decisions-q6",
          prompt: "Which is the best way to write a decision item in the agenda?",
          options: [
            "\"Approve the checkout design: yes, revise or reject? (Approver: Sarah, 15 min)\"",
            "\"Discuss the design\"",
            "\"Design\"",
            "\"Any thoughts on the checkout?\"",
          ],
          correctIndex: 0,
          explanation:
            "A question with options, a named Approver and a timebox makes it clear what the meeting must produce.",
        },
        {
          id: "pmp-d05-craft-timebox-decisions-q7",
          prompt: "What does the Scrum Guide mean when it treats event lengths as timeboxes?",
          options: [
            "They are maximums: an event can end early once its purpose is met",
            "They are targets the event must fill",
            "They are minimums",
            "They only apply to the Daily Scrum",
          ],
          correctIndex: 0,
          explanation:
            "Timeboxes cap the time. Ending early when the purpose is met is a good outcome.",
        },
        {
          id: "pmp-d05-craft-timebox-decisions-q8",
          prompt: "Which are signs the PM has overstepped the Driver role? (Select all that apply.)",
          options: [
            "The PM approves the client's design on their behalf to save time",
            "The PM tells the team go-live is approved before the client sponsor has decided",
            "The PM accepts a CR for the client without the client's written approval",
            "The PM sends the options 24 hours before the meeting",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The Driver makes sure a decision happens; the client approves the client's decisions. Sending options in advance is exactly the Driver's job.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d05-craft-timebox-decisions-q9",
          prompt: "Someone raises an important topic that is not on today's agenda. What do you do?",
          options: [
            "Put it in the parking lot with an owner and schedule it",
            "Discuss it now and drop the decision item",
            "Ignore it",
            "End the meeting early",
          ],
          correctIndex: 0,
          explanation:
            "The parking lot respects the topic without losing the meeting's purpose.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You run a 45-minute design review with a client for a Laravel and React web app for a UAE property agency. The agenda: (1) last week's actions, 5 min; (2) the listing-page design decision, 20 min; (3) the image-upload limits, 10 min; (4) next steps, 10 min. At the kickoff, the client named their head of marketing, Layla, as the design Approver. Their founder has joined unexpectedly.",
        steps: [
          {
            id: "overrun",
            question: "Item 1 is still running after 12 minutes: the founder is reopening last week's map-provider decision. What do you do?",
            options: [
              "Let it run; the founder is senior",
              "Acknowledge the point, put it in the parking lot with an owner and a date, and move to the design decision",
              "Cancel the design decision and discuss the map provider",
              "Ask the founder to leave the meeting",
            ],
            correctIndex: 1,
            explanation: "The parking lot respects the founder's concern without losing the decision the meeting exists for.",
          },
          {
            id: "approver",
            question: "On the listing page, Layla prefers option A; the founder prefers option B. Time is nearly up. What do you do?",
            options: [
              "Pick the option you like best",
              "Ask the client side to confirm who approves this decision (Layla was named at kickoff) and ask that person to decide now, or set a date for the decision",
              "Build both options",
              "Wait until they agree, however long it takes",
            ],
            correctIndex: 1,
            explanation: "DACI needs one Approver. Use the kickoff record, but let the client confirm it. If it cannot be settled now, set an owner and a date.",
          },
          {
            id: "record",
            question: "Layla decides on option A, with a larger photo gallery. How do you close the item?",
            options: [
              "Read the decision back, note the change to the gallery, check whether it changes the agreed scope, and send it in the minutes the same day",
              "Say \"great\" and move on",
              "Ask the founder to approve it as well",
              "Start the work and write the minutes next week",
            ],
            correctIndex: 0,
            explanation: "A read-back and same-day minutes stop the decision being reopened. Checking scope catches a hidden change request early.",
          },
        ],
      },
      sop: [
        {
          title: "Our client decision log",
          prompt:
            "[Oyelabs SOP – admin to fill] Where client decisions are logged (a decision log, the MoM, the project tool), how approvers are recorded at kickoff, and the standard agenda format with timeboxes for client meetings.",
        },
      ],
    },
  ],
} satisfies Module;
