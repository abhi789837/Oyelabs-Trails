import type { Module } from "@/types/curriculum";

export default {
  id: "bd-expert",
  trackId: "bd",
  name: "Strategic BD & AI-Powered Selling",
  description:
    "Running BD as a business: strategic accounts, new regions and verticals, pricing and margin on AI-heavy fixed bids, playbooks, leading a team, using AI for research and proposals without losing accuracy or confidentiality, and the contract terms every deal rests on. For senior BD people and leads.",
  refs: [
    { label: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", kind: "spec" },
    { label: "Claude Docs: Prompt engineering overview", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview", kind: "docs" },
  ],
  topics: [
    {
      id: "bd-x-strategic-accounts",
      moduleId: "bd-expert",
      trackId: "bd",
      title: "Strategic Accounts: Choosing and Growing the Few That Matter",
      summary:
        "Strategic account management starts from an uncomfortable fact: an agency cannot invest senior attention in every client, and the accounts that pay the most today are not always the ones worth investing in. A strategic account is one where the combination of expansion headroom, margin, relationship access and strategic value (a reference in a target vertical, a capability you want to build) justifies a deliberate plan, an executive sponsor on your side, and time from your best people.\n\nThe selection is the hard part. Score accounts on more than revenue: share of wallet (how much of the client's relevant spend you already have; 70% leaves little headroom, 5% leaves a lot), margin trend, executive access, the client's own growth and strategy, and risk signals such as in-sourcing or procurement-driven rate cuts. A $600k account with eroding margin and a client consolidating vendors may deserve less investment than an $80k account with a newly funded CTO who wants AI features.\n\nThe plan itself is a one-page account plan: the client's goals in their words, a relationship map (sponsor, decision makers, influencers, detractors), white space (problems you could solve that someone else, or no one, is solving), and dated actions. Pair a senior person from your side with each key client stakeholder, so the relationship does not depend on one account manager.\n\nThe gotchas: calling every big client 'strategic' (then none are); confusing activity with progress (more meetings without new problems uncovered); and over-serving a key account with unbilled 'goodwill' work that quietly destroys its margin. Review strategic status at least yearly and demote accounts that no longer qualify.",
      level: "expert",
      estMinutes: 50,
      webRefs: [
        { label: "MEDDICC: The MEDDPICC sales methodology (Economic Buyer, Champion)", url: "https://meddicc.com/meddpicc-sales-methodology-and-process", kind: "spec" },
        { label: "HubSpot: Key account management", url: "https://blog.hubspot.com/sales/key-account-management", kind: "article" },
        { label: "HubSpot: Company growth strategy", url: "https://blog.hubspot.com/sales/growth-strategy", kind: "article" },
      ],
      video: {
        title: "How to Open & Close More Deals With Key Accounts | Maddy Jackson",
        channel: "30 Minutes to President’s Club",
        url: "https://www.youtube.com/watch?v=zo_AvA4ZLRc",
        videoId: "zo_AvA4ZLRc",
      },
      alternateVideos: [
        {
          title: "How to Create the Ultimate One Page Key Account Plan",
          channel: "The KAM Club",
          url: "https://www.youtube.com/watch?v=AuAtY_2Ec-o",
          videoId: "AuAtY_2Ec-o",
          durationLabel: "22:39",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-x-strategic-accounts-q1",
          prompt: "Which factors should weigh most when deciding whether an account is strategic? (Select all that apply.)",
          options: [
            "Expansion headroom (share of wallet you do not yet have)",
            "Margin trend on the work",
            "Access to the client's executives and their strategy",
            "Current revenue alone",
            "How long the client has been with you",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Strategic value is about future potential, profitability and access. Current revenue and tenure matter, but on their own they reward the past, not where to invest.",
        },
        {
          id: "bd-x-strategic-accounts-q2",
          prompt:
            "Account X pays $600k a year, you already have about 70% of their outsourced development, margin has dropped from 30% to 14% after two rate cuts, and procurement wants another cut. Account Y pays $80k, has just raised funding, and their CTO wants your help with AI features at a healthy margin. Where should extra senior investment go?",
          options: [
            "Account Y, while running Account X efficiently and addressing its margin problem",
            "Account X, because it pays the most",
            "Neither; strategic accounts are a myth",
            "Split it equally between them",
          ],
          correctIndex: 0,
          explanation:
            "X has little headroom and eroding margin; more investment buys little. Y has growth, margin and executive pull. X still needs attention, but as a margin-repair problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-strategic-accounts-q3",
          prompt: "What does 'share of wallet' measure in an agency context?",
          options: [
            "The portion of the client's relevant technology or services spend that comes to you",
            "Your agency's share of the total market",
            "The client's profit margin",
            "How much the client spends on your invoices each month",
          ],
          correctIndex: 0,
          explanation:
            "Share of wallet tells you headroom: low share with a large wallet means room to grow; high share means growth must come from the client's own growth or new budgets.",
        },
        {
          id: "bd-x-strategic-accounts-q4",
          prompt: "What belongs in a one-page strategic account plan? (Select all that apply.)",
          options: [
            "The client's goals, in their own words",
            "A relationship map showing sponsor, decision makers and detractors",
            "White space: problems you could solve that you do not yet",
            "Dated actions with owners",
            "Full CVs of your delivery team",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Goals, relationships, opportunities and actions make a plan usable. Team CVs belong in proposals, not account plans.",
        },
        {
          id: "bd-x-strategic-accounts-q5",
          prompt: "Why pair senior people from your agency with specific client stakeholders (for example your CTO with theirs)?",
          options: [
            "It multi-threads the relationship so it survives people changes and gives peers someone credible to talk to",
            "It doubles the hours you can bill",
            "Clients require it contractually",
            "It removes the need for an account manager",
          ],
          correctIndex: 0,
          explanation:
            "Peer-level relationships create resilience and better insight. The account manager still coordinates the plan.",
        },
        {
          id: "bd-x-strategic-accounts-q6",
          prompt:
            "Your agency labels 18 of its 22 clients 'strategic'. What is the likely consequence?",
          options: [
            "Senior attention is spread so thin that no account gets the deliberate investment the label is meant to trigger",
            "Every client feels valued, so revenue rises",
            "Nothing changes, since it is only a label",
            "Delivery quality improves across the board",
          ],
          correctIndex: 0,
          explanation:
            "Strategic status is a decision to concentrate scarce resources. If nearly everything qualifies, the label stops meaning anything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-strategic-accounts-q7",
          prompt:
            "A key account receives lots of unbilled 'goodwill' work: extra features, free workshops and weekend fixes. Revenue is stable. What should you check?",
          options: [
            "The account's real margin once unbilled effort is included",
            "Whether the client has noticed",
            "Whether the team enjoys the work",
            "Nothing, since revenue is stable",
          ],
          correctIndex: 0,
          explanation:
            "Unbilled effort is a cost. Stable revenue with growing free work means falling margin; make goodwill deliberate and visible, not habitual.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-strategic-accounts-q8",
          prompt: "Which is the best sign that strategic account work is making progress?",
          options: [
            "New problems and budget holders identified and qualified in the account",
            "More meetings held this quarter",
            "More emails sent to the client",
            "A longer account plan document",
          ],
          correctIndex: 0,
          explanation:
            "Progress means new qualified opportunities and relationships, not activity counts.",
        },
        {
          id: "bd-x-strategic-accounts-q9",
          prompt: "How often should you review which accounts are strategic?",
          options: [
            "At least yearly, demoting accounts that no longer qualify and promoting new ones",
            "Never; once strategic, always strategic",
            "Only when a client complains",
            "Every week",
          ],
          correctIndex: 0,
          explanation:
            "Client strategies, budgets and your own focus change. A regular review keeps investment pointed at the best opportunities without constant churn.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "Rank these accounts by where extra senior BD investment next year will create the most value. Weigh expansion headroom, margin, executive access and risk, not just current revenue.",
        items: [
          { id: "a", label: "Logistics group: $400k/yr, about 10% of their tech spend, engaged COO sponsor, 40% margin, two business units planning new apps" },
          { id: "b", label: "Retail chain: $600k/yr, about 70% of their outsourced dev, margin down to 12%, plans to move work to an offshore captive next year" },
          { id: "c", label: "Healthtech scale-up: $80k/yr, just raised a Series B, CTO champion wants AI features, 45% margin" },
          { id: "d", label: "Fintech: $250k/yr, 35% margin, sponsor recently left, renewal going to RFP in six months, active product roadmap" },
          { id: "e", label: "Hospitality client: $30k one-off website, no further roadmap, owner-managed" },
        ],
        correctOrder: ["a", "c", "d", "b", "e"],
        explanation:
          "The logistics group combines headroom, margin and sponsor access. The healthtech scale-up is small but has funding, a champion and high margin. The fintech is at risk but has a roadmap worth defending, so it needs a new sponsor before the RFP. The retail chain is large but has little headroom, falling margin and a stated plan to leave, so it calls for efficient handling and a transition plan rather than extra investment. The one-off website has nothing to expand into.",
      },
    },
    {
      id: "bd-x-new-regions-verticals",
      moduleId: "bd-expert",
      trackId: "bd",
      title: "Expanding into New Regions and Verticals",
      summary:
        "Growth for an agency eventually means selling to new kinds of clients: a new vertical (healthcare, fintech, logistics) or a new region (the EU, the Gulf, North America). Both look like 'more of the same pipeline' and are not. Each new market resets the things that made your existing market work: references, regulatory knowledge, buyer networks, pricing norms, and often time zone and language.\n\nA vertical expansion should start from an unfair advantage: a team that has delivered one or two projects in the space, a reusable component (for example a telehealth booking module), or a partner who already sells there. Regulation is the first filter. Healthcare brings patient-data rules, fintech brings security and audit expectations, and either can turn an ordinary app project into a compliance project that needs specific expertise and different pricing.\n\nA regional expansion adds data protection and transfer rules (personal data moving out of the UK or EU needs a lawful transfer mechanism), local contracting and tax, payment terms and procurement habits, and the practical question of overlap hours with clients. Pricing that wins in one region may look suspiciously cheap or unaffordably high in another.\n\nThe trade-off is focus versus diversification. Entering one new market at a time, with a beachhead segment (one vertical in one region), a named owner and a budget for 12 to 18 months, beats sprinkling outreach across five. The gotchas: assuming references transfer ('we built a retail app' does not convince a hospital), underestimating time to first deal, which is often a year or more for regulated sectors, and selling regulated work before you have the compliance capability to deliver it. Define exit criteria in advance so a failing expansion is stopped rather than drifting.",
      level: "expert",
      estMinutes: 50,
      webRefs: [
        { label: "ICO: International transfers (UK GDPR guidance)", url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/", kind: "docs" },
        { label: "International Trade Administration: Export solutions", url: "https://www.trade.gov/export-solutions", kind: "docs" },
        { label: "HubSpot: Market development strategy", url: "https://blog.hubspot.com/marketing/market-development-strategy", kind: "article" },
        { label: "HubSpot: Sales territory planning", url: "https://blog.hubspot.com/sales/how-to-strategically-divide-your-sales-territories", kind: "article" },
      ],
      video: {
        title: "Market Expansion and Localization Strategy | Ferdinand Goetzen",
        channel: "ProductLed",
        url: "https://www.youtube.com/watch?v=9uN-PAv7WGw",
        videoId: "9uN-PAv7WGw",
        durationLabel: "14:43",
      },
      alternateVideos: [
        {
          title: "Land and Expand: The Most Misunderstood Strategy in SaaS",
          channel: "Willingness to Pay",
          url: "https://www.youtube.com/watch?v=2fsOKMsCeqw",
          videoId: "2fsOKMsCeqw",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-x-new-regions-verticals-q1",
          prompt: "What is the strongest starting point for entering a new vertical?",
          options: [
            "An existing advantage there: a delivered project, a reusable component or a partner already selling in the space",
            "A large cold-outreach campaign to every company in the vertical",
            "Lower prices than local competitors",
            "A new website section about the vertical",
          ],
          correctIndex: 0,
          explanation:
            "Credibility in a vertical comes from proof and relationships. Outreach and pricing without proof rarely convert in specialist markets.",
        },
        {
          id: "bd-x-new-regions-verticals-q2",
          prompt: "Which change when you move into a new region? (Select all that apply.)",
          options: [
            "Data protection and cross-border transfer requirements",
            "Contracting, tax and payment-term norms",
            "Overlap hours available for client collaboration",
            "Pricing expectations and procurement habits",
            "The fundamentals of good software engineering",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Legal, commercial, practical and pricing norms all shift by region. Engineering fundamentals do not, which is part of why agencies underestimate the rest.",
        },
        {
          id: "bd-x-new-regions-verticals-q3",
          prompt:
            "Your agency has strong retail case studies and wants to enter healthcare. A hospital's IT director asks for relevant references. What is the honest, effective approach?",
          options: [
            "Acknowledge you are new to healthcare, show transferable work (integrations, accessibility, scale), and propose a small, lower-risk first phase",
            "Present your retail apps as healthcare-ready",
            "Claim healthcare experience from a team member's previous employer as the agency's own",
            "Offer the whole project free",
          ],
          correctIndex: 0,
          explanation:
            "References do not transfer automatically; overstating them is quickly found out. Honest positioning and a contained first phase lower the buyer's risk.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-new-regions-verticals-q4",
          prompt: "Why is a 'beachhead' approach (one vertical in one region first) usually better than a broad launch?",
          options: [
            "Concentrated effort builds references and word of mouth faster in a market where buyers talk to each other",
            "It is cheaper to build a website for one market",
            "Regulators require it",
            "It guarantees a first deal within a quarter",
          ],
          correctIndex: 0,
          explanation:
            "Focused markets compound: each win becomes a reference for the next. Spreading thin across several markets delays the first proof everywhere.",
        },
        {
          id: "bd-x-new-regions-verticals-q5",
          prompt:
            "Your offshore delivery team will process EU customers' personal data for a new German client. What must be addressed?",
          options: [
            "A lawful mechanism for transferring personal data out of the EU, and the processor terms in the contract",
            "Nothing, as long as the servers are fast",
            "Only translating the app into German",
            "Registering your agency as a German company",
          ],
          correctIndex: 0,
          explanation:
            "Cross-border processing of EU or UK personal data needs a valid transfer mechanism and proper processor terms. Translation and incorporation are separate decisions.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-new-regions-verticals-q6",
          prompt: "What is a realistic expectation for time to first deal in a regulated vertical with no existing references?",
          options: [
            "Often a year or more, so the expansion needs a budget and owner for 12 to 18 months",
            "Two to four weeks",
            "One quarter, guaranteed",
            "It depends only on how many emails you send",
          ],
          correctIndex: 0,
          explanation:
            "Long cycles plus trust-building make regulated verticals slow to open. Underfunded expansions are abandoned just before they would have worked.",
        },
        {
          id: "bd-x-new-regions-verticals-q7",
          prompt: "Why should you define exit criteria before starting an expansion?",
          options: [
            "So a failing expansion is stopped on evidence instead of drifting on sunk cost",
            "To impress the board",
            "Because exit criteria are a legal requirement",
            "To limit how many deals you can win",
          ],
          correctIndex: 0,
          explanation:
            "Without agreed criteria (for example qualified pipeline by month 9), teams keep going on hope. Pre-agreed checkpoints make the decision objective.",
        },
        {
          id: "bd-x-new-regions-verticals-q8",
          prompt:
            "Your rates are competitive in your home market. In a new high-cost region, prospects say your prices look 'suspiciously low'. What does this suggest?",
          options: [
            "Price signals quality differently by market, so you may need to reposition price and proof for that region",
            "You should lower prices further",
            "Prospects are bluffing",
            "Pricing never affects perception",
          ],
          correctIndex: 0,
          explanation:
            "Very low prices can signal risk to buyers used to local rates. Pair pricing with local proof, and consider whether you are leaving margin on the table.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-new-regions-verticals-q9",
          prompt: "Which are sensible ways to reduce the risk of entering a new region? (Select all that apply.)",
          options: [
            "Partnering with a local firm that already has relationships",
            "Following an existing client into the region",
            "Hiring or contracting someone with local market experience",
            "Launching in five regions at once to see which works",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Partners, existing clients and local expertise borrow trust and knowledge. Launching everywhere at once splits effort and delays proof.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "Your agency (strong in retail and logistics apps) is considering two growth bets for next year: (1) healthcare apps in your home market, where one past client was a pharmacy chain; (2) any kind of app work in a new region where you have no clients but one partner agency has offered introductions.",
        steps: [
          {
            id: "g1",
            question: "With budget for one serious bet, how do you decide?",
            options: [
              "Score each on existing advantage, regulatory effort, time to first deal and fit with your capabilities, then pick one beachhead",
              "Pick the larger market by population",
              "Do both with half the budget each",
              "Pick whichever one the CEO mentioned first",
            ],
            correctIndex: 0,
            explanation: "A structured comparison of advantage, cost and speed avoids splitting thin and avoids picking by size alone.",
          },
          {
            id: "g2",
            question:
              "You choose healthcare. A large hospital group invites you to bid for a patient-records integration that requires certified compliance processes you do not yet have. What do you do?",
            options: [
              "Decline or partner with a compliant specialist, and target smaller healthcare projects (booking, pharmacy) where you can deliver now",
              "Bid and plan to get compliant after winning",
              "Bid at a low price to win the reference",
              "Pretend the compliance processes exist",
            ],
            correctIndex: 0,
            explanation: "Selling regulated work you cannot deliver risks the client, your reputation and legal exposure; partnering or picking deliverable work builds the beachhead safely.",
          },
          {
            id: "g3",
            question: "Nine months in, you have two small healthcare clients and a qualified pipeline below your agreed checkpoint. What next?",
            options: [
              "Review against the pre-agreed exit criteria, analyse why pipeline lags, and decide on evidence to adjust, continue with a deadline, or stop",
              "Keep going indefinitely, since you have already invested",
              "Stop immediately without analysis",
              "Switch to the region bet without reviewing what happened",
            ],
            correctIndex: 0,
            explanation: "Pre-agreed checkpoints exist for exactly this moment; the decision should follow the evidence, not sunk cost or panic.",
          },
        ],
      },
    },
    {
      id: "bd-x-pricing-margins",
      moduleId: "bd-expert",
      trackId: "bd",
      title: "Pricing Strategy and Margins: Blended Rates, Utilisation and AI Costs on Fixed Bids",
      summary:
        "Pricing is where BD decisions turn into the agency's profit or loss. Four numbers carry most of the story. Blended rate is total fee divided by total hours across roles; it tells you what an hour of 'the team' sells for, and it falls quietly when a deal is staffed senior-heavy at a junior-weighted price. Utilisation is billable hours divided by available hours; a team at 60% has to charge much more per billable hour than one at 80% to cover the same salaries. Gross margin is (revenue − delivery cost) ÷ revenue, and it is not markup: a 50% markup on cost is only a 33% margin. Effective rate on a fixed bid is fee divided by hours actually spent, which is where overruns show up.\n\nFixed bids shift risk to the agency. That is fine when scope is clear and you price in contingency, and dangerous when you discount the rate card and the estimate at the same time. AI features add a new kind of risk: model API costs are variable and usage-driven. Calls are priced per token, change with the model you pick, and scale with how many users and conversations the client actually has. A fixed price that includes 'hosting and AI costs for 12 months' turns your margin into a bet on the client's adoption.\n\nThe usual protections are to quote AI usage separately as pass-through (at cost plus a handling fee) or in usage tiers with caps; to design for cost (smaller models where they suffice, prompt caching, limiting calls per action); to monitor spend from day one; and to state usage assumptions in the contract.\n\nValue-based pricing (price set by the value to the client, not your hours) can lift margin substantially, but only when you can quantify that value credibly and control delivery risk. The gotcha is hiding costs to win: a deal that only works at a 15% margin if nothing goes wrong is a loss you have not booked yet.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Claude Docs: Pricing", url: "https://platform.claude.com/docs/en/about-claude/pricing", kind: "docs" },
        { label: "Investopedia: Gross profit margin", url: "https://www.investopedia.com/terms/g/gross_profit_margin.asp", kind: "article" },
        { label: "Investopedia: Markup (vs margin)", url: "https://www.investopedia.com/terms/m/markup.asp", kind: "article" },
        { label: "HubSpot: Value-based pricing", url: "https://blog.hubspot.com/sales/value-based-pricing", kind: "article" },
      ],
      video: {
        title: "Digital Agency Profit Margin Guide: What Your Agency Profit Margin be (and how to get there)",
        channel: "Jason Swenk",
        url: "https://www.youtube.com/watch?v=3jLt2bR0mPU",
        videoId: "3jLt2bR0mPU",
      },
      alternateVideos: [
        {
          title: "How To Price Agency Services & Increase Profit Margins By 110% | Ep: 002",
          channel: "Move At Pace",
          url: "https://www.youtube.com/watch?v=38rkkamOP2o",
          videoId: "38rkkamOP2o",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-x-pricing-margins-q1",
          prompt: "Your delivery cost is $60,000 and you price the project at $90,000 (a 50% markup). What is the gross margin?",
          options: ["About 33%", "50%", "150%", "About 67%"],
          correctIndex: 0,
          explanation:
            "Margin = (90,000 − 60,000) ÷ 90,000 ≈ 33%. Markup is measured on cost, margin on price; confusing them is one of the most common pricing errors.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-pricing-margins-q2",
          prompt: "A developer has 1,600 available hours a year and logs 1,200 billable hours. What is their utilisation?",
          options: ["75%", "133%", "25%", "80%"],
          correctIndex: 0,
          explanation:
            "Utilisation = billable ÷ available = 1,200 ÷ 1,600 = 75%. Lower utilisation means each billable hour must carry more salary cost.",
        },
        {
          id: "bd-x-pricing-margins-q3",
          prompt:
            "A fixed-price project of $100,000 was estimated at 1,000 hours. The team actually spends 1,250 hours. What is the effective hourly rate?",
          options: ["$80", "$100", "$125", "$75"],
          correctIndex: 0,
          explanation:
            "$100,000 ÷ 1,250 = $80 an hour. The planned $100 rate only holds if the estimate holds, which is why overruns on fixed bids go straight to margin.",
        },
        {
          id: "bd-x-pricing-margins-q4",
          prompt:
            "You quote a fixed price for an AI support assistant that includes 'all AI API costs for 12 months'. Which risks have you taken on? (Select all that apply.)",
          options: [
            "Higher usage than forecast increases your costs but not your fee",
            "A change of model or provider pricing changes your costs",
            "Features that make several model calls per user action multiply cost",
            "The client's design preferences may change",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "AI costs scale with usage, model choice and calls per action, all of which you have fixed in price but not in cost. Design changes are ordinary scope risk, not AI cost risk.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-pricing-margins-q5",
          prompt: "Which are sound ways to protect margin on AI usage costs? (Select all that apply.)",
          options: [
            "Billing AI usage as pass-through at cost plus a handling fee",
            "Pricing usage in tiers with caps and overage rates",
            "Designing for cost: smaller models where adequate, prompt caching, fewer calls per action",
            "Leaving usage assumptions out of the contract so you have flexibility",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Pass-through, tiers and cost-aware design all limit exposure. Unstated assumptions leave you nothing to point to when usage grows.",
        },
        {
          id: "bd-x-pricing-margins-q6",
          prompt: "What is a blended rate?",
          options: [
            "Total fee divided by total hours across all roles on the project",
            "The average of your highest and lowest rate-card rates",
            "Your senior engineer's rate",
            "The client's internal hourly cost",
          ],
          correctIndex: 0,
          explanation:
            "The blended rate is weighted by the hours each role actually works. A senior-heavy team sold at a junior-weighted blended rate loses margin quietly.",
        },
        {
          id: "bd-x-pricing-margins-q7",
          prompt:
            "To win a competitive fixed bid, a seller cuts the rate by 10% and also trims the estimate by 15% 'because the team can be efficient'. What is the main problem?",
          options: [
            "Both cuts compound: lower price per hour and fewer budgeted hours, so a normal overrun turns into a loss",
            "Clients dislike discounts",
            "The rate cut is illegal",
            "Nothing, since efficiency is always achievable",
          ],
          correctIndex: 0,
          explanation:
            "Discounting the price is a commercial decision; cutting the estimate to make it fit is wishful thinking. Together they leave no buffer for the usual overrun.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-pricing-margins-q8",
          prompt: "When is value-based pricing most appropriate for an agency?",
          options: [
            "When you can quantify the client's value credibly and control the delivery risk",
            "Whenever the client is large",
            "Always, since it always earns more",
            "Only for hourly retainers",
          ],
          correctIndex: 0,
          explanation:
            "Value pricing needs a defensible value case and confidence in delivery. Without both, it is just a high fixed price with fixed-price risk.",
        },
        {
          id: "bd-x-pricing-margins-q9",
          prompt:
            "Team A runs at 80% utilisation, Team B at 60%, with identical salaries. To reach the same gross margin, how must Team B's bill rate compare?",
          options: [
            "About 33% higher than Team A's",
            "20% higher",
            "The same",
            "20% lower",
          ],
          correctIndex: 0,
          explanation:
            "Revenue per person scales with billable hours: 80 ÷ 60 ≈ 1.33, so B needs about a third more per billable hour for the same revenue per person.",
        },
        {
          id: "bd-x-pricing-margins-q10",
          prompt: "Why should usage assumptions for AI features be written into the proposal or contract?",
          options: [
            "So there is an agreed basis for billing or re-pricing when real usage exceeds the forecast",
            "Because AI providers require it",
            "To make the proposal longer",
            "So the client can choose the model",
          ],
          correctIndex: 0,
          explanation:
            "Stated assumptions (for example conversations per month) turn an argument about fairness into a reference to what was agreed.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "You are reviewing a fixed-price bid for an AI-enabled customer app before it goes out. The agreed fixed price is $180,000. The price includes AI API costs during the build ($2,000) and for the first 12 months after launch, estimated at 40,000 conversations a month at $0.03 each. Use the table for labour. Round percentages to two decimal places.",
        table: {
          columns: ["Role", "Hours", "Cost per hour", "Rate-card bill rate"],
          rows: [
            ["Senior engineer", "800", "$40", "$95"],
            ["Engineer", "1,200", "$25", "$65"],
            ["QA", "400", "$20", "$50"],
            ["Project manager", "300", "$35", "$80"],
          ],
        },
        fields: [
          { id: "blended", label: "Blended rate-card bill rate", unit: "$/h", answer: 73.33, tolerance: 0.01 },
          { id: "cost", label: "Total delivery cost (labour + build AI + 12 months AI)", unit: "$", answer: 96900, tolerance: 1 },
          { id: "margin", label: "Gross margin on the $180,000 fixed price", unit: "%", answer: 46.17, tolerance: 0.01 },
          { id: "margin3x", label: "Gross margin if post-launch AI usage is three times the estimate", unit: "%", answer: 30.17, tolerance: 0.01 },
        ],
        explanation:
          "Rate-card revenue = 76,000 + 78,000 + 20,000 + 24,000 = $198,000 over 2,700 hours, so the blended rate is $73.33 an hour (the $180,000 price is already a discount on it). Labour cost = 32,000 + 30,000 + 8,000 + 10,500 = $80,500. AI run cost = 40,000 × $0.03 × 12 = $14,400. Total cost = 80,500 + 2,000 + 14,400 = $96,900, so margin = 83,100 ÷ 180,000 = 46.17%. If usage triples, AI run cost is $43,200, total cost $125,700, and margin falls to 54,300 ÷ 180,000 = 30.17%: a 16-point swing driven by one assumption, which is why usage should be pass-through or tiered.",
      },
    },
    {
      id: "bd-x-bd-playbooks",
      moduleId: "bd-expert",
      trackId: "bd",
      title: "Building a BD Playbook",
      summary:
        "A BD playbook is how an agency turns what its best sellers do into something the whole team can repeat. Without one, every seller qualifies differently, stages mean different things in the CRM, proposals vary wildly, discounts are improvised, and the forecast is unreliable because 'proposal sent' means one thing to one person and another to the next. New hires take months to ramp because the knowledge lives in people's heads.\n\nA useful playbook is short and operational. It defines the ideal client profile and buyer personas; qualification criteria (for example MEDDPICC-style questions) and what disqualifies a lead; pipeline stages with exit criteria ('Proposal' means a budget range and decision process are known, not just that a document was emailed); discovery question banks by vertical; objection responses; proposal and pricing guardrails, including who can approve which discount; and the handoff to delivery so what was sold is what gets built.\n\nThe trade-off is consistency versus judgement. Scripts make a junior team consistent but sound robotic and break in unusual deals; principles adapt but are harder to coach. Most good playbooks script the mechanics (stages, approvals, handoff) and give principles plus examples for conversations.\n\nThe gotchas: a 60-page document written once by a manager and never opened again; content invented in a workshop rather than extracted from deals that were actually won and lost; no owner and no review cycle; and no measurement, so nobody knows whether the playbook changed win rate or cycle length. Build it from call recordings and win/loss reviews, keep it in the tools the team already uses (CRM playbooks, templates), assign an owner, and revise it quarterly.",
      level: "expert",
      estMinutes: 45,
      webRefs: [
        { label: "HubSpot Knowledge Base: Use playbooks", url: "https://knowledge.hubspot.com/playbooks/use-playbooks", kind: "docs" },
        { label: "Salesforce: Sales playbook guide", url: "https://www.salesforce.com/blog/sales/sales-playbook/", kind: "article" },
        { label: "HubSpot: Business development strategies for startups", url: "https://www.hubspot.com/startups/business-development-for-startups", kind: "article" },
      ],
      video: {
        title: "How to Create a Sales Playbook (Guide)",
        channel: "HubSpot Marketing",
        url: "https://www.youtube.com/watch?v=gWX3bKqEDhQ",
        videoId: "gWX3bKqEDhQ",
      },
      alternateVideos: [
        {
          title: "The Sales Playbook For Founders | Startup School",
          channel: "Y Combinator",
          url: "https://www.youtube.com/watch?v=DH7REvnQ1y4",
          videoId: "DH7REvnQ1y4",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-x-bd-playbooks-q1",
          prompt: "What problem does a BD playbook mainly solve?",
          options: [
            "Inconsistent qualification, stages, proposals and pricing across sellers, which makes results and forecasts unreliable",
            "A lack of marketing content",
            "Slow software delivery",
            "Too many inbound leads",
          ],
          correctIndex: 0,
          explanation:
            "A playbook standardises the repeatable parts of selling so results depend less on who handles the deal.",
        },
        {
          id: "bd-x-bd-playbooks-q2",
          prompt: "Which belong in an agency BD playbook? (Select all that apply.)",
          options: [
            "Pipeline stages with clear exit criteria",
            "Discount approval levels and pricing guardrails",
            "The handoff process from BD to delivery",
            "Qualification and disqualification criteria",
            "Each seller's personal commission figures",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Stages, pricing rules, handoff and qualification are the operational core. Individual commission figures are confidential compensation data, not playbook content.",
        },
        {
          id: "bd-x-bd-playbooks-q3",
          prompt: "What is an exit criterion for a pipeline stage?",
          options: [
            "Evidence that must exist before a deal can move to the next stage, for example a known budget range and decision process",
            "The date a deal must leave the stage",
            "The reason a deal was lost",
            "A seller's opinion that the deal is progressing",
          ],
          correctIndex: 0,
          explanation:
            "Exit criteria make stages mean the same thing for everyone, which is what makes stage probabilities and forecasts usable.",
        },
        {
          id: "bd-x-bd-playbooks-q4",
          prompt:
            "Your agency's playbook is a 60-page document written two years ago. Nobody uses it and win rates vary from 10% to 40% across sellers. What is the best fix?",
          options: [
            "Rebuild a short version from recent won and lost deals and top performers' calls, embed it in the CRM and templates, and give it an owner and a review cycle",
            "Make reading the 60-page document mandatory",
            "Add 20 more pages covering edge cases",
            "Abandon playbooks entirely",
          ],
          correctIndex: 0,
          explanation:
            "Playbooks fail when they are long, stale and separate from daily tools. Evidence-based, embedded and owned is what makes them used.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-bd-playbooks-q5",
          prompt: "Where should playbook content come from?",
          options: [
            "Patterns in deals actually won and lost, call recordings, and what top performers do",
            "A manager's opinion of best practice",
            "A competitor's published playbook",
            "Generic sales books only",
          ],
          correctIndex: 0,
          explanation:
            "Extracting from real deals captures what works in your market. Opinions and generic sources are useful inputs but not evidence.",
        },
        {
          id: "bd-x-bd-playbooks-q6",
          prompt: "What is the usual balance between scripts and principles in a good playbook?",
          options: [
            "Script the mechanics (stages, approvals, handoff) and give principles with examples for conversations",
            "Script every conversation word for word",
            "Avoid any scripts or rules",
            "Script only the closing questions",
          ],
          correctIndex: 0,
          explanation:
            "Mechanics benefit from strict consistency; conversations need judgement. Full scripts sound robotic and break in unusual deals.",
        },
        {
          id: "bd-x-bd-playbooks-q7",
          prompt:
            "After a playbook launch, how should you judge whether it worked? (Select all that apply.)",
          options: [
            "Compare win rate and sales cycle before and after",
            "Track ramp time for new hires",
            "Check stage-to-stage conversion consistency across sellers",
            "Count how many people opened the document",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Outcome and consistency metrics show impact. Document views measure exposure, not effect.",
        },
        {
          id: "bd-x-bd-playbooks-q8",
          prompt:
            "Delivery teams complain that BD regularly sells features with timelines the team never agreed to. Which playbook element addresses this most directly?",
          options: [
            "A defined BD-to-delivery handoff with technical review of scope and timeline before the proposal goes out",
            "More objection-handling scripts",
            "A higher discount limit",
            "A new ideal client profile",
          ],
          correctIndex: 0,
          explanation:
            "Overselling is a handoff and review problem: involving delivery in scope and timeline before commitment prevents it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-bd-playbooks-q9",
          prompt: "Why should discount approval levels be written into the playbook?",
          options: [
            "So discounts are consistent, margin is protected and sellers know when to escalate rather than improvise",
            "To stop all discounts",
            "Because clients ask to see them",
            "So sellers can offer the maximum discount immediately",
          ],
          correctIndex: 0,
          explanation:
            "Clear thresholds (for example, up to 5% at seller level, more with director approval) prevent ad-hoc discounting that erodes margin.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Below is a draft section of your agency's new BD playbook. Mark the lines that will cause problems in practice.",
        segments: [
          { id: "p1", text: "Stage 1, Qualified: the lead matches our ICP and we have confirmed a business problem and a decision maker.", issue: null },
          { id: "p2", text: "Stage 2, Discovery done: we know the budget range, decision process and success criteria.", issue: null },
          { id: "p3", text: "Stage 3, Proposal: any deal where we have emailed a document to the client.", issue: "Activity-based, not evidence-based; deals will sit in 'Proposal' without the conditions that make that stage meaningful." },
          { id: "p4", text: "Discounts up to 5% may be offered by the seller; anything higher needs BD director approval.", issue: null },
          { id: "p5", text: "Sellers may promise any delivery date the client needs to close the deal.", issue: "No delivery input; guarantees overselling and missed timelines." },
          { id: "p6", text: "Every proposal over $50k gets a technical review from a delivery lead before it is sent.", issue: null },
          { id: "p7", text: "Use the discovery question bank for your vertical; adapt questions to the conversation.", issue: null },
          { id: "p8", text: "This playbook is final and will not be updated.", issue: "No owner or review cycle; it will go stale as the market and offers change." },
          { id: "p9", text: "Every lost deal gets a short loss reason recorded in the CRM within a week.", issue: null },
          { id: "p10", text: "After signature, the seller runs a handoff call with the delivery lead and shares discovery notes.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "bd-x-leading-bd-team",
      moduleId: "bd-expert",
      trackId: "bd",
      title: "Leading a BD Team: Hiring, Coaching, Incentives and Forecast Accountability",
      summary:
        "Moving from top seller to BD lead changes the job from winning deals to building a team that wins them. The classic failure is promoting the best seller and watching them keep selling: they take over the big deals, the team stops learning, and the agency loses a great seller and gains a weak manager. The lead's leverage is in four places: who is hired, how they are coached, how they are paid, and how the pipeline is run.\n\nCoaching is the highest-return activity and the most often skipped. Effective coaching focuses on behaviours a seller can change (the discovery questions they asked, how they handled the budget question), uses evidence such as call recordings, and targets one or two skills at a time. Coaching on outcomes ('close more') is not coaching. Pipeline reviews and deal reviews are different meetings: one inspects the whole pipeline's health and forecast, the other works through how to win one important deal.\n\nIncentives shape behaviour more than any memo. Paying commission on signed revenue alone rewards discounting and overselling, which delivery then pays for. Many agencies pay on gross margin or on collected revenue, or add a component for forecast accuracy, so sellers care about the quality of what they sell.\n\nThe trade-offs: tight inspection improves forecasts but can push sellers to hide bad news; a high-autonomy culture retains senior people but can drift. The gotchas: measuring only lagging metrics (revenue) when leading ones (qualified meetings, discovery quality, pipeline created) tell you what will happen; ignoring the BD-delivery relationship, where overselling destroys trust on both sides; and not separating forecast categories from hope, so the lead ends up reporting optimism to leadership.",
      level: "expert",
      estMinutes: 50,
      webRefs: [
        { label: "HubSpot Knowledge Base: Review call recordings and transcripts", url: "https://knowledge.hubspot.com/calling/review-call-recordings-and-transcripts", kind: "docs" },
        { label: "HubSpot: Sales coaching", url: "https://blog.hubspot.com/sales/sales-coaching", kind: "article" },
        { label: "Gong: Coaching sales teams", url: "https://www.gong.io/blog/sales-team-performance-coaching", kind: "article" },
      ],
      video: {
        title: "Proven Methods for Coaching AEs to Master Discovery and Close More Deals (Sean Gentry, WebFlow)",
        channel: "30 Minutes to President’s Club",
        url: "https://www.youtube.com/watch?v=yI6N80IFdfg",
        videoId: "yI6N80IFdfg",
        durationLabel: "27:44",
      },
      alternateVideos: [
        {
          title: "8 Rules Sales Leaders Must Follow to Get Promoted to the Big Leagues",
          channel: "30 Minutes to President’s Club",
          url: "https://www.youtube.com/watch?v=Wby5JuNjUw8",
          videoId: "Wby5JuNjUw8",
          durationLabel: "21:13",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-x-leading-bd-team-q1",
          prompt: "Which is an example of behavioural coaching rather than outcome coaching?",
          options: [
            "\"In this recording you moved to pricing before asking who else is involved; next call, map the decision process first.\"",
            "\"You need to close two more deals this month.\"",
            "\"Your win rate is too low.\"",
            "\"Try harder on the big deals.\"",
          ],
          correctIndex: 0,
          explanation:
            "Behavioural coaching names a specific, changeable action with evidence. The others state results the seller already knows about.",
        },
        {
          id: "bd-x-leading-bd-team-q2",
          prompt:
            "Commission is paid only on signed contract value. Delivery reports more and more deals with heavy discounts and unrealistic scope. What change addresses the root cause?",
          options: [
            "Base part of commission on gross margin or collected revenue, and require delivery review before signature",
            "Raise the commission rate",
            "Ask delivery to work faster",
            "Remove all discounts",
          ],
          correctIndex: 0,
          explanation:
            "Incentives drive behaviour: paying on signed value alone rewards volume at any price. Margin-linked pay plus delivery review aligns sellers with deal quality.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-leading-bd-team-q3",
          prompt: "Which are leading indicators for a BD team? (Select all that apply.)",
          options: [
            "Qualified meetings booked",
            "New qualified pipeline created",
            "Discovery calls that reach the decision process",
            "Revenue closed last quarter",
            "Last year's win rate",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Leading indicators predict future results and can be acted on now. Closed revenue and historical win rate are lagging outcomes.",
        },
        {
          id: "bd-x-leading-bd-team-q4",
          prompt: "What is the difference between a pipeline review and a deal review?",
          options: [
            "A pipeline review checks the health and forecast of all deals; a deal review works on how to win one important deal",
            "They are the same meeting",
            "A deal review is only for lost deals",
            "A pipeline review is only for new hires",
          ],
          correctIndex: 0,
          explanation:
            "Mixing them makes both weak: the pipeline review becomes a long story about one deal, and big deals never get real strategy time.",
        },
        {
          id: "bd-x-leading-bd-team-q5",
          prompt:
            "You were promoted from top seller to BD lead. Three months later you are personally running the four largest deals and the team's numbers are flat. What is happening?",
          options: [
            "You are still acting as a seller, so the team is not developing and your capacity limits the whole team",
            "The team is not talented enough",
            "The market has slowed",
            "This is how a BD lead should work",
          ],
          correctIndex: 0,
          explanation:
            "Taking over deals feels productive but caps the team at your capacity. Coach sellers through the big deals instead of running them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-leading-bd-team-q6",
          prompt:
            "Your weekly forecast meetings have become tense, and sellers have started moving deals to 'commit' only at the last moment. What is a likely cause and fix?",
          options: [
            "Bad news is being punished; separate inspection from blame and reward early, accurate risk flags",
            "Sellers are lazy; add more meetings",
            "The CRM is broken; buy a new one",
            "Forecasting is impossible; stop doing it",
          ],
          correctIndex: 0,
          explanation:
            "If accuracy is punished, sellers hide information. Leaders who reward early honesty get better forecasts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-leading-bd-team-q7",
          prompt: "What makes call recordings useful for coaching?",
          options: [
            "They give specific evidence of what was said, so feedback is concrete and the seller can hear it themselves",
            "They replace the need for one-to-ones",
            "They let you monitor sellers without telling them",
            "They are required by law",
          ],
          correctIndex: 0,
          explanation:
            "Evidence-based coaching is more accurate and less personal. Recording also has legal and consent requirements, so follow your policy and local rules.",
        },
        {
          id: "bd-x-leading-bd-team-q8",
          prompt: "Which hiring practices improve the odds of a good BD hire? (Select all that apply.)",
          options: [
            "A realistic role-play, such as a discovery call based on a real scenario",
            "A written exercise like a short proposal summary",
            "Checking how candidates handled losing deals",
            "Hiring mainly on confidence in the interview",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Work samples and how people learn from losses predict performance better than interview confidence, which is a weak signal.",
        },
        {
          id: "bd-x-leading-bd-team-q9",
          prompt: "How many skills should a coaching plan for one seller usually focus on at a time?",
          options: [
            "One or two",
            "Every skill where they are below average",
            "None; coaching should be general",
            "Ten, so progress is fast",
          ],
          correctIndex: 0,
          explanation:
            "Focus makes change achievable and measurable. Long lists of skills overwhelm, and little changes.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You lead a BD team of five. Priya consistently books the most meetings but has the lowest win rate (11% against a team average of 26%). Marco has a high win rate but creates little new pipeline. The CEO wants next quarter's forecast by Friday.",
        steps: [
          {
            id: "l1",
            question: "How do you start working out Priya's win-rate problem?",
            options: [
              "Review several of her recorded discovery calls and her lost-deal reasons to find where deals drop",
              "Tell her to close more deals",
              "Move her leads to Marco",
              "Lower her meeting target so she can focus",
            ],
            correctIndex: 0,
            explanation: "Diagnose with evidence first; the cause could be qualification, discovery or pricing, and each needs different coaching.",
          },
          {
            id: "l2",
            question:
              "The calls show she rarely asks about budget or decision process, so many of her deals were never really qualified. What coaching plan do you set?",
            options: [
              "Focus on one skill (qualification questions), role-play it, and review two of her calls each week for a month",
              "Send her on a general sales course",
              "Give her a script covering every stage",
              "Pair her with Marco for all deals permanently",
            ],
            correctIndex: 0,
            explanation: "A narrow focus with practice and follow-up on real calls is the most effective coaching pattern.",
          },
          {
            id: "l3",
            question:
              "For Friday's forecast, Priya has marked eight deals as 'commit'. Five have no confirmed decision process. What do you report?",
            options: [
              "Move unqualified deals to 'best case' or 'pipeline' and report the commit number backed by evidence, noting the risk",
              "Report all eight as commit to keep the number high",
              "Remove all of Priya's deals from the forecast",
              "Ask the CEO what number they want",
            ],
            correctIndex: 0,
            explanation: "Commit should reflect evidence, not hope; leadership plans hiring and cash from this number.",
          },
        ],
      },
    },
    {
      id: "bd-x-msa-sow-essentials",
      moduleId: "bd-expert",
      trackId: "bd",
      title: "Contract Essentials: MSAs, SOWs, Liability and Payment",
      summary:
        "This is not legal advice; involve counsel for any real contract. BD people do not draft contracts, but they shape them: what you promise in the proposal becomes scope, what you concede in negotiation becomes a clause, and a deal that looked profitable can be ruined by terms nobody on the BD side read.\n\nMost agency relationships use two layers. The master services agreement (MSA) sets the terms that apply to all work: payment terms, IP, confidentiality, warranties, limitation of liability, indemnities, data protection, termination, non-solicitation, governing law and dispute resolution. Each statement of work (SOW) describes a specific project: scope, deliverables, assumptions, timeline, acceptance criteria, fees and change control. The structure lets you negotiate the hard terms once and start new projects quickly, and an order-of-precedence clause says which document wins when they conflict.\n\nThe clauses that most often hurt agencies: unlimited liability (a common protection is a cap tied to fees paid, typically over the previous 12 months, with negotiated carve-outs); broad indemnities, for example covering any third-party claim rather than specific risks such as IP infringement; vague acceptance terms with no deadline, so a project is never 'accepted' and the final invoice is never due; long payment terms with no late-payment remedy; termination for convenience with no payment for work in progress; and scope written as outcomes ('a world-class app') rather than deliverables.\n\nThe trade-off is speed versus protection: accepting the client's paper quickly wins deals, and some risk is reasonable. The skill is knowing which clauses to escalate. The gotcha: BD often agrees terms in emails or proposals that contradict the MSA, and an entire-agreement clause may exclude them, or an order-of-precedence clause may let them override the contract. Keep commitments consistent and get counsel to review anything non-standard.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Cornell LII (Wex): Indemnity", url: "https://www.law.cornell.edu/wex/indemnity", kind: "docs" },
        { label: "UpCounsel: Master service agreement", url: "https://www.upcounsel.com/master-service-agreement", kind: "article" },
        { label: "UpCounsel: MSA for software development, key terms", url: "https://www.upcounsel.com/master-service-agreement-for-software-development", kind: "article" },
      ],
      video: {
        title: "Master Service Agreement (MSA) Explained in Simple Terms",
        channel: "Malcolm Zoppi | Corporate and M&A Solicitor",
        url: "https://www.youtube.com/watch?v=SyoXHjRR5KA",
        videoId: "SyoXHjRR5KA",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-x-msa-sow-essentials-q1",
          prompt: "What is the usual split between an MSA and an SOW?",
          options: [
            "The MSA sets terms for all work; each SOW defines one project's scope, deliverables, timeline and fees",
            "The SOW sets legal terms; the MSA lists features",
            "They are the same document with different names",
            "The MSA is only used for public-sector clients",
          ],
          correctIndex: 0,
          explanation:
            "Negotiating the hard terms once in the MSA lets each new project start with a short SOW.",
        },
        {
          id: "bd-x-msa-sow-essentials-q2",
          prompt: "Which clauses typically belong in the MSA rather than the SOW? (Select all that apply.)",
          options: [
            "Limitation of liability",
            "Confidentiality",
            "Governing law and dispute resolution",
            "This project's deliverables and acceptance criteria",
            "This project's sprint plan",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Relationship-wide legal terms live in the MSA. Project-specific deliverables, acceptance criteria and plans belong in the SOW.",
        },
        {
          id: "bd-x-msa-sow-essentials-q3",
          prompt:
            "A client's MSA gives the agency unlimited liability for any loss arising from the services. What is a common, reasonable counter-proposal to raise with counsel?",
          options: [
            "A cap tied to fees paid under the agreement (for example over the previous 12 months), with specific negotiated exceptions",
            "Accept it, since problems are unlikely",
            "Refuse any liability at all",
            "Double the price and accept it",
          ],
          correctIndex: 0,
          explanation:
            "Fee-based caps with agreed carve-outs are standard market practice. Unlimited liability can exceed the agency's whole value; zero liability is unrealistic for clients.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-msa-sow-essentials-q4",
          prompt:
            "The SOW says deliverables are accepted 'when the client is satisfied', with no time limit. Why is this a problem?",
          options: [
            "Acceptance can be withheld indefinitely, delaying final payment and the warranty start",
            "It is too generous to the agency",
            "It makes the contract void",
            "Clients never accept anything",
          ],
          correctIndex: 0,
          explanation:
            "Good acceptance clauses define objective criteria, a review period, and deemed acceptance if no defects are reported in time.",
        },
        {
          id: "bd-x-msa-sow-essentials-q5",
          prompt: "What does an indemnity clause do?",
          options: [
            "Requires one party to cover specified losses or third-party claims suffered by the other",
            "Sets the project's payment schedule",
            "Defines who owns the source code",
            "Limits how long the contract lasts",
          ],
          correctIndex: 0,
          explanation:
            "Indemnities shift specific risks, such as third-party IP claims, onto one party. Broad indemnities covering any claim are a major risk for agencies.",
        },
        {
          id: "bd-x-msa-sow-essentials-q6",
          prompt:
            "In an email during negotiation, a seller promised 'free bug fixes for 12 months'. The MSA's warranty is 90 days and has an entire-agreement clause. What is the risk?",
          options: [
            "Conflicting commitments create disputes; depending on the drafting the email may be excluded or argued to vary the deal, so commitments must be consistent and in the contract",
            "No risk, since emails are never relevant",
            "The MSA automatically becomes 12 months",
            "The client must pay for the extra nine months",
          ],
          correctIndex: 0,
          explanation:
            "Side promises that contradict the contract cause arguments whichever way they resolve. Keep commitments in the contract documents and consistent with each other.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-msa-sow-essentials-q7",
          prompt: "Which payment-term protections help an agency's cash flow? (Select all that apply.)",
          options: [
            "A mobilisation payment or milestone billing",
            "A late-payment remedy, such as interest or the right to pause work",
            "Payment for work in progress if the client terminates for convenience",
            "Payment only after the full project is accepted",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Upfront or staged payments, late-payment remedies and payment on termination protect cash. Payment only on final acceptance pushes all risk onto you.",
        },
        {
          id: "bd-x-msa-sow-essentials-q8",
          prompt: "Why is scope like 'a world-class, scalable app' a problem in an SOW?",
          options: [
            "It describes an outcome open to interpretation rather than verifiable deliverables, inviting scope disputes",
            "It is too short",
            "SOWs cannot mention apps",
            "Clients dislike positive language",
          ],
          correctIndex: 0,
          explanation:
            "Scope needs concrete deliverables, assumptions and exclusions. Subjective adjectives cannot be accepted or rejected objectively.",
        },
        {
          id: "bd-x-msa-sow-essentials-q9",
          prompt: "What does an order-of-precedence clause decide?",
          options: [
            "Which document wins if the MSA, SOW and other attachments conflict",
            "Which invoice is paid first",
            "Which party signs first",
            "The order of project phases",
          ],
          correctIndex: 0,
          explanation:
            "Precedence clauses resolve conflicts between contract documents; know which way yours runs before agreeing special terms in an SOW.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A seller wrote this summary of a client's MSA and SOW for internal sign-off and marked it 'standard, OK to sign'. Mark the points that should have been escalated to leadership and counsel. (This exercise is not legal advice.)",
        segments: [
          { id: "m1", text: "Governing law: England and Wales; disputes go to mediation first, then the courts.", issue: null },
          { id: "m2", text: "Payment: monthly in arrears, 30 days from invoice.", issue: null },
          { id: "m3", text: "Liability: the agency's liability is unlimited for all claims.", issue: "Unlimited liability is a major risk and should be capped, typically by reference to fees, with counsel." },
          { id: "m4", text: "Confidentiality: mutual, for five years after termination.", issue: null },
          { id: "m5", text: "IP: all IP, including the agency's pre-existing tools and libraries, transfers to the client on creation.", issue: "Transfers background IP the agency needs for other clients; it should be licensed, not assigned." },
          { id: "m6", text: "Acceptance: deliverables are accepted when the client confirms satisfaction; no time limit.", issue: "Open-ended acceptance can delay payment and warranty indefinitely." },
          { id: "m7", text: "Warranty: the agency will fix defects reported within 90 days of acceptance.", issue: null },
          { id: "m8", text: "Termination: either party may terminate for convenience with 30 days' notice.", issue: null },
          { id: "m9", text: "On termination for convenience, the client pays nothing for work in progress.", issue: "The agency bears the cost of work done; it should be paid for work completed up to termination." },
          { id: "m10", text: "Non-solicitation: neither party will hire the other's staff during the contract and for 12 months after.", issue: null },
          { id: "m11", text: "Data protection: a data processing agreement is attached as Schedule 2.", issue: null },
          { id: "m12", text: "Order of precedence: the SOW prevails over the MSA for project-specific terms.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "bd-x-nda-ip-clauses",
      moduleId: "bd-expert",
      trackId: "bd",
      title: "Contract Essentials: NDAs and IP Ownership",
      summary:
        "This is not legal advice; involve counsel, and note that the law differs by jurisdiction. Two clauses come up in almost every agency deal before price is even discussed: the NDA that a prospect asks you to sign before sharing details, and the IP terms that decide who owns what you build.\n\nAn NDA protects information shared during discovery and delivery. Check whether it is mutual (both sides protected; you will share pricing, methods and team details too) or one-way; how 'confidential information' is defined; the standard exclusions (information that is already public, already known to you, independently developed, or received lawfully from someone else); how long obligations last; who inside your company may see it; and whether it quietly includes other terms such as non-solicitation or non-compete. Overly broad NDAs can restrict you from working with the client's competitors, which matters for an agency focused on a vertical.\n\nIP ownership is where agencies most often give away their business. The useful distinction is background IP (what you owned before: your platform, libraries, templates, know-how) versus foreground IP (what you create specifically for this client). A common, balanced position is that the client owns, or receives an assignment of, the foreground deliverables on payment, while the agency keeps its background IP and grants the client a licence to use it within the deliverable. Watch for assignment 'on creation' rather than on payment, which removes your leverage if invoices go unpaid.\n\nThe legal mechanics differ by country. In the US, software written by an independent contractor is generally not a 'work made for hire' unless it falls into specific statutory categories with a written agreement, so contracts rely on an explicit assignment. In the UK, the author of commissioned work generally owns the copyright unless it is assigned in writing. Open-source components carry their own licences, and the copyright status of purely AI-generated code is unsettled (in the US, protection requires human authorship), which clients increasingly ask about.",
      level: "expert",
      estMinutes: 50,
      webRefs: [
        { label: "US Copyright Office Circular 30: Works made for hire (PDF)", url: "https://www.copyright.gov/circs/circ30.pdf", kind: "spec" },
        { label: "Cornell LII (Wex): Work made for hire", url: "https://www.law.cornell.edu/wex/work_made_for_hire", kind: "docs" },
        { label: "GOV.UK: Intellectual property, an overview", url: "https://www.gov.uk/intellectual-property-an-overview", kind: "docs" },
        { label: "UpCounsel: IP ownership clause in contracts", url: "https://www.upcounsel.com/ip-ownership-clause", kind: "article" },
      ],
      video: {
        title: "How to draft a NON-DISCLOSURE AGREEMENT [NDA] | Rohit Pradhan",
        channel: "Rohit Pradhan - Attorney at Law",
        url: "https://www.youtube.com/watch?v=utPDC4eUnEQ",
        videoId: "utPDC4eUnEQ",
      },
      alternateVideos: [
        {
          title: "What Is Work for Hire? (Who Owns the Copyright Explained)! Lawyer Edition!",
          channel: "Entertainment Lawyer",
          url: "https://www.youtube.com/watch?v=06TtpOvcEeo",
          videoId: "06TtpOvcEeo",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-x-nda-ip-clauses-q1",
          prompt: "Which are standard exclusions from 'confidential information' in an NDA? (Select all that apply.)",
          options: [
            "Information that is or becomes public through no fault of the recipient",
            "Information the recipient already knew before disclosure",
            "Information the recipient develops independently",
            "Anything the recipient finds commercially useful",
            "Everything shared after the first month",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Public, previously known and independently developed information are classic exclusions (along with information lawfully received from a third party). Usefulness and timing are not exclusions.",
        },
        {
          id: "bd-x-nda-ip-clauses-q2",
          prompt: "Why does an agency usually prefer a mutual NDA in discovery?",
          options: [
            "The agency also shares confidential material, such as pricing, methods and team details, that deserves protection",
            "Mutual NDAs are shorter",
            "One-way NDAs are not enforceable",
            "It removes the need for an MSA",
          ],
          correctIndex: 0,
          explanation:
            "Information flows both ways in discovery and proposals. A one-way NDA protects only the client.",
        },
        {
          id: "bd-x-nda-ip-clauses-q3",
          prompt:
            "A prospect's 'standard NDA' includes a clause preventing you from working with any company in their industry for three years. What should you do?",
          options: [
            "Flag it to leadership and counsel: it is a non-compete inside an NDA and could block your vertical strategy",
            "Sign it, since NDAs are always standard",
            "Ignore it, since non-competes are never enforceable",
            "Cross it out yourself and sign",
          ],
          correctIndex: 0,
          explanation:
            "Restrictive covenants hidden in NDAs can do real damage to an agency focused on a sector. Enforceability varies, so get advice rather than assuming.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-nda-ip-clauses-q4",
          prompt: "What is the difference between background and foreground IP?",
          options: [
            "Background IP existed before the project (your platform, libraries); foreground IP is created specifically for this client",
            "Background IP is open source; foreground IP is proprietary",
            "Background IP belongs to the client; foreground IP belongs to the agency",
            "They are legal synonyms",
          ],
          correctIndex: 0,
          explanation:
            "The distinction lets the client own what was made for them while the agency keeps the reusable assets its business depends on.",
        },
        {
          id: "bd-x-nda-ip-clauses-q5",
          prompt: "Under US law, is custom software written by an independent contractor agency automatically a 'work made for hire' owned by the client?",
          options: [
            "Generally no: outside employment, only specific statutory categories qualify with a written agreement, so contracts use an explicit assignment",
            "Yes, always, once the client pays",
            "Yes, if the client provided the idea",
            "No, software can never be assigned",
          ],
          correctIndex: 0,
          explanation:
            "Circular 30 explains that commissioned works are made for hire only in listed categories with a written agreement, and software typically relies on an assignment instead. Paying or supplying the idea does not transfer copyright by itself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-nda-ip-clauses-q6",
          prompt: "Why might an agency prefer IP to transfer 'on full payment' rather than 'on creation'?",
          options: [
            "It keeps leverage if invoices go unpaid, since the client does not own the work until it has paid for it",
            "Because IP cannot legally transfer on creation",
            "It lets the agency resell the client's custom work",
            "It shortens the project",
          ],
          correctIndex: 0,
          explanation:
            "Transfer on payment aligns ownership with payment. It does not entitle the agency to resell client-specific work.",
        },
        {
          id: "bd-x-nda-ip-clauses-q7",
          prompt:
            "In the UK, who generally owns the copyright in code a contractor writes for a client when the contract says nothing about IP?",
          options: [
            "The contractor (the author), unless the copyright is assigned in writing",
            "The client, automatically",
            "Both jointly by default",
            "Nobody until it is registered",
          ],
          correctIndex: 0,
          explanation:
            "Commissioning and paying for work does not transfer copyright by itself; an employee's work belongs to the employer, but a contractor's needs a written assignment. Copyright in the UK does not require registration.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-nda-ip-clauses-q8",
          prompt: "Which IP topics are clients increasingly asking agencies about? (Select all that apply.)",
          options: [
            "Open-source components and their licence obligations",
            "Use of AI coding tools and the ownership status of AI-generated code",
            "Licences for any agency background IP embedded in the deliverable",
            "The agency's office lease",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Open source, AI-generated code and embedded background IP all affect what the client really owns and can use. Your lease is irrelevant.",
        },
        {
          id: "bd-x-nda-ip-clauses-q9",
          prompt: "Why should BD involve counsel rather than negotiate IP and NDA terms alone?",
          options: [
            "The terms carry long-term legal and business consequences, and the law differs by jurisdiction",
            "BD is not allowed to read contracts",
            "Lawyers can guarantee the deal closes",
            "Counsel sets the price",
          ],
          correctIndex: 0,
          explanation:
            "BD should understand the issues well enough to spot them and explain the business stakes, then let counsel handle the legal drafting.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write a short internal note to your head of BD and legal counsel flagging the NDA and IP terms below that need review before you sign. For each issue, say why it matters to the agency's business and what position you would like counsel to consider. Do not draft legal wording.",
        context:
          "Prospect: a logistics software company that wants a white-labelled driver app built on your agency's existing delivery-app platform. Their documents say: (1) a one-way NDA protecting only their information, which also bars you from working with any logistics company for 3 years; (2) 'All IP created or used in the services, including any pre-existing materials, vests in the client on creation'; (3) no mention of open-source components; (4) the client may 'use, modify and resell' the deliverables without restriction. Your agency's growth plan targets logistics as a key vertical.",
        wordLimit: 300,
        rubric: [
          { id: "nda", label: "Flags the NDA problems", description: "Notes it is one-way (your pricing and methods unprotected) and that the 3-year industry restriction conflicts with the logistics vertical strategy.", weight: 1.5 },
          { id: "bg", label: "Protects background IP", description: "Identifies that the IP clause would transfer the agency's platform, and suggests licensing background IP while assigning client-specific work.", weight: 1.5 },
          { id: "timing", label: "Transfer timing", description: "Raises transfer 'on creation' versus on payment.", weight: 0.5 },
          { id: "resale", label: "Resale and open source", description: "Notes that unrestricted resale of a deliverable containing your platform is a risk, and that open-source licensing should be addressed.", weight: 1 },
          { id: "role", label: "Stays in role", description: "Explains business impact and desired positions without drafting legal wording or claiming legal certainty; defers to counsel.", weight: 0.5 },
        ],
        sampleAnswer:
          "Subject: NDA and IP terms for review before signing (logistics driver app)\n\nThese terms need counsel's review before we sign. My concerns are business ones; please advise on the legal position.\n\n1. One-way NDA. Only their information is protected, but we will share our pricing, platform architecture and methods. We would like a mutual NDA.\n2. Three-year logistics restriction in the NDA. This is effectively a non-compete, and logistics is our target vertical for next year. We would like it removed, or narrowed to not using their confidential information.\n3. IP 'created or used, including pre-existing materials, vests on creation'. This would transfer ownership of our delivery-app platform, which we license to other clients. Preferred position: we keep the platform and other background IP and grant them a licence to use it within the deliverable; they own the client-specific work.\n4. Transfer timing. We would like ownership of the client-specific work to pass on payment, not on creation.\n5. Unrestricted 'use, modify and resell'. Because the app runs on our platform, unrestricted resale could let them sell our platform to others. We would like resale limited to their own white-label customers, on agreed licence terms.\n6. Open source. The documents say nothing about it. We should state that open-source components remain under their own licences and provide a list.\n\nThis note is not legal advice; counsel to confirm positions and wording.",
      },
    },
  ],
} satisfies Module;
