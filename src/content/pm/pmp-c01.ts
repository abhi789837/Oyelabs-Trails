import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-c01",
  trackId: "pm",
  name: "Terminology: Commercial & contract terms",
  description:
    "The contract and money words a PM uses every week, taught as side-by-side comparisons: MSA vs SOW vs NDA, estimate vs quote vs PO vs invoice, the pricing models, and who owns the code at handover. Each pair shows what changes for time and billing when you pick the wrong word.",
  topics: [
    {
      id: "pmp-c01-msa-sow-nda",
      moduleId: "pmp-c01",
      trackId: "pm",
      title: "MSA vs SOW vs NDA",
      summary:
        "Three documents, three jobs. The [[term:nda]] lets two companies talk openly before any deal. The [[term:msa]] fixes the legal rules once for the whole relationship. The [[term:sow]] describes one piece of work: what is built, by when and for how much.\n\nWhy it matters at an agency: PMs live inside the SOW. Every scope argument, every [[term:change-request]] and every billing question goes back to it. But the SOW only works because it sits under an MSA that already says how invoices are paid, who owns the code and how either side can walk away. Mixing them up leads to real mistakes: promising a client a \"new contract\" for a small extension that only needs a new SOW, or answering a confidentiality question from the SOW when the NDA or MSA governs it.\n\nHow to use the words: when a client asks \"what did we agree?\", ask yourself which layer the question belongs to. Scope, deliverables, timeline and price: the SOW. Liability, payment terms, IP and termination: the MSA. Can we share this document with a vendor? The NDA, or the confidentiality clause of the MSA.\n\nThe common mistake: treating the proposal or a sales email as the agreement. Only signed documents bind. Not legal advice: the signed contract always wins.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "GOV.UK: Model Services Contract (UK government template contract)", url: "https://www.gov.uk/government/collections/model-services-contract", kind: "spec", verifiedAt: "2026-10-02T11:51:28Z" },
        { label: "Ironclad: MSA vs SOW - which one to use when", url: "https://ironcladapp.com/journal/contracts/msa-vs-sow", kind: "article", verifiedAt: "2026-10-02T11:51:37Z" },
        { label: "Investopedia: Non-disclosure agreements (NDAs)", url: "https://www.investopedia.com/terms/n/nda.asp", kind: "article", verifiedAt: "2026-10-02T11:52:00Z" },
      ],
      video: {
        title: "Master Service Agreement (MSA) Explained in Simple Terms",
        channel: "Malcolm Zoppi | Corporate and M&A Solicitor",
        url: "https://www.youtube.com/watch?v=SyoXHjRR5KA",
        videoId: "SyoXHjRR5KA",
        verifiedAt: "2026-10-02T12:17:19Z",
      },
      alternateVideos: [
        {
          title: "What Is An NDA? Non Disclosure Agreement (NDA) Explained",
          channel: "Tetrault Wealth",
          url: "https://www.youtube.com/watch?v=GrW6_yCBw6M",
          videoId: "GrW6_yCBw6M",
          verifiedAt: "2026-10-02T12:17:19Z",
        },
      ],
      interactive: { kind: "flashcards", category: "commercial" },
      handbook: { stages: ["custom-bd-handover"] },
      sections: [
        {
          heading: "MSA vs SOW: side by side",
          body:
            "**[[term:msa]]**\n- Signed once per client relationship, before or with the first project.\n- Changes rarely; renegotiating it is slow and involves lawyers.\n- The PM reads it for payment terms, warranty, IP and termination, but does not manage it day to day.\n\n**[[term:sow]]**\n- Signed per project or phase. A repeat client may have several under one MSA.\n- Changes through a [[term:change-request]] or a new SOW.\n- The PM manages against it every week: scope, [[term:milestone]] dates, deliverables and [[term:assumption|assumptions]].\n\n**Consequence for time and billing:** a second phase for an existing client usually needs only a new SOW, which can be signed in days. Without an MSA, every new piece of work reopens the legal terms, which typically adds weeks before the team can start.",
        },
        {
          heading: "NDA vs the confidentiality clause: side by side",
          body:
            "**[[term:nda]]**\n- Signed early, often before the requirement call, so the client can share business plans.\n- Covers talking, not building. No scope, no price.\n\n**Confidentiality in the [[term:msa]]**\n- Takes over once the MSA is signed and usually covers the whole engagement.\n\n**Consequence:** an NDA does not let the team start work and does not entitle anyone to invoice. If a client says \"we signed, so start\", check what was signed. An NDA alone means no committed scope and no billable work.",
        },
        {
          heading: "Where each question goes",
          body:
            "- \"Is the push notification module included?\" Look in the **[[term:sow]]** (scope and exclusions).\n- \"How many days do we have to pay your invoice?\" The **[[term:msa]]** ([[term:payment-terms]]), unless the SOW overrides it.\n- \"Who owns the code if we stop working together?\" The **MSA** ([[term:ip-ownership]], [[term:termination]]).\n- \"Can I show your wireframes to my investor?\" The **NDA** or the MSA's confidentiality clause.\n- \"When is the second instalment due?\" The **SOW** ([[term:milestone-billing]] schedule).",
        },
        {
          heading: "How to say it to a client",
          body:
            "- \"Our MSA already covers the legal terms, so for the new admin panel we only need a short SOW. That means we can start as soon as it is signed.\"\n- \"The NDA lets us look at your current system safely. Once we agree the scope, we will send a SOW with the price and dates.\"\n- \"That item is not in the SOW we signed, so I will send you a change request with the impact on time and cost.\"",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Quoting the proposal as the agreement.** A [[term:proposal]] is pre-sales. If it promised something the SOW does not contain, raise it with BD before answering the client.\n- **Starting work on an NDA and a verbal yes.** Recover: pause billable work, confirm the SOW status with BD in writing, and log the risk.\n- **Assuming the SOW wins when it conflicts with the MSA.** The documents themselves say which wins. Check, or ask BD.",
        },
      ],
      sop: [
        {
          title: "Where Oyelabs keeps signed contracts",
          prompt: "[Oyelabs SOP – admin to fill] Where the signed MSA, SOWs and NDAs for each client are stored, who can access them, and who in BD or finance the PM asks when a clause is unclear.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c01-msa-sow-nda-q1",
          prompt: "A long-standing client wants a second app built. The MSA from the first project is still in force. What normally needs to be signed before work starts?",
          options: ["A new SOW for the second app", "A new MSA and a new NDA", "Nothing, the existing MSA covers new work", "Only a purchase order"],
          correctIndex: 0,
          explanation: "The MSA sets the legal terms but not the scope or price of new work, so a new SOW is needed. Re-signing the MSA is unnecessary while it is in force.",
        },
        {
          id: "pmp-c01-msa-sow-nda-q2",
          prompt: "A prospect signed an NDA yesterday and now says: \"Great, we have a contract, please start building the login screens.\" What is the right reading?",
          options: [
            "The NDA protects information only; there is no agreed scope or price, so billable work should not start",
            "The NDA is enough to start, because it is a signed contract",
            "Start the work but invoice later under the NDA",
            "The NDA can be converted into a SOW by adding a price",
          ],
          correctIndex: 0,
          explanation: "An NDA covers confidentiality, not delivery. Starting on it means work with no scope, price or payment terms.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c01-msa-sow-nda-q3",
          prompt: "Which questions are normally answered by the MSA rather than the SOW? (Select all that apply.)",
          options: ["Payment terms such as Net 30", "Who owns the source code", "Which screens are in phase 1", "The date of the design milestone"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Payment terms and IP are relationship-wide legal terms in the MSA. Screens and milestone dates are project-specific, so they live in the SOW.",
        },
        {
          id: "pmp-c01-msa-sow-nda-q4",
          prompt: "During sprint 3, the client says: \"Your proposal mentioned offline mode, so it is included.\" The signed SOW does not mention offline mode. What do you do first?",
          options: [
            "Check the signed SOW and talk to BD about the proposal before replying",
            "Build offline mode, because the proposal promised it",
            "Tell the client proposals are meaningless",
            "Raise a bug, because a promised feature is missing",
          ],
          correctIndex: 0,
          explanation: "Only the signed documents bind, but a promise in the proposal is a relationship issue. Confirm with BD, then reply with the SOW position and, if wanted, a change request.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c01-msa-sow-nda-q5",
          prompt: "Why does a repeat client with an MSA usually start new projects faster?",
          options: [
            "Only the project-specific SOW needs agreeing, not the legal terms",
            "The MSA lets the agency skip estimation",
            "The MSA removes the need for change requests",
            "An MSA allows invoicing before any scope is agreed",
          ],
          correctIndex: 0,
          explanation: "The legal terms are already settled, so only scope, timeline and price must be agreed. Estimation and change control are still needed.",
        },
      ],
      practice: {
        kind: "categorize",
        prompt: "A new PM collected these client and team questions. Sort each one to the document that normally answers it.",
        mode: "generic",
        categories: [
          { id: "msa", label: "MSA" },
          { id: "sow", label: "SOW" },
          { id: "nda", label: "NDA" },
        ],
        items: [
          { id: "i1", text: "Can we share your architecture diagram with our investor before we sign anything?", explanation: "Before any deal, confidentiality is governed by the NDA." },
          { id: "i2", text: "Is the Arabic language version included in phase 1?", explanation: "Scope and exclusions for the phase are in the SOW." },
          { id: "i3", text: "How many days do we have to pay each invoice?", explanation: "Payment terms are a relationship-wide legal term in the MSA (a SOW can override, but the default lives in the MSA)." },
          { id: "i4", text: "If we end the relationship early, what notice do we have to give?", explanation: "Termination rules are in the MSA." },
          { id: "i5", text: "When is the UAT milestone and how much is billed then?", explanation: "Milestones and the billing schedule are project-specific: the SOW." },
          { id: "i6", text: "Who owns the source code once everything is paid?", explanation: "IP ownership is a legal term set in the MSA." },
          { id: "i7", text: "Which assumptions was the price based on?", explanation: "Assumptions sit with the scope and price in the SOW." },
          { id: "i8", text: "The prospect wants to show us their internal sales data during the demo call. Is it protected?", explanation: "Pre-contract information sharing is covered by the NDA." },
        ],
        answer: { i1: "nda", i2: "sow", i3: "msa", i4: "msa", i5: "sow", i6: "msa", i7: "sow", i8: "nda" },
      },
    },
    {
      id: "pmp-c01-estimate-quote-po",
      moduleId: "pmp-c01",
      trackId: "pm",
      title: "Estimate vs quote vs PO vs invoice",
      summary:
        "These four words follow the money in order. An [[term:estimate]] is a forecast. A [[term:quote]] is a commitment. A [[term:purchase-order]] is the client's permission to spend. An [[term:invoice]] is the request to be paid.\n\nWhy it matters at an agency: the words decide who carries the risk. Say \"quote\" when you mean \"estimate\" and the client hears a fixed price, so any overrun becomes your loss. Start work without a PO at a large client and the invoice may be rejected, which delays payment by a full cycle. PMs give numbers every week, for change requests, support work and new phases, so the word you attach to a number matters as much as the number.\n\nHow to do it: label every number. Ranges and \"based on what we know today\" belong to estimates. A single price, a validity period and written assumptions belong to quotes. Ask early whether the client needs a PO, and copy its number exactly onto the invoice.\n\nThe common mistake: replying to \"roughly how long?\" with a single figure in a chat. That figure becomes the price in the client's memory. Not legal advice: the signed contract always wins.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "GOV.UK: Invoices - what they must include", url: "https://www.gov.uk/invoicing-and-taking-payment-from-customers/invoices-what-they-must-include", kind: "docs", verifiedAt: "2026-10-02T12:05:27Z" },
        { label: "ProjectManager: Purchase order process explained", url: "https://www.projectmanager.com/blog/purchase-order-process-explained", kind: "article", verifiedAt: "2026-10-02T12:04:16Z" },
        { label: "Asana: Project estimation methods", url: "https://asana.com/resources/project-estimation", kind: "article", verifiedAt: "2026-10-02T11:58:20Z" },
      ],
      video: {
        title: "Quotation vs Estimate vs Invoice - What's the Difference?",
        channel: "Let's Go Digital",
        url: "https://www.youtube.com/watch?v=7BoY2-u4ao8",
        videoId: "7BoY2-u4ao8",
        verifiedAt: "2026-10-02T12:17:19Z",
      },
      alternateVideos: [
        {
          title: "What is a Purchase Order and How Does It Work?",
          channel: "The Bookkeeping Channel",
          url: "https://www.youtube.com/watch?v=2mDpe8RpcPA",
          videoId: "2mDpe8RpcPA",
          verifiedAt: "2026-10-02T12:17:19Z",
        },
      ],
      handbook: { stages: ["custom-estimation"], rules: ["cr-approval"], templates: ["cr-form"] },
      sections: [
        {
          heading: "Estimate vs quote: side by side",
          body:
            "**[[term:estimate]]**\n- Given early, often as a range (\"6 to 9 weeks\").\n- Can move as requirements become clearer, without a contract change.\n- Risk stays with the client: if it takes longer, the final cost may be higher, depending on the pricing model.\n\n**[[term:quote]]**\n- Given once scope is defined, as one price with a validity period.\n- Binding once accepted. Moving it needs a [[term:change-request]].\n- Risk moves to the agency: an overrun on quoted scope comes out of margin.\n\n**Consequence for time and billing:** an estimate that the client treats as a quote creates an argument at the first overrun. Converting an estimate into a quote is a deliberate step: confirm the scope, write the [[term:assumption|assumptions]], add the validity date, then send.",
        },
        {
          heading: "PO vs invoice: side by side",
          body:
            "**[[term:purchase-order]]**\n- Raised by the client, before the work or at the milestone, to authorise the spend.\n- Its number, amount and description must match what you bill.\n\n**[[term:invoice]]**\n- Raised by Oyelabs finance after the milestone or period, asking for payment under the [[term:payment-terms]].\n- Quotes the PO number when the client uses POs.\n\n**Consequence:** many larger clients reject an invoice without a valid PO number. A rejection usually costs a whole payment cycle. If a CR is approved by email but the client's finance team needs a PO, the CR work is not yet safely billable.",
        },
        {
          heading: "Where the PM fits in the money chain",
          body:
            "1. The PM supports the **estimate** with the tech lead (for a new phase or a CR).\n2. BD or the PM turns it into a **quote** or a priced CR on the CR form template (handbook card below), using the [[term:rate-card]].\n3. The client approves in writing and, where needed, issues a **PO**.\n4. The milestone or CR is delivered and accepted.\n5. Finance raises the **invoice** with the PO number; the PM confirms the milestone was signed off.\n\nFollow the Oyelabs rule in the handbook card below for who approves a CR before the price goes out.",
        },
        {
          heading: "How to say it to a client",
          body:
            "- \"This is an estimate, not a quote: today it looks like 40 to 60 hours. Once the designs are final, I will send a firm price.\"\n- \"Our quote is valid until the 30th and assumes you provide the payment gateway keys by the start of sprint 2.\"\n- \"Before we start the CR, could your finance team raise a PO for it? Otherwise our invoice may bounce.\"",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **A single number in chat.** Recover: follow up in writing: \"To confirm, that was a rough estimate. I will send a formal quote once we agree the details.\"\n- **No validity period on a quote.** Six months later the client accepts an outdated price. Recover: re-quote and explain what changed.\n- **PO amount lower than the approved CR.** Recover: ask the client to amend the PO before invoicing.\n- **Invoicing before sign-off.** Recover: hold the invoice until the [[term:sign-off]] exists, or the client will dispute it.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Every number I send says whether it is an estimate or a quote.\n2. Every quote has a validity date and written assumptions.\n3. I know whether this client needs a PO, and who raises it.\n4. Approved CRs have a PO (if needed) before work starts.\n5. Each invoice matches a signed-off milestone or approved CR.",
        },
      ],
      sop: [
        {
          title: "PO and invoice handoff to finance",
          prompt: "[Oyelabs SOP – admin to fill] How the PM tells finance a milestone or CR is ready to invoice, which details finance needs (PO number, sign-off link, amount), and who chases unpaid invoices.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c01-estimate-quote-po-q1",
          prompt: "On a call, the client asks how long a reporting module will take. Discovery has not started. What is the best answer?",
          options: [
            "A range labelled as an estimate, with what it depends on, and a promise of a firm price after discovery",
            "A single number of days so the client can plan",
            "A quote with a validity date",
            "Refuse to give any number until a PO is raised",
          ],
          correctIndex: 0,
          explanation: "With unclear scope, only an estimate is honest. A single figure or a quote turns uncertainty into a commitment the agency must absorb.",
        },
        {
          id: "pmp-c01-estimate-quote-po-q2",
          prompt: "A client accepted a quote for a CR. Halfway through, the team finds it needs 30% more effort, with no change in scope. What usually follows?",
          options: [
            "The agency absorbs the extra effort, because the quoted scope did not change",
            "The PM raises a new CR for the extra 30%",
            "The client pays the difference automatically",
            "The quote becomes an estimate again",
          ],
          correctIndex: 0,
          explanation: "A quote moves the risk of overrun to the agency. Only a change in scope or a broken written assumption justifies a new CR.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c01-estimate-quote-po-q3",
          prompt: "Which of these make a price a quote rather than an estimate? (Select all that apply.)",
          options: ["A single firm price", "A validity period", "Defined scope with written assumptions", "A range such as 40–60 hours"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "A quote is a firm price for defined scope, valid for a period. A range is the mark of an estimate.",
        },
        {
          id: "pmp-c01-estimate-quote-po-q4",
          prompt: "The client's finance team rejected an invoice for a delivered milestone. Which cause is most common at larger clients?",
          options: ["The invoice did not quote a valid PO number", "The invoice was sent by email", "The milestone was too small", "The invoice used the client's currency"],
          correctIndex: 0,
          explanation: "Many larger clients cannot pay without a matching PO number, and a rejection usually costs a full payment cycle.",
        },
        {
          id: "pmp-c01-estimate-quote-po-q5",
          prompt: "A client approved a CR by email. Their company always uses POs. When is it safest to start the work?",
          options: [
            "After the PO for the CR is issued, or after the client confirms in writing that none is needed",
            "Immediately, the email approval is enough",
            "After the invoice is paid",
            "After UAT of the CR",
          ],
          correctIndex: 0,
          explanation: "Without the PO, the CR may be approved by the project but not payable by finance. Starting earlier risks unpaid work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c01-estimate-quote-po-q6",
          prompt: "Eight months after sending a quote with no validity date, the client accepts it. Rates and the tech stack have changed. What is the lesson?",
          options: [
            "Quotes need a validity period so prices can be refreshed",
            "Quotes should never be written down",
            "Estimates are always better than quotes",
            "The client cannot accept a quote after 30 days by law",
          ],
          correctIndex: 0,
          explanation: "A validity period protects the agency when costs change. There is no general legal 30-day rule; the document sets it.",
        },
        {
          id: "pmp-c01-estimate-quote-po-q7",
          prompt: "Which document is raised by the client, not the agency?",
          options: ["Purchase order", "Invoice", "Quote", "Estimate"],
          correctIndex: 0,
          explanation: "The PO is the buyer's authorisation to spend. The other three come from the agency.",
        },
        {
          id: "pmp-c01-estimate-quote-po-q8",
          prompt: "A developer tells the client in Slack: \"That's about two days.\" What should the PM do?",
          options: [
            "Follow up in writing that it was a rough estimate and send a proper estimate or CR",
            "Ignore it, Slack messages are informal",
            "Treat two days as the quoted price",
            "Ask the developer to delete the message",
          ],
          correctIndex: 0,
          explanation: "Clients remember the number. Reframing it in writing as an estimate prevents it becoming a fixed promise.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "spot",
        prompt: "Fix the wrong term. A PM drafted this email to a client's operations head about a new reporting feature. Mark every line that uses a money term wrongly or creates billing risk.",
        segments: [
          { id: "s1", text: "Subject: Reporting module: our quote", issue: "The body gives a range based on unclear scope, so it is an estimate, not a quote. The subject sets the wrong expectation." },
          { id: "s2", text: "Hi Sara, thanks for the call today about the monthly reports.", issue: null },
          { id: "s3", text: "Based on what we know now, the module would take roughly 60 to 90 hours.", issue: null },
          { id: "s4", text: "This price is fixed and will not change.", issue: "A range on unclear scope cannot be a fixed price. Calling it fixed moves the overrun risk to Oyelabs." },
          { id: "s5", text: "It assumes your team provides sample report data by the 12th.", issue: null },
          { id: "s6", text: "Once the report designs are approved, we will send a firm quote valid for 30 days.", issue: null },
          { id: "s7", text: "To save time, we will start building now and send the invoice later.", issue: "Starting before written approval and a PO risks unpaid work, and an invoice needs an approved, delivered item." },
          { id: "s8", text: "Please let me know if your finance team needs a PO number for this.", issue: null },
          { id: "s9", text: "Best regards, Arjun", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pmp-c01-pricing-models",
      moduleId: "pmp-c01",
      trackId: "pm",
      title: "Fixed bid vs T&M vs retainer vs dedicated team",
      summary:
        "The pricing model is the first thing to check on any project, because it changes what every other word means. On a [[term:fixed-bid]] project, a [[term:change-request]] protects margin. On [[term:time-and-materials]], the same request is mostly a re-prioritisation. On a [[term:retainer]], it uses up included hours. In a [[term:dedicated-resource-model]], the client simply directs the team to it.\n\nWhy it matters at an agency: the PM's daily decisions differ by model. Fixed bid needs tight scope control and [[term:milestone-billing]]. T&M needs regular budget-burn reports, because the client carries cost risk and will ask why hours went up. Retainers need tracking of hours used against hours included. Dedicated teams need leave, utilisation and replacement planning.\n\nHow to do it: read the SOW on day one and write the model at the top of your project notes. Then adjust how you answer \"can you also add...\": on fixed bid, \"let me raise a CR\"; on T&M, \"yes, here is what it moves\"; on a retainer, \"it fits in this month's hours\" or \"it goes over, at the rate-card rate\".\n\nThe common mistake: running a T&M project like a fixed-bid one, or the reverse. Not legal advice: the signed contract always wins.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Acquisition.gov: FAR Part 16 - Types of Contracts", url: "https://www.acquisition.gov/far/part-16", kind: "spec", verifiedAt: "2026-10-02T11:51:30Z" },
        { label: "ProjectManager: Fixed price contract - what you need to know", url: "https://www.projectmanager.com/blog/fixed-price-contract", kind: "article", verifiedAt: "2026-10-02T12:04:12Z" },
        { label: "ProjectManager: Time and materials contract (T&M) - when to use one", url: "https://www.projectmanager.com/blog/time-and-materials-contract", kind: "article", verifiedAt: "2026-10-02T12:04:14Z" },
        { label: "Investopedia: Retainer fee - definition and how it works", url: "https://www.investopedia.com/terms/r/retainer-fee.asp", kind: "article", verifiedAt: "2026-10-02T11:52:05Z" },
      ],
      video: {
        title: "Fixed Fee vs Time & Materials Contracts: Comparison",
        channel: "Brainhub",
        url: "https://www.youtube.com/watch?v=WrUYVqs2-BY",
        videoId: "WrUYVqs2-BY",
        verifiedAt: "2026-10-02T12:16:56Z",
      },
      alternateVideos: [
        {
          title: "Types of Services Contracts",
          channel: "Drupalize.Me",
          url: "https://www.youtube.com/watch?v=gOL2p9UuN10",
          videoId: "gOL2p9UuN10",
          verifiedAt: "2026-10-02T12:17:20Z",
        },
      ],
      handbook: { stages: ["custom-estimation"], rules: ["billing-change-request", "cr-when-needed"] },
      sections: [
        {
          heading: "Fixed bid vs T&M: side by side",
          body:
            "**[[term:fixed-bid]]**\n- Agreed scope, agreed price. The agency carries overrun risk.\n- Every change goes through a [[term:change-request]]; [[term:scope-creep]] eats margin directly.\n- Billing follows [[term:milestone|milestones]], so a slipped milestone delays cash.\n\n**[[term:time-and-materials]]**\n- Client pays for hours actually worked at [[term:rate-card]] rates. The client carries cost risk.\n- Changes are cheaper to absorb, but the client must see the effect on budget.\n- Billing follows timesheets, typically monthly; a cap may apply.\n\n**Consequence for time and billing:** on fixed bid, an unlogged \"small tweak\" is free work. On T&M, it is billable but still has to be visible, or the client disputes the hours.",
        },
        {
          heading: "Retainer vs dedicated team: side by side",
          body:
            "**[[term:retainer]]**\n- A recurring fee for a set amount of capacity or a set service, such as 40 hours a month.\n- The agency decides who does the work.\n- Hours beyond the included amount are typically billed at rate-card rates; unused hours may or may not roll over.\n\n**[[term:dedicated-resource-model]]**\n- A monthly fee per named person, who works mostly on this client.\n- The client directs priorities day to day; no CR is needed to change what the team works on.\n- Leave, notice and replacement matter for billing.\n\n**Consequence:** in a retainer the PM tracks hours used; in a dedicated team the PM tracks people, availability and utilisation.",
        },
        {
          heading: "The same request under four models",
          body:
            "The client asks: \"Can we add a CSV export to the orders screen?\"\n\n- **Fixed bid:** not in the SOW, so raise a CR with effort, cost and date impact. No work before approval.\n- **T&M:** estimate it, show what it delays in the backlog, get a written OK on priority, then build.\n- **Retainer:** check this month's remaining hours. If it fits, schedule it. If not, say what goes over and at what rate.\n- **Dedicated team:** the client can simply put it at the top of the team's backlog. Make the trade-off visible: something else moves down.",
        },
        {
          heading: "How to say it to a client",
          body:
            "- Fixed bid: \"That is outside the agreed scope, so I will send a CR with the cost and the effect on the go-live date.\"\n- T&M: \"Happy to add it. It is about 16 hours, so the dashboard moves to next sprint. Shall I go ahead?\"\n- Retainer: \"You have 12 hours left this month. This needs about 20, so 8 would be billed at the agreed rate, or we can split it across two months.\"",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **No budget-burn report on T&M.** The client is surprised by the invoice. Recover: start a weekly hours-vs-budget line in the status report.\n- **Doing unlogged favours on fixed bid.** Recover: log each one, and use them as goodwill in the next CR discussion rather than silently absorbing more.\n- **Letting retainer hours roll over without a written rule.** Recover: check the SOW and agree the rule in writing.\n- **Raising formal CRs for every backlog change in a dedicated team.** It slows the client down for no commercial reason.",
        },
        {
          heading: "Your checklist",
          body:
            "1. I know the pricing model and have written it in my project notes.\n2. On fixed bid: every new ask is logged and assessed for a CR.\n3. On T&M: the client sees hours used vs budget at least weekly.\n4. On a retainer: I track included vs used hours and the overage rate.\n5. On a dedicated team: leave and replacements are planned and communicated.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c01-pricing-models-q1",
          prompt: "On which model does the agency carry the risk of an overrun on agreed scope?",
          options: ["Fixed bid", "Time and materials", "Dedicated team", "Retainer billed on hours used"],
          correctIndex: 0,
          explanation: "On fixed bid the price does not move with effort, so overruns come out of the agency's margin.",
        },
        {
          id: "pmp-c01-pricing-models-q2",
          prompt: "A T&M client asks for a new filter. What is the most appropriate response?",
          options: [
            "Estimate it, show what it pushes back, and get a written OK on priority",
            "Refuse until a formal fixed-price CR is signed",
            "Build it silently, the hours are billable anyway",
            "Tell the client T&M projects cannot change scope",
          ],
          correctIndex: 0,
          explanation: "T&M absorbs change easily, but the client carries the cost, so the impact on budget and order must be visible.",
        },
        {
          id: "pmp-c01-pricing-models-q3",
          prompt: "On a fixed-bid project, the team built three small \"quick wins\" for the client without logging them. What did this cause? (Select all that apply.)",
          options: ["Unbilled effort reducing margin", "Scope creep", "A stronger position in the next CR negotiation", "A shorter warranty"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "Unlogged additions are scope creep and free work. Because they were never recorded, they also give no leverage later.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c01-pricing-models-q4",
          prompt: "A client on a dedicated-team model wants the team to switch from the admin panel to a new marketing page this week. What do you need?",
          options: [
            "A clear priority decision from the client, with the delay to the admin panel made visible",
            "A formal change request priced at rate-card rates",
            "A new SOW",
            "Nothing, and no need to tell anyone",
          ],
          correctIndex: 0,
          explanation: "In a dedicated team the client directs priorities and pays per person, so no CR is needed, but the trade-off should still be recorded.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c01-pricing-models-q5",
          prompt: "A retainer includes 40 hours a month. On the 20th, 38 hours are used and the client asks for a 10-hour task. What is the best reply?",
          options: [
            "Explain that 8 hours would go over at the agreed rate, or offer to schedule it next month",
            "Do it and absorb the overage",
            "Refuse; retainers cannot go over",
            "Borrow 8 hours from next month without telling the client",
          ],
          correctIndex: 0,
          explanation: "Overage is typically billed at rate-card rates. Giving the client the choice keeps billing transparent.",
        },
        {
          id: "pmp-c01-pricing-models-q6",
          prompt: "Which model is usually billed by milestone?",
          options: ["Fixed bid", "Time and materials", "Dedicated team", "Retainer"],
          correctIndex: 0,
          explanation: "Fixed-bid projects are typically paid by milestone. The others usually bill monthly.",
        },
        {
          id: "pmp-c01-pricing-models-q7",
          prompt: "A T&M client complains the monthly invoice is 40% higher than expected. What was most likely missing?",
          options: ["Regular budget-burn reporting", "A change request for every task", "A milestone schedule", "An NDA"],
          correctIndex: 0,
          explanation: "On T&M the client carries cost risk, so they need to see hours against budget during the month, not after.",
        },
        {
          id: "pmp-c01-pricing-models-q8",
          prompt: "Which statements are true about a retainer? (Select all that apply.)",
          options: [
            "It is a recurring fee for reserved capacity or service",
            "Whether unused hours roll over depends on the agreement",
            "The client names the individual developers and manages them daily",
            "It removes the need to track hours",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation: "A retainer reserves capacity; rollover is whatever the agreement says. Naming and directing people is the dedicated-team model, and hours still need tracking.",
        },
      ],
      practice: {
        kind: "categorize",
        prompt: "Each line describes how a project is run or billed. Sort it to the pricing model it describes.",
        mode: "generic",
        categories: [
          { id: "fixed", label: "Fixed bid" },
          { id: "tm", label: "Time and materials" },
          { id: "retainer", label: "Retainer" },
          { id: "dedicated", label: "Dedicated team" },
        ],
        items: [
          { id: "i1", text: "The second instalment is invoiced when the client signs off the designs.", explanation: "Milestone-based billing for a fixed price is the fixed-bid pattern." },
          { id: "i2", text: "The client pays a monthly fee for two named developers and sets their priorities in a daily call.", explanation: "Named people, directed by the client: dedicated team." },
          { id: "i3", text: "Each month, approved timesheets are multiplied by the rate card and invoiced.", explanation: "Paying for actual hours at agreed rates is T&M." },
          { id: "i4", text: "The client pays every month for up to 30 hours of support and small changes; extra hours are billed at the rate card.", explanation: "Reserved monthly capacity with overage: retainer." },
          { id: "i5", text: "The PM raises a CR because the client wants a second payment gateway that the SOW did not include.", explanation: "Formal change control to protect a fixed price is the fixed-bid pattern." },
          { id: "i6", text: "The weekly status report shows hours burned against the client's budget cap.", explanation: "Budget-burn tracking is essential on T&M, where the client carries cost risk." },
          { id: "i7", text: "A developer resigns, and the agency must provide a replacement within the notice period.", explanation: "Replacement obligations are part of the dedicated-team model." },
          { id: "i8", text: "The team overran by 25% on agreed scope, and the agency absorbed the cost.", explanation: "Absorbing overrun on agreed scope happens on fixed bid." },
        ],
        answer: { i1: "fixed", i2: "dedicated", i3: "tm", i4: "retainer", i5: "fixed", i6: "tm", i7: "dedicated", i8: "fixed" },
      },
    },
    {
      id: "pmp-c01-ip-licence-handover",
      moduleId: "pmp-c01",
      trackId: "pm",
      title: "IP ownership vs licence vs source-code handover",
      summary:
        "Three different answers to \"is this ours?\" [[term:ip-ownership]] is who legally owns what was created. A [[term:licence]] is permission to use something you do not own. [[term:source-code-handover]] is the practical act of giving the client everything needed to run and change the system. On top of these sit [[term:third-party-licences]] (libraries, fonts, APIs that nobody on the project owns) and [[term:escrow]] (code held by a third party for a client who only has a licence).\n\nWhy it matters at an agency: custom and white-label clients get very different answers. A custom client often receives ownership of the bespoke code on full payment, while the agency keeps its pre-existing tools. A white-label client usually gets a licence to the [[term:core-product]], not ownership, so a request to \"send us the full source\" may not be something the PM can agree to. Getting this wrong at closure blocks handover, delays final payment or gives away product code.\n\nHow to do it: before closure, read the IP and licence clauses with BD. List what is bespoke, what is pre-existing Oyelabs code, and what is third-party. Tie the handover to the payment and sign-off the contract names.\n\nThe common mistake: treating a repository invite as the IP transfer, or promising source code that the contract only licenses. Not legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 45,
      isMilestone: true,
      webRefs: [
        { label: "GOV.UK: Intellectual property and your work", url: "https://www.gov.uk/intellectual-property-an-overview", kind: "docs", verifiedAt: "2026-10-02T11:51:29Z" },
        { label: "U.S. Copyright Office: Circular 30, Works Made for Hire (PDF)", url: "https://www.copyright.gov/circs/circ30.pdf", kind: "spec", verifiedAt: "2026-10-02T11:51:31Z" },
        { label: "choosealicense.com (GitHub): Choose an open source license", url: "https://choosealicense.com/", kind: "docs", verifiedAt: "2026-10-02T11:54:58Z" },
      ],
      video: {
        title: "What Every Software Developer Should Know About Intellectual Property Law by Ido Tuchman",
        channel: "Full Stack Talks",
        url: "https://www.youtube.com/watch?v=xMJPSKnY1UI",
        videoId: "xMJPSKnY1UI",
        verifiedAt: "2026-10-02T12:17:20Z",
      },
      alternateVideos: [
        {
          title: "Typical Intellectual Property Mistakes in Software and Cloud Contracts | LinkedIn Live, Sept 16 2021",
          channel: "Tech Contracts Academy",
          url: "https://www.youtube.com/watch?v=Hql5EYaUqLk",
          videoId: "Hql5EYaUqLk",
          verifiedAt: "2026-10-02T12:17:20Z",
        },
      ],
      handbook: { stages: ["custom-handover"], rules: ["secure-credential-sharing"], templates: ["handover-kt-checklist"] },
      sections: [
        {
          heading: "IP ownership vs licence: side by side",
          body:
            "**[[term:ip-ownership]]**\n- The client (usually, for bespoke custom work, once paid in full) may modify, resell or hand the code to another vendor.\n- Pre-existing Oyelabs code, tools and libraries are usually excluded and licensed instead.\n\n**[[term:licence]]**\n- The client may use the software on stated terms, for example one brand, one region, while fees are paid.\n- Typical for white-label: the [[term:core-product]] stays Oyelabs', the [[term:client-instance]] is licensed.\n\n**Consequence for time and billing:** ownership is a one-off transfer tied to final payment. A licence is an ongoing relationship: fees, renewals and limits on use. A client who thinks they own a licensed product will expect free source code and freedom to move vendors, which the contract may not give.",
        },
        {
          heading: "Ownership vs handover: side by side",
          body:
            "**[[term:ip-ownership]]** is a legal position written in the contract.\n\n**[[term:source-code-handover]]** is a practical delivery: repositories, build scripts, environment details, credentials (shared securely) and [[term:knowledge-transfer]].\n\n**Consequence:** owning the code without a good handover still leaves the client unable to run it, which typically turns into unbilled support requests. A handover done before final payment, where the contract ties them together, gives away the agency's leverage. Follow the Oyelabs rule in the handbook card below on sharing credentials.",
        },
        {
          heading: "Third-party licences vs escrow: side by side",
          body:
            "**[[term:third-party-licences]]**\n- Libraries, plugins, fonts, map and SMS APIs used in the build. Nobody on the project owns them; everyone must follow their terms.\n- Paid ones have their own costs and renewals, usually the client's.\n\n**[[term:escrow]]**\n- Code deposited with an independent party, released to a licensed client only on agreed events, such as the supplier stopping support.\n\n**Consequence:** missing a paid third-party licence at handover can break a live feature when a trial expires. Escrow costs money and needs refreshing after major releases; it is the answer to \"what if you go out of business?\" for a client who only has a licence.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A custom Laravel and React booking platform for a UK clinic chain.** The SOW says the client owns the bespoke code on final payment; Oyelabs keeps its internal admin starter kit, licensed to the client for use in this platform.\n\nAt closure the PM:\n\n1. Lists three groups with the tech lead: bespoke code (client-owned), the starter kit (licensed), third-party items (a paid calendar component, a maps API, open-source packages under MIT and similar licences).\n2. Confirms with finance that the final milestone invoice is paid.\n3. Runs the handover with the handover and KT checklist template: repository transfer, build and deploy guide, environment list, credentials through the approved secure method, and two KT sessions.\n4. Sends the client a written note of which third-party licences they must renew and when.\n5. Gets [[term:sign-off]] on the handover.\n\nResult: the client can run the platform with another vendor if they choose, nothing licensed was given away, and no renewal surprise breaks the calendar next year.",
        },
        {
          heading: "How to say it to a client",
          body:
            "- \"Once the final invoice is settled, the repositories transfer to your organisation, as the contract describes.\"\n- \"The white-label app is licensed, so you get your own branded instance and data, and we keep maintaining the shared product underneath.\"\n- \"The calendar component is a paid third-party licence in your name. It renews in March; I have added it to the handover note.\"",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Promising \"full source code\" to a white-label client.** Recover: correct it quickly in writing, with BD, and explain what the licence does include.\n- **Third-party licences bought on an Oyelabs account.** Recover: plan the transfer to the client before closure, or agree in writing who pays.\n- **Handover without KT.** Recover: schedule KT sessions and record them; otherwise expect months of informal support.\n- **Credentials sent by email or chat.** Recover: rotate them and reshare through the approved method.",
        },
        {
          heading: "Your checklist",
          body:
            "1. I read the IP and licence clauses with BD before closure.\n2. Bespoke, pre-existing and third-party items are listed separately.\n3. Handover timing matches the payment condition in the contract.\n4. Third-party licences have an owner and renewal date in writing.\n5. Credentials were shared through the approved method, and the client signed off the handover.",
        },
      ],
      sop: [
        {
          title: "IP and handover approval",
          prompt: "[Oyelabs SOP – admin to fill] Who at Oyelabs approves a source-code or repository transfer, what must be confirmed first (final payment, signed contract clause), and how Oyelabs' own reusable code is marked as excluded.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c01-ip-licence-handover-q1",
          prompt: "A white-label client asks for \"the full source code, since we paid for the app\". The contract grants a licence to the product. What is the right position?",
          options: [
            "They have a licence to use their instance, not ownership of the core product, so full source is not included unless the contract says so",
            "They paid, so they own everything and get full source",
            "Send the source code, but only the mobile apps",
            "Offer escrow as a free alternative immediately",
          ],
          correctIndex: 0,
          explanation: "Licensed white-label clients use the product; the core stays the agency's. Escrow is a separate, usually paid, arrangement to discuss with BD.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c01-ip-licence-handover-q2",
          prompt: "The contract says IP transfers on final payment. The final invoice is unpaid, and the client asks for the repositories \"to start the next phase with another vendor\". What do you do?",
          options: [
            "Escalate to BD and finance; the handover is tied to final payment",
            "Transfer the repositories to keep the client happy",
            "Delete the repositories",
            "Transfer only the database",
          ],
          correctIndex: 0,
          explanation: "Handing over before the payment condition gives away the agency's only leverage, so it is a commercial decision, not the PM's alone.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c01-ip-licence-handover-q3",
          prompt: "Which items normally belong in a good source-code handover? (Select all that apply.)",
          options: ["Repositories and build scripts", "Environment and deployment documentation", "Credentials shared through a secure method", "Oyelabs' internal timesheets for the project"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "A handover lets another team build, deploy and run the system. Internal timesheets are not part of it.",
        },
        {
          id: "pmp-c01-ip-licence-handover-q4",
          prompt: "What problem does source-code escrow solve?",
          options: [
            "It protects a licensed client if the supplier stops supporting the software",
            "It transfers ownership of the code on signature",
            "It replaces the warranty",
            "It removes third-party licence costs",
          ],
          correctIndex: 0,
          explanation: "Escrow releases code on agreed events such as the supplier failing. It does not transfer ownership up front.",
        },
        {
          id: "pmp-c01-ip-licence-handover-q5",
          prompt: "A year after go-live, the maps on a client's app stop working. The maps API key was on a trial attached to a developer's personal account. Which term was mishandled?",
          options: ["Third-party licences", "IP ownership", "Escrow", "Warranty"],
          correctIndex: 0,
          explanation: "Paid third-party services need an owner, normally the client, and a renewal plan at handover.",
        },
        {
          id: "pmp-c01-ip-licence-handover-q6",
          prompt: "Why do agencies usually exclude their pre-existing tools and libraries from an IP transfer?",
          options: [
            "Because they are reused across clients; the client gets a licence to use them in its system",
            "Because pre-existing code cannot legally be owned",
            "Because clients never need them",
            "Because they are open source",
          ],
          correctIndex: 0,
          explanation: "Transferring reusable assets would stop the agency using them for others, so they are licensed instead.",
        },
        {
          id: "pmp-c01-ip-licence-handover-q7",
          prompt: "The client owns the code, but the handover had no documentation or KT. What is the usual consequence?",
          options: [
            "Many informal support requests, often unbilled",
            "Ownership reverts to the agency",
            "The warranty doubles",
            "Nothing, ownership is all that matters",
          ],
          correctIndex: 0,
          explanation: "Owning code you cannot run creates repeated questions. A complete handover reduces later unbilled support.",
        },
        {
          id: "pmp-c01-ip-licence-handover-q8",
          prompt: "Which statements correctly separate the three terms? (Select all that apply.)",
          options: [
            "IP ownership is a legal position set by the contract",
            "A licence is permission to use something on stated terms",
            "Source-code handover is the practical transfer of what is needed to run the system",
            "Inviting the client to a repository transfers IP ownership",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "A repository invite is access, not a legal transfer. Ownership comes from the contract.",
        },
      ],
      practice: {
        kind: "spot",
        prompt: "Fix the wrong term. A PM wrote this closure email for a white-label food-delivery client whose contract grants a licence to the product. Mark the lines that misuse IP, licence or handover terms, or create risk.",
        segments: [
          { id: "s1", text: "Subject: Project closure and handover", issue: null },
          { id: "s2", text: "Hi Omar, thank you for a smooth launch in Muscat.", issue: null },
          { id: "s3", text: "As the owner of the product, you will now receive the full core source code.", issue: "The client licenses the white-label product; the core stays Oyelabs'. Promising full core source contradicts the licence." },
          { id: "s4", text: "Your branded apps, data and store listings remain under your accounts.", issue: null },
          { id: "s5", text: "Your admin password and server keys are pasted below for convenience.", issue: "Credentials in an email breach secure-sharing practice. Use the approved secure method and rotate anything exposed." },
          { id: "s6", text: "The SMS provider account is in your company's name and renews in April.", issue: null },
          { id: "s7", text: "Because the licence is permanent, there are no further fees.", issue: "White-label licences are usually tied to ongoing fees or a subscription; the contract decides, not the PM's summary." },
          { id: "s8", text: "We will continue to maintain the shared product and release updates.", issue: null },
          { id: "s9", text: "Please sign the attached handover confirmation.", issue: null },
          { id: "s10", text: "Best regards, Neha", issue: null },
        ],
        askExplanation: true,
      },
    },
  ],
} satisfies Module;
