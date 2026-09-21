import type { Module } from "@/types/curriculum";

export default {
  id: "fe-tooling",
  trackId: "frontend",
  name: "Dev Environment & Tooling",
  description:
    "The toolchain every frontend engineer leans on daily: an editor configured for leverage, Git as a content-addressed history graph rather than a set of magic commands, GitHub pull requests and least-privilege Actions, npm's lockfile and supply-chain model, Vite 8's dev/build split, and Chrome DevTools for performance and memory work. For engineers who use these tools every day and want to understand them well enough to debug them.",
  refs: [
    { label: "VS Code: Documentation", url: "https://code.visualstudio.com/docs", kind: "docs" },
    { label: "Git: Documentation", url: "https://git-scm.com/doc", kind: "docs" },
    { label: "Vite: Guide", url: "https://vite.dev/guide/", kind: "docs" },
    { label: "npm Docs", url: "https://docs.npmjs.com/", kind: "docs" },
    { label: "Chrome DevTools documentation", url: "https://developer.chrome.com/docs/devtools", kind: "docs" },
  ],
  topics: [
    {
      id: "tooling-vscode-productivity",
      moduleId: "fe-tooling",
      trackId: "frontend",
      title: "VS Code Setup & Productivity",
      summary:
        "VS Code is a thin editor shell around language servers, debug adapters and extensions, so most \"VS Code problems\" are really configuration problems: which settings scope won, which TypeScript version the language service is running, which formatter owns a file. The settings cascade is worth knowing precisely. Later scopes override earlier ones: default, user, remote, workspace (`.vscode/settings.json`), workspace folder, then the language-specific version of each (`\"[typescript]\": { ... }`), with admin policy on top. Primitive and array values are replaced, but object values such as `search.exclude` are merged key by key. The surprising consequence is that a language-specific user setting beats a plain workspace setting.\n\nFor teams, commit what makes the repo behave the same for everyone: `.vscode/settings.json` for the formatter and `editor.codeActionsOnSave` (which takes `\"explicit\"`, `\"always\"` or `\"never\"`; the old booleans are being deprecated), `.vscode/extensions.json` recommendations, and `launch.json`/`tasks.json` for debugging. Keep personal taste (themes, keymaps, font size) in user settings or a Profile. Point the TypeScript extension at the repo's own `typescript` package (\"Use Workspace Version\") so the editor and CI report the same errors, and prefer semantic tools (F2 Rename Symbol, Go to References) over text search when refactoring.\n\nThe gotcha is trust. A cloned repository can ship a task set to run when the folder opens, workspace settings that point at binaries, and debug configurations. Restricted Mode (Workspace Trust) disables or limits tasks, debugging, the terminal, AI agents, workspace settings and many extensions until you trust the folder, so leave unfamiliar code there until you've read it.",
      level: "intermediate",
      estMinutes: 120,
      webRefs: [
        { label: "VS Code: User and workspace settings", url: "https://code.visualstudio.com/docs/configure/settings", kind: "docs" },
        { label: "VS Code: Debugging", url: "https://code.visualstudio.com/docs/debugtest/debugging", kind: "docs" },
        { label: "VS Code: Workspace Trust", url: "https://code.visualstudio.com/docs/editing/workspaces/workspace-trust", kind: "docs" },
        { label: "VS Code: Tips and tricks", url: "https://code.visualstudio.com/docs/editing/getting-started/tips-and-tricks", kind: "article" },
      ],
      video: {
        title: "Visual Studio Code Crash Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=WPqXP_kLzpo",
        videoId: "WPqXP_kLzpo",
        durationLabel: "1:32:35",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "tooling-vscode-productivity-q1",
          prompt:
            "Your user `settings.json` contains:\n\n```json\n{ \"[typescript]\": { \"editor.formatOnSave\": false } }\n```\n\nThe repo's `.vscode/settings.json` contains `\"editor.formatOnSave\": true`. You save a `.ts` file in that repo. What happens?",
          options: [
            "It isn't formatted: language-specific user settings outrank plain workspace settings",
            "It's formatted: workspace settings always override user settings",
            "It's formatted: the setting that was changed most recently wins",
            "VS Code asks which of the two conflicting settings to apply",
          ],
          correctIndex: 0,
          explanation:
            "In VS Code's precedence list every language-specific scope comes after all the plain scopes, so `[typescript]` in user settings beats a non-language workspace value. \"Workspace beats user\" is only true when both settings are the same kind.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-vscode-productivity-q2",
          prompt:
            "User settings set `\"search.exclude\": { \"**/node_modules\": true, \"**/dist\": true }`. The workspace sets `\"search.exclude\": { \"**/dist\": false, \"**/coverage\": true }`. Which statements are true inside that workspace? (Select all that apply.)",
          options: [
            "`**/node_modules` is excluded from search",
            "`**/coverage` is excluded from search",
            "`**/dist` is excluded from search",
            "Only the workspace object applies, so `node_modules` shows up in results",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Object-valued settings are merged key by key across scopes, with the higher scope winning per key: `node_modules` survives from user settings, `coverage` is added, and `dist` is switched back on by the workspace. Only primitive and array values are replaced wholesale.",
        },
        {
          id: "tooling-vscode-productivity-q3",
          prompt:
            "The workspace sets `\"editor.codeActionsOnSave\": { \"source.fixAll.eslint\": \"explicit\" }` and `\"files.autoSave\": \"onFocusChange\"`. When do ESLint fixes run?",
          options: [
            "Only when you save explicitly (for example Ctrl/Cmd+S), not on focus-change auto saves",
            "On every save, including auto saves",
            "Never, because `\"explicit\"` is not a valid value and is ignored",
            "Only when you run the \"Fix all\" command manually",
          ],
          correctIndex: 0,
          explanation:
            "`\"explicit\"` (the default) runs the code action on explicit saves only; `\"always\"` also runs it on auto saves triggered by window or focus changes. The old `true`/`false` values still work but are being deprecated in favour of these three.",
        },
        {
          id: "tooling-vscode-productivity-q4",
          prompt:
            "You clone an unfamiliar repository whose `.vscode/tasks.json` defines a task with `\"runOptions\": { \"runOn\": \"folderOpen\" }`, and you choose \"No, I don't trust the authors\". What happens to that task?",
          options: [
            "It doesn't run: Restricted Mode disables tasks until you trust the folder",
            "It runs, because tasks committed to the repo are considered part of the project",
            "It runs in a sandbox with no file system access",
            "VS Code deletes `tasks.json` from the working tree",
          ],
          correctIndex: 0,
          explanation:
            "Workspace Trust exists precisely to stop automatic code execution from untrusted folders: tasks, debugging, the terminal, workspace settings and many extensions are disabled or limited in Restricted Mode. Nothing is sandboxed or deleted; the features are simply off.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-vscode-productivity-q5",
          prompt: "Which of these belong in a team repository's committed `.vscode/` folder? (Select all that apply.)",
          options: [
            "`extensions.json` recommending the ESLint and Prettier extensions",
            "`settings.json` choosing the default formatter and code actions on save",
            "`launch.json` with a debug configuration for the dev server",
            "Your colour theme and editor font size",
            "The machine-specific path to your local Node.js installation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Commit settings that make the project behave consistently for everyone (tooling, formatting, debugging). Personal preferences belong in user settings or a Profile, and machine-specific paths break on every other machine.",
        },
        {
          id: "tooling-vscode-productivity-q6",
          prompt:
            "CI runs `tsc` from the repo's `node_modules` and reports type errors that your editor doesn't show. What's the most likely cause?",
          options: [
            "The editor's TypeScript features are using VS Code's bundled TypeScript instead of the workspace version",
            "VS Code only type-checks files that are open, and CI checks all of them",
            "The editor hides errors in files that are listed in `.gitignore`",
            "`tsc` in CI ignores `tsconfig.json` and applies stricter defaults",
          ],
          correctIndex: 0,
          explanation:
            "VS Code ships its own TypeScript for the language service. Run \"TypeScript: Select TypeScript Version\" and choose \"Use Workspace Version\" (or set `typescript.tsdk`) so the editor and CI agree. Open-files-only checking affects which errors you see listed, not whether an open file shows its own errors.",
        },
        {
          id: "tooling-vscode-productivity-q7",
          prompt:
            "You need to rename the function `fetchUser` across 40 files. One log message contains the text \"fetchUser failed\" and must not change. Which tool fits best?",
          options: [
            "F2 Rename Symbol, which renames the symbol and its references through the language server",
            "Search and replace across files for `fetchUser`",
            "Ctrl/Cmd+Shift+L to select every occurrence in the file, then type the new name",
            "Ctrl/Cmd+D repeatedly to add each match to a multi-cursor selection",
          ],
          correctIndex: 0,
          explanation:
            "Rename Symbol works on the semantic symbol, so it updates imports and call sites across files and leaves unrelated text alone. Text-based tools (search/replace, multi-cursor) can't tell the identifier from the same characters inside a string, and the multi-cursor commands only work within one file.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-vscode-productivity-q8",
          prompt:
            "Breakpoints you set in `src/*.ts` show as hollow (unbound) while debugging the compiled Node app. What's the most likely cause?",
          options: [
            "Source maps are missing, or the debugger can't map the running JavaScript back to your TypeScript files",
            "Breakpoints only work in `.js` files",
            "Workspace Trust blocks breakpoints in TypeScript files",
            "The file has to be open in an editor tab for its breakpoints to bind",
          ],
          correctIndex: 0,
          explanation:
            "The debugger sets breakpoints in the code that actually runs and uses source maps to translate locations. If `sourceMap` output is off, or the maps aren't found (for example `outFiles` doesn't match the build output), breakpoints stay unbound.",
        },
        {
          id: "tooling-vscode-productivity-q9",
          prompt:
            "You add `\"**/generated\": true` to `search.exclude` (not `files.exclude`). Where does the `generated/` folder still appear?",
          options: [
            "In the Explorer: `search.exclude` affects search and Quick Open results, not the file tree",
            "Nowhere: `search.exclude` hides it everywhere",
            "In search results, because `search.exclude` only applies to Quick Open",
            "In Git's Source Control view only",
          ],
          correctIndex: 0,
          explanation:
            "`files.exclude` hides files from the Explorer (and search inherits those patterns), while `search.exclude` only removes them from full-text search and Quick Open. Use the one that matches the intent.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "tooling-git-fundamentals",
      moduleId: "fe-tooling",
      trackId: "frontend",
      title: "Git Fundamentals: Commits, Branches, Merges & Rebasing",
      summary:
        "Git is a content-addressed object store with a thin layer of names on top. A blob holds a file's bytes (no name), a tree maps names and modes to blobs and subtrees, and a commit points at exactly one root tree plus zero or more parent commits, an author, a committer and a message. Every object is named by the hash of its content (SHA-1 by default, SHA-256 optionally), so identical files are stored once and changing anything, including a parent pointer, produces a new commit id. Branches and tags are refs, small files that name a commit, and `HEAD` usually names a branch. History is a DAG of snapshots, not a chain of diffs: diffs, renames and blame are computed on demand.\n\nThat model explains the everyday commands. A fast-forward just moves a ref. A merge creates a commit with two parents, using the merge base (the best common ancestor) as the third input of a three-way merge. A rebase replays each commit onto a new base, producing new commits with new ids, which is why rebasing a branch other people have pulled breaks their history. Nothing disappears immediately: the reflog records where each ref pointed (entries expire after 90 days, or 30 once unreachable), so `git reset --hard HEAD@{1}` undoes a bad reset or rebase.\n\nThe subtle case is the criss-cross merge: two branches that merged each other end up with two equally good merge bases. `git merge-base --all` lists both, and the default `ort` strategy first merges them into a virtual base. Knowing where the merge base is also tells you what `git diff main...feature` shows (changes since the branches diverged) and why a conflict appears at all.",
      level: "advanced",
      estMinutes: 100,
      isMilestone: true,
      webRefs: [
        { label: "Pro Git: Git Internals - Git Objects", url: "https://git-scm.com/book/en/v2/Git-Internals-Git-Objects", kind: "docs" },
        { label: "Git: git-merge-base", url: "https://git-scm.com/docs/git-merge-base", kind: "docs" },
        { label: "GitHub Blog: Commits are snapshots, not diffs", url: "https://github.blog/open-source/git/commits-are-snapshots-not-diffs/", kind: "article" },
        { label: "Git: git-reflog", url: "https://git-scm.com/docs/git-reflog", kind: "docs" },
      ],
      video: {
        title: "Git and GitHub for Beginners - Crash Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=RGOj5yH7evk",
        videoId: "RGOj5yH7evk",
        durationLabel: "1:08:30",
        startSeconds: 70,
        chapterLabel: "What is git?",
      },
      alternateVideos: [
        {
          title: "So You Think You Know Git - FOSDEM 2024",
          channel: "GitButler",
          url: "https://www.youtube.com/watch?v=aolI_Rz0ZqY",
          videoId: "aolI_Rz0ZqY",
          durationLabel: "47:00",
        },
        {
          title: "Git MERGE vs REBASE: Everything You Need to Know",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=0chZFIZLR_0",
          videoId: "0chZFIZLR_0",
          durationLabel: "4:34",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `mergeBases(parents, a, b)`, the equivalent of `git merge-base --all a b`. The merge base is the third input to every three-way merge, so this is the computation behind `git merge`, `git rebase` and `git diff a...b`.\n\n- `parents` maps each commit id to an array of its parent ids: `[]` for a root commit, one id for an ordinary commit, two or more for a merge commit.\n- A commit counts as its own ancestor. A common ancestor of `a` and `b` is a merge base (a \"best\" common ancestor) if it is not an ancestor of some other common ancestor.\n- Return every merge base, sorted ascending with the default string sort. Return `[]` when the two histories are unrelated.\n- Return `null` if `a` or `b` is not a key of `parents`.\n- A parent id that isn't a key of `parents` (the boundary of a shallow clone) is ignored, as if that commit didn't exist.\n- Histories can be deep (tens of thousands of commits in a line). Avoid recursion that can overflow the stack, and avoid comparing every pair of common ancestors: that is quadratic.\n\nIn a criss-cross history (two branches that merged each other) there can be two merge bases; return both.",
        starterCode:
          "/**\n * Like `git merge-base --all a b`.\n * @param {Record<string, string[]>} parents commit id -> parent ids\n * @param {string} a\n * @param {string} b\n * @returns {string[] | null} merge bases sorted ascending, or null for an unknown commit\n */\nfunction mergeBases(parents, a, b) {\n  // Your code here\n}\n",
        functionName: "mergeBases",
        testCases: [
          {
            description: "a feature branch forked from main has its fork point as the merge base",
            args: [{ A: [], B: ["A"], C: ["B"], D: ["B"], E: ["D"] }, "C", "E"],
            expected: ["B"],
          },
          {
            description: "a commit is its own merge base",
            args: [{ A: [], B: ["A"], C: ["B"], D: ["B"], E: ["D"] }, "E", "E"],
            expected: ["E"],
          },
          {
            description: "when one commit is an ancestor of the other, it is the merge base",
            args: [{ A: [], B: ["A"], C: ["B"], D: ["B"], E: ["D"] }, "E", "A"],
            expected: ["A"],
          },
          {
            description: "after main merges the feature, the merged feature tip becomes the new merge base",
            args: [{ A: [], B: ["A"], C: ["B"], D: ["B"], E: ["D"], M: ["C", "E"], F: ["E"], G: ["M"] }, "G", "F"],
            expected: ["E"],
          },
          {
            description: "older common ancestors behind a better one are not merge bases",
            args: [{ A: [], B: ["A"], C: ["B"], D: ["B"], M: ["C", "D"], E: ["D"] }, "M", "E"],
            expected: ["D"],
          },
          {
            description: "a criss-cross merge has two merge bases",
            args: [{ R: [], X1: ["R"], Y1: ["R"], X2: ["X1", "Y1"], Y2: ["Y1", "X1"], X3: ["X2"], Y3: ["Y2"] }, "X3", "Y3"],
            expected: ["X1", "Y1"],
            isEdgeCase: true,
          },
          {
            description: "an octopus merge (three parents) is handled like any other merge",
            args: [{ R: [], X: ["R"], Y: ["R"], Z: ["R"], O: ["X", "Y", "Z"], W: ["Z"] }, "O", "W"],
            expected: ["Z"],
          },
          {
            description: "unrelated histories have no merge base",
            args: [{ A: [], B: ["A"], P: [], Q: ["P"] }, "B", "Q"],
            expected: [],
            isEdgeCase: true,
          },
          {
            description: "an unknown commit id returns null",
            args: [{ A: [], B: ["A"] }, "B", "nope"],
            expected: null,
            isEdgeCase: true,
          },
          {
            description: "parents missing from the map (a shallow clone boundary) are ignored",
            args: [{ S1: ["gone"], S2: ["S1"], T1: ["gone"], T2: ["T1"] }, "S2", "T2"],
            expected: [],
            isEdgeCase: true,
          },
          {
            description: "a 20,000-commit linear history with a late fork (no stack overflow, no quadratic scan)",
            args: [
              (() => {
                const parents: Record<string, string[]> = { c0: [] };
                for (let i = 1; i < 20000; i++) parents[`c${i}`] = [`c${i - 1}`];
                parents.f1 = ["c12345"];
                parents.f2 = ["f1"];
                return parents;
              })(),
              "c19999",
              "f2",
            ],
            expected: ["c12345"],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "tooling-github-collaboration",
      moduleId: "fe-tooling",
      trackId: "frontend",
      title: "GitHub Collaboration: PRs, Reviews & Actions",
      summary:
        "A pull request is a proposal to move a branch ref, wrapped in review, CI and policy, and the merge button offers three different histories. A merge commit keeps the branch's commits and topology. Squash and merge collapses the PR into one new commit: a readable `main` and one-step reverts, but the original SHAs vanish, so the head branch is never an ancestor of `main` and branches stacked on it must be rebased. Rebase and merge replays each commit onto the base individually, always with new SHAs and updated committer info. Pick per repository: commit-level history or a tidy `main`. While a PR is open, updating it by rebasing requires a force push: use `--force-with-lease` together with `--force-if-includes`, because an editor's background fetch can silently satisfy a plain lease, and push review fixes as `git commit --fixup` commits that `git rebase -i --autosquash` folds in before merging.\n\nBranch protection and rulesets turn conventions into guarantees: required reviews (optionally dismissed when new commits change the diff), required status checks, branches that must be up to date or a merge queue, CODEOWNERS, linear history. Classic protection rules block force pushes and deletion by default but don't bind admins unless you opt in. When history goes wrong, `git reflog` finds lost commits and `git bisect run` finds a regression in log2(n) test runs.\n\nGitHub Actions runs workflows on events (`push`, `pull_request`, `workflow_dispatch`, `schedule`...). Set `permissions:` explicitly (any permission you don't list becomes `none`), grant `id-token: write` only for OIDC, and pin third-party actions to a commit SHA. Fork PRs on `pull_request` get no secrets and a read-only `GITHUB_TOKEN`; `pull_request_target` runs in the base repository's context with secrets, so checking out and running PR code there is the classic \"pwn request\". Caches are branch-scoped: a PR's cache belongs to its merge ref.",
      level: "advanced",
      estMinutes: 80,
      webRefs: [
        { label: "GitHub Docs: About merge methods on GitHub", url: "https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github", kind: "docs" },
        { label: "GitHub Docs: Secure use reference (Actions)", url: "https://docs.github.com/en/actions/reference/security/secure-use", kind: "docs" },
        { label: "GitHub Security Lab: Preventing pwn requests", url: "https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/", kind: "article" },
        { label: "Git: git-push (--force-with-lease, --force-if-includes)", url: "https://git-scm.com/docs/git-push", kind: "docs" },
      ],
      video: {
        title: "Git and GitHub for Beginners - Crash Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=RGOj5yH7evk",
        videoId: "RGOj5yH7evk",
        durationLabel: "1:08:30",
        startSeconds: 1962,
        chapterLabel: "git branching",
      },
      alternateVideos: [
        {
          title: "GitHub Actions Tutorial - Basic Concepts and CI/CD Pipeline with Docker",
          channel: "TechWorld with Nana",
          url: "https://www.youtube.com/watch?v=R8_veQiYBjI",
          videoId: "R8_veQiYBjI",
          durationLabel: "32:30",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tooling-github-collaboration-q1",
          prompt:
            "Your editor runs `git fetch` in the background every few minutes. Two minutes ago a teammate pushed a commit to your PR branch and your editor fetched it, but you haven't looked. You rebase locally and run `git push --force-with-lease`. What happens?",
          options: [
            "The push succeeds and silently discards the teammate's commit",
            "The push is rejected because the remote has a commit you don't have",
            "The push succeeds and Git merges the teammate's commit into your rebased branch",
            "The push is rejected only if the branch is protected",
          ],
          correctIndex: 0,
          explanation:
            "A plain lease compares the remote branch with your remote-tracking ref, and the background fetch already updated that ref to include the teammate's commit, so the check passes. `--force-if-includes` adds the missing check that the remote tip was actually integrated into your local branch.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-github-collaboration-q2",
          prompt: "A PR is merged with \"Squash and merge\". Which statements are true afterwards? (Select all that apply.)",
          options: [
            "The PR branch's commits are not ancestors of `main`",
            "A branch created from the PR branch will show the already-merged commits again in its next PR unless it's rebased",
            "Reverting the whole feature is a single `git revert` of one commit",
            "`git blame` on `main` shows each of the original work-in-progress commits",
            "The original commit SHAs from the PR appear on `main`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Squashing creates one brand-new commit whose only parent is the old `main` tip, so the branch's commits never become part of `main`'s history. That's what makes reverts easy and what confuses stacked branches, which still carry the original commits.",
        },
        {
          id: "tooling-github-collaboration-q3",
          prompt:
            "Your PR's three commits already sit directly on top of the latest `main`, so a fast-forward would be possible. You click \"Rebase and merge\". What does `main` contain?",
          options: [
            "Three commits with the same changes but new SHAs and updated committer information",
            "Your three exact commits, with `main` fast-forwarded to them",
            "One squashed commit",
            "Your three commits plus a merge commit",
          ],
          correctIndex: 0,
          explanation:
            "GitHub's rebase and merge always rewrites the commits (new committer info, new SHAs), even when a fast-forward was possible; plain `git rebase` wouldn't. So local branches pointing at your original commits won't show as merged.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-github-collaboration-q4",
          prompt:
            "During an interactive rebase you accidentally dropped a commit. No branch or tag points to it. What's the quickest safe recovery?",
          options: [
            "Find the pre-rebase tip in `git reflog` (or `ORIG_HEAD`) and reset to it, or cherry-pick the dropped commit",
            "Nothing: rebasing deletes the dropped commit's objects immediately",
            "Run `git revert HEAD` to restore the dropped commit",
            "Re-clone the repository from the remote",
          ],
          correctIndex: 0,
          explanation:
            "Rebasing creates new commits but doesn't delete the old ones; the branch's reflog still records where it pointed before, and unreachable objects survive until garbage collection prunes them. `git revert` undoes a commit that exists on the branch; it can't bring back one that was dropped.",
        },
        {
          id: "tooling-github-collaboration-q5",
          prompt:
            "You're rebasing your feature branch onto `main` and hit a conflict in `config.ts`. You run `git checkout --ours config.ts`. Whose version do you get?",
          options: [
            "The version from `main` plus the commits already replayed: during a rebase, \"ours\" is the base side",
            "Your feature branch's version, because \"ours\" always means your branch",
            "The version from the merge base",
            "Git refuses: `--ours` only works during a merge",
          ],
          correctIndex: 0,
          explanation:
            "A rebase replays your commits onto the upstream, so the side being built on (upstream plus the rebased series) is \"ours\" and the commit being replayed is \"theirs\". The sides are swapped compared with `git merge`, which catches out a lot of experienced people.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-github-collaboration-q6",
          prompt:
            "You run `git bisect run ./check.sh` over about 1,000 commits. `check.sh` exits with 125 on commits where the project doesn't compile. What does bisect do with those commits, and roughly how many test runs does the search take?",
          options: [
            "It skips them, and the search needs about 10 runs (log2 of 1,000), plus a few extra for skipped commits",
            "It marks them bad, and the search needs about 500 runs",
            "It aborts the bisect on the first 125",
            "It marks them good, and the search needs about 10 runs",
          ],
          correctIndex: 0,
          explanation:
            "Exit code 0 means good, 1 to 127 except 125 means bad, and 125 means \"can't test this one, skip it\"; codes above 127 abort. Bisect halves the range each step, so about 10 runs cover 1,000 commits.",
        },
        {
          id: "tooling-github-collaboration-q7",
          prompt:
            "A workflow declares:\n\n```yaml\npermissions:\n  contents: read\n  pull-requests: write\n```\n\nWhich statements are true for its `GITHUB_TOKEN`? (Select all that apply.)",
          options: [
            "`issues` access is `none`",
            "It can't request an OIDC token, because `id-token` is `none`",
            "It can't push commits or tags to the repository",
            "Permissions it doesn't list fall back to the repository's default token settings",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Once you specify any permission, every permission you didn't list is set to `none`, which is what makes an explicit block least-privilege. `contents: read` rules out pushes, and OIDC needs `id-token: write`.",
        },
        {
          id: "tooling-github-collaboration-q8",
          prompt:
            "A workflow runs `on: pull_request_target`, checks out `github.event.pull_request.head.sha`, then runs `npm ci && npm test` with a deploy token in its environment. Why is this dangerous?",
          options: [
            "The fork's author controls the code and install scripts that run, and `pull_request_target` runs with the base repository's secrets and a write-capable token",
            "It isn't: `pull_request_target` never receives secrets",
            "It's only dangerous in private repositories",
            "The checkout fails for forks, so the tests silently never run",
          ],
          correctIndex: 0,
          explanation:
            "`pull_request_target` runs the workflow from the base repository's default branch with its secrets, which is safe only as long as it doesn't execute PR code. Checking out the PR head and running its scripts hands those secrets to anyone who opens a PR (a \"pwn request\").",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-github-collaboration-q9",
          prompt:
            "A first-time contributor opens a PR from a fork. Your `pull_request` workflow uses `secrets.NPM_TOKEN`. Assuming a maintainer approves the run, what does the job see?",
          options: [
            "An empty value: secrets other than `GITHUB_TOKEN` aren't passed to fork runs, and the token is read-only",
            "The real secret, because a maintainer approved the run",
            "The secret, but masked in logs",
            "The job fails to start until the contributor adds their own `NPM_TOKEN`",
          ],
          correctIndex: 0,
          explanation:
            "Fork-triggered `pull_request` runs get no repository secrets (apart from a read-only `GITHUB_TOKEN`); approval only lets the workflow run at all. Design fork CI so it doesn't need secrets.",
        },
        {
          id: "tooling-github-collaboration-q10",
          prompt:
            "A workflow triggered by a pull request from `feature-a` into `main` saves a dependency cache. Which runs can restore that cache?",
          options: [
            "Only re-runs of that same pull request, because the cache belongs to the PR's merge ref",
            "Any run on `main`",
            "Any other pull request that targets `main`",
            "Runs on the sibling branch `feature-c`",
          ],
          correctIndex: 0,
          explanation:
            "Caches created by `pull_request` runs are scoped to `refs/pull/<n>/merge`. Runs can read caches from their own branch, their PR's base branch and the default branch, but never from child or sibling branches, which is also what blocks cache poisoning across PRs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-github-collaboration-q11",
          prompt:
            "Two PRs each pass CI and get merged a few minutes apart. Together they break `main`, although each one was green on its own. Which setting prevents this?",
          options: [
            "Require branches to be up to date before merging, or use a merge queue",
            "Require signed commits",
            "Dismiss stale approvals when new commits are pushed",
            "Require conversation resolution before merging",
          ],
          correctIndex: 0,
          explanation:
            "Each PR was tested against the `main` that existed when its CI ran, never against the other PR. Requiring an up-to-date branch (or a merge queue, which tests PRs in merge order) makes CI validate the exact combination that lands.",
        },
        {
          id: "tooling-github-collaboration-q12",
          prompt: "Which are true of a classic branch protection rule with default settings? (Select all that apply.)",
          options: [
            "Force pushes to the matching branches are blocked",
            "The matching branches can't be deleted",
            "Repository admins are bound by the rule",
            "Approvals are automatically dismissed when new commits are pushed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Every rule blocks force pushes and deletion by default. Applying the rule to administrators and dismissing stale approvals are separate opt-in settings, which is why \"protected\" branches are often less protected than teams assume.",
        },
      ],
    },
    {
      id: "tooling-npm-packages",
      moduleId: "fe-tooling",
      trackId: "frontend",
      title: "npm & Package Management",
      summary:
        "`package.json` states intent as semver ranges; `package-lock.json` records the exact tree that was resolved, every transitive version with its tarball URL and integrity hash. Commit the lockfile, but know that consumers of a library never see yours: they resolve your ranges against their own tree. Ranges are subtler than they look. `^1.4.2` means `>=1.4.2 <2.0.0`, but `^0.4.2` stops before `0.5.0` and `^0.0.4` allows no updates at all, and a prerelease only satisfies a range that names a prerelease of the same `major.minor.patch`.\n\nIn CI use `npm ci`: it requires a lockfile, deletes `node_modules`, fails if the lockfile and `package.json` disagree, and never writes either file. `npm install` is for changing the tree. Since npm 7, peer dependencies are installed automatically and conflicts fail with `ERESOLVE`; `--legacy-peer-deps` hides the conflict and then has to be used everywhere (ideally from a committed `.npmrc`). `overrides` in the root `package.json` force a transitive version, for instance to patch a vulnerable dependency before its parent releases, and workspaces link local packages into one install.\n\nThe registry is an attack surface. Typosquats, hijacked maintainer accounts and malicious install scripts have all hit popular packages, which is why the OWASP Top 10:2025 puts Software Supply Chain Failures at A03. Defenses stack: review lockfile diffs, run `npm audit` (it only knows about published advisories, so it won't flag a malicious version released an hour ago), verify registry signatures and provenance with `npm audit signatures`, publish from CI with trusted publishing (OIDC) instead of long-lived tokens, and hold back brand-new releases with `min-release-age` (npm 11.10+). npm 12 (July 2026) blocks dependency install scripts unless the root `allowScripts` policy approves them, but Node 24 still bundles npm 11, where they run by default.",
      level: "advanced",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "npm Docs: npm ci", url: "https://docs.npmjs.com/cli/commands/npm-ci/", kind: "docs" },
        { label: "npm Docs: Trusted publishing for npm packages", url: "https://docs.npmjs.com/trusted-publishers/", kind: "docs" },
        { label: "npm/node-semver: range syntax reference", url: "https://github.com/npm/node-semver", kind: "repo" },
        { label: "OWASP Top 10:2025: A03 Software Supply Chain Failures", url: "https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/", kind: "article" },
      ],
      video: {
        title: "Why Your Dependencies Break AND How to Actually Fix Them",
        channel: "LearnThatStack",
        url: "https://www.youtube.com/watch?v=EGHXkCQkUEA",
        videoId: "EGHXkCQkUEA",
        durationLabel: "10:18",
      },
      alternateVideos: [
        {
          title: "npm 7 - workspaces, peer dependencies, new package-lock file (demo) - GitHub Checkout",
          channel: "GitHub",
          url: "https://www.youtube.com/watch?v=c9dB86KNuDU",
          videoId: "c9dB86KNuDU",
          durationLabel: "10:17",
        },
        {
          title: "The largest supply-chain attack ever…",
          channel: "Fireship",
          url: "https://www.youtube.com/watch?v=QVqIx-Y8s-s",
          videoId: "QVqIx-Y8s-s",
          durationLabel: "4:00",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tooling-npm-packages-q1",
          prompt: "A dependency is declared as `\"^0.4.2\"`. The registry has `0.4.2`, `0.4.9`, `0.5.0` and `1.0.0`. What will a fresh install resolve to?",
          options: ["`0.4.9`", "`0.5.0`", "`1.0.0`", "`0.4.2`"],
          correctIndex: 0,
          explanation:
            "A caret range allows changes that don't modify the left-most non-zero part, so for `0.x` the minor version acts like a major: `^0.4.2` means `>=0.4.2 <0.5.0`. People who read `^` as \"anything below the next major\" expect `0.5.0`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-npm-packages-q2",
          prompt: "Which versions satisfy the range `^1.2.3-beta.2`? (Select all that apply.)",
          options: ["`1.2.3-beta.4`", "`1.2.3`", "`1.9.0`", "`1.2.4-beta.1`", "`2.0.0`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The range is `>=1.2.3-beta.2 <2.0.0-0`, but a prerelease only matches if the range names a prerelease of the same `major.minor.patch`. So `1.2.3-beta.4` qualifies, `1.2.4-beta.1` doesn't, and ordinary releases up to `2.0.0` do.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-npm-packages-q3",
          prompt:
            "A developer bumps `react` to `^19.3.0` in `package.json` but forgets to run `npm install`, so `package-lock.json` still pins React 18. What does `npm ci` do in CI?",
          options: [
            "It exits with an error because the lockfile and `package.json` don't match",
            "It installs React 19 and rewrites the lockfile",
            "It installs React 18 from the lockfile and ignores `package.json`",
            "It installs React 19 without writing the lockfile",
          ],
          correctIndex: 0,
          explanation:
            "`npm ci` treats the lockfile as the source of truth and refuses to proceed when it doesn't satisfy `package.json`. That failure is the point: CI never silently installs a tree nobody reviewed.",
        },
        {
          id: "tooling-npm-packages-q4",
          prompt: "Which statements about `npm ci` are true? (Select all that apply.)",
          options: [
            "It deletes an existing `node_modules` before installing",
            "It never writes to `package.json` or `package-lock.json`",
            "It can't add a single package, as in `npm ci lodash`",
            "Without a lockfile it falls back to behaving like `npm install`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`npm ci` is a frozen, whole-project install. It requires an existing lockfile and errors without one instead of falling back.",
        },
        {
          id: "tooling-npm-packages-q5",
          prompt:
            "You maintain a library whose committed `package-lock.json` pins `debug@4.3.4`, while `package.json` declares `\"debug\": \"^4.3.0\"`. An application installs your library. Which `debug` does the application get?",
          options: [
            "Whatever satisfies `^4.3.0` in the application's own resolution, often a newer 4.x; your lockfile isn't used",
            "Exactly `4.3.4`, because your lockfile is published with the package",
            "Exactly `4.3.0`, the lowest version in the range",
            "The latest `debug`, whatever its major version",
          ],
          correctIndex: 0,
          explanation:
            "npm only honours the lockfile at the root of the project being installed. A library's consumers resolve its declared ranges, which is why libraries should test against the newest versions their ranges allow.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-npm-packages-q6",
          prompt:
            "Your app depends on `react@18.3.1`. You run `npm install fancy-plugin` (npm 11), and the plugin declares `\"peerDependencies\": { \"react\": \"^19.0.0\" }`. What happens by default?",
          options: [
            "The install fails with an `ERESOLVE` peer dependency conflict",
            "npm installs React 19 next to React 18 for the plugin only",
            "npm prints a warning and installs the plugin anyway",
            "npm silently upgrades your app to React 19",
          ],
          correctIndex: 0,
          explanation:
            "Since npm 7 peer dependencies are installed and validated, so an unsatisfiable peer range is an error. `--legacy-peer-deps` restores the npm 6 behaviour of ignoring peers, at the cost of a tree that may break at runtime.",
        },
        {
          id: "tooling-npm-packages-q7",
          prompt:
            "A transitive dependency, `minimist@1.2.5`, has a published CVE. The fix is in `1.2.8`, but the package that depends on it hasn't released an update. What's the most targeted fix?",
          options: [
            "Add `\"overrides\": { \"minimist\": \"1.2.8\" }` to the root `package.json` and reinstall",
            "Edit the version inside `node_modules/minimist/package.json`",
            "Run `npm audit fix --force` and accept whatever it changes",
            "Add `minimist@1.2.8` to your own `dependencies` and assume the nested copy updates",
          ],
          correctIndex: 0,
          explanation:
            "`overrides` replaces a package anywhere in the tree and is recorded in the lockfile; it's only honoured in the root `package.json`. Adding a direct dependency doesn't guarantee the nested copy changes, and `--force` may jump major versions of unrelated packages.",
        },
        {
          id: "tooling-npm-packages-q8",
          prompt:
            "A popular package's maintainer account is hijacked and a malicious patch release goes out. Twenty minutes later your CI runs `npm install` (with `^` ranges) followed by `npm audit`. Which statement is most accurate?",
          options: [
            "The malicious version can be installed, and `npm audit` won't flag it until an advisory is published",
            "`npm audit` blocks the install because the version is too new",
            "The registry rejects any release published from a new device",
            "`npm install` refuses versions that aren't in the lockfile",
          ],
          correctIndex: 0,
          explanation:
            "`npm audit` checks installed versions against known advisories, so a zero-day release looks clean. Installing from a reviewed lockfile with `npm ci`, a `min-release-age` delay and blocking install scripts are what actually reduce this exposure. `npm install` happily updates within ranges.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-npm-packages-q9",
          prompt: "Under npm 12's default settings, which statements are true? (Select all that apply.)",
          options: [
            "A dependency's `postinstall` script doesn't run unless the root package's `allowScripts` policy approves it",
            "`npm install-scripts approve <pkg>` writes a version-pinned approval by default",
            "Your own root package's scripts, such as `npm run build`, are blocked too",
            "The npm bundled with Node.js 24 has the same default",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "npm 12 made dependency install scripts opt-in, recorded in `allowScripts` (pinned to the reviewed version unless you pass `--no-allow-scripts-pin`). Your own `npm run` scripts are unaffected, and Node 24 still ships npm 11, which runs dependency install scripts unless you use `--ignore-scripts`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-npm-packages-q10",
          prompt: "What does npm trusted publishing from GitHub Actions replace?",
          options: [
            "A long-lived npm access token stored as a CI secret, by exchanging the workflow's short-lived OIDC identity at publish time",
            "Two-factor authentication for maintainers logging in to npmjs.com",
            "The need to commit a lockfile",
            "Running `npm audit` before publishing",
          ],
          correctIndex: 0,
          explanation:
            "Trusted publishing links a package to a specific repository and workflow; the job (with `id-token: write`) proves its identity via OIDC and publishes with provenance, so there's no stealable token sitting in CI secrets.",
        },
        {
          id: "tooling-npm-packages-q11",
          prompt:
            "In an npm workspaces monorepo, `packages/app` depends on `\"@acme/ui\": \"*\"`, and `packages/ui` has `\"name\": \"@acme/ui\"`. After `npm install` at the root, where does the app's `@acme/ui` come from?",
          options: [
            "A symlink in the root `node_modules` pointing at `packages/ui`",
            "The public npm registry, since `*` matches any published version",
            "A copy of `packages/ui` made at install time that doesn't pick up later edits",
            "Nowhere: workspaces must be referenced with `file:` specifiers",
          ],
          correctIndex: 0,
          explanation:
            "npm resolves a dependency to a matching workspace before going to the registry and links it into `node_modules`, so edits in `packages/ui` are visible to the app immediately.",
        },
        {
          id: "tooling-npm-packages-q12",
          prompt:
            "Your production image runs `npm ci --omit=dev`. At runtime the server crashes with `Cannot find module 'zod'`, although tests pass in CI. What's the likely cause?",
          options: [
            "`zod` is listed in `devDependencies` even though production code imports it",
            "`npm ci` doesn't install packages with `peerDependencies`",
            "`--omit=dev` also omits packages that were installed from a lockfile",
            "`zod` has to be installed globally in production images",
          ],
          correctIndex: 0,
          explanation:
            "CI installs everything, so the misclassified package is present while testing; `--omit=dev` removes it from the production tree. Anything imported at runtime belongs in `dependencies`.",
        },
      ],
    },
    {
      id: "tooling-vite",
      moduleId: "fe-tooling",
      trackId: "frontend",
      title: "Vite as a Build Tool",
      summary:
        "Vite's core bet is that the browser can do the module loading during development. The dev server serves your source as native ES modules and transforms each file only when it's requested (TypeScript and JSX via Oxc, transpile-only, so type errors never fail the build: run `tsc --noEmit` separately), which keeps startup time flat as the app grows. Dependencies are handled differently: they're pre-bundled once into `node_modules/.vite`, both to turn CommonJS/UMD packages into ESM and to collapse packages like `lodash-es`, with its 600+ internal modules, into a single request. Pre-bundled deps are served with `max-age=31536000,immutable`, which is why editing a file inside `node_modules` seems to do nothing until you restart with `--force` or disable the cache.\n\nProduction is a real bundle, because unbundled ESM over a network means request waterfalls. Through Vite 7 that meant esbuild in dev and Rollup for builds, two pipelines that could disagree. Vite 8 (March 2026) uses Rolldown, a Rust bundler with Rollup's plugin API, for both, and translates existing `esbuild` and `rollupOptions` config through a compatibility layer. Dev and build can still differ (chunking, CSS order, what's tree-shaken), so check the output of `vite build` with `vite preview`.\n\nHMR works on the module graph. When a file changes, Vite walks up its importers to the nearest module that accepts updates, an HMR boundary such as a component file under React Fast Refresh, and swaps just that part; if no boundary is reached, the page reloads. `import.meta.env` values are statically replaced at build time, and only variables prefixed with `VITE_` (or your `envPrefix`) reach client code, because anything exposed is readable in the shipped JavaScript. `.env.[mode]` beats `.env`, variables already set in the shell beat both, and every value is a string.",
      level: "advanced",
      estMinutes: 130,
      webRefs: [
        { label: "Vite: Why Vite", url: "https://vite.dev/guide/why", kind: "docs" },
        { label: "Vite: Dependency Pre-Bundling", url: "https://vite.dev/guide/dep-pre-bundling", kind: "docs" },
        { label: "Vite: Env Variables and Modes", url: "https://vite.dev/guide/env-and-mode", kind: "docs" },
        { label: "Vite Blog: Vite 8.0 is out!", url: "https://vite.dev/blog/announcing-vite8", kind: "article" },
      ],
      video: {
        title: "Learn Vite – Frontend Build Tool Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=VAeRhmpcWEQ",
        videoId: "VAeRhmpcWEQ",
        durationLabel: "1:31:02",
      },
      alternateVideos: [
        {
          title: "Vite in 100 Seconds",
          channel: "Fireship",
          url: "https://www.youtube.com/watch?v=KCrXgy8qtjM",
          videoId: "KCrXgy8qtjM",
          durationLabel: "2:28",
        },
        {
          title: "Alexander Lichter | Rolldown: How Vite bundles at the speed of Rust | ViteConf 2025",
          channel: "ViteConf",
          url: "https://www.youtube.com/watch?v=3PFLeteDuyQ",
          videoId: "3PFLeteDuyQ",
          durationLabel: "24:59",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tooling-vite-q1",
          prompt: "Why does Vite pre-bundle dependencies in development? (Select all that apply.)",
          options: [
            "To convert CommonJS and UMD packages into ES modules the browser can import",
            "To collapse packages made of hundreds of internal modules into one request",
            "To type-check dependencies before the dev server starts",
            "Because `vite build` reuses the pre-bundled output as the production bundle",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "The dev server serves native ESM, so CommonJS dependencies must be converted, and a package like `lodash-es` would otherwise trigger 600+ requests. Pre-bundling only applies in development; builds are bundled separately and nothing is type-checked.",
        },
        {
          id: "tooling-vite-q2",
          prompt:
            "To debug a library you add a `console.log` to `node_modules/some-lib/dist/index.js` and reload the page served by `vite`. Nothing is logged. Why?",
          options: [
            "Pre-bundled dependencies are served from `node_modules/.vite` with an immutable cache header; restart with `--force` or disable the cache",
            "Vite never serves files from `node_modules` in development",
            "Browsers ignore `console.log` calls inside third-party code",
            "Vite strips `console` calls from dependencies",
          ],
          correctIndex: 0,
          explanation:
            "The browser loads the pre-bundled copy, not your edited file, and caches it with `max-age=31536000,immutable`. The cache is invalidated when the lockfile changes, not when you edit `node_modules` by hand.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-vite-q3",
          prompt:
            "`.env` contains:\n\n```bash\nAPI_SECRET=abc123\nVITE_API_URL=https://api.example.com\n```\n\nWhat does this client code log?\n\n```js\nconsole.log(import.meta.env.VITE_API_URL, import.meta.env.API_SECRET);\n```",
          options: [
            "`https://api.example.com undefined`",
            "`https://api.example.com abc123`",
            "`undefined undefined`, because `.env` is only read by `vite.config.js`",
            "It throws, because `import.meta.env` is only available in Node",
          ],
          correctIndex: 0,
          explanation:
            "Only `VITE_`-prefixed variables (or your custom `envPrefix`) are exposed to client code, precisely so a server secret in the same `.env` file can't leak into the bundle.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-vite-q4",
          prompt: "Which statements about `VITE_` variables are true? (Select all that apply.)",
          options: [
            "Their values end up as literal strings in the built JavaScript",
            "`VITE_PORT=3000` arrives in client code as the string `\"3000\"`",
            "They're safe for API secret keys because the production bundle is minified",
            "Editing `.env` takes effect in the running dev server without a restart",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Values are statically replaced at build time and always arrive as strings, so anyone can read them in the shipped JavaScript; minification doesn't hide them. `.env` files are loaded when Vite starts, so changes need a restart.",
        },
        {
          id: "tooling-vite-q5",
          prompt:
            "`.env` sets `VITE_TITLE=A` and `.env.production` sets `VITE_TITLE=B`. You run `VITE_TITLE=C vite build`. What is `import.meta.env.VITE_TITLE` in the bundle?",
          options: ["`\"C\"`", "`\"B\"`", "`\"A\"`", "`\"B\"` in production chunks and `\"A\"` elsewhere"],
          correctIndex: 0,
          explanation:
            "Mode-specific files beat generic ones, but variables that already exist in the environment when Vite starts have the highest priority and aren't overwritten by any `.env` file.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-vite-q6",
          prompt: "You run `vite build --mode staging` without setting `NODE_ENV`. What are `import.meta.env.MODE` and `import.meta.env.PROD`?",
          options: [
            "`\"staging\"` and `true`",
            "`\"production\"` and `true`",
            "`\"staging\"` and `false`",
            "`\"development\"` and `false`",
          ],
          correctIndex: 0,
          explanation:
            "Mode and `NODE_ENV` are separate concepts: `--mode` picks which `.env.[mode]` files load and sets `MODE`, while `vite build` still defaults `NODE_ENV` to production, which is what `PROD` reflects.",
        },
        {
          id: "tooling-vite-q7",
          prompt:
            "`format.ts` is imported only by `Price.tsx`, a component module handled by React Fast Refresh. You edit `format.ts` in the dev server. What happens?",
          options: [
            "`Price.tsx` acts as the HMR boundary: it re-executes with the new `format.ts`, and component state is preserved",
            "The whole page reloads, because `format.ts` doesn't accept updates itself",
            "Nothing happens until you save `Price.tsx`",
            "Vite rebuilds the full bundle and then reloads",
          ],
          correctIndex: 0,
          explanation:
            "Vite propagates the change up the importer chain to the nearest module that accepts hot updates. A Fast Refresh component module accepts, so only it re-runs; a full reload happens only when a chain reaches the root without a boundary.",
        },
        {
          id: "tooling-vite-q8",
          prompt: "Which statements describe Vite 8? (Select all that apply.)",
          options: [
            "Rolldown is used both for dependency pre-bundling and for production builds",
            "TypeScript and JSX are transformed with Oxc",
            "The dev server bundles the whole app by default, replacing unbundled ESM",
            "Existing Rollup plugins must be rewritten in Rust",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Vite 8 replaces esbuild and Rollup with Rolldown and uses Oxc for transforms. Rolldown implements Rollup's plugin API, so most plugins work unchanged, and full bundle mode for dev is still experimental.",
        },
        {
          id: "tooling-vite-q9",
          prompt: "A PR introduces a TypeScript type error, yet `vite build` succeeds. Why, and what should CI do?",
          options: [
            "Vite only transpiles TypeScript and never type-checks; run `tsc --noEmit` as a separate CI step",
            "Vite type-checks only files that changed since the last build",
            "Type errors are downgraded to warnings in production mode",
            "The build succeeded because type errors don't exist in `.tsx` files",
          ],
          correctIndex: 0,
          explanation:
            "Transpiling works file by file, which fits Vite's on-demand model; type checking needs the whole program. Keeping them separate is a deliberate speed trade-off, so the check has to live elsewhere.",
        },
        {
          id: "tooling-vite-q10",
          prompt:
            "What happens to `mountDebugPanel` in the production bundle?\n\n```js\nif (import.meta.env.DEV) {\n  mountDebugPanel();\n}\n```",
          options: [
            "`import.meta.env.DEV` is replaced with `false`, the branch becomes dead code, and it's removed (along with `mountDebugPanel` if nothing else uses it)",
            "The check runs at runtime in the browser and simply returns `false`",
            "The debug panel is mounted, because `DEV` reflects the developer's machine",
            "The build fails, because `import.meta.env` can't be used in conditionals",
          ],
          correctIndex: 0,
          explanation:
            "Env constants are statically replaced at build time specifically so the minifier and tree-shaker can drop development-only branches.",
        },
        {
          id: "tooling-vite-q11",
          prompt: "What is `vite preview` for?",
          options: [
            "Serving the already-built `dist` folder locally to check the production output",
            "Running the app in production on your server",
            "Starting the dev server with HMR disabled",
            "Generating a visual report of bundle sizes",
          ],
          correctIndex: 0,
          explanation:
            "Dev and build use different pipelines, so bugs can appear only in the built output. `vite preview` is a quick local static server for that output, not a production server.",
        },
        {
          id: "tooling-vite-q12",
          prompt:
            "`index.html` contains `<p>%NON_EXISTENT%</p>`, and a module contains `console.log(import.meta.env.NON_EXISTENT)`. Neither variable is defined. What do you get?",
          options: [
            "The HTML keeps the literal text `%NON_EXISTENT%`, and the JavaScript logs `undefined`",
            "Both are replaced with empty strings",
            "The build fails on the undefined HTML placeholder",
            "Both are left untouched as literal text",
          ],
          correctIndex: 0,
          explanation:
            "HTML constant replacement ignores unknown `%NAME%` placeholders, while in JavaScript an unknown `import.meta.env` property is replaced with `undefined`. The asymmetry is documented and easy to miss.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "tooling-devtools",
      moduleId: "fe-tooling",
      trackId: "frontend",
      title: "Browser DevTools Mastery",
      summary:
        "DevTools is a profiler, debugger and network lab, and most engineers use a fraction of it. The Performance panel opens on live Core Web Vitals (LCP, CLS, INP) for the current page; record a trace to learn why they're bad. Tasks longer than 50 ms are flagged as long tasks, and the Bottom-Up and Call Tree views show which functions own the time. Record in a clean profile (incognito, no extensions), against a production build, with CPU throttling, and remember that throttling is relative to your own machine: 4x on a fast laptop isn't a mid-range phone, so calibrate or compare with field data. Network throttling and request blocking reproduce slow and failure paths, and \"Disable cache\" only applies while DevTools is open.\n\nMemory problems need heap snapshots. A snapshot (which always runs garbage collection first) shows what's still reachable; take one, repeat an action several times, take another and compare, then read the Retainers pane to see what holds the growth. Retained size, not shallow size, is what freeing an object would reclaim. Detached DOM nodes, removed from the document but still referenced from JavaScript, are the classic single-page-app leak, and holding one leaf keeps its whole detached subtree alive through parent pointers. The Coverage panel shows how much shipped JavaScript and CSS never ran, per function or per block, which points at code-splitting opportunities rather than safe deletions.\n\nIn Sources, stop sprinkling `console.log`: logpoints log without editing code, conditional breakpoints pause only when an expression is true, DOM breakpoints pause on subtree, attribute or node-removal changes so you can catch whichever script mutates an element, and XHR/fetch, event-listener and exception breakpoints cover the rest. `debug(fn)` pauses on a function's next call, and the ignore list keeps framework frames out of your way.",
      level: "advanced",
      estMinutes: 120,
      isMilestone: true,
      webRefs: [
        { label: "Chrome DevTools: Performance features reference", url: "https://developer.chrome.com/docs/devtools/performance/reference", kind: "docs" },
        { label: "Chrome DevTools: Record heap snapshots", url: "https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots", kind: "docs" },
        { label: "Chrome DevTools: Pause your code with breakpoints", url: "https://developer.chrome.com/docs/devtools/javascript/breakpoints", kind: "docs" },
        { label: "web.dev: Optimize long tasks", url: "https://web.dev/articles/optimize-long-tasks", kind: "article" },
      ],
      video: {
        title: "Chrome DevTools - Crash Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=gTVpBbFWry8",
        videoId: "gTVpBbFWry8",
        durationLabel: "1:14:51",
      },
      alternateVideos: [
        {
          title: "Performance debugging in DevTools",
          channel: "Chrome for Developers",
          url: "https://www.youtube.com/watch?v=BHqxD9qr6Gw",
          videoId: "BHqxD9qr6Gw",
          durationLabel: "10:55",
        },
        {
          title: "Debugging memory leaks - HTTP 203",
          channel: "Chrome for Developers",
          url: "https://www.youtube.com/watch?v=YDU_3WdfkxA",
          videoId: "YDU_3WdfkxA",
          durationLabel: "22:04",
        },
        {
          title: "Breakpoints and logpoints #DevToolsTips",
          channel: "Chrome for Developers",
          url: "https://www.youtube.com/watch?v=JyHjoaUhAus",
          videoId: "JyHjoaUhAus",
          durationLabel: "3:40",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tooling-devtools-q1",
          prompt:
            "Can the `#tree` subtree be garbage-collected after this runs?\n\n```js\nlet tree = document.querySelector(\"#tree\");\nlet leaf = document.querySelector(\"#leaf\"); // a descendant of #tree\ntree.remove();\ntree = null;\n```",
          options: [
            "No: `leaf` is still referenced, and its parent pointers keep the whole detached subtree reachable",
            "Yes: `tree` is null and the subtree is out of the document",
            "Only `#leaf` stays in memory; the rest of the subtree is collected",
            "Yes, but only after the next page navigation",
          ],
          correctIndex: 0,
          explanation:
            "A detached node keeps its ancestors alive through `parentNode`, so one lingering reference to a leaf retains the entire removed tree. It becomes collectable only when `leaf` is released too. Heap snapshots show this as detached elements.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-devtools-q2",
          prompt: "In a heap snapshot an object shows a shallow size of 64 B and a retained size of 48 MB. What does that tell you?",
          options: [
            "Making that object unreachable would free about 48 MB, because it's what keeps a large object graph alive",
            "The object itself occupies 48 MB, and 64 B is its compressed size",
            "48 MB is the total heap size when the snapshot was taken",
            "The object is a leak, because retained size is larger than shallow size",
          ],
          correctIndex: 0,
          explanation:
            "Shallow size is the memory held by the object itself; retained size is what would be freed if it and everything only it keeps alive were collected. A small object with a huge retained size is a gatekeeper worth investigating, but it isn't automatically a leak.",
        },
        {
          id: "tooling-devtools-q3",
          prompt: "Memory grows every time users open and close a modal. Which steps help find the leak? (Select all that apply.)",
          options: [
            "Take a snapshot, open and close the modal several times, take another snapshot and compare them",
            "Use the Retainers pane to see what keeps the growing objects reachable",
            "Filter the snapshot for objects retained by detached nodes",
            "Sort by shallow size and assume the top entry is the leak",
            "Ignore objects you inspected in the Console, since the Console never retains anything",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Comparing snapshots around a repeated action isolates what accumulates, and retainers show why it survives. Shallow size misleads (a small object can hold megabytes), and objects you evaluated in the Console are retained by it, which is why snapshots have a filter for them.",
        },
        {
          id: "tooling-devtools-q4",
          prompt:
            "You profile an interaction with 4x CPU throttling on a fast laptop and INP looks fine. Real users on mid-range Android phones report sluggish interactions. What's the most likely explanation?",
          options: [
            "Throttling is relative to your machine's speed, so 4x slower than a fast laptop can still be faster than their phones; calibrate a preset or compare with field data",
            "CPU throttling doesn't affect JavaScript execution, only rendering",
            "INP can't be measured in DevTools, only in the field",
            "Android browsers don't report INP",
          ],
          correctIndex: 0,
          explanation:
            "DevTools slows your CPU by a multiplier, it doesn't emulate a specific device. The Performance panel can calibrate presets for low- and mid-tier phones and show CrUX field metrics next to your local ones.",
        },
        {
          id: "tooling-devtools-q5",
          prompt: "In a Performance trace, which main-thread tasks are marked as long tasks?",
          options: ["Tasks longer than 50 ms", "Tasks longer than 16 ms", "Tasks longer than 100 ms", "Any task that triggers a layout"],
          correctIndex: 0,
          explanation:
            "50 ms is the long-task threshold because it leaves time to respond within about 100 ms of an input. 16 ms is one frame at 60 Hz, a different budget.",
        },
        {
          id: "tooling-devtools-q6",
          prompt:
            "You want to see `order.total` on every loop iteration without pausing execution and without editing the source file. What do you use?",
          options: ["A logpoint", "A conditional breakpoint", "A `debugger` statement", "An event listener breakpoint"],
          correctIndex: 0,
          explanation:
            "A logpoint logs an expression each time the line runs and never pauses. A conditional breakpoint pauses when its condition is true, and `debugger` requires editing the code.",
        },
        {
          id: "tooling-devtools-q7",
          prompt:
            "Some script keeps removing the `data-state` attribute from your modal element, and you can't find where. What's the fastest way to catch it?",
          options: [
            "In the Elements panel, set Break on > attribute modifications on the modal; the call stack shows the culprit when it pauses",
            "Search all loaded scripts for the string `removeAttribute`",
            "Add a `MutationObserver` that logs the change",
            "Record a performance trace and look for style recalculations",
          ],
          correctIndex: 0,
          explanation:
            "DOM change breakpoints pause on the exact statement that modifies the node's attributes, subtree or presence, with the full call stack. Text search misses indirect code paths, and a `MutationObserver` fires after the fact without the responsible stack.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-devtools-q8",
          prompt: "The Coverage panel reports that 70% of `main.js` was unused while loading your landing page. What's the sensible conclusion?",
          options: [
            "Much of that code isn't needed for this page's first load, so it's a candidate for code splitting or lazy loading",
            "70% of `main.js` is dead code that can be deleted",
            "The bundler's tree shaking is broken",
            "The file is being downloaded twice",
          ],
          correctIndex: 0,
          explanation:
            "Coverage only records what ran during your session. Code for other routes, interactions and error paths shows as unused but is still needed, so the fix is usually splitting, not deletion.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-devtools-q9",
          prompt: "You tick \"Disable cache\" in the Network panel, close DevTools and reload the page. Is the HTTP cache used?",
          options: [
            "Yes: the setting only applies while DevTools is open",
            "No: the setting persists for the whole browser profile",
            "No, until you restart the browser",
            "Only for requests to other origins",
          ],
          correctIndex: 0,
          explanation:
            "\"Disable cache\" is scoped to open DevTools sessions, which is why a bug you can't reproduce with DevTools open can be a caching bug.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tooling-devtools-q10",
          prompt: "Which practices make a performance recording trustworthy? (Select all that apply.)",
          options: [
            "Record in an incognito window or clean profile, so extensions don't add main-thread work",
            "Profile a production build rather than the development server",
            "Apply CPU throttling that approximates your users' devices",
            "Trust the first recording, since repeating it adds noise",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Extensions and development builds (with dev-only checks and unminified code) distort traces, and unthrottled desktop CPUs hide problems. Recording several times and comparing is how you tell signal from noise.",
        },
        {
          id: "tooling-devtools-q11",
          prompt: "What does running `debug(handleSubmit)` in the Console do?",
          options: [
            "It pauses in the debugger at the first line of `handleSubmit` the next time it's called",
            "It logs every call to `handleSubmit` without pausing",
            "It prints `handleSubmit`'s source code",
            "It re-runs `handleSubmit` with the last arguments it received",
          ],
          correctIndex: 0,
          explanation:
            "`debug(fn)` is a Console utility that works like a breakpoint on the function's first line, which is handy when you don't know which file defines it. `undebug(fn)` removes it.",
        },
        {
          id: "tooling-devtools-q12",
          prompt: "A request's Timing tab shows most of its time under \"Waiting for server response\". What does that phase measure?",
          options: [
            "The time between sending the request and receiving the first byte of the response",
            "The time spent downloading the response body",
            "Time spent queued behind other requests to the same host",
            "DNS lookup and TLS negotiation",
          ],
          correctIndex: 0,
          explanation:
            "This is time to first byte: network latency plus server processing. A large value points at the backend or its distance from the user, not at payload size (Content Download) or connection limits (Queueing/Stalled).",
        },
      ],
    },
  ],
} satisfies Module;
