import type { Module } from "@/types/curriculum";

// Shared fixtures for the fsgql-apollo challenge.
const authorField = { name: "author", selections: ["__typename", "id", "name"] };
const postFields = ["__typename", "id", "title", authorField];
const postsQuery = [{ name: "posts", args: { first: 2 }, selections: postFields }];
const feedQuery = [{ name: "feed", selections: postFields }];
const postByIdQuery = (id: string) => [{ name: "post", args: { id }, selections: ["__typename", "id", "title"] }];
const statsQuery = (fields: string[]) => [{ name: "post", args: { id: "1" }, selections: ["__typename", "id", { name: "stats", selections: fields }] }];
const ada = { __typename: "User", id: "7", name: "Ada" };
const post1 = { __typename: "Post", id: "1", title: "Hello", author: ada };
const post2 = { __typename: "Post", id: "2", title: "Caching", author: ada };
const normalizedPosts = (rootKey: string) => ({
  ROOT_QUERY: { [rootKey]: [{ __ref: "Post:1" }, { __ref: "Post:2" }] },
  "Post:1": { __typename: "Post", id: "1", title: "Hello", author: { __ref: "User:7" } },
  "User:7": { __typename: "User", id: "7", name: "Ada" },
  "Post:2": { __typename: "Post", id: "2", title: "Caching", author: { __ref: "User:7" } },
});
const bigFeedQuery = [{ name: "feed", selections: ["__typename", "id", "title", "tags", authorField] }];
const bigFeed = {
  feed: Array.from({ length: 500 }, (_, i) => ({
    __typename: "Post",
    id: String(i),
    title: "Post " + i,
    tags: ["t" + (i % 3)],
    author: { __typename: "User", id: "u" + (i % 5), name: "User " + (i % 5) },
  })),
};

