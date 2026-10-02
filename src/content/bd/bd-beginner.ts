import type { Module } from "@/types/curriculum";

export default {
  id: "bd-beginner",
  trackId: "bd",
  name: "BD Foundations",
  description:
    "The groundwork for agency business development: what an AI and app agency actually sells, who it sells to, where leads come from, how to keep the CRM honest, how to reach people by email and LinkedIn, and enough technical and estimation literacy to talk to clients and engineers without overpromising.",
  refs: [
    { label: "HubSpot: Ideal customer profile template", url: "https://www.hubspot.com/make-my-persona/ideal-customer-profile-template", kind: "docs" },
    { label: "FTC: CAN-SPAM Act compliance guide", url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business", kind: "spec" },
    { label: "Digital.gov: Plain language guide series", url: "https://digital.gov/guides/plain-language", kind: "docs" },
  ],
  topics: [
    // ------------------------------------------------------------------
    {
      id: "bd-b-agency-offerings",
      moduleId: "bd-beginner",
      trackId: "bd",
      title: "Agency Services & Offerings: AI Platforms and White-Label Apps",
      summary:
        "An AI and app agency usually sells a handful of distinct things that buyers lump together as 'build me an app': discovery and prototyping (a short paid phase that turns an idea into a scoped plan), custom builds (web, mobile and AI platforms designed for one client), white-label products (a working base product the agency rebrands and customises, so the client launches faster), and ongoing work (maintenance, hosting, model and feature updates, or a dedicated team). Each has a different risk profile, price shape and sales motion, and BD's first job is to steer the prospect to the one that matches their budget, deadline and appetite for uniqueness.\n\nWhite-label is faster and cheaper because the core flows already exist, but the client trades away some differentiation and inherits the base product's constraints. Custom work buys exactly what the client wants at the price of time and estimation risk. AI features add a third dimension: their quality is probabilistic and their running cost scales with usage (model providers bill per token), so an AI platform is never a one-off purchase. Saying this early builds trust; hiding it creates a painful conversation at the first invoice.\n\nThe common gotcha is selling the offering the prospect named rather than the one they need: 'we want our own ChatGPT' is usually a request for a narrow assistant over their own data, best started as a paid proof of concept, not a model trained from scratch.\n\n> **Oyelabs specifics (admin to fill in):** our current service lines, flagship case studies and white-label products.",
      level: "beginner",
      estMinutes: 35,
      webRefs: [
        { label: "Claude Docs: Pricing (how model usage is billed)", url: "https://platform.claude.com/docs/en/about-claude/pricing", kind: "docs" },
        { label: "Upwork: Software development outsourcing guide", url: "https://www.upwork.com/resources/software-development-outsourcing", kind: "article" },
        { label: "AWS: What is generative AI?", url: "https://aws.amazon.com/what-is/generative-ai/", kind: "article" },
        { label: "Clutch: Top custom software development companies", url: "https://clutch.co/developers", kind: "article" },
      ],
      video: {
        title: "Get High Paying Clients As A Custom Software Agency? 5 Strategies That ACTUALLY Work",
        channel: "Kieran Moloney",
        url: "https://www.youtube.com/watch?v=pMOT-RMpdDU",
        videoId: "pMOT-RMpdDU",
      },
      alternateVideos: [
        {
          title: "How to Sell Software to Businesses",
          channel: "Sales Scripter",
          url: "https://www.youtube.com/watch?v=1xpuMOn7pCk",
          videoId: "1xpuMOn7pCk",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-b-agency-offerings-q1",
          prompt:
            "A logistics company emails: 'We want our own ChatGPT for the support team.' They have three years of support tickets and no in-house engineers. What should BD propose first?",
          options: [
            "A short paid discovery and proof of concept that tests an assistant on their real tickets",
            "A fixed-price quote for training a large language model from scratch",
            "A white-label chatbot shipped next week with no discovery, since support bots are all alike",
            "A five-person dedicated team starting immediately on an open-ended contract",
          ],
          correctIndex: 0,
          explanation:
            "The real need is usually an assistant over their own data, and its accuracy on their tickets is unknown until tested, so a paid proof of concept de-risks it for both sides. Training a model from scratch is wildly out of proportion, and skipping discovery hides the accuracy question until it is expensive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-agency-offerings-q2",
          prompt: "What does 'white-label app' mean in an agency's offering?",
          options: [
            "An existing product the agency customises and rebrands so the client launches it under their own brand",
            "An app built from an empty repository for one client",
            "An app released without any brand so it can be resold freely",
            "Open-source code handed to the client with no customisation",
          ],
          correctIndex: 0,
          explanation:
            "White-label means a working base product, rebranded and configured for the client. A from-scratch build is custom work, and white-label products still carry the client's brand.",
        },
        {
          id: "bd-b-agency-offerings-q3",
          prompt: "Which costs continue after an AI-powered platform goes live? (Select all that apply.)",
          options: [
            "Model API usage, billed by the provider per token processed",
            "Hosting and infrastructure for the app and its data",
            "Maintenance as model versions are retired and prompts need re-testing",
            "None, because the build fee covers all future model calls",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Usage-based model costs, hosting and ongoing upkeep all recur. A build fee pays for the build; it cannot prepay an unknown volume of future model calls.",
        },
        {
          id: "bd-b-agency-offerings-q4",
          prompt:
            "A client wants a delivery app live in eight weeks on a modest budget, and also wants a dispatch algorithm nobody else has. What is the honest framing?",
          options: [
            "Use a white-label base for the standard flows and scope the custom algorithm as a separate, separately priced module with its own timeline risk",
            "Promise both inside eight weeks, since white-label makes everything faster",
            "Refuse the project because white-label and custom work cannot be combined",
            "Quote a full custom build and keep the eight-week date",
          ],
          correctIndex: 0,
          explanation:
            "Splitting the commodity flows from the genuinely novel part keeps the fast path fast and makes the risky part visible and priced. Promising both in eight weeks, or a full custom build on that date, sets the project up to miss.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-agency-offerings-q5",
          prompt: "How should BD describe the quality of an AI feature to a non-technical buyer?",
          options: [
            "Its output is probabilistic, so discovery agrees an acceptable accuracy level and a human fallback for when it is wrong",
            "Once it is trained it is deterministic, so it gives the same right answer every time",
            "It will be 100% accurate as long as the client provides clean data",
            "Accuracy cannot be discussed until after launch",
          ],
          correctIndex: 0,
          explanation:
            "Model output varies and can be wrong, so the deal should define what 'good enough' means and what happens when it is not. Promising perfect accuracy, or refusing to discuss it, both end in a dispute.",
        },
        {
          id: "bd-b-agency-offerings-q6",
          prompt: "Why do many buyers check an agency's Clutch profile before a first call?",
          options: [
            "It shows reviews from past clients, which the agency cannot simply write itself",
            "It lists the agency's exact internal costs",
            "It guarantees the agency will deliver on time",
            "It replaces the need for a discovery call",
          ],
          correctIndex: 0,
          explanation:
            "Third-party reviews are social proof the buyer trusts more than the agency's own site. They do not reveal costs or guarantee delivery.",
        },
        {
          id: "bd-b-agency-offerings-q7",
          prompt:
            "On a first call the prospect asks, 'Have you built exactly this before?' The agency has built similar AI search tools but never for their industry. What is the best answer?",
          options: [
            "Say no, describe the closest comparable work, and explain how a short discovery phase reduces the industry-specific risk",
            "Say yes, because the technology is the same",
            "Change the subject to the agency's pricing",
            "Say no and suggest they find a specialist instead",
          ],
          correctIndex: 0,
          explanation:
            "Honest adjacency plus a risk-reduction plan is credible and checkable. Claiming experience you lack falls apart at the reference check, and giving up ignores real transferable experience.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "An inbound lead fills in the contact form: a regional gym chain (14 sites) wants 'an app with AI' so members can book classes and get workout plans. Budget 'around $30k', launch 'before January', which is four months away. No technical staff.",
        steps: [
          {
            id: "s1",
            question: "Which offering do you lead with on the first call?",
            options: [
              "A white-label booking app, with the AI workout-plan feature scoped as a separate add-on",
              "A fully custom platform, because the client said 'AI'",
              "A dedicated team on a monthly retainer with no defined scope",
              "A model trained from scratch on fitness data",
            ],
            correctIndex: 0,
            explanation: "Class booking is a commodity flow, so a white-label base fits the budget and date; the AI feature is the uncertain part and should be scoped on its own.",
          },
          {
            id: "s2",
            question: "The prospect asks whether the AI plans will 'always be right'. What do you say?",
            options: [
              "No: we will agree what good looks like, add safety limits and a coach-review option, and test it on real member profiles first",
              "Yes, AI is reliable now",
              "We cannot discuss that until the contract is signed",
              "It depends entirely on the members typing correctly",
            ],
            correctIndex: 0,
            explanation: "Fitness advice has a safety angle, so the honest answer pairs probabilistic quality with guardrails and human review.",
          },
          {
            id: "s3",
            question: "They ask what the app will cost per month after launch. What is the right framing?",
            options: [
              "Hosting and maintenance plus model usage that grows with how many plans members generate, which we will estimate from expected usage",
              "Nothing, it is a one-off build",
              "A flat fee that never changes regardless of usage",
              "We will tell you after the first invoice arrives",
            ],
            correctIndex: 0,
            explanation: "AI features have usage-based running costs; estimating them from expected volume up front avoids a surprise later.",
          },
        ],
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-b-icp-personas",
      moduleId: "bd-beginner",
      trackId: "bd",
      title: "Ideal Customer Profile (ICP) & Buyer Personas",
      summary:
        "An ideal customer profile describes the *company* most likely to buy, succeed and pay well: industry, size, funding or revenue stage, geography, existing tech, and the trigger that makes them buy now (a new funding round, a manual process that broke at scale, a competitor shipping AI). A buyer persona describes the *people* inside that company: the founder who signs, the operations lead who feels the pain, the in-house engineer who will veto a weak architecture. You need both: the ICP tells you which accounts to spend time on, personas tell you what to say to each person in them.\n\nThe strongest ICPs come from your own closed-won deals, weighted by margin and how smoothly delivery went, not by logo size or by the market you wish you served. Write a negative ICP too: the profiles that look attractive but lose money (no budget owner, 'AI' as a buzzword with no data to work with, a fixed date with an open scope). For an agency selling AI platforms, a useful fit signal is data readiness: a prospect with the documents, tickets or transactions an AI feature needs is far more likely to get a working result than one starting from nothing.\n\nThe gotcha is letting the ICP go stale. Personas built from guesses, or an ICP never revisited after the market shifts, quietly push the team toward leads that consume Connects, calls and proposals and never close.",
      level: "beginner",
      estMinutes: 35,
      webRefs: [
        { label: "HubSpot: Ideal customer profile template", url: "https://www.hubspot.com/make-my-persona/ideal-customer-profile-template", kind: "docs" },
        { label: "Gong: What is an ICP for sales?", url: "https://www.gong.io/blog/icp-sales", kind: "article" },
        { label: "HubSpot: Buyer persona research", url: "https://blog.hubspot.com/marketing/buyer-persona-research", kind: "article" },
        { label: "Nielsen Norman Group: Personas", url: "https://www.nngroup.com/articles/persona/", kind: "article" },
      ],
      video: {
        title: "How to Define Your Ideal Customer Profile (ICP)",
        channel: "HubSpot Marketing",
        url: "https://www.youtube.com/watch?v=WOVhHWR5B3E",
        videoId: "WOVhHWR5B3E",
      },
      alternateVideos: [
        {
          title: "How To Create a Buyer Persona (FREE Template)",
          channel: "HubSpot Marketing",
          url: "https://www.youtube.com/watch?v=v6EWN4EjHM0",
          videoId: "v6EWN4EjHM0",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-b-icp-personas-q1",
          prompt: "What is the difference between an ICP and a buyer persona?",
          options: [
            "The ICP describes the best-fit company; a persona describes a person involved in buying within it",
            "They are two names for the same document",
            "The ICP describes one person; a persona describes the market as a whole",
            "The ICP is for marketing only; personas are for sales only",
          ],
          correctIndex: 0,
          explanation: "ICP is account-level fit, personas are people-level motivations. Both teams use both.",
        },
        {
          id: "bd-b-icp-personas-q2",
          prompt: "Which data should the agency's ICP be built from first?",
          options: [
            "Closed-won deals, weighted by margin and how smoothly delivery went",
            "The biggest logos the team would like to win",
            "Whichever industries competitors list on their websites",
            "Every lead that ever filled in the contact form",
          ],
          correctIndex: 0,
          explanation: "Your own profitable wins show who really buys and succeeds with you. Aspirational logos and raw form fills include lots of poor fits.",
        },
        {
          id: "bd-b-icp-personas-q3",
          prompt: "Which are useful ICP signals for an agency that sells AI-powered platforms? (Select all that apply.)",
          options: [
            "The prospect already has the documents, tickets or transaction data the AI feature would use",
            "A recent trigger such as a funding round or a manual process that broke at scale",
            "A named person who owns the budget for the project",
            "The prospect used the word 'AI' on its homepage",
            "The prospect has the largest headcount in its sector",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Data readiness, a buying trigger and a budget owner all predict a deal that closes and delivers. A buzzword on a homepage and raw headcount say little about fit.",
        },
        {
          id: "bd-b-icp-personas-q4",
          prompt:
            "Last year the team's biggest-revenue clients were enterprise banks, but every bank project ran over budget and two ended in disputes. Funded SaaS startups were smaller but profitable. How should that shape the ICP?",
          options: [
            "Weight the ICP toward the funded startups and treat large banks as a cautious segment until delivery is fixed",
            "Focus only on banks because they bring the most revenue",
            "Ignore delivery outcomes, because the ICP is a sales tool",
            "Drop the ICP and take every lead",
          ],
          correctIndex: 0,
          explanation:
            "Revenue that comes with overruns and disputes can lose money. An ICP should favour deals that are profitable and deliverable, not just large.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-icp-personas-q5",
          prompt: "Why write a negative ICP?",
          options: [
            "To name the profiles that look attractive but consistently lose money or never close, so the team stops chasing them",
            "To list competitors the team should never mention",
            "To record clients who complained, for legal reasons",
            "To give marketing a list of industries to advertise to",
          ],
          correctIndex: 0,
          explanation: "A negative ICP saves time by ruling out known bad fits early; it is not a complaints log or an ad plan.",
        },
        {
          id: "bd-b-icp-personas-q6",
          prompt:
            "A deal stalls after a great call with the founder. The prospect's in-house lead engineer was never involved and now says the proposed architecture 'won't fit our stack'. What persona gap caused this?",
          options: [
            "The technical evaluator, who can block a deal, was never identified or addressed",
            "The economic buyer was missing",
            "The ICP was wrong about company size",
            "The founder was not really the decision-maker",
          ],
          correctIndex: 0,
          explanation:
            "Agency deals often have a technical evaluator with veto power. Mapping that persona early, and giving them the technical detail they need, prevents late blocks.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-icp-personas-q7",
          prompt: "Which persona description is most useful to a BD rep?",
          options: [
            "Operations manager at a 50-200 person logistics firm; measured on order errors; worried a new tool will disrupt the warehouse team",
            "Male, 35-45, likes technology",
            "Anyone with a budget",
            "Decision-maker at a company",
          ],
          correctIndex: 0,
          explanation: "Useful personas capture role, goals, how they are measured and their fears, which tells you what to say. Demographics alone and vague labels do not.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "Your ICP: funded or revenue-generating B2B companies (20-300 staff) in the US, UK or EU, with an operational process they want to automate with AI, data already available, and a named budget owner. Rank these inbound leads from best to worst ICP fit.",
        items: [
          { id: "a", label: "UK insurance broker, 120 staff, wants AI to summarise 10 years of claim files; COO owns the budget" },
          { id: "b", label: "US SaaS startup, 40 staff, Series A, wants AI triage of support tickets; has 2 years of tickets; CTO is evaluating, budget owner not yet named" },
          { id: "c", label: "EU e-commerce brand, 60 staff, wants a mobile app 'with some AI later'; no data identified; founder owns the budget" },
          { id: "d", label: "Solo founder with an idea for 'Uber for pets', no funding, wants equity-only work" },
          { id: "e", label: "Global bank, 80,000 staff, wants an innovation-lab chatbot; procurement says the decision is next year" },
        ],
        correctOrder: ["a", "b", "c", "e", "d"],
        explanation:
          "The broker matches every criterion. The SaaS startup fits well but has no confirmed budget owner yet. The e-commerce brand is in range but the AI need and data are vague. The bank is outside the size band with a slow, uncertain decision. The solo founder fails funding, budget and size.",
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-b-lead-sources",
      moduleId: "bd-beginner",
      trackId: "bd",
      title: "Lead Sources: Upwork, LinkedIn, Clutch, Referrals & Inbound",
      summary:
        "An agency's pipeline comes from a few channels with very different economics. Marketplaces such as Upwork offer constant demand with a stated budget, but you compete on visible terms against many bidders, pay to apply, and the platform owns the relationship. Outbound (LinkedIn, Sales Navigator searches, cold email) lets you choose exactly who you talk to, but it is slow and the hit rate is low until messaging is sharp. Directories such as Clutch bring buyers who are actively comparing agencies and trust verified reviews. Referrals and repeat clients close fastest and at the best prices because trust arrives with the lead. Inbound from content and the website compounds slowly, then becomes the cheapest source of all.\n\nThe mistake is judging channels by lead volume. Measure each one by cost per *won* deal, average deal size, margin and sales-cycle length: a channel with a cheap cost per win but tiny projects can be worse than an expensive one that lands six-figure platforms. Early-stage agencies usually lean on marketplaces and referrals; mature ones deliberately build outbound and inbound so they are not dependent on one platform's algorithm or fee changes.\n\nA second gotcha: every channel has its own rules. Marketplaces generally forbid taking a client off-platform to avoid fees, LinkedIn restricts automation, and cold email is governed by anti-spam law. Breaking those rules can cost the whole channel, not just one deal.",
      level: "beginner",
      estMinutes: 40,
      webRefs: [
        { label: "LinkedIn Sales Navigator", url: "https://business.linkedin.com/sell/sales-navigator", kind: "docs" },
        { label: "Upwork Help Center", url: "https://support.upwork.com/hc/en-us", kind: "docs" },
        { label: "Gong: Inbound vs outbound sales", url: "https://www.gong.io/blog/inbound-vs-outbound-sales", kind: "article" },
        { label: "HubSpot: How 347 SMB salespeople generate their best leads", url: "https://blog.hubspot.com/sales/how-small-business-salespeople-generate-their-best-leads", kind: "article" },
      ],
      video: {
        title: "How to generate B2B leads from Clutch",
        channel: "Belkins",
        url: "https://www.youtube.com/watch?v=B80ON8VhK2Y",
        videoId: "B80ON8VhK2Y",
      },
      alternateVideos: [
        {
          title: "Meet Clutch - B2B Ratings and Reviews",
          channel: "Clutch.co",
          url: "https://www.youtube.com/watch?v=9T6oFuTYR5k",
          videoId: "9T6oFuTYR5k",
        },
        {
          title: "How to Get Your First 10 Customers",
          channel: "Y Combinator",
          url: "https://www.youtube.com/watch?v=_FBivfgOvuE",
          videoId: "_FBivfgOvuE",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-b-lead-sources-q1",
          prompt: "Which metric best compares lead channels for an agency?",
          options: [
            "Cost per won deal, alongside deal size and margin",
            "Number of leads per month",
            "Number of profile views",
            "Number of messages sent",
          ],
          correctIndex: 0,
          explanation: "Volume metrics reward noise. What matters is what it costs to win a deal and how valuable that deal is.",
        },
        {
          id: "bd-b-lead-sources-q2",
          prompt: "Why do referrals typically close faster than cold outbound leads?",
          options: [
            "Trust is transferred from the person who made the introduction",
            "Referred clients never ask about price",
            "Referrals skip the proposal stage by rule",
            "Referred clients have larger budgets by definition",
          ],
          correctIndex: 0,
          explanation: "A trusted introduction removes much of the credibility work. Referred clients still negotiate and still need proposals.",
        },
        {
          id: "bd-b-lead-sources-q3",
          prompt: "Which are real trade-offs of relying mainly on a freelance marketplace such as Upwork? (Select all that apply.)",
          options: [
            "You compete against many bidders on visible terms",
            "The platform's fees, rules and ranking changes affect your pipeline directly",
            "You pay to submit proposals, win or lose",
            "Marketplace clients never have real budgets",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Competition, platform dependence and the cost of applying are all real. Plenty of marketplace clients have serious budgets; the trade-off is control, not budget.",
        },
        {
          id: "bd-b-lead-sources-q4",
          prompt:
            "After a successful Upwork project, the client suggests moving the next phase off-platform 'to save us both the fees'. What is the right response?",
          options: [
            "Decline and keep the work on the platform, because marketplace terms generally prohibit moving a client off-platform to avoid fees, and breaking them risks the account",
            "Agree, since the client suggested it",
            "Agree but only invoice half the work outside the platform",
            "Ignore the question and keep working",
          ],
          correctIndex: 0,
          explanation:
            "Marketplaces protect their fees with terms of service, and an account suspension would cost the whole channel. Check the platform's own rules (some offer a paid conversion route) rather than quietly moving the client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-lead-sources-q5",
          prompt: "What makes a directory like Clutch a distinctive lead source?",
          options: [
            "Buyers there are actively comparing agencies and lean on verified client reviews",
            "It sends leads that are already signed contracts",
            "It is free of competition",
            "It works without any reviews or profile",
          ],
          correctIndex: 0,
          explanation: "Directory leads are high intent but comparison-shopping, so reviews and a clear specialism decide who gets the call.",
        },
        {
          id: "bd-b-lead-sources-q6",
          prompt:
            "Channel A wins deals at $300 each, averaging $6,000 per project. Channel B wins at $2,000 each, averaging $60,000 per project. Same margin. Which statement is right?",
          options: [
            "Channel B returns more revenue per dollar spent, despite the higher cost per win",
            "Channel A is better because its cost per win is lower",
            "They are equal because both are profitable",
            "You cannot compare channels with different deal sizes",
          ],
          correctIndex: 0,
          explanation:
            "A returns $20 of revenue per $1 spent; B returns $30. Cost per win alone hides deal size.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Last quarter's numbers per channel are below. 'Cost' includes paid tools, Connects and the BD time spent on that channel. Work out the cost per won deal for each channel, then revenue per dollar spent for Upwork and for outbound.",
        table: {
          columns: ["Channel", "Cost ($)", "Leads", "Deals won", "Avg deal size ($)"],
          rows: [
            ["Upwork", "1,200", "60 proposals", "3", "8,000"],
            ["LinkedIn + email outbound", "3,000", "12 meetings", "2", "40,000"],
            ["Referrals", "300", "4 intros", "2", "25,000"],
          ],
        },
        fields: [
          { id: "cpw-upwork", label: "Cost per won deal, Upwork", unit: "$", answer: 400, tolerance: 1 },
          { id: "cpw-outbound", label: "Cost per won deal, outbound", unit: "$", answer: 1500, tolerance: 1 },
          { id: "cpw-referral", label: "Cost per won deal, referrals", unit: "$", answer: 150, tolerance: 1 },
          { id: "rpd-upwork", label: "Revenue per $1 spent, Upwork", unit: "$", answer: 20, tolerance: 0.05 },
          { id: "rpd-outbound", label: "Revenue per $1 spent, outbound", unit: "$", answer: 26.67, tolerance: 0.05 },
        ],
        explanation:
          "Cost per win = cost / deals won (1,200/3, 3,000/2, 300/2). Revenue per dollar = deals x deal size / cost: Upwork 24,000/1,200 = 20; outbound 80,000/3,000 = 26.67. Outbound looks expensive per win but returns more per dollar, and referrals beat both, which is why agencies invest in them.",
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-b-crm-hygiene",
      moduleId: "bd-beginner",
      trackId: "bd",
      title: "CRM Hygiene: Records, Stages & Next Steps",
      summary:
        "A CRM is only as useful as the data people put in it. Forecasts, handovers to delivery, follow-up reminders and win/loss analysis all read from the same records, so a deal with a stale stage, no next step or a guessed close date quietly corrupts every report built on it. Hygiene is a set of small habits: one record per company and contact (deduplicate rather than create), deal stages defined by what the *buyer* has done (attended discovery, received a proposal, verbally agreed) rather than what the rep hopes, a dated next step on every open deal, and notes written so a colleague could pick up the account tomorrow.\n\nThe trade-off is time: every required field slows reps down, and too many lead to junk values typed to get past validation. Require the few fields that drive decisions (amount, stage, close date, next step, lead source) and automate the rest (email logging, meeting sync, enrichment). For agencies, two fields matter more than usual: lead source, so you can compute cost per win by channel, and the scope assumptions captured during discovery, so delivery inherits what was promised.\n\nThe gotcha is the 'happy ears' pipeline: deals left open for months because closing them as lost feels like failure. A dead deal marked open inflates the forecast and hides the real conversion rate; close it as lost with a reason, and reopen it if the buyer comes back.",
      level: "beginner",
      estMinutes: 35,
      webRefs: [
        { label: "Salesforce Trailhead: Data hygiene best practices", url: "https://trailhead.salesforce.com/content/learn/modules/marketing-cloud-account-optimization/clean-your-data", kind: "docs" },
        { label: "HubSpot Knowledge Base: Deduplicate records", url: "https://knowledge.hubspot.com/records/deduplication-of-records", kind: "docs" },
        { label: "HubSpot Knowledge Base: Set up and manage object pipelines", url: "https://knowledge.hubspot.com/object-settings/set-up-and-customize-pipelines", kind: "docs" },
        { label: "Salesforce: What is dirty data?", url: "https://www.salesforce.com/blog/sales/sales-ops-accurate-crm-data/", kind: "article" },
      ],
      video: {
        title: "The Official HubSpot Sales Hub Tutorial",
        channel: "HubSpot Academy",
        url: "https://www.youtube.com/watch?v=tRpOCQ15L7M",
        videoId: "tRpOCQ15L7M",
      },
      alternateVideos: [
        {
          title: "What Is CRM? | Introduction To CRM Software| CRM Projects For Beginners | CRM 2022 | Simplilearn",
          channel: "Simplilearn",
          url: "https://www.youtube.com/watch?v=sQD7kaZ5h0s",
          videoId: "sQD7kaZ5h0s",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-b-crm-hygiene-q1",
          prompt: "How should deal stages be defined?",
          options: [
            "By something the buyer has verifiably done, such as attending discovery or receiving a proposal",
            "By how confident the rep feels about the deal",
            "By how many emails have been sent",
            "By the deal amount",
          ],
          correctIndex: 0,
          explanation: "Buyer-verified exit criteria make stages mean the same thing for everyone, so forecasts built on them are trustworthy. Rep confidence varies wildly.",
        },
        {
          id: "bd-b-crm-hygiene-q2",
          prompt: "A prospect emails from a new address and you cannot find them in the CRM by name. What should you do first?",
          options: [
            "Search by company and domain and merge or update the existing record before creating a new one",
            "Create a new contact immediately so nothing is lost",
            "Create a new company record as well, to be safe",
            "Leave them out of the CRM until they sign",
          ],
          correctIndex: 0,
          explanation: "Duplicates split the history across records, so the next person misses context. Search wider before creating, and merge if a duplicate already exists.",
        },
        {
          id: "bd-b-crm-hygiene-q3",
          prompt: "Which fields are worth making mandatory on an agency's open deals? (Select all that apply.)",
          options: [
            "A dated next step",
            "Lead source",
            "Expected close date",
            "The prospect's favourite colour",
            "A minimum of 500 words of notes",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Next step, source and close date drive follow-ups, channel analysis and forecasts. Trivia and word-count rules just produce junk typed to pass validation.",
        },
        {
          id: "bd-b-crm-hygiene-q4",
          prompt:
            "A deal has been in 'Proposal sent' for five months. The buyer stopped replying after the third follow-up. The rep wants to keep it open 'in case they come back'. What is the right call?",
          options: [
            "Close it as lost with a reason; reopen or create a new deal if the buyer returns",
            "Keep it open so the pipeline looks healthy",
            "Move it back to 'Discovery' to reset the clock",
            "Delete the deal to keep the CRM tidy",
          ],
          correctIndex: 0,
          explanation:
            "A dead deal left open inflates the forecast and hides the true conversion rate. Deleting it loses the history; closing it as lost keeps both the record and honest numbers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-crm-hygiene-q5",
          prompt: "Why should discovery notes record scope assumptions, not just 'good call, interested'?",
          options: [
            "Delivery inherits what was promised, and the next person on the account needs the specifics",
            "Because CRMs reject short notes",
            "So the client can read them",
            "To make the record longer",
          ],
          correctIndex: 0,
          explanation: "Notes are a handover document. 'Good call' tells delivery nothing about integrations, data or deadlines that were discussed.",
        },
        {
          id: "bd-b-crm-hygiene-q6",
          prompt:
            "The quarterly forecast showed $400k likely to close; $90k actually closed. Most missed deals had close dates that had been pushed four or more times. What does this pattern indicate?",
          options: [
            "Close dates are being moved instead of deals being re-qualified or closed lost",
            "The market changed suddenly",
            "The CRM calculated the forecast incorrectly",
            "Prospects always sign late, so the forecast was fine",
          ],
          correctIndex: 0,
          explanation:
            "Repeatedly pushed close dates are a classic hygiene smell: the deal has stalled, but the record says otherwise. Requiring a reason for each push, and reviewing deals pushed twice, fixes the forecast.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "spot",
        prompt: "This is a deal record a rep handed over before going on leave. Mark the lines that break CRM hygiene.",
        segments: [
          { id: "l1", text: "Company: Northwind Logistics Ltd (domain northwind-logistics.co.uk)", issue: null },
          { id: "l2", text: "Contacts: Priya Shah (Head of Operations), plus 'Priya S.' created as a separate contact last week", issue: "Duplicate contact for the same person; merge them." },
          { id: "l3", text: "Stage: Verbal agreement (rep feels very positive after a friendly call)", issue: "Stage is set by rep feeling, not by a buyer action; no verbal agreement was recorded." },
          { id: "l4", text: "Amount: $48,000 (from proposal v2 sent 3 June)", issue: null },
          { id: "l5", text: "Close date: end of this month (pushed 4 times, no reasons given)", issue: "Repeatedly pushed close date with no reasons; the deal needs re-qualifying." },
          { id: "l6", text: "Lead source: Clutch profile enquiry", issue: null },
          { id: "l7", text: "Next step: none", issue: "Open deal with no dated next step." },
          { id: "l8", text: "Notes: Needs AI search over 40k PDF delivery notes; must integrate with their SAP system; go-live wanted before peak season in November.", issue: null },
          { id: "l9", text: "Notes: Good call, they liked us.", issue: "Uninformative note that gives a colleague nothing to act on." },
          { id: "l10", text: "Proposal v2 attached to the deal record", issue: null },
          { id: "l11", text: "Decision-maker: Priya's CFO, Tom Reed, joined the last call", issue: null },
          { id: "l12", text: "Loss reason: (blank, deal still open)", issue: null },
        ],
        askExplanation: true,
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-b-cold-email",
      moduleId: "bd-beginner",
      trackId: "bd",
      title: "Cold Email Basics: Relevance, Deliverability & the Law",
      summary:
        "Cold email works when it reads as one relevant note from a person, not a campaign. The structure that consistently earns replies is short: a specific observation about the recipient (a job post, a product launch, a hiring spree, a review complaint), the problem that observation implies, one line of credible proof (a similar result for a similar company), and a low-friction ask such as 'worth a 15-minute look?' rather than a 45-minute demo. Under about 120 words, no attachments, plain text, and a subject line that sounds like an internal email.\n\nDeliverability is the part beginners ignore. Mailbox providers judge your domain's reputation: Gmail's sender guidelines require all senders to authenticate with SPF or DKIM, and bulk senders to use SPF, DKIM and DMARC, offer easy unsubscribe and keep spam complaints very low. Agencies therefore send outbound from a separate, warmed-up domain, at modest daily volumes, to verified addresses, so a bad campaign cannot damage the main domain that clients and invoices rely on.\n\nThe law differs by country. In the US, CAN-SPAM does not require prior consent for commercial email, but it does require accurate headers, a non-deceptive subject, a physical postal address and a working opt-out honoured promptly, and it applies to B2B mail. In the UK and EU, PECR and GDPR add rules about personal data and whether the recipient is an individual or a corporate subscriber. The gotcha: 'it's B2B, so anything goes' is wrong almost everywhere.",
      level: "beginner",
      estMinutes: 40,
      webRefs: [
        { label: "FTC: CAN-SPAM Act compliance guide", url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business", kind: "spec" },
        { label: "Gmail Help: Email sender guidelines", url: "https://support.google.com/a/answer/81126", kind: "docs" },
        { label: "ICO (UK): Direct marketing & PECR", url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/", kind: "spec" },
        { label: "HubSpot: B2B cold email templates", url: "https://blog.hubspot.com/sales/the-cold-email-template-that-won-16-new-b2b-customers", kind: "article" },
      ],
      video: {
        title: "Steal This Cold Email Template That Gets 20% Reply Rate",
        channel: "30 Minutes to President’s Club",
        url: "https://www.youtube.com/watch?v=cJ3RJZfN-gs",
        videoId: "cJ3RJZfN-gs",
      },
      alternateVideos: [
        {
          title: "Outbound Prospecting Masterclass: Everything You Need to Book Meetings in 2026",
          channel: "30 Minutes to President’s Club",
          url: "https://www.youtube.com/watch?v=dDM80maP1N0",
          videoId: "dDM80maP1N0",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-b-cold-email-q1",
          prompt: "Which opening line is most likely to earn a reply from a VP of Operations?",
          options: [
            "'Saw you're hiring four support agents in Leeds; teams at that stage often look at AI triage before adding headcount.'",
            "'I hope this email finds you well. We are a leading AI agency with 10 years of experience.'",
            "'Are you interested in increasing revenue and cutting costs?'",
            "'I'd love to set up a 45-minute call to show you our capabilities deck.'",
          ],
          correctIndex: 0,
          explanation: "A specific, researched observation tied to a likely problem shows the email was written for them. Generic pleasantries and capability claims read as a blast.",
        },
        {
          id: "bd-b-cold-email-q2",
          prompt: "Under the US CAN-SPAM Act, which statement is true for B2B cold email?",
          options: [
            "Prior consent is not required, but the email needs a valid postal address and a working opt-out that is honoured",
            "B2B email is exempt from CAN-SPAM entirely",
            "You must get written consent before the first email",
            "An opt-out is only needed after the third email",
          ],
          correctIndex: 0,
          explanation:
            "CAN-SPAM is an opt-out law that covers B2B commercial email: no prior consent, but honest headers and subject, a postal address and an honoured opt-out. The B2B exemption is a common myth.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-cold-email-q3",
          prompt: "Which practices protect the agency's email deliverability? (Select all that apply.)",
          options: [
            "Sending outbound from a separate, warmed-up domain",
            "Authenticating the sending domain with SPF, DKIM and DMARC",
            "Verifying addresses before sending to avoid bounces",
            "Sending 2,000 emails on the first day from a brand-new domain",
            "Attaching a large PDF deck to every first email",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Separate domains, authentication and clean lists protect reputation. Sudden volume from a new domain and heavy attachments are classic spam signals.",
        },
        {
          id: "bd-b-cold-email-q4",
          prompt: "What is the best call to action for a first cold email?",
          options: [
            "A low-commitment question such as 'Worth a 15-minute look next week?'",
            "A link to book a one-hour demo",
            "A request to sign an NDA",
            "Asking them to forward the email to the right person and the CEO",
          ],
          correctIndex: 0,
          explanation: "Small asks get more yeses from strangers. Big commitments and paperwork belong after interest exists.",
        },
        {
          id: "bd-b-cold-email-q5",
          prompt:
            "A colleague wants to send outbound from the agency's main domain, which also sends client invoices and project updates. What is the main risk?",
          options: [
            "Spam complaints from outbound can hurt the main domain's reputation, so invoices and client mail start landing in spam",
            "There is no risk, because domains do not have reputations",
            "Clients will see the outbound emails",
            "The domain will expire faster",
          ],
          correctIndex: 0,
          explanation:
            "Mailbox providers score sending domains. Isolating outbound on a separate domain keeps a bad campaign from damaging business-critical mail.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-cold-email-q6",
          prompt: "Why keep a cold email under roughly 120 words with no images or attachments?",
          options: [
            "It reads like a personal note, is fast to answer on a phone, and avoids spam-filter signals",
            "Because email providers block longer messages",
            "Because the law limits commercial email length",
            "So there is room for a long signature with banners",
          ],
          correctIndex: 0,
          explanation: "Short plain-text emails look personal and are easy to reply to. There is no legal length limit; brevity is about the reader and the filters.",
        },
        {
          id: "bd-b-cold-email-q7",
          prompt:
            "A UK prospect replies 'please remove me'. Two weeks later a sequence tool sends them step 4 because nobody updated the list. What went wrong?",
          options: [
            "The opt-out was not honoured, which breaks UK and US rules and damages trust",
            "Nothing, because the sequence was already scheduled",
            "Only that step 4 had a weak subject line",
            "The prospect should have used the unsubscribe link instead",
          ],
          correctIndex: 0,
          explanation:
            "A reply asking to be removed is an opt-out and must stop all further marketing. Sequences should stop automatically on any reply and opt-outs should be synced.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write a first cold email (subject line plus body) to the prospect below. Keep it under 120 words, make one specific observation, offer one line of proof, and end with a low-friction ask. Do not invent statistics about the agency; use '[case study]' as a placeholder for the proof.",
        context:
          "Prospect: Dana Ruiz, Head of Customer Support at Brightline Insurance (UK, ~300 staff). Brightline posted three job ads for support agents this month and their Trustpilot reviews mention slow claim-status replies. Your agency builds AI assistants that answer status questions from a company's own systems.",
        wordLimit: 140,
        rubric: [
          { id: "specific", label: "Specific observation", description: "Opens with something specific to Brightline (the hiring, the review theme), not generic flattery.", weight: 2 },
          { id: "problem", label: "Problem, not product", description: "Connects the observation to a likely problem (slow status replies, rising headcount cost) before mentioning what the agency does.", weight: 1.5 },
          { id: "proof", label: "Honest proof", description: "Uses one line of proof via the placeholder, with no invented numbers or clients.", weight: 1 },
          { id: "ask", label: "Low-friction ask", description: "Ends with a single small ask (a short call or a yes/no question), not a long demo or meeting request.", weight: 1.5 },
          { id: "brevity", label: "Brief and plain", description: "Under the word limit, plain text tone, subject line reads like a normal email.", weight: 1 },
        ],
        sampleAnswer:
          "Subject: claim-status questions\n\nHi Dana,\n\nNoticed Brightline is hiring three more support agents, and a few recent reviews mention waiting days for a claim-status reply.\n\nStatus questions are usually the easiest volume to take off a support team: an assistant that looks up the claim in your own system and answers in seconds, with agents handling everything else. [Case study: similar insurer, what changed.]\n\nWorth a 15-minute look before the new hires start, to see whether it would work on your ticket mix?\n\nBest,\nAlex",
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-b-linkedin-outreach",
      moduleId: "bd-beginner",
      trackId: "bd",
      title: "LinkedIn Outreach Basics: Profiles, Connection Requests & Social Selling",
      summary:
        "LinkedIn is where agency buyers check who you are before they reply to anything, so outreach starts with your own profile: a headline that says who you help and how ('Helping logistics teams automate support with AI'), not just a job title, plus proof in the featured section. Then comes social selling: following and commenting thoughtfully on prospects' posts before you ever pitch, so your name is familiar when the request arrives.\n\nConnection requests should give a reason to connect, not a pitch. Pitching in the note, or immediately after acceptance, is the fastest way to be ignored or reported. The sequence that works is connect with context, add value (a relevant insight, a useful article, a comment on their launch), and only then ask a question about a problem they are likely to have. Sales Navigator helps you target precisely by role, company size and recent activity, which matters more than volume.\n\nLinkedIn polices this. It limits how many invitations you can send and restricts accounts when many invitations are ignored or marked as spam, and its help centre says third-party tools that automate activity or scrape the site are prohibited. Automation tools that blast hundreds of requests risk the very account BD depends on. The gotcha: a low acceptance rate is not just a vanity metric; it is a signal LinkedIn uses against you.",
      level: "beginner",
      estMinutes: 35,
      webRefs: [
        { label: "LinkedIn Help: Connecting with other members - best practices", url: "https://www.linkedin.com/help/linkedin/answer/62928", kind: "docs" },
        { label: "LinkedIn Help: Prohibited software and extensions", url: "https://www.linkedin.com/help/linkedin/answer/a1341387", kind: "docs" },
        { label: "LinkedIn Help: Invitation limit reached", url: "https://www.linkedin.com/help/billing/answer/a550555", kind: "docs" },
        { label: "HubSpot: Social selling on LinkedIn", url: "https://blog.hubspot.com/sales/social-selling-linkedin", kind: "article" },
      ],
      video: {
        title: "The Only LinkedIn Outreach Video You Will Ever Need",
        channel: "lemlist",
        url: "https://www.youtube.com/watch?v=-LtGmHnpioI",
        videoId: "-LtGmHnpioI",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-b-linkedin-outreach-q1",
          prompt: "Which LinkedIn headline works best for an agency BD rep?",
          options: [
            "'Helping logistics teams cut support load with AI assistants | [Agency]'",
            "'Business Development Executive'",
            "'Open to opportunities'",
            "'Visionary | Thought leader | Disruptor'",
          ],
          correctIndex: 0,
          explanation: "A headline that names who you help and how tells a prospect in one glance why to accept. Titles and buzzwords do not.",
        },
        {
          id: "bd-b-linkedin-outreach-q2",
          prompt: "Which connection note is most likely to be accepted by a CTO you have never met?",
          options: [
            "'Enjoyed your post on moving search to embeddings; we hit the same reranking issue last month. Would be good to connect.'",
            "'Hi, we build AI apps at great rates. Can we book a call this week?'",
            "'I'd like to add you to my professional network.'",
            "'Please accept, I have an offer for you.'",
          ],
          correctIndex: 0,
          explanation: "A genuine, specific reason to connect with no pitch earns acceptance. A pitch in the note signals spam.",
        },
        {
          id: "bd-b-linkedin-outreach-q3",
          prompt: "What can lead LinkedIn to restrict your invitations or account? (Select all that apply.)",
          options: [
            "Sending many invitations in a short time",
            "Many of your invitations being ignored or marked as spam",
            "Using a browser extension that automates sending invitations",
            "Commenting thoughtfully on prospects' posts",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "LinkedIn's help centre names high volumes, ignored or spam-flagged invitations and automation tools. Thoughtful engagement is exactly what the platform wants.",
        },
        {
          id: "bd-b-linkedin-outreach-q4",
          prompt:
            "A prospect accepts your connection request. Your manager says to send the full pitch and pricing deck immediately. What is the better move?",
          options: [
            "Thank them with a short, relevant note or insight, and ask a light question about their situation before pitching",
            "Send the deck right away, since they accepted",
            "Do nothing and wait for them to message first",
            "Add them to an automated sequence of five daily messages",
          ],
          correctIndex: 0,
          explanation:
            "An immediate pitch after acceptance is the most common reason connections go cold. Value first, then a question, earns a conversation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-linkedin-outreach-q5",
          prompt: "What is Sales Navigator mainly useful for in agency BD?",
          options: [
            "Precise targeting by role, company size, industry and recent activity, and tracking target accounts",
            "Automatically sending unlimited connection requests",
            "Getting prospects' personal phone numbers",
            "Replacing the CRM entirely",
          ],
          correctIndex: 0,
          explanation: "Navigator's value is finding and following the right people. It does not remove LinkedIn's limits or replace a CRM.",
        },
        {
          id: "bd-b-linkedin-outreach-q6",
          prompt:
            "A growth vendor offers a tool that sends 500 personalised connection requests a day from your profile 'safely'. What is the main problem?",
          options: [
            "LinkedIn prohibits third-party automation, and the volume risks restricting the account BD depends on",
            "500 is too few to be worthwhile",
            "It only works on Premium accounts",
            "There is no problem if the notes are personalised",
          ],
          correctIndex: 0,
          explanation:
            "Personalisation does not make automation permitted, and LinkedIn limits invitations regardless. Losing the account costs far more than the leads gained.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You want to reach Marco, Head of Product at a 150-person property-management software company that just announced an 'AI roadmap' on LinkedIn. You have never interacted with him.",
        steps: [
          {
            id: "s1",
            question: "What do you do first?",
            options: [
              "Leave a thoughtful comment on his AI-roadmap post, then send a connection request referencing it",
              "Send a connection request with your rates in the note",
              "Message his whole team with the same pitch",
              "Add him to an automation tool's 20-step sequence",
            ],
            correctIndex: 0,
            explanation: "Engaging with his own post gives you a genuine reason to connect and makes your name familiar.",
          },
          {
            id: "s2",
            question: "He accepts. What is your first message?",
            options: [
              "A short thanks plus one useful observation about AI features in property software, and a light question about what his roadmap prioritises",
              "Your 20-page capabilities deck",
              "A request for a one-hour call this week",
              "Nothing; wait for him to reach out",
            ],
            correctIndex: 0,
            explanation: "Value and curiosity before a pitch keeps the door open.",
          },
          {
            id: "s3",
            question: "He replies that they are 'still figuring out where AI fits'. What next?",
            options: [
              "Offer a short, no-pressure conversation to share what similar companies prioritised, and ask who else is involved in the roadmap",
              "Send a fixed-price quote for an AI platform",
              "Tell him to come back when he knows what he wants",
              "Pitch your white-label booking app instead",
            ],
            correctIndex: 0,
            explanation: "An early-stage buyer needs help framing the problem; a small, useful conversation is the right next step, and learning who else is involved starts mapping the buying group.",
          },
        ],
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-b-business-writing",
      moduleId: "bd-beginner",
      trackId: "bd",
      title: "Professional Business Writing for Clients",
      summary:
        "Most of what BD produces is writing: emails, proposals, call recaps, follow-ups and messages that will be forwarded to people you never met. The standard is plain language: lead with the point or the request, one idea per paragraph, short sentences, concrete nouns and numbers, and active voice ('we will deliver the prototype by 12 March', not 'the prototype is expected to be delivered'). Plain language is not dumbing down; it is what busy decision-makers, non-native English readers and the procurement person reading your email cold all need.\n\nThe trade-off is precision versus brevity. A one-line reply is fast, but if it leaves the scope, price or date ambiguous, the ambiguity becomes a dispute later. For anything commercial, restate the specifics in writing (what was agreed, by when, and what is not included) even if it was said on the call. For AI projects especially, write uncertainty explicitly: 'accuracy will be measured against 200 sample tickets in the pilot' is better than 'the AI will be highly accurate'.\n\nGotchas: subject lines that say nothing ('Follow up'), burying the ask in paragraph four, replying-all with internal notes, and tone that reads fine to you but curt to a client in another culture. Before sending, check that someone who reads only the subject and the first two lines knows what you need from them.",
      level: "beginner",
      estMinutes: 30,
      webRefs: [
        { label: "Digital.gov: Plain language guide series", url: "https://digital.gov/guides/plain-language", kind: "docs" },
        { label: "Grammarly: Using plain language at work", url: "https://www.grammarly.com/blog/writing-techniques/plain-language/", kind: "article" },
        { label: "HubSpot: Email etiquette rules", url: "https://blog.hubspot.com/sales/email-etiquette-tips-rules", kind: "article" },
      ],
      video: {
        title: "8 Email Etiquette Tips - How to Write Better Emails at Work",
        channel: "Harvard Business Review",
        url: "https://www.youtube.com/watch?v=1XctnF7C74s",
        videoId: "1XctnF7C74s",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-b-business-writing-q1",
          prompt: "Where should the request go in an email asking a client to approve a change?",
          options: [
            "In the subject line and the first sentence",
            "In the final paragraph, after all the context",
            "In an attachment",
            "In the signature",
          ],
          correctIndex: 0,
          explanation: "Busy readers skim; leading with the ask means it is seen even if the rest is not read.",
        },
        {
          id: "bd-b-business-writing-q2",
          prompt: "Which sentence is the clearest commitment to a client?",
          options: [
            "'We will deliver the clickable prototype by Friday 12 March.'",
            "'The prototype is expected to be delivered in the near future.'",
            "'Efforts will be made to progress the prototype shortly.'",
            "'We are hoping to circle back on the prototype soon.'",
          ],
          correctIndex: 0,
          explanation: "Active voice, a named deliverable and a date leave nothing to interpret. The others hide who does what and when.",
        },
        {
          id: "bd-b-business-writing-q3",
          prompt: "Which are features of plain-language business writing? (Select all that apply.)",
          options: [
            "Short sentences with one main idea each",
            "Concrete numbers and dates instead of vague words",
            "Active voice that says who does what",
            "Industry jargon to signal expertise",
            "Long paragraphs so nothing is left out",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Plain language is short, concrete and active. Jargon and long paragraphs make readers work harder and miss the point.",
        },
        {
          id: "bd-b-business-writing-q4",
          prompt:
            "On a call, the client agreed the pilot excludes Arabic-language support. Nobody wrote it down. Three weeks in, they ask why Arabic is missing. What should have happened?",
          options: [
            "A same-day recap email listing what is in and out of scope, so the exclusion was in writing",
            "Nothing; verbal agreements are enough between friendly parties",
            "Engineering should have added Arabic just in case",
            "The client should have taken notes",
          ],
          correctIndex: 0,
          explanation:
            "Writing down exclusions turns a fuzzy memory into an agreed fact. It is the cheapest dispute prevention there is.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-business-writing-q5",
          prompt: "How should an AI feature's expected quality be written in a client email?",
          options: [
            "'In the pilot we will measure accuracy against 200 of your real tickets and agree the target before rollout.'",
            "'The AI will be extremely accurate.'",
            "'Accuracy is guaranteed at 100%.'",
            "'AI quality cannot be measured.'",
          ],
          correctIndex: 0,
          explanation: "A measurable, agreed test is honest and specific. Vague praise or guarantees set up disappointment.",
        },
        {
          id: "bd-b-business-writing-q6",
          prompt:
            "You are about to reply-all to a client thread with an internal comment about their budget being 'tight but squeezable'. What is the right move?",
          options: [
            "Stop, remove the client from the recipients or move the comment to an internal channel",
            "Send it; clients rarely read long threads",
            "Send it but put the comment at the bottom",
            "Send it and apologise later if they notice",
          ],
          correctIndex: 0,
          explanation:
            "Reply-all leaks are a classic, avoidable mistake. Internal commentary belongs in internal channels, never in a thread the client is on.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Rewrite the email below for the client. Lead with what you need, keep it under 120 words, use plain language, and keep every fact (do not add new ones).",
        context:
          "Original draft: 'Hi Sam, hope you are well and had a good weekend!! Just following up on things. So as discussed the team has been doing lots of work on the AI search and it is going quite well generally, though there are a few things. One thing is that we would need access to the SharePoint which we mentioned before at some point, as without it we can't really test properly on the real documents. Also the demo might move a bit, possibly to Thursday the 14th instead of Tuesday the 12th, depending on access. Let us know what you think about all of this when you get a chance. Thanks!!'",
        wordLimit: 130,
        rubric: [
          { id: "ask-first", label: "Ask up front", description: "The SharePoint access request is in the subject or first sentence, with what exactly is needed.", weight: 2 },
          { id: "consequence", label: "Clear consequence", description: "States plainly that the demo moves from Tue 12th to Thu 14th unless access arrives, with the dependency explicit.", weight: 1.5 },
          { id: "plain", label: "Plain and concise", description: "Short sentences, no filler, no exclamation marks, under the word limit.", weight: 1 },
          { id: "faithful", label: "Faithful to facts", description: "Keeps every fact from the original and invents nothing new (no new dates, people or numbers).", weight: 1 },
        ],
        sampleAnswer:
          "Subject: SharePoint access needed for the AI search demo\n\nHi Sam,\n\nCould you give our team access to the SharePoint document library? We need it to test the AI search on your real documents.\n\nWithout access, we will move the demo from Tuesday 12th to Thursday 14th. If access arrives soon, we can keep Tuesday.\n\nThe rest of the AI search work is going well.\n\nThanks,\nAlex",
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-b-tech-literacy",
      moduleId: "bd-beginner",
      trackId: "bd",
      title: "Tech Literacy for BD: Web vs Mobile vs AI, MVPs, APIs & the Stack",
      summary:
        "BD does not need to write code, but it does need to translate between a buyer's goals and the shape of the build well enough to avoid selling something engineering cannot deliver. The core vocabulary: a *web app* runs in the browser and ships updates instantly; a *native mobile app* (Swift, Kotlin) gets the best device access and performance but means two codebases and app-store review; *cross-platform* (React Native, Flutter) shares one codebase across iOS and Android with some trade-offs. An *API* is the contract one system uses to talk to another, so 'integrate with their CRM' means depending on that system's API, its limits and its documentation. The *front end* is what users see, the *back end* holds business logic and data, and *hosting* is where it runs and what it costs monthly.\n\nAI features add their own vocabulary. Most client AI work calls a hosted model through an API rather than training one; *RAG* (retrieval-augmented generation) lets the model answer from the client's own documents; *fine-tuning* adjusts a model and is rarely the first step. Model output is probabilistic, priced per token, and model versions get retired, so AI features carry running costs and maintenance that a static website does not.\n\nAn *MVP* is the smallest product that tests the riskiest assumption with real users, not a cheap version of everything. The gotcha for BD: words like 'just', 'simple' or 'like Uber' hide most of the cost. A single 'just integrate with our legacy ERP' can outweigh the rest of the app, so flag every integration and data source for engineering before anything is promised.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "MDN: How the web works", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works", kind: "docs" },
        { label: "AWS: What is an API?", url: "https://aws.amazon.com/what-is/api/", kind: "article" },
        { label: "Atlassian: Minimum viable product", url: "https://www.atlassian.com/agile/product-management/minimum-viable-product", kind: "article" },
        { label: "IBM: Mobile application development", url: "https://www.ibm.com/think/topics/mobile-application-development", kind: "article" },
      ],
      video: {
        title: "Web App Vs Mobile App - Is There A difference?",
        channel: "Mike Munroe",
        url: "https://www.youtube.com/watch?v=QTY61TC1qc8",
        videoId: "QTY61TC1qc8",
      },
      alternateVideos: [
        {
          title: "What Are APIs? - Simply Explained",
          channel: "Simply Explained",
          url: "https://www.youtube.com/watch?v=OVvTv9Hy91Q",
          videoId: "OVvTv9Hy91Q",
        },
        {
          title: "Michael Seibel - How to Plan an MVP",
          channel: "Y Combinator",
          url: "https://www.youtube.com/watch?v=1hHMwLxN6EM",
          videoId: "1hHMwLxN6EM",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-b-tech-literacy-q1",
          prompt: "A client needs an internal dashboard for 40 office staff, updated weekly, with no offline use. What is usually the sensible platform?",
          options: [
            "A web app, because it reaches every staff laptop instantly with one codebase and no app-store review",
            "Native iOS and Android apps",
            "A cross-platform mobile app",
            "A desktop app installed on each machine",
          ],
          correctIndex: 0,
          explanation: "Desk-based internal tools rarely need device features, so a web app is cheapest to build and update. Mobile apps add stores and codebases for no gain here.",
        },
        {
          id: "bd-b-tech-literacy-q2",
          prompt: "What does 'integrate with their CRM' really mean for scope?",
          options: [
            "The build depends on that CRM's API: what data it exposes, its limits, its authentication and its documentation quality",
            "Copying the CRM's design into the app",
            "Installing the CRM on the agency's servers",
            "A fixed one-day task in every project",
          ],
          correctIndex: 0,
          explanation: "Integrations are only as easy as the other system's API allows, which is why they are a common source of estimate overruns.",
        },
        {
          id: "bd-b-tech-literacy-q3",
          prompt:
            "A prospect wants an assistant that answers staff questions from 5,000 internal policy PDFs. Which approach would engineering most likely start with?",
          options: [
            "Retrieval-augmented generation: search the documents and give relevant passages to a hosted model",
            "Training a new language model from scratch on the PDFs",
            "Fine-tuning a model before trying anything else",
            "A keyword FAQ page with no AI",
          ],
          correctIndex: 0,
          explanation:
            "RAG grounds answers in the client's own documents without training, and documents can change without retraining. Training from scratch is far beyond a typical budget, and fine-tuning is rarely the first step for document Q&A.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-tech-literacy-q4",
          prompt: "Which statements about an AI feature built on a hosted model are true? (Select all that apply.)",
          options: [
            "It has usage-based running costs, typically priced per token",
            "Its answers can vary and can be wrong, so it needs testing and fallbacks",
            "The provider may retire the model version, which means re-testing on a newer one",
            "Once launched, it never needs changes",
            "It always gives identical answers to identical questions",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Usage cost, probabilistic output and model retirement are why AI features carry ongoing cost and maintenance. 'Never changes' and 'always identical' are exactly the misconceptions that cause disputes.",
        },
        {
          id: "bd-b-tech-literacy-q5",
          prompt: "What is an MVP, in the sense engineering and good founders mean it?",
          options: [
            "The smallest product that tests the riskiest assumption with real users",
            "A cheaper, lower-quality version of every planned feature",
            "The first version with all features, before polishing",
            "A design mockup with no working code",
          ],
          correctIndex: 0,
          explanation:
            "An MVP cuts scope to the essential test, not quality across the board. Building every feature badly still costs most of the full product.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-tech-literacy-q6",
          prompt: "Why might a client choose cross-platform (React Native or Flutter) over two native apps?",
          options: [
            "One shared codebase for iOS and Android usually lowers build and maintenance cost",
            "Cross-platform apps skip app-store review",
            "Cross-platform apps always outperform native ones",
            "Native apps cannot access the camera",
          ],
          correctIndex: 0,
          explanation: "Sharing code is the main benefit. Cross-platform apps still go through the stores, and native keeps an edge for some performance- or device-heavy features.",
        },
        {
          id: "bd-b-tech-literacy-q7",
          prompt:
            "On a call, the prospect says: 'It's simple, just like Uber but for tutors.' What should BD do before promising a price?",
          options: [
            "Unpack what 'like Uber' means (matching, payments, live location, ratings, two apps) and flag each piece for engineering",
            "Quote the cost of a basic website, since they said it is simple",
            "Quote the cost of a full Uber clone to be safe",
            "Ask them to send their competitor's app so engineering can copy it",
          ],
          correctIndex: 0,
          explanation:
            "'Like Uber' hides several costly systems. Breaking it into concrete capabilities is the only way to get a credible estimate in either direction.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-tech-literacy-q8",
          prompt: "What do 'front end', 'back end' and 'hosting' refer to?",
          options: [
            "What users see and interact with; the server-side logic and data; where the system runs and what that costs",
            "The first, middle and last sprints of a project",
            "The sales, delivery and support teams",
            "Mobile app, web app and desktop app",
          ],
          correctIndex: 0,
          explanation: "These are layers of the system, not phases or teams. Hosting is a recurring cost the client should hear about early.",
        },
      ],
      practice: {
        kind: "spot",
        prompt: "A new BD rep drafted this email to a prospect. Mark the sentences that are technically wrong or overpromise.",
        segments: [
          { id: "s1", text: "Thanks for the call today. Here is a quick summary of how we would approach your tutor-matching app.", issue: null },
          { id: "s2", text: "We recommend a cross-platform mobile app so iOS and Android share one codebase.", issue: null },
          { id: "s3", text: "Because it is cross-platform, it will not need to go through App Store or Google Play review.", issue: "Cross-platform apps still go through app-store review." },
          { id: "s4", text: "Tutors and parents will see a web admin dashboard for bookings and payouts.", issue: null },
          { id: "s5", text: "The AI matching feature will train its own language model on your tutor profiles in the first week.", issue: "Client AI work normally calls a hosted model; training a model in a week is not realistic." },
          { id: "s6", text: "Once live, the AI will give the same, correct match every time.", issue: "AI output is probabilistic and can be wrong; this overpromises." },
          { id: "s7", text: "Payments will use a provider's API, so we will confirm their fees and payout rules during discovery.", issue: null },
          { id: "s8", text: "Integrating with your existing school-management system is just a small task we can add at the end.", issue: "Legacy integrations are a major estimate risk and should be scoped early, not treated as trivial." },
          { id: "s9", text: "After launch, AI features have usage-based costs that we will estimate from expected volume.", issue: null },
          { id: "s10", text: "Next step: a short discovery workshop with our engineering lead to confirm scope.", issue: null },
        ],
        askExplanation: true,
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-b-software-estimation",
      moduleId: "bd-beginner",
      trackId: "bd",
      title: "How Software Projects Are Estimated (for BD)",
      summary:
        "Every price BD quotes rests on an estimate, and an estimate is a forecast with uncertainty, not a promise. Engineering usually breaks the work into features or tasks, estimates each (often as a range: optimistic, most likely, pessimistic), adds non-feature work that beginners forget (project management, QA, deployment, meetings, design review), and adds a contingency proportional to how unknown the work is. A three-point (PERT) estimate, (optimistic + 4 x most likely + pessimistic) / 6, is a simple way to turn a range into one planning number that respects the long tail.\n\nUncertainty is largest at the start and shrinks as discovery answers questions; this is the 'cone of uncertainty'. That is why agencies sell a paid discovery phase before committing to a fixed price for anything novel. AI features widen the cone: nobody knows how accurate a model will be on the client's data until it is tried, prompt and evaluation work is iterative, and running costs depend on token volume. Estimate AI work as a time-boxed experiment first, then price the build, and estimate model usage separately (requests x tokens per request x the provider's per-token price) so the client sees running cost before signing.\n\nThe BD gotchas: quoting before engineering has seen the scope, quietly trimming an estimate to win the deal (the overrun lands on delivery and margin), and presenting the optimistic number as the price. Share ranges and assumptions, and write those assumptions into the proposal so a change in scope is visibly a change in price.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Claude Docs: Pricing", url: "https://platform.claude.com/docs/en/about-claude/pricing", kind: "docs" },
        { label: "Claude Docs: Token counting", url: "https://platform.claude.com/docs/en/build-with-claude/token-counting", kind: "docs" },
        { label: "Atlassian: Agile estimation", url: "https://www.atlassian.com/agile/project-management/estimation", kind: "article" },
      ],
      video: {
        title: "How To Estimate Software Development Time",
        channel: "Modern Software Engineering",
        url: "https://www.youtube.com/watch?v=v21jg8wb1eU",
        videoId: "v21jg8wb1eU",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-b-software-estimation-q1",
          prompt: "A task is estimated at optimistic 10 h, most likely 16 h, pessimistic 40 h. What is the PERT estimate?",
          options: ["19 hours", "16 hours", "22 hours", "25 hours"],
          correctIndex: 0,
          explanation: "(10 + 4 x 16 + 40) / 6 = 114 / 6 = 19. It sits above the most-likely value because the pessimistic tail is long; the simple average of the three would be 22.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-software-estimation-q2",
          prompt: "Why do agencies sell a paid discovery phase before a fixed price on a novel AI platform?",
          options: [
            "Uncertainty is highest at the start; discovery answers the questions that would otherwise be priced as pure risk",
            "To delay the project",
            "Because fixed prices are illegal without discovery",
            "Because discovery is always free elsewhere",
          ],
          correctIndex: 0,
          explanation: "The cone of uncertainty narrows as questions get answered, so a discovery phase turns guesswork into a defensible price for both sides.",
        },
        {
          id: "bd-b-software-estimation-q3",
          prompt: "Which work is often forgotten when someone adds up feature estimates? (Select all that apply.)",
          options: [
            "Project management and client meetings",
            "QA, bug fixing and user acceptance testing",
            "Deployment, environments and release work",
            "The features the client asked for",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Feature lists miss the work around features. Management, QA and release work commonly add a significant share on top.",
        },
        {
          id: "bd-b-software-estimation-q4",
          prompt:
            "Engineering estimates 600-800 hours. A competitor quoted the prospect for about 450 hours' worth. Your manager suggests quoting 450 to win. What is the main problem?",
          options: [
            "The overrun does not disappear; it lands on delivery and margin, or becomes a dispute when change requests appear",
            "There is no problem; estimates are always too high",
            "Only that the client may ask for a discount later",
            "It would make the project finish faster",
          ],
          correctIndex: 0,
          explanation:
            "Cutting the number does not cut the work. Better options are reducing scope to fit the budget, phasing, or explaining why the lower quote is likely missing things.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-b-software-estimation-q5",
          prompt: "How should the monthly model cost of an AI feature be estimated?",
          options: [
            "Requests per month x tokens per request (input and output) x the provider's per-token prices",
            "As a fixed percentage of the build price",
            "By the number of developers on the project",
            "It cannot be estimated until the first invoice",
          ],
          correctIndex: 0,
          explanation: "Model usage is metered. Input and output tokens are usually priced differently, so estimate both from expected usage.",
        },
        {
          id: "bd-b-software-estimation-q6",
          prompt: "Why estimate an AI accuracy feature as a time-boxed experiment first?",
          options: [
            "Nobody knows how well the model will do on this client's data until it is tried, so the build estimate depends on the result",
            "Because AI features are always cheap",
            "Because experiments do not need to be billed",
            "Because the client will not notice the difference",
          ],
          correctIndex: 0,
          explanation: "A time box caps the cost of finding out. Its result tells you whether to build, rescope or stop.",
        },
        {
          id: "bd-b-software-estimation-q7",
          prompt: "What belongs next to the price in a proposal so scope changes are visibly price changes?",
          options: [
            "The assumptions and exclusions the estimate was based on",
            "The engineers' hourly salaries",
            "A promise that the price will never change",
            "The estimate spreadsheet's formulas",
          ],
          correctIndex: 0,
          explanation:
            "Written assumptions ('integration with one CRM via its REST API', 'English only') make it clear when a request falls outside the estimate.",
        },
        {
          id: "bd-b-software-estimation-q8",
          prompt:
            "Halfway through, the client asks for Arabic support. The proposal said 'English only' in its assumptions. What does that line make possible?",
          options: [
            "A clean change request with its own estimate and price, without an argument about what was included",
            "Refusing the request outright",
            "Doing the work for free to keep the client happy",
            "Nothing; assumptions have no commercial effect",
          ],
          correctIndex: 0,
          explanation: "Documented assumptions turn scope creep into a normal, priced change instead of a dispute.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Engineering gave three-point estimates for an AI document-search MVP. Use PERT for each item ((O + 4M + P) / 6), add them up, price at a blended $45/hour, then add 15% contingency. Separately, estimate the monthly model cost: 20,000 queries a month, each using 3,000 input tokens and 500 output tokens, at an illustrative $3 per million input tokens and $15 per million output tokens.",
        table: {
          columns: ["Item", "Optimistic (h)", "Most likely (h)", "Pessimistic (h)"],
          rows: [
            ["Auth & user management", "30", "40", "70"],
            ["Admin dashboard", "60", "80", "130"],
            ["AI document Q&A", "80", "120", "250"],
            ["QA & deployment", "40", "50", "70"],
          ],
        },
        fields: [
          { id: "hours", label: "Total PERT hours", unit: "h", answer: 315, tolerance: 0.5 },
          { id: "price", label: "Build price incl. 15% contingency", unit: "$", answer: 16301.25, tolerance: 5 },
          { id: "model", label: "Monthly model cost", unit: "$", answer: 330, tolerance: 1 },
        ],
        explanation:
          "PERT: auth 260/6 = 43.33, dashboard 510/6 = 85, AI 810/6 = 135, QA 310/6 = 51.67; total 315 h. 315 x $45 = $14,175; x 1.15 = $16,301.25. Per query: 3,000 x $3/1M = $0.009 plus 500 x $15/1M = $0.0075, so $0.0165; x 20,000 = $330 a month. Note the AI item has the widest range, which is why it deserves a time-boxed experiment first.",
      },
    },
  ],
} satisfies Module;
