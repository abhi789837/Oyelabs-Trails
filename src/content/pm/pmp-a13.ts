import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a13",
  trackId: "pm",
  name: "Custom lifecycle: Handover & KT",
  description:
    "Giving the client a product they can own and run without you: a handover checklist that covers code, documentation, credentials, hosting and store accounts, knowledge transfer that is recorded and tested, and an ownership transfer that leaves no account in the wrong name.",
  topics: [
    {
      id: "pmp-a13-handover-checklist",
      moduleId: "pmp-a13",
      trackId: "pm",
      title: "The handover and KT checklist",
      summary:
        "[[term:handover]] is the moment the client, or the next team, becomes able to own and run the product without Oyelabs. It has two halves. The first is things: the [[term:source-code-handover|source code]], documentation, environments, accounts and credentials. The second is knowledge: [[term:knowledge-transfer]] (KT), the sessions and notes that explain how the product is built, deployed and operated. Missing either half makes the handover fail later, usually on the day the client's own developer tries to deploy for the first time.\n\nRun it from a checklist, not from memory. The handover and KT checklist template in the handbook lists the parts: repositories, documentation, credentials and accounts, environments and hosting, third-party services and licences, KT sessions, open items and [[term:known-issues]], the plan for removing agency access, and acceptance. Each line has an owner, evidence and a status. The client SPOC confirms each line and the client sponsor signs the whole.\n\nTwo mistakes cause most handover pain. One is handing over code before the payment terms in the contract are met, which the stage card lists as a pitfall: the handover entry criteria include final payment, or what the contract says. The other is KT that was only a call: nothing recorded, nothing written down, and no proof that the receiving team can actually do the work. Record every session and end with the client's team doing a task themselves while you watch.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Microsoft Learn (Dynamics 365 implementation guide): Checklist for transitioning to support", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/transition-to-support-checklist", kind: "docs", verifiedAt: "2026-10-02T12:01:01Z" },
        { label: "GOV.UK Service Manual: Making source code open and reusable", url: "https://www.gov.uk/service-manual/technology/making-source-code-open-and-reusable", kind: "docs", verifiedAt: "2026-10-02T11:51:27Z" },
        { label: "Atlassian: Internal documentation", url: "https://www.atlassian.com/work-management/knowledge-sharing/documentation", kind: "article", verifiedAt: "2026-10-02T11:54:21Z" },
        { label: "ProjectManager: Project handover template", url: "https://www.projectmanager.com/templates/project-handover-template", kind: "article", verifiedAt: "2026-10-02T11:57:13Z" },
      ],
      video: {
        title: "Best Practices for Knowledge Transfer and Software Developer Project Handoff",
        channel: "Praxent",
        url: "https://www.youtube.com/watch?v=bEir1fAcDNw",
        videoId: "bEir1fAcDNw",
        verifiedAt: "2026-10-02T12:17:14Z",
      },
      alternateVideos: [
        {
          title: "How to hand over your project to another software house? A CEO guide",
          channel: "Merixstudio",
          url: "https://www.youtube.com/watch?v=kepsFRRzRGU",
          videoId: "kepsFRRzRGU",
          verifiedAt: "2026-10-02T12:17:16Z",
        },
        {
          title: "Project Handover Process [OVER TO YOU!]",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=OLibddcR3Yg",
          videoId: "OLibddcR3Yg",
          verifiedAt: "2026-10-02T12:17:16Z",
        },
      ],
      handbook: {
        stages: ["custom-handover"],
        rules: ["secure-credential-sharing", "mom-after-every-client-meeting"],
        templates: ["handover-kt-checklist"],
      },
      sections: [
        {
          heading: "Entry and exit criteria",
          body:
            "The stage card below gives the industry-standard criteria. Your contract and the Oyelabs card decide the details.\n\n**Start the handover when:**\n\n- The final payment is received, or the payment terms in the contract for handover are met.\n- [[term:hypercare]] is complete or nearly complete, so the product is stable.\n\n**The handover is done when:**\n\n- Source code and assets are handed over as the contract says.\n- Credentials are transferred and agency access has been reviewed.\n- KT sessions are held and recorded.\n- The handover checklist is signed by the client.\n\nThe stage card gives a typical duration of one to two weeks. Plan it in the project schedule, not as something squeezed into the last afternoon of hypercare.",
        },
        {
          heading: "Who does what (RACI)",
          body:
            "From the handover stage card:\n\n- **Prepare the handover and KT checklist.** R: PM. A: PM. C: tech lead.\n- **Hand over code, documentation and credentials.** R: tech lead. A: PM. C: developers. I: client SPOC.\n- **Run KT sessions.** R: tech lead. A: PM. C: developers. I: client SPOC.\n- **Confirm handover acceptance.** R: client SPOC. A: client sponsor. C: PM. I: BD/account manager.\n\nThe PM owns the checklist and the outcome, but the tech lead does most of the technical work. The client signs, because only the receiving side can say it has received what it needs. BD is informed because the handover is often tied to the last payment and to the support conversation that follows.",
        },
        {
          heading: "The nine parts of the checklist",
          body:
            "The handover and KT checklist template has nine sections. For each, write what is handed over, where it lives, the owner and the evidence.\n\n1. **Source code and repositories.** Every repository, the final release tag, the branch strategy, and how to build it.\n2. **Documentation.** Architecture overview, local set-up guide, deployment guide, API reference, admin guide. Atlassian's guidance on internal documentation is a good model: written for the reader, kept in one findable place.\n3. **Credentials and accounts.** Every secret and account, in the client's name, shared through the approved secure channel. Covered in depth in the next topic.\n4. **Environments and hosting.** Production, staging and any others: who owns the [[term:hosting-account]], how to deploy, backups, monitoring.\n5. **Third-party services and licences.** Payment, SMS, maps, email, analytics, paid libraries and fonts, with the account owner and renewal date of each. See [[term:third-party-licences]].\n6. **KT sessions.** Topics, attendees, recordings and the hands-on task the client team completed.\n7. **Open items and known issues.** The [[term:known-issues]] list from sign-off and hypercare, with workarounds.\n8. **Access removal plan.** Which agency accounts are removed now, which stay (for example under a support plan), and when they are reviewed.\n9. **Acceptance.** Signed by the client, with the date.",
        },
        {
          heading: "Running KT sessions that actually transfer knowledge",
          body:
            "A KT session is not a demo. The goal is that the receiving team can do the work without you. A pattern that works:\n\n1. **Know the audience.** The client's in-house developers need architecture, code layout and deployment. Their operations staff need the admin panel. A new vendor needs both, plus the history of decisions. Split sessions by audience.\n2. **Send material first.** Share the documentation a few days before, so the session is for questions, not for reading slides aloud.\n3. **Record every session.** Store the recordings with the checklist. The stage card lists \"no recorded KT\" as a pitfall.\n4. **Explain why, not only how.** The decisions that look strange in the code (a queue here, a cache there) are what a new team is most likely to undo by mistake.\n5. **Reverse the roles at the end.** The client's developer deploys to staging, or the admin creates a user, while your tech lead watches. This is the proof that KT worked.\n6. **Keep a question log.** Every question asked and its answer goes into the documentation, so the next reader benefits.\n\nSend [[term:mom]] after each session, as the Oyelabs rule in the handbook card below asks: what was covered, what is still open, the next session.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A Laravel and React B2B ordering platform for a wholesale distributor in Australia.* The client has hired two in-house developers who will take over after a support period. The contract ties source code handover to the final milestone payment.\n\n- **Two weeks before.** The PM builds the checklist from the template and agrees the KT plan with the client SPOC: three sessions (architecture and code, deployments and environments, admin and operations) and one hands-on session.\n- **Payment.** BD confirms the final milestone invoice is paid. Only then does the tech lead transfer the repositories to the client's GitHub organisation and tag the final release.\n- **Documentation.** Architecture overview, set-up guide, deployment guide and API reference are shared a week before the first session. The admin guide is reviewed by the client's operations lead.\n- **Sessions.** All three are recorded. The question log grows to 23 entries, all added to the docs.\n- **Hands-on.** One of the client's developers deploys a small fix to staging using only the deployment guide. Two steps are missing from the guide; they are added the same day.\n- **Access.** Oyelabs keeps two named, least-privilege accounts for the support period, listed in the access removal plan with a review date.\n- **Sign-off.** The client SPOC confirms each line; the client's CTO signs the checklist. The PM sends the signed copy to BD and files it with the project.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Code handed over before payment terms are met.** Once the code is out, the leverage is gone. Recover: stop the transfer of anything else and talk to BD now. Follow the contract. Not legal advice: the signed contract always wins.\n- **KT as one long call.** Nobody remembers it a month later. Recover: record the remaining sessions, write up the first one from notes, and add a hands-on task.\n- **Documentation written after the developers moved on.** The person who knows the deployment is already on another project. Recover: book them for a fixed number of hours now; write the guide while they walk you through it.\n- **Third-party services forgotten.** The map API key renews on an agency card, and expires three months later. Recover: list every service with its owner and renewal date.\n- **No signature.** The client later says they never received the admin guide. Recover: send the checklist for signature, line by line, and keep the signed copy.\n- **Access never removed.** Old agency accounts stay active for years. Recover: write the access removal plan and put the review date in the support calendar.",
        },
        {
          heading: "Your checklist",
          body:
            "- Entry criteria met: final payment or contract terms, and hypercare complete or nearly complete.\n- Handover and KT checklist built from the template, with an owner and evidence per line.\n- Repositories, final tag and build instructions ready to transfer.\n- Architecture, set-up, deployment, API and admin documentation shared before KT.\n- Every credential and account in the client's name, shared through the approved channel.\n- Third-party services and licences listed with owners and renewal dates.\n- KT sessions split by audience, recorded, with MoM and a question log.\n- A hands-on task completed by the client's team.\n- Known issues and open items handed over with workarounds.\n- Access removal plan agreed; checklist signed by the client.",
        },
      ],
      sop: [
        {
          title: "Our handover and KT routine",
          prompt:
            "[Oyelabs SOP – admin to fill] When Oyelabs starts the handover relative to the final payment, the standard KT sessions per project type, where recordings and signed checklists are stored, and who on the client side must sign.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a13-handover-checklist-q1",
          prompt: "What are the two halves of a good handover?",
          options: [
            "Code and invoices",
            "Things (code, documentation, accounts, credentials) and knowledge (KT sessions and notes)",
            "Design files and test cases",
            "The warranty and the support plan",
          ],
          correctIndex: 1,
          explanation: "The client needs both the assets and the understanding to use them. Handing over code without KT, or KT without access, both fail later.",
        },
        {
          id: "pmp-a13-handover-checklist-q2",
          prompt: "According to the handover stage card, which are entry criteria for the handover? (Select all that apply.)",
          options: [
            "Final payment received, or as per the contract",
            "Hypercare complete or near completion",
            "The case study published",
            "The client's in-house team fully hired",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Payment terms and a stable product come first. Case studies belong to closure, and the client's hiring is their own dependency.",
        },
        {
          id: "pmp-a13-handover-checklist-q3",
          prompt:
            "The contract ties source code handover to the final milestone payment. The payment is two weeks late, and the client asks for the repositories \"so our new developer can start\". What do you do?",
          options: [
            "Transfer the repositories: it builds goodwill",
            "Refuse and stop replying",
            "Tell BD at once, explain to the client kindly that the contract links the transfer to the final payment, and keep preparing everything else so the transfer is quick once paid",
            "Send a zip file instead of transferring the repositories",
          ],
          correctIndex: 2,
          explanation: "Handing over code before payment terms are met is a listed pitfall. BD handles the commercial side; you keep the relationship warm and the handover ready. Not legal advice: the signed contract always wins.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a13-handover-checklist-q4",
          prompt: "Who is accountable for confirming handover acceptance, according to the stage card's RACI?",
          options: ["The PM", "The tech lead", "The client sponsor", "BD/account manager"],
          correctIndex: 2,
          explanation: "The client SPOC confirms the lines and the client sponsor is accountable. Only the receiving side can say it has received what it needs.",
        },
        {
          id: "pmp-a13-handover-checklist-q5",
          prompt: "What is the best proof that knowledge transfer worked?",
          options: [
            "The client said thank you at the end of the call",
            "The client's team completes a real task (for example a staging deployment) on their own, while your tech lead watches",
            "The slides were long",
            "The tech lead feels confident",
          ],
          correctIndex: 1,
          explanation: "Reversing the roles shows what the receiving team can actually do, and usually finds gaps in the documentation while you can still fix them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a13-handover-checklist-q6",
          prompt: "Which belong on the handover and KT checklist? (Select all that apply.)",
          options: [
            "Third-party services and licences, with owners and renewal dates",
            "Open items and known issues with workarounds",
            "An access removal plan for agency accounts",
            "The developers' salaries",
            "KT sessions with topics, attendees and recordings",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation: "These are all sections of the handbook template. Internal salary data has no place in a client document.",
        },
        {
          id: "pmp-a13-handover-checklist-q7",
          prompt: "Why send the documentation before the KT sessions rather than present it during them?",
          options: [
            "Because sessions must be short by law",
            "So the session is spent on questions and decisions, not on reading documents aloud",
            "So the client cannot ask questions",
            "It makes no difference",
          ],
          correctIndex: 1,
          explanation: "Pre-reading turns KT into a working session. The questions it raises go into the question log and improve the docs.",
        },
        {
          id: "pmp-a13-handover-checklist-q8",
          prompt:
            "Three months after handover, the client's maps stop working. The maps API key was on a billing account paid with an Oyelabs company card, and the card expired. Which checklist line was missing?",
          options: [
            "Known issues",
            "Third-party services and licences, with each account's owner and renewal date (and moving it to the client's billing)",
            "KT recordings",
            "The final release tag",
          ],
          correctIndex: 1,
          explanation: "Third-party services are easy to forget because they work silently. Each needs an owner, a renewal date and the client's own billing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a13-handover-checklist-q9",
          prompt: "Why should KT explain why things were built a certain way, not only how?",
          options: [
            "To make sessions longer",
            "Because decisions that look strange in the code are what a new team is most likely to undo by mistake",
            "Because the client asked for history",
            "It should not: only how matters",
          ],
          correctIndex: 1,
          explanation: "A queue or a cache that looks unnecessary often exists for a reason. Without the reason, the next team removes it and rediscovers the problem in production.",
        },
        {
          id: "pmp-a13-handover-checklist-q10",
          prompt: "The client's CTO says, \"No need to sign anything, we trust you.\" What do you do?",
          options: [
            "Skip the signature",
            "Thank them and still ask for the checklist to be signed, explaining it protects both sides and gives their team a clear record",
            "Sign it yourself on their behalf",
            "Delay the handover until they agree to a meeting",
          ],
          correctIndex: 1,
          explanation: "A signed checklist settles later questions such as \"we never got the admin guide\". Frame it as useful to them, not as distrust.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        prompt:
          "Two days before the planned handover sign-off, review the status notes and fill in the key rows of the handover and KT checklist.",
        context:
          "**Project:** Laravel and React B2B ordering platform for a wholesale distributor in Australia. An AMC is signed and starts next month.\n\n**Status notes:**\n- Final milestone invoice: paid.\n- Repositories: transferred to the client's GitHub organisation; final tag v2.4.0.\n- Docs: architecture, set-up, deployment guide and API reference shared. Admin guide not written yet.\n- Hosting: AWS account in the client's name. Two Oyelabs IAM users still active.\n- Payments: the live Stripe account was created with an Oyelabs developer's personal email.\n- KT: architecture and deployment sessions held and recorded. Admin session not held yet.\n- Known issues: three minor UI issues listed, with workarounds.",
        templateId: "handover-kt-checklist",
        fields: [
          { id: "ready", label: "Can the checklist be signed in two days as things stand?", input: "select", options: ["Yes", "No"], required: true },
          {
            id: "stripe",
            label: "What should happen with the Stripe account?",
            input: "select",
            options: [
              "Leave it: payments work",
              "Move it to the client's company account, then rotate the keys",
              "Email the developer's login to the client",
            ],
            required: true,
          },
          {
            id: "access",
            label: "Access removal plan for the two Oyelabs IAM users",
            input: "select",
            options: [
              "Remove all Oyelabs access today",
              "Keep named least-privilege access for the AMC; review it when support ends",
              "Keep everything as it is",
            ],
            required: true,
          },
          { id: "blocking", label: "Blocking items, each with an owner and a date", input: "textarea", required: true },
          { id: "note", label: "Short note to the client SPOC about the new sign-off date", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "ready", expected: "No" },
          { fieldId: "stripe", expected: "Move it to the client's company account, then rotate the keys" },
          { fieldId: "access", expected: "Keep named least-privilege access for the AMC; review it when support ends" },
        ],
        rubric: [
          { label: "Finds every blocking item", points: 3, description: "Names the missing admin guide, the Stripe account in a personal name, and the admin KT session not yet held. Does not treat the listed minor known issues as blocking." },
          { label: "Owners, dates and a clear note", points: 2, description: "Each blocker has an owner and a date; the client note is short, honest about why the date moves, and proposes a new sign-off date." },
        ],
        sampleAnswer: {
          ready: "No",
          stripe: "Move it to the client's company account, then rotate the keys",
          access: "Keep named least-privilege access for the AMC; review it when support ends",
          blocking:
            "1. Admin guide: tech lead to write, client operations lead to review, by Thursday.\n2. Stripe account under a developer's personal email: move ownership to the client's company account with the client's finance contact, rotate the API keys and update production, by Wednesday. Tech lead owns it.\n3. Admin KT session: tech lead to run and record it with the client's operations team on Friday, ending with the admin creating a user themselves.",
          note:
            "Hi Maria, the handover is nearly complete: code, hosting, docs and two recorded KT sessions are done. Three items are left: the admin guide, moving the Stripe account into your company's name, and the admin session. I suggest we sign the checklist next Monday instead of Wednesday, so you receive everything complete. Is Monday 10:00 your time OK?",
        },
      },
    },
    {
      id: "pmp-a13-ownership-credentials",
      moduleId: "pmp-a13",
      trackId: "pm",
      title: "Transferring ownership, accounts and credentials",
      summary:
        "A client can hold every line of source code and still not own their product. If the domain is registered by the agency, the payment account was opened with a developer's email, or the app sits in the agency's store account, the client depends on Oyelabs for things that should be theirs. Ownership has three layers: the legal right to the work ([[term:ip-ownership]]), control of the accounts the product runs on ([[term:client-owned-accounts]]), and the secrets that unlock them ([[term:api-keys]], passwords, signing keys).\n\nThe legal layer is set by the contract, not by the PM. For example, the US Copyright Office explains that \"work made for hire\" covers employees, or commissioned works in nine listed categories with a written agreement; software built by an outside contractor usually falls outside those, so ownership passes by written assignment. Rules differ by country, so always check the IP clause. Not legal advice: the signed contract always wins.\n\nThe practical layers are the PM's job. Keep an account register from week one: every [[term:hosting-account]], [[term:domain-ownership|domain]], [[term:payment-gateway-account|payment account]], [[term:messaging-provider-accounts|messaging account]], [[term:apple-developer-account]] and [[term:google-play-console]] account, with the legal owner. At handover, move anything in the wrong name using each platform's own transfer process, share secrets only through the approved secure channel, and rotate them afterwards, as the OWASP secrets management guidance recommends. The common mistake is emailing a spreadsheet of passwords and calling it a handover.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "OWASP Cheat Sheet Series: Secrets management", url: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", kind: "docs", verifiedAt: "2026-10-02T11:54:58Z" },
        { label: "GitHub Docs: Transferring a repository", url: "https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository", kind: "docs", verifiedAt: "2026-10-02T11:54:56Z" },
        { label: "App Store Connect Help: Overview of app transfer", url: "https://developer.apple.com/help/app-store-connect/transfer-an-app/overview-of-app-transfer", kind: "docs", verifiedAt: "2026-10-02T11:55:07Z" },
        { label: "Play Console Help: Transfer apps to a different developer account", url: "https://support.google.com/googleplay/android-developer/answer/6230247", kind: "docs", verifiedAt: "2026-10-02T11:55:17Z" },
      ],
      video: {
        title: "Works Made for Hire",
        channel: "U.S. Copyright Office",
        url: "https://www.youtube.com/watch?v=G3hDdlMsFh8",
        videoId: "G3hDdlMsFh8",
        verifiedAt: "2026-10-02T12:17:16Z",
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
          title: "Source Code Ownership",
          channel: "Andrew Wilcox",
          url: "https://www.youtube.com/watch?v=-UT-6R5K63o",
          videoId: "-UT-6R5K63o",
          verifiedAt: "2026-10-02T12:17:17Z",
        },
      ],
      handbook: {
        stages: ["custom-handover"],
        rules: ["secure-credential-sharing", "client-owned-store-accounts"],
        templates: ["handover-kt-checklist"],
      },
      sections: [
        {
          heading: "Three layers of ownership",
          body:
            "1. **Legal ownership of the work.** Who owns the copyright in the code and designs, and when. The [[term:msa]] or [[term:sow]] usually says, often linking the transfer to payment. Some contracts grant a [[term:licence]] instead of a full assignment, or keep the agency's reusable components separate. Some also use [[term:escrow]]. The PM reads the clause with BD and never promises more than it says.\n2. **Control of accounts.** Who is the legal account holder of the hosting, domain, DNS, payment gateway, SMS and email providers, maps, analytics, and the store accounts. Control is what lets the client keep running the product if the agency disappears.\n3. **Secrets.** The passwords, API keys, certificates and signing keys that unlock those accounts and the app itself.\n\nA handover is complete only when all three line up: the client owns the work, holds the accounts, and is the only party that knows the current secrets (apart from any access deliberately kept for support).\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Moving accounts: what the platforms actually say",
          body:
            "Use each platform's own transfer process, and read its help page before you promise a date.\n\n- **GitHub repositories.** GitHub's docs describe transferring a repository to another user or organisation. Issues, pull requests and the wiki move with it, and links to the old location redirect. Transferring to the client's organisation is cleaner than sending a zip file, because the history stays intact.\n- **Apple App Store.** Only the Account Holder can start an app transfer, and the recipient must accept it. Before the transfer, TestFlight builds and testers and Xcode Cloud data must be removed. Reviews, ratings and the bundle ID move with the app. Afterwards the recipient needs a new Apple Pay merchant ID, keychain sharing only works until the next update, and Wallet passes become inactive.\n- **Google Play.** A transfer request needs the registration transaction IDs of both developer accounts, and Google says support replies within 2 business days. Users, ratings, reviews and subscriptions move. Test groups and Firebase or AdMob links do not.\n\nThis is why the Oyelabs rule in the handbook card below asks for client-owned store accounts from the start: the cleanest transfer is the one you never need.",
        },
        {
          heading: "Credentials: inventory, share safely, rotate",
          body:
            "The OWASP secrets management guidance gives the principles: know where every secret is, limit who can see it, share it through a secure system, and rotate it. In a handover that means:\n\n1. **Inventory.** List every secret: server and database passwords, cloud keys, payment gateway keys, SMS and email provider keys, maps keys, push notification keys and certificates, the domain registrar and DNS logins, SSL certificates, and the mobile signing material (the Android upload keystore and its passwords, Apple certificates). The Android keystore is a classic forgotten item: without it, the client's next team cannot ship an update in the usual way.\n2. **Share through the approved channel.** Never email or chat. Follow the Oyelabs rule in the handbook card below for the approved tool.\n3. **Rotate.** After the client takes over, the secrets that agency staff have seen are rotated, and production is updated with the new values. Rotation ends any doubt about who still knows what.\n4. **Record.** The checklist says which secrets were handed over, when, through which channel, and when they were rotated. Never write the secrets themselves into the checklist.",
        },
        {
          heading: "Agency access after handover",
          body:
            "There are two honest end states:\n\n- **Full exit.** Every agency user is removed from every account, and the client confirms it. Common when the client's own team or a new vendor takes over completely.\n- **Support access.** Under an [[term:amc]] or [[term:retainer]], Oyelabs keeps a small number of named, least-privilege accounts. Never shared logins, never the account holder role. The access removal plan lists them and the date they are reviewed or removed.\n\nWhat is not acceptable is the third state that happens by accident: a former developer's personal account still has admin rights on the client's hosting two years later. Put the review date in the support calendar and check it.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A React Native food-delivery app with a Laravel backend for a restaurant group in Saudi Arabia.* The client is moving maintenance to their own new team.\n\n- **Register.** The PM's account register, kept since week one, shows 14 accounts. Twelve are in the client's name. Two are not: the SMS provider (opened by a developer during Sprint 0 for testing, then used in production) and the domain's DNS, hosted on an Oyelabs account.\n- **Legal check.** BD confirms the IP clause: ownership transfers on final payment, which has been received.\n- **Moves.** The SMS provider is moved to the client's company account with the client's finance contact present. DNS is moved to the client's own provider, with the TTL lowered days before.\n- **Stores.** Both apps were published from the client's own accounts from day one, so no app transfer is needed. Oyelabs users are removed from both consoles.\n- **Secrets.** Shared through the approved password manager, including the Android upload keystore. The client's team rotates the database password and all API keys, and confirms production still works.\n- **Proof.** The client's tech lead logs into each account, confirms they are the owner, and signs the credentials line of the checklist.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **A spreadsheet of passwords by email.** Every copy of that email is now a risk. Recover: treat all of them as exposed, rotate them, and reshare through the approved channel.\n- **Accounts opened in a developer's name.** Common for SMS, maps or test payment accounts that quietly became production. Recover: move them using the provider's process, with the client present, and update the register.\n- **The app published from the agency's store account.** Recover: plan the app transfer with the platform's rules (TestFlight clean-up on Apple, transaction IDs on Google) and warn the client about what does not move.\n- **No rotation after handover.** People who have left still know production passwords. Recover: rotate now, and record the date.\n- **Promising ownership the contract does not give.** \"Of course you own everything\" when the contract licenses a reusable module. Recover: correct it in writing with BD. Not legal advice: the signed contract always wins.\n- **Signing keys lost.** The Android keystore lived on one laptop. Recover: check Play App Signing options with the tech lead, and add signing keys to every future register.",
        },
        {
          heading: "Your checklist",
          body:
            "- IP clause read with BD; ownership conditions (such as payment) met.\n- Account register complete: every account with its legal owner.\n- Accounts in the wrong name moved using each platform's own process.\n- Repositories transferred to the client's organisation with history.\n- Store apps in the client's own accounts; transfer planned if not.\n- Every secret inventoried, including signing keys and certificates.\n- Secrets shared only through the approved secure channel; never written into documents.\n- Secrets rotated after takeover, with the date recorded.\n- Agency access removed, or kept as named least-privilege accounts with a review date.\n- Client confirms ownership of each account and signs the checklist line.",
        },
      ],
      sop: [
        {
          title: "Our account register and credential handover",
          prompt:
            "[Oyelabs SOP – admin to fill] Where Oyelabs keeps the account register for each project, the approved tool for sharing credentials, who is allowed to create accounts on a client's behalf, and how signing keys are stored and handed over.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a13-ownership-credentials-q1",
          prompt: "What are the three layers of ownership a handover must line up?",
          options: [
            "Design, code and tests",
            "Legal ownership of the work, control of the accounts, and the secrets that unlock them",
            "Hosting, domain and email",
            "The SOW, the MSA and the NDA",
          ],
          correctIndex: 1,
          explanation: "Owning the code is not enough if the accounts are in someone else's name or the agency still knows every password.",
        },
        {
          id: "pmp-a13-ownership-credentials-q2",
          prompt:
            "Under the US Copyright Office's explanation of \"work made for hire\", why does software built by an outside agency usually need a written assignment for the client to own it?",
          options: [
            "Because software can never be owned",
            "Because work made for hire covers employees, or commissioned works in nine listed categories with a written agreement, and contractor-built software usually falls outside those",
            "Because agencies always keep the copyright",
            "Because app stores own the code",
          ],
          correctIndex: 1,
          explanation: "That is why the IP clause matters. Rules differ by country, so read the contract with BD. Not legal advice: the signed contract always wins.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a13-ownership-credentials-q3",
          prompt: "Which are good practice when handing over credentials? (Select all that apply.)",
          options: [
            "Share them only through the approved secure channel",
            "Rotate them after the client takes over",
            "Email a spreadsheet so the client has a copy",
            "Record which secrets were handed over and when they were rotated, without writing the secrets down",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "These follow the OWASP secrets management principles and the handbook rule. Email copies spread secrets you can no longer control.",
        },
        {
          id: "pmp-a13-ownership-credentials-q4",
          prompt: "The app was published from Oyelabs' Apple account. Who can start the app transfer?",
          options: [
            "Any developer on the team",
            "Only the Account Holder of the sending account, and the recipient must accept",
            "Apple, automatically, when asked by email",
            "The client, from their own account",
          ],
          correctIndex: 1,
          explanation: "Apple's help page says only the Account Holder can initiate an app transfer, and the receiving account must accept it.",
        },
        {
          id: "pmp-a13-ownership-credentials-q5",
          prompt: "Which of these do NOT move with an app in a Google Play transfer, according to Google's help page? (Select all that apply.)",
          options: ["Test groups", "Firebase and AdMob links", "Users, ratings and reviews", "Subscriptions"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Users, ratings, reviews and subscriptions move. Test groups and Firebase or AdMob links do not, so the receiving team has to set them up again.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a13-ownership-credentials-q6",
          prompt:
            "During handover you find the production SMS account was opened by a developer in Sprint 0 with his personal email. It works fine. What do you do?",
          options: [
            "Leave it: it works",
            "Ask the developer to forward his password to the client",
            "Move it to the client's company account through the provider's process, with the client present, update the register and rotate the keys",
            "Close the account and open a new one without telling the client",
          ],
          correctIndex: 2,
          explanation: "An account in a person's name is a single point of failure and an ownership gap. Move it properly, in the open, and record it.",
        },
        {
          id: "pmp-a13-ownership-credentials-q7",
          prompt:
            "The client's new team cannot release an Android update. Nobody can find the upload keystore; it was on a developer's old laptop. What should the handover have included?",
          options: [
            "Nothing: keystores are not the client's concern",
            "The signing material (the upload keystore and its passwords) in the secrets inventory, shared through the approved channel",
            "The app's screenshots",
            "A new package name",
          ],
          correctIndex: 1,
          explanation: "Signing keys are a classic forgotten item. Put them in every secrets inventory and handover checklist.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a13-ownership-credentials-q8",
          prompt: "Oyelabs will support the app under an AMC after handover. What is the right access set-up?",
          options: [
            "Keep the account holder role on every account",
            "Use one shared admin login for the whole support team",
            "Named, least-privilege accounts for the support team, listed in the access removal plan with a review date",
            "No access at all, even for support",
          ],
          correctIndex: 2,
          explanation: "Support needs some access, but the client must stay the owner. Named accounts make it clear who did what, and the review date stops access from lingering.",
        },
        {
          id: "pmp-a13-ownership-credentials-q9",
          prompt: "Why rotate secrets after the client takes over, even if nobody did anything wrong?",
          options: [
            "Because the platforms force it",
            "Because rotation ends any doubt about who still knows the current values, including people who have left",
            "To test the client's patience",
            "It is not needed if the handover was friendly",
          ],
          correctIndex: 1,
          explanation: "Many people saw those secrets during the build. Rotating them makes the client the only holder, which is the point of a handover.",
        },
        {
          id: "pmp-a13-ownership-credentials-q10",
          prompt:
            "The client asks, \"We own everything, including your booking engine module, right?\" The contract licenses that reusable module rather than assigning it. What do you say?",
          options: [
            "Yes, of course",
            "No, and end the call",
            "Explain that the contract gives them a licence to use that module, not ownership, and involve BD to answer any follow-up questions",
            "Promise to check later and never follow up",
          ],
          correctIndex: 2,
          explanation: "Never promise more than the IP clause gives. Be clear and calm, and let BD handle the commercial and legal side. Not legal advice: the signed contract always wins.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A junior PM drafted this credentials and ownership plan for the handover of a React Native and Laravel food-delivery app to the client's new in-house team. Mark every line that is unsafe or leaves ownership in the wrong place.",
        segments: [
          { id: "o1", text: "Repositories will be transferred to the client's GitHub organisation, keeping the full history.", issue: null },
          { id: "o2", text: "All production passwords will be sent to the client's CTO in one Excel file by email, for convenience.", issue: "Email spreads secrets you can no longer control. Use the approved secure channel." },
          { id: "o3", text: "The account register lists every account and its legal owner.", issue: null },
          { id: "o4", text: "The SMS provider account stays under our developer's personal email, since it works.", issue: "A production account in a person's name is an ownership gap. Move it to the client's company account." },
          { id: "o5", text: "Both apps are already in the client's own Apple and Google accounts; Oyelabs users will be removed from both consoles.", issue: null },
          { id: "o6", text: "The domain's DNS will stay on Oyelabs' account so we can help if anything breaks.", issue: "The client must control their own DNS. Move it, with the TTL lowered first." },
          { id: "o7", text: "Secrets will not be rotated, because nothing went wrong during the project.", issue: "Rotation is what makes the client the only holder of current secrets, including after people leave." },
          { id: "o8", text: "The Android upload keystore and its passwords are included in the secrets inventory.", issue: null },
          { id: "o9", text: "For the AMC, the whole support team will share one admin login on the client's hosting.", issue: "Shared logins hide who did what. Use named, least-privilege accounts." },
          { id: "o10", text: "BD has confirmed the IP clause conditions, including final payment, are met.", issue: null },
          { id: "o11", text: "The client's tech lead will log into each account and confirm ownership before signing.", issue: null },
          { id: "o12", text: "The checklist will record which secrets were handed over and when they were rotated, not the secrets themselves.", issue: null },
          { id: "o13", text: "We will tell the client they own every module, including our reusable booking engine, to keep them happy.", issue: "The contract licenses the reusable module. Never promise more ownership than the IP clause gives." },
          { id: "o14", text: "Agency access kept for support will be reviewed on a date in the support calendar.", issue: null },
        ],
        askExplanation: true,
      },
    },
  ],
} satisfies Module;
