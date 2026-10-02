import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-b06",
  trackId: "pm",
  name: "White-label lifecycle: Configuration & custom modules",
  description:
    "Setting up a client instance from recorded configuration rather than code edits, and running every approved custom module as its own change request, with clear code ownership and upgrade cost.",
  topics: [
    {
      id: "pmp-b06-configuration-setup",
      moduleId: "pmp-b06",
      trackId: "pm",
      title: "Setting up a client's configuration",
      summary:
        "Configuration is where a white-label instance comes to life: the brand is applied, business settings are entered, toggles are switched and the client's provider keys are connected. Done well, it is repeatable, recorded and survives every [[term:core-upgrade]]. Done badly, it lives in one developer's head and in edited code.\n\nWhy it matters at an agency: you will run many instances of the same product. If each client's setup is a list of values kept apart from the code, a new client is quick, an upgrade is safe and a new team member can rebuild the instance. The Twelve-Factor App principle says the same thing: keep config strictly separate from code.\n\nHow it usually works. Mobile apps get their identity at build time: on Android, a product flavor sets each client's [[term:package-name]] and its own icons, strings and colours; on iOS, build configuration files and separate targets or schemes do the same, including the [[term:bundle-id]]. Business settings (zones, taxes, toggles, content) live at runtime in the [[term:configuration-panel]] or server config. Secrets such as [[term:api-keys]] live in a secure store, never in the code repository or chat.\n\nAs PM you do not configure, but you own the record: what was set, where, by whom and when, and that the client confirmed it. Follow the Oyelabs rule in the handbook card below for what setup includes.\n\nThe common mistake is \"just hard-code it for this client\". A value typed into shared code is a hidden [[term:customisation]], and it will be overwritten or conflict at the next upgrade.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "The Twelve-Factor App: III. Config", url: "https://12factor.net/config", kind: "spec", verifiedAt: "2026-10-02T11:47:57Z" },
        { label: "Android Developers: Configure build variants (product flavors)", url: "https://developer.android.com/build/build-variants", kind: "docs", verifiedAt: "2026-10-02T11:48:46Z" },
        { label: "Apple Developer: Adding a build configuration file to your project", url: "https://developer.apple.com/documentation/xcode/adding-a-build-configuration-file-to-your-project", kind: "docs", verifiedAt: "2026-10-02T11:46:19Z" },
        { label: "OpenFeature: Introduction", url: "https://openfeature.dev/docs/reference/intro", kind: "docs", verifiedAt: "2026-10-02T11:54:07Z" },
      ],
      video: {
        title: "App White Labeling Made Easy with Codemagic | Step-by-Step Guide and Demo",
        channel: "Codemagic",
        url: "https://www.youtube.com/watch?v=nW66iben5zQ",
        videoId: "nW66iben5zQ",
        verifiedAt: "2026-10-02T12:00:41Z",
      },
      alternateVideos: [
        {
          title: "Feature Flags Explained in 6 Minutes. What Are Feature Flags? (Feature Toggles)",
          channel: "CoderDave",
          url: "https://www.youtube.com/watch?v=c8KgKTgyFUE",
          videoId: "c8KgKTgyFUE",
          verifiedAt: "2026-10-02T12:00:40Z",
        },
      ],
      handbook: { stages: ["wl-configuration"], rules: ["configuration-vs-customisation", "secure-credential-sharing"], templates: ["whitelabel-onboarding"] },
      sections: [
        {
          heading: "Three places a setting can live",
          body:
            "- **Build time (needs a new app build):** app name, icon, splash screen, [[term:bundle-id]] and [[term:package-name]], app-level colours and fonts. On Android these come from the client's product flavor, whose own resources override the shared ones. On iOS they come from build configuration files and the client's target or scheme. Changing them means a new build and, for the stores, a new review.\n- **Runtime (no new build):** zones, fees, taxes, languages switched on, feature toggles, banners, terms text. Set in the [[term:configuration-panel]] or server config, and can change on a live app.\n- **Secrets:** payment, SMS, email and maps [[term:api-keys]]. Kept in a secure store or environment, shared through the approved channel.\n\nWhy you care: a client asking to \"change the app name tomorrow\" is asking for a build and a store review. A client asking to \"change the delivery fee tomorrow\" is asking for an admin-panel edit.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label grocery app for a supermarket group in Oman, configuration week.**\n\nThe brand kit and the gap analysis are approved and the hosting account is ready. The PM runs setup from the onboarding sheet:\n\n1. **Build identity:** the developers create the client's Android flavor and iOS target with the agreed bundle ID and package name, the icon and splash from the brand kit, and the app name and short name.\n2. **Runtime settings:** the client's ops lead and the PM fill the admin panel together on a call: Muscat and Sohar zones, fees, OMR, VAT, Arabic and English, wallet on, tipping off.\n3. **Secrets:** the client shares payment and SMS keys through the approved secure tool. The tech lead stores them; nobody pastes them in chat.\n4. **Record:** the PM updates the instance record with every value, where it lives and the date.\n5. **Confirm:** a short walkthrough of the configured app on staging, and the client confirms the settings in writing.\n\nWhen the client asks a week later to add a new city, everyone knows it is a runtime change, done in minutes, with no build.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Values hard-coded in shared code.** Recover: ask the tech lead to move them into the client's flavor, config or admin panel, and log what was moved.\n- **No configuration record.** Recover: rebuild it from the admin panel and build settings now, before an upgrade or a team change exposes the gap.\n- **Secrets in the repository or chat.** Recover: rotate them and move them to the secure store.\n- **Client changing settings without telling anyone.** Recover: agree who may change what in the admin panel, and record changes.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Entry conditions met: brand kit received, gap analysis approved, hosting ready.\n2. Build identity set per client (flavor or target, bundle ID and package name, icon, name).\n3. Runtime settings entered in the admin panel or server config, not in code.\n4. Secrets in the secure store only.\n5. Every value recorded in the instance record, with date and owner.\n6. Client walked through the configured app and confirmed in writing.",
        },
      ],
      sop: [
        {
          title: "Configuration record",
          prompt: "[Oyelabs SOP – admin to fill] The template and location of the per-instance configuration record, and who on the Oyelabs side may change a client's production settings.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b06-configuration-setup-q1",
          prompt: "What is the main idea of the Twelve-Factor rule on config?",
          options: [
            "Keep configuration strictly separate from code, so the same code runs for every client with different settings",
            "Put every setting inside the code so it is versioned",
            "Store config in the app's store listing",
            "Let each developer keep their own settings file",
          ],
          correctIndex: 0,
          explanation: "Config that varies per deployment (or per client) belongs outside the code. That is what makes one codebase serve many instances.",
        },
        {
          id: "pmp-b06-configuration-setup-q2",
          prompt: "The client wants to change the app's name tomorrow. What does that involve?",
          options: [
            "A new app build and a new store review, because the name is set at build time",
            "An admin-panel edit that is live in minutes",
            "Nothing; the stores update the name automatically",
            "A change to the core product for all clients",
          ],
          correctIndex: 0,
          explanation: "App name and icon are part of the build and the store listing. They need a build and review, so \"tomorrow\" is not realistic.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b06-configuration-setup-q3",
          prompt: "Which of these are normally runtime settings that can change without a new build? (Select all that apply.)",
          options: [
            "Delivery fees and zones",
            "Switching an existing feature toggle",
            "Banner text in the app",
            "The app icon",
            "The bundle ID",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Business settings, toggles and content are runtime. Icon and bundle ID are fixed in the build.",
        },
        {
          id: "pmp-b06-configuration-setup-q4",
          prompt: "On Android, what lets one codebase produce a separately branded app for each client?",
          options: ["Product flavors", "Feature graphics", "Adaptive icons", "Closed testing tracks"],
          correctIndex: 0,
          explanation: "Each flavor can set its own application ID and resources such as logos, strings and colours, overriding the shared ones.",
        },
        {
          id: "pmp-b06-configuration-setup-q5",
          prompt: "A developer suggests \"just hard-coding\" one client's tax rate in the shared checkout code. Why push back?",
          options: [
            "It is a hidden customisation in shared code: it can affect other clients and will conflict or be lost at the next upgrade",
            "Tax rates must be approved by the stores",
            "Hard-coding is slower to run",
            "There is no reason to push back",
          ],
          correctIndex: 0,
          explanation: "Per-client values in shared code break the separation between core and instance. They belong in the client's configuration.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b06-configuration-setup-q6",
          prompt: "Where should the client's payment gateway keys be kept?",
          options: [
            "In a secure store or environment, shared through the approved secure channel",
            "In the code repository, so builds always have them",
            "In the project chat, pinned for easy access",
            "In the configuration record spreadsheet",
          ],
          correctIndex: 0,
          explanation: "Secrets never go in code, chat or ordinary documents. The record notes that a key exists and where, not its value.",
        },
        {
          id: "pmp-b06-configuration-setup-q7",
          prompt: "What must be true before configuration starts? (Select all that apply.)",
          options: [
            "The brand kit is received",
            "The gap analysis is approved",
            "The hosting account is ready",
            "The app is approved in both stores",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "These are the stage's entry criteria. Store approval comes much later.",
        },
        {
          id: "pmp-b06-configuration-setup-q8",
          prompt: "Two months after launch, nobody can say which settings were changed for a client. What should have prevented this?",
          options: [
            "A configuration record with each value, where it lives, who set it and when, plus agreed rules on who may change settings",
            "More developers on the project",
            "Weekly store submissions",
            "Hard-coding the settings so they cannot change",
          ],
          correctIndex: 0,
          explanation: "A record and change rules make the instance reproducible and auditable. Hard-coding would make things worse.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "You are writing the configuration record for a white-label grocery app. For each item, say where it should live.",
        categories: [
          { id: "build", label: "Build time (flavor or target, needs a new build)" },
          { id: "runtime", label: "Runtime (admin panel or server config)" },
          { id: "secret", label: "Secret (secure store, never in code or chat)" },
        ],
        items: [
          { id: "k1", text: "The app's bundle ID and package name", explanation: "Fixed per build and per store listing." },
          { id: "k2", text: "The app icon and splash screen", explanation: "Bundled into the build from the client's flavor or target." },
          { id: "k3", text: "Delivery zones and fees for each city", explanation: "Business data the admin can change on a live app." },
          { id: "k4", text: "The payment gateway's live secret key", explanation: "A secret: secure store only." },
          { id: "k5", text: "Wallet feature on, tipping off", explanation: "Existing toggles switched at runtime." },
          { id: "k6", text: "VAT rate", explanation: "A business setting in the admin panel or server config." },
          { id: "k7", text: "The SMS provider's API token", explanation: "A secret credential." },
          { id: "k8", text: "The app's display name under the icon", explanation: "Part of the build's identity." },
          { id: "k9", text: "Home-screen promotional banner", explanation: "Content managed at runtime." },
          { id: "k10", text: "The maps API key restricted to the client's app", explanation: "A key: handled as a secret, even if it is restricted." },
        ],
        answer: { k1: "build", k2: "build", k3: "runtime", k4: "secret", k5: "runtime", k6: "runtime", k7: "secret", k8: "build", k9: "runtime", k10: "secret" },
      },
    },
    {
      id: "pmp-b06-custom-modules-as-crs",
      moduleId: "pmp-b06",
      trackId: "pm",
      title: "Custom modules as change requests",
      summary:
        "Every approved gap that needs code becomes a [[term:custom-module]], and every custom module should run as its own [[term:change-request]]. That is true at the first gap analysis and it stays true for every request after launch.\n\nWhy a separate CR per module? Because each module has its own scope, estimate, price, timeline and long-term cost. Lumped together, one disputed module stalls the rest, and nobody can say later what the client paid for or what has to be carried through each [[term:core-upgrade]].\n\nThe CR for a custom module follows the normal change control path: submission, impact assessment on scope, time and cost, approval or rejection, then implementation and records. For white label it must also answer three questions the client and the team will need later:\n\n1. **Where does the code live?** A separate module beside the core (preferred), a change inside core code (avoid), or a candidate for the [[term:core-product]] roadmap.\n2. **Who owns the code?** The client, Oyelabs, or Oyelabs with a licence to the client. This depends on the contract.\n3. **What is the upgrade cost?** What each future core release will need for this module.\n\nFollow the Oyelabs rules in the handbook cards below for when a CR is needed and who approves it. Use the decision tool to check that a request really is a change before raising one.\n\nThe common mistake is building the module first and writing the CR later, \"because the client already agreed on the call\". Without written approval you have an unpaid module and a permanent upgrade cost.",
      level: "advanced",
      estMinutes: 45,
      isMilestone: true,
      webRefs: [
        { label: "Microsoft Learn: Extend Dynamics 365 apps without compromising performance", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/extend-your-solution", kind: "docs", verifiedAt: "2026-10-02T11:48:54Z" },
        { label: "Asana: Change control process", url: "https://asana.com/resources/change-control-process", kind: "article", verifiedAt: "2026-10-02T11:56:24Z" },
        { label: "Atlassian: IT change management, ITIL framework", url: "https://www.atlassian.com/itsm/change-management", kind: "article", verifiedAt: "2026-10-02T11:52:57Z" },
        { label: "Wikipedia: Change request", url: "https://en.wikipedia.org/wiki/Change_request", kind: "article", verifiedAt: "2026-10-02T11:56:59Z" },
      ],
      video: {
        title: "What is a CHANGE REQUEST? PMBOK Key Concepts in Project Management",
        channel: "David McLachlan",
        url: "https://www.youtube.com/watch?v=ZdpoQLfiznQ",
        videoId: "ZdpoQLfiznQ",
        verifiedAt: "2026-10-02T12:00:41Z",
      },
      alternateVideos: [
        {
          title: "How to Control Change Requests on Projects - Project Management Training",
          channel: "ProjectManager",
          url: "https://www.youtube.com/watch?v=WWdgFFVkPgA",
          videoId: "WWdgFFVkPgA",
          verifiedAt: "2026-10-02T12:00:42Z",
        },
      ],
      handbook: { stages: ["wl-configuration"], rules: ["cr-when-needed", "cr-approval", "core-upgrade-custom-impact"], templates: ["cr-form"] },
      interactive: { kind: "decision-tool", request: "Our app is live. Can you add a page where restaurant owners see their weekly sales? The core product doesn't have one." },
      sections: [
        {
          heading: "What a white-label CR adds to a normal CR",
          body:
            "Use the standard CR form. In white label, make sure these parts are explicit:\n\n- **Classification:** [[term:customisation]] of an existing feature, or [[term:new-feature]]. Use the decision tool when unsure.\n- **Design:** built as a separate module, or as an edit to core code, and why.\n- **Code ownership:** what the contract says. If it is not clear, ask BD before the CR goes out.\n- **Upgrade impact:** what each future core release will need, in plain words, for example \"retest the module and adjust if the core order flow changes\".\n- **Core roadmap:** whether the product team might adopt it. Never promise it.\n- **Store impact:** whether the module changes the app enough to need a new store review.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label food-delivery app in Kuwait, live for three months.** The client asks for a dashboard where restaurant owners see their weekly sales.\n\n1. **Classify.** The PM runs it through the decision tool: the app is live, the core has no such dashboard, it is new behaviour. *New feature*, so a CR.\n2. **Estimate.** The tech lead designs it as a separate module that reads order data through the core's existing interfaces, without editing core code: 48 hours of development, 16 of QA, 6 of PM.\n3. **Write the CR.** The form lists the description and business value (owners stop asking support for reports), classification, scope, effort, timeline (three weeks, no change to any existing milestone), the price from BD, assumptions (weekly totals only, no exports), risks, code ownership as per the contract, and the upgrade impact (retest after each core release that changes order data).\n4. **Approve.** The client sponsor approves in writing. Only then does the module enter the sprint.\n5. **Record.** The module is added to the client's customisation register.\n\nThree months later, a core upgrade changes order statuses. Because the module is separate and its upgrade impact was written down, the fix is planned, quoted and small.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Several modules in one CR.** Recover: split them, so each can be approved, declined or phased on its own.\n- **No upgrade-impact line.** Recover: add it now and tell the client; it sets expectations for every future upgrade.\n- **Building before approval.** Recover: pause, send the CR, and continue only after written approval from the named approver.\n- **Editing core code to save time.** Recover: ask the tech lead whether it can be moved into a separate module, and quote the move if it is worth it.\n- **Code ownership left vague.** Recover: check the contract with BD and state it in the CR.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Request checked with the decision tool and classified.\n2. One CR per custom module.\n3. Separate module preferred over core edits, with the reason recorded.\n4. CR states effort, price, timeline, assumptions, risks, code ownership and upgrade impact.\n5. Written approval from the named approver before any work.\n6. Module added to the client's customisation register.",
        },
      ],
      sop: [
        {
          title: "Custom module code ownership",
          prompt: "[Oyelabs SOP – admin to fill] Oyelabs' standard position on who owns custom-module code in white-label contracts, and when a module may be offered to the core product.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b06-custom-modules-as-crs-q1",
          prompt: "Why should each custom module have its own change request?",
          options: [
            "Each has its own scope, price, timeline and upgrade cost, and can be approved or declined on its own",
            "Because the stores review each CR",
            "Because CR forms have a page limit",
            "It does not matter; one CR is fine for everything",
          ],
          correctIndex: 0,
          explanation: "Separate CRs keep decisions independent and visible, and show what must be carried through each upgrade.",
        },
        {
          id: "pmp-b06-custom-modules-as-crs-q2",
          prompt: "Which questions should a white-label CR answer beyond a normal CR? (Select all that apply.)",
          options: [
            "Where the code lives: separate module or core edit",
            "Who owns the code under the contract",
            "What each future core upgrade will need for this module",
            "Which developer's laptop it was built on",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Location, ownership and upgrade impact matter for the client's whole life on the product. Laptops do not.",
        },
        {
          id: "pmp-b06-custom-modules-as-crs-q3",
          prompt: "The client said yes to a module on a call, and a developer has started building. There is no written approval. What do you do?",
          options: [
            "Pause, send the CR, and continue only after written approval from the named approver",
            "Let them finish and send the invoice",
            "Treat the call as approval and record it in the MoM",
            "Stop the module permanently",
          ],
          correctIndex: 0,
          explanation: "A verbal yes is not approval. Pausing briefly protects against an unpaid module and a disputed invoice.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b06-custom-modules-as-crs-q4",
          prompt: "What are the usual steps of change control?",
          options: [
            "Submission, impact assessment, approval or rejection, then implementation and records",
            "Build, test, invoice, then ask for approval",
            "Approval, build, then estimate",
            "Estimate, build, then submission",
          ],
          correctIndex: 0,
          explanation: "Impact and approval come before any build. Records close the loop.",
        },
        {
          id: "pmp-b06-custom-modules-as-crs-q5",
          prompt: "A client asks whether their module will \"become part of the product for everyone\". What is the honest answer?",
          options: [
            "Only the product team decides the core roadmap; you can propose it, but it is not promised",
            "Yes, all modules go into the core",
            "No, modules are never added to the core",
            "Yes, if they pay extra",
          ],
          correctIndex: 0,
          explanation: "The PM can raise it with the product team but cannot commit the core roadmap.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b06-custom-modules-as-crs-q6",
          prompt: "Why write an upgrade-impact line in the CR?",
          options: [
            "So the client knows in advance that future core releases may need work on this module, and how that is handled",
            "Because the stores ask for it",
            "To make the CR longer",
            "It is only for internal use and never shown to the client",
          ],
          correctIndex: 0,
          explanation: "Upgrade work on custom code is a cost the client will meet again. Saying so up front avoids surprises.",
        },
        {
          id: "pmp-b06-custom-modules-as-crs-q7",
          prompt: "A client's request turns out to be a real defect in the core's existing behaviour. What should happen?",
          options: [
            "Log it as a bug, not a CR; it is fixed as a bug under the applicable rule",
            "Raise a CR and charge for it",
            "Build a custom module to work around it",
            "Ignore it until the next upgrade",
          ],
          correctIndex: 0,
          explanation: "CRs are for changes. A defect against agreed behaviour is a bug and is handled under the bug or warranty rules.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b06-custom-modules-as-crs-q8",
          prompt: "Which of these belong in a custom-module CR? (Select all that apply.)",
          options: [
            "Effort estimate and price",
            "Timeline impact",
            "Assumptions and exclusions",
            "Risks",
            "The client's store password",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "These are standard CR sections. Credentials never go in a CR.",
        },
        {
          id: "pmp-b06-custom-modules-as-crs-q9",
          prompt: "Code ownership for the module is not clear in the contract. What do you do before sending the CR?",
          options: [
            "Check with BD and state the position in the CR",
            "Leave the ownership line out",
            "Write that the client owns everything",
            "Write that Oyelabs owns everything",
          ],
          correctIndex: 0,
          explanation: "Ownership is a contractual matter. BD confirms it, and the CR states it so there is no later surprise.",
        },
      ],
      practice: {
        kind: "form",
        variant: "cr",
        templateId: "cr-form",
        prompt:
          "Write the change request for this custom module from the client's email and the tech lead's notes.",
        context:
          "Client email (Hussain, operations director, the approver named in the contract): \"Restaurant owners keep asking support for their weekly sales. Can you add a page in the restaurant app where they see sales per week? Need it before Ramadan.\"\n\nTech lead notes: the core has no such page. Build as a separate module reading order data through existing core interfaces, no core edits. Dev 48 h, QA 16 h, PM 6 h. Weekly totals and order count only, no export. Needs retest after any core release that changes order data. Three weeks from approval; no existing milestone moves. Code ownership: per contract (BD to confirm).",
        fields: [
          { id: "title", label: "CR title", input: "text", required: true },
          { id: "description", label: "Description of the change", input: "textarea", required: true },
          { id: "classification", label: "Classification", input: "select", options: ["Bug", "Clarification", "Change request: new feature", "Configuration"], required: true },
          { id: "design", label: "Where the code lives", input: "select", options: ["Separate custom module", "Edit inside core code", "Admin-panel setting"], required: true },
          { id: "effort", label: "Total effort (hours, all roles)", input: "number", required: true },
          { id: "timeline", label: "Impact on timeline and milestones", input: "textarea", required: true },
          { id: "assumptions", label: "Assumptions and exclusions", input: "textarea", required: true },
          { id: "upgrade", label: "Upgrade impact", input: "textarea", required: true },
          { id: "approver", label: "Client approver", input: "text", required: true },
        ],
        checks: [
          { fieldId: "classification", expected: "Change request: new feature" },
          { fieldId: "design", expected: "Separate custom module" },
          { fieldId: "effort", expected: 70 },
        ],
        rubric: [
          { label: "Scope is precise and bounded", points: 3, description: "States weekly sales totals and order count per restaurant, and excludes exports and other reports." },
          { label: "Upgrade impact explained for the client", points: 2, description: "Says the module needs a retest, and possibly a fix, after core releases that change order data, and that this is planned and quoted." },
          { label: "Timeline is honest", points: 2, description: "Three weeks from written approval, no existing milestone moves, and links the Ramadan need to an approval date." },
          { label: "Approval before work", points: 1, description: "Names Hussain as approver and says work starts only after written approval." },
        ],
        sampleAnswer: {
          title: "CR: Weekly sales page for restaurant owners",
          description: "Add a page in the restaurant app that shows each restaurant owner their sales total and order count per week. Built as a separate module that reads order data from the existing product.",
          classification: "Change request: new feature",
          design: "Separate custom module",
          effort: "70",
          timeline: "Three weeks from written approval. No existing milestone moves. To be live before Ramadan, we need approval by the 10th.",
          assumptions: "Weekly totals and order count only. No export, no daily view, no other reports. Uses existing order data; no change to how orders work. Code ownership as per the contract.",
          upgrade: "When a future core release changes order data, this module will need a retest and possibly a small fix. We will tell you in advance and quote any work.",
          approver: "Hussain, operations director",
        },
      },
    },
  ],
} satisfies Module;
