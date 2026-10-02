import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-c02",
  trackId: "pm",
  name: "Terminology: Scope terms",
  description:
    "The words that decide whether work is free or billable: assumption vs dependency vs constraint, scope creep vs gold plating, change request vs enhancement vs bug vs new feature, and configuration vs customisation. Every comparison ends with the consequence for time and billing and the sentence to use with the client.",
  topics: [
    {
      id: "pmp-c02-assumption-dependency-constraint",
      moduleId: "pmp-c02",
      trackId: "pm",
      title: "Assumption vs dependency vs constraint",
      summary:
        "Three words that sit side by side in every SOW and RAID log, and that people swap freely. An [[term:assumption]] is something we believe but have not confirmed. A [[term:dependency]] is something the work waits on. A [[term:constraint]] is a fixed limit we already know is true.\n\nWhy it matters at an agency: each one protects the plan differently. A written assumption that proves false is typically a valid reason for a [[term:change-request]]. A late [[term:client-dependency]] moves dates, and if it is logged as it happens, the delay is visibly the client's. A constraint, such as a fixed launch date or a required tech stack, is not something to manage away: the plan must fit around it, which forces trade-offs between scope, time and cost.\n\nHow to do it: write each item in the right column of the [[term:raid-log]] from kickoff. Phrase assumptions so they can be tested (\"The client provides all product photos by 15 March\"). Give each dependency an owner and a date. List constraints once and refer back to them when scope requests arrive.\n\nThe common mistake: writing a constraint as an assumption (\"we assume the go-live date is 1 June\") or leaving assumptions unwritten. An unwritten assumption cannot be used to justify extra cost later.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Atlassian Team Playbook: Dependency mapping", url: "https://www.atlassian.com/team-playbook/plays/dependency-mapping", kind: "docs", verifiedAt: "2026-10-02T12:05:47Z" },
        { label: "Asana: Project constraints - 6 types to manage", url: "https://asana.com/resources/project-constraints", kind: "article", verifiedAt: "2026-10-02T11:58:50Z" },
        { label: "Asana: RAID log - risks, assumptions, issues and decisions", url: "https://asana.com/resources/raid-log", kind: "article", verifiedAt: "2026-10-02T11:57:18Z" },
      ],
      video: {
        title: "Project Management Concept #9: Assumptions vs Constraints",
        channel: "Belinda Goodrich, Speaker, Author, Educator",
        url: "https://www.youtube.com/watch?v=sru-hs5JjUg",
        videoId: "sru-hs5JjUg",
        verifiedAt: "2026-10-02T12:16:56Z",
      },
      alternateVideos: [
        {
          title: "What are Task Dependencies in Project Management?",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=KzOevm0uQQM",
          videoId: "KzOevm0uQQM",
          verifiedAt: "2026-10-02T12:17:21Z",
        },
      ],
      interactive: { kind: "flashcards", category: "scope" },
      handbook: { stages: ["custom-internal-kickoff"], templates: ["raid-log-template"] },
      sections: [
        {
          heading: "Assumption vs constraint: side by side",
          body:
            "**[[term:assumption]]**\n- Not yet confirmed. Could turn out false.\n- Written so it can be checked: who, what, by when.\n- If it breaks, the impact is handled through a [[term:change-request]].\n\n**[[term:constraint]]**\n- Known to be true now. The plan must fit around it.\n- Examples: a fixed launch date for a trade show, a budget cap, \"must run on the client's AWS account\".\n- A *new* constraint after signing, such as an earlier deadline, is usually a change.\n\n**Consequence for time and billing:** an assumption is your protection if something turns out differently. A constraint is a fixed point you trade scope against. Mislabel a constraint as an assumption and it looks negotiable when it is not.",
        },
        {
          heading: "Assumption vs dependency: side by side",
          body:
            "**[[term:assumption]]**\n- \"The payment gateway supports partial refunds.\" We believe it; nobody is waiting for anything.\n\n**[[term:dependency]]**\n- \"Refund screens cannot start until the client provides sandbox keys.\" Work is waiting on an input.\n- A [[term:client-dependency]] is one the client must provide.\n\n**Consequence:** a dependency has a date, so it can be late. A late client dependency typically moves the timeline, and contracts often allow extra cost for idle time, but only if it was logged when it happened. An assumption is checked, then either confirmed (delete it) or broken (raise a CR).",
        },
        {
          heading: "One sentence, three labels",
          body:
            "Take a white-label grocery app for a supermarket chain in Oman:\n\n- \"The client's existing loyalty API returns points in real time.\" **Assumption**: believed, not tested. Action: test it in discovery.\n- \"Store build cannot be submitted until the client's Apple Developer account is approved.\" **Dependency** (client-owned). Action: owner and date in the RAID log.\n- \"The app must launch before Ramadan.\" **Constraint**: fixed. Action: plan scope backwards from it.\n- \"Arabic must be fully right-to-left.\" **Constraint** (a requirement the design must meet), not an assumption.",
        },
        {
          heading: "How to say it to a client",
          body:
            "- \"Our estimate assumes your loyalty API returns points in real time. We will test that in week one; if it does not, I will come back with the options and their cost.\"\n- \"The store submission depends on your Apple account being approved. If it is not ready by the 10th, go-live moves by the same number of days.\"\n- \"Because the Ramadan date is fixed, if we add the referral feature, something of a similar size needs to move to phase 2.\"",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Assumptions only in the estimator's head.** Recover: add them to the SOW or a written scope note before sign-off; after that, they protect nothing.\n- **Vague assumptions** (\"the client will be responsive\"). Recover: rewrite with a measure (\"feedback within 2 business days\").\n- **Dependencies with no owner or date.** Recover: assign both at the next status call.\n- **Never closing assumptions.** Recover: review the list each sprint; confirm, retire or raise a CR.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Every assumption is written, testable and in the SOW or RAID log.\n2. Every dependency has an owner, a due date and its impact if late.\n3. Client dependencies that slip are recorded in writing the day they slip.\n4. Constraints are listed once and referred to when scope requests arrive.\n5. Broken assumptions go to a change request, not into silent extra effort.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c02-assumption-dependency-constraint-q1",
          prompt: "\"The client's in-house team will deliver the product API by 1 April, and our mobile screens need it.\" What is this?",
          options: ["A dependency", "An assumption", "A constraint", "A risk that has already happened"],
          correctIndex: 0,
          explanation: "Our work waits on something another party delivers: a dependency (a client dependency here). It may also carry a risk, but the item itself is a dependency.",
        },
        {
          id: "pmp-c02-assumption-dependency-constraint-q2",
          prompt: "\"We assume the go-live date of 1 June is fixed by the client's trade show.\" What is wrong with this line?",
          options: [
            "A known fixed date is a constraint, not an assumption",
            "Nothing, it is a good assumption",
            "It should be logged as a dependency",
            "Dates cannot appear in a RAID log",
          ],
          correctIndex: 0,
          explanation: "If the date is known and fixed, it is a constraint the plan must fit. Calling it an assumption suggests it may change.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c02-assumption-dependency-constraint-q3",
          prompt: "A written assumption in the SOW says the SMS provider supports Arabic. In sprint 2 it turns out it does not. What usually follows?",
          options: [
            "Assess the impact and raise a change request",
            "The team absorbs the work, because assumptions are the agency's risk",
            "Log it as a bug",
            "Ignore it until UAT",
          ],
          correctIndex: 0,
          explanation: "That is exactly what written assumptions are for: a broken one is typically a valid reason for a CR.",
        },
        {
          id: "pmp-c02-assumption-dependency-constraint-q4",
          prompt: "Which of these are constraints? (Select all that apply.)",
          options: [
            "The app must be hosted in the client's own AWS account",
            "The budget cannot exceed the approved amount",
            "The client will send brand assets within a week",
            "We believe the legacy database is clean",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Hosting location and a budget cap are fixed limits. Sending assets is a client dependency; believing the data is clean is an assumption.",
        },
        {
          id: "pmp-c02-assumption-dependency-constraint-q5",
          prompt: "The client sends the store account details two weeks late. Nothing was logged at the time. At go-live, the client blames Oyelabs for the delay. What is the main lesson?",
          options: [
            "Record late client dependencies in writing as they happen",
            "Never accept client dependencies",
            "Turn every dependency into an assumption",
            "Add two weeks of buffer to every plan",
          ],
          correctIndex: 0,
          explanation: "A late client dependency is only visible as the client's responsibility if it was recorded when it slipped.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c02-assumption-dependency-constraint-q6",
          prompt: "Which assumption is written best?",
          options: [
            "The client provides final copy for all 24 screens by 10 March",
            "The client will be cooperative",
            "Content will arrive in time",
            "Everything goes to plan",
          ],
          correctIndex: 0,
          explanation: "A good assumption is specific and testable: what, who and by when.",
        },
        {
          id: "pmp-c02-assumption-dependency-constraint-q7",
          prompt: "Six weeks into a fixed-bid project, the client moves go-live forward by a month. How should this be treated?",
          options: [
            "As a new constraint, which is usually a change with trade-offs to agree",
            "As an assumption to test",
            "As a dependency on the client",
            "As normal, absorbed by the team",
          ],
          correctIndex: 0,
          explanation: "A new constraint after signing changes the basis of the plan, so it is handled as a change, with scope, cost or quality trade-offs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c02-assumption-dependency-constraint-q8",
          prompt: "Which statements are true? (Select all that apply.)",
          options: [
            "An unwritten assumption cannot be used to justify extra cost later",
            "A dependency needs an owner and a date",
            "A constraint should be removed from the plan when it is inconvenient",
            "Assumptions should be reviewed and closed as they are confirmed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Constraints are fixed; the plan works around them. The other three are good practice.",
        },
      ],
      practice: {
        kind: "categorize",
        prompt: "These lines come from the draft RAID log of a React Native app for a fitness studio chain in Dubai. Put each one in the right column.",
        mode: "generic",
        categories: [
          { id: "assumption", label: "Assumption" },
          { id: "dependency", label: "Dependency" },
          { id: "constraint", label: "Constraint" },
        ],
        items: [
          { id: "i1", text: "The studio's booking system API supports creating class bookings.", explanation: "Believed but not yet tested: an assumption to confirm in discovery." },
          { id: "i2", text: "Payment screens cannot start until the client provides the gateway sandbox keys.", explanation: "Work waits on a client input: a dependency." },
          { id: "i3", text: "The app must launch before the studio's New Year campaign on 1 January.", explanation: "A fixed date the plan must meet: a constraint." },
          { id: "i4", text: "The client's members are mostly on recent iOS and Android versions.", explanation: "Believed, not measured: an assumption." },
          { id: "i5", text: "Total budget is capped at the approved amount in the SOW.", explanation: "A fixed limit: a constraint." },
          { id: "i6", text: "App Store submission needs the client's Apple Developer account to be approved.", explanation: "Submission waits on the client's account: a dependency." },
          { id: "i7", text: "Health data must be stored in the region required by local regulation.", explanation: "A regulatory limit: a constraint." },
          { id: "i8", text: "The design team's icon set must be ready before the onboarding screens are built.", explanation: "One task waits on another: a dependency." },
          { id: "i9", text: "Class schedules change at most once a day, so caching for an hour is acceptable.", explanation: "A belief the design relies on: an assumption to confirm with the client." },
        ],
        answer: { i1: "assumption", i2: "dependency", i3: "constraint", i4: "assumption", i5: "constraint", i6: "dependency", i7: "constraint", i8: "dependency", i9: "assumption" },
      },
    },
    {
      id: "pmp-c02-creep-goldplating",
      moduleId: "pmp-c02",
      trackId: "pm",
      title: "Scope creep vs gold plating",
      summary:
        "Both add work nobody is paying for, but they come from opposite directions. [[term:scope-creep]] comes from the client side: small requests accepted without changing time, cost or resources. [[term:gold-plating]] comes from our side: extras the team adds that the client never asked for.\n\nWhy it matters at an agency: on a [[term:fixed-bid]] project, both come straight out of margin. Creep is also a relationship problem, because each accepted favour becomes the new normal, and the first \"no\" feels like a change in attitude. Gold plating adds testing effort and risk, and it sets expectations the team then has to maintain in every later release.\n\nHow to do it: the cure for creep is change control, not refusal. Log every request, classify it as a [[term:change-request]], [[term:enhancement]], [[term:new-feature]], [[term:bug]] or [[term:clarification]], and let the client choose what to pay for or what to swap out. The cure for gold plating is a team habit: ideas go into the [[term:backlog]] as suggested enhancements and get shown to the client, not built quietly.\n\nThe common mistake: thinking a request is \"too small to log\". Creep is never one big request; it is twenty small ones.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "PMI: Lexicon of Project Management Terms", url: "https://www.pmi.org/standards/lexicon", kind: "spec", verifiedAt: "2026-10-02T11:55:40Z" },
        { label: "PMI Learning Library: Top five causes of scope creep", url: "https://www.pmi.org/learning/library/top-five-causes-scope-creep-6675", kind: "article", verifiedAt: "2026-10-02T12:01:33Z" },
        { label: "monday.com: How to avoid gold plating in project management", url: "https://monday.com/blog/project-management/gold-plating-project-management/", kind: "article", verifiedAt: "2026-10-02T12:01:32Z" },
      ],
      video: {
        title: "What is the Difference Between Scope Creep and Gold Plating? Scope Creep vs Gold Plating Explained!",
        channel: "projectcubicle",
        url: "https://www.youtube.com/watch?v=-1_fOHVftks",
        videoId: "-1_fOHVftks",
        verifiedAt: "2026-10-02T12:17:21Z",
      },
      alternateVideos: [
        {
          title: "What's the Difference? Variations, Scope Creep, and Gold-plating",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=FtdpduGS8yc",
          videoId: "FtdpduGS8yc",
          verifiedAt: "2026-10-02T12:17:09Z",
        },
      ],
      handbook: { stages: ["custom-scope-control"], rules: ["cr-when-needed", "requirement-freeze-after-signoff"], templates: ["cr-form"] },
      sections: [
        {
          heading: "Scope creep vs gold plating: side by side",
          body:
            "**[[term:scope-creep]]**\n- Source: the client (or their stakeholders), often through chat, demos and UAT.\n- Each item looks tiny; the total does not.\n- Fix: log and classify every ask, then use a [[term:change-request]] or a swap.\n\n**[[term:gold-plating]]**\n- Source: the team, trying to impress or \"doing it properly\".\n- Nobody asked; nobody agreed the value.\n- Fix: raise the idea as a suggested [[term:enhancement]] and let the client decide.\n\n**Consequence for time and billing:** both are unbilled effort. Creep also erodes your negotiating position, because accepted favours set a precedent. Gold plating also adds QA effort and new places for [[term:bug|bugs]], which you then fix for free during warranty.",
        },
        {
          heading: "Scope creep vs an approved change: side by side",
          body:
            "**Scope creep**\n- Accepted without changing time, cost or resources.\n- Not written down; the [[term:scope-baseline]] no longer matches reality.\n\n**An approved [[term:change-request]]**\n- Assessed for impact and approved in writing before work starts.\n- Updates the scope baseline, and often the dates and price.\n\n**Consequence:** the same feature can be either. What separates them is the paperwork, not the size. Follow the Oyelabs rule in the handbook card below on when a CR is needed and on requirement freeze.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A fixed-bid Laravel booking platform for a UK clinic chain, sprint 5 of 8.** The PM reviews the team chat and finds seven requests accepted informally over three sprints, plus one feature a developer added on his own.\n\n1. The PM lists all eight in one sheet, with an effort estimate from the tech lead.\n2. Each client request is classified with the decision tool: two are change requests, two enhancements, one new feature, one bug, one clarification.\n3. The developer's addition (an animated calendar transition nobody asked for) is labelled gold plating. It works, so the PM shows it in the demo as a suggestion; the client may keep it, but the team agrees not to add unrequested features again.\n4. The bug is fixed as normal delivery work. The clarification is answered by pointing to the signed PRD.\n5. The CRs, enhancements and new feature go to the client in one email with costs and a swap option: \"Keep the go-live date by moving the waiting list to phase 2, or add two weeks and the cost below.\"\n\nResult: the client chooses, the scope baseline is accurate again, and the next requests come through the PM.",
        },
        {
          heading: "How to say it to a client",
          body:
            "- \"Happy to look at that. So it doesn't slip through the cracks, I'll add it to our change list with the effort, and we can decide together whether it goes in now or in phase 2.\"\n- \"We've had several small additions this month. Together they're about six days of work, so I'd like to agree which ones we include and how.\"\n- \"The team had an idea for a nicer transition here. It isn't in scope, so it's your call whether you'd like it as an enhancement.\"",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Saying yes in the demo.** Recover: \"Noted, I'll come back with the impact\" is a complete answer. Then log it the same day.\n- **Refusing everything.** Change control is not \"no\"; it is \"yes, and here is what it costs\".\n- **Absorbing creep, then raising one huge CR at the end.** The client feels ambushed. Recover: from now on, report the change list weekly.\n- **Developers taking requests directly.** Recover: agree with the client that requests go through the PM or the change list.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Every client request, however small, is logged the day it arrives.\n2. Each is classified before anyone starts work.\n3. The change list is in the weekly status report.\n4. The team knows ideas go to the backlog as suggestions, not into the build.\n5. Requests reach developers only through the agreed channel.",
        },
      ],
      sop: [
        {
          title: "Where Oyelabs logs incoming requests",
          prompt: "[Oyelabs SOP – admin to fill] Which tool or sheet Oyelabs uses as the change list for each project, who may add to it, and how often it is shared with the client.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c02-creep-goldplating-q1",
          prompt: "A developer adds dark mode to the client's app because \"it only took a day\". Nobody asked for it. What is this?",
          options: ["Gold plating", "Scope creep", "A change request", "A clarification"],
          correctIndex: 0,
          explanation: "Extras added by the team without a request are gold plating. Creep comes from requests accepted without control.",
        },
        {
          id: "pmp-c02-creep-goldplating-q2",
          prompt: "Over four sprints, the client's marketing lead asked for nine small tweaks in Slack, and the team did them all without logging. What is this?",
          options: ["Scope creep", "Gold plating", "An approved change", "A dependency"],
          correctIndex: 0,
          explanation: "Client-side additions accepted without adjusting time, cost or resources are scope creep.",
        },
        {
          id: "pmp-c02-creep-goldplating-q3",
          prompt: "What turns a client's extra request into a controlled change rather than scope creep?",
          options: [
            "It is assessed for impact and approved in writing before work starts",
            "It is small enough to fit in one day",
            "The client asks politely",
            "The developer agrees to do it",
          ],
          correctIndex: 0,
          explanation: "Size does not matter; the change-control process does.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c02-creep-goldplating-q4",
          prompt: "What are typical consequences of gold plating? (Select all that apply.)",
          options: ["Unbilled effort", "Extra testing and new places for bugs", "Client expectations the team must keep meeting", "A guaranteed higher invoice"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Gold plating costs effort and risk and sets expectations, but nobody agreed to pay for it.",
        },
        {
          id: "pmp-c02-creep-goldplating-q5",
          prompt: "In a sprint demo the client says: \"Can we also export this to PDF?\" What is the best immediate reply?",
          options: [
            "\"Noted. I'll check the impact and come back with options.\"",
            "\"Sure, we'll have it by Friday.\"",
            "\"No, that's out of scope.\"",
            "\"That's a bug, we'll fix it.\"",
          ],
          correctIndex: 0,
          explanation: "Accepting on the spot creates creep; a flat no damages the relationship. Logging it and returning with impact keeps control.",
        },
        {
          id: "pmp-c02-creep-goldplating-q6",
          prompt: "A PM absorbed small requests for months, then sends one large CR at the end covering all of them. Why does this usually go badly?",
          options: [
            "The client feels ambushed, because the work was accepted without any cost signal at the time",
            "CRs cannot be raised after sprint 2",
            "Small requests can never be billed",
            "The client must approve CRs within 24 hours",
          ],
          correctIndex: 0,
          explanation: "Accepting work silently sets an expectation it was free. Surface changes as they arrive, not in one surprise.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c02-creep-goldplating-q7",
          prompt: "A developer has a good idea that is out of scope. What is the right path?",
          options: [
            "Log it as a suggested enhancement and let the client decide",
            "Build it quietly to impress the client",
            "Forget it, ideas are not the developer's job",
            "Build it and bill it without asking",
          ],
          correctIndex: 0,
          explanation: "Ideas are welcome, but the client decides on scope and cost. Building without agreement is gold plating.",
        },
        {
          id: "pmp-c02-creep-goldplating-q8",
          prompt: "Which practices prevent scope creep? (Select all that apply.)",
          options: [
            "Logging every request the day it arrives",
            "Sharing the change list in the weekly status report",
            "Routing client requests through the PM or change list",
            "Refusing every request after kickoff",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Change control prevents creep. Refusing everything is not change control and damages the relationship.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "categorize",
        prompt:
          "Scope creep clean-up. On a fixed-bid Laravel booking platform for a UK clinic chain (still in delivery, not live), these seven \"small\" asks were accepted in chat without being logged. Classify each one so it can be logged and handled properly. The signed PRD and the approved designs are the baseline.",
        mode: "classify-request",
        categories: [
          { id: "bug", label: "Bug (found during delivery)" },
          { id: "enhancement", label: "Enhancement" },
          { id: "change-request", label: "Change request" },
          { id: "new-feature", label: "New feature" },
          { id: "clarification", label: "Clarification (no change)" },
        ],
        items: [
          { id: "r1", text: "\"Can the Book now button be green?\" The approved design specifies blue, and it is built in blue.", explanation: "It works as approved, and the request changes an agreed design decision: change request." },
          { id: "r2", text: "\"Search should also match postcodes.\" Search by clinic name works exactly as specified.", explanation: "It improves something that already works as agreed: enhancement." },
          { id: "r3", text: "\"Add a waiting list for fully booked days.\" Nothing like it exists or was specified.", explanation: "Brand-new functionality: new feature, estimated as new work." },
          { id: "r4", text: "\"The date picker lets patients choose past dates.\" The acceptance criteria say past dates must be blocked.", explanation: "In scope and not working as specified, before go-live: a delivery bug, fixed as part of delivery." },
          { id: "r5", text: "\"Why are prices shown without VAT?\" The signed PRD says prices are shown excluding VAT.", explanation: "Works as agreed; the client needs the agreed behaviour explained: clarification." },
          { id: "r6", text: "\"Could the clinic list also sort by distance?\" The list works as specified, sorted by name.", explanation: "Improves working, agreed behaviour without reversing a decision: enhancement." },
          { id: "r7", text: "\"Switch login from email and password to phone OTP.\" Email login was agreed and works.", explanation: "Reverses an agreed behaviour: change request." },
        ],
        answer: { r1: "change-request", r2: "enhancement", r3: "new-feature", r4: "bug", r5: "clarification", r6: "enhancement", r7: "change-request" },
      },
    },
    {
      id: "pmp-c02-cr-enh-bug-feature",
      moduleId: "pmp-c02",
      trackId: "pm",
      title: "Change request vs enhancement vs bug vs new feature",
      summary:
        "This is the classification a PM makes most often, and the one with the most money attached. A [[term:bug]] means agreed behaviour does not work. An [[term:enhancement]] improves something that already works. A [[term:change-request]] changes something that was agreed. A [[term:new-feature]] adds something that never existed. And a [[term:clarification]] changes nothing at all.\n\nWhy it matters at an agency: the label decides who pays and whether the plan moves. Bugs during delivery and under [[term:warranty]] are typically fixed free. After warranty they fall under [[term:support]] or an [[term:amc]]. Enhancements, CRs and new features are typically estimated and billed, and CRs must be approved before work starts. Call a CR a bug and Oyelabs works for free; call a bug a CR and the client feels cheated.\n\nHow to do it: don't start from what the client called it. Start from the evidence: the signed scope, the [[term:acceptance-criteria]], the approved designs and the go-live date. Then walk the decision tool below: does it work as specified, is it in scope, is it live and inside warranty, does it change or improve agreed behaviour, or is it brand new?\n\nThe common mistake: deciding from the client's tone. An urgent, angry \"bug\" can still be a change request, and a polite \"small idea\" can be a real bug.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Microsoft Learn: Define, capture, triage and manage bugs (Azure Boards)", url: "https://learn.microsoft.com/en-us/azure/devops/boards/backlogs/manage-bugs?view=azure-devops", kind: "docs", verifiedAt: "2026-10-02T11:54:32Z" },
        { label: "Atlassian Support (Jira): What are work types (epic, story, task, bug)", url: "https://support.atlassian.com/jira-cloud-administration/docs/what-are-issue-types/", kind: "docs", verifiedAt: "2026-10-02T11:54:29Z" },
        { label: "Atlassian: Scope creep in project management", url: "https://www.atlassian.com/work-management/project-management/scope-creep", kind: "article", verifiedAt: "2026-10-02T11:53:56Z" },
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
      ],
      interactive: {
        kind: "decision-tool",
        request: "Three weeks after go-live, the client says the appointment reminder SMS should go out 48 hours before, not 24. The signed scope says 24 hours, and it works.",
      },
      handbook: {
        stages: ["custom-scope-control"],
        rules: ["billing-bug-in-delivery", "billing-bug-warranty", "billing-bug-after-warranty", "billing-enhancement", "billing-change-request", "billing-new-feature", "billing-clarification"],
        templates: ["cr-form"],
      },
      sections: [
        {
          heading: "Bug vs change request: side by side",
          body:
            "**[[term:bug]]**\n- The agreed behaviour does not work. Evidence: an acceptance criterion, the PRD, an approved design.\n- Fixed without changing scope. Typically free during delivery and [[term:warranty]].\n\n**[[term:change-request]]**\n- The agreed behaviour works, and the client now wants it different.\n- Assessed, priced and approved in writing before work starts; may move dates.\n\n**Consequence for time and billing:** this is the most disputed pair. The test is never \"is the client unhappy?\" but \"does it match what was agreed?\". If nothing was ever specified, it is not a bug, however inconvenient.",
        },
        {
          heading: "Enhancement vs change request: side by side",
          body:
            "**[[term:enhancement]]**\n- Improves something that works: faster, an extra filter, better wording.\n- Does not reverse an agreed decision. Often goes to the [[term:backlog]], estimated and prioritised; small ones may be bundled.\n\n**[[term:change-request]]**\n- Reverses or alters an agreed decision: a different flow, a different rule, a different design.\n- Needs formal approval because it changes the [[term:scope-baseline]].\n\n**Consequence:** both are typically billable, but a CR has more knock-on effects (redesign, re-testing, rework of what was built). Estimate CRs with rework and [[term:regression-test|regression testing]] included.",
        },
        {
          heading: "New feature vs enhancement: side by side",
          body:
            "**[[term:new-feature]]**\n- Something that does not exist: chat, a loyalty programme, a new user role.\n- Needs its own requirements, design, estimate and testing. Large ones become a [[term:phase-2]] or a new SOW.\n\n**[[term:enhancement]]**\n- Builds on an existing, working feature.\n\n**Consequence:** a new feature is priced as new work and is not covered by warranty or a typical AMC. Labelling it an enhancement undersells the effort and skips design and discovery it needs.",
        },
        {
          heading: "Bug: in delivery vs under warranty vs after warranty",
          body:
            "Same defect, three different moments:\n\n- **Before go-live** (QA, demos, UAT): a delivery bug. Fixed as part of delivering the agreed scope.\n- **Live, inside the warranty window:** a warranty bug. Fixed under the warranty terms, within the agreed [[term:response-time]] and [[term:resolution-time]].\n- **Live, after warranty:** handled under the client's [[term:support]] or [[term:amc]] plan, or quoted as billable support.\n\nFollow the Oyelabs billing rules in the handbook cards below; they say what Oyelabs has confirmed for each case.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A Laravel booking platform for a UK clinic chain, live for three weeks, inside the warranty window.** The client's operations lead sends one email with four items:\n\n1. \"Patients with an apostrophe in their surname can't book.\" Booking for any patient is in scope and fails. Live, in warranty. **Warranty bug.**\n2. \"Reminders should go 48 hours before, not 24.\" The signed scope says 24 and it works. **Change request.**\n3. \"Could the receptionist's appointment list remember the last filter?\" Works today; this improves it. **Enhancement.**\n4. \"Why can't patients book same-day after 4 pm?\" The PRD has a 4 pm same-day cut-off. **Clarification.**\n\nThe PM replies once, item by item: the bug is logged with severity and a fix date; the CR goes on the CR form with effort and impact; the enhancement is estimated for the backlog; the clarification quotes the PRD section. Each answer names the evidence, so the client can see the reasoning, not just the label.",
        },
        {
          heading: "How to say it to a client",
          body:
            "- Bug: \"You're right, that's not working as agreed. We've logged it as a priority fix under the warranty.\"\n- CR: \"It works as we agreed in the scope (24 hours). Changing it to 48 is a change request. I'll send the effort and cost today.\"\n- Enhancement: \"Good idea. It's an improvement to a working screen, so I'll estimate it and we can prioritise it.\"\n- Clarification: \"That's the 4 pm cut-off from section 3.2 of the PRD. If you'd like a different rule, I can raise it as a change.\"",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Taking the client's label.** Recover: always check the evidence first; reply with the classification and the reason.\n- **Classifying alone on a hard call.** Recover: check with the tech lead and, for billing, with your manager, before replying.\n- **Fixing a \"bug\" that was really a CR.** Recover: you can't bill retroactively. Note it as goodwill in the change list so it is visible.\n- **Starting a CR before written approval.** Recover: stop, get approval, and record the effort already spent.",
        },
      ],
      sop: [
        {
          title: "Who confirms a disputed classification",
          prompt: "[Oyelabs SOP – admin to fill] When the client disputes whether an item is a bug or a change request, who at Oyelabs makes the final call, and how it is recorded.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c02-cr-enh-bug-feature-q1",
          prompt: "During UAT, the client reports as a \"critical bug\" that the SMS reminder does not include the doctor's name. The signed SMS template has no doctor's name, and the SMS sends correctly. What is it?",
          options: ["A change request", "A bug found during delivery", "A clarification", "A warranty bug"],
          correctIndex: 0,
          explanation: "It works as agreed, and the client wants the agreed template changed. The client's label and urgency do not make it a bug.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c02-cr-enh-bug-feature-q2",
          prompt: "Two months after the warranty ended, an export accepted in UAT starts failing for large files. The client has no support plan. How is it typically handled?",
          options: [
            "As a bug after warranty: quoted and billed as support work",
            "As a warranty bug, fixed free",
            "As a change request",
            "As a new feature",
          ],
          correctIndex: 0,
          explanation: "It is a real bug, but outside the warranty window and with no plan, so it is typically billable support.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c02-cr-enh-bug-feature-q3",
          prompt: "The client asks for the appointments screen to load faster. It loads in 3 seconds, within the agreed 4-second target. What is it?",
          options: ["An enhancement", "A bug", "A change request", "A clarification"],
          correctIndex: 0,
          explanation: "It meets the agreed target, so it is not a bug. Making it faster improves working behaviour without reversing a decision.",
        },
        {
          id: "pmp-c02-cr-enh-bug-feature-q4",
          prompt: "Which of these are typically billable? (Select all that apply.)",
          options: ["A change request", "A new feature", "An enhancement", "A bug found during UAT"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "CRs, new features and enhancements are typically estimated and billed. Delivery bugs are typically fixed at no extra cost.",
        },
        {
          id: "pmp-c02-cr-enh-bug-feature-q5",
          prompt: "A receptionist asks why cancelled slots take 10 minutes to reappear. The PRD specifies a 10-minute hold. What do you do?",
          options: [
            "Explain the agreed behaviour and where it was agreed; offer a CR if they want it changed",
            "Log a bug and fix it",
            "Raise a new feature",
            "Ignore it",
          ],
          correctIndex: 0,
          explanation: "It works as specified, so it is a clarification. If they then want different behaviour, that becomes a CR.",
        },
        {
          id: "pmp-c02-cr-enh-bug-feature-q6",
          prompt: "The client wants a new \"clinic manager\" user role with its own permissions. Only admin and receptionist roles exist. What is it?",
          options: ["A new feature", "An enhancement", "A bug", "A clarification"],
          correctIndex: 0,
          explanation: "A new role is functionality that does not exist and needs its own requirements and testing.",
        },
        {
          id: "pmp-c02-cr-enh-bug-feature-q7",
          prompt: "The client says: \"It's obviously a bug, any normal system would let patients book for family members.\" Family booking was never specified. Which statement is correct?",
          options: [
            "If it was never specified, it is not a bug, however reasonable it sounds",
            "Anything a normal system would do counts as a bug",
            "It is a bug if the client feels strongly",
            "It is a clarification, so it is free",
          ],
          correctIndex: 0,
          explanation: "A bug is measured against the agreement, not against expectations. Family booking is new functionality.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c02-cr-enh-bug-feature-q8",
          prompt: "Before classifying a client request, what evidence do you check? (Select all that apply.)",
          options: ["The signed scope and acceptance criteria", "The approved designs", "The go-live date and warranty window", "How urgent the client sounds"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Scope, designs and dates decide the classification. Urgency affects priority, not the label.",
        },
        {
          id: "pmp-c02-cr-enh-bug-feature-q9",
          prompt: "A developer fixed a \"bug\" that turned out to be a change request. The work is done. What is the best recovery?",
          options: [
            "Record it in the change list as goodwill, so it is visible, and classify before building next time",
            "Bill it retroactively without telling the client first",
            "Revert the change",
            "Do nothing",
          ],
          correctIndex: 0,
          explanation: "Retroactive billing feels like an ambush. Making the goodwill visible keeps the record honest and gives context for future CR discussions.",
        },
      ],
      practice: {
        kind: "categorize",
        prompt:
          "A Laravel and React booking platform for a UK clinic chain. Go-live was on 1 March; the warranty window is 60 days (typical). Today's requests come from the clinic and from earlier UAT notes. Classify each request using the signed scope, acceptance criteria and approved designs as the baseline.",
        mode: "classify-request",
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
          { id: "a", text: "UAT note (February): the booking confirmation email is not sent, although acceptance criterion 4.2 requires it.", explanation: "In scope, not working, before go-live: a delivery bug." },
          { id: "b", text: "20 March: patients with an apostrophe in their surname cannot book. Booking for any patient is in the signed scope.", explanation: "In scope, not working, live and inside the 60-day window: a warranty bug." },
          { id: "c", text: "15 August: the appointments CSV export, accepted in UAT, now stops at 1,000 rows.", explanation: "In scope and broken, but live and past the warranty window: handled as support." },
          { id: "d", text: "Change booking slots from 15 to 20 minutes everywhere. 15-minute slots were agreed and work.", explanation: "Works as agreed; the client wants agreed behaviour changed: change request." },
          { id: "e", text: "Could the receptionist's appointment list remember the last filter used? The list works as specified.", explanation: "Improves working behaviour without reversing a decision: enhancement." },
          { id: "f", text: "Add video consultations through a video provider. Nothing like this exists.", explanation: "Brand-new functionality: new feature." },
          { id: "g", text: "Why does a cancelled slot take 10 minutes to reappear? The PRD specifies a 10-minute hold.", explanation: "Works as agreed; explain it: clarification." },
          { id: "h", text: "Reported as a bug: the SMS reminder does not show the doctor's name. The signed SMS template has no doctor's name.", explanation: "Not what the client expects, but never specified; it changes the agreed template: change request." },
          { id: "i", text: "Make the admin dashboard charts load faster. They load in 3 seconds; the agreed target is 4.", explanation: "Meets the target; making it faster is an improvement: enhancement." },
          { id: "j", text: "Add a \"clinic manager\" role with its own permissions. Only admin and receptionist roles exist.", explanation: "Functionality that does not exist: new feature." },
          { id: "k", text: "A receptionist asks how to reschedule an appointment. Rescheduling exists and works as documented.", explanation: "Nothing needs to change: clarification." },
          { id: "l", text: "Redesign the invoice PDF layout. The current layout was approved and works.", explanation: "Changes an approved design: change request." },
        ],
        answer: {
          a: "bug",
          b: "bug-warranty",
          c: "bug-support",
          d: "change-request",
          e: "enhancement",
          f: "new-feature",
          g: "clarification",
          h: "change-request",
          i: "enhancement",
          j: "new-feature",
          k: "clarification",
          l: "change-request",
        },
      },
    },
    {
      id: "pmp-c02-config-vs-custom",
      moduleId: "pmp-c02",
      trackId: "pm",
      title: "Configuration vs customisation",
      summary:
        "[[term:configuration]] changes how a product behaves using options it already has: settings, the admin panel, a [[term:feature-toggle]], themes and content. [[term:customisation]] changes behaviour by writing or modifying code, because the settings cannot do what the client needs.\n\nWhy it matters at an agency: on a white-label product this is the line between the setup fee and billable development, and between an instance that upgrades cleanly and one that fights every [[term:core-upgrade]]. Configuration is typically done in hours and survives upgrades. Customisation is typically billable, needs testing, and must be re-merged each time the [[term:core-product]] moves, with [[term:customisation-merge-conflicts]] as the cost. The same distinction appears in custom projects that use a CMS, a payment platform or an ERP.\n\nHow to do it: before you call anything \"just configuration\", ask the tech lead which setting, toggle or admin screen does it. If nobody can name one, it is customisation (or a [[term:new-feature]] if nothing similar exists). Write the classification next to each need and get the client to approve the list.\n\nThe common mistake: calling customisation \"configuration\" to close the sale or keep a client happy. The cost does not disappear; it moves into delivery and into every upgrade.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Learn (Dynamics 365 implementation guide): Customize and extend - configuration first", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/extend-your-solution-scenarios", kind: "docs", verifiedAt: "2026-10-02T12:01:00Z" },
        { label: "Microsoft Learn (Dynamics 365 implementation guide): Extend apps without compromising performance", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/extend-your-solution", kind: "docs", verifiedAt: "2026-10-02T12:01:01Z" },
        { label: "GOV.UK Service Manual: Choosing technology: an introduction", url: "https://www.gov.uk/service-manual/technology/choosing-technology-an-introduction", kind: "docs", verifiedAt: "2026-10-02T11:51:27Z" },
      ],
      video: {
        title: "Configuration vs. Customization: Understanding the Differences",
        channel: "Technology Advisors, Inc.",
        url: "https://www.youtube.com/watch?v=drk4_gaw06Y",
        videoId: "drk4_gaw06Y",
        verifiedAt: "2026-10-02T12:17:21Z",
      },
      alternateVideos: [
        {
          title: "What is Customization Vs Configuration in ServiceNow? Know before you customize OOTB features",
          channel: "ServiceNowStar",
          url: "https://www.youtube.com/watch?v=LYQj2Vueex4",
          videoId: "LYQj2Vueex4",
          verifiedAt: "2026-10-02T12:17:21Z",
        },
      ],
      handbook: { stages: ["wl-gap-analysis"], rules: ["configuration-vs-customisation", "core-upgrade-custom-impact"] },
      sections: [
        {
          heading: "Configuration vs customisation: side by side",
          body:
            "**[[term:configuration]]**\n- Uses options the product already has: [[term:configuration-panel]] settings, toggles, [[term:theming]], content.\n- No developer writes code. Usually done by a PM, a support engineer or the client.\n- Survives a [[term:core-upgrade]] untouched.\n\n**[[term:customisation]]**\n- New or changed code in the product, for this client only.\n- Needs estimation, development, QA and [[term:regression-test|regression testing]].\n- Must be re-checked and often re-merged at every upgrade.\n\n**Consequence for time and billing:** configuration is typically included in the setup fee or done in hours. Customisation is typically billable development now, plus extra effort at every upgrade later. Follow the Oyelabs rule in the handbook card below for what counts as configuration.",
        },
        {
          heading: "Customisation vs new feature: side by side",
          body:
            "**[[term:customisation]]**\n- An existing feature must behave differently for this client (a different checkout rule, a different commission formula).\n- Changes shared code, so upgrade conflicts are likely.\n\n**[[term:new-feature]]**\n- Nothing similar exists. Ideally built as a separate [[term:custom-module]] beside the core.\n\n**Consequence:** both need code and money, but a separate module usually ages better than a change inside the core. When a customisation can be redesigned as a separate module, it is often cheaper over the client's lifetime.",
        },
        {
          heading: "The \"name the setting\" test",
          body:
            "Before calling anything configuration, someone must be able to finish this sentence: \"It's done in ____, by changing ____.\"\n\n- \"Delivery fee by zone\": done in the admin panel, under zones. **Configuration.**\n- \"Hide tipping\": done with the existing tipping toggle. **Configuration.**\n- \"Brand colours and logo\": done through the theme settings and the [[term:brand-kit]]. **Configuration** (rebranding).\n- \"Customer approves substitutions before the driver picks\": nobody can name a setting; the flow must change. **Customisation.**\n- \"Loyalty points and tiers\": nothing similar exists. **New feature.**",
        },
        {
          heading: "How to say it to a client",
          body:
            "- \"Delivery zones and fees are settings in your admin panel, so they're included in the setup and won't be affected by future updates.\"\n- \"Changing who approves substitutions means changing the product's code for you. That's a customisation: we'll estimate it, and it also adds a little effort to each future upgrade.\"\n- \"If we build loyalty as a separate module rather than changing the core checkout, future upgrades stay simpler for you.\"",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **\"It's just a config change\" without checking.** Recover: ask the tech lead to name the setting before replying to the client.\n- **Hard-coding a client's value instead of adding a setting.** It looks like configuration but is customisation. Recover: log it as customisation so the upgrade team knows.\n- **Forgetting upgrade cost in the estimate.** Recover: add a line for upgrade and regression effort to every customisation quote.\n- **No written classification.** Recover: send the classified list and ask the client to approve it.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Every \"configuration\" item names the setting, toggle or admin screen.\n2. Customisations are estimated with development, QA and upgrade effort.\n3. Where possible, new behaviour is a separate custom module, not a core change.\n4. The client approved the classified list in writing.\n5. The upgrade team has the list of customisations for this instance.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c02-config-vs-custom-q1",
          prompt: "A white-label client wants prices in SAR. The product supports SAR as a currency setting. What is it?",
          options: ["Configuration", "Customisation", "New feature", "Change request on the core"],
          correctIndex: 0,
          explanation: "A supported setting, no code: configuration.",
        },
        {
          id: "pmp-c02-config-vs-custom-q2",
          prompt: "A developer \"configures\" a client's commission rate by changing a constant in the code. What is it really?",
          options: ["Customisation", "Configuration", "Theming", "A clarification"],
          correctIndex: 0,
          explanation: "If code changes, it is customisation, even if the change is one line. It will need checking at every upgrade.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c02-config-vs-custom-q3",
          prompt: "Why does customisation cost more over the life of a white-label client? (Select all that apply.)",
          options: [
            "It must be re-checked and often re-merged at every core upgrade",
            "It needs its own QA and regression testing",
            "It can cause merge conflicts with core changes",
            "It voids the client's licence",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Upgrades, testing and conflicts are the ongoing costs. It does not void a licence.",
        },
        {
          id: "pmp-c02-config-vs-custom-q4",
          prompt: "Sales told the client a new approval step in checkout is \"just configuration\". The tech lead says it needs code. What should the PM do?",
          options: [
            "Correct it in writing with BD before the quote is signed, explaining the cost and upgrade impact",
            "Build it free to honour the sales promise",
            "Call it configuration and bill it as development",
            "Ignore it until UAT",
          ],
          correctIndex: 0,
          explanation: "The cost does not disappear by labelling it. Correcting early, with BD, is cheaper than a dispute in delivery.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c02-config-vs-custom-q5",
          prompt: "What is the quickest test of whether something is configuration?",
          options: [
            "Someone can name the setting, toggle or admin screen that does it",
            "It takes less than a day",
            "The client calls it small",
            "It does not need a store release",
          ],
          correctIndex: 0,
          explanation: "Size and the client's view do not decide it. If no existing option does it, code is needed.",
        },
        {
          id: "pmp-c02-config-vs-custom-q6",
          prompt: "A client wants a loyalty programme. Nothing similar exists in the core. Which option usually ages best?",
          options: [
            "Build it as a separate custom module beside the core",
            "Modify the core checkout code directly for this client",
            "Configure it in the admin panel",
            "Fork the whole product for this client",
          ],
          correctIndex: 0,
          explanation: "A separate module avoids changing shared code, so upgrades are less affected. A fork is the most expensive path.",
        },
        {
          id: "pmp-c02-config-vs-custom-q7",
          prompt: "Which of these are normally configuration in a white-label product? (Select all that apply.)",
          options: ["Uploading the client's logo and brand colours through theme settings", "Turning off tipping with an existing toggle", "Changing who approves order substitutions", "Adding a points-based loyalty programme"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Theming and toggles use existing options. Changing a flow is customisation; loyalty is a new feature.",
        },
        {
          id: "pmp-c02-config-vs-custom-q8",
          prompt: "When estimating a customisation for a white-label client, what is most often forgotten?",
          options: ["The effort to keep it working through future core upgrades", "The design review", "The PM's time in meetings", "The store listing"],
          correctIndex: 0,
          explanation: "Upgrade and regression effort is the hidden, recurring cost of customisation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Fix the wrong term. A PM drafted this gap-analysis summary for a white-label grocery app for a supermarket group in Oman. Mark every line where configuration, customisation or new feature is used wrongly.",
        segments: [
          { id: "s1", text: "Hi Khalid, here is the classification of your requirements.", issue: null },
          { id: "s2", text: "Arabic and English: out of the box, already in the product.", issue: null },
          { id: "s3", text: "Delivery zones for Muscat and Sohar with different fees: configuration, set in your admin panel.", issue: null },
          { id: "s4", text: "Customers approving substitutions in the app before the driver picks: configuration, included in setup.", issue: "No setting does this; the substitution flow must change in code. It is customisation and typically billable." },
          { id: "s5", text: "Hiding the tipping option: configuration, using the existing toggle.", issue: null },
          { id: "s6", text: "Your logo, colours and app name: configuration through the theme settings.", issue: null },
          { id: "s7", text: "A points-based loyalty programme: a small customisation of checkout.", issue: "Nothing similar exists, so it is a new feature, ideally a separate module, not a small checkout change." },
          { id: "s8", text: "Your local payment gateway, which the product already integrates: configuration with your own API keys.", issue: null },
          { id: "s9", text: "Customisations do not affect future upgrades, so there is no ongoing cost.", issue: "Customisations must be re-checked and often re-merged at every core upgrade, which is an ongoing cost." },
          { id: "s10", text: "Please confirm this list so we can send the estimate for the remaining items.", issue: null },
        ],
        askExplanation: true,
      },
    },
  ],
} satisfies Module;
