import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-c06",
  trackId: "pm",
  name: "Terminology: Communication & governance",
  description:
    "Who does, who decides and who is told: RACI, SPOC and the steering committee; risk versus issue and the RAID log; and the escalation matrix. Side-by-side comparisons, worked agency examples and the mistakes that turn governance words into noise.",
  topics: [
    {
      id: "pmp-c06-raci-spoc-steerco",
      moduleId: "pmp-c06",
      trackId: "pm",
      title: "RACI, SPOC and the steering committee",
      summary:
        "Three governance words answer three different questions. The [[term:raci|RACI]] answers *who does and who decides* for each activity. The [[term:spoc|SPOC]] answers *through whom does communication flow*. The [[term:steering-committee]] answers *where do the big decisions and stuck escalations go*. PMs often treat them as one idea (\"the client contact\"), and that is how an agency ends up taking instructions from three people, or waiting weeks for a decision nobody owns.\n\nWhy it matters at an agency. Oyelabs works with overseas clients across time zones. When the client's CTO, marketing head and founder all send requests, the team builds conflicting things. When nobody is clearly accountable for approving a [[term:change-request]], the CR sits for a fortnight and the date slips.\n\nHow to do it. At the client kickoff, agree one SPOC on each side and write it in the [[term:mom|MoM]]. Build a RACI for the decisions that cause trouble: estimates, CR approval, design approval, [[term:uat]] [[term:sign-off]], release decisions, store submission. Put exactly one A on each row. For large or long projects, agree whether a steering committee exists, who sits on it and which decisions are reserved for it.\n\nThe common mistake is naming the SPOC as Accountable for everything. A SPOC routes; the A decides. Often they are different people.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Atlassian: RACI chart - what it is and how to use it", url: "https://www.atlassian.com/work-management/project-management/raci-chart", kind: "article", verifiedAt: "2026-10-02T11:53:57Z" },
        { label: "GOV.UK: Role of the senior responsible owner", url: "https://www.gov.uk/government/publications/the-role-of-the-senior-responsible-owner", kind: "docs", verifiedAt: "2026-10-02T11:51:28Z" },
        { label: "TechTarget: What is a steering committee?", url: "https://www.techtarget.com/it-strategy/definition/steering-committee", kind: "article", verifiedAt: "2026-10-02T11:56:08Z" },
      ],
      video: {
        title: "RACI explained its simple yet powerful - The most watched RACI matrix video on YouTube",
        channel: "RACI",
        url: "https://www.youtube.com/watch?v=1U2gngDxFkc",
        videoId: "1U2gngDxFkc",
        verifiedAt: "2026-10-02T12:16:55Z",
      },
      alternateVideos: [
        {
          title: "What is a Steering Committee [PURPOSE AND ROLES EXPLAINED]",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=oDDBIYxIBX0",
          videoId: "oDDBIYxIBX0",
          verifiedAt: "2026-10-02T12:17:33Z",
        },
        {
          title: "Successful Project Steering Committee Meetings",
          channel: "Stuart Taylor - Project Management",
          url: "https://www.youtube.com/watch?v=uZrimlzyj9k",
          videoId: "uZrimlzyj9k",
          verifiedAt: "2026-10-02T12:17:33Z",
        },
      ],
      handbook: { stages: ["custom-client-kickoff"], rules: ["cr-approval"], templates: ["kickoff-agenda"] },
      sections: [
        {
          heading: "Side by side: does, routes, decides",
          body:
            "- **[[term:raci|RACI]]** is a table. It is about **roles per activity**. One person can be R on one row and only I on the next.\n- **[[term:spoc|SPOC]]** is a person. It is about **the channel**. All requests and approvals pass through them, so the team hears one voice.\n- **[[term:steering-committee|Steering committee]]** is a forum. It is about **authority above the project**: scope, budget and timeline decisions, and [[term:escalation|escalations]] the project team cannot settle.\n\nHow they connect. The SPOC usually carries requests in and decisions out. The RACI says who actually makes each decision. When the RACI's A for a decision cannot or will not decide, the question goes up the [[term:escalation-matrix]], and the SteerCo is often the top of that path.\n\nOne test: if you ask \"who do I send this to?\", the answer is the SPOC. If you ask \"who can say yes?\", the answer is the A in the RACI. If you ask \"who can change the budget or the date?\", the answer is often the SteerCo.",
        },
        {
          heading: "The rules that make a RACI useful",
          body:
            "- **Exactly one A per row.** Two As means nobody decides. If the client insists on two approvers, make one A and the other C.\n- **At least one R per row.** An activity nobody does will not happen.\n- **Only the rows that cause trouble.** A 60-row RACI is never read. Ten rows on decisions are read every week.\n- **Both sides on one sheet.** The client's columns matter most: their approver for designs, CRs, UAT and go-live.\n- **Name people, not just roles,** for the client side. \"Client\" is not a person.\n- **Revisit it when people change.** A new client CTO joining mid-project is a RACI change, not just a new contact.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A React and Node B2B ordering portal for a Canadian distributor. Six months, fixed bid. Three client stakeholders: the COO (sponsor), the head of sales and the IT manager.*\n\nAt the client kickoff the PM agrees:\n\n- **SPOC:** the IT manager on the client side, the PM on the Oyelabs side. Recorded in the MoM.\n- **RACI (decision rows):** design approval: A = head of sales, C = IT manager. CR approval: A = COO, R = PM (prepares), C = IT manager. UAT sign-off: A = IT manager, R = the client's testers. Go-live decision: A = COO.\n- **SteerCo:** monthly, 30 minutes, the COO, the Oyelabs delivery head and both PMs. Reserved decisions: changes to budget or the go-live date.\n\nIn month three, the head of sales emails a developer directly asking for a new discount rule. The developer forwards it to the PM. The PM replies to the head of sales, copies the SPOC, logs it as a CR candidate and reminds everyone, politely, that the COO approves CRs. Nobody is offended, because it was all agreed at kickoff.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Taking instructions from whoever writes.** Recover: acknowledge, then route through the SPOC in writing: \"Copying Priya as agreed so we work from one list.\"\n- **Two accountable approvers for CRs.** Recover: ask the sponsor to name one; record the change in the MoM.\n- **A SteerCo that is just a long status meeting.** Recover: send the status report beforehand and use the meeting only for decisions and escalations.\n- **No client-side RACI at all.** Recover: draft one with the decision rows, send it with \"please correct anything wrong\", and confirm at the next meeting.\n- **The SPOC is on leave and work stops.** Recover: name a deputy SPOC at kickoff.",
        },
        {
          heading: "Your checklist",
          body:
            "- One named SPOC on each side, and a deputy, recorded in the kickoff MoM.\n- A RACI with exactly one A per decision row, client people named.\n- Agreed whether a steering committee exists, who sits on it, how often it meets and which decisions it owns.\n- Requests that bypass the SPOC are routed back politely and in writing.\n- The RACI is updated when people change.",
        },
      ],
      sop: [
        {
          title: "Oyelabs standard RACI",
          prompt: "[Oyelabs SOP – admin to fill] The standard Oyelabs RACI per stage (custom and white-label): who on the Oyelabs side is accountable for estimates, CR approval, release decisions and store submission, and whether the RACI is shared with the client at kickoff.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c06-raci-spoc-steerco-q1",
          prompt: "Which question does the SPOC answer?",
          options: ["Through whom does communication flow?", "Who can approve the budget?", "Who does the work on each task?", "Who is told after a decision?"],
          correctIndex: 0,
          explanation: "The SPOC is the channel. Who decides is the A in the RACI; budget-level decisions often sit with the SteerCo.",
        },
        {
          id: "pmp-c06-raci-spoc-steerco-q2",
          prompt: "The client wants both its CTO and its CFO as 'Accountable' for CR approval. What do you propose?",
          options: [
            "One A (for example the CFO) and the other as C, so a single person can say yes",
            "Keep two As for safety",
            "Make the SPOC accountable instead",
            "Leave the row blank",
          ],
          correctIndex: 0,
          explanation: "Exactly one A per row. Two As means each waits for the other. Consulting the second person keeps their voice without blocking the decision.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c06-raci-spoc-steerco-q3",
          prompt: "A client's marketing head messages a developer directly on Teams asking for a new banner. What should happen?",
          options: [
            "The developer routes it to the PM, who acknowledges it, copies the client SPOC and assesses it as a possible CR",
            "The developer builds it, since it is small",
            "The developer ignores it",
            "The PM complains to the client's CEO",
          ],
          correctIndex: 0,
          explanation: "Requests flow through the SPOCs. Route politely, keep the client SPOC informed, and classify the request before anyone builds.",
        },
        {
          id: "pmp-c06-raci-spoc-steerco-q4",
          prompt: "Which decisions are typically reserved for a steering committee? (Select all that apply.)",
          options: [
            "Moving the go-live date",
            "Approving a budget increase",
            "Resolving an escalation the project team could not settle",
            "Choosing the colour of a button",
            "Assigning tickets in the sprint",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "A SteerCo handles scope, budget, timeline and stuck escalations. Day-to-day design and sprint decisions stay with the team.",
        },
        {
          id: "pmp-c06-raci-spoc-steerco-q5",
          prompt: "On a RACI row, the client's IT manager is R and C at once, and nobody is A. What is the main problem?",
          options: ["Nobody owns the decision", "The IT manager has too many letters", "There is no I", "R and C cannot be on the same row"],
          correctIndex: 0,
          explanation: "A row without an A has no owner. The other cells matter less than that gap.",
        },
        {
          id: "pmp-c06-raci-spoc-steerco-q6",
          prompt: "Your SteerCo meetings take 90 minutes and are spent reading the status report aloud. What do you change?",
          options: [
            "Send the report beforehand and use the meeting only for decisions and escalations",
            "Cancel the SteerCo",
            "Add more slides",
            "Invite the whole development team",
          ],
          correctIndex: 0,
          explanation: "A SteerCo exists for decisions. Pre-read the status, then decide.",
        },
        {
          id: "pmp-c06-raci-spoc-steerco-q7",
          prompt: "Mid-project the client hires a new CTO who starts sending requirements. What is the right first move?",
          options: [
            "Agree with the sponsor how the CTO fits in: update the RACI and confirm whether the SPOC changes, and record it in the MoM",
            "Treat the CTO as the new SPOC automatically",
            "Ignore the CTO until the project ends",
            "Restart discovery",
          ],
          correctIndex: 0,
          explanation: "A new senior person changes who decides. Make it explicit with the sponsor before acting on their requests.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c06-raci-spoc-steerco-q8",
          prompt: "Which statements are true? (Select all that apply.)",
          options: [
            "The SPOC and the Accountable person for a decision can be different people",
            "A RACI should list both client-side and agency-side roles",
            "A SPOC removes the need for a RACI",
            "A steering committee is usually the top of the escalation path",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "A SPOC routes; the RACI says who decides; the SteerCo sits above both. They complement each other.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "A white-label taxi app for a ride-hailing start-up in Kenya. The client team: the founder (sponsor), an operations lead and a freelance designer. At kickoff the founder said \"talk to the ops lead day to day\", but nobody wrote down who approves what.",
        steps: [
          {
            id: "s1",
            question: "In week two, the designer and the ops lead send conflicting brand colours. What do you do first?",
            options: [
              "Reply to both, copy the ops lead as SPOC, and ask the founder who approves branding; record it in the MoM",
              "Use the designer's colours, since design is their job",
              "Use the ops lead's colours, since they are the SPOC",
              "Build both versions",
            ],
            correctIndex: 0,
            explanation: "Being SPOC does not make the ops lead the approver. Get the founder to name one A for branding, then write it down.",
          },
          {
            id: "s2",
            question: "The founder names himself A for branding and CRs, and the ops lead A for UAT sign-off. How do you capture it?",
            options: [
              "A short RACI with the decision rows, people named, one A each, shared in the MoM",
              "A 60-row RACI covering every task",
              "A verbal agreement",
              "An email to the designer only",
            ],
            correctIndex: 0,
            explanation: "A short RACI on the decisions that cause trouble, with names and one A per row, is the version people actually use.",
          },
          {
            id: "s3",
            question: "Later the founder wants to add a driver-wallet custom module, which moves the launch date. Who decides?",
            options: [
              "The founder, as A for CRs, after you send a CR with the time and cost impact",
              "The ops lead, as SPOC",
              "The designer",
              "You, as PM",
            ],
            correctIndex: 0,
            explanation: "The RACI made the founder accountable for CRs. Your job is to give him the CR and its impact so he can decide.",
          },
        ],
      },
    },
    {
      id: "pmp-c06-risk-vs-issue-raid",
      moduleId: "pmp-c06",
      trackId: "pm",
      title: "Risk vs issue, and the RAID log",
      summary:
        "A [[term:risk]] might happen. An [[term:issue]] is happening. The difference sounds trivial, but it changes what you do: a risk gets a response plan and an owner who watches it; an issue gets an owner who fixes it by a date. Both live in the [[term:raid-log|RAID log]] with the project's [[term:assumption|assumptions]] and [[term:dependency|dependencies]].\n\nWhy it matters at an agency. Agency projects fail on things the PM saw coming and wrote down nowhere: a client that has not opened its Apple account, a payment gateway in sandbox only, a designer leaving. A RAID log turns \"I was worried about that\" into \"we logged it in week one, here is what we did\". It is also your evidence when a slipped date is the client's [[term:client-dependency]], not the team's.\n\nHow to do it. Open the RAID log at kickoff. Every assumption from the SOW goes in. Every dependency on the client (content, accounts, API access, feedback) goes in with a date. Review it weekly, and move items between columns when reality changes: a risk that happens becomes an issue; an assumption proven false often becomes an issue or a [[term:change-request]].\n\nThe common mistake is logging issues as risks (\"risk: the API is down\"), which hides urgency, or logging everything as a risk so the log becomes a worry list nobody acts on.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "PMI: Lexicon of Project Management Terms", url: "https://www.pmi.org/standards/lexicon", kind: "spec", verifiedAt: "2026-10-02T11:55:40Z" },
        { label: "Asana: RAID log - risks, assumptions, issues and decisions", url: "https://asana.com/resources/raid-log", kind: "article", verifiedAt: "2026-10-02T11:57:18Z" },
        { label: "APM: What is risk management?", url: "https://www.apm.org.uk/resources/what-is-project-management/what-is-risk-management/", kind: "article", verifiedAt: "2026-10-02T12:08:03Z" },
      ],
      video: {
        title: "RAID Log Explained within 5 Minutes | Risks, Assumptions, Issues & Dependencies | Project Management",
        channel: "VKG Labs",
        url: "https://www.youtube.com/watch?v=s87zt4fwlyA",
        videoId: "s87zt4fwlyA",
        verifiedAt: "2026-10-02T12:17:33Z",
      },
      alternateVideos: [
        {
          title: "How to Use RAID Log in REAL-LIFE Project (+ Template)",
          channel: "Tactical Project Manager",
          url: "https://www.youtube.com/watch?v=inZI16nIvdo",
          videoId: "inZI16nIvdo",
          verifiedAt: "2026-10-02T12:17:33Z",
        },
        {
          title: "Risks, Assumptions, and Issues: What are their differences (and similarities)?",
          channel: "PM4NGOs",
          url: "https://www.youtube.com/watch?v=Iwhctssm2o0",
          videoId: "Iwhctssm2o0",
          verifiedAt: "2026-10-02T12:16:56Z",
        },
      ],
      handbook: { stages: ["custom-internal-kickoff"], rules: ["weekly-status-report"], templates: ["raid-log-template", "status-report-rag"] },
      sections: [
        {
          heading: "Side by side: the four columns and how items move",
          body:
            "- **[[term:risk|Risk]]:** future and uncertain. You plan a response (avoid, reduce, transfer, accept) and a trigger to watch.\n- **[[term:assumption|Assumption]]:** something the plan treats as true without proof. You plan how and when to validate it.\n- **[[term:issue|Issue]]:** now and certain. You assign an owner and a due date to resolve it.\n- **[[term:dependency|Dependency]]:** something your work needs from someone else, often the client ([[term:client-dependency]]). You track the date it is needed.\n\nItems move. That movement is the point of the log:\n\n1. A risk happens → close the risk, open an issue, link them.\n2. An assumption proves false → it usually becomes an issue, and if it changes scope, a [[term:change-request]].\n3. A dependency misses its date → it becomes an issue, and possibly an [[term:escalation]].\n\nSome teams use the D for Decisions. If your log does, keep dependencies somewhere visible too: on agency projects they cause most slips.",
        },
        {
          heading: "The one-line test",
          body:
            "Ask: **\"Has it happened?\"**\n\n- No, and it might → risk.\n- No, and we are relying on it being true → assumption.\n- Yes, and it is hurting the project → issue.\n- We are waiting for someone else to deliver it → dependency.\n\nThen ask: **\"What will anyone do about it this week?\"** A line with no owner and no next action is not managed, whatever column it is in.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A Laravel school-management system for a group of schools in Nigeria. Fixed bid, five months.*\n\nWeek one RAID log, opened at the internal kickoff:\n\n- **A1 (assumption):** the schools' existing student data can be exported to CSV. *Validate by:* sample export in week two. Owner: client SPOC.\n- **D1 (dependency):** SMS provider account in the client's name, needed by sprint 3. Owner: client IT lead.\n- **R1 (risk):** term starts in month five; any slip pushes launch to next term. *Response:* reduce: phase the parent app after the admin panel. Owner: PM.\n\nWeek three: the sample export arrives as scanned PDFs. **A1 was false.** The PM closes it and opens **I1 (issue):** no machine-readable student data; owner the client SPOC, due in a week. Because importing PDFs was never in scope, the PM also raises a CR for a data-entry tool or a manual import service. In the weekly status report, the item is Amber with the decision the client needs to make.\n\nMonth two: D1 misses its date. It becomes **I2**, the PM follows the [[term:escalation-matrix]], and the status report shows the impact on the sprint 3 demo.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **\"Risk: the staging server is down.\"** It is happening, so it is an issue. Recover: move it, give it an owner and a date.\n- **A worry list with no responses.** Recover: every risk gets a response type and an owner, or it is deleted.\n- **SOW assumptions never copied into the log.** Then nobody validates them. Recover: copy them in this week and give each a validation date.\n- **The log lives in the PM's drive and nobody sees it.** Recover: review it in the weekly internal meeting and surface the top items in the status report.\n- **Client dependencies logged without dates.** Then a slip cannot be shown as the client's. Recover: add \"needed by\" dates and confirm them in the MoM.",
        },
        {
          heading: "Your checklist",
          body:
            "- RAID log opened at the internal kickoff, using the template in the card below.\n- Every SOW assumption and client dependency is in it, with an owner and a date.\n- Every risk has a response and an owner; every issue has an owner and a due date.\n- Items are moved, not duplicated, when reality changes, and the link is kept.\n- The top items appear in the weekly status report.",
        },
      ],
      sop: [
        {
          title: "Where the RAID log lives",
          prompt: "[Oyelabs SOP – admin to fill] Where Oyelabs keeps each project's RAID log, the review cadence, the likelihood and impact scale, and which items must be shared with the client in the status report.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c06-risk-vs-issue-raid-q1",
          prompt: "The client's payment gateway sandbox has been down for two days and the checkout sprint is blocked. How do you log it?",
          options: ["As an issue, with an owner and a due date", "As a risk with a mitigation plan", "As an assumption", "It does not need logging"],
          correctIndex: 0,
          explanation: "It is happening now and hurting the project, so it is an issue.",
        },
        {
          id: "pmp-c06-risk-vs-issue-raid-q2",
          prompt: "The SOW says \"the client will provide all product images\". Which RAID columns does this belong in? (Select all that apply.)",
          options: ["Dependency (the team needs the images from the client)", "Assumption (the plan treats it as true)", "Issue", "Decision"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "It is something the plan assumes and something the team depends on the client for. Log it with a needed-by date. It becomes an issue only if it is late.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c06-risk-vs-issue-raid-q3",
          prompt: "A logged risk (\"the lead developer may go on leave in month three\") happens. What do you do in the log?",
          options: [
            "Close the risk, open a linked issue with an owner and due date, and act on the planned response",
            "Leave it as a risk with a note",
            "Delete it",
            "Change its likelihood to 100%",
          ],
          correctIndex: 0,
          explanation: "A risk that has happened is an issue. Keep the link so the history shows the response was planned.",
        },
        {
          id: "pmp-c06-risk-vs-issue-raid-q4",
          prompt: "Which are valid risk responses? (Select all that apply.)",
          options: ["Avoid", "Reduce", "Transfer", "Accept", "Ignore without recording"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Avoid, reduce, transfer and accept are the standard responses. Accepting is a recorded decision; ignoring is not.",
        },
        {
          id: "pmp-c06-risk-vs-issue-raid-q5",
          prompt: "The assumption \"existing data can be exported to CSV\" turns out to be false: the client only has scanned PDFs. Importing PDFs was never in scope. What follows?",
          options: [
            "An issue for the missing data, and a change request for the extra import work",
            "The team absorbs the import work",
            "It stays an assumption",
            "A risk with low likelihood",
          ],
          correctIndex: 0,
          explanation: "A false assumption becomes an issue. Because the fix adds work outside the signed scope, it also needs a CR.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c06-risk-vs-issue-raid-q6",
          prompt: "Your RAID log has 40 risks and no owners. What is the best fix?",
          options: [
            "Keep the risks that matter, give each a response and an owner, and delete the rest",
            "Add more risks to be safe",
            "Share all 40 with the client",
            "Convert them all to issues",
          ],
          correctIndex: 0,
          explanation: "An unowned risk is not managed. A shorter, owned list is worth more.",
        },
        {
          id: "pmp-c06-risk-vs-issue-raid-q7",
          prompt: "A client dependency (\"Apple organisation account by 1 June\") misses its date and blocks submission. What does it become?",
          options: [
            "An issue, raised in the status report and taken up the escalation path if it stays blocked",
            "A risk",
            "A new assumption",
            "Nothing, since it is the client's job",
          ],
          correctIndex: 0,
          explanation: "A late dependency that blocks work is an issue. Logging the date earlier is what lets you show the impact fairly.",
        },
        {
          id: "pmp-c06-risk-vs-issue-raid-q8",
          prompt: "In a status report, a PM writes \"Risk: the client has not given UAT feedback for a week.\" What is wrong?",
          options: [
            "It has already happened, so it is an issue with an owner and a date, not a risk",
            "Nothing",
            "UAT feedback is never logged",
            "It should be an assumption",
          ],
          correctIndex: 0,
          explanation: "Calling an issue a risk understates the urgency to the client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "You are opening the RAID log for a React Native grocery app for a supermarket chain in Qatar. Put each line in the right column, as it stands today.",
        categories: [
          { id: "risk", label: "Risk" },
          { id: "assumption", label: "Assumption" },
          { id: "issue", label: "Issue" },
          { id: "dependency", label: "Dependency" },
          { id: "decision", label: "Decision" },
        ],
        items: [
          { id: "r1", text: "Ramadan falls in month three and the client's team may be slow to give feedback then.", explanation: "Has not happened and might: a risk." },
          { id: "r2", text: "The supermarket's stock API will return prices in real time, as the SOW states.", explanation: "Treated as true without proof yet: an assumption to validate early." },
          { id: "r3", text: "The client's IT team must whitelist our server IPs before we can call the stock API.", explanation: "Work we need from someone else: a dependency, with a needed-by date." },
          { id: "r4", text: "The staging database ran out of space yesterday and QA is blocked.", explanation: "Happening now and blocking work: an issue." },
          { id: "r5", text: "The client agreed in Tuesday's call to launch on Android first, then iOS two weeks later.", explanation: "A choice that was made: a decision, recorded with the date and who made it." },
          { id: "r6", text: "Apple may ask for changes on first review, which could push the iOS date.", explanation: "Possible and future: a risk with a response (submit early, prepare reviewer notes)." },
          { id: "r7", text: "Arabic product names will be supplied by the client's merchandising team by sprint 2.", explanation: "Something we need from the client by a date: a dependency." },
          { id: "r8", text: "Two of the client's store managers have not been able to log in to UAT since Monday.", explanation: "Happening now: an issue." },
          { id: "r9", text: "Delivery slots will be configured per store, not per city, as the plan assumes.", explanation: "The plan relies on it without proof: an assumption." },
          { id: "r10", text: "Card payments will go through the client's existing gateway; cash on delivery is dropped.", explanation: "An agreed choice: a decision." },
        ],
        answer: { r1: "risk", r2: "assumption", r3: "dependency", r4: "issue", r5: "decision", r6: "risk", r7: "dependency", r8: "issue", r9: "assumption", r10: "decision" },
      },
    },
    {
      id: "pmp-c06-escalation-matrix",
      moduleId: "pmp-c06",
      trackId: "pm",
      title: "The escalation matrix",
      summary:
        "An [[term:escalation]] is not a complaint. It is moving a problem to someone with more authority because it cannot be solved at the current level in the agreed time. The [[term:escalation-matrix]] makes that move predictable: which kind of problem, which level, which names on both sides, and how long each level has before the next one is involved.\n\nWhy it matters at an agency. Without a matrix, escalations happen by emotion. A client founder emails the agency's CEO about a typo; a PM sits on a blocked dependency for three weeks because escalating feels rude. Both damage the relationship. With a matrix agreed at kickoff, escalating is just following the plan, and nobody takes it personally.\n\nHow to do it. Agree the matrix at the client kickoff and attach it to the kickoff MoM. Keep two paths apart: **delivery escalations** (a blocked [[term:dependency]], a disputed [[term:change-request]], a red [[term:rag-status]]) and **support escalations** (a live incident by [[term:severity]] under an [[term:sla|SLA]]). When you escalate, write it: the problem, the impact, what has been tried, the decision you need and by when. Follow the Oyelabs rule in the handbook card below for the levels and time windows.\n\nThe common mistake is skipping levels, in either direction: going straight to the client's CEO, or never going past the SPOC when the SPOC is the blocker.\n\nNot legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PagerDuty Support: Escalation policy basics", url: "https://support.pagerduty.com/main/docs/escalation-policies", kind: "docs", verifiedAt: "2026-10-02T12:09:54Z" },
        { label: "ProjectManager: Escalation matrix how-to guide with example", url: "https://www.projectmanager.com/blog/escalation-matrix", kind: "article", verifiedAt: "2026-10-02T11:56:50Z" },
        { label: "Atlassian: Escalation policies for incidents", url: "https://www.atlassian.com/incident-management/on-call/escalation-policies", kind: "article", verifiedAt: "2026-10-02T11:53:53Z" },
        { label: "PagerDuty Incident Response documentation", url: "https://response.pagerduty.com/", kind: "docs", verifiedAt: "2026-10-02T11:55:04Z" },
      ],
      video: {
        title: "Project Issue Escalation Matrix In Project Management",
        channel: "Project Astute",
        url: "https://www.youtube.com/watch?v=ABK7CFZExgk",
        videoId: "ABK7CFZExgk",
        verifiedAt: "2026-10-02T12:17:33Z",
      },
      alternateVideos: [
        {
          title: "How to Set up an Escalation Process?",
          channel: "Project Booster",
          url: "https://www.youtube.com/watch?v=DSz0lWLXryE",
          videoId: "DSz0lWLXryE",
          verifiedAt: "2026-10-02T12:17:33Z",
        },
        {
          title: "8 Steps To Manage Client Escalations Like a PRO",
          channel: "VenuMuvvala",
          url: "https://www.youtube.com/watch?v=fTGJMYcLVR0",
          videoId: "fTGJMYcLVR0",
          verifiedAt: "2026-10-02T12:17:34Z",
        },
      ],
      handbook: { stages: ["custom-client-kickoff", "custom-support"], rules: ["escalation-levels"], templates: ["escalation-matrix-template", "kickoff-agenda"] },
      sections: [
        {
          heading: "Side by side: escalation, issue, SteerCo and SLA",
          body:
            "- An **[[term:issue]]** is the problem. An **escalation** is what you do when the issue cannot be solved at your level in time. Most issues are never escalated.\n- The **[[term:escalation-matrix]]** is the route. The **[[term:steering-committee]]**, where there is one, is usually its top step for delivery problems.\n- The **[[term:sla|SLA]]** sets response and resolution targets for a live system. A support escalation is triggered when those targets are at risk, and it follows severity (a [[term:p1-p4|P1]] goes up faster than a P3).\n- The **[[term:raci|RACI]]** says who decides. The matrix says who to go to when that person is the blocker, or is not deciding.\n\nTwo directions. **Client-to-agency:** the client is unhappy and goes above the PM. **Agency-to-client:** the PM needs a client decision or input that is stuck. A good matrix covers both, with names on each side at each level.",
        },
        {
          heading: "What a good escalation message contains",
          body:
            "1. **The problem in one line.** \"UAT feedback for the checkout module has not started.\"\n2. **The impact, with a date.** \"Go-live on 14 March cannot hold unless testing starts by Monday.\"\n3. **What has already been tried at the lower level,** with dates. \"Asked Priya on 3 and 5 March.\"\n4. **The decision or action you need,** and from whom. \"Please either assign two testers this week or agree a new go-live date.\"\n5. **By when.**\n\nAlways tell the lower level before you go over their head: \"As agreed in our escalation plan, I'm raising this with Arjun today.\" Then it is the process, not a betrayal. Record the escalation and its outcome in the RAID log.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A white-label taxi app for a ride-hailing operator in Saudi Arabia, sold directly (no reseller). The matrix was agreed at kickoff and attached to the MoM.*\n\n- **Level 1:** the Oyelabs PM and the client's operations manager (SPOC).\n- **Level 2:** the Oyelabs delivery head and the client's COO (sponsor).\n- **Level 3:** Oyelabs leadership and the client's CEO, through the monthly SteerCo or a special call.\n- **Support path (after go-live):** by severity, with the response and resolution targets from the SLA.\n\nThe client has to supply the payment gateway's live keys before submission. The PM asks the SPOC on Monday and Wednesday. On Friday, still nothing, and the level-1 window has passed. The PM tells the SPOC she is moving it to level 2, then writes to the COO: the problem, the impact on the store submission date, the two dates she asked, and the decision needed. The COO replies the same day. The keys arrive on Monday through the approved secure channel. The escalation and outcome go into the RAID log, and nobody is upset, because everyone agreed the route months ago.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Escalating too late,** out of politeness. Recover: escalate now, show the impact honestly, and agree time windows so it does not happen again.\n- **Skipping levels.** Recover: if you went over someone, apologise for the surprise, not the escalation, and return to the agreed route.\n- **Escalating without a clear ask.** Leaders cannot act on \"FYI, things are slow\". Recover: resend with the decision needed and the deadline.\n- **No matrix on a reseller project.** The end client then calls Oyelabs directly. Recover: agree with the reseller who handles which level, and in which order.\n- **Mixing a typo with an outage.** Recover: classify severity first; only real impact goes up fast.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "- A matrix agreed at kickoff with names on both sides, attached to the MoM.\n- Separate delivery and support paths; support follows severity and the SLA.\n- Time windows at each level, as the Oyelabs rule below sets them.\n- Every escalation is written: problem, impact, what was tried, the ask, the deadline.\n- The lower level is told before you go above them.\n- Escalations and outcomes are logged in the RAID log.",
        },
      ],
      sop: [
        {
          title: "Acknowledging a client escalation",
          prompt: "[Oyelabs SOP – admin to fill] How Oyelabs acknowledges an escalation that a client raises above the PM: who replies, within how long, who must be informed internally, and how it is recorded.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c06-escalation-matrix-q1",
          prompt: "What makes an escalation healthy rather than a complaint?",
          options: [
            "It follows an agreed route with time windows and asks for a specific decision",
            "It goes straight to the most senior person",
            "It is made by phone so there is no record",
            "It is made only when the client is angry",
          ],
          correctIndex: 0,
          explanation: "A planned route with a clear ask makes escalation routine and impersonal.",
        },
        {
          id: "pmp-c06-escalation-matrix-q2",
          prompt: "The client SPOC has not answered about live payment keys for a week, past the level-1 window. What is the right sequence?",
          options: [
            "Tell the SPOC you are raising it to level 2, then write to the level-2 contact with the impact, what was tried and the decision needed",
            "Write directly to the client's CEO",
            "Wait another week",
            "Submit with sandbox keys",
          ],
          correctIndex: 0,
          explanation: "Inform the lower level first, then escalate one level with a complete, written ask.",
        },
        {
          id: "pmp-c06-escalation-matrix-q3",
          prompt: "What should an escalation email contain? (Select all that apply.)",
          options: [
            "The problem in one line",
            "The impact, with a date",
            "What was already tried, with dates",
            "The decision needed and by when",
            "A list of everything the SPOC has done wrong",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Facts, impact, history and a clear ask. Blame makes the reader defend instead of decide.",
        },
        {
          id: "pmp-c06-escalation-matrix-q4",
          prompt: "A client founder emails Oyelabs' CEO about a spelling mistake on the About page. What does a good matrix help you do?",
          options: [
            "Classify it by severity, handle it at the right level, and remind everyone of the agreed route kindly",
            "Treat it as a P1 because the founder raised it",
            "Ignore it because it skipped levels",
            "Ask the CEO to fix it",
          ],
          correctIndex: 0,
          explanation: "Severity decides speed, not the seniority of the sender. Fix it quickly and steer future reports back to the agreed route.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c06-escalation-matrix-q5",
          prompt: "How do delivery escalations and support escalations differ?",
          options: [
            "Delivery escalations follow time windows on decisions and dependencies; support escalations follow incident severity and SLA targets",
            "There is no difference",
            "Support escalations always go to the SteerCo",
            "Delivery escalations only happen after go-live",
          ],
          correctIndex: 0,
          explanation: "A live P1 needs a fast, severity-driven path. A late design approval follows the project's time windows.",
        },
        {
          id: "pmp-c06-escalation-matrix-q6",
          prompt: "On a white-label project sold through a UK reseller, the end client calls the Oyelabs PM directly to escalate. What should the matrix have said?",
          options: [
            "Who handles each level on the reseller and end-client side, and that the reseller is the first contact",
            "That the end client always calls Oyelabs",
            "Nothing; resellers do not need a matrix",
            "That the PM must refuse to speak to them",
          ],
          correctIndex: 0,
          explanation: "With a reseller in the middle, the route must say who owns the end-client relationship. Be polite on the call, then follow the agreed route.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c06-escalation-matrix-q7",
          prompt: "You escalated over the SPOC without telling her first. She is upset. What do you do?",
          options: [
            "Apologise for the surprise, not for the escalation, and agree to give notice next time",
            "Withdraw the escalation",
            "Escalate her reaction too",
            "Stop escalating on this project",
          ],
          correctIndex: 0,
          explanation: "The escalation was valid; the surprise was not. Repair the relationship and return to the route.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c06-escalation-matrix-q8",
          prompt: "Which of these should trigger a delivery escalation if unresolved at level 1 within the agreed window? (Select all that apply.)",
          options: [
            "A client dependency blocking the next sprint",
            "A disputed change request the SPOC cannot approve",
            "An overall status that has turned Red",
            "A developer's preference for tabs over spaces",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Blocked dependencies, stuck decisions and a red status are classic triggers. Internal style choices are not.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        prompt:
          "Use the escalation matrix in the context to escalate this problem correctly. Pick the level and the person, then write the escalation email.",
        context:
          "**Project:** a Laravel and React booking platform for a UK physiotherapy clinic chain. Go-live is planned for Friday 21 March.\n\n**Escalation matrix (agreed at kickoff):**\n\n| Level | Oyelabs | Client | Window before next level |\n|---|---|---|---|\n| L1 | PM (you) | Priya, operations lead (SPOC) | 2 business days |\n| L2 | Delivery head | Arjun, COO (sponsor) | 2 business days |\n| L3 | Leadership | CEO, via SteerCo | - |\n\n**What happened:** UAT was due to start on Monday 10 March and needs five business days of client testing. Today is Thursday 13 March. You asked Priya on Monday and on Tuesday; she has not replied and no tester has logged in.",
        templateId: "escalation-matrix-template",
        fields: [
          { id: "level", label: "Level to escalate to now", input: "select", options: ["L1", "L2", "L3"], required: true },
          { id: "to", label: "Client contact to write to", input: "select", options: ["Priya, operations lead", "Arjun, COO", "The CEO"], required: true },
          { id: "notify", label: "Who do you tell before you send it, and how?", input: "text", required: true },
          { id: "email", label: "Escalation email", input: "textarea", placeholder: "Problem, impact with dates, what was tried, the decision needed, by when.", required: true },
        ],
        checks: [
          { fieldId: "level", expected: "L2" },
          { fieldId: "to", expected: "Arjun, COO" },
        ],
        rubric: [
          { label: "Problem and impact are clear, with dates", points: 2, description: "States in one or two lines that UAT has not started and that the 21 March go-live cannot hold without five days of testing." },
          { label: "Shows what was tried at level 1", points: 1, description: "Mentions the requests to Priya on Monday and Tuesday." },
          { label: "Asks for a specific decision by a deadline", points: 2, description: "Asks Arjun to assign testers to start by a named day, or to agree a new go-live date, with a reply-by date." },
          { label: "Professional, blame-free tone", points: 1, description: "Factual and polite; does not criticise Priya." },
        ],
        sampleAnswer: {
          level: "L2",
          to: "Arjun, COO",
          notify: "I tell Priya first, in a short message, that as agreed in the escalation plan I am raising UAT with Arjun today.",
          email:
            "Subject: UAT start needed to keep the 21 March go-live\n\nHi Arjun,\n\nAs agreed in our escalation plan, I'm raising one item with you. UAT was due to start on Monday 10 March and needs five business days of testing. It has not started yet. I asked Priya on Monday and Tuesday, and I know her team is stretched.\n\nImpact: without five days of testing, we cannot go live safely on Friday 21 March.\n\nCould you either (a) assign two testers to start by Monday 17 March, which moves go-live to Monday 24 March, or (b) agree a new go-live date with us? A reply by tomorrow 3 pm would let us plan the team.\n\nThanks,\n[PM]",
        },
      },
    },
  ],
} satisfies Module;
