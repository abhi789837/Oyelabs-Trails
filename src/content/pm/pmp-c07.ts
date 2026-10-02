import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-c07",
  trackId: "pm",
  name: "Terminology: White-label terms",
  description:
    "The white-label words that decide price, ownership and upgrade cost: white-label vs private label vs reseller, single- vs multi-tenant, client instance vs client fork, and who owns the store, cloud and code accounts.",
  topics: [
    {
      id: "pmp-c07-whitelabel-reseller-private",
      moduleId: "pmp-c07",
      trackId: "pm",
      title: "White-label vs private label vs reseller",
      summary:
        "Three deal words that clients use loosely: [[term:white-label]], [[term:private-label]] and [[term:reseller]]. They describe different relationships. White-label is about **the product**: one core, rebranded per client. Private label is about **exclusivity**: the client wants the product, or the niche, to themselves. Reseller is about **the channel**: someone sits between Oyelabs and the end client and owns that relationship.\n\nWhy it matters at an agency. The word in the first call shapes everything after it. A client who says \"private label\" may mean \"nobody else in Doha gets this app\", which is a commercial promise Oyelabs may not be able to give. A reseller deal changes who approves, who pays, who supports end users and whose name goes on the store account. Getting the word wrong early means re-negotiating later.\n\nHow to do it. In the demo call, ask what the client actually means: their brand on the product (white-label), exclusivity of some kind (private label), or selling it on to their own customers (reseller). Write the answer in the MoM. Then check what Oyelabs offers for that model in the handbook and the contract, rather than agreeing on the call.\n\nThe common mistake is treating any of them as a [[term:customisation|custom build]] in disguise. A white-label client buys the [[term:core-product]] plus [[term:configuration]]. Changes beyond that are priced separately, whichever word the client used.\n\nNot legal advice: the signed contract always wins.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Apple Developer: App Review Guidelines", url: "https://developer.apple.com/app-store/review/guidelines/", kind: "spec", verifiedAt: "2026-10-02T11:55:06Z" },
        { label: "Investopedia: White label products", url: "https://www.investopedia.com/terms/w/white-label-product.asp", kind: "article", verifiedAt: "2026-10-02T11:52:03Z" },
        { label: "Shopify: Private label products", url: "https://www.shopify.com/blog/private-label", kind: "article", verifiedAt: "2026-10-02T12:05:19Z" },
        { label: "Shopify: White label products", url: "https://www.shopify.com/blog/white-label-products", kind: "article", verifiedAt: "2026-10-02T12:05:20Z" },
      ],
      video: {
        title: "White Label vs. Private Label - What’s the difference?",
        channel: "Women's Business Link",
        url: "https://www.youtube.com/watch?v=phzkv3iJmmI",
        videoId: "phzkv3iJmmI",
        verifiedAt: "2026-10-02T12:17:34Z",
      },
      alternateVideos: [
        {
          title: "What is White Label? Products, Software, and More",
          channel: "Vendasta",
          url: "https://www.youtube.com/watch?v=AYmcCfQgIPg",
          videoId: "AYmcCfQgIPg",
          verifiedAt: "2026-10-02T12:17:34Z",
        },
        {
          title: "White-Label Software Explained: How Does It Actually Work?",
          channel: "SaaS Yaari",
          url: "https://www.youtube.com/watch?v=X3Fqxa84LQ8",
          videoId: "X3Fqxa84LQ8",
          verifiedAt: "2026-10-02T12:17:34Z",
        },
      ],
      handbook: { stages: ["wl-demo-call"], rules: ["configuration-vs-customisation", "client-owned-store-accounts"], templates: ["whitelabel-onboarding"] },
      sections: [
        {
          heading: "Side by side: product, exclusivity, channel",
          body:
            "Each word answers a different question, and changes something different for the PM.\n\n- **[[term:white-label|White-label]]:** *whose brand is on it?* The client's, on Oyelabs' [[term:core-product]]. The PM runs [[term:rebranding]], [[term:theming]] and [[term:configuration]] on a new [[term:client-instance]]. Oyelabs keeps the core.\n- **[[term:private-label|Private label]]:** *does anyone else get it?* Some exclusivity: a niche, a territory, or a dedicated set-up. The PM must not promise exclusivity on a call. It is a contract term with a price.\n- **[[term:reseller|Reseller]]:** *who sells it to the end client?* A partner who owns the end-client relationship. The PM has two clients in practice: the reseller (who approves and pays) and the end client (who uses it and owns its store accounts).\n\nThey combine. A UK agency can resell a white-label booking app to three of its clients, one of which asks for private-label exclusivity in its city. Each word adds its own question.",
        },
        {
          heading: "What changes in a reseller deal",
          body:
            "- **Approvals and money** usually go through the reseller. Estimates and [[term:change-request|CRs]] go to the reseller, not the end client, unless the contract says otherwise.\n- **Support** is often split: the reseller handles first-line questions; Oyelabs handles the product. Agree who does what before go-live.\n- **Store accounts** still belong to the end client, the provider of the app's content. Apple's Guideline 4.2.6 rejects template apps not submitted by the content provider. A reseller publishing all its clients' apps from its own account is the same problem as an agency doing it. See [[term:client-owned-accounts]].\n- **Communication**: agree whether Oyelabs ever speaks to the end client directly, and with the reseller present or not.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A white-label grocery app. A supermarket chain in Qatar joins a demo call and says: \"We want this as our private-label app.\"*\n\nThe PM does not take the word at face value. She asks: \"When you say private label, do you mean your brand on the app, or that no other grocer in Qatar can use the same product?\" The answer is both. The chain wants its brand, and it does not want a direct competitor in Doha on the same product.\n\nThe PM records in the MoM: white-label instance with full rebranding; the client has asked for territorial exclusivity. She does not agree to the exclusivity. She passes it to BD and leadership, because it is a commercial term with a price and a duration. Meanwhile the [[term:brand-kit]] checklist and account checklist go out, since they are needed either way.\n\nTwo weeks later the signed contract includes a time-limited exclusivity clause. The PM's onboarding notes match it word for word.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Agreeing to \"private label\" on a call.** Recover: write to the client that exclusivity is being reviewed commercially, and loop in BD.\n- **Treating the end client as the approver in a reseller deal.** Recover: re-route the estimate to the reseller and copy the agreed contacts.\n- **Letting the reseller publish from its own store account.** Recover: stop before submission and set up the end client's accounts.\n- **Calling a white-label deal \"custom\" internally.** The team then builds one-off code in the core. Recover: use the right word and send code changes through the configuration-vs-customisation rule below.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "- In the demo call I asked what the client means by the word they used, and recorded it.\n- Exclusivity requests go to BD and leadership; I never promise them.\n- In reseller deals I know who approves, who pays, who supports end users and whether I speak to the end client.\n- Store accounts are in the end client's name, whatever the channel.",
        },
      ],
      sop: [
        {
          title: "Reseller engagement model",
          prompt: "[Oyelabs SOP – admin to fill] Whether Oyelabs works with resellers, who supports the end client at each line, whether the PM may speak to end clients directly, and how reseller discounts and support boundaries are recorded.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c07-whitelabel-reseller-private-q1",
          prompt: "Which question does each word mainly answer? Pick the correct set.",
          options: [
            "White-label: whose brand is on it. Private label: does anyone else get it. Reseller: who sells it to the end client",
            "White-label: who sells it. Private label: whose brand. Reseller: who owns the code",
            "All three mean the client owns the source code",
            "White-label: exclusivity. Private label: the channel. Reseller: the brand",
          ],
          correctIndex: 0,
          explanation: "Product brand, exclusivity, and channel. The words combine, but each answers its own question.",
        },
        {
          id: "pmp-c07-whitelabel-reseller-private-q2",
          prompt: "A client on a demo call says: \"We want this as a private-label app, so no one else in Muscat can have it.\" What do you do?",
          options: [
            "Record the request, say exclusivity is a commercial term you will take to BD and leadership, and continue the demo",
            "Agree, since it is a common request",
            "Refuse, since Oyelabs never offers exclusivity",
            "Quote a price on the call",
          ],
          correctIndex: 0,
          explanation: "Exclusivity has a price and a duration and is decided commercially. Do not promise or refuse it on a call.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c07-whitelabel-reseller-private-q3",
          prompt: "In a reseller deal, who typically approves the CR for an end client's new feature?",
          options: ["The reseller, as Oyelabs' contracting client", "The end client's staff", "The Oyelabs developer", "Apple"],
          correctIndex: 0,
          explanation: "The reseller usually holds the contract and pays, so it approves, unless the contract says otherwise.",
        },
        {
          id: "pmp-c07-whitelabel-reseller-private-q4",
          prompt: "A reseller wants to publish all its end clients' apps from its own Apple account. What is the main problem?",
          options: [
            "Guideline 4.2.6: template apps must be submitted by the provider of the content, which is each end client",
            "Apple limits accounts to one app",
            "Resellers cannot have Apple accounts",
            "There is no problem",
          ],
          correctIndex: 0,
          explanation: "The guideline applies to the reseller just as it does to the agency. Each end client publishes from its own account.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c07-whitelabel-reseller-private-q5",
          prompt: "Which are normally part of a standard white-label instance? (Select all that apply.)",
          options: [
            "The client's logo, colours and app name",
            "Configuration through the panel and feature toggles",
            "A new module only this client needs, at no extra cost",
            "The client's own domain",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Rebranding, configuration and the client's domain are the instance. A client-only module is customisation, priced separately.",
        },
        {
          id: "pmp-c07-whitelabel-reseller-private-q6",
          prompt: "In a reseller deal, who usually handles an end user's question \"how do I reset my password\"?",
          options: [
            "The reseller's first-line support, if that is the agreed split",
            "Always the Oyelabs PM",
            "Apple support",
            "Nobody",
          ],
          correctIndex: 0,
          explanation: "Resellers typically own first-line support. Agree the split before go-live and write it down.",
        },
        {
          id: "pmp-c07-whitelabel-reseller-private-q7",
          prompt: "The internal team calls a white-label deal \"the custom project\" and starts editing core code for this client. What is the risk?",
          options: [
            "One-off code in the core blocks upgrades for every client; changes should go through the configuration-vs-customisation route",
            "There is no risk",
            "The client's logo will be wrong",
            "The store will reject the app for using custom code",
          ],
          correctIndex: 0,
          explanation: "The word drives behaviour. White-label means a shared core; client-only code must be a priced custom module, not an edit to the core.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c07-whitelabel-reseller-private-q8",
          prompt: "Which questions should you settle early in a reseller deal? (Select all that apply.)",
          options: [
            "Who approves and pays",
            "Who supports end users at each line",
            "Whether Oyelabs speaks to the end client directly",
            "Whose name the store accounts are in",
            "Which developer's laptop is used",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Approvals, support, communication and account ownership all change with a reseller in the middle.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt: "Classify each deal by the model it mainly describes.",
        categories: [
          { id: "white-label", label: "White-label (our product, their brand)" },
          { id: "private-label", label: "Private label (an exclusivity request)" },
          { id: "reseller", label: "Reseller (a partner sells to its own clients)" },
          { id: "custom", label: "Custom build (new software, built for them)" },
        ],
        items: [
          { id: "d1", text: "A start-up in Dubai wants our food-delivery product with its own name, colours and domain, live in eight weeks.", explanation: "The core product under the client's brand: white-label." },
          { id: "d2", text: "A UK digital agency wants to sell our booking app to its salon clients and handle their first-line support.", explanation: "A partner selling to its own customers: reseller." },
          { id: "d3", text: "A grocery chain asks that no other grocer in Qatar uses the same product for two years.", explanation: "The ask is exclusivity: private label." },
          { id: "d4", text: "A logistics firm wants a new route-planning platform designed around its own warehouse processes.", explanation: "New software for one client: a custom build." },
          { id: "d5", text: "A taxi operator in Kenya wants our ride-hailing product, rebranded, with its own fare settings.", explanation: "Rebranding plus configuration of the core: white-label." },
          { id: "d6", text: "An IT consultancy in Canada signs up to offer our school-management product to the schools it already serves.", explanation: "Selling on to its own clients: reseller." },
          { id: "d7", text: "A pharmacy chain wants the delivery app only on condition that we do not sell it to other pharmacies in its city.", explanation: "Exclusivity is the defining term: private label." },
          { id: "d8", text: "A clinic group wants a patient portal built from scratch with its own EHR integration.", explanation: "Bespoke software: a custom build." },
        ],
        answer: { d1: "white-label", d2: "reseller", d3: "private-label", d4: "custom", d5: "white-label", d6: "reseller", d7: "private-label", d8: "custom" },
      },
    },
    {
      id: "pmp-c07-tenancy-instance-fork",
      moduleId: "pmp-c07",
      trackId: "pm",
      title: "Single- vs multi-tenant, client instance vs fork",
      summary:
        "Four architecture words that every white-label PM needs, because they decide hosting cost, upgrade cost and what you can promise a client. [[term:single-tenant]] and [[term:multi-tenant]] describe **how instances are hosted**. [[term:client-instance]] and [[term:client-fork]] describe **how a client's copy relates to the [[term:core-product]] code**. They are two separate axes: a client can be single-tenant and still on the core code, or multi-tenant and never forked.\n\nWhy it matters at an agency. Clients ask for things like \"our own database in the EU\", \"upgrade us only after Ramadan\" or \"change this screen just for us\". Each of these is cheap on one model and expensive on another. A fork is the most expensive word of all: it makes one client's change easy today and every [[term:core-upgrade]] slow for years.\n\nHow to do it. Learn which model each Oyelabs product uses (the SOP block below). When a client asks for isolation, data location or upgrade timing, say which model gives it and what it costs, instead of yes or no. When a request needs code only this client wants, route it as a [[term:custom-module]] through the CR process, not a quiet edit on a branch.\n\nThe common mistake is saying \"we'll just fork it for you\" to close a deal. Follow the Oyelabs rule in the handbook card below on core-upgrade impact.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Learn: Tenancy models for a multitenant solution", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models", kind: "docs", verifiedAt: "2026-10-02T11:54:29Z" },
        { label: "AWS SaaS Lens: Silo, pool and bridge models", url: "https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html", kind: "docs", verifiedAt: "2026-10-02T11:54:55Z" },
        { label: "GitHub Docs: Forks", url: "https://docs.github.com/en/pull-requests/reference/forks", kind: "docs", verifiedAt: "2026-10-02T11:54:57Z" },
        { label: "AWS Whitepaper: SaaS tenant isolation strategies", url: "https://docs.aws.amazon.com/whitepapers/latest/saas-tenant-isolation-strategies/saas-tenant-isolation-strategies.html", kind: "docs", verifiedAt: "2026-10-02T12:09:43Z" },
      ],
      video: {
        title: "Multitenancy Explained",
        channel: "IBM Technology",
        url: "https://www.youtube.com/watch?v=60ccSmOxpMw",
        videoId: "60ccSmOxpMw",
        verifiedAt: "2026-10-02T12:17:34Z",
      },
      alternateVideos: [
        {
          title: "Multi-tenant Architecture for SaaS",
          channel: "CodeOpinion",
          url: "https://www.youtube.com/watch?v=e8k6TynqGFs",
          videoId: "e8k6TynqGFs",
          verifiedAt: "2026-10-02T12:17:34Z",
        },
      ],
      handbook: { stages: ["wl-configuration", "wl-core-upgrades"], rules: ["core-upgrade-custom-impact", "configuration-vs-customisation"] },
      sections: [
        {
          heading: "Two axes, not four synonyms",
          body:
            "**Axis 1: hosting.** Does each client have its own stack and database, or do clients share one deployment?\n\n- [[term:single-tenant|Single-tenant]] (the \"silo\" model in AWS's terms): separate per client.\n- [[term:multi-tenant|Multi-tenant]] (the \"pool\" model): shared, with data separated logically.\n- Many products mix them (the \"bridge\" model): for example a shared app tier with a separate database per client.\n\n**Axis 2: code.** Does the client's copy run the core code, or a diverged copy?\n\n- [[term:client-instance|Client instance]] on the core: same code as everyone, different branding, [[term:configuration]], data and accounts. Client-only code lives in a [[term:custom-module]] that plugs into the core.\n- [[term:client-fork|Client fork]]: the client's code has diverged from the core. Every [[term:core-upgrade]] must be merged by hand, with [[term:customisation-merge-conflicts]].\n\nPut a client on both axes before you answer a question about their app: \"single-tenant, on core 4.2, with one custom module\" says almost everything about cost and risk.",
        },
        {
          heading: "What each model makes cheap or expensive",
          body:
            "- **Data location or strict isolation** (\"our data must stay in the EU\"): easy single-tenant, hard multi-tenant.\n- **Choosing when to upgrade** (\"not during Ramadan\"): easy single-tenant; in multi-tenant everyone usually upgrades together.\n- **Hosting and operations cost:** lower multi-tenant, higher single-tenant, since each stack is run and monitored separately.\n- **One client's code change:** easy in a fork today, expensive at every upgrade. A custom module costs more to build well but keeps the instance upgradeable.\n- **Security patches:** quick for instances on the core; slow for forks, because each needs its own merge and test.\n\nThe PM's job is not to choose the architecture. It is to say these trade-offs plainly when a client asks, and to route the answer through the product owner and the CR process.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A white-label appointment-booking product. Most salons run multi-tenant. An EU healthcare client requires its own database in an EU region.*\n\nThe client also asks for a custom consent screen before each booking. The PM's notes:\n\n- **Hosting:** the EU data requirement needs a single-tenant deployment in an EU region, on the client's own [[term:hosting-account]]. Higher setup and hosting cost; quoted.\n- **Code:** the consent screen is client-only. It is built as a custom module behind a [[term:feature-toggle]], through a CR. No fork.\n- **Upgrades:** being single-tenant, the client can schedule core upgrades. The consent module's impact is assessed before each upgrade, as the core-upgrade rule below says.\n\nTwo years later the core moves three versions. The client upgrades in a planned two-day window, because nothing was forked. A sister product that forked a client in its first year is still nine versions behind, and every security patch there takes days.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **\"We'll fork it for you\" to win the deal.** Recover: before signing, replace it with a custom-module plan, and price the upgrade effort if a fork is truly unavoidable.\n- **Promising a multi-tenant client its own upgrade schedule.** Recover: correct it in writing and offer single-tenant hosting at its price if the client needs it.\n- **Calling every instance a fork.** It hides real forks. Recover: keep an instance register that shows core version, hosting model and custom modules per client.\n- **Hot-fixing one client's fork and forgetting the core.** Recover: check whether the fix belongs in the core, and log the difference.",
        },
        {
          heading: "Your checklist",
          body:
            "- For each client I can say the hosting model, the core version and the custom modules.\n- Isolation, data-location and upgrade-timing requests get a trade-off answer, not yes or no.\n- Client-only code goes through a CR as a custom module; a fork is the exception, approved and priced.\n- Upgrade impact on custom modules is assessed before each core upgrade.",
        },
      ],
      sop: [
        {
          title: "Hosting model and instance register",
          prompt: "[Oyelabs SOP – admin to fill] Which Oyelabs white-label products run single-tenant, multi-tenant or both; who approves a fork; and where the instance register (core version, hosting model, URLs, accounts, custom modules) is kept.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c07-tenancy-instance-fork-q1",
          prompt: "Which statement is correct?",
          options: [
            "Tenancy is about how instances are hosted; instance vs fork is about how the client's code relates to the core",
            "Single-tenant and fork mean the same thing",
            "Multi-tenant clients cannot have their own branding",
            "Every client instance is a fork",
          ],
          correctIndex: 0,
          explanation: "They are two separate axes. A single-tenant client can still be on the core code.",
        },
        {
          id: "pmp-c07-tenancy-instance-fork-q2",
          prompt: "A client on a multi-tenant product asks to delay the next upgrade until after Ramadan. What do you say?",
          options: [
            "On the shared deployment everyone upgrades together; if a separate schedule is essential, single-tenant hosting is an option at its cost",
            "Yes, no problem",
            "No, never",
            "We'll fork the code for you",
          ],
          correctIndex: 0,
          explanation: "Upgrade timing is a property of the hosting model. Explain the trade-off and the option.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c07-tenancy-instance-fork-q3",
          prompt: "Why do forks fall behind the core?",
          options: [
            "Each core upgrade must be merged by hand into the diverged code and re-tested",
            "GitHub limits forks",
            "Forks cannot be hosted",
            "Forks have no database",
          ],
          correctIndex: 0,
          explanation: "Divergence makes every upgrade a manual merge with conflicts, so teams postpone them.",
        },
        {
          id: "pmp-c07-tenancy-instance-fork-q4",
          prompt: "An EU healthcare client needs its data in an EU region and wants to approve each upgrade. Which set-up fits best?",
          options: [
            "Single-tenant in an EU region, on the core code, with any client-only features as custom modules",
            "Multi-tenant in the default region",
            "A fork hosted anywhere",
            "A shared database with an EU flag",
          ],
          correctIndex: 0,
          explanation: "Single-tenant gives data location and upgrade control. Staying on the core keeps upgrades cheap.",
        },
        {
          id: "pmp-c07-tenancy-instance-fork-q5",
          prompt: "Which are typically easier on a single-tenant deployment? (Select all that apply.)",
          options: [
            "Keeping a client's data in a specific region",
            "Letting a client choose its upgrade window",
            "Lowering hosting cost per client",
            "Isolating one client's performance from another's",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Single-tenant gives isolation, location and timing control. It usually costs more to host, not less.",
        },
        {
          id: "pmp-c07-tenancy-instance-fork-q6",
          prompt: "A security patch lands in the core. Which clients get it fastest?",
          options: [
            "Instances running the core code, with client code in custom modules",
            "Forked clients",
            "Clients with the most custom code in the core",
            "All clients equally",
          ],
          correctIndex: 0,
          explanation: "Instances on the core take the patch as an upgrade. Forks need their own merge and test.",
        },
        {
          id: "pmp-c07-tenancy-instance-fork-q7",
          prompt: "Sales says: \"We'll just fork it for them, it's quicker.\" The client wants one extra screen. What do you propose?",
          options: [
            "A custom module through a CR, keeping the instance on the core; a fork only if approved and priced for upgrade effort",
            "Fork it, since it is quicker",
            "Add the screen to the core for all clients without asking the product owner",
            "Refuse the screen",
          ],
          correctIndex: 0,
          explanation: "A fork is cheap today and expensive at every upgrade. Keep the instance upgradeable and price the work properly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c07-tenancy-instance-fork-q8",
          prompt: "Which facts belong in an instance register for each client? (Select all that apply.)",
          options: ["Core version", "Hosting model", "Custom modules", "Account owners and URLs", "The developers' home addresses"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Version, hosting model, custom modules and accounts tell you the cost and risk of any change.",
        },
        {
          id: "pmp-c07-tenancy-instance-fork-q9",
          prompt: "A multi-tenant client asks for a change that only it wants, and that would alter shared behaviour for every tenant. What is the right route?",
          options: [
            "Behind a feature toggle or as a custom module, via a CR, with the product owner's approval for anything touching the core",
            "Change the shared code directly",
            "Fork the multi-tenant deployment",
            "Ask other tenants to vote",
          ],
          correctIndex: 0,
          explanation: "In a shared deployment one client's change must not change everyone's behaviour. Toggles and modules keep it contained.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "A white-label food-ordering product runs multi-tenant for 30 restaurant clients. A large restaurant group in Saudi Arabia wants to sign, with three conditions: its data hosted in-country, a custom kitchen-display screen, and control over when upgrades happen.",
        steps: [
          {
            id: "s1",
            question: "Which hosting model meets the data and upgrade conditions?",
            options: [
              "A single-tenant deployment in-country, on the client's hosting account",
              "Stay on the shared multi-tenant deployment",
              "A fork of the code on the shared deployment",
              "Any model, since hosting does not affect these",
            ],
            correctIndex: 0,
            explanation: "Data location and upgrade timing both point to single-tenant.",
          },
          {
            id: "s2",
            question: "How should the kitchen-display screen be delivered?",
            options: [
              "As a custom module through a CR, keeping the instance on the core code",
              "By forking the core for this client",
              "By editing the core so every client gets it, without asking",
              "Free, as part of setup",
            ],
            correctIndex: 0,
            explanation: "A custom module keeps the instance upgradeable. It is code, so it is estimated and approved, not included in setup.",
          },
          {
            id: "s3",
            question: "Two years later the core releases a security patch. What does the PM do for this client?",
            options: [
              "Assess the patch's impact on the custom module, agree the upgrade window with the client, and quote any adaptation work as the rule says",
              "Wait for the client to ask",
              "Apply it without testing the custom module",
              "Tell the client upgrades are not possible on single-tenant",
            ],
            correctIndex: 0,
            explanation: "Single-tenant lets the client choose the window; the custom module needs an impact check before the upgrade.",
          },
        ],
      },
    },
    {
      id: "pmp-c07-client-owned-accounts",
      moduleId: "pmp-c07",
      trackId: "pm",
      title: "Client-owned store, cloud and code accounts",
      summary:
        "[[term:client-owned-accounts|Client-owned accounts]] is the principle that the accounts a client's product runs on are the client's, with Oyelabs invited in. The words that get confused here are **owner**, **admin** and **user**. Owning an account (being the Apple Account Holder, the Play Console owner, the domain registrant, the cloud billing owner) is not the same as being able to work in it.\n\nWhy it matters at an agency. Whoever owns the account controls the asset. If Oyelabs owns the [[term:apple-developer-account]], the client's app is legally and practically in Oyelabs' hands; moving it later needs an app transfer that only the Account Holder can start and the recipient must accept. A domain in a developer's personal name, or a cloud account billed to Oyelabs' card, turns into a dispute when the relationship changes. For white-label apps, Apple's Guideline 4.2.6 adds a hard reason: template apps must be submitted by the provider of the content.\n\nHow to do it. List every account the product needs: [[term:apple-developer-account|Apple]], [[term:google-play-console|Google Play]], [[term:domain-ownership|domain]], [[term:hosting-account|hosting]], [[term:payment-gateway-account|payment gateway]], [[term:messaging-provider-accounts|messaging]], and the code repository where the contract says the client owns the code. For each, write who owns it and the role Oyelabs holds. Receive [[term:api-keys]] only through the approved channel.\n\nThe common mistake is \"we'll set it up under ours for now and move it later\". Later is always harder. Follow the Oyelabs rules in the handbook cards below.\n\nNot legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "App Store Connect Help: Overview of app transfer", url: "https://developer.apple.com/help/app-store-connect/transfer-an-app/overview-of-app-transfer", kind: "docs", verifiedAt: "2026-10-02T11:55:07Z" },
        { label: "Play Console Help: Transfer apps to a different developer account", url: "https://support.google.com/googleplay/android-developer/answer/6230247", kind: "docs", verifiedAt: "2026-10-02T11:55:17Z" },
        { label: "Apple Developer Account Help: Apple Developer Program roles", url: "https://developer.apple.com/help/account/access/roles/", kind: "docs", verifiedAt: "2026-10-02T11:55:09Z" },
        { label: "Play Console Help: Add developer account users and manage permissions", url: "https://support.google.com/googleplay/android-developer/answer/9844686", kind: "docs", verifiedAt: "2026-10-02T11:55:20Z" },
      ],
      video: {
        title: "Add Team Members to Apple Developer Account Without Mistakes",
        channel: "Kamran Ceation",
        url: "https://www.youtube.com/watch?v=VMJjMdHx5N8",
        videoId: "VMJjMdHx5N8",
        verifiedAt: "2026-10-02T12:17:35Z",
      },
      alternateVideos: [
        {
          title: "How to Transfer an Android App to Another Google Play Console Account? | thewodmapps",
          channel: "ThewodmApps",
          url: "https://www.youtube.com/watch?v=wD7kGi5cxK0",
          videoId: "wD7kGi5cxK0",
          verifiedAt: "2026-10-02T12:17:17Z",
        },
        {
          title: "How to Transfer Android App to Another Google Play Console Account | Transfer Android Apps | android",
          channel: "Code Micros",
          url: "https://www.youtube.com/watch?v=69_8ykYJUCI",
          videoId: "69_8ykYJUCI",
          verifiedAt: "2026-10-02T12:17:35Z",
        },
      ],
      handbook: {
        stages: ["wl-accounts", "custom-handover"],
        rules: ["client-owned-store-accounts", "secure-credential-sharing"],
        templates: ["whitelabel-onboarding", "handover-kt-checklist"],
      },
      sections: [
        {
          heading: "Side by side: owner, admin, user",
          body:
            "- **Owner** holds the account legally and pays for it. In App Store Connect that is the Account Holder; in Play Console, the account owner; for a domain, the registrant; in the cloud, the billing owner. Only the owner can sign agreements, renew, and start a transfer.\n- **Admin** can manage the account day to day, including inviting users, but does not own it.\n- **User** (App Manager, developer, release manager) can do specific work, such as uploading builds or editing the listing.\n\nThe target state for every account is the same: **client = owner, Oyelabs = admin or user with the least role that lets us do the work.** Write the role down. When the project ends, the client removes us, and nothing needs to move.\n\nThe word \"account\" also hides a second confusion: a **personal** versus an **organisation** account. A personal Apple or Google account in a founder's name is owned by that person, not the company. For a business, an organisation account in the company's legal name is the safer choice.",
        },
        {
          heading: "Why \"move it later\" is expensive",
          body:
            "- **Apple app transfer:** only the Account Holder can start it, and the recipient must accept. Before transfer, TestFlight builds and testers and Xcode Cloud data have to be removed. Some things do not move cleanly: an Apple Pay merchant ID has to be recreated, and Wallet passes become inactive.\n- **Google Play transfer:** the request needs details from both accounts, including registration transaction IDs, and Google's support handles it. Users, ratings and subscriptions move; test groups and Firebase or AdMob links do not.\n- **Domains:** a change of registrant can trigger a transfer lock.\n- **Payment and messaging accounts** are verified for a legal entity. They usually cannot be transferred at all, only re-opened, which means new keys and a new release.\n\nEach of these is days or weeks of work that someone has to pay for. Setting the accounts up in the client's name at the start costs almost nothing.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A React Native fitness-booking app, white-label, for a studio chain in the UAE.*\n\nThe day scope is approved, the PM sends the onboarding checklist with an account table:\n\n- Apple Developer (organisation): owner the client's company; Oyelabs as Admin. Starts now because D-U-N-S and enrolment are slow.\n- Google Play Console (organisation): owner the client; Oyelabs with release permissions on this app.\n- Domain: registrant the client; Oyelabs given DNS access.\n- Cloud hosting: billing owner the client; Oyelabs as admin on the project.\n- Payment gateway and SMS provider: opened and verified by the client; live keys shared through the approved secure channel.\n\nThe PM records each owner and role in the instance record and tracks the slow items as dependencies in the RAID log. At handover, the client removes Oyelabs' roles in an afternoon, and keys are rotated. No transfers, no disputes.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Publishing from Oyelabs' store account \"for now\".** Recover: stop before submission; if already live, plan the app transfer with the client now, while the relationship is good.\n- **A personal account in the founder's name.** Recover: explain the risk to the company and offer to help set up an organisation account before launch.\n- **Keys sent by email or chat.** Recover: treat them as exposed, ask the client to rotate, and re-share through the approved channel.\n- **Nobody knows who owns what.** Recover: build the account table today from what you can see, and confirm it with the client in writing.\n- **The client's developer leaves and was the only owner.** Recover: help the client recover ownership through the provider's own process; prevent it next time with a company-level owner.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "- Every account the product needs is listed with its owner and Oyelabs' role.\n- Owners are the client's legal entity, not a person and not Oyelabs.\n- Oyelabs holds the least role that lets the team work.\n- Slow accounts (store organisation enrolment, payment verification) start the day scope is approved and are tracked as dependencies.\n- Keys arrive only through the approved channel and are rotated at handover.",
        },
      ],
      sop: [
        {
          title: "Account roles Oyelabs requests",
          prompt: "[Oyelabs SOP – admin to fill] For each account type (Apple, Google Play, domain, cloud hosting, payment gateway, messaging, code repository), the role Oyelabs asks for, any allowed exception to client ownership, and the approved tool for receiving keys.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c07-client-owned-accounts-q1",
          prompt: "What is the target state for each account a client's product runs on?",
          options: [
            "The client's legal entity is owner; Oyelabs is admin or user with the least role it needs",
            "Oyelabs is owner; the client is a user",
            "The lead developer is owner",
            "Whoever created it first is owner",
          ],
          correctIndex: 0,
          explanation: "Client owns, Oyelabs works inside with a limited role. Nothing needs to move at handover.",
        },
        {
          id: "pmp-c07-client-owned-accounts-q2",
          prompt: "Who can start an app transfer in App Store Connect?",
          options: ["Only the Account Holder", "Any Admin", "Any developer with access", "Apple support, on request from anyone"],
          correctIndex: 0,
          explanation: "Only the Account Holder can initiate, and the recipient must accept.",
        },
        {
          id: "pmp-c07-client-owned-accounts-q3",
          prompt: "A start-up founder opened the Apple account in his own personal name. Why is that a risk for the company?",
          options: [
            "The account and app belong to that person, not the company; if he leaves, the company does not control its app",
            "Personal accounts cannot publish apps",
            "Personal accounts cost more",
            "There is no risk",
          ],
          correctIndex: 0,
          explanation: "Ownership follows the account holder. An organisation account in the company's legal name protects the company.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c07-client-owned-accounts-q4",
          prompt: "Which usually do NOT move cleanly when an app is transferred? (Select all that apply.)",
          options: [
            "An Apple Pay merchant ID (it must be recreated)",
            "Google Play test groups",
            "Firebase or AdMob links on Play",
            "The app's ratings and reviews",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Ratings and reviews move with the app. Merchant IDs, test groups and some linked services do not.",
        },
        {
          id: "pmp-c07-client-owned-accounts-q5",
          prompt: "The client sends live payment keys in a WhatsApp message. What do you do?",
          options: [
            "Treat them as exposed: ask the client to rotate them and re-share through the approved secure channel",
            "Save them in the repo",
            "Use them and delete the message",
            "Forward them to the developer by email",
          ],
          correctIndex: 0,
          explanation: "A key sent over chat is no longer secret. Rotate and use the approved channel.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c07-client-owned-accounts-q6",
          prompt: "Which accounts should normally be opened in the client's legal name? (Select all that apply.)",
          options: ["Apple Developer", "Google Play Console", "Domain registration", "Payment gateway", "Oyelabs' timesheet tool"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Everything the client's product runs on is the client's. Oyelabs' internal tools stay Oyelabs'.",
        },
        {
          id: "pmp-c07-client-owned-accounts-q7",
          prompt: "The client says: \"Just host it on your cloud account and bill us.\" What is the main issue?",
          options: [
            "Oyelabs would control the client's infrastructure and data, and moving it later is a migration, not a click",
            "Cloud providers forbid it",
            "Hosting is free on the client's account",
            "There is no issue",
          ],
          correctIndex: 0,
          explanation: "Control and portability. Unless the contract and the rules allow a hosted service, the hosting account belongs to the client.",
        },
        {
          id: "pmp-c07-client-owned-accounts-q8",
          prompt: "What separates an owner from an admin on a store account?",
          options: [
            "Only the owner can sign agreements, renew and start a transfer; an admin manages day-to-day work",
            "Admins can transfer apps; owners cannot",
            "There is no difference",
            "Owners cannot upload builds",
          ],
          correctIndex: 0,
          explanation: "Ownership is legal control. Admin is operational access.",
        },
        {
          id: "pmp-c07-client-owned-accounts-q9",
          prompt: "At the end of a project, how do you know the account set-up was right?",
          options: [
            "The client can remove Oyelabs' roles and rotate keys without any transfer",
            "Oyelabs hands over a spreadsheet of passwords",
            "The client asks for a transfer of each account",
            "Nothing needs to happen because Oyelabs keeps the accounts",
          ],
          correctIndex: 0,
          explanation: "If handover needs transfers, ownership was wrong from the start.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "This account plan was drafted for a white-label grocery app for a client in Oman. Mark every line that breaks the client-owned accounts principle or handles access wrongly.",
        segments: [
          { id: "a1", text: "Account plan: Fresh Basket grocery app (white-label, React Native, Laravel admin panel).", issue: null },
          { id: "a2", text: "Apple Developer: organisation account in Fresh Basket LLC's legal name; Oyelabs invited as Admin.", issue: null },
          { id: "a3", text: "Google Play: to save time, we will publish from the Oyelabs Play Console and transfer the app after launch.", issue: "Publishing from Oyelabs' account means a later transfer and breaks client ownership. Use the client's Play account from the start." },
          { id: "a4", text: "Domain freshbasket.om: registered by our developer Rahul on his personal registrar account; he will add the DNS records.", issue: "The registrant owns the domain. It must be registered in the client's name, not a developer's personal account." },
          { id: "a5", text: "Hosting: cloud project billed to Fresh Basket's company card; Oyelabs added as project admin.", issue: null },
          { id: "a6", text: "Payment gateway: merchant account opened and verified by Fresh Basket LLC.", issue: null },
          { id: "a7", text: "Live payment keys: the client will email them to the PM, who will paste them into the team chat.", issue: "Keys must go through the approved secure channel, never email or chat." },
          { id: "a8", text: "SMS provider: account in the client's name; Oyelabs given an API key with sending rights only.", issue: null },
          { id: "a9", text: "Oyelabs will request Account Holder rights on Apple so we can sign the agreements faster.", issue: "The client should remain Account Holder; Oyelabs needs only the least role required." },
          { id: "a10", text: "All accounts, owners and Oyelabs' roles are recorded in the instance record.", issue: null },
          { id: "a11", text: "Slow items (Apple D-U-N-S, payment verification) are tracked as client dependencies with needed-by dates.", issue: null },
          { id: "a12", text: "At handover, the client removes Oyelabs' roles and rotates the keys.", issue: null },
        ],
        askExplanation: true,
      },
    },
  ],
} satisfies Module;
