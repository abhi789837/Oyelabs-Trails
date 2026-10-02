import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a05",
  trackId: "pm",
  name: "Custom lifecycle: Discovery & requirements",
  description:
    "Turning the sold scope into testable requirements: running discovery workshops that surface the real decisions, writing user stories with acceptance criteria a tester can use, and freezing and signing off the requirements so change control has a baseline to protect.",
  topics: [
    {
      id: "pmp-a05-discovery",
      moduleId: "pmp-a05",
      trackId: "pm",
      title: "Running discovery",
      summary:
        "[[term:discovery]] is where the scope in the [[term:sow]] becomes something the team can build and test. The SOW says \"booking module\". Discovery answers: who books, for whom, how they pay, what happens when they cancel, and which edge cases matter.\n\nWhy it matters at an agency: on a [[term:fixed-bid]] project every unanswered question is a cost risk. Questions answered in discovery are cheap. The same questions answered in UAT become disputes about whether the work is a [[term:bug]] or a [[term:change-request]].\n\nHow to do it:\n\n- Plan workshops by flow or feature area, not by stakeholder. Invite the people who actually do the work, plus the person who can decide.\n- Send an agenda and pre-reads. Bring the proposal, the [[term:sow]] and a first draft of the flows so people react to something concrete.\n- Ask about the current process, exceptions and volumes, not just \"what do you want\".\n- Write every answer down. Each finding becomes a requirement, an [[term:assumption]], a [[term:client-dependency]], an [[term:out-of-scope]] item or an open question with an owner and a date.\n- Send a [[term:mom]] after every session.\n\nThe common mistake is treating discovery as a wish-list session. The client lists features, the PM writes them down, and nobody checks them against the signed scope. Discovery details the agreed scope. New wishes go on a separate list for the client to prioritise or price.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "GOV.UK Service Manual: How the discovery phase works", url: "https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works", kind: "docs", verifiedAt: "2026-10-02T11:51:24Z" },
        { label: "Nielsen Norman Group: Discovery - definition", url: "https://www.nngroup.com/articles/discovery-phase/", kind: "article", verifiedAt: "2026-10-02T11:55:35Z" },
        { label: "Nielsen Norman Group: Stakeholder interviews 101", url: "https://www.nngroup.com/articles/stakeholder-interviews/", kind: "article", verifiedAt: "2026-10-02T12:07:34Z" },
        { label: "Atlassian Team Playbook: Customer interview", url: "https://www.atlassian.com/team-playbook/plays/customer-interview", kind: "docs", verifiedAt: "2026-10-02T12:05:51Z" },
      ],
      video: {
        title: "What is a Discovery Phase? (And Why It's Critical for Software Development Project Success)",
        channel: "SumatoSoft",
        url: "https://www.youtube.com/watch?v=J8zEEST9z3s",
        videoId: "J8zEEST9z3s",
        verifiedAt: "2026-10-02T12:17:00Z",
      },
      alternateVideos: [
        { title: "The what, why and how of a Discovery Phase", channel: "Zaizi", url: "https://www.youtube.com/watch?v=DTnY6tgqOgc", videoId: "DTnY6tgqOgc", verifiedAt: "2026-10-02T12:17:00Z" },
        {
          title: "Discovery Phase: How to properly plan your software development project? SaaS Product Roadmapping",
          channel: "SoftFormance OU",
          url: "https://www.youtube.com/watch?v=7LmHJFXlmII",
          videoId: "7LmHJFXlmII",
          verifiedAt: "2026-10-02T12:17:00Z",
        },
      ],
      handbook: { stages: ["custom-discovery"], rules: ["mom-after-every-client-meeting"], templates: ["mom", "raid-log-template"] },
      sections: [
        {
          heading: "Planning the workshops",
          body:
            "Split discovery by flow, not by meeting length. For a typical marketplace app that might be: onboarding and accounts, the core transaction, payments and refunds, notifications, the admin panel, and reports.\n\nFor each workshop decide:\n\n- **Who must attend.** Someone who does the work today, and someone who can make the decision. A workshop with neither produces guesses.\n- **What you bring.** The relevant lines of the [[term:sow]] and proposal, a rough flow or [[term:wireframe]], and your list of known questions.\n- **What \"done\" means.** Every step of the flow is agreed, every exception has an answer or an owner, and the open questions have dates.\n\nThe tech lead should attend the sessions on integrations, payments and data. The designer should attend the flow sessions. Discovery is also where the team learns the client's language.",
        },
        {
          heading: "Questions that find the real requirements",
          body:
            "Clients describe the happy path. Your job is to find the rest.\n\n- **Walk me through the last time this happened.** Real stories expose real steps.\n- **What happens when it goes wrong?** Cancellations, refunds, no-shows, failed payments, duplicate accounts.\n- **How many?** Users, orders per day, branches, languages, file sizes. Volume changes the design.\n- **Who else touches this?** Finance, support, a third-party system, a regulator.\n- **What do you use today?** An existing system usually means data migration or an integration that nobody mentioned in sales.\n- **Is this needed for launch?** Separates the [[term:mvp]] from [[term:phase-2]] and [[term:nice-to-have]] items.\n\nWhen the client says \"we will decide later\" about a core flow, log it as an open question with an owner and a date. Do not build around it silently.",
        },
        {
          heading: "Sorting what you hear",
          body:
            "Every finding goes into exactly one place:\n\n- **Requirement:** agreed behaviour inside the signed scope. It becomes a [[term:user-story]].\n- **[[term:assumption]]:** something you are treating as true without proof, such as \"the client's existing SMS provider has an API\". Log it in the [[term:raid-log]] with an owner who will confirm it.\n- **[[term:client-dependency]]:** something the client must provide by a date: content, API keys, a payment account, legal text.\n- **[[term:out-of-scope]]:** a wish that is not in the SOW. Record it and tell the client it needs a [[term:change-request]] or a later phase.\n- **Open question:** not yet answered. Owner and due date.\n\nThe sorting is what turns workshop notes into a plan. Unsorted notes are why teams later argue about what was agreed.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Workshops planned by flow, with a decision-maker invited to each.\n2. Agenda and pre-reads sent before each session.\n3. A [[term:mom]] sent after each session, following the Oyelabs rule in the handbook card below.\n4. Every finding sorted: requirement, assumption, dependency, out of scope or open question.\n5. Assumptions and dependencies are in the [[term:raid-log]] with owners and dates.\n6. Out-of-scope wishes listed separately and shared with the client.\n7. No open question on a core flow is left without an owner.",
        },
      ],
      sop: [
        {
          title: "Discovery workshop pack",
          prompt: "[Oyelabs SOP – admin to fill] Link the Oyelabs discovery workshop agenda, the standard question bank per project type (Laravel web, React, mobile), and where workshop recordings and notes are stored.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a05-discovery-q1",
          prompt: "What is the main purpose of discovery on a custom fixed-bid project?",
          options: [
            "To turn the signed scope into detailed, testable requirements and surface risks before build",
            "To collect every feature the client might want so the scope can grow",
            "To replace the SOW with a new contract",
            "To start coding while the client thinks",
          ],
          correctIndex: 0,
          explanation: "Discovery details the agreed scope and exposes questions while they are still cheap to answer. It does not expand or replace the [[term:sow]].",
        },
        {
          id: "pmp-a05-discovery-q2",
          prompt: "In a workshop, the client's operations head asks for a loyalty-points feature. The SOW does not mention loyalty. What do you do?",
          options: [
            "Record it as out of scope, tell the client it needs a change request or a later phase, and keep the workshop on the agreed scope",
            "Add it to the user stories, because the client asked in discovery",
            "Ignore it and do not write it down",
            "Promise it will fit in the current price if it is small",
          ],
          correctIndex: 0,
          explanation: "New wishes are written down and kept visible, but they are [[term:out-of-scope]] until a [[term:change-request]] is approved. Silently adding them is how fixed bids lose money.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a05-discovery-q3",
          prompt: "Which of these belong in the RAID log after a discovery session? (Select all that apply.)",
          options: [
            "\"We assume the client's SMS provider has a usable API\" (not yet confirmed)",
            "\"Client to provide Arabic content for all screens by 15 March\"",
            "\"Payment provider sandbox access may take three weeks\"",
            "\"The booking screen shows available slots\" (agreed behaviour)",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "An unconfirmed belief is an [[term:assumption]], content from the client is a [[term:client-dependency]], and a possible delay is a [[term:risk]]. Agreed behaviour is a requirement and becomes a [[term:user-story]].",
        },
        {
          id: "pmp-a05-discovery-q4",
          prompt: "The client says \"we'll decide the refund rules later\" about the core payment flow. What is the best response?",
          options: [
            "Log it as an open question with an owner and a due date before build of that flow, and flag the risk",
            "Build the simplest refund flow and let them change it in UAT",
            "Accept it and move on; refunds are a detail",
            "Stop the project until they decide",
          ],
          correctIndex: 0,
          explanation: "\"Decide later\" on a core flow is a classic discovery pitfall. A dated, owned open question keeps it visible without blocking everything else.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a05-discovery-q5",
          prompt: "Who should you make sure attends a discovery workshop?",
          options: [
            "Someone who does the work today and someone who can make the decision",
            "Only the client's CEO",
            "Only the developers",
            "Whoever is free that day",
          ],
          correctIndex: 0,
          explanation: "The doer knows the real steps and exceptions; the decision-maker can close questions. Without them you collect guesses.",
        },
        {
          id: "pmp-a05-discovery-q6",
          prompt: "Which question is most likely to uncover a hidden integration or data-migration need?",
          options: ["\"What do you use for this today?\"", "\"What colour should the button be?\"", "\"Do you like the app?\"", "\"Can we start next week?\""],
          correctIndex: 0,
          explanation: "An existing system almost always means data to migrate or a system to integrate with, and both are often missed in sales.",
        },
        {
          id: "pmp-a05-discovery-q7",
          prompt: "Why ask \"how many?\" questions (users, orders per day, branches) in discovery?",
          options: [
            "Volume changes design, hosting and performance decisions, and it is costly to learn late",
            "To fill in the proposal",
            "Only to estimate the invoice",
            "It is not useful for agencies",
          ],
          correctIndex: 0,
          explanation: "Ten bookings a day and ten thousand need different architecture and testing. Discovery is the cheap place to find out.",
        },
        {
          id: "pmp-a05-discovery-q8",
          prompt: "Two weeks into discovery, workshops keep producing new features and nothing is closed. What is the most likely root cause and fix?",
          options: [
            "The sessions are wish-list sessions, not scope-detailing sessions; reset each workshop around the signed scope and a 'done' definition",
            "The team needs more workshops",
            "The client is wrong and should be told so",
            "Discovery should be skipped and the team should start coding",
          ],
          correctIndex: 0,
          explanation: "Each workshop needs the SOW lines it details and a clear end state. New ideas go to a separate list for prioritising or pricing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a05-discovery-q9",
          prompt: "What should be sent after every discovery workshop?",
          options: [
            "Minutes of meeting with decisions, actions, owners and open questions",
            "The final invoice",
            "Nothing until the BRD is ready",
            "A recording only, with no written summary",
          ],
          correctIndex: 0,
          explanation: "A [[term:mom]] turns a conversation into a written record the client can correct while it is fresh.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "You ran the first discovery workshop for a Laravel booking platform for a UK physiotherapy clinic chain (fixed bid). The SOW covers: patient booking and cancellation, card payment at booking, email and SMS reminders, a clinic admin panel and basic reports. Sort each note from the workshop.",
        categories: [
          { id: "requirement", label: "Requirement (in scope)" },
          { id: "assumption", label: "Assumption to confirm" },
          { id: "dependency", label: "Client dependency" },
          { id: "out-of-scope", label: "Out of scope (CR or later phase)" },
          { id: "open-question", label: "Open question" },
        ],
        items: [
          { id: "n1", text: "Patients can cancel up to 24 hours before the appointment without a fee.", explanation: "Agreed behaviour of an in-scope flow (cancellation). It becomes a user story with acceptance criteria." },
          { id: "n2", text: "We think the clinics' current SMS provider can send messages through an API, but nobody has checked.", explanation: "Believed but not verified. Log it as an assumption with an owner to confirm it." },
          { id: "n3", text: "The client will provide the list of clinics, therapists and opening hours as a spreadsheet by 10 May.", explanation: "Something the client must supply by a date: a client dependency." },
          { id: "n4", text: "The marketing lead wants a patient loyalty scheme with points for each visit.", explanation: "Not in the SOW. Record it and route it to a change request or a later phase." },
          { id: "n5", text: "Nobody could say whether late cancellations are charged automatically or reviewed by staff first.", explanation: "An unanswered question on a core flow. Give it an owner and a due date." },
          { id: "n6", text: "Clinic managers can see a daily list of bookings per therapist in the admin panel.", explanation: "Part of the in-scope admin panel and reports. A requirement." },
          { id: "n7", text: "The client's finance team must open the payment gateway account and share sandbox keys.", explanation: "The client owns the account and must act: a client dependency." },
          { id: "n8", text: "A video-consultation feature for remote sessions.", explanation: "Not in the signed scope. Out of scope until a change request is approved." },
          { id: "n9", text: "We assume patients book for themselves only, not for family members.", explanation: "A working belief that affects the data model. Log it as an assumption and get it confirmed." },
          { id: "n10", text: "Which reports does the regional manager need, and in what format?", explanation: "Reports are in scope, but the detail is unknown. An open question with an owner." },
        ],
        answer: {
          n1: "requirement",
          n2: "assumption",
          n3: "dependency",
          n4: "out-of-scope",
          n5: "open-question",
          n6: "requirement",
          n7: "dependency",
          n8: "out-of-scope",
          n9: "assumption",
          n10: "open-question",
        },
      },
    },
    {
      id: "pmp-a05-stories-acceptance",
      moduleId: "pmp-a05",
      trackId: "pm",
      title: "User stories and acceptance criteria",
      summary:
        "A [[term:user-story]] says who needs something and why: \"As a patient, I want to cancel my booking online so that I do not have to call the clinic.\" [[term:acceptance-criteria]] say how everyone will know it is done: the exact conditions QA tests and the client accepts in [[term:uat]].\n\nWhy it matters at an agency: acceptance criteria are the line between a [[term:bug]] and a [[term:change-request]]. If the criteria say \"cancellation is free up to 24 hours before\", then a fee charged at 30 hours is a bug. A request for a fee at 12 hours is a change. Without criteria, both become an argument, and on a [[term:fixed-bid]] project the agency usually loses that argument.\n\nHow to do it:\n\n- Write stories from the user's point of view, small enough to build and test in one [[term:sprint]].\n- Write criteria that are testable: a tester can say pass or fail without asking anyone. Given-When-Then works well for flows.\n- Cover the unhappy paths: errors, limits, permissions, empty states.\n- Review stories with the tech lead and QA before the client sees them, and with the client before the [[term:requirement-freeze]].\n\nThe common mistake is criteria that restate the story or use words like \"fast\", \"user-friendly\" or \"works properly\". They cannot be tested, so they cannot protect the scope.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "GOV.UK Service Manual: Writing user stories", url: "https://www.gov.uk/service-manual/agile-delivery/writing-user-stories", kind: "docs", verifiedAt: "2026-10-02T11:51:25Z" },
        { label: "Atlassian: Acceptance criteria - definition, examples and tips", url: "https://www.atlassian.com/work-management/project-management/acceptance-criteria", kind: "article", verifiedAt: "2026-10-02T11:54:23Z" },
        { label: "Martin Fowler: Given When Then", url: "https://martinfowler.com/bliki/GivenWhenThen.html", kind: "article", verifiedAt: "2026-10-02T12:07:50Z" },
        { label: "Atlassian: User stories with examples and a template", url: "https://www.atlassian.com/agile/project-management/user-stories", kind: "article", verifiedAt: "2026-10-02T12:06:17Z" },
      ],
      video: {
        title: "User Stories and Acceptance Criteria EXAMPLE (Agile Story Tutorial)",
        channel: "The Business Analysis Doctor - IIBA Certification",
        url: "https://www.youtube.com/watch?v=q26147zlcMU",
        videoId: "q26147zlcMU",
        verifiedAt: "2026-10-02T12:17:00Z",
      },
      alternateVideos: [
        { title: "How to write good User Stories in Agile", channel: "The Agile Shop", url: "https://www.youtube.com/watch?v=7hoGqhb6qAs", videoId: "7hoGqhb6qAs", verifiedAt: "2026-10-02T12:17:01Z" },
        {
          title: "How to Identify Given-When-Then (Gherkin) Scenarios From Functional Requirements",
          channel: "BA-EXPERTS - Learn Business Analysis by Example",
          url: "https://www.youtube.com/watch?v=2uB93oc2TxA",
          videoId: "2uB93oc2TxA",
          verifiedAt: "2026-10-02T12:17:05Z",
        },
      ],
      handbook: { stages: ["custom-discovery"], rules: ["cr-when-needed"] },
      sections: [
        {
          heading: "Anatomy of a story that protects the scope",
          body:
            "A good story has four parts:\n\n1. **The story line.** \"As a [role], I want [capability] so that [benefit].\" The benefit tells the team what matters when a detail is unclear.\n2. **[[term:acceptance-criteria]].** Testable conditions, written as rules or Given-When-Then scenarios.\n3. **Notes and links.** The [[term:wireframe]] or [[term:mockup]], the business rule, the API it depends on.\n4. **Out of scope for this story.** One line that stops the story growing: \"Rescheduling is a separate story.\"\n\nThe test for every criterion: could a QA engineer who missed every workshop decide pass or fail from this sentence alone? If not, rewrite it.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A Laravel booking platform for a UK physiotherapy clinic chain, fixed bid.** Discovery agreed that patients can cancel online.\n\nA weak first draft: *\"As a user, I want to cancel bookings. Criteria: cancellation works properly and is user-friendly.\"*\n\nThe PM rewrites it with the tech lead and QA:\n\n*As a patient, I want to cancel my booking online so that I do not have to phone the clinic.*\n\n- **Given** a confirmed booking more than 24 hours away, **when** the patient cancels, **then** the booking status becomes Cancelled, the slot is released and the full card payment is refunded.\n- **Given** a booking 24 hours away or less, **when** the patient tries to cancel, **then** the app shows the clinic's phone number and does not cancel online.\n- **Given** a cancelled booking, **then** the patient receives a cancellation email within 5 minutes and the therapist's daily list no longer shows it.\n- **Given** a booking that belongs to another patient, **when** the cancel request is sent, **then** it is refused.\n- *Out of scope for this story:* cancellation fees and rescheduling.\n\nIn UAT the clinic asks for a GBP 15 fee for late cancellations instead of blocking them. Because the criteria are clear, the PM can say calmly that this is new behaviour and raise a [[term:change-request]], following the Oyelabs rule in the handbook card below. Nobody argues about whether it was \"always meant\".",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Untestable words.** \"Fast\", \"secure\", \"intuitive\", \"properly\". Recover: replace each with a number or an observable result (\"loads in under 3 seconds on 4G\", \"refused with an error message\").\n- **Only the happy path.** Recover: add one criterion each for invalid input, permissions and the empty state.\n- **Stories that are really epics.** \"As an admin I want to manage everything.\" Recover: split by role, action or data until each fits in a sprint.\n- **Criteria written after the build.** Then they describe what was built, not what was agreed. Recover: no story enters a sprint without criteria; use the [[term:definition-of-ready]].\n- **Client never saw the criteria.** Recover: review them in a short session and include them in the [[term:requirement-freeze]] pack.\n- **Solutions in the story.** \"As a user I want a dropdown.\" Recover: state the need; leave the design to the designer.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Each story names a real role and a benefit.\n2. Each story fits in one [[term:sprint]].\n3. Every criterion is testable by someone who missed the workshops.\n4. Unhappy paths, permissions and empty states are covered.\n5. Out-of-scope notes are written where the story could grow.\n6. Tech lead and QA reviewed the stories before the client did.\n7. The client reviewed the criteria before sign-off.",
        },
      ],
      sop: [
        {
          title: "Story and acceptance-criteria format",
          prompt: "[Oyelabs SOP – admin to fill] State the Oyelabs story template, where stories live (board and project), the required fields, and who reviews stories before they go to the client.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a05-stories-acceptance-q1",
          prompt: "Which acceptance criterion is testable?",
          options: [
            "Given a booking more than 24 hours away, when the patient cancels, then the full payment is refunded",
            "Cancellation should be easy and user-friendly",
            "The cancel feature works properly",
            "Cancellation is handled as the client expects",
          ],
          correctIndex: 0,
          explanation: "A tester can decide pass or fail from the first one. The others need someone's opinion.",
        },
        {
          id: "pmp-a05-stories-acceptance-q2",
          prompt: "In UAT the client says: \"A late cancellation should charge GBP 15, not be blocked.\" The signed criteria say late cancellations are blocked online. What is it?",
          options: ["A change request", "A bug", "A clarification", "A regression"],
          correctIndex: 0,
          explanation: "The build matches the agreed criteria. The client wants different behaviour, so it is a [[term:change-request]]. Clear criteria make this an easy, calm conversation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a05-stories-acceptance-q3",
          prompt: "In UAT, a cancellation 30 hours before the appointment is blocked. The criteria say cancellation is free more than 24 hours before. What is it?",
          options: ["A bug", "A change request", "A new feature", "An enhancement"],
          correctIndex: 0,
          explanation: "The software does not meet the agreed criteria, so it is a [[term:bug]], fixed within the agreed scope.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a05-stories-acceptance-q4",
          prompt: "Which of these are weaknesses in a user story? (Select all that apply.)",
          options: [
            "\"As a user, I want a dropdown of clinics\" (prescribes a UI solution)",
            "\"As an admin, I want to manage everything\" (too big for a sprint)",
            "Criteria that only cover the happy path",
            "A line saying rescheduling is a separate story",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Solutions in the story, epic-sized stories and happy-path-only criteria are all weaknesses. An explicit out-of-scope line is a strength.",
        },
        {
          id: "pmp-a05-stories-acceptance-q5",
          prompt: "Where does the Given-When-Then format come from?",
          options: ["Behaviour-driven development (BDD)", "The Scrum Guide", "The PMBOK Guide", "ISO 9001"],
          correctIndex: 0,
          explanation: "Given-When-Then comes from BDD. It is common practice, not part of the Scrum Guide.",
        },
        {
          id: "pmp-a05-stories-acceptance-q6",
          prompt: "Why does the \"so that\" part of a story matter?",
          options: [
            "It tells the team the benefit, which guides decisions when a detail is unclear",
            "It is only there for grammar",
            "It sets the price",
            "It replaces the acceptance criteria",
          ],
          correctIndex: 0,
          explanation: "Knowing why a user needs something helps the team choose sensibly and helps you spot gold-plating.",
        },
        {
          id: "pmp-a05-stories-acceptance-q7",
          prompt: "A developer writes the acceptance criteria after finishing the feature. What is the problem?",
          options: [
            "The criteria describe what was built, not what was agreed, so they cannot protect the scope",
            "There is no problem; the developer knows best",
            "Only that it takes extra time",
            "It makes UAT faster",
          ],
          correctIndex: 0,
          explanation: "Criteria exist to agree the target before the build. Written afterwards, they lose their value as the line between bug and change.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a05-stories-acceptance-q8",
          prompt: "How do you fix the criterion \"The page loads fast\"?",
          options: [
            "Replace it with a measurable target, e.g. \"loads in under 3 seconds on a 4G connection\"",
            "Delete it",
            "Change it to \"The page loads very fast\"",
            "Let QA decide what fast means",
          ],
          correctIndex: 0,
          explanation: "Untestable words become numbers or observable results. Who sets the number is a client decision you record.",
        },
        {
          id: "pmp-a05-stories-acceptance-q9",
          prompt: "Who should review stories before they go to the client?",
          options: ["The tech lead and QA", "Only the BD manager", "Nobody", "Only the designer"],
          correctIndex: 0,
          explanation: "The tech lead checks feasibility and size; QA checks the criteria are testable. Then the client reviews them.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Below is a mini backlog for a React Native food-ordering app for a restaurant group in Dubai (fixed bid). Mark every line that is weak: untestable, missing a role or benefit, prescribing a solution, too big for a sprint, or silently adding scope the SOW does not include. The SOW covers ordering, card payment, order tracking and a restaurant admin panel.",
        segments: [
          { id: "s1", text: "Story 1: As a customer, I want to reorder a previous order so that I can order my usual meal in one tap.", issue: null },
          { id: "s2", text: "Criterion: Given a past order whose items are all available, when the customer taps Reorder, then the cart contains the same items and quantities.", issue: null },
          { id: "s3", text: "Criterion: Reorder works properly.", issue: "Untestable. 'Works properly' gives QA nothing to check." },
          { id: "s4", text: "Criterion: Given a past order with an item that is no longer available, when the customer taps Reorder, then the unavailable item is left out and a message names it.", issue: null },
          { id: "s5", text: "Story 2: As an admin, I want to manage the whole restaurant.", issue: "Epic-sized and vague. Split it by action (menu, prices, opening hours) so each fits a sprint." },
          { id: "s6", text: "Story 3: As a customer, I want a green dropdown to pick my branch.", issue: "Prescribes the UI and gives no benefit. State the need (choose the branch) and let the designer decide." },
          { id: "s7", text: "Criterion: Given the customer is logged in, when they open Track Order, then they see the status Preparing, On the way or Delivered.", issue: null },
          { id: "s8", text: "Story 4: As a customer, I want to earn loyalty points on each order so that I get rewards.", issue: "Loyalty is not in the SOW. Writing it as a story adds scope silently; it needs a change request." },
          { id: "s9", text: "Criterion: The tracking screen should be fast.", issue: "Untestable. Replace with a measurable target, such as status updates within 30 seconds." },
          { id: "s10", text: "Criterion: Given a payment that fails, when the customer returns to the cart, then the cart is unchanged and an error explains the failure.", issue: null },
          { id: "s11", text: "Out of scope for Story 1: scheduling an order for later.", issue: null },
          { id: "s12", text: "Story 5: As a restaurant manager, I want to mark an item as sold out so that customers cannot order it today.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pmp-a05-freeze-signoff",
      moduleId: "pmp-a05",
      trackId: "pm",
      title: "Requirements freeze and sign-off",
      summary:
        "[[term:requirement-freeze]] is the moment the detailed requirements stop changing freely. [[term:sign-off]] is the client's written confirmation that they are complete and correct. Together they create the [[term:scope-baseline]]: the version every later request is measured against.\n\nWhy it matters at an agency: after the freeze, a new idea is not \"a small tweak to the requirements\". It is a [[term:change-request]], with an impact on time and money that the client approves. Without a written sign-off, you have no baseline, every UAT comment is negotiable, and a [[term:fixed-bid]] project slowly turns into unpaid work.\n\nHow to do it:\n\n- Package the requirements: the [[term:brd]] or [[term:prd]], the user stories with [[term:acceptance-criteria]], the approved designs if they are part of it, out-of-scope items, and open assumptions and dependencies.\n- Walk the client sponsor through it. Do not just email a 60-page document and wait.\n- Ask for written sign-off from the person who is accountable, using the sign-off template, and record the freeze date.\n- From that date, route changes through change control, following the Oyelabs rule in the handbook card below.\n\nThe common mistake is accepting silence or a thumbs-up emoji from the wrong person as sign-off, or starting the build \"while they review\". Expert PMs also know what to do when sign-off never comes. That is covered in the sections below.\n\nNot legal advice: the signed contract always wins.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "PMI: Lexicon of Project Management Terms", url: "https://www.pmi.org/standards/lexicon", kind: "spec", verifiedAt: "2026-10-02T11:55:40Z" },
        { label: "APM: What is change control?", url: "https://www.apm.org.uk/resources/what-is-project-management/what-is-change-control/", kind: "article", verifiedAt: "2026-10-02T12:08:06Z" },
        { label: "APM: What is scope management?", url: "https://www.apm.org.uk/resources/what-is-project-management/what-is-scope-management/", kind: "article", verifiedAt: "2026-10-02T12:08:04Z" },
        { label: "ProjectManager: How to make a project baseline and why it matters", url: "https://www.projectmanager.com/blog/project-baseline", kind: "article", verifiedAt: "2026-10-02T11:56:52Z" },
      ],
      video: {
        title: "Gaining Buy-In and Sign-Off in Business Analysis for Requirements",
        channel: "Bridging the Gap - Resources for Business Analysts",
        url: "https://www.youtube.com/watch?v=l1iap5Dp3fQ",
        videoId: "l1iap5Dp3fQ",
        verifiedAt: "2026-10-02T12:17:05Z",
      },
      alternateVideos: [
        {
          title: "The 'Scope Creep' Killer: Why You MUST Get Client Sign-Off on Requirements",
          channel: "Quality Cynic",
          url: "https://www.youtube.com/watch?v=_LrbFaRH0ZU",
          videoId: "_LrbFaRH0ZU",
          verifiedAt: "2026-10-02T12:17:05Z",
        },
        {
          title: "Understanding Scope Baseline || Preventing Scope Creep",
          channel: "Project Management & Leadership Concepts",
          url: "https://www.youtube.com/watch?v=kw3LckoEeNo",
          videoId: "kw3LckoEeNo",
          verifiedAt: "2026-10-02T12:17:06Z",
        },
      ],
      handbook: { stages: ["custom-discovery"], rules: ["requirement-freeze-after-signoff", "cr-when-needed"], templates: ["requirement-signoff"] },
      sections: [
        {
          heading: "What a sign-off pack contains",
          body:
            "A client cannot sign off what they cannot see in one place. The pack follows the requirement sign-off template linked below:\n\n- **Document reference and version**, so there is no doubt which version was approved.\n- **Scope summary** in plain language, one page.\n- **Documents included:** the [[term:brd]] or [[term:prd]], the user stories with [[term:acceptance-criteria]], and designs if they are part of the baseline.\n- **[[term:out-of-scope]] items**, written as explicitly as the in-scope ones.\n- **Open [[term:assumption]]s and [[term:dependency|dependencies]]**, each with an owner.\n- **A change control statement:** after sign-off, changes follow the [[term:change-request]] process.\n- **Signatures** from the accountable client person and from Oyelabs.\n\nThe out-of-scope list and the change control statement are what make the sign-off useful later. Without them, the client is signing a description, not a baseline.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A Laravel and React Native booking platform for a UK physiotherapy clinic chain, fixed bid, three milestones.** Discovery ran for three weeks. The PM has 48 stories with criteria, approved flows for booking and cancellation, and two open assumptions.\n\n1. **Pack.** The PM assembles the sign-off pack as version 1.0. Out of scope lists: loyalty scheme, video consultations, cancellation fees, insurance billing. Open: the SMS provider API (owner: client IT, due 20 May) and the patient data import format (owner: Oyelabs tech lead, due 22 May).\n2. **Walkthrough.** A 60-minute session with the client sponsor and the operations lead. The PM walks the scope summary, every out-of-scope item and the change control statement, not every story. Two corrections come up; the PM fixes them and issues version 1.1.\n3. **Sign-off.** The sponsor, who is named as accountable in the RACI, signs the template. The PM records the freeze date in the plan and the [[term:raid-log]], and sends a [[term:mom]].\n4. **First test.** Two weeks into the build, the operations lead asks for a cancellation fee. The PM replies the same day: thanks, it is listed as out of scope in version 1.1, here is a [[term:change-request]] with impact on time and cost for the sponsor to approve. The tone stays friendly because the baseline does the arguing.",
        },
        {
          heading: "When sign-off does not come",
          body:
            "Silence is the hardest case. The build is planned, the team is allocated, and the client is \"still reviewing\".\n\n- **Set a review deadline in writing** when you send the pack, and remind before it, not after.\n- **Make the cost of waiting visible:** \"Each week without sign-off moves the first milestone by about a week.\" That is a schedule fact, not a threat.\n- **Narrow the ask.** Offer to sign off the first-sprint areas first, if that is acceptable under the contract and the Oyelabs rule, so the team can start on frozen ground.\n- **Escalate on time.** Use the [[term:escalation-matrix]] agreed at kickoff, via the account manager to the sponsor.\n- **Never treat silence as approval** unless the signed contract says so in words. Some contracts include a deemed-acceptance clause; check yours with the account manager.\n\nIf leadership decides to start before sign-off, record that decision, the risk and who accepted it in the [[term:raid-log]].",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Sign-off from the wrong person.** The SPOC approves, the sponsor later disowns it. Recover: confirm with the sponsor in writing and reference the RACI.\n- **A thumbs-up on chat.** Recover: send the template the same day and ask for formal sign-off, referencing the chat.\n- **No version number.** Then nobody knows what was approved. Recover: issue a versioned pack and get it re-confirmed.\n- **Out of scope left implicit.** Recover: add an explicit list before sign-off; after sign-off, add it with the next change request.\n- **Freezing too early.** Signing off with core flows still open just moves the argument to UAT. Recover: close or log open questions as owned assumptions first.\n- **Treating the freeze as a wall.** Changes are allowed; they just go through change control. Say \"yes, through a CR\", not \"no\".\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. The pack is versioned and follows the requirement sign-off template.\n2. Out-of-scope items are listed explicitly.\n3. Open assumptions and dependencies have owners and dates.\n4. The change control statement is in the pack.\n5. You walked the accountable client person through it.\n6. Written sign-off is from the person accountable in the RACI.\n7. The freeze date is recorded in the plan and the RAID log.\n8. The team knows the baseline version and where it lives.",
        },
      ],
      sop: [
        {
          title: "Requirement sign-off route",
          prompt: "[Oyelabs SOP – admin to fill] Describe how Oyelabs collects requirement sign-off (e-signature tool or email wording), where the signed pack is stored, and who at Oyelabs counter-signs.",
        },
        {
          title: "Starting work before sign-off",
          prompt: "[Oyelabs SOP – admin to fill] State who at Oyelabs can approve starting the build before written requirement sign-off, and how that decision is recorded.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a05-freeze-signoff-q1",
          prompt: "What does the requirement sign-off create?",
          options: [
            "The scope baseline that later requests are measured against",
            "The final invoice",
            "The UAT result",
            "A new contract that replaces the SOW",
          ],
          correctIndex: 0,
          explanation: "Signed requirements become the [[term:scope-baseline]]. After that, changes go through change control.",
        },
        {
          id: "pmp-a05-freeze-signoff-q2",
          prompt: "The client SPOC replies \"👍 looks good\" on chat to the requirements pack. The RACI names the client sponsor as accountable for sign-off. What do you do?",
          options: [
            "Thank them, then send the sign-off template to the sponsor for formal written sign-off, referencing the chat",
            "Treat the emoji as sign-off and freeze the requirements",
            "Wait silently until the sponsor says something",
            "Start the build and ask for sign-off at UAT",
          ],
          correctIndex: 0,
          explanation: "Sign-off must come in writing from the accountable person. An informal reaction from the SPOC is a good sign, not a baseline.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a05-freeze-signoff-q3",
          prompt: "Which items must a strong sign-off pack contain? (Select all that apply.)",
          options: [
            "A version number",
            "An explicit out-of-scope list",
            "A change control statement",
            "Open assumptions and dependencies with owners",
            "The team's hourly rates",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Version, out of scope, change control and owned assumptions make the sign-off usable as a baseline. Rates belong to the commercial documents.",
        },
        {
          id: "pmp-a05-freeze-signoff-q4",
          prompt: "Three weeks after the freeze, the client asks for a new report. What is the correct framing?",
          options: [
            "\"Yes, we can do that through a change request; here is the impact on time and cost for your approval.\"",
            "\"No, the requirements are frozen.\"",
            "\"Sure, we'll squeeze it in.\"",
            "\"We will do it after go-live for free.\"",
          ],
          correctIndex: 0,
          explanation: "The freeze does not forbid change; it routes change through a [[term:change-request]]. \"Yes, through a CR\" keeps the relationship and the margin.",
        },
        {
          id: "pmp-a05-freeze-signoff-q5",
          prompt: "The client has not signed after two weeks and keeps saying they are reviewing. The team is waiting. What is the best combination of moves?",
          options: [
            "Make the schedule impact visible in writing, offer to sign off the first-sprint areas first if allowed, and escalate via the agreed matrix",
            "Treat the silence as approval and start",
            "Re-write all the requirements",
            "Release the team to other projects without telling the client",
          ],
          correctIndex: 0,
          explanation: "Silence is not approval unless the contract says so. Show the cost of waiting, narrow the ask, and escalate on time.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a05-freeze-signoff-q6",
          prompt: "When can silence count as acceptance of the requirements?",
          options: [
            "Only if the signed contract explicitly includes a deemed-acceptance clause",
            "Always after five working days",
            "Whenever the PM sends a reminder",
            "Never under any contract",
          ],
          correctIndex: 0,
          explanation: "Some contracts say a document is accepted if not rejected within a period. Unless yours says that in words, silence is not sign-off. The signed contract always wins.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a05-freeze-signoff-q7",
          prompt: "Why is freezing requirements while core flows are still undecided a mistake?",
          options: [
            "It moves the argument to UAT, where changes are most expensive",
            "It is not a mistake; you can always change later for free",
            "Because freezes are only for white-label projects",
            "Because the designer cannot start",
          ],
          correctIndex: 0,
          explanation: "A baseline with holes in core flows protects nothing. Close the questions, or log them as owned assumptions, before freezing.",
        },
        {
          id: "pmp-a05-freeze-signoff-q8",
          prompt: "Leadership decides to start the build before sign-off to protect the date. What must the PM do?",
          options: [
            "Record the decision, the risk and who accepted it in the RAID log, and keep pursuing sign-off",
            "Refuse to start",
            "Start and say nothing",
            "Tell the client that sign-off is no longer needed",
          ],
          correctIndex: 0,
          explanation: "Starting early can be a valid business call, but the risk must be visible and owned, and sign-off still matters.",
        },
        {
          id: "pmp-a05-freeze-signoff-q9",
          prompt: "Which of these show requirement sign-off is truly done? (Select all that apply.)",
          options: [
            "Written sign-off from the accountable client person",
            "The freeze date recorded in the plan",
            "The team knows which version is the baseline",
            "The first sprint demo has happened",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Written sign-off, a recorded freeze date and a known baseline version end the stage. The sprint demo is later.",
        },
        {
          id: "pmp-a05-freeze-signoff-q10",
          prompt: "During the build, the team discovers a requirement in the signed pack is technically impossible as written. What is it and what do you do?",
          options: [
            "A baseline issue: raise it, agree an alternative with the client and record it through change control with a new version",
            "A bug the developers must fix quietly",
            "Nothing; build something close and say nothing",
            "A reason to cancel the project",
          ],
          correctIndex: 0,
          explanation: "The baseline changes only through change control, even when Oyelabs needs the change. Agree the alternative in writing and version the pack.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "requirement-signoff",
        prompt:
          "Prepare the requirement sign-off for the project below using the Oyelabs requirement sign-off template. Fill each section from the context. Pick the right signatory and say whether the pack is ready to send.",
        context:
          "**Project:** patient booking platform for a UK physiotherapy clinic chain (Laravel admin, React Native app), fixed bid.\n\n**Discovery outcome:** 48 user stories with acceptance criteria (version 1.1, after two corrections in the walkthrough on 14 May). Booking, cancellation and reminder flows approved as Figma designs. Reports: daily bookings per therapist, monthly revenue per clinic.\n\n**Not included (agreed in workshops):** loyalty scheme, video consultations, late-cancellation fees, insurance billing.\n\n**Open:** client IT to confirm the SMS provider API by 20 May; Oyelabs tech lead to confirm the patient import format by 22 May.\n\n**RACI:** client sponsor (Operations Director) is accountable for requirement sign-off; the clinic operations lead is the SPOC.",
        fields: [
          { id: "reference", label: "Document reference and version", input: "text", required: true, placeholder: "e.g. Booking platform requirements v1.1" },
          { id: "scope", label: "Scope summary", input: "textarea", required: true },
          { id: "documents", label: "Documents included", input: "textarea", required: true },
          { id: "outOfScope", label: "Out of scope", input: "textarea", required: true },
          { id: "assumptions", label: "Assumptions and dependencies", input: "textarea", required: true },
          { id: "changeControl", label: "Change control statement", input: "textarea", required: true },
          {
            id: "signatory",
            label: "Client signatory",
            input: "select",
            required: true,
            options: ["Client sponsor (Operations Director)", "Clinic operations lead (SPOC)", "Any clinic manager", "Oyelabs PM on the client's behalf"],
          },
          { id: "ready", label: "Is the pack ready to send for sign-off?", input: "select", required: true, options: ["Yes", "No"] },
        ],
        checks: [
          { fieldId: "signatory", expected: "Client sponsor (Operations Director)" },
          { fieldId: "ready", expected: "Yes" },
        ],
        rubric: [
          { label: "Version is explicit", points: 2, description: "The reference names version 1.1 so there is no doubt which version is approved." },
          { label: "Out of scope is complete and explicit", points: 3, description: "Lists loyalty, video consultations, late-cancellation fees and insurance billing." },
          { label: "Open items have owners and dates", points: 2, description: "SMS API (client IT, 20 May) and import format (Oyelabs tech lead, 22 May)." },
          { label: "Change control statement is clear", points: 3, description: "States that after sign-off, changes follow the change request process with impact on time and cost approved by the client." },
          { label: "Documents and scope are accurate", points: 2, description: "Names the 48 stories with criteria, the approved designs and the two reports; the summary is plain and short." },
        ],
        sampleAnswer: {
          reference: "Patient booking platform – requirements pack v1.1 (14 May)",
          scope:
            "Patient booking, cancellation and reminders in the React Native app; card payment at booking; clinic admin panel in Laravel; two reports (daily bookings per therapist, monthly revenue per clinic).",
          documents: "48 user stories with acceptance criteria (v1.1); approved Figma designs for booking, cancellation and reminder flows; report definitions.",
          outOfScope: "Loyalty scheme; video consultations; late-cancellation fees; insurance billing. Any of these can be requested later as a change request.",
          assumptions:
            "Assumption: the SMS provider offers a usable API – client IT to confirm by 20 May. Dependency: patient import format – Oyelabs tech lead to confirm by 22 May. If either is not confirmed by its date, the plan and cost may change.",
          changeControl:
            "From the date of sign-off these requirements are frozen and form the scope baseline. Any addition or change follows the change request process: Oyelabs will share the impact on time and cost, and work starts after the client's written approval.",
          signatory: "Client sponsor (Operations Director)",
          ready: "Yes",
        },
      },
    },
  ],
} satisfies Module;
