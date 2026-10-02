import type { Module } from "@/types/curriculum";

export default {
  id: "bd-intermediate",
  trackId: "bd",
  name: "Winning Deals",
  description:
    "From first call to signed scope: discovery with SPIN questions, qualification with BANT and MEDDPICC, winning on Upwork, writing proposals and SOWs with engineering, choosing a pricing model, handling objections, following up without nagging, and running demos that sell. Written for selling AI platforms, where scope and model costs are genuinely uncertain.",
  refs: [
    { label: "MEDDICC.com: MEDDPICC sales methodology", url: "https://meddicc.com/meddpicc-sales-methodology-and-process", kind: "spec" },
    { label: "Upwork Help Center", url: "https://support.upwork.com/hc/en-us", kind: "docs" },
    { label: "HubSpot: SPIN selling ultimate guide", url: "https://blog.hubspot.com/sales/spin-selling-the-ultimate-guide", kind: "article" },
  ],
  topics: [
    // ------------------------------------------------------------------
    {
      id: "bd-i-spin-discovery",
      moduleId: "bd-intermediate",
      trackId: "bd",
      title: "Discovery Calls with SPIN Questioning",
      summary:
        "Discovery is where agency deals are won or lost, because it decides whether you are pitching a solution to a real, expensive problem or reacting to a feature request. SPIN, from Neil Rackham's research into large sales, gives the questions an order. *Situation* questions establish facts (team size, current tools, data available); keep them few, because buyers find them tedious and you should have researched most of them. *Problem* questions surface difficulties ('where does the manual process break?'). *Implication* questions make the cost of those problems explicit ('what happens to renewals when claims take a week?'), and they are what turn a nice-to-have into a budgeted project. *Need-payoff* questions let the buyer state the value of solving it in their own words, which becomes the business case you quote back in the proposal.\n\nThe trade-off is time and patience: a rep who jumps from the first problem to a demo saves twenty minutes and loses the implication that justifies the budget. For AI platforms, discovery also has to cover feasibility: what data exists, who owns it, what accuracy is good enough, what happens when the AI is wrong, and who will maintain prompts and models after launch. Those answers decide whether the deal should start with a paid proof of concept.\n\nThe gotchas: interrogating instead of conversing, asking leading questions that put words in the buyer's mouth, and ending without a recap and a dated next step. Send a written recap the same day: their problems in their words, the implications, what success looks like, open questions, and next steps.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Salesforce Trailhead: Customer-centric discovery", url: "https://trailhead.salesforce.com/content/learn/modules/customer-centric-discovery-strategies/get-started-customer-centric-discovery", kind: "docs" },
        { label: "HubSpot: SPIN selling ultimate guide", url: "https://blog.hubspot.com/sales/spin-selling-the-ultimate-guide", kind: "article" },
        { label: "Gong: Discovery call", url: "https://www.gong.io/blog/discovery-call", kind: "article" },
        { label: "HubSpot: Discovery call questions", url: "https://blog.hubspot.com/sales/discovery-call-questions", kind: "article" },
      ],
      video: {
        title: "How to Structure The Perfect Discovery Call (Sell Playbook)",
        channel: "30 Minutes to President’s Club",
        url: "https://www.youtube.com/watch?v=AzRZqz01hc0",
        videoId: "AzRZqz01hc0",
      },
      alternateVideos: [
        {
          title: "SPIN Selling Explained (Does It Work In 2026?)",
          channel: "Salesman․com",
          url: "https://www.youtube.com/watch?v=bhYG5nxazVA",
          videoId: "bhYG5nxazVA",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-i-spin-discovery-q1",
          prompt: "What do the letters in SPIN stand for, in order?",
          options: [
            "Situation, Problem, Implication, Need-payoff",
            "Solution, Price, Impact, Negotiation",
            "Situation, Pain, Investment, Next steps",
            "Scope, Problem, Integration, Need",
          ],
          correctIndex: 0,
          explanation: "SPIN moves from facts to problems, to the consequences of those problems, to the value of solving them.",
        },
        {
          id: "bd-i-spin-discovery-q2",
          prompt: "Classify this question: 'If claim-status emails keep taking three days, what does that do to your renewal rate?'",
          options: ["Implication", "Situation", "Problem", "Need-payoff"],
          correctIndex: 0,
          explanation: "It explores the consequence of a known problem. A problem question would ask whether replies are slow; a need-payoff question would ask what faster replies would be worth.",
        },
        {
          id: "bd-i-spin-discovery-q3",
          prompt: "Why should situation questions be kept to a minimum?",
          options: [
            "Buyers find them tedious and most of the answers should come from your own research",
            "They are not allowed in SPIN",
            "They reveal your pricing too early",
            "They always make buyers defensive",
          ],
          correctIndex: 0,
          explanation: "Facts you could have looked up waste the buyer's time and signal you did not prepare. Ask only the situation questions research cannot answer.",
        },
        {
          id: "bd-i-spin-discovery-q4",
          prompt: "Which are need-payoff questions? (Select all that apply.)",
          options: [
            "'If agents stopped answering status questions, what would they spend that time on?'",
            "'How would it help your team if new hires were productive in two weeks instead of six?'",
            "'What would cutting response time to minutes mean for your renewal targets?'",
            "'How many support agents do you have?'",
            "'Which ticketing system do you use?'",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Need-payoff questions get the buyer to state the value of a solution in their own words. Headcount and tooling questions are situation questions.",
        },
        {
          id: "bd-i-spin-discovery-q5",
          prompt:
            "Ten minutes into a call, the prospect mentions their support team is overwhelmed. The rep immediately shares a screen and demos the agency's AI assistant. What is the main cost of this move?",
          options: [
            "The rep skipped implication and need-payoff, so there is no quantified reason or business case for the budget",
            "Demos are never appropriate on discovery calls",
            "The prospect will think the agency is too technical",
            "There is no cost; showing the product early is always best",
          ],
          correctIndex: 0,
          explanation:
            "Jumping to a solution leaves the problem's cost unexplored, so the deal later stalls on 'nice, but not a priority'. Implication questions build the urgency that funds projects.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-spin-discovery-q6",
          prompt: "Which feasibility topics must a discovery call for an AI platform cover? (Select all that apply.)",
          options: [
            "What data exists, where it lives and who owns it",
            "What accuracy is good enough and what happens when the AI is wrong",
            "Who will maintain prompts and models after launch",
            "The agency's internal salary bands",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Data, acceptable accuracy with a fallback, and ongoing ownership decide whether the project is feasible and how to price it. Internal salaries are irrelevant to the buyer.",
        },
        {
          id: "bd-i-spin-discovery-q7",
          prompt: "Which is a leading question that should be avoided?",
          options: [
            "'Wouldn't you agree your current process is costing you a fortune?'",
            "'Where does the current process break down?'",
            "'What happens downstream when a claim is delayed?'",
            "'How are you handling this today?'",
          ],
          correctIndex: 0,
          explanation: "Leading questions push the buyer toward your conclusion and feel manipulative. Open questions let them tell you what is actually true.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-spin-discovery-q8",
          prompt: "What should the same-day recap after discovery contain?",
          options: [
            "Their problems and implications in their words, what success looks like, open questions, and dated next steps",
            "A full price quote and contract",
            "A thank-you note and the agency's capabilities deck",
            "Only the date of the next meeting",
          ],
          correctIndex: 0,
          explanation: "A recap proves you listened, lets the buyer correct misunderstandings, and becomes the backbone of the proposal.",
        },
        {
          id: "bd-i-spin-discovery-q9",
          prompt:
            "At the end of discovery, the prospect says, 'Great, send us a proposal.' Nobody has discussed budget, the decision process or who else is involved. What should the rep do before hanging up?",
          options: [
            "Ask a few short questions about budget range, who else decides and how, and agree when to review the proposal together",
            "Thank them and write the proposal that evening",
            "Send a proposal at three price points to cover every possibility",
            "Ask them to sign an NDA first",
          ],
          correctIndex: 0,
          explanation:
            "A proposal sent without budget or process is a guess that often vanishes into an inbox. Agreeing a review meeting turns the proposal into a conversation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-spin-discovery-q10",
          prompt: "Why are implication questions especially powerful in large deals?",
          options: [
            "They make the cost of the problem big and explicit enough to justify a significant budget",
            "They shorten the call",
            "They replace the need for a proposal",
            "They work best on the first email",
          ],
          correctIndex: 0,
          explanation: "Rackham's research found implication questions matter most in large sales, where the buyer must justify the spend to others.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You are running discovery with Lena, COO of a 200-person freight broker. She opens with: 'We want an AI that reads incoming shipment emails and creates bookings automatically.'",
        steps: [
          {
            id: "s1",
            question: "What is your best next question?",
            options: [
              "'How are those emails handled today, and where does it go wrong?'",
              "'Great, our AI can do that. Shall I show you a demo?'",
              "'What is your budget?'",
              "'Have you considered a white-label TMS instead?'",
            ],
            correctIndex: 0,
            explanation: "A problem question grounds the request in today's process before any solution is discussed.",
          },
          {
            id: "s2",
            question: "Lena says six people re-key 900 emails a day and errors cause missed pickups. What do you ask next?",
            options: [
              "'What does a missed pickup cost you, in fees and in customer relationships?'",
              "'Which email client do they use?'",
              "'Would you like the AI to be 100% accurate?'",
              "'Can you send us 10,000 emails today?'",
            ],
            correctIndex: 0,
            explanation: "An implication question quantifies the cost of errors, which becomes the business case.",
          },
          {
            id: "s3",
            question: "She estimates missed pickups cost about $40k a month. How do you close the call?",
            options: [
              "Recap the problem and its cost, propose a paid two-week pilot on a sample of real emails to measure accuracy, and agree who else should join the next call",
              "Quote a fixed price for full automation of all 900 emails a day",
              "Promise the AI will eliminate all errors",
              "Ask her to come back when she has a written spec",
            ],
            correctIndex: 0,
            explanation: "The value is clear but accuracy on her emails is unknown, so a measured pilot plus mapping the buying group is the honest, winnable next step.",
          },
        ],
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-i-qualification",
      moduleId: "bd-intermediate",
      trackId: "bd",
      title: "Qualification: From BANT to MEDDIC and MEDDPICC",
      summary:
        "Qualification decides where BD spends its scarcest resource: time on proposals, estimates and engineering calls. BANT (Budget, Authority, Need, Timeline) is the quick screen and works for smaller, transactional deals: is there money, can this person decide, is there a real need, and is there a date? Its weakness is that it is checked once and treats each letter as yes or no, and buyers rarely know their budget for something new, such as an AI platform, until someone shows them the value.\n\nMEDDIC and its extension MEDDPICC fit larger, multi-stakeholder deals. *Metrics* (the quantified outcome), *Economic buyer* (the person who can release the money, not just your friendly contact), *Decision criteria* and *Decision process* (how they will choose and the steps to get there), *Paper process* (legal, security review, procurement and signature, which is where agency deals go to die), *Identify pain*, *Champion* (someone inside with influence who sells for you when you are not in the room) and *Competition* (including 'do nothing' and 'build in-house'). Each element is evidence you collect over time, not a box ticked on the first call.\n\nThe trade-off is rigour versus speed: running full MEDDPICC on a $5k Upwork job wastes time, while running only BANT on a six-figure platform deal misses the procurement step that adds months. The gotchas: mistaking a friendly contact for a champion (a champion has influence and acts on your behalf), and forecasting from stage alone. A deal with no access to the economic buyer is weaker than its stage suggests, and good forecasts discount for that.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "MEDDICC.com: MEDDPICC sales methodology", url: "https://meddicc.com/meddpicc-sales-methodology-and-process", kind: "spec" },
        { label: "HubSpot: BANT", url: "https://blog.hubspot.com/sales/bant", kind: "article" },
        { label: "HubSpot: Ultimate guide to sales qualification", url: "https://blog.hubspot.com/sales/ultimate-guide-to-sales-qualification", kind: "article" },
      ],
      video: {
        title: "Implementing MEDDIC - MEDDPICC Explained In 10 Minutes!",
        channel: "MEDDICC",
        url: "https://www.youtube.com/watch?v=l4yTE-5R5Zo",
        videoId: "l4yTE-5R5Zo",
      },
      alternateVideos: [
        {
          title: "What is BANT? (And How to Implement It)",
          channel: "Tech Sales With Higher Levels",
          url: "https://www.youtube.com/watch?v=MjtZ4DdDJNM",
          videoId: "MjtZ4DdDJNM",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-i-qualification-q1",
          prompt: "What does BANT stand for?",
          options: ["Budget, Authority, Need, Timeline", "Buyer, Agreement, Negotiation, Terms", "Budget, Approval, Network, Target", "Benefit, Authority, Need, Trust"],
          correctIndex: 0,
          explanation: "BANT is the classic four-question screen: money, decision power, need and timing.",
        },
        {
          id: "bd-i-qualification-q2",
          prompt: "Which letters does MEDDPICC add to MEDDIC?",
          options: [
            "P for Paper process and C for Competition",
            "P for Price and C for Contract",
            "P for Pain and C for Closing",
            "P for Pilot and C for Customer success",
          ],
          correctIndex: 0,
          explanation: "MEDDPICC adds the Paper process (legal, procurement, signature) and Competition, both common reasons late-stage deals slip or are lost.",
        },
        {
          id: "bd-i-qualification-q3",
          prompt: "What makes someone a champion rather than just a friendly contact? (Select all that apply.)",
          options: [
            "They have influence with the people who decide",
            "They actively sell your solution internally when you are not in the room",
            "They have a personal stake in the problem being solved",
            "They reply to your emails quickly",
            "They told you they really like your agency",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A champion has influence, a stake, and acts for you. Responsiveness and enthusiasm alone describe a coach or a fan, and over-relying on them is a classic forecasting error.",
        },
        {
          id: "bd-i-qualification-q4",
          prompt: "Who is the economic buyer?",
          options: [
            "The person who can release the money and say yes when others say no",
            "The first person who contacted you",
            "The procurement officer who sends the contract",
            "The technical lead who evaluates the architecture",
          ],
          correctIndex: 0,
          explanation: "The economic buyer owns the spend decision. Procurement processes paperwork and the technical lead evaluates, but neither usually releases the budget.",
        },
        {
          id: "bd-i-qualification-q5",
          prompt:
            "A prospect for a $150k AI platform says, 'We don't have a budget yet; we need to see what's possible.' Under strict BANT this fails Budget. What is the better reading?",
          options: [
            "For a new category of spend, budget is often created by a quantified business case, so qualify on pain, metrics and access to the economic buyer instead",
            "Disqualify immediately, because no budget means no deal",
            "Send a proposal anyway at a discounted price",
            "Wait until they come back with a budget",
          ],
          correctIndex: 0,
          explanation:
            "Buyers rarely have a line item for something they have never bought. Strong pain, measurable value and an engaged economic buyer can create budget; rigid BANT would discard good deals.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-qualification-q6",
          prompt: "Why is 'Paper process' where many agency deals stall?",
          options: [
            "Security questionnaires, legal review, vendor onboarding and procurement can add weeks or months that nobody planned for",
            "Because agencies forget to print contracts",
            "Because buyers do not read contracts",
            "Because it only applies to government clients",
          ],
          correctIndex: 0,
          explanation: "The verbal yes is often far from the signature. Mapping the paper process early lets you start security and legal steps in parallel.",
        },
        {
          id: "bd-i-qualification-q7",
          prompt: "In MEDDPICC, what counts as Competition for an agency deal? (Select all that apply.)",
          options: [
            "Other agencies bidding for the same project",
            "The client's own engineers building it in-house",
            "The client deciding to do nothing this year",
            "The agency's own previous proposal versions",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Competition includes every alternative the buyer has, and 'do nothing' and 'build in-house' are often the most dangerous. Your old drafts are not a competitor.",
        },
        {
          id: "bd-i-qualification-q8",
          prompt: "When is full MEDDPICC overkill?",
          options: [
            "A small, single-decision-maker job, such as a $5k fixed-price Upwork task",
            "A six-figure platform with procurement and security review",
            "A multi-stakeholder enterprise deal",
            "A deal where you have not met the economic buyer",
          ],
          correctIndex: 0,
          explanation: "Match the rigour to the deal. A simple, one-person decision needs a quick BANT-style check, not a full scorecard.",
        },
        {
          id: "bd-i-qualification-q9",
          prompt:
            "Two deals are both in 'Proposal sent'. Deal X has met its economic buyer and has a champion; Deal Y has only spoken to a junior analyst. How should they be forecast?",
          options: [
            "Weight Deal Y lower than its stage suggests, because there is no access to the economic buyer and no champion",
            "Forecast both at the same probability, since the stage is the same",
            "Weight Deal Y higher because analysts move faster",
            "Exclude Deal X because it is too far along",
          ],
          correctIndex: 0,
          explanation:
            "Stage-only forecasting hides qualification gaps. Discounting deals that lack key MEDDPICC evidence makes the forecast closer to reality.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-qualification-q10",
          prompt: "Which is a strong 'Metrics' entry for an AI support-automation deal?",
          options: [
            "'Cut average first-response time from 26 hours to under 2 hours and avoid hiring 4 agents ($180k a year)'",
            "'Make support better with AI'",
            "'The client is excited about AI'",
            "'Deliver a chatbot'",
          ],
          correctIndex: 0,
          explanation: "Metrics are quantified business outcomes the buyer agrees with. Enthusiasm and deliverables are not metrics.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Your pipeline is below. First compute the plain weighted pipeline (amount x stage probability, summed). Then apply the team's qualification rule: any deal with no access to the economic buyer is weighted at half its stage probability. Give both totals and the qualified-weighted value of the largest deal.",
        table: {
          columns: ["Deal", "Amount ($)", "Stage", "Stage probability", "Economic buyer engaged?"],
          rows: [
            ["Insurer AI claims assistant", "120,000", "Proposal sent", "40%", "Yes"],
            ["Retail app rebuild", "60,000", "Discovery done", "20%", "No"],
            ["SaaS support triage", "45,000", "Verbal yes", "80%", "Yes"],
            ["Bank innovation chatbot", "200,000", "Proposal sent", "40%", "No"],
          ],
        },
        fields: [
          { id: "plain", label: "Plain weighted pipeline", unit: "$", answer: 176000, tolerance: 1 },
          { id: "qualified", label: "Qualification-adjusted weighted pipeline", unit: "$", answer: 130000, tolerance: 1 },
          { id: "bank", label: "Adjusted weighted value of the bank deal", unit: "$", answer: 40000, tolerance: 1 },
        ],
        explanation:
          "Plain: 48,000 + 12,000 + 36,000 + 80,000 = 176,000. Adjusted: the retail and bank deals have no economic-buyer access, so 60,000 x 10% = 6,000 and 200,000 x 20% = 40,000; total 48,000 + 6,000 + 36,000 + 40,000 = 130,000. The biggest deal contributes the most risk, which is exactly what stage-only forecasts hide.",
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-i-upwork-jobs-connects",
      moduleId: "bd-intermediate",
      trackId: "bd",
      title: "Upwork Mastery I: Job Selection & Connects Strategy",
      summary:
        "On Upwork the scarce resources are Connects (the platform currency spent to submit proposals, and to boost them) and BD time, so the skill is choosing which jobs to bid on, not bidding on everything. Strong signals: a verified payment method, a hiring history with reasonable rates and good feedback left for freelancers, a specific job description that names the real problem, a budget that matches the scope, a recent posting with few proposals so far, and a fit with your agency's proven niche. Red flags: vague 'build me an app like X' posts with a tiny budget, requests for free sample work, clients who want to move off-platform immediately, and posts that have sat for weeks with dozens of proposals and no interviews.\n\nConnects pricing and rules change, so check the Upwork Help Center for current details rather than relying on old rules of thumb. The strategic idea is stable: track Connects spent against interviews and wins per job type, the same way you track cost per win for any channel. Boosting a proposal buys visibility, not fit; it pays off on jobs you were already likely to win and wastes Connects on long shots.\n\nSpeed matters because early proposals are seen first, which is why agencies set up saved searches and alerts for their niche. The gotcha is optimising for volume: hundreds of generic proposals train you to write generic proposals, burn Connects, and do nothing for the profile metrics (such as Job Success Score and talent badges) that drive future invitations.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Upwork Help: Understanding and using Connects", url: "https://support.upwork.com/hc/en-us/articles/211062898-Understanding-and-using-Connects", kind: "docs" },
        { label: "Upwork Help: Talent badges (Top Rated etc.)", url: "https://support.upwork.com/hc/en-us/articles/360049702614-Learn-about-Upwork-s-talent-badges", kind: "docs" },
        { label: "Upwork: How to boost your proposal", url: "https://www.upwork.com/resources/how-to-boost-proposal", kind: "article" },
      ],
      video: {
        title: "I sent 3,255 Upwork Proposals (Here's how to get clients)",
        channel: "Oliver",
        url: "https://www.youtube.com/watch?v=biofL6ndsOk",
        videoId: "biofL6ndsOk",
      },
      alternateVideos: [
        {
          title: "Upwork Connects Explained: How to Use, Buy & Get Free Connects (2026)",
          channel: "LobodaTech",
          url: "https://www.youtube.com/watch?v=g8OuZqYQQJ0",
          videoId: "g8OuZqYQQJ0",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-i-upwork-jobs-connects-q1",
          prompt: "What are Connects on Upwork?",
          options: [
            "The platform currency freelancers and agencies spend to submit, and optionally boost, proposals",
            "The number of clients you are connected to",
            "A rating clients give after a contract",
            "A fee clients pay to post jobs",
          ],
          correctIndex: 0,
          explanation: "Connects are spent to apply. That makes every proposal a small investment to be judged by return.",
        },
        {
          id: "bd-i-upwork-jobs-connects-q2",
          prompt: "Which client signals make a job worth bidding on? (Select all that apply.)",
          options: [
            "Payment method verified and a history of hires with good feedback left for freelancers",
            "A specific description of the problem with a budget that matches the scope",
            "Posted recently, with few proposals so far",
            "A request for a free sample project before any contract",
            "A $500 budget for 'an app like Uber with AI'",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Verified, experienced clients with clear, fairly budgeted, fresh posts convert best. Free-work requests and absurd budgets are red flags.",
        },
        {
          id: "bd-i-upwork-jobs-connects-q3",
          prompt: "When does boosting a proposal make the most sense?",
          options: [
            "On a high-fit job you are already well placed to win, where visibility is the main obstacle",
            "On every proposal, to maximise reach",
            "On long-shot jobs outside your niche, to improve the odds",
            "Only on jobs with more than 50 proposals",
          ],
          correctIndex: 0,
          explanation: "Boosting buys position, not fit. Spending extra Connects on weak-fit jobs just makes the losses more expensive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-upwork-jobs-connects-q4",
          prompt: "Why does responding quickly to new posts matter?",
          options: [
            "Early proposals are seen first, before the client is overwhelmed or has already started interviewing",
            "Upwork rejects proposals sent after 24 hours",
            "Late proposals cost twice the Connects",
            "It does not matter at all",
          ],
          correctIndex: 0,
          explanation: "Clients often start interviewing the first good proposals. Saved searches and alerts for your niche make speed repeatable.",
        },
        {
          id: "bd-i-upwork-jobs-connects-q5",
          prompt:
            "A job has been open for five weeks with 50+ proposals, the client has hired no one, and 'interviewing' shows 0. What should you infer?",
          options: [
            "The client may not be serious or ready, so this is likely a poor use of Connects",
            "It is a great opportunity because nobody has won it yet",
            "You should boost heavily to stand out",
            "The client is waiting for the cheapest bid",
          ],
          correctIndex: 0,
          explanation: "A long-open post with many proposals and no interviews signals a client who is not moving. Spend Connects where clients are actively hiring.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-upwork-jobs-connects-q6",
          prompt: "Which metric best tells you whether your Upwork bidding is working?",
          options: [
            "Connects (and BD time) spent per interview and per won contract, by job type",
            "Total proposals sent per week",
            "Number of jobs viewed",
            "Number of Connects remaining",
          ],
          correctIndex: 0,
          explanation: "Treat Upwork like any channel: cost per outcome. Volume alone hides waste.",
        },
        {
          id: "bd-i-upwork-jobs-connects-q7",
          prompt: "Why is it risky to rely on old Connects rules of thumb from forums?",
          options: [
            "Upwork changes how Connects are priced and used, so the current Help Center is the source of truth",
            "Forums are always wrong",
            "Connects have a fixed price that never changes",
            "Upwork bans users who read forums",
          ],
          correctIndex: 0,
          explanation: "Platform economics change. Check Upwork's own documentation before building a strategy on a specific number.",
        },
        {
          id: "bd-i-upwork-jobs-connects-q8",
          prompt: "What is the downside of sending hundreds of generic proposals? (Select all that apply.)",
          options: [
            "It burns Connects on low-probability jobs",
            "It trains the team to write generic proposals that clients skip",
            "It does nothing to build the profile metrics that bring invitations",
            "It guarantees a higher Job Success Score",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Volume without fit wastes money and habits. Job Success Score comes from client outcomes, not proposal counts.",
        },
        {
          id: "bd-i-upwork-jobs-connects-q9",
          prompt:
            "A client with no hires, no payment method and a brand-new account posts a well-written $40k AI job. What is the sensible approach?",
          options: [
            "It may still be real, but weigh it as higher risk: bid only if it is a strong fit and confirm payment verification before starting work",
            "Ignore it automatically",
            "Bid immediately and start work before the contract is funded",
            "Ask them to pay you outside Upwork",
          ],
          correctIndex: 0,
          explanation:
            "New clients are not automatically bad, but missing verification raises risk. Never start work before the contract is set up and funded on the platform.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "Your agency's niche is AI assistants and dashboards for SaaS and service businesses. Rank these Upwork posts from most to least worth your Connects.",
        items: [
          { id: "a", label: "Posted 1 hour ago, 3 proposals. Payment verified, 22 hires, 4.9 rating. 'Add AI ticket triage to our Zendesk-based SaaS support, ~$15-20k.'" },
          { id: "b", label: "Posted 2 days ago, 15 proposals. Payment verified, 5 hires. 'Analytics dashboard for our agency clients, React + Postgres, $8k.'" },
          { id: "c", label: "Posted today, 8 proposals. Payment unverified, 0 hires. 'Build an AI legal assistant, budget $30k, details on call.'" },
          { id: "d", label: "Posted 5 weeks ago, 50+ proposals, 0 interviewing. 'App like Instagram with AI filters, $1,000.'" },
          { id: "e", label: "Posted today, 2 proposals. Payment verified, 40 hires. 'Need a free sample screen before we decide who to hire for our app.'" },
        ],
        correctOrder: ["a", "b", "c", "e", "d"],
        explanation:
          "The Zendesk triage job is fresh, in-niche, well-budgeted and from a proven client. The dashboard is in-niche and verified but older and smaller. The legal assistant is interesting but unverified and vague, so it is a cautious bid. The free-sample request breaks good practice despite a good client. The stale Instagram clone with a tiny budget is the worst use of Connects.",
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-i-upwork-proposals-profile",
      moduleId: "bd-intermediate",
      trackId: "bd",
      title: "Upwork Mastery II: Tailored Proposals, Loom Videos & Profile Optimisation",
      summary:
        "Clients on Upwork skim dozens of proposals and usually see only the first couple of lines before deciding whether to open one, so the opening must prove you read *their* post: restate their problem in their words, name the specific risk or decision they face, and show the most relevant proof. Generic openers ('Dear hiring manager, I am an expert with 10 years...') are skipped. A strong proposal then gives a short plan (the first milestone, what you need from them), one or two genuinely relevant portfolio items, and a question that invites a reply. Answer the client's screening questions directly.\n\nA short personalised Loom video can lift reply rates because it is hard to fake: two minutes walking through their site, their current app or a sketch of the approach. The trade-off is time, so reserve it for high-fit jobs. For AI work, be honest about uncertainty in the proposal itself ('first milestone: test accuracy on 200 of your real tickets'); it reads as expertise, not weakness.\n\nThe profile does the selling before and after the proposal. Upwork's own guidance stresses a clear title, an overview that leads with client outcomes, a portfolio that matches the work you bid on, and specialised profiles for distinct services. Badges such as Rising Talent, Top Rated and Expert-Vetted come from track record and client feedback, so protect them: decline poor-fit jobs, set expectations in writing, and close contracts cleanly. The gotcha: one unhappy contract can hurt Job Success Score more than a lost bid ever would.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Upwork Help: Examples of great freelancer profiles", url: "https://support.upwork.com/hc/en-us/articles/211063208-See-examples-of-great-Upwork-freelancer-profiles", kind: "docs" },
        { label: "Upwork: How to create a proposal that wins jobs", url: "https://www.upwork.com/resources/how-to-create-a-proposal-that-wins-jobs", kind: "article" },
        { label: "Upwork: Freelancer profile tips", url: "https://www.upwork.com/resources/freelancer-profile-tips", kind: "article" },
        { label: "Loom: Personalize your sales video prospecting", url: "https://www.loom.com/use-case/sales", kind: "article" },
      ],
      video: {
        title: "Upwork Profile Optimization Masterclass (Complete guide)",
        channel: "Nico Hessel",
        url: "https://www.youtube.com/watch?v=CWobTmECeOo",
        videoId: "CWobTmECeOo",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-i-upwork-proposals-profile-q1",
          prompt: "Why do the first two lines of an Upwork proposal matter so much?",
          options: [
            "Clients scan many proposals and often decide from the preview whether to open one",
            "Upwork deletes proposals with weak openings",
            "Only the first two lines are sent to the client",
            "They set the Connects price",
          ],
          correctIndex: 0,
          explanation: "With dozens of proposals per job, the visible preview is your pitch to be read at all.",
        },
        {
          id: "bd-i-upwork-proposals-profile-q2",
          prompt: "Which opening is strongest for a post about 'AI to categorise 2,000 support tickets a day in Zendesk'?",
          options: [
            "'2,000 tickets a day is where manual tagging breaks; the real question is how accurate auto-categorisation is on your categories, so I'd start by testing it on a sample.'",
            "'Dear Hiring Manager, I am an expert AI developer with 10 years of experience.'",
            "'Hi, I have read your job and I can do it. Please check my profile.'",
            "'We are a top-rated agency with 50 developers and great reviews.'",
          ],
          correctIndex: 0,
          explanation: "Restating their exact problem and the real risk proves you read the post and know the work. The others could be pasted on any job.",
        },
        {
          id: "bd-i-upwork-proposals-profile-q3",
          prompt: "What belongs in a strong Upwork proposal body? (Select all that apply.)",
          options: [
            "A short plan for the first milestone and what you need from the client",
            "One or two portfolio items that closely match this job",
            "A question that invites a reply",
            "Your full list of every technology the agency has ever used",
            "A copy of your standard terms and conditions",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "A concrete plan, relevant proof and a question move the client to reply. Tech dumps and boilerplate bury the signal.",
        },
        {
          id: "bd-i-upwork-proposals-profile-q4",
          prompt: "When is a personalised Loom video worth the time?",
          options: [
            "On high-fit jobs where a two-minute walkthrough of the client's own product or approach sets you apart",
            "On every proposal, including long shots",
            "Only when the client asks for one",
            "Never, because clients do not watch videos",
          ],
          correctIndex: 0,
          explanation: "Personal video is persuasive because it is effortful; spend that effort where you have a real chance.",
        },
        {
          id: "bd-i-upwork-proposals-profile-q5",
          prompt:
            "An AI job asks for 'guaranteed 99% accuracy'. You cannot know that before testing their data. What should the proposal say?",
          options: [
            "Explain that accuracy depends on their data, propose a first milestone that measures it on a real sample, and agree the target from there",
            "Promise 99% to win the job",
            "Skip the job entirely",
            "Ignore the accuracy requirement in your proposal",
          ],
          correctIndex: 0,
          explanation:
            "An honest, measurable first step reads as expertise and protects your Job Success Score. Promising 99% and missing it creates a dispute.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-upwork-proposals-profile-q6",
          prompt: "What makes an Upwork profile overview effective?",
          options: [
            "It leads with the outcomes clients get and the niche you serve, backed by proof",
            "It starts with the agency's founding story",
            "It lists every service the agency could possibly provide",
            "It is left short so clients ask questions",
          ],
          correctIndex: 0,
          explanation: "Clients scan for 'can they solve my problem'. Outcomes and niche answer that; history and service lists do not.",
        },
        {
          id: "bd-i-upwork-proposals-profile-q7",
          prompt: "How are badges such as Top Rated earned?",
          options: [
            "Through track record on the platform, including client feedback and contract outcomes",
            "By paying a monthly fee",
            "By sending more proposals",
            "By completing a profile 100%",
          ],
          correctIndex: 0,
          explanation: "Upwork's talent badges reflect results and feedback, which is why protecting client outcomes matters more than volume.",
        },
        {
          id: "bd-i-upwork-proposals-profile-q8",
          prompt:
            "A client is unhappy mid-contract about a feature they never asked for in writing. What protects the agency's Job Success Score most?",
          options: [
            "Address it quickly, point to the agreed milestone scope, offer a priced change, and keep the conversation constructive",
            "Ignore the complaint and finish the original scope",
            "Do the extra work for free without discussing it",
            "Ask the client to close the contract early with no feedback",
          ],
          correctIndex: 0,
          explanation:
            "Clear, calm scope management with a priced option protects both margin and the relationship. Free work sets a precedent; ignoring it invites bad feedback.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-upwork-proposals-profile-q9",
          prompt: "Why use specialised profiles or separate portfolio sets for distinct services?",
          options: [
            "Clients hiring for AI assistants want to see AI-assistant proof, not a mix of every service",
            "Upwork requires one profile per technology",
            "It lets you bid twice on the same job",
            "It hides negative reviews",
          ],
          correctIndex: 0,
          explanation: "Relevance wins. Specialised profiles let each proposal link proof that matches the job.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write the opening of an Upwork proposal (the part the client sees before clicking 'more'), plus a one-line first-milestone plan and a closing question. Keep it under 110 words and use '[portfolio item]' as a placeholder for proof.",
        context:
          "Job post: 'We run a 30-person property-management company. Tenants email us maintenance requests (around 150/day) and our team re-types them into our ticketing system (Buildium). We want AI to read the emails and create the tickets with the right category and urgency. Budget $10-15k. Please tell us how you would handle emergencies like gas leaks.'",
        wordLimit: 120,
        rubric: [
          { id: "their-words", label: "Mirrors their problem", description: "Opens by restating their specific problem (150 emails a day re-typed into Buildium) rather than describing the agency.", weight: 2 },
          { id: "emergency", label: "Answers the emergency question", description: "Directly addresses how emergencies are handled (for example, urgent keywords flagged to a human immediately, never only to the AI).", weight: 2 },
          { id: "milestone", label: "Honest first milestone", description: "Proposes a concrete first milestone that tests accuracy on real emails or connects to Buildium's API before the full build.", weight: 1.5 },
          { id: "question", label: "Ends with a question", description: "Closes with a specific question that invites a reply.", weight: 1 },
          { id: "no-invention", label: "No invented claims", description: "Uses the placeholder for proof and makes no unverifiable promises such as guaranteed accuracy.", weight: 1 },
        ],
        sampleAnswer:
          "Re-typing 150 tenant emails a day into Buildium is exactly the work AI handles well, as long as emergencies never wait on it. Anything that looks urgent (gas, flooding, no heat) would be flagged to your on-call person instantly, and the AI only drafts the ticket.\n\nFirst milestone: connect to Buildium and test categorisation and urgency on 300 of your past emails, so you see the real accuracy before committing to the rest. [portfolio item]\n\nWhich categories cause your team the most re-work today?",
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-i-proposals-sows",
      moduleId: "bd-intermediate",
      trackId: "bd",
      title: "Writing Proposals & SOWs with Engineering",
      summary:
        "A proposal persuades; a statement of work (SOW) commits. The proposal restates the client's problem and its cost (from discovery), the outcome, the approach, proof, options and price. The SOW, usually under a master services agreement, defines exactly what will be delivered: scope and deliverables, explicit out-of-scope items, assumptions, milestones and acceptance criteria, client responsibilities (data, access, timely feedback), the change-request process, and payment terms. Most agency disputes trace back to a SOW that was vague in one of those places.\n\nBD should never write either alone. Engineering owns the estimate and the technical assumptions; BD owns the client's language, the commercial structure and the narrative. Pair on it: BD drafts the problem and outcome from discovery notes, engineering reviews scope, assumptions and risks, and both check that nothing the client heard on a call is missing or overpromised in writing.\n\nAI work needs extra care. Do not promise model accuracy as an acceptance criterion without a measured baseline; instead phase the work (a discovery or proof-of-concept phase with a measurable evaluation set, then the build), state which model provider and data sources are assumed, and treat model usage costs as a separate, pass-through or estimated line. A phased structure is also how many public-sector teams run digital services (discovery, then alpha, then beta), which buyers recognise. The gotcha: 'the AI will understand all customer questions' looks harmless in a proposal and becomes an unbounded obligation in a SOW.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "GOV.UK Service Manual: Agile delivery (phases)", url: "https://www.gov.uk/service-manual/agile-delivery", kind: "docs" },
        { label: "PMI: Higher-quality SOWs for outsourced software projects", url: "https://www.pmi.org/learning/library/framework-delivering-higher-quality-statements-work-6012", kind: "article" },
        { label: "Atlassian: What is a statement of work", url: "https://www.atlassian.com/work-management/knowledge-sharing/documentation/what-is-statement-of-work", kind: "article" },
        { label: "HubSpot: The proposal response formula (agency)", url: "https://blog.hubspot.com/agency/proposal-formula", kind: "article" },
      ],
      video: {
        title: "How to Write a Business Proposal Step-by-Step with FREE Template",
        channel: "HubSpot Marketing",
        url: "https://www.youtube.com/watch?v=2j3cKR28r5Q",
        videoId: "2j3cKR28r5Q",
      },
      alternateVideos: [
        {
          title: "Key Insights into MSA and SOW",
          channel: "247Digitize",
          url: "https://www.youtube.com/watch?v=HaoOPubX4uo",
          videoId: "HaoOPubX4uo",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-i-proposals-sows-q1",
          prompt: "What is the main difference between a proposal and a SOW?",
          options: [
            "A proposal persuades the client to buy; a SOW defines exactly what will be delivered and on what terms",
            "They are the same document with different names",
            "A SOW is the marketing version of a proposal",
            "A proposal is legally binding; a SOW is not",
          ],
          correctIndex: 0,
          explanation: "The proposal sells the approach; the SOW is the commitment that delivery is measured against.",
        },
        {
          id: "bd-i-proposals-sows-q2",
          prompt: "Which sections should every SOW for a software project include? (Select all that apply.)",
          options: [
            "Explicit out-of-scope items",
            "Acceptance criteria for each milestone",
            "Client responsibilities such as data access and feedback turnaround",
            "The change-request process",
            "The agency's internal hourly cost of each engineer",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Exclusions, acceptance criteria, client responsibilities and change control are where disputes are prevented. Internal costs are confidential and do not belong in the SOW.",
        },
        {
          id: "bd-i-proposals-sows-q3",
          prompt: "Who should own the estimate and the technical assumptions in a proposal?",
          options: ["Engineering, reviewed with BD", "BD alone", "The client", "Finance alone"],
          correctIndex: 0,
          explanation: "Engineering knows what the work takes. BD shapes the commercial structure and language, and checks nothing promised on calls is missing.",
        },
        {
          id: "bd-i-proposals-sows-q4",
          prompt:
            "A draft SOW's acceptance criterion reads: 'The AI assistant will correctly answer customer questions.' What is wrong with it?",
          options: [
            "It is unbounded and unmeasurable: no question set, no accuracy target, no test method",
            "Nothing, it is clear enough",
            "It should say 'quickly answer' instead",
            "Acceptance criteria should never mention AI",
          ],
          correctIndex: 0,
          explanation:
            "A criterion must be testable. A better version names an evaluation set, a target agreed after the pilot, and how results are measured.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-proposals-sows-q5",
          prompt: "Why phase an AI platform SOW (discovery or proof of concept, then build)?",
          options: [
            "The first phase produces measured evidence (accuracy on real data, integration feasibility) that makes the build's scope and price defensible",
            "Phases make the project more expensive, which improves margin",
            "So the client can cancel without paying",
            "Because AI cannot be built in one phase technically",
          ],
          correctIndex: 0,
          explanation: "Phasing turns unknowns into knowns before the large commitment, protecting both sides.",
        },
        {
          id: "bd-i-proposals-sows-q6",
          prompt: "How should model usage costs (per-token API charges) be handled in a proposal?",
          options: [
            "As a separate estimated or pass-through line, with the assumptions behind the estimate",
            "Hidden inside the fixed build price",
            "Left out, since the client will find out later",
            "Promised as zero",
          ],
          correctIndex: 0,
          explanation: "Usage costs depend on volume the agency does not control, so they should be visible and estimated, not buried in a fixed price.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-proposals-sows-q7",
          prompt: "Where should the proposal's problem statement come from?",
          options: [
            "The discovery notes and recap, in the client's own words and numbers",
            "The agency's standard template, unchanged",
            "The client's website",
            "A competitor's proposal",
          ],
          correctIndex: 0,
          explanation: "Quoting their pain and its cost back to them shows you listened and anchors the price to value.",
        },
        {
          id: "bd-i-proposals-sows-q8",
          prompt: "Which client responsibilities commonly delay AI projects if not written into the SOW? (Select all that apply.)",
          options: [
            "Providing access to the data or documents the AI needs",
            "Named reviewers who give feedback within an agreed time",
            "Providing API credentials or sandbox access for integrated systems",
            "Choosing the agency's internal tools",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Data, feedback and system access are the usual blockers. Writing them in lets the timeline move fairly when they are late.",
        },
        {
          id: "bd-i-proposals-sows-q9",
          prompt:
            "On a call, the client's CEO was told 'we can add Arabic later, no problem.' The SOW draft says nothing about language. What should BD do?",
          options: [
            "Raise it with engineering and write the decision into the SOW, either as an assumption ('English only') or as a priced option",
            "Leave it out; it was just a casual remark",
            "Add 'all languages supported' to be safe",
            "Wait for the client to bring it up after signing",
          ],
          correctIndex: 0,
          explanation:
            "Anything said on a call that is not in writing becomes a dispute. Make the decision explicit either way.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-proposals-sows-q10",
          prompt: "Why do many agencies keep legal terms in a master services agreement and project specifics in each SOW?",
          options: [
            "Terms like liability, IP and confidentiality are negotiated once, so each new project only needs a short SOW",
            "SOWs are not allowed to contain any terms",
            "It hides the terms from the client",
            "MSAs replace the need for scope",
          ],
          correctIndex: 0,
          explanation: "An MSA plus SOWs speeds up repeat work: legal is settled once, and each project's scope is defined on its own.",
        },
      ],
      practice: {
        kind: "spot",
        prompt: "This is an excerpt from a proposal and SOW for an AI document-search platform. Mark the lines that would cause problems in delivery or a dispute.",
        segments: [
          { id: "p1", text: "Problem: your legal team spends about 20 hours a week searching 60,000 contracts for renewal and liability clauses.", issue: null },
          { id: "p2", text: "Outcome: lawyers find relevant clauses in minutes, with links to the source documents.", issue: null },
          { id: "p3", text: "Phase 1 (3 weeks): proof of concept on 2,000 contracts, measuring answer accuracy on 150 agreed test questions.", issue: null },
          { id: "p4", text: "Phase 2: full build. The AI will understand any question about any contract.", issue: "Unbounded, unmeasurable promise that cannot be accepted or tested." },
          { id: "p5", text: "Acceptance: Phase 2 is accepted when the client is happy with the result.", issue: "Subjective acceptance criterion with no test or target." },
          { id: "p6", text: "Assumptions: contracts are text-searchable PDFs in English; integration with SharePoint via its standard API.", issue: null },
          { id: "p7", text: "Out of scope: none.", issue: "No exclusions listed, so every later request looks in scope." },
          { id: "p8", text: "Client responsibilities: provide SharePoint access and a named reviewer who responds within 3 business days.", issue: null },
          { id: "p9", text: "Price: fixed $65,000 for both phases, including all model usage for the life of the platform.", issue: "Open-ended model usage cost bundled into a fixed price." },
          { id: "p10", text: "Changes: requests outside this scope are estimated and approved in writing before work starts.", issue: null },
          { id: "p11", text: "Payment: 30% on signature, 30% at Phase 1 sign-off, 40% on Phase 2 acceptance.", issue: null },
          { id: "p12", text: "Timeline: Phase 2 will finish 8 weeks after Phase 1 sign-off.", issue: null },
        ],
        askExplanation: true,
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-i-pricing-models",
      moduleId: "bd-intermediate",
      trackId: "bd",
      title: "Pricing Models: Fixed Price, Time & Materials, Retainer & Dedicated Team",
      summary:
        "The pricing model decides who carries the risk. *Fixed price* gives the client certainty and puts scope and estimation risk on the agency, so it only works when scope is well understood, and the agency must price in contingency and enforce change control. *Time and materials* (T&M) bills actual hours at agreed rates, so the client carries the risk and gains flexibility; it suits evolving scope and discovery-heavy work, but buyers need budget caps, regular reporting and trust. A *retainer* buys a set amount of capacity or service each month (maintenance, ongoing improvements) and smooths revenue for the agency. A *dedicated team* is a monthly fee for named people working as an extension of the client's team, which suits long roadmaps where the client wants control of priorities.\n\nHybrids are common and often best: a fixed-price discovery or proof of concept, then T&M with a cap or fixed-price milestones for the build, then a retainer for maintenance. AI platforms push toward hybrids because the hardest part (accuracy on the client's data) is unknown until tested, and model usage is a variable cost that should be passed through or estimated separately rather than absorbed into a fixed fee.\n\nGotchas: a fixed price on vague scope is a loss waiting to happen; T&M without caps or visibility erodes trust even when the work is good; and a 'dedicated team' sold without a clear product owner on the client side drifts. Choose the model from the scope's certainty and the client's need for control, not from what is easiest to sell today.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Claude Docs: Pricing (usage-based model costs)", url: "https://platform.claude.com/docs/en/about-claude/pricing", kind: "docs" },
        { label: "ProjectManager: Fixed-price contract", url: "https://www.projectmanager.com/blog/fixed-price-contract", kind: "article" },
        { label: "ProjectManager: Time and materials contract", url: "https://www.projectmanager.com/blog/time-and-materials-contract", kind: "article" },
        { label: "Productive.io: Professional services pricing models", url: "https://productive.io/blog/professional-services-pricing-models/", kind: "article" },
      ],
      video: {
        title: "Best Outsourcing Model Explained: Dedicated Team vs Fixed Price vs Time & Material",
        channel: "Future Dev Lab",
        url: "https://www.youtube.com/watch?v=OaJQOww9hO4",
        videoId: "OaJQOww9hO4",
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
          id: "bd-i-pricing-models-q1",
          prompt: "Under a fixed-price contract, who carries most of the estimation risk?",
          options: ["The agency", "The client", "It is split equally by law", "The platform the deal came from"],
          correctIndex: 0,
          explanation: "The client pays the agreed price regardless of hours, so overruns come out of the agency's margin unless they are valid change requests.",
        },
        {
          id: "bd-i-pricing-models-q2",
          prompt: "Which situation best suits time and materials?",
          options: [
            "Scope that will evolve as the client learns from early releases",
            "A small, fully specified landing page",
            "A client with a fixed, non-negotiable budget and no tolerance for variance",
            "A white-label app with standard configuration",
          ],
          correctIndex: 0,
          explanation: "T&M trades price certainty for flexibility, which fits evolving scope. Well-specified or budget-locked work suits fixed price.",
        },
        {
          id: "bd-i-pricing-models-q3",
          prompt: "Which safeguards make T&M acceptable to a cautious buyer? (Select all that apply.)",
          options: [
            "A budget cap or not-to-exceed amount with an agreed process before exceeding it",
            "Weekly reporting of hours and progress against priorities",
            "Clear rates per role agreed up front",
            "No reporting until the project ends",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Caps, visibility and agreed rates give the client control. Silence until the end is what makes buyers fear T&M.",
        },
        {
          id: "bd-i-pricing-models-q4",
          prompt:
            "A prospect wants a fixed price for 'an AI assistant that handles all our customer conversations'. There is no data audit and no accuracy target. What is the best structure?",
          options: [
            "A fixed-price proof of concept to measure accuracy on real conversations, then a build priced on the evidence",
            "A single fixed price for the whole platform, with a large hidden buffer",
            "Unlimited T&M with no cap",
            "Decline because AI cannot be priced",
          ],
          correctIndex: 0,
          explanation:
            "Fixing the price on the unknown part is gambling. A small fixed-price experiment gives the client certainty for that phase and gives both sides evidence for the build price.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-pricing-models-q5",
          prompt: "What is a retainer typically used for in an agency?",
          options: [
            "A set amount of ongoing capacity or service each month, such as maintenance and incremental improvements",
            "A deposit that is refunded at the end of a project",
            "A penalty paid for late delivery",
            "A one-off discovery workshop",
          ],
          correctIndex: 0,
          explanation: "Retainers buy recurring capacity and create predictable revenue for the agency after launch.",
        },
        {
          id: "bd-i-pricing-models-q6",
          prompt: "What does a dedicated-team model need on the client side to work well?",
          options: [
            "A product owner who sets priorities and is available to the team",
            "Nothing; the agency decides everything",
            "A fixed list of every feature for the next year",
            "A legal team on every call",
          ],
          correctIndex: 0,
          explanation: "A dedicated team is an extension of the client's team. Without someone setting priorities it drifts and the client questions the value.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-pricing-models-q7",
          prompt: "Why should model API usage usually be a separate line from the build fee?",
          options: [
            "It scales with usage the agency does not control, so bundling it into a fixed fee transfers open-ended risk to the agency",
            "Because API costs are always negligible",
            "Because clients prefer longer invoices",
            "Because providers forbid agencies from paying for usage",
          ],
          correctIndex: 0,
          explanation: "Usage-based costs belong where they can be estimated and adjusted, typically pass-through or a usage line with stated assumptions.",
        },
        {
          id: "bd-i-pricing-models-q8",
          prompt: "Which are typical stages of a hybrid engagement for an AI platform? (Select all that apply.)",
          options: [
            "Fixed-price discovery or proof of concept",
            "Build under capped T&M or fixed-price milestones",
            "Retainer for maintenance, monitoring and model updates",
            "A single upfront payment covering all future years",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Each stage uses the model that matches its uncertainty. A single upfront payment for indefinite future work ignores ongoing cost.",
        },
        {
          id: "bd-i-pricing-models-q9",
          prompt:
            "Mid-way through a fixed-price project, the client asks for 'one small extra report'. It would take three days. What is the right move?",
          options: [
            "Log it as a change request with an estimate and price, or agree to swap it for something of equal size in scope",
            "Do it quietly to keep the client happy",
            "Refuse to discuss it",
            "Add it and bill for it at the end without telling them",
          ],
          correctIndex: 0,
          explanation:
            "Fixed price only works with change control. A priced change or an explicit trade keeps the relationship and the margin intact; quiet extras compound.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-pricing-models-q10",
          prompt: "Why is fixed price attractive to many buyers despite the agency's risk premium?",
          options: [
            "It gives budget certainty and makes internal approval easier",
            "It is always cheaper overall",
            "It removes the need for a SOW",
            "It lets them change scope freely",
          ],
          correctIndex: 0,
          explanation: "Certainty has value to buyers, which is why agencies can charge a premium for carrying the risk. It does not make scope changes free.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "A client is choosing between pricing options for a six-month AI platform build. Engineering expects about 1,600 hours, with a realistic range up to 2,000 hours. Blended rate $50/hour. Answer the fields below.",
        table: {
          columns: ["Option", "Terms"],
          rows: [
            ["Fixed price", "Agency prices the expected hours plus a 25% risk premium"],
            ["T&M with cap", "Billed at actual hours, capped at 1,900 hours"],
            ["Dedicated team", "3 people for 6 months at $8,500 per person per month"],
          ],
        },
        fields: [
          { id: "fixed", label: "Fixed price", unit: "$", answer: 100000, tolerance: 1 },
          { id: "tm-expected", label: "T&M cost if the work takes the expected 1,600 hours", unit: "$", answer: 80000, tolerance: 1 },
          { id: "tm-worst", label: "T&M cost to the client if the work takes 2,000 hours", unit: "$", answer: 95000, tolerance: 1 },
          { id: "team", label: "Dedicated team total", unit: "$", answer: 153000, tolerance: 1 },
          { id: "fixed-effective-rate", label: "Agency's effective hourly rate under the fixed price if the work takes 2,000 hours", unit: "$/h", answer: 50, tolerance: 0.5 },
        ],
        explanation:
          "Fixed: 1,600 x $50 = $80,000, x 1.25 = $100,000. T&M expected: $80,000. At 2,000 hours, the cap limits billing to 1,900 x $50 = $95,000, so the agency absorbs 100 hours. Dedicated team: 3 x $8,500 x 6 = $153,000 (more capacity, client controls priorities). Under fixed price at 2,000 hours, $100,000 / 2,000 = $50/h: the 25% premium was the entire buffer, and any further overrun pushes the agency below its rate.",
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-i-objection-handling",
      moduleId: "bd-intermediate",
      trackId: "bd",
      title: "Objection Handling",
      summary:
        "An objection is information: the buyer is telling you what still stands between them and a yes. The common agency objections are price ('another agency quoted half'), timing ('not this quarter'), risk ('we were burned by an offshore team'), capability ('have you done this in our industry?'), and, for AI work, trust ('AI makes things up' or 'our data is too sensitive'). The reliable pattern is to acknowledge the concern without arguing, ask a question to find the real objection beneath the stated one, respond with specific evidence or a change in structure, and confirm it is resolved. Salesforce's Trailhead frames it as defuse, discover, deliver.\n\nThe trade-off is between handling and preventing. Most objections that appear late were knowable in discovery: if you never asked about budget, decision process or past bad experiences, they surface as objections at the proposal stage. Raising likely concerns yourself ('you may be wondering how we handle wrong AI answers') often defuses them before they harden.\n\nThe gotchas: discounting as the first response to a price objection (it confirms the price was padded and trains the buyer to push), arguing with the buyer's experience, and treating 'let me think about it' as a real answer instead of asking what specifically they need to think through. For AI trust objections, the strongest responses are structural, not rhetorical: a pilot on their data, human review for high-stakes outputs, and clear data-handling terms.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Salesforce Trailhead: Learn how to handle common objections", url: "https://trailhead.salesforce.com/content/learn/modules/objection-handling-strategies/learn-how-to-handle-common-objections", kind: "docs" },
        { label: "Salesforce Trailhead: Learn how to discover objections", url: "https://trailhead.salesforce.com/content/learn/modules/objection-handling-strategies/learn-how-to-discover-objections", kind: "docs" },
        { label: "HubSpot: Handling common sales objections", url: "https://blog.hubspot.com/sales/handling-common-sales-objections", kind: "article" },
        { label: "Gong: Sales objections", url: "https://www.gong.io/blog/sales-objections", kind: "article" },
      ],
      video: {
        title: "42.5 Minutes of Cold Call Objection Handling Tips & Roleplays",
        channel: "30 Minutes to President’s Club",
        url: "https://www.youtube.com/watch?v=4Gwt4w4Ran4",
        videoId: "4Gwt4w4Ran4",
      },
      alternateVideos: [
        {
          title: "How To Prevent Every Sales Objection (Full Masterclass)",
          channel: "Jeremy Miner",
          url: "https://www.youtube.com/watch?v=_YEpn6s6DIY",
          videoId: "_YEpn6s6DIY",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-i-objection-handling-q1",
          prompt: "What is the best first response to 'Another agency quoted us half your price'?",
          options: [
            "Acknowledge it and ask what the other quote includes, so you can compare scope, team and assumptions",
            "Immediately offer a 50% discount",
            "Say the other agency is bad",
            "End the conversation",
          ],
          correctIndex: 0,
          explanation: "Quotes that differ that much usually differ in scope or assumptions. Discovering that lets you compare like with like instead of cutting price.",
        },
        {
          id: "bd-i-objection-handling-q2",
          prompt: "Why is discounting a poor first response to a price objection?",
          options: [
            "It suggests the price was padded and teaches the buyer that pushing works",
            "Discounts are illegal in B2B contracts",
            "It always loses the deal",
            "It makes the proposal longer",
          ],
          correctIndex: 0,
          explanation: "Price moves should be traded for something (scope, terms, timing), not given away on the first push.",
        },
        {
          id: "bd-i-objection-handling-q3",
          prompt: "Which are good structural answers to 'AI makes things up, we can't risk it'? (Select all that apply.)",
          options: [
            "A pilot on their own data with an agreed evaluation set",
            "Human review for high-stakes outputs before they reach customers",
            "Answers grounded in their documents, with source links",
            "Assuring them that modern AI no longer makes mistakes",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Evidence, human oversight and grounding address the real risk. Claiming AI does not err is false and destroys trust.",
        },
        {
          id: "bd-i-objection-handling-q4",
          prompt: "The prospect says, 'Let me think about it.' What is the most useful response?",
          options: [
            "'Of course. So I can help, what specifically do you need to think through: the price, the timing, or something else?'",
            "'Sure, I'll follow up in a month.'",
            "'This offer expires today.'",
            "'There's nothing to think about; it's a great deal.'",
          ],
          correctIndex: 0,
          explanation: "'Let me think about it' usually hides a specific concern. Asking politely surfaces it while you can still address it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-objection-handling-q5",
          prompt: "What does 'defuse, discover, deliver' describe?",
          options: [
            "Acknowledge the concern and emotion, ask questions to find the real issue, then respond",
            "Lower the price, find a new buyer, deliver the project",
            "Ignore the objection, discover a new feature, deliver a demo",
            "Delay, defer, decline",
          ],
          correctIndex: 0,
          explanation: "It is Trailhead's three-step objection-handling frame: calm the moment, understand the real issue, then answer it.",
        },
        {
          id: "bd-i-objection-handling-q6",
          prompt:
            "A CTO says, 'We were burned by an offshore agency that missed every deadline.' What is the strongest response?",
          options: [
            "Ask what went wrong specifically, then show how your process addresses those points (milestones, demos every two weeks, a named lead, access to the code)",
            "Tell them your agency is different and never misses deadlines",
            "Offer a discount to compensate for their past experience",
            "Change the subject to your portfolio",
          ],
          correctIndex: 0,
          explanation:
            "Their bad experience is specific; a generic reassurance is not. Mapping your process to what failed them is credible and verifiable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-objection-handling-q7",
          prompt: "How can many late-stage objections be prevented?",
          options: [
            "By asking about budget, decision process, risks and past experiences in discovery, and raising likely concerns proactively",
            "By sending the proposal faster",
            "By not mentioning risks at all",
            "By lowering the price before anyone asks",
          ],
          correctIndex: 0,
          explanation: "Objections that surface late were usually knowable early. Bringing them up yourself takes their sting out.",
        },
        {
          id: "bd-i-objection-handling-q8",
          prompt: "Which are legitimate trades when a buyer genuinely cannot meet the price? (Select all that apply.)",
          options: [
            "Reduce scope to fit the budget, keeping the most valuable features",
            "Phase the work so the first phase fits this quarter's budget",
            "Adjust terms, such as a longer timeline with a smaller team",
            "Keep the full scope and cut the price, absorbing the loss",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Scope, phasing and terms are real trades. Cutting price on the same scope just moves the problem into delivery.",
        },
        {
          id: "bd-i-objection-handling-q9",
          prompt:
            "A healthcare prospect says, 'Our patient data can't leave our environment.' The agency's usual design sends data to a hosted model API. What is the right move?",
          options: [
            "Take it seriously, ask what their compliance requirements are, and bring engineering in to discuss options such as provider data terms, regional hosting or deploying within their environment",
            "Reassure them that all AI providers are secure",
            "Promise to anonymise everything without checking feasibility",
            "Drop the opportunity immediately",
          ],
          correctIndex: 0,
          explanation:
            "A data-residency objection is a real requirement, not a negotiating tactic. Understand the rules and let engineering propose a compliant architecture before promising anything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Reply to the prospect's email below. Acknowledge the concern, ask one question to understand it, and offer a concrete way forward. Do not cut the price outright. Under 130 words.",
        context:
          "From: Raj, Head of Operations, 80-person logistics company. 'Thanks for the proposal. Honestly, $48k feels steep. Another agency said they could do the AI booking assistant for $25k. Also, I'm nervous: what if the AI books the wrong shipment?'",
        wordLimit: 140,
        rubric: [
          { id: "acknowledge", label: "Acknowledges without arguing", description: "Recognises both concerns (price and wrong bookings) respectfully, without criticising the other agency.", weight: 1 },
          { id: "discover", label: "Asks a discovering question", description: "Asks what the other quote includes (scope, integrations, testing, support) so the comparison is fair.", weight: 1.5 },
          { id: "risk", label: "Structural answer to AI risk", description: "Addresses wrong bookings with structure: human confirmation, pilot accuracy testing, limits, not just reassurance.", weight: 2 },
          { id: "trade", label: "Trades, not discounts", description: "Offers a scope, phasing or pilot option instead of simply lowering the price.", weight: 1.5 },
          { id: "next-step", label: "Clear next step", description: "Ends with a specific next step such as a short call to compare scopes.", weight: 1 },
        ],
        sampleAnswer:
          "Hi Raj,\n\nThanks for being direct; both points are fair.\n\nOn price: quotes that far apart usually cover different things. Does the $25k include the integration with your TMS, testing on your real booking emails, and support after launch? If you can share the scope, I'll compare line by line.\n\nOn wrong bookings: the assistant would draft each booking for one-click confirmation by your team at first, and we'd measure its accuracy on 300 of your past emails before anything goes live.\n\nIf budget is the constraint, we could start with that accuracy pilot as a smaller first phase.\n\nWould a 20-minute call on Thursday work to go through it?\n\nBest,\nAlex",
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-i-follow-up-cadences",
      moduleId: "bd-intermediate",
      trackId: "bd",
      title: "Follow-Up Cadences That Add Value",
      summary:
        "Most deals and most outbound replies come after several touches, not the first one, so follow-up is a system, not an afterthought. A cadence is a planned sequence of touches across channels (email, LinkedIn, phone, a short video) with set spacing, each one carrying something new: a relevant case study, an insight about their industry, a short answer to a question raised on the call, a deadline that genuinely matters to them. 'Just checking in' adds nothing and trains the buyer to ignore you.\n\nThere are two different cadences to design. Prospecting cadences start conversations with people who have not engaged; they run over a couple of weeks with gradually wider spacing and end with a polite close-the-loop message. Deal cadences follow a proposal or a call; they should be anchored to a next step the buyer agreed to ('we'll review it with finance on Tuesday'), so the follow-up is expected rather than chasing. Tools such as HubSpot sequences automate the timing and stop automatically when the prospect replies or books a meeting.\n\nGotchas: automation that keeps firing after someone has replied or opted out (a compliance problem as well as an embarrassment); identical messages on every channel; and following up on silence forever instead of closing the loop. A respectful final message ('I'll assume this isn't a priority right now and close my notes; reply anytime if that changes') often gets the reply that five check-ins did not, and keeps the CRM honest.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "HubSpot Knowledge Base: Create and edit sequences", url: "https://knowledge.hubspot.com/sequences/create-and-edit-sequences", kind: "docs" },
        { label: "HubSpot: Sales sequences best practices", url: "https://blog.hubspot.com/sales/sales-sequence", kind: "article" },
        { label: "Gong: How to create a winning sales cadence", url: "https://www.gong.io/blog/sales-cadence", kind: "article" },
        { label: "HubSpot: Prospecting touchpoints - quantity, timing, type", url: "https://blog.hubspot.com/sales/the-ultimate-guide-to-prospecting-how-many-touchpoints-when-and-what-type", kind: "article" },
      ],
      video: {
        title: "Use This Cold Email Sequence to 3x Your Replies in 2026",
        channel: "30 Minutes to President’s Club",
        url: "https://www.youtube.com/watch?v=f1FdxGD_aY4",
        videoId: "f1FdxGD_aY4",
      },
      alternateVideos: [
        {
          title: "Never Say “Just Following Up” on a Sales Call (Say This Instead)",
          channel: "Jeremy Miner",
          url: "https://www.youtube.com/watch?v=MYgXS_zTfdo",
          videoId: "MYgXS_zTfdo",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-i-follow-up-cadences-q1",
          prompt: "Which follow-up email adds the most value?",
          options: [
            "'You mentioned onboarding takes six weeks; here's a two-minute summary of how a similar firm cut it to two.'",
            "'Just checking in on my last email.'",
            "'Bumping this to the top of your inbox.'",
            "'Did you get a chance to look at my proposal?'",
          ],
          correctIndex: 0,
          explanation: "A follow-up should carry something new and relevant to them. 'Checking in' and 'bumping' ask for attention without giving a reason.",
        },
        {
          id: "bd-i-follow-up-cadences-q2",
          prompt: "What makes a deal follow-up feel expected rather than chasing?",
          options: [
            "It is anchored to a next step the buyer agreed to on the call",
            "It is sent at exactly 9am",
            "It includes the full proposal again",
            "It uses a different email address",
          ],
          correctIndex: 0,
          explanation: "When the buyer agreed 'review with finance on Tuesday', a Wednesday follow-up is part of the plan, not pressure.",
        },
        {
          id: "bd-i-follow-up-cadences-q3",
          prompt: "Which are features of a well-built prospecting cadence? (Select all that apply.)",
          options: [
            "Several touches across channels such as email, LinkedIn and phone",
            "Each touch carries a different, relevant reason to reply",
            "It stops automatically when the prospect replies or books a meeting",
            "Identical messages sent on every channel on the same day",
            "It runs indefinitely until the prospect responds",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Multi-channel, varied and self-stopping is the pattern. Duplicates feel automated, and endless sequences become spam.",
        },
        {
          id: "bd-i-follow-up-cadences-q4",
          prompt:
            "A prospect replied 'not interested, please stop' to step 2, but the sequence tool was set to continue on replies, so step 3 went out. What are the problems? (Select all that apply.)",
          options: [
            "It ignored an opt-out, which is a compliance risk under anti-spam rules",
            "It damages the agency's reputation with that prospect and their network",
            "The sequence should have been configured to stop on any reply",
            "Nothing, as long as step 3 was well written",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Continuing after an opt-out breaks the rules and the relationship. Sequences should unenrol on reply and sync opt-outs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-follow-up-cadences-q5",
          prompt: "What is a 'close-the-loop' (break-up) message for?",
          options: [
            "Politely ending the sequence so the buyer can re-engage on their terms, while keeping the CRM honest",
            "Threatening to withdraw the offer",
            "Asking the buyer to explain why they ignored you",
            "Sending a final discount",
          ],
          correctIndex: 0,
          explanation: "A respectful final note often prompts a reply and lets you close the deal as lost or nurture instead of chasing forever.",
        },
        {
          id: "bd-i-follow-up-cadences-q6",
          prompt: "How should spacing between prospecting touches usually change over a cadence?",
          options: [
            "Closer together at first, then gradually wider",
            "Equal gaps of one day for a month",
            "Wider at first, then several in one day at the end",
            "Random, so it looks natural",
          ],
          correctIndex: 0,
          explanation: "Early touches catch interest while the first one is fresh; later ones space out to avoid feeling like pressure.",
        },
        {
          id: "bd-i-follow-up-cadences-q7",
          prompt:
            "You sent a proposal Monday. On the call, the buyer said legal review takes two weeks. On Wednesday your manager tells you to follow up daily. What do you do?",
          options: [
            "Explain the agreed timeline, offer legal anything that speeds review now, and schedule a check-in for when review should finish",
            "Follow up daily as instructed",
            "Send nothing until they reply",
            "Email the buyer's CEO to speed things up",
          ],
          correctIndex: 0,
          explanation:
            "Daily chasing during an agreed review period erodes goodwill. Helping legal and checking in at the agreed point respects the buyer's process.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-follow-up-cadences-q8",
          prompt: "Why vary channels within a cadence?",
          options: [
            "Buyers respond on different channels, and a varied touch (a call or short video) stands out from email",
            "Because email is illegal after the second touch",
            "To send more messages per day",
            "Because CRMs require it",
          ],
          correctIndex: 0,
          explanation: "Different people prefer different channels, and a change of medium gets noticed.",
        },
        {
          id: "bd-i-follow-up-cadences-q9",
          prompt: "What should the BD rep record in the CRM after each follow-up touch?",
          options: [
            "What was sent, any response, and the next dated step",
            "Nothing, since the sequence tool logs it",
            "Only replies, not unanswered touches",
            "The rep's opinion of the buyer",
          ],
          correctIndex: 0,
          explanation: "A clear history and next step lets anyone pick up the deal and keeps follow-ups from overlapping across the team.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write the follow-up email for the situation below. It must add something new, reference what the buyer agreed to, and end with one easy question. No 'just checking in'. Under 100 words.",
        context:
          "Ten days ago you sent Maya (VP Customer Success, SaaS, 120 staff) a proposal for an AI ticket-triage pilot ($18k, 4 weeks). On the call she said she would discuss it with her CFO 'next week', and her concern was whether agents would trust the AI's categories. No reply since. You have a one-page summary of how a similar support team ran a trust-building rollout (AI suggests, agent confirms, for the first two weeks).",
        wordLimit: 110,
        rubric: [
          { id: "new-value", label: "Adds something new", description: "Shares the rollout summary or a specific idea tied to her stated concern about agent trust.", weight: 2 },
          { id: "anchor", label: "Anchored to her process", description: "References her plan to discuss it with the CFO, without guilt-tripping or pressure.", weight: 1.5 },
          { id: "easy-ask", label: "One easy question", description: "Ends with a single low-effort question (for example, whether anything would help the CFO conversation).", weight: 1 },
          { id: "tone", label: "Concise and respectful", description: "Under the word limit, no 'just checking in', no pushy deadlines.", weight: 1 },
        ],
        sampleAnswer:
          "Subject: agent trust in the triage pilot\n\nHi Maya,\n\nYou mentioned agents might not trust the AI's categories. Attached is a one-page summary of how a similar support team handled that: for the first two weeks the AI only suggests, agents confirm, and the team sees accuracy climb before anything is automated.\n\nIt might be useful for your conversation with your CFO. Is there anything else they would want to see before deciding on the pilot?\n\nBest,\nAlex",
      },
    },
    // ------------------------------------------------------------------
    {
      id: "bd-i-running-demos",
      moduleId: "bd-intermediate",
      trackId: "bd",
      title: "Running Demos That Sell",
      summary:
        "A demo is not a feature tour; it is evidence that you can solve the specific problem discovery uncovered. The structure that works: restate their situation and what they told you matters, confirm the agenda and what they want to see, show the two or three workflows that map directly to their pains (ideally with their data or a realistic replica of it), pause to ask questions rather than talk for 40 minutes, and end with an agreed next step. Showing the outcome first ('here's the claim summary your adjusters would get') before the setup behind it keeps attention on value.\n\nAgencies have a twist: often there is no product to demo, only past work and prototypes. Options include a white-label base configured for the prospect, a clickable prototype of their flow, a short build on a sample of their data, or a walkthrough of a similar delivered project. Each has a cost; invest in tailored prototypes only for qualified deals, because free speculative work is where agency margin quietly disappears.\n\nAI demos carry special risks. Live model output varies, so rehearse on the exact inputs you will use, have a recorded fallback, and never hand-pick only the perfect examples without saying so. Better: show a failure case and how the system handles it (a low-confidence answer routed to a human). Buyers who have read about hallucinations trust a demo that admits limits far more than a flawless one. The gotcha is demoing to the wrong audience: a CFO wants cost and risk, an engineer wants architecture, an operations lead wants their daily workflow. Ask who is attending and tailor the story.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Salesforce Trailhead: How to create a product demo", url: "https://trailhead.salesforce.com/content/learn/modules/product-demos-quick-look/how-to-create-a-product-demo", kind: "docs" },
        { label: "HubSpot: How to deliver the perfect sales demo", url: "https://blog.hubspot.com/sales/how-to-deliver-the-perfect-sales-demo", kind: "article" },
        { label: "Gong: Sales demo tips backed by data", url: "https://www.gong.io/blog/sales-demos", kind: "article" },
        { label: "HubSpot: Tips for a flawless technical demo", url: "https://blog.hubspot.com/sales/technical-demo", kind: "article" },
      ],
      video: {
        title: "The Demo Framework That Actually Closes Deals | Robert Friedland",
        channel: "30 Minutes to President’s Club",
        url: "https://www.youtube.com/watch?v=vDtLF0YoWqk",
        videoId: "vDtLF0YoWqk",
      },
      alternateVideos: [
        {
          title: "How to Present a MIND-BLOWING Software Demo That Closes Sales",
          channel: "Sales Feed",
          url: "https://www.youtube.com/watch?v=EZbIx94dMeU",
          videoId: "EZbIx94dMeU",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-i-running-demos-q1",
          prompt: "What should a demo open with?",
          options: [
            "A short recap of the buyer's situation and priorities from discovery, and confirmation of what they want to see",
            "The agency's history and team photos",
            "A complete tour of every feature",
            "The price",
          ],
          correctIndex: 0,
          explanation: "Opening with their priorities proves you listened and lets them redirect the demo before you waste time.",
        },
        {
          id: "bd-i-running-demos-q2",
          prompt: "Why show the outcome before the setup behind it?",
          options: [
            "It keeps attention on the value the buyer cares about, and the setup only matters once they want the outcome",
            "Because setup screens are confidential",
            "To make the demo shorter than ten minutes",
            "Because buyers never care how things work",
          ],
          correctIndex: 0,
          explanation: "Lead with the result ('here's the summary your adjusters get'), then explain how it is produced for those who want to know.",
        },
        {
          id: "bd-i-running-demos-q3",
          prompt: "How should an AI demo be prepared to avoid live failure? (Select all that apply.)",
          options: [
            "Rehearse on the exact inputs you will use",
            "Have a recorded fallback ready if the live run misbehaves",
            "Prepare a deliberate failure case that shows how low-confidence answers are routed to a human",
            "Only use cherry-picked perfect examples and present them as typical",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Rehearsal, a fallback and an honest failure case build trust. Cherry-picking while implying it is typical sets up disappointment and disputes.",
        },
        {
          id: "bd-i-running-demos-q4",
          prompt:
            "Mid-demo, the AI gives a confident but wrong answer to a question the prospect typed live. What is the best response?",
          options: [
            "Acknowledge it, explain how the production design catches this (grounding, confidence thresholds, human review), and note it as a test case for the pilot",
            "Ignore it and move on quickly",
            "Blame the prospect's question",
            "Promise it will never happen once deployed",
          ],
          correctIndex: 0,
          explanation:
            "Handled honestly, a live failure becomes proof that you understand AI risk. Hiding it or promising perfection undermines everything else you showed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-running-demos-q5",
          prompt: "An agency has no product yet for the prospect's use case. Which are reasonable demo options? (Select all that apply.)",
          options: [
            "A white-label base configured with the prospect's branding and flow",
            "A clickable prototype of their key workflow",
            "A walkthrough of a similar delivered project, with permission",
            "Screenshots of a competitor's product presented as your own",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Configured bases, prototypes and permitted case walkthroughs are honest evidence. Passing off someone else's product is deceptive.",
        },
        {
          id: "bd-i-running-demos-q6",
          prompt: "Why limit how much tailored prototype work you do before a deal is qualified?",
          options: [
            "Unpaid speculative work is costly, and spending it on unqualified deals quietly erodes margin",
            "Prototypes are never useful in sales",
            "Clients dislike seeing their own data",
            "It is against marketplace rules",
          ],
          correctIndex: 0,
          explanation: "Invest demo effort in proportion to qualification. For bigger asks, offer a paid proof of concept instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-i-running-demos-q7",
          prompt: "The audience is the CFO, the operations lead and an in-house engineer. How should the demo be shaped?",
          options: [
            "Cover the daily workflow for operations, architecture and integration for the engineer, and cost and risk for the CFO, checking in with each",
            "Focus only on the most senior person",
            "Give the same feature tour regardless of who attends",
            "Split it into three separate demos without telling them",
          ],
          correctIndex: 0,
          explanation: "Each persona has a different question. Ask who is attending beforehand and make sure each leaves with their answer.",
        },
        {
          id: "bd-i-running-demos-q8",
          prompt: "What should happen in the last five minutes of a demo?",
          options: [
            "Summarise what they saw against their priorities and agree a specific, dated next step",
            "Show additional features you did not have time for",
            "Ask them to sign today",
            "End on time and send the recording later",
          ],
          correctIndex: 0,
          explanation: "A demo without an agreed next step stalls. Tie it back to their goals and book what comes next.",
        },
        {
          id: "bd-i-running-demos-q9",
          prompt:
            "The prospect asks to use the AI demo environment for a month 'to try it with our team'. What is a sensible response?",
          options: [
            "Offer a scoped, time-boxed pilot with success criteria and a named owner on their side, paid or with a clear path to a decision",
            "Give open-ended free access with no criteria",
            "Refuse any trial",
            "Agree, but without telling engineering who maintains it",
          ],
          correctIndex: 0,
          explanation:
            "Open-ended free trials rarely convert and cost real model usage and support. A structured pilot gives both sides a decision point.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "You are running a 45-minute demo of an AI claims-summary tool for an insurer whose adjusters spend hours reading claim files. Put these demo segments in the most effective order.",
        items: [
          { id: "recap", label: "Recap what they told you in discovery and confirm what they want to see today" },
          { id: "outcome", label: "Show the finished claim summary an adjuster would receive, using a realistic sample file" },
          { id: "how", label: "Walk through how the summary is produced: sources, citations, confidence scores" },
          { id: "failure", label: "Show a low-confidence case being routed to a human reviewer" },
          { id: "questions", label: "Open discussion: questions from the operations lead, engineer and CFO" },
          { id: "next", label: "Summarise against their priorities and agree a dated next step (a pilot scoping call)" },
        ],
        correctOrder: ["recap", "outcome", "how", "failure", "questions", "next"],
        explanation:
          "Start from their priorities, show the outcome before the mechanism, then build trust by showing how failure is handled. Leave room for each persona's questions and always end with an agreed next step.",
      },
    },
  ],
} satisfies Module;
