import type { Module } from "@/types/curriculum";

export default {
  id: "pma-refresh",
  trackId: "pm",
  name: "Improving your existing PM skills",
  description:
    "A short, practical refresh of the daily PM work that slips first when you are busy: planning the week, tracking real progress, and following up so every action has one owner and a date. Built for PMs already running Laravel, React and mobile projects for overseas clients.",
  refs: [
    {
      label: "Atlassian: How to Do Project Planning?",
      url: "https://www.atlassian.com/work-management/project-management/project-planning",
      kind: "docs",
      verifiedAt: "2026-10-02T09:35:33Z",
    },
    {
      label: "Atlassian: RACI Chart: What is it & How to Use",
      url: "https://www.atlassian.com/work-management/project-management/raci-chart",
      kind: "article",
      verifiedAt: "2026-10-02T09:35:29Z",
    },
  ],
  topics: [
    {
      id: "pma-planning-the-week",
      moduleId: "pma-refresh",
      trackId: "pm",
      title: "Planning a week as a PM",
      summary:
        "Most PM weeks are lost on Monday. You open Teams, there are 40 unread messages, a client in Sydney has replied overnight, and by lunch you are reacting instead of steering. A short weekly plan fixes this. It tells you which three or four outcomes matter this week, what could block them, and when you will do your own focused work.\n\nA simple way to plan, in about 30 minutes: first, list the fixed dates for the week, such as a staging release for a US client on Wednesday, a demo on Thursday or a contract renewal call. Second, for each project, write the one outcome that must be true by Friday, for example \"payment flow passes QA on staging\". Third, look for blockers: missing API keys, a designer on leave, a client approval nobody has chased. Fourth, block time in your calendar for preparation (agendas, status reports, estimates) and for the hours your overseas clients are online. Last, share the plan with your team so they know what you are protecting.\n\nOrder matters. Unblock people first, because a developer waiting on a client costs real hours every day. Then do what you promised by a date. Then prepare for later meetings. Housekeeping comes last. Time blocking helps you keep to this: a fixed slot every day to clear follow-ups stops them piling up.\n\nThe common mistake is planning tasks instead of outcomes. \"Work on the admin panel\" can be true all week while nothing ships. Another mistake is planning a full week with no buffer. Agency weeks always bring a surprise: an urgent bug, a change request, a sales call. Keep some time free for it. Your team's fixed internal deadlines are in your team's SOP below.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        {
          label: "Atlassian: How to Do Project Planning?",
          url: "https://www.atlassian.com/work-management/project-management/project-planning",
          kind: "docs",
          verifiedAt: "2026-10-02T09:35:33Z",
        },
        {
          label: "Asana: Time Blocking: Complete Guide for Focused Work & Rest",
          url: "https://asana.com/resources/what-is-time-blocking",
          kind: "article",
          verifiedAt: "2026-10-02T09:38:50Z",
        },
        {
          label: "TeamGantt: How to Become a Successful Project Manager",
          url: "https://www.teamgantt.com/project-management-guide/tips-skills-for-successful-project-management",
          kind: "article",
          verifiedAt: "2026-10-02T09:38:33Z",
        },
      ],
      video: {
        title: "How to Stay Organized as a Project Manager | Explained in 6 Minutes",
        channel: "Max Mao",
        url: "https://www.youtube.com/watch?v=DW1jyQr3s28",
        videoId: "DW1jyQr3s28",
        verifiedAt: "2026-10-02T09:35:53Z",
      },
      alternateVideos: [
        {
          title: "How to Plan your Week as a Project Manager ! Productivity Planning",
          channel: "Productivity and Task Management Channel",
          url: "https://www.youtube.com/watch?v=rba4MmHO6LU",
          videoId: "rba4MmHO6LU",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-planning-the-week-q1",
          prompt:
            "Which of these is a weekly outcome rather than a task?",
          options: [
            "\"Checkout flow on the React app passes QA on staging by Friday\"",
            "\"Work on the checkout flow\"",
            "\"Have a call with the developers\"",
            "\"Look at Jira\"",
          ],
          correctIndex: 0,
          explanation:
            "An outcome says what will be true and by when, so you can tell on Friday whether it happened. The others can all be \"done\" while nothing ships.",
        },
        {
          id: "pma-planning-the-week-q2",
          prompt:
            "It's Monday morning in India. A developer on a Laravel project is blocked waiting for the UK client's payment-gateway keys. You also owe the client a change-request estimate by Tuesday, and need to prepare Thursday's demo. What do you do first?",
          options: [
            "Message the client for the keys now, so it is waiting when their day starts",
            "Prepare the demo, because it is the most visible item",
            "Write the estimate, then chase the keys on Tuesday",
            "Wait for the client to notice the developer is blocked",
          ],
          correctIndex: 0,
          explanation:
            "Unblock people first. A blocked developer loses hours every day, and with a time-zone gap a message sent late loses a whole day. The estimate and the demo come next.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-planning-the-week-q3",
          prompt: "What belongs in a 30-minute weekly plan? (Select all that apply.)",
          options: [
            "Fixed dates this week: releases, demos, client calls",
            "One outcome per project that must be true by Friday",
            "Known blockers and who will clear them",
            "Every Jira ticket for every developer",
            "Calendar blocks for preparation and for the client's working hours",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation:
            "A weekly plan is about dates, outcomes, blockers and your own time. Listing every ticket is the team's sprint board, not your weekly plan.",
        },
        {
          id: "pma-planning-the-week-q4",
          prompt:
            "You plan every hour of your week. On Tuesday a production bug hits the US client's live app. What was wrong with the plan?",
          options: [
            "It had no buffer for the surprises agency weeks always bring",
            "Nothing, the bug was bad luck",
            "It should have planned the bug in advance",
            "It should have been shared only with the client",
          ],
          correctIndex: 0,
          explanation:
            "Urgent bugs, change requests and sales calls arrive every week. A plan with no slack breaks on the first one. Leave free time on purpose.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-planning-the-week-q5",
          prompt: "Why share your weekly plan with your team?",
          options: [
            "So they know which outcomes you are protecting and can flag blockers early",
            "So they can approve your calendar",
            "Because the client asks for it every week",
            "So they stop asking you questions",
          ],
          correctIndex: 0,
          explanation:
            "A shared plan aligns the team on the week's outcomes and invites early warnings. It is not about approval or avoiding questions.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "It's 9:30 on Monday in India. You run a Laravel + React portal for a client in New York (online from about 18:30 IST). Rank these five things in the order you should do them today, first at the top.",
        items: [
          { id: "keys", label: "Message the client for the payment-gateway API keys a developer is blocked on" },
          { id: "qa", label: "Book QA time for Wednesday's staging release, which nobody has scheduled yet" },
          { id: "estimate", label: "Send the change-request estimate you promised the client for Tuesday" },
          { id: "agenda", label: "Draft the agenda and RAG status for Thursday's client update" },
          { id: "backlog", label: "Tidy old tickets and labels in the backlog" },
        ],
        correctOrder: ["keys", "qa", "estimate", "agenda", "backlog"],
        explanation:
          "Unblock people first: the keys cost a developer hours every day, and the client must see your message when they come online tonight. Next, secure Wednesday's release, because QA slots go fast and the release is the nearest date. Then keep Tuesday's promise. Thursday's preparation can wait a day. Backlog tidying is useful but never urgent.",
      },
      sop: [
        {
          title: "Our weekly PM rhythm",
          prompt:
            "[Oyelabs SOP – admin to fill] The fixed internal events in a PM's week (planning, internal stand-ups, management review), deadlines a PM must meet each week (timesheets, status reports), and where the weekly plan is kept and shared.",
        },
      ],
    },
    {
      id: "pma-tracking-progress",
      moduleId: "pma-refresh",
      trackId: "pm",
      title: "Tracking progress and status",
      summary:
        "Clients do not pay for activity. They pay for working software on a date. Tracking progress means knowing, at any moment, how far each milestone really is from done and whether the date still holds. A PM who tracks well is rarely surprised, and a client who gets honest status from you trusts your dates.\n\nStep by step: first, break the work into milestones the client understands, such as \"login and signup\" or \"payments live on staging\". Second, for each milestone, compare where it is with where it should be by today. A milestone that should be 60% done and is 40% done has a 20-point gap. Third, turn the gap into a RAG status (Red, Amber, Green) with a written rule, so two PMs would rate it the same way. Fourth, write one line of cause and one line of action for anything Amber or Red. Last, update the tracker on a fixed day, before your client update, not during it.\n\nUse evidence, not feelings. \"Done\" should mean merged, deployed to staging and tested, not \"the developer says almost there\". Check the board, the pull requests and the QA results. A short weekly team check-in, such as Atlassian's health monitor, also shows problems that numbers hide: a tired team, unclear goals or a missing skill.\n\nThe most common mistake is the \"watermelon\" report: green outside, red inside. Teams stay Green to avoid an awkward conversation, then jump straight to Red a week before launch. Amber exists so you can raise a risk early, while there is still time to act. Another mistake is tracking hours spent instead of work finished; 80% of the budget spent does not mean 80% done. Your team's RAG rules and report format are in your team's SOP below.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        {
          label: "Asana: Status Report Template for Projects: Tips & Examples",
          url: "https://asana.com/templates/status-report",
          kind: "docs",
          verifiedAt: "2026-10-02T10:07:32Z",
        },
        {
          label: "ProjectManager: RAG Status in Project Management: Importance & Benefits",
          url: "https://www.projectmanager.com/blog/rag-status",
          kind: "article",
          verifiedAt: "2026-10-02T09:38:56Z",
        },
        {
          label: "TeamGantt: Project Management Reporting Types & Tips",
          url: "https://www.teamgantt.com/blog/project-management-reporting-types-and-tips",
          kind: "article",
          verifiedAt: "2026-10-02T09:38:45Z",
        },
        {
          label: "Atlassian Team Playbook: Team Health Monitors for Building High-Performing Teams",
          url: "https://www.atlassian.com/team-playbook/health-monitor",
          kind: "article",
          verifiedAt: "2026-10-02T09:35:40Z",
        },
      ],
      video: {
        title: "Secrets to Better Status Reports - Project Management Training",
        channel: "ProjectManager",
        url: "https://www.youtube.com/watch?v=N2kK8ubUY8c",
        videoId: "N2kK8ubUY8c",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      alternateVideos: [
        {
          title: "Project Status Report Must-Haves - Project Management Training",
          channel: "ProjectManager",
          url: "https://www.youtube.com/watch?v=5mvXSAJgqec",
          videoId: "5mvXSAJgqec",
          verifiedAt: "2026-10-02T09:35:56Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-tracking-progress-q1",
          prompt:
            "A developer says the React admin dashboard is \"almost done\". What evidence should you check before reporting it as done? (Select all that apply.)",
          options: [
            "The pull requests are merged",
            "It is deployed to staging",
            "QA has tested it against the acceptance criteria",
            "The developer sounds confident",
            "The hours logged match the estimate",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Done means merged, deployed and tested. Confidence and hours logged say nothing about whether the feature works.",
        },
        {
          id: "pma-tracking-progress-q2",
          prompt:
            "A fixed-bid Laravel project has used 80% of its budgeted hours. How complete is it?",
          options: [
            "You can't tell from hours; you need to check finished milestones against the plan",
            "80% complete",
            "20% complete",
            "100% complete, since most hours are used",
          ],
          correctIndex: 0,
          explanation:
            "Hours spent measure cost, not progress. A project can burn 80% of its hours and be 50% done, which is exactly the situation you need to spot early.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-tracking-progress-q3",
          prompt: "What is a \"watermelon\" status report?",
          options: [
            "Green on the outside, red inside: the report says fine while the project is in trouble",
            "A report that uses too many colours",
            "A report that is Red every week",
            "A report that mixes two projects",
          ],
          correctIndex: 0,
          explanation:
            "Watermelon reports hide trouble to avoid awkward conversations, so the client hears about it too late to help.",
        },
        {
          id: "pma-tracking-progress-q4",
          prompt:
            "The payments milestone should be 70% done by today and is 40% done. Launch is in five weeks. Your team's rule says a gap over 20 points is Red. The developer says they'll catch up. What do you report?",
          options: [
            "Red, with the cause and a recovery action, as the rule says",
            "Green, because the developer will catch up",
            "Amber, to keep the client calm",
            "Nothing until next week, to see if it improves",
          ],
          correctIndex: 0,
          explanation:
            "A written rule exists so status does not depend on mood. Report Red with a cause and a plan; a promise to catch up is the plan's job to prove.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-tracking-progress-q5",
          prompt: "Why have a written rule for RAG status?",
          options: [
            "So two PMs looking at the same project give it the same colour",
            "So the client can't argue",
            "Because RAG must always be calculated in Excel",
            "So nothing is ever Red",
          ],
          correctIndex: 0,
          explanation:
            "Consistency is the point. Without a rule, RAG reflects how brave the PM feels that week.",
        },
        {
          id: "pma-tracking-progress-q6",
          prompt: "What does Amber status let you do that Green and Red don't?",
          options: [
            "Raise a risk early, while there's still time to act on it",
            "Avoid giving a reason",
            "Delay the client update",
            "Skip the action plan",
          ],
          correctIndex: 0,
          explanation:
            "Amber means \"at risk, here's what we're doing\". Teams that jump from Green to Red lose the weeks when the client could have helped.",
        },
        {
          id: "pma-tracking-progress-q7",
          prompt: "When should you update the progress tracker for the weekly client call?",
          options: [
            "On a fixed day before the call, so the call discusses the status instead of discovering it",
            "Live during the call",
            "Only when something goes Red",
            "After the call, based on what the client said",
          ],
          correctIndex: 0,
          explanation:
            "Updating before the call means you have checked the evidence and prepared actions. Updating live leads to guesses in front of the client.",
        },
        {
          id: "pma-tracking-progress-q8",
          prompt:
            "Which signals can a weekly team health check show that a milestone tracker misses? (Select all that apply.)",
          options: [
            "The team is tired after weeks of overtime",
            "Nobody is sure what the client actually wants for a feature",
            "A key skill is missing, such as nobody knowing the payment SDK",
            "The exact number of commits per day",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Health monitors surface people problems: fatigue, unclear goals, missing skills. Commit counts are activity, not health.",
        },
        {
          id: "pma-tracking-progress-q9",
          prompt:
            "Your status line for a Red milestone reads: \"Payments delayed.\" What is missing?",
          options: [
            "The cause and the action: why it slipped, what you are doing, who owns it and the new date",
            "A brighter colour",
            "The developer's name, to show who is at fault",
            "Nothing; short is better",
          ],
          correctIndex: 0,
          explanation:
            "Every Amber or Red line needs a cause and an action with an owner and date. Naming a person to blame doesn't help the client or the team.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "This is the milestone tracker for a Laravel + React marketplace for a client in London. Column B is % done, column C is where it should be by today. Fill D2:D5 with a formula giving the RAG status: \"Red\" if the gap (C minus B) is over 20, \"Amber\" if it is over 10, otherwise \"Green\". Then fill B7 with a formula counting the Red milestones, and B8 with a formula for the average % done.",
        grid: [
          ["Milestone", "% done", "% planned by today", "Status"],
          ["Login & signup", "100", "100", ""],
          ["Payments (Stripe)", "40", "70", ""],
          ["Admin dashboard", "55", "60", ""],
          ["Push notifications", "20", "35", ""],
          ["", "", "", ""],
          ["Red milestones", "", "", ""],
          ["Average % done", "", "", ""],
        ],
        editable: ["D2", "D3", "D4", "D5", "B7", "B8"],
        checks: [
          { cell: "D2", tolerance: 0.01, expected: "Green", requireFormula: true, functions: ["IF"] },
          { cell: "D3", tolerance: 0.01, expected: "Red", requireFormula: true, functions: ["IF"] },
          { cell: "D4", tolerance: 0.01, expected: "Green", requireFormula: true, functions: ["IF"] },
          { cell: "D5", tolerance: 0.01, expected: "Amber", requireFormula: true, functions: ["IF"] },
          { cell: "B7", tolerance: 0.01, expected: 1, requireFormula: true, functions: ["COUNTIF"] },
          { cell: "B8", tolerance: 0.01, expected: 53.75, requireFormula: true, functions: ["AVERAGE"] },
        ],
        solution: {
          D2: '=IF(C2-B2>20,"Red",IF(C2-B2>10,"Amber","Green"))',
          D3: '=IF(C3-B3>20,"Red",IF(C3-B3>10,"Amber","Green"))',
          D4: '=IF(C4-B4>20,"Red",IF(C4-B4>10,"Amber","Green"))',
          D5: '=IF(C5-B5>20,"Red",IF(C5-B5>10,"Amber","Green"))',
          B7: '=COUNTIF(D2:D5,"Red")',
          B8: "=AVERAGE(B2:B5)",
        },
        explanation:
          "A nested IF checks the bigger gap first: Payments is 30 points behind (Red), Push notifications 15 (Amber), the rest are within 10 (Green). COUNTIF over the status column gives 1 Red milestone, and the average % done is 53.75. Writing the rule as a formula means every PM gets the same colour from the same numbers.",
      },
      sop: [
        {
          title: "Our status tracking and RAG rules",
          prompt:
            "[Oyelabs SOP – admin to fill] Where project progress is tracked (tool and template), how often it must be updated, our RAG definitions and thresholds, and who must be told when a project turns Amber or Red.",
        },
      ],
    },
    {
      id: "pma-follow-ups-ownership",
      moduleId: "pma-refresh",
      trackId: "pm",
      title: "Follow-ups, ownership and accountability",
      summary:
        "Most delays in agency projects are not technical. They are small things nobody followed up: the client's designs that were \"coming this week\", the staging credentials someone was \"looking into\", the change request that sat unapproved for ten days. Each one costs a few days. Together they cost the release date. Owning follow-ups is the part of the PM job that nobody else will do for you.\n\nThe rule is simple: every action has one owner, a clear outcome and a date. \"Team to look into slow search\" has none of these. \"Priya to find the cause of the slow search page and report back by Thursday\" has all three. Two names on one action means nobody owns it. \"ASAP\" is not a date. A RACI chart helps for bigger pieces of work: one person is Accountable, others are Responsible for doing it, Consulted before, or Informed after. For decisions, the DACI play adds a Driver who pushes the decision to a close and a named Approver.\n\nHow to follow up well: write every action down during the meeting and read them back before it ends. Send them in writing the same day. Put the dates in your own calendar or tracker, and check them on a fixed rhythm, not from memory. When something is late, ask early and kindly, offer help, and give a new date. If it stays stuck, escalate with facts: what was agreed, when, and what it now blocks. This works the same for the client's actions as for your team's. A client who has not approved designs is a blocker to manage, not a reason to wait.\n\nThe common mistake is owning the work yourself instead of owning the follow-up. A PM who quietly does every late task becomes the bottleneck, and the real owner never learns. Another mistake is following up only by chat, where it gets lost. Your team's follow-up and escalation rules are in your team's SOP below.",
      level: "advanced",
      isMilestone: true,
      estMinutes: 45,
      webRefs: [
        {
          label: "Atlassian Team Playbook: How to Define Team Roles and Responsibilities",
          url: "https://www.atlassian.com/team-playbook/plays/roles-and-responsibilities",
          kind: "docs",
          verifiedAt: "2026-10-02T09:35:30Z",
        },
        {
          label: "Atlassian: RACI Chart: What is it & How to Use",
          url: "https://www.atlassian.com/work-management/project-management/raci-chart",
          kind: "article",
          verifiedAt: "2026-10-02T09:35:29Z",
        },
        {
          label: "Atlassian Team Playbook: DACI: A Decision-Making Framework",
          url: "https://www.atlassian.com/team-playbook/plays/daci",
          kind: "article",
          verifiedAt: "2026-10-02T09:35:27Z",
        },
        {
          label: "Asana: RACI Charts: The Ultimate Guide, with Examples",
          url: "https://asana.com/resources/raci-chart",
          kind: "article",
          verifiedAt: "2026-10-02T10:06:58Z",
        },
      ],
      video: {
        title: "What is a RACI Chart? Clarify Project Roles with This Simple Tool",
        channel: "PM Aspirant",
        url: "https://www.youtube.com/watch?v=x8EY1Nol06o",
        videoId: "x8EY1Nol06o",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-follow-ups-ownership-q1",
          prompt: "Which action item is written well?",
          options: [
            "\"Priya to find the cause of the slow search page and report back by Thursday 14 March\"",
            "\"Team to look into slow search\"",
            "\"Priya and Rahul to fix search ASAP\"",
            "\"Search: discuss next week\"",
          ],
          correctIndex: 0,
          explanation:
            "One owner, a clear outcome and a real date. Two owners means nobody owns it, and ASAP or \"next week\" can't be checked.",
        },
        {
          id: "pma-follow-ups-ownership-q2",
          prompt: "In a RACI chart, how many people should be Accountable for one deliverable?",
          options: ["Exactly one", "At least two, for backup", "Everyone on the team", "None; only Responsible matters"],
          correctIndex: 0,
          explanation:
            "Exactly one Accountable person. Several people can be Responsible for doing the work, but shared accountability means no one is.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-follow-ups-ownership-q3",
          prompt:
            "The client promised final designs \"this week\" two weeks ago. Your React developers are now working on low-priority tickets. What do you do? (Select all that apply.)",
          options: [
            "Follow up in writing with what was agreed, when, and what it now blocks",
            "Ask for a specific date and offer help, such as a short call with your designer",
            "Log it as a blocker on the tracker and in the client update",
            "Wait, because chasing the client may annoy them",
            "Start building from old wireframes without telling the client",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A client action is a blocker to manage like any other: follow up in writing with facts, ask for a date, offer help and make it visible. Waiting or guessing silently both cost the release date.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-follow-ups-ownership-q4",
          prompt: "What does the Driver do in the DACI decision framework?",
          options: [
            "Pushes the decision to a close: gathers input, sets the deadline and makes sure it gets decided",
            "Makes the final decision",
            "Does the technical work after the decision",
            "Is told about the decision afterwards",
          ],
          correctIndex: 0,
          explanation:
            "The Driver owns getting the decision made. The Approver decides; Contributors give input; the Informed are told.",
        },
        {
          id: "pma-follow-ups-ownership-q5",
          prompt:
            "A developer has missed their date for the staging deploy twice. You're tempted to do the deploy yourself. What's the risk?",
          options: [
            "You become the bottleneck and the real cause of the delay is never fixed",
            "There is no risk; the deploy gets done",
            "The client will be confused about who you are",
            "The developer will log fewer hours",
          ],
          correctIndex: 0,
          explanation:
            "Own the follow-up, not the work. Find out why it slipped (skills, access, priorities) and fix that; quietly covering hides the problem until it happens on a bigger task.",
        },
        {
          id: "pma-follow-ups-ownership-q6",
          prompt: "Why read the action items back at the end of the meeting?",
          options: [
            "So owners confirm their actions and dates while everyone is still there",
            "To fill time",
            "Because the client cannot read the MoM",
            "So you don't need to send them in writing",
          ],
          correctIndex: 0,
          explanation:
            "Reading back turns \"I think Raj will do it\" into \"Raj agreed, Thursday\". You still send them in writing the same day.",
        },
        {
          id: "pma-follow-ups-ownership-q7",
          prompt:
            "Where should you track the dates of follow-ups you are waiting on?",
          options: [
            "In a tracker or calendar you check on a fixed rhythm",
            "In your memory",
            "Only in the Teams chat where they were mentioned",
            "In the client's own system",
          ],
          correctIndex: 0,
          explanation:
            "Memory and chat scroll-back fail under load. A list you check on a rhythm is what makes follow-ups reliable.",
        },
        {
          id: "pma-follow-ups-ownership-q8",
          prompt:
            "A change request has been waiting for the client's approval for ten days. Follow-ups have not worked. What's the right escalation?",
          options: [
            "Escalate to the client's sponsor with facts: what was asked, when, the follow-ups so far, and what the delay now affects",
            "Start the work anyway and bill it later",
            "Send the same reminder again every day",
            "Drop the change request quietly",
          ],
          correctIndex: 0,
          explanation:
            "Escalation is a factual next step, not a complaint. Starting unapproved work risks unpaid effort; repeating the same reminder or dropping it helps no one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-follow-ups-ownership-q9",
          prompt:
            "Which roles in RACI are told about or asked for input but are not doing the work? (Select all that apply.)",
          options: ["Consulted", "Informed", "Responsible", "Accountable"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Consulted people give input before; Informed people are told after. Responsible people do the work and the Accountable person owns the result.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "These action items come from a weekly call with a client in Sydney about their Laravel + React booking platform. Mark every item that is not a proper action (missing a single owner, a clear outcome or a real date).",
        segments: [
          { id: "a1", text: "Raj (client CTO): share production AWS access through the password manager by Wed 12 March.", issue: null },
          { id: "a2", text: "Team to look into the slow search page.", issue: "No single owner and no date; \"look into\" is not a clear outcome." },
          { id: "a3", text: "Priya: fix the iOS push-notification bug (#412) by Fri 14 March.", issue: null },
          { id: "a4", text: "Client to approve the new designs.", issue: "\"Client\" is not a named person, and there is no date." },
          { id: "a5", text: "Rahul and Anita: deploy v1.3 to staging by Thu 13 March.", issue: "Two owners means nobody is accountable; name one." },
          { id: "a6", text: "Arjun (PM): send the minutes with these actions by 6 pm IST today.", issue: null },
          { id: "a7", text: "Arjun: confirm with finance whether the change request is billable, ASAP.", issue: "\"ASAP\" is not a date that anyone can check." },
          { id: "a8", text: "Sara (client product owner): sign off UAT for the checkout flow by Mon 17 March.", issue: null },
          { id: "a9", text: "Vikram: add the payment-gateway risk to the RAID log by Wed 12 March.", issue: null },
          { id: "a10", text: "Everyone: keep an eye on the launch date.", issue: "No owner, no outcome and no date; this is a worry, not an action." },
          { id: "a11", text: "Meera: share the updated test plan with Sara by Thu 13 March.", issue: null },
        ],
        askExplanation: true,
      },
      sop: [
        {
          title: "Our follow-up and escalation rules",
          prompt:
            "[Oyelabs SOP – admin to fill] Where action items are tracked, how soon a PM must follow up on an overdue internal or client action, when and to whom to escalate (delivery head, account manager, client sponsor), and the escalation email template.",
        },
      ],
    },
  ],
} satisfies Module;
