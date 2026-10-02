import type { Module } from "@/types/curriculum";

export default {
  id: "pma-github",
  trackId: "pm",
  name: "Git & GitHub for PMs",
  description:
    "Git and GitHub for project managers who never write code: what repos, branches, commits and pull requests are, how to read a PR's reviews and checks, how tickets link to code, releases and versions, which branch deploys where, and the questions to ask before a client release.",
  refs: [
    { label: "GitHub Docs: GitHub flow", url: "https://docs.github.com/en/get-started/using-github/github-flow", kind: "docs", verifiedAt: "2026-10-02T09:35:33Z" },
    { label: "GitHub Docs: Pull requests", url: "https://docs.github.com/en/pull-requests/reference/pull-requests", kind: "docs", verifiedAt: "2026-10-02T09:35:26Z" },
  ],
  topics: [
    // ---------------------------------------------------------------------------------------
    {
      id: "pma-repo-branch-commit-pr",
      moduleId: "pma-github",
      trackId: "pm",
      title: "Repo, branch, commit, PR",
      summary:
        "Every project we build, whether a Laravel API for a US logistics client or a React dashboard for a UK startup, lives in a Git repository on GitHub. You will never need to write code. But you will hear four words in every stand-up: repo, branch, commit and pull request. If you know what they mean, you can follow what the team is really doing and ask better questions when a release slips.\n\nA **repository** (repo) is the project's folder plus its full history: every file, every change, who made it and when. A **commit** is one saved set of changes with a short message, like \"Add password reset email\". A **branch** is a separate line of work. A developer creates `feature/password-reset` from `main`, so they can work without breaking the version that is live or about to ship. A **pull request** (PR) asks to merge that branch back into `main`. It is where teammates review the code and where automated checks, such as tests, run.\n\nHow to use this as a PM:\n\n1. Ask for read access to the client's repos, so you can look at PRs yourself instead of interrupting developers.\n2. Expect every ticket in progress to have a branch or a PR. That is the evidence behind \"in progress\".\n3. Treat \"the code is done\" as \"the PR is merged\", not \"the developer has stopped typing\".\n\nThe common mistake is reporting a feature as done because a developer says \"I committed it\". A commit on a feature branch is invisible to the client. Until the PR is reviewed, merged and deployed, nothing has changed for them. In client updates, say \"in code review\" or \"merged, waiting for the next deploy\". Those words are accurate and set the right expectation.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "GitHub Docs: About repositories", url: "https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories", kind: "docs", verifiedAt: "2026-10-02T09:35:44Z" },
        { label: "GitHub Docs: GitHub flow", url: "https://docs.github.com/en/get-started/using-github/github-flow", kind: "docs", verifiedAt: "2026-10-02T09:35:33Z" },
        { label: "GitHub Docs: Branches", url: "https://docs.github.com/en/pull-requests/reference/branches", kind: "docs", verifiedAt: "2026-10-02T09:35:20Z" },
        { label: "Atlassian Git tutorial: What is Git", url: "https://www.atlassian.com/git/tutorials/what-is-git", kind: "article", verifiedAt: "2026-10-02T09:35:28Z" },
      ],
      video: {
        title: "Git Explained in 100 Seconds",
        channel: "Fireship",
        url: "https://www.youtube.com/watch?v=hwP7WQkmECE",
        videoId: "hwP7WQkmECE",
        verifiedAt: "2026-10-02T09:35:58Z",
      },
      alternateVideos: [
        {
          title: "A brief introduction to Git for beginners | GitHub",
          channel: "GitHub",
          url: "https://www.youtube.com/watch?v=r8jQ9hVA2qs",
          videoId: "r8jQ9hVA2qs",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-repo-branch-commit-pr-q1",
          prompt: "A developer on a Laravel project says \"I committed the login fix this morning.\" The client asks you if the fix is live. What is the accurate answer?",
          options: [
            "Not yet: a commit is saved work on a branch, and it still needs review, merging and a deployment",
            "Yes: committing a change publishes it to production",
            "Yes, as long as the commit message mentions the ticket number",
            "No, because commits only exist on the developer's laptop and never reach GitHub",
          ],
          correctIndex: 0,
          explanation:
            "Commits can be pushed to GitHub, but being in the repo is not the same as being deployed. A change reaches the client only after the PR is merged and the merged code is deployed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-repo-branch-commit-pr-q2",
          prompt: "Which statements describe a pull request? (Select all that apply.)",
          options: [
            "It asks to merge one branch into another, usually into main",
            "It is where reviewers comment on the changes and approve them",
            "Automated checks, such as tests, run against it",
            "It is a client's request for a new feature",
            "It deploys the code to production as soon as it is opened",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A PR is a request to merge a branch, with review and checks attached. It is not a client request, and opening one deploys nothing.",
        },
        {
          id: "pma-repo-branch-commit-pr-q3",
          prompt: "Why do developers work on branches instead of committing straight to main?",
          options: [
            "So unfinished work does not break the version that is live or about to ship",
            "Because GitHub allows only one commit per day on main",
            "So the client cannot see the code",
            "Because branches make the app run faster",
          ],
          correctIndex: 0,
          explanation:
            "A branch isolates work in progress. Main stays in a releasable state, and the work joins it only after review. Visibility and speed have nothing to do with it.",
        },
        {
          id: "pma-repo-branch-commit-pr-q4",
          prompt:
            "Two features for a React app are \"done\" according to the developers. Feature A's PR was merged yesterday; nothing has been deployed since. Feature B's PR is still open for review. How do you describe them in the weekly client email?",
          options: [
            "Feature A is merged and goes out with the next deploy; feature B is in code review",
            "Both features are done",
            "Both features are still in progress, with no detail",
            "Feature B is done and feature A is in QA",
          ],
          correctIndex: 0,
          explanation:
            "Precise status words prevent the client from testing something that is not deployed yet. \"Done\" for both overstates; \"in progress\" for both hides real progress.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-repo-branch-commit-pr-q5",
          prompt: "What does a Git repository hold?",
          options: [
            "The project's files plus the full history of every change, who made it and when",
            "Only the latest version of the code",
            "The production database with the client's customer data",
            "The client's Jira board and its tickets",
          ],
          correctIndex: 0,
          explanation:
            "The history is the point of Git: it lets the team see, compare and undo changes. The database and the ticket board live elsewhere.",
        },
      ],
      practice: {
        kind: "write",
        variant: "explain",
        prompt:
          "On a weekly call, the non-technical founder of a fitness app asks: \"What is a pull request, and why is my feature stuck in one?\" Write your answer in one to three plain sentences. Explain what a PR is and what has to happen before she sees the feature.",
        context:
          "Situation: the workout-sharing feature is built. Its PR is open, one reviewer has asked for changes, and the next deploy to the staging site is on Thursday.",
        wordLimit: 80,
        rubric: [
          { id: "correct", label: "Technically correct", description: "Describes a PR as a request to add finished changes to the main version after review. Does not say it is a client request or that it is live.", weight: 1.5 },
          { id: "plain", label: "Plain English", description: "No unexplained jargon (merge, branch, CI) or it is explained in everyday words. A founder with no tech background understands it.", weight: 1 },
          { id: "status", label: "Clear next step", description: "Says what has to happen next (fix the review comments, merge, deploy to staging on Thursday) so the client knows when she can see it.", weight: 1.5 },
        ],
        sampleAnswer:
          "A pull request is how a developer asks to add finished work to the main version of your app, so a teammate can check it first. The reviewer asked for a small fix to the workout-sharing feature; once that is done it will be added and you can try it on the test site after Thursday's update.",
      },
    },
    // ---------------------------------------------------------------------------------------
    {
      id: "pma-linking-tickets-to-prs",
      moduleId: "pma-github",
      trackId: "pm",
      title: "Linking tickets to PRs",
      summary:
        "A UK retail client asks: \"Which tickets are in Friday's release, and was the change request we paid for included?\" If every PR is linked to its ticket, you can answer from GitHub or Jira in five minutes. If not, you spend an afternoon asking developers, and you still might get it wrong. Linking tickets to code is what makes status reports, release notes and change-request billing traceable.\n\nThere are two common set-ups. If the team uses **Jira** with the GitHub integration, the developer puts the ticket key, such as `SHOP-142`, in the branch name, the commit message or the PR title. Jira then shows the branches, commits and PRs on the ticket. If the team uses **GitHub Issues**, a closing keyword in the PR description, such as `Closes #142` or `Fixes #142`, links the PR to the issue and closes the issue when the PR is merged into the default branch. A plain `#142` in a comment only creates a link, it does not close anything.\n\nHow to make it a habit:\n\n1. Agree one naming rule with the tech lead and write it down (your team's SOP below).\n2. Once a week, scan open PRs for ones with no ticket key and ask about them.\n3. When a ticket shows \"Done\" but has no linked PR, ask where the change lives.\n\nTwo gotchas catch PMs. First, GitHub closing keywords only work when the PR targets the default branch. A PR into `develop` that says `Fixes #88` leaves issue #88 open if the default branch is `main`. Second, a change request that is billed separately must have its own ticket key on the PR. If the developer bundles it under the original ticket, the work and its hours look like free scope.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "GitHub Docs: Linking a pull request to an issue", url: "https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue", kind: "docs", verifiedAt: "2026-10-02T09:35:46Z" },
        { label: "Atlassian Support: Reference work items in your development spaces", url: "https://support.atlassian.com/jira-software-cloud/docs/reference-issues-in-your-development-work/", kind: "docs", verifiedAt: "2026-10-02T09:35:36Z" },
        { label: "GitHub Docs: Autolinked references and URLs", url: "https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls", kind: "docs", verifiedAt: "2026-10-02T09:35:42Z" },
      ],
      video: {
        title: "How to use GitHub issues and projects | GitHub for Beginners",
        channel: "GitHub",
        url: "https://www.youtube.com/watch?v=c67GaAkf1BE",
        videoId: "c67GaAkf1BE",
        verifiedAt: "2026-10-02T09:35:58Z",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-linking-tickets-to-prs-q1",
          prompt:
            "The repo's default branch is `main`. A PR into `develop` has `Fixes #88` in its description. After it is merged into `develop`, issue #88 is still open. Why?",
          options: [
            "Closing keywords only close an issue when the PR is merged into the default branch",
            "`Fixes` is not a supported keyword; only `Closes` works",
            "The developer must also close the issue in a comment",
            "GitHub closes issues only once a day",
          ],
          correctIndex: 0,
          explanation:
            "GitHub's closing keywords apply when the PR merges into the default branch. `Fixes` is a valid keyword, so the target branch is the reason.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-linking-tickets-to-prs-q2",
          prompt: "The team uses Jira with the GitHub integration. Where can a developer put the key `SHOP-142` so the work appears on that Jira ticket? (Select all that apply.)",
          options: [
            "In the branch name, such as `feature/SHOP-142-guest-checkout`",
            "In a commit message",
            "In the pull request title",
            "In a Slack message to the PM",
            "In a comment on the Jira ticket saying \"PR raised\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Jira picks up the key from branches, commits and PR titles. A Slack message or a manual comment creates no link to the code.",
        },
        {
          id: "pma-linking-tickets-to-prs-q3",
          prompt: "The client asks which tickets are in Friday's release. With consistent ticket-to-PR linking, what is the fastest reliable way to answer?",
          options: [
            "List the PRs merged since the last release and read their linked tickets",
            "Ask each developer what they worked on this sprint",
            "Send the client every ticket marked Done in the board",
            "Read the commit messages from memory",
          ],
          correctIndex: 0,
          explanation:
            "Merged PRs are the record of what changed, and links turn them into tickets. Board status alone can include work that never reached the release.",
        },
        {
          id: "pma-linking-tickets-to-prs-q4",
          prompt: "Which line in a PR description closes issue #45 when the PR is merged into the default branch?",
          options: ["Resolves #45", "Related to #45", "See #45", "Part of #45"],
          correctIndex: 0,
          explanation:
            "Close, fix and resolve (and their variants) are GitHub's closing keywords. The others only create a link to the issue.",
        },
        {
          id: "pma-linking-tickets-to-prs-q5",
          prompt:
            "Change request CR-12 (an extra export button) is billed on top of a fixed-price Laravel project. The developer added it inside the PR for the original ticket SHOP-130. What should you do?",
          options: [
            "Ask for the CR ticket key to be added to the PR, or the work split into its own PR, so the work and its hours trace to CR-12",
            "Nothing: the code works, so the ticket does not matter",
            "Move the hours into SHOP-130 so the timesheet matches",
            "Remove the export button from the release",
          ],
          correctIndex: 0,
          explanation:
            "Billable change requests need their own trail from ticket to code to hours. Folding the CR into the original ticket makes paid work look like free scope.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-linking-tickets-to-prs-q6",
          prompt: "A reviewer writes `#123` in a PR comment. What does that do?",
          options: [
            "It creates a link to issue or PR number 123 in the same repository",
            "It closes issue 123",
            "It assigns issue 123 to the reviewer",
            "It mentions a user called 123",
          ],
          correctIndex: 0,
          explanation:
            "GitHub autolinks `#number` to the issue or PR with that number. Closing needs a keyword in the description, and users are mentioned with `@`.",
        },
        {
          id: "pma-linking-tickets-to-prs-q7",
          prompt: "A Jira ticket is in Done, but no branch, commit or PR is linked to it. What is the right next step?",
          options: [
            "Ask the developer where the change lives: it may be unmerged, a config change, or done under another key",
            "Leave it: Done means done",
            "Reopen it and reassign it to someone else",
            "Remove it from the release notes without asking",
          ],
          correctIndex: 0,
          explanation:
            "A missing link is a question, not proof of anything. There are honest reasons (a server setting, a typo in the key), and also the risk that the work was never merged.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-linking-tickets-to-prs-q8",
          prompt: "What does a PM gain from consistent ticket-to-PR linking? (Select all that apply.)",
          options: [
            "Release notes built from real merged work",
            "Proof of what a client paid for, including change requests",
            "Status answers without interrupting developers",
            "Faster code at run time",
            "No need for code review",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Linking is about traceability. It has no effect on how the app performs and does not replace review.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Before Friday's release of a Laravel shop for a UK client, you scan the merged PRs. The team rule: every PR title starts with the Jira key (format `SHOP-123`), and billable change requests use their own `CR-` key. Mark the PRs that break the rule or will cause a traceability problem.",
        segments: [
          { id: "p1", text: "PR #210: SHOP-142 Guest checkout for first-time buyers", issue: null },
          { id: "p2", text: "PR #211: SHOP-145 Fix VAT rounding on invoices", issue: null },
          { id: "p3", text: "PR #212: Quick fixes", issue: "No ticket key: nobody can tell which tickets or which release items this covers." },
          { id: "p4", text: "PR #213: SHOP 151 Order history pagination", issue: "\"SHOP 151\" with a space is not a valid key, so Jira will not link it." },
          { id: "p5", text: "PR #214: CR-12 Add CSV export to the orders page", issue: null },
          { id: "p6", text: "PR #215: SHOP-130 Admin order list, plus the bulk refund button the client asked for last week", issue: "The bulk refund button is new scope: it needs its own CR key, or the paid work is hidden under SHOP-130." },
          { id: "p7", text: "PR #216: SHOP-148 Update password reset email copy", issue: null },
          { id: "p8", text: "PR #217: SHOP-150 Upgrade Laravel packages", issue: null },
        ],
        askExplanation: true,
      },
      sop: [
        {
          title: "Our ticket key and PR naming rule",
          prompt:
            "[Oyelabs SOP – admin to fill] Where the ticket key must appear (branch name, commit, PR title), the branch naming format, how change requests are keyed, and who checks this before a release.",
        },
      ],
    },
    // ---------------------------------------------------------------------------------------
    {
      id: "pma-github-issues-projects",
      moduleId: "pma-github",
      trackId: "pm",
      title: "GitHub Issues and Projects",
      summary:
        "Most of our projects are tracked in Jira, but some clients want everything in GitHub. A US startup with its own CTO may say: \"We already use GitHub Issues; please work in our board.\" When that happens, you need to run the project in GitHub Issues and Projects as comfortably as you run it in Jira.\n\nAn **issue** is a ticket: a title, a description, labels (bug, change-request), an assignee and comments. A **milestone** groups issues and PRs for a release or a phase. It has a due date and shows the percentage of items closed. A **Project** is a planning board on top of issues. It can pull in items from several repos, for example the Laravel API repo and the React web repo, and add custom fields such as Status, Priority, Iteration, Estimate and Target date. The same items can be shown as a table, a board or a roadmap.\n\nHow to set one up for a client project:\n\n1. Create one Project for the client and add both repos' issues.\n2. Add fields: Status, Priority, Iteration and Estimate.\n3. Make views per audience: a board for the team's sprint, a roadmap by Target date for the client.\n4. Create a milestone per release and add labels for bug and change-request.\n5. Turn on the built-in workflows, such as setting Status to Done when an issue is closed.\n\nThe common mistake is running two sources of truth. If the team works in Jira and you copy tickets into GitHub for the client, the two drift within a week and the client sees an old status. Pick one system per client, or agree exactly which fields are synced and by whom. Also, a Project's Status field is separate from the issue being open or closed. Without the built-in workflow, a closed issue can still sit in \"In progress\".",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "GitHub Docs: About issues", url: "https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues", kind: "docs", verifiedAt: "2026-10-02T09:35:23Z" },
        { label: "GitHub Docs: About Projects", url: "https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects", kind: "docs", verifiedAt: "2026-10-02T09:35:36Z" },
        { label: "GitHub Docs: Quickstart for Projects", url: "https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/quickstart-for-projects", kind: "docs", verifiedAt: "2026-10-02T09:35:22Z" },
        { label: "GitHub Docs: About milestones", url: "https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/about-milestones", kind: "docs", verifiedAt: "2026-10-02T09:35:27Z" },
      ],
      video: {
        title: "How to use GitHub issues and projects | GitHub for Beginners",
        channel: "GitHub",
        url: "https://www.youtube.com/watch?v=c67GaAkf1BE",
        videoId: "c67GaAkf1BE",
        verifiedAt: "2026-10-02T09:35:58Z",
      },
      alternateVideos: [
        {
          title: "GitHub Project Management - Create GitHub Project Board & Automations 2024",
          channel: "goobar",
          url: "https://www.youtube.com/watch?v=oPQgFxHcjAw",
          videoId: "oPQgFxHcjAw",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-github-issues-projects-q1",
          prompt: "The client wants to see, on one screen, which features land in which month. Which GitHub Project view fits best?",
          options: [
            "A roadmap layout grouped by a Target date or Iteration field",
            "The repo's list of commits",
            "A board grouped by assignee",
            "The repo's README file",
          ],
          correctIndex: 0,
          explanation:
            "The roadmap layout places items on a timeline using a date or iteration field. A board by assignee shows workload, not timing.",
        },
        {
          id: "pma-github-issues-projects-q2",
          prompt: "What does a GitHub milestone show you? (Select all that apply.)",
          options: [
            "A due date",
            "The percentage of its issues and PRs that are closed",
            "Which issues and PRs are still open",
            "Hours each developer has logged",
            "The budget left on the project",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Milestones track progress of issues and PRs towards a due date. Time and money live in Keka or your sheets, not in GitHub.",
        },
        {
          id: "pma-github-issues-projects-q3",
          prompt: "An issue was closed yesterday, but the Project board still shows it under \"In progress\". What is the most likely cause?",
          options: [
            "The Project's Status field is separate from open/closed, and the built-in workflow that sets Done on close is off",
            "GitHub reopens issues automatically after a day",
            "The developer closed the wrong issue",
            "Boards only refresh once a week",
          ],
          correctIndex: 0,
          explanation:
            "Status is a Project field, not the issue's state. Turn on the built-in workflow or the board will lie to the client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-github-issues-projects-q4",
          prompt: "On a fixed-price project, why add a `change-request` label next to `bug` and `feature`?",
          options: [
            "So new scope can be filtered, estimated and approved separately from work already paid for",
            "Because GitHub requires at least three labels",
            "So developers work on change requests first",
            "To hide change requests from the client",
          ],
          correctIndex: 0,
          explanation:
            "A label makes billable new scope visible and countable. It is not about priority or hiding work.",
        },
        {
          id: "pma-github-issues-projects-q5",
          prompt:
            "The client's QA lead will file bugs straight into GitHub Issues. Last week she filed one titled \"broken\" with no details. What do you set up first?",
          options: [
            "An issue template asking for steps, expected vs actual result, device or browser and a screenshot, plus a triage label you review",
            "Give her admin access so she can assign developers herself",
            "Ask her to email bugs instead",
            "Let developers pick up whatever is filed, in order",
          ],
          correctIndex: 0,
          explanation:
            "A template gets usable bug reports, and triage lets you check severity and scope before the team picks them up. Admin access and free-for-all intake both remove that control.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-github-issues-projects-q6",
          prompt: "The client's app has one repo for the Laravel API and one for the React web app. Can a single GitHub Project track work from both?",
          options: [
            "Yes: a Project can include issues and PRs from several repositories",
            "No: each repo needs its own Project",
            "Only if the two repos are merged into one",
            "Only for PRs, not issues",
          ],
          correctIndex: 0,
          explanation: "Projects sit above repositories, which is why they suit a client with several codebases.",
        },
        {
          id: "pma-github-issues-projects-q7",
          prompt: "The team works in Jira. The client wants to see progress in GitHub. What is the safest arrangement?",
          options: [
            "Agree one source of truth, and if both are used, define exactly what is synced and who owns it",
            "Copy tickets into GitHub by hand every Friday",
            "Keep both up to date independently and hope they match",
            "Move the client to Jira without discussing it",
          ],
          correctIndex: 0,
          explanation:
            "Two hand-kept trackers drift fast, and the client then sees old status. One source of truth, or a defined sync, avoids that.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-github-issues-projects-q8",
          prompt: "Which custom Project fields are useful for running a client sprint? (Select all that apply.)",
          options: ["Priority", "Iteration (sprint)", "Estimate", "Developer's salary", "Client's credit card number"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Priority, iteration and estimate drive planning. Salary and payment data never belong on a project board, least of all one the client can see.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "A US startup with an in-house CTO hires Oyelabs to build a React web app and a Laravel API. The CTO insists all work is tracked in their GitHub organisation, not in our Jira. You are the PM.",
        steps: [
          {
            id: "s1",
            question: "How do you set up tracking for the first sprint?",
            options: [
              "One Project covering both repos, with Status, Priority, Iteration and Estimate fields, a board view for the team and a roadmap view for the client",
              "A separate Project per repo, with no custom fields",
              "Keep using Jira and send the CTO screenshots",
              "Track everything in a milestone and skip the Project",
            ],
            correctIndex: 0,
            explanation: "One Project across both repos gives one view of the client's work, with views for each audience.",
          },
          {
            id: "s2",
            question: "The client's QA lead starts filing bugs with titles like \"login broken\" and nothing else. What do you do?",
            options: [
              "Add a bug issue template and a triage label, and explain both to the QA lead",
              "Close the vague bugs without replying",
              "Ask developers to guess what she meant",
              "Ask her to stop filing bugs",
            ],
            correctIndex: 0,
            explanation: "A template gets the facts the team needs, and triage keeps you in control of what enters the sprint.",
          },
          {
            id: "s3",
            question: "The CTO files an issue: \"Add Apple Sign-In\". It was not in the agreed scope. What is your next step?",
            options: [
              "Label it change-request, get an estimate, and ask the client to approve the cost and timing before it goes into an iteration",
              "Put it straight into the current sprint because the CTO asked",
              "Ignore it until the next contract",
              "Ask a developer to build it quietly in their spare time",
            ],
            correctIndex: 0,
            explanation: "New scope is visible, estimated and approved before work starts, whichever tracker the client uses.",
          },
        ],
      },
    },
    // ---------------------------------------------------------------------------------------
    {
      id: "pma-releases-tags",
      moduleId: "pma-github",
      trackId: "pm",
      title: "Releases and tags",
      summary:
        "When a client says \"something broke after last Tuesday's update\", the first question is: which version is live, and what changed? Tags and releases answer that. They are also how you tell the client, in one line, what they are getting: \"Version 2.4.0 adds Apple Pay and fixes two invoice bugs.\"\n\nA **tag** is a fixed label on one commit, such as `v2.4.0`. Unlike a branch, it never moves, so it always points to exactly the code that shipped. A **GitHub release** is a page built on a tag. It has release notes and can carry files, such as an Android APK, and it can be marked as a pre-release. GitHub can also auto-generate release notes that list the merged PRs and the people who contributed.\n\nMost teams number versions with **Semantic Versioning**: MAJOR.MINOR.PATCH.\n\n- PATCH (2.4.0 to 2.4.1): backwards-compatible bug fixes.\n- MINOR (2.4.1 to 2.5.0): new features that do not break anything existing.\n- MAJOR (2.5.0 to 3.0.0): a breaking change, for example an API change that the old mobile app cannot handle.\n- A pre-release such as `3.0.0-rc.1` comes before `3.0.0`.\n\nHow a PM uses this: ask the team to tag every production deploy, keep a short client-facing changelog per release, and compare two tags when a bug appears \"since the last release\". The common mistake is forwarding GitHub's auto-generated notes straight to the client. They are written for developers: PR titles, branch names and internal jokes. Rewrite them into plain outcomes, grouped as new features, fixes and known issues.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "GitHub Docs: About releases", url: "https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases", kind: "docs", verifiedAt: "2026-10-02T09:35:38Z" },
        { label: "Git book: Tagging", url: "https://git-scm.com/book/en/v2/Git-Basics-Tagging", kind: "docs", verifiedAt: "2026-10-02T09:35:29Z" },
        { label: "SemVer: Semantic Versioning 2.0.0", url: "https://semver.org/", kind: "spec", verifiedAt: "2026-10-02T09:35:21Z" },
        { label: "GitHub Docs: Automatically generated release notes", url: "https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes", kind: "docs", verifiedAt: "2026-10-02T09:35:29Z" },
      ],
      video: {
        title: "Adding Tags, Versioning, and Releases in Github | Git & Source Control #13",
        channel: "Swiftful Thinking",
        url: "https://www.youtube.com/watch?v=D3W66tfYGuc",
        videoId: "D3W66tfYGuc",
        verifiedAt: "2026-10-02T09:35:58Z",
      },
      alternateVideos: [
        {
          title: "How to Create a Release on Github",
          channel: "hUndefined",
          url: "https://www.youtube.com/watch?v=4qwadZfPsik",
          videoId: "4qwadZfPsik",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-releases-tags-q1",
          prompt: "The live version is 2.3.1. The next release adds a new, optional \"save card\" feature and breaks nothing. Under SemVer, what is the new version?",
          options: ["2.4.0", "2.3.2", "3.0.0", "2.3.1.1"],
          correctIndex: 0,
          explanation: "A backwards-compatible feature bumps MINOR and resets PATCH. A PATCH bump is only for fixes; MAJOR is for breaking changes.",
        },
        {
          id: "pma-releases-tags-q2",
          prompt: "The live version is 2.3.1. The next release only fixes a VAT rounding bug. What is the new version?",
          options: ["2.3.2", "2.4.0", "3.0.0", "2.3.1-fix"],
          correctIndex: 0,
          explanation: "Backwards-compatible bug fixes bump PATCH.",
        },
        {
          id: "pma-releases-tags-q3",
          prompt:
            "The Laravel API removes a field that the version of the client's mobile app still in the stores depends on. The API is at 4.2.0. What does SemVer say the next version should be, and what does it tell you as a PM?",
          options: [
            "5.0.0: it is a breaking change, so the mobile app update and the API release must be coordinated",
            "4.3.0: it is just a change to the API",
            "4.2.1: removing a field is a small fix",
            "4.2.0 again, because no feature was added",
          ],
          correctIndex: 0,
          explanation:
            "Breaking changes bump MAJOR. For a PM the number is a warning: old app versions will break unless the release is sequenced with the store update.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-releases-tags-q4",
          prompt: "Under SemVer, which version is higher: `2.0.0-rc.1` or `2.0.0`?",
          options: [
            "`2.0.0`: a pre-release comes before its normal version",
            "`2.0.0-rc.1`, because it has extra characters",
            "They are equal",
            "SemVer cannot compare them",
          ],
          correctIndex: 0,
          explanation:
            "A pre-release version has lower precedence than the normal version. That is why release candidates go to UAT before the final number ships.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-releases-tags-q5",
          prompt: "What can a GitHub release include? (Select all that apply.)",
          options: [
            "The tag it is built on",
            "Release notes",
            "Attached files, such as an Android APK",
            "A deployment to production, all by itself, with no workflow set up",
            "The client's signature approving it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A release is a tag plus notes and assets, and can be marked as a pre-release. Creating one deploys nothing unless the team has automation for that.",
        },
        {
          id: "pma-releases-tags-q6",
          prompt: "GitHub auto-generated the notes for v2.4.0. What do you do before sending them to the client?",
          options: [
            "Rewrite them as plain outcomes (new features, fixes, known issues) and remove internal detail",
            "Forward them as they are, since they are complete",
            "Send only the list of contributors",
            "Delete them and send nothing",
          ],
          correctIndex: 0,
          explanation:
            "Auto-generated notes list PR titles and contributors, written for developers. The client needs outcomes in plain words.",
        },
        {
          id: "pma-releases-tags-q7",
          prompt: "What is the key difference between a tag and a branch?",
          options: [
            "A tag is a fixed label on one commit; a branch moves forward as new commits are added",
            "A tag can hold more files than a branch",
            "Tags are only for mobile apps",
            "A branch is permanent and a tag is deleted after a week",
          ],
          correctIndex: 0,
          explanation: "Because a tag never moves, `v2.4.0` always means exactly the code that shipped.",
        },
        {
          id: "pma-releases-tags-q8",
          prompt: "The client reports a bug that started \"after last Tuesday's release\". Production went from v2.3.0 to v2.4.0 that day. How do tags help?",
          options: [
            "The team can compare v2.3.0 with v2.4.0 to see exactly which changes could have caused it",
            "They automatically fix the bug",
            "They tell you which customer hit the bug",
            "They do not help: only the database can tell you",
          ],
          correctIndex: 0,
          explanation: "Comparing two tags narrows the search to the PRs that shipped in between, which speeds up the fix and the client answer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You run a React Native app plus Laravel API for an Australian food-delivery client. The team uses Semantic Versioning, and production is at version 1.8.2.",
        steps: [
          {
            id: "s1",
            question: "This week's release contains two bug fixes and nothing else. What version is it?",
            options: ["1.8.3", "1.9.0", "2.0.0", "1.8.2.1"],
            correctIndex: 0,
            explanation: "Fixes only: bump PATCH.",
          },
          {
            id: "s2",
            question: "With 1.8.3 live, the next release adds Apple Pay at checkout and fixes one bug. What version is it?",
            options: ["1.9.0", "1.8.4", "2.0.0", "1.9.1"],
            correctIndex: 0,
            explanation: "A new backwards-compatible feature bumps MINOR and resets PATCH to 0, even if fixes ship too.",
          },
          {
            id: "s3",
            question: "GitHub generated the release notes for 1.9.0. What do you send the client?",
            options: [
              "A short note: \"1.9.0 adds Apple Pay at checkout and fixes the delivery-time display bug\", plus any known issues",
              "The auto-generated list of PR titles and contributor names",
              "A link to the commit history",
              "Nothing; the client will see the changes in the app",
            ],
            correctIndex: 0,
            explanation: "Clients need outcomes in plain words. PR titles and commit history are for the team.",
          },
        ],
      },
    },
    // ---------------------------------------------------------------------------------------
    {
      id: "pma-environments-branch-deploys",
      moduleId: "pma-github",
      trackId: "pm",
      title: "Environments: which branch deploys where",
      summary:
        "\"It's fixed\" can mean three different things: fixed on a developer's machine, fixed on staging, or fixed on the live app. If you do not know which branch deploys to which environment, you will one day tell a client to check a fix on production when it only reached staging. Knowing the mapping is basic PM hygiene.\n\nThere are two common patterns. In **GitHub flow**, developers branch from `main`, open a PR, and after review the PR merges into `main`, which is then deployed. Often each PR also gets a preview or staging deploy. In **Gitflow**, features merge into `develop`, which usually deploys to staging. A `release/` branch is cut for testing, then merged into `main`, which deploys to production. Urgent production fixes use a `hotfix/` branch made from `main`, merged back into both `main` and `develop`. Atlassian notes that Gitflow has lost popularity to simpler trunk-based workflows, but many agency projects still use it.\n\nIn GitHub Actions, each environment (staging, production) can have its own secrets, such as the live Stripe key, and protection rules: required reviewers who must approve a deploy, a wait timer, and limits on which branches may deploy there.\n\nHow to work with it:\n\n1. Write down the project's map (your team's SOP below): which branch goes to which URL, and who approves production.\n2. Send clients to staging for UAT, and say which version is there.\n3. Before go-live, check that production secrets, such as live payment keys, have been supplied.\n\nThe common mistake is assuming staging and production are identical. They run different data, different settings and often a different version, which is why a bug can appear on live but not on staging.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "GitHub Docs: Managing environments for deployment", url: "https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments", kind: "docs", verifiedAt: "2026-10-02T09:35:34Z" },
        { label: "Atlassian Git tutorial: Gitflow Workflow", url: "https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow", kind: "article", verifiedAt: "2026-10-02T09:35:29Z" },
        { label: "GitHub Docs: Understanding GitHub Actions", url: "https://docs.github.com/en/actions/get-started/understand-github-actions", kind: "docs", verifiedAt: "2026-10-02T09:35:44Z" },
        { label: "GitHub Docs: GitHub flow", url: "https://docs.github.com/en/get-started/using-github/github-flow", kind: "docs", verifiedAt: "2026-10-02T09:35:33Z" },
      ],
      video: {
        title: "Difference Between Development, Staging, and Prod Environment?",
        channel: "CodeWithHarry",
        url: "https://www.youtube.com/watch?v=H2p4wowlD3Q",
        videoId: "H2p4wowlD3Q",
        verifiedAt: "2026-10-02T09:35:54Z",
      },
      alternateVideos: [
        {
          title: "Learn How Companies Deploy Code to Production Environment [In 5 Mins!]",
          channel: "Cloud Champ",
          url: "https://www.youtube.com/watch?v=J9JbzsufemE",
          videoId: "J9JbzsufemE",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
        {
          title: "Getting started with branching workflows, Git Flow and GitHub Flow",
          channel: "Nick Chapsas",
          url: "https://www.youtube.com/watch?v=gW6dFpTMk8s",
          videoId: "gW6dFpTMk8s",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-environments-branch-deploys-q1",
          prompt: "In Gitflow, where do finished feature branches normally merge?",
          options: ["Into `develop`", "Straight into `main`", "Into a `hotfix/` branch", "Into the client's fork"],
          correctIndex: 0,
          explanation: "Features collect on `develop`. `main` only receives release and hotfix merges.",
        },
        {
          id: "pma-environments-branch-deploys-q2",
          prompt:
            "On this Laravel project, `develop` deploys to staging and `main` deploys to production. A developer says \"the invoice fix is merged to develop\". The client asks whether she can check it on the live site. What do you say?",
          options: [
            "Not yet: it is on the staging site for checking; it reaches live with the next release from main",
            "Yes, merged means live",
            "Yes, but only after clearing her browser cache",
            "No, it is only on the developer's computer",
          ],
          correctIndex: 0,
          explanation:
            "With this mapping, `develop` means staging. Saying \"live\" sets up a frustrated client; saying \"developer's computer\" undersells real progress.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-environments-branch-deploys-q3",
          prompt: "Which protection rules can a GitHub Actions environment such as `production` have? (Select all that apply.)",
          options: [
            "Required reviewers who must approve a deployment",
            "A wait timer before a deployment starts",
            "Limits on which branches can deploy to it",
            "Automatic client-friendly release notes",
            "Blocking the client from viewing the repo",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Environments support required reviewers, wait timers and deployment branch rules, plus their own secrets. Release notes and repo visibility are separate features.",
        },
        {
          id: "pma-environments-branch-deploys-q4",
          prompt: "Why do teams try to keep staging as close as possible to production (dev/prod parity)?",
          options: [
            "So bugs caused by different settings, data or versions show up before release, not after",
            "So the client can use staging instead of production",
            "Because hosting is cheaper that way",
            "So developers do not need to write tests",
          ],
          correctIndex: 0,
          explanation: "The smaller the gap between environments, the more a staging test tells you about production.",
        },
        {
          id: "pma-environments-branch-deploys-q5",
          prompt: "The client reports a bug on the live app that nobody can reproduce on staging. What should the team check first?",
          options: [
            "What differs: the version deployed on each, the configuration and the data",
            "Whether the client is using the app correctly",
            "Nothing: if staging works, production is fine",
            "Whether GitHub is down",
          ],
          correctIndex: 0,
          explanation:
            "Environments differ in version, settings and data. Comparing those is the fastest route to the cause; blaming the user is not.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-environments-branch-deploys-q6",
          prompt: "You are starting a new React project that deploys small changes several times a week. Which workflow do many teams prefer today?",
          options: [
            "GitHub flow or a similar trunk-based flow: short branches into main, with deploys from main",
            "Gitflow with long-lived release branches for every change",
            "No branches at all",
            "A separate repo for every environment",
          ],
          correctIndex: 0,
          explanation:
            "Simpler trunk-based flows suit frequent deploys. Gitflow fits scheduled, versioned releases better, which is why many agency projects still use it.",
        },
        {
          id: "pma-environments-branch-deploys-q7",
          prompt: "In Gitflow, a `hotfix/` branch for a production bug is created from which branch, and merged back where?",
          options: [
            "Created from `main`; merged back into both `main` and `develop`",
            "Created from `develop`; merged only into `develop`",
            "Created from `main`; merged only into `main`",
            "Created from a feature branch; merged into staging",
          ],
          correctIndex: 0,
          explanation:
            "Merging only into `main` means the next release from `develop` brings the bug back. That is a real regression PMs see.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-environments-branch-deploys-q8",
          prompt: "The production environment uses its own secrets, such as the live Stripe key. Why does that matter to a PM before go-live?",
          options: [
            "The client usually owns those live credentials, so getting them in time is a launch dependency",
            "It does not: developers create live keys themselves",
            "Secrets make the app slower, so they need approval",
            "Staging and production always share the same keys",
          ],
          correctIndex: 0,
          explanation: "Live payment keys, push certificates and similar items often come from the client's accounts. Chase them early, not on launch day.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "A Laravel and React project for a UK client uses this map: `feature/*` branches merge into `develop`, which deploys to staging automatically. A release PR merges into `main`, which deploys to production after the tech lead approves the deployment in GitHub.",
        steps: [
          {
            id: "s1",
            question: "A developer merges the password reset feature into `develop`. The client wants to try it. What do you tell her?",
            options: [
              "It is on the staging site now; please test it there",
              "It is live on production",
              "It will be testable after the next production release",
              "She cannot see it until UAT ends",
            ],
            correctIndex: 0,
            explanation: "`develop` deploys to staging automatically, so staging is where she can check it.",
          },
          {
            id: "s2",
            question: "The client approves the feature in UAT. What has to happen for Friday's production release?",
            options: [
              "A release PR into `main` is reviewed and merged, and the tech lead approves the production deployment",
              "Nothing: approval in UAT deploys it automatically",
              "The developer copies the files to the server",
              "The client merges the PR herself",
            ],
            correctIndex: 0,
            explanation: "Production needs the merge into `main` and the required approval on the production environment.",
          },
          {
            id: "s3",
            question: "On Saturday, checkout fails on production. The tech lead wants to fix it at once. What should the fix follow?",
            options: [
              "A hotfix branch from `main`, deployed to production, then merged back into `develop` too",
              "A normal feature branch into `develop`, released next Friday",
              "An edit made directly on the production server",
              "A new repo for the fix",
            ],
            correctIndex: 0,
            explanation: "Hotfixes start from what is live and must also return to `develop`, or the next release brings the bug back.",
          },
        ],
      },
      sop: [
        {
          title: "Our branch-to-environment map",
          prompt:
            "[Oyelabs SOP – admin to fill] For our standard Laravel, React and mobile projects: which branch deploys to dev, staging and production, the URLs, who may approve a production deploy, and how a hotfix is handled.",
        },
      ],
    },
    // ---------------------------------------------------------------------------------------
    {
      id: "pma-reading-a-pr",
      moduleId: "pma-github",
      trackId: "pm",
      title: "Reading a PR, review status and checks",
      summary:
        "The client wants the Stripe checkout live on Friday. The developer says \"it's basically done\". A PM who can read the pull request page knows in two minutes whether that is true. You do not need to read code. You need to read the signals around it.\n\nA PR page has four parts worth your time:\n\n- **The description and linked ticket.** What the change is meant to do and which ticket it closes.\n- **Reviews.** Each reviewer leaves Comment (feedback only), Approve, or Request changes. On a protected branch that requires reviews, a \"changes requested\" review from someone with write access blocks the merge until it is resolved or dismissed, however many approvals there are.\n- **Status checks.** Automated jobs such as build, tests and lint, shown as pending, passing or failing. Required checks must pass before merging. An optional check that fails is worth a question, but it does not block.\n- **The merge box.** It says whether the PR can merge, or whether it is blocked by conflicts, missing approvals or failing checks. A draft PR cannot be merged.\n\nAlso glance at **Files changed**. A database migration, a new environment variable or a change of thousands of lines all need attention before a release.\n\nThe common mistakes go both ways. Counting approvals and ignoring a \"changes requested\" review or a failing required check leads to promising a date that cannot be met. Treating every red mark as a blocker, including an optional coverage check, leads to needless delays. A subtler trap is a stale approval: if a reviewer approved three days ago and the developer then pushed new commits, the green tick may be for older code. Ask for a re-review. Who may approve and merge is set by your team's SOP below.",
      level: "advanced",
      estMinutes: 40,
      isMilestone: true,
      webRefs: [
        { label: "GitHub Docs: Pull requests", url: "https://docs.github.com/en/pull-requests/reference/pull-requests", kind: "docs", verifiedAt: "2026-10-02T09:35:26Z" },
        { label: "GitHub Docs: Pull request reviews", url: "https://docs.github.com/en/pull-requests/reference/pull-request-reviews", kind: "docs", verifiedAt: "2026-10-02T09:35:40Z" },
        { label: "GitHub Docs: Status checks", url: "https://docs.github.com/en/pull-requests/reference/status-checks", kind: "docs", verifiedAt: "2026-10-02T09:35:22Z" },
        { label: "Atlassian Git tutorial: What Is a Pull Request?", url: "https://www.atlassian.com/git/tutorials/making-a-pull-request", kind: "article", verifiedAt: "2026-10-02T09:35:27Z" },
      ],
      video: {
        title: "How to create a pull request in 4 min | GitHub for Beginners",
        channel: "GitHub",
        url: "https://www.youtube.com/watch?v=nCKdihvneS0",
        videoId: "nCKdihvneS0",
        verifiedAt: "2026-10-02T09:35:55Z",
      },
      alternateVideos: [
        {
          title: "GitHub Pull Request in 100 Seconds - Git a FREE sticker 🔥",
          channel: "Fireship",
          url: "https://www.youtube.com/watch?v=8lGpZkjnkt4",
          videoId: "8lGpZkjnkt4",
          verifiedAt: "2026-10-02T09:35:59Z",
        },
        {
          title: "How to Review a Pull Request in GitHub the RIGHT Way",
          channel: "CoderDave",
          url: "https://www.youtube.com/watch?v=lSnbOtw4izI",
          videoId: "lSnbOtw4izI",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-reading-a-pr-q1",
          prompt:
            "`main` is protected and requires 2 approving reviews. A PR has 2 approvals and 1 \"Request changes\" review from the tech lead, who has write access. Can it be merged?",
          options: [
            "No: the changes-requested review blocks the merge until it is resolved or dismissed",
            "Yes: it has the 2 approvals it needs",
            "Yes, but only by the tech lead",
            "Only after the client approves it",
          ],
          correctIndex: 0,
          explanation:
            "With required reviews, a changes-requested review from a reviewer with write access blocks merging. Counting approvals alone gives the wrong answer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-reading-a-pr-q2",
          prompt: "Which of these block merging a PR into a protected `main`? (Select all that apply.)",
          options: [
            "A required status check that is failing",
            "Merge conflicts with `main`",
            "The PR is still a draft",
            "An optional, non-required check that failed",
            "The description has no screenshots",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Required checks, conflicts and draft state all stop a merge. A failed optional check deserves a question but does not block; a missing screenshot is a style issue.",
        },
        {
          id: "pma-reading-a-pr-q3",
          prompt:
            "A reviewer approved a PR on Monday. On Wednesday the developer pushed six more commits. The PR still shows the approval. What should you assume?",
          options: [
            "The approval may cover only the older code; unless the repo dismisses stale approvals, ask for a re-review",
            "The approval covers all later commits automatically",
            "New commits always remove approvals, so the tick must be fresh",
            "Approvals expire after 24 hours",
          ],
          correctIndex: 0,
          explanation:
            "Dismissing stale approvals is a branch setting, not a guarantee. A green tick on code the reviewer never saw is a classic release risk.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-reading-a-pr-q4",
          prompt: "A reviewer submits a review with the type \"Comment\". What does that mean for the PR?",
          options: [
            "Feedback only: it neither approves nor blocks",
            "It counts as an approval",
            "It blocks the merge like Request changes",
            "It closes the PR",
          ],
          correctIndex: 0,
          explanation: "Comment is neutral. Only Approve counts towards required approvals, and only Request changes blocks.",
        },
        {
          id: "pma-reading-a-pr-q5",
          prompt: "A required test check has shown \"Pending\" for 50 minutes. Usually it takes 5. What do you do?",
          options: [
            "Ask the developer whether the job is stuck or queued, and do not report the PR as ready",
            "Report it as passed, since nothing failed",
            "Merge it to save time",
            "Wait until next week",
          ],
          correctIndex: 0,
          explanation: "Pending is not passing. A stuck job is a quick fix if someone notices it, and a missed release if nobody does.",
        },
        {
          id: "pma-reading-a-pr-q6",
          prompt: "Under Files changed, you see a new database migration. Why does that matter to you as a PM?",
          options: [
            "Database changes need care at deploy time: a backup, a rollback plan and maybe a quiet release window",
            "It does not: migrations are the same as any code change",
            "It means the client must buy a new server",
            "It means the PR cannot be reviewed",
          ],
          correctIndex: 0,
          explanation: "Migrations change live data structures, so they shape the release plan and its risk.",
        },
        {
          id: "pma-reading-a-pr-q7",
          prompt: "A PR changes 4,000 lines across 90 files and is due for Friday's release. What is the main risk, and what do you ask?",
          options: [
            "It is too big to review well, so bugs slip through; ask whether it can be split or reviewed in parts",
            "None: bigger PRs are more complete",
            "GitHub cannot show more than 1,000 lines",
            "It will make the app slower",
          ],
          correctIndex: 0,
          explanation: "Review quality drops sharply on huge PRs. Smaller PRs get real reviews and safer releases.",
        },
        {
          id: "pma-reading-a-pr-q8",
          prompt: "Which signals do you read in a two-minute PR check before a client update? (Select all that apply.)",
          options: [
            "The description and linked ticket",
            "Review states, including any changes requested",
            "Status checks and the merge box",
            "The number of emoji reactions",
            "The developer's commit time of day",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Purpose, reviews, checks and mergeability tell you if it can ship. Reactions and commit times tell you nothing.",
        },
      ],
      practice: {
        kind: "sim",
        app: "github-pr",
        prompt:
          "The client expects Stripe checkout on Friday. `main` is protected: it needs 2 approvals and the build and unit-test checks must pass. Flag every row that blocks this PR from being merged, then answer the questions.",
        title: "Add Stripe checkout (feature/stripe-checkout → main)",
        columns: ["Item", "Status", "Detail"],
        rows: [
          { id: "r1", cells: ["Check: build", "Passed", "Required · 2m 14s"], issue: null },
          { id: "r2", cells: ["Check: unit tests", "Failed", "Required · 3 of 412 tests failing in CheckoutTest"], issue: "A required check is failing, so the PR cannot merge." },
          { id: "r3", cells: ["Check: lint", "Passed", "Optional"], issue: null },
          { id: "r4", cells: ["Check: code coverage", "Failed", "Optional · coverage down 0.4%"], issue: null },
          { id: "r5", cells: ["Review: Priya (tech lead)", "Changes requested", "Webhook secret is hard-coded; move it to the environment settings"], issue: "A changes-requested review blocks the merge until it is resolved." },
          { id: "r6", cells: ["Review: Arjun", "Approved", "Looks good"], issue: null },
          { id: "r7", cells: ["Review: Meera", "Approved", "Tested on my machine"], issue: null },
          { id: "r8", cells: ["Merge status", "Blocked", "This branch has conflicts that must be resolved"], issue: "Conflicts with main must be resolved before merging." },
          { id: "r9", cells: ["Linked issue", "Linked", "Closes #214 Stripe checkout"], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "What is the most accurate update to the client today?",
            options: [
              "Checkout is built and in review; two fixes and a merge conflict remain, and we will confirm Friday by Thursday noon",
              "Checkout is done and will go live Friday",
              "Checkout is delayed indefinitely",
              "Checkout has two approvals, so it is ready",
            ],
            correctIndex: 0,
            explanation: "Honest status plus a confirmation point. Two approvals do not outweigh a failing required check, a change request and conflicts.",
          },
          {
            id: "q2",
            question: "Does the failed code-coverage check block the merge?",
            options: [
              "No: it is optional, though worth asking about",
              "Yes: any failed check blocks a merge",
              "Yes, but only on Fridays",
            ],
            correctIndex: 0,
            explanation: "Only required checks block merging. Optional ones are signals, not gates.",
          },
        ],
      },
      sop: [
        {
          title: "Who reviews, approves and merges at Oyelabs",
          prompt:
            "[Oyelabs SOP – admin to fill] Required number of approvals, who may approve (tech lead, peer), which checks are required on our projects, who presses merge, and whether a PM can see client repos.",
        },
      ],
    },
    // ---------------------------------------------------------------------------------------
    {
      id: "pma-pre-release-questions",
      moduleId: "pma-github",
      trackId: "pm",
      title: "Questions to ask before a release",
      summary:
        "Most painful releases were not caused by bad code. They were caused by a question nobody asked: \"Did the client sign off?\", \"What happens to the data if we roll back?\", \"Who is online when US users wake up?\" The PM does not deploy, but the PM is the one who tells the client \"it's live\", so the PM owns the questions.\n\nAsk these before every client release:\n\n1. **What is in it?** The list of merged PRs and their tickets, compared with what the client expects.\n2. **Was this exact build tested?** Staging must have run the same tag or commit that is going to production, and every ticket must be verified there.\n3. **Has the client signed off UAT?** In writing, for the items that need it.\n4. **Are there database migrations, and what is the rollback plan?** Redeploying the previous version does not bring back a dropped column. Data changes need a backup or a two-step migration.\n5. **Are config and third parties ready?** Live payment keys, push certificates, DNS, app store builds.\n6. **When, and who is watching?** A window when the team is online for hours afterwards, a smoke test on production, error monitoring, and the release note to the client.\n\nGitHub helps you trust some answers. Protected branches can require reviews and passing checks before anything reaches `main`, and stop history being rewritten. But protection does not know whether the client signed off or whether the live keys exist. Your team's SOP below sets the release checklist and windows.\n\nThe common mistake is promising a release date before UAT is done, then releasing on a Friday evening in India. For a US client that is their working morning, so their users meet any problem while our team is offline.",
      level: "advanced",
      estMinutes: 40,
      isMilestone: true,
      webRefs: [
        { label: "GitHub Docs: About protected branches", url: "https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches", kind: "docs", verifiedAt: "2026-10-02T09:35:30Z" },
        { label: "Atlassian: Software Releases: 3 Ingredients You Need for Success", url: "https://www.atlassian.com/agile/software-development/release", kind: "article", verifiedAt: "2026-10-02T09:38:45Z" },
        { label: "Google SRE book: Role of Release Engineer and Best Practices", url: "https://sre.google/sre-book/release-engineering/", kind: "article", verifiedAt: "2026-10-02T09:35:37Z" },
        { label: "GitHub Docs: About releases", url: "https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases", kind: "docs", verifiedAt: "2026-10-02T09:35:38Z" },
      ],
      video: {
        title: "Release and Deployment Management - Key Concepts",
        channel: "TutorialsPoint",
        url: "https://www.youtube.com/watch?v=6bP4DxMe2-4",
        videoId: "6bP4DxMe2-4",
        verifiedAt: "2026-10-02T09:35:54Z",
      },
      alternateVideos: [
        {
          title: "Interview Question | 5 Steps to a Successful Release Management Process",
          channel: "Server Gyan",
          url: "https://www.youtube.com/watch?v=mqu_91ngChw",
          videoId: "mqu_91ngChw",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-pre-release-questions-q1",
          prompt: "Which questions should a PM ask the team before a client release? (Select all that apply.)",
          options: [
            "Which merged PRs and tickets are in it?",
            "What is the rollback plan, including for database changes?",
            "Has the client signed off UAT?",
            "Which code editor did the developers use?",
            "How many commits are in the release?",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Scope, rollback and sign-off decide whether the release is safe and agreed. Editors and commit counts say nothing about readiness.",
        },
        {
          id: "pma-pre-release-questions-q2",
          prompt:
            "A release includes a migration that drops the `legacy_address` column. The rollback plan is \"redeploy the previous tag\". What is wrong with that plan?",
          options: [
            "Redeploying old code does not bring back dropped data; it needs a backup or a two-step migration",
            "Nothing: redeploying the previous tag restores everything",
            "Tags cannot be redeployed",
            "Migrations can never be rolled back, so no plan is needed",
          ],
          correctIndex: 0,
          explanation: "Code rolls back; deleted data does not. Destructive migrations need a backup and often a staged approach.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-pre-release-questions-q3",
          prompt:
            "The team proposes deploying at 6:00 pm IST on Friday for a client whose users are in New York. Why is that risky?",
          options: [
            "It is Friday morning in New York, so users meet any problem while our team is going offline for the weekend",
            "It is fine: evening deploys are always safest",
            "Deploys cannot run after 5 pm",
            "New York users cannot see changes until Monday",
          ],
          correctIndex: 0,
          explanation:
            "6:00 pm IST is 8:30 am in New York during daylight time. Pick a window when the team stays online for hours after the release.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-pre-release-questions-q4",
          prompt: "The developer says \"it's all tested on staging\". What is the sharper follow-up?",
          options: [
            "Was staging running the exact tag or commit that is going to production?",
            "Who wrote the tests?",
            "How long did testing take?",
            "Can we skip production smoke tests then?",
          ],
          correctIndex: 0,
          explanation: "If more code was merged after testing, staging results do not cover the release. The same build must be tested and shipped.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-pre-release-questions-q5",
          prompt: "Which go-live dependencies often sit with the client, not the developers?",
          options: [
            "Live payment keys, app store accounts and DNS access for their domain",
            "The Git branch names",
            "The unit tests",
            "The code review",
          ],
          correctIndex: 0,
          explanation: "Client-owned accounts and credentials are classic launch-day blockers. Chase them days ahead.",
        },
        {
          id: "pma-pre-release-questions-q6",
          prompt: "What can branch protection on `main` guarantee for you?",
          options: [
            "That merges met the rules set, such as required reviews and passing required checks",
            "That the client has approved the release",
            "That production secrets are configured",
            "That there are no bugs",
          ],
          correctIndex: 0,
          explanation: "Protection enforces review and check rules on the branch. Client sign-off, config and correctness are still your questions.",
        },
        {
          id: "pma-pre-release-questions-q7",
          prompt: "A half-finished reporting feature is already merged into the release branch. The rest of the release is ready. What is a common, safe option?",
          options: [
            "Ship with the feature hidden behind a feature flag and switch it on after it is finished and approved",
            "Delay the whole release until the feature is done, without telling the client",
            "Ship it visible and mention it is unfinished",
            "Delete the feature's code on the server after deploying",
          ],
          correctIndex: 0,
          explanation: "A flag separates deploying code from releasing a feature, so the ready work ships and the unfinished part stays hidden.",
        },
        {
          id: "pma-pre-release-questions-q8",
          prompt: "Which steps belong right after the deploy? (Select all that apply.)",
          options: [
            "A quick smoke test of key flows on production",
            "Watching error monitoring for a while",
            "Sending the client a plain-language release note",
            "Deleting the previous release tag",
            "Turning off error alerts to avoid noise",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Verify, watch and tell the client. Deleting tags removes your rollback point, and muting alerts hides problems.",
        },
      ],
      practice: {
        kind: "sim",
        app: "github-pr",
        prompt:
          "This is the release PR for a Laravel shop's version 2.4.0, planned for Thursday. `main` requires 1 approval and passing build and test checks. Flag every row that should stop you from confirming the release to the client, then answer the questions.",
        title: "Release 2.4.0 (release/2.4.0 → main)",
        columns: ["Item", "Status", "Detail"],
        rows: [
          { id: "r1", cells: ["Check: build", "Passed", "Required"], issue: null },
          { id: "r2", cells: ["Check: tests", "Passed", "Required · 412 tests"], issue: null },
          { id: "r3", cells: ["Review: Priya (tech lead)", "Approved", "Approved after the last commit"], issue: null },
          { id: "r4", cells: ["PR #301 Refund flow (SHOP-160)", "Merged", "Jira: In QA, not yet verified on staging"], issue: "Merged but not verified on staging; it should not ship unverified." },
          { id: "r5", cells: ["PR #305 Profile photo upload (SHOP-171)", "Merged", "Verified on staging by QA"], issue: null },
          { id: "r6", cells: ["Migration: drop orders.legacy_address", "Approved", "No backup step in the release plan"], issue: "A destructive migration with no backup cannot be rolled back." },
          { id: "r7", cells: ["Client UAT sign-off", "Awaiting", "Client QA lead has not replied since Tuesday"], issue: "No written UAT sign-off from the client yet." },
          { id: "r8", cells: ["Env: production Stripe secret", "Done", "Live key added by DevOps"], issue: null },
          { id: "r9", cells: ["Deploy window", "Scheduled", "Thu 11:00 IST, team online all day"], issue: null },
          { id: "r10", cells: ["Check: code coverage", "Failed", "Optional · coverage down 0.2%"], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "Which problem must be fixed even if the client signs off UAT today?",
            options: [
              "The migration needs a backup step, because the dropped column cannot be restored by a rollback",
              "The optional coverage check",
              "The deploy window",
              "Nothing: client sign-off covers everything",
            ],
            correctIndex: 0,
            explanation: "Client sign-off does not make a destructive migration safe. The backup is a team responsibility.",
          },
          {
            id: "q2",
            question: "What do you send the client today?",
            options: [
              "Thursday is on track if we get UAT sign-off by Wednesday noon; the refund flow ships only once QA verifies it",
              "Release 2.4.0 is confirmed for Thursday",
              "The release is cancelled",
            ],
            correctIndex: 0,
            explanation: "State the conditions and the deadline for them, so the client knows exactly what decides the date.",
          },
        ],
      },
      sop: [
        {
          title: "Our release checklist and release windows",
          prompt:
            "[Oyelabs SOP – admin to fill] The pre-release checklist a PM must complete, who gives the final go, allowed release days and times per client region, the rollback and backup rule for migrations, and the post-release smoke test and client note.",
        },
      ],
    },
  ],
} satisfies Module;
