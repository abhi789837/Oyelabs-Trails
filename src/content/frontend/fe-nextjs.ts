import type { Module } from "@/types/curriculum";

// Test fixture for the route-matching challenge: an app/ directory listing (plain data, shared by its tests).
// Deliberately ordered so that "first match in file order" gives the wrong answer.
const ROUTE_FILES = [
  "layout.tsx",
  "[lang]/about/page.tsx",
  "[lang]/about/team/page.tsx",
  "(marketing)/page.tsx",
  "(marketing)/about/page.tsx",
  "(shop)/layout.tsx",
  "(shop)/cart/page.tsx",
  "docs/[[...path]]/page.tsx",
  "shop/[...slug]/page.tsx",
  "shop/[id]/page.tsx",
  "blog/[slug]/[tab]/page.tsx",
  "blog/[slug]/page.tsx",
  "blog/[slug]/opengraph-image.tsx",
  "blog/page.tsx",
  "blog/loading.tsx",
  "blog/featured/page.tsx",
  "blog/_components/PostCard.tsx",
  "blog/_drafts/page.tsx",
  "api/users/[id]/route.ts",
  "api/users/route.ts",
  "@modal/(.)photos/[id]/page.tsx",
  "@modal/default.tsx",
  "@analytics/default.tsx",
  "@analytics/views/page.tsx",
  "feed/page.tsx",
  "feed/(..)photos/[id]/page.tsx",
  "photos/[id]/page.tsx",
];

