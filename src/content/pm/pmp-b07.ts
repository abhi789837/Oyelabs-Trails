import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-b07",
  trackId: "pm",
  name: "White-label lifecycle: Rebranded builds, QA & UAT",
  description:
    "Turning a configured white-label instance into rebranded builds the client can test: build variants, what a rebrand QA pass must catch, test distribution through TestFlight and Play testing tracks, and a UAT sign-off that separates real defects from disguised customisation.",
  topics: [
    {
      id: "pmp-b07-rebranded-builds-qa",
      moduleId: "pmp-b07",
      trackId: "pm",
      title: "Rebranded builds, QA and UAT",
      summary:
        "A rebranded build looks finished long before it is. The core product already works, so the team is tempted to treat QA as a formality. But a [[term:white-label]] app has its own failure modes: the demo brand's name left in a push notification, a previous client's logo in a password-reset email, payment keys still in test mode, or a [[term:bundle-id]] that does not belong to the client. Any one of these reaches the store reviewer or the client's customers and makes Oyelabs look careless.\n\nThe stage has three parts. First, developers generate the [[term:build]] for this [[term:client-instance]] from the core, usually as a build variant (an Android product flavor or an iOS target) that carries the client's [[term:theming]], identifiers and keys. Second, [[term:qa]] tests two things: that the [[term:rebranding]] and [[term:configuration]] are right on every screen and every email, and that nothing regressed. Third, the client runs [[term:uat]] on builds distributed through TestFlight and a Google Play testing track, and gives a written [[term:sign-off]].\n\nThe PM owns the flow, not the testing. You make sure the test builds reach the right people, that UAT has a clear window, and that every piece of feedback is classified before anyone starts coding.\n\nThe common mistake is accepting UAT feedback as a to-do list. In white-label, many \"issues\" are really requests for [[term:customisation]]: a different checkout flow, an extra field. Those are not defects in the rebrand. They go through a [[term:change-request]], and the sign-off records them as deferred, not as blockers.",
      level: "advanced",
      estMinutes: 45,
      isMilestone: true,
      webRefs: [
        { label: "Android Developers: Configure build variants (product flavors)", url: "https://developer.android.com/build/build-variants", kind: "docs", verifiedAt: "2026-10-02T11:48:46Z" },
        { label: "App Store Connect Help: TestFlight overview", url: "https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview", kind: "docs", verifiedAt: "2026-10-02T11:50:07Z" },
        { label: "Play Console Help: Set up an open, closed, or internal test", url: "https://support.google.com/googleplay/android-developer/answer/9845334?hl=en", kind: "docs", verifiedAt: "2026-10-02T11:46:39Z" },
        { label: "Apple Developer: Configuring a new target in your project", url: "https://developer.apple.com/documentation/xcode/configuring-a-new-target-in-your-project", kind: "docs", verifiedAt: "2026-10-02T11:53:20Z" },
      ],
      video: {
        title: "Development and Maintenance of White-Label Android Apps | Dmitrii Nikitin | Conf42 Chaos Engr 2025",
        channel: "Conf42",
        url: "https://www.youtube.com/watch?v=W7IGcIBB02Y",
        videoId: "W7IGcIBB02Y",
        verifiedAt: "2026-10-02T12:00:43Z",
      },
      alternateVideos: [
        {
          title: "Swift - White label iOS App | How to create multiple targets app | How to create white label apps",
          channel: "Code with Deepak",
          url: "https://www.youtube.com/watch?v=JZY0NSNhsww",
          videoId: "JZY0NSNhsww",
          verifiedAt: "2026-10-02T12:00:44Z",
        },
        {
          title: "TestFlight & Xcode: Upload, Distribute, and Beta Test Your iOS App In Under 10 Minutes! (2025)",
          channel: "Noah Does Coding",
          url: "https://www.youtube.com/watch?v=x0d8Jx3HvdI",
          videoId: "x0d8Jx3HvdI",
          verifiedAt: "2026-10-02T12:00:45Z",
        },
      ],
      handbook: {
        stages: ["wl-builds-qa"],
        rules: ["uat-signoff-before-golive", "configuration-vs-customisation", "secure-credential-sharing"],
        templates: ["uat-signoff"],
      },
      sections: [
        {
          heading: "How a rebranded build is made",
          body:
            "You do not need to build the app yourself, but you need to know what the developers are doing, because it decides what QA must check.\n\n- **One codebase, many variants.** On Android, each client is usually a *product flavor*: the same code with its own `applicationId` (the [[term:package-name]]), app name, icon, colours and keys. On iOS the same idea is a separate *target* or scheme with its own [[term:bundle-id]].\n- **Per-client inputs.** The variant reads the [[term:brand-kit]] (logo, colours, fonts, splash), the identifiers, the API base URL of this [[term:client-instance]], and the client's [[term:api-keys]]: maps, push, payments, analytics.\n- **Panels too.** The admin panel, vendor panel and transactional emails are rebranded as well. They are often forgotten because they are not in the store.\n\nThe identifiers are the dangerous part. A bundle ID cannot be changed once a build has been uploaded to App Store Connect, and Google treats a new `applicationId` as a completely different app. So confirm the identifiers are the client's own (for example `com.clientbrand.app`) *before* the first upload, even a test upload.",
        },
        {
          heading: "What rebrand QA must catch",
          body:
            "A normal [[term:regression-test]] proves the core still works. Rebrand QA adds checks that only exist because this is a rebrand. A typical checklist:\n\n1. App name, icon and splash screen on both platforms, including the small icon used in notifications.\n2. Colours and fonts on every screen, including empty states, error screens and dark mode.\n3. Bundle ID and package name match the ones agreed with the client.\n4. Deep links and associated domains open this client's app, not the demo app.\n5. Push notifications arrive, using this client's own push credentials.\n6. Payment keys are the client's, and in live mode for the production build.\n7. Legal URLs (the [[term:privacy-policy-url]] and terms) open the client's pages.\n8. The support email and phone are the client's.\n9. No string, image or email template from the demo brand or from any other client is left anywhere.\n\nItem 9 is the one that hurts most. Search the built app and the email templates for the demo product name and for the names of recent clients. A previous client's name in a new client's password-reset email is a confidentiality problem, not a cosmetic one.",
        },
        {
          heading: "Distributing test builds",
          body:
            "**Apple: TestFlight.** Up to 100 internal testers, who must be users in the client's App Store Connect team, and up to 10,000 external testers invited by email or public link. A build stays testable for 90 days. The first build sent to *external* testers goes through beta app review, so allow for it in the plan.\n\n**Google: testing tracks.** Play Console offers internal, closed and open testing. Internal testing is the quick one for the client's UAT team. If the client's Play account is a *personal* account created after 13 November 2023, Google requires a closed test with at least 12 opted-in testers for 14 consecutive days before production access. That is one reason clients should open an organisation account (see the accounts module).\n\nEither way, the builds live in the [[term:client-owned-accounts]], so the client must have invited Oyelabs before you can distribute anything. If they have not, that is a [[term:client-dependency]] to chase now, not at submission.",
        },
        {
          heading: "Running UAT and triaging feedback",
          body:
            "Agree the UAT window, the testers and the channel for feedback before you send the build. A typical window is a few working days. Give the client a short list of scenarios that matter for this rebrand: sign up, place an order, pay, receive a push, reset a password, see the admin panel with their branding.\n\nWhen feedback arrives, classify every item before anyone fixes anything:\n\n- **Defect in the rebrand or configuration** (wrong colour, demo logo, wrong key): a [[term:bug]], fixed as part of the stage.\n- **Defect in the core** that exists for every client: a bug too, but it goes to the core team so all instances get the fix.\n- **A setting the client wants changed** that the [[term:configuration-panel]] or a [[term:feature-toggle]] supports: configuration, usually quick.\n- **A request for different behaviour** that needs code: [[term:customisation]] or a [[term:new-feature]]. It becomes a [[term:change-request]] and is listed as deferred on the sign-off.\n\nFor the billing side of each class, follow the Oyelabs rules in the handbook cards below.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A white-label grocery app rebranded for a client in Oman.* The core has a customer app, a driver app and an admin panel.\n\n1. **Builds.** The tech lead creates the client's flavor and target with `com.zahrafresh.app` as both identifiers, agreed in writing during the accounts stage. Keys come from the client's own accounts through the approved secure channel.\n2. **Internal QA.** QA runs the core regression suite plus the rebrand checklist. They find the demo name \"FreshCart\" in the order-confirmation email and the driver app's notification icon still in the demo colour. Both are fixed in a day.\n3. **Distribution.** The PM checks the client has invited Oyelabs to App Store Connect and Play Console, then the team ships the build to TestFlight internal testers and the Play internal track. The PM sends the client a one-page UAT guide: six scenarios, a five-day window, and one spreadsheet for feedback.\n4. **Triage.** The client logs 11 items. Four are rebrand defects, two are core defects (passed to the core team), three are configuration changes done in the admin panel, and two are requests: an Arabic loyalty banner and a different checkout step. The PM raises one CR for the two requests and does not let anyone start them.\n5. **Sign-off.** After the fixes and a retest, the client signs the [[term:uat]] sign-off with the two CR items listed as deferred and one minor core defect listed as a [[term:known-issues|known issue]] with a target release.\n\nThe result: the stage closed in eight working days, the client knew exactly what was and was not in the launch, and the store listing could start with final builds.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **The wrong bundle ID was uploaded.** If a build with an agency-style ID (for example `com.agency.demo`) reached the client's App Store Connect, that app record is stuck with it. Recovery: create a new app record with the correct ID before anything is submitted, and tell the client why. The cost is small now and huge after launch.\n- **The demo brand leaked to the client.** Apologise, fix it, and add a text search for the demo and previous-client names to the build pipeline so it cannot recur.\n- **UAT never ends.** The client keeps testing and adding items. Recovery: restate the agreed window and scenarios, triage what you have, and ask for sign-off with deferred items listed. Customisation is not a reason to withhold sign-off.\n- **Fixes made without classification.** A developer \"just changed\" the checkout flow for the client. Now the instance has an untracked customisation that will conflict with the next core upgrade. Recovery: record it as a custom change, raise the CR retroactively if the contract allows, and flag it in the instance register.\n- **Shared test credentials over chat.** Rotate them and move them to the approved channel. Follow the Oyelabs rule in the handbook card below.",
        },
        {
          heading: "Your checklist",
          body:
            "- Identifiers confirmed in writing and used in the very first upload.\n- Client's own keys in place, shared through the approved channel.\n- Core regression plus the rebrand checklist passed, including emails and panels.\n- Text search done for the demo name and other clients' names.\n- Oyelabs invited to the client's App Store Connect and Play Console.\n- Builds on TestFlight and a Play testing track; beta review time allowed for if external testers are used.\n- UAT window, testers, scenarios and feedback channel agreed in writing.\n- Every feedback item classified: rebrand defect, core defect, configuration, or CR.\n- Written UAT sign-off with deferred items and known issues listed.",
        },
      ],
      sop: [
        {
          title: "Our rebrand QA checklist and build hand-off",
          prompt:
            "[Oyelabs SOP – admin to fill] The rebrand QA checklist each product uses (screens, emails, panels, the demo-name search), who generates per-client builds, where per-client keys are stored, and how test builds are handed to the client for UAT.",
        },
        {
          title: "Our UAT guide for white-label clients",
          prompt:
            "[Oyelabs SOP – admin to fill] The standard UAT window, the scenario list per product, the feedback sheet or tool, and who on the Oyelabs side triages client feedback.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b07-rebranded-builds-qa-q1",
          prompt: "A developer wants to upload a first TestFlight build of a client's rebranded app using the bundle ID `com.oyelabs.grocerydemo` \"just for testing\" and fix it later. What do you say?",
          options: [
            "Fine, the bundle ID can be edited in App Store Connect before submission",
            "Stop: once a build is uploaded, the bundle ID of that app record cannot change, so use the client's agreed ID from the first upload",
            "Fine, as long as the Android package name is correct",
            "Fine, TestFlight builds are deleted after 90 days so nothing is kept",
          ],
          correctIndex: 1,
          explanation: "Apple does not allow the bundle ID to change after a build has been uploaded. Google treats a new applicationId as a different app. Agree the client's identifiers before the first upload, even a test one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b07-rebranded-builds-qa-q2",
          prompt: "Which checks belong in rebrand QA on top of the normal regression suite? (Select all that apply.)",
          options: [
            "Searching emails and screens for the demo brand's name and other clients' names",
            "Confirming push notifications use this client's own credentials",
            "Confirming payment keys are the client's and live in the production build",
            "Re-estimating the core product's features",
            "Checking that legal URLs open the client's own pages",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation: "Rebrand QA checks identity, keys and leftovers that only a rebrand can get wrong. Estimating core features has nothing to do with this stage.",
        },
        {
          id: "pmp-b07-rebranded-builds-qa-q3",
          prompt: "During UAT, the client of a white-label salon-booking app says: \"The booking flow should ask for the stylist before the service, like our old app.\" The core asks for the service first, and the configuration panel has no setting for this. What is it?",
          options: [
            "A defect in the rebrand, fixed free in this stage",
            "A request for customisation: raise a change request and list it as deferred on the sign-off",
            "A configuration change the PM can make in the admin panel",
            "A core bug to pass to the core team",
          ],
          correctIndex: 1,
          explanation: "The app works as the core is designed and no setting covers it, so changing the flow needs code. That is customisation, handled as a CR, and it should not block UAT sign-off.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b07-rebranded-builds-qa-q4",
          prompt: "The client's UAT team will use TestFlight. Six client staff are not users in the client's App Store Connect team. What is the practical consequence?",
          options: [
            "They cannot test at all",
            "They can only be external testers, and the first build sent to external testers goes through beta app review",
            "They must use the Play internal track instead",
            "They can be internal testers if Oyelabs invites them from its own account",
          ],
          correctIndex: 1,
          explanation: "Internal testers (up to 100) must be App Store Connect users on the team. Others are external testers (up to 10,000), and the first external build needs beta app review, which adds time.",
        },
        {
          id: "pmp-b07-rebranded-builds-qa-q5",
          prompt: "The client's Google Play account is a personal account created in 2025. What should you warn them about before planning the launch date?",
          options: [
            "Nothing, personal accounts work the same as organisation accounts",
            "Google requires a closed test with at least 12 opted-in testers for 14 consecutive days before they can apply for production access",
            "Personal accounts cannot publish apps with payments",
            "They must transfer the app to Oyelabs' account first",
          ],
          correctIndex: 1,
          explanation: "Personal accounts created after 13 November 2023 must run that closed test before production access. It can add more than two weeks, which is why organisation accounts are recommended.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b07-rebranded-builds-qa-q6",
          prompt: "QA finds that the password-reset email of a new client still shows the logo of a client launched last month. How serious is this?",
          options: [
            "Cosmetic: fix it after go-live",
            "Serious: it exposes another client's identity and shows the panels and emails were not part of the rebrand checks; fix it and add a name search to the checks",
            "Not an issue if the client does not notice",
            "Only an issue for the store reviewer",
          ],
          correctIndex: 1,
          explanation: "Leaking one client's brand into another's product is a confidentiality and trust issue. Fix it, and make the search for other clients' names a standard check.",
        },
        {
          id: "pmp-b07-rebranded-builds-qa-q7",
          prompt: "Which of these are entry criteria you should confirm before the team generates the rebranded builds? (Select all that apply.)",
          options: [
            "The instance is configured",
            "The bundle ID and package name are agreed",
            "The apps are approved by Apple and Google",
            "The store listing text is final",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Builds need a configured instance and fixed identifiers. Store approval and listing text come in later stages.",
        },
        {
          id: "pmp-b07-rebranded-builds-qa-q8",
          prompt: "The client refuses to sign UAT until their requested loyalty banner is built. The rebrand defects are all fixed. What is the best move?",
          options: [
            "Build the banner for free to get the sign-off",
            "Explain the banner is a change request, offer the CR with its impact, and ask for sign-off with the banner listed as deferred",
            "Go live without sign-off since the defects are fixed",
            "Escalate to the client's CEO immediately",
          ],
          correctIndex: 1,
          explanation: "Sign-off is against the agreed scope. New work is a CR and is recorded as deferred. Going live without written sign-off breaks the usual rule; follow the Oyelabs rule in the handbook card.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b07-rebranded-builds-qa-q9",
          prompt: "During UAT, the client finds that order totals round wrongly in the core product. You check: the same happens in every client's instance. What do you do?",
          options: [
            "Fix it only in this client's variant to keep things moving",
            "Log it as a core bug with the core team so every instance gets the fix, and track it for this client's release",
            "Raise a CR for the client",
            "Ignore it: core bugs are out of scope for white-label",
          ],
          correctIndex: 1,
          explanation: "A defect in the core belongs in the core. Patching it only in one client's variant creates a customisation that will conflict with the next core upgrade.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "uat-signoff",
        prompt:
          "Fill in the UAT sign-off for this white-label launch from the notes below. Decide the acceptance status and how the client's last two requests are handled.",
        context:
          "**Project:** white-label grocery app rebranded for a client in Oman (customer app, driver app, admin panel).\n\n**Build:** customer app 1.0.0 (build 14) on TestFlight and the Play internal track; driver app 1.0.0 (build 9). Admin panel on the UAT environment.\n\n**UAT:** 3–7 March, client's operations team (5 people).\n\n**Results:** all six scenarios passed on retest (sign-up, order, pay, push, password reset, admin branding). 4 rebrand defects and 2 core defects were found and fixed.\n\n**Still open:** one minor core defect: the driver app's earnings screen shows a one-second flicker on Android 12. Core team target: core 2.8.1. The client agreed to launch with it.\n\n**Client requests:** an Arabic loyalty banner on the home screen; a different checkout step order. Neither is possible through configuration.",
        fields: [
          { id: "build", label: "Release and build reference", input: "text", required: true },
          { id: "period", label: "UAT period and environment", input: "text", required: true },
          { id: "results", label: "Scenarios tested and results", input: "textarea", required: true },
          { id: "known", label: "Open known issues accepted", input: "textarea", required: true },
          { id: "deferred", label: "Deferred items", input: "textarea", required: true },
          {
            id: "requests",
            label: "How are the loyalty banner and checkout change handled?",
            input: "select",
            required: true,
            options: ["Fixed as rebrand defects before sign-off", "Change request, deferred from this sign-off", "Configuration change in the admin panel", "Known issue in the core"],
          },
          {
            id: "status",
            label: "Acceptance status",
            input: "select",
            required: true,
            options: ["Accepted", "Accepted with known issues", "Rejected"],
          },
        ],
        checks: [
          { fieldId: "requests", expected: "Change request, deferred from this sign-off" },
          { fieldId: "status", expected: "Accepted with known issues" },
        ],
        rubric: [
          { label: "Build and period are specific", points: 2, description: "Names the app versions and build numbers, the dates and the environments (TestFlight, Play internal track, UAT admin panel)." },
          { label: "Known issue recorded properly", points: 2, description: "Describes the open core defect, its impact, that the client accepted it and the target core release." },
          { label: "Deferred items are clear", points: 2, description: "Lists both requests as deferred to a change request, with no promise of free delivery." },
        ],
        sampleAnswer: {
          build: "Customer app 1.0.0 (build 14), driver app 1.0.0 (build 9), admin panel on UAT",
          period: "3–7 March; TestFlight, Play internal testing track and the UAT admin panel",
          results: "Six scenarios (sign-up, order, payment, push, password reset, admin branding) all passed on retest. 4 rebrand defects and 2 core defects found and fixed.",
          known: "Minor core defect: one-second flicker on the driver app earnings screen on Android 12. Cosmetic, no data impact. Accepted by the client for launch; fix targeted in core 2.8.1.",
          deferred: "Arabic loyalty banner on the home screen and a change to the checkout step order. Both need code, so they are handled as a change request after launch, not as part of this sign-off.",
          requests: "Change request, deferred from this sign-off",
          status: "Accepted with known issues",
        },
      },
    },
  ],
} satisfies Module;
