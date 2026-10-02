import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a01",
  trackId: "pm",
  name: "Custom lifecycle: BD handover to delivery",
  description:
    "How a custom project moves from the people who sold it to the people who build it: what a complete handover pack contains, how to read an MSA and SOW like a delivery PM, and how to find the risky assumptions before the team commits to a plan.",
  topics: [
    {
      id: "pmp-a01-handover-checklist",
      moduleId: "pmp-a01",
      trackId: "pm",
      title: "The BD-to-delivery handover checklist",
      summary:
        "The handover is the moment a sold deal becomes a delivery commitment. Everything the client heard in sales calls is now your problem, whether or not it reached the [[term:sow]].\n\nWhy it matters at an agency: BD and delivery see the same client from different sides. BD remembers the promises, the sensitivities and the price pressure. Delivery only sees the documents. If the handover is a forwarded PDF, the team plans against the paper while the client expects the conversation. That gap shows up later as \"but you said…\" during UAT.\n\nHow to do it:\n\n- Ask for a handover pack before the meeting: signed [[term:sow]] and [[term:msa]], the [[term:proposal]], the [[term:estimate]], call notes and the email thread.\n- Hold a real handover meeting with BD and the tech lead, and record it in a [[term:mom]].\n- Ask for the soft context: who decides on the client side, what went wrong with their last vendor, what was promised verbally.\n- Leave the meeting with a written list of open questions and log every unverified belief as an [[term:assumption]] in the [[term:raid-log]].\n\nThe common mistake is treating the handover as a formality and starting the plan the same day. A PM who has not read the SOW cannot defend its scope later.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "Birdview PSA: Sales-to-delivery handoff checklist for consulting firms", url: "https://birdviewpsa.com/blog/sales-to-delivery-handoff-checklist-consulting/", kind: "article", verifiedAt: "2026-10-02T12:01:28Z" },
        { label: "Copper: The sales-to-delivery handoff playbook", url: "https://www.copper.com/resources/sales-delivery-playbook", kind: "article", verifiedAt: "2026-10-02T12:01:26Z" },
        { label: "Atlassian Team Playbook: Project poster", url: "https://www.atlassian.com/team-playbook/plays/project-poster", kind: "docs", verifiedAt: "2026-10-02T11:53:26Z" },
      ],
      video: {
        title: "How to Improve Handoffs from Sales to Delivery - Ep #214",
        channel: "Parakeeto",
        url: "https://www.youtube.com/watch?v=PveVEElIFc0",
        videoId: "PveVEElIFc0",
        verifiedAt: "2026-10-02T12:16:55Z",
      },
      alternateVideos: [
        {
          title: "​​Master Your Sales To Production Hand Off: Less Finger Pointing, More Referrals - Paul Atherton",
          channel: "Breakthrough Academy",
          url: "https://www.youtube.com/watch?v=s4VM1DDSE9M",
          videoId: "s4VM1DDSE9M",
          verifiedAt: "2026-10-02T12:16:55Z",
        },
        {
          title: "The biz dev handoff - Agency Management Tip for Owners",
          channel: "Agency Management Institute",
          url: "https://www.youtube.com/watch?v=NrH0qSD31fU",
          videoId: "NrH0qSD31fU",
          verifiedAt: "2026-10-02T12:16:55Z",
        },
      ],
      handbook: { stages: ["custom-bd-handover"], rules: ["mom-after-every-client-meeting"], templates: ["mom", "raid-log-template"] },
      sections: [
        {
          heading: "What goes in the handover pack",
          body:
            "Split it into hard documents and soft context. You need both.\n\n**Hard documents**\n- The signed [[term:msa]] and [[term:sow]], or the signed letter of intent.\n- The [[term:proposal]] and the [[term:estimate]] behind the price, with the tech lead's assumptions.\n- The commercial model ([[term:fixed-bid]], [[term:time-and-materials]], [[term:retainer]] or [[term:dedicated-resource-model]]), the [[term:milestone]] list and the [[term:payment-terms]].\n- Whether the [[term:advance-payment]] is received or only invoiced.\n\n**Soft context**\n- Who the decision-maker is, and who will be the client [[term:spoc]].\n- What the client cares about most: a launch date, a demo for investors, a budget ceiling.\n- What went wrong with a previous vendor.\n- Anything promised on a call that is not in writing. Write it down now, and decide with BD whether it is in scope.",
        },
        {
          heading: "Running the handover meeting",
          body:
            "1. Read the pack before the meeting. Come with questions, not a blank page.\n2. Ask BD to tell the story of the deal in five minutes: why the client chose Oyelabs, and what nearly lost the deal.\n3. Walk the SOW deliverable by deliverable with the tech lead. For each one ask: \"Could two reasonable people read this differently?\"\n4. Go through every listed [[term:assumption]] and [[term:client-dependency]]. Ask who checked it, and when.\n5. Agree how BD introduces you to the client, and whether a short intro call happens before the formal kickoff.\n6. Send the [[term:mom]] the same day, with open questions, owners and dates.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Handover by email.** You get documents and lose context. Recover: book 45 minutes with BD even if the project has already started.\n- **Verbal promises nobody wrote down.** Recover: ask BD directly, \"What did you promise that is not in the SOW?\" Log each answer and agree in writing whether it is in scope, or a future [[term:change-request]].\n- **Starting the plan before reading the SOW.** Recover: pause the plan, read the scope and [[term:out-of-scope]] list, and redo any dates that depended on it.\n- **BD disappears after signature.** Recover: keep BD as Consulted on commercial questions in the [[term:raci]] for the first weeks.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. I have read the signed SOW, MSA, proposal and estimate.\n2. I know the commercial model, the milestones and whether the advance is paid.\n3. I know the client decision-maker and SPOC by name.\n4. Every verbal promise is written down and marked in scope or not.\n5. Open questions have an owner and a date.\n6. Risky assumptions are in the RAID log.\n7. The handover MoM is sent.",
        },
      ],
      sop: [
        {
          title: "Handover pack location and sign-off",
          prompt: "[Oyelabs SOP – admin to fill] Where BD stores the handover pack (folder or CRM link), which documents are mandatory, and who confirms the handover is complete before the internal kickoff.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a01-handover-checklist-q1",
          prompt: "Which of these belong in the handover pack? (Select all that apply.)",
          options: [
            "The signed SOW and MSA",
            "The estimate with the tech lead's assumptions",
            "Notes of promises made on sales calls",
            "The developers' personal leave calendar",
            "The proposal the client accepted",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation: "The pack holds the contract, the commercial basis and the sales context. Team leave belongs to resource planning, not the BD handover.",
        },
        {
          id: "pmp-a01-handover-checklist-q2",
          prompt: "During the handover, BD mentions they told the client \"admin reports will be easy to add later\". The SOW does not list reports. What do you do?",
          options: [
            "Write it down, agree with BD whether it is in scope, and plan to clarify it with the client in writing",
            "Ignore it, because only the SOW counts",
            "Add reports to the plan quietly so the client is happy",
            "Tell the client at kickoff that BD was wrong",
          ],
          correctIndex: 0,
          explanation: "A verbal promise is a future dispute. Capture it, decide internally, then set the expectation with the client in writing. Do not absorb it silently or blame BD in front of the client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a01-handover-checklist-q3",
          prompt: "Why ask BD what went wrong with the client's previous vendor?",
          options: [
            "It tells you the client's sensitivities, so you can avoid repeating the same failure",
            "So you can criticise the old vendor at kickoff",
            "To estimate the project faster",
            "It is not relevant to delivery",
          ],
          correctIndex: 0,
          explanation: "A client burned by missed deadlines will watch dates closely. One burned by poor communication will want frequent updates. That shapes your governance.",
        },
        {
          id: "pmp-a01-handover-checklist-q4",
          prompt: "The handover meeting is done. What should exist in writing afterwards?",
          options: [
            "A MoM with open questions, owners and dates",
            "Nothing; the meeting was enough",
            "Only a calendar invite for the client kickoff",
            "A revised price for the client",
          ],
          correctIndex: 0,
          explanation: "Follow the Oyelabs rule on MoMs in the handbook card. A written record is how open questions get closed.",
        },
        {
          id: "pmp-a01-handover-checklist-q5",
          prompt: "The SOW says the client \"will provide content\". In the RAID log, what is this?",
          options: ["A client dependency, with an assumption about timing to confirm", "A bug", "A change request", "A constraint on the tech stack"],
          correctIndex: 0,
          explanation: "The client must deliver something for you to progress, which is a dependency. When it arrives is usually an unverified assumption, so log both and get a date.",
        },
        {
          id: "pmp-a01-handover-checklist-q6",
          prompt: "You join the project two weeks after it started; there was no handover. What is the best recovery?",
          options: [
            "Book a handover meeting with BD now, read the SOW and log open questions, even though work has begun",
            "Skip it; it is too late",
            "Ask the client to explain the whole deal again at the next demo",
            "Rely on the developers' understanding",
          ],
          correctIndex: 0,
          explanation: "A late handover is far better than none. The client should not have to repeat the sale to fill your gaps.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a01-handover-checklist-q7",
          prompt: "Who should attend the handover meeting with the PM?",
          options: ["BD/account manager and the tech lead", "Only the client sponsor", "The whole development team and the client", "Only the finance team"],
          correctIndex: 0,
          explanation: "BD owns the deal context; the tech lead checks the estimate and technical assumptions. The client meets the team later at kickoff.",
        },
        {
          id: "pmp-a01-handover-checklist-q8",
          prompt: "The SOW is signed but the advance invoice has not been paid. The client wants the team to start Monday. What is the PM's correct first move?",
          options: [
            "Check the contract and the Oyelabs rule on starting work, and raise it with BD and management before committing a start date",
            "Start Monday; payment always follows",
            "Refuse to talk to the client until they pay",
            "Ask the developers to work on it in their spare time",
          ],
          correctIndex: 0,
          explanation: "Whether work starts before the advance is a commercial decision for BD and management, based on the contract. The PM flags it rather than deciding alone.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "write",
        variant: "email",
        prompt:
          "You have read the handover pack for a new project. Write a short internal email to the BD account manager listing your open questions before the client kickoff. Keep it specific and ask for answers by a date.",
        context:
          "Project: a Laravel and React booking platform for a UK physiotherapy clinic chain (6 clinics). Fixed bid, 3 milestones. The SOW lists: online booking, clinician calendars, Stripe payments, SMS reminders, an admin panel. Call notes from BD say: \"Client asked about NHS referrals - told them we can look at it.\" The SOW says \"integration with existing clinic system\" but does not name the system. The estimate assumes the client provides all copy and images in week 2. There is no named client SPOC in the documents.",
        wordLimit: 220,
        rubric: [
          { id: "gaps", label: "Finds the real gaps", description: "Asks about the unnamed clinic system, the NHS referral promise, the missing SPOC and the content assumption.", weight: 2 },
          { id: "specific", label: "Specific questions", description: "Each question is answerable with a fact, not 'any thoughts?'.", weight: 1.5 },
          { id: "scope", label: "Scope awareness", description: "Treats the NHS referral comment as a possible verbal promise to settle in or out of scope.", weight: 1.5 },
          { id: "ask", label: "Clear ask and date", description: "Ends with when the answers are needed and why (before kickoff).", weight: 1 },
        ],
        sampleAnswer:
          "Subject: Clinic booking platform - open questions before kickoff\n\nHi Priya,\n\nThanks for the pack. Before the client kickoff on Thursday I need answers on four points:\n\n1. The SOW says \"integration with existing clinic system\". Which system is it, does it have an API, and who on their side owns it?\n2. Your call notes say we told them we \"can look at\" NHS referrals. Did they hear that as a commitment? It is not in the SOW, so I plan to treat it as out of scope and a possible CR, unless you disagree.\n3. Who is the client SPOC, and who signs off milestones?\n4. The estimate assumes copy and images arrive in week 2. Did the client agree to that date?\n\nCould you reply by Wednesday noon? I will log these in the RAID log meanwhile.\n\nThanks,\nSam",
      },
    },
    {
      id: "pmp-a01-reading-sow",
      moduleId: "pmp-a01",
      trackId: "pm",
      title: "Reading a SOW and MSA like a PM",
      summary:
        "A lawyer reads a contract for liability. A PM reads it for delivery: what exactly must be built, how it will be accepted, when money moves, and what happens when the client asks for more.\n\nWhy it matters at an agency: on a [[term:fixed-bid]] project the [[term:sow]] is the only defence against [[term:scope-creep]]. Every vague verb (\"support\", \"integrate\", \"manage\") is a future argument. Every missing acceptance rule means UAT never ends.\n\nThe structure is usually two layers:\n\n- The [[term:msa]] holds the standing terms: [[term:ip-ownership]], liability, [[term:warranty]], confidentiality, [[term:payment-terms]], [[term:termination]] and governing law.\n- Each [[term:sow]] holds one engagement: scope, deliverables, [[term:milestone]]s, acceptance, fees and [[term:assumption]]s.\n\nWhen they conflict, an order-of-precedence clause decides, and that clause differs between contracts. Find it first.\n\nHow to read it: list every deliverable, mark each vague word, find the [[term:out-of-scope]] list, find how acceptance works and how long the client has to respond, and map each payment to a deliverable. Then take your questions to BD before kickoff, not to the client during UAT.\n\nThe common mistake is reading only the feature list and skipping the assumptions, acceptance and change sections, which are exactly the parts you will need when something goes wrong.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "GOV.UK: Model Services Contract (UK government template contract)", url: "https://www.gov.uk/government/collections/model-services-contract", kind: "spec", verifiedAt: "2026-10-02T11:51:28Z" },
        { label: "Ironclad: MSA vs SOW - which one to use when", url: "https://ironcladapp.com/journal/contracts/msa-vs-sow", kind: "article", verifiedAt: "2026-10-02T11:51:37Z" },
        { label: "ProjectManager: Statement of work (SOW) template", url: "https://www.projectmanager.com/templates/statement-of-work-template", kind: "article", verifiedAt: "2026-10-02T12:03:25Z" },
        { label: "Atlassian: What is project scope", url: "https://www.atlassian.com/work-management/project-management/project-scope", kind: "article", verifiedAt: "2026-10-02T11:53:57Z" },
      ],
      video: {
        title: "What is a Statement of Work (SOW)? And what are the different types?",
        channel: "Online PM Courses - Mike Clayton",
        url: "https://www.youtube.com/watch?v=1picY6dlLOc",
        videoId: "1picY6dlLOc",
        verifiedAt: "2026-10-02T12:16:55Z",
      },
      alternateVideos: [
        {
          title: "How to Write a Scope of Work Document - Project Management Training",
          channel: "ProjectManager",
          url: "https://www.youtube.com/watch?v=oacSSamqP6s",
          videoId: "oacSSamqP6s",
          verifiedAt: "2026-10-02T12:16:56Z",
        },
      ],
      handbook: { stages: ["custom-bd-handover"], rules: ["cr-when-needed", "requirement-freeze-after-signoff", "warranty-coverage"] },
      sections: [
        {
          heading: "The PM's reading order",
          body:
            "Read in this order, not front to back.\n\n1. **Order of precedence.** Which document wins if the MSA, SOW and proposal disagree?\n2. **Deliverables.** List each one as a line. Count platforms: \"mobile app\" may mean iOS and Android, or one of them.\n3. **[[term:out-of-scope]] and [[term:assumption]]s.** These protect you. If they are missing, that is the first risk.\n4. **Acceptance.** Who accepts, against what, and in how many days. Is there deemed acceptance if the client is silent?\n5. **[[term:milestone]]s and payments.** Map each payment to a deliverable and an acceptance event.\n6. **Change control.** How a [[term:change-request]] is raised, priced and approved.\n7. **[[term:warranty]] and [[term:support]].** How long, what is covered, and when it starts.\n8. **Ownership.** When [[term:ip-ownership]] passes, and what the [[term:source-code-handover]] includes.",
        },
        {
          heading: "Vague words and what to ask",
          body:
            "- **\"Integrate with\"**: which system, which version, which direction of data, and who provides API access?\n- **\"Support\"**: support a language, a device, or a user? For how long?\n- **\"Similar to\"** another app: similar in which screens? Comparisons to famous apps are the most expensive sentence in a SOW.\n- **\"Admin panel to manage…\"**: create, edit, delete, export, permissions? List the actions.\n- **\"Scalable\"**: to how many users, with what response time?\n- **\"Up to N rounds\"**: per screen or per project?\n\nWrite each answer as an [[term:assumption]] the client confirms during [[term:discovery]].",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A React Native and Laravel fleet-tracking app for a logistics firm in the UAE, fixed bid.**\n\nThe PM gets the SOW on Monday and reads it with the tech lead before Wednesday's internal kickoff.\n\n- **Precedence:** the MSA wins over the SOW, and the SOW over the proposal. The proposal promised \"offline mode\"; the SOW does not mention it. The PM flags it: the client may believe it is included.\n- **Deliverables:** \"Driver app (iOS and Android), dispatcher web panel, live map.\" Clear. But \"integration with client ERP\" names no ERP. Question for BD.\n- **Out of scope:** present, lists \"hardware, SMS costs, third-party licences\". Good.\n- **Acceptance:** client has 10 business days per milestone; silence counts as acceptance. The PM notes it, because it changes how UAT is planned.\n- **Payments:** 4 milestones; milestone 3 is paid on \"completion of development\", which has no acceptance test. The PM asks BD to confirm what evidence triggers it.\n- **Change control:** present, but no named approver on the client side. The PM will ask at kickoff.\n- **Warranty:** \"90 days\" (typical values vary), but it does not say whether it starts at UAT sign-off or at go-live. Question for BD.\n\nResult: one page of six questions sent to BD on Tuesday, two risks logged, and the offline-mode gap settled before the client ever raised it.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Reading only the feature list.** Recover: re-read assumptions, acceptance and change control, and log what is missing.\n- **Asking the client to explain the SOW.** It signals you do not know the deal. Recover: ask BD first; take only genuine requirement questions to the client.\n- **Using the proposal as the scope.** Proposals are sales documents. Recover: check precedence; plan from the SOW.\n- **Ignoring deemed acceptance and response windows.** Recover: put the acceptance timings into the plan and tell the client the dates in the kickoff MoM.\n- **Interpreting a clause yourself in a dispute.** Recover: involve BD and management; they bring in legal advice if needed.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. I know which document wins in a conflict.\n2. Every deliverable is a line in my plan.\n3. Every vague word has a question or an assumption.\n4. I know the acceptance process, the approver and the response window.\n5. Each payment maps to a deliverable and an acceptance event.\n6. I know when warranty starts and what it covers.\n7. My questions went to BD before kickoff.",
        },
      ],
      sop: [
        {
          title: "Contract questions route",
          prompt: "[Oyelabs SOP – admin to fill] Who a PM asks about contract interpretation (BD, management, legal), and where the signed MSA and SOW versions are stored.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a01-reading-sow-q1",
          prompt: "Which terms usually live in the MSA rather than the SOW? (Select all that apply.)",
          options: ["Liability and indemnity", "Confidentiality", "The list of screens for this project", "Governing law", "This project's milestone dates"],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "The MSA holds standing legal terms reused across engagements. Screens and milestone dates belong to the SOW for one engagement.",
        },
        {
          id: "pmp-a01-reading-sow-q2",
          prompt: "The proposal promised \"offline mode\". The signed SOW does not mention it. The client asks about it in sprint 3. What decides whether it is in scope?",
          options: [
            "The contract's order-of-precedence and entire-agreement clauses, read with BD",
            "Whatever the client remembers",
            "The proposal, because it came first",
            "The developers' opinion",
          ],
          correctIndex: 0,
          explanation: "Contracts usually say which document wins. Many make the signed SOW and MSA the entire agreement, but this varies, so check with BD rather than guessing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a01-reading-sow-q3",
          prompt: "Which SOW line is most likely to cause a scope dispute?",
          options: [
            "\"The app will work similar to Uber.\"",
            "\"Out of scope: hardware and SMS costs.\"",
            "\"Payment 2 is due on written UAT sign-off of milestone 2.\"",
            "\"Supported languages: English and Arabic.\"",
          ],
          correctIndex: 0,
          explanation: "\"Similar to\" a famous app has no boundary. The client imagines every feature of that app; the estimate covered a few.",
        },
        {
          id: "pmp-a01-reading-sow-q4",
          prompt: "The SOW says the client has 10 business days to accept a milestone, and silence counts as acceptance. How does that affect your plan?",
          options: [
            "Plan the acceptance window explicitly, tell the client the dates in writing, and track the deadline",
            "Ignore it; the client will always reply",
            "Treat silence as rejection",
            "Shorten it to 2 days without telling anyone",
          ],
          correctIndex: 0,
          explanation: "A deemed-acceptance clause only helps if both sides know the dates. Put the window in the plan and the MoM.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a01-reading-sow-q5",
          prompt: "A milestone is paid on \"completion of development\". Why is that a problem for a PM?",
          options: [
            "There is no clear acceptance event, so the payment trigger can be argued",
            "Development is never complete",
            "Payments should never be tied to milestones",
            "It is not a problem",
          ],
          correctIndex: 0,
          explanation: "A payment trigger should be an observable event, such as written UAT sign-off. A vague trigger delays cash and creates disputes.",
        },
        {
          id: "pmp-a01-reading-sow-q6",
          prompt: "The SOW says \"90-day warranty\" but not when it starts. Which questions should you raise? (Select all that apply.)",
          options: [
            "Does it start at UAT sign-off or at go-live?",
            "What counts as a covered defect versus a change?",
            "Does the warranty include new features?",
            "Can we skip warranty if the client pays late?",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Start date and coverage are the two questions that matter. Warranty does not cover new features by definition, and withholding it is a legal question, not a PM's call.",
        },
        {
          id: "pmp-a01-reading-sow-q7",
          prompt: "You find the SOW has no out-of-scope list. What is the best action?",
          options: [
            "Log it as a risk, and make the out-of-scope items explicit in writing at kickoff and in the requirement sign-off",
            "Assume everything not listed is out of scope and say nothing",
            "Ask the client to sign a new contract",
            "Add every possible feature to the plan",
          ],
          correctIndex: 0,
          explanation: "You cannot change the signed SOW alone, but you can make boundaries explicit in the kickoff MoM and the signed requirements.",
        },
        {
          id: "pmp-a01-reading-sow-q8",
          prompt: "During a call the client says, \"The contract clearly says you must support any device we use.\" You disagree. What do you do?",
          options: [
            "Say you will check the exact wording with your team and reply in writing; then involve BD",
            "Argue the clause on the call",
            "Agree to keep the client happy",
            "Quote the law to the client",
          ],
          correctIndex: 0,
          explanation: "Never interpret contested clauses live. Buy time, check with BD and management, and answer in writing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a01-reading-sow-q9",
          prompt: "Why read the change-control section before the project starts?",
          options: [
            "So you know how a CR is raised, priced and approved before the first request arrives",
            "Because changes are forbidden",
            "To estimate the first sprint",
            "It is only for lawyers",
          ],
          correctIndex: 0,
          explanation: "The first change request usually comes early. Knowing the process lets you answer calmly instead of improvising. See the CR rule in the handbook card.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "You are reading the contract pack for a custom Laravel project. For each clause, decide where it normally belongs: the MSA (standing terms), the SOW (this engagement), or neither (it should not be in a contract at all, or it is a sales claim to verify).",
        categories: [
          { id: "msa", label: "MSA (standing terms)" },
          { id: "sow", label: "SOW (this engagement)" },
          { id: "neither", label: "Neither: verify or remove" },
        ],
        items: [
          { id: "c1", text: "Each party's total liability is capped at the fees paid in the previous 12 months.", explanation: "A liability cap is a standing legal term that applies to every engagement: MSA." },
          { id: "c2", text: "Deliverable 3: dispatcher web panel with live map, order list and driver assignment.", explanation: "A specific deliverable for this project: SOW." },
          { id: "c3", text: "This agreement is governed by the laws of England and Wales.", explanation: "Governing law is a standing term: MSA." },
          { id: "c4", text: "Milestone 2 (design sign-off) is invoiced on written approval of the designs.", explanation: "Milestones and their triggers are engagement-specific: SOW." },
          { id: "c5", text: "Our team is the best in the industry and will exceed every expectation.", explanation: "A sales claim, not a contractual term. It creates expectations without defining anything." },
          { id: "c6", text: "Each party keeps the other's confidential information secret for 3 years after termination.", explanation: "Confidentiality is a standing term: MSA (sometimes a separate NDA)." },
          { id: "c7", text: "Assumption: the client provides API access to their ERP by week 3.", explanation: "An engagement-specific assumption: SOW." },
          { id: "c8", text: "Out of scope: SMS sending costs, hardware and app store fees.", explanation: "The out-of-scope list belongs to this engagement: SOW." },
          { id: "c9", text: "Invoices are payable within 30 days of issue.", explanation: "General payment terms usually sit in the MSA; an SOW may override them for one project if precedence allows." },
          { id: "c10", text: "The app will be similar to Careem in every way the client needs.", explanation: "Unbounded comparison. It should be replaced by a deliverable list, not signed." },
        ],
        answer: { c1: "msa", c2: "sow", c3: "msa", c4: "sow", c5: "neither", c6: "msa", c7: "sow", c8: "sow", c9: "msa", c10: "neither" },
      },
    },
    {
      id: "pmp-a01-risky-assumptions",
      moduleId: "pmp-a01",
      trackId: "pm",
      title: "Spotting risky assumptions before you commit",
      summary:
        "Every estimate and every SOW rests on [[term:assumption]]s: things believed true but not checked. Most are harmless. A few, if wrong, will break the price or the date.\n\nWhy it matters at an agency: on a [[term:fixed-bid]] the agency carries the cost of a wrong assumption. A sentence like \"the client's API is ready\" can hide four weeks of work. If it is written in the SOW, you can raise a [[term:change-request]] when it proves false. If it lives only in the estimator's head, you absorb it.\n\nHow to do it:\n\n- Read the [[term:sow]], [[term:proposal]] and [[term:estimate]] and list every belief the plan depends on, stated or not.\n- Rate each by impact if wrong and by how uncertain it is. The risky ones are high on both.\n- For each risky one, choose: verify it now, make it a written assumption the client confirms, or turn it into a [[term:client-dependency]] with a date.\n- Log them in the [[term:raid-log]] with an owner and a review date. A wrong assumption becomes an [[term:issue]] the day it is proven false.\n\nA pre-mortem helps: imagine the project failed and ask why. The answers are usually your hidden assumptions.\n\nThe common mistake is logging assumptions once and never testing them. An assumption with no test date is just a hope.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Atlassian Team Playbook: Pre-mortem", url: "https://www.atlassian.com/team-playbook/plays/pre-mortem", kind: "docs", verifiedAt: "2026-10-02T11:53:21Z" },
        { label: "Asana: RAID log - risks, assumptions, issues and decisions", url: "https://asana.com/resources/raid-log", kind: "article", verifiedAt: "2026-10-02T11:57:18Z" },
        { label: "PMI: Lexicon of Project Management Terms", url: "https://www.pmi.org/standards/lexicon", kind: "spec", verifiedAt: "2026-10-02T11:55:40Z" },
        { label: "Asana: Project constraints - 6 types to manage", url: "https://asana.com/resources/project-constraints", kind: "article", verifiedAt: "2026-10-02T11:58:50Z" },
      ],
      video: {
        title: "Risks, Assumptions, and Issues: What are their differences (and similarities)?",
        channel: "PM4NGOs",
        url: "https://www.youtube.com/watch?v=Iwhctssm2o0",
        videoId: "Iwhctssm2o0",
        verifiedAt: "2026-10-02T12:16:56Z",
      },
      alternateVideos: [
        {
          title: "What is an Assumptions Log? Project Management in Under 5",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=C9hifA0M7r8",
          videoId: "C9hifA0M7r8",
          verifiedAt: "2026-10-02T12:16:56Z",
        },
        {
          title: "Project Management Concept #9: Assumptions vs Constraints",
          channel: "Belinda Goodrich, Speaker, Author, Educator",
          url: "https://www.youtube.com/watch?v=sru-hs5JjUg",
          videoId: "sru-hs5JjUg",
          verifiedAt: "2026-10-02T12:16:56Z",
        },
      ],
      handbook: { stages: ["custom-bd-handover"], rules: ["cr-when-needed"], templates: ["raid-log-template"] },
      sections: [
        {
          heading: "Where risky assumptions hide in agency work",
          body:
            "These come up again and again in custom builds:\n\n- **Third-party systems.** \"Integrate with the client's ERP\" assumes an API exists, is documented and someone will give access.\n- **Client inputs.** Content, translations, brand assets, test data and store accounts arriving on time. These are [[term:client-dependency]] items with dates, not vague promises.\n- **Decision speed.** Estimates quietly assume the client reviews designs in two days, not two weeks.\n- **Platforms.** \"Mobile app\" assumed to mean one platform, or a minimum OS version nobody agreed.\n- **Data migration.** \"Import existing customers\" assumes clean data in one format.\n- **Volumes.** Users, orders or files per day that drive hosting and architecture.\n- **Regulation.** Payments, health data or local hosting rules that nobody checked.\n- **Reuse.** \"We have built this before\" assumes the old code is reusable and owned by Oyelabs.",
        },
        {
          heading: "Assumption, constraint, dependency, risk: telling them apart",
          body:
            "- An **[[term:assumption]]** is believed true but not verified: \"The payment gateway supports split payouts.\"\n- A **[[term:constraint]]** is a known limit: \"Launch must be before Ramadan.\"\n- A **[[term:dependency]]** is something your work waits for: \"Designs must be approved before front-end build.\" A [[term:client-dependency]] is one the client owns.\n- A **[[term:risk]]** is an uncertain event that would affect the project: \"The gateway may not support split payouts.\"\n- An **[[term:issue]]** is a risk that has happened.\n\nEvery risky assumption has a matching risk. Logging both is fine; what matters is that each has an owner and a test date.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A fixed-bid marketplace app (React Native and Laravel) for a home-services start-up in Saudi Arabia.**\n\nThe PM reads the proposal and estimate and finds eleven assumptions. Rating impact and uncertainty with the tech lead, three stand out:\n\n1. **\"The payment gateway supports marketplace split payouts.\"** If wrong, the payout flow must be rebuilt or done manually. *Action:* the tech lead checks the gateway documentation this week. Result: split payouts need a separate merchant agreement the client must sign. Logged as a [[term:client-dependency]] with a date.\n2. **\"The client provides Arabic translations.\"** The estimate has no translation effort. *Action:* write it as an explicit assumption in the kickoff MoM with a delivery date, and note that late or missing translations would need a [[term:change-request]].\n3. **\"Service providers are onboarded manually by admins.\"** BD's call notes mention \"self sign-up for providers with document checks\". That is a different feature. *Action:* raise with BD before kickoff; BD confirms it was discussed but not priced. The PM prepares to present it at kickoff as phase 2 or a CR.\n\nThe other eight are logged in the [[term:raid-log]] with review dates. By the end of week 1, two of the three risky assumptions are tested, and none is a surprise in UAT.",
        },
        {
          heading: "Running a 30-minute pre-mortem",
          body:
            "1. Gather the PM, the tech lead, a developer, QA and the designer.\n2. Say: \"It is six months from now and this project failed. Write down why.\"\n3. Give everyone five quiet minutes to write reasons on their own.\n4. Read them out and group them. Most are hidden assumptions.\n5. For each group, write the assumption it rests on, and decide: test it, write it into the client documents, or accept it.\n6. Put the results in the RAID log with owners and dates.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Logging assumptions but never testing them.** Recover: give each risky one a test date and review the log weekly.\n- **Keeping assumptions internal.** The client never agreed to them, so a CR is hard to justify. Recover: put client-facing assumptions in the kickoff MoM and the requirement sign-off.\n- **Rating everything high.** Then nothing is risky. Recover: force a top three.\n- **Discovering the assumption was false and staying quiet.** Recover: turn it into an [[term:issue]] today, assess impact on date and cost, and tell the client with options.\n- **Arguing that a written assumption justifies a CR when the contract says otherwise.** Recover: check with BD.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. I listed every belief the estimate depends on, stated or not.\n2. Each is rated for impact and uncertainty, with a top three.\n3. Each risky assumption has an action: test, write down with the client, or make it a dependency.\n4. Client-facing assumptions appear in the kickoff MoM and the requirement sign-off.\n5. Every entry has an owner and a review date in the RAID log.\n6. I know what happens commercially if an assumption proves false.",
        },
      ],
      sop: [
        {
          title: "Assumption review with BD and the tech lead",
          prompt: "[Oyelabs SOP – admin to fill] When the PM reviews the estimate's assumptions with the tech lead and BD, where the RAID log lives, and who decides whether a false assumption becomes a CR.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a01-risky-assumptions-q1",
          prompt: "Which assumption is the riskiest for a fixed-bid project?",
          options: [
            "\"The client's legacy CRM has a REST API we can use for the integration.\"",
            "\"The team uses Git for version control.\"",
            "\"Meetings will happen on video calls.\"",
            "\"The client's logo is available as a PNG.\"",
          ],
          correctIndex: 0,
          explanation: "It is uncertain and, if wrong, adds weeks of work or a different architecture. The others are low impact or easily checked.",
        },
        {
          id: "pmp-a01-risky-assumptions-q2",
          prompt: "Which two factors decide whether an assumption is risky? (Select all that apply.)",
          options: ["Impact on cost or date if it is wrong", "How uncertain it is", "Who wrote it", "How long the sentence is"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Risky means high impact and high uncertainty. Authorship and wording do not change the risk.",
        },
        {
          id: "pmp-a01-risky-assumptions-q3",
          prompt: "The estimate assumes the client delivers translations; the client was never told. In week 8 translations have not arrived. Why is a CR now hard to justify?",
          options: [
            "The assumption was internal, so the client never agreed to it",
            "Translations are always free",
            "CRs cannot be raised after week 4",
            "Because it is a bug",
          ],
          correctIndex: 0,
          explanation: "An assumption only protects you commercially if the client saw and accepted it, ideally in the SOW, kickoff MoM or requirement sign-off.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a01-risky-assumptions-q4",
          prompt: "\"Launch must happen before the client's trade show on 15 March.\" What is this?",
          options: ["A constraint", "An assumption", "An issue", "A bug"],
          correctIndex: 0,
          explanation: "It is a known, fixed limit, not something believed but unverified. It drives the plan.",
        },
        {
          id: "pmp-a01-risky-assumptions-q5",
          prompt: "You test an assumption and it proves false: the gateway does not support split payouts. What should happen next? (Select all that apply.)",
          options: [
            "Record it as an issue in the RAID log",
            "Assess impact on scope, date and cost with the tech lead",
            "Tell the client with options",
            "Delete the assumption so the log looks clean",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "A false assumption becomes an issue. Assess, then present options. Deleting history removes the evidence you need for a CR.",
        },
        {
          id: "pmp-a01-risky-assumptions-q6",
          prompt: "In a pre-mortem, a developer writes \"we failed because the old code from the last project was not reusable\". What hidden assumption does this reveal?",
          options: [
            "That existing code can be reused (and that Oyelabs owns it)",
            "That the client will pay on time",
            "That the team uses Laravel",
            "That there will be a pre-mortem",
          ],
          correctIndex: 0,
          explanation: "Estimates often discount effort for reuse. Reuse depends on code quality and ownership, both of which need checking.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a01-risky-assumptions-q7",
          prompt: "BD's call notes mention \"self sign-up for providers\" but the estimate assumes admins onboard providers manually. What is the best move before kickoff?",
          options: [
            "Raise the mismatch with BD, agree the position, and present it to the client as phase 2 or a CR if not priced",
            "Build self sign-up quietly",
            "Wait and see if the client mentions it",
            "Tell the client BD made a mistake",
          ],
          correctIndex: 0,
          explanation: "Resolve internal mismatches first, then set the client's expectation clearly and professionally.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a01-risky-assumptions-q8",
          prompt: "Why does an assumption need a review date?",
          options: [
            "Without one it is never tested, and it surprises you later",
            "Because the template has the column",
            "So the client can be billed",
            "It does not need one",
          ],
          correctIndex: 0,
          explanation: "The value of logging is in testing. A date forces a check while there is still time to react.",
        },
        {
          id: "pmp-a01-risky-assumptions-q9",
          prompt: "Everyone in the team rated all 20 assumptions as high risk. What do you do?",
          options: [
            "Force a ranking and pick a top three to act on first",
            "Accept it and escalate all 20 to the client",
            "Delete the low-impact ones",
            "Stop the project",
          ],
          correctIndex: 0,
          explanation: "If everything is high, nothing gets attention. A forced top three focuses the first week's testing.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Below is the assumptions-and-scope section of a proposal for a fixed-bid restaurant-ordering app (React Native and Laravel) for a chain of 12 restaurants in Qatar. Mark every line that hides a risky assumption or an unbounded commitment.",
        segments: [
          { id: "s1", text: "Deliverables: customer app for iOS and Android, a restaurant web dashboard and a super-admin panel.", issue: null },
          { id: "s2", text: "The app will integrate with the client's existing POS system in all 12 restaurants.", issue: "Assumes the POS has a usable API and the same version in every branch. No system is named; this can be weeks of work." },
          { id: "s3", text: "Languages: English and Arabic, with right-to-left layout.", issue: null },
          { id: "s4", text: "The client will provide menu data for all branches.", issue: "No format or date. Menus for 12 branches in two languages can block the whole build." },
          { id: "s5", text: "Payment through one gateway selected by the client from those Oyelabs supports.", issue: null },
          { id: "s6", text: "Existing loyalty members will be migrated from the client's spreadsheet.", issue: "Assumes clean data in one format; volume, duplicates and mapping are unknown." },
          { id: "s7", text: "Design: up to two revision rounds per screen set.", issue: null },
          { id: "s8", text: "The platform will scale to any number of users.", issue: "Unbounded. No volumes are stated, so hosting and architecture cannot be sized or priced." },
          { id: "s9", text: "Out of scope: SMS costs, hosting fees and app store fees.", issue: null },
          { id: "s10", text: "The client will approve designs within 3 business days of each review.", issue: null },
          { id: "s11", text: "Delivery driver tracking will work similar to Talabat.", issue: "\"Similar to\" a famous app has no boundary; the client imagines every Talabat feature." },
          { id: "s12", text: "Change requests are estimated and approved in writing before work starts.", issue: null },
          { id: "s13", text: "Oyelabs will reuse its existing ordering module to reduce cost.", issue: "Assumes the module fits this client and that reuse is allowed. If not, the discount in the price is lost." },
          { id: "s14", text: "Warranty: 60 days from production go-live for defects against signed requirements.", issue: null },
          { id: "s15", text: "Acceptance: written sign-off by the client's named operations manager.", issue: null },
        ],
        askExplanation: true,
      },
    },
  ],
} satisfies Module;