export default {
  id: "fe-nextjs",
  trackId: "frontend",
  name: "Next.js",
  description:
    "The App Router as it works in Next.js 16: file-system routing, the Server/Client Component boundary, Cache Components (`use cache`, `cacheLife`, `cacheTag`) and revalidation, Server Actions, Route Handlers, Proxy (the renamed Middleware), rendering from SSG to Partial Prerendering, metadata, image and font optimisation, authentication and deployment. Written for engineers who already know React: the emphasis is on the defaults that changed in 15 and 16 and the security and caching mistakes that reach production.",
  refs: [
    { label: "Next.js Docs", url: "https://nextjs.org/docs", kind: "docs" },
    { label: "Next.js Docs: Getting Started (App Router)", url: "https://nextjs.org/docs/app/getting-started", kind: "docs" },
    { label: "Next.js Blog: Next.js 16", url: "https://nextjs.org/blog/next-16", kind: "article" },
  ],
  topics: [
    {
      id: "next-app-router-routing",
      moduleId: "fe-nextjs",
      trackId: "frontend",
      title: "File-Based Routing & the App Router",
      summary:
        "The App Router turns the `app/` folder into a route tree: folders are URL segments, and a segment only becomes public when it contains a `page` (UI) or `route` (HTTP handler) file, so components, tests and utilities can be colocated safely. Each segment's special files render in a fixed hierarchy: `layout` (persists and keeps state across navigations), `template` (remounts on navigation), then `error`, `loading` (a Suspense boundary) and `not-found` around the `page`. `error` wraps the page but not the layout of its own segment, so a throwing layout is caught by the parent's boundary, and error boundaries must be Client Components.\n\nFolder syntax covers most URL design without a config file. `(group)` folders organise code and scope layouts without appearing in the URL, `_private` folders opt out of routing, `[slug]` captures one segment, `[...slug]` one or more and `[[...slug]]` zero or more. `@slot` folders are parallel routes passed to a layout as props (every slot needs a `default.js` since Next.js 16), and `(.)`, `(..)` or `(...)` folders intercept a route during client-side navigation, the classic modal over a feed, while a refresh renders the real page.\n\nPrecedence is decided left to right, segment by segment: static beats dynamic, which beats catch-all, which beats optional catch-all. So `/blog/about` goes to `blog/[slug]` even if `[lang]/about` exists. Two groups resolving to the same path, or a `page` and a `route` in one folder, fail the build. And `params` and `searchParams` are Promises: Next.js 15 kept a synchronous fallback, Next.js 16 removed it, so pages `await` them (or unwrap them with `use()` in a Client Component).",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Next.js Docs: Project Structure", url: "https://nextjs.org/docs/app/getting-started/project-structure", kind: "docs" },
        { label: "Next.js Docs: Dynamic Route Segments", url: "https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes", kind: "docs" },
        { label: "Next.js Docs: Parallel Routes", url: "https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes", kind: "docs" },
        { label: "Next.js Learn: Creating Layouts and Pages", url: "https://nextjs.org/learn/dashboard-app/creating-layouts-and-pages", kind: "article" },
      ],
      video: {
        title: "Next.js 16 Full Course | Build and Deploy a Production-Ready Full Stack App",
        channel: "JavaScript Mastery",
        url: "https://www.youtube.com/watch?v=I1V9YWqRIeI",
        videoId: "I1V9YWqRIeI",
        durationLabel: "4:10:17",
        startSeconds: 1420,
        chapterLabel: "Routing",
      },
      alternateVideos: [
        {
          title: "Learn Next.js Parallel Routes In 16 Minutes",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=wi8kF8UniUI",
          videoId: "wi8kF8UniUI",
          durationLabel: "16:17",
        },
        {
          title: "Learn Next.js Intercepting Routes In 11 Minutes",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=zDZBKEvU8b0",
          videoId: "zDZBKEvU8b0",
          durationLabel: "11:07",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `matchRoute(files, url)`, a simplified version of how the App Router maps a URL to a file.\n\n`files` are paths relative to `app/` with forward slashes, such as `\"(shop)/cart/page.tsx\"` or `\"blog/[slug]/page.tsx\"`. Build the route table first:\n\n- Only files named `page` or `route` (any extension) define a route. Layouts, loading files, metadata files and colocated components are ignored.\n- Ignore any file inside a private folder (`_name`), a parallel-route slot (`@name`) or an intercepting folder (a name starting with `(.)`, `(..)` or `(...)`), at any depth. Slots render inside a layout and interception only applies to client-side navigation, so neither creates a URL of its own here.\n- Route groups (`(name)`) are dropped from the URL pattern.\n- If two route files end up with the same pattern (two groups that both define `about`, or a `page` and a `route` in the same folder), return `{ error: \"conflict\", files: [first, second] }` for the first such pair in input order, whatever the URL. Next.js fails the build in this case.\n\nThen match `url`:\n\n- Ignore the query string and hash, ignore empty segments (so a trailing slash doesn't matter) and `decodeURIComponent` each segment. Matching is case-sensitive.\n- `[x]` matches exactly one segment (the param is a string), `[...x]` one or more and `[[...x]]` zero or more (both give an array of strings). When an optional catch-all matches nothing, omit its key.\n- Precedence follows Next.js: compare candidate routes segment by segment from the left. At the first position where they differ, a static segment beats a dynamic one, which beats a catch-all, which beats an optional catch-all. The first route in that order that matches the URL wins, so the order of `files` must not matter.\n- Return `{ file, params }` for the winner (`params` is `{}` when there are none), or `null` if nothing matches.",
        starterCode: `/**
 * @param {string[]} files  paths relative to app/, e.g. "(shop)/cart/page.tsx"
 * @param {string} url      e.g. "/blog/hello?ref=x"
 * @returns {{ file: string, params: object } | { error: "conflict", files: string[] } | null}
 */
function matchRoute(files, url) {
  // Your code here
}
`,
        functionName: "matchRoute",
        testCases: [
          {
            description: "route groups disappear from the URL, so `(marketing)/page.tsx` serves `/`",
            args: [ROUTE_FILES, "/"],
            expected: { file: "(marketing)/page.tsx", params: {} },
          },
          {
            description: "a trailing slash is ignored and the group-scoped cart page matches",
            args: [ROUTE_FILES, "/cart/"],
            expected: { file: "(shop)/cart/page.tsx", params: {} },
          },
          {
            description: "a static segment beats a dynamic one even when the dynamic route is listed first",
            args: [ROUTE_FILES, "/blog/featured"],
            expected: { file: "blog/featured/page.tsx", params: {} },
          },
          {
            description: "params are URL-decoded",
            args: [ROUTE_FILES, "/blog/hello%20world"],
            expected: { file: "blog/[slug]/page.tsx", params: { slug: "hello world" } },
          },
          {
            description: "precedence is decided left to right: `blog/[slug]` wins over `[lang]/about` for `/blog/about`",
            args: [ROUTE_FILES, "/blog/about"],
            expected: { file: "blog/[slug]/page.tsx", params: { slug: "about" } },
            isEdgeCase: true,
          },
          {
            description: "counting static segments is wrong: `blog/[slug]/[tab]` beats `[lang]/about/team`",
            args: [ROUTE_FILES, "/blog/about/team"],
            expected: { file: "blog/[slug]/[tab]/page.tsx", params: { slug: "about", tab: "team" } },
            isEdgeCase: true,
          },
          {
            description: "a root-level dynamic segment still matches when nothing static does",
            args: [ROUTE_FILES, "/en/about/team"],
            expected: { file: "[lang]/about/team/page.tsx", params: { lang: "en" } },
          },
          {
            description: "a single dynamic segment beats a catch-all",
            args: [ROUTE_FILES, "/shop/42"],
            expected: { file: "shop/[id]/page.tsx", params: { id: "42" } },
          },
          {
            description: "a catch-all collects the remaining segments into an array",
            args: [ROUTE_FILES, "/shop/a/b"],
            expected: { file: "shop/[...slug]/page.tsx", params: { slug: ["a", "b"] } },
          },
          {
            description: "a required catch-all needs at least one segment, so `/shop` is a 404",
            args: [ROUTE_FILES, "/shop"],
            expected: null,
            isEdgeCase: true,
          },
          {
            description: "an optional catch-all also matches its bare path, with no param key",
            args: [ROUTE_FILES, "/docs"],
            expected: { file: "docs/[[...path]]/page.tsx", params: {} },
            isEdgeCase: true,
          },
          {
            description: "query strings and hashes are not part of the match",
            args: [ROUTE_FILES, "/docs/a/b/c?x=1#top"],
            expected: { file: "docs/[[...path]]/page.tsx", params: { path: ["a", "b", "c"] } },
          },
          {
            description: "a slot with an intercepting route creates no URL of its own",
            args: [ROUTE_FILES, "/pricing"],
            expected: null,
            isEdgeCase: true,
          },
          {
            description: "a page that exists only inside a parallel slot isn't a route by itself",
            args: [ROUTE_FILES, "/views"],
            expected: null,
            isEdgeCase: true,
          },
          {
            description: "an intercepting folder like `feed/(..)photos` doesn't create `/feed/photos/...`",
            args: [ROUTE_FILES, "/feed/photos/7"],
            expected: null,
            isEdgeCase: true,
          },
          {
            description: "the real `photos/[id]` page serves hard navigations to a photo",
            args: [ROUTE_FILES, "/photos/7"],
            expected: { file: "photos/[id]/page.tsx", params: { id: "7" } },
          },
          {
            description: "a private folder isn't routable, so the dynamic segment catches `/blog/_drafts`",
            args: [ROUTE_FILES, "/blog/_drafts"],
            expected: { file: "blog/[slug]/page.tsx", params: { slug: "_drafts" } },
            isEdgeCase: true,
          },
          {
            description: "route handlers match like pages",
            args: [ROUTE_FILES, "/api/users/9?expand=1"],
            expected: { file: "api/users/[id]/route.ts", params: { id: "9" } },
          },
          {
            description: "two route groups resolving to the same path are a conflict",
            args: [["(marketing)/about/page.tsx", "(shop)/about/page.tsx"], "/about"],
            expected: { error: "conflict", files: ["(marketing)/about/page.tsx", "(shop)/about/page.tsx"] },
            isEdgeCase: true,
          },
          {
            description: "a page and a route handler in the same folder are a conflict",
            args: [["page.tsx", "dashboard/page.tsx", "dashboard/route.ts"], "/"],
            expected: { error: "conflict", files: ["dashboard/page.tsx", "dashboard/route.ts"] },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "next-server-client-components",
      moduleId: "fe-nextjs",
      trackId: "frontend",
      title: "Server Components vs Client Components",
      summary:
        "In the App Router every layout and page is a Server Component by default: it runs only on the server (at build time or per request), can read databases and secrets directly, and ships none of its code to the browser. React serialises the rendered tree into the RSC Payload, which holds the Server Components' output, placeholders and JS references for Client Components, and the props passed to them. Client Components (`\"use client\"`) are still rendered to HTML on the server for the first load; the name means their code also runs in the browser, where it hydrates and handles state, effects and events.\n\n`\"use client\"` marks a boundary in the module graph, not a property of one component: everything that file imports becomes client code, so put the directive on small interactive leaves rather than layouts. Data crosses the boundary only as serialisable props. Plain functions can't cross; Server Functions (`\"use server\"`) cross as references. Server Components can still appear inside Client Components when passed as `children` or other props: the Client Component receives rendered output, not code, because the owner (the component whose JSX creates the element) decides where it renders, not the parent it ends up in.\n\nThe costly mistakes are about leakage. Every prop given to a Client Component is serialised into the page, so passing a whole user row exposes every field. A module that reads secrets, imported into a Client Component, joins the client bundle; non-`NEXT_PUBLIC_` env vars aren't inlined, so it breaks rather than leaks, and `import \"server-only\"` turns the mistake into a build error. Context providers must be Client Components, and compound components that hang parts off static properties (`Menu.Item`) break when used from a Server Component.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Next.js Docs: Server and Client Components", url: "https://nextjs.org/docs/app/getting-started/server-and-client-components", kind: "docs" },
        { label: "Next.js Docs: The Server and Client Boundary", url: "https://nextjs.org/docs/app/guides/server-and-client-boundary", kind: "docs" },
        { label: "Josh W. Comeau: Making Sense of React Server Components", url: "https://www.joshwcomeau.com/react/server-components/", kind: "article" },
        { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "React Explained: 'use client'",
        channel: "Delba",
        url: "https://www.youtube.com/watch?v=eO51VVCpTk0",
        videoId: "eO51VVCpTk0",
        durationLabel: "15:57",
      },
      alternateVideos: [
        {
          title: "Next.js 16 Full Course | Build and Deploy a Production-Ready Full Stack App",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=I1V9YWqRIeI",
          videoId: "I1V9YWqRIeI",
          durationLabel: "4:10:17",
          startSeconds: 1036,
          chapterLabel: "React Client & Server Components",
        },
        {
          title: "When & Where to Add “use client” in React / Next.js (Client Components vs Server Components)",
          channel: "ByteGrad",
          url: "https://www.youtube.com/watch?v=Qdkg_mrniLk",
          videoId: "Qdkg_mrniLk",
          durationLabel: "10:33",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "next-server-client-components-q1",
          prompt:
            "Where does `Cart` run?\n\n```tsx\n// app/ui/modal.tsx\n\"use client\";\nimport { useState } from \"react\";\n\nexport function Modal({ children }: { children: React.ReactNode }) {\n  const [open, setOpen] = useState(false);\n  return (\n    <>\n      <button onClick={() => setOpen(true)}>Open cart</button>\n      {open && children}\n    </>\n  );\n}\n\n// app/page.tsx (a Server Component)\nimport { Modal } from \"./ui/modal\";\nimport { Cart } from \"./ui/cart\"; // async Server Component that queries the database\n\nexport default function Page() {\n  return (\n    <Modal>\n      <Cart />\n    </Modal>\n  );\n}\n```",
          options: [
            "On the server: its rendered output reaches `Modal` as `children`, and its code never ships to the browser",
            "In the browser: a component rendered inside a Client Component becomes a Client Component",
            "Nowhere: the build fails because a Client Component can't receive an async component as children",
            "On the server, but only after the button is clicked, through a second request",
          ],
          correctIndex: 0,
          explanation:
            "`Page` owns the `<Cart />` element, and the owner decides where a component renders, so `Cart` renders on the server ahead of time (even while the modal is closed) and travels in the RSC Payload. `Modal` is only the parent that places the output; no second request is needed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-server-client-components-q2",
          prompt:
            "`app/dashboard/dashboard.tsx` starts with `\"use client\"` and imports `./chart` and `./table`, neither of which has a directive. Which of these modules end up in the client bundle?",
          options: [
            "All three: every module a client module imports joins the client module graph",
            "Only `dashboard`; `chart` and `table` stay Server Components because they have no directive",
            "Only the modules that use hooks or event handlers",
            "None of them until they're wrapped in `next/dynamic`",
          ],
          correctIndex: 0,
          explanation:
            "The directive marks an entry point into the client graph, and code crosses through imports. You only need `\"use client\"` at the boundary, which is exactly why putting it high in the tree (on a layout) pulls so much code into the bundle.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-server-client-components-q3",
          prompt:
            "A Server Component renders `<ProductCard />`, which is a Client Component. Which props can it pass? (Select all that apply.)",
          options: [
            "`product={{ id: 1, name: \"Mug\", price: 12 }}`",
            "`reviews={getReviews(id)}`, an unresolved Promise the card reads with `use()`",
            "`addToCartAction={addToCart}`, where `addToCart` is a Server Function marked `\"use server\"`",
            "`badge={<SaleBadge />}`, a rendered element",
            "`onClick={() => console.log(\"clicked\")}`",
            "`product={new Product(row)}`, a class instance",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Props that cross the boundary must be serialisable by React: plain objects, Promises (streamed and unwrapped with `use()`), Server Function references and rendered elements all are. An ordinary function can't be sent (passing one throws), and class instances aren't serialisable.",
        },
        {
          id: "next-server-client-components-q4",
          prompt:
            "A user opens `/settings` with a full page load. Where does this log appear?\n\n```tsx\n\"use client\";\n\nexport function ThemeToggle() {\n  console.log(\"render ThemeToggle\");\n  return <button>Toggle theme</button>;\n}\n```",
          options: [
            "In the server terminal and in the browser console",
            "Only in the browser console, because Client Components never run on the server",
            "Only in the server terminal, because the first load is server-rendered",
            "Nowhere in production, because the directive strips side effects",
          ],
          correctIndex: 0,
          explanation:
            "On a direct visit a Client Component is rendered to HTML on the server and rendered again in the browser during hydration. On a later client-side navigation it renders only in the browser, from the RSC Payload.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-server-client-components-q5",
          prompt:
            "`lib/data.ts` exports `getData()`, which calls an API with `headers: { authorization: process.env.API_KEY }`. A Client Component imports and calls it, and nothing else is configured. What happens?",
          options: [
            "It builds, but in the browser `API_KEY` isn't inlined (only `NEXT_PUBLIC_` variables are), so the call goes out without the key",
            "The build fails because Client Components can't reference `process.env`",
            "Next.js inlines the key into the client bundle, leaking it to every visitor",
            "Next.js detects the server-only code and runs `getData` on the server automatically",
          ],
          correctIndex: 0,
          explanation:
            "Only `NEXT_PUBLIC_` variables are inlined into client JavaScript; anything else gets no value there, so the code silently misbehaves instead of leaking. Nothing moves the call to the server for you; that's what a Server Component, Server Function or Route Handler is for.",
        },
        {
          id: "next-server-client-components-q6",
          prompt: "What does adding `import \"server-only\"` at the top of that `lib/data.ts` change?",
          options: [
            "Importing the module from a Client Component becomes a build-time error",
            "It encrypts `process.env` values before they're sent to the client",
            "It turns `getData` into a Server Function the browser can call",
            "It logs a warning in development but still bundles the module",
          ],
          correctIndex: 0,
          explanation:
            "`server-only` marks the module as belonging to the server graph, and Next.js fails the build if the client graph imports it (installing the npm package is optional; Next.js handles the import itself). It doesn't encrypt or proxy anything.",
        },
        {
          id: "next-server-client-components-q7",
          prompt: "You need a theme context across the whole app. Which approach works in the App Router?",
          options: [
            "A `\"use client\"` `ThemeProvider` that renders `{children}`, rendered from the root layout, so pages below can stay Server Components",
            "Call `createContext` in the root layout (a Server Component) and read it with `useContext` in pages",
            "Add `\"use client\"` to the root layout so the whole tree can use context",
            "Store the theme with `React.cache` so Server and Client Components share it",
          ],
          correctIndex: 0,
          explanation:
            "Context isn't supported in Server Components, so the provider must be a Client Component, but its `children` are created by the layout and stay Server Components. Marking the root layout as a client module would drag the entire app into the client graph, and `React.cache` is a per-request server memo, not shared state.",
        },
        {
          id: "next-server-client-components-q8",
          prompt:
            "What happens when this renders?\n\n```tsx\n// ui/menu.tsx\n\"use client\";\nexport function Menu({ children }: { children: React.ReactNode }) {\n  return <ul role=\"menu\">{children}</ul>;\n}\nfunction Item({ children }: { children: React.ReactNode }) {\n  return <li role=\"menuitem\">{children}</li>;\n}\nMenu.Item = Item;\n\n// app/page.tsx (a Server Component)\nimport { Menu } from \"@/ui/menu\";\n\nexport default function Page() {\n  return (\n    <Menu>\n      <Menu.Item>Profile</Menu.Item>\n    </Menu>\n  );\n}\n```",
          options: [
            "React throws \"Element type is invalid\": the Server Component gets a client reference for `Menu`, so `Menu.Item` is `undefined`",
            "It works: static properties are serialised along with the component",
            "`Menu.Item` renders as a Server Component nested in the Client Component",
            "The build fails because Client Components can't have static properties",
          ],
          correctIndex: 0,
          explanation:
            "Importing a client module into a Server Component gives you a reference, not the function, so properties hung off it don't exist. Export the pieces as named exports (`MenuItem`) or use the compound component from another Client Component.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-server-client-components-q9",
          prompt:
            "A shared layout has a logo, some nav links and one interactive search box. Which setup ships the least client JavaScript?",
          options: [
            "Keep the layout a Server Component and add `\"use client\"` only to `SearchBar`",
            "Add `\"use client\"` to the layout so the search box can use state",
            "Add `\"use client\"` to every component in the layout so hydration is consistent",
            "Render the whole layout inside a `useEffect` after the page loads",
          ],
          correctIndex: 0,
          explanation:
            "Only the interactive leaf needs to be a client module; the logo and links render on the server and ship no JavaScript. Moving the boundary up to the layout puts everything it imports into the bundle, and rendering in an effect delays content and hurts SEO.",
        },
        {
          id: "next-server-client-components-q10",
          prompt:
            "A Server Component loads a full `user` row (including `email` and `passwordHash`) and renders `<Avatar user={user} />`. `Avatar` is a Client Component that only displays `user.name`. What reaches the browser?",
          options: [
            "The whole object, because every prop passed to a Client Component is serialised into the RSC Payload",
            "Only `name`, because React strips fields the component never reads",
            "Nothing, because props are consumed during server rendering",
            "The whole object in development only; production builds drop unused fields",
          ],
          correctIndex: 0,
          explanation:
            "Serialisation doesn't know which fields a component reads, so the entire row is embedded in the page. Pass a minimal DTO (`{ name, avatarUrl }`) from a server-only data layer; React's experimental taint APIs are a backstop, not a substitute.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-server-client-components-q11",
          prompt: "Which statements about Client Components are true? (Select all that apply.)",
          options: [
            "They're rendered to HTML on the server for the initial page load",
            "On client-side navigations they render in the browser without server-rendered HTML",
            "Their code is sent to the browser, which is what \"client\" refers to",
            "A Client Component module can import a Server Component module and keep it server-only",
            "Their props are left out of the RSC Payload",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "\"Client\" means the code also runs in the browser, not that it only runs there. Anything a client module imports becomes client code (to nest server output, pass it as `children`), and Client Component props are exactly what the payload carries.",
        },
      ],
    },
    {
      id: "next-data-fetching-caching",
      moduleId: "fe-nextjs",
      trackId: "frontend",
      title: "Data Fetching & Caching Strategies",
      summary:
        "Next.js caches at several layers, and most stale-data bugs come from not knowing which one you hit. Within one render, identical `fetch` calls are memoised and `React.cache` dedupes ORM calls; neither outlives the request. Across requests, `fetch` hasn't been cached by default since Next.js 15. Next.js 16's Cache Components model (`cacheComponents: true`) makes caching explicit: data is dynamic unless a function, component or file is marked `\"use cache\"`, given a lifetime with `cacheLife` and tagged with `cacheTag`. Uncached or request-specific work (`cookies()`, `headers()`, `searchParams`) must sit behind `<Suspense>`, or the build points at the blocking route.\n\nA `cacheLife` profile has three clocks: `stale` (how long the client router reuses a result), `revalidate` (after it, the next request still gets the cached value and triggers a background refresh) and `expire` (after it with no traffic, the next request waits for fresh data). On-demand invalidation comes in two flavours: `revalidateTag(tag, \"max\")` marks entries stale and keeps serving them while they refresh, right for a CMS webhook, while `updateTag(tag)`, which only works in Server Actions, expires them so users see their own writes. `revalidatePath` invalidates by route instead of by data.\n\nThe traps: arguments and closed-over values form the cache key and must be serialisable, and a cached scope can't call `cookies()` itself, so read it outside and pass the value in. On serverless, runtime `use cache` entries live in per-instance memory and rarely survive between requests (`\"use cache: remote\"` exists for that), and every deploy starts cold because the build ID is part of each key. Without Cache Components, a route that uses no request-time APIs is still prerendered at build time, so an un-optioned `fetch` gets frozen into static HTML.",
      level: "expert",
      estMinutes: 90,
      isMilestone: true,
      webRefs: [
        { label: "Next.js Docs: Caching (Cache Components)", url: "https://nextjs.org/docs/app/getting-started/caching", kind: "docs" },
        { label: "Next.js Docs: use cache", url: "https://nextjs.org/docs/app/api-reference/directives/use-cache", kind: "docs" },
        { label: "Next.js Docs: cacheLife", url: "https://nextjs.org/docs/app/api-reference/functions/cacheLife", kind: "docs" },
        { label: "Next.js Blog: Our Journey with Caching", url: "https://nextjs.org/blog/our-journey-with-caching", kind: "article" },
      ],
      video: {
        title: "Composition, Caching, and Architecture in modern Next.js",
        channel: "Vercel",
        url: "https://www.youtube.com/watch?v=iRGc8KQDyQ8",
        videoId: "iRGc8KQDyQ8",
        durationLabel: "29:47",
      },
      alternateVideos: [
        {
          title: "Next.js 'use cache' in 100 seconds",
          channel: "Delba",
          url: "https://www.youtube.com/watch?v=OWmRn74CQKY",
          videoId: "OWmRn74CQKY",
          durationLabel: "2:04",
        },
        {
          title: "Hands On: How To Migrate To Next.js 16 and \"Use Cache”",
          channel: "Vercel",
          url: "https://www.youtube.com/watch?v=Bk0ZAi2aV5w",
          videoId: "Bk0ZAi2aV5w",
          durationLabel: "37:00",
        },
        {
          title: "Next.js 16 Full Course | Build and Deploy a Production-Ready Full Stack App",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=I1V9YWqRIeI",
          videoId: "I1V9YWqRIeI",
          durationLabel: "4:10:17",
          startSeconds: 3165,
          chapterLabel: "Caching",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Model the server side of Next.js 16 Cache Components: time-based expiry with `cacheLife` profiles and on-demand invalidation with `revalidateTag` and `updateTag`. Implement `createCache(now, customProfiles)`, which returns an object with the three methods below. `now()` returns the fake clock in seconds; never use real time.\n\nProfiles. A profile is a preset name (see `PRESET_PROFILES` in the starter), a custom name from `customProfiles`, or an inline object. Resolve it the way `cacheLife` in `next.config` works:\n\n- `undefined` means `default`, and `customProfiles.default` (if present) overrides fields of the preset `default`.\n- Custom profiles and inline objects inherit any missing field from that (possibly overridden) `default`. A custom profile wins over a preset of the same name.\n- An unknown name throws `new Error('Unknown cacheLife profile \"<name>\"')`. Resolve the profile before fetching, so a bad profile fetches and stores nothing.\n- Only `revalidate` and `expire` matter here; `stale` is the client router's clock.\n\n`read(key, fetcher, { profile, tags })` returns `{ value, status }`. `fetcher()` synchronously returns the current source value. Storing an entry records the value, `now()`, the profile's `revalidate` and `expire`, and the tags, and clears any invalidation marks.\n\n- No entry: fetch, store and return the value with status `\"MISS\"`.\n- Expired (age at least `expire`, or `now()` has reached an invalidation deadline): the request blocks, so fetch, store and return the fresh value with `\"MISS\"`.\n- Otherwise stale (age at least `revalidate`, or marked stale by a tag): return the old value with `\"STALE\"`, then regenerate in the background, which here means fetching and storing straight away so the next read sees the new value.\n- Otherwise return the cached value with `\"HIT\"`, without fetching.\n\n`revalidateTag(tag, profile)` marks every entry carrying `tag` (exact, case-sensitive match) as stale and sets its deadline to `now()` plus a stale window: the resolved profile's `expire` for a name (so `\"max\"` allows a year), `profile.expire` for an object, and `0` when the profile is omitted (the deprecated one-argument form, which expires immediately). If an entry already has an earlier deadline, keep the earlier one. Nothing is fetched until the next read.\n\n`updateTag(tag, context)` expires tagged entries immediately (deadline `now()`) for read-your-own-writes. It's only allowed in Server Actions: if `context` isn't `\"action\"`, throw `new Error(\"updateTag can only be called from within a Server Action\")` and change nothing.\n\nThe tests call `runCacheScenario(config, events)`, which replays writes, reads and invalidations on the fake clock and reports every read (or error) plus how many times the data source was fetched. Leave the driver as it is.",
        starterCode: `// Preset cacheLife profiles (seconds), as documented for Next.js 16.
// \`stale\` drives the client router cache and is ignored by this server-side simulator.
const PRESET_PROFILES = {
  default: { stale: 300, revalidate: 900, expire: Infinity },
  seconds: { stale: 30, revalidate: 1, expire: 60 },
  minutes: { stale: 300, revalidate: 60, expire: 3600 },
  hours: { stale: 300, revalidate: 3600, expire: 86400 },
  days: { stale: 300, revalidate: 86400, expire: 604800 },
  weeks: { stale: 300, revalidate: 604800, expire: 2592000 },
  max: { stale: 300, revalidate: 2592000, expire: 31536000 },
};

/**
 * @param {() => number} now  current fake time in seconds
 * @param {Record<string, object>} customProfiles  like \`cacheLife\` in next.config: adds or overrides profiles
 */
function createCache(now, customProfiles) {
  return {
    read(key, fetcher, options) {
      // Your code here: return { value, status }
    },
    revalidateTag(tag, profile) {
      // Your code here
    },
    updateTag(tag, context) {
      // Your code here
    },
  };
}

// ---- Test driver (leave as is) ----
// config: { keys: { [key]: { profile?, tags? } }, profiles?: {...}, summaryOnly?: boolean }
// events (sorted by \`at\`, in seconds):
//   { at, write: key, value }                  update the data source
//   { at, read: key }                          read through the cache
//   { at, revalidateTag: tag, profile? }       profile omitted = deprecated one-argument form
//   { at, updateTag: tag, from: "action" | "route" }
function runCacheScenario(config, events) {
  let clock = 0;
  const source = {};
  const log = [];
  const counts = { HIT: 0, STALE: 0, MISS: 0 };
  let fetches = 0;
  const cache = createCache(() => clock, config.profiles || {});
  for (const event of events) {
    clock = event.at;
    try {
      if ("write" in event) {
        source[event.write] = event.value;
      } else if ("read" in event) {
        const key = event.read;
        const options = (config.keys || {})[key] || {};
        const fetcher = () => {
          fetches++;
          return key in source ? source[key] : null;
        };
        const res = cache.read(key, fetcher, { profile: options.profile, tags: options.tags || [] });
        if (!res || typeof res !== "object") throw new Error("read() must return { value, status }");
        counts[res.status] = (counts[res.status] || 0) + 1;
        log.push({ at: clock, key, value: res.value, status: res.status });
      } else if ("revalidateTag" in event) {
        if ("profile" in event) cache.revalidateTag(event.revalidateTag, event.profile);
        else cache.revalidateTag(event.revalidateTag);
      } else if ("updateTag" in event) {
        cache.updateTag(event.updateTag, event.from);
      }
    } catch (e) {
      log.push({ at: clock, error: String((e && e.message) || e) });
    }
  }
  return config.summaryOnly ? { counts, fetches } : { log, fetches };
}
`,
        functionName: "runCacheScenario",
        testCases: [
          {
            description: "time-based revalidation: HIT, then STALE at the `revalidate` mark with a background refresh",
            args: [
              { keys: { posts: { profile: "hours", tags: ["posts"] } } },
              [
                { at: 0, write: "posts", value: "v1" },
                { at: 0, read: "posts" },
                { at: 10, write: "posts", value: "v2" },
                { at: 100, read: "posts" },
                { at: 3600, read: "posts" },
                { at: 3601, read: "posts" },
              ],
            ],
            expected: {
              log: [
                { at: 0, key: "posts", value: "v1", status: "MISS" },
                { at: 100, key: "posts", value: "v1", status: "HIT" },
                { at: 3600, key: "posts", value: "v1", status: "STALE" },
                { at: 3601, key: "posts", value: "v2", status: "HIT" },
              ],
              fetches: 2,
            },
          },
          {
            description: "after `expire` with no traffic, the next request blocks on fresh data instead of serving stale",
            args: [
              { keys: { posts: { profile: "hours" } } },
              [
                { at: 0, write: "posts", value: "v1" },
                { at: 0, read: "posts" },
                { at: 50, write: "posts", value: "v2" },
                { at: 90000, read: "posts" },
              ],
            ],
            expected: {
              log: [
                { at: 0, key: "posts", value: "v1", status: "MISS" },
                { at: 90000, key: "posts", value: "v2", status: "MISS" },
              ],
              fetches: 2,
            },
          },
          {
            description: "`revalidateTag(tag, \"max\")` serves stale once while it refreshes, then the new value",
            args: [
              { keys: { "product-1": { profile: "max", tags: ["products", "product-1"] } } },
              [
                { at: 0, write: "product-1", value: "$10" },
                { at: 0, read: "product-1" },
                { at: 5, write: "product-1", value: "$12" },
                { at: 10, revalidateTag: "products", profile: "max" },
                { at: 11, read: "product-1" },
                { at: 12, read: "product-1" },
              ],
            ],
            expected: {
              log: [
                { at: 0, key: "product-1", value: "$10", status: "MISS" },
                { at: 11, key: "product-1", value: "$10", status: "STALE" },
                { at: 12, key: "product-1", value: "$12", status: "HIT" },
              ],
              fetches: 2,
            },
          },
          {
            description: "`updateTag` from a Server Action gives read-your-own-writes on the very next read",
            args: [
              { keys: { profile: { profile: "days", tags: ["user-7"] } } },
              [
                { at: 0, write: "profile", value: "Ada" },
                { at: 0, read: "profile" },
                { at: 5, write: "profile", value: "Ada L." },
                { at: 10, updateTag: "user-7", from: "action" },
                { at: 10, read: "profile" },
                { at: 11, read: "profile" },
              ],
            ],
            expected: {
              log: [
                { at: 0, key: "profile", value: "Ada", status: "MISS" },
                { at: 10, key: "profile", value: "Ada L.", status: "MISS" },
                { at: 11, key: "profile", value: "Ada L.", status: "HIT" },
              ],
              fetches: 2,
            },
          },
          {
            description: "`updateTag` outside a Server Action throws and invalidates nothing",
            args: [
              { keys: { profile: { profile: "days", tags: ["user-7"] } } },
              [
                { at: 0, write: "profile", value: "Ada" },
                { at: 0, read: "profile" },
                { at: 5, write: "profile", value: "Ada L." },
                { at: 10, updateTag: "user-7", from: "route" },
                { at: 11, read: "profile" },
              ],
            ],
            expected: {
              log: [
                { at: 0, key: "profile", value: "Ada", status: "MISS" },
                { at: 10, error: "updateTag can only be called from within a Server Action" },
                { at: 11, key: "profile", value: "Ada", status: "HIT" },
              ],
              fetches: 1,
            },
            isEdgeCase: true,
          },
          {
            description: "the deprecated one-argument `revalidateTag(tag)` expires immediately",
            args: [
              { keys: { posts: { profile: "max", tags: ["posts"] } } },
              [
                { at: 0, write: "posts", value: "v1" },
                { at: 0, read: "posts" },
                { at: 5, write: "posts", value: "v2" },
                { at: 10, revalidateTag: "posts" },
                { at: 10, read: "posts" },
              ],
            ],
            expected: {
              log: [
                { at: 0, key: "posts", value: "v1", status: "MISS" },
                { at: 10, key: "posts", value: "v2", status: "MISS" },
              ],
              fetches: 2,
            },
            isEdgeCase: true,
          },
          {
            description: "a custom stale window: stale inside it, a blocking refresh once it has passed",
            args: [
              { keys: { posts: { profile: "max", tags: ["posts"] } } },
              [
                { at: 0, write: "posts", value: "v1" },
                { at: 0, read: "posts" },
                { at: 5, write: "posts", value: "v2" },
                { at: 10, revalidateTag: "posts", profile: { expire: 60 } },
                { at: 69, read: "posts" },
                { at: 70, write: "posts", value: "v3" },
                { at: 71, revalidateTag: "posts", profile: { expire: 60 } },
                { at: 200, read: "posts" },
              ],
            ],
            expected: {
              log: [
                { at: 0, key: "posts", value: "v1", status: "MISS" },
                { at: 69, key: "posts", value: "v1", status: "STALE" },
                { at: 200, key: "posts", value: "v3", status: "MISS" },
              ],
              fetches: 3,
            },
            isEdgeCase: true,
          },
          {
            description: "tags are case-sensitive and only tagged entries are affected",
            args: [
              {
                keys: {
                  list: { profile: "max", tags: ["posts"] },
                  "post-1": { profile: "max", tags: ["posts", "post-1"] },
                  authors: { profile: "max", tags: ["authors"] },
                },
              },
              [
                { at: 0, write: "list", value: "L1" },
                { at: 0, write: "post-1", value: "P1" },
                { at: 0, write: "authors", value: "A1" },
                { at: 1, read: "list" },
                { at: 1, read: "post-1" },
                { at: 1, read: "authors" },
                { at: 2, write: "list", value: "L2" },
                { at: 2, write: "post-1", value: "P2" },
                { at: 2, write: "authors", value: "A2" },
                { at: 3, revalidateTag: "Posts", profile: "max" },
                { at: 4, read: "list" },
                { at: 5, revalidateTag: "post-1", profile: "max" },
                { at: 6, read: "list" },
                { at: 6, read: "post-1" },
                { at: 6, read: "authors" },
                { at: 7, read: "post-1" },
              ],
            ],
            expected: {
              log: [
                { at: 1, key: "list", value: "L1", status: "MISS" },
                { at: 1, key: "post-1", value: "P1", status: "MISS" },
                { at: 1, key: "authors", value: "A1", status: "MISS" },
                { at: 4, key: "list", value: "L1", status: "HIT" },
                { at: 6, key: "list", value: "L1", status: "HIT" },
                { at: 6, key: "post-1", value: "P1", status: "STALE" },
                { at: 6, key: "authors", value: "A1", status: "HIT" },
                { at: 7, key: "post-1", value: "P2", status: "HIT" },
              ],
              fetches: 4,
            },
            isEdgeCase: true,
          },
          {
            description: "custom profiles inherit from an overridden `default`; an unknown profile throws before fetching",
            args: [
              {
                profiles: { default: { revalidate: 60 }, biweekly: { revalidate: 86400, expire: 1209600 } },
                keys: { a: {}, b: { profile: "biweekly" }, c: { profile: "fortnightly" } },
              },
              [
                { at: 0, write: "a", value: "a1" },
                { at: 0, write: "b", value: "b1" },
                { at: 0, write: "c", value: "c1" },
                { at: 0, read: "a" },
                { at: 0, read: "b" },
                { at: 0, read: "c" },
                { at: 60, read: "a" },
                { at: 60, read: "b" },
                { at: 1209600, read: "b" },
              ],
            ],
            expected: {
              log: [
                { at: 0, key: "a", value: "a1", status: "MISS" },
                { at: 0, key: "b", value: "b1", status: "MISS" },
                { at: 0, error: "Unknown cacheLife profile \"fortnightly\"" },
                { at: 60, key: "a", value: "a1", status: "STALE" },
                { at: 60, key: "b", value: "b1", status: "HIT" },
                { at: 1209600, key: "b", value: "b1", status: "MISS" },
              ],
              fetches: 4,
            },
            isEdgeCase: true,
          },
          {
            description: "an inline profile inherits `expire: Infinity` from `default`, so it goes stale but never expires",
            args: [
              { keys: { feed: { profile: { revalidate: 30 } } } },
              [
                { at: 0, write: "feed", value: "f1" },
                { at: 0, read: "feed" },
                { at: 29, write: "feed", value: "f2" },
                { at: 29, read: "feed" },
                { at: 30, read: "feed" },
                { at: 31, read: "feed" },
                { at: 999999999, read: "feed" },
              ],
            ],
            expected: {
              log: [
                { at: 0, key: "feed", value: "f1", status: "MISS" },
                { at: 29, key: "feed", value: "f1", status: "HIT" },
                { at: 30, key: "feed", value: "f1", status: "STALE" },
                { at: 31, key: "feed", value: "f2", status: "HIT" },
                { at: 999999999, key: "feed", value: "f2", status: "STALE" },
              ],
              fetches: 3,
            },
          },
          {
            description: "an hour of reads every 10 s on the `minutes` profile: one fetch per revalidation window",
            args: [
              { summaryOnly: true, keys: { ticker: { profile: "minutes" } } },
              [
                { at: 0, write: "ticker", value: 1 },
                ...Array.from({ length: 361 }, (_, i) => ({ at: i * 10, read: "ticker" })),
              ],
            ],
            expected: { counts: { HIT: 300, STALE: 60, MISS: 1 }, fetches: 61 },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "next-server-actions",
      moduleId: "fe-nextjs",
      trackId: "frontend",
      title: "Server Actions & Form Mutations",
      summary:
        "A Server Function is an async function marked `\"use server\"`; used for a mutation, through a form's `action`, a button's `formAction` or a call inside `startTransition`, it's called a Server Action. The compiler replaces it in client bundles with an encrypted action ID that POSTs back to the page, so forms work before hydration (progressive enhancement), and the return value plus the re-rendered route come back in one round trip. With `useActionState(action, initialState)` the action receives `(prevState, formData)` and returns serialisable state, such as field errors, alongside a `pending` flag.\n\nThe model that prevents incidents: every action is a public POST endpoint. Rendering the form only for admins protects nothing, because anyone holding the action ID can replay the request, so authenticate, authorise the specific resource (IDOR) and validate `FormData` inside every action, ideally by delegating to a server-only Data Access Layer. Next.js adds an Origin/Host CSRF check, a 1 MB default body limit, encrypted closure variables and removal of unused actions from client bundles, but none of that replaces those checks. Return only what the UI needs, because return values are serialised to the client.\n\nAfter mutating, tell the caches. `updateTag`, `revalidatePath` and `refresh` re-render the current route in the same response; `revalidateTag(tag, \"max\")` deliberately doesn't, so the user can briefly see old data. `redirect()` works by throwing, so call it after revalidating and outside `try/catch`. The client dispatches actions one at a time, so `Promise.all` over actions doesn't parallelise them, one reason actions are the wrong tool for fetching data. On self-hosted, multi-instance deployments a shared `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` keeps action references decryptable on every instance.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "Next.js Docs: Mutating Data", url: "https://nextjs.org/docs/app/getting-started/mutating-data", kind: "docs" },
        { label: "Next.js Docs: Server Actions and Mutations", url: "https://nextjs.org/docs/app/guides/server-actions", kind: "docs" },
        { label: "React Docs: useActionState", url: "https://react.dev/reference/react/useActionState", kind: "docs" },
        { label: "Next.js Blog: How to Think About Security in Next.js", url: "https://nextjs.org/blog/security-nextjs-server-components-actions", kind: "article" },
      ],
      video: {
        title: "Next.js Forms Are Different Now (Server Actions, useActionState, Form Component, Form Backend)",
        channel: "ByteGrad",
        url: "https://www.youtube.com/watch?v=DK7WqcL9Qq4",
        videoId: "DK7WqcL9Qq4",
        durationLabel: "14:12",
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
      challengeType: "quiz",
      quiz: [
        {
          id: "next-server-actions-q1",
          prompt:
            "Is this safe?\n\n```tsx\n// app/admin/posts/page.tsx\nexport default async function Page() {\n  const session = await auth();\n  if (session?.user.role !== \"admin\") redirect(\"/\");\n\n  async function deletePost(formData: FormData) {\n    \"use server\";\n    await db.post.delete({ where: { id: String(formData.get(\"id\")) } });\n    revalidatePath(\"/admin/posts\");\n  }\n\n  return <PostTable deleteAction={deletePost} />;\n}\n```",
          options: [
            "No: the action is its own POST entry point, so it must check the session and the post's ownership itself",
            "Yes: the action only exists in the admin page's bundle, so non-admins can't reach it",
            "Yes: Next.js's Origin check rejects requests from users who never loaded the admin page",
            "Yes: action IDs are encrypted, so the action can't be called outside the UI",
          ],
          correctIndex: 0,
          explanation:
            "A page-level check controls what renders, not who can POST to the action. Anyone who obtains the action ID (it's in the page for every admin session) can replay the request, and the Origin check only proves the request came from your host. Re-verify authentication and authorisation inside the action.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-server-actions-q2",
          prompt:
            "The title is valid and the insert succeeds. What does the user see?\n\n```ts\n\"use server\";\nimport { redirect } from \"next/navigation\";\n\nexport async function createPost(prevState: State, formData: FormData) {\n  try {\n    const post = await db.post.create({ data: { title: String(formData.get(\"title\")) } });\n    redirect(`/posts/${post.id}`);\n  } catch (e) {\n    return { error: \"Could not create the post\" };\n  }\n}\n```",
          options: [
            "The post is saved, but the form shows \"Could not create the post\" because `catch` swallows the error `redirect` throws",
            "The new post's page, because Next.js redirects bypass `try/catch`",
            "The form again with no message, because the insert is rolled back",
            "A build error, because `redirect` can't be used in Server Actions",
          ],
          correctIndex: 0,
          explanation:
            "`redirect` works by throwing a framework control-flow error, so a surrounding `catch` intercepts it and the action returns the error state instead. Call `redirect` after the `try/catch`, or rethrow framework errors with `unstable_rethrow`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-server-actions-q3",
          prompt: "With `const [state, formAction, pending] = useActionState(createUser, initialState)`, what does `createUser` receive when the form submits?",
          options: [
            "`(previousState, formData)`",
            "`(formData)` only",
            "`(formData, previousState)`",
            "`(event, formData)`",
          ],
          correctIndex: 0,
          explanation:
            "`useActionState` prepends the previous state (the initial state on the first submit), and whatever the action returns becomes the next `state`. Forgetting the extra first parameter is why `formData.get` is suddenly \"not a function\".",
        },
        {
          id: "next-server-actions-q4",
          prompt:
            "An action inserts a comment and calls `revalidateTag(\"comments\", \"max\")`. The user stays on the page. What does the action's response show them?",
          options: [
            "The old comment list: stale-while-revalidate invalidation doesn't re-render in the action response",
            "The new comment, because every revalidation re-renders the current route",
            "An error, because `revalidateTag` only works in Route Handlers",
            "A full page reload with fresh data",
          ],
          correctIndex: 0,
          explanation:
            "With a stale-while-revalidate profile, `revalidateTag` only marks the tag for a background refresh and skips the immediate re-render, so the change appears on a later read. For read-your-own-writes, call `updateTag(\"comments\")` in the action.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-server-actions-q5",
          prompt:
            "Which of these, called in a Server Action, make its response include a freshly rendered RSC Payload for the current route? (Select all that apply.)",
          options: [
            "`updateTag(\"posts\")`",
            "`revalidatePath(\"/posts\")`",
            "`refresh()`",
            "`(await cookies()).set(\"theme\", \"dark\")`",
            "`revalidateTag(\"posts\", \"max\")`",
            "Returning `{ ok: true }` and nothing else",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Immediate invalidation (`updateTag`, `revalidatePath`), `refresh()` and cookie mutations all re-render the current route in the same round trip (so does `redirect`, for the destination). Stale-while-revalidate `revalidateTag` intentionally doesn't, and a bare return value carries no new UI.",
        },
        {
          id: "next-server-actions-q6",
          prompt:
            "A Server Component renders `<form action={createPost}>` with a Server Action. A user on a slow phone submits before any JavaScript has loaded. What happens?",
          options: [
            "The browser submits the form as a normal POST and the action runs: forms with Server Actions are progressively enhanced",
            "Nothing, until hydration finishes and React attaches the handler",
            "The form falls back to a GET request with the fields in the query string",
            "React throws a hydration mismatch and discards the submission",
          ],
          correctIndex: 0,
          explanation:
            "React renders the form so the browser can post it without JavaScript, and Next.js handles the POST on the server (a `redirect` then becomes a real 303). In Client Components, submissions made before hydration are queued and replayed.",
        },
        {
          id: "next-server-actions-q7",
          prompt:
            "A Client Component runs `await Promise.all([saveA(), saveB(), saveC()])`, three Server Actions that each take about one second on the server. Roughly how long does it take?",
          options: [
            "About three seconds, because the client dispatches Server Actions one at a time",
            "About one second, because `Promise.all` runs them in parallel",
            "It throws, because Server Actions can't be awaited together",
            "It's unpredictable, because the three requests race",
          ],
          correctIndex: 0,
          explanation:
            "Next.js queues actions per client so each re-rendered tree matches the result that produced it (documented as an implementation detail that may change). Do parallel work inside a single action, or fetch in a Server Component.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-server-actions-q8",
          prompt: "You need the `userId` in `updateUser` but it isn't a form field. What's true about `updateUser.bind(null, userId)`?",
          options: [
            "It passes `userId` as the first argument, before `FormData`, and still works before hydration",
            "It only works in Client Components",
            "It appends `userId` after `FormData`",
            "It makes `userId` trustworthy, so the action can skip the ownership check",
          ],
          correctIndex: 0,
          explanation:
            "Bound arguments come first and `bind` supports progressive enhancement in Server and Client Components (a hidden input would instead put the value in the HTML). Anything that arrives from the client can be tampered with, so the action still checks that the session may edit that user.",
        },
        {
          id: "next-server-actions-q9",
          prompt: "Server-side validation of a sign-up form fails. What should the action used with `useActionState` do?",
          options: [
            "Return a serialisable object such as `{ errors: { email: [\"Invalid email\"] } }` for the form to render",
            "Throw an `Error` with the messages so `error.tsx` displays them",
            "Return `new Response(null, { status: 422 })`",
            "Call `redirect(\"/signup?error=email\")` so the page can read `searchParams`",
          ],
          correctIndex: 0,
          explanation:
            "Expected errors are data: return them as state and render them next to the fields. Throwing is for unexpected failures and lands in an error boundary, a `Response` isn't how actions reply, and a redirect loses the user's input.",
        },
        {
          id: "next-server-actions-q10",
          prompt:
            "You self-host on four containers behind a load balancer. Users intermittently get \"Failed to find Server Action\". What's the most likely fix?",
          options: [
            "Set the same `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` on every instance, roll deployments gradually and surface a retry",
            "Raise `serverActions.bodySizeLimit`",
            "Add the load balancer's host to `serverActions.allowedOrigins`",
            "Add `export const dynamic = \"force-dynamic\"` to pages that use actions",
          ],
          correctIndex: 0,
          explanation:
            "Each build generates its own key for encrypting action references, so an instance built separately can't decrypt another's, and clients still running an older build may call IDs that no longer exist. A shared key, rolling deploys (plus `deploymentId` for skew protection) and a retry path address both.",
        },
        {
          id: "next-server-actions-q11",
          prompt: "Which protections does Next.js apply to Server Actions by default? (Select all that apply.)",
          options: [
            "Rejecting requests whose `Origin` doesn't match the host",
            "A 1 MB default request body limit",
            "Encrypted, non-deterministic action IDs, with unused actions removed from client bundles",
            "Authorisation based on which page rendered the form",
            "Validation of `FormData` against the action's TypeScript types",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The framework adds a CSRF-style Origin/Host check, a body size cap (`serverActions.bodySizeLimit`) and ID hardening. It knows nothing about your users or schemas; TypeScript types don't exist at runtime, so authorisation and validation are your job.",
        },
        {
          id: "next-server-actions-q12",
          prompt: "Where can a Server Action be defined?",
          options: [
            "Inline in a Server Component, or in a module with `\"use server\"` at the top that Client Components import",
            "Inline in a Client Component, by starting the function body with `\"use server\"`",
            "Only in `app/actions.ts`, which Next.js treats as a special file",
            "Only in Route Handlers",
          ],
          correctIndex: 0,
          explanation:
            "Client Components can call Server Functions but can't define them: import them from a `\"use server\"` module or receive them as props. There's no special filename; the directive is what matters.",
        },
      ],
    },
    {
      id: "next-route-handlers",
      moduleId: "fe-nextjs",
      trackId: "frontend",
      title: "Route Handlers as API Endpoints",
      summary:
        "A `route.ts` file turns a segment into an HTTP endpoint built on the Web `Request` and `Response` APIs, extended as `NextRequest` (cookies, a parsed `nextUrl`) and `NextResponse`. Export `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD` or `OPTIONS`; other methods get a 405, and `OPTIONS` is answered automatically if you don't define it. Route Handlers replace `pages/api` in the App Router, don't take part in layouts or client navigation, can't share a segment with a `page`, and receive `params` as a Promise.\n\nUse one when the caller isn't your own React UI: webhooks from Stripe or a CMS (read the raw body with `request.text()` to verify signatures, no body-parser config needed), OAuth callbacks, mobile or third-party clients, RSS or file responses, and streamed output. For mutations from your components, Server Actions are simpler and integrate with revalidation; for reads in Server Components, call the data layer directly. Fetching your own Route Handler from a Server Component adds an HTTP hop, and during a build-time prerender there's no server to answer, so the build fails.\n\nThey aren't cached by default: since Next.js 15 `GET` is dynamic unless you opt in (`dynamic = \"force-static\"` in the previous model; with Cache Components a `GET` that touches no runtime or uncached data is prerendered, and `\"use cache\"` must live in a helper rather than the handler body). Other methods are never cached. Treat every handler as a public API: authenticate, authorise, validate input and rate-limit, because CORS only restricts what browsers may read. The body can be read once (clone the request to read it twice), and on serverless hosts handlers can't hold WebSockets or keep state between requests.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Next.js Docs: Route Handlers", url: "https://nextjs.org/docs/app/getting-started/route-handlers", kind: "docs" },
        { label: "Next.js Docs: route.js API Reference", url: "https://nextjs.org/docs/app/api-reference/file-conventions/route", kind: "docs" },
        { label: "Next.js Docs: Backend for Frontend", url: "https://nextjs.org/docs/app/guides/backend-for-frontend", kind: "docs" },
      ],
      video: {
        title: "Next.js 15 Tutorial - 35 - Route Handlers",
        channel: "Codevolution",
        url: "https://www.youtube.com/watch?v=27Uj6BeIDV0",
        videoId: "27Uj6BeIDV0",
        durationLabel: "5:49",
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
          title: "Next.js 16 Full Course | Build and Deploy a Production-Ready Full Stack App",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=I1V9YWqRIeI",
          videoId: "I1V9YWqRIeI",
          durationLabel: "4:10:17",
          startSeconds: 2933,
          chapterLabel: "API Routes",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "next-route-handlers-q1",
          prompt: "A teammate adds `app/dashboard/route.ts` with a `POST` handler next to the existing `app/dashboard/page.tsx`. What happens?",
          options: [
            "The build fails: a `route` and a `page` can't share a segment, because each takes over every HTTP method for its URL",
            "The page serves `GET` and the route handler serves `POST`",
            "The route handler wins for every request to `/dashboard`",
            "Next.js picks one per request based on the `Accept` header",
          ],
          correctIndex: 0,
          explanation:
            "`page` and `route` are both the terminal file of a segment and conflict. Put the handler in its own segment (for example `app/api/dashboard/route.ts`) or use a Server Action for the mutation.",
        },
        {
          id: "next-route-handlers-q2",
          prompt:
            "`next build` fails with a connection error on this statically prerendered page. Why, and what's the fix?\n\n```tsx\n// app/products/page.tsx\nexport default async function Page() {\n  const res = await fetch(\"http://localhost:3000/api/products\");\n  const products = await res.json();\n  return <ProductList products={products} />;\n}\n```",
          options: [
            "No server is running during the build; call the data function the Route Handler uses directly from the page",
            "Server Components need relative URLs like `/api/products`",
            "Route Handlers can't return JSON to Server Components, so use a Server Action",
            "`fetch` isn't allowed in Server Components, so move it into `useEffect`",
          ],
          correctIndex: 0,
          explanation:
            "Prerendering happens inside `next build`, when nothing is listening on port 3000; at runtime the same call would still cost an extra HTTP round trip to yourself. Server Components can query the data source directly, and server-side `fetch` needs absolute URLs anyway.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-route-handlers-q3",
          prompt: "`app/api/stripe/route.ts` receives Stripe webhooks and must verify the signature. How should it read the body?",
          options: [
            "Read the raw body with `await request.text()`, verify the signature against it, then parse the JSON",
            "Export `config = { api: { bodyParser: false } }` from the route file first",
            "Point Stripe at a Server Action instead, since actions accept POST requests",
            "Parse with `request.json()` and verify against `JSON.stringify` of the result",
          ],
          correctIndex: 0,
          explanation:
            "Signatures are computed over the exact bytes sent, and Route Handlers give you the raw Web `Request` with no body parser to disable (`bodyParser` config is a Pages Router API Routes concept). Re-serialising parsed JSON can change the bytes, and Server Actions are invoked by your own UI through action IDs, not by third parties at a stable URL.",
        },
        {
          id: "next-route-handlers-q4",
          prompt:
            "What happens when this handler runs?\n\n```ts\nexport async function POST(request: Request) {\n  const body = await request.json();\n  await audit(body);\n  return handleWithLibrary(request); // the library calls request.json() again\n}\n```",
          options: [
            "The library's `request.json()` throws a `TypeError` because the body was already read; clone the request first",
            "It works, because Next.js caches the parsed body on the request",
            "The library receives `null` for the body",
            "It works for JSON bodies but not for `FormData`",
          ],
          correctIndex: 0,
          explanation:
            "A `Request` body is a stream that can be consumed once. Read from `request.clone()` for the audit (or pass the parsed body along) so the original is still readable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-route-handlers-q5",
          prompt:
            "Cache Components is not enabled. Is this response cached in production?\n\n```ts\n// app/api/time/route.ts\nexport async function GET() {\n  return Response.json({ now: new Date().toISOString() });\n}\n```",
          options: [
            "No: since Next.js 15, `GET` handlers are dynamic by default unless you opt in, for example with `export const dynamic = \"force-static\"`",
            "Yes: a `GET` handler that uses no request-time APIs is prerendered at build time",
            "Yes, for 60 seconds by default",
            "Only when deployed on Vercel",
          ],
          correctIndex: 0,
          explanation:
            "Next.js 13 and 14 prerendered such handlers, which surprised people; Next.js 15 flipped the default to dynamic. Tutorials from 2023 are the usual source of the wrong answer.",
        },
        {
          id: "next-route-handlers-q6",
          prompt: "Which statements about caching Route Handlers are true? (Select all that apply.)",
          options: [
            "`POST`, `PUT` and `DELETE` handlers are never cached",
            "With Cache Components, a `GET` that touches no runtime or uncached data is prerendered like a page",
            "`\"use cache\"` has to go in a helper function, not directly in the handler body",
            "`revalidateTag` can be called in a Route Handler, but `updateTag` can't",
            "A cached `GET` makes the `POST` exported from the same file cached too",
            "Route Handler responses are cached for 60 seconds by default",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Only `GET` can be cached, and each method is independent even in one file. Under Cache Components `GET` handlers follow the page model, with `use cache` extracted into helpers; `updateTag` is Server Actions only, so webhooks use `revalidateTag` (with `{ expire: 0 }` if they need immediate expiry).",
        },
        {
          id: "next-route-handlers-q7",
          prompt: "Which are good reasons to use a Route Handler rather than a Server Action? (Select all that apply.)",
          options: [
            "A React Native app needs to call your backend",
            "Stripe needs a URL to send webhook events to",
            "An OAuth provider redirects users back to a callback URL",
            "You want to serve `rss.xml` or a CSV download",
            "A form in your own UI submits data and shows validation errors",
            "A Server Component needs data for its first render",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Route Handlers are stable, public HTTP endpoints for callers outside your React tree and for non-UI responses. Your own forms are the Server Action sweet spot, and Server Components should call the data layer directly instead of going through HTTP.",
        },
        {
          id: "next-route-handlers-q8",
          prompt: "`app/api/items/route.ts` exports only `GET`. A client sends `DELETE /api/items`. What does it get?",
          options: ["`405 Method Not Allowed`", "`404 Not Found`", "The `GET` handler's response", "`500 Internal Server Error`"],
          correctIndex: 0,
          explanation:
            "Unsupported methods get a 405. `OPTIONS` is the exception: if you don't define it, Next.js answers it and sets the `Allow` header from the methods you did export.",
        },
        {
          id: "next-route-handlers-q9",
          prompt:
            "What's wrong with this handler in Next.js 16?\n\n```ts\n// app/api/users/[id]/route.ts\nexport async function GET(request: Request, { params }: { params: { id: string } }) {\n  const { id } = params;\n  return Response.json(await getUser(id));\n}\n```",
          options: [
            "`params` is a Promise, so `id` is `undefined`; type it as a Promise (or use `RouteContext<\"/api/users/[id]\">`) and `await` it",
            "Nothing: Route Handlers still receive synchronous `params`",
            "Route Handlers can't live under dynamic segments",
            "Dynamic values are only available through `request.nextUrl.searchParams`",
          ],
          correctIndex: 0,
          explanation:
            "`context.params` became a Promise in Next.js 15, and Next.js 16 removed the synchronous compatibility, so destructuring `id` from the Promise object silently gives `undefined`. The wrong type annotation hides the bug from TypeScript, which is why the generated `RouteContext` helper is worth using.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-route-handlers-q10",
          prompt:
            "`app/api/admin/export/route.ts` returns every customer's email. It isn't linked anywhere in the UI and no CORS headers are set. Who can call it?",
          options: [
            "Anyone who finds the URL, for example with `curl`: CORS only limits what browsers let other origins read",
            "Only pages on your own origin, because the missing CORS headers block everyone else",
            "Nobody, because unlinked routes are removed from the build",
            "Only signed-in users, because Proxy protects `/api` by default",
          ],
          correctIndex: 0,
          explanation:
            "Route Handlers are public HTTP endpoints. CORS is a browser read policy, not access control, so servers, scripts and attackers ignore it. Authenticate and authorise inside the handler.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-route-handlers-q11",
          prompt: "Deployed as serverless functions, which of these won't work reliably in a Route Handler? (Select all that apply.)",
          options: [
            "Keeping a WebSocket connection open",
            "Counting requests in a module-level variable",
            "Writing uploads to the local filesystem for later requests to read",
            "Streaming an LLM response with a `ReadableStream`",
            "Reading cookies with `cookies()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Serverless instances come and go, so in-memory state and local files aren't shared between requests, and connections close on timeout or when the response ends. Streaming responses and reading cookies are fully supported.",
        },
      ],
    },
    {
      id: "next-proxy-middleware",
      moduleId: "fe-nextjs",
      trackId: "frontend",
      title: "Proxy (formerly Middleware) & the Edge",
      summary:
        "Next.js 16 renamed `middleware.ts` to `proxy.ts` (exporting a `proxy` function) to make its job clear: it's a network boundary in front of the app that runs before routes render, after `next.config.js` headers and redirects and before filesystem and dynamic routes are matched. It can redirect, rewrite, set request and response headers or cookies, or answer directly, which suits locale redirects, A/B-test rewrites, header injection and cheap optimistic auth redirects based on a session cookie. There's one proxy file per project; `config.matcher` (static values, `path-to-regexp` syntax, `has`/`missing` conditions) scopes it, and without a matcher it runs on every request, including `_next/static`, images and public files.\n\nProxy runs on the Node.js runtime and its runtime can't be configured. The deprecated `middleware.ts` survives only for Edge-runtime cases, `export const runtime = \"edge\"` on routes is deprecated too, and Vercel now recommends Node.js functions everywhere. `fetch` caching options have no effect inside Proxy, and it runs for prefetches as well, so it's the wrong place for slow data fetching.\n\nThe senior lesson is what Proxy is not: an authorisation layer. It should only read the cookie, not hit the database, and it's one matcher edit away from not running at all. Server Functions are POSTs to the page's route, so a matcher that excludes a path silently skips that page's actions too. CVE-2025-29927 (March 2025) let attackers skip self-hosted middleware entirely with a forged `x-middleware-subrequest` header. Keep the real checks in the Data Access Layer, Server Actions and Route Handlers. And pass data upstream with `NextResponse.next({ request: { headers } })`, because `NextResponse.next({ headers })` sends those headers to the browser.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Next.js Docs: proxy.js API Reference", url: "https://nextjs.org/docs/app/api-reference/file-conventions/proxy", kind: "docs" },
        { label: "Next.js Docs: Proxy", url: "https://nextjs.org/docs/app/getting-started/proxy", kind: "docs" },
        { label: "Vercel Blog: Postmortem on Next.js Middleware bypass (CVE-2025-29927)", url: "https://vercel.com/blog/postmortem-on-next-js-middleware-bypass", kind: "article" },
        { label: "Next.js Blog: Next.js 16 (proxy.ts)", url: "https://nextjs.org/blog/next-16", kind: "article" },
      ],
      video: {
        title: "Next.js 16 Middleware DEPRECATED - Authentication In Proxy Or Data Access Layer?",
        channel: "ByteGrad",
        url: "https://www.youtube.com/watch?v=zNgCFXZLoRk",
        videoId: "zNgCFXZLoRk",
        durationLabel: "22:59",
      },
      alternateVideos: [
        {
          title: "Next.js Middleware Is DEPRECATED! (Here is why)",
          channel: "Tobi Mey",
          url: "https://www.youtube.com/watch?v=QKzWMdve6oY",
          videoId: "QKzWMdve6oY",
          durationLabel: "4:34",
        },
        {
          title: "Next.js 15 Tutorial - 46 - Middleware",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=t1KTTZbqCm0",
          videoId: "t1KTTZbqCm0",
          durationLabel: "6:16",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "next-proxy-middleware-q1",
          prompt: "You're upgrading a Next.js 15 app that has `middleware.ts`. What does Next.js 16 expect?",
          options: [
            "Rename the file to `proxy.ts` and the exported `middleware` function to `proxy`",
            "Move it to `app/middleware/route.ts`",
            "Nothing: `proxy.ts` is a new, additional layer that runs after middleware",
            "Rename it to `edge.ts` so it keeps running on the Edge runtime",
          ],
          correctIndex: 0,
          explanation:
            "The `middleware` convention is deprecated and renamed to `proxy` (a codemod does the rename, including config flags such as `skipProxyUrlNormalize`). The logic and `NextRequest`/`NextResponse` APIs stay the same.",
        },
        {
          id: "next-proxy-middleware-q2",
          prompt:
            "Signed-out users report an unstyled login page with broken images, and sometimes \"too many redirects\". Why?\n\n```ts\n// proxy.ts (no config export)\nimport { NextResponse, type NextRequest } from \"next/server\";\n\nexport function proxy(request: NextRequest) {\n  if (!request.cookies.has(\"session\")) {\n    return NextResponse.redirect(new URL(\"/login\", request.url));\n  }\n}\n```",
          options: [
            "Without a `matcher`, Proxy runs on every request, including `/login` itself, `_next/static`, `_next/image` and public files, so those get redirected too",
            "`NextResponse.redirect` needs a relative path rather than a `URL`",
            "Cookies aren't readable in Proxy, so `has` always returns `false`",
            "Proxy runs after the page renders, so the redirect arrives too late",
          ],
          correctIndex: 0,
          explanation:
            "A matcher-less Proxy intercepts assets and the login route as well. Exclude them with a negative-lookahead matcher (such as `/((?!api|_next/static|_next/image|favicon.ico|login).*)`) or early returns.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-proxy-middleware-q3",
          prompt: "Which runtime does `proxy.ts` use in Next.js 16?",
          options: [
            "Node.js, and it can't be changed: exporting a `runtime` option from the proxy file throws",
            "The Edge runtime, for low latency",
            "Whichever runtime the matched route uses",
            "Edge in production and Node.js in development",
          ],
          correctIndex: 0,
          explanation:
            "Proxy defaults to Node.js and the `runtime` segment option isn't available there. Only the deprecated `middleware.ts` can still run on Edge, so check that auth and session libraries used in Proxy support Node.js (most do).",
        },
        {
          id: "next-proxy-middleware-q4",
          prompt: "Which are good jobs for Proxy? (Select all that apply.)",
          options: [
            "Redirecting `/` to `/en` or `/de` based on `Accept-Language`",
            "Rewriting half of the traffic to an A/B-test variant",
            "Adding security headers to every response",
            "Redirecting to `/login` when there's no session cookie, as an optimistic check",
            "Querying the database on every request to load the user's permissions",
            "Being the only authorisation check in front of your Server Actions",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Proxy is for fast decisions from the request itself: redirects, rewrites, headers and cookie-based optimistic checks. It runs for every matched request and prefetch, so database lookups hurt, and it must never be the only line of defence.",
        },
        {
          id: "next-proxy-middleware-q5",
          prompt:
            "Your matcher is `[\"/dashboard/:path*\"]` and Proxy redirects signed-out users. To speed up a heavy page, someone changes it to exclude `/dashboard/reports`. That page has a `deleteReport` Server Action that relies on Proxy for auth. What's the consequence?",
          options: [
            "Calls to `deleteReport` are POSTs to `/dashboard/reports`, so they now skip Proxy too and nothing checks the caller",
            "Nothing: Server Actions always pass through Proxy whatever the matcher says",
            "Server Actions use a separate internal route that the matcher never covered anyway",
            "The build fails because a Server Action is outside the matcher",
          ],
          correctIndex: 0,
          explanation:
            "Server Functions aren't separate routes; they're POSTs to the route where they're used, so matcher changes and refactors can silently remove coverage. The docs' conclusion: verify authentication and authorisation inside every Server Function.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-proxy-middleware-q6",
          prompt: "What was CVE-2025-29927 (March 2025), and what's the lesson?",
          options: [
            "A forged `x-middleware-subrequest` header let requests skip middleware on self-hosted apps, exposing apps that only authorised in middleware",
            "Middleware leaked environment variables through response headers on Vercel",
            "A matcher regular expression caused catastrophic backtracking under load",
            "Middleware responses were cached across users by the CDN",
          ],
          correctIndex: 0,
          explanation:
            "The internal header meant to stop middleware recursion could be sent by anyone, bypassing it on `next start` and `output: \"standalone\"` deployments (fixed in 15.2.3 and 14.2.25, with backports; Vercel-hosted apps weren't affected). Vercel's postmortem repeats the rule: middleware shouldn't be the sole protection for a route.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-proxy-middleware-q7",
          prompt: "Proxy computes `x-user-country` and your Server Components should read it with `headers()`, without the browser seeing it. Which call does that?",
          options: [
            "`NextResponse.next({ request: { headers: requestHeaders } })`",
            "`NextResponse.next({ headers: requestHeaders })`",
            "`const res = NextResponse.next(); res.headers.set(\"x-user-country\", country); return res;`",
            "Returning `Response.json({ country })` so the page can read the body",
          ],
          correctIndex: 0,
          explanation:
            "`request.headers` in the options object rewrites what the upstream route receives. The `headers` option and `res.headers.set` add response headers, which go to the client, and returning a `Response` ends the request in Proxy instead of rendering the page.",
        },
        {
          id: "next-proxy-middleware-q8",
          prompt: "Proxy calls `fetch(flagsUrl, { next: { revalidate: 60 } })` on every request to load feature flags. What happens?",
          options: [
            "The caching options are ignored in Proxy, so the flag service is hit on every matched request, prefetches included",
            "Responses are cached for 60 seconds per instance",
            "The build fails because `fetch` isn't allowed in Proxy",
            "Next.js runs the fetch once at build time and inlines the result",
          ],
          correctIndex: 0,
          explanation:
            "The docs state that `cache`, `next.revalidate` and `next.tags` have no effect in Proxy. Slow or repeated data fetching belongs in cached server code, or in a flag store designed for per-request reads.",
        },
        {
          id: "next-proxy-middleware-q9",
          prompt: "In what order does Next.js process an incoming request?",
          options: [
            "`headers` and `redirects` from `next.config.js`, then Proxy, then `beforeFiles` rewrites, then filesystem routes, then `afterFiles` rewrites and dynamic routes",
            "Proxy, then `next.config.js` redirects, then filesystem routes, then `beforeFiles` rewrites",
            "Filesystem routes first, then Proxy only when nothing matched",
            "`beforeFiles` rewrites, then Proxy, then `next.config.js` headers and redirects",
          ],
          correctIndex: 0,
          explanation:
            "Config headers and redirects run first, which is why simple static redirects belong in `next.config.js` rather than Proxy. Proxy then runs before any route resolution, and `fallback` rewrites come last.",
        },
        {
          id: "next-proxy-middleware-q10",
          prompt: "A teammate wants `export const runtime = \"edge\"` on every route and in `proxy.ts` \"for speed\". What do the Next.js 16 docs say?",
          options: [
            "Setting `runtime` in the proxy file throws, and `runtime = \"edge\"` on routes is deprecated in favour of the default Node.js runtime",
            "Edge is the recommended default for both routes and Proxy",
            "Proxy already runs on Edge, so routes should match it",
            "Edge is required for ISR when deploying to Vercel",
          ],
          correctIndex: 0,
          explanation:
            "The Edge runtime is deprecated for routes (and never supported ISR), Proxy is Node.js-only, and Vercel now recommends migrating Edge functions to Node.js. The deprecated `middleware.ts` is the only remaining way to intercept requests on Edge.",
        },
      ],
    },
    {
      id: "next-rendering-strategies",
      moduleId: "fe-nextjs",
      trackId: "frontend",
      title: "Rendering Strategies: SSR vs SSG vs ISR (and PPR)",
      summary:
        "The classic vocabulary still applies: SSG renders at build time, SSR per request, ISR serves a cached page and regenerates it in the background after a revalidation window or an on-demand `revalidatePath`/`revalidateTag`, and streaming sends HTML in chunks as `Suspense` boundaries resolve. In the App Router you don't choose by exporting `getStaticProps` or `getServerSideProps` (those are Pages Router); the mode is inferred from what the tree touches. In the previous model a single `cookies()`, `headers()` or `searchParams` read made the whole route dynamic, and a route that touched none of them was prerendered, un-optioned `fetch` calls included.\n\nPartial Prerendering, the default with Cache Components in Next.js 16, moves the static/dynamic line from the route to the component. At build time Next.js renders a static shell (static and cached output plus `Suspense` fallbacks) that a CDN can serve instantly, then streams the dynamic holes into the same response. `generateStaticParams` supplies known params; unknown ones get the App Shell and are filled in by ISR on first visit. With Cache Components it must return at least one entry, and `dynamicParams` isn't available.\n\nStreaming has a hard HTTP contract: once the first chunk is out the status is `200`, so a `notFound()` inside a Suspense boundary can't become a 404 (Next.js injects `noindex` instead) and a late `redirect()` becomes client-side. Checks that need real status codes go before any `await` or `Suspense`, or in Proxy. Crawlers get the whole page rendered at request time, so shell inputs must exist at runtime too. A layout that awaits uncached data blocks its own segment's `loading.js`. And self-hosted, multi-instance ISR needs a shared cache handler, or revalidation only reaches one instance.",
      level: "advanced",
      estMinutes: 70,
      webRefs: [
        { label: "Next.js Docs: Rendering Philosophy", url: "https://nextjs.org/docs/app/guides/rendering-philosophy", kind: "docs" },
        { label: "Next.js Docs: Streaming", url: "https://nextjs.org/docs/app/guides/streaming", kind: "docs" },
        { label: "Next.js Docs: Incremental Static Regeneration (ISR)", url: "https://nextjs.org/docs/app/guides/incremental-static-regeneration", kind: "docs" },
        { label: "Next.js Docs: generateStaticParams", url: "https://nextjs.org/docs/app/api-reference/functions/generate-static-params", kind: "docs" },
      ],
      video: {
        title: "Next.js CSR vs SSR vs SSG vs ISR and now PPR!",
        channel: "ByteGrad",
        url: "https://www.youtube.com/watch?v=S5tjBqzs31w",
        videoId: "S5tjBqzs31w",
        durationLabel: "34:00",
      },
      alternateVideos: [
        {
          title: "Next.js Explained: Partial Prerendering (PPR)",
          channel: "Delba",
          url: "https://www.youtube.com/watch?v=MTcPrTIBkpA",
          videoId: "MTcPrTIBkpA",
          durationLabel: "11:03",
        },
        {
          title: "Next.js React Framework Course – Build and Deploy a Full Stack App From scratch",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=KjY94sAKLlw",
          videoId: "KjY94sAKLlw",
          durationLabel: "4:47:36",
          startSeconds: 278,
          chapterLabel: "Main Feature: Server-Side Rendering",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "next-rendering-strategies-q1",
          prompt:
            "Cache Components is not enabled, and this page has no segment config. How does it behave in production?\n\n```tsx\n// app/prices/page.tsx\nexport default async function Page() {\n  const res = await fetch(\"https://api.example.com/prices\");\n  const prices = await res.json();\n  return <PriceTable prices={prices} />;\n}\n```",
          options: [
            "It's prerendered during `next build`: the fetch runs once and the prices are frozen in static HTML until a redeploy or revalidation",
            "It renders on every request, because `fetch` isn't cached by default",
            "The fetch result is cached for 60 seconds, then refetched",
            "The fetch moves to the browser because the page uses no request-time APIs",
          ],
          correctIndex: 0,
          explanation:
            "\"Not cached by default\" describes the data cache, but nothing here makes the route dynamic, so the whole route is prerendered and the fetch runs once at build time. Use `await connection()`, `cache: \"no-store\"` or dynamic APIs to render per request, or add revalidation to get ISR.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-rendering-strategies-q2",
          prompt: "Still without Cache Components, you add `const theme = (await cookies()).get(\"theme\")` at the top of that page. What changes?",
          options: [
            "The whole route becomes dynamic and renders on every request",
            "Only the code that reads the cookie becomes dynamic; the rest stays static",
            "Nothing: `cookies()` only matters in Client Components",
            "The build fails because `cookies()` can't be used in a page",
          ],
          correctIndex: 0,
          explanation:
            "In the previous model a request-time API anywhere opts the entire route into dynamic rendering. Confining the dynamic part to a component is exactly what Partial Prerendering with Cache Components adds.",
        },
        {
          id: "next-rendering-strategies-q3",
          prompt:
            "With `cacheComponents: true`, what ends up in this page's static shell? (Select all that apply.)\n\n```tsx\nexport default function Page() {\n  return (\n    <>\n      <Header />\n      <BlogPosts /> {/* \"use cache\" + cacheLife(\"hours\") */}\n      <Suspense fallback={<p>Loading preferences…</p>}>\n        <UserPreferences /> {/* reads cookies() */}\n      </Suspense>\n    </>\n  );\n}\n```",
          options: [
            "The static `<Header />` markup",
            "The cached output of `<BlogPosts />`",
            "The fallback `<p>Loading preferences…</p>`",
            "The rendered `<UserPreferences />`",
            "Nothing: reading `cookies()` makes the whole route dynamic",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Static markup, cached output (with a lifetime long enough to prerender) and Suspense fallbacks form the shell; the cookie-dependent component streams into its hole at request time. Reading `cookies()` no longer makes the whole route dynamic.",
        },
        {
          id: "next-rendering-strategies-q4",
          prompt:
            "A product page wraps `<ProductDetails />` in `<Suspense>`. Inside it, after an `await`, the product turns out not to exist and the component calls `notFound()`. What does a crawler receive?",
          options: [
            "A `200` response with `<meta name=\"robots\" content=\"noindex\">` injected, because the status went out with the first chunk",
            "A `404`, because `notFound()` always sets the status code",
            "A `500`, because throwing inside a Suspense boundary is an error",
            "A `307` redirect to `/404`",
          ],
          correctIndex: 0,
          explanation:
            "Once streaming starts, headers and status are committed. To return a real 404, call `notFound()` before any `await` inside a Suspense boundary (or reject the request in Proxy); otherwise Next.js falls back to `noindex`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-rendering-strategies-q5",
          prompt:
            "With Cache Components enabled, `app/blog/[slug]/page.tsx` exports a `generateStaticParams` that returns `[]`, because posts come from a CMS at runtime. What happens?",
          options: [
            "The build fails: with Cache Components it must return at least one param so the route can be validated",
            "Every slug is rendered on first visit and then cached (ISR)",
            "The route becomes fully dynamic with no static shell",
            "Every slug returns a 404",
          ],
          correctIndex: 0,
          explanation:
            "Without Cache Components an empty array means \"render every path at runtime\". With Cache Components the build must execute the route with at least one sample param to check that runtime data is handled correctly; unknown params then get the App Shell and ISR fills them in.",
        },
        {
          id: "next-rendering-strategies-q6",
          prompt:
            "A prerendered page revalidates every 60 seconds (ISR). Five minutes after its last regeneration, a visitor requests it. What do they get?",
          options: [
            "The stale cached page immediately, while a regeneration starts in the background for later visitors",
            "Nothing until the page regenerates, then fresh HTML",
            "A fresh page, because a background timer regenerated it every 60 seconds",
            "A `503` until regeneration finishes",
          ],
          correctIndex: 0,
          explanation:
            "ISR is stale-while-revalidate triggered by requests, not by a timer, so the first request after the window still gets the old page. If regeneration throws, the last good version keeps being served.",
        },
        {
          id: "next-rendering-strategies-q7",
          prompt:
            "You self-host on three pods. A CMS webhook hits a Route Handler on pod A that calls `revalidatePath(\"/blog\")`. Pods B and C keep serving the old page. Why?",
          options: [
            "The default cache lives on each instance's local disk, so only pod A was invalidated; configure a shared cache handler",
            "`revalidatePath` only works when deployed on Vercel",
            "Proxy blocked the revalidation request on pods B and C",
            "`revalidatePath` only invalidates the client router cache",
          ],
          correctIndex: 0,
          explanation:
            "Self-hosted ISR stores pages in a per-instance filesystem cache, and on-demand revalidation only reaches the instance that handled the call. A custom cache handler backed by shared storage (with tag coordination) fixes it; Vercel does this for you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-rendering-strategies-q8",
          prompt:
            "`app/dashboard/layout.tsx` starts with `const user = await getUserFromCookies()`, and `app/dashboard/loading.tsx` exists. Navigating to `/dashboard` shows nothing until the user has loaded. Why?",
          options: [
            "`loading.js` sits below its segment's layout, so it can't cover the layout's own `await`; move the read into a Suspense-wrapped child or into the page",
            "`loading.js` only works on the first page load",
            "`loading.js` must be a Client Component to show during navigation",
            "Reading cookies disables streaming for the whole segment",
          ],
          correctIndex: 0,
          explanation:
            "`loading.js` wraps the page (and nested layouts) in a Suspense boundary, not the layout it sits next to. Pushing uncached or runtime access down the tree lets the layout and fallback render immediately.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-rendering-strategies-q9",
          prompt:
            "Which `\"use cache\"` lifetimes are too short to be included in a prerender, so they become dynamic holes instead? (Select all that apply.)",
          options: [
            "`cacheLife(\"seconds\")`",
            "`cacheLife({ revalidate: 0 })`",
            "`cacheLife({ revalidate: 60, expire: 120 })`",
            "`cacheLife(\"minutes\")`",
            "`cacheLife(\"max\")`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A zero `revalidate` or an `expire` under five minutes excludes a cache from prerenders (so does a `stale` under 30 seconds). Of the presets only `seconds` qualifies, because its `expire` is one minute; such caches need a Suspense boundary.",
        },
        {
          id: "next-rendering-strategies-q10",
          prompt:
            "A page's static shell renders a value read from a file that exists only on the build machine. Visitors see the page fine, but Googlebot's requests fail. Why?",
          options: [
            "Crawlers skip the static shell: Next.js renders the whole page at request time for them, so shell inputs must also exist at runtime",
            "Googlebot doesn't run JavaScript, so the shell never hydrates",
            "Static shells are served only from the CDN, which blocks crawlers",
            "The file is read during hydration in the crawler's browser",
          ],
          correctIndex: 0,
          explanation:
            "Bots need a complete document, so Next.js detects them by user agent and renders the entire page at request time instead of reusing the prerendered shell. Anything that only existed during the build then fails for them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-rendering-strategies-q11",
          prompt:
            "Without Cache Components, `app/docs/[slug]/page.tsx` exports a `generateStaticParams` returning three slugs and `export const dynamicParams = false`. What does `/docs/unknown` return?",
          options: [
            "A 404: only the generated paths are served",
            "It renders on demand and is cached for later visitors",
            "The page for the first generated slug",
            "A build error",
          ],
          correctIndex: 0,
          explanation:
            "`dynamicParams` defaults to `true`, which renders unknown params on demand (roughly the Pages Router's `fallback: \"blocking\"`); `false` turns them into 404s. The option isn't available once Cache Components is enabled.",
        },
      ],
    },
    {
      id: "next-metadata-seo",
      moduleId: "fe-nextjs",
      trackId: "frontend",
      title: "Metadata & SEO in Next.js",
      summary:
        "The Metadata API replaces hand-written `<head>` tags: export a static `metadata` object or an async `generateMetadata({ params, searchParams }, parent)` from a layout or page (Server Components only, and never both from one segment), and Next.js renders deduplicated tags, adding charset and viewport by default. File conventions cover the assets: `opengraph-image` and `twitter-image` (static files or `ImageResponse` code), `icon`, `sitemap.ts`, `robots.ts` and `manifest`. File-based metadata overrides the object form, and these special route handlers are cached by default unless they use request-time APIs.\n\nResolution runs from the root layout to the page and merges shallowly. A later segment that sets `openGraph` replaces the parent's whole `openGraph` object, so the parent's description and images vanish, while a segment that doesn't set it inherits it unchanged, even when the page title changed. `title.template` applies to child segments only, never to the page in the same segment as the layout that defines it; only the closest template counts, with no chaining, and `title.absolute` escapes it. `metadataBase` lets URL fields be relative, and a relative URL without it fails the build.\n\n`generateMetadata` shares memoised `fetch` calls with the page (wrap ORM calls in `React.cache`). On dynamic pages metadata streams into the `<body>` after the UI, except for HTML-limited bots such as `facebookexternalhit`, which get blocking `<head>` output; Googlebot handles streamed metadata. With Cache Components, a `generateMetadata` that reads runtime data on an otherwise prerenderable page is a build error until you cache the data or make the dynamic intent explicit. And after a `notFound()` mid-stream the page still returns `200` with `noindex`, which matters for SEO.",
      level: "intermediate",
      estMinutes: 80,
      webRefs: [
        { label: "Next.js Docs: generateMetadata and the metadata object", url: "https://nextjs.org/docs/app/api-reference/functions/generate-metadata", kind: "docs" },
        { label: "Next.js Docs: Metadata and OG images", url: "https://nextjs.org/docs/app/getting-started/metadata-and-og-images", kind: "docs" },
        { label: "Next.js Docs: opengraph-image and twitter-image", url: "https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image", kind: "docs" },
        { label: "Next.js Docs: sitemap.xml", url: "https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap", kind: "docs" },
      ],
      video: {
        title: "NextJS 16 SEO Crash Course - Metadata, Robots, Sitemap, OpenGraph...",
        channel: "PedroTech",
        url: "https://www.youtube.com/watch?v=cgq_HsDduSQ",
        videoId: "cgq_HsDduSQ",
        durationLabel: "44:18",
      },
      alternateVideos: [
        {
          title: "Next.js 15 Tutorial - 17 - Routing Metadata",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=OldUurB0Wx8",
          videoId: "OldUurB0Wx8",
          durationLabel: "8:07",
        },
        {
          title: "Next.js 16 Full Course | Build and Deploy a Production-Ready Full Stack App",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=I1V9YWqRIeI",
          videoId: "I1V9YWqRIeI",
          durationLabel: "4:10:17",
          startSeconds: 3444,
          chapterLabel: "Metadata",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `resolveMetadata(layouts, page)`, the way the App Router combines the `metadata` exported by each segment of a route.\n\n`layouts` holds the metadata object exported by each segment's layout, root first; `null` means that segment exports none. The last entry is the layout in the page's own segment, so the root page `/` has `layouts.length === 1`. `page` is the page's metadata, or `null`. Evaluate the items in order: every entry of `layouts`, then `page`.\n\n- Every key except `title` is merged shallowly: a later value replaces the earlier one entirely. Objects such as `openGraph` or `robots` are replaced, never deep-merged, and a segment that doesn't set a key leaves the earlier value alone.\n- Titles use a template stash, initially `null`. A string title resolves to the stash with every `%s` replaced by the string (or to the string itself when the stash is `null`), and has no template of its own. An object title resolves to its `default` passed through the stash the same way, but a non-empty `absolute` wins and ignores the stash; with neither it resolves to `\"\"`. Its own template is `title.template`, or `null` if it has none.\n- After each item except the last two (the page's own layout and the page itself), set the stash to the template of the most recently resolved title: `null` if that title had none, or if no title has been defined yet. That's why a layout's template never applies to the page in its own segment, why only the closest template counts, and why a layout with a plain string title stops an ancestor's template from reaching its children.\n- The result's `title` is the resolved title of the last item that defined one, or `null` if none did.\n- Finally, if the result has an `openGraph` object without a `title`, fill `openGraph.title` from the resolved title (when it's non-empty), and likewise `openGraph.description` from `description`.\n- Don't mutate the inputs.\n\nThe tests call `resolveRouteMetadata(layouts, page)`, which checks that the inputs weren't mutated and returns your result. Leave the driver as it is.",
        starterCode: `/**
 * @param {Array<object|null>} layouts  metadata exported by each segment's layout, root first;
 *   the last entry is the layout in the page's own segment (null when a segment exports none)
 * @param {object|null} page  metadata exported by the page
 * @returns {object}
 */
function resolveMetadata(layouts, page) {
  // Your code here
  return {};
}

// ---- Test driver (leave as is) ----
// Snapshots the inputs, calls your resolver and reports an error if anything was mutated.
function resolveRouteMetadata(layouts, page) {
  const before = JSON.stringify([layouts, page]);
  const result = resolveMetadata(layouts, page);
  if (JSON.stringify([layouts, page]) !== before) return { error: "input metadata was mutated" };
  return result;
}
`,
        functionName: "resolveRouteMetadata",
        testCases: [
          {
            description: "`/about`: the root layout's template applies to a page one segment down",
            args: [[{ title: { template: "%s | Acme", default: "Acme" }, description: "Acme sells rockets." }, null], { title: "About" }],
            expected: { title: "About | Acme", description: "Acme sells rockets." },
          },
          {
            description: "`/`: the root layout's template doesn't apply to the page in its own segment",
            args: [[{ title: { template: "%s | Acme", default: "Acme" }, description: "Acme sells rockets." }], { title: "Home" }],
            expected: { title: "Home", description: "Acme sells rockets." },
            isEdgeCase: true,
          },
          {
            description: "a page without a title inherits the parent's resolved default",
            args: [[{ title: { template: "%s | Acme", default: "Acme" }, description: "Acme sells rockets." }, null], { description: "Our story." }],
            expected: { title: "Acme", description: "Our story." },
          },
          {
            description: "`title.absolute` ignores the parent template",
            args: [[{ title: { template: "%s | Acme", default: "Acme" }, description: "Acme sells rockets." }, null], { title: { absolute: "Checkout" } }],
            expected: { title: "Checkout", description: "Acme sells rockets." },
          },
          {
            description: "only the closest template counts; templates don't chain",
            args: [
              [
                { title: { template: "%s | Acme", default: "Acme" }, description: "Acme sells rockets." },
                { title: { template: "%s · Blog", default: "Blog" } },
                null,
              ],
              { title: "Hello" },
            ],
            expected: { title: "Hello · Blog", description: "Acme sells rockets." },
          },
          {
            description: "`/blog`: the blog layout's template skips the blog page, which still gets the root template",
            args: [
              [
                { title: { template: "%s | Acme", default: "Acme" }, description: "Acme sells rockets." },
                { title: { template: "%s · Blog", default: "Blog" } },
              ],
              { title: "All posts" },
            ],
            expected: { title: "All posts | Acme", description: "Acme sells rockets." },
            isEdgeCase: true,
          },
          {
            description: "a layout with a plain string title stops the ancestor template from reaching its children",
            args: [
              [{ title: { template: "%s | Acme", default: "Acme" }, description: "Acme sells rockets." }, { title: "Docs" }, null],
              { title: "Intro" },
            ],
            expected: { title: "Intro", description: "Acme sells rockets." },
            isEdgeCase: true,
          },
          {
            description: "setting `openGraph` replaces the parent's whole object (its description is gone)",
            args: [[{ title: "Acme", openGraph: { title: "Acme", description: "Acme is a..." } }, null], { title: "Blog", openGraph: { title: "Blog" } }],
            expected: { title: "Blog", openGraph: { title: "Blog" } },
          },
          {
            description: "not setting `openGraph` inherits it unchanged, even though the page title changed",
            args: [[{ title: "Acme", openGraph: { title: "Acme", description: "Acme is a..." } }, null], { title: "About" }],
            expected: { title: "About", openGraph: { title: "Acme", description: "Acme is a..." } },
            isEdgeCase: true,
          },
          {
            description: "an `openGraph` without a title or description is filled from the resolved values",
            args: [[{ title: { template: "%s | Acme", default: "Acme" }, openGraph: { images: ["/og.png"] } }, null], { title: "Pricing", description: "Plans for every team." }],
            expected: {
              title: "Pricing | Acme",
              description: "Plans for every team.",
              openGraph: { images: ["/og.png"], title: "Pricing | Acme", description: "Plans for every team." },
            },
          },
          {
            description: "nested objects like `robots` are replaced, not merged",
            args: [[{ robots: { index: true, follow: true }, keywords: ["rockets"] }, { robots: { index: false } }, null], { title: "Draft" }],
            expected: { title: "Draft", robots: { index: false }, keywords: ["rockets"] },
          },
          {
            description: "a template with no `default` resolves to an empty title, which is why the docs require one",
            args: [[{ title: { template: "%s | Acme" } }], null],
            expected: { title: "" },
            isEdgeCase: true,
          },
          {
            description: "no metadata anywhere gives a null title",
            args: [[null, null], null],
            expected: { title: null },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "next-image-font-optimization",
      moduleId: "fe-nextjs",
      trackId: "frontend",
      title: "Image & Font Optimization",
      summary:
        "`next/image` renders an `<img>` with a generated `srcset`, native lazy loading, format negotiation (WebP by default, AVIF opt-in through `images.formats`) and on-demand resizing by the image optimiser. `width` and `height` describe the intrinsic size so the browser can reserve space and avoid layout shift; they don't set the rendered size, which is CSS's job. Static imports get them automatically, while remote images need them or `fill`. Remote sources must match `images.remotePatterns` (`images.domains` is deprecated), so your optimiser can't be abused as an open image proxy.\n\n`sizes` is the performance switch most people miss. Without it the browser assumes the image spans the viewport, so a thumbnail in a three-column grid can download a desktop-width file; with it Next.js emits a width-based `srcset` the browser can choose from properly. For the LCP hero, don't lazy-load: Next.js 16 deprecated `priority` in favour of `preload`, and the docs recommend `loading=\"eager\"` or `fetchPriority=\"high\"` in most cases, since preloading several candidates wastes bandwidth. Next.js 16 also changed defaults: `qualities` is `[75]` (other values are coerced to the closest allowed one), `minimumCacheTTL` is four hours, and local images with query strings need `localPatterns`.\n\n`next/font` downloads Google or local fonts at build time and self-hosts them, so the browser never calls Google, and it generates a size-adjusted fallback (`adjustFontFallback`) to minimise layout shift, with `display: \"swap\"` by default. A font is preloaded only on the routes that use it (from the root layout, that's everywhere). Each loader call hosts a separate instance, so define fonts once in a shared module, and prefer variable fonts, since non-variable Google fonts need explicit weights.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Next.js Docs: Image Component", url: "https://nextjs.org/docs/app/api-reference/components/image", kind: "docs" },
        { label: "Next.js Docs: Font Module", url: "https://nextjs.org/docs/app/api-reference/components/font", kind: "docs" },
        { label: "web.dev: Responsive images", url: "https://web.dev/learn/design/responsive-images", kind: "article" },
        { label: "web.dev: Optimize Largest Contentful Paint", url: "https://web.dev/articles/optimize-lcp", kind: "article" },
      ],
      video: {
        title: "Using Images in Next.js (next/image examples)",
        channel: "leerob",
        url: "https://www.youtube.com/watch?v=IU_qq_c_lKA",
        videoId: "IU_qq_c_lKA",
        durationLabel: "9:10",
      },
      alternateVideos: [
        {
          title: "Using Fonts in Next.js (Google Fonts, Local Fonts, Tailwind CSS)",
          channel: "leerob",
          url: "https://www.youtube.com/watch?v=L8_98i_bMMA",
          videoId: "L8_98i_bMMA",
          durationLabel: "6:05",
        },
        {
          title: "Adapting Images Sizes for Diverse Viewports in Next.js | Next.js Optimization Tips #8",
          channel: "Blazity",
          url: "https://www.youtube.com/watch?v=rQ_k8JwzUQY",
          videoId: "rQ_k8JwzUQY",
          durationLabel: "3:07",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "next-image-font-optimization-q1",
          prompt:
            "Lighthouse flags oversized images on desktop for this product grid. What's the fix?\n\n```tsx\n<div className=\"grid grid-cols-1 md:grid-cols-3\">\n  {products.map((p) => (\n    <div key={p.id} className=\"relative aspect-square\">\n      <Image src={p.imageUrl} alt={p.name} fill />\n    </div>\n  ))}\n</div>\n```",
          options: [
            "Add `sizes=\"(max-width: 768px) 100vw, 33vw\"`: without it the browser assumes each image is as wide as the viewport",
            "Add `quality={50}` to shrink every file",
            "Replace `fill` with `width={1920} height={1920}`",
            "Add `unoptimized` so the original file is served",
          ],
          correctIndex: 0,
          explanation:
            "`sizes` tells the browser how wide the image will render so it can pick a smaller candidate from the `srcset`; missing it on a `fill` or CSS-responsive image means viewport-width downloads for one-third-width tiles. Lower quality or bigger intrinsic sizes don't address the wrong candidate being chosen.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-image-font-optimization-q2",
          prompt: "Your hero image is the LCP element and, like every `next/image`, is lazy-loaded by default. What's the Next.js 16 guidance?",
          options: [
            "Load it eagerly with `loading=\"eager\"` or `fetchPriority=\"high\"`, or use `preload`, which replaced the deprecated `priority`",
            "Add `priority`, the current recommended prop for LCP images",
            "Add `unoptimized` so it skips the optimiser and arrives sooner",
            "Add `preload` to every image above the fold",
          ],
          correctIndex: 0,
          explanation:
            "Next.js 16 deprecated `priority` in favour of `preload`, and the docs say that in most cases `loading=\"eager\"` or `fetchPriority=\"high\"` is the better choice. Preloading several possible LCP candidates competes for bandwidth, and skipping optimisation usually makes the file bigger.",
        },
        {
          id: "next-image-font-optimization-q3",
          prompt:
            "`<Image src=\"https://cdn.example.com/products/a.jpg\" width={800} height={600} alt=\"Mug\" />` throws an error about an unconfigured host. What's the right fix?",
          options: [
            "Allow the host, ideally with a path prefix, in `images.remotePatterns`",
            "Add the host to `images.domains`",
            "Set `images.dangerouslyAllowSVG: true`",
            "Switch every image to a plain `<img>` tag",
          ],
          correctIndex: 0,
          explanation:
            "`remotePatterns` is the allow-list for remote sources; making it specific stops strangers from using your optimiser (and your bill) for arbitrary URLs. `images.domains` is deprecated in Next.js 16, and the SVG flag is unrelated.",
        },
        {
          id: "next-image-font-optimization-q4",
          prompt: "A new Next.js 16 app uses the default image config, and a developer sets `quality={90}` on a product photo. What quality is served?",
          options: ["75", "90", "100", "The build fails"],
          correctIndex: 0,
          explanation:
            "Since Next.js 16 `images.qualities` defaults to `[75]`, and a `quality` prop outside the allow-list is coerced to the closest allowed value (with a warning in development). Add `90` to `images.qualities` if you need it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-image-font-optimization-q5",
          prompt: "What do `width` and `height` on a remote `next/image` control?",
          options: [
            "The intrinsic size, used for the aspect ratio so space is reserved; CSS decides the rendered size",
            "The rendered size in CSS pixels, overriding your stylesheets",
            "The largest width the optimiser will ever generate",
            "Nothing for remote images; they only matter for local files",
          ],
          correctIndex: 0,
          explanation:
            "They let the browser reserve the right box before the image loads, which prevents CLS. If you set a custom width in CSS, also set `height: auto` to keep the ratio; if you don't know the dimensions, use `fill` with a positioned parent.",
        },
        {
          id: "next-image-font-optimization-q6",
          prompt: "What does `next/font/google` do? (Select all that apply.)",
          options: [
            "Downloads the font at build time and serves it from your own domain, so browsers never contact Google",
            "Generates a size-adjusted fallback font to reduce layout shift",
            "Uses `font-display: swap` by default",
            "Preloads every font on every route of the app",
            "Fetches the Google Fonts CSS at runtime on each request",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Fonts are self-hosted as static assets from the build, with an automatic fallback (`adjustFontFallback`) and `display: \"swap\"` unless you change it. Preloading is scoped to the routes that use the font, and nothing is fetched from Google at runtime.",
        },
        {
          id: "next-image-font-optimization-q7",
          prompt: "Five components each call `Inter({ subsets: [\"latin\"] })` in their own file. What's the consequence?",
          options: [
            "Each call hosts its own instance of the font; define it once in a shared module and import that",
            "Nothing: Next.js deduplicates identical calls",
            "The build fails because fonts can only be loaded in the root layout",
            "Only the first call works and the rest fall back to system fonts",
          ],
          correctIndex: 0,
          explanation:
            "The docs say every font-function call is hosted as one instance, so repeated calls multiply what's generated and loaded. A `fonts.ts` definitions file (optionally behind a path alias) keeps a single instance.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-image-font-optimization-q8",
          prompt: "A font is loaded in `app/blog/layout.tsx`. On which routes is it preloaded?",
          options: [
            "On the routes that layout wraps: `/blog` and everything below it",
            "On every route, because fonts are global",
            "Only on `/blog` itself",
            "Nowhere: fonts are only preloaded from the root layout",
          ],
          correctIndex: 0,
          explanation:
            "Preloading follows the file that calls the loader: a page preloads on its route, a layout on the routes it wraps, and the root layout on every route.",
        },
        {
          id: "next-image-font-optimization-q9",
          prompt: "You set `images.formats: [\"image/avif\", \"image/webp\"]`. Which statements are true? (Select all that apply.)",
          options: [
            "Browsers that accept AVIF get AVIF, and others fall back to WebP",
            "Each format is cached separately, so storage grows",
            "The first request for an AVIF variant is typically slower, because AVIF encodes more slowly",
            "Every browser now receives AVIF",
            "A CDN in front of a self-hosted app can safely ignore the `Accept` header",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The optimiser picks the first configured format the request's `Accept` header allows, so the order matters and a proxy or CDN in front of a self-hosted app must forward `Accept`. AVIF files are smaller but slower to encode on a cold cache, and each format is stored separately.",
        },
        {
          id: "next-image-font-optimization-q10",
          prompt: "You add `placeholder=\"blur\"` to a remote image and get an error about `blurDataURL`. Why?",
          options: [
            "An automatic `blurDataURL` only exists for statically imported images; remote or dynamic images need one supplied",
            "Blur placeholders require AVIF output",
            "`placeholder` only works together with `fill`",
            "Blur placeholders were removed in Next.js 16",
          ],
          correctIndex: 0,
          explanation:
            "At build time Next.js can read a static import and generate a tiny blurred version; it can't do that for a URL it only sees at runtime. Provide a small data URL yourself (for example from Plaiceholder), keeping it tiny.",
        },
      ],
    },
    {
      id: "next-authentication",
      moduleId: "fe-nextjs",
      trackId: "frontend",
      title: "Authentication with NextAuth (Auth.js)",
      summary:
        "Authentication in the App Router has three parts: proving identity, managing the session, and authorising every read and write. Auth.js (the NextAuth project) handles the first two: an `auth.ts` exports `{ handlers, signIn, signOut, auth }`, `app/api/auth/[...nextauth]/route.ts` re-exports `handlers` as `GET` and `POST`, and `auth()` returns the session in Server Components, Server Actions and Route Handlers. Know the landscape: `next-auth@latest` is still v4, v5 installs as `next-auth@beta` and is still in beta, and since September 2025 Auth.js has been maintained by the Better Auth team, which keeps patching it but recommends Better Auth for new projects.\n\nSessions are either stateless or database-backed. A stateless session is an encrypted JWT in an HttpOnly cookie, the Auth.js default without a database adapter: no lookups, but it can't be revoked before it expires, and cookies top out around 4 KB (Auth.js chunks larger ones). Database sessions, the default with an adapter, are revocable and allow \"sign out everywhere\", at the cost of a query per check. Keep the payload minimal either way.\n\nWhere you check matters more than which library you pick. Proxy (`export { auth as proxy }` with an `authorized` callback) is for optimistic redirects from the cookie, and Auth.js itself warns against relying on it alone. Layouts don't re-render on navigation and don't stop nested segments or parallel slots from rendering, so a check there, or an SPA-style `return null`, protects nothing. Put the real check in a server-only Data Access Layer, a `verifySession()` memoised with `React.cache` that every data read, Server Action and Route Handler calls, and return DTOs instead of raw user rows.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Next.js Docs: Authentication", url: "https://nextjs.org/docs/app/guides/authentication", kind: "docs" },
        { label: "Auth.js: Installation (Next.js)", url: "https://authjs.dev/getting-started/installation?framework=next.js", kind: "docs" },
        { label: "Auth.js: Session Strategies", url: "https://authjs.dev/concepts/session-strategies", kind: "docs" },
        { label: "Better Auth Blog: Auth.js is now part of Better Auth", url: "https://better-auth.com/blog/authjs-joins-better-auth", kind: "article" },
      ],
      video: {
        title: "Next.js Patterns: Authentication (Best Practices for Server Components, Actions, Middleware)",
        channel: "Delba",
        url: "https://www.youtube.com/watch?v=N_sUsq_y10U",
        videoId: "N_sUsq_y10U",
        durationLabel: "12:14",
      },
      alternateVideos: [
        {
          title: "Next.js App Router Authentication (Sessions, Cookies, JWTs)",
          channel: "leerob",
          url: "https://www.youtube.com/watch?v=DJvM2lSPn6w",
          videoId: "DJvM2lSPn6w",
          durationLabel: "11:31",
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
          id: "next-authentication-q1",
          prompt: "You want Auth.js v5 (the `auth()` API) in a new Next.js 16 app. Which install command gets it?",
          options: [
            "`npm install next-auth@beta`, because the `latest` tag still points to v4",
            "`npm install next-auth@latest`",
            "`npm install next-auth@5`, because v5 is the stable release",
            "`npm install @auth/core` on its own, with no Next.js package",
          ],
          correctIndex: 0,
          explanation:
            "As of September 2026, `next-auth@latest` resolves to 4.24.x and v5 is published under the `beta` tag (the docs install it that way). Installing `latest` gives you the v4 API, whose setup and helpers differ.",
        },
        {
          id: "next-authentication-q2",
          prompt: "What's the status of Auth.js (NextAuth) in 2026?",
          options: [
            "Since September 2025 the Better Auth team maintains it, still shipping security fixes but recommending Better Auth for new projects",
            "It was archived and no longer receives security fixes",
            "It was merged into Next.js as `next/auth`",
            "It became Better Auth v6 under the same package name",
          ],
          correctIndex: 0,
          explanation:
            "The Auth.js site says the project is now part of Better Auth; the announcement promises continued security patches for existing users and recommends Better Auth for new projects unless a specific feature (such as database-less stateless sessions) is missing.",
        },
        {
          id: "next-authentication-q3",
          prompt: "Auth.js is configured with an OAuth provider and no database adapter. Which session strategy does it use?",
          options: [
            "An encrypted JWT in a cookie; database sessions become the default only when an adapter is configured",
            "Database sessions kept in server memory",
            "A session ID stored in `localStorage`",
            "None: Auth.js refuses to start without an adapter",
          ],
          correctIndex: 0,
          explanation:
            "JWT is the default unless a database adapter is set. It needs no lookups and scales easily, but the trade-offs (revocation, cookie size) are the price of statelessness.",
        },
        {
          id: "next-authentication-q4",
          prompt: "An admin bans a user whose Auth.js session is a JWT valid for 30 days. What happens to the user's current session?",
          options: [
            "It keeps working until the token expires, unless you add a server-side deny-list or switch to database sessions",
            "It ends immediately, because Auth.js checks the user table on every request",
            "It ends at the next navigation, because the cookie is re-encrypted",
            "Auth.js rotates `AUTH_SECRET` automatically, invalidating all sessions",
          ],
          correctIndex: 0,
          explanation:
            "A JWT is self-contained, so the server accepts it until it expires; Auth.js notes that expiring one early needs a blocklist. Database sessions make revocation (and \"sign out everywhere\") a row delete.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-authentication-q5",
          prompt:
            "The dashboard pages and their Server Actions have no checks besides this layout. What's the problem?\n\n```tsx\n// app/dashboard/layout.tsx\nexport default async function Layout({ children }: { children: React.ReactNode }) {\n  const session = await auth();\n  if (!session) redirect(\"/login\");\n  return <Shell>{children}</Shell>;\n}\n```",
          options: [
            "Layouts don't re-render on client navigation and don't gate nested pages or Server Actions, which are separate entry points",
            "Nothing: a layout wraps every page below it, so they're all protected",
            "`redirect` can't be called from a layout",
            "`auth()` only works in Route Handlers",
          ],
          correctIndex: 0,
          explanation:
            "Partial rendering keeps the layout mounted across navigations, the router renders segments independently, and every Server Action is its own POST endpoint. Do the check close to the data, in the DAL and in each action.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-authentication-q6",
          prompt: "You add `export { auth as proxy } from \"@/auth\"` with an `authorized` callback that returns `!!auth`. What does that give you?",
          options: [
            "An optimistic redirect for signed-out users before rendering; data access and actions still need their own checks",
            "Complete authorisation, so pages and actions can skip their checks",
            "A database lookup of the session on every request, which is the recommended pattern",
            "Protection that applies only to Route Handlers",
          ],
          correctIndex: 0,
          explanation:
            "Proxy runs on every matched request, prefetches included, so it should only read the cookie. Both the Next.js and Auth.js docs say not to rely on it exclusively: verify the session as close to the data as possible.",
        },
        {
          id: "next-authentication-q7",
          prompt: "Where must the caller's identity and permissions be verified? (Select all that apply.)",
          options: [
            "Inside every Server Action that changes data",
            "Inside every Route Handler that returns private data",
            "In the Data Access Layer functions that read user data",
            "Only in `proxy.ts`, because it runs first",
            "Only in the root layout, because it wraps everything",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Actions and Route Handlers are public endpoints, and a DAL makes every read check the session so nobody forgets. Proxy is an optimistic pre-filter, and layouts neither re-run on navigation nor stop other entry points.",
        },
        {
          id: "next-authentication-q8",
          prompt:
            "`@admin/page.tsx` loads sensitive metrics and has no checks of its own. What's the risk with this layout?\n\n```tsx\n// app/dashboard/layout.tsx\nexport default async function Layout({ admin, user }: { admin: React.ReactNode; user: React.ReactNode }) {\n  const role = await getRole();\n  return role === \"admin\" ? admin : user;\n}\n```",
          options: [
            "Both slots render on the server for every visitor, so `@admin`'s queries run and its output is included in the response",
            "None: the layout returns `user` for non-admins, so `@admin` never runs",
            "The `@admin` slot gets cached and shown to the next visitor",
            "Only the `@admin` slot's metadata leaks",
          ],
          correctIndex: 0,
          explanation:
            "Parallel slots are rendered by the router, not by the layout's conditional, so the conditional decides what's displayed, not what executes or what's in the RSC Payload. Authorise inside each slot's page or in the DAL.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-authentication-q9",
          prompt: "Why wrap `verifySession()` in `React.cache` in the Data Access Layer?",
          options: [
            "So many components can call it in one request while the session is read, and checked against the database, only once",
            "To cache the session across requests and users for speed",
            "Because `cookies()` can only be called inside `React.cache`",
            "So the session becomes available in Client Components",
          ],
          correctIndex: 0,
          explanation:
            "`React.cache` memoises per request, so each render pass does one check no matter how many callers. Caching a session across requests would be a security bug, and Client Components can't import the DAL; pass them the data they need.",
        },
        {
          id: "next-authentication-q10",
          prompt: "Which setup does the Next.js authentication guide recommend for a stateless session cookie?",
          options: [
            "Set it on the server with `HttpOnly`, `Secure`, a `SameSite` policy, an expiry and a `Path`",
            "Make it readable by JavaScript so the client can send it as a bearer token",
            "Keep it in `localStorage` and send it in a custom header",
            "Use `SameSite=None` without `Secure` so it works on every site",
          ],
          correctIndex: 0,
          explanation:
            "`HttpOnly` keeps scripts (and XSS) away from the token, `Secure` keeps it on HTTPS and `SameSite` limits cross-site sending. Browsers reject `SameSite=None` without `Secure`, and `localStorage` is readable by any injected script.",
        },
        {
          id: "next-authentication-q11",
          prompt:
            "`getProfile()` in the DAL returns the full user row, including `passwordHash` and `resetToken`, and a Server Component passes it to a Client Component. What does the guide recommend?",
          options: [
            "Return a DTO with only the fields the UI needs, such as `{ id, name, avatarUrl }`, from the DAL",
            "Nothing: fields the component never renders aren't sent",
            "Delete the sensitive fields inside the Client Component before rendering",
            "Mark the Client Component with `\"use server\"` so its props stay on the server",
          ],
          correctIndex: 0,
          explanation:
            "Props passed to Client Components are serialised in full, so filtering has to happen on the server before the data leaves the DAL. Deleting fields in the Client Component is too late: they've already been sent.",
        },
      ],
    },
    {
      id: "next-deploy-vercel",
      moduleId: "fe-nextjs",
      trackId: "frontend",
      title: "Deploying to Vercel (and Self-Hosting)",
      summary:
        "On Vercel a Next.js build is mapped onto infrastructure automatically: static assets and prerendered pages are served from the CDN, ISR output is persisted to durable storage and revalidated globally, and dynamic routes, Server Actions and Route Handlers run as Vercel Functions on Fluid compute (the default for new projects since April 2025), bundled into as few functions as possible. Functions run in one region by default (`iad1`), so put the database next to them. Every push to a non-production branch gets a preview deployment with its own URL, which Deployment Protection can restrict to your team. Environment variables are scoped to Production, Preview (optionally per branch) and Development, and changing one only affects new deployments.\n\nEnvironment variables are where teams get hurt. `NEXT_PUBLIC_*` values are inlined into the JavaScript bundle at `next build`, so they're public and frozen per build: promote one Docker image across environments and the browser keeps the build-time value. Everything else is server-only, so reading it in a Client Component gets nothing, and renaming a secret to `NEXT_PUBLIC_` to \"fix\" that publishes it. Fluid compute runs many invocations in one instance, so module-level mutable state is shared by concurrent requests.\n\nSelf-hosting (`next start`, Docker or `output: \"standalone\"`) supports every feature but hands you the platform work. Standalone output copies only the traced files and a minimal `server.js`, not `public/` or `.next/static`, which you copy in or serve from a CDN. Multiple instances need a shared cache handler (otherwise revalidation reaches only the instance that received it), a stable `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` and a `deploymentId` for version-skew protection, and a proxy in front must not buffer responses, or streaming and PPR lose their benefit. `output: \"export\"` produces static files with no server features at all.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Next.js Docs: Deploying", url: "https://nextjs.org/docs/app/getting-started/deploying", kind: "docs" },
        { label: "Next.js Docs: Self-Hosting", url: "https://nextjs.org/docs/app/guides/self-hosting", kind: "docs" },
        { label: "Vercel Docs: Next.js on Vercel", url: "https://vercel.com/docs/frameworks/full-stack/nextjs", kind: "docs" },
        { label: "Vercel Docs: Environment variables", url: "https://vercel.com/docs/environment-variables", kind: "docs" },
      ],
      video: {
        title: "Deploying Next.js to Vercel",
        channel: "Vercel",
        url: "https://www.youtube.com/watch?v=AiiGjB2AxqA",
        videoId: "AiiGjB2AxqA",
        durationLabel: "6:21",
      },
      alternateVideos: [
        {
          title: "Next.js React Framework Course – Build and Deploy a Full Stack App From scratch",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=KjY94sAKLlw",
          videoId: "KjY94sAKLlw",
          durationLabel: "4:47:36",
          startSeconds: 16140,
          chapterLabel: "Deploy the APP in Vercel",
        },
        {
          title: "Self-Hosting Next.js",
          channel: "leerob",
          url: "https://www.youtube.com/watch?v=sIVL4JMqRfc",
          videoId: "sIVL4JMqRfc",
          durationLabel: "45:12",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "next-deploy-vercel-q1",
          prompt: "You change `NEXT_PUBLIC_API_URL` in the Vercel dashboard. The live production site keeps calling the old URL. Why?",
          options: [
            "Env var changes only apply to new deployments, and `NEXT_PUBLIC_` values are inlined at build time, so you must redeploy",
            "Vercel caches environment variables for 24 hours",
            "The browser caches `NEXT_PUBLIC_` values in `localStorage`",
            "Production keeps using the Development values until you promote them",
          ],
          correctIndex: 0,
          explanation:
            "Vercel applies variable changes to the next deployment only, and a `NEXT_PUBLIC_` value is baked into the client bundle when it's built. A new build is the only way to change it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-deploy-vercel-q2",
          prompt:
            "You build one Docker image and promote it from staging to production, setting `NEXT_PUBLIC_FEATURE_X=on` only in production's container environment. The feature stays off in the browser. Why, and what works?",
          options: [
            "The value was inlined when the image was built; read runtime config on the server (for example after `await connection()`) and pass it down, or serve it from an endpoint",
            "Containers can't pass environment variables to Next.js",
            "It has to be named `NEXT_RUNTIME_FEATURE_X` to be read at runtime",
            "Restarting the container re-inlines the new value into the bundle",
          ],
          correctIndex: 0,
          explanation:
            "`NEXT_PUBLIC_` variables are frozen at `next build`, which is why the docs warn about promoting one image across environments. Server code can read `process.env` at request time during dynamic rendering, so runtime values should travel from the server to the client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-deploy-vercel-q3",
          prompt:
            "`STRIPE_SECRET_KEY` is `undefined` in a Client Component, so a developer renames it `NEXT_PUBLIC_STRIPE_SECRET_KEY` and checkout starts working. What have they done?",
          options: [
            "Published the secret: it's now inlined into JavaScript that anyone can download",
            "Nothing risky, because Vercel encrypts environment variables at rest",
            "Nothing risky, as long as the component only renders on an authenticated page",
            "Broken the build, because `NEXT_PUBLIC_` names can't contain `SECRET`",
          ],
          correctIndex: 0,
          explanation:
            "Encryption at rest protects the dashboard value, not the bundle it gets inlined into, and authentication doesn't hide static JavaScript. Keep the key server-only and call Stripe from a Server Action or Route Handler (then rotate the leaked key).",
        },
        {
          id: "next-deploy-vercel-q4",
          prompt: "Which statements about Vercel preview deployments are true? (Select all that apply.)",
          options: [
            "Every push to a non-production branch gets its own deployment URL",
            "A Preview variable can be scoped to one branch, overriding the general Preview value",
            "Standard Deployment Protection restricts preview URLs to people with access",
            "Previews share the production deployment's cache entries",
            "Editing a Preview variable updates existing preview deployments immediately",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Previews are full, separate deployments: Next.js scopes its caches to a single deployment, and variable edits only reach new deployments. Standard Protection covers every URL except production domains, so webhooks to a preview need a bypass.",
        },
        {
          id: "next-deploy-vercel-q5",
          prompt:
            "This works in testing, but on Fluid compute it occasionally returns another customer's orders. Why?\n\n```ts\n// lib/current-user.ts\nexport let currentUser: User | null = null;\nexport function setCurrentUser(user: User | null) {\n  currentUser = user;\n}\n\n// app/api/orders/route.ts\nexport async function GET(request: Request) {\n  setCurrentUser(await userFromRequest(request));\n  const orders = await loadOrders(); // reads currentUser internally\n  return Response.json(orders);\n}\n```",
          options: [
            "Fluid compute runs concurrent invocations in one instance, so requests overwrite each other's module-level `currentUser` while they await",
            "Vercel caches `GET` Route Handlers across users by default",
            "Module-level variables are reset before every request",
            "The CDN merged two users' responses",
          ],
          correctIndex: 0,
          explanation:
            "Module scope is per instance, not per request, and with in-function concurrency one request can resume after another has replaced the value. Pass the user explicitly (or use `AsyncLocalStorage`); Route Handlers aren't cached by default.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "next-deploy-vercel-q6",
          prompt:
            "You deploy `output: \"standalone\"` by copying `.next/standalone` into a container and running `node server.js`. Pages render, but CSS, JS chunks and images 404. Why?",
          options: [
            "The standalone output doesn't include `public/` or `.next/static`; copy them into the standalone folder or serve them from a CDN",
            "`server.js` only serves Route Handlers",
            "Standalone output must be started with `next start`",
            "`assetPrefix` is required whenever standalone output is used",
          ],
          correctIndex: 0,
          explanation:
            "Standalone traces and copies only what the server needs; static assets are left out on the assumption that a CDN serves them. Once copied to `standalone/public` and `standalone/.next/static`, `server.js` serves them automatically.",
        },
        {
          id: "next-deploy-vercel-q7",
          prompt: "Which features are unavailable with `output: \"export\"`? (Select all that apply.)",
          options: [
            "Proxy",
            "ISR and on-demand revalidation",
            "Server Actions",
            "Client Components",
            "A `GET` Route Handler with `dynamic = \"force-static\"` that emits a JSON file",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A static export has no server, so anything that runs per request (Proxy, revalidation, Server Actions, cookies, rewrites, default image optimisation) is out. Client Components and static `GET` handlers that produce files at build time are fine.",
        },
        {
          id: "next-deploy-vercel-q8",
          prompt:
            "Your Postgres database is in Frankfurt and a dynamic page makes five sequential queries. On Vercel it's slow for everyone, including users in Germany. What's the likely cause?",
          options: [
            "Vercel Functions run in one region by default (`iad1`, in the US), so every query crosses the Atlantic; set the function region next to the database",
            "Functions run at the edge location nearest each user, which is far from the database",
            "Dynamic pages are rendered in the browser on Vercel",
            "Vercel blocks outbound Postgres connections from functions",
          ],
          correctIndex: 0,
          explanation:
            "Latency between compute and data dominates sequential queries, so region choice matters more than CDN proximity. Configure the default region (or per-function regions) to sit next to the database.",
        },
        {
          id: "next-deploy-vercel-q9",
          prompt:
            "You self-host behind nginx. Pages with Suspense boundaries arrive all at once after the slowest data finishes, and PPR's fast first byte is gone. What's the fix?",
          options: [
            "Disable response buffering for Next.js (for example with `X-Accel-Buffering: no`) so streamed chunks flush",
            "Enable gzip compression in nginx",
            "Switch to `output: \"export\"`",
            "Add more `loading.tsx` files",
          ],
          correctIndex: 0,
          explanation:
            "Streaming only helps if every hop passes chunks through; a buffering proxy or load balancer holds the whole response. Without end-to-end streaming, PPR's shell and holes are delivered together after the full render.",
        },
        {
          id: "next-deploy-vercel-q10",
          prompt: "You run six self-hosted Next.js instances behind a load balancer. What do you need for correct behaviour? (Select all that apply.)",
          options: [
            "A shared cache handler, so revalidation reaches every instance",
            "The same `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` on every instance",
            "A `deploymentId`, so clients on an old build are detected during rolling deploys",
            "A separate build per instance, so each gets its own build ID",
            "`proxy.ts` running on the Edge runtime",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The default cache and encryption keys are per instance or per build, so they must be shared, and `deploymentId` makes Next.js hard-navigate when a client and server disagree on the version. Every instance should run the same build, and Proxy is Node.js-only anyway.",
        },
      ],
    },
  ],
} satisfies Module;
