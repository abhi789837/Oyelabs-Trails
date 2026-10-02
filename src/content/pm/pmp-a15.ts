import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a15",
  trackId: "pm",
  name: "Custom lifecycle: Closure",
  description:
    "Ending a custom project properly: a blameless retrospective that produces real actions, a closure report the client signs, an archive with all access removed, and, once it has been earned, a case study and the conversation about the next phase.",
  topics: [
    {
      id: "pmp-a15-retro-closure",
      moduleId: "pmp-a15",
      trackId: "pm",
      title: "Retrospective and project closure",
      summary:
        "[[term:closure]] is the formal end of the project: deliverables confirmed, payments complete, lessons captured, the project archived and access removed. Without it, projects never really end. The team keeps getting \"one more small thing\", invoices sit unpaid, old accounts stay open, and the same mistakes repeat on the next project because nobody wrote them down.\n\nClosure has two main outputs. The [[term:retrospective]] looks inward: what helped, what hurt, and what the team will do differently. The Scrum Guide describes the sprint retrospective as a way to plan how to increase quality and effectiveness; a project retro applies the same idea to the whole project, using real data such as the CR log, the hypercare log and planned against actual dates. The closure report looks outward: a document for the client and Oyelabs that records what was delivered against plan, the [[term:change-request|CRs]], quality, the handover status, lessons and open items, and is signed off.\n\nThe stage card lists three pitfalls: projects that never formally close, lessons learned not shared with other PMs, and forgetting to remove access. Each one is cheap to prevent and expensive to discover later. A retro that ends with no owner and no date for each action is a conversation, not a lesson.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Atlassian Team Playbook: Retrospective", url: "https://www.atlassian.com/team-playbook/plays/retrospective", kind: "docs", verifiedAt: "2026-10-02T11:53:23Z" },
        { label: "Scrum Guides: The Scrum Guide (2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: "2026-10-02T11:51:24Z" },
        { label: "ProjectManager: 7 steps to project closure", url: "https://www.projectmanager.com/blog/project-closure", kind: "article", verifiedAt: "2026-10-02T11:56:49Z" },
        { label: "Asana: Lessons learned in project management", url: "https://asana.com/resources/lessons-learned", kind: "article", verifiedAt: "2026-10-02T11:57:43Z" },
      ],
      video: {
        title: "Closing the Project [5 STEPS TO PROJECT CLOSURE]",
        channel: "Adriana Girdler",
        url: "https://www.youtube.com/watch?v=Fl5BVFzigt8",
        videoId: "Fl5BVFzigt8",
        verifiedAt: "2026-10-02T12:17:18Z",
      },
      alternateVideos: [
        {
          title: "How and Why to Close a Project - Project Management Training",
          channel: "ProjectManager",
          url: "https://www.youtube.com/watch?v=aakuB-BtdlQ",
          videoId: "aakuB-BtdlQ",
          verifiedAt: "2026-10-02T12:17:18Z",
        },
      ],
      handbook: {
        stages: ["custom-closure"],
        rules: ["mom-after-every-client-meeting", "secure-credential-sharing"],
        templates: ["closure-report"],
      },
      sections: [
        {
          heading: "Entry and exit criteria",
          body:
            "From the closure stage card below.\n\n**Start closure when:**\n\n- The handover is complete.\n- All milestones are invoiced.\n\n**The project is closed when:**\n\n- The closure report is shared.\n- The retrospective is held and lessons are recorded.\n- The project is archived and access is removed.\n- A case study or referral has been asked for, where appropriate (the next topic).\n\nThe stage card's typical duration is one to two weeks. If the client moves straight into support or a retainer, closure still happens: you are closing the build project, not the relationship.",
        },
        {
          heading: "Who does what (RACI)",
          body:
            "From the closure stage card:\n\n- **Run the retrospective.** R: PM. A: PM. C: tech lead, developers, QA, designer.\n- **Write the closure report.** R: PM. A: PM. C: tech lead, BD/account manager. I: client sponsor.\n- **Confirm final payments.** R: BD/account manager. A: BD/account manager. C: PM.\n- **Ask for feedback, a testimonial or the next phase.** R: BD/account manager. A: BD/account manager. C: PM. I: client sponsor.\n\nThe PM owns the two documents. BD owns money and the commercial follow-up. The whole delivery team contributes to the retro, because the people who did the work know where it hurt.",
        },
        {
          heading: "Running a project retrospective",
          body:
            "Atlassian's retrospective play gives a simple structure. For a whole project, add data and a timeline.\n\n1. **Prepare data.** Planned against actual dates, the CR log, the hypercare log, defects found in UAT and after go-live, and any escalations. Facts first stop the meeting turning into opinions.\n2. **Set the rule.** Blameless: talk about the process and decisions, not about people. Say it at the start.\n3. **Walk the timeline.** Mark the high and low points on the project timeline: kickoff, design approval, sprints, UAT, go-live, hypercare, handover.\n4. **What helped, what hurt.** Everyone adds notes, then group them into themes.\n5. **Pick a few actions.** Two or three actions, each with an owner and a date. An action is something like \"start store account set-up in week 1 on every mobile project\", not \"communicate better\".\n6. **Share it.** Lessons go into the closure report and to other PMs, as the stage card asks. A lesson that stays in one team's notes helps nobody else.\n\nKeep it to about an hour. Hold it soon after handover, while people still remember.",
        },
        {
          heading: "The closure report",
          body:
            "The closure report template has ten sections:\n\n1. **Project summary.** Client, product, duration, team.\n2. **Objectives and outcomes.** What the client wanted and what happened, with numbers where the client can share them.\n3. **Scope delivered against planned.** Signed stories delivered, anything deferred.\n4. **Change requests summary.** Each CR: approved, declined or deferred, and its effect on dates and budget.\n5. **Schedule and budget performance.** Against the baseline, with reasons for any variance.\n6. **Quality summary.** Defects, hypercare results, [[term:known-issues]] handed over.\n7. **Handover status.** The signed handover checklist.\n8. **Lessons learned.** From the retro, with actions.\n9. **Open items and recommendations.** Including any [[term:phase-2]] ideas.\n10. **Sign-off.** Client sponsor and Oyelabs PM.\n\nBe honest about variance. \"Go-live was three weeks late: two weeks from an approved CR, one week waiting for the client's store account\" is a clear, fair sentence. It shows the client what was theirs and what was yours.",
        },
        {
          heading: "Archive and close down",
          body:
            "The administrative half of closure is where access leaks happen.\n\n- **Access.** Remove agency access from client systems that are no longer needed, following the access removal plan from the handover. Remove client guests from Oyelabs tools that are no longer needed. Rotate any shared secret still in use, through the approved channel in the handbook card below.\n- **Repositories.** Archive Oyelabs' internal copies, if any, as the contract allows.\n- **Tools.** Close or archive the project board, chat channels and shared drives; keep the key documents (SOW, sign-offs, CR log, MoM, closure report) in the project archive.\n- **Time tracking.** Close the project codes so nobody logs time to a closed project.\n- **Calendar.** Cancel recurring project meetings. If support continues, set up its own rhythm.\n\nSend a short closure email to the client listing what was archived and where their copies are.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A React Native fitness app with a Laravel API for a US client, nine months long.* The handover was signed last week and the final milestone is invoiced.\n\n- **Retro.** The PM brings the timeline, the CR log and the hypercare log. Two themes stand out: design feedback came from three client people with conflicting comments, and the Apple organisation account was set up late. Actions: \"a single named design approver at kickoff\" (owner: PM lead, for the kickoff template) and \"store accounts in week 1\" (owner: PM lead, for the release checklist).\n- **Closure report.** All signed stories delivered; four CRs (two delivered, one declined, one deferred to phase 2). Go-live three weeks after baseline: two from an approved CR, one from the late store account. No critical issues in hypercare; four minor known issues handed over.\n- **Meeting.** A 30-minute closure meeting with the client sponsor walks through the report. The sponsor signs it.\n- **Close down.** Oyelabs users removed from the client's AWS and store accounts; the project board archived; recurring meetings cancelled; project codes closed.\n- **Share.** The PM presents the two lessons at the next PM meeting.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **The project never formally closes.** Small requests keep arriving months later as \"part of the project\". Recover: send the closure report now, even late, and point new requests to the support plan or a CR.\n- **A blame session.** The retro becomes about one developer or the client's SPOC. Recover: stop, restate the blameless rule, and move back to the timeline and the process.\n- **Actions with no owner.** \"Improve estimates\" with no name and no date. Recover: rewrite each action as a concrete change with an owner and a date before the meeting ends.\n- **Lessons kept in the team.** Recover: share them with other PMs and update the templates they affect.\n- **Access left open.** Old agency accounts on client hosting, old client guests in Oyelabs tools. Recover: run the access removal plan now and confirm it with the client.\n- **A report that hides variance.** Recover: state the variance and its causes plainly; the CR log and MoM back you up.",
        },
        {
          heading: "Your checklist",
          body:
            "- Entry criteria met: handover complete, all milestones invoiced.\n- Data gathered: timeline, CR log, hypercare log, planned against actual.\n- Blameless retro held; two or three actions with owners and dates.\n- Closure report written from the template, honest about variance.\n- Closure meeting held; report signed by the client sponsor; MoM sent.\n- Final payments confirmed by BD.\n- Access removed as planned; shared secrets rotated.\n- Board, channels, drive and time codes archived or closed.\n- Lessons shared with other PMs and templates updated.\n- Feedback, testimonial or next-phase conversation handed to BD.",
        },
      ],
      sop: [
        {
          title: "Our closure routine",
          prompt:
            "[Oyelabs SOP – admin to fill] Where Oyelabs keeps project archives and closure reports, how lessons learned are shared with other PMs, who removes access and closes project codes, and the closure email template.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a15-retro-closure-q1",
          prompt: "According to the closure stage card, which are exit criteria for closure? (Select all that apply.)",
          options: [
            "Closure report shared",
            "Retrospective held and lessons recorded",
            "Project archived and access removed",
            "A new project signed with the same client",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "A case study or referral is asked for where appropriate, but a new contract is not a condition of closing the old project.",
        },
        {
          id: "pmp-a15-retro-closure-q2",
          prompt: "What is the main difference between the retrospective and the closure report?",
          options: [
            "They are the same document",
            "The retro looks inward at how the team worked and produces actions; the closure report records the project's results for the client and Oyelabs and is signed off",
            "The retro is for the client only",
            "The closure report is optional",
          ],
          correctIndex: 1,
          explanation: "The retro improves how Oyelabs works. The closure report is the formal record of what was delivered and how.",
        },
        {
          id: "pmp-a15-retro-closure-q3",
          prompt: "Which retro action is well written?",
          options: [
            "Communicate better",
            "Be more careful with estimates",
            "Set up client store accounts in week 1 on every mobile project; owner: PM lead, added to the release checklist by the end of the month",
            "Try harder next time",
          ],
          correctIndex: 2,
          explanation: "A real action is a concrete change with an owner and a date. Vague intentions do not change anything.",
        },
        {
          id: "pmp-a15-retro-closure-q4",
          prompt:
            "In the retro, a developer says, \"UAT went badly because the client's SPOC is lazy.\" What do you do?",
          options: [
            "Agree and write it down",
            "Restate the blameless rule and turn it into a process question: what about how UAT was planned and supported made it hard for the SPOC?",
            "End the retro",
            "Forward the comment to the client",
          ],
          correctIndex: 1,
          explanation: "Blame stops people being honest and changes nothing. Process questions lead to actions, such as a clearer UAT plan or test scripts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a15-retro-closure-q5",
          prompt:
            "Go-live was three weeks late: two weeks from an approved CR that moved the date, and one week waiting for the client's store account. How should the closure report state this?",
          options: [
            "On time, since the CR was approved",
            "Three weeks after baseline: two weeks from the approved CR, one week from the late client store account",
            "Leave it out to keep the client happy",
            "Three weeks late due to the development team",
          ],
          correctIndex: 1,
          explanation: "State the variance and each cause plainly. The CR log and MoM are the evidence. Hiding or misattributing variance damages trust.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a15-retro-closure-q6",
          prompt: "Who is accountable for confirming final payments at closure, according to the stage card's RACI?",
          options: ["The PM", "The tech lead", "BD/account manager", "The client SPOC"],
          correctIndex: 2,
          explanation: "BD owns money. The PM is consulted and makes sure the closure report matches what was invoiced.",
        },
        {
          id: "pmp-a15-retro-closure-q7",
          prompt:
            "The client moves straight into a support retainer after handover. Does the build project still need a formal closure?",
          options: [
            "No: the relationship continues",
            "Yes: close the build project (report, retro, archive, access review), and run support under its own plan and rhythm",
            "Only if the client asks",
            "Only after the retainer ends",
          ],
          correctIndex: 1,
          explanation: "Without closure, support requests blur into \"the project\" and the build never ends. Close the project, not the relationship.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a15-retro-closure-q8",
          prompt: "Which data should you bring to a project retrospective? (Select all that apply.)",
          options: [
            "Planned against actual dates",
            "The CR log",
            "The hypercare log",
            "Each developer's personal performance ratings",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Project data keeps the conversation on facts and process. Personal ratings belong in private performance conversations.",
        },
        {
          id: "pmp-a15-retro-closure-q9",
          prompt: "Six months after a project ended, a former developer's account still has admin access to the client's hosting. Which closure step was missed?",
          options: [
            "The retrospective",
            "Running the access removal plan and confirming it with the client",
            "The case study",
            "Sending the closure report",
          ],
          correctIndex: 1,
          explanation: "Forgetting to remove access is a listed pitfall. It is a security risk for the client and a liability for Oyelabs.",
        },
        {
          id: "pmp-a15-retro-closure-q10",
          prompt: "Why should lessons learned be shared beyond the project team?",
          options: [
            "To blame the team",
            "Because the stage card lists \"lessons not shared with other PMs\" as a pitfall: shared lessons, and updated templates, stop the next project repeating the mistake",
            "Because clients require it",
            "They should not be shared",
          ],
          correctIndex: 1,
          explanation: "A lesson only changes behaviour when it reaches the people who start the next project, ideally built into the templates they use.",
        },
      ],
      practice: {
        kind: "form",
        variant: "template",
        prompt: "Fill in the key rows of the closure report from the project facts.",
        context:
          "**Project:** React Native fitness app with a Laravel API for a US client. Handover signed; all milestones invoiced.\n\n**Baseline go-live:** 3 March. **Actual go-live:** 24 March.\n\n**CR log:**\n- CR-001 Apple Health sync: approved, delivered, no date change.\n- CR-002 coach chat: approved, delivered, moved go-live by 2 weeks (approved in writing).\n- CR-003 Android widgets: declined.\n- CR-004 web dashboard for coaches: approved, deferred to phase 2.\n\n**Other delay:** one week waiting for the client's Apple organisation account.\n\n**Hypercare:** no critical issues; four minor known issues handed over.\n\n**Retro notes:** design feedback came from three client people with conflicting comments; store accounts were set up in sprint 4.",
        templateId: "closure-report",
        fields: [
          { id: "slip", label: "Go-live slip against the baseline (weeks)", input: "number", required: true },
          { id: "cr-slip", label: "Weeks of that slip caused by approved CRs", input: "number", required: true },
          { id: "cr-delivered", label: "Number of CRs approved and delivered in this project", input: "number", required: true },
          {
            id: "schedule",
            label: "Schedule status for the report",
            input: "select",
            options: ["On baseline", "Late, fully explained by approved CRs", "Late, partly explained by approved CRs"],
            required: true,
          },
          { id: "lessons", label: "Lessons learned, each with an action and an owner", input: "textarea", required: true },
          { id: "open", label: "Open items and recommendations", input: "textarea", required: true },
        ],
        checks: [
          { fieldId: "slip", expected: 3 },
          { fieldId: "cr-slip", expected: 2 },
          { fieldId: "cr-delivered", expected: 2 },
          { fieldId: "schedule", expected: "Late, partly explained by approved CRs" },
        ],
        rubric: [
          { label: "Actionable lessons", points: 3, description: "Turns both retro notes into concrete actions with owners: a single named design approver from kickoff, and store accounts set up in week 1. Blameless wording." },
          { label: "Complete open items", points: 2, description: "Lists the four known issues handed over and CR-004 deferred to phase 2, with a recommendation for the next step (support plan, phase-2 conversation via BD)." },
        ],
        sampleAnswer: {
          slip: "3",
          "cr-slip": "2",
          "cr-delivered": "2",
          schedule: "Late, partly explained by approved CRs",
          lessons:
            "1. Design feedback came from three client people with conflicting comments. Action: name a single design approver at the client kickoff and add it to the kickoff template. Owner: PM lead.\n2. Store accounts were set up in sprint 4 and cost a week. Action: request client Apple and Google organisation accounts in week 1 of every mobile project; add to the release checklist. Owner: PM lead.",
          open:
            "Four minor known issues handed over with workarounds (see the handover checklist). CR-004, the coach web dashboard, was approved and deferred to phase 2. Recommendation: cover the known issues under the support plan, and BD to schedule a phase-2 conversation about CR-004 with the client sponsor.",
        },
      },
    },
    {
      id: "pmp-a15-case-study-upsell",
      moduleId: "pmp-a15",
      trackId: "pm",
      title: "Case study and upsell after closure",
      summary:
        "The end of a project is the best moment to start the next one. The client has just seen what the team can do, the product has its first real results, and the backlog is full of ideas that did not fit the first release. Two things can come from that: a case study that helps Oyelabs win similar clients, and a next phase, support plan or retainer that helps this client keep going.\n\nBoth must be earned, and both have rules. A case study needs the client's permission. Check the [[term:nda]] and any publicity clause in the [[term:msa]], get written approval of the final text, and use only numbers the client agrees to share. Atlassian's \"goals, signals and measures\" play is a good way to agree what success means and how it is measured, ideally from kickoff. Its customer interview play is a good way to hear the client's story in their own words. The upsell needs evidence and timing. The Shopify Partners guide to agency upselling suggests making the offer when there is data to support it, and a [[term:qbr]] or the closure meeting is a natural moment.\n\nThe stage card makes BD accountable for asking for feedback, a testimonial or the next phase; the PM is consulted and brings the evidence. The common mistakes are pitching a [[term:phase-2]] while bugs are still open, publishing a case study the client never approved, and a PM quoting prices on the spot. This is the last stage of Course A: done well, it turns the end of one project into the start of the next.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Atlassian Team Playbook: Goals, signals and measures", url: "https://www.atlassian.com/team-playbook/plays/goals-signals-measures", kind: "docs", verifiedAt: "2026-10-02T11:53:28Z" },
        { label: "Atlassian Team Playbook: Customer interview", url: "https://www.atlassian.com/team-playbook/plays/customer-interview", kind: "docs", verifiedAt: "2026-10-02T12:05:51Z" },
        { label: "Shopify Partners: A guide to growing your agency by upselling clients", url: "https://www.shopify.com/partners/blog/a-guide-to-growing-your-agency-by-upselling-clients", kind: "article", verifiedAt: "2026-10-02T12:01:30Z" },
        { label: "Insites: How to upsell to your existing agency clients", url: "https://insites.com/blog/how-to-upsell-to-your-existing-agency-clients/", kind: "article", verifiedAt: "2026-10-02T12:01:32Z" },
      ],
      video: {
        title: "Make A Case Study That Gets Client Work",
        channel: "The Futur",
        url: "https://www.youtube.com/watch?v=31Uc5TA8ntA",
        videoId: "31Uc5TA8ntA",
        verifiedAt: "2026-10-02T12:17:18Z",
      },
      alternateVideos: [
        {
          title: "Account Management 101: Exactly How to Get Existing Customers to Buy More (Without Feeling Sold To)",
          channel: "Sell Better",
          url: "https://www.youtube.com/watch?v=XTlrt4S4W38",
          videoId: "XTlrt4S4W38",
          verifiedAt: "2026-10-02T12:17:18Z",
        },
        {
          title: "How to Upsell Your Current Agency Clients",
          channel: "ZenPilot",
          url: "https://www.youtube.com/watch?v=z4moCpOHcLY",
          videoId: "z4moCpOHcLY",
          verifiedAt: "2026-10-02T12:17:18Z",
        },
      ],
      handbook: {
        stages: ["custom-closure", "custom-support"],
        rules: ["billing-change-request", "billing-new-feature", "mom-after-every-client-meeting"],
        templates: ["closure-report"],
      },
      sections: [
        {
          heading: "Who does what",
          body:
            "From the closure stage card: **asking for feedback, a testimonial or the next phase** is R and A for the BD/account manager, with the PM consulted and the client sponsor informed. The support stage card gives BD the same role for **proposing renewal or upgrade**.\n\nIn practice:\n\n- **The PM** knows the product, the backlog, the data and the client's people. The PM spots opportunities, prepares the evidence and the delivery view (what it would take, which team, which risks).\n- **BD** owns the ask, the commercial proposal and the price.\n- **The client sponsor** decides.\n\nThe PM never quotes a price or a date for new work on the spot. \"That's a good idea; let me put together what it would involve and come back with BD\" is the right sentence.",
        },
        {
          heading: "Earn the right to ask",
          body:
            "Ask too early and the client hears \"they want more money before they finished the job\". Before any case study or upsell conversation, check:\n\n- **Open problems are closed or have a clear plan.** No open critical issues, the known issues are handed over, the hypercare log is reviewed.\n- **The money is settled.** BD confirms there are no disputed invoices.\n- **There is real evidence.** Some results from live use: adoption, orders, time saved, ratings. Atlassian's goals, signals and measures play helps you agree these measures with the client, ideally at kickoff, so you are not inventing them at the end.\n- **The relationship is healthy.** If the sponsor is unhappy, the next step is a recovery conversation, not a pitch.\n\nIf these are not true yet, close the project anyway and put a date in the calendar to revisit, for example after the first support report or at a QBR.",
        },
        {
          heading: "Building a case study: permission first",
          body:
            "1. **Check the contract with BD.** The NDA and MSA may restrict naming the client or showing the product. Not legal advice: the signed contract always wins.\n2. **Ask for permission in writing,** and offer an anonymised version (\"a UAE coffee chain\") if the client does not want to be named.\n3. **Interview the client.** Atlassian's customer interview play recommends open questions and listening, not leading. Ask what problem they had, why they chose to build, what changed after launch.\n4. **Structure it simply.** The problem, the approach, the result. Use the client's own words for the problem and their own numbers for the result.\n5. **Use only approved numbers.** Never publish analytics you saw during support without permission.\n6. **Get the final text approved in writing,** including screenshots and logos.\n\nA testimonial is the light version: a sentence or two in the client's words, approved in writing. It is often easier to get, and still valuable.",
        },
        {
          heading: "Finding the next phase",
          body:
            "Good upsells are not invented at the closure meeting. They are already in the project records:\n\n- **The phase-2 list** and deferred CRs from delivery.\n- **Declined CRs** that the client wanted but could not fund at the time.\n- **Enhancement requests** from the hypercare log and support tickets.\n- **Product data:** where users drop off, which features are most used, what the client's customers ask for.\n- **Maintenance needs:** OS releases, dependency upgrades and technical debt that call for an [[term:amc]] or [[term:retainer]].\n\nFrame each idea as a client outcome, not as work for Oyelabs: \"Coaches spend 20 minutes a day answering the same questions; the coach dashboard from CR-004 would cut that\" rather than \"we can build a dashboard\". Then hand it to BD with the evidence, and let BD shape the proposal: a new phase, a [[term:change-request]], a support plan, or a retainer.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A React Native fitness app with a Laravel API for a US client.* Closure meeting next week. Hypercare had no critical issues, the four minor known issues are handed over, and BD confirms the final invoice is paid.\n\n- **Evidence.** At kickoff the client agreed two measures: sign-ups in the first month and weekly active users. The client's own dashboard shows strong numbers for both, and the client's product owner agrees they can be quoted.\n- **Opportunities.** The PM lists CR-004 (the coach dashboard, deferred to phase 2), 11 enhancement requests from the hypercare log, and the upcoming iOS release, which will need adaptive maintenance.\n- **Prep with BD.** The PM gives BD a one-page summary: outcomes, opportunities in the client's words, and a rough delivery view. BD prepares the commercial side.\n- **Closure meeting.** The PM walks through the closure report. At the end, BD thanks the sponsor and asks two things: permission for a case study (named or anonymised) and a 30-minute call next month about the coach dashboard and a support plan.\n- **Follow-up.** The PM sends the MoM the same day. The client approves an anonymised case study; the phase-2 call is booked.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Pitching while bugs are open.** Recover: stop the pitch, fix or plan the open items, and come back with the outcome.\n- **A case study published without written approval.** Recover: take it down, apologise, and ask properly. Check the NDA first next time.\n- **Numbers the client did not approve.** Recover: replace them with approved figures or qualitative results.\n- **The PM quotes a price.** \"About two weeks and not much money\" becomes the client's budget. Recover: correct it in writing quickly, and route the proposal through BD.\n- **No next step after closure.** The client goes quiet and hires another agency for phase 2. Recover: BD books a follow-up, for example after the first support report or at a QBR.\n- **Overselling.** Proposing a big new phase to a client whose real need is a small support plan. Recover: lead with what the data shows they need.",
        },
        {
          heading: "Looking back: Course A in one view",
          body:
            "This is the last stage of the custom project lifecycle. The thread through all sixteen stages is the same: agree it in writing, keep evidence, and let the accountable person decide.\n\n- **Start:** BD handover, estimation, internal and client kickoff.\n- **Define:** discovery, requirements, design approval, Sprint 0.\n- **Build:** sprints, scope control, QA and UAT.\n- **Launch:** go/no-go, cutover, store submission, hypercare and warranty.\n- **Finish:** handover and KT, support and retainers, closure.\n\nThe documents from each stage (the SOW, signed requirements, the CR log, the UAT sign-off, the go-live checklist, the hypercare log, the handover checklist, the closure report) are what make the next conversation, and the next project, easier.",
        },
        {
          heading: "Your checklist",
          body:
            "- Open issues closed or planned; final invoice confirmed by BD; relationship healthy.\n- Success measures agreed with the client, ideally from kickoff, with their numbers.\n- NDA and publicity clause checked with BD before asking for a case study.\n- Case study permission, text, numbers and images approved in writing; anonymised if needed.\n- Next-phase opportunities listed from the phase-2 list, CRs, hypercare and support data.\n- Each opportunity framed as a client outcome, with evidence.\n- BD owns the ask and the price; the PM brings the delivery view.\n- A clear next step booked and recorded in the MoM.",
        },
      ],
      sop: [
        {
          title: "Our case study and referral process",
          prompt:
            "[Oyelabs SOP – admin to fill] Who at Oyelabs writes and approves case studies, the client permission template, where testimonials are stored, and how PMs hand next-phase opportunities to BD.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a15-case-study-upsell-q1",
          prompt: "Who is accountable for asking for feedback, a testimonial or the next phase, according to the closure stage card?",
          options: ["The PM", "The tech lead", "BD/account manager", "The client SPOC"],
          correctIndex: 2,
          explanation: "BD is responsible and accountable; the PM is consulted and brings the evidence and the delivery view.",
        },
        {
          id: "pmp-a15-case-study-upsell-q2",
          prompt: "What must you check before asking a client for a named case study? (Select all that apply.)",
          options: [
            "The NDA and any publicity clause in the MSA, with BD",
            "That open issues are closed or have a clear plan",
            "That the client will approve the final text and numbers in writing",
            "That a competitor has published one recently",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Permission, timing and written approval come first. What competitors publish does not change your obligations.",
        },
        {
          id: "pmp-a15-case-study-upsell-q3",
          prompt:
            "During support, you saw the client's analytics: revenue grew strongly after launch. Can you put that number in the case study?",
          options: [
            "Yes: you saw it, so it is fair to use",
            "Only if the client agrees to share that number, in writing",
            "Yes, if you round it",
            "Yes, if the client is anonymised",
          ],
          correctIndex: 1,
          explanation: "Data you saw while working for the client is confidential unless they approve its use. Even anonymised, a specific figure can identify them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a15-case-study-upsell-q4",
          prompt:
            "At the closure meeting, the sponsor asks, \"How much would the coach dashboard cost?\" What should the PM say?",
          options: [
            "Give a rough number to keep the energy going",
            "Say it is a good idea, explain what it would involve at a high level, and say BD will come back with a proposal",
            "Say it is free as a thank-you",
            "Refuse to discuss new work",
          ],
          correctIndex: 1,
          explanation: "A number said aloud becomes the client's budget. The PM gives the delivery view; BD owns pricing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a15-case-study-upsell-q5",
          prompt: "Where do good next-phase ideas usually come from? (Select all that apply.)",
          options: [
            "Deferred and declined CRs",
            "Enhancement requests in the hypercare log and support tickets",
            "Product data on what users do",
            "Features from a competitor's app the client never mentioned",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "The best upsells are needs the client has already expressed or that their data shows. Copying a competitor without a client need is a guess.",
        },
        {
          id: "pmp-a15-case-study-upsell-q6",
          prompt: "Which way of framing a next-phase idea is strongest?",
          options: [
            "We can build a dashboard for you",
            "Coaches spend a lot of time answering the same questions; the coach dashboard deferred in CR-004 would cut that",
            "Other clients bought a dashboard",
            "Our team is free next month",
          ],
          correctIndex: 1,
          explanation: "Frame ideas as client outcomes with evidence. Agency availability is not a reason for the client to buy.",
        },
        {
          id: "pmp-a15-case-study-upsell-q7",
          prompt:
            "Hypercare ended with two high-severity issues still open, and the sponsor is frustrated. BD wants to pitch phase 2 at the closure meeting. What do you advise?",
          options: [
            "Pitch anyway: momentum matters",
            "Fix or plan the open issues first, hold a recovery conversation, and come back to phase 2 once the sponsor sees the outcome",
            "Cancel the closure meeting",
            "Offer phase 2 at a discount to make up for the issues",
          ],
          correctIndex: 1,
          explanation: "You have to earn the right to ask. A pitch over open problems sounds like the agency cares more about the next invoice than this one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a15-case-study-upsell-q8",
          prompt: "Why agree success measures with the client early in the project, as Atlassian's goals, signals and measures play suggests?",
          options: [
            "So you can invent good numbers later",
            "So that at closure there is agreed, measurable evidence of the outcome, from the client's own data",
            "Because app stores require it",
            "It does not matter when you agree them",
          ],
          correctIndex: 1,
          explanation: "Measures agreed at the start are trusted at the end. Measures chosen after launch look like cherry-picking.",
        },
        {
          id: "pmp-a15-case-study-upsell-q9",
          prompt: "The client does not want to be named publicly. What can you still offer?",
          options: [
            "Nothing: drop the case study",
            "An anonymised case study (for example \"a UAE coffee chain\") or a short testimonial, approved in writing",
            "Publish it named anyway; it is good for them",
            "A case study with the logo blurred, without asking",
          ],
          correctIndex: 1,
          explanation: "Anonymised case studies and testimonials still help, and respect the client's choice. Everything is still approved in writing.",
        },
        {
          id: "pmp-a15-case-study-upsell-q10",
          prompt: "In a customer interview for a case study, which question is best?",
          options: [
            "Wasn't our team amazing?",
            "What was the problem before the app, and what changed after launch?",
            "Would you agree the project was a big success?",
            "Can you confirm revenue went up?",
          ],
          correctIndex: 1,
          explanation: "Atlassian's customer interview play favours open, non-leading questions. The client's own words make the case study believable.",
        },
        {
          id: "pmp-a15-case-study-upsell-q11",
          prompt:
            "A client's live product is stable, but a major iOS release is coming and they have no plan after warranty. What is the most fitting proposal?",
          options: [
            "A large new phase of features",
            "A support and maintenance plan such as an AMC, covering adaptive work for the iOS release, proposed through BD",
            "Nothing until something breaks",
            "A free fix promise",
          ],
          correctIndex: 1,
          explanation: "Lead with what the client actually needs. Overselling a big phase to a client who needs maintenance damages trust.",
        },
      ],
      practice: {
        kind: "write",
        variant: "email",
        prompt:
          "Write the follow-up email to the client sponsor after the closure meeting. Thank them, confirm the closure, and set up the next steps: the case study permission and a call about phase 2 and support with BD. Do not quote prices.",
        context:
          "Project: React Native fitness app with a Laravel API for a US client. Today was the closure meeting with the sponsor, Dana (VP Product). The sponsor signed the closure report in the meeting.\n\nFacts: the app launched on both stores; the client agreed at kickoff to measure first-month sign-ups and weekly active users, and both beat the targets the client set. No critical issues in hypercare; four minor known issues are handed over and covered by the support plan options BD will send. CR-004 (coach web dashboard) is approved and deferred to phase 2. The client's coaches have asked for it several times. A major iOS release is expected in the autumn.\n\nIn the meeting: Dana said she was happy to consider a case study but would prefer not to share revenue numbers, and might prefer the company not to be named. Your BD colleague is Omar. Dana suggested a call in two or three weeks.",
        wordLimit: 230,
        rubric: [
          { id: "close", label: "Clear closure", description: "Thanks the sponsor, confirms the closure report is signed and the project is formally closed, and mentions the known issues and where they go.", weight: 1.5 },
          { id: "permission", label: "Case study done right", description: "Asks for permission in writing, offers an anonymised version, excludes revenue numbers, and promises the final text for approval.", weight: 2 },
          { id: "next", label: "Next phase framed as outcomes", description: "Raises CR-004 in terms of the coaches' need and the iOS release as a maintenance need, introduces BD, quotes no price or effort.", weight: 2 },
          { id: "ask", label: "Clear next step", description: "Proposes specific times or a date for the call with BD, within Dana's two-to-three-week window.", weight: 1 },
        ],
        sampleAnswer:
          "Subject: Thank you, and next steps after closure\n\nHi Dana,\n\nThank you for today, and for signing the closure report. The build project is now formally closed. The four minor known issues are listed in the handover pack, and Omar will send the support plan options that cover them.\n\nCase study: thank you for being open to it. We would write it without revenue figures, and we are happy to keep your company anonymous, for example \"a US fitness brand\". Could you confirm by email which you prefer? You will approve the final text, numbers and images before anything is published.\n\nNext phase: your coaches keep asking for the dashboard in CR-004, and the autumn iOS release will need some update work on the app. Omar and I would like to walk you through both, so you can decide what fits your plans.\n\nWould Tuesday 14th or Thursday 16th at 10:00 your time suit you for a 30-minute call with Omar and me?\n\nThanks again for a great project,\nSam",
      },
    },
  ],
} satisfies Module;
