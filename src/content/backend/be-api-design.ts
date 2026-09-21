import type { Module } from "@/types/curriculum";

// ---- Test data for the keyset pagination challenge ----
const pagePosts = [
  { id: 3, createdAt: 2000 },
  { id: 7, createdAt: 4000 },
  { id: 1, createdAt: 1000 },
  { id: 5, createdAt: 3000 },
  { id: 2, createdAt: 2000 },
  { id: 6, createdAt: 3000 },
  { id: 4, createdAt: 3000 },
];
const manyPosts = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, createdAt: Math.floor((i + 1) / 3) }));
const nextPage = { op: "page" };

// ---- Test data for the idempotency-key challenge ----
const idemConfig = { ttlMs: 86400000, lockTimeoutMs: 30000 };
const chargeInr = { amount: 5000, currency: "inr", customer: "cus_42" };
const chargeCreated = { status: 201, body: { id: "pay_1", amount: 5000, status: "succeeded" } };
const EXECUTE = { action: "execute" };

// ---- Test data for the GraphQL query-analysis challenge ----
type GqlSelection = { field?: string; alias?: string; args?: Record<string, number>; selections?: GqlSelection[]; spread?: string };
const gf = (field: string, rest: Omit<GqlSelection, "field"> = {}): GqlSelection => ({ field, ...rest });
const gqlSchema = {
  Query: { viewer: { type: "User" }, repository: { type: "Repository" }, search: { type: "Repository", list: true } },
  User: {
    login: { type: "String" },
    name: { type: "String" },
    repositories: { type: "Repository", list: true },
    followers: { type: "User", list: true },
  },
  Repository: { name: { type: "String" }, stars: { type: "Int" }, owner: { type: "User" }, issues: { type: "Issue", list: true } },
  Issue: { title: { type: "String" }, author: { type: "User" }, comments: { type: "Comment", list: true } },
  Comment: { body: { type: "String" }, author: { type: "User" } },
};
const gqlLimits = { maxDepth: 6, maxCost: 5000 };

