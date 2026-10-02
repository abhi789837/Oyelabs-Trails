import type { Module } from "@/types/curriculum";

export default {
  id: "pma-excel",
  trackId: "pm",
  name: "Excel for PMs",
  description:
    "Hands-on Excel for agency project managers: clean tracker tables, the formulas a PM uses every week (SUMIFS, COUNTIF, XLOOKUP, NETWORKDAYS), RAG status, drop-downs, pivots, sharing safely with clients, Google Sheets equivalents and real trackers such as budget vs actuals and a RAID log.",
  refs: [
    { label: "Microsoft Support: Excel help & learning", url: "https://support.microsoft.com/en-us/excel/", kind: "docs", verifiedAt: "2026-10-02T09:44:16Z" },
  ],
  topics: [
    {
      id: "pma-excel-tables-sort-filter-freeze",
      moduleId: "pma-excel",
      trackId: "pm",
      title: "Tables, sort/filter, freeze panes, formatting",
      summary:
        "Most PM spreadsheets start as a quick list and turn into the project's single source of truth. A Laravel build for a UK client might begin with ten rows of tasks. Three months later it has 200 rows, five people editing it, and a client who asks for a copy every Friday. If the sheet is messy, every status update takes longer and mistakes slip through.\n\nAn Excel table fixes most of this. Click inside your list and press Ctrl+T (Insert > Table). The table gets a header row with filter buttons, banded rows, and an optional Total Row. New rows typed under the table join it automatically, so formulas and formatting follow. Formulas can use column names, like `=SUM(Tracker[Actual])`, which still work when the table grows.\n\nThen make the sheet easy to read. Freeze the header row (View > Freeze Panes > Freeze Top Row) so column names stay visible while you scroll. Sort by more than one level with Data > Sort, for example by Owner and then by Due date. Filter to answer quick questions such as \"what is still open for the demo?\" Keep one fact per column: a Status column and a separate Owner column, not \"Ravi - done\".\n\nA common mistake is sorting one column on its own. If you select only the Due date column and sort, Excel asks whether to expand the selection. Say no and the dates move while the task names stay put. Every row is now wrong, and nobody notices until a client asks why the payment task is due before the login task. Turning the list into a table avoids this, because a table always sorts whole rows. Merged cells cause the same kind of trouble, so avoid them in tracker data.",
      level: "beginner",
      estMinutes: 40,
      webRefs: [
        { label: "Microsoft Support: Overview of Excel tables", url: "https://support.microsoft.com/en-us/excel/overview-of-excel-tables", kind: "docs", verifiedAt: "2026-10-02T09:35:37Z" },
        { label: "Microsoft Support: Freeze panes to lock rows and columns", url: "https://support.microsoft.com/en-us/excel/get-started/freeze-panes-to-lock-rows-and-columns", kind: "docs", verifiedAt: "2026-10-02T09:35:32Z" },
        { label: "Microsoft Support: Sort data in a range or table in Excel", url: "https://support.microsoft.com/en-us/excel/sort-data-in-a-range-or-table-in-excel", kind: "docs", verifiedAt: "2026-10-02T09:45:51Z" },
        { label: "Microsoft Support: Filter data in a range or table in Excel", url: "https://support.microsoft.com/en-us/excel/get-started/filter-data-in-a-range-or-table-in-excel", kind: "docs", verifiedAt: "2026-10-02T09:35:43Z" },
      ],
      video: {
        title: "Excel Tutorial for Beginners",
        channel: "Kevin Stratvert",
        url: "https://www.youtube.com/watch?v=LgXzzu68j7M",
        videoId: "LgXzzu68j7M",
        verifiedAt: "2026-10-02T09:35:58Z",
      },
      alternateVideos: [
        {
          title: "How to Freeze Panes in Excel",
          channel: "Kevin Stratvert",
          url: "https://www.youtube.com/watch?v=525FRQwpnQA",
          videoId: "525FRQwpnQA",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-excel-tables-sort-filter-freeze-q1",
          prompt:
            "You select only the Due date column of your task list and click Sort A to Z. Excel shows a Sort Warning and you choose \"Continue with the current selection\". What happens?",
          options: [
            "The dates are sorted but the task names and owners stay where they were, so rows no longer match",
            "Excel sorts every column together anyway",
            "Nothing happens until you press Enter",
            "Excel refuses to sort a single column",
          ],
          correctIndex: 0,
          explanation:
            "Continuing with the current selection sorts only that column, which breaks every row. Expanding the selection, or using a table, keeps rows together.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-tables-sort-filter-freeze-q2",
          prompt: "Why turn a tracker list into an Excel table (Ctrl+T)? (Select all that apply.)",
          options: [
            "New rows typed under it join the table, so formulas and formatting carry on",
            "It adds filter buttons to the header row",
            "Formulas can refer to columns by name, such as Tracker[Actual]",
            "It stops anyone from editing the data",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Tables grow with the data, add filters and allow structured references. They do not protect anything; that is sheet protection.",
        },
        {
          id: "pma-excel-tables-sort-filter-freeze-q3",
          prompt: "Your tracker has 180 rows and the client keeps losing track of which column is which while scrolling on a call. What is the quickest fix?",
          options: [
            "View > Freeze Panes > Freeze Top Row",
            "Make the header row bold and bigger",
            "Split the tracker into several sheets of 30 rows",
            "Repeat the header row every 20 rows",
          ],
          correctIndex: 0,
          explanation:
            "Freezing the top row keeps headers visible however far you scroll. Repeating headers inside the data breaks sorting, filtering and formulas.",
        },
        {
          id: "pma-excel-tables-sort-filter-freeze-q4",
          prompt:
            "Before a demo, the client asks: \"Which tasks owned by Meera are still open?\" Which approach answers this without changing the sheet for everyone else?",
          options: [
            "Filter Owner to Meera and Status to everything except Done, then clear the filter afterwards",
            "Delete the rows that do not belong to Meera",
            "Sort by Status and hide the rest of the rows by hand",
            "Copy Meera's rows into a new workbook",
          ],
          correctIndex: 0,
          explanation:
            "Filters show a subset without deleting or moving anything. Deleting rows or making copies creates a second version of the truth.",
        },
        {
          id: "pma-excel-tables-sort-filter-freeze-q5",
          prompt:
            "A teammate typed \"Ravi - done (needs review)\" in a single Owner cell. Why is this a problem for the tracker?",
          options: [
            "You can no longer filter or count by owner or status, because two facts are mixed in one cell",
            "Excel cannot store text with dashes",
            "It makes the file much bigger",
            "It is fine as long as everyone reads the cell carefully",
          ],
          correctIndex: 0,
          explanation:
            "One fact per column is what makes filters, COUNTIF and pivots work. Mixed cells force people to read every row by eye.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-tables-sort-filter-freeze-q6",
          prompt: "Why are merged cells a bad idea inside tracker data?",
          options: [
            "They block sorting and filtering and confuse formulas that expect one value per row",
            "They make the sheet print in landscape",
            "They are not allowed in Excel tables, so the file will not save",
            "They change the font of the merged area",
          ],
          correctIndex: 0,
          explanation:
            "Sorting a range that contains merged cells of different sizes fails, and merged areas hide which row a value belongs to. Use Center Across Selection for headings instead.",
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "This is the task tracker for a Laravel customer portal for a UK client. Fill the Variance column (F2:F7) as Actual minus Estimate, and complete the Total row (D8, E8, F8) with formulas. Use SUM for the totals.",
        grid: [
          ["Task", "Owner", "Status", "Estimate (h)", "Actual (h)", "Variance (h)"],
          ["Login & auth", "Ravi", "Done", "16", "18", ""],
          ["Admin dashboard", "Meera", "Done", "24", "30", ""],
          ["Stripe payments", "Ravi", "In progress", "20", "12", ""],
          ["Email notifications", "Arjun", "In progress", "8", "9", ""],
          ["Reports export", "Meera", "Not started", "12", "0", ""],
          ["UAT fixes", "Arjun", "Not started", "10", "0", ""],
          ["Total", "", "", "", "", ""],
        ],
        editable: ["F2", "F3", "F4", "F5", "F6", "F7", "D8", "E8", "F8"],
        checks: [
          { cell: "F2", expected: 2, tolerance: 0.01, requireFormula: true, functions: [] },
          { cell: "F3", expected: 6, tolerance: 0.01, requireFormula: true, functions: [] },
          { cell: "F4", expected: -8, tolerance: 0.01, requireFormula: true, functions: [] },
          { cell: "F6", expected: -12, tolerance: 0.01, requireFormula: true, functions: [] },
          { cell: "D8", expected: 90, tolerance: 0.01, requireFormula: true, functions: ["SUM"] },
          { cell: "E8", expected: 69, tolerance: 0.01, requireFormula: true, functions: ["SUM"] },
          { cell: "F8", expected: -21, tolerance: 0.01, requireFormula: true, functions: [] },
        ],
        solution: {
          F2: "=E2-D2",
          F3: "=E3-D3",
          F4: "=E4-D4",
          F5: "=E5-D5",
          F6: "=E6-D6",
          F7: "=E7-D7",
          D8: "=SUM(D2:D7)",
          E8: "=SUM(E2:E7)",
          F8: "=SUM(F2:F7)",
        },
        explanation:
          "Variance is Actual minus Estimate, so a positive number means over estimate. The total variance of -21 h looks like good news, but it is not: -22 h of it comes from tasks that have not started (Reports export and UAT fixes) or are half done (Stripe). Only finished tasks give a real variance, and those two are 8 h over. Report variance on completed work, or the client will think the project is under budget when it is not.",
      },
    },
    {
      id: "pma-excel-data-validation",
      moduleId: "pma-excel",
      trackId: "pm",
      title: "Data validation (dropdowns)",
      summary:
        "When five people type into the same tracker, they type different things. One writes \"Done\", another \"Completed\", a third \"done ✔\". The developer in another time zone writes \"WIP\". Now your COUNTIF for finished tasks is wrong, your pivot shows four kinds of done, and the status report you send the client undercounts progress.\n\nData validation stops this at the door. Select the Status column, go to Data > Data Validation, choose List, and point the source at a short range such as Not started, In progress, Done. Each cell now shows a drop-down. You can also limit numbers, for example hours per day between 0 and 12, or dates within the project. An input message can explain the rule, and an error alert blocks or warns about bad entries.\n\nStep by step for a tracker: keep the allowed values on a separate Lists sheet, ideally as a table so the list grows when you add a value. Point the validation at that range. Use the Stop error style for fields that drive formulas, like Status and Priority. Then run Data > Data Validation > Circle Invalid Data to find old entries that broke the rule, because validation does not check what was typed before the rule existed.\n\nThe common mistake is trusting validation too much. Copy-paste overwrites the validation rule along with the value, so a teammate who pastes a block from another sheet can bring in \"WIP\" with no warning. The Warning and Information alert styles also let people click through. Check your status counts with a formula before each client report, and re-apply the rule if someone has pasted over it.",
      level: "beginner",
      estMinutes: 35,
      webRefs: [
        { label: "Microsoft Support: Apply data validation to cells", url: "https://support.microsoft.com/en-us/excel/get-started/apply-data-validation-to-cells", kind: "docs", verifiedAt: "2026-10-02T09:35:25Z" },
        { label: "Microsoft Support: Create a drop-down list", url: "https://support.microsoft.com/en-us/excel/get-started/create-a-drop-down-list", kind: "docs", verifiedAt: "2026-10-02T09:35:35Z" },
        { label: "Microsoft Support: More on data validation", url: "https://support.microsoft.com/en-us/excel/more-on-data-validation", kind: "docs", verifiedAt: "2026-10-02T09:45:17Z" },
      ],
      video: {
        title: "Create SMART Drop Down Lists in Excel (with Data Validation)",
        channel: "Leila Gharani",
        url: "https://www.youtube.com/watch?v=FRiFfKb_B_A",
        videoId: "FRiFfKb_B_A",
        verifiedAt: "2026-10-02T09:35:53Z",
      },
      alternateVideos: [
        {
          title: "Excel Custom Data Validation (Use formulas to check for text, numbers & length)",
          channel: "Leila Gharani",
          url: "https://www.youtube.com/watch?v=bDXQy60BcT4",
          videoId: "bDXQy60BcT4",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-excel-data-validation-q1",
          prompt:
            "You added a Status drop-down last week. Today the tracker still shows \"WIP\" in three rows that were typed a month ago. Why didn't validation catch them?",
          options: [
            "Validation only checks new entries; use Circle Invalid Data to find old ones",
            "Drop-downs only work in Excel tables",
            "Validation is case-sensitive, so WIP slipped through",
            "Someone must have turned validation off",
          ],
          correctIndex: 0,
          explanation:
            "Rules apply when a value is entered. Existing values stay until you find them, for example with Data > Data Validation > Circle Invalid Data.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-data-validation-q2",
          prompt:
            "A developer copies a block of rows from his own sheet and pastes it over your validated Status column. What happens to the drop-down in those cells?",
          options: [
            "The paste overwrites the validation rule too, so any value can now sit there",
            "Excel rejects the paste with an error alert",
            "The pasted values are converted to the nearest allowed value",
            "The drop-down stays and the invalid values turn red automatically",
          ],
          correctIndex: 0,
          explanation:
            "A normal paste replaces the cell's validation along with its content. That is why you still check counts with a formula before reporting.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-data-validation-q3",
          prompt: "Which are good uses of data validation in a project tracker? (Select all that apply.)",
          options: [
            "A Status list: Not started, In progress, Done",
            "Hours per day limited to a whole number between 0 and 12",
            "A Due date that must fall between the project start and end",
            "Stopping the client from opening the file",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Validation controls what can be typed into a cell: lists, number ranges and date ranges. Access to the file is a sharing and protection question.",
        },
        {
          id: "pma-excel-data-validation-q4",
          prompt: "Where is the best place to keep the list of allowed statuses?",
          options: [
            "On a separate Lists sheet, as a table, so adding a value updates every drop-down",
            "Typed into the Source box as text, in every column that needs it",
            "In a comment on the header cell",
            "In an email to the team",
          ],
          correctIndex: 0,
          explanation:
            "One list in one place, as a table that grows, keeps every drop-down consistent. Typed sources must be edited in each rule separately.",
        },
        {
          id: "pma-excel-data-validation-q5",
          prompt: "You set the error alert style to Warning. A teammate types \"Blocked\" into the Status column. What happens?",
          options: [
            "Excel warns them, but they can click Yes and keep the invalid value",
            "Excel blocks the entry completely",
            "Excel silently changes it to In progress",
            "Nothing, because Warning alerts only appear on the next save",
          ],
          correctIndex: 0,
          explanation:
            "Only the Stop style refuses invalid entries. Warning and Information let people continue, which is fine for soft rules but not for fields that drive reports.",
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "Before you send the weekly report for a React Native app, check the team's daily log. The allowed statuses are in F2:F4, and hours per day must be between 0 and 12. In D11, write a formula that counts the rows whose status is not one of the three allowed values. In D12, count the rows whose hours are below 0 or above 12.",
        grid: [
          ["Task", "Owner", "Status", "Hours today", "", "Allowed statuses"],
          ["Login API", "Ravi", "Done", "6", "", "Not started"],
          ["Profile screen", "Meera", "In progress", "7", "", "In progress"],
          ["Push notifications", "Arjun", "WIP", "5", "", "Done"],
          ["Stripe webhook", "Ravi", "Completed", "14", "", ""],
          ["Admin filters", "Meera", "Not started", "0", "", ""],
          ["Release notes", "Arjun", "In progress", "-2", "", ""],
          ["Crash fix", "Ravi", "Blocked", "9", "", ""],
          ["Search API", "Meera", "Done", "8", "", ""],
          ["", "", "", "", "", ""],
          ["Rows with a status not in the list", "", "", "", "", ""],
          ["Rows with hours outside 0-12", "", "", "", "", ""],
        ],
        editable: ["D11", "D12"],
        checks: [
          { cell: "D11", expected: 3, tolerance: 0.01, requireFormula: true, functions: [] },
          { cell: "D12", expected: 2, tolerance: 0.01, requireFormula: true, functions: [] },
        ],
        solution: {
          D11: '=COUNTIFS(C2:C9,"<>Not started",C2:C9,"<>In progress",C2:C9,"<>Done")',
          D12: '=COUNTIF(D2:D9,">12")+COUNTIF(D2:D9,"<0")',
        },
        explanation:
          "WIP, Completed and Blocked are not in the list, so three rows would break a status count. COUNTIFS with three \"<>\" conditions counts rows that match none of them; 8 minus three COUNTIFs works too. The hours check finds 14 and -2. Fix these before the report, then add a Stop-style drop-down so it does not happen again.",
      },
    },
    {
      id: "pma-excel-protect-share",
      moduleId: "pma-excel",
      trackId: "pm",
      title: "Protect and share",
      summary:
        "Agency PMs share spreadsheets all the time: a delivery tracker with the client, a resource sheet with the team, a budget sheet with the account manager. Each one needs a different level of access. Get it wrong and a client edits your formulas, or worse, sees your internal cost rates in a hidden tab.\n\nExcel has three separate tools, and people mix them up. Protect Sheet (Review > Protect Sheet) stops people changing locked cells. Every cell is locked by default, so first unlock the input cells (Format Cells > Protection, untick Locked), then protect the sheet. Protect Workbook protects the structure, so nobody can add, delete, rename or unhide sheets. Encrypt with Password (File > Info > Protect Workbook) is the only one that stops someone opening the file at all.\n\nSharing happens in OneDrive or SharePoint. Share the file with specific people, and choose Can view or Can edit. Prefer a view link for clients unless they really need to type into the sheet. For team trackers, keep one shared file and let people co-author it at the same time. Do not email copies around, because then you have five versions and no single truth.\n\nThe common mistake is treating sheet protection as security. Microsoft says plainly that it is not: it stops accidental edits, not a determined person. Hidden sheets can be unhidden, and data in a hidden column can be copied. Never put internal rates, margins or salary data in a file you share with a client, even on a hidden or protected tab. Make a separate client copy with only what they should see. What may go outside the company, and how, is in your team's SOP below.",
      level: "beginner",
      estMinutes: 30,
      webRefs: [
        { label: "Microsoft Support: Protect a worksheet", url: "https://support.microsoft.com/en-us/excel/protect-a-worksheet", kind: "docs", verifiedAt: "2026-10-02T09:35:19Z" },
        { label: "Microsoft Support: Protect a workbook", url: "https://support.microsoft.com/en-us/excel/protect-a-workbook", kind: "docs", verifiedAt: "2026-10-02T09:45:07Z" },
        { label: "Microsoft Support: Collaborate on Excel workbooks at the same time with co-authoring", url: "https://support.microsoft.com/en-us/excel/get-started/collaborate-on-excel-workbooks-at-the-same-time-with-co-authoring", kind: "docs", verifiedAt: "2026-10-02T09:35:31Z" },
        { label: "Microsoft Support: Share files and folders in Microsoft OneDrive", url: "https://support.microsoft.com/en-us/onedrive/share-files-and-folders-in-microsoft-onedrive", kind: "docs", verifiedAt: "2026-10-02T09:35:31Z" },
      ],
      video: {
        title: "MS Excel - Protect Sheet",
        channel: "TutorialsPoint",
        url: "https://www.youtube.com/watch?v=3wlDbuDkKNY",
        videoId: "3wlDbuDkKNY",
        verifiedAt: "2026-10-02T09:35:58Z",
      },
      alternateVideos: [
        {
          title: "Difference Between Protect Workbook and Protect Sheet | क्या अंतर है Protect Workbook और Worksheet",
          channel: "Computer Tech Academy",
          url: "https://www.youtube.com/watch?v=QUOiYasiw0w",
          videoId: "QUOiYasiw0w",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-excel-protect-share-q1",
          prompt:
            "You protect a sheet so the client can only fill in the \"Client feedback\" column, but after protecting it they cannot type anywhere. What did you forget?",
          options: [
            "To unlock the feedback cells (Format Cells > Protection) before protecting the sheet",
            "To protect the workbook as well",
            "To save the file as .xlsm",
            "To give the client a password",
          ],
          correctIndex: 0,
          explanation:
            "All cells are locked by default; protection only takes effect on locked cells. Unlock the input cells first, then protect.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-protect-share-q2",
          prompt:
            "Your budget workbook has a hidden \"Internal rates\" sheet and you protect the workbook structure. Is it safe to send the file to the client?",
          options: [
            "No. Protection is not security: remove the internal sheet and send a separate client copy",
            "Yes, because a protected structure means hidden sheets cannot be seen",
            "Yes, if the sheet is also very hidden",
            "Yes, as long as you send it as a link instead of an attachment",
          ],
          correctIndex: 0,
          explanation:
            "Microsoft states that sheet and workbook protection are not security features. Anything in the file can be got at; data the client must not see must not be in the file.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-protect-share-q3",
          prompt: "Which tool stops someone without the password from opening the file at all?",
          options: ["File > Info > Protect Workbook > Encrypt with Password", "Review > Protect Sheet", "Review > Protect Workbook (structure)", "Hiding every sheet"],
          correctIndex: 0,
          explanation: "Encryption controls opening the file. Sheet and structure protection only control edits once the file is open.",
        },
        {
          id: "pma-excel-protect-share-q4",
          prompt: "Which are good habits when sharing a tracker with an overseas client? (Select all that apply.)",
          options: [
            "Share from OneDrive or SharePoint with specific people instead of emailing copies",
            "Give view access unless the client really needs to edit",
            "Keep internal costs and margins out of the client's file",
            "Send a fresh attachment every day so they always have the latest",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "One shared file with the right permission and no internal data is safe and current. Daily attachments create competing versions.",
        },
        {
          id: "pma-excel-protect-share-q5",
          prompt: "Three developers in Pune and you need to update the same resource sheet at the same time. What makes this work?",
          options: [
            "Saving it in OneDrive or SharePoint and co-authoring it in Excel",
            "Taking turns and emailing the file after each edit",
            "Each person keeping their own copy and merging on Friday",
            "Protecting the workbook so only one person can edit",
          ],
          correctIndex: 0,
          explanation: "Co-authoring lets several people edit one cloud file at once and see each other's changes.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You run a React web app project for an Australian retail client. Your workbook has three sheets: Delivery tracker (tasks, status, dates), Client feedback (the client's UAT comments) and Budget (hours, internal cost rates and margin). The client's product owner wants to see progress and add UAT comments. Your two developers update the tracker daily.",
        steps: [
          {
            id: "s1",
            question: "How should you give the client access?",
            options: [
              "Create a separate client workbook without the Budget sheet and share it from OneDrive with the product owner",
              "Share the full workbook and hide the Budget sheet",
              "Share the full workbook and protect the Budget sheet with a password",
              "Email a PDF of all three sheets every week",
            ],
            correctIndex: 0,
            explanation: "Hidden or protected sheets are not secure. Internal rates and margin must not be in the client's file at all.",
          },
          {
            id: "s2",
            question: "In the client workbook, the product owner should only type into the Comments column of Client feedback. What do you do?",
            options: [
              "Unlock the Comments column, protect the sheet, and give the client edit access",
              "Give the client view-only access to the whole workbook",
              "Protect the workbook structure and leave the sheets unprotected",
              "Ask the client to email comments instead",
            ],
            correctIndex: 0,
            explanation: "Unlocking the input column and then protecting the sheet lets them comment without breaking anything else. View-only would stop them commenting.",
          },
          {
            id: "s3",
            question: "Your developers keep emailing updated copies of the tracker to each other. What is the fix?",
            options: [
              "Keep one tracker in SharePoint and have everyone co-author it",
              "Ask them to add their initials to the file name",
              "Lock the tracker so only you can edit it",
              "Merge their copies every Friday",
            ],
            correctIndex: 0,
            explanation: "One shared, co-authored file is the single source of truth. Copies drift apart and someone always works from an old one.",
          },
        ],
      },
      sop: [
        {
          title: "Sharing project sheets outside Oyelabs",
          prompt:
            "[Oyelabs SOP – admin to fill] Where project trackers live (SharePoint site or OneDrive folder), what may be shared with clients and how (link type, view or edit), what must never leave the company (rates, margins, salaries), and who approves an exception.",
        },
      ],
    },
    {
      id: "pma-excel-core-functions",
      moduleId: "pma-excel",
      trackId: "pm",
      title: "SUM/AVERAGE/IF/COUNTIF/SUMIFS/XLOOKUP",
      summary:
        "Six functions cover most of what a PM does in Excel. SUM and AVERAGE total and average hours. IF turns a number into a decision, like \"Over\" or \"OK\". COUNTIF counts rows that match one condition, such as open bugs. SUMIFS adds up numbers that match several conditions, such as billable hours for one client in one month. XLOOKUP finds a value in a list, such as a person's rate or a ticket's owner. With these you can answer most client questions in minutes instead of an afternoon.\n\nHere is how they work together on a real week. The timesheet export for a Laravel project has rows of person, client, billable flag and hours. `=SUMIFS(D2:D9,B2:B9,\"Acme UK\",C2:C9,\"Y\")` gives billable hours for Acme. `=COUNTIF(D2:D9,\">8\")` finds suspiciously long entries. `=XLOOKUP(\"Meera\",F2:F4,G2:G4)` pulls Meera's rate from a rate table, and multiplying the two gives her billable amount.\n\nA few rules save hours of debugging. SUMIF and SUMIFS put their arguments in a different order: SUMIF(range, criteria, sum_range) but SUMIFS(sum_range, range1, criteria1, ...). Criteria with operators go in quotes, like \">8\", or are joined to a cell with \">\"&H1. XLOOKUP matches exactly by default, unlike VLOOKUP, and its fourth argument lets you say \"Not found\" instead of showing #N/A. AVERAGE ignores blank cells but counts zeros, so a 0 typed for \"not started\" drags the average down.\n\nThe common mistake is numbers stored as text. A timesheet export often brings hours in as text, and SUM quietly skips them. The total looks believable and is wrong. If a total seems low, check whether the numbers are left-aligned or show a green triangle, and convert them before you send anything to the client. Also check the version: XLOOKUP needs Excel 2021 or Microsoft 365. A client on Excel 2019 will see #NAME? in your file.",
      level: "intermediate",
      estMinutes: 60,
      webRefs: [
        { label: "Microsoft Support: SUMIFS function", url: "https://support.microsoft.com/en-us/excel/functions/sumifs-function", kind: "docs", verifiedAt: "2026-10-02T09:43:05Z" },
        { label: "Microsoft Support: XLOOKUP function", url: "https://support.microsoft.com/en-us/excel/functions/xlookup-function", kind: "docs", verifiedAt: "2026-10-02T09:35:30Z" },
        { label: "Microsoft Support: Use the COUNTIF function in Microsoft Excel", url: "https://support.microsoft.com/en-us/excel/get-started/use-the-countif-function-in-microsoft-excel", kind: "docs", verifiedAt: "2026-10-02T09:43:52Z" },
        { label: "Microsoft Support: IF function", url: "https://support.microsoft.com/en-us/excel/functions/if-function", kind: "docs", verifiedAt: "2026-10-02T09:35:29Z" },
      ],
      video: {
        title: "Excel Formulas and Functions - Tutorial for Beginners",
        channel: "Kevin Stratvert",
        url: "https://www.youtube.com/watch?v=ZwiQ0W5lTEg",
        videoId: "ZwiQ0W5lTEg",
        verifiedAt: "2026-10-02T09:35:55Z",
      },
      alternateVideos: [
        {
          title: "How to Use SUMIFS, COUNTIFS and AVERAGEIFS in Excel (Multiple Criteria)",
          channel: "Leila Gharani",
          url: "https://www.youtube.com/watch?v=AZuBNWMh7VM",
          videoId: "AZuBNWMh7VM",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
        {
          title: "How to Use the NEW & IMPROVED Excel XLOOKUP (with 5 Examples)",
          channel: "Leila Gharani",
          url: "https://www.youtube.com/watch?v=4c0CLUER6nw",
          videoId: "4c0CLUER6nw",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-excel-core-functions-q1",
          prompt:
            "Which formula gives the billable hours (column C = \"Y\") for client \"Acme UK\" (column B), with hours in column D, rows 2 to 50?",
          options: [
            '=SUMIFS(D2:D50,B2:B50,"Acme UK",C2:C50,"Y")',
            '=SUMIFS(B2:B50,"Acme UK",C2:C50,"Y",D2:D50)',
            '=SUMIF(D2:D50,"Acme UK",B2:B50)',
            '=COUNTIFS(B2:B50,"Acme UK",C2:C50,"Y")',
          ],
          correctIndex: 0,
          explanation:
            "SUMIFS starts with the range to add, then range/criteria pairs. COUNTIFS would count the rows, not add the hours.",
        },
        {
          id: "pma-excel-core-functions-q2",
          prompt:
            "You write `=SUMIF(D2:D50,\"Acme UK\",B2:B50)` with hours in D and client in B. What goes wrong?",
          options: [
            "SUMIF's order is (range, criteria, sum_range), so it looks for \"Acme UK\" in the hours column and returns 0",
            "Nothing, SUMIF accepts the arguments in any order",
            "Excel shows #NAME?",
            "It adds all hours regardless of client",
          ],
          correctIndex: 0,
          explanation:
            "SUMIF tests the first range and adds the third. With the ranges swapped, no hours cell equals \"Acme UK\", so the result is 0, which looks like a real answer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-core-functions-q3",
          prompt: "You want to count timesheet entries over the limit in cell H1. Which criteria is written correctly?",
          options: ['=COUNTIF(D2:D50,">"&H1)', '=COUNTIF(D2:D50,">H1")', "=COUNTIF(D2:D50,>H1)", '=COUNTIF(D2:D50,"&gt;"H1)'],
          correctIndex: 0,
          explanation:
            "The operator is text and is joined to the cell's value with &. \">H1\" compares against the literal text H1.",
        },
        {
          id: "pma-excel-core-functions-q4",
          prompt:
            "The SUM of an exported hours column shows 212, but you know the team logged about 300 hours. Some numbers are left-aligned with a small green triangle. What is the likely cause?",
          options: [
            "Some hours came in as text, and SUM skips text",
            "SUM cannot add more than 200 values",
            "The green triangle means those cells are protected",
            "The column needs to be sorted before SUM works",
          ],
          correctIndex: 0,
          explanation:
            "Numbers stored as text are ignored by SUM, so the total is wrong but believable. Convert them (for example Convert to Number) before reporting.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-core-functions-q5",
          prompt: "Why do many PMs prefer XLOOKUP over VLOOKUP? (Select all that apply.)",
          options: [
            "It matches exactly by default, so it does not return a wrong nearby value",
            "The return column can be to the left of the lookup column",
            "It has a built-in \"if not found\" argument",
            "It works in every version of Excel, including 2016",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "XLOOKUP defaults to exact match, looks in any direction and handles missing values. It needs Excel 2021 or Microsoft 365; older versions show #NAME?.",
        },
        {
          id: "pma-excel-core-functions-q6",
          prompt:
            "Hours for six tasks are 8, 6, blank, 0, 10, 0. The two zeros were typed for tasks that have not started. What does AVERAGE return, and what is the catch?",
          options: [
            "4.8: blanks are ignored but zeros count, so unstarted tasks pull the average down",
            "6: Excel ignores both blanks and zeros",
            "4: blanks count as zero",
            "#DIV/0!, because of the blank",
          ],
          correctIndex: 0,
          explanation:
            "AVERAGE uses the five numbers (8+6+0+10+0 = 24, divided by 5). Leave unstarted tasks blank, or use AVERAGEIF with \">0\", if you want the average of real entries.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-core-functions-q7",
          prompt: "Which IF formula marks a task \"Over\" when actual hours (E2) exceed the estimate (D2), and \"OK\" otherwise?",
          options: ['=IF(E2>D2,"Over","OK")', '=IF(E2>D2,Over,OK)', '=IF("E2>D2","Over","OK")', '=IF(E2>D2;"OK";"Over")'],
          correctIndex: 0,
          explanation: "The test is a comparison, and text results go in quotes. Without quotes Excel looks for names called Over and OK.",
        },
        {
          id: "pma-excel-core-functions-q8",
          prompt:
            "You send a tracker using XLOOKUP to a client who runs Excel 2019. What will they most likely see in those cells?",
          options: ["#NAME?", "#N/A", "The correct values", "#VALUE!"],
          correctIndex: 0,
          explanation:
            "Older versions do not know the function name, so they show #NAME?. Use INDEX/MATCH, or check the client's version, when sharing outside the team.",
        },
        {
          id: "pma-excel-core-functions-q9",
          prompt: "Which formula counts open bugs (Status in C) that are \"High\" priority (Priority in D)?",
          options: [
            '=COUNTIFS(C2:C99,"Open",D2:D99,"High")',
            '=COUNTIF(C2:C99,"Open")+COUNTIF(D2:D99,"High")',
            '=SUMIFS(C2:C99,"Open",D2:D99,"High")',
            '=COUNTIF(C2:D99,"Open High")',
          ],
          correctIndex: 0,
          explanation:
            "COUNTIFS needs both conditions on the same row. Adding two COUNTIFs counts every open bug plus every high bug, double counting the overlap.",
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "This is last week's timesheet export for two clients, with a rate table in F1:G4. Fill G6:G12 with formulas: billable hours for Acme UK (use SUMIFS), the number of entries over 8 hours (COUNTIF), the average entry, the total hours, Meera's rate (XLOOKUP), Meera's billable hours, and Meera's billable amount in dollars.",
        grid: [
          ["Person", "Client", "Billable", "Hours", "", "Person", "Rate ($/h)"],
          ["Ravi", "Acme UK", "Y", "7", "", "Ravi", "30"],
          ["Meera", "Acme UK", "Y", "9", "", "Meera", "35"],
          ["Arjun", "Brightline AU", "N", "4", "", "Arjun", "28"],
          ["Ravi", "Brightline AU", "Y", "6", "", "", ""],
          ["Meera", "Acme UK", "N", "2", "", "Acme UK billable hours", ""],
          ["Arjun", "Acme UK", "Y", "10", "", "Entries over 8 h", ""],
          ["Meera", "Brightline AU", "Y", "5", "", "Average entry (h)", ""],
          ["Ravi", "Acme UK", "Y", "8", "", "Total hours", ""],
          ["", "", "", "", "", "Meera's rate", ""],
          ["", "", "", "", "", "Meera billable hours", ""],
          ["", "", "", "", "", "Meera billable amount ($)", ""],
        ],
        editable: ["G6", "G7", "G8", "G9", "G10", "G11", "G12"],
        checks: [
          { cell: "G6", expected: 34, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
          { cell: "G7", expected: 2, tolerance: 0.01, requireFormula: true, functions: ["COUNTIF"] },
          { cell: "G8", expected: 6.375, tolerance: 0.01, requireFormula: true, functions: ["AVERAGE"] },
          { cell: "G9", expected: 51, tolerance: 0.01, requireFormula: true, functions: ["SUM"] },
          { cell: "G10", expected: 35, tolerance: 0.01, requireFormula: true, functions: ["XLOOKUP"] },
          { cell: "G11", expected: 14, tolerance: 0.01, requireFormula: true, functions: [] },
          { cell: "G12", expected: 490, tolerance: 0.01, requireFormula: true, functions: [] },
        ],
        solution: {
          G6: '=SUMIFS(D2:D9,B2:B9,"Acme UK",C2:C9,"Y")',
          G7: '=COUNTIF(D2:D9,">8")',
          G8: "=AVERAGE(D2:D9)",
          G9: "=SUM(D2:D9)",
          G10: '=XLOOKUP("Meera",F2:F4,G2:G4)',
          G11: '=SUMIFS(D2:D9,A2:A9,"Meera",C2:C9,"Y")',
          G12: "=G11*G10",
        },
        explanation:
          "Acme UK billable is 7 + 9 + 10 + 8 = 34 h (Meera's 2 non-billable hours are excluded). Two entries are over 8 h (9 and 10). Total is 51 h, so the average entry is 6.375 h. Meera's billable hours are 9 + 5 = 14, at $35 that is $490. Note that her 2 non-billable hours never reach the invoice, which is exactly what SUMIFS with the Billable condition protects.",
      },
    },
    {
      id: "pma-excel-dates-networkdays",
      moduleId: "pma-excel",
      trackId: "pm",
      title: "Dates and NETWORKDAYS",
      summary:
        "Clients think in calendar dates. Teams work in working days. The gap between the two is where release dates go wrong. If a US client asks for a build in \"four weeks\" and your team in India has two office holidays in that window, the real capacity is eighteen working days, not twenty. A PM who counts on a calendar promises a date the team cannot hit.\n\nExcel stores dates as serial numbers, which is why you can subtract them. Two functions do most of the work. `NETWORKDAYS(start, end, holidays)` counts working days between two dates. It counts both the start and end day, skips Saturdays and Sundays, and skips any dates in the holidays range. `WORKDAY(start, days, holidays)` goes the other way: it returns the date that is a number of working days after the start, not counting the start day itself. NETWORKDAYS.INTL and WORKDAY.INTL let you set a different weekend, for example Friday and Saturday for a team in the Gulf.\n\nStep by step for a release plan: keep a Holidays list on its own sheet, with your office holidays from the leave calendar. For each phase, put the start and end date and compute working days with NETWORKDAYS. To set a date from an estimate, use WORKDAY from the previous phase's end. Use TODAY() for \"days left\" columns, but remember it changes every day, so a status report saved last week will show different numbers today.\n\nCommon mistakes: dates typed as text (\"12/10/2026\" in a sheet set to US format means December 10, not 12 October), which give #VALUE! or silently wrong answers. Forgetting the holidays argument. Forgetting that the client has holidays too: a UAT window over US Thanksgiving or Christmas will not get feedback, whatever your sheet says. Your team's SOP below lists the holiday calendar and time-zone overlap rules to plan around.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Microsoft Support: NETWORKDAYS function", url: "https://support.microsoft.com/en-us/excel/functions/networkdays-function", kind: "docs", verifiedAt: "2026-10-02T09:35:37Z" },
        { label: "Microsoft Support: WORKDAY function", url: "https://support.microsoft.com/en-us/excel/functions/workday-function", kind: "docs", verifiedAt: "2026-10-02T09:35:38Z" },
        { label: "Microsoft Support: NETWORKDAYS.INTL function", url: "https://support.microsoft.com/en-us/excel/functions/networkdays-intl-function", kind: "docs", verifiedAt: "2026-10-02T09:35:24Z" },
        { label: "Microsoft Support: TODAY function", url: "https://support.microsoft.com/en-us/excel/functions/today-function", kind: "docs", verifiedAt: "2026-10-02T09:35:30Z" },
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
          title: "Calculate Working Days in Excel | WORKDAY and NETWORKDAYS",
          channel: "Excel Universe",
          url: "https://www.youtube.com/watch?v=BmM-W2e0NOI",
          videoId: "BmM-W2e0NOI",
          verifiedAt: "2026-10-02T09:35:57Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-excel-dates-networkdays-q1",
          prompt: "What does `=NETWORKDAYS(\"2026-10-05\",\"2026-10-09\")` return? (Monday 5 October to Friday 9 October, no holidays.)",
          options: ["5", "4", "7", "6"],
          correctIndex: 0,
          explanation: "NETWORKDAYS counts both the start and the end day, so Monday to Friday is 5 working days. Subtracting the dates gives 4.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-dates-networkdays-q2",
          prompt:
            "Build ends on Friday 13 November. QA needs 5 working days. What does `=WORKDAY(build_end,5)` return?",
          options: [
            "Friday 20 November: the start day is not counted",
            "Thursday 19 November: the start day counts as day 1",
            "Wednesday 18 November",
            "Monday 23 November",
          ],
          correctIndex: 0,
          explanation:
            "WORKDAY moves forward the given number of working days after the start: Mon 16 to Fri 20. NETWORKDAYS includes the start day; WORKDAY does not.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-dates-networkdays-q3",
          prompt: "Your Dubai-based client's team works Monday to Friday, but their partner team works Sunday to Thursday. Which function counts the partner team's working days?",
          options: ["NETWORKDAYS.INTL with a Friday-Saturday weekend", "NETWORKDAYS with a holiday list of every Friday and Saturday", "DAYS divided by 7, times 5", "WORKDAY"],
          correctIndex: 0,
          explanation: "NETWORKDAYS.INTL takes a weekend argument (for example 7 for Friday-Saturday). Listing every weekend day as a holiday works but is fragile.",
        },
        {
          id: "pma-excel-dates-networkdays-q4",
          prompt:
            "A sheet set to US date format has \"12/10/2026\" typed in a Start column by a developer in India who meant 12 October. What is the risk?",
          options: [
            "Excel reads it as 10 December, so every working-day count from it is silently wrong",
            "Excel always asks which format you meant",
            "No risk: Excel detects the user's country",
            "It always shows #VALUE!",
          ],
          correctIndex: 0,
          explanation:
            "Ambiguous day/month dates are read in the sheet's locale. Use unambiguous dates (2026-10-12) or a date picker, and check a few dates by eye.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-dates-networkdays-q5",
          prompt: "What should a release plan's holidays range include? (Select all that apply.)",
          options: [
            "Your office's public holidays in the window",
            "Approved leave for the key developer, if you are planning that person's tasks",
            "Client holidays that block UAT feedback, for the UAT phase",
            "Every weekend date",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Holidays are any non-working days that are not weekends. Weekends are already excluded, so listing them adds nothing.",
        },
        {
          id: "pma-excel-dates-networkdays-q6",
          prompt: "Your status sheet has \"Days to launch = launch_date - TODAY()\". You save it as an attachment on Monday. The client opens it on Thursday. What do they see?",
          options: [
            "Three fewer days than you reported, because TODAY() recalculates when the file opens",
            "The same number you saw on Monday",
            "#VALUE!, because TODAY() cannot be saved",
            "A negative number",
          ],
          correctIndex: 0,
          explanation:
            "TODAY() is volatile. For a dated report, paste the value or state the as-of date in the email.",
        },
        {
          id: "pma-excel-dates-networkdays-q7",
          prompt: "Why can you subtract one date from another in Excel?",
          options: [
            "Dates are stored as serial numbers (days since a start date), so subtraction gives days",
            "Excel converts dates to text first",
            "Only Excel tables allow date maths",
            "Because the cells are formatted as dates",
          ],
          correctIndex: 0,
          explanation: "Formatting only changes how the serial number is shown. Text that looks like a date is not a serial number, which is why it breaks the maths.",
        },
        {
          id: "pma-excel-dates-networkdays-q8",
          prompt:
            "A US client asks for a four-week build starting Monday 2 November. Your India team has one office holiday that month, and the client's UAT reviewers are off for Thanksgiving (Thursday 26 and Friday 27 November). What should the plan show?",
          options: [
            "19 working days for the build, and no UAT feedback expected on 26-27 November",
            "20 working days, because client holidays do not affect your team",
            "28 days, because the client asked for four weeks",
            "16 working days, removing both client days and the office holiday from the build",
          ],
          correctIndex: 0,
          explanation:
            "Twenty weekdays minus your one office holiday gives 19 build days. Client holidays matter for the phases that need the client, such as UAT, not for your developers' build days.",
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "Plan the phases of a Laravel booking platform for a US client. Office holidays are in F2:F4. In D2:D4, count the working days of each phase with NETWORKDAYS, including the holidays. Total them in D5. In D7, give the UAT end date: 10 working days after QA ends, as text in yyyy-mm-dd format (wrap WORKDAY in TEXT).",
        grid: [
          ["Phase", "Start", "End", "Working days", "", "Office holidays"],
          ["Design", "2026-10-01", "2026-10-09", "", "", "2026-10-02"],
          ["Build", "2026-10-12", "2026-11-06", "", "", "2026-10-20"],
          ["QA", "2026-11-09", "2026-11-13", "", "", "2026-11-09"],
          ["Total", "", "", "", "", ""],
          ["", "", "", "", "", ""],
          ["UAT end (10 working days after QA)", "", "", "", "", ""],
        ],
        editable: ["D2", "D3", "D4", "D5", "D7"],
        checks: [
          { cell: "D2", expected: 6, tolerance: 0.01, requireFormula: true, functions: ["NETWORKDAYS"] },
          { cell: "D3", expected: 19, tolerance: 0.01, requireFormula: true, functions: ["NETWORKDAYS"] },
          { cell: "D4", expected: 4, tolerance: 0.01, requireFormula: true, functions: ["NETWORKDAYS"] },
          { cell: "D5", expected: 29, tolerance: 0.01, requireFormula: true, functions: [] },
          { cell: "D7", expected: "2026-11-27", tolerance: 0.01, requireFormula: true, functions: ["WORKDAY"] },
        ],
        solution: {
          D2: "=NETWORKDAYS(B2,C2,F2:F4)",
          D3: "=NETWORKDAYS(B3,C3,F2:F4)",
          D4: "=NETWORKDAYS(B4,C4,F2:F4)",
          D5: "=SUM(D2:D4)",
          D7: '=TEXT(WORKDAY(C4,10,F2:F4),"yyyy-mm-dd")',
        },
        explanation:
          "Design has 7 weekdays minus the 2 October holiday = 6. Build has 20 weekdays minus 20 October = 19. QA has 5 weekdays minus 9 November = 4. Total 29. Ten working days after Friday 13 November is Friday 27 November. But look at that date: it is the day after US Thanksgiving, so the client's reviewers may be away for the end of UAT. Raise it with the client now, not in UAT week.",
      },
      sop: [
        {
          title: "Holiday calendar and time-zone overlap",
          prompt:
            "[Oyelabs SOP – admin to fill] Where the official office holiday list lives (Keka or a shared sheet), how far ahead PMs must plan around holidays, and the agreed overlap hours with US, UK and Australian clients.",
        },
      ],
    },
    {
      id: "pma-excel-conditional-formatting-rag",
      moduleId: "pma-excel",
      trackId: "pm",
      title: "Conditional formatting for RAG",
      summary:
        "RAG status (Red, Amber, Green) is how most clients read a project at a glance. Red means it needs help now. Amber means at risk. Green means on track. The value of RAG is that it is consistent: the same rule gives the same colour every week, so a client who sees Amber knows it means the same thing it meant last month.\n\nThe reliable way to build it has two parts. First, a formula decides the status as text. For example: Red if the project is more than 5 days late or more than 15 points behind plan, Amber if it is late at all or more than 5 points behind, otherwise Green. In Excel that is a nested IF with OR: `=IF(OR(D2>5,B2-C2>15),\"Red\",IF(OR(D2>0,B2-C2>5),\"Amber\",\"Green\"))`. Second, conditional formatting colours the cell: Home > Conditional Formatting > Highlight Cells Rules > Text that Contains, one rule per colour. To colour the whole row, use a formula rule such as `=$E2=\"Red\"` applied to A2:E20. The dollar sign before E keeps every cell looking at the status column.\n\nCheck the Red test first. Excel's IF stops at the first true condition, so if you test Amber first, a badly late project shows Amber. Agree the thresholds with the client at kickoff and write them in the report legend.\n\nThe common mistakes: colouring cells by hand (they never update, and someone forgets to change one), and colour as the only signal. About one in twelve men has some colour vision deficiency, and printouts are often black and white, so keep the word Red, Amber or Green in the cell. Also avoid the \"watermelon\" project: green outside, red inside. If your rule makes everything Green while the team is worried, fix the rule, not the colours.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Support: Use conditional formatting to highlight information in Excel", url: "https://support.microsoft.com/en-us/excel/use-conditional-formatting-to-highlight-information-in-excel", kind: "docs", verifiedAt: "2026-10-02T09:35:37Z" },
        { label: "Microsoft Support: IF function", url: "https://support.microsoft.com/en-us/excel/functions/if-function", kind: "docs", verifiedAt: "2026-10-02T09:35:29Z" },
        { label: "ProjectManager: RAG Status in Project Management: Importance & Benefits", url: "https://www.projectmanager.com/blog/rag-status", kind: "article", verifiedAt: "2026-10-02T09:38:56Z" },
      ],
      video: {
        title: "Excel Conditional Formatting with Formula | Highlight Rows based on a cell value",
        channel: "Leila Gharani",
        url: "https://www.youtube.com/watch?v=XHT4paRaY4g",
        videoId: "XHT4paRaY4g",
        verifiedAt: "2026-10-02T09:35:59Z",
      },
      alternateVideos: [
        {
          title: "How to Use Conditional Formatting Traffic Lights in Excel (Step-by-Step Guide)",
          channel: "Mark's Excel Tips",
          url: "https://www.youtube.com/watch?v=uTww1o7C96Q",
          videoId: "uTww1o7C96Q",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
        {
          title: "Excel Conditional Formatting with Symbols and Icons (for better reports)",
          channel: "Leila Gharani",
          url: "https://www.youtube.com/watch?v=875eK_x4nyQ",
          videoId: "875eK_x4nyQ",
          verifiedAt: "2026-10-02T09:35:56Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-excel-conditional-formatting-rag-q1",
          prompt:
            "Your rule is: Red if more than 5 days late, Amber if late at all. Which formula is wrong?",
          options: [
            '=IF(D2>0,"Amber",IF(D2>5,"Red","Green"))',
            '=IF(D2>5,"Red",IF(D2>0,"Amber","Green"))',
            '=IF(D2<=0,"Green",IF(D2<=5,"Amber","Red"))',
            '=IFS(D2>5,"Red",D2>0,"Amber",TRUE,"Green")',
          ],
          correctIndex: 0,
          explanation:
            "IF stops at the first true test. A project 10 days late passes D2>0 first and shows Amber; the Red branch is never reached.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-conditional-formatting-rag-q2",
          prompt:
            "You want the whole row A2:E20 to turn red when the status in column E is \"Red\". Which formula rule do you use?",
          options: ['=$E2="Red"', '=E2="Red"', '=$E$2="Red"', '=E$2="Red"'],
          correctIndex: 0,
          explanation:
            "$E locks the column so every cell in the row checks column E; the unlocked row number moves down with each row. $E$2 would colour every row by row 2's status.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-conditional-formatting-rag-q3",
          prompt: "Why compute RAG with a formula instead of colouring cells by hand?",
          options: [
            "The formula applies the same agreed rule every week and updates when the data changes",
            "Hand-coloured cells cannot be printed",
            "Excel deletes manual colours when the file is shared",
            "Clients can only read formula results",
          ],
          correctIndex: 0,
          explanation: "Manual colours go stale and depend on someone's mood. A rule is consistent, auditable and explains itself.",
        },
        {
          id: "pma-excel-conditional-formatting-rag-q4",
          prompt: "Which make a RAG report easier to trust and read? (Select all that apply.)",
          options: [
            "Keep the words Red/Amber/Green in the cell, not just the colour",
            "Agree the thresholds with the client at kickoff and show them in a legend",
            "Explain every Red and Amber with a cause and a next step",
            "Mark projects Green until the client complains, to avoid alarm",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Words help colour-blind readers and grayscale prints, agreed thresholds make the colours mean something, and a next step turns a colour into action. Hiding problems makes a watermelon project.",
        },
        {
          id: "pma-excel-conditional-formatting-rag-q5",
          prompt:
            "Under the rule \"Red if more than 15 points behind plan\", a project is planned at 90% and actually at 75%. What is it?",
          options: ["Not Red on this rule: 15 is not more than 15", "Red", "#VALUE!", "It depends on the colour of the cell"],
          correctIndex: 0,
          explanation:
            "\"More than\" is > not >=. Boundary cases are where clients challenge your status, so be precise and write the rule down.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-conditional-formatting-rag-q6",
          prompt: "Two conditional formatting rules both apply to a cell: one makes it red, one makes it green. Which colour shows?",
          options: [
            "The rule higher in the Conditional Formatting Rules Manager list wins",
            "The rule created most recently, always",
            "The cell turns brown",
            "Green, because it is the default",
          ],
          correctIndex: 0,
          explanation: "Rules are applied in the order shown in the Rules Manager. When formats conflict, the higher rule wins. Reorder rules there.",
        },
        {
          id: "pma-excel-conditional-formatting-rag-q7",
          prompt:
            "Every project in your portfolio has been Green for six weeks, yet the team says the React app is in trouble. What should you do first?",
          options: [
            "Review the RAG rule and inputs: they are missing the real risk",
            "Keep it Green until a milestone is actually missed",
            "Turn the cell Amber by hand",
            "Remove the RAG column from the report",
          ],
          correctIndex: 0,
          explanation:
            "A watermelon status (green outside, red inside) means the rule measures the wrong thing. Fix the rule and its inputs, then report honestly.",
        },
        {
          id: "pma-excel-conditional-formatting-rag-q8",
          prompt: "Which formula counts the Red projects in E2:E20?",
          options: ['=COUNTIF(E2:E20,"Red")', '=SUMIF(E2:E20,"Red")', '=COUNT(E2:E20,"Red")', "=COUNTIF(E2:E20,Red)"],
          correctIndex: 0,
          explanation: "COUNTIF counts matching cells; the text criterion needs quotes. COUNT only counts numbers.",
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "Fill the RAG column (E2:E7) for this portfolio with one formula per row. The agreed rule: Red if more than 5 days late OR more than 15 points behind plan (Planned % minus Actual %). Amber if late at all OR more than 5 points behind. Otherwise Green. Then count the Red projects in E9.",
        grid: [
          ["Project", "Planned %", "Actual %", "Days late", "RAG"],
          ["Laravel CRM (UK)", "60", "58", "0", ""],
          ["React dashboard (US)", "80", "70", "2", ""],
          ["Flutter app (AU)", "50", "30", "3", ""],
          ["Shopify sync (UK)", "40", "34", "0", ""],
          ["Payments API (US)", "90", "75", "5", ""],
          ["Admin portal (CA)", "70", "72", "7", ""],
          ["", "", "", "", ""],
          ["Red projects", "", "", "", ""],
        ],
        editable: ["E2", "E3", "E4", "E5", "E6", "E7", "E9"],
        checks: [
          { cell: "E2", expected: "Green", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
          { cell: "E3", expected: "Amber", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
          { cell: "E4", expected: "Red", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
          { cell: "E5", expected: "Amber", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
          { cell: "E6", expected: "Amber", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
          { cell: "E7", expected: "Red", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
          { cell: "E9", expected: 2, tolerance: 0.01, requireFormula: true, functions: ["COUNTIF"] },
        ],
        solution: {
          E2: '=IF(OR(D2>5,B2-C2>15),"Red",IF(OR(D2>0,B2-C2>5),"Amber","Green"))',
          E3: '=IF(OR(D3>5,B3-C3>15),"Red",IF(OR(D3>0,B3-C3>5),"Amber","Green"))',
          E4: '=IF(OR(D4>5,B4-C4>15),"Red",IF(OR(D4>0,B4-C4>5),"Amber","Green"))',
          E5: '=IF(OR(D5>5,B5-C5>15),"Red",IF(OR(D5>0,B5-C5>5),"Amber","Green"))',
          E6: '=IF(OR(D6>5,B6-C6>15),"Red",IF(OR(D6>0,B6-C6>5),"Amber","Green"))',
          E7: '=IF(OR(D7>5,B7-C7>15),"Red",IF(OR(D7>0,B7-C7>5),"Amber","Green"))',
          E9: '=COUNTIF(E2:E7,"Red")',
        },
        explanation:
          "The Payments API row is the trap: exactly 5 days late and exactly 15 points behind. Neither is \"more than\", so it is Amber, not Red. The Admin portal is ahead of plan but 7 days late, so it is Red: being ahead on work does not cancel a missed date. Testing Red first in the IF is what makes the Flutter app Red rather than Amber.",
      },
    },
    {
      id: "pma-excel-pivot-tables-charts",
      moduleId: "pma-excel",
      trackId: "pm",
      title: "Pivot tables and charts",
      summary:
        "A pivot table turns a long list into a summary in seconds. Give it 3,000 timesheet rows and it tells you hours per client per month, billable vs non-billable per person, or bugs by severity and status. For an agency PM this is the fastest way to answer \"how many hours did we spend on the Brightline app in September?\" when the client's finance team asks before paying an invoice.\n\nStep by step: make sure your data is a clean list with one header row, no blank rows and no merged cells. Ideally make it a table (Ctrl+T) so new rows are picked up. Click inside it and choose Insert > PivotTable. Drag Client to Rows, Month to Columns and Hours to Values. Check that Values says Sum of Hours, not Count of Hours. Insert > PivotChart gives you a chart that follows the pivot. Slicers add buttons to filter by client or person on a call.\n\nUnder the hood, a pivot does what SUMIFS does, one cell at a time. That matters. A SUMIFS summary updates live and can sit inside a formatted client report. A pivot is faster to build and explore, but it does not update until you click Refresh (Data > Refresh All). Many PMs explore with a pivot and then build the final report with SUMIFS.\n\nCommon mistakes: forgetting to refresh, so the chart in your status deck shows last week's numbers. \"Count of Hours\" instead of Sum, which happens when some hours are stored as text. A source range that does not include new rows, which happens when the source is a fixed range rather than a table. And charts that mislead: a bar chart whose axis starts at 80 makes a small difference look huge. For clients, keep charts simple: bars for comparisons, lines for trends over time.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Microsoft Support: Create a PivotTable to analyze worksheet data", url: "https://support.microsoft.com/en-us/excel/get-started/create-a-pivottable-to-analyze-worksheet-data", kind: "docs", verifiedAt: "2026-10-02T09:35:43Z" },
        { label: "Microsoft Support: Create a PivotChart", url: "https://support.microsoft.com/en-us/excel/get-started/create-a-pivotchart", kind: "docs", verifiedAt: "2026-10-02T09:35:41Z" },
        { label: "Microsoft Support: Create a chart from start to finish", url: "https://support.microsoft.com/en-us/excel/get-started/create-a-chart-from-start-to-finish", kind: "docs", verifiedAt: "2026-10-02T09:35:39Z" },
      ],
      video: {
        title: "Excel Pivot Table EXPLAINED in 10 Minutes (Productivity tips included!)",
        channel: "Leila Gharani",
        url: "https://www.youtube.com/watch?v=UsdedFoTA68",
        videoId: "UsdedFoTA68",
        verifiedAt: "2026-10-02T09:35:57Z",
      },
      alternateVideos: [
        {
          title: "Pivot Table Excel | Step-by-Step Tutorial",
          channel: "Kevin Stratvert",
          url: "https://www.youtube.com/watch?v=dvbLrwD2SpA",
          videoId: "dvbLrwD2SpA",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
        {
          title: "Excel Charts and Graphs Tutorial",
          channel: "Kevin Stratvert",
          url: "https://www.youtube.com/watch?v=eHtZrIb0oWY",
          videoId: "eHtZrIb0oWY",
          verifiedAt: "2026-10-02T09:35:56Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-excel-pivot-tables-charts-q1",
          prompt:
            "You added this week's timesheet rows to the source data, but the pivot in your status deck still shows last week's totals. Why?",
          options: [
            "Pivots do not update until you refresh them (Data > Refresh All)",
            "Pivots only read the first 1,000 rows",
            "The new rows must be sorted first",
            "The chart needs to be deleted and re-created",
          ],
          correctIndex: 0,
          explanation:
            "Unlike formulas, a pivot keeps a cache of the data and needs a refresh. If the source is a fixed range rather than a table, new rows may also sit outside it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-pivot-tables-charts-q2",
          prompt: "Your pivot shows \"Count of Hours\" instead of \"Sum of Hours\" when you drag Hours into Values. What is the most likely cause?",
          options: [
            "Some Hours cells are text or blank, so Excel defaults to Count",
            "The pivot has too many rows",
            "Hours must be in the first column",
            "Count is always the default for every field",
          ],
          correctIndex: 0,
          explanation:
            "Excel defaults to Sum for numeric fields and Count when the column contains text or blanks. Fix the data, then set the value field to Sum.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-pivot-tables-charts-q3",
          prompt: "What should your data look like before you insert a pivot? (Select all that apply.)",
          options: [
            "One header row with a unique name for each column",
            "No blank rows or merged cells in the data",
            "Ideally an Excel table, so new rows are included",
            "Subtotal rows after each client",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A pivot needs a clean flat list. Subtotal rows in the source would be counted again as data.",
        },
        {
          id: "pma-excel-pivot-tables-charts-q4",
          prompt: "The client's finance team asks for hours per client per month. Which pivot layout gives that?",
          options: [
            "Client in Rows, Month in Columns, Sum of Hours in Values",
            "Hours in Rows, Client in Values",
            "Month in Filters, Hours in Columns",
            "Client in Values, Month in Rows",
          ],
          correctIndex: 0,
          explanation: "Categories go in Rows and Columns; the number you summarise goes in Values.",
        },
        {
          id: "pma-excel-pivot-tables-charts-q5",
          prompt: "When would you build a client report summary with SUMIFS instead of a pivot?",
          options: [
            "When the summary must stay live and sit in a fixed, formatted layout",
            "Never: pivots are always better",
            "When the data has fewer than 10 rows",
            "When you need to filter by client",
          ],
          correctIndex: 0,
          explanation:
            "SUMIFS recalculates automatically and keeps your layout. Pivots are best for exploring and quick answers.",
        },
        {
          id: "pma-excel-pivot-tables-charts-q6",
          prompt: "Which chart best shows weekly hours burned on a project over the last 12 weeks?",
          options: ["A line chart with weeks along the bottom", "A pie chart with 12 slices", "A 3D column chart", "A doughnut chart"],
          correctIndex: 0,
          explanation: "Lines show trends over time. Pies with many slices are hard to read, and 3D effects distort size.",
        },
        {
          id: "pma-excel-pivot-tables-charts-q7",
          prompt:
            "Your bar chart compares two months: 92 h and 96 h. The axis starts at 90, so one bar looks three times taller. What is the problem?",
          options: [
            "A truncated axis exaggerates a small difference and can mislead the client",
            "Nothing, Excel picked the best axis",
            "Bars should always be sorted",
            "The chart should be a pie instead",
          ],
          correctIndex: 0,
          explanation:
            "For bar charts, start the axis at zero. A 4% change should look like a 4% change.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-pivot-tables-charts-q8",
          prompt: "On a live call, the client wants to switch the pivot between their three apps with one click. What do you add?",
          options: ["A slicer for the App field", "A second pivot per app", "Data validation on the source", "Freeze panes"],
          correctIndex: 0,
          explanation: "Slicers are clickable filter buttons for pivots and pivot charts.",
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "Build by hand the summary a pivot would give you. The timesheet rows are in A2:C10. In F2:G4, use SUMIFS to give hours per client (column E) per month (row 1). Then total each client in H2:H4.",
        grid: [
          ["Client", "Month", "Hours", "", "Client", "Sep", "Oct", "Total"],
          ["Acme UK", "Sep", "120", "", "Acme UK", "", "", ""],
          ["Brightline AU", "Sep", "80", "", "Brightline AU", "", "", ""],
          ["Acme UK", "Oct", "140", "", "Northwind US", "", "", ""],
          ["Northwind US", "Sep", "60", "", "", "", "", ""],
          ["Brightline AU", "Oct", "95", "", "", "", "", ""],
          ["Acme UK", "Sep", "30", "", "", "", "", ""],
          ["Northwind US", "Oct", "75", "", "", "", "", ""],
          ["Brightline AU", "Sep", "20", "", "", "", "", ""],
          ["Northwind US", "Oct", "15", "", "", "", "", ""],
        ],
        editable: ["F2", "G2", "F3", "G3", "F4", "G4", "H2", "H3", "H4"],
        checks: [
          { cell: "F2", expected: 150, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
          { cell: "G2", expected: 140, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
          { cell: "F3", expected: 100, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
          { cell: "G3", expected: 95, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
          { cell: "F4", expected: 60, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
          { cell: "G4", expected: 90, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
          { cell: "H4", expected: 150, tolerance: 0.01, requireFormula: true, functions: [] },
        ],
        solution: {
          F2: "=SUMIFS($C$2:$C$10,$A$2:$A$10,$E2,$B$2:$B$10,F$1)",
          G2: "=SUMIFS($C$2:$C$10,$A$2:$A$10,$E2,$B$2:$B$10,G$1)",
          F3: "=SUMIFS($C$2:$C$10,$A$2:$A$10,$E3,$B$2:$B$10,F$1)",
          G3: "=SUMIFS($C$2:$C$10,$A$2:$A$10,$E3,$B$2:$B$10,G$1)",
          F4: "=SUMIFS($C$2:$C$10,$A$2:$A$10,$E4,$B$2:$B$10,F$1)",
          G4: "=SUMIFS($C$2:$C$10,$A$2:$A$10,$E4,$B$2:$B$10,G$1)",
          H2: "=F2+G2",
          H3: "=F3+G3",
          H4: "=F4+G4",
        },
        explanation:
          "Acme UK has two September rows (120 + 30), which is why you sum rather than look up. Using $ to lock the data ranges, $E to lock the client column and F$1 to lock the month row lets one formula be copied across the whole block. This is exactly what a pivot computes, but it stays live and keeps your report layout.",
      },
    },
    {
      id: "pma-google-sheets-equivalents",
      moduleId: "pma-excel",
      trackId: "pm",
      title: "Google Sheets equivalents",
      summary:
        "Many overseas clients, especially startups, live in Google Workspace. They will share a Google Sheet for the backlog, the bug list or the UAT feedback, and expect you to work in it. You do not need to learn a new tool. Most of what you know from Excel works the same way in Sheets.\n\nThe core functions match. SUM, AVERAGE, IF, COUNTIF, COUNTIFS, SUMIF, SUMIFS, XLOOKUP, NETWORKDAYS and WORKDAY all exist in Sheets with the same arguments. Conditional formatting lives under Format > Conditional formatting, and \"Custom formula is\" works like Excel's formula rule, so `=$E2=\"Red\"` still colours a whole row. Drop-downs are under Data > Data validation. Pivot tables are under Insert > Pivot table.\n\nSome things differ. Sheets has functions Excel users rarely know, such as QUERY (SQL-like summaries), IMPORTRANGE (pull data from another sheet) and GOOGLEFINANCE. Excel has things Sheets lacks, such as VBA macros (Sheets uses Apps Script instead) and Power Query. Protection is done with Data > Protect sheets and ranges, and you can choose \"Show a warning\" instead of blocking edits. Version history (File > Version history) shows who changed what and lets you restore an older version, which is very useful when a client's cell was overwritten.\n\nStep by step when a client shares a sheet: check whether you have Viewer, Commenter or Editor access. Ask before adding columns or formulas to their sheet, since it is their document. Build your own calculations in a separate tab or your own file, pulling from theirs. Common mistake: downloading their sheet as .xlsx, editing it, and emailing it back. Now there are two versions and the client's team keeps working on the old one. Stay in their sheet, or agree clearly which file is the master.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Google Docs Editors Help: Google Sheets function list", url: "https://support.google.com/docs/table/25273", kind: "docs", verifiedAt: "2026-10-02T09:35:48Z" },
        { label: "Google Docs Editors Help: XLOOKUP function", url: "https://support.google.com/docs/answer/12405947", kind: "docs", verifiedAt: "2026-10-02T09:35:20Z" },
        { label: "Google Docs Editors Help: SUMIFS function", url: "https://support.google.com/docs/answer/3238496", kind: "docs", verifiedAt: "2026-10-02T09:35:45Z" },
        { label: "Google Docs Editors Help: Use conditional formatting rules in Google Sheets", url: "https://support.google.com/docs/answer/78413", kind: "docs", verifiedAt: "2026-10-02T09:35:22Z" },
      ],
      video: {
        title: "Google Sheets Tutorial for Beginners",
        channel: "Kevin Stratvert",
        url: "https://www.youtube.com/watch?v=TENAbUa-R-w",
        videoId: "TENAbUa-R-w",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      alternateVideos: [
        {
          title: "How to Use COUNTIFS & SUMIFS in Google Sheets | Multi-Condition Formulas",
          channel: "Sheetomatic",
          url: "https://www.youtube.com/watch?v=wMUHBa82bPE",
          videoId: "wMUHBa82bPE",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-google-sheets-equivalents-q1",
          prompt: "Which of these Excel formulas work the same way in Google Sheets? (Select all that apply.)",
          options: [
            '=SUMIFS(D2:D50,B2:B50,"Acme",C2:C50,"Y")',
            '=XLOOKUP("BUG-107",A2:A50,D2:D50,"Not found")',
            "=NETWORKDAYS(B2,C2,F2:F4)",
            "A VBA macro attached to a button",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "SUMIFS, XLOOKUP and NETWORKDAYS exist in Sheets with the same arguments. VBA does not run in Sheets; it uses Apps Script.",
        },
        {
          id: "pma-google-sheets-equivalents-q2",
          prompt:
            "The client's QA lead says a cell in their UAT sheet was overwritten yesterday and the original comment is gone. What do you do in Google Sheets?",
          options: [
            "Open File > Version history, find yesterday's version and restore or copy the old value",
            "Ask everyone to retype their comments",
            "Download the file and check the .xlsx",
            "Nothing can be done once a cell is overwritten",
          ],
          correctIndex: 0,
          explanation: "Version history shows who changed what and when, and lets you restore an older version or copy from it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-google-sheets-equivalents-q3",
          prompt:
            "A client shares their Google Sheet backlog with you. You need extra columns for your own estimates. What is the best approach?",
          options: [
            "Ask first, and keep your calculations in your own tab or file that reads from theirs",
            "Add the columns straight into their main tab",
            "Download it as .xlsx, add the columns and email it back",
            "Rebuild the backlog in your own Excel file and stop using theirs",
          ],
          correctIndex: 0,
          explanation:
            "It is the client's document. Asking and keeping your workings separate avoids breaking their filters and formulas, and avoids two masters.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-google-sheets-equivalents-q4",
          prompt: "Where do you set a drop-down list for a Status column in Google Sheets?",
          options: ["Data > Data validation", "Format > Number", "Insert > Checkbox", "Tools > Notification rules"],
          correctIndex: 0,
          explanation: "Like Excel, drop-downs are a data validation rule.",
        },
        {
          id: "pma-google-sheets-equivalents-q5",
          prompt: "In Google Sheets, how do you colour a whole row when the status in column E is \"Red\"?",
          options: [
            'Format > Conditional formatting, apply to A2:E50, \"Custom formula is\" =$E2="Red"',
            "Select the row and use the fill colour by hand",
            'Data > Data validation with the text "Red"',
            "Use a filter on column E",
          ],
          correctIndex: 0,
          explanation: "Custom formula rules work like Excel's formula rules, including the $ to lock the status column.",
        },
        {
          id: "pma-google-sheets-equivalents-q6",
          prompt: "You need numbers from the client's separate \"Bug log\" spreadsheet in your own summary sheet. Which Google Sheets function is built for this?",
          options: ["IMPORTRANGE", "XLOOKUP", "GOOGLEFINANCE", "INDIRECT"],
          correctIndex: 0,
          explanation: "IMPORTRANGE pulls a range from another spreadsheet (after you allow access once). XLOOKUP only looks inside ranges you already have.",
        },
        {
          id: "pma-google-sheets-equivalents-q7",
          prompt:
            "You want the client's team warned, but not blocked, when they edit the formula columns of a shared sheet. What do you use?",
          options: [
            "Data > Protect sheets and ranges, with \"Show a warning when editing this range\"",
            "Make the sheet view-only for everyone",
            "Hide the formula columns",
            "Add a comment asking people not to edit",
          ],
          correctIndex: 0,
          explanation: "Sheets protection can either restrict editors or just warn. Hiding columns does not stop edits.",
        },
        {
          id: "pma-google-sheets-equivalents-q8",
          prompt: "Your XLOOKUP for a bug ID shows #N/A in the client's sheet when the ID is missing. How do you show \"Not found\" instead?",
          options: [
            'Add the fourth argument: =XLOOKUP(id,A2:A50,D2:D50,"Not found")',
            "Sort the bug list first",
            "Use a filter",
            "There is no way to do this in Sheets",
          ],
          correctIndex: 0,
          explanation: "XLOOKUP's missing-value argument works the same in Sheets as in Excel.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "Your US client's QA lead tracks UAT bugs in a Google Sheet. These formulas work the same in Sheets and Excel. In G2, count the open (any status except Closed) Critical bugs with COUNTIFS. In G3, find the assignee of BUG-107 with XLOOKUP. In G4, look up BUG-200 the same way, showing \"Not found\" if it is missing. In G5, add up the estimated fix hours of all open bugs with SUMIFS.",
        grid: [
          ["ID", "Severity", "Status", "Assignee", "Fix (h)", "", ""],
          ["BUG-101", "Critical", "Open", "Ravi", "6", "", ""],
          ["BUG-102", "Minor", "Closed", "Meera", "1", "Open critical bugs", ""],
          ["BUG-103", "Critical", "In progress", "Arjun", "4", "Assignee of BUG-107", ""],
          ["BUG-104", "Major", "Open", "Meera", "3", "Assignee of BUG-200", ""],
          ["BUG-105", "Critical", "Closed", "Ravi", "5", "Open fix hours", ""],
          ["BUG-106", "Minor", "Open", "Arjun", "2", "", ""],
          ["BUG-107", "Major", "In progress", "Divya", "8", "", ""],
          ["BUG-108", "Critical", "Open", "Divya", "7", "", ""],
        ],
        editable: ["G2", "G3", "G4", "G5"],
        checks: [
          { cell: "G2", expected: 3, tolerance: 0.01, requireFormula: true, functions: ["COUNTIFS"] },
          { cell: "G3", expected: "Divya", tolerance: 0.01, requireFormula: true, functions: ["XLOOKUP"] },
          { cell: "G4", expected: "Not found", tolerance: 0.01, requireFormula: true, functions: ["XLOOKUP"] },
          { cell: "G5", expected: 30, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
        ],
        solution: {
          G2: '=COUNTIFS(B2:B9,"Critical",C2:C9,"<>Closed")',
          G3: '=XLOOKUP("BUG-107",A2:A9,D2:D9)',
          G4: '=XLOOKUP("BUG-200",A2:A9,D2:D9,"Not found")',
          G5: '=SUMIFS(E2:E9,C2:C9,"<>Closed")',
        },
        explanation:
          "\"Open\" here means anything not Closed, so In progress counts: BUG-101, BUG-103 and BUG-108 are the three open Critical bugs. Counting only Status = \"Open\" would give 2 and under-report risk to the client. Open fix hours are 6 + 4 + 3 + 2 + 8 + 7 = 30. BUG-200 does not exist, and the fourth XLOOKUP argument shows a clear message instead of #N/A.",
      },
    },
    {
      id: "pma-excel-trackers",
      moduleId: "pma-excel",
      trackId: "pm",
      title: "Building trackers: project, Gantt, resource, budget vs actuals, RAID",
      summary:
        "This is where the module comes together. An agency PM usually keeps five trackers, often as tabs in one workbook. A project tracker lists tasks, owners, status and dates. A simple Gantt shows the plan on a timeline. A resource sheet shows who works on what, and how many hours. A budget vs actuals sheet compares hours (or money) planned with hours spent. A RAID log records Risks, Assumptions, Issues and Dependencies (some teams use D for Decisions).\n\nThe budget vs actuals sheet is the one that protects margin on a fixed-bid project. For each phase, show the budget hours, actual hours, percent complete, burn (actual divided by budget) and a forecast at completion. A simple forecast is actual divided by percent complete: if Backend has used 150 of 200 hours and is 60% done, it will need about 250. That 50-hour overrun is what you raise with the client now, as a change request or a scope trade, not after the money is gone. Burn alone hides this: 75% burned sounds fine until you see only 60% is done.\n\nA Gantt chart in Excel can be a stacked bar chart, as Microsoft describes, or a grid of dates with a conditional formatting rule such as `=AND(F$1>=$B2,F$1<=$C2)` that colours the days each task runs. The RAID log needs an owner, a date raised, a next review date and a status for every line. A RAID log with no owners is just a worry list.\n\nCommon mistakes: building one giant sheet that tries to be all five; percent complete typed as a guess (\"90% done\" for three weeks); and forecasts that divide by zero for phases not started. Use IF to fall back to the budget when nothing is done yet. Where your templates live, and the rate card that turns hours into money, are in your team's SOP below.",
      level: "advanced",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "Microsoft Support: Present your data in a Gantt chart in Excel", url: "https://support.microsoft.com/en-us/excel/present-your-data-in-a-gantt-chart-in-excel", kind: "docs", verifiedAt: "2026-10-02T09:35:30Z" },
        { label: "Asana: RAID Log: Track Risks, Assumptions, Issues & Decisions", url: "https://asana.com/resources/raid-log", kind: "article", verifiedAt: "2026-10-02T09:38:40Z" },
        { label: "ProjectManager: What Is a RAID Log and Why Should I Use One?", url: "https://www.projectmanager.com/blog/raid-log-use-one", kind: "article", verifiedAt: "2026-10-02T09:38:57Z" },
      ],
      video: {
        title: "Make This Awesome Gantt Chart in Excel (for Project Management)",
        channel: "Kenji Explains",
        url: "https://www.youtube.com/watch?v=1y40xTIEKbs",
        videoId: "1y40xTIEKbs",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      alternateVideos: [
        {
          title: "How to Use RAID Log in REAL-LIFE Project (+ Template)",
          channel: "Tactical Project Manager",
          url: "https://www.youtube.com/watch?v=inZI16nIvdo",
          videoId: "inZI16nIvdo",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
        {
          title: "Team Capacity Planner for Excel: Easily allocate and watch workload",
          channel: "Tactical Project Manager",
          url: "https://www.youtube.com/watch?v=oiBZb--8Mqg",
          videoId: "oiBZb--8Mqg",
          verifiedAt: "2026-10-02T09:35:59Z",
        },
        {
          title: "Gantt Chart with Conditional Formatting in Excel? Done in 3 Minutes! (No Add-ins)",
          channel: "Analytics Success",
          url: "https://www.youtube.com/watch?v=U4gVKFEkN2U",
          videoId: "U4gVKFEkN2U",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-excel-trackers-q1",
          prompt:
            "Backend has a budget of 200 h, has used 150 h and is 60% complete. What is a simple forecast at completion, and what does it tell you?",
          options: [
            "250 h: about 50 h over budget, which you should raise now",
            "200 h: it is on budget because 75% burned is close to 60%",
            "240 h: budget plus 20%",
            "90 h: the hours left to spend",
          ],
          correctIndex: 0,
          explanation:
            "Actual divided by percent complete (150 / 0.6) gives 250 h. Burn of 75% against 60% done is the early warning that burn alone hides.",
        },
        {
          id: "pma-excel-trackers-q2",
          prompt:
            "Your forecast formula is =C5/D5*100, and the QA phase has not started (D5 = 0). What happens, and how do you fix it?",
          options: [
            "#DIV/0!; use =IF(D5=0,B5,C5/D5*100) to fall back to the budget",
            "It returns 0, which is correct for a phase not started",
            "It returns the budget automatically",
            "It returns #VALUE!; format D5 as a percentage",
          ],
          correctIndex: 0,
          explanation:
            "Dividing by zero errors, and the error then breaks the total row too. Falling back to the budget is the honest forecast for unstarted work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-trackers-q3",
          prompt: "What does every line in a useful RAID log need? (Select all that apply.)",
          options: ["An owner", "A next action or review date", "A status (open, closed, escalated)", "The client's approval before you add it"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Owners, dates and status turn a list of worries into a managed log. Many internal risks never need client approval to be logged.",
        },
        {
          id: "pma-excel-trackers-q4",
          prompt:
            "Classify: \"The client's payment gateway sandbox credentials have still not arrived, and the Stripe work cannot start without them.\"",
          options: ["Dependency (and an Issue if it is already blocking work)", "Assumption", "Decision", "Risk only"],
          correctIndex: 0,
          explanation:
            "Work depends on something the client must deliver. Once it is blocking, it is also an issue happening now, not a possible future risk.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-trackers-q5",
          prompt: "Which is an Assumption you should record in the RAID log?",
          options: [
            "\"The client's existing API will return order data in under 2 seconds\"",
            "\"The API returned 500 errors in staging yesterday\"",
            "\"We agreed to drop the Android tablet layout\"",
            "\"Ravi is on leave next week\"",
          ],
          correctIndex: 0,
          explanation:
            "An assumption is something you plan on as true but have not confirmed. The others are an issue, a decision and a known fact for the resource plan.",
        },
        {
          id: "pma-excel-trackers-q6",
          prompt:
            "A developer has reported \"90% done\" on the same task for three weeks. What should your tracker do about it?",
          options: [
            "Use a stricter measure, such as done/not done per sub-task or remaining hours, instead of a guessed percentage",
            "Accept it, because the developer knows best",
            "Mark it 100% to keep the report green",
            "Remove the percent complete column",
          ],
          correctIndex: 0,
          explanation:
            "Guessed percentages stall near 90%. Smaller tasks with a binary done state, or an estimate of remaining hours, give a real forecast.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-excel-trackers-q7",
          prompt:
            "In a date-grid Gantt, dates run across row 1 from column F, and each task's start and end are in B and C. Which conditional formatting rule, applied to F2:AZ20, fills the days a task runs?",
          options: ["=AND(F$1>=$B2,F$1<=$C2)", "=AND(F1>=B2,F1<=C2)", "=OR($F$1>=$B$2,$F$1<=$C$2)", "=F$1=$B2"],
          correctIndex: 0,
          explanation:
            "F$1 keeps the date row fixed, $B2 and $C2 keep the start/end columns fixed, and AND requires both conditions. Without the $ signs the references drift as the rule applies across the grid.",
        },
        {
          id: "pma-excel-trackers-q8",
          prompt: "Why keep the trackers as separate, linked tabs rather than one giant sheet?",
          options: [
            "Each answers a different question for a different audience, and smaller sheets are easier to keep correct",
            "Excel cannot hold more than 100 columns",
            "Clients are not allowed to see more than one tab",
            "Formulas cannot refer to other columns in the same sheet",
          ],
          correctIndex: 0,
          explanation:
            "The client sees the tracker and Gantt; the budget stays internal. Separate tabs with clear links also make errors easier to find.",
        },
        {
          id: "pma-excel-trackers-q9",
          prompt:
            "Total budget is 480 h and the forecast at completion is 524 h. Your rule is Red over 10% overrun, Amber for any overrun. What status do you report, and what goes with it?",
          options: [
            "Amber (44 h is about 9% over), with the cause and a proposal such as a scope trade or change request",
            "Green, because it is under 10%",
            "Red, because any overrun on a fixed bid is Red",
            "No status until the project ends",
          ],
          correctIndex: 0,
          explanation:
            "44 / 480 is just over 9%, so Amber on this rule. A status without a cause and a next step does not help the client decide.",
        },
        {
          id: "pma-excel-trackers-q10",
          prompt: "Which sheets in your workbook should never go to the client as they are?",
          options: [
            "The budget sheet with internal cost rates and margin",
            "The Gantt chart",
            "The task tracker",
            "The client-facing RAID items",
          ],
          correctIndex: 0,
          explanation: "Internal rates and margin are confidential. Share a client view of the budget in hours or billed amounts if needed.",
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "Complete the budget vs actuals tracker for a fixed-bid Laravel + React project. Row 2 and row 4 show the formulas for each column. Fill F3:H3 for Backend, F5 for QA (it has not started, so fall back to the budget with IF), and the Total row: B6 and C6 (sums), F6 (sum of forecasts), G6 (forecast minus budget) and H6 (RAG: Red if the variance is more than 10% of the budget, Amber if it is above 0, otherwise Green).",
        grid: [
          ["Phase", "Budget (h)", "Actual (h)", "% complete", "Burn %", "Forecast (h)", "Variance (h)", "RAG"],
          ["Discovery", "40", "44", "100", "=ROUND(C2/B2*100,0)", "=IF(D2=0,B2,ROUND(C2/D2*100,0))", "=F2-B2", '=IF(G2>B2*0.1,"Red",IF(G2>0,"Amber","Green"))'],
          ["Backend (Laravel)", "200", "150", "60", "=ROUND(C3/B3*100,0)", "", "", ""],
          ["Frontend (React)", "160", "60", "40", "=ROUND(C4/B4*100,0)", "=IF(D4=0,B4,ROUND(C4/D4*100,0))", "=F4-B4", '=IF(G4>B4*0.1,"Red",IF(G4>0,"Amber","Green"))'],
          ["QA & UAT", "80", "0", "0", "=ROUND(C5/B5*100,0)", "", "=F5-B5", '=IF(G5>B5*0.1,"Red",IF(G5>0,"Amber","Green"))'],
          ["Total", "", "", "", "", "", "", ""],
        ],
        editable: ["F3", "G3", "H3", "F5", "B6", "C6", "F6", "G6", "H6"],
        checks: [
          { cell: "F3", expected: 250, tolerance: 0.01, requireFormula: true, functions: [] },
          { cell: "G3", expected: 50, tolerance: 0.01, requireFormula: true, functions: [] },
          { cell: "H3", expected: "Red", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
          { cell: "F5", expected: 80, tolerance: 0.01, requireFormula: true, functions: ["IF"] },
          { cell: "B6", expected: 480, tolerance: 0.01, requireFormula: true, functions: ["SUM"] },
          { cell: "C6", expected: 254, tolerance: 0.01, requireFormula: true, functions: ["SUM"] },
          { cell: "F6", expected: 524, tolerance: 0.01, requireFormula: true, functions: [] },
          { cell: "G6", expected: 44, tolerance: 0.01, requireFormula: true, functions: [] },
          { cell: "H6", expected: "Amber", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
        ],
        solution: {
          F3: "=IF(D3=0,B3,ROUND(C3/D3*100,0))",
          G3: "=F3-B3",
          H3: '=IF(G3>B3*0.1,"Red",IF(G3>0,"Amber","Green"))',
          F5: "=IF(D5=0,B5,ROUND(C5/D5*100,0))",
          B6: "=SUM(B2:B5)",
          C6: "=SUM(C2:C5)",
          F6: "=SUM(F2:F5)",
          G6: "=F6-B6",
          H6: '=IF(G6>B6*0.1,"Red",IF(G6>0,"Amber","Green"))',
        },
        explanation:
          "Backend is the story: 75% burned but only 60% done, so it forecasts 250 h, 50 h (25%) over: Red. Frontend is ahead (forecast 150 h against 160). QA falls back to its 80 h budget instead of #DIV/0!. Overall the project forecasts 524 h against 480: 44 h, about 9% over, so Amber. The Green frontend hides some of the Red backend in the total. Raise the backend overrun with the client now, with options, rather than waiting for the total to turn Red.",
      },
      sop: [
        {
          title: "Our tracker templates",
          prompt:
            "[Oyelabs SOP – admin to fill] Links to the standard project tracker, Gantt, resource sheet, budget vs actuals and RAID log templates, which tabs are client-facing, how often each must be updated, and which rate card converts hours into money for budget tracking.",
        },
      ],
    },
  ],
} satisfies Module;
