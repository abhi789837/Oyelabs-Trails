import type { Module } from "@/types/curriculum";

export default {
  id: "pm-intermediate",
  trackId: "pm",
  name: "PM foundations and advanced theory: Running delivery",
  description:
    "The week-to-week machinery of delivering client work: sprint planning, estimation and velocity, backlog prioritisation, change control, RAID logs, stakeholders and RACI, the agency's commercial models, QA and UAT, releases, retrospectives and client expectations. Written for PMs who already know the vocabulary and now have to protect scope, margin and trust on fixed-bid and T&M projects that include AI features.",
  refs: [
    { label: "The Scrum Guide (November 2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec" },
    { label: "PMI: PMBOK Guide (8th edition) overview", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
    { label: "Atlassian Agile Coach: Scrum", url: "https://www.atlassian.com/agile/scrum", kind: "article" },
  ],
  topics: [
    {
      id: "pm-i-sprint-planning",
      moduleId: "pm-intermediate",
      trackId: "pm",
      title: "Sprint Planning That Holds Up",
      summary:
        "Sprint Planning turns an ordered backlog into a plan the team believes in. The 2020 Scrum Guide frames it as three topics: why this Sprint is valuable (the Sprint Goal), what can be done (the Developers select items from the Product Backlog), and how the work will get done (decomposing items into a plan). The Sprint Goal is the part most agency teams skip, and it is the most useful: it gives the team a reason to make trade-offs mid-sprint without renegotiating every ticket.\n\nThe main input is capacity, not optimism. Start from the people actually available: holidays, the developer who is half on another client, the QA engineer shared across three projects, and the time lost to meetings and support. Past velocity tells you what the team usually completes; capacity tells you what this sprint allows. Mike Cohn argues for committing based on a task-level, hours-based check rather than story points alone, using velocity for longer-range forecasting. Either way, the Developers decide how much to take on; a plan imposed by the PM is a wish, not a commitment.\n\nAgency specifics: client dependencies (API credentials, content, data exports, design sign-off) must be confirmed before a story enters the sprint, or the sprint fails for reasons the team cannot control. AI work needs its spikes and evaluation time planned explicitly; 'tune the prompts' expands to fill whatever time is available.\n\nThe gotcha is planning to 100% or more of capacity. Unplanned work always arrives (a production bug, a client call, a review that bounces), so a sprint planned at full capacity is a sprint that will miss its goal. Leave slack and make the Sprint Goal achievable with a subset of the selected items.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "The Scrum Guide: Sprint Planning", url: "https://scrumguides.org/scrum-guide.html", kind: "spec" },
        { label: "Jira Cloud support: What is a sprint?", url: "https://support.atlassian.com/jira-software-cloud/docs/what-is-a-sprint/", kind: "docs" },
        { label: "Atlassian: Sprint planning", url: "https://www.atlassian.com/agile/scrum/sprint-planning", kind: "article" },
        {
          label: "Mountain Goat Software: Why I don't use story points for sprint planning",
          url: "https://www.mountaingoatsoftware.com/agile/why-i-dont-use-story-points-for-sprint-planning",
          kind: "article",
        },
      ],
      video: {
        title: "What is Sprint Planning in Scrum?",
        channel: "The Agile Shop",
        url: "https://www.youtube.com/watch?v=R7oXgtPOj74",
        videoId: "R7oXgtPOj74",
        durationLabel: "2:45",
      },
      alternateVideos: [
        {
          title: "What Is Sprint Planning in Agile ? | Sprint Planning Meeting in Agile Explained | Simplilearn",
          channel: "Simplilearn",
          url: "https://www.youtube.com/watch?v=iMnhzjhkdXM",
          videoId: "iMnhzjhkdXM",
          durationLabel: "5:43",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-i-sprint-planning-q1",
          prompt: "Which three topics does Sprint Planning address in the 2020 Scrum Guide? (Select all that apply.)",
          options: [
            "Why is this Sprint valuable?",
            "What can be Done this Sprint?",
            "How will the chosen work get done?",
            "Who is to blame if the Sprint fails?",
            "How much will the client be invoiced?",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Why, what and how: the Sprint Goal, the selected items, and the plan for delivering them. Invoicing is a commercial matter outside Scrum.",
        },
        {
          id: "pm-i-sprint-planning-q2",
          prompt: "Who decides how many items are selected for the Sprint?",
          options: [
            "The Developers, after discussing with the Product Owner",
            "The PM, based on the delivery deadline",
            "The Product Owner alone",
            "The client sponsor",
          ],
          correctIndex: 0,
          explanation:
            "The Guide says the Developers select items, because they know their capacity and past performance. A PO can propose and order; a PM who sets the number turns the forecast into a wish.",
        },
        {
          id: "pm-i-sprint-planning-q3",
          prompt:
            "A team's average velocity is 30 points. Next sprint, one of five developers is on leave for the whole sprint and another is half on a different client. What is a sensible starting forecast?",
          options: ["About 21 points", "30 points", "36 points, to catch up", "15 points"],
          correctIndex: 0,
          explanation:
            "Capacity drops from 5 to 3.5 developers, 70% of normal, so about 21 points. Planning 30 ignores the absence, and planning above average to 'catch up' almost guarantees a miss.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-sprint-planning-q4",
          prompt: "Why is a Sprint Goal more than a list of the selected tickets?",
          options: [
            "It states the outcome, so the team can negotiate scope with the PO mid-sprint and still achieve it",
            "It is a contractual promise to deliver every ticket",
            "It is required for the burndown chart to work",
            "It replaces acceptance criteria",
          ],
          correctIndex: 0,
          explanation:
            "The Guide says that if work turns out different than expected, the Developers collaborate with the PO to negotiate the scope of the Sprint Backlog without affecting the Sprint Goal. A ticket list gives no basis for that trade-off.",
        },
        {
          id: "pm-i-sprint-planning-q5",
          prompt:
            "A story needs the client's production payment-gateway credentials, which they 'will send soon'. Should it go into the sprint?",
          options: [
            "Only if the credentials arrive before planning, or the story can be completed against a sandbox with the swap tracked separately",
            "Yes; the developer can wait",
            "Yes, and mark the sprint as failed if they do not arrive",
            "No, and remove it from the backlog permanently",
          ],
          correctIndex: 0,
          explanation:
            "Unconfirmed external dependencies are the commonest reason agency sprints fail. Either resolve the dependency first or reshape the story so it is not blocked.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-sprint-planning-q6",
          prompt: "What is the maximum timebox for Sprint Planning in a one-month Sprint?",
          options: ["Eight hours", "Two hours", "Four hours", "One full day per week of the Sprint"],
          correctIndex: 0,
          explanation:
            "The Guide sets eight hours for a one-month Sprint, and it is usually shorter for shorter Sprints.",
        },
        {
          id: "pm-i-sprint-planning-q7",
          prompt: "A sprint includes 'improve the AI assistant's answers'. What is the problem, and the fix?",
          options: [
            "It is open-ended; define a measurable target on an evaluation set and a timebox",
            "Nothing; AI tuning cannot be planned",
            "It should be estimated at the maximum number of points",
            "It should be done by the PM to save developer time",
          ],
          correctIndex: 0,
          explanation:
            "Prompt and model tuning expands to fill any time available. A target (for example, 85% on the agreed test set) and a timebox make it plannable and reviewable.",
        },
        {
          id: "pm-i-sprint-planning-q8",
          prompt: "Why should a sprint not be planned at 100% of available hours?",
          options: [
            "Unplanned work such as production bugs, reviews and client calls always takes some capacity",
            "Because the Scrum Guide sets a maximum of 80%",
            "Because developers should not work full days",
            "It should; any slack is wasted money for the client",
          ],
          correctIndex: 0,
          explanation:
            "Slack absorbs the unplanned work that always arrives. The 80% figure is a common rule of thumb, not a Scrum Guide rule.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-sprint-planning-q9",
          prompt: "Mike Cohn argues against using story points to decide the sprint commitment. What does he suggest instead?",
          options: [
            "Commit based on breaking items into tasks and checking them against available hours, and use velocity for longer-term planning",
            "Commit based on the client's deadline",
            "Commit to as many points as last sprint plus 10%",
            "Do not plan sprints at all",
          ],
          correctIndex: 0,
          explanation:
            "His point is that velocity is too variable sprint to sprint for a precise commitment, but averages out over a release, where it is useful.",
        },
      ],
      practice: {
        kind: "spot",
        prompt: "Here is the sprint plan the PM shared for Sprint 6 of a client's AI tutoring app. Mark the lines that make this plan unreliable.",
        segments: [
          { id: "s1", text: "Sprint 6, two weeks, 10 working days.", issue: null },
          {
            id: "s2",
            text: "Sprint Goal: complete tickets TUT-41 to TUT-58.",
            issue: "This is a ticket list, not an outcome; it gives the team nothing to trade off against.",
          },
          { id: "s3", text: "Team: four developers, one QA engineer, one designer.", issue: null },
          {
            id: "s4",
            text: "Planned: 52 points (average velocity over the last three sprints: 38).",
            issue: "Planned well above demonstrated velocity, with no reason given.",
          },
          {
            id: "s5",
            text: "Kofi's leave on days 6 to 10 is not reflected, as he can catch up later.",
            issue: "Known absence ignored; capacity is overstated.",
          },
          { id: "s6", text: "TUT-44 (lesson summary) has acceptance criteria and an evaluation set of 50 questions.", issue: null },
          {
            id: "s7",
            text: "TUT-50 depends on the client's curriculum export, which they expect to send mid-sprint.",
            issue: "Unconfirmed client dependency inside the sprint.",
          },
          {
            id: "s8",
            text: "The PM has assigned every ticket to a named developer.",
            issue: "The Developers should plan how the work gets done; pre-assignment kills swarming and ownership.",
          },
          { id: "s9", text: "QA time is reserved for regression testing on days 9 and 10.", issue: null },
          { id: "s10", text: "Sprint Review with the client is booked for day 10 at 15:00.", issue: null },
          { id: "s11", text: "A production support rota covers bugs from the live v1 app.", issue: null },
          { id: "s12", text: "Plan approved by the client before the team discussed it.", issue: "The Developers never agreed to the plan; it is the PM's wish, not their forecast." },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pm-i-estimation-story-points-velocity",
      moduleId: "pm-intermediate",
      trackId: "pm",
      title: "Estimation: Story Points, Planning Poker & Velocity",
      summary:
        "Estimates exist to support decisions: what fits in a release, whether a deadline is realistic, what to quote. Story points are a relative measure of the overall effort, complexity and uncertainty of an item compared with others the team has done. They work because people are much better at comparing ('twice as big as the login story') than at predicting hours, and because they absorb the speed differences between team members.\n\nPlanning poker, popularised by Mike Cohn, has each estimator reveal a card at the same time, usually on a modified Fibonacci scale (1, 2, 3, 5, 8, 13, 20...). The simultaneous reveal stops anchoring on the loudest voice, and the discussion between the highest and lowest estimates is the real value: it surfaces assumptions nobody had stated. Velocity is the points the team completes per sprint; averaged over several sprints it becomes a forecasting tool, ideally as a range rather than a single number.\n\nThe agency problem is that clients buy hours and dates, not points. Points are a team's internal currency: you convert them to a date range for a release forecast and to hours for a quote, and the conversion should carry the uncertainty with it. AI work is especially uncertain. If a team cannot size 'extract fields from contracts', the honest move is a timeboxed spike, then an estimate.\n\nThe classic gotchas: comparing velocity between teams (points are not a shared unit), using velocity as a productivity target (it inflates immediately), counting partly finished stories, and re-estimating completed work. When velocity becomes a KPI, it stops being a forecast.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        {
          label: "Jira Cloud support: View and understand the velocity chart",
          url: "https://support.atlassian.com/jira-software-cloud/docs/view-and-understand-the-velocity-chart/",
          kind: "docs",
        },
        { label: "Mountain Goat Software: What are story points?", url: "https://www.mountaingoatsoftware.com/agile/what-are-story-points", kind: "article" },
        { label: "Mountain Goat Software: Planning poker", url: "https://www.mountaingoatsoftware.com/agile/story-points/planning-poker", kind: "article" },
        { label: "Atlassian: Agile estimation", url: "https://www.atlassian.com/agile/project-management/estimation", kind: "article" },
      ],
      video: {
        title: "What Are Story Points in Agile? (Agile Estimation Explained)",
        channel: "Mountain Goat Software: Agile & Scrum Mastery",
        url: "https://www.youtube.com/watch?v=VsSaolMtkKU",
        videoId: "VsSaolMtkKU",
        durationLabel: "6:18",
      },
      alternateVideos: [
        {
          title: "Planning Poker Explained: How Agile Teams Estimate Story Points",
          channel: "Mountain Goat Software: Agile & Scrum Mastery",
          url: "https://www.youtube.com/watch?v=gE7srp2BzoM",
          videoId: "gE7srp2BzoM",
          durationLabel: "5:32",
        },
        {
          title: "Agile   Velocity and Capacity Planning Relationship",
          channel: "Ajeet SD",
          url: "https://www.youtube.com/watch?v=QcVzdDO3YXE",
          videoId: "QcVzdDO3YXE",
          durationLabel: "6:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-i-estimation-story-points-velocity-q1",
          prompt: "What do story points measure?",
          options: [
            "The relative size of an item, combining effort, complexity and uncertainty, compared with other items",
            "The exact number of hours an item will take",
            "How valuable an item is to the client",
            "How many developers will work on the item",
          ],
          correctIndex: 0,
          explanation:
            "Points are relative and blend effort, complexity and risk. Value is a separate dimension used for prioritisation, and points deliberately avoid being hours.",
        },
        {
          id: "pm-i-estimation-story-points-velocity-q2",
          prompt: "Why do planning poker players reveal their cards at the same time?",
          options: [
            "To avoid anchoring on the first or most senior person's estimate",
            "To save time",
            "Because the average is used directly as the estimate",
            "So the PM can see who is slowest",
          ],
          correctIndex: 0,
          explanation:
            "Simultaneous reveal keeps estimates independent; then the high and low estimators explain their thinking, which surfaces hidden assumptions. The average is not simply taken.",
        },
        {
          id: "pm-i-estimation-story-points-velocity-q3",
          prompt:
            "Team A's velocity is 45; team B's is 22. Leadership concludes team A is twice as productive. What is wrong with this?",
          options: [
            "Points are calibrated per team, so velocities cannot be compared across teams",
            "Nothing; points are a standard unit",
            "Team B must be estimating too low and should double its numbers",
            "Velocity can only be compared over a year",
          ],
          correctIndex: 0,
          explanation:
            "Each team's points are relative to its own reference stories. Comparing them invites teams to inflate estimates, which is exactly what happens when B is told to 'catch up'.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-estimation-story-points-velocity-q4",
          prompt: "Which practices damage velocity as a forecasting tool? (Select all that apply.)",
          options: [
            "Setting a velocity target in developers' performance goals",
            "Counting partly finished stories at sprint end",
            "Re-estimating stories after they are done to match actual effort",
            "Averaging velocity over the last several sprints",
            "Forecasting a release as a range",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Targets inflate points, partial credit hides unfinished work, and re-estimation breaks the relative scale. Averaging and ranges are how velocity is meant to be used.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-estimation-story-points-velocity-q5",
          prompt: "In planning poker, one developer shows 3 and another 13 for the same AI story. What should happen next?",
          options: [
            "Both explain their reasoning, the team discusses, and they vote again",
            "Take the average, 8",
            "Take the lower number to keep the client happy",
            "The tech lead's number wins",
          ],
          correctIndex: 0,
          explanation:
            "The gap usually means different assumptions, such as whether the model needs fine-tuning or the data needs cleaning. Discussing it is the point of the exercise.",
        },
        {
          id: "pm-i-estimation-story-points-velocity-q6",
          prompt: "The team cannot estimate 'auto-classify incoming support emails' because nobody has tried it with the client's data. What is the best move?",
          options: [
            "Run a timeboxed spike to learn enough to estimate",
            "Give it the largest card and move on",
            "Ask the client how long they think it should take",
            "Estimate it in hours instead of points",
          ],
          correctIndex: 0,
          explanation:
            "A spike buys information with a fixed cost. A huge number hides the uncertainty instead of reducing it, and changing units does not make the unknown known.",
        },
        {
          id: "pm-i-estimation-story-points-velocity-q7",
          prompt: "How should a PM present a release forecast to a client using velocity?",
          options: [
            "As a range of dates based on the low and high end of recent velocity, with the assumptions stated",
            "As a single date based on the best sprint so far",
            "As a number of story points remaining",
            "As a date with no stated assumptions, to sound confident",
          ],
          correctIndex: 0,
          explanation:
            "A range communicates real uncertainty. Clients do not think in points, and a single best-case date is a promise the team will probably break.",
        },
        {
          id: "pm-i-estimation-story-points-velocity-q8",
          prompt: "Why does a modified Fibonacci scale have bigger gaps between larger numbers?",
          options: [
            "Uncertainty grows with size, so fine distinctions between large items would be false precision",
            "Because large stories are not allowed",
            "To make the arithmetic easier",
            "Because Scrum requires Fibonacci numbers",
          ],
          correctIndex: 0,
          explanation:
            "Telling a 2 from a 3 is realistic; telling a 20 from a 21 is not. The Scrum Guide does not mention story points at all.",
        },
        {
          id: "pm-i-estimation-story-points-velocity-q9",
          prompt: "What does the Jira velocity chart compare for each sprint?",
          options: [
            "The estimate committed at the start of the sprint against what was completed",
            "Hours logged against hours billed",
            "Bugs opened against bugs closed",
            "The client's budget against spend",
          ],
          correctIndex: 0,
          explanation:
            "Atlassian's velocity chart shows commitment versus completed for each sprint, which is useful for spotting over-commitment patterns, not for judging individuals.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Use the team's recent sprints to forecast. Two-week sprints, five developers. Next sprint, one developer is away for 5 of the 10 days. Assume capacity scales with developer-days.",
        table: {
          columns: ["Sprint", "Points completed"],
          rows: [
            ["Sprint 7", "21"],
            ["Sprint 8", "27"],
            ["Sprint 9", "24"],
            ["Remaining release backlog", "168 points"],
          ],
        },
        fields: [
          { id: "avg", label: "Average velocity over the last three sprints", unit: "points", answer: 24, tolerance: 0.01 },
          { id: "sprints", label: "Sprints needed for the remaining backlog at average velocity", unit: "sprints", answer: 7, tolerance: 0.01 },
          { id: "next", label: "Forecast for next sprint, adjusted for the absence", unit: "points", answer: 21.6, tolerance: 0.1 },
        ],
        explanation:
          "The average is (21 + 27 + 24) / 3 = 24. 168 / 24 = 7 sprints, though a range using 21 and 27 (8 to 6.2 sprints) is the honest client message. Next sprint has 45 of 50 developer-days, 90% capacity, so 24 × 0.9 = 21.6 points.",
      },
    },
    {
      id: "pm-i-backlog-prioritisation",
      moduleId: "pm-intermediate",
      trackId: "pm",
      title: "Backlog Prioritisation: MoSCoW, RICE & WSJF",
      summary:
        "Every backlog is longer than the budget, so prioritisation is the real product decision. Frameworks do not make the decision; they make the reasoning explicit so it can be challenged and so the client owns it.\n\n**MoSCoW** (from DSDM, now the Agile Business Consortium) sorts requirements into Must, Should, Could and Won't have this time. Its discipline is the guideline that Must Haves should typically be no more than 60% of the effort, with around 20% as Could Haves, which gives the project contingency. It suits fixed-date or fixed-price agreements, because the Coulds are the pre-agreed things to drop. Its failure mode is everything becoming a Must.\n\n**RICE** (from Intercom) scores Reach × Impact × Confidence ÷ Effort, with impact on a 0.25 to 3 scale and confidence at 100%, 80% or 50%. It suits product teams comparing ideas with user data. The confidence term is underused and valuable: an AI feature nobody has prototyped deserves 50%, not 100%.\n\n**WSJF** (Weighted Shortest Job First, used in SAFe and drawn from Don Reinertsen's work) divides cost of delay (user and business value, time criticality, risk reduction or opportunity enablement) by job size or duration. It favours small, urgent items and is good at surfacing compliance fixes and risk-reducing work that value-only scoring ignores.\n\nThe gotchas: scores look objective but are only as good as the guesses fed in; scoring scales get gamed once people learn them; and at an agency, the PM must not quietly do the prioritising. Facilitate, show the trade-offs and costs (including LLM running costs), and get the client's Product Owner to own the order.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        {
          label: "Agile Business Consortium (DSDM): MoSCoW prioritisation",
          url: "https://www.agilebusiness.org/resource/what-is-moscow-prioritization/",
          kind: "spec",
        },
        { label: "SAFe: WSJF", url: "https://framework.scaledagile.com/wsjf", kind: "spec" },
        {
          label: "Intercom: RICE prioritization (original article)",
          url: "https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/",
          kind: "article",
        },
        { label: "Atlassian: Prioritization frameworks", url: "https://www.atlassian.com/agile/product-management/prioritization-framework", kind: "article" },
      ],
      video: {
        title: "What is MoSCoW Prioritization Method? Definition, Overview, and Best Practices",
        channel: "ProductPlan",
        url: "https://www.youtube.com/watch?v=pm4GbSRMElc",
        videoId: "pm4GbSRMElc",
        durationLabel: "3:27",
      },
      alternateVideos: [
        {
          title: "What is the RICE Scoring Model?",
          channel: "ProductPlan",
          url: "https://www.youtube.com/watch?v=pzyRafZJ-0M",
          videoId: "pzyRafZJ-0M",
          durationLabel: "4:03",
        },
        {
          title: "WSJF (Weighted Shortest Job First) Backlog Prioritization Framework + Example in Jira",
          channel: "Monday Coffee by Appfire ",
          url: "https://www.youtube.com/watch?v=-HCzJewpEkk",
          videoId: "-HCzJewpEkk",
          durationLabel: "4:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-i-backlog-prioritisation-q1",
          prompt: "In MoSCoW, what does the W stand for in DSDM's definition?",
          options: ["Won't have this time", "Wish list", "Will have later, guaranteed", "Weighted"],
          correctIndex: 0,
          explanation:
            "DSDM defines W as 'Won't have this time': agreed not to be delivered now, though it may come back later. It is not a promise for a later phase.",
        },
        {
          id: "pm-i-backlog-prioritisation-q2",
          prompt: "A client's fixed-bid backlog has 90% of the effort marked as Must Have. What is the risk?",
          options: [
            "There is almost no contingency; any estimate overrun means a Must is missed",
            "None; Must Haves are what the client is paying for",
            "The project will finish early",
            "The Could Haves will be delivered first",
          ],
          correctIndex: 0,
          explanation:
            "DSDM guidance says Musts should typically be no more than 60% of effort, so the Shoulds and Coulds act as the buffer. At 90%, the first surprise breaks the commitment.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-backlog-prioritisation-q3",
          prompt:
            "An AI feature reaches 2,000 users a quarter, has impact 2, confidence 50% and effort 4 person-months. What is its RICE score?",
          options: ["500", "1,000", "2,000", "250"],
          correctIndex: 0,
          explanation:
            "2,000 × 2 × 0.5 ÷ 4 = 500. Forgetting the confidence factor gives 1,000, which is the mistake that makes unproven AI ideas look better than they are.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-backlog-prioritisation-q4",
          prompt: "Which components make up cost of delay in SAFe's WSJF? (Select all that apply.)",
          options: [
            "User and business value",
            "Time criticality",
            "Risk reduction and/or opportunity enablement",
            "Number of developers available",
            "The client's total budget",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Cost of delay combines value, time criticality and risk reduction or opportunity enablement; WSJF divides it by job size or duration. Headcount and budget are not part of the formula.",
        },
        {
          id: "pm-i-backlog-prioritisation-q5",
          prompt: "Two items have the same cost of delay. Item X takes 2 weeks, item Y takes 8 weeks. What does WSJF recommend?",
          options: [
            "Do X first: the same value delivered sooner reduces total delay cost",
            "Do Y first, because bigger items are more important",
            "Do them in parallel",
            "It makes no difference",
          ],
          correctIndex: 0,
          explanation:
            "Doing the shorter job first gets its value flowing earlier while the longer one waits less in total. That is the 'shortest job first' part of the name.",
        },
        {
          id: "pm-i-backlog-prioritisation-q6",
          prompt: "When is MoSCoW a better fit than RICE?",
          options: [
            "When agreeing a fixed scope for a fixed date or price and deciding in advance what can be dropped",
            "When comparing many product ideas using usage data",
            "When there is no deadline at all",
            "When the backlog has only one item",
          ],
          correctIndex: 0,
          explanation:
            "MoSCoW was designed for timeboxed delivery with agreed contingency. RICE shines when comparing ideas with reach and impact data.",
        },
        {
          id: "pm-i-backlog-prioritisation-q7",
          prompt: "Who should own the final backlog order on a client project?",
          options: [
            "The client's Product Owner, with the PM facilitating and making costs and trade-offs visible",
            "The PM, who knows the team best",
            "The tech lead, based on what is technically interesting",
            "Whoever shouts loudest in the review",
          ],
          correctIndex: 0,
          explanation:
            "The client spends the money and lives with the product, so they must own the order. A PM who prioritises silently ends up owning every disappointment.",
        },
        {
          id: "pm-i-backlog-prioritisation-q8",
          prompt: "Why does WSJF often lift compliance and security fixes above flashy features?",
          options: [
            "They score high on time criticality and risk reduction and are often small",
            "Because SAFe ranks compliance items first by rule",
            "Because features never have business value",
            "Because they are cheaper to bill",
          ],
          correctIndex: 0,
          explanation:
            "A small item with a looming deadline and a large risk reduction has a high cost of delay relative to its size. No framework rule forces it; the arithmetic does.",
        },
        {
          id: "pm-i-backlog-prioritisation-q9",
          prompt: "What is the biggest weakness of all scoring frameworks?",
          options: [
            "The scores are only as good as the estimates fed in, and people learn to game the scales",
            "They are too slow to calculate",
            "They require special software",
            "They cannot handle more than ten items",
          ],
          correctIndex: 0,
          explanation:
            "Frameworks make reasoning visible, not correct. Revisit inputs as you learn, and watch for scores drifting upward on favoured items.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "Rank these backlog items by WSJF, highest first. Cost of delay = business value + time criticality + risk reduction/opportunity enablement; WSJF = cost of delay ÷ job size. (BV, TC, RR, size) are given for each item.",
        items: [
          { id: "search", label: "AI semantic search (BV 8, TC 5, RR 3, size 8)" },
          { id: "gdpr", label: "Fix user data export for a regulator deadline (BV 5, TC 13, RR 8, size 3)" },
          { id: "dark", label: "Dark mode (BV 3, TC 1, RR 1, size 2)" },
          { id: "cache", label: "Cache LLM responses to cut API spend (BV 5, TC 3, RR 8, size 2)" },
          { id: "admin", label: "Admin dashboard redesign (BV 8, TC 2, RR 2, size 13)" },
        ],
        correctOrder: ["gdpr", "cache", "dark", "search", "admin"],
        explanation:
          "WSJF scores: data export 26/3 = 8.7; caching 16/2 = 8.0; dark mode 5/2 = 2.5; semantic search 16/8 = 2.0; dashboard 12/13 = 0.9. The two items with the highest business value come last because they are big, and the small, urgent, risk-reducing items rise to the top. That is the behaviour WSJF is designed to produce.",
      },
    },
    {
      id: "pm-i-change-requests-scope-control",
      moduleId: "pm-intermediate",
      trackId: "pm",
      title: "Change Requests & Scope Control",
      summary:
        "Scope creep is rarely one big request. It is twenty small 'can you just' asks, each too minor to argue about, that together eat the margin of a fixed bid and the schedule of everything else. Change control exists to make every change a visible decision: what is being asked, what it costs in time and money, what it displaces, and who approved it. It is not there to say no; it is there to make sure yes has a price.\n\nThe mechanics are simple: a baseline (the signed scope, assumptions and acceptance criteria), a way to log requests, an impact assessment by the PM and tech lead, a decision by someone with authority (a change control board on large programmes, usually the sponsor at an agency), and an update to plan, budget and contract. The hard part is behavioural. PMs avoid raising small changes to keep the relationship warm, then raise a large bill at the end, which damages the relationship far more.\n\nOn agile engagements the picture shifts. Under time and materials the backlog is meant to change, and swapping items of equal size is normal reprioritisation, not a change request. On a fixed bid, the agile instinct to 'welcome changing requirements' collides with a fixed price, so agree up front how swaps work, for example equal-size trades allowed, net additions priced.\n\nAI features generate a special kind of creep: quality creep. 'It should also understand Spanish', 'it should never get a price wrong', 'make it sound more like us' each look like tweaks, but each can mean new evaluation sets, prompt work, a different model or higher API spend. Treat changes to the agreed quality bar exactly like changes to features.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "PMI: PMBOK Guide (8th edition) overview", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
        { label: "Asana: Change control process", url: "https://asana.com/resources/change-control-process", kind: "article" },
        {
          label: "ProjectManager: Change control board roles & processes",
          url: "https://www.projectmanager.com/blog/change-control-board-roles-responsibilities-processes",
          kind: "article",
        },
        { label: "Atlassian: Scope creep", url: "https://www.atlassian.com/work-management/project-management/scope-creep", kind: "article" },
      ],
      video: {
        title: "Project Management Scope Creep: 7 Top Tips To Prevent It!",
        channel: "ProjectManager",
        url: "https://www.youtube.com/watch?v=lKcJW1XqY4E",
        videoId: "lKcJW1XqY4E",
        durationLabel: "7:27",
      },
      alternateVideos: [
        {
          title: "Project Management Scope Creep [MANAGE IT LIKE A PRO]",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=_c-qzFV5yM4",
          videoId: "_c-qzFV5yM4",
          durationLabel: "4:36",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-i-change-requests-scope-control-q1",
          prompt: "What is the main purpose of a change control process?",
          options: [
            "To make every change a visible decision with its cost, impact and approver recorded",
            "To refuse changes so the original plan is protected",
            "To slow clients down so they stop asking",
            "To generate extra invoices",
          ],
          correctIndex: 0,
          explanation:
            "Change control turns requests into decisions; most changes should be accepted, but knowingly. Refusing by default makes the product worse and the client unhappy.",
        },
        {
          id: "pm-i-change-requests-scope-control-q2",
          prompt:
            "On a fixed bid, the PM has absorbed eleven 'tiny' client requests over two months without logging them. Now the team needs two extra weeks. What is the core mistake?",
          options: [
            "No baseline was protected; small changes were neither logged nor priced, so the overrun now looks like the agency's failure",
            "The team estimated badly",
            "The client should have known the requests were extra",
            "The PM should have accepted only ten requests",
          ],
          correctIndex: 0,
          explanation:
            "Unlogged changes leave no record linking the overrun to the client's requests. Logging each one, even at zero cost, creates the paper trail and makes the cumulative impact visible early.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-change-requests-scope-control-q3",
          prompt: "Which should a change request record include? (Select all that apply.)",
          options: [
            "A description of the change and who requested it",
            "Impact on cost, schedule, quality and risk",
            "Options, including what could be swapped out instead",
            "The approver's decision and the date",
            "The developers' personal opinions of the request",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Description, impact, options and decision make the record useful later. Opinions are not evidence, and a CR is a client-facing document.",
        },
        {
          id: "pm-i-change-requests-scope-control-q4",
          prompt:
            "On a time-and-materials engagement, the client swaps a 5-point story for a different 5-point story before the sprint starts. What is this?",
          options: [
            "Normal backlog reprioritisation, not a formal change request",
            "A change request needing sponsor sign-off",
            "Scope creep that must be refused",
            "A contract breach",
          ],
          correctIndex: 0,
          explanation:
            "T&M buys capacity, and reordering the backlog is the PO's job. Formal change control is for changes to the commercial baseline, such as budget or a fixed scope.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-change-requests-scope-control-q5",
          prompt:
            "A fixed-bid AI assistant was accepted at 'English only, 85% on the agreed test set'. The client now asks for Spanish 'since the model already speaks it'. How should the PM treat this?",
          options: [
            "As a change: it needs a Spanish evaluation set, testing, prompt work and possibly more API cost",
            "As free, because the model supports Spanish out of the box",
            "As a bug, because the bot fails in Spanish",
            "As something to try quietly in the current sprint",
          ],
          correctIndex: 0,
          explanation:
            "The model's ability is not the deliverable; a tested, accepted quality level is. A new language changes the quality bar, so it is scope.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-change-requests-scope-control-q6",
          prompt: "Who should approve a change that increases a fixed-bid contract's price?",
          options: [
            "Someone on the client side with budget authority, usually the sponsor",
            "The client's day-to-day product contact, whoever that is",
            "The Oyelabs tech lead",
            "Nobody; small increases can be added to the final invoice",
          ],
          correctIndex: 0,
          explanation:
            "Spend must be approved by someone who can authorise it, in writing. An approval from a contact without budget authority often gets disputed at invoice time.",
        },
        {
          id: "pm-i-change-requests-scope-control-q7",
          prompt: "What is a sensible agreement to make at kick-off for a fixed-bid project run in sprints?",
          options: [
            "Equal-size swaps are allowed through the backlog; net additions are priced through change requests",
            "No changes are allowed after kick-off",
            "Any change is free if requested before the last sprint",
            "Changes are handled informally between developers and the client",
          ],
          correctIndex: 0,
          explanation:
            "This keeps agile flexibility while protecting the price. A total freeze produces a product nobody wants, and informal changes are how margin disappears.",
        },
        {
          id: "pm-i-change-requests-scope-control-q8",
          prompt:
            "The client calls a requested change 'a bug' because 'obviously it should have worked that way'. How does the PM resolve it?",
          options: [
            "Check it against the baseline: the acceptance criteria and signed scope decide whether it is a defect or a change",
            "Accept it as a bug to keep the client happy",
            "Refuse it as a change without checking",
            "Let the developer decide based on effort",
          ],
          correctIndex: 0,
          explanation:
            "A defect is a failure to meet agreed criteria; anything else is new scope. That is why written acceptance criteria matter so much on fixed bids.",
        },
        {
          id: "pm-i-change-requests-scope-control-q9",
          prompt: "When is the best time to raise a small change request with the client?",
          options: [
            "As soon as it is requested, even if the cost is zero, so the cumulative picture stays visible",
            "At the end of the project, all together",
            "Only when changes add up to more than 10% of the budget",
            "Never for small changes; it seems petty",
          ],
          correctIndex: 0,
          explanation:
            "Logging small changes, sometimes with 'no charge this time', is relationship-friendly and builds the record. Batching them at the end produces bill shock.",
        },
        {
          id: "pm-i-change-requests-scope-control-q10",
          prompt: "Which of these is quality creep on an AI feature?",
          options: [
            "'It should never get a product price wrong' added after the 85% accuracy bar was accepted",
            "Fixing a crash that breaks an accepted acceptance criterion",
            "Updating a library for a security patch",
            "Moving a story from one sprint to the next",
          ],
          correctIndex: 0,
          explanation:
            "Raising the quality bar after acceptance is new scope that may need new guardrails, data checks or a different design. Fixing a crash against agreed criteria is a defect.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write the change request summary you will send to the client sponsor for the request below. Include the impact, at least two options and what you need from them.",
        context:
          "Project: fixed-bid mobile app with an AI 'outfit suggestion' feature, $48,000, launch 1 December.\nRequest (from the client's marketing lead in a Slack message): 'Can the AI also suggest outfits from a photo the user uploads? Competitor just launched this.'\nTech lead's assessment: image-based suggestions need a vision-capable model, a new upload flow, storage and moderation for user photos, and a new evaluation set. Estimate 90 hours ($4,500 at the blended rate). Adds about 2 weeks if added to the current plan. Running cost: roughly $0.01–0.02 per suggestion at current API prices, versus $0.002 today.\nAlternative: launch as planned, then build photo suggestions as a phase-2 item starting in December.",
        wordLimit: 260,
        rubric: [
          {
            id: "what",
            label: "Clear description and source",
            description: "States the requested change, who asked and when, and why it falls outside the signed scope.",
            weight: 1,
          },
          {
            id: "impact",
            label: "Full impact",
            description: "Covers cost ($4,500), schedule (about 2 weeks, so launch moves past 1 December), running cost increase, and new risks such as photo privacy and moderation.",
            weight: 2,
          },
          {
            id: "options",
            label: "Real options",
            description: "Gives at least two options, e.g. add now and move launch; launch on time and do phase 2; or swap out equal-size scope. Makes a recommendation.",
            weight: 2,
          },
          {
            id: "decision",
            label: "Decision request",
            description: "Asks the sponsor (who has budget authority) for a decision by a specific date, and notes nothing changes until approved.",
            weight: 1,
          },
        ],
        sampleAnswer:
          "Subject: Change request CR-07: photo-based outfit suggestions. Decision needed by Friday\n\nHi Jordan,\n\nRequest: on 14 Oct, Sam (marketing) asked for outfit suggestions from a user-uploaded photo. The signed scope covers text and preference-based suggestions only, so this is a change.\n\nImpact: about 90 hours ($4,500) for a vision-capable model, a photo upload flow, storage and moderation of user photos, and a new evaluation set. Adding it now moves launch from 1 December to about 15 December. Running cost per suggestion rises from about $0.002 to $0.01–0.02 at current API prices. User photos also add privacy and moderation risk we'd need your policy input on.\n\nOptions:\n1. Add now: +$4,500, launch about 15 December.\n2. Recommended: launch on 1 December as planned and build photo suggestions as phase 2, starting in December.\n3. Swap out equal-size scope (e.g. the style quiz) to hold the date. Price unchanged, but we need your call on what goes.\n\nCould you confirm your choice by Friday 18 Oct? Until then we'll continue with the current plan.\n\nBest,\nAlex",
      },
    },
    {
      id: "pm-i-raid-risk-management",
      moduleId: "pm-intermediate",
      trackId: "pm",
      title: "RAID Logs & Risk Management",
      summary:
        "A RAID log tracks the four things that most often derail a project: **Risks** (uncertain events that may happen), **Assumptions** (things believed true but unproven), **Issues** (problems happening now) and **Dependencies** (things the project needs from others). It exists because these live in people's heads otherwise, and heads go on holiday. The PMBOK Guide treats uncertainty as a performance domain the whole team manages, not a document the PM fills in once.\n\nA useful risk entry has a cause, an event and an effect ('Because the client's product data has no consistent categories, the AI recommendations may be irrelevant, which would fail UAT'), a probability and impact, an owner, and a response: avoid, mitigate, transfer or accept, with a trigger that tells you it is happening. A risk without an owner is a worry, and 'the project may be late' is not a risk, it is a result.\n\nThe log earns its keep in review. Assumptions should have a date by which they will be validated; when one proves false, it becomes an issue. Risks that materialise become issues. Dependencies on the client (data, credentials, sign-offs) need dates and named people, and they belong in the status report. AI projects carry a recognisable set of risks: model or API deprecation, price changes, rate limits, data privacy and residency, hallucinated answers in production, evaluation sets that do not reflect real use, and provider outages.\n\nThe gotcha is the write-once log: populated at kick-off, never updated, and checked only when something has already gone wrong. Review it weekly, sort by exposure, and close what is no longer relevant.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "PMI: PMBOK Guide (8th edition) overview", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
        { label: "Asana: RAID log", url: "https://asana.com/resources/raid-log", kind: "article" },
        { label: "ProjectManager: RAID log template", url: "https://www.projectmanager.com/templates/raid-log-template", kind: "article" },
      ],
      video: {
        title: "How to Use RAID Log in REAL-LIFE Project (+ Template)",
        channel: "Tactical Project Manager",
        url: "https://www.youtube.com/watch?v=inZI16nIvdo",
        videoId: "inZI16nIvdo",
        durationLabel: "7:06",
      },
      alternateVideos: [
        {
          title: "RAID Log in Project Management (FREE Risk Register Template Included!)",
          channel: "Alvin the PM - Become a Certified Project Manager",
          url: "https://www.youtube.com/watch?v=1i_pYJXs-H0",
          videoId: "1i_pYJXs-H0",
          durationLabel: "18:01",
        },
        {
          title: "Project Risk Management Tutorial 2026 | Complete PMP Risk Management Guide | Simplilearn",
          channel: "Simplilearn",
          url: "https://www.youtube.com/watch?v=rscnTR_E40c",
          videoId: "rscnTR_E40c",
          durationLabel: "42:22",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-i-raid-risk-management-q1",
          prompt: "The client's staging API has been down for two days and the team cannot test. Where does this belong in the RAID log?",
          options: ["Issue", "Risk", "Assumption", "Dependency only"],
          correctIndex: 0,
          explanation:
            "It is happening now, so it is an issue. It may also involve a dependency, but logging a current problem as a risk understates it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-raid-risk-management-q2",
          prompt: "Which risk statement is most useful?",
          options: [
            "Because the LLM provider may change pricing, monthly running cost could exceed the client's $2,000 budget, triggering a costly redesign",
            "The project may be late",
            "AI is risky",
            "Costs could go up",
          ],
          correctIndex: 0,
          explanation:
            "Cause, event and effect make it actionable: you can monitor pricing and plan mitigation such as caching or a fallback model. The others are outcomes or vague fears.",
        },
        {
          id: "pm-i-raid-risk-management-q3",
          prompt: "Which are standard risk response strategies for threats? (Select all that apply.)",
          options: ["Avoid", "Mitigate", "Transfer", "Accept", "Ignore until it happens"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Avoid, mitigate, transfer and accept are the classic threat responses; acceptance is a conscious decision, ideally with a contingency. Ignoring is not a strategy.",
        },
        {
          id: "pm-i-raid-risk-management-q4",
          prompt: "The team assumed the client's product catalogue has clean categories. Two sprints in, it turns out 40% are blank. What should happen in the RAID log?",
          options: [
            "Close the assumption as invalid and raise an issue with an owner and an action",
            "Leave the assumption as it is; it was reasonable at the time",
            "Convert it into a low-probability risk",
            "Delete it to keep the log clean",
          ],
          correctIndex: 0,
          explanation:
            "A failed assumption becomes a live issue that needs action, often a change request for data cleaning. Deleting it erases the history you will need if scope is disputed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-raid-risk-management-q5",
          prompt: "Signing a contract clause that makes the client responsible for content accuracy in the AI's knowledge base is an example of which response?",
          options: ["Transfer", "Avoid", "Accept", "Escalate to PMI"],
          correctIndex: 0,
          explanation:
            "Transfer moves the impact of a risk to another party, typically by contract or insurance. It does not remove the risk, so the team should still mitigate where it can.",
        },
        {
          id: "pm-i-raid-risk-management-q6",
          prompt: "Why does every assumption need a validation date?",
          options: [
            "Unvalidated assumptions become surprises; a date forces someone to check before the project depends on it",
            "Because RAID templates require a date column",
            "So they can be deleted on that date",
            "Because assumptions expire legally",
          ],
          correctIndex: 0,
          explanation:
            "An assumption is a risk you have decided not to worry about yet. A date and owner turn it into a check rather than a hope.",
        },
        {
          id: "pm-i-raid-risk-management-q7",
          prompt: "Which of these are risks specific to AI features that belong in a RAID log? (Select all that apply.)",
          options: [
            "The model version used is deprecated by the provider",
            "Provider rate limits are hit at launch traffic",
            "The assistant gives confident but wrong answers in production",
            "Personal data is sent to a provider in a region the client's policy forbids",
            "A developer prefers a different code editor",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Deprecation, limits, hallucination and data residency are all real, recurring AI delivery risks. Editor preferences are not a project risk.",
        },
        {
          id: "pm-i-raid-risk-management-q8",
          prompt: "How is risk exposure usually used to sort a risk register?",
          options: [
            "Probability multiplied by impact, so the highest combined exposure is reviewed first",
            "Alphabetically by owner",
            "By the date each risk was added",
            "By how worried the client sounds",
          ],
          correctIndex: 0,
          explanation:
            "Exposure (probability × impact, on whatever scale you use) focuses attention. Date-sorted logs bury the dangerous items under recent trivia.",
        },
        {
          id: "pm-i-raid-risk-management-q9",
          prompt: "What is the most common way RAID logs fail?",
          options: [
            "Written at kick-off and never reviewed again",
            "They contain too few columns",
            "They are shared with the client",
            "They are kept in a spreadsheet instead of a tool",
          ],
          correctIndex: 0,
          explanation:
            "A log only helps if it is reviewed regularly and drives action. The format matters far less than the habit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "spot",
        prompt: "Review this extract from a RAID log for a client's AI customer-support platform. Mark the entries that are wrong or not useful as written.",
        segments: [
          {
            id: "r1",
            text: "R1 (Risk): Because the LLM provider may deprecate the model we use, we may need to re-test prompts at short notice. P: Medium, I: High. Owner: Tech lead. Response: mitigate by keeping an evaluation suite to rerun on a new model.",
            issue: null,
          },
          { id: "r2", text: "R2 (Risk): The project might fail. P: Low, I: High. Owner: PM.", issue: "Not a risk statement; no cause or event, nothing to monitor or mitigate." },
          {
            id: "r3",
            text: "R3 (Risk): The client's staging environment has been down since Monday, blocking QA.",
            issue: "This is already happening, so it is an issue, not a risk.",
          },
          {
            id: "a1",
            text: "A1 (Assumption): The client can legally send support transcripts to a US-hosted model. Validate with client's DPO by 20 Oct. Owner: PM.",
            issue: null,
          },
          {
            id: "a2",
            text: "A2 (Assumption): Traffic will stay under 10,000 conversations a month.",
            issue: "No owner or validation date, and it drives the API cost forecast.",
          },
          { id: "i1", text: "I1 (Issue): 40% of help articles are outdated. Owner: client support lead. Action: update flagged articles by 24 Oct.", issue: null },
          {
            id: "d1",
            text: "D1 (Dependency): Production API keys from the client.",
            issue: "No date or named owner; this is a classic launch blocker.",
          },
          { id: "d2", text: "D2 (Dependency): CRM integration needs the client's IT to whitelist our IPs. Owner: client IT (Maria). Needed by 1 Nov.", issue: null },
          {
            id: "r4",
            text: "R4 (Risk): Because launch traffic may exceed the provider's rate limits, users may see errors. P: Medium, I: Medium. Owner: none yet.",
            issue: "Risk has no owner and no response.",
          },
          { id: "r5", text: "R5 (Risk): Because answers may contain made-up policy details, customers could be misinformed. Owner: QA. Response: mitigate with grounding and an eval set of 200 policy questions.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pm-i-stakeholder-mapping-raci",
      moduleId: "pm-intermediate",
      trackId: "pm",
      title: "Stakeholder Mapping & RACI",
      summary:
        "Projects fail through people more often than through technology: a compliance officer who appears two weeks before launch, a sponsor who loses interest, a client IT team that was never told it owns the integration. Stakeholder mapping exists to find these people early and decide how to engage each one.\n\nThe classic tool is the power/interest grid. High power, high interest: manage closely. High power, low interest: keep satisfied (short, decision-focused updates). Low power, high interest: keep informed. Low power, low interest: monitor. The grid is a snapshot; people move, and a stakeholder whose budget is threatened goes from low to high interest overnight. At an agency, map both sides: the client's sponsor, product contact, IT, legal, data protection officer and end users, and on the Oyelabs side, account management and finance.\n\nA RACI chart then clarifies who does what for each key deliverable or decision: **Responsible** (does the work), **Accountable** (owns the outcome and signs off, exactly one person), **Consulted** (gives input before the decision, two-way) and **Informed** (told afterwards, one-way). Its value is in exposing the gaps and overlaps: two Accountables means nobody is; no Accountable means the decision will stall; ten people Consulted means it will take forever.\n\nAI projects add stakeholders that traditional software often did not involve: legal and privacy (data sent to model providers), brand or compliance (what the AI is allowed to say), and the support teams who will handle the AI's mistakes. The gotcha is building a RACI no one reads. Agree it with the client at kick-off, refer to it when decisions stall, and update it when people change.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "PMI: PMBOK Guide (8th edition) overview", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
        { label: "Atlassian: RACI chart", url: "https://www.atlassian.com/work-management/project-management/raci-chart", kind: "article" },
        { label: "Asana: RACI chart", url: "https://asana.com/resources/raci-chart", kind: "article" },
        { label: "ProjectManager: Stakeholder analysis 101", url: "https://www.projectmanager.com/blog/stakeholder-analysis-101", kind: "article" },
      ],
      video: {
        title: "Stakeholder Analysis: How to Use the Power/Interest Grid",
        channel: "AssistKD",
        url: "https://www.youtube.com/watch?v=G3R4TO1l6LY",
        videoId: "G3R4TO1l6LY",
        durationLabel: "4:58",
      },
      alternateVideos: [
        {
          title: "RACI Matrix Basics Explained with Examples | TeamGantt",
          channel: "TeamGantt",
          url: "https://www.youtube.com/watch?v=xc5NbJ8VgTI",
          videoId: "xc5NbJ8VgTI",
          durationLabel: "5:08",
        },
        {
          title: "Stakeholder Engagement Tips: 5 Tips For Project Managers",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=APc9S_8v7YY",
          videoId: "APc9S_8v7YY",
          durationLabel: "8:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-i-stakeholder-mapping-raci-q1",
          prompt: "How many people should be Accountable for a single deliverable or decision in a RACI chart?",
          options: ["Exactly one", "At least two, for cover", "Everyone who is Responsible", "None; accountability is shared by the team"],
          correctIndex: 0,
          explanation:
            "One Accountable person owns the outcome and the sign-off. With two, each assumes the other has it; with none, decisions stall.",
        },
        {
          id: "pm-i-stakeholder-mapping-raci-q2",
          prompt:
            "The client's CFO controls the budget but rarely engages with project details. Where does the CFO sit on the power/interest grid, and how should they be engaged?",
          options: [
            "High power, low interest: keep satisfied with short, decision-focused updates",
            "Low power, low interest: monitor only",
            "High power, high interest: weekly detailed reviews",
            "Low power, high interest: keep informed with full sprint reports",
          ],
          correctIndex: 0,
          explanation:
            "Budget authority is power. Flooding a disengaged executive with detail backfires; give them what they need to decide, and watch for their interest rising.",
        },
        {
          id: "pm-i-stakeholder-mapping-raci-q3",
          prompt: "What is the difference between Consulted and Informed?",
          options: [
            "Consulted people give input before the work or decision (two-way); Informed people are told the result (one-way)",
            "Consulted people do the work; Informed people sign it off",
            "There is no difference",
            "Informed people have veto power",
          ],
          correctIndex: 0,
          explanation:
            "Consulted implies a conversation and their input shapes the outcome; Informed is notification. Over-using Consulted is a common reason decisions slow down.",
        },
        {
          id: "pm-i-stakeholder-mapping-raci-q4",
          prompt:
            "Two weeks before launch, the client's legal team blocks the AI assistant because customer data is sent to an external model provider. Nobody had involved them. What was the planning failure?",
          options: [
            "Stakeholder identification missed legal and privacy, who have high power over AI data flows",
            "The developers chose the wrong model",
            "The RACI had too many Informed entries",
            "Legal teams always block projects, so nothing could be done",
          ],
          correctIndex: 0,
          explanation:
            "AI features bring legal, privacy and compliance into scope. Mapping them at kick-off turns a late veto into an early requirement.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-stakeholder-mapping-raci-q5",
          prompt: "Which RACI patterns signal a problem? (Select all that apply.)",
          options: [
            "A decision with two people marked Accountable",
            "A deliverable with no Accountable at all",
            "Twelve people marked Consulted on a minor design choice",
            "One Accountable and two Responsible on a deliverable",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Double or missing accountability and excessive consultation all slow or block delivery. One A with a couple of Rs is a healthy pattern.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-stakeholder-mapping-raci-q6",
          prompt: "For 'UAT sign-off' on a client project, who is most appropriately Accountable?",
          options: [
            "The client's product owner or sponsor",
            "The Oyelabs QA engineer",
            "The Oyelabs PM",
            "The developer who built the feature",
          ],
          correctIndex: 0,
          explanation:
            "Acceptance is the client's decision. Oyelabs QA might be Responsible for supporting UAT, and the PM Responsible for coordinating it, but the client signs.",
        },
        {
          id: "pm-i-stakeholder-mapping-raci-q7",
          prompt: "Why is a power/interest grid described as a snapshot?",
          options: [
            "Stakeholders' interest and influence change, for example when their budget or team is affected",
            "Because it should be drawn only once",
            "Because only photos of it are allowed in reports",
            "Because power never changes but interest does",
          ],
          correctIndex: 0,
          explanation:
            "A reorganisation, a budget cut or a visible failure can move people across the grid quickly. Revisit it at major milestones.",
        },
        {
          id: "pm-i-stakeholder-mapping-raci-q8",
          prompt: "Which AI-era stakeholders do traditional app projects often forget? (Select all that apply.)",
          options: [
            "The client's data protection or privacy officer",
            "Brand or compliance owners who decide what the AI may say",
            "Support teams who will handle the AI's mistakes",
            "The Oyelabs office manager",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Data flows, permitted outputs and failure handling each have an owner on the client side. Involving them early prevents late vetoes and unowned escalations.",
        },
        {
          id: "pm-i-stakeholder-mapping-raci-q9",
          prompt: "Decisions keep stalling because the client's product manager says 'I need to check with my boss' on everything. What is the best fix?",
          options: [
            "Revisit the RACI with the sponsor to agree which decisions the product manager can make alone",
            "Make the decisions on the client's behalf",
            "Stop inviting the product manager",
            "Escalate every decision to the CEO",
          ],
          correctIndex: 0,
          explanation:
            "The pattern shows unclear decision rights. Agreeing delegated authority with the sponsor fixes it at the root; deciding on the client's behalf creates liability.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "Oyelabs is building an AI-powered claims-triage tool for an insurance client. Known stakeholders: the Head of Claims (sponsor), a claims operations manager (day-to-day contact), client IT, and 40 claims handlers who will use the tool.",
        steps: [
          {
            id: "missing",
            question: "Which stakeholder group is most important to add to the map before discovery ends?",
            options: [
              "The client's compliance and data protection team, because claim data is sensitive and goes to a model provider",
              "The client's marketing team",
              "Oyelabs' recruitment team",
              "The model provider's sales rep",
            ],
            correctIndex: 0,
            explanation:
              "Sensitive personal data flowing to a third-party model makes compliance a high-power stakeholder who can stop the project. They must be engaged early.",
          },
          {
            id: "raci",
            question: "The draft RACI lists both the Head of Claims and the operations manager as Accountable for UAT sign-off. What do you do?",
            options: [
              "Agree with the sponsor that the Head of Claims is Accountable and the operations manager Responsible for running UAT",
              "Leave both as Accountable for safety",
              "Make the Oyelabs PM Accountable",
              "Remove UAT sign-off from the RACI",
            ],
            correctIndex: 0,
            explanation:
              "One Accountable per decision. The operations manager does the work of UAT; the sponsor owns the decision.",
          },
          {
            id: "handlers",
            question:
              "The claims handlers are worried the tool will replace them, and some are quietly saying it does not work. Where are they on the grid, and what is the right engagement?",
            options: [
              "Their collective interest is high and their influence on adoption is significant: involve them in testing and show how the tool supports them",
              "Low power: monitor only",
              "Ignore them; the sponsor has approved the project",
              "Send them the weekly status report",
            ],
            correctIndex: 0,
            explanation:
              "End users can make or break adoption even without formal authority. Involving them in UAT and feedback turns resistance into ownership.",
          },
        ],
      },
    },
    {
      id: "pm-i-agency-commercial-models",
      moduleId: "pm-intermediate",
      trackId: "pm",
      title: "Agency Commercial Models: Fixed Bid, T&M, Retainer & Time Tracking",
      summary:
        "The commercial model decides who carries the risk when estimates are wrong, and estimates are always wrong. Under a **fixed bid** the agency carries it: the client gets price certainty, the agency prices in a risk premium and must defend scope fiercely through change control. Under **time and materials (T&M)** the client carries it: they pay for hours actually worked, gain the freedom to change direction, and need trust, visibility and usually a not-to-exceed cap. The US Federal Acquisition Regulation (FAR 16.601) captures the logic well: T&M may be used only when the extent or duration of the work cannot be estimated accurately at the start, and it carries a ceiling price that the contractor exceeds at its own risk. A **retainer** buys a fixed block of capacity per period, ideal for post-launch support and continuous improvement, with rules about rollover of unused hours.\n\nAI features strain the fixed bid. Model behaviour, data quality and the effort to reach a quality bar are genuinely uncertain, so agencies increasingly split work: a fixed-price discovery or proof of concept, then a fixed or capped build priced from what the spike learned, then a retainer for tuning and monitoring. LLM API costs need their own line: are they passed through at cost, marked up, or included? If included in a fixed monthly fee, usage growth eats the margin.\n\nTime tracking is what makes all of this measurable. On T&M it is the invoice; on fixed bid it is how the agency learns its effective rate (price ÷ actual hours) and whether its estimates are any good; on retainers it shows burn against the block. Utilisation, the share of available hours that are billable, drives agency profitability.\n\nThe gotcha: a fixed bid with 'agile' flexibility and no swap rules is T&M risk at a fixed-bid price, the worst of both models.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "FAR 16.601: Time-and-materials contracts", url: "https://www.acquisition.gov/far/16.601", kind: "spec" },
        { label: "ProjectManager: Fixed-price contract", url: "https://www.projectmanager.com/blog/fixed-price-contract", kind: "article" },
        { label: "Harvest: Project pricing - which model to choose", url: "https://www.getharvest.com/resources/project-pricing", kind: "article" },
        { label: "Productive.io: What is a retainer in business?", url: "https://productive.io/blog/what-is-a-retainer-in-business/", kind: "article" },
      ],
      video: {
        title: "Fixed-Price Contracts VS Time-and-Materials for Your Software Development Project",
        channel: "Matt Brickwood",
        url: "https://www.youtube.com/watch?v=PyobLk8aGu0",
        videoId: "PyobLk8aGu0",
        durationLabel: "5:47",
      },
      alternateVideos: [
        {
          title: "Fixed Fee vs Time & Materials Contracts: Comparison",
          channel: "Brainhub",
          url: "https://www.youtube.com/watch?v=WrUYVqs2-BY",
          videoId: "WrUYVqs2-BY",
          durationLabel: "3:43",
        },
        {
          title: "Contract Type - Fixed Price , T&M and Cost+ - PMP Exam Topic",
          channel: "iZenBridge Consultancy Pvt Ltd.",
          url: "https://www.youtube.com/watch?v=God5KMi9tAs",
          videoId: "God5KMi9tAs",
          durationLabel: "4:36",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-i-agency-commercial-models-q1",
          prompt: "Under a fixed-bid contract, who carries the risk of the work taking longer than estimated?",
          options: ["The agency", "The client", "It is shared equally by default", "Nobody, if the scope is clear"],
          correctIndex: 0,
          explanation:
            "The client pays the agreed price regardless of effort, so overruns come out of the agency's margin. Clear scope reduces the risk but does not move it.",
        },
        {
          id: "pm-i-agency-commercial-models-q2",
          prompt: "According to FAR 16.601, when is a time-and-materials contract appropriate?",
          options: [
            "When the extent or duration of the work cannot be estimated accurately at the start",
            "Whenever the client wants the lowest price",
            "Only for hardware purchases",
            "When the scope is completely defined",
          ],
          correctIndex: 0,
          explanation:
            "The regulation limits T&M to work that cannot be estimated with reasonable confidence, and requires a ceiling price. The same logic applies to commercial agency work.",
        },
        {
          id: "pm-i-agency-commercial-models-q3",
          prompt:
            "A client wants a fixed price for an AI document-classification system, but no one has tested the model on their documents. What structure reduces risk for both sides?",
          options: [
            "Fixed-price discovery and proof of concept, then a build priced from what was learned",
            "One fixed price for everything with a large buffer",
            "Uncapped T&M for the whole project",
            "A retainer starting on day one",
          ],
          correctIndex: 0,
          explanation:
            "Phasing turns the biggest unknown into evidence before the large commitment. A buffer guesses the unknown; uncapped T&M asks the client to carry all of it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-agency-commercial-models-q4",
          prompt: "Which questions about LLM API costs must be settled in the contract? (Select all that apply.)",
          options: [
            "Whether API usage is passed through at cost, marked up or included in the fee",
            "Whose account the API keys and billing sit under",
            "What happens if usage or provider prices rise sharply",
            "Which developer writes the prompts",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Billing model, account ownership and price-change handling all decide who absorbs cost growth. Staffing is an internal delivery matter, not a contract term.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-agency-commercial-models-q5",
          prompt: "A fixed-bid project was priced at $30,000 and took 600 hours. What was the effective hourly rate?",
          options: ["$50", "$60", "$40", "$500"],
          correctIndex: 0,
          explanation:
            "$30,000 ÷ 600 = $50 per hour. Comparing effective rates with the standard rate tells the agency whether its fixed bids are actually profitable.",
        },
        {
          id: "pm-i-agency-commercial-models-q6",
          prompt: "What is the main benefit of a retainer for post-launch work?",
          options: [
            "Predictable capacity and revenue for ongoing support, tuning and small improvements",
            "It guarantees the agency is paid for work it has not scheduled, with no obligations",
            "It removes the need for time tracking",
            "It fixes the scope of all future features",
          ],
          correctIndex: 0,
          explanation:
            "Retainers suit continuous, unpredictable work. They still need time tracking to show burn and clear rules on unused hours.",
        },
        {
          id: "pm-i-agency-commercial-models-q7",
          prompt:
            "A fixed-bid contract says the team works 'in an agile way', and the client keeps adding stories without removing any. What is the commercial reality?",
          options: [
            "The agency is carrying T&M-style scope risk at a fixed price unless swap rules and change control are enforced",
            "Agile means scope can always grow at no cost",
            "The client is in breach of contract",
            "The project automatically becomes T&M",
          ],
          correctIndex: 0,
          explanation:
            "Without agreed swap rules, 'agile' becomes unpaid scope growth. Contracts do not change type by themselves; the PM has to apply change control.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-agency-commercial-models-q8",
          prompt: "Why does accurate time tracking matter on fixed-bid projects, where the client is not billed by the hour?",
          options: [
            "It shows the real cost against price, exposes estimation errors and feeds better future quotes",
            "It does not matter on fixed bids",
            "Only to prove to the client that people worked",
            "Because the client can demand a refund for unused hours",
          ],
          correctIndex: 0,
          explanation:
            "Without hours, the agency cannot know its margin or learn which kinds of work it underestimates, such as AI evaluation and prompt tuning.",
        },
        {
          id: "pm-i-agency-commercial-models-q9",
          prompt: "What is a 'not-to-exceed' cap on a T&M engagement for?",
          options: [
            "It limits the client's maximum spend, with the agency required to flag and agree before going over",
            "It fixes the scope",
            "It sets the minimum the client must pay",
            "It turns the contract into a fixed bid",
          ],
          correctIndex: 0,
          explanation:
            "Caps give the client a budget ceiling while keeping T&M's flexibility. Work beyond the cap needs agreement, or the agency risks doing it unpaid.",
        },
        {
          id: "pm-i-agency-commercial-models-q10",
          prompt: "A developer is available 160 hours a month and logs 120 billable hours. What is their utilisation?",
          options: ["75%", "133%", "40%", "25%"],
          correctIndex: 0,
          explanation:
            "120 ÷ 160 = 75%. Utilisation drives agency profitability, but pushing it toward 100% leaves no room for training, internal work or the unexpected.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Prepare the numbers for a client proposal on a T&M build with a capped budget, and check last quarter's fixed bid.",
        table: {
          columns: ["Role", "Estimated hours", "Rate ($/h)"],
          rows: [
            ["Developer (×2)", "240 total", "40"],
            ["QA engineer", "60", "30"],
            ["Project manager", "40", "50"],
            ["Contingency on labour", "15%", ""],
            ["Last quarter's fixed bid", "$12,000 price", "300 hours actually logged"],
          ],
        },
        fields: [
          { id: "labour", label: "Labour estimate before contingency", unit: "$", answer: 13400, tolerance: 1 },
          { id: "cap", label: "Recommended not-to-exceed cap (labour + 15%)", unit: "$", answer: 15410, tolerance: 1 },
          { id: "effective", label: "Effective hourly rate on last quarter's fixed bid", unit: "$/h", answer: 40, tolerance: 0.01 },
        ],
        explanation:
          "Labour is 240 × 40 + 60 × 30 + 40 × 50 = 9,600 + 1,800 + 2,000 = $13,400. Adding 15% gives $15,410 as the cap. The fixed bid earned $12,000 ÷ 300 = $40/h; if that is below the rates the agency needs for that mix of roles, that kind of work was underestimated and the next quote should reflect it.",
      },
    },
    {
      id: "pm-i-qa-uat-coordination",
      moduleId: "pm-intermediate",
      trackId: "pm",
      title: "QA & UAT Coordination",
      summary:
        "Quality assurance and user acceptance testing answer different questions. QA, run by the agency, asks whether the software works as specified: functional tests, regression, devices and browsers, performance. UAT, run by the client and ideally real end users, asks whether it meets their business needs well enough to accept it. Confusing the two is expensive: clients who act as the QA team find bugs the agency should have caught and lose confidence; agencies who skip UAT ship features that pass every test and still do not fit how the client works.\n\nUAT needs managing like a mini-project. Define entry criteria (QA complete, no open critical defects, staging stable, test data and accounts ready, test scripts or scenarios agreed), a timebox, who tests what, how defects are reported and triaged, and exit criteria (sign-off by the accountable person, agreed list of known issues). Triage separates defects (fails an acceptance criterion) from change requests (new wishes) and classifies severity (impact) separately from priority (order of fixing).\n\nAI features need an extra layer. Because outputs are non-deterministic, a single tester trying a few questions is not acceptance. Agree an evaluation set of realistic inputs with expected outcomes and a pass threshold, run it before UAT, and let UAT focus on whether the behaviour, tone and failure handling are acceptable. Record which model version and prompt version were accepted, because a model update can change behaviour after sign-off.\n\nThe gotcha is the open-ended UAT: no timebox, no exit criteria, and a client who keeps testing while adding wishes. Without agreed criteria, UAT quietly becomes unpaid phase two.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        {
          label: "GOV.UK Service Manual: Quality assurance: testing your service regularly",
          url: "https://www.gov.uk/service-manual/technology/quality-assurance-testing-your-service-regularly",
          kind: "docs",
        },
        {
          label: "Atlassian: Acceptance criteria",
          url: "https://www.atlassian.com/work-management/project-management/acceptance-criteria",
          kind: "article",
        },
        {
          label: "ProjectManager: Acceptance criteria in project management",
          url: "https://www.projectmanager.com/blog/acceptance-criteria-project-management",
          kind: "article",
        },
      ],
      video: {
        title: "Software Testing Process Guide: What is User Acceptance Testing - UAT?",
        channel: "Online PM Courses - Mike Clayton",
        url: "https://www.youtube.com/watch?v=sGwm4p9sGPI",
        videoId: "sGwm4p9sGPI",
        durationLabel: "8:03",
      },
      alternateVideos: [
        {
          title: "What is the difference between QA and UAT",
          channel: "Thomas Ryan",
          url: "https://www.youtube.com/watch?v=6Pdy0TUCK90",
          videoId: "6Pdy0TUCK90",
          durationLabel: "2:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-i-qa-uat-coordination-q1",
          prompt: "What is the core difference between QA and UAT?",
          options: [
            "QA checks the software works as specified; UAT checks it meets the client's business needs well enough to accept",
            "QA is manual and UAT is automated",
            "UAT is done by the agency, QA by the client",
            "They are the same activity at different times",
          ],
          correctIndex: 0,
          explanation:
            "QA verifies against the specification, UAT validates against business need. The client owns UAT; the agency owns QA.",
        },
        {
          id: "pm-i-qa-uat-coordination-q2",
          prompt: "Which are sensible UAT entry criteria? (Select all that apply.)",
          options: [
            "Agency QA complete with no open critical defects",
            "Staging environment stable with test data and accounts ready",
            "Test scenarios agreed with the client",
            "All Could Have features finished",
            "Production already live",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Entry criteria make sure the client's time is spent on acceptance, not finding basic bugs or fighting the environment. Could Haves are optional by definition, and UAT should come before production.",
        },
        {
          id: "pm-i-qa-uat-coordination-q3",
          prompt: "During UAT the client logs 60 items. What should the PM do first?",
          options: [
            "Triage them with the client: defects against acceptance criteria versus change requests, with severity and priority",
            "Ask the team to fix all 60 before launch",
            "Reject everything not marked critical",
            "Extend UAT until the list is empty",
          ],
          correctIndex: 0,
          explanation:
            "UAT logs typically mix real defects, misunderstandings and new wishes. Triage against the baseline decides what is fixed, what is a CR and what is deferred.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-qa-uat-coordination-q4",
          prompt: "A typo on the About page is low severity. When might it still be high priority?",
          options: [
            "When it is in the company name on the launch press-release landing page",
            "Never; priority always follows severity",
            "Only if a developer reported it",
            "Only after launch",
          ],
          correctIndex: 0,
          explanation:
            "Severity is technical impact; priority is business urgency. A cosmetic issue that embarrasses the client at launch can outrank a minor functional bug.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-qa-uat-coordination-q5",
          prompt: "Why is a few testers chatting with an AI assistant not enough for UAT of an AI feature?",
          options: [
            "Outputs vary, so acceptance needs an agreed evaluation set with expected outcomes and a pass threshold",
            "Because AI features cannot be tested by people",
            "Because the model is tested by the provider already",
            "It is enough, as long as the testers are senior",
          ],
          correctIndex: 0,
          explanation:
            "Non-deterministic behaviour means a handful of tries proves little. The provider's tests do not cover the client's data, prompts or business rules.",
        },
        {
          id: "pm-i-qa-uat-coordination-q6",
          prompt: "What should be recorded at UAT sign-off for an AI feature that is not needed for a conventional feature?",
          options: [
            "The model and prompt versions accepted and the evaluation results at sign-off",
            "The names of the developers",
            "The number of test cases written",
            "Nothing extra",
          ],
          correctIndex: 0,
          explanation:
            "A model or prompt change after sign-off can change behaviour. Recording the accepted versions defines what was accepted and makes regressions provable.",
        },
        {
          id: "pm-i-qa-uat-coordination-q7",
          prompt: "UAT has been running for five weeks with no end date, and the client keeps adding 'small tweaks'. What was missing?",
          options: [
            "A timebox, exit criteria and an agreed process for separating defects from changes",
            "More QA engineers",
            "A longer contract",
            "A different testing tool",
          ],
          correctIndex: 0,
          explanation:
            "Without exit criteria, UAT never ends and becomes unpaid phase two. Agree them before UAT starts.",
        },
        {
          id: "pm-i-qa-uat-coordination-q8",
          prompt: "Who should sign off UAT?",
          options: [
            "The client person who is Accountable for acceptance, as named in the RACI",
            "Any client employee who tested something",
            "The Oyelabs QA lead",
            "The PM, on the client's behalf",
          ],
          correctIndex: 0,
          explanation:
            "Sign-off is a contractual act on the client's side. A tester's 'looks good' in a chat is not acceptance.",
        },
        {
          id: "pm-i-qa-uat-coordination-q9",
          prompt: "What does regression testing protect against?",
          options: [
            "New changes breaking features that previously worked",
            "Users rejecting the design",
            "Clients requesting changes",
            "Model API outages",
          ],
          correctIndex: 0,
          explanation:
            "Regression testing re-checks existing behaviour after changes. For AI features, rerunning the evaluation set after prompt or model changes plays the same role.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "Oyelabs is about to hand over an AI-powered loan pre-qualification feature for UAT. Launch is in three weeks. The client's operations team will test.",
        steps: [
          {
            id: "entry",
            question: "Agency QA still has two open critical defects. The client wants UAT to start Monday anyway. What do you do?",
            options: [
              "Hold UAT start until the critical defects are fixed, or start UAT on the unaffected flows only, with the client's agreement",
              "Start full UAT on Monday and fix bugs in parallel",
              "Cancel UAT and go straight to production",
              "Let the client find the critical defects themselves",
            ],
            correctIndex: 0,
            explanation:
              "Starting full UAT with known criticals wastes the client's time and undermines confidence. A partial start on unaffected flows can keep momentum if agreed.",
          },
          {
            id: "triage",
            question:
              "UAT feedback says 'the AI is wrong for self-employed applicants'. The acceptance criteria only covered salaried applicants. How do you classify it?",
            options: [
              "A change request (new scope), logged and priced, while confirming whether launch needs it",
              "A critical defect the agency must fix free",
              "Not an issue, so close it",
              "A model problem to escalate to the LLM provider",
            ],
            correctIndex: 0,
            explanation:
              "The baseline covered salaried applicants only, so self-employed handling is new scope. It may well be important; that is a decision for the sponsor with the cost in front of them.",
          },
          {
            id: "signoff",
            question: "UAT exit criteria are met. What must be in the sign-off record?",
            options: [
              "Sign-off by the accountable client person, known issues accepted, evaluation results and the model and prompt versions accepted",
              "A thumbs-up from the testers in Slack",
              "The number of hours spent testing",
              "Only the date",
            ],
            correctIndex: 0,
            explanation:
              "A formal record defines what was accepted. For AI features, the versions and evaluation results are what make later behaviour changes traceable.",
          },
        ],
      },
    },
    {
      id: "pm-i-release-management",
      moduleId: "pm-intermediate",
      trackId: "pm",
      title: "Release Management",
      summary:
        "Release management is the discipline of getting changes to users safely and predictably: deciding what goes into a release, preparing it, getting approval, deploying, verifying and being ready to undo it. The PM is not usually the one pressing the button, but owns the coordination: client communication, timing, sign-offs, dependencies and the go/no-go decision.\n\nThe key distinction is between **deploying** (putting code on production servers) and **releasing** (making a feature available to users). Feature flags, as Martin Fowler describes them, decouple the two: code ships dark, then the feature is turned on for internal users, a percentage of customers, or everyone. That allows smaller, safer deployments and instant rollback of a feature without a redeploy. The cost is flag debt: old flags left in the code make it harder to reason about, so each one needs an owner and a removal date.\n\nAgency releases have recurring friction points: client approvals and change freezes, app store review for mobile (timing not in your control), production credentials and DNS changes owned by the client, and a support plan for the first days after launch. A release checklist and a go/no-go meeting with a confirmed rollback plan turn launch day from adrenaline into routine.\n\nAI features add their own release concerns. Roll out gradually behind a flag and watch quality and cost signals as well as errors: escalation rates, user feedback on answers, latency, and API spend per day. Pin model versions so a provider update does not change behaviour silently. The gotcha is a Friday-evening launch with no rollback plan and nobody watching the API bill over the weekend.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Jira Cloud support: What is a version?", url: "https://support.atlassian.com/jira-software-cloud/docs/what-is-a-version/", kind: "docs" },
        { label: "Atlassian: Release planning", url: "https://www.atlassian.com/agile/software-development/release", kind: "article" },
        { label: "Asana: Release management", url: "https://asana.com/resources/release-management", kind: "article" },
        { label: "Martin Fowler: Feature flags", url: "https://martinfowler.com/bliki/FeatureFlag.html", kind: "article" },
      ],
      video: {
        title: "What is Release Management?",
        channel: "Online PM Courses - Mike Clayton",
        url: "https://www.youtube.com/watch?v=dvFQrsY_tKg",
        videoId: "dvFQrsY_tKg",
        durationLabel: "3:34",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-i-release-management-q1",
          prompt: "What is the difference between deploying and releasing?",
          options: [
            "Deploying puts code on production; releasing makes a feature available to users, which flags can control separately",
            "They are the same thing",
            "Releasing happens before deploying",
            "Deploying is only for mobile apps",
          ],
          correctIndex: 0,
          explanation:
            "Feature flags let code be deployed dark and released later or gradually. That separation is what makes small, frequent deployments safe.",
        },
        {
          id: "pm-i-release-management-q2",
          prompt: "Which are benefits of releasing an AI feature behind a feature flag? (Select all that apply.)",
          options: [
            "Turning it on for a small percentage of users first",
            "Switching it off instantly without a redeploy if answers go wrong",
            "Watching quality and API cost before full rollout",
            "Never having to remove the flag from the code",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Gradual exposure, fast rollback and observation are the point. Flags left forever become technical debt, so each needs a removal date.",
        },
        {
          id: "pm-i-release-management-q3",
          prompt: "A mobile app must launch on a client's marketing date. What release risk is outside the team's control?",
          options: [
            "App store review time and possible rejection",
            "The code review process",
            "The sprint length",
            "The staging environment",
          ],
          correctIndex: 0,
          explanation:
            "Store review times vary and rejections happen. Submit early, plan for a resubmission, and use a phased release where available.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-release-management-q4",
          prompt: "What should a go/no-go meeting confirm before a production release?",
          options: [
            "UAT sign-off, no open blocking defects, a tested rollback plan, monitoring in place and the support rota",
            "That everyone is in a good mood",
            "That the client has paid the final invoice",
            "That marketing has written the press release",
          ],
          correctIndex: 0,
          explanation:
            "Go/no-go is a checklist decision, not a vibe. The rollback plan is the item most often assumed rather than tested.",
        },
        {
          id: "pm-i-release-management-q5",
          prompt: "Why pin the LLM model version in production instead of using a provider's 'latest' alias?",
          options: [
            "So behaviour accepted in UAT does not change silently when the provider updates the model",
            "Because latest models are always worse",
            "Because pinning is cheaper in every case",
            "Providers do not allow aliases",
          ],
          correctIndex: 0,
          explanation:
            "An alias that moves can change outputs after sign-off. Pinning makes model upgrades a deliberate, tested release.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-release-management-q6",
          prompt: "A release is planned for 18:00 on Friday, and the tech lead goes on leave that evening. What is the problem?",
          options: [
            "Nobody experienced is available to watch the release and roll back over the weekend",
            "Fridays are not allowed for releases by Scrum",
            "Releases must happen at midnight",
            "There is no problem if the tests passed",
          ],
          correctIndex: 0,
          explanation:
            "The risk is not the day itself but releasing when the people who can respond are unavailable. Plan releases for when support is on hand.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-release-management-q7",
          prompt: "What do Jira versions help the team do?",
          options: [
            "Group work items into a release and track its progress to completion",
            "Bill the client per release",
            "Deploy code automatically",
            "Replace the release checklist",
          ],
          correctIndex: 0,
          explanation:
            "Versions represent releases in Jira so the team can see what is in each and how close it is. Deployment and approval still happen elsewhere.",
        },
        {
          id: "pm-i-release-management-q8",
          prompt: "Which signals should the team watch in the first days after releasing an AI assistant, beyond error rates?",
          options: [
            "Escalation rate to humans, user feedback on answers, latency and daily API spend",
            "Number of commits per day",
            "Story points completed",
            "The team's overtime hours",
          ],
          correctIndex: 0,
          explanation:
            "AI features can fail quietly: wrong answers, slow responses or a runaway bill without any errors. Quality and cost signals catch those.",
        },
        {
          id: "pm-i-release-management-q9",
          prompt: "What is flag debt?",
          options: [
            "Old feature flags left in the code long after rollout, making the system harder to understand and test",
            "The cost of buying a feature flag service",
            "Features the client has not paid for",
            "Bugs reported after a release",
          ],
          correctIndex: 0,
          explanation:
            "Every flag doubles some code paths. Give each one an owner and a removal date once the feature is fully rolled out.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "Put the steps of a production release for a client's new AI recommendation feature in order (first at the top). The team uses feature flags.",
        items: [
          { id: "freeze", label: "Agree release scope with the client and cut the release candidate" },
          { id: "test", label: "Run regression and the AI evaluation set on staging; client UAT sign-off" },
          { id: "gonogo", label: "Go/no-go meeting: confirm rollback plan, monitoring and support rota" },
          { id: "deploy", label: "Deploy to production with the AI feature flag off" },
          { id: "smoke", label: "Smoke-test production and enable the flag for internal users" },
          { id: "rollout", label: "Roll out to 10% of users, watch quality and API cost, then go to 100% and send release notes" },
        ],
        correctOrder: ["freeze", "test", "gonogo", "deploy", "smoke", "rollout"],
        explanation:
          "Scope is fixed first, then tested and accepted, then a go/no-go confirms readiness. Deploying with the flag off separates deployment from release; internal users and a small percentage go first, and release notes go out once the feature is fully live.",
      },
    },
    {
      id: "pm-i-retrospectives",
      moduleId: "pm-intermediate",
      trackId: "pm",
      title: "Retrospectives That Change Something",
      summary:
        "The Sprint Retrospective is where a team plans how to increase quality and effectiveness. The 2020 Scrum Guide says the team inspects how the last Sprint went with regard to individuals, interactions, processes, tools and its Definition of Done, identifies the most helpful changes, and may add them to the Sprint Backlog for the next Sprint. It concludes the Sprint and is timeboxed to a maximum of three hours for a one-month Sprint.\n\nIts value depends almost entirely on two things: psychological safety and follow-through. Without safety, people say what is comfortable and the real problems (a client who bullies the team, a tech lead who rewrites everyone's code) never surface. Norm Kerth's Prime Directive, the belief that everyone did the best job they could given what they knew at the time, is often read at the start for this reason. Without follow-through, retros become a complaint session and people stop engaging: the same 'communication with the client' item appears for six sprints in a row.\n\nGood facilitation varies formats (start/stop/continue, 4Ls, sailboat, timelines) to avoid ritual, uses data such as cycle times, escaped defects or the number of blocked days, and ends with one to three concrete actions with owners, not ten vague wishes. Checking last retro's actions first is the single best habit.\n\nAgency-specific: some issues are about the client relationship and cannot be fixed inside the team, so the PM must carry them to the account manager or the client, and report back. AI projects benefit from retros on the evaluation process itself: were the test sets realistic, did prompt changes get reviewed? The gotcha is inviting the client to every retro, which usually ends candour.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "The Scrum Guide: Sprint Retrospective", url: "https://scrumguides.org/scrum-guide.html", kind: "spec" },
        { label: "Atlassian: Retrospectives", url: "https://www.atlassian.com/agile/scrum/retrospectives", kind: "article" },
        {
          label: "Mountain Goat Software: Sprint retrospective",
          url: "https://www.mountaingoatsoftware.com/agile/scrum/meetings/sprint-retrospective",
          kind: "article",
        },
        { label: "Atlassian Team Playbook: Retrospective", url: "https://www.atlassian.com/team-playbook/plays/retrospective", kind: "docs" },
      ],
      video: {
        title: "How to Facilitate the Sprint Retrospective",
        channel: "Scrum.org",
        url: "https://www.youtube.com/watch?v=TD-XsdD2n3s",
        videoId: "TD-XsdD2n3s",
        durationLabel: "7:56",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-i-retrospectives-q1",
          prompt: "What does the 2020 Scrum Guide say the team inspects in the Retrospective? (Select all that apply.)",
          options: ["Individuals and interactions", "Processes and tools", "The Definition of Done", "Each developer's individual velocity", "The client's budget"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The Guide lists individuals, interactions, processes, tools and the Definition of Done. Individual velocity is not a Scrum concept, and budget is not the retro's subject.",
        },
        {
          id: "pm-i-retrospectives-q2",
          prompt: "The same item, 'communication with the client is poor', has appeared in six retros. What is most likely missing?",
          options: [
            "A concrete action with an owner and a check at the next retro",
            "A different retro format",
            "A longer retro",
            "More people in the retro",
          ],
          correctIndex: 0,
          explanation:
            "Recurring items mean nothing was done. Turning them into one specific, owned action and checking it next time breaks the loop.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-retrospectives-q3",
          prompt: "Why is the Prime Directive often read at the start of a retro?",
          options: [
            "To set an assumption of good intent so people can discuss problems without blame",
            "Because the Scrum Guide requires it",
            "To remind the team of the client's priorities",
            "To start the timebox",
          ],
          correctIndex: 0,
          explanation:
            "Norm Kerth's Prime Directive supports psychological safety. It is a widely used practice, not part of the Scrum Guide.",
        },
        {
          id: "pm-i-retrospectives-q4",
          prompt: "The client asks to attend every retro 'to help'. What is the most likely effect?",
          options: [
            "The team becomes less candid, especially about client-related problems",
            "Retros become more productive",
            "Nothing changes",
            "The retro becomes a Sprint Review",
          ],
          correctIndex: 0,
          explanation:
            "Retros depend on safety, and many agency problems involve the client. A joint retrospective at a milestone is a better way to include them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-retrospectives-q5",
          prompt: "How many improvement actions should a retro usually end with?",
          options: ["One to three, each with an owner", "As many as possible", "None; discussion is enough", "Exactly ten"],
          correctIndex: 0,
          explanation:
            "A few owned actions actually get done. Long lists dilute attention and teach the team that actions are optional.",
        },
        {
          id: "pm-i-retrospectives-q6",
          prompt: "According to the 2020 Guide, where can the most helpful improvements go?",
          options: [
            "Into the Sprint Backlog for the next Sprint",
            "Into the contract",
            "Only into a separate improvement document",
            "Into the Product Goal",
          ],
          correctIndex: 0,
          explanation:
            "The Guide says the most impactful improvements are addressed as soon as possible and may be added to the Sprint Backlog for the next Sprint. That makes them real work, not wishes.",
        },
        {
          id: "pm-i-retrospectives-q7",
          prompt: "A retro surfaces that the client's product contact changes priorities daily over WhatsApp. The team cannot fix this. What should the PM do?",
          options: [
            "Own the action: raise it with the client or the account manager, agree a change channel, and report back at the next retro",
            "Tell the team to ignore WhatsApp messages",
            "Record it and take no action, as it is outside the team",
            "Ask the developers to raise it with the client themselves",
          ],
          correctIndex: 0,
          explanation:
            "Some impediments sit outside the team; the PM is best placed to carry them. Reporting back shows the retro leads to change.",
        },
        {
          id: "pm-i-retrospectives-q8",
          prompt: "Why bring data such as cycle times or escaped defects into a retro?",
          options: [
            "It grounds the discussion in what happened rather than in whoever speaks loudest",
            "To identify the slowest developer",
            "Because Scrum requires metrics in every retro",
            "To show the client the team is working",
          ],
          correctIndex: 0,
          explanation:
            "Data counters memory bias and dominant voices. Using it to rank individuals destroys the safety the retro depends on.",
        },
        {
          id: "pm-i-retrospectives-q9",
          prompt: "What is the maximum timebox for the Sprint Retrospective in a one-month Sprint?",
          options: ["Three hours", "One hour", "Eight hours", "Fifteen minutes"],
          correctIndex: 0,
          explanation:
            "The Guide sets three hours for a one-month Sprint, usually shorter for shorter Sprints.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write the retro summary you will post in the team channel, based on the notes below. Include what went well, the key problems, and no more than three actions with owners and dates.",
        context:
          "Sprint 9 retro notes (AI tutoring app, Oyelabs team of 6):\n- Went well: lesson-summary feature demoed and the client loved it; pairing on the evaluation set worked.\n- Problems: two stories blocked for 4 days waiting on the client's curriculum export; prompt changes were merged without anyone rerunning the eval set and quality dropped from 88% to 79% for two days; daily stand-up regularly runs 30+ minutes.\n- Last retro's action ('ask client for a single point of contact') was not done.\n- Ideas raised: add eval run to the pull-request checklist; PM to agree data-delivery dates with client before sprint planning; walk the board in stand-up and move discussions to after.",
        wordLimit: 200,
        rubric: [
          {
            id: "balance",
            label: "Balanced summary",
            description: "Briefly captures what went well and the real problems, without blame on individuals.",
            weight: 1,
          },
          {
            id: "actions",
            label: "Concrete, owned actions",
            description: "No more than three actions, each specific with an owner and a date; e.g. eval run in PR checklist (tech lead), client data dates before planning (PM), walk-the-board stand-up (Scrum Master/PM).",
            weight: 3,
          },
          {
            id: "followup",
            label: "Follows up the previous action",
            description: "Acknowledges that last retro's single-point-of-contact action was not done and either carries it forward with an owner or explains why it was dropped.",
            weight: 1,
          },
          {
            id: "clarity",
            label: "Clear and short",
            description: "Scannable, within the word limit, suitable for a team channel.",
            weight: 1,
          },
        ],
        sampleAnswer:
          "Sprint 9 retro summary\n\nWent well: the lesson-summary demo landed well with the client, and pairing on the evaluation set paid off.\n\nProblems: two stories were blocked for 4 days waiting on the curriculum export; prompt changes merged without an eval run dropped quality from 88% to 79% for two days; stand-ups are running 30+ minutes. Last retro's action (single client contact) was not done; it is folded into action 2.\n\nActions:\n1. Add 'eval set rerun, score attached' to the PR checklist for any prompt or model change. Owner: Ravi (tech lead), by Wednesday.\n2. Before each sprint planning, confirm client data deliveries with dates and agree one named client contact for them. Owner: Alex (PM), before Sprint 10 planning.\n3. Walk the board in stand-up and move discussions to after, 15 minutes max. Owner: Mei (Scrum Master), from tomorrow.\n\nWe'll check these first thing at the Sprint 10 retro.",
      },
    },
    {
      id: "pm-i-managing-client-expectations",
      moduleId: "pm-intermediate",
      trackId: "pm",
      title: "Managing Client Expectations",
      summary:
        "Client satisfaction is roughly delivery minus expectation. Two projects can ship the same product on the same date; the client who expected that outcome is happy, and the one who expected more is not. Managing expectations is therefore not spin but a core delivery skill: setting them deliberately, checking them often, and resetting them early and honestly when reality changes.\n\nExpectations are set long before the PM arrives: by sales conversations, the proposal, a competitor's demo, or a news story. So the first job on a new account is to surface what the client actually believes about scope, dates, quality, their own responsibilities and how communication will work, and to correct gaps in writing at kick-off. After that, the rhythm of demos, status reports and RAID updates keeps expectations calibrated. Nothing resets expectations faster than seeing the real software.\n\nAI raises the stakes. Clients have used consumer chatbots and expect that level of fluency on their own messy data, at a fraction of the cost, with no errors. The PM's job is to establish from the start that AI outputs are probabilistic, that quality is measured against an agreed evaluation set rather than anecdotes, that running costs scale with use, and that the system will sometimes say 'I don't know', and should. Show failure cases in demos, not only the best examples, so the first wrong answer in production is not a betrayal.\n\nThe gotchas: saying yes in the room to avoid discomfort, the 'no surprises' rule broken by delaying bad news until it is certain, and over-promising to win a phase-two deal. Under-promising everything is not the answer either; it erodes credibility in a different way. Aim for accurate, specific and early.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "PMI: PMBOK Guide (8th edition) overview", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
        {
          label: "PMI library: Setting expectations (client relationship)",
          url: "https://www.pmi.org/learning/library/setting-expectations-client-relationship-4667",
          kind: "article",
        },
        { label: "PMI library: Managing expectations", url: "https://www.pmi.org/learning/library/approaches-manage-expectations-3135", kind: "article" },
        {
          label: "ProjectManager: Client management - win and retain clients",
          url: "https://www.projectmanager.com/blog/client-management-how-to-win-and-retain-clients",
          kind: "article",
        },
      ],
      video: {
        title: "Tips for Managing Client Expectations",
        channel: "GoDaddy Pro",
        url: "https://www.youtube.com/watch?v=hNlEohG08XM",
        videoId: "hNlEohG08XM",
        durationLabel: "7:18",
      },
      alternateVideos: [
        {
          title: "No More Revisions! Working With Clients — Project Management Tips",
          channel: "The Futur",
          url: "https://www.youtube.com/watch?v=xoOo1bjYsKs",
          videoId: "xoOo1bjYsKs",
          durationLabel: "7:18",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-i-managing-client-expectations-q1",
          prompt: "Where do a new client's expectations usually come from before the PM is involved? (Select all that apply.)",
          options: [
            "Conversations with the sales team",
            "The proposal and its wording",
            "Consumer AI products and competitors' demos",
            "The project's Jira configuration",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Sales talk, proposals and outside products all shape what the client believes they are buying. The PM's first job is to surface and reconcile these at kick-off.",
        },
        {
          id: "pm-i-managing-client-expectations-q2",
          prompt:
            "In a meeting, the client asks whether a new integration 'can be done by Friday'. The PM is unsure. What is the best response?",
          options: [
            "'I'll check with the tech lead and come back to you by tomorrow midday with a realistic date.'",
            "'Yes, no problem.'",
            "'No, that's impossible.'",
            "'We'll try our best.'",
          ],
          correctIndex: 0,
          explanation:
            "Committing to a time to answer, rather than to an unknown, keeps credibility. 'We'll try' sounds like a yes and will be remembered as one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-managing-client-expectations-q3",
          prompt: "Why show failure cases in demos of an AI feature?",
          options: [
            "So the client understands outputs are probabilistic and the first wrong answer in production is not a shock",
            "To lower the price",
            "Because clients prefer to see bugs",
            "To prove the developers tested it",
          ],
          correctIndex: 0,
          explanation:
            "Demoing only cherry-picked successes sets an expectation of perfection. Showing how the system handles failure, such as saying it does not know, builds realistic trust.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-managing-client-expectations-q4",
          prompt: "A client says the chatbot is 'worse than ChatGPT'. What is the most productive response?",
          options: [
            "Bring the conversation back to the agreed evaluation set and results, and ask for specific examples to add to it",
            "Agree and promise to switch to the most expensive model",
            "Explain that ChatGPT is a different product and close the topic",
            "Ignore it; it is just an opinion",
          ],
          correctIndex: 0,
          explanation:
            "Anecdotes against a consumer product cannot be acted on. Turning them into test cases makes quality discussable and measurable, and may reveal real gaps.",
        },
        {
          id: "pm-i-managing-client-expectations-q5",
          prompt: "The PM suspects a two-week slip but is not yet sure. What does a 'no surprises' approach suggest?",
          options: [
            "Tell the client now that there is a risk, what is driving it and when you will know more",
            "Wait until the slip is certain to avoid alarming them",
            "Tell them only if they ask",
            "Add overtime and say nothing",
          ],
          correctIndex: 0,
          explanation:
            "Early warning of a risk gives the client options and preserves trust. Waiting for certainty usually means waiting until the options are gone.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-i-managing-client-expectations-q6",
          prompt: "What should the PM confirm in writing at kick-off about the client's own responsibilities?",
          options: [
            "What the client must provide (data, content, access, approvals), by when, and the impact if it is late",
            "Nothing; the client is paying, so responsibilities are the agency's",
            "Only their payment terms",
            "Only the names of their team",
          ],
          correctIndex: 0,
          explanation:
            "Client-side dependencies are a frequent cause of delay. Agreeing them up front makes slippage visible and fairly attributed.",
        },
        {
          id: "pm-i-managing-client-expectations-q7",
          prompt: "What is the risk of systematically under-promising?",
          options: [
            "It erodes credibility and can lose work, because estimates stop being taken seriously",
            "There is no risk; clients are always happier",
            "It reduces the agency's costs",
            "It makes projects finish early",
          ],
          correctIndex: 0,
          explanation:
            "Padding everything is detectable and makes the agency look slow or expensive. Accurate, specific, early communication beats both over- and under-promising.",
        },
        {
          id: "pm-i-managing-client-expectations-q8",
          prompt: "Which expectations about an AI feature should be explicitly set with the client? (Select all that apply.)",
          options: [
            "Quality is measured against an agreed evaluation set, not individual anecdotes",
            "Running costs grow with usage",
            "The system will sometimes say it does not know, by design",
            "The AI will never make a mistake once tuned",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Measured quality, usage-based cost and designed refusals are realistic expectations. Promising zero mistakes guarantees a breach of expectation.",
        },
        {
          id: "pm-i-managing-client-expectations-q9",
          prompt: "Which regular practice resets client expectations most effectively?",
          options: [
            "Frequent demos of the real, working software",
            "Longer status reports",
            "Monthly invoices",
            "Weekly calls with no agenda",
          ],
          correctIndex: 0,
          explanation:
            "Seeing the actual product corrects misunderstandings faster than any document. That is why Sprint Reviews matter so much at an agency.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Reply to the client's email below. Keep the relationship warm, correct the expectation clearly, and propose a constructive next step.",
        context:
          "From: Head of Customer Experience (client)\n'Hi Alex, saw the latest demo build. Honestly I expected the assistant to be as good as ChatGPT by now. It said \"I'm not sure\" to two of my questions! Our CEO is seeing it on Thursday and I need it to answer everything perfectly. Can the team make that happen?'\n\nFacts: the assistant scores 87% on the agreed 200-question evaluation set (target 90% by launch, 3 weeks away). Saying 'I'm not sure' when the help articles do not cover a question was an agreed design decision to avoid made-up answers. The two questions were about a loyalty programme that has no help articles yet.",
        wordLimit: 220,
        rubric: [
          {
            id: "empathy",
            label: "Acknowledges the concern",
            description: "Takes the CEO demo pressure seriously, with a warm, non-defensive tone.",
            weight: 1,
          },
          {
            id: "reset",
            label: "Corrects the expectation clearly",
            description: "Explains that 'perfect on everything' is not achievable or safe, that 'I'm not sure' was the agreed behaviour to avoid made-up answers, and that the two questions had no source content.",
            weight: 2,
          },
          {
            id: "facts",
            label: "Uses the measured facts",
            description: "Cites 87% against the 90% launch target on the agreed evaluation set, rather than arguing anecdotes.",
            weight: 1,
          },
          {
            id: "next",
            label: "Constructive next step",
            description: "Offers practical actions, e.g. loyalty-programme content from the client, a prepared demo script for Thursday showing strengths and the safe fallback, adding their questions to the eval set.",
            weight: 2,
          },
        ],
        sampleAnswer:
          "Hi Jamie,\n\nThanks for the quick look. I understand Thursday matters, and we'll make sure the CEO sees the assistant at its best.\n\nOn the two 'I'm not sure' answers: both were about the loyalty programme, which has no help articles yet. Saying it isn't sure when it has no source was the behaviour we agreed, so it never invents a policy for a customer. That is a feature we'd want the CEO to see, not hide.\n\nOn overall quality: it currently answers 87% of our agreed 200 test questions correctly, against the 90% target for launch in three weeks. No assistant answers everything perfectly, ChatGPT included, so we measure against that set rather than individual questions.\n\nProposed next steps:\n1. If your team can send the loyalty-programme details by Wednesday, we'll add them and those questions will be answered.\n2. We'll prepare a 10-minute demo script for Thursday covering its strongest flows and one safe 'I'm not sure' handover.\n3. We'll add your questions to the evaluation set.\n\nShall I book 20 minutes tomorrow to walk through the script?\n\nBest,\nAlex",
      },
    },
  ],
} satisfies Module;
