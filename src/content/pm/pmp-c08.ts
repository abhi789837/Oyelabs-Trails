import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-c08",
  trackId: "pm",
  name: "Terminology: Drills",
  description:
    "Practice that closes the terminology course: classify twenty real-sounding client requests with the decision tool, correct a PM's email that misuses the words that cost money, and keep the whole handbook fresh with spaced-repetition flashcards.",
  topics: [
    {
      id: "pmp-c08-classification-drill",
      moduleId: "pmp-c08",
      trackId: "pm",
      title: "Classification drill: twenty client requests",
      summary:
        "This drill is the skill the whole terminology course builds towards: a client message arrives, and within minutes you decide whether it is a [[term:bug]], a bug under [[term:warranty]], a bug for [[term:support]], an [[term:enhancement]], a [[term:change-request]], a [[term:new-feature]] or a [[term:clarification]]. The label decides who pays, whether the plan moves, and which document comes next.\n\nWhy it matters at an agency: you will classify several requests a week on every live account, often in a hurry and often against a client who has already chosen a label (\"critical bug!\"). Getting it wrong in one direction gives away paid work; getting it wrong in the other makes the client feel cheated. Speed comes only from practice on many cases, which is what this drill gives you.\n\nHow to do it: never start from the client's words. Establish the facts first, from the signed scope, the [[term:acceptance-criteria]], the approved designs and the [[term:go-live]] date. Then walk the decision tool's questions in order: does it work as specified, is it in scope, is it live and inside the warranty window, does it change or improve agreed behaviour, or is it brand new? Every answer in the drill below is exactly what the tool returns for those facts.\n\nThe common mistake: answering the warranty question first. Being inside the warranty window only matters once you have shown the request is a real defect against the signed scope.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Microsoft Learn: Define, capture, triage and manage bugs (Azure Boards)", url: "https://learn.microsoft.com/en-us/azure/devops/boards/backlogs/manage-bugs?view=azure-devops", kind: "docs", verifiedAt: "2026-10-02T11:54:32Z" },
        { label: "Atlassian: ITIL 4 guiding principles and practices", url: "https://www.atlassian.com/itsm/itil", kind: "article", verifiedAt: "2026-10-02T11:53:31Z" },
        { label: "Atlassian: Problem management in ITIL", url: "https://www.atlassian.com/itsm/problem-management", kind: "article", verifiedAt: "2026-10-02T11:53:30Z" },
        { label: "Atlassian: Change management types (standard, normal, emergency)", url: "https://www.atlassian.com/itsm/change-management/types", kind: "article", verifiedAt: "2026-10-02T12:06:10Z" },
      ],
      video: {
        title: "IT Incident Management vs. Problem Management - ITIL4",
        channel: "ACI Learning",
        url: "https://www.youtube.com/watch?v=BYvHOqZjne0",
        videoId: "BYvHOqZjne0",
        verifiedAt: "2026-10-02T12:17:35Z",
      },
      alternateVideos: [
        {
          title: "Difference between Incident,Problem and Change Management",
          channel: "Rajbir Singh",
          url: "https://www.youtube.com/watch?v=WPYXTpzqUbE",
          videoId: "WPYXTpzqUbE",
          verifiedAt: "2026-10-02T12:17:36Z",
        },
        {
          title: "What is the difference between a change, an incident and a problem with TOPdesk",
          channel: "TOPdesk North America",
          url: "https://www.youtube.com/watch?v=eE-9ZrcLzi8",
          videoId: "eE-9ZrcLzi8",
          verifiedAt: "2026-10-02T12:17:36Z",
        },
      ],
      interactive: {
        kind: "decision-tool",
        request: "Our app went live ten weeks ago and the warranty window in the SOW has ended. We have no AMC. The monthly sales report email, which was in the signed scope and worked until last week, has stopped arriving.",
      },
      handbook: {
        stages: ["custom-scope-control", "custom-support"],
        rules: [
          "billing-bug-in-delivery",
          "billing-bug-warranty",
          "billing-bug-after-warranty",
          "billing-enhancement",
          "billing-change-request",
          "billing-new-feature",
          "billing-clarification",
          "warranty-coverage",
        ],
        templates: ["cr-form", "hypercare-log"],
      },
      sections: [
        {
          heading: "The five questions, in the order the tool asks them",
          body:
            "1. **Does it work as specified and accepted?** Compare with the signed scope, the [[term:acceptance-criteria]] and the approved designs, not with what the client hoped for.\n2. **If not: is it in the signed scope?** If yes, it is a bug. If it was never specified, it is *not* a bug, however broken it feels to the client. Go to question 4.\n3. **If it is a bug: is it live, and inside the warranty window?** Not live yet: a delivery bug. Live and inside the window: a warranty bug. Live and past the window: support work.\n4. **Does it change agreed behaviour, or improve something that works?** Change: a [[term:change-request]]. Improve: an [[term:enhancement]]. Neither: go to question 5.\n5. **Is it brand-new functionality?** Yes: a [[term:new-feature]]. No, it is a question or a misunderstanding: a [[term:clarification]].\n\nThe tool stops as soon as the outcome is decided. That is why the warranty question is never asked about a change request: dates do not turn a change into a defect.",
        },
        {
          heading: "The facts you need before you answer",
          body:
            "Each question needs one piece of evidence. Collect them before you reply to the client:\n\n- **Works as specified?** The acceptance criterion, PRD section or approved screen that describes the behaviour, and what actually happens (steps to reproduce).\n- **In scope?** The SOW or signed requirement line. If you cannot find one, it was not specified.\n- **Live and in warranty?** The go-live date and the warranty window as the SOW defines it, including whether it runs from go-live or from acceptance, and whether the report date or the fix date counts.\n- **Change or improve?** The decision that was agreed (a rule, a flow, a design) and whether the request reverses it or builds on it.\n\nIf a fact is missing, ask for it before classifying. \"I'm checking this against the signed scope and will come back today\" is a complete first reply.",
        },
        {
          heading: "Incident, problem and change: how the ITIL words map",
          body:
            "The videos on this page use ITIL service-management words. Clients with an IT department use them too, so map them carefully:\n\n- **Incident** (ITIL): an unplanned interruption to a live service. The first job is to restore service, often with a [[term:hotfix]]. Whether Oyelabs fixes it free is decided separately, by the classification: a defect in signed scope inside the window is a warranty bug; after the window, support.\n- **Problem** (ITIL): the underlying cause of one or more incidents, found through an [[term:rca|RCA]]. The fix for a problem is classified the same way.\n- **Change** (ITIL): any controlled change to a live system, including our own hotfix. It is *not* the same as a client [[term:change-request]], which changes the agreed scope and is priced and approved first.\n\nThe trap: a client's IT lead writes \"please log this as a change\" about a broken screen. In their language that is a technical change to production. In yours, it is still a bug if the screen fails its acceptance criteria.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label grocery app for a supermarket group in Oman, live for three weeks, inside the warranty window in its SOW.** One morning, three messages arrive.\n\n1. \"Promo codes don't work at checkout!\" Promo codes are in the signed scope and passed UAT. Works as specified? No. In scope? Yes. Live and in warranty? Yes. **Bug under warranty.** Logged in the [[term:hypercare]] log with [[term:severity]] and fixed under the warranty terms.\n2. \"Delivery fees should depend on distance, not be flat.\" The SOW says one flat fee per store, and it works. Works as specified? Yes. Change or improve? It reverses an agreed rule. **Change request**, on the CR form, with effort, cost and date impact, approved before work starts.\n3. \"Why can't a driver accept two orders at once? It's a bug.\" One active order per driver was agreed in discovery and works. Works? Yes. Change or improve? Neither. Brand new? No, a misunderstanding. **Clarification**, answered with the discovery note.\n\nThe PM replies once, item by item, naming the evidence for each label. The warranty question was asked only for item 1.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Taking the client's label.** \"Critical bug\" is how the client feels, not a classification. Recover: reply with the evidence and the label it leads to.\n- **Asking the warranty question first.** It makes every request in the window sound free. Recover: prove the defect first, then check the dates.\n- **Calling an unspecified behaviour a bug to keep the peace.** It sets a precedent that \"not what I expected\" means free. Recover: if you fix it as goodwill, say so in writing, once.\n- **Classifying without the documents open.** Memory of scope is always generous to the client. Recover: open the SOW and acceptance criteria every time.\n- **Treating an ITIL \"change\" as a client CR.** Recover: ask what they mean, then classify on the facts.",
        },
        {
          heading: "Your checklist",
          body:
            "1. I have the signed scope, acceptance criteria, designs and go-live date open before I classify.\n2. I answer the tool's questions in order and stop when it decides.\n3. I only ask about warranty once the request is a real defect in signed scope.\n4. My reply names the evidence for each label, not just the label.\n5. Billing follows the handbook rule card for that outcome, not my own wording.\n6. Hard calls are checked with the tech lead and, for billing, with my manager before I reply.",
        },
      ],
      sop: [
        {
          title: "Who confirms a disputed classification",
          prompt: "[Oyelabs SOP – admin to fill] When a client disputes a classification (bug or change request, warranty or support), who at Oyelabs makes the final call, how quickly, and where the decision is recorded.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c08-classification-drill-q1",
          prompt: "What is the first question the decision tool asks about any client request?",
          options: [
            "Does it work as specified and accepted?",
            "Is it inside the warranty window?",
            "How urgent is it for the client?",
            "Is it brand-new functionality?",
          ],
          correctIndex: 0,
          explanation: "Everything starts from the agreement: does the product do what was specified and accepted? Dates and urgency come later, or not at all.",
        },
        {
          id: "pmp-c08-classification-drill-q2",
          prompt: "Three weeks after go-live, inside the warranty window, the client writes: \"It's broken, the app doesn't support group bookings!\" Group bookings were never specified and nothing like them exists. What is it?",
          options: ["A new feature", "A bug under warranty", "A change request", "A clarification"],
          correctIndex: 0,
          explanation: "It does not work as the client expects, but it was never in scope, so it is not a bug and the warranty question is never asked. It neither changes nor improves agreed behaviour; it is brand new.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c08-classification-drill-q3",
          prompt: "When does the decision tool ask whether the product is live and inside the warranty window?",
          options: [
            "Only when the request does not work as specified and the behaviour is in the signed scope",
            "For every request, first",
            "Only for change requests",
            "Only when the client mentions the warranty",
          ],
          correctIndex: 0,
          explanation: "The warranty window only matters for a real defect against the signed scope. A change, an enhancement or a new feature is not free because of the date.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c08-classification-drill-q4",
          prompt: "Which facts do you need before you can classify a request? (Select all that apply.)",
          options: [
            "What the signed scope and acceptance criteria say about the behaviour",
            "Whether the product is live, and the warranty window from the SOW",
            "Whether the request reverses an agreed decision or builds on it",
            "How strongly the client feels about it",
            "What label the client used in the subject line",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Scope, dates and the agreed decisions decide the classification. The client's feelings and label affect priority and tone, not the outcome.",
        },
        {
          id: "pmp-c08-classification-drill-q5",
          prompt: "The same defect (an agreed CSV export drops its last row) is found at three different moments: during UAT, three weeks after go-live inside the window, and nine months after go-live with the window ended. What are the three classifications?",
          options: [
            "Bug (found during delivery); bug under warranty; bug after the warranty (support)",
            "Bug under warranty in all three cases",
            "Bug; change request; new feature",
            "Bug (found during delivery) in all three cases",
          ],
          correctIndex: 0,
          explanation: "The defect is the same; the moment changes who pays. Not live: delivery bug. Live, in window: warranty. Live, past window: support, under a plan or quoted.",
        },
        {
          id: "pmp-c08-classification-drill-q6",
          prompt: "A client reports as a \"bug\" that unpaid bookings auto-cancel after 30 minutes and asks for 2 hours. The 30-minute rule is in the signed PRD and works. What is it?",
          options: ["A change request", "A bug under warranty", "An enhancement", "A clarification"],
          correctIndex: 0,
          explanation: "It works as specified, and the request reverses an agreed rule. The client's word \"bug\" does not change the facts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c08-classification-drill-q7",
          prompt: "The admin dashboard loads in 3 seconds. The agreed target is 4 seconds. The client asks for it to load faster. What is it?",
          options: ["An enhancement", "A bug", "A change request", "A new feature"],
          correctIndex: 0,
          explanation: "It meets the agreed target, so it works as specified. Making it faster improves working behaviour without reversing a decision.",
        },
        {
          id: "pmp-c08-classification-drill-q8",
          prompt: "A client's IT lead uses ITIL words. Which statements are true for an agency PM? (Select all that apply.)",
          options: [
            "An ITIL incident is about restoring a live service; who pays for the fix is decided by the classification",
            "An ITIL \"change\" is any controlled change to a live system, including our own hotfix, so it is not the same as a client change request",
            "An ITIL problem is the underlying cause of one or more incidents, usually found through a root cause analysis",
            "Every incident is a change request, because something must change to fix it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "ITIL words describe service management. The classification still runs on the facts: a broken in-scope screen is a bug whatever the ticket type is called.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c08-classification-drill-q9",
          prompt: "A store manager asks where to change the opening hours. The setting is already in the admin panel and in the handover notes. How is it typically billed?",
          options: [
            "Typically no charge: it is a clarification, so explain where it is and add it to the FAQ",
            "As an enhancement",
            "As a change request",
            "As support work, always billable",
          ],
          correctIndex: 0,
          explanation: "Nothing needs to change: it is a clarification. Follow the billing rule card for clarifications; the typical treatment is no charge.",
        },
        {
          id: "pmp-c08-classification-drill-q10",
          prompt: "A real defect in signed scope is reported after the warranty window. The client has no AMC or support plan. What is the next step?",
          options: [
            "Classify it as a bug after the warranty and quote it as billable support work, following the rule card",
            "Fix it free, because it is a bug",
            "Raise a change request",
            "Refuse it, because the warranty has ended",
          ],
          correctIndex: 0,
          explanation: "It is support work. With no plan to cover it, the typical treatment is to quote it as billable support. Refusing helps nobody; fixing it free sets a precedent.",
        },
        {
          id: "pmp-c08-classification-drill-q11",
          prompt: "The client disagrees with your classification of an item as a change request. What is the best response?",
          options: [
            "Walk through the evidence (the scope line, the acceptance criterion, what works today) and, if they still disagree, escalate the decision inside Oyelabs as the SOP says",
            "Re-label it as a bug to keep the client happy",
            "Stop all work until they agree",
            "Tell them the decision tool cannot be wrong",
          ],
          correctIndex: 0,
          explanation: "The evidence, not the tool, is the argument. Show it calmly, and use the agreed internal route for a final call on disputed items.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "classify-request",
        prompt:
          "Twenty requests from one busy week, across three Oyelabs projects. For each one, the PM has already checked the facts against the signed SOW, acceptance criteria, approved designs and go-live date; they are stated in the request. Use the decision tool's questions to classify each one.\n\n- **Clinic:** a Laravel and React booking platform for a UK clinic chain. Still in delivery: UAT is running, nothing is live.\n- **Grocery:** a white-label grocery app for a supermarket group in Oman. Live for three weeks, inside the warranty window in its SOW.\n- **Fitness:** a React Native and Laravel app for a fitness studio chain in Dubai. Live for fourteen months; the warranty window has ended and an AMC is active.",
        categories: [
          { id: "bug", label: "Bug (found during delivery)" },
          { id: "bug-warranty", label: "Bug under warranty" },
          { id: "bug-support", label: "Bug after the warranty (support)" },
          { id: "enhancement", label: "Enhancement" },
          { id: "change-request", label: "Change request" },
          { id: "new-feature", label: "New feature" },
          { id: "clarification", label: "Clarification (no change)" },
        ],
        items: [
          {
            id: "r1",
            text: "Grocery: \"Promo codes are rejected at checkout.\" Promo codes are in the signed scope and passed UAT. Reported yesterday.",
            explanation: "Works as specified? No. In scope? Yes. Live and inside the window? Yes. Bug under warranty.",
          },
          {
            id: "r2",
            text: "Clinic: \"Change booking slots from 15 to 20 minutes everywhere.\" 15-minute slots are in the signed PRD and work.",
            explanation: "Works as specified? Yes. It changes an agreed rule. Change request; being in delivery does not make it free.",
          },
          {
            id: "r3",
            text: "Grocery: \"Why can't a driver accept two orders at once? Looks like a bug.\" One active order per driver was agreed in discovery and works that way.",
            explanation: "Works as specified? Yes. Neither a change nor an improvement, and not new: a misunderstanding. Clarification.",
          },
          {
            id: "r4",
            text: "Clinic: UAT note: no confirmation email is sent after booking. Acceptance criterion 4.2 requires one.",
            explanation: "Works as specified? No. In scope? Yes. Live? Not yet. Bug found during delivery.",
          },
          {
            id: "r5",
            text: "Fitness: \"The last spot in a class can be booked twice.\" Class capacity limits are in the signed scope and worked at acceptance.",
            explanation: "Works as specified? No. In scope? Yes. Live and past the window. Bug after the warranty: handled under the active AMC.",
          },
          {
            id: "r6",
            text: "Fitness: \"It's broken: members can't book for a friend!\" Guest or group booking was never specified and nothing like it exists.",
            explanation: "Works as specified? Not as the client expects, but it was never in scope, so it is not a bug. Not a change or an improvement; brand new. New feature.",
          },
          {
            id: "r7",
            text: "Clinic: \"Could the receptionist's appointment list remember the last filter used?\" The list and its filters work as specified.",
            explanation: "Works as specified? Yes. It improves something that works. Enhancement.",
          },
          {
            id: "r8",
            text: "Grocery, marked \"CRITICAL BUG\": \"Prices must include VAT!\" The signed SOW says prices are shown excluding VAT, and the app does exactly that.",
            explanation: "Works as specified? Yes. The client wants an agreed rule reversed. Change request, whatever the subject line says, and the warranty is irrelevant.",
          },
          {
            id: "r9",
            text: "Grocery: \"Order SMS messages show UTC times.\" The acceptance criteria require local Gulf time in all customer messages.",
            explanation: "Works as specified? No. In scope? Yes. Live and inside the window? Yes. Bug under warranty.",
          },
          {
            id: "r10",
            text: "Grocery: \"We'd like a loyalty points programme.\" Nothing similar exists or was specified.",
            explanation: "Works as specified? Yes. Neither a change nor an improvement; brand new. New feature.",
          },
          {
            id: "r11",
            text: "Fitness: \"The monthly attendance report email stopped arriving last week.\" It is in the SOW and worked for a year.",
            explanation: "Works as specified? No. In scope? Yes. Live and past the window. Bug after the warranty (support), under the AMC.",
          },
          {
            id: "r12",
            text: "Grocery: \"Add sort by price to the product list.\" The list works as specified, sorted by name.",
            explanation: "Works as specified? Yes. It adds to working behaviour without reversing a decision. Enhancement.",
          },
          {
            id: "r13",
            text: "Clinic: the Arabic screens display left-to-right in the UAT build. Full right-to-left support is in the signed SOW.",
            explanation: "Works as specified? No. In scope? Yes. Live? Not yet. Bug found during delivery.",
          },
          {
            id: "r14",
            text: "Grocery: \"Delivery fees should depend on distance.\" The signed SOW specifies one flat fee per store, and it works.",
            explanation: "Works as specified? Yes. It reverses an agreed rule. Change request, raised on the CR form and approved before work.",
          },
          {
            id: "r15",
            text: "Fitness: \"Where do I change a studio's opening hours?\" The setting exists in the admin panel and is in the handover notes.",
            explanation: "Works as specified? Yes. Nothing to change and nothing new: a question. Clarification.",
          },
          {
            id: "r16",
            text: "Grocery: the order receipt screen still shows the core product's logo. Applying the client's brand kit to every screen is in the signed scope.",
            explanation: "Works as specified? No. In scope? Yes. Live and inside the window? Yes. Bug under warranty.",
          },
          {
            id: "r17",
            text: "Fitness: \"Make the admin dashboard faster.\" It loads in 3 seconds; the agreed target is 4 seconds.",
            explanation: "Meets the agreed target, so it works as specified. Making it faster is an improvement. Enhancement; whether the AMC's hours can be used depends on the plan.",
          },
          {
            id: "r18",
            text: "Clinic: \"Add video consultations.\" Nothing like it exists or is in the SOW.",
            explanation: "Works as specified? Yes. Brand-new functionality. New feature, estimated as new work.",
          },
          {
            id: "r19",
            text: "Fitness: \"Password reset links fail for every member.\" Password reset is in the signed scope and worked at acceptance.",
            explanation: "Works as specified? No. In scope? Yes. Live and past the window. Bug after the warranty (support), under the AMC.",
          },
          {
            id: "r20",
            text: "Fitness, reported as a bug: \"Unpaid bookings cancel after 30 minutes; make it 2 hours.\" The 30-minute rule is in the signed PRD and works.",
            explanation: "Works as specified? Yes. It changes an agreed rule. Change request; an AMC typically covers support and maintenance, not changes.",
          },
        ],
        answer: {
          r1: "bug-warranty",
          r2: "change-request",
          r3: "clarification",
          r4: "bug",
          r5: "bug-support",
          r6: "new-feature",
          r7: "enhancement",
          r8: "change-request",
          r9: "bug-warranty",
          r10: "new-feature",
          r11: "bug-support",
          r12: "enhancement",
          r13: "bug",
          r14: "change-request",
          r15: "clarification",
          r16: "bug-warranty",
          r17: "enhancement",
          r18: "new-feature",
          r19: "bug-support",
          r20: "change-request",
        },
      },
    },
    {
      id: "pmp-c08-fix-the-wrong-term",
      moduleId: "pmp-c08",
      trackId: "pm",
      title: "Fix the wrong term",
      summary:
        "Most terminology mistakes are not made in a quiz. They are made in a client email, written fast at the end of a day, where one wrong word becomes a promise. \"Your warranty covers small features\", \"once you approve the estimate the price is fixed\", \"we're live now that it's deployed\": each sentence is easy to write and expensive to take back.\n\nWhy it matters at an agency: the client keeps your emails. Months later, in a dispute about an invoice or a free fix, your own words are quoted back. A PM who writes [[term:estimate]] when they mean [[term:quote]], or calls the [[term:amc|AMC]] an extended [[term:warranty]], has made a commercial commitment without meaning to.\n\nHow to do it: before you send anything that mentions money, dates, defects or after-launch cover, proofread it once only for the risky pairs: warranty vs AMC vs [[term:support]] vs [[term:maintenance]]; [[term:bug]] vs [[term:change-request]] vs [[term:enhancement]] vs [[term:new-feature]]; [[term:deployment]] vs [[term:release]] vs [[term:go-live]]; [[term:severity]] vs [[term:priority]]; estimate vs quote; [[term:hotfix]] vs [[term:patch]]. For each one, ask: is this the word the contract uses, and does it promise only what the contract promises?\n\nThe common mistake: correcting a wrong term silently in the next email. The client never notices the change, and the first email still stands. Correct it explicitly, once, in writing.\n\nNot legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PMI: Lexicon of Project Management Terms", url: "https://www.pmi.org/standards/lexicon", kind: "spec", verifiedAt: "2026-10-02T11:55:40Z" },
        { label: "ISTQB Glossary (search: severity, priority, defect, regression testing)", url: "https://glossary.istqb.org/en_US/home", kind: "spec", verifiedAt: "2026-10-02T11:55:41Z" },
        { label: "ISO/IEC/IEEE 24765 - Systems and software engineering vocabulary (standard page)", url: "https://www.iso.org/standard/71952.html", kind: "spec", verifiedAt: "2026-10-02T12:10:13Z" },
        { label: "Scrum Guides: The Scrum Guide (2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: "2026-10-02T11:51:24Z" },
      ],
      video: {
        title: "Top 12 Project Management Jargon Terms Project Managers Use",
        channel: "Online PM Courses - Mike Clayton",
        url: "https://www.youtube.com/watch?v=F25BGXAlaG0",
        videoId: "F25BGXAlaG0",
        verifiedAt: "2026-10-02T12:17:36Z",
      },
      alternateVideos: [
        {
          title: "50 Project Management Industry Terms You NEED to Know in 2024",
          channel: "Max Mao",
          url: "https://www.youtube.com/watch?v=OYVE_4T4q_I",
          videoId: "OYVE_4T4q_I",
          verifiedAt: "2026-10-02T12:17:36Z",
        },
      ],
      handbook: {
        stages: ["custom-release", "custom-hypercare"],
        rules: ["warranty-coverage", "billing-change-request", "billing-new-feature", "hotfix-approval"],
        templates: ["cr-form"],
      },
      sections: [
        {
          heading: "The six pairs that cost the most",
          body:
            "- **[[term:estimate|Estimate]] vs [[term:quote]].** An estimate is a forecast, often a range, that can change as requirements become clearer. A quote is a firm price for a defined scope. Wrong word: the client reads a forecast as a fixed price.\n- **[[term:warranty|Warranty]] vs [[term:amc|AMC]] vs [[term:support]] vs [[term:maintenance]].** Warranty fixes defects against the signed scope, for a limited window. An AMC is a paid plan, usually after warranty. Support is reactive help on tickets; maintenance is planned upkeep. Wrong word: free work nobody priced.\n- **[[term:bug|Bug]] vs [[term:change-request|change request]] vs [[term:enhancement]] vs [[term:new-feature|new feature]].** The label decides who pays. Wrong word: either unpaid work or a client who feels cheated.\n- **[[term:deployment|Deployment]] vs [[term:release]] vs [[term:go-live]].** Deployment is the technical install; a release is the approved, versioned package; go-live is the business moment users rely on it. Wrong word: the warranty clock seems to start early.\n- **[[term:severity|Severity]] vs [[term:priority]].** Severity is impact; priority is when it gets fixed. Wrong word: a crash looks harmless because the client can wait.\n- **[[term:hotfix|Hotfix]] vs [[term:patch]].** A hotfix is an urgent production fix outside the normal cycle; a patch is a planned small update. Wrong word: an outage waits for the next scheduled release.",
        },
        {
          heading: "How to proofread an email for terms",
          body:
            "1. **Find the risky words.** Scan only for the words above, plus any date, price or \"free\".\n2. **Check each against its source.** Warranty wording against the SOW; classifications against the decision tool; dates against the plan; prices against a signed quote or CR.\n3. **Replace vague promises with the contract's words.** \"Free support for three months\" becomes \"defects against the signed scope are fixed at no cost during the warranty window in the SOW\".\n4. **Read the sentence as the client's finance team would.** If it could be quoted in a dispute against Oyelabs, rewrite it.\n5. **Check the billing wording against the handbook rule cards.** Never invent a price, a percentage or a window length in an email.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A Laravel and React booking platform for a UK clinic chain, a week before go-live.** The PM's draft says:\n\n> \"Release 1.4 is deployed, so you're live and your warranty has started. The reminder timing change is a bug, so we'll fix it free. Our estimate for reporting is 18–24 days; once you approve it, the price is fixed.\"\n\nThe corrected version:\n\n> \"Release 1.4 is deployed to staging. Go-live is planned for after the go/no-go call; the warranty window in the SOW starts from the point the SOW defines. Reminders currently go out 24 hours before, as in the signed scope, so moving them to 48 hours is a change request: I'll send the CR form with the effort and cost today. Our estimate for reporting is 18–24 days. Once the export formats are agreed, I'll send a quote with a firm price.\"\n\nEach correction swaps a casual word for the one the contract uses, and none of them makes the email colder.",
        },
        {
          heading: "How to correct a term you have already sent",
          body:
            "If the wrong word has already gone out, correct it explicitly, once, in writing, before the client acts on it:\n\n> \"A correction to my email of Tuesday: I wrote that the AMC is an extended warranty. That was imprecise. The AMC is a maintenance and support plan with the scope and cap in the agreement; it does not include new features. Sorry for the confusion.\"\n\n- Keep it short, factual and owned (\"I wrote\", not \"there was a misunderstanding\").\n- Quote the right term and point to where it is defined.\n- If the wrong word created a commercial promise, check with your manager before sending the correction.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **\"Free\" in a sentence about warranty.** It invites every wish to be treated as free. Recover: name what the warranty covers, in the contract's words.\n- **Using severity to express the client's patience.** \"Low severity, they can wait\" mixes impact with scheduling. Recover: set severity from impact, then agree priority separately.\n- **\"We're live\" after a deployment.** Recover: say which environment it was deployed to, and when go-live is.\n- **Fixing the word quietly in the next email.** The first email still stands. Recover: send an explicit correction.\n- **Copying the client's words back.** If the client says \"bug\", replying \"we'll fix the bug\" agrees with their classification. Recover: use your classification, with the evidence.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Before sending, I scan for the six risky pairs, prices, dates and \"free\".\n2. Warranty, AMC and support wording matches the SOW.\n3. Every classification matches the decision tool's outcome.\n4. Estimates are called estimates; only signed, firm prices are quotes.\n5. Severity states impact; priority states timing.\n6. Wrong terms already sent are corrected explicitly, once, in writing.",
        },
      ],
      sop: [
        {
          title: "Oyelabs standard wording for after-launch cover",
          prompt: "[Oyelabs SOP – admin to fill] The approved sentences PMs use in client emails to describe the warranty, the AMC or support plan, and the difference between an estimate and a quote, and who reviews emails that make commercial statements.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c08-fix-the-wrong-term-q1",
          prompt: "A PM writes: \"Our estimate is 18–24 days; once you approve it, the price is fixed.\" What is wrong?",
          options: [
            "An estimate is a forecast that can change; a firm price for a defined scope is a quote",
            "Nothing; an approved estimate is always a fixed price",
            "Estimates should never be given as a range",
            "It should say \"invoice\" instead of \"estimate\"",
          ],
          correctIndex: 0,
          explanation: "An estimate carries uncertainty and is often a range. Calling it fixed makes a commitment the estimate cannot support. Send a quote when the price is firm.",
        },
        {
          id: "pmp-c08-fix-the-wrong-term-q2",
          prompt: "A typo on the launch-campaign banner is harmless to the system but must be fixed before tomorrow's launch. How should it be described?",
          options: [
            "Low severity, high priority",
            "High severity, high priority",
            "Low severity, low priority",
            "Severity and priority mean the same, so either label works",
          ],
          correctIndex: 0,
          explanation: "Severity is impact (a typo is cosmetic). Priority is when it is fixed (before the launch). They can differ, and here they do.",
        },
        {
          id: "pmp-c08-fix-the-wrong-term-q3",
          prompt: "The team deployed the release to production on Thursday night, but users are only switched over on Monday after the go/no-go call. When did the product go live?",
          options: [
            "On Monday, when real users started relying on it",
            "On Thursday, when it was deployed",
            "When the release notes were written",
            "When UAT started",
          ],
          correctIndex: 0,
          explanation: "Deployment is the technical install and can happen before go-live. Go-live is the business moment users rely on it, which often starts hypercare and the warranty.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c08-fix-the-wrong-term-q4",
          prompt: "Payments fail for every user on the live app. A PM writes: \"We'll ship a patch in next month's scheduled release.\" Which word should it be?",
          options: [
            "A hotfix: an urgent production fix outside the normal release cycle",
            "A patch is correct",
            "A change request",
            "An enhancement",
          ],
          correctIndex: 0,
          explanation: "A serious live outage needs a hotfix, approved as the hotfix rule says. A patch is a planned small update through the normal process.",
        },
        {
          id: "pmp-c08-fix-the-wrong-term-q5",
          prompt: "Which sentences use the after-launch terms correctly? (Select all that apply.)",
          options: [
            "\"During the warranty window, defects against the signed scope are fixed at no cost.\"",
            "\"The AMC covers planned maintenance, such as framework upgrades, within its agreed cap.\"",
            "\"During warranty we'll also add small features for free.\"",
            "\"The AMC is simply an extended warranty.\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Warranty covers defects, not features. An AMC is a paid plan for support and maintenance; calling it an extended warranty makes the client expect free new work.",
        },
        {
          id: "pmp-c08-fix-the-wrong-term-q6",
          prompt: "During UAT, the client's lead writes: \"Please raise a CR for the broken login.\" Login is in the signed scope and fails its acceptance criteria. What do you do?",
          options: [
            "Correct the term kindly: it is a bug found during delivery, fixed as part of the agreed scope, not a CR",
            "Raise the CR, because the client asked for one",
            "Raise the CR and bill it",
            "Ignore the word and say nothing",
          ],
          correctIndex: 0,
          explanation: "Wrong terms cut both ways. Billing a delivery bug as a CR would overcharge the client and damage trust. Use the right term even when the wrong one would favour Oyelabs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c08-fix-the-wrong-term-q7",
          prompt: "A PM's go-live email says: \"You have free support for the next few months.\" What is the best rewrite?",
          options: [
            "\"Defects against the signed scope are fixed at no cost during the warranty window set out in the SOW.\"",
            "\"You have free maintenance for the next few months.\"",
            "\"You have an AMC for the next few months.\"",
            "\"You have unlimited support until you sign the AMC.\"",
          ],
          correctIndex: 0,
          explanation: "\"Free support\" covers everything a client might ask. The rewrite names the real cover and points to the contract for the window.",
        },
        {
          id: "pmp-c08-fix-the-wrong-term-q8",
          prompt: "Last week you emailed that the AMC \"includes new features\". It does not. What is the best recovery?",
          options: [
            "Send a short, explicit correction in writing now, quoting what the AMC covers, after checking with your manager",
            "Use the right term in future emails and hope the client did not notice",
            "Build the new features to honour the email",
            "Wait until the client asks for a feature, then explain",
          ],
          correctIndex: 0,
          explanation: "The first email still stands until it is corrected. A prompt, owned correction is cheaper than a dispute later.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c08-fix-the-wrong-term-q9",
          prompt: "Which statements are correct? (Select all that apply.)",
          options: [
            "A regression is a bug where something that used to work stops working after a change",
            "Support is reactive and ticket-driven; maintenance is often planned upkeep",
            "Hypercare is a short period of heightened attention after go-live, not the same as the warranty",
            "A release and a deployment are the same thing",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "A release is the approved, versioned package; a deployment is the act of installing a build on an environment.",
        },
        {
          id: "pmp-c08-fix-the-wrong-term-q10",
          prompt: "The client asks for a family-booking flow that has never existed. A PM calls it \"a small enhancement to booking, covered in the current price\". What is wrong?",
          options: [
            "It is a new feature, typically estimated as new work; and even enhancements are typically billable",
            "Nothing; anything related to booking is an enhancement",
            "It should be called a bug",
            "It should be called a clarification",
          ],
          correctIndex: 0,
          explanation: "Something that never existed is a new feature. Calling it an enhancement undersells the effort, and \"covered in the price\" gives it away.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Fix the wrong term. A PM drafted this email to the operations lead of a UK clinic chain, a week before go-live of their Laravel and React booking platform. The signed scope says appointment reminders go out 24 hours before, and they do. Mark every line that misuses a term (warranty, AMC, CR, enhancement, bug, release, go-live, severity, priority, estimate, quote, hotfix, patch) and say what it should be.",
        segments: [
          { id: "s1", text: "Subject: Release plan, open items and what happens after launch", issue: null },
          { id: "s2", text: "Hello, thank you for a productive UAT week.", issue: null },
          { id: "s3", text: "Release 1.4 was deployed to the staging environment on Monday, and your team signed off UAT on Thursday.", issue: null },
          {
            id: "s4",
            text: "Because release 1.4 is deployed, your platform is now officially live and the warranty has started.",
            issue: "Deployment to staging is not go-live. Go-live is when real users rely on production, after the go/no-go call; the warranty starts from the point the SOW defines.",
          },
          { id: "s5", text: "Go-live is planned for the day after the go/no-go call next week.", issue: null },
          { id: "s6", text: "The typo on the campaign banner is low severity, but we have made it high priority because it is on the launch page.", issue: null },
          {
            id: "s7",
            text: "We have set the Android booking crash to low severity, because your team said it can wait until after launch.",
            issue: "Severity is impact: a crash that stops booking is high severity. \"It can wait\" is a priority decision, agreed separately.",
          },
          {
            id: "s8",
            text: "Sending reminders 48 hours before instead of 24 is a bug, so we will fix it free in the next sprint.",
            issue: "The signed scope says 24 hours and it works, so this is a change request: estimated, priced and approved before work.",
          },
          { id: "s9", text: "Adding sort by date to the existing appointments list is an enhancement; we will estimate it for the backlog.", issue: null },
          {
            id: "s10",
            text: "The family-booking flow you mentioned is an enhancement to booking, so it is covered in the current price.",
            issue: "Family booking never existed: it is a new feature, typically estimated as new work. Even enhancements are typically billable.",
          },
          { id: "s11", text: "Attached is our estimate for the reporting module: 18–24 days, depending on the export formats you choose.", issue: null },
          {
            id: "s12",
            text: "Once you approve this estimate, the price is fixed and cannot change.",
            issue: "An estimate is a forecast that can change. A firm price for a defined scope is a quote, sent once the formats are agreed.",
          },
          { id: "s13", text: "After go-live, the warranty window in the SOW covers defects against the signed scope at no cost.", issue: null },
          {
            id: "s14",
            text: "During the warranty we will also add any small features your team needs, free of charge.",
            issue: "Warranty covers defects against the signed scope only. Features, even small ones, are new work through a CR.",
          },
          { id: "s15", text: "For the first weeks after go-live we will run hypercare: the team watches closely and responds faster.", issue: null },
          {
            id: "s16",
            text: "When the warranty ends, the AMC is simply an extended warranty, so the same free fixes continue.",
            issue: "An AMC is a paid support and maintenance plan with its own scope and cap, not an extended warranty.",
          },
          { id: "s17", text: "The AMC also covers planned maintenance, such as framework upgrades and security patches, within its agreed cap.", issue: null },
          {
            id: "s18",
            text: "If the live platform goes down, we will ship a patch in the next scheduled release.",
            issue: "An outage needs a hotfix: an urgent production fix outside the normal release cycle. A patch is a planned update.",
          },
          { id: "s19", text: "If something that worked stops working after an update, we will treat it as a regression and add a test for it.", issue: null },
          { id: "s20", text: "Please confirm the go-live date and the AMC start date by Friday.", issue: null },
          { id: "s21", text: "Best regards, your Oyelabs PM", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pmp-c08-flashcards",
      moduleId: "pmp-c08",
      trackId: "pm",
      title: "Terminology flashcards",
      summary:
        "The handbook holds every term this course has taught: commercial, scope, delivery, quality, governance and white-label. Reading it once does not make the words stick. Flashcards with spaced repetition do: you see a term, recall its meaning before you flip, grade yourself honestly, and the cards you struggle with come back sooner.\n\nWhy it matters at an agency: in a client call there is no time to look a word up. The PM who can say, without hesitating, why a request is a [[term:change-request]] and not a [[term:bug]], or why an [[term:amc|AMC]] is not a [[term:warranty]], sounds sure and is trusted. The one who hesitates invites the client to supply their own definition.\n\nHow to do it: the deck below draws from the whole handbook. Each sitting shows the cards due for review first, then a few new terms. Say the meaning, and an agency example, before you flip. Grade with Again, Good or Easy. A card you mark Again comes back once more at the end of the sitting. Short, regular sittings beat one long one.\n\nThe common mistake: marking a card Good because the word looked familiar. Recognising a word is not being able to explain it to a client. If you could not say it before flipping, press Again.",
      level: "beginner",
      estMinutes: 20,
      webRefs: [
        { label: "PMI: Lexicon of Project Management Terms", url: "https://www.pmi.org/standards/lexicon", kind: "spec", verifiedAt: "2026-10-02T11:55:40Z" },
        { label: "Scrum Guides: The Scrum Guide (2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: "2026-10-02T11:51:24Z" },
        { label: "Atlassian: ITIL 4 guiding principles and practices", url: "https://www.atlassian.com/itsm/itil", kind: "article", verifiedAt: "2026-10-02T11:53:31Z" },
        { label: "ISTQB Glossary (search: severity, priority, defect, regression testing)", url: "https://glossary.istqb.org/en_US/home", kind: "spec", verifiedAt: "2026-10-02T11:55:41Z" },
      ],
      video: {
        title: "10 Project Management Terms You Need to Know",
        channel: "Adriana Girdler",
        url: "https://www.youtube.com/watch?v=aTEK0BmsH-g",
        videoId: "aTEK0BmsH-g",
        verifiedAt: "2026-10-02T12:17:36Z",
      },
      alternateVideos: [
        {
          title: "Top 10 Project Management Terms & Concepts - ProjectManager",
          channel: "ProjectManager",
          url: "https://www.youtube.com/watch?v=7c8xP1gRIWs",
          videoId: "7c8xP1gRIWs",
          verifiedAt: "2026-10-02T12:17:36Z",
        },
        {
          title: "50 Project Management Terms You Need To Know",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=8SeDDbw6KKM",
          videoId: "8SeDDbw6KKM",
          verifiedAt: "2026-10-02T12:17:37Z",
        },
      ],
      interactive: { kind: "flashcards" },
      sections: [
        {
          heading: "How the deck works",
          body:
            "- **Front:** the term. **Back:** its definition and what it means at Oyelabs. Press Space to flip.\n- **Grade yourself:** 1 for Again (didn't know it), 2 for Good (knew it, with effort), 3 for Easy (knew it at once).\n- **Order:** cards due for review come first, then new terms. A sitting holds a limited number of cards, so it stays short.\n- **Again:** the card returns once more at the end of the sitting, and comes back sooner in later sittings.\n- **Good and Easy:** the card waits longer before it comes back. That is how spaced repetition saves time: you spend it on the words you do not know yet.\n- **One category at a time:** the glossary's flashcards page can filter the deck to commercial, scope, delivery, quality, governance or white-label terms.",
        },
        {
          heading: "How to study a card properly",
          body:
            "1. Read the term. Before flipping, **say the meaning out loud** in one sentence.\n2. Add **one agency example**: a request, an email line or a contract clause where the word matters.\n3. If the term is often confused with another, **name the difference** (\"an estimate can change; a quote is a firm price\").\n4. Flip and compare. Grade on what you said, not on what you recognise now.\n5. If a card keeps coming back, open its handbook entry and read the related terms. The confusion is usually with a neighbour.",
        },
        {
          heading: "What good looks like: one sitting",
          body:
            "A PM starts a sitting before the morning stand-up.\n\n- **[[term:quote|Quote]]:** \"A firm price for a defined scope, valid for a stated period. Not the same as an estimate, which can change.\" Flips: correct. **Good.**\n- **[[term:tat|TAT]]:** \"Turnaround time... for tickets?\" Unsure whether it means response or resolution. Flips: total elapsed time, and it should always be defined. **Again.**\n- **[[term:hypercare|Hypercare]]:** \"The first weeks after go-live with closer attention and faster response. It is not the warranty.\" **Easy.**\n- **[[term:client-dependency|Client dependency]]:** \"Something the client must provide, like store accounts or API keys, with a date.\" **Good.**\n\nAt the end of the sitting, TAT comes back once more. This time the PM gets it, and it returns in a later sitting to check it stuck.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Grading on recognition.** \"I've seen that word\" is not knowing it. Recover: say it before you flip; if you could not, press Again.\n- **Long, rare sittings.** One long session a month fades fast. Recover: short, regular sittings, typically a few minutes a day.\n- **Skipping the confused pairs.** Warranty and AMC, severity and priority, estimate and quote are where mistakes cost money. Recover: when one comes up, name its pair too.\n- **Only drilling one category.** Recover: alternate filtered sittings with the full deck.",
        },
        {
          heading: "Your checklist",
          body:
            "1. I run a short flashcard sitting regularly, not once in a while.\n2. I say the meaning and one agency example before flipping.\n3. I grade honestly: Again whenever I could not explain the term.\n4. I name the commonly confused partner for each term.\n5. I open the handbook entry for any card that keeps coming back.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c08-flashcards-q1",
          prompt: "In a flashcard sitting, which cards are shown first?",
          options: ["Cards due for review, then new terms", "New terms only", "Cards in alphabetical order", "Only the cards you marked Easy"],
          correctIndex: 0,
          explanation: "Due cards come first, so what you have learned is checked before it fades; then a few new terms are added.",
        },
        {
          id: "pmp-c08-flashcards-q2",
          prompt: "You see \"TAT\", recognise it, but could not have explained it before flipping. How should you grade it?",
          options: ["Again", "Good", "Easy", "Skip it"],
          correctIndex: 0,
          explanation: "Recognising is not recalling. If you could not explain it to a client, press Again so the card comes back sooner.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c08-flashcards-q3",
          prompt: "What happens to a card you mark Again?",
          options: [
            "It comes back once more at the end of the sitting, and sooner in later sittings",
            "It is removed from the deck",
            "It is marked as learned",
            "Nothing changes",
          ],
          correctIndex: 0,
          explanation: "Again puts the card back at the end of this sitting and shortens the wait before you see it in a later one.",
        },
        {
          id: "pmp-c08-flashcards-q4",
          prompt: "Which habits make flashcards work better for a PM? (Select all that apply.)",
          options: [
            "Saying the meaning out loud before flipping",
            "Adding one agency example for each term",
            "Naming the term it is commonly confused with",
            "Marking every familiar-looking card Easy to finish faster",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Active recall, examples and contrast with the confused partner build understanding. Grading generously only hides the gaps.",
        },
        {
          id: "pmp-c08-flashcards-q5",
          prompt: "You keep getting \"warranty\" and \"AMC\" mixed up. What is the best next step?",
          options: [
            "Open both handbook entries, name the difference in one sentence, and keep grading them honestly",
            "Mark both Easy so they stop appearing",
            "Use the two words interchangeably in client emails",
            "Remove them from your deck",
          ],
          correctIndex: 0,
          explanation: "Repeated misses usually mean confusion with a neighbour. Learn the difference (warranty fixes defects in a window; an AMC is a paid plan), then keep practising.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "Recall drill on the most confused pairs. Each line describes a term or uses it in an agency situation. Put each one under the term it describes, without looking at the handbook first.",
        categories: [
          { id: "estimate", label: "Estimate" },
          { id: "quote", label: "Quote" },
          { id: "deployment", label: "Deployment" },
          { id: "release", label: "Release" },
          { id: "go-live", label: "Go-live" },
          { id: "severity", label: "Severity" },
          { id: "priority", label: "Priority" },
        ],
        items: [
          { id: "f1", text: "A forecast of effort or cost, often a range, that can change as requirements become clearer.", explanation: "A forecast that can change: an estimate." },
          { id: "f2", text: "A firm price for a defined scope, valid for a stated period.", explanation: "A firm, time-limited price: a quote." },
          { id: "f3", text: "\"The reporting module will take 18–24 days, depending on the export formats.\"", explanation: "A range that depends on open decisions: an estimate." },
          { id: "f4", text: "\"The reporting module, as defined in the attached scope, is priced at the amount below; this offer is valid until the date stated.\"", explanation: "A fixed price for a defined scope, with a validity period: a quote." },
          { id: "f5", text: "The technical act of installing a build on an environment such as staging or production.", explanation: "Installing a build: a deployment." },
          { id: "f6", text: "\"Build 212 went to staging last night, so QA can start this morning.\"", explanation: "A build installed on an environment, with no users relying on it: a deployment." },
          { id: "f7", text: "An approved, versioned package of changes with its release notes.", explanation: "The approved, versioned 'what': a release." },
          { id: "f8", text: "\"Version 2.3.0 includes the new filters and three fixes; the notes are attached.\"", explanation: "A versioned package with notes: a release." },
          { id: "f9", text: "The business moment real users start relying on the system, often starting hypercare and the warranty.", explanation: "The business moment: go-live." },
          { id: "f10", text: "\"From Monday 9 am, all clinics take bookings only through the new platform.\"", explanation: "Real users switch over and rely on it: go-live." },
          { id: "f11", text: "How much damage a defect causes, from total outage down to cosmetic.", explanation: "Impact: severity." },
          { id: "f12", text: "\"Payments fail for every user, so this is a critical issue.\"", explanation: "A statement about impact: severity." },
          { id: "f13", text: "How soon an issue should be fixed relative to other work.", explanation: "Scheduling: priority." },
          { id: "f14", text: "\"The banner typo is cosmetic, but it must be fixed before tomorrow's campaign.\"", explanation: "The deadline drives when it is fixed: priority." },
        ],
        answer: {
          f1: "estimate",
          f2: "quote",
          f3: "estimate",
          f4: "quote",
          f5: "deployment",
          f6: "deployment",
          f7: "release",
          f8: "release",
          f9: "go-live",
          f10: "go-live",
          f11: "severity",
          f12: "severity",
          f13: "priority",
          f14: "priority",
        },
      },
    },
  ],
} satisfies Module;
