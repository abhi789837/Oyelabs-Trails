import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-b05",
  trackId: "pm",
  name: "White-label lifecycle: Client-owned accounts",
  description:
    "Making sure the client opens and owns every account the product runs on (Apple, Google Play, domain, hosting, payment and messaging), why App Review Guideline 4.2.6 makes this non-negotiable for white-label apps, and how to get organisation enrolment done before it blocks launch.",
  topics: [
    {
      id: "pmp-b05-accounts-ownership",
      moduleId: "pmp-b05",
      trackId: "pm",
      title: "Who owns what: accounts, domains and keys",
      summary:
        "A white-label app runs on accounts: the [[term:apple-developer-account]], the [[term:google-play-console]], the domain, the [[term:hosting-account]], the [[term:payment-gateway-account]] and the [[term:messaging-provider-accounts]]. The principle is simple: [[term:client-owned-accounts]]. The client opens each one in its own legal name and invites Oyelabs with the access it needs.\n\nWhy it matters at an agency. Whoever holds an account controls the asset. A domain registered in the agency's name, an app published from the agency's store account or a payment account in a developer's name turns into a dispute or a slow transfer the day the relationship changes. For white-label apps there is a second reason: Apple's App Review Guideline 4.2.6 says apps created from a commercialised template or app generation service will be rejected unless they are submitted directly by the provider of the app's content, and that such services should not submit apps on behalf of their clients. In practice, each white-label app should be submitted from the client's own developer account.\n\nHow to do it. Send the account checklist with the onboarding template as soon as scope is approved, starting with the slowest items (Apple and Google organisation enrolment, payment gateway verification). Agree the roles Oyelabs needs. Receive keys only through a secure channel. Record every account and owner in the instance record. Follow the Oyelabs rules in the handbook cards below for store accounts and credential sharing.\n\nThe common mistake is offering to \"publish under our account for now\" to save time. It saves days and costs weeks later, and it risks rejection under 4.2.6.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Apple Developer: Become a member (enrollment requirements)", url: "https://developer.apple.com/programs/enroll/", kind: "docs", verifiedAt: "2026-10-02T11:46:14Z" },
        { label: "ICANN: Transfer Policy", url: "https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en", kind: "spec", verifiedAt: "2026-10-02T11:47:51Z" },
        { label: "ICANN: Registrants' benefits and responsibilities", url: "https://www.icann.org/resources/pages/benefits-2013-09-16-en", kind: "spec", verifiedAt: "2026-10-02T11:47:50Z" },
        { label: "Cloudflare Learning: What is a domain name registrar?", url: "https://www.cloudflare.com/learning/dns/glossary/what-is-a-domain-name-registrar/", kind: "article", verifiedAt: "2026-10-02T11:53:36Z" },
      ],
      video: {
        title: "How Domain Ownership is Determined (& Why it Matters)",
        channel: "GoDaddy Help Center",
        url: "https://www.youtube.com/watch?v=VPN3Klr7U78",
        videoId: "VPN3Klr7U78",
        verifiedAt: "2026-10-02T12:00:36Z",
      },
      alternateVideos: [
        {
          title: "The difference between a domain name registrar, DNS, and hosting",
          channel: "48in48 Org",
          url: "https://www.youtube.com/watch?v=P0yCEzulERk",
          videoId: "P0yCEzulERk",
          verifiedAt: "2026-10-02T12:00:37Z",
        },
      ],
      handbook: { stages: ["wl-accounts"], rules: ["client-owned-store-accounts", "secure-credential-sharing"], templates: ["whitelabel-onboarding"] },
      sections: [
        {
          heading: "Guideline 4.2.6 in plain English",
          body:
            "Apple's App Review Guideline 4.2.6 reads: *\"Apps created from a commercialized template or app generation service will be rejected unless they are submitted directly by the provider of the app's content. These services should not submit apps on behalf of their clients and should offer tools that let their clients create customized, innovative apps that provide unique customer experiences.\"* It also allows one other model: a single app that hosts all clients' content in a \"picker\" style.\n\nWhat this means for a white-label PM:\n\n- The client, as the provider of the content, submits from its own Apple account. Oyelabs works inside that account as an invited user.\n- The app must be meaningfully the client's: their brand, their content, their configuration. Near-identical clones also risk Apple's spam guideline (4.3), covered in the submission module.\n- Guideline 5.2 adds that apps must be submitted by the person or legal entity that owns or has licensed the intellectual property.\n\nGoogle Play's spam policy similarly discourages many apps with highly similar functionality, content and experience. Ownership and real differentiation protect both stores.",
        },
        {
          heading: "Domains, hosting and keys",
          body:
            "**Domains.** Under ICANN's rules, the registered name holder (the registrant) is the owner, and the registrant's authority wins in a transfer dispute. Registrars must provide the transfer code within 5 calendar days of the registrant's request. After a change of registrant, a 60-day transfer lock can apply unless the registrant opted out beforehand. So a domain registered in the agency's name is slow and awkward to hand back. Register it in the client's name from day one.\n\n**Hosting, payment and messaging.** Open them in the client's name, with the client's billing. The payment gateway account in particular must be the client's: the money goes there, and verification needs their company documents.\n\n**[[term:api-keys]] and passwords.** Receive them only through the approved secure channel, never in chat or email. Follow the Oyelabs rule in the handbook card below.\n\n**Android app signing.** With Play App Signing, Google holds the app signing key and the developer holds an upload key. A lost upload key can be reset through Play Console. Note who holds the upload key in the instance record.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label fitness-booking app for a gym chain, sold through a reseller in the UAE.**\n\nOn the day the quote is approved, the PM sends the reseller the onboarding checklist for the end client, ordered by lead time:\n\n1. D-U-N-S number (if the company does not have one), then Apple organisation enrolment.\n2. Google Play Console as an organisation account.\n3. Payment gateway merchant account and its verification.\n4. Domain and hosting in the gym chain's name.\n5. SMS provider with a registered sender ID.\n6. Invite Oyelabs with the agreed roles on each.\n\nA week later Apple enrolment is stuck: the person enrolling is a marketing manager without legal authority to bind the company. The PM explains that Apple needs someone who can sign for the company and suggests the finance director enrols. The reseller asks whether Oyelabs could \"just publish under your account for now\". The PM says no, explains Guideline 4.2.6 and the transfer effort in one paragraph the reseller can forward, and shows what continues meanwhile: QA, listing texts and screenshots. Enrolment completes the following week. Submission is not delayed, because nothing else was waiting on it.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Starting Apple organisation enrolment late.** Recover: start it the same day, and move every task that does not need it (QA, listing content) ahead of it in the plan.\n- **Accounts opened in a freelancer's or agency's name.** Recover: plan a transfer now, while the relationship is good. App transfers have conditions on both sides, and domain transfers can be locked for 60 days, so start early.\n- **Keys shared over chat.** Recover: treat them as exposed. Ask the client to rotate them, then share the new ones through the approved channel.\n- **Agreeing to publish under the agency account.** Recover: stop before submission and move to the client's account. If the app is already live, plan an app transfer.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Every account (Apple, Google Play, domain, hosting, payment, messaging) is in the client's legal name.\n2. Slowest items started first: D-U-N-S, Apple and Google organisation enrolment, payment verification.\n3. Oyelabs invited with agreed roles, not given the owner's password.\n4. Keys received only through the approved secure channel.\n5. Every account, owner and Oyelabs role recorded in the instance record.\n6. Nothing is submitted from an Oyelabs account.",
        },
      ],
      sop: [
        {
          title: "Instance access register",
          prompt: "[Oyelabs SOP – admin to fill] Where Oyelabs records each client's accounts, owners and the roles Oyelabs holds, and the approved secure tool for receiving keys and passwords.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b05-accounts-ownership-q1",
          prompt: "Under Apple's Guideline 4.2.6, who should submit a white-label app built from a template?",
          options: [
            "The client, as the provider of the app's content, from its own developer account",
            "The agency, from its own account, on the client's behalf",
            "Any developer with an Apple account",
            "Apple itself",
          ],
          correctIndex: 0,
          explanation: "4.2.6 rejects template apps unless submitted directly by the content provider, and says template services should not submit on behalf of clients.",
        },
        {
          id: "pmp-b05-accounts-ownership-q2",
          prompt: "A reseller says: \"Just publish under your Apple account now and move it later.\" What do you reply?",
          options: [
            "No: it risks rejection under 4.2.6 and a slow transfer later; explain what the end client must do and what can continue meanwhile",
            "Yes, transfers are instant",
            "Yes, but only for the first version",
            "Ignore the request and wait",
          ],
          correctIndex: 0,
          explanation: "Publishing from the agency account risks rejection and creates transfer work. Refuse clearly, explain simply, and keep other work moving.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b05-accounts-ownership-q3",
          prompt: "Which accounts should be in the client's own legal name? (Select all that apply.)",
          options: [
            "Apple Developer account",
            "Google Play Console",
            "Domain registration",
            "Payment gateway merchant account",
            "Oyelabs' internal task board",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Every account the client's product runs on belongs to the client. Oyelabs' own tools stay Oyelabs'.",
        },
        {
          id: "pmp-b05-accounts-ownership-q4",
          prompt: "Under ICANN's rules, who has final authority over a domain transfer?",
          options: ["The registrant (registered name holder)", "Whoever pays the hosting bill", "The developer who set up DNS", "The registrar's support team"],
          correctIndex: 0,
          explanation: "The registrant owns the domain and its authority wins in a dispute. That is why the client must be the registrant.",
        },
        {
          id: "pmp-b05-accounts-ownership-q5",
          prompt: "Apple organisation enrolment stalls because the person enrolling is a marketing manager. What is the likely issue?",
          options: [
            "The enrolling person must have legal authority to bind the organisation",
            "Marketing managers cannot have Apple IDs",
            "The company must be at least five years old",
            "Apple only accepts enrolment from developers",
          ],
          correctIndex: 0,
          explanation: "Apple requires the person enrolling an organisation to have legal binding authority, such as an owner or a director.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b05-accounts-ownership-q6",
          prompt: "Which of these are Apple requirements for organisation enrolment? (Select all that apply.)",
          options: [
            "The organisation is a legal entity (trade names and branches are not accepted)",
            "A work email on the organisation's domain",
            "A public website on that domain",
            "An app already live on Google Play",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Apple needs a legal entity, a domain email and a website. Google Play status is irrelevant.",
        },
        {
          id: "pmp-b05-accounts-ownership-q7",
          prompt: "A client pastes their live payment gateway secret key into the project chat. What do you do?",
          options: [
            "Treat it as exposed: ask the client to rotate it and share the new key through the approved secure channel",
            "Copy it into the code and delete the message",
            "Leave it, the chat is private",
            "Email it to the developers instead",
          ],
          correctIndex: 0,
          explanation: "A secret posted in chat may be stored and seen widely. Rotation plus a secure channel is the safe fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b05-accounts-ownership-q8",
          prompt: "Why is a domain registered in the agency's name a problem later?",
          options: [
            "The client does not legally own it, and transfers take time and can be locked after a registrant change",
            "Domains in an agency's name stop working after a year",
            "Search engines penalise agency-owned domains",
            "It is not a problem",
          ],
          correctIndex: 0,
          explanation: "The registrant owns the domain. Getting it back needs the agency's cooperation, and a 60-day lock can apply after a registrant change.",
        },
        {
          id: "pmp-b05-accounts-ownership-q9",
          prompt: "With Play App Signing, what happens if the developer loses the upload key?",
          options: [
            "It can be reset through Play Console, because Google holds the app signing key",
            "The app can never be updated again",
            "The app is removed from the store",
            "A new app must be published under a new package name",
          ],
          correctIndex: 0,
          explanation: "Google holds the app signing key, so a lost upload key can be reset. Only a lost self-managed signing key is unrecoverable.",
        },
        {
          id: "pmp-b05-accounts-ownership-q10",
          prompt: "Apple enrolment will take another week. What should the plan do meanwhile?",
          options: [
            "Move work that does not need the account forward: QA, listing texts, screenshots and the privacy policy",
            "Stop the whole project until enrolment completes",
            "Publish under the agency account to save the week",
            "Skip QA to save time later",
          ],
          correctIndex: 0,
          explanation: "A blocked dependency should block only what truly needs it. Everything else continues so submission can happen as soon as the account is ready.",
        },
      ],
      practice: {
        kind: "roleplay",
        prompt:
          "You are the PM on a white-label fitness-booking app sold through a reseller. Builds have passed QA, but the end client has no Apple or Google account yet.",
        scenarioId: "missing-store-account",
        personaId: "whitelabel-reseller",
        maxTurns: 6,
        brief:
          "Refuse to publish under the agency's account and explain why in terms the reseller can repeat to her client (ownership, Guideline 4.2.6, transfer pain). Give the exact steps and realistic timelines for organisation accounts, say what is blocked and what continues, and agree who does what by when.",
        rubric: [
          { label: "Clarity", points: 2, description: "Short, plain messages; the main point comes first; no jargon the client would not know." },
          { label: "Correct use of process and terms", points: 3, description: "Names the right process (change request, warranty, UAT triage, client-owned accounts) and uses agency terms correctly, explained where needed." },
          { label: "Empathy", points: 2, description: "Acknowledges the client's situation and feelings; asks about the underlying need before defending a position." },
          { label: "A firm and fair scope position", points: 3, description: "Holds the signed scope and the rate card without conceding work for free, while offering fair options (phase it, trade off, a CR)." },
          { label: "A clear next step", points: 2, description: "Ends with a concrete next step: who does what, by when." },
          { label: "The follow-up email", points: 3, description: "A short email that confirms what was agreed, the decision or options, the owners and dates, in a professional tone." },
        ],
        followUp: true,
      },
    },
    {
      id: "pmp-b05-store-developer-accounts",
      moduleId: "pmp-b05",
      trackId: "pm",
      title: "Apple and Google developer accounts",
      summary:
        "The store accounts are the slowest [[term:client-dependency]] in most white-label launches, and they are entirely in the client's hands. Your job is to start them early, explain them simply and know the facts well enough to unblock them.\n\nApple. A company enrols as an organisation. It needs a D-U-N-S number, which is free from Dun & Bradstreet; D&B can take up to 5 business days and Apple up to 2 more business days to receive it, so typically about a week before enrolment can even start. The person enrolling needs legal authority to bind the company, a work email on the company's domain and a public website on that domain. The organisation's legal name becomes the seller name on the App Store. The fee is US$99 a year, with local prices varying.\n\nGoogle. An organisation account also needs a D-U-N-S number, which Google says can take up to 30 days to obtain, plus an organisation website and a verified email and phone. Personal accounts created after 13 November 2023 must run a closed test with at least 12 testers opted in for 14 consecutive days before production access, which is one more reason clients should open an organisation account.\n\nRoles. In App Store Connect only the Account Holder can sign agreements and renew the membership. A typical setup has the client as Account Holder and Oyelabs invited as Admin or App Manager. In Play Console the account owner alone controls payment settings, and permissions can be set per app.\n\nThe common mistake is assuming an individual account \"will do for now\". It changes the seller name and can add a testing gate before launch.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Apple Developer: D-U-N-S Number", url: "https://developer.apple.com/help/account/membership/D-U-N-S/", kind: "docs", verifiedAt: "2026-10-02T11:46:14Z" },
        { label: "App Store Connect Help: Role permissions", url: "https://developer.apple.com/help/app-store-connect/reference/role-permissions", kind: "docs", verifiedAt: "2026-10-02T11:46:14Z" },
        { label: "Play Console Help: Required information to create a developer account", url: "https://support.google.com/googleplay/android-developer/answer/13628312?hl=en", kind: "docs", verifiedAt: "2026-10-02T11:46:27Z" },
        { label: "Play Console Help: Transfer apps to a different developer account", url: "https://support.google.com/googleplay/android-developer/answer/6230247?hl=en", kind: "docs", verifiedAt: "2026-10-02T11:46:27Z" },
      ],
      video: {
        title: "How to Create an Apple Developer Account for Your Organization: A Detailed Guide",
        channel: "Choicely",
        url: "https://www.youtube.com/watch?v=IcBkwgDe1IY",
        videoId: "IcBkwgDe1IY",
        verifiedAt: "2026-10-02T12:00:38Z",
      },
      alternateVideos: [
        {
          title: "App Store Connect Tutorial - Users and Roles",
          channel: "Rebeloper - Rebel Developer",
          url: "https://www.youtube.com/watch?v=eHslr76Frj8",
          videoId: "eHslr76Frj8",
          verifiedAt: "2026-10-02T12:00:39Z",
        },
        {
          title: "How to transfer apps from one google play developer account to another.",
          channel: "iRekha Tech Solutions",
          url: "https://www.youtube.com/watch?v=i2_KycVCYNs",
          videoId: "i2_KycVCYNs",
          verifiedAt: "2026-10-02T12:00:39Z",
        },
      ],
      handbook: { stages: ["wl-accounts"], rules: ["client-owned-store-accounts"], templates: ["whitelabel-onboarding"] },
      sections: [
        {
          heading: "The order to do things in",
          body:
            "1. **Confirm the exact legal entity name** from the capture sheet. It becomes the seller name on the App Store.\n2. **D-U-N-S number.** Check whether the company already has one. If not, request it from Dun & Bradstreet at once; both stores need it for organisation accounts.\n3. **Apple organisation enrolment**, by someone with legal authority, using a company-domain email.\n4. **Google Play organisation account**, with a verified email and phone and the company website.\n5. **Invite Oyelabs.** Apple: Admin or App Manager. Google: the permissions agreed, for example release management and store presence for this app.\n6. **Record it.** Account owner, Oyelabs role and date in the onboarding sheet.\n\nTypical total: one to three weeks, mostly waiting. Start on the day scope is approved.",
        },
        {
          heading: "When an app already lives in the wrong account",
          body:
            "Sometimes the client's app was published earlier from an agency or freelancer account. Both stores support transfers, with conditions.\n\n**Apple app transfer:** at least one version must have been released; the app must not be in review or a pending state or on pre-order; both parties must have accepted the latest agreements; and in-app purchase product IDs must not clash with the recipient's.\n\n**Google Play app transfer:** you need the registration transaction IDs of both accounts. Users, ratings, reviews, subscriptions and the store listing move across. Test groups, promotions and reports do not, so download the reports first. Google support typically replies within 2 business days.\n\n**Apple Account Holder change:** only the current Account Holder can transfer the role, to an existing team member with legal authority who has two-factor authentication and passes ID verification.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label grocery app for a supermarket group in Oman.**\n\nThe capture sheet shows the legal name and that the group has no store accounts. On the approval day the PM sends the onboarding checklist with the store items first and books a 30-minute account setup call with the group's finance director, who has signing authority.\n\nOn the call they check D&B together: the group has no D-U-N-S number. The finance director requests one that day. The PM sets the plan: D-U-N-S expected within about a week, Apple and Google enrolment right after, with a buffer because Google says obtaining a D-U-N-S can take up to 30 days.\n\nThe number arrives on day six. Apple enrolment completes on day nine, Google verification on day twelve. The client invites Oyelabs as App Manager on Apple and with release and store-presence permissions on Google. The PM records both in the onboarding sheet. Meanwhile QA and listing texts went ahead, so submission happens on day fourteen as planned.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **An individual account opened by an employee.** The seller name is the employee's name, and the company does not control it. Recover: open an organisation account and transfer or republish before launch.\n- **D-U-N-S name or address not matching the legal entity.** Enrolment stalls. Recover: the client corrects the D&B record first.\n- **Asking for the Account Holder's password.** Never needed. Recover: ask to be invited with a role.\n- **Not planning for Google's testing requirement on personal accounts.** Recover: switch to an organisation account, or plan the 14-day closed test with 12 testers.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Legal entity name matches across D&B, Apple and Google.\n2. D-U-N-S checked or requested on day one.\n3. Apple and Google accounts are organisation accounts in the client's name.\n4. The enrolling person has legal authority.\n5. Oyelabs invited with roles, never given the owner's login.\n6. Account owners and roles recorded in the onboarding sheet.\n7. Plan shows store accounts as a dependency with a buffer, and other work continuing in parallel.",
        },
      ],
      sop: [
        {
          title: "Store roles Oyelabs needs",
          prompt: "[Oyelabs SOP – admin to fill] The exact Apple App Store Connect role and Google Play permissions Oyelabs asks for on white-label apps, and the client-facing account setup guide to send.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-b05-store-developer-accounts-q1",
          prompt: "What becomes the seller name on the App Store when a company enrols as an organisation?",
          options: ["The organisation's legal name", "The app's name", "The agency's name", "The name of the person who enrolled"],
          correctIndex: 0,
          explanation: "Apple shows the organisation's legal name as the seller. That is why the legal name must be exact from the start.",
        },
        {
          id: "pmp-b05-store-developer-accounts-q2",
          prompt: "A client has no D-U-N-S number. Realistically, how soon can they start Apple organisation enrolment?",
          options: [
            "Typically after about a week: D&B can take up to 5 business days, then Apple up to 2 business days to receive it",
            "Immediately; Apple does not need it",
            "After 90 days",
            "Only after the app is built",
          ],
          correctIndex: 0,
          explanation: "Apple quotes up to 5 business days for D&B and up to 2 for Apple to receive the number. Start on day one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b05-store-developer-accounts-q3",
          prompt: "Which App Store Connect role is the only one that can sign agreements and renew the membership?",
          options: ["Account Holder", "Admin", "App Manager", "Developer"],
          correctIndex: 0,
          explanation: "Only the Account Holder can sign agreements and renew. That role should stay with the client.",
        },
        {
          id: "pmp-b05-store-developer-accounts-q4",
          prompt: "What is a typical, healthy role setup for a white-label app on Apple? (Select all that apply.)",
          options: [
            "The client is the Account Holder",
            "Oyelabs is invited as Admin or App Manager",
            "Oyelabs holds the Account Holder role to make things faster",
            "The client shares the Account Holder password with Oyelabs",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "The client keeps ownership; Oyelabs works through an invited role. Taking the owner role or password breaks client ownership.",
        },
        {
          id: "pmp-b05-store-developer-accounts-q5",
          prompt: "A client opens a personal Google Play account today instead of an organisation account. What extra gate applies before production access?",
          options: [
            "A closed test with at least 12 testers opted in for 14 consecutive days",
            "A paid review by Google",
            "A D-U-N-S number for the individual",
            "Nothing extra",
          ],
          correctIndex: 0,
          explanation: "Personal accounts created after 13 November 2023 must run that closed test. An organisation account is the better path for a company.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b05-store-developer-accounts-q6",
          prompt: "What does a Google Play organisation account need? (Select all that apply.)",
          options: [
            "A D-U-N-S number",
            "An organisation website",
            "A verified email and phone number",
            "An Apple developer account",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Google asks for D-U-N-S, a website and verified contact details. Apple accounts are unrelated.",
        },
        {
          id: "pmp-b05-store-developer-accounts-q7",
          prompt: "The client's app is live in a former freelancer's Google Play account. What moves with an app transfer?",
          options: [
            "Users, ratings, reviews, subscriptions and the store listing, but not test groups, promotions or reports",
            "Everything, including reports",
            "Only the app's name",
            "Nothing; the app must be republished",
          ],
          correctIndex: 0,
          explanation: "Google transfers the app's users, ratings, reviews, subscriptions and listing. Download reports first, because they stay behind.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-b05-store-developer-accounts-q8",
          prompt: "Which condition must be met for an Apple app transfer?",
          options: [
            "At least one version has been released, and the app is not in review or a pending state",
            "The app has never been released",
            "The app has more than 1,000 downloads",
            "The receiving account is an individual account",
          ],
          correctIndex: 0,
          explanation: "Apple requires a released version and no in-progress review, among other conditions such as accepted agreements on both sides.",
        },
        {
          id: "pmp-b05-store-developer-accounts-q9",
          prompt: "Apple enrolment is rejected because the D-U-N-S record shows an old trading name. What is the fix?",
          options: [
            "The client updates the D&B record to match the legal entity, then re-applies",
            "Enrol under the trading name instead",
            "Enrol as an individual",
            "Use the agency's D-U-N-S number",
          ],
          correctIndex: 0,
          explanation: "Apple matches the legal entity against D&B. Trade names are not accepted, so the record has to be corrected.",
        },
        {
          id: "pmp-b05-store-developer-accounts-q10",
          prompt: "Who can transfer the Apple Account Holder role?",
          options: [
            "Only the current Account Holder, to an existing team member with legal authority who has 2FA and passes ID verification",
            "Any Admin",
            "Oyelabs as App Manager",
            "Apple support on request from anyone",
          ],
          correctIndex: 0,
          explanation: "The role moves only from the current Account Holder to a qualified team member. Plan this before people leave the client company.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "whitelabel-onboarding",
        prompt:
          "Fill the account rows of the white-label onboarding checklist for this client, using the notes below. Pick the right status and owner for each account, and say what is next.",
        context:
          "Client: Al Waha Markets LLC, a supermarket group in Oman. Finance director Salim has signing authority.\n\nApple: no account. D-U-N-S requested by Salim on Monday, not received yet.\nGoogle Play: the IT officer opened a personal account last month in his own name.\nDomain: alwahamarkets.om, registered by the group itself.\nPayment gateway: merchant account approved; live keys not shared yet.\nSMS: sender ID registration submitted to the provider, pending.",
        fields: [
          { id: "appleStatus", label: "Apple Developer account: status", input: "select", options: ["Done", "Pending D-U-N-S", "Not needed", "Blocked: wrong account type"], required: true },
          { id: "appleRole", label: "Apple: role to invite Oyelabs with", input: "select", options: ["Account Holder", "Admin or App Manager", "No access needed"], required: true },
          { id: "googleStatus", label: "Google Play Console: status", input: "select", options: ["Done", "Pending D-U-N-S", "Not needed", "Blocked: wrong account type"], required: true },
          { id: "googleNext", label: "Google Play: next step", input: "textarea", required: true },
          { id: "domainStatus", label: "Domain: status", input: "select", options: ["Done", "Pending", "Blocked: wrong owner"], required: true },
          { id: "paymentNext", label: "Payment gateway: next step", input: "textarea", required: true },
          { id: "owner", label: "Client owner for the account rows", input: "text", required: true },
          { id: "risk", label: "Biggest launch risk and what continues meanwhile", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "appleStatus", expected: "Pending D-U-N-S" },
          { fieldId: "appleRole", expected: "Admin or App Manager" },
          { fieldId: "googleStatus", expected: "Blocked: wrong account type" },
          { fieldId: "domainStatus", expected: "Done" },
        ],
        rubric: [
          { label: "Google Play fixed the right way", points: 3, description: "Says to open an organisation account in the company's name (with the D-U-N-S number), not to keep the employee's personal account, and why." },
          { label: "Keys through a secure channel", points: 2, description: "Asks for the live payment keys through the approved secure channel, never chat or email." },
          { label: "Risk and parallel work", points: 3, description: "Names store accounts (D-U-N-S) as the main risk with a date to chase, and lists work that continues: QA, listing texts, screenshots." },
        ],
        sampleAnswer: {
          appleStatus: "Pending D-U-N-S",
          appleRole: "Admin or App Manager",
          googleStatus: "Blocked: wrong account type",
          googleNext: "Open a Google Play organisation account in the name of Al Waha Markets LLC once the D-U-N-S number arrives, with a verified email and phone and the company website. Do not use the IT officer's personal account: the company would not own it and personal accounts need a 14-day closed test.",
          domainStatus: "Done",
          paymentNext: "Salim to share the live keys through our approved secure channel by Thursday. No keys over email or chat.",
          owner: "Salim (finance director)",
          risk: "Store accounts depend on the D-U-N-S number, which can take a week or more. I will chase on Friday. Meanwhile QA, store texts in Arabic and English, screenshots and the privacy policy page go ahead so we can submit as soon as accounts are ready.",
        },
      },
    },
  ],
} satisfies Module;
