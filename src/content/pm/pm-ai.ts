import type { Module } from "@/types/curriculum";

export default {
  id: "pm-ai",
  trackId: "pm",
  name: "AI in Project Delivery",
  description:
    "Using Claude and other AI tools well in delivery: PRDs, meeting notes, risk analysis and estimates with verification, keeping client data confidential, and leading AI-assisted teams.",
  refs: [
    { label: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", kind: "spec" },
  ],
  topics: [
    {
      id: "pm-x-ai-prds-meeting-notes",
      moduleId: "pm-ai",
      trackId: "pm",
      title: "Claude for PRDs, Meeting Notes & Delivery Documents",
      summary:
        "Language models are genuinely good at the document-heavy parts of a PM's job: turning a messy discovery call transcript into a structured summary, drafting a PRD from notes and a template, rewriting a status update for a non-technical sponsor, or turning a client email thread into a decision log. Used well, Claude removes the blank-page problem and gives back hours a week. Used carelessly, it produces fluent documents that state things nobody decided.\n\nThe risk is specific. Models fill gaps plausibly: a PRD draft may include a success metric, a date or an integration that nobody mentioned, written in the same confident tone as everything else. Meeting summaries can merge two speakers, turn a suggestion into a decision, or drop the one caveat that mattered. Anthropic's guidance on reducing hallucinations applies directly: give the model the source material, tell it to use only that material, allow it to say it doesn't know, ask it to quote the passages that support each claim, and flag anything it inferred rather than read. A good PM prompt asks for decisions, owners and dates only where stated, and an \"open questions\" section for everything else.\n\nThe PM remains the author. Verification is not a quick skim: check every decision, number, name and date against the source, read the open-questions list, and have the person who owns a decision confirm it before the document is shared. Structure helps: a team prompt library with a fixed PRD template (problem, users, goals, non-goals, requirements, acceptance criteria, risks, open questions) produces consistent drafts that are faster to review.\n\nGotchas: the most dangerous errors are plausible ones, so be most suspicious of details that sound right. Summaries reflect the transcript, so a poor recording or an accent the transcription tool struggled with propagates errors. And never paste client material into a tool or account Oyelabs has not approved for that client's data; the next topic covers confidentiality.",
      level: "expert",
      estMinutes: 45,
      webRefs: [
        { label: "Claude Docs: Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", kind: "docs" },
        { label: "Claude Docs: Prompt engineering overview", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview", kind: "docs" },
        { label: "PMI: AI in Project Management hub", url: "https://www.pmi.org/learning/ai-in-project-management", kind: "article" },
      ],
      video: {
        title: "How Anthropic uses Claude in Product Management",
        channel: "Claude",
        url: "https://www.youtube.com/watch?v=91AJ0cpgLlQ",
        videoId: "91AJ0cpgLlQ",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-ai-prds-meeting-notes-q1",
          prompt:
            "Claude drafts a PRD from your discovery notes. It includes \"Success metric: 40% reduction in onboarding time.\" Nobody mentioned a metric in discovery. What should you do?",
          options: [
            "Remove it or move it to open questions, and agree a real metric with the client",
            "Keep it: it's a sensible target",
            "Keep it but lower it to 20% to be safe",
            "Ask Claude whether the number is correct",
          ],
          correctIndex: 0,
          explanation:
            "An invented metric becomes a commitment once the client reads it. Asking the model to confirm its own invention doesn't verify anything; the source notes do.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q2",
          prompt: "Which prompt instructions reduce fabricated content in a meeting summary? (Select all that apply.)",
          options: [
            "Use only the transcript provided; if something isn't stated, say so",
            "List decisions only where the transcript shows explicit agreement, with a supporting quote",
            "Put anything uncertain or implied under open questions",
            "Make the summary sound confident and complete",
            "Fill in missing owners with the most likely person",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Grounding in the source, quoting evidence and allowing uncertainty are Anthropic's recommended techniques. Asking for confidence or inferred owners invites exactly the errors you're trying to avoid.",
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q3",
          prompt: "Which kind of error in an AI-generated meeting summary is most dangerous?",
          options: [
            "A plausible but wrong decision or date written in the same tone as correct content",
            "An obvious spelling mistake",
            "A summary that's slightly too long",
            "A formatting inconsistency",
          ],
          correctIndex: 0,
          explanation:
            "Plausible errors pass a skim and get acted on. Obvious mistakes get caught; length and formatting are cosmetic.",
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q4",
          prompt: "What does verifying an AI-drafted decision log properly involve?",
          options: [
            "Checking each decision, owner, number and date against the source, and having decision owners confirm before it's shared",
            "Reading it once for tone",
            "Running it through a second AI tool",
            "Trusting it if the model was given the full transcript",
          ],
          correctIndex: 0,
          explanation:
            "Verification compares claims with sources and with the people who made the decisions. A second model can help spot issues but isn't verification; full context reduces errors but doesn't eliminate them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q5",
          prompt: "Why does a shared PRD template in the team's prompt library improve AI-drafted PRDs?",
          options: [
            "It produces consistent structure, including non-goals and open questions, so drafts are faster and safer to review",
            "It makes the model more creative",
            "It removes the need for review",
            "It guarantees accurate content",
          ],
          correctIndex: 0,
          explanation:
            "Consistent sections make gaps visible and review quicker. Templates don't make content correct, so review is still required.",
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q6",
          prompt: "Which tasks are good uses of Claude for a PM? (Select all that apply.)",
          options: [
            "Turning a call transcript into a structured summary with open questions",
            "Rewriting a technical status update for a non-technical sponsor",
            "Drafting acceptance criteria from agreed user stories for the team to refine",
            "Sending client commitments directly without review",
            "Deciding scope trade-offs on the client's behalf",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Drafting and restructuring with human review is the sweet spot. Commitments and scope decisions need accountable humans.",
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q7",
          prompt:
            "A summary attributes a suggestion about a 2FA requirement to the client's CTO, but in the recording it was your own developer who suggested it. Why does this matter?",
          options: [
            "It turns an internal idea into an apparent client requirement, which can create scope and cost obligations",
            "It doesn't: the content is the same",
            "Only because the CTO might be offended",
            "Because 2FA is always out of scope",
          ],
          correctIndex: 0,
          explanation:
            "Who said something changes its status: a client requirement versus an option we raised. Misattribution is a common summarisation error with commercial consequences.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q8",
          prompt: "For long source documents, which technique does Anthropic recommend to ground Claude's analysis?",
          options: [
            "Ask Claude to extract word-for-word quotes first, then do the task based on those quotes",
            "Ask for a shorter answer",
            "Raise the temperature",
            "Split the document and never give the full text",
          ],
          correctIndex: 0,
          explanation:
            "Anthropic's hallucination guide recommends extracting direct quotes first for long documents. Shorter answers or higher temperature don't ground the output.",
        },
        {
          id: "pm-x-ai-prds-meeting-notes-q9",
          prompt: "Who is accountable for the content of an AI-drafted PRD sent to a client?",
          options: [
            "The PM who sends it",
            "The AI vendor",
            "The prompt author, if different",
            "Nobody, if a disclaimer says it was AI-assisted",
          ],
          correctIndex: 0,
          explanation:
            "Tools don't take accountability. A disclaimer doesn't change who the client holds responsible for commitments in the document.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A PM asked Claude to summarise a 45-minute kick-off call for a white-label telemedicine app. Compare it with the facts below and mark the lines that aren't supported by the call.\n\nFacts from the transcript: the client (CEO Ana, CTO Raj) agreed iOS and Android apps plus a clinician web portal. Raj asked about HIPAA but said legal would confirm whether it applies. Video calls will use a third-party provider, not yet chosen. Ana wants a beta before her board meeting in March but gave no launch date. Oyelabs' developer suggested an AI note-taking feature; Ana said 'interesting, let's discuss later'. The next call is Thursday.",
        segments: [
          { id: "l1", text: "Scope agreed: iOS and Android patient apps and a clinician web portal.", issue: null },
          { id: "l2", text: "Decision: the platform will be HIPAA compliant.", issue: "Raj only asked; legal is to confirm whether HIPAA applies. It's an open question, not a decision." },
          { id: "l3", text: "Video calls will use a third-party provider (to be selected).", issue: null },
          { id: "l4", text: "Launch date: 15 April.", issue: "No launch date was given; the model invented a plausible one." },
          { id: "l5", text: "Ana wants a beta before her March board meeting.", issue: null },
          { id: "l6", text: "Client requested an AI note-taking feature for clinicians, to be included in phase 1.", issue: "Oyelabs suggested it, and Ana deferred discussion; it's neither a client request nor in scope." },
          { id: "l7", text: "Open question: which video provider to use.", issue: null },
          { id: "l8", text: "Owner for video provider selection: Raj, by Friday.", issue: "No owner or date was set in the call." },
          { id: "l9", text: "Next call: Thursday.", issue: null },
          { id: "l10", text: "Open question: whether HIPAA applies (legal to confirm).", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pm-x-ai-risk-estimates",
      moduleId: "pm-ai",
      trackId: "pm",
      title: "Claude for Risk Analysis & Estimates, With Verification",
      summary:
        "Two of the most valuable things a model can do for a PM are to widen thinking and to challenge numbers. Given a project brief, Claude will produce a broader first-pass risk list than most people write alone, including categories teams forget (data-protection review, app-store rejection, model deprecation, client-side decision latency). Given an estimate breakdown, it can spot missing work (environments, migrations, evaluation sets, documentation, hypercare) and question optimistic assumptions. Used as a sparring partner, it reduces blind spots.\n\nIts limits are equally specific. A model has no access to your team's actual velocity, your client's politics or your codebase unless you give them, so its probability and impact ratings are generic. It will produce estimates that look precise (\"112 hours\") with no historical basis, and it tends to agree with the framing it is given: ask \"is 400 hours reasonable?\" and you will often get yes. Numbers from a model are hypotheses to test against your own reference data, never inputs to a quote.\n\nGood practice: give the model the brief, the work breakdown and your historical data; ask it to list risks by category with the triggering evidence from the brief; ask for missing work items rather than totals; ask it to argue against your estimate (\"what would make this take twice as long?\"); and compare its output with reference-class data from similar Oyelabs projects. Then the PM and the team own the final register and estimate, with clear owners, responses and ranges.\n\nGotchas: generic risks (\"scope creep\", \"communication issues\") feel thorough but drive no action; push for project-specific risks with triggers and owners. Anchoring works on people too: if the team sees the model's number first, their own estimates drift towards it, so estimate independently, then compare. And estimates for AI features themselves remain the hardest to make; the model cannot tell you how many iterations your client's evaluation set will need.",
      level: "expert",
      estMinutes: 45,
      webRefs: [
        { label: "Claude Docs: Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", kind: "docs" },
        { label: "Claude Docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices", kind: "docs" },
        { label: "Atlassian: Agile estimation", url: "https://www.atlassian.com/agile/project-management/estimation", kind: "article" },
        { label: "Asana: RAID log", url: "https://asana.com/resources/raid-log", kind: "article" },
      ],
      video: {
        title: "Tips for Using Generative AI Tools in Project Management",
        channel: "Project Management Institute (PMI)",
        url: "https://www.youtube.com/watch?v=bN8vPip_7y4",
        videoId: "bN8vPip_7y4",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-ai-risk-estimates-q1",
          prompt: "You ask Claude: \"Is 400 hours a reasonable estimate for this AI chatbot?\" Why is this a weak prompt?",
          options: [
            "It anchors the model on your number and invites agreement, instead of asking it to find missing work or argue against the estimate",
            "It's too short",
            "Models can't discuss hours",
            "It should ask for days instead of hours",
          ],
          correctIndex: 0,
          explanation:
            "Leading questions get agreeable answers. Ask for missing items, risks that would double the effort, or a critique, and give it your breakdown and history.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-risk-estimates-q2",
          prompt: "Which are good uses of a model in estimation? (Select all that apply.)",
          options: [
            "Spotting missing work items such as environments, migrations, evaluation sets and hypercare",
            "Challenging assumptions: what would make this take twice as long?",
            "Comparing your breakdown with the categories in past project estimates you provide",
            "Producing the final quoted figure without team input",
            "Replacing historical velocity data",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Models are useful for completeness and challenge. The final figure needs team ownership and real reference data the model doesn't have.",
        },
        {
          id: "pm-x-ai-risk-estimates-q3",
          prompt: "Claude's risk list includes \"Communication issues\" and \"Scope creep\". What should you do with them?",
          options: [
            "Make them project-specific with a trigger, owner and response, or drop them",
            "Keep them: they're always relevant",
            "Rate them high to be safe",
            "Ask the model to rate them again",
          ],
          correctIndex: 0,
          explanation:
            "Generic risks don't drive action. \"Client's product owner is part-time and decisions take more than a week\" is a risk you can manage.",
        },
        {
          id: "pm-x-ai-risk-estimates-q4",
          prompt: "The team is about to run planning poker. Should they see the model's estimate first?",
          options: [
            "No: estimate independently first, then compare, to avoid anchoring on the model's number",
            "Yes: it saves time",
            "Yes, but only if the model's estimate is lower",
            "It makes no difference",
          ],
          correctIndex: 0,
          explanation:
            "Anchoring affects people strongly; seeing a number first pulls estimates towards it. Independent estimates then comparison keeps both useful.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-risk-estimates-q5",
          prompt: "Why are a model's probability and impact ratings for your risks only a starting point?",
          options: [
            "It lacks your context: team, client history, codebase and organisational constraints, so ratings are generic",
            "Models can't count",
            "Probability ratings are illegal in contracts",
            "They're always too high",
          ],
          correctIndex: 0,
          explanation:
            "Ratings depend on context the model hasn't seen. It may be too high or too low; the issue is that it's uncalibrated for your situation.",
        },
        {
          id: "pm-x-ai-risk-estimates-q6",
          prompt: "Which inputs improve a model's risk analysis for a specific project? (Select all that apply.)",
          options: [
            "The project brief and SOW assumptions and dependencies",
            "The work breakdown and timeline",
            "Lessons learned from similar past Oyelabs projects",
            "A request to make the list as long as possible",
            "The client's personal contact details",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Specific context yields specific risks. Length isn't quality, and personal details add privacy risk without improving analysis.",
        },
        {
          id: "pm-x-ai-risk-estimates-q7",
          prompt: "A model returns an estimate of exactly 112 hours for an integration. What does that precision tell you?",
          options: [
            "Nothing about accuracy: precise-looking numbers can have no historical basis; treat it as a hypothesis",
            "That the model has analysed your codebase",
            "That the estimate is reliable to within an hour",
            "That the integration is simple",
          ],
          correctIndex: 0,
          explanation:
            "Precision isn't accuracy. Without your data, the number is a guess with decimal-place confidence.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-risk-estimates-q8",
          prompt: "Which part of an AI-feature estimate is a model least able to help with?",
          options: [
            "How many evaluation and prompt iterations your client's quality bar will require",
            "Listing typical tasks in building a chatbot",
            "Suggesting test categories",
            "Drafting assumptions for the SOW",
          ],
          correctIndex: 0,
          explanation:
            "Iteration count depends on the client's data, quality bar and feedback speed, which no model knows. Typical task lists and draft assumptions are where it helps.",
        },
        {
          id: "pm-x-ai-risk-estimates-q9",
          prompt: "Who owns the final risk register and estimate?",
          options: [
            "The PM and the delivery team, with named owners for each risk",
            "The AI tool that generated the first draft",
            "The client",
            "Whoever wrote the prompt",
          ],
          correctIndex: 0,
          explanation:
            "Ownership stays with accountable people. Tools draft; the team commits.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You're preparing an estimate for a white-label HR platform with an AI policy-question assistant. Your team's bottom-up estimate is 1,200 hours. You ask Claude to critique the breakdown, giving it the WBS and the SOW assumptions.",
        steps: [
          {
            id: "s1",
            question:
              "Claude points out that the WBS has no line for building an evaluation set of real policy questions, nor for hypercare after launch. What do you do?",
            options: [
              "Check with the team whether they're genuinely missing, and if so estimate them from past projects and add them",
              "Add Claude's suggested figure for each item directly",
              "Ignore it, because the team knows best",
              "Remove the AI assistant from scope",
            ],
            correctIndex: 0,
            explanation:
              "The model found possible gaps; the team confirms and sizes them from real data. Taking its numbers or dismissing it both waste the critique.",
          },
          {
            id: "s2",
            question:
              "Claude also suggests the total should be about 1,650 hours. Your reference data from three similar projects shows actuals at 1.2 to 1.35 times the original bottom-up estimates. What figure do you put forward internally?",
            options: [
              "A range based on your reference data (about 1,440 to 1,620 hours plus the newly added items), with assumptions stated",
              "1,650 hours, because the model said so",
              "1,200 hours, because the team estimated it",
              "The average of 1,200 and 1,650",
            ],
            correctIndex: 0,
            explanation:
              "Your own reference class is real evidence; the model's total isn't. Averaging with an unfounded number gives false comfort.",
          },
          {
            id: "s3",
            question:
              "Leadership wants to quote the bottom of the range to win the deal. What do you recommend?",
            options: [
              "Quote within the range with the AI-quality work on capped T&M or a retainer, and make the evaluation-set dependency explicit in the SOW",
              "Quote the bottom figure on a fixed price with no further conditions",
              "Quote the model's 1,650 hours to be safe",
              "Refuse to give any quote",
            ],
            correctIndex: 0,
            explanation:
              "Commercial structure can absorb uncertainty where estimates can't. A bare low fixed price transfers all the AI uncertainty to Oyelabs' margin.",
          },
        ],
      },
    },
    {
      id: "pm-x-ai-confidentiality",
      moduleId: "pm-ai",
      trackId: "pm",
      title: "AI Confidentiality, Data Handling & Governance for PMs",
      summary:
        "Every prompt is a data transfer. When a PM pastes a client's requirements, a meeting transcript or a spreadsheet of user feedback into an AI tool, that content goes to a third-party processor under whatever terms govern that account. For an agency this is not an abstract concern: client contracts and NDAs often restrict disclosure to third parties, data-processing agreements limit where personal data may go, and enterprise clients increasingly ask in security questionnaires exactly which AI tools touch their data.\n\nThe controls are mostly simple and mostly organisational. Use only tools and accounts the company has approved for client work, because terms differ: Anthropic's commercial terms, for example, state that it may not train models on customer content from its services, while consumer accounts are governed by different terms and settings. Check each client's contract for restrictions before using any AI tool on its material; some prohibit it outright, some require disclosure or approval. Minimise: remove personal data, credentials, API keys and commercially sensitive figures that the task does not need, and use placeholders. Never paste secrets; a prompt history is not a secure store. Get consent before recording or transcribing calls, and keep transcripts under the same retention rules as other client records.\n\nGovernance makes this repeatable. The NIST AI Risk Management Framework organises the work into four functions (Govern, Map, Measure, Manage): set policy and accountability, understand where AI is used and what can go wrong, measure risks such as accuracy and data exposure, and act on them. For a PM that translates into an AI-use register per project (which tools, what data, which client approvals), a short team guideline, and AI use as a standing item in client security conversations.\n\nGotchas: \"it's only a summary\" still discloses the content summarised. Screenshots carry hidden data such as names in sidebars and URLs. And client approval for using AI on their code does not automatically extend to their end users' personal data; check each category of data separately. This is practical guidance, not legal advice.",
      level: "expert",
      estMinutes: 40,
      webRefs: [
        { label: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", kind: "spec" },
        { label: "Anthropic: Commercial Terms of Service", url: "https://www.anthropic.com/legal/commercial-terms", kind: "docs" },
        { label: "PMI: AI in Project Management hub", url: "https://www.pmi.org/learning/ai-in-project-management", kind: "article" },
      ],
      video: {
        title: "AI Tools for Project Management: Top 10 Ways to Boost Results",
        channel: "Project Management Institute (PMI)",
        url: "https://www.youtube.com/watch?v=tLabykkGbEw",
        videoId: "tLabykkGbEw",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-ai-confidentiality-q1",
          prompt:
            "Before using Claude to summarise a new client's requirements documents, what should a PM check first?",
          options: [
            "Whether the client's contract or NDA restricts sharing their material with third-party tools, and that the account is company-approved",
            "Whether the documents are longer than the context window",
            "Whether the model is the newest available",
            "Nothing, as long as the summary stays internal",
          ],
          correctIndex: 0,
          explanation:
            "Contractual restrictions and approved accounts come first. Keeping the output internal doesn't change that the input was disclosed to a processor.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-confidentiality-q2",
          prompt: "Which items should be removed or replaced with placeholders before pasting material into an AI tool? (Select all that apply.)",
          options: [
            "API keys, passwords and access tokens",
            "End users' names, emails and health or financial details not needed for the task",
            "Commercially sensitive figures the task doesn't need",
            "The feature names being discussed",
            "The structure of the document",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Minimise secrets, personal data and unnecessary sensitive figures. Feature names and structure are usually what the task needs.",
        },
        {
          id: "pm-x-ai-confidentiality-q3",
          prompt: "What do Anthropic's commercial terms say about training on customer content from its services?",
          options: [
            "Anthropic may not train models on customer content from the services",
            "All inputs are used for training unless you opt out",
            "Only outputs, not inputs, are excluded from training",
            "The terms don't address training",
          ],
          correctIndex: 0,
          explanation:
            "The commercial terms state that Anthropic may not train models on customer content from the services. Consumer accounts have different terms, which is why approved accounts matter.",
        },
        {
          id: "pm-x-ai-confidentiality-q4",
          prompt: "Which are the four functions of the NIST AI Risk Management Framework core?",
          options: ["Govern, Map, Measure, Manage", "Plan, Do, Check, Act", "Identify, Protect, Detect, Respond", "Initiate, Plan, Execute, Close"],
          correctIndex: 0,
          explanation:
            "The AI RMF core is Govern, Map, Measure, Manage. Identify-Protect-Detect-Respond comes from the NIST Cybersecurity Framework; the others are generic improvement and lifecycle models.",
        },
        {
          id: "pm-x-ai-confidentiality-q5",
          prompt:
            "A PM argues: \"I only pasted the call transcript to get a summary, so nothing was shared.\" What's wrong with this reasoning?",
          options: [
            "The full transcript was sent to the tool; summarising is processing, so the disclosure already happened",
            "Nothing; summaries are always allowed",
            "Only the summary counts as disclosure",
            "Transcripts are not client data",
          ],
          correctIndex: 0,
          explanation:
            "What matters is what was sent, not what came back. A transcript of a client call is client confidential information.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-confidentiality-q6",
          prompt:
            "A client approved using AI coding assistants on their codebase. Does that cover pasting their customers' support tickets, with names and order details, into a chatbot to analyse themes?",
          options: [
            "Not automatically: end users' personal data is a separate category that needs its own check against the DPA and client approval",
            "Yes, AI approval covers everything",
            "Yes, if the analysis helps the client",
            "No, AI can never be used on support tickets",
          ],
          correctIndex: 0,
          explanation:
            "Approval for one data category doesn't extend to personal data under data-protection terms. Anonymised tickets may well be fine once checked.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-confidentiality-q7",
          prompt: "What should a per-project AI-use register record? (Select all that apply.)",
          options: [
            "Which AI tools and accounts are used",
            "Which categories of client data each tool processes",
            "The client approvals or contract clauses that permit it",
            "Every prompt ever written",
            "Each team member's personal AI subscriptions",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Tools, data and permissions answer security questionnaires and audits. Logging every prompt is impractical, and personal subscriptions shouldn't be used for client work at all.",
        },
        {
          id: "pm-x-ai-confidentiality-q8",
          prompt: "Which is the safest approach when a client's contract is silent on AI tools?",
          options: [
            "Treat AI tools as third-party processors under the confidentiality clause, raise it with the client and agree an approach in writing",
            "Assume it's allowed, since it isn't prohibited",
            "Assume it's banned and never mention it",
            "Use AI only outside working hours",
          ],
          correctIndex: 0,
          explanation:
            "Silence means ambiguity, and confidentiality clauses usually still apply. A short written agreement removes the ambiguity and builds trust.",
        },
        {
          id: "pm-x-ai-confidentiality-q9",
          prompt: "Why are screenshots a common source of accidental data leakage into AI tools?",
          options: [
            "They often include data beyond the intended content: names in sidebars, URLs, notifications or other clients' tabs",
            "Images are always stored permanently",
            "AI tools can't read images",
            "Screenshots are larger than text",
          ],
          correctIndex: 0,
          explanation:
            "Incidental content is the problem. Crop or redact before sharing; storage and file size aren't the issue.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A PM drafted this message to paste into an AI chat tool to help prepare a steering-committee update for a health-tech client whose contract requires client approval before sharing data with any third party. Mark the lines that create confidentiality or data-protection problems.",
        segments: [
          { id: "m1", text: "Please help me write a one-page steering update in plain language for a non-technical sponsor.", issue: null },
          { id: "m2", text: "Context: we're building a patient-booking platform with an AI symptom-checker.", issue: null },
          { id: "m3", text: "The client is HealthBridge Ltd, and their sponsor is Dr. Maria Kowalski (maria.kowalski@healthbridge.example).", issue: "Names the client and the sponsor's personal contact details without need or client approval." },
          { id: "m4", text: "Progress: booking flow complete; symptom-checker at 82% accuracy against a 90% target.", issue: null },
          { id: "m5", text: "Here are 20 real patient symptom reports from the pilot, with names and dates of birth, so you can see the failure cases.", issue: "Special-category personal data (health) with identifiers; not needed and needs a lawful basis and client approval." },
          { id: "m6", text: "Our staging API key is sk-live-7f3a..., in case you need it to check the endpoint.", issue: "Credentials must never be pasted into prompts." },
          { id: "m7", text: "Risk: the client may cut the budget by $140k after their Series B fell through (confidential).", issue: "Confidential client financial information that the task doesn't need." },
          { id: "m8", text: "Ask: approval to extend the symptom-checker evaluation by two weeks.", issue: null },
          { id: "m9", text: "Tone: confident but honest, no jargon.", issue: null },
          { id: "m10", text: "I'm using my personal account because the company one is slow.", issue: "Client work must use company-approved accounts, whose terms and controls have been checked." },
          { id: "m11", text: "Please end with three clear next steps.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "pm-x-ai-assisted-teams",
      moduleId: "pm-ai",
      trackId: "pm",
      title: "Managing & Estimating AI-Assisted Development Teams",
      summary:
        "AI coding assistants have changed how Oyelabs' engineers work, and the PM's planning has to change with them, carefully. The intuitive story (\"AI makes developers twice as fast, so halve the estimate\") is not what the evidence shows. DORA's 2025 State of AI-assisted Software Development report describes AI as an amplifier: it magnifies an organisation's existing strengths and weaknesses, so teams with good tests, small batches and clear platforms gain, while teams without them ship more instability faster. METR's early-2025 controlled study of experienced open-source developers working on their own repositories found they took 19% longer with AI tools, despite expecting to be faster. Both results are snapshots, and tools improve quickly, but together they make one point: measure, don't assume.\n\nWhere does the time go? AI helps most with boilerplate, scaffolding, tests for well-specified code, migrations between known patterns and exploring unfamiliar APIs. It helps least, and sometimes hurts, on novel architecture, subtle integration logic and anything the model lacks context for. Meanwhile review effort rises: more code arrives per hour, and someone accountable must read it, test it and own it. The bottleneck moves from writing to reviewing and integrating.\n\nSo estimate by task type, not with a global discount: apply modest, evidence-based reductions to the work AI genuinely accelerates, add review and verification time, and keep AI-feature work (evaluation, prompt iteration) at full estimate. Calibrate with your own data after a few sprints, using delivery measures (DORA's throughput and instability metrics, cycle time, escaped defects) rather than lines of code or prompts used.\n\nManagement changes too: set team norms on what must be human-reviewed, protect learning for juniors so they don't outsource understanding, include AI-generated code in security review, and be explicit with clients about how AI is used and how the efficiency gains are shared.\n\nGotchas: selling the speed-up to the client before you have measured it; reporting \"40% faster\" from self-reported surveys; and letting review queues grow until cycle time worsens even as coding time shrinks.",
      level: "expert",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "DORA: State of AI-assisted Software Development 2025", url: "https://dora.dev/research/2025/dora-report/", kind: "docs" },
        { label: "DORA: Balancing AI tensions", url: "https://dora.dev/insights/balancing-ai-tensions/", kind: "article" },
        { label: "METR: Measuring the impact of early-2025 AI on experienced open-source developer productivity", url: "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/", kind: "article" },
        { label: "DORA: Software delivery performance metrics", url: "https://dora.dev/guides/dora-metrics/", kind: "docs" },
      ],
      video: {
        title: "Has This Report EXPOSED THE TRUTH About AI Assisted Software Development?",
        channel: "Modern Software Engineering",
        url: "https://www.youtube.com/watch?v=CoGO6s7bS3A",
        videoId: "CoGO6s7bS3A",
        durationLabel: "19:09",
      },
      alternateVideos: [
        {
          title: "AI-assisted software development in 2025: Inside this year's DORA report",
          channel: "Thoughtworks",
          url: "https://www.youtube.com/watch?v=NeLiadOU_-Y",
          videoId: "NeLiadOU_-Y",
          durationLabel: "37:21",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pm-x-ai-assisted-teams-q1",
          prompt: "How does DORA's 2025 report characterise AI's role in software delivery?",
          options: [
            "As an amplifier of an organisation's existing strengths and weaknesses",
            "As a replacement for engineering practices like testing",
            "As having no measurable effect",
            "As guaranteed to double throughput",
          ],
          correctIndex: 0,
          explanation:
            "DORA describes AI as an amplifier: the greatest returns come from the surrounding system, not the tools alone. It doesn't replace practices or guarantee gains.",
        },
        {
          id: "pm-x-ai-assisted-teams-q2",
          prompt:
            "In METR's early-2025 randomised study of experienced open-source developers on their own repositories, what happened when they used AI tools?",
          options: [
            "They took 19% longer to complete issues, though they had expected to be faster",
            "They finished twice as fast",
            "There was no difference in time",
            "They refused to use the tools",
          ],
          correctIndex: 0,
          explanation:
            "METR measured a 19% slowdown that contradicted developers' own expectations. It's one setting at one point in time, but it shows why self-reported speed-ups shouldn't drive estimates.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-assisted-teams-q3",
          prompt: "Which kinds of work are most likely to benefit from AI coding assistance? (Select all that apply.)",
          options: [
            "Boilerplate and scaffolding in a familiar stack",
            "Unit tests for well-specified functions",
            "Converting code between well-known patterns or versions",
            "Designing a novel architecture for a client's unusual constraints",
            "Deciding what the client actually needs",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Well-specified, pattern-heavy work benefits most. Novel design and requirements judgement depend on context and accountability the tools don't have.",
        },
        {
          id: "pm-x-ai-assisted-teams-q4",
          prompt: "Leadership proposes cutting all estimates by 40% because 'everyone uses AI now'. What is the best response?",
          options: [
            "Estimate by task type with modest, evidence-based reductions, add review time, and calibrate from the team's own delivery data",
            "Agree, and cut all estimates by 40%",
            "Refuse to change estimates at all",
            "Cut only the QA estimates",
          ],
          correctIndex: 0,
          explanation:
            "Gains vary by task and review costs rise, so a global cut is unsupported. Refusing to adapt ignores real gains on suitable work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-assisted-teams-q5",
          prompt:
            "Since adopting AI assistants, coding time per story has fallen, but cycle time has risen. What is the likeliest explanation?",
          options: [
            "Review and integration have become the bottleneck as more code arrives faster",
            "The AI tools are broken",
            "Developers are slacking",
            "Cycle time is measured incorrectly",
          ],
          correctIndex: 0,
          explanation:
            "The constraint moves downstream. Look at review queues, test reliability and batch size before blaming tools or people.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pm-x-ai-assisted-teams-q6",
          prompt: "Which measures are good indicators of AI's effect on a team's delivery? (Select all that apply.)",
          options: [
            "Lead time for changes and deployment frequency",
            "Change failure rate and failed deployment recovery time",
            "Cycle time and escaped defects",
            "Lines of code generated per day",
            "Number of prompts sent",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Delivery throughput, stability and quality show outcomes. Lines of code and prompt counts measure activity, which AI inflates by design.",
        },
        {
          id: "pm-x-ai-assisted-teams-q7",
          prompt: "What's a key management risk for junior developers in an AI-assisted team?",
          options: [
            "Outsourcing understanding: shipping code they can't explain, which weakens their growth and the team's ability to maintain it",
            "Typing too slowly",
            "Using AI more than seniors",
            "Asking too many questions",
          ],
          correctIndex: 0,
          explanation:
            "Juniors need to learn the why. Norms such as explaining AI-written code in review protect both growth and maintainability.",
        },
        {
          id: "pm-x-ai-assisted-teams-q8",
          prompt: "Where should AI-generated code sit in Oyelabs' quality and security processes?",
          options: [
            "Under the same review, testing and security scanning as human-written code, with a named human owner",
            "Exempt from review, because the model was trained on good code",
            "Reviewed only if a bug is found",
            "Reviewed by another AI tool only",
          ],
          correctIndex: 0,
          explanation:
            "Accountability doesn't transfer to the tool. AI review can assist, but a human owner must answer for what ships.",
        },
        {
          id: "pm-x-ai-assisted-teams-q9",
          prompt: "A client on a T&M contract asks how AI use affects their bill. What's the right stance?",
          options: [
            "Be transparent about how AI is used and how verified efficiency gains are reflected, and discuss whether commercials should evolve",
            "Avoid the question, since it might reduce revenue",
            "Promise a 50% reduction immediately",
            "Charge extra for AI use",
          ],
          correctIndex: 0,
          explanation:
            "Trust depends on transparency; commitments should follow measured gains. Dodging or over-promising both damage the relationship.",
        },
      ],
      practice: {
        kind: "calculate",
        prompt:
          "Re-estimate a feature set for an AI-assisted team. The original (pre-AI) estimate is broken down below. Apply the adjustment for each category from your team's measured data, then add 15% contingency to the adjusted total.",
        table: {
          columns: ["Category", "Original estimate (h)", "Measured AI adjustment"],
          rows: [
            ["Boilerplate, CRUD and scaffolding", "160", "-40%"],
            ["Third-party integrations", "120", "-10%"],
            ["AI feature evaluation and prompt iteration", "80", "0%"],
            ["Code review and QA", "40", "+25% (more code to review)"],
          ],
        },
        fields: [
          { id: "adjusted", label: "Adjusted total before contingency", unit: "h", answer: 334, tolerance: 0.5 },
          { id: "saving", label: "Saving against the original 400 h", unit: "%", answer: 16.5, tolerance: 0.1 },
          { id: "final", label: "Adjusted total with 15% contingency", unit: "h", answer: 384.1, tolerance: 0.5 },
        ],
        explanation:
          "160 x 0.6 = 96; 120 x 0.9 = 108; 80 x 1.0 = 80; 40 x 1.25 = 50. Total 334 h, a 16.5% saving on 400 h, not the 40% leadership hoped for. With contingency: 334 x 1.15 = 384.1 h. Category-level adjustments from your own data are defensible; a blanket cut is not.",
      },
    },
  ],
} satisfies Module;
