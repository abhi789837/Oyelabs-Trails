import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-b11",
  trackId: "pm",
  name: "White-label lifecycle: Core product upgrades",
  description:
    "Keeping every white-label client on a supported version of the core: reading a release in SemVer terms, planning upgrades in rings, telling clients what changes, and pricing the customisation debt that makes forked or heavily customised instances expensive to upgrade.",
  topics: [
    {
      id: "pmp-b11-version-sync",
      moduleId: "pmp-b11",
      trackId: "pm",
      title: "Keeping client instances in sync with the core",
      summary:
        "A [[term:white-label]] business only works if every client benefits from the [[term:core-product]] getting better. That means each [[term:client-instance]] has to move to new core versions regularly. When instances are left behind, the agency ends up maintaining many versions at once: a security fix has to be applied to every version in use, support staff must remember which client runs what, and store SDK deadlines arrive for old code nobody wants to touch.\n\n[[term:version-sync]] is a managed process, not a developer's side job. The core team releases a new [[term:product-version]]. The tech lead assesses each instance's impact, especially any [[term:custom-module]]. The PM plans and communicates the upgrade, in rings: internal and demo instances first, then a few uncustomised clients, then everyone else. QA runs a [[term:regression-test]] per instance, and the instance register is updated.\n\nSemantic versioning makes the conversation easier. A PATCH release fixes bugs, a MINOR release adds compatible features, and a MAJOR release contains breaking changes. Clients do not need the details, but they need to know which kind of release is coming and what it means for them.\n\nThe common mistake is letting clients opt out of upgrades indefinitely because \"they are happy as they are\". Microsoft's guidance for multi-tenant products is to allow a temporary opt-out with a deadline, never a permanent one. Every instance left behind becomes a separate product you maintain for free.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Learn: Considerations for updating a multitenant solution", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/updates", kind: "docs", verifiedAt: "2026-10-02T11:49:14Z" },
        { label: "Semantic Versioning 2.0.0", url: "https://semver.org/", kind: "spec", verifiedAt: "2026-10-02T11:47:56Z" },
        { label: "GitHub Docs: Syncing a fork", url: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork", kind: "docs", verifiedAt: "2026-10-02T11:47:43Z" },
        { label: "Martin Fowler: Patterns for managing source code branches", url: "https://martinfowler.com/articles/branching-patterns.html", kind: "article", verifiedAt: "2026-10-02T11:47:45Z" },
      ],
      video: {
        title: "Keeping my sanity, when white-labeling 40 apps",
        channel: "The droidCon Archive",
        url: "https://www.youtube.com/watch?v=l-XIPnKVLys",
        videoId: "l-XIPnKVLys",
        verifiedAt: "2026-10-02T12:00:57Z",
      },
      alternateVideos: [
        {
          title: "Git Forking & Fetch: How to Keep your Fork in Sync with an Upstream Repository",
          channel: "Faraday Academy",
          url: "https://www.youtube.com/watch?v=deEYHVpE1c8",
          videoId: "deEYHVpE1c8",
          verifiedAt: "2026-10-02T12:00:56Z",
        },
        {
          title: "Never fear merge conflicts again - git merge/pull tutorial",
          channel: "Philomatics",
          url: "https://www.youtube.com/watch?v=DloR0BOGNU0",
          videoId: "DloR0BOGNU0",
          verifiedAt: "2026-10-02T12:00:57Z",
        },
      ],
      handbook: {
        stages: ["wl-core-upgrades"],
        rules: ["core-upgrade-custom-impact"],
      },
      sections: [
        {
          heading: "Why instances drift, and what it costs",
          body:
            "Instances fall behind for ordinary reasons: the client is busy, the upgrade needs a regression pass nobody planned, or a [[term:custom-module]] makes the upgrade risky. Each skipped release makes the next one bigger.\n\nThe cost lands on Oyelabs:\n\n- **Fixes multiply.** Microsoft's guidance asks how many versions you can reasonably maintain, because a [[term:hotfix]] may have to be applied to every version in use.\n- **Support slows down.** Support teams must know which version each tenant runs before they can answer anything.\n- **Store deadlines.** The stores periodically require apps to be rebuilt against newer platform SDKs. An instance several core versions behind turns a routine rebuild into a project.\n- **Clients miss improvements** they are paying for in their licence, and start to feel the product is stagnant.",
        },
        {
          heading: "SemVer in client language",
          body:
            "The core team should version releases as MAJOR.MINOR.PATCH:\n\n- **PATCH** (2.7.3 to 2.7.4): bug fixes only. Usually safe to apply quickly; tell the client briefly.\n- **MINOR** (2.7 to 2.8): new features that do not break existing behaviour. New options are often off by default as a [[term:feature-toggle]], so the client chooses when to use them.\n- **MAJOR** (2.x to 3.0): breaking changes. Behaviour, data or integrations may change. Needs planning, client communication, and an impact check on every custom module.\n\nTranslate, do not forward. \"Core 3.0 changes how delivery slots work; your custom slot rules need to be adapted, and we will quote that separately\" is useful. A raw changelog is not.",
        },
        {
          heading: "Planning an upgrade in rings",
          body:
            "Roll a core release out in deployment rings, the way Microsoft describes for multi-tenant products:\n\n1. **Canary:** internal and demo instances. The core team and QA find the obvious problems.\n2. **Early adopters:** a few uncustomised clients who agreed to go early.\n3. **Everyone else:** the remaining instances, with customised ones last, after their custom-module impact has been assessed and, where needed, quoted.\n\nFor each ring: upgrade, run the [[term:regression-test]] for that instance, release app updates using phased release and staged rollouts, and update the instance register. Feature toggles let you ship code to everyone but switch new behaviour on per client.\n\nIf a client asks to defer, agree a temporary opt-out with a date, and record it. A deferral with no deadline is a fork in disguise.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A white-label food-ordering product with 14 client instances.* Core 2.8.0 (MINOR: scheduled orders, a new reporting screen) and a security PATCH 2.7.4 are ready.\n\n1. **Register check.** The PM filters the instance register: 9 clients on 2.7.x with no custom modules, 3 on 2.7.x with custom modules, 2 still on 2.5.x.\n2. **Security first.** 2.7.4 goes to all 2.7.x instances within the week, as a patch. The two 2.5.x clients need the fix too; the tech lead estimates the backport and the PM raises the overdue upgrade with their account manager.\n3. **Rings for 2.8.0.** Demo and internal instances in week 1; three uncustomised clients who volunteered in week 2; the other six uncustomised in week 3. Scheduled orders ship switched off.\n4. **Customised clients.** The tech lead assesses impact: two custom modules are unaffected, one touches reporting and needs 10 hours of adaptation. Follow the Oyelabs rule in the handbook card below for how that is charged; the PM sends that client a short note and a quote before scheduling.\n5. **Communication.** Every client receives a plain-language note: what is new, whether anything changes for them, the date, and how to switch on scheduled orders.\n6. **Close.** The register shows each instance's version, date and any agreed deferral deadline.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Upgrading a customised instance without an impact check.** Conflicts appear mid-upgrade, the date slips and the client is surprised by a bill. Recovery: pause, get the tech lead's assessment, and talk to the client before continuing.\n- **Forwarding the raw changelog.** Clients either ignore it or panic. Send a short note in their terms.\n- **Permanent opt-outs.** Set a deadline for every deferral and review the register monthly.\n- **No register.** If nobody can say which version each client runs, build the register before the next release. It is the single most useful artefact in a white-label portfolio.\n- **Switching new features on for everyone.** Some clients do not want them. Ship behind toggles and let configuration decide.",
        },
        {
          heading: "Your checklist",
          body:
            "- Instance register current: version, custom modules, deferrals with deadlines.\n- Release classified as MAJOR, MINOR or PATCH and translated for clients.\n- Impact on each custom module assessed by the tech lead before scheduling.\n- Customisation impact quoted where the Oyelabs rule says so.\n- Rings planned: canary, early adopters, everyone else (customised last).\n- Regression test per instance; app updates via phased release and staged rollout.\n- Client notes sent before the upgrade, with what changes and when.\n- Register updated after each instance is upgraded.",
        },
      ],
      sop: [
        {
          title: "Our core release calendar and client upgrade notice",
          prompt:
            "[Oyelabs SOP – admin to fill] How often each white-label core releases, the ring plan per product, the client upgrade-notice template, and the maximum deferral a client may have before an upgrade is required.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b11-version-sync-q1",
          prompt: "The core moves from 2.7.3 to 3.0.0. What should a PM assume?",
          options: [
            "Only bug fixes",
            "Compatible new features only",
            "Breaking changes: plan, check every custom module, and communicate carefully",
            "Nothing: version numbers are cosmetic",
          ],
          correctIndex: 2,
          explanation: "In SemVer, a MAJOR increment signals incompatible changes.",
        },
        {
          id: "pmp-b11-version-sync-q2",
          prompt: "A client says: \"We're happy on 2.5, please never upgrade us.\" What is the best response?",
          options: [
            "Agree: the client is always right",
            "Agree to a temporary deferral with a deadline, and explain the security and store-deadline risks of staying behind",
            "Upgrade them without telling them",
            "Fork their instance permanently",
          ],
          correctIndex: 1,
          explanation: "A temporary opt-out with a deadline, never a permanent one. Each instance left behind is another version to maintain.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b11-version-sync-q3",
          prompt: "Which belong in the instance register? (Select all that apply.)",
          options: [
            "The core version each client runs",
            "Custom modules per client",
            "Agreed deferral deadlines",
            "Developers' personal notes about the client's CEO",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "The register answers \"who runs what, with which customisations, until when\".",
        },
        {
          id: "pmp-b11-version-sync-q4",
          prompt: "In a ring rollout of a core release, which instances usually go last?",
          options: [
            "Demo and internal instances",
            "Uncustomised volunteers",
            "Customised instances, after their impact has been assessed and quoted where needed",
            "The newest clients",
          ],
          correctIndex: 2,
          explanation: "Canary first, early adopters next, and the riskiest instances last with a proper impact check.",
        },
        {
          id: "pmp-b11-version-sync-q5",
          prompt: "A security patch is released, but two clients are three minor versions behind. What is the real cost?",
          options: [
            "None: patches apply to any version",
            "The fix may need to be backported to their old version, which is extra work, and their overdue upgrade should be raised",
            "They are not affected by security issues",
            "The patch must be skipped for them",
          ],
          correctIndex: 1,
          explanation: "Old versions multiply the work for every fix. Use it to push the overdue upgrade.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b11-version-sync-q6",
          prompt: "Why ship a new core feature behind a feature toggle? (Select all that apply.)",
          options: [
            "The code can reach every instance while each client chooses when to switch it on",
            "It lets you upgrade instances without forcing behaviour changes",
            "It removes the need for regression testing",
            "It keeps instances on one codebase instead of separate versions",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Toggles separate deployment from release. You still test.",
        },
        {
          id: "pmp-b11-version-sync-q7",
          prompt: "What should the client upgrade note contain?",
          options: [
            "The full commit log",
            "What is new, whether anything changes for this client, the date, and any action or quote",
            "Only the version number",
            "Nothing: upgrades are internal",
          ],
          correctIndex: 1,
          explanation: "Translate the release into the client's terms.",
        },
        {
          id: "pmp-b11-version-sync-q8",
          prompt: "Mid-upgrade, the developers find conflicts in a client's custom checkout module that nobody assessed. What now?",
          options: [
            "Resolve them quietly and absorb the cost",
            "Pause, get the tech lead's impact assessment, and talk to the client about the effort before continuing",
            "Delete the custom module",
            "Roll the whole portfolio back",
          ],
          correctIndex: 1,
          explanation: "Customisation impact is assessed before the upgrade and handled per the Oyelabs rule, not discovered and absorbed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b11-version-sync-q9",
          prompt: "Which are good reasons to keep all instances close to the current core? (Select all that apply.)",
          options: [
            "Fixes do not have to be applied to many old versions",
            "Support can answer faster",
            "Store SDK deadlines become routine rebuilds",
            "Clients pay more for older versions",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Staying close to the core keeps maintenance, support and compliance cheap.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "These are lines from the core team's release notes for a white-label food-ordering product. Classify each change as it should be versioned under SemVer, so you know what to tell clients.",
        categories: [
          { id: "major", label: "MAJOR: breaking change" },
          { id: "minor", label: "MINOR: compatible new feature" },
          { id: "patch", label: "PATCH: bug fix only" },
        ],
        items: [
          { id: "i1", text: "Fixed: order totals rounded wrongly for currencies with three decimals.", explanation: "A fix to existing behaviour, nothing new: PATCH." },
          { id: "i2", text: "New: scheduled orders, switched off by default and enabled per client.", explanation: "A new feature that changes nothing until switched on: MINOR." },
          { id: "i3", text: "Changed: the delivery-slot API now requires a zone ID; the old endpoint is removed.", explanation: "Removing an endpoint breaks integrations and custom modules that use it: MAJOR." },
          { id: "i4", text: "Fixed: push notifications not arriving on some Android 14 devices.", explanation: "A bug fix: PATCH." },
          { id: "i5", text: "New: a sales-by-hour report in the admin panel.", explanation: "A compatible addition: MINOR." },
          { id: "i6", text: "Changed: customer accounts move from phone-only login to email or phone; existing sessions are signed out and stored phone formats are migrated.", explanation: "Changes stored data and forces existing users to sign in again: MAJOR." },
          { id: "i7", text: "Fixed: the driver app crashed when a delivery address had no postcode.", explanation: "A crash fix: PATCH." },
          { id: "i8", text: "New: an optional tip field at checkout, controlled from the configuration panel.", explanation: "Optional and configurable: MINOR." },
        ],
        answer: { i1: "patch", i2: "minor", i3: "major", i4: "patch", i5: "minor", i6: "major", i7: "patch", i8: "minor" },
      },
    },
    {
      id: "pmp-b11-customisation-debt",
      moduleId: "pmp-b11",
      trackId: "pm",
      title: "Customisation debt and merge-conflict risk",
      summary:
        "Every piece of client-specific code is a promise to pay later. When a [[term:client-instance]] gets [[term:customisation]] inside core files, or a full [[term:client-fork]] of the code, each new core release has to be merged into it. Wherever the core and the client's changes touch the same lines, developers face [[term:customisation-merge-conflicts]]. The longer the fork drifts, the more conflicts each release brings. That growing, recurring cost is customisation debt.\n\nIt behaves like technical debt in Martin Fowler's sense: you can choose to take it on to win a deal or meet a date, but you keep paying interest on every [[term:core-upgrade]] until you repay it. Unlike most technical debt, it is also a commercial issue, because someone has to pay for that interest: Oyelabs, out of margin, or the client, through a quoted [[term:change-request]] or support work.\n\nThe PM's job is to make the debt visible before it is taken on and every time it is paid. When a client asks for customisation, the CR should state that it will affect future upgrades. When an upgrade is planned, the tech lead's impact assessment turns that into hours. Follow the Oyelabs rule in the handbook card below for how that effort is charged.\n\nThe common mistake is the silent fork: a developer copies the core for one client \"just this once\", makes changes in place, and nobody records it. A year later that client is several versions behind, a security fix cannot be applied cleanly, and the upgrade costs more than the original customisation. Not legal advice: the signed contract always wins.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "GitHub Docs: About merge conflicts", url: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/about-merge-conflicts", kind: "docs", verifiedAt: "2026-10-02T11:47:44Z" },
        { label: "Martin Fowler: Technical Debt", url: "https://martinfowler.com/bliki/TechnicalDebt.html", kind: "article", verifiedAt: "2026-10-02T11:49:27Z" },
        { label: "Martin Fowler: Branch By Abstraction", url: "https://martinfowler.com/bliki/BranchByAbstraction.html", kind: "article", verifiedAt: "2026-10-02T11:49:28Z" },
        { label: "Git docs: git-rerere (reuse recorded conflict resolution)", url: "https://git-scm.com/docs/git-rerere", kind: "docs", verifiedAt: "2026-10-02T11:49:27Z" },
      ],
      video: {
        title: "What is technical debt?  Definition, Overview, and Best Practices",
        channel: "ProductPlan",
        url: "https://www.youtube.com/watch?v=qGcm6GVyDNw",
        videoId: "qGcm6GVyDNw",
        verifiedAt: "2026-10-02T12:00:58Z",
      },
      alternateVideos: [
        {
          title: "Technical Debt Explained for Beginners | What is Technical Debt | SCALER",
          channel: "SCALER",
          url: "https://www.youtube.com/watch?v=v4s-S-GkhjE",
          videoId: "v4s-S-GkhjE",
          verifiedAt: "2026-10-02T12:00:59Z",
        },
        {
          title: "What is Customization Vs Configuration in ServiceNow? Know before you customize OOTB features",
          channel: "ServiceNowStar",
          url: "https://www.youtube.com/watch?v=LYQj2Vueex4",
          videoId: "LYQj2Vueex4",
          verifiedAt: "2026-10-02T12:00:28Z",
        },
      ],
      handbook: {
        stages: ["wl-core-upgrades"],
        rules: ["core-upgrade-custom-impact", "configuration-vs-customisation", "cr-when-needed"],
        templates: ["cr-form"],
      },
      sections: [
        {
          heading: "Where merge conflicts come from",
          body:
            "Git can merge most changes automatically. A conflict happens when both sides changed the same lines of a file, or one side changed a file the other deleted. Then a developer has to read both versions and decide by hand.\n\nFor a white-label product that means:\n\n- Client changes made **inside core files** conflict whenever the core changes those files.\n- A client **fork** that skips releases has to absorb all of them at once, and the overlapping changes pile up.\n- Every conflict also needs **retesting**, because a hand-made merge is a new piece of code.\n\nSo the cost of an upgrade is roughly: the number of places where core and client changes overlap, times the effort per overlap, plus the regression test. Customisation that sits *outside* the core files, behind an interface or in a separate [[term:custom-module]], keeps the overlap small.",
        },
        {
          heading: "A worked example: a client fork falling behind the core",
          body:
            "*A white-label food-delivery app for a client in Kuwait.*\n\n1. **The decision (core 3.0).** To win the deal, the team agreed a custom checkout with split payments and a corporate-account discount. Under deadline pressure, a developer copied the core repository and edited the checkout, pricing and order files in place. No custom module, no record in the register beyond \"has custom checkout\".\n2. **Months 1–6.** The core ships 3.1, 3.2, 3.3 and 3.4: new payment providers, a pricing refactor, a security fix in the order service. Every other client upgrades. The Kuwait client's fork does not, because \"it's risky and they didn't ask\".\n3. **The trigger.** A security fix in 3.4 must reach every client. Applying it to the fork means first catching up four releases. The tech lead counts the files changed both in the core since 3.0 and in the fork: 20 overlapping files across the four releases, mostly in checkout and pricing, plus a regression pass per step.\n4. **The bill.** Catching up costs about two weeks of a developer's time, and the client is exposed to the security issue meanwhile. Nobody quoted this when the customisation was sold, so the conversation about who pays is difficult.\n5. **The alternative that was available.** If the checkout changes had been built as a separate module behind the core's payment interface (Branch by Abstraction, in Fowler's terms), only the interface would be shared with the core. The tech lead estimates one overlapping file per release.\n\nThe practice below puts numbers on this exact case.",
        },
        {
          heading: "How to keep the debt small",
          body:
            "These are engineering choices, but the PM decides whether they are asked for, planned and paid:\n\n- **Configuration first.** If the [[term:configuration-panel]] or a [[term:feature-toggle]] can do it, it is [[term:configuration]], not code.\n- **Custom modules, not edits.** Client-specific code lives in its own module behind an interface the core supports.\n- **Upstream what is general.** If two clients want the same thing, propose it as a core feature. Microsoft notes customisations can become redundant once a standard release covers the need; that is the moment to retire them.\n- **Upgrade often.** Small, regular merges are cheaper than one large catch-up.\n- **Reuse resolutions.** `git rerere` records how a conflict was resolved and reapplies it the next time the same conflict appears. It helps, but it does not remove the need to test.\n- **Record everything.** Every customisation is in the instance register with its module and the files it touches.",
        },
        {
          heading: "Making the debt visible in the CR",
          body:
            "When you raise a [[term:change-request]] for customisation, add three lines that many CRs leave out:\n\n1. **Upgrade impact:** \"This change affects how future core upgrades are applied to your instance.\"\n2. **How it is built:** as a separate custom module, or inside core files, and why.\n3. **Ongoing cost:** how adapting it on future upgrades is handled, following the Oyelabs rule in the handbook card below.\n\nThat way the client chooses customisation knowing its lifetime cost, and the future upgrade quote is a continuation of an agreement, not a surprise. Not legal advice: the signed contract always wins.",
        },
        {
          heading: "Hard cases and recoveries",
          body:
            "- **A silent fork is discovered.** Record it in the register, ask the tech lead for a divergence count (files changed on both sides since the fork), and tell the account manager before the next upgrade is due.\n- **The forked client refuses to pay for the catch-up.** Check what the contract says about upgrades and customisations. Offer options: pay to catch up, pay to rebuild the customisation as a module (which lowers every future upgrade), or accept a documented, time-limited support position for the old version. Escalate through BD, not alone.\n- **A security fix cannot wait for the catch-up.** The tech lead may backport just the fix to the fork. It buys time; it does not repay the debt.\n- **Two clients want conflicting customisations of the same screen.** A strong sign the core needs a configurable option. Take it to the core team.\n- **The customisation is now redundant.** A new core release does what the client's custom module did. Plan its removal with the client as part of the upgrade.",
        },
        {
          heading: "Your checklist",
          body:
            "- Every customisation request checked first against configuration and toggles.\n- CRs for customisation state the upgrade impact and how it will be built.\n- Custom code in separate modules, recorded in the instance register with the files it touches.\n- No silent forks; any found are recorded and raised.\n- Tech lead's impact assessment before every upgrade of a customised instance.\n- Upgrade effort for customisation handled per the Oyelabs rule and the contract.\n- Redundant customisations retired when the core catches up.",
        },
      ],
      sop: [
        {
          title: "Our custom-module standard and divergence review",
          prompt:
            "[Oyelabs SOP – admin to fill] How client-specific code must be built for each white-label product (module structure, interfaces, where it lives), how often the tech lead reviews instance divergence, and who approves a fork if one is ever allowed.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b11-customisation-debt-q1",
          prompt: "What causes a merge conflict when a core release is merged into a client's customised code?",
          options: [
            "Any change in the core",
            "The core and the client's code changed the same lines, or one side changed a file the other deleted",
            "Different developers working on the release",
            "A new version number",
          ],
          correctIndex: 1,
          explanation: "Git merges non-overlapping changes automatically; overlaps need a human decision.",
        },
        {
          id: "pmp-b11-customisation-debt-q2",
          prompt: "A client fork skipped four core releases. Why is catching up harder than four separate upgrades would have been?",
          options: [
            "It is not: the effort is identical",
            "All the overlapping changes have to be resolved at once, under pressure, with a large regression test, and any urgent fix waits for the catch-up",
            "Git cannot merge more than one release",
            "Old releases are deleted",
          ],
          correctIndex: 1,
          explanation: "Overlaps accumulate, risk concentrates, and the client is exposed while the catch-up happens.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b11-customisation-debt-q3",
          prompt: "Which reduce customisation debt? (Select all that apply.)",
          options: [
            "Using configuration or feature toggles instead of code where possible",
            "Building client code as separate modules behind an interface",
            "Editing core files directly to save time",
            "Upgrading customised instances regularly in small steps",
            "Proposing widely requested customisations as core features",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3, 4],
          explanation: "Editing core files in place is the main source of conflicts.",
        },
        {
          id: "pmp-b11-customisation-debt-q4",
          prompt: "What does `git rerere` do?",
          options: [
            "Deletes conflicting files",
            "Records how a conflict was resolved and reapplies that resolution when the same conflict appears again",
            "Prevents conflicts from happening",
            "Tests the merged code automatically",
          ],
          correctIndex: 1,
          explanation: "It saves repeated effort, but resolved code still needs testing.",
        },
        {
          id: "pmp-b11-customisation-debt-q5",
          prompt: "A client asks for a change to the core checkout. Which lines should the CR include beyond scope, cost and timeline? (Select all that apply.)",
          options: [
            "That the change affects future core upgrades",
            "Whether it will be built as a separate module or inside core files",
            "How adapting it on future upgrades will be handled",
            "The names of the developers",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Make the lifetime cost visible when the decision is made.",
        },
        {
          id: "pmp-b11-customisation-debt-q6",
          prompt: "You discover a developer created an unrecorded fork for one client a year ago. What do you do first?",
          options: [
            "Delete the fork",
            "Record it in the register, get a divergence count from the tech lead, and tell the account manager before the next upgrade",
            "Ignore it until the client complains",
            "Move all clients to the fork",
          ],
          correctIndex: 1,
          explanation: "Make the debt visible and sized before it becomes an emergency.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b11-customisation-debt-q7",
          prompt: "A critical security fix must reach a forked client today, but the catch-up will take two weeks. What is a reasonable plan?",
          options: [
            "Wait two weeks",
            "Backport only the fix to the fork now, then plan and agree the catch-up separately",
            "Take the client's app offline",
            "Tell the client it is their problem",
          ],
          correctIndex: 1,
          explanation: "A backport buys time for the urgent issue; it does not repay the debt.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b11-customisation-debt-q8",
          prompt: "A new core release now includes the split-payment feature that one client had as a custom module. What should happen?",
          options: [
            "Keep both forever",
            "Plan with the client to retire the custom module and move to the core feature during the upgrade",
            "Remove the core feature for that client",
            "Charge the client twice",
          ],
          correctIndex: 1,
          explanation: "Customisations become redundant when the core catches up; retiring them repays debt.",
        },
        {
          id: "pmp-b11-customisation-debt-q9",
          prompt: "The forked client refuses to pay for a catch-up the contract does not clearly cover. Which options are fair to put on the table? (Select all that apply.)",
          options: [
            "Pay for the catch-up",
            "Pay to rebuild the customisation as a module, lowering every future upgrade",
            "A documented, time-limited support position for the old version",
            "Quietly absorb the cost every time",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Offer real options and escalate through BD. Absorbing it silently repeats the problem.",
        },
        {
          id: "pmp-b11-customisation-debt-q10",
          prompt: "Why is customisation debt a commercial issue and not only an engineering one?",
          options: [
            "Because engineers do not care about it",
            "Because someone pays for the extra effort on every upgrade: Oyelabs from its margin, or the client through a quote",
            "Because stores charge for it",
            "It is only an engineering issue",
          ],
          correctIndex: 1,
          explanation: "The recurring interest has to be priced and agreed, or it erodes margin.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "The Kuwait client's fork was taken at core 3.0. The tech lead counted, for each release since, how many files changed in both the core and the fork, the typical hours to resolve each overlap, and the regression-test hours needed after merging that release. Work out the cost of the catch-up, and of the same catch-up had the checkout been built as a separate module.",
        table: {
          columns: ["Core release", "Files changed in core", "Overlapping files", "Hours per overlap", "Regression hours"],
          rows: [
            ["3.1", "40", "3", "2", "6"],
            ["3.2", "55", "5", "2", "6"],
            ["3.3", "30", "4", "3", "6"],
            ["3.4", "70", "8", "3", "8"],
          ],
        },
        fields: [
          {
            id: "conflict",
            label: "Conflict-resolution hours to bring the fork from 3.0 to 3.4",
            unit: "h",
            answer: 52,
            tolerance: 0.5,
            expression: "T[0][2]*T[0][3] + T[1][2]*T[1][3] + T[2][2]*T[2][3] + T[3][2]*T[3][3]",
          },
          {
            id: "total",
            label: "Total catch-up hours including regression testing",
            unit: "h",
            answer: 78,
            tolerance: 0.5,
            expression: "T[0][2]*T[0][3] + T[1][2]*T[1][3] + T[2][2]*T[2][3] + T[3][2]*T[3][3] + T[0][4] + T[1][4] + T[2][4] + T[3][4]",
          },
          {
            id: "module",
            label: "Total hours if built as a module: 1 overlapping file per release at 2 h each, same regression hours",
            unit: "h",
            answer: 34,
            tolerance: 0.5,
            expression: "4*1*2 + T[0][4] + T[1][4] + T[2][4] + T[3][4]",
          },
          {
            id: "saved",
            label: "Hours the module approach would have saved on this catch-up",
            unit: "h",
            answer: 44,
            tolerance: 0.5,
            expression: "T[0][2]*T[0][3] + T[1][2]*T[1][3] + T[2][2]*T[2][3] + T[3][2]*T[3][3] - 4*1*2",
          },
        ],
        explanation:
          "Conflicts: 3×2 + 5×2 + 4×3 + 8×3 = 6 + 10 + 12 + 24 = 52 h. Regression adds 6 + 6 + 6 + 8 = 26 h, so 78 h. As a module: 4 releases × 1 file × 2 h = 8 h, plus the same 26 h = 34 h. Saved: 78 − 34 = 44 h on this one catch-up, and it recurs on every future release. That recurring difference is the customisation debt to state in the CR.",
      },
    },
  ],
} satisfies Module;
