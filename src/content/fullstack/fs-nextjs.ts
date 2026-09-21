import type { Module } from "@/types/curriculum";

// Shared fixtures for the fsnext-server-actions challenge.
const postSchema = {
  title: { type: "string", required: true, min: 3, max: 80 },
  priority: { type: "number", int: true, min: 1, max: 5 },
  tag: { type: "enum", values: ["bug", "feature"] },
};
const editorRoles = ["editor", "admin"];
const editor = { userId: "u1", role: "editor" };
const validationFailure = (fieldErrors: Record<string, string>) => ({
  result: { ok: false, error: { code: "VALIDATION", fieldErrors } },
  handlerCalls: 0,
  logged: [],
});

export default {
  id: "fs-nextjs",
  trackId: "fullstack",
  name: "Next.js Full-Stack",
  description:
    "Next.js as the whole stack: Server Actions as the mutation layer, Route Handlers as the public backend, Prisma and the connection math of serverless, Auth.js sessions and where auth checks really belong, and shipping all of it as one Vercel deployment. Written against Next.js 16 for engineers who already know React and want to know where the full-stack model bends and breaks.",
  refs: [
    { label: "Next.js: Fetching Data", url: "https://nextjs.org/docs/app/getting-started/fetching-data", kind: "docs" },
    { label: "Next.js: Mutating Data", url: "https://nextjs.org/docs/app/getting-started/mutating-data", kind: "docs" },
    { label: "Next.js: Backend for Frontend", url: "https://nextjs.org/docs/app/guides/backend-for-frontend", kind: "docs" },
    { label: "Next.js: Data Security", url: "https://nextjs.org/docs/app/guides/data-security", kind: "docs" },
  ],
  topics: [
    {
      id: "fsnext-server-actions",
      moduleId: "fs-nextjs",
      trackId: "fullstack",
      title: "Server Actions as the Full-Stack Glue",
      summary:
        "A Server Action is a server function whose reference is serialized to the client, so a `<form action>` or a transition can call it without you writing an API route. Next.js runs it as a POST to the current page, and when the action calls `updateTag`, `revalidatePath` or `refresh`, changes cookies, or redirects, the same response carries the freshly rendered RSC payload: mutation, cache invalidation and re-render in one round trip. That's the glue: no client fetch layer, no JSON endpoint to maintain, and forms that work before JavaScript loads.\n\nThe price is that every exported action is a public endpoint. `'use server'` swaps the function for an action ID that anyone can POST to, so page-level auth checks, hidden buttons and `proxy.ts` matchers protect nothing. Each action must authenticate, authorize the specific resource (an ownership check, not just \"logged in\"), validate its input as untrusted `FormData` strings, take identity from the session rather than the input, and return a minimal DTO, because return values are serialized to the browser. Next.js adds a CSRF check (Origin against Host), a 1 MB default body limit, encrypted closure variables and dead-code elimination of unused actions; none of that replaces authorization.\n\nTwo error channels matter. Expected failures (validation, not found, forbidden) should be returned as data so `useActionState` can render them, while unexpected ones should be logged and masked, since an error message can leak internals. `redirect()` and `notFound()` work by throwing control-flow errors, so a blanket `try/catch` silently swallows navigation unless it rethrows them. And the client dispatches actions one at a time: use them for mutations, not parallel data fetching.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        { label: "Next.js: Server Actions and Mutations", url: "https://nextjs.org/docs/app/guides/server-actions", kind: "docs" },
        { label: "Next.js: Data Security", url: "https://nextjs.org/docs/app/guides/data-security", kind: "docs" },
        { label: "Next.js: redirect", url: "https://nextjs.org/docs/app/api-reference/functions/redirect", kind: "docs" },
        { label: "Next.js Blog: How to Think About Security in Next.js", url: "https://nextjs.org/blog/security-nextjs-server-components-actions", kind: "article" },
      ],
      video: {
        title: "Using Forms in Next.js (Server Actions, Revalidating Data)",
        channel: "leerob",
        url: "https://www.youtube.com/watch?v=dDpZfOQBMaU",
        videoId: "dDpZfOQBMaU",
        durationLabel: "10:26",
      },
      alternateVideos: [
        {
          title: "Protect Server Actions In Next.js The Right Way",
          channel: "ByteGrad",
          url: "https://www.youtube.com/watch?v=8YCL_jzxkXQ",
          videoId: "8YCL_jzxkXQ",
          durationLabel: "12:44",
        },
        {
          title: "Next.js 16 Full Course | Build and Deploy a Production-Ready Full Stack App",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=I1V9YWqRIeI",
          videoId: "I1V9YWqRIeI",
          durationLabel: "4:10:17",
          startSeconds: 11674,
          chapterLabel: "Server Actions",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createAction(config, handler)`. It returns the function you'd export from a `'use server'` file: `action(input)` authenticates, authorizes, validates, runs `handler`, and resolves to a serializable result instead of throwing across the network. `config` is `{ getSession, roles?, schema, log }`.\n\nRun these steps in order and stop at the first failure:\n\n- `await getSession()`. If it returns `null`, resolve `{ ok: false, error: { code: \"UNAUTHENTICATED\" } }`. Authentication comes first, so anonymous callers learn nothing about your validation rules and never reach your code.\n- If `roles` is given and doesn't include `session.role`, resolve `{ ok: false, error: { code: \"FORBIDDEN\" } }`. Without `roles`, any signed-in user may call the action.\n- Validate `input` against `schema` (rules below). If any field fails, resolve `{ ok: false, error: { code: \"VALIDATION\", fieldErrors } }`, where `fieldErrors` maps each failing field to one message.\n- Call `handler(data, { userId, role })` with only the validated fields and the identity from the session, never from the input. Resolve `{ ok: true, data: result }`, using `null` when the handler returns `undefined`.\n\nErrors thrown by `getSession` or `handler`:\n\n- An `ActionError` (already defined for you) is an expected failure: resolve `{ ok: false, error: { code, message } }` with its `code` and `message`.\n- An object whose `digest` is a string starting with `\"NEXT_\"` is what `redirect()` and `notFound()` throw: rethrow it unchanged so Next.js can navigate.\n- Anything else, including thrown non-`Error` values: pass it to `log` and resolve `{ ok: false, error: { code: \"INTERNAL\", message: \"Something went wrong\" } }`, so internals never reach the client.\n\nValidation: each schema entry is `{ type, required?, min?, max?, int?, values? }`. Form values arrive as strings, so trim string values first. A value that is `undefined`, `null` or `\"\"` is missing: that's `\"Required\"` for a required field, and otherwise the field is simply left out of `data`. Keys that aren't in the schema are dropped. Otherwise check in this order and report the first failure:\n\n- `\"string\"`: must be a string (`\"Expected string\"`), with length at least `min` (`\"Must be at least <min> characters\"`) and at most `max` (`\"Must be at most <max> characters\"`).\n- `\"number\"`: a number, or a string that `Number()` converts; the result must be finite (`\"Expected number\"`), an integer when `int` is set (`\"Must be an integer\"`), at least `min` (`\"Must be at least <min>\"`) and at most `max` (`\"Must be at most <max>\"`). `data` gets the converted number.\n- `\"enum\"`: must be one of `values` (`\"Must be one of: <values joined with \", \">\"`).\n\nThe tests call `runActionScenario`, which wraps a scripted handler with your `createAction`, calls the action once and reports the result, how many times the handler ran, and what was logged. Leave the driver as it is.",
        starterCode: `/** An error the handler throws on purpose. Its code and message are safe to show the user. */
class ActionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ActionError";
    this.code = code;
  }
}

/**
 * Wrap a Server Action body so every call is authenticated, authorized and validated, and
 * always resolves to a serializable result instead of throwing across the network.
 *
 * @param {{
 *   getSession: () => Promise<null | { userId: string, role: string }>,
 *   roles?: string[],
 *   schema: Record<string, { type: "string" | "number" | "enum", required?: boolean, min?: number, max?: number, int?: boolean, values?: string[] }>,
 *   log: (err: unknown) => void,
 * }} config
 * @param {(data: object, ctx: { userId: string, role: string }) => Promise<unknown>} handler
 * @returns {(input: object) => Promise<object>}
 */
function createAction(config, handler) {
  // Your code here
}

// ---- Test driver (leave as is) ----
// Builds a Server Action with createAction, calls it once and reports what happened.
// behavior: "echo" returns what the handler received, "void" returns nothing, "notFound" throws
// an ActionError, "crash" throws an Error with internals in its message, "throwString" throws a
// string, "redirect" throws what Next.js's redirect() throws.
async function runActionScenario({ session, roles, schema, input, behavior }) {
  const logged = [];
  let handlerCalls = 0;
  const handler = async (data, ctx) => {
    handlerCalls++;
    if (behavior === "echo") return { saved: data, by: ctx.userId };
    if (behavior === "void") return undefined;
    if (behavior === "notFound") throw new ActionError("NOT_FOUND", "Post not found");
    if (behavior === "crash") throw new Error("connect ECONNREFUSED 10.0.0.12:5432 user=app password=hunter2");
    if (behavior === "throwString") throw "boom";
    if (behavior === "redirect") throw Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;push;/posts/42;303;" });
    return null;
  };
  const action = createAction(
    {
      getSession: async () => session,
      roles,
      schema,
      log: (err) => logged.push(err instanceof Error ? err.message : String(err)),
    },
    handler,
  );
  try {
    const result = await action(input);
    return { result, handlerCalls, logged };
  } catch (err) {
    return { rethrown: err && err.digest ? err.digest : String(err), handlerCalls, logged };
  }
}
`,
        functionName: "runActionScenario",
        testCases: [
          {
            description: "an editor with valid form data: strings are trimmed, numeric strings converted, identity taken from the session",
            args: [{ session: editor, roles: editorRoles, schema: postSchema, input: { title: "  Ship it  ", priority: "3", tag: "bug" }, behavior: "echo" }],
            expected: { result: { ok: true, data: { saved: { title: "Ship it", priority: 3, tag: "bug" }, by: "u1" } }, handlerCalls: 1, logged: [] },
          },
          {
            description: "no session: UNAUTHENTICATED is returned before validation, and the handler never runs",
            args: [{ session: null, roles: editorRoles, schema: postSchema, input: { title: "" }, behavior: "echo" }],
            expected: { result: { ok: false, error: { code: "UNAUTHENTICATED" } }, handlerCalls: 0, logged: [] },
            isEdgeCase: true,
          },
          {
            description: "a signed-in user without an allowed role gets FORBIDDEN",
            args: [{ session: { userId: "u2", role: "viewer" }, roles: editorRoles, schema: postSchema, input: { title: "Hello" }, behavior: "echo" }],
            expected: { result: { ok: false, error: { code: "FORBIDDEN" } }, handlerCalls: 0, logged: [] },
          },
          {
            description: "several invalid fields each report their first failing rule",
            args: [{ session: editor, roles: editorRoles, schema: postSchema, input: { title: "ab", priority: "9", tag: "chore" }, behavior: "echo" }],
            expected: validationFailure({
              title: "Must be at least 3 characters",
              priority: "Must be at most 5",
              tag: "Must be one of: bug, feature",
            }),
          },
          {
            description: "keys outside the schema, like authorId and role, never reach the handler",
            args: [
              {
                session: editor,
                roles: editorRoles,
                schema: postSchema,
                input: { title: "Hello", priority: 2, authorId: "u999", role: "admin" },
                behavior: "echo",
              },
            ],
            expected: { result: { ok: true, data: { saved: { title: "Hello", priority: 2 }, by: "u1" } }, handlerCalls: 1, logged: [] },
            isEdgeCase: true,
          },
          {
            description: "wrong types: a non-string title and a non-numeric priority",
            args: [{ session: editor, roles: editorRoles, schema: postSchema, input: { title: 42, priority: "abc" }, behavior: "echo" }],
            expected: validationFailure({ title: "Expected string", priority: "Expected number" }),
          },
          {
            description: "a fractional priority fails the integer rule",
            args: [{ session: editor, roles: editorRoles, schema: postSchema, input: { title: "Hello", priority: "3.5" }, behavior: "echo" }],
            expected: validationFailure({ priority: "Must be an integer" }),
          },
          {
            description: "a whitespace-only required field is missing, while a blank optional field is simply omitted",
            args: [{ session: editor, roles: editorRoles, schema: postSchema, input: { title: "   ", priority: "" }, behavior: "echo" }],
            expected: validationFailure({ title: "Required" }),
            isEdgeCase: true,
          },
          {
            description: "an expected ActionError becomes a typed error the UI can render",
            args: [{ session: editor, roles: editorRoles, schema: postSchema, input: { title: "Hello" }, behavior: "notFound" }],
            expected: { result: { ok: false, error: { code: "NOT_FOUND", message: "Post not found" } }, handlerCalls: 1, logged: [] },
          },
          {
            description: "an unexpected error is logged but masked, so connection details never reach the client",
            args: [{ session: editor, roles: editorRoles, schema: postSchema, input: { title: "Hello" }, behavior: "crash" }],
            expected: {
              result: { ok: false, error: { code: "INTERNAL", message: "Something went wrong" } },
              handlerCalls: 1,
              logged: ["connect ECONNREFUSED 10.0.0.12:5432 user=app password=hunter2"],
            },
            isEdgeCase: true,
          },
          {
            description: "a thrown string is treated as an unexpected error too",
            args: [{ session: editor, roles: editorRoles, schema: postSchema, input: { title: "Hello" }, behavior: "throwString" }],
            expected: { result: { ok: false, error: { code: "INTERNAL", message: "Something went wrong" } }, handlerCalls: 1, logged: ["boom"] },
          },
          {
            description: "redirect()'s control-flow error is rethrown, not swallowed or logged",
            args: [{ session: editor, roles: editorRoles, schema: postSchema, input: { title: "Hello" }, behavior: "redirect" }],
            expected: { rethrown: "NEXT_REDIRECT;push;/posts/42;303;", handlerCalls: 1, logged: [] },
            isEdgeCase: true,
          },
          {
            description: "without a roles list any signed-in user may call the action, and an undefined result becomes null",
            args: [{ session: { userId: "u2", role: "viewer" }, schema: postSchema, input: { title: "Hello" }, behavior: "void" }],
            expected: { result: { ok: true, data: null }, handlerCalls: 1, logged: [] },
          },
        ],
      },
    },
    {
      id: "fsnext-route-handlers",
      moduleId: "fs-nextjs",
      trackId: "fullstack",
      title: "Route Handlers as a Backend Within Next.js",
      summary:
        "A `route.ts` file turns a URL into an HTTP endpoint built on the Web `Request` and `Response` APIs. Export `GET`, `POST` and friends; Next.js answers other methods with `405` and implements `OPTIONS` for you. Route Handlers are the part of Next.js that behaves like a conventional backend, and they're the right tool whenever the caller isn't your own React tree: Stripe or CMS webhooks, mobile apps, partner integrations, OAuth callbacks, file downloads, anything that needs a stable URL and a documented contract. Server Actions are the opposite: POST-only, addressed by build-specific IDs that change between deployments, and dispatched one at a time by the client.\n\nThey aren't cached by default. A `GET` can opt in with `export const dynamic = 'force-static'`, or with Cache Components through a `'use cache'` helper outside the handler body; other methods are never cached. Revalidate from a handler with `revalidateTag(tag, 'max')` or `revalidatePath`, since `updateTag` works only in Server Actions. `params` is a Promise in current Next.js, and the request body is a one-shot stream: read `await request.text()` once when you need the raw bytes to verify a webhook signature, then parse it.\n\nThe classic misuse is fetching your own Route Handler from a Server Component. It adds an HTTP hop, needs an absolute URL, and fails during build-time prerendering because no server is listening; call the data layer directly. Deployment shapes the rest: on Vercel each handler runs as a function with a 4.5 MB body limit, a maximum duration and no guaranteed shared memory, and Next.js now deprecates the Edge runtime in favour of the Node.js default. Treat every handler as a public endpoint with its own auth, validation and rate limiting.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Next.js: Route Handlers", url: "https://nextjs.org/docs/app/getting-started/route-handlers", kind: "docs" },
        { label: "Next.js: route.js API reference", url: "https://nextjs.org/docs/app/api-reference/file-conventions/route", kind: "docs" },
        { label: "Next.js: Backend for Frontend", url: "https://nextjs.org/docs/app/guides/backend-for-frontend", kind: "article" },
        { label: "Vercel: Functions Limits", url: "https://vercel.com/docs/functions/limitations", kind: "docs" },
      ],
      video: {
        title: "Next.js 16 Full Course | Build and Deploy a Production-Ready Full Stack App",
        channel: "JavaScript Mastery",
        url: "https://www.youtube.com/watch?v=I1V9YWqRIeI",
        videoId: "I1V9YWqRIeI",
        durationLabel: "4:10:17",
        startSeconds: 8171,
        chapterLabel: "API Routes",
      },
      alternateVideos: [
        {
          title: "Next.js Server Actions vs API Routes: The Final Answer for 2025",
          channel: "Tobi Mey",
          url: "https://www.youtube.com/watch?v=NWx8oVLEdwE",
          videoId: "NWx8oVLEdwE",
          durationLabel: "7:21",
        },
        {
          title: "Next.js React Framework Course – Build and Deploy a Full Stack App From scratch",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=KjY94sAKLlw",
          videoId: "KjY94sAKLlw",
          durationLabel: "4:47:36",
          startSeconds: 12087,
          chapterLabel: "API Routing in Next.js",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "fsnext-route-handlers-q1",
          prompt: "Which callers need a Route Handler rather than a Server Action? (Select all that apply.)",
          options: [
            "Stripe sending signed webhook events",
            "A React Native app that needs a stable, documented JSON API",
            "An OAuth provider redirecting the browser to your callback URL with `?code=...`",
            "A `<form>` in your own app that creates a comment",
            "A like button in your app that updates a count and re-renders the page",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Server Actions are POST-only and addressed by action IDs that change between builds, so outside callers can't depend on them, and OAuth redirects arrive as GET navigations. Forms and buttons inside your own React tree are exactly what actions are for.",
        },
        {
          id: "fsnext-route-handlers-q2",
          prompt:
            "Without Cache Components enabled, how often does this handler run in production?\n\n```ts\n// app/api/stats/route.ts\nexport async function GET() {\n  const stats = await db.stats.aggregate();\n  return Response.json(stats);\n}\n```",
          options: [
            "On every request: Route Handlers aren't cached by default",
            "Once at build time; the JSON is served statically until the next deploy",
            "Once an hour, the default revalidation window",
            "Once per user session",
          ],
          correctIndex: 0,
          explanation:
            "Route Handlers run at request time unless a `GET` opts into caching, for example with `export const dynamic = 'force-static'`. Older Next.js versions cached `GET` handlers by default, which is why you still see advice to opt out.",
        },
        {
          id: "fsnext-route-handlers-q3",
          prompt:
            "What's wrong with this Server Component?\n\n```tsx\n// app/dashboard/page.tsx\nexport default async function Page() {\n  const res = await fetch(\"/api/stats\");\n  const stats = await res.json();\n  return <Stats data={stats} />;\n}\n```",
          options: [
            "Server-side `fetch` needs an absolute URL, and calling your own handler adds an HTTP hop that also fails during build-time prerendering; call the data function directly",
            "Route Handlers can only be called from Client Components",
            "`fetch` in Server Components caches forever, so the stats never update",
            "Nothing: this is the recommended way to share logic between pages and APIs",
          ],
          correctIndex: 0,
          explanation:
            "The Server Component already runs on the server, so going out over HTTP and back in just adds latency and failure modes, and at build time there's no server to answer. Share a data-layer function between the page and the handler instead. `fetch` isn't cached by default in current Next.js.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-route-handlers-q4",
          prompt:
            "A project has `app/account/page.tsx` and someone adds `app/account/route.ts` exporting `POST` to receive form submissions. What happens?",
          options: [
            "It's a conflict: a `route.ts` can't live in the same segment as a `page.tsx`",
            "`GET` requests go to the page and `POST` requests go to the handler",
            "The Route Handler takes over every method, hiding the page",
            "The page wins and the handler is silently ignored",
          ],
          correctIndex: 0,
          explanation:
            "Each `page` or `route` file owns every HTTP verb for its segment, so Next.js reports the two as conflicting. Put the handler under a different path such as `app/api/account/route.ts`, or use a Server Action for the form.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-route-handlers-q5",
          prompt:
            "In Next.js 16, what's wrong with this handler?\n\n```ts\n// app/api/posts/[id]/route.ts\nexport async function GET(_req: Request, { params }: { params: { id: string } }) {\n  const post = await getPost(params.id);\n  return Response.json(post);\n}\n```",
          options: [
            "`params` is a Promise: await it (`const { id } = await params`), and type the context with `RouteContext<'/api/posts/[id]'>`",
            "Dynamic segments aren't supported in Route Handlers",
            "`GET` handlers can't take a second argument",
            "`Response.json` isn't available in Route Handlers",
          ],
          correctIndex: 0,
          explanation:
            "Since Next.js 15, `params` (like `searchParams` in pages) is a Promise, so `params.id` here is `undefined`. The generated `RouteContext` helper types it correctly, and `Response.json` is the standard Web API.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-route-handlers-q6",
          prompt:
            "What's the bug in this webhook handler?\n\n```ts\nexport async function POST(request: Request) {\n  const event = await request.json();\n  const raw = await request.text();\n  if (!verifySignature(raw, request.headers.get(\"stripe-signature\"))) {\n    return new Response(\"bad signature\", { status: 400 });\n  }\n  // handle event...\n}\n```",
          options: [
            "The body stream can only be read once, so `request.text()` fails after `request.json()`; read the raw text first, verify it, then `JSON.parse` it",
            "Webhook handlers must export `GET`, not `POST`",
            "`request.headers` is a Promise in Next.js 16",
            "Webhook signatures must be verified in `proxy.ts`",
          ],
          correctIndex: 0,
          explanation:
            "A `Request` body is a one-shot stream; the second read throws because the body was already used. Signatures are computed over the exact bytes sent, so verifying a re-serialized object would fail anyway.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-route-handlers-q7",
          prompt: "A CMS webhook Route Handler calls `updateTag(\"posts\")` after content changes. What happens?",
          options: [
            "It isn't allowed: `updateTag` works only in Server Actions; call `revalidateTag(\"posts\", \"max\")` from a Route Handler instead",
            "It works and immediately re-renders every page for every user",
            "It works, but only in development",
            "It clears the browser cache of every visitor",
          ],
          correctIndex: 0,
          explanation:
            "`updateTag` exists for read-your-own-writes after a user's mutation and is restricted to Server Actions. `revalidateTag` with the `max` profile marks the tag stale, and pages refresh in the background as they're next requested.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-route-handlers-q8",
          prompt:
            "A Route Handler deployed to Vercel Functions keeps rate-limit counters in a module-scope `Map` and accepts video uploads in the request body. Which problems should you expect? (Select all that apply.)",
          options: [
            "Counters aren't shared across instances and vanish when an instance is recycled, so limits are inconsistent",
            "Bodies over 4.5 MB fail with `413 FUNCTION_PAYLOAD_TOO_LARGE`; upload straight to object storage with a presigned URL instead",
            "Long processing can exceed the function's maximum duration and return a `504`",
            "Module-scope variables are reset before every request, even on a warm instance",
            "Route Handlers can't read request bodies on Vercel",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Module scope persists on a warm instance (and is shared by concurrent requests under Fluid compute), but every instance has its own copy, so shared state belongs in Redis or a database. Payload and duration limits are properties of the function platform.",
        },
        {
          id: "fsnext-route-handlers-q9",
          prompt:
            "A client dashboard loads five independent widgets by calling five Server Actions inside `Promise.all`. Why is it slow?",
          options: [
            "The client dispatches Server Actions one at a time, so the five calls run sequentially; fetch reads in a Server Component or use a Route Handler",
            "Each Server Action opens its own database connection",
            "Server Actions are rate-limited to one per second",
            "`Promise.all` doesn't work in Client Components",
          ],
          correctIndex: 0,
          explanation:
            "Next.js queues actions per client so each re-rendered tree matches the action that produced it. That's fine for mutations and a trap for reads, which belong in Server Components or plain GET endpoints.",
        },
        {
          id: "fsnext-route-handlers-q10",
          prompt:
            "A Route Handler has `export const runtime = 'edge'` and imports the `pg` Postgres driver. What should you expect in current Next.js?",
          options: [
            "A deprecation warning for the Edge runtime, and `pg` can't work there anyway (no TCP sockets or Node APIs); remove the export to get the default Node.js runtime",
            "Faster queries, because the Edge runtime supports raw TCP",
            "Next.js silently adds full Node.js API support to Edge functions",
            "An error, because Route Handlers on Vercel must use the Edge runtime",
          ],
          correctIndex: 0,
          explanation:
            "The Next.js docs now list `runtime: 'edge'` as deprecated, and Node.js is the default for pages, handlers and Proxy. The Edge runtime never had native Node APIs, which is why TCP-based database drivers fail there.",
        },
        {
          id: "fsnext-route-handlers-q11",
          prompt:
            "A `route.ts` exports only `GET` and `POST`. A client sends `DELETE`, and a browser sends a CORS preflight `OPTIONS`. What does Next.js do?",
          options: [
            "`DELETE` gets `405 Method Not Allowed`; `OPTIONS` is answered automatically with an `Allow` header, but CORS headers are still yours to add",
            "Both get `404 Not Found`",
            "`DELETE` falls through to the `POST` handler",
            "Both are forwarded to `GET`",
          ],
          correctIndex: 0,
          explanation:
            "Unsupported methods get a `405`, and a missing `OPTIONS` export is filled in with an `Allow` header listing the defined methods. The `Access-Control-*` headers a cross-origin caller needs still have to be set by your handler or Proxy.",
        },
        {
          id: "fsnext-route-handlers-q12",
          prompt:
            "`/api/admin/export` is only linked from the admin page, which checks `session.user.role === \"admin\"`. Is the handler protected?",
          options: [
            "No: it's a public URL anyone can call, so it needs its own session and role check (and ideally rate limiting)",
            "Yes: Route Handlers inherit the auth checks of the page that links to them",
            "Yes, as long as a Proxy matcher covers `/admin`",
            "Yes: Route Handlers reject requests without an `Origin` header",
          ],
          correctIndex: 0,
          explanation:
            "Linking has nothing to do with access; the handler is its own entry point. A `/admin` matcher wouldn't even cover `/api/admin`, and Next.js's docs say not to rely on Proxy alone for authorization.",
        },
      ],
    },
    {
      id: "fsnext-prisma",
      moduleId: "fs-nextjs",
      trackId: "fullstack",
      title: "Prisma + Next.js Integration",
      summary:
        "Prisma and Next.js meet at two awkward seams: module lifecycles and connection counts. In development, hot reloading re-evaluates modules, so a plain `new PrismaClient()` creates another client and pool on every edit until the database refuses connections; the standard fix caches one instance on `globalThis` outside production. In production, create exactly one client per server instance at module scope and never `$disconnect()` per request. Keep it in a `server-only` data layer used by Server Components, Server Actions and Route Handlers.\n\nPrisma ORM 7, the line most Next.js apps run today, changed the plumbing. The Rust query engine is replaced by JavaScript driver adapters; the `prisma-client` generator requires an `output` path and you import from it instead of `@prisma/client`; connection URLs move to `prisma.config.ts`, and the CLI no longer loads `.env` by itself; and the client is built with a driver adapter, such as `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`. Pool settings now come from the driver: `pg` defaults to `max: 10` with no acquire timeout, and the old `connection_limit` URL parameter does nothing.\n\nServerless multiplies those pools. Fifty concurrent function instances with ten connections each is 500 connections against a Postgres plan that might allow 100. Put a pooler in front (PgBouncer, Supavisor, your provider's pooled endpoint), point migrations at a direct URL, and keep instances times pool size under the database limit. On Vercel's Fluid compute, one instance serves many concurrent requests, so keep a shared global pool, register it with `attachDatabasePool`, and don't shrink it to one connection. Standalone Prisma Accelerate is being retired on 1 December 2026. Finally, run `prisma generate` in your build, because Vercel caches dependencies, and apply migrations with `prisma migrate deploy` from CI, never on a cold start.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Prisma: Database connections (Prisma ORM 7)", url: "https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections", kind: "docs" },
        { label: "Prisma: Upgrade to Prisma ORM 7", url: "https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7", kind: "docs" },
        { label: "Prisma: Next.js troubleshooting (Prisma ORM 7)", url: "https://www.prisma.io/docs/orm/v7/more/troubleshooting/nextjs", kind: "docs" },
        { label: "Vercel: Connection Pooling with Vercel Functions", url: "https://vercel.com/kb/guide/connection-pooling-with-functions", kind: "article" },
      ],
      video: {
        title: "How to Use Prisma 7 in Next.js",
        channel: "Cand Dev",
        url: "https://www.youtube.com/watch?v=Ndhx_rNkoUw",
        videoId: "Ndhx_rNkoUw",
        durationLabel: "14:54",
      },
      alternateVideos: [
        {
          title: "Next.js 16 Full Course | Build and Deploy a Production-Ready Full Stack App",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=I1V9YWqRIeI",
          videoId: "I1V9YWqRIeI",
          durationLabel: "4:10:17",
          startSeconds: 7006,
          chapterLabel: "Database Models & Connection",
        },
        {
          title: "The New Prisma 7 Config File Just Landed",
          channel: "Prisma",
          url: "https://www.youtube.com/watch?v=nZasBSuBtFw",
          videoId: "nZasBSuBtFw",
          durationLabel: "2:09",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "fsnext-prisma-q1",
          prompt:
            "After an hour of editing under `next dev`, Postgres starts rejecting connections with \"too many clients\". `lib/db.ts` is simply `export const prisma = new PrismaClient({ adapter })`. Why?",
          options: [
            "Hot reloading re-evaluates the module and creates new clients, each with its own pool, while the old ones stay connected; cache the client on `globalThis` in development",
            "Server Components create one `PrismaClient` per render by design",
            "Prisma leaks a connection per query unless you call `$disconnect()`",
            "Next.js disables connection pooling in development mode",
          ],
          correctIndex: 0,
          explanation:
            "Every reload of `lib/db.ts` builds a fresh client and pool, and nothing closes the previous ones. Globals survive module re-evaluation, so storing the instance on `globalThis` keeps it to one. Calling `$disconnect()` per query would just add connection latency.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-prisma-q2",
          prompt:
            "Why does the standard singleton skip the global assignment in production?\n\n```ts\nconst globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };\nexport const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });\nif (process.env.NODE_ENV !== \"production\") globalForPrisma.prisma = prisma;\n```",
          options: [
            "Production doesn't hot-reload, so normal module caching already guarantees one client per instance; the global only exists to survive dev reloads",
            "Global variables aren't allowed in production Node.js",
            "In production each request must get a fresh client for isolation",
            "Writing to `globalThis` in production leaks memory on every request",
          ],
          correctIndex: 0,
          explanation:
            "Node caches a module after its first evaluation, so production code gets the same exported client everywhere. The global is purely a development workaround, and assigning it once per instance wouldn't leak anything either way.",
        },
        {
          id: "fsnext-prisma-q3",
          prompt: "Which snippet creates a Prisma ORM 7 client for Postgres?",
          options: [
            "`import { PrismaClient } from \"./generated/prisma/client\"` with `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })`",
            "`import { PrismaClient } from \"@prisma/client\"` with `new PrismaClient({ datasourceUrl: process.env.DATABASE_URL })`",
            "`new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })` using the default Rust engine",
            "`new PrismaClient()`, which reads `DATABASE_URL` from `.env` at runtime and needs no adapter",
          ],
          correctIndex: 0,
          explanation:
            "Prisma ORM 7 requires a driver adapter for every database and generates the client into the `output` path you configure. The `datasourceUrl` and `datasources` constructor options are the pre-7 API, and the Rust engine they relied on was replaced by driver adapters.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-prisma-q4",
          prompt: "Which Prisma ORM 7 changes commonly bite during an upgrade? (Select all that apply.)",
          options: [
            "The `prisma-client` generator requires an `output` path, and the client is no longer generated into `node_modules`",
            "Pool settings come from the driver adapter, so `connection_limit` in the connection URL no longer does anything",
            "The CLI no longer loads `.env` automatically; `prisma.config.ts` has to load it, for example with `dotenv/config`",
            "Migrations were removed in favour of `prisma db push`",
            "Every database now requires a MongoDB-style replica set",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "All three come from the v7 upgrade guide and connection docs. Migrations still exist (`migrate dev` and `migrate deploy`), and nothing about replica sets applies to relational databases.",
        },
        {
          id: "fsnext-prisma-q5",
          prompt:
            "A Next.js app on serverless functions uses the `pg` adapter with its default pool. During a spike, 40 instances are warm. The Postgres plan allows 100 connections. What's the worst-case demand, and a sound fix?",
          options: [
            "Up to 400 connections (40 instances × the default `max` of 10); put a pooler in front and size pools so instances × pool stays under the limit",
            "40: Prisma shares a single connection per instance by default",
            "10: the pool is shared across all instances",
            "100: Postgres queues the extra connections without errors",
          ],
          correctIndex: 0,
          explanation:
            "Every instance has its own pool, so demand scales with instance count. Postgres rejects connections beyond `max_connections`; a pooler like PgBouncer or Supavisor multiplexes many clients onto a few server connections.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-prisma-q6",
          prompt:
            "An old serverless guide says to set the pool size to 1 per function. For Vercel Functions with Fluid compute, what does Vercel recommend instead?",
          options: [
            "A global pool with a small minimum and a short idle timeout, registered with `attachDatabasePool`, and not a maximum of 1, because one instance now serves many concurrent requests",
            "Keep the maximum at 1 and scale by adding regions",
            "Open a connection per request and close it in a `finally` block",
            "Turn Fluid compute off for any function that uses a database",
          ],
          correctIndex: 0,
          explanation:
            "Under Fluid compute, concurrent invocations share an instance and its globals, so a pool of 1 serializes them without reducing total connections. `attachDatabasePool` closes idle clients before the instance is suspended, which fixes the leak that made the old advice necessary.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-prisma-q7",
          prompt:
            "After moving to Prisma ORM 7 with the `pg` adapter, a burst of slow queries makes other requests hang until the function times out, instead of failing fast. Which default is involved?",
          options: [
            "The `pg` pool's connection timeout defaults to `0`, meaning wait forever; set `connectionTimeoutMillis` so pool exhaustion errors quickly",
            "Prisma 7 retries every failed query for 60 seconds",
            "Vercel pauses functions that open more than 10 connections",
            "Postgres `statement_timeout` is forced to `0` by Prisma 7",
          ],
          correctIndex: 0,
          explanation:
            "Prisma 6 had a 10-second pool timeout and a 5-second connect timeout; the `pg` driver's defaults are `0`, so a request waits indefinitely for a free connection. Prisma's docs show how to restore the v6-style timeouts on the adapter.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-prisma-q8",
          prompt: "You put PgBouncer in front of Postgres for the app's runtime traffic. Which setup is right? (Select all that apply.)",
          options: [
            "The runtime client connects to the pooled URL through the driver adapter",
            "`prisma.config.ts` points the CLI (migrations, introspection) at a direct, unpooled URL",
            "Migrations must also go through the pooled URL so they share the same limits",
            "The driver adapter can be removed, since PgBouncer does its job",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Application queries benefit from pooling, while migrations need a real session on the database, so Prisma's docs split them into a pooled runtime URL and a direct CLI URL. The adapter is still how Prisma 7 talks to Postgres at all.",
        },
        {
          id: "fsnext-prisma-q9",
          prompt:
            "The first Vercel deploy works. After a schema change, the next deploy's code queries a field the generated client doesn't know about. Why?",
          options: [
            "Vercel reuses cached dependencies, so Prisma's install-time generation may not rerun; run `prisma generate` in your own `postinstall` script or build command",
            "Vercel strips unused fields from the generated client",
            "The generated client is cached in visitors' browsers",
            "Schema changes require creating a new Vercel project",
          ],
          correctIndex: 0,
          explanation:
            "Prisma's docs call this out explicitly: with cached modules, the hook that generates the client on install doesn't fire, so the build ships a stale client. Generating explicitly on every build fixes it.",
        },
        {
          id: "fsnext-prisma-q10",
          prompt: "Where may the Prisma client be imported in an App Router project? (Select all that apply.)",
          options: [
            "A Server Component",
            "A Server Action",
            "A Route Handler",
            "A Client Component marked `'use client'`",
            "A utility module shared by server and client code without `import \"server-only\"`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that ends up in the browser bundle can't hold database credentials or open TCP connections. Marking the data layer with `server-only` turns an accidental client import into a build error instead of a leak.",
        },
        {
          id: "fsnext-prisma-q11",
          prompt: "Where should `prisma migrate deploy` run for a Vercel-hosted app?",
          options: [
            "In a CI or release step against the target database before the new build takes traffic, never inside request handlers or at cold start",
            "At the top of `lib/db.ts`, so every instance migrates on startup",
            "In `proxy.ts` on the first request after a deploy",
            "Nowhere: `prisma migrate dev` runs automatically in production",
          ],
          correctIndex: 0,
          explanation:
            "Migrating from function startup means many instances racing to apply the same migration on a cold start. `migrate dev` is a development command that can reset data; `migrate deploy` applies pending migrations once, from a controlled step.",
        },
        {
          id: "fsnext-prisma-q12",
          prompt:
            "`DATABASE_URL` was added to every Vercel environment, so preview deployments use the production database. What's the risk, and the fix?",
          options: [
            "Preview branches run unreviewed code, and possibly migrations or seed scripts, against production data; scope the variable to Production and give previews a separate or branched database",
            "No risk: preview deployments are read-only by default",
            "No risk: Vercel automatically forks the database for each preview",
            "Previews can't connect to databases, so the variable is ignored",
          ],
          correctIndex: 0,
          explanation:
            "Each variable is scoped per environment (with branch-level overrides for previews) precisely so previews can point elsewhere. Many Postgres providers offer per-branch databases that pair well with preview deployments.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "fsnext-auth",
      moduleId: "fs-nextjs",
      trackId: "fullstack",
      title: "NextAuth for Full-Stack Auth",
      summary:
        "Auth.js, the project formerly called NextAuth.js, is now maintained by the Better Auth team, who keep patching it but recommend Better Auth for new projects. For the App Router the package is `next-auth` v5, still published under the `beta` tag (npm's `latest` is v4). It exposes one `auth()` function for Server Components, Server Actions, Route Handlers and `proxy.ts`, reads `AUTH_*` environment variables, and strictly needs only `AUTH_SECRET`, the key that encrypts its session tokens.\n\nThe session strategy is the real decision. The JWT strategy (the default without a database adapter) keeps an encrypted token in an `HttpOnly` cookie: no database round trip, but no revocation before expiry, a cookie budget of about 4 KB, and role changes that only apply once the token is reissued. Database sessions store an opaque ID in the cookie and look it up per request, which costs a query but buys \"sign out everywhere\", device lists and instant revocation.\n\nWhere you check matters more than which library you pick. `proxy.ts` (Next.js 16's name for middleware) runs on every matched request, prefetches included, so it should only do optimistic cookie checks and redirects; CVE-2025-29927, which let a crafted header skip middleware on self-hosted apps, showed why it can't be the only gate. Layouts don't re-run on client navigation and don't guard nested segments or Server Actions. Put the real check in a data access layer that every page, action and handler calls, and authorize the specific record, not just the session. With Cache Components, don't read cookies inside a plain `'use cache'` function; resolve the user outside and pass the ID in. Preview deployments add OAuth friction, since providers rarely accept wildcard callback URLs, which `AUTH_REDIRECT_PROXY_URL` solves.",
      level: "expert",
      estMinutes: 55,
      webRefs: [
        { label: "Next.js: Authentication", url: "https://nextjs.org/docs/app/guides/authentication", kind: "docs" },
        { label: "Auth.js: Session strategies", url: "https://authjs.dev/concepts/session-strategies", kind: "docs" },
        { label: "Better Auth: Auth.js is now part of Better Auth", url: "https://better-auth.com/blog/authjs-joins-better-auth", kind: "article" },
        { label: "Vercel: Postmortem on Next.js Middleware bypass", url: "https://vercel.com/blog/postmortem-on-next-js-middleware-bypass", kind: "article" },
      ],
      video: {
        title: "Next.js App Router Authentication (Sessions, Cookies, JWTs)",
        channel: "leerob",
        url: "https://www.youtube.com/watch?v=DJvM2lSPn6w",
        videoId: "DJvM2lSPn6w",
        durationLabel: "11:31",
      },
      alternateVideos: [
        {
          title: "Next.js Patterns: Authentication (Best Practices for Server Components, Actions, Middleware)",
          channel: "Delba",
          url: "https://www.youtube.com/watch?v=N_sUsq_y10U",
          videoId: "N_sUsq_y10U",
          durationLabel: "12:14",
        },
        {
          title: "Ultimate Next.js Auth Guide: Auth.js + Prisma + OAuth & Credentials (2025)",
          channel: "Code Genix",
          url: "https://www.youtube.com/watch?v=0NTUIdUljwM",
          videoId: "0NTUIdUljwM",
          durationLabel: "53:23",
        },
        {
          title: "Better Auth in Next.js (Complete Tutorial)",
          channel: "Cosden Solutions",
          url: "https://www.youtube.com/watch?v=x4hQ2Hmuy3k",
          videoId: "x4hQ2Hmuy3k",
          durationLabel: "35:35",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "fsnext-auth-q1",
          prompt: "A team starts a Next.js 16 App Router project in September 2026 and asks for \"NextAuth v5\". Which statement is accurate?",
          options: [
            "`next-auth` v5 is still published as a beta (`npm install next-auth@beta`), npm's `latest` is v4, and Auth.js is now maintained by the Better Auth team, who recommend Better Auth for new projects",
            "`next-auth` v5 became the stable `latest` release in 2025",
            "Auth.js was discontinued and no longer receives security patches",
            "NextAuth v5 only supports the Pages Router",
          ],
          correctIndex: 0,
          explanation:
            "The npm dist-tags still show v5 under `beta`. The Better Auth announcement says existing Auth.js users can carry on with security patches, while new projects should start on Better Auth unless they need a specific missing feature.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-auth-q2",
          prompt: "Which requirements push you toward database sessions instead of Auth.js's JWT strategy? (Select all that apply.)",
          options: [
            "An admin must be able to revoke a user's session immediately",
            "Users want to see their other signed-in devices and sign them out",
            "A role change must take effect on the user's very next request",
            "You want to avoid a database lookup on every request",
            "The app has no database at all",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A JWT stays valid until it expires and carries a snapshot of the user, so revocation, device management and instant role changes all need server-side session state. Avoiding per-request lookups, or having no database, is the case for JWTs.",
        },
        {
          id: "fsnext-auth-q3",
          prompt:
            "`proxy.ts` decodes the session cookie and redirects anonymous users away from `/dashboard/*`. Why should the dashboard's data loaders and actions still verify the session themselves?",
          options: [
            "Proxy is an optimistic pre-filter: matchers change and skip paths, Server Actions are POSTs to whatever route uses them, and a bypass like CVE-2025-29927 on self-hosted apps removes the only gate",
            "Proxy can't read cookies in Next.js 16",
            "Proxy only runs in development",
            "Data loaders run before Proxy, so its redirect arrives too late",
          ],
          correctIndex: 0,
          explanation:
            "Next.js's docs describe Proxy checks as optimistic and put real authorization next to the data. CVE-2025-29927 let a crafted `x-middleware-subrequest` header skip middleware on `next start` and standalone deployments until 14.2.25 and 15.2.3 patched it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-auth-q4",
          prompt:
            "The dashboard's `layout.tsx` calls `auth()` and redirects when there's no session. The pages beneath it fetch sensitive data without checking. What's the flaw?",
          options: [
            "Layouts don't re-render on client-side navigation and don't stop nested segments or Server Actions from running, so pages and actions need their own checks, ideally in the data layer",
            "`redirect()` can't be called from a layout",
            "Layouts only run at build time",
            "There's no flaw: a layout wraps every request to its children",
          ],
          correctIndex: 0,
          explanation:
            "Partial rendering keeps layouts mounted across navigations, and the router still renders child segments (and their RSC payload) regardless of what the layout does. Checking in the data access layer protects every entry point at once.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-auth-q5",
          prompt: "Why do Next.js's docs and most auth libraries set the session cookie with `SameSite=Lax` rather than `Strict`?",
          options: [
            "With `Strict`, a user who follows a link from email or another site arrives without the cookie and looks logged out on that first page; `Lax` still blocks cross-site subrequests and POSTs",
            "`Strict` cookies can't also be `HttpOnly`",
            "Browsers require `Lax` for cookies sent over HTTPS",
            "Browsers reject `Strict` cookies larger than 1 KB",
          ],
          correctIndex: 0,
          explanation:
            "`Lax` sends the cookie on top-level GET navigations from other sites but not on cross-site `fetch`, iframes or form POSTs, which covers most CSRF. `Strict` is safer but breaks inbound links.",
        },
        {
          id: "fsnext-auth-q6",
          prompt: "An app puts each user's roles and 200 permission strings into the Auth.js JWT. Which problems follow? (Select all that apply.)",
          options: [
            "The cookie grows past the ~4 KB limit, so it's split into several chunk cookies sent with every request",
            "Permission changes don't take effect until the token is reissued",
            "Any script on the page can read the permissions from the cookie",
            "Auth.js stops encrypting tokens larger than 4 KB",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Auth.js chunks oversized session cookies, but they still ride along on every request, and the token is a snapshot until it's refreshed. The cookie is `HttpOnly` and encrypted regardless of size, so page scripts can't read it.",
        },
        {
          id: "fsnext-auth-q7",
          prompt: "Using the JWT strategy, you replace `AUTH_SECRET` in production with a new value. What happens to existing sessions?",
          options: [
            "Existing session cookies can no longer be decrypted, so every user is effectively signed out",
            "Nothing: the secret only signs OAuth state parameters",
            "Sessions keep working until they expire naturally",
            "Users are prompted to confirm the new secret",
          ],
          correctIndex: 0,
          explanation:
            "`AUTH_SECRET` encrypts the session token itself, so tokens issued under the old secret become unreadable. Plan secret changes like any key rotation, and keep the value identical everywhere tokens must be shared, such as a stable auth deployment and its previews.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-auth-q8",
          prompt:
            "Preview deployments get URLs like `https://myapp-git-feature-x.vercel.app`, and GitHub sign-in fails there with a redirect URI mismatch. What's Auth.js's intended fix?",
          options: [
            "Point the provider's callback at one stable deployment and set `AUTH_REDIRECT_PROXY_URL` in the preview and stable environments, with the same `AUTH_SECRET`, so the stable host sends users back to the preview",
            "Register a wildcard callback such as `https://*.vercel.app/api/auth/callback/github` with GitHub",
            "Set `AUTH_TRUST_HOST=false` on preview deployments",
            "Remove `AUTH_SECRET` from previews so OAuth is skipped",
          ],
          correctIndex: 0,
          explanation:
            "Most providers accept only fixed callback URLs. Auth.js's redirect proxy stores the preview URL in the OAuth `state` parameter, lets the provider call the stable URL, and bounces the user back after verifying `state` with the shared secret.",
        },
        {
          id: "fsnext-auth-q9",
          prompt:
            "The settings page is protected by `proxy.ts`, and the page itself calls `auth()`. Its form calls `updateEmail(formData)`, a Server Action that reads `userId` from a hidden input and never checks the session. Can an attacker change another user's email?",
          options: [
            "Yes: the action is its own POST endpoint, so it must call `auth()` and take the user from the session, not from the form",
            "No: Server Actions inherit the authentication of the page that renders them",
            "No: Proxy already checked the session cookie for that path, which is sufficient",
            "No: action IDs are encrypted, so attackers can't find or call them",
          ],
          correctIndex: 0,
          explanation:
            "Anyone signed in can POST the action with someone else's `userId`, and the action ID is in the client bundle for anyone who loads the page. Identity must come from the session inside the action.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-auth-q10",
          prompt:
            "With Cache Components enabled, what happens here, and what's the right shape?\n\n```ts\nasync function getMyInvoices() {\n  \"use cache\";\n  const session = await auth(); // reads cookies()\n  return db.invoice.findMany({ where: { ownerId: session.user.id } });\n}\n```",
          options: [
            "Reading cookies inside a plain `\"use cache\"` function throws; resolve the session outside and pass the user ID in, so it becomes part of the cache key (or use `\"use cache: private\"`)",
            "It works and automatically caches each user's invoices separately",
            "It works but serves the first user's invoices to everyone",
            "`\"use cache\"` is ignored inside async functions",
          ],
          correctIndex: 0,
          explanation:
            "A shared cache entry can't depend on request data it doesn't know about, so Next.js forbids `cookies()` and `headers()` inside plain `\"use cache\"`. Arguments become part of the cache key, which is how per-user results stay separate.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-auth-q11",
          prompt:
            "Now that `proxy.ts` runs on the Node.js runtime in Next.js 16, should it query the sessions table on every request to validate database sessions?",
          options: [
            "Avoid it: Proxy runs on every matched request, prefetches included, so keep it to cookie-only optimistic checks and do database-backed checks in the data layer",
            "Yes: it's the recommended single place for authorization",
            "It can't: Proxy still runs on the Edge runtime, which has no TCP sockets",
            "Yes, but only for statically rendered routes",
          ],
          correctIndex: 0,
          explanation:
            "The Node.js runtime removed the old technical barrier (Auth.js notes its split edge config may no longer be necessary), but not the cost: a database round trip on every prefetch and asset request that matches. Next.js's auth guide recommends cookie-only checks in Proxy.",
        },
        {
          id: "fsnext-auth-q12",
          prompt: "Which check stops signed-in user A from reading user B's invoice at `/invoices/[id]`?",
          options: [
            "The data layer queries with `where: { id, ownerId: session.user.id }` (or checks ownership) and returns `notFound()` otherwise",
            "`proxy.ts` confirming that the user is signed in",
            "Using UUIDs so invoice IDs can't be guessed",
            "Rendering the page dynamically so it isn't cached across users",
          ],
          correctIndex: 0,
          explanation:
            "This is an insecure direct object reference (IDOR): authentication proves who the user is, not what they may read. Unguessable IDs reduce discovery but leak through URLs, logs and referrers, so ownership has to be checked on every read.",
        },
      ],
    },
    {
      id: "fsnext-vercel-deploy",
      moduleId: "fs-nextjs",
      trackId: "fullstack",
      title: "Monolithic Deployment on Vercel",
      summary:
        "Deploying a full-stack Next.js app to Vercel collapses frontend, API and rendering into one Git-driven deploy: static assets go to the CDN, while Server Components, Server Actions, Route Handlers and `proxy.ts` run as Vercel Functions. There's no separate backend to host, but you inherit a function's limits. Request and response bodies are capped at 4.5 MB; invocations have a maximum duration (300 seconds by default with Fluid compute) and return `504` beyond it; functions run in one region, `iad1` by default, which you should pin next to your database; and long-running, stateful or socket-bound work doesn't belong in a request handler. Use `after()` for work that should finish after the response.\n\nEnvironments are the other half. Every deployment is Production, Preview (each non-production branch or pull request) or Development, and each environment variable is scoped to some of them, with branch-specific preview overrides. Changes apply only to new deployments. `NEXT_PUBLIC_*` values are inlined into the client bundle at build time, so they're public and frozen per build, and variables needed while prerendering must exist in the build's environment too. Preview builds run with `NODE_ENV=production`, so use `VERCEL_ENV` to tell preview from production, and keep previews off the production database.\n\nConnections are where monoliths fall over. Fluid compute, the default for new projects since April 2025, lets one instance serve many concurrent requests and reuses warm instances, so a module-scope pool registered with `attachDatabasePool` works well; without a pooler, a traffic spike still multiplies instances by pool size until the database refuses connections. Vercel's egress IPs are dynamic unless you pay for static IPs, which matters for allow-listed databases like Atlas. And each deploy changes Server Action IDs, so tabs left open on the old build can fail until they reload.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Vercel: Environment variables", url: "https://vercel.com/docs/environment-variables", kind: "docs" },
        { label: "Vercel: Fluid compute", url: "https://vercel.com/docs/fluid-compute", kind: "docs" },
        { label: "Next.js: Environment Variables", url: "https://nextjs.org/docs/app/guides/environment-variables", kind: "docs" },
        { label: "Vercel: System environment variables", url: "https://vercel.com/docs/environment-variables/system-environment-variables", kind: "docs" },
      ],
      video: {
        title: "Next.js React Framework Course – Build and Deploy a Full Stack App From scratch",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=KjY94sAKLlw",
        videoId: "KjY94sAKLlw",
        durationLabel: "4:47:36",
        startSeconds: 16140,
        chapterLabel: "Deploy the APP in Vercel",
      },
      alternateVideos: [
        {
          title: "Environments on Vercel",
          channel: "Vercel",
          url: "https://www.youtube.com/watch?v=nZrAgov_-D8",
          videoId: "nZrAgov_-D8",
          durationLabel: "11:34",
        },
        {
          title: "Deploying a backend on Vercel (APIs and Functions)",
          channel: "Vercel",
          url: "https://www.youtube.com/watch?v=yLMODEUPJdU",
          videoId: "yLMODEUPJdU",
          durationLabel: "4:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "fsnext-vercel-deploy-q1",
          prompt:
            "You rotate `STRIPE_SECRET_KEY` in the Vercel dashboard's Production environment. Ten minutes later, production still uses the old key. Why?",
          options: [
            "Environment variable changes apply only to new deployments; redeploy production to pick up the new value",
            "Vercel caches environment variables for 24 hours",
            "Secrets must be prefixed with `NEXT_PUBLIC_` to be read at runtime",
            "Production reads variables only from `.env.production` in the repository",
          ],
          correctIndex: 0,
          explanation:
            "Each deployment is an immutable snapshot of code plus configuration, so existing deployments keep the values they were built and started with. Vercel documents a rotation flow that overlaps old and new credentials to avoid downtime.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-vercel-deploy-q2",
          prompt:
            "In production this key is `undefined` in the browser, even though `NEXT_PUBLIC_MAPS_KEY` is set on Vercel. Why?\n\n```tsx\n\"use client\";\nconst name = \"NEXT_PUBLIC_MAPS_KEY\";\n\nexport function Map() {\n  const apiKey = process.env[name];\n  // ...\n}\n```",
          options: [
            "Next.js inlines `NEXT_PUBLIC_` values at build time only for literal `process.env.NEXT_PUBLIC_...` accesses; dynamic lookups aren't replaced",
            "Client Components can't read environment variables at all",
            "`NEXT_PUBLIC_` variables are only available in Route Handlers",
            "The variable must also be listed in `next.config.js` under `env`",
          ],
          correctIndex: 0,
          explanation:
            "There's no `process.env` in the browser; the build replaces each literal reference with the string value. A computed key, or destructuring `process.env`, leaves nothing for the build to replace.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-vercel-deploy-q3",
          prompt:
            "Analytics initialises only when `process.env.NODE_ENV === \"production\"`, yet preview deployments are polluting production analytics. Why?",
          options: [
            "Next.js sets `NODE_ENV=production` for every command except `next dev`, previews included; gate on `VERCEL_ENV === \"production\"` instead",
            "Vercel sets `NODE_ENV=preview` but analytics libraries ignore it",
            "Preview deployments share the production deployment's runtime",
            "`NODE_ENV` is only defined in the browser",
          ],
          correctIndex: 0,
          explanation:
            "`NODE_ENV` describes the build mode (optimized or not), not the deployment environment. `VERCEL_ENV` is `production`, `preview` or `development` and is available at build time and runtime.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-vercel-deploy-q4",
          prompt: "Which of these don't fit inside a Vercel Function request handler as-is? (Select all that apply.)",
          options: [
            "Accepting 50 MB video uploads in a Route Handler's request body",
            "A 20-minute transcode on the Hobby plan",
            "A background loop started at module load that polls a queue forever",
            "Accepting a 2 MB JSON body in a Route Handler",
            "A Server Component that runs three database queries",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Bodies over 4.5 MB are rejected, Hobby functions stop at 300 seconds, and instances are suspended or recycled when idle, so perpetual loops don't survive. A 2 MB body and a few queries are well within limits (though a 2 MB Server Action would hit Next.js's 1 MB default body limit).",
        },
        {
          id: "fsnext-vercel-deploy-q5",
          prompt:
            "Functions run in `iad1` (Washington, D.C.), the Vercel default, while the Postgres database lives in Frankfurt. A page runs six sequential queries. What happens, and what's the fix?",
          options: [
            "Each query pays a transatlantic round trip (roughly 90 ms), adding about half a second; set the function region next to the database",
            "Vercel automatically runs each query from the region closest to the database",
            "Nothing: the CDN caches database queries",
            "The queries run in parallel automatically, so only one round trip is paid",
          ],
          correctIndex: 0,
          explanation:
            "Latency between compute and data multiplies with every sequential round trip, which is why co-locating the function region with the database matters more than being close to users for data-heavy pages. Parallelizing independent queries helps too.",
        },
        {
          id: "fsnext-vercel-deploy-q6",
          prompt:
            "Right after a deploy, users who kept a tab open see \"Failed to find Server Action\" when they submit a form. Why?",
          options: [
            "Action IDs are part of each build and change on new deployments, so the old page references IDs the new deployment doesn't have; skew protection and a refresh-and-retry path soften it",
            "Server Actions are disabled for 10 minutes after each deploy",
            "The form's CSRF token expired",
            "The browser cached the Server Action's response",
          ],
          correctIndex: 0,
          explanation:
            "Next.js rotates action IDs between builds (at most every 14 days even without changes). Skew protection keeps old clients talking to the deployment they loaded, and the error should surface as a reload path rather than a dead end.",
        },
        {
          id: "fsnext-vercel-deploy-q7",
          prompt: "With Fluid compute, the default for new Vercel projects since April 2025, which statements are true? (Select all that apply.)",
          options: [
            "A single function instance can serve multiple requests concurrently",
            "Module-scope state, such as a connection pool, is shared by concurrent requests on the same instance",
            "Bytecode caching reduces cold starts on production deployments",
            "Each request gets a fresh microVM, so globals never leak between requests",
            "An unhandled error in one request crashes every other request on that instance",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Fluid compute trades per-invocation isolation for server-like concurrency, which is why pools work and why module-scope mutable state needs care. Vercel lets in-flight requests finish before stopping a process after an unhandled error, and bytecode caching applies to production only.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-vercel-deploy-q8",
          prompt:
            "A marketing email sends 20,000 users to the site within a minute, and Postgres starts refusing connections. Each instance creates a `pg` pool with `max: 10`, and there's no pooler. Which change addresses the root cause?",
          options: [
            "Put a connection pooler (PgBouncer, Supavisor or the provider's pooled endpoint) in front of Postgres and keep instances × pool size under the database limit",
            "Increase the functions' memory size",
            "Switch the routes to the Edge runtime",
            "Raise `maxDuration` so requests can wait longer for a connection",
          ],
          correctIndex: 0,
          explanation:
            "Connection demand scales with instance count, and a spike scales instances. A pooler multiplexes many client connections onto a bounded set of server connections; memory and duration settings don't change the count.",
        },
        {
          id: "fsnext-vercel-deploy-q9",
          prompt:
            "A page is statically prerendered and queries the database during `next build`. Production builds succeed, but preview builds fail with \"DATABASE_URL is not defined\". Why?",
          options: [
            "The variable is scoped to Production only, and the build step needs it wherever prerendering touches the database; add a Preview-scoped value pointing at a non-production database",
            "Preview builds never get environment variables",
            "Prerendering is disabled on preview deployments",
            "Build-time variables must be prefixed with `NEXT_PUBLIC_`",
          ],
          correctIndex: 0,
          explanation:
            "Vercel exposes a deployment's environment variables to both its build and its functions. Prerendering executes your data code during the build, so the preview build needs its own scoped value.",
        },
        {
          id: "fsnext-vercel-deploy-q10",
          prompt:
            "The app on Vercel uses MongoDB Atlas, which only accepts connections from its IP access list. What's true?",
          options: [
            "Vercel deployments use dynamic egress IPs by default, so you need a paid static IP or private networking option, or you fall back to allowing `0.0.0.0/0` with strong credentials",
            "Vercel Functions always egress from one fixed IP per project",
            "Atlas automatically trusts all Vercel IP ranges",
            "The IP access list only applies to the Atlas UI, not to drivers",
          ],
          correctIndex: 0,
          explanation:
            "Vercel's knowledge base says deployments use dynamic IPs unless you add Static IPs or Secure Compute. Atlas enforces the access list on every client connection, so there's no way around choosing one of these options.",
        },
        {
          id: "fsnext-vercel-deploy-q11",
          prompt:
            "A Server Action returns immediately and fires `logAnalytics(event)` without awaiting it. Events go missing in production. Why, and what's the fix?",
          options: [
            "The function can be suspended once the response is sent, so un-awaited work may never finish; schedule it with `after()` from `next/server` (or `waitUntil`)",
            "Server Actions cancel every pending promise when they return",
            "Outgoing requests from functions are blocked by CORS",
            "Vercel drops analytics requests made from Server Actions",
          ],
          correctIndex: 0,
          explanation:
            "Serverless platforms don't promise to keep running after the response unless told to. `after()` works in Server Components, Server Functions, Route Handlers and Proxy and keeps the invocation alive (within its max duration) for the callback.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsnext-vercel-deploy-q12",
          prompt:
            "Password-reset emails sent from production link to `https://myapp-4f2a1c-team.vercel.app/reset?...` instead of `https://myapp.com/reset?...`. The code builds links from `process.env.VERCEL_URL`. What's the fix?",
          options: [
            "Use `VERCEL_PROJECT_PRODUCTION_URL` (the project's production domain) or your own canonical `APP_URL` variable; `VERCEL_URL` is the generated URL of the individual deployment",
            "Prefix the variable with `NEXT_PUBLIC_` so it resolves to the custom domain",
            "Set `VERCEL_URL` manually in the dashboard to override it",
            "Add `https://myapp.com` to the `images.domains` config",
          ],
          correctIndex: 0,
          explanation:
            "`VERCEL_URL` is the unique `*.vercel.app` host of each deployment (without the protocol). `VERCEL_PROJECT_PRODUCTION_URL` picks the shortest production custom domain and is set even on previews, which makes it right for canonical links and OG images.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
  ],
} satisfies Module;
