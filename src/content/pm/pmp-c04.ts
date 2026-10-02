import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-c04",
  trackId: "pm",
  name: "Terminology: Quality & support terms",
  description:
    "The quality and support words that decide what gets fixed first and how fast: severity vs priority, QA vs UAT vs smoke vs regression testing, response time vs resolution time vs TAT, and RCA vs known errors vs known issues. Side-by-side comparisons, worked agency examples and the sentences that keep support conversations calm.",
  topics: [
    {
      id: "pmp-c04-severity-priority",
      moduleId: "pmp-c04",
      trackId: "pm",
      title: "Severity vs priority",
      summary:
        "[[term:severity|Severity]] is how much damage a defect causes: from total outage or data loss down to a cosmetic glitch. [[term:priority|Priority]] is how soon it should be fixed compared with other work. Severity describes impact and is usually set by QA or support from evidence. Priority is a scheduling decision, usually agreed by the PM and the client. Most of the time they move together, but not always: a typo on the splash screen is low severity, yet high priority if store screenshots are taken tomorrow.\n\nWhy it matters at an agency: in support terms, these levels usually drive the [[term:response-time]] and [[term:resolution-time]] targets in the [[term:sla|SLA]], and often whether a [[term:hotfix]] is justified. If every client ticket is marked \"urgent\", the real outage waits in the same queue as a colour change. Over-rated severity is common, and it should be challenged politely, with evidence.\n\nHow to do it: rate severity from the facts (how many users, which flow, is there a workaround, is money or data affected). Then agree priority with the client from business need and deadlines. Use the scale the contract defines, often [[term:p1-p4]]. When raising one item's priority delays others, say so.\n\nThe common mistake: letting the loudest stakeholder set severity. Seniority of the sender changes nothing about impact. Oyelabs' own levels and who sets them are in the handbook term cards.\n\nNot legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Learn: Define, capture, triage and manage bugs (Azure Boards)", url: "https://learn.microsoft.com/en-us/azure/devops/boards/backlogs/manage-bugs?view=azure-devops", kind: "docs", verifiedAt: "2026-10-02T11:54:32Z" },
        { label: "ISTQB Glossary (search: severity, priority, defect, regression testing)", url: "https://glossary.istqb.org/en_US/home", kind: "spec", verifiedAt: "2026-10-02T11:55:41Z" },
        { label: "Atlassian: Understanding incident severity levels", url: "https://www.atlassian.com/incident-management/kpis/severity-levels", kind: "article", verifiedAt: "2026-10-02T11:53:51Z" },
        { label: "PagerDuty Incident Response: Severity levels", url: "https://response.pagerduty.com/before/severity_levels/", kind: "docs", verifiedAt: "2026-10-02T11:55:05Z" },
      ],
      video: {
        title: "Severity and Priority in Software Testing",
        channel: "Software Testing Material",
        url: "https://www.youtube.com/watch?v=HW_tnUnUav8",
        videoId: "HW_tnUnUav8",
        verifiedAt: "2026-10-02T12:17:24Z",
      },
      alternateVideos: [
        {
          title: "Severity Vs Priority| Difference between them With Examples | Most Asked Interview Questions",
          channel: "SoftwaretestingbyMKT",
          url: "https://www.youtube.com/watch?v=xhNFH5FBbC0",
          videoId: "xhNFH5FBbC0",
          verifiedAt: "2026-10-02T12:17:24Z",
        },
        {
          title: "Bug Severity vs Priority 🔥 | The Most Confusing QA Concept Simplified!",
          channel: "Suresh SDET Automation",
          url: "https://www.youtube.com/watch?v=Ew5R85_Z37o",
          videoId: "Ew5R85_Z37o",
          verifiedAt: "2026-10-02T12:17:25Z",
        },
      ],
      interactive: { kind: "flashcards", category: "quality" },
      handbook: { stages: ["custom-qa-uat", "custom-support"], rules: ["hotfix-approval", "escalation-levels"], templates: ["hypercare-log"] },
      sections: [
        {
          heading: "Severity vs priority: side by side",
          body:
            "**[[term:severity|Severity]]: how bad is it?**\n- Describes impact on the system or business.\n- Set from evidence: how many users, which flow, is money or data affected, is there a workaround.\n- Usually set by QA or support, not by how loudly someone asks.\n\n**[[term:priority|Priority]]: how soon do we fix it?**\n- A scheduling decision against everything else in the queue.\n- Set from business need, deadlines and severity. Usually agreed by the PM with the client.\n- Raising one item's priority pushes something else back.\n\n**An official example.** Microsoft's Azure Boards guidance uses Severity 1 (Critical) to 4 (Low) for impact, and a separate Priority field for the order of fixing. Its own example: a crash that happens only rarely can be **Severity 2 but Priority 3**. High impact when it happens, but not first in the queue.\n\n**Consequence:** in support terms these levels usually decide the response and resolution targets, and whether a hotfix is justified. Mixing them up means the wrong thing gets fixed first, and the SLA clock runs on the wrong item.",
        },
        {
          heading: "The four combinations",
          body:
            "- **High severity, high priority.** Card payments fail for every customer of a white-label grocery app. Fix now; likely a [[term:hotfix]].\n- **High severity, low priority.** The admin export crashes, but only for a report the client runs once a year, next spring. Serious when it happens; scheduled into a later [[term:patch]].\n- **Low severity, high priority.** The wrong logo on the splash screen of a white-label app, the day before store screenshots are taken. Cosmetic, but it blocks a business deadline.\n- **Low severity, low priority.** A misaligned label on one rarely used settings screen. Bundled into the next patch.\n\nWhen a client says \"urgent\", ask which of the two they mean: *it is badly broken* (severity) or *I need it by a date* (priority). Both are valid; they lead to different actions.",
        },
        {
          heading: "Where P1–P4 fits",
          body:
            "Many support contracts use one four-level scale, often called [[term:p1-p4]]: P1 critical (system down or major business stop), P2 high (a major function impaired, no workaround), P3 medium (limited impact or a workaround exists), P4 low (cosmetic or minor). Each level usually carries its own response and resolution targets.\n\nNotice that this scale is defined mostly by impact and workaround. So in practice the support level is mostly a severity judgement, and the PM's priority decisions happen *inside* each level (which of three P3 tickets goes first).\n\nTwo rules keep it honest:\n- Use the definitions written in the contract, not the client's feeling or yours.\n- Re-rate when facts change. A P2 that gets a working workaround can drop to P3; a P3 that spreads to every user can rise to P1.\n\nTypical industry targets are much faster for P1 than P4, but the values vary by contract. Quote the contract, never a number from memory.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label taxi app for a ride-hailing operator in Saudi Arabia, three weeks after go-live.** The client's operations manager logs six tickets in one morning, all marked P1.\n\nThe PM does not argue about labels. She replies with one table: each ticket, the facts, and the level under the contract's definitions.\n\n1. Drivers are not receiving ride requests in one city. Business stopped there, no workaround. **P1.** Team already on it.\n2. Fare receipts show the wrong VAT label. Customers get receipts; the amount is right. **P3**, high priority because the finance team needs it before month end.\n3. The promo banner image is blurry. **P4.**\n4. Driver ratings do not update until the app restarts. Workaround exists. **P3.**\n5. One driver cannot upload a licence photo; others can. **P3**, investigating the device.\n6. The admin panel is slow on Monday mornings. **P3.**\n\nShe ends with: \"Ticket 1 is our only P1 under the support terms, and it has the whole team. If you see 2 differently, tell me the impact and I'll re-rate it.\" The client agrees, and from then on rates tickets with the definitions attached to the support form.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Everything is P1.** Then nothing is. Recover: reply with facts per ticket and the contract's definitions, never with \"that's not urgent\".\n- **Severity set by seniority.** A founder's typo is still cosmetic. Recover: fix it quickly if it is easy, but rate it honestly.\n- **Priority changed silently.** Moving one item up delays others. Recover: say what moves back when something moves up.\n- **Severity never re-rated.** Recover: re-check when a workaround is found or the impact spreads.\n- **The team rates its own bugs low to look good.** Recover: QA or support sets severity from evidence, and the PM checks it.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. I know the severity or P-level definitions in this client's contract.\n2. Every ticket gets a severity from evidence: users affected, flow, money or data, workaround.\n3. Priority is agreed with the client and the trade-off is visible.\n4. Disputed levels are answered with facts and definitions, not opinions.\n5. Levels are re-rated when facts change.",
        },
      ],
      sop: [
        {
          title: "Oyelabs severity and priority scale",
          prompt: "[Oyelabs SOP – admin to fill] Oyelabs' severity levels and P1–P4 definitions with examples, who sets severity and who sets priority on client-reported issues, and the response and resolution target for each level by plan (warranty, AMC, support).",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c04-severity-priority-q1",
          prompt: "What does severity describe?",
          options: [
            "How much damage the defect causes to the system or business",
            "How soon the client wants it fixed",
            "How long the fix will take",
            "Who reported the issue",
          ],
          correctIndex: 0,
          explanation: "Severity is impact. Priority is the order of fixing.",
        },
        {
          id: "pmp-c04-severity-priority-q2",
          prompt: "The wrong logo shows on the splash screen of a white-label app. Store screenshots are being taken tomorrow. How would you rate it?",
          options: ["Low severity, high priority", "High severity, high priority", "High severity, low priority", "Low severity, low priority"],
          correctIndex: 0,
          explanation: "It breaks nothing (low severity) but blocks a business deadline (high priority).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c04-severity-priority-q3",
          prompt: "An admin export crashes, but only for an annual report the client next runs in eight months. How would you rate it?",
          options: ["High severity, low priority", "Low severity, high priority", "Low severity, low priority", "It is not a defect"],
          correctIndex: 0,
          explanation: "A crash is serious when it happens, but nothing needs it soon, so it can be scheduled. Microsoft's own example of a rare crash is Severity 2, Priority 3.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c04-severity-priority-q4",
          prompt: "Which facts should decide severity? (Select all that apply.)",
          options: [
            "How many users are affected",
            "Whether money or data is affected",
            "Whether a workaround exists",
            "How senior the person reporting it is",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Severity comes from evidence about impact. The reporter's seniority changes nothing.",
        },
        {
          id: "pmp-c04-severity-priority-q5",
          prompt: "A client marks all six of this morning's tickets P1. Only one stops the business. What is the best reply?",
          options: [
            "A short table: each ticket, the facts and its level under the contract's definitions, inviting the client to share impact you missed",
            "\"Only one of these is urgent, please stop marking everything P1.\"",
            "Treat all six as P1 to keep the client happy",
            "Ignore the labels and work in any order",
          ],
          correctIndex: 0,
          explanation: "Facts plus the agreed definitions settle the level without a fight, and the invitation keeps the client involved.",
        },
        {
          id: "pmp-c04-severity-priority-q6",
          prompt: "A P2 ticket (major function impaired, no workaround) now has a reliable workaround. What should happen?",
          options: [
            "Re-rate it, often to P3, and tell the client why",
            "Keep it P2 forever",
            "Close it",
            "Raise it to P1",
          ],
          correctIndex: 0,
          explanation: "Levels follow the facts. A workaround typically lowers the level; the fix still follows.",
        },
        {
          id: "pmp-c04-severity-priority-q7",
          prompt: "Who usually sets each value?",
          options: [
            "Severity: QA or support from evidence. Priority: agreed by the PM and the client",
            "Both are set by the client alone",
            "Both are set by the developer fixing it",
            "Severity by the client's CEO, priority by QA",
          ],
          correctIndex: 0,
          explanation: "Impact is a technical judgement; priority is a business scheduling decision.",
        },
        {
          id: "pmp-c04-severity-priority-q8",
          prompt: "The client raises a minor report to top priority. What should the PM make visible? (Select all that apply.)",
          options: [
            "Which other items move back as a result",
            "Any effect on the sprint or patch date",
            "That severity has not changed",
            "That the developer disagrees personally",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Priority is a trade-off. Show what it costs; keep the impact rating honest.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c04-severity-priority-q9",
          prompt: "Why do severity levels matter in a support contract?",
          options: [
            "They usually decide the response and resolution targets for each ticket",
            "They decide the hourly rate of the developer",
            "They replace the need for an SLA",
            "They only matter during development",
          ],
          correctIndex: 0,
          explanation: "In support terms, the level usually sets the clock. Rating wrongly puts the SLA clock on the wrong item.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "A Laravel and React booking platform for a UK physiotherapy clinic chain is live. Rate each report on both axes. Context: the client's annual audit export is next due in eight months, and the client's marketing campaign starts on Monday.",
        categories: [
          { id: "hs-hp", label: "High severity, high priority" },
          { id: "hs-lp", label: "High severity, low priority" },
          { id: "ls-hp", label: "Low severity, high priority" },
          { id: "ls-lp", label: "Low severity, low priority" },
        ],
        items: [
          { id: "i1", text: "No patient can complete a booking: the confirm button returns an error for everyone.", explanation: "Core flow down for all users, now: high and high." },
          { id: "i2", text: "The annual audit export crashes when it includes more than a year of data.", explanation: "A crash, but not needed for eight months: high severity, low priority." },
          { id: "i3", text: "The campaign landing page shows last year's offer text. The campaign goes out on Monday.", explanation: "Cosmetic, but blocks a business date: low severity, high priority." },
          { id: "i4", text: "A tooltip on the therapist settings page is cut off on small laptops.", explanation: "Cosmetic and not time-bound: low and low." },
          { id: "i5", text: "Some patients are charged the cancellation fee twice.", explanation: "Money affected, live: high and high." },
          { id: "i6", text: "The yearly holiday-calendar import fails, but it is only run each December and it is now March.", explanation: "Serious failure, but not needed for months: high severity, low priority." },
          { id: "i7", text: "The clinic's new phone number is wrong in the footer, and the campaign sends traffic to the site on Monday.", explanation: "Small text issue that matters before a launch: low severity, high priority." },
          { id: "i8", text: "The \"About us\" page has a double space between two words.", explanation: "Cosmetic, no deadline: low and low." },
        ],
        answer: { i1: "hs-hp", i2: "hs-lp", i3: "ls-hp", i4: "ls-lp", i5: "hs-hp", i6: "hs-lp", i7: "ls-hp", i8: "ls-lp" },
      },
    },
    {
      id: "pmp-c04-qa-uat-smoke-regression",
      moduleId: "pmp-c04",
      trackId: "pm",
      title: "QA, UAT, smoke and regression testing",
      summary:
        "Four kinds of testing that clients and PMs blur into \"testing\". [[term:qa|QA]] is the delivery team's own testing against the requirements, before the client sees anything. [[term:uat|UAT]] is the client's testing against their business needs and the agreed [[term:acceptance-criteria]], ending in [[term:sign-off]]. A [[term:smoke-test]] is a quick, shallow check that the most important functions work at all after a new build or deployment. [[term:regression-test|Regression testing]] re-checks features that used to work, to make sure a change has not broken them.\n\nWhy it matters at an agency: each one catches a different failure, and skipping one moves the cost somewhere else. Thin QA moves defects into UAT, where the client finds them and trust drops. No smoke test after a deployment means users find the outage first. No regression testing means a fix in one place breaks another, and that [[term:regression]] is typically fixed at the agency's cost. UAT sign-off is also often a contractual acceptance point and a payment milestone.\n\nHow to do it: plan all four in the schedule, name who runs each, and use the words exactly. QA runs on staging during sprints. Regression runs before every release. UAT runs on a stable build in the [[term:uat-environment|UAT environment]] or staging. Smoke tests run right after every deployment, including go-live.\n\nThe common mistake: treating UAT as the client doing your QA. The client should be confirming business fit, not finding crashes.\n\nNot legal advice: the signed contract always wins.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "ISTQB Glossary (search: severity, priority, defect, regression testing)", url: "https://glossary.istqb.org/en_US/home", kind: "spec", verifiedAt: "2026-10-02T11:55:41Z" },
        { label: "TechTarget: What is smoke testing?", url: "https://www.techtarget.com/it-infrastructure/definition/smoke-testing", kind: "article", verifiedAt: "2026-10-02T11:55:45Z" },
        { label: "TechTarget: What is regression testing?", url: "https://www.techtarget.com/it-infrastructure/definition/What-is-regression-testing", kind: "article", verifiedAt: "2026-10-02T11:55:46Z" },
        { label: "Atlassian: The different types of software testing", url: "https://www.atlassian.com/continuous-delivery/software-testing/types-of-software-testing", kind: "article", verifiedAt: "2026-10-02T11:54:26Z" },
      ],
      video: {
        title: "Smoke vs Sanity vs Regression testing - explained with example",
        channel: "Software Testing Tips and Tricks",
        url: "https://www.youtube.com/watch?v=1L_P6K6Zw3M",
        videoId: "1L_P6K6Zw3M",
        verifiedAt: "2026-10-02T12:17:25Z",
      },
      alternateVideos: [
        {
          title: "Smoke Testing Vs Regression Testing | Software Testing | QA | Functional Testing",
          channel: "Testing Talks with Faisal Khatri",
          url: "https://www.youtube.com/watch?v=Qt6xTQln3WU",
          videoId: "Qt6xTQln3WU",
          verifiedAt: "2026-10-02T12:17:25Z",
        },
        {
          title: "Regression Testing with Real Life Examples | Software Engineering",
          channel: "Gate Smashers",
          url: "https://www.youtube.com/watch?v=5496sXljdnQ",
          videoId: "5496sXljdnQ",
          verifiedAt: "2026-10-02T12:17:25Z",
        },
      ],
      handbook: { stages: ["custom-qa-uat", "wl-builds-qa"], rules: ["uat-signoff-before-golive"], templates: ["uat-signoff"] },
      sections: [
        {
          heading: "QA vs UAT: side by side",
          body:
            "**[[term:qa|QA]] (quality assurance)**\n- Who: the delivery team (QA engineers, with developers).\n- Against: the requirements, the [[term:prd|PRD]], the acceptance criteria and the team's [[term:definition-of-done|Definition of Done]].\n- Where: the [[term:staging-environment]], on the agreed devices and browsers.\n- Question: *did we build it right?*\n\n**[[term:uat|UAT]] (user acceptance testing)**\n- Who: the client or their real users.\n- Against: their business needs and the agreed acceptance criteria, with realistic scenarios.\n- Where: a stable build in the [[term:uat-environment|UAT environment]] or staging.\n- Question: *does this work for our business?*\n- Ends in written [[term:sign-off]], often a contractual acceptance point.\n\n**Consequence:** reports from UAT still need classifying. Typically, some are bugs fixed under the project, and some are new requests handled as change requests. Thin QA turns UAT into a bug hunt, which delays sign-off, go-live and often a payment.",
        },
        {
          heading: "Smoke test vs regression test: side by side",
          body:
            "**[[term:smoke-test|Smoke test]]**\n- Quick and shallow: typically minutes to an hour.\n- After each new build or deployment, including go-live.\n- Checks: the app opens, login works, the main flow completes (search, add to cart, test payment, order email).\n- Question: *is anything major broken?* If it fails, deeper testing stops.\n\n**[[term:regression-test|Regression test]]**\n- Broad and repeated: re-runs the existing [[term:test-case|test cases]] across features that already worked.\n- Before each release, after a hotfix where possible, and before a [[term:core-upgrade]].\n- A manual regression typically takes days on a large app; automation shortens it.\n- Question: *did this change break anything that used to work?*\n\n**Consequence:** a smoke test can pass while a regression is hiding in a corner of the app. They do different jobs. Regression effort should be included in change-request and upgrade estimates.",
        },
        {
          heading: "Regression (the bug) vs regression testing (the activity)",
          body:
            "- A **[[term:regression]]** is a bug: something that used to work stops working after a change, such as a new feature, a fix, an upgrade or a configuration change.\n- **Regression testing** is the activity that exists to catch those bugs before users do.\n\nWhy the PM cares: a regression caused by the agency's own change is typically treated as a bug and fixed at no charge. Frequent regressions point to weak regression testing, which is cheaper to fix than the regressions themselves.",
        },
        {
          heading: "Where each test sits on the timeline",
          body:
            "1. **During each sprint:** QA tests each story on staging against its acceptance criteria.\n2. **Before a release goes to the client:** regression testing on staging. QA exit criteria met.\n3. **UAT:** the client tests a stable build in the UAT environment. Avoid changing the build mid-UAT; it usually restarts parts of testing.\n4. **Sign-off:** written, with any [[term:known-issues]] listed and accepted.\n5. **Go-live deployment:** a smoke test in production immediately after.\n6. **After go-live:** every patch or hotfix gets a smoke test, and a regression run where the change is wider.\n\n[[term:defect-leakage|Defect leakage]] measures how many defects slip from one stage to the next, for example found by the client in UAT instead of by QA. It is a useful number for the retrospective.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label grocery app for a supermarket group in Oman, rebranded build ready for the client.**\n\n- **QA:** the QA engineer tests every configured flow on staging with the client's branding and test payment keys, on the agreed Android and iOS devices. 14 bugs logged and fixed.\n- **Regression:** because two custom modules were added, QA re-runs the regression suite. It finds that the client's custom loyalty module stops awarding points after a checkout change. Fixed before the client ever sees it.\n- **UAT:** the client's store managers test real scenarios for the agreed window. Of their reports, some are bugs and some are new requests; the PM classifies each one and logs the new requests as change requests.\n- **Sign-off:** written, with one low-severity known issue accepted.\n- **Go-live:** right after the production deployment, QA runs a 15-minute smoke test: open app, log in, search, add to cart, test payment, order email. Pass. The PM announces go-live.\n\nThe client never found a crash, because every kind of testing was planned and named.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **UAT used as free QA.** Recover: define QA exit criteria; nothing goes to UAT until they are met.\n- **No smoke test after deployment.** Users find the outage. Recover: add a written smoke checklist to every deployment and to the go-live plan.\n- **Regression skipped for \"small\" changes.** Recover: at least run the regression cases around the changed area, and include regression effort in CR estimates.\n- **The client tests an old build.** Recover: name the build in every UAT message.\n- **UAT with no end date and no sign-off form.** Recover: agree the window and the sign-off form before UAT starts.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. QA, regression, UAT and smoke testing are all in the plan, with owners.\n2. QA exit criteria are met before UAT starts.\n3. UAT has a window, a stable build, a feedback channel and a sign-off form.\n4. UAT reports are classified (bug, change request, clarification).\n5. Every production deployment is followed by a smoke test.\n6. Regression effort is included in CR and upgrade estimates.",
        },
      ],
      sop: [
        {
          title: "Oyelabs testing process",
          prompt: "[Oyelabs SOP – admin to fill] Oyelabs' QA process and default device coverage, QA exit criteria before UAT, the standard UAT window and sign-off form, whether staging doubles as the UAT environment, and the standard smoke-test checklist after each deployment.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c04-qa-uat-smoke-regression-q1",
          prompt: "What is the main difference between QA and UAT?",
          options: [
            "QA is the team checking against requirements; UAT is the client checking against business needs and acceptance criteria",
            "QA happens after go-live; UAT happens before",
            "They are the same thing",
            "UAT is done only by developers",
          ],
          correctIndex: 0,
          explanation: "QA asks \"did we build it right?\". UAT asks \"does it work for our business?\".",
        },
        {
          id: "pmp-c04-qa-uat-smoke-regression-q2",
          prompt: "Right after the go-live deployment, QA spends 15 minutes checking that the app opens, login works and a test order completes. What is this?",
          options: ["A smoke test", "A regression test", "UAT", "A code review"],
          correctIndex: 0,
          explanation: "A quick, shallow check of the most important functions after a deployment is a smoke test.",
        },
        {
          id: "pmp-c04-qa-uat-smoke-regression-q3",
          prompt: "After a change to checkout, QA re-runs the existing test cases and finds the loyalty module no longer awards points. What found the problem, and what is the problem called?",
          options: [
            "Regression testing found a regression",
            "A smoke test found a new feature",
            "UAT found a change request",
            "QA found a clarification",
          ],
          correctIndex: 0,
          explanation: "Something that used to work broke after a change: a regression. Re-running existing tests to catch it is regression testing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c04-qa-uat-smoke-regression-q4",
          prompt: "The smoke test after a release passes. Can the team be sure nothing else is broken?",
          options: [
            "No: a smoke test is shallow; regressions elsewhere need regression testing",
            "Yes: a passing smoke test proves everything works",
            "Yes, if the client is happy",
            "Only on iOS",
          ],
          correctIndex: 0,
          explanation: "A smoke test checks only the most important paths. It is not a substitute for regression testing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c04-qa-uat-smoke-regression-q5",
          prompt: "Which are signs that QA is too thin? (Select all that apply.)",
          options: [
            "The client finds crashes in the first days of UAT",
            "Defect leakage from QA to UAT is high",
            "UAT sign-off keeps slipping because of bug fixes",
            "The client asks for a new feature during UAT",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Crashes in UAT, high leakage and slipping sign-off point to QA gaps. A new feature request is a scope matter, not a QA failure.",
        },
        {
          id: "pmp-c04-qa-uat-smoke-regression-q6",
          prompt: "In UAT, the client reports 13 items. Some are real defects; some are things never in scope. What should the PM do?",
          options: [
            "Classify each one: bugs fixed under the project, new requests logged as change requests, questions answered as clarifications",
            "Fix all 13 free, since they came from UAT",
            "Reject all 13 until sign-off",
            "Log all 13 as change requests",
          ],
          correctIndex: 0,
          explanation: "UAT reports are not all bugs. Classify each against the agreed scope and criteria.",
        },
        {
          id: "pmp-c04-qa-uat-smoke-regression-q7",
          prompt: "Halfway through UAT, the team wants to deploy a new build with five fixes to the UAT environment. What is the main risk?",
          options: [
            "Changing the build mid-UAT usually means parts of testing must be repeated",
            "Nothing, more fixes are always better",
            "The client loses access permanently",
            "It automatically ends UAT",
          ],
          correctIndex: 0,
          explanation: "UAT should run on a stable build. If a new build is needed, agree it with the client and say which areas need re-testing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c04-qa-uat-smoke-regression-q8",
          prompt: "When should regression testing typically happen? (Select all that apply.)",
          options: [
            "Before each release",
            "Before a white-label core upgrade",
            "Around the changed area after a hotfix, where possible",
            "Only once, at the start of the project",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Regression testing is repeated every time a change could break existing behaviour.",
        },
        {
          id: "pmp-c04-qa-uat-smoke-regression-q9",
          prompt: "Why does UAT sign-off matter commercially?",
          options: [
            "It is often a contractual acceptance point and a payment milestone, and typically comes before go-live",
            "It ends the project's warranty",
            "It replaces the need for QA",
            "It sets the developer's rate",
          ],
          correctIndex: 0,
          explanation: "Sign-off often marks acceptance. Check the contract for what it triggers.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "A React Native fitness app for a client in the US is heading to launch. Which kind of testing is each activity?",
        categories: [
          { id: "qa", label: "QA (team testing)" },
          { id: "uat", label: "UAT (client testing)" },
          { id: "smoke", label: "Smoke test" },
          { id: "regression", label: "Regression test" },
        ],
        items: [
          { id: "i1", text: "The QA engineer tests the new workout-plan story on three Android and two iOS devices against its acceptance criteria.", explanation: "The team testing a story against requirements: QA." },
          { id: "i2", text: "The client's gym managers try booking classes the way their members would, then sign the acceptance form.", explanation: "The client confirming business fit, ending in sign-off: UAT." },
          { id: "i3", text: "Ten minutes after the production deployment: open the app, log in, start a workout, check the payment screen loads.", explanation: "Quick check of the main paths after a deployment: smoke test." },
          { id: "i4", text: "Before release 1.3, QA re-runs all existing test cases for login, payments and history because the account module changed.", explanation: "Re-checking features that already worked after a change: regression." },
          { id: "i5", text: "After a hotfix to the subscription screen, QA re-checks billing, renewal and cancellation flows that worked before.", explanation: "Making sure the fix did not break existing behaviour: regression." },
          { id: "i6", text: "The client's head of marketing checks that the onboarding wording matches their brand voice before approving.", explanation: "The client judging fit to their business: UAT." },
          { id: "i7", text: "A new build arrives on staging; QA checks it opens and login works before starting the full test cycle.", explanation: "A shallow check that the build is testable at all: smoke test." },
          { id: "i8", text: "The QA engineer writes and runs test cases for a new edge case: a workout paused overnight.", explanation: "The team testing new work against requirements: QA." },
        ],
        answer: { i1: "qa", i2: "uat", i3: "smoke", i4: "regression", i5: "regression", i6: "uat", i7: "smoke", i8: "qa" },
      },
    },
    {
      id: "pmp-c04-response-resolution-tat",
      moduleId: "pmp-c04",
      trackId: "pm",
      title: "Response time, resolution time and TAT",
      summary:
        "Three clocks that clients hear as one. [[term:response-time|Response time]] runs from when an issue is reported to when the support team first acknowledges it and starts working on it. [[term:resolution-time|Resolution time]] runs from the report until the issue is fixed or a workaround restores service. [[term:tat|TAT]] (turnaround time) is the total elapsed time to complete any request, such as a support ticket, a change-request estimate or a design revision. In support, TAT is often used loosely to mean resolution time, so it must always be defined.\n\nWhy it matters at an agency: the [[term:sla|SLA]] in a support plan or [[term:amc|AMC]] usually sets response and resolution targets per level. A client who reads \"4-hour response\" as \"fixed in 4 hours\" will feel let down even when the target was met. And the clock rules decide everything: business hours or calendar hours, whose time zone, whether the clock pauses while waiting for the client, and whether a workaround counts as resolved.\n\nHow to do it: for every client, know the contract's definition of each clock and its pause rules. When you acknowledge a ticket, say what happens next and when. When you quote a TAT, say what it measures and in which hours. Resolution commitments are costlier than response commitments, which is why many contracts make resolution a target rather than a promise.\n\nThe common mistake: quoting \"TAT\" or a number from memory instead of from the contract.\n\nNot legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Atlassian Support (Jira Service Management): Create SLAs to manage goals", url: "https://support.atlassian.com/jira-service-management-cloud/docs/create-service-level-agreements-slas/", kind: "docs", verifiedAt: "2026-10-02T12:01:26Z" },
        { label: "Atlassian Support (Jira Service Management): What are SLAs?", url: "https://support.atlassian.com/jira-service-management-cloud/docs/what-are-slas/", kind: "docs", verifiedAt: "2026-10-02T12:01:26Z" },
        { label: "Atlassian: What is an SLA? Service level agreements explained", url: "https://www.atlassian.com/itsm/service-request-management/slas", kind: "article", verifiedAt: "2026-10-02T11:53:42Z" },
        { label: "Atlassian: Common incident management metrics (MTTA, MTTR)", url: "https://www.atlassian.com/incident-management/kpis/common-metrics", kind: "article", verifiedAt: "2026-10-02T11:53:54Z" },
      ],
      video: {
        title: "Response Time vs Resolution Time: Key SLA Metrics Explained",
        channel: "CodeLucky",
        url: "https://www.youtube.com/watch?v=t82UmqYL3mY",
        videoId: "t82UmqYL3mY",
        verifiedAt: "2026-10-02T12:17:25Z",
      },
      alternateVideos: [
        {
          title: "Response Time VS Resolution Time Explained for IT Support",
          channel: "ComTech Network Solutions",
          url: "https://www.youtube.com/watch?v=3Jul8iev-JQ",
          videoId: "3Jul8iev-JQ",
          verifiedAt: "2026-10-02T12:17:25Z",
        },
        {
          title: "SLAs, SLOs, and SLIs EXPLAINED in 7 Minutes (2025)",
          channel: "Better Stack",
          url: "https://www.youtube.com/watch?v=pouVbehfnqQ",
          videoId: "pouVbehfnqQ",
          verifiedAt: "2026-10-02T12:17:28Z",
        },
      ],
      handbook: { stages: ["custom-support", "custom-hypercare"], rules: ["billing-bug-warranty", "escalation-levels"], templates: ["hypercare-log"] },
      sections: [
        {
          heading: "Response vs resolution vs TAT: side by side",
          body:
            "**[[term:response-time|Response time]]: *have you seen it?***\n- From report to first acknowledgement by a person who starts working on it.\n- Does not mean fixed. Whether an automated \"we got your email\" counts depends on the contract.\n- Measured across many tickets as MTTA (mean time to acknowledge).\n\n**[[term:resolution-time|Resolution time]]: *is it working again?***\n- From report to fix, or to a workaround that restores service.\n- Contracts should say whether a workaround counts and whether the clock pauses while waiting for the client.\n- Measured across many tickets as MTTR (mean time to resolve or restore).\n\n**[[term:tat|TAT]] (turnaround time): *how long until I get what I asked for?***\n- Total elapsed time for any request: a ticket, a CR estimate, a design revision.\n- Informal agency usage with no single standard definition. Always tie it to a start, an end and the hours it counts.\n\n**Consequence:** response targets are cheap to promise and easy to meet. Resolution targets are costlier, because some fixes depend on third parties, client input or a store review. Typical targets range from under an hour for critical issues to a business day or more for low priority, but the contract decides.",
        },
        {
          heading: "The clock rules that cause most disputes",
          body:
            "1. **Business hours or calendar hours.** A ticket logged on Friday evening under business-hours terms may not start its clock until Monday morning. Support tools such as Jira Service Management use SLA calendars that pause the clock outside working hours.\n2. **Whose time zone.** For an overseas client, \"business hours\" must name the time zone. A client in Australia and a team in another time zone can both be \"in business hours\" for only a few hours a day, or none.\n3. **Pause while waiting for the client.** If the team asks for logs or access, does the resolution clock stop until the reply? Contracts should say.\n4. **What counts as resolved.** A workaround that restores service may count as resolution, with the permanent fix following in a [[term:patch]].\n5. **What starts the clock.** Which channels count as reporting: the ticket portal, email, a phone call, a chat message?\n\nIf any of these is unclear, the client and the team will each measure the same ticket differently, and both will feel right.",
        },
        {
          heading: "Per ticket vs on average",
          body:
            "- An **SLA target** is usually per ticket: \"each P2 ticket gets a response within the agreed time\".\n- **MTTA and MTTR** are averages across many tickets, used to see trends.\n\nA good average can hide a missed target: ten fast responses and one very late one can still produce a healthy MTTA. When reporting to a client, show both: how many tickets met their targets, and the averages. Never use an average to answer a complaint about one ticket.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A Laravel accounting tool for a client in Malta, under a support plan.** The plan (an illustrative contract, not Oyelabs' terms) sets response and resolution targets per level in business hours, Central European Time, with the clock paused while waiting for the client.\n\nOn Thursday afternoon the client reports a broken PDF export and writes: \"Your TAT is one day, so this will be fixed by tomorrow afternoon?\"\n\nThe PM replies within the response target: \"Thanks, we've picked this up and logged it as P3, since invoices can still be downloaded as CSV. Just to be clear on timing: under your plan, our P3 target is for resolution in business hours, not a one-day turnaround. We need one sample file that fails; the clock pauses until we have it. Once we do, I'll give you a fix date.\"\n\nThe sample arrives on Friday. The fix ships in the next patch, within the resolution target, and the PM's closing note states the ticket's response and resolution times as the contract measures them. The client stops using \"TAT\" for tickets and asks for it only for estimates, where it is now defined.",
        },
        {
          heading: "How to say it to a client",
          body:
            "- \"Response time is how quickly we acknowledge your issue and start working on it, not how long the fix takes.\"\n- \"Resolution time is how long it takes to fix it or give you a working alternative. For this level, the target is in your support plan, and I'll keep you updated against it.\"\n- \"We're waiting for a screenshot from your side. As agreed in the plan, the clock pauses until we have it.\"\n- \"When you say TAT, do you mean until we reply, or until it's fixed? I want to make sure we're measuring the same thing.\"",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Promising a fix time in the acknowledgement.** Recover: acknowledge, rate, and give a fix date only once the cause is known.\n- **Quoting \"TAT\" without saying what it measures.** Recover: restate it as response or resolution, with the hours and time zone.\n- **Not recording clock pauses.** Then the client's timeline and yours differ. Recover: note in the ticket when you asked for input and when it arrived.\n- **Ignoring time zones for overseas clients.** Recover: write the time zone next to every target and every date.\n- **Defending one missed ticket with a good average.** Recover: own the miss, explain the cause, show what changes.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. For each client, I know the response and resolution targets per level, from the contract.\n2. I know the clock rules: business or calendar hours, time zone, pauses, what counts as resolved, which channels start the clock.\n3. Acknowledgements say what happens next and when, without promising a fix time too early.\n4. Every TAT I quote states what it measures and in which hours.\n5. Clock pauses are recorded in the ticket.\n6. Reports to clients show per-ticket results as well as averages.",
        },
      ],
      sop: [
        {
          title: "Oyelabs support targets and clock rules",
          prompt: "[Oyelabs SOP – admin to fill] Oyelabs' response and resolution targets per priority level for each plan, whether they are commitments or best-effort targets, support hours and time zone, which channels count as reporting, clock-pause rules, whether a workaround counts as resolved, and which other requests (CR estimates, design revisions) have a committed TAT.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c04-response-resolution-tat-q1",
          prompt: "A P2 ticket arrives at 9:00. A support engineer acknowledges it and asks for screenshots at 10:15. Which clock has just stopped?",
          options: ["The response time clock", "The resolution time clock", "Both clocks", "Neither clock"],
          correctIndex: 0,
          explanation: "A person has acknowledged it and started work: that ends response time. Resolution still runs (or pauses, if the contract allows, while waiting for the screenshots).",
        },
        {
          id: "pmp-c04-response-resolution-tat-q2",
          prompt: "The client says: \"You promised 4-hour response, and it's still broken after 6 hours.\" The ticket was acknowledged in 40 minutes. What is the best reply?",
          options: [
            "Explain that the response target was met and give the resolution target and your next update time",
            "Apologise for missing the SLA",
            "Tell the client the SLA does not apply",
            "Promise it will be fixed within the hour",
          ],
          correctIndex: 0,
          explanation: "Response is not resolution. Be clear and kind: the response target was met; here is the resolution target and when you'll update them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c04-response-resolution-tat-q3",
          prompt: "What should a contract say about the resolution clock? (Select all that apply.)",
          options: [
            "Whether it runs in business or calendar hours, and in which time zone",
            "Whether it pauses while waiting for client information",
            "Whether a workaround counts as resolution",
            "Which developer will fix the issue",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Hours, time zone, pauses and the meaning of \"resolved\" decide how the clock is measured. Naming a developer does not.",
        },
        {
          id: "pmp-c04-response-resolution-tat-q4",
          prompt: "A client in Australia says \"your TAT is 2 days\". Nobody has defined TAT for them. What should the PM do?",
          options: [
            "Ask what they mean (reply, fix, or an estimate) and restate it in the contract's terms, with the hours and time zone",
            "Accept 2 calendar days to resolve every ticket",
            "Ignore it, since TAT has no standard meaning",
            "Promise 1 day to be safe",
          ],
          correctIndex: 0,
          explanation: "TAT is informal and has no single standard definition. Tie it to response or resolution, with hours and time zone, as the contract sets them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c04-response-resolution-tat-q5",
          prompt: "The team needs the client's server logs to continue. The client takes two days to send them. The contract allows the clock to pause while waiting for the client. What should the PM have done?",
          options: [
            "Recorded in the ticket when the logs were requested and when they arrived",
            "Kept the clock running to look fair",
            "Closed the ticket until the logs arrived",
            "Started a new ticket when the logs arrived",
          ],
          correctIndex: 0,
          explanation: "A pause only helps if it is recorded. Otherwise the client's timeline and yours will differ.",
        },
        {
          id: "pmp-c04-response-resolution-tat-q6",
          prompt: "What do MTTA and MTTR measure?",
          options: [
            "Average time to acknowledge, and average time to resolve or restore, across many tickets",
            "The targets for a single ticket",
            "The maximum time any ticket may take",
            "Developer working hours",
          ],
          correctIndex: 0,
          explanation: "They are averages for trends. SLA targets usually apply per ticket.",
        },
        {
          id: "pmp-c04-response-resolution-tat-q7",
          prompt: "Your monthly report shows a healthy MTTR, but one P1 missed its resolution target badly. The client complains. What do you do?",
          options: [
            "Own the missed P1, explain the cause and what changes; do not use the average to answer it",
            "Point out that the average is fine",
            "Remove the P1 from the report",
            "Re-rate the P1 as P3 after the fact",
          ],
          correctIndex: 0,
          explanation: "An average can hide a missed target. A complaint about one ticket needs an answer about that ticket.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c04-response-resolution-tat-q8",
          prompt: "Why do many contracts make resolution a target rather than a firm commitment?",
          options: [
            "Some fixes depend on things outside the team's control, such as third parties, client input or store review",
            "Resolution is not important",
            "Response time is always longer",
            "Resolution cannot be measured",
          ],
          correctIndex: 0,
          explanation: "Resolution commitments are costlier and harder to guarantee. Response is within the team's control.",
        },
        {
          id: "pmp-c04-response-resolution-tat-q9",
          prompt: "Which statements are true? (Select all that apply.)",
          options: [
            "A workaround that restores service may count as resolution, if the contract says so",
            "An automated email reply may or may not count as a response, depending on the contract",
            "Response time means the issue is fixed",
            "For an overseas client, \"business hours\" should name a time zone",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Response time is acknowledgement, not a fix. The others depend on, or should be written into, the contract.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Measure one ticket the way the contract does. This is an illustrative support plan, not Oyelabs' terms: support hours are Monday to Friday, 09:00–18:00 in the client's time zone; response and resolution are measured in business time; the resolution clock pauses while the team is waiting for the client. Use the ticket log in the table. Thursday is followed by Friday, then the weekend, then Monday.",
        table: {
          columns: ["When (client time)", "What happened"],
          rows: [
            ["Thursday 16:30", "Client reports that invoices fail to send (logged as P2)"],
            ["Friday 09:40", "Support engineer acknowledges and starts investigating"],
            ["Friday 10:00", "Team asks the client for a failing invoice ID; clock paused"],
            ["Monday 11:00", "Client sends the invoice ID; clock resumes"],
            ["Monday 15:00", "Fix deployed and confirmed; ticket resolved"],
          ],
        },
        fields: [
          { id: "response", label: "Response time, in business minutes", unit: "min", answer: 130, tolerance: 0 },
          { id: "resolutionPaused", label: "Resolution time in business hours, with the pause applied", unit: "h", answer: 6.5, tolerance: 0.01 },
          { id: "resolutionNoPause", label: "Resolution time in business hours, if the contract had no pause rule", unit: "h", answer: 16.5, tolerance: 0.01 },
          { id: "calendar", label: "Elapsed calendar hours from report to fix (what the client may call \"TAT\")", unit: "h", answer: 94.5, tolerance: 0.01 },
        ],
        explanation:
          "Response: Thursday 16:30–18:00 is 90 minutes, plus Friday 09:00–09:40 is 40 minutes: 130 business minutes. Resolution with the pause: Thursday 16:30–18:00 (1.5 h) + Friday 09:00–10:00 (1 h) + Monday 11:00–15:00 (4 h) = 6.5 business hours. Without a pause rule: 1.5 h + all of Friday (9 h) + Monday 09:00–15:00 (6 h) = 16.5 business hours. Calendar time: Thursday 16:30 to Monday 16:30 is 96 hours, minus 1.5 hours = 94.5 hours. The same ticket is 6.5, 16.5 or 94.5 hours depending on the rules, which is why every target must say what it measures.",
      },
    },
    {
      id: "pmp-c04-rca-known-issues",
      moduleId: "pmp-c04",
      trackId: "pm",
      title: "RCA, known errors and known issues",
      summary:
        "Three words for what happens around a defect after the first fix. A [[term:rca|root cause analysis]] (RCA) is a structured investigation, after a significant incident, to find the underlying cause rather than the symptom, and the actions that will stop it happening again. A **known error**, in ITIL terms, is a problem with a documented root cause and a workaround. A [[term:known-issues|known issues]] list is the set of defects or limitations that the team and client have agreed to release with, each with its impact, workaround and planned fix.\n\nWhy it matters at an agency: the fix stops the pain; the RCA stops the repeat. Clients judge an agency less by whether incidents happen than by whether the same one happens twice. The root cause also often decides responsibility, and so whether the fix falls under [[term:warranty]]. Known issues matter at launch: agreeing them avoids delaying [[term:go-live]] for low-impact defects, but only if who fixes them, and when, is written down.\n\nHow to do it: after any [[term:critical-issue]], write a blameless RCA with a timeline, the root cause (ask \"why?\" until you reach a process or system cause, not a person), and owned, dated actions. At the [[term:go-no-go]], list every open defect you will launch with, get the client to accept the list in writing, and attach it to the release notes.\n\nThe common mistake: an RCA that stops at the symptom (\"the server ran out of disk\") or at a person (\"a developer forgot\"). Neither prevents the next one.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Atlassian: Problem management in ITIL", url: "https://www.atlassian.com/itsm/problem-management", kind: "article", verifiedAt: "2026-10-02T11:53:30Z" },
        { label: "Google SRE book: Postmortem culture", url: "https://sre.google/sre-book/postmortem-culture/", kind: "article", verifiedAt: "2026-10-02T11:55:02Z" },
        { label: "Atlassian Team Playbook: 5 Whys analysis", url: "https://www.atlassian.com/team-playbook/plays/5-whys", kind: "docs", verifiedAt: "2026-10-02T11:53:20Z" },
        { label: "TechTarget: What is root cause analysis?", url: "https://www.techtarget.com/it-infrastructure/definition/What-is-root-cause-analysis", kind: "article", verifiedAt: "2026-10-02T11:56:07Z" },
      ],
      video: {
        title: "What is 5 Why - A Root Cause Analysis Technique",
        channel: "LeanVlog",
        url: "https://www.youtube.com/watch?v=-_nN_YTDsuk",
        videoId: "-_nN_YTDsuk",
        verifiedAt: "2026-10-02T12:17:32Z",
      },
      alternateVideos: [
        {
          title: "BEFORE You Do A 5 WHYs Root Cause Analysis Watch This…",
          channel: "Stefano - The Agile Business Analyst",
          url: "https://www.youtube.com/watch?v=zZRmCs7Dag8",
          videoId: "zZRmCs7Dag8",
          verifiedAt: "2026-10-02T12:17:32Z",
        },
        {
          title: "Blameless Postmortem Culture In Software Engineering",
          channel: "Clément Mihailescu",
          url: "https://www.youtube.com/watch?v=Fv0nwb1Qn6A",
          videoId: "Fv0nwb1Qn6A",
          verifiedAt: "2026-10-02T12:17:32Z",
        },
      ],
      handbook: { stages: ["custom-release", "custom-hypercare"], rules: ["hotfix-approval", "uat-signoff-before-golive", "warranty-coverage"], templates: ["golive-checklist", "hypercare-log"] },
      sections: [
        {
          heading: "Fix vs RCA: side by side",
          body:
            "**The fix (or workaround)**\n- Stops the current damage: restart the service, roll back, ship a [[term:hotfix]].\n- Answers: *how do we get users working again?*\n- Happens during the incident, as fast as possible.\n\n**The [[term:rca|RCA]]**\n- Finds why it happened, and why nothing caught it earlier.\n- Answers: *how do we make sure this never happens again?*\n- Happens after service is restored, calmly. Ends with owned, dated actions.\n- Typically shared with the client within a few business days of a critical incident.\n\n**Consequence:** a team that only fixes will meet the same incident again. And because the root cause often decides responsibility (the agency's code, the client's change, a third-party service), the RCA is also what settles whether the fix falls under warranty or is billable. Check the warranty rule in the handbook card below.",
        },
        {
          heading: "Incident, problem, known error: the ITIL words",
          body:
            "Teams that follow ITIL use three words precisely:\n\n- **Incident:** something is broken for users *now*. The goal is to restore service.\n- **Problem:** the underlying cause of one or more incidents. The goal is to find and remove it.\n- **Known error:** a problem with a documented root cause and a workaround. The cause is known; the permanent fix may not be done yet.\n\nA **workaround** is a temporary solution that reduces the impact (\"export as CSV until the PDF fix ships\"). It is not the fix.\n\nWhy a PM cares: \"we know why, here is how to work around it, and the permanent fix ships in patch 1.0.2\" is a calm, credible message. \"We restarted it and it seems fine\" is not.",
        },
        {
          heading: "Known error vs known issues list: side by side",
          body:
            "**Known error (support term)**\n- Comes from investigating live incidents.\n- Has a documented root cause and a workaround.\n- Lives in the support or problem records.\n\n**[[term:known-issues|Known issues]] list (release term)**\n- Agreed at the [[term:go-no-go]] or UAT [[term:sign-off]]: the open defects the client accepts launching with.\n- Each line has the impact, the workaround and the planned fix (often a named patch).\n- Attached to the release notes or the go/no-go decision.\n\n**Consequence:** a known issues list lets a launch go ahead without waiting for low-impact fixes, and it protects both sides later. Without it, every launch-day defect looks like a surprise and a warranty argument. Who fixes known issues, and under which terms, must be written down; Oyelabs' rule is in the handbook card on UAT sign-off before go-live.",
        },
        {
          heading: "Getting to the real root cause",
          body:
            "The **5 Whys** technique: keep asking \"why?\" until the answer is a process or system cause you can change.\n\n1. *Why did the site go down?* The server disk was full.\n2. *Why was it full?* Logs were never compressed or deleted.\n3. *Why?* Log rotation was not set up on this server.\n4. *Why?* The server setup checklist does not include it.\n5. *Why did nobody notice before it filled?* There is no disk-space alert.\n\nRoot causes: no log rotation in the setup checklist, and no disk alert. Actions: add both, apply them to every server.\n\n**Blameless.** If the answer at any step is a person (\"Ravi forgot\"), ask one more why: why could one person's slip take the site down? Blaming people makes the next RCA less honest; fixing the system protects everyone.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label taxi app for an operator in Nigeria, two months after go-live.** Drivers stop being assigned to rides. The team finds an expired map API key, issues a new one and restores service within two hours. The PM calls the client during the incident and sends a short note when it is fixed.\n\nThree days later the PM sends the RCA:\n\n- **Summary and impact:** what users saw, for how long, how many rides were affected.\n- **Timeline:** detection, call to the client, fix, confirmation.\n- **Root cause:** the key was created with an expiry date, in an account nobody on either side was watching, with no reminder or alert.\n- **Contributing factor:** the key had been set up during development and was never moved to a client-owned account at handover.\n- **Actions, each with an owner and a date:** move the key to the client's own account; add an expiry alert; add API-key expiry dates to the handover checklist for every white-label client.\n- **Known error until the actions are done:** the workaround if another key expires, and who to call.\n\nThe client's reply: \"Thanks, that's the first time a vendor has explained why.\"",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Root cause = the symptom.** \"The disk was full\" is what happened, not why. Recover: keep asking why until you reach something you can change.\n- **Root cause = a person.** Recover: rewrite blamelessly; name the gap in process or tooling.\n- **Actions with no owner or date.** They never happen. Recover: one owner and one date per action, tracked to closure.\n- **RCA sent weeks later.** The client has already made up their mind. Recover: send a short holding note quickly, then the full RCA.\n- **Launching with open defects but no written known issues list.** Recover: write the list now, get the client's acceptance and add the fix dates.",
        },
        {
          heading: "Your checklist",
          body:
            "1. After every critical incident: service restored first, then a blameless RCA.\n2. The RCA has impact, timeline, root cause, contributing factors and owned, dated actions.\n3. Known errors are recorded with their workaround until the permanent fix ships.\n4. Every go-live has a written known issues list, accepted by the client, with planned fixes.\n5. RCA actions are tracked to closure and checked in the next status report.",
        },
      ],
      sop: [
        {
          title: "Oyelabs RCA and known issues process",
          prompt: "[Oyelabs SOP – admin to fill] Which incidents require an RCA at Oyelabs, the RCA template, the deadline for sharing it with the client, who reviews it before it is sent, whether a known issues list is mandatory at go-live, and who must approve going live with known issues.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c04-rca-known-issues-q1",
          prompt: "What is the main purpose of an RCA?",
          options: [
            "To find the underlying cause of an incident and the actions that stop it happening again",
            "To restore service as fast as possible",
            "To decide which developer to blame",
            "To list the features in the next release",
          ],
          correctIndex: 0,
          explanation: "Restoring service is the fix. The RCA is about why it happened and how to prevent a repeat.",
        },
        {
          id: "pmp-c04-rca-known-issues-q2",
          prompt: "An RCA says: \"Root cause: the server ran out of disk space.\" What is wrong with it?",
          options: [
            "It states the symptom; it should go on to why the disk filled and why nothing caught it",
            "Nothing, it is a complete root cause",
            "Disk space is never a root cause",
            "It should name the engineer responsible",
          ],
          correctIndex: 0,
          explanation: "A full disk is what happened. The root cause is the missing log rotation and the missing alert, which can be fixed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c04-rca-known-issues-q3",
          prompt: "An RCA concludes: \"A developer forgot to renew the API key.\" How should it be improved?",
          options: [
            "Ask why one person's slip could cause an outage, and fix the process gap (ownership, alerts, checklist)",
            "Add the developer's name to the client report",
            "Accept it as the root cause",
            "Remove the RCA because it is embarrassing",
          ],
          correctIndex: 0,
          explanation: "Blameless RCAs look past people to the system. Otherwise the next person will make the same slip.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c04-rca-known-issues-q4",
          prompt: "In ITIL terms, what is a known error?",
          options: [
            "A problem with a documented root cause and a workaround",
            "Any bug that users have reported twice",
            "A defect listed in the release notes",
            "An error that cannot be fixed",
          ],
          correctIndex: 0,
          explanation: "A known error has a known cause and a workaround; the permanent fix may still be pending.",
        },
        {
          id: "pmp-c04-rca-known-issues-q5",
          prompt: "What should each line of a go-live known issues list contain? (Select all that apply.)",
          options: ["The impact", "The workaround", "The planned fix, for example a named patch", "The name of the developer who caused it"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Impact, workaround and planned fix let the client make an informed decision. Names do not belong there.",
        },
        {
          id: "pmp-c04-rca-known-issues-q6",
          prompt: "At the go/no-go, two low-severity defects are open. The client wants to launch. What is the right approach?",
          options: [
            "List them as known issues with workarounds and fix dates, and get the client's written acceptance",
            "Delay go-live until both are fixed, regardless of impact",
            "Launch and mention them only if the client notices",
            "Close them as won't fix",
          ],
          correctIndex: 0,
          explanation: "Agreed, written known issues let a launch go ahead safely and prevent later disputes.",
        },
        {
          id: "pmp-c04-rca-known-issues-q7",
          prompt: "An RCA finds that an outage was caused by the client's own team changing a server setting. Why does this matter beyond preventing a repeat?",
          options: [
            "The root cause often decides responsibility, and so whether the fix is under warranty or billable",
            "It means no RCA was needed",
            "It ends the support contract",
            "It does not matter at all",
          ],
          correctIndex: 0,
          explanation: "Warranty typically excludes changes made by the client or third parties. Present the finding factually and refer to the contract.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c04-rca-known-issues-q8",
          prompt: "Which of these belong in a good RCA? (Select all that apply.)",
          options: [
            "A timeline from detection to recovery",
            "The impact on users and the business",
            "Actions, each with an owner and a due date",
            "A list of who was at fault",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Good RCAs are factual, blameless and end with owned actions.",
        },
        {
          id: "pmp-c04-rca-known-issues-q9",
          prompt: "What is the difference between a workaround and a fix?",
          options: [
            "A workaround is a temporary way to reduce the impact; the fix removes the cause",
            "They are the same",
            "A workaround is always applied by the client's developers",
            "A fix is temporary; a workaround is permanent",
          ],
          correctIndex: 0,
          explanation: "\"Export as CSV until the PDF fix ships\" is a workaround. The patch that repairs the PDF is the fix.",
        },
        {
          id: "pmp-c04-rca-known-issues-q10",
          prompt: "A critical incident was fixed on Monday. When should the client hear about the cause?",
          options: [
            "A short holding note quickly, then the full RCA within the agreed time, typically a few business days",
            "Only if they ask",
            "At the next quarterly review",
            "Never, to avoid embarrassment",
          ],
          correctIndex: 0,
          explanation: "Clients judge you by how you explain and prevent incidents. A late RCA arrives after they have made up their minds.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A PM drafted this RCA for a client after a two-hour outage of a Laravel and React ticketing site. Mark every line that a good, blameless RCA should not contain or that gets a term wrong.",
        segments: [
          { id: "s1", text: "Summary: on Saturday the ticketing site was unavailable from 19:10 to 21:05. About 300 customers could not buy tickets during that time.", issue: null },
          { id: "s2", text: "Timeline: alert at 19:12, client called at 19:20, cause found at 20:30, service restored at 21:05 after clearing old log files.", issue: null },
          { id: "s3", text: "Root cause: the server ran out of disk space.", issue: "That is the symptom. The root cause is why the disk filled and why nothing warned anyone: no log rotation and no disk-space alert." },
          { id: "s4", text: "This happened because our developer Ravi forgot to set up log rotation.", issue: "Blames a person. A blameless RCA names the process gap: log rotation is not in the server setup checklist." },
          { id: "s5", text: "Contributing factor: there was no alert for low disk space, so the problem was only seen once the site was down.", issue: null },
          { id: "s6", text: "Clearing the logs has fixed the root cause, so no further action is needed.", issue: "Clearing logs was a workaround that restored service. Without rotation and an alert, the disk will fill again." },
          { id: "s7", text: "Actions: add log rotation and a disk-space alert to this server (owner: tech lead, by Friday), and add both to the setup checklist for all servers (owner: DevOps lead, by end of month).", issue: null },
          { id: "s8", text: "We have also added this to the known issues list for the release, since it is now fixed.", issue: "A known issues list holds open defects agreed for a release, with a workaround and planned fix. It is not a log of past incidents." },
          { id: "s9", text: "We will confirm in next week's status report when each action is complete.", issue: null },
        ],
        askExplanation: true,
      },
    },
  ],
} satisfies Module;
