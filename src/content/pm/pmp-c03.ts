import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-c03",
  trackId: "pm",
  name: "Terminology: Delivery terms",
  description:
    "The delivery words that teams and clients swap without noticing: BRD vs PRD vs user story, Definition of Ready vs Definition of Done, release vs deployment vs go-live, and hotfix vs patch vs version. Every comparison ends with what the difference changes for scope, dates or billing, and the sentence to use with the client.",
  topics: [
    {
      id: "pmp-c03-brd-prd-story",
      moduleId: "pmp-c03",
      trackId: "pm",
      title: "BRD vs PRD vs user story",
      summary:
        "Three requirement documents at three different heights. A [[term:brd|BRD]] says what the business needs and why. A [[term:prd|PRD]] says what the product must do to meet that need. A [[term:user-story]] is one small piece of the product, written from a user's point of view and paired with [[term:acceptance-criteria]].\n\nWhy it matters at an agency: when a client and Oyelabs disagree about scope, the argument is settled by whichever document was signed. Business goals in a BRD (\"reduce no-shows\") are not product scope. Features in a signed PRD usually are, and anything not described there is typically handled as a [[term:change-request]]. User stories are how the team builds and shows the work, sprint by sprint, but a backlog of stories with no signed baseline protects nobody.\n\nHow to do it: in [[term:discovery]], agree which documents this project will have and which one fixes the [[term:scope-baseline]]. Write the business goals once, translate them into product features, then break features into stories with testable criteria. Get written [[term:sign-off]] on the baseline document. Whether Oyelabs writes a BRD, a PRD or both, and who signs it, is in the handbook card below.\n\nThe common mistake: a BRD that already describes screens, or a PRD that only lists goals. When a document sits at the wrong height, nobody can tell later what was promised.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Asana: Business requirements document template", url: "https://asana.com/resources/business-requirements-document-template", kind: "article", verifiedAt: "2026-10-02T11:57:42Z" },
        { label: "ProjectManager: How to write a business requirements document (BRD)", url: "https://www.projectmanager.com/blog/business-requirements-document", kind: "article", verifiedAt: "2026-10-02T11:57:14Z" },
        { label: "Atlassian: Product requirements document (PRD)", url: "https://www.atlassian.com/agile/product-management/requirements", kind: "article", verifiedAt: "2026-10-02T11:54:23Z" },
        { label: "GOV.UK Service Manual: Writing user stories", url: "https://www.gov.uk/service-manual/agile-delivery/writing-user-stories", kind: "docs", verifiedAt: "2026-10-02T11:51:25Z" },
      ],
      video: {
        title: "Business Requirements Document Explained: Your Blueprint for Project Success",
        channel: "AltexSoft",
        url: "https://www.youtube.com/watch?v=mm8sTgoUhRY",
        videoId: "mm8sTgoUhRY",
        verifiedAt: "2026-10-02T12:17:21Z",
      },
      alternateVideos: [
        {
          title: "Requirement Specification vs User Stories",
          channel: "Modern Software Engineering",
          url: "https://www.youtube.com/watch?v=KP0U3I-f9-Y",
          videoId: "KP0U3I-f9-Y",
          verifiedAt: "2026-10-02T12:17:22Z",
        },
        {
          title: "BRD FRD and SRS || Dhirendra Kumar Panda || The Business Analyst Trainer",
          channel: "The Business Analyst Trainer",
          url: "https://www.youtube.com/watch?v=Adkxkio84PY",
          videoId: "Adkxkio84PY",
          verifiedAt: "2026-10-02T12:17:22Z",
        },
      ],
      interactive: { kind: "flashcards", category: "delivery" },
      handbook: { stages: ["custom-discovery"], rules: ["requirement-freeze-after-signoff", "cr-when-needed"], templates: ["requirement-signoff"] },
      sections: [
        {
          heading: "BRD vs PRD: side by side",
          body:
            "**[[term:brd|BRD]] (business requirements document)**\n- Answers: *what does the business need, and why?*\n- Contents: objectives, business processes, stakeholders, business rules, success measures.\n- Written in the client's language. Deliberately says little about screens or technology.\n\n**[[term:prd|PRD]] (product requirements document, sometimes called a functional specification)**\n- Answers: *what must the product do to meet that need?*\n- Contents: features, user flows, functional and non-functional requirements, release scope ([[term:mvp]] versus [[term:phase-2]]).\n- Written so design and engineering can work from it.\n\n**Consequence for scope and billing:** a goal in the BRD does not commit Oyelabs to every feature that might serve it. The product scope is what the signed baseline document describes. Changing business goals after sign-off normally comes through a [[term:change-request]], and so does adding features the PRD does not describe.",
        },
        {
          heading: "PRD vs user story: side by side",
          body:
            "**[[term:prd|PRD]]**\n- The whole product on one page set. Read before the build starts; refined before sprints.\n- Often the document the client signs, so it is usually part of the [[term:scope-baseline]].\n\n**[[term:user-story|User story]]**\n- One slice, small enough to build in a [[term:sprint]]: \"As a <type of user>, I want <goal> so that <benefit>.\"\n- Comes with [[term:acceptance-criteria]]: the testable conditions that say when it works.\n- Lives in the [[term:backlog]]. Estimated, built, demoed and accepted one by one.\n\n**Consequence:** stories should trace back to the PRD. A story that traces to nothing is new scope, however small it looks. Adding stories after the baseline is fixed usually counts as a change request or a [[term:new-feature]], not free work.",
        },
        {
          heading: "One need at three heights",
          body:
            "A Laravel and React tenancy portal for a UK letting agent:\n\n- **BRD:** \"Cut the time from a tenant reporting a repair to a contractor being booked. Today it takes several phone calls.\" A goal and a process, no screens.\n- **PRD:** \"Tenants can report a repair with a category, a description and up to five photos. The agent sees new reports in a queue and assigns a contractor. The tenant gets an email at each status change.\" Product behaviour.\n- **User story:** \"As a tenant, I want to report a repair with photos so that the agent can send the right contractor.\"\n- **Acceptance criteria for that story:** \"Given a logged-in tenant, when they submit a report with up to five photos, the report appears in the agent's queue. A sixth photo is refused with a clear message.\"\n\nEach line answers a different question. Mixing them is how a BRD ends up promising a photo limit nobody agreed, or a story ends up with no business reason.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A React Native grocery app for a supermarket client in Kenya.** Discovery produced a BRD (signed) and a PRD (signed). In UAT, the client's operations head writes: \"The BRD says our goal is to cut failed deliveries. Customers can't pick a delivery time slot, so this is a bug.\"\n\nThe PM checks the evidence before replying.\n\n1. The BRD does list \"cut failed deliveries\" as a goal.\n2. The PRD describes checkout, M-Pesa payment and rider tracking. It lists time-slot selection under phase 2.\n3. No story or acceptance criterion in the current release covers time slots.\n\nThe PM replies: \"You're right that cutting failed deliveries is a key goal, and rider tracking was the part of it agreed for launch. Time-slot booking is listed for phase 2 in section 4 of the signed PRD. If you'd like it before launch, I'll send a change request with the effort and the effect on the date today.\"\n\nResult: no argument about whether it is a bug, because each document was at the right height and the PRD said what was in the release.",
        },
        {
          heading: "How to say it to a client",
          body:
            "- \"The BRD captures what your business needs to achieve and why, so we agree the goals before we talk about screens.\"\n- \"The PRD describes what the app will do, feature by feature. Once you sign it, it is the reference we both build and test against.\"\n- \"A user story is one small piece of the product described from your user's point of view, so we can build, show and approve it in short steps.\"\n- \"That goal is in the BRD, but the feature isn't in the PRD, so I'll treat it as a change and send you the impact.\"",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **A BRD full of screens.** It reads like a commitment to a design nobody has made. Recover: move screen detail to the PRD or the designs, keep the BRD to goals and rules.\n- **No signed baseline, only a backlog.** Then every story can be argued about. Recover: summarise the agreed scope in one document and get [[term:sign-off]] before more sprints start.\n- **Stories with no acceptance criteria.** \"Done\" becomes a matter of opinion. Recover: add testable criteria before a story enters a sprint.\n- **Treating a BRD goal as a feature promise.** Recover: always reply from the PRD, and offer a CR for features that serve the goal but were never described.\n- **Changing the PRD quietly after sign-off.** Recover: version it, and send changes through the CR process.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Agreed in discovery which documents this project has, and which one fixes the scope baseline.\n2. The BRD holds goals and rules; the PRD holds features and flows; stories hold slices with criteria.\n3. Every story traces back to a PRD feature.\n4. The baseline document is signed and versioned.\n5. Requests that serve a goal but are not in the PRD go to a change request.",
        },
      ],
      sop: [
        {
          title: "Which requirement documents Oyelabs produces",
          prompt: "[Oyelabs SOP – admin to fill] Whether Oyelabs produces a BRD, a PRD or both on custom projects, the template for each, who writes and signs them, and which document fixes the scope baseline.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c03-brd-prd-story-q1",
          prompt: "\"Reduce missed clinic appointments by reminding patients.\" Which document does this line belong in?",
          options: ["The BRD", "The PRD", "A user story", "The acceptance criteria"],
          correctIndex: 0,
          explanation: "It is a business goal with no product behaviour described. Goals and the reason for the project belong in the BRD.",
        },
        {
          id: "pmp-c03-brd-prd-story-q2",
          prompt: "\"As a receptionist, I want to see today's bookings on one screen so that I can prepare the rooms.\" What is this?",
          options: ["A user story", "A BRD objective", "A PRD section", "A Definition of Done item"],
          correctIndex: 0,
          explanation: "The \"As a… I want… so that…\" form, from one user's point of view, is a user story.",
        },
        {
          id: "pmp-c03-brd-prd-story-q3",
          prompt: "The signed BRD says \"cut failed deliveries\". The signed PRD lists delivery time slots under phase 2. In UAT the client calls the missing time slots a bug. What is it?",
          options: [
            "Not a bug: the PRD puts it in phase 2, so bringing it forward is a change request",
            "A bug, because the BRD goal is not met",
            "A clarification with no follow-up",
            "A Definition of Ready failure",
          ],
          correctIndex: 0,
          explanation: "BRD goals do not commit the agency to every feature that might serve them. The PRD defines product scope, and it places time slots in phase 2.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c03-brd-prd-story-q4",
          prompt: "Which of these belong in a PRD? (Select all that apply.)",
          options: [
            "The user flow for checkout",
            "Offline behaviour and target devices",
            "Which features are in launch scope and which are phase 2",
            "The company's reason for starting the project",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Flows, non-functional requirements and release scope are product definition. The business reason belongs in the BRD.",
        },
        {
          id: "pmp-c03-brd-prd-story-q5",
          prompt: "A client wants to skip documents and \"just work from the Jira backlog\". There is no signed PRD or scope summary. What is the main risk?",
          options: [
            "No signed baseline, so any story can later be argued in or out of scope",
            "Stories cannot be estimated",
            "The team cannot run sprints",
            "Jira does not support acceptance criteria",
          ],
          correctIndex: 0,
          explanation: "Working from stories is fine, but something signed must say what the agreed scope is. Otherwise every change request becomes a debate.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c03-brd-prd-story-q6",
          prompt: "What makes a user story ready to be tested and accepted?",
          options: [
            "Clear acceptance criteria that describe observable behaviour",
            "A long description",
            "A high priority",
            "Approval from the developer",
          ],
          correctIndex: 0,
          explanation: "Acceptance criteria turn a story into something testable. They also become the basis of test cases and UAT.",
        },
        {
          id: "pmp-c03-brd-prd-story-q7",
          prompt: "A new story appears in sprint 6 that does not trace back to any PRD feature. What should the PM do first?",
          options: [
            "Treat it as possible new scope: check the PRD, then raise a change request if it is not covered",
            "Build it, since stories are always in scope",
            "Delete it without telling anyone",
            "Move it to the Definition of Done",
          ],
          correctIndex: 0,
          explanation: "Stories should trace to the baseline. One that traces to nothing is usually new scope, however small it looks.",
        },
        {
          id: "pmp-c03-brd-prd-story-q8",
          prompt: "Which statements are true? (Select all that apply.)",
          options: [
            "A BRD is written from the business's point of view",
            "Changing the PRD after sign-off should go through change control",
            "A user story replaces the need for acceptance criteria",
            "One PRD feature can be split into several user stories",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation: "Stories need criteria; they do not replace them. The other three statements describe how the documents fit together.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "These lines come from the discovery notes for a Laravel and React tenancy portal for a UK letting agent. Put each line where it belongs: the BRD, the PRD, a user story or an acceptance criterion.",
        categories: [
          { id: "brd", label: "BRD (business need)" },
          { id: "prd", label: "PRD (product behaviour)" },
          { id: "story", label: "User story" },
          { id: "ac", label: "Acceptance criterion" },
        ],
        items: [
          { id: "i1", text: "Reduce the number of phone calls the office handles about repairs.", explanation: "A business goal with no product behaviour: BRD." },
          { id: "i2", text: "Tenants can report a repair with a category, a description and up to five photos.", explanation: "Describes what the product does: PRD." },
          { id: "i3", text: "As a tenant, I want to see the status of my repair so that I don't have to call the office.", explanation: "One slice from a user's point of view: user story." },
          { id: "i4", text: "Given a submitted repair, when the agent assigns a contractor, the tenant receives an email within the same minute.", explanation: "A testable condition in Given-When-Then form: acceptance criterion." },
          { id: "i5", text: "Only branch managers may approve repair costs above the landlord's limit.", explanation: "A business rule stated in the business's language: BRD." },
          { id: "i6", text: "The agent dashboard must load within the agreed performance target on a standard office connection.", explanation: "A non-functional product requirement: PRD." },
          { id: "i7", text: "As an agent, I want to filter repairs by property so that I can plan contractor visits.", explanation: "A user story." },
          { id: "i8", text: "A sixth photo is refused with the message \"You can attach up to five photos\".", explanation: "Observable, testable behaviour for one story: acceptance criterion." },
          { id: "i9", text: "Online rent payment is out of launch scope and listed for phase 2.", explanation: "Release scope is part of the product definition: PRD." },
          { id: "i10", text: "Success is measured by fewer repair calls in the first six months.", explanation: "A business success measure: BRD." },
        ],
        answer: { i1: "brd", i2: "prd", i3: "story", i4: "ac", i5: "brd", i6: "prd", i7: "story", i8: "ac", i9: "prd", i10: "brd" },
      },
    },
    {
      id: "pmp-c03-dor-dod",
      moduleId: "pmp-c03",
      trackId: "pm",
      title: "Definition of Ready and Definition of Done",
      summary:
        "Two checklists that guard opposite ends of a [[term:sprint]]. The [[term:definition-of-ready|Definition of Ready]] (DoR) is the entry gate: what a backlog item needs before the team pulls it in, such as a clear story, agreed [[term:acceptance-criteria]], designs, known dependencies and an estimate. The [[term:definition-of-done|Definition of Done]] (DoD) is the exit bar: the quality standard every item must meet before anyone calls it done, such as code reviewed, tested and deployed to staging.\n\nWhy it matters at an agency: a weak DoR means developers start work that stops half-way because the client's API details or content are missing. A weak DoD means \"done\" in the sprint demo turns into bugs in [[term:uat]]. Both cost money on a fixed bid. And acceptance criteria, the third word in this group, are per story, while the DoD applies to every story.\n\nHow to do it: agree both lists with the team at the start, keep them short, and check them out loud in sprint planning and the demo. When an item fails the DoR because the client has not supplied something, log it as a [[term:client-dependency]]: that record is what shows a later slip was not the team's.\n\nThe common mistake: weakening the DoD to hit a date. The work is not saved; it moves into UAT and warranty, where it costs more. The Oyelabs checklists are in the handbook term cards (DoR and DoD).",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Scrum Guides: The Scrum Guide (2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: "2026-10-02T11:51:24Z" },
        { label: "Atlassian: What is the Definition of Ready", url: "https://www.atlassian.com/agile/project-management/definition-of-ready", kind: "article", verifiedAt: "2026-10-02T11:52:17Z" },
        { label: "Atlassian: Definition of Done (DoD)", url: "https://www.atlassian.com/agile/project-management/definition-of-done", kind: "article", verifiedAt: "2026-10-02T11:54:23Z" },
        { label: "Atlassian: Acceptance criteria - definition, examples and tips", url: "https://www.atlassian.com/work-management/project-management/acceptance-criteria", kind: "article", verifiedAt: "2026-10-02T11:54:23Z" },
      ],
      video: {
        title: "Definition of ready vs Definition of done  | CT Academy",
        channel: "CT Academy",
        url: "https://www.youtube.com/watch?v=kfSeI6Qvt_Q",
        videoId: "kfSeI6Qvt_Q",
        verifiedAt: "2026-10-02T12:17:22Z",
      },
      alternateVideos: [
        {
          title: "What Is the Definition of Ready In Agile and Why Is It Dangerous?",
          channel: "Mountain Goat Software: Agile & Scrum Mastery",
          url: "https://www.youtube.com/watch?v=4SVwNF3quZo",
          videoId: "4SVwNF3quZo",
          verifiedAt: "2026-10-02T12:17:22Z",
        },
        {
          title: "definition of ready vs definition of done vs acceptance criteria I scrum master interview questions",
          channel: "CareersTalk",
          url: "https://www.youtube.com/watch?v=YlUsgI4s-Vs",
          videoId: "YlUsgI4s-Vs",
          verifiedAt: "2026-10-02T12:17:22Z",
        },
      ],
      handbook: { stages: ["custom-sprint-0", "custom-sprints"], templates: ["raid-log-template"] },
      sections: [
        {
          heading: "Definition of Ready vs Definition of Done: side by side",
          body:
            "**[[term:definition-of-ready|Definition of Ready]]**\n- When: before an item enters a sprint, checked in sprint planning.\n- Asks: *can the team start this and finish it without stopping?*\n- Typical items: clear story, agreed acceptance criteria, approved designs, API details or content from the client, dependencies known, estimate done.\n- Fails → the item waits for a later sprint.\n\n**[[term:definition-of-done|Definition of Done]]**\n- When: before anyone calls an item finished, checked before the demo.\n- Asks: *does this meet our quality bar?*\n- Typical items: code reviewed, QA passed on the [[term:staging-environment]], tests added, release note updated.\n- Fails → the item is not done, whatever the developer says.\n\n**Where they come from:** the Scrum Guide defines the Definition of Done as part of Scrum. The Definition of Ready is a common team practice, not part of the guide, which is why teams shape it so differently.",
        },
        {
          heading: "Definition of Done vs acceptance criteria: side by side",
          body:
            "**[[term:acceptance-criteria|Acceptance criteria]]**\n- Belong to **one** story: \"a reset link is valid for 30 minutes; an unknown email shows the same neutral message.\"\n- Written with, or agreed by, the client. They describe *what* the feature does.\n\n**[[term:definition-of-done|Definition of Done]]**\n- Applies to **every** story: \"reviewed, tested on staging, documented.\"\n- Owned by the team. It describes *how well* the work was finished.\n\n**Consequence:** a story can meet all its acceptance criteria and still not be done (no code review, not deployed to staging). And a story can pass the DoD and still fail acceptance (well built, but not what was agreed). The client accepts against the criteria; the team only offers work that has passed the DoD.",
        },
        {
          heading: "Done vs accepted vs live",
          body:
            "Clients hear \"done\" as \"I can use it\". Teams often mean something smaller. Keep three words apart in every status update:\n\n- **Done:** passed the team's Definition of Done. Ready to demo.\n- **Accepted:** the client has checked it against the acceptance criteria, in a demo or in [[term:uat]], and agreed.\n- **Live:** it has been released to real users at [[term:go-live]] or in a later [[term:release]].\n\nA status line like \"Login: done, accepted in demo, goes live in release 1.2\" leaves no room for a surprise.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label food-delivery app for a restaurant group in the UAE, sprint 4 planning.** Five stories are proposed. The PM walks the team's DoR for each one.\n\n1. Checkout with the client's payment gateway: the client has not yet supplied the gateway sandbox credentials, a DoR item. **Not ready.** The PM logs a [[term:client-dependency]] in the [[term:raid-log|RAID log]] with the date it was asked for, and tells the client which sprint it now moves to if the credentials arrive by Thursday.\n2. Order history: designs approved, criteria agreed, estimated. **Ready.**\n3. Promo codes: the criteria say \"promo codes work\" and nothing more. **Not ready.** The PM books 20 minutes with the client to write testable criteria (one code per order, expiry, minimum basket).\n4–5. Ready.\n\nAt the sprint demo, the developer says order history is done. QA has not yet run it on staging, a DoD item. The PM shows it as \"in progress\" rather than done. It passes QA the next day and is accepted in the following demo.\n\nResult: the sprint did not stall on missing credentials, and the client never saw a \"done\" feature break in UAT.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Weakening the DoD to hit a date.** Recover: keep the bar and show the client the true status; if a date must move, say so early.\n- **A DoR so strict nothing is ever ready.** A DoR is a guide for a conversation, not a wall. Recover: keep it short and allow the team to pull an item with a small, named gap.\n- **Client-caused DoR failures not logged.** Then a later slip looks like the team's fault. Recover: log each one as a client dependency with the date requested.\n- **Saying \"done\" when you mean \"coded\".** Recover: use done, accepted and live exactly, in every update.\n- **Acceptance criteria copied into the DoD.** Recover: keep story-specific rules on the story; the DoD holds only rules for all work.",
        },
        {
          heading: "Your checklist",
          body:
            "1. The team has a short, written DoR and DoD, agreed before sprint 1.\n2. Sprint planning checks each item against the DoR.\n3. Items that fail the DoR because of the client are logged as client dependencies.\n4. Nothing is demoed as done until it passes the DoD.\n5. Status updates separate done, accepted and live.",
        },
      ],
      sop: [
        {
          title: "Oyelabs DoR and DoD checklists",
          prompt: "[Oyelabs SOP – admin to fill] The items in Oyelabs' standard Definition of Ready and Definition of Done, whether they differ for custom and white-label work, and who checks each one in sprint planning and before the demo.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c03-dor-dod-q1",
          prompt: "\"The client has supplied the API documentation and test credentials.\" Which checklist does this item normally belong to?",
          options: ["Definition of Ready", "Definition of Done", "Acceptance criteria", "Release notes"],
          correctIndex: 0,
          explanation: "It is something the team needs before starting the work: an entry condition, so DoR.",
        },
        {
          id: "pmp-c03-dor-dod-q2",
          prompt: "\"Code has been reviewed by a second developer.\" Which checklist does this belong to?",
          options: ["Definition of Done", "Definition of Ready", "Acceptance criteria for one story", "The BRD"],
          correctIndex: 0,
          explanation: "It is a quality step every item must pass before it counts as finished: DoD.",
        },
        {
          id: "pmp-c03-dor-dod-q3",
          prompt: "What is the key difference between the Definition of Done and acceptance criteria?",
          options: [
            "The DoD applies to every item; acceptance criteria belong to one story",
            "They are the same thing with different names",
            "Acceptance criteria are written only by developers",
            "The DoD is signed by the client at go-live",
          ],
          correctIndex: 0,
          explanation: "Acceptance criteria say what one feature must do. The DoD is the team's quality bar for all work.",
        },
        {
          id: "pmp-c03-dor-dod-q4",
          prompt: "A story meets all its acceptance criteria in a developer's local build, but has not been tested on staging, which the DoD requires. Is it done?",
          options: [
            "No: it has not met the Definition of Done",
            "Yes: the acceptance criteria are met",
            "Yes, if the developer is confident",
            "Only if the client has asked for it urgently",
          ],
          correctIndex: 0,
          explanation: "Meeting the criteria is necessary but not enough. Until it passes the DoD, it is not done.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c03-dor-dod-q5",
          prompt: "A checkout story fails the DoR because the client has not sent the payment gateway credentials. What should the PM do? (Select all that apply.)",
          options: [
            "Keep it out of the sprint and pull in a ready item",
            "Log it as a client dependency with the date it was requested",
            "Tell the client which sprint it moves to and what is needed by when",
            "Start it anyway with fake credentials and call it done",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Hold it, log the dependency and make the impact visible. Building against fake credentials and calling it done breaks the DoD.",
        },
        {
          id: "pmp-c03-dor-dod-q6",
          prompt: "A deadline is close. The tech lead suggests dropping code review and staging QA from the DoD \"just for this sprint\". What is the most likely result?",
          options: [
            "Defects move into UAT and warranty, where they cost more to fix",
            "The project finishes early with no downside",
            "The client will not notice",
            "The DoR becomes stricter automatically",
          ],
          correctIndex: 0,
          explanation: "Weakening the DoD does not remove work; it hides it until later, when it is more expensive and visible to the client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c03-dor-dod-q7",
          prompt: "Which statement about the Definition of Ready is accurate?",
          options: [
            "It is a common team practice; the Scrum Guide itself defines the Definition of Done but not a Definition of Ready",
            "It is a mandatory part of the Scrum Guide",
            "It is signed by the client before each sprint",
            "It replaces acceptance criteria",
          ],
          correctIndex: 0,
          explanation: "The Scrum Guide defines the DoD. The DoR is a widely used practice, so its contents vary between teams.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c03-dor-dod-q8",
          prompt: "In a status update, which line is clearest for the client?",
          options: [
            "\"Order history: done, accepted in Tuesday's demo, goes live in release 1.2.\"",
            "\"Order history: done.\"",
            "\"Order history: nearly there.\"",
            "\"Order history: coded.\"",
          ],
          correctIndex: 0,
          explanation: "Separating done, accepted and live tells the client exactly where the feature stands.",
        },
        {
          id: "pmp-c03-dor-dod-q9",
          prompt: "Which of these are typical Definition of Ready items? (Select all that apply.)",
          options: [
            "Approved designs for the screens involved",
            "Testable acceptance criteria agreed",
            "An estimate from the team",
            "Deployed to production",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Designs, criteria and an estimate let the team start. Deployment to production happens long after an item is ready.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "The team on a Laravel inventory system for a Dutch wholesaler is writing its checklists. Put each line in the right place: the Definition of Ready, the Definition of Done, or the acceptance criteria of one specific story.",
        categories: [
          { id: "dor", label: "Definition of Ready" },
          { id: "dod", label: "Definition of Done" },
          { id: "ac", label: "Acceptance criteria (one story)" },
        ],
        items: [
          { id: "i1", text: "The story has testable acceptance criteria agreed with the client.", explanation: "A condition for starting work: DoR." },
          { id: "i2", text: "The code has been reviewed and approved by another developer.", explanation: "A quality step for every item: DoD." },
          { id: "i3", text: "When stock falls below the reorder level, the product appears in the reorder report the same day.", explanation: "Behaviour of one feature: acceptance criterion." },
          { id: "i4", text: "Designs for the screens involved are approved.", explanation: "Needed before starting: DoR." },
          { id: "i5", text: "QA has passed the item on the staging environment.", explanation: "Part of the quality bar for every item: DoD." },
          { id: "i6", text: "Any data or API access needed from the client has been received.", explanation: "An entry condition that often fails because of client dependencies: DoR." },
          { id: "i7", text: "Exporting the stock list produces a CSV with SKU, name, quantity and warehouse columns.", explanation: "Specific to one story: acceptance criterion." },
          { id: "i8", text: "Automated tests cover the new code and pass in the pipeline.", explanation: "Applies to all work: DoD." },
          { id: "i9", text: "The team has estimated the item and it fits in one sprint.", explanation: "Needed before pulling it in: DoR." },
          { id: "i10", text: "The release note is updated with the change.", explanation: "A finishing step for every item: DoD." },
        ],
        answer: { i1: "dor", i2: "dod", i3: "ac", i4: "dor", i5: "dod", i6: "dor", i7: "ac", i8: "dod", i9: "dor", i10: "dod" },
      },
    },
    {
      id: "pmp-c03-release-deploy-golive",
      moduleId: "pmp-c03",
      trackId: "pm",
      title: "Release vs deployment vs go-live",
      summary:
        "Three words people use for \"it's out\". They are not the same moment. A [[term:deployment]] is the technical act of installing a [[term:build]] on an [[term:environment]]. A [[term:release]] is a packaged, versioned set of changes approved for users, with release notes. [[term:go-live]] is the business moment real users start relying on the system for real work.\n\nWhy it matters at an agency: the gap between them is where expectations break. A team can deploy to production at night with new features hidden behind a [[term:feature-toggle]], and the client's business go-live is the following Monday. A mobile release can be submitted on Friday and still be in store review on Tuesday. And go-live is contractual: it often triggers a payment [[term:milestone]] and starts [[term:hypercare]] and the [[term:warranty]] clock. If the contract says \"go-live\" and nobody defined it (production deployment, store approval, or first real transaction?), the start of warranty is up for argument.\n\nHow to do it: use the three words exactly in every email. Plan the release (what is in it), plan the deployment (how and when it is installed, with a [[term:rollback]] plan), and plan go-live (the [[term:go-no-go]] decision, the [[term:cutover]] and who tells users). Take the definition of go-live from the contract, not from habit.\n\nThe common mistake: announcing \"we're live\" after a deployment to production, when the client has not done the go/no-go or the store has not approved the app.\n\nNot legal advice: the signed contract always wins.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Atlassian: Continuous integration vs delivery vs deployment", url: "https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment", kind: "article", verifiedAt: "2026-10-02T11:54:26Z" },
        { label: "Martin Fowler (Pete Hodgson): Feature toggles", url: "https://martinfowler.com/articles/feature-toggles.html", kind: "article", verifiedAt: "2026-10-02T11:55:01Z" },
        { label: "GOV.UK Service Manual: Deploying software regularly", url: "https://www.gov.uk/service-manual/technology/deploying-software-regularly", kind: "docs", verifiedAt: "2026-10-02T11:51:26Z" },
        { label: "Google SRE book: Release engineering", url: "https://sre.google/sre-book/release-engineering/", kind: "article", verifiedAt: "2026-10-02T11:55:03Z" },
      ],
      video: {
        title: "What is the difference between deployment and release?",
        channel: "Romano Roth",
        url: "https://www.youtube.com/watch?v=qmItPR0I-OE",
        videoId: "qmItPR0I-OE",
        verifiedAt: "2026-10-02T12:17:23Z",
      },
      alternateVideos: [
        {
          title: "What are Feature Flags?",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=AJa2B-twtG4",
          videoId: "AJa2B-twtG4",
          verifiedAt: "2026-10-02T12:17:23Z",
        },
        {
          title: "Continuous Deployment vs. Continuous Delivery",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=LNLKZ4Rvk8w",
          videoId: "LNLKZ4Rvk8w",
          verifiedAt: "2026-10-02T12:17:24Z",
        },
      ],
      interactive: { kind: "flashcards", category: "delivery" },
      handbook: { stages: ["custom-release", "wl-golive"], rules: ["uat-signoff-before-golive"], templates: ["golive-checklist"] },
      sections: [
        {
          heading: "Release vs deployment vs go-live: side by side",
          body:
            "**[[term:release|Release]]: the *what***\n- A versioned bundle of changes, approved for users, with release notes (\"release 1.4.0: three fixes and a promo-code screen\").\n- Owned jointly: the team proposes it, the client approves what goes to users.\n\n**[[term:deployment|Deployment]]: the *how***\n- Installing a build on an environment and making it run: dev, [[term:staging-environment|staging]], [[term:uat-environment|UAT]] or [[term:production-environment|production]].\n- Can happen many times a day without users noticing. Deploying to staging is still a deployment.\n\n**[[term:go-live|Go-live]]: the *business moment***\n- Real users start using the system for real work. Usually follows UAT [[term:sign-off]] and a [[term:go-no-go]] decision.\n- Often starts hypercare and the warranty window, and is often a payment milestone.\n\n**Consequence:** \"deployed\" is a technical fact, \"released\" is a promise about content, and \"live\" is a commercial event. Use the wrong one in an email and the client may think the warranty or an invoice has started.",
        },
        {
          heading: "Build vs release: side by side",
          body:
            "**[[term:build|Build]]**\n- The compiled, runnable output of one state of the code: an Android APK or AAB, an iOS IPA, a bundled web app. Usually numbered (build 57).\n- Many builds are made; most are only ever seen by QA.\n\n**[[term:release|Release]]**\n- One build that has been tested and approved to go to users, given a [[term:version]] number and release notes.\n\n**Consequence:** a client testing build 56 while the fix is in build 57 wastes UAT time. Always name the build in UAT messages, and only call something a release once it is approved for users.",
        },
        {
          heading: "Deploy without releasing: feature toggles",
          body:
            "A [[term:feature-toggle]] lets the team deploy code to production with a feature switched off, then switch it on later. Deployment and release become two separate decisions.\n\nWhy agencies use it:\n- The deployment can happen at a quiet time, days before the launch.\n- The business launch can be timed to the client's marketing, not the team's deployment window.\n- If the feature misbehaves, it can be switched off without a full [[term:rollback]].\n\nWhat the PM must make clear: \"Deployed to production\" does not mean \"customers can see it\". Say: \"The code is deployed and switched off. It goes live when you give the word on Monday.\"",
        },
        {
          heading: "Where go/no-go, cutover and rollback fit",
          body:
            "On launch week, the words appear in this order:\n\n1. **Release** content is frozen and tested on staging; UAT is signed off.\n2. **[[term:go-no-go|Go/no-go]]:** the team and client review readiness (open defects, [[term:known-issues]], data, support, rollback plan) and decide.\n3. **[[term:cutover|Cutover]]:** the timed switch from the old system to the new one: data migration, DNS changes, freezes on the old system, checks.\n4. **Deployment** to production, then a [[term:smoke-test]].\n5. **Go-live:** users start using it for real.\n6. **[[term:rollback|Rollback]]** if needed: returning to the last known-good version. Code rollbacks are typically quick; data rollbacks are slower and riskier.\n\n**Mobile apps differ.** Submitting a release to the stores is not go-live: store review typically adds anything from a day to several days. And a store build usually cannot be rolled back, only replaced by a new version. Plan the go-live date around review, not around the upload.",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A Laravel booking API and React web app for a client in France, plus a store-listed white-label companion app.** The contract defines go-live as \"the date the platform is first available to the client's customers\".\n\n- **Tuesday night:** the team deploys release 2.0.0 of the web platform to production with the new booking flow behind a toggle. Smoke test passes. The PM writes: \"Release 2.0.0 is deployed to production and switched off. Nothing has changed for your customers yet.\"\n- **Wednesday:** the mobile release is submitted to both stores. The PM writes: \"Submitted for store review. Review typically takes a day to several days, so we'll confirm the go-live date once both stores approve.\"\n- **Friday:** both stores approve. Go/no-go meeting: one low-severity known issue, accepted with a workaround. Decision: go.\n- **Monday 9:00:** the toggle is switched on and the app is released in the stores. The PM writes: \"You are live. Hypercare starts today, and the warranty window runs from today as defined in the contract.\"\n\nThree different emails, three different words. Nobody could later argue the warranty started on Tuesday.",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **\"We're live!\" after a production deployment.** Recover: correct it the same day: \"Deployed, not yet live; go-live is on Monday after the go/no-go.\"\n- **Go-live date promised on the day of store submission.** Recover: give the date as \"after approval\", and plan launch marketing around it.\n- **No rollback plan.** Recover: write one before the next production deployment, including what happens to data.\n- **Go-live left undefined in the contract.** Recover: agree the definition in writing with the client before launch week, through BD if needed.\n- **Release notes skipped.** The client cannot tell what changed. Recover: send notes for every release, even small ones.\n\nNot legal advice: the signed contract always wins.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Every email uses deployed, released and live in their exact meaning.\n2. I know how the contract defines go-live, and which periods and payments start from it.\n3. Each release has a version, release notes and client approval.\n4. Each production deployment has a rollback plan and a smoke test.\n5. Mobile go-live dates allow for store review.\n6. Go-live follows UAT sign-off and a recorded go/no-go decision.",
        },
      ],
      sop: [
        {
          title: "How Oyelabs defines go-live",
          prompt: "[Oyelabs SOP – admin to fill] The standard definition of go-live in Oyelabs contracts (production deployment, store approval or first real transaction), which periods and payments start from it, who may deploy to production, and the go-live announcement wording.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c03-release-deploy-golive-q1",
          prompt: "The team installs a new build on the staging server. Which word fits?",
          options: ["A deployment", "A go-live", "A release to users", "A cutover"],
          correctIndex: 0,
          explanation: "Installing a build on any environment is a deployment. Nothing has been released to users and nothing is live.",
        },
        {
          id: "pmp-c03-release-deploy-golive-q2",
          prompt: "Code is deployed to production on Tuesday with the new feature switched off by a feature toggle. Customers see it from Monday. When is the business go-live of the feature?",
          options: ["Monday", "Tuesday", "When the build was made", "When UAT started"],
          correctIndex: 0,
          explanation: "Go-live is the moment real users can use it. The toggle separates the deployment (Tuesday) from the release to users (Monday).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c03-release-deploy-golive-q3",
          prompt: "A mobile release was submitted to the App Store and Google Play this morning. What should the PM tell the client?",
          options: [
            "It is submitted for review; go-live will be confirmed once both stores approve",
            "The app is live from today",
            "The warranty starts today",
            "It is deployed, so it is live",
          ],
          correctIndex: 0,
          explanation: "Store review typically adds time. Submission is not go-live, and promising a date before approval sets up a miss.",
        },
        {
          id: "pmp-c03-release-deploy-golive-q4",
          prompt: "Why does the exact definition of go-live matter commercially? (Select all that apply.)",
          options: [
            "It often triggers a payment milestone",
            "It often starts the warranty window",
            "It often starts hypercare",
            "It decides which programming language is used",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Go-live is a contractual moment in many agency contracts. It has nothing to do with the technology choice.",
        },
        {
          id: "pmp-c03-release-deploy-golive-q5",
          prompt: "What is the difference between a build and a release?",
          options: [
            "A build is any compiled output of the code; a release is a tested build approved for users, with a version and notes",
            "There is no difference",
            "A release is always smaller than a build",
            "Builds only exist for web apps",
          ],
          correctIndex: 0,
          explanation: "Many builds are made; only an approved one becomes a release.",
        },
        {
          id: "pmp-c03-release-deploy-golive-q6",
          prompt: "A new iOS version of the app has a serious bug after release. Can the team roll back the store build like a web deployment?",
          options: [
            "Usually not: a store build is typically replaced by a new fixed version, not rolled back",
            "Yes, instantly, from App Store Connect",
            "Yes, the users' phones revert automatically",
            "Only during hypercare",
          ],
          correctIndex: 0,
          explanation: "Web code can be redeployed quickly; mobile store builds usually cannot be rolled back, only replaced. Plan mobile releases with that in mind.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c03-release-deploy-golive-q7",
          prompt: "What is a cutover?",
          options: [
            "The planned, timed switch from the old system to the new one at go-live, including data migration and checks",
            "Any deployment to staging",
            "Removing features from a release",
            "The end of the warranty window",
          ],
          correctIndex: 0,
          explanation: "Cutover is the step-by-step switch, usually from a timed plan with named owners.",
        },
        {
          id: "pmp-c03-release-deploy-golive-q8",
          prompt: "The contract says warranty starts \"from go-live\" but never defines go-live. The client says go-live was the date the first real order came in; the PM says it was the production deployment two weeks earlier. What is the best course?",
          options: [
            "Escalate internally and agree the definition in writing with the client; the signed contract and its wording decide, not either side's habit",
            "Insist on the deployment date, since it suits Oyelabs",
            "Accept the client's date without recording it",
            "Ignore it until a warranty claim arrives",
          ],
          correctIndex: 0,
          explanation: "An undefined go-live is a contract gap. Settle it in writing, with BD and leadership involved, and define it up front next time. Not legal advice: the signed contract always wins.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c03-release-deploy-golive-q9",
          prompt: "Which should normally happen before go-live? (Select all that apply.)",
          options: [
            "UAT sign-off, with any known issues listed and accepted",
            "A go/no-go decision",
            "A rollback plan for the production deployment",
            "The end of the warranty window",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Sign-off, a go/no-go and a rollback plan come first. Warranty typically starts at or after go-live, not before it.",
        },
        {
          id: "pmp-c03-release-deploy-golive-q10",
          prompt: "Which status line is accurate the morning after a night-time production deployment, before the client's launch?",
          options: [
            "\"Release 2.0.0 is deployed to production and switched off; go-live is Monday after the go/no-go.\"",
            "\"We went live last night.\"",
            "\"Release 2.0.0 is live.\"",
            "\"Cutover is complete and warranty has started.\"",
          ],
          correctIndex: 0,
          explanation: "It states what happened technically and what the business moment will be, without starting any contractual clock early.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Fix the wrong term. A PM drafted this launch-week update for a Laravel and React booking platform (web) with a companion mobile app. Mark every line where release, deployment, go-live or a related term is used wrongly.",
        segments: [
          { id: "s1", text: "Hi Sophie, here's where we are with launch week.", issue: null },
          { id: "s2", text: "Last night we deployed release 2.0.0 to production with the new booking flow switched off, so nothing has changed for your customers yet.", issue: null },
          { id: "s3", text: "That means we are now live, and the warranty window started this morning.", issue: "A switched-off deployment is not go-live. Go-live is when real users can use it, as the contract defines it; warranty has not started." },
          { id: "s4", text: "The mobile app was submitted to both stores today, so it will go live tomorrow.", issue: "Submission is not go-live, and store review typically takes a day to several days. Confirm the date after both stores approve." },
          { id: "s5", text: "Our go/no-go meeting is on Friday, where we'll review open issues, known issues and the rollback plan together.", issue: null },
          { id: "s6", text: "Build 57 is the release, so please keep testing on build 56 in the meantime.", issue: "The client should test the build that contains the fixes. Testing an older build wastes UAT time; name the right build." },
          { id: "s7", text: "If anything goes wrong after the store launch, we'll simply roll back the app in the stores.", issue: "Store builds usually cannot be rolled back, only replaced by a new fixed version." },
          { id: "s8", text: "Release notes for 2.0.0 are attached so you can see exactly what's included.", issue: null },
          { id: "s9", text: "Go-live itself is on Monday at 9:00, when we switch the feature on, as long as Friday's decision is go.", issue: null },
          { id: "s10", text: "Thanks, and speak on Friday.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pmp-c03-hotfix-patch-version",
      moduleId: "pmp-c03",
      trackId: "pm",
      title: "Hotfix, patch and version numbers",
      summary:
        "A [[term:hotfix]] and a [[term:patch]] both fix bugs, but they are different decisions. A hotfix is an urgent fix applied to production outside the normal release cycle, to stop a serious live problem. A patch is a planned, usually small update that fixes bugs without adding features, and it goes through the normal test and release process. A [[term:version]] number tells everyone which state of the software is running; in Semantic Versioning, MAJOR.MINOR.PATCH means breaking changes, new backwards-compatible features and fixes.\n\nWhy it matters at an agency: hotfixes skip some testing, so they carry risk. Every hotfix is a trade between speed and safety, and frequent hotfixes signal a quality problem. Patches are cheaper and safer because fixes are bundled and fully tested. Clear version numbers make warranty claims, support tickets and [[term:rollback|rollbacks]] faster, because everyone can name exactly what is running.\n\nHow to do it: decide by [[term:severity]], not by who is shouting. A high-severity live problem may justify a hotfix; everything else waits for the next patch. Follow the Oyelabs hotfix approval rule in the handbook card below. Version every release, keep the mobile build number separate from the version the user sees, and make sure each hotfix is merged back into the main codebase.\n\nThe common mistake: hotfixing every client complaint. Each one bypasses testing, interrupts the sprint and, if not merged back, comes back as a [[term:regression]] in the next release.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Semantic Versioning 2.0.0", url: "https://semver.org/", kind: "spec", verifiedAt: "2026-10-02T11:54:58Z" },
        { label: "Atlassian Git Tutorial: Gitflow workflow (release and hotfix branches)", url: "https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow", kind: "docs", verifiedAt: "2026-10-02T11:53:55Z" },
        { label: "Apple Developer Documentation: CFBundleShortVersionString (release version number)", url: "https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleshortversionstring", kind: "docs", verifiedAt: "2026-10-02T11:55:12Z" },
        { label: "Keep a Changelog 1.1.0", url: "https://keepachangelog.com/en/1.1.0/", kind: "spec", verifiedAt: "2026-10-02T12:09:50Z" },
      ],
      video: {
        title: "What is Semantic Versioning? (semver)",
        channel: "Syntax",
        url: "https://www.youtube.com/watch?v=97i9pOa2EyE",
        videoId: "97i9pOa2EyE",
        verifiedAt: "2026-10-02T12:17:24Z",
      },
      alternateVideos: [
        {
          title: "Gitflow Hotfix Branch Example",
          channel: "Cameron McKenzie",
          url: "https://www.youtube.com/watch?v=5q75eeEYApk",
          videoId: "5q75eeEYApk",
          verifiedAt: "2026-10-02T12:17:24Z",
        },
        {
          title: "Software Versioning Explained - Semantic (SemVer), Calendar (CalVer), etc.",
          channel: "DevOps & AI Toolkit",
          url: "https://www.youtube.com/watch?v=xvPiZyx0cDc",
          videoId: "xvPiZyx0cDc",
          verifiedAt: "2026-10-02T12:17:24Z",
        },
      ],
      handbook: { stages: ["custom-release", "custom-support"], rules: ["hotfix-approval", "billing-bug-warranty", "billing-bug-after-warranty"] },
      sections: [
        {
          heading: "Hotfix vs patch: side by side",
          body:
            "**[[term:hotfix|Hotfix]]**\n- Unplanned and urgent: an outage, data loss, double charging, a security hole.\n- Goes to production outside the normal release cycle, kept as small as possible.\n- Some testing is skipped or shortened, so it carries risk. It must be merged back into the main code afterwards.\n- Typically same day for critical issues. Usually followed by a note to the client, and an [[term:rca|RCA]] for critical incidents.\n\n**[[term:patch|Patch]]**\n- Planned: a bundle of bug and security fixes, no new features.\n- Goes through the normal test and release process, including [[term:regression-test|regression testing]].\n- Typically bundled every few weeks during support.\n\n**Consequence for time and billing:** a hotfix interrupts planned work and puts more risk on production, so it should be reserved for high-severity problems. A patch is cheaper and safer per fix. Whether either is billed depends on [[term:warranty]] and support terms, not on the word used.",
        },
        {
          heading: "Version numbers: MAJOR.MINOR.PATCH",
          body:
            "Semantic Versioning gives each part of a [[term:version]] number a meaning:\n\n- **MAJOR** (2.0.0 → 3.0.0): changes that break compatibility. For an API, old clients may stop working.\n- **MINOR** (2.3.1 → 2.4.0): new features that do not break anything.\n- **PATCH** (2.4.0 → 2.4.1): backwards-compatible bug fixes only.\n\nSo a new reporting endpoint moves a Laravel API from 2.3.1 to 2.4.0, and a date-format fix in it moves it to 2.4.1.\n\n**Version vs build number on mobile.** An iOS or Android app carries two numbers: the version users see in the store (on iOS, CFBundleShortVersionString, such as 1.4.0) and a separate internal [[term:build]] number that goes up with every upload. Two builds can share one version. In UAT messages, name both.\n\n**A hotfix usually bumps the patch number too.** So a version like 2.4.1 does not tell you whether it was an emergency hotfix or a planned patch. The release notes and the process do.",
        },
        {
          heading: "Why hotfixes must be merged back",
          body:
            "In the common Gitflow model, a hotfix branch is taken from the production code (main), fixed, released, and then merged back into both main and the development branch.\n\nIf the merge back is skipped, the next planned release is built from code that never got the fix. The bug returns in production as a [[term:regression]], and the client sees the same defect twice. The PM's job is not to manage branches, but to ask one question after every hotfix: **\"Is it merged back, and is there a test so it can't come back?\"**",
        },
        {
          heading: "What good looks like: a worked example",
          body:
            "**A white-label pharmacy app for a client in Kenya, live for three weeks, running version 1.0.0.** In one morning the PM receives four reports.\n\n1. Some customers are charged twice when the payment page times out. High severity, money is affected. The PM gets approval as the hotfix rule requires, the team fixes it on a hotfix branch, tests the payment flow on staging and releases **1.0.1** that afternoon. The fix is merged back, a regression test is added, and an RCA follows.\n2. A misaligned label on one older Android phone. Low severity, workaround: none needed. **Next patch.**\n3. The order history export is slow. Medium severity, works. **Next patch.**\n4. The client wants a prescription reminder feature. Not a fix at all: a [[term:new-feature]] that would be a minor version (1.1.0), handled through a change request.\n\nTwo weeks later, items 2 and 3 plus three other small fixes ship together as **patch 1.0.2**, fully regression-tested and submitted to the stores in one go. The release notes list every fix under each version number.",
        },
        {
          heading: "How to say it to a client",
          body:
            "- Hotfix: \"This is affecting payments, so we're releasing an urgent fix today, outside the normal schedule. You'll get a short note when it's live and a root-cause report afterwards.\"\n- Patch: \"This doesn't stop anyone working, so we'll include it in the next patch release, which is fully tested. I'll send you the date.\"\n- Version: \"You're on version 1.0.1, build 23. If you still see the problem, please check Settings, About, and send me the numbers shown there.\"",
        },
        {
          heading: "Common mistakes and how to recover",
          body:
            "- **Hotfixing because the client is upset, not because severity is high.** Recover: assess severity first; offer the patch date with confidence.\n- **Hotfix not merged back.** The bug returns in the next release. Recover: check the merge after every hotfix and add a regression test.\n- **No version numbers in support replies.** Triage slows down. Recover: ask for the version and build in every bug report template.\n- **Calling a new feature a \"patch\" to slip it in.** It skips design and estimation. Recover: features go through change control and bump the minor version.\n- **Many hotfixes in a row.** It signals a testing gap. Recover: raise it in the retrospective and strengthen QA.",
        },
        {
          heading: "Your checklist",
          body:
            "1. Hotfix or patch is decided by severity, under the handbook's hotfix approval rule.\n2. Every hotfix is merged back and gets a regression test.\n3. Low and medium fixes are bundled into tested patch releases.\n4. Every release has a version number and release notes; mobile releases also name the build.\n5. Bug reports ask for the version and build the user is running.",
        },
      ],
      sop: [
        {
          title: "Oyelabs versioning and patch schedule",
          prompt: "[Oyelabs SOP – admin to fill] The versioning scheme Oyelabs uses for custom apps and white-label core products, how often patch releases are scheduled for clients in support, and who may approve a production hotfix out of hours.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-c03-hotfix-patch-version-q1",
          prompt: "Hours after go-live, a ticketing site double-charges cards. What is the right kind of fix?",
          options: ["A hotfix", "The next scheduled patch", "A minor version with new features", "A change request"],
          correctIndex: 0,
          explanation: "A serious live problem affecting money justifies an urgent, small fix outside the normal cycle.",
        },
        {
          id: "pmp-c03-hotfix-patch-version-q2",
          prompt: "Five low-severity bugs from the first month of support are fixed together, tested on staging and released. What is this?",
          options: ["A patch release", "A hotfix", "A major release", "A cutover"],
          correctIndex: 0,
          explanation: "Planned, bundled, fully tested fixes with no new features make a patch release.",
        },
        {
          id: "pmp-c03-hotfix-patch-version-q3",
          prompt: "A Laravel API at version 2.3.1 gets a new, backwards-compatible reporting endpoint. What should the next version be under Semantic Versioning?",
          options: ["2.4.0", "2.3.2", "3.0.0", "2.3.1-b"],
          correctIndex: 0,
          explanation: "A new backwards-compatible feature bumps MINOR and resets PATCH: 2.4.0.",
        },
        {
          id: "pmp-c03-hotfix-patch-version-q4",
          prompt: "The API changes the format of an existing response so older mobile app versions break. Which part of the version should change?",
          options: ["MAJOR", "MINOR", "PATCH", "Only the build number"],
          correctIndex: 0,
          explanation: "Breaking compatibility is a MAJOR change. It also signals that clients of the API need updating.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c03-hotfix-patch-version-q5",
          prompt: "A bug fixed by a hotfix last month reappears in the next planned release. What is the most likely cause?",
          options: [
            "The hotfix was not merged back into the development code",
            "The client reinstalled the app",
            "Semantic Versioning was used",
            "The patch release was too small",
          ],
          correctIndex: 0,
          explanation: "If the fix only lives on the production branch, the next release is built without it. Merge back and add a regression test.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c03-hotfix-patch-version-q6",
          prompt: "Which are typical features of a hotfix? (Select all that apply.)",
          options: [
            "Released outside the normal release cycle",
            "Kept as small as possible",
            "Followed by merging the fix back into the main code",
            "Used to add a new feature quickly",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Hotfixes are small, urgent and merged back. New features never belong in a hotfix.",
        },
        {
          id: "pmp-c03-hotfix-patch-version-q7",
          prompt: "A client sees version 1.4.0 in the store, but QA says the fix is in build 58 and the client is on build 57. How can both be true?",
          options: [
            "Mobile apps carry a user-facing version and a separate build number; two builds can share one version",
            "One of them must be wrong",
            "Build numbers only exist on Android",
            "The store shows the build number, not the version",
          ],
          correctIndex: 0,
          explanation: "The version (on iOS, CFBundleShortVersionString) and the build number are separate. Name both in UAT and support messages.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-c03-hotfix-patch-version-q8",
          prompt: "An angry client demands a hotfix for a misaligned icon on one screen. Nothing else is affected. What is the best reply?",
          options: [
            "Acknowledge it, explain it is low severity, and give the date of the next tested patch",
            "Hotfix it today to calm the client",
            "Refuse to fix it",
            "Call it a major release",
          ],
          correctIndex: 0,
          explanation: "Severity, not volume, decides hotfixes. A firm patch date keeps the client informed without adding production risk.",
        },
        {
          id: "pmp-c03-hotfix-patch-version-q9",
          prompt: "Which statements are true? (Select all that apply.)",
          options: [
            "A hotfix usually bumps the patch number, so the version alone does not show it was an emergency",
            "Whether a fix is billed depends on warranty and support terms, not on the word hotfix or patch",
            "Frequent hotfixes can signal a testing or quality problem",
            "A patch release normally adds new features",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Patches fix; they do not add features. The other statements are true.",
        },
      ],
      practice: {
        kind: "categorize",
        mode: "generic",
        prompt:
          "A Laravel and React field-service app for a client in Ireland is live at version 2.4.0 and inside its warranty window. Decide how each item should ship: an urgent hotfix, the next patch release, the next minor release, or a future major release.",
        categories: [
          { id: "hotfix", label: "Hotfix now" },
          { id: "patch", label: "Next patch release (2.4.x)" },
          { id: "minor", label: "Next minor release (2.5.0)" },
          { id: "major", label: "Future major release (3.0.0)" },
        ],
        items: [
          { id: "i1", text: "Engineers cannot log in at all since this morning; the business has stopped.", explanation: "A live outage: high severity, hotfix." },
          { id: "i2", text: "A date on the job summary PDF shows in US format for Irish users.", explanation: "Low severity, works: bundle into the next patch." },
          { id: "i3", text: "A new, approved feature: engineers can attach a customer signature to a job.", explanation: "A new backwards-compatible feature: minor version." },
          { id: "i4", text: "Customer phone numbers are visible to every logged-in engineer, not only the assigned one.", explanation: "A security and privacy problem in production: hotfix." },
          { id: "i5", text: "The API's job format is redesigned so that apps older than 2.x will stop working.", explanation: "Breaks compatibility: major version." },
          { id: "i6", text: "The job list sorts by creation date instead of the agreed scheduled date. Engineers have a workaround (the date filter).", explanation: "A real bug with a workaround: next patch." },
          { id: "i7", text: "A typo in the settings screen label.", explanation: "Cosmetic: next patch." },
          { id: "i8", text: "A new, approved report for managers: jobs completed per engineer per week.", explanation: "A new feature that breaks nothing: minor version." },
          { id: "i9", text: "Completed jobs are being deleted when an engineer goes offline and reconnects.", explanation: "Data loss in production: hotfix." },
        ],
        answer: { i1: "hotfix", i2: "patch", i3: "minor", i4: "hotfix", i5: "major", i6: "patch", i7: "patch", i8: "minor", i9: "hotfix" },
      },
    },
  ],
} satisfies Module;
