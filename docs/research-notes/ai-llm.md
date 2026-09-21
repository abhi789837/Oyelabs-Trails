# LLM Fundamentals research notes (2026-09-21)

## Videos
- llm-tokens-context-windows: What is a Context Window? Unlocking LLM Secrets (IBM Technology, 11:30, Jan 2025); focused explainer of what fills the window. Alternates: Let's build the GPT Tokenizer (Andrej Karpathy, 2:13:34, Feb 2024) as the tokenization deep dive, and What is Prompt Caching? (IBM Technology, 9:06, Feb 2026) for the economics half.
- llm-structured-output-tool-calling: LLM Fundamentals Crash Course For Beginners 2026 (Harish Neel | AI, 1:13:43, Aug 2026), from "Structured Outputs (Getting LLMs to Return JSON Reliably)" at 2824s (runs on through the response payload and tool-calls chapters). Alternates: Structured Output from LLMs: Grammars, Regex, and State Machines (Efficient NLP, 17:20) for how constrained decoding works, and What is Tool Calling? (IBM Technology, 4:56).
- llm-sampling-parameters: The Secret Controls for your LLM: Temperature, Top-K, Top-P, etc (Gary Explains, 14:51, May 2026). Alternate: Transformers, the tech behind LLMs (3Blue1Brown, 27:14), from "Softmax with temperature" at 1342s.
- llm-model-families: How to Choose Large Language Models: A Developer's Guide to LLMs (IBM Technology, 6:56, May 2025). Alternates: What Are Large Reasoning Models (LRMs)? (IBM Technology, 8:37, Nov 2025) and Why AI Models Pause to Think: Test Time Compute Explained (IBM Technology, 10:31, Jun 2026).
- llm-calling-api-directly: the same Harish Neel crash course from "Calling LLM APIs (OpenAI, Anthropic, Gemini) & Streaming" at 2088s (a different chapter from the structured-output topic). Alternates: Build Hour: Responses API (OpenAI, 51:15, Oct 2025) and Learn Claude AI – Build Text Summarizers, Image Describers, and More with the Anthropic API (freeCodeCamp.org, 47:49, Oct 2024) from "Talk to Claude" at 619s; the latter predates current model names but the Messages API shape is unchanged.
- No search-URL fallbacks. Every video confirmed `embeddable: true` with `yt.mjs info`.

## References
- `docs.claude.com` redirects to `platform.claude.com/docs/en/home`; `/about-claude/models/overview` redirects to `/docs/en/models/overview`; `/api/handling-stop-reasons` redirects to `/build-with-claude/handling-stop-reasons`.
- OpenAI docs moved: `platform.openai.com/docs/guides/*` redirects to `developers.openai.com/api/docs/guides/*`, used as final URLs.
- `research.trychroma.com/context-rot` redirects to `www.trychroma.com/research/context-rot`.
- Iframe previews blocked: platform.claude.com and anthropic.com (CSP `frame-ancestors 'self'`), huggingface.co, aws.amazon.com, roadmap.sh. Embeddable: developers.openai.com, thinkingmachines.ai, trychroma.com, artificialanalysis.ai.

## Facts verified
- Claude context windows doc: the window includes the response and thinking; "context rot" is named; on Claude 4.5+ input + `max_tokens` may exceed the window and generation stops with `model_context_window_exceeded`; input alone over the window is a 400.
- Claude pricing: cache writes 1.25x (5 min) and 2x (1 h), reads 0.1x (0.025x on Fable 5.1/Mythos 5.1); multipliers stack with the 50% Batch discount; current output price is 5x input for every listed model; the 4.7+ tokenizer produces about 30% more tokens; tool-use system prompt overhead per model.
- Prompt caching doc: `input_tokens` excludes cached tokens (total = read + creation + input); cache hits don't count toward ITPM on most models; prefix order tools → system → messages.
- Structured outputs doc: constrained decoding with grammars cached 24 h; unsupported keywords (`minimum`, `maxLength`, recursive schemas) return 400; `additionalProperties: false` required; refusals and `max_tokens` can still break schema; SDKs strip constraints and validate client-side. OpenAI Structured Outputs doc: JSON mode ensures valid JSON but not schema adherence; strict mode needs all fields required with optional fields as a null union; first-request latency per new schema.
- Handle tool calls doc: `tool_result` blocks must come first in the user message (text before them is a 400); `is_error: true`; retries 2–3 times on missing params.
- Messages API reference: temperature deprecated on models released after Opus 4.6 (only 1.0 accepted, others 400); "not fully deterministic even at 0.0". Search of platform.claude.com confirmed temperature/top_p/top_k non-default values return 400 from Opus 4.7 on. Thinking Machines post: batch invariance, not just concurrency, explains temperature-0 nondeterminism.
- Streaming doc: event flow, cumulative `message_delta` usage, mid-stream `overloaded_error`, resume strategy (continue-instruction for 4.6+). Errors doc: 429/500/504/529 semantics, SDKs retry twice by default honouring `retry-after`, SDKs refuse non-streaming requests expected over 10 minutes. Rate limits doc: token bucket, OTPM ignores `max_tokens`, cache-aware ITPM, per-model limits, spend-cap 429 has no `retry-after`.
- OpenAI reasoning doc: reasoning tokens billed as output and occupy the context window.
- Model names are deliberately not used as quiz answers; open-weight family names appear only as examples in the summary.
