import type { Track } from "@/types/curriculum-v1";

export const backendTrack: Track = {
  id: "backend",
  name: "Backend",
  tagline: "HTTP, APIs, databases, auth and containers: the plumbing behind every screen.",
  accentToken: "summit",
  topics: [
    {
      id: "backend-foundations",
      trackId: "backend",
      title: "Backend Foundations",
      summary:
        "How the client-server model works over HTTP: requests with methods, headers and bodies, responses with status codes, and why HTTP itself is stateless.",
      level: "beginner",
      estMinutes: 60,
      webRef: { label: "roadmap.sh: Backend Developer Roadmap", url: "https://roadmap.sh/backend" },
      videoRef: {
        label: "Traversy Media: HTTP Crash Course & Exploration",
        url: "https://www.youtube.com/watch?v=iYM2zFP3Zn0",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "backend-foundations-q1",
          prompt: "Which HTTP method replaces a resource at a known URL and is idempotent?",
          options: ["POST", "PUT", "PATCH", "CONNECT"],
          correctIndex: 1,
          explanation:
            "Sending the same PUT twice leaves the resource in the same state, so clients can safely retry it; POST is not idempotent.",
        },
        {
          id: "backend-foundations-q2",
          prompt: "A signed-in user requests a resource they aren't allowed to see. Which status code fits?",
          options: ["401 Unauthorized", "404 Not Found", "403 Forbidden", "400 Bad Request"],
          correctIndex: 2,
          explanation:
            "401 means the request isn't authenticated; 403 means the server knows who you are but won't allow the action.",
        },
        {
          id: "backend-foundations-q3",
          prompt: "What does a 201 Created response typically include?",
          options: [
            "The new resource and often a Location header pointing to it",
            "A redirect the browser must follow",
            "An empty body, which the spec requires",
            "An error message explaining what went wrong",
          ],
          correctIndex: 0,
          explanation:
            "201 confirms a resource was created; the Location header tells the client where to find it.",
        },
        {
          id: "backend-foundations-q4",
          prompt: "What does it mean that HTTP is stateless?",
          options: [
            "Servers can't store anything in a database",
            "Responses can never be cached",
            "Only GET requests are allowed without a session",
            "Each request carries everything the server needs; state across requests comes from cookies, sessions or tokens",
          ],
          correctIndex: 3,
          explanation:
            "The protocol doesn't remember earlier requests, so applications layer state on top with cookies, sessions or tokens.",
        },
      ],
    },
    {
      id: "node-express",
      trackId: "backend",
      title: "Node.js & Express",
      summary:
        "Node's non-blocking event loop and Express 5: routing by method and path, middleware chains with (req, res, next), express.Router, and async errors that reach the error handler automatically.",
      level: "intermediate",
      estMinutes: 120,
      webRef: { label: "Express guide: Routing", url: "https://expressjs.com/en/guide/routing/" },
      videoRef: {
        label: "Traversy Media: Express Crash Course",
        url: "https://www.youtube.com/watch?v=CnH3kAXSrmU",
      },
      challengeType: "code",
      codeChallenge: {
        instructions: `Validate the JSON body for \`POST /users\` before it reaches the route handler. Write \`validateUserBody(body)\` returning \`{ valid, errors }\`, where \`errors\` lists the names of the failing fields in this order: \`"name"\`, \`"email"\`, \`"age"\`.

- \`name\`: required, a string that isn't empty after trimming
- \`email\`: required, a string containing \`@\`
- \`age\`: optional; if present it must be an integer of at least 18

\`valid\` is \`true\` only when \`errors\` is empty.`,
        starterCode: `/**
 * In Express this would run as middleware:
 *
 *   app.post("/users", (req, res, next) => {
 *     const { valid, errors } = validateUserBody(req.body);
 *     if (!valid) return res.status(400).json({ errors });
 *     next();
 *   });
 *
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateUserBody(body) {
  const errors = [];
  // Check name, then email, then age. Push the field name for each failure.

  return { valid: errors.length === 0, errors };
}
`,
        functionName: "validateUserBody",
        testCases: [
          {
            description: "accepts a valid body",
            args: [{ name: "Ada Lovelace", email: "ada@oyelabs.com", age: 36 }],
            expected: { valid: true, errors: [] },
          },
          {
            description: "rejects a blank name and a malformed email",
            args: [{ name: "   ", email: "not-an-email" }],
            expected: { valid: false, errors: ["name", "email"] },
          },
          {
            description: "rejects an age under 18",
            args: [{ name: "Linus", email: "linus@oyelabs.com", age: 17 }],
            expected: { valid: false, errors: ["age"] },
          },
        ],
      },
    },
    {
      id: "nestjs-architecture",
      trackId: "backend",
      title: "NestJS Architecture",
      summary:
        "Structuring TypeScript backends with NestJS: modules, controllers and injectable providers wired by dependency injection, plus guards, pipes and interceptors.",
      level: "advanced",
      estMinutes: 120,
      isMilestone: true,
      webRef: { label: "NestJS documentation", url: "https://docs.nestjs.com/" },
      videoRef: {
        label: "freeCodeCamp: NestJS Course for Beginners, Create a REST API",
        url: "https://www.youtube.com/watch?v=GHTA143_b-s",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "nestjs-architecture-q1",
          prompt: "What is a NestJS module (@Module()) responsible for?",
          options: [
            "Grouping related controllers and providers and declaring what it imports and exports",
            "Handling a single HTTP route",
            "Connecting to the database",
            "Compiling TypeScript to JavaScript",
          ],
          correctIndex: 0,
          explanation:
            "Module metadata has four keys (imports, controllers, providers, exports) that define a feature's boundary.",
        },
        {
          id: "nestjs-architecture-q2",
          prompt: "Which decorator marks a class as a provider that Nest's DI container can inject?",
          options: ["@Controller()", "@Provider()", "@Injectable()", "@Service()"],
          correctIndex: 2,
          explanation:
            "@Injectable() classes listed in a module's providers array are managed by the container, as singletons by default.",
        },
        {
          id: "nestjs-architecture-q3",
          prompt: "How does a controller usually get a UsersService instance?",
          options: [
            "By calling new UsersService() inside each route handler",
            "Through constructor injection: constructor(private readonly usersService: UsersService) {}",
            "By importing a global singleton from main.ts",
            "Through the @Body() decorator",
          ],
          correctIndex: 1,
          explanation:
            "Nest resolves constructor parameter types and injects the matching providers, which keeps classes easy to test.",
        },
        {
          id: "nestjs-architecture-q4",
          prompt: "What is a guard's job?",
          options: [
            "Transforming the response before it's sent",
            "Validating the request body against a DTO",
            "Logging how long each request takes",
            "Deciding whether a request may reach the route handler, for example auth or role checks",
          ],
          correctIndex: 3,
          explanation:
            "Guards implement canActivate(); returning false stops the request with a 403 Forbidden.",
        },
        {
          id: "nestjs-architecture-q5",
          prompt: "Which building block is the idiomatic place to validate and transform incoming data, for example ValidationPipe with DTO classes?",
          options: ["Pipes", "Guards", "Interceptors", "Exception filters"],
          correctIndex: 0,
          explanation:
            "Pipes run just before the handler and either transform arguments or throw when validation fails.",
        },
        {
          id: "nestjs-architecture-q6",
          prompt: "In what order does Nest run these for an incoming request?",
          options: [
            "Guards, middleware, pipes, interceptors, handler",
            "Pipes, guards, middleware, handler",
            "Middleware, guards, interceptors, pipes, handler",
            "Interceptors, pipes, guards, middleware, handler",
          ],
          correctIndex: 2,
          explanation:
            "Guards run after all middleware but before any interceptor or pipe, and pipes run right before the handler.",
        },
      ],
    },
    {
      id: "python-apis",
      trackId: "backend",
      title: "Python APIs: FastAPI & Django",
      summary:
        "Building Python APIs from type hints with FastAPI (Pydantic v2 validation, automatic OpenAPI docs) and when Django's batteries-included ORM, auth and admin are the better fit.",
      level: "intermediate",
      estMinutes: 120,
      webRef: { label: "FastAPI documentation", url: "https://fastapi.tiangolo.com/" },
      videoRef: {
        label: "freeCodeCamp: Python API Development, Comprehensive Course (FastAPI)",
        url: "https://www.youtube.com/watch?v=0sOvCWFmrtA",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "python-apis-q1",
          prompt: "How does FastAPI validate a JSON request body?",
          options: [
            "You write manual if-checks at the top of every handler",
            "You declare a Pydantic model as the parameter type; invalid input gets an automatic 422 response with details",
            "It relies on a JSON Schema file you write by hand",
            "It doesn't: validation needs Django REST Framework",
          ],
          correctIndex: 1,
          explanation:
            "FastAPI uses Pydantic models to parse, validate and document request bodies straight from type hints.",
        },
        {
          id: "python-apis-q2",
          prompt: "What does FastAPI generate automatically from your routes and type hints?",
          options: [
            "Interactive OpenAPI docs, with Swagger UI at /docs and ReDoc at /redoc",
            "A React admin dashboard",
            "Database migrations",
            "A GraphQL schema",
          ],
          correctIndex: 0,
          explanation:
            "FastAPI builds an OpenAPI schema from your path operations and serves interactive docs from it.",
        },
        {
          id: "python-apis-q3",
          prompt: "Which is a core strength of Django compared with FastAPI?",
          options: [
            "It was designed async-first around type hints",
            "It has no opinion on project structure",
            "It ships its own ORM, migrations, authentication and an auto-generated admin site",
            "It can only serve JSON APIs",
          ],
          correctIndex: 2,
          explanation:
            "Django is batteries-included; FastAPI is a lean API layer you pair with your own choice of ORM and auth.",
        },
        {
          id: "python-apis-q4",
          prompt: 'Given @app.get("/items/{item_id}") and def read_item(item_id: int, q: str | None = None), what is q?',
          options: [
            "A second path parameter",
            "A required request header",
            "A field in the JSON body",
            "An optional query parameter, as in /items/5?q=shoes",
          ],
          correctIndex: 3,
          explanation:
            "Function parameters that aren't in the path are treated as query parameters, and a None default makes them optional.",
        },
        {
          id: "python-apis-q5",
          prompt: "FastAPI doesn't ship an ORM. What does its official SQL tutorial pair it with?",
          options: [
            "Django's ORM, which FastAPI bundles",
            "SQLModel, built on SQLAlchemy and Pydantic",
            "Mongoose",
            "Hibernate",
          ],
          correctIndex: 1,
          explanation:
            "SQLModel (by FastAPI's author) combines SQLAlchemy tables with Pydantic models; plain SQLAlchemy is also common.",
        },
      ],
    },
    {
      id: "databases",
      trackId: "backend",
      title: "Databases: SQL & NoSQL",
      summary:
        "Relational modeling and indexing in PostgreSQL, transactions and ACID, and when document stores like MongoDB or in-memory stores like Redis fit better.",
      level: "intermediate",
      estMinutes: 120,
      webRef: { label: "PostgreSQL documentation", url: "https://www.postgresql.org/docs/" },
      videoRef: {
        label: "Fireship: 7 Database Paradigms",
        url: "https://www.youtube.com/watch?v=W2Z7fbCLSTw",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "databases-q1",
          prompt: "What does a B-tree index on users(email) mainly speed up?",
          options: [
            "Every INSERT into the table",
            "Lookups, range scans and sorting by email, at the cost of extra storage and slower writes",
            "Queries that filter on any column",
            "Backups and restores",
          ],
          correctIndex: 1,
          explanation:
            "An index is a sorted structure the planner can search instead of scanning every row; it must be updated on every write.",
        },
        {
          id: "databases-q2",
          prompt: "How do you model a many-to-many relationship between students and courses?",
          options: [
            "A comma-separated list of course ids in each student row",
            "A course_id column on students",
            "A join table, such as enrollments, with foreign keys to both",
            "Duplicate each student once per course",
          ],
          correctIndex: 2,
          explanation:
            "A join table holds one row per pairing, keeping both sides normalized and enforceable with foreign keys.",
        },
        {
          id: "databases-q3",
          prompt: "What does the I in ACID (isolation) guarantee?",
          options: [
            "Concurrent transactions don't see each other's in-progress changes, to the degree set by the isolation level",
            "Each table is stored in its own file",
            "Data survives a crash once committed",
            "Every column is validated against its type",
          ],
          correctIndex: 0,
          explanation:
            "Isolation controls what concurrent transactions can observe; durability (the D) is what survives crashes.",
        },
        {
          id: "databases-q4",
          prompt: "When is a document database like MongoDB a natural fit?",
          options: [
            "Financial ledgers that need multi-table joins",
            "Data that's read and written as self-contained, nested documents with a flexible shape",
            "Anywhere you need strict relational integrity",
            "Only for storing files",
          ],
          correctIndex: 1,
          explanation:
            "Documents shine when an entity and its nested data are loaded together and the shape varies between records.",
        },
        {
          id: "databases-q5",
          prompt: "What is Redis most often used for next to a primary database?",
          options: [
            "Long-term storage of relational data",
            "Full-text search over documents",
            "Running database migrations",
            "In-memory caching, sessions, rate limiting and queues",
          ],
          correctIndex: 3,
          explanation:
            "Redis keeps data in memory, making it ideal for fast, short-lived data in front of a slower primary store.",
        },
        {
          id: "databases-q6",
          prompt: "What does EXPLAIN ANALYZE do in PostgreSQL?",
          options: [
            "Rewrites the query to be faster",
            "Runs the query and shows the actual plan with timings, such as whether it used an index or a sequential scan",
            "Checks the query for SQL injection",
            "Rebuilds the table's indexes",
          ],
          correctIndex: 1,
          explanation:
            "EXPLAIN shows the planner's chosen plan; ANALYZE actually executes it and reports real row counts and timings.",
        },
      ],
    },
    {
      id: "api-design",
      trackId: "backend",
      title: "API Design: REST & GraphQL",
      summary:
        "Designing APIs clients enjoy: resource-oriented REST URLs and status codes, GraphQL's typed single endpoint, versioning, pagination and useful error responses.",
      level: "intermediate",
      estMinutes: 90,
      webRef: { label: "roadmap.sh: API Design Roadmap", url: "https://roadmap.sh/api-design" },
      videoRef: {
        label: "Hayk Simonyan: How to Design APIs Like a Senior Engineer (REST, GraphQL)",
        url: "https://www.youtube.com/watch?v=7iHl71nt49o",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "api-design-q1",
          prompt: "Which request follows REST conventions for fetching order 7 of customer 42?",
          options: [
            "GET /getOrder?customer=42&id=7",
            "POST /orders/fetch",
            "GET /customers/42/orders/7",
            "GET /customers/42/getOrders/7",
          ],
          correctIndex: 2,
          explanation:
            "REST URLs name resources with nouns and let the HTTP method express the action.",
        },
        {
          id: "api-design-q2",
          prompt: "Why do large APIs often prefer cursor-based pagination over offsets like ?page=500?",
          options: [
            "Cursors stay stable when rows are inserted or deleted and don't scan all the skipped rows",
            "Cursors let clients jump to any page number",
            "Offsets aren't supported by SQL",
            "Cursors make responses cacheable forever",
          ],
          correctIndex: 0,
          explanation:
            "Deep offsets get slower and can skip or repeat items as data changes; a cursor continues from a known position.",
        },
        {
          id: "api-design-q3",
          prompt: "What's a common way to ship a breaking change without breaking existing clients?",
          options: [
            "Change the response shape and notify clients by email",
            "Release a new version, in the path (/v2/...) or a header, and keep the old one running for a while",
            "Return both shapes in every response forever",
            "Rename the domain",
          ],
          correctIndex: 1,
          explanation:
            "Versioning lets existing clients keep working while new clients adopt the new contract.",
        },
        {
          id: "api-design-q4",
          prompt: "What problem does GraphQL address compared with REST?",
          options: [
            "It removes the need for authentication",
            "It makes every response smaller than JSON",
            "It replaces the database",
            "Clients ask for exactly the fields they need in one query, avoiding over- and under-fetching",
          ],
          correctIndex: 3,
          explanation:
            "A GraphQL client describes the shape it wants against a typed schema and gets exactly that from one endpoint.",
        },
        {
          id: "api-design-q5",
          prompt: "A request fails validation. Which response helps API clients most?",
          options: [
            "200 OK with { success: false }",
            "500 with the server's stack trace",
            "400 or 422 with a structured body listing which fields failed and why",
            "404 Not Found",
          ],
          correctIndex: 2,
          explanation:
            "An accurate status code plus machine-readable error details lets clients show the right message and fix the request.",
        },
      ],
    },
    {
      id: "auth-security",
      trackId: "backend",
      title: "Authentication & Security",
      summary:
        "Sessions vs JWTs, OAuth 2.0 with PKCE, storing passwords with Argon2id, and defending against the OWASP Top 10:2025, led by Broken Access Control.",
      level: "advanced",
      estMinutes: 90,
      isMilestone: true,
      webRef: { label: "OWASP Top 10", url: "https://owasp.org/projects/top-ten" },
      videoRef: {
        label: "Fireship: Session vs Token Authentication in 100 Seconds",
        url: "https://www.youtube.com/watch?v=UBUNrFtufWo",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "auth-security-q1",
          prompt: "How should an app store user passwords?",
          options: [
            "Encrypted with AES so admins can recover them",
            "Hashed once with SHA-256",
            "Hashed with a slow, salted password algorithm such as Argon2id (or bcrypt on legacy systems)",
            "Base64-encoded",
          ],
          correctIndex: 2,
          explanation:
            "Password hashes must be slow and salted to resist brute force; OWASP recommends Argon2id first.",
        },
        {
          id: "auth-security-q2",
          prompt: "What's a trade-off of stateless JWT access tokens compared with server-side sessions?",
          options: [
            "They're hard to revoke before they expire, so keep them short-lived and pair them with refresh tokens",
            "They can't carry any user information",
            "They only work in cookies",
            "They require a database lookup on every request",
          ],
          correctIndex: 0,
          explanation:
            "The server trusts a valid signature until expiry, so revocation needs extra machinery such as short lifetimes or a denylist.",
        },
        {
          id: "auth-security-q3",
          prompt: "Which OAuth 2.0 flow should a single-page or mobile app use to get tokens on a user's behalf?",
          options: [
            "Implicit flow",
            "Resource Owner Password Credentials",
            "Client Credentials",
            "Authorization Code flow with PKCE",
          ],
          correctIndex: 3,
          explanation:
            "PKCE protects the authorization code for public clients that can't keep a secret; the implicit flow is deprecated.",
        },
        {
          id: "auth-security-q4",
          prompt: "Which cookie attributes help protect a session cookie?",
          options: [
            "Path and Domain only",
            "HttpOnly, Secure and SameSite",
            "Max-Age alone",
            "None: cookies can't be protected",
          ],
          correctIndex: 1,
          explanation:
            "HttpOnly blocks JavaScript access, Secure requires HTTPS, and SameSite limits cross-site sending (CSRF).",
        },
        {
          id: "auth-security-q5",
          prompt: "What best prevents SQL injection?",
          options: [
            "Parameterized queries or prepared statements (or an ORM that uses them)",
            "Escaping HTML in responses",
            "Hiding database error messages",
            "Only allowing POST requests",
          ],
          correctIndex: 0,
          explanation:
            "Parameters are sent separately from the SQL text, so user input can never change the query's structure.",
        },
        {
          id: "auth-security-q6",
          prompt: "Which category is #1 in the OWASP Top 10, in both the 2021 and 2025 editions?",
          options: ["Injection", "Cryptographic Failures", "Broken Access Control", "Security Misconfiguration"],
          correctIndex: 2,
          explanation:
            "Broken Access Control stayed at #1 in 2025 and now also covers server-side request forgery (SSRF).",
        },
      ],
    },
    {
      id: "docker-devops",
      trackId: "backend",
      title: "Docker & DevOps Basics",
      summary:
        "Packaging apps as images built from a Dockerfile, running them as containers, composing multi-container stacks with docker compose, and the basics of CI/CD.",
      level: "intermediate",
      estMinutes: 120,
      webRef: { label: "Docker docs: Get started", url: "https://docs.docker.com/get-started/" },
      videoRef: {
        label: "TechWorld with Nana: Docker Crash Course for Absolute Beginners",
        url: "https://www.youtube.com/watch?v=pg19Z8LL06w",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "docker-devops-q1",
          prompt: "What's the difference between an image and a container?",
          options: [
            "They're two names for the same thing",
            "An image is a read-only template; a container is a running (or stopped) instance of it with its own writable layer",
            "A container is the file you push to Docker Hub",
            "Images run on Linux, containers on Windows",
          ],
          correctIndex: 1,
          explanation:
            "You build an image once and can start many containers from it, each with its own isolated writable layer.",
        },
        {
          id: "docker-devops-q2",
          prompt: "Why copy package*.json and run npm ci before COPY . . in a Dockerfile?",
          options: [
            "Docker requires package files first",
            "It makes the image run faster",
            "It hides source code from the final image",
            "Layer caching: dependencies are only reinstalled when the package files change",
          ],
          correctIndex: 3,
          explanation:
            "Each instruction is a cached layer; editing source code then only invalidates the layers after the dependency install.",
        },
        {
          id: "docker-devops-q3",
          prompt: "What is Docker Compose for?",
          options: [
            "Defining and running multi-container apps (API, Postgres, Redis) from one compose.yaml with docker compose up",
            "Compressing images before pushing them",
            "Writing Dockerfiles automatically",
            "Scheduling containers across a cluster of servers",
          ],
          correctIndex: 0,
          explanation:
            "Compose describes services, networks and volumes declaratively; the hyphenated docker-compose v1 command is legacy.",
        },
        {
          id: "docker-devops-q4",
          prompt: "What does a multi-stage build achieve?",
          options: [
            "It runs several containers at once",
            "It builds for several CPU architectures",
            "It builds with full tooling in one stage, then copies only the output into a small runtime image",
            "It splits an image into several files",
          ],
          correctIndex: 2,
          explanation:
            "Compilers and dev dependencies stay in the build stage, so the shipped image is smaller and has less attack surface.",
        },
        {
          id: "docker-devops-q5",
          prompt: "How should a database container keep its data when the container is removed and re-created?",
          options: [
            "Commit the container to a new image after each write",
            "Mount a volume for the data directory",
            "Keep it in the container's writable layer",
            "Run docker restart instead of re-creating it",
          ],
          correctIndex: 1,
          explanation:
            "Volumes live outside the container's lifecycle, so data survives docker compose down (unless you pass --volumes).",
        },
        {
          id: "docker-devops-q6",
          prompt: "In a typical CI/CD pipeline, what happens after a push to main?",
          options: [
            "A developer manually copies files to the server",
            "Nothing until the next release day",
            "The production database is reset",
            "Automated steps install, lint, test, build and push an image, then deploy it",
          ],
          correctIndex: 3,
          explanation:
            "CI proves every change the same way; CD then ships passing builds automatically, so releases are small and repeatable.",
        },
      ],
    },
  ],
};
