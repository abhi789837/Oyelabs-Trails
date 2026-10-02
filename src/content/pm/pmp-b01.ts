import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-b01",
  trackId: "pm",
  name: "White-label lifecycle: What white-label means",
  description:
    "The mental model behind every white-label project at an agency: one core product, many branded client instances, and three layers of change (branding, configuration and customisation) that carry very different costs.",
  topics: [
    {
      id: "pmp-b01-core-vs-instance",
      moduleId: "pmp-b01",
      trackId: "pm",
      title: "Core product vs client instance",
      summary:
        "A [[term:white-label]] project is not a small custom project. Oyelabs already owns a working product, the [[term:core-product]]. The client buys a branded copy of it, the [[term:client-instance]], with its own name, icon, store listing, settings and usually its own data. Most white-label problems start when someone forgets which of the two they are changing.\n\nThe core is shared. A fix or a new feature in the core can reach every client at the next [[term:core-upgrade]]. The instance belongs to one client. Its brand, its keys, its store accounts and its configuration must never leak into the core or into another client's instance.\n\nHow the instance is built depends on the product. Some products run one [[term:multi-tenant]] backend with a branded app per client. Others deploy a full [[term:single-tenant]] stack per client. The second gives more isolation, but every upgrade has to be rolled out once per client.\n\nAs a PM, ask three questions on day one. Which core version is this client on? Is the instance a pure configuration of the core, or has it become a [[term:client-fork]]? Who owns which account? The common mistake is treating the instance as \"our app with a new logo\". Once code is changed directly in a client's copy, that client drifts away from the core, and every future upgrade costs more.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "Microsoft Learn: Tenancy models for a multitenant solution", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models", kind: "docs", verifiedAt: "2026-10-02T11:53:14Z" },
        { label: "AWS SaaS Architecture Fundamentals: Full stack silo and pool", url: "https://docs.aws.amazon.com/whitepapers/latest/saas-architecture-fundamentals/full-stack-silo-and-pool.html", kind: "docs", verifiedAt: "2026-10-02T11:49:11Z" },
        { label: "Wikipedia: White-label product", url: "https://en.wikipedia.org/wiki/White-label_product", kind: "article", verifiedAt: "2026-10-02T11:47:38Z" },
      ],
      video: {
        title: "What is White Label? Products, Software, and More",
        channel: "Vendasta",
        url: "https://www.youtube.com/watch?v=AYmcCfQgIPg",
        videoId: "AYmcCfQgIPg",
        verifiedAt: "2026-10-02T12:00:19Z",
      },
      alternateVideos: [
        {
          title: "Multitenancy Explained",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=60ccSmOxpMw",
          videoId: "60ccSmOxpMw",
          verifiedAt: "2026-10-02T12:00:20Z",
        },
      ],
      handbook: { rules: ["configuration-vs-customisation"] },
      interactive: { kind: "flashcards", category: "whitelabel" },
      sections: [
        {
          heading: "The words you will use every day",
          body:
            "- **[[term:core-product]]:** the product Oyelabs builds once and maintains for everyone. It has a [[term:product-version]].\n- **[[term:client-instance]]:** one client's branded, configured copy of the core.\n- **[[term:client-fork]]:** an instance whose code has been changed directly, so it no longer matches the core.\n- **[[term:white-label]] vs [[term:private-label]] vs [[term:reseller]]:** in everyday agency usage, white label means one generic product sold under many brands; private label means a product made for one brand only; a reseller sells our product to its own end clients. Agencies use these words loosely, so check what the client means.\n\nUse the tooltips and the flashcards below to drill the exact meanings rather than relying on memory.",
        },
        {
          heading: "Shared or isolated: why the tenancy model matters to a PM",
          body:
            "You do not choose the architecture, but it changes your plan.\n\n- **One shared backend, many branded apps ([[term:multi-tenant]]).** Setting up a new client is mostly configuration. One upgrade reaches everyone at once. A bad release also reaches everyone at once, and a client asking for \"our own database\" is a real change.\n- **A full stack per client ([[term:single-tenant]]).** Isolation is high and one client's load does not affect another. But hosting, monitoring and every upgrade are repeated per client, so the cost per client is higher.\n\nMicrosoft and AWS describe the same trade-off (they call it shared vs dedicated, or pool vs silo). Ask the tech lead which model your product uses before you promise a client anything about data, performance or upgrade timing.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label grocery delivery app rebranded for a client in Oman.**\n\nThe client buys the customer app, the driver app and the admin panel. On day one the PM writes a one-page instance summary:\n\n1. **Core version:** the current release of the grocery core, noted by version number.\n2. **Instance:** a new tenant on the shared backend, with its own branded customer and driver apps.\n3. **Branding:** the client's name, icon, colours and Arabic and English store texts.\n4. **Configuration:** currency OMR, the cities and delivery zones, the tax setting and the payment gateway the client already uses.\n5. **Gaps:** a loyalty scheme the core does not have, recorded for gap analysis and not promised.\n6. **Accounts:** Apple, Google Play, domain and payment accounts to be opened in the client's own name.\n\nEvery later conversation refers back to this page. When the client asks for a change in month three, the PM can say at once whether it touches the instance, the core or neither.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Editing the client's copy directly to win a quick change.** The instance turns into a [[term:client-fork]] and every [[term:core-upgrade]] now needs a merge. Recover: list every direct change, ask the tech lead which can move into configuration or a separate [[term:custom-module]], and plan that work.\n- **Not recording the core version.** Months later nobody knows which fixes the client has. Recover: record it now in the instance record and in the status report.\n- **Calling the client's app \"our app\" in front of them.** To the client, and to the stores, it is their product. Use their app name in every client message.",
        },
        {
          heading: "Your checklist",
          body:
            "1. I can name the core product and the core version this client is on.\n2. I know whether the product is shared (multi-tenant) or a stack per client.\n3. I have a one-page instance summary: branding, configuration, gaps, accounts.\n4. Nothing in this instance is changed directly in core code without an approved decision.\n5. Every gap is written down for the gap analysis, not promised in a call.",
        },
      ],
      sop: [
        {
          title: "Where the instance record lives",
          prompt: "[Oyelabs SOP – admin to fill] Name the tool and template Oyelabs uses to record each client instance (core version, tenancy, configuration, gaps, account owners) and who keeps it up to date.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b01-core-vs-instance-q1",
          prompt: "A client in Kuwait buys Oyelabs' white-label food delivery app. What exactly are they getting?",
          options: [
            "A branded, configured copy of an existing product, built from a core that Oyelabs keeps maintaining",
            "A new app designed and coded from scratch to their specification",
            "The source code of the product, to change however they like",
            "A licence to resell the product to other companies",
          ],
          correctIndex: 0,
          explanation: "White label means an existing core product rebranded and configured for the client. A from-scratch build is a custom project, and source-code rights or resale rights are separate commercial terms.",
        },
        {
          id: "pmp-b01-core-vs-instance-q2",
          prompt: "Which of these belong to the client instance rather than the core product? (Select all that apply.)",
          options: [
            "The client's app name, icon and colours",
            "The client's payment gateway keys",
            "The checkout logic every client uses",
            "The client's delivery zones and currency",
            "The shared order-tracking feature",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Branding, keys and business settings are per instance. Shared features such as checkout and order tracking live in the core and reach every client.",
        },
        {
          id: "pmp-b01-core-vs-instance-q3",
          prompt: "To ship one client's request quickly, a developer edited the checkout code inside that client's copy only. What has the instance become?",
          options: ["A client fork", "A new core version", "A configuration change", "A feature toggle"],
          correctIndex: 0,
          explanation: "Code changed directly in one client's copy creates a fork. It no longer matches the core, so each future core upgrade needs a merge for that client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b01-core-vs-instance-q4",
          prompt: "Your product runs one shared backend for all white-label clients. A client asks for a release to go live only for them on Friday. What should you check first?",
          options: [
            "With the tech lead, whether a backend release can be limited to one client, since a shared backend normally changes for everyone at once",
            "Nothing: every client gets their own release by default",
            "Only whether the client has paid the setup fee",
            "Whether the client's store listing is approved",
          ],
          correctIndex: 0,
          explanation: "On a shared (multi-tenant) backend a server release normally reaches every client. Limiting it to one client needs a toggle or a separate deployment, which the tech lead must confirm.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b01-core-vs-instance-q5",
          prompt: "Why record the core version each client instance runs?",
          options: [
            "So you know which fixes and features the client has, and what an upgrade will involve",
            "Because the stores ask for it in the listing",
            "So the client can change it in the admin panel",
            "It only matters for custom projects",
          ],
          correctIndex: 0,
          explanation: "Without the version you cannot answer \"do we have that fix?\" or plan a version sync. The stores track the app's own version, not the core's.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "You are writing the instance summary for a white-label salon-booking app sold to a chain in Dubai. Put each item where it belongs: the shared core product, or this client's instance.",
        categories: [
          { id: "core", label: "Core product (shared)" },
          { id: "instance", label: "Client instance (this client only)" },
        ],
        items: [
          { id: "i1", text: "The booking calendar logic that checks stylist availability", explanation: "Every client uses it, so it lives in the core." },
          { id: "i2", text: "The chain's logo, app name and brand colours", explanation: "Branding is per instance." },
          { id: "i3", text: "The live keys for the chain's payment gateway account", explanation: "Keys belong to the client's own account and to this instance only." },
          { id: "i4", text: "A security fix to the login flow released last month", explanation: "Fixes are made once in the core and reach clients through an upgrade." },
          { id: "i5", text: "Opening hours, branches and the AED currency setting", explanation: "Business settings are configuration of this instance." },
          { id: "i6", text: "The admin panel's report export feature", explanation: "A shared feature of the product." },
          { id: "i7", text: "The Arabic and English store listing texts", explanation: "The listing belongs to the client's app." },
          { id: "i8", text: "The push notification service code", explanation: "Shared code; only the client's sender details are per instance." },
        ],
        answer: { i1: "core", i2: "instance", i3: "instance", i4: "core", i5: "instance", i6: "core", i7: "instance", i8: "core" },
      },
    },
    {
      id: "pmp-b01-what-can-change",
      moduleId: "pmp-b01",
      trackId: "pm",
      title: "What a client can and cannot change",
      summary:
        "Every white-label client asks for changes. Your job is to know, before you answer, which layer the change sits in, because each layer has a different cost.\n\n- **Branding:** name, icon, colours, fonts, splash screen. Expected, and part of setup. This is [[term:rebranding]] and [[term:theming]].\n- **[[term:configuration]]:** settings the product already supports, such as languages, currencies, cities, taxes, payment and SMS providers, and features switched on or off with a [[term:feature-toggle]] or the [[term:configuration-panel]]. No new code. It survives upgrades.\n- **[[term:customisation]]:** anything that needs new or changed code. It changes the scope, it is estimated and approved before work starts, and it carries an upgrade cost for as long as the client stays.\n\nWhy this matters at an agency: the sale was priced on the product as it is. A change that is really customisation but is treated as configuration is free work, and it quietly turns the instance into a [[term:client-fork]]. Follow the Oyelabs rule in the handbook card below for what is included in setup.\n\nHow to decide: ask \"can the tech lead or I do this in the admin panel or settings file today, without a developer writing code?\" If yes, it is configuration. If not, it is customisation, even if it sounds small.\n\nThe common mistake is the word \"just\". \"Just move the button\", \"just add one field\", \"just a different flow for our city\". Small-sounding changes to screens or flows are code changes, and code changes have to be maintained through every core release.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Microsoft Learn: Deployment and configuration of multitenant solutions", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/approaches/deployment-configuration", kind: "docs", verifiedAt: "2026-10-02T11:57:54Z" },
        { label: "Martin Fowler: Feature Toggles (aka Feature Flags)", url: "https://martinfowler.com/articles/feature-toggles.html", kind: "article", verifiedAt: "2026-10-02T11:47:43Z" },
        { label: "Microsoft Learn: Feature management in Azure App Configuration", url: "https://learn.microsoft.com/en-us/azure/azure-app-configuration/concept-feature-management", kind: "docs", verifiedAt: "2026-10-02T11:49:23Z" },
      ],
      video: {
        title: "White-label 101: What is white-label?",
        channel: "Vendasta",
        url: "https://www.youtube.com/watch?v=LAziHCAuntE",
        videoId: "LAziHCAuntE",
        verifiedAt: "2026-10-02T12:00:21Z",
      },
      alternateVideos: [
        {
          title: "What are Feature Flags?",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=AJa2B-twtG4",
          videoId: "AJa2B-twtG4",
          verifiedAt: "2026-10-02T12:00:22Z",
        },
      ],
      handbook: { rules: ["configuration-vs-customisation"] },
      sections: [
        {
          heading: "The three layers, with examples",
          body:
            "**Branding (setup):** app name and short name, icon, splash screen, colours, fonts, email templates' logo. See [[term:brand-kit]].\n\n**[[term:configuration]] (setup, no code):**\n- languages and currencies the core already supports;\n- cities, zones, tax and commission values;\n- which payment gateway or SMS provider, from those the core already integrates;\n- features switched on or off with a [[term:feature-toggle]];\n- content: banners, terms pages, FAQ text.\n\n**[[term:customisation]] (code, scope change):**\n- a new screen, field, report or flow;\n- a payment gateway or SMS provider the core does not integrate;\n- a language the core does not support, especially right-to-left if the core has never shipped one;\n- changing how an existing feature behaves for this client only.",
        },
        {
          heading: "Toggles are not free either",
          body:
            "Martin Fowler sorts feature toggles into release, ops, experiment and permission toggles. A per-client switch (\"loyalty on for client A, off for client B\") is a **permission toggle**, and those live for years.\n\nEvery toggle doubles the paths that have to be tested. A core with twenty client-specific toggles has many combinations nobody has tried. So when a client's need can only be met by adding a new toggle to the core, that is still code. It is a product decision for the core team and a [[term:customisation]] for the client, not configuration.\n\nRule of thumb: switching an **existing** toggle is configuration; **creating** a toggle is development.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label tutoring marketplace rebranded for an education company in Saudi Arabia.**\n\nIn the requirement call the client lists eight wishes. The PM answers none of them on the call, writes them down, then checks each with the tech lead against the product:\n\n1. Arabic and English: the core supports both, so configuration.\n2. Prices in SAR with VAT: supported settings, so configuration.\n3. Their own logo and green theme: branding.\n4. Hide the group-class feature: an existing toggle, so configuration.\n5. A local payment gateway the core already integrates: configuration, once the client gives the keys.\n6. A different local payment gateway the core does not integrate: customisation.\n7. Tutor ID verification with a national ID check: a new flow, so customisation.\n8. \"Move the search bar to the top\": a layout change, so customisation, even though it sounds small.\n\nThe PM sends the list back in writing with the three layers marked, and items 6 to 8 go to the gap analysis for an estimate. The client knows what is included before anyone writes code.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Saying \"yes, that's configurable\" on the call.** Recover: send a written correction quickly. It is much cheaper to correct a promise in week one than in UAT.\n- **Letting a developer \"just do it\" in the client's copy.** Recover: log it, get it estimated, and decide with the tech lead whether it becomes a [[term:custom-module]] or a core feature.\n- **Treating a new language as configuration.** If the core already ships it, it is. If it needs new translations, right-to-left layouts or new fonts, much of it is work.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Every client wish is written down before I answer it.\n2. For each wish I asked: can it be done in settings or the admin panel today, without code?\n3. Existing toggles switched = configuration. New toggles, screens, fields, flows or integrations = customisation.\n4. Customisations go to the gap analysis, with no promise of price or date on the call.\n5. The client has the three-layer list in writing.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b01-what-can-change-q1",
          prompt: "Which of these is configuration rather than customisation?",
          options: [
            "Switching off the core's existing wallet feature for this client",
            "Adding a field for a national ID number to the sign-up screen",
            "Integrating a payment gateway the core does not support",
            "Changing the order of checkout steps for this client only",
          ],
          correctIndex: 0,
          explanation: "Turning an existing feature off uses a toggle the product already has. A new field, a new integration and a changed flow all need code.",
        },
        {
          id: "pmp-b01-what-can-change-q2",
          prompt: "Which of these can normally be done without writing code? (Select all that apply.)",
          options: [
            "Setting the currency to a currency the core already supports",
            "Uploading the client's logo and setting their brand colours",
            "Adding delivery zones for a new city in the admin panel",
            "Adding a new report the core does not have",
            "Changing the layout of the home screen",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Supported settings, branding and admin-panel data are configuration. New reports and layout changes need development.",
        },
        {
          id: "pmp-b01-what-can-change-q3",
          prompt: "During the demo the client says, \"Can you just move the search bar to the top? Tiny change.\" What is it?",
          options: [
            "Customisation: it changes the layout in code, however small it sounds",
            "Configuration: it is only a position on the screen",
            "Branding: it is a visual change",
            "A bug: the search bar is in the wrong place",
          ],
          correctIndex: 0,
          explanation: "Moving UI elements changes code that must then be kept through every core upgrade. \"Tiny\" describes the effort, not the layer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b01-what-can-change-q4",
          prompt: "The client needs a loyalty feature to be on for them only. The core has no loyalty feature and no toggle for it. What do you tell the client?",
          options: [
            "It is new development, so it goes to the gap analysis for an estimate before anything is promised",
            "It is configuration, because it will be switched on with a toggle",
            "It is included because toggles are part of setup",
            "It cannot be done in a white-label product",
          ],
          correctIndex: 0,
          explanation: "Creating a feature, and the toggle that controls it, is code. Only switching an existing toggle is configuration.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b01-what-can-change-q5",
          prompt: "Why do many per-client feature toggles become a cost even if each one was cheap to add?",
          options: [
            "Each toggle adds code paths and combinations that must be tested and maintained for years",
            "Toggles slow down the store review",
            "Toggles can only be changed by the client",
            "Toggles stop working after a core upgrade",
          ],
          correctIndex: 0,
          explanation: "Per-client toggles are long-lived permission toggles. Their testing and maintenance cost grows with every combination.",
        },
        {
          id: "pmp-b01-what-can-change-q6",
          prompt: "A client asks for their app in Urdu. The core ships English and Arabic only. Which statement is most accurate?",
          options: [
            "It needs development work, such as translations, right-to-left checks and possibly fonts, so it goes to the gap analysis",
            "It is configuration because the core supports right-to-left",
            "It is branding because it changes the text",
            "It is free because language is part of setup",
          ],
          correctIndex: 0,
          explanation: "A language the core does not ship needs translations and testing even if RTL layout exists. Only languages the core already supports are configuration.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b01-what-can-change-q7",
          prompt: "Why is the layer of a change a commercial question, not only a technical one?",
          options: [
            "The price was based on the product as it is, so customisation treated as configuration is unpaid work and future upgrade cost",
            "Because the stores charge more for customised apps",
            "Because configuration is always billed by the hour",
            "It is not commercial; developers decide",
          ],
          correctIndex: 0,
          explanation: "Setup covers branding and configuration. Customisation changes scope and must be estimated and approved.",
        },
        {
          id: "pmp-b01-what-can-change-q8",
          prompt: "What is the best way to answer a list of eight wishes from a requirement call? (Select all that apply.)",
          options: [
            "Write them all down and confirm the layer of each with the tech lead",
            "Send the client a written list marking branding, configuration and customisation",
            "Send customisations to the gap analysis for estimates",
            "Confirm on the call that everything is included, to keep the deal warm",
            "Let developers decide in the build which ones to do",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Capture, check, confirm in writing and estimate the gaps. Promising on the call or deciding during the build creates disputes later.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A new account manager drafted this email to a white-label client after the demo. Mark every sentence that promises something it should not, or puts a change in the wrong layer.",
        segments: [
          { id: "s1", text: "Thanks for your time today. It was great to show you the delivery app.", issue: null },
          { id: "s2", text: "Your logo, app name and brand colours will be applied as part of setup.", issue: null },
          { id: "s3", text: "Arabic and English are both supported out of the box, so both are included.", issue: null },
          { id: "s4", text: "Adding the extra Kurdish language is just configuration, so no extra cost.", issue: "A language the core does not ship needs translations and testing, so it is customisation for the gap analysis." },
          { id: "s5", text: "We will switch off the tipping feature for you, as you asked.", issue: null },
          { id: "s6", text: "The new loyalty points feature can be turned on with a toggle, so it is included in setup.", issue: "The core has no loyalty feature. Creating it and its toggle is development, not configuration." },
          { id: "s7", text: "Moving the search bar to the top is a tiny change, so our developers will just do it in your copy.", issue: "A layout change is customisation, and editing the client's copy directly creates a fork." },
          { id: "s8", text: "Your delivery zones and fees can be set in the admin panel.", issue: null },
          { id: "s9", text: "Anything that needs new development will be listed in a gap analysis with an estimate for your approval.", issue: null },
          { id: "s10", text: "We will send you the brand-kit checklist tomorrow.", issue: null },
        ],
        askExplanation: true,
      },
    },
  ],
} satisfies Module;
