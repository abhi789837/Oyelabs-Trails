import type { Module } from "@/types/curriculum";

const STANDARD_RUBRIC = [
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
];

export default {
  id: "pmp-a10",
  trackId: "pm",
  name: "QA, UAT & sign-off",
  description:
    "How a custom build moves from internal QA to client UAT and ends in a clean, written UAT sign-off. You learn who owns each kind of testing, how to triage UAT feedback into bugs, change requests and clarifications, and how to close UAT without letting it turn into a second requirements phase.",
  topics: [
    // ---------------------------------------------------------------------------------------------
    // QA vs UAT
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-a10-qa-vs-uat",
      moduleId: "pmp-a10",
      trackId: "pm",
      title: "QA vs UAT",
      summary: `[[term:qa|QA]] and [[term:uat|UAT]] answer two different questions. QA asks "did we build it right?": the Oyelabs QA team tests the build against the requirements, the [[term:acceptance-criteria|acceptance criteria]] and the [[term:test-case|test cases]], and runs [[term:smoke-test|smoke tests]] and [[term:regression-test|regression tests]]. UAT asks "is this what the business needs?": the client's own users try real tasks on the [[term:uat-environment|UAT environment]] and end with a written [[term:sign-off|sign-off]].

At an agency the difference matters because the two are paid for and owned differently. QA is part of Oyelabs' delivery: a defect found in QA is our cost and our problem. UAT is the client's acceptance step: it is where they confirm that the agreed scope works for them, and where the build stops being "ours" and becomes "accepted". If you blur the two, one of two things happens. Either the client does Oyelabs' testing for free, finds basic defects, and loses confidence. Or Oyelabs skips the formal UAT, ships on a verbal "looks fine", and argues later about what was accepted.

Do it in order. Internal QA first, with no open [[term:blocker|blockers]] or [[term:critical-issue|critical issues]]. Then a smoke test on the UAT environment. Then hand the client UAT scenarios written from the acceptance criteria, a feedback channel, and a deadline.

The common mistake is sending a build to UAT "to get early feedback" before QA has finished. The client finds the defects QA would have found, every one of them is logged as "your quality problem", and [[term:defect-leakage|defect leakage]] becomes the story of the project.`,
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        {
          label: "GOV.UK Service Manual: Quality assurance: testing your service regularly",
          url: "https://www.gov.uk/service-manual/technology/quality-assurance-testing-your-service-regularly",
          kind: "docs",
          verifiedAt: "2026-10-02T11:51:28Z",
        },
        {
          label: "Microsoft Learn (Dynamics 365 implementation guide): Test your solution before deployment",
          url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy",
          kind: "docs",
          verifiedAt: "2026-10-02T11:54:54Z",
        },
        {
          label: "Atlassian: The different types of software testing",
          url: "https://www.atlassian.com/continuous-delivery/software-testing/types-of-software-testing",
          kind: "article",
          verifiedAt: "2026-10-02T11:54:26Z",
        },
        {
          label: "TechTarget: What is user acceptance testing (UAT)?",
          url: "https://www.techtarget.com/it-infrastructure/definition/What-is-user-acceptance-testing-UAT",
          kind: "article",
          verifiedAt: "2026-10-02T11:55:42Z",
        },
      ],
      video: {
        title: "What is the difference between QA and UAT",
        channel: "Thomas Ryan",
        url: "https://www.youtube.com/watch?v=6Pdy0TUCK90",
        videoId: "6Pdy0TUCK90",
        verifiedAt: "2026-10-02T12:17:11Z",
      },
      alternateVideos: [
        {
          title: "Software Testing Process Guide: What is User Acceptance Testing - UAT?",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=sGwm4p9sGPI",
          videoId: "sGwm4p9sGPI",
          verifiedAt: "2026-10-02T12:17:11Z",
        },
        {
          title: "Difference between SIT and UAT | Software Testing",
          channel: "The Quality Analyst",
          url: "https://www.youtube.com/watch?v=WsEwSJvb8Mo",
          videoId: "WsEwSJvb8Mo",
          verifiedAt: "2026-10-02T12:17:11Z",
        },
      ],
      handbook: {
        stages: ["custom-qa-uat"],
        rules: ["uat-signoff-before-golive", "billing-bug-in-delivery"],
        templates: ["uat-signoff"],
      },
      sections: [
        {
          heading: "Two questions, two owners",
          body: `**Internal QA** is run by the Oyelabs QA engineers, with the tech lead accountable. It checks the build against the signed requirements, the [[term:user-story|user stories]] and their acceptance criteria. It includes functional testing, [[term:regression-test|regression]] after every change, device and browser coverage, and a [[term:smoke-test|smoke test]] after each deployment. Its output is a test report and a list of open defects with [[term:severity|severity]] and [[term:priority|priority]].

**UAT** is run by the client's business users, with the client sponsor accountable. It checks that real tasks work end to end the way the business needs: a receptionist books a patient, a manager runs the month-end report, a driver closes a delivery. Its output is a list of feedback items and, at the end, a written UAT sign-off with any accepted [[term:known-issues|known issues]].

Oyelabs still has work to do during UAT: prepare the scenarios and the environment, answer questions quickly, triage feedback every day, fix agreed defects and retest. The client still has work to do during QA: provide test data, accounts and answers to open questions.`,
        },
        {
          heading: "Entry and exit, in practice",
          body: `**Before UAT starts (entry):**
- The build is feature-complete for the release and deployed on the [[term:uat-environment|UAT environment]], not on a developer's machine or the [[term:staging-environment|staging]] box QA is still using.
- Internal QA has passed, with no open blockers or critical defects. Lower-severity open defects are listed, so the client is not surprised by them.
- UAT scenarios are written from the acceptance criteria, in the client's language ("Book a follow-up appointment for an existing patient"), not as technical test cases.
- Test accounts, roles and realistic data are ready, and the client knows how to log feedback and by when.

**Before UAT closes (exit):**
- Every feedback item is triaged into a [[term:bug|bug]], a [[term:change-request|change request]] or a [[term:clarification|clarification]].
- Agreed bugs are fixed and retested, with a regression run on the final build.
- Known issues are written down and accepted by the client.
- The written UAT sign-off is received from the named approver.

Follow the Oyelabs rule in the handbook card below on sign-off before go-live; the stage card shows the full entry and exit criteria and the RACI.`,
        },
        {
          heading: "What good looks like: a worked example",
          body: `A React and Laravel field-service app for a facilities company in Manchester is feature-complete at the end of sprint 7.

- **Days 1–4 (QA):** the QA engineer runs 140 test cases, logs 22 defects, and the team fixes the 2 critical and 7 high ones. A regression run and a smoke test on the UAT environment pass. Thirteen medium and low defects remain open and are listed.
- **Day 5 (UAT handover):** the PM sends the client SPOC 35 UAT scenarios grouped by role (dispatcher, engineer, finance), the test logins, a shared feedback sheet with columns for steps, expected and actual result, and the UAT window of two weeks (typical, and as the plan says). The 13 open defects are attached as "already known".
- **Daily during UAT:** the PM and QA lead triage new feedback within one working day. A wrong VAT total on invoices becomes a high-severity bug. "Can engineers upload a video?" becomes a CR. "Why can dispatchers not delete a completed job?" is a clarification: the signed requirement says completed jobs are locked for audit.
- **End of UAT:** fixes are deployed, retested and regression-tested; two cosmetic issues are accepted as known issues for the next patch; the sponsor signs the UAT sign-off.

Nothing in the client's list was a surprise to QA, so the conversation stayed about the business, not about quality.`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **UAT started before QA finished.** Pause UAT for the affected areas, tell the client honestly which areas are not ready, finish QA, and restart those scenarios. A short pause costs less than a client who stops trusting every build.
- **The client tests on staging while QA is still deploying there.** Things break under them. Separate the environments, or agree fixed deployment windows.
- **UAT feedback is treated as one big bug list.** Triage every item. Defects against the acceptance criteria are bugs; new wishes are CRs; questions are clarifications.
- **No UAT scenarios.** The client clicks around without a plan, misses the critical flows, and finds them in production. Always give scenarios written from the acceptance criteria.
- **The client's testers are not the real users.** An IT coordinator signs off flows the finance team has never seen. Ask who will use each flow and get them into UAT.`,
        },
        {
          heading: "Your checklist",
          body: `1. Internal QA complete; no open blocker or critical defects.
2. Open lower-severity defects listed and shared with the client.
3. Smoke test passed on the UAT environment.
4. UAT scenarios written from the acceptance criteria, by role.
5. Test accounts, roles and data ready.
6. Feedback channel, format and daily triage agreed.
7. UAT window and the named approver confirmed in writing.
8. Each feedback item triaged as bug, CR or clarification.
9. Fixes retested and a regression run done on the final build.
10. Known issues listed and the written UAT sign-off received.`,
        },
      ],
      sop: [
        {
          title: "Oyelabs QA exit and UAT handover",
          prompt:
            "[Oyelabs SOP – admin to fill] The internal QA exit criteria at Oyelabs (which severities may stay open), who approves handing a build to UAT, where test cases and UAT scenarios are kept, the standard UAT feedback sheet or tool, and the typical UAT window per project size.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a10-qa-vs-uat-q1",
          prompt: "Which pair best captures the difference between QA and UAT?",
          options: [
            "QA checks the build against the requirements (\"built right\"); UAT checks it does the client's real tasks (\"right thing\") and ends in acceptance",
            "QA is manual testing; UAT is automated testing",
            "QA happens after go-live; UAT happens before",
            "QA is done by the client; UAT is done by Oyelabs",
          ],
          correctIndex: 0,
          explanation:
            "QA is the agency verifying its own work against the spec; UAT is the client validating it for the business and accepting it. Both can be manual or automated, and both happen before go-live.",
        },
        {
          id: "pmp-a10-qa-vs-uat-q2",
          prompt: "Who is normally accountable for UAT being performed and signed off?",
          options: ["The client sponsor", "The Oyelabs QA lead", "The Oyelabs tech lead", "The developer who built the feature"],
          correctIndex: 0,
          explanation:
            "The client's users perform UAT and the client sponsor is accountable for the sign-off. Oyelabs prepares and supports it, but cannot accept its own work on the client's behalf.",
        },
        {
          id: "pmp-a10-qa-vs-uat-q3",
          prompt:
            "The client is impatient and asks for the UAT build now, even though QA has two critical defects open. What do you do?",
          options: [
            "Explain the critical defects, offer a date for a QA-passed build, and if useful show a guided demo meanwhile",
            "Send the build and ask the client to ignore the critical defects",
            "Send the build without mentioning the defects; they may not find them",
            "Cancel UAT and move straight to go-live",
          ],
          correctIndex: 0,
          explanation:
            "Sending a build with known critical defects turns UAT into free QA and damages trust. A clear date and a demo keep momentum without pretending the build is ready.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a10-qa-vs-uat-q4",
          prompt: "Which of these belong to Oyelabs' internal QA rather than to client UAT? (Select all that apply.)",
          options: [
            "Running the regression suite after a fix",
            "Smoke-testing the build after deployment to the UAT environment",
            "Checking each acceptance criterion against its test case",
            "The finance team running month-end invoicing with real-looking data and accepting it",
            "Signing the acceptance statement",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Regression, smoke tests and test-case execution are the agency's verification work. Business users running their real task and signing acceptance are UAT.",
        },
        {
          id: "pmp-a10-qa-vs-uat-q5",
          prompt: "Why should UAT scenarios be written from the acceptance criteria rather than handed over as QA's technical test cases?",
          options: [
            "Business users need tasks in their own language, and the acceptance criteria are what they are accepting",
            "Because test cases are confidential",
            "Because UAT must not cover the same features as QA",
            "Because acceptance criteria are shorter",
          ],
          correctIndex: 0,
          explanation:
            "UAT is acceptance against what was agreed, performed by non-technical users. Scenarios phrased as their real tasks, traced to the criteria, make the sign-off meaningful.",
        },
        {
          id: "pmp-a10-qa-vs-uat-q6",
          prompt:
            "During UAT the client reports: \"Dispatchers can't delete completed jobs, that's a bug.\" The signed requirement says completed jobs are locked for audit. What is it?",
          options: [
            "A clarification: it works as agreed, so you explain the requirement and where it was signed",
            "A high-severity bug to fix before sign-off",
            "A QA failure that must be logged as defect leakage",
            "A blocker that stops UAT",
          ],
          correctIndex: 0,
          explanation:
            "Behaviour that matches the signed requirement is not a defect. If the client now wants deletion, that becomes a change request, not a free fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a10-qa-vs-uat-q7",
          prompt: "Which situation is the clearest sign of defect leakage from QA into UAT?",
          options: [
            "The client finds that the login fails for one of the user roles listed in the acceptance criteria",
            "The client asks for a new export format",
            "The client asks how to reset a password",
            "The client prefers a different shade of blue",
          ],
          correctIndex: 0,
          explanation:
            "A failure against a specified role should have been caught by QA. The other items are a CR, a clarification and a design preference.",
        },
        {
          id: "pmp-a10-qa-vs-uat-q8",
          prompt: "QA and the client are both using the staging environment, and builds keep changing under the client mid-test. What is the best fix?",
          options: [
            "Give UAT its own environment, or agree fixed deployment windows the client knows about",
            "Ask the client to retest everything after each deployment",
            "Stop QA until UAT ends",
            "Deploy to production instead so the client has a stable build",
          ],
          correctIndex: 0,
          explanation:
            "UAT needs a stable build. A separate UAT environment or announced deployment windows keep results valid without stopping QA.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a10-qa-vs-uat-q9",
          prompt: "Which should be ready before you hand a build to UAT? (Select all that apply.)",
          options: [
            "Test logins for each client role",
            "A list of known open lower-severity defects",
            "A feedback sheet or tool and how often it is triaged",
            "The production go-live announcement already sent",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Accounts, transparency about open defects and a feedback process make UAT efficient. Announcing go-live before UAT sign-off presumes the outcome.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "A Laravel and React field-service app for a facilities company is moving from QA to UAT. Put each activity or report where it belongs: Oyelabs' internal QA, the client's UAT, or neither (it is really a change request to triage).",
        categories: [
          { id: "qa", label: "Internal QA (Oyelabs)" },
          { id: "uat", label: "UAT (client)" },
          { id: "cr", label: "Neither: a change request to triage" },
        ],
        items: [
          { id: "i1", text: "Running 140 test cases against the user stories and logging defects with severity and priority.", explanation: "Verification of the build against the spec by the QA team: internal QA." },
          { id: "i2", text: "A regression run after the invoice VAT fix, before the build goes back to the client.", explanation: "Regression after a fix is Oyelabs' job, so the client never sees a fix that broke something else." },
          { id: "i3", text: "The client's finance manager runs month-end invoicing with realistic jobs and confirms it matches their process.", explanation: "A business user validating a real task: that is UAT." },
          { id: "i4", text: "Checking the app on the agreed list of devices and browsers.", explanation: "Compatibility coverage against the agreed matrix is part of internal QA." },
          { id: "i5", text: "The client sponsor signs the acceptance statement with two known issues listed.", explanation: "Written acceptance by the client is the end of UAT." },
          { id: "i6", text: "During UAT, the operations head asks for engineers to upload a video of each finished job.", explanation: "Video upload was never specified. It is new behaviour to triage as a change request, not a test result." },
          { id: "i7", text: "A smoke test after deploying the release candidate to the UAT environment.", explanation: "Confirming the deployment works before handing it over is Oyelabs' QA work." },
          { id: "i8", text: "Dispatchers try the 'reassign a job' scenario written in their own words and log what happened.", explanation: "Client users executing UAT scenarios: UAT." },
          { id: "i9", text: "The client asks for a new dashboard showing engineer utilisation by week.", explanation: "A brand-new report outside the scope: triage it as a change request, not as UAT feedback to fix." },
        ],
        answer: { i1: "qa", i2: "qa", i3: "uat", i4: "qa", i5: "uat", i6: "cr", i7: "qa", i8: "uat", i9: "cr" },
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Running UAT to a clean sign-off
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-a10-uat-signoff",
      moduleId: "pmp-a10",
      trackId: "pm",
      title: "Running UAT to a clean sign-off",
      summary: `[[term:uat|UAT]] is where a custom project is most likely to stall. The build works, but the client's users see it for real for the first time. Feedback arrives in bursts, from people who were not in [[term:discovery|discovery]], mixing real defects with new wishes. If the PM does not run UAT as a process, it quietly becomes a second requirements phase, the [[term:go-live|go-live]] date drifts, and the [[term:milestone|milestone]] tied to acceptance is never invoiced.

A clean UAT has four parts. A clear start: the scenarios, the window, the feedback format and the named approver agreed in writing. Disciplined triage: every item classified within a working day as a [[term:bug|bug]] (with [[term:severity|severity]] and [[term:priority|priority]]), a [[term:change-request|change request]] or a [[term:clarification|clarification]], and shared with the client. Agreed exit criteria: for example, no open critical or high defects, everything else listed as [[term:known-issues|known issues]] with a plan. And a written [[term:sign-off|sign-off]] on the UAT sign-off template, from the person the contract names.

The hard part is the conversation, not the spreadsheet. The client who says "fourteen issues, we cannot sign" is usually worried about one or two of them. Triage together, fix what is a defect, price what is new, and agree what "done" means before arguing about the list.

The common mistake is accepting the whole list to keep the client happy. Five new requests become free work, the date slips anyway, and the next project starts with the same expectation. Not legal advice: the signed contract always wins on acceptance periods and what counts as acceptance.`,
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        {
          label: "Microsoft Learn (Dynamics 365 implementation guide): Test your solution before deployment",
          url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy",
          kind: "docs",
          verifiedAt: "2026-10-02T11:54:54Z",
        },
        {
          label: "Microsoft Learn (Dynamics 365 implementation guide): Go-live checklist",
          url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-checklist",
          kind: "docs",
          verifiedAt: "2026-10-02T12:00:59Z",
        },
        {
          label: "Atlassian: Acceptance criteria - definition, examples and tips",
          url: "https://www.atlassian.com/work-management/project-management/acceptance-criteria",
          kind: "article",
          verifiedAt: "2026-10-02T11:54:23Z",
        },
        {
          label: "TechTarget: What is user acceptance testing (UAT)?",
          url: "https://www.techtarget.com/it-infrastructure/definition/What-is-user-acceptance-testing-UAT",
          kind: "article",
          verifiedAt: "2026-10-02T11:55:42Z",
        },
      ],
      video: {
        title: "How to get #UserAcceptanceTesting (UAT) Sign-offs easily",
        channel: "Business Analyst & Scrum Master In-Demand",
        url: "https://www.youtube.com/watch?v=lTRoxp4nGdo",
        videoId: "lTRoxp4nGdo",
        verifiedAt: "2026-10-02T12:17:11Z",
      },
      alternateVideos: [
        {
          title: "How to Plan Your UAT - User Acceptance Test Plans That Work! | Business Analyst Training",
          channel: "Karaleise ",
          url: "https://www.youtube.com/watch?v=AU8SV7091-s",
          videoId: "AU8SV7091-s",
          verifiedAt: "2026-10-02T12:17:11Z",
        },
      ],
      handbook: {
        stages: ["custom-qa-uat"],
        rules: ["uat-signoff-before-golive", "billing-bug-in-delivery", "cr-when-needed"],
        templates: ["uat-signoff"],
      },
      sections: [
        {
          heading: "Set UAT up so it can end",
          body: `Most UAT disputes are decided before UAT starts. Send a short UAT plan to the client [[term:spoc|SPOC]] and sponsor and get it confirmed in writing:

- **Scope:** the release, the build number and the scenarios to test, traced to the [[term:acceptance-criteria|acceptance criteria]].
- **Window:** start and end dates, with the client's testers named and booked. Use the dates in the signed plan; if you quote a length, label it typical.
- **Feedback format:** one shared sheet or tool, one item per row, with steps, expected result, actual result and a screenshot. No feedback by chat voice notes.
- **Triage rhythm:** who triages, how often, and how the client sees the result.
- **Exit criteria:** for example, all scenarios executed, no open critical or high defects, remaining items listed as known issues with a fix plan.
- **Approver:** the person who signs the UAT sign-off, as named in the contract or the kickoff [[term:raci|RACI]].

Check the contract for an acceptance period and what happens if the client does not respond. Do not promise or assume "deemed acceptance" unless the contract says so. Not legal advice: the signed contract always wins.`,
        },
        {
          heading: "Triage: the daily discipline",
          body: `Triage each new item within a working day, with the QA lead and, for anything unclear, the tech lead. Ask the questions from the decision tool:

1. **Does it work as specified and accepted?** If not, and it is in scope, it is a **bug**. Give it a severity (impact) and a priority (order of fixing) and plan the fix. Before go-live, a bug against the agreed spec is part of delivery; follow the Oyelabs billing rule in the handbook card below.
2. **Does it work as specified, but the client wants it different?** That is a **change request** (it changes agreed behaviour) or an enhancement. It does not block sign-off unless the client and Oyelabs agree to bring it in through a CR.
3. **Is it a question or a misunderstanding?** That is a **clarification**. Answer it and point to the requirement.

Share the triaged list with the client every day or two, not only at the end. When the client sees "9 bugs fixed, 3 in progress, 4 CRs proposed", the end of UAT stops being a surprise. Keep cosmetic issues honest: they are real bugs, usually low severity, and can be fixed or listed as known issues.`,
        },
        {
          heading: "What good looks like: a worked example",
          body: `A Laravel booking platform for a UK clinic chain enters a two-week UAT (as planned in the SOW). The operations manager is the SPOC; the COO signs acceptance.

- **Day 1:** 48 scenarios go out by role (reception, clinician, admin) with logins and a feedback sheet. The PM lists 6 open low-severity defects as already known.
- **Days 2–8:** 31 feedback rows arrive. Daily triage turns them into 12 bugs (1 high: a cancelled appointment still sends a reminder), 8 cosmetic issues, 7 change requests (for example, a waiting-list feature) and 4 clarifications. The PM shares the triaged sheet every second day, with the requirement reference for each clarification and a CR form for the waiting list.
- **Day 9:** the COO says "we cannot sign with 31 issues". The PM asks which matter most. It is the reminder bug and two report totals. Those are fixed and retested by day 11; a regression run passes.
- **Day 12:** the agreed exit criteria are met: no open critical or high defects. Five cosmetic items are listed as known issues for a patch two weeks after go-live. Two CRs are approved for phase 2.
- **Day 13:** the COO signs the UAT sign-off, listing the known issues and the deferred CRs. The acceptance milestone can now be invoiced under the contract.

Go-live was protected because the CRs never entered the bug list.`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **The client rejects UAT with a long list.** Do not accept or reject it whole. Thank them, propose a joint triage call, ask which items worry them most, and agree the exit criteria first. Then show the list as bugs by severity, cosmetic items and CRs.
- **New requests are hidden in the bug list.** Move each to a CR with a reference to the signed scope. Offer a path: a quick CR now, or the next phase. Never fix them silently "to get the sign-off".
- **UAT has no end date.** The client tests "when we have time" for weeks. Re-send the plan with a firm window, name what is blocked (go-live, the acceptance milestone), and escalate through the escalation levels if needed.
- **Sign-off comes from the wrong person.** A coordinator's "OK" in chat is not acceptance. Get the named approver to sign the UAT sign-off, or get written delegation.
- **A fix broke something else.** Always rerun regression on the final build before asking for sign-off, and tell the client which build they are signing.
- **The client signs "subject to" a long list.** Turn the conditions into known issues with dates, or into CRs, so the sign-off is unconditional for go-live.`,
        },
        {
          heading: "Your checklist",
          body: `1. UAT plan sent and confirmed: scope, build, window, testers, feedback format, exit criteria, approver.
2. Contract checked for acceptance period and what counts as acceptance.
3. Scenarios traced to the acceptance criteria; logins and data ready.
4. Feedback triaged within a working day: bug (severity and priority), CR or clarification.
5. Triaged list shared with the client at least every second day.
6. CRs written on the CR form and kept out of the sign-off criteria.
7. Agreed bugs fixed, retested and regression-tested on the final build.
8. Known issues listed with a fix plan and accepted by the client.
9. UAT sign-off signed by the named approver, with the build reference.
10. Minutes sent after the UAT review meeting, and the release plan updated.`,
        },
      ],
      sop: [
        {
          title: "UAT sign-off and acceptance at Oyelabs",
          prompt:
            "[Oyelabs SOP – admin to fill] Who at Oyelabs may agree UAT exit criteria with a client, whether Oyelabs contracts use an acceptance period or deemed acceptance and how the PM invokes it, where signed UAT sign-offs are stored, and who is told so the acceptance milestone is invoiced.",
        },
        {
          title: "Handling a UAT rejection",
          prompt:
            "[Oyelabs SOP – admin to fill] Who the PM informs internally when a client rejects UAT (delivery head, account manager), how quickly, and who joins the triage call with the client.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a10-uat-signoff-q1",
          prompt: "Which item is most important to agree in writing before UAT starts, to stop UAT turning into a second requirements phase?",
          options: [
            "The exit criteria, for example no open critical or high defects, with the rest listed as known issues",
            "The colour of the feedback spreadsheet",
            "The number of developers on the project",
            "The go-live press release",
          ],
          correctIndex: 0,
          explanation:
            "Exit criteria define when UAT is done. Without them, every new wish can be presented as a reason not to sign.",
        },
        {
          id: "pmp-a10-uat-signoff-q2",
          prompt:
            "The client sends a UAT rejection with 14 items: 3 real defects (one blocks invoicing), 6 cosmetic issues and 5 requests never in the acceptance criteria. What is the best first move?",
          options: [
            "Thank them, propose a joint triage, ask which items worry them most, and agree the sign-off criteria",
            "Agree to fix all 14 before sign-off to protect the relationship",
            "Reply that only 3 are bugs and the rest are their problem",
            "Push go-live regardless because UAT is a formality",
          ],
          correctIndex: 0,
          explanation:
            "Joint triage keeps you firm on scope without sounding defensive. Accepting all 14 gives away five CRs; dismissing 11 items damages trust; skipping sign-off breaks the go-live rule.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a10-uat-signoff-q3",
          prompt: "How should the 5 new requests from that list be handled? (Select all that apply.)",
          options: [
            "Write each as a change request with a reference to the signed scope",
            "Offer the client a path: a CR now, or a later phase",
            "Keep them out of the UAT exit criteria unless a CR brings them in",
            "Fix them quietly to get the sign-off faster",
            "Mark them as critical defects",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "New behaviour is a CR with its own estimate and approval. Fixing it silently sets a precedent of free work; labelling it critical misuses severity.",
        },
        {
          id: "pmp-a10-uat-signoff-q4",
          prompt: "The client's project coordinator writes \"looks good, go ahead\" in the chat. The contract names the COO as the acceptance approver. What do you do?",
          options: [
            "Thank them and send the UAT sign-off to the COO for signature, or ask for written delegation",
            "Treat the chat message as sign-off and go live",
            "Wait silently until the COO raises it",
            "Ask the coordinator to forge the COO's approval",
          ],
          correctIndex: 0,
          explanation:
            "Acceptance comes from the named approver. A chat message from someone else is useful but not sign-off, and it will not hold if a dispute starts after go-live.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a10-uat-signoff-q5",
          prompt: "Which belong on a well-written UAT sign-off? (Select all that apply.)",
          options: [
            "The release and build reference that was tested",
            "The open known issues the client accepts, with a fix plan",
            "Deferred items moved to a later release by agreement",
            "The developers' hourly rates",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The sign-off records what was accepted, what is knowingly open and what was deferred. Rates belong in commercial documents, not the acceptance record.",
        },
        {
          id: "pmp-a10-uat-signoff-q6",
          prompt: "UAT was meant to take two weeks. Four weeks later the client is still \"testing when we have time\". What is the strongest recovery?",
          options: [
            "Re-send the UAT plan with a firm window, show what is blocked (go-live and the acceptance milestone), and escalate through the agreed levels if needed",
            "Declare the build accepted because time has passed",
            "Start the next phase and hope UAT finishes on its own",
            "Stop all communication until the client finishes",
          ],
          correctIndex: 0,
          explanation:
            "Make the cost of delay visible and use the escalation path. Declaring acceptance yourself is only possible if the contract provides for it, and you should check that, not assume it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a10-uat-signoff-q7",
          prompt: "A low-severity cosmetic issue (a misaligned icon) is still open at the end of UAT. What is the usual clean way to handle it?",
          options: [
            "List it as a known issue on the sign-off with a fix plan, if the client accepts that",
            "Refuse sign-off until it is fixed, whatever the date",
            "Hide it from the client",
            "Reclassify it as a change request so it is billable",
          ],
          correctIndex: 0,
          explanation:
            "Known issues let the client accept a release knowingly. A cosmetic defect is still a defect against the design, so it is not a CR.",
        },
        {
          id: "pmp-a10-uat-signoff-q8",
          prompt: "Why rerun regression on the final build before asking for sign-off?",
          options: [
            "Late fixes can break things already accepted, and the client must sign for the build that will go live",
            "Because regression is the client's job",
            "Because it replaces UAT",
            "Because the contract always requires exactly three regression runs",
          ],
          correctIndex: 0,
          explanation:
            "The sign-off is for a specific build. Regression on that build protects both sides from accepting something different from what was tested.",
        },
        {
          id: "pmp-a10-uat-signoff-q9",
          prompt: "Which statement about UAT sign-off and the contract is correct?",
          options: [
            "Acceptance periods and whether silence counts as acceptance depend on the signed contract, so check it rather than assume",
            "Every agency contract includes deemed acceptance after five days",
            "UAT sign-off is optional if QA passed",
            "Sign-off can be given verbally by anyone on the client side",
          ],
          correctIndex: 0,
          explanation:
            "There is no universal rule; the contract decides. Follow the Oyelabs rule in the handbook and the signed contract, and never invent a deemed-acceptance clause.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a10-uat-signoff-q10",
          prompt: "Why share the triaged UAT list with the client every day or two rather than only at the end?",
          options: [
            "The client sees progress and the classifications as they happen, so the end of UAT holds no surprises",
            "Because the client must fix the bugs",
            "Because triage is only valid once the client approves each row",
            "To fill the weekly status report",
          ],
          correctIndex: 0,
          explanation:
            "Disagreements about bug versus CR are easier one item at a time than as a 30-row argument on the last day.",
        },
      ],
      practice: {
        kind: "roleplay",
        prompt:
          "UAT of a field-service scheduling web app has just ended. The client's Head of Digital has rejected it with 14 items: 3 real defects (one blocks invoicing), 6 cosmetic issues and 5 requests that were never in the acceptance criteria. Go-live is planned in two weeks.",
        scenarioId: "uat-rejection",
        personaId: "enterprise-stakeholder",
        maxTurns: 7,
        brief:
          "Take the quality concern seriously without being defensive. Propose triaging the list together: defects by severity, cosmetic items, and new requests as change requests. Ask which item worries him most. Agree sign-off criteria (for example no open critical or high defects, known issues listed), a fix-and-retest plan with dates and the effect on go-live. End with a clear next step and write the follow-up email.",
        rubric: STANDARD_RUBRIC,
        followUp: true,
      },
    },
  ],
} satisfies Module;
