import type { Module } from "@/types/curriculum";

export default {
  id: "pma-resource",
  trackId: "pm",
  name: "Agency resource management",
  description:
    "How an agency PM plans people across several client projects: capacity, allocation and utilisation, billable %, the bench and skill matrix, over- and under-allocation, leave and holidays, forecasting from the BD pipeline, the weekly resource meeting, and keeping the plan in Excel and Keka PSA.",
  refs: [
    { label: "Float: Capacity planning and resource scheduling", url: "https://support.float.com/en/articles/13847946-capacity-planning-and-resource-scheduling", kind: "docs", verifiedAt: "2026-10-02T09:35:36Z" },
    { label: "Float: Float Resource Management Guides", url: "https://www.float.com:443/guides", kind: "article", verifiedAt: "2026-10-02T09:35:41Z" },
  ],
  topics: [
    {
      id: "pma-capacity-allocation-utilisation",
      moduleId: "pma-resource",
      trackId: "pm",
      title: "Capacity vs allocation vs utilisation; billable %",
      summary:
        "An agency sells people's time. If developers spend the month on internal work, rework nobody can bill, or waiting for a client's API keys, the agency pays their salaries and earns nothing for those hours. That is why leadership watches utilisation and billable % so closely, and why a PM needs to understand the numbers behind them.\n\nThree words get mixed up all the time. **Capacity** is the hours a person can work in a period, after leave and holidays: 8 hours a day for 20 working days is 160 hours. **Allocation** is the hours you have planned or booked for them on projects. It is a plan. **Utilisation** is the hours they actually logged, divided by capacity. It is what happened. **Billable utilisation** (billable %) counts only the hours you can invoice, divided by capacity. A developer can be 100% allocated and 70% billable if a third of the work turned out to be non-billable fixes.\n\nStep by step each month: take capacity per person from the calendar and leave. Compare it with allocation, to spot people with too much or too little planned. Then, after timesheets are approved, compare logged hours with capacity, and billable hours with capacity. A gap between allocation and billable hours is a question to ask: unplanned support, a blocked project, or estimates that were too low.\n\nThe common mistakes: planning people at 100%, which leaves no room for meetings, code review or a client's urgent bug, so every plan slips. Reading high utilisation as good news, when it can mean burnout. And forgetting that a non-billable hour on a fixed-bid project is still a cost. Industry guides such as the Productive articles discuss typical targets. Your team's actual targets are in the SOP below.",
      level: "beginner",
      estMinutes: 40,
      webRefs: [
        { label: "Float: Capacity planning and resource scheduling", url: "https://support.float.com/en/articles/13847946-capacity-planning-and-resource-scheduling", kind: "docs", verifiedAt: "2026-10-02T09:35:36Z" },
        { label: "Productive: Billable Utilization Mastery: Enhancing Profitability in Services", url: "https://productive.io/blog/billable-utilization/", kind: "article", verifiedAt: "2026-10-02T09:35:23Z" },
        { label: "Productive: Agency Utilization Rate: The Most Important Metric For Your Business", url: "https://productive.io/blog/agency-utilization-rate-the-most-important-metric-for-your-business/", kind: "article", verifiedAt: "2026-10-02T09:35:27Z" },
        { label: "Resource Guru: What project managers need to know about resource utilization", url: "https://resourceguruapp.com/blog/resource-management/resource-utilization", kind: "article", verifiedAt: "2026-10-02T09:35:33Z" },
      ],
      video: {
        title: "Agency Utilization Rate: The Most Important Metric For Your Business",
        channel: "Productive",
        url: "https://www.youtube.com/watch?v=q9Xuzj1XMnY",
        videoId: "q9Xuzj1XMnY",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      alternateVideos: [
        {
          title: "Billable Utilization: A Key Professional Services KPI",
          channel: "BigTime Software",
          url: "https://www.youtube.com/watch?v=XwChdn8xx5o",
          videoId: "XwChdn8xx5o",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
        {
          title: "Utilization Rate Explained for Professional Services (Formula, Mistakes, and What It Misses)",
          channel: "Haile Solutions",
          url: "https://www.youtube.com/watch?v=gmAsCmOMC9o",
          videoId: "gmAsCmOMC9o",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-capacity-allocation-utilisation-q1",
          prompt:
            "Meera has 160 h of capacity this month. She logged 150 h: 105 h billable on the client app and 45 h non-billable rework and internal meetings. What are her utilisation and billable %?",
          options: ["About 94% utilisation, about 66% billable", "100% utilisation, 100% billable", "About 66% utilisation, about 94% billable", "150% utilisation, 105% billable"],
          correctIndex: 0,
          explanation: "Utilisation is 150 / 160 = 93.75%. Billable % counts only invoiceable hours: 105 / 160 = 65.6%.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-capacity-allocation-utilisation-q2",
          prompt: "Which statement correctly separates the three terms?",
          options: [
            "Capacity is hours available; allocation is hours planned; utilisation is hours actually logged against capacity",
            "Capacity is hours planned; allocation is hours logged; utilisation is hours billed",
            "All three mean the same thing in an agency",
            "Utilisation is the plan; allocation is what happened",
          ],
          correctIndex: 0,
          explanation: "Allocation is a forecast; utilisation is history from timesheets. Both are measured against capacity.",
        },
        {
          id: "pma-capacity-allocation-utilisation-q3",
          prompt: "Arjun is on leave for 4 of the 20 working days this month (8 h days). What is his capacity?",
          options: ["128 h", "160 h", "120 h", "136 h"],
          correctIndex: 0,
          explanation: "16 working days × 8 h = 128 h. Using 160 h would make his utilisation look artificially low.",
        },
        {
          id: "pma-capacity-allocation-utilisation-q4",
          prompt: "Why is planning developers at 100% allocation a bad idea? (Select all that apply.)",
          options: [
            "Meetings, code review and support always take some time",
            "A client's urgent production bug has nowhere to go",
            "Every small overrun pushes the next task, so plans slip",
            "Keka will not let you save 100%",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Leaving headroom absorbs the work nobody plans for. Keka PSA does allow allocations up to 100%; the problem is practical, not technical.",
        },
        {
          id: "pma-capacity-allocation-utilisation-q5",
          prompt:
            "Ravi is 100% allocated to a Laravel project but only 60% billable this month. Which explanations should you check?",
          options: [
            "Non-billable rework, a blocked project waiting on the client, or hours logged against the wrong (non-billable) task",
            "Ravi works slowly",
            "Billable % is always lower than allocation, so nothing to check",
            "The allocation percentage is wrong in Excel",
          ],
          correctIndex: 0,
          explanation:
            "A gap between allocation and billable hours has a cause you can find in timesheets and the project log. It is not a judgement on the person.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-capacity-allocation-utilisation-q6",
          prompt: "A team shows 110% utilisation for three months in a row. What does this most likely mean?",
          options: [
            "People are regularly working overtime: a burnout and quality risk to raise",
            "The team is very efficient and needs no action",
            "Timesheets are always wrong above 100%",
            "Capacity was set too low, so nothing has happened",
          ],
          correctIndex: 0,
          explanation:
            "Over 100% means more hours logged than available. Sustained, it leads to mistakes and attrition. Check capacity data too, but do not assume it away.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "October numbers for the Brightline React app team are below (Arjun had 4 days of leave). Calculate the team's capacity, total utilisation, billable % and Arjun's billable %.",
        table: {
          columns: ["Person", "Capacity (h)", "Billable logged (h)", "Non-billable logged (h)"],
          rows: [
            ["Ravi", "160", "136", "16"],
            ["Meera", "160", "120", "30"],
            ["Arjun", "128", "64", "40"],
            ["Divya", "160", "150", "6"],
          ],
        },
        fields: [
          { id: "capacity", label: "Team capacity", unit: "h", answer: 608, tolerance: 0.5, expression: "T[0][1]+T[1][1]+T[2][1]+T[3][1]" },
          {
            id: "utilisation",
            label: "Team utilisation (all logged hours / capacity)",
            unit: "%",
            answer: 92.43,
            tolerance: 0.1,
            expression: "(T[0][2]+T[0][3]+T[1][2]+T[1][3]+T[2][2]+T[2][3]+T[3][2]+T[3][3])/(T[0][1]+T[1][1]+T[2][1]+T[3][1])*100",
          },
          {
            id: "billable",
            label: "Team billable % (billable hours / capacity)",
            unit: "%",
            answer: 77.3,
            tolerance: 0.1,
            expression: "(T[0][2]+T[1][2]+T[2][2]+T[3][2])/(T[0][1]+T[1][1]+T[2][1]+T[3][1])*100",
          },
          { id: "arjun", label: "Arjun's billable %", unit: "%", answer: 50, tolerance: 0.1, expression: "T[2][2]/T[2][1]*100" },
        ],
        explanation:
          "Capacity is 608 h. The team logged 562 h (92.4% utilisation) but only 470 h were billable (77.3%). The busy-looking team is losing almost 100 hours to non-billable work. Arjun is the outlier: 40 of his 104 hours were non-billable, so his billable % is 50%. That is a question for the weekly resource meeting (was he fixing bugs on a fixed bid, or covering internal work?), not a judgement on Arjun.",
      },
      sop: [
        {
          title: "Our utilisation targets and capacity hours",
          prompt:
            "[Oyelabs SOP – admin to fill] Standard capacity hours per day and week, target total utilisation and target billable % by role, how leave and holidays reduce capacity, and who reviews the numbers each month.",
        },
      ],
    },
    {
      id: "pma-bench-skill-matrix",
      moduleId: "pma-resource",
      trackId: "pm",
      title: "Bench and skill matrix",
      summary:
        "\"The bench\" is the people who are not allocated to billable work right now. Someone rolls off a finished Flutter project, a client pauses a React build, or a new hire is still ramping up. Bench time is a cost to the agency, so leadership wants it short. But a small bench is also what lets you say yes when a client needs an extra developer next Monday.\n\nA skill matrix tells you who can do what. List people in rows and skills in columns (Laravel, React, React Native, Flutter, AWS, QA automation), and rate each from 1 to 5. Agree what the levels mean: 1 = has done a tutorial, 3 = can deliver on a client project without help, 5 = can lead and review others. Add current allocation, so you can see at a glance who is free and what they can do.\n\nStep by step when a new need comes in, for example a US client who wants a React developer for six weeks: filter the matrix for React at level 3 or more, then for people with free capacity. If nobody fits, look for a level 2 who could pair with a senior, or plan training for a bench person. Use bench time on purpose: internal tools, upskilling on the stack the pipeline needs, or helping a project that is behind.\n\nThe common mistakes: a matrix that is never updated, so it still says someone is a Flutter beginner after two Flutter projects. Ratings that are self-scored with no shared definition, so one person's 4 is another's 2. And putting a weak fit on a client project just to clear the bench, which saves cost this week and loses the client's trust next month.",
      level: "beginner",
      estMinutes: 40,
      webRefs: [
        { label: "Float: Capacity planning and resource scheduling", url: "https://support.float.com/en/articles/13847946-capacity-planning-and-resource-scheduling", kind: "docs", verifiedAt: "2026-10-02T09:35:36Z" },
        { label: "Productive: Resource Management in 2026", url: "https://productive.io/blog/resource-management/", kind: "article", verifiedAt: "2026-10-02T09:35:24Z" },
        { label: "Asana: Free Staffing Plan Template to Grow Your Workforce", url: "https://asana.com/templates/staffing-plan", kind: "article", verifiedAt: "2026-10-02T10:07:38Z" },
        { label: "Asana: Resource Management Template for Balancing Team Workload", url: "https://asana.com/templates/resource-management", kind: "article", verifiedAt: "2026-10-02T10:07:43Z" },
      ],
      video: {
        title: "Create Skill Matrix in Excel |How to Make Skill Matrix in MS Excel",
        channel: "NIZAZUPIN",
        url: "https://www.youtube.com/watch?v=AYzWUU2O0sI",
        videoId: "AYzWUU2O0sI",
        verifiedAt: "2026-10-02T09:35:53Z",
      },
      alternateVideos: [
        {
          title: "What \"Bench\" Actually Means in Indian IT (Nobody Explains This Before You Join)",
          channel: "Offer Letter",
          url: "https://www.youtube.com/watch?v=EEagsUBvN2g",
          videoId: "EEagsUBvN2g",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-bench-skill-matrix-q1",
          prompt: "What does it mean when a developer is \"on the bench\"?",
          options: [
            "They are not currently allocated to billable project work",
            "They are on leave",
            "They are being let go",
            "They only do code review",
          ],
          correctIndex: 0,
          explanation: "Bench means unallocated or non-billable time. It is a normal state between projects, not a performance label.",
        },
        {
          id: "pma-bench-skill-matrix-q2",
          prompt:
            "A US client needs a React developer from Monday. The only free person is Karan: Laravel 4, React 1. What is the best move?",
          options: [
            "Look for a React 3+ person you can free up, or pair Karan with a senior, and tell the client honestly what you can offer",
            "Put Karan on it alone to clear the bench",
            "Tell the client nobody is available, without looking further",
            "Put Karan on it and bill him as a senior",
          ],
          correctIndex: 0,
          explanation:
            "Placing a weak fit to clear the bench trades a small cost saving for client trust. Re-shuffling or pairing, with an honest offer, protects both.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-bench-skill-matrix-q3",
          prompt: "Which make a skill matrix reliable? (Select all that apply.)",
          options: [
            "A shared definition of each level, such as 3 = delivers on a client project without help",
            "Updating it after each project",
            "Including current allocation next to the skills",
            "Letting each person score themselves with no definitions",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Shared definitions and regular updates make ratings comparable; allocation makes the matrix usable for staffing.",
        },
        {
          id: "pma-bench-skill-matrix-q4",
          prompt: "Two people are on the bench for three weeks, and the BD pipeline shows two likely Flutter projects next month. What is a good use of their time?",
          options: [
            "Flutter upskilling with a small internal build, reviewed by a senior Flutter developer",
            "Nothing until the projects are signed",
            "Logging the bench time as billable to a current project",
            "Asking them to apply for leave",
          ],
          correctIndex: 0,
          explanation:
            "Bench time used on the skills the pipeline needs shortens the next ramp-up. Logging it as billable to a client would be dishonest billing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-bench-skill-matrix-q5",
          prompt: "Why does an agency keep a small bench on purpose?",
          options: [
            "So it can respond quickly when a client needs extra help or a new project starts",
            "Because bench time is billable",
            "To keep utilisation at 100%",
            "Because clients pay for the bench",
          ],
          correctIndex: 0,
          explanation: "A little spare capacity is what makes fast yeses possible. Too much is a cost; none means every new request waits.",
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "This skill matrix rates each person from 1 to 5 and shows their current allocation. Fill H2:H6: the number of people on the bench (0% allocated), the number who are 50% or less allocated AND have React level 3 or more (use COUNTIFS), Karan's Flutter level (XLOOKUP), the team's average React level, and the free hours per week across the team (each person works 40 h; free hours = (100% - allocation) × 40, summed).",
        grid: [
          ["Person", "Allocated %", "Laravel", "React", "Flutter", "", "Question", "Answer"],
          ["Ravi", "100", "4", "2", "1", "", "People on the bench (0%)", ""],
          ["Meera", "40", "2", "4", "3", "", "Free (50% or less) with React 3+", ""],
          ["Arjun", "0", "3", "3", "1", "", "Karan's Flutter level", ""],
          ["Divya", "100", "1", "5", "2", "", "Average React level", ""],
          ["Karan", "20", "4", "1", "4", "", "Free hours per week", ""],
          ["Sana", "0", "2", "4", "2", "", "", ""],
          ["Tom", "60", "3", "3", "3", "", "", ""],
        ],
        editable: ["H2", "H3", "H4", "H5", "H6"],
        checks: [
          { cell: "H2", expected: 2, tolerance: 0.01, requireFormula: true, functions: ["COUNTIF"] },
          { cell: "H3", expected: 3, tolerance: 0.01, requireFormula: true, functions: ["COUNTIFS"] },
          { cell: "H4", expected: 4, tolerance: 0.01, requireFormula: true, functions: ["XLOOKUP"] },
          { cell: "H5", expected: 3.14, tolerance: 0.01, requireFormula: true, functions: ["AVERAGE"] },
          { cell: "H6", expected: 152, tolerance: 0.01, requireFormula: true, functions: [] },
        ],
        solution: {
          H2: "=COUNTIF(B2:B8,0)",
          H3: '=COUNTIFS(B2:B8,"<=50",D2:D8,">=3")',
          H4: '=XLOOKUP("Karan",A2:A8,E2:E8)',
          H5: "=AVERAGE(D2:D8)",
          H6: "=(7*100-SUM(B2:B8))/100*40",
        },
        explanation:
          "Arjun and Sana are on the bench. Meera (40%, React 4), Arjun (0%, React 3) and Sana (0%, React 4) are free enough for a React request; Karan is free but only React 1. Free hours are 380% of a person, or 152 h a week, which is almost four full-time people. But only some of those hours match the skills the pipeline needs, which is the point of keeping skills and allocation side by side.",
      },
    },
    {
      id: "pma-multi-project-over-under-allocation",
      moduleId: "pma-resource",
      trackId: "pm",
      title: "Multi-project allocation; over/under-allocation",
      summary:
        "In an agency, few people work on one project. A senior Laravel developer might give 60% to a UK client's CRM, 20% to support on a live app, and 20% to estimating a new deal. That is normal, but it means one person's week is decided by three PMs, and nobody sees the whole picture unless someone puts it in one place.\n\n**Over-allocation** is planning more hours than a person has: 24 h on one project plus 20 h on another, for someone with 40 h. Something will slip, usually the project whose PM shouts least. **Under-allocation** is the opposite: someone with 15 planned hours in a 40-hour week, which is cost the agency carries. Both are easy to see if you add up each person's hours across all projects and compare with capacity.\n\nStep by step each week: list each person, their capacity after leave, and their hours on every project. Total per person. Flag anyone over 100% and anyone well under (for example below 70%). For each over-allocation, decide what moves: a task to a later week, a task to someone with the right skills and free time, or a conversation with the client about the date. Remember skills: a React developer cannot take a Laravel backend task just because they are free.\n\nThe common mistakes: splitting one person across too many projects, which costs time every time they switch context. Keeping two PMs' plans in separate sheets, so each looks fine but the person is at 140%. And fixing over-allocation silently by having people work evenings, which works once and then becomes the plan. Over-allocation should be fixed in the plan, in the open.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Keka Help: Tailoring Resource Allocation", url: "https://help.keka.com/hc/en-us/articles/39946575810321-Tailoring-Resource-Allocation", kind: "docs", verifiedAt: "2026-10-02T09:38:31Z" },
        { label: "Float: How to Stop Resource Overallocation in Its Tracks", url: "https://www.float.com/resources/overallocation-of-resources", kind: "article", verifiedAt: "2026-10-02T09:35:42Z" },
        { label: "ProjectManager: What Is Resource Allocation in Project Management?", url: "https://www.projectmanager.com/blog/resource-allocation", kind: "article", verifiedAt: "2026-10-02T09:39:01Z" },
        { label: "Asana: What Is Resource Allocation? Here's How to Allocate Resources", url: "https://asana.com/resources/resource-allocation", kind: "article", verifiedAt: "2026-10-02T09:38:32Z" },
      ],
      video: {
        title: "Resource Management: How to Manage Resources - Project Management Training",
        channel: "ProjectManager",
        url: "https://www.youtube.com/watch?v=CxapGqlh3Fg",
        videoId: "CxapGqlh3Fg",
        verifiedAt: "2026-10-02T09:35:57Z",
      },
      alternateVideos: [
        {
          title: "Must-Know Tips for Resource Allocation in Project Management",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=N_UbPsGrOUI",
          videoId: "N_UbPsGrOUI",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-multi-project-over-under-allocation-q1",
          prompt:
            "PM A plans Ravi for 24 h on the Acme CRM. PM B plans him for 20 h on the Brightline API. Ravi has 40 h. Each PM's own sheet looks fine. What is the real problem?",
          options: [
            "Ravi is over-allocated at 44 h (110%), and nobody sees it because the plans are separate",
            "Nothing: each project is under 40 h",
            "Ravi is under-allocated",
            "Only a problem if Ravi complains",
          ],
          correctIndex: 0,
          explanation:
            "Over-allocation is only visible when you add a person's hours across all projects. One shared resource plan is the fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-multi-project-over-under-allocation-q2",
          prompt: "Which are reasonable fixes for an over-allocated developer? (Select all that apply.)",
          options: [
            "Move a lower-priority task to next week",
            "Give a task to someone with the right skills and free capacity",
            "Agree a revised date with the client for one deliverable",
            "Ask the developer to work evenings every week until it is done",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Over-allocation is fixed by changing the plan: time, people or scope. Planned overtime hides the problem and burns people out.",
        },
        {
          id: "pma-multi-project-over-under-allocation-q3",
          prompt: "Meera (React only) has 20 free hours. The Laravel CRM is short by 20 hours. Should you allocate her to it?",
          options: [
            "No. Free hours only help if the skills match; look for a Laravel developer or move React work to free one up",
            "Yes, hours are hours",
            "Yes, but only for 10 hours",
            "Yes, and bill her at the Laravel rate",
          ],
          correctIndex: 0,
          explanation: "Allocation must match skills. A mismatch shows up later as slow delivery and rework.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-multi-project-over-under-allocation-q4",
          prompt: "Why is splitting a developer across five projects at 20% each a problem even if the total is 100%?",
          options: [
            "Switching between projects costs time and focus, so real output is lower than the plan",
            "Keka does not allow more than three projects",
            "It is only a problem for juniors",
            "Clients are billed less",
          ],
          correctIndex: 0,
          explanation: "Each switch has a cost: re-reading context, meetings for every project. Fewer, larger allocations deliver more.",
        },
        {
          id: "pma-multi-project-over-under-allocation-q5",
          prompt: "Arjun is planned for 15 h this week out of 40. What should you do?",
          options: [
            "Treat it as under-allocation: find useful billable or planned internal work, and check whether a project is blocked",
            "Nothing, he is free for emergencies",
            "Mark him as on leave",
            "Increase his estimates so the hours look full",
          ],
          correctIndex: 0,
          explanation: "Under-allocation is a cost and often a symptom, such as a project waiting on the client. Inflating estimates is dishonest.",
        },
        {
          id: "pma-multi-project-over-under-allocation-q6",
          prompt: "In Keka PSA, can you allocate the same employee to several projects?",
          options: [
            "Yes, at any percentage, as long as their total allocation does not go over 100%",
            "No, one employee per project",
            "Yes, but only in whole 25% steps",
            "Only if they are on the bench",
          ],
          correctIndex: 0,
          explanation: "Keka's help article says allocations can be any value from 0 to 100% and across several projects, with the total kept within 100%.",
        },
        {
          id: "pma-multi-project-over-under-allocation-q7",
          prompt:
            "Divya is 100% allocated for the next four weeks, but she has approved leave in week 3. What is wrong with the plan?",
          options: [
            "Her week-3 capacity is lower, so a flat 100% allocation over-allocates her that week",
            "Nothing, allocation percentages ignore leave",
            "Leave should be logged as billable",
            "She should cancel the leave",
          ],
          correctIndex: 0,
          explanation: "Allocation must be checked against capacity per week. Leave lowers capacity; the plan must move work, not the leave.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-multi-project-over-under-allocation-q8",
          prompt: "Which single view best prevents hidden over-allocation across projects?",
          options: [
            "One resource plan with every person, every project and weekly totals against capacity",
            "Each PM's own project plan",
            "The monthly invoice",
            "The team's Teams chat",
          ],
          correctIndex: 0,
          explanation: "Only a combined view shows a person's full week. That is what the weekly resource meeting reviews.",
        },
      ],
      practice: {
        kind: "allocate",
        prompt:
          "Plan next week's hours across three projects. Ravi only does Laravel, Meera only does React, and Divya only does QA. Arjun is full-stack. Cover each project's need without over-allocating anyone.",
        people: [
          { id: "ravi", name: "Ravi", capacity: 40, note: "Laravel only" },
          { id: "meera", name: "Meera", capacity: 40, note: "React only" },
          { id: "arjun", name: "Arjun", capacity: 40, note: "Full-stack: Laravel and React" },
          { id: "divya", name: "Divya", capacity: 32, note: "QA only; 4-day week" },
        ],
        projects: [
          { id: "acme", name: "Acme Laravel CRM (UK)", need: 50 },
          { id: "bright", name: "Brightline React app (AU)", need: 45 },
          { id: "qa", name: "Northwind release QA (US)", need: 30 },
        ],
        slack: 0.1,
        blocked: [
          { person: "ravi", project: "bright" },
          { person: "ravi", project: "qa" },
          { person: "meera", project: "acme" },
          { person: "meera", project: "qa" },
          { person: "divya", project: "acme" },
          { person: "divya", project: "bright" },
        ],
        explanation:
          "One plan that works: Ravi 40 h and Arjun 10 h on Acme (50), Meera 40 h and Arjun 5 h on Brightline (45), Divya 30 h on QA. Arjun is the only person who can fill both gaps, so he is your flexible capacity. Note he still has 25 h free: that is your buffer for the urgent bug that will arrive on Wednesday.",
      },
    },
    {
      id: "pma-leave-holiday-planning",
      moduleId: "pma-resource",
      trackId: "pm",
      title: "Leave and holiday planning",
      summary:
        "Leave is the most predictable risk in a delivery plan, and the one most often ignored. Everybody knows Diwali, Christmas and summer holidays are coming. Yet sprint plans are still drawn as if every developer works every day, and the release slips by a week \"unexpectedly\".\n\nPlanning for leave has three layers. Office holidays: the public holidays your team observes, which differ from your client's. Approved personal leave: from your leave system, such as Keka. Client holidays: a US client's Thanksgiving or an Australian client's Christmas-to-January break, when nobody will review UAT or answer questions. Each one reduces capacity differently. Your holidays reduce build capacity. Client holidays slow approvals and feedback.\n\nStep by step for a sprint or release: start from working days in the period, subtract office holidays, then work out each person's available days after approved leave. Multiply by realistic focus hours per day (not 8; meetings and reviews take time), and by their share on this project if they are split. Compare the total with the hours in the plan. If there is a gap, move scope, move the date, or add a person, and tell the client before the sprint starts, not at the demo.\n\nThe common mistakes: forgetting leave for split people (\"Divya is only 50% on our project, so her leave does not matter\" — it does, it halves her already-small share). Approving leave without checking the release calendar. And the key-person risk: if only one developer knows the payment integration and she is away during the release week, that is a plan problem, not a leave problem. How much notice leave needs, and how PMs are consulted, is in your team's SOP below.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Float: Capacity planning and resource scheduling", url: "https://support.float.com/en/articles/13847946-capacity-planning-and-resource-scheduling", kind: "docs", verifiedAt: "2026-10-02T09:35:36Z" },
        { label: "Microsoft Support: NETWORKDAYS.INTL function", url: "https://support.microsoft.com/en-us/excel/functions/networkdays-intl-function", kind: "docs", verifiedAt: "2026-10-02T09:35:24Z" },
        { label: "Keka Help: Managing and tracking your attendance logs and requests", url: "https://help.keka.com/hc/en-us/articles/39946840685969-Managing-and-tracking-your-attendance-logs-and-requests", kind: "docs", verifiedAt: "2026-10-02T09:38:44Z" },
      ],
      video: {
        title: "How to Calculate Working Days in Excel & Exclude ANY Days you WANT (weekends too)",
        channel: "Leila Gharani",
        url: "https://www.youtube.com/watch?v=Wyoo9mQPxCY",
        videoId: "Wyoo9mQPxCY",
        verifiedAt: "2026-10-02T09:35:55Z",
      },
      alternateVideos: [
        {
          title: "How to easily create Leave tracking in Excel",
          channel: "NETVN82",
          url: "https://www.youtube.com/watch?v=Xnywyy_Tb9M",
          videoId: "Xnywyy_Tb9M",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-leave-holiday-planning-q1",
          prompt:
            "Your two-week sprint has 10 working days and 1 office holiday. Meera takes 2 days of leave. With 6 focus hours a day, how many hours does she have for the sprint?",
          options: ["42 h", "48 h", "60 h", "54 h"],
          correctIndex: 0,
          explanation: "10 - 1 holiday - 2 leave = 7 days × 6 h = 42 h. Using 8 h days or ignoring the holiday overstates her capacity.",
        },
        {
          id: "pma-leave-holiday-planning-q2",
          prompt: "Which of these reduce your team's build capacity? (Select all that apply.)",
          options: [
            "Your office's public holidays",
            "Your developers' approved leave",
            "A developer's half-day for a medical appointment",
            "The client's Thanksgiving holiday",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Your holidays and leave reduce build hours. Client holidays mostly delay reviews, approvals and UAT, so plan those phases around them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-leave-holiday-planning-q3",
          prompt: "Why plan with focus hours (for example 6 h) rather than 8 h per day?",
          options: [
            "Meetings, code review, stand-ups and support take part of every day",
            "Developers only work 6 hours",
            "Keka only records 6 hours",
            "Clients pay for 6 hours a day",
          ],
          correctIndex: 0,
          explanation: "Planning every hour as task time guarantees slippage. The exact focus figure should come from your own team's history.",
        },
        {
          id: "pma-leave-holiday-planning-q4",
          prompt:
            "Divya is 50% on your project. She has 4 days of leave in your sprint. A teammate says \"she's only half on our project, so it doesn't matter\". What is the effect?",
          options: [
            "Her project hours drop by half of 4 days: still a real cut to an already-small share",
            "No effect: split people's leave only affects their other project",
            "Her hours drop by 4 full days",
            "Her allocation should be raised to 100% to compensate",
          ],
          correctIndex: 0,
          explanation: "Leave reduces all of a person's projects in proportion. Ignoring it for split people is a classic way to over-plan.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-leave-holiday-planning-q5",
          prompt:
            "The only developer who knows the payment integration has requested leave in release week. What is the right response?",
          options: [
            "Treat it as a key-person risk: plan a handover and a second person on payments well before release, and discuss timing if needed",
            "Reject the leave",
            "Approve it and hope nothing breaks",
            "Move the release without telling the client",
          ],
          correctIndex: 0,
          explanation:
            "The root problem is that one person holds critical knowledge. Fix the plan (handover, pairing), then agree timings fairly with the person and the client.",
        },
        {
          id: "pma-leave-holiday-planning-q6",
          prompt: "Your Australian client's office closes from 24 December to 5 January. Your team works through. Where does this hit the plan?",
          options: [
            "Anything needing client input: UAT sign-off, content, approvals. Build work can continue",
            "Nowhere, because your team is working",
            "Everything: your team must stop too",
            "Only the invoice date",
          ],
          correctIndex: 0,
          explanation: "Schedule client-dependent steps outside their break, and get decisions before it starts.",
        },
        {
          id: "pma-leave-holiday-planning-q7",
          prompt: "When is the right time to tell the client that leave and holidays mean less scope fits in a sprint?",
          options: [
            "At sprint planning, before the work starts",
            "At the sprint demo",
            "Only if the client asks",
            "After the release slips",
          ],
          correctIndex: 0,
          explanation: "Known capacity cuts are not news at the demo. Early notice lets the client choose what to drop or move.",
        },
        {
          id: "pma-leave-holiday-planning-q8",
          prompt: "In Excel, which function counts working days for a Sunday-to-Thursday team, excluding office holidays?",
          options: ["NETWORKDAYS.INTL with a Friday-Saturday weekend and the holiday range", "NETWORKDAYS with no arguments", "DAYS", "TODAY"],
          correctIndex: 0,
          explanation: "NETWORKDAYS.INTL lets you set which days are the weekend, and takes a holidays range like NETWORKDAYS.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Plan capacity for a two-week sprint on a Laravel + React project. Each person's focus time is 6 h a day. Calculate Ravi's available hours, the team's total available hours on this project, the hours lost to personal leave, and the shortfall against a sprint backlog of 180 h.",
        table: {
          columns: ["Person", "Sprint weekdays", "Office holidays", "Leave days", "Share on this project %", "Focus h/day"],
          rows: [
            ["Ravi", "10", "1", "0", "100", "6"],
            ["Meera", "10", "1", "2", "100", "6"],
            ["Arjun", "10", "1", "3", "100", "6"],
            ["Divya", "10", "1", "0", "50", "6"],
          ],
        },
        fields: [
          { id: "ravi", label: "Ravi's available hours", unit: "h", answer: 54, tolerance: 0.5, expression: "(T[0][1]-T[0][2]-T[0][3])*T[0][5]*T[0][4]/100" },
          {
            id: "team",
            label: "Team hours available on this project",
            unit: "h",
            answer: 159,
            tolerance: 0.5,
            expression:
              "(T[0][1]-T[0][2]-T[0][3])*T[0][5]*T[0][4]/100+(T[1][1]-T[1][2]-T[1][3])*T[1][5]*T[1][4]/100+(T[2][1]-T[2][2]-T[2][3])*T[2][5]*T[2][4]/100+(T[3][1]-T[3][2]-T[3][3])*T[3][5]*T[3][4]/100",
          },
          { id: "leave", label: "Project hours lost to personal leave", unit: "h", answer: 30, tolerance: 0.5, expression: "T[1][3]*T[1][5]*T[1][4]/100+T[2][3]*T[2][5]*T[2][4]/100" },
          {
            id: "gap",
            label: "Shortfall against a 180 h backlog",
            unit: "h",
            answer: 21,
            tolerance: 0.5,
            expression:
              "180-((T[0][1]-T[0][2]-T[0][3])*T[0][5]*T[0][4]/100+(T[1][1]-T[1][2]-T[1][3])*T[1][5]*T[1][4]/100+(T[2][1]-T[2][2]-T[2][3])*T[2][5]*T[2][4]/100+(T[3][1]-T[3][2]-T[3][3])*T[3][5]*T[3][4]/100)",
          },
        ],
        explanation:
          "Everyone has 9 working days after the holiday. Ravi: 9 × 6 = 54 h. Meera: 7 × 6 = 42 h. Arjun: 6 × 6 = 36 h. Divya: 9 × 6 × 50% = 27 h. Total 159 h. Leave costs 30 h (Meera 12, Arjun 18). Against 180 h of backlog the sprint is 21 h short, roughly three days of one developer. Agree with the client at sprint planning which stories move to the next sprint.",
      },
      sop: [
        {
          title: "Leave notice and the holiday calendar",
          prompt:
            "[Oyelabs SOP – admin to fill] How much notice planned leave needs, whether the PM is consulted before leave is approved, blackout periods around releases, where the office holiday calendar lives in Keka, and how client holidays are recorded in project plans.",
        },
      ],
    },
    {
      id: "pma-weekly-resource-meeting",
      moduleId: "pma-resource",
      trackId: "pm",
      title: "Weekly resource meeting",
      summary:
        "Resource plans go stale in days. A client pauses a feature, a production bug pulls a senior developer away, a deal closes early, someone resigns. The weekly resource meeting is where PMs and delivery leads look at one combined plan and agree who works on what next week, before the conflicts reach a client.\n\nA good meeting is short and runs on data. Before it, every PM updates their project's needs for the next two to four weeks, and timesheets for the past week are approved. The agenda: first, changes since last week (new projects, ended projects, leave, people pulled away). Second, conflicts: anyone over-allocated, and projects short of people. Third, the bench: who is free, and what they will do. Fourth, the pipeline: deals likely to start soon and who would staff them. End with decisions and owners, written down.\n\nRe-planning when someone is pulled away is the most common hard case. Say Arjun is moved to a production escalation for most of the week. Do not just hope his other project copes. Look at the skills matrix for someone free with the right skills, move non-urgent tasks, and if a client date is at risk, the PM tells the client the same day, with a plan. Escalations to a live system usually win, but the cost to the other project must be visible, not silent.\n\nThe common mistakes: a meeting that becomes a status update for each project, so it runs an hour and decides nothing. Arguments settled by whoever is loudest, instead of by client commitments and priorities agreed with leadership. And decisions that live only in people's heads. Update the plan in the meeting, and send a short summary after. When the meeting runs and who must attend is in your team's SOP below.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Float: Capacity planning and resource scheduling", url: "https://support.float.com/en/articles/13847946-capacity-planning-and-resource-scheduling", kind: "docs", verifiedAt: "2026-10-02T09:35:36Z" },
        { label: "Float: How to Stop Resource Overallocation in Its Tracks", url: "https://www.float.com/resources/overallocation-of-resources", kind: "article", verifiedAt: "2026-10-02T09:35:42Z" },
        { label: "Productive: Resource Management in 2026", url: "https://productive.io/blog/resource-management/", kind: "article", verifiedAt: "2026-10-02T09:35:24Z" },
        { label: "Asana: How Project Status Reports Work: 8 Steps + Template", url: "https://asana.com/resources/how-project-status-reports", kind: "article", verifiedAt: "2026-10-02T10:07:41Z" },
      ],
      video: {
        title: "Resource Planning for Projects: A Guide - Project Management Training",
        channel: "ProjectManager",
        url: "https://www.youtube.com/watch?v=akj4R1xZHzA",
        videoId: "akj4R1xZHzA",
        verifiedAt: "2026-10-02T09:35:57Z",
      },
      alternateVideos: [
        {
          title: "5 Top Resource Management Tools To Keep Your Team Organized",
          channel: "The Digital Project Manager",
          url: "https://www.youtube.com/watch?v=rNuTmZ6oOAk",
          videoId: "rNuTmZ6oOAk",
          verifiedAt: "2026-10-02T09:35:59Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-weekly-resource-meeting-q1",
          prompt: "What must be ready before the weekly resource meeting starts? (Select all that apply.)",
          options: [
            "Each PM's updated people needs for the next few weeks",
            "Last week's timesheets approved",
            "Known leave and people changes in the plan",
            "A slide deck for every project's status",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The meeting decides on data: needs, actuals and availability. Full project status decks turn it into an hour of updates.",
        },
        {
          id: "pma-weekly-resource-meeting-q2",
          prompt:
            "Halfway through the meeting, each PM is still presenting their project's status in detail. What should the chair do?",
          options: [
            "Move to the conflicts list: over-allocations and understaffed projects, and decide those",
            "Let everyone finish; status is useful",
            "Cancel the meeting",
            "Ask for written status instead and end",
          ],
          correctIndex: 0,
          explanation: "The meeting exists to resolve people conflicts. Status belongs in project reports.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-weekly-resource-meeting-q3",
          prompt:
            "Arjun is pulled onto a production escalation for a US client for 30 h this week. Your Laravel CRM release for a UK client needs his 25 h. What do you do?",
          options: [
            "Find a Laravel-capable person with free time, move non-urgent tasks, and tell the UK client today if the date is at risk",
            "Ask Arjun to do both by working nights",
            "Say nothing and hope the CRM release still lands",
            "Refuse to release Arjun to the escalation",
          ],
          correctIndex: 0,
          explanation:
            "A live production issue usually wins, but its cost to the other project must be handled and communicated, not hidden.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-weekly-resource-meeting-q4",
          prompt: "Two PMs both want Sana, the only free React developer, from Monday. How should the conflict be settled?",
          options: [
            "By client commitments and the priorities agreed with delivery leadership, with the decision recorded",
            "Whoever asked first",
            "Whoever argues hardest",
            "Split her 50/50 by default",
          ],
          correctIndex: 0,
          explanation:
            "Use agreed rules: contract dates, penalties, strategic clients. A default 50/50 split often leaves both projects short.",
        },
        {
          id: "pma-weekly-resource-meeting-q5",
          prompt: "What should come out of every resource meeting?",
          options: [
            "An updated plan plus a short written summary of decisions and owners",
            "A recording only",
            "Nothing written; people remember",
            "A new utilisation target",
          ],
          correctIndex: 0,
          explanation: "Decisions that are not written down get re-argued next week.",
        },
        {
          id: "pma-weekly-resource-meeting-q6",
          prompt: "Why include the BD pipeline in the resource meeting?",
          options: [
            "So likely new projects can be staffed in advance and the bench planned",
            "So PMs can approve deals",
            "Because BD runs the meeting",
            "To calculate last month's utilisation",
          ],
          correctIndex: 0,
          explanation: "Looking a few weeks ahead turns surprises into plans. The next topic covers forecasting from the pipeline.",
        },
        {
          id: "pma-weekly-resource-meeting-q7",
          prompt: "A senior developer is at 120% for the third week in a row. Which is the right reading?",
          options: [
            "A plan problem to fix now: move work or people, not a sign of commitment to praise",
            "Fine, seniors can handle it",
            "It will fix itself next sprint",
            "Lower their capacity in the sheet to hide it",
          ],
          correctIndex: 0,
          explanation: "Sustained over-allocation leads to mistakes and resignations. It is the meeting's job to fix it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-weekly-resource-meeting-q8",
          prompt: "Which order works best for the agenda?",
          options: [
            "Changes since last week, conflicts, bench, pipeline, decisions",
            "Pipeline, bench, project status, changes",
            "Project status for every project, then anything else",
            "Bench first, then everything else as time allows",
          ],
          correctIndex: 0,
          explanation: "Start with what changed, fix the conflicts it caused, use free people, look ahead, and record decisions.",
        },
      ],
      practice: {
        kind: "allocate",
        prompt:
          "Re-plan this week in the resource meeting. Arjun has been pulled onto a US client's production escalation and has only 10 h left. Sana has just rolled off a project. Ravi only does Laravel, Meera only React, Divya only QA; Sana can do Laravel and React. Cover all three needs without over-allocating anyone.",
        people: [
          { id: "ravi", name: "Ravi", capacity: 40, note: "Laravel only" },
          { id: "meera", name: "Meera", capacity: 40, note: "React only" },
          { id: "arjun", name: "Arjun", capacity: 10, note: "30 h pulled to a production escalation" },
          { id: "sana", name: "Sana", capacity: 40, note: "Was on bench; Laravel and React" },
          { id: "divya", name: "Divya", capacity: 32, note: "QA only" },
        ],
        projects: [
          { id: "crm", name: "Laravel CRM release (UK)", need: 55 },
          { id: "app", name: "React web app (AU)", need: 45 },
          { id: "qa", name: "Regression QA for both", need: 30 },
        ],
        slack: 0.1,
        blocked: [
          { person: "ravi", project: "app" },
          { person: "ravi", project: "qa" },
          { person: "meera", project: "crm" },
          { person: "meera", project: "qa" },
          { person: "divya", project: "crm" },
          { person: "divya", project: "app" },
        ],
        explanation:
          "One plan: CRM gets Ravi 40 h and Sana 15 h (55); the React app gets Meera 40 h and Sana 5 h, or Arjun's 10 h split in; QA gets Divya 30 h. Sana is what makes this week work, which is why a small bench is valuable. Record the decision, and keep Arjun's remaining hours for the escalation in case it runs over.",
      },
      sop: [
        {
          title: "Our weekly resource meeting",
          prompt:
            "[Oyelabs SOP – admin to fill] Day and time, who must attend (PMs, delivery head, BD), what each PM must update beforehand and where, how conflicts are prioritised, and where the decisions are recorded.",
        },
      ],
    },
    {
      id: "pma-forecasting-from-pipeline",
      moduleId: "pma-resource",
      trackId: "pm",
      title: "Forecasting from the BD pipeline and re-planning",
      summary:
        "Projects do not appear from nowhere. Weeks before a contract is signed, the BD team is talking to the client, sending proposals and answering questions. If delivery only hears about a new Laravel marketplace when the contract is signed on Friday and the client wants to start Monday, the agency either pulls people off other clients or starts late. Forecasting from the pipeline turns that surprise into a plan.\n\nThe basic method is a weighted forecast. For each deal, BD gives an expected start, the roles and hours per week needed, and a win probability. Multiply hours by probability and add them up per month. A deal needing 80 h a week at 70% probability counts as 56 h. Compare the weighted total with the free capacity you expect that month. The weighted number is good for hiring and bench decisions. For a single big deal, also look at the unweighted case: if it closes, can you staff it?\n\nStep by step each week: get the pipeline from BD (name, start, roles, hours, probability). Update the forecast. Flag months where likely demand is higher than free capacity (time to plan hiring or contractors) or much lower (time to plan bench work or push BD). Use soft bookings for likely deals, so people are pencilled in without blocking firm work. Keka PSA, for example, supports soft and hard allocation for this. Convert to hard bookings when the deal is signed.\n\nRe-planning is the other half. When a deal closes early, a project pauses, or someone resigns, re-run the plan, find who moves and what slips, and tell affected clients early. The common mistakes: treating every hot deal as 100% certain, which leads to over-hiring. Ignoring skills, so 120 free hours look fine until you see they are all React and the deal is Flutter. And BD promising start dates without checking delivery. How BD and delivery share the pipeline is in your team's SOP below.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Float: Capacity planning and resource scheduling", url: "https://support.float.com/en/articles/13847946-capacity-planning-and-resource-scheduling", kind: "docs", verifiedAt: "2026-10-02T09:35:36Z" },
        { label: "Float: Resource Forecasting Guide: the Key to Project Success", url: "https://www.float.com/resources/resource-forecasting", kind: "article", verifiedAt: "2026-10-02T09:35:34Z" },
        { label: "Scoro: Resource Forecasting For Projects: A Beginner’s Guide", url: "https://www.scoro.com/blog/resource-forecasting/", kind: "article", verifiedAt: "2026-10-02T09:35:34Z" },
        { label: "Resource Guru: Capacity planning guide: Definitions, strategies, and formulas", url: "https://resourceguruapp.com/blog/project-management/capacity-planning-guide", kind: "article", verifiedAt: "2026-10-02T09:35:28Z" },
      ],
      video: {
        title: "What is Resource Forecasting? [Terms, Techniques, Examples]",
        channel: "ProSymmetry",
        url: "https://www.youtube.com/watch?v=a3K48ghUlnE",
        videoId: "a3K48ghUlnE",
        verifiedAt: "2026-10-02T09:35:54Z",
      },
      alternateVideos: [
        {
          title: "Easy Project Management Forecasting [Resource Forecasting Tutorial, Capacity Heatmaps]",
          channel: "ProSymmetry",
          url: "https://www.youtube.com/watch?v=U5B7nhxWrcQ",
          videoId: "U5B7nhxWrcQ",
          verifiedAt: "2026-10-02T09:35:56Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-forecasting-from-pipeline-q1",
          prompt: "A deal needs 60 h a week from November with a 40% win probability. What does it add to the weighted November forecast?",
          options: ["24 h a week", "60 h a week", "0 h until signed", "36 h a week"],
          correctIndex: 0,
          explanation: "Weighted demand is hours × probability: 60 × 0.4 = 24 h.",
        },
        {
          id: "pma-forecasting-from-pipeline-q2",
          prompt:
            "Weighted November demand is 116 h a week; you expect 100 h a week free. One single deal in it needs 80 h at 70%. Which statements are true? (Select all that apply.)",
          options: [
            "On the weighted view you are about 16 h a week short: plan for it",
            "If the 80 h deal closes, you need a staffing plan for all 80 h, not 56 h",
            "The weighted number is a planning average, not what any single month will look like",
            "Weighted forecasts mean you can ignore the big deal until it is signed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Weighted totals guide hiring and bench decisions. Big individual deals still need an \"if it closes\" plan because they arrive whole, not at 70%.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-forecasting-from-pipeline-q3",
          prompt: "What should BD give delivery for each pipeline deal so you can forecast?",
          options: [
            "Expected start, roles and hours per week, and win probability",
            "Only the contract value",
            "Only the client's name",
            "The final signed SOW",
          ],
          correctIndex: 0,
          explanation: "Timing, roles and probability are what turn a deal into a resource forecast. The SOW comes too late for planning.",
        },
        {
          id: "pma-forecasting-from-pipeline-q4",
          prompt: "Your forecast shows 120 free hours next month. The likely deal is a Flutter app; all 120 free hours are React developers. What is the real picture?",
          options: [
            "You cannot staff the deal from free capacity: plan Flutter upskilling, re-shuffling or hiring",
            "Fine: 120 hours covers it",
            "Assign React developers and bill them as Flutter",
            "Ask BD to change the deal to React",
          ],
          correctIndex: 0,
          explanation: "Capacity only counts if the skills match. Always forecast by role or skill, not just total hours.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-forecasting-from-pipeline-q5",
          prompt: "What is a soft allocation (soft booking) for?",
          options: [
            "Pencilling people in for a likely deal without blocking confirmed work",
            "Allocating part-time staff",
            "Booking people who are on leave",
            "Billing at a discount",
          ],
          correctIndex: 0,
          explanation: "Soft allocations are tentative; hard allocations are confirmed. Keka PSA supports both.",
        },
        {
          id: "pma-forecasting-from-pipeline-q6",
          prompt: "BD promises a new client a Monday start without checking with delivery. Everyone is fully allocated. What is the best response?",
          options: [
            "Tell BD and the delivery lead now, propose a realistic start or staffing option, and agree a check step for future deals",
            "Pull someone off another client's project without telling that client",
            "Start Monday with whoever is free, regardless of skills",
            "Ignore it and let BD handle the client",
          ],
          correctIndex: 0,
          explanation: "Fix this deal openly, and fix the process so start dates are checked with delivery before they are promised.",
        },
        {
          id: "pma-forecasting-from-pipeline-q7",
          prompt: "A client pauses a React project for six weeks, freeing three developers. What should re-planning include? (Select all that apply.)",
          options: [
            "Check which pipeline deals or understaffed projects could use them",
            "Plan useful bench work if nothing fits",
            "Confirm with the paused client when and how the team will return",
            "Remove the client from the pipeline report",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "A pause frees capacity and creates a restart risk. Plan both sides.",
        },
        {
          id: "pma-forecasting-from-pipeline-q8",
          prompt: "Why is treating every \"hot\" deal as 100% certain dangerous?",
          options: [
            "You hire or hold people for work that may never come, and bench costs rise",
            "Clients will refuse to sign",
            "It lowers utilisation targets",
            "BD stops reporting deals",
          ],
          correctIndex: 0,
          explanation: "Probability exists because many deals do not close. Plan on weighted numbers, with a contingency for the big ones.",
        },
        {
          id: "pma-forecasting-from-pipeline-q9",
          prompt: "A senior developer resigns with a 30-day notice. What should the re-plan do first?",
          options: [
            "Identify their critical knowledge and start handover and pairing on each project now",
            "Wait for the replacement to join",
            "Move their tasks to the last week of notice",
            "Remove them from the plan immediately",
          ],
          correctIndex: 0,
          explanation: "Notice periods are short. Knowledge transfer has to start on day one, with the client informed if it affects them.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "BD shared this pipeline for the next two months. In November the delivery team expects 100 h a week of free capacity. Calculate the weighted November demand, the unweighted November demand (if every November deal closes), the weighted gap against free capacity, and the weighted December demand from new starts.",
        table: {
          columns: ["Deal", "Hours per week", "Win probability", "Start"],
          rows: [
            ["Laravel marketplace (UK)", "80", "70%", "Nov"],
            ["React Native app (US)", "60", "40%", "Nov"],
            ["AI chatbot add-on (AU)", "40", "90%", "Nov"],
            ["Shopify revamp (CA)", "50", "20%", "Dec"],
          ],
        },
        fields: [
          { id: "weighted", label: "Weighted November demand", unit: "h/week", answer: 116, tolerance: 0.5, expression: "T[0][1]*T[0][2]/100+T[1][1]*T[1][2]/100+T[2][1]*T[2][2]/100" },
          { id: "unweighted", label: "Unweighted November demand", unit: "h/week", answer: 180, tolerance: 0.5, expression: "T[0][1]+T[1][1]+T[2][1]" },
          { id: "gap", label: "Weighted November gap (demand minus 100 h free)", unit: "h/week", answer: 16, tolerance: 0.5, expression: "T[0][1]*T[0][2]/100+T[1][1]*T[1][2]/100+T[2][1]*T[2][2]/100-100" },
          { id: "dec", label: "Weighted demand from December starts", unit: "h/week", answer: 10, tolerance: 0.5, expression: "T[3][1]*T[3][2]/100" },
        ],
        explanation:
          "November's weighted demand is 56 + 24 + 36 = 116 h a week, 16 h more than the 100 h free: plan a contractor or a re-shuffle. If all three November deals close, the need is 180 h, so the Laravel marketplace alone (80 h) would need a real staffing plan. December's Shopify deal adds only 10 weighted hours, so do not hire for it yet; revisit when its probability changes.",
      },
      sop: [
        {
          title: "How BD shares the pipeline with delivery",
          prompt:
            "[Oyelabs SOP – admin to fill] Where the pipeline is kept (CRM or Keka PSA opportunities), how often BD updates it, which fields are mandatory (start, roles, hours, probability), and who must confirm a start date before BD promises it to a client.",
        },
      ],
    },
    {
      id: "pma-resource-plan-in-excel-and-keka",
      moduleId: "pma-resource",
      trackId: "pm",
      title: "Doing it in Excel and Keka PSA",
      summary:
        "Everything in this module needs a home: one resource plan that every PM and the delivery lead trust. Most agencies use both a spreadsheet and a system. Excel is quick for modelling (\"what if Sana moves to the CRM for two weeks?\"). Keka PSA is the system of record: allocations there connect to timesheets, billing and utilisation reports.\n\nIn Excel, keep the plan as a flat list: one row per person per project, with hours per week or allocation %. Then build a summary with SUMIFS per person, compare with capacity, and flag status with IF: Over when allocated hours exceed capacity, Under when they fall well below (say under 70%), otherwise OK. Conditional formatting colours the flags. A second SUMIFS by project shows whether each project has the hours it needs.\n\nIn Keka PSA, allocations are made on the project's Team tab: Add Resource, set start and end dates, the allocation percentage (any value from 0 to 100%) and the allocation type, soft or hard. The help article notes an employee can be on several projects as long as the total stays within 100%. Utilisation reports in PSA Analytics are derived from logged and approved timesheet hours, so if timesheets are not approved, the reports are empty or wrong.\n\nThe common mistakes: two sources of truth that disagree, such as a sheet that says Divya is free while Keka shows her at 100%. Agree which one wins, and update the other in the same meeting. Allocations that never end, so a person still shows on a project that finished in June. And modelling in Excel but forgetting to make the change in Keka, so timesheets go to the wrong project and billing is wrong. Where the plan lives and who updates Keka is in your team's SOP below.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Keka Help: Tailoring Resource Allocation", url: "https://help.keka.com/hc/en-us/articles/39946575810321-Tailoring-Resource-Allocation", kind: "docs", verifiedAt: "2026-10-02T09:38:31Z" },
        { label: "Keka Help: Tracking Resource Utilization Across Projects", url: "https://help.keka.com/hc/en-us/articles/39946725336337-Tracking-Resource-Utilization-Across-Projects", kind: "docs", verifiedAt: "2026-10-02T10:07:00Z" },
        { label: "Microsoft Support: SUMIFS function", url: "https://support.microsoft.com/en-us/excel/functions/sumifs-function", kind: "docs", verifiedAt: "2026-10-02T09:43:05Z" },
        { label: "Microsoft Support: Use conditional formatting to highlight information in Excel", url: "https://support.microsoft.com/en-us/excel/use-conditional-formatting-to-highlight-information-in-excel", kind: "docs", verifiedAt: "2026-10-02T09:35:37Z" },
      ],
      video: {
        title: "How to Build a Simple Resource Planner in Excel",
        channel: "Stuart Taylor - Project Management",
        url: "https://www.youtube.com/watch?v=AzQQeU6OR8A",
        videoId: "AzQQeU6OR8A",
        verifiedAt: "2026-10-02T09:35:57Z",
      },
      alternateVideos: [
        {
          title: "Team Capacity Planner for Excel: Easily allocate and watch workload",
          channel: "Tactical Project Manager",
          url: "https://www.youtube.com/watch?v=oiBZb--8Mqg",
          videoId: "oiBZb--8Mqg",
          verifiedAt: "2026-10-02T09:35:59Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-resource-plan-in-excel-and-keka-q1",
          prompt: "Your Excel resource plan has one row per person per project. Which formula gives Ravi's total planned hours?",
          options: ['=SUMIFS(C2:C50,A2:A50,"Ravi")', '=COUNTIF(A2:A50,"Ravi")', '=XLOOKUP("Ravi",A2:A50,C2:C50)', '=SUM(C2:C50)'],
          correctIndex: 0,
          explanation:
            "SUMIFS adds every row for Ravi. XLOOKUP returns only his first row, which hides his other projects — the exact over-allocation you are trying to find.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-resource-plan-in-excel-and-keka-q2",
          prompt: "Which status formula flags Over above capacity (F2), Under below 70% of capacity, and OK otherwise, for allocated hours in G2?",
          options: [
            '=IF(G2>F2,"Over",IF(G2<F2*0.7,"Under","OK"))',
            '=IF(G2<F2*0.7,"Over",IF(G2>F2,"Under","OK"))',
            '=IF(G2>=F2,"Over","OK")',
            '=IF(G2>F2*0.7,"Over","Under")',
          ],
          correctIndex: 0,
          explanation: "Test each condition with the right label. Exactly at capacity is OK, not Over.",
        },
        {
          id: "pma-resource-plan-in-excel-and-keka-q3",
          prompt: "Where in Keka PSA do you allocate a person to a project?",
          options: [
            "In the project's Team tab: Add Resource, then set dates, allocation % and allocation type",
            "In the employee's leave page",
            "In the invoice settings",
            "Only through the timesheet",
          ],
          correctIndex: 0,
          explanation: "Keka's help article describes allocation from the project's Team tab, with start/end dates, a percentage and soft or hard type.",
        },
        {
          id: "pma-resource-plan-in-excel-and-keka-q4",
          prompt: "Keka PSA's utilisation report for last month is empty for your project. What should you check first?",
          options: [
            "Whether the team's timesheets were submitted and approved, and the report filters",
            "Whether the project has an invoice",
            "Whether the allocation is soft",
            "Whether the client has a rate card",
          ],
          correctIndex: 0,
          explanation: "Keka derives utilisation from logged hours; its troubleshooting advice is to check that timesheets are submitted and approved and the filters are right.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-resource-plan-in-excel-and-keka-q5",
          prompt: "Your Excel plan says Divya is free next week, but Keka PSA shows her 100% allocated to a project that ended in June. What is the fix? (Select all that apply.)",
          options: [
            "End her old allocation in Keka so it matches reality",
            "Agree which source is the system of record and keep the other in sync",
            "Check other people for allocations that were never closed",
            "Delete Keka allocations and use only Excel",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Stale allocations make every report wrong. Close them, agree the master source and check for the same problem elsewhere.",
        },
        {
          id: "pma-resource-plan-in-excel-and-keka-q6",
          prompt: "What allocation percentages does Keka PSA accept?",
          options: ["Any value from 0% to 100%, such as 33% or 66%", "Only 25%, 50%, 75% or 100%", "Only 50% or 100%", "Any value, including 150%"],
          correctIndex: 0,
          explanation: "The Tailoring Resource Allocation article says any value between 0% and 100%, typed or picked from the list.",
        },
        {
          id: "pma-resource-plan-in-excel-and-keka-q7",
          prompt:
            "You model a change in Excel: Sana moves from the React app to the Laravel CRM for two weeks. The team agrees. What else must happen?",
          options: [
            "Update her allocations in Keka PSA so timesheets, billing and utilisation follow the change",
            "Nothing: Excel is enough",
            "Email the client the Excel file",
            "Wait until month end to update Keka",
          ],
          correctIndex: 0,
          explanation: "If Keka still shows the old allocation, her hours may be logged or billed to the wrong project.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-resource-plan-in-excel-and-keka-q8",
          prompt: "Why use a flat list (person, project, hours) rather than a grid with one column per project?",
          options: [
            "Adding projects is just adding rows, and SUMIFS or a pivot can summarise any way you need",
            "Grids are not allowed in Excel",
            "Keka cannot read grids",
            "Flat lists use less colour",
          ],
          correctIndex: 0,
          explanation: "A flat list scales and summarises cleanly. Grids need a new column and new formulas for every project.",
        },
        {
          id: "pma-resource-plan-in-excel-and-keka-q9",
          prompt: "What is the difference between soft and hard allocation in Keka PSA?",
          options: [
            "Soft is tentative (for example a likely deal); hard is confirmed and reserved",
            "Soft is part-time; hard is full-time",
            "Soft is non-billable; hard is billable",
            "Soft can be deleted; hard cannot",
          ],
          correctIndex: 0,
          explanation: "Keka's estimation article describes soft allocation as tentative and hard allocation as confirmed.",
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "This is next week's resource plan (one row per person per project). Divya works a 4-day week this month, so her capacity is 32 h. In G2:G5, total each person's planned hours with SUMIFS. In H2:H5, show \"Over\" if planned hours are above capacity, \"Under\" if below 70% of capacity, otherwise \"OK\". In G7, total the hours planned on the Acme Laravel CRM.",
        grid: [
          ["Person", "Project", "Hours/week", "", "Person", "Capacity (h)", "Planned (h)", "Status"],
          ["Ravi", "Acme Laravel CRM", "24", "", "Ravi", "40", "", ""],
          ["Ravi", "Brightline React app", "20", "", "Meera", "40", "", ""],
          ["Meera", "Brightline React app", "30", "", "Arjun", "40", "", ""],
          ["Meera", "Internal QA automation", "6", "", "Divya", "32", "", ""],
          ["Arjun", "Acme Laravel CRM", "16", "", "", "", "", ""],
          ["Divya", "Northwind Flutter app", "32", "", "Acme Laravel CRM total", "", "", ""],
          ["Divya", "Acme Laravel CRM", "12", "", "", "", "", ""],
          ["Arjun", "Northwind Flutter app", "8", "", "", "", "", ""],
          ["Meera", "Northwind Flutter app", "4", "", "", "", "", ""],
        ],
        editable: ["G2", "G3", "G4", "G5", "H2", "H3", "H4", "H5", "G7"],
        checks: [
          { cell: "G2", expected: 44, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
          { cell: "G3", expected: 40, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
          { cell: "G4", expected: 24, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
          { cell: "G5", expected: 44, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
          { cell: "H2", expected: "Over", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
          { cell: "H3", expected: "OK", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
          { cell: "H4", expected: "Under", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
          { cell: "H5", expected: "Over", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
          { cell: "G7", expected: 52, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
        ],
        solution: {
          G2: "=SUMIFS($C$2:$C$10,$A$2:$A$10,E2)",
          G3: "=SUMIFS($C$2:$C$10,$A$2:$A$10,E3)",
          G4: "=SUMIFS($C$2:$C$10,$A$2:$A$10,E4)",
          G5: "=SUMIFS($C$2:$C$10,$A$2:$A$10,E5)",
          H2: '=IF(G2>F2,"Over",IF(G2<F2*0.7,"Under","OK"))',
          H3: '=IF(G3>F3,"Over",IF(G3<F3*0.7,"Under","OK"))',
          H4: '=IF(G4>F4,"Over",IF(G4<F4*0.7,"Under","OK"))',
          H5: '=IF(G5>F5,"Over",IF(G5<F5*0.7,"Under","OK"))',
          G7: '=SUMIFS(C2:C10,B2:B10,"Acme Laravel CRM")',
        },
        explanation:
          "Ravi (44 of 40) and Divya (44 of 32) are over-allocated; Divya's problem only shows because her capacity reflects the 4-day week. Meera is at exactly 40, which is OK, not Over. Arjun has 24 of 40 (60%), so he is Under and is the obvious person to take Ravi's extra 4 h or some of Divya's 12 h on the CRM, if the skills match. The CRM has 52 h planned across three people. Make the agreed changes in Keka PSA as well, or timesheets and billing will follow the old plan.",
      },
      sop: [
        {
          title: "Where our resource plan lives",
          prompt:
            "[Oyelabs SOP – admin to fill] Which tool is the system of record for allocations (Keka PSA or a shared sheet), who updates Keka allocations and when, the Under/Over thresholds we use, and how soft bookings for pipeline deals are recorded.",
        },
      ],
    },
  ],
} satisfies Module;
