import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-b10",
  trackId: "pm",
  name: "Go-live, licence & support plan",
  description:
    "Launching a white-label client for real: the go-live checklist, how phased release and staged rollout actually work for a first release versus an update, starting the licence or subscription, and handing over a support plan the client can use.",
  topics: [
    {
      id: "pmp-b10-golive-licence-support",
      moduleId: "pmp-b10",
      trackId: "pm",
      title: "Go-live, licence and support plan",
      summary:
        "Store approval is not [[term:go-live]]. For a [[term:white-label]] client, go-live is the moment three things become true together: the apps and the production [[term:client-instance]] are live and working, the commercial relationship moves from setup to the running [[term:licence]] or [[term:subscription-plan]], and the client knows exactly how to get help. Miss any one and the launch feels unfinished, however good the app is.\n\nRun go-live from a checklist, not from memory. Production keys live, push and payments tested in production, admin users created, the support channel agreed, the [[term:sla]] and [[term:escalation-matrix]] shared, the client's admins trained, and the commercial pre-conditions in the contract met. Then release the approved apps on the agreed date and watch the first days closely.\n\nKnow what the stores can and cannot do for you. Apple's phased release and Google's staged rollout limit risk, but only for **updates**: Google's staged rollout is not available for a first release, and Apple's phased release applies to version updates. The first release reaches everyone who finds it, so the smoke test must happen before you press release, not after.\n\nThe common mistake is going live before the payment terms are met because \"the client is excited\". Once the client's customers are using the app, Oyelabs has lost its leverage, and the conversation about the unpaid setup fee becomes awkward. Follow the contract and the Oyelabs rules in the handbook cards below. Not legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 45,
      isMilestone: true,
      webRefs: [
        { label: "App Store Connect Help: Release a version update in phases", url: "https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases", kind: "docs", verifiedAt: "2026-10-02T11:46:20Z" },
        { label: "Play Console Help: Release app updates with staged rollouts", url: "https://support.google.com/googleplay/android-developer/answer/6346149?hl=en", kind: "docs", verifiedAt: "2026-10-02T11:46:41Z" },
        { label: "Microsoft Learn: Pricing models for a multitenant solution", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/pricing-models", kind: "docs", verifiedAt: "2026-10-02T11:49:13Z" },
        { label: "Atlassian: What is an SLA?", url: "https://www.atlassian.com/itsm/service-request-management/slas", kind: "article", verifiedAt: "2026-10-02T11:55:08Z" },
      ],
      video: {
        title: "Do You Know How Mobile Apps Are Released?",
        channel: "ByteByteGo",
        url: "https://www.youtube.com/watch?v=RIX4ufelA58",
        videoId: "RIX4ufelA58",
        verifiedAt: "2026-10-02T12:00:54Z",
      },
      alternateVideos: [
        {
          title: "SaaS Pricing Models Explained in 5 Minutes",
          channel: "Rob Walling",
          url: "https://www.youtube.com/watch?v=lC6Gpn0ugFI",
          videoId: "lC6Gpn0ugFI",
          verifiedAt: "2026-10-02T12:00:54Z",
        },
        {
          title: "What Is a Service Level Agreement (SLA)? | SLA Explained | The Knowledge Academy",
          channel: "The Knowledge Academy",
          url: "https://www.youtube.com/watch?v=iSCWolgYm_Y",
          videoId: "iSCWolgYm_Y",
          verifiedAt: "2026-10-02T12:00:55Z",
        },
      ],
      handbook: {
        stages: ["wl-golive"],
        rules: ["uat-signoff-before-golive", "secure-credential-sharing", "escalation-levels"],
        templates: ["golive-checklist", "escalation-matrix-template", "hypercare-log"],
      },
      sections: [
        {
          heading: "First release versus updates: what the stores give you",
          body:
            "**Apple phased release (version updates).** Over seven days the update goes automatically to a growing share of users with automatic updates on: 1%, 2%, 5%, 10%, 20%, 50%, then 100%. You can pause for up to 30 days in total. Anyone can still download the update manually from the store at any time.\n\n**Google staged rollout.** You choose the percentage of users who get the update. It does not increase by itself: you raise it, or halt it if something goes wrong. It is **not available for the first release** of an app.\n\n**What this means for a white-label launch.**\n- The first release has no safety net. Smoke-test the production instance and the release build before you press release.\n- Use phased release and staged rollouts for every update afterwards, especially core upgrades that touch many clients at once.\n- There is no store \"rollback\". If a release is bad, you halt the rollout and ship a [[term:hotfix]]. Plan that path before go-live.",
        },
        {
          heading: "The commercial switch: setup to licence",
          body:
            "Go-live is usually when the client stops paying for setup and starts paying for the running product. Agencies use different shapes; these are typical options, not Oyelabs policy:\n\n- a one-time [[term:setup-fee]] plus a monthly or annual licence or subscription;\n- a perpetual licence plus an annual maintenance contract ([[term:amc]]);\n- a revenue share;\n- a source-code purchase, sometimes with [[term:escrow]] protecting a client who has only a licence.\n\nSaaS pricing models give more options: per user, per active user, per unit (per store, per vehicle), tiers with different SLAs, flat rate. Microsoft's guidance warns that flat rates can turn unprofitable with heavy users and that changing models can cause \"bill shock\".\n\nThe PM's job is not to set prices. It is to make sure the contract's go-live conditions are met, the start date of the licence or subscription is recorded, and the client hears about it from BD or the account manager, not from an unexpected [[term:invoice]]. Not legal advice: the signed contract always wins.",
        },
        {
          heading: "A support plan the client can actually use",
          body:
            "A support plan is more than an email address. Before go-live the client should have, in writing:\n\n- **The channel**: where to report issues (a ticket desk, a shared email), not a developer's personal number.\n- **The SLA**: [[term:response-time]] and [[term:resolution-time]] targets per [[term:severity]], and the hours they apply.\n- **The escalation matrix**: who to contact if an issue is not moving, at each level.\n- **What is covered**: what the licence or [[term:support]] plan includes, and what becomes a [[term:change-request]].\n- **[[term:hypercare]]**: the first days or weeks after launch, with closer monitoring and a named owner.\n\nTrain the client's admins on the admin panel before launch. An untrained admin generates support tickets that are really training questions, and blames the product for them.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A white-label grocery app for a client in Oman.* Apple and Google approved both apps on Tuesday under manual release and managed publishing.\n\n1. **Wednesday: go-live checklist.** The tech lead confirms the production instance runs on the client's [[term:hosting-account]], payment keys are the client's live ones, push uses the client's credentials, and a real order and refund work end to end. The PM confirms the setup milestone invoice has been paid, as the contract requires before launch.\n2. **Wednesday: admin training.** One hour with the client's operations team: adding products, handling refunds, managing drivers. Recorded and shared.\n3. **Thursday 10:00: release.** Both apps are released. The PM checks the listings appear in every storefront during the day and QA installs the store builds.\n4. **Support handover.** The client receives the support plan: ticket channel, SLA per severity, escalation matrix, hypercare for the first two weeks with a daily check-in, and what counts as a change request.\n5. **Commercial.** The account manager confirms the subscription starts on the go-live date and records it, with the renewal date, in the client register.\n6. **Week 2.** The first update ships with a 10% staged rollout on Google and phased release on Apple, raised after a day with no new crashes.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Launch before payment terms are met.** If it already happened, raise it with BD the same day and agree how the contract will be enforced. Next time make payment a hard checklist item.\n- **A staged rollout planned for the first release.** It is not available. Move the risk control earlier: production smoke test, a soft launch without marketing, and a ready hotfix path.\n- **Test keys still in production.** Orders or payments fail on day one. Switch keys before release; verify with a real low-value transaction.\n- **Credentials sent in the go-live email.** Rotate them and use the approved channel. Follow the Oyelabs rule in the handbook card below.\n- **No agreed support channel.** The client messages developers directly and nothing is tracked. Send the support plan and redirect politely every time.\n- **Admins never trained.** Book the session now; it is cheaper than a month of training tickets.",
        },
        {
          heading: "Your checklist",
          body:
            "- Apps approved; manual release and managed publishing set.\n- Production instance live on the client's accounts and smoke-tested with real transactions.\n- Live payment keys, client push credentials and production configuration confirmed.\n- Contract pre-conditions for go-live (such as the setup fee) met.\n- Admin training done and recorded.\n- Support channel, SLA, escalation matrix and hypercare plan shared in writing.\n- Licence or subscription start date and renewal date recorded.\n- Hotfix path agreed, since stores have no rollback.\n- Phased release and staged rollout planned for every later update.",
        },
      ],
      sop: [
        {
          title: "Our white-label go-live and licence activation",
          prompt:
            "[Oyelabs SOP – admin to fill] Who confirms go-live payment pre-conditions, how the licence or subscription is activated and recorded, the standard support plan sent to white-label clients, and the hypercare length per product.",
        },
        {
          title: "Our admin training session",
          prompt: "[Oyelabs SOP – admin to fill] The standard admin-panel training agenda per product, who runs it, and where recordings and guides are shared with the client.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b10-golive-licence-support-q1",
          prompt: "The client wants to launch version 1.0 on Google Play to 10% of users first, \"to be safe\". What do you say?",
          options: [
            "Good idea, set a 10% staged rollout",
            "Staged rollout is not available for a first release; reduce risk with a production smoke test, a soft launch and a ready hotfix path",
            "Use Apple's phased release instead for both stores",
            "Release to 10% of countries instead",
          ],
          correctIndex: 1,
          explanation: "Google's staged rollouts are for updates, not the first release. Risk control must happen before release.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b10-golive-licence-support-q2",
          prompt: "Which are true about Apple's phased release? (Select all that apply.)",
          options: [
            "It applies to version updates",
            "It goes 1%, 2%, 5%, 10%, 20%, 50%, 100% over seven days",
            "You can pause it for up to 30 days in total",
            "Users cannot download the update manually during it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Anyone can still download the update manually from the store; the phases only affect automatic updates.",
        },
        {
          id: "pmp-b10-golive-licence-support-q3",
          prompt: "Google staged rollout is at 20% and crash reports spike. What can you do?",
          options: [
            "Wait: it will reach 100% automatically",
            "Halt the rollout, fix, and ship a new version",
            "Roll the store back to the previous build",
            "Nothing: staged rollouts cannot be changed",
          ],
          correctIndex: 1,
          explanation: "Staged rollouts do not increase automatically and can be halted. There is no store rollback; the remedy is a new build.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b10-golive-licence-support-q4",
          prompt: "The apps are approved but the setup fee the contract requires before launch is unpaid. The client says, \"Launch today, we'll pay next week.\" What do you do?",
          options: [
            "Launch: the client is happy and will pay",
            "Do not release; raise it with BD or the account manager and follow the contract and the Oyelabs rule",
            "Launch only the Android app",
            "Launch and add a late fee",
          ],
          correctIndex: 1,
          explanation: "Going live before payment terms are met is a known pitfall. The decision belongs to BD and the contract, not to the PM alone.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b10-golive-licence-support-q5",
          prompt: "What should the client's support plan include? (Select all that apply.)",
          options: [
            "The channel for reporting issues",
            "Response and resolution targets per severity",
            "The escalation matrix",
            "A developer's personal phone number for urgent issues",
            "What the plan covers and what becomes a change request",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation: "A personal number bypasses tracking and the SLA. Use the agreed channel and escalation matrix.",
        },
        {
          id: "pmp-b10-golive-licence-support-q6",
          prompt: "A heavy-usage client is on a flat-rate licence. According to Microsoft's pricing guidance, what is the risk?",
          options: [
            "None: flat rates are always profitable",
            "Flat rates are easy to sell but can become unprofitable with heavy users",
            "Flat rates are illegal for SaaS",
            "The client will be overcharged",
          ],
          correctIndex: 1,
          explanation: "Flat-rate pricing is simple but does not scale with usage. That is a BD conversation, flagged by the PM if usage grows.",
        },
        {
          id: "pmp-b10-golive-licence-support-q7",
          prompt: "Which of these show the commercial switch at go-live was handled well? (Select all that apply.)",
          options: [
            "The licence or subscription start date is recorded",
            "The renewal date is in the client register",
            "The client learns about the subscription from its first invoice",
            "BD or the account manager confirmed the start with the client",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "The client should hear about the running charges before the invoice, from the right person.",
        },
        {
          id: "pmp-b10-golive-licence-support-q8",
          prompt: "A day after launch, the client's admin raises six tickets that are all \"how do I\" questions about the admin panel. What does this tell you?",
          options: [
            "The product is broken",
            "Admin training was missing or not enough; run or repeat it and share a guide",
            "The SLA is too short",
            "The client should pay for each ticket",
          ],
          correctIndex: 1,
          explanation: "Training questions logged as tickets are a sign training was skipped. It is on the exit criteria of this stage.",
        },
        {
          id: "pmp-b10-golive-licence-support-q9",
          prompt: "Why is the production smoke test so important before the first release in particular?",
          options: [
            "Because stores re-review the app after release",
            "Because there is no staged rollout for a first release and no store rollback, so the first release reaches everyone",
            "Because Apple requires a smoke-test report",
            "It is not; test after release",
          ],
          correctIndex: 1,
          explanation: "With no gradual rollout and no rollback, problems are found by real customers unless you test first.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "This is the draft go-live checklist for a white-label grocery app for a client in Oman: its first release on both stores. Mark every line that is wrong or risky.",
        segments: [
          { id: "g1", text: "Apps approved on both stores; manual release (Apple) and managed publishing (Google) set", issue: null },
          { id: "g2", text: "Production instance on the client's hosting account, smoke-tested with a real order and refund", issue: null },
          { id: "g3", text: "Payment gateway: keep the sandbox keys for launch week and switch to live keys after launch", issue: "Sandbox keys in production mean real customers cannot pay. Live keys must be in place and tested before release." },
          { id: "g4", text: "Google Play: start version 1.0 with a 10% staged rollout to limit risk", issue: "Staged rollout is not available for a first release. Risk control must come from testing before release." },
          { id: "g5", text: "Setup fee milestone invoice raised; launch goes ahead even though it is unpaid, to be sorted out later", issue: "Going live before the contract's payment pre-conditions are met removes leverage. Follow the contract and escalate to BD." },
          { id: "g6", text: "Push notifications use the client's own APNs key and Firebase project", issue: null },
          { id: "g7", text: "Admin training for the client's operations team booked for the day before release", issue: null },
          { id: "g8", text: "Support plan, SLA per severity and escalation matrix sent to the client SPOC", issue: null },
          { id: "g9", text: "Support channel: the client can WhatsApp the lead developer directly for any issue", issue: "A developer's personal chat bypasses the agreed support channel, the SLA and tracking." },
          { id: "g10", text: "Subscription start date and renewal date recorded in the client register", issue: null },
          { id: "g11", text: "If the release is bad: halt any rollout and ship a hotfix; owner and on-call agreed", issue: null },
          { id: "g12", text: "Hypercare for the first two weeks, with a daily check-in and a named owner", issue: null },
          { id: "g13", text: "Production admin password and API keys pasted into the go-live email thread for convenience", issue: "Credentials must go through the approved secure channel, never email or chat. Rotate anything already sent." },
        ],
        askExplanation: true,
      },
    },
  ],
} satisfies Module;
