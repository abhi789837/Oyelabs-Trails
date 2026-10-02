import type { Module } from "@/types/curriculum";

export default {
  id: "pmp-a06",
  trackId: "pm",
  name: "Custom lifecycle: UI/UX & design approval",
  description:
    "How a custom project moves from signed requirements to approved designs that developers can build from: wireframes, mockups and prototypes, review rounds, written approval and hand-off. The advanced topic is about running review rounds so design does not become an unpaid, open-ended loop.",
  topics: [
    // ---------------------------------------------------------------------------------------------
    // The design process
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-a06-design-process",
      moduleId: "pmp-a06",
      trackId: "pm",
      title: "The design process: wireframes to approved UI",
      summary: `Design is where the client first *sees* what they bought. Until now, scope lived in the [[term:sow|SOW]], the [[term:brd|BRD]] and the [[term:user-story|user stories]]. Once screens appear, the client reacts to them, and every reaction is either inside the agreed scope or a change. The PM's job is to make sure design turns the signed requirements into screens, not into a second round of discovery.

The usual path runs in increasing fidelity. A [[term:wireframe|wireframe]] fixes structure and flow cheaply. A [[term:mockup|mockup]] adds the brand, colours and real content. A clickable [[term:prototype|prototype]] lets the client walk a journey before code exists. Then comes written [[term:design-approval|design approval]] and the hand-off to developers. Low fidelity first is a deliberate trade-off: changing a box on a wireframe costs minutes, while changing a coded screen costs days.

At an agency the stage has clear gates. Design should start only when requirements for those screens are signed off or stable and the brand assets have arrived. It ends with approval in writing, the revision rounds used and recorded, and a hand-off the tech lead accepts. Follow the Oyelabs rule in the handbook card below for revision rounds.

The common mistake is jumping straight to polished mockups to impress the client. They then debate colours while the flow is still wrong, burn the revision rounds on detail, and approve screens that do not match the stories.`,
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "GOV.UK Service Manual: Making prototypes", url: "https://www.gov.uk/service-manual/design/making-prototypes", kind: "docs", verifiedAt: "2026-10-02T11:51:26Z" },
        { label: "Nielsen Norman Group: UX prototypes - low vs high fidelity", url: "https://www.nngroup.com/articles/ux-prototype-hi-lo-fidelity/", kind: "article", verifiedAt: "2026-10-02T11:55:37Z" },
        { label: "Nielsen Norman Group: Wireflows", url: "https://www.nngroup.com/articles/wireflows/", kind: "article", verifiedAt: "2026-10-02T11:55:36Z" },
        { label: "Figma Learn: Guide to Dev Mode", url: "https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode", kind: "docs", verifiedAt: "2026-10-02T11:55:31Z" },
      ],
      video: {
        title: "Step-by-Step UX Project Workflow",
        channel: "What The *UX! Studio",
        url: "https://www.youtube.com/watch?v=Nf3RRfLzvXI",
        videoId: "Nf3RRfLzvXI",
        verifiedAt: "2026-10-02T12:17:06Z",
      },
      alternateVideos: [
        {
          title: "Figma tutorial: Collaboration and handoff in Dev Mode",
          channel: "Figma",
          url: "https://www.youtube.com/watch?v=xCJsRuH7v9w",
          videoId: "xCJsRuH7v9w",
          verifiedAt: "2026-10-02T12:17:06Z",
        },
        {
          title: "How to Hand off your UX designs to developers like a PRO",
          channel: "Design With Destiny",
          url: "https://www.youtube.com/watch?v=Kmp85DeC3K4",
          videoId: "Kmp85DeC3K4",
          verifiedAt: "2026-10-02T12:17:06Z",
        },
      ],
      handbook: {
        stages: ["custom-design"],
        rules: ["design-revision-rounds", "cr-when-needed"],
      },
      sections: [
        {
          heading: "Wireframe, mockup, prototype: what each one is for",
          body: `Each artefact answers a different question. Show the client the right one at the right time.

- **[[term:wireframe|Wireframe]]:** "Is the structure and flow right?" Grey boxes, real labels, no colour. Cheap to change. Use it to confirm that every user story has a screen and every screen has a way in and out.
- **[[term:mockup|Mockup]]:** "Does it look right?" Brand colours, fonts, icons and realistic content. Use it once the flow is agreed, so feedback is about look, not structure.
- **[[term:prototype|Prototype]]:** "Does it feel right?" Linked screens the client can click through on a phone or browser. Use it for the two or three journeys that matter most (sign-up, checkout, booking), not for every screen.
- **Design system or style guide:** the reusable buttons, inputs, colours and spacing. Developers need it to build consistently.

A wireflow (screens drawn with the arrows between them) is a useful middle step for mobile apps, because most client confusion is about what happens *after* a tap.`,
        },
        {
          heading: "Entry, exit and who does what",
          body: `**Start design when:**
- the requirements for those screens are signed off, or stable enough that the client will not reopen them;
- the [[term:brand-kit|brand kit]] (logo, colours, fonts) has arrived. If it has not, log it as a [[term:client-dependency|client dependency]] with a date.

**Design is finished when:**
- the client has given written [[term:design-approval|design approval]] for the screen set;
- the revision rounds used are recorded;
- the designer has handed off to the developers and the tech lead has accepted the files.

**Roles, in short** (the full [[term:raci|RACI]] is in the stage card below):
- The designer creates and presents the designs.
- The PM is accountable for running the reviews, collecting feedback and getting approval on time.
- The client [[term:spoc|SPOC]] consolidates feedback and signs off; the client sponsor is accountable for the approval.
- The tech lead checks designs are buildable within the [[term:estimate|estimate]] before they go to the client.

Typically the stage takes one to four weeks and often overlaps with [[term:discovery|discovery]] for later modules.`,
        },
        {
          heading: "Why the tech lead sees designs before the client does",
          body: `A beautiful screen can hide an expensive build. A swipe-to-reorder list, a live map with clustering, an offline mode, or a custom chart may each be several days of work that the estimate never included.

Ask the tech lead to review each design set before the client review. The question is simple: "Can we build exactly this inside the estimate?" If not, the designer simplifies it, or the PM flags the difference to the client as an option with a cost. Showing the client a design you cannot afford to build creates an expectation you will later have to take back, and that is far harder than never showing it.

Also check designs against platform conventions. Clients sometimes ask for patterns that the iOS Human Interface Guidelines or Material Design advise against. Citing the platform guidance keeps the discussion about users, not taste.`,
        },
        {
          heading: "Hand-off to developers",
          body: `Approval is not the end of design. The hand-off decides whether developers build what was approved.

A good hand-off includes:
- the approved screens marked as final, with the approval date and version;
- the design system: colours, type, spacing and components;
- every state: empty, loading, error, offline, long text, permission denied;
- the assets exported, or available through the design tool's developer mode;
- notes on interactions and animations, or a prototype link for them.

Missing states are the most common hand-off gap. If the designer only drew the happy path, developers will invent the error screens, and the client will see something they never approved.`,
        },
        {
          heading: "Your checklist",
          body: `1. Confirm the requirements for the screens are signed off or stable.
2. Log the brand kit as a client dependency with a date if it has not arrived.
3. Agree the review plan: which screen sets, in which order, and how many rounds the contract includes.
4. Start with wireframes or wireflows for the key journeys.
5. Have the tech lead review each set before the client does.
6. Move to mockups and prototypes only once the flow is agreed.
7. Get approval in writing from the named approver, per screen set.
8. Hand off with every state, the design system and the approval version.`,
        },
      ],
      sop: [
        {
          title: "Oyelabs design stage set-up",
          prompt:
            "[Oyelabs SOP – admin to fill] Which design tool and file structure Oyelabs uses, where approved designs are stored and versioned, who on the delivery side reviews designs before the client sees them, and what a design hand-off must contain before development starts.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a06-design-process-q1",
          prompt: "What question is a wireframe mainly meant to answer?",
          options: [
            "Is the structure and flow of the screens right?",
            "Are the brand colours and fonts right?",
            "Does the animation feel smooth on a real phone?",
            "Has the client approved the final design?",
          ],
          correctIndex: 0,
          explanation:
            "Wireframes are cheap, low-fidelity drawings for structure and flow. Colours and fonts belong to mockups, and feel belongs to prototypes.",
        },
        {
          id: "pmp-a06-design-process-q2",
          prompt: "Why do agencies usually show low-fidelity designs before polished mockups?",
          options: [
            "Changing structure on a wireframe is cheap, and the client focuses on flow instead of colours",
            "Clients prefer grey boxes to real designs",
            "Mockups cannot be made until development starts",
            "Wireframes count as the final design approval",
          ],
          correctIndex: 0,
          explanation:
            "Fidelity rises as the cost of change rises. Polished mockups too early make clients debate detail while the flow may still be wrong.",
        },
        {
          id: "pmp-a06-design-process-q3",
          prompt: "Which of these should be true before design starts on a set of screens? (Select all that apply.)",
          options: [
            "The requirements for those screens are signed off or stable",
            "The brand assets have arrived, or are logged as a dated client dependency",
            "The production environment is live",
            "UAT sign-off has been received",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "The stage's entry criteria are stable requirements and the brand assets. Production and UAT come much later in the lifecycle.",
        },
        {
          id: "pmp-a06-design-process-q4",
          prompt:
            "The designer has drawn a drag-to-reorder dashboard with live charts. The estimate assumed a static list. What should happen before the client sees it?",
          options: [
            "The tech lead checks whether it can be built inside the estimate; if not, simplify it or present it as an option with a cost",
            "Show it anyway, because clients like ambitious designs",
            "Show it and build it, absorbing the extra effort",
            "Remove the dashboard from the scope entirely",
          ],
          correctIndex: 0,
          explanation:
            "A design the client approves becomes an expectation. If it costs more than the estimate, decide that before the client sees it, not after they fall in love with it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a06-design-process-q5",
          prompt: "Who normally consolidates the client's design feedback and signs off the designs?",
          options: [
            "The client SPOC, with the client sponsor accountable for the approval",
            "The Oyelabs designer",
            "Whichever client staff member replies first",
            "The Oyelabs tech lead",
          ],
          correctIndex: 0,
          explanation:
            "One consolidating voice on the client side prevents conflicting feedback. The designer creates; the client approves.",
        },
        {
          id: "pmp-a06-design-process-q6",
          prompt: "Which items belong in a good design hand-off to developers? (Select all that apply.)",
          options: [
            "Empty, loading and error states for each screen",
            "The design system: colours, type, spacing and components",
            "The approval date and version of the final screens",
            "The client's invoice schedule",
            "Every unapproved exploration the designer tried",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Developers need every state, the reusable system and a clear marker of what is final. Invoices are commercial, and old explorations confuse which version to build.",
        },
        {
          id: "pmp-a06-design-process-q7",
          prompt:
            "In UAT, the client sees an error screen that was never in the approved designs and says it looks \"cheap\". What went wrong earlier?",
          options: [
            "The design hand-off only covered the happy path, so developers invented the error states",
            "The client should have tested in production",
            "The QA team should have redesigned the screen",
            "Nothing: error screens are never designed",
          ],
          correctIndex: 0,
          explanation:
            "Missing states in the hand-off are the most common design gap. Developers fill them in, and the client sees something nobody approved.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a06-design-process-q8",
          prompt:
            "The client asks for a custom bottom navigation pattern that the iOS and Android platform guidelines advise against. What is the best first response?",
          options: [
            "Explain the user impact, cite the platform guidelines, and offer a compliant alternative",
            "Refuse, because the designer knows best",
            "Agree silently and design it",
            "Tell the client this will be rejected by the app stores for certain",
          ],
          correctIndex: 0,
          explanation:
            "Platform guidance moves the conversation from taste to users. Overstating store rejection is inaccurate, and silent agreement stores up a usability problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a06-design-process-q9",
          prompt: "When should a clickable prototype usually be built?",
          options: [
            "For the few key journeys, once the flow is agreed, to let the client feel them before code",
            "For every screen, before any wireframe",
            "Only after development is complete",
            "Never: prototypes are only for startups",
          ],
          correctIndex: 0,
          explanation:
            "Prototypes are most valuable for the journeys that matter most, after the structure is stable. Prototyping everything first wastes effort on screens that will change.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "A Laravel and React Native booking platform for a UK clinic chain has just signed off its requirements. Put the design stage steps in the order a well-run project follows them, first at the top.",
        items: [
          { id: "brand", label: "Confirm the brand kit has arrived (or log it as a dated client dependency)" },
          { id: "wireframes", label: "Wireframes and wireflows for the key booking journeys" },
          { id: "techreview", label: "Tech lead reviews the designs against the estimate" },
          { id: "mockups", label: "Branded mockups and a clickable prototype of the booking flow" },
          { id: "review", label: "Client review round with feedback consolidated by the SPOC" },
          { id: "approval", label: "Written design approval from the named approver" },
          { id: "handoff", label: "Hand-off to developers with every state and the design system" },
        ],
        correctOrder: ["brand", "wireframes", "techreview", "mockups", "review", "approval", "handoff"],
        explanation:
          "Inputs first (the brand kit), then cheap structure (wireframes), an internal buildability check before the client sees anything, then higher fidelity, the client review, written approval and finally the hand-off. The tech review sits before mockups so expensive ideas are caught before they are polished and shown.",
      },
    },

    // ---------------------------------------------------------------------------------------------
    // Review rounds
    // ---------------------------------------------------------------------------------------------
    {
      id: "pmp-a06-review-rounds",
      moduleId: "pmp-a06",
      trackId: "pm",
      title: "Managing design review rounds",
      summary: `Design is the stage where scope leaks fastest. Every review is an invitation to say "while we are here, could we also…". Without structure, a fixed-bid project can spend weeks in design and burn the margin before a line of code is written.

The fix is a simple contract with the client about *how* feedback works. Each design stage includes a set number of revision rounds. That number is a contract term, not an industry standard; typically two or three. Each round has a date. The client [[term:spoc|SPOC]] sends one consolidated list of feedback per round, not a stream of messages from five people. The PM confirms what changed, records the round as used, and asks for written [[term:design-approval|design approval]] at the end. Follow the Oyelabs rule in the handbook card below for rounds and for changes after approval.

Once a screen set is approved, it joins the [[term:scope-baseline|scope baseline]]. A later change to it is a [[term:change-request|change request]], estimated and approved before work starts. That is not bureaucracy. Approved designs drive the [[term:estimate|estimate]], the stories and the tests, so changing them changes all three.

The common mistake is being "nice" in round four: absorbing extra rounds and post-approval tweaks for free to keep the client happy. It teaches the client that rounds are unlimited, and the cost appears later as a missed [[term:milestone|milestone]].`,
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Nielsen Norman Group: Design critiques", url: "https://www.nngroup.com/articles/design-critiques/", kind: "article", verifiedAt: "2026-10-02T11:55:35Z" },
        { label: "Figma Learn: Guide to comments in Figma", url: "https://help.figma.com/hc/en-us/articles/360039825314-Guide-to-comments-in-Figma", kind: "docs", verifiedAt: "2026-10-02T12:07:27Z" },
        { label: "Atlassian Team Playbook: Sparring (structured peer feedback)", url: "https://www.atlassian.com/team-playbook/plays/sparring", kind: "docs", verifiedAt: "2026-10-02T11:53:27Z" },
        { label: "Figma: Guide to developer handoff", url: "https://www.figma.com/best-practices/guide-to-developer-handoff/", kind: "article", verifiedAt: "2026-10-02T12:07:26Z" },
      ],
      video: {
        title: "No More Revisions! Working With Clients — Project Management Tips",
        channel: "The Futur",
        url: "https://www.youtube.com/watch?v=xoOo1bjYsKs",
        videoId: "xoOo1bjYsKs",
        verifiedAt: "2026-10-02T12:17:06Z",
      },
      alternateVideos: [
        {
          title: "The Logo Feedback Form I Use With Clients to Avoid Vague Revisions",
          channel: "Megan Weeks",
          url: "https://www.youtube.com/watch?v=sJwzrvEgvXw",
          videoId: "sJwzrvEgvXw",
          verifiedAt: "2026-10-02T12:17:07Z",
        },
        {
          title: "How to Handle Client Feedback as a Brand Designer",
          channel: "4 The Creatives",
          url: "https://www.youtube.com/watch?v=NGQrkbPhzCA",
          videoId: "NGQrkbPhzCA",
          verifiedAt: "2026-10-02T12:17:07Z",
        },
      ],
      handbook: {
        stages: ["custom-design"],
        rules: ["design-revision-rounds", "cr-when-needed", "cr-approval", "mom-after-every-client-meeting"],
        templates: ["cr-form", "mom"],
      },
      sections: [
        {
          heading: "Set the rules of the rounds on day one",
          body: `Agree how reviews work before the first design is shown, ideally at the client kickoff, and repeat it in the email that sends round one.

- **What a round is:** one review of one screen set, ending with one consolidated feedback list.
- **How many rounds are included:** whatever the [[term:sow|SOW]] says. Typically two or three per screen set. Quote the clause; never improvise a number.
- **Who consolidates:** the client [[term:spoc|SPOC]] collects feedback from their colleagues and resolves conflicts before sending.
- **Turnaround:** a date for the client's feedback and a date for the revised designs. Late feedback moves the design [[term:milestone|milestone]], and you say so in the status report.
- **Who approves:** the named approver signs off in writing. A thumbs-up in chat from someone else is not approval.
- **After approval:** changes go through the [[term:change-request|change request]] process.

Writing this down early turns later conversations from "you are being difficult" into "this is what we agreed".`,
        },
        {
          heading: "Running a review session",
          body: `A good review session is short and structured.

1. **Restate the goal of the round.** "Today we confirm the booking flow and the clinic page. Colours are fixed from round one."
2. **Walk the user journey, not the screens.** Show the prototype as a patient booking an appointment. Clients give better feedback on a story than on a gallery.
3. **Ask for problems, not solutions.** "What would stop a patient finishing this?" gives better input than "What would you change?".
4. **Separate three kinds of comment** as they come up: fixes inside the round, items that belong to a later screen set, and ideas that are outside the signed scope.
5. **Close with the next step:** when consolidated feedback is due and when revisions come back.

Send [[term:mom|minutes]] the same day with the decisions and the round number. Comments made in the design tool should be resolved there, but the decisions belong in the minutes too.`,
        },
        {
          heading: "Feedback that is really scope",
          body: `Some design feedback is not design feedback. It is a new requirement wearing a design comment.

- "Can we add a loyalty tab here?" is a [[term:new-feature|new feature]].
- "Patients should be able to book for a family member" changes agreed behaviour, so it is a [[term:change-request|change request]].
- "Make the button bigger" is a normal revision inside the round.
- "Why is there no Apple Pay?" may be a [[term:clarification|clarification]] if the signed scope lists card payments only.

When feedback is scope, do not argue in the review. Thank the client, write it down as outside the current scope, and follow up with a CR or a [[term:phase-2|phase 2]] note. Designing it "just to see" makes it look agreed.`,
        },
        {
          heading: "What good looks like: a worked example",
          body: `A UK physiotherapy clinic chain has a fixed-bid Laravel admin panel and a React Native patient app. The SOW includes two revision rounds per screen set (a contract term for this project). The SPOC is the operations manager; the approver is the managing director.

**Round one, booking flow.** The PM sends the prototype link with a note: "Round 1 of 2. Please send one consolidated list by Thursday." On Thursday the SPOC sends 14 comments. Two of them conflict: reception wants a two-step booking, a clinician wants one step. The PM sends both back to the SPOC to resolve; the SPOC chooses one step.

**Scope inside feedback.** Comment 9 asks for "a waiting list when slots are full". The PM replies that it is outside the signed scope and offers to estimate it as a CR. The client asks for the estimate; the CR goes through the normal process.

**Round two.** The designer applies the 13 agreed comments. The client sends four small fixes. The PM confirms round two as used and asks for approval.

**Approval.** The managing director replies by email: "Booking flow approved, version 2.1." The PM records it in the minutes and the [[term:raid-log|RAID log]], and the designer hands off.

**After approval.** Three weeks later the client asks to move the clinic photo above the map. The PM logs it, the tech lead says it is half a day, and the PM raises a small CR. Whether small changes are bundled or waived is not the PM's call alone; the PM follows the Oyelabs rule in the handbook card below.`,
        },
        {
          heading: "Common mistakes and how to recover",
          body: `- **Feedback arrives from five people in five channels.** Stop applying it. Thank everyone, and ask the SPOC for one consolidated list by a date. Apply nothing until it arrives.
- **You are on round four of two.** Do not keep going silently. Tell the client which round this is, what the contract includes, and offer options: approve now and handle remaining items as a CR, or buy an extra round. Agree it in writing.
- **Approval was verbal on a call.** Send the minutes with "Approved: booking flow v2.1" and ask the approver to confirm by reply. Until they do, the hand-off is at risk.
- **Someone other than the approver approved.** Treat it as a recommendation. Ask the named approver to confirm before the hand-off.
- **A post-approval change was already built for free.** Do not hide it. Record it in the minutes as a one-off goodwill item, agreed internally, so it is not taken as the norm. Follow the Oyelabs rule on who may approve goodwill.
- **The client keeps reopening colours.** Remind them of what round one fixed and ask what problem the new colour solves for users. Often the real issue is a single screen.`,
        },
        {
          heading: "Your checklist",
          body: `1. Quote the SOW's revision rounds and the approver before round one.
2. Give every round a number and a feedback date.
3. Insist on one consolidated list from the SPOC per round.
4. Separate revisions, later-screen items and out-of-scope ideas.
5. Turn out-of-scope ideas into a CR or a phase 2 note, never a free design.
6. Send minutes after each review with the round number and decisions.
7. Get written approval from the named approver, with a version number.
8. Route every post-approval change through the CR process.`,
        },
      ],
      sop: [
        {
          title: "Extra design rounds and post-approval changes",
          prompt:
            "[Oyelabs SOP – admin to fill] How an extra revision round is offered and priced, whether small post-approval design changes can ever be absorbed, who must approve that internally, and where design approvals are recorded.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pmp-a06-review-rounds-q1",
          prompt: "How many design revision rounds does a project include?",
          options: [
            "Whatever the signed contract says; typically two or three, but it is a contract term",
            "Always three, by industry standard",
            "As many as the client needs until they are happy",
            "One, because more rounds are always billed",
          ],
          correctIndex: 0,
          explanation:
            "There is no industry standard number. The SOW decides, and the PM quotes it rather than improvising.",
        },
        {
          id: "pmp-a06-review-rounds-q2",
          prompt:
            "Round one feedback arrives as WhatsApp messages from the CEO, two receptionists and a clinician, some contradicting each other. What do you do?",
          options: [
            "Thank them and ask the SPOC for one consolidated list by a date, applying nothing until it arrives",
            "Apply the CEO's comments only",
            "Apply all of them and let the client choose later",
            "Ask the designer to decide which comments make sense",
          ],
          correctIndex: 0,
          explanation:
            "Consolidation by the SPOC resolves conflicts on the client side. Picking winners yourself, or applying everything, wastes a round and creates disputes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a06-review-rounds-q3",
          prompt: "Which of these count as valid design approval? (Select all that apply.)",
          options: [
            "An email from the named approver: \"Booking flow approved, version 2.1\"",
            "The approver's written confirmation in reply to minutes that state \"Approved: booking flow v2.1\"",
            "A thumbs-up emoji in chat from a receptionist",
            "Silence for a week after the designs were sent, with no agreed deemed-approval clause",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Approval must be written and come from the named approver. A junior's emoji or unagreed silence is not approval.",
        },
        {
          id: "pmp-a06-review-rounds-q4",
          prompt:
            "Three weeks after the booking flow was approved, the client asks to move the clinic photo above the map. How is this handled?",
          options: [
            "As a change to the approved design: log it, estimate it, and raise a CR unless the Oyelabs rule allows another route",
            "As a normal revision inside round two",
            "As a bug, because the client does not like the layout",
            "Ignore it until UAT",
          ],
          correctIndex: 0,
          explanation:
            "Approved designs join the scope baseline. Changing them after approval goes through change control, even when the change is small.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a06-review-rounds-q5",
          prompt: "During a design review the client says \"Patients should also book for family members\". What is the best response in the meeting?",
          options: [
            "Note it as outside the signed scope and offer to estimate it as a change request",
            "Ask the designer to add it before the next round",
            "Say no, it was not in the requirements",
            "Treat it as round-two feedback",
          ],
          correctIndex: 0,
          explanation:
            "It changes agreed behaviour, so it is a CR. Designing it \"to see\" makes it look agreed; a flat no damages the relationship.",
        },
        {
          id: "pmp-a06-review-rounds-q6",
          prompt: "You are on round four of a screen set whose SOW includes two. What should you do?",
          options: [
            "Tell the client which round this is, what the SOW includes, and offer options: approve now with a CR for the rest, or an extra paid round",
            "Keep going quietly to protect the relationship",
            "Refuse any more feedback",
            "Start development on the unapproved designs",
          ],
          correctIndex: 0,
          explanation:
            "Silently absorbing rounds teaches the client they are unlimited. Options keep the relationship and the margin; refusing or building unapproved designs creates bigger problems.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pmp-a06-review-rounds-q7",
          prompt: "Which of these belong in the minutes after a design review? (Select all that apply.)",
          options: [
            "The round number and screen set reviewed",
            "Decisions taken and items deferred as outside scope",
            "The date consolidated feedback is due",
            "The designer's personal opinion of the client's taste",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Minutes record what was decided, what round it was and what happens next. Opinions do not belong in a client record.",
        },
        {
          id: "pmp-a06-review-rounds-q8",
          prompt: "Why walk the client through a user journey rather than a gallery of screens?",
          options: [
            "Clients give better, more relevant feedback on a story than on isolated screens",
            "It hides screens that are not finished",
            "It avoids the need for written approval",
            "It makes the review longer and more thorough",
          ],
          correctIndex: 0,
          explanation:
            "A journey makes problems visible (\"how does a patient cancel?\") and keeps comments about users, not decoration.",
        },
        {
          id: "pmp-a06-review-rounds-q9",
          prompt:
            "The client's late round-two feedback arrives eight days after the agreed date. What is the right reaction?",
          options: [
            "Apply it, and show in the status report that the design milestone moves because feedback was late",
            "Refuse it because it is late",
            "Absorb the delay and keep the original milestone in the plan",
            "Skip round two and start development",
          ],
          correctIndex: 0,
          explanation:
            "Late feedback is a client dependency slip. Recording its effect on the milestone is honest; hiding it makes the delay look like Oyelabs' fault later.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Below is the PM's draft email to the client after a design review for a React Native patient app (SOW: two revision rounds per screen set; approver is the managing director; SPOC is the operations manager). Mark the lines that break good review-round practice.",
        segments: [
          { id: "s1", text: "Thanks for today's review of the booking flow (screen set 2, round 1 of 2).", issue: null },
          {
            id: "s2",
            text: "I have also applied the comments Dr Patel and the two receptionists sent on WhatsApp after the call.",
            issue: "Feedback must be consolidated by the SPOC; applying separate messages from several people bypasses consolidation and invites conflicts.",
          },
          { id: "s3", text: "Please send one consolidated list of round-one feedback by Thursday 14 May.", issue: null },
          {
            id: "s4",
            text: "As discussed, we will also add a family-member booking option to the designs at no extra cost, since we are still in design.",
            issue: "Family booking changes agreed behaviour; it is out of scope and needs a CR, not a free design addition.",
          },
          { id: "s5", text: "The waiting-list idea is outside the signed scope; we will send an estimate as a change request.", issue: null },
          {
            id: "s6",
            text: "Since Sarah from reception liked the clinic page, we will treat it as approved and start development on Monday.",
            issue: "Approval must come in writing from the named approver (the managing director), not a receptionist's opinion.",
          },
          { id: "s7", text: "Revised designs will come back to you by Tuesday 19 May for round 2.", issue: null },
          {
            id: "s8",
            text: "Don't worry about the number of rounds, we can keep iterating until everyone is happy.",
            issue: "Promises unlimited rounds, contradicting the two rounds in the SOW and training the client to expect free iterations.",
          },
          { id: "s9", text: "Minutes with today's decisions are attached.", issue: null },
          { id: "s10", text: "Kind regards, Priya (Project Manager)", issue: null },
        ],
        askExplanation: true,
      },
    },
  ],
} satisfies Module;
