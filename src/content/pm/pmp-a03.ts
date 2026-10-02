import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a03",
  trackId: "pm",
  name: "Custom lifecycle: Internal kickoff",
  description:
    "Getting the Oyelabs delivery team aligned before the client sees it: what was sold and what was not, who does what, the first plan and milestones, the initial risk register, and the environments and access the team needs before Sprint 0.",
  topics: [
    {
      id: "pmp-a03-internal-kickoff",
      moduleId: "pmp-a03",
      trackId: "pm",
      title: "Running the internal kickoff",
      summary:
        "The internal kickoff is a short meeting, typically an hour or two, where the PM walks the delivery team through what was sold before anyone talks to the client. The stage card below has the entry and exit criteria and the RACI.\n\nWhy it matters at an agency: the team did not sit in the sales calls. Developers know a Laravel or React Native build, not what BD promised in the third call. If the first time they hear the scope is in the client kickoff, three things go wrong. The tech lead contradicts the [[term:sow]] in front of the client. Nobody knows what is [[term:out-of-scope]], so they say yes to it. And risks the team could have seen in ten minutes surface in week four.\n\nHow to run it:\n\n- **Before:** read the handover pack, the SOW and the [[term:estimate]]. Draft the plan, the [[term:raci]] and a first [[term:raid-log]].\n- **In the room:** the goal and the client's business in two minutes; scope and out-of-scope line by line; the [[term:milestone|milestones]]; the team and RACI; the risks; [[term:environment|environments]] and access; ways of working.\n- **After:** send short internal minutes, update the RAID log and draft the client kickoff agenda.\n\nThe common mistake is skipping it because the team is busy on another project. A 60-minute internal kickoff is the cheapest risk review you will ever run.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Atlassian Team Playbook: Project kickoff", url: "https://www.atlassian.com/team-playbook/plays/project-kickoff", kind: "docs", verifiedAt: "2026-10-02T11:53:21Z" },
        { label: "Atlassian Team Playbook: Working agreements", url: "https://www.atlassian.com/team-playbook/plays/working-agreements", kind: "docs", verifiedAt: "2026-10-02T11:53:27Z" },
        { label: "The Digital Project Manager: Project kickoff guide", url: "https://thedigitalprojectmanager.com/project-management/project-kickoff-guide/", kind: "article", verifiedAt: "2026-10-02T11:58:55Z" },
        { label: "Asana: Project kickoff meeting - 10-step guide", url: "https://asana.com/resources/project-kickoff-meeting", kind: "article", verifiedAt: "2026-10-02T11:58:26Z" },
      ],
      video: {
        title: "How to Run a Brilliant Project Kick Off Meeting | The Everyday Project Manager",
        channel: "The Everyday Project Manager",
        url: "https://www.youtube.com/watch?v=ccgKREwz0jg",
        videoId: "ccgKREwz0jg",
        verifiedAt: "2026-10-02T12:16:59Z",
      },
      alternateVideos: [
        {
          title: "Project Kickoff Meetings | 5-Minute Guide",
          channel: "TeamGantt",
          url: "https://www.youtube.com/watch?v=Bu84BEkN2e4",
          videoId: "Bu84BEkN2e4",
          verifiedAt: "2026-10-02T12:16:58Z",
        },
        {
          title: "Kickoff Meeting [YOUR GUIDE TO STARTING PROJECTS]",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=0PQLEyFEgag",
          videoId: "0PQLEyFEgag",
          verifiedAt: "2026-10-02T12:16:58Z",
        },
      ],
      handbook: { stages: ["custom-internal-kickoff"], templates: ["kickoff-agenda", "raid-log-template"] },
      sections: [
        {
          heading: "A 60-minute internal agenda",
          body:
            "1. **The client and the why (5 min).** Who they are, what the product must achieve, what success looks like for them.\n2. **What was sold (15 min).** Walk the SOW: features, platforms, integrations, [[term:milestone|milestones]]. Then the [[term:out-of-scope]] list and the key [[term:assumption|assumptions]]. Ask the tech lead to challenge anything that looks under-estimated.\n3. **The commercial model (5 min).** [[term:fixed-bid]] or [[term:time-and-materials]], and what that means for changes. On a fixed bid, the team must not quietly absorb extras.\n4. **Team and RACI (5 min).** Who is R and A for each activity, and the client's [[term:spoc]] and sponsor.\n5. **Plan and milestones (10 min).** The draft plan, the first gate dates and the dependencies on the client.\n6. **Risks (10 min).** A quick pre-mortem: \"It is launch day and this project failed. Why?\" Capture the answers in the RAID log.\n7. **Environments, access and ways of working (10 min).** Repositories, [[term:dev-environment|dev]], [[term:staging-environment|staging]] and [[term:uat-environment|UAT]] environments, tools, stand-up time, the [[term:definition-of-done]] draft.\n\nEnd with owners and dates for every action.",
        },
        {
          heading: "What the team must leave knowing",
          body:
            "Test it at the end. Each person should be able to answer:\n\n- What are we building, for whom, and what is the first milestone?\n- What are we **not** building? (Ask them to name two out-of-scope items.)\n- Who do I ask about scope, and who talks to the client? (Usually only the PM and, when invited, the tech lead.)\n- What do I need, and by when, to start work?\n\nIf someone cannot answer, the kickoff is not finished.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Skipping it.** Recover: hold a 30-minute version before the client kickoff, even if it has to be the same morning.\n- **Reading the SOW aloud without discussion.** The team nods and remembers nothing. Recover: ask the tech lead and QA to find the three riskiest lines.\n- **Not covering out of scope.** Recover: put the out-of-scope list on the project board where developers see it.\n- **Developers talking scope directly with the client.** Recover: agree the channel rule now: scope questions go through the PM.\n- **No minutes.** Recover: send five bullet points the same day.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Handover pack, SOW and estimate read before the meeting.\n2. Scope and out-of-scope covered line by line.\n3. Draft plan, RACI and RAID log shared.\n4. Environments and tool access requested, with owners.\n5. Client kickoff agenda drafted.\n6. Internal minutes sent the same day.",
        },
      ],
      sop: [
        {
          title: "Internal kickoff invite and minutes",
          prompt: "[Oyelabs SOP – admin to fill] Who must attend an Oyelabs internal kickoff (for example the delivery head or BD), the calendar invite template, and where internal minutes are stored.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a03-internal-kickoff-q1",
          prompt: "Why run the internal kickoff before the client kickoff?",
          options: [
            "So the team agrees on scope, plan and risks before the client hears them",
            "Because the client is not allowed to know the team",
            "To estimate the price for the first time",
            "To get the client's sign-off on the plan",
          ],
          correctIndex: 0,
          explanation: "The client kickoff should be run by a team that already agrees. Disagreements in front of the client cost trust.",
        },
        {
          id: "pmp-a03-internal-kickoff-q2",
          prompt: "Which are exit criteria of the internal kickoff? (Select all that apply.)",
          options: [
            "The team understands scope and out-of-scope items",
            "Draft plan, RACI and RAID log ready",
            "Environments and tools requested",
            "Requirements signed off by the client",
            "UAT environment tested by the client",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "The client signs off requirements in discovery. The internal kickoff ends with an aligned team and the first plan, RACI, RAID log and access requests.",
        },
        {
          id: "pmp-a03-internal-kickoff-q3",
          prompt: "During the internal kickoff, the tech lead says one integration in the SOW looks like three weeks, not one. What do you do?",
          options: [
            "Log it as a risk, review it with the tech lead and BD before the client kickoff, and decide how to handle it",
            "Ignore it; the SOW is signed",
            "Raise it with the client in the kickoff as the tech lead's opinion",
            "Ask the developers to work weekends",
          ],
          correctIndex: 0,
          explanation: "This is exactly what the internal kickoff is for. Log it, check the assumptions, and agree a position internally before you face the client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a03-internal-kickoff-q4",
          prompt: "Why spend time on the out-of-scope list with the developers?",
          options: [
            "So they do not build or promise things that were not sold",
            "Because developers write the SOW",
            "So they can estimate those items for free",
            "It is not needed; only the PM needs to know",
          ],
          correctIndex: 0,
          explanation: "On a fixed bid, every quietly absorbed extra comes out of the margin. Developers are often the first to be asked.",
        },
        {
          id: "pmp-a03-internal-kickoff-q5",
          prompt: "What is a pre-mortem?",
          options: [
            "Imagining the project has failed and listing the reasons, to find risks early",
            "A review after the project ends",
            "A meeting to assign blame",
            "The first sprint demo",
          ],
          correctIndex: 0,
          explanation: "It makes it safe to name risks. The answers go into the RAID log.",
        },
        {
          id: "pmp-a03-internal-kickoff-q6",
          prompt: "The delivery head says, \"The team is busy, skip the internal kickoff and just brief the tech lead.\" What is the best response?",
          options: [
            "Propose a 30-minute version with the core team, because risks found later cost far more",
            "Agree and skip it",
            "Cancel the client kickoff",
            "Brief everyone by forwarding the SOW",
          ],
          correctIndex: 0,
          explanation: "Shrink it rather than skip it. Forwarding a SOW is not alignment.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a03-internal-kickoff-q7",
          prompt: "Who is Accountable for requesting repositories, environments and tool access?",
          options: ["The PM, though the tech lead does the requesting", "The client SPOC", "The BD manager", "Each developer for themselves"],
          correctIndex: 0,
          explanation: "The tech lead is Responsible, but the PM is Accountable that access is ready in time for Sprint 0.",
        },
        {
          id: "pmp-a03-internal-kickoff-q8",
          prompt: "A developer asks for the client's WhatsApp number to \"clear up a few things directly\". What should the kickoff have agreed?",
          options: [
            "A channel rule: scope questions go through the PM, and technical calls with the client are arranged by the PM",
            "Developers can contact the client however they like",
            "Nobody may ever speak to the client except BD",
            "Questions should wait until UAT",
          ],
          correctIndex: 0,
          explanation: "Direct, untracked channels are where scope is promised by accident. Agree the rule early and arrange technical calls when needed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a03-internal-kickoff-q9",
          prompt: "Which documents should the PM read before the internal kickoff? (Select all that apply.)",
          options: ["The SOW", "The estimate", "The BD handover pack and call notes", "The final UAT sign-off"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "UAT sign-off happens at the end. The PM needs what was sold and how it was estimated.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A new PM drafted these internal kickoff minutes for a fixed-bid Laravel and React booking platform for a UK clinic chain. Mark the lines that show a problem.",
        segments: [
          { id: "s1", text: "Attendees: PM, tech lead, two backend developers, frontend developer, QA, designer.", issue: null },
          { id: "s2", text: "Client: a chain of 14 clinics. Goal: online booking and reminders so reception spends less time on the phone.", issue: null },
          { id: "s3", text: "Scope: patient booking web app, clinic admin panel, SMS reminders, Stripe payments, as in SOW section 3.", issue: null },
          { id: "s4", text: "Out of scope: not discussed, we can cover it with the client.", issue: "The team must know what was not sold before the client kickoff, or they will promise it." },
          { id: "s5", text: "Tech lead flagged the clinic's existing patient system integration as larger than estimated. Agreed to keep quiet and see how it goes.", issue: "A known estimation risk must go into the RAID log and be raised with BD before the client kickoff, not hidden." },
          { id: "s6", text: "Milestones: requirement sign-off end of week 3, design approval week 5, UAT week 14, go-live week 16.", issue: null },
          { id: "s7", text: "RACI: PM and tech lead both accountable for the estimate.", issue: "One Accountable per activity. The tech lead owns the estimate; the PM owns the review." },
          { id: "s8", text: "Developers can message the clinic's IT manager directly on WhatsApp for any questions.", issue: "Untracked direct channels lead to promised scope. Questions go through the PM, who arranges technical calls." },
          { id: "s9", text: "Tech lead to request the repository, dev and staging environments by Thursday.", issue: null },
          { id: "s10", text: "Client dependencies: SMS provider account and Stripe keys, owner and date to confirm at the client kickoff.", issue: null },
          { id: "s11", text: "Stand-up daily at 10:00. Draft definition of done to be shared by QA on Friday.", issue: null },
          { id: "s12", text: "Next step: PM to draft the client kickoff agenda and circulate it internally by Wednesday.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pmp-a03-plan-risks-environments",
      moduleId: "pmp-a03",
      trackId: "pm",
      title: "Plan, risk register and environments",
      summary:
        "Three things leave the internal kickoff in draft and become the backbone of delivery: the plan, the [[term:raid-log]] and the [[term:environment]] setup.\n\nWhy they matter at an agency: a custom project's dates depend on the client as much as on the team. Content, API keys, store accounts and sign-offs all come from the client. A plan that lists only Oyelabs tasks hides the real critical path. A risk register written once and never reviewed is decoration. And environments requested in week three mean Sprint 0 starts in week four.\n\nHow to do it:\n\n- **Plan from the gates backwards.** Put the [[term:sign-off]] and approval dates first, then the [[term:client-dependency|client dependencies]] that feed them, then the team's work.\n- **Keep [[term:risk|risks]], [[term:issue|issues]], [[term:assumption|assumptions]] and [[term:dependency|dependencies]] apart.** A risk might happen. An issue already has. An assumption is believed true but not yet confirmed. A dependency is something you need from someone else.\n- **Give every row an owner, a response and a review date.** Review the log weekly and report the top risks in the [[term:status-report]].\n- **Request environments on day one.** Plan [[term:dev-environment|dev]], [[term:staging-environment|staging]], [[term:uat-environment|UAT]] and [[term:production-environment|production]], and who owns each account. Keep them as alike as possible, as the Twelve-Factor dev/prod parity principle advises.\n\nThe common mistake is a plan with no client tasks. When the client is late with content, the plan shows the agency as late.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Atlassian Team Playbook: Pre-mortem", url: "https://www.atlassian.com/team-playbook/plays/pre-mortem", kind: "docs", verifiedAt: "2026-10-02T11:53:21Z" },
        { label: "Atlassian: What is a risk register", url: "https://www.atlassian.com/work-management/project-management/risk-register", kind: "article", verifiedAt: "2026-10-02T12:06:32Z" },
        { label: "The Twelve-Factor App: Dev/prod parity", url: "https://12factor.net/dev-prod-parity", kind: "spec", verifiedAt: "2026-10-02T11:55:00Z" },
        { label: "APM: What is risk management?", url: "https://www.apm.org.uk/resources/what-is-project-management/what-is-risk-management/", kind: "article", verifiedAt: "2026-10-02T12:08:03Z" },
      ],
      video: {
        title: "What is a Risk Register & When To Use It - Project Management Training",
        channel: "ProjectManager",
        url: "https://www.youtube.com/watch?v=voR0FBnC2ZU",
        videoId: "voR0FBnC2ZU",
        verifiedAt: "2026-10-02T12:16:59Z",
      },
      alternateVideos: [
        {
          title: "Risk Register Example – All You Need to Know About It",
          channel: "IT Project Managers",
          url: "https://www.youtube.com/watch?v=9tbe9tAwnCk",
          videoId: "9tbe9tAwnCk",
          verifiedAt: "2026-10-02T12:16:59Z",
        },
      ],
      handbook: {
        stages: ["custom-internal-kickoff"],
        rules: ["weekly-status-report", "secure-credential-sharing"],
        templates: ["raid-log-template", "status-report-rag"],
      },
      sections: [
        {
          heading: "What good looks like: a worked example",
          body:
            "**A React Native and Laravel food-ordering app for a restaurant group in Dubai.** Fixed bid, 18 weeks, iOS and Android, a web admin panel, a local payment gateway and a delivery-partner API.\n\n**The plan, built from the gates backwards.** The PM writes the gates first: requirement sign-off week 3, [[term:design-approval]] week 6, UAT sign-off week 15, store submission week 16, [[term:go-live]] week 18. Then the client tasks that feed them: menu content and photos by week 8, payment gateway merchant account by week 6, delivery-partner sandbox keys by week 5, Apple and Google developer accounts by week 10. Then the team's sprints. Each client task has a named owner on the client side and goes into the client kickoff agenda.\n\n**The RAID log, first draft.**\n\n- *Risk:* the delivery-partner API is new to the team. Likelihood medium, impact high. Response: a two-day spike in Sprint 0; the tech lead owns it.\n- *Risk:* Ramadan falls in weeks 11 to 14, when the client's operations team has less time for UAT. Response: book UAT slots now and move UAT preparation earlier.\n- *Assumption:* the client's menu has fewer than 300 items with simple modifiers. Owner: PM, to confirm in discovery.\n- *Dependency:* merchant account approval, which can take weeks. Owner: client sponsor. Due week 6.\n- *Issue:* none yet.\n\n**Environments.** Dev and staging on Oyelabs-managed hosting from week 1. A UAT environment by week 12 with test payment keys. Production hosting in the client's own account, with access shared through the approved credential channel, following the Oyelabs rule in the handbook card below. The tech lead keeps staging and production on the same PHP, Node and database versions.\n\n**The weekly loop.** Every Monday the PM reviews the RAID log with the tech lead, updates the ratings and puts the top three risks and the client dependencies due in the status report.",
        },
        {
          heading: "Risk, issue, assumption, dependency: telling them apart",
          body:
            "Ask one question for each item:\n\n- **Has it already happened?** Then it is an [[term:issue]]. Act now.\n- **Might it happen, and would it hurt?** A [[term:risk]]. Rate likelihood and impact, choose a response (avoid, reduce, transfer, accept) and an owner.\n- **Are we treating it as true without proof?** An [[term:assumption]]. Give it an owner and a date to confirm. An assumption that turns out false becomes an issue, and often a [[term:change-request]].\n- **Do we need something from someone else?** A [[term:dependency]]. If the client owes it, it is a [[term:client-dependency]] with a due date, and it belongs in the status report.\n\nA fixed [[term:constraint]], like a launch date tied to a marketing campaign, is not a risk. It is a boundary the plan must respect.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **A plan with only Oyelabs tasks.** Recover: add every client dependency with an owner and date, share it at the client kickoff, and report it weekly.\n- **A RAID log written once.** Recover: book a weekly 15-minute review and put the top risks in the status report.\n- **Risks with no owner or response.** Recover: no row without an owner, a response and a review date.\n- **Environments requested late.** Recover: escalate access as a blocker now, and run Sprint 0 tasks that do not need it first.\n- **Production hosting in the agency's account by default.** Recover: agree with the client and BD who owns production before go-live planning. Ownership problems are expensive to unwind later.\n- **Staging differs from production.** Bugs appear only after release. Recover: the tech lead aligns versions and configuration, and the go-live checklist checks it.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Gates and milestone dates come first in the plan.\n2. Every client dependency has an owner and a due date.\n3. The RAID log separates risks, assumptions, issues and dependencies.\n4. Every row has an owner, a response and a review date.\n5. Environments and access are requested, with owners and dates.\n6. Production account ownership is agreed.\n7. The weekly RAID review is in the calendar.",
        },
      ],
      sop: [
        {
          title: "Plan tool and environment requests",
          prompt: "[Oyelabs SOP – admin to fill] The Oyelabs plan template or tool, how to request repositories, servers and environments internally (form, ticket, approver), and the standard environment set for Laravel, React and mobile projects.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a03-plan-risks-environments-q1",
          prompt: "The payment gateway may take four weeks to approve the client's merchant account. In the RAID log, what is it?",
          options: ["A dependency (on the client and the gateway), with a risk that it is late", "An issue", "An assumption", "A constraint"],
          correctIndex: 0,
          explanation: "You need something from someone else: a dependency. Because it might be late, you can also log the risk of delay with a response.",
        },
        {
          id: "pmp-a03-plan-risks-environments-q2",
          prompt: "The client's API documentation turns out to be out of date, and the integration is already blocked. What is it now?",
          options: ["An issue", "A risk", "An assumption", "A constraint"],
          correctIndex: 0,
          explanation: "It has already happened, so it is an issue. Act on it now and check whether the original assumption about the API means a change request.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a03-plan-risks-environments-q3",
          prompt: "Why plan from the gates backwards?",
          options: [
            "The sign-off dates and the client inputs that feed them set the real critical path",
            "Because developers prefer it",
            "To make the plan look shorter",
            "Gates are optional, so they go last",
          ],
          correctIndex: 0,
          explanation: "On a custom project, client sign-offs and inputs often decide the dates more than development does.",
        },
        {
          id: "pmp-a03-plan-risks-environments-q4",
          prompt: "Which should every RAID log row have? (Select all that apply.)",
          options: ["An owner", "A response or action", "A review date", "The client's signature"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Owner, response and review date make it a working tool. Client signatures are for sign-offs, not RAID rows.",
        },
        {
          id: "pmp-a03-plan-risks-environments-q5",
          prompt: "The client is three weeks late with menu content, and your status report shows the project as Amber because \"development is behind\". What is wrong?",
          options: [
            "The plan did not track the client dependency, so the delay is reported as the agency's",
            "Nothing; development is behind",
            "The report should be Green",
            "The RAID log should be deleted",
          ],
          correctIndex: 0,
          explanation: "When client dependencies are in the plan and the report, the cause of a slip is visible and can be discussed fairly, including its impact on the milestones.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a03-plan-risks-environments-q6",
          prompt: "What does the Twelve-Factor dev/prod parity principle advise?",
          options: [
            "Keep the time, personnel and tools gaps between development and production small",
            "Use different databases in dev and production for safety",
            "Deploy to production once a year",
            "Let developers own production",
          ],
          correctIndex: 0,
          explanation: "The closer staging is to production, the fewer surprises at release.",
        },
        {
          id: "pmp-a03-plan-risks-environments-q7",
          prompt: "\"We assume the client's menu has under 300 items.\" Discovery shows 1,200 items with complex modifiers. What happens next?",
          options: [
            "The assumption failed: log it as an issue, assess the impact and raise a change request if the scope grows",
            "Quietly build it; menus are small work",
            "Delete the assumption from the log",
            "Ask the client to remove 900 items",
          ],
          correctIndex: 0,
          explanation: "A broken assumption is the most common legitimate source of a change request. That is why assumptions are logged with owners and dates.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a03-plan-risks-environments-q8",
          prompt: "Which are valid risk responses? (Select all that apply.)",
          options: ["Avoid", "Reduce", "Transfer", "Accept", "Ignore and hope"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Avoid, reduce, transfer and accept are the standard responses. Accepting is a decision with an owner; ignoring is not.",
        },
        {
          id: "pmp-a03-plan-risks-environments-q9",
          prompt: "Where should the top risks and client dependencies appear each week?",
          options: ["In the status report", "Only in the PM's notebook", "Only in the closure report", "In the SOW"],
          correctIndex: 0,
          explanation: "The weekly status report keeps the client sponsor aware of risks and what they owe, before they become issues.",
        },
        {
          id: "pmp-a03-plan-risks-environments-q10",
          prompt: "Week 1. The client asks Oyelabs to host production \"for now\" on the agency's account. What do you do?",
          options: [
            "Raise ownership with BD and the client now, agree in writing who owns production, and plan accordingly",
            "Agree; move it later if needed",
            "Refuse to deploy to production at all",
            "Host it on a developer's personal account",
          ],
          correctIndex: 0,
          explanation: "\"For now\" usually becomes permanent, and moving production later is costly and risky. Agree ownership early.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "First RAID log for a fixed-bid React Native and Laravel food-ordering app for a restaurant group in Dubai. Sort each item into the right type.",
        categories: [
          { id: "risk", label: "Risk" },
          { id: "assumption", label: "Assumption" },
          { id: "issue", label: "Issue" },
          { id: "dependency", label: "Dependency" },
        ],
        items: [
          { id: "r1", text: "The delivery-partner API is new to the team and may take longer to integrate than estimated.", explanation: "It might happen and would hurt: a risk. Response: a spike in Sprint 0." },
          { id: "r2", text: "The menu will have fewer than 300 items with simple modifiers.", explanation: "Believed true, not yet confirmed: an assumption to check in discovery." },
          { id: "r3", text: "The client must provide the payment gateway merchant account by week 6.", explanation: "Something you need from someone else: a dependency (a client dependency)." },
          { id: "r4", text: "The staging server allocated last week has the wrong PHP version and the build fails.", explanation: "It has already happened: an issue to fix now." },
          { id: "r5", text: "UAT falls during Ramadan, when the client's operations team has less time to test.", explanation: "It might reduce UAT capacity: a risk. Response: book slots early." },
          { id: "r6", text: "The client will use their existing Apple and Google developer accounts.", explanation: "Believed true, not yet checked: an assumption. Confirm the accounts exist and who owns them." },
          { id: "r7", text: "Menu photos and descriptions from the client's marketing agency are due by week 8.", explanation: "An input from a third party: a dependency." },
          { id: "r8", text: "The client's sponsor has not replied for ten days and the requirement sign-off date has passed.", explanation: "Already happening and blocking a gate: an issue to escalate." },
          { id: "r9", text: "A key backend developer may be pulled onto another project in month 3.", explanation: "Might happen and would hurt: a risk. Response: knowledge sharing and a named backup." },
          { id: "r10", text: "Arabic and English only; no other languages are needed at launch.", explanation: "Treated as true for the estimate: an assumption, best confirmed in writing at sign-off." },
          { id: "r11", text: "The SMS provider must approve the client's sender ID before OTP messages work in production.", explanation: "Needed from a third party: a dependency." },
          { id: "r12", text: "The Android build fails on the latest SDK and the team cannot ship a test build this week.", explanation: "Already happening: an issue." },
        ],
        answer: {
          r1: "risk",
          r2: "assumption",
          r3: "dependency",
          r4: "issue",
          r5: "risk",
          r6: "assumption",
          r7: "dependency",
          r8: "issue",
          r9: "risk",
          r10: "assumption",
          r11: "dependency",
          r12: "issue",
        },
      },
    },
  ],
} satisfies Module;
