import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a11",
  trackId: "pm",
  name: "Release & go-live",
  description:
    "Taking a custom build to production without drama: running a go/no-go decision against agreed criteria, planning a cutover with a rehearsed rollback, and getting mobile apps through App Store and Play Store review on the client's own accounts.",
  topics: [
    {
      id: "pmp-a11-go-no-go",
      moduleId: "pmp-a11",
      trackId: "pm",
      title: "The go/no-go decision",
      summary:
        "A [[term:go-no-go]] decision is the last controlled moment before real users touch the product. After [[term:go-live]], every problem costs more: it is public, it touches the client's customers and it is fixed under pressure. At an agency the decision also protects Oyelabs. A launch the client pushed for, against a recorded red check, is a very different conversation from a launch the PM waved through.\n\nRun it as a meeting against criteria agreed in advance, not as a mood check. Each criterion is a check with an owner and evidence: [[term:uat]] [[term:sign-off]] received, the [[term:production-environment]] ready on the client's accounts, live keys tested, a backup taken, the [[term:rollback]] plan rehearsed, open [[term:known-issues]] listed and accepted. The PM runs the meeting and makes a recommendation. The client sponsor owns the decision, as the stage card below shows. Record it in the [[term:mom]].\n\nThe common mistake is treating go/no-go as a formality because the date was announced weeks ago. A must-pass check that fails is a no-go on the current plan, whatever the marketing calendar says. The PM's job is to say so clearly, offer options (move the date, or reduce scope with the sponsor's written acceptance) and let the accountable person choose. A quiet \"go\" over a red check is the most expensive sentence in delivery.",
      level: "advanced",
      estMinutes: 45,
      isMilestone: true,
      webRefs: [
        { label: "Microsoft Learn (Dynamics 365 implementation guide): Go-live checklist", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-checklist", kind: "docs", verifiedAt: "2026-10-02T12:00:59Z" },
        { label: "Microsoft Learn (Dynamics 365 implementation guide): Prepare to go live", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-to-go-live", kind: "docs", verifiedAt: "2026-10-02T12:00:59Z" },
        { label: "Microsoft Learn: Safe deployment practices (Well-Architected)", url: "https://learn.microsoft.com/en-us/azure/well-architected/operational-excellence/safe-deployments", kind: "docs", verifiedAt: "2026-10-02T11:54:30Z" },
        { label: "Atlassian: Software releases - 3 ingredients for success", url: "https://www.atlassian.com/agile/software-development/release", kind: "article", verifiedAt: "2026-10-02T11:54:25Z" },
      ],
      video: {
        title: "Go/No-Go Decisions in Business Analysis and Project Management – PMI-PBA Video Certification",
        channel: "InterfaceTT",
        url: "https://www.youtube.com/watch?v=jZlPDyamGoM",
        videoId: "jZlPDyamGoM",
        verifiedAt: "2026-10-02T12:17:12Z",
      },
      alternateVideos: [
        {
          title: "Best Go-Live Checklist and Go-Live Plan for Project Management Teams",
          channel: "OCM Solution (OCMS)",
          url: "https://www.youtube.com/watch?v=xBezWG1U6RQ",
          videoId: "xBezWG1U6RQ",
          verifiedAt: "2026-10-02T12:17:12Z",
        },
        {
          title: "Getting a GO NO GO decision, a MUST !",
          channel: "The Executive Producer",
          url: "https://www.youtube.com/watch?v=ZZDTR5mfiOc",
          videoId: "ZZDTR5mfiOc",
          verifiedAt: "2026-10-02T12:17:12Z",
        },
      ],
      handbook: {
        stages: ["custom-release"],
        rules: ["uat-signoff-before-golive", "mom-after-every-client-meeting", "escalation-levels"],
        templates: ["golive-checklist"],
      },
      sections: [
        {
          heading: "Criteria first, meeting second",
          body:
            "Agree the go/no-go criteria at least a week before the meeting, in writing, with the client SPOC. Microsoft's implementation guidance describes the decision as a meeting against agreed criteria, such as how many bugs are acceptable. Writing them down early stops the criteria shifting to fit the date.\n\nSplit them into two kinds:\n\n- **Must-pass.** Any failure is a no-go on the current plan. Examples: [[term:uat]] sign-off in writing; production on the client's accounts; live payment keys tested with a real transaction; backup taken; rollback rehearsed; no open [[term:critical-issue|critical issues]].\n- **Accept-with-conditions.** A failure can be accepted by the client sponsor, in writing, with a workaround and an owner. Examples: a minor UI issue on one screen; an admin report that can follow a week later.\n\nEvery criterion has an owner and evidence: a link, a screenshot, a signed document, a test run. \"The tech lead says it's fine\" is not evidence.",
        },
        {
          heading: "Running the meeting",
          body:
            "1. **Attendees.** The PM (runs it), tech lead, QA lead and the client sponsor or the person they formally delegate to. BD or the account manager is informed. Keep it to 30 minutes.\n2. **Walk the checklist.** Go line by line through the go-live checklist. Each owner states green, amber or red and shows the evidence.\n3. **State the open risks.** Read the [[term:known-issues]] list aloud. Silence on a known issue now becomes a dispute later.\n4. **Recommend.** The PM recommends go, no-go, or go with named conditions, and gives the reason in one sentence.\n5. **Decide.** The client sponsor decides. If the sponsor overrides a red check, that is their call, but it is recorded with the risk they accepted.\n6. **Record.** Send the [[term:mom]] within the hour: decision, conditions, owners, the cutover time, and the rollback trigger. Follow the Oyelabs rule in the handbook card below.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A Laravel and React booking platform for a UK clinic chain, launching across 14 clinics.* Cutover is planned for Saturday 06:00 UK time. The go/no-go is Thursday 16:00.\n\n- Twelve of thirteen criteria are green, with evidence linked in the checklist.\n- **One must-pass is red:** the client's payment provider account is still under verification, so live card payments have never been tested in production.\n- The PM's recommendation, in one line: \"No-go on the current plan, because online payment is a must-pass and has not been proven. Two options: move cutover by one week, or go live on Saturday with online payment switched off and patients paying at the clinic.\"\n- The client sponsor, the operations director, chooses option two. Clinics already take card payments at reception.\n- The MoM records the decision, the condition (the online payment toggle stays off until a live test passes), the owner of the follow-up release, and that the sponsor accepted the risk.\n- Saturday's cutover goes ahead. Online payment is enabled ten days later, after its own smoke test.\n\nNothing was hidden, the client chose with full information, and Oyelabs has the record.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Criteria invented in the meeting.** Everyone argues about what \"ready\" means. Recover: pause, agree the must-pass list on the spot, and send it in the MoM before deciding.\n- **The PM decides alone.** The PM recommends; the client sponsor is accountable. If you already said \"go\" yourself, send a written summary of the checks to the sponsor and ask for explicit confirmation.\n- **A red check reworded as amber.** Calling an untested payment flow \"amber, should be fine\" is a decision made by wording. Report it as it is.\n- **No rollback trigger agreed.** The team argues at 07:00 on cutover day about whether things are bad enough. Agree the trigger now: for example, \"bookings fail for more than 15 minutes\".\n- **Known issues not read out.** The client later claims a known issue is a [[term:warranty]] defect they never accepted. Read the list and record it.\n- **Go/no-go on cutover morning.** There is no time left to act on a no-go. Hold it at least a working day before.",
        },
        {
          heading: "Your checklist",
          body:
            "- Must-pass and accept-with-conditions criteria agreed in writing a week before.\n- Every check has an owner and linked evidence in the go-live checklist.\n- UAT sign-off received in writing, with known issues listed.\n- Client sponsor (or written delegate) attending.\n- Rollback plan rehearsed and the rollback trigger agreed.\n- Recommendation stated in one sentence, with options when a check is red.\n- Decision, conditions and accepted risks in the MoM within the hour.\n- Go-live communication plan ready for after the smoke test.",
        },
      ],
      sop: [
        {
          title: "Our go/no-go meeting",
          prompt:
            "[Oyelabs SOP – admin to fill] Oyelabs' standard go/no-go criteria for custom projects, who must attend on the Oyelabs side, how far ahead of cutover the meeting is held, and where the decision and evidence are stored.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a11-go-no-go-q1",
          prompt: "Who is accountable for the go/no-go decision on a custom project, according to the release stage's RACI?",
          options: ["The PM", "The tech lead", "The client sponsor", "QA"],
          correctIndex: 2,
          explanation: "The PM is responsible for running the decision and recommending; the client sponsor is accountable for it. The tech lead and QA are consulted.",
        },
        {
          id: "pmp-a11-go-no-go-q2",
          prompt:
            "At the go/no-go, a must-pass check (live payments tested end to end) is red. The client's marketing campaign starts Monday. What is your recommendation?",
          options: [
            "Go: the campaign date matters more",
            "No-go on the current plan, and put options to the sponsor: move the date, or go with payments off if they accept it in writing",
            "Go, and fix payments during hypercare",
            "Ask the developers whether they feel confident",
          ],
          correctIndex: 1,
          explanation: "A failed must-pass check is a no-go on the plan as it stands. The PM offers options; the accountable sponsor chooses with full information, and it is recorded.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a11-go-no-go-q3",
          prompt: "Which of these count as evidence for a go/no-go check? (Select all that apply.)",
          options: [
            "A link to the client's signed UAT sign-off",
            "A screenshot of a successful live transaction in production",
            "The tech lead saying \"it should be fine\"",
            "A rollback rehearsal log from staging",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Evidence is something another person can check. An opinion is not evidence.",
        },
        {
          id: "pmp-a11-go-no-go-q4",
          prompt: "Why should the go/no-go criteria be agreed in writing before the meeting?",
          options: [
            "Because the stores require it",
            "So the criteria cannot be bent to fit the date once pressure builds",
            "So the PM does not need to attend",
            "Because the warranty starts from that document",
          ],
          correctIndex: 1,
          explanation: "Criteria agreed under deadline pressure tend to move to fit the date. Agreeing them early is what makes the meeting a real decision.",
        },
        {
          id: "pmp-a11-go-no-go-q5",
          prompt:
            "The client sponsor overrides your no-go recommendation and says, \"Launch anyway, I'll take the risk.\" What do you do?",
          options: [
            "Refuse to deploy",
            "Launch, and record in the MoM the red check, the risk and that the sponsor accepted it",
            "Launch, but say nothing in writing to keep the relationship warm",
            "Escalate to the client's CEO before doing anything",
          ],
          correctIndex: 1,
          explanation: "The sponsor is accountable and may accept a risk. Your job is to make sure it is an informed, recorded decision. Escalate internally if the risk is to Oyelabs itself (for example, an unpaid milestone the contract ties to launch).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a11-go-no-go-q6",
          prompt: "When is the best time to hold the go/no-go meeting for a Saturday 06:00 cutover?",
          options: [
            "Saturday at 05:30, right before cutover",
            "At least a working day before, for example Thursday afternoon",
            "A month before",
            "After the deployment, before the announcement",
          ],
          correctIndex: 1,
          explanation: "A no-go needs time to act on: tell users, rebook people, move the window. A month ahead is too early to know the real state.",
        },
        {
          id: "pmp-a11-go-no-go-q7",
          prompt: "Which belong on the agenda of a go/no-go meeting? (Select all that apply.)",
          options: [
            "Walk each checklist line with its owner and evidence",
            "Read out the known-issues list",
            "Agree the rollback trigger",
            "Estimate the phase-2 backlog",
            "State the PM's recommendation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation: "Phase-2 estimation is a separate conversation. The meeting is about whether this release is ready and how you will react if it is not.",
        },
        {
          id: "pmp-a11-go-no-go-q8",
          prompt:
            "Six weeks after launch the client says a slow report export is a warranty defect. The export was on the known-issues list at go/no-go. What protects Oyelabs here?",
          options: [
            "Nothing: everything after go-live is warranty",
            "The known-issues list recorded in the go/no-go MoM and UAT sign-off, which shows the client accepted it",
            "The developer's memory of the meeting",
            "The store review notes",
          ],
          correctIndex: 1,
          explanation: "A known issue accepted at sign-off and go/no-go is usually handled as agreed then, not as a new defect. Check the warranty clause; the signed contract always wins.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a11-go-no-go-q9",
          prompt: "A check is genuinely minor (one admin report has a column misaligned). How should it be handled at go/no-go?",
          options: [
            "As an automatic no-go",
            "As an accept-with-conditions item: the sponsor accepts it in writing, with an owner and a fix date",
            "Ignored, because it is minor",
            "Fixed live during the meeting",
          ],
          correctIndex: 1,
          explanation: "Not every failure blocks launch, but every accepted failure is written down with an owner, or it becomes a dispute later.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You are the PM on a Laravel and React booking platform for a UK clinic chain. Cutover is Saturday 06:00. At Thursday's go/no-go, twelve of thirteen checks are green with evidence. One must-pass check is red: the client's payment provider account is still under verification, so live online payments have never been tested in production. Clinics can also take payment at reception. The client sponsor is the operations director.",
        steps: [
          {
            id: "s1",
            question: "What do you say when the payment check comes up?",
            options: [
              "Mark it amber: the code was tested in sandbox, so it should work",
              "Report it red, recommend no-go on the current plan, and offer two options: move cutover a week, or go live with online payment off and pay-at-clinic, if the sponsor accepts it in writing",
              "Recommend go: payment can be fixed during hypercare",
              "Cancel the meeting and reschedule it for next week",
            ],
            correctIndex: 1,
            explanation: "A must-pass check failed. Say so plainly, make a recommendation and give the accountable sponsor real options. Rewording red as amber is deciding by wording.",
          },
          {
            id: "s2",
            question: "The sponsor chooses to go live on Saturday with online payment switched off. What do you do next?",
            options: [
              "Start the cutover; the decision was made verbally",
              "Send the MoM within the hour: the decision, the condition that online payment stays off until a live test passes, the owner and date of that follow-up release, and that the sponsor accepted the risk",
              "Raise a change request for the pay-at-clinic option before cutover",
              "Ask the developers to enable payments quietly once the account is verified",
            ],
            correctIndex: 1,
            explanation: "The decision and its conditions must be on record. Enabling payments later is a planned release with its own smoke test, not a quiet switch.",
          },
          {
            id: "s3",
            question:
              "Saturday 10:00: bookings work, but SMS reminders fail for one clinic. The agreed rollback trigger is \"bookings fail for more than 15 minutes\". What do you do?",
            options: [
              "Roll back the whole release immediately",
              "Do not roll back: it is not the trigger. Log it in the hypercare log with a severity, tell the client SPOC, and fix it forward through an approved hotfix",
              "Ignore it until Monday, as it is the weekend",
              "Turn off SMS for all clinics without telling the client",
            ],
            correctIndex: 1,
            explanation: "Rollback triggers are agreed so nobody decides in a panic. A partial notification failure is a hypercare issue: log it, communicate, and follow the hotfix approval rule.",
          },
        ],
      },
    },
    {
      id: "pmp-a11-store-submission",
      moduleId: "pmp-a11",
      trackId: "pm",
      title: "App Store and Play Store submission",
      summary:
        "For a mobile project, go-live depends on a third party you do not control: Apple's App Review and Google Play's review. A PM who plans the release date without the stores in the plan will miss it. Review time, account set-up and policy questions all sit on the critical path, and most of them can be handled weeks earlier.\n\nThree things decide whether submission goes smoothly. First, the accounts: apps should go out from the client's own [[term:apple-developer-account]] and [[term:google-play-console]] account, set up early, because an organisation account needs a D-U-N-S number and that takes time. Second, the review package: [[term:store-listing-assets]], a working [[term:privacy-policy-url]], accurate privacy answers, and a demo account with the production backend switched on, which Apple's guideline 2.1 asks for when an app has a login. Third, control of the release moment: submit early with manual release (Apple) or managed publishing (Google), so approval and launch are separate events.\n\nThe common mistake is submitting the day before the launch date, from Oyelabs' own developer account, with a demo login that points at a staging server. Each one is a known cause of rejection or of a painful transfer later. Follow the Oyelabs rule on client-owned store accounts in the handbook card below.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Apple Developer: App Review Guidelines", url: "https://developer.apple.com/app-store/review/guidelines/", kind: "spec", verifiedAt: "2026-10-02T11:55:06Z" },
        { label: "App Store Connect Help: Overview of submitting for review", url: "https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/overview-of-submitting-for-review", kind: "docs", verifiedAt: "2026-10-02T12:09:21Z" },
        { label: "Play Console Help: Prepare your app for review", url: "https://support.google.com/googleplay/android-developer/answer/9859455", kind: "docs", verifiedAt: "2026-10-02T11:55:28Z" },
        { label: "Apple Developer: App Review", url: "https://developer.apple.com/distribute/app-review/", kind: "docs", verifiedAt: "2026-10-02T11:55:05Z" },
      ],
      video: {
        title: "How To Submit Your iOS App to the App Store (Full Guide)",
        channel: "John Kealy",
        url: "https://www.youtube.com/watch?v=miWvNAFpmew",
        videoId: "miWvNAFpmew",
        verifiedAt: "2026-10-02T12:17:12Z",
      },
      alternateVideos: [
        {
          title: "How to Publish Your App to the Play Store (Step by Step, 2026)",
          channel: "Code with Beto",
          url: "https://www.youtube.com/watch?v=wcexBIANCCk",
          videoId: "wcexBIANCCk",
          verifiedAt: "2026-10-02T12:17:13Z",
        },
        {
          title: "iOS App Store Submission Tutorial",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=9vkkJ4tC4SQ",
          videoId: "9vkkJ4tC4SQ",
          verifiedAt: "2026-10-02T12:17:13Z",
        },
      ],
      handbook: {
        stages: ["custom-release"],
        rules: ["client-owned-store-accounts", "store-rejection-fixes", "secure-credential-sharing"],
        templates: ["golive-checklist"],
      },
      sections: [
        {
          heading: "What the stores actually say about timing",
          body:
            "Plan with the stores' own numbers, not with folklore.\n\n- **Apple review.** Apple states that, on average, 90% of submissions are reviewed in less than 24 hours. Expedited review exists for critical bug fixes or time-sensitive events, but it is a request, not a right.\n- **Google Play review.** Google says review can take up to 7 days, or longer in exceptional cases, for certain developer accounts and apps.\n- **New Google personal accounts.** Personal developer accounts created after 13 November 2023 must run a closed test with at least 12 testers, opted in continuously for 14 days, before they can apply for production access. That is two weeks you cannot compress. An organisation account avoids this rule but needs a D-U-N-S number.\n- **D-U-N-S.** Apple's organisation enrolment needs a D-U-N-S number for the client's legal entity; Apple allows up to 2 business days after it is issued. Google Play organisation accounts need one too.\n\nPutting this together, a sensible plan (typical, not Oyelabs policy) is: accounts in week 1 of the project, first internal test builds in the store consoles well before UAT ends, and submission at least a week before the launch date.",
        },
        {
          heading: "The review package",
          body:
            "Most rejections come from the package, not the code. Before you submit, check:\n\n- **Demo account.** If the app has a login, Apple's guideline 2.1 asks for demo account details and a live backend. The demo account must work on **production**, with realistic data, and must not expire during review.\n- **Listing.** Name, subtitle, description, keywords, screenshots for each required device size, app icon. The client approves the copy; you check it matches what the app does.\n- **Privacy.** A public [[term:privacy-policy-url]], Apple's privacy details and Google's Data safety form, consistent with what the app and its SDKs actually collect.\n- **Permissions.** Every permission prompt (location, camera, notifications) has a clear purpose string that matches a real feature.\n- **Payments.** Digital goods sold inside the app follow each store's in-app purchase rules; physical goods and services (a clinic appointment, a grocery order) usually use a normal payment gateway. Check the guidelines for your case.\n- **Review notes.** Explain anything a reviewer might not find: how to reach a feature, test card numbers, a location to set.",
        },
        {
          heading: "Separating approval from launch",
          body:
            "Never let review decide your go-live date. Submit early and hold the release:\n\n- **Apple:** choose manual release, so an approved version waits until you press release.\n- **Google:** turn on managed publishing, so approved changes wait until you publish them.\n\nThen the go/no-go meeting decides the moment, the backend [[term:cutover]] happens first, the [[term:smoke-test]] passes, and only then are the apps released.\n\nKnow the safety nets and their limits. Apple's phased release spreads a **version update** over 7 days (1%, 2%, 5%, 10%, 20%, 50%, 100%) and can be paused. Google's staged rollouts apply to updates, **not to a first release**. Neither store has a true rollback: a bad build is fixed by shipping a new one, so a [[term:hotfix]] path must be ready before launch.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A React Native fitness app with a Laravel API for a US client.*\n\n1. **Week 1.** The PM asks the client to enrol in the Apple Developer Program as an organisation and create a Google Play organisation account. The client has no D-U-N-S number; it is requested that week. Oyelabs developers are invited with the minimum roles needed.\n2. **Sprint 3.** First TestFlight and internal-testing builds are uploaded to the client's consoles. Nothing is waiting on accounts later.\n3. **UAT.** The client tests the release candidate from TestFlight and the internal track, the same builds the stores will review.\n4. **Two weeks before launch.** Listing copy and screenshots are approved by the client. The privacy policy is live on the client's domain. A demo account is created on production.\n5. **Ten days before launch.** Both apps are submitted with manual release and managed publishing. Apple approves in a day. Google approves in four days.\n6. **Launch day.** Backend cutover, smoke test, go decision confirmed, then both apps released. The PM checks the listings are live in the target storefronts and QA installs from the public stores.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Submitted from Oyelabs' account.** Moving it later means an app transfer, with its own restrictions. If it has not shipped yet, stop and set up the client's accounts now. Follow the Oyelabs rule in the handbook card below.\n- **Demo login points at staging, or expired.** A typical 2.1 rejection. Fix the account, reply in the review thread, resubmit.\n- **Privacy answers do not match the SDKs.** An analytics or crash SDK collects data the form does not mention. List every SDK and its data with the tech lead before filling the forms.\n- **Submitted the day before launch.** Approval may simply not arrive. Tell the client today, move the date or launch the web part first.\n- **Rejection caused by client content.** For example, listing claims the app cannot back up. Who pays for the fix follows the Oyelabs rule in the handbook card below.\n- **Credentials for the store accounts emailed around.** Use invitations with roles, not shared logins, and the approved secure channel.",
        },
        {
          heading: "Your checklist",
          body:
            "- Client-owned Apple and Google organisation accounts created in week 1; D-U-N-S requested if missing.\n- Oyelabs team invited with the minimum roles; no shared logins.\n- If Google is a new personal account: the 12-tester, 14-day closed test is in the plan.\n- UAT run on store builds (TestFlight, internal track).\n- Listing, screenshots and copy approved by the client.\n- Privacy policy live; privacy and Data safety answers match every SDK.\n- Demo account on production, with review notes.\n- Submitted at least a week before launch, with manual release and managed publishing.\n- Hotfix path ready, since stores have no rollback.",
        },
      ],
      sop: [
        {
          title: "Our store account and submission routine",
          prompt:
            "[Oyelabs SOP – admin to fill] Which roles Oyelabs asks for on client Apple and Google accounts, who on the Oyelabs side submits builds, the standard review-notes text, and where store credentials and invitations are tracked.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a11-store-submission-q1",
          prompt: "The app has a login. What does Apple's guideline 2.1 expect from your submission?",
          options: [
            "Nothing extra",
            "Demo account details and a backend that is switched on during review",
            "The full source code",
            "A video of the developer testing the app",
          ],
          correctIndex: 1,
          explanation: "If reviewers cannot sign in, they cannot review. A demo account on a live backend is required for apps with a login.",
        },
        {
          id: "pmp-a11-store-submission-q2",
          prompt:
            "The client created a new personal Google Play developer account last week and wants to launch on Android in ten days. What is the problem?",
          options: [
            "None: Google reviews in 24 hours",
            "New personal accounts must run a closed test with at least 12 testers opted in for 14 days before applying for production",
            "Personal accounts cannot publish paid apps",
            "Google requires a D-U-N-S number for every account",
          ],
          correctIndex: 1,
          explanation: "For personal accounts created after 13 November 2023, the 14-day closed test cannot be shortened. Ten days is not enough. An organisation account (with D-U-N-S) avoids this requirement.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a11-store-submission-q3",
          prompt: "How do you stop store approval from deciding your go-live date? (Select all that apply.)",
          options: [
            "Submit early with manual release on Apple",
            "Turn on managed publishing on Google Play",
            "Submit the day before and hope",
            "Release the apps after the backend cutover and smoke test pass",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Approval and launch should be separate events. Hold the approved builds and release after the go decision and the smoke test.",
        },
        {
          id: "pmp-a11-store-submission-q4",
          prompt: "Version 1.0 is about to launch. The client asks you to use Google's staged rollout at 5% for safety. What do you say?",
          options: [
            "Agreed, set 5%",
            "Staged rollouts are for updates, not a first release; manage risk before release with testing and a hotfix path",
            "Use Apple phased release on Android instead",
            "Launch in one country only by default",
          ],
          correctIndex: 1,
          explanation: "Google's staged rollouts apply to updates. Apple's phased release also applies to version updates. The first release has no gradual safety net.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a11-store-submission-q5",
          prompt: "Apple's App Review page states how long most reviews take. Which statement matches it?",
          options: [
            "Every review takes exactly 48 hours",
            "On average, 90% of submissions are reviewed in less than 24 hours",
            "Reviews take 7 to 14 days",
            "Apple does not review updates",
          ],
          correctIndex: 1,
          explanation: "That is Apple's own figure. It is an average, so plan buffer; rejections add a full cycle.",
        },
        {
          id: "pmp-a11-store-submission-q6",
          prompt: "Why should the apps be submitted from the client's own developer accounts?",
          options: [
            "It is faster to review",
            "The client owns the listing, reviews and users from day one, and avoids a later app transfer",
            "Oyelabs' account has too many apps",
            "Apple charges agencies more",
          ],
          correctIndex: 1,
          explanation: "Moving an app later is an app transfer with restrictions. Starting on the client's account avoids it. Follow the Oyelabs rule on client-owned store accounts.",
        },
        {
          id: "pmp-a11-store-submission-q7",
          prompt: "Which are common causes of a rejection that a PM can prevent before submitting? (Select all that apply.)",
          options: [
            "A demo account that points at staging or has expired",
            "Privacy answers that leave out data an SDK collects",
            "Permission prompts with no clear purpose",
            "Using React Native instead of Swift",
            "A missing or broken privacy policy URL",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation: "The framework is not a rejection reason. Package problems are, and they are checkable before you submit.",
        },
        {
          id: "pmp-a11-store-submission-q8",
          prompt: "A released iOS update has a crash on launch for some users. What can you do on the store side?",
          options: [
            "Roll the App Store back to the previous version",
            "If phased release is running, pause it; then ship a fixed build (requesting expedited review if justified)",
            "Delete the app and re-upload",
            "Nothing at all",
          ],
          correctIndex: 1,
          explanation: "There is no store rollback. Pausing a phased release limits automatic updates; the fix is a new build. Expedited review is for critical bug fixes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a11-store-submission-q9",
          prompt: "When is the right time to ask a client for a D-U-N-S number?",
          options: [
            "The week before submission",
            "In week 1 of the project, when the store accounts are set up",
            "After the first rejection",
            "Never: Oyelabs' number can be used",
          ],
          correctIndex: 1,
          explanation: "Organisation enrolment needs the client's own D-U-N-S number, and issuing it takes time. Start in week 1.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "A React Native app with a Laravel API is launching on both stores for the first time. Put these release steps in the order a well-run project does them, first at the top.",
        items: [
          { id: "accounts", label: "Client's own Apple and Google organisation accounts set up (D-U-N-S requested) and the team invited with roles" },
          { id: "builds", label: "First builds uploaded to TestFlight and the internal testing track" },
          { id: "uat", label: "Client UAT run on the store builds and signed off in writing" },
          { id: "package", label: "Listing, privacy answers, privacy policy URL and a production demo account prepared and approved" },
          { id: "submit", label: "Both apps submitted for review with manual release and managed publishing" },
          { id: "gonogo", label: "Go/no-go meeting held and the decision recorded" },
          { id: "release", label: "Backend cutover and smoke test, then both apps released and the live listings checked" },
        ],
        correctOrder: ["accounts", "builds", "uat", "package", "submit", "gonogo", "release"],
        explanation:
          "Accounts come first because everything else lands in them and D-U-N-S takes time. Builds reach the consoles early so UAT tests what the stores will review. The package needs a production demo account, then submission with the release held. The go/no-go decides the moment; the apps are released only after the backend cutover and smoke test pass.",
      },
    },
    {
      id: "pmp-a11-cutover-rollback",
      moduleId: "pmp-a11",
      trackId: "pm",
      title: "Cutover and rollback planning",
      summary:
        "A [[term:cutover]] is the planned window in which the old state is replaced by the new: code deployed, data migrated, DNS or traffic switched, integrations repointed, users told. It is where most launch disasters happen, because many people do many dependent steps under time pressure, often at night or on a weekend. A [[term:rollback]] plan is what turns a bad cutover into a delay rather than an incident.\n\nA good cutover plan is a minute-by-minute runbook. Every task has an owner and a backup owner, instructions, a verification step and a sign-off, as Microsoft's cutover guidance describes. It names the point of no return: the moment after which going back costs more than fixing forward, for example once real customers have placed orders in the new database. It defines the rollback trigger in numbers, agreed before anyone is tired. And it is rehearsed on staging, ideally more than once, with real timings.\n\nThe common mistake is a rollback plan that was never tested and quietly assumes the database can simply be restored. Restoring a backup throws away everything users did since it was taken. That may be fine at 06:15, and a serious data-loss incident at 14:00. The PM does not write the SQL, but must make sure the plan answers when rollback stops being safe, who decides, and how long it takes.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Microsoft Learn (Dynamics 365 implementation guide): Cutover strategy and plan", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-cutover-strategy", kind: "docs", verifiedAt: "2026-10-02T12:00:59Z" },
        { label: "Microsoft Learn: Safe deployment practices (Well-Architected)", url: "https://learn.microsoft.com/en-us/azure/well-architected/operational-excellence/safe-deployments", kind: "docs", verifiedAt: "2026-10-02T11:54:30Z" },
        { label: "Martin Fowler: Blue green deployment", url: "https://martinfowler.com/bliki/BlueGreenDeployment.html", kind: "article", verifiedAt: "2026-10-02T11:55:01Z" },
        { label: "AWS Whitepaper: Blue/green deployments on AWS", url: "https://docs.aws.amazon.com/whitepapers/latest/blue-green-deployments/introduction.html", kind: "docs", verifiedAt: "2026-10-02T12:09:37Z" },
      ],
      video: {
        title: "Top 5 Most-Used Deployment Strategies",
        channel: "ByteByteGo",
        url: "https://www.youtube.com/watch?v=AWVTKBUnoIg",
        videoId: "AWVTKBUnoIg",
        verifiedAt: "2026-10-02T12:17:12Z",
      },
      alternateVideos: [
        {
          title: "What is Blue Green Deployment?",
          channel: "Telusko",
          url: "https://www.youtube.com/watch?v=23EghFNQdj4",
          videoId: "23EghFNQdj4",
          verifiedAt: "2026-10-02T12:17:12Z",
        },
        {
          title: "Production Deployment Explained | Technical Project Managers",
          channel: "BeTechnological",
          url: "https://www.youtube.com/watch?v=HseJyFDrTrM",
          videoId: "HseJyFDrTrM",
          verifiedAt: "2026-10-02T12:17:12Z",
        },
      ],
      handbook: {
        stages: ["custom-release"],
        rules: ["hotfix-approval", "uat-signoff-before-golive", "escalation-levels"],
        templates: ["golive-checklist"],
      },
      sections: [
        {
          heading: "Anatomy of a cutover runbook",
          body:
            "Microsoft's cutover guidance lists, for each task: owner and backup owner, instructions, verification and sign-off, plus a rollback plan. It also notes the cutover window is often a weekend because it is usually less than 48 hours. A custom web or mobile launch is usually much shorter, but the structure is the same:\n\n1. **Freeze.** Code freeze on the release tag; content and configuration freeze in the old system, if there is one.\n2. **Backup.** A verified database backup, and a snapshot of anything else that changes.\n3. **Maintenance mode.** Users see a holding page; writes stop.\n4. **Deploy and migrate.** Application deployment, database migrations, data imports.\n5. **Switch.** DNS, load balancer, or traffic switch; third-party webhooks repointed; live keys active.\n6. **Verify.** The [[term:smoke-test]] script, run by QA on production, with results recorded.\n7. **Open.** Maintenance mode off; a short watch period on errors, payments and logins.\n8. **Announce.** Go-live communication to the client and, through the client, to users.\n\nEvery step has a planned start and end time from the rehearsal. If a step runs 50% over, that is itself a signal to the cutover lead.",
        },
        {
          heading: "Rollback triggers and the point of no return",
          body:
            "Decide two things in daylight, not at 03:00.\n\n**The rollback trigger.** A condition anyone can check, with a number: \"login or booking failure rate above 5% for 15 minutes\", \"migration not finished by 07:30\", \"smoke test fails on payment and is not fixed within 20 minutes\". Vague triggers (\"if things look bad\") produce arguments.\n\n**The point of no return.** The step after which rolling back is worse than fixing forward. Typically it is when real users start writing data to the new system. After that, restoring the old database loses their bookings, orders or payments. Past this point, the plan is a [[term:hotfix]] under the approval rule in the handbook card below, not a rollback.\n\nAlso record **who calls it**. Usually the tech lead recommends a rollback on technical grounds and the PM confirms with the client sponsor or their delegate, who is on call during the window. Agree this in the go/no-go meeting.",
        },
        {
          heading: "Patterns that make rollback cheap",
          body:
            "The tech lead chooses the technique, but the PM should know what each one buys:\n\n- **Blue-green.** Two production environments; traffic switches from blue (old) to green (new). Rollback is switching traffic back, which is fast. Martin Fowler notes the hard part is the database, which both sides may share.\n- **Canary.** The new version gets a small share of traffic first and grows only if metrics stay healthy. The blast radius stays small.\n- **Feature flags.** Code ships dark and a feature is switched on separately, so a bad feature can be switched off without a redeploy. This separates [[term:deployment]] from [[term:release]].\n- **Backward-compatible migrations.** Add columns before removing old ones, so the previous version can still run against the new schema. This keeps rollback possible longer.\n\nOn many agency projects the honest answer is simpler: one server, a backup, a tagged previous release. That is fine, as long as the plan states the restore time measured in rehearsal and the data that would be lost.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A Laravel booking platform for a UK clinic chain, replacing a legacy PHP system.* Cutover Saturday 06:00–09:00.\n\n- **Rehearsal.** Two dry runs on staging with a copy of production data. The import takes 48 minutes; the first run found a timezone bug in historic appointments.\n- **Runbook.** 22 steps in the go-live checklist, each with owner, backup owner, planned time and a verification line.\n- **Triggers.** Roll back if the import has not finished by 07:30, or if the smoke test fails on booking or login and is not fixed within 20 minutes.\n- **Point of no return.** 08:00, when the clinics open and patients start booking in the new system. After that, problems are fixed forward.\n- **Rollback path.** Point DNS back to the legacy server (TTL lowered to 5 minutes on Wednesday) and re-enable it. Measured in rehearsal: about 15 minutes.\n- **On call.** The client's operations director is reachable by phone from 06:00 to 10:00 for any rollback decision.\n- **On the day.** The import finishes at 06:55, smoke test passes at 07:20, maintenance mode is lifted at 07:30, and the PM sends the go-live note at 08:10 after the first real bookings arrive.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Rollback never rehearsed.** Nobody knows if the backup restores or how long it takes. If cutover is close, rehearse at least the restore on staging this week; if impossible, say so at go/no-go as a red check.\n- **Restore after users wrote data.** Rolling back at 14:00 loses six hours of orders. Respect the point of no return and fix forward.\n- **DNS TTL left at 24 hours.** Switching back takes a day for some users. Lower it days before the cutover.\n- **One person holds every step.** If they get stuck or ill, the cutover stops. Name backup owners.\n- **Webhooks still pointing at the old system.** Payments succeed but orders do not update. Put every integration on the runbook.\n- **No time box.** A cutover that runs three hours late without a decision becomes a crisis. Use the planned times and the trigger.\n- **Silence during the window.** Agree updates every 30 minutes to the client sponsor, even if the update is \"on plan\".",
        },
        {
          heading: "Your checklist",
          body:
            "- Runbook in the go-live checklist: every step with owner, backup owner, planned time, verification and sign-off.\n- At least one full rehearsal on staging with production-like data; timings recorded.\n- Verified backup taken immediately before the cutover.\n- Rollback trigger written with numbers; point of no return named.\n- Who decides a rollback, and their phone number, agreed at go/no-go.\n- Rollback path and its measured duration documented.\n- DNS TTLs lowered in advance; integrations and webhooks listed.\n- Update rhythm to the client agreed for the window.\n- After the point of no return: hotfix path ready under the approval rule.",
        },
      ],
      sop: [
        {
          title: "Our cutover window and on-call",
          prompt:
            "[Oyelabs SOP – admin to fill] Oyelabs' preferred cutover windows, who leads a cutover, on-call arrangements and pay or time-off rules for weekend cutovers, and where runbooks and rehearsal logs are kept.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a11-cutover-rollback-q1",
          prompt: "What does Microsoft's cutover guidance say each cutover task should include? (Select all that apply.)",
          options: ["An owner and a backup owner", "Instructions", "Verification and sign-off", "A marketing message"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Owner, backup owner, instructions, verification and sign-off, plus a rollback plan for the cutover as a whole.",
        },
        {
          id: "pmp-a11-cutover-rollback-q2",
          prompt:
            "Cutover went live at 07:30. At 14:00 a reporting bug is found. A developer proposes restoring the 06:00 backup to be safe. What is wrong with that?",
          options: [
            "Nothing: backups are for exactly this",
            "Restoring would throw away every booking made since 07:30; the point of no return has passed, so fix forward",
            "Backups cannot be restored on a Saturday",
            "The client must pay for restores",
          ],
          correctIndex: 1,
          explanation: "After real users write data, a restore causes data loss. Past the point of no return, the plan is a hotfix under the approval rule.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a11-cutover-rollback-q3",
          prompt: "Which is a well-written rollback trigger?",
          options: [
            "If things look bad, we roll back",
            "If login or booking failures exceed 5% for 15 minutes, or the import is not done by 07:30, we roll back",
            "If the client is unhappy",
            "If the PM thinks it is necessary",
          ],
          correctIndex: 1,
          explanation: "A trigger anyone can check, with numbers and times, prevents arguments under pressure.",
        },
        {
          id: "pmp-a11-cutover-rollback-q4",
          prompt: "Why lower the DNS TTL a few days before a cutover that switches DNS?",
          options: [
            "It makes the site faster",
            "So that both the switch and a possible switch back reach users within minutes rather than hours",
            "The stores require it",
            "It is needed for SSL certificates",
          ],
          correctIndex: 1,
          explanation: "With a long TTL, resolvers keep the old address for hours, so a rollback would be slow for many users.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a11-cutover-rollback-q5",
          prompt: "What does blue-green deployment buy you, and what remains hard?",
          options: [
            "Fast rollback by switching traffic back; the shared database remains the hard part",
            "No need for testing; nothing remains hard",
            "Cheaper hosting; DNS remains hard",
            "Automatic bug fixing; monitoring remains hard",
          ],
          correctIndex: 0,
          explanation: "Switching traffic is quick. Data changes made by the new version may not be compatible with the old one, which is why migrations need care.",
        },
        {
          id: "pmp-a11-cutover-rollback-q6",
          prompt: "Which practices keep rollback possible for longer? (Select all that apply.)",
          options: [
            "Backward-compatible database migrations",
            "Feature flags for risky features",
            "Dropping old columns in the same release",
            "A canary release to a small share of traffic",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Dropping old columns immediately makes the previous version unable to run, which removes the rollback option.",
        },
        {
          id: "pmp-a11-cutover-rollback-q7",
          prompt: "The rehearsal shows the data import takes 48 minutes but the plan allows 20. What do you do?",
          options: [
            "Keep 20 minutes; it will be faster on the day",
            "Update the runbook timings and triggers from the rehearsal and, if needed, extend the window and tell the client",
            "Skip the import",
            "Run the import during business hours instead without telling anyone",
          ],
          correctIndex: 1,
          explanation: "Rehearsals exist to replace guesses with real timings. The plan, triggers and client communication follow the measured numbers.",
        },
        {
          id: "pmp-a11-cutover-rollback-q8",
          prompt: "During the cutover, who should decide whether to roll back?",
          options: [
            "Whichever developer notices the problem first",
            "As agreed at go/no-go: typically the tech lead recommends and the PM confirms with the client sponsor or their on-call delegate",
            "The hosting provider",
            "Nobody: roll back automatically on any error",
          ],
          correctIndex: 1,
          explanation: "The decision path and phone numbers are agreed beforehand, so the rollback decision takes minutes, not a debate.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a11-cutover-rollback-q9",
          prompt: "Payments succeed after cutover, but orders stay \"pending\". What has probably been missed in the runbook?",
          options: [
            "The app icon",
            "Repointing the payment provider's webhooks to the new system",
            "The privacy policy",
            "The DNS TTL",
          ],
          correctIndex: 1,
          explanation: "Webhooks still pointing at the old system are a classic cutover gap. List every integration and verify each one in the smoke test.",
        },
        {
          id: "pmp-a11-cutover-rollback-q10",
          prompt: "Your cutover is two hours over plan with no trigger reached and no decision taken. What is the PM's move?",
          options: [
            "Wait silently until the team finishes",
            "Call a short checkpoint: state the facts, update the client sponsor, and decide continue or roll back against the triggers and the point of no return",
            "Go home and check in the morning",
            "Announce go-live to keep the client calm",
          ],
          correctIndex: 1,
          explanation: "Time boxes and regular updates stop a late cutover drifting into an incident. Decisions are made explicitly and communicated.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        prompt:
          "Fill in the key rows of the go-live checklist for this cutover, using the tech lead's notes. Be specific: someone tired at 06:30 must be able to follow it.",
        context:
          "**Project:** Laravel booking platform replacing a legacy PHP system for a UK clinic chain. Cutover Saturday 06:00.\n\n**Tech lead's notes from the staging rehearsal:**\n- Verified database backup: 15 minutes.\n- Deploy and run migrations: 10 minutes.\n- Import legacy appointments: 48 minutes.\n- Smoke test (login, booking, payment, notifications) by QA: 20 minutes.\n- Rollback = point DNS back to the legacy server (TTL already 5 min) and re-enable it: 15 minutes.\n- Clinics open at 08:00; from then, patients book in the new system.\n- The client's operations director (sponsor) is on call 06:00–10:00.",
        templateId: "golive-checklist",
        fields: [
          { id: "duration", label: "Planned minutes from 06:00 to the end of the smoke test (backup, deploy, import, smoke test)", input: "number", required: true },
          { id: "trigger", label: "Rollback trigger", input: "textarea", placeholder: "A condition anyone can check, with numbers and times", required: true },
          { id: "pnr", label: "Point of no return (time)", input: "text", placeholder: "e.g. 09:00", required: true },
          { id: "smoke-owner", label: "Who runs the smoke test", input: "select", options: ["PM", "Tech lead", "QA", "Client SPOC"], required: true },
          { id: "decider", label: "Who is accountable for the go decision and any rollback call", input: "select", options: ["PM", "Tech lead", "Client sponsor", "BD/Account manager"], required: true },
          { id: "after-pnr", label: "What happens if a serious problem appears after the point of no return", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "duration", expected: 93 },
          { fieldId: "pnr", expected: "08:00" },
          { fieldId: "smoke-owner", expected: "QA" },
          { fieldId: "decider", expected: "Client sponsor" },
        ],
        rubric: [
          { label: "The trigger is measurable", points: 2, description: "States a checkable condition with numbers or times (e.g. smoke test fails on booking or login and is not fixed within 20 minutes, or the import is not done by 07:30)." },
          { label: "Fix-forward after the point of no return", points: 2, description: "After 08:00, no restore: a hotfix under the approval rule, with the client sponsor informed, because a restore would lose patients' bookings." },
        ],
        sampleAnswer: {
          duration: "93",
          trigger: "Roll back if the appointment import is not finished by 07:30, or if the smoke test fails on login or booking and is not fixed within 20 minutes. Tech lead recommends; the client sponsor (on call) decides.",
          pnr: "08:00",
          "smoke-owner": "QA",
          decider: "Client sponsor",
          "after-pnr": "No rollback after 08:00, because restoring would lose patients' bookings. Log the issue with a severity, fix forward with a hotfix approved under the hotfix rule, and update the client sponsor every 30 minutes until resolved.",
        },
      },
    },
  ],
} satisfies Module;
