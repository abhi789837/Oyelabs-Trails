import type { Module } from "@/types/curriculum";

export default {
  id: "pm-expert",
  trackId: "pm",
  name: "Programme, Portfolio & AI-Era PM",
  description:
    "For senior PMs and delivery leads: governing programmes and portfolios, making and tracking business cases, using Claude safely in delivery, leading AI-assisted teams, scaling agile, PMP/PMI-ACP alignment, sustainability and coaching other PMs.",
  refs: [
    { label: "PMI: The Standard for Program Management", url: "https://www.pmi.org/standards/program-management", kind: "spec" },
    { label: "PMI: PMP Examination Content Outline 2026 (PDF)", url: "https://www.pmi.org/-/media/pmi/documents/public/pdf/certifications/new-pmp-examination-content-outline-2026.pdf", kind: "spec" },
    { label: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", kind: "spec" },
  ],
  topics: [
    {
      id: "pm-x-portfolio-governance",
      moduleId: "pm-expert",
      trackId: "pm",
      title: "Programme & Portfolio Governance",
      summary:
        "A project delivers outputs; a programme coordinates related projects to deliver benefits none of them could deliver alone; a portfolio is the set of all programmes, projects and operational work an organisation chooses to fund in pursuit of its strategy. The distinction matters because each level answers a different question. Project governance asks \"are we doing this right?\". Programme governance asks \"are these projects together producing the outcome?\". Portfolio governance asks \"are we doing the right things at all, given limited money and people?\".\n\nAt Oyelabs scale, a programme is typically a large client relationship: a white-label platform rolled out to several brands, with a mobile app, an admin portal, an AI assistant and integrations, each run as a project with interdependencies. The portfolio is the agency's whole book of client work plus internal investments (a reusable component library, SOC 2 readiness, AI tooling). PMI's Standard for Program Management centres programmes on benefits management and stakeholder engagement, while SAFe's Lean Portfolio Management replaces annual project funding with lean budgets for value streams and prioritises epics with weighted shortest job first (WSJF: cost of delay divided by job size).\n\nGood governance is light but decisive: clear decision rights (who can approve scope, budget and priority changes at each level), a regular cadence (monthly portfolio review, fortnightly programme board), a small set of comparable measures, and explicit criteria for starting, pausing and stopping work. Its biggest contribution is often saying no: limiting work in progress at portfolio level does for an agency what WIP limits do for a team.\n\nGotchas: governance that only aggregates RAG statuses becomes theatre, because every project reports amber-trending-green. Portfolios that never kill anything starve their best initiatives of the scarce specialists. And cross-project dependencies, not individual project health, are where programmes usually fail, so a programme board should spend most of its time on the dependency map.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "PMI: The Standard for Program Management", url: "https://www.pmi.org/standards/program-management", kind: "spec" },
        { label: "SAFe: Lean Portfolio Management", url: "https://framework.scaledagile.com/lean-portfolio-management", kind: "docs" },
        { label: "PMI: PfMP certification", url: "https://www.pmi.org/certifications/portfolio-management-pfmp", kind: "docs" },
        { label: "Atlassian: Program management", url: "https://www.atlassian.com/agile/project-management/program-management", kind: "article" },
      ],
      video: {
        title: "The Differences Between Portfolio, Programme and Project Management | Fundamentals",
        channel: "Psoda",
        url: "https://www.youtube.com/watch?v=i9-1v7ujvTk",
        videoId: "i9-1v7ujvTk",
      },
      alternateVideos: [
        {
          title: "What is Program Management?",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=TPPLWC_zd1I",
          videoId: "TPPLWC_zd1I",
        },
        {
          title: "SAFe® Lean Portfolio Management: Defining Portfolio (1 of 4 )",
          channel: "iZenBridge Consultancy Pvt Ltd.",
          url: "https://www.youtube.com/watch?v=-WLAeKNfwPU",
          videoId: "-WLAeKNfwPU",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-portfolio-governance-q1",
          prompt:
            "A client wants its white-label fitness platform launched for five gym brands, each needing a mobile app, an admin portal and a shared AI coaching service. What is this best managed as?",
          options: [
            "A programme: related projects coordinated to deliver a shared benefit, with dependency and benefits management across them",
            "A single large project with one backlog",
            "A portfolio, because there are several brands",
            "Five unrelated projects with separate PMs and no coordination",
          ],
          correctIndex: 0,
          explanation:
            "Interdependent projects producing a combined outcome are a programme. A portfolio is the organisation-level set of investments, and treating the brands as unrelated ignores the shared AI service.",
        },
        {
          id: "pm-x-portfolio-governance-q2",
          prompt: "Which question is portfolio governance primarily responsible for?",
          options: [
            "Are we funding the right mix of work for our strategy, given limited money and people?",
            "Is this sprint on track?",
            "Are the projects in this programme delivering their combined benefits?",
            "Is this deliverable meeting acceptance criteria?",
          ],
          correctIndex: 0,
          explanation:
            "Portfolio is about selection and balance against strategy. Programme governance covers combined benefits, and project or team levels cover delivery and acceptance.",
        },
        {
          id: "pm-x-portfolio-governance-q3",
          prompt:
            "Using WSJF, which initiative should go first? Initiative A: cost of delay 20, job size 10. Initiative B: cost of delay 12, job size 3. Initiative C: cost of delay 30, job size 20.",
          options: ["B (WSJF 4.0)", "C (highest cost of delay)", "A (WSJF 2.0)", "C (WSJF 1.5)"],
          correctIndex: 0,
          explanation:
            "WSJF = cost of delay / job size: A = 2.0, B = 4.0, C = 1.5. Picking by cost of delay alone ignores that small, valuable jobs deliver value sooner.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-portfolio-governance-q4",
          prompt: "Which are signs of governance theatre rather than real governance? (Select all that apply.)",
          options: [
            "Every project reports amber-trending-green for months",
            "The portfolio review has never paused or stopped an initiative",
            "Decisions about priority are actually made in corridor conversations after the meeting",
            "Decision rights for scope and budget changes are written down",
            "The programme board reviews the cross-project dependency map",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Unchanging statuses, no stop decisions and real decisions happening elsewhere show the forum isn't governing. Written decision rights and dependency reviews are signs it works.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-portfolio-governance-q5",
          prompt:
            "Five client projects are each green, but the shared AI coaching service they all depend on is two months behind. Where should the programme board focus?",
          options: [
            "The dependency: re-sequence the projects, add capacity to the shared service, or define interim fallbacks",
            "Nowhere; the projects are green",
            "On the project with the largest budget",
            "On replacing the PMs of the five projects",
          ],
          correctIndex: 0,
          explanation:
            "Programmes usually fail at dependencies, not individual projects. Five green projects waiting on a late shared component will all slip together.",
        },
        {
          id: "pm-x-portfolio-governance-q6",
          prompt: "What does SAFe's Lean Portfolio Management change compared with traditional project funding?",
          options: [
            "It funds value streams with lean budgets and guardrails rather than approving and funding each project individually",
            "It removes all budgeting",
            "It funds only fixed-price projects",
            "It requires a PMO to approve every user story",
          ],
          correctIndex: 0,
          explanation:
            "LPM shifts funding to persistent value streams with guardrails, so teams don't wait for project-by-project approvals. Budgets still exist, and story-level approval is the opposite of its intent.",
        },
        {
          id: "pm-x-portfolio-governance-q7",
          prompt:
            "The agency's portfolio has 14 initiatives in progress, and the three ML engineers are split across nine of them. What is the highest-leverage portfolio decision?",
          options: [
            "Limit portfolio WIP: finish or pause initiatives so the scarce specialists work on fewer at once",
            "Hire three more ML engineers before deciding anything",
            "Ask each initiative to report weekly instead of monthly",
            "Start two more initiatives to keep options open",
          ],
          correctIndex: 0,
          explanation:
            "Spreading specialists across nine initiatives slows all of them; limiting WIP is the fastest way to increase throughput. Hiring takes months, and more reporting doesn't add capacity.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-portfolio-governance-q8",
          prompt: "Which elements does light but effective programme governance need? (Select all that apply.)",
          options: [
            "Clear decision rights for scope, budget and priority at each level",
            "A regular decision cadence with a small set of comparable measures",
            "Explicit criteria for starting, pausing and stopping work",
            "Weekly 60-slide status packs from every project",
            "Unanimous agreement before any change",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Decision rights, cadence, comparable measures and stop criteria make governance decisive. Huge packs and unanimity rules slow decisions without improving them.",
        },
        {
          id: "pm-x-portfolio-governance-q9",
          prompt: "Which PMI certification targets portfolio managers rather than programme managers?",
          options: ["PfMP", "PgMP", "PMI-ACP", "CAPM"],
          correctIndex: 0,
          explanation:
            "PfMP is the Portfolio Management Professional; PgMP is for programme managers, PMI-ACP for agile practitioners and CAPM is the entry-level certification.",
        },
        {
          id: "pm-x-portfolio-governance-q10",
          prompt:
            "A profitable client asks for a new mobile app that doesn't fit Oyelabs' AI-platform strategy and would use the only iOS developer for six months. How should portfolio governance treat it?",
          options: [
            "Evaluate it against strategy, capacity and margin alongside the other candidates, and be willing to decline or partner it out",
            "Accept automatically, because revenue is always good",
            "Reject automatically, because it's off-strategy",
            "Let the account manager decide alone",
          ],
          correctIndex: 0,
          explanation:
            "Portfolio governance weighs the opportunity cost of scarce people against strategy and margin. Automatic yes or no skips the analysis, and one person deciding bypasses the portfolio view.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "You chair Oyelabs' quarterly portfolio review. Rank these five internal and client initiatives by weighted shortest job first (WSJF = (business value + time criticality + risk reduction) / job size), highest first. Scores use a relative Fibonacci-like scale.\n\n- Model-cost monitoring dashboard: value 5, time 5, risk 8; size 3\n- AI support assistant for the largest retainer client: value 8, time 8, risk 5; size 5\n- SOC 2 readiness (enterprise deals blocked without it): value 6, time 13, risk 13; size 13\n- Internal white-label component library: value 5, time 2, risk 8; size 8\n- New agency marketing website: value 3, time 1, risk 1; size 3",
        items: [
          { id: "cost-dash", label: "Model-cost monitoring dashboard" },
          { id: "ai-assist", label: "AI support assistant for the largest retainer client" },
          { id: "soc2", label: "SOC 2 readiness" },
          { id: "lib", label: "Internal white-label component library" },
          { id: "site", label: "New agency marketing website" },
        ],
        correctOrder: ["cost-dash", "ai-assist", "soc2", "lib", "site"],
        explanation:
          "WSJF: dashboard 18 / 3 = 6.0; AI assistant 21 / 5 = 4.2; SOC 2 32 / 13 = 2.46; component library 15 / 8 = 1.88; website 5 / 3 = 1.67. SOC 2 has the highest cost of delay but is large, so smaller high-value jobs go first; consider splitting SOC 2 into smaller increments to raise its WSJF.",
      },
    },
    {
      id: "pm-x-business-case",
      moduleId: "pm-expert",
      trackId: "pm",
      title: "Business Cases: Justifying Investment with ROI, Payback & NPV",
      summary:
        "A business case is the argument for spending money: what problem or opportunity exists, what options were considered (including doing nothing), what each costs, what benefits it creates, what risks it carries, and why the recommended option is the best use of limited funds. It is how a client's sponsor gets budget approved and how Oyelabs decides which internal investments to fund. PMI's 2026 PMP outline gives the Business Environment domain a much larger share (26%, up from 8%) precisely because PMs are now expected to connect delivery to value, not just to scope, schedule and cost.\n\nThree financial measures appear in most cases. Payback period is how long until cumulative net benefits repay the investment; simple, intuitive, but it ignores everything after payback. ROI is net benefit over cost for a stated period; easy to compare, easy to manipulate by choosing the period. Net present value (NPV) discounts future cash flows at the organisation's cost of capital, so a dollar in year three counts for less than a dollar today; positive NPV means the investment beats the alternative use of the money. Use all three, and always state the period, the discount rate and the assumptions.\n\nFor AI-powered platforms, the cost side is where cases go wrong. Build cost is visible; running costs are not: model inference at production volume, vector storage, evaluation and monitoring, prompt and model maintenance as providers deprecate models, and human review of AI output. A case that counts only build cost will overstate ROI badly.\n\nGotchas: benefits are usually estimated by the people who want the project, so they skew optimistic; ask for a baseline measurement and a named benefit owner. Compare against a credible do-minimum option, not a straw man. And remember a business case is a living document: revisit it at each phase gate, and recommend stopping if the case no longer holds.",
      level: "expert",
      estMinutes: 50,
      webRefs: [
        { label: "PMI: PMBOK Guide 8th edition (value delivery, outcomes)", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
        { label: "Atlassian: Business case", url: "https://www.atlassian.com/work-management/project-management/business-case", kind: "article" },
        { label: "Asana: Business case", url: "https://asana.com/resources/business-case", kind: "article" },
      ],
      video: {
        title: "What is a Business Case? Project Management in Under 5",
        channel: "Online PM Courses - Mike Clayton",
        url: "https://www.youtube.com/watch?v=c95wGysj9Nc",
        videoId: "c95wGysj9Nc",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-business-case-q1",
          prompt:
            "An AI triage feature costs $100,000 to build and returns $40,000 a year in net savings. What is the simple payback period?",
          options: ["2.5 years", "0.4 years", "4 years", "1.5 years"],
          correctIndex: 0,
          explanation: "100,000 / 40,000 = 2.5 years. Dividing the other way (0.4) is the usual slip.",
        },
        {
          id: "pm-x-business-case-q2",
          prompt: "Why is NPV generally preferred to simple payback for comparing investments?",
          options: [
            "It accounts for the time value of money and for all cash flows over the period, not just those before payback",
            "It's always a larger number",
            "It doesn't need any assumptions",
            "It ignores running costs",
          ],
          correctIndex: 0,
          explanation:
            "Payback ignores later benefits and treats all years equally. NPV discounts every year's cash flow, but it still depends on assumptions such as the discount rate.",
        },
        {
          id: "pm-x-business-case-q3",
          prompt:
            "Which costs are commonly missing from business cases for AI-powered features? (Select all that apply.)",
          options: [
            "Model inference costs at production volume",
            "Ongoing evaluation, monitoring and prompt maintenance",
            "Migration work when the model provider deprecates a model",
            "The initial build cost",
            "The design of the login screen",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Usage-based inference, evaluation and model churn are recurring, easily missed costs. Build cost is the one everyone includes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-business-case-q4",
          prompt:
            "Option A has an NPV of $80,000 and payback of 3 years. Option B has an NPV of $45,000 and payback of 1.2 years. The client is a cash-constrained start-up that must show results within 18 months. Which is the better recommendation?",
          options: [
            "B: the client's cash and time constraints make faster payback more important than the higher long-term NPV",
            "A, because NPV is always the deciding factor",
            "Neither, because the payback periods differ",
            "A, because longer payback means lower risk",
          ],
          correctIndex: 0,
          explanation:
            "Financial measures inform a decision within the client's context. NPV is a strong default, but a liquidity constraint can rightly favour faster payback; longer payback usually means more risk, not less.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-business-case-q5",
          prompt: "What should the do-nothing (or do-minimum) option in a business case represent?",
          options: [
            "A credible estimate of what happens if the organisation doesn't invest, including its costs and risks",
            "A deliberately poor option to make the recommendation look good",
            "Zero cost and zero benefit by definition",
            "The cheapest vendor's quote",
          ],
          correctIndex: 0,
          explanation:
            "Doing nothing usually has costs (manual work, lost customers, compliance risk). A straw-man baseline inflates the case and undermines credibility.",
        },
        {
          id: "pm-x-business-case-q6",
          prompt: "A project's 3-year ROI is reported as 220%, but the same project's 1-year ROI is -40%. What does this show?",
          options: [
            "ROI depends heavily on the chosen period, so the period must always be stated",
            "One of the calculations is wrong",
            "The project should be rejected",
            "ROI can't be negative",
          ],
          correctIndex: 0,
          explanation:
            "Early years carry the investment; later years carry the benefits. Both figures can be right, which is why ROI without a period is meaningless.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-business-case-q7",
          prompt: "When should a business case be revisited?",
          options: [
            "At each phase gate and whenever a major assumption changes, with a willingness to recommend stopping",
            "Only at project approval",
            "Only after the project closes",
            "Never; changing it undermines the decision",
          ],
          correctIndex: 0,
          explanation:
            "A business case is a living justification. If costs rise or benefits shrink, continuing on the original case is how organisations fund failing projects.",
        },
        {
          id: "pm-x-business-case-q8",
          prompt: "Which practices make benefit estimates more credible? (Select all that apply.)",
          options: [
            "Measure a baseline before the project starts",
            "Name a benefit owner in the client's business who agrees to the figure",
            "Show ranges or scenarios rather than a single optimistic figure",
            "Let the delivery team set the targets alone",
            "Count every possible benefit at its maximum value",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Baselines, accountable owners and ranges counter optimism bias. Targets set only by the team doing the work, or maximised benefits, inflate the case.",
        },
        {
          id: "pm-x-business-case-q9",
          prompt: "In the 2026 PMP exam content outline, how has the weight of the Business Environment domain changed?",
          options: [
            "It increased to 26%, from 8% in the previous outline",
            "It decreased to 8%",
            "It stayed the same at 26%",
            "It was removed and merged into Process",
          ],
          correctIndex: 0,
          explanation:
            "PMI's 2026 outline weights People 33%, Process 41% and Business Environment 26%, up from 8%, reflecting the emphasis on value and business outcomes.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "A logistics client is considering an AI dispatch assistant. Build cost is $150,000 (paid now, year 0). From year 1 it saves $90,000 a year in dispatcher time, and running costs (inference, monitoring, maintenance) are $20,000 a year. Evaluate the case over 3 years with a 10% discount rate.",
        table: {
          columns: ["Year", "Cash flow"],
          rows: [
            ["0", "-$150,000 (build)"],
            ["1", "+$90,000 savings, -$20,000 running"],
            ["2", "+$90,000 savings, -$20,000 running"],
            ["3", "+$90,000 savings, -$20,000 running"],
          ],
        },
        fields: [
          { id: "net", label: "Net annual benefit (years 1-3)", unit: "$", answer: 70000, tolerance: 1 },
          { id: "payback", label: "Simple payback period", unit: "years", answer: 2.14, tolerance: 0.01 },
          { id: "roi", label: "3-year ROI ((total net benefit - build cost) / build cost)", unit: "%", answer: 40, tolerance: 0.5 },
          { id: "npv", label: "NPV at 10% over 3 years", unit: "$", answer: 24079, tolerance: 60 },
        ],
        explanation:
          "Net benefit 90k - 20k = 70k a year. Payback = 150 / 70 = 2.14 years. ROI = (210k - 150k) / 150k = 40%. NPV = 70k/1.1 + 70k/1.21 + 70k/1.331 - 150k = 63,636 + 57,851 + 52,592 - 150,000 = $24,079. If the case had left out the $20k running costs, NPV would have looked like about $74k: the AI running-cost trap in numbers.",
      },
    },
    {
      id: "pm-x-benefits-realisation",
      moduleId: "pm-expert",
      trackId: "pm",
      title: "Benefits Realisation & Value Delivery",
      summary:
        "Projects end; benefits usually start after they end. That timing mismatch is why benefits realisation management exists: someone has to track whether the AI support assistant actually reduced ticket handling time six months after Oyelabs handed it over and the project team moved on. PMI frames this as value delivery: the project is a means, the outcome is the point, and the PMBOK Guide and the 2026 PMP outline both push PMs to manage towards outcomes rather than outputs.\n\nThe mechanics are straightforward. Define each benefit as a measurable change (from a baseline to a target, by a date); give it an owner in the client's business, not in the delivery team, because only the business can change processes to capture the benefit; map which deliverables enable it (a benefits map or dependency chain); plan when and how it will be measured; and hand the benefits register over at project close with the reviews scheduled. Distinguish outputs (an AI triage model in production), outcomes (agents use triage suggestions on 70% of tickets) and benefits (average handling time down 25%, worth a stated amount).\n\nFor an agency this is commercial strategy as much as governance. Clients renew retainers and commission phase two when they can see value; a post-launch benefits review is the most credible case study and upsell conversation Oyelabs can have. It also exposes dis-benefits: AI features can add review workload, raise support tickets from confused users or increase cloud spend.\n\nGotchas: benefits that depend on business change (new processes, training, retired legacy tools) will not appear just because the software shipped, so name the enabling changes and their owners. Attribution is hard: if handling time falls while the client also hired more agents, you need a comparison group or a clear method. And avoid vanity measures such as \"number of AI conversations\", which grow whether or not anyone benefits.",
      level: "expert",
      estMinutes: 45,
      webRefs: [
        { label: "PMI: PMBOK Guide 8th edition (value delivery, outcomes)", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
        { label: "PMI: The Standard for Program Management", url: "https://www.pmi.org/standards/program-management", kind: "spec" },
        { label: "Atlassian: Business case", url: "https://www.atlassian.com/work-management/project-management/business-case", kind: "article" },
      ],
      video: {
        title: "Understand Benefits Realization",
        channel: "Project Management Institute (PMI)",
        url: "https://www.youtube.com/watch?v=UxJb40pAnac",
        videoId: "UxJb40pAnac",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-benefits-realisation-q1",
          prompt: "Which is a benefit, rather than an output or an outcome?",
          options: [
            "Average ticket handling time falls from 12 to 9 minutes within six months, saving about $180,000 a year",
            "An AI triage model deployed to production",
            "Agents use the triage suggestions on 70% of tickets",
            "A triage dashboard delivered to the client",
          ],
          correctIndex: 0,
          explanation:
            "A benefit is a measurable improvement valued by the business. A deployed model or dashboard is an output, and agents using suggestions is an outcome that enables the benefit.",
        },
        {
          id: "pm-x-benefits-realisation-q2",
          prompt: "Who should normally own a benefit such as reduced handling time?",
          options: [
            "A named manager in the client's business who controls the processes needed to capture it",
            "The Oyelabs PM",
            "The development team lead",
            "The model provider",
          ],
          correctIndex: 0,
          explanation:
            "Benefits are realised through business change after delivery, so the business must own them. The PM enables and tracks, but leaves when the project closes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-benefits-realisation-q3",
          prompt: "Which elements should each entry in a benefits register have? (Select all that apply.)",
          options: [
            "A baseline measurement and a target with a date",
            "An owner in the business",
            "The measurement method and review schedule",
            "The developer who built the feature",
            "The sprint in which it was delivered",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Baseline, target, owner and measurement plan make a benefit trackable. Who built it or which sprint delivered it are delivery records, not benefit tracking.",
        },
        {
          id: "pm-x-benefits-realisation-q4",
          prompt:
            "Six months after launch, the AI assistant is live and working, but handling time hasn't changed. Agents say they weren't trained and still use the old macros. What failed?",
          options: [
            "The enabling business change (training and retiring old macros) wasn't planned or owned, so the outcome never happened",
            "The AI model is inadequate",
            "The benefit target was too low",
            "Benefits can't be measured for AI features",
          ],
          correctIndex: 0,
          explanation:
            "Shipping software doesn't change behaviour by itself. Benefit plans must name enabling changes and owners; blaming the model skips the evidence.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-benefits-realisation-q5",
          prompt:
            "Handling time fell 20% after launch, but the client also hired 15 experienced agents in the same quarter. What's the most rigorous way to attribute the benefit?",
          options: [
            "Compare like-for-like groups (for example agents with and without the assistant, or before and after for the same agents) and adjust for the hiring",
            "Attribute the full 20% to the assistant",
            "Attribute none of it, because there are confounding factors",
            "Ask agents how much faster they feel",
          ],
          correctIndex: 0,
          explanation:
            "A comparison group or controlled before-and-after isolates the effect. Claiming all or none ignores the evidence, and self-reported speed is unreliable: people tend to overestimate AI speed-ups.",
        },
        {
          id: "pm-x-benefits-realisation-q6",
          prompt: "Which of these are vanity measures for an AI chatbot rather than indicators of benefit? (Select all that apply.)",
          options: [
            "Total number of AI conversations",
            "Number of prompts in the system prompt library",
            "Tokens processed per month",
            "Share of conversations resolved without human hand-off, checked for quality",
            "Customer satisfaction on resolved conversations compared with the human baseline",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Volume counts rise whether or not anyone benefits. Quality-checked resolution and satisfaction against a baseline relate to the value the client wants.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-benefits-realisation-q7",
          prompt: "What is a dis-benefit, and why should it be tracked?",
          options: [
            "A negative consequence of the change, such as extra review workload or higher cloud spend, which offsets the benefits and must be managed",
            "A benefit that arrives later than planned",
            "A benefit owned by the vendor",
            "A benefit that cannot be measured",
          ],
          correctIndex: 0,
          explanation:
            "Dis-benefits are real costs of the change. Ignoring them overstates net value; late or hard-to-measure benefits are different issues.",
        },
        {
          id: "pm-x-benefits-realisation-q8",
          prompt: "Why is a post-launch benefits review commercially valuable to an agency?",
          options: [
            "It produces evidence of value that supports renewals, phase-two work and credible case studies",
            "It lets the agency invoice for the benefits",
            "It replaces the need for acceptance testing",
            "It's a contractual requirement in every SOW",
          ],
          correctIndex: 0,
          explanation:
            "Demonstrated value is the strongest basis for expanding an account. It doesn't replace acceptance, and it isn't automatically billable or required.",
        },
        {
          id: "pm-x-benefits-realisation-q9",
          prompt: "When should benefits measurement be planned?",
          options: [
            "In the business case and at project start, including the baseline, because a baseline can't be measured after the change",
            "After launch, once the benefits appear",
            "Only if the client asks",
            "At the final retrospective",
          ],
          correctIndex: 0,
          explanation:
            "Once the new system is live, the 'before' state is gone. Planning measurement late is the most common reason benefits can't be proven.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write a short benefits realisation summary for the client steering group three months after launch, using the data in the context. Cover what was achieved against the baseline and target, what is behind and why, any dis-benefit, and the actions and owners needed to realise the rest.",
        context:
          "Client: ShopNest (white-label e-commerce platform). Feature: AI product-question assistant launched 1 June. Business case targets (by 1 December): 30% fewer pre-sale support tickets (baseline 4,000 a month), conversion rate up from 2.1% to 2.4%. Three-month data (September): tickets 3,200 a month (-20%); conversion 2.2%. The assistant answers 62% of questions without hand-off; spot-checks rate 91% of answers accurate. Dis-benefit: LLM running costs are $3,800 a month against $2,500 planned, because answers include long product descriptions. Only 4 of 9 brand stores have enabled the assistant; enabling is owned by each brand's store manager (Head of Brands: Lena Ortiz). Oyelabs can cut answer length (est. 30% cost reduction) in a two-week change.",
        wordLimit: 220,
        rubric: [
          { id: "progress", label: "Progress against baseline and target", description: "States ticket and conversion figures against baseline and target accurately, without overclaiming.", weight: 1.5 },
          { id: "cause", label: "Explains the gap", description: "Identifies the main reason benefits lag: only 4 of 9 stores enabled, a business-change issue rather than a technology issue.", weight: 1.5 },
          { id: "disbenefit", label: "Addresses the dis-benefit", description: "Reports the running-cost overrun with its cause and the proposed fix.", weight: 1 },
          { id: "actions", label: "Actions with owners and dates", description: "Proposes specific actions (store enablement owned by Lena Ortiz, answer-length change by Oyelabs) with dates or timeframes.", weight: 1.5 },
          { id: "clarity", label: "Concise and decision-ready", description: "Readable by a steering group in under two minutes; clearly asks for any decision needed.", weight: 1 },
        ],
        sampleAnswer:
          "Benefits review: AI product assistant, three months after launch\n\nProgress: pre-sale tickets are down 20% (4,000 to 3,200 a month) against a 30% target for 1 December. Conversion has risen from 2.1% to 2.2% against a 2.4% target. The assistant resolves 62% of questions without hand-off, and spot-checks rate 91% of answers accurate.\n\nWhy we're behind: only 4 of 9 brand stores have switched the assistant on. The results so far come from fewer than half the stores, so the main gap is rollout, not the technology.\n\nDis-benefit: LLM running costs are $3,800 a month against $2,500 planned, because answers quote long product descriptions. Oyelabs can shorten answers in a two-week change, which we estimate will cut cost by about 30%.\n\nActions:\n1. Lena Ortiz to agree enablement dates with the remaining five store managers, targeting all stores live by 31 October.\n2. Oyelabs to deliver the answer-length change by 15 October (decision needed today).\n3. Re-measure tickets and conversion on 1 December, comparing enabled and non-enabled periods per store.\n\nDecision requested: approve the answer-length change.",
      },
    },
    {
      id: "pm-x-ai-prds-meeting-notes",
      moduleId: "pm-expert",
      trackId: "pm",
      title: "Claude for PRDs, Meeting Notes & Delivery Documents",
      summary:
        "Language models are genuinely good at the document-heavy parts of a PM's job: turning a messy discovery call transcript into a structured summary, drafting a PRD from notes and a template, rewriting a status update for a non-technical sponsor, or turning a client email thread into a decision log. Used well, Claude removes the blank-page problem and gives back hours a week. Used carelessly, it produces fluent documents that state things nobody decided.\n\nThe risk is specific. Models fill gaps plausibly: a PRD draft may include a success metric, a date or an integration that nobody mentioned, written in the same confident tone as everything else. Meeting summaries can merge two speakers, turn a suggestion into a decision, or drop the one caveat that mattered. Anthropic's guidance on reducing hallucinations applies directly: give the model the source material, tell it to use only that material, allow it to say it doesn't know, ask it to quote the passages that support each claim, and flag anything it inferred rather than read. A good PM prompt asks for decisions, owners and dates only where stated, and an \"open questions\" section for everything else.\n\nThe PM remains the author. Verification is not a quick skim: check every decision, number, name and date against the source, read the open-questions list, and have the person who owns a decision confirm it before the document is shared. Structure helps: a team prompt library with a fixed PRD template (problem, users, goals, non-goals, requirements, acceptance criteria, risks, open questions) produces consistent drafts that are faster to review.\n\nGotchas: the most dangerous errors are plausible ones, so be most suspicious of details that sound right. Summaries reflect the transcript, so a poor recording or an accent the transcription tool struggled with propagates errors. And never paste client material into a tool or account Oyelabs has not approved for that client's data; the next topic covers confidentiality.",
      level: "expert",
      estMinutes: 45,
      webRefs: [
        { label: "Claude Docs: Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", kind: "docs" },
        { label: "Claude Docs: Prompt engineering overview", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview", kind: "docs" },
        { label: "PMI: AI in Project Management hub", url: "https://www.pmi.org/learning/ai-in-project-management", kind: "article" },
      ],
      video: {
        title: "How Anthropic uses Claude in Product Management",
        channel: "Claude",
        url: "https://www.youtube.com/watch?v=91AJ0cpgLlQ",
        videoId: "91AJ0cpgLlQ",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-ai-prds-meeting-notes-q1",
          prompt:
            "Claude drafts a PRD from your discovery notes. It includes \"Success metric: 40% reduction in onboarding time.\" Nobody mentioned a metric in discovery. What should you do?",
          options: [
            "Remove it or move it to open questions, and agree a real metric with the client",
            "Keep it: it's a sensible target",
            "Keep it but lower it to 20% to be safe",
            "Ask Claude whether the number is correct",
          ],
          correctIndex: 0,
          explanation:
            "An invented metric becomes a commitment once the client reads it. Asking the model to confirm its own invention doesn't verify anything; the source notes do.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q2",
          prompt: "Which prompt instructions reduce fabricated content in a meeting summary? (Select all that apply.)",
          options: [
            "Use only the transcript provided; if something isn't stated, say so",
            "List decisions only where the transcript shows explicit agreement, with a supporting quote",
            "Put anything uncertain or implied under open questions",
            "Make the summary sound confident and complete",
            "Fill in missing owners with the most likely person",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Grounding in the source, quoting evidence and allowing uncertainty are Anthropic's recommended techniques. Asking for confidence or inferred owners invites exactly the errors you're trying to avoid.",
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q3",
          prompt: "Which kind of error in an AI-generated meeting summary is most dangerous?",
          options: [
            "A plausible but wrong decision or date written in the same tone as correct content",
            "An obvious spelling mistake",
            "A summary that's slightly too long",
            "A formatting inconsistency",
          ],
          correctIndex: 0,
          explanation:
            "Plausible errors pass a skim and get acted on. Obvious mistakes get caught; length and formatting are cosmetic.",
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q4",
          prompt: "What does verifying an AI-drafted decision log properly involve?",
          options: [
            "Checking each decision, owner, number and date against the source, and having decision owners confirm before it's shared",
            "Reading it once for tone",
            "Running it through a second AI tool",
            "Trusting it if the model was given the full transcript",
          ],
          correctIndex: 0,
          explanation:
            "Verification compares claims with sources and with the people who made the decisions. A second model can help spot issues but isn't verification; full context reduces errors but doesn't eliminate them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q5",
          prompt: "Why does a shared PRD template in the team's prompt library improve AI-drafted PRDs?",
          options: [
            "It produces consistent structure, including non-goals and open questions, so drafts are faster and safer to review",
            "It makes the model more creative",
            "It removes the need for review",
            "It guarantees accurate content",
          ],
          correctIndex: 0,
          explanation:
            "Consistent sections make gaps visible and review quicker. Templates don't make content correct, so review is still required.",
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q6",
          prompt: "Which tasks are good uses of Claude for a PM? (Select all that apply.)",
          options: [
            "Turning a call transcript into a structured summary with open questions",
            "Rewriting a technical status update for a non-technical sponsor",
            "Drafting acceptance criteria from agreed user stories for the team to refine",
            "Sending client commitments directly without review",
            "Deciding scope trade-offs on the client's behalf",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Drafting and restructuring with human review is the sweet spot. Commitments and scope decisions need accountable humans.",
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q7",
          prompt:
            "A summary attributes a suggestion about a 2FA requirement to the client's CTO, but in the recording it was your own developer who suggested it. Why does this matter?",
          options: [
            "It turns an internal idea into an apparent client requirement, which can create scope and cost obligations",
            "It doesn't: the content is the same",
            "Only because the CTO might be offended",
            "Because 2FA is always out of scope",
          ],
          correctIndex: 0,
          explanation:
            "Who said something changes its status: a client requirement versus an option we raised. Misattribution is a common summarisation error with commercial consequences.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q8",
          prompt: "For long source documents, which technique does Anthropic recommend to ground Claude's analysis?",
          options: [
            "Ask Claude to extract word-for-word quotes first, then do the task based on those quotes",
            "Ask for a shorter answer",
            "Raise the temperature",
            "Split the document and never give the full text",
          ],
          correctIndex: 0,
          explanation:
            "Anthropic's hallucination guide recommends extracting direct quotes first for long documents. Shorter answers or higher temperature don't ground the output.",
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q9",
          prompt: "Who is accountable for the content of an AI-drafted PRD sent to a client?",
          options: [
            "The PM who sends it",
            "The AI vendor",
            "The prompt author, if different",
            "Nobody, if a disclaimer says it was AI-assisted",
          ],
          correctIndex: 0,
          explanation:
            "Tools don't take accountability. A disclaimer doesn't change who the client holds responsible for commitments in the document.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A PM asked Claude to summarise a 45-minute kick-off call for a white-label telemedicine app. Compare it with the facts below and mark the lines that aren't supported by the call.\n\nFacts from the transcript: the client (CEO Ana, CTO Raj) agreed iOS and Android apps plus a clinician web portal. Raj asked about HIPAA but said legal would confirm whether it applies. Video calls will use a third-party provider, not yet chosen. Ana wants a beta before her board meeting in March but gave no launch date. Oyelabs' developer suggested an AI note-taking feature; Ana said 'interesting, let's discuss later'. The next call is Thursday.",
        segments: [
          { id: "l1", text: "Scope agreed: iOS and Android patient apps and a clinician web portal.", issue: null },
          { id: "l2", text: "Decision: the platform will be HIPAA compliant.", issue: "Raj only asked; legal is to confirm whether HIPAA applies. It's an open question, not a decision." },
          { id: "l3", text: "Video calls will use a third-party provider (to be selected).", issue: null },
          { id: "l4", text: "Launch date: 15 April.", issue: "No launch date was given; the model invented a plausible one." },
          { id: "l5", text: "Ana wants a beta before her March board meeting.", issue: null },
          { id: "l6", text: "Client requested an AI note-taking feature for clinicians, to be included in phase 1.", issue: "Oyelabs suggested it, and Ana deferred discussion; it's neither a client request nor in scope." },
          { id: "l7", text: "Open question: which video provider to use.", issue: null },
          { id: "l8", text: "Owner for video provider selection: Raj, by Friday.", issue: "No owner or date was set in the call." },
          { id: "l9", text: "Next call: Thursday.", issue: null },
          { id: "l10", text: "Open question: whether HIPAA applies (legal to confirm).", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pm-x-ai-risk-estimates",
      moduleId: "pm-expert",
      trackId: "pm",
      title: "Claude for Risk Analysis & Estimates, With Verification",
      summary:
        "Two of the most valuable things a model can do for a PM are to widen thinking and to challenge numbers. Given a project brief, Claude will produce a broader first-pass risk list than most people write alone, including categories teams forget (data-protection review, app-store rejection, model deprecation, client-side decision latency). Given an estimate breakdown, it can spot missing work (environments, migrations, evaluation sets, documentation, hypercare) and question optimistic assumptions. Used as a sparring partner, it reduces blind spots.\n\nIts limits are equally specific. A model has no access to your team's actual velocity, your client's politics or your codebase unless you give them, so its probability and impact ratings are generic. It will produce estimates that look precise (\"112 hours\") with no historical basis, and it tends to agree with the framing it is given: ask \"is 400 hours reasonable?\" and you will often get yes. Numbers from a model are hypotheses to test against your own reference data, never inputs to a quote.\n\nGood practice: give the model the brief, the work breakdown and your historical data; ask it to list risks by category with the triggering evidence from the brief; ask for missing work items rather than totals; ask it to argue against your estimate (\"what would make this take twice as long?\"); and compare its output with reference-class data from similar Oyelabs projects. Then the PM and the team own the final register and estimate, with clear owners, responses and ranges.\n\nGotchas: generic risks (\"scope creep\", \"communication issues\") feel thorough but drive no action; push for project-specific risks with triggers and owners. Anchoring works on people too: if the team sees the model's number first, their own estimates drift towards it, so estimate independently, then compare. And estimates for AI features themselves remain the hardest to make; the model cannot tell you how many iterations your client's evaluation set will need.",
      level: "expert",
      estMinutes: 45,
      webRefs: [
        { label: "Claude Docs: Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", kind: "docs" },
        { label: "Claude Docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices", kind: "docs" },
        { label: "Atlassian: Agile estimation", url: "https://www.atlassian.com/agile/project-management/estimation", kind: "article" },
        { label: "Asana: RAID log", url: "https://asana.com/resources/raid-log", kind: "article" },
      ],
      video: {
        title: "Tips for Using Generative AI Tools in Project Management",
        channel: "Project Management Institute (PMI)",
        url: "https://www.youtube.com/watch?v=bN8vPip_7y4",
        videoId: "bN8vPip_7y4",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-ai-risk-estimates-q1",
          prompt: "You ask Claude: \"Is 400 hours a reasonable estimate for this AI chatbot?\" Why is this a weak prompt?",
          options: [
            "It anchors the model on your number and invites agreement, instead of asking it to find missing work or argue against the estimate",
            "It's too short",
            "Models can't discuss hours",
            "It should ask for days instead of hours",
          ],
          correctIndex: 0,
          explanation:
            "Leading questions get agreeable answers. Ask for missing items, risks that would double the effort, or a critique, and give it your breakdown and history.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-risk-estimates-q2",
          prompt: "Which are good uses of a model in estimation? (Select all that apply.)",
          options: [
            "Spotting missing work items such as environments, migrations, evaluation sets and hypercare",
            "Challenging assumptions: what would make this take twice as long?",
            "Comparing your breakdown with the categories in past project estimates you provide",
            "Producing the final quoted figure without team input",
            "Replacing historical velocity data",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Models are useful for completeness and challenge. The final figure needs team ownership and real reference data the model doesn't have.",
        },
        {
          id: "pm-x-ai-risk-estimates-q3",
          prompt: "Claude's risk list includes \"Communication issues\" and \"Scope creep\". What should you do with them?",
          options: [
            "Make them project-specific with a trigger, owner and response, or drop them",
            "Keep them: they're always relevant",
            "Rate them high to be safe",
            "Ask the model to rate them again",
          ],
          correctIndex: 0,
          explanation:
            "Generic risks don't drive action. \"Client's product owner is part-time and decisions take more than a week\" is a risk you can manage.",
        },
        {
          id: "pm-x-ai-risk-estimates-q4",
          prompt: "The team is about to run planning poker. Should they see the model's estimate first?",
          options: [
            "No: estimate independently first, then compare, to avoid anchoring on the model's number",
            "Yes: it saves time",
            "Yes, but only if the model's estimate is lower",
            "It makes no difference",
          ],
          correctIndex: 0,
          explanation:
            "Anchoring affects people strongly; seeing a number first pulls estimates towards it. Independent estimates then comparison keeps both useful.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-risk-estimates-q5",
          prompt: "Why are a model's probability and impact ratings for your risks only a starting point?",
          options: [
            "It lacks your context: team, client history, codebase and organisational constraints, so ratings are generic",
            "Models can't count",
            "Probability ratings are illegal in contracts",
            "They're always too high",
          ],
          correctIndex: 0,
          explanation:
            "Ratings depend on context the model hasn't seen. It may be too high or too low; the issue is that it's uncalibrated for your situation.",
        },
        {
          id: "pm-x-ai-risk-estimates-q6",
          prompt: "Which inputs improve a model's risk analysis for a specific project? (Select all that apply.)",
          options: [
            "The project brief and SOW assumptions and dependencies",
            "The work breakdown and timeline",
            "Lessons learned from similar past Oyelabs projects",
            "A request to make the list as long as possible",
            "The client's personal contact details",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Specific context yields specific risks. Length isn't quality, and personal details add privacy risk without improving analysis.",
        },
        {
          id: "pm-x-ai-risk-estimates-q7",
          prompt: "A model returns an estimate of exactly 112 hours for an integration. What does that precision tell you?",
          options: [
            "Nothing about accuracy: precise-looking numbers can have no historical basis; treat it as a hypothesis",
            "That the model has analysed your codebase",
            "That the estimate is reliable to within an hour",
            "That the integration is simple",
          ],
          correctIndex: 0,
          explanation:
            "Precision isn't accuracy. Without your data, the number is a guess with decimal-place confidence.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-risk-estimates-q8",
          prompt: "Which part of an AI-feature estimate is a model least able to help with?",
          options: [
            "How many evaluation and prompt iterations your client's quality bar will require",
            "Listing typical tasks in building a chatbot",
            "Suggesting test categories",
            "Drafting assumptions for the SOW",
          ],
          correctIndex: 0,
          explanation:
            "Iteration count depends on the client's data, quality bar and feedback speed, which no model knows. Typical task lists and draft assumptions are where it helps.",
        },
        {
          id: "pm-x-ai-risk-estimates-q9",
          prompt: "Who owns the final risk register and estimate?",
          options: [
            "The PM and the delivery team, with named owners for each risk",
            "The AI tool that generated the first draft",
            "The client",
            "Whoever wrote the prompt",
          ],
          correctIndex: 0,
          explanation:
            "Ownership stays with accountable people. Tools draft; the team commits.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You're preparing an estimate for a white-label HR platform with an AI policy-question assistant. Your team's bottom-up estimate is 1,200 hours. You ask Claude to critique the breakdown, giving it the WBS and the SOW assumptions.",
        steps: [
          {
            id: "s1",
            question:
              "Claude points out that the WBS has no line for building an evaluation set of real policy questions, nor for hypercare after launch. What do you do?",
            options: [
              "Check with the team whether they're genuinely missing, and if so estimate them from past projects and add them",
              "Add Claude's suggested figure for each item directly",
              "Ignore it, because the team knows best",
              "Remove the AI assistant from scope",
            ],
            correctIndex: 0,
            explanation:
              "The model found possible gaps; the team confirms and sizes them from real data. Taking its numbers or dismissing it both waste the critique.",
          },
          {
            id: "s2",
            question:
              "Claude also suggests the total should be about 1,650 hours. Your reference data from three similar projects shows actuals at 1.2 to 1.35 times the original bottom-up estimates. What figure do you put forward internally?",
            options: [
              "A range based on your reference data (about 1,440 to 1,620 hours plus the newly added items), with assumptions stated",
              "1,650 hours, because the model said so",
              "1,200 hours, because the team estimated it",
              "The average of 1,200 and 1,650",
            ],
            correctIndex: 0,
            explanation:
              "Your own reference class is real evidence; the model's total isn't. Averaging with an unfounded number gives false comfort.",
          },
          {
            id: "s3",
            question:
              "Leadership wants to quote the bottom of the range to win the deal. What do you recommend?",
            options: [
              "Quote within the range with the AI-quality work on capped T&M or a retainer, and make the evaluation-set dependency explicit in the SOW",
              "Quote the bottom figure on a fixed price with no further conditions",
              "Quote the model's 1,650 hours to be safe",
              "Refuse to give any quote",
            ],
            correctIndex: 0,
            explanation:
              "Commercial structure can absorb uncertainty where estimates can't. A bare low fixed price transfers all the AI uncertainty to Oyelabs' margin.",
          },
        ],
      },
    },
    {
      id: "pm-x-ai-confidentiality",
      moduleId: "pm-expert",
      trackId: "pm",
      title: "AI Confidentiality, Data Handling & Governance for PMs",
      summary:
        "Every prompt is a data transfer. When a PM pastes a client's requirements, a meeting transcript or a spreadsheet of user feedback into an AI tool, that content goes to a third-party processor under whatever terms govern that account. For an agency this is not an abstract concern: client contracts and NDAs often restrict disclosure to third parties, data-processing agreements limit where personal data may go, and enterprise clients increasingly ask in security questionnaires exactly which AI tools touch their data.\n\nThe controls are mostly simple and mostly organisational. Use only tools and accounts the company has approved for client work, because terms differ: Anthropic's commercial terms, for example, state that it may not train models on customer content from its services, while consumer accounts are governed by different terms and settings. Check each client's contract for restrictions before using any AI tool on its material; some prohibit it outright, some require disclosure or approval. Minimise: remove personal data, credentials, API keys and commercially sensitive figures that the task does not need, and use placeholders. Never paste secrets; a prompt history is not a secure store. Get consent before recording or transcribing calls, and keep transcripts under the same retention rules as other client records.\n\nGovernance makes this repeatable. The NIST AI Risk Management Framework organises the work into four functions (Govern, Map, Measure, Manage): set policy and accountability, understand where AI is used and what can go wrong, measure risks such as accuracy and data exposure, and act on them. For a PM that translates into an AI-use register per project (which tools, what data, which client approvals), a short team guideline, and AI use as a standing item in client security conversations.\n\nGotchas: \"it's only a summary\" still discloses the content summarised. Screenshots carry hidden data such as names in sidebars and URLs. And client approval for using AI on their code does not automatically extend to their end users' personal data; check each category of data separately. This is practical guidance, not legal advice.",
      level: "expert",
      estMinutes: 40,
      webRefs: [
        { label: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", kind: "spec" },
        { label: "Anthropic: Commercial Terms of Service", url: "https://www.anthropic.com/legal/commercial-terms", kind: "docs" },
        { label: "PMI: AI in Project Management hub", url: "https://www.pmi.org/learning/ai-in-project-management", kind: "article" },
      ],
      video: {
        title: "AI Tools for Project Management: Top 10 Ways to Boost Results",
        channel: "Project Management Institute (PMI)",
        url: "https://www.youtube.com/watch?v=tLabykkGbEw",
        videoId: "tLabykkGbEw",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-ai-confidentiality-q1",
          prompt:
            "Before using Claude to summarise a new client's requirements documents, what should a PM check first?",
          options: [
            "Whether the client's contract or NDA restricts sharing their material with third-party tools, and that the account is company-approved",
            "Whether the documents are longer than the context window",
            "Whether the model is the newest available",
            "Nothing, as long as the summary stays internal",
          ],
          correctIndex: 0,
          explanation:
            "Contractual restrictions and approved accounts come first. Keeping the output internal doesn't change that the input was disclosed to a processor.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-confidentiality-q2",
          prompt: "Which items should be removed or replaced with placeholders before pasting material into an AI tool? (Select all that apply.)",
          options: [
            "API keys, passwords and access tokens",
            "End users' names, emails and health or financial details not needed for the task",
            "Commercially sensitive figures the task doesn't need",
            "The feature names being discussed",
            "The structure of the document",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Minimise secrets, personal data and unnecessary sensitive figures. Feature names and structure are usually what the task needs.",
        },
        {
          id: "pm-x-ai-confidentiality-q3",
          prompt: "What do Anthropic's commercial terms say about training on customer content from its services?",
          options: [
            "Anthropic may not train models on customer content from the services",
            "All inputs are used for training unless you opt out",
            "Only outputs, not inputs, are excluded from training",
            "The terms don't address training",
          ],
          correctIndex: 0,
          explanation:
            "The commercial terms state that Anthropic may not train models on customer content from the services. Consumer accounts have different terms, which is why approved accounts matter.",
        },
        {
          id: "pm-x-ai-confidentiality-q4",
          prompt: "Which are the four functions of the NIST AI Risk Management Framework core?",
          options: ["Govern, Map, Measure, Manage", "Plan, Do, Check, Act", "Identify, Protect, Detect, Respond", "Initiate, Plan, Execute, Close"],
          correctIndex: 0,
          explanation:
            "The AI RMF core is Govern, Map, Measure, Manage. Identify-Protect-Detect-Respond comes from the NIST Cybersecurity Framework; the others are generic improvement and lifecycle models.",
        },
        {
          id: "pm-x-ai-confidentiality-q5",
          prompt:
            "A PM argues: \"I only pasted the call transcript to get a summary, so nothing was shared.\" What's wrong with this reasoning?",
          options: [
            "The full transcript was sent to the tool; summarising is processing, so the disclosure already happened",
            "Nothing; summaries are always allowed",
            "Only the summary counts as disclosure",
            "Transcripts are not client data",
          ],
          correctIndex: 0,
          explanation:
            "What matters is what was sent, not what came back. A transcript of a client call is client confidential information.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-confidentiality-q6",
          prompt:
            "A client approved using AI coding assistants on their codebase. Does that cover pasting their customers' support tickets, with names and order details, into a chatbot to analyse themes?",
          options: [
            "Not automatically: end users' personal data is a separate category that needs its own check against the DPA and client approval",
            "Yes, AI approval covers everything",
            "Yes, if the analysis helps the client",
            "No, AI can never be used on support tickets",
          ],
          correctIndex: 0,
          explanation:
            "Approval for one data category doesn't extend to personal data under data-protection terms. Anonymised tickets may well be fine once checked.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-confidentiality-q7",
          prompt: "What should a per-project AI-use register record? (Select all that apply.)",
          options: [
            "Which AI tools and accounts are used",
            "Which categories of client data each tool processes",
            "The client approvals or contract clauses that permit it",
            "Every prompt ever written",
            "Each team member's personal AI subscriptions",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Tools, data and permissions answer security questionnaires and audits. Logging every prompt is impractical, and personal subscriptions shouldn't be used for client work at all.",
        },
        {
          id: "pm-x-ai-confidentiality-q8",
          prompt: "Which is the safest approach when a client's contract is silent on AI tools?",
          options: [
            "Treat AI tools as third-party processors under the confidentiality clause, raise it with the client and agree an approach in writing",
            "Assume it's allowed, since it isn't prohibited",
            "Assume it's banned and never mention it",
            "Use AI only outside working hours",
          ],
          correctIndex: 0,
          explanation:
            "Silence means ambiguity, and confidentiality clauses usually still apply. A short written agreement removes the ambiguity and builds trust.",
        },
        {
          id: "pm-x-ai-confidentiality-q9",
          prompt: "Why are screenshots a common source of accidental data leakage into AI tools?",
          options: [
            "They often include data beyond the intended content: names in sidebars, URLs, notifications or other clients' tabs",
            "Images are always stored permanently",
            "AI tools can't read images",
            "Screenshots are larger than text",
          ],
          correctIndex: 0,
          explanation:
            "Incidental content is the problem. Crop or redact before sharing; storage and file size aren't the issue.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A PM drafted this message to paste into an AI chat tool to help prepare a steering-committee update for a health-tech client whose contract requires client approval before sharing data with any third party. Mark the lines that create confidentiality or data-protection problems.",
        segments: [
          { id: "m1", text: "Please help me write a one-page steering update in plain language for a non-technical sponsor.", issue: null },
          { id: "m2", text: "Context: we're building a patient-booking platform with an AI symptom-checker.", issue: null },
          { id: "m3", text: "The client is HealthBridge Ltd, and their sponsor is Dr. Maria Kowalski (maria.kowalski@healthbridge.example).", issue: "Names the client and the sponsor's personal contact details without need or client approval." },
          { id: "m4", text: "Progress: booking flow complete; symptom-checker at 82% accuracy against a 90% target.", issue: null },
          { id: "m5", text: "Here are 20 real patient symptom reports from the pilot, with names and dates of birth, so you can see the failure cases.", issue: "Special-category personal data (health) with identifiers; not needed and needs a lawful basis and client approval." },
          { id: "m6", text: "Our staging API key is sk-live-7f3a..., in case you need it to check the endpoint.", issue: "Credentials must never be pasted into prompts." },
          { id: "m7", text: "Risk: the client may cut the budget by $140k after their Series B fell through (confidential).", issue: "Confidential client financial information that the task doesn't need." },
          { id: "m8", text: "Ask: approval to extend the symptom-checker evaluation by two weeks.", issue: null },
          { id: "m9", text: "Tone: confident but honest, no jargon.", issue: null },
          { id: "m10", text: "I'm using my personal account because the company one is slow.", issue: "Client work must use company-approved accounts, whose terms and controls have been checked." },
          { id: "m11", text: "Please end with three clear next steps.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pm-x-ai-assisted-teams",
      moduleId: "pm-expert",
      trackId: "pm",
      title: "Managing & Estimating AI-Assisted Development Teams",
      summary:
        "AI coding assistants have changed how Oyelabs' engineers work, and the PM's planning has to change with them, carefully. The intuitive story (\"AI makes developers twice as fast, so halve the estimate\") is not what the evidence shows. DORA's 2025 State of AI-assisted Software Development report describes AI as an amplifier: it magnifies an organisation's existing strengths and weaknesses, so teams with good tests, small batches and clear platforms gain, while teams without them ship more instability faster. METR's early-2025 controlled study of experienced open-source developers working on their own repositories found they took 19% longer with AI tools, despite expecting to be faster. Both results are snapshots, and tools improve quickly, but together they make one point: measure, don't assume.\n\nWhere does the time go? AI helps most with boilerplate, scaffolding, tests for well-specified code, migrations between known patterns and exploring unfamiliar APIs. It helps least, and sometimes hurts, on novel architecture, subtle integration logic and anything the model lacks context for. Meanwhile review effort rises: more code arrives per hour, and someone accountable must read it, test it and own it. The bottleneck moves from writing to reviewing and integrating.\n\nSo estimate by task type, not with a global discount: apply modest, evidence-based reductions to the work AI genuinely accelerates, add review and verification time, and keep AI-feature work (evaluation, prompt iteration) at full estimate. Calibrate with your own data after a few sprints, using delivery measures (DORA's throughput and instability metrics, cycle time, escaped defects) rather than lines of code or prompts used.\n\nManagement changes too: set team norms on what must be human-reviewed, protect learning for juniors so they don't outsource understanding, include AI-generated code in security review, and be explicit with clients about how AI is used and how the efficiency gains are shared.\n\nGotchas: selling the speed-up to the client before you have measured it; reporting \"40% faster\" from self-reported surveys; and letting review queues grow until cycle time worsens even as coding time shrinks.",
      level: "expert",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "DORA: State of AI-assisted Software Development 2025", url: "https://dora.dev/research/2025/dora-report/", kind: "docs" },
        { label: "DORA: Balancing AI tensions", url: "https://dora.dev/insights/balancing-ai-tensions/", kind: "article" },
        { label: "METR: Measuring the impact of early-2025 AI on experienced open-source developer productivity", url: "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/", kind: "article" },
        { label: "DORA: Software delivery performance metrics", url: "https://dora.dev/guides/dora-metrics/", kind: "docs" },
      ],
      video: {
        title: "Has This Report EXPOSED THE TRUTH About AI Assisted Software Development?",
        channel: "Modern Software Engineering",
        url: "https://www.youtube.com/watch?v=CoGO6s7bS3A",
        videoId: "CoGO6s7bS3A",
        durationLabel: "19:09",
      },
      alternateVideos: [
        {
          title: "AI-assisted software development in 2025: Inside this year's DORA report",
          channel: "Thoughtworks",
          url: "https://www.youtube.com/watch?v=NeLiadOU_-Y",
          videoId: "NeLiadOU_-Y",
          durationLabel: "37:21",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-ai-assisted-teams-q1",
          prompt: "How does DORA's 2025 report characterise AI's role in software delivery?",
          options: [
            "As an amplifier of an organisation's existing strengths and weaknesses",
            "As a replacement for engineering practices like testing",
            "As having no measurable effect",
            "As guaranteed to double throughput",
          ],
          correctIndex: 0,
          explanation:
            "DORA describes AI as an amplifier: the greatest returns come from the surrounding system, not the tools alone. It doesn't replace practices or guarantee gains.",
        },
        {
          id: "pm-x-ai-assisted-teams-q2",
          prompt:
            "In METR's early-2025 randomised study of experienced open-source developers on their own repositories, what happened when they used AI tools?",
          options: [
            "They took 19% longer to complete issues, though they had expected to be faster",
            "They finished twice as fast",
            "There was no difference in time",
            "They refused to use the tools",
          ],
          correctIndex: 0,
          explanation:
            "METR measured a 19% slowdown that contradicted developers' own expectations. It's one setting at one point in time, but it shows why self-reported speed-ups shouldn't drive estimates.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-assisted-teams-q3",
          prompt: "Which kinds of work are most likely to benefit from AI coding assistance? (Select all that apply.)",
          options: [
            "Boilerplate and scaffolding in a familiar stack",
            "Unit tests for well-specified functions",
            "Converting code between well-known patterns or versions",
            "Designing a novel architecture for a client's unusual constraints",
            "Deciding what the client actually needs",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Well-specified, pattern-heavy work benefits most. Novel design and requirements judgement depend on context and accountability the tools don't have.",
        },
        {
          id: "pm-x-ai-assisted-teams-q4",
          prompt: "Leadership proposes cutting all estimates by 40% because 'everyone uses AI now'. What is the best response?",
          options: [
            "Estimate by task type with modest, evidence-based reductions, add review time, and calibrate from the team's own delivery data",
            "Agree, and cut all estimates by 40%",
            "Refuse to change estimates at all",
            "Cut only the QA estimates",
          ],
          correctIndex: 0,
          explanation:
            "Gains vary by task and review costs rise, so a global cut is unsupported. Refusing to adapt ignores real gains on suitable work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-assisted-teams-q5",
          prompt:
            "Since adopting AI assistants, coding time per story has fallen, but cycle time has risen. What is the likeliest explanation?",
          options: [
            "Review and integration have become the bottleneck as more code arrives faster",
            "The AI tools are broken",
            "Developers are slacking",
            "Cycle time is measured incorrectly",
          ],
          correctIndex: 0,
          explanation:
            "The constraint moves downstream. Look at review queues, test reliability and batch size before blaming tools or people.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-assisted-teams-q6",
          prompt: "Which measures are good indicators of AI's effect on a team's delivery? (Select all that apply.)",
          options: [
            "Lead time for changes and deployment frequency",
            "Change failure rate and failed deployment recovery time",
            "Cycle time and escaped defects",
            "Lines of code generated per day",
            "Number of prompts sent",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Delivery throughput, stability and quality show outcomes. Lines of code and prompt counts measure activity, which AI inflates by design.",
        },
        {
          id: "pm-x-ai-assisted-teams-q7",
          prompt: "What's a key management risk for junior developers in an AI-assisted team?",
          options: [
            "Outsourcing understanding: shipping code they can't explain, which weakens their growth and the team's ability to maintain it",
            "Typing too slowly",
            "Using AI more than seniors",
            "Asking too many questions",
          ],
          correctIndex: 0,
          explanation:
            "Juniors need to learn the why. Norms such as explaining AI-written code in review protect both growth and maintainability.",
        },
        {
          id: "pm-x-ai-assisted-teams-q8",
          prompt: "Where should AI-generated code sit in Oyelabs' quality and security processes?",
          options: [
            "Under the same review, testing and security scanning as human-written code, with a named human owner",
            "Exempt from review, because the model was trained on good code",
            "Reviewed only if a bug is found",
            "Reviewed by another AI tool only",
          ],
          correctIndex: 0,
          explanation:
            "Accountability doesn't transfer to the tool. AI review can assist, but a human owner must answer for what ships.",
        },
        {
          id: "pm-x-ai-assisted-teams-q9",
          prompt: "A client on a T&M contract asks how AI use affects their bill. What's the right stance?",
          options: [
            "Be transparent about how AI is used and how verified efficiency gains are reflected, and discuss whether commercials should evolve",
            "Avoid the question, since it might reduce revenue",
            "Promise a 50% reduction immediately",
            "Charge extra for AI use",
          ],
          correctIndex: 0,
          explanation:
            "Trust depends on transparency; commitments should follow measured gains. Dodging or over-promising both damage the relationship.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Re-estimate a feature set for an AI-assisted team. The original (pre-AI) estimate is broken down below. Apply the adjustment for each category from your team's measured data, then add 15% contingency to the adjusted total.",
        table: {
          columns: ["Category", "Original estimate (h)", "Measured AI adjustment"],
          rows: [
            ["Boilerplate, CRUD and scaffolding", "160", "-40%"],
            ["Third-party integrations", "120", "-10%"],
            ["AI feature evaluation and prompt iteration", "80", "0%"],
            ["Code review and QA", "40", "+25% (more code to review)"],
          ],
        },
        fields: [
          { id: "adjusted", label: "Adjusted total before contingency", unit: "h", answer: 334, tolerance: 0.5 },
          { id: "saving", label: "Saving against the original 400 h", unit: "%", answer: 16.5, tolerance: 0.1 },
          { id: "final", label: "Adjusted total with 15% contingency", unit: "h", answer: 384.1, tolerance: 0.5 },
        ],
        explanation:
          "160 x 0.6 = 96; 120 x 0.9 = 108; 80 x 1.0 = 80; 40 x 1.25 = 50. Total 334 h, a 16.5% saving on 400 h, not the 40% leadership hoped for. With contingency: 334 x 1.15 = 384.1 h. Category-level adjustments from your own data are defensible; a blanket cut is not.",
      },
    },
    {
      id: "pm-x-scaling-agile",
      moduleId: "pm-expert",
      trackId: "pm",
      title: "Scaling Agile: SAFe and LeSS in Overview",
      summary:
        "Scrum describes one team. When many teams work on one product, the hard problems become coordination problems: shared backlogs, dependencies, integration and aligned priorities. Scaling frameworks exist to address them, and a senior PM at an agency mostly meets them from the outside, when an enterprise client runs one and Oyelabs' team has to plug in.\n\nSAFe (Scaled Agile Framework) is the most widely adopted and the most prescriptive. It organises teams into Agile Release Trains (ARTs), long-lived teams of agile teams aligned to a value stream, that plan together in Planning Interval (PI) planning, a regular event where all teams commit to objectives for the next increment. It adds roles such as the Release Train Engineer and layers for solution and portfolio management (Lean Portfolio Management, lean budgets, WSJF prioritisation). Its strength is giving large organisations a complete, teachable operating model; critics argue it can preserve hierarchy and add process.\n\nLeSS (Large-Scale Scrum) goes the other way: it is Scrum applied to many teams with as little added structure as possible. One Product Owner, one Product Backlog, one shared Sprint and one potentially shippable product increment across all teams, with cross-functional feature teams rather than component teams. Basic LeSS covers up to about eight teams; LeSS Huge adds requirement areas for more. Its strength is simplicity and fewer handoffs; it demands deeper organisational change.\n\nFor Oyelabs the practical skills are joining a client's PI planning with a credible capacity and dependency picture, mapping our sprints to their increment, and recognising when \"scaling\" is the wrong answer: most agency projects have one to three teams and need good Scrum or Kanban plus a dependency board, not a framework. This topic is an overview, not certification preparation.\n\nGotchas: adopting a framework's ceremonies without its principles (\"SAFe theatre\"); component teams that make every feature a cross-team dependency; and an external agency team treated as a separate train that only integrates at the end.",
      level: "expert",
      estMinutes: 40,
      webRefs: [
        { label: "SAFe Framework (Scaled Agile)", url: "https://framework.scaledagile.com/", kind: "docs" },
        { label: "SAFe: PI Planning", url: "https://framework.scaledagile.com/pi-planning", kind: "docs" },
        { label: "LeSS framework", url: "https://less.works/less/framework", kind: "docs" },
        { label: "Atlassian: What is SAFe?", url: "https://www.atlassian.com/agile/agile-at-scale/what-is-safe", kind: "article" },
      ],
      video: {
        title: "SAFe Explained in Five Minutes",
        channel: "Scaled Agile, Inc.",
        url: "https://www.youtube.com/watch?v=aW2m-BtCJyE",
        videoId: "aW2m-BtCJyE",
      },
      alternateVideos: [
        {
          title: "Introduction to LeSS - Dawson",
          channel: "LeSS for companies adapting in a fast moving world",
          url: "https://www.youtube.com/watch?v=1BZf_Oa7W94",
          videoId: "1BZf_Oa7W94",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-scaling-agile-q1",
          prompt: "In SAFe, what is an Agile Release Train?",
          options: [
            "A long-lived team of agile teams aligned to a value stream that plans and delivers together on a shared cadence",
            "A single release of software to production",
            "A deployment pipeline tool",
            "A group of Scrum Masters who approve releases",
          ],
          correctIndex: 0,
          explanation:
            "An ART is the core organisational unit of SAFe: teams of teams planning together in PI planning. It isn't a release or a tool.",
        },
        {
          id: "pm-x-scaling-agile-q2",
          prompt: "Which are characteristics of basic LeSS? (Select all that apply.)",
          options: [
            "One Product Owner and one Product Backlog for all teams",
            "A single shared Sprint across the teams",
            "A preference for cross-functional feature teams over component teams",
            "A separate Product Owner and backlog for each team",
            "A Release Train Engineer role",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "LeSS keeps one PO, one backlog and one Sprint, with feature teams. Separate backlogs per team contradict it, and the RTE is a SAFe role.",
        },
        {
          id: "pm-x-scaling-agile-q3",
          prompt:
            "An enterprise client runs SAFe and invites Oyelabs' four-person team to PI planning. What should the PM bring?",
          options: [
            "Realistic team capacity for the PI, known dependencies on and from the client's teams, and draft objectives",
            "A fixed Gantt chart for the next year",
            "Nothing: the client's RTE will assign work",
            "A request to skip PI planning and integrate at the end",
          ],
          correctIndex: 0,
          explanation:
            "PI planning works through teams committing to objectives based on capacity and dependencies. Arriving passive or proposing late integration defeats the purpose.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-scaling-agile-q4",
          prompt:
            "A client project has two Oyelabs teams building one app. Leadership suggests adopting SAFe. What's the most sensible view?",
          options: [
            "Probably unnecessary: two teams can coordinate with a shared backlog, joint planning and a dependency board",
            "Essential: any multi-team project needs SAFe",
            "Use LeSS Huge instead",
            "Split the app into two unrelated products",
          ],
          correctIndex: 0,
          explanation:
            "Scaling frameworks address coordination at larger scale. Two teams usually need light coordination, not a full operating model; LeSS Huge is for very large setups.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-scaling-agile-q5",
          prompt: "Why does LeSS favour feature teams over component teams?",
          options: [
            "Feature teams can deliver end-to-end customer value without handoffs, reducing cross-team dependencies",
            "Component teams are cheaper",
            "Feature teams need no Product Owner",
            "Component teams are forbidden by the Scrum Guide",
          ],
          correctIndex: 0,
          explanation:
            "When teams own a component, almost every feature needs several teams. Feature teams cut handoffs; the Scrum Guide doesn't address it.",
        },
        {
          id: "pm-x-scaling-agile-q6",
          prompt: "Which are common criticisms or failure modes of scaled agile adoptions? (Select all that apply.)",
          options: [
            "Adopting ceremonies and roles without the underlying principles",
            "Preserving existing hierarchy under new role names",
            "Adding process overhead that small programmes don't need",
            "Teams delivering working software every iteration",
            "Shared backlogs that make priorities clear",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Cargo-cult adoption, renamed hierarchy and excess process are the usual complaints. Frequent working software and clear priorities are what scaling is meant to achieve.",
        },
        {
          id: "pm-x-scaling-agile-q7",
          prompt: "What is the purpose of PI planning in SAFe?",
          options: [
            "To align all teams on a train around shared objectives, surface dependencies and commit to a plan for the next increment",
            "To assign individual tasks to each developer for the quarter",
            "To approve the annual budget",
            "To replace the teams' sprint planning",
          ],
          correctIndex: 0,
          explanation:
            "PI planning aligns teams of teams; sprint planning still happens within each team. Task-level assignment and annual budgeting aren't its purpose.",
        },
        {
          id: "pm-x-scaling-agile-q8",
          prompt:
            "The client's SAFe train treats Oyelabs as an external supplier that hands over a build at the end of each PI. What's the main risk?",
          options: [
            "Late integration: defects and mismatches surface at the end of the PI rather than continuously",
            "Oyelabs will be paid too early",
            "The client will learn too much about Oyelabs' process",
            "No risk; this is how SAFe works",
          ],
          correctIndex: 0,
          explanation:
            "Big-bang integration recreates waterfall risk inside an agile framework. Propose integrating continuously and joining system demos.",
        },
        {
          id: "pm-x-scaling-agile-q9",
          prompt: "Roughly how many teams is basic LeSS designed for before LeSS Huge applies?",
          options: ["Up to about eight", "Up to about two", "Up to about fifty", "Any number"],
          correctIndex: 0,
          explanation:
            "Basic LeSS targets around two to eight teams; LeSS Huge adds requirement areas for larger product groups.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "A large insurance client runs SAFe with a 9-team Agile Release Train. They've hired Oyelabs to build a customer-facing AI claims assistant, which depends on two of their internal teams for policy data and authentication.",
        steps: [
          {
            id: "s1",
            question: "How should Oyelabs' team join the train?",
            options: [
              "As a team on the ART: attend PI planning and system demos, and integrate on the train's cadence",
              "As a separate project with its own timeline, delivering at the end",
              "By embedding one Oyelabs developer in each client team",
              "By asking the client to drop SAFe for this project",
            ],
            correctIndex: 0,
            explanation:
              "Joining the train's cadence makes dependencies visible and integration continuous. Separate delivery or asking the client to change its operating model creates friction and risk.",
          },
          {
            id: "s2",
            question:
              "At PI planning, the authentication team says it can only deliver the API Oyelabs needs in the PI's final iteration. What do you do?",
            options: [
              "Record the dependency on the program board, re-sequence your work to build against a contract or mock first, and raise the risk in the PI objectives",
              "Commit to your original plan anyway",
              "Escalate to the client's CIO during PI planning",
              "Build your own authentication system",
            ],
            correctIndex: 0,
            explanation:
              "PI planning is designed for exactly this: make the dependency visible, adapt the sequence and flag the risk. Ignoring it or building around the client's systems creates bigger problems.",
          },
          {
            id: "s3",
            question:
              "Mid-PI, the client's RTE asks Oyelabs to take on an extra feature from another team. Your SOW is fixed-scope. What's the best response?",
            options: [
              "Assess the impact with the team and handle it through the SOW change process, agreeing with the RTE and client sponsor what moves",
              "Accept, because the RTE runs the train",
              "Refuse, because it isn't in the SOW",
              "Do it quietly in overtime",
            ],
            correctIndex: 0,
            explanation:
              "Train-level priorities and the contract must be reconciled through change control. Accepting or refusing outright ignores one of the two governance systems.",
          },
        ],
      },
    },
    {
      id: "pm-x-pmp-acp-alignment",
      moduleId: "pm-expert",
      trackId: "pm",
      title: "PMP & PMI-ACP Exam Alignment (2026 ECO, PMBOK 8)",
      summary:
        "Certification is not the job, but it is a shared vocabulary that enterprise clients recognise, and the way PMI tests now closely matches how Oyelabs delivers. PMI updated the PMP exam in July 2026 with a new Examination Content Outline (ECO) that weights three domains: People 33%, Process 41% and Business Environment 26% (previously 42%, 50% and 8%). The jump in Business Environment reflects PMI's emphasis on value, business outcomes, governance, compliance and benefits. The new outline also adds or strengthens AI, sustainability and stakeholder engagement, and the exam's approach mix is roughly 40% predictive and 60% agile or hybrid. The PMBOK Guide 8th edition (November 2025) is the current standard and guide behind it. PMI-ACP is PMI's agile-specific certification, testing agile mindset, leadership, product and delivery practices across frameworks rather than one method.\n\nWhat the exam actually rewards is judgement in situational questions. A recognisable pattern: the best answer usually assesses or investigates before acting, works with the team and stakeholders before escalating, follows the agreed process (change control, risk responses) rather than bypassing it, and serves the team in agile contexts (remove impediments, coach, protect focus) rather than directing it. Answers that blame, ignore, or immediately escalate to the sponsor are usually wrong. Those habits map directly to agency life.\n\nFor study, map your experience: each module of this trail lines up with ECO tasks (risk, stakeholders, change control and contracts under Process; conflict, coaching and team leadership under People; business cases, benefits, compliance and governance under Business Environment). The practice is in reading long scenarios carefully and asking what the PM should do first or next.\n\nGotchas: older prep material still uses the previous percentages and the PMBOK 6 process-group structure; check the date on any course or question bank. Third-party trainers quote a specific July 2026 cutover date; PMI's own pages say July 2026, so check pmi.org for your exam date. And eligibility, fees and question counts change, so verify them on pmi.org before booking rather than trusting a summary, including this one.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "PMI: PMP certification", url: "https://www.pmi.org/certifications/project-management-pmp", kind: "docs" },
        { label: "PMI: PMP Examination Content Outline 2026 (PDF)", url: "https://www.pmi.org/-/media/pmi/documents/public/pdf/certifications/new-pmp-examination-content-outline-2026.pdf", kind: "spec" },
        { label: "PMI: PMI-ACP certification", url: "https://www.pmi.org/certifications/agile-acp", kind: "docs" },
        { label: "PMI: PMBOK Guide 8th edition", url: "https://www.pmi.org/standards/pmbok", kind: "spec" },
      ],
      video: {
        title: "PMI just changed the PMP exam again",
        channel: "Andrew Ramdayal",
        url: "https://www.youtube.com/watch?v=VImgXWb7sJ0",
        videoId: "VImgXWb7sJ0",
      },
      alternateVideos: [
        {
          title: "The PMP Cheat Sheet (2026 exam) - Check this to see if you're ready for the Exam",
          channel: "David McLachlan",
          url: "https://www.youtube.com/watch?v=5qDVekl5_tA",
          videoId: "5qDVekl5_tA",
        },
        {
          title: "The Complete Project Management Body of Knowledge in One Video (PMBOK® Guide 8th Edition)",
          channel: "David McLachlan",
          url: "https://www.youtube.com/watch?v=LcZvGRTJnLo",
          videoId: "LcZvGRTJnLo",
        },
        {
          title: "PMI-ACP Exam (Full Overview) - Exam Content Outline",
          channel: "Praizion (Leadership, Agile, PMP)",
          url: "https://www.youtube.com/watch?v=FRPtDzN8mUs",
          videoId: "FRPtDzN8mUs",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-pmp-acp-alignment-q1",
          prompt: "What are the domain weights in PMI's 2026 PMP Examination Content Outline?",
          options: [
            "People 33%, Process 41%, Business Environment 26%",
            "People 42%, Process 50%, Business Environment 8%",
            "People 33%, Process 33%, Business Environment 34%",
            "People 50%, Process 40%, Business Environment 10%",
          ],
          correctIndex: 0,
          explanation:
            "The 2026 ECO weights People 33%, Process 41% and Business Environment 26%. 42/50/8 was the previous outline, which older prep material still uses.",
        },
        {
          id: "pm-x-pmp-acp-alignment-q2",
          prompt: "Which themes did PMI add or strengthen in the 2026 PMP update? (Select all that apply.)",
          options: [
            "AI in project work",
            "Sustainability",
            "Value and business outcomes",
            "A return to the PMBOK 6 process-group structure",
            "Removing agile and hybrid approaches",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "PMI highlights AI, sustainability, stakeholder engagement and value. The exam remains heavily agile and hybrid, and PMBOK 6's structure is older material.",
        },
        {
          id: "pm-x-pmp-acp-alignment-q3",
          prompt:
            "A team member tells you she's struggling with a teammate who dismisses her ideas in stand-ups. What should the PM do first?",
          options: [
            "Speak with her privately to understand the situation, then facilitate a conversation between the two",
            "Escalate to the functional manager",
            "Raise it at the next team retrospective in front of everyone",
            "Tell her to ignore it",
          ],
          correctIndex: 0,
          explanation:
            "PMP-style answers gather information and resolve conflict collaboratively at the lowest appropriate level. Escalating first or exposing it publicly skips that.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-pmp-acp-alignment-q4",
          prompt:
            "A key stakeholder asks a developer directly to add a feature mid-sprint on a hybrid project. The developer comes to you. What should the PM do?",
          options: [
            "Guide the stakeholder to the product owner so the request goes through the backlog and change process",
            "Tell the developer to add it, since the stakeholder is important",
            "Reject the request permanently",
            "Escalate to the sponsor immediately",
          ],
          correctIndex: 0,
          explanation:
            "Follow the agreed process: the product owner prioritises, change control applies. Bypassing it or rejecting outright are classic wrong answers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-pmp-acp-alignment-q5",
          prompt: "Which is the current edition of the PMBOK Guide behind the 2026 PMP exam?",
          options: ["8th edition (November 2025)", "7th edition (2021)", "6th edition (2017)", "9th edition (2026)"],
          correctIndex: 0,
          explanation:
            "PMI published the PMBOK Guide 8th edition in November 2025. The 7th and 6th editions are earlier; there's no 9th.",
        },
        {
          id: "pm-x-pmp-acp-alignment-q6",
          prompt:
            "An agile team's velocity has dropped for three sprints. In a PMI-style question, what is the servant-leader's best next step?",
          options: [
            "Facilitate a discussion with the team, for example in the retrospective, to find and remove impediments",
            "Tell the team to work overtime to restore velocity",
            "Report the team's poor performance to the sponsor",
            "Re-estimate the backlog with bigger points",
          ],
          correctIndex: 0,
          explanation:
            "Servant leadership investigates with the team and removes impediments. Overtime, blame and inflating points are the distractors PMI uses.",
        },
        {
          id: "pm-x-pmp-acp-alignment-q7",
          prompt:
            "Which patterns usually mark the best answer in PMP situational questions? (Select all that apply.)",
          options: [
            "Assess or analyse the situation before acting",
            "Work with the team and stakeholders before escalating",
            "Follow the agreed process, such as change control or the risk response plan",
            "Escalate to the sponsor as the first step",
            "Ignore the issue until the next milestone",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Assess, collaborate and follow process. First-step escalation and avoidance are the typical wrong options.",
        },
        {
          id: "pm-x-pmp-acp-alignment-q8",
          prompt:
            "A risk identified in the risk register occurs. A response plan was agreed. What should the PM do?",
          options: [
            "Implement the agreed risk response, then update the register and inform stakeholders",
            "Call a meeting to decide what to do",
            "Escalate to the sponsor",
            "Create a change request first",
          ],
          correctIndex: 0,
          explanation:
            "If a response was planned, execute it. Meeting or escalating first wastes the planning; a change request may follow if the response changes baselines.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-pmp-acp-alignment-q9",
          prompt: "Which tasks fall under the Business Environment domain rather than People or Process?",
          options: [
            "Evaluating and delivering project benefits and value, and supporting compliance and governance",
            "Resolving team conflict",
            "Managing the schedule baseline",
            "Running the daily stand-up",
          ],
          correctIndex: 0,
          explanation:
            "Business Environment covers value, benefits, compliance and organisational change. Conflict is People; schedule management and stand-ups are Process.",
        },
        {
          id: "pm-x-pmp-acp-alignment-q10",
          prompt: "A colleague is studying from a 2023 question bank. What's the main risk?",
          options: [
            "It reflects the previous outline's weights and themes, under-preparing them for Business Environment, AI and sustainability",
            "None; PMP content never changes",
            "The questions will be too easy",
            "It covers too much agile content",
          ],
          correctIndex: 0,
          explanation:
            "The 2026 outline triples Business Environment's share and adds themes. Material written before it won't reflect that.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "PMP-style case. You are PM on a hybrid project delivering a white-label banking app with an AI spending-insights feature. The predictive parts (core banking integration, regulatory approval) are on a plan; the app and AI features run in two-week sprints. Three weeks before regulatory submission, the compliance officer learns that the AI feature's explanations may need to meet new consumer-duty guidance.",
        steps: [
          {
            id: "s1",
            question: "What should you do first?",
            options: [
              "Assess the impact with the compliance officer and team: which requirements apply, and what they mean for scope and the submission date",
              "Remove the AI feature immediately",
              "Escalate to the sponsor and request a delay",
              "Continue as planned; it's only guidance",
            ],
            correctIndex: 0,
            explanation:
              "Investigate before acting. Cutting scope or escalating without analysis is premature, and ignoring regulatory guidance is a Business Environment failure.",
          },
          {
            id: "s2",
            question:
              "The assessment shows the explanations need rework of about one sprint. Submission can include the AI feature only if it's compliant. What next?",
            options: [
              "Present options to the sponsor through the change process: submit without the AI feature and add it later, or move the submission by one sprint, with the impact of each",
              "Tell the team to finish the rework in overtime without changing anything",
              "Submit with the non-compliant feature and fix it later",
              "Let the compliance officer decide the schedule alone",
            ],
            correctIndex: 0,
            explanation:
              "The decision affects scope and the date, so it goes to the sponsor through change control with options. Submitting non-compliant work is never acceptable.",
          },
          {
            id: "s3",
            question:
              "The sponsor chooses to submit without the AI feature. Two developers are disappointed that their work is held back. As a servant leader, what do you do?",
            options: [
              "Explain the reasons openly, recognise their work, and involve them in planning the compliant release",
              "Tell them it's a management decision and move on",
              "Reassign them to another project",
              "Report their reaction to their line manager",
            ],
            correctIndex: 0,
            explanation:
              "The People domain rewards transparency, recognition and involvement. Dismissing or reporting them damages engagement for no gain.",
          },
        ],
      },
    },
    {
      id: "pm-x-sustainability",
      moduleId: "pm-expert",
      trackId: "pm",
      title: "Sustainability in Delivery: Green Software & Sustainable Pace",
      summary:
        "Sustainability has moved from a corporate-report topic into project management itself: PMI's 2026 PMP outline names it as an emphasis, and enterprise clients increasingly ask suppliers about the environmental footprint of what they build. For a software agency it has two meanings, and a senior PM manages both.\n\nThe first is environmental. Software's footprint comes from the energy its infrastructure uses, the carbon intensity of the electricity behind that energy, and the embodied carbon of the hardware. The Green Software Foundation frames three levers: energy efficiency (do the same work with less energy), hardware efficiency (use less hardware, for longer, at higher utilisation) and carbon awareness (do flexible work when and where electricity is cleaner). Its Software Carbon Intensity (SCI) specification turns this into a rate: SCI = ((E x I) + M) per R, where E is energy, I is the carbon intensity of the electricity, M is embodied emissions and R is a functional unit such as per user or per API call. A rate matters because a growing product will use more energy; what you manage is emissions per unit of value.\n\nAI-powered platforms make this a live delivery issue. Inference is energy-intensive, so choosing a right-sized model, caching repeated answers, batching non-urgent jobs and turning off idle GPU and staging environments cut cost and carbon together. In practice the business case for green choices is usually cloud-cost savings, which makes them easy to sell.\n\nThe second meaning is social: sustainable pace. The Agile Manifesto's principles ask sponsors, developers and users to maintain a constant pace indefinitely. Recurring crunch is a delivery risk, not a sign of commitment: it raises defects, attrition and knowledge loss.\n\nGotchas: moving workloads to a lower-carbon region can breach data-residency requirements in the client's contract, so check before you move. Buying offsets doesn't change the SCI, which is designed to reward real reductions. And beware claims you can't measure: if you report a sustainability benefit to a client, state the method.",
      level: "expert",
      estMinutes: 40,
      webRefs: [
        { label: "Green Software Foundation: Learn Green Software", url: "https://learn.greensoftware.foundation/", kind: "docs" },
        { label: "Green Software Foundation: SCI Guidance", url: "https://sci-guide.greensoftware.foundation/", kind: "spec" },
        { label: "PMI: PMP Examination Content Outline 2026 (PDF)", url: "https://www.pmi.org/-/media/pmi/documents/public/pdf/certifications/new-pmp-examination-content-outline-2026.pdf", kind: "spec" },
        { label: "Manifesto for Agile Software Development: 12 principles", url: "https://agilemanifesto.org/principles.html", kind: "spec" },
      ],
      video: {
        title: "Sustainable Project Management: From Planning to Delivery",
        channel: "Project Management Institute (PMI)",
        url: "https://www.youtube.com/watch?v=lUurqVyenZk",
        videoId: "lUurqVyenZk",
        durationLabel: "18:08",
      },
      alternateVideos: [
        {
          title: "How to Turn Sustainability Goals Into Project Decisions",
          channel: "Project Management Institute (PMI)",
          url: "https://www.youtube.com/watch?v=SuhTQX7_Iqk",
          videoId: "SuhTQX7_Iqk",
          durationLabel: "26:45",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-sustainability-q1",
          prompt: "What does the Green Software Foundation's SCI formula, ((E x I) + M) per R, measure?",
          options: [
            "The rate of carbon emissions per functional unit, such as per user or per API call",
            "The total annual cloud bill",
            "The number of servers in use",
            "The energy efficiency of a programming language",
          ],
          correctIndex: 0,
          explanation:
            "SCI is a rate: operational emissions (energy x grid intensity) plus embodied emissions, divided by a functional unit. It isn't a cost or a server count.",
        },
        {
          id: "pm-x-sustainability-q2",
          prompt: "Which are the Green Software Foundation's three main levers for reducing software emissions? (Select all that apply.)",
          options: ["Energy efficiency", "Hardware efficiency", "Carbon awareness", "Buying carbon offsets", "Writing shorter code"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Less energy, less (and better-used) hardware, and running flexible work when and where electricity is cleaner. Offsets don't reduce emissions, and shorter code isn't necessarily more efficient.",
        },
        {
          id: "pm-x-sustainability-q3",
          prompt:
            "Your team proposes moving nightly AI batch jobs to a cloud region with much cleaner electricity. What must you check first?",
          options: [
            "The client's data-residency and data-protection terms, which may restrict where data can be processed",
            "Whether the region has the newest GPUs",
            "Whether the team prefers that region's time zone",
            "Nothing; cleaner is always better",
          ],
          correctIndex: 0,
          explanation:
            "Carbon-aware moves can conflict with contractual or legal data-location requirements. That check comes before any technical detail.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-sustainability-q4",
          prompt:
            "A product's total emissions doubled this year, while its user base tripled. How should you read this?",
          options: [
            "Emissions per user fell, which is what a rate like SCI is designed to show; total growth needs managing but isn't failure by itself",
            "The product has become much less sustainable",
            "The measurement must be wrong",
            "Sustainability can't be assessed for growing products",
          ],
          correctIndex: 0,
          explanation:
            "Per-user emissions fell to about two-thirds of the previous level. A rate separates efficiency from growth; both matter.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-sustainability-q5",
          prompt: "Which changes to an AI-powered platform typically reduce both cloud cost and emissions? (Select all that apply.)",
          options: [
            "Caching answers to frequently repeated questions",
            "Using a smaller model where it meets the quality bar",
            "Shutting down idle staging and GPU environments outside working hours",
            "Using the largest available model for every request",
            "Running evaluation jobs continuously on dedicated GPUs",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Avoiding repeated or unnecessary compute and right-sizing models saves energy and money together. Oversized models and always-on evaluation do the opposite.",
        },
        {
          id: "pm-x-sustainability-q6",
          prompt: "Does buying carbon offsets reduce a product's SCI score?",
          options: [
            "No: the SCI is designed to reward actual reductions, not offsetting",
            "Yes, offsets are subtracted from E",
            "Yes, but only for embodied emissions",
            "Only if the offsets are certified",
          ],
          correctIndex: 0,
          explanation:
            "Offsets don't change the energy, intensity or hardware the software uses, so they don't change SCI. That keeps the metric focused on engineering choices.",
        },
        {
          id: "pm-x-sustainability-q7",
          prompt: "Which Agile Manifesto principle concerns the social side of sustainability in delivery?",
          options: [
            "Agile processes promote sustainable development; everyone should be able to maintain a constant pace indefinitely",
            "Working software is the primary measure of progress",
            "Simplicity, the art of maximising the amount of work not done, is essential",
            "Welcome changing requirements, even late in development",
          ],
          correctIndex: 0,
          explanation:
            "The sustainable-pace principle addresses people. The others are about progress, simplicity and change.",
        },
        {
          id: "pm-x-sustainability-q8",
          prompt: "A team has worked weekends for the last four releases to hit dates. What is the delivery risk?",
          options: [
            "Rising defects, attrition and knowledge loss: the plan depends on a pace that can't be sustained",
            "None, as long as dates are met",
            "Only a morale issue, not a delivery issue",
            "The team will get faster with practice",
          ],
          correctIndex: 0,
          explanation:
            "Recurring crunch hides a planning problem and erodes quality and retention. It's a delivery risk and should be on the risk log.",
        },
        {
          id: "pm-x-sustainability-q9",
          prompt: "A client asks you to report the platform's sustainability improvements. What should accompany any claim?",
          options: [
            "The measurement method, boundaries and assumptions, so the claim can be checked",
            "Only the headline percentage",
            "A statement that the cloud provider is green",
            "Nothing; sustainability claims don't need evidence",
          ],
          correctIndex: 0,
          explanation:
            "Unverifiable claims risk greenwashing. State the method (for example SCI with its functional unit) and boundaries.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "You have five proposed changes to a client's AI-powered platform. Using the data below, rank them by estimated annual emissions reduction, largest first. Reduction = energy saved (kWh) x grid intensity (kg CO2e per kWh); for the region move, it's the energy moved x the difference in intensity.\n\n- Right-size over-provisioned GPU inference instances: saves 30,000 kWh/yr at 0.30 kg/kWh\n- Move nightly embedding jobs (20,000 kWh/yr) from a 0.40 kg/kWh region to a 0.05 kg/kWh region (data residency confirmed OK)\n- Shut down staging environments overnight and at weekends: saves 7,800 kWh/yr at 0.30 kg/kWh\n- Cache repeated LLM answers: saves 4,000 kWh/yr at 0.30 kg/kWh\n- Compress images served in the app: saves 2,000 kWh/yr at 0.30 kg/kWh",
        items: [
          { id: "gpu", label: "Right-size GPU inference instances" },
          { id: "region", label: "Move nightly embedding jobs to a cleaner region" },
          { id: "staging", label: "Shut down staging overnight and at weekends" },
          { id: "cache", label: "Cache repeated LLM answers" },
          { id: "images", label: "Compress images served in the app" },
        ],
        correctOrder: ["gpu", "region", "staging", "cache", "images"],
        explanation:
          "GPU right-sizing: 30,000 x 0.30 = 9,000 kg. Region move: 20,000 x (0.40 - 0.05) = 7,000 kg. Staging: 7,800 x 0.30 = 2,340 kg. Caching: 4,000 x 0.30 = 1,200 kg. Images: 2,000 x 0.30 = 600 kg. The top two also cut cloud cost the most, which is usually how they get approved.",
      },
    },
    {
      id: "pm-x-coaching-pms",
      moduleId: "pm-expert",
      trackId: "pm",
      title: "Coaching & Developing Other PMs",
      summary:
        "Senior PMs multiply their impact through other people. An agency that depends on two or three experienced PMs to rescue every difficult account has a scaling problem; one where seniors develop juniors into people who can run those accounts has a growth engine. Coaching is the main tool, and it is a distinct skill from managing or mentoring.\n\nThe distinction matters. Mentoring shares your experience (\"here's how I handled a client like this\"). Managing directs work and holds people to standards. Coaching helps the other person think: it asks questions that let them find their own answer, which builds judgement that lasts. Models such as GROW (Goal, Reality, Options, Way forward) give structure to a coaching conversation; PMI's Disciplined Agile coaching guidance stresses meeting people where they are, adapting your stance to the situation and building the team's capability rather than your own indispensability. Good senior PMs switch between stances deliberately: teach when someone lacks knowledge, coach when they have the knowledge but need to build judgement, direct when the client relationship is at immediate risk.\n\nPractical habits: regular one-to-ones with a clear purpose; shadowing in both directions (the junior PM observes a difficult steering meeting, then you observe theirs); reviewing their status reports and change requests with questions rather than red pen; and specific, behaviour-based feedback, for example using the Situation-Behaviour-Impact model, delivered soon after the event. Give them stretch work with a safety net: lead the client call, with you present but silent unless needed.\n\nGotchas: rescuing too early teaches dependence, so let small mistakes happen when the cost is recoverable. Coaching by question when someone genuinely needs information is frustrating, so read the situation. Feedback that is only positive or only general does not change behaviour. And measure development by what they can now do alone (run a steering meeting, write a sound change request, handle an escalation), not by hours spent coaching.",
      level: "expert",
      estMinutes: 40,
      webRefs: [
        { label: "PMI Disciplined Agile: Agile coach overview", url: "https://www.pmi.org/disciplined-agile/agile-coach", kind: "docs" },
        { label: "PMI Disciplined Agile: Coaching tips", url: "https://www.pmi.org/microsites/disciplined-agile/agile-coach/concepts-coaching-tips", kind: "docs" },
        { label: "Salesforce: 10 effective coaching tips (transferable 1:1 coaching model)", url: "https://www.salesforce.com/blog/sales/effectively-coach-sales-team-blog/", kind: "article" },
      ],
      video: {
        title: "Coaching and Mentoring for Project Managers",
        channel: "Online PM Courses - Mike Clayton",
        url: "https://www.youtube.com/watch?v=KRmatpP6HQc",
        videoId: "KRmatpP6HQc",
      },
      alternateVideos: [
        {
          title: "Agile coaching skills every scrum master should know | Become a better scrum master",
          channel: "All Things Agile",
          url: "https://www.youtube.com/watch?v=rMFzBX0PT2w",
          videoId: "rMFzBX0PT2w",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-coaching-pms-q1",
          prompt: "What best distinguishes coaching from mentoring?",
          options: [
            "Coaching helps the person find their own answers through questions; mentoring shares the mentor's experience and advice",
            "Coaching is only for poor performers",
            "Mentoring is always done by an external professional",
            "There is no difference",
          ],
          correctIndex: 0,
          explanation:
            "Coaching builds the other person's thinking; mentoring transfers experience. Both are useful, and neither is a remedial-only tool.",
        },
        {
          id: "pm-x-coaching-pms-q2",
          prompt: "What do the letters in the GROW coaching model stand for?",
          options: [
            "Goal, Reality, Options, Way forward",
            "Growth, Results, Outcomes, Work",
            "Goal, Risk, Ownership, Workplan",
            "Guide, Review, Observe, Warn",
          ],
          correctIndex: 0,
          explanation:
            "GROW structures a conversation from what the person wants, through where they are now and possible options, to a committed next step.",
        },
        {
          id: "pm-x-coaching-pms-q3",
          prompt:
            "A junior PM has never written a change request and asks how to do one for a client meeting tomorrow. Which stance fits best?",
          options: [
            "Teach or mentor: show a good example and the key sections, then review their draft",
            "Coach with open questions until they work it out themselves",
            "Write it for them and attend the meeting instead",
            "Tell them to find a template online",
          ],
          correctIndex: 0,
          explanation:
            "When someone lacks knowledge and time is short, teaching is right. Coaching by question here is frustrating; doing it for them builds dependence.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-coaching-pms-q4",
          prompt: "Which feedback follows the Situation-Behaviour-Impact model?",
          options: [
            "\"In Tuesday's steering meeting, when you presented the delay without options, the sponsor spent 20 minutes asking for them and the decision slipped a week.\"",
            "\"You need to be more strategic in meetings.\"",
            "\"Great job lately, keep it up.\"",
            "\"Some people think your updates are confusing.\"",
          ],
          correctIndex: 0,
          explanation:
            "It names the situation, the specific behaviour and its impact. The others are vague, purely positive or hearsay, so they don't help someone change.",
        },
        {
          id: "pm-x-coaching-pms-q5",
          prompt:
            "You can see a junior PM's draft status report understates a risk. The report goes to a low-stakes internal audience tomorrow. What's the best coaching move?",
          options: [
            "Ask questions that lead them to spot it (what could stop the next milestone?), and debrief afterwards",
            "Rewrite the report yourself",
            "Say nothing and let them find out in a year",
            "Report them to their manager",
          ],
          correctIndex: 0,
          explanation:
            "Low stakes make it a learning opportunity; questions build judgement. Rewriting teaches dependence, silence wastes the lesson, and reporting them is punitive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-coaching-pms-q6",
          prompt: "Which practices develop junior PMs effectively? (Select all that apply.)",
          options: [
            "Two-way shadowing of client meetings with a debrief",
            "Stretch assignments with a safety net, such as leading a call with a senior present",
            "Regular one-to-ones with specific, timely feedback",
            "Taking over whenever a client becomes difficult",
            "Only giving feedback at annual reviews",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Observation, supported stretch and timely feedback build capability. Taking over and annual-only feedback prevent learning.",
        },
        {
          id: "pm-x-coaching-pms-q7",
          prompt:
            "A client is about to cancel the contract during a call a junior PM is leading. What should the senior PM do?",
          options: [
            "Step in to protect the relationship, then debrief and coach afterwards",
            "Stay silent so the junior learns",
            "Leave the call",
            "Wait and coach on it at the next one-to-one without intervening",
          ],
          correctIndex: 0,
          explanation:
            "Let mistakes happen only when the cost is recoverable. A lost account isn't, so direct now and coach later.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-coaching-pms-q8",
          prompt: "How should a senior PM measure whether coaching is working?",
          options: [
            "By what the coached PM can now do independently, such as running a steering meeting or handling an escalation",
            "By the number of coaching hours logged",
            "By how much the junior PM agrees with the coach",
            "By how often the junior asks for help",
          ],
          correctIndex: 0,
          explanation:
            "Outcomes are new independent capabilities. Hours and agreement measure activity, and fewer requests for help isn't automatically progress.",
        },
        {
          id: "pm-x-coaching-pms-q9",
          prompt: "According to PMI's Disciplined Agile guidance, what should a coach aim to build?",
          options: [
            "The team's own capability, so they need the coach less over time",
            "Dependence on the coach's expertise",
            "Strict adherence to a single method",
            "A larger coaching team",
          ],
          correctIndex: 0,
          explanation:
            "Good coaching makes itself less necessary. Dependence or method dogma is the opposite of Disciplined Agile's context-driven approach.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write the feedback and coaching notes you'll use in a one-to-one with the junior PM described below. Use Situation-Behaviour-Impact for the main feedback, include at least two coaching questions, and agree a concrete development step with a safety net.",
        context:
          "Sam, a PM with eight months' experience, ran the monthly steering meeting for a white-label grocery-delivery client yesterday. You attended. Sam presented a three-week delay to the AI substitution feature by reading the Jira board aloud for 15 minutes, gave no options, and when the client's COO asked 'what do you recommend?', said 'I'll have to check with the team'. The COO later emailed you directly asking whether Sam is the right person. Sam is diligent, well liked by the developers, and keeps excellent RAID logs. Next month's steering meeting is in four weeks.",
        wordLimit: 220,
        rubric: [
          { id: "sbi", label: "Specific SBI feedback", description: "Names the situation, the specific behaviours (reading the board, no options, no recommendation) and the impact on the COO and the decision.", weight: 1.5 },
          { id: "strengths", label: "Acknowledges real strengths", description: "Recognises genuine strengths (RAID logs, team trust) without diluting the main message.", weight: 1 },
          { id: "questions", label: "Coaching questions", description: "Includes at least two open questions that help Sam think (e.g. what the COO needed, how to prepare options).", weight: 1.5 },
          { id: "plan", label: "Development step with safety net", description: "Agrees a concrete step before the next steering meeting (e.g. rehearsal, options template, senior present) that keeps Sam leading.", weight: 1.5 },
          { id: "tone", label: "Supportive and direct", description: "Honest about the seriousness without being punitive; doesn't forward or quote the COO's email in a way that undermines Sam.", weight: 1 },
        ],
        sampleAnswer:
          "Strengths first: your RAID log is the best on the account, and the developers trust you. That's why I want to help you get steering meetings to the same standard.\n\nFeedback (SBI): in yesterday's steering meeting, when you walked through the Jira board for 15 minutes and then said you'd need to check with the team when the COO asked for a recommendation, the COO left without a decision on the delay, and his confidence in our control of the project dropped.\n\nCoaching questions:\n- What did the COO need to leave that meeting with?\n- If you'd had five minutes and one slide, what would you have shown?\n- What would you need to know beforehand to make a recommendation in the room?\n\nNext step: before next month's meeting, you'll prepare a one-page update with the impact, two or three options and your recommendation, using our steering template. We'll rehearse it together the day before. You'll lead the meeting; I'll be there, and I'll only step in if a commercial decision needs me. Afterwards we'll debrief for 15 minutes.\n\nHow does that sound, and what support would help most?",
      },
    },
  ],
} satisfies Module;
