import type { Module } from "@/types/curriculum";

export default {
  id: "pma-word-ppt",
  trackId: "pm",
  name: "Word & PowerPoint for PMs",
  description:
    "The Word and PowerPoint skills an agency PM uses every week: SOWs and PRDs built on styles and templates, Track Changes reviews with clients, clean PDF exports, and simple status decks with charts from Excel.",
  refs: [
    { label: "Microsoft Support: Word help & learning", url: "https://support.microsoft.com/en-us/word/", kind: "docs", verifiedAt: "2026-10-02T09:35:24Z" },
    { label: "Microsoft Support: PowerPoint for Windows training", url: "https://support.microsoft.com/en-us/powerpoint/powerpoint-for-windows-training", kind: "docs", verifiedAt: "2026-10-02T09:35:29Z" },
  ],
  topics: [
    {
      id: "pma-word-styles-toc-templates",
      moduleId: "pma-word-ppt",
      trackId: "pm",
      title: "Styles, headings, automatic TOC and templates",
      summary:
        "Every PM writes the same few documents again and again: a statement of work (SOW), a PRD, a release note, a handover document. When each one is formatted by hand, the headings drift, the table of contents is typed and wrong, and the client sees a different look in every file. Word's styles fix this. A style is a named set of formatting, such as Heading 1 or Normal, that you apply with one click and change in one place.\n\nWhy it matters for an agency: the client judges our care by our documents. A SOW for a Laravel portal that has three different heading fonts and a TOC pointing to the wrong pages looks careless, even if the scope is perfect. Styles also power the Navigation pane, so you and the client can jump straight to \"Out of scope\" during a call.\n\nHow to do it: apply Heading 1 to each main section and Heading 2 to sub-sections. Never fake a heading with bold and a bigger font. Go to References > Table of Contents to insert an automatic TOC, built from those headings. After edits, click Update Table so the page numbers stay right. To change how all headings look, right-click the style and choose Modify, or format one heading and use \"Update Heading 1 to Match Selection\". When the layout is right, save the file as a Word template (.dotx), so the next SOW starts from the same structure.\n\nCommon mistake: a PM copies last month's SOW for a new client and edits it. Old client names hide in headers, comments and document properties, and the new client finds them. Start from a clean template instead. Your team's standard SOW and PRD templates are a team decision; use the shared ones, not a personal copy.",
      level: "beginner",
      estMinutes: 30,
      webRefs: [
        { label: "Microsoft Support: Insert a table of contents", url: "https://support.microsoft.com/en-us/word/training/insert-a-table-of-contents", kind: "docs", verifiedAt: "2026-10-02T09:35:27Z" },
        { label: "Microsoft Support: Customize or create new styles", url: "https://support.microsoft.com/en-us/word/customize-or-create-new-styles", kind: "docs", verifiedAt: "2026-10-02T09:35:21Z" },
        { label: "Microsoft Support: Create a template", url: "https://support.microsoft.com/en-us/word/create-a-template", kind: "docs", verifiedAt: "2026-10-02T09:35:29Z" },
      ],
      video: {
        title: "How to use Styles in Microsoft Word",
        channel: "Kevin Stratvert",
        url: "https://www.youtube.com/watch?v=UOVU6qQ2iOM",
        videoId: "UOVU6qQ2iOM",
        verifiedAt: "2026-10-02T09:35:53Z",
      },
      alternateVideos: [
        {
          title: "How to Create a Table of Contents in Word (Automatically!)",
          channel: "Kevin Stratvert",
          url: "https://www.youtube.com/watch?v=45s9VKQ6wEI",
          videoId: "45s9VKQ6wEI",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-word-styles-toc-templates-q1",
          prompt:
            "You add a new section \"Third-party integrations\" to a SOW. You made it bold, 16 pt, to look like the other headings. After updating the TOC, the section is missing. Why?",
          options: [
            "The TOC is built from heading styles, and the text is Normal style with manual formatting",
            "The TOC only updates when the file is closed and reopened",
            "A TOC can hold a fixed number of entries",
            "Bold text is excluded from the TOC on purpose",
          ],
          correctIndex: 0,
          explanation:
            "An automatic TOC reads Heading 1, 2, 3 styles, not how text looks. Apply Heading 1 and update the table; reopening the file changes nothing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-word-styles-toc-templates-q2",
          prompt: "The client wants all section headings in the SOW to be dark blue instead of black. What is the quickest correct way?",
          options: [
            "Modify the Heading 1 and Heading 2 styles once",
            "Select each heading and change its colour",
            "Use Find and Replace on the heading text",
            "Change the theme of the TOC only",
          ],
          correctIndex: 0,
          explanation: "Changing the style updates every heading that uses it. Formatting headings one by one is slow and you will miss some.",
        },
        {
          id: "pma-word-styles-toc-templates-q3",
          prompt: "You added two pages of scope to the PRD. The TOC still shows the old page numbers. What do you do?",
          options: [
            "Click the TOC and choose Update Table, then update the entire table",
            "Delete the TOC and type the page numbers by hand",
            "Nothing: Word updates page numbers in the TOC as you type",
            "Export to PDF, which fixes the numbers",
          ],
          correctIndex: 0,
          explanation:
            "The TOC is a field that you must refresh. It does not update live as you type, and a typed TOC goes stale again with the next edit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-word-styles-toc-templates-q4",
          prompt: "Which are real benefits of building a SOW on a Word template (.dotx) with styles? (Select all that apply.)",
          options: [
            "Every new SOW starts with the same sections and look",
            "The Navigation pane lets you jump to any section during a client call",
            "The automatic TOC stays correct after you update it",
            "The template checks the scope for missing features",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Templates and styles give consistency, navigation and a reliable TOC. They do not review the content; that is still the PM's job.",
        },
        {
          id: "pma-word-styles-toc-templates-q5",
          prompt:
            "A PM creates a new SOW for a US client by copying the SOW of a UK client and editing it. What is the biggest risk?",
          options: [
            "The old client's name or terms stay hidden in headers, comments or properties and the new client sees them",
            "Word will refuse to save a copied document",
            "The styles will reset to default",
            "The TOC will be deleted",
          ],
          correctIndex: 0,
          explanation:
            "Leftover names, rates and comments are an embarrassing and sometimes confidential leak. Start new documents from the clean template.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "A new client signed for a React web app. You need to produce their SOW from scratch so it matches the agency look and has a working TOC. Put the steps in the right order.",
        items: [
          { id: "template", label: "Create a new document from the shared SOW template (.dotx)" },
          { id: "headings", label: "Write the sections and apply Heading 1 and Heading 2 styles to section titles" },
          { id: "toc", label: "Insert the automatic table of contents from References" },
          { id: "review", label: "Review the content and check the Navigation pane shows every section" },
          { id: "update", label: "Update the entire TOC so page numbers are right" },
          { id: "pdf", label: "Export to PDF and send to the client" },
        ],
        correctOrder: ["template", "headings", "toc", "review", "update", "pdf"],
        explanation:
          "Start from the template so styles exist, apply heading styles as you write, insert the TOC once headings exist, review, then refresh the TOC as the last edit before the PDF. Updating the TOC before the final review risks stale page numbers.",
      },
    },
    {
      id: "pma-word-tables-headers-pdf",
      moduleId: "pma-word-ppt",
      trackId: "pm",
      title: "Tables, headers/footers and PDF export",
      summary:
        "Most client documents carry a table: a milestone plan, a payment schedule, a list of user roles, a test result summary. They also need a header or footer with the client name, the version and a page number. And they almost always leave the agency as a PDF, so the client cannot change them by accident and they look the same on every screen.\n\nWhy it matters: a payment schedule table that splits over two pages with no header row is hard to read. A footer that still says \"Draft v2\" on the signed version causes arguments later about which version was agreed. A PDF that still shows comments like \"is this rate too high?\" can damage a deal.\n\nHow to do it: insert tables from Insert > Table and use a table style instead of colouring cells by hand. For long tables, select the first row and turn on Repeat Header Rows, so the column names appear on every page. Add headers and footers from Insert > Header or Footer, and use a page number field, not typed numbers. Use \"Different First Page\" for a clean cover. When exporting, use File > Save As or Export and pick PDF. Check the options: create bookmarks from headings, and make sure you are publishing the document, not the document showing markup.\n\nCommon mistake: exporting to PDF straight from a file that still has comments and tracked changes. Before the final export, accept or reject every change, delete the comments, update the version in the footer, and open the PDF to check it page by page.",
      level: "beginner",
      estMinutes: 30,
      webRefs: [
        { label: "Microsoft Support: Insert a table", url: "https://support.microsoft.com/en-us/word/training/insert-a-table", kind: "docs", verifiedAt: "2026-10-02T09:35:24Z" },
        { label: "Microsoft Support: Insert a header or footer", url: "https://support.microsoft.com/en-us/word/training/insert-a-header-or-footer", kind: "docs", verifiedAt: "2026-10-02T09:35:38Z" },
        { label: "Microsoft Support: Save or convert to PDF or XPS in Office Desktop apps", url: "https://support.microsoft.com/en-us/office/collab-files/save-or-convert-to-pdf-or-xps-in-office-desktop-apps", kind: "docs", verifiedAt: "2026-10-02T09:40:04Z" },
      ],
      video: {
        title: "Everything You Need to Know About Headers & Footers in Microsoft Word",
        channel: "Kevin Stratvert",
        url: "https://www.youtube.com/watch?v=SE2br75WMSw",
        videoId: "SE2br75WMSw",
        verifiedAt: "2026-10-02T09:35:58Z",
      },
      alternateVideos: [
        {
          title: "Microsoft Word Tutorial for Beginners",
          channel: "Kevin Stratvert",
          url: "https://www.youtube.com/watch?v=5Im87VPQZ_0",
          videoId: "5Im87VPQZ_0",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-word-tables-headers-pdf-q1",
          prompt:
            "The payment schedule table in your SOW runs over two pages. On page 2 the client cannot tell which column is the amount. What fixes it?",
          options: [
            "Select the first row and turn on Repeat Header Rows",
            "Copy the header row by hand to the top of page 2",
            "Make the font smaller until the table fits on one page",
            "Split it into two separate tables",
          ],
          correctIndex: 0,
          explanation:
            "Repeat Header Rows shows the header on every page and keeps working when the table moves. A copied row ends up mid-table after the next edit.",
        },
        {
          id: "pma-word-tables-headers-pdf-q2",
          prompt:
            "Your SOW is final and signed off internally. The PDF still shows a red comment from the sales lead about the discount. What went wrong?",
          options: [
            "The comments were not deleted, or the export published the document showing markup",
            "PDF export always includes comments, so it cannot be avoided",
            "The client's PDF reader added the comment",
            "The comment was in the footer",
          ],
          correctIndex: 0,
          explanation:
            "Delete comments and resolve changes before exporting, and check the PDF options. Export can leave markup out; it is not forced.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-word-tables-headers-pdf-q3",
          prompt: "You want the cover page to have no header, and all other pages to show \"Acme Portal SOW, v1.2\" and a page number. Which setting helps?",
          options: ["Different First Page", "Link to Previous", "Repeat Header Rows", "Restrict Editing"],
          correctIndex: 0,
          explanation: "Different First Page gives the cover its own empty header and footer. The others control sections, tables and editing.",
        },
        {
          id: "pma-word-tables-headers-pdf-q4",
          prompt: "Which checks belong on your list before you send a SOW as a PDF? (Select all that apply.)",
          options: [
            "All tracked changes accepted or rejected and comments deleted",
            "Version and date in the footer match the version being sent",
            "Open the PDF and check tables, page breaks and page numbers",
            "Convert the tables to images so they cannot be copied",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Clean markup, a correct version label and a visual check of the PDF catch the common errors. Turning tables into images makes the document harder to read and search.",
        },
        {
          id: "pma-word-tables-headers-pdf-q5",
          prompt:
            "The client asks for the SOW \"in Word so our lawyer can mark it up\". What is the best response?",
          options: [
            "Send the clean Word file and ask them to keep Track Changes on, and keep the PDF as the version of record",
            "Refuse: SOWs are only shared as PDF",
            "Send the Word file with your internal comments left in, so they see the reasoning",
            "Convert the PDF back to Word with an online tool",
          ],
          correctIndex: 0,
          explanation:
            "Clients and lawyers often need the editable file. Clean it first and ask for tracked edits so every change is visible. Internal comments must never go out.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "You are about to send the final SOW PDF for a Laravel booking portal to a client in Australia. Below is your quick check of the exported file. Mark the lines that show a problem you must fix before sending.",
        segments: [
          { id: "s1", text: "Cover page: client logo, project name, no header or footer.", issue: null },
          { id: "s2", text: "Footer on page 2 onwards: \"Booking Portal SOW – DRAFT v0.3\".", issue: "The final version still says DRAFT v0.3; the footer must show the version being sent." },
          { id: "s3", text: "TOC page numbers match the pages they point to.", issue: null },
          { id: "s4", text: "Milestone table on pages 5–6: the header row only appears on page 5.", issue: "Repeat Header Rows is off, so page 6 has no column names." },
          { id: "s5", text: "Payment schedule adds up to the contract total.", issue: null },
          { id: "s6", text: "Page 8 shows a comment balloon: \"Sales: can we drop to $28/h if they push?\"", issue: "An internal pricing comment is visible; delete comments and export without markup." },
          { id: "s7", text: "Header on page 9 reads \"Greenleaf Clinics – SOW\".", issue: "Another client's name is left over from a copied document." },
          { id: "s8", text: "PDF bookmarks list each main section.", issue: null },
          { id: "s9", text: "Page numbers run 1 to 12 without gaps.", issue: null },
          { id: "s10", text: "Sign-off block has names and roles for both parties.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pma-powerpoint-status-decks",
      moduleId: "pma-word-ppt",
      trackId: "pm",
      title: "PowerPoint status decks and charts from Excel",
      summary:
        "Many overseas clients want a short deck for their own steering meeting or for their boss: where the project stands, what is at risk and what they need to decide. A good status deck is four to six plain slides. It is not a design project. It is a way to make the client's next decision easy.\n\nWhy it matters: the client often forwards the deck without you in the room. If the RAG status, the budget burn and the next milestone are not clear on the slides themselves, the message is lost. A clean, repeatable deck also saves you hours each week, because the layout stays and only the numbers change.\n\nHow to do it: use one slide each for overall status (RAG with a one-line reason), progress against milestones, budget or hours used, top risks with owners, and decisions needed with a date. Keep the numbers in Excel, where you already track them, and bring the chart into PowerPoint. Paste with a link if you will refresh it each week, so the chart updates from the workbook. Paste as a picture when you send the deck outside, so the chart cannot change and does not carry data with it. Use the slide title to say the message, such as \"Payments at risk: Stripe approval pending\", not just \"Status\".\n\nCommon mistake: pasting an embedded Excel chart into a client deck. An embedded object can carry the whole workbook, including internal rates, other projects and margin columns. The client double-clicks the chart and sees all of it. Send the deck as a PDF or paste the chart as a picture.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Support: Insert and update Excel data in PowerPoint", url: "https://support.microsoft.com/en-us/powerpoint/insert-and-update-excel-data-in-powerpoint", kind: "docs", verifiedAt: "2026-10-02T09:35:27Z" },
        { label: "Microsoft Support: PowerPoint for Windows training", url: "https://support.microsoft.com/en-us/powerpoint/powerpoint-for-windows-training", kind: "docs", verifiedAt: "2026-10-02T09:35:29Z" },
        { label: "Atlassian: Project Status Report: Tips and Templates for Success", url: "https://www.atlassian.com/agile/project-management/status-report", kind: "article", verifiedAt: "2026-10-02T09:38:53Z" },
      ],
      video: {
        title: "How to Link Excel to PowerPoint | Excel to PPT",
        channel: "Kevin Stratvert",
        url: "https://www.youtube.com/watch?v=VIQIGs02veA",
        videoId: "VIQIGs02veA",
        verifiedAt: "2026-10-02T09:35:54Z",
      },
      alternateVideos: [
        {
          title: "How to Make a Project Status Report Template with PowerPoint - Simple Design Tutorial",
          channel: "Stuart Taylor - Project Management",
          url: "https://www.youtube.com/watch?v=Pmabm_iKm_8",
          videoId: "Pmabm_iKm_8",
          verifiedAt: "2026-10-02T09:35:59Z",
        },
        {
          title: "PowerPoint Tutorial for Beginners",
          channel: "Kevin Stratvert",
          url: "https://www.youtube.com/watch?v=l5Ij7nUy9UQ",
          videoId: "l5Ij7nUy9UQ",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-powerpoint-status-decks-q1",
          prompt:
            "You paste a budget chart from your internal Excel tracker into the client deck as an embedded object. What can the client see if they double-click it?",
          options: [
            "Possibly the whole workbook, including internal rates and other sheets",
            "Nothing: embedded charts are images",
            "Only the cells used by the chart",
            "A link that asks for your Microsoft login",
          ],
          correctIndex: 0,
          explanation:
            "An embedded object stores workbook data inside the deck. Paste as a picture or send a PDF when the deck leaves the agency.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-powerpoint-status-decks-q2",
          prompt: "You update the same weekly deck from the same tracker. Which way of bringing the chart in saves you the most work?",
          options: [
            "Paste with a link to the workbook, then refresh the links each week",
            "Rebuild the chart in PowerPoint each week",
            "Take a screenshot each week",
            "Type the numbers into a PowerPoint table",
          ],
          correctIndex: 0,
          explanation:
            "A linked chart updates from the source workbook, so the internal master deck stays current. Screenshots and retyping are slow and error-prone.",
        },
        {
          id: "pma-powerpoint-status-decks-q3",
          prompt:
            "You email a deck with linked charts to the client. On their side the charts show old numbers or an error about links. Why?",
          options: [
            "The linked workbook lives on your drive, which the client cannot reach",
            "PowerPoint removes links when a deck is emailed",
            "The client's PowerPoint version is too new",
            "Linked charts only work in PDF",
          ],
          correctIndex: 0,
          explanation:
            "Links point to a file path the client cannot open. For external decks, break the links, paste as pictures or send a PDF.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-powerpoint-status-decks-q4",
          prompt: "Which slide titles carry the message instead of just naming the topic?",
          options: [
            "\"Payments at risk: Stripe approval still pending\"",
            "\"Status\"",
            "\"Budget\"",
            "\"Slide 3\"",
          ],
          correctIndex: 0,
          explanation: "An action title tells a busy reader the point even if they read nothing else. Topic labels make them work it out.",
        },
        {
          id: "pma-powerpoint-status-decks-q5",
          prompt: "Which slides belong in a five-slide weekly status deck for a client sponsor? (Select all that apply.)",
          options: [
            "Overall RAG status with a one-line reason",
            "Top risks and blockers with owners",
            "Decisions needed from the client, with dates",
            "Every Jira ticket closed this week",
            "The team's internal utilisation numbers",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Sponsors need status, risks and the decisions they own. Ticket lists bury the message, and utilisation is internal.",
        },
        {
          id: "pma-powerpoint-status-decks-q6",
          prompt:
            "The project is Amber because the client is two weeks late with API credentials. How should the status slide say it?",
          options: [
            "Amber: integration blocked; we need the payment API credentials by 14 March to hold the May release",
            "Amber: some delays this sprint",
            "Green: the team is working hard",
            "Red: the client is late",
          ],
          correctIndex: 0,
          explanation:
            "State the cause, the ask, the date and the impact, neutrally. Vague wording gets no action, and a blaming tone hurts the relationship.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-powerpoint-status-decks-q7",
          prompt: "Which habits keep a weekly deck quick to produce? (Select all that apply.)",
          options: [
            "Keep the same slide layout every week and change only the numbers and text",
            "Keep the numbers in the Excel tracker and link the charts",
            "Use the slide master for the logo and footer",
            "Redesign the slides each week so the client stays interested",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "A fixed layout, a single source of numbers and a slide master make the deck a 15-minute job. Redesigning wastes time and confuses readers.",
        },
        {
          id: "pma-powerpoint-status-decks-q8",
          prompt: "Your chart shows hours used per milestone. Which chart type reads best for planned vs actual hours on four milestones?",
          options: ["Clustered bar or column chart", "Pie chart", "3D cone chart", "Scatter plot"],
          correctIndex: 0,
          explanation: "Side-by-side bars compare two values per item clearly. Pies cannot show planned vs actual, and 3D effects distort the size of values.",
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "This sheet feeds the budget chart on your weekly status deck for a React Native app. Fill in the % used (actual divided by planned, as a decimal, e.g. 0.92) for each milestone and for the total in D2:D5. Then fill the RAG status in E2:E5 with a formula: \"Red\" if % used is over 1, \"Amber\" if over 0.9, otherwise \"Green\". Use formulas, not typed values.",
        grid: [
          ["Milestone", "Planned h", "Actual h", "% used", "RAG"],
          ["Auth & onboarding", "120", "110", "", ""],
          ["Payments", "80", "96", "", ""],
          ["Admin panel", "100", "70", "", ""],
          ["Total", "=SUM(B2:B4)", "=SUM(C2:C4)", "", ""],
        ],
        editable: ["D2", "D3", "D4", "D5", "E2", "E3", "E4", "E5"],
        checks: [
          { cell: "D2", expected: 0.9167, tolerance: 0.001, requireFormula: true, functions: [] },
          { cell: "D3", expected: 1.2, tolerance: 0.001, requireFormula: true, functions: [] },
          { cell: "D4", expected: 0.7, tolerance: 0.001, requireFormula: true, functions: [] },
          { cell: "D5", expected: 0.92, tolerance: 0.001, requireFormula: true, functions: [] },
          { cell: "E2", expected: "Amber", tolerance: 0, requireFormula: true, functions: ["IF"] },
          { cell: "E3", expected: "Red", tolerance: 0, requireFormula: true, functions: ["IF"] },
          { cell: "E4", expected: "Green", tolerance: 0, requireFormula: true, functions: ["IF"] },
          { cell: "E5", expected: "Amber", tolerance: 0, requireFormula: true, functions: ["IF"] },
        ],
        solution: {
          D2: "=C2/B2",
          D3: "=C3/B3",
          D4: "=C4/B4",
          D5: "=C5/B5",
          E2: '=IF(D2>1,"Red",IF(D2>0.9,"Amber","Green"))',
          E3: '=IF(D3>1,"Red",IF(D3>0.9,"Amber","Green"))',
          E4: '=IF(D4>1,"Red",IF(D4>0.9,"Amber","Green"))',
          E5: '=IF(D5>1,"Red",IF(D5>0.9,"Amber","Green"))',
        },
        explanation:
          "Payments is Red at 120% of plan and Auth is Amber at 92%, while the total is only Amber because Admin panel is under plan. That is why the slide should show milestones, not just the total: the total hides a milestone already over budget. Put this sheet behind the chart, paste the chart into the internal deck with a link, and paste it as a picture into the copy you send to the client.",
      },
    },
    {
      id: "pma-word-track-changes-comments",
      moduleId: "pma-word-ppt",
      trackId: "pm",
      title: "Track Changes and comments for SOW and PRD reviews",
      summary:
        "A SOW or PRD usually goes back and forth with the client two or three times before signing. Their product owner rewrites a user story, their lawyer edits the payment terms, and our tech lead answers questions in the margin. Track Changes and comments are how everyone sees exactly what changed and why. Without them, you compare two long files by eye, and a quiet edit to scope or price slips through.\n\nWhy it matters: in an agency, a single tracked change can be a change request. If the client edits \"Admin can export reports as CSV\" to \"Admin can export reports as CSV, PDF and Excel\", that is new work. If you accept it without pricing it, you have agreed to build it for free. Every redline from a client is either wording, a question, or a scope or commercial change, and each needs a different response.\n\nHow to do it: turn on Review > Track Changes before you send the file, and ask the client to keep it on. Use All Markup while reviewing, so nothing is hidden. Go through changes one by one with Next, and accept or reject each. Reply inside comment threads, @mention the developer who must answer, and resolve a thread only when it is truly settled. If the client sends back a file without tracking, use Review > Compare against the version you sent. To stop silent edits, you can restrict editing to tracked changes only.\n\nCommon mistakes: switching the view to No Markup and thinking the changes are gone (they are only hidden), and clicking Accept All Changes on a client's file. Scope and commercial edits need sign-off from the right person in the agency before you accept them; see your team's SOP below for who approves what.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Microsoft Support: Track changes in Word", url: "https://support.microsoft.com/en-us/word/training/track-changes-in-word", kind: "docs", verifiedAt: "2026-10-02T09:35:42Z" },
        { label: "Microsoft Support: Using Modern comments in Word", url: "https://support.microsoft.com/en-us/word/using-modern-comments-in-word", kind: "docs", verifiedAt: "2026-10-02T09:35:41Z" },
        { label: "Microsoft Support: Word help & learning", url: "https://support.microsoft.com/en-us/word/", kind: "docs", verifiedAt: "2026-10-02T09:35:24Z" },
      ],
      video: {
        title: "Word: Track Changes and Comments",
        channel: "LearnFree",
        url: "https://www.youtube.com/watch?v=m7tmsWN6uH0",
        videoId: "m7tmsWN6uH0",
        verifiedAt: "2026-10-02T09:35:53Z",
      },
      alternateVideos: [
        {
          title: "How to Use Track Changes and Comments in Microsoft Word (2023 Update for PC & Mac)",
          channel: "Erin Wright Writing",
          url: "https://www.youtube.com/watch?v=1-gby_qDsHo",
          videoId: "1-gby_qDsHo",
          verifiedAt: "2026-10-02T09:35:56Z",
        },
        {
          title: "Track changes and show markup in Microsoft Word",
          channel: "Microsoft Copilot",
          url: "https://www.youtube.com/watch?v=ymBMonYehFA",
          videoId: "ymBMonYehFA",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-word-track-changes-comments-q1",
          prompt:
            "The client's redline changes \"Admin can export reports as CSV\" to \"Admin can export reports as CSV, PDF and Excel\". The SOW is fixed-price. What do you do?",
          options: [
            "Leave the change pending, comment that PDF and Excel export is extra scope, and raise a change request with an estimate",
            "Accept it: it is a small wording change",
            "Reject it silently and send the file back",
            "Accept it and ask the developers to fit it in",
          ],
          correctIndex: 0,
          explanation:
            "This is new work dressed as wording. Make it visible, price it, and let the client decide. Silent rejection damages trust just as silent acceptance damages margin.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-word-track-changes-comments-q2",
          prompt: "You switched the view to No Markup and the document looks clean. You send it as final. What actually happened?",
          options: [
            "The tracked changes and comments are still in the file, only hidden from view",
            "No Markup accepts all changes",
            "No Markup deletes all comments",
            "No Markup turns Track Changes off and cleans the file",
          ],
          correctIndex: 0,
          explanation:
            "Views only change what you see. Accept or reject every change and delete comments, or the client sees everything when they switch the view back.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-word-track-changes-comments-q3",
          prompt: "The client sends back the PRD with edits, but Track Changes was off. How do you find what they changed?",
          options: [
            "Use Review > Compare with the version you sent them",
            "Read both files side by side",
            "Ask the client to list their changes from memory",
            "Assume only the sections they mentioned in the email changed",
          ],
          correctIndex: 0,
          explanation:
            "Compare creates a new document with every difference shown as a tracked change. Reading by eye misses small edits, and memory is unreliable.",
        },
        {
          id: "pma-word-track-changes-comments-q4",
          prompt: "Which kinds of client redlines need sign-off before you accept them? (Select all that apply.)",
          options: [
            "A change to payment milestones or amounts",
            "A new feature or a wider feature in the scope section",
            "A shorter delivery date",
            "Fixing a typo in the client's company name",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Commercial, scope and timeline changes are commitments and need the right approver. A typo fix is safe to accept.",
        },
        {
          id: "pma-word-track-changes-comments-q5",
          prompt: "A client comment asks: \"Will the booking API handle 500 bookings per minute?\" You don't know. What is the best move?",
          options: [
            "Reply in the thread, @mention the tech lead to answer, and keep the thread open until answered",
            "Resolve the comment so the document looks clean",
            "Answer \"Yes\" to keep things moving",
            "Delete the comment and answer on a call",
          ],
          correctIndex: 0,
          explanation:
            "@mentions bring the right person into the thread and notify them. Resolving or guessing hides a question that becomes a requirement.",
        },
        {
          id: "pma-word-track-changes-comments-q6",
          prompt: "What does \"Accept All Changes\" on a client's redlined SOW risk?",
          options: [
            "Agreeing to scope, price or date changes you did not review",
            "Losing the document's styles",
            "Deleting all comments",
            "Turning off Track Changes for the client",
          ],
          correctIndex: 0,
          explanation: "Accept All is fine for your own edits. On a client file, review each change, because some are commitments.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-word-track-changes-comments-q7",
          prompt: "You want the client's lawyer to be able to edit the SOW, but only as tracked changes. Which feature does that?",
          options: [
            "Restrict Editing set to allow only tracked changes",
            "Mark as Final",
            "Save as PDF",
            "Simple Markup view",
          ],
          correctIndex: 0,
          explanation:
            "Restrict Editing can lock tracking on so every edit shows. Mark as Final is only advisory, a PDF cannot be edited, and Simple Markup is just a view.",
        },
        {
          id: "pma-word-track-changes-comments-q8",
          prompt: "Which are good habits when you send a SOW out for review? (Select all that apply.)",
          options: [
            "Turn on Track Changes before sending and ask the client to keep it on",
            "Put a version number and date in the file name and footer",
            "Remove your internal comments first",
            "Keep internal notes about margin as comments so you remember them",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Tracking, clear versions and a clean file make the review safe. Internal notes about margin belong in a separate internal file, never in the client copy.",
        },
        {
          id: "pma-word-track-changes-comments-q9",
          prompt:
            "Three people at the client edit three copies of the PRD at the same time and email them back. What is the better setup next time?",
          options: [
            "Share one file in OneDrive or SharePoint with editing rights and Track Changes on, so everyone reviews the same copy",
            "Ask them to send the edits as one long email",
            "Send each reviewer a PDF",
            "Merge the three files by hand",
          ],
          correctIndex: 0,
          explanation:
            "One shared file with tracking avoids merging conflicting copies. PDFs cannot be edited, and long emails lose context.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A US client returned your fixed-price SOW for a Laravel + React property management portal with tracked changes. Mark the changes you must NOT accept without a change request or sign-off. Plain wording fixes can be accepted.",
        segments: [
          { id: "c1", text: "Changed \"Property Managment\" to \"Property Management\" in section 1.", issue: null },
          { id: "c2", text: "Changed \"Tenants can pay rent by card\" to \"Tenants can pay rent by card or ACH bank transfer\".", issue: "ACH is a second payment method: new integration work in a fixed-price scope." },
          { id: "c3", text: "Changed the client contact from \"Mark Doe\" to \"Sara Lin, Product Owner\".", issue: null },
          { id: "c4", text: "Changed milestone 3 payment from \"30% on UAT sign-off\" to \"30% on go-live\".", issue: "A commercial change that delays payment; needs sign-off from whoever owns commercial terms." },
          { id: "c5", text: "Rewrote \"The system will\" as \"The platform will\" throughout section 4.", issue: null },
          { id: "c6", text: "Changed the go-live date from 30 June to 15 June.", issue: "A shorter timeline is a delivery commitment; check capacity and agree before accepting." },
          { id: "c7", text: "Added a comment: \"Please confirm the hosting region is US-East.\"", issue: null },
          { id: "c8", text: "Deleted the line \"Out of scope: native mobile apps\".", issue: "Removing an exclusion widens scope by implication; keep it or agree a change." },
          { id: "c9", text: "Changed \"5 user roles\" to \"five user roles\".", issue: null },
          { id: "c10", text: "Fixed date format from 06/30 to 30 June in the timeline table.", issue: null },
        ],
        askExplanation: true,
      },
      sop: [
        {
          title: "Who approves client redlines on a SOW or PRD",
          prompt:
            "[Oyelabs SOP – admin to fill] Who must approve scope, price, payment-term and timeline changes in a client's redline (PM, delivery head, sales, finance), how the PM records the decision, where the master copy of the SOW lives, and the file-naming and version rules for documents sent to clients.",
        },
      ],
    },
  ],
} satisfies Module;
