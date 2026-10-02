import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-b02",
  trackId: "pm",
  name: "White-label lifecycle: Demo & requirement call",
  description:
    "Running the white-label product demo honestly and capturing everything a branded instance needs (brand, markets, providers, accounts and gaps) so that the gap analysis starts from facts, not from promises made on a call.",
  topics: [
    {
      id: "pmp-b02-demo-call",
      moduleId: "pmp-b02",
      trackId: "pm",
      title: "Running the product demo call",
      summary:
        "In a white-label sale the demo is the product. The client is deciding whether the existing [[term:core-product]] fits their business, so the call has two jobs: show the product exactly as it is, and learn what the client actually needs. It is a short [[term:discovery]], not a pitch.\n\nWhy it matters at an agency: whatever is said on the demo becomes the client's memory of the deal. If a feature is shown from a roadmap slide, or \"we can do that\" is said about a gap, the client will expect it at no extra cost in UAT. Most white-label disputes trace back to the demo.\n\nHow to run it. Use a working demo environment on the current [[term:product-version]]. Start with the client's business, not the menu: who orders, who delivers, who runs the admin. Walk one real journey end to end in each app. As the client reacts, sort every request silently into three piles: works as shown, can be set up ([[term:configuration]]), or a gap. Say \"let me note that and come back to you in writing\" for anything that is not in the first two piles.\n\nClose with next steps and send a [[term:mom]] within a day: what was shown, what the client asked for, which items need checking, and who sends what next.\n\nThe common mistake is demoing on a broken or outdated environment, or saying yes to please the room. Both cost more later than a slightly awkward \"I will confirm that in writing\".",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Microsoft Learn: Discover customer needs as a solution architect", url: "https://learn.microsoft.com/en-us/training/modules/discover-customer-needs/", kind: "docs", verifiedAt: "2026-10-02T11:52:42Z" },
        { label: "GOV.UK Service Manual: How the discovery phase works", url: "https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works", kind: "docs", verifiedAt: "2026-10-02T11:52:59Z" },
        { label: "Gong: 8 things to consider before your next discovery call", url: "https://www.gong.io/blog/discovery-call/", kind: "article", verifiedAt: "2026-10-02T11:56:06Z" },
      ],
      video: {
        title: "How To Give Product Demos That Sell Using These 5 Tips",
        channel: "Dan Martell",
        url: "https://www.youtube.com/watch?v=_Mm_q0X-R1c",
        videoId: "_Mm_q0X-R1c",
        verifiedAt: "2026-10-02T12:00:23Z",
      },
      alternateVideos: [
        {
          title: "How To Run A Discovery Call - Strategy Session",
          channel: "Patrick Dang",
          url: "https://www.youtube.com/watch?v=_DbSgU5naDQ",
          videoId: "_DbSgU5naDQ",
          verifiedAt: "2026-10-02T12:00:25Z",
        },
      ],
      handbook: { stages: ["wl-demo-call"], rules: ["mom-after-every-client-meeting"], templates: ["mom"] },
      sections: [
        {
          heading: "Before the call",
          body:
            "- Check the demo environment the same day: logins work, sample data looks real, the build is the current [[term:product-version]].\n- Read the BD notes: the client's business, country, existing tools and anything already promised.\n- Agree roles with the BD or account manager: who drives the demo, who takes notes, who answers commercial questions.\n- Prepare the questions you must ask: countries and currencies, languages, payment gateway, SMS and email providers, who owns the brand, and the target launch date.",
        },
        {
          heading: "A simple flow for a 45-minute demo",
          body:
            "1. **Five minutes:** introductions and the client's business in their words.\n2. **Twenty minutes:** one real journey per app, in the order the client's customers would live it. Pause after each to ask \"how do you do this today?\"\n3. **Ten minutes:** the client's questions. Sort each answer into works as shown, can be set up, or \"I will confirm in writing\".\n4. **Five minutes:** the must-ask questions you have not covered.\n5. **Five minutes:** next steps and who sends what.\n\nTypical length is 45 to 60 minutes. Record the call only with the client's consent.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label pharmacy delivery app demoed to a pharmacy chain in Qatar.**\n\nThe PM demos the customer app, the rider app and the admin panel on the current core. The client asks five things:\n\n- \"Can customers upload a prescription photo?\" The core already does this, so the PM shows it.\n- \"Prices in QAR, Arabic and English?\" Supported settings. The PM says these are set up during configuration.\n- \"Can it connect to our stock system?\" Not in the core. The PM says: \"Let me note that. We will look at it with our tech lead and come back in writing.\"\n- \"Can a pharmacist approve each order before dispatch?\" The PM is not sure if the core's order states allow it, so the same answer.\n- \"Can we launch in three weeks?\" The PM explains that the date depends on the client's store accounts and brand kit, and that a plan will follow the gap analysis.\n\nThe [[term:mom]] goes out the next morning with two items marked \"to confirm in the gap analysis\". Nothing outside the core was promised.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Promising a feature the core does not have.** Recover: correct it in writing within a day, before the quote goes out, and log it as a gap.\n- **Not asking about countries and payment gateways early.** These drive most of the setup effort. Recover: send a short question list the same day.\n- **Demoing on an old or broken environment.** Recover: stop, apologise, offer a short follow-up demo on a working environment, and fix the demo checklist.\n- **No notes.** Recover: write the [[term:mom]] from memory with the BD lead today and ask the client to correct it.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Demo environment checked on the day, on the current version.\n2. Roles agreed with BD before the call.\n3. One real journey shown per app.\n4. Every client ask sorted: works as shown, configuration, or to confirm in writing.\n5. Must-ask questions covered: markets, languages, payment and messaging providers, brand owner, target date.\n6. MoM sent within a day, with gaps marked for the gap analysis.",
        },
      ],
      sop: [
        {
          title: "Demo environment and recording",
          prompt: "[Oyelabs SOP – admin to fill] Which demo environment and demo accounts to use per product, who keeps them current, and whether and where demo calls are recorded.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b02-demo-call-q1",
          prompt: "What is the main purpose of a white-label demo call?",
          options: [
            "Show the existing product as it is and learn what the client actually needs",
            "Agree the final price and sign the contract",
            "Show the product roadmap so the client sees what is coming",
            "Collect the client's logo and colours",
          ],
          correctIndex: 0,
          explanation: "The demo shows the real product and starts discovery. Pricing comes after the gap analysis, and the brand kit is a later stage.",
        },
        {
          id: "pmp-b02-demo-call-q2",
          prompt: "During the demo the client asks if the app can connect to their ERP. The core has no such integration. What do you say?",
          options: [
            "\"Let me note that. We will check it with our tech lead and come back to you in writing.\"",
            "\"Yes, we can do that, no problem.\"",
            "\"No, white-label apps cannot integrate with anything.\"",
            "\"It is included, our developers will add it during setup.\"",
          ],
          correctIndex: 0,
          explanation: "A gap must be checked and estimated before anything is promised. A flat no may also be wrong, because the gap could be built as a customisation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b02-demo-call-q3",
          prompt: "Which questions should you make sure are answered on or right after the demo? (Select all that apply.)",
          options: [
            "Which countries, currencies and languages the client needs",
            "Which payment gateway and SMS or email providers they use",
            "Who owns the brand and will provide the assets",
            "Which database engine the core uses",
            "The developers' preferred working hours",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Markets, providers and brand ownership drive setup and gaps. The database engine and team hours are internal.",
        },
        {
          id: "pmp-b02-demo-call-q4",
          prompt: "Ten minutes before the demo you find the demo environment's checkout is broken. What is the best option?",
          options: [
            "Tell the BD lead, switch to a working environment or skip checkout openly, and offer a short follow-up for that part",
            "Demo anyway and hope the client does not notice",
            "Show screenshots and say it is live",
            "Cancel without explanation",
          ],
          correctIndex: 0,
          explanation: "Honesty keeps trust. Hiding a broken flow or passing screenshots off as live destroys it if found out.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b02-demo-call-q5",
          prompt: "The client asks, \"Can we launch in three weeks?\" on the demo. What is the most accurate answer?",
          options: [
            "The date depends on the gap analysis, their store accounts and brand kit, so you will send a plan after those are clear",
            "Yes, white-label apps always launch in three weeks",
            "No, it always takes three months",
            "Whatever the client wants, the team will make it work",
          ],
          correctIndex: 0,
          explanation: "Launch dates in white label depend mostly on client dependencies and approved gaps. Do not commit before you know them.",
        },
        {
          id: "pmp-b02-demo-call-q6",
          prompt: "Why demo one real journey end to end instead of clicking through every menu?",
          options: [
            "The client sees how their own business would run on it, and their reactions show the real needs and gaps",
            "Because menus are confidential",
            "Because it is shorter to show menus",
            "Because the stores require it",
          ],
          correctIndex: 0,
          explanation: "A journey (order, deliver, manage) makes the client compare it with how they work today. That is where gaps show up.",
        },
        {
          id: "pmp-b02-demo-call-q7",
          prompt: "After the demo the client says, \"No need for notes, we will just sign.\" What do you do?",
          options: [
            "Send a short MoM anyway, listing what was shown, what was asked and what is to be confirmed",
            "Skip the MoM to keep things friendly",
            "Send the MoM only to the BD lead",
            "Ask the client to write the notes",
          ],
          correctIndex: 0,
          explanation: "The MoM is the record of what was and was not promised. It protects both sides when the quote and the gaps are discussed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b02-demo-call-q8",
          prompt: "Which of these are signs the demo stage is complete? (Select all that apply.)",
          options: [
            "The demo was given and recorded in a MoM",
            "The client's needs and gaps are listed for the gap analysis",
            "The app is live in the stores",
            "The client has paid the full licence fee",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "The stage ends with a recorded demo and a list of needs and gaps. Going live and payment come much later.",
        },
      ],
      practice: {
        kind: "form",
        variant: "mom",
        templateId: "mom",
        prompt:
          "Write the minutes of this white-label demo call from the notes below. Mark anything that was not in the core as a gap to confirm, not as agreed.",
        context:
          "Demo, Tuesday 11:00 (45 min). Attendees: Fatima (client, owner, Qatar pharmacy chain), Ravi (Oyelabs BD), you (PM).\n\nShown: customer app (browse, prescription upload, checkout), rider app, admin panel. Client liked prescription upload.\n\nClient asks: QAR prices, Arabic and English (both in core). Link to their stock system (not in core). Pharmacist approval of each order before dispatch (not sure the core supports it). Launch \"in about three weeks\".\n\nAgreed: Ravi sends the proposal after the gap analysis. You send a question list on payment gateway and SMS provider by Thursday. Fatima to say who owns the brand assets.",
        fields: [
          { id: "attendees", label: "Attendees", input: "text", required: true },
          { id: "summary", label: "Discussion summary", input: "textarea", required: true },
          { id: "decisions", label: "Decisions and what is in the core", input: "textarea", required: true },
          { id: "gaps", label: "Gaps to confirm in the gap analysis", input: "textarea", required: true },
          { id: "gapCount", label: "Number of gaps to confirm", input: "number", required: true },
          { id: "actions", label: "Action items (owner, due date)", input: "textarea", required: true },
          { id: "launch", label: "What was said about the launch date", input: "select", options: ["Three weeks was agreed", "No date agreed: it depends on the gap analysis and client dependencies", "Launch date is the end of the month"], required: true },
        ],
        checks: [
          { fieldId: "gapCount", expected: 2 },
          { fieldId: "launch", expected: "No date agreed: it depends on the gap analysis and client dependencies" },
        ],
        rubric: [
          { label: "Gaps are recorded as to confirm, never as agreed", points: 3, description: "The stock-system link and pharmacist approval are listed as gaps to check, with no promise of cost or date." },
          { label: "Action items have an owner and a date", points: 2, description: "Ravi: proposal after gap analysis; PM: question list by Thursday; Fatima: brand-asset owner." },
          { label: "Clear and short", points: 2, description: "Plain sentences a client can read in a minute; no internal jargon." },
        ],
        sampleAnswer: {
          attendees: "Fatima (client, owner), Ravi (Oyelabs BD), PM (Oyelabs)",
          summary: "We demoed the customer app (browsing, prescription upload, checkout), the rider app and the admin panel on the current version. Fatima liked prescription upload.",
          decisions: "QAR prices and Arabic and English are supported by the product and will be set up during configuration.",
          gaps: "1. Link to the client's stock system: not in the product today; to be checked and estimated.\n2. Pharmacist approval of each order before dispatch: to be checked against the product's order flow and estimated if needed.",
          gapCount: "2",
          actions: "PM: send questions on payment gateway and SMS provider, by Thursday.\nFatima: confirm who owns the brand assets, by Thursday.\nRavi: send the proposal after the gap analysis.",
          launch: "No date agreed: it depends on the gap analysis and client dependencies",
        },
      },
    },
    {
      id: "pmp-b02-requirement-capture",
      moduleId: "pmp-b02",
      trackId: "pm",
      title: "Capturing white-label requirements",
      summary:
        "After the demo you need a complete picture of the client instance before anyone can quote, configure or build. In a custom project you would write a [[term:brd]]. In white label most of the product already exists, so the capture is shorter but much more specific: what does this client need that the product must be set up for, and where does the product fall short?\n\nWhy it matters: almost every white-label delay is a missing input, not slow development. The client has no Apple account yet, the payment gateway keys are not issued, the SMS sender ID is not registered, or the app name is taken in the store. If you capture these in week one, they can run in parallel. If you find them in week four, they block launch.\n\nHow to do it. Use one requirement capture sheet per instance with a fixed set of headings: business and users, markets (countries, currencies, languages, taxes), brand, accounts and legal entity, providers (payment, SMS, email, maps), feature toggles on or off, content, and the gap list. Write each gap as a short [[term:user-story]] with [[term:acceptance-criteria]], so the tech lead can estimate it. Confirm the sheet with the client in writing.\n\nThe common mistake is writing \"payment: TBD\" or \"languages: standard\". A vague line is a hidden [[term:client-dependency]] or a hidden gap. Every line needs a value, an owner or a question with a date.",
      level: "advanced",
      estMinutes: 45,
      isMilestone: true,
      webRefs: [
        { label: "GOV.UK Service Manual: Writing user stories", url: "https://www.gov.uk/service-manual/agile-delivery/writing-user-stories", kind: "docs", verifiedAt: "2026-10-02T11:49:33Z" },
        { label: "Asana: Requirements gathering, 6 steps", url: "https://asana.com/resources/requirements-gathering", kind: "article", verifiedAt: "2026-10-02T11:54:51Z" },
        { label: "Atlassian: What is a product requirements document (PRD)?", url: "https://www.atlassian.com/agile/product-management/requirements", kind: "article", verifiedAt: "2026-10-02T11:47:55Z" },
        { label: "Atlassian: User stories with examples and a template", url: "https://www.atlassian.com/agile/project-management/user-stories", kind: "article", verifiedAt: "2026-10-02T11:52:59Z" },
      ],
      video: {
        title: "Requirement Gathering Techniques For A Business Analyst",
        channel: "Stefano - The Agile Business Analyst",
        url: "https://www.youtube.com/watch?v=8EBWxW5Cn1g",
        videoId: "8EBWxW5Cn1g",
        verifiedAt: "2026-10-02T12:00:25Z",
      },
      alternateVideos: [
        {
          title: "Requirement Gathering from Client by Business Analyst in Agile",
          channel: "Pramod Hanumappa",
          url: "https://www.youtube.com/watch?v=AMb_4Cdi7zg",
          videoId: "AMb_4Cdi7zg",
          verifiedAt: "2026-10-02T12:00:26Z",
        },
      ],
      handbook: { stages: ["wl-demo-call"], templates: ["whitelabel-onboarding"] },
      sections: [
        {
          heading: "The capture sheet headings",
          body:
            "This is a typical checklist, not an industry standard. Your product may need more.\n\n1. **Business and users:** who uses each app, and the main journey.\n2. **Markets:** countries, cities, currencies, languages, tax rules.\n3. **Brand:** app name and short name, who owns the brand, whether a [[term:brand-kit]] exists.\n4. **Legal entity and accounts:** the exact legal name, and whether the client already has the [[term:apple-developer-account]], [[term:google-play-console]], domain and hosting. See [[term:client-owned-accounts]].\n5. **Providers:** payment gateway, SMS, email and maps, and whether the client has accounts and [[term:api-keys]].\n6. **Toggles:** which core features are on or off.\n7. **Content:** terms, [[term:privacy-policy-url]], FAQ, banners.\n8. **Gaps:** each as a user story with acceptance criteria.\n9. **Dates and constraints:** target launch, events, anything fixed.",
        },
        {
          heading: "Writing a gap so it can be estimated",
          body:
            "A gap written as \"stock integration\" cannot be estimated. Write it as a story:\n\n*As a pharmacy manager, I want product stock to sync from our stock system every 15 minutes, so that customers cannot order items that are out of stock.*\n\nAcceptance criteria:\n- Stock levels update in the app within 15 minutes of a change in the stock system.\n- Out-of-stock items show as unavailable and cannot be added to the cart.\n- If the sync fails, the admin sees an alert.\n\nThen add what the tech lead needs: does the stock system have an API, who provides access, and is there a test environment? Those answers are often the real [[term:client-dependency]].",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label fitness-class booking app for a gym chain in the UAE.**\n\nThe PM runs a 60-minute capture call with the client's operations manager and fills the sheet live on screen:\n\n- Markets: UAE only, AED, English and Arabic (both in the core), 5% VAT.\n- Brand: the client owns the brand. A guidelines PDF exists. App name to be checked for availability in both stores.\n- Accounts: no Apple account yet. The PM flags this at once, because organisation enrolment needs a D-U-N-S number and can take weeks. The client starts it the same day.\n- Providers: their payment gateway is one the core already supports; the client will request live keys. SMS provider not chosen yet: an open question with a date.\n- Toggles: classes and memberships on; personal training off.\n- Gaps: (1) freeze a membership for up to 30 days, (2) sync with their door-access system. Both written as stories.\n\nThe sheet goes to the client the same day for written confirmation, and the gap list goes to the tech lead for the gap analysis. Three [[term:client-dependency]] items now have owners and dates.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **\"TBD\" lines.** Each TBD is either a dependency or a gap. Recover: turn it into a question with an owner and a date.\n- **Capturing only features.** Accounts, keys and the legal entity are where white-label launches stall. Recover: add the accounts section today and send it.\n- **Gaps without acceptance criteria.** The estimate will be wrong and the client will argue in UAT. Recover: write criteria and confirm them before the quote.\n- **Not confirming in writing.** Recover: send the sheet and ask for a short \"confirmed\" reply.",
        },
        {
          heading: "Your checklist",
          body:
            "1. All nine headings filled, with no TBD left without an owner and a date.\n2. Legal entity name written exactly as registered.\n3. Account status known for Apple, Google Play, domain, hosting, payment and messaging.\n4. Every gap written as a story with acceptance criteria.\n5. Client confirmed the sheet in writing.\n6. Gap list sent to the tech lead for the gap analysis.",
        },
      ],
      sop: [
        {
          title: "Requirement capture sheet",
          prompt: "[Oyelabs SOP – admin to fill] Link the Oyelabs requirement capture sheet for white-label products, the headings it must have per product, and where the confirmed sheet is stored.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b02-requirement-capture-q1",
          prompt: "Why are white-label launches usually delayed?",
          options: [
            "Missing client inputs such as store accounts, provider keys and brand assets",
            "Slow developers",
            "The core product being rewritten for each client",
            "The stores refusing all white-label apps",
          ],
          correctIndex: 0,
          explanation: "The product already exists, so the critical path is usually client dependencies. Capturing them in week one lets them run in parallel.",
        },
        {
          id: "pmp-b02-requirement-capture-q2",
          prompt: "Which items belong on a white-label requirement capture sheet? (Select all that apply.)",
          options: [
            "The client's exact legal entity name",
            "Payment gateway and whether live keys exist",
            "Languages and currencies needed",
            "The list of gaps, written as stories",
            "The core's internal class names",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Legal name, providers, markets and gaps all shape setup. Internal code structure is not a client requirement.",
        },
        {
          id: "pmp-b02-requirement-capture-q3",
          prompt: "A line on your sheet says \"Payment: TBD\". What should it become?",
          options: [
            "A question with an owner and a date, such as \"Client to confirm gateway and request live keys by 12 May\"",
            "Leave it; payment can be decided at launch",
            "Assume the default gateway and move on",
            "Delete the line until the client mentions it",
          ],
          correctIndex: 0,
          explanation: "A vague line is a hidden dependency. Gateway accounts and live keys can take weeks, so they need an owner and a date now.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b02-requirement-capture-q4",
          prompt: "Which is the best way to write the gap \"membership freeze\" for estimation?",
          options: [
            "A user story with acceptance criteria, such as members can freeze for up to 30 days and billing pauses during the freeze",
            "\"Membership freeze: like other apps\"",
            "\"Freeze feature, small\"",
            "A screenshot from a competitor's app with no text",
          ],
          correctIndex: 0,
          explanation: "A story with criteria tells the tech lead what to estimate and gives the client something to accept in UAT.",
        },
        {
          id: "pmp-b02-requirement-capture-q5",
          prompt: "In the capture call you learn the client has no Apple developer account. Why act on this immediately?",
          options: [
            "Organisation enrolment needs a D-U-N-S number and verification, which can take weeks and may block submission",
            "Because Apple accounts expire after a week",
            "Because the developers need it to start coding",
            "It is not urgent; it is only needed after go-live",
          ],
          correctIndex: 0,
          explanation: "Getting a D-U-N-S number and completing Apple's organisation enrolment typically takes about a week or more. Starting late blocks submission.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b02-requirement-capture-q6",
          prompt: "The client says, \"Languages: standard.\" What do you do?",
          options: [
            "Ask which languages exactly, and check each against what the core ships",
            "Assume English only",
            "Assume every language the core supports",
            "Write \"standard\" on the sheet",
          ],
          correctIndex: 0,
          explanation: "\"Standard\" means different things to different people. A language the core does not ship is a gap.",
        },
        {
          id: "pmp-b02-requirement-capture-q7",
          prompt: "Which of these are client dependencies, not development tasks? (Select all that apply.)",
          options: [
            "Registering the SMS sender ID",
            "Requesting live payment gateway keys",
            "Providing the privacy policy page on the client's domain",
            "Building the membership freeze feature",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Sender IDs, live keys and legal pages are owned by the client. A new feature is development work from the gap analysis.",
        },
        {
          id: "pmp-b02-requirement-capture-q8",
          prompt: "The client's ops manager confirms the sheet on a call but the owner, who signs, was not there. What is the safest next step?",
          options: [
            "Send the sheet and ask the person who approves scope to confirm it in writing",
            "Treat the call as confirmation",
            "Start configuration and wait for questions",
            "Ask the ops manager to sign the contract",
          ],
          correctIndex: 0,
          explanation: "The confirmation should come from whoever approves scope, in writing. Otherwise the owner may reject it later.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b02-requirement-capture-q9",
          prompt: "What should leave the requirement capture step for the next stage?",
          options: [
            "A confirmed sheet and a gap list ready for the tech lead to estimate",
            "A signed go-live checklist",
            "Approved store listings",
            "A finished custom module",
          ],
          correctIndex: 0,
          explanation: "Capture feeds the gap analysis. Listings, builds and go-live come later.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "This requirement capture sheet for a white-label grocery app in Oman is about to go to the tech lead. Mark every line that would cause a delay, a dispute or a wrong estimate.",
        segments: [
          { id: "r1", text: "Business: customers order groceries; drivers deliver; store staff manage orders in the admin panel.", issue: null },
          { id: "r2", text: "Markets: Muscat and Salalah. Currency OMR. Languages: Arabic and English (both in core).", issue: null },
          { id: "r3", text: "Legal entity: \"the client's company\", to be confirmed later.", issue: "The exact legal name drives Apple enrolment and the seller name. It needs a value or an owner and date." },
          { id: "r4", text: "Brand: client owns the brand; guidelines PDF received.", issue: null },
          { id: "r5", text: "Apple and Google accounts: we can publish under the Oyelabs account for now.", issue: "Stores expect apps from the client's own accounts, and a later transfer is slow. The client must own them." },
          { id: "r6", text: "Payment: TBD.", issue: "A hidden dependency. Gateway choice and live keys need an owner and a date." },
          { id: "r7", text: "SMS provider: client uses an existing provider; client to register the sender ID by 20 May.", issue: null },
          { id: "r8", text: "Toggles: wallet on, scheduled delivery on, tipping off.", issue: null },
          { id: "r9", text: "Gap 1: loyalty points, should work like the big apps.", issue: "Not estimable. It needs a user story with acceptance criteria." },
          { id: "r10", text: "Gap 2: as a driver, I can mark an item substituted, so that the customer is charged the right price. Criteria agreed.", issue: null },
          { id: "r11", text: "Target launch: before the holiday season; client confirms the date by 15 May.", issue: null },
          { id: "r12", text: "Confirmation: the sheet was sent to the client's owner for written confirmation.", issue: null },
        ],
        askExplanation: true,
      },
    },
  ],
} satisfies Module;
