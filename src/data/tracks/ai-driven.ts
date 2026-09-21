import type { Track } from "@/types/curriculum";

export const aiDrivenTrack: Track = {
  id: "ai-driven",
  name: "AI-Driven Development",
  tagline: "Work with AI coding tools deliberately, from prompts and context to agents.",
  accentToken: "ridge",
  topics: [
    {
      id: "ai-coding-tools",
      trackId: "ai-driven",
      title: "The AI Coding Tools Landscape",
      summary:
        "IDE assistants like GitHub Copilot and Cursor, terminal and cloud coding agents like Claude Code, and prompt-to-app builders like v0 and Lovable: what each is good at and where it fits.",
      level: "beginner",
      estMinutes: 60,
      webRef: { label: "roadmap.sh: Vibe Coding Roadmap", url: "https://roadmap.sh/vibe-coding" },
      videoRef: {
        label: "freeCodeCamp: AI-Assisted Coding Tutorial (Copilot, Claude Code, Gemini CLI)",
        url: "https://www.youtube.com/watch?v=wlpBCazAY9Q",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "ai-coding-tools-q1",
          prompt: "What sets an agentic coding tool (Claude Code, Cursor's agent, Copilot's cloud agent) apart from inline autocomplete?",
          options: [
            "It only works offline",
            "It can plan multi-step changes, read and edit many files, and run commands such as tests",
            "It never makes mistakes",
            "It only suggests the next line of code",
          ],
          correctIndex: 1,
          explanation:
            "Agents work in a loop over your project (reading, editing, running and checking) rather than completing the line under your cursor.",
        },
        {
          id: "ai-coding-tools-q2",
          prompt: "What are prompt-to-app builders such as v0 or Lovable best suited for?",
          options: [
            "Quickly prototyping UIs and small apps from a description, which you then review and harden",
            "Replacing code review on production systems",
            "Managing cloud infrastructure",
            "Running database migrations safely",
          ],
          correctIndex: 0,
          explanation:
            "They're fast for exploring ideas and frontends; production code still needs the usual review, tests and security checks.",
        },
        {
          id: "ai-coding-tools-q3",
          prompt: "Who is responsible for AI-generated code merged into a team codebase?",
          options: [
            "The AI vendor",
            "Nobody, since it was generated",
            "The developer who merges it: they review, test and understand it like any other contribution",
            "Only the QA team",
          ],
          correctIndex: 2,
          explanation:
            "AI is a tool; the engineer who ships the change owns its correctness, security and maintainability.",
        },
        {
          id: "ai-coding-tools-q4",
          prompt: "Which is a sensible first task to hand an AI coding agent in an unfamiliar repo?",
          options: [
            "Rewrite the whole app in a new framework",
            "Rotate the production credentials",
            "Merge straight to main without review",
            "A well-scoped change with a clear definition of done, such as adding tests for one module",
          ],
          correctIndex: 3,
          explanation:
            "Small, verifiable tasks let you judge the tool's output quickly and keep the blast radius low.",
        },
      ],
    },
    {
      id: "prompt-engineering",
      trackId: "ai-driven",
      title: "Prompt Engineering for Developers",
      summary:
        "Writing clear, scoped prompts for coding assistants: zero- and few-shot examples, asking for step-by-step reasoning, giving the right surrounding context, and iterating on results.",
      level: "beginner",
      estMinutes: 60,
      isMilestone: true,
      webRef: {
        label: "Microsoft Learn: Introduction to prompt engineering with GitHub Copilot",
        url: "https://learn.microsoft.com/en-us/training/modules/introduction-prompt-engineering-with-github-copilot/",
      },
      videoRef: {
        label: "Anthropic: Prompting 101 (Code w/ Claude)",
        url: "https://www.youtube.com/watch?v=ysPbXH0LpIE",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "prompt-engineering-q1",
          prompt: "What is few-shot prompting?",
          options: [
            "Sending the same prompt several times and picking the best answer",
            "Limiting the model to a few output tokens",
            "Including a few input/output examples so the model follows the demonstrated pattern",
            "Asking several different models the same question",
          ],
          correctIndex: 2,
          explanation:
            "Examples show the format and style you want more reliably than describing it; zero-shot gives none.",
        },
        {
          id: "prompt-engineering-q2",
          prompt: "What does zero-shot prompting mean?",
          options: [
            "Giving the task with instructions only, no examples",
            "A prompt with no instructions at all",
            "A prompt the model refuses to answer",
            "Resetting the conversation before every message",
          ],
          correctIndex: 0,
          explanation:
            "Zero-shot relies entirely on the instructions; add examples (one- or few-shot) when the output format matters.",
        },
        {
          id: "prompt-engineering-q3",
          prompt: "When does asking the model to reason step by step (chain-of-thought) help most?",
          options: [
            "Simple lookups like a capital city",
            "Multi-step problems, where working through intermediate steps before answering improves accuracy",
            "Formatting a date",
            "Anything, because it always makes answers shorter",
          ],
          correctIndex: 1,
          explanation:
            "Reasoning first gives the model room to break a problem down; many current models can also do this with built-in thinking.",
        },
        {
          id: "prompt-engineering-q4",
          prompt: "Which prompt will get the best result from a coding assistant?",
          options: [
            "Make the code better.",
            "Fix the bugs.",
            "Write validation.",
            "In src/users/service.ts, make createUser reject empty names and invalid emails with a 400 error, and add a unit test for each case.",
          ],
          correctIndex: 3,
          explanation:
            "Naming the file, the behavior and the definition of done removes guesswork and makes the result easy to verify.",
        },
        {
          id: "prompt-engineering-q5",
          prompt: "Microsoft's Copilot guidance sums up good prompts as the 4 S's. Which set is it?",
          options: [
            "Simple, Secure, Scalable, Shipped",
            "Single, Specific, Short, Surround",
            "Syntax, Semantics, Style, Structure",
            "Setup, Solve, Summarize, Save",
          ],
          correctIndex: 1,
          explanation:
            "One task at a time, explicit details, concise wording, and surrounding context such as descriptive file names and related open files.",
        },
      ],
    },
    {
      id: "context-engineering",
      trackId: "ai-driven",
      title: "Context Engineering & AI Pair Programming",
      summary:
        "Curating what the AI sees: project context files (CLAUDE.md, AGENTS.md, Cursor rules, copilot-instructions.md), scoped prompts and fresh sessions, then reviewing and testing what it produces.",
      level: "intermediate",
      estMinutes: 90,
      webRef: {
        label: "Anthropic: Effective context engineering for AI agents",
        url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents",
      },
      videoRef: {
        label: "Anthropic: Claude Code best practices (Code w/ Claude)",
        url: "https://www.youtube.com/watch?v=gv0WHhKelSE",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "context-engineering-q1",
          prompt: "What is a project context file like CLAUDE.md, AGENTS.md or .github/copilot-instructions.md for?",
          options: [
            "Storing API keys for the AI tool",
            "Persistent instructions the tool loads automatically: stack, conventions, commands and do/don't rules",
            "A changelog of every AI conversation",
            "Enforcing security policies the model can't ignore",
          ],
          correctIndex: 1,
          explanation:
            "Context files give every session the same project knowledge; they guide the model but aren't enforced like hooks or CI.",
        },
        {
          id: "context-engineering-q2",
          prompt: "Why can pasting your entire repository into the context make results worse?",
          options: [
            "Irrelevant tokens dilute the model's attention and use up the context window; a small set of high-signal context works better",
            "Models can't read code",
            "It's always slower but never less accurate",
            "Context windows only accept one file",
          ],
          correctIndex: 0,
          explanation:
            "Recall degrades as context grows (context rot), so curate what's relevant rather than including everything.",
        },
        {
          id: "context-engineering-q3",
          prompt: "When reviewing AI-written code, what deserves the most scrutiny?",
          options: [
            "Variable naming only",
            "Whether the code is formatted",
            "How long the AI took",
            "Edge cases, security (auth, injection, secrets), invented APIs or packages, and whether tests really assert behavior",
          ],
          correctIndex: 3,
          explanation:
            "AI output often looks plausible; the costly mistakes hide in edge cases, security gaps and hallucinated dependencies.",
        },
        {
          id: "context-engineering-q4",
          prompt: "A long AI session starts drifting and repeating the same mistakes. What usually helps?",
          options: [
            "Keep pasting the error until it works",
            "Switch off tests so it can finish",
            "Start a fresh session with a concise summary of the goal, decisions made and current state",
            "Ask it to try harder",
          ],
          correctIndex: 2,
          explanation:
            "A clean context without the failed attempts, plus a crisp summary, often gets a stuck task moving again.",
        },
        {
          id: "context-engineering-q5",
          prompt: "What's a healthy pair-programming loop with an AI agent?",
          options: [
            "Plan first, work in small verifiable steps, run tests after each, and commit checkpoints",
            "Describe the whole product once and accept the result",
            "Let it push to production directly",
            "Only use it after the code is written",
          ],
          correctIndex: 0,
          explanation:
            "Small steps with checks and commits make it cheap to catch mistakes and roll back.",
        },
      ],
    },
    {
      id: "llm-fundamentals",
      trackId: "ai-driven",
      title: "LLM Fundamentals",
      summary:
        "How LLMs read and write tokens, what fills the context window (prompt, history, tool definitions and output), and how structured outputs and tool use (function calling) connect models to your code.",
      level: "intermediate",
      estMinutes: 90,
      webRef: { label: "Claude Developer Platform docs", url: "https://platform.claude.com/docs/en/home" },
      videoRef: {
        label: "Andrej Karpathy: Deep Dive into LLMs like ChatGPT",
        url: "https://www.youtube.com/watch?v=7xTGNNLPyMI",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "llm-fundamentals-q1",
          prompt: "What is a token?",
          options: [
            "An API key",
            "A chunk of text, often part of a word, that the model reads and generates; limits and pricing are counted in tokens",
            "One full sentence",
            "A unit of GPU memory",
          ],
          correctIndex: 1,
          explanation:
            "Models process text as token sequences, so both context limits and costs are measured in tokens.",
        },
        {
          id: "llm-fundamentals-q2",
          prompt: "What counts toward a model's context window?",
          options: [
            "Only the user's latest message",
            "Only the model's training data",
            "Everything in the request (system prompt, conversation history, documents, tool definitions) plus the response it generates",
            "Only files you upload",
          ],
          correctIndex: 2,
          explanation:
            "The context window is the model's working memory for a request, and its own output shares the same budget.",
        },
        {
          id: "llm-fundamentals-q3",
          prompt: "What's the most reliable way to get JSON your app can parse?",
          options: [
            "Use structured outputs or strict tool definitions with a JSON Schema the API enforces, then validate",
            "Ask politely for JSON and hope",
            "Increase the temperature",
            "Parse the response with a regular expression",
          ],
          correctIndex: 0,
          explanation:
            "Schema-constrained output guarantees valid structure; validating still catches values your app can't accept.",
        },
        {
          id: "llm-fundamentals-q4",
          prompt: "How does tool use (function calling) work?",
          options: [
            "The model runs your code on its own servers",
            "The model edits your database directly",
            "Tools are only for image generation",
            "You describe tools with names and JSON schemas; the model asks to call one, your code runs it and sends back the result",
          ],
          correctIndex: 3,
          explanation:
            "The model only decides which tool to call and with what input; your application executes it and returns a tool result.",
        },
        {
          id: "llm-fundamentals-q5",
          prompt: "In most LLM APIs, what does lowering the temperature do?",
          options: [
            "Makes responses shorter",
            "Makes outputs more focused and repeatable; higher values make them more varied",
            "Reduces the price per token",
            "Increases the context window",
          ],
          correctIndex: 1,
          explanation:
            "Temperature controls sampling randomness; it doesn't change length limits or cost.",
        },
        {
          id: "llm-fundamentals-q6",
          prompt: "Why can an LLM state false facts confidently?",
          options: [
            "It's programmed to lie",
            "It looks every fact up online but misreads it",
            "It generates likely-sounding text from learned patterns rather than retrieving facts, so ground it with sources and verify",
            "It only happens with long prompts",
          ],
          correctIndex: 2,
          explanation:
            "Fluency isn't accuracy; retrieval, citations and checks keep answers grounded.",
        },
      ],
    },
    {
      id: "rag-basics",
      trackId: "ai-driven",
      title: "Retrieval-Augmented Generation",
      summary:
        "Grounding an LLM in your own data: chunk documents, embed them as vectors in a vector database, retrieve the most similar chunks for a query, and pass them to the model as context.",
      level: "advanced",
      estMinutes: 120,
      isMilestone: true,
      webRef: { label: "roadmap.sh: AI Engineer Roadmap", url: "https://roadmap.sh/ai-engineer" },
      videoRef: {
        label: "freeCodeCamp: Production RAG with LangChain & Vector Databases",
        url: "https://www.youtube.com/watch?v=mHxLXzYjQRE",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "rag-basics-q1",
          prompt: "What problem does RAG solve?",
          options: [
            "It trains a new model on your documents",
            "It grounds answers in your own, current documents by retrieving relevant passages and adding them to the prompt",
            "It makes the model respond faster",
            "It removes the need for a context window",
          ],
          correctIndex: 1,
          explanation:
            "Retrieval brings in knowledge the model wasn't trained on, without retraining, and lets you cite sources.",
        },
        {
          id: "rag-basics-q2",
          prompt: "What is an embedding?",
          options: [
            "A vector of numbers representing meaning, so similar texts end up close together",
            "A compressed copy of a document",
            "An HTML iframe",
            "A database index on a text column",
          ],
          correctIndex: 0,
          explanation:
            "Embedding models map text to points in vector space where distance reflects semantic similarity.",
        },
        {
          id: "rag-basics-q3",
          prompt: "Why split documents into chunks before embedding them?",
          options: [
            "Vector databases only accept short strings",
            "It hides sensitive data",
            "Smaller, coherent passages retrieve more precisely and fit in the model's context",
            "Embeddings only work on single words",
          ],
          correctIndex: 2,
          explanation:
            "One vector for a whole manual blurs many topics together; focused chunks match specific questions.",
        },
        {
          id: "rag-basics-q4",
          prompt: "What does a vector database do in a RAG pipeline?",
          options: [
            "Generates the final answer",
            "Stores the original PDFs",
            "Trains the embedding model",
            "Stores embeddings and runs fast nearest-neighbor similarity search",
          ],
          correctIndex: 3,
          explanation:
            "Given a query vector, it returns the closest stored chunks, usually with approximate nearest-neighbor indexes.",
        },
        {
          id: "rag-basics-q5",
          prompt: "Which measure is most commonly used to compare text embeddings?",
          options: ["Levenshtein distance", "Cosine similarity", "Hamming distance", "String length"],
          correctIndex: 1,
          explanation:
            "Cosine similarity compares vector direction; for normalized embeddings it equals the dot product.",
        },
        {
          id: "rag-basics-q6",
          prompt: "Keyword search finds exact terms and vector search finds meaning. What is hybrid search?",
          options: [
            "Combining both, for example BM25 plus vectors, then merging or reranking the results",
            "Searching two vector databases at once",
            "Letting the LLM search the web",
            "Running keyword search on embeddings",
          ],
          correctIndex: 0,
          explanation:
            "Exact matches (error codes, names) and semantic matches complement each other, and a reranker can pick the best of both.",
        },
      ],
    },
    {
      id: "ai-agents",
      trackId: "ai-driven",
      title: "AI Agents",
      summary:
        "LLMs running in a loop: reasoning, calling tools and observing results until a task is done. Covers ReAct, orchestration patterns, guardrails, and connecting tools through the Model Context Protocol (MCP).",
      level: "advanced",
      estMinutes: 120,
      isMilestone: true,
      webRef: { label: "roadmap.sh: AI Agents Roadmap", url: "https://roadmap.sh/ai-agents" },
      videoRef: {
        label: "IBM Technology: What are AI Agents?",
        url: "https://www.youtube.com/watch?v=F8NKVhkZZWI",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "ai-agents-q1",
          prompt: "What makes an LLM application an agent?",
          options: [
            "It uses the largest available model",
            "It has a chat interface",
            "The model runs in a loop, choosing actions (tool calls), observing results and deciding next steps until the goal is met",
            "It answers in under a second",
          ],
          correctIndex: 2,
          explanation:
            "Agents direct their own process and tool use; workflows follow code paths you define in advance.",
        },
        {
          id: "ai-agents-q2",
          prompt: "What does ReAct stand for?",
          options: [
            "React.js for agents",
            "Reasoning + Acting: interleaving reasoning steps with tool calls and their observations",
            "Retrieve and Activate",
            "Recursive Action Trees",
          ],
          correctIndex: 1,
          explanation:
            "Each ReAct step thinks about what to do, acts with a tool, then uses the observation to decide the next step.",
        },
        {
          id: "ai-agents-q3",
          prompt: "What is the Model Context Protocol (MCP)?",
          options: [
            "An open standard for connecting AI applications to external tools and data through MCP servers",
            "A file format for model weights",
            "Anthropic's private billing API",
            "A prompt template library",
          ],
          correctIndex: 0,
          explanation:
            "MCP servers expose tools, resources and prompts that any MCP-compatible host (IDEs, chat apps, agents) can use.",
        },
        {
          id: "ai-agents-q4",
          prompt: "Which guardrail matters most before letting an agent take real actions?",
          options: [
            "A faster model",
            "A longer system prompt",
            "Giving it admin access so it never gets stuck",
            "Scoped permissions, plus human approval for destructive or irreversible actions",
          ],
          correctIndex: 3,
          explanation:
            "Least privilege and approval gates limit the damage when an agent misunderstands a task.",
        },
        {
          id: "ai-agents-q5",
          prompt: "How does the orchestrator-workers pattern work?",
          options: [
            "Several agents vote on one answer",
            "A lead agent breaks the task into subtasks, delegates them to worker agents and combines their results",
            "One agent checks another's spelling",
            "Workers run on a schedule without a lead",
          ],
          correctIndex: 1,
          explanation:
            "Delegation suits tasks whose subtasks can't be predicted in advance, like changes spread across many files.",
        },
        {
          id: "ai-agents-q6",
          prompt: "An agent keeps calling the same tool with the same arguments. What's a sensible safeguard?",
          options: [
            "Cap iterations or budget and detect repeated calls, then stop or escalate to a human",
            "Give it more tools",
            "Raise the temperature",
            "Remove the tool's error messages",
          ],
          correctIndex: 0,
          explanation:
            "Loop limits and repetition checks turn a runaway agent into a clear failure a person can look at.",
        },
      ],
    },
  ],
};
