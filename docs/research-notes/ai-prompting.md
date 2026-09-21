# Prompt Engineering research notes (2026-09-21)

## Videos
- prompt-zero-few-shot: Prompt Engineering Tutorial – Master ChatGPT and LLM Responses (freeCodeCamp.org, 41:36, from "Zero shot and few shot prompts" at 1880s); the brief's verified video, chapter-split.
- prompt-chain-of-thought: How do thinking and reasoning models work? (Google for Developers, 13:26, Dec 2025); connects CoT to test-time compute and reasoning models, which is the topic's key nuance. Alternates: 4 Methods of Prompt Engineering (IBM Technology, 12:41, from "Chain of Thought (COT)" at 213s) and AI prompt engineering: A deep dive (Anthropic, 1:16:42, from "Model reasoning" at 2232s).
- prompt-role-persona: AI prompt engineering: A deep dive (Anthropic, 1:16:42, from "Honesty, personas and metaphors in prompts" at 1467s); Anthropic's prompt engineers on personas vs honest task context. Alternate: the freeCodeCamp course from "Best practices" at 1241s (covers adopting a persona).
- prompt-scoped-coding: Prompt engineering essentials: Getting better results from LLMs | Tutorial (GitHub, 9:01, Mar 2025); coding-focused, covers explicitness and multi-step tasks. Alternate: How to Write Better AI Prompts as a Software Developer in 2026 (JetBrains, 4:20).
- prompt-debugging-bad-prompt: Prompting 101 | Code w/ Claude (Anthropic, 24:52, verified as the brief asked); iterates a failing prompt (Swedish car-accident form misread as a skiing accident) into a working one. Alternate: The prompting playbook (Claude, 33:49, May 2026).
- The Anthropic deep dive is used for two topics at different chapters; the freeCodeCamp course is used for the main video of one topic and an alternate of another, at different chapters.
- No search-URL fallbacks.

## References
- Anthropic's per-technique prompt pages (`multishot-prompting`, `chain-of-thought`, `system-prompts`, `use-xml-tags`, `be-clear-and-direct`, `extended-thinking-tips`, `claude-4-best-practices`) all redirect to one page, `.../prompt-engineering/claude-prompting-best-practices`. Topics deep-link into it with heading anchors (`#use-examples-effectively`, `#give-claude-a-role`, `#structure-prompts-with-xml-tags`).
- `platform.claude.com/docs/en/test-and-evaluate/define-success` redirects to `/develop-tests`.
- `platform.openai.com/docs/guides/*` redirects to `developers.openai.com/api/docs/guides/*` (used final URLs).
- Iframe previews blocked: platform.claude.com, learn.microsoft.com, docs.github.com, code.claude.com, anthropic.com, arxiv.org, github.com. Embeddable: promptingguide.ai, developers.openai.com, genai.owasp.org, hamel.dev, simonwillison.net.

## Facts verified
- Claude prompting best practices page: 3–5 relevant, diverse examples in `<example>`/`<examples>` tags; one sentence of role in the system prompt focuses behaviour; long documents first and query last can improve quality by up to 30%; context/motivation behind instructions helps generalisation; adaptive thinking on Claude 4.6+ with an `effort` control, thinking always on for some current models; prefer general instructions ("think thoroughly") over prescriptive steps; `<thinking>` in few-shot examples carries over; manual CoT with `<thinking>`/`<answer>` as the fallback when thinking is off; verification instructions can cause over-verification on newer models; prefilled last assistant turns return 400 from Claude 4.6 onward; over-engineering tendency and a minimal-scope prompt; chaining useful to inspect intermediate outputs.
- OpenAI reasoning best practices: avoid chain-of-thought prompts, try zero-shot first then few-shot, use delimiters.
- Zheng et al. (arXiv 2311.10054): 162 roles, 2,410 factual questions, personas don't improve performance; automatic persona selection no better than random.
- Anthropic "Reasoning models don't always say what they think": hint mentioned 25% (Claude 3.7 Sonnet) / 39% (DeepSeek R1); unfaithful CoTs were longer; reward hacks verbalised under 2% of the time.
- OWASP LLM07:2025 System Prompt Leakage; LLM01:2025 Prompt Injection mitigations (least privilege, human approval, segregating external content).
- Claude prompt engineering overview: success criteria, empirical tests and a first draft are prerequisites.
- Prompting 101 demo content (skiing-accident misread) confirmed via multiple write-ups and transcript sites.
- Quizzes avoid model names and prices as answers; model names appear only in explanations of research results.
