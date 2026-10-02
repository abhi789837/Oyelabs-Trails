import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a12",
  trackId: "pm",
  name: "Custom lifecycle: Hypercare & warranty",
  description:
    "The weeks right after launch: running hypercare with a log, clear severities and an exit, and handling warranty claims fairly by telling real defects apart from support work, enhancements and change requests.",
  topics: [
    {
      id: "pmp-a12-hypercare",
      moduleId: "pmp-a12",
      trackId: "pm",
      title: "Running hypercare after go-live",
      summary:
        "[[term:hypercare]] is a short, deliberate period right after [[term:go-live]] when the team watches production closely and reacts faster than normal support would. Microsoft's implementation guidance describes it as a short period after go-live when you provide extra resources and attention. Real users always find things UAT did not: odd devices, real data volumes, unexpected workflows. How the agency behaves in these weeks shapes how the client remembers the whole project.\n\nRun it as a small operation, not as a chat thread. Agree the period, the channel, the people on call and the daily check-in before launch. Log every report in the hypercare log template with a classification, [[term:severity]], [[term:priority]], owner and times. Fix the urgent things quickly, but through the [[term:hotfix]] approval rule, not by a developer patching production at midnight. Review the log with the client at least weekly.\n\nThe common mistakes are an open-ended hypercare with no exit, and new requests slipping in as \"launch bugs\". Agree exit criteria up front (for example: no critical issues open, response targets met, the normal support team handling most issues without help) and classify every item, so a [[term:change-request]] does not hide in the hypercare log as free work.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Learn (Dynamics 365 implementation guide): Plan your support operations", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/transition-to-support-operations", kind: "docs", verifiedAt: "2026-10-02T12:00:59Z" },
        { label: "Microsoft Learn (Dynamics 365 implementation guide): Checklist for transitioning to support", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/transition-to-support-checklist", kind: "docs", verifiedAt: "2026-10-02T12:01:01Z" },
        { label: "GOV.UK Service Manual: How the live phase works", url: "https://www.gov.uk/service-manual/agile-delivery/how-the-live-phase-works", kind: "docs", verifiedAt: "2026-10-02T11:51:25Z" },
        { label: "Atlassian: Incident management - processes and best practices", url: "https://www.atlassian.com/incident-management", kind: "article", verifiedAt: "2026-10-02T11:53:46Z" },
      ],
      video: {
        title: "Planning Solutions Implementation: Part 9, Hypercare",
        channel: "PMsquare",
        url: "https://www.youtube.com/watch?v=SOIV3jKjQTE",
        videoId: "SOIV3jKjQTE",
        verifiedAt: "2026-10-02T12:17:13Z",
      },
      alternateVideos: [
        {
          title: "Why Post Go-Live Support Is So Important",
          channel: "DGTL Ventures",
          url: "https://www.youtube.com/watch?v=5w9ruMs93kQ",
          videoId: "5w9ruMs93kQ",
          verifiedAt: "2026-10-02T12:17:13Z",
        },
        {
          title: "Andrew Wingate | Post Go-Live Support & Stabilization | Mission: Implementation | Dynamics 365",
          channel: "Microsoft Dynamics 365 Community",
          url: "https://www.youtube.com/watch?v=fDPkPBTKxDU",
          videoId: "fDPkPBTKxDU",
          verifiedAt: "2026-10-02T12:17:13Z",
        },
      ],
      handbook: {
        stages: ["custom-hypercare"],
        rules: ["hotfix-approval", "warranty-coverage", "escalation-levels"],
        templates: ["hypercare-log"],
      },
      sections: [
        {
          heading: "Set it up before launch",
          body:
            "Hypercare that starts on launch morning is already late. Agree these in writing, usually in the go-live plan:\n\n- **Duration.** The period your contract or plan defines. As a typical industry value, hypercare often runs one to a few weeks; nobody sets a standard number, so use what was agreed.\n- **Channel.** One place to report: a ticket desk or a shared mailbox, not developers' personal chats.\n- **Severity definitions.** What makes an issue critical, high, medium or low, with examples from this product. Agree them now, so you are not arguing about them during an outage.\n- **Response targets.** Typical hypercare targets are tighter than normal support. Record [[term:response-time]] and [[term:resolution-time]] separately.\n- **People.** Who is on call, the backup, and the [[term:escalation-matrix]].\n- **Rhythm.** A daily 15-minute check-in for the first days, then less often.\n- **Exit criteria.** Microsoft's guidance suggests criteria-based exits, for example no critical issues, SLAs met, and the support team resolving most issues without help.",
        },
        {
          heading: "The daily loop",
          body:
            "1. **Watch.** The tech lead checks error rates, crash reports, failed payments and slow endpoints every morning. Many issues can be found before the client reports them.\n2. **Log.** Every report and every finding goes in the hypercare log: who reported it, when, what, the classification, severity and priority, owner, status, and the response and resolution times.\n3. **Classify.** A defect against accepted scope, a [[term:clarification]], an [[term:enhancement]] or a change request. Only defects are fixed under hypercare and [[term:warranty]] terms; the others follow their own paths.\n4. **Fix.** Critical issues go through the hotfix rule in the handbook card below: approved, tested and deployed with a note. Everything else goes in a planned patch release.\n5. **Tell.** A short daily note to the client SPOC: new items, fixed items, open items with owners.\n6. **Learn.** For anything critical, a short [[term:rca]] with what will stop it happening again.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A React Native delivery app with a Laravel backend for a grocery chain in the UAE.* Hypercare is two weeks, as agreed in the go-live plan.\n\n- **Day 1, 09:40.** The operations manager reports that drivers in one zone get no new-order notifications. Logged as HC-012, classified as a defect against accepted scope, severity high, priority P1. Responded in 30 minutes.\n- **Day 1, 13:40.** Root cause: a zone ID missing from a notification topic after a configuration change. The hotfix is approved by the tech lead and PM, tested on staging and deployed. Resolved in four hours, RCA shared next morning.\n- **Day 3.** The client asks for a \"quick\" new filter by delivery slot in the admin panel. Logged as HC-019, classified as an enhancement, moved to the backlog for an estimate. Not done for free under hypercare.\n- **Day 5.** Two \"bugs\" turn out to be how refunds were specified. Logged as clarifications, answered with the accepted story, and added to the admin FAQ.\n- **Day 14.** The PM reviews the log with the client: 31 items, no critical issues open, response targets met. Hypercare ends and the remaining two minor defects move into warranty handling.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **No exit criteria.** Hypercare never ends and the team stays on high alert. Recover: propose exit criteria now, review the log against them, and close formally in writing.\n- **Everything is called a bug.** The client sends new ideas as launch issues. Classify each one in the log and say which path it follows. Be kind and consistent.\n- **Fixes straight into production.** A developer patches a live issue at night with no test. Follow the hotfix rule; if it already happened, document it, test it after the fact, and agree how it will not happen again.\n- **Reports through five channels.** WhatsApp, email, calls, tickets. Redirect politely to the agreed channel and log anything that arrived elsewhere.\n- **Severity set by volume.** The loudest message gets top priority. Use the agreed definitions.\n- **No review with the client.** The client remembers the one bad day, not the 30 resolved items. Share the log weekly.",
        },
        {
          heading: "Your checklist",
          body:
            "- Hypercare period, channel, people and escalation matrix agreed before launch.\n- Severity definitions with product-specific examples, and response and resolution targets.\n- Hypercare log set up from the template, with classification on every row.\n- Daily monitoring by the tech lead; daily check-in at first.\n- Critical fixes only through the hotfix approval rule; RCA for each critical issue.\n- Non-defects routed: clarifications answered, enhancements and CRs to the backlog.\n- Weekly log review with the client.\n- Exit against agreed criteria, confirmed in writing; open items moved to warranty or support.",
        },
      ],
      sop: [
        {
          title: "Our hypercare set-up",
          prompt:
            "[Oyelabs SOP – admin to fill] Oyelabs' standard hypercare length per project type, the reporting channel and on-call arrangements, the default severity definitions and response targets, and who signs off the end of hypercare.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a12-hypercare-q1",
          prompt: "What best describes hypercare?",
          options: [
            "The warranty period",
            "A short period after go-live with extra attention and faster reactions, ending on agreed criteria",
            "An annual support contract",
            "The final UAT round",
          ],
          correctIndex: 1,
          explanation: "Hypercare is about attention and speed right after launch. Warranty is a contractual promise about defects; the two often overlap but are not the same thing.",
        },
        {
          id: "pmp-a12-hypercare-q2",
          prompt: "Which are good exit criteria for hypercare? (Select all that apply.)",
          options: [
            "No critical issues open",
            "Response and resolution targets met over the last period",
            "The normal support team resolves most issues without the project team",
            "The client has stopped sending messages",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Exit criteria should be measurable and agreed. Silence from the client is not a criterion.",
        },
        {
          id: "pmp-a12-hypercare-q3",
          prompt:
            "Day 3 of hypercare. The client writes: \"Launch bug: we need a filter by delivery slot in the admin orders list.\" The filter was never in the scope. What do you do?",
          options: [
            "Build it now: it is hypercare",
            "Log it, classify it as an enhancement or new feature, and route it to the backlog for an estimate, explaining why kindly",
            "Ignore it until hypercare ends",
            "Call it a warranty bug to keep the client happy",
          ],
          correctIndex: 1,
          explanation: "Hypercare speeds up the fixing of defects. It does not turn new requests into free work. Log everything; classify honestly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a12-hypercare-q4",
          prompt: "A critical issue is found at 23:00. A developer wants to patch production directly to save time. What should happen?",
          options: [
            "Let them: speed is everything in hypercare",
            "Follow the hotfix rule: approved, tested on staging, deployed with a note, then an RCA",
            "Wait until Monday",
            "Roll back the whole release",
          ],
          correctIndex: 1,
          explanation: "Untested production patches are a top cause of second incidents. The hotfix rule keeps speed and control together.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a12-hypercare-q5",
          prompt: "Why should response time and resolution time be logged separately?",
          options: [
            "They are the same thing",
            "Response shows how fast you acknowledged and started; resolution shows how fast it was fixed. SLAs usually set targets for both",
            "Only resolution time matters",
            "To make the log longer",
          ],
          correctIndex: 1,
          explanation: "A quick first response with a long resolution, or the opposite, tells a different story. Measure both.",
        },
        {
          id: "pmp-a12-hypercare-q6",
          prompt: "Which columns belong in the hypercare log? (Select all that apply.)",
          options: ["Classification", "Severity and priority", "Owner and status", "The developer's hourly rate", "Response and resolution times"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation: "The log is about issues and their handling, not about rates.",
        },
        {
          id: "pmp-a12-hypercare-q7",
          prompt: "The client reports issues through WhatsApp to two developers, by email to the PM and on calls. What is the fix?",
          options: [
            "Ask developers to keep their own notes",
            "Redirect every report politely to the agreed channel, and log anything that arrived elsewhere",
            "Block the client on WhatsApp",
            "Accept every channel; it is the client's choice",
          ],
          correctIndex: 1,
          explanation: "One channel makes tracking and SLAs possible. Redirect kindly and keep logging whatever slips through.",
        },
        {
          id: "pmp-a12-hypercare-q8",
          prompt: "Two reported \"bugs\" turn out to be refunds working exactly as the accepted story describes. How do you log them?",
          options: [
            "As warranty bugs",
            "As clarifications: answer with the accepted story and add it to the FAQ or KT notes",
            "As change requests",
            "Delete them from the log",
          ],
          correctIndex: 1,
          explanation: "Working as specified, with no change requested, is a clarification. Logging it still matters: it shows a training or documentation gap.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a12-hypercare-q9",
          prompt: "Why is it worth reviewing the hypercare log with the client before closing hypercare?",
          options: [
            "It is a legal requirement",
            "It shows what was found and fixed, confirms the exit criteria are met, and agrees where open items go",
            "To re-open UAT",
            "To negotiate a discount",
          ],
          correctIndex: 1,
          explanation: "Clients remember incidents more than resolutions. A log review gives them the full picture and ends hypercare clearly.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        prompt:
          "Log this report as a row of the hypercare log, using the agreed severity definitions in the context.",
        context:
          "**Project:** React Native delivery app with a Laravel backend for a grocery chain in the UAE. Day 2 of hypercare.\n\n**Agreed severity definitions:** Critical = the service is down or payments fail for everyone. High = a core flow fails for a group of users, with no workaround. Medium = a flow fails with a workaround. Low = cosmetic.\n**Priority:** P1 = fix now (hotfix), P2 = next patch, P3 = planned, P4 = when convenient.\n\n**Email from the client's operations manager, received 09:40:** \"Drivers in the Al Barsha zone have had no new-order notifications since this morning. Other zones are fine. Orders are piling up and we are calling drivers by phone.\"\n\n**PM's reply to the client, sent 10:10:** acknowledging and naming the owner.\n\n**Root cause (found by the backend developer):** the zone ID is missing from the notification topic after yesterday's configuration change. Notifications for this zone were part of the accepted scope.",
        templateId: "hypercare-log",
        fields: [
          { id: "classification", label: "Classification", input: "select", options: ["Bug under warranty", "Change request", "Enhancement", "Clarification"], required: true },
          { id: "severity", label: "Severity", input: "select", options: ["Critical", "High", "Medium", "Low"], required: true },
          { id: "priority", label: "Priority", input: "select", options: ["P1", "P2", "P3", "P4"], required: true },
          { id: "response", label: "Response time (minutes)", input: "number", required: true },
          { id: "description", label: "Description", input: "textarea", placeholder: "What, where, impact", required: true },
          { id: "next", label: "Next steps and owner", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "classification", expected: "Bug under warranty" },
          { fieldId: "severity", expected: "High" },
          { fieldId: "priority", expected: "P1" },
          { fieldId: "response", expected: 30 },
        ],
        rubric: [
          { label: "Clear description with impact", points: 2, description: "Names the zone, the symptom, since when, and the business impact (orders piling up, drivers called by phone)." },
          { label: "Correct fix path", points: 2, description: "A hotfix through the approval rule (tech lead and PM), tested on staging, with the client updated and an RCA afterwards; a named owner." },
        ],
        sampleAnswer: {
          classification: "Bug under warranty",
          severity: "High",
          priority: "P1",
          response: "30",
          description:
            "Drivers in the Al Barsha zone receive no new-order notifications since this morning; other zones fine. Orders piling up; the client is calling drivers by phone. Core flow fails for one group of users. Defect against accepted scope (zone notifications).",
          next: "Owner: backend developer. Add the missing zone ID to the notification topic, test on staging, deploy as a hotfix approved by the tech lead and PM. Update the client SPOC on deployment and share an RCA next morning, including a check for configuration changes.",
        },
      },
    },
    {
      id: "pmp-a12-warranty-claims",
      moduleId: "pmp-a12",
      trackId: "pm",
      title: "Handling warranty claims",
      summary:
        "A [[term:warranty]] is a contractual promise that the delivered work conforms to what was agreed, for a defined period. In software service contracts it usually means: defects against the accepted scope and [[term:acceptance-criteria]], reported inside the warranty window, are fixed without extra charge. It is not a promise that the software will do everything the client later wishes it did.\n\nEvery post-launch request therefore needs one honest question first: does it fail to do what was specified and accepted? If yes, and it is inside the window your SOW defines, it is a warranty [[term:bug]]. If the window has passed, the same bug becomes [[term:support]] work, under an [[term:amc]] or quoted. If it works as agreed, it is not a warranty claim at all: it is a [[term:clarification]], an [[term:enhancement]], a [[term:change-request]] or a [[term:new-feature]]. The decision tool below walks the same questions.\n\nThe common mistake runs both ways. Some PMs say yes to everything to keep the client happy, and quietly give away weeks of work. Others say no to real defects to protect margin, and lose the client's trust. The fix is evidence: the signed scope, the accepted stories, the UAT sign-off and the known-issues list. Warranty lengths vary widely between contracts, and typical industry values are not a guide to yours, so always read the clause. Not legal advice: the signed contract always wins.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "GOV.UK: Model Services Contract (UK government template contract)", url: "https://www.gov.uk/government/collections/model-services-contract", kind: "spec", verifiedAt: "2026-10-02T11:51:28Z" },
        { label: "Cornell LII Wex: warranty", url: "https://www.law.cornell.edu/wex/warranty", kind: "article", verifiedAt: "2026-10-02T11:51:33Z" },
        { label: "Microsoft Learn: Define, capture, triage and manage bugs (Azure Boards)", url: "https://learn.microsoft.com/en-us/azure/devops/boards/backlogs/manage-bugs?view=azure-devops", kind: "docs", verifiedAt: "2026-10-02T11:54:32Z" },
        { label: "Investopedia: Warranty - definition, types and example", url: "https://www.investopedia.com/terms/w/warranty.asp", kind: "article", verifiedAt: "2026-10-02T12:05:17Z" },
      ],
      video: {
        title: "Warranties, Indemnities and Liability in IT Contracts: (3) Warranty Clauses in IT Contracts",
        channel: "Kemp IT Law",
        url: "https://www.youtube.com/watch?v=Jd0muYzi6yY",
        videoId: "Jd0muYzi6yY",
        verifiedAt: "2026-10-02T12:17:14Z",
      },
      alternateVideos: [
        {
          title: "Why Is the Warranty Clause Crucial in Technology Contracts",
          channel: "LawSikho Technology & AI Law",
          url: "https://www.youtube.com/watch?v=2hj20DB1BCk",
          videoId: "2hj20DB1BCk",
          verifiedAt: "2026-10-02T12:17:14Z",
        },
        {
          title: "What is a Software Warranty?",
          channel: "Attorney Thoughts",
          url: "https://www.youtube.com/watch?v=KmeSSleTXtU",
          videoId: "KmeSSleTXtU",
          verifiedAt: "2026-10-02T12:17:14Z",
        },
      ],
      interactive: {
        kind: "decision-tool",
        request: "Four weeks after go-live, the client says the booking confirmation email shows the wrong clinic address for one branch.",
      },
      handbook: {
        stages: ["custom-hypercare"],
        rules: ["warranty-coverage", "billing-bug-warranty", "billing-bug-after-warranty", "billing-enhancement", "billing-change-request", "billing-clarification"],
        templates: ["hypercare-log", "cr-form"],
      },
      sections: [
        {
          heading: "Read the warranty clause before the first claim",
          body:
            "Before go-live, read the warranty clause in the SOW or MSA with BD and note five things in the project file:\n\n1. **When the window starts.** Go-live, UAT acceptance, or delivery of the final build. These can be weeks apart.\n2. **How long it lasts.** Whatever the contract says. Industry windows vary (30 to 90 days is a commonly quoted typical range), but no standard exists, so never quote a number from memory.\n3. **What it covers.** Usually defects against the accepted scope and acceptance criteria.\n4. **What it excludes.** Commonly: changes made by the client or a third party, hosting or third-party service failures, new OS or browser versions released after acceptance, misuse, and anything listed as a known issue at sign-off.\n5. **What the response looks like.** Response and resolution targets, if any, and how claims must be reported.\n\nNot legal advice: the signed contract always wins. When the clause is unclear, ask BD before you answer the client.",
        },
        {
          heading: "The test: three questions, in order",
          body:
            "Walk every claim through the same questions. The decision tool above asks exactly these.\n\n1. **Does it work as specified and accepted?** Find the user story, the acceptance criteria, the design or the UAT script. If the product matches them, it is not a defect, however much the client dislikes it.\n2. **If it does not work: was the behaviour in scope?** A failure against something never specified is not a bug in the contractual sense. It is new work.\n3. **If it is an in-scope defect: is it inside the window?** Inside: a warranty bug. Outside: a bug handled as support, under an active plan or quoted.\n\nIf it does work as specified, ask what the request does: change agreed behaviour (a change request), improve something that works (an enhancement), add something new (a new feature), or ask how it works (a clarification).\n\nThe billing treatment for each answer is in the rule cards below. Follow the Oyelabs rule in the handbook card below, not your instinct on the day.",
        },
        {
          heading: "Grey areas and how to handle them",
          body:
            "- **A new OS version breaks something.** The app met the spec when accepted; the platform changed. Commonly excluded from warranty and handled as adaptive maintenance under support. Check the exclusions.\n- **Third-party failure.** The payment provider or SMS gateway is down. Not a defect in the delivered work, but help the client diagnose it and escalate to the provider.\n- **Client edited the code or data.** If their team changed something and it broke, it is usually excluded. Show the evidence (commit history, audit log) calmly.\n- **Spec was silent.** Nobody specified behaviour for an edge case and the product does something unhelpful. Be pragmatic: a small fix may be worth doing as goodwill, logged as such. A large one is a change request. Agree goodwill with BD first.\n- **Reported in the window, fixed after it.** The report date usually counts. Record when each claim was received.\n- **Known issue at sign-off.** Treated as agreed at sign-off, not as a new claim.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A Laravel booking platform for a UK clinic chain.* The SOW's warranty window started at UAT acceptance. Week 5 after go-live, the client sends six items in one email, titled \"Warranty bugs\".\n\n1. The confirmation email shows the wrong address for the Leeds clinic. The accepted story says the email shows the booked branch's address. **Warranty bug**: fixed at no charge in the next patch.\n2. Patients cannot cancel within 24 hours of an appointment. The accepted criteria say cancellation closes 24 hours before. **Clarification**: replied with the story, added to the clinic FAQ.\n3. Make booking slots 15 minutes instead of the agreed 30. **Change request**: CR raised with impact and price.\n4. The admin dashboard takes four seconds to load. No performance criterion was agreed and it works. **Enhancement**: estimated and offered.\n5. Send reminders by WhatsApp. Never discussed. **New feature**: proposed for phase 2.\n6. The refund button errors on iOS only, a flow accepted in UAT. **Warranty bug**: severity high, fixed by hotfix.\n\nThe PM replies once, item by item, citing the evidence for each and attaching the CR form for item 3. The client accepts all six classifications, because each one points at a document they signed.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Saying yes to the whole list.** Weeks of unbilled work follow. If you already agreed, talk to BD now: honour what was promised, and classify every new item from today.\n- **Saying no without evidence.** \"That's not a bug\" with no reference sounds defensive. Always cite the story, the criteria or the sign-off.\n- **Arguing item by item on calls.** Classify in writing, in one reply, and use the call to discuss only the disputed items.\n- **Not recording the report date.** You cannot show a claim was outside the window. Log every claim with its received time.\n- **Goodwill without a record.** A free fix done quietly becomes an expectation. Log it as goodwill, agreed with BD, and say so to the client.\n- **Deciding the window from memory.** Read the clause. Not legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "- Warranty clause read with BD before go-live: start, length, coverage, exclusions, targets.\n- Every claim logged with its received date and time.\n- Each item walked through the three questions, with the evidence linked.\n- Classification and the billing rule applied per item, not per email.\n- One written reply, item by item, citing the story, criteria or sign-off.\n- CRs raised for changes, estimates for enhancements, phase-2 notes for new features.\n- Goodwill fixes agreed with BD and recorded as goodwill.\n- Unclear contract wording escalated to BD before answering.",
        },
      ],
      sop: [
        {
          title: "Our warranty claim reply",
          prompt:
            "[Oyelabs SOP – admin to fill] How Oyelabs replies to a batch of warranty claims (template wording), who must approve a goodwill fix, and where the warranty start date and clause summary are recorded for each project.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a12-warranty-claims-q1",
          prompt: "What does a software warranty usually cover?",
          options: [
            "Anything the client asks for after launch",
            "Defects against the accepted scope and acceptance criteria, reported inside the window the contract defines",
            "All hosting costs for a year",
            "New features requested during the window",
          ],
          correctIndex: 1,
          explanation: "Warranty is a promise that the work conforms to what was agreed. It is not a promise of new work. The contract defines the exact coverage.",
        },
        {
          id: "pmp-a12-warranty-claims-q2",
          prompt:
            "Inside the warranty window, the client reports that the refund button errors on iOS only. Refunds were accepted in UAT. What is it?",
          options: ["A change request", "A bug under warranty", "An enhancement", "A clarification"],
          correctIndex: 1,
          explanation: "It fails to do what was specified and accepted, and it is inside the window.",
        },
        {
          id: "pmp-a12-warranty-claims-q3",
          prompt:
            "Four months after go-live, with the warranty over and no support plan, the client finds that CSV exports drop rows above 10,000. The accepted criteria required full exports. What is it?",
          options: [
            "A warranty bug: it was always broken",
            "A bug handled as support: quoted as billable support work, or covered if they sign a plan",
            "A new feature",
            "A clarification",
          ],
          correctIndex: 1,
          explanation: "It is a real defect, but the window has passed. Follow the billing rule for bugs after warranty and check the contract wording.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a12-warranty-claims-q4",
          prompt:
            "The client calls a WhatsApp reminder integration a \"warranty item\" because \"every booking app has it\". It was never discussed. What is it?",
          options: ["A bug under warranty", "A new feature", "A clarification", "A known issue"],
          correctIndex: 1,
          explanation: "Brand-new functionality is new work, whatever other apps do. Propose it as a CR or a next phase.",
        },
        {
          id: "pmp-a12-warranty-claims-q5",
          prompt: "Which are commonly excluded from software warranties? (Select all that apply; always check your contract.)",
          options: [
            "Changes made by the client's own developers",
            "Failures of third-party services such as a payment provider",
            "A defect in an accepted flow, reported inside the window",
            "Breakage caused by an OS version released after acceptance",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "A defect in an accepted flow inside the window is the core of what warranty covers. The others are typical exclusions, but the signed contract decides.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a12-warranty-claims-q6",
          prompt: "The SOW says the warranty starts at UAT acceptance. UAT was signed six weeks before go-live. A client says, \"The warranty starts from launch, surely.\" What do you do?",
          options: [
            "Agree: launch is more intuitive",
            "Point to the clause, explain calmly, and involve BD if the client disputes it",
            "Ignore the question",
            "Extend the warranty to be nice, without telling anyone",
          ],
          correctIndex: 1,
          explanation: "The contract defines the start. Explain with the clause; disputes and any goodwill are BD's call. Not legal advice: the signed contract always wins.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a12-warranty-claims-q7",
          prompt: "The client sends one email with six \"warranty bugs\". What is the best way to respond?",
          options: [
            "Accept all six to keep the relationship",
            "Reject the whole email",
            "Classify each item separately with evidence, and reply once, item by item",
            "Discuss them one by one over several calls",
          ],
          correctIndex: 2,
          explanation: "Classification is per item, not per email. One written reply with references keeps it clear and fair.",
        },
        {
          id: "pmp-a12-warranty-claims-q8",
          prompt: "The spec never said what happens when two clinicians are booked into the same room. The product allows it. The client calls it a bug. What is a sensible approach?",
          options: [
            "Always a warranty bug",
            "Never anything: it was not specified",
            "Treat it as not a defect against scope; if the fix is small, consider goodwill agreed with BD and recorded as goodwill, otherwise raise a CR",
            "Ask the developer to decide",
          ],
          correctIndex: 2,
          explanation: "When the spec is silent, it is not a contractual defect, but pragmatism matters. Goodwill must be explicit and recorded, or it becomes an expectation.",
        },
        {
          id: "pmp-a12-warranty-claims-q9",
          prompt: "Why must the received date of every claim be logged?",
          options: [
            "For the developers' timesheets",
            "Because whether a claim is inside the window usually depends on when it was reported",
            "Because stores ask for it",
            "It is not needed",
          ],
          correctIndex: 1,
          explanation: "A claim reported on the last day of the window and fixed later is usually still a warranty claim. Without the date, you cannot show either way.",
        },
        {
          id: "pmp-a12-warranty-claims-q10",
          prompt: "Which evidence helps you classify a disputed claim? (Select all that apply.)",
          options: [
            "The signed SOW and accepted user stories",
            "The UAT sign-off and known-issues list",
            "The approved designs",
            "The developer's opinion of the client",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Classification rests on what was agreed and accepted. Opinions are not evidence.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "classify-request",
        prompt:
          "A Laravel booking platform for a UK clinic chain is live. The warranty window in the SOW is still open unless an item says otherwise. Classify each post-launch request.",
        categories: [
          { id: "bug-warranty", label: "Bug under warranty" },
          { id: "bug-support", label: "Bug after the warranty (support)" },
          { id: "enhancement", label: "Enhancement" },
          { id: "change-request", label: "Change request" },
          { id: "new-feature", label: "New feature" },
          { id: "clarification", label: "Clarification (no change)" },
        ],
        items: [
          {
            id: "w1",
            text: "The booking confirmation email shows the wrong address for the Leeds clinic. The accepted story says it shows the booked branch's address.",
            explanation: "Fails an accepted story, in scope, inside the window: a warranty bug.",
          },
          {
            id: "w2",
            text: "Four months after go-live, warranty over and no support plan: CSV exports drop rows above 10,000, although the accepted criteria required full exports.",
            explanation: "A real in-scope defect, but outside the window: handled as support (quoted, or under a plan if signed).",
          },
          {
            id: "w3",
            text: "Change booking slots from the agreed 30 minutes to 15 minutes.",
            explanation: "Works as agreed; the request changes agreed behaviour: a change request.",
          },
          {
            id: "w4",
            text: "The admin dashboard takes four seconds to load; please make it faster. No performance target was agreed and it works correctly.",
            explanation: "Works as specified; the request improves something that already works: an enhancement.",
          },
          {
            id: "w5",
            text: "Send appointment reminders by WhatsApp. It was never discussed.",
            explanation: "Brand-new functionality: a new feature.",
          },
          {
            id: "w6",
            text: "\"Bug: patients cannot cancel within 24 hours of an appointment.\" The accepted criteria say cancellation closes 24 hours before.",
            explanation: "Working exactly as specified; nothing new is asked for: a clarification.",
          },
          {
            id: "w7",
            text: "The refund button shows an error on iOS only. Refunds were accepted in UAT.",
            explanation: "An accepted flow fails, inside the window: a warranty bug.",
          },
          {
            id: "w8",
            text: "After the client's rebrand, change the brand colour and make the logo larger on the approved home screen design.",
            explanation: "Changes an approved, working design: a change request.",
          },
          {
            id: "w9",
            text: "Logged as a bug: there is no way to export invoices to Xero. Xero was never in scope.",
            explanation: "Not a defect against scope; it asks for something that does not exist: a new feature.",
          },
          {
            id: "w10",
            text: "\"How do I add a new clinician account?\" The admin guide covers it and the feature works.",
            explanation: "A question about working, agreed behaviour: a clarification.",
          },
          {
            id: "w11",
            text: "Seven months after go-live, the warranty over and an AMC active: the monthly invoice PDF shows the wrong VAT total, against the formula in the accepted spec.",
            explanation: "An in-scope defect outside the warranty window: support, covered by the active AMC.",
          },
          {
            id: "w12",
            text: "Slot search is slow since the client imported 200,000 historic patients. It returns correct results; no performance criterion was agreed.",
            explanation: "Correct behaviour; the request improves performance: an enhancement.",
          },
        ],
        answer: {
          w1: "bug-warranty",
          w2: "bug-support",
          w3: "change-request",
          w4: "enhancement",
          w5: "new-feature",
          w6: "clarification",
          w7: "bug-warranty",
          w8: "change-request",
          w9: "new-feature",
          w10: "clarification",
          w11: "bug-support",
          w12: "enhancement",
        },
      },
    },
  ],
} satisfies Module;