export default {
  id: "be-api-design",
  trackId: "backend",
  name: "API Design",
  description:
    "Designing APIs that clients can depend on for years: resource modeling, status codes and versioning, pagination, idempotency, GraphQL schemas and execution cost, OpenAPI contracts, webhooks, and choosing between REST and GraphQL. Written against RFC 9110, RFC 9457, OpenAPI 3.2 and the September 2025 GraphQL specification.",
  refs: [
    { label: "roadmap.sh: API Design", url: "https://roadmap.sh/api-design", kind: "docs" },
    { label: "GraphQL: Learn", url: "https://graphql.org/learn/", kind: "docs" },
    { label: "RFC 9110: HTTP Semantics", url: "https://www.rfc-editor.org/rfc/rfc9110.html", kind: "spec" },
    { label: "OpenAPI Specification v3.2.1", url: "https://spec.openapis.org/oas/v3.2.1.html", kind: "spec" },
  ],
  topics: [
    {
      id: "api-rest-resource-design",
      moduleId: "be-api-design",
      trackId: "backend",
      title: "REST Resource Design & Versioning",
      summary:
        "Good REST design makes an API predictable enough that clients can guess it and evolvable enough that you rarely break them. Model nouns as resources (`/orders`, `/orders/{id}`, `/orders/{id}/items`) and let RFC 9110's method semantics carry the verbs: GET is safe, PUT replaces the whole representation and is idempotent, PATCH applies a partial change and isn't guaranteed to be, DELETE is idempotent. Operations that aren't CRUD are often best modeled as resources too (`POST /orders/{id}/cancellation`), rather than verbs in the URL or a DELETE that destroys history.\n\nStatus codes are a contract that SDKs, proxies and retry logic rely on. Creation returns `201 Created` with a `Location` header; long-running work returns `202 Accepted` and a status resource to poll. `401` means missing or invalid credentials and must carry `WWW-Authenticate`; `403` means authenticated but not allowed; `409` signals a state conflict; `422` a well-formed but invalid body. Use one machine-readable error format, RFC 9457 Problem Details (`application/problem+json`), instead of ad hoc JSON. For concurrent edits, return an `ETag` and require `If-Match` on writes: a stale update gets `412 Precondition Failed` instead of silently overwriting someone else's change, and `428 Precondition Required` tells clients that forgot the header.\n\nVersioning is a last resort. Additive changes (new optional fields, new endpoints) are compatible only if clients ignore what they don't know; removing or renaming fields, changing types, tightening validation, or adding enum values that strict clients can't handle all break someone. When you must break, `/v2` URLs are visible and easy to route, header versions keep URLs stable, and Stripe's dated versions pin each account and translate responses through version-change modules. Announce retirement with the `Deprecation` (RFC 9745) and `Sunset` (RFC 8594) headers, and watch who still calls the old version.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "RFC 9110: HTTP Semantics (methods and status codes)", url: "https://www.rfc-editor.org/rfc/rfc9110.html", kind: "spec" },
        { label: "RFC 9457: Problem Details for HTTP APIs", url: "https://www.rfc-editor.org/rfc/rfc9457.html", kind: "spec" },
        { label: "Stripe: APIs as infrastructure: future-proofing Stripe with versioning", url: "https://stripe.com/blog/api-versioning", kind: "article" },
        { label: "Google AIP-180: Backwards compatibility", url: "https://google.aip.dev/180", kind: "docs" },
      ],
      video: {
        title: "Deep Dive into REST API Design and Implementation Best Practices",
        channel: "Software Developer Diaries",
        url: "https://www.youtube.com/watch?v=7nm1pYuKAhY",
        videoId: "7nm1pYuKAhY",
        durationLabel: "12:01",
      },
      alternateVideos: [
        {
          title: "API Design in System Design Interviews w/ Meta Staff Engineer",
          channel: "Hello Interview",
          url: "https://www.youtube.com/watch?v=DQ57zYedMdQ",
          videoId: "DQ57zYedMdQ",
          durationLabel: "28:40",
          startSeconds: 239,
          chapterLabel: "REST",
        },
        {
          title: "Good APIs Vs Bad APIs: 7 Tips for API Design",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=_gQaygjm_hg",
          videoId: "_gQaygjm_hg",
          durationLabel: "5:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "api-rest-resource-design-q1",
          prompt:
            "A request arrives with an expired access token for an endpoint the user is normally allowed to call. Which response fits RFC 9110 and helps the client recover?",
          options: [
            "`401 Unauthorized` with a `WWW-Authenticate` header (for example `Bearer error=\"invalid_token\"`), so the client knows to refresh",
            "`403 Forbidden`, because the server refuses to act on an expired token",
            "`400 Bad Request`, because an expired token makes the request malformed",
            "`419 Authentication Timeout`, the status code reserved for expired sessions",
          ],
          correctIndex: 0,
          explanation:
            "401 means the credentials are missing or invalid, and RFC 9110 requires a `WWW-Authenticate` challenge with it; RFC 6750 defines the `invalid_token` error for bearer tokens. 403 is for valid credentials that lack permission, and 419 isn't a standard code.",
        },
        {
          id: "api-rest-resource-design-q2",
          prompt: "What should a successful `POST /orders` that creates order 981 return?",
          options: [
            "`201 Created` with `Location: /orders/981` (and usually the new representation)",
            "`200 OK` with the order ID in the body only",
            "`204 No Content`, since the client already knows what it sent",
            "`302 Found` redirecting to `/orders/981`",
          ],
          correctIndex: 0,
          explanation:
            "201 plus `Location` tells every client and tool where the new resource lives. 200 works but loses that signal, 204 hides the server-assigned ID, and a redirect makes clients issue a second request.",
        },
        {
          id: "api-rest-resource-design-q3",
          prompt: "`POST /reports` starts an export that takes about ten minutes. What's the idiomatic response?",
          options: [
            "`202 Accepted` with a link (for example `Location`) to a status resource the client can poll",
            "Hold the connection open for ten minutes and return `200 OK` with the file",
            "`201 Created` pointing at the finished file, even though it doesn't exist yet",
            "`102 Processing` until the export finishes",
          ],
          correctIndex: 0,
          explanation:
            "202 is deliberately noncommittal: the work was accepted, not completed. A status resource (or a webhook) reports progress and the result. Long-held requests hit proxy timeouts, and 102 is an obsolete WebDAV interim response.",
        },
        {
          id: "api-rest-resource-design-q4",
          prompt: "Which of these changes are breaking for existing clients of a JSON API? (Select all that apply.)",
          options: [
            "Renaming the response field `total` to `amount`",
            "Making a previously optional request field required",
            "Changing `amount` from a number to a string",
            "Adding a new optional field to a response",
            "Adding a new endpoint",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Removing or renaming, tightening input rules and changing types all break correct existing clients. Additive changes are safe as long as clients ignore unknown fields, which is worth stating explicitly in your API guidelines.",
        },
        {
          id: "api-rest-resource-design-q5",
          prompt: "You add a new value, `\"disputed\"`, to the `status` enum that `GET /payments/{id}` returns. Is that a breaking change?",
          options: [
            "It can be: typed clients with exhaustive switches may crash on the new value, so document response enums as extensible",
            "No: adding a value is purely additive, so every existing client keeps working unchanged",
            "Only if the same enum is also accepted in request bodies, where older servers would reject it",
            "Yes, always, and it requires publishing a new major version of the API",
          ],
          correctIndex: 0,
          explanation:
            "Output enums are a classic source of \"compatible\" changes that break typed clients. Google's AIP-180 allows adding values but warns that user code may not handle them gracefully, and asks APIs to document response enums that are expected to grow. Enums used only in requests are the safe case, not the risky one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-rest-resource-design-q6",
          prompt:
            "The stored customer has `\"tags\": [\"new\", \"eu\"]`. Which of these PATCH bodies are NOT idempotent, meaning applying them twice leaves a different state than applying them once? (Select all that apply.)",
          options: [
            "JSON Patch `[{ \"op\": \"add\", \"path\": \"/tags/-\", \"value\": \"vip\" }]`",
            "JSON Patch `[{ \"op\": \"remove\", \"path\": \"/tags/0\" }]`",
            "JSON Merge Patch `{ \"status\": \"active\" }`",
            "JSON Patch `[{ \"op\": \"replace\", \"path\": \"/email\", \"value\": \"a@b.co\" }]`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Appending with `/-` adds another `vip` each time, and removing index 0 removes a different element on the second run. Setting a field to a fixed value is idempotent. That's why RFC 5789 says PATCH isn't guaranteed to be idempotent, and why clients shouldn't blindly retry it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-rest-resource-design-q7",
          prompt: "Two admins open the same product and both save changes. How do you stop the second save from silently overwriting the first?",
          options: [
            "Return an `ETag` on GET, require `If-Match` with it on PUT or PATCH, and answer `412 Precondition Failed` when it no longer matches",
            "Lock the product row for the whole time an admin has the edit page open",
            "Let the last write win, and log both versions so they can be reconciled later",
            "Return `409 Conflict` for any second write to the same product within a minute",
          ],
          correctIndex: 0,
          explanation:
            "Optimistic concurrency with validators is HTTP's built-in answer to the lost update problem. Long-held locks don't survive closed tabs, and last-write-wins is exactly the bug being prevented.",
        },
        {
          id: "api-rest-resource-design-q8",
          prompt: "Your API requires conditional updates. A `PUT /products/7` arrives without an `If-Match` header. Which status code says exactly that?",
          options: ["`428 Precondition Required`", "`412 Precondition Failed`", "`400 Bad Request`", "`409 Conflict`"],
          correctIndex: 0,
          explanation:
            "RFC 6585 defines 428 for \"this request must be conditional\". 412 means a precondition was sent and evaluated false, which isn't the case when there's no precondition at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-rest-resource-design-q9",
          prompt: "Which error response follows RFC 9457 (Problem Details for HTTP APIs)?",
          options: [
            "`Content-Type: application/problem+json` with members such as `type`, `title`, `status`, `detail` and `instance`",
            "`Content-Type: application/json` with `{ \"error\": true, \"message\": \"...\" }`",
            "`Content-Type: text/plain` with a human-readable message",
            "`200 OK` with `{ \"success\": false }`",
          ],
          correctIndex: 0,
          explanation:
            "RFC 9457 (which obsoletes RFC 7807) standardizes a machine-readable error shape; `type` is a URI identifying the problem kind, and extensions such as `errors` for field validation are allowed. Returning 200 for failures breaks every HTTP-aware client and monitor.",
        },
        {
          id: "api-rest-resource-design-q10",
          prompt: "How does Stripe's date-based versioning avoid maintaining a separate copy of the API for every version?",
          options: [
            "The code always produces the latest version, and responses pass back through version-change modules until they match the account's pinned version",
            "Each version is a separate deployment, and a router sends each account's traffic to its pinned build",
            "Old versions are frozen snapshots that receive no new features or bug fixes",
            "Every client must upgrade within 30 days of a new version, so only two versions ever exist at once",
          ],
          correctIndex: 0,
          explanation:
            "Stripe describes encapsulating each backward-incompatible change in a module with a transformation, applied backwards from the current version. That keeps one code path while letting integrations upgrade on their own schedule.",
        },
        {
          id: "api-rest-resource-design-q11",
          prompt: "An order can be cancelled but must stay on record for accounting. Which design fits REST best?",
          options: [
            "`POST /orders/7/cancellation` (or a PATCH that moves `status` to `cancelled` under the server's rules)",
            "`DELETE /orders/7`, with the server soft-deleting the row behind the scenes",
            "`POST /cancelOrder` with `{ \"id\": 7 }`, an action endpoint shared by all resources",
            "`PUT /orders/7/cancel` with an empty body, since PUT is safe to retry",
          ],
          correctIndex: 0,
          explanation:
            "Cancellation is a state transition with its own rules, so model it as a resource or a status change. DELETE says the resource is gone, which contradicts keeping it, and an RPC-style verb endpoint abandons the resource model.",
        },
        {
          id: "api-rest-resource-design-q12",
          prompt: "You're retiring `/v1/invoices`. What do the `Deprecation` and `Sunset` response headers tell clients?",
          options: [
            "`Deprecation` (RFC 9745) says the resource is or will be deprecated; `Sunset` (RFC 8594) says when it's expected to stop responding",
            "Both make clients receive `410 Gone` immediately, even before the sunset date",
            "`Sunset` means the endpoint is new; `Deprecation` means it's stable",
            "They're informational comments for API gateways and are never sent to clients",
          ],
          correctIndex: 0,
          explanation:
            "The two headers split \"don't build on this\" from \"this goes away on date X\", and a `Link` with `rel=\"deprecation\"` can point to migration docs. Pair them with usage metrics so you know who still calls v1 before the date.",
        },
      ],
    },
    {
      id: "api-pagination-filtering-sorting",
      moduleId: "be-api-design",
      trackId: "backend",
      title: "Pagination, Filtering & Sorting Patterns",
      summary:
        "Any collection endpoint without a maximum page size is a denial-of-service waiting to happen, so pagination is a requirement, not a nicety. Offset pagination (`?limit=20&offset=4000`) is simple and lets users jump to page N, but the database still walks and discards every skipped row, so deep pages get linearly slower. It also drifts: when rows are inserted or deleted between requests, items shift across page boundaries, and clients see duplicates or silently miss records.\n\nKeyset (seek, or cursor) pagination remembers where the last page ended and asks for rows after it: `WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 21`. With an index on `(created_at, id)`, every page costs the same, and inserts elsewhere don't shift the window. The sort must be total, so add a unique tie-breaker such as `id`; with `created_at` alone, rows sharing a timestamp get skipped or repeated at page boundaries. Fetch `limit + 1` rows to learn whether another page exists without a `COUNT(*)`, which is itself expensive on big tables. Wrap the position in an opaque cursor (base64 of the sort key) so clients neither build nor depend on it, and validate it on the way in, because a cursor is user input. The costs: no random access to page 37, and a cursor only makes sense for the sort and filters it was created with.\n\nFiltering and sorting need the same discipline. Accept an allow-list of filterable and sortable fields (`?status=paid&sort=-created_at`) that map to indexed columns, reject unknown ones with `400` instead of silently ignoring them, cap `limit` on the server, and never interpolate a client-supplied sort field into SQL. Stripe's `starting_after` and GraphQL's Relay connection spec (`edges`, `pageInfo`, `endCursor`) are the same idea.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Google AIP-158: Pagination", url: "https://google.aip.dev/158", kind: "docs" },
        { label: "Use The Index, Luke: We need tool support for keyset pagination", url: "https://use-the-index-luke.com/no-offset", kind: "article" },
        { label: "Slack Engineering: Evolving API Pagination at Slack", url: "https://slack.engineering/evolving-api-pagination-at-slack/", kind: "article" },
        { label: "GraphQL Cursor Connections Specification (Relay)", url: "https://relay.dev/graphql/connections.htm", kind: "spec" },
      ],
      video: {
        title: "Pagination in MySQL - offset vs. cursor",
        channel: "PlanetScale",
        url: "https://www.youtube.com/watch?v=zwDIN04lIpc",
        videoId: "zwDIN04lIpc",
        durationLabel: "13:19",
      },
      alternateVideos: [
        {
          title: "API Pagination: Making Billions of Products Scrolling Possible",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=14K_a2kKTxU",
          videoId: "14K_a2kKTxU",
          durationLabel: "3:12",
        },
        {
          title: "API Pagination - Offset and Cursor Pagination Explained - Backend Engineering",
          channel: "Caleb Curry",
          url: "https://www.youtube.com/watch?v=mvlzhBgGS4s",
          videoId: "mvlzhBgGS4s",
          durationLabel: "25:46",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `getPage(rows, { limit, cursor })`: keyset pagination over an in-memory table, newest first. `rows` is the whole table in no particular order, as `{ id, createdAt }` objects; `id` is a unique integer and `createdAt` a number of milliseconds, and timestamps can repeat.\n\n- Order rows by `createdAt` descending, then `id` descending, so the order is total even when timestamps tie. Don't mutate `rows`.\n- `limit` must be an integer from 1 to 100; otherwise return `{ error: \"invalid_limit\" }`.\n- `cursor` is `null` or `undefined` for the first page. Otherwise it's a cursor you returned earlier: `btoa(JSON.stringify([createdAt, id]))` for the last row of the previous page. Decode it and return the rows that come strictly after that position in the sort order. The row it was made from may have been deleted since; the position still works.\n- A cursor that doesn't decode to an array of exactly two numbers (a finite `createdAt` and an integer `id`), including the empty string and text that isn't base64, returns `{ error: \"invalid_cursor\" }`.\n- Return `{ items, nextCursor }`: up to `limit` rows (the row objects themselves) and the cursor for the last one, or `nextCursor: null` when nothing remains after this page. Never return a cursor that leads to an empty page; fetch one extra row to find out.\n\nThe tests call `runPagination(rows, limit, steps)`, which follows `nextCursor` from page to page, can insert or delete rows between pages, and can plant a hand-made cursor. Leave the driver as it is.",
        starterCode: "/**\n * Keyset pagination, newest first: ORDER BY createdAt DESC, id DESC.\n * @param {Array<{ id: number, createdAt: number }>} rows the whole \"table\", in any order\n * @param {{ limit: number, cursor?: string | null }} params\n * @returns {{ items: Array<object>, nextCursor: string | null } | { error: \"invalid_limit\" | \"invalid_cursor\" }}\n */\nfunction getPage(rows, { limit, cursor }) {\n  // Your code here (btoa and atob are available)\n}\n\n// ---- Test driver (leave as is) ----\nfunction runPagination(rows, limit, steps) {\n  const table = rows.map((r) => ({ ...r }));\n  let cursor = null;\n  const log = [];\n  for (const step of steps) {\n    if (step.op === \"page\") {\n      const res = getPage(table, { limit, cursor });\n      if (!res || res.error) {\n        log.push({ error: res ? res.error : \"no result\" });\n        continue;\n      }\n      log.push({ ids: res.items.map((r) => r.id), hasMore: res.nextCursor !== null });\n      cursor = res.nextCursor;\n    } else if (step.op === \"peekCursor\") {\n      log.push({ cursor });\n    } else if (step.op === \"setCursor\") {\n      cursor = step.cursor;\n    } else if (step.op === \"insert\") {\n      table.push({ ...step.row });\n    } else if (step.op === \"delete\") {\n      const i = table.findIndex((r) => r.id === step.id);\n      if (i >= 0) table.splice(i, 1);\n    }\n  }\n  return log;\n}\n",
        functionName: "runPagination",
        testCases: [
          {
            description: "the first page is newest first, and its cursor encodes the last row's sort key",
            args: [pagePosts, 3, [nextPage, { op: "peekCursor" }]],
            expected: [{ ids: [7, 6, 5], hasMore: true }, { cursor: "WzMwMDAsNV0=" }],
          },
          {
            description: "walking every page visits each row exactly once",
            args: [pagePosts, 3, [nextPage, nextPage, nextPage]],
            expected: [
              { ids: [7, 6, 5], hasMore: true },
              { ids: [4, 3, 2], hasMore: true },
              { ids: [1], hasMore: false },
            ],
          },
          {
            description: "ties on createdAt that straddle a page boundary aren't skipped or repeated",
            args: [pagePosts, 2, [nextPage, nextPage, nextPage, nextPage]],
            expected: [
              { ids: [7, 6], hasMore: true },
              { ids: [5, 4], hasMore: true },
              { ids: [3, 2], hasMore: true },
              { ids: [1], hasMore: false },
            ],
            isEdgeCase: true,
          },
          {
            description: "when the rows run out exactly at a page boundary, that page says there's no more",
            args: [pagePosts.filter((p) => p.id !== 1), 3, [nextPage, nextPage]],
            expected: [
              { ids: [7, 6, 5], hasMore: true },
              { ids: [4, 3, 2], hasMore: false },
            ],
            isEdgeCase: true,
          },
          {
            description: "a row inserted at the top between requests doesn't duplicate items on the next page",
            args: [pagePosts, 3, [nextPage, { op: "insert", row: { id: 8, createdAt: 5000 } }, nextPage]],
            expected: [
              { ids: [7, 6, 5], hasMore: true },
              { ids: [4, 3, 2], hasMore: true },
            ],
            isEdgeCase: true,
          },
          {
            description: "deleting the row the cursor points at doesn't break the next page",
            args: [pagePosts, 3, [nextPage, { op: "delete", id: 5 }, nextPage]],
            expected: [
              { ids: [7, 6, 5], hasMore: true },
              { ids: [4, 3, 2], hasMore: true },
            ],
            isEdgeCase: true,
          },
          {
            description: "a cursor is a position, not a row: it needn't match an existing row",
            args: [pagePosts, 3, [{ op: "setCursor", cursor: "WzI1MDAsMF0=" }, nextPage]],
            expected: [{ ids: [3, 2, 1], hasMore: false }],
          },
          {
            description: "a cursor that isn't base64 is rejected",
            args: [pagePosts, 3, [{ op: "setCursor", cursor: "!!not-a-cursor!!" }, nextPage]],
            expected: [{ error: "invalid_cursor" }],
            isEdgeCase: true,
          },
          {
            description: "well-formed base64 with the wrong shape is rejected (`[3000]`, `[\"3000\",5]`, an object)",
            args: [
              pagePosts,
              3,
              [
                { op: "setCursor", cursor: "WzMwMDBd" },
                nextPage,
                { op: "setCursor", cursor: "WyIzMDAwIiw1XQ==" },
                nextPage,
                { op: "setCursor", cursor: "eyJjcmVhdGVkQXQiOjMwMDAsImlkIjo1fQ==" },
                nextPage,
              ],
            ],
            expected: [{ error: "invalid_cursor" }, { error: "invalid_cursor" }, { error: "invalid_cursor" }],
            isEdgeCase: true,
          },
          {
            description: "an empty-string cursor is invalid, not \"first page\"",
            args: [pagePosts, 3, [{ op: "setCursor", cursor: "" }, nextPage]],
            expected: [{ error: "invalid_cursor" }],
            isEdgeCase: true,
          },
          { description: "a limit of 0 is rejected", args: [pagePosts, 0, [nextPage]], expected: [{ error: "invalid_limit" }] },
          { description: "a limit of 101 is rejected", args: [pagePosts, 101, [nextPage]], expected: [{ error: "invalid_limit" }], isEdgeCase: true },
          { description: "a fractional limit is rejected", args: [pagePosts, 2.5, [nextPage]], expected: [{ error: "invalid_limit" }] },
          { description: "an empty table returns an empty page with no cursor", args: [[], 10, [nextPage]], expected: [{ ids: [], hasMore: false }] },
          {
            description: "1,000 rows with many tied timestamps, 100 per page",
            args: [manyPosts, 100, Array.from({ length: 10 }, () => nextPage)],
            expected: Array.from({ length: 10 }, (_, p) => ({ ids: Array.from({ length: 100 }, (_, i) => 1000 - p * 100 - i), hasMore: p < 9 })),
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "api-idempotency-safe-methods",
      moduleId: "be-api-design",
      trackId: "backend",
      title: "Idempotency & Safe Methods",
      summary:
        "Networks fail after the server has done the work: the charge succeeded, the response was lost, and the client can't tell whether a retry will charge twice. RFC 9110 gives the vocabulary. Safe methods (GET, HEAD, OPTIONS, TRACE) request no state change, so crawlers, prefetchers and caches may call them freely. Idempotent methods (PUT, DELETE and the safe ones) have the same effect whether sent once or ten times, so clients and proxies may retry them automatically. POST is neither, and PATCH isn't guaranteed to be.\n\nFor non-idempotent operations the standard fix is an idempotency key: the client generates a unique value (a UUID v4) per logical operation and sends it in an `Idempotency-Key` header on every retry. Stripe popularized the pattern; the IETF httpapi draft describing it expired in April 2026 without becoming an RFC, but its semantics are widely copied. The server stores the key with a fingerprint of the request and, once finished, the response. A retry with the same key and payload gets the stored response replayed, even a stored 500; the same key with a different payload is a client bug (`422`); and a retry while the first attempt is still running gets `409`, so two workers never run the same payment. Keys expire after a window; Stripe prunes them after at least 24 hours.\n\nThe hard part is atomicity. Claim the key with a unique constraint before doing any work, commit the business change and the stored response in the same transaction, and recover abandoned in-flight keys after a timeout. Calls to other systems need their own idempotency, so pass a derived key downstream. On the client, retry with exponential backoff and jitter, reuse a key only for retries of the same operation, and generate a new one for a genuinely new request.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "RFC 9110: Idempotent Methods (Section 9.2.2)", url: "https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2", kind: "spec" },
        { label: "IETF draft: The Idempotency-Key HTTP Header Field", url: "https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/", kind: "spec" },
        { label: "Stripe API: Idempotent requests", url: "https://docs.stripe.com/api/idempotent_requests", kind: "docs" },
        { label: "brandur.org: Implementing Stripe-like Idempotency Keys in Postgres", url: "https://brandur.org/idempotency-keys", kind: "article" },
      ],
      video: {
        title: "Designing Idempotent API Endpoints for Payments at Stripe",
        channel: "Arpit Bhayani",
        url: "https://www.youtube.com/watch?v=J2IcD9FZvZU",
        videoId: "J2IcD9FZvZU",
        durationLabel: "14:26",
      },
      alternateVideos: [
        {
          title: "5. Understanding HTTP for backend engineers, where it all starts",
          channel: "Sriniously",
          url: "https://www.youtube.com/watch?v=a3C1DMswClQ",
          videoId: "a3C1DMswClQ",
          durationLabel: "1:18:13",
          startSeconds: 1083,
          chapterLabel: "Idempotent vs non-idempotent",
        },
        {
          title: "Idempotency - What it is and How to Implement it",
          channel: "Alex Hyett",
          url: "https://www.youtube.com/watch?v=XAccGbtl3Z8",
          videoId: "XAccGbtl3Z8",
          durationLabel: "8:04",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createIdempotencyLayer({ ttlMs, lockTimeoutMs })`, the server side of the `Idempotency-Key` header. It returns `{ begin, complete, fail }`:\n\n- `begin(key, payload, now)` runs when a request arrives, before any work, and tells the handler what to do.\n- `complete(key, response, now)` stores the response (`{ status, body }`) after the work has committed.\n- `fail(key, now)` releases the key when the request failed before committing anything (a validation error, or a crash the handler caught), so a retry can run again.\n\n`begin` applies these rules in order:\n\n- A key that isn't a string, or is empty or only whitespace: return `{ action: \"reject\", status: 400 }`.\n- Forget a key first seen `ttlMs` or more ago, and treat it as new. Do the same for a key that is still in flight `lockTimeoutMs` or more after it was first seen (its worker died).\n- A new key: remember it with a fingerprint of `payload`, mark it in flight and return `{ action: \"execute\" }`.\n- A known key whose payload differs: `{ action: \"reject\", status: 422 }`, even while the first attempt is in flight. Payloads are plain JSON data; two payloads are the same when they're deeply equal regardless of object key order (array order does matter).\n- A known key that is still in flight: `{ action: \"reject\", status: 409 }`.\n- A completed key: `{ action: \"replay\", response }` with the stored response, whatever its status. A stored 500 is replayed too.\n\n`complete` and `fail` only affect keys that are in flight. The tests call `runIdempotency(config, steps)` and record what each `begin` returns. Leave the driver as it is.",
        starterCode: "/**\n * Server-side Idempotency-Key handling.\n * @param {{ ttlMs: number, lockTimeoutMs: number }} config\n */\nfunction createIdempotencyLayer({ ttlMs, lockTimeoutMs }) {\n  // Your code here: remember each key's payload fingerprint, state and stored response\n  return {\n    /** @returns {{ action: \"execute\" } | { action: \"replay\", response: object } | { action: \"reject\", status: 400 | 409 | 422 }} */\n    begin(key, payload, now) {\n      // Your code here\n    },\n    complete(key, response, now) {\n      // Your code here\n    },\n    fail(key, now) {\n      // Your code here\n    },\n  };\n}\n\n// ---- Test driver (leave as is) ----\nfunction runIdempotency(config, steps) {\n  const layer = createIdempotencyLayer(config);\n  const log = [];\n  for (const step of steps) {\n    if (step.op === \"begin\") log.push(layer.begin(step.key, step.payload, step.at));\n    else if (step.op === \"complete\") layer.complete(step.key, step.response, step.at);\n    else if (step.op === \"fail\") layer.fail(step.key, step.at);\n  }\n  return log;\n}\n",
        functionName: "runIdempotency",
        testCases: [
          {
            description: "the first request with a new key executes",
            args: [idemConfig, [{ op: "begin", key: "k1", payload: chargeInr, at: 0 }]],
            expected: [EXECUTE],
          },
          {
            description: "a retry after completion replays the stored response instead of charging again",
            args: [
              idemConfig,
              [
                { op: "begin", key: "k1", payload: chargeInr, at: 0 },
                { op: "complete", key: "k1", response: chargeCreated, at: 120 },
                { op: "begin", key: "k1", payload: chargeInr, at: 5000 },
              ],
            ],
            expected: [EXECUTE, { action: "replay", response: chargeCreated }],
          },
          {
            description: "a retry while the first attempt is still running gets 409",
            args: [
              idemConfig,
              [
                { op: "begin", key: "k1", payload: chargeInr, at: 0 },
                { op: "begin", key: "k1", payload: chargeInr, at: 50 },
              ],
            ],
            expected: [EXECUTE, { action: "reject", status: 409 }],
          },
          {
            description: "the same key with a different payload gets 422",
            args: [
              idemConfig,
              [
                { op: "begin", key: "k1", payload: chargeInr, at: 0 },
                { op: "complete", key: "k1", response: chargeCreated, at: 120 },
                { op: "begin", key: "k1", payload: { ...chargeInr, amount: 9000 }, at: 5000 },
              ],
            ],
            expected: [EXECUTE, { action: "reject", status: 422 }],
          },
          {
            description: "a payload mismatch is a 422 even while the first attempt is in flight",
            args: [
              idemConfig,
              [
                { op: "begin", key: "k1", payload: chargeInr, at: 0 },
                { op: "begin", key: "k1", payload: { ...chargeInr, currency: "usd" }, at: 10 },
              ],
            ],
            expected: [EXECUTE, { action: "reject", status: 422 }],
            isEdgeCase: true,
          },
          {
            description: "the same payload with its keys in a different order is the same request",
            args: [
              idemConfig,
              [
                { op: "begin", key: "k1", payload: chargeInr, at: 0 },
                { op: "complete", key: "k1", response: chargeCreated, at: 100 },
                { op: "begin", key: "k1", payload: { customer: "cus_42", currency: "inr", amount: 5000 }, at: 200 },
              ],
            ],
            expected: [EXECUTE, { action: "replay", response: chargeCreated }],
            isEdgeCase: true,
          },
          {
            description: "array order inside the payload does matter",
            args: [
              idemConfig,
              [
                { op: "begin", key: "k1", payload: { items: ["a", "b"] }, at: 0 },
                { op: "complete", key: "k1", response: chargeCreated, at: 100 },
                { op: "begin", key: "k1", payload: { items: ["b", "a"] }, at: 200 },
              ],
            ],
            expected: [EXECUTE, { action: "reject", status: 422 }],
            isEdgeCase: true,
          },
          {
            description: "a stored 500 is replayed too, so the client needs a new key to try again",
            args: [
              idemConfig,
              [
                { op: "begin", key: "k1", payload: chargeInr, at: 0 },
                { op: "complete", key: "k1", response: { status: 500, body: { error: "internal" } }, at: 100 },
                { op: "begin", key: "k1", payload: chargeInr, at: 200 },
                { op: "begin", key: "k2", payload: chargeInr, at: 300 },
              ],
            ],
            expected: [EXECUTE, { action: "replay", response: { status: 500, body: { error: "internal" } } }, EXECUTE],
            isEdgeCase: true,
          },
          {
            description: "after `fail` (nothing was committed), the same key can execute again",
            args: [
              idemConfig,
              [
                { op: "begin", key: "k1", payload: chargeInr, at: 0 },
                { op: "fail", key: "k1", at: 20 },
                { op: "begin", key: "k1", payload: chargeInr, at: 40 },
              ],
            ],
            expected: [EXECUTE, EXECUTE],
            isEdgeCase: true,
          },
          {
            description: "a missing or blank key is a 400",
            args: [
              idemConfig,
              [
                { op: "begin", key: "", payload: chargeInr, at: 0 },
                { op: "begin", key: "   ", payload: chargeInr, at: 0 },
                { op: "begin", key: null, payload: chargeInr, at: 0 },
              ],
            ],
            expected: [
              { action: "reject", status: 400 },
              { action: "reject", status: 400 },
              { action: "reject", status: 400 },
            ],
            isEdgeCase: true,
          },
          {
            description: "a key expires exactly `ttlMs` after it was first seen",
            args: [
              idemConfig,
              [
                { op: "begin", key: "k1", payload: chargeInr, at: 0 },
                { op: "complete", key: "k1", response: chargeCreated, at: 100 },
                { op: "begin", key: "k1", payload: chargeInr, at: 86399999 },
                { op: "begin", key: "k1", payload: { ...chargeInr, amount: 1 }, at: 86400000 },
              ],
            ],
            expected: [EXECUTE, { action: "replay", response: chargeCreated }, EXECUTE],
            isEdgeCase: true,
          },
          {
            description: "an in-flight key abandoned by a crashed worker is taken over after `lockTimeoutMs`",
            args: [
              idemConfig,
              [
                { op: "begin", key: "k1", payload: chargeInr, at: 0 },
                { op: "begin", key: "k1", payload: chargeInr, at: 29999 },
                { op: "begin", key: "k1", payload: chargeInr, at: 30000 },
              ],
            ],
            expected: [EXECUTE, { action: "reject", status: 409 }, EXECUTE],
            isEdgeCase: true,
          },
          {
            description: "keys are independent",
            args: [
              idemConfig,
              [
                { op: "begin", key: "a", payload: chargeInr, at: 0 },
                { op: "begin", key: "b", payload: chargeInr, at: 0 },
                { op: "complete", key: "a", response: chargeCreated, at: 10 },
                { op: "begin", key: "a", payload: chargeInr, at: 20 },
                { op: "begin", key: "b", payload: chargeInr, at: 20 },
              ],
            ],
            expected: [EXECUTE, EXECUTE, { action: "replay", response: chargeCreated }, { action: "reject", status: 409 }],
          },
        ],
      },
    },
    {
      id: "api-graphql-schema-queries-mutations",
      moduleId: "be-api-design",
      trackId: "backend",
      title: "GraphQL Schemas, Queries & Mutations",
      summary:
        "A GraphQL schema is a typed contract written in SDL: object types with fields, scalars, enums, interfaces, unions and input types, plus the root `Query`, `Mutation` and `Subscription` types that are the API's entry points. Clients send a document selecting exactly the fields they need, across related objects, in one round trip, and the server validates it against the schema before executing anything. That validation is why GraphQL tooling is so good: introspection drives autocompletion, code generation and typed clients.\n\nThe type system has sharp edges. `!` marks non-null, and nullability is a design decision, not decoration: when a non-null field fails, the null propagates to the nearest nullable parent, so one broken `String!` deep in a list can wipe out the whole list, or all of `data`. Many schemas therefore keep fields nullable and reserve `!` for values that really can't fail. Variables (`query ($id: ID!)`) keep documents static, cacheable and immune to string-built injection. Input types are separate from output types because inputs may only contain scalars, enums and other input types; the September 2025 spec adds OneOf input objects (`@oneOf`) for \"exactly one of these\" arguments. Fragments reuse selections, aliases request the same field with different arguments, and unions and interfaces need inline fragments (`... on User`).\n\nMutations are fields on `Mutation`. Top-level mutation fields execute serially in document order, while query fields may resolve in parallel. Design them as specific operations (`cancelOrder(input: ...)`) returning a payload type with the changed object and user-facing errors, rather than generic setters. Field errors come back in an `errors` array next to partial `data`, often with HTTP 200, so clients must check both. Evolve the schema additively and retire fields with `@deprecated(reason:)` instead of versioning.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "GraphQL: Schemas and Types", url: "https://graphql.org/learn/schema/", kind: "docs" },
        { label: "GraphQL Specification (September 2025)", url: "https://spec.graphql.org/September2025/", kind: "spec" },
        { label: "Apollo Blog: Using nullability in GraphQL", url: "https://www.apollographql.com/blog/using-nullability-in-graphql", kind: "article" },
        { label: "GraphQL: Mutations", url: "https://graphql.org/learn/mutations/", kind: "docs" },
      ],
      video: {
        title: "GraphQL Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=5199E50O7SI",
        videoId: "5199E50O7SI",
        durationLabel: "1:28:59",
        startSeconds: 630,
        chapterLabel: "Query Basics",
      },
      alternateVideos: [
        {
          title: "GraphQL Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=5199E50O7SI",
          videoId: "5199E50O7SI",
          durationLabel: "1:28:59",
          startSeconds: 4181,
          chapterLabel: "Mutations (Adding & Deleting Data)",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "api-graphql-schema-queries-mutations-q1",
          prompt:
            "With this schema, the client asks for `{ posts { id title } }`, and the `title` resolver throws for one of the posts. What does the response contain?\n\n```graphql\ntype Query {\n  posts: [Post!]!\n}\n\ntype Post {\n  id: ID!\n  title: String!\n}\n```",
          options: [
            "`data` is `null`, with one error whose `path` points at that post's `title`",
            "Every post, with `title: null` for the broken one, plus an error",
            "Every post except the broken one, plus an error",
            "An HTTP 500 response with no body",
          ],
          correctIndex: 0,
          explanation:
            "The null can't stop at `title` (`String!`), at the post (`Post!` in the list), or at `posts` (`[...]!`), so it propagates to the root and `data` becomes `null`. Making `title` or the list items nullable would have contained the failure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-graphql-schema-queries-mutations-q2",
          prompt: "Why pass arguments as variables (`query Order($id: ID!) { order(id: $id) { total } }`) instead of building the query string? (Select all that apply.)",
          options: [
            "The document stays static, so it can be persisted, hashed and cached",
            "Values can't break out of the document, avoiding string-built injection",
            "Variables are validated against their declared types before execution",
            "Variables let the server skip validating the document",
            "Variables let the client choose which fields to select at runtime",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Variables separate the operation from its inputs, the same idea as parameterized SQL. The document is still validated, and variables supply values, never selections; use `@include`/`@skip` or separate operations for that.",
        },
        {
          id: "api-graphql-schema-queries-mutations-q3",
          prompt: "One mutation document contains `a: createOrder(...)` followed by `b: payOrder(...)` at the top level. How does the server execute them?",
          options: [
            "Serially, in document order: `b` starts only after `a` has finished",
            "In parallel, like query fields",
            "In an order chosen by the server for performance",
            "Inside one database transaction, rolled back if either fails",
          ],
          correctIndex: 0,
          explanation:
            "The spec executes top-level mutation fields serially, unlike query fields, which may resolve in parallel. It says nothing about transactions: if `payOrder` fails, `createOrder` has still happened.",
        },
        {
          id: "api-graphql-schema-queries-mutations-q4",
          prompt: "Why does this query fail validation, and what's the fix?\n\n```graphql\n{\n  me {\n    avatarUrl(size: 32)\n    avatarUrl(size: 512)\n  }\n}\n```",
          options: [
            "Two fields with the same response name but different arguments can't be merged; alias them (`small: avatarUrl(size: 32)`)",
            "A field may only be selected once per selection set, whatever its arguments",
            "`size` must be passed through variables when a field is selected twice",
            "It doesn't fail: the server returns both values as an array under `avatarUrl`",
          ],
          correctIndex: 0,
          explanation:
            "Each selection needs an unambiguous key in the response object. Aliases rename the response key, so both can coexist; identical fields with identical arguments would simply merge.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-graphql-schema-queries-mutations-q5",
          prompt: "Why can't a mutation take the output type `User` as an argument?",
          options: [
            "Arguments must be input types (scalars, enums, input objects); output types may contain fields with arguments, interfaces and unions, which inputs can't",
            "It can, as long as every field of `User` is nullable, so partial objects pass validation",
            "Only queries may take object-typed arguments; mutations are limited to scalars and enums",
            "Object arguments must be passed as JSON strings, because GraphQL has no object literal syntax",
          ],
          correctIndex: 0,
          explanation:
            "The spec keeps the input and output type systems separate. Defining `input UserInput` also lets inputs evolve independently of what you return.",
        },
        {
          id: "api-graphql-schema-queries-mutations-q6",
          prompt: "A GraphQL response arrives with HTTP 200. Why can it still be a failure?",
          options: [
            "Field errors are reported in the `errors` array alongside partial (or null) `data`, so clients must check `errors` as well as the status code",
            "It can't: HTTP 200 always means every requested field resolved successfully",
            "GraphQL servers only use 200 for introspection; other results come back as 202",
            "Errors are always sent in a trailing HTTP header that clients must read separately",
          ],
          correctIndex: 0,
          explanation:
            "With the traditional `application/json` response, execution errors don't change the HTTP status, so status-based monitoring and retries miss them. Clients should inspect `errors` and each error's `path`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-graphql-schema-queries-mutations-q7",
          prompt: "How do you remove a field from a GraphQL schema without breaking clients or versioning the API?",
          options: [
            "Mark it `@deprecated(reason: \"...\")`, track which operations still request it, and remove it once usage reaches zero",
            "Serve a copy of the schema without the field at `/graphql/v2`",
            "Remove it and let clients ignore the resulting validation errors",
            "Make the field nullable and have its resolver always return `null`",
          ],
          correctIndex: 0,
          explanation:
            "Because clients declare every field they use, servers can measure field usage precisely, which makes additive evolution practical. Silently returning `null` breaks clients that relied on the value.",
        },
        {
          id: "api-graphql-schema-queries-mutations-q8",
          prompt: "What does this input definition enforce?\n\n```graphql\ninput PetInput @oneOf {\n  cat: CatInput\n  dog: DogInput\n}\n```",
          options: [
            "Exactly one of `cat` or `dog` must be provided, and it must not be `null`",
            "At least one of the fields must be provided",
            "Both fields must be provided",
            "Only the first field listed is ever read",
          ],
          correctIndex: 0,
          explanation:
            "OneOf input objects, added in the September 2025 spec, model \"exactly one of\" inputs (a tagged union for arguments) without resolver-side checks.",
        },
        {
          id: "api-graphql-schema-queries-mutations-q9",
          prompt:
            "`search` returns `[SearchResult!]!`, where `union SearchResult = User | Repository`. Why does `{ search(q: \"api\") { name } }` fail validation?",
          options: [
            "You can't select fields directly on a union (only `__typename`); use inline fragments such as `... on User { name }`",
            "`name` must be aliased, because two member types of the union both define it",
            "Unions can't appear inside list types, so the return type itself is invalid",
            "`search` returns a list, so it needs a `first` argument before any field can be selected",
          ],
          correctIndex: 0,
          explanation:
            "A union has no fields of its own, even if every member happens to have `name`. An interface declaring `name` would allow direct selection.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-graphql-schema-queries-mutations-q10",
          prompt: "Why do well-designed mutations return a payload type such as `CancelOrderPayload { order: Order, userErrors: [UserError!]! }`?",
          options: [
            "Clients get the changed object to update their caches, expected domain errors arrive as typed data, and fields can be added later without breaking anyone",
            "The specification requires every mutation to return an object type with a `userErrors` field",
            "Mutations can't return scalars such as `Boolean`, so an object wrapper is mandatory",
            "Payload types let the server run the mutation's resolvers in parallel, which is faster",
          ],
          correctIndex: 0,
          explanation:
            "A payload is an extension point. Returning `Boolean` is legal, but it can't evolve and forces a second query to see the new state; business errors like \"already shipped\" belong in typed fields, not the transport-level `errors` array.",
        },
      ],
    },
    {
      id: "api-graphql-resolvers-dataloader",
      moduleId: "be-api-design",
      trackId: "backend",
      title: "GraphQL Resolvers & the N+1 Problem (DataLoader)",
      summary:
        "A GraphQL server executes a query by calling a resolver for every field, passing the parent object, the arguments, a per-request context and query info. Resolvers run per object, which is what makes GraphQL composable, and what makes it slow by default: for `{ posts(first: 50) { title author { name } } }`, the `posts` resolver runs one query, then `author` runs once per post, 50 more queries. That's the N+1 problem, and every nested list multiplies it.\n\nDataLoader, maintained under the GraphQL Foundation, fixes it with per-request batching and caching. Resolvers call `loader.load(id)` instead of querying; the loader collects every key requested in the same tick, calls your batch function once (`WHERE id IN (...)`) and resolves each caller with its own result. The batch function's contract is strict: return an array the same length as the keys, in the same order, with an `Error` in any failed slot, because databases return rows in arbitrary order and omit missing ones. Create loaders per request on the context; a shared, long-lived loader serves stale data and can leak one user's permission-filtered results to another.\n\nBatching fixes the number of queries, not the size of the request. Clients can send deep or wide documents (`friends { friends { friends ... } }`, or a thousand aliases), so measure before executing: depth, breadth and alias limits, or cost analysis that multiplies each list by its page size, as GitHub's point-based GraphQL limits do. Require `first` or `last` with a maximum on every list, set timeouts, and for first-party apps accept only persisted (trusted) documents, which blocks arbitrary queries and enables GET caching; Apollo's automatic persisted queries shrink requests but aren't an allow-list. Keep authorization in the business layer that resolvers and loaders call.",
      level: "expert",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "GraphQL: Performance (DataLoader and the N+1 problem)", url: "https://graphql.org/learn/performance/", kind: "docs" },
        { label: "graphql/dataloader: README", url: "https://github.com/graphql/dataloader", kind: "repo" },
        {
          label: "Shopify Engineering: Solving the N+1 Problem for GraphQL through Batching",
          url: "https://shopify.engineering/solving-the-n-1-problem-for-graphql-through-batching",
          kind: "article",
        },
        { label: "GraphQL: Security (depth, breadth and cost limits)", url: "https://graphql.org/learn/security/", kind: "docs" },
      ],
      video: {
        title: "GraphQL N+1 Problem",
        channel: "Ben Awad",
        url: "https://www.youtube.com/watch?v=uCbFMZYQbxE",
        videoId: "uCbFMZYQbxE",
        durationLabel: "16:14",
      },
      alternateVideos: [
        {
          title: "GraphQL Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=5199E50O7SI",
          videoId: "5199E50O7SI",
          durationLabel: "1:28:59",
          startSeconds: 2179,
          chapterLabel: "Resolver Functions",
        },
        {
          title: "GraphQL Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=5199E50O7SI",
          videoId: "5199E50O7SI",
          durationLabel: "1:28:59",
          startSeconds: 3362,
          chapterLabel: "Related Data",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `analyzeQuery(query, schema, limits)`: the static check a GraphQL server should run before executing an operation. It validates the document against the schema, then measures its depth, how many resolver calls a naive implementation would make (the N+1 count) and how many batched fetches a DataLoader-backed one needs.\n\nThe operation arrives already parsed. `query.selections` is the root selection set, on type `Query`. Each selection is either a field `{ field, alias?, args?, selections? }` or a fragment spread `{ spread: \"Name\" }`, whose selections are in `query.fragments[Name]`. `schema[Type][field]` is `{ type, list? }`, and a type that isn't a key of `schema` (such as `String`) is a scalar. Assume response keys are unique within each selection set (no field merging).\n\nWalk the selections depth-first, in order, and return the first validation error as `{ ok: false, error, at }`:\n\n- `unknown_field` (`at: \"Type.field\"`): the field doesn't exist on the current type. `__typename` exists on every type and is a scalar.\n- `missing_selection` or `unexpected_selection` (`at: \"Type.field\"`): an object-typed field without a non-empty `selections` array, or a scalar field that has a `selections` property.\n- `invalid_page_size` (`at: \"Type.field\"`): a list field needs a page size, `args.first` or, when `first` is absent, `args.last`, that is an integer from 1 to 100.\n- `unknown_fragment` or `fragment_cycle` (`at`: the fragment name): a spread of a fragment that doesn't exist, or of one that is already being expanded further up the current path.\n\nMeasure while you walk:\n\n- `depth`: a field is one level plus the deepest field inside it, and the query's depth is its deepest root field. A spread is inlined and adds no level of its own.\n- `cost`: a naive resolver runs once per parent object. Root fields have 1 parent. The fields inside a list field with page size `n` have `n` times as many parents as the list field itself; inside a non-list object field the count is unchanged. Every object-typed field adds its parent count to `cost`; scalars add nothing.\n- `batches`: every object-typed field adds 1, since DataLoader makes one batched fetch per field however many parents it has.\n\nFor example, `viewer { repositories(first: 50) { issues(first: 20) { author { login } } } }` has depth 5, cost 1 + 1 + 50 + 1000 = 1052 and 4 batches.\n\nFor a valid document, return `{ ok: false, error: \"too_deep\", depth, cost, batches }` when `depth > limits.maxDepth`, otherwise `{ ok: false, error: \"too_expensive\", depth, cost, batches }` when `cost > limits.maxCost`, otherwise `{ ok: true, depth, cost, batches }`. Aliased fields are separate fields, and each one counts.",
        starterCode: "/**\n * Validate a GraphQL operation against the schema and measure it before execution.\n * @param {{ selections: Array<object>, fragments?: Record<string, Array<object>> }} query\n * @param {Record<string, Record<string, { type: string, list?: boolean }>>} schema\n * @param {{ maxDepth: number, maxCost: number }} limits\n * @returns {{ ok: true, depth: number, cost: number, batches: number } | { ok: false, error: string, at?: string, depth?: number, cost?: number, batches?: number }}\n */\nfunction analyzeQuery(query, schema, limits) {\n  // Your code here\n}\n",
        functionName: "analyzeQuery",
        testCases: [
          {
            description: "a flat query: one object field and two scalars",
            args: [{ selections: [gf("viewer", { selections: [gf("login"), gf("name")] })] }, gqlSchema, gqlLimits],
            expected: { ok: true, depth: 2, cost: 1, batches: 1 },
          },
          {
            description: "nested lists multiply naive resolver calls, while DataLoader needs one batch per field",
            args: [
              {
                selections: [
                  gf("viewer", {
                    selections: [
                      gf("repositories", {
                        args: { first: 50 },
                        selections: [
                          gf("name"),
                          gf("issues", { args: { first: 20 }, selections: [gf("title"), gf("author", { selections: [gf("login")] })] }),
                        ],
                      }),
                    ],
                  }),
                ],
              },
              gqlSchema,
              gqlLimits,
            ],
            expected: { ok: true, depth: 5, cost: 1052, batches: 4 },
          },
          {
            description: "three levels of `followers(first: 100)` is too expensive",
            args: [
              {
                selections: [
                  gf("viewer", {
                    selections: [
                      gf("followers", {
                        args: { first: 100 },
                        selections: [
                          gf("followers", {
                            args: { first: 100 },
                            selections: [gf("followers", { args: { first: 100 }, selections: [gf("login")] })],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              },
              gqlSchema,
              gqlLimits,
            ],
            expected: { ok: false, error: "too_expensive", depth: 5, cost: 10102, batches: 4 },
            isEdgeCase: true,
          },
          {
            description: "a query nested 7 levels deep is rejected before execution",
            args: [
              {
                selections: [
                  gf("repository", {
                    selections: [
                      gf("issues", {
                        args: { first: 10 },
                        selections: [
                          gf("comments", {
                            args: { first: 10 },
                            selections: [
                              gf("author", {
                                selections: [
                                  gf("repositories", { args: { first: 5 }, selections: [gf("owner", { selections: [gf("login")] })] }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              },
              gqlSchema,
              gqlLimits,
            ],
            expected: { ok: false, error: "too_deep", depth: 7, cost: 712, batches: 6 },
            isEdgeCase: true,
          },
          {
            description: "aliases are separate fields: each alias pays for its own calls",
            args: [
              {
                selections: [
                  gf("viewer", {
                    selections: [
                      gf("repositories", {
                        alias: "r1",
                        args: { first: 100 },
                        selections: [gf("issues", { args: { first: 100 }, selections: [gf("title")] })],
                      }),
                      gf("repositories", {
                        alias: "r2",
                        args: { first: 100 },
                        selections: [gf("issues", { args: { first: 100 }, selections: [gf("title")] })],
                      }),
                    ],
                  }),
                ],
              },
              gqlSchema,
              gqlLimits,
            ],
            expected: { ok: true, depth: 4, cost: 203, batches: 5 },
          },
          {
            description: "1,000 aliased root fields add up (an alias-batching attack)",
            args: [
              { selections: Array.from({ length: 1000 }, (_, i) => gf("viewer", { alias: `v${i}`, selections: [gf("login")] })) },
              gqlSchema,
              { maxDepth: 6, maxCost: 500 },
            ],
            expected: { ok: false, error: "too_expensive", depth: 2, cost: 1000, batches: 1000 },
            isEdgeCase: true,
          },
          {
            description: "fragment spreads are expanded in place and add no depth of their own",
            args: [
              {
                selections: [gf("viewer", { selections: [gf("repositories", { args: { first: 20 }, selections: [{ spread: "RepoFields" }] })] })],
                fragments: { RepoFields: [gf("name"), gf("issues", { args: { first: 10 }, selections: [gf("title")] })] },
              },
              gqlSchema,
              gqlLimits,
            ],
            expected: { ok: true, depth: 4, cost: 22, batches: 3 },
          },
          {
            description: "fragments that spread each other form a cycle",
            args: [
              {
                selections: [gf("viewer", { selections: [{ spread: "A" }] })],
                fragments: { A: [gf("login"), { spread: "B" }], B: [gf("name"), { spread: "A" }] },
              },
              gqlSchema,
              gqlLimits,
            ],
            expected: { ok: false, error: "fragment_cycle", at: "A" },
            isEdgeCase: true,
          },
          {
            description: "a spread of an undefined fragment is an error",
            args: [{ selections: [gf("viewer", { selections: [{ spread: "Missing" }] })] }, gqlSchema, gqlLimits],
            expected: { ok: false, error: "unknown_fragment", at: "Missing" },
          },
          {
            description: "a field that isn't in the schema is rejected",
            args: [{ selections: [gf("viewer", { selections: [gf("passwordHash")] })] }, gqlSchema, gqlLimits],
            expected: { ok: false, error: "unknown_field", at: "User.passwordHash" },
          },
          {
            description: "a list field without `first` or `last` is rejected",
            args: [{ selections: [gf("viewer", { selections: [gf("repositories", { selections: [gf("name")] })] })] }, gqlSchema, gqlLimits],
            expected: { ok: false, error: "invalid_page_size", at: "User.repositories" },
            isEdgeCase: true,
          },
          {
            description: "a page size above 100 is rejected",
            args: [{ selections: [gf("search", { args: { first: 1000 }, selections: [gf("name")] })] }, gqlSchema, gqlLimits],
            expected: { ok: false, error: "invalid_page_size", at: "Query.search" },
            isEdgeCase: true,
          },
          {
            description: "`last` is accepted when `first` is absent",
            args: [{ selections: [gf("viewer", { selections: [gf("repositories", { args: { last: 5 }, selections: [gf("name")] })] })] }, gqlSchema, gqlLimits],
            expected: { ok: true, depth: 3, cost: 2, batches: 2 },
          },
          {
            description: "`__typename` is allowed on every type and costs nothing",
            args: [
              {
                selections: [
                  gf("viewer", { selections: [gf("__typename"), gf("repositories", { args: { first: 2 }, selections: [gf("__typename")] })] }),
                ],
              },
              gqlSchema,
              gqlLimits,
            ],
            expected: { ok: true, depth: 3, cost: 2, batches: 2 },
          },
          {
            description: "an object field needs a selection set",
            args: [{ selections: [gf("viewer")] }, gqlSchema, gqlLimits],
            expected: { ok: false, error: "missing_selection", at: "Query.viewer" },
          },
          {
            description: "a scalar field can't have one",
            args: [{ selections: [gf("viewer", { selections: [gf("login", { selections: [gf("x")] })] })] }, gqlSchema, gqlLimits],
            expected: { ok: false, error: "unexpected_selection", at: "User.login" },
          },
          {
            description: "validation errors win over limit errors",
            args: [
              {
                selections: [
                  gf("repository", {
                    selections: [
                      gf("issues", {
                        args: { first: 10 },
                        selections: [
                          gf("comments", {
                            args: { first: 10 },
                            selections: [
                              gf("author", {
                                selections: [
                                  gf("repositories", { args: { first: 5 }, selections: [gf("owner", { selections: [gf("email")] })] }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              },
              gqlSchema,
              gqlLimits,
            ],
            expected: { ok: false, error: "unknown_field", at: "User.email" },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "api-openapi-swagger",
      moduleId: "be-api-design",
      trackId: "backend",
      title: "API Documentation with OpenAPI/Swagger",
      summary:
        "An OpenAPI document is a machine-readable contract for an HTTP API: servers, paths, operations, parameters, request bodies, responses, security schemes and reusable schemas under `components`, in YAML or JSON. Swagger was the specification's original name (Swagger 2.0 is OpenAPI 2.0); today the spec is OpenAPI, governed by the OpenAPI Initiative, and Swagger is SmartBear's tooling brand (Swagger UI, Swagger Editor). One document feeds interactive docs, client SDK and server stub generation, mock servers, request validation, contract tests and gateways. That's the real payoff: the contract stops being prose that drifts.\n\nVersions matter because tooling lags. OpenAPI 3.1 (2021) aligned the Schema Object with JSON Schema 2020-12, so `nullable: true` became `type: [\"string\", \"null\"]`, and it added top-level `webhooks`. OpenAPI 3.2 (September 2025, with a 3.2.1 patch in September 2026) added hierarchical tags (`summary`, `parent`, `kind`), the `QUERY` method and `additionalOperations`, a `querystring` parameter location, streaming media types such as `text/event-stream` and JSON Lines described with `itemSchema`, and the OAuth 2.0 device authorization flow. Check that your generators and validators support a version before upgrading the document.\n\nCode-first generates the document from annotations or framework metadata (FastAPI, NestJS's Swagger module, tsoa): always in sync, but it describes whatever the code happens to do. Design-first writes the contract before implementation and reviews it like code: lint it with Spectral against a style guide, mock it so frontend work starts in parallel, generate types from it, and diff it in CI to catch breaking changes (a removed field, a newly required parameter) before they ship. Either way, validate real responses against the document in tests, or the contract quietly becomes fiction.",
      level: "intermediate",
      estMinutes: 60,
      webRefs: [
        { label: "OpenAPI Specification v3.2.1", url: "https://spec.openapis.org/oas/v3.2.1.html", kind: "spec" },
        { label: "OpenAPI Initiative: Getting Started (learn.openapis.org)", url: "https://learn.openapis.org/", kind: "docs" },
        { label: "OpenAPI Initiative: Announcing OpenAPI v3.2", url: "https://www.openapis.org/blog/2025/09/23/announcing-openapi-v3-2", kind: "article" },
        { label: "stoplightio/spectral: OpenAPI linter", url: "https://github.com/stoplightio/spectral", kind: "repo" },
      ],
      video: {
        title: "28. OpenAPI: The universal contract between clients and servers",
        channel: "Sriniously",
        url: "https://www.youtube.com/watch?v=CwKsU84jIWs",
        videoId: "CwKsU84jIWs",
        durationLabel: "43:55",
      },
      alternateVideos: [
        {
          title: "Understand OpenAPI in 5 Minutes With Examples",
          channel: "florianjsx",
          url: "https://www.youtube.com/watch?v=PenvYHJ9Koc",
          videoId: "PenvYHJ9Koc",
          durationLabel: "4:34",
        },
        {
          title: "REST API and OpenAPI: It’s Not an Either/Or Question",
          channel: "IBM Technology",
          url: "https://www.youtube.com/watch?v=pRS9LRBgjYg",
          videoId: "pRS9LRBgjYg",
          durationLabel: "9:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "api-openapi-swagger-q1",
          prompt: "Which statement about \"Swagger\" and \"OpenAPI\" is accurate today?",
          options: [
            "OpenAPI is the specification; Swagger UI and Swagger Editor are tools that read it, and Swagger 2.0 is the old name of OpenAPI 2.0",
            "Swagger is the newer, renamed version of the OpenAPI specification",
            "OpenAPI describes REST APIs, while Swagger describes GraphQL APIs",
            "They're competing specifications from different vendors, with incompatible formats",
          ],
          correctIndex: 0,
          explanation:
            "The Swagger specification was donated to the OpenAPI Initiative and renamed; versions 3.0 onwards have only ever been OpenAPI. \"Swagger\" now refers to SmartBear's tooling.",
        },
        {
          id: "api-openapi-swagger-q2",
          prompt: "You migrate an OpenAPI 3.0 document to 3.1. How do you declare a string property that may be `null`?",
          options: [
            "`type: [\"string\", \"null\"]`, because 3.1 follows JSON Schema 2020-12 and dropped `nullable`",
            "`type: string` with `nullable: true`, exactly as in 3.0",
            "`type: string` with `x-nullable: true`",
            "`type: string` with `required: false`",
          ],
          correctIndex: 0,
          explanation:
            "OpenAPI 3.1 made the Schema Object a JSON Schema 2020-12 dialect, so `nullable` is gone and a type array expresses null. `required` controls whether a property must be present, which is a different question from whether it can be null.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-openapi-swagger-q3",
          prompt: "A CI job diffs the OpenAPI document of each pull request against `main`. Which changes should it flag as breaking? (Select all that apply.)",
          options: [
            "Removing a property from a response schema",
            "Adding a required property to a request body",
            "Changing a query parameter from optional to required",
            "Adding an optional property to a response",
            "Adding a new path",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Existing clients may read the removed property and don't send the newly required fields. Additive response and path changes are compatible, provided clients ignore unknown fields.",
        },
        {
          id: "api-openapi-swagger-q4",
          prompt: "What's a genuine advantage of design-first over code-first OpenAPI?",
          options: [
            "Consumers can review, mock and build against the contract before the implementation exists",
            "The document can never drift from the implementation, because it's written first",
            "Contract tests become unnecessary, because the design was reviewed up front",
            "Generated server stubs come with the business logic already implemented",
          ],
          correctIndex: 0,
          explanation:
            "Design-first turns the contract into a reviewable artifact and unblocks parallel frontend and backend work. It's code-first that stays in sync by construction; design-first needs contract tests to prevent drift.",
        },
        {
          id: "api-openapi-swagger-q5",
          prompt: "Which features did OpenAPI 3.2 add? (Select all that apply.)",
          options: [
            "Support for the `QUERY` HTTP method, plus `additionalOperations` for other methods",
            "Streaming media types such as `text/event-stream` and JSON Lines, described with `itemSchema`",
            "Hierarchical tags with `parent` and `kind`",
            "Embedding GraphQL schemas in place of paths",
            "Replacing JSON Schema with a new schema language",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The OAI's 3.2 announcement lists new HTTP method support, sequential and streaming media types, a richer Tag Object, the `querystring` location and the OAuth device flow. It still uses JSON Schema 2020-12 and describes HTTP APIs, not GraphQL.",
        },
        {
          id: "api-openapi-swagger-q6",
          prompt: "The published document says `amount` is an `integer`, but one handler sometimes returns it as a string. What reliably catches this before users do?",
          options: [
            "Validating actual responses against the OpenAPI document in integration tests (or in middleware in staging)",
            "Serving Swagger UI in production, so users can see which type is documented",
            "Adding `format: int64` to the schema, so serializers coerce the value to a number",
            "Regenerating the client SDKs, which will then parse the field as an integer",
          ],
          correctIndex: 0,
          explanation:
            "Only checking real traffic against the contract detects drift. Docs and generated clients faithfully repeat whatever the document claims, even when the implementation disagrees.",
        },
        {
          id: "api-openapi-swagger-q7",
          prompt: "How does an OpenAPI document declare that operations require a bearer JWT?",
          options: [
            "Define a security scheme in `components.securitySchemes` with `type: http`, `scheme: bearer`, `bearerFormat: JWT`, and reference it in `security`",
            "Declare an `Authorization` header parameter on every operation that needs it",
            "Set `auth: jwt` on the top-level `info` object so it applies to every operation",
            "Describe the token format in each operation's `description`, which generators parse",
          ],
          correctIndex: 0,
          explanation:
            "Security schemes plus `security` requirements are what tools understand, for example Swagger UI's authorize button and SDK auth helpers. The spec says header parameters named `Authorization` are ignored.",
        },
        {
          id: "api-openapi-swagger-q8",
          prompt: "Why do SDK generators care so much about each operation's `operationId`?",
          options: [
            "It becomes the generated method name, so it must be unique, and renaming it is a breaking change for SDK users",
            "It determines the URL path that generated servers mount the operation on",
            "It tells generators which HTTP method to use when an operation doesn't declare one",
            "Generators use it as a cache key for response schemas, so a collision only costs performance",
          ],
          correctIndex: 0,
          explanation:
            "The spec requires `operationId` to be unique among all operations, and generators turn it into `client.listInvoices()` and the like. Changing it changes the SDK's public API even when the HTTP API is untouched.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-openapi-swagger-q9",
          prompt: "What does the parameter location `in: querystring`, new in OpenAPI 3.2, let you do?",
          options: [
            "Describe the entire query string with one schema instead of one parameter per key",
            "Send query parameters in the request body, for clients that can't build URLs",
            "Mark every query parameter on the operation as optional in one place",
            "Pass a GraphQL document in the query string, as persisted-query GETs do",
          ],
          correctIndex: 0,
          explanation:
            "It helps with complex or dynamic filters. The spec forbids mixing it with ordinary `in: query` parameters on the same operation.",
        },
        {
          id: "api-openapi-swagger-q10",
          prompt: "Your API sends webhooks to subscribers. How can an OpenAPI 3.1+ document describe those outgoing requests?",
          options: [
            "With the top-level `webhooks` map (added in 3.1), or with `callbacks` when the webhook URL is supplied in an API request",
            "It can't: OpenAPI only describes requests the server receives",
            "By listing them under `paths` with a `webhook: true` flag",
            "With an `x-webhooks` extension, since there's no standard way",
          ],
          correctIndex: 0,
          explanation:
            "Callbacks (since 3.0) describe requests triggered by an operation, keyed by a runtime expression such as the callback URL in the request body; 3.1 added `webhooks` for out-of-band events registered some other way.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "api-webhooks-event-driven",
      moduleId: "be-api-design",
      trackId: "backend",
      title: "Webhooks & Event-Driven APIs",
      summary:
        "Webhooks invert the API: instead of clients polling \"anything new?\", the provider POSTs an event to a URL the consumer registered. Integrations become near-real-time and cheap, but the hard problems of distributed systems land on both sides of an HTTP call neither side fully controls.\n\nDelivery is at least once. Providers retry on timeouts, 5xx responses and network errors with exponential backoff (Stripe retries for up to three days in live mode), and a lost acknowledgement means the same event arrives twice. Consumers must be idempotent, typically by recording processed event IDs under a unique constraint in the same transaction as the side effect. Ordering isn't guaranteed either: `invoice.paid` can arrive before `invoice.created`, so treat events as notifications and fetch the current state, or compare versions, rather than applying payloads blindly. Acknowledge with a `2xx` quickly and process from a queue; slow handlers become timeouts, and timeouts become duplicate deliveries.\n\nAnyone can POST to a public URL, so verify authenticity. The common scheme is an HMAC-SHA256 over the exact raw body with a shared secret: GitHub's `X-Hub-Signature-256`, Stripe's `Stripe-Signature` (a `t=` timestamp plus `v1=` signatures over `timestamp.body`), and the Standard Webhooks spec's `webhook-id`, `webhook-timestamp` and `webhook-signature` headers over `id.timestamp.body`. Verify the raw bytes, not re-serialized JSON; compare in constant time; reject timestamps outside a tolerance (five minutes is typical) to stop replays; and accept several signatures during secret rotation. Providers have duties too: webhook URLs are an SSRF vector, so block private and link-local addresses after DNS resolution, and publish from an outbox table written in the same transaction as the change, so no event is sent for a change that didn't commit or lost for one that did.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        {
          label: "Standard Webhooks: specification",
          url: "https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md",
          kind: "spec",
        },
        { label: "Stripe Docs: Receive Stripe events in your webhook endpoint", url: "https://docs.stripe.com/webhooks", kind: "docs" },
        { label: "GitHub Docs: Validating webhook deliveries", url: "https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries", kind: "docs" },
        { label: "brandur.org: Should You Build a Webhooks API?", url: "https://brandur.org/webhooks", kind: "article" },
      ],
      video: {
        title: "29. Webhooks: how the server calls you",
        channel: "Sriniously",
        url: "https://www.youtube.com/watch?v=eWM0CVReP04",
        videoId: "eWM0CVReP04",
        durationLabel: "56:06",
      },
      alternateVideos: [
        {
          title: "Top 3 Things You Should Know About Webhooks!",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=x_jjhcDrISk",
          videoId: "x_jjhcDrISk",
          durationLabel: "3:55",
        },
        {
          title: "System Design Interview: Design a Webhook Service w/ a Google Engineer",
          channel: "System Design School",
          url: "https://www.youtube.com/watch?v=4C9SVQVmUxs",
          videoId: "4C9SVQVmUxs",
          durationLabel: "7:28",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "api-webhooks-event-driven-q1",
          prompt:
            "Most deliveries to this endpoint verify, but some legitimate ones fail with 401. Why?\n\n```js\napp.post(\"/webhooks/billing\", express.json(), (req, res) => {\n  const expected = crypto\n    .createHmac(\"sha256\", process.env.WEBHOOK_SECRET)\n    .update(JSON.stringify(req.body))\n    .digest(\"hex\");\n  if (expected !== req.get(\"X-Signature\")) return res.sendStatus(401);\n  enqueue(req.body);\n  res.sendStatus(200);\n});\n```",
          options: [
            "It signs `JSON.stringify(req.body)` rather than the raw bytes the provider signed; re-serializing can change whitespace, escaping, number formatting and even key order",
            "HMAC-SHA256 mixes in a random IV, so the same body produces a different signature each time",
            "`express.json()` removes custom headers such as `X-Signature` once it has parsed the body",
            "The secret must be base64-decoded before use, and only some deliveries verify without that step",
          ],
          correctIndex: 0,
          explanation:
            "Signatures cover exact bytes, and a parse-then-stringify round trip isn't byte-identical (`1.0` becomes `1`, `\\u00e9` becomes `é`, integer-like keys move first). Use `express.raw({ type: \"application/json\" })` on the webhook route, verify, then parse.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-webhooks-event-driven-q2",
          prompt: "Why compare signatures with `crypto.timingSafeEqual` rather than `!==`?",
          options: [
            "String comparison can return at the first mismatched character, so response timing reveals how much of a forged signature is correct",
            "`!==` compares strings by reference, so two equal hex digests are never considered equal",
            "`timingSafeEqual` also verifies the signed timestamp, which a plain comparison can't do",
            "`!==` is noticeably slower on 64-character digests, which makes deliveries time out",
          ],
          correctIndex: 0,
          explanation:
            "A constant-time comparison stops the endpoint from acting as a signing oracle. Note that `timingSafeEqual` throws when the buffers differ in length, so check the lengths first and treat a mismatch as a failure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-webhooks-event-driven-q3",
          prompt: "An attacker captured a valid, correctly signed delivery yesterday and resends it byte for byte today. What stops it?",
          options: [
            "A signed timestamp checked against a tolerance window, plus deduplication by event ID",
            "The HMAC, because it can only be verified once",
            "TLS, because it encrypts the payload",
            "Nothing can stop a replay of a valid signature",
          ],
          correctIndex: 0,
          explanation:
            "The signature proves the body came from the provider, not that it's fresh. Signing the timestamp (as Stripe and Standard Webhooks do) makes old deliveries detectable, and an idempotency record catches replays inside the window.",
        },
        {
          id: "api-webhooks-event-driven-q4",
          prompt: "Webhook delivery is at least once. Which consumer behaviors does that require? (Select all that apply.)",
          options: [
            "Recording processed event IDs and skipping duplicates",
            "Returning a 2xx quickly and doing the slow work asynchronously",
            "Tolerating events that arrive out of order",
            "Assuming that once you return 200, the same event never arrives again",
            "Ordering events by their `created` timestamps",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Retries after lost acknowledgements produce duplicates, and slow handlers cause more retries. Stripe specifically warns that events can share a `created` second and don't arrive in order, so timestamps can't order them.",
        },
        {
          id: "api-webhooks-event-driven-q5",
          prompt:
            "Your handler applies each `subscription.updated` payload directly. A delivery showing `status: \"active\"` is retried and arrives after a later event that set `status: \"canceled\"`. What's the safer design?",
          options: [
            "Treat the event as a notification: fetch the subscription's current state from the provider's API (or compare a version) before updating",
            "Apply events in the order they arrive, since the provider sends them in order",
            "Ignore any event whose timestamp is more than 60 seconds old",
            "Return 500 for out-of-order events so the provider resends them in sequence",
          ],
          correctIndex: 0,
          explanation:
            "Applying stale snapshots lets an old event overwrite newer state. Refetching, or comparing a monotonically increasing version, makes the handler converge on the truth whatever the order.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-webhooks-event-driven-q6",
          prompt: "A developer sets the timestamp tolerance to `0` when calling Stripe's signature verification helper. What does that do?",
          options: [
            "It disables the recency check entirely, so old deliveries are accepted",
            "It rejects every delivery, since no request arrives in zero seconds",
            "It requires the server clock to match Stripe's exactly",
            "It falls back to the default five-minute window",
          ],
          correctIndex: 0,
          explanation:
            "Stripe's docs call this out as a common mistake: a tolerance of 0 turns off replay protection rather than making it strict. Keep the default five minutes and keep your clock synced with NTP.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-webhooks-event-driven-q7",
          prompt: "Your platform lets customers register webhook URLs. What's a real risk for you as the provider?",
          options: [
            "Server-side request forgery: a customer registers `http://169.254.169.254/...` or an internal hostname, and your dispatcher calls into your own network",
            "Customers can extract your signing secret by comparing signatures across many deliveries",
            "Each delivery counts against the customer's API rate limit, so busy accounts get throttled",
            "Customer URLs must use plain HTTP, because TLS would hide payloads from your audit logs",
          ],
          correctIndex: 0,
          explanation:
            "The dispatcher runs inside your network. Validate the resolved IP (not just the hostname) against private, loopback and link-local ranges, and don't follow redirects blindly; egress proxies like Stripe's Smokescreen exist for this.",
        },
        {
          id: "api-webhooks-event-driven-q8",
          prompt: "Why do providers write events to an outbox table in the same database transaction as the business change?",
          options: [
            "It avoids the dual-write problem: the event exists if and only if the change committed, and a dispatcher delivers it afterwards",
            "It guarantees that consumers receive events in exactly the order the changes were committed",
            "It makes retries unnecessary, because the event is stored durably before anything is sent",
            "It lets the provider skip signing deliveries, since events come from a trusted table",
          ],
          correctIndex: 0,
          explanation:
            "Sending the HTTP call inside the transaction can announce a change that later rolls back, and sending after commit can be lost in a crash. The outbox turns publishing into reliable, retryable background work.",
        },
        {
          id: "api-webhooks-event-driven-q9",
          prompt: "How does the Standard Webhooks spec support rotating the signing secret without downtime?",
          options: [
            "The `webhook-signature` header can carry several space-delimited signatures, and the consumer accepts the delivery if any one of them verifies",
            "Consumers are told to skip verification for the length of the rotation window",
            "The provider sends each event twice during rotation, once signed with each secret",
            "The secret is derived from the timestamp, so it rotates automatically",
          ],
          correctIndex: 0,
          explanation:
            "During the overlap the provider signs with both the old and new secrets. Stripe works the same way: while an old secret is still valid, each delivery carries one signature per active secret.",
        },
        {
          id: "api-webhooks-event-driven-q10",
          prompt: "Your endpoint was down for an hour. What happens to Stripe live-mode events sent during the outage?",
          options: [
            "Stripe retries them with exponential backoff for up to three days",
            "They're discarded after the first failed attempt",
            "Stripe retries every second until the endpoint responds",
            "They're delivered in one batch request when the endpoint recovers",
          ],
          correctIndex: 0,
          explanation:
            "Backoff spreads the retries so a recovering endpoint isn't flattened. Because each retry is a new delivery with a new signature and timestamp, deduplicate on the event ID, not on the signature.",
        },
        {
          id: "api-webhooks-event-driven-q11",
          prompt: "A partner must be able to rebuild complete state after their own outage. Why aren't webhooks alone enough?",
          options: [
            "Retries eventually give up and deliveries can arrive out of order, so you also need a replayable, cursor-paginated events API for reconciliation",
            "Webhook payloads are capped at one object, so they can't carry the related records",
            "Webhook deliveries can't cross cloud providers without a VPN between them",
            "Deliveries that arrive while the partner is deploying are dropped without retries",
          ],
          correctIndex: 0,
          explanation:
            "Webhooks are a low-latency hint, not a durable log. Pairing them with a list endpoint (as Stripe does with its events API) lets consumers catch up on anything they missed.",
        },
      ],
    },
    {
      id: "api-rest-vs-graphql",
      moduleId: "be-api-design",
      trackId: "backend",
      title: "REST vs GraphQL: A Real Architectural Decision",
      summary:
        "Choosing between REST and GraphQL is choosing where complexity lives. REST puts it into resource and URL design and lets HTTP do a lot for free: GET responses are cacheable by browsers and CDNs through URLs and ETags, status codes drive retries and monitoring, and rate limits can simply count requests. The price is shape mismatch: screens either over-fetch from fat endpoints or under-fetch and make several round trips, which is why teams end up building backends-for-frontends.\n\nGraphQL hands shape control to the client: one endpoint, a typed schema, and each screen asks for exactly the fields it needs across related entities in one round trip, with codegen producing typed clients. That pays off when many clients (web, iOS, Android, partners) evolve at different speeds over a rich, connected domain; GitHub and Shopify expose GraphQL APIs for that reason. The costs move to the server and to operations. Resolvers need batching to avoid N+1. Arbitrary queries need depth and cost limits, and rate limits based on computed cost (GitHub charges points per query instead of counting requests). POST requests bypass HTTP caches unless you serve persisted queries over GET. Errors arrive as HTTP 200 with an `errors` array, so status-code dashboards lie. Authorization must be enforced per object, because a client can reach any node through any path.\n\nHeuristics that hold up: public third-party APIs, simple CRUD, and file- or cache-heavy workloads favor REST with OpenAPI. A product with several first-party UIs aggregating many services favors GraphQL, often as a gateway or federated supergraph over REST or gRPC services. Service-to-service calls usually want gRPC, and a TypeScript monorepo may want tRPC. It's rarely either/or: many companies run GraphQL for their own apps and REST plus webhooks for partners.",
      level: "advanced",
      estMinutes: 45,
      isMilestone: true,
      webRefs: [
        {
          label: "GitHub Docs: Comparing GitHub's REST API and GraphQL API",
          url: "https://docs.github.com/en/rest/about-the-rest-api/comparing-githubs-rest-api-and-graphql-api",
          kind: "docs",
        },
        {
          label: "GitHub Docs: Rate limits and query limits for the GraphQL API",
          url: "https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api",
          kind: "docs",
        },
        { label: "Sam Newman: Backends For Frontends", url: "https://samnewman.io/patterns/architectural/bff/", kind: "article" },
        { label: "GraphQL: Caching", url: "https://graphql.org/learn/caching/", kind: "docs" },
      ],
      video: {
        title: "GraphQL vs REST: Which is Better for APIs?",
        channel: "IBM Technology",
        url: "https://www.youtube.com/watch?v=PTfZcN20fro",
        videoId: "PTfZcN20fro",
        durationLabel: "7:31",
      },
      alternateVideos: [
        {
          title: "GraphQL Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=5199E50O7SI",
          videoId: "5199E50O7SI",
          durationLabel: "1:28:59",
          startSeconds: 0,
          chapterLabel: "What is GraphQL?",
        },
        {
          title: "tRPC, gRPC, GraphQL or REST: when to use what?",
          channel: "Software Developer Diaries",
          url: "https://www.youtube.com/watch?v=veAb1fSp1Lk",
          videoId: "veAb1fSp1Lk",
          durationLabel: "10:46",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "api-rest-vs-graphql-q1",
          prompt: "Why is CDN and browser caching usually easier with REST than with GraphQL?",
          options: [
            "REST GETs have URLs as natural cache keys; GraphQL usually POSTs different documents to one URL, which HTTP caches don't store",
            "GraphQL responses are streamed in chunks, and CDNs can only cache complete, fixed-length JSON bodies",
            "CDNs refuse to cache any response that carries partial data alongside an `errors` array",
            "REST responses are always smaller than GraphQL ones, so they fit within CDN object-size limits",
          ],
          correctIndex: 0,
          explanation:
            "GraphQL can regain HTTP caching by sending persisted query IDs over GET, but that's extra machinery; most GraphQL caching happens in normalized client caches instead. REST gets it by default.",
        },
        {
          id: "api-rest-vs-graphql-q2",
          prompt: "Which statements are true? (Select all that apply.)",
          options: [
            "GraphQL removes client-side over-fetching and under-fetching by letting each client choose its fields",
            "GraphQL can make server-side N+1 queries worse unless resolvers batch",
            "REST can reduce under-fetching with composite or BFF endpoints and `include`/sparse-fieldset parameters",
            "GraphQL makes pagination unnecessary",
            "REST can't return nested resources in one response",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "GraphQL moves the fetching problem from the client's network to the server's data layer. REST has partial answers (JSON:API-style `include`, field selection, BFFs), and both still need pagination.",
        },
        {
          id: "api-rest-vs-graphql-q3",
          prompt: "Why does GitHub's GraphQL API rate-limit by computed points per query instead of by request count?",
          options: [
            "One GraphQL request can cost one lookup or hundreds of thousands, so cost has to reflect the work a query requests",
            "GraphQL requests can't be counted by an API gateway",
            "Points are cheaper for GitHub to store than counters",
            "It lets unauthenticated clients make unlimited requests",
          ],
          correctIndex: 0,
          explanation:
            "Request counting treats a tiny query and a deeply nested one alike. GitHub assigns points per query (5,000 per hour for users) and enforces node limits, which is cost analysis applied to rate limiting.",
        },
        {
          id: "api-rest-vs-graphql-q4",
          prompt:
            "Your web, iOS and Android teams each maintain their own REST backend-for-frontend, and all three duplicate the logic that aggregates data from six services. What would a single GraphQL gateway change?",
          options: [
            "Each client queries one shared schema for its own shape, so aggregation lives in shared resolvers, but the gateway becomes critical infrastructure",
            "Nothing: GraphQL can't aggregate data from more than one backend service in a single query",
            "The six services would have to be rewritten as GraphQL servers before a gateway could call them",
            "Each client would still need its own BFF, because GraphQL can't return different shapes to different clients",
          ],
          correctIndex: 0,
          explanation:
            "GraphQL often replaces per-client BFFs with one schema that serves every client's needs, and resolvers can call existing REST or gRPC services unchanged. The duplication disappears, but operational complexity concentrates in one place.",
        },
        {
          id: "api-rest-vs-graphql-q5",
          prompt:
            "A schema exposes `Order.customer` and `Customer.orders`. The team checks permissions only in top-level query resolvers such as `order(id:)`. What goes wrong?",
          options: [
            "A user can traverse from an object they're allowed to see to other customers' orders through nested fields, bypassing the top-level checks",
            "Nothing: nested resolvers automatically inherit the permission check of the top-level field",
            "Queries fail validation, because the two types reference each other in a cycle",
            "The server loops forever at startup while building the circular schema",
          ],
          correctIndex: 0,
          explanation:
            "In a graph, every edge is an entry point. Enforce authorization per object in the business layer that every resolver calls, so it holds no matter which path reached the data.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-rest-vs-graphql-q6",
          prompt: "You're launching a public API for thousands of external developers. Resources are simple, reads dominate, and responses are highly cacheable. What's the better default?",
          options: [
            "REST with an OpenAPI description",
            "GraphQL with introspection disabled",
            "gRPC with server reflection",
            "tRPC",
          ],
          correctIndex: 0,
          explanation:
            "External developers get universal tooling, simple HTTP caching and request-based rate limits, and OpenAPI gives them SDKs and docs. GraphQL's strengths (client-shaped queries over a rich graph) matter less here, and tRPC only works for TypeScript clients you control.",
        },
        {
          id: "api-rest-vs-graphql-q7",
          prompt: "Why can't a public GraphQL API rely on trusted documents (a persisted-query allow-list) the way a first-party one can?",
          options: [
            "Third-party operations aren't known in advance, so they can't be pre-registered; the API needs depth, cost and rate limits instead",
            "Trusted documents only work over WebSockets, and public APIs are served over plain HTTP",
            "The GraphQL specification forbids persisted queries for APIs with external clients",
            "Trusted documents disable introspection, which public API consumers need for their tooling",
          ],
          correctIndex: 0,
          explanation:
            "graphql.org's security guidance says exactly this: allow-listing operations works when you author all the clients. Public APIs have to defend against arbitrary queries.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-rest-vs-graphql-q8",
          prompt: "Why are file uploads awkward in GraphQL?",
          options: [
            "The spec has no upload type: the multipart convention is a community spec, and multipart requests skip the CORS preflight, so servers need explicit CSRF protection",
            "The specification caps variables at 64 KB, which rules out anything but small files",
            "Nothing is awkward: uploads work exactly like REST, because GraphQL already runs over HTTP",
            "The spec requires files to be base64-encoded inside query variables, which inflates them by a third",
          ],
          correctIndex: 0,
          explanation:
            "graphql.org's file-upload guide highlights both the non-standard multipart protocol and its CSRF risk. Presigned object-storage URLs also keep large bodies away from the GraphQL server.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "api-rest-vs-graphql-q9",
          prompt: "How do the two styles typically evolve over years?",
          options: [
            "GraphQL evolves one schema continuously, with deprecations guided by per-field usage; REST more often adds versions when shapes must change for everyone",
            "GraphQL needs a new endpoint for every schema change, while REST can change responses freely",
            "REST can never add a field without a new version, while GraphQL never needs deprecations",
            "Both force every client to upgrade on each release, because contracts are validated strictly",
          ],
          correctIndex: 0,
          explanation:
            "Because each GraphQL client declares exactly which fields it uses, the server can see who depends on what. REST can evolve additively too, but when it can't, a version is the usual tool.",
        },
        {
          id: "api-rest-vs-graphql-q10",
          prompt: "Go and Java services call each other with tight latency budgets and need bidirectional streaming. Which style fits best?",
          options: ["gRPC", "GraphQL", "REST with JSON", "tRPC"],
          correctIndex: 0,
          explanation:
            "gRPC gives compact Protobuf payloads over HTTP/2, generated clients for many languages, deadlines and streaming. tRPC is TypeScript-only, and GraphQL's flexibility buys little between services that know their contracts.",
        },
      ],
    },
  ],
} satisfies Module;
