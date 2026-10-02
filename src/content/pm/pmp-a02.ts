import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a02",
  trackId: "pm",
  name: "Custom lifecycle: Estimation & commercial models",
  description:
    "How the price and the plan come to rest on the same assumptions: choosing between fixed bid, time and materials, retainer and dedicated team, supporting the tech lead's estimate as a PM, and tying milestone billing to deliverables the client can actually accept.",
  topics: [
    {
      id: "pmp-a02-commercial-models",
      moduleId: "pmp-a02",
      trackId: "pm",
      title: "Commercial models: fixed bid, T&M, retainer, dedicated team",
      summary:
        "The commercial model decides who carries the risk when the work turns out bigger than expected. That one fact shapes how you plan, report and handle every change.\n\n- **[[term:fixed-bid]]:** one price for a defined scope. The agency carries the cost risk. The [[term:scope-baseline]] and the [[term:change-request]] process are your protection.\n- **[[term:time-and-materials]] (T&M):** the client pays for hours actually worked at agreed rates from the [[term:rate-card]]. The client carries the risk, so they need visibility. A not-to-exceed cap is common.\n- **[[term:retainer]]:** a recurring fee for reserved capacity, often use-it-or-lose-it.\n- **[[term:dedicated-resource-model]]:** named people billed monthly, directed day to day by the client's priorities.\n\nWhy it matters at an agency: the same request means different things under each model. Under fixed bid, \"add a filter\" is a CR. Under T&M, it is a backlog item the client prioritises, but you still tell them it costs hours.\n\nHow to use it: find the model in the [[term:sow]] at handover, then set your governance to match. Fixed bid needs tight scope control and written sign-offs. T&M needs weekly burn reporting against the cap.\n\nThe common mistake is running a T&M project like a fixed bid (refusing changes) or a fixed bid like T&M (accepting every change).",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Acquisition.gov: FAR Part 16 - Types of Contracts", url: "https://www.acquisition.gov/far/part-16", kind: "spec", verifiedAt: "2026-10-02T11:51:30Z" },
        { label: "Acquisition.gov: FAR 16.601 Time-and-materials contracts", url: "https://www.acquisition.gov/far/16.601", kind: "spec", verifiedAt: "2026-10-02T11:51:30Z" },
        { label: "ProjectManager: Fixed price contract - what you need to know", url: "https://www.projectmanager.com/blog/fixed-price-contract", kind: "article", verifiedAt: "2026-10-02T12:04:12Z" },
        { label: "ProjectManager: Time and materials contract (T&M) - when to use one", url: "https://www.projectmanager.com/blog/time-and-materials-contract", kind: "article", verifiedAt: "2026-10-02T12:04:14Z" },
      ],
      video: {
        title: "Fixed-Price Contracts VS Time-and-Materials for Your Software Development Project",
        channel: "Matt Brickwood",
        url: "https://www.youtube.com/watch?v=PyobLk8aGu0",
        videoId: "PyobLk8aGu0",
        verifiedAt: "2026-10-02T12:16:56Z",
      },
      alternateVideos: [
        {
          title: "Fixed Fee vs Time & Materials Contracts: Comparison",
          channel: "Brainhub",
          url: "https://www.youtube.com/watch?v=WrUYVqs2-BY",
          videoId: "WrUYVqs2-BY",
          verifiedAt: "2026-10-02T12:16:56Z",
        },
        {
          title: "Time & Materials (T&M) Contract Tutorial",
          channel: "AcqNotes",
          url: "https://www.youtube.com/watch?v=76gvFtvdJw4",
          videoId: "76gvFtvdJw4",
          verifiedAt: "2026-10-02T12:16:56Z",
        },
      ],
      handbook: { stages: ["custom-estimation"], rules: ["billing-change-request", "cr-when-needed"] },
      sections: [
        {
          heading: "The four models side by side",
          body:
            "- **[[term:fixed-bid]].** Best when scope is clear and stable. Risk: agency. PM focus: scope baseline, sign-offs, CRs. Reporting: milestones and RAG.\n- **[[term:time-and-materials]].** Best when scope is uncertain or evolving. Risk: client, up to any cap. PM focus: burn rate, priorities, value per sprint. Reporting: hours used versus cap, weekly.\n- **[[term:retainer]].** Best for ongoing improvement or support. Risk: shared; unused hours are often lost to the client. PM focus: a visible queue and monthly usage. Reporting: hours or tickets used per period.\n- **[[term:dedicated-resource-model]].** Best when the client wants a team they direct. Risk: client. PM focus: the people's utilisation, the client's backlog health, replacements and leave. Reporting: monthly timesheets and output.\n\nUS federal rules give a useful reference point: firm-fixed-price puts the cost risk on the contractor, and T&M may be used only when the work cannot be estimated accurately, with a ceiling the contractor exceeds at its own risk.",
        },
        {
          heading: "How the model changes your daily decisions",
          body:
            "**A client asks for a new export button in sprint 4.**\n\n- Fixed bid: check it against the signed scope. If new, follow the CR rule in the handbook card: estimate, price, written approval, then build.\n- T&M: add it to the backlog, give an estimate in hours, and let the client decide its priority against the cap.\n- Retainer: add it to the queue; it uses this month's hours.\n- Dedicated team: the client's product owner puts it in the backlog. You flag if it pushes committed work out.\n\nIn every model the client should know the cost before the work is done. Only the paperwork differs.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Accepting changes \"because it's small\" on a fixed bid.** Small changes add up. Recover: keep a register of every absorbed change and start routing new ones through CRs.\n- **No burn reporting on T&M.** The client is surprised by an invoice. Recover: send hours used versus cap every week, and warn at a typical 75–80% of the cap.\n- **Treating a retainer as unlimited.** Recover: show the queue and the hours left each month.\n- **Hybrid confusion.** A fixed-bid build with T&M changes needs both sets of rules. Recover: write in the kickoff MoM which work falls under which model.\n\nNot legal advice: the signed contract always wins.",
        },
      ],
      sop: [
        {
          title: "Rate card and cap warnings",
          prompt: "[Oyelabs SOP – admin to fill] Where the current Oyelabs rate card lives, who can quote rates to a client, and at what percentage of a T&M cap the PM must warn the client and BD.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a02-commercial-models-q1",
          prompt: "On a fixed-bid project, who carries the cost risk if the agreed scope takes longer than estimated?",
          options: ["The agency", "The client", "Both equally, always", "The payment gateway"],
          correctIndex: 0,
          explanation: "The price is fixed for the defined scope, so extra effort on that scope is the agency's cost. Changes to the scope are different: they go through CRs.",
        },
        {
          id: "pmp-a02-commercial-models-q2",
          prompt: "A start-up client has a vague idea, wants to test the market and change direction often. Which model fits best?",
          options: ["Time and materials, ideally with a cap", "Fixed bid", "A 3-year AMC", "Milestone-only fixed bid with no CRs"],
          correctIndex: 0,
          explanation: "When scope cannot be estimated accurately, T&M lets the client steer and pay for what is built. A cap gives budget control.",
        },
        {
          id: "pmp-a02-commercial-models-q3",
          prompt: "Under T&M, the client asks for a new feature. Which statements are true? (Select all that apply.)",
          options: [
            "It goes into the backlog with an hours estimate",
            "The client decides its priority against the budget or cap",
            "It always needs a full formal CR with a new price",
            "You should tell the client what it costs before building it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "T&M is flexible, but the client still needs to know the cost. A full fixed-price CR is a fixed-bid mechanism, unless the contract says otherwise.",
        },
        {
          id: "pmp-a02-commercial-models-q4",
          prompt: "A T&M project has used 80% of its not-to-exceed cap with 40% of the backlog left. What do you do?",
          options: [
            "Warn the client and BD now with options: reprioritise, raise the cap, or cut scope",
            "Keep working and invoice the overrun",
            "Stop work without telling anyone",
            "Switch the project to fixed bid yourself",
          ],
          correctIndex: 0,
          explanation: "The cap is the client's budget protection. Early warning with options lets them decide. Working past a cap risks unpaid hours.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a02-commercial-models-q5",
          prompt: "What is typical of a retainer?",
          options: [
            "A recurring fee for reserved capacity, often with unused hours not rolling over",
            "One fixed price for a defined app",
            "Payment only when the app goes live",
            "Unlimited work for a fixed fee",
          ],
          correctIndex: 0,
          explanation: "A retainer reserves capacity each period. Whether unused hours roll over depends on the contract; often they do not.",
        },
        {
          id: "pmp-a02-commercial-models-q6",
          prompt: "In a dedicated-team model, who usually sets the day-to-day priorities?",
          options: ["The client, through their product owner or backlog", "The Oyelabs PM alone", "The developers", "BD"],
          correctIndex: 0,
          explanation: "The client is paying for the team's time and directs the work. The PM looks after the team, reporting, leave cover and delivery health.",
        },
        {
          id: "pmp-a02-commercial-models-q7",
          prompt: "A fixed-bid client says, \"It's just a small change, you can fit it in.\" This is the fifth such request. What is the right response?",
          options: [
            "Explain that changes to signed scope go through the CR process, and show the register of earlier changes",
            "Accept it; small changes are always free",
            "Refuse all communication about it",
            "Build it and bill it later without telling them",
          ],
          correctIndex: 0,
          explanation: "Individually small changes are classic scope creep on fixed bids. A visible register and a consistent process keep the relationship fair.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a02-commercial-models-q8",
          prompt: "A project is a fixed-bid build, with later changes billed T&M. What should the PM make clear at kickoff?",
          options: [
            "Which work falls under the fixed price and which is billed by the hour",
            "That all work is now T&M",
            "Nothing; the contract covers it",
            "That changes are free during the first month",
          ],
          correctIndex: 0,
          explanation: "Hybrid contracts cause confusion unless the boundary is stated plainly and written into the MoM.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a02-commercial-models-q9",
          prompt: "Which reporting matters most on a T&M project?",
          options: ["Hours used against budget or cap, every week", "Only milestone sign-offs", "Store review status", "Nothing until the final invoice"],
          correctIndex: 0,
          explanation: "The client carries the risk, so burn visibility is what they need to steer.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "BD brings you into a deal: a logistics company in Kenya wants a driver app (React Native) and a dispatch web panel (Laravel and React). They have a clear list of 14 screens for the driver app, approved wireframes from their own designer, and a hard budget approved by their board. For the dispatch panel, they say: \"We are not sure yet; we want to try a few ideas with our dispatchers first.\" BD asks your view on the commercial model.",
        steps: [
          {
            id: "s1",
            question: "Which model fits the driver app?",
            options: [
              "Fixed bid: the scope is defined, wireframes exist and the budget is fixed",
              "T&M with no cap, because apps always change",
              "A retainer, billed monthly forever",
              "Dedicated team directed by the client's dispatchers",
            ],
            correctIndex: 0,
            explanation: "Clear, stable scope and a fixed budget suit a fixed bid. The agency carries the risk, which the approved wireframes reduce.",
          },
          {
            id: "s2",
            question: "Which model fits the dispatch panel?",
            options: [
              "T&M with a not-to-exceed cap and fortnightly reviews with the dispatchers",
              "Fixed bid at the BD's best guess",
              "Free, as a goodwill gesture",
              "Fixed bid with unlimited changes included",
            ],
            correctIndex: 0,
            explanation: "The client cannot define the scope yet. T&M lets them explore; the cap protects their budget. Pricing the unknown as a fixed bid puts all the risk on Oyelabs.",
          },
          {
            id: "s3",
            question: "The client signs this hybrid. In sprint 3 they ask for a new 'delivery proof photo' screen in the driver app. What happens?",
            options: [
              "It is outside the fixed-bid driver scope, so raise a CR with estimate and price for written approval",
              "Add it to the dispatch panel's T&M hours without telling them",
              "Build it free, because the app is fixed bid",
              "Refuse, because fixed bids cannot change",
            ],
            correctIndex: 0,
            explanation: "Changes to fixed-bid scope go through the CR process. Moving it into the T&M bucket silently would hide the cost from the client.",
          },
        ],
      },
    },
    {
      id: "pmp-a02-estimation-support",
      moduleId: "pmp-a02",
      trackId: "pm",
      title: "Supporting estimation as a PM",
      summary:
        "The tech lead owns the [[term:estimate]]. The PM's job is to make it honest: complete, with its [[term:assumption]]s visible, and with uncertainty shown rather than hidden.\n\nWhy it matters at an agency: on a [[term:fixed-bid]] the estimate becomes the price, and the price becomes the plan. A missing line (QA, project management, store submission, deployment) is unpaid work. An estimate given as one number hides the range the team really believes.\n\nHow to support it:\n\n- Check coverage: every deliverable in the scope, plus design, QA, PM, DevOps, [[term:uat]] support, [[term:go-live]] and [[term:hypercare]].\n- Ask for ranges. A three-point estimate (optimistic, most likely, pessimistic) shows where the uncertainty is. The widest ranges point to the risky [[term:assumption]]s.\n- Remember the cone of uncertainty: before [[term:discovery]], estimates commonly run from a quarter to four times the real effort, and narrow as decisions are made.\n- Make sure exclusions and assumptions go into the [[term:proposal]] and [[term:sow]], not just the spreadsheet.\n- Agree the contingency approach internally. Contingency is for known unknowns in agreed scope, not for free changes.\n\nThe common mistake is pushing the tech lead to cut the estimate to win the deal without cutting scope. That only moves the overrun to delivery.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Scrum Guides: The Scrum Guide (2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: "2026-10-02T11:51:24Z" },
        { label: "Construx (Steve McConnell): The Cone of Uncertainty", url: "https://www.construx.com/books/the-cone-of-uncertainty/", kind: "article", verifiedAt: "2026-10-02T11:52:12Z" },
        { label: "Atlassian: Story points and agile estimation", url: "https://www.atlassian.com/agile/project-management/estimation", kind: "article", verifiedAt: "2026-10-02T11:52:06Z" },
        { label: "Mountain Goat Software: Planning Poker", url: "https://www.mountaingoatsoftware.com/agile/story-points/planning-poker", kind: "article", verifiedAt: "2026-10-02T11:52:10Z" },
      ],
      video: {
        title: "What Are Story Points in Agile? (Agile Estimation Explained)",
        channel: "Mountain Goat Software: Agile & Scrum Mastery",
        url: "https://www.youtube.com/watch?v=VsSaolMtkKU",
        videoId: "VsSaolMtkKU",
        verifiedAt: "2026-10-02T12:16:57Z",
      },
      alternateVideos: [
        {
          title: "Planning Poker Explained: How Agile Teams Estimate Story Points",
          channel: "Mountain Goat Software: Agile & Scrum Mastery",
          url: "https://www.youtube.com/watch?v=gE7srp2BzoM",
          videoId: "gE7srp2BzoM",
          verifiedAt: "2026-10-02T12:16:58Z",
        },
        {
          title: "Story Points vs Hours : Agile Estimation (4 of 4 ) #PMP #Agile",
          channel: "iZenBridge Consultancy Pvt Ltd.",
          url: "https://www.youtube.com/watch?v=gSJVmemODYs",
          videoId: "gSJVmemODYs",
          verifiedAt: "2026-10-02T12:16:58Z",
        },
      ],
      handbook: { stages: ["custom-estimation"], rules: ["cr-when-needed"] },
      sections: [
        {
          heading: "Hours for the price, points for the sprint",
          body:
            "Agencies usually price in hours or days, because the client pays for effort. Inside delivery, many teams plan sprints in story points: relative sizes, often on a modified Fibonacci scale, agreed through Planning Poker.\n\nBoth are fine. Keep them apart: the price estimate is a commercial commitment made once; sprint points are a planning tool the team revises every sprint. Never convert points back into hours to argue with a client about an invoice.",
        },
        {
          heading: "The PM's coverage check",
          body:
            "Go down the estimate and ask for each of these: is it there, and is it sized?\n\n- Every deliverable and platform in the scope (iOS and Android are two).\n- [[term:discovery]] and requirement writing.\n- Design: [[term:wireframe]]s, [[term:mockup]]s, revision rounds.\n- Set-up: repositories, [[term:environment]]s, CI, [[term:sprint-0]].\n- Third-party integrations, including waiting time for client access.\n- [[term:qa]] and [[term:regression-test]]ing, not just \"testing included\".\n- [[term:uat]] support and bug fixing after UAT.\n- Deployment, store submission and [[term:go-live]].\n- [[term:hypercare]] and [[term:knowledge-transfer]].\n- Project management and meetings.\n\nIf a line is missing, it is free work.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A Laravel and React booking platform for a UK physiotherapy clinic chain, proposed as a fixed bid.**\n\nThe tech lead sends a single number: 820 hours. The PM asks three questions.\n\n1. **\"Can I see the range per feature?\"** The tech lead re-estimates in three points. Most features are tight. The integration with the clinics' existing practice-management system is 30 / 60 / 180 hours: nobody has seen its API.\n2. **\"What is missing?\"** The PM's coverage check finds no line for UAT support or for the second payment flow BD mentioned on a call. The tech lead adds 40 hours for UAT support. BD confirms the second payment flow is out of scope, and the PM makes sure it is listed as an exclusion.\n3. **\"What has to be true for 60 hours?\"** Answer: the system has a documented REST API and the client provides sandbox access by week 3. Those become written [[term:assumption]]s in the SOW, with a note that a different integration route will be a [[term:change-request]].\n\nBD now prices from a range with named assumptions instead of a single number. The integration risk is visible to everyone, including the client.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Single-number estimates.** Recover: ask for three points on the biggest or least-known items.\n- **Cutting hours to hit a price without cutting scope.** Recover: offer BD a scope cut or a phase 2, not a lower number for the same work.\n- **Assumptions only in the spreadsheet.** Recover: copy every client-facing assumption and exclusion into the proposal and SOW.\n- **Using contingency to absorb changes.** Recover: contingency covers uncertainty inside agreed scope. New scope is a CR.\n- **Re-estimating in front of the client.** Recover: say you will confirm in writing after checking with the tech lead.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Every deliverable and platform has a line.\n2. QA, UAT support, deployment, hypercare and PM time are included.\n3. Uncertain items have three-point ranges.\n4. The assumptions behind the biggest ranges are written for the client.\n5. Exclusions are listed in the proposal.\n6. The contingency approach is agreed internally and not used for changes.",
        },
      ],
      sop: [
        {
          title: "Estimation template and approval",
          prompt: "[Oyelabs SOP – admin to fill] Link the Oyelabs estimation sheet, the standard non-development lines (PM, QA, DevOps, UAT support), how contingency is set, and who approves an estimate before BD prices it.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a02-estimation-support-q1",
          prompt: "Who owns the effort estimate on a custom project, and what is the PM's role?",
          options: [
            "The tech lead owns it; the PM checks coverage, assumptions and ranges",
            "The PM owns it; the tech lead only reviews",
            "BD owns it and sets the hours to match the price",
            "The client owns it",
          ],
          correctIndex: 0,
          explanation: "The people who do the technical work estimate it. The PM makes the estimate complete and honest. See the RACI in the stage card.",
        },
        {
          id: "pmp-a02-estimation-support-q2",
          prompt: "Which lines are commonly missing from agency estimates? (Select all that apply.)",
          options: ["UAT support and fixes after UAT", "Store submission and go-live", "Project management time", "The core feature list"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Features are rarely forgotten. The surrounding work is, and it becomes unpaid effort on a fixed bid.",
        },
        {
          id: "pmp-a02-estimation-support-q3",
          prompt: "An integration is estimated at 30 / 60 / 180 hours (optimistic / most likely / pessimistic). What does the wide range tell you?",
          options: [
            "There is a big unknown; find and write down the assumption behind it",
            "The developer is inexperienced",
            "Use the optimistic number to win the deal",
            "Nothing; ranges are always wide",
          ],
          correctIndex: 0,
          explanation: "A wide range marks uncertainty. Naming the assumption lets you test it or protect it in the SOW.",
        },
        {
          id: "pmp-a02-estimation-support-q4",
          prompt: "BD says the client's budget is 20% below the estimate and asks the tech lead to \"sharpen the numbers\". What is the PM's best input?",
          options: [
            "Propose cutting or phasing scope to fit the budget instead of lowering the hours for the same work",
            "Agree and cut 20% from every line",
            "Remove QA to save time",
            "Say nothing; pricing is BD's job",
          ],
          correctIndex: 0,
          explanation: "Lowering hours without lowering scope just moves the overrun into delivery. A smaller scope or a phase 2 keeps the plan honest.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a02-estimation-support-q5",
          prompt: "What does the cone of uncertainty say about early estimates?",
          options: [
            "Before requirements are settled, estimates can be off by a large factor, and they narrow as decisions are made",
            "Early estimates are always accurate",
            "Estimates get less accurate over time",
            "It only applies to construction projects",
          ],
          correctIndex: 0,
          explanation: "Commonly cited ranges are about 0.25x to 4x at the very start. That is why discovery and written assumptions matter before a fixed price.",
        },
        {
          id: "pmp-a02-estimation-support-q6",
          prompt: "The team plans sprints in story points. The client asks you to convert last sprint's points to hours to check the invoice. What do you do?",
          options: [
            "Explain that points are a relative planning tool; report the hours from timesheets if the contract bills by hours",
            "Multiply points by 8",
            "Refuse to discuss hours",
            "Change the points so they match the invoice",
          ],
          correctIndex: 0,
          explanation: "Points are not hours. Billing evidence comes from the commercial model: timesheets for T&M, milestones for fixed bid.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a02-estimation-support-q7",
          prompt: "In sprint 5 the client asks for a new report. The project still has unused contingency. Can you use contingency to build it?",
          options: [
            "No: contingency covers uncertainty in agreed scope; a new report is a change that goes through the CR process",
            "Yes, that is what contingency is for",
            "Yes, if the developer agrees",
            "Only if the client asks twice",
          ],
          correctIndex: 0,
          explanation: "Spending contingency on new scope hides changes and leaves nothing for the real risks still ahead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a02-estimation-support-q8",
          prompt: "Where should the client-facing assumptions behind an estimate end up?",
          options: ["In the proposal and SOW, so the client agrees to them", "Only in the internal spreadsheet", "In the developers' notes", "Nowhere; they are internal"],
          correctIndex: 0,
          explanation: "An assumption the client never saw cannot justify a CR when it proves false.",
        },
        {
          id: "pmp-a02-estimation-support-q9",
          prompt: "Which questions help turn a single-number estimate into a useful one? (Select all that apply.)",
          options: [
            "What is the range for the least-known items?",
            "What has to be true for the most likely number?",
            "What is excluded?",
            "Can you make it smaller so the client is happy?",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Range, assumptions and exclusions make an estimate defensible. Asking for a smaller number for its own sake does not.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "The tech lead gave three-point estimates in hours for four features of a fixed-bid booking platform. Use the PERT formula: expected = (optimistic + 4 x most likely + pessimistic) / 6, and standard deviation = (pessimistic - optimistic) / 6. Round to the nearest whole hour where needed.",
        table: {
          columns: ["Feature", "Optimistic (h)", "Most likely (h)", "Pessimistic (h)"],
          rows: [
            ["Booking flow", "40", "60", "110"],
            ["Stripe payments", "16", "24", "50"],
            ["Practice-system integration", "30", "60", "180"],
            ["Admin panel", "50", "70", "108"],
          ],
        },
        fields: [
          { id: "integration", label: "PERT expected hours for the practice-system integration", unit: "h", answer: 75, tolerance: 0.5, expression: "(T[2][1] + 4*T[2][2] + T[2][3]) / 6" },
          {
            id: "total",
            label: "PERT expected hours for all four features",
            unit: "h",
            answer: 240,
            tolerance: 0.5,
            expression: "(T[0][1] + 4*T[0][2] + T[0][3] + T[1][1] + 4*T[1][2] + T[1][3] + T[2][1] + 4*T[2][2] + T[2][3] + T[3][1] + 4*T[3][2] + T[3][3]) / 6",
          },
          {
            id: "gap",
            label: "How many hours above the sum of the 'most likely' figures is the PERT total?",
            unit: "h",
            answer: 26,
            tolerance: 0.5,
            expression: "(T[0][1] + 4*T[0][2] + T[0][3] + T[1][1] + 4*T[1][2] + T[1][3] + T[2][1] + 4*T[2][2] + T[2][3] + T[3][1] + 4*T[3][2] + T[3][3]) / 6 - (T[0][2] + T[1][2] + T[2][2] + T[3][2])",
          },
          { id: "sd", label: "Standard deviation of the integration estimate", unit: "h", answer: 25, tolerance: 0.5, expression: "(T[2][3] - T[2][1]) / 6" },
        ],
        explanation:
          "Integration: (30 + 240 + 180) / 6 = 75. The four features: 65 + 27 + 75 + 73 = 240. The 'most likely' figures sum to 214, so a plan built only on them is 26 hours short of the expected value. The integration's standard deviation of 25 hours is by far the largest: that is the assumption to test and write into the SOW.",
      },
    },
    {
      id: "pmp-a02-milestone-billing",
      moduleId: "pmp-a02",
      trackId: "pm",
      title: "Milestone billing and payment triggers",
      summary:
        "On most [[term:fixed-bid]] projects the agency is paid in parts: an [[term:advance-payment]] at signing, then payments tied to [[term:milestone]]s. That is [[term:milestone-billing]]. The PM does not raise invoices, but the PM's work decides when they can be raised.\n\nWhy it matters at an agency: cash flow follows acceptance. If a milestone's trigger is vague (\"development complete\"), the client can delay acceptance and the payment with it. If the plan does not line up with the billing schedule, the team can deliver 80% of the work while only 30% is paid.\n\nHow to do it:\n\n- At handover, map each payment in the [[term:sow]] to a deliverable and a clear acceptance event, ideally a written [[term:sign-off]].\n- Plan so milestones are reached in order and evidence is ready: sign-off documents, demo recordings, the build reference.\n- Tell finance or BD the day a milestone is accepted, so the [[term:invoice]] goes out on time.\n- Watch for [[term:late-payment]] and raise it early with BD, before the team commits more work.\n\nSplits vary by contract. A common pattern is an advance, payments on design approval, UAT sign-off and go-live, and sometimes a holdback until [[term:warranty]] ends. Treat this as an example, not a norm, and follow the signed contract.\n\nThe common mistake is letting a milestone drift into \"almost done\" for weeks. Partial completion usually pays nothing.",
      level: "expert",
      estMinutes: 45,
      isMilestone: true,
      webRefs: [
        { label: "Microsoft Learn (Project Operations): Invoice schedules and fixed-price milestones on a contract line", url: "https://learn.microsoft.com/en-us/dynamics365/project-operations/pro/sales/invoice-schedules-contract-line-sales", kind: "docs", verifiedAt: "2026-10-02T12:01:23Z" },
        { label: "Microsoft Learn (Project Operations): Manage the project billing backlog", url: "https://learn.microsoft.com/en-us/dynamics365/project-operations/pro/proforma-invoicing/manage-billing-backlog-sales", kind: "docs", verifiedAt: "2026-10-02T12:01:23Z" },
        { label: "GOV.UK: Invoices - what they must include", url: "https://www.gov.uk/invoicing-and-taking-payment-from-customers/invoices-what-they-must-include", kind: "docs", verifiedAt: "2026-10-02T12:05:27Z" },
        { label: "Acquisition.gov: FAR 16.202-1 Firm-fixed-price contracts", url: "https://www.acquisition.gov/far/16.202-1", kind: "spec", verifiedAt: "2026-10-02T11:51:29Z" },
      ],
      video: {
        title: "How to manage a milestone contract",
        channel: "RemotePass",
        url: "https://www.youtube.com/watch?v=8T58rXkcVWM",
        videoId: "8T58rXkcVWM",
        verifiedAt: "2026-10-02T12:16:58Z",
      },
      alternateVideos: [
        {
          title: "Progress vs. Milestone Billing: Why It Matters | Cash Flow, Billing & Collections",
          channel: "The Construction CPA",
          url: "https://www.youtube.com/watch?v=m78TqF7PGf8",
          videoId: "m78TqF7PGf8",
          verifiedAt: "2026-10-02T12:16:58Z",
        },
      ],
      handbook: { stages: ["custom-estimation"], rules: ["uat-signoff-before-golive", "billing-change-request", "cr-approval"], templates: ["requirement-signoff", "uat-signoff"] },
      sections: [
        {
          heading: "Good and bad payment triggers",
          body:
            "A good trigger is an event both sides can see and date.\n\n**Good**\n- \"On written approval of the designs for all screens in Annex A.\"\n- \"On written UAT [[term:sign-off]] of milestone 2.\"\n- \"On production [[term:go-live]].\"\n\n**Bad**\n- \"On completion of development.\" Who decides it is complete?\n- \"When the app is ready.\" Ready for what?\n- \"Monthly progress payments\" on a fixed bid with no defined progress measure.\n\nIn finance systems such as Microsoft Project Operations, a fixed-price milestone becomes invoiceable only when someone marks it ready to invoice. In practice that someone needs evidence, and the PM provides it.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A fixed-bid Flutter and Laravel loyalty app for a coffee chain in Bahrain.** The SOW has five payments. The split below is an example from this deal, not a standard.\n\n- 20% advance at signing.\n- 20% on design approval.\n- 25% on UAT sign-off of the customer app.\n- 25% on go-live.\n- 10% at the end of the warranty period.\n\nAt handover the PM maps each to the plan. Two problems appear. First, the plan puts design approval in week 6, but discovery will likely run into week 4, so the PM asks the client at kickoff for named reviewers and a 3-day review turnaround, and records it in the MoM. Second, \"go-live\" depends on App Store approval, which the client's account owner controls. The PM logs a [[term:client-dependency]]: the client's Apple developer account must be active by week 10.\n\nDuring delivery the client says, \"The designs are fine, but let's do sign-off after we see the app.\" The PM explains, politely, that design approval is a milestone in the SOW and that development is planned on approved designs. The client signs. The PM emails BD the signed approval the same day and the invoice goes out that week.",
        },
        {
          heading: "When a milestone is stuck",
          body:
            "A milestone sits at \"almost done\" for weeks. Find out which kind of stuck it is:\n\n- **Our work is not finished.** Treat it as a schedule issue. Re-plan honestly and tell the client.\n- **The client will not review.** Remind them of the acceptance window in the SOW, in writing. Escalate through the [[term:escalation-matrix]] if it continues.\n- **The client found defects.** Fix those against the signed requirements. Separate them from new requests, which go through the CR process.\n- **The client links acceptance to a new request.** Acceptance is against the agreed scope. The new request is a [[term:change-request]] with its own approval.\n\nIn every case, tell BD early. Payment decisions such as pausing work belong to BD and management, not the PM alone.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Not knowing the billing schedule.** Recover: put every payment trigger in the project plan as a milestone.\n- **Accepting verbal approval.** Recover: send a short written sign-off request and keep the reply.\n- **Delivering ahead of payment by many weeks.** Recover: raise it with BD before starting the next milestone.\n- **Mixing CRs into milestone acceptance.** Recover: keep a separate CR log, each with its own price and payment terms.\n- **Telling the client yourself that work will stop.** Recover: leave payment enforcement to BD and management.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Every payment in the SOW is a milestone in my plan.\n2. Each has a clear, written acceptance event.\n3. Client dependencies that block a milestone have dates.\n4. I tell BD or finance the same day a milestone is accepted.\n5. Stuck milestones are diagnosed and escalated early.\n6. CRs are billed separately from milestones.",
        },
      ],
      sop: [
        {
          title: "Telling finance a milestone is accepted",
          prompt: "[Oyelabs SOP – admin to fill] How the PM notifies finance or BD that a milestone is accepted (channel, evidence to attach), and the process when a client payment is late.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a02-milestone-billing-q1",
          prompt: "Which is the strongest milestone payment trigger?",
          options: [
            "\"On written UAT sign-off of the customer app by the client's named product owner.\"",
            "\"On completion of development.\"",
            "\"When the app is ready.\"",
            "\"At the PM's discretion.\"",
          ],
          correctIndex: 0,
          explanation: "It names an observable event, a document and a person. The others can be argued indefinitely.",
        },
        {
          id: "pmp-a02-milestone-billing-q2",
          prompt: "The client says, \"Designs are fine, but we'll sign off after we see the working app.\" Design approval is a paid milestone. What do you do?",
          options: [
            "Explain politely that design approval is an agreed milestone and that development is built on approved designs; ask for written approval",
            "Agree and start development without approval",
            "Stop all work immediately",
            "Ask BD to cancel the contract",
          ],
          correctIndex: 0,
          explanation: "Building on unapproved designs risks rework and delays payment. Explain the reason calmly and get it in writing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a02-milestone-billing-q3",
          prompt: "UAT for milestone 2 is complete, except the client refuses to sign until a new reporting feature is added. What is the right handling? (Select all that apply.)",
          options: [
            "Separate acceptance of the agreed scope from the new request",
            "Raise the reporting feature as a CR with its own estimate and approval",
            "Tell BD early, because the payment is affected",
            "Build the feature free so they sign",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Acceptance is against agreed scope. New requests go through the CR process. BD needs to know when cash is at risk.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a02-milestone-billing-q4",
          prompt: "Go-live is a payment milestone, but it depends on App Store approval in the client's account. How should you treat it?",
          options: [
            "Log the client's account and approval as a client dependency with a date, and plan submission early",
            "Ignore it; stores always approve",
            "Publish under the Oyelabs account to save time",
            "Remove go-live from the plan",
          ],
          correctIndex: 0,
          explanation: "Things outside your control that gate a payment must be visible early, with owners and dates.",
        },
        {
          id: "pmp-a02-milestone-billing-q5",
          prompt: "Who normally decides whether to pause work because of a late payment?",
          options: ["BD and management, based on the contract", "The PM alone", "The developers", "The client SPOC"],
          correctIndex: 0,
          explanation: "It is a commercial decision with legal consequences. The PM flags it early and follows the decision.",
        },
        {
          id: "pmp-a02-milestone-billing-q6",
          prompt: "A fixed-bid contract has 10% held until the end of warranty. What does the PM need to track for it?",
          options: [
            "When warranty started and ends, and that warranty work is completed, so the final payment can be claimed",
            "Nothing; finance handles it",
            "The number of story points delivered",
            "The client's satisfaction score only",
          ],
          correctIndex: 0,
          explanation: "The holdback is released by an event the PM controls the evidence for: the warranty period and its open defects.",
        },
        {
          id: "pmp-a02-milestone-billing-q7",
          prompt: "Your team has finished 80% of the build, but only the 20% advance has been paid because the design-approval milestone was never signed. What went wrong, and what now?",
          options: [
            "The PM let a milestone drift; get the design approval signed now and tell BD about the cash gap before starting the next milestone",
            "Nothing went wrong; payments come at the end",
            "The developers worked too fast",
            "Invoice the full amount anyway",
          ],
          correctIndex: 0,
          explanation: "Delivering far ahead of payment is a commercial risk. Recover the missing approval and make the gap visible to BD.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a02-milestone-billing-q8",
          prompt: "Which of these should appear on the project plan? (Select all that apply.)",
          options: ["Each payment milestone and its acceptance event", "The client's review windows", "Client dependencies that block milestones", "The invoice bank details"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Milestones, review windows and blocking dependencies drive the schedule. Bank details belong on the invoice.",
        },
        {
          id: "pmp-a02-milestone-billing-q9",
          prompt: "How should an approved CR usually be billed on a fixed-bid project?",
          options: [
            "Separately, with its own price and payment terms as stated in the approved CR",
            "Added silently to the next milestone",
            "Never; CRs are free",
            "By increasing the warranty holdback",
          ],
          correctIndex: 0,
          explanation: "Keeping CRs separate keeps milestone acceptance clean. Follow the billing rule for CRs in the handbook card and the contract.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "A fixed-bid React and Laravel portal for an insurance broker in Nigeria. Payments: 25% advance (paid), 25% on design approval (paid), 30% on UAT sign-off, 20% on go-live. The SOW gives the client 7 business days to respond in UAT. UAT started 15 business days ago. The client's SPOC has logged 6 defects (all fixed and retested) and 3 new requests. No sign-off has arrived and the SPOC has stopped replying.",
        steps: [
          {
            id: "s1",
            question: "What is your first move?",
            options: [
              "Email the SPOC and sponsor in writing: defects are fixed, list them, remind them of the acceptance window, and ask for sign-off or remaining defects by a date",
              "Start production deployment without sign-off",
              "Build the 3 new requests so they sign",
              "Wait another two weeks",
            ],
            correctIndex: 0,
            explanation: "A clear written request with evidence and a date is the first step. Deploying without sign-off breaks the UAT rule; building requests free sets a bad precedent.",
          },
          {
            id: "s2",
            question: "The sponsor replies: \"We will sign once the 3 new requests are in.\" What now?",
            options: [
              "Separate them: UAT acceptance is against agreed scope; send CRs with estimates for the 3 requests and ask for sign-off of the agreed scope",
              "Agree and add them to milestone 3 at no cost",
              "Tell the sponsor the contract forbids changes",
              "Cancel the requests without discussion",
            ],
            correctIndex: 0,
            explanation: "Linking acceptance to new scope is common pressure. Keep acceptance and CRs separate and offer the client a priced path for what they want.",
          },
          {
            id: "s3",
            question: "A week later there is still no sign-off and the 30% payment is overdue. Who decides what happens commercially, and what is your part?",
            options: [
              "BD and management decide, based on the contract; you give them the timeline, evidence and status today",
              "You announce to the client that work stops tomorrow",
              "The developers decide whether to keep working",
              "Nobody; keep going and hope",
            ],
            correctIndex: 0,
            explanation: "Enforcement is a commercial decision. The PM's job is to make sure decision-makers have the facts early and in writing.",
          },
        ],
      },
    },
  ],
} satisfies Module;
