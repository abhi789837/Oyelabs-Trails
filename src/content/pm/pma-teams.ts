import type { Module } from "@/types/curriculum";

export default {
  id: "pma-teams",
  trackId: "pm",
  name: "Microsoft Teams for PMs",
  description:
    "Running an agency project in Microsoft Teams: where to post what, @mentions and presence etiquette, files and SharePoint, meeting features, Planner and Loop, client calls with external guests, and using Copilot recaps safely.",
  refs: [
    { label: "Microsoft Learn: Overview of teams and channels in Microsoft Teams", url: "https://learn.microsoft.com/en-us/microsoftteams/teams-channels-overview", kind: "docs", verifiedAt: "2026-10-02T09:35:20Z" },
    { label: "Microsoft Support: Microsoft 365 video training - Microsoft Support", url: "https://support.microsoft.com/en-us/office/microsoft-365-video-training-4f108e54-240b-4351-8084-b1089f0d21d7", kind: "docs", verifiedAt: "2026-10-02T09:35:42Z" },
  ],
  topics: [
    {
      id: "pma-teams-channels-chats",
      moduleId: "pma-teams",
      trackId: "pm",
      title: "Teams vs channels vs chats",
      summary:
        "Teams gives you three places to talk: a team, its channels, and chats. A team is a group of people, such as everyone working on one client's account. A channel is a topic inside a team, such as \"Releases\" or \"QA\", where posts are threaded and every team member can read them. A chat is a private conversation with one person or a small group, outside any team.\n\nWhy it matters: on an agency project the same question gets asked again and again when decisions live in private chats. A developer asks you in chat whether the client approved the new checkout flow. You answer there. A week later the QA engineer asks the same thing, because nobody else could see your answer. Decisions, release notes and blockers belong in a channel, where the whole project team can find them and new joiners can scroll back.\n\nHow to do it: create one team per client or per project, with channels for the main streams of work, for example General, Dev, QA, Releases and Client-updates. Start a new post for each new subject, and reply in its thread instead of starting a new post. Use chats for quick personal things: \"Are you free for five minutes?\" or a one-to-one about someone's workload. If a chat turns into a decision, copy the outcome into the right channel thread.\n\nCommon mistake: creating a new group chat for every issue. After a month you have twenty chats named after people, files scattered across them, and no record of what was agreed. Another mistake is making a private channel by default; private and shared channels are for real access limits, such as commercial talks or a channel shared with the client's team, not for every conversation.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "Microsoft Learn: Overview of teams and channels in Microsoft Teams", url: "https://learn.microsoft.com/en-us/microsoftteams/teams-channels-overview", kind: "docs", verifiedAt: "2026-10-02T09:35:20Z" },
        { label: "Microsoft Support: Chat with others in Microsoft Teams", url: "https://support.microsoft.com/en-us/teams/chat/chat-with-others-in-microsoft-teams", kind: "docs", verifiedAt: "2026-10-02T09:39:22Z" },
        { label: "Microsoft Support: Microsoft 365 video training - Microsoft Support", url: "https://support.microsoft.com/en-us/office/microsoft-365-video-training-4f108e54-240b-4351-8084-b1089f0d21d7", kind: "docs", verifiedAt: "2026-10-02T09:35:42Z" },
      ],
      video: {
        title: "When To Use Teams Chats Vs Channels In Microsoft Teams",
        channel: "Jonathan Edwards",
        url: "https://www.youtube.com/watch?v=jcpJayfsm7w",
        videoId: "jcpJayfsm7w",
        verifiedAt: "2026-10-02T09:35:53Z",
      },
      alternateVideos: [
        {
          title: "Best practices for using channels",
          channel: "Microsoft Teams",
          url: "https://www.youtube.com/watch?v=ps7dDNrXI6E",
          videoId: "ps7dDNrXI6E",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
        {
          title: "All about using channels in Microsoft Teams",
          channel: "Microsoft Teams",
          url: "https://www.youtube.com/watch?v=m3i18aunzQU",
          videoId: "m3i18aunzQU",
          verifiedAt: "2026-10-02T09:35:57Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-teams-channels-chats-q1",
          prompt:
            "The client approved a change to the checkout flow on a call. Where should you record the decision so the whole project team can find it later?",
          options: [
            "A post in the project's channel, for example Client-updates",
            "A one-to-one chat with the tech lead",
            "A new group chat with the people on the call",
            "Your personal notes",
          ],
          correctIndex: 0,
          explanation:
            "Channel posts are visible to the whole team and searchable later. Chats only reach the people in them, so the next person asks again.",
        },
        {
          id: "pma-teams-channels-chats-q2",
          prompt: "A developer replies to your release question by starting a brand-new post in the channel instead of replying in your thread. Why does it matter?",
          options: [
            "The question and answer are split, so others cannot follow the conversation",
            "New posts are deleted after 24 hours",
            "Only the first post in a channel notifies people",
            "It does not matter at all",
          ],
          correctIndex: 0,
          explanation: "Threads keep one subject together. Splitting them makes the channel hard to read and decisions hard to find.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-channels-chats-q3",
          prompt: "Which of these belong in a project channel rather than a chat? (Select all that apply.)",
          options: [
            "Release notes for the staging build",
            "A blocker: the client has not sent the App Store login",
            "The decision to move the demo to Thursday",
            "A one-to-one about a developer's personal leave",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Project-wide information goes where the team can see it. Personal or sensitive one-to-one topics stay in chat.",
        },
        {
          id: "pma-teams-channels-chats-q4",
          prompt: "When does a private channel make sense on a client project?",
          options: [
            "When only some team members may see the content, such as pricing or contract talks",
            "For every topic, to keep the team tidy",
            "When you want the client to see everything",
            "When a channel gets too many posts",
          ],
          correctIndex: 0,
          explanation:
            "Private channels exist to limit access. Using them by default hides information from people who need it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-channels-chats-q5",
          prompt: "You have twenty group chats for one project, each named after its members. What is the best fix going forward?",
          options: [
            "Move ongoing topics into channels in the project team and post new subjects there",
            "Rename all the chats",
            "Pin all twenty chats",
            "Create one more group chat with everyone in it",
          ],
          correctIndex: 0,
          explanation: "Channels organise talk by topic and keep files in one place. Renaming or pinning chats keeps the mess.",
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You are the PM for a Laravel + React portal for a client in the UK. Your team has a Teams team called \"Acme Portal\" with channels General, Dev, QA, Releases and Client-updates. Decide where each thing goes.",
        steps: [
          {
            id: "s1",
            question: "QA found that password reset emails are not sent on staging. Where should the QA engineer report it first so the devs and you see it?",
            options: [
              "A new post in the QA channel, linking the ticket",
              "A one-to-one chat with the developer who wrote the feature",
              "An email to the client",
              "The General channel of another project",
            ],
            correctIndex: 0,
            explanation: "A QA channel post with the ticket link reaches the whole team and keeps the issue findable.",
          },
          {
            id: "s2",
            question: "The developer fixes it and asks you in a private chat: \"Can I deploy the fix to staging now?\" You agree. What do you also do?",
            options: [
              "Reply in the original QA thread that the fix is approved for staging",
              "Nothing: the chat is enough",
              "Start a new group chat with QA",
              "Email the whole company",
            ],
            correctIndex: 0,
            explanation: "Moving the outcome into the thread closes the loop for QA and anyone else following it.",
          },
          {
            id: "s3",
            question: "You want to discuss a developer's repeated late timesheets with them. Where?",
            options: [
              "A one-to-one chat or call",
              "The Dev channel",
              "The General channel with an @team mention",
              "The Client-updates channel",
            ],
            correctIndex: 0,
            explanation: "Personal performance topics are private conversations, never channel posts.",
          },
        ],
      },
    },
    {
      id: "pma-teams-mentions-presence",
      moduleId: "pma-teams",
      trackId: "pm",
      title: "@mentions and presence etiquette",
      summary:
        "Teams has two simple tools that shape how your team feels every day: @mentions, which decide who gets notified, and presence, the coloured dot that tells others whether you are available. Used well, they get answers fast without anyone being interrupted for nothing. Used badly, they create noise, stress and missed messages.\n\nWhy it matters in an agency: your team may be in India while the client is in the US or Australia. An @team mention at 11 pm their time, or a \"hi\" message with nothing else, wakes people up or leaves them waiting. On the other side, a developer who sets Do not disturb all day and never checks the channel can block a release without knowing it.\n\nHow to do it: @mention the one person who must act, by name, and say what you need and by when, in the same message. Use @channel or @team only for things everyone must see, like a release freeze. Use tags, such as @QA or @Backend, when you need a role, not a person. Write the full question in your first message instead of \"hi, got a minute?\". Respect presence: Busy and Do not disturb mean \"write it down, I will reply later\". Set your own status message when you are in a client workshop or on leave, and add who to contact instead.\n\nCommon mistake: using @team for a question one person can answer, or marking a message urgent when it is only important to you. Another is reading presence as proof of work: a green dot only shows activity in the app, not whether someone is productive. Your team's SOP below covers expected reply times and working hours across time zones.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "Microsoft Support: Use @mentions to get someone's attention in Microsoft Teams", url: "https://support.microsoft.com/en-us/teams/notifications-settings/use-mentions-to-get-someone-s-attention-in-microsoft-teams", kind: "docs", verifiedAt: "2026-10-02T09:38:56Z" },
        { label: "Microsoft Support: Change your status in Microsoft Teams", url: "https://support.microsoft.com/en-us/teams/notifications-settings/change-your-status-in-microsoft-teams", kind: "docs", verifiedAt: "2026-10-02T09:38:47Z" },
        { label: "Microsoft Learn: User presence in Teams", url: "https://learn.microsoft.com/en-us/microsoftteams/presence-admins", kind: "docs", verifiedAt: "2026-10-02T09:35:46Z" },
        { label: "Microsoft Learn: Manage tags in Microsoft Teams", url: "https://learn.microsoft.com/en-us/microsoftteams/manage-tags", kind: "docs", verifiedAt: "2026-10-02T09:38:57Z" },
      ],
      video: {
        title: "How to use Microsoft Teams @mentions",
        channel: "Microsoft Copilot",
        url: "https://www.youtube.com/watch?v=BolSNI0RBPg",
        videoId: "BolSNI0RBPg",
        verifiedAt: "2026-10-02T09:35:54Z",
      },
      alternateVideos: [
        {
          title: "Using tags in Microsoft Teams",
          channel: "Microsoft Teams",
          url: "https://www.youtube.com/watch?v=9y5AchSAEJY",
          videoId: "9y5AchSAEJY",
          verifiedAt: "2026-10-02T09:35:56Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-teams-mentions-presence-q1",
          prompt: "You need the backend developer to confirm whether the payment webhook is live on staging. Which message is best?",
          options: [
            "\"@Ravi is the Stripe webhook live on staging? I need it for the client demo at 4 pm IST.\"",
            "\"@team is the webhook live?\"",
            "\"Hi Ravi\" (and wait for a reply before asking)",
            "\"URGENT!!! webhook??\"",
          ],
          correctIndex: 0,
          explanation:
            "Name the person, ask the full question and give the reason and time. @team notifies everyone, and a bare \"hi\" wastes a round trip.",
        },
        {
          id: "pma-teams-mentions-presence-q2",
          prompt: "A colleague shows Do not disturb. You have a non-urgent question. What should you do?",
          options: [
            "Send the full question in chat and let them reply when they are free",
            "Call them until they answer",
            "Mark the message urgent so it gets through",
            "Wait and not write anything until their status changes",
          ],
          correctIndex: 0,
          explanation:
            "Do not disturb means \"write it down\". A clear written message respects focus time; forcing it through is for real emergencies only.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-mentions-presence-q3",
          prompt: "You often need \"whoever is on QA this sprint\" to look at a build. What helps most?",
          options: [
            "A tag such as @QA that includes the current QA people",
            "@team every time",
            "A new group chat for each build",
            "Asking in the client's channel",
          ],
          correctIndex: 0,
          explanation: "Tags notify a role group without disturbing the whole team, and you can update who is in the tag.",
        },
        {
          id: "pma-teams-mentions-presence-q4",
          prompt: "Which are good presence and status habits for a PM? (Select all that apply.)",
          options: [
            "Set a status message during a long client workshop, with who to contact instead",
            "Set an out-of-office status when on leave",
            "Check the channel at agreed times even when you set Busy",
            "Treat a green dot as proof that someone is working well",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Status messages and routines make you reachable without constant interruptions. Presence only shows app activity, not output.",
        },
        {
          id: "pma-teams-mentions-presence-q5",
          prompt:
            "It is 10:30 pm in India. A US client posts a non-blocking question in the shared channel. You want the Indian tech lead to answer. What do you do?",
          options: [
            "@mention the tech lead with the question so they see it at the start of their day, and tell the client when to expect an answer",
            "Call the tech lead now",
            "Use @team so someone answers tonight",
            "Ignore it until the client asks again",
          ],
          correctIndex: 0,
          explanation:
            "Non-blocking questions can wait for working hours if the client knows when to expect the answer. Late-night calls and @team are for real emergencies.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "sim",
        app: "teams",
        prompt:
          "Here is a morning in the Dev channel of a React Native project for an Australian client. Your team works from India. Flag the messages that break good @mention or presence etiquette, then answer the question.",
        title: "FitTrack App · Dev channel",
        columns: ["Person", "Time", "Message"],
        rows: [
          { id: "m1", cells: ["Priya (PM)", "09:05", "@Arjun can you share the TestFlight build number for today's client check? Needed by 11:00 IST."], issue: null },
          { id: "m2", cells: ["Arjun", "09:12", "Build 1.4.2 (88) is in TestFlight now."], issue: null },
          { id: "m3", cells: ["Karan", "09:20", "@team does anyone know where the Figma link is?"], issue: "A question one person can answer, sent to the whole team." },
          { id: "m4", cells: ["Neha", "09:31", "hi"], issue: "A bare greeting with no question makes the reader wait for the real message." },
          { id: "m5", cells: ["Priya (PM)", "09:40", "@QA please run the smoke test on build 88 before 12:00. Checklist is in the QA tab."], issue: null },
          { id: "m6", cells: ["Rohit", "10:05", "Marked URGENT: can someone review my PR when free? No rush."], issue: "Urgent used for something that is not urgent; it trains people to ignore urgent." },
          { id: "m7", cells: ["Sana", "10:15", "Status set: In client workshop until 13:00. For release questions contact @Arjun."], issue: null },
          { id: "m8", cells: ["Karan", "10:20", "Calling Sana now, she is on DND but I need the API doc."], issue: "Interrupting someone on Do not disturb for a non-urgent need; write the request instead." },
          { id: "m9", cells: ["Arjun", "10:24", "@Karan the API doc is pinned in the Dev channel files."], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "What should Karan have written instead of message m3?",
            options: [
              "\"@Priya where is the Figma link for the onboarding screens?\" or check the channel tabs first",
              "\"@team URGENT Figma\"",
              "Nothing; wait until someone posts it",
            ],
            correctIndex: 0,
            explanation: "Ask the person likely to know, with the specific need, after checking where links are normally kept.",
          },
        ],
      },
      sop: [
        {
          title: "Our Teams etiquette and reply times",
          prompt:
            "[Oyelabs SOP – admin to fill] Expected reply times in Teams for internal and client messages, working hours and the time-zone overlap window with each client region (US, UK, AU), when @team/@channel and Urgent are allowed, status and out-of-office rules, and who to contact out of hours.",
        },
      ],
    },
    {
      id: "pma-teams-files-sharepoint",
      moduleId: "pma-teams",
      trackId: "pm",
      title: "Files and SharePoint basics",
      summary:
        "Every Teams team has a SharePoint site behind it. When you upload a file to a channel's Files tab, it is stored in a folder for that channel in the team's SharePoint document library. When you attach a file in a private chat, it goes to your own OneDrive, in a folder called Microsoft Teams Chat Files, and is shared only with the people in that chat. This one fact explains most \"where is the file?\" problems on a project.\n\nWhy it matters for an agency: a PM sends the signed SOW in a chat with the tech lead. Three months later the PM leaves the company, their OneDrive is cleaned up, and the only copy of the SOW the team used is gone. Or the client's brand guide is in four chats as four versions, and the designer works from the wrong one. Project files belong to the project, not to a person.\n\nHow to do it: keep project documents in the channel Files tab, in clear folders such as Contracts, Designs, QA and Releases. Share a link to the file instead of attaching a new copy each time, so everyone edits the same file and version history keeps the old ones. Open Office files in Teams or the desktop app and co-author them instead of downloading and re-uploading. When you share with someone outside, choose the narrowest link type that works, such as specific people, and remember that private channels have their own separate SharePoint site.\n\nCommon mistake: downloading a file, editing it, and uploading \"SOW_final_v3_REAL.docx\". Now there are two files and nobody knows which is right. Another mistake is sharing an \"anyone with the link\" link to a client document full of internal rates. Check the link type every time.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Microsoft Learn: Teams and SharePoint integration", url: "https://learn.microsoft.com/en-us/sharepoint/teams-connected-sites?bc=%2Fteamss%2Fbreadcrumb%2Ftoc.json&toc=%2Fteams%2Ftoc.json", kind: "docs", verifiedAt: "2026-10-02T09:35:33Z" },
        { label: "Microsoft Support: Share files and folders in Microsoft OneDrive", url: "https://support.microsoft.com/en-us/onedrive/share-files-and-folders-in-microsoft-onedrive", kind: "docs", verifiedAt: "2026-10-02T09:35:31Z" },
        { label: "Microsoft Support: Microsoft 365 video training - Microsoft Support", url: "https://support.microsoft.com/en-us/office/microsoft-365-video-training-4f108e54-240b-4351-8084-b1089f0d21d7", kind: "docs", verifiedAt: "2026-10-02T09:35:42Z" },
      ],
      video: {
        title: "All about file sharing in Microsoft Teams",
        channel: "Microsoft Teams",
        url: "https://www.youtube.com/watch?v=Pl__0ws3AZs",
        videoId: "Pl__0ws3AZs",
        verifiedAt: "2026-10-02T09:35:55Z",
      },
      alternateVideos: [
        {
          title: "Are you STILL confused?  Sharepoint vs. OneDrive vs. Teams",
          channel: "Office Skills with Amy",
          url: "https://www.youtube.com/watch?v=sd5DKYZYtjY",
          videoId: "sd5DKYZYtjY",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-teams-files-sharepoint-q1",
          prompt: "You upload the signed SOW in the project's Releases channel. Where is it stored?",
          options: [
            "In the team's SharePoint site, in the folder for that channel",
            "In your personal OneDrive",
            "Only on your laptop",
            "In the client's mailbox",
          ],
          correctIndex: 0,
          explanation: "Channel files live in the team's SharePoint document library, one folder per standard channel.",
        },
        {
          id: "pma-teams-files-sharepoint-q2",
          prompt: "You attach the API spec in a one-to-one chat with a developer. Where is it stored?",
          options: [
            "In your OneDrive, in the Microsoft Teams Chat Files folder, shared with the chat members",
            "In the team's SharePoint site",
            "In the developer's OneDrive",
            "It is not stored; chat files are temporary",
          ],
          correctIndex: 0,
          explanation:
            "Chat attachments live in the sender's OneDrive. That is why important project files should go to the channel, not to chats.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-files-sharepoint-q3",
          prompt:
            "A PM left the company. Their account was removed and the team lost the only copy of the client's brand guide. What practice would have prevented it?",
          options: [
            "Keeping project files in the channel's Files tab instead of chats",
            "Emailing the file to the client again",
            "Renaming the file with \"final\"",
            "Pinning the chat",
          ],
          correctIndex: 0,
          explanation: "Files in the team site belong to the project and outlive any one person's account.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-files-sharepoint-q4",
          prompt: "Which habits keep one true version of a project document? (Select all that apply.)",
          options: [
            "Share a link to the file instead of attaching a copy",
            "Co-author in Teams or the desktop app instead of downloading and re-uploading",
            "Use version history to see or restore older versions",
            "Save a new copy named _final_v2 after every edit",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Links, co-authoring and version history keep one file. New copies create confusion about which is current.",
        },
        {
          id: "pma-teams-files-sharepoint-q5",
          prompt: "You need to share the UAT test plan with two people at the client. Which link type is safest?",
          options: [
            "Specific people, with only those two email addresses",
            "Anyone with the link",
            "People in your organisation",
            "A screenshot of each page",
          ],
          correctIndex: 0,
          explanation:
            "Specific-people links work only for the named people. \"Anyone\" links can be forwarded, and org-only links will not open for the client.",
        },
        {
          id: "pma-teams-files-sharepoint-q6",
          prompt: "You create a private channel \"Commercials\" for pricing talks. What is different about its files?",
          options: [
            "They are stored in a separate SharePoint site that only the private channel's members can access",
            "They are stored in the General folder",
            "They are visible to everyone in the team",
            "Private channels cannot hold files",
          ],
          correctIndex: 0,
          explanation: "Private channels get their own site so their files stay limited to their members.",
        },
        {
          id: "pma-teams-files-sharepoint-q7",
          prompt:
            "Two people edited the PRD at the same time in the desktop app and the client says their comment disappeared. What can you check first?",
          options: [
            "Version history of the file in SharePoint",
            "The Teams activity feed only",
            "Your Outlook sent folder",
            "Nothing; changes cannot be recovered",
          ],
          correctIndex: 0,
          explanation: "Version history keeps earlier versions, so you can see and restore what was there.",
        },
        {
          id: "pma-teams-files-sharepoint-q8",
          prompt: "Which files belong in the project channel's Files tab? (Select all that apply.)",
          options: [
            "Signed SOW and change requests",
            "Approved designs and brand guide",
            "Release notes and UAT sign-offs",
            "A developer's salary review",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Project records go to the project. HR and personal files never go into a project team.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "You take over a Laravel e-commerce project for a US client from another PM. Files are scattered: the SOW is in a chat, three versions of the design spec are in the Designs folder, and the client keeps emailing attachments.",
        steps: [
          {
            id: "s1",
            question: "The signed SOW only exists as an attachment in the old PM's chat with the tech lead. What do you do first?",
            options: [
              "Save it into the channel Files tab under Contracts and post the link in the channel",
              "Leave it; the tech lead can always find it",
              "Download it to your laptop",
              "Ask the client to send it again by email",
            ],
            correctIndex: 0,
            explanation: "Move it into the team site so it belongs to the project, then tell the team where it is.",
          },
          {
            id: "s2",
            question: "The Designs folder has spec_v2.docx, spec_final.docx and spec_final_NEW.docx. What is the right fix?",
            options: [
              "Confirm the current one with the designer, keep one file, move the others to an Archive folder, and share links to the one file from now on",
              "Delete all three and start again",
              "Keep all three so nothing is lost",
              "Rename all three to spec.docx",
            ],
            correctIndex: 0,
            explanation: "One confirmed file plus version history replaces copies; archiving avoids losing anything.",
          },
          {
            id: "s3",
            question: "The client wants to edit the UAT checklist with you. How do you share it?",
            options: [
              "Share a specific-people edit link to the file in the channel, so both sides edit the same copy",
              "Email them a copy and merge their changes later",
              "Share an anyone-with-the-link link to the whole Files tab",
              "Paste the checklist into chat",
            ],
            correctIndex: 0,
            explanation: "A specific-people link to one file gives access to exactly what they need and keeps one version.",
          },
        ],
      },
    },
    {
      id: "pma-teams-meetings-features",
      moduleId: "pma-teams",
      trackId: "pm",
      title: "Meetings: lobby, recording, transcripts, breakout rooms",
      summary:
        "Most agency meetings with clients happen in Teams: kickoffs, sprint demos, UAT walk-throughs, steering calls. Teams has features that make them smoother and safer, but each one needs to be set up before the call, not discovered during it. The four that matter most for a PM are the lobby, recording, transcription and breakout rooms.\n\nWhy it matters: the lobby holds people outside the meeting until someone admits them. Set it well and an uninvited person never sees your client's unreleased app. Recording and transcripts mean you do not have to write every word down, and a client who missed the demo can watch it later. Breakout rooms let a big workshop split into smaller groups, such as the client's marketing team reviewing content while their ops team walks through the admin panel.\n\nHow to do it: before the meeting, open Meeting options. Choose who can bypass the lobby and who can present; usually only our team presents. Turn on the lobby for anyone not invited. At the start, say that you will record and transcribe, and why, then start them. Everyone in the meeting is notified when recording starts. For a workshop, create breakout rooms in advance, assign people, and set a timer. After the meeting, share the recording or transcript link in the channel or meeting chat with your minutes.\n\nCommon mistakes: recording a client call without saying so first, letting anyone bypass the lobby on a call where an unreleased product is shown, and assuming the recording will be there forever; storage and expiry are set by your admin. Your team's SOP on meeting cadence and minutes says which meetings to record and where the minutes go.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Microsoft Learn: IT Admins - Manage lobby options in Microsoft Teams", url: "https://learn.microsoft.com/en-us/microsoftteams/who-can-bypass-meeting-lobby", kind: "docs", verifiedAt: "2026-10-02T09:39:00Z" },
        { label: "Microsoft Support: Start, stop, and find meeting recordings in Microsoft Teams", url: "https://support.microsoft.com/en-us/teams/meetings/start-stop-and-find-meeting-recordings-in-microsoft-teams", kind: "docs", verifiedAt: "2026-10-02T09:41:14Z" },
        { label: "Microsoft Support: Start, stop, and download live transcripts in Microsoft Teams meetings", url: "https://support.microsoft.com/en-us/teams/meetings/start-stop-and-download-live-transcripts-in-microsoft-teams-meetings", kind: "docs", verifiedAt: "2026-10-02T09:35:42Z" },
        { label: "Microsoft Support: Manage breakout rooms in Microsoft Teams", url: "https://support.microsoft.com/en-us/teams/meetings/manage-breakout-rooms-in-microsoft-teams", kind: "docs", verifiedAt: "2026-10-02T09:35:43Z" },
      ],
      video: {
        title: "How to use Microsoft Teams Lobby",
        channel: "Kevin Stratvert",
        url: "https://www.youtube.com/watch?v=dooaJNiSarc",
        videoId: "dooaJNiSarc",
        verifiedAt: "2026-10-02T09:35:54Z",
      },
      alternateVideos: [
        {
          title: "How to use Teams Breakout Rooms",
          channel: "Kevin Stratvert",
          url: "https://www.youtube.com/watch?v=DMfsilBhW7A",
          videoId: "DMfsilBhW7A",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
        {
          title: "Automate Note Taking in Microsoft Teams with Meeting Transcription",
          channel: "Microsoft Mechanics",
          url: "https://www.youtube.com/watch?v=PqzGP40Krks",
          videoId: "PqzGP40Krks",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-teams-meetings-features-q1",
          prompt:
            "You are demoing an unreleased fintech app to a client. The invite was forwarded around their company. What meeting option matters most?",
          options: [
            "The lobby: only invited people or our organisation bypass it, others wait to be admitted",
            "Turning off the chat",
            "Turning on live captions",
            "Changing the meeting background",
          ],
          correctIndex: 0,
          explanation: "The lobby lets you see who is joining before they see the product. Chat and captions do not control access.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-meetings-features-q2",
          prompt: "What should you do just before you start recording a client call?",
          options: [
            "Tell everyone you will record and why, and where the recording will be shared",
            "Nothing: Teams handles it",
            "Mute the client",
            "Record without saying anything so people speak naturally",
          ],
          correctIndex: 0,
          explanation:
            "Teams shows a notice, but saying it is basic respect and often a legal or contract expectation. Recording secretly damages trust.",
        },
        {
          id: "pma-teams-meetings-features-q3",
          prompt: "Which meeting options should you set before a client sprint demo? (Select all that apply.)",
          options: [
            "Who can bypass the lobby",
            "Who can present (usually only our team)",
            "Whether to record and transcribe automatically, if your policy allows",
            "The client's laptop display resolution",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Lobby, presenter roles and recording are organiser settings. The client's display is not something you control.",
        },
        {
          id: "pma-teams-meetings-features-q4",
          prompt:
            "A client attendee starts sharing their screen in the middle of your demo by mistake. How could you have prevented it?",
          options: [
            "Set \"Who can present\" so only the organiser and chosen presenters can share",
            "Turn off the lobby",
            "Disable the transcript",
            "Use a breakout room",
          ],
          correctIndex: 0,
          explanation: "Attendees cannot share screen; presenters can. Set roles in Meeting options before the call.",
        },
        {
          id: "pma-teams-meetings-features-q5",
          prompt: "Why turn on the transcript during a requirements workshop?",
          options: [
            "It gives a searchable text record, so you can check exact wording when writing the minutes",
            "It replaces the need for minutes",
            "It automatically creates Jira tickets",
            "It translates the client's contract",
          ],
          correctIndex: 0,
          explanation:
            "A transcript helps you write accurate minutes and settle \"who said what\". It is raw text, not a summary of decisions.",
        },
        {
          id: "pma-teams-meetings-features-q6",
          prompt:
            "You run a 2-hour discovery workshop with 12 client people. You want the ops team and the marketing team to work on different things for 30 minutes. What do you use?",
          options: [
            "Breakout rooms, created and assigned before the meeting, with a timer",
            "Two separate meetings at the same time",
            "Mute half of the attendees",
            "A private channel",
          ],
          correctIndex: 0,
          explanation: "Breakout rooms split one meeting into groups and bring them back together. Preparing rooms in advance saves time live.",
        },
        {
          id: "pma-teams-meetings-features-q7",
          prompt:
            "Six months later the client asks for the recording of the kickoff, and you cannot find it. What is the most likely reason?",
          options: [
            "Recordings can expire after a period set by the admin, and nobody saved the key parts or wrote minutes",
            "Teams never stores recordings",
            "Only the client could see the recording",
            "Recordings are deleted when the meeting ends",
          ],
          correctIndex: 0,
          explanation:
            "Recording storage and expiry follow your organisation's settings. Minutes in the project channel are the lasting record.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-meetings-features-q8",
          prompt: "What should you share after a recorded client demo? (Select all that apply.)",
          options: [
            "The minutes with decisions, action items and owners",
            "The recording or transcript link, for people who missed it",
            "Answers to questions you promised to follow up",
            "The internal debrief chat where the team discussed the client",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Minutes, links and promised answers close the meeting. Internal debriefs stay internal.",
        },
      ],
      practice: {
        kind: "rank",
        prompt:
          "You are running the sprint 6 demo of a Laravel admin portal for a UK client on Teams. Put these steps in the right order.",
        items: [
          { id: "schedule", label: "Schedule the meeting with the client attendees and the project team" },
          { id: "options", label: "Set Meeting options: lobby, who can present, recording" },
          { id: "dryrun", label: "Do a dry run on staging with the presenter and test screen sharing" },
          { id: "announce", label: "At the start, say you will record and transcribe, then start them" },
          { id: "demo", label: "Run the demo and capture decisions and questions" },
          { id: "follow", label: "Send minutes with the recording link and action items" },
        ],
        correctOrder: ["schedule", "options", "dryrun", "announce", "demo", "follow"],
        explanation:
          "Set options once the meeting exists, test before the client joins, announce recording before starting it, and close with written minutes and the link.",
      },
      sop: [
        {
          title: "Our meeting cadence and MoM template",
          prompt:
            "[Oyelabs SOP – admin to fill] Which client meetings we hold and how often (kickoff, weekly status, sprint demo, UAT), which are recorded, the standard Meeting options to set, the minutes-of-meeting (MoM) template, where minutes and recordings are stored, and the deadline for sending minutes.",
        },
      ],
    },
    {
      id: "pma-teams-tabs-planner-loop",
      moduleId: "pma-teams",
      trackId: "pm",
      title: "Tabs: Planner and Loop",
      summary:
        "A Teams channel can hold more than chat. Tabs at the top of a channel pin an app or a file there, so the whole team opens the same thing in one click. Two of the most useful for PMs are Planner, a simple task board with buckets, owners and due dates, and Loop components, small live blocks such as a table, a checklist or a task list that you drop into a chat or a post and that everyone can edit in place.\n\nWhy it matters: not every client project needs Jira. A small WordPress fix-up, a two-week discovery or an internal launch checklist is often easier to run on a Planner board inside the project team. Loop components are great for things that change during a conversation: an agenda that people add to before a call, or a list of action items the team ticks off right in the chat.\n\nHow to do it: add a Planner tab to the channel, create buckets such as To do, In progress, In review and Done, and give each task one owner and a due date. Add a Loop checklist or table in the meeting chat for the agenda and action items, so updates show up everywhere it is shared. Keep the source of truth clear: if the dev team runs its sprint in Jira or GitHub, do not copy every ticket into Planner too. Use Planner for work that has no other home, and link to the real tracker for the rest.\n\nCommon mistakes: running the same tasks in two tools, so they drift apart; tasks with no owner or no date; and forgetting that a Loop component is stored as a file in the creator's OneDrive. If that person leaves, the shared component can disappear. Keep important lists in a file or board that belongs to the team.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Microsoft Learn: Manage the Planner app for your organization in Microsoft Teams", url: "https://learn.microsoft.com/en-us/microsoftteams/manage-planner-app", kind: "docs", verifiedAt: "2026-10-02T09:35:23Z" },
        { label: "Microsoft Support: Send a Loop component in Microsoft Teams chats", url: "https://support.microsoft.com/en-us/teams/apps-service/send-a-loop-component-in-microsoft-teams-chats", kind: "docs", verifiedAt: "2026-10-02T09:44:47Z" },
        { label: "Microsoft Support: Add an app to Microsoft Teams", url: "https://support.microsoft.com/en-us/teams/apps-service/add-an-app-to-microsoft-teams", kind: "docs", verifiedAt: "2026-10-02T09:35:42Z" },
      ],
      video: {
        title: "How to use the NEW Microsoft Planner in Teams",
        channel: "Teacher's Tech",
        url: "https://www.youtube.com/watch?v=r3dpzqttDuA",
        videoId: "r3dpzqttDuA",
        verifiedAt: "2026-10-02T09:35:55Z",
      },
      alternateVideos: [
        {
          title: "How to Use Loop Components in Microsoft Teams Chat",
          channel: "Microsoft Teams",
          url: "https://www.youtube.com/watch?v=s7b5sPEDlyw",
          videoId: "s7b5sPEDlyw",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-teams-tabs-planner-loop-q1",
          prompt: "The dev team runs its sprint in Jira. You also copy every Jira ticket into a Planner board in Teams. What is the problem?",
          options: [
            "Two trackers drift apart and nobody knows which status is true",
            "Planner cannot hold more than ten tasks",
            "Jira stops working when Planner is added",
            "There is no problem; more visibility is always better",
          ],
          correctIndex: 0,
          explanation: "One source of truth per piece of work. Link to Jira from a tab instead of duplicating tickets.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-tabs-planner-loop-q2",
          prompt: "Which work is a good fit for a Planner board inside the project team? (Select all that apply.)",
          options: [
            "A go-live checklist: DNS, SSL, store listings, client sign-off",
            "Discovery tasks for a two-week workshop",
            "Small content fixes on a client's WordPress site with no Jira project",
            "The developers' sprint, already tracked in GitHub Projects",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Planner fits work without another home. Duplicating a sprint already in GitHub creates drift.",
        },
        {
          id: "pma-teams-tabs-planner-loop-q3",
          prompt: "What makes a Planner task useful rather than decoration?",
          options: ["One owner and a due date", "A colourful label", "A long title", "Being in the first bucket"],
          correctIndex: 0,
          explanation: "A task without an owner and date is a wish. Labels help filtering but do not create accountability.",
        },
        {
          id: "pma-teams-tabs-planner-loop-q4",
          prompt: "You paste a Loop checklist of action items into the client meeting chat. A developer ticks an item from the Dev channel where you also shared it. What happens?",
          options: [
            "The item is ticked everywhere the component is shared",
            "Only the Dev channel copy changes",
            "The tick is saved only after you approve it",
            "Loop components are read-only once shared",
          ],
          correctIndex: 0,
          explanation: "Loop components are live: every place it is shared shows the same, current content.",
        },
        {
          id: "pma-teams-tabs-planner-loop-q5",
          prompt:
            "The launch checklist was a Loop component created by a PM who has since left. It now fails to open. Why?",
          options: [
            "Loop components are stored as files in the creator's OneDrive, which was removed",
            "Loop components expire after one week",
            "Only the creator can ever open a Loop component",
            "Teams deletes components from old chats",
          ],
          correctIndex: 0,
          explanation:
            "The component's file lives in its creator's OneDrive. Keep long-lived lists on a team-owned board or file.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-tabs-planner-loop-q6",
          prompt: "Which tabs are worth pinning in a client project's main channel? (Select all that apply.)",
          options: [
            "The project tracker (Jira, GitHub Projects or Planner)",
            "The latest approved design file",
            "The SOW and change request log",
            "A random news website",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Pin what the team opens every week. Unrelated tabs add clutter.",
        },
        {
          id: "pma-teams-tabs-planner-loop-q7",
          prompt: "What is a good use of a Loop table before a weekly client call?",
          options: [
            "A shared agenda the client and team add items to before the call",
            "The signed contract",
            "Developers' passwords for staging",
            "A copy of every chat message",
          ],
          correctIndex: 0,
          explanation: "Live, short-lived lists are Loop's strength. Contracts and secrets do not belong in chat components.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-tabs-planner-loop-q8",
          prompt: "How should you set up Planner buckets for a small go-live?",
          options: [
            "Simple stages such as To do, In progress, In review, Done",
            "One bucket per team member",
            "One bucket per day of the month",
            "A single bucket for everything",
          ],
          correctIndex: 0,
          explanation: "Stage buckets show flow at a glance; owners are set on tasks, not buckets.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A new PM wrote this plan for tracking a Shopify-to-Laravel migration in Teams. The developers already use GitHub Projects for the sprint. Mark the lines that will cause problems.",
        segments: [
          { id: "p1", text: "Add a GitHub Projects tab to the Dev channel so everyone can open the sprint board in Teams.", issue: null },
          { id: "p2", text: "Copy every GitHub issue into Planner too, so the client can see progress.", issue: "Duplicating the sprint in a second tool makes the two drift; give the client a summary or view instead." },
          { id: "p3", text: "Use a Planner board for the go-live checklist (DNS, SSL, redirects, sign-off).", issue: null },
          { id: "p4", text: "Planner tasks will have no owner; whoever is free picks them up.", issue: "Tasks without owners are not done; each task needs one owner and a date." },
          { id: "p5", text: "Put a Loop agenda in the weekly client meeting chat for both sides to add to.", issue: null },
          { id: "p6", text: "Keep the master list of redirect URLs only in a Loop component I create in a chat.", issue: "A long-lived master list should live in a team-owned file; a Loop component lives in its creator's OneDrive." },
          { id: "p7", text: "Pin the SOW and change request log as tabs in the main channel.", issue: null },
          { id: "p8", text: "Review the go-live board in the weekly status meeting.", issue: null },
        ],
        askExplanation: false,
      },
    },
    {
      id: "pma-teams-client-calls",
      moduleId: "pma-teams",
      trackId: "pm",
      title: "Client calls with external guests",
      summary:
        "Overseas clients join our Teams calls from their own company account, a personal account, or no account at all through the browser. Teams treats each differently. Guest access adds an outside person to a team, so they can see channels and files. External access lets people from other organisations chat, call and meet with us without joining our team. Anonymous join lets someone with the meeting link join from a browser, usually through the lobby. Knowing which one you are using tells you what the client can see.\n\nWhy it matters: a client call is the agency's shop window. A demo that starts ten minutes late because the client's CTO is stuck in the lobby, or a screen share that shows an internal chat about the client, costs more trust than any bug. And adding a client as a guest to your internal project team, when you only meant to share one file, can expose internal channels and pricing.\n\nHow to do it: send the invite from Outlook or Teams with the client's email addresses, and include the agenda and a time in both time zones. In Meeting options, let invited people bypass the lobby and keep the lobby for anyone else. Make our presenters presenters and the client attendees, unless they will share. Join five minutes early and admit people from the lobby. Share a single window, not your whole screen, and close chat, email and notifications first. If the client needs ongoing access to files, use a shared channel or specific file links, set up the way your team's SOP below says.\n\nCommon mistakes: sharing the whole screen while a Teams notification pops up with \"client is being difficult again\"; inviting the client into your internal team as a guest; and booking calls outside the agreed overlap hours, so either our team or the client joins at midnight.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "Microsoft Learn: Guest access in Microsoft Teams", url: "https://learn.microsoft.com/en-us/microsoftteams/guest-access", kind: "docs", verifiedAt: "2026-10-02T09:35:29Z" },
        { label: "Microsoft Learn: IT Admins - Manage external meetings and chat with people and organizations using Microsoft identities", url: "https://learn.microsoft.com/en-us/microsoftteams/trusted-organizations-external-meetings-chat", kind: "docs", verifiedAt: "2026-10-02T09:35:23Z" },
        { label: "Microsoft Support: Join a meeting without an account in Microsoft Teams", url: "https://support.microsoft.com/en-us/teams/meetings/join-a-meeting-without-an-account-in-microsoft-teams", kind: "docs", verifiedAt: "2026-10-02T09:35:19Z" },
        { label: "Microsoft Learn: IT Admins - Manage lobby options in Microsoft Teams", url: "https://learn.microsoft.com/en-us/microsoftteams/who-can-bypass-meeting-lobby", kind: "docs", verifiedAt: "2026-10-02T09:39:00Z" },
      ],
      video: {
        title: "Microsoft Teams External Access VS Guest Access VS Shared Channels",
        channel: "Vlad Talks Tech",
        url: "https://www.youtube.com/watch?v=-aO8KgRm2vQ",
        videoId: "-aO8KgRm2vQ",
        verifiedAt: "2026-10-02T09:35:55Z",
      },
      alternateVideos: [
        {
          title: "How to Invite External Users to a Microsoft Teams Meeting",
          channel: "Tactiq",
          url: "https://www.youtube.com/watch?v=FXX9WfaF4jE",
          videoId: "FXX9WfaF4jE",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-teams-client-calls-q1",
          prompt:
            "The client only needs to see the UAT test plan. A colleague suggests adding the client as a guest to the internal \"Acme Portal\" team. What is the risk?",
          options: [
            "As a guest member they can see the team's channels and files, including internal discussion",
            "Guests cannot open Word files",
            "Guests are charged a licence fee by the client",
            "There is no risk; guests only see what you send them",
          ],
          correctIndex: 0,
          explanation:
            "Guest access gives membership of the team. Share the one file with a specific-people link, or use a dedicated shared channel.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-client-calls-q2",
          prompt: "What is the difference between external access and guest access?",
          options: [
            "External access lets people in other organisations chat, call and meet with us; guest access adds them to a team with access to its channels and files",
            "They are the same feature with different names",
            "External access is only for phone calls",
            "Guest access is only for people inside our company",
          ],
          correctIndex: 0,
          explanation:
            "External access is communication between organisations. Guest access is membership in our team's resources.",
        },
        {
          id: "pma-teams-client-calls-q3",
          prompt: "The client's new marketing head has no Microsoft account. Can she join the demo?",
          options: [
            "Yes, usually from a browser using the meeting link, if anonymous join is allowed; she may wait in the lobby",
            "No, every attendee needs a Microsoft 365 licence",
            "Only if she is added as a guest to the team first",
            "Only on a phone",
          ],
          correctIndex: 0,
          explanation: "People without an account can join from the link in a browser when the organisation allows it, typically through the lobby.",
        },
        {
          id: "pma-teams-client-calls-q4",
          prompt: "Before sharing your screen in a client demo, what should you do? (Select all that apply.)",
          options: [
            "Share one window or the browser with the app, not the whole screen",
            "Close or mute chat, email and notifications",
            "Log in to staging with demo data beforehand",
            "Open the internal debrief chat in another window for quick notes",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Window sharing, silenced notifications and ready demo data prevent leaks and fumbling. Internal chats should be closed.",
        },
        {
          id: "pma-teams-client-calls-q5",
          prompt:
            "Your team is in India (IST) and the client is in New York. You need a 45-minute call with both the dev lead and the client CTO. Which approach is best?",
          options: [
            "Pick a slot in the agreed overlap window and show both local times in the invite",
            "Book 2 pm IST because it suits our team",
            "Book 9 am New York time without checking the Indian side",
            "Let the client choose any time and tell the team to adjust",
          ],
          correctIndex: 0,
          explanation:
            "Overlap windows protect both sides. Showing both times in the invite avoids no-shows. Your team's SOP sets the actual overlap rules.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-client-calls-q6",
          prompt: "Halfway through the demo, someone unknown appears in the lobby with the name \"iPhone\". What do you do?",
          options: [
            "Ask in the meeting whether anyone is expecting a colleague on a phone before admitting them",
            "Admit them immediately",
            "End the meeting",
            "Ignore the lobby until the end",
          ],
          correctIndex: 0,
          explanation:
            "Checking takes ten seconds and protects an unreleased product. It is often a client attendee on mobile, so do not ignore them either.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-teams-client-calls-q7",
          prompt: "Which roles should you usually give in a client sprint demo?",
          options: [
            "Our PM and demo developer as presenters; client attendees as attendees unless they need to share",
            "Everyone as presenter",
            "The client as organiser",
            "Everyone as attendee, including our demo developer",
          ],
          correctIndex: 0,
          explanation: "Presenter rights control sharing. Give them to people who will share, and switch roles live if a client needs to show something.",
        },
        {
          id: "pma-teams-client-calls-q8",
          prompt: "A client wants an ongoing space to discuss the project with your team. Which options are reasonable? (Select all that apply.)",
          options: [
            "A shared channel set up for the client, if your organisation allows it",
            "A dedicated client-facing team with them as guests, separate from internal teams",
            "Regular meetings plus email for decisions",
            "Adding them as guests to the internal team where pricing is discussed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Separate client-facing spaces keep internal talk private. The internal team is the wrong place for client access.",
        },
        {
          id: "pma-teams-client-calls-q9",
          prompt: "The client's CTO is stuck in the lobby for 8 minutes because nobody saw the notice. What prevents this next time?",
          options: [
            "Set invited people to bypass the lobby and join a few minutes early to admit anyone else",
            "Turn off the lobby for everyone on every call",
            "Ask the CTO to join from a different device",
            "Send the CTO a separate link",
          ],
          correctIndex: 0,
          explanation: "Letting invited people in directly keeps protection for uninvited ones. Removing the lobby entirely loses that protection.",
        },
      ],
      practice: {
        kind: "sim",
        app: "teams",
        prompt:
          "This is the meeting chat from a sprint demo with a client in Sydney for a React Native delivery app. Flag the moments that show a risk or a mistake in how the call is run, then answer the questions.",
        title: "QuickDrop · Sprint 4 demo",
        columns: ["Person", "Time", "Message"],
        rows: [
          { id: "c1", cells: ["Ankit (PM)", "08:58", "Morning Tom and Lisa. I'd like to record this demo for those who couldn't join. Is everyone OK with that?"], issue: null },
          { id: "c2", cells: ["Tom (client)", "08:59", "Yes, fine by us."], issue: null },
          { id: "c3", cells: ["Ankit (PM)", "09:03", "Admitted \"Guest 4471\" from the lobby without asking who it was."], issue: "Unknown person admitted to a demo of an unreleased app; check who it is first." },
          { id: "c4", cells: ["Meera (dev)", "09:05", "Sharing my whole screen. Slack and Outlook are open."], issue: "Whole-screen share with chat and email open risks showing internal or other clients' messages." },
          { id: "c5", cells: ["Lisa (client)", "09:12", "Can we see the driver tracking screen on Android too?"], issue: null },
          { id: "c6", cells: ["Ankit (PM)", "09:13", "Yes, Meera will show it on the Android build now."], issue: null },
          { id: "c7", cells: ["Ankit (PM)", "09:20", "Lisa asked to add tipping. Sure, we will add it this sprint."], issue: "Agreeing new scope live; log it as a change request and come back with impact." },
          { id: "c8", cells: ["Tom (client)", "09:25", "Great demo. When will we get the summary?"], issue: null },
          { id: "c9", cells: ["Ankit (PM)", "09:26", "Minutes and recording link will be in your inbox within 24 hours."], issue: null },
        ],
        questions: [
          {
            id: "q1",
            question: "What is the best way to respond to the tipping request (c7)?",
            options: [
              "\"Good idea. I will log it as a change request and share the effort and impact by Thursday.\"",
              "\"No, that's out of scope.\"",
              "\"Sure, we will squeeze it in.\"",
            ],
            correctIndex: 0,
            explanation: "Acknowledge, log and come back with impact. A flat no or a silent yes both hurt.",
          },
          {
            id: "q2",
            question: "Which setting would have stopped c3 from being an issue?",
            options: [
              "Only invited people bypass the lobby, and the PM checks names before admitting others",
              "Turning off recording",
              "Making everyone presenter",
            ],
            correctIndex: 0,
            explanation: "The lobby and a quick check control who sees the demo.",
          },
        ],
      },
      sop: [
        {
          title: "Our rules for client calls on Teams",
          prompt:
            "[Oyelabs SOP – admin to fill] Time-zone overlap windows per client region, how clients get access (meeting links, shared channels, guest teams) and who approves guest access, which calls may be recorded and how consent is asked, default Meeting options for client calls, and the screen-sharing checklist.",
        },
      ],
    },
    {
      id: "pma-copilot-in-teams",
      moduleId: "pma-teams",
      trackId: "pm",
      title: "Copilot in Teams",
      summary:
        "If your company has Microsoft 365 Copilot licences, Copilot can work inside Teams meetings and chats. During a meeting you can ask it \"What have I missed?\" or \"What questions are still open?\". After the meeting, intelligent recap can show a summary, suggested action items and mentions of your name. In a long chat it can summarise what happened while you were away. For a PM who runs many client calls a week, this saves real time on minutes.\n\nWhy it matters: Copilot's meeting answers are built mostly from the transcript. If transcription is off, or the organiser chose to use Copilot only during the meeting, there may be no recap afterwards. If the client's accent, a bad microphone or two people talking at once confuse the transcript, the summary will be wrong in a confident tone. It may turn \"we will consider it\" into a decision, or give an action item to the wrong person. Copilot also only sees what the user is allowed to see; it does not know what was agreed on another call or by email.\n\nHow to do it: check before the call that Copilot and transcription are allowed for this client and that the client knows. After the call, ask Copilot for decisions, action items with owners, and open questions. Then check each one against the transcript and your own notes before you send anything. Edit the result into your team's minutes template rather than pasting the raw recap to the client.\n\nCommon mistakes: sending the recap to the client unchecked; assuming Copilot is allowed on every client's calls, when some contracts limit recording or AI tools; and letting the recap replace your judgement about what really matters. Your team's SOP below says when Copilot and transcription may be used on client calls.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Microsoft Support: Catch up on meetings with Microsoft Copilot in Teams", url: "https://support.microsoft.com/en-us/teams/copilot/catch-up-on-meetings-with-microsoft-365-copilot-in-teams", kind: "docs", verifiedAt: "2026-10-02T09:38:49Z" },
        { label: "Microsoft Learn: Manage Microsoft Copilot in Teams meetings and events", url: "https://learn.microsoft.com/en-us/microsoftteams/copilot-teams-transcription", kind: "docs", verifiedAt: "2026-10-02T09:35:44Z" },
        { label: "Microsoft Learn: What is Microsoft Copilot?", url: "https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-overview", kind: "docs", verifiedAt: "2026-10-02T09:38:33Z" },
        { label: "Asana: Meeting Notes Tips: How to Take Notes & Track Actions", url: "https://asana.com/resources/meeting-notes-tips", kind: "docs", verifiedAt: "2026-10-02T10:06:59Z" },
      ],
      video: {
        title: "How to Use Copilot in Microsoft Teams Meetings | 5 Powerful Features (2026)",
        channel: "Mike Tholfsen",
        url: "https://www.youtube.com/watch?v=l0nh1sYtY5A",
        videoId: "l0nh1sYtY5A",
        verifiedAt: "2026-10-02T09:35:59Z",
      },
      alternateVideos: [
        {
          title: "Copilot in Teams and Intelligent recap | After the meeting",
          channel: "Microsoft Copilot",
          url: "https://www.youtube.com/watch?v=rLC2frnUasw",
          videoId: "rLC2frnUasw",
          verifiedAt: "2026-10-02T09:35:56Z",
        },
        {
          title: "AI Simplified | Unlock meeting insights with intelligent meeting recap in Teams",
          channel: "Microsoft Teams",
          url: "https://www.youtube.com/watch?v=uaoa-N0zsVQ",
          videoId: "uaoa-N0zsVQ",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-copilot-in-teams-q1",
          prompt:
            "After a client call you open Copilot, but there is no recap or way to ask about the meeting. What is the most likely reason?",
          options: [
            "Transcription was off, or Copilot was set to work only during the meeting",
            "Copilot only works for meetings over two hours",
            "The client was not using Copilot",
            "Recaps are emailed only to the client",
          ],
          correctIndex: 0,
          explanation:
            "Copilot after the meeting depends on the transcript. Without it, or with the during-meeting-only setting, there is nothing to work from afterwards.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-copilot-in-teams-q2",
          prompt: "The recap says: \"Decision: client approved adding Apple Pay.\" Your notes say the client said \"let's think about it\". What do you do?",
          options: [
            "Check the transcript, correct it to an open question, and do not send it as a decision",
            "Trust Copilot; it heard the whole call",
            "Send it and see if the client objects",
            "Delete the whole recap and send nothing",
          ],
          correctIndex: 0,
          explanation:
            "Summaries often harden maybes into decisions. A wrong \"decision\" in minutes becomes scope. Verify against the source.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-copilot-in-teams-q3",
          prompt: "Which questions are useful to ask Copilot after a requirements call? (Select all that apply.)",
          options: [
            "List the decisions made, with who agreed",
            "List action items with owners and dates",
            "What questions were raised but not answered?",
            "What should our price be for this project?",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Ask for structured content from the transcript. Pricing is a business decision Copilot cannot make from a call.",
        },
        {
          id: "pma-copilot-in-teams-q4",
          prompt: "What does Copilot in Teams use to answer about your meeting?",
          options: [
            "Mainly the meeting transcript and content the user has permission to see",
            "Everything said in every meeting in the company",
            "The client's internal emails",
            "Only the meeting title and invite",
          ],
          correctIndex: 0,
          explanation: "Copilot works within the user's permissions and relies on the transcript for meeting content.",
        },
        {
          id: "pma-copilot-in-teams-q5",
          prompt: "A client's contract says calls may not be recorded or processed by AI tools without written consent. What do you do?",
          options: [
            "Keep transcription and Copilot off for their calls unless written consent is given, and take notes by hand",
            "Use Copilot anyway; it is only for internal notes",
            "Turn on transcription but not recording",
            "Ask the client verbally at the start and continue",
          ],
          correctIndex: 0,
          explanation:
            "Contract terms win. Transcription is processing too, and verbal consent does not meet a written-consent clause.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-copilot-in-teams-q6",
          prompt: "Why might Copilot give an action item to the wrong person?",
          options: [
            "The transcript mixed up speakers, for example when people talk over each other or join from one room",
            "Copilot assigns tasks at random",
            "Action items always go to the organiser",
            "It only reads the chat, not speech",
          ],
          correctIndex: 0,
          explanation: "Speaker attribution errors in the transcript carry into the recap. Check owners against your notes.",
        },
        {
          id: "pma-copilot-in-teams-q7",
          prompt: "What is the right way to turn a Copilot recap into client minutes? (Select all that apply.)",
          options: [
            "Check each decision and action against the transcript or your notes",
            "Put it into your team's minutes template and edit the tone",
            "Mark anything uncertain as an open question",
            "Paste the raw recap into an email to the client",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "The recap is a draft. Verified, edited minutes in your format are what goes to the client.",
        },
        {
          id: "pma-copilot-in-teams-q8",
          prompt: "You joined a client call 15 minutes late. What is a good use of Copilot right then?",
          options: [
            "Privately ask \"What have I missed?\" to catch up without interrupting",
            "Ask Copilot to answer the client's questions for you",
            "Ask the client to repeat everything",
            "Ask Copilot to end the meeting",
          ],
          correctIndex: 0,
          explanation: "Catching up quietly during the meeting is one of Copilot's core uses; your answers to the client stay yours.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "Below is a Copilot recap of a call with a UK client about a Laravel booking platform. Compare it with your own notes and mark the lines you must not send as written.\n\nYour notes: Client (Emma, Product Owner) approved the new booking calendar design. She asked whether SMS reminders are possible; we said we would check cost with Twilio. The release date stays 20 May. Raj (our tech lead) will send the API plan by Friday. Emma will send the logo files by Wednesday. Payment provider is still undecided between Stripe and GoCardless.",
        segments: [
          { id: "r1", text: "Decision: the new booking calendar design is approved.", issue: null },
          { id: "r2", text: "Decision: SMS reminders will be added to phase 1.", issue: "SMS was only asked about; we agreed to check cost. It is an open question, not a decision." },
          { id: "r3", text: "Release date: 20 May (unchanged).", issue: null },
          { id: "r4", text: "Action: Emma to send the API plan by Friday.", issue: "Wrong owner: Raj sends the API plan; Emma sends the logo files." },
          { id: "r5", text: "Action: Emma to send logo files by Wednesday.", issue: null },
          { id: "r6", text: "Decision: Stripe chosen as the payment provider.", issue: "The provider is still undecided between Stripe and GoCardless." },
          { id: "r7", text: "Open question: cost of SMS reminders via Twilio.", issue: null },
          { id: "r8", text: "Next steps: we will share the cost check before the next call.", issue: null },
        ],
        askExplanation: true,
      },
      sop: [
        {
          title: "Our rules for Copilot and transcripts on client calls",
          prompt:
            "[Oyelabs SOP – admin to fill] Which clients allow transcription and AI meeting tools, how consent is asked and recorded, who has Copilot licences, how a Copilot recap must be checked before it goes into the MoM, and the MoM template and deadline.",
        },
      ],
    },
  ],
} satisfies Module;
