import type { Module } from "@/types/curriculum";

export default {
  id: "pma-ai",
  trackId: "pm",
  name: "AI for PMs (Copilot & Claude)",
  description:
    "Using Microsoft Copilot and Claude for the PM's daily documents: meeting minutes and status emails, PRDs and risk lists, Excel formulas, and the verification habits that keep AI-drafted work accurate before a client sees it.",
  refs: [
    { label: "Anthropic Docs: Prompt engineering overview", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview", kind: "docs", verifiedAt: "2026-10-02T09:35:24Z" },
    { label: "NIST: AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", kind: "spec", verifiedAt: "2026-10-02T09:35:46Z" },
  ],
  topics: [
    // ------------------------------------------------------------------ 1
    {
      id: "pma-ai-moms-status-emails",
      moduleId: "pma-ai",
      trackId: "pm",
      title: "AI for MoMs and status emails",
      summary:
        "A PM with four client projects spends hours a week on minutes of meeting (MoM) and status emails. AI can cut that time in half. Copilot in Teams can recap a recorded call and list action items. Copilot in Outlook can summarise a long client thread or draft a reply. Claude can turn your rough notes into a clean MoM in your team's format. The time saved is real, but so is the risk: an AI recap that turns \"maybe\" into \"agreed\" can commit the agency to work nobody priced.\n\nA good workflow has four steps. First, record and transcribe the call (with everyone's consent), or take your own short notes. Second, ask the tool for a specific output: \"From this transcript, list decisions with who made them, action items with owner and due date, and open questions. Only include what was said. If an owner or date was not stated, write 'not stated'.\" Third, check every decision, owner, date and number against the transcript or your memory, and fix the tone for the client. Fourth, send it within 24 hours using your team's MoM template.\n\nFor status emails, give the AI the facts (tickets done, risks, dates) and your template, and ask it to write in plain English for a non-technical client. Then check the RAG status yourself. AI does not know that the release is really at risk because your best developer is on leave next week; you do.\n\nThe common mistakes are sending the AI recap without reading it, and pasting client material into a tool the company has not approved. Copilot inside your company's Microsoft 365 account and a personal free chatbot are very different places for a client's data. Your team's SOP below lists the approved tools and what may go into them.",
      level: "beginner",
      estMinutes: 30,
      webRefs: [
        { label: "Microsoft Support: Catch up on meetings with Microsoft Copilot in Teams", url: "https://support.microsoft.com/en-us/teams/copilot/catch-up-on-meetings-with-microsoft-365-copilot-in-teams", kind: "docs", verifiedAt: "2026-10-02T09:38:49Z" },
        { label: "Microsoft Support: Draft an email message with Copilot in Outlook", url: "https://support.microsoft.com/en-us/outlook/copilot-pages/draft-an-email-message-with-copilot-in-outlook", kind: "docs", verifiedAt: "2026-10-02T09:42:56Z" },
        { label: "Microsoft Support: Summarize an email thread with Copilot in Outlook", url: "https://support.microsoft.com/en-us/outlook/copilot-pages/summarize-an-email-thread-with-copilot-in-outlook", kind: "docs", verifiedAt: "2026-10-02T09:35:30Z" },
        { label: "Anthropic Docs: Prompt engineering overview", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview", kind: "docs", verifiedAt: "2026-10-02T09:35:24Z" },
      ],
      video: {
        title: "How to Use Copilot to Automate Meeting Notes in Microsoft Teams!",
        channel: "Scott Brant",
        url: "https://www.youtube.com/watch?v=JvGmRVAJyF8",
        videoId: "JvGmRVAJyF8",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      alternateVideos: [
        {
          title: "How to draft an email with Copilot - New Outlook for Windows",
          channel: "Microsoft Copilot",
          url: "https://www.youtube.com/watch?v=R7TNInXiqUY",
          videoId: "R7TNInXiqUY",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
        {
          title: "M365 Copilot for Project Managers: Streamline Projects Like a Pro",
          channel: "Bulb Digital",
          url: "https://www.youtube.com/watch?v=hnSCSoFLakM",
          videoId: "hnSCSoFLakM",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
      ],
      sop: [
        {
          title: "Approved AI tools and client data",
          prompt:
            "[Oyelabs SOP – admin to fill] Which AI tools PMs may use for work (e.g. Copilot in the company Microsoft 365 tenant, a company Claude account), what client data may and may not be pasted into each, and the rules for recording and transcribing client calls (consent, storage).",
        },
        {
          title: "Our MoM template",
          prompt:
            "[Oyelabs SOP – admin to fill] The MoM template PMs must use (sections, decisions/actions/open-questions format, correction deadline), and a saved prompt that produces it from a transcript.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-ai-moms-status-emails-q1",
          prompt: "Which prompt gives the safest AI-drafted MoM from a client call transcript?",
          options: [
            "\"Summarise the meeting.\"",
            "\"From this transcript, list decisions with who made them, actions with owner and due date, and open questions. Only include what was said; write 'not stated' if an owner or date is missing.\"",
            "\"Make the meeting sound productive.\"",
            "\"Write minutes and fill any gaps with sensible guesses.\"",
          ],
          correctIndex: 1,
          explanation: "A specific structure plus 'only what was said' and permission to say 'not stated' reduces invented content.",
        },
        {
          id: "pma-ai-moms-status-emails-q2",
          prompt:
            "Copilot's recap lists \"Decision: add Apple Pay in this release\". In the call the client said \"Apple Pay might be nice one day\". What do you do?",
          options: [
            "Send it; Copilot heard the call",
            "Change it to an open question or idea for later, because no decision was made",
            "Delete the whole recap",
            "Ask Copilot if it is sure",
          ],
          correctIndex: 1,
          explanation: "AI recaps can turn a wish into a decision. A false decision in a MoM becomes unpriced scope.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-ai-moms-status-emails-q3",
          prompt: "Before sending an AI-drafted MoM, which items must you check against the source? (Select all that apply.)",
          options: [
            "Every decision and who made it",
            "Every action owner and due date",
            "Numbers, prices and dates",
            "The font size",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Decisions, owners, dates and numbers are where errors cost money. Formatting is cosmetic.",
        },
        {
          id: "pma-ai-moms-status-emails-q4",
          prompt:
            "You want AI to draft the weekly status email. What must the PM still decide personally?",
          options: [
            "Nothing; the AI decides the RAG status",
            "The RAG status and the real risks, because the AI only knows what you gave it",
            "Only the greeting",
            "The font",
          ],
          correctIndex: 1,
          explanation: "The AI does not know about next week's leave or a shaky estimate. The judgement stays with the PM.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-ai-moms-status-emails-q5",
          prompt: "Where may you paste a client's confidential call transcript?",
          options: [
            "Any free AI chatbot",
            "Only into tools your company has approved for that kind of client data, as set in the SOP",
            "A public forum to get a better summary",
            "Anywhere, if you delete it afterwards",
          ],
          correctIndex: 1,
          explanation: "Client data protection is a contract and trust issue. Use only approved tools and accounts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-ai-moms-status-emails-q6",
          prompt: "Which tasks can Copilot in Outlook or Teams help a PM with? (Select all that apply.)",
          options: [
            "Summarising a long client email thread",
            "Drafting a reply that you then edit",
            "Recapping a recorded Teams meeting with action items",
            "Taking legal responsibility for what is sent",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Copilot drafts and summarises. Responsibility for what is sent stays with the PM.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Copilot drafted this MoM from a Teams call with a US client about their React Native delivery app. Your own notes from the call say: launch moved to 3 Dec (client agreed); client (Jen) to send push-notification text by Fri 22 Nov; Oyelabs (Priya) to send a revised estimate for the driver-rating feature; the client said dark mode was 'nice to have, maybe later'; no price was discussed. Mark every line that does not match the call.",
        segments: [
          { id: "s1", text: "Attendees: Jen (client), Mark (client), Priya (Oyelabs PM), Arjun (Oyelabs tech lead)", issue: null },
          { id: "s2", text: "Decision: launch date moves to 3 December (agreed by Jen).", issue: null },
          { id: "s3", text: "Decision: dark mode will be added in this release.", issue: "Dark mode was 'nice to have, maybe later', not a decision; it belongs under open questions or a later phase." },
          { id: "s4", text: "Action: Jen to send the push-notification text by Friday 22 November.", issue: null },
          { id: "s5", text: "Action: Priya to send a revised estimate for the driver-rating feature.", issue: null },
          { id: "s6", text: "The driver-rating feature was agreed at $2,400.", issue: "No price was discussed. An invented price in a MoM becomes a commitment." },
          { id: "s7", text: "Action: Mark to approve the designs by Monday.", issue: "Not in the notes; the AI invented an owner and a date." },
          { id: "s8", text: "Open question: which payment provider to use for tips.", issue: null },
          { id: "s9", text: "Please reply by Wednesday if anything here is incorrect.", issue: null },
        ],
        askExplanation: true,
      },
    },
    // ------------------------------------------------------------------ 2
    {
      id: "pma-ai-excel-formulas",
      moduleId: "pma-ai",
      trackId: "pm",
      title: "AI for Excel formulas",
      summary:
        "PM trackers live in Excel: hours by project, budget against actuals, RAG status, who is on leave. Many PMs know what they want to calculate but not the formula. Copilot in Excel, or Claude in a chat, can write SUMIFS, XLOOKUP and nested IF formulas from a plain-English request. That is a real time-saver, but a formula that looks right and is quietly wrong is worse than no formula, because the wrong number goes into a client report.\n\nAsk precisely. Tell the AI the exact columns and ranges, the condition, and what to return when nothing matches: \"In this sheet, column B is Project, C is Hours, D is Billable (Y/N). Write a formula for the billable hours on 'Laravel portal' only.\" Vague requests (\"total the hours for Laravel\") often produce SUMIF on project only, which includes non-billable hours. Copilot in Excel works best when the data is formatted as a table with clear headers.\n\nThen verify the formula, every time. Read it: does each range cover all the rows, and do the ranges line up? Check one or two results by hand, for example filter the column and look at the status bar sum. Test an edge case: a project name with a trailing space, a blank row, a person who appears twice. XLOOKUP returns only the first match, so a person listed twice will silently show one value. Make sure the formula still works when new rows are added; whole-table references are safer than fixed ranges like C2:C6.\n\nThe common mistake is pasting the formula, seeing a plausible number, and moving on. The second is asking the AI to calculate the answer itself instead of writing a formula: a chat model can make arithmetic mistakes, while a formula is checked by Excel and updates when the data changes.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Microsoft Support: Get started with Copilot in Excel", url: "https://support.microsoft.com/en-us/excel/copilot/get-started-with-copilot-in-excel", kind: "docs", verifiedAt: "2026-10-02T09:35:39Z" },
        { label: "Microsoft Support: XLOOKUP function", url: "https://support.microsoft.com/en-us/excel/functions/xlookup-function", kind: "docs", verifiedAt: "2026-10-02T09:35:30Z" },
        { label: "Anthropic Docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#be-clear-and-direct", kind: "docs", verifiedAt: "2026-10-02T09:35:45Z" },
      ],
      video: {
        title: "Excel + Copilot Tutorial For Beginners !",
        channel: "Deepak EduWorld",
        url: "https://www.youtube.com/watch?v=FxCthbRIrPo",
        videoId: "FxCthbRIrPo",
        verifiedAt: "2026-10-02T09:36:01Z",
      },
      alternateVideos: [
        {
          title: "Major COPILOT in EXCEL Advancements! Now Everyone Can Be an Excel EXPERT",
          channel: "Collaboration Simplified",
          url: "https://www.youtube.com/watch?v=kN3_55RUu9I",
          videoId: "kN3_55RUu9I",
          verifiedAt: "2026-10-02T09:35:57Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-ai-excel-formulas-q1",
          prompt:
            "You ask Copilot: \"Total the Laravel hours.\" It returns `=SUMIF(B2:B50,\"Laravel portal\",C2:C50)`. You needed billable hours only. What went wrong?",
          options: [
            "Copilot is broken",
            "The request was vague; the formula ignores the Billable column, so non-billable hours are included",
            "SUMIF cannot add numbers",
            "Nothing; it is correct",
          ],
          correctIndex: 1,
          explanation: "The AI did what was asked, not what was meant. Name every condition: project AND billable = Y (SUMIFS).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-ai-excel-formulas-q2",
          prompt: "Which details make a formula request to AI precise? (Select all that apply.)",
          options: [
            "Which column holds what (e.g. B = Project, C = Hours, D = Billable)",
            "Every condition the result must meet",
            "What to return when nothing matches",
            "How you feel about Excel",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Columns, conditions and the no-match case remove guesswork. Anthropic's guidance: be clear and direct.",
        },
        {
          id: "pma-ai-excel-formulas-q3",
          prompt: "How should you check an AI-written SUMIFS before using its result in a client report?",
          options: [
            "Trust it if there is no error message",
            "Read the ranges, check that they line up and cover all rows, and confirm one result by hand (for example with a filter and the status-bar sum)",
            "Ask the AI if it is correct",
            "Check that the cell is formatted in bold",
          ],
          correctIndex: 1,
          explanation: "No error message does not mean right. Read it and check a sample by hand.",
        },
        {
          id: "pma-ai-excel-formulas-q4",
          prompt:
            "An AI-written XLOOKUP returns Asha's rate correctly, but Asha appears twice in the sheet with two different rates. What is the risk?",
          options: [
            "None; XLOOKUP adds both",
            "XLOOKUP returns only the first match, so the second rate is silently ignored",
            "XLOOKUP will show an error",
            "Excel will ask which one to use",
          ],
          correctIndex: 1,
          explanation: "First match only, with no warning. Clean duplicates or use SUMIFS/FILTER if you need all rows.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-ai-excel-formulas-q5",
          prompt: "Why is asking AI to write a formula usually better than asking it to calculate the total from pasted numbers?",
          options: [
            "Formulas look more professional",
            "Excel calculates the formula exactly and updates it when data changes, while a chat model can make arithmetic mistakes",
            "AI cannot read numbers",
            "Formulas are shorter",
          ],
          correctIndex: 1,
          explanation: "Let the model write the logic and let Excel do the arithmetic.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-ai-excel-formulas-q6",
          prompt: "A formula uses `C2:C6`, and next week you add rows 7 to 12. What happens?",
          options: [
            "Excel always extends the range automatically",
            "The new rows may be left out unless the data is an Excel table or the range is extended",
            "The formula deletes the new rows",
            "Nothing can go wrong",
          ],
          correctIndex: 1,
          explanation: "Fixed ranges go stale. Format data as a table (structured references) or check ranges after adding data.",
        },
        {
          id: "pma-ai-excel-formulas-q7",
          prompt: "Which edge cases are worth testing on an AI-written formula? (Select all that apply.)",
          options: [
            "A project name with a trailing space or different spelling",
            "A blank row in the middle of the data",
            "A person who appears twice",
            "Changing the sheet's tab colour",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Spelling, blanks and duplicates are where lookups and conditional sums go quietly wrong.",
        },
        {
          id: "pma-ai-excel-formulas-q8",
          prompt: "What helps Copilot in Excel understand your data best?",
          options: [
            "Merged cells and colourful headers",
            "Data formatted as a table with one clear header row",
            "Several small tables on one sheet with no headers",
            "Hiding the header row",
          ],
          correctIndex: 1,
          explanation: "Copilot works best with clean tables and clear headers.",
        },
      ],
      practice: {
        kind: "excel",
        prompt:
          "This is a weekly timesheet extract. Copilot suggested =SUMIF(B2:B6,\"Laravel portal\",C2:C6) for G2, but that counts non-billable hours too. Fill the answer cells with your own formulas: G2 = billable hours (Billable = Y) on Laravel portal, using SUMIFS; G3 = number of non-billable entries (COUNTIF); G4 = budget status for Laravel portal: \"Red\" if G2 is over the budget in G5, \"Amber\" if it is over 80% of the budget, otherwise \"Green\" (use IF).",
        grid: [
          ["Person", "Project", "Hours", "Billable", "", "Question", "Answer"],
          ["Asha", "Laravel portal", "32", "Y", "", "Billable hours on Laravel portal", ""],
          ["Ben", "React app", "40", "Y", "", "Non-billable entries", ""],
          ["Chen", "Laravel portal", "12", "N", "", "Laravel portal budget status", ""],
          ["Asha", "React app", "8", "Y", "", "Laravel portal weekly budget (h)", "60"],
          ["Dev", "Laravel portal", "20", "Y", "", "", ""],
        ],
        editable: ["G2", "G3", "G4"],
        checks: [
          { cell: "G2", expected: 52, tolerance: 0.01, requireFormula: true, functions: ["SUMIFS"] },
          { cell: "G3", expected: 1, tolerance: 0.01, requireFormula: true, functions: ["COUNTIF"] },
          { cell: "G4", expected: "Amber", tolerance: 0.01, requireFormula: true, functions: ["IF"] },
        ],
        solution: {
          G2: '=SUMIFS(C2:C6,B2:B6,"Laravel portal",D2:D6,"Y")',
          G3: '=COUNTIF(D2:D6,"N")',
          G4: '=IF(G2>G5,"Red",IF(G2>G5*0.8,"Amber","Green"))',
        },
        explanation:
          "Billable Laravel hours are Asha 32 + Dev 20 = 52; Chen's 12 hours are non-billable, which is exactly what Copilot's SUMIF would have wrongly added (giving 64). One entry is non-billable. 52 is under the 60-hour budget but over 80% of it (48), so the status is Amber. Always check an AI formula against a hand count like this before it goes into a client report.",
      },
    },
    // ------------------------------------------------------------------ 3
    {
      id: "pma-ai-prds-risk-lists",
      moduleId: "pma-ai",
      trackId: "pm",
      title: "AI for PRDs and risk lists",
      summary:
        "After a discovery call with a new client, the PM has a page of notes and a deadline to send a PRD (product requirements document) and a first risk list. Claude or Copilot in Word can turn notes into a structured draft in minutes, with sections for goals, users, requirements, non-goals and acceptance criteria. They are also good at brainstorming risks you did not think of: app-store review delays, third-party API limits, GDPR for a European client.\n\nThe quality of the draft depends on the prompt. Anthropic's guidance is to be clear and direct, as if briefing a smart new colleague with no context. Give the role (\"you are helping an agency PM\"), the context (client, platform, budget type, deadline), the source material (your notes, pasted in full), the exact output format (your PRD template headings, or a risk table with columns for risk, likelihood, impact, owner, mitigation), and the rules: \"Use only the notes. Put anything not in the notes under 'Open questions'. Do not invent numbers or dates.\" One or two examples of a good risk row help the model match your style.\n\nThen do the PM's work. Read every requirement against the notes and delete anything the client never asked for, because a requirement in a PRD becomes scope the client expects. Check that each risk is specific to this project, not generic (\"communication issues\"), and has a real owner and a mitigation the team can do. Add the risks only you know: a key developer's leave, a client contact who is slow to reply, a fixed-bid budget with no buffer. Then review the draft with the tech lead before the client sees it.\n\nThe common mistake is treating the AI draft as finished because it looks complete and professional. A tidy PRD with three invented requirements is a future scope dispute. Your team's SOP below covers the approved tools and the PRD and risk templates.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Anthropic Docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#be-clear-and-direct", kind: "docs", verifiedAt: "2026-10-02T09:35:45Z" },
        { label: "Microsoft Support: Welcome to Copilot in Word", url: "https://support.microsoft.com/en-us/word/welcome-to-copilot-in-word", kind: "docs", verifiedAt: "2026-10-02T09:35:20Z" },
        { label: "Atlassian: What is a Product Requirements Document (PRD)?", url: "https://www.atlassian.com/agile/product-management/requirements", kind: "article", verifiedAt: "2026-10-02T09:35:31Z" },
      ],
      video: {
        title: "Copilot for Project Managers: Your AI Assistant for Plans, Risks & Status Reports",
        channel: "PPM Works",
        url: "https://www.youtube.com/watch?v=oGjBgUIJCFs",
        videoId: "oGjBgUIJCFs",
        verifiedAt: "2026-10-02T09:35:59Z",
      },
      alternateVideos: [
        {
          title: "4 Methods of Prompt Engineering",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=1c9iyoVIwDs",
          videoId: "1c9iyoVIwDs",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
        {
          title: "Why Every Project Manager Needs to Learn Claude AI Now",
          channel: "IT Project Managers",
          url: "https://www.youtube.com/watch?v=cw6svCZpXFg",
          videoId: "cw6svCZpXFg",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
      ],
      sop: [
        {
          title: "Our PRD and risk-list templates and saved prompts",
          prompt:
            "[Oyelabs SOP – admin to fill] The PRD template headings and the RAID/risk-list columns PMs must use, the saved prompts for drafting each from discovery notes, and who must review an AI-drafted PRD before it goes to the client.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-ai-prds-risk-lists-q1",
          prompt: "Which prompt will give the most useful PRD draft from your discovery notes?",
          options: [
            "\"Write a PRD for a delivery app.\"",
            "\"You are helping an agency PM. Using only the notes below, fill these PRD headings: goals, users, requirements, non-goals, acceptance criteria, open questions. Put anything not in the notes under open questions. Do not invent numbers or dates.\" (notes pasted)",
            "\"Make the PRD as long as possible.\"",
            "\"Write a PRD and add features the client will probably want.\"",
          ],
          correctIndex: 1,
          explanation: "Role, source material, format and rules: the clear, direct briefing Anthropic recommends.",
        },
        {
          id: "pma-ai-prds-risk-lists-q2",
          prompt:
            "The AI-drafted PRD includes \"Requirement: admin dashboard with sales analytics\". Your notes never mention analytics. What do you do?",
          options: [
            "Keep it; the client will like it",
            "Remove it, or move it to open questions to ask the client, because a requirement in the PRD becomes expected scope",
            "Keep it but make it smaller",
            "Ask the AI to justify it",
          ],
          correctIndex: 1,
          explanation: "Invented requirements turn into scope disputes on a fixed bid. Only what the client asked for goes in.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-ai-prds-risk-lists-q3",
          prompt: "What makes a risk in an AI-drafted risk list useful? (Select all that apply.)",
          options: [
            "It is specific to this project (e.g. 'Apple review may take 1–3 days and delay the 1 Dec launch')",
            "It has a named owner",
            "It has a mitigation the team can actually do",
            "It is generic, like 'communication issues'",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Specific, owned and actionable. Generic risks fill space and change nothing.",
        },
        {
          id: "pma-ai-prds-risk-lists-q4",
          prompt: "Which risks will the AI usually NOT know unless you tell it?",
          options: [
            "That app-store reviews can delay launches",
            "That your senior developer is on leave in week 6 and the client's contact takes days to reply",
            "That third-party APIs have rate limits",
            "That GDPR applies to EU users",
          ],
          correctIndex: 1,
          explanation: "General risks are in its training; your team and client realities are not. Add them yourself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-ai-prds-risk-lists-q5",
          prompt: "Why include one or two example risk rows in your prompt?",
          options: [
            "Examples make the model match your format, level of detail and style",
            "Examples make the AI run faster",
            "They are required by Word",
            "They make the output shorter",
          ],
          correctIndex: 0,
          explanation: "Examples (multishot prompting) are one of the most reliable ways to steer format and quality.",
        },
        {
          id: "pma-ai-prds-risk-lists-q6",
          prompt: "Before an AI-drafted PRD goes to the client, who should review it?",
          options: [
            "Nobody; it is complete",
            "The PM, against the notes, and the tech lead, for feasibility and missing technical points",
            "Only the AI",
            "The client's lawyer first",
          ],
          correctIndex: 1,
          explanation: "The PM checks scope against the source; the tech lead checks feasibility and gaps.",
        },
        {
          id: "pma-ai-prds-risk-lists-q7",
          prompt: "Which instructions reduce invented content in a PRD draft? (Select all that apply.)",
          options: [
            "\"Use only the notes provided.\"",
            "\"Put anything not covered in the notes under 'Open questions'.\"",
            "\"Do not invent numbers, prices or dates.\"",
            "\"Be creative and fill gaps.\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Grounding and an explicit place for unknowns. 'Be creative' invites invention.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-ai-prds-risk-lists-q8",
          prompt: "Why is a polished, complete-looking AI draft dangerous?",
          options: [
            "It is not dangerous",
            "Its confident, tidy format makes errors easy to miss, so people skim instead of checking",
            "Clients dislike tidy documents",
            "It uses too many tokens",
          ],
          correctIndex: 1,
          explanation: "Polish hides plausible mistakes. Review content, not appearance.",
        },
      ],
      practice: {
        kind: "write",
        variant: "general",
        prompt:
          "Write the prompt you would give Claude to turn your discovery notes (below) into a first risk list for this project. Your prompt should set the context, tell Claude to use only the notes, say what to do with unknowns, and define the exact output format (columns). You do not need to paste the notes again; write \"[notes pasted below]\" where they would go.",
        context:
          "Discovery notes: Client in Germany, fixed-bid €38k, React Native app (iOS + Android) + Laravel admin. Launch must be before 1 Dec trade fair. Payments via Stripe; client has no Stripe account yet. Client's product owner works part-time (Tue/Thu). App stores personal data of EU customers. Designs 70% done. Our senior RN dev on leave 10–21 Nov.",
        wordLimit: 220,
        rubric: [
          { id: "context", label: "Context and role", description: "States who Claude is helping (an agency PM) and the key project facts or that notes follow: client, platform, fixed bid, deadline.", weight: 1 },
          { id: "grounding", label: "Grounding rules", description: "Tells Claude to use only the notes, not to invent numbers or dates, and to list unknowns as open questions.", weight: 1.5 },
          { id: "format", label: "Exact output format", description: "Defines columns such as risk, cause, likelihood, impact, owner, mitigation, and asks for specific, project-specific risks.", weight: 1.5 },
          { id: "example", label: "Example or quality bar", description: "Gives one example row or a clear quality bar (specific, not generic like 'communication issues').", weight: 1 },
        ],
        sampleAnswer:
          "You are helping a project manager at a software agency prepare a first risk list for a client project. The discovery notes are pasted below.\n\nRules:\n- Use only the information in the notes. Do not invent numbers, dates or facts.\n- If a risk depends on something the notes do not say, add it to a separate 'Open questions' list instead.\n- Each risk must be specific to this project. Avoid generic risks such as 'communication issues'.\n\nOutput a table with these columns: Risk | Cause (from the notes) | Likelihood (High/Medium/Low) | Impact on the 1 Dec deadline or €38k budget | Suggested owner (Oyelabs PM, tech lead or client) | Mitigation.\n\nExample row: 'Stripe not ready for testing | Client has no Stripe account yet | High | Payment testing slips, launch at risk | Client | Ask the client to open the account this week; we send a setup checklist.'\n\nThen list open questions.\n\n[notes pasted below]",
      },
    },
    // ------------------------------------------------------------------ 4
    {
      id: "pma-ai-verification-habits",
      moduleId: "pma-ai",
      trackId: "pm",
      title: "Verification habits",
      summary:
        "Every AI tool a PM uses can be confidently wrong. Language models predict likely text; they do not look facts up unless they are given sources, and they rarely say \"I am not sure\" unless asked. Microsoft's own documentation for Copilot says outputs can be inaccurate and must be reviewed. For an agency PM, the cost of a mistake is concrete: a wrong date in a status email, a price nobody agreed in a MoM, a formula that under-reports hours on a client invoice. The client does not care that the AI wrote it. Your name is on it.\n\nBuild habits, not one-off checks. First, ground the AI: give it the source (transcript, notes, sheet), tell it to use only that, and allow \"not stated\". Anthropic recommends asking the model to quote the passages that support its claims, so you can check them fast. Second, check by risk: names, numbers, dates, prices, decisions and commitments are checked every time against the source; tone and wording can be skimmed. Third, check with a different method, not by asking the same AI \"are you sure?\": compare with the transcript, recount a total by hand, ask the person who owns the decision. Fourth, keep a human in the loop for anything that commits the agency: scope, price, dates, legal wording.\n\nScale your checking to the stakes. An internal to-do list from AI needs a quick read. A client escalation, an SOW change or an invoice needs a line-by-line check and a second pair of eyes. The NIST AI Risk Management Framework makes the same point at company level: know where AI is used, measure how it fails, and manage the risk.\n\nThe common mistakes are trusting fluent text, verifying with the same tool that made the error, and forgetting data rules: client data only goes into approved tools. Your team's SOP below sets the review checklist and when to tell a client that AI helped produce a document.",
      level: "advanced",
      estMinutes: 45,
      isMilestone: true,
      webRefs: [
        { label: "Anthropic Docs: Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", kind: "docs", verifiedAt: "2026-10-02T09:35:25Z" },
        { label: "Microsoft Learn: Application card: Microsoft Copilot (for organizations)", url: "https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-application-card", kind: "docs", verifiedAt: "2026-10-02T09:35:34Z" },
        { label: "NIST: AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", kind: "spec", verifiedAt: "2026-10-02T09:35:46Z" },
        { label: "IBM: What Are AI Hallucinations?", url: "https://www.ibm.com/think/topics/ai-hallucinations", kind: "article", verifiedAt: "2026-10-02T09:35:33Z" },
      ],
      video: {
        title: "Why do AI models hallucinate?",
        channel: "Claude",
        url: "https://www.youtube.com/watch?v=005JLRt3gXI",
        videoId: "005JLRt3gXI",
        verifiedAt: "2026-10-02T09:35:54Z",
      },
      alternateVideos: [
        {
          title: "Why Large Language Models Hallucinate",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=cfqtFvWOfg0",
          videoId: "cfqtFvWOfg0",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
      ],
      sop: [
        {
          title: "AI review checklist and client disclosure",
          prompt:
            "[Oyelabs SOP – admin to fill] The checklist a PM runs before sending AI-assisted work to a client (what must be checked line by line, what needs a second reviewer), whether and how we tell clients that AI helped draft a document, and how to report an AI mistake that reached a client.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-ai-verification-habits-q1",
          prompt: "Claude summarised a client thread and says the client \"approved the €4,500 change request\". How do you verify it?",
          options: [
            "Ask Claude \"are you sure?\"",
            "Find the client's actual email in the thread and read the approval wording yourself",
            "Trust it; the summary is usually right",
            "Ask Copilot to summarise it too and compare",
          ],
          correctIndex: 1,
          explanation: "Check against the source. Asking the same or another model is not verification of a money commitment.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-ai-verification-habits-q2",
          prompt: "Which items in an AI draft must be checked against the source every time? (Select all that apply.)",
          options: ["Names and owners", "Numbers, prices and dates", "Decisions and commitments", "Synonyms used for 'good'"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "These are the details that create obligations or mislead. Word choice can be skimmed.",
        },
        {
          id: "pma-ai-verification-habits-q3",
          prompt: "Which prompt technique helps you verify a summary faster?",
          options: [
            "Ask the model to quote the exact passages that support each claim",
            "Ask for a shorter summary",
            "Ask it to sound confident",
            "Ask it not to mention sources",
          ],
          correctIndex: 0,
          explanation: "Quotes let you jump straight to the evidence. Anthropic recommends this to reduce and expose hallucinations.",
        },
        {
          id: "pma-ai-verification-habits-q4",
          prompt: "Why does AI often sound equally confident when it is right and when it is wrong?",
          options: [
            "Because it checks every fact online",
            "Because it predicts likely text; fluency is not evidence of accuracy",
            "Because it is always right",
            "Because it was told to lie",
          ],
          correctIndex: 1,
          explanation: "Language models produce plausible text. Confidence of tone tells you nothing about truth.",
        },
        {
          id: "pma-ai-verification-habits-q5",
          prompt: "How should checking effort scale? Match the stakes.",
          options: [
            "Same quick skim for everything",
            "A quick read for internal to-dos; a line-by-line check and a second reviewer for client escalations, SOW changes and invoices",
            "Line-by-line for internal notes, skim for invoices",
            "No checks if the tool is Copilot",
          ],
          correctIndex: 1,
          explanation: "Spend checking time where an error costs most: anything that commits the agency to a client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-ai-verification-habits-q6",
          prompt: "What does Microsoft's documentation say about Copilot outputs?",
          options: [
            "They are always accurate",
            "They may be inaccurate or incomplete and should be reviewed by the user",
            "They are legally binding",
            "They never use your data",
          ],
          correctIndex: 1,
          explanation: "The vendor itself tells you to review outputs. Responsibility stays with the user.",
        },
        {
          id: "pma-ai-verification-habits-q7",
          prompt:
            "A status email drafted by AI went to the client with the wrong go-live date (17 Nov instead of 27 Nov). What is the best response?",
          options: [
            "Say nothing and hope they did not notice",
            "Send a short correction quickly with the right date, then add date checks to your review habit",
            "Blame the AI tool in the email",
            "Change the plan to match 17 Nov",
          ],
          correctIndex: 1,
          explanation: "Correct fast and plainly; the client cares about the right date, not the tool. Then fix the habit that let it through.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-ai-verification-habits-q8",
          prompt: "Which are good verification habits for AI-assisted PM work? (Select all that apply.)",
          options: [
            "Give the tool the source and tell it to use only that",
            "Check with a different method (source, hand count, the decision owner) rather than asking the same AI",
            "Keep a human approval step for scope, price, dates and legal wording",
            "Paste client data into any tool that gives better answers",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Ground, cross-check and keep humans on commitments. Data goes only into approved tools.",
        },
        {
          id: "pma-ai-verification-habits-q9",
          prompt: "What is the main idea of the NIST AI Risk Management Framework for a company using AI?",
          options: [
            "Ban all AI",
            "Know where AI is used, measure how it can fail, and manage those risks deliberately",
            "Let each person decide alone",
            "Only use AI for code",
          ],
          correctIndex: 1,
          explanation: "Govern, map, measure, manage: AI use should be known and its risks handled on purpose.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "It is Friday evening. You used Copilot to draft three things for a UK client on a fixed-bid Laravel project: the MoM from today's call, the weekly status email, and a reply to the client's question about the cost of adding a reporting module. You want everything out before the weekend.",
        steps: [
          {
            id: "s1",
            question: "You have 20 minutes. How do you split your checking?",
            options: [
              "Skim all three equally",
              "Check the cost reply line by line (and hold it if unsure), check every decision, owner and date in the MoM against the transcript, and read the status email for RAG and dates",
              "Send everything; Copilot is reliable",
              "Check only the status email because it goes to the most people",
            ],
            correctIndex: 1,
            explanation: "Check by stakes: a price is a commitment; MoM decisions create scope; the status email's RAG and dates matter most.",
          },
          {
            id: "s2",
            question:
              "The cost reply says \"the reporting module will cost about £3,000\". No estimate exists yet; the tech lead has not looked at it. What do you send?",
            options: [
              "Send it; £3,000 sounds reasonable",
              "Remove the figure, thank the client, and say the tech lead will send an estimate by a specific date",
              "Double the figure to be safe",
              "Ask Copilot to recheck the price",
            ],
            correctIndex: 1,
            explanation: "An invented price on a fixed-bid project becomes a commitment. Give a date for a real estimate instead.",
          },
          {
            id: "s3",
            question:
              "On Monday the client points out that the MoM said the UAT start is 4 Nov; it was agreed as 11 Nov. What do you do?",
            options: [
              "Argue that the MoM is the official record",
              "Correct the MoM quickly in the same thread, confirm 11 Nov, and add 'check every date against the transcript' to your review checklist",
              "Blame Copilot to the client",
              "Ignore it, since UAT has not started",
            ],
            correctIndex: 1,
            explanation: "Correct openly and fast, then fix the habit. The MoM's correction line exists exactly for this.",
          },
        ],
      },
    },
  ],
} satisfies Module;
