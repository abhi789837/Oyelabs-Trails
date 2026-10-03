import type { PracticalOutcomeSeed } from "../../../../shared/goals";

/**
 * v4.3 practical outcomes for the engineering department ("practical cases").
 *
 * Each outcome is something an Oyelabs engineer can be seen doing on a client project, with a
 * capstone that proves it: a simulated terminal (`terminal`) for Git, shell, Docker and deploy
 * work, a judgement task (`scenario`, `spot`, `rank`, `write`, `sim`, `categorize`) for review and
 * decision work, or an existing course topic whose code challenge already proves the outcome.
 *
 * Terminal `accept` entries are JS regex sources tested against the command with whitespace
 * collapsed and trimmed, case-sensitive. Several outcomes form progressions on the same skills
 * (Git L1 → L4, Docker L2 → L3, Laravel L2 → L4, AI-driven L1 → L5) so next-level suggestions exist.
 */

const r = String.raw;

/** Common command fragments. */
const NPM_TEST = r`^(npm (test|t|run test)|npx vitest run|pnpm test|yarn test)$`;
const GIT_COMMIT_MSG = r`^git commit (-m|--message) ["'].{6,}["']$`;
const GH_PR_CREATE = r`^gh pr create( .+)?$`;

const topic = (title: string, topicId: string) => ({ kind: "topic" as const, title, topicId });

