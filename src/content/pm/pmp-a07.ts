import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a07",
  trackId: "pm",
  name: "Custom lifecycle: Architecture & Sprint 0",
  description:
    "The foundations a custom project needs before feature sprints start: repositories, environments, CI/CD, a refined backlog, a definition of ready and done, and architecture decisions written down so they survive the people who made them.",
  topics: [
    // ---------------------------------------------------------------------------------------------
    // Sprint 0
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-a07-sprint0",
      moduleId: "pmp-a07",
      trackId: "pm",
      title: "Sprint 0: setting up to deliver",
      summary: `[[term:sprint-0|Sprint 0]] is the short set-up period before the first feature [[term:sprint|sprint]]. The team creates the repositories, the [[term:dev-environment|dev]] and [[term:staging-environment|staging]] environments, the build pipeline, coding standards, and a [[term:backlog|backlog]] refined enough to plan the first sprints. It is also where the team agrees the [[term:definition-of-ready|definition of ready]] and the [[term:definition-of-done|definition of done]].

Note that Sprint 0 is common practice, not Scrum. The Scrum Guide does not mention Sprint 0, the definition of ready or acceptance criteria. That matters when a client's in-house Scrum expert says "Sprint 0 is not real Scrum". The honest answer is: correct, it is a practical set-up period that agencies use because a new team on a new codebase needs it.

Why it matters at an agency: every week of a fixed bid is paid for. If environments are not ready, developers wait, or worse, they build without a staging server and the client has nowhere to see the work. Skipped set-up returns as mid-project firefighting. Typically Sprint 0 runs one to two weeks.

The common mistake is treating Sprint 0 as invisible internal work. The client should see a short plan, know what they owe (accounts, API keys, domain access), and see the exit criteria met. Otherwise they ask in week three why "nothing has been built yet".`,
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Scrum Guides: The Scrum Guide (2020)", url: "https://scrumguides.org/scrum-guide.html", kind: "spec", verifiedAt: "2026-10-02T11:51:24Z" },
        { label: "The Twelve-Factor App: Config", url: "https://12factor.net/config", kind: "spec", verifiedAt: "2026-10-02T11:54:59Z" },
        { label: "The Twelve-Factor App: Dev/prod parity", url: "https://12factor.net/dev-prod-parity", kind: "spec", verifiedAt: "2026-10-02T11:55:00Z" },
        { label: "GOV.UK Service Manual: Maintaining version control in coding", url: "https://www.gov.uk/service-manual/technology/maintaining-version-control-in-coding", kind: "docs", verifiedAt: "2026-10-02T11:51:27Z" },
      ],
      video: {
        title: "What is Sprint Zero in Scrum? Everything You Should Know",
        channel: "Agile Coach",
        url: "https://www.youtube.com/watch?v=fmHPOaTcduk",
        videoId: "fmHPOaTcduk",
        verifiedAt: "2026-10-02T12:17:07Z",
      },
      alternateVideos: [
        {
          title: "What is Sprint Zero?",
          channel: "iZenBridge Consultancy Pvt Ltd.",
          url: "https://www.youtube.com/watch?v=JARjUZG4oJE",
          videoId: "JARjUZG4oJE",
          verifiedAt: "2026-10-02T12:17:07Z",
        },
        {
          title: "Do you need a Sprint Zero?",
          channel: "All Things Agile",
          url: "https://www.youtube.com/watch?v=oovN9u_rWDk",
          videoId: "oovN9u_rWDk",
          verifiedAt: "2026-10-02T12:17:07Z",
        },
      ],
      handbook: {
        stages: ["custom-sprint-0"],
        templates: ["raid-log-template"],
      },
      sections: [
        {
          heading: "What Sprint 0 produces",
          body: `By the end of Sprint 0 the team should have:

- **Repositories** for each codebase (for example the Laravel API and admin, the React web app, the mobile app), with branch rules and code review switched on.
- **Environments:** a working [[term:dev-environment|dev environment]] and a [[term:staging-environment|staging environment]] the client can reach. Plan the [[term:uat-environment|UAT environment]] and [[term:production-environment|production]] now, even if they are built later.
- **A pipeline** that builds and deploys to staging automatically, so every sprint demo runs on a real [[term:build|build]].
- **Configuration kept out of code.** Secrets and settings live in environment configuration, not in the repository.
- **Architecture decisions** written down (see the next topic).
- **A refined backlog** for the first two sprints, with [[term:acceptance-criteria|acceptance criteria]] on each story.
- **An agreed definition of ready and done**, so "done" means the same thing to developers, QA and the PM.
- **A RAID log** with the technical risks and [[term:client-dependency|client dependencies]] found during set-up.`,
        },
        {
          heading: "Entry, exit and who does what",
          body: `**Start Sprint 0 when** requirements and designs are stable enough to plan and the team is allocated.

**Sprint 0 is finished when:**
- architecture is documented and reviewed;
- dev and staging environments work;
- the backlog is refined for the first sprints;
- the definition of ready and done is agreed.

**Roles, in short** (the full [[term:raci|RACI]] is in the stage card below):
- The tech lead makes and documents architecture decisions and is accountable for repositories, environments and the pipeline.
- Developers set them up; QA is consulted so test environments and data are planned.
- The PM refines the backlog and plans the first sprint, and is accountable for the definition of ready and done being agreed.
- The client is typically invited to an optional architecture walkthrough with their technical team.`,
        },
        {
          heading: "Definition of ready and definition of done",
          body: `These two short lists stop most sprint arguments before they start.

The **[[term:definition-of-ready|definition of ready]]** says when a story may enter a sprint. Typical items: acceptance criteria written; designs approved for the screens involved; dependencies (API keys, third-party access) available; estimated by the team.

The **[[term:definition-of-done|definition of done]]** says when a story counts as finished. Typical items: code reviewed and merged; unit tests pass; deployed to staging; tested by QA against the acceptance criteria; no open high-severity bugs on it.

The Scrum Guide says work cannot be part of an increment unless it meets the definition of done. For a PM, that is the line between "the developer says it is finished" and "we can show it to the client".`,
        },
        {
          heading: "What the client owes during Sprint 0",
          body: `Sprint 0 is often where client dependencies first bite. Typical items:

- domain and DNS access, or a decision on who buys the domain;
- cloud or [[term:hosting-account|hosting account]] access if the client owns hosting;
- [[term:api-keys|API keys]] and sandbox accounts for payment, maps, SMS or email providers;
- the [[term:apple-developer-account|Apple developer account]] and [[term:google-play-console|Google Play Console]], which can take time to set up;
- test data, or a sample of real data, for migration and testing.

List each with an owner and a date, send it to the [[term:spoc|SPOC]], and put each one in the [[term:raid-log|RAID log]]. Credentials go only through a secure channel, never chat or email.`,
        },
        {
          heading: "Your checklist",
          body: `1. Create repositories with branch protection and code review.
2. Get dev and staging environments working, with the pipeline deploying to staging.
3. Keep secrets and settings in environment configuration, not code.
4. Document the key architecture decisions and have them reviewed.
5. Refine the backlog for the first two sprints with acceptance criteria.
6. Agree the definition of ready and done with the tech lead and QA.
7. Send the client a dated list of what they owe, and log it in the RAID log.
8. Tell the client what Sprint 0 delivered, so set-up work is visible.`,
        },
      ],
      sop: [
        {
          title: "Oyelabs Sprint 0 standards",
          prompt:
            "[Oyelabs SOP – admin to fill] Oyelabs' standard repository host and branch rules, the default environments for a custom project, which CI/CD tool is used, the company definition of ready and done, and whether the client sees a Sprint 0 report.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a07-sprint0-q1",
          prompt: "What is Sprint 0 mainly for?",
          options: [
            "Setting up repositories, environments, pipeline, backlog and working agreements before feature sprints",
            "Building the most important feature first",
            "Running UAT on the previous phase",
            "Negotiating the contract price",
          ],
          correctIndex: 0,
          explanation:
            "Sprint 0 creates the foundations so the first feature sprint can start at full speed. Features, UAT and pricing belong to other stages.",
        },
        {
          id: "pmp-a07-sprint0-q2",
          prompt:
            "The client's in-house Scrum coach says \"Sprint 0 does not exist in Scrum\". What is the accurate reply?",
          options: [
            "Correct, the Scrum Guide does not define it; it is a common set-up practice agencies use for a new team and codebase",
            "Incorrect, Sprint 0 is defined in the Scrum Guide",
            "Agree and cancel the set-up work",
            "Say that Scrum requires a two-week Sprint 0",
          ],
          correctIndex: 0,
          explanation:
            "The Scrum Guide does not mention Sprint 0, the definition of ready or acceptance criteria. Being accurate about that, and explaining why the practice helps, keeps credibility.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a07-sprint0-q3",
          prompt: "Which of these are exit criteria for Sprint 0? (Select all that apply.)",
          options: [
            "Dev and staging environments working",
            "Backlog refined for the first sprints",
            "Definition of ready and done agreed",
            "Written UAT sign-off received",
            "The app published on the stores",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Sprint 0 ends when foundations, backlog and working agreements are ready. UAT sign-off and store publishing are much later stages.",
        },
        {
          id: "pmp-a07-sprint0-q4",
          prompt: "Which item belongs in a typical definition of ready rather than the definition of done?",
          options: [
            "Designs for the screens involved are approved",
            "Code is deployed to staging",
            "QA has tested it against the acceptance criteria",
            "Code is reviewed and merged",
          ],
          correctIndex: 0,
          explanation:
            "Ready is about whether a story can enter a sprint, so its inputs must exist. Deployment, testing and review are about whether it is finished.",
        },
        {
          id: "pmp-a07-sprint0-q5",
          prompt:
            "To save time, the tech lead proposes skipping the staging environment and demoing from a developer's laptop. What is the main risk?",
          options: [
            "The client has nowhere to review real builds, demos fail on machine-specific setups, and environment problems surface mid-project",
            "There is no risk; laptops are faster",
            "The client will be charged for staging",
            "Developers cannot write code without staging",
          ],
          correctIndex: 0,
          explanation:
            "No staging environment for client review is a classic Sprint 0 pitfall. Demos from laptops hide deployment problems until the worst moment.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a07-sprint0-q6",
          prompt: "Who is typically accountable for agreeing the definition of ready and done, according to the stage RACI?",
          options: ["The PM, with the tech lead responsible and QA and developers consulted", "The client sponsor", "The designer", "The BD lead"],
          correctIndex: 0,
          explanation:
            "The tech lead drafts it, but the PM is accountable for it being agreed, because the PM plans sprints and reports progress against it.",
        },
        {
          id: "pmp-a07-sprint0-q7",
          prompt: "Which client dependencies commonly appear during Sprint 0? (Select all that apply.)",
          options: [
            "Payment provider sandbox API keys",
            "Domain and DNS access",
            "Apple developer account and Google Play Console set-up",
            "The developers' code review comments",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Keys, domains and store accounts are owned by the client and often slow to arrive. Code review comments are internal work.",
        },
        {
          id: "pmp-a07-sprint0-q8",
          prompt:
            "A developer commits the production database password to the repository \"just for now\". What principle does this break?",
          options: [
            "Configuration and secrets belong in the environment, not in code, and secrets are shared only through a secure channel",
            "Passwords must be at least twelve characters",
            "Only the PM may know passwords",
            "Repositories must be public",
          ],
          correctIndex: 0,
          explanation:
            "Twelve-factor config keeps settings out of code, and secrets in a repository spread to everyone with access and live forever in history.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a07-sprint0-q9",
          prompt: "In week three the client asks why \"nothing has been built yet\". What would have prevented the question?",
          options: [
            "Sharing a short Sprint 0 plan and a summary of what it delivered, including what the client owed",
            "Skipping Sprint 0 entirely",
            "Starting with the hardest feature",
            "Waiting until the first demo to explain",
          ],
          correctIndex: 0,
          explanation:
            "Set-up work is invisible unless you show it. A plan and an exit summary make the value of Sprint 0 clear.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "This is the PM's Sprint 0 exit summary for a Laravel and React web platform for a logistics company in the Netherlands. Mark the lines that show Sprint 0 is not really finished, or that break good practice.",
        segments: [
          { id: "s1", text: "Repositories created for the Laravel API and the React web app, with branch protection and code review on.", issue: null },
          {
            id: "s2",
            text: "Staging environment: postponed to sprint 3; until then demos run from the tech lead's laptop.",
            issue: "A working staging environment is a Sprint 0 exit criterion; demos from a laptop hide deployment problems and give the client nowhere to review.",
          },
          { id: "s3", text: "Pipeline builds every merge to main and deploys to the dev environment.", issue: null },
          {
            id: "s4",
            text: "Database and mail passwords are in the repository's .env.example so the team can find them easily.",
            issue: "Secrets must not be committed; they belong in environment configuration and are shared through a secure channel.",
          },
          { id: "s5", text: "Architecture decisions recorded as short ADRs and reviewed by the tech lead and a senior developer.", issue: null },
          {
            id: "s6",
            text: "Backlog: sprint 1 stories exist; acceptance criteria will be added during the sprint.",
            issue: "Stories without acceptance criteria do not meet a definition of ready, so the backlog is not refined for the first sprint.",
          },
          { id: "s7", text: "Definition of ready and done agreed with the tech lead and QA, and shared with the client.", issue: null },
          { id: "s8", text: "Client dependencies (map API key, SMTP account, domain access) sent to the SPOC with owners and dates, and logged in the RAID log.", issue: null },
          {
            id: "s9",
            text: "The client does not need to hear about Sprint 0 since no features were built.",
            issue: "Sprint 0 should be visible to the client: a short summary of what it delivered avoids the \"nothing has been built\" question.",
          },
          { id: "s10", text: "Sprint 1 planning is booked for Monday.", issue: null },
        ],
        askExplanation: true,
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Architecture decisions
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-a07-architecture-decisions",
      moduleId: "pmp-a07",
      trackId: "pm",
      title: "Architecture decisions and ADRs",
      summary: `Every custom project makes a handful of decisions that are expensive to reverse: the backend framework, the mobile approach (native or cross-platform), single or multi-tenant data, where files and media are stored, which payment or messaging provider to use, and how the system will be hosted. At an agency, these decisions are often made in a call in week one and forgotten by month four, when a new developer, the client's new CTO or an auditor asks "why did you do it this way?".

An architecture decision record (ADR) is the cheap fix. It is a short note for each significant decision: the context, the options considered, the decision, and the consequences, good and bad. ADRs are kept in order, with the codebase, and never rewritten. A later change gets a new ADR that supersedes the old one. The tech lead owns them; the PM makes sure they exist.

The PM's interest is commercial as much as technical. Many decisions carry client consequences: a provider with monthly fees, a [[term:constraint|constraint]] from the client's IT policy, an [[term:assumption|assumption]] about traffic. Those belong in the [[term:raid-log|RAID log]] and in the client's view, not just the code. When a client later asks for something the architecture does not support, the ADR shows what was agreed and why, which turns a blame conversation into a [[term:change-request|change request]].

The common mistake is not writing them at all, or writing a twenty-page design document nobody updates. One page per decision, written when the decision is made, beats both.`,
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Learn: Maintain an architecture decision record (ADR)", url: "https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record", kind: "docs", verifiedAt: "2026-10-02T11:54:30Z" },
        { label: "Michael Nygard (Cognitect): Documenting architecture decisions", url: "https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions", kind: "article", verifiedAt: "2026-10-02T12:08:03Z" },
        { label: "adr.github.io: Architectural Decision Records", url: "https://adr.github.io/", kind: "article", verifiedAt: "2026-10-02T12:07:58Z" },
        { label: "GOV.UK Service Manual: Choosing technology: an introduction", url: "https://www.gov.uk/service-manual/technology/choosing-technology-an-introduction", kind: "docs", verifiedAt: "2026-10-02T11:51:27Z" },
      ],
      video: {
        title: "Architecture Decision Records (ADR) as a LOG that answers \"WHY?\"",
        channel: "CodeOpinion",
        url: "https://www.youtube.com/watch?v=6H6zfCNeqek",
        videoId: "6H6zfCNeqek",
        verifiedAt: "2026-10-02T12:17:07Z",
      },
      alternateVideos: [
        {
          title: "Lesson 55 - Architecture Decision Records",
          channel: "Software Architecture Monday",
          url: "https://www.youtube.com/watch?v=LMBqGPLvonU",
          videoId: "LMBqGPLvonU",
          verifiedAt: "2026-10-02T12:17:08Z",
        },
        {
          title: "Architecture Decision Records (ADR) - The Basics",
          channel: "Saxion Media Xpert Centre",
          url: "https://www.youtube.com/watch?v=7Gqn2dbt_JY",
          videoId: "7Gqn2dbt_JY",
          verifiedAt: "2026-10-02T12:17:08Z",
        },
      ],
      handbook: {
        stages: ["custom-sprint-0"],
        rules: ["cr-when-needed", "secure-credential-sharing"],
        templates: ["raid-log-template"],
      },
      sections: [
        {
          heading: "What an ADR contains",
          body: `Keep it to one page. A common shape, from Michael Nygard's original format:

- **Title and number:** "ADR-004: Use a managed queue for SMS reminders".
- **Status:** proposed, accepted, or superseded by a later ADR.
- **Context:** the forces at play. Requirements, [[term:constraint|constraints]], [[term:assumption|assumptions]], budget, the client's IT policy, the team's skills.
- **Options considered:** two or three real options with their trade-offs.
- **Decision:** what was chosen, in one or two sentences.
- **Consequences:** what becomes easier, what becomes harder, any running cost, and what would make you revisit it.

Write it when the decision is made, not at the end of the project. Never edit an accepted ADR to change the decision; write a new one that supersedes it, so the history stays honest.`,
        },
        {
          heading: "Which decisions deserve an ADR",
          body: `Not every choice needs a record. Write one when the decision is **expensive to reverse** or **affects the client**.

Usually worth an ADR:
- backend framework and major libraries;
- native versus cross-platform mobile;
- single-tenant or multi-tenant data;
- hosting provider and region (data residency often matters to overseas clients);
- third-party providers for payments, SMS, email, maps or video, especially those with monthly fees the client will pay;
- authentication approach (passwords, social login, OTP, single sign-on);
- how files and media are stored and served.

Usually not worth an ADR: naming conventions, a small utility library, a refactor inside one module.`,
        },
        {
          heading: "The PM's part: turning decisions into client facts",
          body: `The tech lead owns the technical content. The PM makes sure decisions reach the right places.

- **The client:** decisions with running costs, data-residency effects or vendor lock-in should be explained in plain words and, where the client must agree, confirmed in writing. Typically the client's technical team is invited to an optional architecture walkthrough during Sprint 0.
- **The RAID log:** each decision's key assumptions ("traffic under 10,000 bookings a day") and risks go into the [[term:raid-log|RAID log]], so you notice when reality changes.
- **The scope baseline:** if a later request breaks an assumption (a second country, ten times the traffic, a new provider), the ADR is the evidence that this is a [[term:change-request|change request]], not a [[term:bug|bug]].
- **Handover:** ADRs are part of [[term:knowledge-transfer|knowledge transfer]]. A client's future team inherits the reasoning, not just the code.`,
        },
        {
          heading: "What good looks like: a worked example",
          body: `A clinic chain in the UK has a Laravel API and admin panel and a React Native patient app. The SOW includes SMS appointment reminders. In Sprint 0 the tech lead must choose how reminders are sent.

**ADR-004: Send reminders through a scheduled queue and a hosted SMS provider.**

- **Context:** up to 3,000 appointments a day (client estimate, logged as an assumption). Reminders 24 hours before each appointment. The client's IT policy requires UK data hosting. The client pays the SMS provider directly.
- **Options:** (a) a cron job that sends directly from the app server; (b) a queue with a worker and a hosted SMS provider with UK data residency; (c) the client's existing marketing platform.
- **Decision:** option (b).
- **Consequences:** retries and failures are visible in the admin panel; scales well past the estimate; adds a monthly provider fee paid by the client; option (c) was rejected because its API cannot send per-appointment messages.

**What the PM does with it.** The PM explains the provider fee to the client SPOC in plain words and gets written confirmation that the client will open the provider account (a [[term:client-dependency|client dependency]] with a date). The 3,000-a-day assumption goes into the RAID log.

**Four months later** the client asks for WhatsApp reminders as well. The PM points to ADR-004 and the signed scope, and raises a CR for a second channel. Nobody argues about whether it was "always meant to be included".`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **Decisions were made on a call and never written down.** Ask the tech lead to write short ADRs for the five most expensive decisions now, dated today, with "decided in week one" in the context. Late is far better than never.
- **A decision has a client cost nobody told the client about.** Tell them now, in writing, with the reason and any alternatives. Discovering a monthly fee at go-live damages trust far more than hearing it late in delivery.
- **Someone edited an old ADR to match what was built.** Restore the original and write a new ADR that supersedes it. The point of the record is an honest history.
- **The client's new CTO wants to change the framework mid-project.** Walk through the ADR, the consequences and the cost of switching. If they still want it, it is a change request with a big impact on time and cost, decided by the sponsor.
- **The architecture document is forty pages and out of date.** Do not try to update it all. Start keeping short ADRs from today and link the old document as background.`,
        },
        {
          heading: "Your checklist",
          body: `1. List the decisions that are expensive to reverse or affect the client.
2. Make sure the tech lead writes a one-page ADR for each, when it is made.
3. Keep ADRs numbered, in the repository, and never rewrite accepted ones.
4. Explain decisions with client costs or constraints in plain words, and confirm in writing.
5. Copy key assumptions and risks into the RAID log.
6. Use ADRs as evidence when a later request breaks an assumption.
7. Include ADRs in the handover and knowledge-transfer pack.`,
        },
      ],
      sop: [
        {
          title: "Where Oyelabs keeps architecture decisions",
          prompt:
            "[Oyelabs SOP – admin to fill] Whether Oyelabs uses ADRs or another format, where they live (repository folder, wiki), who must review a decision, and which decisions must be confirmed with the client in writing.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a07-architecture-decisions-q1",
          prompt: "What is an architecture decision record (ADR)?",
          options: [
            "A short note for one significant decision: context, options, decision and consequences",
            "A forty-page design document covering the whole system",
            "The client's signed approval of the SOW",
            "A list of every commit in the repository",
          ],
          correctIndex: 0,
          explanation:
            "An ADR is one page per decision, written when the decision is made. Large design documents tend to go stale.",
        },
        {
          id: "pmp-a07-architecture-decisions-q2",
          prompt: "Which decisions usually deserve an ADR? (Select all that apply.)",
          options: [
            "Native versus cross-platform for the mobile app",
            "Choosing an SMS provider the client will pay monthly",
            "Hosting region where the client has data-residency rules",
            "The name of a private helper function",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Write ADRs for decisions that are expensive to reverse or affect the client. A helper function's name is neither.",
        },
        {
          id: "pmp-a07-architecture-decisions-q3",
          prompt:
            "Six months on, the team switched from one payment provider to another. What should happen to the original ADR?",
          options: [
            "Leave it unchanged, mark it superseded, and write a new ADR for the switch",
            "Edit the original so it names the new provider",
            "Delete it, since it is no longer true",
            "Nothing; ADRs are only written at the start",
          ],
          correctIndex: 0,
          explanation:
            "ADRs are a history. Superseding keeps the reasoning for both decisions; editing or deleting hides why the first choice was made.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a07-architecture-decisions-q4",
          prompt: "Who normally owns the technical content of ADRs, and what is the PM's part?",
          options: [
            "The tech lead owns the content; the PM makes sure they exist and that client-relevant consequences reach the client and the RAID log",
            "The PM writes them; the tech lead approves the wording",
            "The client writes them; Oyelabs signs them",
            "QA owns them because they test the system",
          ],
          correctIndex: 0,
          explanation:
            "Architecture decisions are the tech lead's responsibility in the Sprint 0 RACI. The PM turns their consequences into client facts and tracked assumptions.",
        },
        {
          id: "pmp-a07-architecture-decisions-q5",
          prompt:
            "An ADR assumed up to 3,000 bookings a day. The client now plans a national campaign expecting 40,000. What is this, and what do you do?",
          options: [
            "A change to a recorded assumption: assess the impact with the tech lead and raise a change request if work is needed",
            "A bug, because the system should handle any load",
            "Nothing, because performance is always included",
            "A clarification; explain that the system will cope",
          ],
          correctIndex: 0,
          explanation:
            "The assumption was recorded and agreed. Breaking it changes the basis of the design, so the impact is assessed and handled through change control.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a07-architecture-decisions-q6",
          prompt: "Which parts of an ADR are most useful to share with a non-technical client sponsor?",
          options: [
            "The decision in plain words and its consequences, such as running costs or data location",
            "The full code samples behind each option",
            "Only the ADR number",
            "Nothing: ADRs are never shared with clients",
          ],
          correctIndex: 0,
          explanation:
            "Sponsors care about what it means for them: cost, risk, lock-in and data. Code samples do not help them decide.",
        },
        {
          id: "pmp-a07-architecture-decisions-q7",
          prompt:
            "You discover in month three that a chosen map provider has a monthly fee the client was never told about. What is the best action?",
          options: [
            "Tell the client now in writing, with the reason for the choice, the fee, and any alternatives",
            "Wait until go-live and include it in the handover",
            "Quietly switch to a free provider without telling anyone",
            "Absorb the fee into the project budget",
          ],
          correctIndex: 0,
          explanation:
            "A late surprise is better handled early and in writing. Hiding it until go-live, or switching silently, damages trust and may create new risks.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a07-architecture-decisions-q8",
          prompt: "Where should key assumptions from architecture decisions also be recorded? (Select all that apply.)",
          options: [
            "In the RAID log, so changes in reality are noticed",
            "In the handover and knowledge-transfer pack",
            "In the ADR's context section",
            "In the developers' personal notes only",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Assumptions belong in the ADR, are tracked in the RAID log and travel with the handover. Personal notes disappear when people leave.",
        },
        {
          id: "pmp-a07-architecture-decisions-q9",
          prompt:
            "Mid-project, the client's newly hired CTO wants to switch the backend framework. What is the right handling?",
          options: [
            "Walk through the ADR and the cost of switching; if they still want it, it is a change request decided by the sponsor",
            "Agree, because the client is always right",
            "Refuse to discuss it",
            "Switch quietly in the next sprint",
          ],
          correctIndex: 0,
          explanation:
            "The ADR shows why the choice was made. A switch has a large time and cost impact, so it goes through change control with the sponsor deciding.",
        },
      ],
      practice: {
        kind: "write",
        variant: "explain",
        prompt:
          "Write a short email to the client SPOC (a non-technical operations director) explaining the decision in ADR-006 below, what it means for them, and what you need from them. Plain English, no jargon.",
        context: `**Project:** React Native delivery app and Laravel admin for a grocery chain in Oman.

**ADR-006 (accepted): Push notifications through a hosted messaging service.**
- Context: order-status notifications to up to 20,000 customers (client estimate). Both iOS and Android. The client's IT policy prefers hosting in the Middle East region.
- Options: (a) send directly to Apple and Google from our server; (b) a hosted notification service; (c) SMS only.
- Decision: (b), the hosted notification service, using its Middle East region.
- Consequences: delivery reports visible in admin; scales past the estimate; free up to a usage tier, then a monthly fee paid by the client; SMS (c) rejected as too costly per message for order updates.
- Client dependency: the client creates the service account in its own name by 12 March and invites Oyelabs as a user.`,
        wordLimit: 220,
        rubric: [
          {
            id: "decision",
            label: "States the decision plainly",
            description: "Explains in one or two plain sentences what was chosen and why, without technical jargon such as APNs, FCM or SDK.",
            weight: 1,
          },
          {
            id: "consequences",
            label: "Names what it means for the client",
            description: "Mentions the possible monthly fee above a usage tier paid by the client, the regional hosting that suits their IT policy, and the benefit (delivery reports, scale).",
            weight: 1.5,
          },
          {
            id: "ask",
            label: "Makes a clear, dated ask",
            description: "Asks the client to create the account in its own name by 12 March and invite Oyelabs, and says what happens if it is late.",
            weight: 1.5,
          },
          {
            id: "tone",
            label: "Short and client-friendly",
            description: "Short paragraphs, the main point first, under the word limit, professional and easy to act on.",
            weight: 1,
          },
        ],
        sampleAnswer: `Subject: How the app will send order notifications – one action needed by 12 March

Hi Fatma,

A quick update on a technical decision and one thing we need from you.

To tell customers about their order status, the app will use a hosted notification service rather than sending messages ourselves or by SMS. It handles both iPhone and Android, shows delivery reports in your admin panel, and copes comfortably with the 20,000 customers you expect. We will use its Middle East region, in line with your IT policy. SMS was ruled out because it costs much more per message.

What it means for you: the service is free up to a usage level, then charges a monthly fee, which is billed to your company. We will share the current pricing page so you can plan for it.

What we need: please create the account in your company's name by 12 March and invite us as a user. If it arrives later, notification testing moves back by the same amount.

Happy to walk you through it on a short call.

Best regards,
Ravi (Project Manager)`,
      },
    },
  ],
} satisfies Module;
