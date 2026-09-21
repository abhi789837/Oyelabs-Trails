import type { Track } from "@/types/curriculum-v1";

export const fullstackTrack: Track = {
  id: "fullstack",
  name: "Full-Stack",
  tagline: "Wire frontend to backend and ship real apps end to end.",
  accentToken: "glacier",
  topics: [
    {
      id: "mern-stack",
      trackId: "fullstack",
      title: "The MERN Stack",
      summary:
        "MongoDB, Express, React and Node.js as one JavaScript stack: a React client calls an Express API on Node, which stores JSON-like documents in MongoDB.",
      level: "advanced",
      estMinutes: 150,
      webRef: { label: "MongoDB: MERN Stack Explained", url: "https://www.mongodb.com/resources/languages/mern-stack" },
      videoRef: {
        label: "freeCodeCamp: MERN Stack Tutorial for Beginners with Deployment",
        url: "https://www.youtube.com/watch?v=F9gB5b4jgOI",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "mern-stack-q1",
          prompt: "In a MERN app, what is Express responsible for?",
          options: [
            "Rendering React components in the browser",
            "The HTTP API: routing, middleware and talking to MongoDB",
            "Storing documents on disk",
            "Bundling the frontend",
          ],
          correctIndex: 1,
          explanation:
            "Express runs on Node.js as the API tier between the React client and the MongoDB database.",
        },
        {
          id: "mern-stack-q2",
          prompt: "What does Mongoose add on top of the MongoDB Node.js driver?",
          options: [
            "Schemas, validation and model methods for your documents",
            "SQL support",
            "A React component library",
            "Server-side rendering",
          ],
          correctIndex: 0,
          explanation:
            "MongoDB is schema-flexible; Mongoose adds an application-level schema so documents stay consistent.",
        },
        {
          id: "mern-stack-q3",
          prompt: "The React dev server runs on port 5173, the Express API on 4000, and the browser blocks the API calls. What's the usual fix?",
          options: [
            "Serve the API over plain HTTP",
            "Move the database into the browser",
            "Allow the frontend's origin with CORS on the API, or proxy /api through the dev server",
            "Disable JavaScript in the browser",
          ],
          correctIndex: 2,
          explanation:
            "Different ports are different origins, so the API must opt in with CORS headers, or a dev proxy makes the calls same-origin.",
        },
        {
          id: "mern-stack-q4",
          prompt: "Where should the MongoDB connection string live?",
          options: [
            "In a React component so the client can connect directly",
            "Committed to the repository in a config file",
            "In localStorage",
            "In a server-side environment variable such as MONGODB_URI, never in the frontend bundle",
          ],
          correctIndex: 3,
          explanation:
            "Anything in the React bundle is public; only the server should hold database credentials.",
        },
        {
          id: "mern-stack-q5",
          prompt: "How does the React client usually get data in a MERN app?",
          options: [
            "By querying MongoDB directly from the browser",
            "Through fetch calls to the Express API's JSON endpoints, often via a library like TanStack Query",
            "By reading files from the server's disk",
            "Through WebAssembly",
          ],
          correctIndex: 1,
          explanation:
            "The client talks HTTP to the API, which owns validation, auth and database access.",
        },
        {
          id: "mern-stack-q6",
          prompt: "What's a common way to deploy a MERN app?",
          options: [
            "The React build on static hosting or a CDN, the Express API on a Node host, and the database on MongoDB Atlas",
            "Everything inside the user's browser",
            "Only the database, since React talks to it directly",
            "A single HTML file emailed to users",
          ],
          correctIndex: 0,
          explanation:
            "Each tier scales on its own: static assets from a CDN, the API on a server platform, data on a managed cluster.",
        },
      ],
    },
    {
      id: "nextjs-fullstack",
      trackId: "fullstack",
      title: "Next.js Full-Stack",
      summary:
        "One Next.js codebase for UI and backend: data fetching in Server Components, mutations with Server Actions, Route Handlers for APIs, Prisma for the database and Auth.js or Better Auth for sign-in.",
      level: "advanced",
      estMinutes: 150,
      isMilestone: true,
      webRef: { label: "Next.js docs: Fetching data", url: "https://nextjs.org/docs/app/getting-started/fetching-data" },
      videoRef: {
        label: "JavaScript Mastery: Next.js 16 Full Course, Build and Deploy a Full Stack App",
        url: "https://www.youtube.com/watch?v=I1V9YWqRIeI",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "nextjs-fullstack-q1",
          prompt: "What is a Server Action?",
          options: [
            "A cron job that runs on Vercel",
            "An async function marked \"use server\" that runs on the server and can be called from forms or Client Components",
            "A Client Component that fetches data on mount",
            "A middleware function for every request",
          ],
          correctIndex: 1,
          explanation:
            "Server Actions let forms and client code call server-side mutations without writing an API route by hand.",
        },
        {
          id: "nextjs-fullstack-q2",
          prompt: "Where do you define a Route Handler for GET /api/health in the App Router?",
          options: [
            "pages/api/health.ts",
            "app/api/health/page.tsx",
            "app/api/health/route.ts, exporting a GET function",
            "app/health.api.ts",
          ],
          correctIndex: 2,
          explanation:
            "route.ts files export functions named after HTTP methods; pages/api is the older Pages Router convention.",
        },
        {
          id: "nextjs-fullstack-q3",
          prompt: "After a Server Action creates a post, how do you make the posts list show fresh data?",
          options: [
            "Ask the user to hard-refresh the page",
            "Restart the server",
            "Set a shorter build time",
            "Revalidate the cached data in the action, for example revalidatePath(\"/posts\") or a cache tag",
          ],
          correctIndex: 3,
          explanation:
            "Revalidation marks cached output as stale so the next render fetches the new data.",
        },
        {
          id: "nextjs-fullstack-q4",
          prompt: "Why must every Server Action check authentication and authorization itself?",
          options: [
            "Actions are reachable by direct POST requests, so hiding the button in the UI doesn't protect them",
            "Next.js disables cookies inside actions",
            "Actions run in the browser, where anyone can edit them",
            "It's only needed in development",
          ],
          correctIndex: 0,
          explanation:
            "A Server Action is effectively a public endpoint; treat it like an API route and verify the session and permissions inside it.",
        },
        {
          id: "nextjs-fullstack-q5",
          prompt: "How can a Server Component read from the database?",
          options: [
            "It can't; it must call an API route",
            "Directly, for example await prisma.post.findMany() inside the async component, because it only runs on the server",
            "Only through useEffect",
            "By sending SQL from the browser",
          ],
          correctIndex: 1,
          explanation:
            "Server Components never ship to the browser, so they can use server-only code and secrets safely.",
        },
        {
          id: "nextjs-fullstack-q6",
          prompt: "What does Auth.js (NextAuth.js) provide in a Next.js app?",
          options: [
            "A hosted database",
            "A CSS framework for login forms",
            "Sign-in with OAuth providers or credentials, session handling and helpers to read the session on the server",
            "Rate limiting for API routes",
          ],
          correctIndex: 2,
          explanation:
            "Auth.js handles provider flows, session cookies and CSRF protection so you can protect pages, actions and routes.",
        },
      ],
    },
    {
      id: "t3-stack",
      trackId: "fullstack",
      title: "The T3 Stack",
      summary:
        "create-t3-app's modular, typesafe stack: Next.js, TypeScript, tRPC, Prisma or Drizzle, Tailwind and NextAuth.js or Better Auth, with types flowing from the database to the UI.",
      level: "advanced",
      estMinutes: 90,
      webRef: { label: "Create T3 App docs", url: "https://create.t3.gg/" },
      videoRef: {
        label: "Theo (t3.gg): T3 Stack Tutorial, From 0 to Prod",
        url: "https://www.youtube.com/watch?v=YkOSUVzOAA4",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "t3-stack-q1",
          prompt: "What does end-to-end type safety mean in the T3 Stack?",
          options: [
            "Types flow from the database schema through tRPC procedures to the React client, so breaking changes show up as compile errors",
            "Every value is checked at runtime in the browser",
            "The database stores TypeScript types",
            "Tests are generated automatically",
          ],
          correctIndex: 0,
          explanation:
            "Changing a column or a procedure's return type immediately flags every client call that no longer fits.",
        },
        {
          id: "t3-stack-q2",
          prompt: "How does tRPC differ from REST or GraphQL?",
          options: [
            "It uses a binary protocol instead of HTTP",
            "It requires writing a schema file and running code generation",
            "The client calls server procedures with types inferred straight from the router, with no schema or codegen step",
            "It only works with Python backends",
          ],
          correctIndex: 2,
          explanation:
            "Because client and server share TypeScript, the router's type is the contract.",
        },
        {
          id: "t3-stack-q3",
          prompt: "What does Zod do in a tRPC procedure's .input(z.object({ ... }))?",
          options: [
            "Formats the response as JSON",
            "Validates the input at runtime and provides its TypeScript type",
            "Caches the procedure result",
            "Generates database migrations",
          ],
          correctIndex: 1,
          explanation:
            "Types vanish at runtime, so Zod checks real incoming data and infers the static type from the same schema.",
        },
        {
          id: "t3-stack-q4",
          prompt: "Which command scaffolds a new T3 app?",
          options: [
            "npx create-next-app --t3",
            "npm init trpc",
            "npx t3 new",
            "npm create t3-app@latest",
          ],
          correctIndex: 3,
          explanation: "create-t3-app is the official CLI and asks which pieces of the stack you want.",
        },
        {
          id: "t3-stack-q5",
          prompt: "Which statement matches the T3 philosophy?",
          options: [
            "It's modular: bring in only the pieces your app needs",
            "You must use every library in the stack",
            "It replaces TypeScript with its own language",
            "It's a hosted platform you deploy to",
          ],
          correctIndex: 0,
          explanation:
            "T3 is opinionated about typesafety but lets you opt out of tRPC, the ORM, auth or Tailwind.",
        },
      ],
    },
    {
      id: "fullstack-capstone",
      trackId: "fullstack",
      title: "Capstone: Deploy an End-to-End App",
      summary:
        "Follow one request from the browser to the database and back (DNS, TLS, CDN, load balancer, API, database) and ship it with CI/CD, infrastructure as code and monitoring.",
      level: "advanced",
      estMinutes: 180,
      isMilestone: true,
      webRef: { label: "roadmap.sh: Full Stack Developer Roadmap", url: "https://roadmap.sh/full-stack" },
      videoRef: {
        label: "ByteByteGo: What happens when you type a URL into your browser?",
        url: "https://www.youtube.com/watch?v=AlkDbnbv7dk",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "fullstack-capstone-q1",
          prompt: "A user types app.example.com into the browser. What has to happen first?",
          options: [
            "The server renders the page",
            "DNS resolves the hostname to an IP address, via caches, a resolver and authoritative nameservers",
            "The browser downloads the JavaScript bundle",
            "The database opens a connection",
          ],
          correctIndex: 1,
          explanation:
            "Nothing can connect until the browser knows which IP address to open a connection to.",
        },
        {
          id: "fullstack-capstone-q2",
          prompt: "What does the TLS handshake establish?",
          options: [
            "The fastest network route",
            "Which database to query",
            "The user's login session",
            "The server's identity, via its certificate, and shared keys for an encrypted connection",
          ],
          correctIndex: 3,
          explanation:
            "TLS authenticates the server and negotiates session keys, which is what the padlock in the address bar means.",
        },
        {
          id: "fullstack-capstone-q3",
          prompt: "What does a CDN do in front of your app?",
          options: [
            "Serves cached static assets from edge locations near users and absorbs traffic before it reaches your origin",
            "Stores your database backups",
            "Compiles your TypeScript",
            "Replaces your API server",
          ],
          correctIndex: 0,
          explanation:
            "Edge caching cuts latency and load: most asset requests never reach your servers.",
        },
        {
          id: "fullstack-capstone-q4",
          prompt: "What does a load balancer in front of several API instances do?",
          options: [
            "Runs database migrations",
            "Spreads requests across healthy instances and often terminates TLS",
            "Minifies JavaScript",
            "Stores user sessions permanently",
          ],
          correctIndex: 1,
          explanation:
            "Health checks and distribution let you scale out and survive an instance failing.",
        },
        {
          id: "fullstack-capstone-q5",
          prompt: "The API handler needs data. What's the typical path?",
          options: [
            "Query the database first, then check who the user is",
            "Return cached HTML for every request",
            "Validate input, check auth, query the database through a connection pool, then serialize the response",
            "Forward the raw request to the database",
          ],
          correctIndex: 2,
          explanation:
            "Reject bad or unauthorized requests early, reuse pooled connections, and return only what the client needs.",
        },
        {
          id: "fullstack-capstone-q6",
          prompt: "Where should production secrets such as database passwords live?",
          options: [
            "In the Git repository, so every deploy has them",
            "In the frontend bundle",
            "In a README",
            "In the host's environment variables or a secret manager, injected at runtime",
          ],
          correctIndex: 3,
          explanation:
            "Secrets in code or bundles leak through history and clients; runtime injection keeps them out of both.",
        },
        {
          id: "fullstack-capstone-q7",
          prompt: "What does a CI/CD pipeline such as GitHub Actions add to deployment?",
          options: [
            "Every push is linted, tested and built the same way, and passing builds deploy automatically",
            "It replaces code review",
            "It removes the need for tests",
            "It only runs when someone clicks deploy by hand",
          ],
          correctIndex: 0,
          explanation:
            "Automation makes releases small, repeatable and reversible instead of risky manual events.",
        },
        {
          id: "fullstack-capstone-q8",
          prompt: "Why describe servers, networks and DNS with a tool like Terraform?",
          options: [
            "It makes the app run faster",
            "Infrastructure as code can be reviewed, versioned and recreated identically instead of clicked together by hand",
            "It's required to use Docker",
            "It replaces monitoring",
          ],
          correctIndex: 1,
          explanation:
            "Declaring infrastructure in code gives you reproducible environments and a history of every change.",
        },
      ],
    },
  ],
};