export default {
  id: "fs-graphql",
  trackId: "fullstack",
  name: "GraphQL Full-Stack",
  description:
    "GraphQL across the whole stack: designing the schema as the contract between teams, wiring Apollo Server 5 to Apollo Client 4 (auth context, CORS, the normalized cache, mutations and optimistic UI), and deciding honestly where GraphQL beats REST in a real product and where it doesn't. Assumes you can already write queries and resolvers.",
  refs: [
    { label: "GraphQL: Learn", url: "https://graphql.org/learn/", kind: "docs" },
    { label: "GraphQL Specification (September 2025)", url: "https://spec.graphql.org/September2025/", kind: "spec" },
    { label: "Apollo Client documentation", url: "https://www.apollographql.com/docs/react", kind: "docs" },
    { label: "Apollo Server documentation", url: "https://www.apollographql.com/docs/apollo-server", kind: "docs" },
  ],
  topics: [
    {
      id: "fsgql-schema-first",
      moduleId: "fs-graphql",
      trackId: "fullstack",
      title: "Schema-First API Design",
      summary:
        "Schema-first means the SDL is the contract you design and review before any resolver exists: types, nullability, arguments and mutation payloads are agreed with the frontend, checked into the repo, and turned into TypeScript types for both server resolvers and client operations by a code generator. Frontend and backend can then build in parallel against a mocked schema, and breaking changes surface in review or a schema-check CI step instead of in production.\n\nGood schemas model the product, not the tables. Design fields around what screens need, expose relationships as fields rather than lists of foreign keys, give every entity a stable `id` (clients normalize their caches on `__typename` plus `id`), use cursor connections for lists that grow, take one `input` object per mutation (the September 2025 spec's `@oneOf` input objects express \"exactly one of these\"), and return a payload containing the changed objects so clients can update their caches without refetching. Expected business failures, like a taken username, belong in the schema as typed results or payload errors rather than as strings in the top-level `errors` array.\n\nNullability is the decision people get wrong. When a non-null field can't be resolved, the null propagates to the nearest nullable ancestor, so one failing `author: User!` can wipe out a whole list of posts, or `data` itself. Make fields that depend on other services or permissions nullable, and reserve `!` for values you can always produce. Evolution follows the same logic: adding fields, or optional arguments, is safe, and so is tightening an output field to non-null; removing a field, loosening an output to nullable, or making an argument required breaks clients. Deprecate with `@deprecated(reason:)` and watch field usage before deleting anything.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "GraphQL: Schemas and Types", url: "https://graphql.org/learn/schema/", kind: "docs" },
        { label: "GraphQL Specification (September 2025)", url: "https://spec.graphql.org/September2025/", kind: "spec" },
        { label: "GraphQL: Best Practices", url: "https://graphql.org/learn/best-practices/", kind: "article" },
        { label: "Apollo: Errors as data explained", url: "https://www.apollographql.com/docs/graphos/schema-design/guides/errors-as-data-explained", kind: "article" },
      ],
      video: {
        title: "GraphQL Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=5199E50O7SI",
        videoId: "5199E50O7SI",
        durationLabel: "1:28:59",
        startSeconds: 1542,
        chapterLabel: "Schema & Types",
      },
      alternateVideos: [
        {
          title: "Proven Schema Designs and Best-practices - Jeff Dolle, The Guild",
          channel: "GraphQL TV",
          url: "https://www.youtube.com/watch?v=DoD7KJpiIkM",
          videoId: "DoD7KJpiIkM",
          durationLabel: "25:21",
        },
        {
          title: "The Do’s and Don’ts for your schema and GraphQL operations",
          channel: "Apollo GraphQL",
          url: "https://www.youtube.com/watch?v=fG8zy1OROp4",
          videoId: "fG8zy1OROp4",
          durationLabel: "24:46",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "fsgql-schema-first-q1",
          prompt:
            "Given this schema, the query `{ posts { title author { name } } }` matches three posts, but the `author` resolver throws for the second one. What does the response contain?\n\n```graphql\ntype Query { posts: [Post!]! }\ntype Post { id: ID! title: String! author: User! }\ntype User { id: ID! name: String! }\n```",
          options: [
            "`data: null` plus one error: the null propagates from `author` to the `Post!` item, to the `[Post!]!` list, to the non-null `posts` field, and finally to `data`",
            "Three posts, with `author: null` on the second, plus one error",
            "Two posts, with the failing one dropped, plus one error",
            "An HTTP 500 response with no `data` at all",
          ],
          correctIndex: 0,
          explanation:
            "An execution error on a non-null position makes that position null, which is illegal, so it propagates to the parent, repeating until it reaches a nullable position. Here nothing in the chain is nullable, so the whole `data` becomes `null`, while the error still lists the failing path.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsgql-schema-first-q2",
          prompt:
            "With the schema `type Query { posts: [Post!]! }` and `type Post { ... author: User! }`, the `author` resolver throws for the second of three posts. Which single-field changes would keep the other two posts in the response? (Select all that apply.)",
          options: [
            "Make `Post.author` nullable (`author: User`)",
            "Make the list items nullable (`posts: [Post]!`)",
            "Make `Query.posts` nullable (`posts: [Post!]`)",
            "Make `User.name` nullable (`name: String`)",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "A nullable `author` stops the propagation at the field (post two keeps its title), and nullable items stop it at the list element (post two becomes `null`). A nullable `posts` catches it one level too high and loses the whole list, and `name` isn't where the error happens.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsgql-schema-first-q3",
          prompt: "What does a schema-first workflow with a code generator (such as GraphQL Code Generator) give a full-stack team?",
          options: [
            "One reviewed SDL contract from which typed resolver signatures and typed client operations are generated, so drift between tiers shows up as type errors",
            "Database migrations generated automatically from the SDL",
            "Resolvers generated from the schema, so none need to be written",
            "Runtime enforcement of TypeScript types inside resolvers",
          ],
          correctIndex: 0,
          explanation:
            "The schema becomes the single source of truth, and both sides compile against types derived from it. It says nothing about storage, and TypeScript types disappear at runtime; GraphQL's own execution still validates results against the schema.",
        },
        {
          id: "fsgql-schema-first-q4",
          prompt: "Which design choices make an `updatePost` mutation easier for clients to integrate? (Select all that apply.)",
          options: [
            "A single `input: UpdatePostInput!` argument",
            "A payload that includes the updated `Post` with its `id`, so normalized caches update automatically",
            "Typed expected errors in the payload, such as `userErrors { field message }`, for validation failures",
            "Returning `Boolean!` to keep responses small",
            "Separate mutations per field, such as `updatePostTitle` and `updatePostBody`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "An input object evolves without breaking the signature, returning the object lets clients refresh their caches from the response, and typed user errors give the UI something to render. A bare boolean forces a refetch, and per-field mutations multiply round trips and lose atomicity.",
        },
        {
          id: "fsgql-schema-first-q5",
          prompt: "Which schema changes can break existing clients? (Select all that apply.)",
          options: [
            "Changing an output field from `String!` to `String`",
            "Making an optional argument required",
            "Removing a field that clients still query",
            "Adding a new nullable field to a type",
            "Changing an output field from `String` to `String!`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Clients may assume a non-null output never needs a null check, old queries don't send a newly required argument, and a removed field fails validation. Tightening an output to non-null only removes a case clients already handle, and new fields are invisible until someone asks for them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsgql-schema-first-q6",
          prompt: "How do you replace `Post.body` with `Post.content` without breaking mobile apps that update slowly?",
          options: [
            "Add `content`, mark `body` with `@deprecated(reason: \"Use content\")`, keep resolving both, and remove `body` only when field-usage metrics show old clients are gone",
            "Serve the new schema at `/graphql/v2`",
            "Rename the field and rely on clients ignoring fields they don't recognise",
            "Make `body` return `null` immediately so clients notice",
          ],
          correctIndex: 0,
          explanation:
            "GraphQL is designed to evolve without versions: deprecation shows up in tooling and introspection, and usage reporting tells you when it's safe to remove. A rename fails validation for every query that still asks for `body`.",
        },
        {
          id: "fsgql-schema-first-q7",
          prompt: "Why should every object type the UI displays expose a stable `id`?",
          options: [
            "Normalized client caches key objects by `__typename` plus `id`; without it, the same object in two queries can't be merged and mutation results can't update what's on screen",
            "GraphQL validation rejects object types without an `id` field",
            "Resolvers can't run without an `id` on the parent",
            "IDs make responses smaller",
          ],
          correctIndex: 0,
          explanation:
            "Apollo Client and Relay both rely on stable identity to deduplicate and update data. Without it, objects are stored inside their parents, so an edit in one place doesn't reach the others.",
        },
        {
          id: "fsgql-schema-first-q8",
          prompt:
            "The feed uses `posts(offset: Int, limit: Int)`. Users scrolling while new posts arrive see duplicates. Which schema design avoids it?",
          options: [
            "Cursor-based connections: `posts(first: 20, after: $cursor)` returning `edges { cursor node }` and `pageInfo { hasNextPage endCursor }`",
            "A larger `limit`, so fewer pages are needed",
            "Returning the whole list and paginating on the client",
            "Adding a `@cacheControl` directive to the field",
          ],
          correctIndex: 0,
          explanation:
            "An offset counts positions, so inserts shift every later page; a cursor names the last item seen, so the next page starts after it no matter what was inserted. The connection shape also leaves room for per-edge metadata.",
        },
        {
          id: "fsgql-schema-first-q9",
          prompt: "A `user` field must accept exactly one of `id`, `email` or `username`. What does the September 2025 GraphQL spec offer?",
          options: [
            "A OneOf input object: `input UserBy @oneOf { id: ID email: String username: String }`, where exactly one field must be provided and non-null",
            "A union of input types: `union UserBy = ID | String`",
            "Nothing: three nullable arguments plus a runtime check are the only option",
            "An input that implements an interface: `input UserBy implements OneOf`",
          ],
          correctIndex: 0,
          explanation:
            "The September 2025 edition added OneOf input objects and the `@oneOf` directive, so validation rejects zero or multiple fields before any resolver runs. Unions and interfaces are output-only concepts.",
        },
        {
          id: "fsgql-schema-first-q10",
          prompt: "Sign-up can fail because the username is taken. Where should that failure live?",
          options: [
            "In the schema, as a typed result (for example `union SignUpResult = SignUpSuccess | UsernameTaken`) or payload errors, reserving top-level `errors` for the unexpected",
            "In the top-level `errors` array, with the message \"Username taken\"",
            "In an HTTP `409` status from the GraphQL endpoint",
            "Nowhere: return `null` for the user and let the client guess",
          ],
          correctIndex: 0,
          explanation:
            "Expected outcomes are part of the product, so modelling them in the schema makes them typed, discoverable and exhaustively handleable. Top-level errors are untyped strings meant for failures the client can't act on.",
        },
        {
          id: "fsgql-schema-first-q11",
          prompt:
            "A first draft mirrors the Mongo collections: `type User { orderIds: [ID!]! }` plus a separate `ordersByIds(ids: [ID!]!)` query. What's the schema-first critique?",
          options: [
            "It leaks the storage model and forces clients into request waterfalls; expose the relationship as a field such as `User.orders(first:, after:)` and let resolvers do the join",
            "IDs must never appear in a GraphQL schema",
            "Lists of IDs aren't valid GraphQL types",
            "Nothing: mapping 1:1 to the database is ideal",
          ],
          correctIndex: 0,
          explanation:
            "The point of a graph is traversing relationships in one request; handing out foreign keys recreates REST's round trips inside GraphQL. Relationship fields also let you add pagination and authorization in one place.",
        },
        {
          id: "fsgql-schema-first-q12",
          prompt: "Where should the rule \"only admins can see `User.email`\" be enforced in a GraphQL server?",
          options: [
            "In the resolver, or the business layer it calls, using the viewer from `context`, with `email` nullable so other viewers get `null` (or a typed error)",
            "Only in the client, by not requesting the field",
            "By hiding the field from introspection",
            "In a description comment on the field",
          ],
          correctIndex: 0,
          explanation:
            "Any client can ask for any field, so authorization has to run where the data is resolved. Hiding it from introspection is obscurity, not access control, and a non-null `email` would turn every denied read into a propagating error.",
        },
      ],
    },
    {
      id: "fsgql-apollo",
      moduleId: "fs-graphql",
      trackId: "fullstack",
      title: "Apollo Server + Apollo Client Integration",
      summary:
        "Apollo is the most common way to carry GraphQL through a full stack, and both halves have had major releases recently. Apollo Server 5 (version 4 reached end of life in January 2026) requires Node.js 20+ and graphql 16.11+, moves Express support into a separate package (`@as-integrations/express5`), and answers variable-coercion errors with `400`. Put per-request state in `context`: the viewer resolved from the cookie or `Authorization` header, and fresh DataLoader instances so batching caches never leak between users. For cookie auth, `startStandaloneServer`'s fixed wildcard CORS won't do; mount the Express integration with an exact origin and `credentials: true`. Apollo's CSRF prevention also rejects GET and multipart requests that lack a preflight-forcing header such as `Apollo-Require-Preflight`.\n\nApollo Client 4 moved the React hooks to `@apollo/client/react`, requires an explicit `HttpLink` (with `credentials: \"include\"` for cookies), and replaced `ApolloError` with classes like `CombinedGraphQLErrors` and `ServerError`. Its `InMemoryCache` normalizes every object that has a `__typename` and `id` into a flat store keyed `Type:id`, swaps nested objects for references, and merges fields arriving from different queries, so a mutation that returns the updated object refreshes every screen showing it. What normalization can't infer is list membership: after a create, the new object is cached but no list contains it until an `update` function inserts it with `cache.modify`, or you refetch; after a delete, `cache.evict` removes it.\n\nFetch policies set the freshness tradeoff: `cache-first` by default, `cache-and-network` for fast-but-fresh, `network-only` and `no-cache`. `optimisticResponse` renders a predicted result instantly in a separate layer that's discarded if the server returns an error. By default any GraphQL error throws away partial data; `errorPolicy: \"all\"` keeps both, which suits dashboards where one failing widget shouldn't blank the page.",
      level: "expert",
      estMinutes: 100,
      webRefs: [
        { label: "Apollo Client: Caching in Apollo Client", url: "https://www.apollographql.com/docs/react/caching/overview", kind: "docs" },
        { label: "Apollo Client: Mutations (updating local data)", url: "https://www.apollographql.com/docs/react/data/mutations", kind: "docs" },
        { label: "Apollo Client: Migrating to Apollo Client 4.0", url: "https://www.apollographql.com/docs/react/migrating/apollo-client-4-migration", kind: "docs" },
        { label: "Apollo Server: Migrating from Apollo Server 4", url: "https://www.apollographql.com/docs/apollo-server/migration", kind: "docs" },
      ],
      video: {
        title: "GraphQL Crash Course With Full Stack MERN Project",
        channel: "Traversy Media",
        url: "https://www.youtube.com/watch?v=BcLNfwF04Kw",
        videoId: "BcLNfwF04Kw",
        durationLabel: "3:14:38",
        startSeconds: 5130,
        chapterLabel: "Setting Up Apollo",
      },
      alternateVideos: [
        {
          title: "GraphQL Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=5199E50O7SI",
          videoId: "5199E50O7SI",
          durationLabel: "1:28:59",
          startSeconds: 1184,
          chapterLabel: "Making a GraphQL Server (with Apollo)",
        },
        {
          title: "Build: Updating your cache with Apollo Client",
          channel: "Apollo GraphQL",
          url: "https://www.youtube.com/watch?v=ZhdGLMeXnvI",
          videoId: "ZhdGLMeXnvI",
          durationLabel: "4:23",
        },
        {
          title: "Optimistic UI updates with Apollo Client and React - Richard Carrigan",
          channel: "Apollo GraphQL",
          url: "https://www.youtube.com/watch?v=XZTCPX0S5Vc",
          videoId: "XZTCPX0S5Vc",
          durationLabel: "22:44",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createCache()`, a small version of Apollo Client's `InMemoryCache`. It returns `{ identify, write, read, modify, evict, extract }` working over one flat store object.\n\nSelection sets are arrays: a string is a scalar field (`\"title\"`), and `{ name, args?, selections }` is an object field whose value is an object, a list of objects, or `null`.\n\n- `identify(obj)` returns the cache ID `\"<__typename>:<id>\"`, falling back to `_id` when `id` is `undefined` or `null`. It returns `null` when there's no string `__typename` or no usable ID.\n- **Storage keys**: a field without arguments is stored under its name. With arguments it's stored under `name(<args as JSON with keys sorted>)`, so `{ orderBy: \"NEW\", first: 2 }` and `{ first: 2, orderBy: \"NEW\" }` both give `posts({\"first\":2,\"orderBy\":\"NEW\"})`. Sort the keys of nested argument objects too.\n- `write(selections, data, rootId = \"ROOT_QUERY\")` normalizes `data` into `store[rootId]`. For each selected field: skip it when `data` doesn't have it (`undefined`); store scalars as they are, arrays of scalars included; store `null` as `null`; map lists item by item. An object with a cache ID is merged into `store[id]` (incoming fields overwrite, other existing fields are kept) and replaced by `{ __ref: id }`. An object without an ID is stored inline with its own normalized fields and replaces whatever was there, because the cache can't tell it's the same object. The root object is merged like an entity.\n- `read(selections, rootId = \"ROOT_QUERY\")` builds a result shaped exactly like the selections, following references. If any selected field is missing, the whole read returns `null`: a cache miss, since Apollo won't hand you partial data from the cache. A list item that refers to an entity no longer in the store is skipped; a single field that refers to a missing entity is a miss.\n- `modify(id, fieldKey, updater)` replaces `store[id][fieldKey]` with `updater(currentValue)` and returns `true`, or returns `false` when the entity or field doesn't exist.\n- `evict(id)` deletes `store[id]` and returns whether it existed.\n- `extract()` returns a deep copy of the store.\n\nThe tests call `runCacheScript`, which applies a list of steps (writing query and mutation results, reading, evicting, and a `modify` that prepends a reference to a list, the way an `update` function would) and returns what each read, extract, identify, evict and prepend step produced. Leave the driver as it is.",
        starterCode: `/**
 * A small Apollo-style normalized cache.
 *
 * A selection set is an array. Each entry is either a scalar field name ("title") or an object
 * field { name, args?, selections } whose value is an object, a list of objects, or null.
 *
 * @returns {{
 *   identify: (obj: object) => string | null,
 *   write: (selections: Array<string | object>, data: object, rootId?: string) => void,
 *   read: (selections: Array<string | object>, rootId?: string) => object | null,
 *   modify: (id: string, fieldKey: string, updater: (value: unknown) => unknown) => boolean,
 *   evict: (id: string) => boolean,
 *   extract: () => object,
 * }}
 */
function createCache() {
  const store = {};
  // Your code here
  return {
    identify(obj) {},
    write(selections, data, rootId = "ROOT_QUERY") {},
    read(selections, rootId = "ROOT_QUERY") {},
    modify(id, fieldKey, updater) {},
    evict(id) {},
    extract() {},
  };
}

// ---- Test driver (leave as is) ----
// Steps: ["write", selections, data], ["writeMutation", selections, data] (root "ROOT_MUTATION"),
// ["read", selections], ["extract"], ["identify", object], ["evict", id],
// ["prepend", fieldKey, id] (cache.modify on ROOT_QUERY that puts { __ref: id } first in a list).
function runCacheScript(steps) {
  const cache = createCache();
  const log = [];
  for (const [op, a, b] of steps) {
    if (op === "write") cache.write(a, b);
    else if (op === "writeMutation") cache.write(a, b, "ROOT_MUTATION");
    else if (op === "read") log.push(cache.read(a));
    else if (op === "extract") log.push(cache.extract());
    else if (op === "identify") log.push(cache.identify(a));
    else if (op === "evict") log.push(cache.evict(a));
    else if (op === "prepend") log.push(cache.modify("ROOT_QUERY", a, (list) => [{ __ref: b }, ...(list || [])]));
  }
  return log;
}
`,
        functionName: "runCacheScript",
        testCases: [
          {
            description: "normalizes nested objects into Type:id entries and stores the shared author once",
            args: [[["write", postsQuery, { posts: [post1, post2] }], ["extract"]]],
            expected: [normalizedPosts('posts({"first":2})')],
          },
          {
            description: "reads a query back in exactly the shape it was written with",
            args: [[["write", postsQuery, { posts: [post1, post2] }], ["read", postsQuery]]],
            expected: [{ posts: [post1, post2] }],
          },
          {
            description: "a field that was never fetched, or the same field with other arguments, is a cache miss",
            args: [
              [
                ["write", postsQuery, { posts: [post1, post2] }],
                ["read", [{ name: "posts", args: { first: 2 }, selections: ["__typename", "id", "title", { name: "author", selections: ["__typename", "id", "name", "email"] }] }]],
                ["read", [{ name: "posts", args: { first: 3 }, selections: postFields }]],
              ],
            ],
            expected: [null, null],
            isEdgeCase: true,
          },
          {
            description: "a different query returning the same Post updates every list that references it",
            args: [
              [
                ["write", postsQuery, { posts: [post1, post2] }],
                ["write", postByIdQuery("1"), { post: { __typename: "Post", id: "1", title: "Hello, world" } }],
                ["read", postsQuery],
              ],
            ],
            expected: [{ posts: [{ ...post1, title: "Hello, world" }, post2] }],
          },
          {
            description: "a create mutation caches the new Post, but no list contains it until an update function adds the reference",
            args: [
              [
                ["write", feedQuery, { feed: [post1, post2] }],
                ["writeMutation", [{ name: "createPost", args: { title: "Draft" }, selections: postFields }], { createPost: { __typename: "Post", id: "3", title: "Draft", author: ada } }],
                ["read", feedQuery],
                ["prepend", "feed", "Post:3"],
                ["read", feedQuery],
              ],
            ],
            expected: [{ feed: [post1, post2] }, true, { feed: [{ __typename: "Post", id: "3", title: "Draft", author: ada }, post1, post2] }],
            isEdgeCase: true,
          },
          {
            description: "evicting a deleted entity drops it from lists, while a single field pointing at it becomes a miss",
            args: [
              [
                ["write", feedQuery, { feed: [post1, post2] }],
                ["write", postByIdQuery("2"), { post: { __typename: "Post", id: "2", title: "Caching" } }],
                ["evict", "Post:2"],
                ["read", feedQuery],
                ["read", postByIdQuery("2")],
                ["evict", "Post:2"],
              ],
            ],
            expected: [true, { feed: [post1] }, null, false],
            isEdgeCase: true,
          },
          {
            description: "an object without an id is stored inline and replaced on each write, so fields from the earlier query are lost",
            args: [
              [
                ["write", statsQuery(["likes", "views"]), { post: { __typename: "Post", id: "1", stats: { likes: 3, views: 40 } } }],
                ["write", statsQuery(["likes"]), { post: { __typename: "Post", id: "1", stats: { likes: 4 } } }],
                ["read", statsQuery(["likes", "views"])],
                ["extract"],
              ],
            ],
            expected: [null, { ROOT_QUERY: { 'post({"id":"1"})': { __ref: "Post:1" } }, "Post:1": { __typename: "Post", id: "1", stats: { likes: 4 } } }],
            isEdgeCase: true,
          },
          {
            description: "argument order doesn't change the storage key",
            args: [
              [
                ["write", [{ name: "posts", args: { orderBy: "NEW", first: 2 }, selections: postFields }], { posts: [post1, post2] }],
                ["read", [{ name: "posts", args: { first: 2, orderBy: "NEW" }, selections: postFields }]],
                ["extract"],
              ],
            ],
            expected: [{ posts: [post1, post2] }, normalizedPosts('posts({"first":2,"orderBy":"NEW"})')],
            isEdgeCase: true,
          },
          {
            description: "identify combines __typename with id, falls back to _id, and returns null without a typename",
            args: [
              [
                ["identify", { __typename: "User", _id: "64f1" }],
                ["identify", { id: "1" }],
                ["identify", { __typename: "Post", id: 5 }],
              ],
            ],
            expected: ["User:64f1", null, "Post:5"],
          },
          {
            description: "a null object field is stored and read back as null, not as a miss",
            args: [
              [
                ["write", feedQuery, { feed: [{ __typename: "Post", id: "9", title: "Anonymous", author: null }] }],
                ["read", feedQuery],
              ],
            ],
            expected: [{ feed: [{ __typename: "Post", id: "9", title: "Anonymous", author: null }] }],
          },
          {
            description: "500 posts sharing 5 authors round-trip through the cache, scalar arrays included",
            args: [[["write", bigFeedQuery, bigFeed], ["read", bigFeedQuery]]],
            expected: [bigFeed],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "fsgql-vs-rest",
      moduleId: "fs-graphql",
      trackId: "fullstack",
      title: "GraphQL vs REST in a Real Full-Stack App",
      summary:
        "The honest comparison isn't query language versus URLs; it's where the complexity lives. GraphQL moves response shaping to the client: one round trip fetches exactly the fields a screen needs across related objects, the typed schema doubles as documentation, and the API evolves by adding fields and deprecating old ones instead of versioning endpoints. That pays off when several clients (web, mobile, partners) need different slices of the same data, or when a backend-for-frontend stitches microservices together.\n\nThe complexity doesn't vanish; it moves to the server. Nested fields resolve independently, so `posts { author { name } }` naively runs one author query per post: the N+1 problem, solved with DataLoader instances created per request, since a shared one leaks cached data between users. Arbitrary client queries need depth and cost limits, capped list sizes and, ideally, persisted operations, because rate-limiting requests is meaningless when one request can ask for a million nodes. Observability shifts too: a GraphQL error often arrives as HTTP 200 with an `errors` array, so status-code dashboards miss it unless you track errors per operation.\n\nREST keeps the web's plumbing working for free. Resource URLs are cacheable by browsers and CDNs, while GraphQL's usual POST to a single endpoint isn't, unless you adopt GET with persisted queries. REST fits simple CRUD, public APIs, uploads and downloads, and webhooks, and its clients cache responses by URL or query key. GraphQL clients get a normalized cache that updates every screen from one mutation result, at the price of IDs everywhere and manual list updates. Many production apps mix the two: GraphQL for the product UI, REST for webhooks, files and public endpoints.",
      level: "expert",
      estMinutes: 50,
      webRefs: [
        { label: "GraphQL: Performance", url: "https://graphql.org/learn/performance/", kind: "docs" },
        { label: "GraphQL: Security", url: "https://graphql.org/learn/security/", kind: "docs" },
        { label: "Apollo Server: Configuring CORS (and CSRF prevention)", url: "https://www.apollographql.com/docs/apollo-server/security/cors", kind: "docs" },
        { label: "graphql/dataloader", url: "https://github.com/graphql/dataloader", kind: "repo" },
      ],
      video: {
        title: "GraphQL Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=5199E50O7SI",
        videoId: "5199E50O7SI",
        durationLabel: "1:28:59",
      },
      alternateVideos: [
        {
          title: "What Is GraphQL? REST vs. GraphQL",
          channel: "ByteByteGo",
          url: "https://www.youtube.com/watch?v=yWzKJPw_VzM",
          videoId: "yWzKJPw_VzM",
          durationLabel: "5:14",
        },
        {
          title: "GraphQL N+1 Problem",
          channel: "Ben Awad",
          url: "https://www.youtube.com/watch?v=uCbFMZYQbxE",
          videoId: "uCbFMZYQbxE",
          durationLabel: "16:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "fsgql-vs-rest-q1",
          prompt:
            "Every resolver issues one SQL query per call and there's no batching. How many queries does this operation send to the database, and roughly how many with per-request DataLoaders?\n\n```graphql\n{\n  posts(first: 10) {\n    title\n    author { name }\n    comments(first: 5) {\n      body\n      author { name }\n    }\n  }\n}\n```",
          options: [
            "71 without batching (1 + 10 authors + 10 comment lists + 50 comment authors); about 4 with DataLoaders (posts, post authors, comments, comment authors)",
            "16 without batching; 1 with DataLoaders",
            "2, because GraphQL runs one query per nesting level",
            "1, because GraphQL compiles the operation into a single SQL join",
          ],
          correctIndex: 0,
          explanation:
            "Each resolver runs once per parent object, so costs multiply with nesting. DataLoader collects the keys requested in the same tick and issues one batched query per loader per level; post authors and comment authors resolve at different depths, so they're separate batches.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsgql-vs-rest-q2",
          prompt: "A `DataLoader` for users is created once at module scope and shared by all requests. What goes wrong?",
          options: [
            "Its memoization cache is never cleared, so data goes stale and, with per-viewer permissions, a user loaded for one viewer can be served to another; create loaders per request in `context`",
            "Batching stops working after the first request",
            "It throws, because DataLoader instances can't be reused",
            "Nothing: sharing it maximizes cache hits",
          ],
          correctIndex: 0,
          explanation:
            "DataLoader's cache is a per-request memo, not an application cache; the library's docs recommend a new instance per request. Cross-request caching belongs in a real cache with its own invalidation and authorization rules.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsgql-vs-rest-q3",
          prompt: "Which statements about HTTP and CDN caching are true? (Select all that apply.)",
          options: [
            "`GET /api/products/42` can be cached by browsers and CDNs with standard headers",
            "A typical GraphQL `POST /graphql` isn't cached by CDNs",
            "Persisted queries sent over GET (identified by a hash) make GraphQL responses cacheable at a CDN",
            "GraphQL responses can't carry `Cache-Control` headers",
            "REST responses are cached by default even without caching headers",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "HTTP caches key on method and URL, which suits resource-per-URL APIs. GraphQL can opt in with GET plus persisted query hashes and computed `Cache-Control` headers, and no API gets meaningful caching without deliberate headers.",
        },
        {
          id: "fsgql-vs-rest-q4",
          prompt:
            "Error alerts fire on 5xx rates. After moving the web app to GraphQL, a resolver fails on 30% of requests but no alert fires. Why?",
          options: [
            "GraphQL servers commonly answer with HTTP 200, an `errors` array and partial data, so failures have to be tracked per operation and error code",
            "GraphQL retries failed resolvers automatically until they succeed",
            "Apollo Server hides resolver errors in production",
            "Browsers strip GraphQL errors before monitoring tools see them",
          ],
          correctIndex: 0,
          explanation:
            "A resolver failure is an execution error inside a well-formed response, not a transport failure. Instrument errors by operation name and `extensions.code` (for example with an Apollo Server plugin or your tracing tool).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsgql-vs-rest-q5",
          prompt: "Which protections matter more for a public GraphQL API than for an equivalent REST API? (Select all that apply.)",
          options: [
            "Query depth and cost (complexity) limits",
            "Maximums on list arguments such as `first`",
            "Persisted operations, so first-party clients can only run known queries",
            "HTTPS",
            "Password hashing",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A single GraphQL request can fan out to enormous work, so limits have to apply to the shape and cost of queries. HTTPS and password hashing matter equally for any API.",
        },
        {
          id: "fsgql-vs-rest-q6",
          prompt: "The product needs avatar uploads. What do most GraphQL stacks do?",
          options: [
            "Return a presigned upload URL from a mutation (or a REST endpoint) and let the browser upload straight to object storage, keeping the file out of GraphQL",
            "Base64-encode the file into a `String` argument",
            "Stream the bytes over a GraphQL subscription",
            "Nothing: GraphQL can't reference files at all",
          ],
          correctIndex: 0,
          explanation:
            "Multipart GraphQL uploads are awkward to secure and scale (Apollo Server requires a preflight-forcing header for them), and base64 inflates payloads by a third while hitting body limits. Presigned URLs offload the bytes entirely.",
        },
        {
          id: "fsgql-vs-rest-q7",
          prompt:
            "A plain HTML form posts `multipart/form-data` to an Apollo Server endpoint, and a teammate's script sends `GET /graphql?query=...` with no custom headers. Apollo Server rejects both. Why?",
          options: [
            "Its default CSRF prevention requires GET and multipart requests to carry a header that forces a CORS preflight, such as `Apollo-Require-Preflight`",
            "GraphQL doesn't allow GET requests",
            "Apollo Server only accepts WebSocket connections",
            "Multipart requests are only accepted in development",
          ],
          correctIndex: 0,
          explanation:
            "Those requests can be sent cross-site without a preflight, so a malicious page could trigger them with the user's cookies. Requiring a non-simple header means the browser must ask permission first, and your CORS policy decides.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "fsgql-vs-rest-q8",
          prompt: "A mobile screen needs a user's name, their 3 latest orders and each order's first item name. How do typical REST and GraphQL designs compare?",
          options: [
            "REST often needs several round trips (or a screen-specific endpoint) and returns unused fields; GraphQL fetches exactly those fields in one request while the server resolves the relationships",
            "GraphQL needs one round trip per nesting level",
            "REST always transfers less data than GraphQL",
            "GraphQL removes the need for database joins",
          ],
          correctIndex: 0,
          explanation:
            "This is the over- and under-fetching argument, and it matters most on high-latency mobile networks. The server still does the joins (or batched lookups); GraphQL just lets the client describe the shape.",
        },
        {
          id: "fsgql-vs-rest-q9",
          prompt: "How do the two styles usually handle a breaking change to the order representation?",
          options: [
            "REST typically adds a versioned endpoint or media type; GraphQL adds a new field, deprecates the old one and tracks usage until it can be removed",
            "GraphQL serves a parallel schema at `/graphql/v2`",
            "REST APIs never need versioning",
            "GraphQL forces every client to upgrade in lockstep",
          ],
          correctIndex: 0,
          explanation:
            "Because clients ask for fields explicitly, GraphQL servers know exactly who uses what and can evolve additively. REST responses are fixed shapes, so incompatible changes usually mean a new version.",
        },
        {
          id: "fsgql-vs-rest-q10",
          prompt: "A product is renamed. In which setup does every screen showing it update without extra code?",
          options: [
            "Apollo Client, when the mutation returns the product with `__typename` and `id`, because the normalized cache entry changes; a REST client with a query-key cache (such as TanStack Query) must invalidate or update the affected keys",
            "A REST client, because ETags update every cached response automatically",
            "Neither: both require a full page reload",
            "Apollo Client, because it refetches every active query after any mutation",
          ],
          correctIndex: 0,
          explanation:
            "Normalization means one entity is stored once and referenced everywhere. Query-key caches store whole responses per key, so you invalidate or patch each affected key. Neither refetches everything by default.",
        },
        {
          id: "fsgql-vs-rest-q11",
          prompt:
            "Which parts of a full-stack app are usually better served by plain REST endpoints, even when the product UI uses GraphQL? (Select all that apply.)",
          options: [
            "Incoming webhooks from Stripe or GitHub",
            "Large file uploads and downloads",
            "A public API that partners want to cache and consume with ordinary HTTP tools",
            "A dashboard screen that combines data from five services",
            "A mobile screen that needs nested related data in one request",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Webhook senders and file transfers speak plain HTTP, and partners benefit from cacheable, curl-friendly resources. Aggregating services and fetching nested data for a screen are exactly where GraphQL shines.",
        },
      ],
    },
  ],
} satisfies Module;
