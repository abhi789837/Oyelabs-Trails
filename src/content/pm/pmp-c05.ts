import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-c05",
  trackId: "pm",
  name: "Terminology: Warranty, support & maintenance",
  description:
    "The four after-launch words clients and PMs mix up most: warranty, support, maintenance and AMC. How to tell them apart on a real request, what each one costs whom, and how to say it to a client without a fight.",
  topics: [
    {
      id: "pmp-c05-warranty-support-amc",
      moduleId: "pmp-c05",
      trackId: "pm",
      title: "Warranty vs support vs maintenance vs AMC",
      summary:
        "After go-live, four words decide who pays for the next piece of work: [[term:warranty]], [[term:support]], [[term:maintenance]] and the [[term:amc|AMC]]. Clients use them as if they meant the same thing. They do not, and a PM who mixes them up gives away free work or starts an argument that did not need to happen.\n\nWhy it matters at an agency. Most post-launch disputes are not about code. They are about which bucket a request falls into. \"You're in warranty, so fix it free\" is only true when the request is a real [[term:bug]] against the signed scope. A new OS version, a third-party outage or a nice idea from the client's CEO are not warranty work, even on day three after launch.\n\nHow to do it. Ask two questions on every post-launch request. First: does the delivered product fail to do what was signed and accepted? Second: which contract is active today: the warranty window, an AMC or [[term:retainer]], or nothing? The first answer decides whether it is a defect at all. The second decides who pays. Then use the right word in your reply, every time.\n\nThe common mistake is promising \"support\" in the warranty email, or calling the AMC \"extended warranty\". Both set an expectation that the contract does not back. Follow the Oyelabs rules in the handbook cards below for what warranty covers and how out-of-warranty bugs are billed.\n\nNot legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 45,
      isMilestone: true,
      webRefs: [
        { label: "ISO/IEC/IEEE 14764:2022 - Software maintenance (standard page)", url: "https://www.iso.org/standard/80710.html", kind: "spec", verifiedAt: "2026-10-02T11:55:40Z" },
        { label: "Cornell LII Wex: warranty", url: "https://www.law.cornell.edu/wex/warranty", kind: "article", verifiedAt: "2026-10-02T11:51:33Z" },
        { label: "Atlassian: What is an SLA? Service level agreements explained", url: "https://www.atlassian.com/itsm/service-request-management/slas", kind: "article", verifiedAt: "2026-10-02T11:53:42Z" },
        { label: "Investopedia: Retainer fee - definition and how it works", url: "https://www.investopedia.com/terms/r/retainer-fee.asp", kind: "article", verifiedAt: "2026-10-02T11:52:05Z" },
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
          title: "Warranties, Indemnities and Liability in IT Contracts: (3) Warranty Clauses in IT Contracts",
          channel: "Kemp IT Law",
          url: "https://www.youtube.com/watch?v=Jd0muYzi6yY",
          videoId: "Jd0muYzi6yY",
          verifiedAt: "2026-10-02T12:17:14Z",
        },
        {
          title: "Key Issues In Software Maintenance Agreements (312) 263-0570",
          channel: "Marcus Harris Software & Tech Attorney",
          url: "https://www.youtube.com/watch?v=AKpMZ6XRW-0",
          videoId: "AKpMZ6XRW-0",
          verifiedAt: "2026-10-02T12:17:33Z",
        },
      ],
      handbook: {
        stages: ["custom-hypercare", "custom-support"],
        rules: ["warranty-coverage", "billing-bug-warranty", "billing-bug-after-warranty"],
        templates: ["hypercare-log"],
      },
      interactive: {
        kind: "decision-tool",
        request: "Our app went live five weeks ago. Since the new iOS update came out, the booking screen cuts off the time slots. You're still in warranty, right?",
      },
      sections: [
        {
          heading: "Side by side: four words, four different questions",
          body:
            "Do not memorise four definitions. Learn the one question each word answers. Hover the term links for the handbook meaning.\n\n- **[[term:warranty|Warranty]]** answers: *did we deliver what we signed?* It is a promise about the past work, limited in time. Its test is the signed scope and [[term:acceptance-criteria]].\n- **[[term:support|Support]]** answers: *someone has a problem today; who looks at it, and how fast?* It is a service, driven by tickets, measured by [[term:response-time]] and [[term:resolution-time]] in an [[term:sla|SLA]].\n- **[[term:maintenance|Maintenance]]** answers: *what keeps the software healthy over the next year?* It is planned work: OS and framework updates, security patches, dependency upgrades. ISO/IEC/IEEE 14764 sorts it into corrective, adaptive, perfective and preventive work.\n- **[[term:amc|AMC]]** answers: *what contract pays for support and maintenance after the warranty?* It is a commercial wrapper, not a type of work. An AMC usually bundles support and maintenance with a cap.\n\nSo warranty and AMC are **contracts**. Support and maintenance are **kinds of work**. A single request can be support work paid for by the warranty (a real defect in week two) or support work paid for by the AMC (the same defect in month eight).",
        },
        {
          heading: "Where hypercare fits",
          body:
            "[[term:hypercare|Hypercare]] is the most-confused fifth word. It is about **intensity**, not about who pays. Hypercare is the first weeks after [[term:go-live]] when the delivery team watches closely and responds faster. It usually runs inside the warranty window, but it is shorter.\n\nThe useful way to say it to a client: \"For the first weeks after launch the team that built your app is on hand and watching (that's hypercare). For the full warranty window, defects against what we agreed are fixed at no cost (that's warranty). After that, an AMC keeps the app updated and supported.\"\n\nThe dates matter. The SOW defines when the warranty starts (go-live or acceptance) and how long it lasts. Do not quote a typical number to a client. Quote the contract.",
        },
        {
          heading: "The two-question test on a real request",
          body:
            "1. **Is it a defect?** Does the live product fail to do what was signed and accepted? If no, it is not a warranty matter, whatever the date. It is a [[term:clarification]], an [[term:enhancement]], a [[term:change-request]] or a [[term:new-feature]]. Use the decision tool on this page.\n2. **Which contract is active?** Inside the warranty window, a defect is fixed free. After it, the defect is support work: covered by an active AMC or retainer, otherwise quoted.\n\nThree requests that look like warranty but usually are not:\n\n- **A new OS or browser version broke a screen.** The software met the spec on the versions agreed. Adapting to a new version is maintenance (adaptive). It is typically excluded from warranty: check the exclusions in the rule card below.\n- **A third-party service is down** (the SMS provider, the payment gateway). The fault is not in the delivered work. Support can help diagnose it. The fix is the provider's.\n- **The client's own team changed something** on the server or in the code. Warranty typically ends for that part.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "*A Laravel and React booking platform for a UK physiotherapy clinic chain. Live for six weeks. The SOW gives a warranty window from go-live; the client has signed an AMC that starts when it ends.*\n\nIn one week the clinic's operations lead sends four messages. The PM sorts them before replying.\n\n- \"Patients who cancel still get the reminder email.\" The signed acceptance criteria say cancelled bookings get no reminders. A defect, inside the window: **warranty**. Logged in the [[term:hypercare]] log with [[term:severity]] and fixed at no cost.\n- \"Since iOS updated, the time-slot picker is cut off.\" The app met the spec on the agreed iOS versions. This is adaptive **maintenance**. The AMC has not started, so the PM quotes it as a small piece of work and offers to bring the AMC start forward.\n- \"Can the calendar show the therapist's photo?\" Works as agreed today: an [[term:enhancement]]. Estimated and offered as a [[term:change-request]].\n- \"How do I give a receptionist access to only one clinic?\" The role exists already: a [[term:clarification]], answered with a two-line guide and added to the FAQ.\n\nThe reply uses each word exactly once, in the right place, and gives a next step for each item. There is no argument because every label is backed by a document the client signed.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **\"You have three months of free support.\"** Warranty is not support for anything. Recover: send a short note that restates what the warranty covers, in the contract's words, and what the AMC covers after it.\n- **Calling the AMC \"extended warranty\".** It makes the client expect free [[term:new-feature|new features]]. Recover: name it as a maintenance and support plan, list what it includes and its cap.\n- **Fixing an OS-update problem free \"to be nice\" without saying so.** The next one will be expected free too. Recover: if you do it as goodwill, say so in writing, once.\n- **Arguing the date, not the defect.** \"You're out of warranty\" starts a fight. \"This works as we agreed; here's the acceptance criterion\" ends one. Lead with the evidence, then the contract.\n- **No AMC proposed before warranty ends.** The client discovers the gap with the first post-warranty bug. Recover: raise the AMC at least a month before the window closes and record it in the status report.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "- I know the warranty start point and end date for each live project, from the SOW.\n- I know whether an AMC, retainer or support plan is active, and its cap.\n- On every post-launch request I ask: defect against the signed scope or not, then which contract is active.\n- My replies use warranty, support, maintenance and AMC in their exact meaning.\n- OS, browser and third-party changes are treated as maintenance or support, not warranty, unless the contract says otherwise.\n- The AMC conversation starts well before the warranty ends.",
        },
      ],
      sop: [
        {
          title: "Oyelabs support and AMC plans",
          prompt: "[Oyelabs SOP – admin to fill] The support and AMC plans Oyelabs offers (what each includes, caps on hours or tickets, response targets per severity, support hours and time zone), and the standard wording PMs use to offer an AMC before the warranty ends.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c05-warranty-support-amc-q1",
          prompt: "Which pair are contracts (who pays), rather than kinds of work?",
          options: ["Warranty and AMC", "Support and maintenance", "Warranty and support", "Maintenance and AMC"],
          correctIndex: 0,
          explanation: "Warranty and AMC are commercial arrangements. Support and maintenance are kinds of work that either of them can pay for.",
        },
        {
          id: "pmp-c05-warranty-support-amc-q2",
          prompt: "Four weeks after go-live, inside the warranty window, the client writes: \"The new iOS version cuts off the booking screen. Fix it free, we're in warranty.\" The app met the spec on the agreed iOS versions. What is it?",
          options: [
            "Adaptive maintenance, typically excluded from warranty; quote it or cover it under a plan",
            "A warranty bug, because it is inside the window",
            "A clarification",
            "A change request to the signed scope",
          ],
          correctIndex: 0,
          explanation: "The window is not the test; the defect is. The product met the spec on the agreed versions. Adapting to a new OS version is maintenance, which warranty typically excludes. Check the exclusions in the rule card.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c05-warranty-support-amc-q3",
          prompt: "Eight months after launch, the warranty has ended and an AMC is active. A form that was in the signed scope stops saving. How is it handled?",
          options: [
            "As support work under the AMC, within its response and resolution targets",
            "As a free warranty fix, because it is a bug",
            "As a change request",
            "It is not Oyelabs' problem after warranty",
          ],
          correctIndex: 0,
          explanation: "It is a defect, but the warranty window has closed. The AMC is the active contract, so it is support work under the plan.",
        },
        {
          id: "pmp-c05-warranty-support-amc-q4",
          prompt: "Which of these does a warranty typically NOT cover? (Select all that apply.)",
          options: [
            "A new feature the client thought of after launch",
            "An outage at the client's SMS provider",
            "A screen that fails an agreed acceptance criterion, reported inside the window",
            "A break caused by the client's own developer editing the code",
            "Adapting the app to an OS version released after go-live",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3, 4],
          explanation: "Warranty covers defects against the accepted scope, reported in the window. New features, third-party outages, changes by others and new OS versions are the typical exclusions.",
        },
        {
          id: "pmp-c05-warranty-support-amc-q5",
          prompt: "How does hypercare relate to warranty?",
          options: [
            "Hypercare is about intensity of attention right after go-live; warranty is about who pays for defects. Hypercare usually sits inside the warranty window",
            "They are the same thing",
            "Hypercare starts when warranty ends",
            "Hypercare is the paid version of warranty",
          ],
          correctIndex: 0,
          explanation: "Hypercare is a short, high-attention period. Warranty is a longer commercial promise. They overlap; they are not interchangeable.",
        },
        {
          id: "pmp-c05-warranty-support-amc-q6",
          prompt: "A PM's go-live email says: \"You now have 90 days of free support.\" What is wrong with it?",
          options: [
            "It promises support for anything, while the warranty only covers defects against the signed scope; and the window should come from the SOW",
            "Nothing; support and warranty mean the same",
            "It should say 30 days",
            "It should not mention dates at all",
          ],
          correctIndex: 0,
          explanation: "\"Free support\" invites every question and wish to be treated as free. Name the warranty, its real coverage and the SOW's window.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c05-warranty-support-amc-q7",
          prompt: "Which of these are maintenance work rather than support work? (Select all that apply.)",
          options: [
            "Upgrading the Laravel version before it leaves security support",
            "Applying a dependency's security patch",
            "Answering a user's ticket about a failed login",
            "Updating the app to target the new Android API level the store now requires",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Maintenance is planned upkeep: upgrades, patches, store-required updates. Answering a user's ticket is support.",
        },
        {
          id: "pmp-c05-warranty-support-amc-q8",
          prompt: "The client calls the AMC \"the extended warranty\" and expects two new reports under it. What do you do?",
          options: [
            "Restate what the AMC covers (support and maintenance within its cap) and offer the reports as a change request",
            "Build them, since the AMC is a warranty extension",
            "Cancel the AMC",
            "Ignore the label and build one of the two",
          ],
          correctIndex: 0,
          explanation: "An AMC typically excludes new features. Correct the label kindly, point to the plan's scope, and offer a clear path for the new work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c05-warranty-support-amc-q9",
          prompt: "A defect is reported on the last day of the warranty window and fixed nine days later. Which question decides whether it is a warranty fix?",
          options: [
            "Whether it was reported inside the window, as the contract defines",
            "Whether it was fixed inside the window",
            "Whether the client has paid the last invoice",
            "Whether hypercare is still running",
          ],
          correctIndex: 0,
          explanation: "Warranty clauses usually turn on when the defect is reported, not when the fix lands. Check the exact wording of your SOW.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "A white-label food-ordering app for a restaurant group in Oman went live ten weeks ago. The SOW's warranty window closed last week. The client has signed an AMC starting next month. Put each request in the bucket that pays for it or decides it today.",
        categories: [
          { id: "warranty", label: "Warranty fix (defect reported inside the window)" },
          { id: "support", label: "Support work (out of warranty: AMC or quoted)" },
          { id: "maintenance", label: "Planned maintenance" },
          { id: "new-work", label: "New work (CR or new phase)" },
        ],
        items: [
          { id: "i1", text: "Logged three weeks ago, still open: the order total ignores the delivery-fee rule agreed in the configuration sheet.", explanation: "A defect against the agreed scope, reported inside the window. It stays a warranty fix even though the window has now closed." },
          { id: "i2", text: "Reported today: the 'reorder' button, which was in scope, crashes the app.", explanation: "A defect, but reported after the window. It is support work: under the AMC once it starts, or quoted until then." },
          { id: "i3", text: "Google Play now requires a newer target API level for updates.", explanation: "A store-driven adaptive update: planned maintenance." },
          { id: "i4", text: "Add a loyalty-points wallet to the app.", explanation: "Brand-new functionality: new work through a CR or a new phase." },
          { id: "i5", text: "Upgrade the admin panel's framework version before its security support ends.", explanation: "Preventive upkeep: maintenance." },
          { id: "i6", text: "A restaurant manager cannot log in after resetting her password; reset was in scope. Reported this morning.", explanation: "A defect reported after the window: support work." },
          { id: "i7", text: "Show the rider's photo on the order-tracking screen.", explanation: "Improves something that works as agreed: new work through a CR." },
          { id: "i8", text: "Raised in week four, fixed in week nine: push notifications in Arabic showed raw text keys.", explanation: "Reported inside the window, against agreed scope: warranty." },
          { id: "i9", text: "Renew the SSL certificate and rotate the expiring map API key.", explanation: "Routine upkeep that keeps the app working: maintenance." },
          { id: "i10", text: "Build a second app for the restaurant group's catering brand.", explanation: "Entirely new work: a new phase or SOW." },
        ],
        answer: { i1: "warranty", i2: "support", i3: "maintenance", i4: "new-work", i5: "maintenance", i6: "support", i7: "new-work", i8: "warranty", i9: "maintenance", i10: "new-work" },
      },
    },
  ],
} satisfies Module;
