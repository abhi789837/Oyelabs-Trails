import type { Module } from "@/types/curriculum";

const STANDARD_RUBRIC = [
  { label: "Clarity", points: 2, description: "Short, plain messages; the main point comes first; no jargon the client would not know." },
  {
    label: "Correct use of process and terms",
    points: 3,
    description: "Names the right process (change request, warranty, UAT triage, client-owned accounts) and uses agency terms correctly, explained where needed.",
  },
  { label: "Empathy", points: 2, description: "Acknowledges the client's situation and feelings; asks about the underlying need before defending a position." },
  {
    label: "A firm and fair scope position",
    points: 3,
    description: "Holds the signed scope and the rate card without conceding work for free, while offering fair options (phase it, trade off, a CR).",
  },
  { label: "A clear next step", points: 2, description: "Ends with a concrete next step: who does what, by when." },
  {
    label: "The follow-up email",
    points: 3,
    description: "A short email that confirms what was agreed, the decision or options, the owners and dates, in a professional tone.",
  },
];

export default {
  id: "pmp-d03",
  trackId: "pm",
  name: "Client meetings: Hard conversations",
  description:
    "The four meetings PMs dread: negotiating a change request, announcing a delay, handling an unhappy client's escalation and running a white-label gap call. Each is a step-by-step tutorial with a timed agenda, a script, traps and the 24-hour follow-up, plus a live client role-play.",
  topics: [
    {
      id: "pmp-d03-cr-negotiation",
      moduleId: "pmp-d03",
      trackId: "pm",
      title: "Change-request negotiation",
      summary: `A [[term:change-request|change request]] (CR) meeting is where an agency protects its margin without losing the client's goodwill. The client has asked for something outside the [[term:scope-baseline|scope baseline]]. You have sized it and sent the CR, and now the client is pushing back on the price, the date or the idea that it is a change at all.

At an agency this meeting decides whether the [[term:fixed-bid|fixed bid]] stays profitable. One free "small thing" sets a precedent. The next five arrive faster.

How to run it: restate the request in the client's words, show where the signed [[term:sow|SOW]] or [[term:acceptance-criteria|acceptance criteria]] stop, explain what the hours buy in plain language, then offer options instead of a flat yes or no. The usual options are: do it now at the quoted cost and date; swap it for something of equal size; split it into a smaller first slice; or move it to [[term:phase-2|phase 2]]. Hold the [[term:rate-card|rate card]]. You can change the scope of the CR; you do not discount the same scope because the client is upset.

The common mistake is negotiating the number instead of the scope. A PM who drops 48 hours to 30 to end an awkward call has told the client the estimate was padded, and the team still has to deliver 48 hours of work.

Not legal advice: the signed contract always wins.`,
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Atlassian: IT Change Management (ITIL framework and best practices)", url: "https://www.atlassian.com/itsm/change-management", kind: "docs", verifiedAt: "2026-10-02T12:04:17Z" },
        { label: "Atlassian Team Playbook: Trade-offs", url: "https://www.atlassian.com/team-playbook/plays/trade-offs", kind: "docs", verifiedAt: "2026-10-02T12:04:17Z" },
        { label: "Asana: Change Control Process (5 steps and form fields)", url: "https://asana.com/resources/change-control-process", kind: "article", verifiedAt: "2026-10-02T12:04:18Z" },
        { label: "TeamGantt: What Is Scope Creep and How to Avoid It", url: "https://www.teamgantt.com/project-management-guide/taming-scope-creep", kind: "article", verifiedAt: "2026-10-02T12:04:18Z" },
      ],
      video: {
        title: "How to Control Change Requests on Projects - Project Management Training",
        channel: "ProjectManager",
        url: "https://www.youtube.com/watch?v=WWdgFFVkPgA",
        videoId: "WWdgFFVkPgA",
        verifiedAt: "2026-10-02T12:05:30Z",
      },
      alternateVideos: [
        {
          title: "Project Management Scope Creep [MANAGE IT LIKE A PRO]",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=_c-qzFV5yM4",
          videoId: "_c-qzFV5yM4",
          verifiedAt: "2026-10-02T12:05:31Z",
        },
        {
          title: "How to Prevent Scope Creep",
          channel: "Online PM Courses - Mike Clayton",
          url: "https://www.youtube.com/watch?v=4FwjP2WT4vI",
          videoId: "4FwjP2WT4vI",
          verifiedAt: "2026-10-02T12:05:31Z",
        },
      ],
      sections: [
        {
          heading: "Purpose and when it happens",
          body: `The purpose is a decision on one CR: approve as quoted, approve a reshaped version, defer it, or drop it. It is not a meeting to decide whether the agency gets paid for work.

It happens after you have classified the request and sent a written CR with the tech lead's estimate. Typical triggers:

- the client replies to the CR with "why so expensive?" or "this should be included";
- a CR has sat unapproved for several days while the client keeps asking for the work;
- the client wants the change but cannot move the date or the budget.

If the request is still unclassified, you are not ready for this meeting. Classify it first with the decision tool below and the [[term:scope-baseline|scope baseline]].`,
        },
        {
          heading: "Who attends",
          body: `- **You (PM):** you run it and own the scope position.
- **The client decision maker:** the person who can approve spend, not only the [[term:spoc|SPOC]] who raised the request. If only the SPOC can attend, agree up front that the outcome is a recommendation they take to the approver.
- **Tech lead (optional, first 10 minutes):** to explain the estimate when the client challenges the hours. Release them after.
- **Account manager or BD (optional):** when the conversation may touch commercial terms, discounts or the wider relationship.

Who can approve a discount or a free goodwill item at Oyelabs is a company decision. Follow the Oyelabs rule in the handbook card below, and the SOP block at the end.`,
        },
        {
          heading: "Prepare: checklist",
          body: `- The CR you sent, with the estimate broken into tasks (design, build, QA, release).
- The exact clause or story that shows the request is out of scope: SOW line, signed acceptance criteria, [[term:mom|minutes]] where it was deferred.
- Two or three options already sized: a smaller first slice, a swap of equal size, a [[term:phase-2|phase 2]] date.
- The impact on the current [[term:milestone|milestone]] and the next invoice, if it is approved this week.
- Your walk-away line: the lowest scope you can offer at the rate card, and who you escalate to if the client asks for a discount.
- What the client is really trying to achieve. Re-read their last emails for the business reason (a launch, a demo, a festival, an investor).`,
        },
        {
          heading: "Timed agenda template",
          body: `A 30-minute call. Typical; shorten for a small CR.

1. Open: thank them, state the purpose and the decision you need today (2 min).
2. Restate the request in their words and confirm the business goal behind it (5 min).
3. Show where the signed scope ends, briefly and without blame (3 min).
4. Explain what the estimate covers, task by task, in plain words (5 min).
5. Present the options with cost and date for each (8 min).
6. Agree the decision or the next step, owner and date (5 min).
7. Close: recap what you will send and when (2 min).`,
        },
        {
          heading: "Sample script",
          body: `**Opening**
- "Thanks for making time. I'd like us to leave with a decision on the reporting change, or a clear next step if you need to check with finance."

**Steering when the price is challenged**
- "I understand the number surprised you. Can I show you what the hours actually buy? Most of it is not the screen itself, it's testing every role and keeping the existing reports correct."
- "The signed scope covers the three standard reports. This is a fourth one with new filters, so it sits outside what we priced."

**Offering options, not a discount**
- "I can't reduce the price for the same work, but I can reduce the work. Here are three ways to do that."
- "If the demo is what matters, we could build the summary view first for about half the hours, and add exports in phase 2."

**Asking for the decision**
- "Which of these options works best for you?"
- "If you choose option two, I'll send the revised CR today. Once it's approved in writing, we schedule it into sprint 7."

**Closing**
- "So, to confirm: option two, revised CR from me by 6 pm today, your approval by Thursday. Is that right?"`,
        },
        {
          heading: "What to show",
          body: `- The CR itself, on screen, not a slide about it.
- The one SOW line or acceptance criterion that sets the boundary. One line, not the whole contract.
- A simple options table: option, what is included, hours, cost, delivery date, effect on the current milestone.
- If the client is non-technical, a two-column view: "what you see" and "what we also have to do" (permissions, tests, migration of old data, release).

Do not show the internal estimate sheet with individual developers' names or rates. Show tasks and totals.`,
        },
        {
          heading: "Traps and how to recover",
          body: `- **You discount to end the discomfort.** Recover by re-opening it honestly: "I offered 30 hours on the call. Having checked with the tech lead, 30 hours only covers the summary view. Here are both versions." Then reshape the scope, not the rate.
- **"Other agencies throw this in."** Acknowledge it, then return to value: "Some do, and it's usually priced into their rate. We price changes openly so you only pay for what you choose."
- **The client re-argues that it was always in scope.** Do not debate memory. Point to the signed artefact. If the artefact is genuinely ambiguous, say so and treat it as a [[term:clarification|clarification]] to resolve with your manager, not a CR to force.
- **"Just start, we'll sort the paperwork later."** Decline politely. Work starts after written approval. Offer to turn the CR around the same day instead.
- **The SPOC approves, then the sponsor disputes the invoice.** Prevention: confirm in the meeting who approves spend, and get the approval from that person.
- **Gold-plating from your own side.** If the team offers extras "while we're in there", that is [[term:gold-plating|gold-plating]]. It confuses the CR and teaches the client to expect free work.`,
        },
        {
          heading: "Follow-up within 24 hours",
          body: `Send the decision in writing on the same day. Log it in the [[term:mom|MoM]] and update the CR status.

Template:

- **Subject:** CR-012 reporting change: decision and next steps
- "Hi Priya, thanks for today's call. We agreed option 2: the summary report first (22 hours, delivery in sprint 7). Exports move to phase 2. I've attached the revised CR-012. Once you approve it in writing, we schedule the work. Please approve by Thursday 5 pm to keep sprint 7. Open point: finance to confirm the PO number (owner: you, Thursday)."

If no decision was reached, the email still goes out, and it says what is pending, from whom, and by when.`,
        },
      ],
      handbook: {
        stages: ["custom-scope-control"],
        rules: ["cr-when-needed", "cr-approval", "billing-change-request"],
        templates: ["cr-form", "mom"],
      },
      interactive: {
        kind: "decision-tool",
        request: "Mid-sprint, the client asks to add a fourth report with new filters that was not in the signed scope and calls it a small tweak.",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-d03-cr-negotiation-q1",
          prompt: "The client says your 48-hour CR is too expensive and asks for 30. The scope stays the same. What is the strongest response?",
          options: [
            "Keep the rate and offer a smaller scope that fits about 30 hours, or a phased version",
            "Agree to 30 hours to protect the relationship, and ask the team to work faster",
            "Agree to 30 hours now and add the difference to a later CR",
            "Refuse to discuss it and re-send the original CR",
          ],
          correctIndex: 0,
          explanation:
            "You negotiate the scope, not the price of the same scope. Cutting the hours for identical work signals padding and leaves the team with unfunded work. A flat refusal with no options damages the relationship.",
        },
        {
          id: "pmp-d03-cr-negotiation-q2",
          prompt: "Which of these are fair options to offer in a CR negotiation? (Select all that apply.)",
          options: [
            "Swap the change for an in-scope item of a similar size that the client values less",
            "Deliver a smaller first slice now and the rest in phase 2",
            "Approve the full CR at the quoted cost with a revised delivery date",
            "Start the work now and agree the price once it is finished",
            "Do it free this once if the client promises not to ask again",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Swap, slice and approve-as-quoted are the scope, time and cost trade-offs. Starting before a price is agreed and doing it free both break the CR process and set a precedent.",
        },
        {
          id: "pmp-d03-cr-negotiation-q3",
          prompt: "During the call, the client says: \"Any decent app has CSV export. It should have been included.\" The signed acceptance criteria list on-screen reports only. What do you do?",
          options: [
            "Acknowledge the expectation, show the signed acceptance criteria, and keep it as a CR with options",
            "Agree it is a bug, because most apps have exports",
            "Tell the client they should have read the contract more carefully",
            "Say you will think about it and end the call",
          ],
          correctIndex: 0,
          explanation:
            "\"Every app has it\" is an expectation, not a specification. The evidence is the signed criteria. Blaming the client is unnecessary; it is enough to show where the agreed scope ends.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d03-cr-negotiation-q4",
          prompt: "The client's SPOC approves the CR on the call. Two weeks later the client's finance director disputes the invoice because they never approved it. What should have been done?",
          options: [
            "Confirm in the meeting who approves spend, and get written approval from that person",
            "Record the call so the SPOC's verbal approval can be proved",
            "Start work only after the SPOC repeats the approval twice",
            "Invoice the CR before starting work",
          ],
          correctIndex: 0,
          explanation:
            "The issue is authority, not evidence of the SPOC's words. Agree who can approve spend early, and get written approval from them. A recording of the wrong approver does not settle the dispute.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d03-cr-negotiation-q5",
          prompt: "A fixed-bid project is in sprint 5 of 8. The client says: \"Just start on it, we'll sign the CR later.\" What is the right response?",
          options: [
            "Decline politely, and offer to turn the CR around the same day so approval is quick",
            "Start, because the client has already agreed in principle",
            "Start, but log the hours separately in case it is disputed",
            "Ask the developers to do it in their spare time",
          ],
          correctIndex: 0,
          explanation:
            "Work starts after written approval. The fair move is to remove friction from the approval, not to skip it. Starting early means arguing about payment after the work is done.",
        },
        {
          id: "pmp-d03-cr-negotiation-q6",
          prompt: "Why does the script explain what the hours cover (testing, permissions, data migration) instead of only the total?",
          options: [
            "Clients usually price the visible screen and miss the hidden work, so the breakdown makes the number credible",
            "To make the estimate look bigger than it is",
            "Because the contract requires a line-by-line breakdown in every meeting",
            "So the client can choose which tests to skip",
          ],
          correctIndex: 0,
          explanation:
            "Most pushback comes from comparing the quote with the visible change. Explaining the hidden work in plain words builds trust. It is not an invitation to drop QA, which would just create bugs later.",
        },
        {
          id: "pmp-d03-cr-negotiation-q7",
          prompt: "During the CR call, your tech lead offers: \"While we're in there, we'll also redo the dashboard filters for free.\" What is this, and what do you do?",
          options: [
            "Gold-plating; thank them, keep the CR to what the client asked for, and discuss extras internally afterwards",
            "Good customer service; add it to the CR at no cost",
            "Scope creep from the client; raise a second CR",
            "A clarification; note it in the minutes",
          ],
          correctIndex: 0,
          explanation:
            "Unrequested extras from the team are gold-plating. They muddy the CR, consume unbudgeted hours and teach the client that changes come free.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d03-cr-negotiation-q8",
          prompt: "Which outcomes count as a successful CR meeting? (Select all that apply.)",
          options: [
            "The client approves a reshaped, smaller CR at the standard rate",
            "The client decides to defer the change to phase 2",
            "The client drops the change after seeing the cost",
            "The client gets the full change at a lower rate because they were upset",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Success is a clear, fair decision, whatever it is. A discount on the same scope is a loss for the agency and for the credibility of every future estimate.",
        },
        {
          id: "pmp-d03-cr-negotiation-q9",
          prompt: "After the call, no decision was reached because the client needs to check with finance. What do you send?",
          options: [
            "Same-day minutes listing the options discussed, what is pending, from whom, and by when",
            "Nothing until finance replies",
            "The original CR again, with no comment",
            "A reminder in a week",
          ],
          correctIndex: 0,
          explanation:
            "A pending decision still needs written follow-up, with an owner and a date. Otherwise the CR stalls while the client keeps asking for the work.",
        },
      ],
      practice: {
        kind: "roleplay",
        prompt: "You sent a change request for Hindi and Marathi language support: 48 hours at the standard rate card. The client has just replied, upset. Hold the rate, explain the hours simply, and find a shape of the work she can afford.",
        scenarioId: "cr-price-pushback",
        personaId: "small-business-owner",
        maxTurns: 6,
        brief:
          "Stay calm and kind. Explain in plain words what the 48 hours cover. Keep the rate card instead of discounting the same scope. Ask what she needs first and by when, then offer options such as one language first, menu and checkout only, or her supplying translations. End with a clear next step and write the follow-up email.",
        rubric: STANDARD_RUBRIC,
        followUp: true,
      },
      sop: [
        {
          title: "Who can approve a CR discount or goodwill item",
          prompt:
            "[Oyelabs SOP – admin to fill] Whether a PM may ever reduce a CR's price or give a small change free, the limit (hours or value), who must approve it (account manager, delivery head), and how the goodwill is recorded so it is not repeated.",
        },
      ],
    },
    {
      id: "pmp-d03-bad-news-delay",
      moduleId: "pmp-d03",
      trackId: "pm",
      title: "Delivering bad news and delays",
      summary: `Every agency project slips at some point. The client's trust does not depend on whether it slips; it depends on how early they hear, how honest the reason is, and whether the new plan is believable.

The bad-news meeting has a clear shape. Say the news in the first minute. Give the new date and what it depends on. Explain the cause without blame, including your own share of it. Offer options (a partial release, a reduced scope for the original date, extra checks) and agree when the client hears from you next. If a [[term:client-dependency|client dependency]] such as late API keys caused part of the delay, say so with facts from the [[term:raid-log|RAID log]], not as an accusation.

Keep your position firm and fair. You do not promise a date the team has not estimated. You do not offer free extra resources, compensation or penalties the contract does not mention. And you do not hide your own regression behind the client's late keys.

The common mistake is waiting. A PM who hopes to recover the week tells the client on Thursday that Friday is lost. The client then has no time to manage their own leadership, and the delay becomes an escalation. Your [[term:rag-status|RAG status]] should have turned amber the day the risk appeared.

Not legal advice: the signed contract always wins.`,
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Atlassian: Incident Communication best practices", url: "https://www.atlassian.com/incident-management/incident-communication", kind: "docs", verifiedAt: "2026-10-02T12:04:19Z" },
        { label: "Hubstaff: How to Communicate Project Delays Effectively", url: "https://hubstaff.com/blog/communicating-project-delays/", kind: "article", verifiedAt: "2026-10-02T12:04:21Z" },
        { label: "HBR: Taking the Stress Out of Stressful Conversations", url: "https://hbr.org/2001/07/taking-the-stress-out-of-stressful-conversations", kind: "article", verifiedAt: "2026-10-02T12:04:19Z" },
        { label: "American Bar Association: Delivering Bad News to Clients", url: "https://www.americanbar.org/groups/government_public/resources/practice-pointers/delivering-bad-news-clients/", kind: "article", verifiedAt: "2026-10-02T12:04:21Z" },
      ],
      video: {
        title: "How to Deliver Bad News About a Project",
        channel: "ProjectManager",
        url: "https://www.youtube.com/watch?v=WnUD1-k3B-o",
        videoId: "WnUD1-k3B-o",
        verifiedAt: "2026-10-02T12:05:31Z",
      },
      alternateVideos: [
        {
          title: "Former FBI Negotiator Chris Voss On How To Effectively Deliver Bad News",
          channel: "Crisp",
          url: "https://www.youtube.com/watch?v=izn0plrtNt4",
          videoId: "izn0plrtNt4",
          verifiedAt: "2026-10-02T12:05:32Z",
        },
      ],
      sections: [
        {
          heading: "Purpose and when it happens",
          body: `The purpose is to tell the client about a slip, a failed release or a serious problem, and leave with an agreed revised plan.

It happens as soon as you know a [[term:milestone|milestone]] is at real risk, not when it is missed. Typical triggers:

- the tech lead's re-estimate shows the date cannot hold;
- a [[term:client-dependency|client dependency]] (keys, content, store account) arrives late and eats the buffer;
- internal [[term:qa|QA]] finds a [[term:regression|regression]] that needs a fix and a retest;
- a key developer leaves or falls ill.

No standard sets a notice period for delays. If Oyelabs has an internal rule, follow the Oyelabs rule in the handbook card below. Otherwise the rule of thumb is: the same day you are confident, by call, followed by writing.`,
        },
        {
          heading: "Who attends",
          body: `- **You (PM):** you deliver the news. Never delegate this to a developer or send it only by email.
- **The client SPOC and, where possible, the sponsor:** the person who must explain the slip upward. If the sponsor hears it second-hand, expect an escalation.
- **Tech lead:** for the "why" and "how confident are we" questions. Brief them first so the story is the same.
- **Account manager:** when the slip affects an invoice, a contractual date or the wider relationship.

Keep it small. A delay call with eight people turns into a blame session.`,
        },
        {
          heading: "Prepare: checklist",
          body: `- The facts, in order: what slipped, by how much, and when you found out.
- Every cause, with evidence: dates from the [[term:raid-log|RAID log]] for client dependencies, the QA ticket for your own regression.
- A new date the tech lead has estimated, and what it depends on.
- Two or three options: a partial drop on the original date, a reduced scope, extra checks.
- The effect on the next invoice and on [[term:milestone-billing|milestone billing]], checked against the contract. Do not offer credits or penalties the contract does not contain.
- An updated [[term:rag-status|RAG status]] and status report, ready to send after the call.
- What the client has to tell their own leadership, so you can help them with it.`,
        },
        {
          heading: "Timed agenda template",
          body: `A 20–30 minute call. Typical.

1. Headline: the news in one sentence, in the first minute (1 min).
2. What happened and why, including your own part (5 min).
3. The new date, what it depends on, and your confidence level (4 min).
4. Options and mitigation (partial drop, reduced scope, extra QA) (7 min).
5. What the client needs to tell their leadership, and how you can help (4 min).
6. Agree next steps and the next update time (3 min).`,
        },
        {
          heading: "Sample script",
          body: `**Opening (the news first)**
- "I need to give you some difficult news first, and then the plan. The UAT release will not be ready this Friday. Our new date is next Friday, the 14th."

**Steering (cause without blame)**
- "There are two causes. The payment-gateway keys arrived six working days after the planned date; that's logged in our RAID log from the 3rd. And our own QA found a regression in the order history that we need to fix and retest. That second part is on us."
- "I'm not raising the keys to blame anyone. I'm raising them so we can protect the next dependencies."

**Holding a fair position**
- "I can't promise this Friday, because the team hasn't estimated a plan that makes it true. What I can offer is a partial drop on Friday with tracking and notifications, so you have something real to show."

**Asking for a decision**
- "Would the partial drop on Friday help your steering committee, or would you rather wait for the full release on the 14th?"

**Closing**
- "I'll send the revised plan in writing by 5 pm today, and I'll update you again on Wednesday at 11, whatever the status."`,
        },
        {
          heading: "What to show",
          body: `- A one-page timeline: original plan, what happened, new plan. Dates, not adjectives.
- The RAID log entries for the dependency and the risk, with the dates they were raised.
- The options table: what the client gets on which date, and what each option costs in scope.
- The updated RAG status.

Avoid a long technical explanation of the regression. One sentence on the cause, one on the fix, one on how you will prevent it.`,
        },
        {
          heading: "Traps and how to recover",
          body: `- **You bury the news after ten minutes of small talk.** The client feels managed. Recover by apologising for the lead-in and stating the date plainly.
- **You blame the client.** Even when their dependency caused most of the delay, a blaming tone turns the call into a defence. State the dates and move on to prevention.
- **You hide your own share.** Clients usually find out. If QA found a regression, say so. It makes the dependency point more credible, not less.
- **You promise a date to end the discomfort.** If asked "can you do Wednesday?", answer "I'll check with the tech lead and confirm by 4 pm" rather than guessing.
- **You offer compensation the contract does not contain.** Free hours, discounts or penalties are commercial decisions. Escalate internally first; do not improvise them on the call.
- **The client asks for extra developers to recover.** More people late in a project rarely speeds it up. Say what would genuinely help and what it would cost.
- **Second slip on the same milestone.** Trust is now low. Bring the tech lead, show the root cause, and propose a tighter update cadence until the release.`,
        },
        {
          heading: "Follow-up within 24 hours",
          body: `Within the same day, send the revised plan in writing and update the status report, the [[term:raid-log|RAID log]] and the plan.

Template:

- **Subject:** Revised UAT date: shipment-tracking portal
- "Hi Daniel, thank you for your time today. As discussed, the UAT release moves from Friday 7th to Friday 14th. Causes: the gateway keys arrived on the 11th instead of the 3rd (client dependency, RAID D-04), and a regression in order history found in our QA (fix in progress, retest on the 12th). We agreed a partial drop this Friday with tracking and notifications. Next update: Wednesday 11:00. Risks to the new date: none open at present; we will tell you the same day if that changes."`,
        },
      ],
      handbook: {
        stages: ["custom-sprints", "custom-qa-uat"],
        rules: ["weekly-status-report", "mom-after-every-client-meeting", "escalation-levels"],
        templates: ["status-report-rag", "raid-log-template"],
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-d03-bad-news-delay-q1",
          prompt: "On Monday the tech lead tells you Friday's UAT release cannot hold. When should the client hear?",
          options: [
            "The same day, once you have the facts and a re-estimated date, by call and then in writing",
            "On Thursday, in case the team recovers the time",
            "In Friday's status report",
            "Only if the client asks about the release",
          ],
          correctIndex: 0,
          explanation:
            "Early news gives the client time to manage their own stakeholders. Waiting to see whether you recover is the most common way a delay turns into an escalation.",
        },
        {
          id: "pmp-d03-bad-news-delay-q2",
          prompt: "The delay has two causes: the client's API keys arrived six days late, and your QA found a regression. How do you present the causes?",
          options: [
            "Both, factually, with dates from the RAID log and your own share stated plainly",
            "Only the late keys, because they caused most of the delay",
            "Only the regression, to avoid upsetting the client",
            "Neither; focus only on the new date",
          ],
          correctIndex: 0,
          explanation:
            "Naming both causes is honest and makes the dependency point credible. Hiding your share usually comes out later and damages trust more than the delay itself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d03-bad-news-delay-q3",
          prompt: "The sponsor asks: \"If we're losing a week, will you give us a discount?\" The contract has no delay penalty. What is the right response?",
          options: [
            "Say you cannot agree commercial changes on the call, explain what the contract says, and raise it internally if needed",
            "Offer 10% off the next invoice to keep the client happy",
            "Promise free extra hours in the next sprint",
            "Refuse and say the delay was mostly their fault",
          ],
          correctIndex: 0,
          explanation:
            "A firm, fair position does not promise what the contract does not say. Discounts and credits are commercial decisions for the account owner, not improvised on a delay call.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d03-bad-news-delay-q4",
          prompt: "What should be in the first minute of the call?",
          options: [
            "The headline: what slipped and the new date",
            "A recap of everything that went well this sprint",
            "A detailed technical explanation of the regression",
            "A question about how the client's week is going, followed by the agenda",
          ],
          correctIndex: 0,
          explanation:
            "Bad news goes first. Long preambles make the client feel managed and make the news land harder.",
        },
        {
          id: "pmp-d03-bad-news-delay-q5",
          prompt: "Which options are reasonable mitigations to offer in a delay meeting? (Select all that apply.)",
          options: [
            "A partial release on the original date with the features that are ready",
            "A reduced scope for the original date, with the rest moving later",
            "Extra QA or a tighter update cadence until the new date",
            "A promise that the team will work weekends to hit the original date",
            "A new date that the team has not yet estimated",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Partial drops, reduced scope and more visibility are real options. Promising unplanned overtime or an unestimated date is how a second slip happens.",
        },
        {
          id: "pmp-d03-bad-news-delay-q6",
          prompt: "The client asks: \"Can you do Wednesday instead of next Friday?\" You don't know. What do you say?",
          options: [
            "\"I'll check with the tech lead and confirm by 4 pm today.\"",
            "\"Yes, we'll make it work.\"",
            "\"No, that's impossible.\"",
            "\"Probably, but don't hold me to it.\"",
          ],
          correctIndex: 0,
          explanation:
            "Never commit to a date the team has not estimated. A firm time for your answer keeps trust without guessing.",
        },
        {
          id: "pmp-d03-bad-news-delay-q7",
          prompt: "When should the project's RAG status have changed?",
          options: [
            "When the risk to the date first appeared, before the slip was certain",
            "Only after the milestone was missed",
            "After the client agreed the new date",
            "It should stay green until the release is cancelled",
          ],
          correctIndex: 0,
          explanation:
            "Amber exists to signal risk early. A green status that jumps straight to a missed date tells the client your reporting cannot be trusted.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d03-bad-news-delay-q8",
          prompt: "The client suggests adding two more developers to recover the week. What is the most honest response?",
          options: [
            "Explain that new people need onboarding and rarely speed up the last week, and say what would genuinely help",
            "Agree, and add them at no cost",
            "Agree, and bill the client for them without discussing it",
            "Say the team is too busy to discuss it",
          ],
          correctIndex: 0,
          explanation:
            "Adding people late usually slows the team while they ramp up. Be honest about what helps, and price any real extra resource openly.",
        },
        {
          id: "pmp-d03-bad-news-delay-q9",
          prompt: "What must the written follow-up after a delay call contain? (Select all that apply.)",
          options: [
            "The new date and what it depends on",
            "Both causes, stated factually",
            "The agreed mitigation and the next update time",
            "An apology for every past issue on the project",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The client needs something they can forward to their leadership: date, cause, plan and next update. A long list of apologies adds nothing.",
        },
      ],
      practice: {
        kind: "roleplay",
        prompt: "The UAT release of a shipment-tracking portal will be a week late. The client's Head of Digital expects Friday. Tell him, honestly and early in the conversation.",
        scenarioId: "delay-announcement",
        personaId: "enterprise-stakeholder",
        maxTurns: 6,
        brief:
          "Give the news in your first or second message. Name both causes honestly: the late client dependency (gateway keys) and your own regression. Give a new date and what it depends on, offer a mitigation such as a partial drop, promise nothing the contract does not say, and agree how the revised plan reaches him in writing.",
        rubric: STANDARD_RUBRIC,
        followUp: true,
      },
      sop: [
        {
          title: "Internal escalation before telling a client about a slip",
          prompt:
            "[Oyelabs SOP – admin to fill] Who the PM informs internally before a delay call (delivery head, account manager), how far in advance, the threshold (days of slip or milestone value) that needs management on the call, and where the revised plan is stored.",
        },
      ],
    },
    {
      id: "pmp-d03-whitelabel-gap-call",
      moduleId: "pmp-d03",
      trackId: "pm",
      title: "White-label gap-analysis call",
      summary: `A [[term:white-label|white-label]] gap call is where the client walks through the [[term:core-product|core product]] and you decide, item by item, what they get out of the box, what is [[term:configuration|configuration]], what is [[term:customisation|customisation]] and what is a [[term:new-feature|new feature]]. It sets the price, the timeline and how painful every future [[term:core-upgrade|core upgrade]] will be.

The industry name is fit-to-standard or fit-gap. The client sees the standard product first; only the gaps are logged; each gap then becomes priced custom work, a configuration task, a workaround or an accepted limitation.

Why it is a hard conversation: the client, often a [[term:reseller|reseller]], has already promised their end customer a launch date and a few features. They want everything to be "just a setting". Your job is to be precise about what the [[term:configuration-panel|configuration panel]] really does, and to say no to customisations that do not earn their long-term cost.

The common mistake is agreeing to rebuild the client's old process. Each small customisation is cheap now and expensive at every upgrade, because it becomes a [[term:custom-module|custom module]] that must be merged and retested. Follow the Oyelabs rule in the handbook card below on what counts as configuration versus customisation.`,
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Microsoft Learn: Fit-to-standard and fit-gap analysis", url: "https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/process-focused-solution-fit-to-standard-fit-gap-analysis", kind: "docs", verifiedAt: "2026-10-02T12:04:22Z" },
        { label: "Microsoft Learn Training: Perform fit gap analysis", url: "https://learn.microsoft.com/en-us/training/modules/fit-gap-analysis/", kind: "docs", verifiedAt: "2026-10-02T12:04:23Z" },
        { label: "Asana: Gap Analysis 4-step process", url: "https://asana.com/resources/gap-analysis", kind: "article", verifiedAt: "2026-10-02T12:04:25Z" },
        { label: "ProjectManager: How to Conduct a Gap Analysis", url: "https://www.projectmanager.com/blog/gap-analysis-project-management", kind: "article", verifiedAt: "2026-10-02T12:04:24Z" },
      ],
      video: {
        title: "What is a FIT-GAP analysis . How to determine Effort Estimate. E-Mail-careers@sapsol.com",
        channel: "SAPSOL Technologies",
        url: "https://www.youtube.com/watch?v=Wp3O8Vg-bkk",
        videoId: "Wp3O8Vg-bkk",
        verifiedAt: "2026-10-02T12:05:32Z",
      },
      alternateVideos: [
        {
          title: "How To Perform A Gap Analysis In 5-Steps",
          channel: "Cascade Strategy",
          url: "https://www.youtube.com/watch?v=dSS0EyvC1bM",
          videoId: "dSS0EyvC1bM",
          verifiedAt: "2026-10-02T12:05:32Z",
        },
      ],
      sections: [
        {
          heading: "Purpose and when it happens",
          body: `The purpose is a complete, classified gap list that the client agrees with: every requirement marked out of the box, configuration, customisation or new feature, with the customisations ready to estimate.

It happens after the demo and requirement-capture call, and before any setup or quote is final. Typical shape: one or two calls of 60–90 minutes, depending on how many modules the product has. Typical; agree the length when you book it.

If the client has not seen the product demo yet, do not run the gap call. They will describe their old system instead of reacting to the standard product.`,
        },
        {
          heading: "Who attends",
          body: `- **You (PM):** you run the walkthrough and classify each item live.
- **A product specialist or tech lead who knows the core product:** to answer "can it do X?" with certainty. Guessing here is the most expensive mistake in the whole white-label lifecycle.
- **The client's decision maker and the person who runs operations day to day:** the second one knows the real workflows.
- **For a reseller:** the reseller, and ideally someone from the end client. If the end client cannot attend, agree that the reseller confirms the gap list with them in writing.`,
        },
        {
          heading: "Prepare: checklist",
          body: `- The requirement capture notes from the demo call, grouped by product module.
- A demo instance with realistic data and the client's [[term:brand-kit|brand kit]] applied if you have it, so they react to "their" app.
- A blank gap sheet: requirement, product module, classification, notes, estimate needed (yes or no).
- The current list of [[term:feature-toggle|feature toggles]] and configuration settings, so you never call something configurable that is not.
- The product roadmap notes: anything planned in the core product that might close a gap without customisation.
- The client's launch date and any dates they promised their end customer.`,
        },
        {
          heading: "Timed agenda template",
          body: `A 90-minute call. Typical.

1. Open: purpose, how classification works, what happens after the call (5 min).
2. Walk through the standard product, one module at a time, in the client's main user journey (40 min).
3. For each module: the client names what is missing or different; you classify it live (included in step 2).
4. Review the gap list together and confirm each classification (20 min).
5. Discuss the customisations: business value, workaround, phase 2 (15 min).
6. Next steps: estimate, quote date, what the client must confirm (10 min).`,
        },
        {
          heading: "Sample script",
          body: `**Opening**
- "Today we'll go through the standard app together. When something doesn't fit how you work, tell me, and we'll mark it as one of four things: already there, a setting, a change to the product, or something new."

**Steering the walkthrough**
- "Before we talk about how your current system does it, let's see how the app handles it. Then tell me what's missing."
- "Delivery slots are a setting. You choose the time windows and the cut-off in the admin panel. No build work."

**Holding the line on customisation**
- "We can build a custom loyalty engine, but it becomes a separate module we maintain through every core upgrade. The standard coupon feature covers your launch need. Would that work for phase 1?"
- "I don't want to guess on that one. Let me confirm with the product team and update the sheet by tomorrow."

**Asking for decisions**
- "Can we agree that these three items are configuration and these two need an estimate?"

**Closing**
- "You'll get the gap sheet today and the estimate for the two customisations by Thursday."`,
        },
        {
          heading: "What to show",
          body: `- The live product, not slides. The client must react to the real screens.
- The [[term:configuration-panel|configuration panel]], so the client sees what "a setting" means.
- The gap sheet on a shared screen, filled in during the call, so the classification is agreed, not reported later.
- For a customisation, a short note on upgrade impact: "this will need retesting at every core release".`,
        },
        {
          heading: "Traps and how to recover",
          body: `- **The client describes their old system for 30 minutes.** Recover: "That's useful. Let me show how the app does it, and then you tell me the difference."
- **Someone says "it's just a setting" without checking.** If it turns out to be custom work, correct it in writing at once, before the quote. Late corrections destroy trust.
- **The reseller has promised a feature that the core product does not have.** Do not commit on the call. Classify it as a new feature, estimate it, and offer a launch without it plus a dated phase 2.
- **Too many small customisations.** Ten small changes make a [[term:client-fork|client fork]] that cannot take [[term:core-upgrade|core upgrades]] cleanly. Group them, show the cumulative cost, and ask which ones really matter for launch.
- **Branding requests mixed with features.** Colours, logo and copy are [[term:rebranding|rebranding]] and [[term:theming|theming]]. Keep them on the brand kit list, not the gap list.`,
        },
        {
          heading: "Follow-up within 24 hours",
          body: `Send the gap sheet the same day, marked as a draft for the client to confirm.

Template:

- **Subject:** Gap analysis: grocery app for your Oman client (draft for confirmation)
- "Hi Aisha, thanks for today. Attached is the gap sheet: 21 items are out of the box, 9 are configuration, 2 need customisation (Arabic invoice layout, loyalty points), and 1 is a new feature (driver tipping). Please confirm the classifications with your client by Wednesday. We will send estimates for the 3 build items by Thursday. Configuration starts once the gap list and quote are approved."

Then raise a [[term:change-request|CR]] or quote line for each customisation, using the CR form below.`,
        },
      ],
      handbook: {
        stages: ["wl-gap-analysis"],
        rules: ["configuration-vs-customisation", "core-upgrade-custom-impact", "billing-new-feature"],
        templates: ["cr-form", "whitelabel-onboarding"],
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-d03-whitelabel-gap-call-q1",
          prompt: "Why does a fit-gap call walk the client through the standard product before discussing their needs?",
          options: [
            "So the client reacts to what exists and only real gaps are logged, instead of rebuilding their old process",
            "Because the client must sign the demo before giving requirements",
            "To make the call shorter by skipping requirements",
            "Because standard features are cheaper to sell",
          ],
          correctIndex: 0,
          explanation:
            "Starting from the standard product keeps the gap list short and honest. Starting from the old system tends to recreate it, which leads to costly and unnecessary customisations.",
        },
        {
          id: "pmp-d03-whitelabel-gap-call-q2",
          prompt: "The client wants delivery slots between 9 am and 9 pm with a 2-hour cut-off. The admin panel already lets you set slot windows and cut-offs. How do you classify it?",
          options: ["Configuration", "Customisation", "New feature", "Out of the box with no work at all"],
          correctIndex: 0,
          explanation:
            "It is a setting someone must enter, using an existing option in the configuration panel. No code changes, so it is configuration, not customisation.",
        },
        {
          id: "pmp-d03-whitelabel-gap-call-q3",
          prompt: "Which of these are risks of agreeing to many small customisations in a gap call? (Select all that apply.)",
          options: [
            "Each one has to be merged and retested at every core upgrade",
            "The instance drifts towards a client fork that cannot take upgrades cleanly",
            "The client's licence costs fall",
            "The total cost and timeline grow beyond what the client expected",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "Customisations carry a long-term upgrade cost, push the instance towards a fork, and add up. They do not lower licence costs.",
        },
        {
          id: "pmp-d03-whitelabel-gap-call-q4",
          prompt: "The reseller says: \"I already promised my client driver tipping. Just say it's included.\" The core product has no tipping. What do you do?",
          options: [
            "Classify it as a new feature, estimate it, and offer a launch without it plus a dated phase 2",
            "Mark it as configuration to keep the reseller happy, and work it out later",
            "Agree to include it free because the reseller made a promise",
            "Refuse to discuss tipping at all",
          ],
          correctIndex: 0,
          explanation:
            "Never misclassify to smooth a call: the correction later costs far more trust. Give the reseller a clear, priced path they can take back to their client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d03-whitelabel-gap-call-q5",
          prompt: "During the call someone from your team says \"that's just a setting\" about Arabic invoice layouts. Next day you learn it needs code. What now?",
          options: [
            "Correct it in writing at once, before the quote, and reclassify it as customisation",
            "Build it quietly inside the configuration budget",
            "Wait until the client notices during UAT",
            "Remove it from the gap list",
          ],
          correctIndex: 0,
          explanation:
            "A fast written correction keeps the quote honest. Hiding it means either unpaid work or a surprise CR later, both worse.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d03-whitelabel-gap-call-q6",
          prompt: "The client asks for their logo, brand colours and their own wording on the onboarding screens. Where do these belong?",
          options: [
            "On the brand kit list, as rebranding and theming, not on the gap list",
            "On the gap list as customisations",
            "On the gap list as new features",
            "In a change request",
          ],
          correctIndex: 0,
          explanation:
            "Branding is part of every white-label setup and is handled through the brand kit. Mixing it into the gap list inflates the apparent customisation.",
        },
        {
          id: "pmp-d03-whitelabel-gap-call-q7",
          prompt: "Who should attend from the client side? (Select all that apply.)",
          options: [
            "The decision maker who approves scope and price",
            "The person who runs operations day to day",
            "For a reseller deal, someone from the end client where possible",
            "Only the reseller's marketing team",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "You need someone who can decide, someone who knows the real workflow, and ideally the end client. Marketing alone cannot confirm operational gaps.",
        },
        {
          id: "pmp-d03-whitelabel-gap-call-q8",
          prompt: "The client asks if the app can do something and you are not sure. What is the right answer on the call?",
          options: [
            "\"I'll confirm with the product team and update the sheet by tomorrow.\"",
            "\"Yes, probably.\"",
            "\"No,\" to be safe.",
            "\"It's on the roadmap,\" even if you don't know.",
          ],
          correctIndex: 0,
          explanation:
            "Guessing is the most expensive mistake in a gap call. A dated follow-up keeps the call moving and the sheet accurate.",
        },
        {
          id: "pmp-d03-whitelabel-gap-call-q9",
          prompt: "What should happen to each customisation after the call?",
          options: [
            "It is estimated and priced as a quote line or change request, with its upgrade impact noted",
            "It is built immediately during configuration",
            "It is added to the backlog without an estimate",
            "It is dropped unless the client raises it again",
          ],
          correctIndex: 0,
          explanation:
            "Customisations are paid work with a long-term cost. They need an estimate, a price and approval before setup starts.",
        },
      ],
      practice: {
        kind: "categorize",
        prompt:
          "A reseller is launching a white-label grocery delivery app for a supermarket chain in Oman. The core product has a configuration panel (delivery slots, zones, fees, coupons, languages including Arabic, payment methods from a fixed list), standard coupons, and no loyalty points or tipping. Classify each item from the client's wishlist.",
        mode: "gap-analysis",
        categories: [
          { id: "ootb", label: "Out of the box" },
          { id: "configuration", label: "Configuration" },
          { id: "customisation", label: "Customisation" },
          { id: "new-feature", label: "New feature" },
        ],
        items: [
          { id: "search", text: "Customers search products by name and category.", explanation: "Standard product search, no work needed." },
          { id: "slots", text: "Delivery slots every two hours from 8 am to 10 pm, with a 90-minute cut-off.", explanation: "Slot windows and cut-offs are settings in the configuration panel." },
          { id: "zones", text: "Delivery only to six areas of Muscat, with a different fee per area.", explanation: "Zones and zone fees are configuration." },
          { id: "arabic", text: "The app in Arabic and English.", explanation: "Arabic is a supported language that is switched on and filled in: configuration." },
          { id: "invoice", text: "A tax invoice layout in Arabic matching the chain's accountant's format, different from the standard invoice.", explanation: "Changes the standard invoice template in code: customisation." },
          { id: "loyalty", text: "Loyalty points: earn on every order, redeem at checkout.", explanation: "The core product has no loyalty engine: a new feature." },
          { id: "tipping", text: "Customers can tip the driver after delivery.", explanation: "No tipping exists in the product: a new feature." },
          { id: "coupons", text: "A 10% welcome coupon for first orders.", explanation: "Coupons exist; creating this one is a configuration task." },
          { id: "tracking", text: "Customers see the order status from placed to delivered.", explanation: "Standard order tracking: out of the box." },
          { id: "checkout", text: "Show the product substitution choice as a mandatory step at checkout, not an optional note as in the standard flow.", explanation: "Changes the standard checkout flow: customisation." },
          { id: "payments", text: "Cash on delivery and card payments.", explanation: "Both are on the fixed list of payment methods; enabling them is configuration." },
          { id: "reorder", text: "Reorder a previous basket in one tap.", explanation: "Already in the standard order history: out of the box." },
        ],
        answer: {
          search: "ootb",
          slots: "configuration",
          zones: "configuration",
          arabic: "configuration",
          invoice: "customisation",
          loyalty: "new-feature",
          tipping: "new-feature",
          coupons: "configuration",
          tracking: "ootb",
          checkout: "customisation",
          payments: "configuration",
          reorder: "ootb",
        },
      },
      sop: [
        {
          title: "Our gap sheet and who confirms core-product capabilities",
          prompt:
            "[Oyelabs SOP – admin to fill] Link to the standard gap sheet for each white-label product, the person or team who confirms what the core product can do, and how quickly they answer during a live gap call.",
        },
      ],
    },
    {
      id: "pmp-d03-unhappy-escalation",
      moduleId: "pmp-d03",
      trackId: "pm",
      title: "Handling escalations with unhappy clients",
      summary: `An [[term:escalation|escalation]] meeting happens when a client is unhappy enough to go above the normal channel: an angry email to your director, a threat to stop paying, or a demand for a fix "this week at no cost". It is the meeting where PMs most often give away what the contract does not owe, or lose the client by defending too hard.

The method has four steps. First, listen and acknowledge the business impact before any process. Second, separate the facts: what exactly is wrong, since when, and against which signed [[term:acceptance-criteria|acceptance criteria]]. Third, classify each complaint: a [[term:bug|bug]] under [[term:warranty|warranty]] you fix promptly, an [[term:enhancement|enhancement]] or [[term:change-request|change request]] you price fairly, or a misunderstanding you clarify. Fourth, agree a plan with owners, dates and the next update, then find the root cause so it does not happen again.

Keep the position firm and fair. Real defects get fixed fast and without argument. Requests outside the signed scope do not become free because the client is angry. Never promise compensation, free work or penalties the contract does not contain; escalate that question inside Oyelabs.

The common mistake is reacting to the tone instead of the facts. An angry "this is a bug" can be a real defect, a new requirement, or both. Triage before you concede or refuse anything. Follow the Oyelabs [[term:escalation-matrix|escalation matrix]] in the handbook card below for who joins at which level.

Not legal advice: the signed contract always wins.`,
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Atlassian: Escalation Policies for Incidents", url: "https://www.atlassian.com/incident-management/on-call/escalation-policies", kind: "docs", verifiedAt: "2026-10-02T12:04:21Z" },
        { label: "Atlassian Team Playbook: 5 Whys", url: "https://www.atlassian.com/team-playbook/plays/5-whys", kind: "docs", verifiedAt: "2026-10-02T12:04:21Z" },
        { label: "HBR: Taking the Stress Out of Stressful Conversations", url: "https://hbr.org/2001/07/taking-the-stress-out-of-stressful-conversations", kind: "article", verifiedAt: "2026-10-02T12:04:19Z" },
        { label: "ProjectManager: Escalation Matrix how-to guide", url: "https://www.projectmanager.com/blog/escalation-matrix", kind: "article", verifiedAt: "2026-10-02T12:04:22Z" },
      ],
      video: {
        title: "8 Steps To Manage Client Escalations Like a PRO",
        channel: "VenuMuvvala",
        url: "https://www.youtube.com/watch?v=fTGJMYcLVR0",
        videoId: "fTGJMYcLVR0",
        verifiedAt: "2026-10-02T12:05:32Z",
      },
      alternateVideos: [
        {
          title: "How to Manage Difficult Stakeholders [6 COMMON CHALLENGES]",
          channel: "Adriana Girdler",
          url: "https://www.youtube.com/watch?v=NaGhBpfZLzg",
          videoId: "NaGhBpfZLzg",
          verifiedAt: "2026-10-02T12:05:32Z",
        },
      ],
      sections: [
        {
          heading: "Purpose and when it happens",
          body: `The purpose is to de-escalate: turn an emotional complaint into a classified list of facts, agree a fair plan, and restore a normal working channel.

Typical triggers:

- the client emails your director or the founder directly;
- the client threatens to withhold payment or stop the project;
- the same issue has been reported several times without a clear answer;
- a production problem during [[term:hypercare|hypercare]] or [[term:warranty|warranty]] hits the client's business (lost bookings, failed payments).

Hold the call within one working day of the escalation. A fast call with a partial answer beats a slow call with a perfect one. Exact timings belong to the escalation matrix; follow the Oyelabs rule in the handbook card below.`,
        },
        {
          heading: "Who attends",
          body: `- **You (PM):** you lead unless the matrix says a higher level leads.
- **The client person who escalated,** plus the SPOC if they are different. If the escalation went over the SPOC's head, invite both and handle that tension carefully.
- **Tech lead:** to own the facts and the fix plan.
- **The next level from the [[term:escalation-matrix|escalation matrix]]** (delivery head or account manager) when the client escalated to that level, or when money, contract terms or the relationship are at stake.

Agree internally before the call who says what. A client who hears two versions from the agency escalates again.`,
        },
        {
          heading: "Prepare: checklist",
          body: `- The full history: every ticket, email and [[term:mom|MoM]] on this issue, with dates.
- The signed artefacts: scope, [[term:acceptance-criteria|acceptance criteria]], [[term:sign-off|sign-off]], warranty dates and what warranty covers.
- A first classification of each complaint: defect, change, clarification. Use the decision tool.
- The current status of any real defect: [[term:severity|severity]], fix in progress, ETA, workaround.
- What you can offer without approval, and what needs the account manager.
- The client's business impact, in their terms: missed classes, lost orders, a board meeting.`,
        },
        {
          heading: "Timed agenda template",
          body: `A 45-minute call. Typical.

1. Open: thank them for raising it, state the goal of the call (2 min).
2. Listen: let the client describe the problem and the impact without interruption (8 min).
3. Acknowledge and summarise what you heard, and check you have it right (3 min).
4. Facts: go through each issue against the signed scope and the ticket history (10 min).
5. Classify each item together: defect, change request, clarification (8 min).
6. Plan: fixes with dates, CR options, workarounds, the next update time (10 min).
7. Close: recap, the written follow-up time, the root-cause review date (4 min).`,
        },
        {
          heading: "Sample script",
          body: `**Opening**
- "Thank you for raising this directly. I want to understand the full impact first, then agree a plan you can rely on."

**Acknowledging before the process**
- "Members missing classes is a real cost for you, and I understand why the studio managers are frustrated."

**Steering to facts**
- "Let's take the items one by one. The booking-confirmation email failing on Tuesday is a defect in what we agreed. We fixed it on Wednesday, and I'll share the root cause."
- "SMS reminders are a different case. The signed requirements cover email confirmations only, so SMS is new functionality. I'm not saying that to avoid it. I'm saying it so we can plan it properly."

**Holding a firm, fair position**
- "Anything that doesn't match what we agreed, we fix under warranty, quickly. New functionality, we estimate and schedule. I can't treat it as free, but I can make it fast."
- "I can't agree compensation on this call. I'll take that question to our account director and come back to you by Thursday."

**Asking for a decision**
- "Shall I send a change request for SMS reminders today, with the email reminder as a stop-gap until it's live?"

**Closing**
- "To confirm: defect closed, root-cause note by Friday, SMS CR today, and I'll call you on Monday at 10 with an update."`,
        },
        {
          heading: "What to show",
          body: `- A simple issue table: issue, reported on, classification, status, owner, date.
- The signed acceptance criteria or SOW line for any disputed item. One line, not the whole document.
- For a real defect: the fix status and the workaround, in plain words.
- Later, in the root-cause review: a short [[term:rca|RCA]] using the 5 Whys, with the prevention step.

Do not show internal chat, blame between team members, or developer names next to bugs.`,
        },
        {
          heading: "Traps and how to recover",
          body: `- **You concede everything to stop the anger.** Free CRs teach the client that escalating works. Recover by re-opening it in writing: confirm what is a defect (fixed free) and what is a CR (priced), with an apology for any confusion on the call.
- **You defend too early.** Quoting the contract in the first minute makes the client feel unheard. Listen and acknowledge first; the facts come in step 4.
- **The escalation went over the SPOC's head.** Do not side with either. Include the SPOC in the plan and in the follow-up.
- **There is a real defect inside the complaint.** Own it fully and fix it fast. A firm position on the CR items is only credible if you are generous and quick on real defects.
- **The client threatens to stop paying.** Do not argue payment terms on the call. Note it, and escalate inside Oyelabs the same day.
- **No root-cause review.** If you fix and move on, the same issue returns. Book the RCA review before you end the call.`,
        },
        {
          heading: "Follow-up within 24 hours",
          body: `Send a written summary the same day, copying everyone who was on the escalation email.

Template:

- **Subject:** Booking app issues: summary and action plan
- "Hi Rohan, thank you for the call today. Summary: (1) Booking-confirmation email failure on 14 May: a defect, fixed on 15 May under warranty; root-cause note by Friday 23 May. (2) SMS reminders: not in the signed requirements, so we will send a change request today with an estimate; until then, the email reminder can be sent 24 hours before each class (configuration, no cost). (3) Your question about compensation: our account director will reply by Thursday. Next update: Monday 26 May, 10:00."

Log the escalation, the classification and the outcome in the [[term:raid-log|RAID log]].`,
        },
      ],
      handbook: {
        stages: ["custom-hypercare", "custom-scope-control"],
        rules: ["escalation-levels", "warranty-coverage", "billing-bug-warranty", "billing-enhancement"],
        templates: ["escalation-matrix-template", "mom"],
      },
      interactive: {
        kind: "decision-tool",
        request: "In the warranty period, the client says the missing SMS reminders are a bug. Only email confirmations were in the signed requirements.",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-d03-unhappy-escalation-q1",
          prompt: "An angry client emails your director: \"The app is broken and we want it fixed free this week.\" What is your first step in the escalation call?",
          options: [
            "Listen to the full problem and its business impact, and acknowledge it before discussing process",
            "Open the SOW and read out what is in scope",
            "Agree to fix everything free to calm the client down",
            "Explain the agency's warranty terms in detail",
          ],
          correctIndex: 0,
          explanation:
            "People who feel unheard keep escalating. Listening first does not concede anything; it gets you the facts you need for the triage that follows.",
        },
        {
          id: "pmp-d03-unhappy-escalation-q2",
          prompt: "In warranty, the client complains about three things: a booking email that failed for a day, missing SMS reminders (never specified), and a confusing label on one screen. How do you treat them?",
          options: [
            "Email failure: defect, fixed under warranty. SMS: change request. Label: a small clarification or enhancement, discussed separately",
            "All three are bugs, because the client is in warranty",
            "All three are change requests, because the client is angry",
            "Fix the email and refuse to discuss the rest",
          ],
          correctIndex: 0,
          explanation:
            "Each item is classified on its own facts. Warranty covers defects against the agreed scope, not new functionality. Batching everything one way is either unfair to the client or to the agency.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d03-unhappy-escalation-q3",
          prompt: "The client asks: \"What compensation are you offering for this?\" The contract says nothing about compensation. What do you say?",
          options: [
            "That you cannot agree compensation on the call, and that the account owner will reply by a set date",
            "Offer a 20% discount on the next invoice",
            "Offer a month of free support",
            "Say that compensation is never possible",
          ],
          correctIndex: 0,
          explanation:
            "A PM never promises what the contract does not say. A dated answer from the right person keeps trust without improvising commercial terms.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d03-unhappy-escalation-q4",
          prompt: "Why does being quick and generous on real defects make your firm position on change requests more credible?",
          options: [
            "Because the client sees you are fair, not just defensive, so a no on free CRs reads as principle rather than stinginess",
            "Because defects are always cheaper to fix than CRs",
            "Because warranty fixes can be billed later",
            "It does not; the two are unrelated",
          ],
          correctIndex: 0,
          explanation:
            "Fairness has to be visible on both sides. Clients accept a clear scope line from a team that owns its own mistakes quickly.",
        },
        {
          id: "pmp-d03-unhappy-escalation-q5",
          prompt: "The client escalated straight to your director, over the head of their own SPOC. How do you handle the SPOC?",
          options: [
            "Include them in the call and the plan, and copy them on the follow-up, without taking sides",
            "Leave them out, since the escalation went above them",
            "Tell the client the SPOC should have handled it",
            "Ask the SPOC to apologise on the client's behalf",
          ],
          correctIndex: 0,
          explanation:
            "The SPOC is still your daily channel. Excluding them weakens the relationship you need after the escalation; taking sides makes it worse.",
        },
        {
          id: "pmp-d03-unhappy-escalation-q6",
          prompt: "Which of these belong in the follow-up email after an escalation call? (Select all that apply.)",
          options: [
            "Each issue with its classification, status, owner and date",
            "The date of the root-cause note",
            "The next update time",
            "The names of the developers who caused the bug",
            "A promise that nothing like this will ever happen again",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The client needs a clear plan with dates. Naming individuals is unprofessional, and absolute promises cannot be kept.",
        },
        {
          id: "pmp-d03-unhappy-escalation-q7",
          prompt: "During the call, the client says they will stop paying until everything is fixed. What do you do?",
          options: [
            "Note it calmly, keep to the plan for the issues, and escalate the payment question inside Oyelabs the same day",
            "Argue the payment terms on the call",
            "Agree to pause invoicing to calm things down",
            "End the call immediately",
          ],
          correctIndex: 0,
          explanation:
            "Payment disputes are a commercial and contractual matter for the account owner. The PM keeps the delivery conversation on track and raises the risk internally at once.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-d03-unhappy-escalation-q8",
          prompt: "What is the purpose of a 5 Whys review after the escalation?",
          options: [
            "To find the root cause of the problem so a prevention step can be agreed",
            "To decide which developer to blame",
            "To prove to the client that the issue was their fault",
            "To fill in the warranty claim form",
          ],
          correctIndex: 0,
          explanation:
            "Root-cause analysis is about the process, not individuals. Without it, the same escalation comes back.",
        },
        {
          id: "pmp-d03-unhappy-escalation-q9",
          prompt: "You conceded a free SMS feature on the call to calm the client. Next day you realise it was a change request. What is the best recovery?",
          options: [
            "Write to the client the same day, apologise for the confusion, and set out what is a defect and what is a priced CR, with options",
            "Build it free and say nothing",
            "Build it and add the hours to a later invoice without explanation",
            "Ignore it until the client mentions it",
          ],
          correctIndex: 0,
          explanation:
            "A fast, honest correction is better than either unpaid work or a surprise bill. Offering options (an interim workaround, a fast CR) keeps the client's goodwill.",
        },
        {
          id: "pmp-d03-unhappy-escalation-q10",
          prompt: "When should the next level in the escalation matrix (for example the delivery head) join the call? (Select all that apply.)",
          options: [
            "When the client escalated to that level",
            "When payment, contract terms or compensation are raised",
            "When the relationship itself is at risk",
            "For every routine bug report",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The matrix brings in seniority for commercial and relationship risk, or to match the client's level. Routine bugs stay with the PM and tech lead.",
        },
      ],
      practice: {
        kind: "roleplay",
        prompt: "A fitness-studio booking app is in its 30-day warranty. The founder insists that missing SMS reminders are a bug you must fix free this week. SMS was never in the signed requirements.",
        scenarioId: "bug-or-cr",
        personaId: "startup-founder",
        maxTurns: 8,
        brief:
          "Acknowledge the business problem (members missing classes) first. Refer to the signed requirements and acceptance criteria as evidence, explain bug versus change request simply and without blame, and do not concede a free feature. Offer a fast, fair path: an interim workaround and a quick change request. Agree a next step with a time and write the follow-up email.",
        rubric: STANDARD_RUBRIC,
        followUp: true,
      },
      sop: [
        {
          title: "Our escalation contacts and response times",
          prompt:
            "[Oyelabs SOP – admin to fill] The names or roles at each escalation level (PM, delivery head, account director, founder), the time within which each level must respond to a client escalation, and who may discuss compensation or payment disputes.",
        },
      ],
    },
  ],
} satisfies Module;
