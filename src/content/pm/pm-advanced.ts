import type { Module } from "@/types/curriculum";

export default {
  id: "pm-advanced",
  trackId: "pm",
  name: "Advanced Delivery",
  description:
    "For PMs already running sprints and client accounts: hybrid delivery, capacity across several projects, flow and earned-value metrics, contracts and SOWs, escalation, recovery and vendors. Written for an agency shipping AI-powered client platforms under fixed bids, retainers and T&M.",
  refs: [
    { label: "PMI: PMBOK Guide 8th edition", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
    { label: "PMI: Disciplined Agile", url: "https://www.pmi.org/disciplined-agile", kind: "docs" },
    { label: "Atlassian: Agile metrics", url: "https://www.atlassian.com/agile/project-management/metrics", kind: "article" },
  ],
  topics: [
    {
      id: "pm-a-hybrid-delivery",
      moduleId: "pm-advanced",
      trackId: "pm",
      title: "Hybrid Delivery: Predictive Governance, Agile Execution",
      summary:
        "Most agency projects are hybrid whether or not anyone says so. The client signs a contract with a fixed budget, a launch date and a list of deliverables (predictive), while the team builds in sprints and learns what the AI features actually need as it goes (adaptive). Hybrid delivery is the deliberate version of that: choose, per part of the work, the approach that matches its uncertainty. PMI's 2026 PMP exam reflects this reality, with roughly 40% of content on predictive work and 60% on agile and hybrid approaches.\n\nThe practical split for an AI-powered client platform: predictive for things with stable requirements and hard dependencies (app-store submission, payment-provider onboarding, infrastructure procurement, data-processing agreements, a fixed go-live tied to a marketing event); adaptive for the product surface and anything model-driven, where prompt behaviour, retrieval quality and UX only become clear once real data flows through them. A common shape is a phase-gated outer plan (discovery, build, UAT, launch, hypercare) with sprints inside the build phase and milestone payments attached to gate outcomes rather than to a frozen feature list.\n\nThe trade-off is integration cost. Two planning vocabularies mean two kinds of status: a Gantt milestone is either met or missed, while a sprint backlog is always being re-ordered. The PM has to translate between them every week, typically by mapping epics to milestones and reporting both milestone confidence and backlog burn-up.\n\nThe gotcha: \"water-scrum-fall\". Teams run two-week sprints but requirements are still frozen up-front and testing still happens at the end, so the project carries all the cost of agile ceremonies and none of the learning. If the backlog cannot change after sign-off and nothing reaches a real user before UAT, the project is predictive in disguise; either make it honestly predictive or give the client a real product owner and a change budget.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PMI: Disciplined Agile", url: "https://www.pmi.org/disciplined-agile", kind: "docs" },
        { label: "PMI library: Hybrid approach within a waterfall environment", url: "https://www.pmi.org/learning/library/outcomes-hybrid-approach-waterfall-environment-5839", kind: "article" },
        { label: "ProjectManager: Agile vs waterfall and hybrid projects", url: "https://www.projectmanager.com/guides/agile-vs-waterfall-hybrid-projects", kind: "article" },
        { label: "Atlassian: Scrumban", url: "https://www.atlassian.com/agile/project-management/scrumban", kind: "article" },
      ],
      video: {
        title: "Project Management: Waterfall, Agile, & Hybrid Approaches",
        channel: "Kandis Porter",
        url: "https://www.youtube.com/watch?v=bLZ9MNwV2vE",
        videoId: "bLZ9MNwV2vE",
      },
      alternateVideos: [
        {
          title: "Waterfall vs Agile vs Hybrid Approaches Explained in 10 Minutes!",
          channel: "Alvin the PM - Become a Certified Project Manager",
          url: "https://www.youtube.com/watch?v=qf0Yzrzr_i4",
          videoId: "qf0Yzrzr_i4",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-a-hybrid-delivery-q1",
          prompt:
            "A client wants an AI customer-support platform: a fixed launch date tied to a product announcement, app-store releases on iOS and Android, and an LLM-based triage feature whose accuracy target nobody has tested yet. Which delivery approach fits best?",
          options: [
            "Hybrid: a phase-gated plan for launch, store submission and contracts, with sprints for the product and AI features",
            "Fully predictive: freeze every requirement, including the triage behaviour, before build starts",
            "Fully agile with no milestones, because any fixed date conflicts with agile values",
            "Kanban only, since the work is mostly support tickets",
          ],
          correctIndex: 0,
          explanation:
            "The fixed date and store submission have stable, dependency-heavy steps that suit a plan; the triage feature is uncertain and needs iteration. Freezing the AI behaviour up-front locks in guesses, and dropping milestones ignores a real contractual constraint.",
        },
        {
          id: "pm-a-hybrid-delivery-q2",
          prompt:
            "Which signs suggest a project is running \"water-scrum-fall\" rather than genuine hybrid delivery? (Select all that apply.)",
          options: [
            "The backlog is frozen at contract signature and every change goes through a formal change request",
            "No working software reaches a client user until a single UAT phase at the end",
            "Sprint reviews happen, but only the internal team attends",
            "Milestones are mapped to epics and reported alongside a burn-up",
            "The infrastructure procurement is scheduled on a Gantt chart",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Frozen scope, late integration and reviews without the client strip out the feedback loop that justifies sprints. Mapping epics to milestones and scheduling procurement predictively are healthy hybrid practices.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-hybrid-delivery-q3",
          prompt:
            "On a hybrid project, the client's finance team asks for a single percentage complete for the monthly steering report. What is the most defensible approach?",
          options: [
            "Report milestone status for the predictive parts and scope completed against the current release scope (burn-up) for the agile parts, with a short note on how scope has moved",
            "Report sprints completed divided by sprints planned",
            "Report hours spent divided by hours budgeted",
            "Refuse, because agile work cannot be measured as a percentage",
          ],
          correctIndex: 0,
          explanation:
            "Sprints elapsed and hours burned measure time and spend, not progress. A burn-up against current scope plus milestone status gives an honest picture and shows scope change explicitly; refusing to report damages trust.",
        },
        {
          id: "pm-a-hybrid-delivery-q4",
          prompt:
            "Which work items on an AI-powered platform are usually the best candidates for predictive planning? (Select all that apply.)",
          options: [
            "Signing the data-processing agreement and security review with the client's procurement team",
            "Apple App Store and Google Play submission and review windows",
            "Tuning the retrieval and prompt design for the AI assistant",
            "Choosing which onboarding screens to A/B test",
            "Cutover from the client's legacy system on a fixed weekend",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 4],
          explanation:
            "Legal reviews, store submission and a cutover weekend have known steps, external dependencies and fixed dates. Retrieval tuning and A/B choices are discovery work where planning everything up-front wastes effort.",
        },
        {
          id: "pm-a-hybrid-delivery-q5",
          prompt:
            "Midway through build, the client's product owner wants to swap a planned reporting dashboard for a voice-input feature of similar size. The contract is fixed-price with milestone payments tied to phases, not features. What should the PM do first?",
          options: [
            "Assess the swap with the team, confirm it fits the remaining capacity and milestone, then record the trade in the backlog and the change log",
            "Reject it, because the scope was agreed at signature",
            "Accept it immediately and say nothing to the sponsor",
            "Raise a formal change request priced as new work",
          ],
          correctIndex: 0,
          explanation:
            "Because payment is tied to phases, a like-for-like swap can be absorbed if it really is like-for-like; it still has to be assessed and recorded so the sponsor sees what changed. Treating every trade as new paid work turns hybrid into fixed-scope waterfall.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-hybrid-delivery-q6",
          prompt: "Why does PMI's Disciplined Agile toolkit describe choosing a way of working as context-dependent rather than prescribing one method?",
          options: [
            "Because team size, uncertainty, regulation and organisation all change which practices work, so teams choose and evolve their way of working",
            "Because Scrum is deprecated in PMI's standards",
            "Because predictive methods are never appropriate for software",
            "Because each project must invent its own method from scratch",
          ],
          correctIndex: 0,
          explanation:
            "Disciplined Agile's premise is \"choice is good\": context drives the practices. It doesn't reject Scrum or predictive work, and it offers proven options rather than asking teams to start from nothing.",
        },
        {
          id: "pm-a-hybrid-delivery-q7",
          prompt:
            "A hybrid project reports green on every Gantt milestone, but the burn-up shows scope growing faster than completed work for four sprints. What does this most likely mean?",
          options: [
            "The milestones are being met on paper while the release scope is drifting away, so the launch milestone is at risk",
            "The project is healthy; scope growth is normal in agile",
            "The burn-up is wrong because it disagrees with the Gantt",
            "The team's velocity is too high",
          ],
          correctIndex: 0,
          explanation:
            "Intermediate milestones can be met while the total keeps rising; if the scope line outruns the done line, the finish date recedes. Some growth is normal, but four sprints of divergence needs a scope conversation now.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-hybrid-delivery-q8",
          prompt:
            "What is the main cost of running a hybrid approach compared with a single method?",
          options: [
            "Translation overhead: two planning vocabularies and status models that the PM must reconcile for stakeholders",
            "It always needs twice as many people",
            "It forbids fixed-price contracts",
            "It removes the need for a product owner",
          ],
          correctIndex: 0,
          explanation:
            "Hybrid adds integration and communication work: milestone dates and backlog burn must be reconciled into one story. It doesn't require double staffing, and it is often used precisely with fixed-price contracts.",
        },
        {
          id: "pm-a-hybrid-delivery-q9",
          prompt:
            "Which payment structure best supports hybrid delivery on a fixed-budget AI platform build?",
          options: [
            "Milestone payments tied to phase outcomes (discovery sign-off, beta in users' hands, launch) with a defined change budget",
            "One payment at the end after every listed feature is accepted",
            "Payments tied to each individual user story",
            "Monthly invoicing with no milestones or acceptance points",
          ],
          correctIndex: 0,
          explanation:
            "Outcome-based milestones give the client control points without freezing the feature list. Paying per story or only at the end recreates fixed-scope risk, and no milestones at all removes the predictive governance the client needs.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "Oyelabs has signed a fixed-budget contract to build a white-label telehealth app with an AI symptom-intake assistant. The contract has three milestone payments: discovery sign-off, beta in the hands of 50 pilot clinicians, and public launch on 1 March (tied to the client's investor event). The client's CTO wants every screen and the assistant's full conversation design approved before build starts.",
        steps: [
          {
            id: "s1",
            question: "How do you propose to structure the delivery?",
            options: [
              "Phase gates for discovery, beta, launch and hypercare, with two-week sprints inside the build phases and the AI assistant treated as iterative work",
              "Agree to the CTO's request: design and approve everything, then build in one pass",
              "Pure Scrum with no milestones, and renegotiate the contract to remove the launch date",
              "Build the AI assistant first, then decide the rest of the plan",
            ],
            correctIndex: 0,
            explanation:
              "The fixed date and milestone payments need predictive gates; the assistant's behaviour can only be validated with real clinicians, so it needs iteration. Freezing it up-front locks in untested guesses.",
          },
          {
            id: "s2",
            question:
              "The CTO accepts the structure but asks how she will keep control without approving every screen in advance. What do you offer?",
            options: [
              "A named client product owner in sprint reviews, a prioritised backlog she can re-order, and a capped change budget recorded in a change log",
              "A weekly Gantt export showing every task",
              "A promise that the team will build exactly what was in the proposal",
              "Approval rights over every pull request",
            ],
            correctIndex: 0,
            explanation:
              "Control in adaptive delivery comes from ordering the backlog and seeing working software, plus a visible budget for change. Task-level Gantts and PR approval create overhead without improving decisions.",
          },
          {
            id: "s3",
            question:
              "Six weeks in, pilot clinicians find that the assistant's intake questions are too long, and fixing it will take about two sprints. Launch is still fixed. What is the best next step?",
            options: [
              "Re-plan the remaining backlog with the product owner: fund the fix by deferring lower-value features to after launch, and update the milestone forecast for the sponsor",
              "Fix it quietly by asking the team to work weekends",
              "Ignore it until after launch, because the beta milestone has already been paid",
              "Raise a change request for the full two sprints at the client's cost",
            ],
            correctIndex: 0,
            explanation:
              "The beta exists to find exactly this; the backlog is the lever. Hidden overtime is unsustainable, ignoring it risks a poor launch, and charging for a defect in the agreed outcome isn't fair.",
          },
        ],
      },
    },
    {
      id: "pm-a-capacity-planning",
      moduleId: "pm-advanced",
      trackId: "pm",
      title: "Multi-Project Resource & Capacity Planning",
      summary:
        "In an agency the scarce resource is rarely money; it is the four senior engineers who understand the LLM integration, the one iOS developer, and the designer every client wants. Capacity planning exists to answer two questions before they become crises: can we deliver what we have already sold, and can we say yes to the deal sales is about to close?\n\nThe arithmetic is simple and routinely done wrong. Start from contracted hours, subtract leave and public holidays, then apply a focus factor for meetings, support, code review and context switching (agency teams often land between 60% and 80%). Only then compare with demand. Planning people at 100% guarantees slippage, because every interruption comes out of project time. Context switching is the hidden tax: a developer split across three projects loses far more than a third of their week to each, so allocate people to as few concurrent projects as possible and treat support retainers as a fixed reservation, not slack.\n\nThe main trade-off is utilisation versus responsiveness. Agency finance wants billable utilisation high; delivery wants buffer so urgent client issues and production incidents do not derail sprints. Queueing theory explains why: as utilisation approaches 100%, wait times grow non-linearly, so the last 10% of utilisation costs far more in delay than it earns.\n\nGotchas: skills are not fungible, so an aggregate team total can look fine while one specialist is booked at 150%; tentative pipeline deals should be modelled by probability, not ignored or fully booked; and velocity from one project does not transfer to another with a different stack or client. Review capacity weekly across the whole portfolio, not per project, because each project manager optimising locally is how two projects end up promised the same engineer.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Atlassian: Agile estimation", url: "https://www.atlassian.com/agile/project-management/estimation", kind: "docs" },
        { label: "Asana: Capacity planning", url: "https://asana.com/resources/capacity-planning", kind: "article" },
        { label: "ProjectManager: Resource management guide", url: "https://www.projectmanager.com/guides/resource-management", kind: "article" },
        { label: "Asana: Resource planning", url: "https://asana.com/uses/resource-planning", kind: "article" },
      ],
      video: {
        title: "Best Practices for Resource Capacity Planning",
        channel: "Acuity PPM",
        url: "https://www.youtube.com/watch?v=tmE7pimtB5E",
        videoId: "tmE7pimtB5E",
      },
      alternateVideos: [
        {
          title: "Agile   Velocity and Capacity Planning Relationship",
          channel: "Ajeet SD",
          url: "https://www.youtube.com/watch?v=QcVzdDO3YXE",
          videoId: "QcVzdDO3YXE",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-a-capacity-planning-q1",
          prompt:
            "Your team's total capacity next month is 600 productive hours and committed demand is 540 hours, but 200 of those hours need your only React Native developer, who has 120 productive hours. What is the real situation?",
          options: [
            "Over capacity on a critical skill: the aggregate total hides an 80-hour shortfall for one person",
            "Healthy: 90% loading leaves a 60-hour buffer",
            "Under capacity: you can take on another project",
            "Fine, because other developers can pick up the React Native work at no cost",
          ],
          correctIndex: 0,
          explanation:
            "Skills aren't fungible, so plan by role or person, not just in total. Cross-skilling may help, but it isn't free and still has to be planned and costed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-capacity-planning-q2",
          prompt:
            "Which items should be deducted from contracted hours before comparing capacity with project demand? (Select all that apply.)",
          options: [
            "Approved leave and public holidays",
            "A reserved slice for the support retainer the team also covers",
            "Recurring meetings, code review and internal work, usually through a focus factor",
            "The hours of anyone working on a fixed-price project",
            "Story points already completed this quarter",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Leave, fixed reservations and overhead all reduce what's available for project work. Contract type doesn't remove people's hours, and completed points are past output, not future capacity.",
        },
        {
          id: "pm-a-capacity-planning-q3",
          prompt: "Why is planning the team at 100% utilisation a reliable way to miss dates?",
          options: [
            "As utilisation approaches 100%, queues and wait times grow sharply, so any interruption delays planned work",
            "Because developers refuse to work more than 80% of the time",
            "Because tools like Jira cannot show more than 100%",
            "It isn't: 100% is the target for a profitable agency",
          ],
          correctIndex: 0,
          explanation:
            "Queueing effects are non-linear: with no slack, every unplanned task waits for or displaces planned work. High billable utilisation is a finance goal, but delivery plans need buffer to be reliable.",
        },
        {
          id: "pm-a-capacity-planning-q4",
          prompt:
            "A senior engineer is split across three client projects at a third each. Which effect should the PM expect?",
          options: [
            "Each project gets noticeably less than a third of her productive time, because switching contexts carries a cost",
            "Each project gets exactly a third, as planned",
            "Each project gets more than a third, because she reuses ideas across them",
            "No effect as long as her total hours stay at 40 per week",
          ],
          correctIndex: 0,
          explanation:
            "Context switching costs time to reload state and creates waiting when one project blocks on her. Reuse is real but rarely offsets the switching cost; minimise concurrent assignments.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-capacity-planning-q5",
          prompt:
            "Sales has three proposals out: one at 80% likelihood (400 hours), one at 30% (600 hours) and one at 10% (1,000 hours). How should they appear in next quarter's capacity plan?",
          options: [
            "As weighted demand (here 320 + 180 + 100 = 600 hours) for planning, with named staffing only for the 80% deal",
            "Ignored until signed",
            "At full value (2,000 hours), to be safe",
            "Only the largest deal, because it has the biggest impact",
          ],
          correctIndex: 0,
          explanation:
            "Weighting by probability gives a realistic hiring and bench forecast. Ignoring the pipeline causes scrambles at signature; booking it all in full blocks people for work that probably won't come.",
        },
        {
          id: "pm-a-capacity-planning-q6",
          prompt:
            "Two PMs each promised the same ML engineer 'most of next sprint'. What process fix prevents this recurring?",
          options: [
            "A single portfolio-level capacity view reviewed weekly, with one owner arbitrating allocations of shared specialists",
            "Asking the engineer to split the difference",
            "Letting the project with the larger contract always win",
            "Each PM keeping a private spreadsheet of their team",
          ],
          correctIndex: 0,
          explanation:
            "Local optimisation by project creates double-booking; shared scarce people need one view and an explicit owner. Contract size alone ignores deadlines, penalties and strategic value.",
        },
        {
          id: "pm-a-capacity-planning-q7",
          prompt:
            "A new client project uses a different stack and a client-side approval process. The team averaged 40 points per sprint on its last project. How should you use that velocity?",
          options: [
            "Treat it as a weak prior: re-baseline after two or three sprints on the new project and plan the early range conservatively",
            "Commit to 40 points from sprint one",
            "Discard estimation entirely for this project",
            "Increase it to 50, because the team is now more experienced",
          ],
          correctIndex: 0,
          explanation:
            "Velocity is specific to a team, codebase and context. It's a reasonable starting guess, but forecasts should widen until new data exists; assuming improvement without evidence is optimism, not planning.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-capacity-planning-q8",
          prompt: "Which levers can resolve a capacity shortfall on a critical project? (Select all that apply.)",
          options: [
            "Re-sequence or defer lower-priority scope with the client",
            "Move a non-urgent internal project's people across, with that trade made explicit",
            "Bring in a vetted contractor early enough to onboard",
            "Raise everyone's focus factor in the spreadsheet to 100%",
            "Plan for weekend work as the default",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Scope, priority trade-offs and added people (with onboarding time) are real levers. Changing the focus factor only hides the problem, and planned overtime burns the team out and raises defects.",
        },
        {
          id: "pm-a-capacity-planning-q9",
          prompt: "What is the main tension capacity planning must balance in a services agency?",
          options: [
            "High billable utilisation for margin against slack for responsiveness and predictable delivery",
            "Using Jira against using spreadsheets",
            "Hiring juniors against hiring seniors",
            "Fixed-price against T&M contracts",
          ],
          correctIndex: 0,
          explanation:
            "Finance wants every hour billed; delivery needs buffer to absorb incidents and change. The other pairs are real decisions, but they aren't the core tension capacity planning manages.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Plan capacity for the next two-week sprint (10 working days, 8 hours a day for full-timers) for the team below. Apply a focus factor of 0.75 to net available hours to get productive hours. Committed demand is 120 h (Project A), 90 h (Project B) and 40 h reserved for the support retainer.",
        table: {
          columns: ["Person", "Contracted hours (2 weeks)", "Leave (hours)"],
          rows: [
            ["Asha", "80", "16"],
            ["Ben", "80", "0"],
            ["Chen", "80", "8"],
            ["Dee (part-time)", "48", "0"],
            ["Eli", "80", "40"],
          ],
        },
        fields: [
          { id: "net", label: "Net available hours (contracted minus leave)", unit: "h", answer: 304, tolerance: 0.5 },
          { id: "productive", label: "Productive hours after focus factor", unit: "h", answer: 228, tolerance: 0.5 },
          { id: "shortfall", label: "Shortfall: demand minus productive hours", unit: "h", answer: 22, tolerance: 0.5 },
          { id: "load", label: "Load: demand as a percentage of productive hours", unit: "%", answer: 109.6, tolerance: 0.2 },
        ],
        explanation:
          "Contracted 368 h minus 64 h leave = 304 h net. 304 x 0.75 = 228 productive hours. Demand 120 + 90 + 40 = 250 h, so the shortfall is 22 h and the load is 250 / 228 = 109.6%. Over 100% means something must move now: defer scope, borrow capacity, or re-negotiate a date. Don't plan it away as overtime.",
      },
    },
    {
      id: "pm-a-burndown-burnup",
      moduleId: "pm-advanced",
      trackId: "pm",
      title: "Reading Burndown, Burnup & Velocity Honestly",
      summary:
        "Burndown and burn-up charts exist so a sponsor can see in five seconds whether the work will finish when promised, without reading the backlog. A burndown plots remaining work against time; a burn-up plots completed work and total scope as two separate lines. That difference matters more than it looks: on a burndown, adding ten points of scope and completing ten points look the same (a flat line), so scope creep hides inside apparently slow delivery. For client work, where scope changes every week, the burn-up is usually the more honest release chart, and the burndown is best kept for the sprint itself.\n\nVelocity, the points completed per sprint, is a planning input for one team, not a performance score. Comparing velocity across teams or pushing a team to raise it produces point inflation: estimates grow, velocity rises, and nothing ships faster. Use a range from the last several sprints to forecast (\"between sprint 9 and sprint 11\") rather than a single average, and say so on the chart.\n\nShapes worth recognising: a flat sprint burndown that drops off a cliff on the last day means work is not being finished until the end (large stories, late testing or QA as a separate phase); a line that goes up mid-sprint means scope was added; a burndown that reaches zero early every sprint means the team is under-committing or padding estimates.\n\nThe gotcha for agencies: hours burned is not progress. A chart of hours spent against budget tells finance how much is gone, not how much is done; pairing it with a burn-up of accepted scope is what lets you spot a project that is on budget and badly behind, the most common silent failure in fixed-price work.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "Atlassian: Burndown charts", url: "https://www.atlassian.com/agile/tutorials/burndown-charts", kind: "docs" },
        { label: "Atlassian: Agile metrics", url: "https://www.atlassian.com/agile/project-management/metrics", kind: "article" },
        { label: "Mountain Goat Software: What are story points?", url: "https://www.mountaingoatsoftware.com/agile/what-are-story-points", kind: "article" },
      ],
      video: {
        title: "What are a Burndown Chart, a Burnup Chart, and Velocity?",
        channel: "Online PM Courses - Mike Clayton",
        url: "https://www.youtube.com/watch?v=2K84aZn9AY8",
        videoId: "2K84aZn9AY8",
      },
      alternateVideos: [
        {
          title: "Scrum Sessions: The Burndown Chart | What Is It And How Does It Work?",
          channel: "Scrum Inc.",
          url: "https://www.youtube.com/watch?v=BVTZxAe-8Wc",
          videoId: "BVTZxAe-8Wc",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-a-burndown-burnup-q1",
          prompt:
            "A release burndown has been flat for three sprints. The team says they completed about 30 points each sprint. What is the most likely explanation?",
          options: [
            "About 30 points of scope was added each sprint, cancelling out completed work; a burn-up would show it",
            "The team is lying about completed work",
            "The burndown tool is broken",
            "Velocity has fallen to zero",
          ],
          correctIndex: 0,
          explanation:
            "A burndown nets scope added against work done, so equal amounts produce a flat line. A burn-up separates the two lines; jumping to accusations or tool faults skips the obvious check.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-burndown-burnup-q2",
          prompt:
            "A sprint burndown stays almost flat for nine days, then drops to zero on the last day. What does this pattern usually indicate? (Select all that apply.)",
          options: [
            "Stories are too large to finish incrementally",
            "Testing or QA happens as a batch at the end of the sprint",
            "The team is updating the board only at the end",
            "The team is perfectly predictable",
            "The sprint was too short",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Late drops mean work is only declared done at the end: big stories, end-of-sprint testing or stale boards. It isn't a sign of predictability, and a longer sprint would just make the cliff later.",
        },
        {
          id: "pm-a-burndown-burnup-q3",
          prompt:
            "The last six sprints' velocities were 28, 35, 31, 24, 33 and 30. About 150 points remain. Which forecast is best to give the client?",
          options: [
            "A range of roughly four and a half to six more sprints, with the assumptions stated",
            "Exactly 4.97 sprints, from the average",
            "Four sprints, using the best sprint as the plan",
            "Seven sprints, using the worst sprint, presented as a commitment",
          ],
          correctIndex: 0,
          explanation:
            "150 points at 24 to 35 per sprint gives roughly 4.3 to 6.25 sprints; a range communicates real uncertainty. A single average implies false precision, the best sprint is optimistic, and the worst-case number as a commitment misleads the other way.",
        },
        {
          id: "pm-a-burndown-burnup-q4",
          prompt:
            "Leadership proposes ranking the agency's teams by velocity to identify the most productive. What is the main problem?",
          options: [
            "Points are relative to each team's own scale, so comparisons are meaningless and the incentive inflates estimates",
            "Velocity is only valid for Kanban teams",
            "Velocity should be measured in hours, not points",
            "Nothing, as long as teams use the Fibonacci scale",
          ],
          correctIndex: 0,
          explanation:
            "Each team calibrates points differently, and once velocity is a target, estimates grow to meet it (Goodhart's law). A shared scale doesn't fix the incentive problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-burndown-burnup-q5",
          prompt:
            "A fixed-price project has spent 50% of its hours budget at the halfway date. What can you conclude?",
          options: [
            "Only that spend is on plan; you need accepted scope against total scope to know whether progress is",
            "The project is on track",
            "The project is ahead of schedule",
            "The project will finish under budget",
          ],
          correctIndex: 0,
          explanation:
            "Spend measures input, not output. A project can be on budget and far behind; that's the silent failure a burn-up of accepted scope exposes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-burndown-burnup-q6",
          prompt: "When is a burn-up more useful than a burndown for client reporting?",
          options: [
            "When scope changes regularly and the client needs to see both what's done and how the target has moved",
            "When scope is completely fixed",
            "Only for Kanban teams",
            "Never; they show identical information",
          ],
          correctIndex: 0,
          explanation:
            "The burn-up's separate scope line makes change visible, which is exactly what client conversations need. With truly fixed scope, the two charts carry the same information.",
        },
        {
          id: "pm-a-burndown-burnup-q7",
          prompt: "The team's sprint burndown hits zero by day six of ten in four consecutive sprints. What should the PM explore?",
          options: [
            "Whether the team is under-committing or padding estimates, and whether more can be pulled in at planning",
            "Nothing: finishing early is always good",
            "Shortening the sprint to six days",
            "Asking the team to slow down to match the ideal line",
          ],
          correctIndex: 0,
          explanation:
            "A consistent early finish means planning is miscalibrated. Shortening the sprint or slowing down treats the symptom; the fix is better forecasting and pulling in work.",
        },
        {
          id: "pm-a-burndown-burnup-q8",
          prompt: "Which statements about velocity are true? (Select all that apply.)",
          options: [
            "It is a planning input for the team that produced it",
            "It's most useful as a range drawn from several recent sprints",
            "Partially finished stories should not be counted",
            "It measures the business value delivered",
            "It should rise every sprint in a healthy team",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Velocity counts done items for forecasting. Points measure effort and complexity, not value, and a stable velocity is healthier than one pushed upwards.",
        },
        {
          id: "pm-a-burndown-burnup-q9",
          prompt: "A mid-sprint burndown line goes upward for a day. What happened?",
          options: [
            "Work was added to the sprint, or remaining estimates were increased",
            "The team completed more than planned",
            "Someone closed stories incorrectly",
            "The sprint goal was achieved",
          ],
          correctIndex: 0,
          explanation:
            "Remaining work can only rise if scope is added or re-estimated upwards. That's worth discussing at the stand-up, because it may mean the sprint goal is at risk.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "This is a draft weekly status note a PM wrote for a client steering group on a fixed-price AI chatbot build. Mark the sentences that misread or misuse the metrics.",
        segments: [
          { id: "s1", text: "Sprint 7 closed with 32 points completed, in line with our recent range of 28 to 35.", issue: null },
          { id: "s2", text: "We have used 48% of the hours budget at the 50% date, so the project is on track to finish on time.", issue: "Spend is input, not progress; on-budget says nothing about whether scope will finish on time." },
          { id: "s3", text: "The release burndown has been flat for two sprints, which shows the team has stalled.", issue: "A flat burndown can mean scope was added as fast as work was done; check a burn-up before blaming the team." },
          { id: "s4", text: "Accepted scope on the burn-up rose from 140 to 172 points this sprint.", issue: null },
          { id: "s5", text: "Total release scope also rose from 260 to 285 points after the new analytics requests.", issue: null },
          { id: "s6", text: "Our velocity is 20% higher than the mobile team's, so this team will be used as the benchmark for others.", issue: "Velocity isn't comparable across teams, and making it a target inflates estimates." },
          { id: "s7", text: "At the current range, the remaining 113 points need roughly four more sprints.", issue: null },
          { id: "s8", text: "We will therefore commit to completing in exactly 3.5 sprints.", issue: "A single precise figure contradicts the range above and hides the uncertainty." },
          { id: "s9", text: "The two new analytics requests are logged as change requests for your decision at Thursday's meeting.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pm-a-flow-metrics",
      moduleId: "pm-advanced",
      trackId: "pm",
      title: "Flow Metrics: Cycle Time, Throughput, WIP & CFDs",
      summary:
        "Flow metrics come from Kanban, but they answer questions every delivery team gets asked: how long will this take, and when will it be done? The Kanban Guide names four measures: work in progress (WIP, items started but not finished), throughput (items finished per unit of time), work item age (how long an unfinished item has been in progress) and cycle time (elapsed time from start to finish). Unlike story points they need no estimation, they count real outcomes, and they work just as well for a support retainer or an AI-feature backlog as for a sprint.\n\nLittle's Law ties them together: average cycle time equals average WIP divided by average throughput. The management implication is the heart of Kanban. If you want faster delivery without more people, reduce WIP. A team juggling 20 items with a throughput of 5 a week averages four weeks per item; the same team with 10 items in progress averages two.\n\nCycle times are skewed, not bell-shaped: most items finish quickly and a few take a very long time. So forecast with percentiles (\"85% of items finish within 9 days\"), not averages, and use throughput history with Monte Carlo simulation for multi-item questions such as \"when will these 40 items be done?\".\n\nThe cumulative flow diagram (CFD) shows the count of items in each workflow state over time. Widening bands mean WIP is growing (cycle time will rise); a band that stays flat while the one before it widens marks a bottleneck, typically client UAT or code review at agencies; a flat top line means nothing is finishing.\n\nThe gotcha: Little's Law assumes a reasonably stable system. If WIP keeps rising or items are abandoned, averages mislead. Watch work item age too: an item older than your 85th-percentile cycle time is already at risk and deserves attention in today's stand-up.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "The Kanban Guide (May 2025): flow measures", url: "https://kanbanguides.org/the-kanban-guide/2025.5/", kind: "spec" },
        { label: "Atlassian: Kanban metrics", url: "https://www.atlassian.com/agile/project-management/kanban-metrics", kind: "article" },
        { label: "Atlassian: Cycle time", url: "https://www.atlassian.com/agile/project-management/cycle-time", kind: "article" },
      ],
      video: {
        title: "Cumulative Flow Diagram (CFD) Explained in Two Minutes",
        channel: "Businessmap",
        url: "https://www.youtube.com/watch?v=eo2uv8avEsU",
        videoId: "eo2uv8avEsU",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-a-flow-metrics-q1",
          prompt:
            "A support-retainer team averages 24 items in progress and finishes 8 items a week. Using Little's Law, what is the average cycle time?",
          options: ["3 weeks", "0.33 weeks", "32 weeks", "16 weeks"],
          correctIndex: 0,
          explanation:
            "Cycle time = WIP / throughput = 24 / 8 = 3 weeks. Inverting the ratio gives 0.33, a common slip.",
        },
        {
          id: "pm-a-flow-metrics-q2",
          prompt:
            "The client wants the average turnaround on that retainer cut to about 1.5 weeks without adding people. What does Little's Law suggest?",
          options: [
            "Halve WIP to around 12 items by limiting how much is started at once",
            "Ask the team to work 50% faster",
            "Double the WIP so more is visible to the client",
            "Switch to story points",
          ],
          correctIndex: 0,
          explanation:
            "With throughput steady at 8 per week, cutting WIP to 12 gives 12 / 8 = 1.5 weeks. Asking people to go faster isn't a system change, and more WIP makes cycle time longer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-flow-metrics-q3",
          prompt:
            "In a CFD, the 'In review' band keeps widening while the 'Done' band's slope stays flat. What is happening? (Select all that apply.)",
          options: [
            "Items are accumulating in review, which is a bottleneck",
            "Cycle time for new items will rise",
            "Throughput is not increasing",
            "The team is delivering faster than before",
            "WIP is shrinking",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A widening band means more items are sitting in that state; by Little's Law, cycle time will grow while throughput stays flat. WIP is growing, not shrinking.",
        },
        {
          id: "pm-a-flow-metrics-q4",
          prompt: "Why are percentiles better than averages for cycle-time commitments?",
          options: [
            "Cycle-time distributions are skewed by a long tail, so the average understates the risk on any single item",
            "Averages can't be calculated for Kanban teams",
            "Percentiles are always smaller numbers",
            "Clients don't understand averages",
          ],
          correctIndex: 0,
          explanation:
            "A few long-running items pull the average around and hide the tail. \"85% finish within 9 days\" tells the client the probability they're signing up to.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-flow-metrics-q5",
          prompt:
            "Your 85th-percentile cycle time is 9 days. A ticket for a client's payment integration has been in progress for 12 days. What should happen?",
          options: [
            "Treat it as at risk now: discuss it at stand-up, find the blocker and swarm or split it",
            "Wait until it finishes, then record the cycle time",
            "Restart its clock by moving it back to To Do",
            "Nothing; percentiles allow 15% of items to take longer",
          ],
          correctIndex: 0,
          explanation:
            "Work item age is the leading indicator: an item older than the 85th percentile is already an outlier. Resetting the clock hides the data, and waiting wastes the early warning.",
        },
        {
          id: "pm-a-flow-metrics-q6",
          prompt: "Which are among the flow measures the Kanban Guide asks teams to track? (Select all that apply.)",
          options: ["Work in progress", "Throughput", "Work item age", "Cycle time", "Story points per developer"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Those four are the Kanban Guide's minimum flow measures. Points per developer is an individual output metric that Kanban doesn't use.",
        },
        {
          id: "pm-a-flow-metrics-q7",
          prompt:
            "A client asks when 40 backlog items will be done. Weekly throughput over the past 12 weeks has ranged from 4 to 11. What's the most robust forecasting method?",
          options: [
            "A Monte Carlo simulation sampling past weekly throughput, reported as a date with a confidence level",
            "40 divided by the average throughput, reported as a single date",
            "Estimating each item in hours and adding them up",
            "40 divided by the best week, to show ambition",
          ],
          correctIndex: 0,
          explanation:
            "Sampling historical throughput produces a probability distribution of finish dates using real variability. A single average date hides the spread, and bottom-up hours are slow and usually optimistic.",
        },
        {
          id: "pm-a-flow-metrics-q8",
          prompt:
            "When can Little's Law mislead you?",
          options: [
            "When the system is unstable: WIP growing steadily, or many items abandoned before finishing",
            "When the team uses Scrum rather than Kanban",
            "When items differ in size",
            "When WIP is under 10",
          ],
          correctIndex: 0,
          explanation:
            "The law relies on averages over a reasonably stable period; rising WIP or discarded work breaks that. It holds regardless of framework, and varied item sizes are fine because it uses averages.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-flow-metrics-q9",
          prompt: "In a CFD, what does a top line (arrivals) climbing faster than the bottom line (departures) tell you?",
          options: [
            "More work is arriving than finishing, so the queue and lead times will keep growing",
            "The team is finishing work faster than it arrives",
            "Cycle time is falling",
            "The board has too many columns",
          ],
          correctIndex: 0,
          explanation:
            "The gap between arrivals and departures is total WIP; if it widens, wait times grow. That's a demand-versus-capacity conversation, not a board design issue.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "A team maintaining a client's AI support platform has an average WIP of 18 items and an average throughput of 6 items a week. The cycle times (in days) of the last 10 finished items were: 2, 3, 3, 4, 4, 5, 6, 8, 11, 14. Calculate the values below. Use the nearest-rank method for the percentile (rank = ceiling(0.85 x n)).",
        table: {
          columns: ["Measure", "Value"],
          rows: [
            ["Average WIP", "18 items"],
            ["Average throughput", "6 items per week"],
            ["Last 10 cycle times (days)", "2, 3, 3, 4, 4, 5, 6, 8, 11, 14"],
          ],
        },
        fields: [
          { id: "littles", label: "Average cycle time from Little's Law", unit: "weeks", answer: 3, tolerance: 0.01 },
          { id: "mean", label: "Mean of the 10 cycle times", unit: "days", answer: 6, tolerance: 0.05 },
          { id: "median", label: "Median of the 10 cycle times", unit: "days", answer: 4.5, tolerance: 0.05 },
          { id: "p85", label: "85th-percentile cycle time", unit: "days", answer: 11, tolerance: 0.01 },
        ],
        explanation:
          "Little's Law: 18 / 6 = 3 weeks. The mean is 60 / 10 = 6 days, but the median is (4 + 5) / 2 = 4.5 days: the long tail pulls the mean up. Nearest rank: ceiling(0.85 x 10) = 9, so the 9th value, 11 days, is the 85th percentile. Commit to clients with that figure, not with the mean.",
      },
    },
    {
      id: "pm-a-evm-fundamentals",
      moduleId: "pm-advanced",
      trackId: "pm",
      title: "Earned Value: PV, EV, AC, CPI & SPI",
      summary:
        "Earned value management (EVM) exists because spend alone and schedule alone both lie. A project that has spent half its budget at the halfway date looks healthy until you ask how much of the work is actually done. EVM puts three numbers on the same money scale: planned value (PV, the budgeted cost of the work scheduled to be done by now), earned value (EV, the budgeted cost of the work actually done) and actual cost (AC, what that work really cost). From those you get cost variance (CV = EV - AC), schedule variance (SV = EV - PV), the cost performance index (CPI = EV / AC) and the schedule performance index (SPI = EV / PV). Below 1.0 is bad for both indices.\n\nFor an agency this is the language finance directors, enterprise procurement and PMP examiners all speak, and it is the most compact way to show a fixed-price build is eroding margin. It adapts to agile delivery: treat the release's budget at completion (BAC) as covering the planned story points, set EV as the share of accepted points multiplied by BAC, and PV from the planned burn-up.\n\nThe weaknesses are as important as the formulas. EV is only as honest as your definition of done: crediting 80% complete for unfinished stories, or counting work that is built but not accepted, inflates EV and hides trouble (use 0/100 or 50/50 rules for small items). SPI measures schedule in money, not time, and drifts back towards 1.0 at the end of every project, because once everything is done EV equals PV, even if the project finished months late; earned schedule is the fix when timing matters. And the indices say nothing about quality or value: a project can have a CPI of 1.05 while building something the client does not want.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "PMI: PMBOK Guide 8th edition", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
        { label: "PMI blog: Earned Value Management - reading the numbers", url: "https://www.pmi.org/blog/earned-value-management", kind: "article" },
        { label: "PMI library: How to make earned value work on your project", url: "https://www.pmi.org/learning/library/make-earned-value-work-project-6001", kind: "article" },
        { label: "ProjectManager: Cost Performance Index (CPI)", url: "https://www.projectmanager.com/blog/cost-performance-index", kind: "article" },
      ],
      video: {
        title: "What is Earned Value Management? | EVM | CV, SV, CPI, SPI, EAC, ETC, TCPI, VAC | PMP Exam",
        channel: "Sunny Sensei",
        url: "https://www.youtube.com/watch?v=7qGUyTfjWCw",
        videoId: "7qGUyTfjWCw",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-a-evm-fundamentals-q1",
          prompt: "PV = $100,000, EV = $90,000, AC = $120,000. Which statement is correct?",
          options: [
            "Behind schedule and over budget: SPI = 0.90, CPI = 0.75",
            "Ahead of schedule and over budget: SPI = 1.11, CPI = 0.75",
            "Behind schedule and under budget: SPI = 0.90, CPI = 1.33",
            "On schedule and over budget: SPI = 1.00, CPI = 0.83",
          ],
          correctIndex: 0,
          explanation:
            "SPI = EV / PV = 0.90 and CPI = EV / AC = 0.75, both below 1. Swapping numerator and denominator (PV / EV = 1.11) is the usual mistake.",
        },
        {
          id: "pm-a-evm-fundamentals-q2",
          prompt: "Using the same numbers (PV $100k, EV $90k, AC $120k), what are CV and SV?",
          options: [
            "CV = -$30,000, SV = -$10,000",
            "CV = -$20,000, SV = -$10,000",
            "CV = $30,000, SV = $10,000",
            "CV = -$10,000, SV = -$30,000",
          ],
          correctIndex: 0,
          explanation:
            "CV = EV - AC = 90k - 120k = -30k; SV = EV - PV = 90k - 100k = -10k. Both variances always start from EV.",
        },
        {
          id: "pm-a-evm-fundamentals-q3",
          prompt:
            "A release has a BAC of $200,000 for 400 story points. By the end of sprint 4, 140 points are accepted, the plan expected 160 points, and $80,000 has been spent. What is the CPI?",
          options: ["0.875", "1.14", "0.70", "0.80"],
          correctIndex: 0,
          explanation:
            "EV = 140 / 400 x 200k = 70k, so CPI = 70k / 80k = 0.875. Using the planned points (PV = 80k) instead of EV gives 1.0 and isn't a CPI.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-evm-fundamentals-q4",
          prompt: "In the same release, what is the SPI?",
          options: ["0.875", "1.14", "0.70", "1.00"],
          correctIndex: 0,
          explanation:
            "PV = 160 / 400 x 200k = 80k; SPI = 70k / 80k = 0.875. It happens to equal the CPI here because AC equals PV; that's a coincidence, not a rule.",
        },
        {
          id: "pm-a-evm-fundamentals-q5",
          prompt:
            "A project finished three months late. At completion, its SPI is reported as 1.0. Why?",
          options: [
            "At completion EV equals PV (both equal BAC), so SPI always returns to 1.0 regardless of lateness",
            "The project caught up on schedule in the final month",
            "SPI was calculated incorrectly",
            "Late projects are excluded from SPI",
          ],
          correctIndex: 0,
          explanation:
            "SPI compares money values, and when everything is done EV = PV = BAC. That's why SPI loses meaning late in a project; earned schedule measures schedule performance in time instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-evm-fundamentals-q6",
          prompt:
            "Which practices inflate EV and hide trouble? (Select all that apply.)",
          options: [
            "Crediting partially finished stories at the developer's estimate of percent complete",
            "Counting stories that are built but not yet accepted by the client",
            "Re-basing the plan every month so PV always matches EV",
            "Using a 0/100 rule for items smaller than a sprint",
            "Measuring EV from accepted story points",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Subjective percent-complete, unaccepted work and constant re-baselining all make EV or SPI look better than reality. The 0/100 rule and accepted points are conservative, honest choices.",
        },
        {
          id: "pm-a-evm-fundamentals-q7",
          prompt: "A project has CPI = 1.10 and SPI = 0.80. What is the most likely story?",
          options: [
            "Work is costing less than planned for what's done, but less work is done than scheduled, often because of under-staffing or a blocker",
            "The project is over budget and ahead of schedule",
            "The project is healthy overall",
            "The project is over budget and behind schedule",
          ],
          correctIndex: 0,
          explanation:
            "CPI above 1 means efficient spending on completed work; SPI below 1 means behind plan. A common cause is fewer people than planned: less spent, less done. Averaging the two into healthy hides the schedule problem.",
        },
        {
          id: "pm-a-evm-fundamentals-q8",
          prompt: "What doesn't EVM tell you on a client project?",
          options: [
            "Whether the delivered features create value for the client or are of good quality",
            "Whether completed work cost more than budgeted",
            "Whether less work is done than planned",
            "How much it may cost to finish at the current efficiency",
          ],
          correctIndex: 0,
          explanation:
            "EVM measures cost and schedule performance against plan, including forecasts. Value and quality need separate measures such as acceptance, defects and outcome metrics.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-evm-fundamentals-q9",
          prompt: "What does a CPI of 0.80 mean in plain language for a client sponsor?",
          options: [
            "For every dollar spent, we're getting 80 cents of planned work done",
            "We are 80% complete",
            "We have spent 80% of the budget",
            "We are 20% behind schedule",
          ],
          correctIndex: 0,
          explanation:
            "CPI is cost efficiency: EV per unit of AC. It doesn't measure completion, budget consumed or schedule; those need EV / BAC, AC / BAC and SPI respectively.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "A fixed-price AI analytics dashboard build has a budget at completion (BAC) of $240,000. At the end of week 10 of a 20-week plan, use the status data below to calculate the earned-value measures. Round CPI and SPI to two decimal places; for EAC use the typical formula EAC = BAC / CPI.",
        table: {
          columns: ["Measure", "Value"],
          rows: [
            ["Budget at completion (BAC)", "$240,000"],
            ["Planned value (PV) at week 10", "$120,000"],
            ["Earned value (EV) at week 10", "$96,000"],
            ["Actual cost (AC) at week 10", "$112,000"],
          ],
        },
        fields: [
          { id: "cv", label: "Cost variance (CV)", unit: "$", answer: -16000, tolerance: 1 },
          { id: "sv", label: "Schedule variance (SV)", unit: "$", answer: -24000, tolerance: 1 },
          { id: "cpi", label: "Cost performance index (CPI)", unit: "", answer: 0.86, tolerance: 0.01 },
          { id: "spi", label: "Schedule performance index (SPI)", unit: "", answer: 0.8, tolerance: 0.01 },
          { id: "eac", label: "Estimate at completion (EAC = BAC / CPI)", unit: "$", answer: 280000, tolerance: 1500 },
        ],
        explanation:
          "CV = 96k - 112k = -16k. SV = 96k - 120k = -24k. CPI = 96 / 112 = 0.857 (0.86). SPI = 96 / 120 = 0.80. EAC = 240k / 0.857 = $280,000 (about $279,000 if you use the rounded 0.86). On a fixed bid, that $40k overrun comes straight out of Oyelabs' margin unless scope or approach changes.",
      },
    },
    {
      id: "pm-a-evm-forecasting",
      moduleId: "pm-advanced",
      trackId: "pm",
      title: "Forecasting with EVM: EAC, ETC, VAC & TCPI",
      summary:
        "Variances describe the past; sponsors want to know the future. EVM's forecasting formulas turn today's performance into a finish cost, and the hard part is not the arithmetic but choosing which formula tells the truth.\n\nThe estimate at completion (EAC) comes in three common forms. EAC = BAC / CPI assumes current cost efficiency continues; it is the default when the overrun comes from something systemic, such as underestimated integration complexity across the whole build. EAC = AC + (BAC - EV) assumes the variance was a one-off and remaining work will go to plan, which is appropriate only if the cause is genuinely gone (a vendor's breaking API change that has now been absorbed, say). EAC = AC + (BAC - EV) / (CPI x SPI) assumes both cost and schedule pressure persist, typical when a fixed date forces overtime or extra people. A fourth option is a bottom-up re-estimate of remaining work when the original plan is no longer credible. From EAC come the estimate to complete (ETC = EAC - AC) and the variance at completion (VAC = BAC - EAC).\n\nThe to-complete performance index (TCPI = (BAC - EV) / (BAC - AC)) answers the question sponsors always ask: what efficiency would we need from here to land on the original budget? Research on large projects found that cumulative CPI rarely improves much after the first fifth of a project, so a TCPI well above the current CPI (1.2 against 0.85, for example) is a signal to change scope or budget, not a target to hand the team.\n\nThe agency gotcha is optimism bias in formula choice. Picking the one-off formula because it gives the smallest number, then discovering the problem was systemic, is how a fixed-price project goes from a small overrun to a large loss in a single month. State the assumption behind every EAC you report, and show the range across formulas when the cause is uncertain.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "PMI: PMBOK Guide 8th edition", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
        { label: "PMI blog: Earned Value Management - reading the numbers", url: "https://www.pmi.org/blog/earned-value-management", kind: "article" },
        { label: "ProjectManager: Schedule Performance Index (SPI)", url: "https://www.projectmanager.com/blog/schedule-performance-index-spi", kind: "article" },
        { label: "Atlassian: How to calculate CPI", url: "https://www.atlassian.com/work-management/project-management/cost-performance-index", kind: "article" },
      ],
      video: {
        title: "PMP Exam, Earned Value Management Full Course Part 6 - Best EVM course to Passing All EMV Questions",
        channel: "Andrew Ramdayal",
        url: "https://www.youtube.com/watch?v=iKEIxsNW2Og",
        videoId: "iKEIxsNW2Og",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-a-evm-forecasting-q1",
          prompt:
            "BAC = $500,000, EV = $200,000, AC = $250,000. The overrun comes from integration work being harder than estimated across the whole platform. What is the EAC?",
          options: ["$625,000", "$550,000", "$400,000", "$450,000"],
          correctIndex: 0,
          explanation:
            "A systemic cause means current efficiency continues: CPI = 0.8, EAC = 500k / 0.8 = 625k. $550k is the one-off formula, which doesn't fit a systemic cause.",
        },
        {
          id: "pm-a-evm-forecasting-q2",
          prompt:
            "Same numbers, but the overrun was caused by a one-time model-provider API change that has now been fully absorbed. Which EAC is most appropriate?",
          options: [
            "$550,000, from AC + (BAC - EV)",
            "$625,000, from BAC / CPI",
            "$500,000, because the problem is fixed",
            "$300,000, from BAC - EV",
          ],
          correctIndex: 0,
          explanation:
            "If remaining work will go to plan, EAC = 250k + (500k - 200k) = 550k. The money already lost doesn't come back, so the BAC itself is no longer achievable, and BAC - EV is the remaining budgeted work, not a forecast.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-evm-forecasting-q3",
          prompt: "Using BAC = $500k, EV = $200k, AC = $250k, what TCPI is needed to finish on the original budget?",
          options: ["1.20", "0.83", "0.80", "1.25"],
          correctIndex: 0,
          explanation:
            "TCPI = (BAC - EV) / (BAC - AC) = 300k / 250k = 1.20. The team would have to be 50% more efficient than its current 0.80 for the rest of the project.",
        },
        {
          id: "pm-a-evm-forecasting-q4",
          prompt:
            "Current CPI is 0.80 and the TCPI to meet BAC is 1.20. What is the right response for the PM?",
          options: [
            "Treat BAC as unlikely, and take options to the sponsor: reduce scope, approve a revised budget, or change the approach",
            "Set 1.20 as the team's efficiency target for the remaining work",
            "Keep reporting BAC as the forecast until the gap closes",
            "Stop reporting EVM, since it's no longer helpful",
          ],
          correctIndex: 0,
          explanation:
            "A big jump from 0.80 to 1.20 is rarely achieved; cumulative CPI tends to stabilise early. Handing the team an impossible target or reporting a known-wrong forecast erodes trust.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-evm-forecasting-q5",
          prompt: "With an EAC of $625,000 and AC of $250,000 against a BAC of $500,000, what are ETC and VAC?",
          options: [
            "ETC = $375,000; VAC = -$125,000",
            "ETC = $300,000; VAC = -$125,000",
            "ETC = $375,000; VAC = $125,000",
            "ETC = $250,000; VAC = -$75,000",
          ],
          correctIndex: 0,
          explanation:
            "ETC = EAC - AC = 375k; VAC = BAC - EAC = -125k, a forecast overrun. A negative VAC is bad, matching the sign convention for CV and SV.",
        },
        {
          id: "pm-a-evm-forecasting-q6",
          prompt:
            "When is EAC = AC + (BAC - EV) / (CPI x SPI) the most realistic choice?",
          options: [
            "When both cost and schedule pressure will persist, for example a fixed launch date forcing extra people or overtime",
            "When the overrun was a one-time event",
            "When the project is ahead of schedule",
            "When the original estimate is no longer credible and needs replacing",
          ],
          correctIndex: 0,
          explanation:
            "Combining CPI and SPI models catching up on schedule at a cost. A one-off cause uses AC + (BAC - EV), and a broken plan calls for a bottom-up re-estimate.",
        },
        {
          id: "pm-a-evm-forecasting-q7",
          prompt: "Which are good reasons to replace formula-based EAC with a bottom-up re-estimate? (Select all that apply.)",
          options: [
            "Discovery revealed the client's legacy data needs a migration that was never in the plan",
            "The architecture has been changed and the original WBS no longer describes the work",
            "The project is so early that the CPI is based on a tiny sample",
            "The bottom-up figure will be lower than the formula forecast",
            "The sponsor dislikes the formula result",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Re-estimate when the plan no longer reflects the work or the indices aren't yet meaningful. Choosing a method because it gives a nicer number is exactly the optimism bias that sinks fixed bids.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-evm-forecasting-q8",
          prompt: "Which TCPI formula applies when the sponsor has already approved a revised EAC as the new target?",
          options: ["(BAC - EV) / (EAC - AC)", "(BAC - EV) / (BAC - AC)", "EV / AC", "BAC / EAC"],
          correctIndex: 0,
          explanation:
            "Once a new target is agreed, remaining work is measured against remaining funds under that target, EAC - AC. The BAC version applies only while the original budget is still the goal.",
        },
        {
          id: "pm-a-evm-forecasting-q9",
          prompt: "How should a PM report an EAC to a client steering group when the cause of overrun is still being investigated?",
          options: [
            "As a range across the plausible formulas, with the assumption behind each and when the range will narrow",
            "Only the lowest result, to avoid alarming the client",
            "Only the highest result, to be safe",
            "Not at all until the investigation is complete",
          ],
          correctIndex: 0,
          explanation:
            "A range with explicit assumptions is honest and decision-useful. Cherry-picking either end distorts decisions, and silence leaves the steering group managing blind.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "Oyelabs is halfway through a $400,000 fixed-price build of a white-label loyalty app with an AI recommendations engine. Status: EV = $160,000, AC = $200,000 (CPI = 0.80). Investigation shows most of the overrun came from three weeks of rework when the client's recommendation-data vendor changed its export format; that is now fixed and the new format is stable. The rest of the plan has tracked to estimate.",
        steps: [
          {
            id: "s1",
            question: "Which EAC do you put in this month's report?",
            options: [
              "$440,000: AC + (BAC - EV), because the cause was a one-off and is resolved",
              "$500,000: BAC / CPI, because CPI is the standard formula",
              "$400,000: the BAC, because the problem is fixed",
              "$240,000: BAC - EV",
            ],
            correctIndex: 0,
            explanation:
              "With an isolated, resolved cause, remaining work should go to plan: 200k + (400k - 160k) = 440k. BAC / CPI would wrongly project the one-off forward, and the BAC ignores money already lost.",
          },
          {
            id: "s2",
            question:
              "The managing director asks whether you can still deliver for $400,000. TCPI to BAC = (400 - 160) / (400 - 200) = 1.20. What do you tell him?",
            options: [
              "Unlikely without a scope change: the team would need 20% better efficiency than plan for the rest of the build; propose options to recover the margin instead",
              "Yes, if the team works harder",
              "Yes, because the cause is fixed and CPI will return to 1.0",
              "No, and nothing can be done",
            ],
            correctIndex: 0,
            explanation:
              "Returning to plan efficiency (1.0) only stops further loss; recovering the $40k already lost needs 1.20, which is rarely sustained. Real options include scope trades or a claim, not exhortation.",
          },
          {
            id: "s3",
            question:
              "The rework was caused by the client's own vendor changing a format the SOW listed as a client-supplied dependency. What is the best commercial step?",
            options: [
              "Document the impact against the SOW's dependency clause and raise a change request for the rework cost with the client sponsor",
              "Absorb it silently to protect the relationship",
              "Stop work until the client pays",
              "Invoice the client's data vendor directly",
            ],
            correctIndex: 0,
            explanation:
              "A client-side dependency failure is what dependency and change clauses exist for. Raising it promptly and with evidence is professional; silent absorption sets a precedent, and stopping work or billing a third party escalates needlessly.",
          },
        ],
      },
    },
    {
      id: "pm-a-contract-types",
      moduleId: "pm-advanced",
      trackId: "pm",
      title: "Contract Types & Commercial Risk: Fixed Bid, T&M, Cost-Plus, Retainer",
      summary:
        "Every contract type is a decision about who carries the risk that the estimate is wrong. Under a firm fixed price, the seller (Oyelabs) carries it: overruns come out of margin, so the agency needs a precise scope and builds contingency into the price. Under time and materials (T&M), the buyer carries it: they pay for hours used, so they need visibility and usually a not-to-exceed cap. Cost-reimbursable contracts (cost plus fixed fee, cost plus incentive fee, cost plus award fee) also put most risk on the buyer and appear mainly in large enterprise and public-sector procurement; PMP questions use them heavily. Fixed price with incentive fee and fixed price with economic price adjustment sit between the extremes. Retainers buy a block of capacity per month, which suits ongoing product work and support after launch.\n\nFor AI-powered platforms the uncertainty is unusually lopsided. Standard CRUD screens estimate well; LLM features (accuracy targets, latency budgets, guardrails, model-cost ceilings) do not. A common, sound structure is fixed price for a discovery phase, then fixed price or capped T&M for well-understood build work, with AI-quality work on T&M or a retainer and acceptance tied to agreed evaluation criteria rather than \"the AI works\".\n\nFixed bids are not inherently more profitable or riskier; they are more variable. A team that estimates well and controls change can earn a higher margin than on T&M; a team that underestimates loses it all. Know the break-even: the effort at which the fixed price exactly covers internal cost.\n\nGotchas: a T&M contract with a hard cap is a fixed price without the scope control; a retainer with unused hours rolling over indefinitely becomes a liability on your books; and a fixed bid with a vague \"AI-powered recommendations\" line is an open-ended promise. This topic covers the commercial mechanics, not legal drafting; contracts need legal review in each jurisdiction.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PMI: PMBOK Guide 8th edition", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
        { label: "ProjectManager: Procurement contracting - contract types", url: "https://www.projectmanager.com/blog/procurement-contracting", kind: "article" },
        { label: "ProjectManager: Fixed-price contract", url: "https://www.projectmanager.com/blog/fixed-price-contract", kind: "article" },
        { label: "Productive.io: What is a retainer in business?", url: "https://productive.io/blog/what-is-a-retainer-in-business/", kind: "article" },
      ],
      video: {
        title: "TYPES OF CONTRACTS IN PROCUREMENT and Project Management | PMP Exam Prep | Contract Management",
        channel: "PMPwithRay",
        url: "https://www.youtube.com/watch?v=AIXiMzAXtdw",
        videoId: "AIXiMzAXtdw",
      },
      alternateVideos: [
        {
          title: "Fixed-Price Contracts VS Time-and-Materials for Your Software Development Project",
          channel: "Matt Brickwood",
          url: "https://www.youtube.com/watch?v=PyobLk8aGu0",
          videoId: "PyobLk8aGu0",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-a-contract-types-q1",
          prompt: "Which contract type puts the most cost risk on the seller?",
          options: ["Firm fixed price", "Time and materials", "Cost plus fixed fee", "Cost plus award fee"],
          correctIndex: 0,
          explanation:
            "Under a firm fixed price, the seller pays for any overrun. T&M and cost-reimbursable contracts pass most cost risk to the buyer.",
        },
        {
          id: "pm-a-contract-types-q2",
          prompt:
            "A fintech client wants an AI fraud-explanation feature but can't define acceptable accuracy until they see it on their data. Which structure is most appropriate?",
          options: [
            "A fixed-price discovery and prototype phase, then T&M or a retainer for the AI work, with acceptance based on agreed evaluation criteria",
            "A single firm fixed price for the whole feature with acceptance at \"the AI works\"",
            "Cost plus award fee, because it's a regulated industry",
            "No contract until accuracy is known",
          ],
          correctIndex: 0,
          explanation:
            "Fixing price on undefined quality is gambling. A bounded discovery phase reduces uncertainty, then flexible commercials suit the iterative work; vague acceptance criteria invite disputes.",
        },
        {
          id: "pm-a-contract-types-q3",
          prompt:
            "A fixed bid is $120,000. Internal blended cost is $75 per hour. What is the break-even effort?",
          options: ["1,600 hours", "1,200 hours", "900 hours", "2,000 hours"],
          correctIndex: 0,
          explanation:
            "120,000 / 75 = 1,600 hours. Above that, every hour is a loss; knowing this number turns an estimate into a commercial risk statement.",
        },
        {
          id: "pm-a-contract-types-q4",
          prompt:
            "Which statements about T&M contracts are true for an agency? (Select all that apply.)",
          options: [
            "The client carries most of the estimating risk",
            "Clients usually want a not-to-exceed cap and regular visibility of hours",
            "A hard cap with fixed scope effectively turns it into a fixed price without fixed-price scope control",
            "The agency's margin is guaranteed even if utilisation drops",
            "Change requests are never needed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "T&M shifts estimate risk to the buyer, who compensates with caps and visibility; a capped T&M with fixed scope is the worst of both worlds for the seller. Margin still depends on utilisation, and scope changes still need agreeing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-contract-types-q5",
          prompt:
            "On a PMP-style question, a buyer has a well-defined scope and wants to motivate the seller to finish early and under cost. Which contract type fits best?",
          options: ["Fixed price incentive fee", "Time and materials", "Cost plus fixed fee", "Fixed price with economic price adjustment"],
          correctIndex: 0,
          explanation:
            "FPIF rewards performance against targets on a defined scope. T&M and CPFF give no cost incentive; FP-EPA handles inflation or currency over long contracts.",
        },
        {
          id: "pm-a-contract-types-q6",
          prompt:
            "A client has a retainer of 120 hours a month. For six months they've used about 60, and the unused hours roll over without limit. What is the risk?",
          options: [
            "A growing liability: the client can later call on hundreds of banked hours at short notice, which the agency may not be able to staff",
            "None: unused hours are pure profit",
            "The client will cancel immediately",
            "The retainer becomes a fixed-price contract",
          ],
          correctIndex: 0,
          explanation:
            "Unlimited rollover creates an unpredictable staffing obligation. Healthy retainers cap or expire rollover and review the size of the retainer when usage is consistently low.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-contract-types-q7",
          prompt: "Which contract type gives the buyer the least certainty about the final cost?",
          options: ["Cost plus fixed fee", "Firm fixed price", "Fixed price incentive fee", "Fixed price with economic price adjustment"],
          correctIndex: 0,
          explanation:
            "Cost-reimbursable contracts pay actual costs plus a fee, so the final figure is open. The fixed-price family caps or largely fixes the buyer's cost.",
        },
        {
          id: "pm-a-contract-types-q8",
          prompt: "Why can a well-run fixed-price project earn a better margin than the same work on T&M?",
          options: [
            "The price includes contingency and value, so if the team delivers efficiently and controls change, the agency keeps the difference",
            "Fixed-price clients always pay more per hour",
            "Fixed-price work requires no QA",
            "T&M forbids profit",
          ],
          correctIndex: 0,
          explanation:
            "The seller is paid for the outcome, not hours, so efficiency becomes margin. The same mechanism makes losses possible when estimates are wrong.",
        },
        {
          id: "pm-a-contract-types-q9",
          prompt: "A proposal line reads: \"AI-powered personalised recommendations\" in a fixed-price build. What is the main commercial problem?",
          options: [
            "It's an open-ended promise with no measurable acceptance criteria, so the agency can't show it's done",
            "It's too short",
            "Recommendations can't be built with AI",
            "Fixed price never allows AI features",
          ],
          correctIndex: 0,
          explanation:
            "Without defined inputs, quality thresholds and evaluation method, the client can always say it isn't good enough. Specify the data, metric and threshold, or move the item to flexible commercials.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "A client offers two options for a six-month engagement on its AI-powered booking platform. Option A: a fixed bid of $96,000 for scope Oyelabs estimates at 800 hours. History shows Oyelabs' actual effort on similar AI work runs 25% above estimate. Option B: a retainer of $18,000 a month for 6 months covering up to 140 hours a month, which the client expects to use in full. Internal blended cost is $70 per hour. Compare the two.",
        table: {
          columns: ["Item", "Option A: fixed bid", "Option B: retainer"],
          rows: [
            ["Revenue", "$96,000", "$18,000 x 6 months"],
            ["Effort", "800 h estimate, +25% expected", "140 h x 6 months"],
            ["Internal cost per hour", "$70", "$70"],
          ],
        },
        fields: [
          { id: "a_cost", label: "Option A expected internal cost (with the 25% overrun)", unit: "$", answer: 70000, tolerance: 1 },
          { id: "a_margin_pct", label: "Option A expected margin as a % of revenue", unit: "%", answer: 27.1, tolerance: 0.2 },
          { id: "b_margin", label: "Option B margin", unit: "$", answer: 49200, tolerance: 1 },
          { id: "a_breakeven", label: "Option A break-even effort", unit: "h", answer: 1371.4, tolerance: 1 },
        ],
        explanation:
          "A: 800 x 1.25 = 1,000 h x $70 = $70,000 cost, margin $26,000 = 27.1% of $96,000. B: revenue $108,000, cost 840 h x $70 = $58,800, margin $49,200 (45.6%). A breaks even at 96,000 / 70 = 1,371 h, i.e. 71% over estimate. The retainer earns more and carries less estimate risk, though it depends on the client keeping it going.",
      },
    },
    {
      id: "pm-a-sow-management",
      moduleId: "pm-advanced",
      trackId: "pm",
      title: "Statements of Work & Contract Management",
      summary:
        "A statement of work (SOW) is where a sales promise becomes a delivery obligation. Usually it sits under a master services agreement (MSA): the MSA carries the legal terms (liability, IP, confidentiality, payment terms, governing law) and each SOW defines one engagement's scope, deliverables, milestones, acceptance, assumptions, dependencies, roles, commercial model and change process. When a project goes wrong, the SOW is the document everyone re-reads, so a PM should help write it, not just inherit it.\n\nThe parts that decide disputes are the unglamorous ones. Acceptance criteria should be testable and time-boxed (\"the client has 10 business days to accept or list defects against the agreed criteria; silence counts as acceptance\"). Assumptions and client dependencies (content, API credentials, test data, timely decisions, third-party accounts) need owners and dates, because they are what you will point to when the client's delay pushes the schedule. Out-of-scope lists prevent the most predictable arguments. For AI features, specify the evaluation set, metric and threshold, who supplies the data, and the model-provider costs and who pays them.\n\nContract management is the ongoing part: tracking obligations on both sides, running the change-control process the SOW defines, recording decisions in writing, managing milestone invoicing, and keeping a variance log against assumptions. Small undocumented favours are how scope creep becomes contractual: if the team quietly builds three extra integrations, the client reasonably believes they are included.\n\nGotchas: \"including but not limited to\" in a scope clause makes scope unbounded; \"best efforts\" commits to more than most PMs think in some jurisdictions; and an SOW that conflicts with the MSA is resolved by whichever document the order-of-precedence clause names. This is delivery guidance, not legal advice; Oyelabs' contracts need review by qualified counsel, and the law differs by jurisdiction.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PMI library: Statement of Work - delivering successful service projects", url: "https://www.pmi.org/learning/library/statement-work-delivering-successful-service-projects-4761", kind: "docs" },
        { label: "PMI library: Higher-quality SOWs for outsourced software projects", url: "https://www.pmi.org/learning/library/framework-delivering-higher-quality-statements-work-6012", kind: "article" },
        { label: "Atlassian: What is a statement of work", url: "https://www.atlassian.com/work-management/knowledge-sharing/documentation/what-is-statement-of-work", kind: "article" },
        { label: "ProjectManager: What is a statement of work", url: "https://www.projectmanager.com/blog/statement-work-definition-examples", kind: "article" },
      ],
      video: {
        title: "What is a Statement of Work (SOW)? And what are the different types?",
        channel: "Online PM Courses - Mike Clayton",
        url: "https://www.youtube.com/watch?v=1picY6dlLOc",
        videoId: "1picY6dlLOc",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-a-sow-management-q1",
          prompt: "Which belong in a SOW rather than the MSA? (Select all that apply.)",
          options: [
            "Deliverables and acceptance criteria for this engagement",
            "Client dependencies with owners and dates",
            "The milestone payment schedule for this project",
            "Limitation of liability across all engagements",
            "Governing law",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "SOWs define one engagement's scope, dependencies and commercials. Liability caps and governing law are relationship-wide legal terms normally kept in the MSA.",
        },
        {
          id: "pm-a-sow-management-q2",
          prompt:
            "The SOW says: \"Client will review deliverables promptly.\" UAT has now waited five weeks for client feedback. What would have protected the schedule?",
          options: [
            "A time-boxed review window (for example 10 business days) with a deemed-acceptance rule and a stated schedule impact of delays",
            "A longer UAT phase",
            "A clause requiring Oyelabs to chase weekly",
            "Nothing; client delays can't be addressed contractually",
          ],
          correctIndex: 0,
          explanation:
            "\"Promptly\" is unenforceable. A defined window plus deemed acceptance and an explicit dependency-delay mechanism make the consequence of client delay clear in advance.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-sow-management-q3",
          prompt: "Why is \"including but not limited to\" dangerous in the scope section of a fixed-price SOW?",
          options: [
            "It makes the scope open-ended, so the client can argue that anything similar is included",
            "It is illegal wording",
            "It limits scope too tightly",
            "It only applies to T&M contracts",
          ],
          correctIndex: 0,
          explanation:
            "Scope should be an exhaustive list with explicit exclusions. Open-ended language moves the estimating risk entirely onto the fixed-price seller.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-sow-management-q4",
          prompt: "Which acceptance criterion for an AI document-summarisation feature is best?",
          options: [
            "On the agreed 200-document evaluation set supplied by the client, at least 90% of summaries are rated accurate by the client's reviewer using the agreed rubric",
            "Summaries are accurate and helpful",
            "The AI works to the client's satisfaction",
            "Uses the latest available model",
          ],
          correctIndex: 0,
          explanation:
            "It names the data, the metric, the threshold and the judge. The others are subjective or describe implementation rather than outcome.",
        },
        {
          id: "pm-a-sow-management-q5",
          prompt:
            "A developer has been quietly building small extra features the client asks for on calls. What is the contractual risk?",
          options: [
            "A pattern of undocumented additions can be read as accepted scope, so the client reasonably expects more of it at no cost",
            "None, because they're small",
            "The client must pay for them automatically",
            "The SOW becomes void",
          ],
          correctIndex: 0,
          explanation:
            "Course of dealing shapes expectations. Small changes may be fine, but each needs logging and a deliberate decision; automatic payment and voiding are not how it works.",
        },
        {
          id: "pm-a-sow-management-q6",
          prompt: "The SOW and the MSA disagree about payment terms. Which applies?",
          options: [
            "Whichever the order-of-precedence clause says, which is why that clause matters",
            "Always the SOW, because it's newer",
            "Always the MSA, because it's the master",
            "Neither; the contract is void",
          ],
          correctIndex: 0,
          explanation:
            "Order of precedence is defined by the contract itself, and it varies. Check it and escalate conflicts to whoever owns contracts, with legal review.",
        },
        {
          id: "pm-a-sow-management-q7",
          prompt:
            "Which items should an SOW for an AI-powered platform specify that a standard web-app SOW often omits? (Select all that apply.)",
          options: [
            "Who pays ongoing model-provider and inference costs, and any cap",
            "Who supplies training or evaluation data, and in what form",
            "How AI output quality is evaluated and accepted",
            "The colour of the login button",
            "The team's sprint length",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Usage-based model costs, data supply and evaluation criteria are the AI-specific sources of dispute. Button colours and sprint length are delivery detail, not contract terms.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-sow-management-q8",
          prompt: "What is the purpose of the assumptions section in an SOW?",
          options: [
            "To record the conditions the price and timeline depend on, so a change in them justifies a change request",
            "To list the team's personal working preferences",
            "To replace acceptance criteria",
            "To describe the technology stack only",
          ],
          correctIndex: 0,
          explanation:
            "Assumptions make the estimate's basis explicit; when one proves false, the change process applies. They don't replace acceptance or describe the team.",
        },
        {
          id: "pm-a-sow-management-q9",
          prompt: "Which is the PM's main contract-management responsibility once the project is running?",
          options: [
            "Track obligations on both sides, run the change process, record decisions in writing and keep invoicing aligned to milestones",
            "Rewrite the contract whenever the plan changes",
            "Leave contracts entirely to the sales team",
            "Negotiate the liability cap",
          ],
          correctIndex: 0,
          explanation:
            "The PM administers the contract day to day. Rewriting it unilaterally isn't possible, and legal terms like liability are for leadership and counsel.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Below is a draft SOW excerpt for a fixed-price white-label food-delivery app with an AI menu-recommendation feature. Mark the clauses that create delivery or commercial risk for Oyelabs. (Practice only, not legal advice.)",
        segments: [
          { id: "c1", text: "Oyelabs will deliver iOS and Android customer apps, a restaurant web portal and an admin dashboard, as listed in Appendix A.", issue: null },
          { id: "c2", text: "Scope includes, but is not limited to, the features in Appendix A and any reasonably related functionality.", issue: "Open-ended scope on a fixed price: anything 'related' can be claimed as included." },
          { id: "c3", text: "The AI recommendation engine will deliver highly relevant suggestions to every user.", issue: "No data, metric, threshold or evaluation method; acceptance is unprovable." },
          { id: "c4", text: "Client will supply menu data in the CSV format in Appendix C by 15 March; delays move dependent milestones day for day.", issue: null },
          { id: "c5", text: "Client will review each milestone deliverable within 10 business days; deliverables not rejected with specific defects in that window are deemed accepted.", issue: null },
          { id: "c6", text: "All third-party costs, including LLM API usage, are included in the fixed price for the lifetime of the platform.", issue: "Unbounded usage-based cost carried by Oyelabs forever; costs must be capped, time-limited or passed through." },
          { id: "c7", text: "Changes to scope will be handled through the change request process in Section 9.", issue: null },
          { id: "c8", text: "Oyelabs will make the apps available on the App Store and Google Play by 1 June, regardless of review outcomes.", issue: "Store review is outside Oyelabs' control; commit to submission, not approval dates." },
          { id: "c9", text: "Payment: 30% on signature, 40% on beta acceptance, 30% on production launch.", issue: null },
          { id: "c10", text: "Out of scope: data migration from the client's existing system, and marketing website design.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pm-a-escalations",
      moduleId: "pm-advanced",
      trackId: "pm",
      title: "Escalations & Difficult Conversations",
      summary:
        "Escalation is a decision-routing tool, not an admission of failure. Its job is to get a decision from someone with the authority to make it, before the cost of waiting exceeds the cost of disruption. Junior PMs escalate too late, after quietly absorbing a blocked dependency for three weeks; the result is that a sponsor first hears about a problem when it has become a missed launch. Atlassian's \"clean escalation\" framing captures the healthy version: two parties who disagree go up together with a shared description of the problem and options, rather than one going around the other.\n\nA good escalation is short and decision-ready: what is happening, the impact in dates or money, what has been tried, the options with their trade-offs, a recommendation, and the decision needed by when. Thresholds should be agreed at kick-off in an escalation matrix (for example, any milestone risk over five working days or cost risk over 5% goes to the sponsor within 48 hours), which removes the emotional question of whether escalating is \"allowed\".\n\nDifficult conversations follow similar rules. Separate facts from interpretation, say the uncomfortable thing early and plainly, acknowledge the other side's constraints, and move to options. With clients, lead with the shared goal (the launch), not blame; with your own leadership, bring the numbers and a recommendation, not just the problem. For an agency the hardest conversations are usually commercial: telling a client their delay or their change has a cost, or telling your MD a fixed bid is underwater.\n\nGotchas: escalating by email to a large cc list feels safe but humiliates the counterpart and hardens positions, so talk first, then confirm in writing. Escalating without options hands the problem upwards rather than asking for a decision. And never let an escalation be the first time someone hears about a risk; the risk log should have warned them weeks earlier.",
      level: "advanced",
      estMinutes: 40,
      isMilestone: true,
      webRefs: [
        { label: "Atlassian Team Playbook: Clean escalations", url: "https://www.atlassian.com/team-playbook/plays/clean-escalations", kind: "docs" },
        { label: "PMI library: Escalate is not a dirty word", url: "https://www.pmi.org/learning/library/escalate-not-dirty-word-3637", kind: "article" },
        { label: "ProjectManager: Escalation matrix", url: "https://www.projectmanager.com/blog/escalation-matrix", kind: "article" },
      ],
      video: {
        title: "How to Manage Difficult Stakeholders [6 COMMON CHALLENGES]",
        channel: "Adriana Girdler",
        url: "https://www.youtube.com/watch?v=NaGhBpfZLzg",
        videoId: "NaGhBpfZLzg",
      },
      alternateVideos: [
        {
          title: "This is TERRIBLE PMP Advice - Never Escalate, Never Close",
          channel: "David McLachlan",
          url: "https://www.youtube.com/watch?v=LMGOE663mZY",
          videoId: "LMGOE663mZY",
        },
        {
          title: "How to Deal with Difficult Stakeholders - In Conversation with Andy Kaufman",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=DqXSeSkC93A",
          videoId: "DqXSeSkC93A",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-a-escalations-q1",
          prompt:
            "The client's IT team hasn't provided production API credentials for 12 days. Launch is in four weeks and integration testing needs ten working days. You've chased their lead twice. What is the best next step?",
          options: [
            "Escalate now to the client sponsor with the date impact, what you've tried, options and the decision needed by a specific date",
            "Wait another week; escalating may damage the relationship",
            "Build against mocks and hope the real API matches",
            "Escalate to your own MD and ask them to call the client's CEO",
          ],
          correctIndex: 0,
          explanation:
            "The remaining slack is nearly gone, so the cost of waiting now exceeds the cost of escalating. Mocks only defer the risk, and jumping to the CEO skips the sponsor who owns the decision.",
        },
        {
          id: "pm-a-escalations-q2",
          prompt: "Which elements make an escalation decision-ready? (Select all that apply.)",
          options: [
            "The impact stated in dates or money",
            "Two or three options with their trade-offs and a recommendation",
            "The specific decision needed and the deadline for it",
            "A full history of every message exchanged",
            "Who is to blame",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Decision-makers need impact, options and a clear ask. A full message log and blame make it longer and more defensive, without helping the decision.",
        },
        {
          id: "pm-a-escalations-q3",
          prompt:
            "Your tech lead and the client's architect disagree about hosting the AI model. Neither will move. What does a clean escalation look like?",
          options: [
            "Both go to the agreed decision-maker together with a jointly written summary of the problem and each option",
            "You escalate the tech lead's view to the client sponsor without telling the architect",
            "You pick one option yourself to avoid escalation",
            "You copy both companies' leadership into a long email thread",
          ],
          correctIndex: 0,
          explanation:
            "Escalating together with a shared problem statement keeps trust and speeds the decision. Going around someone or broadcasting to leadership hardens positions.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-escalations-q4",
          prompt: "What is the main benefit of agreeing an escalation matrix at kick-off?",
          options: [
            "It sets objective thresholds and routes, so escalating becomes a normal process step rather than a personal judgement",
            "It means escalations never happen",
            "It lets the PM avoid making decisions",
            "It's required by Scrum",
          ],
          correctIndex: 0,
          explanation:
            "Pre-agreed thresholds remove the emotional cost of escalating and stop issues waiting too long. Escalations still happen; they just happen on time.",
        },
        {
          id: "pm-a-escalations-q5",
          prompt:
            "You must tell a client their three-week delay in providing content will push launch by two weeks and cost $8,000 under the SOW's dependency clause. How should you open the conversation?",
          options: [
            "With the shared goal and the facts: the launch, the dependency dates, and the impact, before moving to options",
            "With the invoice amount",
            "By apologising for the delay",
            "By reading out the contract clause",
          ],
          correctIndex: 0,
          explanation:
            "Starting from the shared goal and facts keeps it collaborative; the clause and cost follow naturally. Apologising for their delay misplaces ownership, and leading with money or legal text triggers defensiveness.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-escalations-q6",
          prompt: "A PM escalates with: \"The project is in trouble, please advise.\" What is wrong?",
          options: [
            "It hands the problem up without impact, options or a specific decision request",
            "It's too short to be professional",
            "Escalations should only be verbal",
            "Nothing; it's appropriately humble",
          ],
          correctIndex: 0,
          explanation:
            "Senior people can decide quickly if given options and a recommendation; a vague alarm forces them to investigate. Brevity is good when it carries the right content.",
        },
        {
          id: "pm-a-escalations-q7",
          prompt: "Which are signs a PM is escalating too late? (Select all that apply.)",
          options: [
            "The sponsor first hears about a risk when it has already caused a missed milestone",
            "The risk log never mentioned the issue that is now being escalated",
            "Remaining options are all expensive because the cheap ones have expired",
            "The escalation includes a recommendation",
            "It was raised within the matrix threshold",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Late escalation shows up as surprise, missing early warnings and only costly options left. Including a recommendation and following the threshold are signs of a good escalation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-escalations-q8",
          prompt: "After a tense call where the client agreed to a revised date, what should the PM do?",
          options: [
            "Send a short written confirmation of what was agreed, by whom and the next steps",
            "Nothing: verbal agreements are enough",
            "Send the full call recording to all stakeholders",
            "Wait for the client to confirm in writing",
          ],
          correctIndex: 0,
          explanation:
            "A written summary prevents memories diverging later. Waiting for the client leaves the record to chance, and a raw recording isn't a decision record.",
        },
        {
          id: "pm-a-escalations-q9",
          prompt: "When raising a problem with your own MD that a fixed bid is underwater, what should you bring?",
          options: [
            "The numbers (EAC, margin impact), the cause, the options for recovery or renegotiation, and your recommendation",
            "Only the problem, so leadership can decide everything",
            "A request to cut the team's hours",
            "A plan to keep it quiet until the project ends",
          ],
          correctIndex: 0,
          explanation:
            "Leadership needs a quantified problem and options. Hiding it or bringing only the problem wastes their time and delays the response.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write the escalation email to the client sponsor described in the context. It should be decision-ready: impact, what has been tried, options with trade-offs, a recommendation, and a clear decision with a deadline. Keep the tone collaborative.",
        context:
          "Project: white-label pharmacy app with an AI prescription-reminder assistant for MedCo. Sponsor: Priya Shah (MedCo Head of Digital). Launch: 14 November, tied to a national advertising campaign. Blocker: MedCo's IT team has not provided production access to their pharmacy-records API. Requested 3 September, chased 10 and 17 September with their IT lead (Tom). Integration and security testing needs 10 working days after access. Today is 24 September. If access arrives by 1 October, launch is safe. Every week after that pushes launch a week. Option: launch with reminders entered manually by users (no API) and add the integration in a release two weeks later; extra cost about $4,500. SOW lists API access as a client dependency.",
        wordLimit: 250,
        rubric: [
          { id: "impact", label: "States impact clearly", description: "Gives the concrete date impact on the 14 November launch and the 1 October cut-off.", weight: 1.5 },
          { id: "history", label: "Shows what was tried", description: "Briefly notes the request and chasers without blaming Tom personally.", weight: 1 },
          { id: "options", label: "Options and recommendation", description: "Offers at least two options (e.g. access by 1 October; launch without integration then add it) with trade-offs including cost, and recommends one.", weight: 1.5 },
          { id: "ask", label: "Clear decision and deadline", description: "Asks Priya for a specific decision or action by a specific date.", weight: 1.5 },
          { id: "tone", label: "Collaborative tone", description: "Leads with the shared launch goal, is concise, avoids blame and legalistic threats while referencing the dependency factually.", weight: 1 },
        ],
        sampleAnswer:
          "Subject: Decision needed by 1 Oct: pharmacy API access and the 14 Nov launch\n\nHi Priya,\n\nTo keep the 14 November launch aligned with your campaign, we need production access to the pharmacy-records API by 1 October. Integration and security testing takes 10 working days once we have it, and each week after 1 October moves launch by a week.\n\nWe requested access on 3 September and followed up with Tom on 10 and 17 September; it is still pending, and I suspect it's stuck in an approval queue on your side.\n\nOptions:\n1. Access by 1 October: launch stays on 14 November at no extra cost.\n2. Launch on 14 November with reminders entered manually by users, then add the API integration two weeks later. The campaign date is protected, but early users get a weaker experience and it costs about $4,500 extra.\n3. Wait for access and move launch, which would miss the campaign.\n\nI recommend pushing for option 1 this week and agreeing option 2 as the fallback now, so we don't lose more time if access slips. API access is listed as a MedCo dependency in the SOW, so options 2 and 3 would go through a change request.\n\nCould you confirm by Friday 26 September whether you can unblock access, and whether you approve option 2 as the fallback? Happy to join a call with Tom if that helps.\n\nThanks,\nAlex",
      },
    },
    {
      id: "pm-a-project-recovery",
      moduleId: "pm-advanced",
      trackId: "pm",
      title: "Project Recovery: Turning Around a Troubled Project",
      summary:
        "Recovery is a different job from delivery. A project in trouble (repeated missed milestones, a CPI stuck below 0.85, a client threatening to withdraw, a demoralised team) cannot be fixed by working harder on the same plan, because the plan is part of the problem. PMI's recovery literature converges on a sequence: stop the bleeding, assess honestly, decide whether the project should be recovered at all, re-plan to something achievable, then execute with tighter controls and more frequent communication.\n\nThe honest assessment is the step most often skipped. Talk to the team one to one (they usually know the real causes), review the actual state of the code and the backlog rather than the reports, and separate root causes (unclear requirements, wrong architecture for the AI workload, missing skills, a client who cannot make decisions) from symptoms (late sprints). Then re-baseline: agree with the sponsor what minimum viable scope delivers the core business value, by when, for how much. Recovery almost always involves cutting or deferring scope; adding people late usually makes things worse in the short term, as Brooks's law warns, because onboarding and communication cost more than the new capacity adds.\n\nFor an agency, recovery has a commercial edge. If the trouble comes from the client's side (late decisions, changing priorities, missing dependencies), the recovery plan must fix that pattern, not just absorb it. If it comes from Oyelabs' side (a bad estimate, the wrong team), leadership has to decide how much margin to spend recovering the relationship.\n\nGotchas: a recovery plan with the same end date and the same scope is not a recovery plan; it is denial with a new Gantt chart. Recovery fails when it keeps the old reporting cadence: troubled projects need weekly or even twice-weekly sponsor check-ins and visible early wins. And sometimes the right answer is to stop: a recovery assessment that concludes cancellation is a success, not a failure, if it prevents further waste.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "PMI: PMBOK Guide 8th edition", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
        { label: "PMI library: Six steps to project recovery", url: "https://www.pmi.org/learning/library/six-steps-project-recovery-4641", kind: "article" },
        { label: "PMI library: Five critical first steps in recovering troubled projects", url: "https://www.pmi.org/learning/library/critical-steps-recovering-troubled-projects-7352", kind: "article" },
      ],
      video: {
        title: "Four Ways to Recover a Failing Project",
        channel: "David McLachlan",
        url: "https://www.youtube.com/watch?v=RZ4eBKF-aC0",
        videoId: "RZ4eBKF-aC0",
      },
      alternateVideos: [
        {
          title: "When Your Project is in Trouble - Project Management",
          channel: "ProjectManager",
          url: "https://www.youtube.com/watch?v=nIaU9j9xwHY",
          videoId: "nIaU9j9xwHY",
        },
        {
          title: "How to Rescue the Problem Project [SAVE YOUR FAILING PROJECT]",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=yl8SMYK5adM",
          videoId: "yl8SMYK5adM",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-a-project-recovery-q1",
          prompt:
            "You inherit a project that has missed three milestones. The previous PM's reports were green until last week. What should you do first?",
          options: [
            "Assess the real state: one-to-ones with the team, inspect the backlog and working software, and identify root causes before promising anything",
            "Promise the client a new date within 48 hours to restore confidence",
            "Add two developers immediately",
            "Continue the existing plan and monitor closely",
          ],
          correctIndex: 0,
          explanation:
            "Without an honest assessment, any new date is a guess on top of a plan that already failed. Adding people or carrying on unchanged treats symptoms.",
        },
        {
          id: "pm-a-project-recovery-q2",
          prompt:
            "A recovery plan proposes adding four developers to a project four weeks before its deadline. What is the main risk?",
          options: [
            "Onboarding and coordination overhead slows the existing team in the short term, so the project may get later before it gets faster",
            "New developers always write worse code",
            "Clients never accept added people",
            "It makes the project cost less",
          ],
          correctIndex: 0,
          explanation:
            "Brooks's law: adding people to a late software project tends to make it later, because ramp-up and communication paths cost more than the new capacity adds at first. It can help with well-separated work and long enough runway.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-project-recovery-q3",
          prompt: "Which belong in a credible recovery plan? (Select all that apply.)",
          options: [
            "A re-baselined, reduced scope focused on core business value, agreed with the sponsor",
            "Fixes for the root causes, not just the symptoms",
            "A more frequent sponsor check-in cadence and early visible wins",
            "The original scope and date, with the team working weekends",
            "Removing the risk log to reduce noise",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Recovery needs achievable scope, root-cause fixes and tighter communication. Same scope plus overtime is denial, and dropping the risk log hides the very signals you need.",
        },
        {
          id: "pm-a-project-recovery-q4",
          prompt:
            "The assessment shows the root cause is the client's product owner changing priorities every sprint. What should the recovery plan include?",
          options: [
            "An agreed change cadence (priorities fixed within a sprint, changes through the backlog), with the sponsor's backing and visible cost of churn",
            "Absorbing the changes and increasing the team size",
            "Refusing all changes until launch",
            "Replacing the client's product owner yourself",
          ],
          correctIndex: 0,
          explanation:
            "Recovery has to fix the pattern that caused the trouble. Absorbing it repeats the failure, and refusing all change or choosing the client's staff isn't within the PM's authority.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-project-recovery-q5",
          prompt:
            "After assessment, the recovered project would cost more than the business value it delivers, and the client's market window has closed. What is the right recommendation?",
          options: [
            "Recommend stopping or radically reshaping the project, with the evidence, so the sponsor can make an informed decision",
            "Recover it anyway, because cancelling looks like failure",
            "Keep going but reduce reporting",
            "Hand it to another PM",
          ],
          correctIndex: 0,
          explanation:
            "Recovery assessment is about value, and concluding the project should stop prevents further waste. Continuing for appearances throws good money after bad.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-project-recovery-q6",
          prompt: "Why are one-to-one conversations with team members so valuable early in recovery?",
          options: [
            "People closest to the work usually know the real causes but may not say them in group meetings or reports",
            "They replace the need to look at the code",
            "They identify who to blame",
            "They are required by the PMBOK Guide",
          ],
          correctIndex: 0,
          explanation:
            "Private conversations surface technical debt, unclear requirements and morale problems. They complement inspection of the work and are about causes, not blame.",
        },
        {
          id: "pm-a-project-recovery-q7",
          prompt: "Which early signs should have triggered recovery before three milestones were missed?",
          options: [
            "CPI or velocity trending down for several sprints, rising carry-over and growing defect counts",
            "A team retrospective being held",
            "The client asking a question",
            "A sprint finishing on time",
          ],
          correctIndex: 0,
          explanation:
            "Trends in efficiency, carry-over and quality are leading indicators. Holding retros, client questions and on-time sprints are normal.",
        },
        {
          id: "pm-a-project-recovery-q8",
          prompt:
            "The cause is Oyelabs' own estimate: the AI search feature was underestimated by 60%. What is the commercial decision leadership must make?",
          options: [
            "How much margin to spend to deliver as promised, versus negotiating scope changes with the client, given the long-term relationship",
            "Whether to bill the client for the underestimate as a change request",
            "Whether to stop reporting to the client",
            "Whether to hand the project back unfinished",
          ],
          correctIndex: 0,
          explanation:
            "An agency's estimating error isn't the client's change; leadership weighs the cost of absorbing it against renegotiation and the account's value. Billing it as a change or going silent damages trust.",
        },
        {
          id: "pm-a-project-recovery-q9",
          prompt: "During recovery, how should status reporting change?",
          options: [
            "More frequent and more candid, with a short list of the recovery measures and their trend",
            "Less frequent to give the team space",
            "Unchanged, to avoid alarming anyone",
            "Only reported when the project is back to green",
          ],
          correctIndex: 0,
          explanation:
            "A troubled project needs tighter feedback and rebuilt trust. Reducing or hiding reporting is how it got into trouble.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A PM drafted this recovery plan for a troubled white-label e-learning platform with an AI tutor. The project has missed three milestones, CPI is 0.78, and the client is unhappy. Mark the parts of the plan that are flawed.",
        segments: [
          { id: "p1", text: "1. This week, run one-to-one interviews with all seven team members and the client product owner.", issue: null },
          { id: "p2", text: "2. Review the backlog and demo the current build to the sponsor to agree what genuinely works today.", issue: null },
          { id: "p3", text: "3. Keep the full original scope and the 30 November launch date, to protect the relationship.", issue: "Same scope and date as the plan that failed: that's denial, not recovery." },
          { id: "p4", text: "4. Close the gap by having the team work Saturdays until launch.", issue: "Sustained overtime raises defects and burnout and doesn't address root causes." },
          { id: "p5", text: "5. Add five contractors next week to speed up the final four weeks.", issue: "Late additions add onboarding and coordination cost; likely to slow the team short term." },
          { id: "p6", text: "6. Agree a minimum viable release with the sponsor, deferring the gamification module to phase 2.", issue: null },
          { id: "p7", text: "7. Move sponsor check-ins from monthly to weekly, with a one-page recovery dashboard.", issue: null },
          { id: "p8", text: "8. Pause the risk log during recovery so the team can focus on delivery.", issue: "Recovery needs more risk visibility, not less." },
          { id: "p9", text: "9. Agree with the client that priorities are fixed within each sprint and changes go through the backlog.", issue: null },
          { id: "p10", text: "10. Report status as green from now on to rebuild client confidence.", issue: "Misreporting status destroys trust; report honestly with the recovery trend." },
          { id: "p11", text: "11. Review in four weeks whether recovery is working, including the option to stop.", issue: null },
          { id: "p12", text: "12. Fix the AI tutor's latency by choosing the architecture after the root-cause review.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pm-a-vendor-management",
      moduleId: "pm-advanced",
      trackId: "pm",
      title: "Vendor & Subcontractor Management",
      summary:
        "Agencies are buyers as well as sellers. Oyelabs may subcontract a specialist ML team, a QA firm or a design studio, and every AI-powered platform depends on vendors it does not control: model providers, vector databases, cloud hosting, payment and SMS gateways, app stores. Vendor management exists because the client holds Oyelabs accountable for all of it; \"our subcontractor was late\" is not a defence the client will accept.\n\nThe lifecycle mirrors PMBOK procurement: decide make-or-buy, select the vendor on capability and risk (not just day rate), contract with clear deliverables and acceptance, then manage performance and close out. The contract should flow down the obligations Oyelabs has accepted from its client: confidentiality, data protection, IP assignment, security requirements and acceptance criteria. If the client SOW says the client owns all code, a subcontractor who retains IP breaks that promise.\n\nFor platform vendors the risks are different: pricing changes, rate limits, deprecations, outages and data-residency terms. Model providers deprecate models on published schedules, and usage-based pricing can turn a profitable fixed-price build into a loss if nobody modelled costs at production volume. Keep a vendor register with owner, contract terms, renewal dates, SLAs, data handled and an exit plan.\n\nManage subcontractors like part of the team, with the same definition of done, code review and sprint cadence, rather than as a black box that delivers at the end. Inspect early: a first deliverable in week two tells you more than any reference call.\n\nGotchas: choosing the cheapest bid without checking delivery capacity; paying large up-front fees that remove your leverage; vendor lock-in through a proprietary component with no export path; and the subcontractor contacting your client directly and taking over the relationship, which the contract should prohibit.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "PMI: PMBOK Guide 8th edition", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
        { label: "ProjectManager: Vendor management", url: "https://www.projectmanager.com/blog/vendor-management", kind: "article" },
        { label: "Upwork: Software development outsourcing guide", url: "https://www.upwork.com/resources/software-development-outsourcing", kind: "article" },
      ],
      video: {
        title: "Project Procurement Management Overview | PMBOK Video Course",
        channel: "David McLachlan",
        url: "https://www.youtube.com/watch?v=Ig0uVNXhR9Q",
        videoId: "Ig0uVNXhR9Q",
      },
      alternateVideos: [
        {
          title: "Mastering Vendor Management: Unveiling Practical Risk Tips",
          channel: "Prabh Nair",
          url: "https://www.youtube.com/watch?v=-MmqZ2CBlUQ",
          videoId: "-MmqZ2CBlUQ",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-a-vendor-management-q1",
          prompt:
            "The client SOW says the client will own all source code. Oyelabs subcontracts the ML pipeline to a specialist firm. What must the subcontract include?",
          options: [
            "An IP assignment that lets Oyelabs pass full ownership of the pipeline code to the client",
            "Nothing extra; the client SOW covers subcontractors automatically",
            "A clause giving the subcontractor joint ownership",
            "A requirement that the client signs the subcontract",
          ],
          correctIndex: 0,
          explanation:
            "Obligations must flow down: Oyelabs can't assign IP it doesn't hold. The client SOW doesn't bind a third party.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-vendor-management-q2",
          prompt: "Which criteria matter most when selecting a subcontracted development team? (Select all that apply.)",
          options: [
            "Evidence of delivering similar work, ideally via a small paid trial",
            "Available capacity for your dates",
            "Security and data-protection practices that meet the client's requirements",
            "The lowest day rate, regardless of other factors",
            "The size of their marketing team",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Capability, capacity and compliance predict delivery. Price matters, but choosing on rate alone is the classic procurement failure; marketing size says nothing.",
        },
        {
          id: "pm-a-vendor-management-q3",
          prompt:
            "A fixed-price chatbot build assumed $300 a month in LLM API costs. Usage at launch is ten times the estimate. Oyelabs pays the API bill under the contract. What was the planning failure?",
          options: [
            "Model usage costs weren't modelled at production volume, and the contract didn't cap or pass through usage costs",
            "The wrong programming language was chosen",
            "The client used the product too much",
            "The vendor raised prices unfairly",
          ],
          correctIndex: 0,
          explanation:
            "Usage-based vendor pricing needs volume modelling and a commercial mechanism such as pass-through or caps. Success driving usage was predictable, not the client's fault.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-vendor-management-q4",
          prompt: "How should a PM integrate a subcontracted QA firm into delivery?",
          options: [
            "Include them in sprint ceremonies with the same definition of done and visible work, inspecting their output from the first week",
            "Send them the finished build at the end for a single test pass",
            "Let them work independently and report only defects counts monthly",
            "Have them report directly to the client",
          ],
          correctIndex: 0,
          explanation:
            "Treating vendors as part of the team surfaces problems early. End-of-project handoffs create a late, big-bang risk, and direct client reporting undermines the agency's accountability.",
        },
        {
          id: "pm-a-vendor-management-q5",
          prompt: "Which belong in a vendor register for an AI platform's third-party services? (Select all that apply.)",
          options: [
            "Contract owner and renewal dates",
            "What client data the vendor processes and where",
            "Deprecation, SLA and pricing terms, plus an exit plan",
            "The vendor's office address only",
            "Personal opinions about the vendor's staff",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A register tracks commercial, data and continuity risk. An address alone doesn't help, and personal opinions aren't governance data.",
        },
        {
          id: "pm-a-vendor-management-q6",
          prompt:
            "A subcontractor has missed its first two milestones. What is the most effective first step?",
          options: [
            "Meet the vendor's lead, review the actual work against acceptance criteria, agree a corrective plan with dates, and apply contract remedies if needed",
            "Terminate immediately",
            "Pay the next milestone early to motivate them",
            "Say nothing to the client and absorb the delay",
          ],
          correctIndex: 0,
          explanation:
            "Assess and correct first, using the contract's remedies as leverage. Immediate termination may be costlier than recovery, early payment removes leverage, and hiding it from the client breaks trust.",
        },
        {
          id: "pm-a-vendor-management-q7",
          prompt: "On a PMP-style question, which contract type should a buyer use for a well-defined, low-risk deliverable from a vendor?",
          options: ["Firm fixed price", "Cost plus award fee", "Time and materials without a cap", "Cost plus fixed fee"],
          correctIndex: 0,
          explanation:
            "Well-defined scope lets the vendor price it, and the buyer gets cost certainty. Cost-reimbursable and uncapped T&M leave the buyer carrying risk unnecessarily.",
        },
        {
          id: "pm-a-vendor-management-q8",
          prompt:
            "The subcontractor's lead starts emailing your client directly with suggestions and quotes. What should have prevented this?",
          options: [
            "A non-solicitation and communication clause in the subcontract, plus clear engagement rules at kick-off",
            "Nothing; it's normal practice",
            "Asking the client to ignore the emails",
            "Giving the subcontractor a share of the client account",
          ],
          correctIndex: 0,
          explanation:
            "The subcontract should define who talks to the client and prohibit solicitation. Leaving it to the client to police is unprofessional and risks losing the account.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-a-vendor-management-q9",
          prompt: "Why is a large up-front payment to a new subcontractor risky?",
          options: [
            "It removes your leverage if delivery falters, because most of the money is already paid",
            "It's illegal in most countries",
            "It always costs more in total",
            "It prevents the vendor from starting",
          ],
          correctIndex: 0,
          explanation:
            "Payments tied to accepted milestones keep incentives aligned. Up-front payment isn't illegal or always more expensive; the issue is lost leverage.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "Oyelabs is building an AI-powered property-listing platform for a real-estate client and has subcontracted the computer-vision photo-tagging service to VisionWorks, a small specialist firm, on a fixed price with three milestones. The client contract includes a strict data-protection clause: listing photos may only be processed in the EU.",
        steps: [
          {
            id: "s1",
            question: "Before signing with VisionWorks, which clause is most critical to confirm?",
            options: [
              "Flow-down of the client's data-protection terms, including EU-only processing, with the right to audit",
              "A discount for early payment",
              "VisionWorks' preferred sprint length",
              "Permission for VisionWorks to reuse the photos to train its own models",
            ],
            correctIndex: 0,
            explanation:
              "Oyelabs has promised EU-only processing, so the subcontractor must be bound to it. Allowing photo reuse would breach the client contract.",
          },
          {
            id: "s2",
            question:
              "In week 3, VisionWorks' first milestone demo shows tagging accuracy of 71% against an agreed 85% on the evaluation set. They say it will improve. What do you do?",
            options: [
              "Withhold milestone acceptance, review the failure cases with them, and agree a dated corrective plan with an interim checkpoint",
              "Accept the milestone to keep the relationship positive",
              "Terminate the subcontract immediately",
              "Lower the client's acceptance threshold to 71% without telling them",
            ],
            correctIndex: 0,
            explanation:
              "Acceptance criteria are your leverage, and early inspection is the point of milestones. Termination at week 3 is premature, and silently changing the client's threshold is a breach of trust.",
          },
          {
            id: "s3",
            question:
              "At the interim checkpoint, accuracy is 78% and VisionWorks admits it lacks training data for one property type. Launch is six weeks away. What is the best course?",
            options: [
              "Tell the client now, propose options (a phased launch excluding that property type, or a manual-tagging fallback), and agree with VisionWorks how the gap is funded",
              "Wait until launch to see if accuracy improves",
              "Switch to a new vendor and restart from scratch without telling the client",
              "Ask the client to supply their customers' private photos for training",
            ],
            correctIndex: 0,
            explanation:
              "With six weeks left, the client must hear about the risk with options. Waiting wastes the last cheap options; a silent vendor switch is risky; and using private photos for training may breach the client's data terms.",
          },
        ],
      },
    },
  ],
} satisfies Module;
