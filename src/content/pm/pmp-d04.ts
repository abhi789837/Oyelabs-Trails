import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-d04",
  trackId: "pm",
  name: "Client meetings: Releasing & closing",
  description:
    "The meetings at the end of a project: the UAT walkthrough, the go/no-go, the retrospective, the closure and handover meeting, and the quarterly account review that keeps a live client. Each is a step-by-step tutorial with a timed agenda, a script, traps and the 24-hour follow-up.",
  topics: [
    {
      id: "pmp-d04-uat-walkthrough",
      moduleId: "pmp-d04",
      trackId: "pm",
      title: "UAT walkthrough",
      summary: `The [[term:uat|UAT]] walkthrough is the meeting where the client confirms that the product does what was agreed, and gives, or refuses, written [[term:sign-off|sign-off]]. At an agency it decides whether the release can go live and often whether a [[term:milestone-billing|milestone invoice]] can be raised.

There are usually two UAT meetings: a kickoff walkthrough, where you show the client how to test (the [[term:uat-environment|UAT environment]], the scenarios, how to log feedback), and a closing walkthrough, where you go through the results and agree sign-off. This topic covers both.

How to run it well: test against the signed [[term:acceptance-criteria|acceptance criteria]], not against a fresh wish list. Triage every piece of feedback in the room into a defect (by [[term:severity|severity]]), a cosmetic issue, a [[term:change-request|change request]] or a [[term:clarification|clarification]]. Agree what blocks sign-off (typically open critical or high defects) and what can be accepted as a [[term:known-issues|known issue]] with a fix date.

The common mistake is letting UAT become a second discovery phase. New ideas are welcome, but they go into CRs and a later release; they do not hold sign-off hostage. The reverse mistake is pushing for sign-off with a real blocker open. Follow the Oyelabs rule in the handbook card below on sign-off before go-live.

Not legal advice: the signed contract always wins. UAT windows and any deemed-acceptance clause come from the contract, not from this course.`,
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Learn: Test your solution before deployment (testing strategy, UAT)", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy", kind: "docs", verifiedAt: "2026-10-02T12:04:24Z" },
        { label: "GOV.UK Service Manual: Quality assurance, testing your service regularly", url: "https://www.gov.uk/service-manual/technology/quality-assurance-testing-your-service-regularly", kind: "spec", verifiedAt: "2026-10-02T12:04:25Z" },
        { label: "Atlassian: What is Acceptance Criteria?", url: "https://www.atlassian.com/work-management/project-management/acceptance-criteria", kind: "article", verifiedAt: "2026-10-02T12:04:26Z" },
        { label: "Atlassian: Definition of Done (DoD)", url: "https://www.atlassian.com/agile/project-management/definition-of-done", kind: "article", verifiedAt: "2026-10-02T12:04:26Z" },
      ],
      video: {
        title: "Software Testing Process Guide: What is User Acceptance Testing - UAT?",
        channel: "Online PM Courses - Mike Clayton",
        url: "https://www.youtube.com/watch?v=sGwm4p9sGPI",
        videoId: "sGwm4p9sGPI",
        verifiedAt: "2026-10-02T12:05:32Z",
      },
      alternateVideos: [
        {
          title: "What is UAT (User Acceptance Testing) ? How Does Business Analyst Drive UAT?",
          channel: "BA Professional",
          url: "https://www.youtube.com/watch?v=PzoD3FtzIbY",
          videoId: "PzoD3FtzIbY",
          verifiedAt: "2026-10-02T12:05:33Z",
        },
      ],
      sections: [
        {
          heading: "Purpose and when it happens",
          body: `**UAT kickoff walkthrough** (start of the UAT window): show the client how to test, which scenarios to run, how to log feedback, and the dates.

**UAT closing walkthrough** (end of the window): review every piece of feedback, triage it, agree the fix-and-retest plan, and get a sign-off decision.

Entry condition: internal [[term:qa|QA]] has passed with no open [[term:blocker|blockers]], and the build is on the [[term:uat-environment|UAT environment]] with realistic test data. Never start UAT to "save time" while QA is still finding critical bugs; the client will find them instead.

The UAT window length comes from the contract. Typical contracts give 5–10 working days.`,
        },
        {
          heading: "Who attends",
          body: `- **You (PM):** you run both walkthroughs and own the triage.
- **QA lead:** shows the test scenarios, reproduces reported issues, and confirms retest results.
- **Tech lead (closing walkthrough):** sizes the fixes and confirms dates.
- **Client testers:** the people who will use the product day to day, not only the sponsor.
- **The client approver:** the person who signs off. If they are not in the closing walkthrough, the meeting cannot end with sign-off, only a recommendation.`,
        },
        {
          heading: "Prepare: checklist",
          body: `- UAT scenarios written from the signed [[term:acceptance-criteria|acceptance criteria]], covering happy paths and edge cases.
- Test accounts for every role, and realistic or migrated test data.
- A feedback log the client can use: issue, steps, expected, actual, screenshot, severity suggestion.
- The severity definitions you will triage with, shared before UAT starts.
- The internal QA report and the list of [[term:known-issues|known issues]] you already know about. Disclose them up front.
- For the closing walkthrough: the feedback log pre-triaged with the QA lead, so the meeting confirms rather than starts the triage.
- The [[term:uat|UAT]] sign-off template, pre-filled with release, build and period.`,
        },
        {
          heading: "Timed agenda template",
          body: `**Closing walkthrough, 60 minutes. Typical.**

1. Open: goal (a sign-off decision or a clear retest plan), and the sign-off criteria agreed at kickoff (3 min).
2. Results overview: scenarios run, passed, failed (5 min).
3. Walk through each failed item and each piece of feedback; agree its classification and severity (25 min).
4. Agree what blocks sign-off and what becomes an accepted known issue with a fix date (10 min).
5. Agree change requests and deferred items, separately from sign-off (7 min).
6. Fix-and-retest plan, and the effect on the go-live date (5 min).
7. Decision: sign off now, sign off with known issues, or retest and reconvene (5 min).`,
        },
        {
          heading: "Sample script",
          body: `**Opening**
- "Our aim today is a sign-off decision. As agreed at the UAT kickoff, open critical or high defects block sign-off; low and cosmetic issues can be accepted with a fix date."

**Steering the triage**
- "Thank you for logging fourteen items. Let's go one by one and agree what each one is."
- "The double booking is a real defect, high severity. It blocks sign-off. It's fixed in build 63 and our QA retested it this morning. Can your team confirm it on their side today?"
- "Export to Excel isn't in the acceptance criteria. It's a good idea, so I'll raise it as a change request. It doesn't block today's decision."

**Asking for the decision**
- "With the double booking confirmed fixed, there are two low-severity items left. Are you happy to sign off with those two listed as known issues for v1.2.1?"

**Closing**
- "I'll send the sign-off document within the hour. Once it's signed, we confirm the go/no-go meeting for Tuesday."`,
        },
        {
          heading: "What to show",
          body: `- The UAT results summary: scenarios run, passed, failed, retested.
- The triaged feedback log, filtered by classification.
- The acceptance criterion for any item the client says is a defect. Show it, don't argue about it.
- A live repro or retest of any blocker, on the UAT environment.
- The pre-filled sign-off document, so the client sees exactly what they are signing.`,
        },
        {
          heading: "Traps and how to recover",
          body: `- **UAT turns into new requirements.** Thank the client and log each idea as a CR or a phase-2 item. Keep sign-off tied to the agreed criteria.
- **Everything is marked critical.** Use the severity definitions you agreed at kickoff, and ask "what can't your users do because of this?"
- **The client does not test until the last day.** Prevent it with a mid-window check-in. If it happens, discuss an extension, and its effect on dates, using what the contract says.
- **The approver is absent.** Get a recommendation and book a 15-minute sign-off slot with the approver.
- **You push sign-off with a real blocker open.** Do not. A sign-off obtained under pressure becomes a warranty dispute later.
- **The client goes silent after the window.** Some contracts treat silence as acceptance. Do not assume it; check the contract with your manager and confirm in writing.`,
        },
        {
          heading: "Follow-up within 24 hours",
          body: `Send the sign-off document or, if there is no sign-off yet, the triaged list and retest plan.

Template:

- **Subject:** UAT result and sign-off: v1.2.0
- "Hi Sarah, thank you for today. Result: 86 scenarios; the high-severity double-booking defect is fixed in build 63 and confirmed by your team. Two low-severity issues are accepted as known issues, fixed in v1.2.1 by 30 September. Export to Excel is new functionality: CR-009 follows tomorrow. Please sign the attached UAT sign-off by Thursday 5 pm so we can hold Tuesday's go/no-go."`,
        },
      ],
      handbook: {
        stages: ["custom-qa-uat", "wl-builds-qa"],
        rules: ["uat-signoff-before-golive", "billing-bug-in-delivery"],
        templates: ["uat-signoff"],
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-d04-uat-walkthrough-q1",
          prompt: "During the UAT closing walkthrough, the client says: \"We'd also like an Excel export of bookings.\" It is not in the acceptance criteria. What is it, and what do you do?",
          options: [
            "A change request; log it, raise a CR, and keep it out of the sign-off decision",
            "A defect; fix it before sign-off",
            "A known issue; list it on the sign-off",
            "A clarification; explain that exports are not possible",
          ],
          correctIndex: 0,
          explanation:
            "New functionality is a CR, whatever stage it is raised in. Tying it to sign-off turns UAT into a second discovery phase.",
        },
        {
          id: "pmp-d04-uat-walkthrough-q2",
          prompt: "What is UAT measured against?",
          options: [
            "The signed acceptance criteria and agreed scope",
            "The client's current expectations",
            "The developers' unit tests",
            "Competitor apps",
          ],
          correctIndex: 0,
          explanation:
            "Acceptance means the product meets what was agreed. Expectations that were never written down are handled as change requests.",
        },
        {
          id: "pmp-d04-uat-walkthrough-q3",
          prompt: "Which can typically be accepted as known issues at sign-off, with a fix date? (Select all that apply.)",
          options: [
            "A misaligned button on the iPad view",
            "A typo in a reminder email",
            "Payments failing for one card type",
            "A slow report export above a very large row count, with a planned fix",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "Low-severity or cosmetic issues with a workaround and a fix date can be accepted if the client agrees. A payment failure is high severity and normally blocks sign-off.",
        },
        {
          id: "pmp-d04-uat-walkthrough-q4",
          prompt: "The client marks all 14 feedback items as critical. What is the best move?",
          options: [
            "Triage each item using the severity definitions agreed at UAT kickoff, asking what users cannot do",
            "Accept all 14 as critical to avoid conflict",
            "Downgrade them all to low",
            "Ask the client to resubmit the list",
          ],
          correctIndex: 0,
          explanation:
            "Shared definitions and the question \"what can't users do?\" turn an emotional list into a fair triage.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-uat-walkthrough-q5",
          prompt: "Internal QA still has two open critical defects. The sales team wants UAT to start today to keep the date. What do you do?",
          options: [
            "Hold UAT until QA passes, or start it only with the client told exactly what is broken and what not to test",
            "Start UAT and hope the client does not find the bugs",
            "Start UAT and blame the bugs on the environment",
            "Skip QA for the remaining features",
          ],
          correctIndex: 0,
          explanation:
            "UAT is not a substitute for QA. If dates force an early start, full disclosure protects trust; hiding defects guarantees a rejected UAT.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-uat-walkthrough-q6",
          prompt: "The client approver is not at the closing walkthrough. What can the meeting achieve?",
          options: [
            "A recommendation and a short sign-off slot booked with the approver",
            "A full sign-off from whoever attended",
            "Nothing; cancel and rebook",
            "Deemed acceptance",
          ],
          correctIndex: 0,
          explanation:
            "Only the person with authority can sign off. Get the team's recommendation and book the approver quickly.",
        },
        {
          id: "pmp-d04-uat-walkthrough-q7",
          prompt: "The UAT window ended five days ago and the client has said nothing. What do you do?",
          options: [
            "Check the contract with your manager, then write to the client to confirm the status rather than assuming acceptance",
            "Assume acceptance and go live",
            "Restart UAT from the beginning",
            "Raise the milestone invoice without contacting the client",
          ],
          correctIndex: 0,
          explanation:
            "Deemed acceptance exists only if the contract says so, and even then a written confirmation avoids a dispute.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-uat-walkthrough-q8",
          prompt: "What should the UAT sign-off document list? (Select all that apply.)",
          options: [
            "The release and build reference",
            "The open known issues accepted, with fix plans",
            "Items deferred by agreement",
            "A statement of acceptance signed by the client approver",
            "The developers' timesheets",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "The sign-off records exactly what was accepted and on what terms. Timesheets are internal.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        prompt: "Fill in the UAT sign-off from the closing walkthrough notes below. Classify the Excel export correctly and record the decision the client actually made.",
        context:
          "Closing walkthrough notes. Project: Laravel booking platform for a UK clinic chain. Release v1.2.0, build 63, UAT environment. UAT ran 1–12 September.\n\n- 86 scenarios run.\n- 1 high-severity defect: double booking when two receptionists book the same slot. Fixed in build 63, retested by Oyelabs QA and by the client on 16 September: passed.\n- 2 low-severity issues: a misaligned button on the iPad view and a typo in the reminder email. The client agreed to accept both as known issues, fixed in v1.2.1 by 30 September.\n- Export bookings to Excel: requested during UAT, not in the acceptance criteria. PM to raise CR-009.\n- Arabic translation review: moved to v1.3 by agreement.\n- Sarah (operations director, the approver) said: \"We accept v1.2.0 for go-live with the two known issues.\"",
        templateId: "uat-signoff",
        fields: [
          { id: "release", label: "Release and build reference", input: "text", required: true },
          { id: "period", label: "UAT period and environment", input: "text", required: true },
          { id: "results", label: "Scenarios tested and results", input: "textarea", required: true },
          { id: "knownCount", label: "Number of open known issues accepted", input: "number", required: true },
          { id: "knownIssues", label: "Open known issues accepted (with fix plan)", input: "textarea", required: true },
          {
            id: "exportItem",
            label: "How is the Excel export handled?",
            input: "select",
            options: ["Defect to fix before sign-off", "Accepted known issue", "Change request (outside acceptance criteria)", "Deferred by agreement"],
            required: true,
          },
          { id: "deferred", label: "Deferred items", input: "textarea", required: true },
          {
            id: "decision",
            label: "Sign-off decision",
            input: "select",
            options: ["Signed off, no open issues", "Signed off with accepted known issues", "Not signed off: retest needed"],
            required: true,
          },
          { id: "acceptance", label: "Acceptance statement", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "knownCount", expected: 2 },
          { fieldId: "exportItem", expected: "Change request (outside acceptance criteria)" },
          { fieldId: "decision", expected: "Signed off with accepted known issues" },
        ],
        rubric: [
          { label: "Results are factual and complete", points: 2, description: "States scenarios run and the high-severity defect fixed and retested by both sides, without vague wording." },
          { label: "Known issues have fix plans", points: 2, description: "Both known issues are named with severity, the target release v1.2.1 and the date." },
          { label: "Acceptance statement is unambiguous", points: 2, description: "Names the release, the approver and that acceptance is against the agreed criteria with the listed known issues." },
        ],
        sampleAnswer: {
          release: "v1.2.0, build 63, UAT environment",
          period: "1–12 September, UAT environment (retest 16 September)",
          results: "86 scenarios run. One high-severity defect (double booking) fixed in build 63 and retested as passed by Oyelabs QA and the client on 16 September. Two low-severity issues remain open and are accepted below.",
          knownCount: "2",
          knownIssues: "1. Misaligned button on the iPad view (low). 2. Typo in the reminder email (low). Both fixed in v1.2.1 by 30 September.",
          exportItem: "Change request (outside acceptance criteria)",
          deferred: "Arabic translation review, moved to v1.3 by agreement. Excel export handled separately as CR-009.",
          decision: "Signed off with accepted known issues",
          acceptance:
            "The client accepts release v1.2.0 (build 63) as meeting the agreed acceptance criteria for go-live, with the two known issues listed above. Approved by Sarah, operations director.",
        },
      },
      sop: [
        {
          title: "Our UAT feedback log and severity definitions",
          prompt:
            "[Oyelabs SOP – admin to fill] Where clients log UAT feedback (sheet, tool, link), the severity definitions shared with clients at UAT kickoff, and who on the Oyelabs side may countersign a UAT sign-off.",
        },
      ],
    },
    {
      id: "pmp-d04-retrospective",
      moduleId: "pmp-d04",
      trackId: "pm",
      title: "Retrospectives",
      summary: `A [[term:retrospective|retrospective]] is where the team looks back at how it worked and agrees a small number of concrete changes. In Scrum it ends every [[term:sprint|sprint]]; at an agency there is also a project retrospective at [[term:closure|closure]], and sometimes a joint one with the client.

Agencies need it more than product teams, because each project is a new client, a new contract and a new set of surprises. The lessons that repeat (late [[term:client-dependency|client dependencies]], design rounds that never end, a [[term:rollback|rollback]] never rehearsed) only stop repeating if someone writes them down as actions with owners.

How to run it: set a safe tone, gather facts and feelings in a simple format (for example Loved, Loathed, Learned, Longed for), group them into themes, then agree two or three actions, each with an owner and a date. Typical run: about 60 minutes for a team of 4–8.

The common mistake is a retrospective that produces complaints, not actions: "communication should be better" with no owner. The second mistake is blame. A retro that names a developer for a bug will be silent next time. Talk about the process and the system, never the person. Record the actions in [[term:mom|minutes]] and carry them into the next kickoff.`,
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Scrum Guide (2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: "2026-10-02T12:04:11Z" },
        { label: "Atlassian Team Playbook: Retrospective", url: "https://www.atlassian.com/team-playbook/plays/retrospective", kind: "docs", verifiedAt: "2026-10-02T12:04:27Z" },
        { label: "Atlassian: What are agile retrospectives?", url: "https://www.atlassian.com/agile/scrum/retrospectives", kind: "article", verifiedAt: "2026-10-02T12:04:29Z" },
        { label: "Asana: Sprint Retrospective, how to run an effective retro", url: "https://asana.com/resources/sprint-retrospective", kind: "article", verifiedAt: "2026-10-02T12:04:29Z" },
      ],
      video: {
        title: "How to Facilitate the Sprint Retrospective",
        channel: "Scrum.org",
        url: "https://www.youtube.com/watch?v=TD-XsdD2n3s",
        videoId: "TD-XsdD2n3s",
        verifiedAt: "2026-10-02T12:05:33Z",
      },
      alternateVideos: [
        {
          title: "Sprint Retrospectives: How Scrum Teams Improve",
          channel: "Mountain Goat Software: Agile & Scrum Mastery",
          url: "https://www.youtube.com/watch?v=qzIQ-3aAkXI",
          videoId: "qzIQ-3aAkXI",
          verifiedAt: "2026-10-02T12:05:33Z",
        },
      ],
      sections: [
        {
          heading: "Purpose and when it happens",
          body: `The purpose is a short list of improvements the team will actually make, each with an owner and a date.

Three kinds at an agency:

- **Sprint retro:** the end of every sprint, internal. The Scrum Guide timeboxes it at most 3 hours for a one-month sprint; shorter sprints get shorter retros (typical: about 1 hour for two weeks).
- **Project retro:** at closure, internal, looking at the whole project from handover to go-live.
- **Joint retro with the client:** optional, at closure or after a difficult phase, focused on how the two teams worked together.`,
        },
        {
          heading: "Who attends",
          body: `- **Facilitator:** usually the PM. For a project retro where the PM's own decisions are under review, ask another PM to facilitate.
- **The delivery team:** developers, QA, designer, tech lead.
- **The client (joint retro only):** the SPOC and, ideally, the person who tested and approved.

Keep managers who were not on the project out of the internal retro. Their presence makes people careful, and careful retros find nothing.`,
        },
        {
          heading: "Prepare: checklist",
          body: `- Facts first: planned vs actual dates, number of CRs, defects found in UAT and after go-live, how long client dependencies waited.
- The actions from the last retro, and whether they were done.
- A format: 4 Ls (Loved, Loathed, Learned, Longed for), or Sad / Mad / Glad.
- A board everyone can write on at once (Teams Whiteboard, Miro or a shared sheet).
- A reminder of the ground rule: we discuss the process and the system, not individuals.`,
        },
        {
          heading: "Timed agenda template",
          body: `A 60-minute retro. Typical.

1. Set the tone: the purpose and the ground rule (5 min).
2. Review last retro's actions: done or not, and why (5 min).
3. Gather: everyone writes notes in the four columns, silently (10 min).
4. Group the notes into themes and vote on the top two or three (10 min).
5. Discuss the top themes: what caused them (15 min).
6. Agree actions: what, owner, due date (10 min).
7. Close: a one-word check-out from each person (5 min).`,
        },
        {
          heading: "Sample script",
          body: `**Opening**
- "This is about how we worked, not who did what. If something went wrong, we look for the step in the process that let it happen."

**Steering**
- "Three notes say 'waited for API keys'. Let's group those. How many working days did we lose in total?"
- "'Communication was bad' is a feeling. Can someone give one example where it went wrong?"
- "If we could change one thing for the next project, what would it be?"

**Turning themes into actions**
- "So the action is: at every kickoff, log each client dependency in the RAID log with a date and a named client owner. Who owns making that part of our kickoff template?"

**Closing**
- "Three actions, three owners, three dates. I'll send the minutes today and we'll check them at the next project kickoff."`,
        },
        {
          heading: "What to show",
          body: `- The facts summary (dates, CRs, defects, dependency waiting time) on one screen.
- Last retro's actions with their status.
- The shared board while people write and vote.
- At the end, the action list, written in front of everyone, so the owners see their names.`,
        },
        {
          heading: "Traps and how to recover",
          body: `- **Blame.** Someone says "the bug was Ravi's". Redirect at once: "What in our process let that bug reach UAT?"
- **Complaints without actions.** Ask "what would we do differently?" until there is a step someone can own.
- **Too many actions.** Ten actions means none get done. Pick the two or three that matter most.
- **The same actions every time.** If the last retro's actions were not done, discuss why before adding new ones.
- **The loudest person dominates.** Use silent writing first and dot-voting, so everyone's view counts.
- **Client present, team silent.** For a joint retro, run an internal one first so the team can be candid.`,
        },
        {
          heading: "Follow-up within 24 hours",
          body: `Send [[term:mom|minutes]] with the themes and the actions, and add the actions to where they will be seen again (the kickoff checklist, the template, the team's board).

Template:

- **Subject:** Retrospective minutes: clinic booking platform
- "Thanks, everyone. Top themes: late client dependencies (11 working days lost in total), unclear design approver, no rollback rehearsal. Actions: (1) add dependency dates and client owners to the RAID log at kickoff – PM – before next kickoff; (2) name one design approver in the kickoff MoM – PM – next kickoff; (3) rehearse rollback before every go/no-go – tech lead – next release. We review these at the next project kickoff."`,
        },
      ],
      handbook: {
        stages: ["custom-closure", "custom-sprints"],
        rules: ["mom-after-every-client-meeting"],
        templates: ["mom", "closure-report"],
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-d04-retrospective-q1",
          prompt: "A retro ends with: \"We should communicate better.\" What is missing?",
          options: [
            "A concrete action with an owner and a date",
            "A longer discussion",
            "The client's opinion",
            "A vote on who communicated worst",
          ],
          correctIndex: 0,
          explanation:
            "A feeling is not an action. Ask for one example and one specific change someone can own.",
        },
        {
          id: "pmp-d04-retrospective-q2",
          prompt: "In the retro, a QA engineer says: \"The checkout bug in UAT was Ravi's fault.\" What do you do?",
          options: [
            "Redirect to the process: what let that bug reach UAT, and what check would catch it next time?",
            "Agree, and ask Ravi to explain",
            "Note it in the minutes",
            "Move on without comment",
          ],
          correctIndex: 0,
          explanation:
            "Blame makes the next retro silent. Looking at the process finds fixes that prevent the whole class of problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-retrospective-q3",
          prompt: "Which are good techniques for a retro? (Select all that apply.)",
          options: [
            "Silent writing before discussion",
            "Grouping notes into themes and dot-voting",
            "Reviewing the last retro's actions first",
            "Inviting senior managers who were not on the project to observe",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Silent writing and voting give everyone a voice; reviewing past actions keeps the retro honest. Outside observers make people guarded.",
        },
        {
          id: "pmp-d04-retrospective-q4",
          prompt: "According to the Scrum Guide, what is the maximum length of a Sprint Retrospective for a one-month sprint?",
          options: ["3 hours", "15 minutes", "8 hours", "1 day"],
          correctIndex: 0,
          explanation:
            "The Scrum Guide sets a maximum of three hours for a one-month sprint; shorter sprints usually have shorter retros. Eight hours is the Sprint Planning maximum.",
        },
        {
          id: "pmp-d04-retrospective-q5",
          prompt: "The team agrees twelve actions. What is the problem?",
          options: [
            "Too many actions rarely get done; pick the two or three that matter most",
            "Nothing: more actions means more improvement",
            "Actions should not have owners",
            "The client must approve each action",
          ],
          correctIndex: 0,
          explanation:
            "A short list with owners gets done. A long list becomes the same complaints at the next retro.",
        },
        {
          id: "pmp-d04-retrospective-q6",
          prompt: "Last retro's three actions were not done. What should this retro do first?",
          options: [
            "Discuss why they were not done before adding new ones",
            "Ignore them and start fresh",
            "Copy them into this retro's action list unchanged",
            "Remove the owners from the project",
          ],
          correctIndex: 0,
          explanation:
            "If actions keep failing, the reason (no time, wrong owner, unclear action) is the real issue to fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-retrospective-q7",
          prompt: "You plan a joint retrospective with the client after a hard project. What should you do first?",
          options: [
            "Run an internal retro first so the team can be candid, and agree what to share",
            "Invite the client to the internal retro instead",
            "Skip the internal retro to save time",
            "Ask the client to run it",
          ],
          correctIndex: 0,
          explanation:
            "Teams speak openly without the client present. The joint retro then focuses on how the two sides worked together.",
        },
        {
          id: "pmp-d04-retrospective-q8",
          prompt: "Which facts are useful to bring to a project retrospective? (Select all that apply.)",
          options: [
            "Planned versus actual dates",
            "How long client dependencies waited",
            "Defects found in UAT and after go-live",
            "Each developer's personal error count",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Project-level facts ground the discussion. Personal error counts turn a retro into a performance review.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "form",
        variant: "mom",
        prompt: "Write the minutes of this project retrospective from the facilitator's notes. Count only real actions: something specific, with an owner.",
        context:
          "Project retrospective, Laravel booking platform for a UK clinic chain, 20 March. Attendees: PM (facilitator), tech lead, 3 developers, QA, designer.\n\nFacts: go-live 2 weeks late. Of 5 delays, 3 were waiting for client dependencies (payment keys, SMS sender ID, store account); 11 working days lost in total.\n\nNotes:\n- Loved: daily EOD updates, fast QA turnaround.\n- Loathed: waiting for keys; nobody knew who approved designs on the client side, 3 extra design rounds.\n- Learned: rollback was never rehearsed; cutover overran by 40 minutes.\n- Agreed: PM adds every client dependency with a date and a named client owner to the RAID log at kickoff, before the next kickoff. PM names one design approver in the kickoff MoM, next kickoff. Tech lead rehearses rollback before every go/no-go, from the next release.\n- Someone said \"we should communicate better\"; no example or owner was agreed.\n- Next review of these actions: next project kickoff.",
        templateId: "mom",
        fields: [
          { id: "meeting", label: "Meeting details (title, date, attendees)", input: "textarea", required: true },
          { id: "wentWell", label: "What went well", input: "textarea", required: true },
          { id: "improve", label: "What to improve (themes)", input: "textarea", required: true },
          {
            id: "topTheme",
            label: "Biggest single cause of delay",
            input: "select",
            options: ["Late client dependencies", "Developer skill gaps", "Hosting outages", "Too many CRs"],
            required: true,
          },
          { id: "actionsCount", label: "Number of agreed actions", input: "number", required: true },
          { id: "actions", label: "Action items (owner, due date)", input: "textarea", required: true },
          { id: "next", label: "Next review", input: "text", required: true },
        ],
        checks: [
          { fieldId: "topTheme", expected: "Late client dependencies" },
          { fieldId: "actionsCount", expected: 3 },
        ],
        rubric: [
          { label: "Actions are specific with owners and dates", points: 3, description: "All three actions are written as concrete steps with the named owner role and when." },
          { label: "Blameless, factual themes", points: 2, description: "Themes describe process issues with facts (11 days lost, 3 extra rounds), no individual blame." },
          { label: "Vague complaint handled correctly", points: 1, description: "'Communicate better' is not counted as an action; it is noted as a theme or left out." },
        ],
        sampleAnswer: {
          meeting: "Project retrospective, clinic booking platform, 20 March. Attendees: PM (facilitator), tech lead, 3 developers, QA, designer.",
          wentWell: "Daily EOD updates kept the client informed. QA turnaround was fast.",
          improve:
            "1. Late client dependencies: 3 of 5 delays, 11 working days lost. 2. No named design approver on the client side: 3 extra design rounds. 3. Rollback never rehearsed: cutover overran by 40 minutes.",
          topTheme: "Late client dependencies",
          actionsCount: "3",
          actions:
            "1. Add every client dependency with a date and a named client owner to the RAID log at kickoff – PM – before the next kickoff. 2. Name one design approver in the kickoff MoM – PM – next kickoff. 3. Rehearse rollback before every go/no-go – tech lead – from the next release.",
          next: "Review these actions at the next project kickoff.",
        },
      },
      sop: [
        {
          title: "Where retro actions and lessons learned are stored",
          prompt:
            "[Oyelabs SOP – admin to fill] Where project retrospective minutes and lessons learned are filed, who reviews them across projects, and how actions are carried into the next kickoff checklist.",
        },
      ],
    },
    {
      id: "pmp-d04-go-no-go",
      moduleId: "pmp-d04",
      trackId: "pm",
      title: "Go/no-go meeting",
      summary: `The [[term:go-no-go|go/no-go]] meeting is the last checkpoint before [[term:go-live|go-live]]. Everyone who can stop the release says, on the record, whether it is ready. The output is one decision: go, no-go, or go with explicit conditions, recorded in the [[term:mom|minutes]] with the client sponsor.

It matters at an agency because the release is the moment of maximum risk and maximum visibility. A failed [[term:cutover|cutover]] in front of the client's customers costs more trust than a one-week slip. A good go/no-go turns "we think it's fine" into evidence: [[term:uat|UAT]] signed off, production keys tested, client-owned store accounts ready, the [[term:rollback|rollback]] plan rehearsed, the [[term:smoke-test|smoke test]] owned, support contacts set for [[term:hypercare|hypercare]].

How to run it: walk the go-live checklist item by item, with each owner confirming status. Any item that fails a pre-agreed criterion is a no-go or a named condition. Public examples, like Fedora's, require QA to confirm no accepted blockers are open, and the decision to be unanimous.

The common mistakes are deciding by date ("we announced it, so it's go") and running the meeting too late to act. Hold it a day or two before cutover so a no-go still leaves room to fix. Follow the Oyelabs rule in the handbook card below: nothing goes to production without UAT sign-off.

Not legal advice: the signed contract always wins.`,
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Microsoft Learn: Use the go-live checklist (Dynamics 365 implementation guide)", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/prepare-go-live-checklist", kind: "docs", verifiedAt: "2026-10-02T12:04:26Z" },
        { label: "Fedora Project Wiki: Go No Go Meeting", url: "https://fedoraproject.org/wiki/Go_No_Go_Meeting", kind: "docs", verifiedAt: "2026-10-02T12:04:27Z" },
        { label: "AWS Well-Architected: Operational Readiness Reviews (ORR)", url: "https://docs.aws.amazon.com/wellarchitected/latest/operational-readiness-reviews/wa-operational-readiness-reviews.html", kind: "docs", verifiedAt: "2026-10-02T12:04:27Z" },
        { label: "Google SRE Book: Reliable Product Launches at Scale", url: "https://sre.google/sre-book/reliable-product-launches/", kind: "docs", verifiedAt: "2026-10-02T12:04:27Z" },
      ],
      video: {
        title: "Go/No-Go Decisions in Business Analysis and Project Management – PMI-PBA Video Certification",
        channel: "InterfaceTT",
        url: "https://www.youtube.com/watch?v=jZlPDyamGoM",
        videoId: "jZlPDyamGoM",
        verifiedAt: "2026-10-02T12:05:33Z",
      },
      alternateVideos: [
        {
          title: "Ep 17 | What is a Go/No-Go Meeting? | Essential Project Management Skills",
          channel: "LOLA THE MANAGER",
          url: "https://www.youtube.com/watch?v=R075RnvTLyQ",
          videoId: "R075RnvTLyQ",
          verifiedAt: "2026-10-02T12:05:33Z",
        },
      ],
      sections: [
        {
          heading: "Purpose and when it happens",
          body: `The purpose is one recorded decision: go, no-go, or go with named conditions and a deadline for each.

When: after UAT sign-off and before cutover, typically 1–2 working days before go-live, so a no-go still leaves time to fix. For a mobile app, it also comes after store approval and before the manual release. Some teams add a short final checkpoint an hour before cutover to confirm nothing has changed.

Agree the go criteria in advance, ideally when you plan the release. A meeting that invents the criteria on the day becomes a negotiation.`,
        },
        {
          heading: "Who attends",
          body: `- **You (PM):** you chair, walk the checklist and record the decision.
- **Tech lead:** deployment, migration, rollback and production configuration.
- **QA lead:** test results, open defects by severity, smoke-test plan.
- **Client sponsor or approver:** the business go. Without them, the meeting cannot decide.
- **Client operations or support lead:** ready to handle users from day one.
- **For apps:** whoever controls the client's store accounts, if the release is manual.

Everyone with a veto attends. Everyone without one can read the minutes.`,
        },
        {
          heading: "Prepare: checklist",
          body: `Walk the go-live checklist template below. The usual items:

- UAT signed off; [[term:known-issues|known issues]] listed and accepted.
- No open [[term:blocker|blocker]] or critical defects; high ones either fixed or explicitly accepted.
- Production environment ready; production keys (payments, SMS, maps) set and tested.
- Hosting, domain and store accounts in the client's name.
- Data migration rehearsed, and its time fits the cutover window.
- [[term:rollback|Rollback]] plan written and rehearsed, with a decision point and an owner.
- Backup taken just before deployment.
- [[term:smoke-test|Smoke test]] script and owner.
- Hypercare contacts, hours and channel agreed.
- Go-live communication ready (client's users, internal team).`,
        },
        {
          heading: "Timed agenda template",
          body: `A 30–45 minute meeting. Typical.

1. Open: the decision we need, and the criteria agreed in advance (2 min).
2. Walk the checklist; each owner says ready, not ready, or ready with a condition (20 min).
3. Review open risks and the rollback plan, including the decision point during cutover (8 min).
4. Each veto holder gives a go or no-go (5 min).
5. Record the decision, any conditions with owner and deadline, and the cutover timeline (5 min).`,
        },
        {
          heading: "Sample script",
          body: `**Opening**
- "We're here to decide whether Thursday's go-live goes ahead. The criteria we agreed: UAT signed off, no open critical defects, production keys tested, rollback rehearsed."

**Steering through the checklist**
- "Tech lead, migration: how long did the rehearsal take, and how long is the window?"
- "QA, any open defects above low severity?"

**Raising a no-go fairly**
- "The migration took three hours in rehearsal and the window is two. That's a no-go today unless we agree a longer window or a faster migration plan. I'd rather tell you now than at 7 am on Thursday."

**Asking for the decision**
- "Let's go round the table. Tech lead? QA? Sarah, as sponsor?"

**Closing**
- "Decision: conditional go. Two conditions: the rollback rehearsal passes by Wednesday noon, and you confirm the 6–10 am window by Wednesday 3 pm. If either fails, we move to Tuesday. Minutes within the hour."`,
        },
        {
          heading: "What to show",
          body: `- The go-live checklist, live, with owner and status for each line.
- Open defects filtered to anything above low severity.
- The cutover timeline: each step, its owner, its start time, the rollback decision point.
- For apps: store review status and whether the release is manual or automatic.`,
        },
        {
          heading: "Traps and how to recover",
          body: `- **Deciding by date.** "We announced it" is not a criterion. Show the risk in business terms: "if the migration overruns, bookings stop at 8 am".
- **The meeting is too late.** A no-go at 7 am on launch day has no recovery. Hold it a day or two before.
- **Silent veto holders.** Ask each one by name. Silence is not a go.
- **Rollback never rehearsed.** An unrehearsed rollback is a hope, not a plan. Make it a condition.
- **Last-minute additions.** "Since you're deploying anyway, add the promo banner." No: anything not tested and signed off goes through a CR and a later release.
- **Store accounts in the agency's name.** Never publish to the client's customers from an account the client does not own. Follow the Oyelabs rule on client-owned accounts.`,
        },
        {
          heading: "Follow-up within 24 hours",
          body: `Send the decision within the hour, not the next day: people plan the cutover around it.

Template:

- **Subject:** Go/no-go decision: clinic booking platform v1.2.0
- "Decision: conditional GO for Thursday 6:00–10:00 cutover. Conditions: (1) rollback rehearsal passes by Wednesday 12:00 – tech lead; (2) client confirms the 6:00–10:00 window by Wednesday 15:00 – Sarah. If either fails, go-live moves to Tuesday and we reconvene Monday 11:00. Rollback decision point: 8:30 Thursday. Smoke test owner: QA lead. Hypercare contacts attached."`,
        },
      ],
      handbook: {
        stages: ["custom-release", "wl-golive"],
        rules: ["uat-signoff-before-golive", "client-owned-store-accounts", "hotfix-approval"],
        templates: ["golive-checklist", "mom"],
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-d04-go-no-go-q1",
          prompt: "When should the go/no-go meeting be held?",
          options: [
            "After UAT sign-off, typically 1–2 working days before cutover, so a no-go still leaves time to fix",
            "At 7 am on launch day",
            "Before UAT starts",
            "After the release, to review it",
          ],
          correctIndex: 0,
          explanation:
            "A no-go must leave time to act. A same-morning meeting can only rubber-stamp or cancel.",
        },
        {
          id: "pmp-d04-go-no-go-q2",
          prompt: "Which items are typical no-go criteria? (Select all that apply.)",
          options: [
            "An open critical defect in the payment flow",
            "Rollback plan never rehearsed",
            "Data migration time longer than the cutover window",
            "Two low-severity known issues accepted at UAT sign-off",
            "The client asking about a phase-2 feature",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Critical defects, an unrehearsed rollback and a migration that cannot fit the window threaten the launch. Accepted low issues and future ideas do not.",
        },
        {
          id: "pmp-d04-go-no-go-q3",
          prompt: "The client sponsor says: \"We've announced Thursday, so it's go whatever happens.\" Migration rehearsal overran the window by an hour. What do you do?",
          options: [
            "Explain the business risk plainly and propose options: a longer window, a faster migration plan, or a short slip",
            "Agree, because the client decides",
            "Cancel the launch without discussion",
            "Go ahead and skip the smoke test to save time",
          ],
          correctIndex: 0,
          explanation:
            "The sponsor owns the business decision, but it must be an informed one. Show the impact (bookings down at opening time) and offer options; then record the decision.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-go-no-go-q4",
          prompt: "The day before go-live, the client's marketing lead asks to add a new promo banner \"since you're deploying anyway\". What is the answer?",
          options: [
            "No for this release: it was not tested or signed off. Raise it as a CR for a later release",
            "Yes, it's small",
            "Yes, if the developer says it's quick",
            "Move go-live by a day to include it",
          ],
          correctIndex: 0,
          explanation:
            "Untested changes at cutover are a classic cause of failed launches. Small does not mean safe.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-go-no-go-q5",
          prompt: "Who must attend for the meeting to be able to decide?",
          options: [
            "Everyone with a veto: tech lead, QA lead and the client sponsor or approver",
            "Only the PM and tech lead",
            "The whole development team",
            "Only the client's marketing team",
          ],
          correctIndex: 0,
          explanation:
            "Readiness has technical, quality and business sides. Without the client approver, the meeting can only recommend.",
        },
        {
          id: "pmp-d04-go-no-go-q6",
          prompt: "What is a conditional go?",
          options: [
            "A go that depends on named conditions, each with an owner and a deadline, and a fallback date if one fails",
            "A go where the team will decide on the night",
            "A go without UAT sign-off",
            "A no-go that is not written down",
          ],
          correctIndex: 0,
          explanation:
            "Conditions only work when they are specific, owned and dated, with an agreed consequence if they fail.",
        },
        {
          id: "pmp-d04-go-no-go-q7",
          prompt: "The white-label reseller asks you to release the app from Oyelabs' store account because the end client's account is not ready. What is the position?",
          options: [
            "Decline: the store account must be client-owned; treat the account as a go-live dependency",
            "Agree and transfer the app later",
            "Agree if the reseller signs an email",
            "Release on Android only from the agency account",
          ],
          correctIndex: 0,
          explanation:
            "Publishing from an account the client does not own creates ownership and transfer problems. It is a go-live dependency, not something to work around.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-go-no-go-q8",
          prompt: "Why record the rollback decision point (for example 8:30 am) at the go/no-go meeting?",
          options: [
            "So nobody has to negotiate under pressure during cutover: if the checks fail by that time, you roll back",
            "Because the contract always requires it",
            "To blame the tech lead if the release fails",
            "It is not useful; rollback is decided on the night",
          ],
          correctIndex: 0,
          explanation:
            "Decisions made in advance are calmer and better. During a failing cutover, people tend to push on too long.",
        },
        {
          id: "pmp-d04-go-no-go-q9",
          prompt: "What should the decision minutes include? (Select all that apply.)",
          options: [
            "The decision and who gave it",
            "Conditions with owners and deadlines",
            "The cutover window and the rollback decision point",
            "Hypercare contacts",
            "Every developer's working hours for the month",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "The minutes are the operating plan for launch day. Individual working hours are internal detail.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "Go/no-go meeting on Tuesday for a Laravel and React Native booking platform for a UK clinic chain. Planned go-live: Thursday, 8:00. Status: UAT signed off with two low-severity known issues. Apple and Google have approved the builds, held for manual release from the client's accounts. Production payment keys were tested on Monday. The data migration rehearsal on staging took 3 hours; the agreed cutover window is 6:00–8:00. A rollback plan is written but has never been rehearsed. One high-severity defect (SMS reminders sent twice) is fixed and in regression testing, with results due Wednesday at noon.",
        steps: [
          {
            id: "blockers",
            question: "Which item stops you from giving a clean Go today?",
            options: [
              "The migration does not fit the cutover window, and the rollback has never been rehearsed",
              "The two low-severity known issues accepted at UAT",
              "The store builds being held for manual release",
              "The payment keys being tested only on Monday",
            ],
            correctIndex: 0,
            explanation:
              "A 3-hour migration in a 2-hour window and an unrehearsed rollback are real launch risks. Accepted low issues and a manual store release are normal and planned.",
          },
          {
            id: "decision",
            question: "What do you recommend at Tuesday's meeting?",
            options: [
              "Go, and hope the migration runs faster in production",
              "Conditional: re-run the checkpoint on Wednesday at 15:00 with explicit criteria (a longer window agreed or a faster migration, rollback rehearsed, SMS regression passed), with a fallback date if any fails",
              "Cancel the launch and replan for next month",
              "Go, but skip the smoke test to save time in the window",
            ],
            correctIndex: 1,
            explanation:
              "A conditional decision with named criteria and a fallback keeps Thursday possible without gambling on it. Cancelling is an overreaction; skipping the smoke test adds risk.",
          },
          {
            id: "late-add",
            question:
              "Wednesday 15:00: the rollback rehearsal passed, the client agreed a 6:00–10:00 window, and the SMS regression passed. The client's marketing lead now asks to ship a new promo banner with tomorrow's release. What do you do?",
            options: [
              "Give the Go as planned; the banner goes through a CR and a later release",
              "Add the banner, since it is a small front-end change",
              "Move go-live by a day to include the banner",
              "Let the developers decide on the night",
            ],
            correctIndex: 0,
            explanation:
              "Only tested, signed-off changes go into the cutover. The banner can follow in a normal release after a CR.",
          },
        ],
      },
      sop: [
        {
          title: "Our go/no-go criteria and who gives the Oyelabs go",
          prompt:
            "[Oyelabs SOP – admin to fill] The standard go criteria for custom and white-label releases, who on the Oyelabs side must give a go (PM, tech lead, QA lead, delivery head), and where the decision minutes are stored.",
        },
      ],
    },
    {
      id: "pmp-d04-closure-handover",
      moduleId: "pmp-d04",
      trackId: "pm",
      title: "Project closure and handover meeting",
      summary: `The closure and handover meeting formally ends the project phase. The client confirms that deliverables, documentation, credentials and knowledge have been handed over as the contract says, the open items are listed with owners, and the relationship moves to [[term:support|support]], an [[term:amc|AMC]], a [[term:retainer|retainer]] or a next phase.

It matters at an agency for three reasons. Money: the final [[term:milestone|milestone]] is often tied to it. Risk: until credentials and [[term:source-code-handover|source code]] are handed over properly, the agency still holds production access it should not have, and the client depends on people who are leaving the project. Reputation: a clean close is when you ask for the case study or the referral.

How to run it: walk the [[term:handover|handover]] checklist line by line (code, environments, accounts, documentation, [[term:knowledge-transfer|KT]] sessions), confirm what is complete and what is open, review the [[term:warranty|warranty]] or support terms that now apply, present the closure report, and get sign-off.

The common mistake is a vague close: "we'll send the rest later". Six months on, nobody knows whether the client has the server password, and a [[term:warranty|warranty]] claim turns into a dispute. The other mistake is sharing credentials by email or chat. Follow the Oyelabs rule in the handbook card below on secure credential sharing.

Not legal advice: the signed contract always wins. What is handed over, and when, is set by the contract, often after the final payment.`,
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Learn: Plan your support operations (transition and hypercare)", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/transition-to-support-operations", kind: "docs", verifiedAt: "2026-10-02T12:04:28Z" },
        { label: "GOV.UK Service Manual: How the live phase works", url: "https://www.gov.uk/service-manual/agile-delivery/how-the-live-phase-works", kind: "spec", verifiedAt: "2026-10-02T12:04:28Z" },
        { label: "Asana: Project Closure (8 steps and checklist)", url: "https://asana.com/resources/project-closure", kind: "article", verifiedAt: "2026-10-02T12:04:31Z" },
        { label: "ProjectManager: 7 Steps to Project Closure", url: "https://www.projectmanager.com/blog/project-closure", kind: "article", verifiedAt: "2026-10-02T12:04:30Z" },
      ],
      video: {
        title: "Closing the Project [5 STEPS TO PROJECT CLOSURE]",
        channel: "Adriana Girdler",
        url: "https://www.youtube.com/watch?v=Fl5BVFzigt8",
        videoId: "Fl5BVFzigt8",
        verifiedAt: "2026-10-02T12:05:34Z",
      },
      alternateVideos: [
        {
          title: "Project Handover Process [OVER TO YOU!]",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=OLibddcR3Yg",
          videoId: "OLibddcR3Yg",
          verifiedAt: "2026-10-02T12:05:34Z",
        },
        {
          title: "Project101x: Project closure and handover",
          channel: "Project101x: Introduction to Project Management",
          url: "https://www.youtube.com/watch?v=_mXFK_1DkHE",
          videoId: "_mXFK_1DkHE",
          verifiedAt: "2026-10-02T12:05:34Z",
        },
      ],
      sections: [
        {
          heading: "Purpose and when it happens",
          body: `The purpose is a signed record that the project phase is complete: what was delivered, what was handed over, what is still open, and what support arrangement applies from now on.

When: after [[term:hypercare|hypercare]] ends or nears its end, once the handover items the contract ties to final payment are ready. The move from project to support should be gradual. Ideally the support team starts handling real issues during UAT and hypercare, so the closure meeting confirms a transition that already happened rather than starting one.`,
        },
        {
          heading: "Who attends",
          body: `- **You (PM):** you run it and present the closure report.
- **Tech lead:** confirms code, environments, documentation and access changes.
- **Support lead or the person taking over:** if Oyelabs continues under an AMC or support contract.
- **Account manager:** for the next-phase, renewal or case-study conversation.
- **Client sponsor and the client's technical owner:** the person who will now hold the code, the accounts and the credentials.`,
        },
        {
          heading: "Prepare: checklist",
          body: `- The handover and KT checklist from the template below, with status for every line.
- Repository transferred, or access granted, as the contract says (for example the client's own GitHub organisation).
- Credentials handed over through the approved secure method, and the agency's access reviewed or removed.
- Environments, domains, hosting, store and third-party accounts confirmed in the client's name.
- Documentation: setup guide, architecture overview, runbooks, API docs.
- KT sessions held and recorded; any remaining session dated.
- The closure report: scope delivered vs planned, [[term:change-request|CR]] summary, schedule and budget performance, quality summary, open items, lessons learned.
- The warranty or support terms that now apply, with dates and the channel for raising issues.`,
        },
        {
          heading: "Timed agenda template",
          body: `A 60-minute meeting. Typical.

1. Open: purpose, what sign-off means today (3 min).
2. Closure report: outcomes, scope, CRs, schedule, quality (12 min).
3. Handover checklist, line by line: code, environments, accounts, credentials, documentation, KT (20 min).
4. Open items: owner and date for each (8 min).
5. What happens now: warranty end date, support or AMC, how to raise issues, response times (10 min).
6. Sign-off, and the next conversation (case study, next phase, account review) (7 min).`,
        },
        {
          heading: "Sample script",
          body: `**Opening**
- "Today we close the build phase. By the end, I'd like your sign-off on the handover, with any open items written down with owners and dates."

**Steering the handover**
- "Code: the repository is now in your GitHub organisation, and your tech lead has admin access. Can you confirm that on your side?"
- "Credentials were shared through the password manager vault on Monday. We've removed our developers' production access, except the two support engineers named in the AMC."

**Being clear about what is open**
- "One KT session is left, on the deployment runbook. It's booked for the 28th. I'll list it as an open item rather than call the handover complete."

**Explaining what happens next**
- "Warranty runs until 15 April and covers defects against the signed scope. After that, the AMC applies. Issues go to the support desk, not to me directly."

**Asking for the decision**
- "Are you happy to sign the closure report with that one open item?"`,
        },
        {
          heading: "What to show",
          body: `- The closure report, section by section.
- The handover checklist with evidence for each line (screenshot of repo ownership, vault share date, KT recording links).
- The support model on one page: channel, hours, response and resolution targets from the contract, and the escalation path.
- Open items, each with owner and date.`,
        },
        {
          heading: "Traps and how to recover",
          body: `- **"We'll send the rest later."** Write down every open item with an owner and a date. A handover with undocumented gaps becomes a dispute.
- **Credentials sent by email or chat.** Rotate them, re-share through the approved method, and note it in the minutes.
- **Agency access never removed.** It is a security risk for the client and a liability for Oyelabs. Review and remove it as part of closure.
- **Handover before payment, against the contract.** Some contracts tie source code handover to final payment. Check with your manager; do not improvise either way.
- **Warranty confused with support.** Explain clearly what warranty covers and when it ends, and what the paid support model covers after.
- **No one owns the product after you.** If the client has no technical owner, raise it as a risk and suggest support options.`,
        },
        {
          heading: "Follow-up within 24 hours",
          body: `Send the signed (or ready-to-sign) closure report, the completed handover checklist and the support guide.

Template:

- **Subject:** Project closure and handover: clinic booking platform
- "Hi Sarah, thank you for today. Attached: the closure report and the handover checklist. Status: all items complete except the deployment runbook KT, booked for 28 March (owner: our tech lead). Warranty runs until 15 April; after that the AMC starts. Please raise issues through the support desk. Please sign the closure report by Friday. We'll book the first quarterly account review for late June."`,
        },
      ],
      handbook: {
        stages: ["custom-handover", "custom-closure"],
        rules: ["secure-credential-sharing", "warranty-coverage"],
        templates: ["handover-kt-checklist", "closure-report"],
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-d04-closure-handover-q1",
          prompt: "At the closure meeting, one KT session is still scheduled for next week. How do you record the handover?",
          options: [
            "Complete except listed open items, with the KT session's owner and date",
            "Complete, since the session is booked",
            "Not started",
            "Leave it out of the report",
          ],
          correctIndex: 0,
          explanation:
            "Accurate status with dated open items protects both sides. Calling it complete invites a dispute if the session slips.",
        },
        {
          id: "pmp-d04-closure-handover-q2",
          prompt: "Which belong on the handover checklist? (Select all that apply.)",
          options: [
            "Source code repository transferred or access granted as the contract says",
            "Credentials shared through the approved secure method",
            "Agency production access reviewed or removed",
            "Documentation and KT session recordings",
            "The developers' internal performance reviews",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Code, credentials, access and knowledge are what the client needs to own and operate the product. Internal reviews are not part of a handover.",
        },
        {
          id: "pmp-d04-closure-handover-q3",
          prompt: "A developer emailed the production database password to the client to save time. What do you do?",
          options: [
            "Rotate the password, re-share it through the approved secure method, and note it in the minutes",
            "Nothing; the client has it now",
            "Ask the client to delete the email",
            "Reply-all with the correct process",
          ],
          correctIndex: 0,
          explanation:
            "A credential in an email is exposed. Rotating it is the only real fix; then follow the secure-sharing rule.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-closure-handover-q4",
          prompt: "The client asks for the full source code today, but the contract ties handover to the final payment, which is still outstanding. What is the right move?",
          options: [
            "Explain what the contract says, check with your manager, and agree the handover date that follows payment",
            "Hand it over anyway to keep the client happy",
            "Refuse and stop all communication",
            "Hand over half of the code",
          ],
          correctIndex: 0,
          explanation:
            "The contract sets the terms. Be clear and polite, involve your manager, and avoid improvising either a refusal or a concession.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-closure-handover-q5",
          prompt: "Why should the support team start handling real issues during UAT or hypercare?",
          options: [
            "So the move from project to support is gradual and tested before the project team leaves",
            "So the project team can stop testing",
            "Because hypercare is billed to the support team",
            "So the client cannot reach the PM",
          ],
          correctIndex: 0,
          explanation:
            "A gradual transition finds gaps in documentation and access while the builders are still around to fix them.",
        },
        {
          id: "pmp-d04-closure-handover-q6",
          prompt: "The client asks: \"So after today, if something breaks, it's free?\" How do you answer?",
          options: [
            "Explain the warranty end date and what it covers (defects against signed scope), and what the support model covers after",
            "Yes, everything is free forever",
            "No, everything is billable from today",
            "Say you will check later",
          ],
          correctIndex: 0,
          explanation:
            "Warranty and support are different. Being precise now avoids disputes later.",
        },
        {
          id: "pmp-d04-closure-handover-q7",
          prompt: "What does a closure report typically contain? (Select all that apply.)",
          options: [
            "Scope delivered versus planned, and the CR summary",
            "Schedule and budget performance",
            "Quality summary and known issues",
            "Lessons learned and open items",
            "A new estimate for phase 2",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "The closure report summarises the project that ended. A phase-2 estimate is a separate proposal.",
        },
        {
          id: "pmp-d04-closure-handover-q8",
          prompt: "Weeks after closure, you notice two former project developers still have admin access to the client's production server. What is the issue?",
          options: [
            "Agency access was not reviewed at closure; it is a security risk and must be removed now and logged",
            "No issue; they might help later",
            "The client should have removed it",
            "It only matters if the AMC is not renewed",
          ],
          correctIndex: 0,
          explanation:
            "Access review is part of handover. Remove it, tell the client, and add the check to the closure checklist.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        prompt: "Fill in the key parts of the closure report from the project facts below.",
        context:
          "Project: Laravel booking platform for a UK clinic chain, eight months.\n\n- Go-live baseline: 3 March. Actual go-live: 17 March. The two-week change came from CR-004, which the client approved with a new date.\n- Change requests: 6 raised. 4 approved and delivered, 1 rejected by the client, 1 deferred to phase 2.\n- Budget: within the approved budget including approved CRs.\n- Quality: 2 low-severity known issues open, fixed in v1.2.1 by 30 March. No critical defects in hypercare.\n- Handover: repository transferred to the client's GitHub organisation. Credentials shared through the password manager vault; agency production access removed except the two named AMC engineers. KT: 2 of 3 sessions held and recorded; the deployment runbook session is booked for 28 March.\n- Lessons: late client dependencies cost 11 working days; the rollback was rehearsed only after the go/no-go.",
        templateId: "closure-report",
        fields: [
          { id: "summary", label: "Project summary and outcome", input: "textarea", required: true },
          { id: "crApproved", label: "Number of CRs approved and delivered", input: "number", required: true },
          { id: "slipWeeks", label: "Schedule variance against baseline (weeks)", input: "number", required: true },
          { id: "schedule", label: "Schedule and budget performance", input: "textarea", required: true },
          {
            id: "handoverStatus",
            label: "Handover status",
            input: "select",
            options: ["Complete", "Complete except listed open items", "In progress", "Not started"],
            required: true,
          },
          { id: "openItems", label: "Open items and recommendations", input: "textarea", required: true },
          { id: "lessons", label: "Lessons learned", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "crApproved", expected: 4 },
          { fieldId: "slipWeeks", expected: 2 },
          { fieldId: "handoverStatus", expected: "Complete except listed open items" },
        ],
        rubric: [
          { label: "Schedule variance explained with its cause", points: 2, description: "Says go-live was two weeks after baseline because of the approved CR-004 date change, and that budget held." },
          { label: "Open items have owners and dates", points: 2, description: "Lists the KT session on 28 March and the v1.2.1 fixes by 30 March, with owners." },
          { label: "Lessons are actionable", points: 2, description: "Turns the dependency delays and the late rollback rehearsal into concrete changes for next time." },
        ],
        sampleAnswer: {
          summary: "Laravel booking platform for a UK clinic chain, eight months. Launched on 17 March; all signed-off scope delivered plus 4 approved CRs.",
          crApproved: "4",
          slipWeeks: "2",
          schedule:
            "Go-live 17 March versus a 3 March baseline (2 weeks), caused by CR-004, which the client approved with a new date. Within the approved budget including CRs. 6 CRs raised: 4 delivered, 1 rejected, 1 deferred to phase 2.",
          handoverStatus: "Complete except listed open items",
          openItems:
            "1. Deployment runbook KT session, 28 March – Oyelabs tech lead. 2. Two low-severity known issues fixed in v1.2.1 by 30 March – Oyelabs. 3. Phase 2 to include the deferred CR – account manager to propose.",
          lessons:
            "Log every client dependency with a date and client owner at kickoff (11 working days lost to late dependencies). Rehearse rollback before the go/no-go, not after.",
        },
      },
      sop: [
        {
          title: "Our handover pack and access-removal procedure",
          prompt:
            "[Oyelabs SOP – admin to fill] The standard handover pack (documents, runbooks, recordings), the approved credential-sharing tool, who removes agency access and when, and who approves source-code handover when payment is outstanding.",
        },
      ],
    },
    {
      id: "pmp-d04-account-review",
      moduleId: "pmp-d04",
      trackId: "pm",
      title: "Quarterly business / account review",
      summary: `A [[term:qbr|quarterly business review]] (QBR) is a structured meeting with a client you keep after launch: an [[term:amc|AMC]], a [[term:retainer|retainer]] or a long-running product. It looks back at outcomes against the client's goals, looks forward at the next quarter, and keeps the relationship at the level of business value rather than tickets.

It matters at an agency because retained accounts are where steady revenue lives, and they are lost quietly. A client who only hears from you when something breaks starts to see you as a cost. A QBR shows what the support and the product achieved, surfaces problems before the [[term:renewal|renewal]] date, and creates room for the next phase.

How to run it: open with an executive summary in the client's terms, then KPIs (uptime, tickets handled within [[term:sla|SLA]], releases shipped, business metrics the client cares about), progress against last quarter's goals, a frank health check, and agreed actions with owners. Typical guidance: keep it to an hour, and book the next QBR before you leave.

The common mistakes are a templated deck that ignores what the client cares about this quarter, and a disguised sales pitch. The subtler one is hiding a problem in the data: for example, AMC hours that keep running over because small [[term:enhancement|enhancements]] are being done as support. Show it, explain it, and offer fair options. Do not absorb it silently or bill it retroactively. Not legal advice: the signed contract always wins.`,
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Atlassian Team Playbook: Goals, Signals, and Measures", url: "https://www.atlassian.com/team-playbook/plays/goals-signals-measures", kind: "docs", verifiedAt: "2026-10-02T12:04:30Z" },
        { label: "Atlassian Team Playbook: Health Monitor", url: "https://www.atlassian.com/team-playbook/health-monitor", kind: "docs", verifiedAt: "2026-10-02T12:04:30Z" },
        { label: "Gainsight: The Essential Guide to Quarterly Business Reviews", url: "https://www.gainsight.com/essential-guide/quarterly-business-reviews-qbrs/", kind: "article", verifiedAt: "2026-10-02T12:04:32Z" },
      ],
      video: {
        title: "Quarterly Business Review Best Practices: 9 Ways to Transform Your QBR From Boring to Brilliant",
        channel: "The KAM Club",
        url: "https://www.youtube.com/watch?v=aZiBPXngi0g",
        videoId: "aZiBPXngi0g",
        verifiedAt: "2026-10-02T12:05:34Z",
      },
      alternateVideos: [
        {
          title: "How to Develop a Quarterly Business Review (QBR)",
          channel: "Gainsight",
          url: "https://www.youtube.com/watch?v=XSPWC_Pn42w",
          videoId: "XSPWC_Pn42w",
          verifiedAt: "2026-10-02T12:05:34Z",
        },
      ],
      sections: [
        {
          heading: "Purpose and when it happens",
          body: `The purpose is to agree, at a business level, how the last quarter went and what the next one should achieve, and to catch relationship problems early.

When: every quarter for retained accounts (AMC, retainer, ongoing product work), and especially in the quarter before a [[term:renewal|renewal]]. It does not fit a fixed-price build that has closed; for those, the closure meeting is the last structured review.

The first QBR is usually booked at the closure meeting, about three months after go-live. Typical; agree the rhythm with the client.`,
        },
        {
          heading: "Who attends",
          body: `- **You (PM or account owner):** you run it.
- **Account manager:** for renewal, next-phase and commercial topics.
- **Support lead or tech lead:** for the numbers and the technical roadmap.
- **Client sponsor:** the person who decides on renewal and budget. A QBR with only the day-to-day contact cannot discuss value or renewal.
- **The client's day-to-day contact:** for the operational view.`,
        },
        {
          heading: "Prepare: checklist",
          body: `- The client's current goals. Ask before the meeting: "What matters most to you next quarter?"
- KPIs for the quarter: uptime, tickets by type, response and resolution against the [[term:sla|SLA]], releases shipped, AMC or retainer hours used.
- Business outcomes the product supports (bookings, orders, sign-ups), if the client shares them.
- Last QBR's actions and their status.
- An honest health view: what went badly, and what you changed.
- Any pattern in the data the client should know about, for example enhancements being raised as support tickets.
- Ideas for the next quarter, framed as the client's goals, not a product catalogue.
- The renewal date and terms, checked with the account manager.`,
        },
        {
          heading: "Timed agenda template",
          body: `A 60-minute QBR. Typical.

1. Executive summary: the quarter in three sentences, in the client's terms (5 min).
2. KPIs and SLA performance (10 min).
3. Progress against last quarter's goals and actions (10 min).
4. Health check: what went well, what didn't, what we changed (10 min).
5. Next quarter: the client's goals, the roadmap, and options (15 min).
6. Actions with owners, and book the next QBR (10 min).`,
        },
        {
          heading: "Sample script",
          body: `**Opening**
- "This quarter in three lines: 99.9% uptime, every urgent ticket resolved within SLA, and the new booking flow you asked for shipped in May."

**Steering to value**
- "You told us in April that reducing no-shows was the priority. Since the reminder CR went live, no-shows are down from 14% to 9%, based on your figures."

**Raising a hard point fairly**
- "One pattern you should see: 31 of 38 tickets this quarter were small enhancements, not defects. They used most of the AMC hours, so we went 20% over in June. We haven't billed beyond the AMC. Going forward, there are two fair options: a monthly enhancement budget, or we prioritise enhancements within the AMC hours and queue the rest."

**Asking for decisions**
- "Which of those would you prefer for next quarter?"

**Closing**
- "Three actions, owners and dates as listed. Shall we book the next review for the second week of October?"`,
        },
        {
          heading: "What to show",
          body: `- A short deck or one-page dashboard: summary, KPIs, goals progress, health, next quarter.
- Ticket mix by classification (defect, enhancement, CR, clarification) and SLA performance.
- Business metrics in the client's terms, with the source stated.
- The renewal timeline, only if the sponsor is present and the account manager agreed to cover it.`,
        },
        {
          heading: "Traps and how to recover",
          body: `- **A generic template deck.** If it could be shown to any client, it will bore this one. Lead with the client's goals.
- **A sales pitch in disguise.** Upsell ideas belong in "next quarter" and must solve the client's stated goals.
- **Hiding bad news.** If SLA was missed, say so, with the cause and the fix. The client already knows.
- **Absorbing scope silently.** Enhancements done as support erode the AMC. Show the pattern and offer options.
- **Billing retroactively without agreement.** Do not surprise the client with past hours the contract did not cover. Agree the model going forward.
- **Renewal price negotiated on the spot.** Note the request, and reply in writing after internal review.
- **No next date.** Book the next QBR before leaving.`,
        },
        {
          heading: "Follow-up within 24 hours",
          body: `Send the summary, the actions and the next QBR invite.

Template:

- **Subject:** Q2 account review: summary and actions
- "Hi Grace, thank you for today. Summary: 99.9% uptime; all urgent tickets within SLA; booking flow live in May; no-shows down from 14% to 9% (your figures). Agreed: from July, a monthly enhancement budget of up to 20 hours, approved by you each month (account manager to send the change by 10 July). Actions: (1) loyalty phase-2 estimate – PM – 20 July; (2) Hindi menu CR decision – you – 15 July. Next review: 9 October, 11:00."`,
        },
      ],
      handbook: {
        stages: ["custom-support"],
        rules: ["billing-enhancement", "warranty-coverage", "weekly-status-report"],
        templates: ["status-report-rag", "mom"],
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-d04-account-review-q1",
          prompt: "Which kind of client is a QBR most suited to?",
          options: [
            "A retained client on an AMC, a retainer or ongoing product work",
            "A fixed-price build that closed last month",
            "A prospect who has not signed yet",
            "Any client, every week",
          ],
          correctIndex: 0,
          explanation:
            "A QBR reviews an ongoing relationship. A closed fixed-price build ends with the closure meeting.",
        },
        {
          id: "pmp-d04-account-review-q2",
          prompt: "What should open a QBR?",
          options: [
            "An executive summary of the quarter in the client's own terms and goals",
            "A list of every ticket closed",
            "A pitch for a new product",
            "The renewal price",
          ],
          correctIndex: 0,
          explanation:
            "The sponsor needs the headline first, framed around what they care about. Details and ideas come later.",
        },
        {
          id: "pmp-d04-account-review-q3",
          prompt: "Your data shows that most AMC hours this quarter went on small enhancements raised as support tickets, and hours ran 20% over. The contract does not cover extra hours. What is the fair approach?",
          options: [
            "Show the pattern, explain it, and agree a model going forward (an enhancement budget, or prioritising within AMC hours)",
            "Absorb it silently to keep the client happy",
            "Bill the extra 20% retroactively without discussion",
            "Stop handling tickets until the client pays",
          ],
          correctIndex: 0,
          explanation:
            "Fair and firm: make the issue visible and agree how it works from now on. Silent absorption erodes the account; surprise bills destroy trust.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-account-review-q4",
          prompt: "Which KPIs typically belong in an agency QBR? (Select all that apply.)",
          options: [
            "Uptime",
            "Response and resolution against the SLA",
            "Releases shipped and the ticket mix by type",
            "Business metrics the client shares, such as bookings or no-show rate",
            "Each developer's hours logged per day",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "KPIs show service quality and business value. Individual developer timesheets are internal.",
        },
        {
          id: "pmp-d04-account-review-q5",
          prompt: "Mid-meeting, the sponsor asks for a 3-year renewal at a 15% discount. What do you do?",
          options: [
            "Note the request, and say you will come back in writing by a set date after internal review",
            "Agree on the spot to secure the renewal",
            "Refuse, since discounts are never possible",
            "Ignore the question and move on",
          ],
          correctIndex: 0,
          explanation:
            "Renewal pricing is a commercial decision. A dated written answer keeps the conversation positive without improvising terms.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-account-review-q6",
          prompt: "SLA was missed twice this quarter. How do you handle it in the QBR?",
          options: [
            "State it plainly with the cause and what you changed",
            "Leave it out; the client may not have noticed",
            "Blame the client's late responses",
            "Mention it only if the client asks",
          ],
          correctIndex: 0,
          explanation:
            "The client usually knows already. Owning it with a fix builds more trust than a clean-looking dashboard.",
        },
        {
          id: "pmp-d04-account-review-q7",
          prompt: "Which are signs of a weak QBR? (Select all that apply.)",
          options: [
            "A templated deck that ignores the client's current goals",
            "No next QBR booked",
            "Only the day-to-day contact attends",
            "Actions with owners and dates",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Generic content, no follow-up date and no decision maker all weaken a QBR. Owned actions are a sign of a strong one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d04-account-review-q8",
          prompt: "Where do upsell ideas belong in a QBR?",
          options: [
            "In the next-quarter section, framed as ways to meet the client's stated goals",
            "At the start, before the KPIs",
            "Nowhere; never mention new work",
            "In a separate email sent during the meeting",
          ],
          correctIndex: 0,
          explanation:
            "New work is welcome when it serves the client's goals. Leading with it makes the QBR feel like a sales call.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You run the Q2 account review with the owner of a three-outlet bakery chain. Her ordering app went live nine months ago and is on an AMC. This quarter: 99.9% uptime; 38 tickets, of which 31 were small enhancements (new menu filters, banner changes, report columns) raised as support; AMC hours ran 20% over in June. The contract does not cover hours beyond the AMC. The no-show rate on pre-orders fell after a reminder CR shipped in May.",
        steps: [
          {
            id: "open",
            question: "How do you open the review?",
            options: [
              "A three-line summary in her terms: uptime, urgent tickets within SLA, the reminder CR live and the pre-order no-shows down",
              "A full list of the 38 tickets",
              "A pitch for a loyalty app",
              "The AMC overrun and what she owes",
            ],
            correctIndex: 0,
            explanation: "Lead with value in the client's terms. The detail and the hard point come later, in context.",
          },
          {
            id: "overrun",
            question: "How do you handle the 20% AMC overrun caused by enhancements?",
            options: [
              "Absorb it quietly and say nothing",
              "Show the ticket mix, explain that enhancements used the hours, say you have not billed beyond the AMC, and offer options for the future: a monthly enhancement budget or prioritising within AMC hours",
              "Send an invoice for the extra hours after the meeting",
              "Tell her to stop raising tickets",
            ],
            correctIndex: 1,
            explanation: "Make it visible and agree a fair model going forward. Neither silent absorption nor a surprise retroactive bill.",
          },
          {
            id: "renewal",
            question: "She says: \"If I renew for two years, I want 15% off.\" What do you say?",
            options: [
              "\"Done, I'll update the contract.\"",
              "\"Discounts aren't possible.\"",
              "\"Thank you, I'll take that to our account manager and reply in writing by Friday.\" Then book the next review",
              "\"Let's talk about that next quarter.\"",
            ],
            correctIndex: 2,
            explanation: "Renewal pricing is a commercial decision for the right person. Give a dated written answer and keep the review on track.",
          },
        ],
      },
      sop: [
        {
          title: "Our QBR deck and renewal process",
          prompt:
            "[Oyelabs SOP – admin to fill] The standard QBR deck or dashboard, which accounts get a QBR, who attends from Oyelabs, how far before renewal the renewal proposal goes out, and who approves renewal pricing.",
        },
      ],
    },
  ],
} satisfies Module;