export default [
  // -------------------------------------------------------------------------
  // Git & collaboration (L1 → L4 progression)
  // -------------------------------------------------------------------------
  {
    id: "eng-git-branch-commit-push",
    departmentId: "engineering",
    title: "Create a feature branch, commit and push your work",
    statement: "Can move work onto a correctly named feature branch, stage only the intended files, commit with a clear message and push the branch to the remote.",
    skillIds: ["eng-git", "eng-github-flow"],
    level: 1,
    aliases: ["git basics", "feature branch", "git commit", "git push", "branching"],
    capstone: {
      kind: "task",
      title: "Move a fix off main and push it on a feature branch",
      task: {
        kind: "terminal",
        title: "Move a fix off main and push it on a feature branch",
        prompt:
          "You fixed the cart badge count in the client's shop app, but you made the change directly on main. Team rule: nothing is committed to main directly. Move the uncommitted change onto a new branch called feature/cart-badge, stage only the changed component, commit it with a clear message and push the branch to origin so you can open a pull request.",
        cwd: "~/shop-web (main)",
        intro:
          "$ git status\nOn branch main\nYour branch is up to date with 'origin/main'.\n\nChanges not staged for commit:\n  (use \"git add <file>...\" to update what will be committed)\n  (use \"git restore <file>...\" to discard changes in working directory)\n\tmodified:   src/components/CartBadge.tsx\n\nno changes added to commit (use \"git add\" and/or \"git commit -a\")",
        files: [],
        steps: [
          {
            id: "branch",
            goal: "Create and switch to the new branch feature/cart-badge (uncommitted changes come with you).",
            accept: [r`^git (switch -c|switch --create|checkout -b) feature/cart-badge$`],
            output: "Switched to a new branch 'feature/cart-badge'",
          },
          {
            id: "add",
            goal: "Stage the changed component.",
            accept: [r`^git add (src/components/CartBadge\.tsx|src/components/?|\.|-A|--all|-u)$`],
            output: "$ git status -s\nM  src/components/CartBadge.tsx",
          },
          {
            id: "commit",
            goal: "Commit with a message that says what changed.",
            accept: [GIT_COMMIT_MSG],
            output: "[feature/cart-badge 3f9c2a1] Fix cart badge count after item removal\n 1 file changed, 4 insertions(+), 2 deletions(-)",
          },
          {
            id: "push",
            goal: "Push the branch to origin and set its upstream.",
            accept: [r`^git push (-u|--set-upstream) origin (feature/cart-badge|HEAD)$`, r`^git push origin (feature/cart-badge|HEAD)$`],
            output:
              "Enumerating objects: 9, done.\nWriting objects: 100% (5/5), 612 bytes | 612.00 KiB/s, done.\nremote:\nremote: Create a pull request for 'feature/cart-badge' on GitHub by visiting:\nremote:      https://github.com/oyelabs/shop-web/pull/new/feature/cart-badge\nremote:\nTo github.com:oyelabs/shop-web.git\n * [new branch]      feature/cart-badge -> feature/cart-badge\nbranch 'feature/cart-badge' set up to track 'origin/feature/cart-badge'.",
          },
        ],
        fileChecks: [],
        explanation:
          "`git switch -c feature/cart-badge` (or `git checkout -b`) creates the branch at the current commit and carries uncommitted changes with it, so main stays clean. Stage only what belongs to the change, write a message that says what and why, and push with `-u` so later `git push`/`git pull` know the upstream. Committing straight to main skips review and CI, which on a client project is how regressions reach production.",
      },
    },
  },
  {
    id: "eng-git-merge-conflict-pr",
    departmentId: "engineering",
    title: "Resolve a merge conflict and open a clean PR",
    statement: "Can bring the latest main into a feature branch, resolve a content conflict by keeping both sides' intent, verify with tests and open a pull request with no conflict markers left.",
    skillIds: ["eng-git", "eng-github-flow"],
    level: 2,
    aliases: ["merge conflicts", "git pr", "resolve conflict", "pull request", "conflict markers"],
    capstone: {
      kind: "task",
      title: "Resolve a conflict in cart.js and open the PR",
      task: {
        kind: "terminal",
        title: "Resolve a conflict in cart.js and open the PR",
        prompt:
          "You are on feature/cart, which adds discount support to cartTotal(). A teammate merged 18% tax into main. You pulled main and got a conflict in src/cart.js. Resolve it so the total applies your discount first, then adds tax on the discounted amount (rounded to 2 decimals), and never goes below 0. Then finish the merge, run the tests, push, and open a pull request against main with the GitHub CLI.",
        cwd: "~/shop-api (feature/cart)",
        intro:
          "$ git pull origin main\nFrom github.com:oyelabs/shop-api\n * branch            main       -> FETCH_HEAD\nAuto-merging src/cart.js\nCONFLICT (content): Merge conflict in src/cart.js\nAutomatic merge failed; fix conflicts and then commit the result.\n\n$ git status\nOn branch feature/cart\nYou have unmerged paths.\n  (fix conflicts and run \"git commit\")\n\nUnmerged paths:\n  (use \"git add <file>...\" to mark resolution)\n\tboth modified:   src/cart.js",
        files: [
          {
            path: "src/cart.js",
            content:
              "export function cartTotal(items, discount = 0) {\n  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);\n<<<<<<< HEAD\n  const discounted = subtotal - discount;\n  return Math.max(discounted, 0);\n=======\n  const tax = Math.round(subtotal * 0.18 * 100) / 100;\n  return subtotal + tax;\n>>>>>>> origin/main\n}\n",
          },
        ],
        steps: [
          {
            id: "add",
            goal: "After editing the file, mark the conflict as resolved by staging it.",
            accept: [r`^git add (src/cart\.js|src/?|\.|-A|--all|-u)$`],
            output: "$ git status -s\nM  src/cart.js",
          },
          {
            id: "commit",
            goal: "Conclude the merge.",
            accept: [r`^git commit$`, r`^git commit --no-edit$`, GIT_COMMIT_MSG, r`^git merge --continue$`],
            output: "[feature/cart 7b21e4d] Merge branch 'main' of github.com:oyelabs/shop-api into feature/cart",
          },
          {
            id: "test",
            goal: "Run the test suite before pushing.",
            accept: [NPM_TEST],
            output: " ✓ test/cart.test.js (6 tests) 14ms\n\n Test Files  1 passed (1)\n      Tests  6 passed (6)",
          },
          {
            id: "push",
            goal: "Push the branch.",
            accept: [r`^git push( -u| --set-upstream)?( origin( feature/cart| HEAD)?)?$`],
            output: "To github.com:oyelabs/shop-api.git\n   a41c09e..7b21e4d  feature/cart -> feature/cart",
          },
          {
            id: "pr",
            goal: "Open a pull request against main with gh.",
            accept: [GH_PR_CREATE],
            output: "Creating pull request for feature/cart into main in oyelabs/shop-api\n\nhttps://github.com/oyelabs/shop-api/pull/214",
          },
        ],
        fileChecks: [{ path: "src/cart.js", mustContain: ["discount", "Math.round(", "0.18", "Math.max("], mustNotContain: ["<<<<<<<", "=======", ">>>>>>>"] }],
        explanation:
          "A conflict means both sides changed the same lines; the right answer is rarely 'take mine' or 'take theirs'. Here both intents survive: compute the discounted amount, tax it, and clamp at 0 (e.g. `const discounted = Math.max(subtotal - discount, 0); const tax = Math.round(discounted * 0.18 * 100) / 100; return discounted + tax;`). Delete every marker line, stage the file to mark it resolved, conclude the merge, and run the tests before pushing so the PR reviewers see a green build, not your conflict resolution bug.",
      },
    },
  },
  {
    id: "eng-git-rebase-cleanup",
    departmentId: "engineering",
    title: "Clean up a branch's history with interactive rebase before review",
    statement: "Can rebase a feature branch onto the latest main, squash wip and fix-up commits into meaningful ones without losing work, and update the open PR safely with --force-with-lease.",
    skillIds: ["eng-git-advanced", "eng-github-flow"],
    level: 3,
    aliases: ["git rebase", "interactive rebase", "squash commits", "clean history", "force with lease"],
    capstone: {
      kind: "task",
      title: "Squash a messy branch into two commits on top of main",
      task: {
        kind: "terminal",
        title: "Squash a messy branch into two commits on top of main",
        prompt:
          "Your feature/search PR has five commits, three of them noise ('wip', 'fix typo', 'oops'). The reviewer asked for a clean history rebased on the latest main. Fetch, start an interactive rebase onto origin/main, and edit the rebase todo so only two commits remain: 'Add search endpoint' (with the wip and typo fix folded in) and 'Add search UI' (with the missing import folded in). Keep every change: fold, do not drop. Then check the log and update the remote branch without clobbering anything a teammate may have pushed.",
        cwd: "~/shop-api (feature/search)",
        intro:
          "$ git log --oneline origin/main..HEAD\n2f8a6e5 (HEAD -> feature/search, origin/feature/search) oops forgot import\nc7b0d13 Add search UI\n9e1f4a2 fix typo in search query\n5d2b7c0 wip\na1c3e9f Add search endpoint",
        files: [
          {
            path: ".git/rebase-merge/git-rebase-todo",
            content:
              "pick a1c3e9f Add search endpoint\npick 5d2b7c0 wip\npick 9e1f4a2 fix typo in search query\npick c7b0d13 Add search UI\npick 2f8a6e5 oops forgot import\n\n# Commands:\n# p, pick <commit> = use commit\n# s, squash <commit> = use commit, but meld into previous commit\n# f, fixup <commit> = like squash, but discard this commit's log message\n# d, drop <commit> = remove commit\n",
          },
        ],
        steps: [
          {
            id: "fetch",
            goal: "Get the latest main from the remote first.",
            accept: [r`^git fetch( origin)?( main)?$`, r`^git fetch --all$`],
            output: "From github.com:oyelabs/shop-api\n   e02b1c4..88d5f31  main       -> origin/main",
          },
          {
            id: "rebase",
            goal: "Start an interactive rebase onto origin/main (then edit the todo file).",
            accept: [r`^git rebase (-i|--interactive) origin/main$`, r`^git rebase origin/main (-i|--interactive)$`],
            output: "hint: Waiting for your editor to close the file... (edit .git/rebase-merge/git-rebase-todo, then save)\nSuccessfully rebased and updated refs/heads/feature/search.",
          },
          {
            id: "log",
            goal: "Check the result.",
            accept: [r`^git log --oneline( -n ?\d+| -\d+)?( origin/main\.\.HEAD| origin/main\.\.\.HEAD)?$`, r`^git log( -\d+)?$`],
            output: "4b7d2e0 (HEAD -> feature/search) Add search UI\n61fa9c3 Add search endpoint\n88d5f31 (origin/main, main) Bump axios to 1.7.4",
          },
          {
            id: "push",
            goal: "Update the remote branch, refusing if someone else pushed to it.",
            accept: [r`^git push (--force-with-lease|--force-with-lease=feature/search)( origin( feature/search| HEAD)?)?$`, r`^git push origin (feature/search|HEAD) --force-with-lease$`],
            output: "To github.com:oyelabs/shop-api.git\n + 2f8a6e5...4b7d2e0 feature/search -> feature/search (forced update)",
          },
        ],
        fileChecks: [
          {
            path: ".git/rebase-merge/git-rebase-todo",
            mustContain: ["a1c3e9f", "5d2b7c0", "9e1f4a2", "c7b0d13", "2f8a6e5"],
            mustNotContain: ["pick 5d2b7c0", "pick 9e1f4a2", "pick 2f8a6e5", "drop", "d 5d2b7c0", "d 9e1f4a2", "d 2f8a6e5"],
          },
        ],
        explanation:
          "Keep `pick` on the two real commits and change the noise to `fixup` (or `squash`) so their changes are melded into the commit above them: wip and the typo fix under 'Add search endpoint', the import fix under 'Add search UI' (moving its line under c7b0d13 if needed). Dropping a line would delete work. Rebasing rewrites the commits, so the push must be forced; `--force-with-lease` refuses if the remote moved since your last fetch, whereas plain `--force` silently overwrites a teammate's commits.",
      },
    },
  },
  {
    id: "eng-git-reflog-recover",
    departmentId: "engineering",
    title: "Recover lost commits with git reflog",
    statement: "Can find commits lost to a hard reset or bad rebase in the reflog and restore them onto a branch without disturbing the current one.",
    skillIds: ["eng-git-advanced", "eng-git"],
    level: 3,
    aliases: ["git reflog", "recover commits", "undo reset", "lost work git"],
    capstone: {
      kind: "task",
      title: "Rescue two commits lost to git reset --hard",
      task: {
        kind: "terminal",
        title: "Rescue two commits lost to git reset --hard",
        prompt:
          "You meant to drop one local commit but ran `git reset --hard HEAD~2`, and the two commits holding the CSV export for the admin reports are gone from the log. They were never pushed. Find them and put them on a new branch called rescue/reports without moving feature/reports, then confirm the commits are there.",
        cwd: "~/admin-panel (feature/reports)",
        intro: "$ git reset --hard HEAD~2\nHEAD is now at 41b9e02 Add reports page shell\n\n$ git log --oneline -3\n41b9e02 (HEAD -> feature/reports) Add reports page shell\n0c7aa31 Add date range filter\n9fd2e18 (origin/main, main) Upgrade to Laravel 11",
        files: [],
        steps: [
          {
            id: "reflog",
            goal: "Look at where HEAD has been.",
            accept: [r`^git reflog( show)?( HEAD)?( -n ?\d+| -\d+)?$`, r`^git log -g( --oneline)?$`],
            output:
              "41b9e02 (HEAD -> feature/reports) HEAD@{0}: reset: moving to HEAD~2\ne93a7f1 HEAD@{1}: commit: Stream CSV export for large reports\n5b0c442 HEAD@{2}: commit: Add CSV export for reports\n41b9e02 (HEAD -> feature/reports) HEAD@{3}: commit: Add reports page shell",
          },
          {
            id: "branch",
            goal: "Create rescue/reports at the last lost commit.",
            accept: [r`^git (switch -c|switch --create|checkout -b|branch) rescue/reports (e93a7f1|HEAD@\{1\}|"HEAD@\{1\}"|'HEAD@\{1\}')$`],
            output: "Switched to a new branch 'rescue/reports'",
          },
          {
            id: "verify",
            goal: "Confirm both lost commits are on rescue/reports.",
            accept: [r`^git log( --oneline)?( -n ?\d+| -\d+)?( rescue/reports)?$`, r`^git log( --oneline)? feature/reports\.\.rescue/reports$`],
            output: "e93a7f1 (rescue/reports) Stream CSV export for large reports\n5b0c442 Add CSV export for reports\n41b9e02 (feature/reports) Add reports page shell",
          },
        ],
        fileChecks: [],
        explanation:
          "A hard reset moves the branch pointer, but the commits stay in the object database and the reflog records every place HEAD has been for ~90 days. `git reflog` shows `e93a7f1` (HEAD@{1}) as the tip before the reset; `git branch rescue/reports e93a7f1` (or `switch -c`) gives it a name so it can no longer be garbage-collected. Recovery only works for committed work: uncommitted changes wiped by `reset --hard` are gone, which is why you commit early on a branch.",
      },
    },
  },
  {
    id: "eng-git-bisect-regression",
    departmentId: "engineering",
    title: "Find the commit that broke a feature with git bisect",
    statement: "Can run git bisect between a known good tag and a bad HEAD, automate it with a failing test and name the offending commit.",
    skillIds: ["eng-git-advanced", "eng-debugging"],
    level: 4,
    aliases: ["git bisect", "find regression", "which commit broke"],
    capstone: {
      kind: "task",
      title: "Bisect a cart-total regression",
      task: {
        kind: "terminal",
        title: "Bisect a cart-total regression",
        prompt:
          "The checkout total is wrong on main, and it was correct in the v3.1.0 release. There are about 140 commits in between. `npm test -- cart` fails on main and passes on v3.1.0. Use git bisect to find the bad commit: start a session, mark the current commit bad and v3.1.0 good (as separate commands), let the test decide automatically, inspect the culprit, and end the session.",
        cwd: "~/shop-web (main)",
        intro: "$ npm test -- cart\n FAIL  test/cart.test.ts > cartTotal > applies percentage coupons\n AssertionError: expected 90.0 to be 81.0\n\n Test Files  1 failed (1)",
        files: [],
        steps: [
          { id: "start", goal: "Start a bisect session.", accept: [r`^git bisect start$`], output: "status: waiting for both good and bad commits" },
          { id: "bad", goal: "Mark the current commit as bad.", accept: [r`^git bisect bad( HEAD| main)?$`], output: "status: waiting for good commit(s), bad commit known" },
          {
            id: "good",
            goal: "Mark v3.1.0 as good.",
            accept: [r`^git bisect good v3\.1\.0$`],
            output: "Bisecting: 70 revisions left to test after this (roughly 6 steps)\n[c19e0d7] Refactor price helpers into utils/money",
          },
          {
            id: "run",
            goal: "Let the failing test drive the bisect.",
            accept: [r`^git bisect run (npm (test|t|run test) -- cart|npx vitest run cart|npm (test|t|run test) cart)$`],
            output:
              "running 'npm' 'test' '--' 'cart'\n...\n7d4e2b9 is the first bad commit\ncommit 7d4e2b9\nAuthor: Ravi K <ravi@oyelabs.com>\n    Apply coupons after tax to match invoice\n\n src/utils/coupon.ts | 6 +++---\nbisect found first bad commit",
          },
          { id: "show", goal: "Inspect what the culprit changed.", accept: [r`^git show( --stat)? 7d4e2b9$`, r`^git bisect (view|visualize|log)$`], output: "-  return applyCoupon(subtotal, coupon) * (1 + tax);\n+  return applyCoupon(subtotal * (1 + tax), coupon.flatAmount ?? 0);" },
          { id: "reset", goal: "End the bisect session and return to main.", accept: [r`^git bisect reset$`], output: "Previous HEAD position was 7d4e2b9 Apply coupons after tax to match invoice\nSwitched to branch 'main'" },
        ],
        fileChecks: [],
        explanation:
          "Bisect is a binary search over history: 140 commits take about 8 checks instead of 140. `git bisect run <cmd>` automates it, treating exit code 0 as good and 1–127 (except 125) as bad, so a focused failing test is the ideal oracle. Always `git bisect reset` afterwards, otherwise you are left on a detached HEAD in the middle of history.",
      },
    },
  },
  {
    id: "eng-git-release-hotfix",
    departmentId: "engineering",
    title: "Ship a hotfix on a release branch, tag it and let CI deploy",
    statement: "Can cherry-pick a fix from main onto a release branch, verify it, create an annotated version tag and push branch and tag so the CI release pipeline deploys it.",
    skillIds: ["eng-git-advanced", "eng-ci-cd", "eng-github-flow"],
    level: 4,
    aliases: ["release branch", "hotfix", "git tag", "cherry pick", "release process"],
    capstone: {
      kind: "task",
      title: "Hotfix v2.4.1 from main onto release/2.4",
      task: {
        kind: "terminal",
        title: "Hotfix v2.4.1 from main onto release/2.4",
        prompt:
          "Production runs v2.4.0, cut from release/2.4. Main has moved on with unreleased features. A critical fix for double-charged refunds was merged to main as commit 8c1d2e4. Ship it as v2.4.1 without shipping anything else from main: switch to the release branch, update it, cherry-pick the fix with a reference to the original commit, run the tests, create an annotated tag v2.4.1, and push the branch and the tag (the CI release workflow deploys on tags matching v*).",
        cwd: "~/payments-api (main)",
        intro: "$ git log --oneline -1 8c1d2e4\n8c1d2e4 Fix double refund when webhook is retried\n\n$ git branch -r\n  origin/main\n  origin/release/2.3\n  origin/release/2.4",
        files: [],
        steps: [
          { id: "switch", goal: "Switch to the release branch.", accept: [r`^git (switch|checkout) release/2\.4$`], output: "branch 'release/2.4' set up to track 'origin/release/2.4'.\nSwitched to a new branch 'release/2.4'" },
          { id: "pull", goal: "Make sure the release branch is current.", accept: [r`^git pull( --ff-only| --rebase)?( origin release/2\.4)?$`], output: "Already up to date." },
          {
            id: "pick",
            goal: "Cherry-pick only the fix, recording where it came from.",
            accept: [r`^git cherry-pick -x 8c1d2e4$`, r`^git cherry-pick 8c1d2e4 -x$`],
            output: "[release/2.4 b5e90a3] Fix double refund when webhook is retried\n Date: Tue Sep 30 11:02:14 2026 +0530\n 2 files changed, 31 insertions(+), 4 deletions(-)",
          },
          { id: "test", goal: "Run the tests on the release branch.", accept: [NPM_TEST], output: " Test Files  42 passed (42)\n      Tests  318 passed (318)" },
          {
            id: "tag",
            goal: "Create an annotated tag v2.4.1.",
            accept: [r`^git tag (-a|-s) v2\.4\.1 (-m|--message) ["'].+["']$`, r`^git tag (-a|-s) v2\.4\.1$`],
            output: "$ git tag -n1 v2.4.1\nv2.4.1          Hotfix: double refund on webhook retry",
          },
          {
            id: "push",
            goal: "Push the branch and the tag.",
            accept: [r`^git push --follow-tags( origin( release/2\.4)?)?$`, r`^git push origin release/2\.4 v2\.4\.1$`, r`^git push origin v2\.4\.1$`, r`^git push (origin )?--tags$`, r`^git push( origin release/2\.4)?$`],
            output: "To github.com:oyelabs/payments-api.git\n   41aa7c2..b5e90a3  release/2.4 -> release/2.4\n * [new tag]         v2.4.1 -> v2.4.1\n\nGitHub Actions: release.yml triggered for v2.4.1",
          },
        ],
        fileChecks: [],
        explanation:
          "Merging main into the release branch would ship every unreleased feature; cherry-picking copies only the fix, and `-x` appends '(cherry picked from commit 8c1d2e4)' so the trail is auditable. Annotated tags carry an author, date and message and are what `git describe` and most release tooling expect. `git push --follow-tags` pushes the branch plus the annotated tags reachable from it; a release that depends on a tag trigger should never rely on someone remembering a second push.",
      },
    },
  },
  {
    id: "eng-git-worktrees-parallel",
    departmentId: "engineering",
    title: "Run parallel feature work in git worktrees",
    statement: "Can create separate git worktrees for two branches so two developers or AI agents work in parallel without touching each other's files, then merge and clean them up.",
    skillIds: ["eng-git-advanced", "eng-ai-claude-code"],
    level: 4,
    aliases: ["git worktree", "parallel agents", "multi-agent git", "worktrees"],
    capstone: {
      kind: "task",
      title: "Give two Claude Code sessions their own worktrees",
      task: {
        kind: "terminal",
        title: "Give two Claude Code sessions their own worktrees",
        prompt:
          "You want two Claude Code sessions working in parallel on the shop API: one on product search (branch feature/search) and one on invoice PDFs (branch feature/invoices). Running both in the same folder would make them overwrite each other's files and fight over the index. Create a worktree for each new branch next to the repo (../shop-api-search and ../shop-api-invoices), list the worktrees, and after the search session finishes, merge feature/search into main, run the tests and remove its worktree.",
        cwd: "~/shop-api (main)",
        intro: "$ git status\nOn branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean",
        files: [],
        steps: [
          {
            id: "wt-search",
            goal: "Create ../shop-api-search on a new branch feature/search.",
            accept: [r`^git worktree add (-b feature/search \.\./shop-api-search|\.\./shop-api-search -b feature/search)( main)?$`],
            output: "Preparing worktree (new branch 'feature/search')\nHEAD is now at 88d5f31 Bump axios to 1.7.4",
          },
          {
            id: "wt-invoices",
            goal: "Create ../shop-api-invoices on a new branch feature/invoices.",
            accept: [r`^git worktree add (-b feature/invoices \.\./shop-api-invoices|\.\./shop-api-invoices -b feature/invoices)( main)?$`],
            output: "Preparing worktree (new branch 'feature/invoices')\nHEAD is now at 88d5f31 Bump axios to 1.7.4",
          },
          {
            id: "list",
            goal: "List the worktrees.",
            accept: [r`^git worktree list$`],
            output:
              "/home/dev/shop-api            88d5f31 [main]\n/home/dev/shop-api-search     88d5f31 [feature/search]\n/home/dev/shop-api-invoices   88d5f31 [feature/invoices]\n\n(...later: the search session has committed 3 commits on feature/search)",
          },
          {
            id: "merge",
            goal: "Merge feature/search into main.",
            accept: [r`^git merge( --no-ff| --ff-only| --squash)? feature/search$`],
            output: "Merge made by the 'ort' strategy.\n src/search/searchService.ts | 84 ++++++++\n src/routes/search.ts        | 27 +++\n 3 files changed, 139 insertions(+)",
          },
          { id: "test", goal: "Run the tests on main.", accept: [NPM_TEST], output: " Test Files  27 passed (27)\n      Tests  204 passed (204)" },
          {
            id: "remove",
            goal: "Remove the search worktree.",
            accept: [r`^git worktree remove \.\./shop-api-search$`, r`^git worktree remove /home/dev/shop-api-search$`],
            output: "$ git worktree list\n/home/dev/shop-api            a90c1f2 [main]\n/home/dev/shop-api-invoices   88d5f31 [feature/invoices]",
          },
        ],
        fileChecks: [],
        explanation:
          "A worktree is a second working directory attached to the same repository, checked out on its own branch, so parallel agents (or people) get isolated files and their own index while sharing history. Each session runs in its own folder and commits to its own branch; integration happens through normal merges and tests on main. Remove worktrees when done (`git worktree remove`), otherwise branches stay locked as 'checked out elsewhere'.",
      },
    },
  },
  {
    id: "eng-pr-review",
    departmentId: "engineering",
    title: "Review a teammate's pull request and request the right changes",
    statement: "Can review a pull request diff, flag the lines that introduce bugs, security holes or missing tests, and decide whether to approve or request changes.",
    skillIds: ["eng-code-review", "eng-github-flow"],
    level: 2,
    aliases: ["code review", "pr review", "review pull request", "github review"],
    capstone: {
      kind: "task",
      title: "Review a password-reset PR",
      task: {
        kind: "sim",
        app: "github-pr",
        title: "PR #318: Add password reset endpoint",
        prompt: "Review the changed lines of this Express pull request. Flag every line that should block the merge, then answer the question.",
        columns: ["File", "Line", "Change"],
        rows: [
          { id: "r1", cells: ["src/routes/auth.js", "41", "router.post('/password/forgot', rateLimit({ windowMs: 15 * 60_000, max: 5 }), forgotPassword);"], issue: null },
          { id: "r2", cells: ["src/auth/reset.js", "12", "const token = Math.random().toString(36).slice(2);"], issue: "Math.random is not cryptographically secure; reset tokens must come from crypto.randomBytes." },
          { id: "r3", cells: ["src/auth/reset.js", "13", "await db.resetTokens.insert({ userId: user.id, token, expiresAt: Date.now() + 60 * 60_000 });"], issue: "The token is stored in plain text; store a hash so a DB leak does not allow account takeover." },
          { id: "r4", cells: ["src/auth/reset.js", "19", "if (!user) return res.status(404).json({ error: 'No account with that email' });"], issue: "Reveals which emails have accounts (user enumeration); always return the same 202 response." },
          { id: "r5", cells: ["src/auth/reset.js", "24", "await mailer.send(user.email, 'Reset your password', resetEmail(token));"], issue: null },
          { id: "r6", cells: ["src/auth/reset.js", "25", "return res.status(202).json({ message: 'If the account exists, we sent an email.' });"], issue: null },
          { id: "r7", cells: ["src/auth/reset.js", "38", "const user = await users.update(row.userId, { passwordHash: await bcrypt.hash(password, 12) });"], issue: null },
          { id: "r8", cells: ["src/auth/reset.js", "39", "// TODO: delete the used token"], issue: "The token is never invalidated after use, so it can be replayed until it expires." },
          { id: "r9", cells: ["test/auth.test.js", "-", "(no new tests in this PR)"], issue: null },
          { id: "r10", cells: ["src/auth/reset.js", "36", "const row = await db.resetTokens.findOne({ token: hash(req.body.token), expiresAt: { $gt: Date.now() } });"], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "What should the review outcome be?",
            options: ["Approve: the issues can be fixed in a follow-up PR", "Comment only and let the author decide", "Request changes: the token and enumeration issues are security defects that must be fixed (with tests) before merge", "Close the PR and rewrite it yourself"],
            correctIndex: 2,
            explanation: "Predictable, plain-text, replayable reset tokens are account-takeover bugs. Security defects block the merge; ask for fixes plus tests that cover token reuse and expiry.",
          },
        ],
      },
    },
  },

  // -------------------------------------------------------------------------
  // Frontend
  // -------------------------------------------------------------------------
  {
    id: "eng-css-specificity-fix",
    departmentId: "engineering",
    title: "Fix a styling bug caused by CSS specificity",
    statement: "Can calculate selector specificity to explain why a style is overridden and fix it without resorting to !important.",
    skillIds: ["eng-css", "eng-browser-devtools"],
    level: 1,
    aliases: ["css specificity", "style not applying", "css override"],
    capstone: topic("Compute specificity like the browser does", "css-selectors-specificity"),
  },
  {
    id: "eng-js-transform-api-data",
    departmentId: "engineering",
    title: "Transform API data with map, filter and reduce",
    statement: "Can turn a raw API response into the shape a screen needs using map, filter and reduce, without mutating the source data.",
    skillIds: ["eng-javascript", "eng-js-functional"],
    level: 1,
    aliases: ["map filter reduce", "array methods", "transform json", "data shaping"],
    capstone: topic("Implement reduce-based transformations", "js-array-methods-map-filter-reduce"),
  },
  {
    id: "eng-responsive-layout",
    departmentId: "engineering",
    title: "Make a page layout responsive across phone, tablet and desktop",
    statement: "Can write mobile-first media queries that switch a layout at the right breakpoints and predict which rules apply at a given viewport.",
    skillIds: ["eng-css-responsive", "eng-css-layout"],
    level: 2,
    aliases: ["responsive design", "media queries", "mobile first", "breakpoints"],
    capstone: topic("Evaluate media queries like the browser", "css-responsive-media-queries"),
  },
  {
    id: "eng-react-validated-form",
    departmentId: "engineering",
    title: "Build a validated form in React",
    statement: "Can build a controlled React form with field-level validation, error messages and a disabled submit until the form is valid.",
    skillIds: ["eng-react-fundamentals", "eng-react-forms"],
    level: 2,
    aliases: ["react forms", "form validation", "controlled inputs"],
    capstone: topic("Controlled form state and validation", "react-controlled-forms"),
  },
  {
    id: "eng-debounced-search",
    departmentId: "engineering",
    title: "Add a debounced search box that doesn't spam the API",
    statement: "Can implement debounce and throttle correctly and choose the right one for search-as-you-type, scroll and resize handlers.",
    skillIds: ["eng-js-patterns", "eng-javascript"],
    level: 2,
    aliases: ["debounce", "throttle", "search as you type", "autocomplete"],
    capstone: topic("Implement debounce and throttle", "js-debounce-throttle"),
  },
  {
    id: "eng-parallel-requests",
    departmentId: "engineering",
    title: "Load several APIs in parallel with proper error handling",
    statement: "Can fire independent requests in parallel and pick Promise.all, allSettled, race or any so one failure is handled the way the screen needs.",
    skillIds: ["eng-js-async", "eng-js-fetch"],
    level: 2,
    aliases: ["promise all", "parallel api calls", "async await", "allSettled"],
    capstone: topic("Promise combinators under failure", "js-promise-combinators"),
  },
  {
    id: "eng-ts-typed-api-response",
    departmentId: "engineering",
    title: "Type and validate an API response safely in TypeScript",
    statement: "Can model an API response with union types and narrow unknown JSON with type guards instead of casting with `as`.",
    skillIds: ["eng-typescript", "eng-ts-narrowing"],
    level: 2,
    aliases: ["typescript types", "type guards", "narrowing", "unknown json"],
    capstone: topic("Validate unknown data with type guards", "ts-narrowing-type-guards"),
  },
  {
    id: "eng-react-custom-hook",
    departmentId: "engineering",
    title: "Extract reusable logic into a custom React hook",
    statement: "Can extract data-loading logic into a custom hook that handles loading, error, cancellation and stale responses.",
    skillIds: ["eng-react-hooks", "eng-react-patterns"],
    level: 3,
    aliases: ["custom hooks", "useFetch", "react hooks"],
    capstone: topic("Build a race-safe useFetch hook", "react-adv-custom-hooks"),
  },
  {
    id: "eng-react-server-state",
    departmentId: "engineering",
    title: "Manage server data with TanStack Query caching and invalidation",
    statement: "Can fetch, cache and mutate server data with TanStack Query and invalidate the right queries after a mutation so lists stay correct.",
    skillIds: ["eng-react-data-fetching", "eng-react-state-management"],
    level: 3,
    aliases: ["react query", "tanstack query", "cache invalidation frontend", "server state"],
    capstone: topic("Model query caching and invalidation", "react-eco-tanstack-query"),
  },
  {
    id: "eng-a11y-fix-form",
    departmentId: "engineering",
    title: "Find and fix accessibility issues in a signup form",
    statement: "Can audit a form's markup for missing labels, keyboard traps, colour-only errors and unannounced validation, and name the fix for each.",
    skillIds: ["eng-web-accessibility", "eng-html-forms"],
    level: 3,
    aliases: ["accessibility", "a11y audit", "wcag", "screen reader", "aria"],
    capstone: {
      kind: "task",
      title: "Spot the accessibility defects in a signup form",
      task: {
        kind: "spot",
        prompt: "This is the markup of a client's signup form, line by line. Mark every line that fails accessibility (WCAG 2.2 AA) for keyboard or screen-reader users.",
        segments: [
          { id: "s1", text: "<form action=\"/signup\" method=\"post\" novalidate>", issue: null },
          { id: "s2", text: "<label for=\"email\">Email</label>", issue: null },
          { id: "s3", text: "<input id=\"email\" type=\"email\" name=\"email\" autocomplete=\"email\" aria-describedby=\"email-error\">", issue: null },
          { id: "s4", text: "<input type=\"password\" name=\"password\" placeholder=\"Password\">", issue: "No label: a placeholder is not an accessible name and disappears while typing." },
          { id: "s5", text: "<p id=\"email-error\" role=\"alert\">Enter a valid email address.</p>", issue: null },
          { id: "s6", text: "<span style=\"color:red\">*</span> Required fields are shown in red", issue: "Required state is conveyed by colour only; mark it in text or with the required attribute." },
          { id: "s7", text: "<div class=\"btn\" onclick=\"submitForm()\">Create account</div>", issue: "A clickable div is not focusable or operable by keyboard; use a <button type=\"submit\">." },
          { id: "s8", text: "<input type=\"checkbox\" id=\"terms\" name=\"terms\"> <label for=\"terms\">I accept the terms</label>", issue: null },
          { id: "s9", text: "<img src=\"/captcha.png\">", issue: "Missing alt text and no non-visual alternative for the captcha." },
          { id: "s10", text: "<a href=\"/login\">Already have an account? Log in</a>", issue: null },
          { id: "s11", text: "</form>", issue: null },
        ],
        askExplanation: true,
      },
    },
  },
  {
    id: "eng-react-render-performance",
    departmentId: "engineering",
    title: "Find and fix unnecessary re-renders in a React screen",
    statement: "Can predict when React re-renders a component and use React.memo, stable props and memoised callbacks only where they cut real work.",
    skillIds: ["eng-react-performance", "eng-react-hooks"],
    level: 4,
    aliases: ["react performance", "re-renders", "react memo", "usememo usecallback"],
    capstone: topic("Model React.memo bail-outs", "react-adv-react-memo"),
  },
  {
    id: "eng-fix-slow-lcp",
    departmentId: "engineering",
    title: "Diagnose and fix a poor LCP on a landing page",
    statement: "Can read a Lighthouse/field report, identify what delays the Largest Contentful Paint and choose the fixes that move it most.",
    skillIds: ["eng-web-performance", "eng-browser-devtools", "eng-nextjs-seo"],
    level: 4,
    aliases: ["core web vitals", "lcp", "page speed", "lighthouse", "slow landing page"],
    capstone: {
      kind: "task",
      title: "Bring a 4.8 s LCP under 2.5 s",
      task: {
        kind: "scenario",
        prompt:
          "A client's marketing landing page (Next.js, served from a single VPS in Frankfurt to users in the US) has a field LCP of 4.8 s at p75 on mobile. Lighthouse shows: LCP element is the hero <img> (a 2.1 MB PNG, 2400 px wide) that is loaded via a CSS background set by a client component after hydration; TTFB is 1.2 s from the US; 380 KB of render-blocking third-party scripts (chat widget, two analytics tags) load in <head>; CLS is 0.02.",
        steps: [
          {
            id: "a",
            question: "Which single change most directly attacks the biggest part of this LCP?",
            options: [
              "Defer the chat widget",
              "Render the hero as a real <img> (next/image) in the server HTML with priority/fetchpriority=high and a modern, correctly sized format",
              "Add a skeleton loader for the hero",
              "Lower CLS further by reserving space",
            ],
            correctIndex: 1,
            explanation: "The browser cannot discover a background image set by JS until after hydration. Putting the image in the HTML with high priority and serving an AVIF/WebP at the displayed size removes both the discovery delay and most of the download time.",
          },
          {
            id: "b",
            question: "With the hero fixed, field LCP is 3.1 s. TTFB from the US is still 1.2 s. What next?",
            options: [
              "Cache the statically generated page at a CDN edge close to US users (or move to static/ISR rendering behind a CDN)",
              "Increase the VPS RAM",
              "Minify the CSS",
              "Preload all fonts",
            ],
            correctIndex: 0,
            explanation: "Every millisecond of TTFB is added to LCP. A marketing page is cacheable, so serving it from an edge near users cuts round-trips from a single region far more than any server tuning.",
          },
          {
            id: "c",
            question: "Marketing insists the chat widget and both analytics tags stay. How do you load them?",
            options: [
              "Keep them in <head> but add async to the chat widget only",
              "Load them after the page is interactive (e.g. next/script with afterInteractive/lazyOnload) and drop the duplicate analytics tag if one can be replaced by server-side events",
              "Inline all three scripts into the HTML",
              "Move them into a service worker",
            ],
            correctIndex: 1,
            explanation: "Third-party scripts in <head> block rendering and compete for bandwidth with the LCP image. Loading them after interactivity keeps the features without hurting LCP; fewer tags is always cheaper.",
          },
        ],
      },
    },
  },
  {
    id: "eng-nextjs-seo-metadata",
    departmentId: "engineering",
    title: "Set up SEO metadata for a Next.js site",
    statement: "Can configure static and dynamic metadata, canonical URLs and Open Graph tags in the App Router and predict which value wins in nested layouts.",
    skillIds: ["eng-nextjs-seo", "eng-nextjs-app-router"],
    level: 3,
    aliases: ["nextjs seo", "metadata", "open graph", "generateMetadata"],
    capstone: topic("Resolve route metadata like Next.js", "next-metadata-seo"),
  },
  {
    id: "eng-react-ecommerce-capstone",
    departmentId: "engineering",
    title: "Build a working shopping cart for a React storefront",
    statement: "Can implement cart state for a storefront (add, update quantity, remove, totals, persistence) with correct edge cases for stock and coupons.",
    skillIds: ["eng-react-state-management", "eng-react-fundamentals", "eng-typescript"],
    level: 3,
    aliases: ["shopping cart", "ecommerce frontend", "cart logic", "react store"],
    capstone: topic("E-commerce capstone: cart engine", "react-capstone-ecommerce"),
  },

  // -------------------------------------------------------------------------
  // Backend: HTTP, Node/Express, APIs, auth
  // -------------------------------------------------------------------------
  {
    id: "eng-curl-inspect-api",
    departmentId: "engineering",
    title: "Call an API with curl and read status codes and headers",
    statement: "Can call REST endpoints with curl, send auth headers and JSON bodies, and explain what each status code and key header in the response means.",
    skillIds: ["eng-http", "eng-rest-api-design"],
    level: 1,
    aliases: ["curl", "http status codes", "test api", "postman alternative"],
    capstone: {
      kind: "task",
      title: "Debug a client's staging API with curl",
      task: {
        kind: "terminal",
        title: "Debug a client's staging API with curl",
        prompt:
          "The mobile team says 'the products API is broken' on staging. Check it yourself with curl. 1) Request product 42 showing the response status and headers. 2) Repeat with the bearer token in $TOKEN. 3) Create a product by POSTing JSON {\"name\":\"Protein Bar\"} to /v1/products with the token. 4) Fix the request based on the error and POST again with a price of 2.5.",
        cwd: "~/projects/fitbook (laptop)",
        intro: "$ echo $TOKEN | cut -c1-20\neyJhbGciOiJIUzI1NiIs",
        files: [],
        steps: [
          {
            id: "get",
            goal: "GET https://staging-api.fitbook.io/v1/products/42 and show the status line and headers (-i or -v).",
            accept: [r`^curl(?=.* (-[a-zA-Z]*[iv][a-zA-Z]*|--include|--verbose)( |$))( -[a-zA-Z]+| --[a-z-]+)* ["']?https://staging-api\.fitbook\.io/v1/products/42["']?$`],
            output: "HTTP/2 401\ncontent-type: application/json\nwww-authenticate: Bearer realm=\"api\", error=\"invalid_token\"\n\n{\"error\":\"unauthenticated\"}",
          },
          {
            id: "auth",
            goal: "Send the same request with an Authorization: Bearer $TOKEN header.",
            accept: [r`^curl .*-H ["']Authorization: Bearer \$TOKEN["'].*products/42["']?$`, r`^curl .*["']?products/42["']? .*-H ["']Authorization: Bearer \$TOKEN["']$`, r`^curl .*--header ["']Authorization: Bearer \$TOKEN["'].*products/42["']?$`],
            output: "HTTP/2 200\ncontent-type: application/json\ncache-control: private, max-age=60\n\n{\"id\":42,\"name\":\"Whey Isolate\",\"price\":39.9}",
          },
          {
            id: "post",
            goal: "POST JSON {\"name\":\"Protein Bar\"} to /v1/products with the token and a JSON content type.",
            accept: [r`^curl (?=.*Authorization: Bearer \$TOKEN)(?=.*(-H ["']Content-Type: application/json["']|--json))(?=.*Protein Bar)(?!.*price).*v1/products["']?( .*)?$`],
            output: "HTTP/2 422\ncontent-type: application/json\n\n{\"errors\":{\"price\":[\"The price field is required.\"]}}",
          },
          {
            id: "post-fixed",
            goal: "POST again including \"price\":2.5.",
            accept: [r`^curl (?=.*Authorization: Bearer \$TOKEN)(?=.*(-H ["']Content-Type: application/json["']|--json))(?=.*Protein Bar)(?=.*"price": ?2\.5).*v1/products["']?( .*)?$`],
            output: "HTTP/2 201\nlocation: /v1/products/913\ncontent-type: application/json\n\n{\"id\":913,\"name\":\"Protein Bar\",\"price\":2.5}",
          },
        ],
        fileChecks: [],
        explanation:
          "401 with a WWW-Authenticate header means 'no or bad credentials', not 'broken'. 200 with cache-control shows the API works once authenticated. 422 is a validation error and its body names the missing field; 201 Created with a Location header is the correct response for a POST that creates a resource. Reading status and headers first saves hours of guessing, and it gives the mobile team an exact answer: they were not sending the token, and price is required.",
      },
    },
  },
  {
    id: "eng-express-crud-api",
    departmentId: "engineering",
    title: "Build a CRUD REST API in Express",
    statement: "Can implement create, read, update and delete endpoints with correct status codes, validation errors, ETags and 404 handling.",
    skillIds: ["eng-express", "eng-rest-api-design", "eng-http"],
    level: 2,
    aliases: ["express api", "crud", "rest api node", "node backend"],
    capstone: topic("Build the core of a CRUD REST API", "express-crud-rest-api"),
  },
  {
    id: "eng-express-middleware-errors",
    departmentId: "engineering",
    title: "Add middleware and centralised error handling to an Express app",
    statement: "Can order Express middleware correctly, short-circuit requests, and route thrown and async errors to one error handler with consistent JSON responses.",
    skillIds: ["eng-express-middleware", "eng-js-error-handling"],
    level: 2,
    aliases: ["express middleware", "error handler", "middleware order"],
    capstone: topic("Simulate the middleware pipeline", "express-middleware-pipeline"),
  },
  {
    id: "eng-api-pagination",
    departmentId: "engineering",
    title: "Add cursor pagination, filtering and sorting to a list endpoint",
    statement: "Can implement stable cursor-based pagination with filters and sort order that never skips or duplicates rows when data changes.",
    skillIds: ["eng-api-pagination-idempotency", "eng-rest-api-design"],
    level: 3,
    aliases: ["pagination", "cursor pagination", "filtering sorting", "list api"],
    capstone: topic("Implement stable pagination", "api-pagination-filtering-sorting"),
  },
  {
    id: "eng-jwt-auth-end-to-end",
    departmentId: "engineering",
    title: "Add JWT login with refresh tokens to an app",
    statement: "Can implement login, short-lived access tokens, refresh-token rotation and logout across a React frontend and a Node API, rejecting expired or reused tokens.",
    skillIds: ["eng-auth-sessions-jwt", "eng-mern"],
    level: 3,
    aliases: ["jwt auth", "login api", "refresh token", "authentication"],
    capstone: topic("JWT auth end to end", "mern-jwt-auth"),
  },
  {
    id: "eng-rbac-permissions",
    departmentId: "engineering",
    title: "Implement role- and ownership-based permissions on an API",
    statement: "Can enforce role-based and attribute-based rules (admin, manager, owner of the record) on every endpoint and default to deny.",
    skillIds: ["eng-authorization", "eng-owasp"],
    level: 3,
    aliases: ["rbac", "permissions", "roles", "access control", "abac"],
    capstone: topic("Write an authorize() policy engine", "auth-rbac-abac"),
  },
  {
    id: "eng-webhook-integration",
    departmentId: "engineering",
    title: "Integrate a payment provider's webhooks safely",
    statement: "Can receive third-party webhooks with signature verification, idempotent processing and fast acknowledgement, and handle retries and out-of-order events.",
    skillIds: ["eng-webhooks", "eng-payments", "eng-third-party-apis"],
    level: 3,
    aliases: ["stripe webhook", "webhooks", "payment integration", "razorpay webhook"],
    capstone: {
      kind: "task",
      title: "Handle Stripe webhooks for a subscription app",
      task: {
        kind: "scenario",
        prompt:
          "A white-label fitness app uses Stripe subscriptions. The current webhook handler parses JSON with express.json(), looks up the user, updates the subscription, sends a welcome email, then returns 200. Stripe's dashboard shows many deliveries timing out and being retried, and some users got three welcome emails.",
        steps: [
          {
            id: "a",
            question: "How should the endpoint verify that a request really came from Stripe?",
            options: [
              "Check that the request IP is in a list you copied once",
              "Verify the Stripe-Signature header against the raw request body with the endpoint's signing secret (so the route must receive the raw body, not express.json())",
              "Require an API key query parameter",
              "Check that the event id starts with evt_",
            ],
            correctIndex: 1,
            explanation: "The signature is an HMAC of the exact raw bytes; parsing and re-serialising the JSON breaks it. Use express.raw() on that route and stripe.webhooks.constructEvent().",
          },
          {
            id: "b",
            question: "Why are users getting three welcome emails, and what fixes it?",
            options: [
              "Stripe is buggy; contact support",
              "Retries re-run the side effects. Store processed event ids (unique constraint) and skip events already handled, so processing is idempotent",
              "Send emails from the frontend instead",
              "Disable retries in the Stripe dashboard",
            ],
            correctIndex: 1,
            explanation: "Webhooks are delivered at least once. Idempotency keyed on event.id (or on the business object's state) makes a retry a no-op.",
          },
          {
            id: "c",
            question: "How do you stop the timeouts?",
            options: [
              "Increase the server timeout to 60 s",
              "Verify, record the event, enqueue the work on a job queue and return 2xx immediately; a worker does the slow updates and emails",
              "Return 500 so Stripe slows down",
              "Process events in a setTimeout after responding, in the same process",
            ],
            correctIndex: 1,
            explanation: "Acknowledge fast and do the work asynchronously and durably. A bare setTimeout loses work on a crash or deploy; a queue with retries does not.",
          },
        ],
      },
    },
  },
  {
    id: "eng-idempotent-payments",
    departmentId: "engineering",
    title: "Make a payment endpoint safe to retry",
    statement: "Can implement idempotency keys so a retried POST (double tap, network retry) creates exactly one charge and returns the original response.",
    skillIds: ["eng-api-pagination-idempotency", "eng-payments"],
    level: 4,
    aliases: ["idempotency", "idempotency key", "double charge", "safe retries"],
    capstone: topic("Implement idempotency keys", "api-idempotency-safe-methods"),
  },
  {
    id: "eng-rate-limiting",
    departmentId: "engineering",
    title: "Protect login and public endpoints with rate limiting",
    statement: "Can implement token-bucket or sliding-window rate limiting per user and IP, return 429 with Retry-After, and slow down credential stuffing.",
    skillIds: ["eng-rate-limiting", "eng-owasp"],
    level: 4,
    aliases: ["rate limit", "brute force protection", "429", "throttling api"],
    capstone: topic("Build a rate limiter", "auth-rate-limiting"),
  },

  // -------------------------------------------------------------------------
  // Backend: Laravel / PHP (L2 → L4 progression)
  // -------------------------------------------------------------------------
  {
    id: "eng-laravel-crud-api",
    departmentId: "engineering",
    title: "Scaffold a Laravel REST API resource with validation",
    statement: "Can generate a Laravel model, migration, API controller, form request and API resource with Artisan, register the routes and verify them with tests.",
    skillIds: ["eng-laravel-fundamentals", "eng-laravel-apis", "eng-laravel-validation", "eng-laravel-migrations"],
    level: 2,
    aliases: ["laravel api", "artisan", "laravel crud", "php api"],
    capstone: {
      kind: "task",
      title: "Add a vehicles API to a Laravel fleet app",
      task: {
        kind: "terminal",
        title: "Add a vehicles API to a Laravel fleet app",
        prompt:
          "The fleet-management client needs a /api/vehicles REST resource. Using Artisan: generate the Vehicle model with its migration and an API controller in one command, a StoreVehicleRequest form request and a VehicleResource. Register the routes in routes/api.php with a single apiResource line, run the migration, list the vehicle routes to check them and run the test suite.",
        cwd: "~/fleet-api (feature/vehicles)",
        intro: "$ php artisan --version\nLaravel Framework 11.31.0",
        files: [
          {
            path: "routes/api.php",
            content: "<?php\n\nuse App\\Http\\Controllers\\DriverController;\nuse Illuminate\\Support\\Facades\\Route;\n\nRoute::middleware('auth:sanctum')->group(function () {\n    Route::apiResource('drivers', DriverController::class);\n    // add the vehicles resource here\n});\n",
          },
        ],
        steps: [
          {
            id: "model",
            goal: "One make:model command that also creates the migration and an API controller.",
            accept: [r`^php artisan make:model Vehicle(?=.*( -[a-zA-Z]*m[a-zA-Z]*| --migration| --all| -a)( |$))(?=.*( -[a-zA-Z]*c[a-zA-Z]*| --controller| --all| -a)( |$)).*$`],
            output:
              "   INFO  Model [app/Models/Vehicle.php] created successfully.\n   INFO  Migration [database/migrations/2026_10_03_101500_create_vehicles_table.php] created successfully.\n   INFO  Controller [app/Http/Controllers/VehicleController.php] created successfully.",
          },
          {
            id: "request",
            goal: "Create the StoreVehicleRequest form request.",
            accept: [r`^php artisan make:request (Vehicle/)?StoreVehicleRequest$`],
            output: "   INFO  Request [app/Http/Requests/StoreVehicleRequest.php] created successfully.",
          },
          {
            id: "resource",
            goal: "Create the VehicleResource API resource.",
            accept: [r`^php artisan make:resource VehicleResource$`],
            output: "   INFO  Resource [app/Http/Resources/VehicleResource.php] created successfully.",
          },
          {
            id: "migrate",
            goal: "Run the migration.",
            accept: [r`^php artisan migrate$`],
            output: "   INFO  Running migrations.\n\n  2026_10_03_101500_create_vehicles_table ........................ 18.42ms DONE",
          },
          {
            id: "routes",
            goal: "List the vehicle routes.",
            accept: [r`^php artisan route:list( --path=(api/)?vehicles?| --path=api| --name=vehicles)?$`],
            output:
              "  GET|HEAD   api/vehicles ............ vehicles.index › VehicleController@index\n  POST       api/vehicles ............ vehicles.store › VehicleController@store\n  GET|HEAD   api/vehicles/{vehicle} .. vehicles.show › VehicleController@show\n  PUT|PATCH  api/vehicles/{vehicle} .. vehicles.update › VehicleController@update\n  DELETE     api/vehicles/{vehicle} .. vehicles.destroy › VehicleController@destroy",
          },
          {
            id: "test",
            goal: "Run the tests.",
            accept: [r`^php artisan test( --filter[= ]?\w+| --parallel)?$`, r`^(\./)?vendor/bin/(pest|phpunit)( .+)?$`],
            output: "   PASS  Tests\\Feature\\VehicleApiTest\n  ✓ it lists vehicles                0.21s\n  ✓ it validates a new vehicle       0.05s\n\n  Tests:    14 passed (52 assertions)",
          },
        ],
        fileChecks: [{ path: "routes/api.php", mustContain: ["apiResource(", "vehicles", "VehicleController"], mustNotContain: ["// add the vehicles resource here"] }],
        explanation:
          "`php artisan make:model Vehicle -mc --api` (or `-m -c --api`, `--migration --controller --api`) generates the model, migration and a controller without create/edit methods. Validation belongs in a FormRequest, output shape in an API Resource so you never leak columns. One `Route::apiResource('vehicles', VehicleController::class)` inside the sanctum group registers five routes; `route:list` proves it before anyone writes a client.",
      },
    },
  },
  {
    id: "eng-laravel-eager-loading",
    departmentId: "engineering",
    title: "Fix N+1 queries in an ORM-backed endpoint",
    statement: "Can detect an N+1 query pattern in an ORM endpoint (Eloquent, Prisma, Django) and fix it with eager loading or batching, proving the query count drops.",
    skillIds: ["eng-n-plus-one", "eng-laravel-eloquent"],
    level: 3,
    aliases: ["n+1", "eager loading", "slow orm", "with()", "dataloader"],
    capstone: topic("Batch an N+1 with a loader", "sql-n-plus-one"),
  },
  {
    id: "eng-laravel-queue-job",
    departmentId: "engineering",
    title: "Move slow work to a Laravel queue and run a worker",
    statement: "Can move slow work (emails, PDFs, third-party calls) out of the request into a queued job, switch the queue driver, and run and monitor a worker.",
    skillIds: ["eng-laravel-queues", "eng-background-jobs"],
    level: 3,
    aliases: ["laravel queue", "queue worker", "background job", "async email"],
    capstone: {
      kind: "task",
      title: "Queue booking confirmation emails",
      task: {
        kind: "terminal",
        title: "Queue booking confirmation emails",
        prompt:
          "POST /api/bookings takes ~4 s because it sends the confirmation email (and a PDF) synchronously. Move that into a queued job using the database queue driver: create the job SendBookingConfirmation, create the jobs table migration and run it, change QUEUE_CONNECTION in .env, clear the cached config (this server caches config), and start a worker that retries a failed job 3 times.",
        cwd: "~/booking-api (feature/queue-emails)",
        intro: "$ php artisan about --only=drivers\n  Drivers ........................................\n  Cache ........................................ file\n  Queue ........................................ sync\n  Session ...................................... file",
        files: [
          {
            path: ".env",
            content: "APP_NAME=BookingAPI\nAPP_ENV=staging\nDB_CONNECTION=mysql\nDB_DATABASE=booking\nMAIL_MAILER=smtp\nQUEUE_CONNECTION=sync\n",
          },
        ],
        steps: [
          {
            id: "job",
            goal: "Create the job class.",
            accept: [r`^php artisan make:job SendBookingConfirmation(Email|Job)?$`],
            output: "   INFO  Job [app/Jobs/SendBookingConfirmation.php] created successfully.",
          },
          {
            id: "table",
            goal: "Create the jobs table migration.",
            accept: [r`^php artisan (make:queue-table|queue:table)$`],
            output: "   INFO  Migration [database/migrations/2026_10_03_112000_create_jobs_table.php] created successfully.",
          },
          { id: "migrate", goal: "Run the migration.", accept: [r`^php artisan migrate$`], output: "  2026_10_03_112000_create_jobs_table ........................... 21.07ms DONE" },
          {
            id: "config",
            goal: "Clear the cached config so the new .env value is read.",
            accept: [r`^php artisan (config:clear|optimize:clear|config:cache|optimize)$`],
            output: "   INFO  Configuration cache cleared successfully.",
          },
          {
            id: "work",
            goal: "Start a worker with 3 tries.",
            accept: [r`^php artisan queue:work( database)?(?=.* --tries=3)( --[a-z-]+(=\S+)?)+$`],
            output: "   INFO  Processing jobs from the [default] queue.\n\n  2026-10-03 11:24:09 App\\Jobs\\SendBookingConfirmation ........ RUNNING\n  2026-10-03 11:24:10 App\\Jobs\\SendBookingConfirmation ........ 1s DONE",
          },
        ],
        fileChecks: [{ path: ".env", mustContain: ["QUEUE_CONNECTION=database"], mustNotContain: ["QUEUE_CONNECTION=sync"] }],
        explanation:
          "With QUEUE_CONNECTION=sync, a dispatched job still runs inside the request, so nothing gets faster. The database driver needs the jobs table, and a server with cached config ignores .env until the cache is cleared or rebuilt. In production the worker runs under Supervisor or systemd and `php artisan queue:restart` is part of every deploy, because workers keep the old code in memory.",
      },
    },
  },
  {
    id: "eng-laravel-sanctum-policies",
    departmentId: "engineering",
    title: "Secure a Laravel API for a mobile app with Sanctum and policies",
    statement: "Can choose between Sanctum token and SPA cookie auth for a client, protect routes, and enforce record ownership with policies instead of ad-hoc checks.",
    skillIds: ["eng-laravel-auth", "eng-authorization"],
    level: 3,
    aliases: ["laravel sanctum", "laravel policies", "api tokens", "laravel auth"],
    capstone: {
      kind: "task",
      title: "Lock down a Laravel API used by a React Native app",
      task: {
        kind: "scenario",
        prompt:
          "A Laravel 11 API serves a React Native app and a React admin SPA on admin.client.com (same parent domain as api.client.com). Currently, any logged-in user can GET /api/orders/{id} for any order id, and the admin SPA stores a bearer token in localStorage.",
        steps: [
          {
            id: "a",
            question: "Which auth fits each client?",
            options: [
              "Bearer tokens for both, stored in localStorage",
              "Sanctum personal access tokens (stored in the device keychain/secure storage) for the mobile app; Sanctum SPA cookie-based session auth with CSRF protection for the first-party admin SPA",
              "Passport OAuth2 for both",
              "Basic auth over HTTPS for both",
            ],
            correctIndex: 1,
            explanation: "Native apps cannot use cookies sensibly and should keep tokens in secure storage. A first-party SPA on the same parent domain gets httpOnly session cookies, which XSS cannot read, unlike localStorage tokens.",
          },
          {
            id: "b",
            question: "How do you stop users reading other people's orders?",
            options: [
              "Hide other users' order ids in the app",
              "Create an OrderPolicy with view() checking $user->id === $order->user_id (or an admin ability) and call $this->authorize('view', $order) or use the can: middleware on the route",
              "Use UUIDs instead of integer ids and skip the check",
              "Filter on the client side after fetching",
            ],
            correctIndex: 1,
            explanation: "This is an IDOR (broken object-level authorization, OWASP API1). Authorization must happen on the server for every object; UUIDs only make guessing harder.",
          },
          {
            id: "c",
            question: "A staff member left. How do you cut their mobile access immediately?",
            options: [
              "Wait for the token to expire",
              "Delete their Sanctum tokens ($user->tokens()->delete()) and deactivate the account so new logins fail",
              "Change APP_KEY",
              "Ask them to log out",
            ],
            correctIndex: 1,
            explanation: "Sanctum tokens are rows in personal_access_tokens, so revocation is immediate. Rotating APP_KEY would log everyone out and break encrypted data.",
          },
        ],
      },
    },
  },
  {
    id: "eng-laravel-zero-downtime-release",
    departmentId: "engineering",
    title: "Plan a zero-downtime Laravel release on a VPS",
    statement: "Can order the steps of an atomic, symlink-based Laravel release (build, migrate, cache, switch, reload, restart workers) so users never see errors and rollback is one step.",
    skillIds: ["eng-laravel-deploy", "eng-db-migrations", "eng-laravel-queues"],
    level: 4,
    aliases: ["zero downtime deploy", "laravel deployer", "envoyer", "atomic deploy"],
    capstone: {
      kind: "task",
      title: "Order an atomic Laravel release",
      task: {
        kind: "rank",
        prompt: "You deploy with release directories (/var/www/app/releases/<timestamp>) and a `current` symlink that Nginx serves. Put the steps of one release in the correct order, first step at the top.",
        items: [
          { id: "clone", label: "Clone the tagged commit into a new releases/<timestamp> directory and link the shared .env and storage/" },
          { id: "composer", label: "composer install --no-dev --optimize-autoloader and build front-end assets inside the new release" },
          { id: "migrate", label: "Run backward-compatible migrations with php artisan migrate --force" },
          { id: "cache", label: "php artisan config:cache, route:cache and view:cache in the new release" },
          { id: "switch", label: "Atomically point the current symlink at the new release (ln -sfn + mv -T)" },
          { id: "reload", label: "Reload PHP-FPM so OPcache serves the new code" },
          { id: "workers", label: "php artisan queue:restart so workers pick up the new code" },
          { id: "smoke", label: "Smoke-test the health endpoint; if it fails, switch the symlink back to the previous release" },
        ],
        correctOrder: ["clone", "composer", "migrate", "cache", "switch", "reload", "workers", "smoke"],
        explanation:
          "Everything slow or risky happens in the new directory while the old release keeps serving. Migrations must be backward compatible because the old code still runs until the switch. Caches are built per release, the symlink switch is atomic, FPM reload clears OPcache's view of the old paths, and queue workers must be restarted because they hold old code in memory. Rollback is just pointing the symlink back.",
      },
    },
  },
  {
    id: "eng-laravel-tests-fix",
    departmentId: "engineering",
    title: "Run a Laravel test suite and fix a failing feature test",
    statement: "Can run the full or filtered Laravel test suite, read a failing assertion and fix the actual cause, deciding whether the code or the test is wrong.",
    skillIds: ["eng-laravel-testing", "eng-debugging"],
    level: 2,
    aliases: ["php artisan test", "pest", "phpunit", "failing test"],
    capstone: {
      kind: "task",
      title: "Fix a failing vehicle API test",
      task: {
        kind: "terminal",
        title: "Fix a failing vehicle API test",
        prompt:
          "CI is red on feature/vehicles. Run the test suite, then only the failing test, and fix the cause. The API contract agreed with the client (and the mobile app) names the field plate_number, and StoreVehicleRequest already validates 'plate_number' => 'required|string|max:12'. Rerun the test to confirm.",
        cwd: "~/fleet-api (feature/vehicles)",
        intro: "$ git log --oneline -1\nd4c2b10 Add vehicles API",
        files: [
          {
            path: "tests/Feature/VehicleApiTest.php",
            content:
              "<?php\n\nuse App\\Models\\User;\n\nit('creates a vehicle', function () {\n    $user = User::factory()->create();\n\n    $this->actingAs($user)\n        ->postJson('/api/vehicles', [\n            'plate' => 'KA01AB1234',\n            'model' => 'Tata Ace',\n        ])\n        ->assertCreated()\n        ->assertJsonPath('data.plate_number', 'KA01AB1234');\n});\n",
          },
        ],
        steps: [
          {
            id: "run",
            goal: "Run the whole suite.",
            accept: [r`^php artisan test( --parallel)?$`, r`^(\./)?vendor/bin/(pest|phpunit)$`],
            output:
              "   FAIL  Tests\\Feature\\VehicleApiTest\n  ⨯ it creates a vehicle\n  ────────────────────────────────────────\n  Expected response status code [201] but received 422.\n  The following errors occurred during the last request:\n  {\n      \"message\": \"The plate number field is required.\",\n      \"errors\": { \"plate_number\": [\"The plate number field is required.\"] }\n  }\n\n  Tests:    1 failed, 13 passed (50 assertions)",
          },
          {
            id: "filter",
            goal: "Rerun only the failing test after fixing it.",
            accept: [r`^php artisan test (--filter[= ]?["']?(VehicleApiTest|creates a vehicle|"creates a vehicle")["']?|tests/Feature/VehicleApiTest\.php)$`, r`^(\./)?vendor/bin/(pest|phpunit) (--filter[= ]?["']?[\w ]+["']?|tests/Feature/VehicleApiTest\.php)$`],
            output: "   PASS  Tests\\Feature\\VehicleApiTest\n  ✓ it creates a vehicle    0.19s\n\n  Tests:    1 passed (3 assertions)",
          },
        ],
        fileChecks: [{ path: "tests/Feature/VehicleApiTest.php", mustContain: ["'plate_number' => 'KA01AB1234'"], mustNotContain: ["'plate' =>"] }],
        explanation:
          "A 422 with an errors bag is a validation failure, so the response body tells you exactly what was missing. The contract says plate_number, the validation and resource already agree, so the test is wrong, not the code. Renaming the validation rule to make the test pass would have broken the mobile app. Always decide which side is the source of truth before 'fixing' a red test.",
      },
    },
  },

  // -------------------------------------------------------------------------
  // Databases & SQL
  // -------------------------------------------------------------------------
  {
    id: "eng-sql-report-query",
    departmentId: "engineering",
    title: "Write a reporting query with joins and GROUP BY",
    statement: "Can write a SQL report that joins tables, aggregates with GROUP BY and filters groups with HAVING, without double-counting rows.",
    skillIds: ["eng-sql", "eng-sql-aggregation", "eng-sql-joins"],
    level: 2,
    aliases: ["sql report", "group by", "having", "sql joins", "aggregation"],
    capstone: topic("Implement GROUP BY and HAVING semantics", "sql-aggregation-group-by"),
  },
  {
    id: "eng-sql-join-semantics",
    departmentId: "engineering",
    title: "Choose the right SQL join and predict its result",
    statement: "Can predict the rows an inner, left, right or full join returns, including NULLs and duplicates, and pick the join a report needs.",
    skillIds: ["eng-sql-joins", "eng-sql"],
    level: 2,
    aliases: ["left join", "inner join", "sql join types"],
    capstone: topic("Implement join semantics", "sql-joins"),
  },
  {
    id: "eng-sql-index-slow-query",
    departmentId: "engineering",
    title: "Speed up a slow query with EXPLAIN and the right index",
    statement: "Can read an EXPLAIN ANALYZE plan, design a composite index that matches the WHERE and ORDER BY, create it without locking a live table and prove the speed-up.",
    skillIds: ["eng-sql-indexing", "eng-postgresql"],
    level: 4,
    aliases: ["slow query", "explain analyze", "database index", "query optimisation"],
    capstone: {
      kind: "task",
      title: "Index the customer order history query",
      task: {
        kind: "terminal",
        title: "Index the customer order history query",
        prompt:
          "The 'My orders' screen is slow. The query is: SELECT id, total, status FROM orders WHERE customer_id = 4821 ORDER BY created_at DESC LIMIT 20; The orders table has 9 million rows and takes writes all day, so you cannot lock it. In psql: look at the actual plan, create the index that serves both the filter and the sort without blocking writes, then check the plan again.",
        cwd: "shop_prod=#",
        intro: "-- pg_stat_statements\n mean_exec_time | calls  | query\n----------------+--------+---------------------------------------------\n        1843.22 | 120554 | SELECT id, total, status FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT $2",
        files: [],
        steps: [
          {
            id: "explain",
            goal: "Run EXPLAIN ANALYZE on the query.",
            accept: [r`^(EXPLAIN|explain) (ANALYZE|analyze|\((ANALYZE|analyze)[^)]*\)) (SELECT|select) .*(orders|ORDERS).*;?$`],
            output:
              " Limit  (cost=812441.10..812441.15 rows=20) (actual time=1790.4..1790.4 rows=20 loops=1)\n   ->  Sort  (cost=812441.10..812447.85 rows=2702) (actual time=1790.4..1790.4 rows=20 loops=1)\n         Sort Key: created_at DESC\n         ->  Seq Scan on orders  (cost=0.00..812369.20 rows=2702) (actual time=0.03..1788.9 rows=2650 loops=1)\n               Filter: (customer_id = 4821)\n               Rows Removed by Filter: 8997350\n Execution Time: 1790.62 ms",
          },
          {
            id: "index",
            goal: "Create a composite index on (customer_id, created_at) concurrently.",
            accept: [r`^(CREATE|create) (INDEX|index) (CONCURRENTLY|concurrently) ((IF NOT EXISTS|if not exists) )?([a-z_0-9]+ )?(ON|on) orders( (USING|using) (btree|BTREE))? ?\( ?customer_id, ?created_at( (DESC|desc))? ?\);?$`],
            output: "CREATE INDEX",
          },
          {
            id: "explain-again",
            goal: "Check the plan again.",
            accept: [r`^(EXPLAIN|explain) (ANALYZE|analyze|\((ANALYZE|analyze)[^)]*\)) (SELECT|select) .*(orders|ORDERS).*;?$`],
            output:
              " Limit  (cost=0.56..21.73 rows=20) (actual time=0.041..0.093 rows=20 loops=1)\n   ->  Index Scan Backward using orders_customer_id_created_at_idx on orders  (actual time=0.040..0.090 rows=20 loops=1)\n         Index Cond: (customer_id = 4821)\n Execution Time: 0.118 ms",
          },
        ],
        fileChecks: [],
        explanation:
          "The plan shows a sequential scan discarding 9 million rows and then a sort. An index on (customer_id, created_at) lets Postgres jump to one customer's rows already ordered by date and stop after 20 (a backward index scan serves DESC). An index on customer_id alone would still need a sort; (created_at, customer_id) puts the wrong column first. CREATE INDEX CONCURRENTLY builds without blocking writes (it cannot run inside a transaction, and a failed build leaves an INVALID index to drop).",
      },
    },
  },
  {
    id: "eng-zero-downtime-migration",
    departmentId: "engineering",
    title: "Rename a column in production without downtime",
    statement: "Can plan an expand-and-contract schema change across several deploys so old and new code both work at every step and no data is lost.",
    skillIds: ["eng-db-migrations", "eng-system-design"],
    level: 5,
    aliases: ["expand contract", "zero downtime migration", "rename column", "schema change"],
    capstone: {
      kind: "task",
      title: "Order the expand-and-contract steps",
      task: {
        kind: "rank",
        prompt: "You must rename users.phone to users.mobile_number on a live API with mobile apps that update slowly and several app servers deployed one by one. Order the steps, first at the top.",
        items: [
          { id: "add", label: "Migration: add the nullable mobile_number column" },
          { id: "dual", label: "Deploy code that writes to both columns and still reads phone" },
          { id: "backfill", label: "Backfill mobile_number from phone in batches" },
          { id: "read", label: "Deploy code that reads mobile_number (still writing both)" },
          { id: "stop", label: "Deploy code that stops writing phone" },
          { id: "drop", label: "Migration: drop the phone column after a safe period" },
        ],
        correctOrder: ["add", "dual", "backfill", "read", "stop", "drop"],
        explanation:
          "A direct RENAME breaks every server still running the old code during a rolling deploy. Expand (add column, dual-write, backfill), switch reads, then contract (stop writing, drop). Each step is independently deployable and reversible, and the backfill runs after dual-writes start so no new rows are missed.",
      },
    },
  },
  {
    id: "eng-redis-caching",
    departmentId: "engineering",
    title: "Add a Redis cache with a sound invalidation strategy",
    statement: "Can add cache-aside caching with TTLs, invalidate on writes, and prevent stampedes when a hot key expires.",
    skillIds: ["eng-redis", "eng-cache-invalidation"],
    level: 3,
    aliases: ["redis cache", "caching", "cache invalidation", "cache stampede"],
    capstone: topic("Cache invalidation and stampede scenario", "nosql-cache-invalidation"),
  },

  // -------------------------------------------------------------------------
  // DevOps: Linux, Docker, deploy, CI/CD, logs
  // -------------------------------------------------------------------------
  {
    id: "eng-ssh-service-logs",
    departmentId: "engineering",
    title: "SSH into a server, read a service's logs and restart it",
    statement: "Can connect to a Linux server over SSH, check a systemd service's status and logs, check memory, restart the service and confirm it is healthy.",
    skillIds: ["eng-linux-shell", "eng-logging"],
    level: 1,
    aliases: ["ssh", "systemctl", "journalctl", "server logs", "linux basics"],
    capstone: {
      kind: "task",
      title: "Bring a crashed API back up",
      task: {
        kind: "terminal",
        title: "Bring a crashed API back up",
        prompt:
          "The client reports their app shows 'Server error' everywhere. Their Node API runs on an Ubuntu VPS (203.0.113.24, user deploy) as the systemd service shop-api. SSH in, check the service status, read its recent logs, check memory, restart the service and confirm the health endpoint on port 3000 answers.",
        cwd: "~ (laptop)",
        intro: "$ ping -c1 203.0.113.24\n64 bytes from 203.0.113.24: icmp_seq=1 ttl=52 time=38.1 ms",
        files: [],
        steps: [
          {
            id: "ssh",
            goal: "SSH in as deploy.",
            accept: [r`^ssh( -i \S+)?( -p ?22)? deploy@203\.0\.113\.24$`],
            output: "Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-45-generic x86_64)\nLast login: Thu Oct  2 18:22:41 2026\ndeploy@vps-01:~$",
          },
          {
            id: "status",
            goal: "Check the shop-api service status.",
            accept: [r`^(sudo )?systemctl status shop-api(\.service)?( --no-pager)?$`],
            output: "× shop-api.service - Shop API (Node)\n     Loaded: loaded (/etc/systemd/system/shop-api.service; enabled)\n     Active: failed (Result: signal) since Fri 2026-10-03 02:14:07 UTC; 6h ago\n    Process: 1022 ExecStart=/usr/bin/node dist/server.js (code=killed, signal=KILL)",
          },
          {
            id: "logs",
            goal: "Read the service's recent logs.",
            accept: [r`^(sudo )?journalctl -u shop-api(\.service)?( -n ?\d+| --lines[= ]\d+| --since ["']?[^"']+["']?| -e| -f| --no-pager| -r| -x)*$`],
            output: "Oct 03 02:14:05 vps-01 node[1022]: GET /api/reports/export 200 ...\nOct 03 02:14:07 vps-01 kernel: Out of memory: Killed process 1022 (node) total-vm:2914320kB, anon-rss:1810432kB\nOct 03 02:14:07 vps-01 systemd[1]: shop-api.service: Main process exited, code=killed, status=9/KILL\nOct 03 02:14:07 vps-01 systemd[1]: shop-api.service: Failed with result 'signal'.",
          },
          {
            id: "memory",
            goal: "Check the memory on the box.",
            accept: [r`^free( -[mhg]+)?$`, r`^(top|htop)( -b -n ?1)?$`, r`^cat /proc/meminfo$`],
            output: "               total        used        free      shared  buff/cache   available\nMem:           1.9Gi       310Mi       1.3Gi        12Mi       310Mi       1.5Gi\nSwap:             0B          0B          0B",
          },
          {
            id: "restart",
            goal: "Restart the service.",
            accept: [r`^sudo systemctl (restart|start) shop-api(\.service)?$`],
            output: "$ systemctl is-active shop-api\nactive",
          },
          {
            id: "health",
            goal: "Confirm the health endpoint responds.",
            accept: [r`^curl( -[a-zA-Z]+| --[a-z-]+)* ["']?(http://)?(localhost|127\.0\.0\.1):3000/health["']?$`],
            output: "HTTP/1.1 200 OK\ncontent-type: application/json\n\n{\"status\":\"ok\",\"db\":\"up\"}",
          },
        ],
        fileChecks: [],
        explanation:
          "status shows the service died from a signal; the journal shows the kernel's OOM killer killed node during a report export on a 2 GB box with no swap. Restarting restores service, but the follow-up is real work: add Restart=on-failure to the unit, stream the export instead of building it in memory, cap Node's heap or add swap, and set an alert. A restart is the first aid, not the fix.",
      },
    },
  },
  {
    id: "eng-shell-log-triage",
    departmentId: "engineering",
    title: "Triage a production 500 error from the server logs",
    statement: "Can find the error behind a production 500 by searching application and web-server logs, connect it to the last deploy and apply the fix safely.",
    skillIds: ["eng-debugging", "eng-logging", "eng-laravel-deploy"],
    level: 3,
    aliases: ["production error", "500 error", "debug production", "laravel log", "grep logs"],
    capstone: {
      kind: "task",
      title: "Find why /api/orders returns 500 after a deploy",
      task: {
        kind: "terminal",
        title: "Find why /api/orders returns 500 after a deploy",
        prompt:
          "Right after this morning's deploy, the client's app shows errors on the orders screen: GET /api/orders returns 500. You are on the server in the Laravel app's directory. Find the error in the application log, confirm the cause, fix it the way production deploys should, and verify the endpoint.",
        cwd: "deploy@vps-02:/var/www/shop-api",
        intro: "$ tail -n 3 /var/log/nginx/access.log\n49.36.x.x - - [03/Oct/2026:09:41:12 +0000] \"GET /api/orders?page=1 HTTP/2.0\" 500 81\n49.36.x.x - - [03/Oct/2026:09:41:15 +0000] \"GET /api/orders?page=1 HTTP/2.0\" 500 81\n103.21.x.x - - [03/Oct/2026:09:41:20 +0000] \"GET /api/profile HTTP/2.0\" 200 512",
        files: [],
        steps: [
          {
            id: "log",
            goal: "Read or search the Laravel log in storage/logs.",
            accept: [r`^(sudo )?(tail|less|cat)( -[nf]+ ?\d*| -\d+)* storage/logs/laravel(-\d{4}-\d{2}-\d{2})?\.log$`, r`^(sudo )?grep( -[a-zA-Z]+| -[ABC] ?\d+)* ["']?[\w. :\[\]-]+["']? storage/logs/(laravel[\w.-]*\.log|\*)$`],
            output:
              "[2026-10-03 09:41:12] production.ERROR: SQLSTATE[42S22]: Column not found: 1054 Unknown column 'orders.discount_code' in 'field list' (Connection: mysql, SQL: select `orders`.`id`, `orders`.`total`, `orders`.`discount_code` from `orders` where `orders`.`user_id` = 1184 ...) {\"userId\":1184,\"exception\":\"[object] (Illuminate\\\\Database\\\\QueryException(code: 42S22) at /var/www/shop-api/vendor/laravel/framework/src/Illuminate/Database/Connection.php:825)",
          },
          {
            id: "status",
            goal: "Check which migrations have run.",
            accept: [r`^php artisan migrate:status$`],
            output: "  Migration name ............................................. Batch / Status\n  2026_09_12_090000_create_orders_table ............................ [1] Ran\n  2026_10_01_143000_add_discount_code_to_orders_table .................. Pending",
          },
          {
            id: "migrate",
            goal: "Run the pending migration non-interactively in production.",
            accept: [r`^php artisan migrate --force$`],
            output: "   INFO  Running migrations.\n\n  2026_10_01_143000_add_discount_code_to_orders_table ............ 312.55ms DONE",
          },
          {
            id: "verify",
            goal: "Verify /api/orders now answers (with any auth header).",
            accept: [r`^curl( -[a-zA-Z]+| --[a-z-]+| -H ["'][^"']+["'])* ["']?https?://[\w.:-]+/api/orders(\?page=1)?["']?$`],
            output: "HTTP/2 200\ncontent-type: application/json\n\n{\"data\":[{\"id\":5512,\"total\":\"1499.00\",\"discount_code\":null}],\"meta\":{\"current_page\":1}}",
          },
        ],
        fileChecks: [],
        explanation:
          "Nginx only tells you that it was a 500; storage/logs/laravel.log has the exception: the new code selects a column that does not exist yet. migrate:status confirms the deploy skipped the migration. `--force` is required to migrate in production non-interactively. The process fix is to make `php artisan migrate --force` part of the deploy script, with backward-compatible migrations so they can run before the code switch.",
      },
    },
  },
  {
    id: "eng-docker-containerise-api",
    departmentId: "engineering",
    title: "Containerise a Node API with Docker",
    statement: "Can build an image for an API, keep secrets and node_modules out of it with .dockerignore, run it with a port mapping and read its logs.",
    skillIds: ["eng-docker", "eng-dockerfiles"],
    level: 2,
    aliases: ["docker", "dockerize", "docker build", "docker run", "containers"],
    capstone: {
      kind: "task",
      title: "Build and run the notes API image",
      task: {
        kind: "terminal",
        title: "Build and run the notes API image",
        prompt:
          "The notes API already has a Dockerfile. Before building, fix .dockerignore so node_modules and the .env file (which has production secrets) are never copied into the image. Then build an image tagged notes-api, run it detached with port 3000 mapped to 3000, check it is running, read its logs and call the health endpoint.",
        cwd: "~/notes-api (main)",
        intro: "$ ls -a\n.  ..  .dockerignore  .env  .git  Dockerfile  node_modules  package-lock.json  package.json  src",
        files: [{ path: ".dockerignore", content: ".git\n*.log\n" }],
        steps: [
          {
            id: "build",
            goal: "Build the image tagged notes-api from the current directory.",
            accept: [r`^docker (image )?build (-t|--tag) notes-api(:[\w.-]+)? \.$`, r`^docker (image )?build \. (-t|--tag) notes-api(:[\w.-]+)?$`, r`^docker buildx build (-t|--tag) notes-api(:[\w.-]+)?( --load)? \.$`],
            output: "[+] Building 24.6s (10/10) FINISHED\n => [internal] load .dockerignore\n => [3/5] COPY package*.json ./\n => [4/5] RUN npm ci --omit=dev\n => [5/5] COPY . .\n => naming to docker.io/library/notes-api:latest",
          },
          {
            id: "run",
            goal: "Run it detached with -p 3000:3000.",
            accept: [r`^docker (container )?run(?=.* (-d|--detach|-d[a-z]*)( |$))(?=.* (-p|--publish)[ =]3000:3000( |$))( --?[a-zA-Z-]+([ =][^\s-][^\s]*)?)* notes-api(:[\w.-]+)?$`],
            output: "f3a91c27d0be6e0f2b1c9a4d8e77c1f2a0b3d5e6f7a8b9c0d1e2f3a4b5c6d7e8",
          },
          {
            id: "ps",
            goal: "Check the container is running.",
            accept: [r`^docker (ps|container ls)( -a)?$`],
            output: "CONTAINER ID   IMAGE       COMMAND                  STATUS         PORTS                    NAMES\nf3a91c27d0be   notes-api   \"docker-entrypoint.s…\"   Up 8 seconds   0.0.0.0:3000->3000/tcp   eager_hopper",
          },
          {
            id: "logs",
            goal: "Read the container's logs.",
            accept: [r`^docker (container )?logs( -f| --follow| --tail ?\d+| -n ?\d+)* (f3a91c27d0be|f3a9\w*|eager_hopper|[\w-]+)$`],
            output: "> notes-api@1.4.0 start\n> node src/server.js\n\nListening on 0.0.0.0:3000",
          },
          {
            id: "health",
            goal: "Call the health endpoint.",
            accept: [r`^curl( -[a-zA-Z]+| --[a-z-]+)* ["']?(http://)?(localhost|127\.0\.0\.1):3000/health["']?$`],
            output: "{\"status\":\"ok\"}",
          },
        ],
        fileChecks: [{ path: ".dockerignore", mustContain: ["node_modules", ".env"], mustNotContain: [] }],
        explanation:
          "`COPY . .` copies whatever the build context contains, so without .dockerignore your laptop's node_modules (wrong OS binaries) and .env secrets end up baked into every image layer, and anyone who can pull the image can read them. Secrets come in at run time (`--env-file`, orchestrator secrets). Inside the container the app must listen on 0.0.0.0, not 127.0.0.1, or the port mapping reaches nothing.",
      },
    },
  },
  {
    id: "eng-docker-multistage",
    departmentId: "engineering",
    title: "Write a small, cache-friendly multi-stage Dockerfile",
    statement: "Can order Dockerfile instructions for layer caching and use multi-stage builds so the production image has no build tools or dev dependencies.",
    skillIds: ["eng-dockerfiles", "eng-docker"],
    level: 3,
    aliases: ["dockerfile", "multi stage build", "smaller docker image", "layer caching"],
    capstone: topic("Simulate a Docker build and its cache", "docker-dockerfiles"),
  },
  {
    id: "eng-docker-compose-stack",
    departmentId: "engineering",
    title: "Run an app and its database together with Docker Compose",
    statement: "Can fix a Compose file so services reach each other by service name, start the stack, read one service's logs and open a shell into the database.",
    skillIds: ["eng-docker-compose", "eng-docker", "eng-postgresql"],
    level: 3,
    aliases: ["docker compose", "compose up", "local dev stack", "multi container"],
    capstone: {
      kind: "task",
      title: "Fix and start the shop API's Compose stack",
      task: {
        kind: "terminal",
        title: "Fix and start the shop API's Compose stack",
        prompt:
          "A new developer cannot start the shop API locally: the api container keeps crashing with ECONNREFUSED 127.0.0.1:5432. Fix docker-compose.yml so the API reaches Postgres, then start the stack in the background (rebuilding the api image), check the services, read the api logs and open psql inside the db container as user shop.",
        cwd: "~/shop-api (main)",
        intro: "$ docker compose logs api | tail -2\napi-1  | Error: connect ECONNREFUSED 127.0.0.1:5432\napi-1  | Node.js v22.9.0",
        files: [
          {
            path: "docker-compose.yml",
            content:
              "services:\n  api:\n    build: .\n    ports:\n      - \"3000:3000\"\n    environment:\n      DATABASE_URL: postgres://shop:shop@localhost:5432/shop\n    depends_on:\n      db:\n        condition: service_healthy\n  db:\n    image: postgres:16\n    environment:\n      POSTGRES_USER: shop\n      POSTGRES_PASSWORD: shop\n      POSTGRES_DB: shop\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n    healthcheck:\n      test: [\"CMD-SHELL\", \"pg_isready -U shop\"]\n      interval: 5s\n      retries: 10\nvolumes:\n  pgdata:\n",
          },
        ],
        steps: [
          {
            id: "up",
            goal: "Start the stack detached, rebuilding images.",
            accept: [r`^docker[ -]compose up(?=.* (-d|--detach)( |$))(?=.* --build( |$))( -d| --detach| --build)+$`],
            output: "[+] Running 3/3\n ✔ Volume \"shop-api_pgdata\"  Created\n ✔ Container shop-api-db-1   Healthy\n ✔ Container shop-api-api-1  Started",
          },
          {
            id: "ps",
            goal: "Check the services' state.",
            accept: [r`^docker[ -]compose ps( -a)?$`],
            output: "NAME             SERVICE   STATUS                   PORTS\nshop-api-api-1   api       Up 12 seconds            0.0.0.0:3000->3000/tcp\nshop-api-db-1    db        Up 18 seconds (healthy)  5432/tcp",
          },
          {
            id: "logs",
            goal: "Read the api service's logs.",
            accept: [r`^docker[ -]compose logs( -f| --follow| --tail[ =]?\d+| -n ?\d+)* api$`],
            output: "api-1  | Connected to postgres at db:5432\napi-1  | Listening on 0.0.0.0:3000",
          },
          {
            id: "psql",
            goal: "Open psql in the db container as user shop.",
            accept: [r`^docker[ -]compose exec( -it)? db psql (-U shop|-U shop -d shop|-U shop shop|--username=shop)( -d shop)?$`],
            output: "psql (16.4 (Debian 16.4-1.pgdg120+2))\nType \"help\" for help.\n\nshop=#",
          },
        ],
        fileChecks: [{ path: "docker-compose.yml", mustContain: ["@db:5432"], mustNotContain: ["@localhost:5432"] }],
        explanation:
          "Inside a container, localhost is the container itself, not your laptop or the database. Compose puts services on one network where each is reachable by its service name, so the URL must use db:5432. depends_on with condition: service_healthy waits for pg_isready, and --build makes sure code changes are in the image. The named volume keeps data across `down`/`up` (only `down -v` deletes it).",
      },
    },
  },
  {
    id: "eng-deploy-rest-api-vps",
    departmentId: "engineering",
    title: "Build and deploy a REST API with auth on a VPS",
    statement: "Can deploy an authenticated Node REST API to a Linux VPS with production dependencies, real secrets, a process manager, an Nginx reverse proxy and HTTPS, and verify auth works in production.",
    skillIds: ["eng-express", "eng-auth-sessions-jwt", "eng-reverse-proxies", "eng-linux-shell", "eng-tls", "eng-secrets-config"],
    level: 3,
    aliases: ["deploy api", "vps deploy", "nginx pm2", "deploy node", "production deploy"],
    capstone: {
      kind: "task",
      title: "Ship the tasks API to production on a VPS",
      task: {
        kind: "terminal",
        title: "Ship the tasks API to production on a VPS",
        prompt:
          "The tasks API (Express + JWT auth) is merged to main and already cloned on the client's VPS. Deploy it: pull main, install production dependencies only, set a real JWT secret in .env (the current one is a placeholder), start or reload it with PM2 using ecosystem.config.js, fix the Nginx site so it proxies to the port the app listens on (3000), test and reload Nginx, get a Let's Encrypt certificate for api.tasksapp.io, and finally prove that GET https://api.tasksapp.io/api/tasks is protected.",
        cwd: "deploy@vps-01:~/apps/tasks-api (main)",
        intro: "$ git log --oneline -1 origin/main\n6e2f1a9 Add JWT auth and refresh tokens\n\n$ pm2 ls\n┌────┬───────────┬─────────┬──────┐\n│ id │ name      │ status  │ cpu  │\n├────┼───────────┼─────────┼──────┤\n└────┴───────────┴─────────┴──────┘",
        files: [
          { path: ".env", content: "NODE_ENV=production\nPORT=3000\nDATABASE_URL=postgres://tasks:REDACTED@localhost:5432/tasks\nJWT_SECRET=changeme\nJWT_EXPIRES_IN=15m\n" },
          {
            path: "/etc/nginx/sites-available/tasks-api",
            content:
              "server {\n    listen 80;\n    server_name api.tasksapp.io;\n\n    location / {\n        proxy_pass http://127.0.0.1:8080;\n        proxy_set_header Host $host;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n}\n",
          },
        ],
        steps: [
          { id: "pull", goal: "Pull the latest main.", accept: [r`^git pull( --ff-only)?( origin main)?$`], output: "Updating 1b0c3d2..6e2f1a9\nFast-forward\n src/auth/jwt.js | 74 +++++++\n 6 files changed, 212 insertions(+), 9 deletions(-)" },
          {
            id: "install",
            goal: "Install production dependencies from the lockfile.",
            accept: [r`^npm ci( --omit=dev| --omit dev| --only=prod(uction)?| --production)$`, r`^NODE_ENV=production npm ci$`],
            output: "added 143 packages, and audited 144 packages in 6s\nfound 0 vulnerabilities",
          },
          {
            id: "pm2",
            goal: "Start (or reload) the app with PM2 from ecosystem.config.js.",
            accept: [r`^pm2 (start|reload|restart|startOrReload|startOrRestart) ecosystem\.config\.c?js( --env production| --update-env)*$`],
            output: "[PM2] App [tasks-api] launched (2 instances)\n┌────┬───────────┬──────────┬─────────┐\n│ id │ name      │ mode     │ status  │\n│ 0  │ tasks-api │ cluster  │ online  │\n│ 1  │ tasks-api │ cluster  │ online  │\n└────┴───────────┴──────────┴─────────┘",
          },
          { id: "nginx-test", goal: "Test the Nginx configuration.", accept: [r`^sudo nginx -t$`], output: "nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful" },
          { id: "nginx-reload", goal: "Reload Nginx.", accept: [r`^sudo (systemctl reload nginx|nginx -s reload|service nginx reload)$`], output: "$ systemctl is-active nginx\nactive" },
          {
            id: "certbot",
            goal: "Get a certificate for api.tasksapp.io with the Nginx plugin.",
            accept: [r`^sudo certbot --nginx( --[a-z-]+(=\S+)?| -m \S+)* -d api\.tasksapp\.io( --[a-z-]+(=\S+)?| -m \S+)*$`],
            output: "Successfully received certificate.\nCertificate is saved at: /etc/letsencrypt/live/api.tasksapp.io/fullchain.pem\nSuccessfully deployed certificate for api.tasksapp.io to /etc/nginx/sites-enabled/tasks-api\nCongratulations! You have successfully enabled HTTPS on https://api.tasksapp.io",
          },
          {
            id: "verify",
            goal: "Call https://api.tasksapp.io/api/tasks without a token and check it is rejected.",
            accept: [r`^curl( -[a-zA-Z]+| --[a-z-]+)* ["']?https://api\.tasksapp\.io/api/tasks["']?$`],
            output: "HTTP/2 401\nserver: nginx\ncontent-type: application/json\n\n{\"error\":\"missing or invalid token\"}",
          },
        ],
        fileChecks: [
          { path: ".env", mustContain: ["JWT_SECRET="], mustNotContain: ["JWT_SECRET=changeme", "JWT_SECRET=\n"] },
          { path: "/etc/nginx/sites-available/tasks-api", mustContain: [":3000"], mustNotContain: [":8080"] },
        ],
        explanation:
          "`npm ci --omit=dev` installs exactly the lockfile without dev tooling. A placeholder JWT secret means anyone can forge tokens, so generate a long random one (e.g. `openssl rand -base64 48`) and keep it out of Git. PM2 keeps the process alive and reloads it without dropping requests; Nginx terminates TLS and proxies to the app's real port, and `nginx -t` before every reload stops a typo from taking the site down. The final 401 proves that auth is enforced in production, not just that the server is up.",
      },
    },
  },
  {
    id: "eng-laravel-vps-deploy",
    departmentId: "engineering",
    title: "Deploy a Laravel update to a VPS",
    statement: "Can deploy a Laravel release on a VPS: pull, install optimised production dependencies, migrate, rebuild caches, reload PHP-FPM and restart queue workers.",
    skillIds: ["eng-laravel-deploy", "eng-linux-shell", "eng-php-composer"],
    level: 3,
    aliases: ["laravel deploy", "deploy php", "composer install production", "artisan optimize"],
    capstone: {
      kind: "task",
      title: "Deploy release 1.9 of the clinic API",
      task: {
        kind: "terminal",
        title: "Deploy release 1.9 of the clinic API",
        prompt:
          "Deploy the latest main of the clinic booking API (Laravel 11, PHP 8.3-FPM, Nginx, queue workers under Supervisor) on the client's VPS. Pull, install Composer dependencies for production with an optimised autoloader, run migrations, rebuild the framework caches, reload PHP-FPM, tell the queue workers to restart, and check the health route /up.",
        cwd: "deploy@vps-02:/var/www/clinic-api (main)",
        intro: "$ php -v | head -1\nPHP 8.3.12 (cli) (built: Sep 27 2026 07:14:50) (NTS)",
        files: [],
        steps: [
          { id: "pull", goal: "Pull main.", accept: [r`^git pull( --ff-only)?( origin main)?$`], output: "Updating 8d1e0aa..c42b7f9\nFast-forward\n app/Http/Controllers/AppointmentController.php | 41 ++++--\n database/migrations/2026_10_02_100000_add_reminder_sent_at_to_appointments.php | 28 ++++" },
          {
            id: "composer",
            goal: "Install production dependencies with an optimised autoloader.",
            accept: [r`^composer install(?=.* --no-dev( |$))(?=.* (--optimize-autoloader|-o|--classmap-authoritative|-a)( |$))( --[a-z-]+| -o| -a)+$`],
            output: "Installing dependencies from lock file\nNothing to install, update or remove\nGenerating optimized autoload files\n> @php artisan package:discover --ansi",
          },
          { id: "migrate", goal: "Run migrations in production.", accept: [r`^php artisan migrate --force$`], output: "  2026_10_02_100000_add_reminder_sent_at_to_appointments .......... 44.10ms DONE" },
          {
            id: "cache",
            goal: "Rebuild config, route and view caches.",
            accept: [r`^php artisan optimize$`, r`^php artisan config:cache$`],
            output: "   INFO  Caching framework bootstrap, configuration, and metadata.\n  config ........................................................ 21.33ms DONE\n  routes ........................................................ 30.07ms DONE\n  views ......................................................... 88.41ms DONE",
          },
          { id: "fpm", goal: "Reload PHP-FPM.", accept: [r`^sudo (systemctl reload|systemctl restart|service) php8\.3-fpm( reload| restart)?$`], output: "$ systemctl is-active php8.3-fpm\nactive" },
          { id: "queue", goal: "Restart the queue workers gracefully.", accept: [r`^php artisan queue:restart$`, r`^sudo supervisorctl restart (all|[\w:-]+)$`], output: "   INFO  Broadcasting queue restart signal." },
          { id: "health", goal: "Check the /up health route.", accept: [r`^curl( -[a-zA-Z]+| --[a-z-]+)* ["']?https?://[\w.:-]+/up["']?$`], output: "HTTP/2 200\ncontent-type: text/html; charset=UTF-8\n\nApplication up" },
        ],
        fileChecks: [],
        explanation:
          "Production installs skip dev packages and use an optimised classmap. `migrate --force` is required outside local. `php artisan optimize` caches config, routes and views (after which .env is no longer read at runtime). Reloading PHP-FPM clears OPcache's stale code, and queue workers are long-lived processes that keep running the old code until `queue:restart` makes them exit after their current job. Skipping that last step is the classic 'the fix is deployed but emails still use the old template' bug.",
      },
    },
  },
  {
    id: "eng-ci-github-actions",
    departmentId: "engineering",
    title: "Set up CI that tests every pull request",
    statement: "Can write a GitHub Actions workflow that installs dependencies reproducibly, caches them, runs lint and tests on every pull request, and confirm it runs.",
    skillIds: ["eng-ci-cd", "eng-github-flow"],
    level: 3,
    aliases: ["github actions", "ci pipeline", "continuous integration", "pr checks"],
    capstone: {
      kind: "task",
      title: "Make CI run on pull requests",
      task: {
        kind: "terminal",
        title: "Make CI run on pull requests",
        prompt:
          "The client's repo has a CI workflow that only runs on pushes to main, so broken PRs get merged. Edit .github/workflows/ci.yml so it runs on pull requests too, sets up Node 22 with npm caching, installs with the lockfile (not npm install) and runs lint and tests. Then commit, push your branch ci/pr-checks, open a PR and watch the checks.",
        cwd: "~/shop-web (ci/pr-checks)",
        intro: "$ git status -s\n(nothing yet: edit .github/workflows/ci.yml)",
        files: [
          {
            path: ".github/workflows/ci.yml",
            content:
              "name: CI\n\non:\n  push:\n    branches: [main]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm install\n      - run: npm test\n",
          },
        ],
        steps: [
          { id: "add", goal: "Stage the workflow.", accept: [r`^git add (\.github/workflows/ci\.yml|\.github/?|\.|-A|--all|-u)$`], output: "$ git status -s\nM  .github/workflows/ci.yml" },
          { id: "commit", goal: "Commit it.", accept: [GIT_COMMIT_MSG], output: "[ci/pr-checks 0be41d7] Run CI on pull requests with cached npm ci\n 1 file changed, 14 insertions(+), 3 deletions(-)" },
          { id: "push", goal: "Push the branch.", accept: [r`^git push( -u| --set-upstream)?( origin( ci/pr-checks| HEAD)?)?$`], output: "To github.com:oyelabs/shop-web.git\n * [new branch]      ci/pr-checks -> ci/pr-checks" },
          { id: "pr", goal: "Open a PR.", accept: [GH_PR_CREATE], output: "https://github.com/oyelabs/shop-web/pull/87" },
          {
            id: "checks",
            goal: "Watch the checks run.",
            accept: [r`^gh pr checks( \d+)?( --watch)?$`, r`^gh run (watch|list|view)( .*)?$`],
            output: "All checks were successful\n0 cancelled, 0 failing, 1 successful, 0 skipped, and 0 pending checks\n\n✓  CI/test (pull_request)  52s",
          },
        ],
        fileChecks: [{ path: ".github/workflows/ci.yml", mustContain: ["pull_request", "actions/setup-node", "npm ci", "npm test", "lint"], mustNotContain: ["npm install"] }],
        explanation:
          "A working workflow adds `pull_request:` under `on:`, uses actions/setup-node with node-version 22 and cache: npm, then runs `npm ci`, `npm run lint` and `npm test`. `npm ci` installs exactly the lockfile and fails if it is out of sync, which is what CI is for; `npm install` can silently change versions. Then protect main so the check is required before merging.",
      },
    },
  },
  {
    id: "eng-secrets-out-of-git",
    departmentId: "engineering",
    title: "Remove a committed .env file before it reaches the remote",
    statement: "Can stop tracking a committed secrets file, ignore it, amend the unpushed commit and explain when secrets must be rotated instead.",
    skillIds: ["eng-secrets-config", "eng-git"],
    level: 2,
    aliases: ["leaked secrets", ".env in git", "gitignore", "remove secret from commit"],
    capstone: {
      kind: "task",
      title: "Untrack .env from your last commit",
      task: {
        kind: "terminal",
        title: "Untrack .env from your last commit",
        prompt:
          "You just committed the vendor portal's .env (with the Stripe live key) by mistake. The commit has not been pushed. Stop tracking .env while keeping it on disk, add it to .gitignore, fix the last commit so .env is not in it, and check the commit's file list.",
        cwd: "~/vendor-portal (feature/payouts)",
        intro: "$ git show --stat HEAD\ncommit 5aa0c17 (HEAD -> feature/payouts)\n    Add payout scheduling\n\n .env                         |  9 +++\n app/Services/Payouts.php     | 88 ++++++\n 2 files changed, 97 insertions(+)\n\n$ git status -sb\n## feature/payouts...origin/feature/payouts [ahead 1]",
        files: [{ path: ".gitignore", content: "/vendor\n/node_modules\n/public/build\n" }],
        steps: [
          { id: "rm", goal: "Untrack .env but keep the file.", accept: [r`^git rm --cached \.env$`, r`^git rm -r --cached \.env$`], output: "rm '.env'" },
          { id: "add", goal: "Stage .gitignore.", accept: [r`^git add (\.gitignore|\.|-A|--all|-u)$`], output: "$ git status -s\nD  .env\nM  .gitignore" },
          { id: "amend", goal: "Amend the unpushed commit.", accept: [r`^git commit --amend( --no-edit| (-m|--message) ["'].+["'])?$`], output: "[feature/payouts 9c3d81e] Add payout scheduling\n 2 files changed, 89 insertions(+)" },
          { id: "verify", goal: "Check the commit's files.", accept: [r`^git show --stat( HEAD)?$`, r`^git log --stat -1$`, r`^git log -1 --stat$`], output: "commit 9c3d81e (HEAD -> feature/payouts)\n    Add payout scheduling\n\n .gitignore               |  1 +\n app/Services/Payouts.php | 88 ++++++\n 2 files changed, 89 insertions(+)" },
        ],
        fileChecks: [{ path: ".gitignore", mustContain: [".env"], mustNotContain: [] }],
        explanation:
          "`git rm --cached .env` removes it from the index without deleting your local file, .gitignore stops it coming back, and `--amend` rewrites the unpushed commit so the secret never existed in shared history. If it had been pushed (even briefly, even to a private repo), rewriting history is not enough: rotate the Stripe key immediately, because clones, forks and CI logs may already have it. Keep a .env.example with placeholder values instead.",
      },
    },
  },
  {
    id: "eng-k8s-rollout-rollback",
    departmentId: "engineering",
    title: "Roll out and roll back a Kubernetes deployment",
    statement: "Can update a deployment's image, watch the rollout, diagnose crashing pods from their status and logs, and roll back to the last good revision.",
    skillIds: ["eng-kubernetes", "eng-incident-response"],
    level: 4,
    aliases: ["kubectl", "rollout undo", "kubernetes deploy", "crashloopbackoff"],
    capstone: {
      kind: "task",
      title: "Roll back a crashing shop-api release",
      task: {
        kind: "terminal",
        title: "Roll back a crashing shop-api release",
        prompt:
          "Deploy shop-api 1.8.0 (image registry.oyelabs.dev/shop-api:1.8.0, container name api) to the shop namespace, watch the rollout, find out why it does not complete, roll back to the previous revision and confirm the rollback finished.",
        cwd: "~ (kube: prod-eu, ns: shop)",
        intro: "$ kubectl get deploy shop-api -n shop\nNAME       READY   UP-TO-DATE   AVAILABLE   AGE\nshop-api   3/3     3            3           41d",
        files: [],
        steps: [
          {
            id: "set-image",
            goal: "Set the api container's image to 1.8.0.",
            accept: [r`^kubectl set image (deployment|deploy)[/ ]shop-api api=registry\.oyelabs\.dev/shop-api:1\.8\.0( -n shop| --namespace[= ]shop)?$`, r`^kubectl( -n shop)? set image (deployment|deploy)[/ ]shop-api api=registry\.oyelabs\.dev/shop-api:1\.8\.0$`],
            output: "deployment.apps/shop-api image updated",
          },
          {
            id: "status",
            goal: "Watch the rollout.",
            accept: [r`^kubectl( -n shop)? rollout status (deployment|deploy)[/ ]shop-api( -n shop| --namespace[= ]shop| --timeout[= ]\w+)*$`],
            output: "Waiting for deployment \"shop-api\" rollout to finish: 1 out of 3 new replicas have been updated...\nerror: deployment \"shop-api\" exceeded its progress deadline",
          },
          {
            id: "diagnose",
            goal: "Look at the new pods and their logs.",
            accept: [r`^kubectl( -n shop)? (get pods|describe pod [\w-]+|logs( --previous| -p)? [\w/-]+)( -n shop| --namespace[= ]shop| -l [\w=-]+| --previous| -p)*$`],
            output: "NAME                        READY   STATUS             RESTARTS      AGE\nshop-api-7c9f8d6b5-2xkqp    0/1     CrashLoopBackOff   5 (40s ago)   4m\nshop-api-5d4b7f9c8-8hj2m    1/1     Running            0             41d\n\n$ kubectl logs shop-api-7c9f8d6b5-2xkqp --previous\nError: Missing required env var REDIS_URL",
          },
          {
            id: "undo",
            goal: "Roll back to the previous revision.",
            accept: [r`^kubectl( -n shop)? rollout undo (deployment|deploy)[/ ]shop-api( -n shop| --namespace[= ]shop| --to-revision=\d+)*$`],
            output: "deployment.apps/shop-api rolled back",
          },
          {
            id: "status-again",
            goal: "Confirm the rollback completed.",
            accept: [r`^kubectl( -n shop)? rollout status (deployment|deploy)[/ ]shop-api( -n shop| --namespace[= ]shop| --timeout[= ]\w+)*$`, r`^kubectl( -n shop)? get (pods|deploy shop-api|deployment shop-api)( -n shop)?$`],
            output: "deployment \"shop-api\" successfully rolled out",
          },
        ],
        fileChecks: [],
        explanation:
          "A rolling update keeps old pods serving until new ones become Ready, so the outage is contained, but the rollout stalls. CrashLoopBackOff plus `kubectl logs --previous` shows the crash reason: 1.8.0 needs REDIS_URL, which the manifest does not provide. `rollout undo` returns to the last revision. The real fix is to add the config (ConfigMap/Secret) together with the image change, and to have a readiness probe so a bad build never receives traffic.",
      },
    },
  },
  {
    id: "eng-incident-lead",
    departmentId: "engineering",
    title: "Lead a production incident from alert to postmortem",
    statement: "Can triage a production incident, choose rollback over a forward fix when appropriate, keep the client informed and run a blameless postmortem with concrete actions.",
    skillIds: ["eng-incident-response", "eng-observability", "eng-logging"],
    level: 5,
    aliases: ["incident response", "outage", "postmortem", "on call", "production down"],
    capstone: {
      kind: "task",
      title: "Run the checkout outage",
      task: {
        kind: "scenario",
        prompt:
          "Friday 19:40 IST. Alerts fire for a US client's white-label food-delivery app: checkout error rate 38% (normal <0.5%), p95 latency 9 s. A release went out at 19:10 with a new promo-code engine and a migration that added an index on orders. US lunch peak starts in 20 minutes. You are the on-call lead.",
        steps: [
          {
            id: "a",
            question: "What is your first move?",
            options: [
              "Start reading the promo-code diff to find the bug",
              "Declare an incident, assign roles (lead, comms, investigator), and check whether the 19:10 release correlates with the error spike",
              "Restart all app servers",
              "Email the client asking whether they see issues",
            ],
            correctIndex: 1,
            explanation: "Coordinate first: named roles stop five people doing the same thing, and the deploy timestamp is the strongest lead.",
          },
          {
            id: "b",
            question: "The spike starts exactly at 19:10. The fix-forward is 'probably a one-line change'. What do you do?",
            options: [
              "Ship the one-line fix straight to production",
              "Roll back the application release (keeping the backward-compatible migration), confirm the error rate recovers, then fix forward calmly",
              "Disable checkout until Monday",
              "Scale up the database",
            ],
            correctIndex: 1,
            explanation: "Mitigate before you diagnose. A rollback is a known-good state; an untested hotfix under pressure at peak can make it worse.",
          },
          {
            id: "c",
            question: "Errors are back to normal. What makes the postmortem useful?",
            options: [
              "Identify which engineer caused it",
              "A blameless timeline, the contributing causes (e.g. no load test of promo lookups, deploy just before peak), and owned, dated actions such as a canary deploy, a promo-engine load test and a release freeze before client peaks",
              "A note saying 'be more careful'",
              "Close the incident without a write-up since it is fixed",
            ],
            correctIndex: 1,
            explanation: "Blameless postmortems find system causes and produce specific actions with owners; blame makes people hide information next time.",
          },
        ],
      },
    },
  },

  // -------------------------------------------------------------------------
  // Testing & debugging
  // -------------------------------------------------------------------------
  {
    id: "eng-test-pyramid-checkout",
    departmentId: "engineering",
    title: "Decide what to test at which level for a feature",
    statement: "Can split a feature's test cases between unit, integration and end-to-end tests so the suite is fast and still catches the risky failures.",
    skillIds: ["eng-testing-strategy", "eng-unit-testing", "eng-testing-e2e"],
    level: 3,
    aliases: ["test strategy", "test pyramid", "what to test", "unit vs e2e"],
    capstone: {
      kind: "task",
      title: "Place each checkout test at the right level",
      task: {
        kind: "categorize",
        prompt: "You are writing tests for a new checkout feature (React frontend, Node API, Postgres, Stripe). Put each test at the cheapest level that still catches the failure it targets.",
        mode: "generic",
        categories: [
          { id: "unit", label: "Unit test" },
          { id: "integration", label: "Integration / API test" },
          { id: "e2e", label: "End-to-end test" },
        ],
        items: [
          { id: "i1", text: "Coupon maths: percentage and flat coupons, stacking rules, rounding to 2 decimals", explanation: "Pure function with many edge cases: fast unit tests." },
          { id: "i2", text: "POST /orders returns 422 when the cart is empty and 409 when an item is out of stock", explanation: "Exercises routing, validation and the database together: an API test against a test DB." },
          { id: "i3", text: "A guest can add an item, enter an address, pay with a Stripe test card and see the confirmation page", explanation: "The single critical user journey across the whole stack belongs in a small E2E suite." },
          { id: "i4", text: "The price formatter shows ₹1,499.00 and $14.99 for the right locales", explanation: "Pure formatting logic: unit." },
          { id: "i5", text: "The Stripe webhook handler marks the order paid exactly once when the same event arrives twice", explanation: "Needs the real handler and database with a signed fake event: integration." },
          { id: "i6", text: "Creating an order and its line items happens in one transaction (no orphan order if a line item insert fails)", explanation: "Transaction behaviour needs a real database: integration." },
          { id: "i7", text: "The cart reducer removes an item and recalculates the subtotal", explanation: "Pure state logic: unit." },
        ],
        answer: { i1: "unit", i2: "integration", i3: "e2e", i4: "unit", i5: "integration", i6: "integration", i7: "unit" },
      },
    },
  },
  {
    id: "eng-playwright-flaky-test",
    departmentId: "engineering",
    title: "Debug and fix a failing Playwright end-to-end test",
    statement: "Can run a single Playwright test, use the trace or report to see why it fails, and fix it with role-based locators and web-first assertions instead of sleeps.",
    skillIds: ["eng-testing-e2e", "eng-debugging"],
    level: 3,
    aliases: ["playwright", "e2e test", "flaky test", "end to end"],
    capstone: {
      kind: "task",
      title: "Fix the red checkout E2E test",
      task: {
        kind: "terminal",
        title: "Fix the red checkout E2E test",
        prompt:
          "The checkout E2E test has failed on every run since the design refresh. Run just that spec, open the trace/report to see what the page looked like, then fix tests/checkout.spec.ts: the button was renamed to 'Place order', and the hard-coded 3-second sleep must go (it is what made the test flaky before). Run the spec again.",
        cwd: "~/shop-web (fix/checkout-e2e)",
        intro: "$ ls tests\ncart.spec.ts  checkout.spec.ts  login.spec.ts",
        files: [
          {
            path: "tests/checkout.spec.ts",
            content:
              "import { test, expect } from '@playwright/test';\n\ntest('guest can place an order', async ({ page }) => {\n  await page.goto('/products/whey-isolate');\n  await page.getByRole('button', { name: 'Add to cart' }).click();\n  await page.goto('/checkout');\n  await page.getByLabel('Email').fill('guest@example.com');\n  await page.waitForTimeout(3000);\n  await page.getByRole('button', { name: 'Pay now' }).click();\n  await expect(page.getByRole('heading', { name: 'Thank you for your order' })).toBeVisible();\n});\n",
          },
        ],
        steps: [
          {
            id: "run",
            goal: "Run only the checkout spec.",
            accept: [r`^npx playwright test (tests/)?checkout(\.spec\.ts)?( --project[= ]\w+| --retries[= ]0| --workers[= ]1)*$`],
            output:
              "Running 1 test using 1 worker\n  ✘  1 [chromium] › checkout.spec.ts:3:5 › guest can place an order (30.1s)\n\n    Error: locator.click: Test timeout of 30000ms exceeded.\n    Call log:\n      - waiting for getByRole('button', { name: 'Pay now' })\n\n    attachment #1: trace (application/zip)\n    test-results/checkout-guest-can-place-an-order-chromium/trace.zip\n\n  1 failed",
          },
          {
            id: "trace",
            goal: "Open the trace or the HTML report (or run in UI/debug mode).",
            accept: [r`^npx playwright (show-report|show-trace \S+)$`, r`^npx playwright test (tests/)?checkout(\.spec\.ts)? (--ui|--debug|--headed|--trace[= ]on)$`],
            output: "Trace viewer: at the timeout the checkout page shows the buttons 'Back to cart' and 'Place order'. There is no 'Pay now' button anywhere in the DOM snapshot.",
          },
          {
            id: "rerun",
            goal: "Run the spec again after fixing it.",
            accept: [r`^npx playwright test (tests/)?checkout(\.spec\.ts)?( --project[= ]\w+| --retries[= ]0| --workers[= ]1| --repeat-each[= ]\d+)*$`],
            output: "Running 1 test using 1 worker\n  ✓  1 [chromium] › checkout.spec.ts:3:5 › guest can place an order (2.4s)\n\n  1 passed (3.1s)",
          },
        ],
        fileChecks: [{ path: "tests/checkout.spec.ts", mustContain: ["Place order", "getByRole("], mustNotContain: ["Pay now", "waitForTimeout"] }],
        explanation:
          "The trace shows the page state at the failure, which beats guessing from a timeout message. Role-based locators (`getByRole('button', { name: 'Place order' })`) match what users see and auto-wait for the element, and `expect(...).toBeVisible()` retries until it passes, so fixed sleeps are unnecessary: they make tests slow when the page is fast and flaky when it is slow.",
      },
    },
  },
  {
    id: "eng-bug-report",
    departmentId: "engineering",
    title: "Reproduce a reported bug and write a clear bug report",
    statement: "Can turn a vague client complaint into a reproducible bug report with exact steps, expected versus actual result, environment and evidence.",
    skillIds: ["eng-debugging", "eng-technical-docs"],
    level: 2,
    aliases: ["bug report", "reproduce bug", "steps to reproduce", "jira bug"],
    capstone: {
      kind: "task",
      title: "Write the bug report for 'payments are broken'",
      task: {
        kind: "write",
        prompt:
          "The client emailed 'Payments are broken on the app!!'. You reproduced it: on the Android app v2.3.1 (staging), adding a coupon and then changing the quantity makes the 'Pay' button charge the pre-coupon amount; iOS v2.3.1 is fine; the API's /checkout/quote returns the correct discounted total. Write the bug report for the team's tracker.",
        context: "Reproduced on: Pixel 7, Android 15, app 2.3.1 (build 231), staging API. Coupon used: SAVE20 (20%). Cart: 2 x Protein Bar at ₹250. Expected charge after coupon: ₹400. Actual Stripe PaymentIntent amount: ₹500. Screen recording saved as android-coupon-qty.mp4.",
        wordLimit: 250,
        variant: "general",
        rubric: [
          { id: "title", label: "Specific title", description: "Title names the platform, the trigger and the effect (e.g. 'Android: changing quantity after applying a coupon charges pre-coupon total').", weight: 1 },
          { id: "steps", label: "Exact repro steps", description: "Numbered steps someone else can follow, including app version, environment, coupon and cart contents.", weight: 2 },
          { id: "expected", label: "Expected vs actual", description: "States ₹400 expected and ₹500 actual, and that iOS and the quote API are correct, which isolates the bug to the Android client.", weight: 2 },
          { id: "evidence", label: "Evidence and severity", description: "References the recording and PaymentIntent, and marks severity high because customers are overcharged.", weight: 1 },
        ],
        sampleAnswer:
          "Title: Android 2.3.1: changing quantity after applying a coupon charges the pre-coupon total\n\nEnvironment: Pixel 7, Android 15, app 2.3.1 (build 231), staging API.\nSteps:\n1. Add 1 x Protein Bar (₹250).\n2. Apply coupon SAVE20.\n3. Increase quantity to 2.\n4. Tap Pay and complete with a test card.\nExpected: charge ₹400 (₹500 − 20%), matching /checkout/quote.\nActual: PaymentIntent created for ₹500; the screen shows ₹400.\nNot affected: iOS 2.3.1; /checkout/quote returns ₹400, so the Android client appears to build the payment amount from a stale total.\nEvidence: android-coupon-qty.mp4, PaymentIntent id in the comments.\nSeverity: High (customers overcharged).",
      },
    },
  },

  // -------------------------------------------------------------------------
  // Mobile
  // -------------------------------------------------------------------------
  {
    id: "eng-rn-offline-sync",
    departmentId: "engineering",
    title: "Make a React Native screen work offline and sync later",
    statement: "Can queue writes made offline in a mobile app, coalesce them and replay them in order when connectivity returns without duplicating records.",
    skillIds: ["eng-mobile-offline", "eng-react-native"],
    level: 4,
    aliases: ["offline first", "offline sync", "react native offline", "outbox"],
    capstone: topic("Coalesce an offline outbox", "rn-networking-offline"),
  },
  {
    id: "eng-mobile-deep-links",
    departmentId: "engineering",
    title: "Route deep links and universal links to the right screen",
    statement: "Can map incoming deep links and universal/app links to app screens with parameters and handle unknown or malformed links safely.",
    skillIds: ["eng-mobile-deep-links", "eng-react-native-navigation"],
    level: 3,
    aliases: ["deep links", "universal links", "app links", "deeplink routing"],
    capstone: topic("Match deep links to screens", "mob-x-deep-links"),
  },
  {
    id: "eng-mobile-staged-rollout",
    departmentId: "engineering",
    title: "Release a mobile update with a staged rollout and a kill switch",
    statement: "Can plan a staged store rollout with feature flags, watch crash and error rates, and halt or kill a feature without a new app release.",
    skillIds: ["eng-mobile-release", "eng-mobile-performance"],
    level: 4,
    aliases: ["staged rollout", "feature flags mobile", "kill switch", "phased release"],
    capstone: topic("Simulate a staged rollout", "mob-x-release-management"),
  },
  {
    id: "eng-eas-store-release",
    departmentId: "engineering",
    title: "Build and submit a React Native app to both stores with EAS",
    statement: "Can bump an Expo app's version, run production EAS builds for iOS and Android, submit them to the stores and tag the release.",
    skillIds: ["eng-expo", "eng-mobile-release"],
    level: 3,
    aliases: ["eas build", "app store release", "play store upload", "expo submit"],
    capstone: {
      kind: "task",
      title: "Ship rider-app 1.6.0 to both stores",
      task: {
        kind: "terminal",
        title: "Ship rider-app 1.6.0 to both stores",
        prompt:
          "Release version 1.6.0 of the client's rider app (Expo SDK 52, EAS with remote build numbers). Bump the version in app.json, check the project for dependency problems, build both platforms with the production profile, submit the latest builds to App Store Connect and Google Play, then tag the release in Git.",
        cwd: "~/rider-app (release/1.6.0)",
        intro: "$ eas whoami\noyelabs-ci\n\n$ cat eas.json | grep -A3 production\n    \"production\": {\n      \"autoIncrement\": true,\n      \"channel\": \"production\"",
        files: [
          {
            path: "app.json",
            content: "{\n  \"expo\": {\n    \"name\": \"Rider\",\n    \"slug\": \"rider-app\",\n    \"version\": \"1.5.2\",\n    \"runtimeVersion\": { \"policy\": \"appVersion\" },\n    \"ios\": { \"bundleIdentifier\": \"com.client.rider\" },\n    \"android\": { \"package\": \"com.client.rider\" }\n  }\n}\n",
          },
        ],
        steps: [
          { id: "doctor", goal: "Check the project for dependency problems.", accept: [r`^npx expo-doctor(@latest)?$`, r`^npx expo install --check$`], output: "✔ Check package.json for common issues\n✔ Check dependencies for packages that should not be installed directly\n✔ Check that packages match versions required by installed Expo SDK\n\nDidn't find any issues with the project!" },
          {
            id: "build",
            goal: "Build both platforms with the production profile.",
            accept: [r`^eas build(?=.* (--platform[= ]all|-p all)( |$))(?=.* (--profile[= ]production|-e production)( |$))( --[a-z-]+([= ]\S+)?| -[pe] \S+)+$`],
            output: "✔ Incremented buildNumber from 41 to 42.\n✔ Incremented versionCode from 41 to 42.\n\n🤖 Android build finished: https://expo.dev/accounts/oyelabs/projects/rider-app/builds/a1b2...\n🍏 iOS build finished: https://expo.dev/accounts/oyelabs/projects/rider-app/builds/c3d4...",
          },
          {
            id: "submit",
            goal: "Submit the latest builds to both stores.",
            accept: [r`^eas submit(?=.* (--platform[= ]all|-p all)( |$))(?=.* --latest( |$))( --[a-z-]+([= ]\S+)?| -[pe] \S+)+$`],
            output: "✔ Submitted your app to Apple App Store Connect!\n✔ Submitted your app to Google Play Store! (track: internal)",
          },
          { id: "tag", goal: "Tag the release in Git.", accept: [r`^git tag (-a |-s )?v?1\.6\.0( (-m|--message) ["'].+["'])?$`], output: "$ git tag -l 'v1.6*'\nv1.6.0" },
        ],
        fileChecks: [{ path: "app.json", mustContain: ["\"1.6.0\""], mustNotContain: ["\"1.5.2\""] }],
        explanation:
          "The user-facing version lives in app.json, while the store build numbers are incremented by EAS (autoIncrement), so you never resubmit a duplicate build number. With runtimeVersion tied to appVersion, OTA updates for 1.5.x will not be sent to 1.6.0 binaries. expo-doctor catches SDK-mismatched native packages before you spend 30 minutes building. Submitting to an internal or test track first, then promoting, is the safe default for a client app.",
      },
    },
  },
  {
    id: "eng-mobile-push-debug",
    departmentId: "engineering",
    title: "Debug push notifications that don't arrive",
    statement: "Can trace a missing push notification through permission, token registration, provider credentials and payload, and fix the broken link.",
    skillIds: ["eng-mobile-push", "eng-debugging"],
    level: 3,
    aliases: ["push notifications", "fcm", "apns", "notifications not working"],
    capstone: {
      kind: "task",
      title: "Find why iOS users stopped getting order updates",
      task: {
        kind: "scenario",
        prompt:
          "A white-label grocery app (React Native + Firebase Cloud Messaging) stopped delivering order-status pushes to iOS users after the client moved the app to their own Apple developer account last week. Android pushes still arrive. The backend logs show FCM accepting the send requests.",
        steps: [
          {
            id: "a",
            question: "What is the most likely cause to check first?",
            options: [
              "The notification text is too long",
              "The APNs auth key in Firebase still belongs to the old Apple team, so FCM cannot deliver to the app now signed by the new team",
              "Android and iOS use different JSON",
              "The backend's server is in the wrong region",
            ],
            correctIndex: 1,
            explanation: "FCM relays to Apple through the APNs key or certificate configured in the Firebase project. After moving Apple teams, the key, team id and bundle id must match the new account.",
          },
          {
            id: "b",
            question: "You upload the new team's APNs key. Some users still get nothing. Why?",
            options: [
              "Push tokens issued under the old setup may be invalid; the app must re-register on launch and send the fresh token to the backend, which should replace (not append) stale tokens",
              "Apple delays pushes by a week",
              "FCM needs a restart",
              "iOS only receives pushes over Wi-Fi",
            ],
            correctIndex: 0,
            explanation: "Tokens change after reinstall, restore or re-signing. Always refresh the token on app start and prune tokens that FCM reports as unregistered.",
          },
          {
            id: "c",
            question: "How do you confirm the fix before telling the client?",
            options: [
              "Ask the client to check tomorrow",
              "Send a test push to a TestFlight/production build on a real device with a known fresh token, and check FCM's send response and delivery reports",
              "Test on the iOS simulator only",
              "Check that the Android app still works",
            ],
            correctIndex: 1,
            explanation: "Production APNs delivery must be verified on a real device running a build signed for production; the simulator and Android tell you nothing about it.",
          },
        ],
      },
    },
  },

  // -------------------------------------------------------------------------
  // Architecture & white-label
  // -------------------------------------------------------------------------
  {
    id: "eng-white-label-config",
    departmentId: "engineering",
    title: "Onboard a new client onto a white-label app without forking the code",
    statement: "Can set up a new white-label tenant through configuration (branding, features, payment keys, data isolation) instead of copying the codebase.",
    skillIds: ["eng-multi-tenancy", "eng-secrets-config"],
    level: 4,
    aliases: ["white label", "multi tenant", "tenant config", "rebrand app"],
    capstone: {
      kind: "task",
      title: "Configure tenant #14 of the delivery platform",
      task: {
        kind: "scenario",
        prompt:
          "Oyelabs' white-label delivery platform serves 13 clients from one codebase (Laravel API with a tenant_id on every table, a React admin, and React Native apps built per client from a config file). Client 14 (Dubai) wants their brand colours, Arabic RTL, cash on delivery switched off, their own Stripe account, and 'a custom loyalty points feature'.",
        steps: [
          {
            id: "a",
            question: "How should you deliver branding, RTL, and turning cash on delivery off?",
            options: [
              "Fork the repo for client 14",
              "Tenant configuration: theme tokens, locale/RTL settings and feature flags stored per tenant and read at runtime/build time",
              "if (tenantId === 14) branches in the code",
              "Ask the client to use the default brand",
            ],
            correctIndex: 1,
            explanation: "Forks and tenant-specific branches multiply maintenance across 14 clients. Configuration and feature flags keep one codebase.",
          },
          {
            id: "b",
            question: "Where do client 14's Stripe keys go?",
            options: [
              "In the shared .env file, as STRIPE_KEY_14",
              "In the mobile app bundle",
              "In a per-tenant secret store (encrypted per-tenant settings or a secrets manager), loaded by tenant at request time, never shipped to clients",
              "In the tenants table as plain text",
            ],
            correctIndex: 2,
            explanation: "Each tenant's payment secrets must be isolated and encrypted at rest; secret keys never ship in an app bundle.",
          },
          {
            id: "c",
            question: "How do you handle 'custom loyalty points'?",
            options: [
              "Build it only for client 14 in a fork",
              "Scope it as a change request; if built, build it as a platform feature behind a flag, so other tenants can enable it later",
              "Refuse because the platform is fixed",
              "Tell the developer to add it quickly without an estimate",
            ],
            correctIndex: 1,
            explanation: "New features on a white-label platform should become flag-gated platform capabilities with a priced change request, not one-off forks.",
          },
        ],
      },
    },
  },
  {
    id: "eng-fullstack-capstone",
    departmentId: "engineering",
    title: "Ship a deployed, authenticated full-stack app end to end",
    statement: "Can build and ship a full-stack app where auth, data access rules, API behaviour and deployment configuration all hold up under realistic edge cases.",
    skillIds: ["eng-fullstack-delivery", "eng-auth-sessions-jwt", "eng-rest-api-design"],
    level: 5,
    aliases: ["full stack capstone", "end to end app", "ship an app"],
    capstone: topic("Full-stack capstone: notes API", "fscap-capstone"),
  },
  {
    id: "eng-env-config",
    departmentId: "engineering",
    title: "Validate environment configuration at startup",
    statement: "Can load and validate environment variables at boot so a misconfigured deploy fails fast with a clear message instead of failing at runtime.",
    skillIds: ["eng-secrets-config"],
    level: 2,
    aliases: ["env vars", "dotenv", "config validation", "environment variables"],
    capstone: topic("Parse and validate .env files", "fscap-env-secrets"),
  },

  // -------------------------------------------------------------------------
  // AI-driven development (L1 → L5)
  // -------------------------------------------------------------------------
  {
    id: "eng-ai-scoped-prompt",
    departmentId: "engineering",
    title: "Write a scoped prompt for an AI coding task",
    statement: "Can write a coding prompt for an AI assistant that states the goal, the files in scope, constraints, what not to touch and how to verify the result.",
    skillIds: ["eng-ai-prompting-for-code", "eng-prompt-engineering"],
    level: 1,
    aliases: ["prompt for code", "ai prompt", "copilot prompt", "claude prompt"],
    capstone: {
      kind: "task",
      title: "Turn a vague request into a scoped coding prompt",
      task: {
        kind: "write",
        prompt:
          "A teammate's prompt to Claude Code was: 'add validation to the signup'. The result rewrote the whole auth module. Rewrite the prompt so the AI makes only the intended change. Context: Laravel 11 API; signup is POST /api/register handled by RegisterController@store; you want a RegisterRequest form request with: name required max 80, email required unique in users, password min 12 with confirmation; return Laravel's standard 422 JSON; add Pest tests; do not change the User model, routes or other controllers.",
        wordLimit: 200,
        variant: "general",
        rubric: [
          { id: "goal", label: "Clear goal", description: "States the exact outcome: a RegisterRequest with the listed rules used by RegisterController@store.", weight: 1 },
          { id: "scope", label: "Scope and boundaries", description: "Names the files to create/edit and explicitly forbids touching the User model, routes and other controllers.", weight: 2 },
          { id: "rules", label: "Concrete constraints", description: "Lists every validation rule and the expected 422 response format.", weight: 1 },
          { id: "verify", label: "Verification", description: "Asks for Pest tests covering valid input and each failing rule, and to run them and report results.", weight: 2 },
        ],
        sampleAnswer:
          "Goal: add request validation to signup in this Laravel 11 API.\nScope: create app/Http/Requests/RegisterRequest.php and type-hint it in RegisterController@store. Do not modify the User model, routes/api.php or any other controller. If something else seems to need changing, stop and ask.\nRules: name required|string|max:80; email required|email|unique:users,email; password required|string|min:12|confirmed. Failures must return Laravel's default 422 JSON (message + errors).\nTests: add tests/Feature/RegisterValidationTest.php (Pest) covering a valid signup (201) and one failing case per rule. Run `php artisan test --filter=RegisterValidation` and show me the output and the diff.",
      },
    },
  },
  {
    id: "eng-ai-claude-md",
    departmentId: "engineering",
    title: "Write a CLAUDE.md for an existing project",
    statement: "Can write a concise context file (CLAUDE.md / AGENTS.md) that gives an AI agent the commands, architecture, conventions and hard rules it needs for a repo.",
    skillIds: ["eng-ai-context-files", "eng-ai-claude-code"],
    level: 2,
    aliases: ["claude.md", "agents.md", "context file", "cursor rules"],
    capstone: {
      kind: "task",
      title: "Write CLAUDE.md for the clinic booking API",
      task: {
        kind: "write",
        prompt:
          "Write the CLAUDE.md for the clinic booking API repo so Claude Code works the way the team does. Use the facts in the context. Keep it short and specific: an agent reads it on every session.",
        context:
          "Laravel 11, PHP 8.3, MySQL 8, Pest tests, Laravel Pint for formatting, Larastan level 6. Run locally with Sail (`./vendor/bin/sail up -d`). Tests: `./vendor/bin/sail test`. Business logic lives in app/Actions (one class per use case); controllers stay thin. API responses always go through API Resources. All times are stored in UTC and converted to the clinic's timezone only in resources. Never edit existing migrations, add new ones. Never commit .env or touch config/services.php secrets. PRs need passing Pint, Larastan and tests. The client is in Australia: dates in API output are ISO 8601.",
        wordLimit: 300,
        variant: "general",
        rubric: [
          { id: "commands", label: "Exact commands", description: "Lists how to start, test, format (Pint) and type-check (Larastan) using the real commands.", weight: 2 },
          { id: "architecture", label: "Architecture and conventions", description: "States Actions for logic, thin controllers, API Resources, UTC storage and ISO 8601 output.", weight: 2 },
          { id: "rules", label: "Hard rules", description: "Never edit existing migrations, never commit .env or secrets; clearly marked as rules, not suggestions.", weight: 2 },
          { id: "concise", label: "Concise and scannable", description: "Short headed sections or bullets with no generic filler ('write clean code') that wastes the agent's context.", weight: 1 },
        ],
        sampleAnswer:
          "# Clinic booking API\nLaravel 11 · PHP 8.3 · MySQL 8 · Pest\n\n## Commands\n- Start: `./vendor/bin/sail up -d`\n- Test: `./vendor/bin/sail test`\n- Format: `./vendor/bin/sail pint`\n- Static analysis: `./vendor/bin/sail php vendor/bin/phpstan analyse` (Larastan level 6)\nBefore finishing a task, run all three and fix failures.\n\n## Architecture\n- Business logic: app/Actions, one class per use case. Controllers only validate (FormRequest), call an Action and return a Resource.\n- Every API response goes through an API Resource.\n- Store times in UTC; convert to the clinic timezone only inside Resources; output ISO 8601.\n\n## Rules\n- NEVER edit an existing migration; add a new one.\n- NEVER commit .env or change secrets in config/services.php.\n- Add or update Pest tests for every behaviour change.",
      },
    },
  },
  {
    id: "eng-ai-copilot-tests",
    departmentId: "engineering",
    title: "Generate unit tests with an AI assistant and harden them",
    statement: "Can use Copilot or Claude to draft unit tests, then spot tests that assert the wrong thing, mirror the implementation or miss edge cases, and fix them.",
    skillIds: ["eng-ai-assisted-testing", "eng-unit-testing", "eng-ai-copilot"],
    level: 2,
    aliases: ["ai tests", "copilot tests", "generate tests", "ai unit tests"],
    capstone: {
      kind: "task",
      title: "Spot the weak AI-generated tests",
      task: {
        kind: "spot",
        prompt:
          "Copilot generated these Vitest tests for applyCoupon(subtotal, coupon), which must: apply percentage or flat coupons, never go below 0, round to 2 decimals and throw on expired coupons. Mark every test line that is wrong, meaningless or tests the implementation instead of the behaviour.",
        segments: [
          { id: "t1", text: "it('applies 10% off', () => expect(applyCoupon(200, { type: 'percent', value: 10 })).toBe(180));", issue: null },
          { id: "t2", text: "it('applies a flat coupon', () => expect(applyCoupon(200, { type: 'flat', value: 50 })).toBe(150));", issue: null },
          { id: "t3", text: "it('calculates correctly', () => expect(applyCoupon(99.99, c)).toBe(99.99 - 99.99 * c.value / 100));", issue: "Re-computes the expected value with the same formula as the implementation, so it can never fail; and rounding is not checked." },
          { id: "t4", text: "it('never goes below zero', () => expect(applyCoupon(30, { type: 'flat', value: 50 })).toBe(0));", issue: null },
          { id: "t5", text: "it('handles expired coupons', () => expect(applyCoupon(100, expired)).toBeDefined());", issue: "Asserts nothing useful: the spec says it must throw, so this should be expect(() => ...).toThrow()." },
          { id: "t6", text: "it('rounds to 2 decimals', () => expect(applyCoupon(19.99, { type: 'percent', value: 15 })).toBe(16.99));", issue: null },
          { id: "t7", text: "it('calls Math.round once', () => { const spy = vi.spyOn(Math, 'round'); applyCoupon(10, pct10); expect(spy).toHaveBeenCalledTimes(1); });", issue: "Tests an implementation detail; a correct refactor would break it without any behaviour change." },
          { id: "t8", text: "it('returns subtotal with no coupon', () => expect(applyCoupon(120, null)).toBe(120));", issue: null },
        ],
        askExplanation: true,
      },
    },
  },
  {
    id: "eng-ai-claude-code-feature",
    departmentId: "engineering",
    title: "Use Claude Code to plan, implement and test a feature in an existing repo",
    statement: "Can drive Claude Code through plan, implement and test on a real repo: scope the task, review and adjust the plan, keep changes small, run the tests and review the diff before committing.",
    skillIds: ["eng-ai-claude-code", "eng-ai-context-files", "eng-ai-reviewing-diffs", "eng-ai-assisted-testing"],
    level: 3,
    aliases: ["claude code", "agentic coding", "ai feature development", "plan mode"],
    capstone: {
      kind: "task",
      title: "Add CSV export to the admin with Claude Code",
      task: {
        kind: "scenario",
        prompt:
          "You must add 'Export orders to CSV' (date range filter, max 50k rows) to a client's existing Laravel + React admin using Claude Code. The repo has a CLAUDE.md with commands and conventions, ~400 tests and a CI pipeline.",
        steps: [
          {
            id: "a",
            question: "How do you start the session?",
            options: [
              "Prompt 'build CSV export' and accept whatever it writes",
              "Start in plan mode with a scoped request (endpoint, filters, row limit, streaming, where the button goes, tests expected), let it read the relevant code, and review and correct the plan before any edits",
              "Paste the whole codebase into the chat first",
              "Ask it to write the tests after you merge",
            ],
            correctIndex: 1,
            explanation: "Planning first, with explicit scope and constraints, catches wrong assumptions (e.g. loading 50k rows into memory) before code exists. Reviewing the plan is cheap; reviewing a 900-line diff is not.",
          },
          {
            id: "b",
            question: "The plan proposes a new ExportService, a queue job, changes to the Order model and a new npm CSV library on the frontend. What do you do?",
            options: [
              "Approve it all: more is better",
              "Trim it: keep a streamed response (or a queued job if needed) in the existing Actions pattern, no Order model changes, no new frontend dependency since the server produces the file; then let it implement in small steps",
              "Cancel and write it yourself",
              "Approve, but tell it to skip tests to save tokens",
            ],
            correctIndex: 1,
            explanation: "Agents tend to over-build. You own the design: follow the repo's conventions, avoid unnecessary dependencies and model changes, and keep the diff reviewable.",
          },
          {
            id: "c",
            question: "Claude reports 'All done, tests pass'. What is your last step before opening the PR?",
            options: [
              "Open the PR straight away",
              "Run the test suite and linters yourself, read the full diff (auth on the endpoint, row limit enforced, no secrets, no unrelated edits), try the export manually, then commit with a clear message",
              "Ask Claude whether it is sure",
              "Squash everything and force-push to main",
            ],
            correctIndex: 1,
            explanation: "The agent's summary is a claim, not evidence. You run the checks, read every line of the diff and test the feature yourself because you are accountable for what ships.",
          },
        ],
      },
    },
  },
  {
    id: "eng-ai-review-generated-code",
    departmentId: "engineering",
    title: "Review AI-generated code and catch its mistakes",
    statement: "Can review an AI-generated diff line by line and catch security holes, hallucinated APIs, silent behaviour changes and missing error handling before it merges.",
    skillIds: ["eng-ai-reviewing-diffs", "eng-code-review", "eng-ai-antipatterns"],
    level: 3,
    aliases: ["review ai code", "ai code review", "hallucinated api", "ai diff review"],
    capstone: {
      kind: "task",
      title: "Review an AI-written file upload endpoint",
      task: {
        kind: "spot",
        prompt:
          "An AI assistant wrote this Express endpoint for uploading a user's profile photo to S3. Mark every line with a real defect (security, correctness or a hallucinated API).",
        segments: [
          { id: "l1", text: "router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res, next) => {", issue: null },
          { id: "l2", text: "  const ext = req.file.originalname.split('.').pop();", issue: "Trusts the client's file name/extension and does not check req.file exists or validate MIME type and size." },
          { id: "l3", text: "  const key = `avatars/${req.body.userId}.${ext}`;", issue: "Uses userId from the request body, so any user can overwrite another user's avatar (IDOR); use req.user.id." },
          { id: "l4", text: "  try {", issue: null },
          { id: "l5", text: "    await s3.send(new PutObjectCommand({ Bucket: process.env.AVATAR_BUCKET, Key: key, Body: req.file.buffer, ContentType: req.file.mimetype }));", issue: null },
          { id: "l6", text: "    const url = await s3.getPublicUrlAsync(key);", issue: "Hallucinated API: the AWS SDK v3 S3 client has no getPublicUrlAsync; build the CDN URL or use a presigned URL." },
          { id: "l7", text: "    await users.update(req.user.id, { avatarUrl: url });", issue: null },
          { id: "l8", text: "    res.status(201).json({ avatarUrl: url });", issue: null },
          { id: "l9", text: "  } catch (err) {", issue: null },
          { id: "l10", text: "    res.status(200).json({ ok: false });", issue: "Swallows the error and returns 200, hiding failures from clients and logs; pass it to next(err)." },
          { id: "l11", text: "  }", issue: null },
          { id: "l12", text: "});", issue: null },
        ],
        askExplanation: true,
      },
    },
  },
  {
    id: "eng-ai-safe-debugging",
    departmentId: "engineering",
    title: "Use AI to debug a production error without leaking client data",
    statement: "Can use an AI assistant to diagnose a production error from logs and code while redacting secrets and personal data, and verify the suggested fix with a failing test first.",
    skillIds: ["eng-ai-assisted-debugging", "eng-debugging", "eng-ai-antipatterns"],
    level: 3,
    aliases: ["ai debugging", "debug with claude", "debug with chatgpt", "redact logs"],
    capstone: {
      kind: "task",
      title: "Debug a payout crash with an AI assistant",
      task: {
        kind: "scenario",
        prompt:
          "A US client's payout job crashes nightly with 'TypeError: Cannot read properties of undefined (reading 'iban')'. The log excerpt includes vendor names, emails, partial bank details and the Stripe secret key from a misconfigured debug line. You want help from an AI assistant.",
        steps: [
          {
            id: "a",
            question: "What do you share with the assistant?",
            options: [
              "The full raw log and the .env file, so it has all context",
              "The stack trace and the relevant code, with personal data, bank details and the key redacted, using the company-approved AI tool under the client's data agreement",
              "Nothing: AI must never be used for debugging",
              "Only the error message, with no code",
            ],
            correctIndex: 1,
            explanation: "Give the model what it needs (stack trace, code paths, data shape) and nothing it does not: no secrets, no personal or financial data, and only through approved tools. (Also: rotate that key, it has been logged.)",
          },
          {
            id: "b",
            question: "The assistant suggests `vendor.bankAccount?.iban ?? ''`. What do you do?",
            options: [
              "Apply it: the crash goes away",
              "Find why bankAccount is missing (vendors who have not finished onboarding), write a failing test for that case, then decide the right behaviour (skip and report the vendor, not pay to an empty IBAN) and make the test pass",
              "Ask the AI for a different fix until one looks right",
              "Wrap the whole job in try/catch",
            ],
            correctIndex: 1,
            explanation: "Optional chaining hides the symptom and could create payouts with an empty IBAN. Reproduce with a test, fix the business behaviour, and keep the AI as a helper rather than the decision maker.",
          },
        ],
      },
    },
  },
  {
    id: "eng-ai-llm-tool-calling",
    departmentId: "engineering",
    title: "Add an LLM feature that calls your app's functions",
    statement: "Can implement the tool-calling loop for an LLM feature: send tools, execute the requested calls, return results and stop safely on errors or loops.",
    skillIds: ["eng-structured-output", "eng-llm-api", "eng-ai-agents"],
    level: 3,
    aliases: ["tool calling", "function calling", "llm integration", "ai feature"],
    capstone: topic("Run the agent tool-calling loop", "agents-tool-calling-fundamentals"),
  },
  {
    id: "eng-ai-prompt-injection",
    departmentId: "engineering",
    title: "Find prompt-injection and data-leak risks in an LLM feature",
    statement: "Can review an LLM feature's design and spot prompt-injection paths, over-privileged tools and data leaks, and name the guardrail for each.",
    skillIds: ["eng-llm-guardrails", "eng-ai-agents", "eng-owasp"],
    level: 4,
    aliases: ["prompt injection", "llm security", "ai guardrails", "agent security"],
    capstone: {
      kind: "task",
      title: "Review a support-bot design for injection risks",
      task: {
        kind: "spot",
        prompt: "This is the design of an AI support assistant for a client's e-commerce site. Mark every line that creates a prompt-injection, privilege or data-leak risk.",
        segments: [
          { id: "d1", text: "The assistant answers customers' questions about their own orders in the website chat.", issue: null },
          { id: "d2", text: "The system prompt includes the admin API key so the model can call any endpoint it needs.", issue: "Secrets in the prompt can be extracted by the user; tools should run server-side with their own scoped credentials." },
          { id: "d3", text: "Tool get_order(order_id) returns any order by id.", issue: "No ownership check: a user can ask for someone else's order. Scope tools to the authenticated customer server-side." },
          { id: "d4", text: "Product reviews written by customers are added to the context to answer product questions.", issue: "Untrusted content in the context can carry injected instructions; mark it as data and do not let it trigger privileged tools." },
          { id: "d5", text: "Tool issue_refund(order_id, amount) runs immediately when the model calls it.", issue: "A high-impact action without a human or policy check; require confirmation or limits enforced in code." },
          { id: "d6", text: "Responses are streamed to the customer's browser.", issue: null },
          { id: "d7", text: "Conversations are logged with personal data removed, for evaluation.", issue: null },
          { id: "d8", text: "The model's answer is rendered as Markdown with HTML sanitised.", issue: null },
          { id: "d9", text: "If the model is unsure, it hands over to a human agent.", issue: null },
          { id: "d10", text: "Rate limits apply per customer session.", issue: null },
        ],
        askExplanation: true,
      },
    },
  },
  {
    id: "eng-ai-rag-retrieval",
    departmentId: "engineering",
    title: "Improve RAG answers with hybrid retrieval and reranking",
    statement: "Can combine keyword and vector search results with reciprocal rank fusion and reranking so a RAG feature retrieves the right chunks.",
    skillIds: ["eng-rag", "eng-rag-chunking-reranking", "eng-embeddings"],
    level: 4,
    aliases: ["rag", "hybrid search", "reranking", "retrieval augmented generation"],
    capstone: topic("Implement reciprocal rank fusion", "rag-retrieval-reranking"),
  },
  {
    id: "eng-ai-agent-delivery-pipeline",
    departmentId: "engineering",
    title: "Design a multi-agent workflow for delivering a feature",
    statement: "Can design a multi-agent delivery workflow (planner, parallel implementers in isolated worktrees, reviewer, test gate, human approval) and order its gates so nothing unreviewed ships.",
    skillIds: ["eng-ai-reusable-skills", "eng-ai-claude-code", "eng-ai-reviewing-diffs", "eng-ci-cd"],
    level: 5,
    aliases: ["multi agent", "agent workflow", "ai pipeline", "parallel agents", "ai delivery"],
    capstone: {
      kind: "task",
      title: "Order the gates of a multi-agent delivery workflow",
      task: {
        kind: "rank",
        prompt:
          "Oyelabs wants a repeatable AI-driven workflow for medium features on client repos: a planning agent, parallel implementation agents, a review agent and CI. Order the stages from first to last so work is scoped before it is built, agents never clobber each other, and nothing reaches the client's main branch without human sign-off.",
        items: [
          { id: "spec", label: "Engineer writes the ticket's acceptance criteria and checks the repo's CLAUDE.md is current" },
          { id: "plan", label: "Planning agent reads the code and proposes a task breakdown; the engineer edits and approves it" },
          { id: "parallel", label: "Implementation agents work in parallel, each in its own git worktree and branch, on one approved sub-task" },
          { id: "tests", label: "Each branch must pass the full test suite, lint and type checks locally/CI" },
          { id: "review", label: "A review agent checks each diff against the plan and conventions; the engineer reads every diff" },
          { id: "integrate", label: "Branches are merged into a feature branch and the integrated build is tested again" },
          { id: "human", label: "Human PR review and approval, then merge to main and deploy via the normal pipeline" },
        ],
        correctOrder: ["spec", "plan", "parallel", "tests", "review", "integrate", "human"],
        explanation:
          "Agents amplify whatever they are given, so the criteria and context come first, then an approved plan. Worktrees isolate parallel agents. Automated checks are a cheap filter before any review time is spent; review (agent plus human reading the diff) happens per branch; the integrated result is tested again because parallel changes can conflict semantically; and a human remains accountable for what merges to the client's main.",
      },
    },
  },
] satisfies PracticalOutcomeSeed[];
