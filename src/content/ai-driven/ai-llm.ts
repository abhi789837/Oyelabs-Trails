import type { Module } from "@/types/curriculum";

export default {
  id: "ai-llm",
  trackId: "ai-driven",
  name: "LLM Fundamentals",
  description:
    "How LLMs behave at the API boundary: tokens and context-window economics, structured output and tool calling, sampling, choosing between model families, and calling the Anthropic and OpenAI APIs directly with production-grade streaming, retries and cost control.",
  refs: [
    { label: "Claude Docs: Home", url: "https://platform.claude.com/docs/en/home", kind: "docs" },
    { label: "OpenAI API Docs", url: "https://developers.openai.com/api/docs", kind: "docs" },
    { label: "roadmap.sh: AI Engineer", url: "https://roadmap.sh/ai-engineer", kind: "article" },
    { label: "Anthropic Engineering: Effective context engineering for AI agents", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents", kind: "article" },
  ],
  topics: [
    {
      id: "llm-tokens-context-windows",
      moduleId: "ai-llm",
      trackId: "ai-driven",
      title: "Tokens, Context Windows & Their Economics",
      summary:
        "Models don't see characters or words; they see tokens, subword pieces produced by a tokenizer such as BPE. Cost, latency and every limit are denominated in tokens, and the ratio isn't fixed: roughly four characters of English prose per token, worse for code, JSON, numbers and non-Latin scripts, and it shifts between model generations (Anthropic says its newer tokenizer produces about 30% more tokens for the same text). Count with the provider's token-counting endpoint, not `text.length / 4`.\n\nThe context window is the model's working memory for one request. It holds the system prompt, tool definitions, every prior turn, tool results and the output being generated, thinking included. Chat APIs are stateless, so each turn resends the whole history and a conversation's cumulative input grows roughly quadratically with its length. Output tokens usually cost several times more than input (5x on Claude's current price list), so a verbose answer can cost more than a long prompt.\n\nPrompt caching attacks the resend problem. A stable prefix (tools, system prompt, documents, earlier turns) is written once at a premium, 1.25x the input price for a 5-minute TTL or 2x for an hour on Claude, then read back at 0.1x. Caching is a prefix match, so one timestamp at the top of the system prompt silently turns every request into a full-price miss. Batch APIs halve prices again for work that can wait, and the discounts stack.\n\nThe gotcha: a bigger window isn't a better memory. Accuracy and recall degrade as token count grows (context rot), so stuffing in 500k tokens because they fit usually loses to retrieving the 5k that matter.",
      level: "expert",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "Claude Docs: Context windows", url: "https://platform.claude.com/docs/en/build-with-claude/context-windows", kind: "docs" },
        { label: "Claude Docs: Prompt caching", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-caching", kind: "docs" },
        { label: "Claude Docs: Pricing", url: "https://platform.claude.com/docs/en/about-claude/pricing", kind: "docs" },
        { label: "Chroma Research: Context Rot", url: "https://www.trychroma.com/research/context-rot", kind: "article" },
      ],
      video: {
        title: "What is a Context Window? Unlocking LLM Secrets",
        channel: "IBM Technology",
        url: "https://www.youtube.com/watch?v=-QVoIxEpFkM",
        videoId: "-QVoIxEpFkM",
        durationLabel: "11:30",
      },
      alternateVideos: [
        {
          title: "Let's build the GPT Tokenizer",
          channel: "Andrej Karpathy",
          url: "https://www.youtube.com/watch?v=zduSFxRajkE",
          videoId: "zduSFxRajkE",
          durationLabel: "2:13:34",
        },
        {
          title: "What is Prompt Caching? Optimize LLM Latency with AI Transformers",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=u57EnkQaUTY",
          videoId: "u57EnkQaUTY",
          durationLabel: "9:06",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `estimateCost(usage, rates, options)`, which prices one Messages API response from its `usage` object. Rates are passed in as data, so the same code works for any model or provider price list.\n\n- `usage` has `input_tokens` (uncached input after the last cache breakpoint) and `output_tokens`, plus optional `cache_creation_input_tokens` and `cache_read_input_tokens` (missing means 0). It may also have `cache_creation: { ephemeral_5m_input_tokens, ephemeral_1h_input_tokens }`, the TTL breakdown of the cache writes. Without it, treat every cache write as a 5-minute write.\n- `rates` is `{ inputPerMTok, outputPerMTok, cacheWrite5m, cacheWrite1h, cacheRead, batchDiscount }`. Prices are USD per million tokens. The three cache fields are multipliers of the input price (for example `1.25`, `2` and `0.1`), and `batchDiscount` is a fraction (`0.5` means 50% off every category, cache reads and writes included).\n- `options` is optional: `{ batch, contextWindow }`.\n- Return `{ inputCost, cacheWriteCost, cacheReadCost, outputCost, totalCost, totalInputTokens, contextTokens, withinContextWindow }`. Costs are USD rounded to 6 decimals with `Math.round(x * 1e6) / 1e6`; compute `totalCost` from the unrounded parts. `totalInputTokens` is uncached input plus cache writes plus cache reads. `contextTokens` adds the output tokens, because output occupies the context window too. `withinContextWindow` is `contextTokens <= options.contextWindow`, or `null` when no window is given.\n- Throw an `Error` when any token count is negative or not an integer, or when a `cache_creation` breakdown doesn't add up to `cache_creation_input_tokens`.\n\nThe tests call `runCostScenario`, which returns your result or `{ threw: true }`. Leave it as it is.",
        starterCode: "/**\n * @param {object} usage  Anthropic-style usage object from a Messages API response\n * @param {object} rates  { inputPerMTok, outputPerMTok, cacheWrite5m, cacheWrite1h, cacheRead, batchDiscount }\n * @param {{ batch?: boolean, contextWindow?: number }} [options]\n */\nfunction estimateCost(usage, rates, options = {}) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction runCostScenario(usage, rates, options) {\n  try {\n    return estimateCost(usage, rates, options);\n  } catch (e) {\n    return { threw: true };\n  }\n}\n",
        functionName: "runCostScenario",
        testCases: [
          { description: "plain request, no caching: missing cache fields count as 0", args: [{ input_tokens: 2000, output_tokens: 500 }, { inputPerMTok: 5, outputPerMTok: 25, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, batchDiscount: 0.5 }], expected: { inputCost: 0.01, cacheWriteCost: 0, cacheReadCost: 0, outputCost: 0.0125, totalCost: 0.0225, totalInputTokens: 2000, contextTokens: 2500, withinContextWindow: null } },
          { description: "cache miss: the first request writes a 100k-token prefix at 1.25x", args: [{ input_tokens: 50, cache_creation_input_tokens: 100000, cache_read_input_tokens: 0, output_tokens: 1000 }, { inputPerMTok: 5, outputPerMTok: 25, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, batchDiscount: 0.5 }], expected: { inputCost: 0.00025, cacheWriteCost: 0.625, cacheReadCost: 0, outputCost: 0.025, totalCost: 0.65025, totalInputTokens: 100050, contextTokens: 101050, withinContextWindow: null } },
          { description: "cache hit: the same prefix read back at 0.1x", args: [{ input_tokens: 50, cache_creation_input_tokens: 0, cache_read_input_tokens: 100000, output_tokens: 1000 }, { inputPerMTok: 5, outputPerMTok: 25, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, batchDiscount: 0.5 }], expected: { inputCost: 0.00025, cacheWriteCost: 0, cacheReadCost: 0.05, outputCost: 0.025, totalCost: 0.07525, totalInputTokens: 100050, contextTokens: 101050, withinContextWindow: null } },
          { description: "a TTL breakdown prices 5-minute and 1-hour writes differently", args: [{ input_tokens: 100, cache_creation_input_tokens: 30000, cache_creation: { ephemeral_5m_input_tokens: 10000, ephemeral_1h_input_tokens: 20000 }, cache_read_input_tokens: 0, output_tokens: 200 }, { inputPerMTok: 3, outputPerMTok: 15, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, batchDiscount: 0.5 }], expected: { inputCost: 0.0003, cacheWriteCost: 0.1575, cacheReadCost: 0, outputCost: 0.003, totalCost: 0.1608, totalInputTokens: 30100, contextTokens: 30300, withinContextWindow: null } },
          { description: "the batch discount stacks with the cache-read multiplier", args: [{ input_tokens: 50, cache_creation_input_tokens: 0, cache_read_input_tokens: 100000, output_tokens: 1000 }, { inputPerMTok: 5, outputPerMTok: 25, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, batchDiscount: 0.5 }, { batch: true }], expected: { inputCost: 0.000125, cacheWriteCost: 0, cacheReadCost: 0.025, outputCost: 0.0125, totalCost: 0.037625, totalInputTokens: 100050, contextTokens: 101050, withinContextWindow: null } },
          { description: "a mix of writes, reads and output in a batch job within a 1M window", args: [{ input_tokens: 1000, cache_creation_input_tokens: 20000, cache_read_input_tokens: 80000, output_tokens: 3000 }, { inputPerMTok: 5, outputPerMTok: 25, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, batchDiscount: 0.5 }, { batch: true, contextWindow: 1000000 }], expected: { inputCost: 0.0025, cacheWriteCost: 0.0625, cacheReadCost: 0.02, outputCost: 0.0375, totalCost: 0.1225, totalInputTokens: 101000, contextTokens: 104000, withinContextWindow: true } },
          { description: "rates are data: a model with a 0.025x cache-read rate", args: [{ input_tokens: 200, cache_read_input_tokens: 1000000, output_tokens: 4000 }, { inputPerMTok: 10, outputPerMTok: 50, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.025, batchDiscount: 0.5 }], expected: { inputCost: 0.002, cacheWriteCost: 0, cacheReadCost: 0.25, outputCost: 0.2, totalCost: 0.452, totalInputTokens: 1000200, contextTokens: 1004200, withinContextWindow: null } },
          { description: "zero tokens cost nothing and fit any window", args: [{ input_tokens: 0, output_tokens: 0 }, { inputPerMTok: 5, outputPerMTok: 25, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, batchDiscount: 0.5 }, { contextWindow: 200000 }], expected: { inputCost: 0, cacheWriteCost: 0, cacheReadCost: 0, outputCost: 0, totalCost: 0, totalInputTokens: 0, contextTokens: 0, withinContextWindow: true }, isEdgeCase: true },
          { description: "input fits but input plus output overflows a 200k window", args: [{ input_tokens: 150000, cache_read_input_tokens: 40000, output_tokens: 20000 }, { inputPerMTok: 1, outputPerMTok: 5, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, batchDiscount: 0.5 }, { contextWindow: 200000 }], expected: { inputCost: 0.15, cacheWriteCost: 0, cacheReadCost: 0.004, outputCost: 0.1, totalCost: 0.254, totalInputTokens: 190000, contextTokens: 210000, withinContextWindow: false }, isEdgeCase: true },
          { description: "exactly filling the window still counts as within it", args: [{ input_tokens: 150000, cache_read_input_tokens: 40000, output_tokens: 10000 }, { inputPerMTok: 1, outputPerMTok: 5, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, batchDiscount: 0.5 }, { contextWindow: 200000 }], expected: { inputCost: 0.15, cacheWriteCost: 0, cacheReadCost: 0.004, outputCost: 0.05, totalCost: 0.204, totalInputTokens: 190000, contextTokens: 200000, withinContextWindow: true }, isEdgeCase: true },
          { description: "a negative token count throws", args: [{ input_tokens: -5, output_tokens: 100 }, { inputPerMTok: 5, outputPerMTok: 25, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, batchDiscount: 0.5 }], expected: { threw: true }, isEdgeCase: true },
          { description: "a TTL breakdown that doesn't add up to cache_creation_input_tokens throws", args: [{ input_tokens: 10, cache_creation_input_tokens: 5000, cache_creation: { ephemeral_5m_input_tokens: 1000, ephemeral_1h_input_tokens: 1000 }, output_tokens: 10 }, { inputPerMTok: 5, outputPerMTok: 25, cacheWrite5m: 1.25, cacheWrite1h: 2, cacheRead: 0.1, batchDiscount: 0.5 }], expected: { threw: true }, isEdgeCase: true },
        ],
      },
    },
    {
      id: "llm-structured-output-tool-calling",
      moduleId: "ai-llm",
      trackId: "ai-driven",
      title: "Structured Output & Function/Tool Calling",
      summary:
        "Free-form text is the wrong interface between a model and a program. Structured output and tool (function) calling both make the model emit JSON your code can act on, and they share one mechanism: you describe the shape with JSON Schema and the model fills it in. Tool calling adds a protocol on top. The model returns `tool_use` blocks naming a tool and its arguments, your code runs the function, and you send back a `tool_result`. The model never executes anything itself.\n\nThere are three levels of reliability. Prompting for JSON works most of the time and fails in production with trailing prose or missing fields. JSON mode, where a provider offers it, guarantees syntactically valid JSON but not your schema. Schema-enforced output (Claude's `output_config.format` and `strict: true` tools, OpenAI's Structured Outputs) compiles the schema into a grammar and constrains decoding so only schema-valid tokens can be sampled. That guarantee has edges: the first request with a new schema pays compilation latency, only a subset of JSON Schema is supported (Claude's API rejects keywords such as `minimum` or `maxLength` and requires `additionalProperties: false`; the SDKs strip them and validate client-side), and a refusal or a `max_tokens` cutoff can still return output that doesn't match.\n\nThe gotcha seniors miss: valid isn't correct. A schema guarantees `amount` is a number, not that it's the right number, so authorization, business rules and idempotency checks stay in your code, especially before a tool with side effects runs. Tool definitions are also prompt tokens billed on every request, and vague names and descriptions cause more wrong tool choices than weak models do.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Claude Docs: Structured outputs", url: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs", kind: "docs" },
        { label: "Claude Docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools", kind: "docs" },
        { label: "OpenAI API Docs: Structured Outputs", url: "https://developers.openai.com/api/docs/guides/structured-outputs", kind: "docs" },
        { label: "Anthropic Engineering: Writing effective tools for agents", url: "https://www.anthropic.com/engineering/writing-tools-for-agents", kind: "article" },
      ],
      video: {
        title: "LLM Fundamentals Crash Course For Beginners 2026 (Tokens, Prompting, APIs & Tool Calls)",
        channel: "Harish Neel | AI",
        url: "https://www.youtube.com/watch?v=YHNi88FaGug",
        videoId: "YHNi88FaGug",
        durationLabel: "1:13:43",
        startSeconds: 2824,
        chapterLabel: "Structured Outputs (Getting LLMs to Return JSON Reliably)",
      },
      alternateVideos: [
        {
          title: "Structured Output from LLMs: Grammars, Regex, and State Machines",
          channel: "Efficient NLP",
          url: "https://www.youtube.com/watch?v=xpvFinvqRCA",
          videoId: "xpvFinvqRCA",
          durationLabel: "17:20",
        },
        {
          title: "What is Tool Calling? Connecting LLMs to Your Data",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=h8gMhXYAv1k",
          videoId: "h8gMhXYAv1k",
          durationLabel: "4:56",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "llm-structured-output-tool-calling-q1",
          prompt:
            "An invoice-extraction pipeline uses a provider's JSON mode. Every response parses, but about 0.5% are missing the `invoice_total` field. What's going on, and what fixes it?",
          options: [
            "JSON mode only guarantees syntactically valid JSON; switch to schema-enforced structured output with `invoice_total` required",
            "JSON mode guarantees the schema, so the provider has a bug; retry the failed requests",
            "The temperature is too high; set it to 0 and the field will always appear",
            "The prompt needs the word \"JSON\" in it; adding it makes JSON mode enforce required fields",
          ],
          correctIndex: 0,
          explanation:
            "JSON mode constrains output to valid JSON, not to your schema, so a missing field is expected behaviour. Schema-enforced output (strict structured outputs) makes required fields part of the grammar; lowering temperature only makes the omission rarer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-structured-output-tool-calling-q2",
          prompt:
            "You send a Messages API request with a client tool `get_weather`, and Claude decides to use it. What happens next?",
          options: [
            "The response ends with `stop_reason: \"tool_use\"` and a `tool_use` block; your code runs the function and sends a `tool_result` back in the next request",
            "The API calls the endpoint URL registered in the tool definition and returns the final answer",
            "Claude executes the function in a sandbox and includes its return value in the response text",
            "The response contains the final answer with a `tool_calls` field listing what it would have called",
          ],
          correctIndex: 0,
          explanation:
            "For client tools the model only proposes a call; execution happens in your code, which returns the result as a `tool_result` block. Server tools such as web search are the exception, and they run on the provider's side without a URL in your definition.",
        },
        {
          id: "llm-structured-output-tool-calling-q3",
          prompt:
            "You use schema-enforced output (`strict: true` or `output_config.format`). Which of these can still happen? (Select all that apply.)",
          options: [
            "A refusal returns text that doesn't match the schema",
            "A `max_tokens` cutoff leaves the JSON incomplete",
            "A schema-valid value is simply wrong, such as a hallucinated order id",
            "A complete, non-refused response omits a required field",
            "A complete, non-refused response puts a string where the schema says integer",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Constrained decoding guarantees the shape of a completed response, which rules out the last two. It can't stop a refusal or a length cutoff, and it says nothing about whether the values are true, so semantic validation stays in your code.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-structured-output-tool-calling-q4",
          prompt:
            "You send a strict tool to Claude's API directly (no SDK helper) whose schema includes `\"quantity\": { \"type\": \"integer\", \"minimum\": 1 }`. What happens?",
          options: [
            "The request is rejected with a 400, because numerical constraints like `minimum` aren't supported in strict schemas",
            "The grammar enforces `minimum`, so the model can never produce 0",
            "`minimum` is silently ignored and the request succeeds",
            "The model sees the constraint only as a hint in the tool description",
          ],
          correctIndex: 0,
          explanation:
            "Claude's structured outputs support a JSON Schema subset and return a 400 for unsupported keywords such as `minimum`, `maxLength` or recursive schemas. The Python and TypeScript SDK helpers strip them, move them into descriptions and validate the response client-side, which is why you may not notice when using the SDK.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-structured-output-tool-calling-q5",
          prompt:
            "With OpenAI Structured Outputs in strict mode, how do you model an optional field such as `middle_name`?",
          options: [
            "List it in `required` and give it a union type that includes `null`",
            "Leave it out of the `required` array",
            "Add `\"optional\": true` to the property",
            "Give it a `default` value and omit it from `properties`",
          ],
          correctIndex: 0,
          explanation:
            "Strict mode requires every property to be listed as required and `additionalProperties: false`; optionality is expressed as `\"type\": [\"string\", \"null\"]`. Omitting it from `required` is exactly what strict mode rejects.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-structured-output-tool-calling-q6",
          prompt:
            "The model keeps calling `search_orders` when users ask about refunds, which should go to `get_refund_status`. Which fix addresses the cause?",
          options: [
            "Rewrite both tools' names and descriptions to say when to use each (and when not to), and consider merging overlapping tools",
            "Set `strict: true` on both tools so the model must pick the right one",
            "Force `tool_choice` to `get_refund_status` on every request",
            "Increase `max_tokens` so the model has room to consider both tools",
          ],
          correctIndex: 0,
          explanation:
            "Tool selection is driven by names and descriptions, so ambiguity there is the usual cause. `strict` guarantees the arguments match the schema, not that the right tool was chosen, and forcing one tool breaks every other request.",
        },
        {
          id: "llm-structured-output-tool-calling-q7",
          prompt:
            "What's wrong with this user turn sent after Claude requested a tool?\n\n```json\n{\n  \"role\": \"user\",\n  \"content\": [\n    { \"type\": \"text\", \"text\": \"Here are the results:\" },\n    { \"type\": \"tool_result\", \"tool_use_id\": \"toolu_01\", \"content\": \"15 degrees\" }\n  ]\n}\n```",
          options: [
            "`tool_result` blocks must come first in the content array; text before them causes a 400",
            "Nothing: text and tool results can appear in any order",
            "`tool_result` content must be a JSON object, not a string",
            "Tool results must be sent with `role: \"tool\"`, not `\"user\"`",
          ],
          correctIndex: 0,
          explanation:
            "Anthropic's API requires tool results to immediately follow the tool-use turn and to be the first blocks in the user message; any text goes after them. String content is allowed, and the `tool` role belongs to other providers' APIs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-structured-output-tool-calling-q8",
          prompt:
            "Claude returns two `tool_use` blocks in one response. How should you send the results?",
          options: [
            "Run both, then send one user message containing both `tool_result` blocks, each matched by `tool_use_id`",
            "Send two separate user messages, one per result, in the order they finish",
            "Send only the first result; the model will ask for the second",
            "Concatenate both outputs into one `tool_result` using the first block's id",
          ],
          correctIndex: 0,
          explanation:
            "Parallel tool calls are answered together in a single user turn, one `tool_result` per `tool_use_id`. Splitting them across messages breaks the expected structure and teaches the model to stop calling tools in parallel.",
        },
        {
          id: "llm-structured-output-tool-calling-q9",
          prompt: "Your tool's downstream API times out. What should the tool loop send back to the model?",
          options: [
            "A `tool_result` with `is_error: true` and an actionable message, such as what failed and whether retrying makes sense",
            "An empty `tool_result` with no error flag, so the conversation keeps flowing",
            "Nothing: skip the `tool_result` and send a new user message instead",
            "Throw the exception and discard the conversation",
          ],
          correctIndex: 0,
          explanation:
            "Errors are information the model can act on: retry, use another tool or explain the failure. An empty success makes it conclude there's no data, and omitting the result for a `tool_use` id makes the next request fail validation.",
        },
        {
          id: "llm-structured-output-tool-calling-q10",
          prompt:
            "An agent sends 40 tools with verbose schemas, about 12k tokens of definitions, on every request of a 10-turn conversation. Which statement is accurate?",
          options: [
            "The definitions are input tokens on all 10 requests, so caching the tool prefix or loading tools on demand matters",
            "Tool definitions are billed once per conversation",
            "Only the tools the model actually calls are billed",
            "Tool definitions are free because they're part of the system prompt",
          ],
          correctIndex: 0,
          explanation:
            "Tools are rendered into the prompt, ahead of the system prompt, on every request, and the API adds its own tool-use system prompt on top. Prompt caching or tool search/deferred loading keeps that cost from multiplying across turns.",
        },
        {
          id: "llm-structured-output-tool-calling-q11",
          prompt:
            "A `refund_payment` tool call passed strict schema validation. Which checks still belong in your code before you execute it? (Select all that apply.)",
          options: [
            "The authenticated user is allowed to refund this order",
            "The amount doesn't exceed what was originally charged",
            "An idempotency key prevents a duplicate refund if the call is retried",
            "`JSON.parse` of the input succeeds",
            "Every required field in the schema is present",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Strict mode already guarantees parseable input with all required fields. It can't know about permissions, business limits or retries, which is where real damage comes from.",
        },
        {
          id: "llm-structured-output-tool-calling-q12",
          prompt:
            "After you deploy a new output schema, the first requests that use it are noticeably slower even though prompt caching isn't involved, then latency recovers. Why?",
          options: [
            "The schema is compiled into a grammar on first use, and the compiled artifact is cached for later requests",
            "The model is fine-tuned on the new schema during the first few requests",
            "Rate limits are lower for requests with a new schema",
            "The first requests are routed to a slower model while the schema is validated",
          ],
          correctIndex: 0,
          explanation:
            "Constrained decoding needs a compiled grammar for each schema; both Anthropic and OpenAI document extra latency on the first request with a new schema and caching afterwards (Anthropic caches it for 24 hours after last use).",
        },
      ],
    },
    {
      id: "llm-sampling-parameters",
      moduleId: "ai-llm",
      trackId: "ai-driven",
      title: "Temperature & Sampling Parameters",
      summary:
        "A model doesn't output text. It outputs a score (a logit) for every token in its vocabulary, and a sampler turns those scores into one chosen token, over and over. Sampling parameters reshape that distribution before each draw. Temperature divides the logits before the softmax: below 1 sharpens toward the top token, above 1 flattens toward randomness, and 0 conventionally means greedy argmax. Top-k keeps only the k most likely tokens. Top-p (nucleus sampling) keeps the smallest set whose cumulative probability reaches p, so it adapts: a confident step keeps one or two candidates, an uncertain one keeps many. Common implementations apply these in sequence and renormalize after each filter, so the order matters.\n\nUse low temperature for extraction, classification and code, higher for brainstorming, and tune temperature or top-p rather than both. First check whether you can tune them at all. Reasoning models increasingly own their sampling: on Anthropic's API, models released after Claude Opus 4.6 reject non-default `temperature`, `top_p` and `top_k` values with a 400, and you steer them with effort settings and prompting instead.\n\nThe gotcha: temperature 0 isn't determinism. Floating-point addition isn't associative, and inference servers batch your request with other traffic, so the arithmetic, and occasionally the argmax, depends on server load. Thinking Machines traced temperature-0 completions of the same prompt diverging mid-answer to exactly this lack of batch invariance, and Anthropic's API docs warn that results aren't fully deterministic even at 0. If you need reproducibility, record outputs and write evals that tolerate variation instead of asserting exact strings.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Hugging Face Transformers: Generation strategies", url: "https://huggingface.co/docs/transformers/generation_strategies", kind: "docs" },
        { label: "Claude API Reference: Messages", url: "https://platform.claude.com/docs/en/api/messages", kind: "docs" },
        { label: "Thinking Machines: Defeating Nondeterminism in LLM Inference", url: "https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/", kind: "article" },
        { label: "Hugging Face Blog: How to generate text", url: "https://huggingface.co/blog/how-to-generate", kind: "article" },
      ],
      video: {
        title: "The Secret Controls for your LLM: Temperature, Top-K, Top-P, etc",
        channel: "Gary Explains",
        url: "https://www.youtube.com/watch?v=MkaazQttbpc",
        videoId: "MkaazQttbpc",
        durationLabel: "14:51",
      },
      alternateVideos: [
        {
          title: "Transformers, the tech behind LLMs | Deep Learning Chapter 5",
          channel: "3Blue1Brown",
          url: "https://www.youtube.com/watch?v=wjZofJX0v4M",
          videoId: "wjZofJX0v4M",
          durationLabel: "27:14",
          startSeconds: 1342,
          chapterLabel: "Softmax with temperature",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `applySampling(logits, params)`, which returns the probability distribution a sampler would draw the next token from. `logits` is an array of raw scores (index = token id). `params` may contain `temperature` (default 1), `topK` (default 0, meaning off) and `topP` (default 1, meaning off).\n\n- `temperature === 0` is greedy decoding: return a one-hot array with 1 at the highest logit (the lowest index wins a tie) and ignore the other parameters.\n- Otherwise divide every logit by the temperature and apply a numerically stable softmax: subtract the largest scaled logit before calling `Math.exp`, or large logits overflow to `Infinity` and you get `NaN`.\n- Top-k, when `topK` is a positive integer smaller than the number of tokens: keep the `topK` most probable tokens, set the rest to 0 and renormalize. Rank by probability, highest first; the lower index wins a tie.\n- Top-p, when `topP < 1`, runs after top-k on the renormalized distribution: walk the tokens from most to least probable, keep each one, and stop as soon as the kept probabilities sum to at least `topP`. At least one token is always kept. Set the rest to 0 and renormalize.\n- Return an array the same length as `logits`, with each probability rounded to 4 decimals (`Math.round(p * 1e4) / 1e4`). An empty `logits` array returns `[]`. A `normalize` helper is provided.",
        starterCode: "/**\n * Turns raw logits into the probability distribution a sampler would draw the next token from.\n * @param {number[]} logits  raw scores, one per token id (index = token id)\n * @param {{ temperature?: number, topK?: number, topP?: number }} params\n * @returns {number[]} probabilities, same length as logits, rounded to 4 decimals\n */\nfunction applySampling(logits, params = {}) {\n  // Your code here\n}\n\nfunction normalize(values) {\n  const sum = values.reduce((a, b) => a + b, 0);\n  return values.map((v) => v / sum);\n}\n",
        functionName: "applySampling",
        testCases: [
          { description: "temperature 1 is a plain softmax", args: [[2, 1, 0], { temperature: 1 }], expected: [0.6652, 0.2447, 0.09] },
          { description: "temperature 0.5 sharpens toward the top token", args: [[2, 1, 0], { temperature: 0.5 }], expected: [0.8668, 0.1173, 0.0159] },
          { description: "temperature 2 flattens the distribution", args: [[2, 1, 0], { temperature: 2 }], expected: [0.5065, 0.3072, 0.1863] },
          { description: "top-k 2 keeps the two most likely tokens and renormalizes", args: [[2, 1, 0, -1], { topK: 2 }], expected: [0.7311, 0.2689, 0, 0] },
          { description: "top-p 0.9 keeps the smallest set reaching 90%", args: [[2, 1, 0, -1], { topP: 0.9 }], expected: [0.6652, 0.2447, 0.09, 0] },
          { description: "temperature and top-p combined", args: [[2, 1, 0, -1], { temperature: 0.5, topP: 0.9 }], expected: [0.8808, 0.1192, 0, 0] },
          { description: "top-p alone at 0.66 keeps two tokens", args: [[3, 2, 1, 0, -1], { topP: 0.66 }], expected: [0.7311, 0.2689, 0, 0, 0] },
          { description: "top-k first, then top-p on the renormalized distribution: only one token survives", args: [[3, 2, 1, 0, -1], { topK: 3, topP: 0.66 }], expected: [1, 0, 0, 0, 0], isEdgeCase: true },
          { description: "temperature 0 is greedy, and a tied maximum goes to the lower index", args: [[1, 3, 3, 2], { temperature: 0 }], expected: [0, 1, 0, 0], isEdgeCase: true },
          { description: "a tiny top-p still keeps at least one token", args: [[5, 1, 0], { topP: 0.01 }], expected: [1, 0, 0], isEdgeCase: true },
          { description: "top-k ties are broken by the lower index", args: [[1, 1, 1, 0], { topK: 2 }], expected: [0.5, 0.5, 0, 0], isEdgeCase: true },
          { description: "huge logits don't overflow with a stable softmax", args: [[1000, 999, 998], { temperature: 1 }], expected: [0.6652, 0.2447, 0.09], isEdgeCase: true },
          { description: "top-k larger than the vocabulary is a no-op", args: [[2, 1, 0], { topK: 5 }], expected: [0.6652, 0.2447, 0.09] },
          { description: "an empty vocabulary returns an empty distribution", args: [[], { temperature: 0.7 }], expected: [], isEdgeCase: true },
        ],
      },
    },
    {
      id: "llm-model-families",
      moduleId: "ai-llm",
      trackId: "ai-driven",
      title: "Comparing Model Families at a High Level",
      summary:
        "There's no best model, only a best model for a given job, budget and latency target, and families differ along a few axes that matter more than leaderboard rank. Size tiers (a provider's largest, mid-size and small models) trade capability for price and speed, with several-fold per-token price gaps between tiers. Reasoning (thinking) models spend extra output tokens deliberating before they answer: they win on multi-step math, planning, debugging and agentic work, and lose on latency, cost and simple tasks where the thinking is wasted. Many current models are hybrids with a dial (effort or a reasoning budget) rather than a separate model.\n\nOpen-weight models (Llama, Qwen, DeepSeek, Mistral, Gemma and others) can be self-hosted, fine-tuned and run where data can't leave your network, but you inherit serving, scaling, safety tuning and GPU bills, and open weights aren't open source: licences vary and training data usually isn't released. Hosted frontier APIs give the strongest capability with no ops, in exchange for per-token pricing and a dependency on someone else's roadmap and deprecation schedule.\n\nChoose by measuring, not by reputation. Build a small eval set from real inputs and compare candidates on quality, latency (time to first token for chat, total time for batch) and cost per completed task rather than per token: a cheaper model that needs retries or extra agent turns isn't cheaper. Route when traffic is mixed, sending the easy majority to a small model and the hard tail to a large one.\n\nGotchas: tokenizers differ, so identical text costs different token counts across families and even generations; a large context window says nothing about how well a model uses it; and aliases move while snapshots retire, so pin versions and re-run evals on every upgrade.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Claude Docs: Choosing the right model", url: "https://platform.claude.com/docs/en/about-claude/models/choosing-a-model", kind: "docs" },
        { label: "Claude Docs: Models overview", url: "https://platform.claude.com/docs/en/models/overview", kind: "docs" },
        { label: "OpenAI API Docs: Reasoning models", url: "https://developers.openai.com/api/docs/guides/reasoning", kind: "docs" },
        { label: "Artificial Analysis: Model intelligence, speed and price comparisons", url: "https://artificialanalysis.ai/", kind: "article" },
      ],
      video: {
        title: "How to Choose Large Language Models: A Developer’s Guide to LLMs",
        channel: "IBM Technology",
        url: "https://www.youtube.com/watch?v=pYax2rupKEY",
        videoId: "pYax2rupKEY",
        durationLabel: "6:56",
      },
      alternateVideos: [
        {
          title: "What Are Large Reasoning Models (LRMs)? Smarter AI Beyond LLMs",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=enLbj0igyx4",
          videoId: "enLbj0igyx4",
          durationLabel: "8:37",
        },
        {
          title: "Why AI Models Pause to Think: Test Time Compute Explained",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=DAlC8mL5ZlI",
          videoId: "DAlC8mL5ZlI",
          durationLabel: "10:31",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "llm-model-families-q1",
          prompt:
            "You need to classify 2 million support tickets a day into 10 fixed categories, with p95 latency under one second. Which approach should you evaluate first?",
          options: [
            "The provider's smallest fast model with a schema-constrained output, checked against a labelled sample of real tickets",
            "The largest reasoning model at maximum effort, because accuracy matters most",
            "Fine-tuning a new model from scratch on your ticket history",
            "An agent that researches each ticket with web search before classifying",
          ],
          correctIndex: 0,
          explanation:
            "Narrow, high-volume, latency-bound classification is the textbook case for a small model, and an eval set tells you whether it's good enough. Escalate to a bigger model or add routing only if the small one measurably fails.",
        },
        {
          id: "llm-model-families-q2",
          prompt: "Which statements about reasoning (thinking) modes are generally true? (Select all that apply.)",
          options: [
            "Thinking tokens are billed as output tokens",
            "They add latency before the visible answer starts",
            "They help most on multi-step problems such as planning, math and debugging",
            "They reduce cost on simple lookups because the model is more efficient",
            "Thinking tokens don't count toward the context window",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Reasoning is extra generated output: it's billed as output, delays the answer and pays off on hard multi-step tasks. On trivial tasks it's pure overhead, and Anthropic and OpenAI both count thinking tokens toward the context window.",
        },
        {
          id: "llm-model-families-q3",
          prompt:
            "A hospital needs a model that runs entirely on its own hardware and can be fine-tuned on internal clinical shorthand. Which option fits?",
          options: [
            "An open-weight model deployed and fine-tuned on the hospital's infrastructure",
            "The largest hosted frontier model, called with a no-logging request header",
            "Any hosted model plus RAG, since retrieval removes the need to run the model locally",
            "A hosted reasoning model, because thinking tokens aren't retained by the provider",
          ],
          correctIndex: 0,
          explanation:
            "Only open weights can run on your own hardware and be fine-tuned freely there; you take on serving, scaling and safety tuning in return. RAG changes what the model reads, not where it runs.",
        },
        {
          id: "llm-model-families-q4",
          prompt:
            "Model A costs $1/$5 per million input/output tokens and needs 6 agent turns per task; because each turn resends the growing history, those turns total 195,000 input and 6,000 output tokens. Model B costs $5/$25 and finishes in 1 turn of 20,000 input and 1,000 output tokens. Which is cheaper per completed task?",
          options: [
            "Model B: about $0.125 per task versus $0.225 for model A",
            "Model A: it's five times cheaper per token, so it's five times cheaper per task",
            "They cost the same, because price and turns cancel out",
            "Model A: about $0.075 per task versus $0.125 for model B",
          ],
          correctIndex: 0,
          explanation:
            "A: 195k × $1/M + 6k × $5/M = $0.195 + $0.03 = $0.225. B: 20k × $5/M + 1k × $25/M = $0.10 + $0.025 = $0.125. Per-token price is the wrong unit; cost per completed task includes the extra turns and the resent history.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-model-families-q5",
          prompt: "For a streaming chat assistant, which latency metric most shapes how fast it feels to users?",
          options: [
            "Time to first token",
            "Total generation time for the full answer",
            "The model's parameter count",
            "The size of the context window",
          ],
          correctIndex: 0,
          explanation:
            "With streaming, users perceive responsiveness from when text starts appearing. Total time matters for batch jobs and tool loops, and neither parameter count nor window size is a latency metric.",
        },
        {
          id: "llm-model-families-q6",
          prompt:
            "You move identical prompts to a newer model generation with the same per-token prices, and the bill rises about 25%. What's the most likely cause?",
          options: [
            "The newer generation's tokenizer splits the same text into more tokens",
            "Newer models charge for the unused part of the context window",
            "Per-token prices are the same, so the bill can't change without more traffic",
            "Newer models always generate exactly 25% more output",
          ],
          correctIndex: 0,
          explanation:
            "Token counts are tokenizer-specific. Anthropic, for example, notes that its newer tokenizer produces about 30% more tokens for the same text, so re-baseline with the token-counting API when you migrate.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-model-families-q7",
          prompt:
            "Model X has a 1M-token context window and model Y has 200k. You need to answer questions over a 600k-token corpus. Which statement is right?",
          options: [
            "X can accept the corpus, but recall degrades with length, so compare it against retrieval over the corpus on your own questions",
            "X will answer as accurately at 600k tokens as at 10k, since it fits in the window",
            "Y can't be used for this corpus at all",
            "A larger context window means stronger reasoning, so X is the better model overall",
          ],
          correctIndex: 0,
          explanation:
            "Window size is a capacity limit, not a quality guarantee: context rot means long inputs are used less reliably. Y can still serve the corpus through retrieval, which is often cheaper and more accurate.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-model-families-q8",
          prompt: "Which are sound reasons to route requests between models? (Select all that apply.)",
          options: [
            "Easy requests can go to a cheaper model while hard ones go to a stronger model",
            "A second model or provider gives you a fallback during overloads or refusals",
            "Latency-critical paths can use a faster model than background jobs",
            "One model's prompt cache can be reused by another, so routing costs nothing extra",
            "All providers use the same tokenizer, so costs stay identical across models",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Routing trades complexity for cost, resilience and latency. It isn't free: a prompt cache stores one model's internal state for a prefix, so traffic split across models can't share cache hits, and tokenizers differ across families.",
        },
        {
          id: "llm-model-families-q9",
          prompt:
            "Production code calls a floating model alias, and one morning output formatting changes without any deploy on your side. What should you change?",
          options: [
            "Pin a dated or versioned model id and re-run your evals before each deliberate upgrade",
            "Lower the temperature so outputs stop drifting",
            "Add more formatting instructions whenever the output changes",
            "Switch providers, since aliases never move on other platforms",
          ],
          correctIndex: 0,
          explanation:
            "Aliases point at whatever the provider currently designates, so behaviour can shift under you. Pinning makes upgrades a decision you test, and retirement dates tell you when you must move.",
        },
        {
          id: "llm-model-families-q10",
          prompt: "Which statement about open-weight models is accurate?",
          options: [
            "The weights are downloadable, but licences vary and some restrict use; the training data is usually not released",
            "They're always OSI-approved open source with no usage restrictions",
            "They're always cheaper than hosted APIs, whatever the traffic volume",
            "They can't be fine-tuned, only prompted",
          ],
          correctIndex: 0,
          explanation:
            "Open weights means you can run and modify the model, subject to its licence. Cost depends on utilization: at low or spiky volume, idle GPUs often make self-hosting more expensive than per-token APIs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-model-families-q11",
          prompt: "A newly released model tops a public leaderboard. What should you do before switching production traffic?",
          options: [
            "Run your own task-specific eval set and compare quality, latency and cost per task",
            "Switch immediately, since leaderboards measure general capability",
            "Rely on the vendor's reported benchmark numbers",
            "Compare the models' context window sizes",
          ],
          correctIndex: 0,
          explanation:
            "Public benchmarks are useful signals but rarely match your inputs, output format and constraints. A few dozen real cases with automated checks tell you more than a leaderboard position.",
        },
      ],
    },
    {
      id: "llm-calling-api-directly",
      moduleId: "ai-llm",
      trackId: "ai-driven",
      title: "Calling an LLM API Directly (Anthropic & OpenAI)",
      summary:
        "SDKs and frameworks are thin wrappers over one HTTP call, and production problems get debugged at that layer. Anthropic's Messages API is `POST /v1/messages` with `x-api-key` and `anthropic-version` headers and a JSON body: `model`, a required `max_tokens`, an optional top-level `system` prompt, and a `messages` array of user and assistant turns whose `content` is a string or typed blocks. The response carries `content` blocks, a `stop_reason` (`end_turn`, `max_tokens`, `stop_sequence`, `tool_use`, `pause_turn`, `refusal` or `model_context_window_exceeded`) and a `usage` object worth logging on every call. OpenAI's Responses API has the same bones under other names (`instructions`, `input`, `output` items, `max_output_tokens`). Unless you opt into provider-side state, you own the conversation history and resend it every turn.\n\n`max_tokens` is a ceiling, not a target, and output shares the context window with input. Always branch on `stop_reason`: treating a `max_tokens` cutoff as a finished answer ships truncated JSON. Stream anything long. The API sends server-sent events (`message_start`, `content_block_delta`, `message_delta` with cumulative usage, `message_stop`), which keeps idle connections alive and gets the first token on screen quickly, but an error can arrive mid-stream after an HTTP 200.\n\nRetries are where naive clients hurt themselves. Retry 429 (rate limited; honour `retry-after`), 529 (overloaded), 500 and connection failures with capped exponential backoff plus jitter, and never retry a 400. The official SDKs already retry twice by default, so wrapping them in your own loop multiplies attempts. A retried generation is billed again and isn't idempotent the way a `PUT` is, since the answer can differ, so make your own side effects (emails, charges, tool executions) idempotent before you add retries.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Claude Docs: Using the Messages API", url: "https://platform.claude.com/docs/en/build-with-claude/working-with-messages", kind: "docs" },
        { label: "Claude Docs: Streaming messages", url: "https://platform.claude.com/docs/en/build-with-claude/streaming", kind: "docs" },
        { label: "Claude API Docs: Errors", url: "https://platform.claude.com/docs/en/api/errors", kind: "docs" },
        { label: "AWS Architecture Blog: Exponential Backoff and Jitter", url: "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/", kind: "article" },
      ],
      video: {
        title: "LLM Fundamentals Crash Course For Beginners 2026 (Tokens, Prompting, APIs & Tool Calls)",
        channel: "Harish Neel | AI",
        url: "https://www.youtube.com/watch?v=YHNi88FaGug",
        videoId: "YHNi88FaGug",
        durationLabel: "1:13:43",
        startSeconds: 2088,
        chapterLabel: "Calling LLM APIs (OpenAI, Anthropic, Gemini) & Streaming",
      },
      alternateVideos: [
        {
          title: "Build Hour: Responses API",
          channel: "OpenAI",
          url: "https://www.youtube.com/watch?v=hNr5EebepYs",
          videoId: "hNr5EebepYs",
          durationLabel: "51:15",
        },
        {
          title: "Learn Claude AI – Build Text Summarizers, Image Describers, and More with the Anthropic API",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=QfJB9d0J3Iw",
          videoId: "QfJB9d0J3Iw",
          durationLabel: "47:49",
          startSeconds: 619,
          chapterLabel: "Talk to Claude",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "llm-calling-api-directly-q1",
          prompt:
            "A request to a current Claude model with a 200k-token context window carries 190,000 input tokens and `max_tokens: 16000`. What happens?",
          options: [
            "The API accepts it; if generation reaches the window limit it stops with `stop_reason: \"model_context_window_exceeded\"`",
            "The API silently drops the oldest messages to make room for the output",
            "Nothing special: only input tokens count toward the context window",
            "The API rejects it with a 400 because the input alone is too long",
          ],
          correctIndex: 0,
          explanation:
            "Output occupies the context window too. On Claude 4.5 and newer models, input plus `max_tokens` may exceed the window and generation stops at the limit with that stop reason; older models returned a validation error instead. A 400 \"prompt is too long\" happens only when the input alone exceeds the window.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-calling-api-directly-q2",
          prompt:
            "A support chat resends the full history every turn: a 2,000-token system prompt, and each turn adds about 800 tokens. Why does turn 40 cost far more than turn 1, and what's the main lever?",
          options: [
            "Each request resends the whole conversation, so per-turn input grows linearly and the total grows roughly quadratically; cache the stable prefix and trim or compact old turns",
            "Providers add a per-conversation surcharge that grows with every turn",
            "The model accumulates output tokens in server-side memory and bills for storing them",
            "Later turns use a more expensive model tier automatically",
          ],
          correctIndex: 0,
          explanation:
            "The API is stateless: turn 40 sends roughly 2,000 + 39 × 800 tokens of history. Prompt caching bills repeated prefixes at a fraction of the input price, and compaction or summarising old turns keeps the history from growing without bound.",
        },
        {
          id: "llm-calling-api-directly-q3",
          prompt:
            "Integration tests call a model with `temperature: 0` and assert the exact output string. They fail intermittently. Why?",
          options: [
            "Inference isn't bitwise deterministic (batching and floating-point order vary with server load), and some newer models don't accept a non-default temperature at all",
            "Temperature 0 is ignored whenever the SDK retries a request",
            "Prompt caching returns stale answers from a previous test run",
            "The SDK injects a random seed into every request",
          ],
          correctIndex: 0,
          explanation:
            "Temperature 0 picks the argmax, but tiny numerical differences from batch composition can change it, and one changed token changes everything after it. Assert on structure and properties, or on a judge's verdict, rather than exact strings.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-calling-api-directly-q4",
          prompt:
            "Your code runs `JSON.parse(response.content[0].text)` and crashes on long invoices. The failing responses have `stop_reason: \"max_tokens\"`. What's the right fix?",
          options: [
            "Branch on `stop_reason`: raise `max_tokens` (streaming if it's large) and never parse a truncated response as complete",
            "Retry the identical request until the parse succeeds",
            "Lower the temperature so the model writes shorter JSON",
            "Strip trailing characters until `JSON.parse` stops throwing",
          ],
          correctIndex: 0,
          explanation:
            "`max_tokens` means the output was cut off. Retrying with the same limit fails again, and repairing truncated JSON can silently drop data.",
        },
        {
          id: "llm-calling-api-directly-q5",
          prompt: "Which responses should a client retry with backoff? (Select all that apply.)",
          options: [
            "429 `rate_limit_error`, waiting at least as long as `retry-after`",
            "529 `overloaded_error`",
            "500 `api_error`",
            "400 `invalid_request_error`",
            "401 `authentication_error`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Rate limits, overload and internal errors are transient. A malformed request or a bad key fails the same way on every attempt, so retrying only burns time and quota.",
        },
        {
          id: "llm-calling-api-directly-q6",
          prompt: "Why add random jitter to exponential backoff?",
          options: [
            "So many clients rate-limited at the same moment don't all retry in lockstep and cause another spike",
            "To make each retry cheaper",
            "Because the API rejects retries that arrive at exact powers of two",
            "To guarantee the retry reaches a different server",
          ],
          correctIndex: 0,
          explanation:
            "Without jitter, synchronized clients retry together, recreating the overload that caused the errors. Randomizing the delay spreads the load, as AWS's classic analysis shows.",
        },
        {
          id: "llm-calling-api-directly-q7",
          prompt:
            "While streaming, after an HTTP 200 and several text deltas, you receive `event: error` with `{\"type\": \"overloaded_error\"}`. What's true?",
          options: [
            "Errors can arrive inside a stream after the 200, so the stream handler must detect them and decide whether to retry or resume",
            "This can't happen; errors always arrive as HTTP status codes before the stream starts",
            "The SDK transparently resumes the stream from the last delta at no extra cost",
            "The partial text is guaranteed to be a complete answer",
          ],
          correctIndex: 0,
          explanation:
            "Anthropic documents mid-stream error events, such as an `overloaded_error` that would be a 529 in a non-streaming call. Recovery means retrying, or sending the partial response back and asking the model to continue.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-calling-api-directly-q8",
          prompt:
            "Your streaming client adds up `usage.output_tokens` from every `message_delta` event, and your cost dashboard reports too many output tokens. Why?",
          options: [
            "Token counts in `message_delta` usage are cumulative, so you should take the final value, not the sum",
            "Output tokens are double-billed when streaming",
            "`message_delta` usage includes the input tokens",
            "Ping events carry usage that must be subtracted",
          ],
          correctIndex: 0,
          explanation:
            "The docs warn that `message_delta` usage values are cumulative totals. Summing them overcounts whenever more than one delta carries usage.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "llm-calling-api-directly-q9",
          prompt: "Where does the system prompt go in a Claude Messages API request?",
          options: [
            "In the top-level `system` parameter; the `messages` array starts with a user turn",
            "As the first element of `messages` with `role: \"system\"`",
            "In an `instructions` field, as in OpenAI's Responses API",
            "In a request header",
          ],
          correctIndex: 0,
          explanation:
            "Claude takes the system prompt as a top-level parameter and requires the first message to come from the user. A leading system-role message is the Chat Completions convention, and `instructions` is the Responses API's name for it.",
        },
        {
          id: "llm-calling-api-directly-q10",
          prompt:
            "An agent sends an email through a tool; the next model call times out and your client re-runs the whole turn, tool included. The customer gets two emails. What's the root fix?",
          options: [
            "Make the side-effecting tool idempotent (an idempotency key per logical action) and retry only the failed API call, not the executed tools",
            "Disable retries everywhere",
            "Increase the request timeout",
            "Switch to streaming so timeouts can't happen",
          ],
          correctIndex: 0,
          explanation:
            "Retries are necessary, but they must not replay side effects. Record completed tool executions and deduplicate by key; timeouts and dropped connections will still happen occasionally.",
        },
        {
          id: "llm-calling-api-directly-q11",
          prompt: "Why do Anthropic's docs recommend streaming (or the Batches API) for requests that may run for many minutes?",
          options: [
            "Networks can drop idle HTTP connections, and the SDKs refuse non-streaming requests expected to exceed about 10 minutes",
            "Streaming is billed at a lower per-token price",
            "Streaming raises your rate limits",
            "Streaming removes the need for `max_tokens`",
          ],
          correctIndex: 0,
          explanation:
            "A long non-streaming request sits idle until the whole answer is ready, which some networks cut off. Streaming keeps bytes flowing, and Batches let you poll for results instead of holding a connection open.",
        },
        {
          id: "llm-calling-api-directly-q12",
          prompt: "Which statements about Claude API rate limits are true? (Select all that apply.)",
          options: [
            "They use a token bucket, so capacity replenishes continuously rather than resetting each minute",
            "On most models, cache reads don't count toward the input-tokens-per-minute limit",
            "A large `max_tokens` value doesn't reduce your output-tokens-per-minute headroom",
            "All models share one organization-wide token bucket",
            "A 429 always carries a `retry-after` header that tells you when access resumes",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "OTPM counts tokens actually generated, and cache-aware ITPM makes caching a throughput lever. Limits apply per model class, and a monthly spend-cap 429 has no `retry-after` because retrying won't succeed until the cap resets.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
  ],
} satisfies Module;
