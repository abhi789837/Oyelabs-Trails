import type { PracticalOutcomeSeed } from "../../../../shared/goals";

/**
 * v4.3: the Business Development library of practical outcomes ("practical cases").
 *
 * Each entry is something an admin can ask a BD learner to be able to do at an agency that sells
 * custom software and white-label products to overseas clients. Skill ids come from
 * server/src/catalog/seed/bd.ts and bdProcess.ts. A capstone is either an existing course topic whose
 * practice task proves the outcome, or a task (shared/tasks.ts) written here.
 *
 * No Oyelabs-specific prices, rates or percentages: any number in a task is scenario data, and
 * market figures are labelled "typical".
 */
export default [
  // ---------------------------------------------------------------------------
  // Offering and positioning
  // ---------------------------------------------------------------------------
  {
    id: "bd-match-service-to-enquiry",
    departmentId: "bd",
    title: "Match an enquiry to the right service",
    statement: "Can read a new enquiry and name the agency service that fits it (custom build, white-label product, dedicated team or support retainer), with one reason.",
    skillIds: ["bd-agency-services", "bd-white-label-offering"],
    level: 1,
    aliases: ["what we sell", "service fit", "match the offering"],
    capstone: { kind: "topic", title: "Agency offerings practice", topicId: "bd-b-agency-offerings" },
  },
  {
    id: "bd-write-elevator-pitch",
    departmentId: "bd",
    title: "Write a 60-second agency pitch",
    statement: "Can write a short pitch for one buyer persona that names their problem, the agency's relevant offer and one piece of proof, without generic claims.",
    skillIds: ["bd-value-proposition", "bd-agency-services", "bd-personas"],
    level: 1,
    aliases: ["elevator pitch", "intro pitch", "positioning line"],
    capstone: {
      kind: "task",
      title: "Pitch for a logistics founder",
      task: {
        kind: "write",
        variant: "general",
        prompt:
          "Write the 60-second spoken pitch you would give a logistics founder at a networking event when they ask \"So what does your agency do?\". Make it about their world, not a list of everything the agency does.",
        context:
          "Persona: founder of a 40-truck regional delivery company in the UK. Drivers still get jobs over WhatsApp; customers call the office to ask where their parcel is. Agency proof you may use: a driver and dispatch app built for a courier client, which let that client's customers track deliveries themselves.",
        wordLimit: 150,
        rubric: [
          { id: "problem", label: "Leads with their problem", description: "Opens with the founder's likely pain (manual dispatch, 'where is my parcel' calls) rather than the agency's history or size.", weight: 2 },
          { id: "offer", label: "One relevant offer", description: "Names one specific offer that fits (a dispatch and tracking app, possibly from an existing product) instead of listing every service.", weight: 1.5 },
          { id: "proof", label: "Concrete proof", description: "Uses the courier client example as proof, without inventing numbers that were not given.", weight: 1 },
          { id: "ask", label: "Light next step", description: "Ends with a low-pressure question or next step (e.g. 'how do drivers get their jobs today?'), not a hard sell.", weight: 1 },
        ],
        sampleAnswer:
          "Most delivery firms your size still run dispatch over WhatsApp, and the office spends half the day answering 'where's my parcel?'. We build the apps that fix that: a driver app that gets jobs and proof of delivery, and a tracking link customers can open themselves. We did exactly this for a courier client, and their customers now track deliveries without calling in. Out of curiosity, how do your drivers get their jobs today?",
      },
    },
  },
  {
    id: "bd-explain-white-label-models",
    departmentId: "bd",
    title: "Explain white-label vs private label vs reseller",
    statement: "Can sort client situations into white-label, private-label and reseller arrangements and explain the difference to a prospect in plain words.",
    skillIds: ["bd-white-label-offering", "bd-proc-whitelabel", "bd-proc-terms"],
    level: 1,
    aliases: ["white label basics", "reseller vs white label", "private label"],
    capstone: { kind: "topic", title: "White-label vs private label vs reseller", topicId: "pmp-c07-whitelabel-reseller-private" },
  },
  {
    id: "bd-explain-tech-to-client",
    departmentId: "bd",
    title: "Explain tech choices to a non-technical client",
    statement: "Can spot wrong or misleading technical claims in a sales message about web, mobile and AI products and correct them in client language.",
    skillIds: ["bd-tech-web-mobile-ai", "bd-tech-stacks", "bd-tech-apis"],
    level: 1,
    aliases: ["tech literacy", "explain the stack", "native vs cross-platform"],
    capstone: { kind: "topic", title: "Tech literacy practice", topicId: "bd-b-tech-literacy" },
  },
  {
    id: "bd-build-competitor-battlecard",
    departmentId: "bd",
    title: "Position against a competing agency",
    statement: "Can decide how to respond when a prospect compares the agency with a cheaper freelancer or a larger firm, without attacking the competitor.",
    skillIds: ["bd-competitor-awareness", "bd-value-proposition", "bd-objection-handling"],
    level: 3,
    aliases: ["battlecard", "competitor objection", "cheaper freelancer"],
    capstone: {
      kind: "task",
      title: "The cheaper freelancer",
      task: {
        kind: "scenario",
        prompt:
          "A US founder has had your proposal for a marketplace MVP for a week. On a follow-up call she says: \"A freelancer on Upwork quoted me about a third of your number for the same thing. Why would I pay more?\" You know the MVP needs a customer app, a vendor app, an admin panel and Stripe payouts to vendors.",
        steps: [
          {
            id: "s1",
            question: "What do you do first?",
            options: [
              "Explain that freelancers are unreliable and often disappear mid-project.",
              "Ask what the freelancer's quote includes, so you can compare like with like (apps, admin panel, payouts, QA, launch support).",
              "Offer to match the freelancer's number to keep the deal.",
              "Tell her the agency is more expensive because it is bigger and has more experience.",
            ],
            correctIndex: 1,
            explanation: "Comparing scope first is fair and usually reveals the gap; attacking the competitor or discounting the same scope both weaken your position.",
          },
          {
            id: "s2",
            question: "The freelancer's quote covers the customer app only; no admin panel, no vendor payouts, no QA. What do you say?",
            options: [
              "\"Then the quote is meaningless and you should ignore it.\"",
              "Walk her through a side-by-side of what each quote covers and the risk of the missing parts for a marketplace, then ask which parts she needs for launch.",
              "Remove the admin panel and payouts from your proposal so the numbers match.",
              "Send her a case study and wait for her to decide.",
            ],
            correctIndex: 1,
            explanation: "A neutral side-by-side lets her see the difference herself and opens a conversation about what launch really needs.",
          },
          {
            id: "s3",
            question: "She still says the budget is tight. What is the best next move?",
            options: [
              "Give a 30% discount on the full scope.",
              "Offer a smaller first phase (e.g. one app plus a basic admin, manual payouts at first) at a lower price, with the rest as phase 2.",
              "Tell her to come back when she has more budget.",
              "Agree to the freelancer's price and recover the cost through change requests later.",
            ],
            correctIndex: 1,
            explanation: "Trade scope for price instead of cutting the price of the same scope; planning to recover margin through change requests is dishonest.",
          },
        ],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Lead research and qualification
  // ---------------------------------------------------------------------------
  {
    id: "bd-rank-leads-by-icp",
    departmentId: "bd",
    title: "Prioritise leads against the ICP",
    statement: "Can rank a list of researched leads by fit with the ideal customer profile and buyer personas, and say why the top lead comes first.",
    skillIds: ["bd-icp", "bd-personas", "bd-prospect-research"],
    level: 1,
    aliases: ["icp fit", "lead prioritisation", "who to contact first"],
    capstone: { kind: "topic", title: "ICP and personas practice", topicId: "bd-b-icp-personas" },
  },
  {
    id: "bd-research-account-brief",
    departmentId: "bd",
    title: "Research a prospect before outreach",
    statement: "Can pick the research findings about a prospect that justify outreach (trigger events, the right decision maker) and ignore the ones that do not.",
    skillIds: ["bd-prospect-research", "bd-icp", "bd-personas"],
    level: 2,
    aliases: ["account research", "trigger events", "pre-call research"],
    capstone: {
      kind: "task",
      title: "Sort the research findings",
      task: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "You are researching a 120-person Australian home-services company before outreach. Sort each finding: is it a reason to reach out now (a trigger), useful context for personalising the message, or noise you should leave out?",
        categories: [
          { id: "trigger", label: "Trigger: a reason to reach out now" },
          { id: "context", label: "Useful context for the message" },
          { id: "noise", label: "Noise: leave it out" },
        ],
        items: [
          { id: "i1", text: "They posted a job ad for a 'Head of Digital Product' two weeks ago.", explanation: "A new digital leader usually brings a new budget and agenda: a classic trigger." },
          { id: "i2", text: "Their customer app has a 2.1-star rating with reviews complaining about booking failures.", explanation: "A visible, current pain you can refer to: a trigger." },
          { id: "i3", text: "The COO wrote a LinkedIn post about cutting phone bookings in half this year.", explanation: "A stated goal from a decision maker: a strong trigger." },
          { id: "i4", text: "They operate in Sydney, Melbourne and Brisbane.", explanation: "Helps personalise (time zones, scale) but is not a reason to reach out now." },
          { id: "i5", text: "Their website runs on WordPress.", explanation: "Context for a technical conversation, not a trigger by itself." },
          { id: "i6", text: "The founder's favourite football team, from a podcast interview in 2019.", explanation: "Old and personal; using it feels intrusive and adds nothing." },
          { id: "i7", text: "They were founded in 2009.", explanation: "Generic fact; it will not make the message more relevant." },
          { id: "i8", text: "Their main competitor launched an app with live technician tracking last quarter.", explanation: "Competitive pressure creates urgency: a trigger." },
        ],
        answer: { i1: "trigger", i2: "trigger", i3: "trigger", i4: "context", i5: "context", i6: "noise", i7: "noise", i8: "trigger" },
      },
    },
  },
  {
    id: "bd-ai-assisted-research",
    departmentId: "bd",
    title: "Use AI for research and a personalised first line",
    statement: "Can use an AI assistant to research a prospect and draft a personalised opening, checking every fact before it is sent.",
    skillIds: ["bd-ai-research", "bd-ai-personalisation", "bd-prospect-research"],
    level: 2,
    aliases: ["ai research", "claude for prospecting", "ai first line"],
    capstone: { kind: "topic", title: "AI research and personalisation practice", topicId: "bd-x-ai-research-personalisation" },
  },
  {
    id: "bd-qualify-lead-bant",
    departmentId: "bd",
    title: "Qualify a lead with BANT",
    statement: "Can score a lead on budget, authority, need and timeline from call notes and decide whether to progress, nurture or drop it.",
    skillIds: ["bd-bant", "bd-discovery-calls", "bd-pipeline-management"],
    level: 2,
    aliases: ["bant", "lead qualification", "is this lead real"],
    capstone: { kind: "topic", title: "Qualification practice", topicId: "bd-i-qualification" },
  },
  {
    id: "bd-qualify-enterprise-meddic",
    departmentId: "bd",
    title: "Qualify an enterprise deal with MEDDIC",
    statement: "Can find the gaps in an enterprise opportunity using MEDDIC (metrics, economic buyer, decision criteria and process, pain, champion) and choose the next action that closes the biggest gap.",
    skillIds: ["bd-meddic", "bd-enterprise-procurement", "bd-forecasting"],
    level: 4,
    aliases: ["meddic", "meddpicc", "enterprise qualification", "champion"],
    capstone: {
      kind: "task",
      title: "The enthusiastic IT manager",
      task: {
        kind: "scenario",
        prompt:
          "An IT manager at a German logistics group (about 2,000 staff) has had three calls with you about a driver app and a customer tracking portal. He loves the demo and says \"this is exactly what we need\". You have no budget figure, you have never spoken to anyone above him, and he says procurement \"will be involved at some point\". Your manager wants to put the deal in this quarter's commit forecast.",
        steps: [
          {
            id: "s1",
            question: "Which MEDDIC gap is the most serious right now?",
            options: [
              "Metrics: you have not agreed how success will be measured.",
              "Economic buyer: nobody with budget authority has been identified or engaged.",
              "Pain: you are not sure the problem is real.",
              "Competition: you do not know who else they are talking to.",
            ],
            correctIndex: 1,
            explanation: "An enthusiastic contact without access to the economic buyer is the classic stalled enterprise deal; the other gaps matter but follow from this one.",
          },
          {
            id: "s2",
            question: "What should you say about the forecast?",
            options: [
              "Put it in commit: the contact is clearly convinced.",
              "Keep it as pipeline or best case, not commit, until the economic buyer and the decision process are confirmed.",
              "Remove it from the CRM until procurement contacts you.",
              "Put it in commit but at half value.",
            ],
            correctIndex: 1,
            explanation: "Commit should mean a known buyer, process and date. Without them the deal belongs in a lower forecast category.",
          },
          {
            id: "s3",
            question: "What is the best next action?",
            options: [
              "Send the IT manager a discount to speed things up.",
              "Ask him to help you build the business case together (cost of late deliveries, support calls) and to introduce you to the person who signs it off, and ask how purchases of this size are approved.",
              "Email the CEO directly without telling the IT manager.",
              "Wait for procurement to send an RFP.",
            ],
            correctIndex: 1,
            explanation: "Helping your champion build the metrics gives him a reason to involve the economic buyer, and asking about the decision process uncovers procurement early.",
          },
        ],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Outreach
  // ---------------------------------------------------------------------------
  {
    id: "bd-write-cold-email",
    departmentId: "bd",
    title: "Write a first-touch cold email",
    statement: "Can write a short cold email to an overseas prospect that is relevant to their situation, offers one piece of proof and ends with an easy ask.",
    skillIds: ["bd-cold-email", "bd-business-writing", "bd-personas"],
    level: 1,
    aliases: ["cold email", "first touch email", "prospecting email"],
    capstone: { kind: "topic", title: "Cold email practice", topicId: "bd-b-cold-email" },
  },
  {
    id: "bd-linkedin-connection-dm",
    departmentId: "bd",
    title: "Start a LinkedIn conversation",
    statement: "Can choose the right connection note and first message on LinkedIn for a decision maker, without pitching in the connection request.",
    skillIds: ["bd-linkedin-outreach", "bd-lead-linkedin"],
    level: 1,
    aliases: ["linkedin dm", "connection request", "social selling"],
    capstone: { kind: "topic", title: "LinkedIn outreach practice", topicId: "bd-b-linkedin-outreach" },
  },
  {
    id: "bd-write-clear-business-email",
    departmentId: "bd",
    title: "Write a clear business email",
    statement: "Can write a client email with the main point first, a clear ask and a professional tone suited to an overseas reader.",
    skillIds: ["bd-business-writing"],
    level: 1,
    aliases: ["business email", "email tone", "clear ask"],
    capstone: { kind: "topic", title: "Business writing practice", topicId: "bd-b-business-writing" },
  },
  {
    id: "bd-reply-to-inbound-lead",
    departmentId: "bd",
    title: "Reply to an inbound website enquiry",
    statement: "Can reply to a vague inbound enquiry the same day with two or three qualifying questions and a proposed call, instead of sending a price.",
    skillIds: ["bd-lead-inbound", "bd-business-writing", "bd-meeting-prep"],
    level: 1,
    aliases: ["inbound reply", "contact form lead", "website enquiry"],
    capstone: {
      kind: "task",
      title: "Reply to 'how much for an app like Uber?'",
      task: {
        kind: "write",
        variant: "email",
        prompt: "Write your reply to this website enquiry. The goal is a discovery call, not a price.",
        context:
          "From: Daniel (contact form, Toronto, Canada)\nSubject: App quote\n\nHi, how much would it cost to build an app like Uber but for moving furniture? Need it fast. Thanks, Daniel",
        wordLimit: 160,
        rubric: [
          { id: "warm", label: "Warm and quick", description: "Thanks him and shows interest in the idea in one line; reads like a person, not an autoresponder.", weight: 1 },
          { id: "noprice", label: "No premature price", description: "Explains briefly that the cost depends on scope (e.g. which apps, which features first) without giving a number or a range that would anchor him.", weight: 1.5 },
          { id: "questions", label: "Two or three qualifying questions", description: "Asks a few useful questions: who the users are, what must be in the first version, the target launch date, or the budget range.", weight: 2 },
          { id: "cta", label: "A concrete call ask", description: "Proposes a short call with a booking link or two time options in his time zone.", weight: 1.5 },
        ],
        sampleAnswer:
          "Hi Daniel,\n\nThanks for reaching out, an on-demand furniture moving app is a great idea.\n\nThe cost depends mostly on what the first version needs, so before I put numbers in front of you, a few quick questions:\n1. Who books the move: households, businesses or both?\n2. Do you need separate apps for customers and movers, plus an admin panel, from day one?\n3. When do you want to launch, and do you have a budget range in mind?\n\nIf it's easier, let's cover these on a 20-minute call. Here is my calendar (Eastern time slots shown): [link]. Or reply with a time that suits you this week.\n\nBest,\nPriya",
      },
    },
  },
  {
    id: "bd-follow-up-after-silence",
    departmentId: "bd",
    title: "Follow up when a prospect goes quiet",
    statement: "Can write a follow-up that adds new value to a silent thread instead of 'just checking in', and plan when to stop.",
    skillIds: ["bd-follow-up-cadences", "bd-business-writing"],
    level: 2,
    aliases: ["follow up", "ghosted prospect", "nudge email"],
    capstone: { kind: "topic", title: "Follow-up cadences practice", topicId: "bd-i-follow-up-cadences" },
  },
  {
    id: "bd-design-outbound-sequence",
    departmentId: "bd",
    title: "Design a multi-touch outbound sequence",
    statement: "Can design a short outbound sequence across email and LinkedIn with a different angle at each touch, sensible spacing and a polite break-up message.",
    skillIds: ["bd-follow-up-cadences", "bd-sequencing-tools", "bd-cold-email", "bd-linkedin-outreach"],
    level: 3,
    aliases: ["sequence", "cadence design", "lemlist sequence"],
    capstone: {
      kind: "task",
      title: "A four-touch sequence for clinic owners",
      task: {
        kind: "write",
        variant: "general",
        prompt:
          "Plan a four-touch outbound sequence (email and LinkedIn) for owners of private dental clinics in the UAE. For each touch give the day, the channel, the angle and one or two sample lines. The agency has a white-label clinic booking app it can rebrand.",
        context:
          "Persona: owner of a two- to five-branch dental clinic group; bookings come in by phone and WhatsApp, front desk staff are overloaded, no-shows are a known problem. Proof available: a rebranded booking app launched for a physiotherapy chain.",
        wordLimit: 350,
        rubric: [
          { id: "angles", label: "A new angle at each touch", description: "Each touch adds something different (the problem, proof, a short Loom or insight, a break-up) rather than repeating the first email.", weight: 2 },
          { id: "spacing", label: "Sensible spacing and channels", description: "Spreads touches over roughly two to three weeks and mixes email and LinkedIn sensibly; no daily chasing.", weight: 1 },
          { id: "relevance", label: "Relevant to the persona", description: "Lines speak to clinic owners' real issues (phone bookings, no-shows, front desk load) and use the physiotherapy proof honestly.", weight: 1.5 },
          { id: "breakup", label: "A respectful last touch", description: "Ends with a polite break-up that makes it easy to say 'not now' and leaves the door open.", weight: 1 },
        ],
        sampleAnswer:
          "Day 1, email: problem angle. \"Most clinic groups we speak to still take bookings by phone and WhatsApp, and lose slots to no-shows. Is that true for your branches too?\"\nDay 4, LinkedIn: connection request with no pitch: \"Following clinic groups in Dubai, would be glad to connect.\"\nDay 8, email: proof angle. \"We rebranded our booking app for a physiotherapy chain: patients book and get reminders in the clinic's own app. Happy to show you the 2-minute walkthrough.\"\nDay 12, LinkedIn message (if connected): short Loom showing what the booking flow would look like with their clinic's name.\nDay 18, email: break-up. \"I'll stop here so I don't clutter your inbox. If online booking becomes a priority later this year, just reply 'later' and I'll check back then.\"",
      },
    },
  },
  {
    id: "bd-review-ai-personalisation",
    departmentId: "bd",
    title: "Quality-check AI-personalised outreach",
    statement: "Can review AI-generated personalised lines before a campaign goes out and catch invented facts, creepy details and claims the agency cannot back.",
    skillIds: ["bd-ai-personalisation", "bd-ai-ethics", "bd-sequencing-tools"],
    level: 3,
    aliases: ["ai personalisation check", "hallucinated first lines", "ai outreach qa"],
    capstone: {
      kind: "task",
      title: "Check the AI first lines",
      task: {
        kind: "spot",
        prompt:
          "An AI tool wrote these opening lines for a campaign to e-commerce founders, from their LinkedIn profiles and websites. Mark every line that must not be sent as written.",
        segments: [
          { id: "l1", text: "Saw you launched same-day delivery in Austin last month, congrats on the expansion.", issue: null },
          { id: "l2", text: "Congrats on your recent $12M Series A led by Sequoia!", issue: "A specific funding claim the source data does not contain: likely invented, and embarrassing if wrong." },
          { id: "l3", text: "Your checkout page asks for an account before payment, which often costs conversions.", issue: null },
          { id: "l4", text: "I noticed your daughter's graduation photos on Instagram, what a proud moment!", issue: "Uses personal family information from a private-life channel: intrusive and inappropriate for outreach." },
          { id: "l5", text: "Your post about rising return rates on apparel really resonated with what we hear from other store owners.", issue: null },
          { id: "l6", text: "We have helped over 500 Shopify brands double their revenue in 90 days.", issue: "A claim the agency cannot back with evidence; AI tools often invent results like this." },
          { id: "l7", text: "Since you are on Shopify Plus, a custom mobile app could reuse your existing product catalogue.", issue: null },
          { id: "l8", text: "Hi {{first_name}}, loved your work at {{company}}!", issue: "Unfilled merge tags: the personalisation failed and the email would look automated." },
          { id: "l9", text: "Your app reviews mention slow loading on Android, something we fix often.", issue: null },
        ],
        askExplanation: true,
      },
    },
  },
  {
    id: "bd-ask-for-referral",
    departmentId: "bd",
    title: "Ask a happy client for a referral",
    statement: "Can ask a satisfied client for a specific, easy referral or introduction at the right moment, without making it awkward.",
    skillIds: ["bd-lead-referrals", "bd-social-proof", "bd-business-writing"],
    level: 2,
    aliases: ["referral ask", "introduction request", "testimonial ask"],
    capstone: {
      kind: "task",
      title: "Referral email after a successful launch",
      task: {
        kind: "write",
        variant: "email",
        prompt:
          "Write a short email to the client below asking for a referral. Make it specific and easy for them to act on.",
        context:
          "Client: Sarah, operations director at a Netherlands-based pet-supplies retailer. Her team's ordering app went live three weeks ago; she told your PM on the last call that repeat orders are up and she is 'really happy with the team'. She is active in a European e-commerce founders' community.",
        wordLimit: 170,
        rubric: [
          { id: "timing", label: "Anchors on the success", description: "Opens by referencing the launch and her own words about the results, so the ask feels earned, without inventing numbers.", weight: 1 },
          { id: "specific", label: "A specific ask", description: "Describes who a good introduction would be (e.g. e-commerce operators planning an app), rather than 'anyone you know'.", weight: 2 },
          { id: "easy", label: "Made easy", description: "Offers something that reduces effort, such as a short blurb she can forward, and makes it fine to say no.", weight: 1.5 },
          { id: "tone", label: "Grateful, not pushy", description: "Warm, short and professional; one ask only.", weight: 1 },
        ],
        sampleAnswer:
          "Hi Sarah,\n\nThree weeks after go-live, it was great to hear from Arjun that repeat orders are already up. Thank you for being such a decisive partner through the launch.\n\nA small ask: do you know one or two e-commerce operators, maybe in your founders' community, who are thinking about their own ordering app? If so, I'd be grateful for an introduction. I've pasted a two-line description below that you can forward as-is.\n\nAnd if no one comes to mind, no problem at all.\n\nThanks again,\nRahul\n\n---\n\"We worked with [agency] on our ordering app; they were clear on scope and delivered on time. Worth a call if you're planning an app.\"",
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Upwork
  // ---------------------------------------------------------------------------
  {
    id: "bd-flag-upwork-red-flags",
    departmentId: "bd",
    title: "Filter Upwork jobs for red flags",
    statement: "Can scan an Upwork job feed and flag the posts not worth Connects (unverified payment, unrealistic budget, vague scope, poor client history).",
    skillIds: ["bd-upwork-job-selection", "bd-lead-upwork"],
    level: 2,
    aliases: ["upwork red flags", "job filtering", "payment verified"],
    capstone: {
      kind: "task",
      title: "Today's Upwork feed",
      task: {
        kind: "sim",
        app: "generic",
        title: "Upwork job feed: mobile apps",
        prompt: "Flag every job you would not spend Connects on today, then answer the questions.",
        columns: ["Job", "Budget", "Client", "Proposals", "Posted"],
        rows: [
          { id: "j1", cells: ["Flutter app for a gym chain: class booking, payments, admin panel", "Fixed, $15,000", "Payment verified, $80k spent, 4.9 stars", "10 to 15", "2 hours ago"], issue: null },
          { id: "j2", cells: ["Build a full Uber clone with driver and rider apps, admin, payments", "Fixed, $500", "Payment verified, $0 spent", "50+", "1 day ago"], issue: "Budget is far below any realistic cost for this scope; signals a client who will not pay for real work." },
          { id: "j3", cells: ["Need an app. Details in chat. Urgent!!", "Hourly, not stated", "Payment not verified, no history", "20 to 50", "3 hours ago"], issue: "No scope, no budget and an unverified payment method: high risk of wasted Connects or a scam." },
          { id: "j4", cells: ["React Native developer for an existing healthcare app: fix bugs, add telehealth video", "Hourly, $40 to $70", "Payment verified, $120k spent, 4.7 stars", "5 to 10", "5 hours ago"], issue: null },
          { id: "j5", cells: ["Laravel e-commerce site: catalogue, checkout, Stripe", "Fixed, $6,000", "Payment verified, 3 hires, 2.1 stars", "15 to 20", "1 day ago"], issue: "Poor client rating across several hires suggests a difficult client; read the feedback before bidding." },
          { id: "j6", cells: ["AI chatbot for a law firm's website, trained on their FAQs", "Fixed, $4,000", "Payment verified, $25k spent, 5.0 stars", "Less than 5", "30 minutes ago"], issue: null },
          { id: "j7", cells: ["Logistics MVP: driver app, dispatch dashboard, tracking link", "Hourly, $30 to $60", "Payment verified, $45k spent, 4.8 stars", "10 to 15", "6 hours ago"], issue: null },
          { id: "j8", cells: ["Test task first: build the login and home screens for free to prove skill", "Fixed, $0 test", "Payment verified, $2k spent", "20 to 50", "2 days ago"], issue: "Asks for free work before hiring, which breaks good practice and rarely leads to paid work." },
        ],
        questions: [
          {
            id: "q1",
            question: "Two good jobs appeared at the same time. Which one should get your first proposal?",
            options: [
              "The gym chain app (10 to 15 proposals, posted 2 hours ago).",
              "The law-firm chatbot (fewer than 5 proposals, posted 30 minutes ago, 5.0 stars).",
              "Whichever has the higher budget.",
            ],
            correctIndex: 1,
            explanation: "Being early on a fresh post with few proposals and a strong client usually gives the best reply rate; budget alone is not the deciding factor.",
          },
          {
            id: "q2",
            question: "What should you check before bidding on the Laravel job from the 2.1-star client?",
            options: ["Nothing: a payment-verified client is always safe.", "The written feedback from previous freelancers, to see why the rating is low.", "Only whether the budget can be raised."],
            correctIndex: 1,
            explanation: "Past freelancers' feedback shows whether the low rating comes from scope creep, late payment or unfair reviews.",
          },
        ],
      },
    },
  },
  {
    id: "bd-prioritise-upwork-connects",
    departmentId: "bd",
    title: "Spend Upwork Connects where they pay back",
    statement: "Can rank Upwork jobs by expected return on Connects, using client quality, competition, fit and timing.",
    skillIds: ["bd-upwork-connects", "bd-upwork-job-selection"],
    level: 3,
    aliases: ["connects strategy", "bid budget", "connects roi"],
    capstone: { kind: "topic", title: "Upwork jobs and Connects practice", topicId: "bd-i-upwork-jobs-connects" },
  },
  {
    id: "bd-write-upwork-proposal",
    departmentId: "bd",
    title: "Write a winning Upwork proposal",
    statement: "Can write an Upwork proposal whose first two lines answer the client's actual problem, with relevant proof, a short plan and a question that invites a reply.",
    skillIds: ["bd-upwork-proposals", "bd-business-writing", "bd-lead-upwork"],
    level: 2,
    aliases: ["upwork proposal", "cover letter", "bid writing"],
    capstone: { kind: "topic", title: "Upwork proposals and profile practice", topicId: "bd-i-upwork-proposals-profile" },
  },
  {
    id: "bd-audit-upwork-profile",
    departmentId: "bd",
    title: "Audit an agency's Upwork profile",
    statement: "Can review an agency Upwork profile and mark the parts that hurt conversion (vague headline, self-centred overview, unproven claims, no niche).",
    skillIds: ["bd-upwork-profile", "bd-social-proof", "bd-value-proposition"],
    level: 3,
    aliases: ["upwork profile", "agency profile review", "profile seo"],
    capstone: {
      kind: "task",
      title: "Mark the weak parts of the profile",
      task: {
        kind: "spot",
        prompt: "This is the draft overview of an agency's Upwork profile. Mark the lines that would hurt its ranking or its conversion from profile view to interview.",
        segments: [
          { id: "p1", text: "Headline: Best IT Company | All Services | Cheap Rates | 24/7", issue: "Generic and price-led; no niche or outcome, and 'cheap' attracts the wrong clients." },
          { id: "p2", text: "We help founders and product teams launch mobile and web apps, from MVP to scale.", issue: null },
          { id: "p3", text: "We are the number one development company in the world.", issue: "An unprovable superlative that reduces trust." },
          { id: "p4", text: "Recent work: an on-demand delivery app for a Canadian grocery chain and a booking platform for a UK salon group.", issue: null },
          { id: "p5", text: "Our team has 200+ developers, 15 years of experience, ISO certificates, offices, awards, partnerships, and more.", issue: "A wall of self-description; nothing tells the client how this helps their project." },
          { id: "p6", text: "Every project starts with a short discovery call so scope and estimates are clear before work begins.", issue: null },
          { id: "p7", text: "Skills: Flutter, React Native, Laravel, Node.js, AWS, Stripe, OpenAI API.", issue: null },
          { id: "p8", text: "We can do anything you need, just message us.", issue: "No focus and no call to action tied to a specific need; signals a generalist with no niche." },
          { id: "p9", text: "Send a message with your idea and we will reply with questions and a rough timeline within one business day.", issue: null },
        ],
        askExplanation: false,
      },
    },
  },
  {
    id: "bd-script-loom-proposal",
    departmentId: "bd",
    title: "Script a Loom video proposal",
    statement: "Can script a two-minute Loom proposal that shows the client's own product or brief on screen and proposes a concrete first step.",
    skillIds: ["bd-loom-proposals", "bd-upwork-proposals", "bd-demos"],
    level: 3,
    aliases: ["loom proposal", "video proposal", "screen recording pitch"],
    capstone: {
      kind: "task",
      title: "Loom script for a booking-app job",
      task: {
        kind: "write",
        variant: "general",
        prompt:
          "Write the script (what you say and what is on screen) for a Loom of about two minutes in reply to the Upwork job below.",
        context:
          "Job: 'Yoga studio chain (6 locations, US) needs a booking app. Current booking is through a clunky website plugin; members complain they cannot see class availability on mobile. Want iOS and Android, payments, memberships. Please share relevant work.' The agency has a white-label fitness booking app it can rebrand and extend.",
        wordLimit: 320,
        rubric: [
          { id: "hook", label: "Opens on their problem", description: "The first 15 seconds show the client's current booking page on screen and name the specific pain (availability on mobile), not the agency's intro.", weight: 2 },
          { id: "proof", label: "Shows relevant proof", description: "Walks through the white-label fitness booking app briefly and connects each screen to their need (classes, memberships, payments).", weight: 1.5 },
          { id: "plan", label: "A short plan", description: "Explains in plain words how a rebrand plus extensions gets them live faster than a build from scratch, without promising dates or prices.", weight: 1.5 },
          { id: "cta", label: "A clear next step", description: "Ends with one specific ask, such as a 20-minute call to walk through their membership rules.", weight: 1 },
        ],
        sampleAnswer:
          "[Screen: their current booking page on a phone-sized browser]\n\"Hi, this is Anita. I opened your booking page on my phone, and you can see the problem your members mention: the timetable doesn't fit and availability is hidden behind three taps.\"\n[Screen: white-label fitness app, class list]\n\"This is a booking app we've already built for fitness studios. Members see today's classes and spots left on one screen...\"\n[Screen: membership and payment screens]\n\"...memberships and class packs are built in, and payments run through Stripe.\"\n[Screen: side-by-side with their logo mocked on the app]\n\"Because the core already exists, we would rebrand it for your six locations and then add anything specific to you, which is usually much faster than starting from scratch. Exact timing depends on your membership rules.\"\n[Screen: face cam]\n\"Could we do a 20-minute call this week so you can walk me through how memberships work across locations? Thanks for watching.\"",
      },
    },
  },
  {
    id: "bd-review-ai-drafted-proposal",
    departmentId: "bd",
    title: "Review an AI-drafted proposal before sending",
    statement: "Can review a proposal drafted with Claude and catch invented facts, generic filler and commitments the agency has not agreed to.",
    skillIds: ["bd-ai-proposals", "bd-ai-ethics", "bd-upwork-proposals"],
    level: 3,
    aliases: ["ai proposal review", "claude proposals", "ai bid check"],
    capstone: { kind: "topic", title: "AI proposal drafting practice", topicId: "bd-x-ai-proposal-drafting" },
  },

  // ---------------------------------------------------------------------------
  // Discovery and demos
  // ---------------------------------------------------------------------------
  {
    id: "bd-prepare-discovery-call",
    departmentId: "bd",
    title: "Prepare a discovery call plan",
    statement: "Can prepare a one-page plan for a discovery call: the objective, what is already known, the key questions and the next step to propose.",
    skillIds: ["bd-meeting-prep", "bd-discovery-calls", "bd-prospect-research"],
    level: 1,
    aliases: ["call prep", "discovery agenda", "pre-call plan"],
    capstone: {
      kind: "task",
      title: "Plan the first call with a clinic founder",
      task: {
        kind: "form",
        variant: "template",
        prompt: "Fill in the call plan for tomorrow's discovery call, using the booking note below.",
        context:
          "Booking note (Calendly): 'Dr. Lena Fischer, founder of a three-clinic physiotherapy group in Munich. Wants an app for patients to book sessions and do home exercises. Budget not known. Found us via Clutch.' Her website shows online booking through a third-party widget. Call length: 30 minutes.",
        fields: [
          { id: "objective", label: "Objective of the call", input: "textarea" },
          { id: "known", label: "What we already know", input: "textarea" },
          { id: "questions", label: "Top five questions to ask", input: "textarea" },
          { id: "length", label: "Call length (minutes)", input: "number" },
          { id: "next", label: "Next step to propose at the end", input: "select", options: ["Send a proposal straight away", "A scoping session or demo with a solution lead", "A discount offer", "No next step until she follows up"] },
        ],
        checks: [
          { fieldId: "length", expected: 30 },
          { fieldId: "next", expected: "A scoping session or demo with a solution lead" },
        ],
        rubric: [
          { label: "Clear objective", points: 2, description: "States what the call must achieve: understand the problem, users, must-haves, timeline and budget, and agree a next step; not 'sell the app'." },
          { label: "Uses known context", points: 1, description: "Notes the three clinics, the current booking widget, the Clutch source and the two needs (booking and home exercises)." },
          { label: "Strong questions", points: 3, description: "Open questions covering current process and pain, users, must-haves for version 1, decision makers, timeline and budget range." },
        ],
        sampleAnswer: {
          objective: "Understand why she wants an app now, who the users are, what version 1 must include, who decides, the timeline and budget range; agree a scoping session.",
          known: "Three physiotherapy clinics in Munich; online booking today through a third-party widget; wants patient booking plus home exercise programmes; came from Clutch; budget unknown.",
          questions:
            "1. What is not working with the current booking widget?\n2. How do patients get their home exercises today?\n3. What must the first version do on launch day?\n4. Who else is involved in choosing a partner and approving the budget?\n5. When would you like patients using it, and what budget range have you planned?",
          length: "30",
          next: "A scoping session or demo with a solution lead",
        },
      },
    },
  },
  {
    id: "bd-run-spin-discovery",
    departmentId: "bd",
    title: "Run a discovery call with SPIN questions",
    statement: "Can steer a discovery call with situation, problem, implication and need-payoff questions so the client states the cost of the problem in their own words.",
    skillIds: ["bd-spin", "bd-discovery-calls"],
    level: 2,
    aliases: ["spin", "discovery questions", "needs analysis"],
    capstone: { kind: "topic", title: "SPIN discovery practice", topicId: "bd-i-spin-discovery" },
  },
  {
    id: "bd-log-discovery-in-crm",
    departmentId: "bd",
    title: "Turn call notes into a clean CRM update",
    statement: "Can turn a discovery call transcript (or an AI summary of it) into a correct CRM update: deal stage, next step with a date, and the facts that matter.",
    skillIds: ["bd-ai-call-notes", "bd-crm-hygiene", "bd-bant"],
    level: 2,
    aliases: ["crm update", "call summary", "ai notes to hubspot"],
    capstone: {
      kind: "task",
      title: "Log the call with the furniture retailer",
      task: {
        kind: "form",
        variant: "mom",
        prompt:
          "Update the CRM deal from the call extract below. The AI note-taker's summary said 'Client ready to sign, budget approved'; check that against the transcript before you log anything.",
        context:
          "Call extract (Tuesday 14 May):\nYou: What would make this project a success for you?\nMark (Head of E-commerce, Denver): Getting mobile orders up. Right now 70% of our traffic is mobile but most sales happen on desktop.\nYou: Who else is involved in the decision?\nMark: I'll recommend it, but our CFO signs off anything over our approval limit. She hasn't seen it yet.\nYou: And budget?\nMark: We set some money aside for digital this year, I can't share the number yet.\nYou: Timing?\nMark: We'd want it live before the holiday season.\nYou: Shall I send a short proposal and we review it together with your CFO next week?\nMark: Yes, Thursday 23rd works.\n\nPipeline stages: Lead, Qualified, Proposal, Negotiation, Won, Lost.",
        fields: [
          { id: "stage", label: "Deal stage after this call", input: "select", options: ["Lead", "Qualified", "Proposal", "Negotiation", "Won"] },
          { id: "budgetApproved", label: "Budget approved?", input: "select", options: ["Yes", "No", "Unknown"] },
          { id: "decisionMaker", label: "Economic buyer (role)", input: "text" },
          { id: "nextStep", label: "Next step with owner and date", input: "textarea" },
          { id: "summary", label: "Call summary for the deal record", input: "textarea" },
        ],
        checks: [
          { fieldId: "stage", expected: "Qualified" },
          { fieldId: "budgetApproved", expected: "Unknown" },
          { fieldId: "decisionMaker", expected: "CFO" },
        ],
        rubric: [
          { label: "Correct next step", points: 2, description: "Records the agreed next step: send a short proposal before the call, then review it with Mark and the CFO on Thursday 23 May; owner named." },
          { label: "Accurate, useful summary", points: 3, description: "Captures the goal (mobile conversion), the decision process (CFO signs off, not yet involved), the unknown budget and the holiday-season deadline; does not copy the AI summary's wrong claims." },
        ],
        sampleAnswer: {
          stage: "Qualified",
          budgetApproved: "Unknown",
          decisionMaker: "CFO",
          nextStep: "Me: send a short proposal by Monday 20 May. Review call with Mark and the CFO on Thursday 23 May.",
          summary:
            "Goal: raise mobile conversion (70% of traffic is mobile, most sales on desktop). Mark (Head of E-commerce) will recommend; the CFO signs off and has not seen it yet. A digital budget exists but the amount is not shared, so it is not confirmed as approved. Wants it live before the holiday season. Note: the AI summary said 'ready to sign, budget approved'; that is not what was said.",
        },
      },
    },
  },
  {
    id: "bd-run-tailored-demo",
    departmentId: "bd",
    title: "Run a demo tailored to discovery",
    statement: "Can order a demo around the pains heard in discovery, showing the most relevant flow first and leaving the generic tour out.",
    skillIds: ["bd-demos", "bd-discovery-calls"],
    level: 3,
    aliases: ["demo flow", "portfolio walkthrough", "demo script"],
    capstone: { kind: "topic", title: "Running demos practice", topicId: "bd-i-running-demos" },
  },
  {
    id: "bd-run-white-label-demo",
    departmentId: "bd",
    title: "Run a white-label product demo call",
    statement: "Can run a white-label demo call that shows the core product, records which needs it meets as is, and captures the client's requirements for the gap analysis.",
    skillIds: ["bd-demos", "bd-white-label-offering", "bd-proc-whitelabel"],
    level: 3,
    aliases: ["white label demo", "product demo call", "clone app demo"],
    capstone: { kind: "topic", title: "White-label demo call practice", topicId: "pmp-b02-demo-call" },
  },
  {
    id: "bd-consultative-reframe",
    departmentId: "bd",
    title: "Reframe a feature request as a business outcome",
    statement: "Can respond to a client who asks for features by uncovering the business outcome behind them and recommending what serves it, even if that means selling less.",
    skillIds: ["bd-consultative-selling", "bd-spin"],
    level: 4,
    aliases: ["consultative selling", "trusted advisor", "needs-based"],
    capstone: { kind: "topic", title: "Consultative selling practice", topicId: "bd-a-consultative-selling" },
  },
  {
    id: "bd-solution-selling-pain",
    departmentId: "bd",
    title: "Write a pain-led solution message",
    statement: "Can write a solution-selling message that ties the proposed build to the client's diagnosed pain and its cost, rather than to features.",
    skillIds: ["bd-solution-selling", "bd-value-proposition"],
    level: 4,
    aliases: ["solution selling", "pain-driven", "business case email"],
    capstone: { kind: "topic", title: "Solution selling practice", topicId: "bd-a-solution-selling" },
  },
  {
    id: "bd-challenger-insight",
    departmentId: "bd",
    title: "Lead with a commercial insight",
    statement: "Can review a Challenger-style pitch and find where it fails to teach, tailor or take control, so the insight lands with a sceptical buyer.",
    skillIds: ["bd-challenger", "bd-consultative-selling"],
    level: 5,
    aliases: ["challenger sale", "commercial insight", "teach tailor take control"],
    capstone: { kind: "topic", title: "Challenger selling practice", topicId: "bd-a-challenger-selling" },
  },
  {
    id: "bd-sell-ai-project",
    departmentId: "bd",
    title: "Qualify and shape an AI project",
    statement: "Can turn a vague 'we want AI' request into a scoped, testable first project with a measurable outcome and honest limits.",
    skillIds: ["bd-ai-selling-ai", "bd-consultative-selling", "bd-tech-mvp"],
    level: 4,
    aliases: ["selling ai", "ai use case", "chatbot project", "ai readiness"],
    capstone: {
      kind: "task",
      title: "\"We need an AI chatbot\"",
      task: {
        kind: "scenario",
        prompt:
          "The COO of a 300-person insurance broker in Singapore emails: \"Our board wants us to use AI this year. Can you build us an AI chatbot? What does it cost?\" On a first call you learn the support team answers about 400 policy questions a day by email, mostly the same 30 topics, and answers live in PDFs and an old intranet.",
        steps: [
          {
            id: "s1",
            question: "What is the most useful thing to establish next?",
            options: [
              "Which large language model they prefer.",
              "The business outcome they want (e.g. fewer repetitive emails, faster answers) and how they would measure it.",
              "Whether they want the chatbot in blue or in their brand colours.",
              "A fixed price for a full AI platform.",
            ],
            correctIndex: 1,
            explanation: "Selling AI starts with the outcome and the metric; the model and the interface come later.",
          },
          {
            id: "s2",
            question: "What first project do you propose?",
            options: [
              "A company-wide AI platform covering sales, claims and HR in one go.",
              "A pilot assistant that drafts answers for the support team on the top 30 topics from the existing documents, with a human approving each reply, measured on time saved and answer accuracy.",
              "A public chatbot that answers any customer question with no human check from day one.",
              "Nothing until they have cleaned every document they own.",
            ],
            correctIndex: 1,
            explanation: "A narrow, human-in-the-loop pilot on a measurable workload proves value quickly and keeps the risk of wrong answers in a regulated business low.",
          },
          {
            id: "s3",
            question: "The COO asks: \"Will it be 100% accurate?\" What do you answer?",
            options: [
              "\"Yes, modern AI does not make mistakes.\"",
              "\"No system is 100% accurate; we test it on your real questions, show you the accuracy we measure, and keep a person approving answers until you are comfortable.\"",
              "\"Accuracy depends entirely on you.\"",
              "\"We will guarantee accuracy in the contract.\"",
            ],
            correctIndex: 1,
            explanation: "Honest limits plus a measurement plan build trust; over-promising accuracy is both unethical and a contract risk.",
          },
        ],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Scoping and estimation
  // ---------------------------------------------------------------------------
  {
    id: "bd-give-ballpark-estimate",
    departmentId: "bd",
    title: "Give a ballpark estimate as a range",
    statement: "Can work out a rough-order-of-magnitude estimate as a range from a feature list and say what would move it up or down.",
    skillIds: ["bd-tech-estimation", "bd-tech-mvp"],
    level: 2,
    aliases: ["ballpark", "rom estimate", "rough estimate"],
    capstone: { kind: "topic", title: "Software estimation practice", topicId: "bd-b-software-estimation" },
  },
  {
    id: "bd-estimate-vs-quote",
    departmentId: "bd",
    title: "Use 'estimate' and 'quote' correctly",
    statement: "Can tell an estimate from a quote, a PO and an invoice in client messages and fix wording that turns an estimate into a commitment by accident.",
    skillIds: ["bd-proc-terms", "bd-tech-estimation", "bd-pricing-fixed"],
    level: 2,
    aliases: ["estimate vs quote", "quote vs po", "commercial terms"],
    capstone: { kind: "topic", title: "Estimate vs quote vs PO vs invoice", topicId: "pmp-c01-estimate-quote-po" },
  },
  {
    id: "bd-split-mvp-phases",
    departmentId: "bd",
    title: "Split a wish list into MVP and later phases",
    statement: "Can sort a client's feature wish list into an MVP, a phase 2 and out of scope, so the first release is small enough to launch and still useful.",
    skillIds: ["bd-tech-mvp", "bd-tech-estimation", "bd-consultative-selling"],
    level: 3,
    aliases: ["mvp scoping", "phase 1 vs phase 2", "cut the scope"],
    capstone: {
      kind: "task",
      title: "Phase the tutoring marketplace",
      task: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "A founder in the UK wants a marketplace connecting parents with private tutors. She has a fixed launch date in four months for the new school year and a limited budget. Sort her wish list.",
        categories: [
          { id: "mvp", label: "MVP: needed at launch" },
          { id: "phase2", label: "Phase 2: after launch" },
          { id: "out", label: "Out of scope for now" },
        ],
        items: [
          { id: "f1", text: "Parents search tutors by subject and see profiles.", explanation: "Core of the marketplace: without it there is no product." },
          { id: "f2", text: "Parents book and pay for a lesson.", explanation: "The transaction is how the business earns; needed at launch." },
          { id: "f3", text: "Tutors set their availability and accept bookings.", explanation: "The supply side must work on day one." },
          { id: "f4", text: "Admin can approve new tutors before they appear.", explanation: "Safety for a children's service; a simple approval is needed at launch." },
          { id: "f5", text: "In-app video lessons with a whiteboard.", explanation: "Expensive to build; lessons can run on existing video tools at first." },
          { id: "f6", text: "Ratings and reviews after each lesson.", explanation: "Valuable once there are enough lessons; can follow soon after launch." },
          { id: "f7", text: "Loyalty points for parents who book often.", explanation: "A retention feature for later, once there is repeat usage to reward." },
          { id: "f8", text: "An AI that writes homework for students.", explanation: "Not part of the marketplace's purpose and raises ethical concerns; leave it out." },
          { id: "f9", text: "Expansion to five countries with multiple currencies.", explanation: "Far beyond a four-month launch for one market; not part of this project." },
        ],
        answer: { f1: "mvp", f2: "mvp", f3: "mvp", f4: "mvp", f5: "phase2", f6: "phase2", f7: "phase2", f8: "out", f9: "out" },
      },
    },
  },
  {
    id: "bd-sort-assumptions-dependencies",
    departmentId: "bd",
    title: "Write assumptions, dependencies and constraints",
    statement: "Can tell assumptions, dependencies and constraints apart when drafting a proposal, so each one protects the estimate in the right way.",
    skillIds: ["bd-proc-terms", "bd-proposals-sows"],
    level: 3,
    aliases: ["assumptions", "dependencies", "constraints", "proposal caveats"],
    capstone: { kind: "topic", title: "Assumption vs dependency vs constraint", topicId: "pmp-c02-assumption-dependency-constraint" },
  },
  {
    id: "bd-white-label-gap-analysis",
    departmentId: "bd",
    title: "Run a white-label gap analysis",
    statement: "Can sort a prospect's requirements for a white-label product into out of the box, configuration, customisation and new feature, so the quote reflects the real gaps.",
    skillIds: ["bd-proc-whitelabel", "bd-white-label-offering", "bd-tech-estimation"],
    level: 3,
    aliases: ["gap analysis", "fit-gap", "ootb vs custom", "white label scoping"],
    capstone: {
      kind: "task",
      title: "Gap analysis for a grocery delivery reseller",
      task: {
        kind: "categorize",
        mode: "gap-analysis",
        prompt:
          "A prospect in Saudi Arabia wants to launch a grocery delivery service on the agency's white-label grocery app. The core product includes customer, driver and store apps, an admin panel, Stripe and PayPal payments, promo codes, English and Arabic, and push notifications. Sort each requirement from their call.",
        categories: [
          { id: "ootb", label: "Out of the box" },
          { id: "configuration", label: "Configuration" },
          { id: "customisation", label: "Customisation" },
          { id: "new-feature", label: "New feature" },
        ],
        items: [
          { id: "r1", text: "Customers order groceries and track the driver live.", explanation: "Already in the core product as it ships." },
          { id: "r2", text: "Their logo, colours and app name on all three apps.", explanation: "Branding is set through the product's settings and brand kit, not code changes." },
          { id: "r3", text: "Arabic as the default language.", explanation: "Arabic is supported; making it the default is a setting." },
          { id: "r4", text: "Delivery fee based on distance bands they define.", explanation: "Assumed to be supported through admin settings for fee rules: configuration." },
          { id: "r5", text: "Payments through a local Saudi gateway the core does not support.", explanation: "A new integration means changing the product's code: customisation of the payment layer." },
          { id: "r6", text: "Checkout asks for a delivery time slot in a different layout from the core flow.", explanation: "Changing an existing screen's behaviour: customisation." },
          { id: "r7", text: "A subscription box: a weekly basket delivered automatically.", explanation: "Functionality that does not exist in the core at all: a new feature." },
          { id: "r8", text: "Promo codes for the launch campaign.", explanation: "Promo codes ship with the product; creating them is everyday use." },
          { id: "r9", text: "A loyalty wallet where customers earn cashback.", explanation: "Not in the core product: a new feature to estimate and quote separately." },
        ],
        answer: { r1: "ootb", r2: "configuration", r3: "configuration", r4: "configuration", r5: "customisation", r6: "customisation", r7: "new-feature", r8: "ootb", r9: "new-feature" },
      },
    },
  },
  {
    id: "bd-white-label-client-accounts",
    departmentId: "bd",
    title: "Set expectations on client-owned accounts",
    statement: "Can tell a white-label buyer which store, cloud and code accounts they must own and when, and catch wrong promises about publishing under the agency's accounts.",
    skillIds: ["bd-proc-whitelabel", "bd-white-label-offering"],
    level: 3,
    aliases: ["client-owned accounts", "apple developer account", "store accounts"],
    capstone: { kind: "topic", title: "Client-owned store, cloud and code accounts", topicId: "pmp-c07-client-owned-accounts" },
  },

  // ---------------------------------------------------------------------------
  // Proposals and SOWs
  // ---------------------------------------------------------------------------
  {
    id: "bd-review-sow-scope",
    departmentId: "bd",
    title: "Find the holes in a proposal or SOW",
    statement: "Can review a proposal or SOW with engineering and mark vague scope, missing exclusions and unagreed commitments before it reaches the client.",
    skillIds: ["bd-proposals-sows", "bd-tech-delivery-process"],
    level: 3,
    aliases: ["sow review", "proposal review", "scope document"],
    capstone: { kind: "topic", title: "Proposals and SOWs practice", topicId: "bd-i-proposals-sows" },
  },
  {
    id: "bd-write-proposal-summary",
    departmentId: "bd",
    title: "Write a proposal's executive summary",
    statement: "Can write the executive summary of a proposal that restates the client's goal, the recommended approach and phase, the pricing model and the decision needed.",
    skillIds: ["bd-proposals-sows", "bd-value-proposition", "bd-business-writing"],
    level: 4,
    aliases: ["proposal writing", "executive summary", "proposal intro"],
    capstone: {
      kind: "task",
      title: "Executive summary for the field-service app",
      task: {
        kind: "write",
        variant: "general",
        prompt:
          "Write the executive summary (the first section the decision maker reads) of the proposal for the client below. Use only facts from the notes; leave the price itself to the pricing section.",
        context:
          "Discovery notes: HVAC service company in Texas, 60 technicians. Jobs are dispatched by phone and paper job sheets; invoices go out days late and the office re-types everything into QuickBooks. Goal from the owner: 'get paid faster and stop losing job sheets'. Decision maker: the owner, with the office manager as main user. Agreed approach: phase 1 technician app (jobs, photos, customer signature) plus an office dashboard and QuickBooks sync; phase 2 customer booking portal. Pricing model agreed in principle: fixed bid for phase 1 after a short paid discovery. They want technicians using it before their busy summer season.",
        wordLimit: 230,
        rubric: [
          { id: "goal", label: "Client's goal first", description: "Opens with the client's situation and goal (paid faster, no lost job sheets) in their terms, not with the agency's introduction.", weight: 2 },
          { id: "approach", label: "Recommended approach and phases", description: "States phase 1 (technician app, office dashboard, QuickBooks sync) and phase 2 (booking portal) clearly, and why phase 1 comes first.", weight: 1.5 },
          { id: "commercial", label: "Commercial model stated correctly", description: "Names the paid discovery followed by a fixed bid for phase 1 without inventing a price or promising a date the notes do not support.", weight: 1.5 },
          { id: "decision", label: "Clear decision and next step", description: "Ends with what the owner needs to decide and the next step (e.g. approve the discovery).", weight: 1 },
        ],
        sampleAnswer:
          "Your technicians do great work, but paper job sheets and phone dispatch mean invoices go out days late and the office re-types everything into QuickBooks. Your goal is simple: get paid faster and stop losing job sheets.\n\nWe recommend starting with phase 1: a technician app for jobs, photos and customer signatures, an office dashboard to dispatch and track work, and a sync to QuickBooks so invoices go out the day the job is done. A customer booking portal follows in phase 2, once technicians and the office are working from one system.\n\nWe propose a short paid discovery to confirm the job workflow and the QuickBooks setup, after which we will give a fixed price for phase 1 with a timeline aimed at your summer season.\n\nThe decision we need from you: approval to start the discovery, so phase 1 can be planned around your busy period.",
      },
    },
  },
  {
    id: "bd-respond-to-rfp",
    departmentId: "bd",
    title: "Review an RFP response for compliance and fit",
    statement: "Can check an RFP response against the buyer's requirements and mark missed mandatory items, generic answers and unsupported claims.",
    skillIds: ["bd-rfp", "bd-proposals-sows"],
    level: 4,
    aliases: ["rfp", "tender response", "rfi"],
    capstone: { kind: "topic", title: "RFP responses practice", topicId: "bd-a-rfp-responses" },
  },

  // ---------------------------------------------------------------------------
  // Pricing and commercials
  // ---------------------------------------------------------------------------
  {
    id: "bd-match-pricing-model",
    departmentId: "bd",
    title: "Match a deal to a pricing model",
    statement: "Can choose between fixed bid, time and materials, retainer and dedicated team for a given client situation and explain who carries the risk.",
    skillIds: ["bd-pricing-fixed", "bd-pricing-tm", "bd-pricing-retainer", "bd-pricing-dedicated-team"],
    level: 2,
    aliases: ["pricing model", "fixed bid vs t&m", "retainer vs dedicated team"],
    capstone: { kind: "topic", title: "Fixed bid vs T&M vs retainer vs dedicated team", topicId: "pmp-c01-pricing-models" },
  },
  {
    id: "bd-price-a-deal",
    departmentId: "bd",
    title: "Price a deal under different models",
    statement: "Can calculate the price of the same scope under fixed bid and time and materials, including contingency, and compare them for the client.",
    skillIds: ["bd-pricing-fixed", "bd-pricing-tm", "bd-tech-estimation"],
    level: 3,
    aliases: ["deal pricing", "contingency", "price the estimate"],
    capstone: { kind: "topic", title: "Pricing models practice", topicId: "bd-i-pricing-models" },
  },
  {
    id: "bd-propose-retainer-or-team",
    departmentId: "bd",
    title: "Move a client to a retainer or dedicated team",
    statement: "Can recognise when a post-launch client needs a support retainer or a dedicated team instead of another fixed bid, and propose it with clear terms.",
    skillIds: ["bd-pricing-retainer", "bd-pricing-dedicated-team", "bd-account-management"],
    level: 3,
    aliases: ["retainer proposal", "dedicated team", "maintenance plan", "amc"],
    capstone: {
      kind: "task",
      title: "After launch: what next?",
      task: {
        kind: "scenario",
        prompt:
          "A Canadian e-commerce client launched their app with you three months ago on a fixed bid. Since then they have sent 2 to 4 small change requests a month, each quoted separately, and they complain the quoting back-and-forth is slow. They also want to start a bigger roadmap: a loyalty programme, a vendor portal and ongoing performance work over the next year, with priorities that change monthly.",
        steps: [
          {
            id: "s1",
            question: "What is the main commercial problem with the current set-up?",
            options: [
              "The client is not paying enough.",
              "Fixed bids for every small change create quoting overhead and delay for both sides; the work is ongoing and changing, which fixed bids handle badly.",
              "The app was built badly.",
              "Change requests should never be charged.",
            ],
            correctIndex: 1,
            explanation: "Fixed bids suit a stable, defined scope; a steady flow of small, changing work suits a recurring model.",
          },
          {
            id: "s2",
            question: "Which model fits the next twelve months best?",
            options: [
              "One large fixed bid for the whole year's roadmap.",
              "A support retainer for bug fixes and small changes, plus a dedicated team (or a T&M block) for the roadmap, so priorities can change monthly.",
              "No contract: bill whatever hours the team logs.",
              "Keep quoting each change request separately.",
            ],
            correctIndex: 1,
            explanation: "A retainer covers predictable support; a dedicated team or T&M fits a roadmap whose priorities change.",
          },
          {
            id: "s3",
            question: "What must the retainer proposal state clearly?",
            options: [
              "Only the monthly price.",
              "What is included (hours or ticket types, response times), what happens to unused or extra hours, the notice period, and what counts as new work outside it.",
              "That all future work is included for one monthly fee.",
              "A promise that no bugs will ever occur.",
            ],
            correctIndex: 1,
            explanation: "Retainers fail when inclusions, overage and roll-over rules are vague; state them up front.",
          },
        ],
      },
    },
  },
  {
    id: "bd-check-deal-margin",
    departmentId: "bd",
    title: "Check a deal's margin before signing",
    statement: "Can calculate the margin of a proposed deal from the team mix and price, and decide whether a requested discount still leaves the deal worth taking.",
    skillIds: ["bd-margins", "bd-pricing-strategy"],
    level: 5,
    aliases: ["deal margin", "blended rate", "profitability check"],
    capstone: { kind: "topic", title: "Pricing and margins practice", topicId: "bd-x-pricing-margins" },
  },

  // ---------------------------------------------------------------------------
  // Objections, negotiation and closing
  // ---------------------------------------------------------------------------
  {
    id: "bd-handle-price-objection",
    departmentId: "bd",
    title: "Answer a 'too expensive' objection in writing",
    statement: "Can answer a price objection by email: acknowledge it, find out what it is compared with, restate value and offer scope or phasing options instead of a discount.",
    skillIds: ["bd-objection-handling", "bd-business-writing"],
    level: 2,
    aliases: ["price objection", "too expensive", "objection email"],
    capstone: { kind: "topic", title: "Objection handling practice", topicId: "bd-i-objection-handling" },
  },
  {
    id: "bd-hold-price-in-conversation",
    departmentId: "bd",
    title: "Hold the price in a live conversation",
    statement: "Can hold the rate card in a live conversation with an upset client, explain the work in plain words and offer smaller options instead of a straight discount.",
    skillIds: ["bd-objection-handling", "bd-concessions", "bd-account-management"],
    level: 4,
    aliases: ["price pushback", "cr price", "hold the rate"],
    capstone: {
      kind: "task",
      title: "The change request costs how much?",
      task: {
        kind: "roleplay",
        prompt: "You manage this account commercially. The client has just seen the price of a change request and is upset.",
        scenarioId: "cr-price-pushback",
        personaId: "small-business-owner",
        maxTurns: 6,
        brief:
          "Calm the client, explain in plain words what the hours cover, keep the rate card for the same scope, find out what she needs first and by when, and offer real options (one language or the menu first, she supplies translations). End with a clear next step.",
        rubric: [
          { label: "Empathy", points: 2, description: "Acknowledges her surprise before defending the number and asks about the underlying need." },
          { label: "Plain explanation", points: 2, description: "Explains the hours in simple words with no jargon." },
          { label: "Price held, options offered", points: 3, description: "Does not discount the same scope; offers smaller phases or client-supplied inputs as alternatives." },
          { label: "A clear next step", points: 2, description: "Ends with a concrete next step: a revised change request and a date." },
        ],
        followUp: false,
      },
    },
  },
  {
    id: "bd-negotiate-with-batna",
    departmentId: "bd",
    title: "Negotiate from a known BATNA and ZOPA",
    statement: "Can work out both sides' walk-away points and the zone of possible agreement before a negotiation, and set an opening anchor from them.",
    skillIds: ["bd-negotiation", "bd-pricing-strategy"],
    level: 4,
    aliases: ["batna", "zopa", "negotiation prep", "anchoring"],
    capstone: { kind: "topic", title: "Negotiation, BATNA and ZOPA practice", topicId: "bd-a-negotiation-batna-zopa" },
  },
  {
    id: "bd-trade-concessions",
    departmentId: "bd",
    title: "Trade concessions instead of giving discounts",
    statement: "Can reply to a discount request with a give-get trade (scope, payment terms, term length, a case study) so every concession buys something back.",
    skillIds: ["bd-concessions", "bd-negotiation"],
    level: 4,
    aliases: ["give-get", "discount request", "trade scope for price"],
    capstone: { kind: "topic", title: "Concessions and anchoring practice", topicId: "bd-a-concessions-anchoring" },
  },
  {
    id: "bd-close-with-action-plan",
    departmentId: "bd",
    title: "Close a deal with a mutual action plan",
    statement: "Can order the steps from verbal yes to signed contract and kickoff in a mutual action plan, with owners and dates on both sides.",
    skillIds: ["bd-closing", "bd-proposals-sows", "bd-sales-handoff"],
    level: 3,
    aliases: ["mutual action plan", "closing plan", "path to signature"],
    capstone: {
      kind: "task",
      title: "From 'yes' to kickoff",
      task: {
        kind: "rank",
        prompt:
          "A client in Ireland has said 'yes, let's do it' on a call for a fixed-bid app project. Put the steps of the mutual action plan in the order they should happen.",
        items: [
          { id: "a1", label: "Confirm the final scope, assumptions and price in writing after the call" },
          { id: "a2", label: "Send the SOW (and MSA if this is the first project) for review" },
          { id: "a3", label: "Client's legal or finance review; agree any redlines" },
          { id: "a4", label: "Both sides sign the SOW; client pays the first milestone or issues a PO" },
          { id: "a5", label: "Internal sales-to-delivery handoff with the PM and tech lead" },
          { id: "a6", label: "Kickoff call with the client and the delivery team" },
        ],
        correctOrder: ["a1", "a2", "a3", "a4", "a5", "a6"],
        explanation:
          "Written confirmation stops the scope drifting; contracts come before work; the handoff happens once the deal is signed but before the client meets the delivery team, so the PM arrives at kickoff already knowing the deal.",
      },
    },
  },

  // ---------------------------------------------------------------------------
  // CRM, pipeline and forecasting
  // ---------------------------------------------------------------------------
  {
    id: "bd-audit-crm-records",
    departmentId: "bd",
    title: "Keep CRM records clean",
    statement: "Can review CRM records and mark missing next steps, wrong stages, duplicate contacts and activity that was never logged.",
    skillIds: ["bd-crm-hygiene"],
    level: 1,
    aliases: ["crm hygiene", "crm cleanup", "deal records"],
    capstone: { kind: "topic", title: "CRM hygiene practice", topicId: "bd-b-crm-hygiene" },
  },
  {
    id: "bd-review-pipeline",
    departmentId: "bd",
    title: "Run a weekly pipeline review",
    statement: "Can scan the pipeline before a weekly review and flag stale deals, deals in the wrong stage and deals with no next step.",
    skillIds: ["bd-pipeline-management", "bd-crm-hygiene", "bd-pipeline-metrics"],
    level: 3,
    aliases: ["pipeline review", "deal review", "stale deals"],
    capstone: {
      kind: "task",
      title: "Monday pipeline review",
      task: {
        kind: "sim",
        app: "generic",
        title: "Pipeline: open deals (today is 20 May)",
        prompt: "Flag the deals that need attention in today's pipeline review, then answer the questions.",
        columns: ["Deal", "Stage", "Value", "Close date", "Next step", "Last activity"],
        rows: [
          { id: "d1", cells: ["Fitness booking app (US)", "Proposal", "$48,000", "15 Jun", "Review call 22 May", "17 May"], issue: null },
          { id: "d2", cells: ["Pharmacy delivery MVP (UK)", "Negotiation", "$95,000", "30 Apr", "None", "2 Apr"], issue: "Close date is in the past, no next step and no activity for seven weeks: stale and should be re-qualified or closed lost." },
          { id: "d3", cells: ["Clinic group white-label (UAE)", "Qualified", "$30,000", "30 Jun", "Gap analysis 24 May", "16 May"], issue: null },
          { id: "d4", cells: ["Logistics portal (Germany)", "Negotiation", "$180,000", "31 May", "Send proposal", "10 May"], issue: "Stage is Negotiation but the next step is to send the proposal: the stage is ahead of reality." },
          { id: "d5", cells: ["Salon booking rebrand (Australia)", "Proposal", "$22,000", "10 Jun", "Follow-up email 21 May", "14 May"], issue: null },
          { id: "d6", cells: ["Restaurant ordering app (Canada)", "Qualified", "Not set", "Not set", "None", "19 May"], issue: "Qualified with no value, no close date and no next step: the record is incomplete." },
          { id: "d7", cells: ["HVAC field-service app (US)", "Proposal", "$70,000", "5 Jun", "Discovery approval call 23 May", "18 May"], issue: null },
          { id: "d8", cells: ["Insurance AI assistant pilot (Singapore)", "Lead", "$25,000", "15 Jul", "Discovery call 27 May", "15 May"], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "What should happen to the pharmacy delivery deal?",
            options: ["Move the close date to next month and leave it in Negotiation.", "Contact the client to re-qualify; if there is no real next step, mark it closed lost with a reason.", "Delete it from the CRM."],
            correctIndex: 1,
            explanation: "Pushing dates without new information inflates the forecast; re-qualify or close it with a reason so the data stays useful.",
          },
          {
            id: "q2",
            question: "Which stage should the German logistics deal be in?",
            options: ["Negotiation", "Qualified (or Proposal once it is sent)", "Won"],
            correctIndex: 1,
            explanation: "A deal cannot be in Negotiation before the proposal has gone out.",
          },
        ],
      },
    },
  },
  {
    id: "bd-measure-lead-sources",
    departmentId: "bd",
    title: "Compare lead sources by return",
    statement: "Can calculate cost per lead and conversion by source (Upwork, Clutch, outbound, referrals) and decide where to put more effort.",
    skillIds: ["bd-lead-upwork", "bd-lead-clutch", "bd-lead-referrals", "bd-pipeline-metrics"],
    level: 2,
    aliases: ["lead source roi", "channel comparison", "cost per lead"],
    capstone: { kind: "topic", title: "Lead sources practice", topicId: "bd-b-lead-sources" },
  },
  {
    id: "bd-forecast-pipeline",
    departmentId: "bd",
    title: "Build a weighted forecast",
    statement: "Can calculate a weighted pipeline forecast and pipeline metrics such as win rate and sales velocity, and call commit vs best case honestly.",
    skillIds: ["bd-forecasting", "bd-pipeline-metrics"],
    level: 4,
    aliases: ["forecast", "weighted pipeline", "win rate", "sales velocity"],
    capstone: { kind: "topic", title: "Pipeline metrics and forecasting practice", topicId: "bd-a-pipeline-metrics-forecasting" },
  },

  // ---------------------------------------------------------------------------
  // Handover to delivery
  // ---------------------------------------------------------------------------
  {
    id: "bd-write-sales-handoff",
    departmentId: "bd",
    title: "Hand a signed deal over to delivery",
    statement: "Can write a sales-to-delivery handoff brief that gives the PM the client's goal, the signed scope and model, promises made, risks and contacts.",
    skillIds: ["bd-sales-handoff", "bd-tech-delivery-process", "bd-proposals-sows"],
    level: 2,
    aliases: ["handoff brief", "handover to pm", "kickoff brief"],
    capstone: {
      kind: "task",
      title: "Handoff for the HVAC field-service app",
      task: {
        kind: "form",
        variant: "template",
        prompt: "The HVAC deal is signed. Complete the handoff brief for the PM from the deal notes below.",
        context:
          "Deal notes: Texas HVAC company, 60 technicians. Owner Mike signs off; office manager Rosa is the day-to-day contact and main user. Signed: fixed bid for phase 1 (technician app with jobs, photos and signatures; office dashboard; QuickBooks Online sync). Phase 2 (customer booking portal) was discussed but NOT signed. On the last call the salesperson said offline mode 'should be fine' when Mike asked; it is not in the SOW. Mike wants technicians on the app before the summer season. Payment: milestone-based per the SOW.",
        fields: [
          { id: "model", label: "Pricing model", input: "select", options: ["Fixed bid", "Time and materials", "Retainer", "Dedicated team"] },
          { id: "phase2", label: "Is phase 2 in the signed scope?", input: "select", options: ["Yes", "No"] },
          { id: "contacts", label: "Client contacts and roles", input: "textarea" },
          { id: "goal", label: "The client's goal in one line", input: "text" },
          { id: "risks", label: "Promises and risks the PM must know", input: "textarea" },
        ],
        checks: [
          { fieldId: "model", expected: "Fixed bid" },
          { fieldId: "phase2", expected: "No" },
        ],
        rubric: [
          { label: "Contacts and roles", points: 1, description: "Mike as owner and approver, Rosa as day-to-day contact and main user." },
          { label: "Goal stated", points: 1, description: "Get paid faster and stop losing job sheets, with technicians live before summer." },
          { label: "Risks surfaced honestly", points: 3, description: "Flags the offline-mode remark as an expectation not in the SOW that must be addressed early (CR or clarification), the summer deadline, and that phase 2 is not signed." },
        ],
        sampleAnswer: {
          model: "Fixed bid",
          phase2: "No",
          contacts: "Mike (owner): approves scope, milestones and payments. Rosa (office manager): day-to-day contact and main user of the dashboard.",
          goal: "Get paid faster and stop losing job sheets, with technicians on the app before summer.",
          risks:
            "1. Offline mode: sales said it 'should be fine' but it is not in the SOW; clarify with Mike in the first week and raise a CR if he needs it. 2. Hard date pressure: summer season. 3. Phase 2 booking portal was discussed but is not signed; do not plan for it. 4. QuickBooks Online sync depends on their account access.",
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Case studies and social proof
  // ---------------------------------------------------------------------------
  {
    id: "bd-review-case-study",
    departmentId: "bd",
    title: "Strengthen a case study and its proof",
    statement: "Can review a case study or review request and mark vague results, missing client context and claims that need permission or evidence.",
    skillIds: ["bd-case-studies", "bd-social-proof"],
    level: 3,
    aliases: ["case study review", "social proof", "testimonials"],
    capstone: { kind: "topic", title: "Case studies and social proof practice", topicId: "bd-a-case-studies-social-proof" },
  },
  {
    id: "bd-write-case-study",
    departmentId: "bd",
    title: "Write a case study from delivery notes",
    statement: "Can turn delivery notes into a short challenge, solution, result case study that a prospect in the same niche would find relevant, using only approved facts.",
    skillIds: ["bd-case-studies", "bd-business-writing", "bd-value-proposition"],
    level: 4,
    aliases: ["case study writing", "success story", "portfolio piece"],
    capstone: {
      kind: "task",
      title: "Case study: the physiotherapy chain",
      task: {
        kind: "write",
        variant: "general",
        prompt: "Write a short case study for the agency website from the delivery notes. The client has approved being named by sector and country only.",
        context:
          "Delivery notes: physiotherapy chain in Spain, 9 clinics. Before: bookings by phone; reception spent most of the morning on the phone; patients forgot home exercises. Built: rebranded the agency's white-label booking app, added a home-exercise video library (new feature) and appointment reminders. Launch: 14 weeks from kickoff. Results the client confirmed in writing: 58% of bookings now come through the app after three months; reception calls down 'about a third' (client's estimate). Quote from the clinical director, approved: 'Our patients book themselves now, and our reception team finally has time for the people in front of them.'",
        wordLimit: 260,
        rubric: [
          { id: "structure", label: "Challenge, solution, result", description: "Clear three-part structure that a busy reader can scan.", weight: 1 },
          { id: "facts", label: "Only approved facts", description: "Uses the confirmed figures accurately (58% after three months; 'about a third' as the client's estimate), names the client only by sector and country, and adds no invented numbers.", weight: 2 },
          { id: "relevance", label: "Relevant to similar buyers", description: "Explains what was built (white-label base plus a new exercise library and reminders) in terms a clinic owner cares about.", weight: 1.5 },
          { id: "quote", label: "Uses the approved quote", description: "Includes the clinical director's quote word for word, attributed by role.", weight: 1 },
        ],
        sampleAnswer:
          "A nine-clinic physiotherapy chain in Spain: from phone queues to self-booking\n\nThe challenge\nEvery booking came in by phone. Reception spent most of the morning on calls, and patients often forgot their home exercises between sessions.\n\nWhat we built\nWe rebranded our clinic booking app for the chain, then added two things it needed: a home-exercise video library linked to each patient's plan, and automatic appointment reminders. The app launched 14 weeks after kickoff.\n\nThe result\nThree months after launch, 58% of bookings come through the app, and the clinic estimates reception calls are down by about a third.\n\n\"Our patients book themselves now, and our reception team finally has time for the people in front of them.\" - Clinical Director",
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Account growth and retention
  // ---------------------------------------------------------------------------
  {
    id: "bd-propose-phase-two",
    departmentId: "bd",
    title: "Propose a phase 2 to an existing client",
    statement: "Can write an expansion email to a live client that links a phase 2 or new service to results and goals they already shared.",
    skillIds: ["bd-upselling", "bd-cross-selling", "bd-account-management"],
    level: 4,
    aliases: ["upsell", "phase 2 pitch", "expansion email"],
    capstone: { kind: "topic", title: "Account management and expansion practice", topicId: "bd-a-account-management-expansion" },
  },
  {
    id: "bd-handle-scope-creep-account",
    departmentId: "bd",
    title: "Handle a 'small extra' request without giving it away",
    statement: "Can respond to a client asking for unpaid extra scope by acknowledging it, naming it as outside the signed scope and offering a change request or trade-off.",
    skillIds: ["bd-account-management", "bd-proc-terms", "bd-upselling"],
    level: 3,
    aliases: ["scope creep", "free extras", "change request conversation"],
    capstone: {
      kind: "task",
      title: "Just one more small thing",
      task: {
        kind: "roleplay",
        prompt: "You are the account manager on this fixed-bid project. The founder calls you directly instead of the PM.",
        scenarioId: "scope-creep",
        personaId: "startup-founder",
        maxTurns: 6,
        brief:
          "Acknowledge why loyalty points matter to him, explain that it is outside the signed SOW without sounding defensive, find out what the investor demo really needs, and offer a change request with an impact on time and cost or a trade-off. Commit to nothing for free and end with a dated next step.",
        rubric: [
          { label: "Empathy", points: 2, description: "Acknowledges the business reason before talking about scope." },
          { label: "Correct use of process and terms", points: 3, description: "Names the SOW and the change-request route correctly and explains them simply." },
          { label: "A firm and fair scope position", points: 3, description: "Gives nothing away for free; offers a CR, a phase 2 or a lighter demo-only option." },
          { label: "A clear next step", points: 2, description: "Ends with who sends what by when." },
        ],
        followUp: true,
      },
    },
  },
  {
    id: "bd-plan-qbr",
    departmentId: "bd",
    title: "Plan a quarterly business review",
    statement: "Can prepare a QBR agenda that reviews results against the client's goals, raises risks openly and proposes the next quarter's priorities.",
    skillIds: ["bd-qbrs", "bd-account-management", "bd-upselling"],
    level: 4,
    aliases: ["qbr", "business review", "account review agenda"],
    capstone: {
      kind: "task",
      title: "QBR for the retainer client",
      task: {
        kind: "form",
        variant: "template",
        prompt: "Prepare next week's QBR with the client's COO from the account notes.",
        context:
          "Account notes: UK online furniture retailer on a monthly support retainer for its app for 9 months. Goals set at the start of the year: raise app conversion and cut support tickets. This quarter: checkout redesign shipped (client reports app conversion up); two releases slipped by a week each because product decisions came late from the client side; retainer hours were fully used in two of three months. The COO mentioned on a call that they want to start selling to businesses (trade accounts) next year.",
        fields: [
          { id: "attendees", label: "Who should attend", input: "textarea" },
          { id: "results", label: "Results against goals", input: "textarea" },
          { id: "risks", label: "Issues and risks to raise", input: "textarea" },
          { id: "next", label: "Proposed priorities for next quarter", input: "textarea" },
          { id: "length", label: "Meeting length", input: "select", options: ["15 minutes", "60 minutes", "Half a day"] },
        ],
        checks: [{ fieldId: "length", expected: "60 minutes" }],
        rubric: [
          { label: "Results tied to goals", points: 2, description: "Reports the checkout redesign against the conversion goal using the client's own reported result, and says where the ticket goal stands." },
          { label: "Risks raised honestly", points: 2, description: "Raises the two slips and their cause (late decisions) constructively, and the retainer running at capacity." },
          { label: "Forward-looking growth", points: 2, description: "Proposes next-quarter priorities and opens the trade-accounts idea (and whether the retainer size still fits) as a discussion, not a hard pitch." },
        ],
        sampleAnswer: {
          attendees: "Client: COO and product owner. Agency: account manager, PM, tech lead.",
          results: "Checkout redesign shipped; client reports app conversion up (goal 1). Support tickets: share the trend from the tracker against goal 2.",
          risks: "Two releases slipped a week each because product decisions arrived late; propose a weekly decision slot. Retainer hours fully used in two of three months, so there is a risk of a backlog building up.",
          next: "Agree next quarter's top three priorities. Discuss the trade-accounts idea for next year and whether a discovery is needed. Review whether the retainer size still fits the workload.",
          length: "60 minutes",
        },
      },
    },
  },
  {
    id: "bd-save-at-risk-account",
    departmentId: "bd",
    title: "Save an at-risk account",
    statement: "Can spot the warning signs of an account at risk of churning and choose the actions that address the root cause before the renewal date.",
    skillIds: ["bd-retention", "bd-account-management"],
    level: 4,
    aliases: ["churn risk", "at-risk client", "renewal save"],
    capstone: {
      kind: "task",
      title: "The quiet client before renewal",
      task: {
        kind: "scenario",
        prompt:
          "A US client on an annual dedicated-team contract renews in 10 weeks. Over the last two months their product owner has stopped attending sprint demos, replies take days instead of hours, and a new VP of Engineering joined who has asked the PM for 'a full list of everything the team did this year'. Nobody has complained.",
        steps: [
          {
            id: "s1",
            question: "How do you read these signs?",
            options: [
              "All fine: no complaints means a happy client.",
              "A serious churn risk: less engagement plus a new leader reviewing the vendor often comes before a re-tender or moving work in-house.",
              "The client is just busy; wait for the renewal conversation.",
              "A sign they want to expand the team.",
            ],
            correctIndex: 1,
            explanation: "Silence plus a new decision maker auditing the work is a classic early warning; waiting until renewal is too late.",
          },
          {
            id: "s2",
            question: "What do you do first?",
            options: [
              "Offer a renewal discount by email.",
              "Ask for a meeting with the new VP to understand his priorities, and bring a short outcomes summary (what was delivered against their goals), not just a task list.",
              "Escalate to your CEO to call their CEO.",
              "Ask the PM to add more features quickly to impress them.",
            ],
            correctIndex: 1,
            explanation: "Engaging the new decision maker on his priorities, with evidence of value, addresses the root cause; a discount without understanding signals weakness.",
          },
          {
            id: "s3",
            question: "The VP says he wants more control over priorities and finds the sprint reports too technical. What next?",
            options: [
              "Defend the current reports as industry standard.",
              "Agree a changed way of working (a monthly priority session with him, business-level reporting) and confirm it in writing before the renewal talk.",
              "Move the renewal date earlier to lock them in.",
              "Promise faster delivery at the same cost.",
            ],
            correctIndex: 1,
            explanation: "Adapting governance to the new stakeholder fixes the cause of the risk and gives the renewal a solid footing.",
          },
        ],
      },
    },
  },
  {
    id: "bd-build-strategic-account-plan",
    departmentId: "bd",
    title: "Build a strategic account plan",
    statement: "Can prioritise growth opportunities in a key account (whitespace, stakeholders, risks) and set the order of plays for the year.",
    skillIds: ["bd-strategic-accounts", "bd-cross-selling", "bd-upselling"],
    level: 5,
    aliases: ["account plan", "whitespace analysis", "key account management"],
    capstone: { kind: "topic", title: "Strategic accounts practice", topicId: "bd-x-strategic-accounts" },
  },

  // ---------------------------------------------------------------------------
  // Partnerships, enterprise and contracts
  // ---------------------------------------------------------------------------
  {
    id: "bd-structure-white-label-partnership",
    departmentId: "bd",
    title: "Structure a white-label reseller partnership",
    statement: "Can choose how to structure a white-label partnership with a reseller agency (who owns the client, support, branding and pricing) and avoid channel conflict.",
    skillIds: ["bd-white-label-partnerships", "bd-white-label-offering", "bd-proc-whitelabel"],
    level: 5,
    aliases: ["reseller partnership", "white label partners", "channel partners"],
    capstone: { kind: "topic", title: "White-label partnerships practice", topicId: "bd-a-white-label-partnerships" },
  },
  {
    id: "bd-navigate-procurement",
    departmentId: "bd",
    title: "Get through enterprise procurement",
    statement: "Can plan the path through an enterprise buyer's procurement (vendor onboarding, security questionnaire, legal review) without losing momentum or margin.",
    skillIds: ["bd-enterprise-procurement", "bd-meddic"],
    level: 5,
    aliases: ["procurement", "vendor onboarding", "security questionnaire"],
    capstone: { kind: "topic", title: "Enterprise procurement practice", topicId: "bd-a-enterprise-procurement" },
  },
  {
    id: "bd-review-msa-sow",
    departmentId: "bd",
    title: "Review MSA and SOW terms before signature",
    statement: "Can review MSA and SOW wording and mark risky terms (open-ended scope, unlimited liability, acceptance with no deadline) to send to legal.",
    skillIds: ["bd-msa", "bd-proposals-sows", "bd-proc-terms"],
    level: 5,
    aliases: ["msa review", "contract review", "sow terms"],
    capstone: { kind: "topic", title: "MSA and SOW essentials practice", topicId: "bd-x-msa-sow-essentials" },
  },
  {
    id: "bd-explain-nda-ip",
    departmentId: "bd",
    title: "Explain NDA and IP terms to a client",
    statement: "Can explain in writing what an NDA covers and when IP and source code pass to the client, correctly and in plain words.",
    skillIds: ["bd-nda", "bd-ip-clauses"],
    level: 4,
    aliases: ["nda", "ip ownership", "source code ownership"],
    capstone: { kind: "topic", title: "NDA and IP clauses practice", topicId: "bd-x-nda-ip-clauses" },
  },
  {
    id: "bd-ip-licence-white-label",
    departmentId: "bd",
    title: "Tell IP ownership from a licence in white-label deals",
    statement: "Can tell IP ownership, a licence and source-code handover apart in a white-label or custom deal and correct a proposal that promises the wrong one.",
    skillIds: ["bd-ip-clauses", "bd-proc-terms", "bd-white-label-offering"],
    level: 4,
    aliases: ["licence vs ownership", "source code handover", "white label ip"],
    capstone: { kind: "topic", title: "IP ownership vs licence vs source-code handover", topicId: "pmp-c01-ip-licence-handover" },
  },

  // ---------------------------------------------------------------------------
  // AI ethics and leadership
  // ---------------------------------------------------------------------------
  {
    id: "bd-ai-ethics-confidentiality",
    departmentId: "bd",
    title: "Use AI in sales without leaking or inventing",
    statement: "Can decide what client data may go into an AI tool and how to check AI output before it reaches a client.",
    skillIds: ["bd-ai-ethics", "bd-ai-call-notes"],
    level: 3,
    aliases: ["ai ethics", "client data in ai", "hallucination check"],
    capstone: { kind: "topic", title: "AI ethics, accuracy and confidentiality practice", topicId: "bd-x-ai-ethics-accuracy-confidentiality" },
  },
  {
    id: "bd-enter-new-market",
    departmentId: "bd",
    title: "Choose a new region or vertical to enter",
    statement: "Can weigh a new region or vertical on demand, competition, proof and cost to serve, and choose a focused test before a full launch.",
    skillIds: ["bd-new-regions", "bd-new-verticals", "bd-icp"],
    level: 5,
    aliases: ["new market", "new vertical", "geo expansion"],
    capstone: { kind: "topic", title: "New regions and verticals practice", topicId: "bd-x-new-regions-verticals" },
  },
  {
    id: "bd-audit-bd-playbook",
    departmentId: "bd",
    title: "Audit and improve a BD playbook",
    statement: "Can review a BD playbook and mark steps that are vague, untestable or out of date, so a new hire could follow it.",
    skillIds: ["bd-playbooks", "bd-pipeline-management"],
    level: 5,
    aliases: ["playbook", "sales process", "bd sop"],
    capstone: { kind: "topic", title: "BD playbooks practice", topicId: "bd-x-bd-playbooks" },
  },
  {
    id: "bd-coach-bd-team",
    departmentId: "bd",
    title: "Coach a BD team to its targets",
    statement: "Can diagnose why a BD team member is missing target from their pipeline metrics and choose a coaching action that addresses it.",
    skillIds: ["bd-team-leadership", "bd-pipeline-metrics"],
    level: 5,
    aliases: ["sales coaching", "team targets", "bd management"],
    capstone: { kind: "topic", title: "Leading a BD team practice", topicId: "bd-x-leading-bd-team" },
  },
] satisfies PracticalOutcomeSeed[];
