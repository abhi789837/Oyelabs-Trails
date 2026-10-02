import type { Module } from "@/types/curriculum";

export default {
  id: "pm-beginner",
  trackId: "pm",
  name: "PM Foundations",
  description:
    "The working vocabulary of delivering client software at an agency: the project lifecycle and who owns what, the scope/time/cost triangle, Scrum and Kanban as they are actually written, user stories, the tools, stand-ups, status reporting, requirements and the software basics a PM needs to hold their own with engineers. Beginner level, but every topic is framed around fixed-bid AI features, client politics and the gotchas that sink real projects.",
  refs: [
    { label: "PMI: What is Project Management?", url: "https://www.pmi.org/about/what-is-project-management", kind: "docs" },
    { label: "The Scrum Guide (November 2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec" },
    { label: "The Kanban Guide (May 2025)", url: "https://kanbanguides.org/the-kanban-guide/2025.5/", kind: "spec" },
    { label: "GOV.UK Service Manual: Agile delivery", url: "https://www.gov.uk/service-manual/agile-delivery", kind: "docs" },
  ],
  topics: [
    {
      id: "pm-b-project-lifecycle-roles",
      moduleId: "pm-beginner",
      trackId: "pm",
      title: "The Project Lifecycle & Who Owns What",
      summary:
        "Every project, agile or not, moves through the same broad arc: initiation (why are we doing this, who pays, what does success look like), planning or discovery, execution, monitoring and control running alongside execution, and closure. The lifecycle exists so that decisions are made at the point where they are cheapest. A wrong assumption about who signs off a feature costs a phone call in discovery and a rebuild in UAT.\n\nAt an agency the roles are split across two organisations, which is where most confusion starts. The client has a sponsor (holds the budget and the final say) and usually a day-to-day product contact; Oyelabs has the PM, a tech lead, developers, QA and often a designer. The PM owns the plan, the flow of information and the commercial boundary of the work, not the technical design and not the product vision. When those are blurred you get a PM promising architecture or a client contact silently acting as sponsor without the authority to approve spend.\n\nAgile does not remove the lifecycle; it repeats execution in short loops. GOV.UK names the phases discovery, alpha, beta and live, and the idea transfers well: an AI feature such as a document-summarising assistant should go through a cheap discovery or spike before anyone fixes a price, because model quality, data access and per-call API cost are unknown until someone tries them on real client data.\n\nThe gotcha is closure. Agencies skip it because the next project is waiting, and lose the handover documentation, the warranty terms, the access credentials and the lessons that would have priced the next AI feature correctly.",
      level: "beginner",
      estMinutes: 35,
      webRefs: [
        { label: "PMI: What is Project Management?", url: "https://www.pmi.org/about/what-is-project-management", kind: "docs" },
        {
          label: "GOV.UK Service Manual: What each role does in a service team",
          url: "https://www.gov.uk/service-manual/the-team/what-each-role-does-in-service-team",
          kind: "docs",
        },
        { label: "GOV.UK Service Manual: Agile delivery (phases)", url: "https://www.gov.uk/service-manual/agile-delivery", kind: "docs" },
        {
          label: "Atlassian: Project management intro",
          url: "https://www.atlassian.com/agile/project-management/project-management-intro",
          kind: "article",
        },
      ],
      video: {
        title: "The Project Management Life Cycle - Project Management Training",
        channel: "ProjectManager",
        url: "https://www.youtube.com/watch?v=POuGKD3xLqs",
        videoId: "POuGKD3xLqs",
        durationLabel: "4:14",
      },
      alternateVideos: [
        {
          title: "Phases of a Project [PROJECT MANAGEMENT LIFE CYCLE EXPLAINED]",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=qoY6VX_nRCs",
          videoId: "qoY6VX_nRCs",
          durationLabel: "5:27",
        },
        {
          title: "Basics of Project Management  ...in 4 minutes",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=AOmS_UrnBD0",
          videoId: "AOmS_UrnBD0",
          durationLabel: "4:34",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-b-project-lifecycle-roles-q1",
          prompt:
            "A client's marketing manager tells the team in a demo that the chatbot should also handle refunds, and says 'just add it'. The client's CFO signed the contract. What should the PM treat this as?",
          options: [
            "A request to take to the sponsor, because the marketing manager may not have authority to approve extra spend",
            "An approved change, because the marketing manager is the client's day-to-day contact",
            "Out of scope, so it should be declined on the spot",
            "A bug, because the chatbot clearly cannot do something the client expected",
          ],
          correctIndex: 0,
          explanation:
            "Day-to-day contacts often lack budget authority, so the request is real but needs the sponsor's approval through change control. Declining on the spot damages the relationship, and treating it as approved commits Oyelabs to unpaid work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-project-lifecycle-roles-q2",
          prompt: "Which of these does the agency PM own on a typical client project? (Select all that apply.)",
          options: [
            "The delivery plan and keeping it current",
            "The flow of status, risks and decisions between client and team",
            "Keeping work inside the agreed commercial scope",
            "Choosing the database and the LLM provider",
            "Deciding the product vision for the client's business",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The PM owns plan, communication and the commercial boundary. Technical choices sit with the tech lead, and the product vision belongs to the client's product owner or sponsor; a PM who takes those over creates accountability gaps.",
        },
        {
          id: "pm-b-project-lifecycle-roles-q3",
          prompt:
            "A client wants a fixed price for an AI feature that extracts data from scanned invoices, but nobody has seen their invoices yet. Which lifecycle move reduces the risk most?",
          options: [
            "A short paid discovery or spike on real sample invoices before fixing the price of the build",
            "Fixing the price now and adding a 10% buffer",
            "Starting the build immediately and re-planning after the first sprint",
            "Asking developers to estimate from the feature description alone",
          ],
          correctIndex: 0,
          explanation:
            "Model accuracy, document quality and API cost are unknowable without trying real data, so a discovery phase turns unknowns into estimates. A flat buffer is a guess on top of a guess, and starting the build fixes the price before the risk is understood.",
        },
        {
          id: "pm-b-project-lifecycle-roles-q4",
          prompt: "In an agile project, what happens to the classic lifecycle phases?",
          options: [
            "Execution and monitoring repeat in short loops, while initiation and closure still happen",
            "They disappear, because agile has no phases",
            "They are replaced by a single big planning phase at the start",
            "Only closure is removed, because agile never ends",
          ],
          correctIndex: 0,
          explanation:
            "Agile shortens the feedback loop inside execution; someone still has to start the project with a business case and close it with a handover. GOV.UK's discovery, alpha, beta and live phases show this shape explicitly.",
        },
        {
          id: "pm-b-project-lifecycle-roles-q5",
          prompt:
            "A project is 'done' and the team moves on the same day. Six weeks later the client asks for the API keys to their OpenAI account and the staging credentials. Which lifecycle step was skipped?",
          options: ["Closure and handover", "Initiation", "Monitoring and control", "Discovery"],
          correctIndex: 0,
          explanation:
            "Closure is where credentials, documentation, warranty terms and ownership of third-party accounts are handed over and confirmed. Skipping it is the most common agency shortcut and the one that generates awkward support tickets.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-project-lifecycle-roles-q6",
          prompt: "Who should normally make the final call when the tech lead and the client disagree about how a feature should work?",
          options: [
            "The client's product owner or sponsor, after the PM and tech lead set out the options and their costs",
            "The tech lead, because it is a technical question",
            "The PM, because the PM owns the plan",
            "Whoever raised the issue first",
          ],
          correctIndex: 0,
          explanation:
            "How a feature behaves is a product decision that the client owns; the agency's job is to make the trade-offs visible. If the disagreement is about how to build it, the tech lead decides; the PM's role is to make sure the decision gets made and recorded.",
        },
        {
          id: "pm-b-project-lifecycle-roles-q7",
          prompt: "Which of these is the strongest sign that initiation was done badly?",
          options: [
            "Halfway through the build, nobody can say what success looks like or who signs off",
            "The first sprint delivers fewer stories than planned",
            "The client asks for a demo earlier than scheduled",
            "A developer leaves the project",
          ],
          correctIndex: 0,
          explanation:
            "Initiation exists to agree the goal, the success measures and the decision-makers. A slow first sprint or a staffing change happens on well-run projects too; a missing definition of success does not.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "A new client has asked Oyelabs to build an AI support assistant for their app. Put these activities in the order they should happen across the project lifecycle (first at the top).",
        items: [
          { id: "sponsor", label: "Agree the business goal, the sponsor and the success measures; sign the SOW for discovery" },
          { id: "discovery", label: "Run discovery: workshops, sample data review and a spike to test the model on real support tickets" },
          { id: "plan", label: "Estimate and plan the build, set up the board, and agree the release milestones" },
          { id: "build", label: "Build in sprints, with a demo to the client at the end of each" },
          { id: "uat", label: "Client UAT on staging, fix the agreed defects, and go live" },
          { id: "close", label: "Hand over credentials and docs, start the warranty period, and hold a lessons-learned session" },
        ],
        correctOrder: ["sponsor", "discovery", "plan", "build", "uat", "close"],
        explanation:
          "Initiation (goal, sponsor, contract) comes first, then discovery reduces the AI-specific unknowns before the build is estimated. Execution runs in sprints, UAT gates go-live, and closure captures handover and lessons. Estimating before discovery is the classic mistake on AI features.",
      },
    },
    {
      id: "pm-b-scope-time-cost",
      moduleId: "pm-beginner",
      trackId: "pm",
      title: "Scope, Time & Cost: the Triple Constraint",
      summary:
        "Scope, time and cost are linked: change one and at least one of the others moves, or quality quietly absorbs the difference. The triple constraint is less a law than a negotiating tool. When a client asks for more, the PM's job is to make the trade visible: more scope means more time or more money, or something else comes out.\n\nWhich corner is fixed depends on the contract. A fixed-bid project fixes cost and usually scope, so time and margin are where the pressure lands. A time-and-materials project lets scope flex inside a budget. A product launch tied to a trade show fixes time, so scope must be the variable. Knowing which corner is truly fixed is the first question on any project, and it is often not the one the client says it is.\n\nAI features stretch the triangle in a new direction. Running cost becomes part of cost: an assistant that calls a large model on every message has a per-use API bill that grows with users, and a cheaper model or caching may trade quality for margin. Scope is also fuzzier, because 'answers questions accurately' is not a deliverable until you define accuracy, the test set and the acceptable error rate.\n\nThe gotcha is quality as the hidden fourth side. When scope grows and the date and price do not move, teams cut testing, documentation and edge-case handling without telling anyone. That is how a project hits its date and then spends two months in bug-fixing that nobody budgeted.",
      level: "beginner",
      estMinutes: 30,
      webRefs: [
        { label: "PMI: PMBOK Guide (8th edition) overview", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
        { label: "Atlassian: Project scope", url: "https://www.atlassian.com/work-management/project-management/project-scope", kind: "article" },
        { label: "Atlassian: Scope creep", url: "https://www.atlassian.com/work-management/project-management/scope-creep", kind: "article" },
      ],
      video: {
        title: "The Project Management Triple Constraint - Project Management Training",
        channel: "ProjectManager",
        url: "https://www.youtube.com/watch?v=wJoipiqjsTc",
        videoId: "wJoipiqjsTc",
        durationLabel: "2:01",
      },
      alternateVideos: [
        {
          title: "Project Planning: Plan Your Project - PM Fundamentals",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=LhBo0T4wcM0",
          videoId: "LhBo0T4wcM0",
          durationLabel: "11:41",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-b-scope-time-cost-q1",
          prompt:
            "A fixed-bid project is two weeks from launch. The client asks for a new reporting screen and refuses to move the date or the price. If the PM agrees without changing anything else, what usually absorbs the difference?",
          options: [
            "Quality: testing and edge cases get cut, and the agency's margin shrinks",
            "Nothing, if the team works efficiently",
            "The client's budget, through an automatic invoice",
            "The launch date, which moves on its own",
          ],
          correctIndex: 0,
          explanation:
            "With scope up and time and cost fixed, the hidden variables are quality and the agency's own margin (overtime). Nothing moves 'on its own', and on a fixed bid no extra invoice exists without a signed change.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-scope-time-cost-q2",
          prompt: "A client must demo the app at a trade show on a fixed date. Which corner should the PM treat as the variable?",
          options: ["Scope", "Time", "Quality", "None of the corners can move"],
          correctIndex: 0,
          explanation:
            "The date is truly fixed, and adding people late rarely speeds delivery, so scope is the lever: agree the must-haves for the show and defer the rest. Cutting quality for a public demo is the riskiest option.",
        },
        {
          id: "pm-b-scope-time-cost-q3",
          prompt: "Which of these belong in the cost of an AI chatbot feature? (Select all that apply.)",
          options: [
            "Development and testing hours",
            "Per-request LLM API charges once real users arrive",
            "Hosting for any vector database or retrieval service",
            "The time spent building an evaluation set to measure answer quality",
            "Nothing beyond the build, because API usage is the client's problem",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Build hours, running costs and evaluation work are all real costs, and the running ones grow with usage. Even when the client pays the API bill, the PM must estimate it for them, or the client discovers it in the first invoice.",
        },
        {
          id: "pm-b-scope-time-cost-q4",
          prompt: "What turns 'the assistant should answer questions accurately' into scope that can be estimated and accepted?",
          options: [
            "An agreed test set of real questions and an acceptable accuracy threshold",
            "A promise from the developers to use the best model available",
            "Listing it as a must-have in the SOW",
            "A longer timeline for the feature",
          ],
          correctIndex: 0,
          explanation:
            "Without a measurable definition, 'accurate' cannot be estimated or signed off and becomes an endless argument at UAT. Choosing the best model does not define done, and marking it must-have just makes the vague item mandatory.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-scope-time-cost-q5",
          prompt: "On a time-and-materials engagement with a monthly budget cap, what is normally allowed to flex?",
          options: [
            "Scope, within the budget, by reprioritising the backlog",
            "The budget cap, whenever the team needs more time",
            "The hourly rate, depending on the work",
            "Nothing; T&M fixes all three",
          ],
          correctIndex: 0,
          explanation:
            "T&M buys capacity, so the client can change what that capacity works on. The cap and rate are commercial terms that change only by agreement.",
        },
        {
          id: "pm-b-scope-time-cost-q6",
          prompt:
            "To speed up a late project, the PM adds two new developers in the final three weeks. What is the most likely short-term effect?",
          options: [
            "Delivery slows at first, because existing developers spend time onboarding them",
            "Delivery speeds up in proportion to headcount",
            "Costs stay the same, because the work is the same",
            "Scope automatically shrinks",
          ],
          correctIndex: 0,
          explanation:
            "This is Brooks's law in practice: onboarding and coordination costs land immediately, while the new people's output comes later. Cost certainly rises, since more people are billing hours.",
        },
        {
          id: "pm-b-scope-time-cost-q7",
          prompt:
            "A client accepts a cheaper LLM to cut running costs by 70%. Which side of the triangle has just been traded, and what should the PM record?",
          options: [
            "Quality or scope (answer quality may drop); record the decision and the agreed quality bar",
            "Time; record a new deadline",
            "Nothing has been traded, so nothing needs recording",
            "Cost only; record the saving in the budget",
          ],
          correctIndex: 0,
          explanation:
            "Running cost went down in exchange for possibly weaker answers. Recording the decision with the agreed quality bar protects the agency when the client later complains the bot is 'worse than ChatGPT'.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "A fixed-bid project is priced at 400 hours at $50/hour. Mid-build, the client asks for an AI summary feature that the tech lead estimates at 60 hours. The team burns 80 hours per week, and launch is 5 weeks away with 320 hours of planned work left. Calculate the change request and its effect on the schedule if nothing else is cut.",
        table: {
          columns: ["Item", "Value"],
          rows: [
            ["Original price", "400 h × $50/h"],
            ["New feature estimate", "60 h"],
            ["Planned work remaining", "320 h"],
            ["Team burn rate", "80 h per week"],
            ["Weeks to launch", "5"],
          ],
        },
        fields: [
          { id: "crPrice", label: "Price of the change request", unit: "$", answer: 3000, tolerance: 1 },
          { id: "newTotal", label: "New total contract value", unit: "$", answer: 23000, tolerance: 1 },
          { id: "weeksNeeded", label: "Weeks needed to finish everything at the current burn rate", unit: "weeks", answer: 4.75, tolerance: 0.01 },
        ],
        explanation:
          "The change is 60 × 50 = $3,000, taking the contract from $20,000 to $23,000. Remaining work becomes 320 + 60 = 380 hours, and 380 / 80 = 4.75 weeks, so it fits inside 5 weeks only if every estimate holds. A quarter-week of slack is not a real buffer, so the PM should flag the schedule risk with the change request.",
      },
    },
    {
      id: "pm-b-scrum-fundamentals",
      moduleId: "pm-beginner",
      trackId: "pm",
      title: "Agile & Scrum Fundamentals: Accountabilities, Events, Artifacts",
      summary:
        "Scrum is a lightweight framework for complex work where you learn by doing: you cannot fully specify an AI feature up front, so you build a slice, inspect it and adapt. The November 2020 Scrum Guide is still the current version and is short enough to read in half an hour. Read it, because most of what people call Scrum in agencies is folklore.\n\nThe Guide defines three accountabilities: the **Product Owner** (one person who orders the Product Backlog and maximises value), the **Scrum Master** (accountable for the team's effectiveness and for Scrum being understood) and the **Developers** (everyone who builds the Increment, including QA and design). There is no 'project manager' accountability. Five events run inside a Sprint of one month or less: the Sprint itself, Sprint Planning, the Daily Scrum (15 minutes, for the Developers), the Sprint Review and the Sprint Retrospective. Three artifacts each carry a commitment: the Product Backlog has the Product Goal, the Sprint Backlog has the Sprint Goal, and the Increment has the Definition of Done.\n\nAt an agency the awkward question is who the Product Owner is. The client owns the product, but a client contact who answers emails twice a week cannot order a backlog in real time. A common pattern is a client PO with an agency-side proxy who prepares the backlog, but the client must still own the ordering and accept the trade-offs, or the agency ends up silently deciding priorities on a fixed bid.\n\nGotchas: refinement is an ongoing activity, not an event; the Sprint Review is a working session, not a slide show, and it is not a gate to releasing; and story points and velocity are not in the Guide at all.",
      level: "beginner",
      estMinutes: 50,
      webRefs: [
        { label: "The Scrum Guide (November 2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec" },
        { label: "Manifesto for Agile Software Development: 12 principles", url: "https://agilemanifesto.org/principles.html", kind: "spec" },
        { label: "Atlassian Agile Coach: Scrum", url: "https://www.atlassian.com/agile/scrum", kind: "article" },
        { label: "Mountain Goat Software: Scrum", url: "https://www.mountaingoatsoftware.com/agile/scrum", kind: "article" },
      ],
      video: {
        title: "Scrum Essentials in Under 10 Minutes",
        channel: "Scrum Alliance",
        url: "https://www.youtube.com/watch?v=RtQ3tpq-RuE",
        videoId: "RtQ3tpq-RuE",
        durationLabel: "10:16",
      },
      alternateVideos: [
        {
          title: "The Scrum Guide: FULL COURSE",
          channel: "David McLachlan",
          url: "https://www.youtube.com/watch?v=s3y95I79D_Q",
          videoId: "s3y95I79D_Q",
          durationLabel: "48:25",
        },
        {
          title: "Intro to Scrum in Under 10 Minutes",
          channel: "Axosoft",
          url: "https://www.youtube.com/watch?v=XU0llRltyFM",
          videoId: "XU0llRltyFM",
          durationLabel: "8:52",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-b-scrum-fundamentals-q1",
          prompt: "Which are the three accountabilities defined in the 2020 Scrum Guide?",
          options: [
            "Product Owner, Scrum Master, Developers",
            "Product Owner, Scrum Master, Project Manager",
            "Product Owner, Team Lead, Developers",
            "Sponsor, Scrum Master, Developers",
          ],
          correctIndex: 0,
          explanation:
            "The Guide defines exactly those three within one Scrum Team. 'Project Manager' and 'Team Lead' are not Scrum accountabilities, which is why agency PMs must work out how their role maps onto them.",
        },
        {
          id: "pm-b-scrum-fundamentals-q2",
          prompt: "Match each artifact to its commitment. Which pairings are correct? (Select all that apply.)",
          options: [
            "Product Backlog: Product Goal",
            "Sprint Backlog: Sprint Goal",
            "Increment: Definition of Done",
            "Sprint Backlog: Definition of Done",
            "Product Backlog: Velocity",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The 2020 Guide gives each artifact one commitment: Product Goal, Sprint Goal and Definition of Done. Velocity does not appear in the Guide at all.",
        },
        {
          id: "pm-b-scrum-fundamentals-q3",
          prompt:
            "The client wants the Sprint Review to be a polished slide presentation, and nothing can go to production until they approve it there. What does the Scrum Guide say?",
          options: [
            "The Review is a working session to inspect the outcome and adapt, and it should not be treated as a gate to releasing value",
            "The Review must be a formal presentation and is the only point where releases are approved",
            "The Review is optional when the client is busy",
            "The Review replaces the Retrospective for client projects",
          ],
          correctIndex: 0,
          explanation:
            "The Guide calls the Review a working session and says it should never be considered a gate to releasing value. A client may still have contractual sign-off for production, but that is an agreement on top of Scrum, not Scrum itself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-scrum-fundamentals-q4",
          prompt: "Who attends the Daily Scrum as participants, according to the Guide?",
          options: [
            "The Developers; the PO and Scrum Master take part as Developers only if they are working on Sprint Backlog items",
            "The whole Scrum Team plus the client sponsor",
            "The Scrum Master, who collects status from each Developer",
            "Whoever the PM invites",
          ],
          correctIndex: 0,
          explanation:
            "The Daily Scrum is a 15-minute event for the Developers to plan their next day against the Sprint Goal. It is not a status meeting for a manager or client.",
        },
        {
          id: "pm-b-scrum-fundamentals-q5",
          prompt:
            "Midway through a sprint, the client's company drops the feature the Sprint Goal was about. Who can cancel the Sprint?",
          options: ["Only the Product Owner", "The Scrum Master", "The Developers, by vote", "The agency PM"],
          correctIndex: 0,
          explanation:
            "The Guide allows a Sprint to be cancelled if the Sprint Goal becomes obsolete, and only the Product Owner has the authority to cancel it. This is rare, which is why the event is worth knowing for interviews.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-scrum-fundamentals-q6",
          prompt: "A client offers a 'product committee' of four people to act as Product Owner. Why does that cause problems?",
          options: [
            "The Guide says the PO is one person, so priorities have one accountable decision-maker",
            "Committees are not allowed to attend Sprint Reviews",
            "Four people would exceed the Scrum Team size limit on their own",
            "It does not cause problems; the Guide recommends committees for large clients",
          ],
          correctIndex: 0,
          explanation:
            "The PO may represent many stakeholders, but one person is accountable for ordering the backlog. Committees produce conflicting priorities that the agency team then has to arbitrate, which is not its call.",
        },
        {
          id: "pm-b-scrum-fundamentals-q7",
          prompt: "Which statement about Product Backlog refinement is accurate for the 2020 Guide?",
          options: [
            "It is an ongoing activity, not one of the Scrum events",
            "It is a mandatory 2-hour event every sprint",
            "It happens only during Sprint Planning",
            "It is done by the Scrum Master alone",
          ],
          correctIndex: 0,
          explanation:
            "Refinement breaks down and clarifies backlog items as an ongoing activity. Many teams schedule a session for it, which is fine, but the Guide does not define it as an event.",
        },
        {
          id: "pm-b-scrum-fundamentals-q8",
          prompt: "What is the maximum length of a Sprint in the Scrum Guide?",
          options: ["One month", "Two weeks", "Six weeks", "There is no limit"],
          correctIndex: 0,
          explanation:
            "Sprints are fixed-length events of one month or less. Two weeks is a popular choice, not a rule.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "Oyelabs is starting a Scrum engagement to build an AI recipe-recommendation app for a food-delivery client. The client's head of product is busy and suggests that the Oyelabs PM 'just runs the backlog'. The team is four developers, a QA engineer and a designer.",
        steps: [
          {
            id: "po",
            question: "How should the Product Owner accountability be set up?",
            options: [
              "The client's head of product is the PO and owns the ordering; the Oyelabs PM prepares and refines the backlog with them weekly",
              "The Oyelabs PM becomes the PO and decides priorities alone",
              "The developers order the backlog by technical difficulty",
              "Skip the PO; the Scrum Master can order the backlog",
            ],
            correctIndex: 0,
            explanation:
              "The client must own the priorities so they own the trade-offs; the PM can be a proxy who prepares the work. An agency PO deciding alone on a client's money invites disputes later.",
          },
          {
            id: "team",
            question: "The client asks whether the QA engineer and the designer are 'part of Scrum' or outside the team. What is the right answer?",
            options: [
              "They are Developers in Scrum terms, because they help create the Increment",
              "They are stakeholders and attend only the Review",
              "They form a separate Scrum team",
              "They report to the Scrum Master instead of the team",
            ],
            correctIndex: 0,
            explanation:
              "In the 2020 Guide, Developers are all the people committed to creating a usable Increment each Sprint, whatever their specialism.",
          },
          {
            id: "review",
            question:
              "At the first Sprint Review, the client's head of product says the recommendations feel generic and wants to change direction. What should happen?",
            options: [
              "Inspect the outcome together, then adapt the Product Backlog so the next Sprint Planning reflects the new learning",
              "Refuse, because the Sprint Goal was agreed",
              "Cancel the next three sprints and restart discovery",
              "Record it as a defect and fix it in the current sprint",
            ],
            correctIndex: 0,
            explanation:
              "That is exactly what the Review is for: inspect and adapt the backlog. Whether the change costs more is a separate commercial question under change control, which the PM raises next.",
          },
        ],
      },
    },
    {
      id: "pm-b-kanban-basics",
      moduleId: "pm-beginner",
      trackId: "pm",
      title: "Kanban Basics: Flow, WIP and the Four Flow Metrics",
      summary:
        "Kanban is a strategy for optimising the flow of value through a process. The Kanban Guide (May 2025) reduces it to three practices: defining and visualising the workflow, actively managing items in it, and improving it. There are no roles, no sprints and no required meetings, which is why Kanban fits support retainers, bug queues and maintenance work where requests arrive unpredictably and a two-week commitment makes no sense.\n\nThe heart of it is the Definition of Workflow: what a work item is, when it starts and finishes, the states between, explicit policies, how work in progress (WIP) is controlled, and a service level expectation such as '85% of items finish in 8 days or less'. Controlling WIP creates a pull system: new work starts only when there is capacity. The Guide makes four flow metrics mandatory: WIP, throughput, work item age and cycle time.\n\nThe trade-off against Scrum is commitment versus responsiveness. Scrum gives a client a Sprint Goal and a regular review; Kanban gives them shorter lead times on individual requests and a forecast built from real data rather than estimates. Many agency teams run Scrum for the build and Kanban for the post-launch retainer.\n\nNote that two lineages exist: the Kanban Guide at kanbanguides.org and Kanban University's Kanban Method, which adds principles and practices such as evolutionary change. The common gotcha is a board with no WIP limits: it is only a to-do list in columns, and work item age quietly balloons while everyone feels busy.",
      level: "beginner",
      estMinutes: 40,
      webRefs: [
        { label: "The Kanban Guide (May 2025)", url: "https://kanbanguides.org/the-kanban-guide/2025.5/", kind: "spec" },
        { label: "Kanban University: The Official Kanban Guide", url: "https://kanban.university/kanban-guide/", kind: "spec" },
        { label: "Atlassian: WIP limits", url: "https://www.atlassian.com/agile/kanban/wip-limits", kind: "article" },
        { label: "Atlassian Agile Coach: Kanban", url: "https://www.atlassian.com/agile/kanban", kind: "article" },
      ],
      video: {
        title: "What is Kanban? Kanban Explained with a Coffee Cup",
        channel: "Development That Pays",
        url: "https://www.youtube.com/watch?v=Lib1vFmfCng",
        videoId: "Lib1vFmfCng",
        durationLabel: "13:23",
      },
      alternateVideos: [
        {
          title: "Scrum vs Kanban - What's the Difference?",
          channel: "Development That Pays",
          url: "https://www.youtube.com/watch?v=rIaz-l1Kf8w",
          videoId: "rIaz-l1Kf8w",
          durationLabel: "5:07",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-b-kanban-basics-q1",
          prompt: "Which are the four mandatory flow metrics in the Kanban Guide (May 2025)? (Select all that apply.)",
          options: ["WIP", "Throughput", "Work item age", "Cycle time", "Velocity", "Story points completed"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "The Guide lists WIP, throughput, work item age and cycle time as the minimum. Velocity and story points are Scrum-team conventions and are not Kanban metrics.",
        },
        {
          id: "pm-b-kanban-basics-q2",
          prompt:
            "A support board has columns To do, In progress, Review and Done, but no WIP limits. Five developers have 19 items in progress. What is the most likely result?",
          options: [
            "Items age in progress, cycle times grow and the client waits longer for each fix",
            "Throughput rises, because everyone is busy",
            "Nothing changes; WIP limits only matter for large teams",
            "Cycle time drops, because more items are started",
          ],
          correctIndex: 0,
          explanation:
            "Starting more than the team can finish spreads attention thin, so each item takes longer. Busy is not the same as flowing, and that is the whole argument for controlling WIP.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-kanban-basics-q3",
          prompt: "What is a service level expectation (SLE) in the Kanban Guide?",
          options: [
            "A forecast of how long an item should take from start to finish, with a probability, such as 85% within 8 days",
            "A contractual penalty the agency pays when work is late",
            "The number of items the team promises to finish each week",
            "An estimate in story points for each item",
          ],
          correctIndex: 0,
          explanation:
            "An SLE has two parts, an elapsed time and a probability, and should be based on historical cycle time. It is a forecast for the team, not a contractual SLA, though clients often confuse the two.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-kanban-basics-q4",
          prompt: "Oyelabs has just launched a client's app and moves into a monthly support retainer with unpredictable bug reports. Why is Kanban often a better fit than Scrum here?",
          options: [
            "Work arrives continuously and urgently, so pulling items as capacity frees up beats waiting for the next sprint",
            "Kanban needs no tracking tool",
            "Kanban guarantees faster fixes regardless of WIP",
            "Scrum is not allowed for maintenance work",
          ],
          correctIndex: 0,
          explanation:
            "A two-week sprint commitment fits poorly when a critical bug arrives on day two. Kanban still needs discipline (WIP control, metrics); it is not a guarantee of speed.",
        },
        {
          id: "pm-b-kanban-basics-q5",
          prompt: "Which of these is a required element of a Definition of Workflow in the Kanban Guide?",
          options: [
            "When a work item counts as started and finished",
            "A fixed two-week cadence",
            "A designated Kanban Master role",
            "A mandatory daily meeting",
          ],
          correctIndex: 0,
          explanation:
            "The DoW includes what a work item is, its start and finish points, states, WIP control, explicit policies and an SLE. The Guide prescribes no roles, cadences or meetings.",
        },
        {
          id: "pm-b-kanban-basics-q6",
          prompt: "An item has been 'In review' for 12 days while the team's SLE is 85% within 8 days. Which metric tells you this before it finishes?",
          options: ["Work item age", "Cycle time", "Throughput", "Velocity"],
          correctIndex: 0,
          explanation:
            "Cycle time is only known once an item finishes; work item age shows how long an unfinished item has been in progress, so you can act early. That is why the Guide makes age mandatory.",
        },
        {
          id: "pm-b-kanban-basics-q7",
          prompt: "What does the Kanban Guide say about when the team may change its workflow?",
          options: [
            "Changes can be made just in time, without waiting for a formal meeting, and need not be small",
            "Only at a quarterly review",
            "Only in small, incremental steps",
            "Only when the client approves in writing",
          ],
          correctIndex: 0,
          explanation:
            "The 2025 Guide explicitly says there is no requirement to wait for a regular meeting and nothing requires improvements to be small. Small, evolutionary change is a principle of the Kanban Method lineage, which is a different source.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Here is two weeks of data from a client's support board. Use cycle time = finish day − start day, and treat today as day 14. Calculate the flow metrics.",
        table: {
          columns: ["Item", "Start day", "Finish day"],
          rows: [
            ["A", "1", "4"],
            ["B", "2", "7"],
            ["C", "3", "5"],
            ["D", "4", "12"],
            ["E", "6", "10"],
            ["F", "8", "10"],
            ["G", "9", "(in progress)"],
          ],
        },
        fields: [
          { id: "avgCycle", label: "Average cycle time of the finished items", unit: "days", answer: 4, tolerance: 0.01 },
          { id: "throughput", label: "Throughput over the 14 days", unit: "items", answer: 6, tolerance: 0 },
          { id: "ageG", label: "Work item age of G today", unit: "days", answer: 5, tolerance: 0 },
        ],
        explanation:
          "Cycle times are 3, 5, 2, 8, 4 and 2, which sum to 24, so the average is 24 / 6 = 4 days. Six items finished, so throughput is 6 in two weeks (3 per week). G started on day 9, so on day 14 its age is 5 days, already above the average cycle time, which is the signal to look at it.",
      },
    },
    {
      id: "pm-b-user-stories-acceptance-criteria",
      moduleId: "pm-beginner",
      trackId: "pm",
      title: "Writing User Stories & Acceptance Criteria",
      summary:
        "A user story is a placeholder for a conversation, not a specification: 'As a [type of user], I want [goal] so that [reason]'. It exists to keep the team focused on who benefits and why, so developers can make sensible choices the client never thought to specify. Acceptance criteria turn that conversation into a testable agreement: the conditions that must be true for the story to be accepted.\n\nGood stories follow INVEST (independent, negotiable, valuable, estimable, small, testable). In practice the hardest letters are Small and Testable. A story too big for one sprint should be split; Mike Cohn's SPIDR technique splits by spikes, paths, interfaces, data and rules rather than by technical layer, because 'build the backend' delivers nothing a user can accept.\n\nAcceptance criteria are where agencies win or lose disputes. A fixed-bid client will read 'user can search products' as including filters, typo tolerance and voice search unless the criteria say otherwise. Given/When/Then format works well for behaviour; checklists work for rules and constraints. Criteria describe outcomes, not implementation, and they are different from the Definition of Done, which applies to every story (code reviewed, tested, deployed to staging).\n\nAI features need extra care. 'The assistant answers billing questions' cannot be accepted until the criteria say which questions, measured how, and what happens when the model is unsure: does it say so, hand over to a human, or refuse? A useful gotcha check is to read each criterion and ask: could QA write a test for this without asking anyone?",
      level: "beginner",
      estMinutes: 45,
      webRefs: [
        {
          label: "GOV.UK Service Manual: Writing user stories",
          url: "https://www.gov.uk/service-manual/agile-delivery/writing-user-stories",
          kind: "docs",
        },
        { label: "Mountain Goat Software: User stories", url: "https://www.mountaingoatsoftware.com/agile/user-stories", kind: "article" },
        {
          label: "Atlassian: Acceptance criteria",
          url: "https://www.atlassian.com/work-management/project-management/acceptance-criteria",
          kind: "article",
        },
        { label: "Atlassian: User stories", url: "https://www.atlassian.com/agile/project-management/user-stories", kind: "article" },
      ],
      video: {
        title: "What Is a User Story in Agile? (Examples + Template)",
        channel: "Mountain Goat Software: Agile & Scrum Mastery",
        url: "https://www.youtube.com/watch?v=kkihaNjwRik",
        videoId: "kkihaNjwRik",
        durationLabel: "8:52",
      },
      alternateVideos: [
        {
          title: "How to Split User Stories with SPIDR | 5 Story Splitting Techniques",
          channel: "Mountain Goat Software: Agile & Scrum Mastery",
          url: "https://www.youtube.com/watch?v=k2PwtI6JyFM",
          videoId: "k2PwtI6JyFM",
          durationLabel: "8:22",
        },
        {
          title: "User Stories Explained: What They Are, How to Write Them, and Why They Work",
          channel: "Mountain Goat Software: Agile & Scrum Mastery",
          url: "https://www.youtube.com/watch?v=6q5-cVeNjCE",
          videoId: "6q5-cVeNjCE",
          durationLabel: "52:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-b-user-stories-acceptance-criteria-q1",
          prompt: "Which acceptance criterion could QA test without asking anyone a question?",
          options: [
            "Given a logged-in user, when they search 'red shoes', then results containing 'red' and 'shoes' appear within 2 seconds",
            "Search should be fast and user-friendly",
            "Search uses Elasticsearch with a fuzzy query",
            "Search works like Amazon's",
          ],
          correctIndex: 0,
          explanation:
            "It names the precondition, action and observable result with a measurable limit. The others are subjective, prescribe implementation, or point at a moving external benchmark.",
        },
        {
          id: "pm-b-user-stories-acceptance-criteria-q2",
          prompt: "Which of these are problems in this story? (Select all that apply.)\n\n'As a developer, I want to build the API layer so that the frontend can call it.'",
          options: [
            "The 'user' is the team, not someone who gets value from the product",
            "It describes a technical layer, so no user could accept it on its own",
            "It has no acceptance criteria",
            "It uses the As a / I want / so that template",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Horizontal slices like 'the API layer' deliver nothing demonstrable, and the story has no criteria. Using the template is fine; the content is the problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-user-stories-acceptance-criteria-q3",
          prompt: "What is the difference between acceptance criteria and the Definition of Done?",
          options: [
            "Acceptance criteria are specific to one story; the Definition of Done applies to every item, such as reviewed, tested and deployed to staging",
            "They are two names for the same thing",
            "The Definition of Done is written by the client; acceptance criteria by developers",
            "Acceptance criteria apply to the whole project; the Definition of Done to one story",
          ],
          correctIndex: 0,
          explanation:
            "Criteria capture what this story must do; the DoD is the quality bar for all work. A story can meet its criteria and still not be done if, say, it has not been code-reviewed.",
        },
        {
          id: "pm-b-user-stories-acceptance-criteria-q4",
          prompt:
            "A story reads 'As a customer, I want the support bot to answer my billing questions so I don't have to wait for an agent.' Which criterion matters most to add for an LLM-based bot?",
          options: [
            "What the bot does when it is not confident: tell the user and offer a human handover",
            "Which LLM vendor is used",
            "The colour of the chat bubble",
            "That the bot is 'smart'",
          ],
          correctIndex: 0,
          explanation:
            "Model answers are probabilistic, so the unhappy path (low confidence, out-of-scope question) is where real harm and complaints come from. Vendor choice is implementation, and 'smart' is untestable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-user-stories-acceptance-criteria-q5",
          prompt: "A story is estimated at three sprints. Which split follows SPIDR's spirit best?",
          options: [
            "Split by path: first the card-payment path, then PayPal, then saved cards",
            "Split by layer: database first, then backend, then frontend",
            "Split by person: one story per developer",
            "Do not split; extend the sprint instead",
          ],
          correctIndex: 0,
          explanation:
            "Splitting by path gives slices a user can actually use and accept. Splitting by layer or by person produces work nobody can demo, and sprints should not be stretched to fit a story.",
        },
        {
          id: "pm-b-user-stories-acceptance-criteria-q6",
          prompt: "Why is a user story described as 'a placeholder for a conversation'?",
          options: [
            "Because the card is brief on purpose; the details are agreed through discussion and captured as acceptance criteria",
            "Because stories are only used in meetings and never written down",
            "Because the client must phone the developer for every story",
            "Because stories replace the contract",
          ],
          correctIndex: 0,
          explanation:
            "The short format keeps focus on user and value, and the conversation fills the gaps. The agreements still need writing down, which is what acceptance criteria are for.",
        },
        {
          id: "pm-b-user-stories-acceptance-criteria-q7",
          prompt:
            "On a fixed bid, the client reads 'user can upload documents' as including 200 MB video files. The criteria said nothing about size or type. What should have prevented the dispute?",
          options: [
            "Acceptance criteria stating the allowed file types and the maximum size",
            "A longer user story description",
            "A larger estimate for the story",
            "Writing the story in Given/When/Then",
          ],
          correctIndex: 0,
          explanation:
            "Boundaries such as type and size are exactly what criteria pin down. The format of the story matters less than whether its limits are explicit.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write one user story with 3–5 acceptance criteria for the feature described in the client message. Make the criteria testable, include at least one unhappy path, and say what is out of scope.",
        context:
          "From the client (a property management company): 'We want tenants to be able to ask the app about their lease, like when rent is due or whether pets are allowed, and get an answer straight away instead of emailing us. It should use their actual lease document.'",
        wordLimit: 220,
        rubric: [
          {
            id: "story",
            label: "Story format and value",
            description: "Names a real user (tenant), a goal and a reason tied to value (faster answers, fewer emails). Not a technical task.",
            weight: 1,
          },
          {
            id: "testable",
            label: "Testable criteria",
            description: "Each criterion is observable and measurable, e.g. Given/When/Then, with concrete examples such as rent due date or pet policy.",
            weight: 2,
          },
          {
            id: "unhappy",
            label: "Unhappy path for the AI",
            description: "Covers what happens when the answer is not in the lease or confidence is low: the bot says so and points to a human contact, and never invents terms.",
            weight: 2,
          },
          {
            id: "scope",
            label: "Scope boundaries",
            description: "States something out of scope, such as legal advice, changing the lease or other tenants' documents, and that answers use only the tenant's own lease.",
            weight: 1,
          },
        ],
        sampleAnswer:
          "As a tenant, I want to ask questions about my lease in the app so that I get an answer immediately instead of emailing the office.\n\nAcceptance criteria:\n1. Given I am logged in, when I ask 'When is my rent due?', then the app answers with the due date from my lease and shows the clause it used.\n2. Given my lease states a pet policy, when I ask 'Can I have a dog?', then the answer reflects that clause.\n3. Given the lease does not cover my question, when I ask it, then the app says it could not find this in my lease and offers the office contact. It never guesses.\n4. Answers only ever use the logged-in tenant's own lease.\n5. Response appears within 5 seconds for 95% of questions.\n\nOut of scope: legal advice, editing the lease, and questions about other properties.",
      },
    },
    {
      id: "pm-b-jira-clickup-basics",
      moduleId: "pm-beginner",
      trackId: "pm",
      title: "Jira & ClickUp Basics for Agency Delivery",
      summary:
        "A tracking tool is the team's shared memory: what is being built, in what order, by whom, and what state it is in. The tool matters less than the discipline, but you need to know the shape of the two you will meet most. Jira (current Atlassian docs call its tickets 'work items') is organised as spaces containing epics, which contain stories, tasks and bugs, which can have subtasks; Scrum boards add a backlog and sprints, Kanban boards a continuous flow. ClickUp's hierarchy is Workspace, Space, optional Folder, List, Task and Subtask, and its own agency guidance suggests a Space or Folder per client.\n\nThe trade-off is structure against overhead. Jira gives strong workflows, permissions and reporting (velocity charts, versions for releases) that engineering teams expect; ClickUp is more flexible and friendlier to clients and non-engineers, but that flexibility means every project drifts into its own conventions unless someone sets a template. Agencies usually pick one, then standardise statuses, issue types and a ticket template across clients so that a developer moving projects knows where things are.\n\nThe PM's real job in the tool is hygiene: every ticket has a clear title, acceptance criteria, an owner, an estimate where the team estimates, and a link to the epic it serves. The common gotchas are status theatre (tickets moved to Done before they meet the Definition of Done), client-visible boards full of internal notes, and duplicating work in a client's tool and your own. Decide early which tool is the source of truth, and who on the client side gets access to what.",
      level: "beginner",
      estMinutes: 40,
      webRefs: [
        {
          label: "Atlassian: Jira guide - getting started",
          url: "https://www.atlassian.com/software/jira/guides/getting-started/introduction",
          kind: "docs",
        },
        {
          label: "Jira Cloud support: Use your Scrum backlog",
          url: "https://support.atlassian.com/jira-software-cloud/docs/use-your-scrum-backlog/",
          kind: "docs",
        },
        {
          label: "ClickUp Help: Intro to the Hierarchy",
          url: "https://help.clickup.com/hc/en-us/articles/13856392825367-Intro-to-the-Hierarchy",
          kind: "docs",
        },
        {
          label: "ClickUp Help: Organize your Hierarchy for agency management",
          url: "https://help.clickup.com/hc/en-us/articles/20808672437271-Organize-your-Hierarchy-for-agency-management",
          kind: "docs",
        },
      ],
      video: {
        title: "Jira Tutorial for Beginners — Learn Jira in 20 Minutes",
        channel: "Kevin Stratvert",
        url: "https://www.youtube.com/watch?v=GPOWZSxEslU",
        videoId: "GPOWZSxEslU",
        durationLabel: "19:34",
      },
      alternateVideos: [
        {
          title: "Jira Tutorial for Beginners | Atlassian Answered",
          channel: "Atlassian",
          url: "https://www.youtube.com/watch?v=emidrJeUTaM",
          videoId: "emidrJeUTaM",
          durationLabel: "5:28",
        },
        {
          title: "ClickUp Tutorial - How to use ClickUp for Beginners",
          channel: "Ravi Abuvala",
          url: "https://www.youtube.com/watch?v=0Q8aA0Lwuyc",
          videoId: "0Q8aA0Lwuyc",
          durationLabel: "15:13",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-b-jira-clickup-basics-q1",
          prompt: "In Jira, a client's 'AI onboarding assistant' feature will take several sprints and contains many stories. What should it be?",
          options: ["An epic", "A subtask", "A single story with a large estimate", "A bug"],
          correctIndex: 0,
          explanation:
            "Epics group related stories that span sprints. One huge story cannot be finished or accepted in a sprint, and subtasks sit below stories, not above them.",
        },
        {
          id: "pm-b-jira-clickup-basics-q2",
          prompt: "What is the order of ClickUp's hierarchy from the top down?",
          options: [
            "Workspace, Space, Folder (optional), List, Task, Subtask",
            "Space, Workspace, List, Folder, Task, Subtask",
            "Workspace, List, Space, Task, Folder, Subtask",
            "Project, Epic, Story, Task, Subtask",
          ],
          correctIndex: 0,
          explanation:
            "ClickUp's own help centre lists Workspace, Space, Folder (optional, with Subfolders for complex setups), List, Task and Subtask. The Project/Epic/Story ladder is a Jira-style mental model.",
        },
        {
          id: "pm-b-jira-clickup-basics-q3",
          prompt: "Which of these make a ticket ready for a developer to pick up? (Select all that apply.)",
          options: [
            "A clear title that describes the outcome",
            "Acceptance criteria",
            "A link to the parent epic",
            "The developer's personal opinion of the client",
            "A due date set by the PM without asking the team",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Title, criteria and context let someone start without a meeting. Dates imposed without the team's input undermine estimates, and opinions about the client never belong in a ticket.",
        },
        {
          id: "pm-b-jira-clickup-basics-q4",
          prompt:
            "The client has read access to the board. A developer writes in a ticket comment: 'Their API docs are garbage, this will take forever.' What is the main problem?",
          options: [
            "Internal frustration is visible to the client; client-visible spaces need agreed rules about what goes in them",
            "Comments should never be used in Jira",
            "The developer should have used a subtask instead",
            "Nothing, as long as the estimate is updated",
          ],
          correctIndex: 0,
          explanation:
            "Client-facing boards are a communication channel. The underlying risk (poor third-party docs) is real and should go in the RAID log and status report in professional language.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-jira-clickup-basics-q5",
          prompt:
            "Tickets are moved to Done as soon as the code is merged, though nothing is tested or deployed to staging. What does this do to the board?",
          options: [
            "It overstates progress, so burndown and velocity look healthier than reality until QA finds the gaps",
            "It improves accuracy, because merging is the hardest part",
            "It has no effect on reporting",
            "It reduces scope",
          ],
          correctIndex: 0,
          explanation:
            "Done should mean the Definition of Done is met. 'Status theatre' makes every chart lie, and the client sees a sudden slip near the end.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-jira-clickup-basics-q6",
          prompt: "The client insists on tracking work in their own Jira, and Oyelabs also uses ClickUp internally. What is the most important decision to make early?",
          options: [
            "Which tool is the source of truth, and how (or whether) the other is kept in sync",
            "Which tool has the better mobile app",
            "Whether to stop using any tool",
            "Which developer is responsible for updating both tools manually every evening",
          ],
          correctIndex: 0,
          explanation:
            "Two unsynchronised tools means two versions of the truth and disputes about status. Pick one as authoritative; manual double entry is the expensive, error-prone default to avoid.",
        },
        {
          id: "pm-b-jira-clickup-basics-q7",
          prompt: "What does a Jira Scrum backlog let a team do that a plain to-do list does not?",
          options: [
            "Rank work items, estimate them and drag them into sprints",
            "Automatically write acceptance criteria",
            "Guarantee the sprint is finished on time",
            "Bill the client for each ticket",
          ],
          correctIndex: 0,
          explanation:
            "Atlassian's docs describe the backlog as where you rank, estimate and plan sprints. The tool supports the process; it does not do the thinking or guarantee outcomes.",
        },
      ],
      practice: {
        kind: "spot",
        prompt: "This ticket is about to go into the next sprint for a client's AI feature. Mark the lines that would cause problems.",
        segments: [
          { id: "s1", text: "Title: AI stuff for search", issue: "The title does not describe an outcome, so nobody can tell what is being delivered." },
          { id: "s2", text: "Type: Story. Parent epic: Smart Search (SRCH-12)", issue: null },
          { id: "s3", text: "As a shopper, I want to search in plain language so that I find products without exact keywords.", issue: null },
          {
            id: "s4",
            text: "Acceptance criteria: search should be smart and work well.",
            issue: "Untestable criteria; QA cannot tell when this is done.",
          },
          { id: "s5", text: "Assignee: unassigned until sprint planning", issue: null },
          {
            id: "s6",
            text: "Estimate: we'll know once it's built",
            issue: "No estimate, so it cannot be planned into a sprint; a spike should come first if the team cannot size it.",
          },
          { id: "s7", text: "Linked: SRCH-15 (index product catalogue), blocks this story", issue: null },
          {
            id: "s8",
            text: "Note (visible to client): the client's product data is a mess, again.",
            issue: "Unprofessional internal comment on a client-visible ticket; the data-quality risk belongs in the RAID log.",
          },
          { id: "s9", text: "Labels: ai, search", issue: null },
          { id: "s10", text: "Definition of Done: team standard (reviewed, tested, on staging)", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pm-b-running-standups",
      moduleId: "pm-beginner",
      trackId: "pm",
      title: "Running Stand-ups That Are Worth the 15 Minutes",
      summary:
        "The Daily Scrum exists so the people doing the work can inspect progress toward the Sprint Goal and adapt their plan for the next day. The Scrum Guide gives it 15 minutes and gives it to the Developers. It is not a status meeting for the PM, and it does not have to use the old three questions; the 2020 Guide dropped them in favour of whatever structure focuses the team on the goal.\n\nThe classic failure is the round-robin status report: each person tells the PM what they did, nobody listens to anyone else, and blockers are mentioned in passing and then left. Better formats walk the board right to left (what is closest to done, and what is stopping it), or focus on the Sprint Goal and the riskiest item. Problem-solving happens afterwards, with only the people who need to be there.\n\nAt an agency, two extra tensions appear. Clients ask to attend, which changes the meeting: developers stop admitting problems, and the client starts adding requests. A short separate client sync, or a written daily update, usually works better. And distributed teams across time zones may run asynchronous stand-ups in Slack, which saves time but loses the moment where two people realise they are blocking each other, so the PM must read and act on them, not just collect them.\n\nThe PM's role is to remove the blockers that surface, especially external ones such as waiting on a client's API keys, data export or LLM provider quota. A blocker raised three days running with no owner is the clearest sign the stand-up has become theatre.",
      level: "beginner",
      estMinutes: 30,
      webRefs: [
        { label: "The Scrum Guide: Daily Scrum", url: "https://scrumguides.org/scrum-guide.html", kind: "spec" },
        { label: "Atlassian: Stand-ups", url: "https://www.atlassian.com/agile/scrum/standups", kind: "article" },
        {
          label: "Mountain Goat Software: Daily Scrum",
          url: "https://www.mountaingoatsoftware.com/agile/scrum/meetings/daily-scrum",
          kind: "article",
        },
      ],
      video: {
        title: "Daily Scrum Explained: A Better Way to Run It",
        channel: "Mountain Goat Software: Agile & Scrum Mastery",
        url: "https://www.youtube.com/watch?v=MZdK4SX0mfI",
        videoId: "MZdK4SX0mfI",
        durationLabel: "5:06",
      },
      alternateVideos: [
        {
          title: "How to Hold a Daily Stand-up Meeting",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=JSFfyse_EXM",
          videoId: "JSFfyse_EXM",
          durationLabel: "4:53",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-b-running-standups-q1",
          prompt: "What is the purpose of the Daily Scrum in the 2020 Scrum Guide?",
          options: [
            "For the Developers to inspect progress toward the Sprint Goal and adapt the plan for the coming day",
            "For the PM to collect a status update from each person",
            "For the client to check the team is working",
            "To solve technical problems as a group",
          ],
          correctIndex: 0,
          explanation:
            "It is a planning event for the Developers, focused on the Sprint Goal. Status reporting to managers and group problem-solving are the two most common ways it gets derailed.",
        },
        {
          id: "pm-b-running-standups-q2",
          prompt: "Two developers start debugging a payment webhook in the stand-up, and it reaches 25 minutes. What should the facilitator do?",
          options: [
            "Note the topic and ask the two (and anyone needed) to continue straight after the stand-up",
            "Let it run, because solving the bug is more important than the timebox",
            "Ask everyone to stay so they learn about the webhook",
            "Cancel tomorrow's stand-up to make up the time",
          ],
          correctIndex: 0,
          explanation:
            "The stand-up identifies the problem; the solving happens afterwards with only the people involved. Keeping the whole team for a two-person problem wastes several hours of collective time.",
        },
        {
          id: "pm-b-running-standups-q3",
          prompt: "The client asks to join every daily stand-up. What are the likely downsides? (Select all that apply.)",
          options: [
            "Developers become less willing to raise problems openly",
            "The meeting drifts toward new client requests and reporting to the client",
            "It becomes harder to keep to 15 minutes",
            "It is forbidden by the Scrum Guide for clients to ever observe",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The audience changes the meeting's purpose. The Guide does not forbid observers, but it does say the event is for the Developers, so a separate client sync or written update is usually the better answer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-running-standups-q4",
          prompt:
            "For three days running, a developer says they are 'waiting on the client for production OpenAI API keys'. What does this show?",
          options: [
            "The blocker has no owner; the PM should take it, escalate to the client and record it as an issue",
            "The developer should keep waiting quietly",
            "The stand-up is working, because the blocker is being reported",
            "The developer should create their own API account and bill it to the client",
          ],
          correctIndex: 0,
          explanation:
            "Raising a blocker is only half the job; someone must own its removal. External dependencies such as client credentials are squarely the PM's to chase, and using a personal account creates billing and data-ownership problems.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-running-standups-q5",
          prompt: "What does 'walking the board' mean in a stand-up?",
          options: [
            "Going through items from closest-to-done backwards and asking what stops each one finishing",
            "Each person reading their own tickets aloud in turn",
            "The PM moving tickets to Done for the team",
            "Reviewing the whole product backlog daily",
          ],
          correctIndex: 0,
          explanation:
            "Walking the board right to left focuses on finishing work and on flow, rather than on individuals justifying their day.",
        },
        {
          id: "pm-b-running-standups-q6",
          prompt: "A team spread from India to the US runs an async stand-up in Slack. What is the main risk the PM must manage?",
          options: [
            "Updates get posted but nobody reads them or connects blockers between people",
            "Slack messages are not allowed in Scrum",
            "Async stand-ups always take longer than meetings",
            "Developers cannot mention blockers in writing",
          ],
          correctIndex: 0,
          explanation:
            "Async saves calendar time across time zones, but loses the moment where people notice they block each other. The PM has to read, connect and act on the updates.",
        },
        {
          id: "pm-b-running-standups-q7",
          prompt: "Does the 2020 Scrum Guide require the three questions (what I did yesterday, what I will do today, any impediments)?",
          options: [
            "No; the Developers can choose any structure that focuses on progress toward the Sprint Goal",
            "Yes; they are mandatory",
            "Yes, but only for teams of more than five",
            "No; the Guide forbids them",
          ],
          correctIndex: 0,
          explanation:
            "The 2020 Guide removed the three questions as a requirement. Teams may still use them, but they tend to produce person-by-person status reports rather than a plan.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Here are notes from a stand-up on an Oyelabs project building an AI meal-planning app. Mark the moments that show the stand-up going wrong.",
        segments: [
          { id: "s1", text: "09:30 Stand-up starts on time; the Sprint Goal is on screen.", issue: null },
          {
            id: "s2",
            text: "The PM asks each developer in turn: 'What did you do yesterday?' and types the answers into a report.",
            issue: "It has become a status report to the PM rather than the team planning together toward the goal.",
          },
          { id: "s3", text: "Priya says the recipe-ranking story is ready for review and asks who can review it today.", issue: null },
          {
            id: "s4",
            text: "Sam and Ade spend 20 minutes debating vector database indexes while five others wait.",
            issue: "Problem-solving in the stand-up; it should move to a follow-up with only those two.",
          },
          {
            id: "s5",
            text: "The client's product lead, attending, asks the team to add a grocery-list export 'quickly' this sprint.",
            issue: "New scope requested in the stand-up and not routed through the PO and change control.",
          },
          { id: "s6", text: "QA mentions the staging environment was down for an hour; the tech lead says it is fixed.", issue: null },
          {
            id: "s7",
            text: "Ade says, for the third day, that he is waiting on the client's nutrition-data export; nobody picks it up.",
            issue: "Recurring blocker with no owner; the PM should own the chase and escalate.",
          },
          { id: "s8", text: "The team agrees to swarm on the meal-plan screen to hit the Sprint Goal.", issue: null },
          { id: "s9", text: "Stand-up ends at 10:05.", issue: "35 minutes, more than double the 15-minute timebox." },
          { id: "s10", text: "Sam updates the board after the meeting.", issue: null },
        ],
        askExplanation: false,
      },
    },
    {
      id: "pm-b-status-reporting-client-comms",
      moduleId: "pm-beginner",
      trackId: "pm",
      title: "Status Reporting & Client Communication",
      summary:
        "A status report exists to let the client make decisions without attending every meeting. That means it is not a diary of activity ('we had 14 commits') but an answer to four questions: are we on track against the plan, what changed since last time, what is at risk, and what do we need from you, by when? Everything else is noise that teaches the client to stop reading.\n\nRAG ratings (red, amber, green) are useful only when they are honest and defined. Agencies drift into 'watermelon reporting', green outside and red inside, because nobody wants to send bad news on a fixed bid. The cost of that is asymmetric: an amber flagged four weeks early is a conversation; a red that appears two weeks before launch is a dispute. Define the thresholds up front (for example, amber when forecast slips by more than a week or budget burn runs 10% ahead of progress) so the colour is a fact, not a mood.\n\nAudience shapes format. A sponsor wants three lines and a decision; a product contact wants story-level progress and the demo link. AI work adds its own lines: evaluation results against the agreed quality bar, and API spend against forecast, because both can drift silently. GOV.UK's agile governance principles make the same point from the client side: show the thing working and be open about problems, rather than relying on paperwork.\n\nThe gotcha is the buried ask. If you need the client's data export by Friday, it goes at the top, with a named person and a date, and the consequence of missing it. A blocker hidden in paragraph four will be missed, and the delay will be blamed on you.",
      level: "intermediate",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        {
          label: "GOV.UK Service Manual: Governance principles for agile service delivery",
          url: "https://www.gov.uk/service-manual/agile-delivery/governance-principles-for-agile-service-delivery",
          kind: "docs",
        },
        { label: "ProjectManager: Project status reports (guide)", url: "https://www.projectmanager.com/guides/status-report", kind: "article" },
        { label: "Asana: How project status reports work", url: "https://asana.com/resources/how-project-status-reports", kind: "article" },
        { label: "Teamwork.com: Client project management for agencies", url: "https://www.teamwork.com/blog/client-project/", kind: "article" },
      ],
      video: {
        title: "Project Management Status Reports [WHAT TO INCLUDE]",
        channel: "Adriana Girdler",
        url: "https://www.youtube.com/watch?v=8C1PBSs_cMI",
        videoId: "8C1PBSs_cMI",
        durationLabel: "12:35",
      },
      alternateVideos: [
        {
          title: "What goes into a Project Progress Report? (Step-by-Step Guide)",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=Ip90-6mVREU",
          videoId: "Ip90-6mVREU",
          durationLabel: "6:30",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-b-status-reporting-client-comms-q1",
          prompt:
            "Every weekly report on a fixed-bid project has been green. Internally, the team knows the AI integration is two weeks behind. What is this pattern called, and what is its main cost?",
          options: [
            "Watermelon reporting; bad news arrives late, when there are fewer options and more anger",
            "Optimistic forecasting; it has no real cost if the team catches up",
            "Agile reporting; slips are normal and need not be reported",
            "Traffic-light fatigue; the client stops reading the colours",
          ],
          correctIndex: 0,
          explanation:
            "Green outside, red inside. A slip flagged early is a trade-off conversation; flagged late it becomes a credibility and contract problem. Hoping to catch up silently is how most of these start.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-status-reporting-client-comms-q2",
          prompt: "Which belong at the top of a weekly client status report? (Select all that apply.)",
          options: [
            "Overall status against plan, with the reason if it is not green",
            "Decisions or inputs needed from the client, with an owner and a date",
            "The main risks and what is being done about them",
            "A list of every commit merged this week",
            "Developers' hours by day",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The report exists to support decisions, so status, asks and risks lead. Commit lists and daily hours are activity, not progress, and bury what matters.",
        },
        {
          id: "pm-b-status-reporting-client-comms-q3",
          prompt: "Why define RAG thresholds with the client at the start of the project?",
          options: [
            "So the colour reflects agreed facts (such as a forecast slip of more than a week) rather than the PM's mood",
            "Because clients cannot understand colours without a key",
            "To make it easier to report green",
            "Because RAG is required by the Scrum Guide",
          ],
          correctIndex: 0,
          explanation:
            "Agreed thresholds make amber and red non-negotiable facts, which protects the PM from pressure to stay green. Scrum says nothing about RAG.",
        },
        {
          id: "pm-b-status-reporting-client-comms-q4",
          prompt:
            "The team needs the client's historical support tickets to tune the AI assistant, or the next sprint stalls. Where should that request go in the report?",
          options: [
            "At the top, as a named ask with a deadline and the impact of missing it",
            "In the risks section at the bottom",
            "In a separate email next month",
            "Nowhere; developers should ask the client directly",
          ],
          correctIndex: 0,
          explanation:
            "Asks buried in the body get missed, and the delay is then blamed on the agency. Owner, date and consequence make it actionable and create a record.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-status-reporting-client-comms-q5",
          prompt: "Which extra lines are worth adding to status reports on AI features specifically?",
          options: [
            "Evaluation results against the agreed quality bar, and LLM API spend against forecast",
            "The names of the models each developer prefers",
            "The number of prompts written this week",
            "Links to AI news articles",
          ],
          correctIndex: 0,
          explanation:
            "Quality and running cost both drift silently on AI features. Prompt counts and preferences are activity measures with no decision attached.",
        },
        {
          id: "pm-b-status-reporting-client-comms-q6",
          prompt: "The sponsor (a CEO) and the client's product manager both receive the report. What works best?",
          options: [
            "A three-line summary with decisions for the sponsor up top, and story-level detail below for the product manager",
            "Two completely separate reports with different numbers",
            "Only the detailed version; the CEO can skim",
            "Only the summary; the product manager can ask questions",
          ],
          correctIndex: 0,
          explanation:
            "One report with layered depth serves both audiences from the same facts. Different numbers in different reports destroy trust the moment someone compares them.",
        },
        {
          id: "pm-b-status-reporting-client-comms-q7",
          prompt:
            "Mid-week, the PM learns that the LLM provider has deprecated the model the app uses, with a 60-day deadline. The next report is due in six days. What should the PM do?",
          options: [
            "Tell the client now, with the impact and proposed options, then follow up in the report",
            "Wait for the weekly report so all news is in one place",
            "Fix it quietly; the client does not need to know about vendor changes",
            "Mention it only if the migration goes over budget",
          ],
          correctIndex: 0,
          explanation:
            "Material news should not wait for the reporting cycle. Migrating models can change quality and cost, which is the client's decision as much as the team's.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-status-reporting-client-comms-q8",
          prompt: "What does GOV.UK's guidance on agile governance favour over written progress reports?",
          options: [
            "Seeing the working service and talking to the team, with open discussion of problems",
            "Longer and more frequent written reports",
            "Monthly steering committees only",
            "Automatic dashboards with no human commentary",
          ],
          correctIndex: 0,
          explanation:
            "The principles emphasise looking at the actual thing and trusting open conversation over paperwork. For an agency, a demo link in every report applies the same idea.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write this week's status update email to the client sponsor, using the facts below. Lead with what they need to know and do. Keep it honest about the slip.",
        context:
          "Project: AI-powered customer support assistant for an e-commerce client, fixed bid, launch planned for 14 November.\nThis week: chat UI and order-lookup integration finished and on staging (demo link available). The answer-quality evaluation shows 78% of test questions answered correctly; the agreed bar is 90%.\nCause: the client's help-centre articles are outdated in places, so the assistant repeats wrong return policies.\nNeed: the client's support lead to review and update 40 flagged articles by 24 October. If not done, launch moves by at least a week.\nAPI spend on staging is $120 against a forecast of $150 for the month.",
        wordLimit: 220,
        rubric: [
          {
            id: "status",
            label: "Honest overall status",
            description: "States amber (or equivalent) with the reason: quality at 78% vs 90% bar, putting the 14 November launch at risk. No green-washing.",
            weight: 2,
          },
          {
            id: "ask",
            label: "Clear ask at the top",
            description: "Names the support lead, the 40 articles, the 24 October date and the consequence (launch moves at least a week).",
            weight: 2,
          },
          {
            id: "progress",
            label: "Progress as outcomes",
            description: "Reports finished, demonstrable work (chat UI, order lookup on staging, demo link) rather than activity.",
            weight: 1,
          },
          {
            id: "concise",
            label: "Concise and scannable",
            description: "Short, structured (status, ask, progress, risks/cost), professional tone, no blame on the client.",
            weight: 1,
          },
        ],
        sampleAnswer:
          "Subject: Support assistant: status AMBER, action needed by 24 Oct\n\nHi Dana,\n\nStatus: Amber. The 14 November launch is at risk because answer quality is at 78% against the agreed 90%.\n\nWhat we need: your support lead to review and update the 40 help-centre articles we've flagged (list attached) by 24 October. Most wrong answers trace to outdated return policies in those articles. If they are not updated by then, launch moves by at least a week.\n\nDone this week: the chat UI and order lookup are finished and on staging. Demo: [link].\n\nCost: API spend on staging is $120 against a $150 forecast for the month.\n\nNext: we will re-run the evaluation within two days of receiving the updated articles and confirm whether we are back to green.\n\nBest,\nAlex",
      },
    },
    {
      id: "pm-b-requirements-gathering",
      moduleId: "pm-beginner",
      trackId: "pm",
      title: "Requirements Gathering & Discovery",
      summary:
        "Clients describe solutions; requirements gathering finds the problem underneath. 'We need a chatbot' might mean support costs are too high, customers cannot find order status, or a competitor launched one. Each leads to a different, differently priced product. Discovery exists to find the real problem, the users, the constraints and the riskiest assumptions before the agency commits to a price, and GOV.UK's guidance is blunt that discovery should not start building the solution.\n\nThe techniques are familiar: stakeholder interviews, workshops, observing users, reviewing existing systems and data, and prototypes. The skill is in choosing them. Interviews reveal what people believe; observation and data reveal what they actually do. Ask about the last time something happened rather than what usually happens, and separate functional requirements (what the system does) from non-functional ones (speed, security, availability, data residency), which are the ones clients forget and engineers price differently.\n\nAI features change the questions. You need to know what data exists, who owns it, its quality and whether the client may legally send it to a third-party model; what an acceptable error rate is and who is harmed by a wrong answer; and what volume to expect, because that drives API cost. A requirement such as 'summarise every call' at 5,000 calls a day is a running-cost decision, not just a feature.\n\nThe gotcha is the confident stakeholder. The person in the workshop with the strongest opinions is often not the end user and not the budget holder. Validate requirements with the people who will use the system and confirm priorities with the sponsor, in writing, before they become a fixed scope.",
      level: "intermediate",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        {
          label: "GOV.UK Service Manual: How the discovery phase works",
          url: "https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works",
          kind: "docs",
        },
        { label: "Asana: Requirements gathering", url: "https://asana.com/resources/requirements-gathering", kind: "article" },
        {
          label: "ProjectManager: Requirements gathering guide",
          url: "https://www.projectmanager.com/blog/requirements-gathering-guide",
          kind: "article",
        },
      ],
      video: {
        title: "How to Gather Project Requirements",
        channel: "Adriana Girdler",
        url: "https://www.youtube.com/watch?v=WrPmccFpdaU",
        videoId: "WrPmccFpdaU",
        durationLabel: "9:55",
      },
      alternateVideos: [
        {
          title: "Requirements Gathering Techniques & Template | TeamGantt",
          channel: "TeamGantt",
          url: "https://www.youtube.com/watch?v=5idGzKLf-W8",
          videoId: "5idGzKLf-W8",
          durationLabel: "11:29",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-b-requirements-gathering-q1",
          prompt: "A client opens with 'We need an AI chatbot on our website.' What is the most useful next question?",
          options: [
            "What problem would the chatbot solve, and how would you know it worked?",
            "Which LLM would you like us to use?",
            "What colour should the chat widget be?",
            "When do you need it by?",
          ],
          correctIndex: 0,
          explanation:
            "The request is a solution; the problem and success measure decide what to build and how to price it. Model, design and date matter later, once you know what success means.",
        },
        {
          id: "pm-b-requirements-gathering-q2",
          prompt: "Which are non-functional requirements? (Select all that apply.)",
          options: [
            "Answers must appear within 3 seconds for 95% of requests",
            "Customer data must stay in EU data centres",
            "The system must be available 99.9% of the time",
            "Users can reset their password by email",
            "Admins can export a monthly report",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Performance, data residency and availability describe qualities of the system. Password reset and exports are functional: things the system does. Non-functional requirements are the ones clients forget and that change architecture and cost most.",
        },
        {
          id: "pm-b-requirements-gathering-q3",
          prompt: "Which interview question gives the most reliable information about real behaviour?",
          options: [
            "Tell me about the last time a customer asked about a refund. What happened?",
            "How do you usually handle refunds?",
            "Would you use a feature that automated refunds?",
            "Don't you think an AI could handle refunds faster?",
          ],
          correctIndex: 0,
          explanation:
            "Asking about a specific recent event surfaces what actually happens. 'Usually' invites the idealised process, hypotheticals predict behaviour poorly, and leading questions get agreement, not information.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-requirements-gathering-q4",
          prompt:
            "Discovery for a call-summary feature reveals 5,000 calls a day. Why must this number reach the estimate and the client conversation?",
          options: [
            "Volume drives the per-call LLM cost, which can exceed the build cost within months",
            "It only affects how many developers are needed",
            "It does not matter; LLM costs are negligible",
            "It sets the length of each sprint",
          ],
          correctIndex: 0,
          explanation:
            "On AI features, usage volume is a cost requirement. The client must decide whether that running cost is worth it before you fix scope, not after the first invoice.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-requirements-gathering-q5",
          prompt: "Which questions must be answered before an AI feature can use a client's customer data? (Select all that apply.)",
          options: [
            "Who owns the data and does the client have the right to process it this way?",
            "May it be sent to a third-party model provider, and under what terms?",
            "Is the data good enough quality for the task?",
            "Which developer likes the dataset most?",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Ownership, legal basis and quality determine whether the feature is buildable at all. Discovering a data-protection blocker after the build is the most expensive way to find it.",
        },
        {
          id: "pm-b-requirements-gathering-q6",
          prompt: "According to GOV.UK's service manual, what should a discovery phase avoid?",
          options: [
            "Starting to build the service before understanding the problem",
            "Talking to users",
            "Looking at existing systems and constraints",
            "Deciding whether to proceed to the next phase",
          ],
          correctIndex: 0,
          explanation:
            "Discovery is for understanding the problem and deciding whether to continue; building starts in alpha with prototypes. Users, constraints and a go/no-go decision are exactly what discovery covers.",
        },
        {
          id: "pm-b-requirements-gathering-q7",
          prompt:
            "In a workshop, the client's sales director insists the app needs a voice assistant. The support staff, who will use the tool daily, never mention it. What should the PM do?",
          options: [
            "Capture it, validate it with the actual users, and ask the sponsor to prioritise it against the rest",
            "Add it as a must-have, because a director requested it",
            "Drop it, because the users did not ask for it",
            "Let the developers decide whether it is worth building",
          ],
          correctIndex: 0,
          explanation:
            "Strong opinions in the room are not automatically requirements, nor are they automatically wrong. Validate with users, then have the budget holder prioritise in writing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-requirements-gathering-q8",
          prompt: "What is the best way to end discovery for a fixed-bid AI build?",
          options: [
            "A written summary of problem, users, prioritised requirements, assumptions, risks and the quality bar, signed off by the sponsor",
            "A verbal agreement in the final workshop",
            "A list of features copied from a competitor's app",
            "The developers' estimate with no written assumptions",
          ],
          correctIndex: 0,
          explanation:
            "A fixed price is only as good as the scope and assumptions it rests on. Writing them down and getting sponsor sign-off creates the baseline that change control later protects.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "A logistics client asks Oyelabs for 'an AI that reads delivery notes and updates our system'. They want a fixed price by next week. You have one discovery workshop scheduled.",
        steps: [
          {
            id: "focus",
            question: "What should be the priority for the one workshop?",
            options: [
              "Understand the current process, the volume of notes, the target system, and who signs off, and get sample delivery notes",
              "Demo a generic AI product so the client is excited",
              "Agree the UI colours and branding",
              "Ask developers to estimate live in the workshop",
            ],
            correctIndex: 0,
            explanation:
              "Process, volume, integration and decision-maker drive scope and price; real samples are the only way to judge AI feasibility. Demos and branding can wait.",
          },
          {
            id: "samples",
            question:
              "The samples arrive: about 30% are handwritten and some are photos taken at an angle. The client still wants a fixed price next week. What do you propose?",
            options: [
              "A short paid spike on the samples to measure extraction accuracy, then a fixed price for the build with the measured accuracy as the agreed bar",
              "A fixed price now, assuming 99% accuracy",
              "Decline the project because handwriting is hard",
              "A fixed price now with a 50% buffer and no stated assumptions",
            ],
            correctIndex: 0,
            explanation:
              "Handwriting and poor photos make accuracy the main unknown. A spike converts it into data; fixing a price on a guessed accuracy either loses money or ends in a dispute about quality.",
          },
          {
            id: "signoff",
            question: "After the spike, how do you lock down the requirements before the build?",
            options: [
              "Send a written scope with the accuracy bar, what happens to notes below it (human review queue), volumes, exclusions and assumptions, for the sponsor to sign off",
              "Rely on the workshop recording",
              "Ask the client's operations team to approve it in a Slack message",
              "Start building and document the scope at the end",
            ],
            correctIndex: 0,
            explanation:
              "A signed baseline with the quality bar and a fallback for low-confidence notes is what makes a fixed bid on AI work defensible later.",
          },
        ],
      },
    },
    {
      id: "pm-b-software-basics-for-pms",
      moduleId: "pm-beginner",
      trackId: "pm",
      title: "Software Basics for PMs: Environments, APIs, Git & Deployment",
      summary:
        "A PM does not need to write code, but must understand how code travels from a developer's laptop to the client's users, because every schedule, risk and status update depends on it. Without that model, 'it works on staging' sounds like done and 'the API is rate-limited' sounds like an excuse.\n\n**Environments** are separate copies of the system: local (a developer's machine), development or test, staging (as close to production as possible, where QA and client UAT happen) and production (real users, real data). Differences between them, such as different API keys, data or configuration, are a leading cause of 'it worked yesterday' failures, which is why the Twelve-Factor approach keeps configuration out of the code. **APIs** are contracts that let systems talk: your app calls a payment provider's API, an LLM provider's API, or the client's own backend. Third-party APIs bring rate limits, outages, pricing and credentials, all of which are project risks the PM should track.\n\n**Git** records every change; teams work on branches and merge them through pull requests with code review. Workflows range from Gitflow (long-lived develop and release branches, suits scheduled releases) to trunk-based development (short branches merged daily, suits continuous delivery). **Deployment** means putting a version onto an environment; continuous integration builds and tests every merge, continuous delivery keeps it releasable, and continuous deployment pushes it to production automatically.\n\nThe PM gotcha: 'merged' is not 'deployed', and 'deployed to staging' is not 'released'. Status reports and client promises must say which one you mean, and a release that needs a client's app-store approval or a production API key has steps the team does not control.",
      level: "beginner",
      estMinutes: 45,
      webRefs: [
        {
          label: "Microsoft Learn: Azure Pipelines environments (dev/test/staging/prod)",
          url: "https://learn.microsoft.com/en-us/azure/devops/pipelines/process/environments?view=azure-devops",
          kind: "docs",
        },
        { label: "Atlassian: Gitflow workflow", url: "https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow", kind: "docs" },
        { label: "AWS: What is an API?", url: "https://aws.amazon.com/what-is/api/", kind: "article" },
        {
          label: "Atlassian: CI vs continuous delivery vs continuous deployment",
          url: "https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment",
          kind: "article",
        },
      ],
      video: {
        title: "APIs Explained (in 4 Minutes)",
        channel: "Aced (formerly Exponent)",
        url: "https://www.youtube.com/watch?v=bxuYDT-BWaI",
        videoId: "bxuYDT-BWaI",
        durationLabel: "3:57",
      },
      alternateVideos: [
        {
          title: "3 Git Workflows Every Developer Should Know (And When to Use Each)",
          channel: "TechWorld with Nana",
          url: "https://www.youtube.com/watch?v=GQQqf-C2ha4",
          videoId: "GQQqf-C2ha4",
          durationLabel: "31:32",
        },
        {
          title: "How Git Works: Explained in 4 Minutes",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=e9lnsKot_SQ",
          videoId: "e9lnsKot_SQ",
          durationLabel: "4:18",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-b-software-basics-for-pms-q1",
          prompt: "A developer says the new feature is 'merged'. What can the PM safely tell the client?",
          options: [
            "Nothing about availability yet; merged means the code is in the main branch, not that it is deployed or released",
            "It is live for users",
            "It is ready for UAT on staging",
            "It is in the app stores",
          ],
          correctIndex: 0,
          explanation:
            "Merged, deployed to staging and released to production are different states. Unless the team deploys automatically on merge, the PM should check before promising anything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-software-basics-for-pms-q2",
          prompt: "Where should client UAT normally happen?",
          options: ["Staging", "Production", "A developer's laptop", "The Git repository"],
          correctIndex: 0,
          explanation:
            "Staging mirrors production closely without exposing real users to unaccepted work. Testing in production risks real customers and data.",
        },
        {
          id: "pm-b-software-basics-for-pms-q3",
          prompt:
            "The AI feature works on staging but fails in production on launch day with 'invalid API key'. What is the most likely cause?",
          options: [
            "Production configuration (such as the LLM provider key) was never set up or differs from staging",
            "The code has a bug that only appears on Mondays",
            "Git lost the code during the merge",
            "Staging and production always behave identically, so it must be the provider's fault",
          ],
          correctIndex: 0,
          explanation:
            "Configuration lives outside the code and differs between environments. Production keys, often owned by the client, are a classic launch-day blocker the PM should chase weeks earlier.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-b-software-basics-for-pms-q4",
          prompt: "Which of these are project risks that come with depending on a third-party API? (Select all that apply.)",
          options: ["Rate limits", "Outages on the provider's side", "Price changes", "Deprecation of the version you use", "Git merge conflicts"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Rate limits, outages, pricing and deprecations all sit outside the team's control and belong in the RAID log. Merge conflicts are an internal development matter.",
        },
        {
          id: "pm-b-software-basics-for-pms-q5",
          prompt: "What is the difference between continuous delivery and continuous deployment?",
          options: [
            "Delivery keeps every change releasable with a manual decision to release; deployment releases every passing change to production automatically",
            "They are the same thing",
            "Delivery is for mobile apps; deployment is for web apps",
            "Deployment requires a release manager; delivery does not",
          ],
          correctIndex: 0,
          explanation:
            "Both rely on automated build and test. The difference is the final step: a human decision versus automatic release.",
        },
        {
          id: "pm-b-software-basics-for-pms-q6",
          prompt: "A client wants fixed monthly releases with a stabilisation period, and a separate hotfix path. Which Git workflow fits that style best?",
          options: ["Gitflow", "Trunk-based development with continuous deployment", "No branches at all", "Forking every repository per developer"],
          correctIndex: 0,
          explanation:
            "Gitflow's release and hotfix branches suit scheduled releases. Trunk-based development suits teams that release continuously and is now often preferred where that is possible.",
        },
        {
          id: "pm-b-software-basics-for-pms-q7",
          prompt: "In plain terms, what is an API?",
          options: [
            "A defined contract that lets one piece of software request data or actions from another",
            "A database that stores the app's data",
            "A type of server",
            "The visual interface of the app",
          ],
          correctIndex: 0,
          explanation:
            "An API is an interface between programs: requests and responses in an agreed format. It is not storage, hardware or the user interface.",
        },
      ],
      practice: {
        kind: "rank",
        prompt: "Put the steps a change takes from a developer's idea to real users in order, for a team using pull requests and a staging environment (first at the top).",
        items: [
          { id: "branch", label: "Developer creates a feature branch and writes the code" },
          { id: "pr", label: "Pull request opened; teammate reviews the code and automated tests run (CI)" },
          { id: "merge", label: "Pull request merged into the main branch" },
          { id: "staging", label: "Build deployed to the staging environment" },
          { id: "uat", label: "QA and client UAT on staging; sign-off recorded" },
          { id: "prod", label: "Release deployed to production and monitored" },
        ],
        correctOrder: ["branch", "pr", "merge", "staging", "uat", "prod"],
        explanation:
          "Code is written on a branch, reviewed and tested through a pull request, merged, deployed to staging, accepted there, and only then released to production. Each step is a different status, which is why 'merged' never means 'live'.",
      },
    },
  ],
} satisfies Module;
