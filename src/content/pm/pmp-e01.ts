import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-e01",
  trackId: "pm",
  name: "Scope & sign-off templates",
  description:
    "The four documents that fix what Oyelabs will build and what the client has accepted: the kickoff agenda, the requirement sign-off, the UAT sign-off and the change request form. Each topic walks the template field by field and ends with you filling it in from a real-looking scenario.",
  topics: [
    // ---------------------------------------------------------------------------------------------
    // Kickoff agenda
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-e01-kickoff-agenda",
      moduleId: "pmp-e01",
      trackId: "pm",
      title: "Kickoff agenda",
      summary: `The kickoff agenda is the first document the client receives from delivery. It turns the signed [[term:sow|SOW]] into a meeting plan: who is who, what we are building, what we are not building, when the [[term:milestone|milestones]] fall, how we will talk, and what the client must provide by when. A good agenda is sent before the call, so the client arrives with the right people and the right answers.

At an agency the kickoff is where most later disputes are either prevented or planted. If the agenda never forces a conversation about [[term:out-of-scope|out-of-scope]] items, the client assumes they are included. If it never names the [[term:spoc|SPOC]] and the approver, design feedback arrives from five people. If it never lists [[term:client-dependency|client dependencies]] with dates, the store accounts and API keys turn up in week ten.

The PM drafts the agenda from the BD handover pack and the SOW, the account manager or BD lead checks the commercial points, and the agenda goes to the client sponsor and SPOC a few days ahead. After the call the same structure becomes the kickoff [[term:mom|minutes]].

The common mistake is an agenda that lists topics without decisions: "Timeline" instead of "Confirm design approval in week 5 and UAT in weeks 13–14". Write each item as the outcome you need from the room.`,
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Atlassian Team Playbook: Project Kickoff", url: "https://www.atlassian.com/team-playbook/plays/project-kickoff", kind: "docs", verifiedAt: "2026-10-02T12:04:06Z" },
        { label: "Confluence: Project kickoff template", url: "https://www.atlassian.com/software/confluence/templates/project-kickoff", kind: "docs", verifiedAt: "2026-10-02T12:04:07Z" },
        { label: "ProjectManager: How to write a project kickoff agenda", url: "https://www.projectmanager.com/blog/write-project-kickoff-meeting", kind: "article", verifiedAt: "2026-10-02T12:04:07Z" },
        { label: "Asana: Meeting Agenda templates and examples", url: "https://asana.com/resources/meeting-agenda", kind: "article", verifiedAt: "2026-10-02T12:04:16Z" },
      ],
      video: {
        title: "Project Kickoff Meeting Agenda [WHAT TO INCLUDE]",
        channel: "Adriana Girdler",
        url: "https://www.youtube.com/watch?v=44bCXCffRc4",
        videoId: "44bCXCffRc4",
        verifiedAt: "2026-10-02T12:05:43Z",
      },
      alternateVideos: [
        {
          title: "Project Kickoff Meetings | 5-Minute Guide",
          channel: "TeamGantt",
          url: "https://www.youtube.com/watch?v=Bu84BEkN2e4",
          videoId: "Bu84BEkN2e4",
          verifiedAt: "2026-10-02T12:05:43Z",
        },
      ],
      handbook: {
        stages: ["custom-internal-kickoff", "custom-client-kickoff"],
        rules: ["escalation-levels", "weekly-status-report"],
        templates: ["kickoff-agenda"],
      },
      sections: [
        {
          heading: "When it is used and who owns it",
          body: `Use the kickoff agenda twice. First at the **internal kickoff**, where the delivery team reads the same agenda, finds the gaps in the handover and agrees the answers it will propose. Then at the **client kickoff**, where those answers are confirmed with the client.

- **Fills it:** the PM, from the SOW, the proposal, the estimate and the BD handover notes.
- **Checks it:** the BD lead or account manager (commercial promises, out-of-scope wording) and the tech lead (milestones, environments, technical dependencies).
- **Receives it:** the client sponsor and the client [[term:spoc|SPOC]], ideally two to three working days before the call (typical), with a request to bring the people who approve designs and pay invoices.
- **Becomes:** the skeleton of the kickoff minutes and the first entries of the [[term:raid-log|RAID log]].

Typical length is 60–90 minutes on a video call. Atlassian's kickoff play runs about 90 minutes. If the agenda will not fit, move detail into follow-up workshops rather than rushing the scope and dependency items.`,
        },
        {
          heading: "Field by field: introductions to timeline",
          body: `**Introductions and roles.** Good: each person with a role and what they decide ("Operations manager: day-to-day SPOC, consolidates design feedback"). Mistake: names only, so nobody knows who approves.

**Project goals and success criteria.** Good: one or two measurable outcomes the client recognises ("Agents can publish a listing from the app in under two minutes; 200 listings live by launch"). Mistake: copying the proposal's marketing paragraph, which nobody can test.

**Scope summary and out-of-scope items.** Good: the main modules in one line each, then an explicit list of what is not included, quoting the SOW section ("Arabic RTL layout: phase 2, SOW 4.3"). Mistake: listing only what is [[term:in-scope|in scope]]. Silence about exclusions reads as inclusion.

**Timeline and milestones.** Good: the four or five dates that matter to the client, each tied to something they must do ("Design approval, week 5: needs sponsor sign-off within the agreed revision rounds"). Mistake: pasting a 200-line Gantt chart, or promising dates the tech lead has not checked against the [[term:estimate|estimate]].`,
        },
        {
          heading: "Field by field: team to next steps",
          body: `**Team, RACI and SPOCs.** Good: a short [[term:raci|RACI]] for the decisions that cause trouble (design approval, UAT sign-off, CR approval, invoice approval), plus one SPOC on each side. Mistake: a RACI with every box ticked "C", which decides nothing.

**Communication cadence and tools.** Good: the status report day, the sprint demo rhythm, the channel for quick questions, the overlap hours between time zones, and the expected reply time on each side. Follow the Oyelabs rule in the handbook card below for the weekly report. Mistake: agreeing "we'll use WhatsApp" with no rule for where decisions are recorded.

**Escalation matrix.** Good: walk the levels and names briefly and promise the filled [[term:escalation-matrix|escalation matrix]] with the minutes. Mistake: skipping it because "we won't need it". You need it most when the relationship is already strained, which is too late to agree it.

**Client dependencies and dates.** Good: every account, key, asset and data file the client owes, each with an owner and a calendar date. Mistake: "client to provide assets in due course".

**Risks and assumptions.** Good: the three or four [[term:risk|risks]] and [[term:assumption|assumptions]] the client can act on (late store accounts, data quality, approval speed). Mistake: reading the internal risk list aloud, including "client may be slow to pay".

**Next steps.** Good: dated actions with owners, including the first [[term:discovery|discovery]] sessions already booked. Mistake: "We'll be in touch".`,
        },
        {
          heading: "What good looks like: a worked example",
          body: `A property brokerage in Dubai has signed for a Laravel admin panel and a React Native agent app. Go-live is planned for week 16. The BD handover note says the CEO "wants it fast" and that Arabic was "discussed".

The PM drafts a 75-minute agenda and sends it on Wednesday for a Monday call:

1. Introductions and roles (5 min): CEO as sponsor and final approver; operations manager as SPOC; Oyelabs PM, tech lead and designer.
2. Goals (10 min): agents publish listings from the app; leads route to the right agent within five minutes.
3. Scope and exclusions (15 min): listings, leads, agent app, admin. **Not included:** Arabic RTL (phase 2, SOW 4.3) and CRM integration. The PM asks the CEO to confirm both out loud because the handover note was vague.
4. Milestones (10 min): discovery sign-off week 2, design approval week 5, UAT weeks 13–14, go-live week 16.
5. Team, RACI, cadence and escalation (10 min): status report every Thursday; sprint demo every second Tuesday; one shared channel; decisions only count once they are in the minutes.
6. Client dependencies (15 min): Apple and Google organisation accounts by 23 October, payment gateway sandbox keys by 6 November, the listings CSV by 20 November.
7. Risks and next steps (10 min): store-account lead time is the top risk; discovery workshops booked for Wednesday and Friday.

The Arabic question comes up in item 3, takes four minutes, and ends with a written phase 2 note instead of a dispute in week 12.`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **The client's decision-maker was not in the room.** Do not treat the kickoff as done. Send the minutes to the sponsor with the scope, exclusions and approver questions marked "please confirm by Friday", or book a 20-minute follow-up.
- **You discover in the call that sales promised something the SOW does not include.** Do not argue or agree on the spot. Record it as an open point, check with BD the same day, and come back with either a SOW reference or a [[term:change-request|change request]].
- **The agenda overran and dependencies were skipped.** Send the dependency list by email the same day with owners and dates and ask for written confirmation. A dependency nobody accepted is not a dependency, it is a hope.
- **Two client stakeholders gave conflicting answers.** Do not pick one. Note both in the minutes and ask the sponsor to decide.
- **The client wants to start building before discovery.** Explain what discovery protects them from, and point to the milestone plan in the agenda. If they insist, record the decision and the risk.`,
        },
        {
          heading: "Your checklist",
          body: `1. Read the SOW, proposal, estimate and BD handover notes before drafting.
2. Write every agenda item as the outcome you need, with minutes per item.
3. Quote the SOW for each out-of-scope item.
4. Name the sponsor, the SPOC and the approver for designs, UAT and CRs.
5. List every client dependency with an owner and a calendar date.
6. Include the cadence, the channel rules and the escalation levels.
7. Send the agenda two to three working days ahead (typical) and ask for the right attendees.
8. Turn the agenda into the minutes and the first RAID log entries within a day.`,
        },
      ],
      sop: [
        {
          title: "Oyelabs kickoff pack",
          prompt:
            "[Oyelabs SOP – admin to fill] Where the kickoff agenda, deck and welcome pack templates live, who reviews the agenda before it goes to the client, how far ahead it is sent, and which internal people must attend the client kickoff.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-e01-kickoff-agenda-q1",
          prompt: "Which agenda item is written the way a good kickoff agenda should be written?",
          options: [
            "\"Timeline and milestones: confirm design approval in week 5 and UAT in weeks 13–14 with the sponsor\"",
            "\"Timeline\"",
            "\"Discuss the timeline if there is time\"",
            "\"Timeline: see attached 200-line Gantt chart\"",
          ],
          correctIndex: 0,
          explanation:
            "An agenda item should name the decision you need from the room. A bare heading or a huge Gantt chart gives the client nothing to confirm, so the item ends without a decision.",
        },
        {
          id: "pmp-e01-kickoff-agenda-q2",
          prompt: "Who should normally receive the kickoff agenda before the call?",
          options: [
            "The client sponsor and the client SPOC, with a request to bring whoever approves designs and invoices",
            "Only the developers, so they can prepare",
            "Only the client's finance team",
            "Nobody: the agenda is shared on screen during the call",
          ],
          correctIndex: 0,
          explanation:
            "Sending it ahead to the sponsor and SPOC lets them bring the right people and answers. Sharing it only on screen means the people who decide may not be in the room.",
        },
        {
          id: "pmp-e01-kickoff-agenda-q3",
          prompt:
            "The BD handover note says Arabic support was \"discussed\" but the SOW lists it under phase 2. How should the kickoff agenda handle it?",
          options: [
            "List it explicitly under out-of-scope items, quoting the SOW section, and ask the sponsor to confirm",
            "Leave it off the agenda so it does not cause an argument",
            "Add it to the scope summary to keep the client happy",
            "Mention it only to the tech lead after the call",
          ],
          correctIndex: 0,
          explanation:
            "Unspoken exclusions become disputes later. Quoting the SOW and getting confirmation on day one costs a few minutes, while silence lets the client assume it is included.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e01-kickoff-agenda-q4",
          prompt: "Which of these belong in the client dependencies item of the agenda? (Select all that apply.)",
          options: [
            "Apple and Google organisation accounts, owner client SPOC, due 23 October",
            "Payment gateway sandbox keys, owner client finance lead, due 6 November",
            "Product data CSV in the agreed format, owner client operations, due 20 November",
            "Database schema design, owner Oyelabs tech lead",
            "\"Assets to be provided in due course\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A client dependency is something the client owes, with an owner and a date. The schema is Oyelabs' own work, and \"in due course\" has no date, so nobody can be held to it.",
        },
        {
          id: "pmp-e01-kickoff-agenda-q5",
          prompt: "Why should the RACI on the kickoff agenda focus on a few decisions such as design approval, UAT sign-off and CR approval?",
          options: [
            "Those are the decisions that stall or cause disputes when nobody owns them",
            "Because a RACI may only have four rows",
            "Because the client is not allowed to see the full RACI",
            "Because developers do not appear in a RACI",
          ],
          correctIndex: 0,
          explanation:
            "A RACI is useful where ownership is unclear and costly. A huge grid with every box marked \"consulted\" decides nothing; the trouble decisions need one accountable name.",
        },
        {
          id: "pmp-e01-kickoff-agenda-q6",
          prompt:
            "Halfway through the kickoff, the client's marketing head says the sales rep promised a loyalty programme. The SOW does not mention one. What do you do?",
          options: [
            "Record it as an open point, check with BD the same day, and come back with the SOW reference or a change request",
            "Agree, because sales already promised it",
            "Tell the client the sales rep was wrong",
            "Ignore it and move to the next agenda item",
          ],
          correctIndex: 0,
          explanation:
            "Agreeing on the spot adds unpriced scope, and contradicting sales in front of the client damages trust. Logging it and resolving it with BD keeps the record straight.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e01-kickoff-agenda-q7",
          prompt: "The agenda overran and the dependency item was never covered. What is the best recovery?",
          options: [
            "Email the dependency list the same day with owners and dates, and ask the client to confirm in writing",
            "Wait for the next status report to mention it",
            "Assume the client read the agenda and accepted the dates",
            "Book another 90-minute kickoff",
          ],
          correctIndex: 0,
          explanation:
            "A dependency nobody accepted is not a commitment. A same-day written list fixes it quickly; waiting for the status report loses a week, and a second full kickoff is overkill.",
        },
        {
          id: "pmp-e01-kickoff-agenda-q8",
          prompt: "Which items from the kickoff agenda should flow straight into the RAID log after the call? (Select all that apply.)",
          options: [
            "Store-account lead time as a risk",
            "\"Listings CSV arrives in the agreed format\" as an assumption",
            "Payment gateway keys from the client as a dependency",
            "The sponsor's job title",
            "The video-call link",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Risks, assumptions and dependencies agreed at kickoff are the RAID log's first entries. Job titles belong in the contact list and the call link is logistics.",
        },
        {
          id: "pmp-e01-kickoff-agenda-q9",
          prompt:
            "The client sponsor declines the kickoff and sends a junior coordinator \"to take notes\". What should you do with the agenda's scope and approver items?",
          options: [
            "Run the call, then send the minutes to the sponsor with the scope, exclusions and approver points marked for written confirmation by a date",
            "Cancel the project until the sponsor attends",
            "Treat the coordinator's attendance as the sponsor's agreement",
            "Skip the scope items and cover them at UAT",
          ],
          correctIndex: 0,
          explanation:
            "The coordinator cannot confirm scope or name approvers. Getting the sponsor's written confirmation keeps momentum without pretending a decision was made.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "kickoff-agenda",
        prompt:
          "Draft the client kickoff agenda for this project from the BD handover email. Fill every field. Dates go in the date field as calendar dates.",
        context: `**From:** BD lead
**To:** PM
**Subject:** Handover – property app, Dubai brokerage

Signed yesterday. Laravel admin + React Native agent app. Go-live planned for **week 16**. Kickoff is Monday 12 October, 75 min on Teams.

Milestones in the SOW: discovery sign-off week 2, design approval week 5, UAT weeks 13–14, go-live week 16.

People: the CEO is the sponsor and signs all approvals (designs, UAT, CRs). Day-to-day contact is their **operations manager**, who will collect feedback from the agents. Marketing is run by an outside agency.

Out of scope per SOW 4.3: Arabic RTL (phase 2) and CRM integration. The CEO asked about Arabic on the sales call, I said "later".

They owe us: Apple + Google organisation accounts by **6 November**, payment gateway sandbox keys by **23 October**, listings CSV by 20 November.

Goal they care about: agents publish listings from the app; new leads reach an agent within five minutes.`,
        fields: [
          { id: "goals", label: "Project goals and success criteria", input: "textarea", required: true },
          { id: "outOfScope", label: "Scope summary and out-of-scope items", input: "textarea", required: true },
          { id: "milestones", label: "Timeline and milestones", input: "textarea", required: true },
          {
            id: "spoc",
            label: "Client SPOC",
            input: "select",
            options: ["CEO", "Operations manager", "Outside marketing agency", "Oyelabs BD lead"],
            required: true,
          },
          {
            id: "approver",
            label: "Approver for designs, UAT and CRs",
            input: "select",
            options: ["CEO (sponsor)", "Operations manager", "Outside marketing agency", "Oyelabs PM"],
            required: true,
          },
          { id: "goLiveWeek", label: "Go-live week", input: "number", required: true },
          { id: "firstDependency", label: "Earliest client dependency due date", input: "date", required: true },
          { id: "dependencies", label: "Client dependencies and dates", input: "textarea", required: true },
          { id: "cadence", label: "Communication cadence, tools and escalation", input: "textarea", required: true },
          { id: "nextSteps", label: "Next steps", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "spoc", expected: "Operations manager" },
          { fieldId: "approver", expected: "CEO (sponsor)" },
          { fieldId: "goLiveWeek", expected: 16 },
          { fieldId: "firstDependency", expected: "2026-10-23" },
        ],
        rubric: [
          {
            label: "Out-of-scope items are explicit",
            points: 2,
            description: "Names Arabic RTL and CRM integration as excluded, cites SOW 4.3, and plans to have the CEO confirm Arabic as phase 2 because of the sales-call comment.",
          },
          {
            label: "Dependencies have owners and dates",
            points: 2,
            description: "Lists all three client dependencies with an owner on the client side and the exact dates, in date order, and flags store accounts or keys as a risk.",
          },
          {
            label: "Items are written as outcomes",
            points: 2,
            description: "Goals are measurable (listing publishing, five-minute lead routing) and milestone items say what must be confirmed, not just headings.",
          },
          {
            label: "Governance is agreed",
            points: 1,
            description: "Covers status report cadence, demo rhythm, the channel where decisions are recorded and the escalation levels, plus dated next steps.",
          },
        ],
        sampleAnswer: {
          goals:
            "Agents publish a listing from the app without admin help; new leads reach the right agent within five minutes. Confirm both as the success criteria for go-live.",
          outOfScope:
            "In scope: Laravel admin (listings, agents, leads), React Native agent app. Not included (SOW 4.3): Arabic RTL layout – phase 2; CRM integration. CEO to confirm Arabic is phase 2 in this call.",
          milestones:
            "Discovery sign-off week 2; design approval week 5 (CEO sign-off within the revision rounds); UAT weeks 13–14; go-live week 16. Confirm the CEO is available to sign in weeks 2, 5 and 14.",
          spoc: "Operations manager",
          approver: "CEO (sponsor)",
          goLiveWeek: "16",
          firstDependency: "2026-10-23",
          dependencies:
            "Payment gateway sandbox keys – client finance/CEO – 23 October. Apple and Google organisation accounts, Oyelabs invited – operations manager – 6 November (top risk: D-U-N-S lead time, start now). Listings CSV in the agreed format – operations manager – 20 November.",
          cadence:
            "Status report every Thursday; sprint demo every second Tuesday; one shared Teams channel; decisions count once they are in the MoM. Escalation: PM and operations manager, then delivery head and CEO; the filled matrix follows with the minutes.",
          nextSteps:
            "PM sends minutes and the escalation matrix by Tuesday; discovery workshops Wednesday and Friday; operations manager starts the store-account enrolment this week.",
        },
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Requirement sign-off
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-e01-requirement-signoff",
      moduleId: "pmp-e01",
      trackId: "pm",
      title: "Requirement sign-off",
      summary: `The requirement sign-off is the page that turns discovery output into the [[term:scope-baseline|scope baseline]]. The client confirms that a named version of the [[term:prd|PRD]] or [[term:brd|BRD]], the [[term:user-story|user stories]] with their [[term:acceptance-criteria|acceptance criteria]], and the approved designs are complete and correct. From that moment, a [[term:requirement-freeze|requirement freeze]] applies and anything new goes through the [[term:change-request|change request]] process.

It matters at an agency because every later argument is settled against it. "That was always in scope" or "that is a bug, not a change" can only be answered by pointing at a signed, versioned document. Without one, the PM has an email thread and a memory.

The PM prepares the sign-off form at the end of [[term:discovery|discovery]], with the business analyst or tech lead. BD or the account manager checks it matches the SOW. The client sponsor, or the approver the SOW names, signs it. A copy goes to the delivery team and into the project's document store.

The common mistake is a sign-off that says "requirements approved" without a version number, a story count, or an out-of-scope list. That signs nothing. A second mistake is letting the client attach new wishes to the sign-off email; those are CRs, not edits to the baseline.

Not legal advice: the signed contract always wins.`,
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Confluence: Product Requirements Document (PRD) template", url: "https://www.atlassian.com/software/confluence/templates/product-requirements", kind: "docs", verifiedAt: "2026-10-02T12:04:37Z" },
        { label: "GOV.UK Service Manual: Writing user stories", url: "https://www.gov.uk/service-manual/agile-delivery/writing-user-stories", kind: "spec", verifiedAt: "2026-10-02T12:04:37Z" },
        { label: "Atlassian: What is Acceptance Criteria?", url: "https://www.atlassian.com/work-management/project-management/acceptance-criteria", kind: "article", verifiedAt: "2026-10-02T12:04:26Z" },
        { label: "Asana: Business Requirements Document template", url: "https://asana.com/resources/business-requirements-document-template", kind: "article", verifiedAt: "2026-10-02T12:04:37Z" },
      ],
      video: {
        title: "Gaining Buy-In and Sign-Off in Business Analysis for Requirements",
        channel: "Bridging the Gap - Resources for Business Analysts",
        url: "https://www.youtube.com/watch?v=l1iap5Dp3fQ",
        videoId: "l1iap5Dp3fQ",
        verifiedAt: "2026-10-02T12:05:38Z",
      },
      alternateVideos: [
        {
          title: "How to Get Approval and Sign-off for Requirements? Approaches, Techniques and Tools in IT Projects",
          channel: "TEXAVI",
          url: "https://www.youtube.com/watch?v=hhB8FjauLDg",
          videoId: "hhB8FjauLDg",
          verifiedAt: "2026-10-02T12:05:38Z",
        },
      ],
      handbook: {
        stages: ["custom-discovery"],
        rules: ["requirement-freeze-after-signoff", "cr-when-needed"],
        templates: ["requirement-signoff"],
      },
      sections: [
        {
          heading: "When it is used and who owns it",
          body: `Use it once per baseline: at the end of discovery for a custom build, and again for each new phase or large CR that adds its own requirements. A white-label project uses the gap analysis output in the same way.

- **Fills it:** the PM, with the business analyst or tech lead who wrote the stories.
- **Checks it:** BD or the account manager, against the SOW, so the signed scope does not quietly grow beyond what was sold.
- **Signs it:** the client sponsor or the approver the SOW names, and the Oyelabs PM. A day-to-day SPOC can collect feedback, but their signature only counts if the SOW or kickoff minutes name them as an approver.
- **Receives it:** the delivery team (it is now their baseline), the account manager, and the project's document store.

The sign-off should arrive before build estimates and sprint dates are fixed, because those rest on the frozen version. Follow the Oyelabs rule in the handbook card below for what the freeze means in practice.`,
        },
        {
          heading: "Field by field: what good entries look like",
          body: `**Document reference and version.** Good: "PRD v1.2 (12 November), 48 user stories in the tracker as of 12 November, design file v2 approved 3 November". Mistake: "the requirements document". When v1.3 appears later, nobody can prove which one was signed.

**Scope summary.** Good: the modules in one line each, in the client's words. Mistake: pasting the whole PRD, so the client signs without reading.

**Documents included.** Good: each artefact named with its version: PRD or [[term:brd|BRD]], user stories, [[term:wireframe|wireframes]] or [[term:mockup|mockups]], integrations list. Mistake: leaving out the designs, so a later "but the screen showed X" has no anchor.

**Out of scope.** Good: the exclusions from the SOW plus anything discovery pushed to [[term:phase-2|phase 2]], each one line. Mistake: an empty section. Discovery always produces exclusions; if the list is empty, you missed them.

**Assumptions and dependencies.** Good: what the estimate relies on, with owners and dates ("Client supplies the member CSV in the agreed format by week 6"). Mistake: generic lines like "client will cooperate".

**Change control statement.** Good: one plain sentence that changes after sign-off go through the CR process, which the client has seen. Mistake: a page of legal text nobody reads, or no statement at all.

**Sign-off.** Good: names, roles and dates on both sides, plus how the signature was given (signed PDF, e-signature, written email reply, whatever your SOP below says). Mistake: a thumbs-up emoji in chat.`,
        },
        {
          heading: "What good looks like: a worked example",
          body: `A gym chain in Saudi Arabia is building a Laravel member portal and a Flutter app. Discovery ran for three weeks. The analyst sent PRD v1.1; the client returned 14 comments; the team fixed them in **PRD v1.2** with 48 user stories.

The PM prepares the sign-off:

- Reference: PRD v1.2 dated 12 November, 48 stories, design file v2 approved 3 November.
- Scope: memberships, class booking, payments, trainer schedules, admin reports.
- Out of scope: corporate memberships and wearable integration (phase 2, agreed in workshop 3).
- Assumptions: member CSV by week 6; payment gateway account in the client's name by week 4.
- Change control: "Changes after this sign-off are raised as change requests and estimated before work starts."

The operations director replies: "All good, but please also add loyalty points before we sign." The PM does not edit the PRD. Loyalty points were never in the SOW. The PM replies that the current scope can be signed now so the build starts on time, and that loyalty points will go in CR-001 with an estimate by Thursday. The CEO, who is the named approver, signs v1.2 the next day.`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **The client signs an old version.** If they signed v1.1 after v1.2 was sent, send a short note asking them to confirm v1.2 by reply, listing what changed. Do not start the build on an ambiguous baseline.
- **The client will not sign until "one more thing" is added.** Separate the two: sign the current baseline, raise the extra item as a CR. Waiting for the extra item to be designed and estimated delays the whole project for one feature.
- **The SPOC signs but is not the named approver.** Ask the sponsor to countersign or to confirm in writing that the SPOC may approve. Record that delegation in the minutes.
- **Build started without sign-off.** Get it now, and log in the RAID log that sprints 1–2 ran at risk. Anything built before the sign-off that differs from the signed version is reworked as agreed, not argued about.
- **The client says "we never agreed to that exclusion".** Show the signed out-of-scope list. If there is none, you have a negotiation, not a reference; treat it as a lesson and fix the template.`,
        },
        {
          heading: "Your checklist",
          body: `1. Version and date on every artefact being signed: PRD or BRD, stories, designs.
2. Story count written on the form.
3. Out-of-scope list taken from the SOW plus discovery decisions.
4. Assumptions and dependencies with owners and dates.
5. One-sentence change control statement.
6. BD or account manager checked it against the SOW.
7. Signed by the named approver, in the agreed form, and stored.
8. New requests in the sign-off reply raised as CRs, not added to the baseline.`,
        },
      ],
      sop: [
        {
          title: "How Oyelabs collects requirement sign-off",
          prompt:
            "[Oyelabs SOP – admin to fill] Which forms of signature Oyelabs accepts (signed PDF, e-signature tool, written email reply), where signed requirement documents are stored, and who on the Oyelabs side countersigns.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-e01-requirement-signoff-q1",
          prompt: "What does a requirement sign-off actually freeze?",
          options: [
            "A named, versioned set of artefacts (PRD or BRD, user stories with acceptance criteria, approved designs) as the scope baseline",
            "The project's budget, which can never change afterwards",
            "The client's right to ask for anything else",
            "The sprint plan for the whole project",
          ],
          correctIndex: 0,
          explanation:
            "The sign-off freezes the documented requirements as the baseline. Changes are still possible, but they go through the CR process; it does not forbid requests or fix every sprint.",
        },
        {
          id: "pmp-e01-requirement-signoff-q2",
          prompt: "Which entries make the \"Document reference and version\" field strong? (Select all that apply.)",
          options: [
            "PRD v1.2 dated 12 November",
            "48 user stories in the tracker as of 12 November",
            "Design file v2, approved 3 November",
            "\"The latest requirements\"",
            "\"As discussed on the call\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Versions, dates and counts let you prove later exactly what was signed. \"Latest\" and \"as discussed\" change meaning the moment a new version exists.",
        },
        {
          id: "pmp-e01-requirement-signoff-q3",
          prompt:
            "The client replies to the sign-off email: \"Approved, but please also add loyalty points.\" Loyalty points are not in the SOW. What is the best handling?",
          options: [
            "Sign off the current version as it stands and raise loyalty points as a CR with an estimate",
            "Add loyalty points to the PRD and treat the email as sign-off",
            "Refuse to start until the client drops the request",
            "Hold the sign-off until loyalty points are designed and estimated",
          ],
          correctIndex: 0,
          explanation:
            "Bundling an unpriced feature into the baseline is scope creep. Holding the sign-off delays the whole build for one item, so you separate them: freeze what is agreed and estimate the new item as a CR.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e01-requirement-signoff-q4",
          prompt: "The day-to-day SPOC signs the requirement document, but the SOW names the CEO as the approver. What should you do?",
          options: [
            "Ask the CEO to countersign or confirm in writing that the SPOC may approve, and record the delegation",
            "Accept it: any client signature is fine",
            "Ask the SPOC to sign again more clearly",
            "Ignore the SOW, since the SPOC knows the requirements best",
          ],
          correctIndex: 0,
          explanation:
            "A signature only protects you if the signer had the authority. Getting the named approver's confirmation, or a written delegation, closes the gap.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e01-requirement-signoff-q5",
          prompt: "Why should the out-of-scope section never be empty?",
          options: [
            "Discovery always pushes something out or to phase 2, and unlisted exclusions are later read as inclusions",
            "Because the template does not save with empty sections",
            "Because the client is billed per excluded item",
            "Because developers need a list of features to skip",
          ],
          correctIndex: 0,
          explanation:
            "An empty list usually means the exclusions were never written down. When the client later asks for one of them, there is nothing signed to point to.",
        },
        {
          id: "pmp-e01-requirement-signoff-q6",
          prompt: "Who should check the requirement sign-off against the SOW before it goes to the client?",
          options: [
            "BD or the account manager, so the signed scope does not grow beyond what was sold",
            "The QA engineer",
            "The client SPOC",
            "Nobody: the analyst wrote the stories, so they are correct",
          ],
          correctIndex: 0,
          explanation:
            "Discovery often expands scope by accident. The person who owns the commercial agreement checks that the baseline still fits the SOW and price.",
        },
        {
          id: "pmp-e01-requirement-signoff-q7",
          prompt: "Which of these are good assumption or dependency entries on the sign-off form? (Select all that apply.)",
          options: [
            "Client supplies the member CSV in the agreed format by week 6",
            "Payment gateway account opened in the client's name by week 4",
            "Client SPOC answers requirement questions within two working days",
            "Client will cooperate",
            "Everything will go to plan",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Good entries are specific, owned and dated, so a slip can be traced. \"Will cooperate\" and \"go to plan\" cannot be tested and give no protection.",
        },
        {
          id: "pmp-e01-requirement-signoff-q8",
          prompt:
            "Sprint 3 is under way. The client says a screen \"was always meant\" to support bulk upload. The signed PRD v1.2 and approved designs show single upload only. What is the request?",
          options: [
            "A change request against the signed baseline",
            "A bug, because the client expected it",
            "A clarification that costs nothing",
            "A warranty claim",
          ],
          correctIndex: 0,
          explanation:
            "The signed documents define what was agreed. Bulk upload changes agreed behaviour, so it is a CR; it is not a bug, because the build matches the signed version.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e01-requirement-signoff-q9",
          prompt: "The client signed PRD v1.1, but v1.2 with their own fixes was sent two days earlier. What do you do?",
          options: [
            "Send a short note listing the v1.2 changes and ask them to confirm v1.2 in writing before the build starts",
            "Build from v1.2 anyway; the client will not notice",
            "Build from v1.1, since that is what was signed",
            "Ask them to sign every version from v1.0 onwards",
          ],
          correctIndex: 0,
          explanation:
            "An ambiguous baseline is worse than a short delay. Building from either version without confirmation sets up a dispute later about which one counts.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "requirement-signoff",
        prompt:
          "Prepare the requirement sign-off form from the discovery notes and the client's email. Choose the right version and signatory, and decide how to handle the extra request.",
        context: `**PM notes, end of discovery (Laravel member portal + Flutter app, gym chain, Saudi Arabia)**

- PRD v1.1 sent 5 Nov; client returned 14 comments.
- PRD **v1.2** sent 12 Nov with all 14 fixed. Tracker shows **48** user stories with acceptance criteria.
- Design file v2 approved by the CEO on 3 Nov.
- Workshop 3 moved corporate memberships and wearable integration to phase 2.
- The member CSV is due from the client in week 6; the payment gateway account in their name in week 4.
- SOW names the **CEO** as approver for requirements, designs and UAT.

**Email from the operations director (13 Nov):**

> Hi, we went through v1.1 again and it looks good. Happy to approve. One thing: before we sign, please add loyalty points (members earn points per class). The CEO is travelling, so I can sign on his behalf. Thanks!`,
        fields: [
          {
            id: "version",
            label: "PRD version being signed",
            input: "select",
            options: ["v1.0", "v1.1", "v1.2", "v1.3"],
            required: true,
          },
          { id: "stories", label: "Number of user stories in the baseline", input: "number", required: true },
          { id: "scope", label: "Scope summary and documents included", input: "textarea", required: true },
          { id: "outOfScope", label: "Out of scope", input: "textarea", required: true },
          { id: "assumptions", label: "Assumptions and dependencies", input: "textarea", required: true },
          {
            id: "loyalty",
            label: "Handling of the loyalty points request",
            input: "select",
            options: [
              "Add it to the PRD before sign-off at no cost",
              "Sign off the current scope and raise it as a change request",
              "Hold the sign-off until it is designed and estimated",
              "Ignore it",
            ],
            required: true,
          },
          {
            id: "signatory",
            label: "Who must sign for the client",
            input: "select",
            options: ["Operations director", "CEO (or written delegation from the CEO)", "Any client staff member", "Oyelabs PM on the client's behalf"],
            required: true,
          },
          { id: "changeControl", label: "Change control statement", input: "textarea", required: true },
          { id: "reply", label: "Your reply to the operations director (short)", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "version", expected: "v1.2" },
          { fieldId: "stories", expected: 48 },
          { fieldId: "loyalty", expected: "Sign off the current scope and raise it as a change request" },
          { fieldId: "signatory", expected: "CEO (or written delegation from the CEO)" },
        ],
        rubric: [
          {
            label: "Baseline is precisely referenced",
            points: 2,
            description: "Names PRD v1.2 with its date, the 48 stories and design file v2, and notes the client reviewed v1.1 so v1.2 must be the one confirmed.",
          },
          {
            label: "Exclusions and assumptions are specific",
            points: 2,
            description: "Lists corporate memberships and wearables as phase 2, and the CSV (week 6) and gateway account (week 4) with the client as owner.",
          },
          {
            label: "Reply protects the baseline politely",
            points: 2,
            description: "Thanks them, points out v1.2 is the version to approve, separates loyalty points into a CR with an estimate date, and asks for the CEO's signature or written delegation.",
          },
        ],
        sampleAnswer: {
          version: "v1.2",
          stories: "48",
          scope:
            "PRD v1.2 (12 Nov), 48 user stories with acceptance criteria, design file v2 approved 3 Nov. Modules: memberships, class booking, payments, trainer schedules, admin reports; member portal (Laravel) and Flutter app.",
          outOfScope: "Corporate memberships and wearable integration – phase 2 (workshop 3). Loyalty points – not in SOW, raised separately as a CR.",
          assumptions:
            "Client provides the member CSV in the agreed format by week 6 (owner: operations director). Payment gateway account in the client's name by week 4 (owner: client finance).",
          loyalty: "Sign off the current scope and raise it as a change request",
          signatory: "CEO (or written delegation from the CEO)",
          changeControl: "Any change after this sign-off is raised as a change request, estimated and approved before work starts.",
          reply:
            "Thanks for the review. Please note the version to approve is v1.2 (12 Nov), which includes all 14 of your v1.1 comments. Loyalty points are not in the current scope, so I'll send them as CR-001 with an estimate by Thursday; that way the build starts on time. As the SOW names the CEO as approver, could he sign, or send a one-line email confirming you may sign for him?",
        },
      },
    },

    // ---------------------------------------------------------------------------------------------
    // UAT sign-off
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-e01-uat-signoff",
      moduleId: "pmp-e01",
      trackId: "pm",
      title: "UAT sign-off",
      summary: `The UAT sign-off is the client's written statement that a specific [[term:build|build]] passed [[term:uat|user acceptance testing]] against the agreed [[term:acceptance-criteria|acceptance criteria]] and may go live. It lists any [[term:known-issues|known issues]] the client accepts, and anything deferred to a later [[term:release|release]].

At an agency this one page does three jobs. It is the gate to [[term:go-live|go-live]]: follow the Oyelabs rule in the handbook card below. It usually starts the [[term:warranty|warranty]] clock and often triggers a milestone invoice, so the date matters commercially. And it separates defects from wishes: once the client has accepted the release against the criteria, a later "it should work differently" is a change request, not a warranty bug.

The PM prepares the form from the UAT results, the defect list and QA's retest evidence. The tech lead confirms the build and environment. The client sponsor or named UAT approver signs. The signed copy goes to the team, the account manager (for billing) and the project record, and is referenced in the go/no-go minutes.

The common mistake is accepting "looks good, go ahead" in chat. It names no build, lists no known issues and may come from someone without authority. The other is letting UAT turn into a redesign: new requests raised during UAT are logged as CRs and kept out of the acceptance decision.

Not legal advice: the signed contract always wins.`,
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Learn: Use the go-live checklist (Dynamics 365 implementation guide)", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-checklist", kind: "docs", verifiedAt: "2026-10-02T12:04:26Z" },
        { label: "Microsoft Learn: Test your solution before deployment (testing strategy, UAT)", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy", kind: "docs", verifiedAt: "2026-10-02T12:04:24Z" },
        { label: "Smartsheet: Free Project Sign-Off Templates", url: "https://www.smartsheet.com/content/project-sign-off-templates", kind: "article", verifiedAt: "2026-10-02T12:04:37Z" },
        { label: "Atlassian: Definition of Done (DoD)", url: "https://www.atlassian.com/agile/project-management/definition-of-done", kind: "article", verifiedAt: "2026-10-02T12:04:26Z" },
      ],
      video: {
        title: "How to get #UserAcceptanceTesting (UAT) Sign-offs easily",
        channel: "Business Analyst & Scrum Master In-Demand",
        url: "https://www.youtube.com/watch?v=lTRoxp4nGdo",
        videoId: "lTRoxp4nGdo",
        verifiedAt: "2026-10-02T12:05:39Z",
      },
      alternateVideos: [
        {
          title: "Business Analyst UAT Testing in Real Projects | Responsibilities, Defects & Sign-Off",
          channel: "Tejas Bhale - Think2change",
          url: "https://www.youtube.com/watch?v=S5fon51yPSc",
          videoId: "S5fon51yPSc",
          verifiedAt: "2026-10-02T12:05:39Z",
        },
      ],
      handbook: {
        stages: ["custom-qa-uat", "wl-builds-qa"],
        rules: ["uat-signoff-before-golive", "warranty-coverage"],
        templates: ["uat-signoff"],
      },
      sections: [
        {
          heading: "When it is used and who owns it",
          body: `Use it at the end of every UAT cycle that leads to a production release: the first go-live, and any later release large enough to need client acceptance. For white-label projects it closes the rebranded-builds UAT before store submission.

- **Fills it:** the PM, from the UAT tracker, the defect list and QA's retest notes.
- **Checks it:** the tech lead (build number, environment, that every "fixed" defect is in this build) and QA (results add up, nothing [[term:critical-issue|critical]] is open).
- **Signs it:** the client sponsor or the UAT approver named at kickoff, and the Oyelabs PM.
- **Receives it:** the delivery team, the account manager (a milestone invoice may depend on it), and the go/no-go meeting, which records it in the minutes.

Microsoft's go-live guidance sets the bar most agencies borrow: test all in-scope requirements including edge cases, use data and roles close to production, and get business sign-off on UAT, with every open item given an owner and a date. Typical contracts give the client a UAT window of 5–10 working days and say what happens if they stay silent (sometimes called deemed acceptance). Those are contract choices, so check yours.`,
        },
        {
          heading: "Field by field: what good entries look like",
          body: `**Release and build reference.** Good: "v1.0.0, build 52, [[term:uat-environment|UAT environment]], deployed 16 November". Mistake: "the latest version". If a hotfix build replaced it during UAT, the sign-off must name the build that will actually go live.

**UAT period and environment.** Good: start and end dates and the environment URL. Mistake: leaving out the dates, which matters when the contract counts a UAT window.

**Scenarios tested and results.** Good: totals that add up, by module if useful ("96 scenarios; 94 passed; 2 failed with minor defects"). Mistake: "most tests passed", which nobody can check.

**Open known issues accepted.** Good: each open defect with its ID, [[term:severity|severity]], a plain description, a workaround if any, and the target fix release. Mistake: hiding minor issues to make the page look clean. Anything not listed here may later be argued as "never accepted".

**Deferred items.** Good: anything moved to a later release by agreement, with the reference to where it was agreed. Mistake: mixing deferred scope with known defects; they are different things.

**Acceptance statement.** Good: one sentence that the client accepts this build as meeting the agreed acceptance criteria for go-live, subject to the listed known issues. Mistake: vague wording like "we are happy so far".

**Sign-off.** Good: name, role, date, and the form of signature your SOP accepts. Mistake: a chat message from someone not named as an approver.`,
        },
        {
          heading: "What is not a UAT defect",
          body: `UAT checks the build against what was agreed. During UAT clients raise three kinds of item, and only one of them blocks sign-off:

- **A defect:** the build does not meet an acceptance criterion. Severity decides whether it blocks. A [[term:blocker|blocker]] or critical defect must be fixed and retested before sign-off. Minor ones can usually be accepted as known issues with a fix date, if the contract allows.
- **A change:** "make the button darker", "add a filter here". The build meets the agreed design, so this is a [[term:change-request|change request]] or [[term:enhancement|enhancement]]. Log it and keep it out of the acceptance decision.
- **A [[term:clarification|clarification]]:** "why does the report show yesterday's data?" when that is the agreed behaviour. Explain it, point to the story, and move on.

If you let changes count as UAT failures, UAT never ends and the client gets free scope. If you dismiss real defects as changes, you lose trust. Check each item against the acceptance criteria, not against how strongly the client feels.`,
        },
        {
          heading: "What good looks like: a worked example",
          body: `A salon chain in Qatar is about to launch a Laravel booking platform with a React web front end. UAT ran from 9 to 18 November on build 52.

QA's export shows 96 scenarios: 94 passed. Two minor defects are open: a misaligned receipt footer and a slow CSV export above 5,000 rows. A critical notification defect found on day 3 was fixed in build 52 and retested on 18 November. The client also asked for a darker "Book now" button.

The PM drafts the sign-off: build 52, UAT 9–18 November, 96 tested and 94 passed, the two minor defects listed as known issues with v1.0.1 as the fix release, and nothing deferred. The button colour is logged as CR-006 in a separate email, because the approved design shows the current colour. The tech lead confirms build 52 is the go-live build. The PM sends the form to the named approver, the general manager, who signs on 20 November. The go/no-go minutes reference the signed form.`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **The client says "go live Friday" but will not sign.** Do not deploy on a chat message. Explain that the signature protects them too (it lists what they accepted), send the filled form, and offer a 15-minute call to walk it.
- **The client stays silent after the UAT window.** Check what the contract says. Some contracts treat silence as acceptance after notice; many do not. Either way, send a written reminder that names the date the window ended and what happens next.
- **A critical defect appears the day after sign-off, before go-live.** The sign-off does not oblige you to ship a broken build. Raise it at go/no-go, fix and retest, and record the change to the signed build in the minutes.
- **The signed build is not the one deployed.** If a hotfix was added after sign-off, list it in an addendum the client confirms. Otherwise warranty arguments start from an unclear baseline.
- **UAT keeps growing with new requests.** Close each round with a list: defects to fix, CRs logged, clarifications answered. Only defects reopen UAT.`,
        },
        {
          heading: "Your checklist",
          body: `1. Build number and environment confirmed by the tech lead.
2. UAT start and end dates recorded.
3. Scenario totals that add up, checked by QA.
4. No open critical or blocker defects.
5. Every open minor defect listed with ID, severity and target fix release.
6. Changes raised in UAT logged as CRs, not as defects.
7. Clear acceptance statement and the named approver's signature.
8. Signed copy sent to the team and account manager and referenced at go/no-go.`,
        },
      ],
      sop: [
        {
          title: "UAT sign-off procedure",
          prompt:
            "[Oyelabs SOP – admin to fill] How Oyelabs sends the UAT sign-off (template, tool, who sends it), which signature forms are accepted, the standard UAT window and deemed-acceptance wording Oyelabs uses in contracts, and where signed copies are stored.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-e01-uat-signoff-q1",
          prompt: "Which reference belongs in the \"Release and build reference\" field?",
          options: [
            "\"v1.0.0, build 52, UAT environment, deployed 16 November\"",
            "\"The latest version\"",
            "\"The one the client tested\"",
            "\"Release candidate\"",
          ],
          correctIndex: 0,
          explanation:
            "Only a specific build number and environment let you prove what was accepted. \"Latest\" changes with every deployment.",
        },
        {
          id: "pmp-e01-uat-signoff-q2",
          prompt:
            "During UAT the client asks for the \"Book now\" button to be darker. The approved design shows the current colour. How should the sign-off treat it?",
          options: [
            "Log it as a change request outside the acceptance decision",
            "List it as an open defect that blocks sign-off",
            "List it as an accepted known issue",
            "Fix it quietly before go-live",
          ],
          correctIndex: 0,
          explanation:
            "The build matches the approved design, so it is a change, not a defect. Counting it as a UAT failure gives free scope and delays acceptance; fixing it quietly hides scope.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e01-uat-signoff-q3",
          prompt: "Which of these should appear on a good UAT sign-off? (Select all that apply.)",
          options: [
            "Scenario totals that add up (tested, passed, failed)",
            "Each open minor defect with ID, severity and target fix release",
            "A statement that the client accepts the build against the agreed acceptance criteria",
            "The developers' hourly rates",
            "A promise that no further bugs will be found",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Results, accepted known issues and an acceptance statement make the page usable later. Rates are commercial data, and no sign-off can promise zero future defects.",
        },
        {
          id: "pmp-e01-uat-signoff-q4",
          prompt: "A critical defect is still open, and the client says: \"Sign-off given, we'll live with it.\" What should you do?",
          options: [
            "Do not proceed on that basis: fix and retest the critical defect, or escalate a documented go-live decision with the risk spelled out",
            "Accept the sign-off and go live",
            "Downgrade the defect to minor so the form looks clean",
            "Remove the defect from the list because the client accepted it",
          ],
          correctIndex: 0,
          explanation:
            "Critical defects normally block go-live, and relabelling them hides risk. If leadership on both sides still wants to launch, that is an explicit, recorded decision, not a casual sign-off.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e01-uat-signoff-q5",
          prompt: "Why does the UAT sign-off date matter commercially at an agency?",
          options: [
            "It often starts the warranty period and can trigger a milestone invoice",
            "It sets the developers' bonus",
            "It decides the hosting price",
            "It has no commercial effect",
          ],
          correctIndex: 0,
          explanation:
            "Many contracts tie warranty start and milestone billing to acceptance. Check your contract, but the date is rarely just paperwork.",
        },
        {
          id: "pmp-e01-uat-signoff-q6",
          prompt:
            "The UAT window in the contract ended three days ago and the client has said nothing. What is the best next step?",
          options: [
            "Check the contract's acceptance clause and send a written reminder naming the end date and what happens next",
            "Assume acceptance and deploy without telling them",
            "Extend UAT indefinitely until they reply",
            "Restart UAT from the beginning",
          ],
          correctIndex: 0,
          explanation:
            "Deemed acceptance exists only if the contract says so, and usually after notice. A written reminder protects both sides; deploying silently or waiting forever does not.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e01-uat-signoff-q7",
          prompt: "After sign-off on build 52, a hotfix creates build 53, which is what will go live. What should you do?",
          options: [
            "Record the change in an addendum or the go/no-go minutes and get the client to confirm build 53",
            "Nothing: build numbers do not matter",
            "Ship build 52 instead, even though it has the bug",
            "Restart full UAT on build 53 automatically",
          ],
          correctIndex: 0,
          explanation:
            "The signed build should be the deployed build. A short confirmation keeps the baseline clear without repeating all of UAT; a targeted retest of the fix is usually enough.",
        },
        {
          id: "pmp-e01-uat-signoff-q8",
          prompt: "Which client UAT comments should reopen UAT? (Select all that apply.)",
          options: [
            "\"The booking confirmation email is not sent\" when the story requires it",
            "\"Refunds over 500 fail with an error\" when refunds are in scope",
            "\"Can we add a loyalty badge?\"",
            "\"Why does the report show yesterday's data?\" when that is the agreed behaviour",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Only failures against acceptance criteria are defects. A new badge is a change request and the report question is a clarification; neither should reopen UAT.",
        },
        {
          id: "pmp-e01-uat-signoff-q9",
          prompt: "The QA export says 96 scenarios, 94 passed, 2 failed (minor). The draft sign-off says \"98% passed, all good\". What is wrong?",
          options: [
            "It hides the two open defects, which must be listed as accepted known issues with fix dates",
            "Nothing: 98% is a pass",
            "It should say 100% to reassure the client",
            "Percentages are not allowed on the form",
          ],
          correctIndex: 0,
          explanation:
            "Unlisted defects can later be argued as never accepted. Name them, their severity and their fix release; the percentage alone hides that.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "uat-signoff",
        prompt:
          "Prepare the UAT sign-off form for the client to sign, from the QA export and the client's email. Decide what blocks sign-off and what does not.",
        context: `**QA export – UAT on build 52 (UAT environment), 9–18 November**

| Module | Scenarios | Passed | Failed | Notes |
|---|---|---|---|---|
| Booking | 38 | 38 | 0 | DEF-39 Critical (no SMS) fixed in build 52, retested 18 Nov |
| Payments | 24 | 23 | 1 | DEF-41 Minor: receipt PDF footer misaligned |
| Admin reports | 20 | 19 | 1 | DEF-44 Minor: CSV export slow above 5,000 rows |
| Notifications | 14 | 14 | 0 | |

Tech lead: build 52 is the go-live build; DEF-41 and DEF-44 planned for v1.0.1.

**Email from the client's general manager (named UAT approver), 19 November:**

> Looks great overall. The CSV export issue can wait. One thing: the "Book now" button should be darker, please fix before we go live. Can we launch next Friday?`,
        fields: [
          { id: "build", label: "Release and build reference", input: "text", required: true },
          { id: "tested", label: "Scenarios tested", input: "number", required: true },
          { id: "passed", label: "Scenarios passed", input: "number", required: true },
          { id: "openIssues", label: "Number of open known issues to accept", input: "number", required: true },
          { id: "knownIssues", label: "Open known issues accepted (ID, severity, fix release)", input: "textarea", required: true },
          {
            id: "buttonColour",
            label: "The darker button request is",
            input: "select",
            options: ["A defect that blocks sign-off", "A change request outside the acceptance decision", "An accepted known issue", "A clarification"],
            required: true,
          },
          {
            id: "decision",
            label: "Sign-off recommendation",
            input: "select",
            options: [
              "Ready for sign-off with the listed known issues accepted",
              "Hold sign-off until every minor defect is fixed",
              "Hold sign-off until the button colour is changed",
              "Go live without written sign-off",
            ],
            required: true,
          },
          { id: "acceptance", label: "Acceptance statement", input: "textarea", required: true },
          { id: "cover", label: "Covering note to the general manager (short)", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "tested", expected: 96 },
          { fieldId: "passed", expected: 94 },
          { fieldId: "openIssues", expected: 2 },
          { fieldId: "buttonColour", expected: "A change request outside the acceptance decision" },
          { fieldId: "decision", expected: "Ready for sign-off with the listed known issues accepted" },
        ],
        rubric: [
          {
            label: "Known issues listed properly",
            points: 2,
            description: "Lists DEF-41 and DEF-44 as minor, with a plain description and v1.0.1 as the fix release; notes DEF-39 was critical and is fixed and retested.",
          },
          {
            label: "Build and period are precise",
            points: 1,
            description: "Names build 52 on the UAT environment and the 9–18 November period.",
          },
          {
            label: "Covering note keeps the gate",
            points: 2,
            description: "Asks for written signature before Friday's launch, explains the button colour is logged as a CR with an estimate, and confirms what the client is accepting.",
          },
        ],
        sampleAnswer: {
          build: "v1.0.0, build 52, UAT environment",
          tested: "96",
          passed: "94",
          openIssues: "2",
          knownIssues:
            "DEF-41 (minor): receipt PDF footer misaligned – fix in v1.0.1. DEF-44 (minor): CSV export slow above 5,000 rows – fix in v1.0.1. DEF-39 (critical, no SMS) fixed in build 52 and retested 18 Nov.",
          buttonColour: "A change request outside the acceptance decision",
          decision: "Ready for sign-off with the listed known issues accepted",
          acceptance:
            "The client accepts v1.0.0 build 52 as meeting the agreed acceptance criteria for go-live, subject to the two known issues listed, which Oyelabs will fix in v1.0.1.",
          cover:
            "Thanks for completing UAT. The attached form lists the results (94 of 96 passed) and the two minor issues we'll fix in v1.0.1. The darker button isn't a defect against the approved design, so I've logged it as CR-006 and will send an estimate tomorrow; it doesn't block launch. Once you sign the form we can confirm Friday at the go/no-go call.",
        },
      },
    },

    // ---------------------------------------------------------------------------------------------
    // CR form
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-e01-cr-form",
      moduleId: "pmp-e01",
      trackId: "pm",
      title: "Change request (CR) form",
      summary: `The change request form is how an agency says "yes, and here is what it costs" in writing. It describes a requested change to the signed [[term:scope-baseline|scope baseline]], classifies it, shows its impact on scope, effort, timeline and cost, lists the assumptions, and captures written approval before any work starts.

It matters because [[term:scope-creep|scope creep]] rarely arrives as one big request. It arrives as twenty small "quick" changes accepted in chat, each one eating sprint capacity until the milestone slips and nobody can say why. A filled CR form makes each change visible, priced and approved, and leaves an audit trail when the client later asks why the date moved or the invoice grew.

The PM writes the CR, with the effort [[term:estimate|estimate]] from the tech lead. BD or the account manager confirms the price against the [[term:rate-card|rate card]] and the contract. The client sponsor or named approver approves it in writing. Follow the Oyelabs rules in the handbook cards below for when a CR is needed and who approves it. The approved CR goes to the delivery team, into the backlog and the plan, and to finance if it changes billing.

The common mistakes are starting work "while the CR is being signed", writing a CR with no new date when the timeline clearly moves, and classifying a real change as a [[term:bug|bug]] to avoid an awkward conversation.

Not legal advice: the signed contract always wins.`,
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Atlassian: IT Change Management (ITIL framework and best practices)", url: "https://www.atlassian.com/itsm/change-management", kind: "docs", verifiedAt: "2026-10-02T12:04:17Z" },
        { label: "Asana: Change Control Process (5 steps and form fields)", url: "https://asana.com/resources/change-control-process", kind: "article", verifiedAt: "2026-10-02T12:04:18Z" },
        { label: "ProjectManager: Change Request Form (free Word template)", url: "https://www.projectmanager.com/templates/change-request-form", kind: "article", verifiedAt: "2026-10-02T12:04:35Z" },
        { label: "Atlassian: Change Advisory Board (CAB) explained", url: "https://www.atlassian.com/itsm/change-management/change-advisory-board", kind: "article", verifiedAt: "2026-10-02T12:04:36Z" },
      ],
      video: {
        title: "Change Management Process & Request Form Template | TeamGantt",
        channel: "TeamGantt",
        url: "https://www.youtube.com/watch?v=VBNixWI8YzI",
        videoId: "VBNixWI8YzI",
        verifiedAt: "2026-10-02T12:05:38Z",
      },
      alternateVideos: [
        {
          title: "What is a CHANGE REQUEST? PMBOK Key Concepts in Project Management",
          channel: "David McLachlan",
          url: "https://www.youtube.com/watch?v=ZdpoQLfiznQ",
          videoId: "ZdpoQLfiznQ",
          verifiedAt: "2026-10-02T12:05:38Z",
        },
      ],
      handbook: {
        stages: ["custom-scope-control"],
        rules: ["cr-when-needed", "cr-approval", "billing-change-request"],
        templates: ["cr-form"],
      },
      interactive: {
        kind: "decision-tool",
        request: "Please send booking confirmations on WhatsApp instead of SMS.",
      },
      sections: [
        {
          heading: "When it is used and who owns it",
          body: `Raise a CR form whenever a request changes something the client has signed: the scope baseline, [[term:acceptance-criteria|acceptance criteria]], approved designs, the timeline or the cost. Use the decision tool above when you are not sure whether a request is a CR, an [[term:enhancement|enhancement]], a [[term:new-feature|new feature]], a bug or a [[term:clarification|clarification]].

Asana describes change control in five steps: initiation, assessment, analysis and decision, implementation, and closure. The form carries the request through all five.

- **Fills it:** the PM, within a day or two of the request (typical), even if the estimate is still pending.
- **Estimates it:** the tech lead, with QA and design effort where relevant.
- **Prices it:** BD or the account manager, against the rate card and the contract's [[term:payment-terms|payment terms]].
- **Approves it:** the client sponsor or the named approver, in writing. The person who asked is often not the person who can approve.
- **Receives it:** the delivery team (backlog and plan), finance (billing), and the project record. Mention approved CRs in the next [[term:status-report|status report]].

On a [[term:time-and-materials|time-and-materials]] contract the CR still matters, because it moves the plan and the client's budget forecast, even if no fixed price changes.`,
        },
        {
          heading: "Field by field: details to classification",
          body: `**CR details (ID, date, requested by, project).** Good: a sequential ID (CR-007), the date of the request, the person and their role, and the channel ("operations manager, email 14 November"). Mistake: no ID, so three emails about "the WhatsApp change" cannot be told apart.

**Description of the change.** Good: what changes from what, in plain words, with a reference to the signed baseline ("Booking confirmations move from SMS (story BK-12) to WhatsApp templates; SMS remains as fallback"). Mistake: copying the client's one-line email, which leaves the details to argue about later.

**Reason and business value.** Good: the client's reason in their words, ideally with a number ("Customers ignore SMS; the client expects fewer no-shows"). Mistake: leaving it empty. The reason helps the sponsor approve, and helps you suggest a cheaper option.

**Classification.** Good: change request, enhancement or new feature, with the reason ("CR: SMS confirmations are specified in the signed PRD v1.2, story BK-12"). Mistake: labelling it a bug to avoid a price conversation. If the build matches the signed version, it is not a bug.`,
        },
        {
          heading: "Field by field: impact to approval",
          body: `**Impact on scope.** Good: what is added, changed or removed, including admin, QA and documentation work. Mistake: listing only the developer task and forgetting template approval, testing on real devices or a new third-party account.

**Effort estimate.** Good: split by role (development, QA, PM, design) with a total. Mistake: a single "2 days" from a developer's gut feeling, without QA.

**Impact on timeline and milestones.** Good: which milestone moves, from which date to which date, or why it does not move ("absorbed in sprint 6 by moving story RP-4 to sprint 7"). Mistake: "minor impact". If the date moves and the CR does not say so, the client will remember only the delay.

**Cost and payment terms.** Good: the price or the basis (rate card, fixed price for this CR, or hours on [[term:time-and-materials|T&M]]) and when it is invoiced. Mistake: "TBD" on a form sent for approval. Follow the Oyelabs rule in the handbook card below for billing.

**Assumptions and exclusions.** Good: what the estimate relies on, with owners and dates ("Client provides a verified WhatsApp Business account and approved message templates by 27 November"). Mistake: no assumptions, so a late client dependency becomes your delay.

**Risks.** Good: one or two real risks ("Template approval by the messaging provider can take days"). Mistake: copying the project's whole risk list.

**Approval.** Good: the named approver's signature and date, plus Oyelabs PM and account manager. Mistake: approval from the person who asked, when they are not the named approver.`,
        },
        {
          heading: "What good looks like: a worked example",
          body: `A salon chain in the UAE has a Laravel booking platform in build. The signed PRD (story BK-12) says booking confirmations are sent by SMS. On 14 November the marketing manager emails: "Please switch confirmations to WhatsApp, customers ignore SMS. Should be a small change?"

The PM checks the PRD: SMS is specified, so this is a change request, not a bug. The tech lead estimates 4 days of development (WhatsApp provider integration, template management in admin, SMS fallback), 1.5 days of QA and 0.5 day of PM: 6 days in total. Milestone 3 (4 December) moves by one week to 11 December, because sprint 6 is already full.

The PM writes CR-007 with the description, the reason in the client's words, the classification with the PRD reference, the impact, the effort split, the new milestone date, the cost basis confirmed by the account manager, and the key assumption: the client provides a verified WhatsApp Business account and approved templates by 27 November. The PM sends it to the CEO, the named approver, and copies the marketing manager. No work starts until the CEO approves in writing on 18 November. The next status report lists CR-007 as approved with the new date.`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **Work started before approval.** Stop adding to it, finish the CR form within a day, and tell the client plainly that work is paused until approval. If you have to absorb the effort already spent, record that as a decision so it does not become the norm.
- **The client refuses to pay: "it's tiny".** Offer options rather than a flat no: swap it for something of similar size, defer it to [[term:phase-2|phase 2]], or approve it with the new date. Small changes add up; the form is how you show that.
- **The person asking is not the approver.** Thank them, send the CR to the named approver, and copy them in. Never treat their "go ahead" as approval.
- **The CR moved the date but the form said "no impact".** Issue a revised CR now, with the honest date, before the status report shows the slip.
- **Ten tiny requests arrive in one week.** Bundle them into one CR with line items, so the client sees the total.`,
        },
        {
          heading: "Your checklist",
          body: `1. Checked the request against the signed baseline and classified it, with the reference.
2. CR ID, date, requester and channel recorded.
3. Description says what changes from what.
4. Effort split by role from the tech lead, with a total.
5. Milestone impact stated as old date to new date, or why it does not move.
6. Cost or cost basis confirmed by BD or the account manager.
7. Assumptions with owners and dates.
8. Sent to the named approver; no work before written approval.
9. Approved CR added to the backlog, plan and the next status report.`,
        },
      ],
      sop: [
        {
          title: "CR numbering, pricing and routing",
          prompt:
            "[Oyelabs SOP – admin to fill] How Oyelabs numbers CRs, where the CR register lives, who confirms the price and against which rate card, the turnaround Oyelabs promises for a CR estimate, and how small changes are handled if Oyelabs allows any buffer.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-e01-cr-form-q1",
          prompt:
            "The signed PRD specifies SMS booking confirmations. The client now asks for WhatsApp instead. How should the CR form classify it?",
          options: [
            "Change request, because it changes agreed behaviour in the signed PRD",
            "Bug, because the client is unhappy with SMS",
            "Clarification, because it is about notifications",
            "Warranty claim",
          ],
          correctIndex: 0,
          explanation:
            "The build matches what was signed, so it is not a bug. Moving from SMS to WhatsApp changes agreed behaviour, which makes it a change request.",
        },
        {
          id: "pmp-e01-cr-form-q2",
          prompt: "Which of these belong in the \"Impact on scope\" and \"Effort estimate\" fields? (Select all that apply.)",
          options: [
            "Message template management in the admin panel",
            "QA effort, including testing on real devices",
            "PM effort for coordinating the provider account",
            "The developer's opinion of the client",
            "The total project budget since kickoff",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Scope and effort must include every role the change touches, not just the developer task. Opinions and the whole project budget do not belong on a single CR.",
        },
        {
          id: "pmp-e01-cr-form-q3",
          prompt:
            "The marketing manager who requested the change replies \"approved, go ahead\". The SOW names the CEO as CR approver. What do you do?",
          options: [
            "Send the CR to the CEO for written approval, copying the marketing manager, and start no work until it arrives",
            "Start work: the requester approved it",
            "Ask the marketing manager to approve again in capital letters",
            "Approve it yourself as PM",
          ],
          correctIndex: 0,
          explanation:
            "Approval must come from someone with authority. A requester's \"go ahead\" can be disowned later, leaving Oyelabs with unpaid work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e01-cr-form-q4",
          prompt: "Which entry is the best \"Impact on timeline\" for a CR that cannot fit into the current sprint?",
          options: [
            "\"Milestone 3 moves by one week, from 4 December to 11 December\"",
            "\"Minor impact\"",
            "\"To be confirmed after approval\"",
            "\"No impact if the team works harder\"",
          ],
          correctIndex: 0,
          explanation:
            "Old date to new date is what the approver needs to decide. \"Minor\" or \"TBC\" hides a slip the client will hold against you later.",
        },
        {
          id: "pmp-e01-cr-form-q5",
          prompt:
            "You discover developers spent two days on a change before the CR was approved. What is the best recovery?",
          options: [
            "Pause the work, complete and send the CR within a day, and record any absorbed effort as an explicit decision",
            "Keep going and bill it later without telling the client",
            "Delete the work and say nothing",
            "Classify it as a bug fix so no approval is needed",
          ],
          correctIndex: 0,
          explanation:
            "Pausing and formalising restores control. Billing unapproved work or relabelling it as a bug damages trust and the audit trail.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e01-cr-form-q6",
          prompt: "Which are good entries for the \"Assumptions and exclusions\" field of a WhatsApp CR? (Select all that apply.)",
          options: [
            "Client provides a verified WhatsApp Business account by 27 November",
            "Message templates are approved by the provider before QA starts",
            "SMS remains as a fallback; no other channels included",
            "The client will be reasonable",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Good assumptions are specific, owned and dated, and exclusions say clearly what is not included. \"Reasonable\" cannot be tested.",
        },
        {
          id: "pmp-e01-cr-form-q7",
          prompt: "The client says: \"It's a tiny change, just do it.\" What should the PM offer instead of a flat no?",
          options: [
            "Options: swap it for work of similar size, defer it to phase 2, or approve it with its cost and new date",
            "Do it for free to keep the client happy",
            "Refuse and escalate to leadership straight away",
            "Do it without a CR but log the hours secretly",
          ],
          correctIndex: 0,
          explanation:
            "Options keep the relationship and the baseline. Free work sets a precedent, and immediate escalation is out of proportion for one request.",
        },
        {
          id: "pmp-e01-cr-form-q8",
          prompt: "Over one week a client sends ten small requests, each \"just a few minutes\". What is the best way to use the CR form?",
          options: [
            "Bundle them into one CR with line items and a total, so the client sees the combined impact",
            "Do them all, since each one is small",
            "Raise ten separate CRs and send them one per day",
            "Ignore them until UAT",
          ],
          correctIndex: 0,
          explanation:
            "Scope creep hides in small items. One CR with line items shows the true total and is easier to approve than ten separate forms.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-e01-cr-form-q9",
          prompt: "On a time-and-materials contract, why still raise a CR?",
          options: [
            "It changes the plan, the dates and the client's budget forecast, so it still needs a visible decision",
            "It does not need one; T&M work is never changed",
            "Only to calculate a fixed price",
            "Because CRs are required by law",
          ],
          correctIndex: 0,
          explanation:
            "Even when hours are billed as used, the client should approve changes that move dates and spending. Otherwise the final bill surprises them.",
        },
        {
          id: "pmp-e01-cr-form-q10",
          prompt: "Who normally confirms the price on a CR before it goes to the client?",
          options: [
            "BD or the account manager, against the rate card and the contract",
            "The developer who estimated it",
            "The client's finance team",
            "QA",
          ],
          correctIndex: 0,
          explanation:
            "The tech lead owns effort; the commercial owner owns price and payment terms. Mixing them up leads to inconsistent pricing across CRs.",
        },
      ],
      practice: {
        kind: "form",
        variant: "cr",
        templateId: "cr-form",
        prompt:
          "Write CR-007 from the client's email, the PRD extract and the tech lead's note. Fill every field as you would before sending it for approval.",
        context: `**Email from the client's marketing manager, 14 November:**

> Hi, customers ignore our SMS. Please switch booking confirmations to WhatsApp. Should be a small change? We'd love it before launch. Thanks!

**PRD v1.2 (signed), story BK-12:** "The customer receives a booking confirmation by SMS within one minute."

**SOW:** change requests are approved in writing by the CEO.

**Tech lead note:** WhatsApp provider integration plus template management in admin, keep SMS as fallback. Dev 4 days, QA 1.5 days, PM 0.5 day. Sprint 6 is full, so milestone 3 (**4 December**) moves one week. Needs the client's verified WhatsApp Business account and approved message templates by 27 November.

**Account manager:** price per the rate card, invoiced with milestone 3.`,
        fields: [
          { id: "crId", label: "CR ID", input: "text", required: true },
          { id: "requestedBy", label: "Requested by (role, channel, date)", input: "text", required: true },
          { id: "description", label: "Description of the change", input: "textarea", required: true },
          { id: "reason", label: "Reason and business value", input: "textarea", required: true },
          {
            id: "classification",
            label: "Classification",
            input: "select",
            options: ["Change request", "Bug", "Clarification", "Bug under warranty"],
            required: true,
          },
          { id: "scopeImpact", label: "Impact on scope", input: "textarea", required: true },
          { id: "effortDays", label: "Total effort (days)", input: "number", required: true },
          { id: "newMilestone", label: "New milestone 3 date", input: "date", required: true },
          { id: "cost", label: "Cost and payment terms", input: "textarea", required: true },
          { id: "assumptions", label: "Assumptions and exclusions", input: "textarea", required: true },
          {
            id: "approver",
            label: "Approver",
            input: "select",
            options: ["Marketing manager", "CEO", "Oyelabs tech lead", "Oyelabs PM"],
            required: true,
          },
        ],
        checks: [
          { fieldId: "classification", expected: "Change request" },
          { fieldId: "effortDays", expected: 6 },
          { fieldId: "newMilestone", expected: "2026-12-11" },
          { fieldId: "approver", expected: "CEO" },
        ],
        rubric: [
          {
            label: "Description references the baseline",
            points: 2,
            description: "States the change from SMS (PRD v1.2, story BK-12) to WhatsApp, with SMS kept as fallback, and justifies the CR classification with that reference.",
          },
          {
            label: "Impact is complete",
            points: 2,
            description: "Covers the provider integration, admin template management, QA and PM effort split by role, and milestone 3 moving from 4 to 11 December.",
          },
          {
            label: "Assumptions protect the date",
            points: 1,
            description: "Names the verified WhatsApp Business account and approved templates by 27 November, owned by the client, and what happens to the date if they are late.",
          },
          {
            label: "Commercials and approval are clear",
            points: 1,
            description: "Gives the rate-card basis and invoicing with milestone 3, and routes approval to the CEO with the marketing manager copied.",
          },
        ],
        sampleAnswer: {
          crId: "CR-007",
          requestedBy: "Marketing manager, by email, 14 November",
          description:
            "Booking confirmations change from SMS (PRD v1.2, story BK-12) to WhatsApp message templates. SMS remains as a fallback when WhatsApp delivery fails.",
          reason: "The client reports customers ignore SMS; WhatsApp confirmations are expected to reduce missed bookings.",
          classification: "Change request",
          scopeImpact:
            "New WhatsApp provider integration; template management in the admin panel; fallback logic to SMS; QA on real devices; PM coordination of the provider account and template approval.",
          effortDays: "6",
          newMilestone: "2026-12-11",
          cost: "Priced per the agreed rate card for 6 days (dev 4, QA 1.5, PM 0.5); invoiced with milestone 3.",
          assumptions:
            "Client provides a verified WhatsApp Business account and provider-approved templates by 27 November; a later date moves milestone 3 day for day. Excludes other channels and two-way chat.",
          approver: "CEO",
        },
      },
    },
  ],
} satisfies Module;
