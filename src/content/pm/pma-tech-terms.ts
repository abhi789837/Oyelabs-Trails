import type { Module } from "@/types/curriculum";

export default {
  id: "pma-tech-terms",
  trackId: "pm",
  name: "Tech terms in plain language",
  description:
    "The technical words PMs hear every day, from APIs and DNS to CI/CD, caching, webhooks and LLMs. Each topic gives a plain definition, an everyday analogy, why a PM cares, and how to explain it to a client in one sentence.",
  refs: [
    { label: "MDN: How the web works", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works", kind: "docs", verifiedAt: "2026-10-02T09:35:31Z" },
    { label: "Anthropic Docs: Glossary", url: "https://platform.claude.com/docs/en/about-claude/glossary", kind: "docs", verifiedAt: "2026-10-02T09:38:58Z" },
  ],
  topics: [
    // ------------------------------------------------------------------ 1
    {
      id: "pma-frontend-backend-api",
      moduleId: "pma-tech-terms",
      trackId: "pm",
      title: "Frontend, backend and API",
      summary:
        "Clients often think an app is the screens they saw in Figma. Then the estimate says \"backend: 220 hours\" and they ask what that is. If you cannot explain it simply, the estimate looks padded. These three words explain most of what your team builds.\n\n**Plain definitions.** The frontend is the part the user sees and touches: the React web pages or the screens of the mobile app. The backend is the part on the server that the user never sees: the Laravel code that stores orders, checks passwords, sends emails and talks to the payment provider. The API (application programming interface) is the agreed way the frontend and backend talk: the frontend asks \"give me this user's orders\", and the API answers with the data.\n\n**Everyday analogy.** A restaurant. The dining room and menu are the frontend. The kitchen is the backend. The waiter is the API: they take a clear order to the kitchen and bring back the dish. The customer never enters the kitchen, and the kitchen never talks to the customer directly.\n\n**Why a PM cares.** Frontend and backend are often built by different people, and the API is the contract between them. If the API is not agreed early, the React developer waits or builds against guesses, and work is redone. Third-party APIs (Stripe, Google Maps, the client's ERP) bring outside risk: access keys, limits, costs and their own downtime. Put \"API ready\" and \"third-party access received\" in your plan as real dependencies.\n\n**Explain it to a client in one sentence.** \"The frontend is what your users see, the backend is the engine on the server that stores and processes everything, and the API is how the two talk to each other.\" The common mistake is calling the backend \"just the database\" or treating the API as a small task; a clean API is what lets you add a mobile app later without rebuilding the server.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "MDN: How the web works", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works", kind: "docs", verifiedAt: "2026-10-02T09:35:31Z" },
        { label: "AWS: Front End vs Back End", url: "https://aws.amazon.com/compare/the-difference-between-frontend-and-backend/", kind: "article", verifiedAt: "2026-10-02T09:35:28Z" },
        { label: "AWS: What is an API?", url: "https://aws.amazon.com/what-is/api/", kind: "article", verifiedAt: "2026-10-02T09:35:39Z" },
        { label: "IBM: What Is an API (Application Programming Interface)?", url: "https://www.ibm.com/think/topics/api", kind: "article", verifiedAt: "2026-10-02T09:35:38Z" },
      ],
      video: {
        title: "Frontend, API, Backend and Database explained",
        channel: "Tamara Jost",
        url: "https://www.youtube.com/watch?v=NzEYYemQ3_8",
        videoId: "NzEYYemQ3_8",
        verifiedAt: "2026-10-02T09:35:53Z",
      },
      alternateVideos: [
        {
          title: "What Is an API? Types, Uses, & AI Integration",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=Qw8qVSZEWBc",
          videoId: "Qw8qVSZEWBc",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
        {
          title: "RESTful APIs in 100 Seconds // Build an API from Scratch with Node.js Express",
          channel: "Fireship",
          url: "https://www.youtube.com/watch?v=-MTSQjw5DrM",
          videoId: "-MTSQjw5DrM",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-frontend-backend-api-q1",
          prompt: "In a React + Laravel project, which part is the frontend?",
          options: ["The Laravel code on the server", "The React screens the user sees and clicks", "The MySQL database", "The AWS account"],
          correctIndex: 1,
          explanation: "The frontend is what runs in the user's browser or phone. Laravel and the database are backend.",
        },
        {
          id: "pma-frontend-backend-api-q2",
          prompt: "In the restaurant analogy, what is the API?",
          options: ["The kitchen", "The menu design", "The waiter who carries orders and dishes between the dining room and the kitchen", "The customer"],
          correctIndex: 2,
          explanation: "The API carries requests and responses between the frontend and backend, in an agreed format.",
        },
        {
          id: "pma-frontend-backend-api-q3",
          prompt: "Which of these are backend work? (Select all that apply.)",
          options: [
            "Saving an order and sending the confirmation email",
            "Checking a user's password at login",
            "Calling Stripe to take a payment",
            "Changing the colour of the Buy button",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Storing, checking and talking to other systems happen on the server. Button colour is frontend.",
        },
        {
          id: "pma-frontend-backend-api-q4",
          prompt:
            "The client says: \"The designs are finished, so the app is mostly done, right?\" What is the most accurate reply?",
          options: [
            "Yes, design is most of the work",
            "The designs show the frontend; the backend and APIs that store data, handle logins and payments are a large, separate part of the work",
            "Only the API is left",
            "Design and code are the same thing",
          ],
          correctIndex: 1,
          explanation: "Designs are pictures of the frontend. The invisible backend is often half or more of the effort.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-frontend-backend-api-q5",
          prompt:
            "The React developer is idle because \"the API isn't ready\". What could the PM have done earlier?",
          options: [
            "Nothing; this always happens",
            "Planned the API contract (what data each screen needs) as an early dependency, so both sides could build in parallel",
            "Asked the React developer to write the backend",
            "Removed the API from scope",
          ],
          correctIndex: 1,
          explanation: "Agreeing the API early lets frontend work against the agreed shape (even with sample data) while the backend is built.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-frontend-backend-api-q6",
          prompt: "The client wants to add Google Maps to the app. What does that add to the PM's risk list?",
          options: [
            "Nothing; Google is reliable",
            "A third-party API: access keys, usage costs and limits, and a dependency outside our control",
            "Only a design change",
            "A new database",
          ],
          correctIndex: 1,
          explanation: "Every third-party API brings keys, pricing, limits and outages that the plan must account for.",
        },
      ],
      practice: {
        kind: "write",
        variant: "explain",
        prompt:
          "The client, a restaurant-chain owner with no tech background, asks by email: \"Why is there a 220-hour line called 'backend and API' in the estimate? The designs are already done.\" Explain in plain language, using one simple analogy and no jargon, why this work is needed. End with one sentence they could repeat to their business partner.",
        context: "Project: a React web app and Laravel backend for table bookings, with payments through Stripe and booking confirmation emails.",
        wordLimit: 140,
        rubric: [
          { id: "correct", label: "Technically correct", description: "Frontend = screens; backend = server work (bookings stored, payments via Stripe, emails); API = how they talk. Nothing wrong or invented.", weight: 1.5 },
          { id: "plain", label: "Plain language", description: "No unexplained jargon (no 'endpoints', 'REST', 'server-side logic'); short sentences.", weight: 1.5 },
          { id: "analogy", label: "Useful analogy", description: "One clear everyday analogy (e.g. dining room, kitchen and waiter) that maps correctly.", weight: 1 },
          { id: "oneliner", label: "One-sentence summary", description: "Ends with a single sentence the client could repeat, linking the work to their bookings and payments.", weight: 1 },
        ],
        sampleAnswer:
          "Think of the app as one of your restaurants. The designs are the dining room: what your guests see. The backend is the kitchen. It saves each booking, takes the payment through Stripe and sends the confirmation email. Guests never see it, but nothing works without it. The API is the waiter. It carries each request from the screens to the kitchen and brings the answer back. The 220 hours build the kitchen and train the waiter.\n\nIn one sentence: the designs are what guests see, and the backend is the kitchen that actually takes bookings and payments.",
      },
    },
    // ------------------------------------------------------------------ 2
    {
      id: "pma-database-server-cloud-hosting",
      moduleId: "pma-tech-terms",
      trackId: "pm",
      title: "Database, server, cloud/AWS, hosting",
      summary:
        "When the project nears launch, the client starts getting emails from AWS, and asks: what is this monthly bill, and who owns it? A PM who can explain servers, databases and the cloud prevents both surprise costs and launch-week arguments about accounts.\n\n**Plain definitions.** A database is where the app keeps its information in an organised way: users, orders, bookings. A server is a computer that is always on and connected to the internet, running the backend and answering requests. Hosting is renting space on servers so the app is reachable online. The cloud (AWS, Azure, Google Cloud, DigitalOcean) is renting servers, databases and storage by the hour from a big provider, instead of buying machines.\n\n**Everyday analogy.** The database is a well-organised filing cabinet. The server is the office worker who is always at the desk, answering calls and using the cabinet. Hosting is the office you rent for them. The cloud is a serviced-office company: you rent desks by the month, add more when you grow, and pay for electricity as you use it.\n\n**Why a PM cares.** Cloud costs are ongoing and grow with use, so the client must know the expected monthly range before launch, not after the first bill. Agree early whose account it is (the client's account is usually best for ownership), who pays, and who has admin access. Environments (development, staging, production) each cost money. Backups, monitoring and security updates are recurring work that belongs in a support plan. Your team's SOP below covers hosting ownership and billing rules.\n\n**Explain it to a client in one sentence.** \"Your app runs on rented computers in the cloud that are always on; the database is where all your data is stored, and you pay a monthly fee that grows with how much the app is used.\" The common mistake is launching on an account in the agency's name with the client's card details unknown, then fighting over access months later.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "MDN: What is a web server?", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server", kind: "docs", verifiedAt: "2026-10-02T09:35:40Z" },
        { label: "AWS: What is a Database?", url: "https://aws.amazon.com/what-is/database/", kind: "article", verifiedAt: "2026-10-02T09:35:27Z" },
        { label: "AWS: What is Cloud Computing?", url: "https://aws.amazon.com/what-is-cloud-computing/", kind: "article", verifiedAt: "2026-10-02T09:35:40Z" },
        { label: "Cloudflare: What is the cloud?", url: "https://www.cloudflare.com/learning/cloud/what-is-the-cloud/", kind: "article", verifiedAt: "2026-10-02T10:06:51Z" },
      ],
      video: {
        title: "Cloud Computing Explained",
        channel: "PowerCert Animated Videos",
        url: "https://www.youtube.com/watch?v=_a6us8kaq0g",
        videoId: "_a6us8kaq0g",
        verifiedAt: "2026-10-02T09:35:58Z",
      },
      alternateVideos: [
        {
          title: "What is a Database?",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=hRulZhTtUTg",
          videoId: "hRulZhTtUTg",
          verifiedAt: "2026-10-02T09:35:53Z",
        },
        {
          title: "What is a Server?  Servers vs Desktops Explained",
          channel: "PowerCert Animated Videos",
          url: "https://www.youtube.com/watch?v=UjCDWCeHCzY",
          videoId: "UjCDWCeHCzY",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      sop: [
        {
          title: "Hosting accounts, ownership and billing",
          prompt:
            "[Oyelabs SOP – admin to fill] Whose name cloud and hosting accounts are opened in, who pays and how hosting is billed or passed through, which access Oyelabs keeps after launch, and what the handover of hosting credentials includes.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-database-server-cloud-hosting-q1",
          prompt: "What is a database, in plain language?",
          options: [
            "The screens of the app",
            "The organised store where the app keeps its information, such as users and orders",
            "The company that hosts the app",
            "The app's design files",
          ],
          correctIndex: 1,
          explanation: "A database is the app's organised filing cabinet.",
        },
        {
          id: "pma-database-server-cloud-hosting-q2",
          prompt: "What does \"the cloud\" mean when a developer says \"we will host it on AWS\"?",
          options: [
            "The app will be stored in the client's laptop",
            "Servers, databases and storage are rented from Amazon and paid for as they are used",
            "The app will work without the internet",
            "The app is free to run",
          ],
          correctIndex: 1,
          explanation: "Cloud means renting computing from a provider, usually paid monthly based on use.",
        },
        {
          id: "pma-database-server-cloud-hosting-q3",
          prompt: "Which hosting points should a PM agree with the client before launch? (Select all that apply.)",
          options: [
            "Whose account the hosting is in, and who pays",
            "The expected monthly cost range, and what makes it grow",
            "Who keeps admin access after launch",
            "The developer's favourite programming language",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Ownership, cost and access cause most hosting disputes. Language choice is a technical detail, not a hosting agreement.",
        },
        {
          id: "pma-database-server-cloud-hosting-q4",
          prompt:
            "Three months after launch, the client's AWS bill doubles. The app has twice as many users. What is the best explanation?",
          options: [
            "AWS made a billing error",
            "Cloud costs grow with use: more users mean more server time, storage and data transfer",
            "The developers left something running for fun",
            "Cloud bills never change",
          ],
          correctIndex: 1,
          explanation:
            "Pay-as-you-go pricing grows with traffic. It is worth checking for waste too, but growth in users is the normal driver, and the client should have been told to expect it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-database-server-cloud-hosting-q5",
          prompt:
            "The production server is in a developer's personal AWS account, paid on his card. He leaves Oyelabs. What is the risk?",
          options: [
            "No risk; he will keep paying",
            "The client's live app depends on an account nobody else controls; access, billing and data could be lost",
            "Only a small delay",
            "AWS will move it automatically",
          ],
          correctIndex: 1,
          explanation: "Hosting must sit in an account the client (or the company, per SOP) controls, with shared admin access.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-database-server-cloud-hosting-q6",
          prompt: "Why do staging and production environments both cost money?",
          options: [
            "They don't; staging is free",
            "Each environment runs its own servers and database, so each has its own hosting cost",
            "Only production has servers",
            "Staging is paid by the developer",
          ],
          correctIndex: 1,
          explanation: "Every environment is a separate set of running resources. Plan and explain the cost of each.",
        },
      ],
      practice: {
        kind: "write",
        variant: "explain",
        prompt:
          "A client who runs a fitness studio forwards their first AWS bill ($84) and asks: \"What is this? I thought I paid you for the app already.\" Write a short, friendly reply that explains in plain language what hosting, servers and the database are, why the bill is monthly, and that it will grow as more members use the app. End with one sentence they can remember.",
        context: "The Laravel backend, MySQL database and file storage for member photos run on AWS in the client's own account, as agreed in the SOW. Oyelabs does not mark up hosting.",
        wordLimit: 150,
        rubric: [
          { id: "correct", label: "Technically correct", description: "Explains that the app runs on rented servers with a database and storage in the client's AWS account, and that this is separate from the build fee.", weight: 1.5 },
          { id: "plain", label: "Plain language", description: "Uses everyday words or a simple analogy (e.g. renting an office or a gym space); no unexplained terms like 'EC2' or 'RDS'.", weight: 1.5 },
          { id: "cost", label: "Why monthly and why it grows", description: "Explains pay-as-you-go: the bill is monthly and rises with more members, photos and use.", weight: 1 },
          { id: "tone", label: "Calm, client tone", description: "Friendly, not defensive; reminds them it is in their own account as agreed, and offers to walk through the bill.", weight: 1 },
        ],
        sampleAnswer:
          "Hi Jess,\n\nGood question. The $84 is not from us. It is the running cost of your app.\n\nYour app needs a computer that is always on to answer your members. It also needs a place to store their bookings and photos. Instead of buying that computer, we rent it from Amazon in your own account, as we agreed in the contract. Like renting studio space, you pay for it every month.\n\nThe bill grows a little as more members use the app and upload photos. That is a good sign.\n\nIn one sentence: you paid us to build the app, and AWS charges a monthly rent to keep it running.\n\nHappy to go through the bill on a short call.\n\nPriya",
      },
    },
    // ------------------------------------------------------------------ 3
    {
      id: "pma-domain-dns-ssl",
      moduleId: "pma-tech-terms",
      trackId: "pm",
      title: "Domain, DNS, SSL",
      summary:
        "Launch day often fails on the last ten minutes, not the code: nobody has the login for the client's domain registrar, the DNS change takes hours to spread, or the browser shows \"Not secure\" because the SSL certificate is missing. A PM who understands these three words plans them a week ahead.\n\n**Plain definitions.** A domain is the name of the website, such as acmeshop.com. It is rented yearly from a registrar (GoDaddy, Namecheap, Cloudflare). DNS (Domain Name System) is the internet's address book: it turns the name into the address of the server where the app lives. SSL (more correctly TLS) is the security layer that encrypts the connection, shown by https and the padlock. It needs a certificate that must be renewed.\n\n**Everyday analogy.** The domain is your shop's name on the sign. DNS is the city directory that tells people which street the shop is on; if you move shops, you update the directory, and it takes a while before everyone's copy is updated. SSL is a sealed envelope: what you send cannot be read on the way, and the seal proves the shop is really yours.\n\n**Why a PM cares.** DNS changes can take from minutes to a day or more to reach everyone (\"propagation\"), so do not switch DNS an hour before a launch demo. Get registrar and DNS access from the client early; it is often owned by someone who left. Certificates expire: an expired certificate makes browsers block the site, so renewal must be automatic or owned by someone. Email (MX records) also lives in DNS, so a careless change can break the client's email. Your team's SOP below covers who owns domains, DNS and SSL renewals.\n\n**Explain it to a client in one sentence.** \"Your domain is the website's name, DNS is the directory that points that name to our servers, and SSL is the padlock that keeps visitors' data private.\" The common mistake is promising \"the site will be live at 10 am\" right after a DNS switch.",
      level: "beginner",
      estMinutes: 25,
      webRefs: [
        { label: "MDN: What is a Domain Name?", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_domain_name", kind: "docs", verifiedAt: "2026-10-02T09:35:25Z" },
        { label: "Cloudflare: What is DNS?", url: "https://www.cloudflare.com/learning/dns/what-is-dns/", kind: "article", verifiedAt: "2026-10-02T10:07:13Z" },
        { label: "Cloudflare: What is SSL?", url: "https://www.cloudflare.com/learning/ssl/what-is-ssl/", kind: "article", verifiedAt: "2026-10-02T10:07:44Z" },
        { label: "AWS: What Is An SSL Certificate?", url: "https://aws.amazon.com/what-is/ssl-certificate/", kind: "article", verifiedAt: "2026-10-02T10:07:44Z" },
      ],
      video: {
        title: "DNS Explained in 100 Seconds",
        channel: "Fireship",
        url: "https://www.youtube.com/watch?v=UVR9lhUGAyU",
        videoId: "UVR9lhUGAyU",
        verifiedAt: "2026-10-02T09:35:54Z",
      },
      alternateVideos: [
        {
          title: "SSL, TLS, HTTP, HTTPS Explained",
          channel: "PowerCert Animated Videos",
          url: "https://www.youtube.com/watch?v=hExRDVZHhig",
          videoId: "hExRDVZHhig",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
        {
          title: "SSL, TLS, HTTPS Explained",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=j9QmMEWmcfo",
          videoId: "j9QmMEWmcfo",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
      ],
      sop: [
        {
          title: "Domains, DNS and SSL: who owns what",
          prompt:
            "[Oyelabs SOP – admin to fill] Whose account domains and DNS are kept in, how and when the PM requests registrar/DNS access from the client, who makes DNS changes on launch day, and how SSL renewal is set up and monitored.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-domain-dns-ssl-q1",
          prompt: "What does DNS do?",
          options: [
            "Encrypts the website",
            "Turns a domain name like acmeshop.com into the address of the server where the site lives",
            "Stores the app's users",
            "Designs the website",
          ],
          correctIndex: 1,
          explanation: "DNS is the internet's address book or directory.",
        },
        {
          id: "pma-domain-dns-ssl-q2",
          prompt: "A visitor's browser shows \"Not secure\" on the client's new site. What is the most likely cause?",
          options: [
            "The domain name is too long",
            "There is no valid SSL certificate, so the site is not served over https",
            "The database is down",
            "The site has too many images",
          ],
          correctIndex: 1,
          explanation: "\"Not secure\" means the connection is not encrypted with a valid certificate.",
        },
        {
          id: "pma-domain-dns-ssl-q3",
          prompt:
            "The team switches the client's DNS to the new server at 9:50 for a 10:00 launch demo. Some people see the new site, others the old one. Why?",
          options: [
            "The new site is broken",
            "DNS changes take time to spread, because many systems keep a cached copy of the old address for a while",
            "The client's laptop is too old",
            "SSL is blocking it",
          ],
          correctIndex: 1,
          explanation:
            "Propagation can take minutes to many hours. Make the DNS change well before a public launch or demo, and lower the cache time in advance.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-domain-dns-ssl-q4",
          prompt: "Which tasks should a PM schedule at least a week before go-live? (Select all that apply.)",
          options: [
            "Get registrar and DNS access from the client",
            "Confirm who owns SSL certificate renewal",
            "Check the client's email records so a DNS change does not break their email",
            "Choose the colour of the launch-day cake",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Access, certificates and email records are the usual launch-day blockers.",
        },
        {
          id: "pma-domain-dns-ssl-q5",
          prompt:
            "Eleven months after launch, the client's site suddenly shows a full-page browser warning and customers cannot check out. Nothing was deployed. What should the PM suspect first?",
          options: [
            "A hacker attack",
            "An expired SSL certificate that was not set to renew automatically",
            "A database bug",
            "A DNS propagation delay",
          ],
          correctIndex: 1,
          explanation:
            "Certificates expire on a fixed date. Without automatic renewal or a named owner, the site breaks on that date without any code change.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-domain-dns-ssl-q6",
          prompt: "Which one-sentence explanation of SSL is best for a client?",
          options: [
            "SSL is a TLS handshake using asymmetric cryptography.",
            "SSL is the padlock in the browser: it keeps what visitors send private and proves the site is really yours.",
            "SSL makes the site load faster.",
            "SSL is the website's name.",
          ],
          correctIndex: 1,
          explanation: "It is correct and plain. The first is accurate but jargon; the others are wrong.",
        },
      ],
      practice: {
        kind: "write",
        variant: "explain",
        prompt:
          "At 11:00 your client in London emails: \"You said the new website would be live this morning. My phone shows the new site but my office PC still shows the old one. Is something broken?\" The team changed the DNS at 10:30. Reply in plain language: explain what is happening, what they can expect, and what you are doing. Use one simple analogy.",
        context: "The new React site is working. DNS was pointed to the new server at 10:30 London time. The team expects most visitors to see the new site within a few hours, and everyone within 24 hours. The SSL certificate is in place.",
        wordLimit: 140,
        rubric: [
          { id: "correct", label: "Technically correct", description: "Explains that nothing is broken: the address change (DNS) takes time to reach all devices and networks, so some still see the old site.", weight: 1.5 },
          { id: "plain", label: "Plain language and analogy", description: "Uses a simple analogy (e.g. updating a directory or a change of address that takes time to reach everyone) and no jargon like 'TTL' or 'resolver cache'.", weight: 1.5 },
          { id: "expectation", label: "Clear expectation", description: "Gives a realistic time frame (most within a few hours, all within 24 hours) without over-promising.", weight: 1 },
          { id: "action", label: "What we are doing", description: "Says the team is monitoring and will confirm when it is visible everywhere, with a time for the next update.", weight: 1 },
        ],
        sampleAnswer:
          "Hi Anna,\n\nNothing is broken. Your new site is live, and your phone already shows it.\n\nThis morning we changed the internet's 'directory' so that your web address points to the new site. It is like telling everyone your shop has moved. Some devices and office networks keep an old copy of the directory for a while, so they still show the old site.\n\nMost people will see the new site within a few hours, and everyone within 24 hours. We are watching it, and I will update you by 16:00 London time.\n\nBest regards,\nPriya",
      },
    },
    // ------------------------------------------------------------------ 4
    {
      id: "pma-deployment-cicd-staging",
      moduleId: "pma-tech-terms",
      trackId: "pm",
      title: "Deployment, CI/CD, staging",
      summary:
        "Developers say \"it's merged\", \"it's on staging\", \"the pipeline failed\", \"we'll deploy tonight\". To a client these all sound like \"done\". They are not the same, and mixing them up is how a PM tells a client a feature is live when it is only on a test server.\n\n**Plain definitions.** Deployment is putting a new version of the app onto a server so people can use it. Environments are separate copies of the app: development (each developer's own), staging (a private test copy that looks like the real one, where the client does UAT), and production (the live app real users use). CI/CD means continuous integration and continuous delivery or deployment: an automatic pipeline that, every time code is merged, builds the app, runs the automated tests and, if they pass, deploys it to staging or production.\n\n**Everyday analogy.** A restaurant tests a new dish in the kitchen (development), serves it to staff and a few regulars at a tasting (staging), and only then adds it to the menu for everyone (production). CI/CD is the kitchen checklist that runs every time: ingredients checked, dish tasted, plate cleaned, before it can leave the kitchen.\n\n**Why a PM cares.** \"Done\" must say where: on staging for UAT, or live on production. A failed pipeline means the change has not been deployed, and is often a good thing: the tests caught a problem. Releases to production need a window the client agrees to, a rollback plan, and someone watching after go-live. Mobile apps add a step: after deployment the build waits for App Store or Google Play review. Your team's SOP below sets release windows and who approves a production deploy.\n\n**Explain it to a client in one sentence.** \"We first put each update on a private test copy called staging for you to check, and only after you approve do we release it to the live app your customers use.\" The common mistake is telling the client \"it's done\" when it is merged but not yet deployed.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "GitHub Docs: Managing environments for deployment", url: "https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments", kind: "docs", verifiedAt: "2026-10-02T09:35:34Z" },
        { label: "AWS: What is CI/CD?", url: "https://aws.amazon.com/what-is/ci-cd/", kind: "article", verifiedAt: "2026-10-02T09:35:31Z" },
        { label: "Atlassian: Continuous integration vs. delivery vs. deployment", url: "https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment", kind: "article", verifiedAt: "2026-10-02T09:35:45Z" },
        { label: "IBM: What Is Continuous Integration?", url: "https://www.ibm.com/think/topics/continuous-integration", kind: "article", verifiedAt: "2026-10-02T09:35:23Z" },
      ],
      video: {
        title: "CI/CD Explained in 5 Minutes",
        channel: "TechWorld with Nana",
        url: "https://www.youtube.com/watch?v=ddDJxFnv-qs",
        videoId: "ddDJxFnv-qs",
        verifiedAt: "2026-10-02T09:35:56Z",
      },
      alternateVideos: [
        {
          title: "DevOps CI/CD Explained in 100 Seconds",
          channel: "Fireship",
          url: "https://www.youtube.com/watch?v=scEDHsr3APg",
          videoId: "scEDHsr3APg",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
        {
          title: "What is Continuous Integration?",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=1er2cjUq1UI",
          videoId: "1er2cjUq1UI",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
      ],
      sop: [
        {
          title: "Our release windows and environments",
          prompt:
            "[Oyelabs SOP – admin to fill] Which environments every project has, the allowed production release days and times (and freeze periods), who approves a production deploy, the rollback rule, and how the client is told before and after a release.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-deployment-cicd-staging-q1",
          prompt: "What is staging?",
          options: [
            "The live app real customers use",
            "A private copy of the app, set up like the live one, where the team and client test before release",
            "A developer's laptop",
            "The design file",
          ],
          correctIndex: 1,
          explanation: "Staging is the rehearsal stage: production-like, but not live.",
        },
        {
          id: "pma-deployment-cicd-staging-q2",
          prompt: "The developer says \"the login fix is merged\". What can you safely tell the client?",
          options: [
            "\"The fix is live.\"",
            "Nothing yet about where it is: check whether it has been deployed to staging or production first",
            "\"The fix will never be released.\"",
            "\"The fix is on your phone now.\"",
          ],
          correctIndex: 1,
          explanation: "Merged means the code is combined in the repository. It may not be deployed anywhere yet.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-deployment-cicd-staging-q3",
          prompt: "What does a CI/CD pipeline do? (Select all that apply.)",
          options: [
            "Builds the app automatically when code is merged",
            "Runs the automated tests",
            "Deploys to staging or production if the checks pass",
            "Writes the client's requirements",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Build, test, deploy, automatically and the same way every time. Requirements are still people's work.",
        },
        {
          id: "pma-deployment-cicd-staging-q4",
          prompt: "The pipeline \"failed\" on tonight's release. How should a PM read this?",
          options: [
            "The production app is broken",
            "The new version was stopped before deployment, usually because a check or test found a problem; the live app is unchanged",
            "The developers made the pipeline on purpose to fail",
            "The client must be told the project failed",
          ],
          correctIndex: 1,
          explanation:
            "A failed pipeline usually protects production. The question is what failed and how long the fix takes, not panic.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-deployment-cicd-staging-q5",
          prompt: "Which things should be agreed before a production release? (Select all that apply.)",
          options: [
            "The release window the client accepts",
            "A rollback plan if something goes wrong",
            "Who watches the app after go-live",
            "That no one tells the client until it is done",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Window, rollback and monitoring make a release safe. Surprising the client is not part of it.",
        },
        {
          id: "pma-deployment-cicd-staging-q6",
          prompt:
            "A React Native update was deployed and submitted on Monday. On Tuesday the client says users still don't have it. Why?",
          options: [
            "Deployment failed",
            "Mobile updates must pass App Store / Google Play review, and users must then update the app",
            "Staging and production are the same",
            "The client's phone is broken",
          ],
          correctIndex: 1,
          explanation: "Mobile has extra steps after deployment: store review, then gradual release and user updates.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-deployment-cicd-staging-q7",
          prompt: "Why do UAT on staging rather than on production?",
          options: [
            "Staging is faster",
            "Testing on production risks real customer data and real payments; staging lets the client test safely",
            "Production has no database",
            "UAT must always be done on a laptop",
          ],
          correctIndex: 1,
          explanation: "Staging is a safe copy. Test orders and test payments do not touch real customers.",
        },
        {
          id: "pma-deployment-cicd-staging-q8",
          prompt: "Which status line to a client is clearest?",
          options: [
            "\"Done.\"",
            "\"The invoice export is on staging for your testing; we plan to release it to the live app on Thursday after your approval.\"",
            "\"It's merged into main, CI is green.\"",
            "\"Deployed somewhere.\"",
          ],
          correctIndex: 1,
          explanation: "It says where the feature is, what the client must do and when it goes live.",
        },
      ],
      practice: {
        kind: "write",
        variant: "explain",
        prompt:
          "Translate this developer update into a short message for the client, a non-technical founder of a US e-commerce brand. Say where each item is (live, ready for testing, or not yet), what the client needs to do, and when things will happen. No jargon.",
        context:
          "Dev update (Teams, 6:40 pm IST): \"PR #212 (wishlist) merged + deployed to staging, ready for UAT. PR #215 (promo codes) — CI red, 2 unit tests failing on discount rounding, fix tomorrow AM. Hotfix for the iOS crash on checkout went to prod 4pm, build 2.3.1 submitted to App Store, waiting review. Prod deploy for wishlist planned Thu after client sign-off.\"",
        wordLimit: 170,
        rubric: [
          { id: "correct", label: "Accurate status per item", description: "Wishlist: ready for the client to test on staging, live Thursday after approval. Promo codes: automatic checks found a rounding problem with discounts, fix tomorrow, not yet ready. iOS checkout crash: fixed and sent to Apple, waiting for Apple's review before users get it.", weight: 2 },
          { id: "plain", label: "No jargon", description: "No 'PR', 'CI red', 'unit tests', 'prod', 'hotfix' or 'build 2.3.1' without explanation; short sentences.", weight: 1.5 },
          { id: "ask", label: "Clear client action", description: "Asks the client to test the wishlist on the test site and approve it, with a deadline that allows Thursday's release.", weight: 1 },
          { id: "tone", label: "Calm and positive", description: "Presents the failing check as the safety net working, not as a crisis; no blame.", weight: 0.5 },
        ],
        sampleAnswer:
          "Hi Mia,\n\nA quick update on three items:\n\n1. Wishlist: ready for you to test on the test site. If you approve it by Wednesday evening your time, we will put it live on Thursday.\n2. Promo codes: our automatic checks found a small rounding problem in discounts, so we stopped it before it reached you. We fix it tomorrow and will send it for testing after that.\n3. iPhone checkout crash: fixed. The new version is waiting for Apple's review, which usually takes a day or two. Customers will get it as an app update after Apple approves it.\n\nThe one thing we need from you: please test the wishlist and reply with your approval or comments.\n\nThanks,\nPriya",
      },
    },
    // ------------------------------------------------------------------ 5
    {
      id: "pma-bug-feature-cr-tech-debt-mvp",
      moduleId: "pma-tech-terms",
      trackId: "pm",
      title: "Bug vs feature vs change request; technical debt; MVP",
      summary:
        "\"It's a bug\" is the most expensive sentence in agency life. If the client calls every new wish a bug, your fixed-bid project absorbs unpaid work. If your team calls every complaint a change request, the client feels cheated. These words decide who pays, so a PM must use them precisely and kindly.\n\n**Plain definitions.** A bug is when the app does not do what was agreed: the spec says the total includes tax and it does not. A feature is a new ability the app does not have yet. A change request (CR) is a request to change what was agreed (scope, design, behaviour), which needs an estimate, a price or time impact, and approval. Technical debt is the future cost of shortcuts taken today: quick code that works now but makes later changes slower and riskier. An MVP (minimum viable product) is the smallest version of the product that real users can use, so the client learns what matters before paying for everything.\n\n**Everyday analogy.** Building a house: a leaking pipe that was in the plan is a bug, and the builder fixes it. Adding a balcony is a new feature. Moving the kitchen after the walls are up is a change request, with a new price. Using cheap temporary wiring to open on time is technical debt: it works, but you will pay to redo it. An MVP is moving in once the kitchen, bedroom and bathroom work, before the garden is finished.\n\n**Why a PM cares.** The test is always: what did we agree? Check the SOW, the user stories and the acceptance criteria. Log each item with its type before discussing it. Make technical debt visible in the plan, with time to repay it, or it turns into bugs. Keep MVP scope small, written down, and tied to a launch goal. Your team's SOP below covers the warranty period and how bugs and CRs are billed.\n\n**Explain it to a client in one sentence.** \"A bug is when the app doesn't do what we agreed, and we fix it; a change request is when we agree to do something different, and we estimate it together first.\"",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "GitHub Docs: About issues", url: "https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues", kind: "docs", verifiedAt: "2026-10-02T09:35:23Z" },
        { label: "Atlassian: What is Tech Debt? Signs & How to Effectively Manage It", url: "https://www.atlassian.com/agile/software-development/technical-debt", kind: "article", verifiedAt: "2026-10-02T09:35:45Z" },
        { label: "Martin Fowler: Technical Debt", url: "https://martinfowler.com/bliki/TechnicalDebt.html", kind: "article", verifiedAt: "2026-10-02T09:35:47Z" },
        { label: "Atlassian: What is a Minimum Viable Product (MVP)? How to Get Started", url: "https://www.atlassian.com/agile/product-management/minimum-viable-product", kind: "article", verifiedAt: "2026-10-02T09:35:39Z" },
      ],
      video: {
        title: "Business Analyst - Defect or Change Request",
        channel: "Business Analyst  REAL-TIME Training",
        url: "https://www.youtube.com/watch?v=fOfXsrNGpfc",
        videoId: "fOfXsrNGpfc",
        verifiedAt: "2026-10-02T09:35:57Z",
      },
      alternateVideos: [
        {
          title: "What is technical debt?  Definition, Overview, and Best Practices",
          channel: "ProductPlan",
          url: "https://www.youtube.com/watch?v=qGcm6GVyDNw",
          videoId: "qGcm6GVyDNw",
          verifiedAt: "2026-10-02T09:36:00Z",
        },
        {
          title: "Michael Seibel - How to Plan an MVP",
          channel: "Y Combinator",
          url: "https://www.youtube.com/watch?v=1hHMwLxN6EM",
          videoId: "1hHMwLxN6EM",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
      ],
      sop: [
        {
          title: "Bugs, change requests and warranty: billing rules",
          prompt:
            "[Oyelabs SOP – admin to fill] How long the post-launch warranty lasts and what it covers, how bugs vs change requests are billed on fixed-bid and T&M projects, the change-request form and approval steps, and who signs off a disputed classification.",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-bug-feature-cr-tech-debt-mvp-q1",
          prompt:
            "The signed user story says the order total includes VAT. In UAT the total excludes VAT. What is it?",
          options: ["A change request", "A bug", "Technical debt", "A new feature"],
          correctIndex: 1,
          explanation: "The app does not do what was agreed, so it is a bug, fixed at no extra cost under the agreement.",
        },
        {
          id: "pma-bug-feature-cr-tech-debt-mvp-q2",
          prompt:
            "During UAT the client says \"the checkout should also offer Apple Pay; it's a bug that it doesn't.\" Apple Pay is not in the SOW or the stories. What is it?",
          options: [
            "A bug, because the client found it in UAT",
            "A change request: new scope that needs an estimate and approval",
            "Technical debt",
            "Nothing; ignore it",
          ],
          correctIndex: 1,
          explanation: "Where an item is found does not decide its type; the agreement does. Not agreed = change request.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-bug-feature-cr-tech-debt-mvp-q3",
          prompt: "What is the first thing a PM checks to classify a disputed item?",
          options: [
            "Who complained loudest",
            "The agreed scope: SOW, user stories and acceptance criteria",
            "How long the fix takes",
            "The developer's opinion only",
          ],
          correctIndex: 1,
          explanation: "The classification is about the agreement, not about effort or opinion.",
        },
        {
          id: "pma-bug-feature-cr-tech-debt-mvp-q4",
          prompt: "Which are examples of technical debt? (Select all that apply.)",
          options: [
            "Hard-coding tax rates to hit a demo date, planning to make them configurable later",
            "Skipping automated tests on the payment module to save a week",
            "Copying the same code into five screens instead of building one shared component",
            "Adding a new reporting screen the client asked for",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Shortcuts that make future change slower or riskier are debt. A requested new screen is a feature.",
        },
        {
          id: "pma-bug-feature-cr-tech-debt-mvp-q5",
          prompt:
            "The tech lead says shortcuts taken for the MVP launch now make every new feature take 30% longer. What should the PM do?",
          options: [
            "Hide it from the client",
            "Make the debt visible: explain the cost in time, and agree time in the plan to repay the most harmful parts",
            "Stop all new features forever",
            "Blame the developers",
          ],
          correctIndex: 1,
          explanation: "Debt that is not planned for keeps growing, like interest. Show it and schedule repayment.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-bug-feature-cr-tech-debt-mvp-q6",
          prompt: "What is an MVP?",
          options: [
            "The most valuable person on the team",
            "The smallest version of the product that real users can use, so the client learns before building everything",
            "A demo with fake screens",
            "The final, complete product",
          ],
          correctIndex: 1,
          explanation: "Minimum and viable: small, but genuinely usable by real users.",
        },
        {
          id: "pma-bug-feature-cr-tech-debt-mvp-q7",
          prompt:
            "Halfway through an MVP build, the client keeps adding \"small\" features. What is the main risk?",
          options: [
            "None; small features are free",
            "The MVP stops being minimum: launch slips and the client learns later, while the budget grows",
            "The app will be too fast",
            "Users will get confused by too few features",
          ],
          correctIndex: 1,
          explanation: "Scope creep defeats the purpose of an MVP. Park additions in a 'phase 2' list with estimates.",
        },
        {
          id: "pma-bug-feature-cr-tech-debt-mvp-q8",
          prompt: "Which are good PM practices when a client reports a list of 'bugs' in UAT? (Select all that apply.)",
          options: [
            "Log each item and tag it as bug, CR or question before discussing cost",
            "Explain classifications by pointing to the agreed story or SOW clause",
            "Fix real bugs quickly, and send estimates for CRs",
            "Tell the client every item is a CR",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Fair, documented classification keeps trust. Calling everything a CR damages the relationship.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
      practice: {
        kind: "scenario",
        prompt:
          "A fixed-bid React + Laravel booking app for a UK spa chain is in UAT. The client sends a list titled \"Bugs to fix before launch\". You open the SOW and the signed user stories.",
        steps: [
          {
            id: "s1",
            question:
              "Item 1: \"The booking confirmation email shows the time in UTC, not UK time.\" The user story says: \"Confirmation email shows the booking time in the spa's local time.\" What is it?",
            options: [
              "A bug: the app does not meet the agreed story; fix it within the agreed price",
              "A change request: send an estimate",
              "Technical debt: fix it next year",
              "Not our problem: it's the email provider",
            ],
            correctIndex: 0,
            explanation: "The agreed story is clear and the app does not meet it. That is a bug.",
          },
          {
            id: "s2",
            question:
              "Item 2: \"Customers should be able to buy gift vouchers.\" Gift vouchers are not in the SOW or the stories. How do you respond?",
            options: [
              "Add it quietly to keep the client happy",
              "Thank them, explain it is new scope, and offer an estimate as a change request or a phase 2 item, with the effect on the launch date",
              "Refuse and say it is impossible",
              "Call it a bug so the team builds it",
            ],
            correctIndex: 1,
            explanation: "New scope is a CR. Offer options (now with a price and date impact, or after launch) instead of a flat no.",
          },
          {
            id: "s3",
            question:
              "Your tech lead says the team hard-coded the spa locations to make the UAT date, and adding a new location now needs a developer. The client plans to open two spas next quarter. What do you do?",
            options: [
              "Say nothing; it works today",
              "Explain this technical debt to the client in plain words and propose a small, estimated task to make locations editable before the new spas open",
              "Tell the client it is their fault for wanting a fast launch",
              "Rewrite the whole app",
            ],
            correctIndex: 1,
            explanation: "Make the debt visible with its real cost (developer work for every new spa) and plan its repayment before it hurts.",
          },
        ],
      },
    },
    // ------------------------------------------------------------------ 6
    {
      id: "pma-auth-push-integrations-webhooks",
      moduleId: "pma-tech-terms",
      trackId: "pm",
      title: "Authentication, push notifications, integrations and webhooks",
      summary:
        "Many \"the app is broken\" emails are really about one of these four things: a user who cannot log in, a notification that never arrived, a payment that shows as paid in Stripe but pending in the app, or a CRM that did not receive a new lead. Knowing what each word means lets you ask the right question and set the right expectation.\n\n**Plain definitions.** Authentication is checking who someone is (login with a password, a code, or Google/Apple sign-in). Authorisation is checking what they are allowed to do (an admin can refund; a customer cannot). Push notifications are messages the app sends to a phone's lock screen, delivered through Apple's and Google's services (for example Firebase Cloud Messaging). An integration connects the app to another system, such as Stripe, Salesforce or the client's ERP, usually through that system's API. A webhook is an automatic message one system sends to another when something happens: Stripe tells our backend \"this payment succeeded\".\n\n**Everyday analogy.** Authentication is the hotel front desk checking your passport; authorisation is your key card opening your room but not the manager's office. A push notification is a text message from the hotel to your phone. An integration is the hotel's booking system talking to the travel agent's system. A webhook is the delivery company ringing your doorbell when the parcel arrives, so you do not have to keep checking the door.\n\n**Why a PM cares.** Each one depends on outside parties. Push needs Apple and Google set up, user permission, and does not arrive if the user turned notifications off; delivery is not guaranteed instantly. Integrations need keys, test accounts and the other side's documentation, and are a classic source of delay. Webhooks can arrive late, twice or not at all, so the backend must handle that. Get access early and test with real flows.\n\n**Explain it to a client in one sentence.** \"Webhooks are automatic messages from systems like Stripe that tell your app when something happened, such as a payment going through, so the app can update itself.\"",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "GitHub Docs: About webhooks", url: "https://docs.github.com/en/webhooks/about-webhooks", kind: "docs", verifiedAt: "2026-10-02T09:35:46Z" },
        { label: "Stripe Docs: Receive Stripe events in your webhook endpoint", url: "https://docs.stripe.com/webhooks", kind: "docs", verifiedAt: "2026-10-02T09:35:43Z" },
        { label: "Firebase: Firebase Cloud Messaging", url: "https://firebase.google.com/docs/cloud-messaging", kind: "docs", verifiedAt: "2026-10-02T09:35:28Z" },
        { label: "Cloudflare: Authn vs. authz: How are they different?", url: "https://www.cloudflare.com/learning/access-management/authn-vs-authz/", kind: "article", verifiedAt: "2026-10-02T10:06:57Z" },
      ],
      video: {
        title: "Top 3 Things You Should Know About Webhooks!",
        channel: "ByteByteGo",
        url: "https://www.youtube.com/watch?v=x_jjhcDrISk",
        videoId: "x_jjhcDrISk",
        verifiedAt: "2026-10-02T09:35:57Z",
      },
      alternateVideos: [
        {
          title: "Authentication vs Authorization explained in 3 minutes",
          channel: "Permit",
          url: "https://www.youtube.com/watch?v=DakSdpODf-U",
          videoId: "DakSdpODf-U",
          verifiedAt: "2026-10-02T09:35:56Z",
        },
        {
          title: "How Do Push Notifications Work?",
          channel: "Gerald Versluis",
          url: "https://www.youtube.com/watch?v=AKYebqOCAzY",
          videoId: "AKYebqOCAzY",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-auth-push-integrations-webhooks-q1",
          prompt: "A shop manager can log in but cannot see the Refunds page, which is only for admins. Which concept is at work?",
          options: ["Authentication", "Authorisation (permissions)", "A webhook", "A push notification"],
          correctIndex: 1,
          explanation: "She is authenticated (logged in); authorisation decides what she is allowed to see.",
        },
        {
          id: "pma-auth-push-integrations-webhooks-q2",
          prompt: "What is a webhook?",
          options: [
            "A login method",
            "An automatic message one system sends to another when an event happens, such as \"payment succeeded\"",
            "A type of database",
            "A design pattern for screens",
          ],
          correctIndex: 1,
          explanation: "Webhooks push news to your app instead of your app asking again and again.",
        },
        {
          id: "pma-auth-push-integrations-webhooks-q3",
          prompt:
            "A customer's payment shows \"succeeded\" in the Stripe dashboard, but the order in the app is still \"pending\". What should the PM ask the team to check first?",
          options: [
            "Whether the customer's phone is old",
            "Whether Stripe's webhook reached our backend and was processed (it may have failed, been delayed or been rejected)",
            "Whether the logo is correct",
            "Whether the database is too big",
          ],
          correctIndex: 1,
          explanation: "The app learns about payments through webhooks. A missed or failed webhook leaves the order pending even though money was taken.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-auth-push-integrations-webhooks-q4",
          prompt: "Why might a user not receive a push notification? (Select all that apply.)",
          options: [
            "They did not give permission or turned notifications off",
            "The Apple or Google push setup (certificates or keys) is wrong or expired",
            "The phone is offline; delivery is not guaranteed to be instant",
            "Push notifications are sent by email",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Permission, setup and connectivity are the common causes. Push does not travel by email.",
        },
        {
          id: "pma-auth-push-integrations-webhooks-q5",
          prompt: "The client wants their app integrated with their Salesforce CRM. What should the PM get early?",
          options: [
            "Nothing until the end",
            "Access (keys or a test account), the CRM's documentation, and a contact on the client side who knows how their Salesforce is set up",
            "Only the logo",
            "A promise that it will be easy",
          ],
          correctIndex: 1,
          explanation: "Integrations stall on access and unknown setups. Ask for them in week one.",
        },
        {
          id: "pma-auth-push-integrations-webhooks-q6",
          prompt:
            "The client asks: \"Can we promise users the 'Your order is ready' notification arrives within 1 second, always?\" What is the honest answer?",
          options: [
            "Yes, always",
            "We send it immediately, but delivery goes through Apple and Google and depends on the phone's connection and settings, so we cannot guarantee exact timing",
            "No, push notifications do not work",
            "Only on Android",
          ],
          correctIndex: 1,
          explanation: "We control the sending, not the delivery path. Promise the part you control.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-auth-push-integrations-webhooks-q7",
          prompt: "Webhooks can arrive late, twice, or not at all. What does a well-built backend do? (Select all that apply.)",
          options: [
            "Ignores a duplicate message so an order is not processed twice",
            "Checks the message really came from the sender (for example a signature)",
            "Can recover missed events, for example by checking the provider's records",
            "Trusts any message from anyone",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Handling duplicates, verifying the sender and recovering missed events are standard webhook practice.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-auth-push-integrations-webhooks-q8",
          prompt: "Which one-sentence explanation of authentication is best for a client?",
          options: [
            "Authentication is OAuth 2.0 with JWT bearer tokens.",
            "Authentication is how the app checks that users are who they say they are, like a passport check at a hotel desk.",
            "Authentication is the app's colour scheme.",
            "Authentication means users can do anything.",
          ],
          correctIndex: 1,
          explanation: "Correct, plain and with an analogy. The first is jargon; the others are wrong.",
        },
      ],
      practice: {
        kind: "write",
        variant: "explain",
        prompt:
          "The client, who owns an online flower shop, emails: \"A customer paid (I can see it in Stripe) but the order still says 'awaiting payment' in our admin panel. Is the app losing money?\" The team found that Stripe's automatic notification (webhook) failed for 20 minutes during a server restart; the orders are being updated now. Explain what happened and what you are doing, in plain language with one analogy.",
        context: "No money was lost: Stripe holds the payments. 4 orders were affected. The team is re-sending the missed notifications from Stripe and adding an alert so a failed notification is spotted within 5 minutes.",
        wordLimit: 150,
        rubric: [
          { id: "correct", label: "Technically correct", description: "Explains that the payment went through in Stripe, but the automatic message telling the app about it did not arrive during a short server restart; no money was lost; 4 orders affected and being updated.", weight: 2 },
          { id: "plain", label: "Plain language and analogy", description: "Uses a simple analogy (e.g. a doorbell or delivery notice that did not ring) and no jargon like 'endpoint' or '5xx'.", weight: 1.5 },
          { id: "action", label: "What we are doing", description: "Mentions re-sending the missed messages now and an alert to catch it within 5 minutes in future.", weight: 1 },
          { id: "tone", label: "Reassuring, honest tone", description: "Calm, owns the issue without blame, and does not over-promise that it can never happen.", weight: 0.5 },
        ],
        sampleAnswer:
          "Hi Rosa,\n\nNo money is lost. Your customer's payment went through, and Stripe has it.\n\nWhen a payment succeeds, Stripe sends an automatic message to your app, like a doorbell saying 'the money has arrived'. Yesterday our server restarted for 20 minutes, so your app did not hear that doorbell for 4 orders. That is why they still say 'awaiting payment'.\n\nWe are asking Stripe to send those messages again now. The 4 orders will update within the hour. We are also adding an alert, so if this happens again we will know within 5 minutes.\n\nSorry for the worry. I will confirm when all 4 orders are updated.\n\nPriya",
      },
    },
    // ------------------------------------------------------------------ 7
    {
      id: "pma-scalability-latency-caching",
      moduleId: "pma-tech-terms",
      trackId: "pm",
      title: "Scalability, latency, caching",
      summary:
        "The client's marketing team plans a TV advert, or a big sale, or an influencer post. The app that worked fine for 200 users now gets 20,000 in an hour, pages take ten seconds to load, and checkout times out. The questions that follow (\"will it scale?\", \"why is it slow?\", \"what is caching?\") need a PM who can explain them without promising magic.\n\n**Plain definitions.** Scalability is the app's ability to handle more users or data by adding resources, without being rebuilt. Scaling up (vertical) means a bigger server; scaling out (horizontal) means more servers sharing the work. Latency is the delay between a user's action and the app's response, often measured in milliseconds; distance, slow database queries and many network calls all add to it. Caching is keeping a ready copy of something that is expensive to fetch or calculate, so the next request is fast. A CDN (content delivery network) caches images and files on servers close to users around the world.\n\n**Everyday analogy.** A coffee shop at rush hour. Scaling up is buying a bigger coffee machine; scaling out is opening more counters with more baristas. Latency is how long a customer waits from ordering to getting the cup. Caching is brewing a big pot of the most popular coffee before the rush, so most people get theirs instantly; the risk is that the pot goes stale if nobody refreshes it.\n\n**Why a PM cares.** Scale is a requirement, not a hope: ask the client for expected peak users and dates, and give the team time to load-test before the event. Scaling costs money in the cloud. Caching makes things fast but can show old data, such as a price changed in the admin panel that still shows the old value for some minutes; decide with the client where fresh data matters (stock, prices) and where it does not. Latency for overseas users depends on where servers are; a US app hosted in Mumbai will feel slower in New York.\n\n**Explain it to a client in one sentence.** \"Scaling is adding capacity so the app stays fast when many people use it at once, and caching keeps ready copies of popular pages so they load instantly.\" The common mistake is saying \"the cloud scales automatically\" without load-testing or a budget.",
      level: "advanced",
      estMinutes: 40,
      isMilestone: true,
      webRefs: [
        { label: "MDN: HTTP caching", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching", kind: "docs", verifiedAt: "2026-10-02T10:07:07Z" },
        { label: "Cloudflare: What Is Latency?", url: "https://www.cloudflare.com/learning/performance/glossary/what-is-latency/", kind: "article", verifiedAt: "2026-10-02T10:07:34Z" },
        { label: "AWS: What is Caching and How it Works", url: "https://aws.amazon.com/caching/", kind: "article", verifiedAt: "2026-10-02T09:35:25Z" },
        { label: "Cloudflare: What is Caching?", url: "https://www.cloudflare.com/learning/cdn/what-is-caching/", kind: "article", verifiedAt: "2026-10-02T10:06:49Z" },
      ],
      video: {
        title: "Caching - Simply Explained",
        channel: "Simply Explained",
        url: "https://www.youtube.com/watch?v=6FyXURRVmR0",
        videoId: "6FyXURRVmR0",
        verifiedAt: "2026-10-02T09:35:57Z",
      },
      alternateVideos: [
        {
          title: "System Design BASICS: Horizontal vs. Vertical Scaling",
          channel: "Gaurav Sen",
          url: "https://www.youtube.com/watch?v=xpDnVSmNFX0",
          videoId: "xpDnVSmNFX0",
          verifiedAt: "2026-10-02T09:35:57Z",
        },
        {
          title: "Cache Systems Every Developer Should Know",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=dGAgxozNWFE",
          videoId: "dGAgxozNWFE",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-scalability-latency-caching-q1",
          prompt: "What is latency?",
          options: [
            "The number of users the app has",
            "The delay between a user's action and the app's response",
            "The monthly hosting bill",
            "The size of the database",
          ],
          correctIndex: 1,
          explanation: "Latency is waiting time, usually measured in milliseconds.",
        },
        {
          id: "pma-scalability-latency-caching-q2",
          prompt: "What is the difference between scaling up and scaling out?",
          options: [
            "There is no difference",
            "Scaling up means a bigger server; scaling out means more servers sharing the work",
            "Scaling up means more users; scaling out means fewer",
            "Scaling out means moving to a new country",
          ],
          correctIndex: 1,
          explanation: "Vertical (bigger machine) vs horizontal (more machines). Horizontal has no single-machine ceiling but needs the app built for it.",
        },
        {
          id: "pma-scalability-latency-caching-q3",
          prompt:
            "The admin changes a product's price from $40 to $35. For ten minutes, some customers still see $40. What is the most likely cause?",
          options: [
            "A hacker changed it back",
            "A cached copy of the product page is still being served until it refreshes",
            "The database lost the change",
            "DNS propagation",
          ],
          correctIndex: 1,
          explanation:
            "Caching trades freshness for speed. Decide with the client which data must always be fresh (prices, stock) and set the cache rules accordingly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-scalability-latency-caching-q4",
          prompt: "The client plans a TV advert in four weeks. What should the PM do? (Select all that apply.)",
          options: [
            "Ask for the expected peak number of users and the exact date and time",
            "Plan load testing with the team before the advert",
            "Explain any extra cloud cost of scaling for the peak",
            "Tell the client the cloud scales automatically, so nothing is needed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Scale must be planned, tested and budgeted. \"It scales automatically\" is a promise, not a plan.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-scalability-latency-caching-q5",
          prompt: "Users in New York say the app feels slow, but the team in India says it is fast. The servers are in Mumbai. Why?",
          options: [
            "New York users have worse phones",
            "Distance adds latency: every request travels much further from New York to Mumbai and back",
            "The app is broken in the US",
            "Caching only works in India",
          ],
          correctIndex: 1,
          explanation: "Physical distance adds delay. Hosting nearer the users, or a CDN for files, reduces it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-scalability-latency-caching-q6",
          prompt: "What does a CDN do?",
          options: [
            "Stores user passwords",
            "Keeps copies of images and files on servers close to users around the world, so they load faster",
            "Writes the app's code",
            "Sends push notifications",
          ],
          correctIndex: 1,
          explanation: "A CDN is caching spread geographically.",
        },
        {
          id: "pma-scalability-latency-caching-q7",
          prompt: "For which data is caching usually safe for a few minutes? (Select all that apply.)",
          options: [
            "The 'About us' page",
            "Product photos",
            "The list of blog articles",
            "A customer's account balance after a payment",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Content that rarely changes caches well. Balances, stock and prices often need fresh data.",
        },
        {
          id: "pma-scalability-latency-caching-q8",
          prompt: "Which statement to a client about scaling is honest?",
          options: [
            "\"The app can handle unlimited users for free.\"",
            "\"We can add capacity for the sale; it costs more while it runs, and we will load-test it the week before.\"",
            "\"Scaling is impossible.\"",
            "\"We will see what happens on the day.\"",
          ],
          correctIndex: 1,
          explanation: "It promises a plan, admits the cost and includes a test. The others over-promise or under-plan.",
        },
      ],
      practice: {
        kind: "write",
        variant: "explain",
        prompt:
          "Translate this developer update for the client, the head of e-commerce at a UK fashion brand (non-technical). The site slowed down during yesterday's flash sale. Explain what happened, what the team did, what it costs, and what you recommend before the next sale. Plain language, one analogy, no jargon.",
        context:
          "Dev update: \"During the 8pm flash sale we hit ~9k concurrent users, p95 latency went from 400ms to 7s, DB CPU pegged at 100%. Product listing queries weren't cached. We added Redis caching for product pages (5 min TTL) and scaled the app tier from 2 to 4 instances; p95 back to 600ms. Extra infra ≈ £120/month while at 4 instances. Prices/stock still read live from DB. Recommend a load test at 15k users before the Black Friday sale on 29 Nov.\"",
        wordLimit: 200,
        rubric: [
          { id: "correct", label: "Accurate translation", description: "About 9,000 shoppers at once; pages took up to 7 seconds instead of under half a second because the database was overloaded; product pages now use ready copies (refreshed every 5 minutes) and twice the servers; pages back to about 0.6 seconds; prices and stock stay live.", weight: 2 },
          { id: "plain", label: "No jargon", description: "No 'p95', 'Redis', 'TTL', 'DB CPU', 'instances' or 'concurrent' without plain explanation.", weight: 1.5 },
          { id: "cost", label: "Cost and recommendation", description: "States the extra cost (about £120 a month while at the larger size) and recommends a test with 15,000 shoppers before Black Friday on 29 November, asking for a decision.", weight: 1 },
          { id: "analogy", label: "Helpful analogy", description: "Uses one analogy (e.g. more tills and pre-folded best-sellers at a busy shop) that maps correctly.", weight: 0.5 },
        ],
        sampleAnswer:
          "Hi Olivia,\n\nDuring last night's flash sale, about 9,000 shoppers were on the site at the same time. The database was overloaded, so some pages took up to 7 seconds to load instead of under half a second.\n\nWe fixed it during the sale. Think of a busy shop: we opened more tills by doubling the servers. We also keep ready copies of the product pages, refreshed every 5 minutes, so they no longer go to the database each time. Prices and stock are still always live. Pages now load in about 0.6 seconds.\n\nThe extra servers cost about £120 a month while we keep them.\n\nBefore Black Friday on 29 November, we recommend a test with 15,000 pretend shoppers, so we find any limits before real customers do. Shall we book it for the week of 18 November?\n\nBest regards,\nPriya",
      },
    },
    // ------------------------------------------------------------------ 8
    {
      id: "pma-llm-prompt-token-agent-hallucination",
      moduleId: "pma-tech-terms",
      trackId: "pm",
      title: "LLM, prompt, token, agent, hallucination",
      summary:
        "Almost every client now asks for \"some AI\" in their app: a support chatbot, smart search, automatic summaries. They have read the headlines and expect magic, or fear it. A PM who can explain the core words plainly sets realistic expectations about cost, accuracy and risk before the SOW is signed.\n\n**Plain definitions.** An LLM (large language model) is a program trained on huge amounts of text that predicts the next words in a reply; Claude and GPT are examples. A prompt is the instruction and information you give it. A token is a small piece of text, roughly three quarters of a word in English, and it is how usage is measured and billed: both the text you send and the text it writes count. The context window is how much text the model can consider at once. An agent is an LLM set up to take steps on its own, such as searching, calling tools or updating a record, towards a goal. A hallucination is a confident answer that is false or made up.\n\n**Everyday analogy.** An LLM is a very well-read new assistant who has read millions of documents but has never worked at the client's company. The prompt is your briefing to them. Tokens are the words you pay them for, reading and writing. An agent is that assistant given a laptop and permission to act. Hallucination is the assistant who, rather than say \"I don't know\", invents a convincing answer.\n\n**Why a PM cares.** AI features have running costs per use, which grow with users and long prompts, so estimate monthly token costs with the client. Accuracy is never 100%: agree how good is good enough, how it is tested, and what happens when it is wrong (a human handover, a source link). Agents that take actions need limits and approvals. Client data sent to an AI provider must be allowed by the contract and privacy rules.\n\n**Explain it to a client in one sentence.** \"The AI is a very well-read assistant that writes answers from what it has learned and what we give it; it is fast and helpful, but it can sometimes be confidently wrong, so we design checks around it.\" The common mistake is promising \"the chatbot will always give correct answers\".",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "Anthropic Docs: Glossary", url: "https://platform.claude.com/docs/en/about-claude/glossary", kind: "docs", verifiedAt: "2026-10-02T09:38:58Z" },
        { label: "Anthropic Docs: Prompt engineering overview", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview", kind: "docs", verifiedAt: "2026-10-02T09:35:24Z" },
        { label: "IBM: What Are AI Hallucinations?", url: "https://www.ibm.com/think/topics/ai-hallucinations", kind: "article", verifiedAt: "2026-10-02T09:35:33Z" },
        { label: "IBM: What Are AI Agents?", url: "https://www.ibm.com/think/topics/ai-agents", kind: "article", verifiedAt: "2026-10-02T09:35:23Z" },
      ],
      video: {
        title: "How Large Language Models Work",
        channel: "IBM Technology",
        url: "https://www.youtube.com/watch?v=5sLYAQS9sWQ",
        videoId: "5sLYAQS9sWQ",
        verifiedAt: "2026-10-02T09:35:57Z",
      },
      alternateVideos: [
        {
          title: "Large Language Models explained briefly",
          channel: "3Blue1Brown",
          url: "https://www.youtube.com/watch?v=LPZh9BOjkQs",
          videoId: "LPZh9BOjkQs",
          verifiedAt: "2026-10-02T09:35:55Z",
        },
        {
          title: "Why Large Language Models Hallucinate",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=cfqtFvWOfg0",
          videoId: "cfqtFvWOfg0",
          verifiedAt: "2026-10-02T09:35:54Z",
        },
        {
          title: "What are AI Agents?",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=F8NKVhkZZWI",
          videoId: "F8NKVhkZZWI",
          verifiedAt: "2026-10-02T09:35:58Z",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "pma-llm-prompt-token-agent-hallucination-q1",
          prompt: "What is a token, for a PM estimating an AI feature?",
          options: [
            "A login password",
            "A small piece of text (about three quarters of a word) used to measure and bill AI usage, both input and output",
            "A crypto coin",
            "A screen in the app",
          ],
          correctIndex: 1,
          explanation: "Usage-based AI pricing counts tokens in and out. Longer prompts and answers cost more.",
        },
        {
          id: "pma-llm-prompt-token-agent-hallucination-q2",
          prompt: "What is a hallucination?",
          options: [
            "When the AI refuses to answer",
            "When the AI gives a confident answer that is false or invented",
            "When the app crashes",
            "When the AI is slow",
          ],
          correctIndex: 1,
          explanation: "The danger is the confidence: a wrong answer sounds just as sure as a right one.",
        },
        {
          id: "pma-llm-prompt-token-agent-hallucination-q3",
          prompt:
            "The client wants their support chatbot to \"never give a wrong answer\". What is the honest PM response?",
          options: [
            "Promise it in the SOW",
            "Explain that no AI is 100% accurate; agree a target, a test set, and what happens when it is unsure (for example a handover to a human or a link to the source)",
            "Say AI is useless for support",
            "Agree, and remove testing to save time",
          ],
          correctIndex: 1,
          explanation: "Set measurable expectations and design for failure. A 'never wrong' promise is a future dispute.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-llm-prompt-token-agent-hallucination-q4",
          prompt: "What makes something an AI agent rather than a simple chatbot?",
          options: [
            "It has a name",
            "It can take steps by itself towards a goal, such as calling tools, searching or updating records",
            "It answers in English",
            "It is more expensive",
          ],
          correctIndex: 1,
          explanation: "Agents act, not just answer. That is why they need limits and approvals.",
        },
        {
          id: "pma-llm-prompt-token-agent-hallucination-q5",
          prompt: "Which factors raise the monthly running cost of an AI feature? (Select all that apply.)",
          options: [
            "More users sending more messages",
            "Long prompts, for example sending a whole manual with every question",
            "Long answers",
            "Choosing a more capable, more expensive model",
            "The colour of the chat window",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation: "Cost scales with tokens in, tokens out, volume and model price.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-llm-prompt-token-agent-hallucination-q6",
          prompt:
            "The client asks for an agent that can issue refunds to customers automatically. What should the PM raise?",
          options: [
            "Nothing; agents are reliable",
            "Limits and controls: maximum refund amounts, human approval above a threshold, logs of every action, and testing of wrong decisions",
            "That refunds cannot be automated",
            "Only the design of the button",
          ],
          correctIndex: 1,
          explanation: "An agent that moves money can also make expensive mistakes. Guard rails are part of the scope.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "pma-llm-prompt-token-agent-hallucination-q7",
          prompt: "Which reduce hallucinations in a support assistant? (Select all that apply.)",
          options: [
            "Giving the model the client's real help articles to answer from",
            "Telling it to say \"I don't know\" when the answer is not in those articles",
            "Showing a link to the source article with each answer",
            "Asking it to sound more confident",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation: "Grounding, permission to be unsure and visible sources reduce and expose errors. Confidence does the opposite.",
        },
        {
          id: "pma-llm-prompt-token-agent-hallucination-q8",
          prompt: "Before sending a client's customer data to an AI provider, what must the PM confirm?",
          options: [
            "Nothing; AI providers are always allowed",
            "That the contract, the client's approval and privacy rules allow it, and which provider and settings are used",
            "Only the price",
            "That the data is in English",
          ],
          correctIndex: 1,
          explanation: "Data protection and client consent come first. Get it in writing.",
        },
      ],
      practice: {
        kind: "spot",
        prompt:
          "A junior PM drafted this paragraph for a client proposal for an AI support assistant in a Laravel customer portal. Mark the sentences that are wrong or promise too much.",
        segments: [
          { id: "s1", text: "The assistant uses a large language model (LLM) to answer customer questions in plain English.", issue: null },
          { id: "s2", text: "It answers from your own help-centre articles, and links to the article it used.", issue: null },
          { id: "s3", text: "Because it is AI, it will always give correct answers, so no human review is needed.", issue: "No LLM is always correct; hallucinations happen. Agree an accuracy target, testing and a human fallback." },
          { id: "s4", text: "When it is not sure, it hands the conversation to your support team.", issue: null },
          { id: "s5", text: "Running costs are a fixed $20 per month, however many customers use it.", issue: "AI usage is billed per token, so costs grow with the number and length of conversations; give an estimated range." },
          { id: "s6", text: "Tokens are the login codes customers use to access the assistant.", issue: "Wrong definition: tokens are small pieces of text used to measure and bill model usage." },
          { id: "s7", text: "We will test it on 200 real past questions before launch and share the results with you.", issue: null },
          { id: "s8", text: "In phase 2, an agent could also update order addresses, with your approval for each type of action.", issue: null },
        ],
        askExplanation: true,
      },
    },
  ],
} satisfies Module;
