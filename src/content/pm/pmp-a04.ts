import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a04",
  trackId: "pm",
  name: "Custom lifecycle: Client kickoff",
  description:
    "The first delivery meeting with the client: confirming goals, scope and the plan, naming SPOCs and approvers, agreeing cadence and the escalation path, and turning the client's own obligations into dated dependencies. Then the governance that keeps those expectations true for the rest of the project.",
  topics: [
    {
      id: "pmp-a04-client-kickoff",
      moduleId: "pmp-a04",
      trackId: "pm",
      title: "Running the client kickoff",
      summary:
        "The client kickoff is the first meeting where the client meets the delivery team and the PM takes over from BD as the main contact. It is typically 60 to 90 minutes in the first week. The stage card below has its entry and exit criteria, RACI and pitfalls.\n\nWhy it matters at an agency: everything you agree here becomes the reference point for the next months. The client's memory of the sales calls is generous: features mentioned once feel included. The kickoff replaces that memory with a shared, written picture: the goals, what is in and [[term:out-of-scope]], the [[term:milestone|milestones]], who decides, how you will communicate and what the client must deliver, and when.\n\nHow to run it:\n\n- **Send the agenda in advance**, built on the kickoff agenda template, so the right people come and nothing is a surprise.\n- **Make sure a decision-maker is in the room.** If the sponsor cannot attend, the meeting cannot confirm goals or approvers.\n- **Walk through scope and out of scope**, not just the feature list. Name anything discussed in sales but not sold.\n- **Name the [[term:spoc]], the approver for each gate and the [[term:escalation-matrix|escalation path]].**\n- **Turn client obligations into [[term:client-dependency|client dependencies]] with dates**: content, accounts, keys, test data, reviewers' time.\n- **Send the [[term:mom]] within a day**, following the Oyelabs rule in the handbook card below.\n\nThe common mistake is running it as a celebration with slides about the agency. A friendly kickoff with nothing written down is the start of most scope disputes.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Atlassian Team Playbook: Project kickoff", url: "https://www.atlassian.com/team-playbook/plays/project-kickoff", kind: "docs", verifiedAt: "2026-10-02T11:53:21Z" },
        { label: "ProjectManager: How to create a kickoff meeting agenda", url: "https://www.projectmanager.com/blog/kickoff-meeting-agenda", kind: "article", verifiedAt: "2026-10-02T12:04:29Z" },
        { label: "The Digital Project Manager: Project kickoff guide", url: "https://thedigitalprojectmanager.com/project-management/project-kickoff-guide/", kind: "article", verifiedAt: "2026-10-02T11:58:55Z" },
        { label: "Atlassian: How to nail your project kickoff meeting", url: "https://www.atlassian.com/work-management/project-management/project-kickoff", kind: "article", verifiedAt: "2026-10-02T12:06:32Z" },
      ],
      video: {
        title: "Client Kickoff Meeting Agenda | How To Set the Stage for Success",
        channel: "The Digital Project Manager",
        url: "https://www.youtube.com/watch?v=ZnWZQ3G-HkM",
        videoId: "ZnWZQ3G-HkM",
        verifiedAt: "2026-10-02T12:16:59Z",
      },
      alternateVideos: [
        {
          title: "Kickoff Best Practices | How to Run a Client Kickoff Meeting Successfully",
          channel: "The Digital Project Manager",
          url: "https://www.youtube.com/watch?v=4ESb9qoXVyo",
          videoId: "4ESb9qoXVyo",
          verifiedAt: "2026-10-02T12:16:59Z",
        },
        {
          title: "Best Project Kickoff Meeting Checklist - Project Management Training",
          channel: "ProjectManager",
          url: "https://www.youtube.com/watch?v=LOCkV-mENq8",
          videoId: "LOCkV-mENq8",
          verifiedAt: "2026-10-02T12:16:59Z",
        },
      ],
      handbook: {
        stages: ["custom-client-kickoff"],
        rules: ["mom-after-every-client-meeting", "escalation-levels"],
        templates: ["kickoff-agenda", "mom", "escalation-matrix-template"],
      },
      sections: [
        {
          heading: "A 75-minute client kickoff",
          body:
            "1. **Introductions and roles (10 min).** Both teams, with what each person will do. Keep the Oyelabs part short.\n2. **Goals and success criteria (10 min).** Ask the sponsor: \"What has to be true six months after launch for this to be a success?\" Write the answer down.\n3. **Scope and out of scope (15 min).** The SOW feature list, then the [[term:out-of-scope]] list. Name anything that came up in sales but was not sold, and where it goes (a later phase, or a [[term:change-request]]).\n4. **Plan and milestones (10 min).** The gates: requirement [[term:sign-off]], [[term:design-approval]], [[term:uat]] and [[term:go-live]], and the dates.\n5. **Team, [[term:raci]] and SPOCs (5 min).** The client SPOC, and who approves each gate.\n6. **Communication and escalation (5 min).** Stand-up or not, the weekly [[term:status-report]], demo cadence, tools, the escalation matrix.\n7. **Client dependencies (10 min).** Every input the client owes, with an owner and a date.\n8. **Risks and assumptions (5 min).** The few that need the client's attention.\n9. **Next steps (5 min).** Discovery workshop dates, the first status report date, who sends what.",
        },
        {
          heading: "Before and after",
          body:
            "**Before:** the internal kickoff is done; the agenda is sent two working days ahead, with a request that the sponsor attends; BD has introduced the PM by email; the RACI and escalation matrix are drafted.\n\n**After:** the MoM goes out within a day with decisions, owners and dates; the escalation matrix and RACI are attached; the client dependencies are in the plan and the [[term:raid-log]]; discovery sessions are in the calendar.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **No decision-maker present.** Recover: hold the meeting, but mark goals and approvers as \"to confirm\", and book 20 minutes with the sponsor within the week.\n- **Out of scope not stated.** Recover: list it in the MoM and ask the sponsor to reply to confirm.\n- **Client dependencies left vague** (\"we'll send the content soon\"). Recover: put a date and an owner on each one in the MoM. If they will not commit to a date, log the risk.\n- **BD keeps answering scope questions.** Recover: agree beforehand that BD introduces, then the PM leads, and BD speaks on commercial points only.\n- **No MoM.** Recover: send it now, even late. Without it there is no record of what was agreed.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Agenda sent in advance; sponsor confirmed.\n2. Goals and success criteria written in the sponsor's words.\n3. Scope and out of scope walked through.\n4. SPOC and the approver for each gate named.\n5. Cadence, tools and escalation matrix agreed.\n6. Client dependencies with owners and dates.\n7. Discovery sessions scheduled.\n8. MoM sent within a day.",
        },
      ],
      sop: [
        {
          title: "Kickoff deck and invite",
          prompt: "[Oyelabs SOP – admin to fill] The Oyelabs client kickoff deck (if any), the invite wording, which Oyelabs people attend (PM, tech lead, BD, delivery head) and the default meeting tool.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a04-client-kickoff-q1",
          prompt: "Which are exit criteria of the client kickoff? (Select all that apply.)",
          options: [
            "MoM sent with confirmed SPOCs, cadence and next steps",
            "Escalation matrix shared",
            "Client dependencies listed with dates",
            "Requirements signed off",
            "Designs approved",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Sign-off and design approval come later. The kickoff ends with a written record of who, how and what the client owes, and discovery scheduled.",
        },
        {
          id: "pmp-a04-client-kickoff-q2",
          prompt: "The sponsor sends their assistant to the kickoff \"to take notes\". What do you do?",
          options: [
            "Run it, mark goals and approvers as to confirm, and book a short session with the sponsor this week",
            "Cancel the kickoff",
            "Treat the assistant as the approver",
            "Skip goals and approvers entirely",
          ],
          correctIndex: 0,
          explanation: "You can still cover scope, cadence and dependencies, but decisions need the decision-maker. Do not let it slip past the week.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a04-client-kickoff-q3",
          prompt: "During the kickoff, the client says \"and of course the Arabic version, as discussed\". The SOW lists Arabic as out of scope. What is the best response?",
          options: [
            "Acknowledge it, say the SOW has Arabic out of scope, and offer to price it as a later phase or a change request; record it in the MoM",
            "Agree, to keep the mood positive",
            "Say nothing and deal with it in UAT",
            "Tell the client BD made a mistake",
          ],
          correctIndex: 0,
          explanation: "The kickoff is the cheapest moment to correct a sales-call memory. Be calm, cite the SOW, offer a path, and write it down.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a04-client-kickoff-q4",
          prompt: "Why turn client obligations into dated client dependencies?",
          options: [
            "So delays caused by missing inputs are visible and can be tracked and discussed fairly",
            "To blame the client later",
            "Because the SOW requires dates for everything",
            "It is not needed; clients know what they owe",
          ],
          correctIndex: 0,
          explanation: "Dated dependencies make the plan honest. Without them, a late input looks like an agency delay.",
        },
        {
          id: "pmp-a04-client-kickoff-q5",
          prompt: "When should the kickoff MoM go out?",
          options: ["Within a day, following the Oyelabs MoM rule", "At the end of the project", "Only if the client asks", "After discovery"],
          correctIndex: 0,
          explanation: "Fresh minutes catch misunderstandings while people remember the meeting.",
        },
        {
          id: "pmp-a04-client-kickoff-q6",
          prompt: "What is the role of the BD or account manager in the client kickoff?",
          options: [
            "Introduce the PM, support on commercial questions, and hand the lead to the PM",
            "Run the whole meeting",
            "Approve the requirements",
            "Not attend",
          ],
          correctIndex: 0,
          explanation: "The kickoff is where the client's main contact moves to the PM. BD stays for commercial continuity, not scope answers.",
        },
        {
          id: "pmp-a04-client-kickoff-q7",
          prompt: "Which questions help you capture goals and success criteria? (Select all that apply.)",
          options: [
            "What has to be true six months after launch for this to be a success?",
            "Which numbers will you look at to judge it?",
            "Who will use it first, and what do they do today instead?",
            "Do you like our logo?",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Success criteria are measurable and tied to the client's business. They later help decide what is essential when time is short.",
        },
        {
          id: "pmp-a04-client-kickoff-q8",
          prompt: "The client says, \"We'll send content when it's ready.\" What is the right follow-up?",
          options: [
            "Agree an owner and a date, explain which milestone depends on it, and record it in the MoM",
            "Accept it and wait",
            "Write the content yourself",
            "Start development without content and fix it later at no cost",
          ],
          correctIndex: 0,
          explanation: "\"When it's ready\" is the most expensive phrase in an agency project. Tie it to a date and a milestone.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a04-client-kickoff-q9",
          prompt: "What should already be done before the client kickoff?",
          options: [
            "The internal kickoff, and the agenda sent to the client in advance",
            "The requirement sign-off",
            "The first sprint",
            "The UAT plan",
          ],
          correctIndex: 0,
          explanation: "Those are the stage's entry criteria. The team is aligned and the client knows what will be covered.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        templateId: "kickoff-agenda",
        prompt:
          "Draft the client kickoff agenda from the BD handover note. Fill every field; choose the SPOC, the approver and the status cadence from the note.",
        context: `**From:** Account manager
**To:** PM
**Subject:** Handover – B2B ordering portal, building-supplies distributor, Australia

Signed Friday, fixed bid. React web portal for trade customers + Laravel admin. 20 weeks.

SOW milestones: requirement sign-off week 3, design approval week 6, UAT weeks 17–18, go-live week 20.

People: the **managing director** is the sponsor and signs requirement, design and UAT approvals. Day to day we deal with the **e-commerce manager**, who will gather feedback from the branches. Their IT contractor runs the ERP.

Out of scope (SOW 5.2): a native mobile app, and two-way ERP sync (we import a nightly product and price file only). The MD asked about "live stock from the ERP" on the last sales call; I said we'd look at it later.

Client owes: nightly ERP export sample by end of week 2 (IT contractor), product images by week 8, payment gateway merchant account by week 10.

The MD wants a short written update **every Friday**. Kickoff is Tuesday, 75 minutes, video call.`,
        fields: [
          { id: "goals", label: "Project goals and success criteria", input: "textarea", required: true },
          { id: "scope", label: "Scope summary and out-of-scope items", input: "textarea", required: true },
          { id: "milestones", label: "Timeline and milestones", input: "textarea", required: true },
          {
            id: "spoc",
            label: "Client SPOC",
            input: "select",
            options: ["Managing director", "E-commerce manager", "IT contractor", "Oyelabs account manager"],
            required: true,
          },
          {
            id: "approver",
            label: "Approver for requirements, designs and UAT",
            input: "select",
            options: ["Managing director (sponsor)", "E-commerce manager", "IT contractor", "Oyelabs PM"],
            required: true,
          },
          {
            id: "cadence",
            label: "Written status report cadence",
            input: "select",
            options: ["Daily", "Weekly, on Fridays", "Fortnightly", "Monthly"],
            required: true,
          },
          { id: "goLiveWeek", label: "Go-live week", input: "number", required: true },
          { id: "dependencies", label: "Client dependencies, owners and dates", input: "textarea", required: true },
          { id: "risks", label: "Risks and assumptions to raise", input: "textarea", required: true },
          { id: "nextSteps", label: "Next steps", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "spoc", expected: "E-commerce manager" },
          { fieldId: "approver", expected: "Managing director (sponsor)" },
          { fieldId: "cadence", expected: "Weekly, on Fridays" },
          { fieldId: "goLiveWeek", expected: 20 },
        ],
        rubric: [
          {
            label: "Out of scope is explicit, including the sales-call ask",
            points: 2,
            description: "Names the native app and two-way ERP sync as out of scope (SOW 5.2), and plans to address the MD's live-stock question calmly as a possible later phase or CR, recorded in the MoM.",
          },
          {
            label: "Dependencies have owners and dates",
            points: 2,
            description: "Lists the ERP export sample (IT contractor, end of week 2), product images (week 8) and merchant account (week 10), each with a client-side owner and the milestone it feeds.",
          },
          {
            label: "Goals are measurable",
            points: 1,
            description: "Frames goals as questions to confirm with the MD, with at least one measurable success criterion (for example share of trade orders placed online).",
          },
          {
            label: "Risks and next steps are concrete",
            points: 1,
            description: "Flags the ERP file format and the IT contractor's availability as risks or assumptions, and ends with dated next steps: discovery sessions, first Friday report, MoM within a day.",
          },
        ],
        sampleAnswer: {
          goals:
            "Trade customers order online instead of by phone and email. To confirm with the MD: target share of trade orders placed through the portal six months after launch, and the branches that go live first.",
          scope:
            "In scope: React trade portal (catalogue, customer pricing, ordering, order history), Laravel admin, nightly product and price import from the ERP file, payments. Out of scope (SOW 5.2): native mobile app; two-way ERP sync, including live stock. Live stock was raised on a sales call: we can scope it as a later phase or a change request.",
          milestones: "Requirement sign-off week 3; design approval week 6; UAT weeks 17–18; go-live week 20.",
          spoc: "E-commerce manager",
          approver: "Managing director (sponsor)",
          cadence: "Weekly, on Fridays",
          goLiveWeek: "20",
          dependencies:
            "Nightly ERP export sample – IT contractor – end of week 2 (feeds discovery and the import design). Product images – e-commerce manager – week 8 (feeds catalogue build). Payment gateway merchant account in the client's name – MD – week 10 (feeds payment integration and UAT).",
          risks:
            "Assumption: the ERP can produce a nightly file in a stable format; confirm with the IT contractor. Risk: IT contractor availability for questions. Risk: merchant account approval can take weeks, so start now.",
          nextSteps:
            "PM sends MoM within a day with escalation matrix and RACI. Discovery workshops booked for weeks 1–3 with the e-commerce manager and two branch staff. First status report this Friday.",
        },
      },
    },
    {
      id: "pmp-a04-expectations-governance",
      moduleId: "pmp-a04",
      trackId: "pm",
      title: "Setting expectations and governance",
      summary:
        "Governance is the small set of agreements that decide how the project is steered: who decides what, how often you report, how problems get escalated and how changes are approved. Expectations are what the client believes will happen. The kickoff sets both. The rest of the project keeps them true.\n\nWhy it matters at an agency: clients rarely complain about the plan they agreed. They complain about surprises: a late delivery they heard about on the last day, a change they thought was free, a bug fix that took a week when they expected an hour. Good governance turns surprises into reported risks.\n\nHow to do it, in proportion to the project:\n\n- **Decision rights.** Name the approver for each gate and for [[term:change-request|change requests]], following the Oyelabs rule in the handbook card below.\n- **Cadence.** A weekly [[term:status-report]] with a [[term:rag-status]], a demo each [[term:sprint]], and a [[term:mom]] after each client meeting.\n- **Escalation.** A shared [[term:escalation-matrix]] with levels and triggers, so escalating is a process step, not a personal attack.\n- **Response expectations.** Say how quickly the team replies to messages and when it does not work, especially across time zones.\n- **Change.** Explain, at the start, how a request becomes a CR, before there is a request on the table.\n\nThe common mistake is too much governance on a small project, or none on a big one. GOV.UK's principle is useful here: keep governance proportionate, and prefer seeing the work over reading reports about it. A demo every sprint is better governance than a 12-page monthly report.",
      level: "advanced",
      estMinutes: 45,
      isMilestone: true,
      webRefs: [
        { label: "GOV.UK Service Manual: Governance principles for agile service delivery", url: "https://www.gov.uk/service-manual/agile-delivery/governance-principles-for-agile-service-delivery", kind: "docs", verifiedAt: "2026-10-02T11:51:27Z" },
        { label: "Microsoft Learn (Dynamics 365 implementation guide): Project governance", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/project-governance", kind: "docs", verifiedAt: "2026-10-02T12:01:01Z" },
        { label: "Atlassian Team Playbook: Stakeholder communications plan", url: "https://www.atlassian.com/team-playbook/plays/stakeholder-communications-plan", kind: "docs", verifiedAt: "2026-10-02T11:53:24Z" },
        { label: "APM (Association for Project Management): What is governance?", url: "https://www.apm.org.uk/resources/what-is-project-management/what-is-governance/", kind: "article", verifiedAt: "2026-10-02T11:55:39Z" },
      ],
      video: {
        title: "What is Project Governance? [CLEAR BREAKDOWN]",
        channel: "Adriana Girdler",
        url: "https://www.youtube.com/watch?v=NHmxGCI8sos",
        videoId: "NHmxGCI8sos",
        verifiedAt: "2026-10-02T12:16:59Z",
      },
      alternateVideos: [
        {
          title: "What is Project Governance? Project Management in Under 5",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=qoro7iML1DA",
          videoId: "qoro7iML1DA",
          verifiedAt: "2026-10-02T12:17:00Z",
        },
      ],
      handbook: {
        stages: ["custom-client-kickoff"],
        rules: ["cr-approval", "weekly-status-report", "escalation-levels", "mom-after-every-client-meeting"],
        templates: ["escalation-matrix-template", "status-report-rag"],
      },
      sections: [
        {
          heading: "What good looks like: a worked example",
          body:
            "**A Laravel and React booking platform for a UK clinic chain.** Fixed bid, 16 weeks. The sponsor is the chain's operations director. The SPOC is the patient-services manager. The team is in India, the client in the UK, a 4.5 to 5.5 hour difference.\n\nAt the kickoff the PM proposes, and the sponsor agrees, a one-page governance summary. It goes out with the MoM:\n\n- **Decisions.** The operations director approves requirements, designs, UAT and every [[term:change-request]]. The patient-services manager collects feedback and runs UAT, but does not approve. On the Oyelabs side, the PM approves the plan and the tech lead approves technical decisions.\n- **Cadence.** A 30-minute call every Tuesday at 10:00 UK time. A written status report every Friday with an overall RAG and RAGs for schedule, scope and budget, the client dependencies due and the decisions needed. A demo at the end of each two-week sprint. A MoM within a day of every client meeting.\n- **Response times (typical, to confirm with Oyelabs policy).** Messages answered the same working day in the overlap hours; production issues after go-live handled under the support terms, not by chat.\n- **Escalation.** Level 1: PM and patient-services manager. Level 2: Oyelabs delivery head and the operations director, if a decision or dependency is more than five working days late, or the project goes Red. The matrix with names goes out with the MoM.\n- **Change.** Any new request goes to the PM, who classifies it within two working days. If it is a CR, the client gets an impact on time and cost before any work starts.\n\nWeek 7 tests it. The clinic's IT team is two weeks late with the patient-system API access. Because the dependency was dated at kickoff, the Friday report turns schedule Amber, names the dependency and the milestone at risk, and asks for a decision. When it is still missing five days later, the PM escalates to Level 2 as agreed. The operations director unblocks it in a day. Nobody is surprised, and nobody argues about whose delay it was.",
        },
        {
          heading: "Expectations to set explicitly",
          body:
            "Clients fill silence with assumptions. Say these out loud at kickoff and write them in the MoM:\n\n- **What a sprint demo is.** Work in progress on [[term:staging-environment|staging]], not a finished product. Feedback is welcome; new ideas are classified, not automatically added.\n- **What a bug is, and what is not.** A [[term:bug]] is behaviour that does not match the agreed requirement. A new idea is a [[term:change-request]] or an [[term:enhancement]].\n- **What the client owes.** Inputs, reviewers' time and decisions, by date.\n- **What \"done\" means.** UAT sign-off by the approver, then go-live, then [[term:hypercare]].\n- **How long things take.** Small changes still need classification, estimation, testing and release. \"Five minutes\" in code is rarely five minutes in delivery.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Reporting only good news.** The first Red is a shock. Recover: report Amber early with the cause and the decision needed. RAG is a tool, not a grade.\n- **The SPOC approves things they cannot approve.** Recover: restate the decision rights in writing and route the open approval to the sponsor.\n- **Escalation used as a threat.** Recover: present the matrix at kickoff as normal process, and when you use it, describe facts, impact and the decision needed.\n- **Heavy governance on a small project.** A two-month build with a monthly steering committee and a 10-page report. Recover: replace it with a weekly one-page report and sprint demos.\n- **Always-on chat.** Recover: agree the channels and response times again, and move decisions out of chat into email or the MoM.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Approver named for each gate and for CRs, in writing.\n2. Weekly status report day and format agreed.\n3. Demo cadence agreed.\n4. Escalation matrix with names and triggers shared.\n5. Response times and working hours stated, across time zones.\n6. The change process explained before the first request.\n7. Governance proportionate to the project's size.",
        },
      ],
      sop: [
        {
          title: "Response times and escalation contacts",
          prompt: "[Oyelabs SOP – admin to fill] Oyelabs' standard response times for client messages during delivery, working hours by office, and the named Level 2 and Level 3 escalation contacts.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a04-expectations-governance-q1",
          prompt: "What does GOV.UK's guidance say about proportion in agile governance?",
          options: [
            "Keep it proportionate, and prefer observing the team's work over reading reports",
            "Report monthly to a board, whatever the project size",
            "Governance is unnecessary in agile",
            "Every decision needs a steering committee",
          ],
          correctIndex: 0,
          explanation: "Lean, proportionate governance with direct observation, such as sprint demos, steers better than heavy reporting.",
        },
        {
          id: "pmp-a04-expectations-governance-q2",
          prompt: "Week 7: the client's IT team is two weeks late with API access, and the client asks why the project is Amber. What makes this conversation easy?",
          options: [
            "The dependency was dated at kickoff and reported weekly, so its impact is visible and agreed",
            "Blaming the client's IT team in the report",
            "Keeping the report Green until it is too late",
            "Absorbing the delay with overtime",
          ],
          correctIndex: 0,
          explanation: "Dated dependencies and honest RAG turn a dispute into a decision the client can make.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a04-expectations-governance-q3",
          prompt: "Which belong in a one-page governance summary for a mid-sized custom project? (Select all that apply.)",
          options: [
            "Who approves each gate and CR",
            "Status report day and format",
            "Escalation levels and triggers",
            "Each developer's salary",
            "The full SOW text",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Decision rights, cadence and escalation. Salaries are confidential and the SOW is referenced, not copied.",
        },
        {
          id: "pmp-a04-expectations-governance-q4",
          prompt: "The SPOC approves a design change by chat. The SOW says the sponsor approves designs. What do you do?",
          options: [
            "Thank the SPOC, and send the change to the sponsor for written approval as agreed",
            "Treat the chat as approval",
            "Ignore the SPOC",
            "Ask the designer to decide",
          ],
          correctIndex: 0,
          explanation: "Decision rights only work if you follow them. Route approvals to the named approver without making the SPOC feel overruled.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a04-expectations-governance-q5",
          prompt: "How should you present the escalation matrix at kickoff?",
          options: [
            "As normal process: levels, triggers and contacts, so escalating later is expected, not personal",
            "Only if the client asks",
            "As a warning to the client",
            "Never; escalation should be informal",
          ],
          correctIndex: 0,
          explanation: "When everyone agreed the triggers up front, using them later does not damage the relationship.",
        },
        {
          id: "pmp-a04-expectations-governance-q6",
          prompt: "After the first sprint demo, the client lists eight new ideas and assumes they are all in the next sprint. Which expectation was not set?",
          options: [
            "That demo feedback is welcome but new ideas are classified and may be change requests",
            "That demos are optional",
            "That the client cannot give feedback",
            "That sprints are four weeks",
          ],
          correctIndex: 0,
          explanation: "Explain the change process before the first request. Then classifying demo ideas feels like process, not refusal.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a04-expectations-governance-q7",
          prompt: "Your project is two months long with a team of three. Someone proposes a monthly steering committee and a 10-page report. What is better?",
          options: [
            "A weekly one-page status report and a demo every sprint",
            "The steering committee, because more governance is safer",
            "No reporting at all",
            "A daily 10-page report",
          ],
          correctIndex: 0,
          explanation: "Governance should be proportionate. Small projects need short, frequent, visible updates.",
        },
        {
          id: "pmp-a04-expectations-governance-q8",
          prompt: "Which are good reasons to report Amber early? (Select all that apply.)",
          options: [
            "The client can still make a decision that fixes it",
            "It avoids a surprise Red later",
            "It shows the cause and what is needed",
            "It makes the team look bad",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "RAG is a steering tool. Early Amber with a cause and an ask is honest and useful.",
        },
        {
          id: "pmp-a04-expectations-governance-q9",
          prompt: "The client messages the team at 21:00 their time and expects answers within minutes. What governance item fixes this?",
          options: [
            "Agreed channels, working hours and response times, written in the MoM",
            "Developers replying at night",
            "Ignoring the messages",
            "Moving all communication to phone calls",
          ],
          correctIndex: 0,
          explanation: "Across time zones, response expectations must be explicit. Urgent production issues after go-live go through the support process.",
        },
        {
          id: "pmp-a04-expectations-governance-q10",
          prompt: "Who should approve change requests on a custom project?",
          options: [
            "The approver named in the governance summary, usually the client sponsor, as the Oyelabs CR rule sets out",
            "Whoever asks for the change",
            "The developer doing the work",
            "Nobody; CRs are automatic",
          ],
          correctIndex: 0,
          explanation: "A CR changes cost or time, so it needs the person with that authority. Follow the Oyelabs rule on CR approval.",
        },
      ],
      practice: {
        kind: "write",
        variant: "email",
        prompt:
          "Write the governance summary email to the client sponsor after the kickoff. Confirm decision rights, cadence, response times, escalation and how changes are handled, and ask the sponsor to confirm.",
        context:
          "Project: Laravel and React booking platform for a UK clinic chain. Fixed bid, 16 weeks, two-week sprints. Sponsor: Priya Shah, operations director. SPOC: Tom Reed, patient-services manager, who will run UAT. Oyelabs team in India. Agreed at kickoff: Tuesday 10:00 UK call; written status report every Friday; demo at the end of each sprint; MoM after every meeting. Escalation: Level 1 PM and Tom; Level 2 Oyelabs delivery head and Priya, if a decision or dependency is more than five working days late or the project goes Red. Open point: the clinic's IT team owes patient-system API access by the end of week 3.",
        wordLimit: 260,
        rubric: [
          { id: "decisions", label: "Decision rights", description: "States that Priya approves requirements, designs, UAT and CRs, and that Tom collects feedback and runs UAT but does not approve.", weight: 2 },
          { id: "cadence", label: "Cadence and response times", description: "Lists the Tuesday call, Friday report, sprint demos and MoMs, and states response expectations within overlap hours.", weight: 1 },
          { id: "escalation", label: "Escalation and change", description: "Gives the two levels with triggers, and explains that new requests are classified and any CR gets a time and cost impact before work starts.", weight: 2 },
          { id: "ask", label: "Clear ask and tone", description: "Short and polite, highlights the API access dependency with its date, and asks Priya to reply to confirm.", weight: 1 },
        ],
        sampleAnswer:
          "Subject: Booking platform – how we'll run the project\n\nHi Priya,\n\nThank you for Tuesday's kickoff. Here is the summary of how we agreed to run the project. Please reply to confirm.\n\nDecisions: you approve the requirements, designs, UAT and any change requests. Tom collects feedback from the clinics and runs UAT, and passes approvals to you.\n\nCadence: a 30-minute call every Tuesday at 10:00 UK time; a written status report every Friday; a demo at the end of each two-week sprint; minutes within a day of every meeting. We reply to messages the same working day during our overlap hours.\n\nEscalation: Level 1 is Tom and me. If a decision or dependency is more than five working days late, or the project turns Red, we move to Level 2: our delivery head and you. The matrix with contact details is attached.\n\nChanges: please send new ideas to me. I will classify each within two working days. If it is a change request, you will get the impact on time and cost before any work starts.\n\nOne date to watch: we need patient-system API access from your IT team by the end of week 3, as it feeds the integration sprint.\n\nBest regards,\n[PM name]",
      },
    },
  ],
} satisfies Module;
