import type { Module } from "@/types/curriculum";

export default {
  id: "bd-advanced",
  trackId: "bd",
  name: "Complex Sales & Accounts",
  description:
    "Multi-stakeholder deals for a software agency: consultative, solution and Challenger-style selling, negotiation, RFPs, enterprise procurement, account growth, forecasting, social proof and white-label partnerships. For BD people who already run their own deals and now need to win the larger, slower, riskier ones.",
  refs: [
    { label: "MEDDICC: The MEDDPICC sales methodology", url: "https://meddicc.com/meddpicc-sales-methodology-and-process", kind: "spec" },
    { label: "Harvard PON: What is a BATNA?", url: "https://www.pon.harvard.edu/tag/batna/", kind: "article" },
  ],
  topics: [
    {
      id: "bd-a-consultative-selling",
      moduleId: "bd-advanced",
      trackId: "bd",
      title: "Consultative Selling",
      summary:
        "Consultative selling exists because most buyers of custom software do not actually know what they need. They arrive with a solution (\"a React Native app with 14 screens\") that is really a guess at how to fix a business problem. An agency that quotes the guess competes on day rate against every other shop that can read a feature list. An agency that diagnoses the problem first, in the client's own numbers, changes what is being compared: the conversation moves from cost per screen to cost of the problem.\n\nThe method is diagnose before you prescribe. Understand the outcome, what it is worth, who else is affected and who decides, then shape a recommendation, which sometimes means a smaller project or no project. It earns trust because it visibly risks the deal for the client's benefit.\n\nThe trade-offs are real. It is slower, it needs access to more than one stakeholder, and it demands enough business and technical literacy to have a point of view. It fits poorly when the scope is fixed and the decision is scored on a rubric you cannot influence (a formal public tender), or when the buyer is buying a commodity on price; there, precision and responsiveness win.\n\nTwo gotchas catch experienced sellers. First, consultative is not the same as asking lots of questions: a 40-question interrogation with no insight back is just a slower pitch. Second, free consulting: if your pre-sales workshop produces a full architecture and backlog, the client can take it to a cheaper vendor. Share the diagnosis and the approach; put the detailed solution design in a paid discovery phase once uncertainty is large.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "MEDDICC: The MEDDPICC sales methodology (Identify Pain, Metrics)", url: "https://meddicc.com/meddpicc-sales-methodology-and-process", kind: "spec" },
        { label: "HubSpot: Consultative selling", url: "https://blog.hubspot.com/sales/consultative-selling", kind: "article" },
        { label: "HubSpot: Solution selling", url: "https://blog.hubspot.com/sales/solution-selling", kind: "article" },
      ],
      video: {
        title: "What is the Difference Between Consultative Selling and Normal Selling?",
        channel: "Brian Tracy",
        url: "https://www.youtube.com/watch?v=FBgRuRDIqSU",
        videoId: "FBgRuRDIqSU",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-a-consultative-selling-q1",
          prompt:
            "A prospect emails: \"We need a React Native app with these 14 screens. Quote by Friday.\" What is the most consultative next move?",
          options: [
            "Agree to the Friday deadline and ask for a 30-minute call on the business outcome behind the app before you quote",
            "Quote the 14 screens exactly as listed so you look responsive",
            "Decline to quote until they commit to a two-week paid workshop",
            "Send your capabilities deck and three case studies, then quote",
          ],
          correctIndex: 0,
          explanation:
            "You respect their deadline but earn the right to understand the problem, which is what lets you quote something other than a commodity. Quoting the list blind invites a day-rate comparison; demanding a paid workshop before any number is premature for a first touch.",
        },
        {
          id: "bd-a-consultative-selling-q2",
          prompt: "Which signs suggest a discovery call was genuinely consultative rather than a pitch? (Select all that apply.)",
          options: [
            "The client did most of the talking",
            "You can state the cost of the problem in the client's own numbers",
            "You know who else is affected by the problem and who signs off",
            "You walked through every relevant case study you have",
            "The client agreed with every feature you suggested",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Consultative discovery produces understanding: the client's words, their quantified pain and the decision map. Running through case studies is presenting, and universal agreement usually means you led the witness rather than learned anything.",
        },
        {
          id: "bd-a-consultative-selling-q3",
          prompt:
            "Halfway through discovery you realise the client's real problem is a broken order-approval process, and the app they want would just digitise the mess. What do you do?",
          options: [
            "Say so, and propose fixing the process first, possibly as a smaller engagement before the app",
            "Sell the app anyway, since it is what they asked for and they have budget",
            "Ignore it now and raise it as a change request once the project starts",
            "End the conversation, since the problem is not a software problem",
          ],
          correctIndex: 0,
          explanation:
            "Telling the client what they need to hear, even when it shrinks the deal, is the core of the method and what makes your later recommendations credible. Selling the app sets up a project that fails its real goal, which costs you the account and the reference.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-consultative-selling-q4",
          prompt: "When is a paid discovery phase a better choice than doing the scoping for free during pre-sales?",
          options: [
            "When the solution needs real architecture work and uncertainty is high enough that a fixed quote would be a guess",
            "Whenever the client is a large company, since they can afford it",
            "Never: charging for discovery signals you are not confident",
            "Only when the client has already chosen another vendor",
          ],
          correctIndex: 0,
          explanation:
            "Paid discovery is right when the scoping itself is substantial work and its output (architecture, backlog, estimate) has standalone value. Company size alone is not the test, and it is a common, legitimate step rather than a confidence problem.",
        },
        {
          id: "bd-a-consultative-selling-q5",
          prompt: "Which of these is an implication question rather than a situation question?",
          options: [
            "\"When orders sit in the approval queue for two days, what happens to your repeat-purchase rate?\"",
            "\"How many orders do you process a month?\"",
            "\"Which system do you use for approvals today?\"",
            "\"How many people are on your operations team?\"",
          ],
          correctIndex: 0,
          explanation:
            "Implication questions connect a known problem to its business consequence, which is what builds urgency. The others collect facts; necessary, but asking too many of them is what makes discovery feel like an audit.",
        },
        {
          id: "bd-a-consultative-selling-q6",
          prompt:
            "On a first call a founder asks, \"Roughly what does something like Uber cost to build?\" What is the strongest answer?",
          options: [
            "Give a wide range tied to explicit assumptions (platforms, scope of the first release), then ask which parts matter most to them",
            "Refuse to give any number until a full scope exists",
            "Give the lowest number you have ever delivered something similar for, to keep them interested",
            "Quote the full cost of building Uber today, so they understand the scale",
          ],
          correctIndex: 0,
          explanation:
            "A transparent range with assumptions qualifies budget and turns the question into discovery. Refusing feels evasive, and a lowball anchors them to a number you will have to walk back.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-consultative-selling-q7",
          prompt: "In which situation does a consultative approach add the least?",
          options: [
            "A public tender with a fixed specification, no clarification meetings and a published scoring rubric",
            "A mid-size company that wants to 'add AI' but has not decided what for",
            "A founder with funding and a rough idea for a marketplace",
            "An existing client whose user adoption has stalled after launch",
          ],
          correctIndex: 0,
          explanation:
            "When scope is fixed and you cannot reach the people who shape it, precision against the rubric wins, and diagnosing a problem you cannot influence wastes effort. The other three all hinge on an undiagnosed problem.",
        },
        {
          id: "bd-a-consultative-selling-q8",
          prompt:
            "A prospect asks you to include a full technical architecture, data model and sprint plan in the proposal 'so we can compare vendors properly'. What is the main risk?",
          options: [
            "You give away the solution design, which they can hand to a cheaper vendor to build",
            "The proposal will be too long for procurement to read",
            "Engineers will be annoyed at being asked for estimates",
            "It will reveal your day rates",
          ],
          correctIndex: 0,
          explanation:
            "The design is where much of the value lies; give the diagnosis and approach, and put detailed design in paid discovery. Length and internal effort are real but secondary concerns.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-consultative-selling-q9",
          prompt: "Which pieces of evidence tell you discovery is complete enough to write a proposal? (Select all that apply.)",
          options: [
            "You can describe the problem and success criteria in the client's own words",
            "You know the budget range or at least what the problem costs them",
            "You know how the decision will be made and who signs",
            "The client has said they like your team",
            "You have a feature list that matches their original email",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Problem, value and decision process are what a proposal needs to land. Liking your team is pleasant but not evidence, and matching the original feature list may mean you never got past their first guess.",
        },
        {
          id: "bd-a-consultative-selling-q10",
          prompt: "Why does consultative selling tend to protect price better than feature-led selling for an agency?",
          options: [
            "The client compares your price to the value of solving their problem rather than to another vendor's rate card",
            "Clients are contractually prevented from comparing quotes",
            "It lets you hide your day rate entirely",
            "It shortens the sales cycle, so there is less time to negotiate",
          ],
          correctIndex: 0,
          explanation:
            "Price is always judged against something; consultative selling changes the reference point to the cost of the problem. It usually lengthens, not shortens, the cycle.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "A regional logistics company asks your agency for a driver app. On the discovery call, the operations director says late deliveries are rising, drivers call dispatch for every address change, and the CEO 'wants an app by Q2'. Budget has not been mentioned. The CTO is not on the call.",
        steps: [
          {
            id: "s1",
            question: "What should you explore next on this call?",
            options: [
              "How many dispatch calls happen per day and what a late delivery costs them in penalties or lost customers",
              "Whether they prefer Flutter or React Native",
              "Your agency's track record with logistics apps",
              "Whether they would sign this week if the price is right",
            ],
            correctIndex: 0,
            explanation: "Quantifying the problem is what turns 'an app' into a business case and gives you a value anchor for price later.",
          },
          {
            id: "s2",
            question:
              "They estimate 300 dispatch calls a day and penalty fees around $20k a month. The CTO, who owns integrations, has not been involved. What is your next step?",
            options: [
              "Ask the director to bring the CTO into a short technical follow-up before you propose anything",
              "Send a proposal to the director now, while the pain is fresh",
              "Email the CTO directly without telling the director",
              "Offer a discount to secure a commitment before the CTO can object",
            ],
            correctIndex: 0,
            explanation: "A missing technical stakeholder who owns integrations is a deal risk; involving them through your contact keeps the champion on side.",
          },
          {
            id: "s3",
            question:
              "In the CTO call you learn their routing system has no API, so live address changes need a middleware layer. How do you shape the proposal?",
            options: [
              "Propose a paid discovery to design the integration, with the app build quoted as a range dependent on its outcome",
              "Quote the app as a fixed price and absorb the integration risk",
              "Leave the integration out and handle it as a change request later",
              "Recommend they replace the routing system before talking to you again",
            ],
            correctIndex: 0,
            explanation: "High uncertainty in a critical dependency is exactly when paid discovery is fair to both sides; hiding it in a fixed price or a later change request damages margin or trust.",
          },
        ],
      },
    },
    {
      id: "bd-a-solution-selling",
      moduleId: "bd-advanced",
      trackId: "bd",
      title: "Solution Selling: From Pain to a Costed Answer",
      summary:
        "Solution selling is the discipline of mapping a buyer's diagnosed pain to a specific, costed capability and proving the link. Where consultative selling is a stance (diagnose first), solution selling is the mechanics: pain, then the capability that removes it, then the evidence that it will, then the value that justifies the price. It became the standard approach in B2B because complex purchases are approved by people who were not on the discovery call, and they need a chain of reasoning they can follow without you in the room.\n\nFor an agency the chain usually reads: \"Your dispatch team handles 300 calls a day (pain) → live address updates in the driver app with routing-system sync (capability) → we cut similar call volumes for a distribution client (evidence) → about $X a year in staff time and penalties (value), against an investment of $Y.\" Each link must survive a sceptical CFO.\n\nThe trade-off is that it depends on the buyer recognising the pain. When they do not yet see the problem, solution selling stalls, and a Challenger-style reframe (teach them something they missed) is the better opening. It also tends to over-fit to the person you interviewed: the operations director's pain is not the finance director's pain, and a solution story built for one can fail with the other.\n\nThe gotchas: value claims you cannot support (\"this will increase revenue by 30%\") destroy credibility with exactly the people who sign, so make the assumptions visible and conservative. And solution selling slides easily into feature dumping: listing every capability you have dilutes the two that matter. One pain, one capability, one proof, one number per stakeholder is a stronger proposal than a wall of features.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "MEDDICC: The MEDDPICC sales methodology (Metrics, Decision Criteria)", url: "https://meddicc.com/meddpicc-sales-methodology-and-process", kind: "spec" },
        { label: "HubSpot: Solution selling", url: "https://blog.hubspot.com/sales/solution-selling", kind: "article" },
        { label: "HubSpot: Consultative selling", url: "https://blog.hubspot.com/sales/consultative-selling", kind: "article" },
      ],
      video: {
        title: "How To Ask Discovery Questions To Uncover Business Problems (Sell Playbook)",
        channel: "30 Minutes to President’s Club",
        url: "https://www.youtube.com/watch?v=SThDd_7Y5Fw",
        videoId: "SThDd_7Y5Fw",
        durationLabel: "34:37",
      },
      alternateVideos: [
        {
          title: "What is Solution Selling?",
          channel: "Marketing Business Network",
          url: "https://www.youtube.com/watch?v=OmZ5jbzJt9o",
          videoId: "OmZ5jbzJt9o",
          durationLabel: "3:27",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-a-solution-selling-q1",
          prompt: "What is the correct order of the links in a solution-selling value story?",
          options: [
            "Pain, capability, evidence, value",
            "Capability, value, pain, evidence",
            "Evidence, capability, value, pain",
            "Value, pain, evidence, capability",
          ],
          correctIndex: 0,
          explanation:
            "Starting from the buyer's pain keeps the story about them; the capability answers the pain, evidence makes it believable, and value justifies the price. Leading with capability is how proposals turn into feature lists.",
        },
        {
          id: "bd-a-solution-selling-q2",
          prompt:
            "A proposal says: \"Our AI chatbot will increase your revenue by 30%.\" The client's finance director is reviewing it. What is the main problem?",
          options: [
            "The claim has no visible assumptions or evidence, so it undermines credibility with the person who signs",
            "30% is too low to be interesting",
            "Revenue is the wrong metric for any chatbot",
            "Finance directors do not read proposals",
          ],
          correctIndex: 0,
          explanation:
            "Unsupported value claims are the fastest way to lose a sceptical approver. A conservative number with its assumptions shown (deflected tickets times cost per ticket) is stronger than a big one with none.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-solution-selling-q3",
          prompt: "Which make a value calculation more credible to a CFO? (Select all that apply.)",
          options: [
            "Using the client's own figures, gathered in discovery",
            "Showing each assumption so they can change it",
            "Giving a conservative case alongside the expected case",
            "Rounding every estimate up to make the return look stronger",
            "Including benefits from features outside the proposed scope",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Their numbers, visible assumptions and a conservative case let the CFO own the conclusion. Inflating estimates or counting out-of-scope benefits is exactly what a CFO looks for and discounts.",
        },
        {
          id: "bd-a-solution-selling-q4",
          prompt:
            "The prospect does not believe they have a problem: \"Our support team handles volume fine.\" Which approach is most likely to move the deal?",
          options: [
            "Reframe with an insight they have not considered, such as what slow first responses cost in churn, backed by data",
            "Restate your chatbot's features more clearly",
            "Offer a discount to create urgency",
            "Agree and move on to the next prospect immediately",
          ],
          correctIndex: 0,
          explanation:
            "Solution selling assumes recognised pain; when it is missing you need to teach the buyer something new first. Features and discounts do not create a problem the buyer does not see.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-solution-selling-q5",
          prompt:
            "Your solution story was built from interviews with the head of operations. The decision now sits with a committee that includes finance and IT security. What is the most likely failure?",
          options: [
            "The story speaks to operations' pain but not to finance's cost concerns or security's risk concerns",
            "The committee will reject the project because it is too small",
            "The operations head will lose interest",
            "The committee will ask for more features",
          ],
          correctIndex: 0,
          explanation:
            "Each stakeholder buys for a different reason. A story fitted to one person needs a version for each of the others: payback for finance, data handling for security.",
        },
        {
          id: "bd-a-solution-selling-q6",
          prompt: "Why is listing every capability your agency has usually weaker than focusing on two or three?",
          options: [
            "Extra capabilities dilute the link between the buyer's pain and your answer, and make the price look like it pays for things they do not need",
            "Clients are legally limited in how many features they can buy",
            "It makes the proposal too short",
            "It reveals your technology stack to competitors",
          ],
          correctIndex: 0,
          explanation:
            "Focus makes the causal chain obvious. A wall of features forces the buyer to do the mapping and invites 'can we remove these to lower the price?'",
        },
        {
          id: "bd-a-solution-selling-q7",
          prompt:
            "Discovery shows the client loses about 1,200 staff hours a month on manual data entry at a loaded cost of $25 an hour. Your automation would remove roughly half of it. What is a defensible annual value figure?",
          options: ["$180,000", "$360,000", "$30,000", "$15,000"],
          correctIndex: 0,
          explanation:
            "600 hours a month times $25 is $15,000 a month, or $180,000 a year. $360,000 assumes you remove all of it; $15,000 is a single month.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-solution-selling-q8",
          prompt: "Which pieces of evidence best support the 'evidence' link for a custom software proposal? (Select all that apply.)",
          options: [
            "A case study from a similar problem with a measured outcome",
            "A short proof-of-concept against the client's own data",
            "A reference call with a past client in a similar situation",
            "A list of the frameworks your engineers know",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Evidence must show the capability removes this kind of pain. A list of frameworks shows ability to build, not that the result will work for them.",
        },
        {
          id: "bd-a-solution-selling-q9",
          prompt: "What is the main reason solution selling became standard for complex B2B purchases?",
          options: [
            "Approvers who were never on the sales calls need a reasoned case they can follow on their own",
            "Buyers stopped caring about price",
            "It removes the need for discovery",
            "It allows proposals to be reused unchanged across clients",
          ],
          correctIndex: 0,
          explanation:
            "The chain of pain, capability, evidence and value travels inside the client's organisation without you. It relies on discovery rather than replacing it.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write the 'Why this, why now' section of a proposal for the client below. Link their pain to your proposed capability, give evidence, and state a value figure with its assumptions. Address the finance director as a reader as well as the operations director.",
        context:
          "Client: a 40-store home-goods retailer. Discovery notes: store managers reorder stock by emailing a buyer, who rekeys orders into the ERP. About 900 orders a month; each takes roughly 12 minutes of rekeying; buyers cost about $30 an hour fully loaded. Stock-outs on top sellers happen about twice a month per store; the operations director estimates each costs $400 in lost sales. Your proposal: a store ordering app with ERP integration and low-stock alerts, $85,000 to build. You delivered a similar ordering integration for a wholesale distributor last year that cut rekeying to near zero.",
        wordLimit: 250,
        rubric: [
          { id: "pain", label: "States the pain in the client's numbers", description: "Uses the discovery figures (orders, rekeying time, stock-outs) rather than generic claims.", weight: 1 },
          { id: "link", label: "Links capability to pain", description: "Explains specifically how the app and integration remove rekeying and reduce stock-outs, without listing unrelated features.", weight: 1 },
          { id: "value", label: "Credible value figure with assumptions", description: "Calculates value transparently (about 180 hours a month, roughly $5,400 a month or $64,800 a year in rekeying; stock-out savings stated as an estimate with a conservative share) and compares it to the $85,000 investment.", weight: 1.5 },
          { id: "evidence", label: "Uses evidence appropriately", description: "Cites the distributor integration as similar evidence without inventing extra metrics.", weight: 1 },
          { id: "audience", label: "Readable for finance", description: "Plain, concise, and gives the finance director a payback view.", weight: 0.5 },
        ],
        sampleAnswer:
          "Today, store managers email about 900 orders a month to your buyers, who rekey each one into the ERP. At roughly 12 minutes an order, that is 180 buyer hours a month, about $5,400 at $30 an hour, or $64,800 a year spent copying data. Manual reordering also means top sellers run out: about twice a month per store, which at $400 a time across 40 stores puts up to $32,000 a month in sales at risk.\n\nThe store ordering app sends orders straight into the ERP, so rekeying disappears, and low-stock alerts prompt managers before a top seller runs out. We built a similar ordering integration for a wholesale distributor last year, and their rekeying effort fell to near zero.\n\nOn rekeying alone, the $85,000 build pays back in about 16 months. If the alerts prevent even a quarter of stock-outs, that adds roughly $96,000 a year and brings payback under seven months. We suggest you treat the stock-out figure as the upside and the rekeying saving as the base case.",
      },
    },
    {
      id: "bd-a-challenger-selling",
      moduleId: "bd-advanced",
      trackId: "bd",
      title: "Challenger-Style Selling: Teach, Tailor, Take Control",
      summary:
        "The Challenger model came out of CEB research (published as The Challenger Sale) that grouped sellers into five profiles and found that, in complex sales, the ones who challenged the customer's thinking outperformed the ones who mainly built relationships. Its three moves are: teach the buyer something new about their own business (commercial insight), tailor that insight to each stakeholder's priorities, and take control of the conversation, including money and next steps, rather than deferring.\n\nIt exists because sophisticated buyers now do much of their research before talking to a seller, so 'what do you need?' discovery adds little. Insight is what earns the meeting: \"Most retailers we see measure app success by downloads; the ones that grow measure repeat orders in the first 30 days, and that changes what you should build first.\"\n\nThe trade-offs: a commercial insight must be true, relevant and lead naturally to something you do well. An insight that leads to a capability you lack sets up a competitor. Challenging also needs a relationship that can bear it; with a new contact, teach with data and questions rather than verdicts. And taking control is not pressure: it means proposing a clear next step and discussing budget early, not forcing a close.\n\nThe common gotcha is reading 'challenge' as 'argue'. Telling a CTO their architecture is wrong in the first meeting is not Challenger, it is rude. The reframe should make the buyer feel smart for seeing something new, not stupid for having missed it. Another is using one generic insight for every stakeholder; tailoring is what makes it land with finance, operations and IT differently.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Challenger Inc: What is the Challenger sales methodology?", url: "https://challengerinc.com/what-is-challenger-sales-methodology/", kind: "spec" },
        { label: "Salesforce: Challenger sales methodology", url: "https://www.salesforce.com/blog/sales/challenger-sales-methodology/", kind: "article" },
        { label: "HubSpot: Consultative selling", url: "https://blog.hubspot.com/sales/consultative-selling", kind: "article" },
      ],
      video: {
        title: "Sales Methodologies | Challenger sales model",
        channel: "Pipedrive",
        url: "https://www.youtube.com/watch?v=nvQNm5VD9E0",
        videoId: "nvQNm5VD9E0",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-a-challenger-selling-q1",
          prompt: "What are the three core behaviours of the Challenger model?",
          options: [
            "Teach, tailor, take control",
            "Listen, empathise, agree",
            "Prospect, pitch, close",
            "Qualify, demo, discount",
          ],
          correctIndex: 0,
          explanation:
            "Challengers teach a commercial insight, tailor it to each stakeholder and take control of the process. Listening and empathy still matter, but they describe the relationship-builder profile, which the research found less effective in complex sales.",
        },
        {
          id: "bd-a-challenger-selling-q2",
          prompt: "Which make a good commercial insight for an agency? (Select all that apply.)",
          options: [
            "It is true and you can back it with data or experience",
            "It tells the buyer something about their business they had not considered",
            "It leads naturally to something your agency does unusually well",
            "It is something the buyer already believes, so they agree quickly",
            "It leads to a capability only a competitor has",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "An insight must be credible, new to the buyer and lead to your strengths. Repeating what they already believe teaches nothing, and an insight that points to a competitor's strength sells their solution.",
        },
        {
          id: "bd-a-challenger-selling-q3",
          prompt:
            "In a first meeting, the client's CTO describes their monolith. A junior seller says, \"That architecture is outdated; you need microservices.\" Why is this poor Challenger practice?",
          options: [
            "It delivers a verdict without evidence or tailoring, making the buyer defensive instead of curious",
            "Challenger sellers never discuss architecture",
            "Microservices are always the wrong answer",
            "The seller should have waited for the CFO",
          ],
          correctIndex: 0,
          explanation:
            "Challenging means reframing with insight the buyer can test, ideally through questions and data, not telling them they are wrong. The point is to make them see something new, not to win an argument.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-challenger-selling-q4",
          prompt: "What does 'take control' mean in Challenger selling?",
          options: [
            "Proposing clear next steps and discussing budget and decision process openly, rather than waiting for the buyer to lead",
            "Pressuring the buyer to sign before the end of the month",
            "Refusing to change your proposal once sent",
            "Going over the buyer's head to their CEO at the first sign of hesitation",
          ],
          correctIndex: 0,
          explanation:
            "Control is about leading the process confidently, including money conversations. High-pressure closing and escalating around your contact are different behaviours, and both damage trust.",
        },
        {
          id: "bd-a-challenger-selling-q5",
          prompt:
            "Your insight is: \"Retail apps that optimise for downloads stall; those that optimise for repeat orders in the first 30 days grow.\" How should you tailor it for the client's CFO?",
          options: [
            "Express it as revenue per customer and payback period on the build",
            "Talk about app store ratings",
            "Focus on the design system and animation quality",
            "Keep it identical for every stakeholder to stay consistent",
          ],
          correctIndex: 0,
          explanation:
            "Tailoring means the same insight framed in each stakeholder's terms: money for the CFO, operational load for operations, risk for security. Using one framing for everyone is a common miss.",
        },
        {
          id: "bd-a-challenger-selling-q6",
          prompt: "Why did the Challenger research suggest pure relationship-building was less effective in complex B2B sales?",
          options: [
            "Being liked does not change how the buyer thinks about the problem, and complex purchases need someone to reshape that thinking",
            "Buyers dislike friendly sellers",
            "Relationship builders tend to price too high",
            "It applied only to consumer sales",
          ],
          correctIndex: 0,
          explanation:
            "Relationships help, but in complex, consensus-driven purchases the seller who adds new perspective drives the decision. The finding is about complex B2B, not consumer sales.",
        },
        {
          id: "bd-a-challenger-selling-q7",
          prompt:
            "A prospect has already researched vendors and sends a detailed brief. On the call they say, \"We know what we want, just tell us price and timeline.\" Which response best fits the Challenger approach?",
          options: [
            "Give an indicative range, then share one insight from similar projects that could change their priorities, and ask if it is worth 15 minutes",
            "Give the price and timeline only, since they asked",
            "Insist on a full discovery workshop before any numbers",
            "Tell them their brief is wrong",
          ],
          correctIndex: 0,
          explanation:
            "You respect their request and earn the right to reframe with a relevant insight. Pure compliance makes you a commodity; refusing or lecturing loses the meeting.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-challenger-selling-q8",
          prompt: "What risks come with Challenger selling if done poorly? (Select all that apply.)",
          options: [
            "Damaging a new relationship by sounding arrogant",
            "Teaching an insight that leads the buyer to a competitor's strength",
            "Using an insight that turns out to be wrong for this client",
            "Spending too little time on the commercial conversation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Arrogance, insights that favour competitors and untrue insights are the classic failures. Challenger pushes you into the commercial conversation earlier, so neglecting it is not the typical risk.",
        },
        {
          id: "bd-a-challenger-selling-q9",
          prompt:
            "You present an insight to a healthcare client and the head of IT says, \"That doesn't apply to us; we're regulated.\" What is the best response?",
          options: [
            "Ask what about their regulation changes the picture, and adapt or drop the insight based on the answer",
            "Repeat the insight more firmly",
            "Agree immediately and move on to pricing",
            "Point out that other regulated clients disagree with them",
          ],
          correctIndex: 0,
          explanation:
            "Challenging is a dialogue: test the insight against their reality. Sometimes the buyer is right, and adapting builds more credibility than defending a point that does not fit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A colleague drafted this Challenger-style opening email to the operations director of a mid-size retailer. Mark the sentences that undermine the approach (wrong, risky or not Challenger at all).",
        segments: [
          { id: "c1", text: "Hi Priya, thanks for the time last week.", issue: null },
          { id: "c2", text: "Across the retail apps we've supported, the ones that grew fastest tracked repeat orders in the first 30 days, not total downloads.", issue: null },
          { id: "c3", text: "Your current app is honestly a mess and your team clearly chose the wrong metrics.", issue: "A verdict that insults the buyer instead of a reframe; it makes them defensive." },
          { id: "c4", text: "For an operations team, that usually shows up as fewer one-off orders and more predictable weekly volume.", issue: null },
          { id: "c5", text: "Every retailer that works with us sees revenue double within a year.", issue: "An unsupported, absolute claim that a sceptical buyer will discount and that may be untrue." },
          { id: "c6", text: "In one grocery client, moving reorder reminders to day 7 lifted second orders noticeably, and we can share how we measured it.", issue: null },
          { id: "c7", text: "Our competitor's analytics product is the best tool for measuring this, so you may want to start there.", issue: "The insight leads to a competitor's strength rather than yours." },
          { id: "c8", text: "Would it be worth 30 minutes on Thursday to look at your first-30-day repeat rate together?", issue: null },
          { id: "c9", text: "I'll also send a short note on budget ranges for this kind of work so we can be realistic early.", issue: null },
          { id: "c10", text: "Best, Sam", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "bd-a-negotiation-batna-zopa",
      moduleId: "bd-advanced",
      trackId: "bd",
      title: "Negotiation Preparation: BATNA, Reservation Price and ZOPA",
      summary:
        "Most negotiation outcomes are decided before anyone meets, by how well each side prepared. The Harvard Negotiation Project's concept of a BATNA (Best Alternative To a Negotiated Agreement) is the foundation: what you will actually do if this deal does not happen. Your BATNA sets your reservation price, the worst terms you should accept. The zone of possible agreement (ZOPA) is the overlap between your reservation price and theirs. If there is no overlap, no amount of skill closes the deal on those terms, and the right move is to change the deal (scope, phasing, payment terms) or walk away.\n\nFor an agency, your BATNA is rarely 'no revenue'. It is the next-best use of the team: another pipeline deal, a retainer extension, or bench time with a known cost. The client's BATNA is a competitor's quote, an in-house build, or doing nothing, and each must be translated into comparable terms. A cheaper offshore quote plus the client's own cost of managing it may be worth more than its headline number.\n\nThe trade-off in preparation is effort versus precision: you will never know the other side's reservation price exactly, so estimate it from signals (budget hints, competitor rates, cost of delay) and update it as you learn.\n\nThe gotchas: a weak BATNA leaks through behaviour (accepting every request, rushing to close at quarter end), and buyers read it. Improve your BATNA before the meeting by having real pipeline alternatives. And never compute your reservation price from revenue alone: a deal above cost can still be below your minimum margin once contingency, payment terms and opportunity cost are included.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Harvard PON: How to find the ZOPA in business negotiations", url: "https://www.pon.harvard.edu/daily/business-negotiations/how-to-find-the-zopa-in-business-negotiations/", kind: "docs" },
        { label: "Harvard PON: Translate your BATNA to the current deal", url: "https://www.pon.harvard.edu/daily/batna/translate-your-batna-to-the-current-deal/", kind: "article" },
        { label: "Harvard PON: What is a BATNA?", url: "https://www.pon.harvard.edu/tag/batna/", kind: "article" },
      ],
      video: {
        title: "The Harvard Principles of Negotiation",
        channel: "Erich Pommer Institut",
        url: "https://www.youtube.com/watch?v=RfTalFEeKKE",
        videoId: "RfTalFEeKKE",
      },
      alternateVideos: [
        {
          title: "Negotiating Using BATNA and ZOPA",
          channel: "Sales Training International",
          url: "https://www.youtube.com/watch?v=_1ugilqx6mw",
          videoId: "_1ugilqx6mw",
          durationLabel: "2:15",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-a-negotiation-batna-zopa-q1",
          prompt: "What is your BATNA in a negotiation?",
          options: [
            "What you will actually do if this negotiation produces no agreement",
            "The best price you hope to achieve",
            "The first offer you put on the table",
            "The midpoint between both sides' opening positions",
          ],
          correctIndex: 0,
          explanation:
            "A BATNA is a real alternative, not a target. Your target (aspiration) and opening offer are separate numbers, and the midpoint is just a common, often arbitrary, landing point.",
        },
        {
          id: "bd-a-negotiation-batna-zopa-q2",
          prompt:
            "Your agency's minimum price for a project is $80,000. The client's absolute maximum is $72,000. What does this mean?",
          options: [
            "There is no ZOPA on these terms, so you must change the deal's shape or walk away",
            "You should meet in the middle at $76,000",
            "The ZOPA is $8,000 wide",
            "A skilled negotiator can still close at $80,000",
          ],
          correctIndex: 0,
          explanation:
            "A ZOPA exists only when reservation prices overlap. With no overlap, the options are to change scope, phasing or terms so the numbers move, or to walk away. Splitting the difference would put you below your own minimum.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-negotiation-batna-zopa-q3",
          prompt: "Which are realistic parts of an agency's BATNA when negotiating a new project? (Select all that apply.)",
          options: [
            "Another qualified deal in the pipeline that needs the same team",
            "Extending an existing client's retainer",
            "The known cost of the team sitting on the bench",
            "Hoping the client comes back with a higher budget later",
            "The price you would like to charge",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A BATNA consists of concrete alternatives with known value. Hope is not an alternative, and your preferred price is an aspiration, not a fallback.",
        },
        {
          id: "bd-a-negotiation-batna-zopa-q4",
          prompt:
            "The client says a competitor quoted $70,000 against your $85,000. The competitor needs the client to supply a full-time PM and do its own QA, which the client estimates at $18,000. How should you think about the client's BATNA?",
          options: [
            "Its real cost is about $88,000, so your quote is competitive once compared like for like",
            "It is $70,000, so you must drop below that",
            "It is irrelevant, because competitor quotes are always bluffs",
            "It is $52,000, because you subtract the PM cost",
          ],
          correctIndex: 0,
          explanation:
            "Translating the alternative into comparable terms ($70,000 plus $18,000 of the client's own effort) shows it is not cheaper. Taking the headline figure at face value is a classic mistake.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-negotiation-batna-zopa-q5",
          prompt: "Why should a reservation price not be set as 'anything above delivery cost'?",
          options: [
            "Contingency, payment terms, minimum margin and the opportunity cost of the team all affect whether a deal is worth doing",
            "Delivery cost is confidential",
            "Clients are entitled to know your costs",
            "Reservation prices should always equal list price",
          ],
          correctIndex: 0,
          explanation:
            "A project that covers salaries but ties up the team for months at thin margin, with late payments, can leave you worse off than your BATNA. List price is your aspiration, not your floor.",
        },
        {
          id: "bd-a-negotiation-batna-zopa-q6",
          prompt: "Which behaviours typically reveal a weak BATNA to the other side? (Select all that apply.)",
          options: [
            "Agreeing to every scope request without asking for anything in return",
            "Pushing hard to sign before your quarter ends",
            "Dropping price before the client has asked",
            "Asking clarifying questions about their decision process",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Unconditional concessions, visible deadline pressure and unprompted discounts all signal you need the deal. Asking about their decision process is normal preparation.",
        },
        {
          id: "bd-a-negotiation-batna-zopa-q7",
          prompt: "What is the most effective way to improve your negotiating position a week before a big pricing meeting?",
          options: [
            "Strengthen your BATNA, for example by advancing other qualified deals that need the same team",
            "Decide to be more aggressive in the room",
            "Prepare a larger discount to offer early",
            "Ask the client for their reservation price",
          ],
          correctIndex: 0,
          explanation:
            "Leverage comes mainly from alternatives. Tone in the room cannot replace a real alternative, and asking for their reservation price directly rarely produces a truthful answer.",
        },
        {
          id: "bd-a-negotiation-batna-zopa-q8",
          prompt:
            "You estimate the client's maximum is $95,000, and your minimum is $80,000. Late in the deal, the client reveals their in-house team could build a smaller version for about $60,000. What should you do?",
          options: [
            "Update your estimate of their reservation price downward and consider reshaping scope to fit inside the new range",
            "Ignore it, since you already estimated $95,000",
            "Immediately match $60,000",
            "Tell them in-house builds always fail",
          ],
          correctIndex: 0,
          explanation:
            "Reservation prices are estimates you revise with new information. A smaller scope may restore a ZOPA; matching $60,000 for the full scope would put you below your minimum.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-negotiation-batna-zopa-q9",
          prompt: "Which levers can create a ZOPA where price alone has none?",
          options: [
            "Phasing scope, changing payment terms, or trading a longer commitment for a lower rate",
            "Repeating your price more confidently",
            "Adding unrequested features at the same price",
            "Extending the proposal deadline",
          ],
          correctIndex: 0,
          explanation:
            "Changing what is exchanged changes both sides' values: a phased release lowers the first commitment; a 12-month retainer can justify a lower rate. Confidence and deadlines do not move reservation prices.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Prepare for a pricing call on a mobile app project. Use the figures below. Round money to the nearest dollar.",
        table: {
          columns: ["Item", "Value"],
          rows: [
            ["Your delivery cost (team, tools, contingency)", "$56,000"],
            ["Your minimum acceptable gross margin", "30%"],
            ["Competitor's quote to the client", "$84,000"],
            ["Client's own extra cost to manage the competitor (PM time, QA)", "$9,000"],
          ],
        },
        fields: [
          { id: "ourMin", label: "Your reservation price (minimum price that meets your margin)", unit: "$", answer: 80000, tolerance: 1 },
          { id: "theirMax", label: "Client's reservation price, from their translated BATNA", unit: "$", answer: 93000, tolerance: 1 },
          { id: "zopa", label: "Width of the ZOPA", unit: "$", answer: 13000, tolerance: 1 },
          { id: "mid", label: "Midpoint of the ZOPA", unit: "$", answer: 86500, tolerance: 1 },
        ],
        explanation:
          "Minimum price = cost / (1 − margin) = 56,000 / 0.70 = $80,000 (not 56,000 × 1.3, which is a 30% markup and only a 23% margin). The client's alternative really costs 84,000 + 9,000 = $93,000. The ZOPA runs from $80,000 to $93,000, so it is $13,000 wide with a midpoint of $86,500. Open above your target, not at the midpoint.",
      },
    },
    {
      id: "bd-a-concessions-anchoring",
      moduleId: "bd-advanced",
      trackId: "bd",
      title: "At the Table: Anchoring, Concessions and Counter-Offers",
      summary:
        "Once preparation has set your reservation price and target, the meeting is about how the number moves. Anchoring is the first lever: the first credible number in a negotiation pulls the final outcome toward it, especially when the other side is uncertain about value. That argues for making the first offer when you have good information, anchored on value and justified with reasons, rather than waiting for the client to anchor low with 'what is your best price?'\n\nConcessions are the second lever, and the principles are simple to state and hard to practise. Never give without getting: phrase every concession as a trade (\"If you can commit to a 12-month retainer, we can bring the rate to X\"). Make concessions smaller as you go, so the pattern signals you are near your limit. Label what each concession costs you so it is valued, and concede on things that are cheap for you but valuable to them (payment schedule, a named senior engineer, a faster start) before touching price.\n\nThe trade-off is relationship versus value. Agencies negotiate with people they will then work with for months, so tactics that 'win' the negotiation but poison delivery (bluffing, last-minute retrades) are a loss. Firm and warm beats hard and cold.\n\nThe gotchas: splitting the difference rewards whoever anchored more extremely; cutting price instead of scope teaches the client that your first number was padded; and conceding in writing by email before a call removes your chance to trade. A counter-offer email should restate the value, make one conditional trade, and propose a next step, not apologise for the price.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Harvard PON: Price anchoring 101", url: "https://www.pon.harvard.edu/daily/negotiation-skills-daily/price-anchoring-101/", kind: "docs" },
        { label: "Harvard PON: Translate your BATNA to the current deal", url: "https://www.pon.harvard.edu/daily/batna/translate-your-batna-to-the-current-deal/", kind: "article" },
      ],
      video: {
        title: "Making Sure Your Concessions are Rewarded, not Exploited",
        channel: "Deepak Malhotra",
        url: "https://www.youtube.com/watch?v=PR7sl5sCgDc",
        videoId: "PR7sl5sCgDc",
        durationLabel: "2:23",
      },
      alternateVideos: [
        {
          title: "29 Years of Sales Negotiation Lessons In 30 Minutes",
          channel: "30 Minutes to President’s Club",
          url: "https://www.youtube.com/watch?v=AtO39nkL0Io",
          videoId: "AtO39nkL0Io",
        },
        {
          title: "What is Tactical Empathy? How It Can Help in Negotiations at Work | Chris Voss",
          channel: "Chris Voss & The Black Swan Group",
          url: "https://www.youtube.com/watch?v=yTy6NiJgk_w",
          videoId: "yTy6NiJgk_w",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-a-concessions-anchoring-q1",
          prompt: "Why does the first credible number in a negotiation matter so much?",
          options: [
            "It anchors both sides' sense of a reasonable outcome, especially when value is uncertain",
            "It is legally binding once spoken",
            "The other side must respond with a number within 10% of it",
            "It reveals the speaker's reservation price",
          ],
          correctIndex: 0,
          explanation:
            "Anchoring is a well-documented bias: later offers adjust from the first number. It is not binding, and a well-chosen anchor sits near your target, not your floor.",
        },
        {
          id: "bd-a-concessions-anchoring-q2",
          prompt:
            "A client asks, \"What's your best price?\" before you have shared any number. You have good information about value. What is the strongest response?",
          options: [
            "Anchor with your well-reasoned proposal price and the value it is based on",
            "Give your reservation price, to show good faith",
            "Ask them to name a number first in every case",
            "Offer 15% off list straight away",
          ],
          correctIndex: 0,
          explanation:
            "With good information, making the first, reasoned offer anchors the conversation on value. Opening at your floor leaves no room, and an unprompted discount signals your list price was padded.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-concessions-anchoring-q3",
          prompt: "Which are sound concession practices? (Select all that apply.)",
          options: [
            "Trading each concession for something in return",
            "Making each successive concession smaller",
            "Conceding first on items that are cheap for you but valuable to the client",
            "Making the largest concession last to close the deal",
            "Conceding without being asked to build goodwill",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Conditional, shrinking concessions that start with low-cost, high-value items protect margin and signal your limit. A large final concession or unprompted giving teaches the client to keep pushing.",
        },
        {
          id: "bd-a-concessions-anchoring-q4",
          prompt:
            "You opened at $120,000, the client at $60,000. They propose to 'split the difference' at $90,000. Your target was $105,000 and your floor $95,000. What is the issue?",
          options: [
            "Splitting rewards the more extreme anchor and here lands below your floor",
            "Nothing: splitting the difference is always fair",
            "$90,000 is above your floor, so you should accept",
            "You should counter at $119,000",
          ],
          correctIndex: 0,
          explanation:
            "The midpoint depends entirely on the openings, so a low anchor pulls it down. $90,000 is under your $95,000 floor; trade scope or terms instead of accepting an arbitrary midpoint.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-concessions-anchoring-q5",
          prompt: "Which phrasing best turns a price concession into a trade?",
          options: [
            "\"If you can commit to a 12-month retainer, we can bring the monthly rate down to $18,000.\"",
            "\"We can do $18,000 a month, as a gesture of goodwill.\"",
            "\"Our final price is $18,000, take it or leave it.\"",
            "\"We'll see what we can do on price.\"",
          ],
          correctIndex: 0,
          explanation:
            "'If you … then we …' attaches the concession to something you value. A goodwill discount gets nothing back, an ultimatum damages the relationship, and vague language invites more pushing.",
        },
        {
          id: "bd-a-concessions-anchoring-q6",
          prompt:
            "The client says the price is too high. Which concessions usually cost an agency little but can be worth a lot to the client? (Select all that apply.)",
          options: [
            "A payment schedule tied to milestones rather than upfront",
            "Naming a senior engineer who will lead the project",
            "Starting two weeks earlier because your team is free",
            "A 20% rate cut across the whole project",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Terms, staffing commitments and timing are often cheap for you and valuable to them. A 20% rate cut is expensive and should be the last lever, if used at all.",
        },
        {
          id: "bd-a-concessions-anchoring-q7",
          prompt: "Why is cutting price rather than scope often a mistake in a fixed-price proposal?",
          options: [
            "It suggests your first price was padded and invites further pushing, while delivery cost stays the same",
            "Scope can never be changed after a proposal",
            "Clients prefer paying more",
            "Price cuts are not allowed by most contracts",
          ],
          correctIndex: 0,
          explanation:
            "If the work is unchanged and the price falls, the client learns your numbers are soft and your margin takes the hit. Reducing scope keeps price and value aligned.",
        },
        {
          id: "bd-a-concessions-anchoring-q8",
          prompt:
            "The client's procurement lead emails asking for 10% off, 'otherwise we'll go with another vendor'. You have a call with them tomorrow. What should you avoid doing tonight?",
          options: [
            "Replying with the 10% discount in writing",
            "Preparing what you would want in return for any concession",
            "Checking how strong their alternative is likely to be",
            "Reviewing your floor and target",
          ],
          correctIndex: 0,
          explanation:
            "Conceding by email before the call gives away the discount without a trade and sets a new anchor. Use the call to explore what matters to them and trade accordingly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-concessions-anchoring-q9",
          prompt: "What does a decreasing pattern of concessions (for example 6%, then 3%, then 1%) communicate?",
          options: [
            "That you are approaching your limit",
            "That you will keep conceding at the same rate",
            "That your first price was unreasonable",
            "That you are about to walk away immediately",
          ],
          correctIndex: 0,
          explanation:
            "Shrinking steps signal a floor. Equal or growing steps suggest there is more to come, which encourages the other side to keep pushing.",
        },
        {
          id: "bd-a-concessions-anchoring-q10",
          prompt: "Why do hard-bargaining tactics that 'win' the negotiation often hurt an agency in the end?",
          options: [
            "You then have to deliver for months with the same people, and resentment shows up in scope fights and slow approvals",
            "Clients can cancel any contract signed under pressure",
            "They are illegal in most jurisdictions",
            "They always produce a lower price",
          ],
          correctIndex: 0,
          explanation:
            "Unlike a one-off purchase, an agency deal starts a working relationship. Firm, fair and warm protects both the margin and the delivery that follows.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write the counter-offer email to the client's procurement lead. Hold your value, make one conditional trade, and propose a next step. Do not apologise for your price.",
        context:
          "Your proposal: a customer portal for a B2B equipment supplier, $140,000 fixed price, 16 weeks, 40% upfront. Procurement replied: \"Your price is 15% above the other shortlisted vendor. We need you at $119,000 to proceed.\" From discovery you know: the client's main worry is go-live before their trade show in 18 weeks, and their finance team prefers paying in arrears. The other vendor proposed 22 weeks. Your floor is $126,000. Moving to milestone payments costs you little. Removing the reporting module (about $14,000 of effort) is acceptable to the operations lead, who called it 'phase 2'.",
        wordLimit: 220,
        rubric: [
          { id: "value", label: "Restates value, not apology", description: "Anchors on the trade-show deadline and 16-week delivery versus 22 weeks; does not apologise or call the price high.", weight: 1 },
          { id: "trade", label: "Conditional trade", description: "Offers a concession only in return for something (for example milestone payments or a scope change) using 'if… then' framing.", weight: 1.5 },
          { id: "floor", label: "Protects the floor", description: "Does not offer below $126,000 and does not cut price for the same scope; a price move is matched by removing the reporting module.", weight: 1.5 },
          { id: "next", label: "Clear next step", description: "Proposes a specific call or decision step with a date.", weight: 1 },
          { id: "tone", label: "Firm and warm", description: "Professional, concise, relationship-preserving.", weight: 0.5 },
        ],
        sampleAnswer:
          "Hi Daniel,\n\nThanks for the quick reply. The deciding factor for your team is having the portal live before the trade show, and our plan delivers in 16 weeks against the 22 you've been quoted elsewhere, which leaves a buffer for UAT.\n\nWe can't reach $119,000 for the same scope, but there are two options:\n\n1. Keep the full scope at $140,000 and move from 40% upfront to milestone payments in arrears, which I understand suits your finance team.\n2. If you're happy to move the reporting module to a phase 2, which your operations lead suggested, we can deliver the core portal for $126,000 on the same milestone terms and the same 16-week timeline.\n\nCould we take 20 minutes on Thursday to agree which works best? If we confirm by next Monday, we can hold the team and the trade-show date.\n\nBest regards,\nAlex",
      },
    },
    {
      id: "bd-a-rfp-responses",
      moduleId: "bd-advanced",
      trackId: "bd",
      title: "Responding to RFPs: Bid/No-Bid, Compliance and Win Themes",
      summary:
        "A request for proposal is the buyer's way of making a complex purchase comparable and defensible: one set of requirements, one format, one scoring method. In public sector work the rules are formal (in US federal buying, FAR 15.203 governs how RFPs are issued in negotiated acquisitions), and private enterprises copy the pattern. For an agency, the most important RFP skill is not writing, it is deciding which ones to answer.\n\nBid/no-bid comes first. An RFP that arrives unannounced, with requirements that read like another vendor's product sheet and a two-week deadline, is often written around an incumbent or a preferred supplier. Responding costs days of senior time. Qualify it like any deal: do you know the buyer, can you ask questions, does the scope fit your strengths, is the budget visible, and can you win on the scoring criteria? Answering everything lowers your win rate and burns the team.\n\nWhen you bid, compliance is the entry ticket and win themes win. Answer every requirement in the order and format asked, use their terminology, and respect page limits: evaluators often score with a matrix, and a missing answer scores zero however brilliant the rest is. Then weave two or three win themes (for example, 'live before your peak season', 'no vendor lock-in') through the executive summary and the answers, each backed by evidence.\n\nThe gotchas: reusing boilerplate that names another client or a different tech stack; claiming 'full compliance' with requirements you plan to deliver differently (that becomes a contractual problem later); and missing the clarification-question window, which is often the only chance to shape scope or learn what the buyer really values.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Acquisition.gov: FAR 15.203 Requests for proposals", url: "https://www.acquisition.gov/far/15.203", kind: "spec" },
        { label: "Loopio: Ideal RFP response process (8 steps)", url: "https://loopio.com/ultimate-rfp-response-process/", kind: "article" },
        { label: "Salesforce: What is an RFP? A complete guide", url: "https://www.salesforce.com/sales/request-for-proposal-rfp/", kind: "article" },
        { label: "HubSpot: RFP response formula", url: "https://blog.hubspot.com/agency/proposal-formula", kind: "article" },
      ],
      video: {
        title: "How To Respond To A RFP (Request for Proposal)? What Should You Include In Your Proposal?",
        channel: "The Futur",
        url: "https://www.youtube.com/watch?v=b9k6Ff0OMp8",
        videoId: "b9k6Ff0OMp8",
      },
      alternateVideos: [
        {
          title: "How to Create a Request for Proposal (RFP) and RFP Response",
          channel: "Visme",
          url: "https://www.youtube.com/watch?v=hNT0-R_0AJk",
          videoId: "hNT0-R_0AJk",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-a-rfp-responses-q1",
          prompt:
            "An RFP arrives from a company you have never spoken to. The deadline is in 10 days, the requirements mirror a competitor's product features, and the clarification window closed yesterday. What is the best decision?",
          options: [
            "Most likely no-bid: the signs point to a preferred vendor and you cannot shape or clarify scope",
            "Bid, because every RFP is a chance to win",
            "Bid at a deep discount to stand out",
            "Ask the buyer to extend the deadline by a month",
          ],
          correctIndex: 0,
          explanation:
            "No relationship, no clarification and requirements written around another product are classic signs of a wired RFP. Bidding costs senior time with a low chance of winning; a discount does not fix a scoring rubric built for someone else.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-rfp-responses-q2",
          prompt: "Which factors belong in a bid/no-bid decision? (Select all that apply.)",
          options: [
            "Whether you have a relationship with the buyer or insight into their needs",
            "How well the scope fits your proven strengths",
            "Whether the budget and scoring criteria are visible and winnable",
            "Whether the RFP document is professionally formatted",
            "Whether a competitor is also likely to bid",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Relationship, fit and a winnable, visible evaluation drive the odds of winning. Formatting says little, and competition is a given in an RFP, not a reason on its own.",
        },
        {
          id: "bd-a-rfp-responses-q3",
          prompt: "Why is strict compliance with the RFP's structure so important?",
          options: [
            "Evaluators often score against a matrix, and an answer that is missing or in the wrong place may score zero",
            "Non-compliant responses are illegal",
            "It lets you skip the executive summary",
            "Buyers never read the content, only the format",
          ],
          correctIndex: 0,
          explanation:
            "Evaluators working through a scoring sheet look for each answer where they expect it. Compliance does not win on its own, but non-compliance can lose regardless of quality.",
        },
        {
          id: "bd-a-rfp-responses-q4",
          prompt: "What is a 'win theme' in an RFP response?",
          options: [
            "A client-specific reason to choose you, repeated with evidence throughout the response",
            "A list of awards your agency has won",
            "The cheapest price option",
            "The design theme used in the proposal document",
          ],
          correctIndex: 0,
          explanation:
            "Win themes connect your strengths to the buyer's priorities, for example 'live before your peak season'. Awards may support a theme but are not a theme themselves.",
        },
        {
          id: "bd-a-rfp-responses-q5",
          prompt:
            "Requirement 4.3 asks for on-premise deployment. Your plan uses a managed cloud service with a private network, which you believe is better. How should you answer?",
          options: [
            "State clearly that you propose an alternative, explain why it meets the underlying need, and offer on-premise as an option",
            "Mark it 'fully compliant' and explain the difference after contract award",
            "Skip the requirement",
            "Mark it 'fully compliant' with no explanation",
          ],
          correctIndex: 0,
          explanation:
            "Claiming compliance for something you will deliver differently becomes a contractual problem later. A transparent alternative, with the compliant option still available, keeps you honest and may score well.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-rfp-responses-q6",
          prompt: "Why is the clarification-question window valuable?",
          options: [
            "It is often the only sanctioned chance to learn what the buyer values and to shape ambiguous scope",
            "It lets you ask for the competitors' prices",
            "It extends the submission deadline automatically",
            "Answers are kept private to you",
          ],
          correctIndex: 0,
          explanation:
            "Good questions reduce your risk and can steer scope. In many formal processes all bidders see the questions and answers, so phrase them knowing competitors will read them.",
        },
        {
          id: "bd-a-rfp-responses-q7",
          prompt: "Which are common, costly errors in RFP responses? (Select all that apply.)",
          options: [
            "Boilerplate that still names a different client",
            "Exceeding the page limit set in the RFP",
            "Answering in your own section order rather than the RFP's",
            "Using the buyer's terminology in your answers",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A wrong client name signals carelessness, and page limits and structure are scoring rules. Mirroring the buyer's terms is good practice.",
        },
        {
          id: "bd-a-rfp-responses-q8",
          prompt:
            "Your agency answers every RFP it receives, wins 6%, and senior engineers spend a week a month on bids. What is the most effective change?",
          options: [
            "Introduce a disciplined bid/no-bid gate and invest more effort in fewer, better-qualified bids",
            "Hire a proposal writer and keep answering everything",
            "Reuse the same response for every RFP to save time",
            "Lower prices on every bid",
          ],
          correctIndex: 0,
          explanation:
            "A low win rate with high effort usually means poor qualification. Fewer, better-chosen bids typically raise the win rate and free senior time; generic responses and price cuts make the problem worse.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-rfp-responses-q9",
          prompt: "What should the executive summary of an RFP response do?",
          options: [
            "Restate the buyer's goals, present your win themes and the outcome they will get, in language a non-technical approver understands",
            "Repeat your company history and team biographies",
            "Summarise every technical requirement",
            "List your price and nothing else",
          ],
          correctIndex: 0,
          explanation:
            "Senior approvers often read only the summary. It should argue why you, for their goals; history and technical detail belong elsewhere.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Below is a draft section of your agency's RFP response to a hospital group's patient-booking app tender. Mark the sentences that would hurt the bid or create risk.",
        segments: [
          { id: "r1", text: "Section 3.2 Response: Patient booking and reminders.", issue: null },
          { id: "r2", text: "We will deliver iOS and Android apps sharing one codebase, with booking, rescheduling and SMS reminders as specified in 3.2.1 to 3.2.4.", issue: null },
          { id: "r3", text: "As we did for RetailCo's loyalty app, we will use our proven e-commerce checkout module for payments.", issue: "Boilerplate naming another client and an irrelevant e-commerce module; signals copy-paste." },
          { id: "r4", text: "Requirement 3.2.5 (integration with your existing EHR via HL7 FHIR) is fully compliant.", issue: null },
          { id: "r5", text: "Requirement 3.2.6 (on-premise hosting) is fully compliant; we will host on our shared cloud account.", issue: "Claims compliance while proposing something different; becomes a contractual dispute." },
          { id: "r6", text: "Our approach is designed around your stated goal of cutting missed appointments before winter demand rises.", issue: null },
          { id: "r7", text: "Accessibility will be tested against WCAG 2.2 AA with real assistive-technology users.", issue: null },
          { id: "r8", text: "We guarantee a 100% reduction in missed appointments.", issue: "An impossible, unsupported guarantee that evaluators will distrust and that creates liability." },
          { id: "r9", text: "Detailed team CVs are provided in Appendix C, as requested in section 6.", issue: null },
          { id: "r10", text: "Delivery is planned in three phases over 20 weeks, with a pilot at one hospital first.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "bd-a-enterprise-procurement",
      moduleId: "bd-advanced",
      trackId: "bd",
      title: "Enterprise Deals and Procurement",
      summary:
        "Enterprise deals fail late, not early. The champion loves you, the demo went well, and then the deal disappears into procurement, security review and legal for three months, or dies there. The reason is that large organisations separate the people who want the solution from the people who approve the spend and manage the risk. MEDDPICC exists to make that visible: Metrics, Economic buyer, Decision criteria, Decision process, Paper process, Identify pain, Champion and Competition. The 'paper process' (how a signature actually happens: vendor onboarding, security questionnaire, legal redlines, purchase order) is the part agencies most often discover too late.\n\nFor an agency selling into an enterprise, expect: vendor registration and due diligence (company documents, insurance certificates, financial checks); an information-security questionnaire covering access control, data handling and incident response; a data processing agreement if you will touch personal data; the client's own MSA paper rather than yours; and payment terms of 45 to 90 days. Public-sector buyers add formal procurement law (in the UK, the Procurement Act 2023 regime).\n\nThe trade-off: enterprise deals are larger, stickier and create referenceable logos, but they lengthen the sales cycle, tie up senior people, and strain cash flow through long payment terms. A small agency can win an enterprise deal and still be hurt by it.\n\nThe gotchas: forecasting the close date from the champion's optimism rather than the paper process; letting the champion 'handle procurement' alone; and starting work before the PO exists because the business sponsor said 'go ahead', which leaves you unpaid if procurement stalls. Map the paper process in the first few meetings and build it into the mutual close plan.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "MEDDICC: The MEDDPICC sales methodology (Paper Process, Economic Buyer)", url: "https://meddicc.com/meddpicc-sales-methodology-and-process", kind: "spec" },
        { label: "GOV.UK: Procurement Act 2023 guidance documents", url: "https://www.gov.uk/government/collections/procurement-act-2023-guidance-documents", kind: "docs" },
        { label: "HubSpot: Enterprise sales", url: "https://blog.hubspot.com/sales/enterprise-sales", kind: "article" },
        { label: "HubSpot: Enterprise sales prospecting", url: "https://blog.hubspot.com/sales/enterprise-sales-prospecting", kind: "article" },
      ],
      video: {
        title: "Enterprise Sales | Startup School",
        channel: "Y Combinator",
        url: "https://www.youtube.com/watch?v=0fKYVl12VTA",
        videoId: "0fKYVl12VTA",
      },
      alternateVideos: [
        {
          title: "12 Years of Enterprise Sales Learnings In 29 Minutes",
          channel: "30 Minutes to President’s Club",
          url: "https://www.youtube.com/watch?v=QXYKH7UWID4",
          videoId: "QXYKH7UWID4",
          durationLabel: "29:47",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-a-enterprise-procurement-q1",
          prompt: "In MEDDPICC, what does the 'Paper Process' cover?",
          options: [
            "The steps from verbal 'yes' to a signed contract and purchase order: legal, procurement, security and approvals",
            "How the client prints and files documents",
            "The format of your proposal",
            "The client's internal budgeting cycle only",
          ],
          correctIndex: 0,
          explanation:
            "Paper process is the mechanics of getting to signature and PO. It is separate from the decision process (how they choose) and often takes longer than agencies expect.",
        },
        {
          id: "bd-a-enterprise-procurement-q2",
          prompt:
            "Your champion, a VP of Operations, says, \"We'll sign by month-end.\" You have not spoken to procurement, legal or security. How should you forecast this deal?",
          options: [
            "As uncertain: the close date depends on a paper process you have not mapped",
            "As closing this month, because the VP is senior",
            "As lost, because you have not met procurement",
            "As closed-won, since the decision is made",
          ],
          correctIndex: 0,
          explanation:
            "Enterprise close dates are set by the paper process, not by a champion's intent. Commit the date only after you know the steps and their owners.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-enterprise-procurement-q3",
          prompt: "Which are typical enterprise requirements for a new software agency vendor? (Select all that apply.)",
          options: [
            "Completing an information-security questionnaire",
            "A data processing agreement if you will handle personal data",
            "Proof of insurance and company registration",
            "Using your agency's standard MSA without changes",
            "Payment in full upfront",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Security review, a DPA and vendor due diligence are standard. Enterprises usually insist on their own contract paper and pay in arrears on 45 to 90 day terms.",
        },
        {
          id: "bd-a-enterprise-procurement-q4",
          prompt: "Who is the Economic Buyer in an enterprise deal?",
          options: [
            "The person with the authority to approve the spend, who can say yes when others say no",
            "The person who uses the software most",
            "The procurement officer who sends the PO",
            "Your main day-to-day contact",
          ],
          correctIndex: 0,
          explanation:
            "The Economic Buyer has final budget authority. Procurement administers the purchase, and your contact may be a champion without spending authority.",
        },
        {
          id: "bd-a-enterprise-procurement-q5",
          prompt:
            "The business sponsor says, \"Start next Monday; the PO will follow.\" Procurement has not yet onboarded you as a vendor. What is the safest response?",
          options: [
            "Agree a start date tied to the PO, and offer low-cost preparation (kick-off planning) until it arrives",
            "Start full delivery Monday to show commitment",
            "Refuse to talk until the PO is issued",
            "Start work and invoice the sponsor personally",
          ],
          correctIndex: 0,
          explanation:
            "Work without a PO risks going unpaid if procurement stalls or changes terms. Light preparation keeps momentum without putting delivery cost at risk.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-enterprise-procurement-q6",
          prompt: "Why can a large enterprise win strain a small agency's finances even when the deal is profitable?",
          options: [
            "Long payment terms mean you pay salaries for months before the client's money arrives",
            "Enterprises always pay below market rates",
            "Enterprise work cannot be invoiced in milestones",
            "Profits from enterprise deals are taxed differently",
          ],
          correctIndex: 0,
          explanation:
            "On 60 to 90 day terms, an agency funds payroll for two or three months of delivery before cash arrives. Plan cash flow and negotiate milestone billing or a mobilisation payment.",
        },
        {
          id: "bd-a-enterprise-procurement-q7",
          prompt: "What is a mutual close plan?",
          options: [
            "A shared, dated list of the steps both sides must complete to reach signature and start, with owners",
            "A discount offered if the client signs by a deadline",
            "Your internal forecast for the quarter",
            "The project plan for delivery",
          ],
          correctIndex: 0,
          explanation:
            "A mutual close plan makes the paper process visible and shared, which surfaces missing steps early and turns vague timelines into commitments.",
        },
        {
          id: "bd-a-enterprise-procurement-q8",
          prompt:
            "Halfway through procurement, a new stakeholder from IT security joins and raises concerns about your data handling. Which actions help? (Select all that apply.)",
          options: [
            "Offer a call between their security lead and your technical lead",
            "Provide your security policies and answer their questionnaire promptly",
            "Ask your champion to help you understand the security team's criteria",
            "Ask the business sponsor to overrule IT security",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Security stakeholders are part of the decision criteria. Engaging them directly and quickly works; trying to have them overruled usually creates an enemy with a veto.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-enterprise-procurement-q9",
          prompt: "Why do enterprises often insist on using their own contract paper rather than your MSA?",
          options: [
            "Their legal team has standard positions on liability, IP and data, and reviewing a vendor's template for every purchase is slow and risky for them",
            "Vendor contracts are not legally valid",
            "It is required by all procurement laws",
            "It lets them avoid paying invoices",
          ],
          correctIndex: 0,
          explanation:
            "Using their paper standardises risk. Expect redlines on liability caps, IP ownership and indemnities, and know in advance which positions you can accept.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You are selling a $300,000 internal workflow platform to a 5,000-person insurance company. Your champion is the Head of Claims Operations. The CFO has budget authority. The company has never bought from your agency before.",
        steps: [
          {
            id: "e1",
            question: "After a strong demo, the Head of Claims says, \"Send the proposal, I'll get it signed.\" What do you do first?",
            options: [
              "Ask her to walk you through how a purchase like this gets approved and signed, and who is involved",
              "Send the proposal immediately and forecast the deal for this month",
              "Email the CFO directly to ask for the signature",
              "Offer a discount for signing this month",
            ],
            correctIndex: 0,
            explanation: "Mapping the decision and paper process early, through the champion, prevents surprises later.",
          },
          {
            id: "e2",
            question:
              "You learn the steps: CFO approval, vendor onboarding (6 weeks), a security questionnaire and legal review of their MSA. The champion wants to start in 4 weeks. What do you propose?",
            options: [
              "A mutual close plan that runs onboarding and the security questionnaire in parallel, with owners and dates, and a realistic start date",
              "Starting in 4 weeks anyway and sorting paperwork later",
              "Waiting until onboarding finishes before doing anything else",
              "Asking the champion to skip vendor onboarding",
            ],
            correctIndex: 0,
            explanation: "Running steps in parallel with clear owners shortens the timeline honestly; starting without paperwork risks working unpaid.",
          },
          {
            id: "e3",
            question:
              "Legal returns their MSA with unlimited liability for the vendor and payment on 90-day terms. Your agency's cash position is tight. What is the best approach?",
            options: [
              "Escalate liability to your leadership and counsel, propose a cap tied to fees, and negotiate a mobilisation payment or 45-day terms",
              "Sign as is to avoid delaying the deal",
              "Refuse to continue unless they use your MSA",
              "Accept the liability but double your price without explanation",
            ],
            correctIndex: 0,
            explanation: "Liability and payment terms are negotiable and material; involve counsel, propose a standard fee-based cap, and protect cash flow.",
          },
        ],
      },
    },
    {
      id: "bd-a-account-management-expansion",
      moduleId: "bd-advanced",
      trackId: "bd",
      title: "Account Management: Upselling and Cross-Selling",
      summary:
        "For an agency, the cheapest revenue is the next project from a client who already trusts you. There is no new-logo acquisition cost, no vendor onboarding, and the team already knows the codebase. Yet many agencies treat accounts as finished when a project ships, and the client's next initiative goes to whoever pitched it. Account management exists to keep the relationship deliberate: know the client's goals beyond the current project, keep delivery healthy, and earn the right to propose the next thing.\n\nUpselling grows what the client already buys (more capacity, a support retainer, the phase 2 they deferred); cross-selling adds a different service (an AI feature on top of the app you built, a data platform, QA automation). Both work only on a foundation of delivered value. Expansion conversations should start from outcomes ('since launch, repeat orders are up; the next bottleneck is…'), not from your capacity ('we have two engineers free').\n\nThe trade-offs: pushing expansion while delivery is shaky destroys trust fast, and a single account that becomes a large share of your revenue is a concentration risk. Also, expansion usually needs new stakeholders: the person who bought the app is not the person who owns the data team's budget.\n\nThe gotchas: relying on one contact (single-threaded) so the account collapses when they leave; letting the delivery team be the only voice in the account, which tends to produce change requests rather than strategic proposals; and confusing a large retainer with a healthy account when the client is quietly preparing to move work in-house. Track health signals (sponsor engagement, invoice disputes, usage of what you built) as seriously as revenue.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "MEDDICC: The MEDDPICC sales methodology (Champion)", url: "https://meddicc.com/meddpicc-sales-methodology-and-process", kind: "spec" },
        { label: "Salesforce: What is account management?", url: "https://www.salesforce.com/sales/account-management/", kind: "article" },
        { label: "HubSpot: Upselling", url: "https://blog.hubspot.com/sales/upselling", kind: "article" },
        { label: "Gainsight: The essential guide to customer success", url: "https://www.gainsight.com/essential-guide/customer-success/", kind: "article" },
      ],
      video: {
        title: "Upsell & Expansion Masterclass: 7 Levers to Grow Any Account",
        channel: "30 Minutes to President’s Club",
        url: "https://www.youtube.com/watch?v=KPJbIItdYPI",
        videoId: "KPJbIItdYPI",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-a-account-management-expansion-q1",
          prompt: "What is the difference between upselling and cross-selling for an agency?",
          options: [
            "Upselling grows what the client already buys; cross-selling adds a different service",
            "Upselling is for new clients; cross-selling is for existing ones",
            "They are the same thing",
            "Cross-selling always means reselling third-party software",
          ],
          correctIndex: 0,
          explanation:
            "Extending a retainer or adding phase 2 is an upsell; adding an AI feature, QA automation or a data platform is a cross-sell. Both apply to existing clients.",
        },
        {
          id: "bd-a-account-management-expansion-q2",
          prompt:
            "Delivery on the current project is two sprints late and the client is frustrated. Your manager wants you to pitch a new AI module this week. What is the best approach?",
          options: [
            "Stabilise delivery first and agree a recovery plan; raise expansion once trust is restored",
            "Pitch the AI module now to distract from the delay",
            "Offer the AI module free to compensate for the delay",
            "Ask the delivery team to pitch it instead",
          ],
          correctIndex: 0,
          explanation:
            "Expansion depends on delivered value. Pitching during a delivery problem reads as tone-deaf and can cost the existing work; free work sets a precedent without fixing the cause.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-account-management-expansion-q3",
          prompt: "Which are healthy account signals? (Select all that apply.)",
          options: [
            "The executive sponsor attends quarterly reviews",
            "Users actively use what you built",
            "The client shares their roadmap with you",
            "The client recently hired a head of engineering who has not met you",
            "Invoices are increasingly disputed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Sponsor engagement, real usage and roadmap sharing indicate a strong relationship. A new technical leader you have not met is a risk (they may favour in-house), and invoice disputes are a warning sign.",
        },
        {
          id: "bd-a-account-management-expansion-q4",
          prompt: "Why is being single-threaded in an account dangerous?",
          options: [
            "If your one contact leaves or loses influence, you lose access, context and advocacy at once",
            "Clients only allow one contact per vendor",
            "It increases your invoice amounts",
            "It makes delivery slower",
          ],
          correctIndex: 0,
          explanation:
            "Relationships with several stakeholders (sponsor, users, technical leads, finance) make the account resilient to people changes.",
        },
        {
          id: "bd-a-account-management-expansion-q5",
          prompt: "Which opening for an expansion conversation is strongest?",
          options: [
            "\"Since launch, repeat orders rose noticeably. The next bottleneck we see is manual returns. Is that on your list for next year?\"",
            "\"We have two engineers free next month. Do you have any work for them?\"",
            "\"We've just launched an AI service. Would you like a demo?\"",
            "\"Our rates go up next quarter, so you should commit now.\"",
          ],
          correctIndex: 0,
          explanation:
            "Opening from the outcome you delivered and the client's next problem positions you as a partner. Offering spare capacity or a generic product pitch centres your needs, not theirs.",
        },
        {
          id: "bd-a-account-management-expansion-q6",
          prompt:
            "One client now generates 45% of your agency's revenue on a growing retainer. What is the main risk?",
          options: [
            "Concentration: losing or shrinking that account would seriously damage the business and weakens your negotiating position",
            "There is no risk while the retainer grows",
            "The client will demand equity in your agency",
            "You will have to pay more tax",
          ],
          correctIndex: 0,
          explanation:
            "Revenue concentration creates dependency. Grow the account, but diversify the pipeline and avoid letting one client's terms dictate your business.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-account-management-expansion-q7",
          prompt: "What usually needs to happen for a cross-sell into a different department of the same client?",
          options: [
            "Find and qualify a new stakeholder who owns that department's problem and budget",
            "Ask your current contact to approve it on their behalf",
            "Add it as a change request to the current project",
            "Wait for the client to issue an RFP",
          ],
          correctIndex: 0,
          explanation:
            "A cross-sell is a new sale inside a known company: new pain, new budget holder. Your current contact can introduce you but rarely owns the other department's spend.",
        },
        {
          id: "bd-a-account-management-expansion-q8",
          prompt:
            "Your retainer is large and stable, but you notice the client is hiring several senior engineers in the same technology you work in. What should you do?",
          options: [
            "Treat it as a possible in-sourcing signal and talk openly with the sponsor about their plans and how you could help the transition or focus elsewhere",
            "Ignore it, since the retainer is stable",
            "Lower your rates pre-emptively",
            "Ask the delivery team to work slower so the client needs you longer",
          ],
          correctIndex: 0,
          explanation:
            "Hiring in your area often means work is moving in-house. An open conversation lets you shape the transition (handover, specialist work, support) rather than be surprised.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-account-management-expansion-q9",
          prompt: "Which belong in a quarterly business review with a client? (Select all that apply.)",
          options: [
            "Outcomes delivered against the goals agreed at the start",
            "Risks and issues, with what you are doing about them",
            "The client's priorities for the next two quarters",
            "A detailed list of every ticket closed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A QBR is a strategic conversation about outcomes, risks and what comes next. A ticket log is operational detail that belongs in delivery reports.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write a one-page account expansion plan summary for internal review. Include the account's current state, two or three expansion opportunities with who owns each, risks, and the next three actions with dates.",
        context:
          "Client: a regional pharmacy chain (120 stores). Your agency built their customer app 14 months ago and runs a $12,000/month support retainer. Results: app orders now about 18% of prescription refills. Your contact is the Head of Digital; the executive sponsor (COO) attended the launch but no review since. Signals: the pharmacy operations team still handles stock transfers by phone; the marketing director mentioned at a dinner that they want personalised offers; IT recently posted a job ad for a mobile developer. Two invoices last quarter were paid 30 days late.",
        wordLimit: 350,
        rubric: [
          { id: "state", label: "Honest current state", description: "Summarises value delivered and health signals, including risks (sponsor disengaged, mobile hiring, late payments).", weight: 1 },
          { id: "opps", label: "Grounded opportunities with owners", description: "Names two or three opportunities tied to evidence (stock transfers for operations, personalised offers for marketing) and the stakeholder who would own each budget.", weight: 1.5 },
          { id: "threads", label: "Multi-threading", description: "Plans to re-engage the COO and meet new stakeholders rather than relying only on the Head of Digital.", weight: 1 },
          { id: "risk", label: "Addresses the risks", description: "Plans an open conversation about the mobile hire (in-sourcing) and checks the late payments.", weight: 1 },
          { id: "actions", label: "Concrete next actions", description: "Three specific, dated actions with owners.", weight: 1 },
        ],
        sampleAnswer:
          "Account: regional pharmacy chain. Current state: our customer app handles about 18% of prescription refills 14 months after launch, on a $12k/month support retainer. Health is mixed. The Head of Digital is engaged, but the COO has not seen results since launch, two invoices were 30 days late last quarter, and IT is hiring a mobile developer, which may mean they plan to bring app work in-house.\n\nOpportunities:\n1. Store stock-transfer tool. Operations still handles transfers by phone. The likely owner is the Head of Pharmacy Operations, reporting to the COO. This would be a cross-sell built on the existing backend.\n2. Personalised offers in the app. The marketing director raised it informally. The owner is the Marketing Director; we need to understand their data and consent position first.\n3. Retainer reshaped as a hybrid. If they hire in-house, we offer specialist work, architecture and a handover plan instead of losing the account.\n\nRisks: the disengaged sponsor, possible in-sourcing, and late payments that may signal budget pressure.\n\nNext actions:\n- By 15 Nov (account lead): ask the Head of Digital to set up a results review with the COO and bring the refill data.\n- By 22 Nov (account lead): ask openly about the mobile hire and propose how we can support it.\n- By 29 Nov (account lead with finance): check the late invoices with accounts payable, then request an intro to the Head of Pharmacy Operations to scope the stock-transfer problem.",
      },
    },
    {
      id: "bd-a-pipeline-metrics-forecasting",
      moduleId: "bd-advanced",
      trackId: "bd",
      title: "Pipeline Metrics and Forecasting: Win Rate, Cycle, ACV, Weighted Pipeline",
      summary:
        "An agency's forecast decides who gets hired, who sits on the bench and whether payroll is safe in four months. A pipeline that looks like $2M but converts like $300k is worse than a smaller honest one, because it leads to hiring ahead of revenue. The metrics exist to make the pipeline tell the truth.\n\nThe core set: win rate (won deals divided by all deals that reached a decision, ideally counting 'no decision' as a loss, because it usually is); sales cycle length (days from qualified opportunity to signature, measured on won deals); average deal size and ACV (annual contract value: for a three-year, $360k retainer the ACV is $120k, which makes multi-year and one-off deals comparable); weighted pipeline (each open deal's value times its stage probability, summed); and coverage (pipeline divided by the remaining target, often wanted at around three times unweighted, but your own win rate should set the number). Sales velocity combines them: opportunities × win rate × average deal size ÷ cycle length gives revenue per day.\n\nThe trade-off is precision versus honesty. Stage-probability weighting is simple and transparent but crude: a 40% 'proposal' stage hides both a deal certain to close and one that went silent. Many teams pair it with forecast categories (commit, best case, pipeline) judged deal by deal on evidence.\n\nThe gotchas are human. Stale deals with past close dates inflate the pipeline; reps sandbag commits to look good later, or sit on 'happy ears' deals; and stage probabilities copied from a blog rather than your own historical conversion are fiction. Clean the pipeline weekly, require a next step with a date on every open deal, and calibrate probabilities from your actual win history.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "HubSpot Knowledge Base: Use the forecast tool", url: "https://knowledge.hubspot.com/forecast/use-the-forecast-tool", kind: "docs" },
        { label: "HubSpot Knowledge Base: Set up and manage object pipelines", url: "https://knowledge.hubspot.com/object-settings/set-up-and-customize-pipelines", kind: "docs" },
        { label: "HubSpot: Win rate", url: "https://blog.hubspot.com/sales/win-rate", kind: "article" },
        { label: "HubSpot: Sales forecasting", url: "https://blog.hubspot.com/sales/sales-forecasting", kind: "article" },
      ],
      video: {
        title: "How to Build a Bulletproof Sales Forecast w/ Taylor Wilding",
        channel: "30 Minutes to President’s Club",
        url: "https://www.youtube.com/watch?v=4FypEKgtxnk",
        videoId: "4FypEKgtxnk",
      },
      alternateVideos: [
        {
          title: "How to Run a Lightning-Fast Pipeline Review That Actually Works",
          channel: "30 Minutes to President’s Club",
          url: "https://www.youtube.com/watch?v=xCipPy7y_Nk",
          videoId: "xCipPy7y_Nk",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-a-pipeline-metrics-forecasting-q1",
          prompt:
            "Last quarter you won 8 deals, lost 12, and 10 ended in 'no decision'. What is your win rate if 'no decision' counts as a loss?",
          options: ["About 27%", "40%", "About 67%", "8%"],
          correctIndex: 0,
          explanation:
            "8 ÷ (8 + 12 + 10) = 8 ÷ 30 ≈ 27%. Excluding 'no decision' gives 8 ÷ 20 = 40%, which flatters you, because the work was spent and the deal did not close.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-pipeline-metrics-forecasting-q2",
          prompt: "A client signs a three-year support retainer worth $360,000 in total. What is its ACV?",
          options: ["$120,000", "$360,000", "$30,000", "$10,000"],
          correctIndex: 0,
          explanation:
            "ACV annualises contract value: $360,000 ÷ 3 = $120,000. $30,000 is the monthly figure divided wrongly, and $10,000 is the monthly value.",
        },
        {
          id: "bd-a-pipeline-metrics-forecasting-q3",
          prompt: "How is weighted pipeline calculated?",
          options: [
            "The sum of each open deal's value multiplied by its stage probability",
            "Total open pipeline divided by the number of deals",
            "The value of the largest deal times the win rate",
            "Closed revenue plus open pipeline",
          ],
          correctIndex: 0,
          explanation:
            "Weighting reflects that not every open deal will close. Average deal size and closed-plus-open are different measures.",
        },
        {
          id: "bd-a-pipeline-metrics-forecasting-q4",
          prompt:
            "You have 20 qualified opportunities, a 25% win rate, a $60,000 average deal and a 90-day cycle. What is your sales velocity?",
          options: ["About $3,333 per day", "About $13,333 per day", "$300,000 per day", "About $833 per day"],
          correctIndex: 0,
          explanation:
            "20 × 0.25 × $60,000 = $300,000, divided by 90 days ≈ $3,333 a day. Velocity improves by raising any of the top three or shortening the cycle.",
        },
        {
          id: "bd-a-pipeline-metrics-forecasting-q5",
          prompt: "Which practices make a forecast more honest? (Select all that apply.)",
          options: [
            "Requiring every open deal to have a dated next step",
            "Calibrating stage probabilities from your own historical conversion",
            "Removing or re-dating deals whose close dates have passed",
            "Using industry-standard stage probabilities you found online",
            "Letting each rep set probabilities based on how they feel",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Next steps, your own data and a clean pipeline keep numbers honest. Generic probabilities ignore your reality, and gut-feel probabilities invite 'happy ears'.",
        },
        {
          id: "bd-a-pipeline-metrics-forecasting-q6",
          prompt:
            "Two deals are both in the 'Proposal sent' stage at 40%. Deal A has a meeting with the economic buyer next week; Deal B has not replied in five weeks. What does this show?",
          options: [
            "Stage weighting hides real differences, so deal-level judgement (forecast categories) is also needed",
            "Both deals are equally likely to close",
            "Deal B should be moved to 90%",
            "Stage probabilities should be removed entirely",
          ],
          correctIndex: 0,
          explanation:
            "Stage weighting is a useful average, not a deal-level truth. Pair it with evidence-based categories (commit, best case, pipeline) so silent deals are not counted like active ones.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-pipeline-metrics-forecasting-q7",
          prompt: "How should sales cycle length usually be measured?",
          options: [
            "Days from qualified opportunity to signature, on won deals",
            "Days from first website visit to project delivery",
            "Days from proposal to invoice payment",
            "Average age of all open deals",
          ],
          correctIndex: 0,
          explanation:
            "Using won deals from qualification to signature gives a cycle you can plan with. Delivery and payment timing are separate, and open-deal age is a hygiene metric.",
        },
        {
          id: "bd-a-pipeline-metrics-forecasting-q8",
          prompt:
            "Your remaining quarterly target is $200,000 and your historical win rate is 25%. Roughly how much qualified unweighted pipeline do you need for the quarter?",
          options: ["About $800,000", "About $600,000", "$200,000", "$50,000"],
          correctIndex: 0,
          explanation:
            "At a 25% win rate you need about four times the target: $800,000. The common 'three times' rule assumes roughly a 33% win rate, so set coverage from your own numbers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-pipeline-metrics-forecasting-q9",
          prompt: "Which behaviours distort a forecast? (Select all that apply.)",
          options: [
            "Sandbagging: keeping likely deals out of 'commit' so you can beat the number later",
            "'Happy ears': committing deals because the contact sounded positive",
            "Leaving deals open long after the client went silent",
            "Recording the reason when a deal is lost",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Sandbagging understates, happy ears and zombie deals overstate. Recording loss reasons improves future forecasting.",
        },
        {
          id: "bd-a-pipeline-metrics-forecasting-q10",
          prompt: "Why does forecast accuracy matter more for an agency than for many product companies?",
          options: [
            "Agency revenue is delivered by people, so hiring and bench decisions depend directly on what the forecast says will close",
            "Agencies are legally required to publish forecasts",
            "Product companies do not have sales pipelines",
            "Agencies are not allowed to hire contractors",
          ],
          correctIndex: 0,
          explanation:
            "An over-optimistic forecast leads to hiring ahead of revenue, while an over-cautious one leads to turning work away. Both hit margin directly.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Prepare the quarterly pipeline review from the data below. The quarterly target is $150,000 and $40,000 has already closed. Last quarter's outcomes: 6 won, 14 lost, 5 'no decision'. Count 'no decision' as a loss.",
        table: {
          columns: ["Open deal", "Stage", "Stage probability", "Value"],
          rows: [
            ["A: Logistics portal", "Discovery", "10%", "$120,000"],
            ["B: Clinic booking app", "Proposal", "40%", "$80,000"],
            ["C: Retail loyalty app", "Negotiation", "70%", "$60,000"],
            ["D: Field-service app", "Proposal", "40%", "$45,000"],
            ["E: AI support assistant", "Verbal commit", "90%", "$30,000"],
          ],
        },
        fields: [
          { id: "weighted", label: "Weighted pipeline", unit: "$", answer: 131000, tolerance: 1 },
          { id: "winRate", label: "Last quarter's win rate", unit: "%", answer: 24, tolerance: 0.1 },
          { id: "gap", label: "Remaining gap to target", unit: "$", answer: 110000, tolerance: 1 },
          { id: "coverage", label: "Weighted pipeline ÷ remaining gap (coverage ratio)", unit: "x", answer: 1.19, tolerance: 0.01 },
        ],
        explanation:
          "Weighted = 12,000 + 32,000 + 42,000 + 18,000 + 27,000 = $131,000. Win rate = 6 ÷ (6 + 14 + 5) = 24%. Gap = 150,000 − 40,000 = $110,000. Coverage = 131,000 ÷ 110,000 ≈ 1.19x. That looks safe, but $12,000 of it sits in a discovery-stage deal and the unweighted total ($335,000) is only about three times the gap at a 24% win rate, so the team still needs new pipeline.",
      },
    },
    {
      id: "bd-a-case-studies-social-proof",
      moduleId: "bd-advanced",
      trackId: "bd",
      title: "Case Studies and Social Proof",
      summary:
        "Buyers of custom software are buying a promise: that this team will build something that works, on time, for a business like theirs. Social proof reduces that risk by showing it has happened before. The strongest forms, in rough order of persuasive power for a B2B buyer, are a reference call with a similar client, a case study with measured outcomes, a named testimonial, recognisable client logos, and review-platform ratings.\n\nA case study that sells follows the buyer's own logic: the client's situation and problem (so the reader sees themselves), why they chose you, what you did (decisions, not a feature list), and measured results with a timeframe, ideally with a quote from the client. 'Built a beautiful app' is not a result; 'cut order handling time from 12 minutes to 2 within three months of launch' is. Match proof to the prospect: a hospital group cares about a healthcare case study far more than a famous retail logo.\n\nThere are legal and ethical limits, not just style ones. Many client contracts restrict naming the client, and white-label work often cannot be attributed at all, so you need written permission or an anonymised version ('a 200-store European grocery chain'). Advertising rules apply too: the US FTC's Endorsement Guides require testimonials to reflect genuine experience, require disclosure of material connections (for example, a discount given in exchange for a testimonial), and treat results presented as typical as claims that need substantiation.\n\nThe gotchas: inflating or rounding up metrics (a prospect who calls the reference will find out), case studies about the technology rather than the client's outcome, and a library that is two years old and full of projects that no longer reflect what you sell. Collect metrics during delivery, while the baseline is still known.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "FTC: Endorsements, Influencers, and Reviews", url: "https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews", kind: "docs" },
        { label: "FTC: Endorsement Guides, what people are asking", url: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking", kind: "docs" },
        { label: "HubSpot: How to write a case study (guide & template)", url: "https://blog.hubspot.com/blog/tabid/6307/bid/33282/the-ultimate-guide-to-creating-compelling-case-studies.aspx", kind: "article" },
        { label: "HubSpot: Turn a case study into a customer success story", url: "https://blog.hubspot.com/marketing/customer-success-story", kind: "article" },
      ],
      video: {
        title: "Creating Customer Success Stories that Drive B2B Sales with Joel Klettke",
        channel: "Aaron Zakowski",
        url: "https://www.youtube.com/watch?v=NqoM9i7LFJc",
        videoId: "NqoM9i7LFJc",
      },
      alternateVideos: [
        {
          title: "Sales Training Tip #62 - Social Proof : Testimonials, Case Studies or Videos",
          channel: "Victor Antonio",
          url: "https://www.youtube.com/watch?v=kB0hYOj8C0M",
          videoId: "kB0hYOj8C0M",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-a-case-studies-social-proof-q1",
          prompt: "Which of these is a result worth putting in a case study?",
          options: [
            "Order handling time fell from 12 minutes to 2 within three months of launch",
            "We built a beautiful, modern app",
            "The project used React Native and Node.js",
            "The client was very happy with the team",
          ],
          correctIndex: 0,
          explanation:
            "A measured before-and-after with a timeframe is evidence. Aesthetics, tech stack and general happiness are claims a buyer cannot weigh.",
        },
        {
          id: "bd-a-case-studies-social-proof-q2",
          prompt:
            "You built a successful app under a white-label arrangement for another agency's client. Can you publish it as a named case study?",
          options: [
            "Only with written permission from the parties your contract requires, and white-label terms often forbid attribution, so an anonymised version may be the limit",
            "Yes, because your team wrote the code",
            "Yes, as long as you do not mention the partner agency",
            "Yes, once the project is more than a year old",
          ],
          correctIndex: 0,
          explanation:
            "Confidentiality and white-label terms decide this, not authorship or time. Check the contract and get permission; otherwise anonymise.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-case-studies-social-proof-q3",
          prompt: "Which elements make a B2B case study persuasive? (Select all that apply.)",
          options: [
            "The client's situation and problem, so the reader recognises themselves",
            "The key decisions you made and why",
            "Measured results with a timeframe",
            "A complete list of every feature delivered",
            "A long history of your agency",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Problem, decisions and outcomes follow the buyer's logic. Feature lists and agency history make the story about you.",
        },
        {
          id: "bd-a-case-studies-social-proof-q4",
          prompt:
            "A client agreed to give a video testimonial in exchange for a 10% discount on their next invoice. Under the FTC's Endorsement Guides, what does this require?",
          options: [
            "Clearly disclosing the material connection (the discount) wherever the testimonial is used",
            "Nothing, because the client really is satisfied",
            "Only that the client signs a release form",
            "Removing the client's name",
          ],
          correctIndex: 0,
          explanation:
            "A benefit given for an endorsement is a material connection that must be disclosed. Genuine satisfaction does not remove the duty, and a release is a separate permission issue.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-case-studies-social-proof-q5",
          prompt: "You are pitching a hospital group. Which proof is likely to be most persuasive?",
          options: [
            "A reference call with a healthcare client who faced a similar integration problem",
            "A logo wall featuring a famous retail brand",
            "Your agency's five-star rating on a review site",
            "A testimonial about your team's friendliness",
          ],
          correctIndex: 0,
          explanation:
            "Relevance beats fame: a similar client describing a similar problem lowers perceived risk most. Logos and ratings help, but less.",
        },
        {
          id: "bd-a-case-studies-social-proof-q6",
          prompt:
            "The real result was a 23% reduction in support tickets. Marketing wants to write 'cut support tickets by a third'. What is the problem?",
          options: [
            "It overstates the result, and a prospect who speaks to the reference or the client may find out",
            "Fractions are harder to read than percentages",
            "Support tickets are not a valid metric",
            "Nothing: rounding is standard",
          ],
          correctIndex: 0,
          explanation:
            "23% is not a third. Inflated metrics are an ethical and legal risk and destroy credibility if discovered; use the real number.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-case-studies-social-proof-q7",
          prompt: "When is the best time to gather case-study metrics?",
          options: [
            "During delivery, recording the baseline before launch and agreeing how outcomes will be measured",
            "A year after the project ends",
            "Only if the client asks for a case study",
            "During the sales process, before the project starts",
          ],
          correctIndex: 0,
          explanation:
            "Without a baseline, there is no before-and-after. Agreeing measurement during delivery also keeps the project focused on outcomes.",
        },
        {
          id: "bd-a-case-studies-social-proof-q8",
          prompt: "Which approaches let you use proof when a client cannot be named? (Select all that apply.)",
          options: [
            "An anonymised case study describing the client by sector and size",
            "A reference call arranged privately with the client's agreement",
            "Sharing aggregate results across several similar projects",
            "Publishing the client's name in small print",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anonymised stories, private references and aggregate results all respect confidentiality. Small print is still naming the client.",
        },
        {
          id: "bd-a-case-studies-social-proof-q9",
          prompt: "Your case-study library is mostly two-year-old marketing websites, but you now mainly sell AI-enabled platforms. What is the impact?",
          options: [
            "Your proof no longer supports what you sell, so prospects see less evidence for exactly the work you want",
            "No impact, since any proof is good proof",
            "It shows longevity, which is always positive",
            "It reduces your legal risk",
          ],
          correctIndex: 0,
          explanation:
            "Proof should match your current offer. Prioritise case studies from projects that resemble the deals you want next.",
        },
      ],
      practice: {
        kind: "spot",
        prompt: "Mark the sentences in this draft case study that are risky, misleading or weak.",
        segments: [
          { id: "s1", text: "Client: a 60-clinic physiotherapy group in the UK (anonymised at the client's request).", issue: null },
          { id: "s2", text: "Challenge: patients booked by phone, and reception teams spent about 40% of their day on calls.", issue: null },
          { id: "s3", text: "We chose online booking with calendar sync because the clinics' practice-management system already exposed an API.", issue: null },
          { id: "s4", text: "Results: phone bookings fell from 70% to 35% of all bookings within four months of launch.", issue: null },
          { id: "s5", text: "Like our work for Northshore Dental, which you can see on our website, this was delivered in record time.", issue: "Names another client (possibly without permission) and makes a vague, unsupported 'record time' claim." },
          { id: "s6", text: "Every clinic group that uses our booking platform halves its phone calls.", issue: "Presents one result as typical for all clients without substantiation." },
          { id: "s7", text: "'Our reception teams finally have time for patients,' said the group's operations director.", issue: null },
          { id: "s8", text: "The operations director received a free month of support for providing this quote.", issue: null },
          { id: "s9", text: "The app uses React Native, Node.js, PostgreSQL, Redis, Docker and 14 microservices.", issue: "A tech-stack list instead of client value; it does not help the buyer." },
          { id: "s10", text: "Next, the group plans to add automated appointment reminders.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "bd-a-white-label-partnerships",
      moduleId: "bd-advanced",
      trackId: "bd",
      title: "White-Label Products and Partnerships",
      summary:
        "'White-label' means one company builds something and another sells it under its own brand. For an agency it shows up in two ways. First, white-label products: a reusable platform (a delivery app, a booking system, a marketplace) rebranded and configured for each client, so the client gets a proven product faster and cheaper than a custom build. Second, white-label partnerships: you deliver services for another company (a marketing agency, a consultancy, a SaaS vendor) whose client never sees your name.\n\nWhite-label products trade uniqueness for speed and price. They work when the client's needs mostly fit the platform; they fail when a client buys 'a white-label app' and then demands so many changes that it becomes an expensive custom build on a base that fights them. Being clear about what is configurable, what is extendable and what is out of scope is the core sales skill.\n\nWhite-label partnerships trade margin and client access for volume you did not have to sell. The partner owns the relationship, so requirements arrive filtered and promises may be made that you have to keep. Contracts must cover: who supports end clients, non-solicitation in both directions, payment terms (avoid 'pay when paid' unless you accept the partner's credit risk), and IP.\n\nIP is the gotcha in both models. If your reusable platform core is 'assigned' to every client, you no longer own the product you resell. The usual structure is that the agency keeps ownership of the platform and pre-existing code and grants a licence, while client-specific work may be assigned to the client. Involve counsel when drafting this. A second gotcha is concentration: one reseller partner sending most of your work can renegotiate your rates at will.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "HubSpot: Solutions Partner Program FAQs", url: "https://www.hubspot.com/partners/faqs", kind: "docs" },
        { label: "Investopedia: White-label product", url: "https://www.investopedia.com/terms/w/white-label-product.asp", kind: "article" },
        { label: "UpCounsel: IP ownership clause in contracts", url: "https://www.upcounsel.com/ip-ownership-clause", kind: "article" },
      ],
      video: {
        title: "What is a White Label Partnership?",
        channel: "51Blocks",
        url: "https://www.youtube.com/watch?v=Kdn8eVHb6NQ",
        videoId: "Kdn8eVHb6NQ",
      },
      alternateVideos: [
        {
          title: "Why Is White-Label Partnership So Profitable? | Agency Talk Two Minute Takes",
          channel: "Conduit Digital | Scale Smarter, Not Harder",
          url: "https://www.youtube.com/watch?v=dKGmyrddHho",
          videoId: "dKGmyrddHho",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-a-white-label-partnerships-q1",
          prompt: "What is the main trade-off a client accepts when buying a white-label app instead of a custom build?",
          options: [
            "Less uniqueness and flexibility in exchange for speed and lower cost",
            "Higher cost in exchange for full IP ownership",
            "Slower delivery in exchange for better design",
            "No trade-off: white-label is better in every way",
          ],
          correctIndex: 0,
          explanation:
            "A proven platform ships faster and cheaper because the work is shared across clients; the price is fitting your needs to the platform.",
        },
        {
          id: "bd-a-white-label-partnerships-q2",
          prompt:
            "A client buys your white-label delivery platform, then requests 40 changes to core flows. What is the best response?",
          options: [
            "Revisit fit: separate configuration from custom extensions, price custom work separately, and discuss whether a custom build would suit them better",
            "Do all 40 changes within the original price to keep them happy",
            "Fork the platform for this client without telling them about the extra cost",
            "Refuse all changes",
          ],
          correctIndex: 0,
          explanation:
            "Heavy customisation erodes the white-label advantage. Making the boundary explicit protects margin and the client's expectations; silent forks become unmaintainable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-white-label-partnerships-q3",
          prompt: "Which should a white-label partnership contract with a reseller agency cover? (Select all that apply.)",
          options: [
            "Who provides support to the end client and at what response times",
            "Non-solicitation of each other's clients and staff",
            "Payment terms that do not depend on the end client paying the partner",
            "IP ownership of the reusable platform versus client-specific work",
            "Your agency's logo placement in the end client's app",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Support, non-solicitation, payment and IP are the core risks. In a true white-label arrangement your brand is usually absent from the client's product.",
        },
        {
          id: "bd-a-white-label-partnerships-q4",
          prompt:
            "A partner proposes 'pay when paid' terms: they pay you only after their client pays them. What risk do you take on?",
          options: [
            "The end client's credit and payment risk, without having a contract with that client",
            "No extra risk, since the partner is responsible",
            "Only a short delay of a few days",
            "Exchange-rate risk",
          ],
          correctIndex: 0,
          explanation:
            "You become dependent on a client you cannot invoice or chase. Prefer fixed terms with the partner, or price the risk in.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-white-label-partnerships-q5",
          prompt:
            "Your standard contract assigns 'all IP created or used in the project' to each white-label client. Why is that a serious problem?",
          options: [
            "It can transfer ownership of your reusable platform core, so you may no longer own the product you resell",
            "Clients do not want IP",
            "IP clauses are unenforceable",
            "It only matters for open-source code",
          ],
          correctIndex: 0,
          explanation:
            "The usual structure keeps platform and pre-existing IP with the agency under a licence, and assigns client-specific work if agreed. Have counsel draft this.",
        },
        {
          id: "bd-a-white-label-partnerships-q6",
          prompt: "Why do white-label partnerships typically yield lower margins per project than direct client work?",
          options: [
            "The partner adds their own margin on top of your price and owns the client relationship",
            "White-label work is always simpler",
            "Partners pay in advance",
            "Tax rules require lower rates",
          ],
          correctIndex: 0,
          explanation:
            "The partner needs margin to resell you, so your rate is usually lower. In exchange you gain volume without the cost of selling it yourself.",
        },
        {
          id: "bd-a-white-label-partnerships-q7",
          prompt:
            "A reseller partner promised its client a feature your team cannot deliver in the agreed timeline. You have no direct contact with the client. What do you do?",
          options: [
            "Raise it with the partner immediately in writing, with options (phasing, scope change) for them to take to the client",
            "Contact the end client directly to explain",
            "Deliver what you can and say nothing",
            "Stop work until the partner fixes it",
          ],
          correctIndex: 0,
          explanation:
            "The partner owns the client relationship, and going around them likely breaches non-solicitation and trust. Early, written options let them manage expectations.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-a-white-label-partnerships-q8",
          prompt: "Which signs suggest a white-label platform is a good fit for a prospect? (Select all that apply.)",
          options: [
            "Their core flows match what the platform already does",
            "Speed to market matters more than unique features",
            "Their budget fits a configured product better than a custom build",
            "They need a fundamentally different business model from the platform's",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Fit, urgency and budget point to white-label. A fundamentally different model means fighting the platform, which usually costs more than a custom build.",
        },
        {
          id: "bd-a-white-label-partnerships-q9",
          prompt: "One reseller partner now sends 60% of your agency's projects. What is the main strategic risk?",
          options: [
            "Dependency: the partner can push down your rates or switch vendors, and you have little direct pipeline to fall back on",
            "No risk, since the partner sells for you",
            "The partner will be forced to buy your agency",
            "Your white-label platform will stop working",
          ],
          correctIndex: 0,
          explanation:
            "Concentration in a channel you do not control weakens your negotiating position. Keep building direct pipeline alongside partner work.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "A digital marketing agency with 40 retail clients proposes a partnership: you build mobile apps that they resell under their brand. They want to start with a loyalty app for one client in eight weeks.",
        steps: [
          {
            id: "w1",
            question: "What should you settle before quoting the first project?",
            options: [
              "The partnership terms: support responsibilities, non-solicitation, payment terms and IP for reusable components",
              "The app's colour scheme",
              "Whether the partner will mention your agency in their marketing",
              "A discount for the first ten projects",
            ],
            correctIndex: 0,
            explanation: "The framework terms govern every future project; agreeing them after the first build is much harder.",
          },
          {
            id: "w2",
            question:
              "The partner wants 'pay when paid' terms and full IP assignment of everything to the end client, including your loyalty platform core. What do you propose?",
            options: [
              "Fixed 30-day terms with the partner, licensing the platform core while assigning client-specific work, reviewed by counsel",
              "Accept both to win the partnership",
              "Accept 'pay when paid' but refuse any IP assignment at all",
              "Ask the end client to sign your contract directly",
            ],
            correctIndex: 0,
            explanation: "This protects cash flow and your reusable product while still giving the end client what it needs to own.",
          },
          {
            id: "w3",
            question:
              "Six months in, the partner sends 70% of your new work and asks for a 15% rate cut 'given the volume'. What is the best long-term response?",
            options: [
              "Negotiate a volume-based rate tied to committed volume, and invest in direct pipeline to reduce dependency",
              "Accept immediately to keep the work",
              "Refuse and threaten to end the partnership",
              "Contact their clients directly to sell around them",
            ],
            correctIndex: 0,
            explanation: "Trading rate for committed volume is fair, and reducing dependency restores your leverage; selling around them breaches trust and likely the contract.",
          },
        ],
      },
    },
  ],
} satisfies Module;
