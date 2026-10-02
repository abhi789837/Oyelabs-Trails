import type { Module } from "@/types/curriculum";

export default {
  id: "pma-keka",
  trackId: "pm",
  name: "Keka for PMs",
  description:
    "The Keka features an agency PM uses every week: logging, submitting and approving timesheets, leave and attendance and their effect on delivery, and Keka PSA for clients and projects, billing types, allocation and rate cards, utilisation reports and the basics of invoicing.",
  refs: [
    { label: "Keka Help: Keka Help Centre home", url: "https://help.keka.com/hc/en-us", kind: "docs", verifiedAt: "2026-10-02T09:38:53Z" },
    { label: "Keka Help: What is Keka Professional Services Automation (PSA)?", url: "https://help.keka.com/hc/en-us/articles/39946767676433-What-is-Keka-Professional-Services-Automation-PSA", kind: "docs", verifiedAt: "2026-10-02T09:38:58Z" },
  ],
  topics: [
    {
      id: "pma-keka-timesheets",
      moduleId: "pma-keka",
      trackId: "pm",
      title: "Timesheets: log, submit, approve the team's",
      summary:
        "In an agency, timesheets are not admin. They are the raw material for invoices, utilisation reports and the next estimate. If a developer logs 8 hours of client work to an internal task, a Time & Material client is under-billed. If someone logs 12 hours a day all week without anyone asking, either the plan is broken or the timesheet is wrong. The PM who approves the timesheet is the last check before those numbers reach finance and the client.\n\nLogging your own time in Keka is simple. Go to Me > Timesheet, click + Add time, pick the project and task, enter hours for each day with a comment if useful, then Save and Submit weekly timesheet. Past Due shows weeks you have not submitted. Rejected Timesheet shows ones sent back to you to fix. Your company can also enable daily submission instead of weekly.\n\nApproving the team's timesheets happens under My Team > Timesheets. Approvals lets you approve or reject by employee or by project. A rejection needs a reason, so the person knows what to fix. Project Time shows hours per person on a project, split into billable and non-billable, and Week Summary shows weekly totals. Both can be downloaded to Excel or PDF. Keka also supports bulk approval of many timesheets at once.\n\nStep by step when approving: check each person's hours against the plan and their leave. Look at the project and task: is client work on the client's project, and internal work on internal tasks? Read comments on unusual days. Reject with a clear reason rather than approving and fixing it later. The common mistake is bulk-approving everything on Monday morning without looking. That is how a bench day logged as billable ends up on a client invoice. Deadlines, reminders and what a PM must check are in your team's SOP below.",
      level: "beginner",
      estMinutes: 35,
      webRefs: [
        { label: "Keka Help: Submitting a Weekly Timesheet by an Employee", url: "https://help.keka.com/hc/en-us/articles/39946820520209-Submitting-a-Weekly-Timesheet-by-an-Employee", kind: "docs", verifiedAt: "2026-10-02T10:07:06Z" },
        { label: "Keka Help: Managing your team's timesheets", url: "https://help.keka.com/hc/en-us/articles/39946833972753-Managing-your-team-s-timesheets", kind: "docs", verifiedAt: "2026-10-02T10:07:57Z" },
        { label: "Keka Help: How to Approve Timesheets for Multiple Employees at Once?", url: "https://help.keka.com/hc/en-us/articles/39946829251857-How-to-Approve-Timesheets-for-Multiple-Employees-at-Once", kind: "docs", verifiedAt: "2026-10-02T09:38:53Z" },
        { label: "Keka Help: Managing Timesheet Policy Settings in Keka PSA", url: "https://help.keka.com/hc/en-us/articles/39946553817233-Managing-Timesheet-Policy-Settings-in-Keka-PSA", kind: "docs", verifiedAt: "2026-10-02T10:07:28Z" },
      ],
      video: {
        title: "Understanding Employee timesheets | Timesheets usage, Project Management, Billing & Invoices in Keka",
        channel: "Keka HR",
        url: "https://www.youtube.com/watch?v=Ote5na_Itb4",
        videoId: "Ote5na_Itb4",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      alternateVideos: [
        {
          title: "Manage timesheets better l Keka HR",
          channel: "Keka HR",
          url: "https://www.youtube.com/watch?v=LgFGoWbjwM4",
          videoId: "LgFGoWbjwM4",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-keka-timesheets-q1",
          prompt: "Where does an employee log and submit a weekly timesheet in Keka?",
          options: [
            "Me > Timesheet: + Add time, choose project and task, enter hours, Save, then Submit weekly timesheet",
            "My Team > Timesheets > Approvals",
            "Project > Analytics > Insights",
            "Finances > Settings",
          ],
          correctIndex: 0,
          explanation: "Employees log their own time from the Me tab. My Team is the manager's view for approvals.",
        },
        {
          id: "pma-keka-timesheets-q2",
          prompt:
            "Meera logged 8 h on \"Internal - Learning\" on Tuesday, but you know she spent the day fixing the client's checkout bug on a Time & Material project. What do you do?",
          options: [
            "Reject the timesheet with a clear reason so she moves the hours to the client project's task",
            "Approve it; the total hours are correct",
            "Approve it and fix it on the invoice later",
            "Edit her hours yourself without telling her",
          ],
          correctIndex: 0,
          explanation:
            "On T&M, billing follows timesheets, so wrong project means lost revenue. Rejecting with a reason gets it fixed at the source.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-timesheets-q3",
          prompt: "What must you provide in Keka when you reject a timesheet?",
          options: ["A reason", "A new set of hours", "The client's approval", "Nothing, rejection is one click"],
          correctIndex: 0,
          explanation: "Keka asks for a reason in an overlay when rejecting, so the employee knows what to correct.",
        },
        {
          id: "pma-keka-timesheets-q4",
          prompt: "Which should you check before approving a team member's week? (Select all that apply.)",
          options: [
            "Hours against the plan and any approved leave",
            "Client work on the client project, internal work on internal tasks",
            "Comments on unusually long or short days",
            "Whether the person is friendly in stand-ups",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Hours, project/task and context are what make the numbers right for billing and reporting.",
        },
        {
          id: "pma-keka-timesheets-q5",
          prompt:
            "It is Monday and 14 timesheets are pending. You select all and approve in one click to save time. What is the risk?",
          options: [
            "Errors such as bench hours logged as billable go straight into invoices and utilisation reports",
            "Keka will reject bulk approvals",
            "None: bulk approval checks the hours for you",
            "The timesheets will be approved twice",
          ],
          correctIndex: 0,
          explanation:
            "Bulk approval is a convenience, not a check. Review first, then bulk-approve the ones that are right.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-timesheets-q6",
          prompt: "Where can a manager see a project's hours split into billable and non-billable, and download them?",
          options: ["My Team > Timesheets > Project Time", "Me > Timesheet > Past Due", "Me > Leave", "Clients > Add Client"],
          correctIndex: 0,
          explanation: "Project Time shows hours per person with billable and non-billable split, and exports to Excel or PDF.",
        },
      ],
      practice: {
        kind: "sim",
        app: "keka-timesheets",
        prompt:
          "You are the PM for a Laravel CRM (Time & Material, UK client) and approve your team's timesheets. For this exercise, assume a standard week is 40 h and the team's planned allocations are as noted. Flag every timesheet you should reject or query before approving, then answer the questions.",
        title: "Pending approvals — Project view, week 41",
        columns: ["Employee", "Project / task", "Hours", "Billable", "Comment"],
        rows: [
          { id: "r1", cells: ["Ravi", "Acme CRM / Payments API", "40", "Yes", ""], issue: null },
          { id: "r2", cells: ["Meera", "Acme CRM / Admin dashboard", "62", "Yes", ""], issue: "62 h in one week with no comment: far above the plan; query before approving" },
          { id: "r3", cells: ["Arjun", "Acme CRM / Bug fixes", "32", "Yes", "Approved leave Friday"], issue: null },
          { id: "r4", cells: ["Sana", "Acme CRM / Development", "40", "Yes", "Was on bench all week"], issue: "Bench time logged as billable client work" },
          { id: "r5", cells: ["Divya", "Acme CRM / QA", "24", "Yes", "Split 60% with another project"], issue: null },
          { id: "r6", cells: ["Karan", "Internal / Learning", "40", "No", "Fixed Acme checkout bug all week"], issue: "Client work logged on an internal task, so it will not be billed" },
          { id: "r7", cells: ["Tom", "Acme CRM / Code review", "8", "Yes", "20% allocation"], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "What is the right action for Sana's 40 billable hours?",
            options: [
              "Reject with a reason: bench time is not billable client work",
              "Approve, because the client will not notice",
              "Approve and reduce the invoice by hand later",
            ],
            correctIndex: 0,
            explanation: "On T&M, approved billable hours flow into billing. Fix it at the timesheet, with a reason.",
          },
          {
            id: "q2",
            question: "Divya logged 24 h. Is that a problem?",
            options: [
              "No: 24 h matches a 60% allocation of a 40 h week",
              "Yes: everyone must log 40 h on this project",
              "Yes: QA hours are never billable",
            ],
            correctIndex: 0,
            explanation: "Check hours against each person's allocation, not against a full week.",
          },
        ],
      },
      sop: [
        {
          title: "Our Keka timesheet policy",
          prompt:
            "[Oyelabs SOP – admin to fill] Daily or weekly submission, the submission deadline, the approval deadline for PMs, what a PM must check before approving, how to handle a late or wrong timesheet, and who approves when the PM is on leave.",
        },
      ],
    },
    {
      id: "pma-keka-leave-attendance",
      moduleId: "pma-keka",
      trackId: "pm",
      title: "Leave and attendance, and delivery impact",
      summary:
        "Keka holds the facts a PM needs to plan around: who has applied for leave, who is approved, who is working from home, and the company holiday calendar. A PM who does not look at them plans a release for a week when the lead developer is away, and finds out at the stand-up.\n\nEmployees apply for leave in Keka, and managers approve it under the leave policies the company has set up. Attendance logs record when people work, and attendance requests (such as regularising a missed punch) go through approval too. Leave also shows up in timesheets. In the Keka mobile app, for example, a day with approved leave appears as a Leave Request entry in the weekly timesheet, and a timesheet policy can stop people from logging time on time-off days.\n\nFor a PM the useful habit is to check leave every week, not just when someone asks. Step by step: look at approved and pending leave for the next two to four weeks. Note anyone on your project, and how much of their time was planned for you. Update capacity in your resource plan. If a key person is away during a demo, release or UAT window, plan a handover or move the date, and tell the client early. When approving timesheets, check that leave days do not also carry project hours.\n\nThe common mistakes: treating leave as an HR matter, not a delivery one. Approving leave for two people who both know the payment integration, for the same week. And hours logged on a day that also shows approved leave, which means either the leave or the timesheet is wrong, and the invoice may be too. Who approves leave, how much notice is needed, and how PMs are consulted is in your team's SOP below.",
      level: "beginner",
      estMinutes: 30,
      webRefs: [
        { label: "Keka Help: Managing and tracking your attendance logs and requests", url: "https://help.keka.com/hc/en-us/articles/39946840685969-Managing-and-tracking-your-attendance-logs-and-requests", kind: "docs", verifiedAt: "2026-10-02T09:38:44Z" },
        { label: "Keka Help: Filling Timesheet when on Leave in Keka Mobile App", url: "https://help.keka.com/hc/en-us/articles/39946842194833-Filling-Timesheet-when-on-Leave-in-Keka-Mobile-App", kind: "docs", verifiedAt: "2026-10-02T09:38:37Z" },
        { label: "Keka: Advanced Employee Leave Management Software", url: "https://www.keka.com/leave-management-system", kind: "article", verifiedAt: "2026-10-02T10:07:09Z" },
        { label: "Keka: Attendance Management", url: "https://www.keka.com/attendance-management-system", kind: "article", verifiedAt: "2026-10-02T10:06:45Z" },
      ],
      video: {
        title: "Leave Management l Creating and Assigning Leave Policies l Keka HR",
        channel: "Keka HR",
        url: "https://www.youtube.com/watch?v=cauHVkEZtaw",
        videoId: "cauHVkEZtaw",
        verifiedAt: "2026-10-02T09:35:55Z",
      },
      alternateVideos: [
        {
          title: "How to apply your leave through Keka Software",
          channel: "POS Internal Trainings",
          url: "https://www.youtube.com/watch?v=T3CgXXwuMn0",
          videoId: "T3CgXXwuMn0",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
        {
          title: "KEKA HR App Complete Guide 🔥 | Partial Day, Overtime, Leave & Attendance apply कैसे करें?#KEKAHR APP",
          channel: "Unstoppable Satya",
          url: "https://www.youtube.com/watch?v=vxGhB--n1BM",
          videoId: "vxGhB--n1BM",
          verifiedAt: "2026-10-02T09:35:56Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-keka-leave-attendance-q1",
          prompt:
            "Arjun's timesheet shows 8 billable hours on Thursday, and Keka also shows an approved leave for Thursday. What do you do?",
          options: [
            "Query it before approving: either the leave or the timesheet is wrong, and the invoice may be too",
            "Approve the timesheet; leave is HR's business",
            "Cancel his leave",
            "Approve both and ignore it",
          ],
          correctIndex: 0,
          explanation: "Hours on an approved leave day are a contradiction. Fix it before it reaches payroll or the client invoice.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-leave-attendance-q2",
          prompt: "How often should a PM look at the team's upcoming leave in Keka?",
          options: [
            "Every week, for the next two to four weeks",
            "Only when someone mentions leave",
            "Once a quarter",
            "Only at the end of a project",
          ],
          correctIndex: 0,
          explanation: "A weekly look ahead catches clashes with demos, releases and UAT while there is still time to plan.",
        },
        {
          id: "pma-keka-leave-attendance-q3",
          prompt: "Two developers, the only two who know the Stripe integration, have both applied for leave in release week. Which steps make sense? (Select all that apply.)",
          options: [
            "Raise it with the approving manager before approval, with the release date",
            "Plan a handover so a third person can cover payments",
            "Agree with the developers whether one of them can shift dates",
            "Reject both requests without talking to them",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "This is a key-person risk. Talk early, cover the knowledge, and agree dates fairly. Silent rejection damages trust.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-leave-attendance-q4",
          prompt: "Where does a day of approved leave appear when an employee fills the weekly timesheet in the Keka mobile app?",
          options: ["As a Leave Request entry on that day", "Nowhere; leave and timesheets are separate", "As 8 billable hours", "As a rejected timesheet"],
          correctIndex: 0,
          explanation: "Keka's help article describes leave showing as a Leave Request entry on the timesheet.",
        },
        {
          id: "pma-keka-leave-attendance-q5",
          prompt: "Approved leave cuts your team's capacity by 3 days next sprint. What should you do with that information?",
          options: [
            "Update the resource plan and agree with the client at sprint planning what moves",
            "Nothing until the sprint review",
            "Ask the team to work weekends",
            "Hide it from the client",
          ],
          correctIndex: 0,
          explanation: "Leave is known in advance, so its effect on scope should be agreed in advance.",
        },
      ],
      practice: {
        kind: "sim",
        app: "keka-timesheets",
        prompt:
          "You are approving week 44 for a React Native app (US client). The Leave column shows what Keka has approved. For this exercise, assume time must not be logged on approved leave or office holiday days, and a standard day is 8 h. Flag the rows you should send back, then answer the questions.",
        title: "Week 44 — timesheets with leave and holidays",
        columns: ["Employee", "Leave in Keka", "Hours logged", "Days with hours", "Comment"],
        rows: [
          { id: "r1", cells: ["Ravi", "None", "40", "Mon-Fri", ""], issue: null },
          { id: "r2", cells: ["Meera", "Wed (approved)", "32", "Mon, Tue, Thu, Fri", ""], issue: null },
          { id: "r3", cells: ["Arjun", "Thu-Fri (approved)", "40", "Mon-Fri", ""], issue: "Hours logged on two approved leave days" },
          { id: "r4", cells: ["Divya", "Mon (pending)", "40", "Mon-Fri", "Worked Monday after all"], issue: null },
          { id: "r5", cells: ["Sana", "Office holiday Tue", "40", "Mon-Fri", ""], issue: "Hours logged on the office holiday with no explanation" },
          { id: "r6", cells: ["Tom", "None", "16", "Mon, Tue", "No comment"], issue: "Only 16 h with no leave and no comment: ask what happened Wed-Fri" },
          { id: "r7", cells: ["Karan", "Fri (approved)", "32", "Mon-Thu", ""], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "Divya's Monday leave is still pending and she says she worked. What should happen?",
            options: [
              "She withdraws the pending leave request so leave and timesheet agree",
              "Approve the leave and the timesheet",
              "Reject the timesheet and approve the leave",
            ],
            correctIndex: 0,
            explanation: "Keka's records should match reality; a pending request for a day she worked should be withdrawn.",
          },
          {
            id: "q2",
            question: "Arjun was away Thursday and Friday. What does that mean for the delivery plan?",
            options: [
              "Check whether his tasks this week slipped and update the plan, beyond fixing his timesheet",
              "Nothing, because his timesheet shows 40 h",
              "Only HR needs to know",
            ],
            correctIndex: 0,
            explanation: "The timesheet error hides two lost days of work. The plan and the client update must reflect them.",
          },
        ],
      },
      sop: [
        {
          title: "Our leave and attendance rules for project teams",
          prompt:
            "[Oyelabs SOP – admin to fill] Who approves leave for project staff, how much notice is required, whether the PM is consulted, blackout periods around releases, how work-from-home and attendance regularisation are handled, and where the holiday calendar is in Keka.",
        },
      ],
    },
    {
      id: "pma-keka-psa-projects-clients",
      moduleId: "pma-keka",
      trackId: "pm",
      title: "Keka PSA: projects and clients",
      summary:
        "Keka PSA (Professional Services Automation) is the part of Keka built for agencies: it ties clients, projects, people, timesheets and invoices together. If a project is set up wrongly at the start, everything downstream is wrong too: timesheets land on the wrong client, invoices go out in the wrong currency, and utilisation reports mislead. Five minutes of care at setup saves weeks of fixes.\n\nKeka's getting-started guide gives the order: create the client, set up the rate card, create the project, assign resources, add tasks, set up billing, configure the timesheet policy, allocate resources, and finally generate invoices. When adding a client, you enter the client name (the brand), a unique client code, the client manager (the internal owner), a description, the billing currency, and the billing details: the legal billing name and billing address. The help article notes that the client code and currency cannot be edited after creation.\n\nThe brand and legal name often differ. A US client may trade as \"ShopNest\" while its contracts and invoices are with \"ShopNest Holdings Inc.\" Enter the brand as the client name and the legal entity as the billing name, exactly as it appears in the contract. Several clients can share one billing name, which is useful when one parent company pays for several brands.\n\nThe common mistakes: picking the wrong currency for an overseas client (a GBP contract set up in INR), which cannot be changed later. A client code that does not follow any pattern, so nobody can find anything. Duplicate clients created by different PMs. And projects with no client manager or PM, so nobody owns the timesheet approvals. Who creates clients and projects in our Keka, and the naming rules, are in your team's SOP below.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Keka Help: Getting started with Keka PSA", url: "https://help.keka.com/hc/en-us/articles/39946664044689-Getting-started-with-Keka-PSA", kind: "docs", verifiedAt: "2026-10-02T10:07:20Z" },
        { label: "Keka Help: Adding Clients in Keka PSA", url: "https://help.keka.com/hc/en-us/articles/39946628956049-Adding-Clients-in-Keka-PSA", kind: "docs", verifiedAt: "2026-10-02T09:38:49Z" },
        { label: "Keka Help: What is Keka Professional Services Automation (PSA)?", url: "https://help.keka.com/hc/en-us/articles/39946767676433-What-is-Keka-Professional-Services-Automation-PSA", kind: "docs", verifiedAt: "2026-10-02T09:38:58Z" },
      ],
      video: {
        title: "Deliver Profitable Projects on Time, Every Time | The Future of Professional Services Management!",
        channel: "Keka HR",
        url: "https://www.youtube.com/watch?v=3Fw_lSjDpwE",
        videoId: "3Fw_lSjDpwE",
        verifiedAt: "2026-10-02T09:35:55Z",
      },
      alternateVideos: [
        {
          title: "Understanding Employee timesheets | Timesheets usage, Project Management, Billing & Invoices in Keka",
          channel: "Keka HR",
          url: "https://www.youtube.com/watch?v=Ote5na_Itb4",
          videoId: "Ote5na_Itb4",
          verifiedAt: "2026-10-02T09:35:56Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-keka-psa-projects-clients-q1",
          prompt:
            "A new UK client signed a contract in GBP. Someone created the client in Keka PSA with INR as the billing currency. Why is this serious?",
          options: [
            "Invoices are generated in the client's billing currency, and Keka does not allow the currency to be edited after creation",
            "It is not serious; currency can be changed on each invoice",
            "Keka converts INR to GBP automatically, so nothing is wrong",
            "Only the client code matters for invoicing",
          ],
          correctIndex: 0,
          explanation:
            "The help article says client invoices use the billing currency and that client code and currency are locked after creation. Get it right first time.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-psa-projects-clients-q2",
          prompt:
            "The client trades as \"ShopNest\" but the contract is with \"ShopNest Holdings Inc.\" How do you enter it?",
          options: [
            "Client name: ShopNest. Billing name: ShopNest Holdings Inc.",
            "Client name: ShopNest Holdings Inc. Billing name: ShopNest",
            "Both fields: ShopNest",
            "Create two separate clients",
          ],
          correctIndex: 0,
          explanation: "Client name is the brand you work with; billing name is the legal entity that appears on invoices.",
        },
        {
          id: "pma-keka-psa-projects-clients-q3",
          prompt: "In what order does Keka's getting-started guide set up PSA?",
          options: [
            "Client, rate card, project, resources, tasks, billing, timesheet policy, allocation, invoice",
            "Invoice, project, client, resources",
            "Project, timesheets, client, rate card",
            "Resources, invoice, client, project",
          ],
          correctIndex: 0,
          explanation: "Each step depends on the one before: a project needs a client, billing needs rates, invoices need approved hours.",
        },
        {
          id: "pma-keka-psa-projects-clients-q4",
          prompt: "Which fields must you get right when adding a client, because they drive invoicing or cannot be changed later? (Select all that apply.)",
          options: ["Billing currency", "Client code", "Billing name (legal entity) and address", "The description"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Currency and code are locked after creation, and the billing name and address appear on invoices. The description is free text.",
        },
        {
          id: "pma-keka-psa-projects-clients-q5",
          prompt: "Who is the \"Client Manager\" on a client record in Keka PSA?",
          options: [
            "The primary internal person who manages the client relationship",
            "The client's own project manager",
            "The finance contact at the client",
            "Any employee working on the project",
          ],
          correctIndex: 0,
          explanation: "Client Manager is an internal stakeholder, selected from your employees.",
        },
        {
          id: "pma-keka-psa-projects-clients-q6",
          prompt: "Two PMs each created \"Acme UK\" as a client for their own projects. What problems follow?",
          options: [
            "Projects, timesheets and invoices split across two records, so client reports and consolidated invoices are wrong",
            "None, Keka merges them automatically",
            "Only a cosmetic problem in the client list",
            "The second one is deleted automatically",
          ],
          correctIndex: 0,
          explanation: "Search before creating. One client record per client keeps reporting and invoicing correct.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-psa-projects-clients-q7",
          prompt: "A parent company pays for three brands you build apps for. How can Keka PSA handle this?",
          options: [
            "Create each brand as a client and use the parent company as the shared billing name",
            "Create one client and put all three brands in the description",
            "It cannot; each client must have a unique billing name",
            "Bill each brand from a different currency",
          ],
          correctIndex: 0,
          explanation: "Keka allows several clients under one billing name, as in its Tata Group example.",
        },
        {
          id: "pma-keka-psa-projects-clients-q8",
          prompt: "Before creating a new client in Keka PSA, what should you check first?",
          options: [
            "That the client does not already exist, and the contract's legal name, address and currency",
            "That the project has started",
            "That invoices have been sent",
            "That the team has logged time",
          ],
          correctIndex: 0,
          explanation: "Duplicates and wrong billing details are the expensive setup mistakes.",
        },
      ],
      practice: {
        kind: "sim",
        app: "keka-psa",
        prompt:
          "Delivery leadership asked you to review new client and project records in Keka PSA against the signed contracts. Flag every record with a setup problem, then answer the questions.",
        title: "Clients & projects created this month",
        columns: ["Client name", "Billing name", "Currency", "Project", "Billing type", "PM"],
        rows: [
          { id: "r1", cells: ["ShopNest", "ShopNest Holdings Inc.", "USD (contract USD)", "ShopNest React web app", "Time & Material", "Priya"], issue: null },
          { id: "r2", cells: ["Brightline", "Brightline Pty Ltd", "INR (contract AUD)", "Brightline Flutter app", "Milestone", "Rahul"], issue: "Currency does not match the AUD contract, and it cannot be changed later" },
          { id: "r3", cells: ["Acme UK", "Acme Retail Ltd", "GBP (contract GBP)", "Acme Laravel CRM", "Time & Material", "Priya"], issue: null },
          { id: "r4", cells: ["Acme", "Acme Retail Ltd", "GBP (contract GBP)", "Acme support retainer", "Retainer", "Rahul"], issue: "Duplicate of the existing Acme UK client" },
          { id: "r5", cells: ["Northwind", "Northwind Inc.", "USD (contract USD)", "Northwind API integration", "Time & Material", "(none)"], issue: "No PM assigned, so nobody owns approvals" },
          { id: "r6", cells: ["Oyelabs", "Oyelabs", "INR", "Internal QA automation", "Non-Billable", "Rahul"], issue: null },
          { id: "r7", cells: ["Greenleaf", "Greenleaf", "USD (contract USD)", "Greenleaf marketplace", "Fixed (3 milestones)", "Priya"], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "Greenleaf's billing name is just \"Greenleaf\", but the contract is signed by \"Greenleaf Commerce LLC\". What should you do?",
            options: [
              "Correct the billing name to the contract's legal entity before the first invoice",
              "Leave it: the brand name is fine on an invoice",
              "Delete the client and start again with a new currency",
            ],
            correctIndex: 0,
            explanation: "Invoices go to the legal entity named in the contract; a wrong name can delay payment.",
          },
          {
            id: "q2",
            question: "Which record is correctly set up as Non-Billable?",
            options: ["Internal QA automation", "Acme support retainer", "Brightline Flutter app"],
            correctIndex: 0,
            explanation: "Internal work that is not billed to a client is what Keka's Non-Billable project type is for.",
          },
        ],
      },
      sop: [
        {
          title: "Setting up clients and projects in our Keka PSA",
          prompt:
            "[Oyelabs SOP – admin to fill] Who may create clients and projects, the client code and project naming pattern, how the billing currency and legal name are confirmed from the contract, and the checklist a PM completes before the first timesheet is logged.",
        },
      ],
    },
    {
      id: "pma-keka-psa-billing-types",
      moduleId: "pma-keka",
      trackId: "pm",
      title: "Billing types: Time & Material, Milestone, Non-Billable",
      summary:
        "Every project in Keka PSA has a billing method, and it should match the contract. Get it wrong and Keka will try to bill a fixed-price client for every hour logged, or never bill a T&M client at all. The PM is usually the person who knows what the contract actually says, so this is your check to make.\n\nKeka describes three main types. **Time & Material** (also called Bill Time) projects are invoiced on the hours resources log, so approved timesheets and rate cards drive the invoice. **Milestone** (Bill Milestones) projects are invoiced in portions of the total price when agreed milestones are reached, not by hours. **Non-Billable** projects are internal: training, R&D, presales, internal tools. Keka also supports a retainer billing model for fixed amounts invoiced at regular intervals, which suits monthly support contracts.\n\nWhich to use follows the contract. A UK client paying monthly for actual developer hours is T&M. A fixed-price Laravel marketplace paid 30/40/30 at design sign-off, beta and go-live is Milestone. A monthly support retainer with a fixed fee is the retainer model. Your own team's training is Non-Billable. On a Milestone project, hours still matter: they tell you whether you are making or losing money, even though the client never sees them.\n\nThe common mistakes: a fixed-bid project set up as T&M, so the first invoice bills every hour and the client disputes it. A milestone marked complete in Keka before the client has accepted it, so an invoice goes out early. Change requests on a fixed bid that are delivered but never added as a new billable item. And a T&M project with a cap (\"not more than 400 hours\") with no one watching the hours. Our billing rules for each contract type are in your team's SOP below.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Keka Help: What is Keka Professional Services Automation (PSA)?", url: "https://help.keka.com/hc/en-us/articles/39946767676433-What-is-Keka-Professional-Services-Automation-PSA", kind: "docs", verifiedAt: "2026-10-02T09:38:58Z" },
        { label: "Keka Help: Billing and Invoicing in Keka PSA: An Overview", url: "https://help.keka.com/hc/en-us/articles/39946758976913-Billing-and-Invoicing-in-Keka-PSA-An-Overview", kind: "docs", verifiedAt: "2026-10-02T10:06:51Z" },
        { label: "Keka Help: Using the New Retainer Billing Model in PSA for Payroll Automation", url: "https://help.keka.com/hc/en-us/articles/39946698729361-Using-the-New-Retainer-Billing-Model-in-PSA-for-Payroll-Automation", kind: "docs", verifiedAt: "2026-10-02T09:39:03Z" },
        { label: "Keka Help: Accessing the Milestone Info Report", url: "https://help.keka.com/hc/en-us/articles/39946779615889-Accessing-the-Milestone-Info-Report", kind: "docs", verifiedAt: "2026-10-02T09:38:59Z" },
      ],
      video: {
        title: "Understanding Employee timesheets | Timesheets usage, Project Management, Billing & Invoices in Keka",
        channel: "Keka HR",
        url: "https://www.youtube.com/watch?v=Ote5na_Itb4",
        videoId: "Ote5na_Itb4",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      alternateVideos: [
        {
          title: "Deliver Profitable Projects on Time, Every Time | The Future of Professional Services Management!",
          channel: "Keka HR",
          url: "https://www.youtube.com/watch?v=3Fw_lSjDpwE",
          videoId: "3Fw_lSjDpwE",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-keka-psa-billing-types-q1",
          prompt:
            "A fixed-price Laravel marketplace is paid 30% at design sign-off, 40% at beta and 30% at go-live. Which billing type fits?",
          options: ["Milestone", "Time & Material", "Non-Billable", "Retainer"],
          correctIndex: 0,
          explanation: "Payments tied to agreed milestones, not hours, are Milestone billing.",
        },
        {
          id: "pma-keka-psa-billing-types-q2",
          prompt: "A US client pays monthly for the actual hours of two React developers at agreed hourly rates. Which type fits?",
          options: ["Time & Material", "Milestone", "Non-Billable", "Retainer"],
          correctIndex: 0,
          explanation: "Billing by hours logged, using rate cards, is Time & Material (Bill Time).",
        },
        {
          id: "pma-keka-psa-billing-types-q3",
          prompt:
            "A fixed-bid project was set up in Keka as Time & Material by mistake. What is the likely result?",
          options: [
            "Invoices are built from logged hours instead of the agreed milestone amounts, and the client disputes them",
            "Nothing changes, billing type is only a label",
            "The project becomes non-billable",
            "Keka blocks timesheets on the project",
          ],
          correctIndex: 0,
          explanation: "T&M bills hours. On a fixed bid the client agreed to pay amounts per milestone, so hour-based invoices are wrong.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-psa-billing-types-q4",
          prompt: "Which work belongs on a Non-Billable project? (Select all that apply.)",
          options: [
            "Internal training on a new framework",
            "Presales estimation for a deal not yet signed",
            "Building an internal tool for the agency",
            "Bug fixes a T&M client agreed to pay for",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Non-Billable is for internal work not invoiced to a client. Paid bug fixes on T&M are billable.",
        },
        {
          id: "pma-keka-psa-billing-types-q5",
          prompt: "A client pays a fixed monthly fee for support and maintenance of their live app. Which Keka option suits this?",
          options: ["The retainer billing model, invoicing a fixed amount at regular intervals", "Milestone with one milestone per year", "Non-Billable", "Time & Material with no rate card"],
          correctIndex: 0,
          explanation: "Keka's billing overview describes the retainer model for fixed amounts at regular intervals.",
        },
        {
          id: "pma-keka-psa-billing-types-q6",
          prompt:
            "On a Milestone project, the client never sees hours. Why should the team still log accurate timesheets?",
          options: [
            "Hours show whether the fixed price is profitable and inform future estimates",
            "Keka will not create milestone invoices without timesheets",
            "The client can see hours in their portal",
            "There is no reason; skip timesheets on fixed bids",
          ],
          correctIndex: 0,
          explanation: "Fixed price shifts the risk to the agency. Hours are how you see an overrun before it eats the margin.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-psa-billing-types-q7",
          prompt: "The beta milestone is marked complete in Keka, but the client has not yet accepted the beta. What is the risk?",
          options: [
            "An invoice can go out before acceptance, which the client can rightly dispute",
            "None: Keka waits for the client automatically",
            "The project switches to T&M",
            "The milestone is deleted",
          ],
          correctIndex: 0,
          explanation: "Mark milestones complete only when the contract's acceptance criteria are met.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-psa-billing-types-q8",
          prompt: "Which Keka report helps you see upcoming milestones with estimated billing amounts and status, to plan invoices?",
          options: ["Milestone Info report (Analytics > Reports > Client & Project Reports)", "Week Summary", "Past Due timesheets", "Leave balance"],
          correctIndex: 0,
          explanation: "The Milestone Info report lists milestones with dates, estimated billing amount and status, and can be exported.",
        },
        {
          id: "pma-keka-psa-billing-types-q9",
          prompt:
            "On a fixed-bid project, the client approves a change request for an extra admin report, priced separately. What must happen in Keka?",
          options: [
            "Add it as a new billable item or milestone, so it is actually invoiced",
            "Nothing: the team will log the hours",
            "Move the project to Non-Billable",
            "Raise the existing milestone amounts silently",
          ],
          correctIndex: 0,
          explanation: "On a fixed bid, extra hours do not bill themselves. An approved change request must become something Keka invoices.",
        },
      ],
      practice: {
        kind: "sim",
        app: "keka-psa",
        prompt:
          "You are reviewing billing setup for your projects in Keka PSA against what each contract says. Flag every project whose billing setup does not match its contract, then answer the questions.",
        title: "Projects — billing configuration",
        columns: ["Project", "Contract says", "Billing type in Keka", "Note"],
        rows: [
          { id: "r1", cells: ["Acme Laravel CRM", "Monthly invoice of actual hours at agreed rates", "Time & Material", ""], issue: null },
          { id: "r2", cells: ["Greenleaf marketplace", "Fixed price, 3 payments at milestones", "Time & Material", ""], issue: "Fixed price contract set up as T&M: invoices would bill hours" },
          { id: "r3", cells: ["Internal design system", "Internal work", "Non-Billable", ""], issue: null },
          { id: "r4", cells: ["ShopNest support", "Fixed monthly support fee", "Retainer", ""], issue: null },
          { id: "r5", cells: ["Brightline Flutter app", "Fixed price, 2 milestones", "Milestone", "Beta marked complete; client UAT still open"], issue: "Milestone marked complete before client acceptance" },
          { id: "r6", cells: ["Northwind presales POC", "Unpaid proof of concept", "Time & Material", ""], issue: "Unpaid POC should be Non-Billable" },
          { id: "r7", cells: ["Acme reporting CR", "Approved change request, $2,400 fixed", "Milestone", "Added as its own milestone"], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "What is the first thing to do about the Greenleaf project?",
            options: [
              "Correct the billing setup to milestone billing before any invoice is raised",
              "Send the hour-based invoice and explain later",
              "Make it Non-Billable",
            ],
            correctIndex: 0,
            explanation: "Fix the setup before billing runs, so the first invoice matches the contract.",
          },
          {
            id: "q2",
            question: "Why is the Acme reporting CR set up correctly?",
            options: [
              "An approved fixed-price change is its own billable milestone, so it will be invoiced",
              "Change requests should always be Non-Billable",
              "It should be T&M because the team logs hours",
            ],
            correctIndex: 0,
            explanation: "A separate billable item makes sure approved extra work is actually invoiced.",
          },
        ],
      },
      sop: [
        {
          title: "Our billing rules by contract type",
          prompt:
            "[Oyelabs SOP – admin to fill] Which Keka billing type to use for each Oyelabs contract type (T&M, fixed bid, support retainer, white-label), who confirms milestone acceptance before it is marked complete, how change requests are added for billing, and how hour caps on T&M contracts are monitored.",
        },
      ],
    },
    {
      id: "pma-keka-psa-allocation-rate-cards",
      moduleId: "pma-keka",
      trackId: "pm",
      title: "Resource allocation and rate cards",
      summary:
        "Allocation says who works on a project and how much. A rate card says what each role costs the client per hour. Together they decide what a T&M invoice says, so a wrong allocation or a missing rate shows up as a billing error weeks later, usually in front of the client's finance team.\n\nIn Keka PSA you allocate from the project's Team tab: Active Allocation, then + Add Resource. Pick the employee, set start and end dates, an allocation percentage from 0 to 100% (any value, such as 33% or 66%), and the allocation type. Soft allocation is tentative, for example a likely deal. Hard allocation is confirmed. Keka's help article says one person can be allocated to several projects as long as their total does not go over 100%. Keka also supports setting billing rates per resource, a maximum number of billable hours per project, and shadow resources (people who work on the project without being billed).\n\nRate cards hold the billing roles and hourly rates for a client, such as Senior Laravel Developer, React Developer, QA Engineer. They can be maintained in Keka or bulk-imported with the Import Client Rate Card template. Rates should be in the same currency as the client's project. Before a T&M project starts, check that every allocated person maps to a role with the agreed rate from the contract.\n\nStep by step at project start and each month: compare allocations with the resource plan, end allocations that are finished, and check each billable person has the right role and rate. The common mistakes: a junior billed at a senior rate (or the reverse, which loses money quietly). A rate card in the wrong currency. A shadow or trainee developer billed as a full resource. And allocations without end dates, so people stay on finished projects in every report. Our rate cards and who may change them are in your team's SOP below.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Keka Help: Tailoring Resource Allocation", url: "https://help.keka.com/hc/en-us/articles/39946575810321-Tailoring-Resource-Allocation", kind: "docs", verifiedAt: "2026-10-02T09:38:31Z" },
        { label: "Keka Help: Using Bulk Imports in Keka PSA", url: "https://help.keka.com/hc/en-us/articles/39946756566801-Using-Bulk-Imports-in-Keka-PSA", kind: "docs", verifiedAt: "2026-10-02T10:06:54Z" },
        { label: "Keka Help: Unlocking Project Success with Keka PSA's Enhanced Estimation Tools", url: "https://help.keka.com/hc/en-us/articles/39946773026321-Unlocking-Project-Success-with-Keka-PSA-s-Enhanced-Estimation-Tools", kind: "docs", verifiedAt: "2026-10-02T10:06:45Z" },
        { label: "Keka Help: Getting started with Keka PSA", url: "https://help.keka.com/hc/en-us/articles/39946664044689-Getting-started-with-Keka-PSA", kind: "docs", verifiedAt: "2026-10-02T10:07:20Z" },
      ],
      video: {
        title: "Deliver Profitable Projects on Time, Every Time | The Future of Professional Services Management!",
        channel: "Keka HR",
        url: "https://www.youtube.com/watch?v=3Fw_lSjDpwE",
        videoId: "3Fw_lSjDpwE",
        verifiedAt: "2026-10-02T09:35:55Z",
      },
      alternateVideos: [
        {
          title: "Understanding Employee timesheets | Timesheets usage, Project Management, Billing & Invoices in Keka",
          channel: "Keka HR",
          url: "https://www.youtube.com/watch?v=Ote5na_Itb4",
          videoId: "Ote5na_Itb4",
          verifiedAt: "2026-10-02T09:35:56Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-keka-psa-allocation-rate-cards-q1",
          prompt: "Ravi is 70% on the Acme CRM. You try to add him at 50% to the Brightline app in Keka PSA. What is the problem?",
          options: [
            "His total would be 120%; Keka allows several projects only while the total stays within 100%",
            "No problem: allocations are per project",
            "Keka only allows one project per person",
            "50% is not an allowed value",
          ],
          correctIndex: 0,
          explanation: "Keka's help says multiple allocations are fine as long as the total does not exceed 100%.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-psa-allocation-rate-cards-q2",
          prompt: "What do you set when adding a resource to a project in Keka PSA? (Select all that apply.)",
          options: ["Start and end date", "Allocation percentage", "Allocation type (soft or hard)", "The employee's salary"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "The Set Allocation step takes dates, a percentage and the type. Salary is not part of allocation.",
        },
        {
          id: "pma-keka-psa-allocation-rate-cards-q3",
          prompt: "A deal is 80% likely to start next month. How should you reserve the two developers it needs?",
          options: ["Soft allocation, converted to hard when the deal is signed", "Hard allocation now", "No allocation until signed", "Allocate them at 0%"],
          correctIndex: 0,
          explanation: "Soft allocation pencils people in without treating the deal as confirmed.",
        },
        {
          id: "pma-keka-psa-allocation-rate-cards-q4",
          prompt:
            "A junior React developer is mapped to the \"Senior React Developer\" role on a T&M client's rate card. What happens?",
          options: [
            "The client is over-billed for those hours, a trust and possibly contract issue",
            "Nothing, roles are internal only",
            "Keka blocks the timesheet",
            "The client is under-billed",
          ],
          correctIndex: 0,
          explanation: "On T&M, the rate follows the role. Wrong role, wrong invoice.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-psa-allocation-rate-cards-q5",
          prompt: "A trainee is shadowing on a client project to learn. The contract does not cover them. How should they be set up?",
          options: [
            "As a shadow (non-billed) resource, so their hours are tracked but not invoiced",
            "As a billable resource at a low rate",
            "Not in Keka at all",
            "On a separate T&M project",
          ],
          correctIndex: 0,
          explanation: "Keka supports shadow resources for exactly this: tracked time without billing the client.",
        },
        {
          id: "pma-keka-psa-allocation-rate-cards-q6",
          prompt: "The client's project is in GBP but the rate card was imported in USD. What is the risk?",
          options: [
            "Rates and estimates will not line up with the project; Keka expects the rate card currency to match the project",
            "None: Keka ignores currency on rate cards",
            "Only the invoice header changes",
            "The client gets a discount automatically",
          ],
          correctIndex: 0,
          explanation: "Keka's estimation article lists matching rate card and project currency as a prerequisite.",
        },
        {
          id: "pma-keka-psa-allocation-rate-cards-q7",
          prompt: "How can rate cards for many clients be loaded into Keka PSA at once?",
          options: ["Projects > Bulk Import > Import Client Rate Card, using Keka's Excel template", "Typing them into each invoice", "Emailing Keka support", "Through the timesheet screen"],
          correctIndex: 0,
          explanation: "Bulk Import includes an Import Client Rate Card option with a downloadable template.",
        },
        {
          id: "pma-keka-psa-allocation-rate-cards-q8",
          prompt: "The Acme CRM ended in June, but four people are still allocated to it in Keka. Why does it matter?",
          options: [
            "Their capacity looks used, utilisation and resource reports are wrong, and timesheets may still go to the old project",
            "It does not; ended projects are ignored",
            "Only the invoice numbering is affected",
            "Keka deletes ended allocations automatically",
          ],
          correctIndex: 0,
          explanation: "Set end dates on allocations and close them when work ends.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-psa-allocation-rate-cards-q9",
          prompt: "A T&M contract caps billable hours at 400. Which Keka setting helps you stay inside it?",
          options: ["The maximum billable hours for the project", "The leave policy", "The invoice number series", "The client code"],
          correctIndex: 0,
          explanation: "Keka PSA supports a maximum number of billable hours per project; still watch the trend weekly.",
        },
      ],
      practice: {
        kind: "sim",
        app: "keka-psa",
        prompt:
          "Before the Acme CRM (T&M, GBP contract) starts its second phase, review its Team tab and rate card mapping against the signed rate card: Senior Laravel £45/h, Laravel Developer £32/h, QA Engineer £25/h. Flag every row with a problem, then answer the questions.",
        title: "Acme CRM — Team: Active Allocation",
        columns: ["Employee", "Role on rate card", "Rate", "Allocation", "Dates", "Type"],
        rows: [
          { id: "r1", cells: ["Ravi (senior)", "Senior Laravel", "£45/h", "60%", "1 Nov - 31 Jan", "Hard"], issue: null },
          { id: "r2", cells: ["Arjun (mid)", "Senior Laravel", "£45/h", "100%", "1 Nov - 31 Jan", "Hard"], issue: "Mid-level developer mapped to the senior role and rate" },
          { id: "r3", cells: ["Divya (QA)", "QA Engineer", "$25/h", "50%", "1 Nov - 31 Jan", "Hard"], issue: "Rate in USD on a GBP contract" },
          { id: "r4", cells: ["Karan (trainee)", "Laravel Developer", "£32/h", "50%", "1 Nov - 31 Jan", "Hard"], issue: "Trainee shadowing; not in the contract, should be a shadow resource" },
          { id: "r5", cells: ["Meera", "Laravel Developer", "£32/h", "40%", "1 Nov - 31 Jan", "Hard"], issue: null },
          { id: "r6", cells: ["Sana", "Laravel Developer", "£32/h", "50%", "1 Dec - 31 Jan", "Soft"], issue: null },
          { id: "r7", cells: ["Tom", "Laravel Developer", "£32/h", "20%", "1 Nov - 31 Jan", "Hard"], issue: null },
          { id: "r8", cells: ["Priya", "Laravel Developer", "£32/h", "40%", "1 Apr - (no end)", "Hard"], issue: "Allocation from the finished phase 1 with no end date" },
        ],
        questions: [
          {
            id: "q1",
            question: "Ravi is also 60% on another client's project. Is his allocation here a problem?",
            options: [
              "Yes: 60% here plus 60% elsewhere is 120%, over Keka's 100% total",
              "No: allocations on different clients are independent",
              "No: seniors can be allocated up to 150%",
            ],
            correctIndex: 0,
            explanation: "Totals across all projects must stay within 100%; re-plan one of the two.",
          },
          {
            id: "q2",
            question: "Sana is on a soft allocation from December. What does that mean?",
            options: [
              "She is pencilled in but not confirmed; confirm (hard) when phase 2 needs her",
              "She is billed at half rate",
              "She is on leave in December",
            ],
            correctIndex: 0,
            explanation: "Soft is tentative, hard is confirmed.",
          },
        ],
      },
      sop: [
        {
          title: "Our rate cards and allocation rules",
          prompt:
            "[Oyelabs SOP – admin to fill] Where the approved rate cards per client and role are kept, who may create or change a rate card in Keka, how a person's billing role is decided, when trainees are shadow resources, and who keeps allocations and end dates up to date.",
        },
      ],
    },
    {
      id: "pma-keka-psa-utilisation-reports",
      moduleId: "pma-keka",
      trackId: "pm",
      title: "Utilisation and project reports",
      summary:
        "Leadership looks at utilisation reports to answer two questions: are our people busy on the right work, and are our projects making money? A PM who can read the same reports spots problems first: a project where most hours are non-billable, a developer at 130%, or a team whose billable % fell after a client paused work.\n\nIn Keka PSA, go to Project > Analytics > Insights and scroll to Resource Insights. The Utilization Percentage report shows, for a chosen client, project and period, each resource's Actual Utilization (logged hours as a percentage of available hours) and Billable Utilization (billable hours as a percentage). The Utilization by Timeline reports show trends month on month, quarter on quarter or year on year, for the whole organisation (by billing entity) or a single project. Every chart has a table below and a download option. For milestone projects, the Milestone Info report under Analytics > Reports lists milestones with dates, estimated billing amounts and status.\n\nTwo facts matter when reading them. First, utilisation comes from timesheets: Keka calculates it from logged hours, and its troubleshooting advice for an empty report is to check that timesheets are submitted and approved and the filters are right. Unapproved timesheets mean wrong reports. Second, a number is a question, not an answer. A drop in billable % could be a paused client, rework on a fixed bid, or people logging client work to internal tasks.\n\nStep by step each month: run the project's utilisation for the period, check approved timesheets first, compare actual and billable utilisation per person with the plan, and look at the trend, not one month. Write down the cause of any big gap and the action. The common mistakes: reading 100%+ utilisation as success, comparing months with different holidays, and presenting a report to leadership before the late timesheets are approved. Targets and the reporting rhythm are in your team's SOP below.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "Keka Help: Tracking Resource Utilization Across Projects", url: "https://help.keka.com/hc/en-us/articles/39946725336337-Tracking-Resource-Utilization-Across-Projects", kind: "docs", verifiedAt: "2026-10-02T10:07:00Z" },
        { label: "Keka Help: Accessing the Milestone Info Report", url: "https://help.keka.com/hc/en-us/articles/39946779615889-Accessing-the-Milestone-Info-Report", kind: "docs", verifiedAt: "2026-10-02T09:38:59Z" },
        { label: "Keka: From Resource Planning to Billing with PSA Software", url: "https://www.keka.com/psa-software", kind: "article", verifiedAt: "2026-10-02T10:07:01Z" },
      ],
      video: {
        title: "Manage timesheets better (Part ll) l Keka HR",
        channel: "Keka HR",
        url: "https://www.youtube.com/watch?v=hHQLEvavmfM",
        videoId: "hHQLEvavmfM",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      alternateVideos: [
        {
          title: "Understanding Employee timesheets | Timesheets usage, Project Management, Billing & Invoices in Keka",
          channel: "Keka HR",
          url: "https://www.youtube.com/watch?v=Ote5na_Itb4",
          videoId: "Ote5na_Itb4",
          verifiedAt: "2026-10-02T09:35:56Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-keka-psa-utilisation-reports-q1",
          prompt: "Your project's utilisation report in Keka PSA shows almost nothing for last week. What do you check first?",
          options: [
            "Whether the team's timesheets were submitted and approved, and the client/project/date filters",
            "Whether the project has a rate card",
            "Whether the invoice was paid",
            "Whether people applied for leave",
          ],
          correctIndex: 0,
          explanation: "Keka builds utilisation from logged hours; its troubleshooting steps are approved timesheets and correct filters.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-psa-utilisation-reports-q2",
          prompt: "What is the difference between Actual Utilization and Billable Utilization in Keka's report?",
          options: [
            "Actual uses all logged hours against available hours; Billable uses only billable hours",
            "Actual is planned; Billable is logged",
            "They are the same number shown twice",
            "Actual is for employees; Billable is for clients",
          ],
          correctIndex: 0,
          explanation: "Both are ratios to available hours; billable counts only invoiceable time.",
        },
        {
          id: "pma-keka-psa-utilisation-reports-q3",
          prompt: "Where do you find resource utilisation reports in Keka PSA?",
          options: ["Project > Analytics > Insights > Resource Insights", "Me > Timesheet", "My Team > Leave", "Finances > Settings > Billing Entities"],
          correctIndex: 0,
          explanation: "The help article walks through Project, Analytics, the Insights tab and Resource Insights.",
        },
        {
          id: "pma-keka-psa-utilisation-reports-q4",
          prompt:
            "Your React project's billable utilisation fell from 85% to 55% in a month while actual utilisation stayed at 95%. Which explanations are worth checking? (Select all that apply.)",
          options: [
            "Non-billable rework or bug fixing on a fixed scope",
            "Client work logged against internal tasks by mistake",
            "Work done for a change request that has not been approved yet",
            "The team took more leave",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "People were just as busy, but less of it was billable. Leave would lower available hours and actual utilisation, not create this gap.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-psa-utilisation-reports-q5",
          prompt: "Why compare utilisation over several months (MoM or QoQ) rather than just this month?",
          options: [
            "One month can be skewed by holidays, a pause or late timesheets; the trend shows the real pattern",
            "Keka only shows quarters",
            "Monthly numbers are always wrong",
            "Clients ask for quarterly numbers only",
          ],
          correctIndex: 0,
          explanation: "Keka offers MoM, QoQ and YoY timelines precisely for spotting trends and fluctuations.",
        },
        {
          id: "pma-keka-psa-utilisation-reports-q6",
          prompt: "A developer shows 130% actual utilisation for two months. How should you read it?",
          options: [
            "A warning: sustained overtime or wrong timesheets; investigate and re-plan",
            "Excellent performance to report to leadership",
            "A Keka calculation bug",
            "Normal for seniors",
          ],
          correctIndex: 0,
          explanation: "Over 100% means more hours logged than available. It is a risk to people and quality, or a data problem.",
        },
        {
          id: "pma-keka-psa-utilisation-reports-q7",
          prompt: "Leadership's monthly review is tomorrow and three timesheets are still pending for your project. What should you do?",
          options: [
            "Chase and approve them before running the report, or note clearly that the numbers are incomplete",
            "Run the report anyway without comment",
            "Approve them all without checking",
            "Delete the pending timesheets",
          ],
          correctIndex: 0,
          explanation: "Reports are only as good as approved timesheets. Never present incomplete numbers as final.",
        },
        {
          id: "pma-keka-psa-utilisation-reports-q8",
          prompt: "Which report helps finance plan invoices on milestone projects?",
          options: ["Milestone Info, with estimated billing amounts and status", "Week Summary", "Utilization by Timeline (Organization)", "Past Due timesheets"],
          correctIndex: 0,
          explanation: "Milestone Info lists milestones with dates, estimated billing and status, and can be exported to Excel.",
        },
      ],
      practice: {
        kind: "sim",
        app: "keka-psa",
        prompt:
          "This is the October Utilization Percentage report for the Brightline React app (T&M). For this exercise, assume the planned allocation is shown, and a gap of more than 20 points between actual and billable utilisation needs an explanation. Flag the rows you would investigate, then answer the questions.",
        title: "Resource Insights — Brightline React app, October",
        columns: ["Resource", "Planned allocation", "Available h", "Actual util.", "Billable util.", "Timesheets"],
        rows: [
          { id: "r1", cells: ["Meera", "100%", "160", "95%", "90%", "Approved"], issue: null },
          { id: "r2", cells: ["Ravi", "50%", "80", "100%", "45%", "Approved"], issue: "55-point gap between actual and billable: find out what the non-billable work was" },
          { id: "r3", cells: ["Arjun", "100%", "128", "131%", "120%", "Approved"], issue: "Over 100% for the month: overtime or wrong hours" },
          { id: "r4", cells: ["Divya", "50%", "80", "0%", "0%", "2 weeks pending"], issue: "Pending timesheets: report is incomplete" },
          { id: "r5", cells: ["Sana", "25%", "40", "90%", "85%", "Approved"], issue: null },
          { id: "r6", cells: ["Tom", "100%", "160", "88%", "80%", "Approved"], issue: null },
          { id: "r7", cells: ["Karan", "Shadow", "160", "60%", "0%", "Approved"], issue: null },
          { id: "r8", cells: ["Priya", "100%", "152", "92%", "84%", "Approved"], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "Karan shows 60% actual and 0% billable. Is this a problem?",
            options: [
              "No: he is a shadow resource, so his hours are tracked but not billed",
              "Yes: every hour on a T&M project must be billable",
              "Yes: shadow resources should log 0 hours",
            ],
            correctIndex: 0,
            explanation: "Shadow resources are expected to show actual hours and zero billable.",
          },
          {
            id: "q2",
            question: "Should you send this report to leadership today?",
            options: [
              "Not as final: get Divya's pending timesheets approved first, or mark the numbers incomplete",
              "Yes, the pending weeks will not change much",
              "Yes, and remove Divya's row",
            ],
            correctIndex: 0,
            explanation: "Utilisation comes from approved timesheets; two missing weeks make the numbers wrong.",
          },
        ],
      },
      sop: [
        {
          title: "Our utilisation targets and reporting rhythm",
          prompt:
            "[Oyelabs SOP – admin to fill] Target actual and billable utilisation by role, which Keka PSA reports PMs must review and when (weekly or monthly), the deadline for approved timesheets before reports are run, and who receives them.",
        },
      ],
    },
    {
      id: "pma-keka-psa-invoices",
      moduleId: "pma-keka",
      trackId: "pm",
      title: "Invoice basics",
      summary:
        "Finance usually raises the invoices, but the PM decides whether they are right. The PM knows which hours were agreed, which milestone the client actually accepted, which change request was approved, and which week was spent fixing our own bug. An invoice the client disputes delays payment for weeks and damages trust, so a short PM check before it goes out is one of the most valuable things you do.\n\nIn Keka PSA, invoices come from project billing. On a T&M project they are built from approved billable hours and rate cards. On a Milestone project they are built from the milestone amounts. Invoices can carry line items, taxes and discounts, and can go through an approval process before release. You can raise one consolidated invoice for all billable items across several projects of the same client. Keka also supports Proforma invoices (a draft-like invoice that shows the expected amount and can later be converted to a tax invoice) and Prepayment invoices (to collect money upfront, which is adjusted in the final invoice). Credit notes correct over-billing or refunds and can be applied to future invoices.\n\nThe settings behind the invoice are set up per billing entity: invoice and credit note number series, payment terms (days until due), whether taxes and discounts apply per line or overall, rounding, and custom fields such as a client PO number. A PM does not usually change these, but should know why an invoice shows a certain due date or reference.\n\nStep by step before an invoice goes out: check the period, the hours per person against approved timesheets, the rates against the rate card, that non-billable and shadow time is excluded, that milestones were accepted, that approved change requests are included, and the currency, legal billing name and any PO number. The common mistake is assuming the system is always right. It is right only if timesheets, roles, rates and milestones were right. Who approves invoices, and our billing rules, are in your team's SOP below.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Keka Help: Billing and Invoicing in Keka PSA: An Overview", url: "https://help.keka.com/hc/en-us/articles/39946758976913-Billing-and-Invoicing-in-Keka-PSA-An-Overview", kind: "docs", verifiedAt: "2026-10-02T10:06:51Z" },
        { label: "Keka Help: Managing billing entities and invoice settings on Keka PSA", url: "https://help.keka.com/hc/en-us/articles/39946764793745-Managing-billing-entities-and-invoice-settings-on-Keka-PSA", kind: "docs", verifiedAt: "2026-10-02T10:07:31Z" },
        { label: "Keka Help: PSA: Proforma & Prepayment Invoices", url: "https://help.keka.com/hc/en-us/articles/39946837645073-PSA-Proforma-Prepayment-Invoices", kind: "docs", verifiedAt: "2026-10-02T10:07:28Z" },
        { label: "Keka Help: Streamlining Your Billing Process", url: "https://help.keka.com/hc/en-us/articles/39946725420305-Streamlining-Your-Billing-Process", kind: "docs", verifiedAt: "2026-10-02T09:38:34Z" },
      ],
      video: {
        title: "Understanding Employee timesheets | Timesheets usage, Project Management, Billing & Invoices in Keka",
        channel: "Keka HR",
        url: "https://www.youtube.com/watch?v=Ote5na_Itb4",
        videoId: "Ote5na_Itb4",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-keka-psa-invoices-q1",
          prompt: "On a T&M project in Keka PSA, what drives the invoice amount?",
          options: [
            "Approved billable hours multiplied by the rates on the rate card",
            "The project's planned allocation",
            "The milestone amounts",
            "The number of tasks completed",
          ],
          correctIndex: 0,
          explanation: "T&M bills actual approved billable time at the agreed rates, which is why timesheet and rate errors flow straight into invoices.",
        },
        {
          id: "pma-keka-psa-invoices-q2",
          prompt:
            "A new client must pay 20% before work starts on their Flutter app, and that amount should come off the final bill. Which Keka invoice type fits?",
          options: ["Prepayment invoice", "Proforma invoice", "Credit note", "Consolidated invoice"],
          correctIndex: 0,
          explanation: "Prepayment invoices collect money upfront, and Keka adjusts the amount in the final invoice.",
        },
        {
          id: "pma-keka-psa-invoices-q3",
          prompt: "The client's finance team wants to see the expected amount before you issue the real invoice. What can you send?",
          options: [
            "A Proforma invoice, which can later be converted into a tax invoice",
            "A credit note",
            "A prepayment invoice",
            "A screenshot of the timesheets",
          ],
          correctIndex: 0,
          explanation: "Keka describes the proforma as a draft-like invoice that simulates the amount and converts once the service is delivered.",
        },
        {
          id: "pma-keka-psa-invoices-q4",
          prompt: "Last month's invoice billed 12 hours that should have been non-billable. The client has already paid. What is the clean fix in Keka?",
          options: [
            "Issue a credit note and apply it to a future invoice (or refund), with a short explanation to the client",
            "Quietly bill 12 fewer hours next month",
            "Delete the paid invoice",
            "Do nothing, since it has been paid",
          ],
          correctIndex: 0,
          explanation: "Credit notes formally correct billing errors and can be applied to future invoices. Silent offsets confuse both sides' accounts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-psa-invoices-q5",
          prompt: "What should a PM check before a T&M invoice is released? (Select all that apply.)",
          options: [
            "Hours per person match approved timesheets for the period",
            "Rates match the client's rate card and roles",
            "Non-billable and shadow time is excluded, and approved change requests are included",
            "The invoice template's font",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "These are the facts only the PM can confirm. Template design is set once by finance.",
        },
        {
          id: "pma-keka-psa-invoices-q6",
          prompt: "Why does an invoice show \"Due in 30 days\" and an invoice number like INV-0142-OYE?",
          options: [
            "They come from the billing entity's payment terms and invoice number series settings",
            "Keka picks them at random",
            "The client sets them",
            "The PM types them on each invoice",
          ],
          correctIndex: 0,
          explanation: "Payment terms and number series are configured per billing entity in invoice settings.",
        },
        {
          id: "pma-keka-psa-invoices-q7",
          prompt:
            "Acme has three projects with you this month. Their finance team asks for one invoice. Can Keka do this?",
          options: [
            "Yes: a single consolidated invoice for all billable items across projects of the same client",
            "No: one invoice per project only",
            "Only if the projects use different currencies",
            "Only for milestone projects",
          ],
          correctIndex: 0,
          explanation: "Keka's billing overview lists consolidated invoices across multiple projects under one client.",
        },
        {
          id: "pma-keka-psa-invoices-q8",
          prompt:
            "The invoice for a fixed-bid project includes the \"Beta\" milestone, but the client's UAT of the beta is still open. What should you do?",
          options: [
            "Hold that line until the client accepts the milestone, and tell finance why",
            "Send it; the client can dispute it if they want",
            "Split the milestone in half and bill 50%",
            "Convert the project to T&M",
          ],
          correctIndex: 0,
          explanation: "Milestones are billed on acceptance. Billing early invites a dispute and delays payment for everything else on the invoice.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-keka-psa-invoices-q9",
          prompt: "A US client requires their purchase order (PO) number on every invoice or they will not pay. How can Keka support this?",
          options: [
            "An invoice custom field (for example \"Client PO\"), which can be marked mandatory",
            "Putting the PO in the client name",
            "It cannot; send the PO in a separate email",
            "Using the PO as the invoice number",
          ],
          correctIndex: 0,
          explanation: "Invoice custom fields can be added in finance settings and marked mandatory, so the PO is never forgotten.",
        },
        {
          id: "pma-keka-psa-invoices-q10",
          prompt: "Why is \"Keka generated it, so it must be right\" a dangerous assumption?",
          options: [
            "The invoice is only as right as the timesheets, roles, rates and milestone statuses behind it",
            "Keka often miscalculates totals",
            "Invoices are always manual in Keka",
            "Clients cannot read Keka invoices",
          ],
          correctIndex: 0,
          explanation: "Keka automates the maths. The PM checks the inputs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "sim",
        app: "keka-psa",
        prompt:
          "Finance has drafted the October invoice for Acme Retail Ltd (Acme CRM, T&M, GBP). The agreed rate card is Senior Laravel £45/h, Laravel Developer £32/h, QA Engineer £25/h. Approved October timesheets: Ravi 120 h, Meera 96 h, Divya 60 h. Karan is a shadow resource. A change request for an admin report (£2,400 fixed) was approved and delivered in October. Flag every line that is wrong, then answer the questions.",
        title: "Draft invoice — Acme Retail Ltd, October",
        columns: ["Line", "Description", "Qty", "Rate", "Amount"],
        rows: [
          { id: "l1", cells: ["1", "Ravi - Senior Laravel", "120 h", "£45", "£5,400"], issue: null },
          { id: "l2", cells: ["2", "Meera - Laravel Developer", "104 h", "£32", "£3,328"], issue: "104 h billed but only 96 h approved" },
          { id: "l3", cells: ["3", "Divya - QA Engineer", "60 h", "£25", "£1,500"], issue: null },
          { id: "l4", cells: ["4", "Karan - Laravel Developer", "40 h", "£32", "£1,280"], issue: "Shadow resource billed to the client" },
          { id: "l5", cells: ["5", "Payment terms", "-", "-", "Due in 30 days"], issue: null },
          { id: "l6", cells: ["6", "Billing name", "-", "-", "Acme Retail Ltd"], issue: null },
          { id: "l7", cells: ["7", "Currency", "-", "-", "GBP"], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "What is missing from the draft?",
            options: [
              "The approved £2,400 admin report change request",
              "A line for Karan's training hours",
              "Nothing is missing",
            ],
            correctIndex: 0,
            explanation: "Approved and delivered change requests must be invoiced; Keka will not add a fixed CR by itself unless it was set up as a billable item.",
          },
          {
            id: "q2",
            question: "After your corrections, what should the hours lines total? (Ravi 120 h × £45, Meera 96 h × £32, Divya 60 h × £25.)",
            options: ["£9,972", "£10,228", "£11,508"],
            correctIndex: 0,
            explanation: "£5,400 + £3,072 + £1,500 = £9,972. With the £2,400 change request, the invoice is £12,372 before any tax.",
          },
          {
            id: "q3",
            question: "Who should fix Meera's hours, and where?",
            options: [
              "Correct the invoice to the 96 approved hours; if she really worked 104, her timesheet must be corrected and approved first",
              "Leave 104 h; the client will not check",
              "Bill 100 h as a compromise",
            ],
            correctIndex: 0,
            explanation: "Invoices must match approved timesheets. Fix the source, not the invoice by guesswork.",
          },
        ],
      },
      sop: [
        {
          title: "Our invoicing and billing approval process",
          prompt:
            "[Oyelabs SOP – admin to fill] Who drafts invoices in Keka PSA, the PM's review checklist and deadline, who approves release, invoice timing per contract type, how change requests and credit notes are handled, and the rules for client PO numbers and payment terms.",
        },
      ],
    },
  ],
} satisfies Module;
