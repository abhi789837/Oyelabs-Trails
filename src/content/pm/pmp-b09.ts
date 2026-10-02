import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-b09",
  trackId: "pm",
  name: "Submission, rejection & resubmission",
  description:
    "Getting each rebranded app through App Store and Google Play review: the submission flow from the client's own accounts, realistic review times, and how to read, answer and fix a rejection, including the template and spam guidelines that hit white-label apps hardest.",
  topics: [
    {
      id: "pmp-b09-submission",
      moduleId: "pmp-b09",
      trackId: "pm",
      title: "Submitting to the App Store and Google Play",
      summary:
        "Submission is where a [[term:white-label]] launch stops being under Oyelabs' control. Once the build is in review, the date depends on Apple and Google. A PM who promised the client \"live on Monday\" without allowing for review has made a promise nobody can keep.\n\nThe flow is short but strict. Check the entry criteria: written [[term:uat]] [[term:sign-off]] and a complete listing in the [[term:client-owned-accounts]]. Upload the final [[term:build]] with the right version and build number. Attach it to the version, add the review notes and the demo account. Choose how the app goes live once approved: manual release on Apple, managed publishing on Google, so approval does not publish on its own. Submit, track the status and keep the client informed.\n\nReview times are published facts, not guesses. Apple says that on average 90% of submissions are reviewed in less than 24 hours, and an approved app can take up to 24 hours to appear on every storefront. Google says that for certain developer accounts review can take up to seven days, or longer in exceptional cases. A typical plan allows one to three days for Apple and a few days for Google, plus one possible rejection cycle. New accounts and first releases usually take longer.\n\nThe common mistake is submitting an incomplete app to \"get in the queue\". Apple's completeness guideline (2.1) rejects placeholder content, missing demo accounts and back-ends that are switched off. A rejected first submission costs more time than a day spent checking.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "App Store Connect Help: Overview of submitting for review", url: "https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/overview-of-submitting-for-review", kind: "docs", verifiedAt: "2026-10-02T11:46:16Z" },
        { label: "Apple: App Review (review times, expedited reviews)", url: "https://developer.apple.com/distribute/app-review/", kind: "docs", verifiedAt: "2026-10-02T11:46:16Z" },
        { label: "Play Console Help: Publish your app", url: "https://support.google.com/googleplay/android-developer/answer/9859751?hl=en", kind: "docs", verifiedAt: "2026-10-02T11:46:45Z" },
        { label: "Play Console Help: Prepare your app for review", url: "https://support.google.com/googleplay/android-developer/answer/9859455?hl=en", kind: "docs", verifiedAt: "2026-10-02T11:46:38Z" },
      ],
      video: {
        title: "App Store Submission Guide (2025): Publish Your iOS App to the Store (Xcode & App Store Connect)",
        channel: "Noah Does Coding",
        url: "https://www.youtube.com/watch?v=Qgq6jsRtfbA",
        videoId: "Qgq6jsRtfbA",
        verifiedAt: "2026-10-02T12:00:49Z",
      },
      alternateVideos: [
        {
          title: "How To Submit Your iOS App to the App Store (Full Guide)",
          channel: "John Kealy",
          url: "https://www.youtube.com/watch?v=miWvNAFpmew",
          videoId: "miWvNAFpmew",
          verifiedAt: "2026-10-02T12:01:12Z",
        },
        {
          title: "How to Publish Your Android App on Google Play Store in 2026 (Step-by-Step for Beginners) 🚀",
          channel: "Saddam Kassim",
          url: "https://www.youtube.com/watch?v=2JbdGXxh1V0",
          videoId: "2JbdGXxh1V0",
          verifiedAt: "2026-10-02T12:00:50Z",
        },
      ],
      handbook: {
        stages: ["wl-submission"],
        rules: ["client-owned-store-accounts", "uat-signoff-before-golive"],
      },
      sections: [
        {
          heading: "The submission flow, step by step",
          body:
            "1. **Entry check.** UAT signed off in writing; listing, privacy declarations and age rating complete; Oyelabs has the right role in the client's App Store Connect and Play Console.\n2. **Upload.** The developers bump the version and build number, archive the release build and upload it (Xcode or Transporter for Apple, an app bundle for Google).\n3. **Attach and annotate.** Once Apple has processed the build, attach it to the version. Add review notes (up to 4000 bytes) and a demo account. On Google, give app access instructions for any login-gated part (up to 5 sets).\n4. **Choose the release option.** Apple: manual release, or a scheduled date. Google: managed publishing, so approved changes wait until you publish them.\n5. **Submit.** Tell the client the review window and that the date depends on the store.\n6. **Track and answer.** Watch the status. If the reviewer asks a question or rejects, reply in App Store Connect or check the policy status in Play Console the same day.\n7. **Release and verify.** Release on the agreed date, then confirm the listing appears on every storefront (Apple allows up to 24 hours) and install the live app to smoke-test it.",
        },
        {
          heading: "Review times: facts and typical values",
          body:
            "**Facts (from the stores):**\n- Apple: on average, 90% of submissions are reviewed in less than 24 hours. Complex apps and repeat guideline issues take longer.\n- Apple: an expedited review can be requested for a critical bug fix or a launch tied to an event. It is a request, not a guarantee.\n- Apple: after release, an app can take up to 24 hours to appear on all storefronts.\n- Google: for certain developer accounts, review can take up to seven days, or longer in exceptional cases.\n\n**Typical planning values (not promises):**\n- Apple: plan one to three days including one possible rejection cycle.\n- Google: plan a few days; more for a new account or a first release.\n\nTell the client the facts and the plan in the same message. \"Apple reviews most apps within a day, but we plan three days so one round of reviewer questions does not move your launch\" sets a date the client can repeat.",
        },
        {
          heading: "Why manual release and managed publishing matter",
          body:
            "If you leave the default, an approved app goes live as soon as review finishes. For a white-label client that can mean the app appears before the client's marketing, before the production [[term:payment-gateway-account]] is switched to live, or on a weekend when nobody is watching support.\n\n- On Apple, choose manual release (or a scheduled date) when you submit.\n- On Google, turn on managed publishing so approved changes wait until you publish them.\n\nThen the [[term:go-live]] is a decision the client and Oyelabs take together, on the go-live checklist, not an accident of review timing.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A white-label fitness-booking app for a gym chain in the UAE, sold through a reseller.*\n\n1. **Monday.** UAT sign-off arrives. The PM confirms the listing is complete in the gym chain's own accounts, where Oyelabs is an App Manager on Apple and has release permissions on Google.\n2. **Monday afternoon.** Developers upload version 1.0.0 (build 22). The PM adds review notes explaining the class-booking flow and a demo member account with a fixed test OTP, and gives Google the same login instructions.\n3. **Release option.** Manual release on Apple, managed publishing on Google. The reseller wanted \"live as soon as approved\"; the PM explains the gym's payment keys switch to live on Thursday, so release waits.\n4. **The message.** \"Both apps are in review. Apple usually reviews within a day; Google can take several days for a new account. We plan go-live for Thursday and will update you daily.\"\n5. **Tuesday.** Apple approves. **Wednesday.** Google approves.\n6. **Thursday.** After the go-live checklist, the PM releases both. By the evening the listing shows in every storefront, and QA installs the store version to smoke-test it.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Submitting from the agency's account.** Stop before you submit. See the rejections topic for why this fails, and follow the Oyelabs rule in the handbook card below.\n- **No demo account.** Expect a completeness rejection. Add one and reply to the reviewer.\n- **Back-end switched off or on a test server.** Reviewers test the real experience. Point the review build at a working environment.\n- **Approved app goes live early.** If it already happened, check that payments, support and the production [[term:client-instance]] are ready; if not, tell the client immediately and fix the gap first.\n- **A date promised without review time.** Reset expectations now, with the facts above and a revised plan, rather than hoping review is quick.",
        },
        {
          heading: "Your checklist",
          body:
            "- Written UAT sign-off received.\n- Listing, privacy declarations and age rating complete in the client's accounts.\n- Version and build number bumped; build uploaded and processed.\n- Review notes, demo account and app access instructions added.\n- Manual release (Apple) and managed publishing (Google) set.\n- Client told the review window and the planned go-live date in writing.\n- Status checked daily and reviewer messages answered the same day.\n- Live listing and store-installed app checked after release.",
        },
      ],
      sop: [
        {
          title: "Our submission log and client update",
          prompt:
            "[Oyelabs SOP – admin to fill] Where submissions are logged per client (build, date, status, reviewer messages), who presses submit and release, and the standard message that tells a white-label client the review window and planned go-live.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b09-submission-q1",
          prompt: "A reseller asks on Friday: \"Can the app be live on Monday if you submit today?\" What is the honest answer?",
          options: [
            "Yes, Apple always reviews within 24 hours",
            "Probably for Apple, since most submissions are reviewed within a day, but it is not guaranteed; Google can take several days, so we plan with a buffer and confirm daily",
            "No, reviews always take two weeks",
            "Yes, if we request expedited review for every launch",
          ],
          correctIndex: 1,
          explanation: "Apple's 90%-in-24-hours figure is an average, not a promise. Google states up to seven days for certain accounts. Plan with a buffer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b09-submission-q2",
          prompt: "Which are true about store review timing? (Select all that apply.)",
          options: [
            "Apple says 90% of submissions are reviewed in less than 24 hours on average",
            "An approved Apple app can take up to 24 hours to appear on all storefronts",
            "Google says some accounts can wait up to seven days or longer in exceptional cases",
            "Expedited review is guaranteed for any first launch",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Expedited review is a request for critical fixes or event-tied launches, never guaranteed.",
        },
        {
          id: "pmp-b09-submission-q3",
          prompt: "Why choose manual release on Apple and managed publishing on Google for a white-label launch?",
          options: [
            "They make review faster",
            "So approval does not publish the app before payments, marketing and support are ready",
            "They are required for white-label apps",
            "They skip the privacy declarations",
          ],
          correctIndex: 1,
          explanation: "They separate approval from go-live, so the launch happens on the agreed date after the go-live checklist.",
        },
        {
          id: "pmp-b09-submission-q4",
          prompt: "A developer wants to submit a build that still has a \"Coming soon\" placeholder screen \"to get into the queue\". What is the risk?",
          options: [
            "None: reviewers ignore placeholders",
            "A rejection under Apple's completeness guideline (2.1), which costs more time than finishing the screen",
            "It is only a risk on Google",
            "The build will be approved but hidden",
          ],
          correctIndex: 1,
          explanation: "Apple requires final builds with no placeholder content. A rejection costs a full review cycle.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b09-submission-q5",
          prompt: "What should the App Review information contain for a login-gated white-label app? (Select all that apply.)",
          options: [
            "A demo account that works",
            "Notes explaining any OTP or unusual flow",
            "Confirmation that the back-end is switched on",
            "The client's bank details",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Reviewers must be able to use the app. Apple's guideline asks for demo access and a working back-end.",
        },
        {
          id: "pmp-b09-submission-q6",
          prompt: "Which is an entry criterion for the submission stage?",
          options: ["Apps approved by Apple and Google", "UAT signed off and store listings complete", "Licence activated", "Admin training done"],
          correctIndex: 1,
          explanation: "Submission needs a signed-off build and a complete listing. Approval is the exit; licence and training belong to go-live.",
        },
        {
          id: "pmp-b09-submission-q7",
          prompt: "Google needs to review a part of the app behind a login. Where do you give the details?",
          options: [
            "In the full description",
            "In the app access instructions in Play Console (up to 5 sets)",
            "In an email to Google support",
            "Nowhere: Google reviewers create their own accounts",
          ],
          correctIndex: 1,
          explanation: "Play Console has app access instructions for login-gated parts of the app.",
        },
        {
          id: "pmp-b09-submission-q8",
          prompt: "Apple approved the app on Sunday and it went live automatically before the client's payment keys were switched to live. What do you do first?",
          options: [
            "Nothing: it is approved",
            "Tell the client immediately, check payments, support and the production instance, and fix the gap before promoting the app",
            "Delete the app",
            "Submit a new build",
          ],
          correctIndex: 1,
          explanation: "Assess the real impact and fix it with the client. Next time set manual release so approval does not equal go-live.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b09-submission-q9",
          prompt: "After the app is released, what closes the submission stage properly?",
          options: [
            "Closing the ticket",
            "Confirming the listing shows on the storefronts and smoke-testing the app installed from the store",
            "Sending the invoice",
            "Deleting the TestFlight builds",
          ],
          correctIndex: 1,
          explanation: "Check what customers actually get: the live listing and the store-installed build.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "You are submitting a rebranded fitness-booking app for a gym chain in the UAE. Put the submission steps in the right order.",
        items: [
          { id: "entry", label: "Confirm written UAT sign-off and a complete listing in the client's own store accounts" },
          { id: "upload", label: "Bump the version and build number, archive and upload the release build" },
          { id: "attach", label: "Attach the processed build to the version and add review notes, a demo account and app access instructions" },
          { id: "release", label: "Set manual release (Apple) and managed publishing (Google)" },
          { id: "submit", label: "Submit for review and tell the client the review window and planned go-live date" },
          { id: "respond", label: "Track the status daily and answer any reviewer message, fixing and resubmitting if needed" },
          { id: "golive", label: "After approval and the go-live checklist, release and confirm the app on every storefront" },
        ],
        correctOrder: ["entry", "upload", "attach", "release", "submit", "respond", "golive"],
        explanation:
          "Entry criteria first, then the build, because you cannot attach what is not uploaded. The release option is chosen before you submit, so approval cannot publish the app by accident. Review follows submission, and go-live is a separate, deliberate step after approval.",
      },
    },
    {
      id: "pmp-b09-rejections",
      moduleId: "pmp-b09",
      trackId: "pm",
      title: "Handling rejections, including 4.2.6 and spam",
      summary:
        "Every PM who ships apps gets rejections. For [[term:white-label]] apps, a few guidelines cause most of them, and they are about the business model rather than the code. Apple's guideline 4.2.6 rejects apps created from a commercialised template unless they are submitted directly by the provider of the app's content. Its spam guideline 4.3 rejects multiple bundle IDs of the same app and apps that are indistinguishable from others. Google's spam policy disallows multiple apps with highly similar functionality, content and user experience.\n\nSo the defence starts long before submission. Submit from the client's own developer account, as the content provider. Make the app genuinely the client's: its brand, its content, its configuration, not a re-coloured demo. Apple's guideline 5.2 adds that apps must be submitted by the person or legal entity that owns or has licensed the IP.\n\nWhen a rejection arrives, read it carefully, find the cause and answer in App Store Connect (the old Resolution Center) or check the policy status in Play Console. Fix what the reviewer asked for. Disagree with evidence, and if you still disagree, use the formal appeal. Tell the client the cause, the fix and the new date the same day.\n\nThe common mistake is arguing with the reviewer or resubmitting the same build hoping for a different reviewer. Apple states that repeated rejections for the same guideline make later reviews take longer. Each careless resubmission makes the next one slower, for this client and sometimes for the account.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Apple: App Review Guidelines (4.2.6, 4.3, After You Submit)", url: "https://developer.apple.com/app-store/review/guidelines/", kind: "spec", verifiedAt: "2026-10-02T11:46:13Z" },
        { label: "App Store Connect Help: Reply to App Review messages", url: "https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/reply-to-app-review-messages", kind: "docs", verifiedAt: "2026-10-02T11:49:59Z" },
        { label: "Play Console Help: Spam policy", url: "https://support.google.com/googleplay/android-developer/answer/9899034?hl=en", kind: "spec", verifiedAt: "2026-10-02T11:46:31Z" },
        { label: "App Store Connect Help: App and submission statuses", url: "https://developer.apple.com/help/app-store-connect/reference/app-and-submission-statuses", kind: "docs", verifiedAt: "2026-10-02T11:46:21Z" },
      ],
      video: {
        title: "App Store is banning developers for this simple mistake: 4.3(a) Spam Rejections",
        channel: "Adam Lyttle",
        url: "https://www.youtube.com/watch?v=i48JgOr2W64",
        videoId: "i48JgOr2W64",
        verifiedAt: "2026-10-02T12:00:51Z",
      },
      alternateVideos: [
        {
          title: "Apple Rejected Your App for 4.3? Here’s How to Fix It",
          channel: "molfar - product wise guys",
          url: "https://www.youtube.com/watch?v=qvSt_lDUEOo",
          videoId: "qvSt_lDUEOo",
          verifiedAt: "2026-10-02T12:00:52Z",
        },
        {
          title: "Why My App Was Rejected and How I Got It Approved | App Store Review Process Explained",
          channel: "Think Like an Engineer",
          url: "https://www.youtube.com/watch?v=gvQiTtUU_LE",
          videoId: "gvQiTtUU_LE",
          verifiedAt: "2026-10-02T12:00:53Z",
        },
      ],
      handbook: {
        stages: ["wl-submission"],
        rules: ["client-owned-store-accounts", "store-rejection-fixes"],
      },
      sections: [
        {
          heading: "The guidelines that hit white-label apps",
          body:
            "- **Apple 4.2.6 (template apps).** Apps created from a commercialised template or app generation service are rejected unless they are submitted directly by the provider of the app's content. Apple says these services should not submit apps on behalf of their clients. The other acceptable option it describes is a single \"picker\" app that hosts all clients' content. In practice: each white-label app goes out from the **client's own** developer account, and is meaningfully the client's.\n- **Apple 4.3(a) (spam).** Do not create multiple bundle IDs of the same app; consider one app with variations instead.\n- **Apple 4.3(b) (spam).** Do not submit apps that are indistinguishable from apps already widely available.\n- **Apple 5.2 (intellectual property).** Apps must be submitted by the person or legal entity that owns or has licensed the IP.\n- **Google Play spam policy (repetitive content).** No multiple apps with highly similar functionality, content and user experience; Google suggests aggregating small apps into one. Webview apps of a website need the site owner's permission.\n\nThese are the reasons the [[term:client-owned-accounts]] rule exists. Follow the Oyelabs rule in the handbook card below.",
        },
        {
          heading: "Reading a rejection and finding the cause",
          body:
            "Every rejection message cites a guideline. Before you reply, put the rejection in one of these buckets:\n\n1. **Build or functional defect** (a crash, a broken flow, a dead back-end): Oyelabs' work to fix.\n2. **Missing reviewer access** (no demo account, OTP not explained): fix the review notes and reply.\n3. **Listing or privacy content** (misleading text, wrong declarations, missing policy): usually client content, fixed with the client.\n4. **Business model or account** (4.2.6, 4.3, 5.2, an agency account): needs the client's account, more customisation, or a different model.\n5. **Reviewer misunderstanding**: reply with a clear explanation, screenshots or a short video.\n\nThe bucket decides who fixes it, how fast, and whether it is billable. For billing, follow the Oyelabs rule in the handbook card below. Not legal advice: the signed contract always wins.",
        },
        {
          heading: "Replying, appealing and resubmitting",
          body:
            "**Apple.**\n- Reply to App Review in App Store Connect (this replaced the old \"Resolution Center\"). Keep it short and factual: what you changed, or why the app complies, with evidence.\n- If you still disagree after replying, submit a formal appeal.\n- For an app that is already live, Apple's guidelines say bug-fix submissions are not delayed over guideline issues, except legal or safety ones. You can ask for this in your reply and fix the guideline issue in the next submission. Useful when a [[term:hotfix]] is blocked by an unrelated complaint.\n- Repeated rejections for the same guideline make later reviews longer.\n\n**Google.**\n- Check the app's policy status in Play Console, fix the cited issue, and send the changes for review again.\n\n**Both.** Log every rejection with its date, guideline, cause, fix and [[term:resubmission]] date. Patterns across clients tell the core team what to fix once for everyone.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A white-label salon-booking app for a chain in Riyadh.* Apple rejects the first submission under 4.3(a): the reviewer says it duplicates other apps.\n\n1. **Same day, read and classify.** The PM checks the submission. It went from the client's own account, as required. But the app still uses the core's stock home screen, stock imagery and a description very close to two other clients' listings. Bucket: business model and content.\n2. **Plan with the tech lead.** The client's own content is ready but was never loaded: its salon locations, stylists' profiles and photo gallery, plus a configured loyalty tier. All of it is [[term:configuration]], no code.\n3. **Tell the client.** \"Apple rejected the app because it looks too similar to other apps on the store. We will load your salons, stylists and gallery, and rewrite the listing with you so it reflects your brand. New submission on Wednesday; typical review is about a day.\"\n4. **Fix and reply.** The team loads the content, the client approves a new description and screenshots, and the PM replies to App Review describing what is unique to this salon chain, then resubmits.\n5. **Approved Thursday.** The PM logs the cause and suggests the core team add \"client content loaded\" to the store-listing checklist.\n\nWhat the PM did not do: argue that the code is fine, resubmit the same build, or offer to publish from Oyelabs' account.",
        },
        {
          heading: "Hard cases",
          body:
            "- **The reseller wants to publish under Oyelabs' account to save time.** That is the 4.2.6 risk exactly, and moving the app later is a transfer with conditions on both sides. Refuse, explain, and give the reseller's end client a concrete list and timeline for opening its own accounts. The practice below rehearses this conversation.\n- **Two clients in the same niche, both rejected for spam.** More configuration and content may not be enough if the apps are truly near-identical. Raise it with BD and the tech lead: a picker-style app or genuine customisation is a commercial decision, not a PM workaround.\n- **A live app's urgent fix is blocked by a new guideline complaint.** Ask Apple, in your reply, to let the bug fix through and commit to fixing the guideline issue in the next submission.\n- **The rejection is for the client's business model** (for example a regulated service without the licence). The PM cannot fix it. Escalate to the client with the reviewer's wording and let the client decide.\n- **The reviewer is wrong.** Reply once with evidence. If it stands, use the appeal; do not keep resubmitting.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Resubmitting the same build unchanged.** Stop. Fix or explain first; repeated rejections slow later reviews.\n- **Hiding the rejection from the client.** Tell them the same day with the cause, the plan and the new date. A rejection explained calmly is routine; a rejection discovered later is a trust problem.\n- **Blaming the store.** The client hears excuses. Explain what the guideline asks for and what you are doing.\n- **Fixing client-caused rejections for free without thinking.** Check the cause bucket and follow the rule in the handbook card before you commit effort.\n- **No log.** Without a rejection log you will repeat the same mistake for the next client.",
        },
        {
          heading: "Your checklist",
          body:
            "- Submitted from the client's own accounts, as the content provider.\n- Client content, branding and listing make the app clearly the client's, not a re-coloured demo.\n- Rejection read, guideline identified and cause bucketed the same day.\n- Client told the cause, fix, owner and new date in writing.\n- Fix made, or evidence prepared; reply sent in App Store Connect or the fix sent for review in Play Console.\n- Appeal used only after a clear reply was not accepted.\n- Rejection logged with cause and fix, and core-level lessons passed to the core team.",
        },
      ],
      sop: [
        {
          title: "Our rejection log and reply templates",
          prompt:
            "[Oyelabs SOP – admin to fill] Where store rejections are logged per client, the reply templates used for common guidelines (4.2.6, 4.3, 2.1, 5.1.1), who decides the cause, and when BD is involved.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b09-rejections-q1",
          prompt: "Apple rejects a white-label app under guideline 4.2.6. The app was submitted from Oyelabs' developer account. What is the core problem?",
          options: [
            "The app has a bug",
            "Template-based apps must be submitted directly by the provider of the app's content, so the client should publish from its own account",
            "The screenshots are the wrong size",
            "Oyelabs' account fee is unpaid",
          ],
          correctIndex: 1,
          explanation: "4.2.6 says template services should not submit apps on behalf of clients. The fix is the client's own account, as content provider.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b09-rejections-q2",
          prompt: "Which guidelines and policies typically cause rejections of near-identical white-label apps? (Select all that apply.)",
          options: [
            "Apple 4.3(a): multiple bundle IDs of the same app",
            "Apple 4.3(b): apps indistinguishable from apps already widely available",
            "Google Play spam policy on repetitive content",
            "Apple's screenshot specification",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Spam and repetitive-content rules target clones. Screenshot specs are an upload rule, not a rejection theme for clones.",
        },
        {
          id: "pmp-b09-rejections-q3",
          prompt: "Where do you reply to an Apple reviewer today?",
          options: [
            "By email to Apple support",
            "In App Store Connect, by replying to the App Review message (formerly the Resolution Center)",
            "In TestFlight feedback",
            "On the Apple Developer Forums",
          ],
          correctIndex: 1,
          explanation: "Replies go through App Store Connect. The old name was Resolution Center.",
        },
        {
          id: "pmp-b09-rejections-q4",
          prompt: "A rejection seems wrong. You replied once with screenshots, and the reviewer did not change the decision. What next?",
          options: [
            "Resubmit the same build until a different reviewer approves it",
            "Submit a formal appeal",
            "Publish from another account",
            "Change the bundle ID and submit as a new app",
          ],
          correctIndex: 1,
          explanation: "The appeal is the formal route. Resubmitting unchanged builds leads to longer reviews; a new bundle ID invites a 4.3 spam rejection.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b09-rejections-q5",
          prompt: "A live white-label app needs an urgent crash fix, but the update is rejected for an unrelated, non-legal guideline issue. What can you ask Apple for?",
          options: [
            "Nothing: all guideline issues block every update",
            "To let the bug fix through and fix the guideline issue in the next submission, since bug fixes for live apps are not delayed over guideline issues other than legal or safety ones",
            "A refund of the developer fee",
            "An exemption from the guideline forever",
          ],
          correctIndex: 1,
          explanation: "Apple's \"After You Submit\" guidance allows this for live apps, except for legal and safety issues.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b09-rejections-q6",
          prompt: "Apple rejects the app because the reviewer could not log in: no demo account was supplied. Which bucket is this?",
          options: ["Business model", "Missing reviewer access", "Client's legal content", "Core defect"],
          correctIndex: 1,
          explanation: "Add a demo account and notes, then reply. It is a quick fix, but it cost a full review cycle.",
        },
        {
          id: "pmp-b09-rejections-q7",
          prompt: "The reviewer says the salon app duplicates other apps (4.3). Which actions make the app genuinely the client's? (Select all that apply.)",
          options: [
            "Load the client's real locations, staff and gallery content",
            "Rewrite the listing and screenshots with the client so they reflect its brand",
            "Change only the app's primary colour",
            "Configure client-specific options the core supports",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Real content, brand-specific listing and configuration help. A colour change alone keeps the app indistinguishable.",
        },
        {
          id: "pmp-b09-rejections-q8",
          prompt: "Guideline 5.2 says apps must be submitted by whom?",
          options: [
            "Any developer with an account",
            "The person or legal entity that owns or has licensed the intellectual property",
            "The agency that wrote the code, always",
            "The store reviewer",
          ],
          correctIndex: 1,
          explanation: "IP ownership or licence matters. In white-label, the client publishes under the licence it holds for the product.",
        },
        {
          id: "pmp-b09-rejections-q9",
          prompt: "A rejection was caused by the client's listing text making claims the app cannot support. Who usually pays for the rework?",
          options: [
            "Always Oyelabs",
            "It depends on the cause and the contract: follow the Oyelabs rule in the handbook; client-content causes are typically the client's responsibility",
            "Apple",
            "Nobody: rework is free",
          ],
          correctIndex: 1,
          explanation: "Typically agency-caused rejections are fixed free and client-caused ones are not, but the Oyelabs rule and the signed contract decide.",
        },
        {
          id: "pmp-b09-rejections-q10",
          prompt: "Why log every rejection with its guideline, cause and fix?",
          options: [
            "Apple requires it",
            "Patterns across clients show what to fix once in the core or the checklists, and later PMs avoid the same rejection",
            "To bill the client automatically",
            "It is only needed for Google",
          ],
          correctIndex: 1,
          explanation: "A rejection log turns individual failures into a portfolio-wide fix.",
        },
      ],
      practice: {
        kind: "roleplay",
        prompt:
          "You are the Oyelabs PM on a white-label fitness-booking app, rebranded for a reseller's end client, a gym chain. The builds are ready and QA has passed. Submission is blocked because the end client has no Apple Developer or Google Play Console account yet. The reseller messages you.",
        scenarioId: "missing-store-account",
        personaId: "whitelabel-reseller",
        maxTurns: 6,
        brief:
          "Refuse to publish under Oyelabs' account and explain why in terms the reseller can repeat (guideline 4.2.6, ownership, the bundle ID, painful transfers, the legal name on the listing). Give the end client's exact steps and realistic timelines (D-U-N-S, enrolment, store review), say what is blocked and what continues, and agree owners and dates.",
        rubric: [
          { label: "Clarity", points: 2, description: "Short, plain messages; the main point comes first; no jargon the client would not know." },
          {
            label: "Correct use of process and terms",
            points: 3,
            description: "Names the right process (change request, warranty, UAT triage, client-owned accounts) and uses agency terms correctly, explained where needed.",
          },
          { label: "Empathy", points: 2, description: "Acknowledges the client's situation and feelings; asks about the underlying need before defending a position." },
          {
            label: "A firm and fair scope position",
            points: 3,
            description: "Holds the signed scope and the rate card without conceding work for free, while offering fair options (phase it, trade off, a CR).",
          },
          { label: "A clear next step", points: 2, description: "Ends with a concrete next step: who does what, by when." },
          {
            label: "The follow-up email",
            points: 3,
            description: "A short email that confirms what was agreed, the decision or options, the owners and dates, in a professional tone.",
          },
        ],
        followUp: true,
      },
    },
  ],
} satisfies Module;
