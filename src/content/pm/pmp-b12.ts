import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-b12",
  trackId: "pm",
  name: "White-label lifecycle: Running many white-label clients",
  description:
    "Running a white-label portfolio rather than one launch at a time: the client register, per-client configuration, shared code signing, automated store metadata, matrix builds and a release calendar, so the tenth client is easier than the first.",
  topics: [
    {
      id: "pmp-b12-portfolio-templates",
      moduleId: "pmp-b12",
      trackId: "pm",
      title: "Templates and automation for a white-label portfolio",
      summary:
        "One [[term:white-label]] launch can be run from a PM's memory. Ten cannot. With many clients on the same [[term:core-product]], the risks change: two clients' assets mixed up, a renewal date missed, a certificate expiring on a Friday, a core release that nobody knows which clients have received. The work stops being about any one launch and becomes about the system that runs all of them.\n\nThat system has two halves. **Information**: a single client register that says, for every [[term:client-instance]], who owns which accounts, the [[term:bundle-id]] and [[term:package-name]], the core version, the flags switched on, any [[term:custom-module]], the licence and [[term:renewal]] dates. **Repeatable work**: templates for onboarding, listings and privacy, plus automation for builds and store uploads, so each client is the same steps with different inputs.\n\nThe automation is real and well documented. fastlane's `match` shares code-signing certificates and profiles across the team; `deliver` uploads App Store metadata and screenshots; `supply` uploads Google Play metadata and builds. A CI matrix builds every client's variant from one workflow. The PM does not write these scripts, but should ask for them once the portfolio grows, because they turn a two-day manual release into a routine one.\n\nThe common mistake is treating each new client as a fresh project with fresh documents. Every launch then rediscovers the same problems. Start each client from the onboarding template, keep the register current, and feed every lesson back into the templates.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "fastlane docs: match (shared code signing)", url: "https://docs.fastlane.tools/actions/match/", kind: "docs", verifiedAt: "2026-10-02T11:47:47Z" },
        { label: "fastlane docs: deliver (App Store metadata and screenshots)", url: "https://docs.fastlane.tools/actions/deliver/", kind: "docs", verifiedAt: "2026-10-02T11:47:48Z" },
        { label: "fastlane docs: supply (Google Play metadata)", url: "https://docs.fastlane.tools/actions/supply/", kind: "docs", verifiedAt: "2026-10-02T11:47:48Z" },
        { label: "GitHub Docs: Running variations of jobs in a workflow (matrix)", url: "https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations", kind: "docs", verifiedAt: "2026-10-02T11:53:19Z" },
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
          title: "Automating App Store Connect and Google Play Releases with Fastlane",
          channel: "ByteDistrict",
          url: "https://www.youtube.com/watch?v=NCmkL__Mq-I",
          videoId: "NCmkL__Mq-I",
          verifiedAt: "2026-10-02T12:01:00Z",
        },
        {
          title: "White-Labeling Android Apps at Scale Using Jenkins CI/CD — Mohammad Saqeeb",
          channel: "DroidTribe",
          url: "https://www.youtube.com/watch?v=iCrHs6uB6d0",
          videoId: "iCrHs6uB6d0",
          verifiedAt: "2026-10-02T12:01:01Z",
        },
      ],
      handbook: {
        stages: ["wl-core-upgrades", "wl-store-listing"],
        rules: ["client-owned-store-accounts", "secure-credential-sharing", "core-upgrade-custom-impact"],
        templates: ["whitelabel-onboarding", "golive-checklist"],
      },
      sections: [
        {
          heading: "The client register: one row per client",
          body:
            "The register is the portfolio's single source of truth. A typical set of columns:\n\n- Client and reseller (if any), [[term:spoc]] and account manager.\n- Accounts and owners: [[term:apple-developer-account]], [[term:google-play-console]], [[term:hosting-account]], domain, [[term:payment-gateway-account]], [[term:messaging-provider-accounts]], and Oyelabs' role in each.\n- Identifiers: bundle ID, package name, Apple SKU.\n- Core version, date of last upgrade, any deferral and its deadline.\n- Flags switched on and key configuration choices.\n- Custom modules and the files they touch.\n- Licence or [[term:subscription-plan]], start and renewal dates, support plan.\n- Store status: live versions, last rejection and its cause.\n\nNo credentials go in the register. It records *where* they are and who owns them; the secrets themselves stay in the approved secure store.",
        },
        {
          heading: "Templates that make each client the same steps",
          body:
            "- **Onboarding checklist** (the handbook template below): every item a new client must provide or decide, with an owner and a date. Start every client from it.\n- **Listing-content request:** the fields, limits and languages the client must supply.\n- **Privacy data list:** per product, the data and SDKs, kept current by the tech lead, sent to each client for its policy and declarations.\n- **UAT guide:** the standard scenarios for the product.\n- **Go-live checklist and support plan:** the same structure for every launch.\n- **Upgrade notice:** the plain-language note for each core release.\n\nAfter each launch, ask: what went wrong that a template could have prevented? Update the template, not just the project.",
        },
        {
          heading: "Automation worth asking for",
          body:
            "You do not need to build these, but you should know they exist and when to ask the tech lead for them:\n\n- **Per-client configuration in files.** Each client's name, identifiers, colours, keys references and flags in one folder or repo, so a build is \"core + this folder\".\n- **CI matrix builds.** One workflow builds every client's variant in parallel. A core fix reaches every client's build the same day.\n- **Shared code signing with fastlane `match`.** Certificates and profiles stored once, encrypted, and used by every developer and the CI, instead of living on one laptop.\n- **Store metadata with `deliver` and `supply`.** Each client's listing text and screenshots live in files and are uploaded by script, so updates across 15 listings take minutes and nothing is pasted into the wrong client's store.\n- **A release calendar using rings.** Canary, early adopters, everyone else, with customised clients last.\n\nAutomation removes whole classes of error: wrong client's assets, expired certificates, a forgotten listing update.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A white-label salon-booking product, now with 12 clients across the Gulf and the UK.*\n\n1. **Register.** The PM keeps one sheet: each client's accounts and Oyelabs' role, identifiers, core version, flags, custom modules, renewal date. Every Monday they review it for upcoming renewals, deferral deadlines and certificate expiry dates.\n2. **New client.** A chain in Riyadh signs. The PM copies the onboarding template, fills owners and dates, and sends the client the listing-content request and accounts checklist on day one.\n3. **Builds.** The tech lead adds the client's configuration folder. The CI matrix now builds 13 variants; signing comes from the shared `match` store.\n4. **Listing.** The client's text and screenshots go into the metadata folder and are uploaded with `deliver` and `supply`, reviewed by the PM in each store before submission.\n5. **Core release.** Core 4.2 goes out in rings: demo instance, three volunteers, then the rest, with the two customised clients last after impact checks.\n6. **Lesson fed back.** A rejection for a missing demo account at client 11 becomes a line in the go-live checklist and the UAT guide, so client 13 never hits it.",
        },
        {
          heading: "Offboarding is part of the life cycle",
          body:
            "Microsoft's tenant life-cycle guidance covers onboarding, updates, moving between tiers and **offboarding**, including what happens to data when a client leaves. Plan it before the first client leaves:\n\n- Which data is returned or deleted, in what format, by when.\n- Removing Oyelabs' access from the client's accounts, and rotating any shared keys.\n- Stopping builds and removing the client's configuration from the CI matrix.\n- Updating the register.\n\nWhat the client is entitled to on exit depends on the contract. Follow it, and the relevant Oyelabs SOP. Not legal advice: the signed contract always wins.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Credentials in the register.** Move them to the secure store and rotate them. Follow the Oyelabs rule in the handbook card below.\n- **One developer's laptop holds the signing certificates.** Move to shared signing before that person is on leave on release day.\n- **Listings edited by hand in 15 consoles.** Errors are a matter of time. Ask for metadata in files and scripted uploads.\n- **The register is out of date.** It is worse than none, because people trust it. Make updating it part of every stage's exit.\n- **Templates never change.** Add a short \"what should the template have caught?\" step to every launch review.",
        },
        {
          heading: "Your checklist",
          body:
            "- A current client register, with no secrets in it.\n- Every new client started from the onboarding template.\n- Standard listing, privacy, UAT, go-live and upgrade-notice templates in use.\n- Per-client configuration in files and CI matrix builds.\n- Shared code signing and scripted store metadata.\n- A ring-based release calendar.\n- A weekly look at renewals, deferral deadlines and certificate expiries.\n- An offboarding plan.\n- Lessons from each launch written back into the templates.",
        },
      ],
      sop: [
        {
          title: "Our white-label client register",
          prompt:
            "[Oyelabs SOP – admin to fill] Where the client register lives, its columns, who owns it, how often it is reviewed, and where the per-client configuration and credentials are kept.",
        },
        {
          title: "Our white-label offboarding steps",
          prompt:
            "[Oyelabs SOP – admin to fill] What happens when a white-label client leaves: data export or deletion, removing access, rotating keys, and closing the register entry.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b12-portfolio-templates-q1",
          prompt: "What does fastlane `match` solve for a white-label portfolio?",
          options: [
            "It uploads store screenshots",
            "It shares code-signing certificates and profiles across the team and CI from one encrypted store",
            "It merges core releases into forks",
            "It writes store descriptions",
          ],
          correctIndex: 1,
          explanation: "match keeps signing in one shared place instead of on individual machines.",
        },
        {
          id: "pmp-b12-portfolio-templates-q2",
          prompt: "Which fastlane tools upload store listing metadata? (Select all that apply.)",
          options: ["deliver, for the App Store", "supply, for Google Play", "match", "rerere"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "deliver handles App Store metadata and screenshots; supply handles Google Play metadata and binaries. rerere is a git feature.",
        },
        {
          id: "pmp-b12-portfolio-templates-q3",
          prompt: "Which belong in the client register? (Select all that apply.)",
          options: [
            "Who owns each store account and Oyelabs' role in it",
            "Bundle ID and package name",
            "The production admin password",
            "Core version, custom modules and renewal date",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "The register says where credentials live and who owns them, never the secrets themselves.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b12-portfolio-templates-q4",
          prompt: "What does a CI matrix build give a portfolio of 12 clients?",
          options: [
            "One workflow that builds every client's variant, so a core fix reaches all builds the same day",
            "A separate repository per client",
            "Faster store review",
            "Automatic UAT sign-off",
          ],
          correctIndex: 0,
          explanation: "A matrix runs the same job across every client configuration.",
        },
        {
          id: "pmp-b12-portfolio-templates-q5",
          prompt: "The only copy of the iOS distribution certificate is on one developer's laptop, and they are on leave on release day. Which portfolio practice would have prevented this?",
          options: ["A UAT guide", "Shared code signing (for example fastlane match)", "A larger description field", "A staged rollout"],
          correctIndex: 1,
          explanation: "Shared, encrypted signing means any authorised developer or the CI can sign.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b12-portfolio-templates-q6",
          prompt: "Client 11 was rejected for a missing reviewer demo account. What is the portfolio-level response?",
          options: [
            "Fix it for client 11 only",
            "Fix it, and add the item to the go-live checklist and UAT guide so later clients do not repeat it",
            "Blame the reviewer",
            "Stop onboarding new clients",
          ],
          correctIndex: 1,
          explanation: "Lessons belong in the templates, not just in the project.",
        },
        {
          id: "pmp-b12-portfolio-templates-q7",
          prompt: "Which should be planned for when a white-label client leaves? (Select all that apply.)",
          options: [
            "What happens to their data, and by when",
            "Removing Oyelabs' access and rotating shared keys",
            "Removing their configuration from the build matrix",
            "Keeping their app live under Oyelabs' account",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Offboarding is part of the tenant life cycle. The apps live in the client's accounts, so they are not Oyelabs' to keep.",
        },
        {
          id: "pmp-b12-portfolio-templates-q8",
          prompt: "Why is an out-of-date register dangerous?",
          options: [
            "It is not: any register is better than none",
            "People trust it, so wrong versions, owners or dates lead to wrong decisions",
            "Stores audit it",
            "It slows the CI",
          ],
          correctIndex: 1,
          explanation: "Make updating it part of each stage's exit criteria.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b12-portfolio-templates-q9",
          prompt: "Fifteen clients' Play listings need the same new privacy wording. What is the safest approach?",
          options: [
            "Edit each console by hand",
            "Keep each client's metadata in files and upload with a script such as supply, reviewing each before publishing",
            "Copy one client's listing to all the others",
            "Ask each client to do it",
          ],
          correctIndex: 1,
          explanation: "Scripted metadata avoids pasting into the wrong client's store, while each client's own text is preserved.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "whitelabel-onboarding",
        prompt:
          "A new client joins the salon-booking portfolio. From the notes, complete the key rows of their onboarding and register entry.",
        context:
          "**Client:** Luma Salons, a chain of six salons in Riyadh. Domain: lumasalons.sa. Signed directly with Oyelabs (no reseller).\n\n**Product:** white-label salon booking, core 4.2.0. Customer app, staff app, admin panel.\n\n**Agreed:** loyalty tiers ON, gift cards ON, home visits OFF. One custom module: a booking deposit rule, quoted as a CR.\n\n**Portfolio ring plan (from your portfolio lead):** demo instances = Canary; clients with no custom modules = Early adopters; any client with a custom module = General, after an impact check.\n\n**Accounts:** the client will open its own Apple Developer (organisation) and Google Play Console accounts and invite Oyelabs.\n\n**Commercial:** subscription starts at go-live; renewal annually.",
        fields: [
          { id: "bundle", label: "Bundle ID and package name to use", input: "text", required: true, placeholder: "e.g. com.example.app" },
          {
            id: "appleOwner",
            label: "Who owns the Apple Developer account?",
            input: "select",
            required: true,
            options: ["Oyelabs", "Luma Salons (organisation account)", "The demo product owner", "Shared between Oyelabs and the client"],
          },
          { id: "version", label: "Core version at launch", input: "text", required: true },
          { id: "flags", label: "Configuration and flags", input: "textarea", required: true },
          { id: "custom", label: "Custom modules and their upgrade impact", input: "textarea", required: true },
          {
            id: "ring",
            label: "Release ring for future core upgrades",
            input: "select",
            required: true,
            options: ["Canary", "Early adopters", "General"],
          },
          { id: "renewal", label: "Licence and renewal notes", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "appleOwner", expected: "Luma Salons (organisation account)" },
          { fieldId: "ring", expected: "General" },
        ],
        rubric: [
          { label: "Identifiers follow the client's domain", points: 2, description: "Uses the client's reverse domain (e.g. com.lumasalons.app) for both identifiers, not an agency or demo name." },
          { label: "Custom module recorded with its impact", points: 2, description: "Names the deposit-rule module, notes it was quoted as a CR, and that it needs an impact check on every core upgrade." },
          { label: "Configuration and commercial dates are complete", points: 2, description: "Lists the flags on and off, and records that the subscription starts at go-live with annual renewal." },
        ],
        sampleAnswer: {
          bundle: "com.lumasalons.app (both Apple bundle ID and Google package name)",
          appleOwner: "Luma Salons (organisation account)",
          version: "4.2.0",
          flags: "Loyalty tiers ON, gift cards ON, home visits OFF.",
          custom: "Booking deposit rule, built as a separate custom module and quoted as a CR. Needs a tech lead impact check before every core upgrade; adaptation effort handled per the core-upgrade rule.",
          ring: "General",
          renewal: "Subscription starts on the go-live date; renews annually. Record both dates in the register and review renewals weekly.",
        },
      },
    },
  ],
} satisfies Module;
