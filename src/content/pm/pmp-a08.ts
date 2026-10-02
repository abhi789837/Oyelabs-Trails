import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a08",
  trackId: "pm",
  name: "Sprint execution",
  description:
    "How an Oyelabs custom project is actually built, sprint after sprint: the cadence of planning, standups, demos and retros, the daily EOD update the client reads, and turning demo feedback into the right kind of work without giving scope away.",
  topics: [
    // ---------------------------------------------------------------------------------------------
    // Sprint cadence
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-a08-sprint-cadence",
      moduleId: "pmp-a08",
      trackId: "pm",
      title: "Sprint cadence and Scrum events",
      summary: `Once [[term:sprint-0|Sprint 0]] is done, a custom project runs as a repeating loop of [[term:sprint|sprints]]. Each one has the same shape: plan, build and test, show the client, look back, start again. The loop matters at an agency because the client cannot see the code. The rhythm of events is the only way they see progress, and the only point where they can steer without breaking the plan.

The Scrum Guide sets the events and their maximum length. A sprint is one month or less. For a one-month sprint, sprint planning is at most 8 hours, the sprint review at most 4 hours and the retrospective at most 3 hours. Shorter sprints get shorter events. The daily scrum is 15 minutes. Two-week sprints are typical for agency work.

As the PM you own the calendar and the boundaries. Planning only pulls in [[term:backlog|backlog]] items that meet the [[term:definition-of-ready|definition of ready]]. Work only counts as done when it meets the [[term:definition-of-done|definition of done]]. Anything the client asks for mid-sprint goes to the backlog first, not straight to a developer.

The common mistake is letting the sprint boundary dissolve. The client messages a developer directly, a "small" change slips in, the demo shows half-finished work, and nobody can say what the sprint actually delivered. Protect the sprint goal, and route every new ask through the backlog and, when it changes scope, through a [[term:change-request|change request]].`,
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Scrum Guides: The Scrum Guide (2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: "2026-10-02T11:51:24Z" },
        { label: "Atlassian: Agile ceremonies and scrum meetings", url: "https://www.atlassian.com/agile/scrum/ceremonies", kind: "article", verifiedAt: "2026-10-02T11:52:14Z" },
        { label: "Atlassian: Sprint planning", url: "https://www.atlassian.com/agile/scrum/sprint-planning", kind: "article", verifiedAt: "2026-10-02T11:54:24Z" },
        {
          label: "Microsoft Learn: Manage sprint timelines (Azure Boards)",
          url: "https://learn.microsoft.com/en-us/azure/devops/boards/sprints/define-sprints?view=azure-devops",
          kind: "docs",
          verifiedAt: "2026-10-02T11:54:33Z",
        },
      ],
      video: {
        title: "Scrum Events Explained | Sprint Planning, Daily Standups, Sprint Review & Retrospective",
        channel: "PM Expert",
        url: "https://www.youtube.com/watch?v=-UXdINVaj9c",
        videoId: "-UXdINVaj9c",
        verifiedAt: "2026-10-02T12:17:08Z",
      },
      alternateVideos: [
        {
          title: "Scrum Events | Sprint, Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective",
          channel: "Volkerdon",
          url: "https://www.youtube.com/watch?v=Gfl9qvRwHzw",
          videoId: "Gfl9qvRwHzw",
          verifiedAt: "2026-10-02T12:17:08Z",
        },
      ],
      handbook: {
        stages: ["custom-sprints"],
        rules: ["weekly-status-report", "cr-when-needed"],
        templates: ["status-report-rag"],
      },
      sections: [
        {
          heading: "The events and their timeboxes",
          body: `The Scrum Guide gives maximum lengths for a one-month sprint. Shorter sprints usually get shorter events.

- **Sprint:** one month or less. Two weeks is typical at agencies, because the client sees something new often enough to stay confident.
- **Sprint planning:** at most 8 hours for a one-month sprint. For a two-week sprint, typically half a day or less. Output: a sprint goal and the items the team commits to.
- **Daily scrum (standup):** 15 minutes, every working day, for the team. It is not a status meeting for the client.
- **Sprint review (the client demo):** at most 4 hours for a one-month sprint. The team shows what is done and the client gives feedback.
- **Sprint retrospective:** at most 3 hours for a one-month sprint. The team improves how it works.

Note what the Scrum Guide does *not* contain: "Sprint 0", "definition of ready" and "acceptance criteria" are common practice, not Scrum. Use them, but do not claim the Scrum Guide requires them.`,
        },
        {
          heading: "Entry and exit for each sprint",
          body: `**A sprint can start when:**
- the previous sprint's review and retro are done (or Sprint 0 for the first one);
- the top of the backlog meets the [[term:definition-of-ready|definition of ready]]: clear [[term:user-story|user stories]], [[term:acceptance-criteria|acceptance criteria]], approved designs, no open client questions;
- the team's availability for the sprint is known (leave, holidays, shared people).

**A sprint is finished when:**
- every committed item either meets the [[term:definition-of-done|definition of done]] or is openly carried over;
- the demo is held and feedback is triaged;
- the [[term:status-report|status report]] reflects what really happened, including carry-over.

Never call an item done because it is "code complete". If QA has not passed it on the [[term:staging-environment|staging environment]], it is not part of the increment.`,
        },
        {
          heading: "Who does what in the loop",
          body: `- **PM:** books the events, runs planning with the tech lead, protects the sprint goal, runs the demo, sends the status report and EOD updates.
- **Tech lead:** breaks stories into tasks, checks estimates, owns technical quality and the definition of done.
- **Developers:** estimate, build, unit-test, raise blockers at the standup.
- **QA:** tests sprint scope as it lands, not in the last two days.
- **Client SPOC:** answers questions inside the agreed reply time, attends the demo, consolidates feedback.
- **Client sponsor:** informed through the status report; joins demos at milestones.

The client is not in the daily scrum by default. If a client wants to join, agree it explicitly and keep the meeting a team planning conversation, not a performance.`,
        },
        {
          heading: "Mid-sprint requests: the boundary that protects the plan",
          body: `The most common mid-sprint event is a new ask. Handle it the same way every time:

1. Thank the client and write it down.
2. Put it in the backlog, not on a developer's desk.
3. Classify it: [[term:bug|bug]], [[term:clarification|clarification]], [[term:enhancement|enhancement]] or [[term:change-request|change request]].
4. A bug against agreed behaviour that blocks the sprint goal can be pulled in, with the tech lead's agreement. Everything else waits for the next planning, after estimation and, if it changes scope, an approved CR.
5. Tell the client which sprint it can land in, at the earliest.

If something truly urgent must enter the sprint, something else of similar size leaves. Say that trade-off out loud and record it in the [[term:mom|minutes]].`,
        },
        {
          heading: "Your checklist",
          body: `1. Book every sprint's planning, demo and retro at the start of the project, on a fixed rhythm.
2. Check the top of the backlog against the definition of ready two days before planning.
3. Write a one-line sprint goal the client can understand.
4. Keep the daily scrum to 15 minutes; take problem-solving offline.
5. Route every new client ask through the backlog and classification.
6. Count an item as done only when it meets the definition of done.
7. Report carry-over honestly in the status report.
8. Run the retro and act on at least one improvement.`,
        },
      ],
      sop: [
        {
          title: "Oyelabs sprint rhythm",
          prompt:
            "[Oyelabs SOP – admin to fill] The standard sprint length for custom projects, the default day for planning and the client demo, which tool holds the sprint board, and who must attend planning (PM, tech lead, QA).",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a08-sprint-cadence-q1",
          prompt: "According to the Scrum Guide, what is the maximum length of a sprint?",
          options: ["One month or less", "Two weeks exactly", "Six weeks", "As long as the scope needs"],
          correctIndex: 0,
          explanation: "The Scrum Guide caps a sprint at one month. Two weeks is a common agency choice, not a rule.",
        },
        {
          id: "pmp-a08-sprint-cadence-q2",
          prompt: "Which pairing of event and maximum timebox (for a one-month sprint) matches the Scrum Guide?",
          options: [
            "Sprint planning 8 hours, sprint review 4 hours, retrospective 3 hours",
            "Sprint planning 4 hours, sprint review 8 hours, retrospective 1 hour",
            "Sprint planning 2 hours, sprint review 2 hours, retrospective 2 hours",
            "No timeboxes are set; the team decides",
          ],
          correctIndex: 0,
          explanation: "The Scrum Guide sets 8, 4 and 3 hours for a one-month sprint, with shorter events for shorter sprints. The daily scrum is 15 minutes.",
        },
        {
          id: "pmp-a08-sprint-cadence-q3",
          prompt:
            "On day 3 of a two-week sprint, the client SPOC messages a developer directly: \"Can you also add a filter by city on the orders list? Small one.\" The developer asks you what to do. What is the right move?",
          options: [
            "Log it in the backlog, classify it, and tell the client the earliest sprint it can land in once estimated and, if it changes scope, approved",
            "Let the developer add it, since it is small and keeps the client happy",
            "Ignore it until the demo",
            "Add it to the current sprint and extend the sprint by two days",
          ],
          correctIndex: 0,
          explanation:
            "Mid-sprint asks go through the backlog. Slipping it in breaks the sprint goal and gives away unpriced scope; extending the sprint breaks the cadence the client relies on.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a08-sprint-cadence-q4",
          prompt: "Which of these should be true before an item is pulled into sprint planning? (Select all that apply.)",
          options: [
            "It has acceptance criteria the client agreed",
            "The designs for it are approved",
            "There are no open client questions blocking it",
            "A developer has already started coding it",
            "The client has paid the next milestone invoice",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Those are typical definition-of-ready checks. Code already started means planning was bypassed, and invoices are a commercial matter, not a readiness check.",
        },
        {
          id: "pmp-a08-sprint-cadence-q5",
          prompt: "A developer says the payment screen is \"done\" but QA has not tested it on staging yet. How should the PM count it in the sprint?",
          options: [
            "Not done: it does not yet meet the definition of done, so it is not part of the increment",
            "Done, because the code is written",
            "Half done, reported as 50% in the status report",
            "Done, as long as it is demoed",
          ],
          correctIndex: 0,
          explanation: "The Scrum Guide says work is not part of the increment unless it meets the definition of done. \"Code complete\" is not done.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a08-sprint-cadence-q6",
          prompt: "What is the daily scrum for?",
          options: [
            "The team inspects progress toward the sprint goal and plans the next day, in 15 minutes",
            "The PM reports status to the client",
            "Developers demo their work to the sponsor",
            "Solving every technical problem together",
          ],
          correctIndex: 0,
          explanation: "It is a short planning event for the team. Client status goes in EOD updates and the status report; deep problem-solving happens after the standup.",
        },
        {
          id: "pmp-a08-sprint-cadence-q7",
          prompt:
            "A bug against an agreed acceptance criterion appears mid-sprint and blocks the sprint goal. What is reasonable?",
          options: [
            "Pull it into the sprint with the tech lead's agreement, and drop or defer something of similar size if needed",
            "Raise a CR before anyone looks at it",
            "Wait for the next sprint planning regardless",
            "Ask the client to approve extra cost first",
          ],
          correctIndex: 0,
          explanation:
            "A bug against agreed behaviour is part of delivery, not a CR. If it blocks the goal it can enter the sprint, but capacity is finite, so state the trade-off.",
        },
        {
          id: "pmp-a08-sprint-cadence-q8",
          prompt: "At the end of the sprint, two of eight committed stories are not done. What should the status report and demo do?",
          options: [
            "Show the six done stories, state the two as carry-over with the reason and the new target sprint",
            "Demo all eight and explain later that two were not finished",
            "Mark the sprint green and quietly move the two stories",
            "Cancel the demo until all eight are done",
          ],
          correctIndex: 0,
          explanation: "Honest carry-over keeps the plan believable. Demoing unfinished work or hiding it behind a green status creates a bigger surprise later.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a08-sprint-cadence-q9",
          prompt: "Which of these terms come from common practice rather than from the Scrum Guide itself? (Select all that apply.)",
          options: ["Sprint 0", "Definition of ready", "Acceptance criteria", "Sprint retrospective", "Daily scrum"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "The Scrum Guide defines the retrospective and the daily scrum. Sprint 0, definition of ready and acceptance criteria are widely used but are not in the Guide.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt: `You are the PM on a Laravel and React Native ordering app for a café chain in Riyadh. Two-week sprints; the demo is every second Thursday. You are on day 4 of sprint 5. The sprint goal is "customers can pay by card and see their order status live". The SOW and signed stories cover card payment and live order status; loyalty points are not mentioned anywhere.`,
        steps: [
          {
            id: "s1",
            question:
              "The client's operations head emails: \"While you're in the checkout, please add loyalty points — earn on each order, redeem at checkout. Can it be in Thursday's demo?\" What do you do first?",
            options: [
              "Acknowledge it, log it in the backlog, and say you will classify and estimate it; it will not be in this sprint's demo",
              "Ask the checkout developer to start on it so it can be shown on Thursday",
              "Reply that loyalty is out of scope and cannot be done",
              "Add it to the sprint and tell the team to work the weekend",
            ],
            correctIndex: 0,
            explanation:
              "Mid-sprint asks go to the backlog first. Starting work gives away unpriced scope and endangers the sprint goal; a flat \"no\" closes a door the client may pay to open.",
          },
          {
            id: "s2",
            question: "You check the SOW and stories. Loyalty points do not exist anywhere in the agreed scope. How do you classify the request and what follows?",
            options: [
              "Brand-new functionality: estimate it with the tech lead and propose it as a change request or a later phase, approved in writing before work",
              "A bug, because a modern ordering app should have loyalty",
              "An enhancement that can be bundled free into this sprint",
              "A clarification: explain to the client how checkout works",
            ],
            correctIndex: 0,
            explanation:
              "Nothing is broken and nothing agreed is being improved; it is new functionality. It needs an estimate and written approval, as a CR within the SOW or a new phase.",
          },
          {
            id: "s3",
            question:
              "On day 8, live order status is late: the websocket work needs two more days than planned. The demo is on day 10. What do you do?",
            options: [
              "Tell the client before the demo, demo card payment (done) plus status on staging only if it meets the definition of done, and report the rest as carry-over with a new target",
              "Demo order status from a developer's laptop and say it is finished",
              "Postpone the whole demo by a week",
              "Mark the sprint green, since card payment is done",
            ],
            correctIndex: 0,
            explanation:
              "Early, honest notice and showing only done work keep trust. Demoing unfinished work, cancelling the demo or a false green each create a bigger problem later.",
          },
        ],
      },
    },
    // ---------------------------------------------------------------------------------------------
    // EOD updates
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-a08-eod-updates",
      moduleId: "pmp-a08",
      trackId: "pm",
      title: "Daily standups and EOD updates",
      summary: `Two daily habits keep an offshore agency project trusted. The **daily standup** is for the team: 15 minutes to check progress against the sprint goal and surface blockers. The **[[term:eod-update|EOD update]]** is for the client: a short written note at the end of the working day saying what moved, what is next and what is blocked.

At Oyelabs the client is often several time zones away. They wake up to the EOD update before they speak to anyone. A clear one tells them the project is under control. A vague one ("worked on APIs, will continue tomorrow") makes them ask for calls, chase developers directly or start doubting the [[term:status-report|weekly status report]].

A good EOD update is written for a busy, non-technical reader. Lead with the overall [[term:rag-status|RAG status]] for the sprint. List what was finished in words the client recognises (stories and screens, not branch names). Name each [[term:blocker|blocker]] with an owner and a date, and put [[term:client-dependency|client dependencies]] in their own line so the client sees what they owe. Keep it short enough to read on a phone.

The common mistake is reporting activity instead of outcomes, and staying green until the day something is visibly late. If a risk to the sprint goal appeared today, the EOD update turns amber today. The weekly status report should never be the first place the client hears bad news.`,
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Scrum Guides: The Scrum Guide (2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: "2026-10-02T11:51:24Z" },
        { label: "Atlassian: Standups for agile teams", url: "https://www.atlassian.com/agile/scrum/standups", kind: "article", verifiedAt: "2026-10-02T11:52:12Z" },
        {
          label: "GOV.UK Service Manual: Agile tools and techniques",
          url: "https://www.gov.uk/service-manual/agile-delivery/agile-tools-techniques",
          kind: "docs",
          verifiedAt: "2026-10-02T12:08:10Z",
        },
      ],
      video: {
        title: "Daily Scrum Explained: A Better Way to Run It",
        channel: "Mountain Goat Software: Agile & Scrum Mastery",
        url: "https://www.youtube.com/watch?v=MZdK4SX0mfI",
        videoId: "MZdK4SX0mfI",
        verifiedAt: "2026-10-02T12:17:09Z",
      },
      alternateVideos: [
        {
          title: "How to Hold a Daily Stand-up Meeting",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=JSFfyse_EXM",
          videoId: "JSFfyse_EXM",
          verifiedAt: "2026-10-02T12:17:09Z",
        },
        {
          title: "A Real Daily Standup Meeting Example",
          channel: "DataMiner by Skyline Communications",
          url: "https://www.youtube.com/watch?v=T8GcCl8w-_E",
          videoId: "T8GcCl8w-_E",
          verifiedAt: "2026-10-02T12:17:09Z",
        },
      ],
      handbook: {
        stages: ["custom-sprints"],
        rules: ["weekly-status-report"],
        templates: ["status-report-rag"],
      },
      sections: [
        {
          heading: "Standup and EOD: two different jobs",
          body: `**The standup** is the team's 15-minute daily scrum. Each person covers progress toward the sprint goal and anything blocking them. The PM listens for risks: a story stuck for two days, a question waiting on the client, QA with nothing to test. Problem-solving happens after the standup, with only the people needed.

**The EOD update** is the PM's written message to the client [[term:spoc|SPOC]], sent at the end of the team's working day if the project agreed one. It turns what the team did into what the client cares about. It is not a copy of the standup notes.

Use the standup to collect facts; use the EOD update to communicate them. A standup that runs 40 minutes and an EOD update full of ticket numbers are the same failure: the wrong audience for the content.`,
        },
        {
          heading: "Anatomy of a good EOD update",
          body: `1. **Sprint RAG and one-line headline.** "Sprint 4: Amber. Payments on track; order history at risk (see blockers)."
2. **Done today.** Two to five items, in client language: "Customers can reorder from order history (on staging)."
3. **Next.** What the team works on tomorrow.
4. **Blockers and risks.** Each with an owner and a date. "Gateway sandbox keys: client finance, needed by Wednesday or the payment story slips to sprint 5."
5. **Client actions needed.** A separate short list, so the client cannot miss it.
6. **Links.** The staging build or the board, if the client uses them.

Keep it under about 150 words (typical). If you need more, the news probably belongs in a call or in the weekly report.`,
        },
        {
          heading: "Choosing the RAG honestly",
          body: `- **Green:** the sprint goal is on track and no blocker threatens it.
- **Amber:** a risk or blocker threatens part of the sprint goal, and there is a credible plan or a client action that can recover it.
- **Red:** the sprint goal or a [[term:milestone|milestone]] will be missed without a decision (scope, date or people).

Turn amber the day the risk appears, not the day it bites. A client who sees amber on Tuesday and green again on Thursday trusts you more than one who sees green for nine days and red on the tenth. If the same blocker stays open for several days, raise it as an [[term:issue|issue]] in the [[term:raid-log|RAID log]] and, if needed, through the agreed [[term:escalation|escalation]] path.`,
        },
        {
          heading: "Your checklist",
          body: `1. Keep the standup to 15 minutes and take problem-solving offline.
2. After the standup, update the board and note any new blocker with an owner.
3. Write the EOD update for a non-technical reader on a phone.
4. Lead with the sprint RAG and a one-line headline.
5. List outcomes, not activity, and never ticket numbers alone.
6. Put client actions in their own list, with dates.
7. Turn amber the day a risk appears.
8. Make sure the weekly status report never contradicts the week's EOD updates.`,
        },
      ],
      sop: [
        {
          title: "Oyelabs EOD update format and channel",
          prompt:
            "[Oyelabs SOP – admin to fill] Which projects send EOD updates, the cut-off time and time zone, the channel (email, Teams, Slack, client portal), the standard format, and who is copied internally.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a08-eod-updates-q1",
          prompt: "Which line belongs in a client EOD update?",
          options: [
            "\"Customers can now reorder from order history; it is on staging for you to try\"",
            "\"Merged PR #412 into develop, fixed lint\"",
            "\"Worked on APIs, will continue tomorrow\"",
            "\"Developer A was 20 minutes late to standup\"",
          ],
          correctIndex: 0,
          explanation: "The client needs outcomes in their own language. Ticket numbers and vague activity tell them nothing; team issues are internal.",
        },
        {
          id: "pmp-a08-eod-updates-q2",
          prompt: "How long is the daily scrum in the Scrum Guide?",
          options: ["15 minutes", "30 minutes", "One hour", "As long as needed to solve blockers"],
          correctIndex: 0,
          explanation: "The daily scrum is a 15-minute event. Solving problems happens afterwards with the people needed.",
        },
        {
          id: "pmp-a08-eod-updates-q3",
          prompt:
            "At Tuesday's standup you learn the payment gateway sandbox keys the client promised for Monday have not arrived. Without them the payment story slips. What RAG does Tuesday's EOD update show?",
          options: [
            "Amber, naming the missing keys as a client action with the date they are needed by",
            "Green, because the team can work on something else for now",
            "Red, and request an escalation call immediately",
            "No RAG; wait until Friday's weekly report",
          ],
          correctIndex: 0,
          explanation:
            "A real risk to the sprint goal with a recovery path (the client sends the keys) is amber, from the day it appears. Red is for when a decision is needed; staying green hides it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a08-eod-updates-q4",
          prompt: "Which of these make an EOD update useful to a busy client? (Select all that apply.)",
          options: [
            "A sprint RAG and a one-line headline at the top",
            "Blockers with an owner and a date",
            "A separate list of actions the client owes",
            "Every commit message from the day",
            "A full copy of the standup transcript",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "The client reads it on a phone before their day starts. Headline, owned blockers and their own actions are what they need; raw logs bury the point.",
        },
        {
          id: "pmp-a08-eod-updates-q5",
          prompt: "Your EOD updates said green all week, and Friday's weekly status report says the milestone will slip. What went wrong?",
          options: [
            "The risk was not reported when it appeared, so the weekly report became the first bad news",
            "Nothing: the weekly report is the right place for bad news",
            "The EOD updates should not have a RAG at all",
            "The client should have read the board",
          ],
          correctIndex: 0,
          explanation: "EOD updates and the weekly report must tell the same story. A slip that surprises the client on Friday damages trust more than the slip itself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a08-eod-updates-q6",
          prompt: "The client SPOC asks to join your daily standups. What is a sensible response?",
          options: [
            "Agree it explicitly if useful, keep it a 15-minute team planning event, and keep the EOD update as the written record",
            "Refuse; clients must never attend",
            "Agree and turn the standup into a daily status presentation",
            "Agree and stop sending EOD updates",
          ],
          correctIndex: 0,
          explanation: "Clients can attend, but the event stays the team's. Turning it into a performance wastes the team's time, and the written update is still needed for the record.",
        },
        {
          id: "pmp-a08-eod-updates-q7",
          prompt: "A developer raises the same blocker (waiting on the client's API documentation) for the third day. What should you do beyond repeating it in the EOD update?",
          options: [
            "Log it as an issue in the RAID log and follow the agreed escalation path with the client",
            "Keep repeating it; the client will eventually notice",
            "Ask the developer to guess the API and carry on",
            "Remove it from the update so it does not look bad",
          ],
          correctIndex: 0,
          explanation: "A repeated blocker is an issue to track and escalate. Guessing the API creates rework, and hiding it removes the client's chance to act.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a08-eod-updates-q8",
          prompt: "Which of these belong in the standup rather than in the client EOD update? (Select all that apply.)",
          options: [
            "Which developer pairs with QA this afternoon",
            "A developer stuck on a merge conflict",
            "The task split for tomorrow's work",
            "A client action needed by Wednesday",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Team coordination stays in the standup. Anything the client must do goes in the EOD update, in its own list.",
        },
      ],
      practice: {
        kind: "form",
        variant: "status",
        templateId: "status-report-rag",
        prompt:
          "Write today's EOD update for the client SPOC from your standup notes and the board. Choose the sprint RAG, count the stories done today, and write every other field for a non-technical reader.",
        context: `**Project:** Laravel + React Native home-services booking app for a cleaning company in Muscat. **Sprint 4 of 8**, day 6 of 10. Sprint goal: "customers can book, pay and rate a cleaner".

**Standup notes, Tuesday 13 October:**
- Booking calendar: done, QA passed on staging.
- Rate-a-cleaner screen: done, QA passed on staging.
- Card payment: blocked. Sandbox keys for the payment gateway were due from the client's finance team on Monday 12 October; not received. Dev needs them by Thursday 15 October or the story moves to sprint 5.
- Push notifications: in progress, on track.
- Admin cleaner list: in QA, two minor bugs being fixed.

**Client also owes:** the final cleaner photo set (for the admin seed data), promised for this week.`,
        fields: [
          { id: "rag", label: "Sprint RAG", input: "select", options: ["Green", "Amber", "Red"], required: true },
          { id: "doneCount", label: "Stories completed today (QA passed)", input: "number", required: true },
          { id: "headline", label: "One-line headline", input: "text", required: true },
          { id: "done", label: "Done today", input: "textarea", required: true },
          { id: "next", label: "Next (tomorrow)", input: "textarea", required: true },
          { id: "blockers", label: "Blockers and risks (owner, date)", input: "textarea", required: true },
          { id: "clientActions", label: "Actions needed from you", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "rag", expected: "Amber" },
          { fieldId: "doneCount", expected: 2 },
        ],
        rubric: [
          {
            label: "Outcomes in client language",
            points: 2,
            description: "Describes the booking calendar and rating screen as things customers can do, on staging, with no ticket numbers or jargon.",
          },
          {
            label: "Blocker is owned and dated",
            points: 2,
            description: "Names the missing gateway sandbox keys, the client finance team as owner, Thursday 15 October as the need-by date, and the consequence (card payment moves to sprint 5).",
          },
          {
            label: "Client actions stand out",
            points: 1,
            description: "Lists the keys and the cleaner photo set as client actions in their own list, with dates.",
          },
          {
            label: "Short and readable",
            points: 1,
            description: "Fits on a phone screen; the headline gives the RAG reason in one line.",
          },
        ],
        sampleAnswer: {
          rag: "Amber",
          doneCount: "2",
          headline: "Sprint 4: Amber. Booking and rating are ready to try; card payment is waiting on gateway keys.",
          done: "- Customers can pick a date and time in the booking calendar (on staging, tested).\n- Customers can rate their cleaner after a job (on staging, tested).",
          next: "- Finish push notifications for booking confirmations.\n- Fix two small issues in the admin cleaner list and retest.",
          blockers:
            "- Card payment: we still need the payment gateway sandbox keys (your finance team, due Monday). If they arrive by Thursday 15 October, card payment stays in this sprint; if not, it moves to sprint 5.",
          clientActions:
            "1. Payment gateway sandbox keys, from your finance team, by Thursday 15 October.\n2. Final cleaner photo set for the admin panel, by Friday 16 October.",
        },
      },
    },
    // ---------------------------------------------------------------------------------------------
    // Demos and feedback
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-a08-demos-feedback",
      moduleId: "pmp-a08",
      trackId: "pm",
      title: "Sprint demos and client feedback",
      summary: `The sprint demo (the Scrum sprint review) is the client's regular window into the build. It is where they gain confidence, and it is where most scope leaks out of an agency project. A client watching a working screen thinks of ten improvements. Each one feels small in the room. Agreed casually, together they eat the [[term:milestone|milestone]] and the margin.

A strong demo has three parts. **Before:** a short agenda tied to the sprint goal, only [[term:definition-of-done|done]] work, a working [[term:staging-environment|staging]] build, and the right client people invited. **During:** show the stories against their [[term:acceptance-criteria|acceptance criteria]], let the client drive where possible, and capture every piece of feedback word for word without agreeing or refusing on the spot. **After:** triage each item within a day into a [[term:bug|bug]], [[term:clarification|clarification]], [[term:enhancement|enhancement]] or [[term:change-request|change request]], and send the [[term:mom|minutes]] with decisions and owners.

The triage follows the same logic as every scope decision. If the feature does not work as agreed and it is in scope, it is a bug and it is fixed as part of delivery. If it works but the client wants agreed behaviour changed, it needs a change request before work. If it works and the client wants it better, it is an enhancement, estimated and prioritised. If it is a misunderstanding, it is a clarification, answered with where it was agreed.

The common mistake is saying "sure, we'll tweak that" in the demo. The client hears a free commitment, the team hears a new task, and nobody wrote it down. Say "Good point, I've captured it; I'll come back tomorrow with how we'll handle it", and then do exactly that.`,
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Scrum Guides: The Scrum Guide (2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: "2026-10-02T11:51:24Z" },
        { label: "Atlassian: What is a sprint review", url: "https://www.atlassian.com/agile/scrum/sprint-reviews", kind: "article", verifiedAt: "2026-10-02T11:54:25Z" },
        { label: "Atlassian Team Playbook: Demo trust", url: "https://www.atlassian.com/team-playbook/plays/demo-trust", kind: "docs", verifiedAt: "2026-10-02T12:06:06Z" },
      ],
      video: {
        title: "Sprint Reviews - The most important meeting in Scrum",
        channel: "ScrumMastered",
        url: "https://www.youtube.com/watch?v=vhRrpe3v5dQ",
        videoId: "vhRrpe3v5dQ",
        verifiedAt: "2026-10-02T12:17:08Z",
      },
      alternateVideos: [
        {
          title: "A Real Sprint Review Meeting Example",
          channel: "DataMiner by Skyline Communications",
          url: "https://www.youtube.com/watch?v=as9IYFrTiKc",
          videoId: "as9IYFrTiKc",
          verifiedAt: "2026-10-02T12:17:08Z",
        },
        {
          title: "How to RUN the MOST EFFECTIVE & EFFICIENT Sprint Review",
          channel: "Agile Coach",
          url: "https://www.youtube.com/watch?v=9-XKTBBETaQ",
          videoId: "9-XKTBBETaQ",
          verifiedAt: "2026-10-02T12:17:08Z",
        },
      ],
      handbook: {
        stages: ["custom-sprints"],
        rules: ["mom-after-every-client-meeting", "cr-when-needed", "billing-bug-in-delivery"],
        templates: ["mom"],
      },
      sections: [
        {
          heading: "Before the demo",
          body: `- **Agenda tied to the sprint goal.** Three or four stories, in the order a user would meet them. Send it a day ahead (typical).
- **Only done work.** If it has not passed QA against the [[term:definition-of-done|definition of done]], it is not shown, or it is shown clearly labelled as work in progress.
- **Rehearse on staging.** Use realistic test data and a script. Never demo from a developer's laptop.
- **Invite the right people.** The [[term:spoc|SPOC]] always; the sponsor at milestone demos; the people who will use the feature when possible.
- **Prepare the scope evidence.** Have the stories, acceptance criteria and approved designs open, so you can answer "was that agreed?" in seconds.`,
        },
        {
          heading: "During the demo: capture, do not commit",
          body: `Let the client click if they can. People react more honestly to software they are using than to software they are watching.

When feedback comes, repeat it back in one sentence and write it down word for word. Then use one of three replies:

- "That looks like it does not match the acceptance criterion. I've logged it and we'll confirm by tomorrow." (a likely bug)
- "That's how it was agreed in the story; here is the criterion. Let me know if you'd like it to work differently." (a likely clarification)
- "Good idea. I've captured it and I'll come back with how we'd handle it and what it would mean for the plan." (a likely enhancement or CR)

Do not price, estimate or promise anything in the room. The tech lead may give a rough feel for size only if you agreed beforehand that they would.`,
        },
        {
          heading: "After the demo: triage and minutes",
          body: `Within a day (typical), the PM and tech lead triage every item. Ask the decision questions in order:

1. Does it work as specified and accepted? If not, and it is in the signed scope, it is a **bug**: log it with severity and priority and fix it in the sprint plan.
2. If it works, does the client want agreed behaviour changed? That is a **change request**: estimate, price and get written approval before work.
3. Does the client want something that works made better? That is an **enhancement**: log, estimate, and agree priority and cost.
4. Is it a question or a misunderstanding? That is a **clarification**: reply with how it works and where it was agreed.

Then send the [[term:mom|minutes]]: attendees, what was shown, each feedback item with its classification and next step, decisions, actions with owners and dates. Follow the Oyelabs rule in the handbook card below on when minutes are due.`,
        },
        {
          heading: "What good looks like: a worked example",
          body: `A Laravel and React web platform for a UK physiotherapy clinic chain is in sprint 6 of 9. The sprint goal is "patients can book and reschedule appointments online". The demo is a 45-minute call with the clinic operations manager (SPOC) and two receptionists.

The PM opens with the goal and three stories: book, reschedule, confirmation email. A receptionist drives the booking flow on staging. Feedback comes in:

1. "The confirmation email shows the head-office address, not the clinic." Story BK-4's acceptance criterion says it shows the booked clinic's address. The PM says it looks like a mismatch, logs it, and the tech lead confirms after the call. **Bug**, fixed in sprint 6.
2. "Patients can reschedule up to 2 hours before. Can we make it 24 hours?" The 2-hour window is in the signed story. The PM captures it and says she will come back with the impact. **Change request**: agreed behaviour changes, so it is estimated and sent for written approval.
3. "Could the clinic list remember the patient's last clinic?" The list works as agreed. **Enhancement**: logged in the backlog for estimation and prioritisation.
4. "Why can't I book two patients in the same slot?" The signed requirements say one patient per slot. **Clarification**: the PM shows the requirement and offers to raise a CR if they want it changed.

Next morning the minutes go out with all four items, their classification, owners and dates, and a draft CR for the reschedule window. The client approves the CR in writing two days later; the bug is fixed before the sprint ends. Nobody argues about it at UAT.`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **You said "sure, easy" in the demo.** Correct it the same day in writing: "I said yes too quickly; this changes the agreed behaviour in story X. Here's what it would take." A day-old correction is awkward; a month-old one is a dispute.
- **The demo showed unfinished work and the client found bugs that QA already knew about.** Next demo, show only done work and say what is still in progress. Share the [[term:known-issues|known issues]] list up front.
- **Feedback came from five people and contradicts itself.** Ask the SPOC to consolidate and decide, and record the decision in the minutes.
- **The minutes never went out.** Send them late rather than never, and ask the client to confirm the classifications. Until they do, the developers should not start on anything except bugs.
- **The client insists a change is a bug.** Show the story and the acceptance criterion calmly. If the evidence is unclear, treat it as a clarification first and agree the outcome in writing.
- **A developer quietly built a demo request.** Do not hide it. Decide with the account manager whether to keep it as goodwill or raise a CR, and make sure the minutes say which.`,
        },
        {
          heading: "Your checklist",
          body: `1. Send a short agenda tied to the sprint goal a day ahead (typical).
2. Rehearse on staging with realistic data; show only done work.
3. Have the stories, acceptance criteria and approved designs open.
4. Capture every feedback item word for word; commit to nothing in the room.
5. Triage each item within a day: bug, clarification, enhancement or change request.
6. Send the minutes with classifications, decisions, owners and dates.
7. Start CR work only after written approval.
8. Feed bugs into the sprint plan and enhancements into the backlog.`,
        },
      ],
      sop: [
        {
          title: "Oyelabs sprint demo format",
          prompt:
            "[Oyelabs SOP – admin to fill] Who attends client demos from Oyelabs, whether demos are recorded, where demo builds are hosted, the minutes template and deadline, and who may give the client a rough size for a request during a demo.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a08-demos-feedback-q1",
          prompt: "During a demo the client says, \"Can the reschedule window be 24 hours instead of 2?\" The 2-hour window is in the signed story. What is the best reply in the room?",
          options: [
            "\"Good point, I've captured it. I'll come back with how we'd handle it and what it means for the plan.\"",
            "\"Sure, that's a one-line change, we'll do it this sprint.\"",
            "\"That's out of scope, so no.\"",
            "\"That will cost extra, roughly two days.\"",
          ],
          correctIndex: 0,
          explanation: "It changes agreed behaviour, so it needs a CR. Agreeing gives scope away, a flat no closes a paid option, and pricing on the spot skips estimation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a08-demos-feedback-q2",
          prompt:
            "In a demo, the confirmation email shows the wrong clinic address. The acceptance criterion says it must show the booked clinic's address. The project is still in delivery. How is this classified?",
          options: ["Bug (found during delivery)", "Change request", "Enhancement", "Clarification"],
          correctIndex: 0,
          explanation: "It does not work as specified, and it is in scope, before go-live. That is a delivery bug, typically fixed as part of the delivery.",
        },
        {
          id: "pmp-a08-demos-feedback-q3",
          prompt: "A receptionist asks, \"Why can't I book two patients in one slot?\" The signed requirements say one patient per slot. What is it?",
          options: ["Clarification", "Bug", "Enhancement", "New feature"],
          correctIndex: 0,
          explanation: "The system works as agreed; the question comes from not knowing the requirement. Explain where it was agreed, and offer a CR if they want it changed.",
        },
        {
          id: "pmp-a08-demos-feedback-q4",
          prompt: "Which of these should be ready before a sprint demo? (Select all that apply.)",
          options: [
            "A working staging build with realistic test data",
            "The stories and acceptance criteria open for reference",
            "A short agenda tied to the sprint goal",
            "Price estimates for any change the client might ask for",
            "Features still in development, to show progress",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Staging, scope evidence and an agenda make the demo credible. Prices before a request exists are guesses, and unfinished work invites bug reports QA already knows about.",
        },
        {
          id: "pmp-a08-demos-feedback-q5",
          prompt: "The client says, \"The clinic list works fine, but could it remember the patient's last clinic?\" How do you classify it?",
          options: ["Enhancement", "Bug", "Clarification", "Change request to agreed behaviour"],
          correctIndex: 0,
          explanation: "It improves something that already works as agreed. It is logged, estimated and prioritised, typically billed or traded against other backlog items.",
        },
        {
          id: "pmp-a08-demos-feedback-q6",
          prompt:
            "After the demo, a developer tells you he \"just did\" the 24-hour reschedule change the client mentioned, because it took ten minutes. What do you do?",
          options: [
            "Be open about it: decide with the account manager whether it is recorded goodwill or goes through a CR, and make the minutes say which",
            "Say nothing; it was small",
            "Revert it silently and never mention it",
            "Bill the client for it without telling them",
          ],
          correctIndex: 0,
          explanation:
            "Unrecorded free changes teach the client that changes are free. Making an explicit, recorded decision protects future CRs; billing without approval breaks the CR rule.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a08-demos-feedback-q7",
          prompt: "What must the demo minutes contain? (Select all that apply.)",
          options: [
            "Each feedback item with its classification and next step",
            "Decisions made",
            "Actions with owners and due dates",
            "A full transcript of the call",
            "Internal margin on each change",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Minutes record decisions, classifications and owned actions. A transcript buries them, and margins are internal.",
        },
        {
          id: "pmp-a08-demos-feedback-q8",
          prompt: "Feedback from the SPOC and two receptionists contradicts itself (one wants fewer fields, another wants more). What do you do?",
          options: [
            "Ask the SPOC to consolidate and decide, and record the decision in the minutes",
            "Build both versions and let them choose",
            "Pick the version the team prefers",
            "Follow whoever spoke last",
          ],
          correctIndex: 0,
          explanation: "The SPOC consolidates feedback for the client. Building both doubles the work, and picking yourself makes the agency own a client decision.",
        },
        {
          id: "pmp-a08-demos-feedback-q9",
          prompt: "The client insists a request is a bug. The story and acceptance criteria do not cover it. What is the strongest next step?",
          options: [
            "Calmly show the story and acceptance criteria, explain the difference, and offer a CR with a fast path",
            "Agree it is a bug to keep the peace",
            "Refuse to discuss it further",
            "Escalate straight to the client's CEO",
          ],
          correctIndex: 0,
          explanation: "Evidence from the signed scope settles it respectfully. Conceding sets a precedent; refusing or jumping the escalation ladder damages the relationship.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a08-demos-feedback-q10",
          prompt: "The Scrum Guide says work becomes part of the increment only when it meets which standard?",
          options: ["The definition of done", "The client's approval in the demo", "The sprint goal", "The definition of ready"],
          correctIndex: 0,
          explanation: "The Guide ties the increment to the definition of done. Client feedback in the review informs what comes next; it does not define done.",
        },
      ],
      practice: {
        kind: "form",
        variant: "mom",
        templateId: "mom",
        prompt:
          "Write the minutes of this sprint demo from the transcript excerpt. Classify each feedback item from the client's point of view of the signed scope, then record decisions and actions with owners and dates.",
        context: `**Project:** Laravel + React web platform for a UK physiotherapy clinic chain, sprint 6 of 9, in delivery (not live). **Demo:** Thursday 15 October, 45 minutes. **Attendees:** client operations manager (SPOC), two receptionists; Oyelabs PM, tech lead, QA.

**Excerpt:**
- Receptionist: "The confirmation email shows the head-office address, not the clinic." *(Story BK-4 criterion: email shows the booked clinic's address.)*
- SPOC: "Patients can reschedule up to 2 hours before. Can we make it 24 hours?" *(Story BK-7, signed: reschedule allowed up to 2 hours before.)*
- Receptionist: "Could the clinic list remember the patient's last clinic?" *(Clinic list works as BK-2 specifies.)*
- PM: "We'll fix the email this sprint. I'll send the minutes tomorrow and an impact note on the reschedule change by Tuesday 20 October."
- SPOC: "OK. I'll get you the new clinic opening hours by Monday 19 October."`,
        fields: [
          { id: "attendees", label: "Meeting details and attendees", input: "textarea", required: true },
          { id: "shown", label: "What was demoed", input: "textarea", required: true },
          { id: "item1", label: "Feedback 1 (email address) classification", input: "select", options: ["Bug", "Change request", "Enhancement", "Clarification"], required: true },
          { id: "item2", label: "Feedback 2 (reschedule window) classification", input: "select", options: ["Bug", "Change request", "Enhancement", "Clarification"], required: true },
          { id: "item3", label: "Feedback 3 (remember last clinic) classification", input: "select", options: ["Bug", "Change request", "Enhancement", "Clarification"], required: true },
          { id: "decisions", label: "Decisions", input: "textarea", required: true },
          { id: "actions", label: "Action items (owner, due date)", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "item1", expected: "Bug" },
          { fieldId: "item2", expected: "Change request" },
          { fieldId: "item3", expected: "Enhancement" },
        ],
        rubric: [
          {
            label: "Classifications are justified by the scope",
            points: 2,
            description: "Cites BK-4 for the bug, BK-7's signed 2-hour window for the CR, and BK-2 working as specified for the enhancement.",
          },
          {
            label: "No free commitments",
            points: 2,
            description: "Records the reschedule change as needing an impact note and written approval before any work; the enhancement goes to the backlog for estimation.",
          },
          {
            label: "Actions are owned and dated",
            points: 1,
            description: "Email fix (Oyelabs tech lead, this sprint), impact note (PM, 20 October), opening hours (client SPOC, 19 October), minutes (PM, 16 October).",
          },
          {
            label: "Clear and skimmable",
            points: 1,
            description: "Short lines a client can confirm quickly; decisions separate from discussion.",
          },
        ],
        sampleAnswer: {
          attendees:
            "Sprint 6 demo, Thursday 15 October, 45 min. Client: operations manager (SPOC), two receptionists. Oyelabs: PM, tech lead, QA.",
          shown: "Online booking, rescheduling and confirmation email (stories BK-2, BK-4, BK-7) on staging.",
          item1: "Bug",
          item2: "Change request",
          item3: "Enhancement",
          decisions:
            "1. Confirmation email address: does not meet BK-4's criterion, so it is a bug and will be fixed this sprint.\n2. Reschedule window 2h to 24h: changes signed story BK-7, so it is a change request; no work until the CR is approved in writing.\n3. Remember last clinic: BK-2 works as agreed; logged as an enhancement for estimation and prioritisation.",
          actions:
            "- Fix clinic address in confirmation email: Oyelabs tech lead, by end of sprint 6.\n- Send minutes: Oyelabs PM, Friday 16 October.\n- Send impact note and draft CR for the reschedule window: Oyelabs PM, Tuesday 20 October.\n- Send new clinic opening hours: client SPOC, Monday 19 October.\n- Estimate the 'remember last clinic' enhancement: Oyelabs tech lead, before sprint 7 planning.",
        },
      },
    },
  ],
} satisfies Module;
