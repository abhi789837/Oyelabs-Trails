import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-b03",
  trackId: "pm",
  name: "White-label lifecycle: Gap analysis",
  description:
    "The core skill of white-label delivery: sorting every client need into out of the box, configuration, customisation or new feature, estimating and pricing the gaps as separate approved items, and stopping customisation creep before it turns an instance into a fork.",
  topics: [
    {
      id: "pmp-b03-ootb-config-custom",
      moduleId: "pmp-b03",
      trackId: "pm",
      title: "Out of the box vs configuration vs customisation",
      summary:
        "Gap analysis is where a white-label project is won or lost. Every need from the requirement capture goes into one of four buckets:\n\n- **Out of the box:** the [[term:core-product]] already does it as shown.\n- **[[term:configuration]]:** the core supports it through settings, the [[term:configuration-panel]] or an existing [[term:feature-toggle]]. No code.\n- **[[term:customisation]]:** an existing feature must behave differently for this client. Code changes.\n- **[[term:new-feature]]:** the core has nothing like it. It is new development, ideally built as a separate [[term:custom-module]].\n\nWhy it matters at an agency: the setup price covers the first two buckets. The last two change the scope, cost money to build and keep costing money at every [[term:core-upgrade]]. A gap labelled wrongly is either free work or a client who feels misled.\n\nThe method, borrowed from ERP practice, is \"fit to standard\" first: map how the client works onto the product as it is, and try to meet each need through configuration. Microsoft's guidance sums it up as \"adopt wherever possible, adapt only where justified\". Only what is left becomes a gap, and for each gap there are three options: build it, use an existing third-party tool, or the client changes their process.\n\nFollow the Oyelabs rule in the handbook card below for what counts as configuration. The common mistake is skipping the third option. Many \"must-haves\" disappear when you ask how much the client is willing to pay for them versus adjusting a process.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Microsoft Learn: Fit-to-standard and fit-gap analysis", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution-fit-to-standard-fit-gap-analysis", kind: "docs", verifiedAt: "2026-10-02T11:52:42Z" },
        { label: "Microsoft Learn: Extend Dynamics 365 apps without compromising performance", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/extend-your-solution", kind: "docs", verifiedAt: "2026-10-02T11:48:54Z" },
        { label: "Microsoft Learn: Implement a solution based on business processes", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution", kind: "docs", verifiedAt: "2026-10-02T11:48:52Z" },
      ],
      video: {
        title: "Configuration vs. Customization: Understanding the Differences",
        channel: "Technology Advisors, Inc.",
        url: "https://www.youtube.com/watch?v=drk4_gaw06Y",
        videoId: "drk4_gaw06Y",
        verifiedAt: "2026-10-02T12:00:27Z",
      },
      alternateVideos: [
        {
          title: "Fit-Gap Analysis Explained – Choosing the Right Solution for Your Business #businessanalysis",
          channel: "Global Insight Decode the World",
          url: "https://www.youtube.com/watch?v=dCORFJ5Ml-E",
          videoId: "dCORFJ5Ml-E",
          verifiedAt: "2026-10-02T12:00:30Z",
        },
      ],
      handbook: { stages: ["wl-gap-analysis"], rules: ["configuration-vs-customisation"] },
      sections: [
        {
          heading: "The decision, one question at a time",
          body:
            "Ask these in order for each need. Stop at the first yes.\n\n1. **Does the core do this today, exactly as the client needs?** Yes: out of the box. Show it to them to be sure.\n2. **Can it be done with settings, the admin panel, content or an existing toggle, with no developer writing code?** Yes: [[term:configuration]].\n3. **Is there an existing feature that does almost this, and the client needs it to behave differently?** Yes: [[term:customisation]].\n4. **Otherwise** it is a [[term:new-feature]]: a capability the core does not have.\n\nThen, for every item in buckets 3 and 4, ask the fourth-option question: could a third-party tool do it, or could the client adjust their process? Record the answer either way.",
        },
        {
          heading: "What good looks like: a decision-style worked example",
          body:
            "**A white-label grocery delivery app for a supermarket group in Oman.** The capture lists seven needs. The PM and the tech lead walk each through the four questions:\n\n- **Arabic and English.** Q1: the core ships both. *Out of the box.*\n- **Delivery zones for Muscat and Sohar with different fees.** Q1: no zones yet. Q2: zones and fees are admin settings. *Configuration.*\n- **Hide tipping.** Q2: an existing toggle. *Configuration.*\n- **A local payment gateway the core already integrates.** Q2: set the gateway and the client's keys. *Configuration* (plus a client dependency for the keys).\n- **Substitutions approved by the customer in the app before checkout closes.** Q3: the core already has substitutions, but the driver decides. Changing who decides changes an existing flow. *Customisation.*\n- **A loyalty programme with points and tiers.** Q3: nothing similar. Q4: *New feature*, as a separate [[term:custom-module]]. Option check: the client already uses a loyalty provider with an API, so the PM also offers \"integrate with your provider\" as a cheaper path.\n- **A printed packing slip in their own layout.** Q3: the core prints slips. Option check: the client agrees to use the standard slip with their logo (configuration) rather than pay for a custom layout. *Moved from customisation to configuration by a process change.*\n\nResult: 1 out of the box, 4 configuration, 1 customisation, 1 new feature, with one alternative offered. The two gaps go for estimates. The client gets the list in writing at the gap-analysis walkthrough.",
        },
        {
          heading: "Customisation vs new feature: why the split matters",
          body:
            "Both need code, but they age differently.\n\n- A **[[term:customisation]]** changes code that the core team also changes. Every [[term:core-upgrade]] risks [[term:customisation-merge-conflicts]]. It is the most expensive kind of gap to keep.\n- A **[[term:new-feature]]** built as a separate [[term:custom-module]] sits beside the core. Upgrades usually affect it less, and it may later be offered to other clients or merged into the core.\n\nSo when a customisation can be redesigned as a new, separate module, it is often cheaper over the client's lifetime, even if it costs more to build.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Calling customisation \"configuration\" to close the sale.** The cost appears later, in delivery and in upgrades. Recover: correct the gap list before the quote is signed and explain the change honestly.\n- **Classifying alone.** The PM knows the client; the tech lead knows the code. Recover: review every bucket-3 and bucket-4 item with the tech lead.\n- **Never offering the process option.** Recover: for each gap, add one line, \"or the client could…\", and let the client choose.\n- **No written approval.** Recover: send the classified list and ask the client sponsor to approve it.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Every captured need has one of the four buckets.\n2. Each bucket-1 item was shown or checked in the product, not assumed.\n3. Each bucket-2 item names the setting, toggle or admin screen.\n4. Each bucket-3 and bucket-4 item was reviewed with the tech lead and has an alternative noted.\n5. The client has the list in writing and the sponsor approved it.",
        },
      ],
      sop: [
        {
          title: "Gap-analysis sheet",
          prompt: "[Oyelabs SOP – admin to fill] Link the Oyelabs gap-analysis sheet, the list of included configuration items for each white-label product, and who signs off the classification internally.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b03-ootb-config-custom-q1",
          prompt: "The client needs prices in SAR. The core supports SAR as a currency setting. Which bucket?",
          options: ["Configuration", "Out of the box", "Customisation", "New feature"],
          correctIndex: 0,
          explanation: "It needs a setting changed, with no code, so it is configuration. Out of the box would mean it works as shown without any setup.",
        },
        {
          id: "pmp-b03-ootb-config-custom-q2",
          prompt: "The core has a referral feature that gives a fixed credit. The client wants the credit to depend on the friend's first order value. Which bucket?",
          options: ["Customisation", "Configuration", "Out of the box", "New feature"],
          correctIndex: 0,
          explanation: "The feature exists, but its logic must change for this client, so it is customisation. If a setting already allowed this, it would be configuration.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b03-ootb-config-custom-q3",
          prompt: "Which three options exist for each gap, according to fit-gap practice? (Select all that apply.)",
          options: [
            "Build it (customise or extend)",
            "Use a third-party tool",
            "The client changes their process",
            "Hide it from the gap list until UAT",
            "Promise it for free to keep the client",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Build, buy or change the process. Hiding or giving away gaps creates disputes and unpaid work.",
        },
        {
          id: "pmp-b03-ootb-config-custom-q4",
          prompt: "What does \"adopt wherever possible, adapt only where justified\" mean for a white-label PM?",
          options: [
            "Try to meet each need with the product as it is or with configuration, and customise only when the value justifies the cost",
            "Adopt every client request and adapt the core to fit",
            "Adapt the client's brand to the product's default colours",
            "Never customise anything",
          ],
          correctIndex: 0,
          explanation: "Fit to standard first. Customisation is allowed, but only for needs that are worth their build and upgrade cost.",
        },
        {
          id: "pmp-b03-ootb-config-custom-q5",
          prompt: "The client wants a gift-card feature. The core has nothing similar. What is it, and how should it ideally be built?",
          options: [
            "A new feature, ideally built as a separate custom module",
            "Configuration, switched on with a new toggle",
            "A customisation inside the checkout code",
            "Out of the box, because most apps have it",
          ],
          correctIndex: 0,
          explanation: "A capability the core lacks is a new feature. A separate module keeps it away from core code and makes upgrades easier.",
        },
        {
          id: "pmp-b03-ootb-config-custom-q6",
          prompt: "Why is a customisation often more expensive to keep than a new feature built as a separate module?",
          options: [
            "It changes code the core team also changes, so each core upgrade can cause merge conflicts",
            "Because new features are always smaller",
            "Because stores charge for customisations",
            "It is not; they cost the same to keep",
          ],
          correctIndex: 0,
          explanation: "Changing shared code means every upgrade must be merged and retested. A separate module is touched less by core changes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b03-ootb-config-custom-q7",
          prompt: "The sales lead suggests labelling a new booking flow as \"configuration\" so the client signs this week. What do you do?",
          options: [
            "Refuse to relabel it; list it as a gap with an estimate and explain why to the sales lead",
            "Agree, and absorb it in setup",
            "Agree, but tell developers to build it quickly",
            "Leave it off the gap list entirely",
          ],
          correctIndex: 0,
          explanation: "Relabelling a gap is one of the classic white-label failures. It becomes unpaid work and a future upgrade problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b03-ootb-config-custom-q8",
          prompt: "Who should you review customisation and new-feature items with before sending the gap list?",
          options: ["The tech lead", "Only the client", "Only the designer", "Nobody: the PM decides"],
          correctIndex: 0,
          explanation: "The tech lead knows what the code supports and what a change really involves. The PM knows the client. Both are needed.",
        },
        {
          id: "pmp-b03-ootb-config-custom-q9",
          prompt: "Which of these show the gap analysis is finished? (Select all that apply.)",
          options: [
            "Every requirement is classified",
            "Customisations and new features are estimated and quoted",
            "The client approved the scope and price",
            "The app has passed store review",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Classification, estimates and client approval end the stage. Store review is much later.",
        },
        {
          id: "pmp-b03-ootb-config-custom-q10",
          prompt: "The client insists on a custom packing-slip layout. The standard slip can show their logo. What is a good gap-analysis move?",
          options: [
            "Offer the standard slip with their logo as configuration, and price the custom layout as a gap so they can choose",
            "Build the layout for free because it is small",
            "Tell them slips cannot be changed",
            "Add it silently to the setup work",
          ],
          correctIndex: 0,
          explanation: "Giving a priced choice between the product as it is and a customisation lets the client decide on value. Often they pick the standard option.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "gap-analysis",
        prompt:
          "Gap analysis for a white-label clinic-booking app sold to a group of dental clinics in Saudi Arabia. The core supports: Arabic and English; SAR and other currencies; clinic branches, doctors and opening hours in the admin panel; SMS reminders 24 hours before; online payment through two integrated gateways; a toggle for video consultations; reviews; a standard booking flow (choose clinic, doctor, slot, pay). Put each need in the right bucket.",
        categories: [
          { id: "ootb", label: "Out of the box" },
          { id: "configuration", label: "Configuration" },
          { id: "customisation", label: "Customisation" },
          { id: "new-feature", label: "New feature" },
        ],
        items: [
          { id: "g1", text: "Patients can book in Arabic or English.", explanation: "The core ships both languages as standard." },
          { id: "g2", text: "Add the group's 12 branches, doctors and opening hours.", explanation: "Branches, doctors and hours are admin-panel data." },
          { id: "g3", text: "Turn off video consultations.", explanation: "An existing toggle." },
          { id: "g4", text: "Send the reminder 48 hours before instead of 24. The tech lead confirms the 24-hour timing is fixed in code.", explanation: "The reminder exists but its timing is fixed in code, so changing it for this client is a customisation." },
          { id: "g5", text: "Take payment through one of the two gateways the core already integrates, using the group's keys.", explanation: "Choosing an integrated gateway and entering keys is configuration." },
          { id: "g6", text: "Insurance pre-approval: patients upload their insurance card and staff approve before the slot is confirmed.", explanation: "Nothing like it exists in the core: a new feature, ideally a separate module." },
          { id: "g7", text: "Patients can leave a review after a visit.", explanation: "Reviews are in the core as shown." },
          { id: "g8", text: "Booking flow should ask for the treatment type first, then show only doctors who offer it.", explanation: "The booking flow exists; changing its order and logic is a customisation." },
          { id: "g9", text: "Add the group's logo and brand colours.", explanation: "Branding is applied through theming during setup, with no new code." },
          { id: "g10", text: "A loyalty wallet where patients earn credit on each visit.", explanation: "The core has no wallet or loyalty: a new feature." },
          { id: "g11", text: "Integrate a third gateway that the core does not support.", explanation: "A new integration for a capability the core has (payments) but not with this provider. Treated as a customisation of the payment feature." },
          { id: "g12", text: "Prices shown in SAR.", explanation: "A supported currency setting." },
        ],
        answer: {
          g1: "ootb",
          g2: "configuration",
          g3: "configuration",
          g4: "customisation",
          g5: "configuration",
          g6: "new-feature",
          g7: "ootb",
          g8: "customisation",
          g9: "configuration",
          g10: "new-feature",
          g11: "customisation",
          g12: "configuration",
        },
      },
    },
    {
      id: "pmp-b03-estimating-billing-gaps",
      moduleId: "pmp-b03",
      trackId: "pm",
      title: "Estimating and billing the gaps",
      summary:
        "Once the gaps are classified, each one needs an [[term:estimate]], a price and a decision about where the code will live. The client then approves the whole package in writing before setup starts.\n\nWhy it matters: in white label the client was sold a product with a [[term:setup-fee]] and usually a licence or [[term:subscription-plan]]. Gaps are extra. If you lump them into the setup fee, you cannot later explain what the client paid for, and you cannot drop one gap without reopening the whole price. Separate line items keep every decision visible.\n\nHow to do it. For each [[term:customisation]] or [[term:new-feature]], the tech lead estimates the effort (development, QA, PM and any design), with assumptions. The PM records whether it will stay client-only or go into the [[term:core-product]], who owns the code, and what it adds to future upgrades. The BD or account manager prices it. Each gap is then quoted as its own item, typically as a fixed-price [[term:change-request]] or as [[term:time-and-materials]], on top of the setup fee.\n\nSome agencies give a gap away, or price it lower, when it will go into the core and benefit other clients. That is a commercial decision, not a PM decision. Follow the Oyelabs rule in the handbook card below for who approves and how.\n\nThe common mistake is estimating only the build. A gap also costs testing, store re-review time and upgrade effort for as long as the client stays.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Learn training: Perform fit gap analysis", url: "https://learn.microsoft.com/en-us/training/modules/fit-gap-analysis/", kind: "docs", verifiedAt: "2026-10-02T11:52:42Z" },
        { label: "Asana: Gap analysis, 4-step process", url: "https://asana.com/resources/gap-analysis", kind: "article", verifiedAt: "2026-10-02T11:54:16Z" },
        { label: "Atlassian: Story points and agile estimation", url: "https://www.atlassian.com/agile/project-management/estimation", kind: "article", verifiedAt: "2026-10-02T11:49:32Z" },
      ],
      video: {
        title: "What is a FIT-GAP analysis . How to determine Effort Estimate. E-Mail-careers@sapsol.com",
        channel: "SAPSOL Technologies",
        url: "https://www.youtube.com/watch?v=Wp3O8Vg-bkk",
        videoId: "Wp3O8Vg-bkk",
        verifiedAt: "2026-10-02T12:00:29Z",
      },
      alternateVideos: [
        {
          title: "Part-6: Fit-Gap Analysis: Learning Path to Become Functional Consultant",
          channel: "DynamicsClass",
          url: "https://www.youtube.com/watch?v=B8X5ZGXv8rA",
          videoId: "B8X5ZGXv8rA",
          verifiedAt: "2026-10-02T12:00:29Z",
        },
      ],
      handbook: { stages: ["wl-gap-analysis"], rules: ["cr-approval", "billing-change-request", "billing-new-feature"], templates: ["cr-form"] },
      sections: [
        {
          heading: "One line per gap",
          body:
            "A gap line item typically has:\n\n- **ID and title**, written as the user story from the capture sheet.\n- **Bucket:** [[term:customisation]] or [[term:new-feature]].\n- **Effort:** development, QA, PM, design, each in hours or days, with the tech lead's [[term:assumption]] list.\n- **Where the code lives:** client-only [[term:custom-module]], a change inside core code (avoid), or planned for the core roadmap.\n- **Upgrade impact:** what each future [[term:core-upgrade]] will need for this gap.\n- **Price and billing model:** fixed, or time and materials.\n- **Timeline impact:** whether it moves the launch, or can follow after launch as a [[term:phase-2]] item.\n\nThe client approves or declines each line. Declined lines stay on record as declined.",
        },
        {
          heading: "Launch first, gaps later",
          body:
            "A useful pattern: launch the configured product first and deliver gaps afterwards. The client starts earning sooner, the store review is simpler, and each gap is tested on a live, stable base.\n\nThis is not always possible. If a gap is essential for the business to run, such as a local payment method customers expect, it must be in the first release. Ask the client one question per gap: \"Could you launch without it for a month?\" The answer sorts the list into launch-critical and phase 2.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label grocery app for a supermarket group in Oman, after classification.** Two gaps remain.\n\n**Gap 1: customer-approved substitutions (customisation).** The tech lead estimates 32 hours of development, 12 of QA and 4 of PM. It changes the core's substitution flow, so the PM asks whether it can be built as an extension instead of an edit. It can, with 4 more development hours. The line says: client-only module, small upgrade impact, launch-critical (customers in this market expect it).\n\n**Gap 2: loyalty with points and tiers (new feature).** Estimated at 80 hours of development, 24 of QA and 8 of PM. The client already uses a loyalty provider, so a second option is quoted: integration only, at 30, 10 and 4 hours. The product team is interested in loyalty for the core, so the PM flags it to BD, who decides the commercial treatment.\n\nThe quote shows the setup fee, then Gap 1, then Gap 2 with both options, each priced separately. The client approves the setup, Gap 1, and the integration option of Gap 2 as phase 2. Everyone can see what was bought.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **One combined price.** Recover: split the quote into setup plus one line per gap before it is signed.\n- **Estimating only development.** Recover: add QA, PM and design, and an upgrade-impact note to each line.\n- **Promising a gap will go into the core.** Only the product owner can decide the core roadmap. Recover: say \"we will propose it for the core\" and nothing more.\n- **Starting a gap before written approval.** Recover: pause, send the line item, and get approval from the named approver.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Each gap has its own line: story, bucket, effort by role, assumptions.\n2. Each line says where the code lives and the upgrade impact.\n3. Each line says launch-critical or phase 2.\n4. Alternatives (integrate, process change) are quoted where they exist.\n5. Prices come from BD under the Oyelabs rule, not from the PM.\n6. The client approved each line in writing.",
        },
      ],
      sop: [
        {
          title: "Gap pricing and approval",
          prompt: "[Oyelabs SOP – admin to fill] How white-label gaps are priced (rate card, fixed or T&M), when a gap may be discounted because it goes into the core, and who approves the quote internally.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b03-estimating-billing-gaps-q1",
          prompt: "Why quote each gap as its own line item instead of adding it to the setup fee?",
          options: [
            "Each gap can be approved, declined or phased on its own, and the client can see what they paid for",
            "Because the stores require itemised quotes",
            "Because setup fees cannot change",
            "So the PM can hide gaps the client did not ask about",
          ],
          correctIndex: 0,
          explanation: "Separate lines keep decisions visible and let the client choose. A lump sum makes every later change a renegotiation.",
        },
        {
          id: "pmp-b03-estimating-billing-gaps-q2",
          prompt: "What should a gap estimate include besides development effort? (Select all that apply.)",
          options: [
            "QA effort",
            "PM and design effort",
            "Assumptions",
            "Upgrade impact for future core releases",
            "The developers' salaries",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "A complete estimate covers all roles, assumptions and the long-term upgrade cost. Salaries are internal, not part of a client estimate.",
        },
        {
          id: "pmp-b03-estimating-billing-gaps-q3",
          prompt: "A product manager says a gap \"will probably go into the core next year\". The client asks if they can get it free. What do you say?",
          options: [
            "Pricing for gaps that may go into the core is a commercial decision; you will raise it with BD and come back",
            "Yes, anything that goes into the core is free",
            "No, gaps are never discounted",
            "Tell them to wait a year",
          ],
          correctIndex: 0,
          explanation: "Some agencies discount gaps that benefit the core, but it is not the PM's decision and \"probably\" is not a roadmap commitment.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b03-estimating-billing-gaps-q4",
          prompt: "Which question best sorts gaps into launch-critical and phase 2?",
          options: [
            "\"Could you launch without it for a month?\"",
            "\"Which gap do you like most?\"",
            "\"Which gap is cheapest?\"",
            "\"Which gap did your competitor build?\"",
          ],
          correctIndex: 0,
          explanation: "It tests whether the business can run without the gap. If it can, the gap can follow after launch on a stable base.",
        },
        {
          id: "pmp-b03-estimating-billing-gaps-q5",
          prompt: "A developer started building a gap because \"the client said yes on the call\". The named approver has not approved it. What do you do?",
          options: [
            "Pause the work, send the line item, and get written approval from the named approver",
            "Continue; a verbal yes is enough",
            "Finish it and bill later",
            "Delete the code",
          ],
          correctIndex: 0,
          explanation: "A verbal yes from someone else is not approval. Pausing protects both sides from a disputed invoice.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b03-estimating-billing-gaps-q6",
          prompt: "Which billing models are typical for white-label gaps? (Select all that apply.)",
          options: [
            "A fixed-price change request",
            "Time and materials",
            "Included in the store developer fee",
            "Paid by the app stores",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Gaps are usually fixed-price CRs or T&M on top of the setup fee. Store fees have nothing to do with development.",
        },
        {
          id: "pmp-b03-estimating-billing-gaps-q7",
          prompt: "A gap can be built either by editing core checkout code (40 h) or as a separate extension (46 h). What is the better default, and why?",
          options: [
            "Usually the extension: it costs a little more now but less at every core upgrade",
            "The edit, because it is cheaper today",
            "Neither; refuse the gap",
            "Whichever the client prefers without explaining the trade-off",
          ],
          correctIndex: 0,
          explanation: "Editing core code creates upgrade conflicts for as long as the client stays. A small extra cost now is usually cheaper over time.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b03-estimating-billing-gaps-q8",
          prompt: "Who normally does what in pricing a gap?",
          options: [
            "Tech lead estimates, PM records scope and impact, BD or account manager prices, client sponsor approves",
            "PM estimates and prices, developers approve",
            "Client estimates, PM approves",
            "Designer estimates and prices",
          ],
          correctIndex: 0,
          explanation: "This matches the RACI on the gap-analysis stage card. The PM does not set prices alone.",
        },
        {
          id: "pmp-b03-estimating-billing-gaps-q9",
          prompt: "The client declines one gap. What happens to its line?",
          options: [
            "It stays on record as declined, so nobody later assumes it was included",
            "It is deleted",
            "It is built anyway at no cost",
            "It moves into the setup fee",
          ],
          correctIndex: 0,
          explanation: "A declined line is evidence of what was not bought. It prevents \"we thought that was included\" in UAT.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "The tech lead has estimated the gaps for a white-label grocery app. The client approved Gaps A and B for launch, Gap C as phase 2, and declined Gap D. Work out the effort for the quote.",
        table: {
          columns: ["Gap", "Dev hours", "QA hours", "PM hours", "Decision"],
          rows: [
            ["A: customer-approved substitutions", "36", "12", "4", "Launch"],
            ["B: local SMS provider integration", "16", "6", "2", "Launch"],
            ["C: loyalty provider integration", "30", "10", "4", "Phase 2"],
            ["D: custom packing-slip layout", "12", "4", "1", "Declined"],
          ],
        },
        fields: [
          { id: "launch", label: "Total hours for the launch-critical gaps (A and B, all roles)", unit: "h", answer: 76, tolerance: 0, expression: "T[0][1]+T[0][2]+T[0][3]+T[1][1]+T[1][2]+T[1][3]" },
          { id: "phase2", label: "Total hours for phase 2 (C, all roles)", unit: "h", answer: 44, tolerance: 0, expression: "T[2][1]+T[2][2]+T[2][3]" },
          { id: "qa", label: "QA hours across all approved gaps (A, B and C)", unit: "h", answer: 28, tolerance: 0, expression: "T[0][2]+T[1][2]+T[2][2]" },
        ],
        explanation:
          "Launch: A is 36 + 12 + 4 = 52 and B is 16 + 6 + 2 = 24, so 76 hours. Phase 2: C is 30 + 10 + 4 = 44 hours. QA for approved gaps is 12 + 6 + 10 = 28 hours. D is declined, so it is left out but stays on record.",
      },
    },
    {
      id: "pmp-b03-avoiding-custom-creep",
      moduleId: "pmp-b03",
      trackId: "pm",
      title: "Avoiding customisation creep",
      summary:
        "Customisation creep is [[term:scope-creep]] in white-label form. It rarely arrives as one big request. It arrives as ten small ones over months: a field here, a different label there, a slightly different flow for one city. Each looks cheap. Together they turn a clean [[term:client-instance]] into a [[term:client-fork]] that nobody can upgrade.\n\nWhy it matters at an agency: the white-label model only makes money if many clients share one core. Every customisation is a cost that never ends, because it has to be carried through every [[term:core-upgrade]] and [[term:version-sync]]. Microsoft's ERP guidance makes the same point: recreating a client's old processes leads to costly customisations that need more design, coding, testing, training and documentation, and cut the client off from standard support.\n\nHow to stop it. Run every request through the same gate as the first gap analysis, at any stage of the project: classify it, estimate it, and get it approved as a [[term:change-request]] before work starts. Prefer a separate [[term:custom-module]] over edits to core code. Keep a running customisation register per client so you can show the total, not just the latest item. And ask about the business need, because the need can often be met by configuration or a process change.\n\nThe common mistake is the friendly yes. A PM who absorbs \"tiny\" changes to keep the client happy is borrowing from every future upgrade. Hard cases are covered below: changes disguised as bugs, reseller pressure, and requests during UAT.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Microsoft Learn: Design a solution architecture that works for you", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/solution-architecture-design-pillars", kind: "docs", verifiedAt: "2026-10-02T11:48:53Z" },
        { label: "Atlassian: Scope creep in project management", url: "https://www.atlassian.com/work-management/project-management/scope-creep", kind: "article", verifiedAt: "2026-10-02T11:49:30Z" },
        { label: "Wikipedia: Scope creep", url: "https://en.wikipedia.org/wiki/Scope_creep", kind: "article", verifiedAt: "2026-10-02T11:57:00Z" },
      ],
      video: {
        title: "Jeevarajan Kumar | The Design Fit/Gap Framework | Mission: Implementation | Objective 02",
        channel: "Microsoft Dynamics 365 Community",
        url: "https://www.youtube.com/watch?v=_NgV9QT1Lpo",
        videoId: "_NgV9QT1Lpo",
        verifiedAt: "2026-10-02T12:00:32Z",
      },
      alternateVideos: [
        {
          title: "Project Management Scope Creep [MANAGE IT LIKE A PRO]",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=_c-qzFV5yM4",
          videoId: "_c-qzFV5yM4",
          verifiedAt: "2026-10-02T12:00:31Z",
        },
      ],
      handbook: { stages: ["wl-gap-analysis"], rules: ["configuration-vs-customisation", "cr-when-needed", "core-upgrade-custom-impact"] },
      interactive: { kind: "decision-tool", request: "Our end client wants the order history screen to show the branch name too. It's just one more field, can you add it before launch?" },
      sections: [
        {
          heading: "Hard case 1: the change disguised as a bug",
          body:
            "In UAT the client logs: \"Bug: the booking screen does not show the patient's insurance number.\" The core never had that field, and the gap analysis did not include it.\n\nIt is not a [[term:bug]]: the product works as agreed. It is a change. Say so kindly and with evidence: \"The approved scope (gap list, line 4) does not include an insurance field. I have logged it as a change request and will send an estimate tomorrow.\" Use the decision tool above to check the classification, and never let a change slip in under a bug ticket, because then it is built for free and nobody records it as a customisation.",
        },
        {
          heading: "Hard case 2: the reseller who promised too much",
          body:
            "A [[term:reseller]] sold the product to their end client and promised two features the core does not have, with a launch date. Now they want you to \"just add them\".\n\n- Separate the problems: the launch date is achievable on the core; the two features are gaps.\n- Offer options: launch on time without them and add them as phase 2, or delay launch and quote them now.\n- Help the reseller save face with their client: give them a clear one-page explanation they can forward.\n- Do not build anything until the reseller approves a change request in writing. They are your client, not the end client.",
        },
        {
          heading: "Hard case 3: creep you already allowed",
          body:
            "You inherit a client with eighteen undocumented changes made directly in their copy. Upgrades now take weeks.\n\n1. Build a customisation register with the tech lead: each change, where it is in the code, and whether it is still used.\n2. Sort each into: remove (unused), move to configuration (the core now supports it), move to a separate module, or keep as is.\n3. Price the clean-up as a project and present it to the client with the upgrade savings it brings.\n4. From now on, every new request goes through the gate.\n\nFollow the Oyelabs rule in the handbook card below for how upgrade work on custom code is billed.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label salon-booking app for a chain in Bahrain, three months after launch.** The client's manager sends five small requests in one week.\n\nThe PM does not answer them one by one. She adds them to the client's customisation register and runs the gate:\n\n- \"Show stylist photos bigger\": a theme setting exists. *Configuration*, done the same day.\n- \"Hide the tips screen\": an existing toggle. *Configuration.*\n- \"Add a 'favourite stylist' button\": no such feature. *New feature*, as a small module.\n- \"Change the cancellation rule to 12 hours for VIP customers only\": the rule exists; VIP logic does not. *Customisation.*\n- \"Bookings sometimes show the wrong time\": checked with QA, a real defect in the core. Logged as a *bug*, not part of the register.\n\nShe sends one email with the five answers, two estimates as change requests, and a one-line note: \"With these two, your app will have four customisations to carry through upgrades.\" The client approves the module, drops the VIP rule, and asks for the bug fix date.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Absorbing small changes.** Recover: start a register today, list what was absorbed, and route every new request through the gate.\n- **Classifying under pressure on a call.** Recover: \"I will check and reply in writing by tomorrow\" is always allowed.\n- **Arguing scope without offering options.** Recover: always pair \"this is a change\" with two paths: configuration or process change, or a priced CR.\n- **Treating the end client as the approver when a reseller is in the middle.** Recover: send all estimates to the reseller.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Every request, at any stage, goes through the same four-bucket gate.\n2. Changes are never logged as bugs.\n3. Each client has a customisation register with a running total.\n4. Each \"this is a change\" comes with options.\n5. New code goes into separate modules, not core edits, wherever possible.\n6. Approval comes in writing from the contracting party (the reseller, if there is one).",
        },
      ],
      sop: [
        {
          title: "Customisation register",
          prompt: "[Oyelabs SOP – admin to fill] Where each client's customisation register lives, who updates it, and how often it is reviewed with the product team.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b03-avoiding-custom-creep-q1",
          prompt: "In UAT the client logs a bug: \"The order screen has no field for the company VAT number.\" The field was never in the core or the gap list. What is it?",
          options: [
            "A change request, because the product works as agreed",
            "A bug, because the client logged it as one",
            "A bug under warranty",
            "A clarification",
          ],
          correctIndex: 0,
          explanation: "A bug is behaviour that fails the agreed scope. A new field nobody agreed is a change, whatever the ticket is called.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b03-avoiding-custom-creep-q2",
          prompt: "Why is customisation creep more damaging in white label than scope creep in a custom project?",
          options: [
            "Each customisation must be carried through every future core upgrade, so its cost never ends",
            "Because white-label clients pay less attention",
            "Because stores reject customised apps",
            "It is not more damaging",
          ],
          correctIndex: 0,
          explanation: "In a custom project scope creep ends at handover. In white label, every customisation is paid for again at each upgrade.",
        },
        {
          id: "pmp-b03-avoiding-custom-creep-q3",
          prompt: "A reseller promised their end client two features the core does not have. Which responses are right? (Select all that apply.)",
          options: [
            "Offer launch on the core now with the features as phase 2, or a later launch with the features quoted",
            "Give the reseller a short explanation they can forward to their client",
            "Send estimates and get approval from the reseller, who is your contracting client",
            "Build them quietly to keep the reseller happy",
            "Talk directly to the end client about price without the reseller",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Options, a face-saving explanation and approval from the contracting party. Building for free or bypassing the reseller damages the relationship and the margin.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b03-avoiding-custom-creep-q4",
          prompt: "What is the main purpose of a customisation register per client?",
          options: [
            "To show the running total of customisations and their upgrade cost, not just the latest request",
            "To track developer hours",
            "To store the client's passwords",
            "To list store rejections",
          ],
          correctIndex: 0,
          explanation: "Creep is invisible one item at a time. The register makes the total, and its long-term cost, visible to the client and the team.",
        },
        {
          id: "pmp-b03-avoiding-custom-creep-q5",
          prompt: "You inherit an instance with many undocumented direct code changes. What is the best first step?",
          options: [
            "Build a customisation register with the tech lead, then sort each change into remove, configure, module or keep",
            "Delete all changes at the next upgrade",
            "Tell the client they can no longer be upgraded",
            "Ignore it until something breaks",
          ],
          correctIndex: 0,
          explanation: "You cannot fix what is not listed. Sorting each change gives a priced clean-up plan the client can approve.",
        },
        {
          id: "pmp-b03-avoiding-custom-creep-q6",
          prompt: "A client asks five small things in one week. Which approach works best?",
          options: [
            "Run all five through the same gate and reply once, with configurations done and changes estimated",
            "Say yes to all five because each is small",
            "Reply to each as it arrives, deciding on the spot",
            "Refuse all five until the next contract",
          ],
          correctIndex: 0,
          explanation: "One gate and one reply keeps classification consistent and shows the client the whole picture.",
        },
        {
          id: "pmp-b03-avoiding-custom-creep-q7",
          prompt: "Which of these requests are configuration, assuming the core supports them? (Select all that apply.)",
          options: [
            "Make stylist photos bigger using an existing theme setting",
            "Hide the tips screen with an existing toggle",
            "Add a new VIP-only cancellation rule",
            "Add a 'favourite stylist' button",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Existing settings and toggles are configuration. New rules and new buttons need code.",
        },
        {
          id: "pmp-b03-avoiding-custom-creep-q8",
          prompt: "On a call the client pushes: \"Just tell me now, is it included or not?\" You are not sure. What do you say?",
          options: [
            "\"I want to give you the right answer, so I will check and reply in writing by tomorrow.\"",
            "\"Yes, it's included.\"",
            "\"No, nothing is included.\"",
            "\"Ask the developers directly.\"",
          ],
          correctIndex: 0,
          explanation: "A guess on a call becomes a commitment. A short, dated promise to answer in writing is professional and safe.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b03-avoiding-custom-creep-q9",
          prompt: "Why prefer a separate custom module over editing core code, even for a small change?",
          options: [
            "Core upgrades touch separate modules less, so the change costs less to carry",
            "Modules are free to build",
            "Stores only accept modular apps",
            "Editing core code is forbidden by law",
          ],
          correctIndex: 0,
          explanation: "Edits inside shared code collide with core changes at each upgrade. Separate modules isolate the client's code.",
        },
        {
          id: "pmp-b03-avoiding-custom-creep-q10",
          prompt: "The client says, \"Other vendors include small changes for free.\" What is the strongest reply?",
          options: [
            "Explain that every change must be carried through each upgrade, offer a configuration or process alternative, and quote the change",
            "Match the other vendors and include it",
            "Tell them to use another vendor",
            "Ignore the comparison",
          ],
          correctIndex: 0,
          explanation: "Explain the real cost in the client's terms and give options. That holds the scope while keeping the conversation constructive.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "gap-analysis",
        prompt:
          "Three months after launch, a white-label food-delivery client in Kuwait sends these requests. The core supports: Arabic and English; KWD; zones and delivery fees in the admin panel; promo codes (fixed or percentage); a toggle for scheduled orders; a toggle for cash on delivery; restaurant ratings; a standard checkout. Classify each request. Watch for requests that sound like configuration but are not.",
        categories: [
          { id: "ootb", label: "Out of the box" },
          { id: "configuration", label: "Configuration" },
          { id: "customisation", label: "Customisation" },
          { id: "new-feature", label: "New feature" },
        ],
        items: [
          { id: "c1", text: "Turn on scheduled orders for the weekend.", explanation: "An existing toggle." },
          { id: "c2", text: "A promo code that gives 15% off.", explanation: "Percentage promo codes are supported settings." },
          { id: "c3", text: "A promo code that only works for a customer's first three orders.", explanation: "Promo codes exist but have no order-count rule, so the logic must change: customisation." },
          { id: "c4", text: "Add a new delivery zone for Jahra with its own fee.", explanation: "Zones and fees are admin data." },
          { id: "c5", text: "Customers can rate restaurants.", explanation: "Ratings are in the core as shown." },
          { id: "c6", text: "Customers can rate each driver separately from the restaurant.", explanation: "Ratings exist for restaurants only; extending the rating feature to drivers changes it: customisation." },
          { id: "c7", text: "A subscription plan with free delivery for a monthly fee.", explanation: "Nothing like subscriptions exists: a new feature." },
          { id: "c8", text: "Checkout should ask for a building and floor number as two separate required fields.", explanation: "Changing the core checkout form for one client is customisation, however small." },
          { id: "c9", text: "Switch off cash on delivery.", explanation: "An existing toggle." },
          { id: "c10", text: "A dashboard for restaurant owners showing their weekly sales.", explanation: "The core has no restaurant-owner dashboard: a new feature." },
          { id: "c11", text: "Change the app's accent colour for the national day.", explanation: "A theme setting: configuration." },
          { id: "c12", text: "Show prices in KWD with three decimals.", explanation: "KWD is a supported currency; its format comes with the setting." },
        ],
        answer: {
          c1: "configuration",
          c2: "configuration",
          c3: "customisation",
          c4: "configuration",
          c5: "ootb",
          c6: "customisation",
          c7: "new-feature",
          c8: "customisation",
          c9: "configuration",
          c10: "new-feature",
          c11: "configuration",
          c12: "configuration",
        },
      },
    },
  ],
} satisfies Module;
