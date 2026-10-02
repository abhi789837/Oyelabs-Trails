import type { Module } from "@/types/curriculum";

export default {
  id: "bd-ai",
  trackId: "bd",
  name: "AI-Powered Business Development",
  description:
    "Research and personalisation at scale, drafting proposals with Claude, and the accuracy, consent and confidentiality checks that keep AI-assisted selling honest.",
  refs: [
    { label: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", kind: "spec" },
  ],
  topics: [
    {
      id: "bd-x-ai-research-personalisation",
      moduleId: "bd-ai",
      trackId: "bd",
      title: "AI for Account Research and Personalisation at Scale",
      summary:
        "AI assistants such as Claude change the economics of research. A seller who once spent 30 minutes reading an account's annual report, job posts and news before a first email can get a structured brief in minutes, and can personalise outreach for a hundred accounts instead of ten. Used well, that means more relevant conversations: an email that references the client's actual expansion plans and connects them to a problem you solve.\n\nThe quality of the output depends on the input. Effective prompts give context (who you are, what you sell, your ideal client profile), the task, the sources to use, the output format (for example a table of 'trigger, evidence, source, relevance'), and explicit permission to answer 'not found' rather than guess. Ask for the source of every factual claim, and check them: models can produce fluent, specific and wrong statements, such as congratulating a prospect on a funding round that never happened.\n\nThere are limits beyond accuracy. Outreach to individuals is regulated: in the UK, electronic marketing rules distinguish individual from corporate subscribers, and data protection law applies to the personal data you collect and enrich, including transparency about where you got it. Scraping and enriching personal data at scale without a lawful basis is a compliance problem, not a growth hack. And the CRM data, client notes and pricing you paste into a tool must be allowed by your company's AI policy and the tool's commercial terms.\n\nThe trade-off is scale versus authenticity. 'Personalisation' generated for 1,000 contacts often becomes a template with a token fact inserted, and buyers recognise it. Use AI to find genuinely relevant triggers for a focused list, keep a human deciding whom to contact and what to say, and track reply quality, not just volume.",
      level: "expert",
      estMinutes: 50,
      webRefs: [
        { label: "Claude Docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices", kind: "docs" },
        { label: "ICO: Direct marketing and privacy and electronic communications", url: "https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/", kind: "docs" },
        { label: "HubSpot: AI in sales", url: "https://blog.hubspot.com/sales/ai-in-sales", kind: "article" },
        { label: "Salesforce: AI for sales", url: "https://www.salesforce.com/sales/ai/", kind: "article" },
      ],
      video: {
        title: "How I Use Claude to Book 4-6 Meetings Every Week (Live Walkthrough)",
        channel: "30 Minutes to President’s Club",
        url: "https://www.youtube.com/watch?v=FiSwFnWMc8o",
        videoId: "FiSwFnWMc8o",
      },
      alternateVideos: [
        {
          title: "Claude Cowork for sales",
          channel: "Claude",
          url: "https://www.youtube.com/watch?v=dDg7vhvtbEE",
          videoId: "dDg7vhvtbEE",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-x-ai-research-personalisation-q1",
          prompt: "Which prompt elements most improve the accuracy of an AI account-research brief? (Select all that apply.)",
          options: [
            "Specifying the sources to use and asking for the source of each claim",
            "Explicitly allowing the answer 'not found' instead of guessing",
            "Giving context about your offer and ideal client profile",
            "Asking the model to sound confident",
            "Asking for as many facts as possible regardless of source",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Grounding in sources, permission to say 'not found' and clear context reduce invented details. Pushing for confidence or volume encourages the model to fill gaps.",
        },
        {
          id: "bd-x-ai-research-personalisation-q2",
          prompt:
            "An AI-drafted email opens: \"Congratulations on your recent Series C!\" The prospect actually raised a Series B last year. What went wrong in the process?",
          options: [
            "A factual claim reached the email without being checked against a source",
            "The model was too slow",
            "Personalisation is always a bad idea",
            "The email was too short",
          ],
          correctIndex: 0,
          explanation:
            "Models can produce specific, plausible errors. Every factual claim in outreach should trace to a source a human has checked.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-ai-research-personalisation-q3",
          prompt: "Which is the strongest use of AI personalisation in outreach?",
          options: [
            "Finding a genuine trigger (for example a job post for 20 warehouse staff) and linking it to a problem you solve",
            "Inserting the prospect's first name and company name into a template",
            "Mentioning the prospect's hobbies from social media",
            "Generating 1,000 slightly different versions of the same pitch",
          ],
          correctIndex: 0,
          explanation:
            "Relevance comes from a real business trigger connected to your offer. Name tokens and personal trivia are surface personalisation, and buyers notice.",
        },
        {
          id: "bd-x-ai-research-personalisation-q4",
          prompt:
            "A seller wants to paste the full CRM export, including client notes and pricing, into a free personal AI account to speed up research. What is the right response?",
          options: [
            "Stop and use only tools approved under the company's AI policy, whose commercial terms cover how data is handled",
            "Go ahead, since the data is already digital",
            "Go ahead if they delete the chat afterwards",
            "Only remove the pricing column first",
          ],
          correctIndex: 0,
          explanation:
            "Confidential and personal data should go only into approved tools with suitable terms. Deleting a chat afterwards does not undo the disclosure, and removing one column leaves the rest.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-ai-research-personalisation-q5",
          prompt:
            "Under UK electronic marketing rules, why does it matter whether you are emailing an individual or a corporate subscriber?",
          options: [
            "Unsolicited marketing emails to individuals generally need consent, while corporate subscribers are treated differently, though data protection law still applies to the personal data",
            "It does not matter; all B2B email is exempt from every rule",
            "Corporate subscribers can never be emailed",
            "Individuals can be emailed without any restriction",
          ],
          correctIndex: 0,
          explanation:
            "The rules distinguish subscriber types, and sole traders and some partnerships count as individuals. Being B2B does not exempt you from data protection obligations.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-ai-research-personalisation-q6",
          prompt: "Which output format best supports checking an AI research brief quickly?",
          options: [
            "A table of trigger, evidence, source link and relevance to our offer",
            "A long narrative paragraph",
            "A single summary sentence",
            "A list of adjectives describing the company",
          ],
          correctIndex: 0,
          explanation:
            "Structured output with a source per claim makes verification fast and makes gaps visible.",
        },
        {
          id: "bd-x-ai-research-personalisation-q7",
          prompt: "After introducing AI research, the team's email volume tripled but reply rates fell. What should you look at? (Select all that apply.)",
          options: [
            "Whether 'personalisation' became a template with a token fact",
            "Whether targeting widened beyond your ideal client profile",
            "Whether deliverability suffered from the higher volume",
            "Whether the model's font settings changed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Shallow personalisation, poorer targeting and deliverability are the usual causes. Measure reply quality and meetings, not volume.",
        },
        {
          id: "bd-x-ai-research-personalisation-q8",
          prompt: "Who should decide which accounts to contact and what the final message says?",
          options: [
            "A human seller, using the AI's research as input",
            "The AI, automatically, to maximise volume",
            "Whoever has the most time that week",
            "The prospect's assistant",
          ],
          correctIndex: 0,
          explanation:
            "AI speeds up research and drafting; judgement about relevance, tone and accuracy stays with an accountable person.",
        },
        {
          id: "bd-x-ai-research-personalisation-q9",
          prompt: "Why is enriching a large list with personal data scraped from many sites a risk even when the goal is B2B outreach?",
          options: [
            "Data protection law applies to that personal data, including having a lawful basis and being transparent about the source",
            "Scraped data is always accurate, so there is no risk",
            "Only consumer marketing is regulated",
            "It is only a risk if the list exceeds a million records",
          ],
          correctIndex: 0,
          explanation:
            "Work email addresses and names are personal data. Collection, enrichment and use need a lawful basis and transparency, whatever the list size.",
        },
      ],
      practice: {
        kind: "write",
        prompt:
          "Write the prompt you would give Claude to produce a research brief on a target account before a first outreach email. Include context, task, sources, output format and accuracy guardrails, and say what must not be included.",
        context:
          "You are a BD manager at a software agency that builds AI-enabled customer apps and operations tools. The target is a mid-size logistics company with about 2,000 employees. You want to know whether they have a problem you can help with and a relevant reason to contact their Head of Operations now. Your company's AI policy allows public information and anonymised notes in the approved workspace, and forbids client pricing or personal data from other clients.",
        wordLimit: 300,
        rubric: [
          { id: "context", label: "Gives context", description: "States who you are, what you sell and who the target contact is.", weight: 1 },
          { id: "sources", label: "Defines sources and citations", description: "Limits research to public sources (website, annual report, job posts, news) and requires a source link for each claim.", weight: 1.5 },
          { id: "unknown", label: "Permits 'not found'", description: "Explicitly tells the model to say 'not found' rather than guess, and to flag uncertainty.", weight: 1 },
          { id: "format", label: "Structured output", description: "Asks for a table or structured list (trigger, evidence, source, relevance) and a suggested angle.", weight: 1 },
          { id: "policy", label: "Respects data rules", description: "Excludes other clients' data and pricing, and avoids collecting unnecessary personal details about individuals.", weight: 1 },
        ],
        sampleAnswer:
          "You are helping a BD manager at a software agency that builds AI-enabled customer apps and operations tools. I am preparing a first email to the Head of Operations at a logistics company with about 2,000 employees.\n\nTask: research the company and find up to five recent triggers (from the last 12 months) that suggest an operations or customer-experience problem we could help with. Examples include expansion, new depots, hiring for manual roles, service complaints and system changes.\n\nSources: use only public information, such as the company website, annual report, press releases, job postings and reputable news. Do not use social media posts about individual employees.\n\nOutput: a table with the columns Trigger, Evidence (a short quote), Source URL, Date, and Relevance to us (one line). After the table, suggest one angle for the email in two sentences.\n\nAccuracy rules: every factual claim needs a source URL. If you cannot find something, write 'not found'; do not guess or infer numbers. Mark anything you are unsure of as 'unverified'.\n\nDo not include personal details about individuals beyond their name and role, and do not reference other clients or our pricing. I will verify every source before using any of this.",
      },
    },
    {
      id: "bd-x-ai-proposal-drafting",
      moduleId: "bd-ai",
      trackId: "bd",
      title: "Drafting Proposals with Claude",
      summary:
        "Proposals are where AI saves BD teams the most time and where it can do the most damage. A model like Claude can turn discovery notes, an RFP and your approved content library into a well-structured first draft in minutes: an executive summary that restates the client's goals, a scope section, a phased plan and answers to standard questions. That frees senior people to spend their time on the parts that win: the win themes, the solution approach and pricing.\n\nThe workflow that works is grounded drafting. Give the model the source material, not just a request: the discovery notes, the RFP text, approved boilerplate, real case studies with their real metrics, and your pricing sheet. Instruct it to use only those sources, to quote or cite where it draws on them (Claude's API offers a citations feature for exactly this), and to mark gaps as '[NEEDS INPUT]' instead of filling them. Ask for structure that mirrors the RFP, so compliance is easy to check.\n\nThen review as if a junior wrote it, because the failure modes are predictable: invented case studies or metrics, certifications the agency does not hold, a client name carried over from an example, prices or timelines that do not match the pricing sheet or the SOW, and confident promises (unlimited revisions, guaranteed outcomes) that create contractual exposure. Every number, claim, name and commitment needs a human check against a source.\n\nThe trade-off is speed versus voice and accuracy. Drafts that are fast but generic read like everyone else's AI proposal; drafts that are specific need good inputs. And confidentiality applies: RFPs and client documents are often under NDA, so only use tools your company has approved under terms that protect that data.",
      level: "expert",
      estMinutes: 50,
      webRefs: [
        { label: "Claude Docs: Citations", url: "https://platform.claude.com/docs/en/build-with-claude/citations", kind: "docs" },
        { label: "Claude Docs: Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", kind: "docs" },
        { label: "Claude Docs: Prompt engineering overview", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview", kind: "docs" },
      ],
      video: {
        title: "AI for Sales Proposals: Sales Proposals with Claude in Seconds",
        channel: "AutoRFP",
        url: "https://www.youtube.com/watch?v=J6QEg0q593s",
        videoId: "J6QEg0q593s",
        durationLabel: "10:48",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-x-ai-proposal-drafting-q1",
          prompt: "Which inputs make an AI-drafted proposal more accurate and specific? (Select all that apply.)",
          options: [
            "The discovery notes and the RFP text",
            "Approved case studies with their real metrics",
            "The current pricing sheet",
            "A request to 'make it impressive' with no sources",
            "Another client's past proposal with their name left in",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Grounded inputs give the model true material to work from. A vague 'impressive' request invites invention, and another client's proposal risks leaking confidential details and wrong names.",
        },
        {
          id: "bd-x-ai-proposal-drafting-q2",
          prompt: "What should you instruct the model to do when information it needs is missing?",
          options: [
            "Mark the gap clearly (for example '[NEEDS INPUT]') rather than filling it",
            "Make a reasonable assumption and keep going",
            "Use typical industry figures",
            "Leave the section out silently",
          ],
          correctIndex: 0,
          explanation:
            "Visible gaps are easy to fill correctly; invented or silently missing content is how errors reach clients.",
        },
        {
          id: "bd-x-ai-proposal-drafting-q3",
          prompt:
            "An AI draft says your agency is 'ISO 27001 certified'. You are not certified, though you follow some of its controls. What does this show?",
          options: [
            "The model produced a plausible but false claim, which could be a misrepresentation if it reached the client",
            "It is close enough to be acceptable",
            "Certifications do not matter in proposals",
            "The model has access to information you do not",
          ],
          correctIndex: 0,
          explanation:
            "Claims about certifications, clients and results must be checked against fact. Following some controls is not certification, and stating otherwise misleads the buyer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-ai-proposal-drafting-q4",
          prompt: "Which parts of an AI-drafted proposal must a human verify line by line? (Select all that apply.)",
          options: [
            "Every price, timeline and number",
            "Every case study, client name and metric",
            "Every commitment that could become a contractual obligation",
            "The font and colour scheme",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Numbers, claims and commitments carry commercial and legal risk. Formatting can be reviewed normally.",
        },
        {
          id: "bd-x-ai-proposal-drafting-q5",
          prompt: "Why ask the model to structure the response to mirror the RFP's numbering?",
          options: [
            "It makes compliance easy to check and matches how evaluators score",
            "Models cannot produce other structures",
            "It shortens the proposal",
            "RFPs legally require it",
          ],
          correctIndex: 0,
          explanation:
            "Mirroring the RFP lets you see at a glance that every requirement is answered, and lets evaluators find answers where they expect them.",
        },
        {
          id: "bd-x-ai-proposal-drafting-q6",
          prompt:
            "A colleague uploads an RFP marked 'Confidential: shared under NDA' to a consumer AI app on their personal account. What is the main problem?",
          options: [
            "It may breach the NDA and your company's AI policy, since the tool's terms may not protect the data",
            "The app may format it poorly",
            "Consumer apps cannot read PDFs",
            "It is fine as long as the result is good",
          ],
          correctIndex: 0,
          explanation:
            "Confidential client documents belong only in approved tools under terms that protect them. Output quality does not cure a confidentiality breach.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-ai-proposal-drafting-q7",
          prompt:
            "The draft's timeline says 12 weeks, the pricing sheet assumes 16 weeks of effort, and the SOW template says 14. What is the right fix?",
          options: [
            "Resolve the true timeline with delivery and make every document consistent before sending",
            "Keep 12 weeks because it is most attractive",
            "Average them to 14 weeks",
            "Leave them; the client will not compare",
          ],
          correctIndex: 0,
          explanation:
            "Inconsistent documents become disputes later. The real timeline comes from delivery, and every document must match it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-ai-proposal-drafting-q8",
          prompt: "Where should senior BD time go once AI handles first drafts?",
          options: [
            "Win themes, the solution approach and pricing strategy",
            "Formatting and spell-checking",
            "Writing standard company boilerplate",
            "Nowhere; senior review is no longer needed",
          ],
          correctIndex: 0,
          explanation:
            "AI is good at structure and standard content; the parts that win deals still need experienced judgement.",
        },
        {
          id: "bd-x-ai-proposal-drafting-q9",
          prompt: "Why do many AI-drafted proposals read as generic?",
          options: [
            "They were generated from thin inputs, so the model fills space with general statements rather than client-specific detail",
            "Models are not able to write specific content",
            "Generic proposals win more often",
            "Proposals must be generic for legal reasons",
          ],
          correctIndex: 0,
          explanation:
            "Specific inputs (the client's numbers, quotes from discovery, real evidence) produce specific drafts. Without them, the output is fluent but interchangeable.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Below is part of a proposal Claude drafted from your discovery notes for a dental-clinic chain's booking app. Your pricing sheet says $96,000 over 16 weeks. Mark the sentences a reviewer must catch before it goes out.",
        segments: [
          { id: "d1", text: "Your goal is to move 60% of bookings online within a year, freeing reception teams for patient care.", issue: null },
          { id: "d2", text: "We propose a patient booking app for iOS and Android, integrated with your practice-management system.", issue: null },
          { id: "d3", text: "For BrightSmile Dental, our similar app cut no-shows by 47% in six months.", issue: "An unverified case study and metric, possibly invented; it must match a real, approved case study." },
          { id: "d4", text: "Delivery is planned in three phases over 16 weeks.", issue: null },
          { id: "d5", text: "Our team is HIPAA-certified, guaranteeing full compliance.", issue: "A false or invalid claim (there is no official HIPAA certification) and a guarantee that creates legal exposure." },
          { id: "d6", text: "The total investment is $86,000.", issue: "The price does not match the $96,000 pricing sheet." },
          { id: "d7", text: "Appointment reminders will be sent by SMS and email, configurable by each clinic.", issue: null },
          { id: "d8", text: "We include unlimited design revisions at no extra cost.", issue: "An open-ended commitment that creates scope and margin risk; not in your standard terms." },
          { id: "d9", text: "[NEEDS INPUT: confirm whether the clinics use one or several practice-management systems.]", issue: null },
          { id: "d10", text: "A named project manager will run fortnightly progress reviews with your operations lead.", issue: null },
        ],
        askExplanation: true,
      },
    },
    {
      id: "bd-x-ai-ethics-accuracy-confidentiality",
      moduleId: "bd-ai",
      trackId: "bd",
      title: "AI in BD: Accuracy, Confidentiality and Ethics Checks",
      summary:
        "Using AI in business development creates three kinds of risk that existed before but now move faster: saying things that are not true, exposing information that is not yours to share, and treating people in ways they would object to if they knew. A BD team needs a short, enforced set of checks, not a vague 'be careful'.\n\nAccuracy: language models can hallucinate, producing fluent, specific statements that are false. Anthropic's own guidance on reducing hallucinations includes letting the model say it does not know, grounding answers in quoted source material, and verifying claims with citations. In BD that translates to a rule: no fact, number, client name, certification or commitment reaches a client unless a person has checked it against a source.\n\nConfidentiality: discovery notes, RFPs, pricing and client data are often covered by NDAs and data protection law. Before using any AI tool, check that it is approved under your company's policy and that its commercial terms cover how inputs are retained and whether they are used for training (commercial and consumer offerings can differ). Minimise what you share; anonymise where possible.\n\nEthics and transparency: do not use AI to impersonate real people, fabricate testimonials, or pressure buyers with misleading personalisation. Be honest when a client asks whether AI was used, and do not present AI-generated analysis as research you did not do. Frameworks such as the NIST AI Risk Management Framework (Govern, Map, Measure, Manage) and regulators' AI guidance give structure for a team policy.\n\nThe gotcha is that most incidents are not malicious; they are rushed. A seller under quarter-end pressure pastes a client's spreadsheet into an unapproved tool, or sends a draft without checking one number. Make the safe path the easy path: approved tools, prompt templates with guardrails built in, and a pre-send checklist.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework", kind: "spec" },
        { label: "Claude Docs: Reduce hallucinations", url: "https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations", kind: "docs" },
        { label: "Anthropic Privacy Center: Is my data used for model training?", url: "https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training", kind: "docs" },
        { label: "ICO: Artificial intelligence guidance", url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/", kind: "docs" },
      ],
      video: {
        title: "Why do AI models hallucinate?",
        channel: "Claude",
        url: "https://www.youtube.com/watch?v=005JLRt3gXI",
        videoId: "005JLRt3gXI",
        durationLabel: "5:14",
      },
      alternateVideos: [
        {
          title: "Why Large Language Models Hallucinate",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=cfqtFvWOfg0",
          videoId: "cfqtFvWOfg0",
          durationLabel: "9:38",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bd-x-ai-ethics-accuracy-confidentiality-q1",
          prompt: "What is an AI 'hallucination' in a BD context?",
          options: [
            "A fluent, specific statement from the model that is not true, such as an invented metric or client",
            "A model refusing to answer",
            "A slow response",
            "An answer that is too short",
          ],
          correctIndex: 0,
          explanation:
            "Hallucinations are dangerous precisely because they look as confident and specific as true statements.",
        },
        {
          id: "bd-x-ai-ethics-accuracy-confidentiality-q2",
          prompt: "Which techniques reduce hallucinations when using Claude for BD work? (Select all that apply.)",
          options: [
            "Allowing the model to say it does not know",
            "Grounding answers in quoted source documents",
            "Asking for citations and checking them",
            "Raising the pressure: 'you must give a number'",
            "Asking for longer answers",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "These three appear in Anthropic's guidance on reducing hallucinations. Forcing an answer or more length encourages invention.",
        },
        {
          id: "bd-x-ai-ethics-accuracy-confidentiality-q3",
          prompt: "Before putting client information into an AI tool, what should you check?",
          options: [
            "That the tool is approved under company policy and its terms cover data retention and training use",
            "Only that the tool gives good answers",
            "That the client will not find out",
            "That the file is under 10 MB",
          ],
          correctIndex: 0,
          explanation:
            "Approval and terms decide whether sharing is permitted. Answer quality and secrecy are not safeguards.",
        },
        {
          id: "bd-x-ai-ethics-accuracy-confidentiality-q4",
          prompt:
            "A client asks directly: \"Did you use AI to write this proposal?\" Parts were drafted with Claude and reviewed by your team. What is the best answer?",
          options: [
            "Say yes, explain how it was used and that your team checked and owns every claim",
            "Deny it, since clients may see it negatively",
            "Avoid the question and change the subject",
            "Say AI wrote all of it, to seem innovative",
          ],
          correctIndex: 0,
          explanation:
            "Honesty protects trust, and explaining the human review shows accountability. Denial risks the relationship if it comes out later.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-ai-ethics-accuracy-confidentiality-q5",
          prompt: "Which uses of AI in BD cross an ethical line? (Select all that apply.)",
          options: [
            "Generating a fake testimonial from a 'happy client'",
            "Cloning a real executive's voice for outreach calls without consent",
            "Inventing a sense of urgency with false claims about limited availability",
            "Summarising public information about an account before a call",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Fabricated proof, impersonation and deceptive pressure mislead buyers. Summarising public information for preparation is a legitimate use.",
        },
        {
          id: "bd-x-ai-ethics-accuracy-confidentiality-q6",
          prompt: "What are the four functions of the NIST AI Risk Management Framework core?",
          options: [
            "Govern, Map, Measure, Manage",
            "Plan, Build, Test, Deploy",
            "Identify, Protect, Detect, Respond",
            "Collect, Train, Evaluate, Release",
          ],
          correctIndex: 0,
          explanation:
            "The AI RMF core is Govern, Map, Measure and Manage. Identify, Protect, Detect and Respond come from the NIST Cybersecurity Framework, a different document.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bd-x-ai-ethics-accuracy-confidentiality-q7",
          prompt: "Why do most AI-related incidents in sales teams happen, according to the reasoning in this topic?",
          options: [
            "Time pressure leads people to skip checks or use unapproved tools, rather than deliberate wrongdoing",
            "Models are designed to leak data",
            "Sellers are generally dishonest",
            "AI tools are always insecure",
          ],
          correctIndex: 0,
          explanation:
            "Rushed shortcuts cause most problems, which is why making the safe path easy (approved tools, templates, checklists) works better than warnings.",
        },
        {
          id: "bd-x-ai-ethics-accuracy-confidentiality-q8",
          prompt: "Which belong in a pre-send checklist for AI-assisted client documents? (Select all that apply.)",
          options: [
            "Every number and claim traced to a source",
            "Client names and details correct and not carried over from other clients",
            "No confidential information from other clients included",
            "Commitments checked against standard terms",
            "Word count above 2,000",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Accuracy, correct names, confidentiality and commitments are the real risks. Length is not a quality check.",
        },
        {
          id: "bd-x-ai-ethics-accuracy-confidentiality-q9",
          prompt:
            "To speed up research, a seller wants to run every inbound lead's personal LinkedIn activity through an AI tool to score 'buying intent' and store the results. What should you consider first?",
          options: [
            "Whether processing that personal data has a lawful basis, is transparent and proportionate, and whether the scoring could be unfair",
            "Only whether the tool is fast",
            "Nothing, because LinkedIn data is public",
            "Whether competitors already do it",
          ],
          correctIndex: 0,
          explanation:
            "Publicly visible personal data is still personal data. Profiling needs a lawful basis, transparency and fairness, which regulators' AI guidance emphasises.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "It is the last week of the quarter. Your team is finishing a large proposal for a financial-services prospect. The RFP was shared under an NDA. Your company has an approved AI workspace with commercial terms that exclude training on your data.",
        steps: [
          {
            id: "ai1",
            question:
              "You discover a junior seller pasted the RFP into a free personal AI account last night to get a summary. What do you do first?",
            options: [
              "Stop further use, record what was shared and where, and report it to your manager and whoever handles data incidents under company policy",
              "Ask them to delete the chat and say nothing",
              "Ignore it, since the deadline matters more",
              "Tell the client immediately before investigating",
            ],
            correctIndex: 0,
            explanation: "Contain and report through the proper channel so the company can assess NDA and data obligations; quietly deleting hides a possible breach.",
          },
          {
            id: "ai2",
            question:
              "In the approved workspace, Claude drafts a section stating your agency 'reduced fraud losses by 35% for a leading bank'. You cannot find this in your case-study library. What do you do?",
            options: [
              "Remove it unless someone can produce the verified source, and replace it with a real, approved case study",
              "Keep it, since it sounds plausible",
              "Change it to 30% to be safe",
              "Keep it but remove the word 'leading'",
            ],
            correctIndex: 0,
            explanation: "Unverifiable claims are treated as false; softening the number does not make it true.",
          },
          {
            id: "ai3",
            question: "After submission, what change would most reduce the chance of these problems next quarter?",
            options: [
              "Roll out approved tools with prompt templates, a short AI policy briefing and a mandatory pre-send checklist",
              "Ban all AI tools",
              "Warn the team to be careful",
              "Let each seller decide their own rules",
            ],
            correctIndex: 0,
            explanation: "Making the safe path the easy one works better than bans (which drive use underground) or warnings (which are forgotten under pressure).",
          },
        ],
      },
    },
  ],
} satisfies Module;
