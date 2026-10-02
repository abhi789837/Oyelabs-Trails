import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a14",
  trackId: "pm",
  name: "Custom lifecycle: Support, AMC & retainers",
  description:
    "Life after the warranty: choosing a support model, running L1/L2/L3 support against an SLA the team can actually meet, and moving a client onto an AMC or a retainer that is scoped, tracked and renewed on time.",
  topics: [
    {
      id: "pmp-a14-support-models",
      moduleId: "pmp-a14",
      trackId: "pm",
      title: "Support models, levels and SLAs",
      summary:
        "When the [[term:warranty]] ends, the product still has users, and things still go wrong. [[term:support]] is the service that answers them: someone receives the problem, works out what it is, and gets it fixed. The questions for a PM are which commercial model pays for it, how the work is split between people, and what the client has been promised about speed.\n\nThere are a few common models, and the names vary between agencies: pay-as-you-go support billed on [[term:time-and-materials]], an [[term:amc]] that bundles support and maintenance for a year, a [[term:retainer]] that reserves a block of capacity each month, or a [[term:dedicated-resource-model|dedicated team]]. Inside any of them, work is usually split into levels: L1 receives and triages, L2 investigates and fixes configuration and data, L3 changes code.\n\nThe promise is the [[term:sla]]. As Jira Service Management explains, an SLA measures time to first response and time to resolution, and an SLA calendar can pause the clock outside working hours. The [[term:response-time]] and [[term:resolution-time]] targets usually depend on [[term:severity]] or [[term:priority]]. The common mistakes are doing support work with no active plan, and promising round-the-clock response to an overseas client when the team works one time zone. Follow the stage card and the Oyelabs plans in the handbook card below.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Atlassian Support (Jira Service Management): What are SLAs?", url: "https://support.atlassian.com/jira-service-management-cloud/docs/what-are-slas/", kind: "docs", verifiedAt: "2026-10-02T12:01:26Z" },
        { label: "Atlassian: What is an SLA? Service level agreements explained", url: "https://www.atlassian.com/itsm/service-request-management/slas", kind: "article", verifiedAt: "2026-10-02T11:53:42Z" },
        { label: "Atlassian: Service request management", url: "https://www.atlassian.com/itsm/service-request-management", kind: "article", verifiedAt: "2026-10-02T11:53:44Z" },
        { label: "Atlassian: ITIL 4 guiding principles and practices", url: "https://www.atlassian.com/itsm/itil", kind: "article", verifiedAt: "2026-10-02T11:53:31Z" },
      ],
      video: {
        title: "What Does IT Support Do? Level 1, Level 2, Level 3 Escalations [Overview]",
        channel: "Tech With Emilio",
        url: "https://www.youtube.com/watch?v=AfeuTK2SF_I",
        videoId: "AfeuTK2SF_I",
        verifiedAt: "2026-10-02T12:17:17Z",
      },
      alternateVideos: [
        {
          title: "Basic job responsibilities of L1, L2 and L3 profiles in IT | My Experience | ENG Subtitles",
          channel: "Abhimanyu Gautam",
          url: "https://www.youtube.com/watch?v=hfpccsqzYDk",
          videoId: "hfpccsqzYDk",
          verifiedAt: "2026-10-02T12:17:17Z",
        },
      ],
      handbook: {
        stages: ["custom-support"],
        rules: ["billing-bug-after-warranty", "escalation-levels", "hotfix-approval"],
        templates: ["status-report-rag", "escalation-matrix-template"],
      },
      sections: [
        {
          heading: "Entry and exit criteria",
          body:
            "From the support stage card below. Oyelabs' own plans may add more.\n\n**Support starts when:**\n\n- The warranty has ended, or a support contract is signed.\n- The SLA and the support channel are agreed.\n\n**Support is running well when:**\n\n- Tickets are handled within the SLA.\n- Monthly or quarterly support reports are sent.\n- Renewal is discussed before the plan expires.\n\nThe stage card's typical duration is ongoing, on monthly or yearly terms. Unlike the build, support has no natural end, so the renewal date is the moment you check whether the model still fits.",
        },
        {
          heading: "Who does what (RACI)",
          body:
            "From the support stage card:\n\n- **Receive and triage tickets.** R: PM. A: PM. C: QA. I: client SPOC.\n- **Fix and deploy support items.** R: developers. A: tech lead. C: QA. I: PM.\n- **Report SLA performance.** R: PM. A: PM. C: tech lead. I: client sponsor.\n- **Propose renewal or upgrade.** R: BD/account manager. A: BD/account manager. C: PM. I: client sponsor.\n\nOn a small account the PM often is L1. On a larger one, a support desk may do L1 and the PM oversees. Either way, the PM owns the SLA report, and BD owns the commercial conversation about renewal.",
        },
        {
          heading: "Support models side by side",
          body:
            "These are typical industry models. Oyelabs' actual plans, caps and prices are in the handbook and SOP blocks, not here.\n\n- **Pay-as-you-go (T&M) support.** Each ticket is estimated or logged and billed. Good for a quiet product. Risk: slow, because every fix waits for approval of the cost.\n- **AMC.** A yearly contract covering support and maintenance, usually with a cap (hours or tickets) and exclusions. Good when the client wants a predictable cost. Covered in the next topic.\n- **Retainer.** A fixed monthly fee for reserved capacity, often use-it-or-lose-it. Good when there is a steady stream of small work. Also in the next topic.\n- **Dedicated team.** Named people billed monthly. Good when the product is still growing fast; at that point it is really continued development, not support.\n\nWhatever the model, write down what it covers. A defect against the accepted scope after the warranty is support work, billed or covered as the Oyelabs rule in the handbook card below says. A new feature is not support, under any model, unless the contract says so.",
        },
        {
          heading: "L1, L2, L3 and the SLA clock",
          body:
            "**Levels (a typical split):**\n\n- **L1: receive and triage.** Log the ticket, check it is complete, answer how-to questions, apply known workarounds, set severity and priority.\n- **L2: investigate.** Reproduce, read logs, fix configuration or data, decide whether code must change.\n- **L3: engineering.** Change code, test, and deploy through the [[term:hotfix]] or patch process.\n\nEach level escalates up with a clear note, so nobody asks the client the same question twice.\n\n**The SLA clock:**\n\n- Response and resolution are measured separately. A fast \"we're on it\" does not meet a resolution target.\n- An SLA calendar defines when the clock runs. Jira Service Management, for example, can pause SLAs outside working hours.\n- Overseas clients make this real. If the team works in India and the client is in the US, \"4-hour response\" means something very different in business hours than around the clock. Write the time zone and hours into the SLA.\n- The clock often pauses while waiting for the client, for example for a screenshot or test account. Agree that rule up front.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A Laravel and React field-service platform for a facilities company in the UK.* The warranty ended last month. The client chose a support plan with business-hours SLAs in UK time, and a separate paid option for critical issues out of hours.\n\n- **Monday 08:20 UK.** A dispatcher reports that technicians cannot upload job photos. L1 logs it, sets severity high and priority P2 against the agreed definitions, and responds in 25 minutes.\n- **09:30.** L2 finds the storage bucket's access policy was changed by the client's IT team during an audit. No code change needed. L2 restores the agreed policy with the client's approval. Resolved in 70 minutes. The ticket notes the cause, so it is not counted as a defect in the delivered work.\n- **Wednesday.** The client asks for a new report of jobs by postcode. L1 recognises it as an [[term:enhancement]], not support, and routes it for an estimate.\n- **Thursday 21:00 UK.** The client emails about a typo on an invoice template. It is low severity; the SLA clock starts at 09:00 Friday, as agreed.\n- **Month end.** The PM sends the support report: 18 tickets, all inside response targets, one resolution target missed with the reason, and two trends worth discussing.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Support with no active plan.** The warranty ended, nothing was signed, and the team keeps fixing things. Recover: log every hour, tell BD, and send the client the plan options with a start date.\n- **An SLA the team cannot meet.** \"One-hour response, 24/7\" signed for a team in another time zone with no on-call. Recover: report honestly, and agree a corrected SLA through BD at the next renewal.\n- **Response and resolution mixed up.** Recover: track both on every ticket; report both.\n- **Enhancements hidden as tickets.** New work slips in through the support desk. Recover: classify at L1 and route enhancements and CRs to their own path.\n- **The same question asked three times.** L1 to L2 to L3 without notes. Recover: escalate with a written summary and what has been tried.\n- **No report.** The client only remembers the slow ticket. Recover: send a short monthly report with numbers and trends.",
        },
        {
          heading: "Your checklist",
          body:
            "- A support model is chosen and signed before the warranty ends.\n- What it covers and excludes is written down.\n- One support channel; every ticket logged.\n- Severity and priority definitions agreed, with examples.\n- Response and resolution targets per priority, with business hours and the time zone.\n- Rules for pausing the clock (waiting for the client) agreed.\n- L1, L2 and L3 owners named, with an escalation path.\n- Enhancements and CRs routed out of support at triage.\n- A monthly or quarterly support report sent.\n- The renewal discussed with BD before the plan expires.",
        },
      ],
      sop: [
        {
          title: "Our support desk",
          prompt:
            "[Oyelabs SOP – admin to fill] The support plans Oyelabs offers, the support channel and tool, support hours and time zone, response and resolution targets per priority, who covers L1, L2 and L3, and the monthly report format.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a14-support-models-q1",
          prompt: "According to the support stage card, which are entry criteria for the support stage? (Select all that apply.)",
          options: [
            "The warranty has ended, or a support contract is signed",
            "The SLA and support channel are agreed",
            "The case study is published",
            "Every known issue is fixed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Support starts with a contract and a clear way of working. Known issues may still be open; they move into support.",
        },
        {
          id: "pmp-a14-support-models-q2",
          prompt: "What does an SLA usually measure for a ticket?",
          options: [
            "Only the time to fix",
            "Time to first response and time to resolution, separately",
            "The number of developers assigned",
            "The client's satisfaction score only",
          ],
          correctIndex: 1,
          explanation: "Jira Service Management, for example, measures time to first response and time to resolution. Both matter and both are reported.",
        },
        {
          id: "pmp-a14-support-models-q3",
          prompt: "In a typical three-level model, which level changes code?",
          options: ["L1", "L2", "L3", "The client"],
          correctIndex: 2,
          explanation: "L1 receives and triages, L2 investigates and fixes configuration or data, L3 changes code and deploys through the hotfix or patch process.",
        },
        {
          id: "pmp-a14-support-models-q4",
          prompt:
            "The SLA says \"4-hour response, business hours, UK time\". A low-severity ticket arrives at 21:00 UK on Thursday. When is the response due?",
          options: [
            "By 01:00 Friday",
            "By 13:00 Friday, if business hours start at 09:00, because the clock only runs during business hours",
            "Monday",
            "There is no target for low severity",
          ],
          correctIndex: 1,
          explanation: "An SLA calendar pauses the clock outside working hours. That is why the hours and time zone must be written into the SLA.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a14-support-models-q5",
          prompt:
            "The warranty ended six weeks ago. No support plan was signed, but the team has quietly fixed nine tickets since. What should the PM do?",
          options: [
            "Keep going: the client is happy",
            "Stop answering the client",
            "Log the hours, tell BD, and send the client the support plan options with a start date",
            "Send an invoice for the nine tickets without warning",
          ],
          correctIndex: 2,
          explanation: "Doing support work with no active plan is a listed pitfall. Make the gap visible and offer a fair way forward; BD handles the commercial part.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a14-support-models-q6",
          prompt: "Which belong in a support SLA? (Select all that apply.)",
          options: [
            "Response and resolution targets per priority",
            "Support hours and the time zone",
            "When the clock pauses, for example while waiting for the client",
            "The developers' home addresses",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "These make the promise measurable and fair to both sides.",
        },
        {
          id: "pmp-a14-support-models-q7",
          prompt: "A client on a support plan asks through the support desk for a new report of jobs by postcode. What is it?",
          options: [
            "A P1 support ticket",
            "An enhancement or new feature: route it for an estimate, outside the support SLA",
            "A warranty bug",
            "A clarification",
          ],
          correctIndex: 1,
          explanation: "Support covers problems with what exists. New capability follows the enhancement or CR path, unless the contract explicitly includes it.",
        },
        {
          id: "pmp-a14-support-models-q8",
          prompt:
            "A ticket is resolved, but the cause was the client's own IT team changing a storage policy. How should it be recorded?",
          options: [
            "As a defect in the delivered work",
            "As resolved, with the cause noted as a client-side change, so it is not counted as a defect in the delivered work",
            "Deleted from the log",
            "As a change request",
          ],
          correctIndex: 1,
          explanation: "Recording the real cause keeps the defect numbers honest and helps the client prevent it next time. Whether the time is covered depends on the plan.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a14-support-models-q9",
          prompt: "Who owns the renewal conversation, according to the stage card's RACI?",
          options: ["The PM alone", "The tech lead", "BD/account manager, with the PM consulted", "The client SPOC"],
          correctIndex: 2,
          explanation: "BD is responsible and accountable for proposing renewal or upgrade. The PM brings the data: tickets, trends and SLA performance.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "A live Laravel and React field-service platform for a UK facilities company is on a support plan. Using a typical three-level model, decide where each incoming item should end up. Pick the level that will finish the work, or route it out of support.",
        categories: [
          { id: "l1", label: "L1: answered or closed at triage" },
          { id: "l2", label: "L2: investigation, configuration or data fix" },
          { id: "l3", label: "L3: code change and deployment" },
          { id: "not-support", label: "Not support: route as an enhancement or CR" },
        ],
        items: [
          {
            id: "t1",
            text: "\"How do I reset a technician's password?\" The admin guide covers it and the feature works.",
            explanation: "A how-to question with a documented answer: closed at L1.",
          },
          {
            id: "t2",
            text: "Technicians cannot upload photos. The client's IT team changed the storage bucket's access policy yesterday.",
            explanation: "Investigation and a configuration fix, no code change: L2.",
          },
          {
            id: "t3",
            text: "The invoice PDF shows the wrong VAT total, against the formula in the accepted spec.",
            explanation: "A defect in the code: L3 fixes and deploys it through the patch or hotfix process.",
          },
          {
            id: "t4",
            text: "Add a new report of jobs by postcode.",
            explanation: "New capability, not a problem with what exists: route as an enhancement or CR.",
          },
          {
            id: "t5",
            text: "One customer's job history shows the wrong site address because it was imported with a typo.",
            explanation: "A data correction after investigation: L2.",
          },
          {
            id: "t6",
            text: "A ticket says only \"app not working\" with no details.",
            explanation: "L1 asks for the missing details (who, what, when, screenshot) and pauses the clock as agreed.",
          },
          {
            id: "t7",
            text: "After a framework security update, the job scheduler crashes for jobs that span midnight.",
            explanation: "Needs a code fix and a deployment: L3.",
          },
          {
            id: "t8",
            text: "Change the brand colour across the app after the client's rebrand.",
            explanation: "Changes approved, working design: route as a CR.",
          },
          {
            id: "t9",
            text: "The SMS provider is down across the country; the provider's status page confirms it.",
            explanation: "A known third-party outage: L1 informs the client, links the status page and monitors. No investigation or code needed.",
          },
          {
            id: "t10",
            text: "A dispatcher's account is assigned to the wrong region, so she sees the wrong jobs.",
            explanation: "A configuration fix in the admin settings after checking: L2.",
          },
        ],
        answer: {
          t1: "l1",
          t2: "l2",
          t3: "l3",
          t4: "not-support",
          t5: "l2",
          t6: "l1",
          t7: "l3",
          t8: "not-support",
          t9: "l1",
          t10: "l2",
        },
      },
    },
    {
      id: "pmp-a14-amc-retainer",
      moduleId: "pmp-a14",
      trackId: "pm",
      title: "AMC and retainer engagements",
      summary:
        "An [[term:amc]] and a [[term:retainer]] both turn a finished project into a continuing relationship, but they buy different things. An AMC (annual maintenance contract) buys care: [[term:support]] and [[term:maintenance]] for a year, usually with a cap and a list of exclusions. A retainer buys capacity: a recurring fee for a reserved block of the team's time each month, often use-it-or-lose-it, as Investopedia describes retainer fees. One keeps the product healthy; the other keeps the product moving.\n\nMaintenance work is commonly sorted into four types, the taxonomy used with the ISO/IEC/IEEE 14764 maintenance standard: corrective (fixing defects), adaptive (keeping up with new OS versions, browsers, APIs), perfective (improving what works) and preventive (removing root causes and technical debt before they cause incidents). Writing the AMC scope in these words stops the commonest argument: whether a nice-to-have improvement is \"maintenance\".\n\nThe common mistakes, from the support stage card, are no record of hours used under a retainer and letting the plan expire without a [[term:renewal]] conversation. The fix is a monthly report from day one, and a renewal review well before the end date, built on what the hours were actually spent on. Prices, caps and rollover rules come from the Oyelabs plans in the handbook, never from memory. Not legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "ISO/IEC/IEEE 14764:2022 - Software maintenance (standard page)", url: "https://www.iso.org/standard/80710.html", kind: "spec", verifiedAt: "2026-10-02T11:55:40Z" },
        { label: "Investopedia: Retainer fee - definition and how it works", url: "https://www.investopedia.com/terms/r/retainer-fee.asp", kind: "article", verifiedAt: "2026-10-02T11:52:05Z" },
        { label: "Atlassian: What is technical debt", url: "https://www.atlassian.com/agile/software-development/technical-debt", kind: "article", verifiedAt: "2026-10-02T11:54:27Z" },
        { label: "Atlassian Support (Jira Service Management): Create SLAs to manage goals", url: "https://support.atlassian.com/jira-service-management-cloud/docs/create-service-level-agreements-slas/", kind: "docs", verifiedAt: "2026-10-02T12:01:26Z" },
      ],
      video: {
        title: "Perfective, Preventive, Adaptive, Corrective Maintenance in Software Engineering",
        channel: "Gate Smashers",
        url: "https://www.youtube.com/watch?v=nulFv99VBGs",
        videoId: "nulFv99VBGs",
        verifiedAt: "2026-10-02T12:17:17Z",
      },
      alternateVideos: [
        {
          title: "How Do Agency Retainers Work?",
          channel: "Butler Branding Agency",
          url: "https://www.youtube.com/watch?v=FaMtj25UUvQ",
          videoId: "FaMtj25UUvQ",
          verifiedAt: "2026-10-02T12:17:17Z",
        },
        {
          title: "Agency Pricing Models - Creative Flexibility & Retainers",
          channel: "Creative Agency Success",
          url: "https://www.youtube.com/watch?v=WgJ2f7OViKw",
          videoId: "WgJ2f7OViKw",
          verifiedAt: "2026-10-02T12:17:18Z",
        },
      ],
      handbook: {
        stages: ["custom-support"],
        rules: ["billing-bug-after-warranty", "billing-enhancement", "billing-change-request", "warranty-coverage"],
        templates: ["status-report-rag"],
      },
      sections: [
        {
          heading: "AMC vs retainer: what each one buys",
          body:
            "**AMC (annual maintenance contract):**\n\n- **Buys:** care for the live product.\n- **Typical term:** a year.\n- **Typical work:** corrective, adaptive and preventive maintenance, plus support.\n- **Typical limit:** a cap on hours or tickets, plus exclusions.\n- **Risk to the client:** paying for a quiet year.\n- **Risk to the agency:** unlimited \"maintenance\" requests.\n\n**Retainer:**\n\n- **Buys:** reserved team capacity.\n- **Typical term:** monthly, often with a minimum term.\n- **Typical work:** any agreed work: small enhancements, maintenance, support.\n- **Typical limit:** hours per month, often use-it-or-lose-it.\n- **Risk to the client:** paying for unused hours.\n- **Risk to the agency:** overruns without a record.\n\nThese are typical industry shapes, not Oyelabs plans. Many agencies offer both, or a hybrid. Check the Oyelabs plans in the handbook and SOP blocks before you describe one to a client.",
        },
        {
          heading: "Writing an AMC scope that survives the year",
          body:
            "Use the four maintenance types as the backbone:\n\n- **Corrective.** Fixing defects in the delivered product after the warranty. Normally the heart of an AMC.\n- **Adaptive.** Keeping up with the world: new iOS and Android versions, browser changes, a payment provider's API deprecation, framework security updates.\n- **Perfective.** Improving things that work: speed, usability, small changes. This is where arguments start. Decide whether it is included, capped, or always quoted separately.\n- **Preventive.** Dependency upgrades, technical debt, monitoring. Atlassian's technical debt guidance is a good primer for explaining it to clients.\n\nThen write down, with BD:\n\n1. The cap (hours or tickets) and what happens above it.\n2. Response and resolution targets per priority, hours and time zone.\n3. Exclusions: typically new features, third-party fees, hosting costs, and changes made by others.\n4. Whether unused hours roll over.\n5. Reporting: what the client receives each month.\n6. Renewal and notice dates.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Moving a client from project to retainer",
          body:
            "A retainer fits when the client has a steady stream of small work and wants the same team on it. The signals are in your own data: the hypercare log full of enhancement requests, a [[term:phase-2]] list, a [[term:backlog]] the client keeps adding to.\n\n1. **Start early.** Raise the post-warranty plan at least a month before the warranty ends, as the terminology module advises. The client should never discover the gap with the first bug after warranty.\n2. **Build the case from data.** \"In hypercare you raised 14 enhancement requests; at this rate a reserved monthly block would let us deliver them without a CR for each one.\"\n3. **Hand the commercial part to BD.** The PM brings the evidence and the delivery plan; BD proposes the model and the price, following the stage card's RACI.\n4. **Agree how work is chosen.** A monthly planning call where the client prioritises the backlog against the available hours.\n5. **Agree what is still a CR.** Large features still need their own estimate, even on a retainer.",
        },
        {
          heading: "Running it month to month",
          body:
            "- **Log every hour against a ticket and a maintenance type.** The stage card lists \"no record of hours used under a retainer\" as a pitfall. Without the log, you cannot report, renew or defend an overrun.\n- **Watch the burn.** Agree a threshold at which the client is warned that hours are running out, and what happens next (stop, prioritise, or approve extra hours in writing).\n- **Send a monthly report.** Hours used by type, tickets closed, SLA performance, what is planned next month, and any risk (for example an OS release coming).\n- **Protect preventive work.** If every hour goes to client requests, technical debt grows until an incident pays for it. Agree a share of time for preventive work.\n- **Review quarterly.** For larger accounts, a [[term:qbr]] is the natural moment to look at the trend and the fit of the plan.\n- **Start the renewal early.** Well before the end date, review with BD whether the model still fits what the hours were spent on.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A React Native and Laravel loyalty app for a coffee chain in the UAE.* After warranty, the client signed a retainer for a fixed block of hours each month, use-it-or-lose-it, with extra hours only if approved in writing. These are the client's contract terms, not an Oyelabs standard.\n\n- **Month 1.** The PM sets up the hours log with a maintenance type on every entry and a monthly planning call. The tech lead adds a preventive line for dependency upgrades.\n- **Month 3.** Hours run out in week three because of a promotion campaign. The PM warns the client SPOC at the agreed threshold; the client approves extra hours in writing for the campaign work.\n- **Month 6.** The PM's report shows that about half the hours went on perfective work (new screens, promotion features), and very little on corrective fixes. The product is stable and the client is really buying a roadmap.\n- **QBR.** With BD, the PM presents the data. The client chooses a larger retainer focused on features, with corrective and adaptive work covered by a separate AMC.\n- **Renewal.** Agreed a month before the end date, with no gap in service.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **No hours log.** At month end, nobody can say where the time went. Recover: rebuild it from tickets and commits now, and log daily from today.\n- **\"Maintenance\" stretched to cover new features.** The AMC becomes free development. Recover: classify each request by maintenance type; perfective work beyond the agreed limit, and new features, are quoted or moved to a retainer.\n- **Overrun absorbed silently.** The team works extra hours to be helpful. Recover: warn at the threshold, and get written approval for anything above the block.\n- **No preventive work.** Upgrades are skipped until an OS release breaks the app. Recover: protect a share of hours for preventive work and explain why in the report.\n- **The plan expires unnoticed.** Recover: put the renewal review in the calendar well before the end date, with BD.\n- **Quoting a typical price from another agency.** Recover: use only Oyelabs' plans, through BD.",
        },
        {
          heading: "Your checklist",
          body:
            "- Model chosen with BD: AMC, retainer, or both; Oyelabs plan terms checked.\n- Scope written by maintenance type: corrective, adaptive, perfective, preventive.\n- Cap, rollover rule, exclusions and SLA written down.\n- Hours logged against tickets and maintenance types from day one.\n- Burn threshold and overrun approval rule agreed.\n- Monthly report sent: hours by type, tickets, SLA, plan, risks.\n- A share of time protected for preventive work.\n- Quarterly review for larger accounts.\n- Renewal review with BD well before the end date.",
        },
      ],
      sop: [
        {
          title: "Our AMC and retainer plans",
          prompt:
            "[Oyelabs SOP – admin to fill] The AMC and retainer plans Oyelabs offers (what each covers, caps, rollover rules, overrun handling and approval), the monthly report template, and how far before expiry the renewal review starts.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a14-amc-retainer-q1",
          prompt: "What is the core difference between an AMC and a retainer?",
          options: [
            "There is none",
            "An AMC buys care for the live product (support and maintenance, usually capped); a retainer buys reserved team capacity each month",
            "An AMC is only for hosting",
            "A retainer is a kind of warranty",
          ],
          correctIndex: 1,
          explanation: "One keeps the product healthy, the other keeps it moving. Many clients end up with both.",
        },
        {
          id: "pmp-a14-amc-retainer-q2",
          prompt: "Match the work to its maintenance type: updating the app because a new iOS version broke a screen.",
          options: ["Corrective", "Adaptive", "Perfective", "Preventive"],
          correctIndex: 1,
          explanation: "Adaptive maintenance keeps the software working as its environment changes: OS versions, browsers, third-party APIs.",
        },
        {
          id: "pmp-a14-amc-retainer-q3",
          prompt: "Which are preventive maintenance? (Select all that apply.)",
          options: [
            "Upgrading outdated dependencies before they become a security risk",
            "Paying down technical debt behind repeated incidents",
            "Adding a new loyalty tier screen",
            "Adding monitoring that catches failures earlier",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Preventive work reduces future problems. A new screen is perfective or a new feature, depending on the scope.",
        },
        {
          id: "pmp-a14-amc-retainer-q4",
          prompt:
            "Under an AMC that covers corrective and adaptive work, the client asks for a redesigned checkout \"as part of maintenance\". What is it, and what do you do?",
          options: [
            "Corrective maintenance: do it under the AMC",
            "Perfective work or a new feature, outside this AMC's scope: estimate it and offer it as a CR or retainer work",
            "Adaptive maintenance",
            "Refuse to discuss it",
          ],
          correctIndex: 1,
          explanation: "Using the four types in the scope makes this conversation short and fair. Not legal advice: the signed contract always wins.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a14-amc-retainer-q5",
          prompt: "What does \"use-it-or-lose-it\" mean on a retainer?",
          options: [
            "The client loses the app if they stop paying",
            "Hours not used in the month do not carry over to the next month",
            "The team can be removed at any time",
            "Unused hours are refunded",
          ],
          correctIndex: 1,
          explanation: "A common retainer term, as Investopedia describes. Whether it applies depends on the contract; some retainers allow limited rollover.",
        },
        {
          id: "pmp-a14-amc-retainer-q6",
          prompt:
            "In week three of a retainer month, the hours are used up and the client asks for urgent campaign work. What do you do?",
          options: [
            "Do it quietly; the client is important",
            "Refuse until next month",
            "Tell the client the block is used, and agree in writing whether to approve extra hours, reprioritise, or wait",
            "Take the hours from next month without telling anyone",
          ],
          correctIndex: 2,
          explanation: "Silent overruns are the commonest retainer leak. Make it visible and get a written decision.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a14-amc-retainer-q7",
          prompt: "Why log each retainer hour against a ticket and a maintenance type?",
          options: [
            "To fill timesheets",
            "So the monthly report, overrun conversations and the renewal can rest on facts about what the hours bought",
            "Because the stores require it",
            "It is not needed",
          ],
          correctIndex: 1,
          explanation: "\"No record of hours used under a retainer\" is a listed pitfall. The log is also the evidence for resizing the plan at renewal.",
        },
        {
          id: "pmp-a14-amc-retainer-q8",
          prompt:
            "Six months into a retainer, the report shows about half the hours went on perfective work and almost none on corrective fixes. What does this suggest?",
          options: [
            "The team is lazy",
            "The product is stable and the client is really buying a roadmap; discuss at the QBR whether a feature-focused retainer plus a separate AMC fits better",
            "Cancel the retainer",
            "Hide the numbers from the client",
          ],
          correctIndex: 1,
          explanation: "The hours log tells you what the client values. Use it to propose a model that matches, through BD.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a14-amc-retainer-q9",
          prompt: "Which belong in an AMC scope? (Select all that apply.)",
          options: [
            "The cap on hours or tickets, and what happens above it",
            "Exclusions such as new features and third-party fees",
            "Response and resolution targets with hours and time zone",
            "A promise of unlimited changes",
            "Renewal and notice dates",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation: "An AMC needs limits and dates to work. \"Unlimited changes\" turns it into free development.",
        },
        {
          id: "pmp-a14-amc-retainer-q10",
          prompt: "When should the post-warranty plan first be raised with the client?",
          options: [
            "After the first bug outside warranty",
            "Well before the warranty ends, so there is no gap in cover",
            "Only if the client asks",
            "At project kickoff and never again",
          ],
          correctIndex: 1,
          explanation: "A client who finds the gap with a live problem feels trapped. Raising it early makes it a planning conversation.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "A coffee chain's loyalty app is on a retainer. In this client's contract the block is 60 hours a month, use-it-or-lose-it, and hours above the block need written approval. Here is this month's hours log by maintenance type. Work out the numbers for the monthly report.",
        table: {
          columns: ["Week", "Corrective (h)", "Adaptive (h)", "Perfective (h)", "Preventive (h)"],
          rows: [
            ["Week 1", "6", "0", "8", "2"],
            ["Week 2", "3", "5", "10", "0"],
            ["Week 3", "9", "0", "6", "2"],
            ["Week 4", "2", "4", "12", "3"],
          ],
        },
        fields: [
          {
            id: "total",
            label: "Total hours used this month",
            unit: "h",
            answer: 72,
            tolerance: 0,
            expression: "T[0][1]+T[0][2]+T[0][3]+T[0][4]+T[1][1]+T[1][2]+T[1][3]+T[1][4]+T[2][1]+T[2][2]+T[2][3]+T[2][4]+T[3][1]+T[3][2]+T[3][3]+T[3][4]",
          },
          {
            id: "over",
            label: "Hours above the 60-hour block (needing written approval)",
            unit: "h",
            answer: 12,
            tolerance: 0,
            expression: "T[0][1]+T[0][2]+T[0][3]+T[0][4]+T[1][1]+T[1][2]+T[1][3]+T[1][4]+T[2][1]+T[2][2]+T[2][3]+T[2][4]+T[3][1]+T[3][2]+T[3][3]+T[3][4]-60",
          },
          {
            id: "perfective",
            label: "Share of all hours spent on perfective work",
            unit: "%",
            answer: 50,
            tolerance: 0.5,
            expression: "(T[0][3]+T[1][3]+T[2][3]+T[3][3])/(T[0][1]+T[0][2]+T[0][3]+T[0][4]+T[1][1]+T[1][2]+T[1][3]+T[1][4]+T[2][1]+T[2][2]+T[2][3]+T[2][4]+T[3][1]+T[3][2]+T[3][3]+T[3][4])*100",
          },
        ],
        explanation:
          "Weekly totals are 16, 18, 17 and 21, so 72 hours. That is 12 hours above the 60-hour block, which needed written approval before the work, not a surprise on the report. Perfective work is 8 + 10 + 6 + 12 = 36 hours, half of 72. Preventive work is only 7 hours. The report should show the overrun and its approval, and the PM should bring the perfective trend to BD: the client is buying a roadmap, so a feature-focused retainer with protected preventive time may fit better.",
      },
    },
  ],
} satisfies Module;
