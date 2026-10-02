import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-e03",
  trackId: "pm",
  name: "Templates: Release & close templates",
  description:
    "The five documents that take a project from launch to a clean finish: the white-label onboarding checklist, the go-live checklist, the hypercare log, the handover and KT checklist, and the closure report. For each one: when it is used, who fills, approves and receives it, a field-by-field walkthrough, and a practice task where you complete it from a real-looking scenario.",
  topics: [
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-e03-whitelabel-onboarding",
      moduleId: "pmp-e03",
      trackId: "pm",
      title: "White-label onboarding checklist",
      summary:
        "A [[term:white-label]] project rarely slips because of code. It slips because the client has not opened an Apple account, has no D-U-N-S number, or emailed the payment keys in plain text. The onboarding checklist is the one place that tracks everything the client must provide or set up: the [[term:brand-kit]], the [[term:client-owned-accounts|client-owned accounts]], the listing content and the business [[term:configuration]].\n\nThe PM starts it on the day the deal is handed over, and fills it with the client's [[term:spoc|SPOC]]. Every row has one owner, a required-by date and a status. The client receives it after kickoff and at every weekly status call, until every row is done. The Oyelabs team uses it to decide when setup, builds and store submission can start.\n\nThe longest items go first. An [[term:apple-developer-account|Apple Developer]] organisation account needs a legal entity and a D-U-N-S number, and a [[term:google-play-console|Google Play]] organisation account needs one too. Getting a D-U-N-S number can take up to 30 days. So a typical first action is to start D-U-N-S and store enrolment in week 1, before a single colour is chosen.\n\nThe common mistake is treating the checklist as a list of files to collect. It is really a list of decisions and dependencies with dates. A row that says \"Apple account – client – pending\" with no date and no next step is the row that delays go-live by a month.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Apple Developer: Enroll as an organization (Apple Developer Program)", url: "https://developer.apple.com/programs/enroll/", kind: "docs", verifiedAt: "2026-10-02T12:04:47Z" },
        { label: "Apple: App Review Guidelines (4.2.6 template apps, 4.3 spam)", url: "https://developer.apple.com/app-store/review/guidelines/", kind: "spec", verifiedAt: "2026-10-02T12:04:47Z" },
        { label: "Play Console Help: Required information to create a developer account", url: "https://support.google.com/googleplay/android-developer/answer/13628312", kind: "docs", verifiedAt: "2026-10-02T12:04:50Z" },
        { label: "App Store Connect Help: Add and edit users", url: "https://developer.apple.com/help/app-store-connect/manage-your-team/add-and-edit-users", kind: "docs", verifiedAt: "2026-10-02T12:04:49Z" },
      ],
      video: {
        title: "Enterprise SaaS Customer Onboarding | Best Practices You Should Follow ",
        channel: "Swarnendu De",
        url: "https://www.youtube.com/watch?v=3-L-WpSGoh4",
        videoId: "3-L-WpSGoh4",
        verifiedAt: "2026-10-02T12:05:48Z",
      },
      alternateVideos: [
        {
          title: "How to Onboard a New Client from US | How to Onboard International Clients | Onboarding Process",
          channel: "Chetan Agarwal",
          url: "https://www.youtube.com/watch?v=WuzzgPa51lw",
          videoId: "WuzzgPa51lw",
          verifiedAt: "2026-10-02T12:05:48Z",
        },
      ],
      handbook: {
        stages: ["wl-brand-kit", "wl-accounts", "wl-configuration", "wl-store-listing"],
        rules: ["client-owned-store-accounts", "secure-credential-sharing", "configuration-vs-customisation"],
        templates: ["whitelabel-onboarding"],
      },
      sections: [
        {
          heading: "When it is used and who owns it",
          body:
            "- **When:** opened at the white-label kickoff, right after the demo call scope is agreed, and kept open until the apps are live. It feeds the accounts, [[term:brand-kit|brand kit]], configuration and [[term:store-listing-assets|store listing]] work.\n- **Who fills it:** the Oyelabs PM creates the rows and keeps the statuses true. The client SPOC fills in what they provide and confirms dates.\n- **Who approves it:** there is no formal sign-off. The client SPOC confirms the list and the dates in writing, usually in the kickoff [[term:mom|MoM]].\n- **Who receives it:** the client SPOC and sponsor every week, and the internal team (developer, designer, QA) so they know what is blocked.\n- **Why it exists:** every account must sit in the client's name. Follow the Oyelabs rule in the handbook card below on client-owned store accounts. Apple guideline 4.2.6 rejects apps from a commercialised template unless the content provider submits them, which is why a white-label app ships from the client's own developer account.",
        },
        {
          heading: "Field by field: what good entries look like",
          body:
            "- **#:** a stable number. Do not renumber when rows are added; people quote numbers in emails.\n- **Item:** specific and testable. Good: \"Logo as SVG, or 1024×1024 PNG with transparency\". Weak: \"Logo\". The weak version gets you a 200-pixel JPEG from a WhatsApp chat.\n- **Category:** brand, account, content or configuration. Use it to filter: account rows have the longest lead times, so review them first in every call.\n- **Owner:** one named role per row. For accounts, the owner is almost always the client, because only the client can enrol its legal entity. Oyelabs owns the follow-up, not the account.\n- **Required by:** a date worked back from the build, submission and go-live plan. Good: \"Apple enrolment started by 9 Oct (week 1)\". Common mistake: leaving it blank, so nobody notices the row is late.\n- **Status:** a short fixed list such as Not started, In progress, Waiting on third party, Blocked, Received, Done. \"Pending\" on its own hides whether the client has even started.\n- **Notes:** the next step and anything that changes the plan. Good: \"D-U-N-S requested 6 Oct; Apple enrolment can start once it arrives\". Never put a password or API key here.\n\n**Account rows to get right.**\n- **Apple Developer organisation:** the organisation must be a legal entity; Apple does not accept trade names or DBAs. It needs a D-U-N-S number, a person with legal binding authority, a work email on the company's domain and a public website. The fee is 99 USD a year, and the organisation name becomes the seller name on the App Store.\n- **Google Play organisation:** needs a D-U-N-S number, a website, contact details and identity verification before publishing. The fee is a one-time 25 USD.\n- **Access:** Oyelabs is invited through user roles in App Store Connect and the Play Console, never through a shared login.\n- **Hosting, domain, payment, messaging:** [[term:hosting-account]], [[term:domain-ownership|domain]], [[term:payment-gateway-account|payment gateway]] and [[term:messaging-provider-accounts|SMS or email provider]] all in the client's name. [[term:api-keys|Keys]] come through the approved secure channel.\n- **Content:** [[term:privacy-policy-url|privacy policy URL]] live on the client's domain, store descriptions in every launch language, screenshots, support email.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "A white-label grocery app is being rebranded for a client in Oman. Kickoff is on a Monday; the target store submission date is six weeks later.\n\n1. On day 1 the PM opens the checklist with 18 rows. The five account rows are at the top, each with the client as owner and a required-by date in week 1 or 2.\n2. In the kickoff, the client says they will enrol with Apple under the shop's trading name. The PM explains that Apple needs the registered legal entity and its D-U-N-S number, and the note on that row becomes \"Enrol as the registered LLC; check D-U-N-S lookup first\".\n3. The client's finance manager has a D-U-N-S number already, so Apple enrolment starts on day 3. The Play Console organisation account is created on day 4, and Oyelabs is invited with release permissions.\n4. The payment gateway keys arrive by email. The PM does not use them. The row moves to Blocked with the note \"Keys must be rotated and shared via the password manager\", and the PM tells the client why in the same reply.\n5. Each Thursday the checklist is the first item on the status call. By week 4 only the Arabic store description is open, and its owner and date are in the weekly [[term:status-report]].\n\nThe outcome: builds are ready in week 5 and nothing waits on an account, because the slow rows were started first.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **The client enrols with a personal or trade-name account.** Recover: stop before any build is uploaded. Explain the seller-name and ownership problem, and help them start an organisation enrolment for the legal entity. Re-plan the submission date in writing.\n- **Oyelabs creates the account \"to save time\".** Recover: move it to the client's ownership before submission, and record that in the MoM. Apple guideline 4.3 also rejects multiple Bundle IDs of the same app, so a white-label app from the agency's account is a double risk.\n- **Keys or passwords are sent by email or chat.** Recover: do not use them. Ask for rotation and the approved channel. Follow the Oyelabs rule in the handbook card below.\n- **Rows have no dates.** Recover: work back from the submission date and add a required-by date to every row in the next status call.\n- **Configuration choices arrive as \"we'll decide later\".** Recover: give each choice a decision date, and say which build it blocks.\n- **Content is left to the last week.** Store descriptions, screenshots and the privacy policy URL are needed for submission; chase them as hard as accounts.",
        },
        {
          heading: "Your checklist",
          body:
            "- Open the checklist on day 1 and put account rows first.\n- Start D-U-N-S and store enrolment in week 1 (typical).\n- One owner, one required-by date and one fixed status per row.\n- Enrol with the legal entity, not a trade name.\n- Oyelabs gets access through user roles, never a shared login.\n- Keys and passwords only through the approved secure channel.\n- Review the checklist in every weekly status call until it is empty.\n- Record changes to dates in the MoM and the status report.",
        },
      ],
      sop: [
        {
          title: "Where the onboarding checklist lives and who updates it",
          prompt:
            "[Oyelabs SOP – admin to fill] Where Oyelabs keeps each client's white-label onboarding checklist (shared drive, project tool), who may edit it on the client side, and how often the PM must update it.",
        },
        {
          title: "Approved channel for receiving client credentials",
          prompt:
            "[Oyelabs SOP – admin to fill] The password manager or vault Oyelabs uses to receive client keys and logins, how to invite a client to share into it, and who on the Oyelabs side has access.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-e03-whitelabel-onboarding-q1",
          prompt: "In the kickoff, a white-label client in Qatar says: \"Let's enrol with Apple under our brand name, QuickBasket. The company is registered as Al Waha Holdings.\" What do you advise?",
          options: [
            "Enrol as Al Waha Holdings, the legal entity, with its D-U-N-S number; Apple does not accept trade names",
            "Enrol as QuickBasket, because the seller name should match the brand",
            "Oyelabs enrols under its own account and lists the app as QuickBasket",
            "Enrol as an individual first and convert later",
          ],
          correctIndex: 0,
          explanation:
            "Apple's organisation enrolment requires a legal entity and does not accept DBAs or trade names. The app's display name can still be QuickBasket; the seller name is the legal entity.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-whitelabel-onboarding-q2",
          prompt: "Why should the D-U-N-S and store enrolment rows be started in week 1?",
          options: [
            "A D-U-N-S number can take up to 30 days, and both stores need it for an organisation account",
            "Apple charges more for late enrolment",
            "The builds cannot be coded until the account exists",
            "Google deletes developer accounts that are not used within a week",
          ],
          correctIndex: 0,
          explanation:
            "The lead time sits outside your control, with Dun & Bradstreet and the stores. Coding can proceed without the account; only upload and submission need it.",
        },
        {
          id: "pmp-e03-whitelabel-onboarding-q3",
          prompt: "Which entries belong on the white-label onboarding checklist? (Select all that apply.)",
          options: [
            "Google Play organisation account, Oyelabs invited with release permissions",
            "Privacy policy published on the client's domain",
            "Delivery zones, commission and tax settings confirmed by the client SPOC",
            "The client's live payment gateway secret key, pasted into the notes column",
            "The developers' daily task estimates",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Accounts, content and configuration decisions are exactly what the checklist tracks. Secrets never go in a spreadsheet, and task estimates belong in the project tool.",
        },
        {
          id: "pmp-e03-whitelabel-onboarding-q4",
          prompt: "The client emails the live payment gateway keys to you in plain text \"to speed things up\". What do you do?",
          options: [
            "Do not use them; ask the client to rotate the keys and share the new ones through the approved secure channel",
            "Use them, then delete the email",
            "Forward them to the developer in a private chat",
            "Save them in the checklist's notes column so they are not lost",
          ],
          correctIndex: 0,
          explanation:
            "Once a secret has travelled by email it must be treated as exposed. Deleting the email does not remove copies on the servers or in backups, so rotation plus the secure channel is the fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-whitelabel-onboarding-q5",
          prompt: "How should Oyelabs get access to the client's App Store Connect account?",
          options: [
            "The client invites Oyelabs team members as users with the right role",
            "The client shares the account holder's Apple ID and password",
            "Oyelabs asks Apple support to add it",
            "Oyelabs does not need access; the client uploads every build",
          ],
          correctIndex: 0,
          explanation:
            "App Store Connect supports adding users with roles. A shared Apple ID breaks two-factor authentication, mixes identities and cannot be revoked per person.",
        },
        {
          id: "pmp-e03-whitelabel-onboarding-q6",
          prompt: "A row reads \"Apple account – client – pending\". What is wrong with it?",
          options: [
            "It has no required-by date and no next step, so nobody can tell whether it is late",
            "The owner should be Oyelabs",
            "Apple accounts belong in the RAID log, not the checklist",
            "Nothing: pending is a clear status",
          ],
          correctIndex: 0,
          explanation:
            "\"Pending\" hides whether the client has started, is waiting on D-U-N-S or is stuck. The owner is right: only the client can enrol its own entity.",
        },
        {
          id: "pmp-e03-whitelabel-onboarding-q7",
          prompt: "Your sales colleague suggests publishing all white-label grocery clients from Oyelabs' own Apple account to save each client 99 USD a year. What is the main risk?",
          options: [
            "Apple guidelines 4.2.6 and 4.3 reject template apps not submitted by the content provider and multiple copies of the same app",
            "Apple limits each account to five apps",
            "The client would pay more tax",
            "TestFlight would stop working",
          ],
          correctIndex: 0,
          explanation:
            "Guideline 4.2.6 targets apps from commercialised templates, and 4.3 targets spam such as many Bundle IDs of one app. Publishing from each client's own account avoids both and keeps ownership clear.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-whitelabel-onboarding-q8",
          prompt: "The client asks to change the app's checkout flow \"while you're configuring\". Where does this go?",
          options: [
            "Not on the onboarding checklist as a configuration item: it needs code, so it is classified and estimated as custom work",
            "On the checklist as a configuration row owned by the client",
            "Nowhere: changes are refused during onboarding",
            "Into the store listing notes",
          ],
          correctIndex: 0,
          explanation:
            "Configuration is what the panel, theme and toggles can change. A changed flow needs code, so it goes through the gap and CR process. Refusing outright is not the answer either.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "whitelabel-onboarding",
        prompt:
          "You are the PM for a white-label grocery app for a client in Oman. Kickoff was on Monday 5 October 2026. Using the board export and the client's email, update the onboarding checklist. Count as open every row whose status is not Received or Done.",
        context:
          "**Board export, Friday 9 October**\n\n| # | Item | Category | Owner | Status |\n|---|---|---|---|---|\n| 1 | Logo SVG | Brand | Client | Received |\n| 2 | Colours (hex) and font | Brand | Client | Received |\n| 3 | Apple Developer organisation account | Account | Client | Not started |\n| 4 | Google Play Console account | Account | Client | In progress |\n| 5 | Payment gateway live keys | Account | Client | Shared insecurely |\n| 6 | Privacy policy URL | Content | Client | Not started |\n| 7 | Store descriptions EN/AR | Content | Client | Draft |\n| 8 | Delivery zones and fees | Configuration | Client SPOC | Done |\n\n**Email from the client's operations manager:**\n\"Hi, for Apple we'll just use our brand FreshCart, no need for the company name (we're registered as Al Noor Trading LLC). My nephew already made a Google Play account on his Gmail, can you use that one? I also emailed you the payment keys yesterday so you can start. Thanks!\"",
        fields: [
          { id: "open_count", label: "How many rows are still open?", input: "number", required: true },
          { id: "apple_entity", label: "Name the Apple account must be enrolled under", input: "text", required: true },
          {
            id: "play_action",
            label: "Google Play account: what you will do",
            input: "select",
            options: [
              "Use the nephew's personal account",
              "Create an organisation account for Al Noor Trading LLC and invite Oyelabs",
              "Publish from Oyelabs' own account",
            ],
            required: true,
          },
          {
            id: "keys_action",
            label: "Payment keys: what you will do",
            input: "select",
            options: [
              "Use the emailed keys as they are",
              "Ask the client to rotate the keys and share them via the password manager",
              "Store the keys in the project chat for the developer",
            ],
            required: true,
          },
          { id: "next_actions", label: "Next actions for rows 3, 6 and 7 (owner and date for each)", input: "textarea", required: true },
          { id: "reply", label: "Your reply to the client", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "open_count", expected: 5 },
          { fieldId: "apple_entity", expected: "Al Noor Trading LLC" },
          { fieldId: "play_action", expected: "Create an organisation account for Al Noor Trading LLC and invite Oyelabs" },
          { fieldId: "keys_action", expected: "Ask the client to rotate the keys and share them via the password manager" },
        ],
        rubric: [
          { label: "Explains the account rules plainly", points: 3, description: "States that Apple needs the legal entity (no trade names) and a D-U-N-S number, that both store accounts must be the company's, and that FreshCart can still be the app's name." },
          { label: "Every open row has an owner, a date and a next step", points: 3, description: "Rows 3, 6 and 7 each get a named owner, a concrete date that fits a week-1 start for accounts, and a clear next step." },
          { label: "Handles the keys safely without blaming", points: 2, description: "Asks for rotation and the secure channel, explains why in one line, and does not use or forward the emailed keys." },
          { label: "Tone and clarity", points: 2, description: "Polite, short and easy for a non-technical client to act on, with a clear ask and deadline." },
        ],
        sampleAnswer: {
          open_count: "5",
          apple_entity: "Al Noor Trading LLC",
          play_action: "Create an organisation account for Al Noor Trading LLC and invite Oyelabs",
          keys_action: "Ask the client to rotate the keys and share them via the password manager",
          next_actions:
            "Row 3 Apple: client finance manager to look up or request the D-U-N-S number for Al Noor Trading LLC by 12 Oct, then start organisation enrolment the same day. Row 6 Privacy policy: client to publish on their domain by 23 Oct; PM sends a checklist of required sections on 12 Oct. Row 7 Store descriptions: client marketing to send final EN and AR text by 20 Oct; PM reviews within one working day.",
          reply:
            "Hi Sara, thanks for moving so fast. Two account points before we start uploads. Apple and Google both need the company's own organisation account, so please enrol as Al Noor Trading LLC with its D-U-N-S number. The app will still be called FreshCart in the store. Please also create a Google Play organisation account for the company rather than using the personal Gmail one, and invite us with release permissions. For safety, I have not used the payment keys that came by email: please ask the gateway to rotate them and share the new ones through our password manager (invite attached). Could you start the D-U-N-S check by Monday 12 Oct? D-U-N-S can take up to 30 days, so it is our longest lead time. Thanks, Ravi",
        },
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-e03-golive-checklist",
      moduleId: "pmp-e03",
      trackId: "pm",
      title: "Go-live checklist",
      summary:
        "[[term:go-live]] is the one day when a small miss becomes visible to every user at once. A payment key left in sandbox mode, a missing backup or an untested [[term:rollback]] turns a launch into an incident. The go-live checklist turns release day into a list of tasks, each with an owner, a due time, a status and evidence.\n\nThe PM owns the checklist and builds it from the release plan with the tech lead, a week or more before the date. Developers, QA and the tech lead fill their rows. The client sponsor sees it at the [[term:go-no-go]] meeting, where the go decision is taken and written in the [[term:mom|MoM]]. After launch, it is evidence of what was checked.\n\nGood checklists follow the order of the day: pre-release ([[term:uat]] [[term:sign-off]], accounts, production configuration, backups), the go/no-go decision, the [[term:cutover]] and [[term:deployment]], the [[term:smoke-test]], store release for apps, rollback readiness, and communication. Microsoft's go-live guidance ends each area with a stakeholder sign-off, and its cutover plan lists dependencies, timing, roles and verification steps. An app agency adds store items Microsoft does not: store listing, review submission, production keys and analytics.\n\nThe common mistake is ticking rows from memory. \"Production keys set\" is not the same as \"a real payment of 1 USD went through on production and was refunded\". Write the evidence, or the row is not done.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Learn: Use the go-live checklist (Dynamics 365 implementation guide)", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-checklist", kind: "docs", verifiedAt: "2026-10-02T12:04:26Z" },
        { label: "Microsoft Learn: Prepare your production environment to go live", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-to-go-live", kind: "docs", verifiedAt: "2026-10-02T12:04:44Z" },
        { label: "Google SRE Book: Reliable Product Launches at Scale (launch checklist)", url: "https://sre.google/sre-book/reliable-product-launches/", kind: "docs", verifiedAt: "2026-10-02T12:04:27Z" },
        { label: "Atlassian: Software releases, 3 ingredients for success", url: "https://www.atlassian.com/agile/software-development/release", kind: "article", verifiedAt: "2026-10-02T12:04:44Z" },
      ],
      video: {
        title: "Best Free Go Live Checklist and Plan for Project, Program, and Change Teams",
        channel: "OCM Solution (OCMS)",
        url: "https://www.youtube.com/watch?v=NmOh5evT-aU",
        videoId: "NmOh5evT-aU",
        verifiedAt: "2026-10-02T12:05:44Z",
      },
      alternateVideos: [
        {
          title: "How to Prepare for an ERP  Implementation Go-Live [Digital Transformation Readiness]",
          channel: "Digital Transformation with Eric Kimberling",
          url: "https://www.youtube.com/watch?v=wP7wq5bjxl8",
          videoId: "wP7wq5bjxl8",
          verifiedAt: "2026-10-02T12:05:44Z",
        },
      ],
      handbook: {
        stages: ["custom-release", "wl-golive"],
        rules: ["uat-signoff-before-golive", "client-owned-store-accounts", "secure-credential-sharing"],
        templates: ["golive-checklist"],
      },
      sections: [
        {
          heading: "When it is used and who owns it",
          body:
            "- **When:** drafted when the release date is set, reviewed at the go/no-go meeting, worked through on release day, and closed after the smoke test and the go-live email.\n- **Who fills it:** the PM builds and chases it. The tech lead owns infrastructure, backups and rollback rows. Developers own configuration and deployment rows. QA owns the smoke test. The client owns rows only it can do, such as approving the store release or confirming DNS.\n- **Who approves:** the go decision is taken at the go/no-go meeting with the client sponsor and recorded in the MoM. Follow the Oyelabs rule in the handbook card below: nothing goes to production without written UAT sign-off.\n- **Who receives it:** the release team on the day, the client sponsor at go/no-go, and the project archive afterwards.\n- **Custom vs white-label:** on a custom build the risky rows are migrations, data and integrations. On a white-label launch they are client-owned store accounts, production keys in the client's name and the store review.",
        },
        {
          heading: "Field by field: what good entries look like",
          body:
            "The template is a table with seven columns.\n\n- **#:** the order things happen in. Release day is a sequence; a backup row numbered after the deployment row is a bug in the plan.\n- **Area:** pre-release, accounts, config, data, go/no-go, deploy, smoke test, stores, rollback, comms. Areas let you see at a glance that nothing is missing.\n- **Task:** a verifiable action. Good: \"Production payment keys set and a 1 USD live payment completed and refunded\". Weak: \"Payments OK\".\n- **Owner:** one role or name. \"Team\" is not an owner.\n- **Due:** a date and, on release day, a time. Good: \"Tue 10 Nov, 06:00 GST, before the deployment window\". Mistake: one due date for the whole sheet, which hides the order.\n- **Status:** Not started, In progress, Done, Blocked or Not applicable. A blocked row on a must-have item means no-go until it is cleared.\n- **Evidence or notes:** a link or fact. \"Backup file name and size\", \"MoM of go/no-go, 9 Nov\", \"TestFlight build 52 approved\". The common mistake is leaving it empty, which means nobody can prove the row was done.\n\n**Rows teams forget.**\n- The rollback trigger, agreed before the release. Example: \"payment failure rate above the threshold agreed in go/no-go\".\n- The store release mode (manual release after approval, so the app does not appear before the backend is live).\n- Analytics and crash reporting switched to production.\n- Who is on call for the first hours, and how the client reaches them.\n- The go-live email to client stakeholders, with the [[term:hypercare]] contact and [[term:escalation-matrix|escalation path]].",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "A Laravel and React salon-booking platform with two mobile apps launches for a client in Saudi Arabia.\n\n1. A week before the date, the PM and tech lead build a 24-row checklist from the release plan. Each row has an owner and a time on the day.\n2. Two days before, at the go/no-go meeting, the PM walks the client sponsor through it. UAT is signed, accounts are in the client's name, and the backup and rollback rows are ready. The production SMS sender ID is still pending with the provider. The sponsor and PM agree: go, on condition that the sender ID is approved by 18:00 the day before, otherwise no-go and the next window. The decision and the condition go into the MoM.\n3. The sender ID arrives at 15:00. The row is ticked with the provider's approval email as evidence.\n4. Release day runs in order: backup, deployment and migrations, configuration check, smoke test of sign-up, booking, payment and notifications, then the manual store release of both apps.\n5. The PM sends the go-live email with the hypercare contact and the escalation matrix, and attaches the completed checklist to the project record.\n\nNotice what made it work: a conditional go was written down with a deadline, and every tick has evidence.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Going live without written UAT sign-off because the client said \"looks fine\" on a call.** Recover: get the sign-off in writing before the deployment, even a short email that names the build. If it cannot come in time, it is a no-go.\n- **Production keys never tested.** Recover: add a live test transaction row with evidence. If the keys fail on release day, use the rollback trigger rather than debugging in production for hours.\n- **No rollback plan, or one nobody has tried.** Recover: test it on staging before go/no-go. Name the trigger and who decides.\n- **The app goes live in the store before the backend.** Recover: use manual release after approval and put the store release row after the smoke test.\n- **The checklist is a copy of the last project.** Recover: walk every row with the tech lead against this project's integrations and accounts; delete what does not apply and add what does.\n- **The go decision is only verbal.** Recover: send the MoM of go/no-go within the hour, with any conditions and deadlines.",
        },
        {
          heading: "Your checklist",
          body:
            "- Build the checklist with the tech lead at least a week before the date.\n- Rows in release-day order, each with one owner, a due time and evidence.\n- Written UAT sign-off before anything reaches production.\n- Production accounts and keys in the client's name, tested with evidence.\n- Backup before deployment; rollback tested, with a named trigger.\n- Go/no-go decision, and any conditions, in the MoM.\n- Smoke test before the store release and before the go-live email.\n- Go-live email with the hypercare contact and escalation path.",
        },
      ],
      sop: [
        {
          title: "Release windows and who can say go",
          prompt:
            "[Oyelabs SOP – admin to fill] Oyelabs' allowed release days and times (for example, no Friday releases), who on the Oyelabs side must attend go/no-go, and who can authorise a go.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-e03-golive-checklist-q1",
          prompt: "The day before go-live, the client says on a call: \"UAT looks fine, go ahead.\" No written sign-off exists. What do you do?",
          options: [
            "Ask for a short written sign-off that names the build before deploying; without it, it is a no-go",
            "Go ahead and note the call in the MoM afterwards",
            "Go ahead, because a verbal yes is legally the same",
            "Postpone go-live by a month to run UAT again",
          ],
          correctIndex: 0,
          explanation:
            "Written UAT sign-off is the gate before production. A short email naming the build is enough and is quick to get; postponing a month is out of proportion.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-golive-checklist-q2",
          prompt: "Which row is written well?",
          options: [
            "Production payment keys set; 1 USD live payment completed and refunded – Developer – 10 Nov 05:30 – Done – gateway transaction ID in notes",
            "Payments OK – Team – Done",
            "Check payments – Developer",
            "Payments – sometime before launch – In progress",
          ],
          correctIndex: 0,
          explanation:
            "It has a verifiable task, one owner, a time and evidence. The others hide who did what and whether it was actually proven.",
        },
        {
          id: "pmp-e03-golive-checklist-q3",
          prompt: "Which items does an app agency need to add to a generic go-live checklist such as Microsoft's? (Select all that apply.)",
          options: [
            "Store listing and review submission",
            "Production keys for payments, SMS and maps",
            "Analytics and crash reporting switched to production",
            "A stakeholder sign-off at the end of each area",
            "Data migration",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Store, keys and analytics are app-specific additions. Stakeholder sign-off and data migration are already in Microsoft's list.",
        },
        {
          id: "pmp-e03-golive-checklist-q4",
          prompt: "Why should the store release be set to manual release after approval?",
          options: [
            "So the app does not appear to users before the backend is live and smoke-tested",
            "Because automatic release costs extra",
            "Because Apple requires manual release for white-label apps",
            "So the client can change the description after approval",
          ],
          correctIndex: 0,
          explanation:
            "Approval timing is not under your control. Manual release lets you put the store release after deployment and the smoke test.",
        },
        {
          id: "pmp-e03-golive-checklist-q5",
          prompt: "At go/no-go, one must-have row is blocked: the SMS provider has not approved the production sender ID. What is the best decision?",
          options: [
            "A conditional go with a deadline (approval by a set time the day before, otherwise no-go), written in the MoM",
            "Go anyway; SMS can be fixed after launch",
            "No-go and cancel the release window without a new date",
            "Remove the SMS row from the checklist",
          ],
          correctIndex: 0,
          explanation:
            "A dated condition keeps the release possible without pretending the risk is gone. Removing the row hides the problem; going without OTP SMS can block every sign-up.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-golive-checklist-q6",
          prompt: "What must be true of the rollback row before go-live?",
          options: [
            "The plan was tested on staging and has a named trigger and decision-maker",
            "It says \"rollback if needed\"",
            "It is owned by the client",
            "It is only filled in if something goes wrong",
          ],
          correctIndex: 0,
          explanation:
            "Under pressure nobody agrees what \"if needed\" means. A tested plan with a trigger lets the team act in minutes rather than argue.",
        },
        {
          id: "pmp-e03-golive-checklist-q7",
          prompt: "During release, the deployment is done but the smoke test shows bookings fail. The rollback trigger agreed was \"any core flow failing after 30 minutes of fixing\". It is minute 40. What happens?",
          options: [
            "The tech lead rolls back as agreed, and the PM informs the client using the escalation path",
            "Keep fixing in production; the team is close",
            "Ask the client whether to roll back",
            "Release the apps anyway so users can at least sign up",
          ],
          correctIndex: 0,
          explanation:
            "The trigger was agreed in advance so nobody has to debate it live. Re-opening the decision during an incident is exactly what the trigger prevents.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-golive-checklist-q8",
          prompt: "What is the main value of the evidence column after launch?",
          options: [
            "It proves what was checked and when, which helps with warranty disputes and the next release",
            "It is required by the App Store",
            "It replaces the MoM",
            "It is only for internal QA metrics",
          ],
          correctIndex: 0,
          explanation:
            "If a client later says \"payments never worked\", a transaction ID and a smoke-test record settle it. The MoM records decisions; the checklist records checks.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "golive-checklist",
        prompt:
          "You run the go/no-go call tomorrow for a Laravel + React salon-booking platform with iOS and Android apps. Review the checklist export and prepare your recommendation. A must-have row that is not Done means no-go, unless it can be finished with evidence before the window.",
        context:
          "| # | Area | Task | Owner | Status |\n|---|---|---|---|---|\n| 1 | Pre-release | Written UAT sign-off for build 61 | PM | Done (email 2 Nov) |\n| 2 | Accounts | Hosting, domain and store accounts in client's name | Tech lead | Done |\n| 3 | Config | Production payment keys set and a live test payment | Developer | Not started (keys arrive 5 Nov) |\n| 4 | Data | Database backup before deployment | Tech lead | Planned for release day |\n| 5 | Rollback | Rollback plan written and tested on staging | Tech lead | Not started |\n| 6 | Stores | Both builds approved, manual release set | Developer | Done |\n| 7 | Comms | Go-live email drafted | PM | In progress |\n\nRelease window: Thursday 5 Nov 2026, 06:00. The SOW's next agreed window is Tuesday 2026-11-10, 06:00. The tech lead says the rollback plan needs a full day to write and test. The payment gateway says the live keys arrive at 17:00 on 5 Nov.",
        fields: [
          { id: "decision", label: "Recommendation for the 5 Nov window", input: "select", options: ["Go", "Conditional go", "No-go"], required: true },
          { id: "blocking_rows", label: "Number of must-have rows that block the 5 Nov window", input: "number", required: true },
          { id: "new_date", label: "Proposed go-live date", input: "date", required: true },
          { id: "actions", label: "Actions before the new window (row, owner, due, evidence)", input: "textarea", required: true },
          { id: "mom_line", label: "Decision line for the go/no-go MoM", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "decision", expected: "No-go" },
          { fieldId: "blocking_rows", expected: 2 },
          { fieldId: "new_date", expected: "2026-11-10" },
        ],
        rubric: [
          { label: "Correct blockers and reasoning", points: 3, description: "Names rows 3 (keys arrive after the window) and 5 (rollback needs a day) as blockers; notes row 4 is planned for the day and row 7 is not a blocker." },
          { label: "Actions are owned, dated and evidenced", points: 3, description: "Each action has an owner, a due date before 10 Nov and the evidence that will close it, such as a transaction ID or a staging rollback log." },
          { label: "MoM line is decision-ready", points: 2, description: "States the decision, the reason, the new date and who agreed, in one or two sentences the sponsor can confirm." },
        ],
        sampleAnswer: {
          decision: "No-go",
          blocking_rows: "2",
          new_date: "2026-11-10",
          actions:
            "Row 3: Developer sets live payment keys on 6 Nov and runs a 1 USD live payment and refund; evidence = gateway transaction ID; due 6 Nov. Row 5: Tech lead writes the rollback plan and tests it on staging; evidence = staging rollback log and trigger agreed with PM; due 6 Nov. Row 4: Tech lead takes the backup at 05:30 on 10 Nov; evidence = file name and size. Row 7: PM finalises the go-live email with hypercare contact and escalation matrix by 9 Nov.",
          mom_line:
            "Decision: no-go for 5 Nov, because the live payment keys arrive after the window and the rollback plan is not yet tested. New go-live: Tuesday 10 Nov, 06:00, the next SOW window. Agreed by the client sponsor and the Oyelabs PM.",
        },
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-e03-hypercare-log",
      moduleId: "pmp-e03",
      trackId: "pm",
      title: "Hypercare log",
      summary:
        "Microsoft describes [[term:hypercare]] as a short period after go-live with extra resources and attention. In those weeks the client reports everything at once: real defects, questions, wishes and panic. Without a log, all of it arrives as \"bugs\", every bug feels urgent, and free [[term:warranty]] work quietly absorbs [[term:change-request|change requests]].\n\nThe hypercare log records every reported item in one place. The PM owns it and usually fills the classification and severity. Developers fill the resolution notes. The tech lead checks severity on anything high. The client SPOC receives it, often daily in the first week and weekly after, and it feeds the hypercare exit decision.\n\nEach row answers five questions. What happened, who reported it and when? Is it a [[term:bug]] under warranty, a change request or a [[term:clarification]]? How severe is it, and what [[term:priority]] follows? Who owns it now? How fast did we respond and resolve, against the agreed [[term:response-time]] and [[term:resolution-time]]?\n\nNo official standard sets hypercare length. Typical industry practice is 2–6 weeks, but that comes from vendor blogs; the contract sets it. Microsoft suggests exit criteria instead of a date alone: no critical issues open, SLAs met, and the support team able to resolve most issues on its own.\n\nThe common mistake is logging a new feature as a bug because the client reported it during hypercare. When something was reported does not decide what it is. Not legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Learn: Plan your support operations (transition and hypercare)", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/transition-to-support-operations", kind: "docs", verifiedAt: "2026-10-02T12:04:28Z" },
        { label: "Atlassian: Understanding incident severity levels", url: "https://www.atlassian.com/incident-management/kpis/severity-levels", kind: "docs", verifiedAt: "2026-10-02T12:04:45Z" },
        { label: "Atlassian: What is an SLA?", url: "https://www.atlassian.com/itsm/service-request-management/slas", kind: "article", verifiedAt: "2026-10-02T12:04:45Z" },
      ],
      video: {
        title: "What is meant by Hypercare period in a Project? #sapimplementation #sapjobs #sapmarket #sapsupport",
        channel: "Ganesh SAP SCM",
        url: "https://www.youtube.com/watch?v=VxG9BYjcff0",
        videoId: "VxG9BYjcff0",
        verifiedAt: "2026-10-02T12:05:45Z",
      },
      alternateVideos: [
        {
          title: "Why Post Go-Live Support Is So Important",
          channel: "DGTL Ventures",
          url: "https://www.youtube.com/watch?v=5w9ruMs93kQ",
          videoId: "5w9ruMs93kQ",
          verifiedAt: "2026-10-02T12:05:45Z",
        },
      ],
      interactive: { kind: "decision-tool", request: "Since go-live, customers in one city cannot pay with the mobile wallet. Other cities work." },
      handbook: {
        stages: ["custom-hypercare", "wl-golive"],
        rules: ["warranty-coverage", "billing-bug-warranty", "hotfix-approval", "billing-change-request"],
        templates: ["hypercare-log"],
      },
      sections: [
        {
          heading: "When it is used and who owns it",
          body:
            "- **When:** from the go-live email until hypercare formally ends, then it continues as the warranty or support log. The first row is often opened within hours of launch.\n- **Who fills it:** the PM logs every report, sets the classification with the decision tool above, and proposes severity. Developers add resolution notes. The tech lead confirms severity for anything High or Critical and approves [[term:hotfix|hotfixes]]: follow the Oyelabs rule in the handbook card below.\n- **Who receives it:** the client SPOC (typical: daily in week 1, then weekly), the Oyelabs delivery head for High and Critical rows, and whoever runs [[term:support]] afterwards.\n- **What it decides:** whether hypercare can exit, what is free under warranty and what goes to the CR process, and what to put in the [[term:known-issues|known issues]] list at handover.\n- **Where it differs:** hypercare length, severity definitions and response and resolution targets come from the contract or [[term:sla|SLA]]. Use the definitions the client signed, not your own.",
        },
        {
          heading: "Field by field: what good entries look like (1 of 2)",
          body:
            "- **ID:** HC-001, HC-002 and so on, never reused. Quote it in every email and commit message.\n- **Date reported:** date and time with the time zone. Response and resolution times are measured from here, so \"Tuesday\" is not enough.\n- **Reported by:** a role and a name. Good: \"Client operations manager (Amina)\". It tells you whom to confirm the fix with.\n- **Description:** what the user did, what happened, what should have happened, where and for whom. Good: \"Customers in Mombasa get 'payment failed' with M-Pesa at checkout since 08:00; Nairobi works.\" Weak: \"Payment broken!!\" Ask for screenshots, the order ID and the device.\n- **Classification:** [[term:bug]] under warranty, change request, enhancement, new feature or clarification. Decide by what the item is, against the accepted scope, not by when it arrived. A single client message often holds two items: split them into two rows.\n- **Severity:** impact, using the contract's scale. A typical scale: Critical = the app or all payments down; High = a core flow broken for a group of users with no workaround; Medium = a workaround exists; Low = cosmetic.",
        },
        {
          heading: "Field by field: what good entries look like (2 of 2)",
          body:
            "- **Priority:** urgency, often derived from severity ([[term:p1-p4]]). Severity is how bad; priority is how soon. A Low-severity typo on the paywall during a launch campaign may still get a high priority.\n- **Owner:** one person who is working on it now. Change it when the item moves, for example from developer to client for a retest.\n- **Status:** New, Acknowledged, In progress, Fixed – awaiting client retest, Resolved, Closed, or Moved to CR. \"Resolved\" means the fix is live; \"Closed\" means the reporter confirmed it.\n- **Response time:** from report to a human acknowledgement with a next step. An auto-reply does not count.\n- **Resolution time:** from report to the fix being live (or a workaround accepted, if the contract allows that).\n- **Resolution notes:** the cause in one line, the fix, the build or hotfix number, and whether an [[term:rca|RCA]] was shared. These notes become your known-issues list and your closure report quality section.\n\n**Common mistakes field by field:** time with no time zone; severity set by how loud the email was; one row for two requests; status Closed before the client retested; empty resolution notes.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "A React Native pharmacy-delivery app for a client in Kenya goes live on a Monday. The contract sets a hypercare window, a severity scale and response targets.\n\n1. Wednesday 08:15 EAT, the client emails: payments fail in Mombasa, and \"also, can you add a reorder-last-basket button?\"\n2. The PM opens two rows. HC-007: payment failure, Bug under warranty (live, in scope, inside the window), severity High (a core flow broken for one city, no workaround), priority P1, owner backend developer. HC-008: reorder button, classified as a new request and moved to the CR process, with a note to the client that it will be estimated separately.\n3. At 08:45 the PM replies with both IDs and the next update time. Response time: 30 minutes.\n4. The tech lead confirms severity and approves a hotfix. It is live at 13:15. Resolution time: 5 hours. Notes: \"Mombasa merchant configuration lost after a zone settings change; restored and covered by a check; RCA sent 16:00.\"\n5. The client retests at 14:00 and confirms; the row moves to Closed.\n6. On Friday the PM sends the weekly log. One exit criterion, no open Critical or High rows, is met for the first time.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Everything is a P1.** Recover: re-read the contract's severity definitions with the client SPOC, and reclassify together. Agree that the tech lead confirms High and Critical.\n- **New features fixed for free because \"it's hypercare\".** Recover: split the row, classify it with the decision tool, and send it through the CR process. Follow the Oyelabs rule in the handbook card below on what warranty covers.\n- **No time stamps, so SLA claims cannot be checked.** Recover: from today, log date, time and zone on every row, and backfill from emails where you can.\n- **Hotfixes deployed without approval.** Recover: record the approval after the fact, explain it in the next status report, and run the next one by the rule.\n- **Hypercare never ends.** Recover: propose the exit criteria in writing (typical: no open Critical or High rows, targets met for an agreed period, support team handling most issues alone), then hand over to support or the [[term:amc]].\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "- One row per item; split mixed messages.\n- Date, time and time zone on every report.\n- Classify by what it is against the accepted scope, not when it arrived.\n- Severity from the contract's scale; priority from severity and urgency.\n- Tech lead confirms High and Critical and approves hotfixes.\n- Record response and resolution times against the agreed targets.\n- Closed only after the reporter confirms.\n- Agree exit criteria in writing, not only a date.",
        },
      ],
      sop: [
        {
          title: "Hypercare length, severity scale and response targets",
          prompt:
            "[Oyelabs SOP – admin to fill] Oyelabs' standard hypercare length, severity definitions, and response and resolution targets per severity, and where a project's contract can override them.",
        },
        {
          title: "Out-of-hours cover during hypercare",
          prompt:
            "[Oyelabs SOP – admin to fill] Who is on call during hypercare outside working hours, how the client reaches them, and when the delivery head must be told.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-e03-hypercare-log-q1",
          prompt: "During week 1 of hypercare, the client writes: \"Bug! The app should let users pay in instalments.\" Instalments were never in scope. How do you log it?",
          options: [
            "As a new request, classified and sent to the CR process, not as a warranty bug",
            "As a P1 warranty bug, because it was reported in hypercare",
            "You do not log it, because it is not a bug",
            "As a clarification",
          ],
          correctIndex: 0,
          explanation:
            "Classification depends on what the item is against the accepted scope. Not logging it loses the request; calling it a clarification ignores that new functionality is being asked for.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-hypercare-log-q2",
          prompt: "What is the difference between severity and priority?",
          options: [
            "Severity is the impact on users; priority is how soon it should be fixed",
            "They are the same thing on different scales",
            "Severity is set by the client; priority by the developer",
            "Priority is only used after hypercare",
          ],
          correctIndex: 0,
          explanation:
            "They usually move together but not always: a cosmetic issue on a campaign page can have low severity and high priority.",
        },
        {
          id: "pmp-e03-hypercare-log-q3",
          prompt: "Which fields does a good hypercare row need for SLA reporting? (Select all that apply.)",
          options: [
            "Date and time reported, with the time zone",
            "Severity using the contract's scale",
            "Response time and resolution time",
            "The developer's hourly rate",
            "The client's satisfaction score",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "SLA targets are per severity and measured from the report time. Rates and satisfaction scores are not part of the log.",
        },
        {
          id: "pmp-e03-hypercare-log-q4",
          prompt: "The client SPOC marks every report as Critical. What is the best fix?",
          options: [
            "Walk through the contract's severity definitions with the SPOC, reclassify together, and have the tech lead confirm High and Critical",
            "Accept the client's severity on every row",
            "Downgrade everything to Medium quietly",
            "Stop logging severity",
          ],
          correctIndex: 0,
          explanation:
            "Shared, written definitions take the emotion out of severity. Quietly downgrading breaks trust and SLA reporting.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-hypercare-log-q5",
          prompt: "A row is fixed in production, but the client has not retested. What status is right?",
          options: [
            "Fixed – awaiting client retest (or Resolved), not Closed",
            "Closed",
            "New",
            "Moved to CR",
          ],
          correctIndex: 0,
          explanation:
            "Closed means the reporter confirmed it. Closing early produces reopened items and arguments about whether it ever worked.",
        },
        {
          id: "pmp-e03-hypercare-log-q6",
          prompt: "Which is the best exit criterion for hypercare?",
          options: [
            "No open Critical or High issues, targets met for an agreed period, and the support team resolving most issues on its own",
            "Four weeks have passed, whatever the state",
            "The client stops emailing",
            "All Low issues are fixed",
          ],
          correctIndex: 0,
          explanation:
            "Microsoft recommends criteria-based exit with an end date. A date alone can end hypercare with a Critical issue open; waiting for silence never ends it.",
        },
        {
          id: "pmp-e03-hypercare-log-q7",
          prompt: "A developer pushed a hotfix at night without telling anyone. It worked. What do you do?",
          options: [
            "Record the approval after the fact, note it in the log and status report, and make sure the next hotfix follows the approval rule",
            "Nothing: it worked",
            "Roll it back because it was not approved",
            "Hide it from the client",
          ],
          correctIndex: 0,
          explanation:
            "The rule exists for the hotfix that does not work. Rolling back a working fix punishes users; hiding it breaks the log's value as a record.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-hypercare-log-q8",
          prompt: "One client email contains a crash report and a request for a dark mode. How many rows?",
          options: [
            "Two rows, classified separately",
            "One row, classified as a bug",
            "One row, classified as a change request",
            "None until the client sends separate emails",
          ],
          correctIndex: 0,
          explanation:
            "Each item has its own classification, owner and status. Combining them lets the free fix carry the paid request, or the other way round.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "hypercare-log",
        prompt:
          "Log the payment issue below as one hypercare row, and decide what to do with the second request in the same email. Use the contract's severity scale and priority mapping. Times are in EAT.",
        context:
          "**Contract extract:** Hypercare: 4 weeks from go-live on Mon 19 Oct 2026. Severity: Critical = app down or all payments failing; High = a core flow broken for a group of users with no workaround; Medium = a workaround exists; Low = cosmetic. Priority: Critical and High = P1, Medium = P2, Low = P3.\n\n**Email from Amina (client operations manager), Wed 21 Oct 2026, 08:15:**\n\"Since this morning nobody in Mombasa can pay with M-Pesa. Orders fail at checkout. Nairobi is fine. Also, while you're at it, can you add a 'reorder last basket' button? Customers keep asking.\"\n\n**Tech lead's notes:** Acknowledged to Amina at 08:45 with next update at 10:00. Cause: Mombasa merchant configuration lost after Monday's zone settings change. Hotfix approved by tech lead and PM, live at 13:15. Amina retested at 14:00 and confirmed it works.\n\nReorder was not in the signed scope.",
        fields: [
          { id: "date_reported", label: "Date reported", input: "date", required: true },
          { id: "classification", label: "Classification of the payment issue", input: "select", options: ["Bug under warranty", "Change request", "Clarification", "New feature"], required: true },
          { id: "severity", label: "Severity", input: "select", options: ["Critical", "High", "Medium", "Low"], required: true },
          { id: "priority", label: "Priority", input: "select", options: ["P1", "P2", "P3"], required: true },
          { id: "status", label: "Status now", input: "select", options: ["New", "In progress", "Fixed – awaiting client retest", "Closed"], required: true },
          { id: "response_minutes", label: "Response time (minutes)", input: "number", required: true },
          { id: "resolution_hours", label: "Resolution time (hours)", input: "number", required: true },
          { id: "description", label: "Description", input: "textarea", required: true },
          { id: "notes", label: "Resolution notes", input: "textarea", required: true },
          {
            id: "reorder_handling",
            label: "How you handle the reorder request",
            input: "select",
            options: ["Add it to this row and fix it in the hotfix", "Separate row, classified as new work and sent to the CR process", "Ignore it until hypercare ends"],
            required: true,
          },
        ],
        checks: [
          { fieldId: "date_reported", expected: "2026-10-21" },
          { fieldId: "classification", expected: "Bug under warranty" },
          { fieldId: "severity", expected: "High" },
          { fieldId: "priority", expected: "P1" },
          { fieldId: "status", expected: "Closed" },
          { fieldId: "response_minutes", expected: 30 },
          { fieldId: "resolution_hours", expected: 5 },
          { fieldId: "reorder_handling", expected: "Separate row, classified as new work and sent to the CR process" },
        ],
        rubric: [
          { label: "Description is specific", points: 2, description: "Says what fails (M-Pesa payment at checkout), where (Mombasa only), since when, and that Nairobi works." },
          { label: "Resolution notes are complete", points: 2, description: "Gives the cause, the fix, that the hotfix was approved by the tech lead and PM, and the client's confirmation." },
        ],
        sampleAnswer: {
          date_reported: "2026-10-21",
          classification: "Bug under warranty",
          severity: "High",
          priority: "P1",
          status: "Closed",
          response_minutes: "30",
          resolution_hours: "5",
          description:
            "HC-007, reported by Amina (client operations manager) at 08:15 EAT on 21 Oct: customers in Mombasa cannot pay with M-Pesa; orders fail at checkout since the morning. Nairobi is unaffected. No workaround for Mombasa customers.",
          notes:
            "Cause: Mombasa merchant configuration lost after Monday's zone settings change. Fix: configuration restored and a check added. Hotfix approved by tech lead and PM, live 13:15. Client retested and confirmed at 14:00. RCA to be shared with the client.",
          reorder_handling: "Separate row, classified as new work and sent to the CR process",
        },
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-e03-handover-kt",
      moduleId: "pmp-e03",
      trackId: "pm",
      title: "Handover and knowledge-transfer checklist",
      summary:
        "A [[term:handover]] is finished when the client can run the product without calling Oyelabs. That means more than a zip of code. The client needs the repositories, the documentation, the credentials, the hosting and third-party accounts in its own name, and people who understand how it all fits together. The handover and [[term:knowledge-transfer]] (KT) checklist tracks each of those to done.\n\nThe PM owns the checklist and starts it well before the end, ideally during UAT or [[term:hypercare]]. Microsoft calls the move from project to support \"a gradual process\" and suggests the support team practises on real issues during UAT. The tech lead fills the technical rows. The client's technical owner, such as a CTO or in-house lead, receives it, attends the KT sessions and signs the acceptance.\n\nThe template walks the areas in order: [[term:source-code-handover|source code]], documentation, credentials and accounts, environments and hosting, [[term:third-party-licences|third-party services]], KT sessions, open items and [[term:known-issues]], the access removal plan, and acceptance. Each row needs evidence: a repository URL in the client's organisation, a document link, a recorded session.\n\nThe common mistake is treating handover as the last week's job. Then the client's developers meet the code for the first time on the day Oyelabs leaves, and the questions arrive as \"bugs\" for months. The second mistake is forgetting access: Oyelabs keys and users left in production after handover are a security risk for both sides. Not legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "Microsoft Learn: Plan your support operations (transition and hypercare)", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/transition-to-support-operations", kind: "docs", verifiedAt: "2026-10-02T12:04:28Z" },
        { label: "Atlassian: Knowledge Base guide", url: "https://www.atlassian.com/itsm/knowledge-management/what-is-a-knowledge-base", kind: "article", verifiedAt: "2026-10-02T12:04:46Z" },
        { label: "ProjectManager: Project Handover Template", url: "https://www.projectmanager.com/templates/project-handover-template", kind: "article", verifiedAt: "2026-10-02T12:04:46Z" },
        { label: "Smartsheet: Free Project Handover Templates", url: "https://www.smartsheet.com/content/project-handover-templates", kind: "article", verifiedAt: "2026-10-02T12:04:46Z" },
      ],
      video: {
        title: "Project Handover Process [OVER TO YOU!]",
        channel: "Adriana Girdler",
        url: "https://www.youtube.com/watch?v=OLibddcR3Yg",
        videoId: "OLibddcR3Yg",
        verifiedAt: "2026-10-02T12:05:34Z",
      },
      alternateVideos: [
        {
          title: "How to Handle Knowledge Transfer (KT) in IT Company | Tips for New Project Members",
          channel: "My Corporate Lessons",
          url: "https://www.youtube.com/watch?v=e8_k2OWHGKY",
          videoId: "e8_k2OWHGKY",
          verifiedAt: "2026-10-02T12:05:48Z",
        },
      ],
      handbook: {
        stages: ["custom-handover"],
        rules: ["secure-credential-sharing"],
        templates: ["handover-kt-checklist"],
      },
      sections: [
        {
          heading: "When it is used and who owns it",
          body:
            "- **When:** opened during UAT or early hypercare, worked through in the last weeks, and closed with the client's signed acceptance. On a project that moves to an Oyelabs [[term:amc]] or retainer, a lighter internal version still applies, because the support team needs the same knowledge.\n- **Who fills it:** the PM owns the list and the dates. The tech lead owns repositories, documentation, environments and credentials. Developers run KT sessions on their areas.\n- **Who approves:** the client's technical owner (CTO, IT head or in-house lead) signs the acceptance. The Oyelabs delivery head confirms internally that nothing is left on Oyelabs accounts.\n- **Who receives it:** the client's technical owner and sponsor, and the Oyelabs support team if support continues.\n- **What the contract decides:** what is handed over, when [[term:ip-ownership|IP]] passes (often on final payment), and whether [[term:escrow]] applies. Check before you transfer anything. Not legal advice: the signed contract always wins.",
        },
        {
          heading: "Field by field: what good entries look like",
          body:
            "- **Source code and repositories:** every repository named, transferred to the client's organisation (or the client invited as owner), with the final tag or [[term:version]]. Good: \"api, web-admin, mobile transferred to client's GitHub org; final tag v1.2.0\". Mistake: \"code shared\" with no tag, so nobody knows which commit is production.\n- **Documentation:** architecture overview, local setup guide, deployment steps, API reference, admin guide. Each one linked and checked by someone who did not write it. A setup guide is only done when a client developer has followed it.\n- **Credentials and accounts:** every production credential moved to the client's password manager, Oyelabs-held keys rotated. Never as a spreadsheet by email: follow the Oyelabs rule in the handbook card below.\n- **Environments and hosting:** each [[term:environment]] ([[term:staging-environment|staging]], [[term:production-environment|production]]) with its URL, owner account and who pays. Good: \"AWS account owned by client; Oyelabs IAM users removed on 15 Dec\".\n- **Third-party services and licences:** payment, SMS, maps, email, analytics, fonts, paid packages. Each in the client's name and on the client's card.\n- **KT sessions:** topic, presenter, attendees, date and recording link. Typical topics: architecture, deployments and rollback, admin and configuration, common support issues.\n- **Open items and known issues:** the known-issues list from hypercare, each with severity and a recommendation.\n- **Access removal plan:** which Oyelabs users and keys are removed, when, and who confirms. Often timed to the end of support.\n- **Acceptance:** name, role and date of the client's signature, with any exceptions written in.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "A Laravel inventory platform for a wholesaler in the Netherlands moves to the client's own two-person development team.\n\n1. In week 2 of UAT the PM opens the checklist and agrees a target acceptance date with the client's IT lead.\n2. The client's developers join two QA triage sessions during UAT, so they see real issues before KT starts.\n3. The tech lead writes the setup guide, and a client developer follows it on a clean laptop. Two missing steps are found and fixed. Only then is the row ticked.\n4. Three KT sessions run: architecture, deployments and rollback, admin configuration. Each is recorded, and the links go in the checklist.\n5. The PM finds a maps API key on an Oyelabs company card. The client creates its own account, the key is swapped in staging, then production, and the old key is revoked.\n6. Repositories move to the client's GitHub organisation with tag v2.4.0. Credentials move to the client's password manager, and Oyelabs-held keys are rotated.\n7. The IT lead signs the acceptance with one exception: a known performance issue on a large export, with a recommendation attached.\n8. Two weeks later, as planned, Oyelabs IAM users are removed and the removal is confirmed by email.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Handover starts in the last week.** Recover: prioritise credentials, accounts and repositories first (they block the client most), then KT; agree a short follow-up Q&A window in writing.\n- **A third-party service is on Oyelabs' card or account.** Recover: list every service, have the client create its own accounts, swap keys environment by environment, then revoke the old ones.\n- **Credentials sent as a spreadsheet.** Recover: rotate everything in it and move to the password manager.\n- **KT is a single long call nobody recorded.** Recover: split it by topic, record it, and give the client a list of questions to bring.\n- **Documentation nobody tested.** Recover: have a client developer follow the setup guide, and fix what fails.\n- **Oyelabs access left on production for months.** Recover: agree the removal date now, remove, and confirm in writing.\n- **The client will not sign the acceptance.** Recover: ask what is missing, write it as exceptions with owners and dates, and escalate through the [[term:escalation-matrix]] if it stalls.",
        },
        {
          heading: "Your checklist",
          body:
            "- Open the checklist during UAT or early hypercare, not in the last week.\n- Repositories in the client's organisation with the production tag.\n- Documentation tested by someone who did not write it.\n- Credentials in the client's password manager; Oyelabs-held keys rotated.\n- Every hosting and third-party account in the client's name and on its card.\n- KT sessions by topic, recorded and linked.\n- Known issues listed with severity and a recommendation.\n- Access removal date agreed and confirmed.\n- Signed acceptance, with exceptions written in.",
        },
      ],
      sop: [
        {
          title: "Where KT recordings and handover documents are stored",
          prompt:
            "[Oyelabs SOP – admin to fill] Where Oyelabs stores KT recordings and handover documents, how long they are kept, and how the client gets its copies.",
        },
        {
          title: "Removing Oyelabs access after handover",
          prompt:
            "[Oyelabs SOP – admin to fill] Who removes Oyelabs users and keys from client systems after handover, when, and how the removal is confirmed and recorded.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-e03-handover-kt-q1",
          prompt: "When should the handover and KT checklist be opened?",
          options: [
            "During UAT or early hypercare, so the client's team can practise on real issues",
            "On the last day of the project",
            "After the final invoice is paid",
            "Only if the client asks for it",
          ],
          correctIndex: 0,
          explanation:
            "Microsoft describes the move to support as gradual and starting before go-live. Starting on the last day leaves no time to test documentation or fix gaps.",
        },
        {
          id: "pmp-e03-handover-kt-q2",
          prompt: "During handover you find the SMS provider account is on Oyelabs' company card. What is the right sequence?",
          options: [
            "Client creates its own account, keys are swapped in staging then production, and the old Oyelabs key is revoked",
            "Revoke the Oyelabs key first, then ask the client to set up an account",
            "Leave it; the client can pay Oyelabs for SMS each month",
            "Send the client the Oyelabs login",
          ],
          correctIndex: 0,
          explanation:
            "Revoking first breaks production messages. Sharing the Oyelabs login keeps the client dependent and mixes billing and liability.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-handover-kt-q3",
          prompt: "Which rows prove the client can own the product? (Select all that apply.)",
          options: [
            "Repositories transferred to the client's organisation with the production tag",
            "A client developer has followed the setup guide successfully",
            "KT sessions recorded and linked",
            "The Oyelabs team's timesheets",
            "The original sales proposal",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Ownership needs code, working documentation and transferred knowledge. Timesheets and the proposal say nothing about whether the client can run the product.",
        },
        {
          id: "pmp-e03-handover-kt-q4",
          prompt: "The client asks for all production passwords \"in one Excel file by email, please\". What do you do?",
          options: [
            "Share them through the client's password manager or the approved secure channel, and rotate any Oyelabs-held keys",
            "Send the Excel file but password-protect it",
            "Send them in two separate emails",
            "Read them out on a call",
          ],
          correctIndex: 0,
          explanation:
            "Email copies persist on many servers. Splitting or protecting the file reduces the risk only a little; the approved channel plus rotation removes it.",
        },
        {
          id: "pmp-e03-handover-kt-q5",
          prompt: "The contract says IP passes to the client on final payment. The final invoice is unpaid and the client asks for the repositories today. What is the best first step?",
          options: [
            "Check the contract and raise it with the account manager before transferring, while continuing the other handover rows",
            "Transfer the repositories at once to keep the client happy",
            "Delete the client's access to staging",
            "Refuse all handover work until payment arrives",
          ],
          correctIndex: 0,
          explanation:
            "The contract decides when ownership passes, and commercial calls belong to the account manager. Punishing the client by cutting access, or stopping all work, escalates a commercial matter needlessly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-handover-kt-q6",
          prompt: "What makes a documentation row done?",
          options: [
            "The document exists, is linked, and someone who did not write it has used it successfully",
            "The tech lead says it is written",
            "It is longer than ten pages",
            "The client has received the link",
          ],
          correctIndex: 0,
          explanation:
            "A setup guide that fails on a clean machine is not documentation. Receipt of a link proves nothing about whether it works.",
        },
        {
          id: "pmp-e03-handover-kt-q7",
          prompt: "Two months after handover, Oyelabs developers can still log in to the client's production server. Why is that a problem for Oyelabs as well as for the client?",
          options: [
            "Any incident on that server could be traced to accounts Oyelabs still holds, which creates security and liability exposure",
            "It is not a problem if the developers do not log in",
            "It only matters for white-label projects",
            "Hosting providers charge per user",
          ],
          correctIndex: 0,
          explanation:
            "Unused access is still access. Removing it on a planned date, and confirming in writing, protects both sides.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-handover-kt-q8",
          prompt: "The client's IT lead will sign the acceptance except for one slow report. What do you do?",
          options: [
            "Record it as an exception on the acceptance, with severity, an owner and a recommendation",
            "Refuse to accept a partial sign-off",
            "Leave the acceptance unsigned until it is fixed",
            "Remove the report from the known-issues list",
          ],
          correctIndex: 0,
          explanation:
            "Written exceptions let the handover close honestly. Waiting for a perfect product can keep a project open for months.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "handover-kt-checklist",
        prompt:
          "You are handing over a Laravel inventory platform to the client's in-house team. Using the status board and the client's email, complete the handover summary. Count as open every row whose status is not Done.",
        context:
          "| Area | Item | Status |\n|---|---|---|\n| Source code | Repositories still in Oyelabs GitHub org; final tag v2.4.0 created | Not started |\n| Documentation | Architecture overview and API reference | Done |\n| Documentation | Admin guide | Not started |\n| Credentials | Production passwords sent to client IT lead in a spreadsheet by email (March) | Needs action |\n| Hosting | AWS account owned by client | Done |\n| Third-party | Maps API account on Oyelabs company card | Needs action |\n| KT sessions | Architecture (recorded), admin (recorded) done; deployments and rollback not held | In progress |\n| Known issues | 3 minor issues listed | Done |\n\n**Email from Jeroen, client IT lead:**\n\"We'd like to close this out. If everything is done, I can sign the acceptance on Friday 4 December. Support from Oyelabs ends on 18 December, and we'd like your access removed the next working day after that.\"",
        fields: [
          { id: "open_count", label: "How many rows are open?", input: "number", required: true },
          {
            id: "credentials_action",
            label: "Credentials: what you will do",
            input: "select",
            options: [
              "Nothing: the client already has them",
              "Rotate all credentials and move them to the client's password manager",
              "Send the spreadsheet again with a password",
            ],
            required: true,
          },
          {
            id: "maps_action",
            label: "Maps API account: what you will do",
            input: "select",
            options: [
              "Keep it on the Oyelabs card and invoice the client",
              "Client opens own account; swap keys staging then production; revoke ours",
              "Revoke the Oyelabs key now",
            ],
            required: true,
          },
          { id: "acceptance_date", label: "Target acceptance date", input: "date", required: true },
          { id: "access_removal_date", label: "Oyelabs access removal date", input: "date", required: true },
          { id: "kt_plan", label: "Plan for the remaining KT session (topic, attendees, recording)", input: "textarea", required: true },
          { id: "next_steps", label: "Next steps for the other open rows (owner and date)", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "open_count", expected: 5 },
          { fieldId: "credentials_action", expected: "Rotate all credentials and move them to the client's password manager" },
          { fieldId: "maps_action", expected: "Client opens own account; swap keys staging then production; revoke ours" },
          { fieldId: "acceptance_date", expected: "2026-12-04" },
          { fieldId: "access_removal_date", expected: "2026-12-21" },
        ],
        rubric: [
          { label: "KT plan is concrete", points: 2, description: "Deployments and rollback session with a presenter, the client's developers as attendees, a date before 4 Dec, and a recording link to be added to the checklist." },
          { label: "Open rows have owners and dates", points: 3, description: "Repository transfer, admin guide, credentials and maps account each get an owner and a date before 4 Dec, in a sensible order (accounts and keys before acceptance)." },
          { label: "Security is handled properly", points: 2, description: "Treats the emailed spreadsheet as exposed, rotates, uses the password manager, and plans the access removal and its confirmation." },
        ],
        sampleAnswer: {
          open_count: "5",
          credentials_action: "Rotate all credentials and move them to the client's password manager",
          maps_action: "Client opens own account; swap keys staging then production; revoke ours",
          acceptance_date: "2026-12-04",
          access_removal_date: "2026-12-21",
          kt_plan:
            "Deployments and rollback KT, presented by our tech lead, for Jeroen and both client developers, on Tue 1 Dec, 90 minutes. Recorded; link added to the checklist the same day. Client developers run one deployment to staging themselves during the session.",
          next_steps:
            "Repositories: tech lead transfers api, web and admin repos to the client's GitHub org with tag v2.4.0 by 27 Nov. Admin guide: developer writes it by 30 Nov; client admin follows it once. Credentials: tech lead rotates all production credentials and moves them to the client's password manager by 27 Nov. Maps: Jeroen creates the client account by 25 Nov; developer swaps the key in staging 26 Nov and production 27 Nov, then revokes ours.",
        },
      },
    },

    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-e03-closure-report",
      moduleId: "pmp-e03",
      trackId: "pm",
      title: "Project closure report",
      summary:
        "The closure report is the last document of a project and the first one anyone reads when the client comes back. It says what was promised, what was delivered, how the project did against plan, what is still open, and what Oyelabs learned. Without it, the next PM on a phase 2 starts from guesses, and the same mistakes repeat on the next project.\n\nThe PM writes it after handover and the [[term:retrospective]], once the final figures are known. The tech lead checks the quality section; the account manager checks the commercial figures. The client sponsor receives it and signs the [[term:closure]]. Internally it goes to the delivery head and the project archive, and its recommendations feed the account team.\n\nA closure report covers outcomes against objectives, scope delivered and deferred, [[term:change-request]] summary, schedule and budget variance, quality and [[term:known-issues]], [[term:handover]] status, lessons learned, open items, and sign-off. Every number is checked against a source: the [[term:scope-baseline]], the approved CRs, the [[term:invoice|invoices]] and the [[term:hypercare]] log.\n\nThe common mistake is writing it as a sales brochure. \"Delivered successfully\" with no variance hides the two weeks of delay, and a lessons section full of praise teaches nothing. The opposite mistake is just as bad: a blame list. Variance should be explained by cause, with approved changes separated from slippage. Lessons should be specific and actionable, with an owner. Not legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Confluence: Lessons learned template", url: "https://www.atlassian.com/software/confluence/templates/lessons-learned", kind: "docs", verifiedAt: "2026-10-02T12:04:48Z" },
        { label: "Asana: Project Closure (8 steps and checklist)", url: "https://asana.com/resources/project-closure", kind: "article", verifiedAt: "2026-10-02T12:04:31Z" },
        { label: "Asana: Lessons Learned in 5 steps", url: "https://asana.com/resources/lessons-learned", kind: "article", verifiedAt: "2026-10-02T12:04:49Z" },
        { label: "ProjectManager: Lessons Learned in Project Management", url: "https://www.projectmanager.com/blog/lessons-learned-project-management", kind: "article", verifiedAt: "2026-10-02T12:04:50Z" },
      ],
      video: {
        title: "How to Write the Close Out Report | Google Project Management Certificate",
        channel: "Grow with Google",
        url: "https://www.youtube.com/watch?v=WfHpPsOa5Nw",
        videoId: "WfHpPsOa5Nw",
        verifiedAt: "2026-10-02T12:05:48Z",
      },
      alternateVideos: [
        {
          title: "Mastering Project Closure Report: What You NEED in Your Final Doc",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=qXEq6ITyTIk",
          videoId: "qXEq6ITyTIk",
          verifiedAt: "2026-10-02T12:05:48Z",
        },
      ],
      handbook: {
        stages: ["custom-closure"],
        templates: ["closure-report"],
      },
      sections: [
        {
          heading: "When it is used and who owns it",
          body:
            "- **When:** after handover is accepted, the retrospective is held and the final invoice status is known. On a project that moves to an [[term:amc]] or retainer, write it at the end of the build phase anyway, so the support phase starts from a clean baseline.\n- **Who writes it:** the PM. The tech lead reviews the quality and handover sections. The account manager or BD confirms the commercial figures and owns the follow-on recommendations.\n- **Who signs:** the client sponsor and the Oyelabs PM; the delivery head approves the internal version.\n- **Who receives it:** the client sponsor and SPOC, the delivery head, the account manager, and the project archive.\n- **Two audiences:** the client version is factual and forward-looking. An internal annex can hold sensitive lessons, such as estimate accuracy or team issues, that are not for the client.",
        },
        {
          heading: "Field by field: what good entries look like (1 of 2)",
          body:
            "- **Project summary:** what, for whom, how long, which commercial model. Two or three sentences.\n- **Objectives and outcomes:** each objective from the SOW or kickoff, with the result. Good: \"Launch on both stores by June: done 22 June; 4,200 orders in the first month.\" Mistake: listing features instead of outcomes.\n- **Scope delivered vs planned:** counts against the signed baseline. Good: \"58 signed-off stories; 56 delivered; 2 deferred to [[term:phase-2]] by agreement on 3 May (MoM).\" Never let \"deferred\" mean \"quietly dropped\": name the agreement.\n- **Change requests summary:** raised, approved, rejected, delivered, with their effect on time and cost. This is where approved date changes are separated from slippage.\n- **Schedule and budget performance:** baseline, actual and variance, each explained by cause. Good: \"Go-live 3 weeks after baseline: 2 weeks from CR-002 (approved date change), 1 week from late payment-gateway approval (client dependency).\" Budget: baseline plus approved CRs gives the approved budget; compare invoiced to that, not to the original quote.",
        },
        {
          heading: "Field by field: what good entries look like (2 of 2)",
          body:
            "- **Quality summary:** hypercare numbers by severity, [[term:defect-leakage]] if you track it, and the known issues handed over. Good: \"1 High issue in hypercare (resolved in 5 hours), 6 Low; 3 known minor issues listed in the handover.\"\n- **Handover status:** what was handed over, accepted when and by whom, and any exceptions. Point to the handover checklist rather than repeating it.\n- **Lessons learned:** what went well, what did not, and what to change, each with an owner. Good: \"Store accounts started in week 6 delayed submission. Next time: start D-U-N-S and enrolment in week 1. Owner: PM practice lead.\" Weak: \"Communication could be better.\"\n- **Open items and recommendations:** anything still open (an unpaid invoice, a pending store update) with an owner and date, and follow-on recommendations such as phase 2 features or a support plan. Recommendations go to the account manager, not into a promise.\n- **Sign-off:** names, roles and dates.\n\n**Common mistakes field by field:** variance with no cause; budget compared with the original quote, not the approved budget; lessons with no owner; deferred scope with no agreement; recommendations that read like commitments.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "A Laravel and React B2B ordering portal for a distributor in the UAE closes after eight months on a fixed-price contract.\n\n1. The PM pulls the numbers from their sources: the signed scope baseline (58 stories), the CR register (4 raised, 3 approved, 1 rejected), the invoices and the hypercare log.\n2. Schedule: baseline go-live 1 June, actual 22 June. The report splits the 3 weeks: 2 from CR-002, which the client approved with a new date, and 1 from the payment gateway's late approval, a client dependency logged in the RAID log in April.\n3. Budget: the 48,000 USD baseline plus 6,500 USD in approved CRs gives 54,500 USD approved. Invoiced: 54,500 USD. The report says \"within the approved budget\", not \"13.5% over the quote\".\n4. Lessons come from the retrospective: consolidate design feedback through one SPOC; get gateway approval started at kickoff. Each has an owner.\n5. Recommendations: a phase 2 for supplier self-service, passed to the account manager to scope.\n6. The client sponsor reads a draft, corrects one date, and signs. The internal annex records that estimates for integrations were 30% low, for the estimation team.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **The report is all praise.** Recover: add the variance with causes and at least three specific lessons with owners. Clients trust a report that admits a slip and explains it.\n- **The report blames the client.** Recover: state client dependencies as facts with dates and the log entry, without adjectives.\n- **Numbers do not match the invoices.** Recover: reconcile with the account manager before sending. A wrong number in a signed closure report is hard to undo.\n- **Deferred scope is missing.** Recover: list it with the agreement that deferred it. Otherwise the client may later claim it was never delivered.\n- **No one reads the lessons.** Recover: send the lessons to the delivery head and the PM practice, and add the top ones to the next kickoff checklist.\n- **The client will not sign.** Recover: ask what is wrong, correct facts, and list disagreements as open items; escalate through the [[term:escalation-matrix]] if needed.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "- Write it after handover acceptance and the retrospective.\n- Every number traced to a source: baseline, CR register, invoices, hypercare log.\n- Schedule and budget variance explained by cause; approved CRs separated from slippage.\n- Budget compared with the approved budget (baseline plus approved CRs).\n- Deferred scope listed with the agreement that deferred it.\n- Lessons specific, actionable and owned.\n- Recommendations handed to the account manager, not promised.\n- Client version and internal annex kept separate.\n- Signed by the client sponsor and the PM; archived.",
        },
      ],
      sop: [
        {
          title: "Closure report approver and archive",
          prompt:
            "[Oyelabs SOP – admin to fill] Who at Oyelabs approves a closure report before it goes to the client, where signed reports and internal annexes are archived, and how lessons learned reach the PM practice.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-e03-closure-report-q1",
          prompt: "Baseline price 40,000 USD; approved CRs 5,000 USD; invoiced 45,000 USD. How should the report describe budget performance?",
          options: [
            "Within the approved budget of 45,000 USD (baseline plus approved CRs)",
            "12.5% over budget",
            "5,000 USD over budget because of scope creep",
            "Under budget",
          ],
          correctIndex: 0,
          explanation:
            "Approved CRs change the budget by agreement. Comparing with the original quote makes approved change look like overspend.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-closure-report-q2",
          prompt: "Go-live was 3 weeks late: 2 weeks from an approved CR with a new date, 1 week from a late client dependency. Which wording is best?",
          options: [
            "\"Go-live 3 weeks after baseline: 2 weeks from CR-002 (approved date change); 1 week from the payment gateway approval, a client dependency logged on 12 April.\"",
            "\"Delivered successfully.\"",
            "\"3 weeks late due to the client.\"",
            "\"Slight delay due to unforeseen circumstances.\"",
          ],
          correctIndex: 0,
          explanation:
            "It gives the variance, splits it by cause and cites the record, without blame. The others hide the delay, blame without evidence, or say nothing.",
        },
        {
          id: "pmp-e03-closure-report-q3",
          prompt: "Which are good lessons learned? (Select all that apply.)",
          options: [
            "Start store-account setup in week 1; owner: PM practice lead",
            "Route all design feedback through one client SPOC per round; owner: PM",
            "Add integration spikes to estimates for third-party APIs; owner: estimation lead",
            "Communication could be better",
            "The team worked very hard",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Good lessons are specific, actionable and owned. Vague statements and praise cannot change the next project.",
        },
        {
          id: "pmp-e03-closure-report-q4",
          prompt: "Two signed-off stories were not built. In May the client agreed by email to move them to phase 2. How do you report them?",
          options: [
            "As deferred to phase 2 by agreement, citing the email date",
            "Leave them out, since phase 2 will cover them",
            "As delivered, because the client agreed",
            "As failed scope",
          ],
          correctIndex: 0,
          explanation:
            "Naming the agreement protects both sides. Leaving them out invites a later claim that they were never delivered; calling them failed misrepresents an agreed change.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-closure-report-q5",
          prompt: "Your retrospective found that integration estimates were 30% low. Where does that lesson belong?",
          options: [
            "In an internal annex for the estimation team, not necessarily in the client version",
            "Only in the client version, for transparency",
            "Nowhere: estimates are confidential",
            "In the client's invoice notes",
          ],
          correctIndex: 0,
          explanation:
            "On a fixed-price project the estimate accuracy is Oyelabs' internal concern. Burying it teaches nothing; putting it in the client version can invite a pricing discussion that does not help either side.",
        },
        {
          id: "pmp-e03-closure-report-q6",
          prompt: "Before sending the closure report, you notice the invoiced total differs from your figure by 2,000 USD. What do you do?",
          options: [
            "Reconcile with the account manager and fix the source of the difference before sending",
            "Send it and correct it later if the client notices",
            "Round both figures and send",
            "Remove the budget section",
          ],
          correctIndex: 0,
          explanation:
            "A signed report with a wrong number is hard to correct and damages trust. Removing the section hides exactly what the sponsor will check first.",
        },
        {
          id: "pmp-e03-closure-report-q7",
          prompt: "In the recommendations you want to mention a phase 2 dashboard. What is the right framing?",
          options: [
            "A recommendation passed to the account manager to scope and price, not a commitment",
            "\"Oyelabs will build the dashboard in Q1 at no extra cost.\"",
            "Leave it out; closure reports should not mention future work",
            "Add it to the open items as Oyelabs' responsibility",
          ],
          correctIndex: 0,
          explanation:
            "Recommendations are input for a new conversation. Wording them as commitments creates scope that was never estimated or sold.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e03-closure-report-q8",
          prompt: "Which sources should the closure report's numbers come from? (Select all that apply.)",
          options: [
            "The signed scope baseline",
            "The CR register and approvals",
            "The invoices",
            "The hypercare log",
            "Your memory of the project",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Each section has a record behind it. Memory is exactly what fails eight months into a project.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "closure-report",
        prompt:
          "Draft the key sections of the closure report for this project from the facts below. Separate approved changes from slippage, and compare spend with the approved budget.",
        context:
          "**Project:** Laravel + React B2B ordering portal for a UAE distributor. Fixed price. 8 months.\n\n| Fact | Value |\n|---|---|\n| Baseline price | 48,000 USD |\n| CRs raised / approved / rejected | 4 / 3 / 1 |\n| Value of approved CRs | 6,500 USD |\n| Invoiced to date | 54,500 USD (all paid) |\n| Signed-off stories | 58 |\n| Stories delivered | 56 |\n| Stories deferred | 2, moved to phase 2 by client email on 3 May |\n| Baseline go-live | 1 June 2026 |\n| Actual go-live | 22 June 2026 |\n| Cause of delay | CR-002 (approved with a 2-week date change); payment gateway approval 1 week late (client dependency, RAID log I-04, 12 April) |\n| Hypercare | 1 High issue (resolved in 5 hours), 6 Low; 3 minor known issues handed over |\n| Retro notes | Design feedback came from three client people; gateway approval started too late |\n| Client interest | Supplier self-service portal |",
        fields: [
          { id: "approved_budget", label: "Approved budget (USD)", input: "number", required: true },
          { id: "budget_status", label: "Budget performance", input: "select", options: ["Under the approved budget", "Within the approved budget", "Over the approved budget"], required: true },
          { id: "schedule_variance_weeks", label: "Schedule variance (weeks)", input: "number", required: true },
          { id: "slippage_weeks", label: "Weeks of delay not covered by an approved change", input: "number", required: true },
          { id: "stories_delivered", label: "Stories delivered", input: "number", required: true },
          { id: "crs_approved", label: "CRs approved", input: "number", required: true },
          { id: "schedule_text", label: "Schedule and budget performance (as written in the report)", input: "textarea", required: true },
          { id: "lessons", label: "Lessons learned (at least two, each with an owner)", input: "textarea", required: true },
          { id: "recommendations", label: "Open items and recommendations", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "approved_budget", expected: 54500 },
          { fieldId: "budget_status", expected: "Within the approved budget" },
          { fieldId: "schedule_variance_weeks", expected: 3 },
          { fieldId: "slippage_weeks", expected: 1 },
          { fieldId: "stories_delivered", expected: 56 },
          { fieldId: "crs_approved", expected: 3 },
        ],
        rubric: [
          { label: "Variance explained by cause, without blame", points: 3, description: "Splits the 3 weeks into 2 from CR-002 (approved) and 1 from the client dependency, cites the records, and uses neutral language." },
          { label: "Lessons are specific and owned", points: 3, description: "At least two lessons from the retro (single SPOC for design feedback; start gateway approval at kickoff), each actionable and with an owner." },
          { label: "Recommendations framed correctly", points: 2, description: "Lists deferred stories with the 3 May agreement and the supplier self-service idea as a recommendation for the account manager, not a commitment." },
        ],
        sampleAnswer: {
          approved_budget: "54,500",
          budget_status: "Within the approved budget",
          schedule_variance_weeks: "3",
          slippage_weeks: "1",
          stories_delivered: "56",
          crs_approved: "3",
          schedule_text:
            "Go-live was on 22 June 2026, 3 weeks after the 1 June baseline. Two weeks came from CR-002, which the client approved with a new date. One week came from the payment gateway's late approval, a client dependency logged as I-04 on 12 April. Budget: baseline 48,000 USD plus 6,500 USD of approved CRs gives an approved budget of 54,500 USD; 54,500 USD was invoiced and paid, so the project closed within the approved budget.",
          lessons:
            "1. Design feedback came from three client people, causing rework. Next time agree one SPOC who consolidates feedback per round. Owner: PM. 2. Gateway approval started too late. Next time start payment gateway onboarding at kickoff and track it in the RAID log from week 1. Owner: PM practice lead.",
          recommendations:
            "Open items: none commercial; 3 minor known issues handed over with the handover checklist. Deferred: 2 stories moved to phase 2 by client email on 3 May. Recommendation: a phase 2 supplier self-service portal, passed to the account manager to scope and price.",
        },
      },
    },
  ],
} satisfies Module;
