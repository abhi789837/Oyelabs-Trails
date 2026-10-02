import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a00",
  trackId: "pm",
  name: "Custom lifecycle: The custom lifecycle at a glance",
  description:
    "The whole custom-project lifecycle at Oyelabs on one page: the fifteen stages from BD handover to closure, the gates where a written decision is required, how the commercial model changes the shape of the project, and who is responsible and accountable at each step.",
  topics: [
    {
      id: "pmp-a00-lifecycle-map",
      moduleId: "pmp-a00",
      trackId: "pm",
      title: "The custom delivery lifecycle map",
      summary:
        "A custom project at Oyelabs is a Laravel, React or mobile build for one client, sold against a [[term:sow]]. It moves through fifteen stages, from the BD handover to [[term:closure]]. The live stage cards below hold the purpose, entry and exit criteria, RACI and pitfalls of each one. This topic is the map that ties them together.\n\nWhy it matters at an agency: the client pays for an outcome, but the agency gets paid at [[term:milestone|milestones]] and protected by written gates. A PM who knows only \"we are in sprints\" cannot say what must be true before the next stage starts, who signs, or which document proves it. That is how projects drift into UAT with no frozen requirements, or go live with no [[term:sign-off]].\n\nHow to use the map:\n\n- **Know the four phases.** Start (handover, estimation, kickoffs), define (discovery, design, Sprint 0), build and prove (sprints, scope control, QA and UAT, release), and run and close (hypercare, handover, support, closure).\n- **Know the gates.** Requirement sign-off, design approval, UAT sign-off and the go/no-go decision each need a named client approver and a written record.\n- **Know the exceptions.** Scope control is not a step in the line. It runs from the first sprint to the last day.\n\nThe common mistake is treating the lifecycle as paperwork for big projects. On a small [[term:fixed-bid]] build, a missing gate costs more, not less, because there is no margin to absorb rework.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "Microsoft Learn (Dynamics 365 implementation guide): Choose a project methodology", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/implementation-strategy-choose-methodology", kind: "docs", verifiedAt: "2026-10-02T12:01:01Z" },
        { label: "Atlassian: Software development life cycle (SDLC) guide", url: "https://www.atlassian.com/agile/software-development/sdlc", kind: "article", verifiedAt: "2026-10-02T11:54:28Z" },
        { label: "GOV.UK Service Manual: How the discovery phase works", url: "https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works", kind: "docs", verifiedAt: "2026-10-02T11:51:24Z" },
        { label: "GOV.UK Service Manual: How the live phase works", url: "https://www.gov.uk/service-manual/agile-delivery/how-the-live-phase-works", kind: "docs", verifiedAt: "2026-10-02T11:51:25Z" },
      ],
      video: {
        title: "Project Management for Agencies - A Complete Guide",
        channel: "Matt Byrom",
        url: "https://www.youtube.com/watch?v=HoY8WoROwB8",
        videoId: "HoY8WoROwB8",
        verifiedAt: "2026-10-02T12:16:54Z",
      },
      alternateVideos: [
        {
          title: "Software Development Life Cycle: Explained",
          channel: "AltexSoft",
          url: "https://www.youtube.com/watch?v=SaCYkPD4_K0",
          videoId: "SaCYkPD4_K0",
          verifiedAt: "2026-10-02T12:16:54Z",
        },
      ],
      handbook: {
        stages: [
          "custom-bd-handover",
          "custom-estimation",
          "custom-internal-kickoff",
          "custom-client-kickoff",
          "custom-discovery",
          "custom-design",
          "custom-sprint-0",
          "custom-sprints",
          "custom-scope-control",
          "custom-qa-uat",
          "custom-release",
          "custom-hypercare",
          "custom-handover",
          "custom-support",
          "custom-closure",
        ],
        rules: ["requirement-freeze-after-signoff", "uat-signoff-before-golive"],
      },
      sections: [
        {
          heading: "The fifteen stages in four phases",
          body:
            "Read the stage cards below in order. Grouped into phases, they look like this:\n\n1. **Start.** BD handover, estimation and the commercial model, internal kickoff, client kickoff. Output: a team that knows what was sold, and a client who knows how the project will run.\n2. **Define.** [[term:discovery]] and requirements, UI/UX and [[term:design-approval]], architecture and [[term:sprint-0]]. Output: a frozen [[term:scope-baseline]], approved designs and a working delivery setup.\n3. **Build and prove.** [[term:sprint]] execution, scope control, [[term:qa]] and [[term:uat]], release and [[term:go-live]]. Output: accepted software in production.\n4. **Run and close.** [[term:hypercare]] and [[term:warranty]], [[term:handover]] and [[term:knowledge-transfer]], [[term:support]] or an [[term:amc]], and [[term:closure]]. Output: a client who owns what they paid for, and a closed project file.\n\nTwo stages do not sit neatly in the line. **Estimation** often starts before the handover, in BD's proposal, and the PM validates it after. **Scope control** runs through every stage from the first sprint, because requests arrive whenever they like.",
        },
        {
          heading: "Gates: where the lifecycle forces a written decision",
          body:
            "Most stages end when their exit criteria are met. Four end with a client decision that must be written down:\n\n- **Requirement sign-off.** Freezes the scope. After it, new asks go through a [[term:change-request]]. Follow the Oyelabs rule in the handbook card below.\n- **Design approval.** The client approves the screens the team will build.\n- **UAT sign-off.** The client accepts the release. Follow the Oyelabs rule in the handbook card below: no go-live without it.\n- **[[term:go-no-go]].** The client sponsor decides to release, with the risks in front of them.\n\nEach gate has a named approver, usually the client sponsor, and a document: a sign-off form, an email or minutes. \"They said it was fine on the call\" is not a gate. Gates often line up with [[term:milestone-billing|milestone payments]], which is why finance cares about them as much as delivery does.",
        },
        {
          heading: "How the commercial model changes the shape",
          body:
            "The map is the same for every custom project. How strictly you run the gates depends on the deal:\n\n- **[[term:fixed-bid]].** The agency carries the scope risk. Gates are strict, the baseline is sacred and every addition is a priced change. This is the outer, gated shape around agile sprints that most fixed-bid agencies use.\n- **[[term:time-and-materials]] or a [[term:dedicated-resource-model|dedicated team]].** The client carries more of the risk and often reprioritises freely. Gates are lighter, but you still need written acceptance before go-live and a clear record of what was delivered.\n- **[[term:retainer]].** Work arrives as a stream. The lifecycle repeats in small loops, and the support stage dominates.\n\nThe typical mistake is running a fixed-bid project with T&M habits: no freeze, informal changes, and a dispute at the end about what was included.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Starting sprints before requirement sign-off.** Recover: keep building only what is already agreed, and get the sign-off on that subset this week. Log the rest as open.\n- **Skipping the internal kickoff.** The team learns the scope from the client. Recover: hold a 30-minute internal session before the next client call.\n- **Treating go-live as the end.** Hypercare, handover and closure are where payments, warranty and the next deal are decided. Recover: put those stages in the plan from day one.\n- **No stage owner.** Recover: check the RACI on each stage card. Every activity has exactly one Accountable person.",
        },
        {
          heading: "Your checklist",
          body:
            "1. You can name the stage your project is in and the next gate.\n2. You know the approver and the document for each gate.\n3. You know which stages carry milestone payments in your SOW.\n4. Scope control is running, with a change log, from the first sprint.\n5. Hypercare, handover and closure are on the plan, not added at the end.",
        },
      ],
      sop: [
        {
          title: "Where the project file lives",
          prompt: "[Oyelabs SOP – admin to fill] Where each custom project keeps its SOW, sign-offs, MoMs, RAID log and change log (folder structure, tool, naming), and who can see it.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a00-lifecycle-map-q1",
          prompt: "Which stage comes straight after the BD handover and estimation, before you meet the client as a delivery team?",
          options: ["Internal kickoff", "Client kickoff", "Discovery workshops", "Sprint 0"],
          correctIndex: 0,
          explanation: "The internal kickoff aligns the team on scope, plan and risks first, so the client kickoff is run by a team that already agrees.",
        },
        {
          id: "pmp-a00-lifecycle-map-q2",
          prompt: "Which of these are gates that need a written client decision? (Select all that apply.)",
          options: ["Requirement sign-off", "UAT sign-off", "Go/no-go", "Daily stand-up", "Internal kickoff"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Sign-offs and the go/no-go are client decisions with a named approver. Stand-ups and the internal kickoff are internal.",
        },
        {
          id: "pmp-a00-lifecycle-map-q3",
          prompt: "Your fixed-bid project is in its third sprint. The client sends a new feature idea. Which stage handles it?",
          options: [
            "Scope control, which runs alongside every sprint",
            "Discovery, so you reopen the requirements for everyone",
            "Closure, where open items are collected",
            "None: in agile, new ideas just go into the next sprint",
          ],
          correctIndex: 0,
          explanation: "Scope control is not a step in the line. It handles requests whenever they arrive, through classification and, where needed, a change request.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a00-lifecycle-map-q4",
          prompt: "The client says \"looks great, ship it\" on a demo call. No UAT sign-off exists. What is true?",
          options: [
            "The UAT gate is not passed: get written acceptance before go-live",
            "The verbal approval is enough to go live",
            "You can skip UAT because the demo covered it",
            "Go live and ask for sign-off during hypercare",
          ],
          correctIndex: 0,
          explanation: "A gate needs a written record from the named approver. Follow the Oyelabs rule on UAT sign-off before go-live.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a00-lifecycle-map-q5",
          prompt: "Why do fixed-bid projects usually run stricter gates than time-and-materials ones?",
          options: [
            "The agency carries the scope risk, so the baseline and changes must be controlled",
            "Fixed-bid clients are harder to work with",
            "T&M projects never need sign-off",
            "Gates make sprints faster",
          ],
          correctIndex: 0,
          explanation: "On a fixed bid, unpriced additions come out of the agency's margin. Gates and change control protect the price.",
        },
        {
          id: "pmp-a00-lifecycle-map-q6",
          prompt: "Which stages come after go-live? (Select all that apply.)",
          options: ["Hypercare and warranty", "Handover and KT", "Closure", "Design approval"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Go-live is not the end. Hypercare, handover, support and closure follow. Design approval is in the define phase.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "A Laravel and React booking platform for a UK clinic chain, sold as a fixed bid. Put these lifecycle events in the order they should happen, first at the top.",
        items: [
          { id: "handover", label: "BD hands over the signed SOW, proposal and call notes to the PM" },
          { id: "internal", label: "Internal kickoff with the tech lead, developers, QA and designer" },
          { id: "client", label: "Client kickoff with the clinic chain's sponsor and SPOC" },
          { id: "reqsign", label: "Client signs off the requirements and the freeze date is recorded" },
          { id: "design", label: "Client approves the booking and admin screen designs" },
          { id: "uat", label: "Clinic managers finish UAT and the sponsor signs the UAT sign-off" },
          { id: "golive", label: "Go/no-go meeting, then release to production" },
          { id: "hypercare", label: "Hypercare: the team watches production and fixes warranty bugs" },
        ],
        correctOrder: ["handover", "internal", "client", "reqsign", "design", "uat", "golive", "hypercare"],
        explanation:
          "Start (handover, internal then client kickoff), define (requirements frozen, then designs approved for that scope), build and prove (UAT sign-off before go/no-go and release), then run (hypercare). The two most common slips are meeting the client before the internal kickoff and treating the go/no-go as possible without UAT sign-off.",
      },
    },
    {
      id: "pmp-a00-raci-roles",
      moduleId: "pmp-a00",
      trackId: "pm",
      title: "Who does what: RACI across the lifecycle",
      summary:
        "A [[term:raci]] chart says, for each activity, who is **Responsible** (does the work), who is **Accountable** (owns the outcome and signs it off), who is **Consulted** (gives input before) and who is **Informed** (told after). Every stage card in the handbook has one.\n\nWhy it matters at an agency: a custom project has two organisations and at least seven roles: the PM, the BD or account manager, the tech lead, developers, QA and the designer on the Oyelabs side, and the client sponsor and client [[term:spoc]] on the other. Without a RACI, two things happen. Decisions stall because nobody knows who can say yes. And work falls between the BD team and delivery, or between the client SPOC and the sponsor.\n\nHow to use it:\n\n- **Exactly one A per activity.** Two Accountable people means none.\n- **R and A can differ.** The tech lead may request environments (R) while the PM is accountable that they exist on time (A).\n- **The client is often A.** Requirement sign-off, design approval, UAT sign-off and the go/no-go are owned by the client sponsor, even though the PM does most of the work around them.\n- **Share it.** Show the client-facing rows at the client kickoff.\n\nThe common mistake is making the PM Accountable for everything. The PM is accountable for the process. The client sponsor is accountable for business decisions, and the tech lead for technical ones. If the PM signs off a client decision, the agency owns a risk it cannot control.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Atlassian Team Playbook: Roles and responsibilities", url: "https://www.atlassian.com/team-playbook/plays/roles-and-responsibilities", kind: "docs", verifiedAt: "2026-10-02T11:53:23Z" },
        { label: "Atlassian: RACI chart - what it is and how to use it", url: "https://www.atlassian.com/work-management/project-management/raci-chart", kind: "article", verifiedAt: "2026-10-02T11:53:57Z" },
        { label: "Asana: RACI charts - the ultimate guide", url: "https://asana.com/resources/raci-chart", kind: "article", verifiedAt: "2026-10-02T11:57:22Z" },
        { label: "GOV.UK Service Manual: What each role does in a service team", url: "https://www.gov.uk/service-manual/the-team/what-each-role-does-in-service-team", kind: "docs", verifiedAt: "2026-10-02T11:51:26Z" },
      ],
      video: {
        title: "RACI Matrix Basics Explained with Examples | TeamGantt",
        channel: "TeamGantt",
        url: "https://www.youtube.com/watch?v=xc5NbJ8VgTI",
        videoId: "xc5NbJ8VgTI",
        verifiedAt: "2026-10-02T12:16:54Z",
      },
      alternateVideos: [
        {
          title: "What is a RACI Matrix? [CLEAR BREAKDOWN]",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=dyoOIIaACcE",
          videoId: "dyoOIIaACcE",
          verifiedAt: "2026-10-02T12:16:55Z",
        },
      ],
      handbook: {
        stages: ["custom-bd-handover", "custom-estimation", "custom-client-kickoff", "custom-discovery", "custom-qa-uat", "custom-release"],
        rules: ["cr-approval", "escalation-levels"],
      },
      sections: [
        {
          heading: "The roles on a custom project",
          body:
            "- **PM.** Runs the process: plan, cadence, [[term:raid-log]], scope control, reporting. Accountable for most delivery activities.\n- **BD or account manager.** Sold the deal. Accountable for the commercial side: price, model, payment schedule, renewals.\n- **Tech lead.** Accountable for the estimate, architecture and technical quality.\n- **Developers, QA, designer.** Responsible for building, testing and designing.\n- **Client sponsor.** The [[term:stakeholder]] with budget and authority. Accountable for business decisions and sign-offs.\n- **Client [[term:spoc]].** The day-to-day contact. Usually Responsible for client-side reviews and UAT, and the route for questions and [[term:client-dependency|client dependencies]].\n\nOn bigger projects a [[term:steering-committee]] may sit above the sponsor. It does not replace a named Accountable person for each decision.",
        },
        {
          heading: "Reading the RACI on a stage card",
          body:
            "Each stage card below lists its activities with R, A, C and I. Read three things:\n\n1. **Where is the client Accountable?** Those are your gates. You prepare, the sponsor decides.\n2. **Where do R and A differ?** That is where hand-offs fail. Example from the release card: the tech lead prepares the go-live checklist, but the PM is accountable that it is complete.\n3. **Who is only Informed?** Make sure they actually get told: a MoM, a status report or a message, not silence.\n\nWhen the client sees the RACI at kickoff, the useful question is \"Is the sponsor really the person who will sign off UAT?\" If not, fix it now, not in week ten.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Two Accountables.** \"The PM and the tech lead both own the estimate.\" Recover: pick one (the tech lead owns the numbers, the PM owns the review).\n- **The SPOC treated as the approver.** The SPOC says yes, then the sponsor overrules it in UAT. Recover: confirm in writing who signs each gate, and copy the sponsor on sign-off requests.\n- **BD stays Accountable after handover for things delivery now owns.** Recover: at handover, agree which client conversations move to the PM and which stay with BD (price, payments, renewals).\n- **Informed means nothing happened.** Recover: tie each I to a channel: MoM, weekly status report or a sign-off notice.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Every activity in your plan has exactly one A.\n2. The client sponsor is named as A for each gate, and has agreed.\n3. The SPOC knows they are R for reviews and UAT, not A.\n4. Commercial conversations have an agreed owner after handover.\n5. The RACI was shown at the client kickoff and is in the project file.",
        },
      ],
      sop: [
        {
          title: "Oyelabs role titles and the RACI file",
          prompt: "[Oyelabs SOP – admin to fill] Oyelabs' own role titles (for example PM, delivery head, account manager), who approves on the Oyelabs side above the PM, and where each project's RACI is stored.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a00-raci-roles-q1",
          prompt: "What does the A in RACI mean, and how many should each activity have?",
          options: [
            "Accountable: the single owner who signs off; exactly one per activity",
            "Assigned: whoever does the work; as many as needed",
            "Approver: anyone who can say yes; at least two",
            "Aware: people to inform; any number",
          ],
          correctIndex: 0,
          explanation: "One Accountable per activity. With two, each assumes the other decided.",
        },
        {
          id: "pmp-a00-raci-roles-q2",
          prompt: "In the custom lifecycle, who is Accountable for signing off requirements?",
          options: ["The client sponsor", "The PM", "The tech lead", "The client SPOC"],
          correctIndex: 0,
          explanation: "The SPOC does the review (R), but the business decision belongs to the client sponsor (A).",
        },
        {
          id: "pmp-a00-raci-roles-q3",
          prompt: "The tech lead requests repositories and environments, but the PM is Accountable. What does that mean in practice?",
          options: [
            "The tech lead does it; the PM makes sure it is done on time and chases if not",
            "The PM must set up the servers personally",
            "Both share the blame equally if it is late",
            "The tech lead must ask the PM before every step",
          ],
          correctIndex: 0,
          explanation: "R does the work, A owns the outcome. The PM tracks it as a dependency for Sprint 0.",
        },
        {
          id: "pmp-a00-raci-roles-q4",
          prompt: "During UAT the client SPOC approves a build, then the client sponsor rejects it a week later. What went wrong, and what do you do now?",
          options: [
            "The SPOC was treated as the approver; confirm in writing that the sponsor signs UAT and re-run the sign-off with them",
            "The sponsor is wrong; go live with the SPOC's approval",
            "Nothing went wrong; restart UAT from scratch",
            "Escalate to the client's CEO to overrule the sponsor",
          ],
          correctIndex: 0,
          explanation: "R is not A. The fix is to put the decision with the Accountable person and confirm it in writing, not to argue about the earlier verbal yes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a00-raci-roles-q5",
          prompt: "Which activities are usually owned (A) by the BD or account manager rather than the PM? (Select all that apply.)",
          options: [
            "Choosing the commercial model and price",
            "Confirming final payments at closure",
            "Proposing a renewal or upgrade",
            "Running the internal kickoff",
            "Classifying a request as a CR or a bug",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Commercial activities stay with BD. Running kickoffs and classifying requests are delivery activities the PM owns.",
        },
        {
          id: "pmp-a00-raci-roles-q6",
          prompt: "Who is Accountable for the effort estimate?",
          options: ["The tech lead", "The PM", "The BD manager", "The client sponsor"],
          correctIndex: 0,
          explanation: "The tech lead owns the numbers. The PM reviews assumptions and exclusions, which is its own activity with the PM as A.",
        },
        {
          id: "pmp-a00-raci-roles-q7",
          prompt: "A colleague proposes making the PM Accountable for design approval \"to keep things moving\". Why is that risky?",
          options: [
            "The agency would own a business decision it cannot control, and the client can reject the designs later",
            "The PM would have to draw the designs",
            "It is not risky; PMs should approve designs",
            "Designers would stop working",
          ],
          correctIndex: 0,
          explanation: "If the agency approves on the client's behalf, any later change becomes a dispute rather than a change request.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a00-raci-roles-q8",
          prompt: "What is the difference between Consulted and Informed?",
          options: [
            "Consulted give input before the work or decision; Informed are told after",
            "Consulted do the work; Informed approve it",
            "There is no difference",
            "Informed can veto; Consulted cannot",
          ],
          correctIndex: 0,
          explanation: "C is two-way and happens before. I is one-way and happens after.",
        },
        {
          id: "pmp-a00-raci-roles-q9",
          prompt: "Which are good ways to make sure Informed people are actually informed? (Select all that apply.)",
          options: ["Minutes after each client meeting", "The weekly status report", "A sign-off notice to the team", "Assuming they heard it in the corridor"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Tie every I to a channel. Assumed awareness is how teams build the wrong thing.",
        },
        {
          id: "pmp-a00-raci-roles-q10",
          prompt: "At the client kickoff, the sponsor says \"my operations manager will handle everything\". What should you confirm?",
          options: [
            "Whether the operations manager is the SPOC only, or also has authority to sign off gates, and record it",
            "Nothing; just work with the operations manager from now on",
            "That the sponsor will attend every stand-up",
            "That the operations manager will pay the invoices",
          ],
          correctIndex: 0,
          explanation: "Delegation is fine, but who signs each gate must be explicit and written. Otherwise you discover the real approver at UAT.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "Using the RACI on the custom stage cards, pick who is **Accountable** for each activity on a React Native food-ordering app for a restaurant group in Dubai.",
        categories: [
          { id: "pm", label: "PM" },
          { id: "tech-lead", label: "Tech lead" },
          { id: "bd", label: "BD / account manager" },
          { id: "sponsor", label: "Client sponsor" },
        ],
        items: [
          { id: "a1", text: "Preparing the handover pack: SOW, proposal, estimate and sales call notes", explanation: "BD prepares it and owns it. The PM is informed and then reviews it." },
          { id: "a2", text: "Reviewing the SOW and listing gaps and risky assumptions", explanation: "The PM does this and owns it, consulting the tech lead and BD." },
          { id: "a3", text: "Breaking the scope into features and estimating the effort", explanation: "The tech lead owns the numbers." },
          { id: "a4", text: "Choosing the commercial model and the price", explanation: "Price and model are commercial, so BD owns them." },
          { id: "a5", text: "Agreeing the milestones and payment schedule", explanation: "BD negotiates it, but the client sponsor commits the client's money, so the sponsor is Accountable." },
          { id: "a6", text: "Requesting repositories, environments and tool access", explanation: "The tech lead does it (R), but the PM is Accountable that it is ready before Sprint 0." },
          { id: "a7", text: "Confirming the project goals and success criteria at the client kickoff", explanation: "The PM runs it, but the goals belong to the client, so the sponsor is Accountable." },
          { id: "a8", text: "Signing off the requirements", explanation: "The SPOC reviews; the sponsor is Accountable for the sign-off." },
          { id: "a9", text: "Running internal QA and regression", explanation: "QA does it; the tech lead owns technical quality." },
          { id: "a10", text: "Making the go/no-go decision", explanation: "The PM runs the meeting, but releasing is the client's business decision." },
          { id: "a11", text: "Preparing the go-live checklist and rollback plan", explanation: "The tech lead prepares it (R); the PM is Accountable that it is complete." },
          { id: "a12", text: "Proposing a renewal or AMC after support starts", explanation: "Renewals are commercial, so BD owns them." },
        ],
        answer: {
          a1: "bd",
          a2: "pm",
          a3: "tech-lead",
          a4: "bd",
          a5: "sponsor",
          a6: "pm",
          a7: "sponsor",
          a8: "sponsor",
          a9: "tech-lead",
          a10: "sponsor",
          a11: "pm",
          a12: "bd",
        },
      },
    },
  ],
} satisfies Module;
