import type { Module } from "@/types/curriculum";

export default {
  id: "ai-tools",
  trackId: "ai-driven",
  name: "The AI Coding Tools Landscape",
  description:
    "Map the AI coding tools you actually use, from inline completion to autonomous agents and prompt-to-app builders: which one fits which task, what each costs you in review effort and risk, and where each one fails.",
  refs: [
    { label: "roadmap.sh: Vibe Coding", url: "https://roadmap.sh/vibe-coding", kind: "article" },
    { label: "Claude Code Docs: Overview", url: "https://code.claude.com/docs/en/overview", kind: "docs" },
    { label: "GitHub Docs: GitHub Copilot", url: "https://docs.github.com/en/copilot", kind: "docs" },
    { label: "Cursor Docs", url: "https://cursor.com/docs", kind: "docs" },
  ],
  topics: [
    {
      id: "aitools-accelerator-vs-delegator",
      moduleId: "ai-tools",
      trackId: "ai-driven",
      title: "Accelerator Tools vs Delegator Tools",
      summary:
        "AI coding tools split along one axis that matters more than any feature list: who runs the loop. Accelerators (Copilot or Cursor Tab completions, inline edits, chat in the editor) keep you typing and deciding; the AI shortens each step and you review a few lines at a time. Delegators (Claude Code, Cursor's agents, Copilot's agent mode and cloud agent, Codex) take a goal, then gather context, edit many files, run commands and iterate on test output until they decide they're done. Every major product now offers both, so the choice is per task, not per vendor.\n\nThe tradeoff is where your attention goes. Accelerators fail small: a bad completion is visible immediately. Delegators give real leverage on well-specified, verifiable work (a rename across 40 files, tests for an untested module, a bug with a failing reproduction), but they move review to the end, where a 600-line diff invites rubber-stamping. Verification becomes the bottleneck: if the task has no test, build or screenshot the agent can check, you become the feedback loop and the leverage disappears.\n\nFelt speed isn't measured speed. In METR's 2025 randomized study, experienced maintainers working in their own large repositories took 19% longer with AI tools while believing afterwards that AI had made them about 20% faster. Delegation pays when the spec is sharp and the check is automatic; in code you know intimately, full of tacit constraints no prompt captures, an accelerator or your own hands are often faster. Delegators also widen the attack surface: an agent that runs shell commands and reads untrusted issues, READMEs or web pages can be prompt-injected, so permissions and sandboxing are part of choosing the tool.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Claude Code Docs: How Claude Code works", url: "https://code.claude.com/docs/en/how-claude-code-works", kind: "docs" },
        { label: "GitHub Docs: About Copilot cloud agent", url: "https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent", kind: "docs" },
        { label: "METR: Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity", url: "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/", kind: "article" },
        { label: "Simon Willison: Not all AI-assisted programming is vibe coding", url: "https://simonwillison.net/2025/Mar/19/vibe-coding/", kind: "article" },
      ],
      video: {
        title: "AI in the SDLC: Rethinking AI Coding Tools & AI Agents",
        channel: "IBM Technology",
        url: "https://www.youtube.com/watch?v=4wMRXmLpdA8",
        videoId: "4wMRXmLpdA8",
        durationLabel: "9:27",
      },
      alternateVideos: [
        {
          title: "Claude Code vs Codex vs Cursor (an honest comparison)",
          channel: "Theo - t3․gg",
          url: "https://www.youtube.com/watch?v=JMYspR42HFM",
          videoId: "JMYspR42HFM",
          durationLabel: "37:56",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aitools-accelerator-vs-delegator-q1",
          prompt:
            "You need to rename a domain field across about 60 files, update the affected tests and keep `tsc --noEmit` and the test suite green. Which tool mode fits best?",
          options: [
            "A delegator agent, told to use the type check and tests as its stopping condition",
            "Inline completions, accepting suggestions file by file",
            "A prompt-to-app builder, regenerating the affected screens",
            "A chat window that returns a snippet you paste into each file",
          ],
          correctIndex: 0,
          explanation:
            "A mechanical, multi-file change with an automatic pass/fail check is the ideal delegation: the agent can iterate until the compiler and tests agree. File-by-file completion works but spends your attention on 60 repetitive reviews.",
        },
        {
          id: "aitools-accelerator-vs-delegator-q2",
          prompt: "Which task is the poorest fit for handing to an autonomous agent?",
          options: [
            "A subtle concurrency fix in code you know intimately, with no reproducing test",
            "Adding unit tests to a pure utility module whose inputs and outputs are documented",
            "Upgrading a library across the repo, where the compiler flags every breaking call site",
            "Scaffolding CRUD endpoints that follow a pattern used throughout the codebase",
          ],
          correctIndex: 0,
          explanation:
            "Agents need a spec and a check. Tacit constraints and no reproduction mean the agent can only stop when the code looks done, and you'd spend longer explaining and reviewing than writing it. The other three have explicit patterns or automatic verification.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-accelerator-vs-delegator-q3",
          prompt:
            "METR's 2025 randomized trial had experienced open-source maintainers fix real issues in their own large repositories, with AI tools randomly allowed or disallowed. What did it find?",
          options: [
            "They took longer when AI was allowed, yet still believed afterwards that AI had sped them up",
            "They finished roughly twice as fast, which matched the forecasts they made beforehand",
            "They were faster with AI allowed, but underestimated the size of the speed-up",
            "Completion times didn't differ, and afterwards they correctly reported no speed-up",
          ],
          correctIndex: 0,
          explanation:
            "Developers were 19% slower with AI while estimating a 20% speed-up. The authors caution against generalising beyond their setting, but it's a strong reason to measure your own workflows rather than trust how fast they feel.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-accelerator-vs-delegator-q4",
          prompt: "What fundamentally distinguishes a delegator tool from an accelerator?",
          options: [
            "The delegator runs the loop: it plans, calls tools, reads results and iterates toward a goal",
            "Delegators run larger models, which is what lets them handle multi-file changes",
            "Accelerators run on your machine, while delegators run only in a vendor's cloud",
            "Delegators work from the terminal, whereas accelerators live inside the editor",
          ],
          correctIndex: 0,
          explanation:
            "The difference is control of the loop, not model size or location. Claude Code runs locally and in the cloud; Copilot's agent mode runs in your IDE while its cloud agent runs in GitHub Actions.",
        },
        {
          id: "aitools-accelerator-vs-delegator-q5",
          prompt: "Which properties make a task a good candidate for an autonomous agent? (Select all that apply.)",
          options: [
            "There's an automated check the agent can run: tests, a build, a linter or a screenshot diff",
            "The change follows an existing pattern you can point the agent to",
            "You can state the scope, including what is explicitly out of scope",
            "The requirements are still being discovered as you write the code",
            "Success can only be judged by your gut feeling when reading the code",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A check closes the loop, a reference pattern anchors the design, and explicit boundaries prevent scope creep. Exploratory or taste-only work keeps you as the verifier, so the agent's autonomy buys little.",
        },
        {
          id: "aitools-accelerator-vs-delegator-q6",
          prompt:
            "You expected a roughly 100-line change. The agent returns a 900-line diff touching 25 files, and CI is green. What's the best response?",
          options: [
            "Treat it as scope creep: have each change justified, revert unrelated edits, re-run with explicit limits",
            "Merge it: CI is green, so the extra changes are covered and safe to ship",
            "Ask the same session to double-check its diff, and merge if it finds no problems",
            "Split it into five smaller PRs so each is easier to approve, then merge them as-is",
          ],
          correctIndex: 0,
          explanation:
            "CI only proves what the tests cover, and a session reviewing its own work is biased toward it. Unrequested refactors and 'improvements' are a known agent failure mode; splitting the diff doesn't make unreviewed changes safer.",
        },
        {
          id: "aitools-accelerator-vs-delegator-q7",
          prompt:
            "Why does moving from inline completion to an agent with shell access change your security threat model?",
          options: [
            "It reads untrusted text (issues, docs, web pages) and can act on it, so injected instructions become actions",
            "Agents upload your code to the vendor, whereas inline completions keep it on your machine",
            "Agents disable your git hooks while running, so pre-commit security checks are skipped",
            "It doesn't: both only produce text, and nothing runs until you review and accept it",
          ],
          correctIndex: 0,
          explanation:
            "Indirect prompt injection turns reading into acting once the model can run tools. Completions also send context to a model, so that isn't the difference, and agents act before you review unless permissions stop them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-accelerator-vs-delegator-q8",
          prompt:
            "You want agents to fix 30 independent lint violations across a monorepo overnight, unattended. Which setup reduces risk most?",
          options: [
            "Isolated worktrees or a sandbox, a scoped tool allowlist, and one reviewed PR per fix",
            "One local agent with all permission prompts bypassed, so it never stalls overnight",
            "Inline completion with auto-accept on, so every suggestion lands without a prompt",
            "One agent that pushes straight to the main branch as soon as CI reports green",
          ],
          correctIndex: 0,
          explanation:
            "Isolation limits the blast radius, the allowlist limits what the agent can do, and separate PRs keep each change reviewable. Bypassing permissions on your own machine or pushing to main removes the controls exactly when nobody is watching.",
        },
        {
          id: "aitools-accelerator-vs-delegator-q9",
          prompt: "Which statement about 'accelerator vs delegator' as a product choice is most accurate today?",
          options: [
            "It's mostly per task: editor tools added agents, and agent tools added IDE integrations",
            "It's a vendor choice: only terminal-based tools such as Claude Code run autonomous agents",
            "It's a vendor choice: Cursor and Copilot remain completion tools without agent modes",
            "It's a vendor choice: delegation needs a separate product from the editor you use",
          ],
          correctIndex: 0,
          explanation:
            "Copilot has agent mode and a cloud agent, Cursor runs parallel agents, and Claude Code ships VS Code and JetBrains extensions. The useful decision is which mode suits the task in front of you.",
        },
        {
          id: "aitools-accelerator-vs-delegator-q10",
          prompt:
            "An agent reports: 'All tests pass, feature complete.' What should you check before trusting that claim?",
          options: [
            "That the tests cover the new behaviour and none were deleted, skipped or weakened",
            "Nothing more: the test runner's exit code is an authoritative, objective signal",
            "That the commit message describes the change clearly enough for later reviewers",
            "That it used the newest model, since older models are the ones that fake results",
          ],
          correctIndex: 0,
          explanation:
            "Models can over-focus on making tests pass, even special-casing test inputs, and GitHub's review guidance explicitly flags deleted or skipped tests. A green run proves little if the tests don't cover the change.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "aitools-copilot-fundamentals",
      moduleId: "ai-tools",
      trackId: "ai-driven",
      title: "GitHub Copilot Fundamentals",
      summary:
        "GitHub Copilot is the most widely deployed AI coding assistant because it lives where code already is: the major IDEs, the terminal (Copilot CLI) and github.com itself. Its surfaces map onto the accelerator/delegator spectrum. Inline suggestions and next edit suggestions predict what you're about to type or change; Chat answers questions and proposes edits; agent mode edits across files and runs commands in your local workspace; and the cloud agent (formerly the coding agent) takes an issue or prompt, works in an ephemeral GitHub Actions environment and opens a draft pull request. Copilot code review adds an AI reviewer to PRs. Premium features draw on a plan-specific monthly allowance that GitHub changes often, so check your plan rather than memorising numbers.\n\nContext is the main lever. Suggestions and Chat lean on the files you have open, so opening the relevant file and closing stale ones changes what you get more than rephrasing does. Repository-wide instructions in `.github/copilot-instructions.md`, path-scoped `.github/instructions/*.instructions.md` files (with an `applyTo` glob) and `AGENTS.md` give Chat and the agents your conventions without repeating them in every prompt.\n\nTwo gotchas matter in practice. Content exclusion isn't a secrets boundary: GitHub documents that it isn't honoured in every mode (agent mode in VS Code and Copilot CLI, for example) and that type information from excluded files can still reach the model indirectly, so real secrets belong in a secret manager, not in an excluded folder. And the cloud agent's guardrails are specific: only users with write access can trigger it, it pushes only to its own branch, it can't approve or merge its own PRs, and Actions workflows on its PRs wait until a human approves them.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "GitHub Docs: About GitHub Copilot", url: "https://docs.github.com/en/copilot/get-started/about-github-copilot", kind: "docs" },
        { label: "GitHub Docs: Best practices for using GitHub Copilot", url: "https://docs.github.com/en/copilot/get-started/best-practices", kind: "docs" },
        { label: "GitHub Docs: Content exclusion for GitHub Copilot", url: "https://docs.github.com/en/copilot/concepts/context/content-exclusion", kind: "docs" },
        { label: "GitHub Docs: Risks and mitigations for Copilot cloud agent", url: "https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations", kind: "docs" },
      ],
      video: {
        title: "Getting started with GitHub Copilot | Tutorial",
        channel: "GitHub",
        url: "https://www.youtube.com/watch?v=n0NlxUyA7FI",
        videoId: "n0NlxUyA7FI",
        durationLabel: "10:53",
      },
      alternateVideos: [
        {
          title: "How the GitHub Copilot coding agent works | GitHub Checkout",
          channel: "GitHub",
          url: "https://www.youtube.com/watch?v=1GVBRhDI5No",
          videoId: "1GVBRhDI5No",
          durationLabel: "6:58",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aitools-copilot-fundamentals-q1",
          prompt:
            "An issue asks for input validation on three endpoints, following a pattern that already exists in the repo. You want a reviewable PR without tying up your editor. Which Copilot surface fits?",
          options: [
            "Assign the issue to Copilot's cloud agent and review the draft PR it opens",
            "Inline suggestions while you type each validator yourself",
            "Next edit suggestions in the file you currently have open",
            "Ask mode in Chat, then copy the answer into each file",
          ],
          correctIndex: 0,
          explanation:
            "A well-scoped issue with an existing pattern is exactly what the cloud agent is for: it works in its own Actions environment and hands you a PR. The other options keep you doing the work in your editor.",
        },
        {
          id: "aitools-copilot-fundamentals-q2",
          prompt:
            "Your organization excluded `config/secrets/**` from Copilot using content exclusion. Which conclusion is correct?",
          options: [
            "It reduces exposure but isn't a guarantee: some modes ignore it and IDE data can leak indirectly",
            "Excluded files can no longer influence any Copilot feature, in any IDE or mode",
            "Excluded files are encrypted at rest so that no AI tool can read their contents",
            "Excluded paths are also purged from git history, so earlier commits are covered too",
          ],
          correctIndex: 0,
          explanation:
            "GitHub's docs list gaps: content exclusion isn't supported in VS Code's agent mode or Copilot CLI, and type or hover information from excluded files can still be supplied by the IDE. It's a policy control, not a secrets vault.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-copilot-fundamentals-q3",
          prompt: "Copilot's cloud agent has opened a draft PR on your repository. Which is true by default?",
          options: [
            "GitHub Actions workflows on the PR don't run until a user with write access approves them",
            "The agent marks the PR ready for review and merges it once checks pass",
            "The agent pushes directly to the default branch to save a step",
            "Anyone who can comment on the issue can give the agent new instructions",
          ],
          correctIndex: 0,
          explanation:
            "The agent can't mark its PR ready, approve or merge it, it pushes only to its own branch, and only users with write access can trigger it. Holding workflows until approval stops agent-written code from running with your CI secrets unreviewed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-copilot-fundamentals-q4",
          prompt: "Where do repository-wide custom instructions for GitHub Copilot live?",
          options: [
            "`.github/copilot-instructions.md`",
            "`.copilot/config.json`",
            "Front matter at the top of `README.md`",
            "`.vscode/settings.json` only",
          ],
          correctIndex: 0,
          explanation:
            "Repository-wide instructions go in `.github/copilot-instructions.md`; path-specific ones go in `.github/instructions/*.instructions.md` with an `applyTo` glob, and Copilot's agents also read `AGENTS.md`.",
        },
        {
          id: "aitools-copilot-fundamentals-q5",
          prompt:
            "Inline suggestions keep calling a deprecated helper instead of its replacement in `lib/http.ts`. What's the cheapest first fix?",
          options: [
            "Open `lib/http.ts` and close the deprecated module's tab, so the right API is in context",
            "Switch completions to the largest model so it knows the newer API from training",
            "Sign out and back in to Copilot so it re-indexes the workspace from scratch",
            "Add a `// copilot: ignore deprecated` comment, which the completion engine obeys",
          ],
          correctIndex: 0,
          explanation:
            "Copilot builds its prompt from what's around the cursor and in your open files, so steering the context is usually the fastest fix. A bigger model can't use an API it never sees, and there's no magic comment directive that filters deprecated code.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-copilot-fundamentals-q6",
          prompt: "What does Copilot's setting for suggestions matching public code control?",
          options: [
            "Whether suggestions matching public code are blocked, or shown with license references",
            "Whether your private repositories' code can be used to train GitHub's models",
            "Whether Copilot may search public repositories when answering chat questions",
            "Whether Copilot flags public dependencies that have known vulnerabilities",
          ],
          correctIndex: 0,
          explanation:
            "The policy addresses licensing risk from verbatim matches: block them, or allow them with code referencing. Training and data use are governed by separate settings and terms.",
        },
      ],
    },
    {
      id: "aitools-cursor-workflow",
      moduleId: "ai-tools",
      trackId: "ai-driven",
      title: "Cursor's Workflow: Tab, Agent and Composer",
      summary:
        "Cursor started as a VS Code fork rebuilt around AI, which is why it can do things an extension can't: Tab predicts multi-line edits and where you'll edit next, and the Agent can search, read, edit, run terminal commands and drive a browser from one panel. The naming history confuses people. Composer was originally Cursor's multi-file editing panel; in early 2025 (version 0.46) Chat, Composer and Agent were unified into a single Agent interface, and since October 2025 Composer has been the name of Cursor's own agent model, trained with reinforcement learning on real codebases and tuned for speed. Cursor 3 (April 2026) added an Agents Window for running many agents in parallel, locally, in worktrees or in the cloud.\n\nThe productive loop is plan, act, review. Plan Mode (Shift+Tab) has the agent research the codebase, ask clarifying questions and write an editable plan before touching code; for a one-line fix, skip it. Project rules in `.cursor/rules/*.mdc` (always applied, applied when the agent judges the description relevant, applied by glob, or @-mentioned) and `AGENTS.md` carry your conventions, but rules steer Agent chats, not Tab completions. Checkpoints roll back the agent's file edits, yet they're local, separate from git and blind to terminal side effects, so commit before handing the agent anything big.\n\nModel choice is a cost decision as much as a quality one: usage is metered, and running the largest model with maximum reasoning on every trivial edit burns budget and latency for nothing. Context isn't free either. A chat that has wandered through four features carries stale file contents and failed attempts, so start a new chat per task instead of steering one conversation through a whole day.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Cursor Docs: Agent", url: "https://cursor.com/docs/agent/overview", kind: "docs" },
        { label: "Cursor Docs: Plan Mode", url: "https://cursor.com/docs/agent/plan-mode", kind: "docs" },
        { label: "Cursor Docs: Rules", url: "https://cursor.com/docs/rules", kind: "docs" },
        { label: "Cursor Blog: Composer: Building a fast frontier model with RL", url: "https://cursor.com/blog/composer", kind: "article" },
      ],
      video: {
        title: "Cursor: coding agents tutorial (2026)",
        channel: "leerob",
        url: "https://www.youtube.com/watch?v=kF2WQgk1LtY",
        videoId: "kF2WQgk1LtY",
        durationLabel: "31:42",
      },
      alternateVideos: [
        {
          title: "Cursor Agent: 10 Pro Tips!",
          channel: "Cursor",
          url: "https://www.youtube.com/watch?v=WVeYLlKOWc0",
          videoId: "WVeYLlKOWc0",
          durationLabel: "12:32",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aitools-cursor-workflow-q1",
          prompt: "A colleague says they 'use Composer for multi-file edits'. What does Composer refer to in Cursor today?",
          options: [
            "Cursor's own agent model; the old Composer panel was merged into the Agent interface",
            "A separate multi-file editing panel that still sits alongside the Agent panel",
            "The engine behind Tab, which predicts multi-line edits and your next cursor jump",
            "A cloud-only mode that runs scheduled background jobs against your repository",
          ],
          correctIndex: 0,
          explanation:
            "Version 0.46 unified Chat, Composer and Agent into one Agent interface, and in October 2025 Cursor reused the Composer name for its own RL-trained agent model. Older tutorials describing a separate Composer panel are out of date.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-cursor-workflow-q2",
          prompt:
            "You add `.cursor/rules/api.mdc` with `alwaysApply: true`, yet Tab completions still ignore the convention it describes. Why?",
          options: [
            "Rules steer Agent chats; they don't affect Tab completions",
            "Project rules must use the `.md` extension, not `.mdc`",
            "Rules only load after you restart Cursor twice",
            "`alwaysApply` rules require a Team plan",
          ],
          correctIndex: 0,
          explanation:
            "Cursor's docs say rules apply to Agent (chat), not to Tab or other AI features. In fact `.mdc` is the expected format; plain `.md` files in `.cursor/rules` lack the frontmatter Cursor needs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-cursor-workflow-q3",
          prompt: "For which task is Plan Mode clearly worth its overhead?",
          options: [
            "Adding multi-tenant support across auth, data access and UI, with several valid designs",
            "Fixing a typo in a user-facing error message that appears in two places",
            "Renaming a local variable inside one function to match team conventions",
            "Adding a debug log line before a return statement to trace a value",
          ],
          correctIndex: 0,
          explanation:
            "Planning pays off when the approach is uncertain, many files change or you need to review the design first. For changes you could describe in one sentence, the planning round trip is pure overhead.",
        },
        {
          id: "aitools-cursor-workflow-q4",
          prompt:
            "The agent ran a database migration from the terminal and edited five files. You restore the checkpoint from before the task. What's the state afterwards?",
          options: [
            "The five file edits are reverted, but the migration's changes to the database remain",
            "Both the file edits and the database changes are rolled back to the snapshot",
            "Nothing changes on disk: checkpoints only restore the chat transcript",
            "Git history is rewritten to the commit that existed before the task began",
          ],
          correctIndex: 0,
          explanation:
            "Checkpoints snapshot the agent's file edits locally and don't track terminal changes, let alone external systems. Git and reversible migrations are your real undo for anything beyond file edits.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-cursor-workflow-q5",
          prompt: "Which are valid ways a Cursor project rule can be applied? (Select all that apply.)",
          options: [
            "Always, in every Agent chat",
            "When the agent judges it relevant from the rule's description",
            "When files matching the rule's globs are involved",
            "Manually, by @-mentioning the rule in chat",
            "On every Tab keystroke, before completions are generated",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "`alwaysApply`, `description` and `globs` in the frontmatter produce the Always, Apply Intelligently, Specific Files and Manual behaviours. None of them feed Tab completions.",
        },
        {
          id: "aitools-cursor-workflow-q6",
          prompt:
            "A teammate runs the largest, slowest model at maximum reasoning for every request, including 'rename this variable'. What's the main problem?",
          options: [
            "It spends metered usage and latency on work a fast model does just as well",
            "Large models tend to refuse trivial requests, so small edits often fail",
            "Cursor blocks the largest models from editing files directly in the workspace",
            "High reasoning effort makes the agent skip the project's rules entirely",
          ],
          correctIndex: 0,
          explanation:
            "Usage-based plans make model choice an economic decision. Save the expensive model for hard reasoning, such as tricky debugging or design, and use fast models for mechanical edits.",
        },
        {
          id: "aitools-cursor-workflow-q7",
          prompt:
            "Three hours into one Agent chat spanning four features, the agent references files you deleted earlier and ignores a convention you stated at the start. What's the best fix?",
          options: [
            "Start a fresh chat for this task, restating key constraints or moving them into a rule",
            "Restate the convention in capital letters and continue in the same chat",
            "Switch to a model with a bigger context window and keep the same chat going",
            "Clear Cursor's local cache and reload the window, then resume the chat",
          ],
          correctIndex: 0,
          explanation:
            "The chat is full of stale context and old instructions buried in the middle. A fresh chat with the constraints stated up front, or encoded in a rule, beats shouting louder in a polluted one.",
        },
        {
          id: "aitools-cursor-workflow-q8",
          prompt: "You want three agents working on the same repository at once. What stops them from clobbering each other's edits?",
          options: [
            "Give each agent its own git worktree or cloud environment, then merge via reviewed PRs",
            "Give each agent a different model so their edits don't overlap in style",
            "Tell each agent in its prompt which files the other agents may touch",
            "Run each agent in its own chat tab, all pointing at the same working folder",
          ],
          correctIndex: 0,
          explanation:
            "Isolation has to be physical: separate checkouts or environments. Different models or polite prompts don't prevent two agents from editing the same file in one working tree.",
        },
        {
          id: "aitools-cursor-workflow-q9",
          prompt: "When is Tab, rather than the Agent, the right tool?",
          options: [
            "A repetitive edit across nearby lines, when you know exactly what you want",
            "Implementing a feature whose changes span ten files and two packages",
            "Tracing a production bug's root cause across several services",
            "Drafting a step-by-step migration plan for a legacy module",
          ],
          correctIndex: 0,
          explanation:
            "Tab is an accelerator: it predicts your next edit while you stay in control. Multi-file features, investigations and planning are where the agent's loop earns its cost.",
        },
      ],
    },
    {
      id: "aitools-claude-code-workflow",
      moduleId: "ai-tools",
      trackId: "ai-driven",
      title: "Claude Code's Agentic Workflow",
      summary:
        "Claude Code is an agentic harness: the model reasons, and the harness supplies tools (file read and edit, search, shell, web, subagents), context management and permission checks. Every task runs a loop of gathering context, taking action and verifying results, repeated until Claude decides the work is done. It runs in the terminal, IDE extensions, a desktop app, the web and CI (`claude -p` for headless runs), but the loop is the same everywhere. That makes it a delegator by design: you describe outcomes and it chooses which files to read and which commands to run.\n\nAnthropic's recommended workflow is explore, plan, implement, commit. Plan mode lets Claude read and propose without editing; skip it when you could describe the diff in one sentence. The biggest single lever is a check Claude can run (tests, a build, a screenshot diff): without one, 'looks done' is its only stop signal and you become the verification loop. The second is context. Everything read or printed lands in one window, and quality degrades as it fills, so use `/clear` between unrelated tasks, subagents for wide investigations and `/compact` with a focus when you must continue.\n\nExtension points differ in how binding they are. `CLAUDE.md` and skills are context that Claude usually follows; hooks run deterministically at lifecycle events, so 'never edit `.env`' belongs in a `PreToolUse` hook or a deny rule, not a sentence. Permission modes range from manual approval through accept-edits and plan to auto, where a classifier blocks risky actions; bypassing permissions is meant for isolated containers and VMs only. Checkpoints (Esc Esc or `/rewind`) undo file edits but not shell side effects, database writes or deployments, so git stays your real undo.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Claude Code Docs: Best practices for Claude Code", url: "https://code.claude.com/docs/en/best-practices", kind: "docs" },
        { label: "Claude Code Docs: Choose a permission mode", url: "https://code.claude.com/docs/en/permission-modes", kind: "docs" },
        { label: "Claude Code Docs: Extend Claude Code", url: "https://code.claude.com/docs/en/features-overview", kind: "docs" },
        { label: "Claude Code Docs: Common workflows", url: "https://code.claude.com/docs/en/common-workflows", kind: "docs" },
      ],
      video: {
        title: "Mastering Claude Code in 30 minutes",
        channel: "Anthropic",
        url: "https://www.youtube.com/watch?v=6eBSHbLKuN0",
        videoId: "6eBSHbLKuN0",
        durationLabel: "28:07",
      },
      alternateVideos: [
        {
          title: "The Explore → Plan → Code → Commit workflow in Claude Code",
          channel: "Claude",
          url: "https://www.youtube.com/watch?v=xJQuF02NAK8",
          videoId: "xJQuF02NAK8",
          durationLabel: "3:11",
        },
        {
          title: "Claude Code Essentials",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=brLhhkUqcn4",
          videoId: "brLhhkUqcn4",
          durationLabel: "12:20:10",
          startSeconds: 1019,
          chapterLabel: "The Agentic Loop: Tool Calls & Models",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aitools-claude-code-workflow-q1",
          prompt: "Which best describes the division of labour inside Claude Code?",
          options: [
            "The model decides each next step; the harness supplies tools, context and permission checks",
            "The harness writes the plan, and the model only generates code for each step",
            "Each task is one prompt and one response, with no tool calls in between",
            "Your IDE runs the loop, and Claude only proposes diffs for the IDE to apply",
          ],
          correctIndex: 0,
          explanation:
            "Anthropic describes Claude Code as the agentic harness around the model: models reason, tools act, and each tool result feeds the next decision. Many tool calls happen within one task.",
        },
        {
          id: "aitools-claude-code-workflow-q2",
          prompt:
            "Your `CLAUDE.md` says 'Never modify files in `migrations/`'. During a long session Claude edits a migration anyway. What's the robust fix?",
          options: [
            "Enforce it with a `PreToolUse` hook or a deny rule, since `CLAUDE.md` is only advisory",
            "Repeat the rule on several lines of `CLAUDE.md`, each marked IMPORTANT",
            "Move the rule into the README, which Claude reads before `CLAUDE.md`",
            "Ask Claude to save the rule to auto memory, which it treats as binding",
          ],
          correctIndex: 0,
          explanation:
            "The docs are explicit: CLAUDE.md and memory are context, not enforced configuration. Hooks fire on every matching event and deny rules block in every permission mode; emphasising many lines just means none stand out.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-claude-code-workflow-q3",
          prompt: "According to Anthropic's guidance, when should you skip plan mode?",
          options: [
            "When you could describe the whole diff in one sentence",
            "Whenever the change spans more than one file",
            "When you're unfamiliar with the code being changed",
            "When you're unsure which of two approaches is better",
          ],
          correctIndex: 0,
          explanation:
            "Planning adds a round trip. It earns its cost for multi-file changes, unfamiliar code and uncertain approaches, which are exactly the other three options.",
        },
        {
          id: "aitools-claude-code-workflow-q4",
          prompt: "Why does giving Claude a check it can run (tests, a build, a screenshot comparison) matter so much?",
          options: [
            "Without a pass/fail signal it stops when work looks done; with one it iterates until it passes",
            "Running the tests fine-tunes the model on your codebase during the session",
            "Claude refuses to edit a repository that has no test suite configured",
            "Checks replace most of the tokens the session would spend reading code",
          ],
          correctIndex: 0,
          explanation:
            "Verification closes the loop, which is what lets you walk away from a session. Nothing is trained during a session, and iterating on test output costs tokens; it's worth it because it replaces your attention.",
        },
        {
          id: "aitools-claude-code-workflow-q5",
          prompt:
            "Claude ran `npm run db:reset` and then edited three files. You press Esc twice and restore the code to the earlier checkpoint. What gets reverted?",
          options: [
            "Only the file edits made through Claude's editing tools; the database reset isn't undone",
            "Both the file edits and the database reset, since the checkpoint covers the whole turn",
            "Nothing on disk: checkpoints only restore the conversation, not the code",
            "The whole repository, which is reset to its most recent git commit",
          ],
          correctIndex: 0,
          explanation:
            "Checkpoints snapshot files before Claude's edit tools change them. Bash side effects and remote systems such as databases, APIs and deployments can't be checkpointed; permissions and git are your controls there.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-claude-code-workflow-q6",
          prompt: "Which are good uses of subagents in Claude Code? (Select all that apply.)",
          options: [
            "Investigating how a subsystem works across dozens of files and returning a summary",
            "Reviewing a finished diff in a fresh context, independent of the session that wrote it",
            "Running independent research questions in parallel",
            "Making a one-line edit whose details you need in the main conversation",
            "Persisting team conventions across future sessions",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Subagents run in their own context window and return a summary, which keeps exploration and review out of your main context. A tiny edit is faster done directly, and cross-session conventions belong in `CLAUDE.md`.",
        },
        {
          id: "aitools-claude-code-workflow-q7",
          prompt:
            "You want a nightly CI job in which Claude triages new lint failures and emits JSON that a script parses. What's the right interface?",
          options: [
            "`claude -p \"...\" --output-format json`, with a scoped `--allowedTools` list",
            "An interactive session left open overnight, with a reminder in `CLAUDE.md`",
            "Auto memory, configured to replay the triage instructions every night",
            "A skill with `disable-model-invocation: true`, which makes it run on a schedule",
          ],
          correctIndex: 0,
          explanation:
            "`claude -p` is built for scripts and CI, `--output-format json` returns a parseable object, and restricting tools matters most when nobody is watching. `disable-model-invocation` only stops Claude from auto-loading a skill; it doesn't schedule anything.",
        },
        {
          id: "aitools-claude-code-workflow-q8",
          prompt: "In which setup is skipping all permission checks (`bypassPermissions`) acceptable?",
          options: [
            "Inside a disposable container or VM with no production credentials and restricted network access",
            "On your laptop with your cloud CLI logged in, as long as you watch the terminal",
            "In your home directory, so Claude can find all your config files",
            "Anywhere, provided `CLAUDE.md` tells Claude to be careful",
          ],
          correctIndex: 0,
          explanation:
            "Anthropic's docs scope bypass mode to isolated containers and VMs only, since every tool call runs immediately. Watching doesn't help when a command executes before you can react, and instructions are not a boundary.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-claude-code-workflow-q9",
          prompt:
            "You've corrected Claude three times on the same bug and it keeps reintroducing the same wrong approach. What does Anthropic's guidance recommend?",
          options: [
            "Run `/clear` and restart with a sharper prompt that includes what you learned",
            "Keep correcting in the same session; the extra history helps it converge",
            "Switch to auto mode, so it can try approaches without asking first",
            "Paste the entire codebase into the prompt so it has full context",
          ],
          correctIndex: 0,
          explanation:
            "After two failed corrections, the docs recommend clearing and rewriting the prompt: a clean session with a better prompt almost always beats a long one carrying every wrong turn.",
        },
        {
          id: "aitools-claude-code-workflow-q10",
          prompt:
            "Why is a review by a fresh session or subagent more useful than asking the implementing session 'is this correct?'",
          options: [
            "It sees only the diff and the criteria, not the reasoning, so it isn't biased toward the code",
            "Fresh sessions and subagents always run on a more capable model",
            "A subagent can approve and merge the pull request once it's satisfied",
            "The implementing session isn't permitted to read its own diff back",
          ],
          correctIndex: 0,
          explanation:
            "Independence is the point of the writer/reviewer pattern. Tell the reviewer to report only gaps that affect correctness or requirements, since a reviewer asked to find problems will always find some.",
        },
      ],
    },
    {
      id: "aitools-app-builders",
      moduleId: "ai-tools",
      trackId: "ai-driven",
      title: "AI App Builders (Lovable, Bolt, v0) and When They Fit",
      summary:
        "Prompt-to-app builders collapse the stack into a chat box: describe an app, get a running preview, iterate by prompting or visual edits, publish with one click. v0 (Vercel) generates Next.js, Tailwind and shadcn/ui code and deploys to Vercel; Lovable pairs a React frontend with a managed backend (Lovable Cloud or Supabase) for auth, data and storage; Bolt, built on StackBlitz's in-browser WebContainers, runs full-stack projects in the browser with its own database and hosting. They are genuinely good at the first 80%: clickable prototypes for user testing, internal tools, landing pages and spikes that validate an idea before engineers invest.\n\nThe last 20% is where they fit poorly. Each prompt regenerates code nobody designed, so as the project grows the agent's context fills, fixes start breaking other features and credit or token spend climbs with every retry. Plan the exit on day one: sync the code to a GitHub repository you control, so a prototype that becomes a product can move into normal review, testing and CI. Treat the output like a contractor's first draft and read the data model, the auth flow and every place a secret or permission is decided.\n\nThe recurring security failure is a thin client talking straight to a backend-as-a-service. In CVE-2025-48757, a scan of 1,645 Lovable-built apps found about 170 whose Supabase tables lacked adequate row-level security, so anyone holding the public anon key, which ships in the frontend by design, could read or change other users' data. Built-in scanners help, but a check that a policy exists isn't a check that it's correct, and the vendors themselves say scans can't guarantee security.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "v0 Docs: What is v0?", url: "https://v0.app/docs", kind: "docs" },
        { label: "Lovable Docs: Security overview", url: "https://docs.lovable.dev/features/security", kind: "docs" },
        { label: "Supabase Docs: Row Level Security", url: "https://supabase.com/docs/guides/database/postgres/row-level-security", kind: "docs" },
        { label: "Matt Palmer: Statement on CVE-2025-48757", url: "https://mattpalmer.io/posts/2025/05/statement-on-CVE-2025-48757/", kind: "article" },
      ],
      video: {
        title: "Master Lovable In 24 Minutes",
        channel: "Lovable",
        url: "https://www.youtube.com/watch?v=rqvtLxwMklo",
        videoId: "rqvtLxwMklo",
        durationLabel: "24:38",
      },
      alternateVideos: [
        {
          title: "Getting Started with v0: From Prompt to Production",
          channel: "Vercel",
          url: "https://www.youtube.com/watch?v=tFPGwS7Z0IA",
          videoId: "tFPGwS7Z0IA",
          durationLabel: "6:33",
        },
        {
          title: "Vibe Coding Has A Security Problem (And How To Fix It)",
          channel: "Chris Raroque",
          url: "https://www.youtube.com/watch?v=tK4NQtzfZbM",
          videoId: "tK4NQtzfZbM",
          durationLabel: "16:15",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "aitools-app-builders-q1",
          prompt: "Which project is the best fit for an AI app builder?",
          options: [
            "A clickable prototype of a new onboarding flow to put in front of five customers next week",
            "A new feature in an eight-year-old monorepo with strict review and release rules",
            "A payments reconciliation service with regulatory audit requirements",
            "A performance-critical rendering engine that needs careful profiling",
          ],
          correctIndex: 0,
          explanation:
            "Builders shine when speed to a working demo matters more than architecture, and when throwing the code away is acceptable. Existing codebases, compliance-heavy systems and performance work need a real repo, reviews and engineering judgement.",
        },
        {
          id: "aitools-app-builders-q2",
          prompt:
            "A reviewer flags the Supabase URL and anon key in a Lovable app's frontend bundle as a leaked secret. What's the accurate assessment?",
          options: [
            "The anon key is meant to be public; what matters is whether RLS correctly restricts every table",
            "It's a critical leak: move the key into a frontend environment variable and rebuild",
            "It's safe: minification makes the key impractical to extract from the bundle",
            "It's safe as long as the site and its API are served only over HTTPS",
          ],
          correctIndex: 0,
          explanation:
            "Supabase's anon key is meant to ship to clients, and RLS is what protects the data. A frontend environment variable still ends up in the bundle, and minification or HTTPS doesn't stop anyone calling the API with the key.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-app-builders-q3",
          prompt: "A builder's security scan reports 'RLS enabled on all tables'. Why isn't that enough?",
          options: [
            "A policy existing isn't a policy being correct: `USING (true)` still exposes every row",
            "Postgres skips row-level security for requests made with the anon key",
            "Scanners always report false positives, so the result tells you nothing",
            "RLS only protects writes; reads are always public in a hosted database",
          ],
          correctIndex: 0,
          explanation:
            "This was the critique of early scanners in the CVE-2025-48757 disclosure: they checked that policies existed, not what they allowed. RLS does apply to anon-key requests (that's its purpose), so review each policy's predicate, for example that it compares the row owner with `auth.uid()`, for reads and writes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "aitools-app-builders-q4",
          prompt: "Which signs suggest a builder-made app has outgrown the builder? (Select all that apply.)",
          options: [
            "Each fix for one feature breaks another, and retries are burning through credits",
            "Changes now need code review, automated tests and CI before they ship",
            "Several engineers need to work on it in parallel with branches",
            "You want to adjust a button's colour and spacing across the app",
            "Marketing needs another landing page for next month's campaign",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Regression churn, the need for engineering controls and parallel team work all point to a normal repository and workflow. Small visual tweaks and standalone landing pages are what builders are good at.",
        },
        {
          id: "aitools-app-builders-q5",
          prompt: "If a prototype might become a product, what's the most important thing to set up on day one?",
          options: [
            "Sync the code to a GitHub repository you control, so it can move into a normal workflow",
            "Buy the largest credit plan so the build never stalls halfway through",
            "Enable every available integration now in case the product needs it later",
            "Put the whole spec into one very long first prompt so nothing is missed",
          ],
          correctIndex: 0,
          explanation:
            "Owning the code in git is your exit strategy and your audit trail. Credits and integrations don't help you leave, and one huge prompt is harder to iterate on than a clear spec delivered in steps.",
        },
        {
          id: "aitools-app-builders-q6",
          prompt: "Why do builder projects often get less reliable as they grow?",
          options: [
            "Regenerating undesigned code against a growing codebase fills context, so changes collide",
            "Builders deliberately throttle large projects to push users onto higher plans",
            "React apps become unstable once they pass roughly 50 components",
            "Hosting slows down as pages are added, which the preview reports as errors",
          ],
          correctIndex: 0,
          explanation:
            "It's the same context economics as any agent: more code and more history means less of it is attended to well. Without tests, nothing catches the regressions each regeneration introduces.",
        },
        {
          id: "aitools-app-builders-q7",
          prompt:
            "A generated app calls a paid third-party AI API directly from the browser, with the API key in client code. What's the right fix?",
          options: [
            "Move the call to a server-side function using a stored secret, plus rate limits and a cap",
            "Obfuscate the key in the bundle so that it's impractical to read or reuse",
            "Store the key in `localStorage` after first load instead of in the bundle",
            "Serve the app through a CDN so the key is hidden behind its edge cache",
          ],
          correctIndex: 0,
          explanation:
            "Anything shipped to the browser is public, however it's disguised. A server-side function keeps the key secret, and rate limits and budget caps limit the damage if the endpoint itself is abused.",
        },
        {
          id: "aitools-app-builders-q8",
          prompt: "Who owns the security review of an app built and published entirely through a builder?",
          options: [
            "You do: platform scans catch common issues, but their docs say they can't guarantee security",
            "The builder vendor, because its agent generated and deployed the code",
            "The backend provider, because it hosts the database and the auth service",
            "Nobody: builders audit generated code automatically before it's published",
          ],
          correctIndex: 0,
          explanation:
            "Lovable's security docs recommend a professional security review for production apps handling sensitive data. Generating code doesn't transfer responsibility for what it exposes.",
        },
        {
          id: "aitools-app-builders-q9",
          prompt: "Builder usage is billed in tokens or credits. Which habit wastes the most?",
          options: [
            "Repeating 'still broken, fix it' in one long thread on a large project",
            "Writing a detailed first prompt with explicit acceptance criteria",
            "Using the visual editor for small styling tweaks instead of prompts",
            "Reverting to a known-good version and re-prompting with specifics",
          ],
          correctIndex: 0,
          explanation:
            "Vague retry loops are the classic budget sink: each attempt carries a large context without adding information, and often undoes earlier fixes. Reverting and re-prompting with the error and the expected behaviour usually costs less and works better.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
  ],
} satisfies Module;
