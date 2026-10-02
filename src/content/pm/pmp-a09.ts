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
  id: "pmp-a09",
  trackId: "pm",
  name: "Scope control: CR, enhancement, bug",
  description:
    "The module that protects every fixed-bid project's margin and every client relationship: classifying each request as a bug, enhancement, change request, new feature or clarification, writing and pricing the CR, and replanning honestly once a change is approved.",
  topics: [
    // ---------------------------------------------------------------------------------------------
    // Classifying requests (intermediate)
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-a09-classifying-requests",
      moduleId: "pmp-a09",
      trackId: "pm",
      title: "Classifying requests: CR, enhancement or bug",
      summary: `Every week of a custom project, the client sends requests: in emails, in sprint demos, in WhatsApp messages and in UAT sheets. Each one is a [[term:bug]], an [[term:enhancement]], a [[term:change-request|change request]], a [[term:new-feature|new feature]] or a [[term:clarification]]. The label decides who pays, whether dates move and which process runs next. Getting it wrong in either direction hurts: call a CR a bug and Oyelabs builds unpriced work on a [[term:fixed-bid|fixed bid]]; call a real bug a CR and the client feels cheated.

Classify from evidence, not from the client's words. Clients say "bug" for anything they dislike and "small tweak" for anything they want. Your evidence is the signed [[term:sow|SOW]], the [[term:scope-baseline|scope baseline]], the [[term:acceptance-criteria|acceptance criteria]], the approved designs and the go-live date. Ask the same questions in the same order every time: does it work as specified and accepted? Is it in the signed scope? Is the product live, and inside the [[term:warranty]]? Does the request change agreed behaviour, improve something that already works, or ask for something new?

The PM owns the classification, with the tech lead and QA consulted. The billing treatment for each class comes from the Oyelabs rules in the handbook cards below; never improvise a price or a promise in the reply.

The common mistake is classifying on the phone. Say "Let me check it against the signed requirements and come back today", then answer in writing with the evidence.`,
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        {
          label: "Microsoft Learn: Define, capture, triage and manage bugs (Azure Boards)",
          url: "https://learn.microsoft.com/en-us/azure/devops/boards/backlogs/manage-bugs?view=azure-devops",
          kind: "docs",
          verifiedAt: "2026-10-02T11:54:32Z",
        },
        {
          label: "Atlassian Support (Jira): What are work types (epic, story, task, bug)",
          url: "https://support.atlassian.com/jira-cloud-administration/docs/what-are-issue-types/",
          kind: "docs",
          verifiedAt: "2026-10-02T11:54:29Z",
        },
        {
          label: "Atlassian: Scope creep in project management",
          url: "https://www.atlassian.com/work-management/project-management/scope-creep",
          kind: "article",
          verifiedAt: "2026-10-02T11:53:56Z",
        },
        {
          label: "TeamGantt: What is scope creep and how to avoid it",
          url: "https://www.teamgantt.com/project-management-guide/taming-scope-creep",
          kind: "article",
          verifiedAt: "2026-10-02T11:58:54Z",
        },
      ],
      video: {
        title: "Issue Tracking, Incident, Bug, Service Request, Change, Info, Feature, Ticket | Prof. Griesbauer",
        channel: "Prof Joe",
        url: "https://www.youtube.com/watch?v=eZmhXEEkDsE",
        videoId: "eZmhXEEkDsE",
        verifiedAt: "2026-10-02T12:17:09Z",
      },
      alternateVideos: [
        {
          title: "What's the Difference? Variations, Scope Creep, and Gold-plating",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=FtdpduGS8yc",
          videoId: "FtdpduGS8yc",
          verifiedAt: "2026-10-02T12:17:09Z",
        },
        {
          title: "How to HANDLE CHANGES in User Stories, Requirements & Scope during THE SPRINT",
          channel: "Agile Coach",
          url: "https://www.youtube.com/watch?v=RfVA81R_7eU",
          videoId: "RfVA81R_7eU",
          verifiedAt: "2026-10-02T12:17:09Z",
        },
      ],
      handbook: {
        stages: ["custom-scope-control"],
        rules: [
          "cr-when-needed",
          "billing-bug-in-delivery",
          "billing-bug-warranty",
          "billing-bug-after-warranty",
          "billing-enhancement",
          "billing-change-request",
          "billing-new-feature",
          "billing-clarification",
        ],
        templates: ["cr-form"],
      },
      interactive: {
        kind: "decision-tool",
        request:
          "We went live three weeks ago. The bookings export only gives us the current month, and we need all bookings since launch for our accountant. That's a bug, please fix it under warranty.",
      },
      sections: [
        {
          heading: "The five questions, always in this order",
          body: `Use the decision tool above until the order is automatic. The order matters, because the first answer removes most of the wrong labels.

1. **Does it work as specified and accepted?** If the product does what the signed requirement says, it is not a bug, however much the client dislikes it.
2. **Is it in the signed scope or acceptance criteria?** If the product misbehaves but the behaviour was never specified, it is still not a bug. "Any decent app does this" is not a requirement.
3. **Is the product live, and inside the warranty window?** This only matters for real bugs. Before [[term:go-live|go-live]] it is a delivery bug; after go-live it is a [[term:warranty]] bug or, once the window has passed, [[term:support]] work.
4. **Does it change agreed behaviour, or improve something that already works?** Changing what was agreed (a rule, a flow, an approved design) is a [[term:change-request|change request]]. Improving what already works, without changing the agreement, is an [[term:enhancement]].
5. **Is it brand-new functionality?** A whole new capability is a [[term:new-feature|new feature]]. If nothing new is asked and it was a misunderstanding, it is a [[term:clarification]].

Agencies differ on whether a small enhancement inside a fixed bid is free or billable. The SOW's own definitions decide, and so do the Oyelabs billing rules in the handbook cards below.`,
        },
        {
          heading: "The evidence you check before you answer",
          body: `Never classify from memory. Open these, in this order, and quote the one that decides:

- **The signed [[term:sow|SOW]] and its [[term:out-of-scope|out-of-scope]] list.** Exclusions written down end most arguments in one line.
- **The signed requirements: [[term:user-story|user stories]] and [[term:acceptance-criteria|acceptance criteria]].** "BK-4: the confirmation email shows the booked clinic's address" is evidence. "We discussed emails" is not.
- **The approved designs** and the [[term:design-approval|design approval]] record. A screen that matches the approved design is working as specified, even if the client now prefers another layout.
- **Requirement freeze and sign-off dates.** After [[term:requirement-freeze|requirement freeze]], changes go through change control.
- **The go-live date and the warranty terms** in the contract, for anything reported after launch.
- **Non-functional requirements.** If the SOW says "pages load in under three seconds" and checkout takes six, that is a bug, not an enhancement.

If the evidence is silent or ambiguous, say so honestly. Ambiguous requirements are a shared problem: agree the interpretation with the client and record it in the [[term:mom|minutes]], rather than winning the point by technicality.`,
        },
        {
          heading: "Grey zones that catch experienced PMs",
          body: `- **The bug that is really a CR.** "The export only covers this month" when the requirement says "export the current month". It works as specified, so asking for all-time data changes agreed behaviour.
- **The CR that is really a bug.** "Can you make checkout faster?" when the SOW has a performance target that checkout misses. It fails the specification, so it is a bug.
- **Warranty used as a lever.** Warranty covers defects against the accepted scope. A feature that was never specified does not become free because the product is inside the warranty window.
- **The client's own change.** Something broke because the client's team edited content, changed a server setting or a third-party API changed. Check the warranty exclusions in the Oyelabs rule before promising a free fix.
- **The design opinion.** A colour change after design approval is a change to an approved artifact, even if it takes ten minutes.
- **The question disguised as a complaint.** "Why can't two patients book the same slot?" when the requirement says one patient per slot is a clarification. Answer it, cite where it was agreed, and offer a CR if they now want it changed.`,
        },
        {
          heading: "Replying to the client",
          body: `A good classification reply has four parts and fits on a phone screen:

1. **Thank them and restate the request** in one line, so they know you understood.
2. **Give the label and the evidence:** "Story RP-3 in the signed requirements specifies a current-month export, which is what the app does today."
3. **Say what happens next**, using the billing treatment from the Oyelabs rule in the handbook card below, written as the rule states it. Never quote a figure the tech lead has not estimated or the account manager has not confirmed.
4. **Offer the path forward:** "I'll send a short change request with the effort and the impact on dates by Thursday."

Copy the [[term:spoc|SPOC]] and log the request and its label in the CR register or [[term:backlog|backlog]] the same day, even when the answer is "clarification". Patterns in the log are how you spot [[term:scope-creep|scope creep]] early.

Not legal advice: the signed contract always wins.`,
        },
        {
          heading: "Your checklist",
          body: `1. Acknowledge the request within the agreed response time; do not classify on the spot.
2. Open the SOW, the requirements and acceptance criteria, the approved designs and the go-live date.
3. Walk the five questions in order, or run the decision tool.
4. Ask the tech lead or QA to reproduce anything reported as broken.
5. Quote the evidence that decides the label.
6. Use the billing treatment from the Oyelabs rule card, never your own.
7. Log the request, the label and the evidence in the register or backlog.
8. For a CR, enhancement or new feature, promise a written CR with a date.`,
        },
      ],
      sop: [
        {
          title: "Where client requests are logged and labelled",
          prompt:
            "[Oyelabs SOP – admin to fill] The tool and board where every client request is logged (CR register, Jira, sheet), the labels and fields to use, who may change a label, and how quickly a PM must acknowledge and classify a request.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a09-classifying-requests-q1",
          prompt:
            "During UAT, the client reports that the booking confirmation email shows the wrong clinic address. Acceptance criterion BK-4 says it must show the booked clinic's address. What is it?",
          options: ["A bug found during delivery", "A change request", "An enhancement", "A clarification"],
          correctIndex: 0,
          explanation:
            "It does not do what the signed acceptance criterion says, it is in scope, and the product is not live yet. That makes it a delivery bug, fixed as part of the delivery. A CR would only apply if the client wanted different behaviour from BK-4.",
        },
        {
          id: "pmp-a09-classifying-requests-q2",
          prompt:
            "Three weeks after go-live, inside the warranty, the client writes: \"Bug: the bookings export only gives the current month. Fix it under warranty.\" Story RP-3 in the signed requirements specifies a current-month export. What is it?",
          options: [
            "A change request: the export works as specified, and they want the agreed behaviour changed",
            "A bug under warranty, because the client reported it inside the window",
            "A clarification, so no further action is needed",
            "A bug after warranty, billed as support",
          ],
          correctIndex: 0,
          explanation:
            "The first question is whether it works as specified, and it does. Being inside the warranty window does not turn a change to agreed behaviour into a defect. Reply with the RP-3 evidence and offer a CR.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a09-classifying-requests-q3",
          prompt: "Which question should you answer first when classifying any client request?",
          options: [
            "Does it work as specified and accepted?",
            "How long will it take to build?",
            "Is the product inside the warranty window?",
            "How important is this client to the account?",
          ],
          correctIndex: 0,
          explanation:
            "Whether it meets the specification decides between the bug family and everything else. Warranty only matters once you know it is a real bug, and effort or client importance never decide the label.",
        },
        {
          id: "pmp-a09-classifying-requests-q4",
          prompt: "Which of these do you check before you classify a request? (Select all that apply.)",
          options: [
            "The signed SOW and its out-of-scope list",
            "The signed user stories and acceptance criteria",
            "The approved designs and the design approval record",
            "The go-live date and the warranty terms",
            "How upset the client sounded on the call",
            "How quickly a developer thinks they could do it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "The label comes from the signed documents and the dates. The client's mood shapes how you reply, not the label, and a quick fix is still a CR if it changes agreed behaviour.",
        },
        {
          id: "pmp-a09-classifying-requests-q5",
          prompt:
            "A fitness-studio app is in its warranty period. The client says SMS reminders are missing and calls it a bug. SMS was never in the requirements or the sign-off. What do you tell them?",
          options: [
            "It is not a bug because it was never specified; it is new functionality, so you will send a CR with the effort and the dates",
            "It is a bug because the app is still inside the warranty window",
            "It is a bug because any modern booking app sends reminders",
            "It is a clarification, so you will just explain how email confirmations work",
          ],
          correctIndex: 0,
          explanation:
            "Warranty covers defects against the accepted scope, not features that were never specified. Treat it as new work with a CR, and offer a fast path, because the business problem (no-shows) is real.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a09-classifying-requests-q6",
          prompt: "What separates an enhancement from a change request in the decision tool?",
          options: [
            "An enhancement improves something that already works without changing what was agreed; a CR changes agreed behaviour",
            "An enhancement is always free and a CR is always billed",
            "An enhancement is under one day of work and a CR is more",
            "An enhancement comes from the client SPOC and a CR from the sponsor",
          ],
          correctIndex: 0,
          explanation:
            "The difference is about the agreement, not size or who asks. Billing for each comes from the Oyelabs rules; agencies differ on small enhancements, which is why the SOW and the rule card decide.",
        },
        {
          id: "pmp-a09-classifying-requests-q7",
          prompt:
            "A developer saw a client's \"small tweak\" in the shared channel and changed the button text in 20 minutes, before you classified it. It changes an approved design. What now?",
          options: [
            "Log it and classify it anyway, tell the client it was a change to an approved design, and agree internally how such items are recorded",
            "Say nothing: it was only 20 minutes",
            "Ask the developer to revert it immediately without telling anyone",
            "Bill the client for a full CR without telling them first",
          ],
          correctIndex: 0,
          explanation:
            "Unlogged changes become precedent: the next \"tweak\" arrives expecting the same. Logging it keeps the record honest, and the team learns that requests go through the PM first.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a09-classifying-requests-q8",
          prompt:
            "Eight months after go-live, past the warranty, the password reset link stops working after an iOS update. Password reset was in scope and accepted. The client has no support plan. What is the typical treatment?",
          options: [
            "A bug after the warranty: quoted and billed as support work, or covered by a plan if they take one",
            "A free warranty fix, because it is a defect",
            "A change request for a new password reset feature",
            "A clarification about how iOS updates work",
          ],
          correctIndex: 0,
          explanation:
            "It is a real defect against accepted scope, but outside the warranty window, so it falls to support. Typically that is covered by an active support or AMC plan or quoted; confirm the Oyelabs rule in the handbook card.",
        },
        {
          id: "pmp-a09-classifying-requests-q9",
          prompt:
            "A receptionist asks why the admin panel will not let her book two patients into the same slot. The signed requirements say one patient per slot. What is it, and what do you do?",
          options: [
            "A clarification: explain the agreed rule and where it is written, note it in the FAQ, and offer a CR if they now want it changed",
            "A bug: the admin panel should allow it",
            "An enhancement to add to the next sprint",
            "Nothing: internal staff questions do not need an answer",
          ],
          correctIndex: 0,
          explanation:
            "The product works as agreed and nothing new is asked yet. Explaining with the evidence closes it; if the business now wants double booking, that becomes a change request.",
        },
        {
          id: "pmp-a09-classifying-requests-q10",
          prompt:
            "The SOW's non-functional requirements say checkout completes in under three seconds. In UAT, checkout takes six seconds. The client asks you to \"enhance the speed\". What is it?",
          options: [
            "A bug: it fails a signed requirement, even though the client called it an enhancement",
            "An enhancement, because the client used that word",
            "A change request, because speed was not in the user stories",
            "A clarification about network speed",
          ],
          correctIndex: 0,
          explanation:
            "Non-functional requirements are part of the specification. Missing the agreed target is a defect, whatever the client calls it. Without that line in the SOW, faster checkout would be an enhancement.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "categorize",
        mode: "classify-request",
        prompt:
          "A Laravel and React Native booking platform for a chain of physiotherapy clinics in the UK. You have the signed SOW, the signed requirements with acceptance criteria and the approved designs. Each request says when it arrived. Put each one in the class the decision tool would give.",
        categories: [
          { id: "bug", label: "Bug (found during delivery)" },
          { id: "bug-warranty", label: "Bug under warranty" },
          { id: "bug-support", label: "Bug after the warranty (support)" },
          { id: "enhancement", label: "Enhancement" },
          { id: "change-request", label: "Change request" },
          { id: "new-feature", label: "New feature" },
          { id: "clarification", label: "Clarification (no change)" },
        ],
        items: [
          {
            id: "uat-address",
            text: "During UAT: \"The confirmation email shows the wrong clinic address.\" Acceptance criterion BK-4 says it must show the booked clinic's address.",
            explanation: "It does not work as specified, it is in scope (BK-4), and the product is not live yet: a bug found during delivery.",
          },
          {
            id: "push-android",
            text: "Sprint 6 demo: \"The appointment reminder push never arrives on my Android phone.\" Push reminders are acceptance criterion NT-2.",
            explanation: "Not working as specified, in scope (NT-2), not live yet: a delivery bug to fix within the sprint or release plan.",
          },
          {
            id: "applepay-pending",
            text: "Three weeks after go-live, inside the warranty: \"Patients paying with Apple Pay are charged but the booking stays pending.\" Apple Pay is in the signed scope.",
            explanation: "Not working as specified, in scope, live and inside the warranty window: a bug under warranty.",
          },
          {
            id: "reset-link",
            text: "Eight months after go-live, the warranty long over: \"Password reset links expire instantly since the last iOS update.\" Password reset was specified and accepted.",
            explanation: "Not working as specified and in scope, but live and past the warranty window: a bug after the warranty, handled as support.",
          },
          {
            id: "cancel-window",
            text: "Mid-sprint: \"Change the free cancellation window from 24 hours to 12 hours, and charge a fee after that.\" The 24-hour rule is in the signed requirements.",
            explanation: "It works as specified, and the request changes agreed behaviour (the 24-hour rule): a change request.",
          },
          {
            id: "csv-alltime",
            text: "In warranty: \"Bug: the bookings export only gives the current month. We need all bookings since launch.\" Story RP-3 specifies a current-month export.",
            explanation: "It works as specified (RP-3); asking for all-time data changes agreed behaviour, so it is a change request even though it was called a bug.",
          },
          {
            id: "brand-colour",
            text: "Two weeks after design approval: \"Our new brand guide is navy, not teal. Please change the app colours.\" The approved designs use teal.",
            explanation: "The app matches the approved designs; changing an approved artifact changes agreed behaviour: a change request.",
          },
          {
            id: "remember-clinic",
            text: "Sprint review: \"The clinic picker works fine, but could it remember the patient's last clinic so regulars save a tap?\"",
            explanation: "It works as agreed, and the request improves existing behaviour without changing the agreement: an enhancement.",
          },
          {
            id: "sortable-columns",
            text: "During delivery: \"The admin bookings table is exactly as agreed. Could the columns be sortable by clicking the header?\"",
            explanation: "It works as specified, and sorting improves something that already works: an enhancement.",
          },
          {
            id: "video-consult",
            text: "Steering call: \"We want video consultations with in-app calls for remote patients.\" Nothing like it is in the SOW or the app.",
            explanation: "Nothing is broken and nothing agreed changes; it asks for brand-new functionality: a new feature.",
          },
          {
            id: "arabic-bug",
            text: "After go-live: \"It's a bug that the app has no Arabic. Many of our patients need it.\" Arabic was never in the requirements.",
            explanation: "It was never specified, so it is not a bug. It asks for something that does not exist (a second language), which is brand-new functionality: a new feature.",
          },
          {
            id: "double-booking",
            text: "A receptionist asks: \"Why won't the admin panel let me book two patients into one slot? Is it broken?\" The requirements say one patient per slot.",
            explanation: "It works as specified and no change is asked yet; it is a question about agreed behaviour: a clarification.",
          },
        ],
        answer: {
          "uat-address": "bug",
          "push-android": "bug",
          "applepay-pending": "bug-warranty",
          "reset-link": "bug-support",
          "cancel-window": "change-request",
          "csv-alltime": "change-request",
          "brand-colour": "change-request",
          "remember-clinic": "enhancement",
          "sortable-columns": "enhancement",
          "video-consult": "new-feature",
          "arabic-bug": "new-feature",
          "double-booking": "clarification",
        },
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Writing and pricing CRs (advanced)
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-a09-writing-crs",
      moduleId: "pmp-a09",
      trackId: "pm",
      title: "Writing and pricing change requests",
      summary: `A [[term:change-request|change request]] is how a good idea from the client becomes paid, planned work instead of silent [[term:scope-creep|scope creep]]. On a [[term:fixed-bid|fixed bid]], the CR is Oyelabs' only protection against building more for the same price. On [[term:time-and-materials|time and materials]], it still matters: it tells the client what the change will cost them and what it does to the dates before they commit.

A strong CR is short and specific. It names the change against the [[term:scope-baseline|scope baseline]] ("replace the flat fee in SOW 3.4 with three distance zones"), explains why the client wants it, and states the impact on scope, effort, [[term:milestone|milestones]] and cost. It lists the [[term:assumption|assumptions]] and [[term:client-dependency|client dependencies]] that protect the new date, and it names the one person who can approve it.

The PM writes it. The tech lead estimates it. The BD lead or account manager confirms the price from the [[term:rate-card|rate card]] or the SOW's commercial terms. The client's named approver signs it before work starts. Follow the Oyelabs rules for CR approval and billing in the handbook cards below.

The common mistake is a vague CR sent late: "Delivery fee tweak, 3 days" after the developer has already started. The client cannot judge it, the team cannot plan it, and the invoice becomes an argument. Write the CR before anyone writes code.`,
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        {
          label: "PMI: Lexicon of Project Management Terms",
          url: "https://www.pmi.org/standards/lexicon",
          kind: "spec",
          verifiedAt: "2026-10-02T11:55:40Z",
        },
        {
          label: "APM: What is change control?",
          url: "https://www.apm.org.uk/resources/what-is-project-management/what-is-change-control/",
          kind: "article",
          verifiedAt: "2026-10-02T12:08:06Z",
        },
        {
          label: "Asana: Change control process - 5 steps and example",
          url: "https://asana.com/resources/change-control-process",
          kind: "article",
          verifiedAt: "2026-10-02T11:58:21Z",
        },
        {
          label: "ProjectManager: Change request form template",
          url: "https://www.projectmanager.com/templates/change-request-form",
          kind: "article",
          verifiedAt: "2026-10-02T11:56:49Z",
        },
      ],
      video: {
        title: "How to Manage the Change Control Process",
        channel: "Online PM Courses - Mike Clayton",
        url: "https://www.youtube.com/watch?v=pTtqmy6gD_M",
        videoId: "pTtqmy6gD_M",
        verifiedAt: "2026-10-02T12:17:10Z",
      },
      alternateVideos: [
        {
          title: "What is Change Control in Project Management?",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=N5bE0aYc2mo",
          videoId: "N5bE0aYc2mo",
          verifiedAt: "2026-10-02T12:17:10Z",
        },
        {
          title: "What is Change Control? Project Management in Under 5",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=7JU_G7loIvw",
          videoId: "7JU_G7loIvw",
          verifiedAt: "2026-10-02T12:17:10Z",
        },
      ],
      handbook: {
        stages: ["custom-scope-control"],
        rules: ["cr-when-needed", "cr-approval", "billing-change-request", "billing-enhancement", "billing-new-feature", "requirement-freeze-after-signoff"],
        templates: ["cr-form"],
      },
      sections: [
        {
          heading: "Anatomy of a CR the client can approve in one read",
          body: `Download the CR form from the handbook card below. Each section answers a question the approver will ask:

- **CR details:** the next number in the CR register, the date, who asked and through which channel. Numbering lets you say "CR-004" in every status report.
- **Description:** what changes, against which baseline line. Quote the [[term:sow|SOW]] section, [[term:user-story|story]] or design. "Replace the single flat delivery fee (SOW 3.4) with three distance zones, each with a fee set in admin."
- **Reason and business value:** in the client's words. It reminds the approver why they asked, which matters when they see the cost.
- **Classification:** [[term:change-request|change request]], [[term:enhancement]] or [[term:new-feature|new feature]], with one line of evidence.
- **Impact on scope:** every screen, app, integration and report touched, including QA and regression. Missing items here become free work later.
- **Effort:** by role (development, QA, PM), from the tech lead's estimate, never your guess.
- **Impact on timeline:** which [[term:milestone]] moves, from which date to which date, and why (the sprint is full, a dependency).
- **Cost and payment terms:** the pricing basis from the SOW or rate card and when it is invoiced, as confirmed by the account manager.
- **Assumptions and exclusions:** the [[term:client-dependency|client dependencies]] with dates, and what the CR does not include.
- **Risks:** anything that could move the estimate.
- **Approval:** the client's named approver and the Oyelabs signatory.`,
        },
        {
          heading: "Pricing and approval without improvising",
          body: `The PM does not invent prices, discounts or free items. The price comes from the tech lead's estimate and the commercial terms in the SOW or the [[term:rate-card|rate card]], and the BD lead or account manager confirms it. If you think a goodwill gesture is right, ask internally first; follow the Oyelabs rule on CR approval in the handbook card below.

On the client side, only the named approver can approve. A "go ahead" in a chat from the operations manager is not approval if the SOW names the COO. Send the CR to the approver, copy the [[term:spoc|SPOC]], and ask for a written yes: a signature, an email reply or an approval in the agreed tool.

Work starts after approval, not before. If the client is in a hurry, shorten the cycle instead of skipping it: a one-page CR the same day, a 15-minute walkthrough call, a clear deadline for the decision ("approval by Wednesday keeps it in sprint 8").

Small CRs still get written. Typically, small enhancements may be bundled into one CR, but nothing is invisible. A month of "tiny" unlogged changes is how a fixed bid loses its margin.

Not legal advice: the signed contract always wins.`,
        },
        {
          heading: "What good looks like: a worked example",
          body: `**The project.** A Laravel admin panel with React Native customer and rider apps for a restaurant group in Riyadh, on a fixed bid. Sprint 7 of 10. Milestone 4 (the UAT drop) is on 13 November.

**The request.** On 9 October, the operations manager emails: riders complain that the flat delivery fee loses money on long trips. She asks for distance-based fees in three zones, each set in admin, "a small tweak, with the next release".

**Classify.** SOW 3.4 says "a single flat delivery fee per restaurant". The product works as specified, and the request changes that agreed rule. It is a [[term:change-request|change request]].

**Acknowledge the same day.** "Thanks, Noura. The flat fee is what SOW 3.4 specifies, so this is a change to the agreed scope. I'll send a short CR with the effort, the effect on the UAT date and the cost by Friday."

**Estimate with the tech lead.** Distance via the maps API already in use, a zone table and admin screen, checkout and order summary in both apps, receipts, regression of payments. Development 5 days, QA 2 days, PM 0.5 day: 7.5 days. Sprint 7 is full, so milestone 4 moves one week, to 20 November. The client must confirm zone boundaries and fees by 20 October.

**Price.** The account manager confirms the pricing basis from the SOW's rate card annex and invoicing with milestone 4.

**Send.** CR-004 goes to the COO, the named approver in SOW section 9, with the operations manager copied. The PM offers a 15-minute walkthrough.

**After approval.** The CR register, [[term:backlog]], plan and next [[term:status-report|status report]] are updated the same day, and the team hears about it at the next planning.`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **The team started before approval.** Stop new work on it, tell the client honestly that work began early, and send the CR now. Do not hide the hours already spent; agree internally whether they are written off.
- **The CR was approved by the wrong person.** Thank them, and send it to the named approver for written confirmation before work continues. A wrong approval is a dispute waiting for the [[term:invoice|invoice]].
- **The CR missed a whole area,** for example the rider app. Issue a revised CR (CR-004 rev 2) with the delta before building the missed part. Absorbing it quietly teaches everyone that estimates are soft.
- **The client changes the CR after approval.** Treat the change as a new CR or a revision with its own impact. Do not let an approved CR become an open container.
- **The client pushes back on price.** Explain what the hours cover in plain words, keep the rate, and offer shape options: phase it, do the core first, or trade out [[term:backlog]] items of equal size.
- **The CR sat unanswered for two weeks.** The plan assumed a decision. Escalate through the agreed levels and record in the status report what the delay is doing to the dates.`,
        },
        {
          heading: "Your checklist",
          body: `1. Classify with evidence; quote the baseline line the CR changes.
2. Take the next CR number from the register.
3. Get the effort by role from the tech lead, including QA and regression.
4. Name the milestone that moves, with both dates.
5. Get the pricing basis and invoicing confirmed by the account manager.
6. List client dependencies with dates and say what happens if they are late.
7. Send it to the named approver, copy the SPOC, and offer a short walkthrough.
8. Start work only after written approval.
9. Update the register, backlog, plan and status report on approval.`,
        },
      ],
      sop: [
        {
          title: "CR numbering, register and sign-off channel",
          prompt:
            "[Oyelabs SOP – admin to fill] Where the CR register lives, the CR numbering format, which document or tool counts as written client approval (signature, email, portal), and where the signed CR is filed.",
        },
        {
          title: "Who confirms a CR price and goodwill items",
          prompt:
            "[Oyelabs SOP – admin to fill] Who confirms the price on a CR (BD, account manager, delivery head), whether a PM may ever offer a free or discounted change, the limit, who must approve it and how it is recorded.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a09-writing-crs-q1",
          prompt: "Which of these must a CR contain before it goes to the client? (Select all that apply.)",
          options: [
            "A description of the change that quotes the baseline line it changes",
            "The impact on effort, milestones and cost",
            "Assumptions and client dependencies with dates",
            "The name of the client's approver",
            "Each developer's salary",
            "A promise to start the work today",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "The approver needs what changes, what it does to time and cost, what it depends on, and who signs. Salaries are internal, and promising to start before approval defeats the purpose of the CR.",
        },
        {
          id: "pmp-a09-writing-crs-q2",
          prompt:
            "The SOW says CRs are approved in writing by the client's COO. The operations manager replies on WhatsApp: \"Looks good, go ahead!\" What do you do?",
          options: [
            "Thank her, and send the CR to the COO for written approval before work starts",
            "Start the work: she asked for the change, so her yes counts",
            "Start the work and get the COO's approval at the end of the sprint",
            "Ask the developer to decide whether it is approved",
          ],
          correctIndex: 0,
          explanation:
            "Only the named approver can approve. A chat message from someone else is not approval, and an invoice based on it is a dispute waiting to happen.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a09-writing-crs-q3",
          prompt: "The client says: \"Just start the change, we'll sign the CR later. We're in a hurry.\" What is the best response?",
          options: [
            "Shorten the cycle instead of skipping it: send a one-page CR today, offer a 15-minute walkthrough, and start on written approval",
            "Start now to show goodwill",
            "Refuse to discuss the change until the next steering committee",
            "Start now and add 20% to the price later for the risk",
          ],
          correctIndex: 0,
          explanation:
            "Speed is a fair need, and you can meet it without losing the written approval. Starting first leaves the price and scope open, and surprise surcharges damage trust.",
        },
        {
          id: "pmp-a09-writing-crs-q4",
          prompt: "Where does the price on a CR come from?",
          options: [
            "The tech lead's estimate and the commercial terms in the SOW or rate card, confirmed by the account manager or BD lead",
            "The PM's sense of what the client will accept",
            "Whatever the client offers to pay",
            "The developer's guess in the team chat",
          ],
          correctIndex: 0,
          explanation:
            "Pricing follows the estimate and the agreed commercial terms, and someone with commercial authority confirms it. A PM improvising prices creates inconsistent precedents across clients.",
        },
        {
          id: "pmp-a09-writing-crs-q5",
          prompt:
            "A CR is 7.5 days. Sprint 8 is full. The client wants it in the same release without moving the date. What do you put in front of them?",
          options: [
            "Options: move the milestone, swap out backlog items of equal size, or phase the change",
            "A promise that the team will do overtime",
            "A plan to shorten QA for the release",
            "Nothing: accept it and hope the sprint goes well",
          ],
          correctIndex: 0,
          explanation:
            "Scope, time and cost are linked. Showing the trade-offs lets the client choose; overtime and skipped QA hide the cost and usually return as bugs and burnout.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a09-writing-crs-q6",
          prompt: "Why should a CR list client dependencies with dates, such as \"zone boundaries and fees confirmed by 20 October\"?",
          options: [
            "It makes clear that the new date depends on the client's input, so a late input moves the date on the record",
            "It shifts all risk to the client",
            "Clients like long documents",
            "It replaces the need for a status report",
          ],
          correctIndex: 0,
          explanation:
            "A date with no stated dependencies is a promise Oyelabs keeps alone. Written dependencies make a later slip a shared, recorded fact rather than an argument.",
        },
        {
          id: "pmp-a09-writing-crs-q7",
          prompt: "Which CR description is written the way it should be?",
          options: [
            "\"Replace the single flat delivery fee (SOW 3.4) with three distance zones, each with a fee set in the admin panel\"",
            "\"Delivery fee tweak\"",
            "\"Client wants changes to fees, details to be discussed\"",
            "\"As discussed on the call\"",
          ],
          correctIndex: 0,
          explanation:
            "A good description says what changes and against which baseline line. Vague wording cannot be estimated, approved or tested.",
        },
        {
          id: "pmp-a09-writing-crs-q8",
          prompt:
            "Halfway through building an approved CR, the client asks to add a fourth zone and a surge fee at night. What do you do?",
          options: [
            "Treat it as a new CR or a revision with its own impact, and keep building the approved scope meanwhile",
            "Add it into the current CR because it is related",
            "Stop all work until the client decides everything",
            "Refuse, because the CR is already approved",
          ],
          correctIndex: 0,
          explanation:
            "An approved CR is a fixed piece of scope. New asks get their own estimate and approval, otherwise the CR becomes an open container and the price stops meaning anything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a09-writing-crs-q9",
          prompt: "The CR is approved. What do you update the same day? (Select all that apply.)",
          options: [
            "The CR register",
            "The backlog and the sprint or release plan",
            "The next status report, including the new milestone date",
            "The original signed SOW text, overwritten so it matches",
            "Nothing until the end of the sprint",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "An approved CR changes the baseline, so the register, plan and reports must show it. You never overwrite the signed SOW: the approved CR sits alongside it as the record of the change.",
        },
        {
          id: "pmp-a09-writing-crs-q10",
          prompt: "On a time-and-materials project, why write a CR at all?",
          options: [
            "It still tells the client what the change costs and does to the dates before they commit, and keeps the scope record clear",
            "It is not needed: on T&M everything is billed anyway",
            "Only to calculate the developer's bonus",
            "To avoid holding sprint reviews",
          ],
          correctIndex: 0,
          explanation:
            "On T&M the client carries the cost, so they deserve to see the impact before deciding. Skipping it leads to \"why is the bill so high?\" conversations at invoice time.",
        },
      ],
      practice: {
        kind: "form",
        variant: "cr",
        templateId: "cr-form",
        prompt:
          "Write CR-004 from the client's email, the SOW extract, the tech lead's note and the account manager's note. Fill every field as you would before sending it for approval. Do not invent a price: state the pricing basis.",
        context: `**Email from the client's operations manager, 9 October:**

> Hi! Riders keep complaining that the flat delivery fee loses us money on long trips. Can we switch to distance-based fees: 0–3 km, 3–7 km and 7 km+, each zone with its own fee set in admin? Small tweak hopefully, we'd love it in the next release. Thanks, Noura

**SOW v1.0, section 3.4 (signed):** "A single flat delivery fee per restaurant, set in the admin panel."

**SOW, section 9:** change requests are approved in writing by the client's COO. The CR register's last entry is CR-003.

**Tech lead note:** distance via the maps API we already use; zone table and admin screen; checkout and order summary in the customer and rider apps; receipts; payments regression. Dev 5 days, QA 2 days, PM 0.5 day. Sprint 7 is full, so milestone 4 (UAT drop, **13 November**) moves one week. Needs the client to confirm zone boundaries and fees by 20 October.

**Account manager:** price per the SOW rate card (Annex B); invoice with milestone 4.`,
        fields: [
          { id: "crId", label: "CR ID", input: "text", required: true },
          { id: "requestedBy", label: "Requested by (role, channel, date)", input: "text", required: true },
          { id: "description", label: "Description of the change", input: "textarea", required: true },
          { id: "reason", label: "Reason and business value", input: "textarea", required: true },
          {
            id: "classification",
            label: "Classification",
            input: "select",
            options: ["Change request", "Enhancement", "New feature", "Bug", "Clarification"],
            required: true,
          },
          { id: "scopeImpact", label: "Impact on scope", input: "textarea", required: true },
          { id: "effortDays", label: "Total effort (days)", input: "number", required: true },
          { id: "newMilestone", label: "New milestone 4 date", input: "date", required: true },
          { id: "cost", label: "Cost and payment terms", input: "textarea", required: true },
          { id: "assumptions", label: "Assumptions and exclusions", input: "textarea", required: true },
          {
            id: "approver",
            label: "Approver",
            input: "select",
            options: ["Operations manager", "COO", "Oyelabs account manager", "Oyelabs PM"],
            required: true,
          },
        ],
        checks: [
          { fieldId: "classification", expected: "Change request" },
          { fieldId: "effortDays", expected: 7.5 },
          { fieldId: "newMilestone", expected: "2026-11-20" },
          { fieldId: "approver", expected: "COO" },
        ],
        rubric: [
          {
            label: "Description references the baseline",
            points: 2,
            description: "States the change from the single flat fee (SOW 3.4) to three distance zones with fees set in admin, and justifies the CR classification with that reference.",
          },
          {
            label: "Impact is complete",
            points: 2,
            description: "Covers the zone table and admin screen, both apps' checkout and order summary, receipts and payments regression, effort split by role, and milestone 4 moving from 13 to 20 November.",
          },
          {
            label: "Assumptions protect the date",
            points: 1,
            description: "Names the zone boundaries and fees confirmed by the client by 20 October, and says the date moves if they are late; notes exclusions such as surge pricing.",
          },
          {
            label: "Commercials and approval are clear",
            points: 1,
            description: "Gives the rate-card basis (Annex B) and invoicing with milestone 4 without inventing a figure, and routes approval to the COO with the operations manager copied.",
          },
        ],
        sampleAnswer: {
          crId: "CR-004",
          requestedBy: "Operations manager (Noura), by email, 9 October",
          description:
            "Replace the single flat delivery fee per restaurant (SOW 3.4) with three distance zones (0–3 km, 3–7 km, 7 km+), each with its own fee set in the admin panel. The fee is calculated at checkout from the delivery distance.",
          reason: "Long-distance deliveries currently lose money for the client; zone fees align the fee with the rider's trip.",
          classification: "Change request",
          scopeImpact:
            "New zone table and admin screen; distance calculation via the existing maps API; checkout and order summary changes in the customer and rider apps; receipts; payments regression testing.",
          effortDays: "7.5",
          newMilestone: "2026-11-20",
          cost: "Priced per the SOW rate card (Annex B) for 7.5 days (dev 5, QA 2, PM 0.5); invoiced with milestone 4.",
          assumptions:
            "Client confirms zone boundaries and fees by 20 October; a later confirmation moves milestone 4 day for day. Excludes surge or time-based pricing and any change to restaurant commission.",
          approver: "COO",
        },
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Replanning (expert)
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-a09-replanning",
      moduleId: "pmp-a09",
      trackId: "pm",
      title: "Replanning and re-baselining after change",
      summary: `An approved [[term:change-request|change request]] is only half the job. The other half is the plan: the [[term:scope-baseline|scope baseline]], the [[term:milestone|milestones]], the [[term:milestone-billing|milestone invoices]] and the client's expectations all have to move together, in writing. A PM who approves CRs but never replans ends up three CRs later with the original date on every report and a team that cannot meet it.

Re-baselining means replacing the agreed plan with a new, approved one. Do it only after an approved change, or a formally agreed replan, never to make a slip disappear. Variance against the old baseline is information the client is entitled to. When your own team slips, report it against the baseline with an amber or red [[term:rag-status|RAG status]] and a recovery plan.

When a change does not fit, put the trade-off in front of the client: move the date, add capacity at a cost, swap out [[term:backlog]] items of equal size, or phase the change into [[term:phase-2|phase 2]]. A fixed date means flexible scope; a fixed scope means a flexible date. Pretending both are fixed is how agencies burn weekends and quality.

The hard part is the conversation. Clients push back on price and dates. Hold the [[term:rate-card|rate card]], explain the hours in plain words, and reshape the work rather than discounting the same scope.`,
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        {
          label: "Atlassian Team Playbook: Trade-off analysis",
          url: "https://www.atlassian.com/team-playbook/plays/trade-offs",
          kind: "docs",
          verifiedAt: "2026-10-02T11:53:24Z",
        },
        {
          label: "Microsoft Learn (Dynamics 365 implementation guide): Project governance",
          url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/project-governance",
          kind: "docs",
          verifiedAt: "2026-10-02T12:01:01Z",
        },
        {
          label: "ProjectManager: How to make a project baseline and why it matters",
          url: "https://www.projectmanager.com/blog/project-baseline",
          kind: "article",
          verifiedAt: "2026-10-02T11:56:52Z",
        },
        {
          label: "Construx (Steve McConnell): The Cone of Uncertainty",
          url: "https://www.construx.com/books/the-cone-of-uncertainty/",
          kind: "article",
          verifiedAt: "2026-10-02T11:52:12Z",
        },
      ],
      video: {
        title: "What Is Project Re-baselining And When Do You Do It? - The Project Manager Toolkit",
        channel: "The Project Manager Toolkit",
        url: "https://www.youtube.com/watch?v=y6Q5-saTSjA",
        videoId: "y6Q5-saTSjA",
        verifiedAt: "2026-10-02T12:17:10Z",
      },
      alternateVideos: [
        {
          title: "How Do Project Managers Re-baseline Schedules?",
          channel: "The Project Manager Toolkit",
          url: "https://www.youtube.com/watch?v=o7ugTmEtB4I",
          videoId: "o7ugTmEtB4I",
          verifiedAt: "2026-10-02T12:17:10Z",
        },
        {
          title: "MS Project Tutorial 6 Recovering a Schedule",
          channel: "Tom Stephenson",
          url: "https://www.youtube.com/watch?v=ENTWTIDYkfQ",
          videoId: "ENTWTIDYkfQ",
          verifiedAt: "2026-10-02T12:17:10Z",
        },
      ],
      handbook: {
        stages: ["custom-scope-control"],
        rules: ["cr-approval", "billing-change-request", "weekly-status-report", "escalation-levels"],
        templates: ["cr-form", "status-report-rag", "raid-log-template"],
      },
      sections: [
        {
          heading: "Baseline, variance and re-baseline",
          body: `Three words, three different things:

- **The baseline** is the approved plan: scope, milestone dates and cost, as signed or as last formally changed. It is versioned. "Baseline v1 (SOW)", "baseline v2 (after CR-004)".
- **Variance** is the gap between where you are and the baseline. It is reported, not hidden. "Milestone 4 is forecast five working days late against baseline v2."
- **A re-baseline** replaces the plan with a new approved version. It needs a reason (an approved CR, an agreed replan after a client dependency slipped) and the client's written agreement.

Keep every version. When a dispute comes six months later, "baseline v3, approved by the COO on 2 November" ends it.

Estimates for a change made mid-project are narrower than the estimates at proposal time, because the team now knows the codebase, but they are still estimates. For a large change, show a range or a confidence level, and say which unknowns could move it.`,
        },
        {
          heading: "The trade-off conversation",
          body: `When a change does not fit, give the client real options, each with its consequence, and let them choose. Typical levers:

1. **Move the date.** The CR's effort pushes the milestone. Simple, honest, and often fine if you raise it early.
2. **Add capacity.** Another developer for some sprints, at a cost, with a ramp-up and onboarding cost that is rarely zero.
3. **Swap scope.** Take out [[term:backlog]] items of equal or larger size. Write down exactly what leaves; it does not come back for free.
4. **Phase it.** Build a smaller first version now (an [[term:mvp|MVP]] of the change) and the rest in [[term:phase-2|phase 2]].
5. **Reshape the change.** Find the client's real need. A demo-ready version may be a fraction of the full feature.

Levers that are not options: silent overtime, shorter QA, and "we'll catch up later". They move the cost to the team and to [[term:uat|UAT]], where it costs more.

Record the decision in the [[term:mom|minutes]], update the [[term:raid-log|RAID log]] and send the new baseline for written approval.`,
        },
        {
          heading: "Hard case 1: death by small CRs",
          body: `Five CRs of one to three days each are approved over six weeks. Each one said "minor impact". The client still expects the original go-live, and the team is now three weeks behind.

**What went wrong:** each CR was assessed alone, and no CR stated its effect on the date. Nobody showed the running total.

**Recovery:**
- Add up the approved CR effort and show it against the baseline in the next [[term:status-report|status report]]: "Approved CRs since baseline v1: 11 days. Forecast go-live: 3 weeks later than v1."
- Propose baseline v2 that includes all approved CRs, with the options (date, swap, phase) for any you cannot absorb.
- From now on, every CR states its date impact, even when it is "none, because it replaces item X".

Prevention: keep a CR register column for "cumulative effort since last baseline" and show it in every report.`,
        },
        {
          heading: "Hard case 2: the fixed launch date",
          body: `The client approves a CR for a loyalty module but says the launch date is fixed: marketing has booked a campaign.

A fixed date means the scope must flex. Say it plainly: "If the date cannot move, we need to decide what moves instead." Then offer:

- a smaller loyalty version for launch (earn points only, redeem in phase 2);
- a swap of equal size from the remaining backlog, named item by item;
- extra capacity, if it can genuinely be productive in time, priced through the account manager.

If the client refuses every option and still wants everything by the date, do not agree. Record the decision needed in the [[term:raid-log|RAID log]] as an [[term:issue]], set the status to amber or red, and escalate through the agreed levels in the Oyelabs rule card below. A PM who quietly accepts an impossible plan has not avoided the conflict; they have postponed it to the week before launch.`,
        },
        {
          heading: "Hard case 3: the slip you want to hide",
          body: `A regression from your own team costs eight days. A CR is being approved this week that adds five days. It is tempting to bundle both into the new baseline as "the CR impact".

Do not. The client approves the CR's five days, not your eight. Report the CR impact and your own slip separately:

- "CR-006 adds 5 days, approved: milestone 5 moves from 4 to 11 December."
- "Separately, a regression in payments cost us 8 days. Our recovery plan brings back 3 of them; forecast milestone 5: 16 December, amber."

Clients forgive slips that are reported early and honestly. They do not forgive discovering later that a CR was used to cover one. Your credibility on the next CR depends on it.`,
        },
        {
          heading: "What good looks like: a worked example",
          body: `**The project.** An ordering app for a bakery with three outlets, live for two months under a [[term:retainer]]. The owner asks for Hindi and Marathi. The tech lead estimates 48 hours: a translation workflow, layouts checked in both scripts, admin text management and QA. The PM sends the CR at the rate card.

**The pushback.** The owner calls, upset: "It's just translating some words."

**The PM's moves:**
1. Acknowledges the surprise before defending the number.
2. Explains the hours in plain words: "Most of the time isn't typing translations. It's making every screen work with longer words, letting your staff edit menu text themselves, and testing checkout in both languages."
3. Asks what she needs first and by when. Answer: the menu and checkout in Hindi before a festival in five weeks.
4. Offers shapes, not a discount: Hindi first, menu and checkout only, with the owner supplying the translated text. The tech lead re-estimates the smaller scope.
5. Agrees a next step: a revised CR (rev 2) by tomorrow, with Marathi and the rest as a later CR.

**The replan.** The revised CR states its own hours, the festival date as a [[term:constraint]], the owner's translations as a [[term:client-dependency|client dependency]] with a date, and what happens to the date if they are late. On approval the PM updates the retainer plan and the next status report.`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **Re-baselining without approval.** You moved dates in the plan and the client never agreed. Send the change for written approval now, with the reason, and report variance against the last approved version until it is approved.
- **Discounting the same scope.** You cut the price to close the CR. Next time the client expects the same. If it happened, record it internally as a one-off with its approval, and reshape scope instead next time.
- **Replanning silently.** The plan changed but the team and the client found out from a board. Announce every new baseline: client SPOC and sponsor, the team, QA, and the account manager for invoicing.
- **Swapping vague scope.** "We'll drop some reports" comes back as a dispute. Name the exact items that leave, in the CR and the minutes.
- **Forgetting the money.** A moved milestone can move an invoice. Tell the account manager the same day, and check the contract's milestone and invoicing terms.

Not legal advice: the signed contract always wins.`,
        },
        {
          heading: "Your checklist",
          body: `1. Re-baseline only after an approved change or an agreed replan.
2. Keep every baseline version, with who approved it and when.
3. Report your own slips as variance, separately from CR impact.
4. Show cumulative CR effort since the last baseline in every report.
5. For a change that does not fit, offer date, capacity, swap, phase or reshape, each with its consequence.
6. Name exactly what leaves in any swap.
7. Escalate impossible plans instead of accepting them.
8. Tell the team, the client and the account manager about every new baseline the same day.`,
        },
      ],
      sop: [
        {
          title: "Who approves a new baseline internally",
          prompt:
            "[Oyelabs SOP – admin to fill] Who must approve a re-baseline at Oyelabs before it goes to the client (delivery head, account manager), where baseline versions are kept, and how a moved milestone is communicated to finance for invoicing.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a09-replanning-q1",
          prompt: "When is it right to re-baseline a project plan?",
          options: [
            "After an approved change or a formally agreed replan, with the client's written agreement",
            "Whenever the team falls behind, so the status can stay green",
            "At the start of every sprint",
            "Only at the end of the project",
          ],
          correctIndex: 0,
          explanation:
            "A baseline is an agreement. Changing it needs a reason and approval; re-baselining to hide a slip removes the information the client is entitled to.",
        },
        {
          id: "pmp-a09-replanning-q2",
          prompt:
            "Your team's regression cost eight days. A CR adding five days is being approved this week. A colleague suggests putting all 13 days into the new baseline as \"CR impact\". What do you do?",
          options: [
            "Report the CR's five days and your own eight-day slip separately, with a recovery plan for the slip",
            "Bundle them: the client will never notice",
            "Report only the CR and recover the eight days with weekend work",
            "Ask the client to approve 13 days of CR effort",
          ],
          correctIndex: 0,
          explanation:
            "The client approves the CR's impact, not your slip. Hiding a slip inside a CR destroys trust when it surfaces, and it always surfaces.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a09-replanning-q3",
          prompt: "A change does not fit the current plan. Which are real options to put in front of the client? (Select all that apply.)",
          options: [
            "Move the milestone date",
            "Add capacity at a cost",
            "Swap out backlog items of equal size, named one by one",
            "Phase the change, with a smaller first version now",
            "Shorten QA for the release",
            "Ask the team to absorb it with unplanned overtime",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Date, capacity, scope and phasing are honest levers with visible consequences. Cutting QA and silent overtime hide the cost and usually return as bugs and burnout.",
        },
        {
          id: "pmp-a09-replanning-q4",
          prompt: "Why should a large mid-project CR show a range or confidence level rather than a single exact number?",
          options: [
            "Estimates are narrower than at proposal time but still uncertain, and naming the unknowns helps the client decide",
            "Ranges let Oyelabs charge the top of the range regardless",
            "Clients prefer vague answers",
            "Single numbers are not allowed in a CR",
          ],
          correctIndex: 0,
          explanation:
            "The cone of uncertainty narrows as a project goes on but never closes. Saying what could move the estimate is more honest than false precision.",
        },
        {
          id: "pmp-a09-replanning-q5",
          prompt:
            "Five small CRs, each \"minor impact\", have been approved over six weeks. The team is now three weeks behind the original go-live, which the client still expects. What is the right recovery?",
          options: [
            "Show the cumulative CR effort against the baseline, and propose a new baseline with options for what cannot be absorbed",
            "Keep the original date and hope the team catches up",
            "Cancel the last two CRs without telling the client",
            "Blame the client for asking for too much",
          ],
          correctIndex: 0,
          explanation:
            "Each CR looked small alone. The fix is to make the total visible and replan formally; from then on, every CR states its date impact.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a09-replanning-q6",
          prompt: "After an approved CR, what does the new baseline cover?",
          options: [
            "Scope, milestone dates and cost, as a new version, with the old version kept",
            "Only the dates",
            "Only the cost",
            "Nothing: the CR document is enough on its own",
          ],
          correctIndex: 0,
          explanation:
            "Scope, time and cost move together. Keeping old versions lets you show exactly what changed, when and who approved it.",
        },
        {
          id: "pmp-a09-replanning-q7",
          prompt: "Who must hear about a new baseline the same day? (Select all that apply.)",
          options: [
            "The client SPOC and sponsor",
            "The development team and QA",
            "The account manager, because invoices may move",
            "Nobody until the next retrospective",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Everyone who plans, builds, tests or invoices against the dates needs the new version at once. A retrospective is for learning, not for announcing plan changes.",
        },
        {
          id: "pmp-a09-replanning-q8",
          prompt:
            "The client approves a CR but says the launch date cannot move because a campaign is booked. They also refuse to drop or phase anything. What do you do?",
          options: [
            "Do not accept an impossible plan: log it as an issue, set the status to amber or red, and escalate through the agreed levels",
            "Agree and ask the team to work weekends",
            "Agree, and plan to explain the delay the week before launch",
            "Start the CR and skip regression testing",
          ],
          correctIndex: 0,
          explanation:
            "A fixed date with fixed scope and fixed capacity does not add up. Escalating early is uncomfortable; announcing a missed launch a week out is far worse.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a09-replanning-q9",
          prompt:
            "To fit a 7.5-day CR, the client agrees to drop a 5-day reports item from the backlog. What else do you need to settle?",
          options: [
            "The remaining 2.5 days: move the date, swap more scope, or phase part of the CR",
            "Nothing: a swap always balances",
            "Only whether the reports item comes back for free later",
            "Whether the developer prefers reports or the CR",
          ],
          correctIndex: 0,
          explanation:
            "A swap must be equal in size or the remainder must be handled. Also record that the dropped item does not come back for free.",
        },
        {
          id: "pmp-a09-replanning-q10",
          prompt:
            "A client balks at a 48-hour CR for two new languages. Which response keeps both the rate card and the relationship?",
          options: [
            "Explain the hours plainly, ask what they need first and by when, and offer a smaller first scope (one language, key screens, client-supplied text)",
            "Halve the price for the same scope",
            "Insist on the full CR or nothing",
            "Do the work for free as goodwill",
          ],
          correctIndex: 0,
          explanation:
            "Reshaping the scope meets the real need at a fair price. Discounting the same scope sets a precedent, and refusing all options pushes the client away.",
        },
      ],
      practice: {
        kind: "roleplay",
        prompt:
          "You sent a change request for Hindi and Marathi language support to a bakery owner whose app is live under a retainer: 48 hours at the standard rate card. She has just replied, upset. Your job is to replan the change, not to discount it: find what she needs first and by when, reshape the work into a first phase that fits, and agree how the revised CR and plan reach her.",
        scenarioId: "cr-price-pushback",
        personaId: "small-business-owner",
        maxTurns: 6,
        brief:
          "Acknowledge her surprise first. Explain in plain words what the 48 hours cover. Keep the rate card instead of discounting the same scope. Ask what she needs first and by when, then offer reshaped options: one language first, menu and checkout only, or her supplying translations, each with its effect on the date. End with a clear next step, a revised CR with its own hours and date, and write the follow-up email.",
        rubric: STANDARD_RUBRIC,
        followUp: true,
      },
    },
  ],
} satisfies Module;
