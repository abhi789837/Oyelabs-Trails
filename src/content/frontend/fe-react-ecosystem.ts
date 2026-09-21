import type { Module } from "@/types/curriculum";

// Test fixtures for the route-matcher challenge (plain data, shared by its test cases).
const APP_ROUTES = [
  {
    id: "root",
    path: "/",
    children: [
      { id: "home", index: true },
      { id: "about", path: "about" },
      {
        id: "users",
        path: "users",
        children: [
          { id: "usersIndex", index: true },
          { id: "user", path: ":userId", children: [{ id: "userEdit", path: "edit" }] },
          { id: "userNew", path: "new" },
        ],
      },
      {
        id: "settingsLayout",
        children: [{ id: "profile", path: "settings/profile" }, { id: "billing", path: "settings/billing" }],
      },
      { id: "files", path: "files/*" },
      { id: "notFound", path: "*" },
    ],
  },
];

const RANKED_ROUTES = [
  { id: "teamsSplat", path: "/teams/*" },
  { id: "team", path: "/teams/:teamId" },
  { id: "teamNew", path: "/teams/new" },
  { id: "anyNew", path: "/:section/new" },
  { id: "first", path: "/dup" },
  { id: "second", path: "/dup" },
];

// Test fixtures for the form-validation challenge.
const SIGNUP_SCHEMA = {
  email: {
    rules: [
      { type: "required", message: "Email is required" },
      { type: "pattern", value: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", message: "Enter a valid email" },
    ],
  },
  password: {
    rules: [
      { type: "required", message: "Password is required" },
      { type: "minLength", value: 8, message: "Use at least 8 characters" },
    ],
    deps: ["confirm"],
  },
  confirm: { rules: [{ type: "sameAs", field: "password", message: "Passwords don't match" }] },
};

const SIGNUP_EMPTY = { email: "", password: "", confirm: "" };

const NO_DEPS_SCHEMA = {
  password: { rules: [{ type: "minLength", value: 8, message: "Use at least 8 characters" }] },
  confirm: { rules: [{ type: "sameAs", field: "password", message: "Passwords don't match" }] },
};

const PROFILE_SCHEMA = {
  nickname: { rules: [{ type: "minLength", value: 3, message: "At least 3 characters" }] },
  age: {
    rules: [
      { type: "min", value: 18, message: "You must be 18 or older" },
      { type: "max", value: 130, message: "Enter a real age" },
    ],
  },
  contact: { rules: [{ type: "required", message: "Pick a contact method" }] },
  phone: {
    rules: [
      {
        type: "requiredIf",
        field: "contact",
        equals: "phone",
        message: "Phone is required for phone contact",
      },
    ],
  },
  "address.zip": { rules: [{ type: "pattern", value: "^\\d{5}$", message: "ZIP must be 5 digits" }] },
  "trip.start": { rules: [{ type: "required", message: "Start date is required" }] },
  "trip.end": { rules: [{ type: "after", field: "trip.start", message: "End must be after start" }] },
};

const PROFILE_DEFAULTS = { nickname: "", age: "", contact: "", phone: "", address: { zip: "" }, trip: { start: "", end: "" } };

export default {
  id: "fe-react-ecosystem",
  trackId: "frontend",
  name: "React Ecosystem",
  description:
    "The libraries a production React app is actually built from: React Router v8 (routing, data loaders, actions and auth guards), Redux Toolkit and Zustand for client state, TanStack Query for server state, React Hook Form for forms, and Vitest, React Testing Library, Playwright and Cypress for tests. Every topic focuses on the model underneath the API, the tradeoffs between the options, and the bugs experienced teams still ship.",
  refs: [
    { label: "React Router: Docs home", url: "https://reactrouter.com/home", kind: "docs" },
    { label: "Redux Toolkit: Docs", url: "https://redux-toolkit.js.org/", kind: "docs" },
    { label: "TanStack Query: Docs", url: "https://tanstack.com/query/latest", kind: "docs" },
    { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
  ],
  topics: [
    {
      id: "react-eco-router-fundamentals",
      moduleId: "fe-react-ecosystem",
      trackId: "frontend",
      title: "React Router Fundamentals: Routes, Params & Nested Routes",
      summary:
        "React Router maps URL segments onto a tree of routes and renders the matched branch: each parent renders an `<Outlet />` where its matched child goes, so layouts nest the same way the URL does. Keeping navigational state in the URL (path params, search params) instead of component state is the real point. It survives reloads, deep links and the back button, and it makes \"which screen am I on?\" something you derive, not something you store.\n\nReact Router v8 (June 2026, needs React 19.2.7+) keeps v7's three modes. Declarative mode is `<BrowserRouter>` plus `<Routes>`; data mode is `createBrowserRouter` with loaders, actions and fetchers; framework mode adds a Vite plugin with typed route modules, SSR/SSG and automatic code splitting. The modes are additive, so pick by how much of data loading and bundling you want the router to own. The `react-router-dom` package is gone in v8: import from `react-router`, and `RouterProvider` from `react-router/dom`.\n\nMatching is ranked, not first-match. Every root-to-leaf branch gets a score (static segments outrank `:params`, which outrank a `*` splat, and index routes get a bonus) and the best branch wins wherever it's declared, with ties going to the earlier sibling. So `/teams/new` beats `/teams/:teamId` even if it's declared last. Static segments match case-insensitively unless `caseSensitive` is set, trailing slashes are ignored, and a splat also matches zero segments (`files/*` matches `/files` with `params[\"*\"] === \"\"`).\n\nGotchas: all matches share one params object, so a parent's `useParams()` also sees its child's params; index routes can't have children (use a layout route); and relative links resolve against the route hierarchy, not the literal URL.",
      level: "intermediate",
      estMinutes: 75,
      webRefs: [
        { label: "React Router: Routing (declarative mode)", url: "https://reactrouter.com/start/declarative/routing", kind: "docs" },
        { label: "React Router: Picking a mode", url: "https://reactrouter.com/start/modes", kind: "docs" },
        { label: "React Router: Updating from v7", url: "https://reactrouter.com/upgrading/v7", kind: "article" },
        { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Learn React Router v6 In 45 Minutes",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=Ul3y1LXxzdU",
        videoId: "Ul3y1LXxzdU",
        durationLabel: "46:20",
      },
      alternateVideos: [
        {
          title: "React Router V7 Tutorial - Routing, Nested Routes, Data Loading, Layouts...",
          channel: "PedroTech",
          url: "https://www.youtube.com/watch?v=h7MTWLv3xvw",
          videoId: "h7MTWLv3xvw",
          durationLabel: "51:11",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `matchRoutes(routes, pathname)`, a simplified version of React Router's matcher that returns the winning branch.\n\nRoute objects look like `{ id, path?, index?, children? }`:\n\n- `path` is relative to the parent (`\"users\"`, `\":userId\"`, `\"files/*\"`, `\"settings/profile\"`). Top-level paths may start with `/`.\n- `index: true` marks an index route: no path, no children, and it matches exactly its parent's URL.\n- A route with neither `path` nor `index` is a pathless layout route: it never matches on its own, but its children match beneath it and it appears in their chain.\n\nSegments are static (`users`), dynamic (`:name`, exactly one URL segment) or a splat (`*`, always last, matching the rest of the URL including nothing).\n\nRules:\n\n- Pathnames start with `/` and never contain `//`; ignore a trailing slash. Static segments compare case-insensitively.\n- A branch is a chain of routes from the top level down to a route that has a `path` or is an index route. Its pattern is all the segments along the chain, in order.\n- Among the branches that match, the highest score wins: the pattern's segment count, plus 10 per static segment, plus 3 per dynamic segment, minus 2 if it ends in a splat, plus 2 if the branch ends at an index route. On a tie, the branch whose last route comes first in a depth-first walk of the config wins (a route's children are visited before the route itself).\n- Return `{ ids, params }`: the route ids along the winning chain, and params from every dynamic segment (name without the `:`) plus `\"*\"` for a splat (the remaining URL segments joined with `/`, or `\"\"`). Decode each value with `decodeURIComponent`, keeping a segment as-is if decoding throws.\n- Return `null` when nothing matches.",
        starterCode: "/**\n * @param {Array<{ id: string, path?: string, index?: boolean, children?: Array }>} routes\n * @param {string} pathname\n * @returns {{ ids: string[], params: Record<string, string> } | null}\n */\nfunction matchRoutes(routes, pathname) {\n  // Your code here\n  return null;\n}\n",
        functionName: "matchRoutes",
        testCases: [
          {
            description: "`/` matches the root's index route",
            args: [APP_ROUTES, "/"],
            expected: { ids: ["root", "home"], params: {} },
          },
          {
            description: "nested dynamic segment: the whole chain and its params",
            args: [APP_ROUTES, "/users/42/edit"],
            expected: { ids: ["root", "users", "user", "userEdit"], params: { userId: "42" } },
          },
          {
            description: "a static segment outranks a dynamic sibling declared before it",
            args: [APP_ROUTES, "/users/new"],
            expected: { ids: ["root", "users", "userNew"], params: {} },
          },
          {
            description: "an index route outranks its parent at the parent's URL",
            args: [APP_ROUTES, "/users"],
            expected: { ids: ["root", "users", "usersIndex"], params: {} },
          },
          {
            description: "a pathless layout route appears in the chain without adding segments",
            args: [APP_ROUTES, "/settings/profile"],
            expected: { ids: ["root", "settingsLayout", "profile"], params: {} },
          },
          {
            description: "param values keep their case and are URL-decoded",
            args: [APP_ROUTES, "/users/Ada%20L"],
            expected: { ids: ["root", "users", "user"], params: { userId: "Ada L" } },
          },
          {
            description: "a splat collects the rest of the URL, decoded",
            args: [APP_ROUTES, "/files/docs/q3%20report.pdf"],
            expected: { ids: ["root", "files"], params: { "*": "docs/q3 report.pdf" } },
          },
          {
            description: "a splat also matches zero segments",
            args: [APP_ROUTES, "/files"],
            expected: { ids: ["root", "files"], params: { "*": "" } },
            isEdgeCase: true,
          },
          {
            description: "static segments match case-insensitively and a trailing slash is ignored",
            args: [APP_ROUTES, "/USERS/New/"],
            expected: { ids: ["root", "users", "userNew"], params: {} },
            isEdgeCase: true,
          },
          {
            description: "too many segments fall through to the catch-all",
            args: [APP_ROUTES, "/users/42/edit/extra"],
            expected: { ids: ["root", "notFound"], params: { "*": "users/42/edit/extra" } },
          },
          {
            description: "ranking: `/teams/new` beats `/teams/:teamId`, `/:section/new` and `/teams/*`",
            args: [RANKED_ROUTES, "/teams/new"],
            expected: { ids: ["teamNew"], params: {} },
          },
          {
            description: "ranking: a dynamic segment beats a splat",
            args: [RANKED_ROUTES, "/teams/7"],
            expected: { ids: ["team"], params: { teamId: "7" } },
          },
          {
            description: "ranking: only the splat matches deeper URLs",
            args: [RANKED_ROUTES, "/teams/7/members"],
            expected: { ids: ["teamsSplat"], params: { "*": "7/members" } },
          },
          {
            description: "ranking: a dynamic first segment still matches",
            args: [RANKED_ROUTES, "/players/new"],
            expected: { ids: ["anyNew"], params: { section: "players" } },
          },
          {
            description: "identical siblings: the first one declared wins",
            args: [RANKED_ROUTES, "/dup"],
            expected: { ids: ["first"], params: {} },
            isEdgeCase: true,
          },
          {
            description: "the index bonus: an index route beats an empty-path sibling declared before it",
            args: [
              [
                {
                  id: "dash",
                  path: "dashboard",
                  children: [{ id: "overview", path: "" }, { id: "home", index: true }, { id: "stats", path: "stats" }],
                },
              ],
              "/dashboard",
            ],
            expected: { ids: ["dash", "home"], params: {} },
            isEdgeCase: true,
          },
          {
            description: "malformed percent-encoding is kept as-is",
            args: [APP_ROUTES, "/users/%E0%A4%A"],
            expected: { ids: ["root", "users", "user"], params: { userId: "%E0%A4%A" } },
            isEdgeCase: true,
          },
          {
            description: "no routes means no match",
            args: [[], "/"],
            expected: null,
            isEdgeCase: true,
          },
          {
            description: "no catch-all and nothing matches: `null`",
            args: [[{ id: "a", path: "/a", children: [{ id: "b", path: "b" }] }], "/a/c"],
            expected: null,
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "react-eco-protected-routes",
      moduleId: "fe-react-ecosystem",
      trackId: "frontend",
      title: "Protected Routes & Auth Guards",
      summary:
        "A route guard decides what the browser renders; it cannot decide what a user is allowed to do. Everything shipped to the client (the bundle, the route config, the \"admin\" components) can be read and bypassed, and any API call the guard was meant to prevent can be replayed with the user's own session. Guards are UX: they avoid showing screens that would fail anyway and route people to login. Authorization lives on the server, on every request (Broken Access Control is A01 in the OWASP Top 10:2025).\n\nIn declarative mode the classic guard is a layout route that renders `<Outlet />` when signed in and `<Navigate to=\"/login\" replace state={{ from: location }} />` otherwise. `replace` matters: without it Back from the login page returns to the protected URL, which redirects again. The guard must model three states, not two: while the session is still loading, \"unknown\" isn't \"signed out\", or every deep link bounces to login.\n\nData and framework modes can check before rendering. Loaders run before the component, so `throw redirect(\"/login\")` avoids a flash of protected UI, but all matched loaders run in parallel, so a parent loader's redirect doesn't stop child loaders from starting. Middleware (default in v8) runs parent to child before any loader, which makes it the right place for an auth gate that sets the user in `context`. In framework mode, server middleware only runs on client navigations that make a `.data` request, so a route without a loader skips it.\n\nAlso watch the return path: redirecting to an unvalidated `?redirectTo=` is an open redirect, because React Router performs a full document navigation for absolute URLs on another origin.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "React Router: Middleware", url: "https://reactrouter.com/how-to/middleware", kind: "docs" },
        { label: "OWASP: Authorization Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", kind: "article" },
        { label: "Kent C. Dodds: Authentication in React Applications", url: "https://kentcdodds.com/blog/authentication-in-react-applications", kind: "article" },
        { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Protected Routes in React using React Router",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=Y0-qdp-XBJg",
        videoId: "Y0-qdp-XBJg",
        durationLabel: "15:39",
      },
      alternateVideos: [
        {
          title: "React Protected Routes | Role-Based Authorization | React Router v6",
          channel: "Dave Gray",
          url: "https://www.youtube.com/watch?v=oUZjO00NkhY",
          videoId: "oUZjO00NkhY",
          durationLabel: "30:42",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-eco-protected-routes-q1",
          prompt:
            "The Salaries page is wrapped in `<RequireRole role=\"admin\">`, and non-admins are redirected away. A pentester signed in as a regular employee still downloads everyone's salary. What is the actual bug?",
          options: [
            "`GET /api/salaries` doesn't check the caller's role on the server",
            "The guard should run in `useLayoutEffect` so it fires before paint",
            "The admin route should be lazy-loaded so its code isn't in the bundle",
            "The session token should be stored in `sessionStorage` instead of a cookie",
          ],
          correctIndex: 0,
          explanation:
            "Client guards only control rendering; anyone can call the API directly with their own session. Lazy loading or effect timing changes what the browser shows, not what the server allows: every request must be authorized server-side.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-protected-routes-q2",
          prompt:
            "Why does this guard pass `replace`?\n\n```jsx\nfunction RequireAuth() {\n  const { user } = useAuth();\n  const location = useLocation();\n  if (!user) return <Navigate to=\"/login\" replace state={{ from: location }} />;\n  return <Outlet />;\n}\n```",
          options: [
            "So pressing Back on the login page doesn't return to the protected URL, which would redirect to login again",
            "Because `<Navigate>` throws if it pushes a new history entry during render",
            "So the login page's loader runs before the protected route's loader",
            "Because `state` is only preserved on replace navigations",
          ],
          correctIndex: 0,
          explanation:
            "Without `replace`, history becomes [protected, login], and Back lands on the protected URL, which immediately redirects: a back-button trap. `state` survives push and replace navigations alike.",
        },
        {
          id: "react-eco-protected-routes-q3",
          prompt:
            "You move auth checks from a component guard into React Router's data APIs. Which statements are true? (Select all that apply.)",
          options: [
            "A loader that throws `redirect(\"/login\")` runs before the route renders, so there's no flash of protected UI",
            "All matched loaders run in parallel, so a redirect thrown in a parent loader doesn't stop child loaders from starting",
            "Middleware runs parent to child before loaders, so an auth middleware that throws a redirect keeps child loaders from running",
            "A guard that calls `navigate(\"/login\")` inside `useEffect` prevents the protected component's first render",
            "Once loaders check the session, the API no longer needs its own authorization",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Loaders and middleware run before rendering; loaders run concurrently, while middleware is a nested chain around them, which is why middleware is the better auth gate. `useEffect` runs after the first render (so protected UI flashes), and none of this replaces server-side authorization.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-protected-routes-q4",
          prompt:
            "In framework mode you add a server `middleware` that throws `redirect(\"/login\")` for anonymous users to `/settings/profile`, a route with a `<Form>` but no `loader`. A signed-out user reaches it by clicking a `<Link>` from the home page. What happens?",
          options: [
            "The page renders: client navigations only run server middleware when they make a `.data` request, and there's no loader to fetch",
            "The user is redirected to `/login`, because server middleware runs on every navigation",
            "The navigation errors because a route with middleware must also export a loader",
            "The middleware runs in the browser instead, because the navigation happened client-side",
          ],
          correctIndex: 0,
          explanation:
            "Document requests always run server middleware, but hydrated client navigations only go to the server for loaders and actions. The docs' fix is to add a loader to force the round trip (or use `clientMiddleware`); the action still has to reject anonymous submissions either way.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-protected-routes-q5",
          prompt:
            "After login, an action runs `return redirect(url.searchParams.get(\"redirectTo\") ?? \"/\");`. What's the risk?",
          options: [
            "An open redirect: `redirectTo=https://evil.example` sends the freshly signed-in user off-site, since absolute cross-origin redirects become full document navigations",
            "None: React Router only ever navigates within the app, so external URLs are ignored",
            "The redirect loses the session cookie because redirects strip `Set-Cookie`",
            "It causes an infinite loop because `redirect` re-runs the same action",
          ],
          correctIndex: 0,
          explanation:
            "React Router hands absolute URLs on another origin to `window.location`, which makes this a phishing-friendly open redirect. Accept only same-origin relative paths (for example, starts with `/` but not `//`).",
        },
        {
          id: "react-eco-protected-routes-q6",
          prompt:
            "The auth context starts as `{ user: null }` and fills in after `GET /api/me` resolves. Signed-in users who open a deep link in a new tab are always sent to `/login`. What's the fix?",
          options: [
            "Model a loading state separately from \"signed out\" and render a pending UI (or resolve the session in a loader or middleware) before deciding",
            "Add `replace` to the `<Navigate>` so the redirect is invisible",
            "Cache the user object in `localStorage` and trust it on startup",
            "Move the guard below the route component so it runs after the fetch",
          ],
          correctIndex: 0,
          explanation:
            "With only two states, \"unknown\" is treated as \"signed out\" on the first render. A three-state model (or deciding in a loader/middleware) waits for the answer; a stale `localStorage` copy can say signed in after the session has expired.",
        },
        {
          id: "react-eco-protected-routes-q7",
          prompt:
            "A signed-in user from tenant A requests `/api/invoices/981`, which belongs to tenant B. What should the API return?",
          options: [
            "403 Forbidden, or 404 if you don't want to reveal that the invoice exists",
            "401 Unauthorized, because the user isn't allowed to see it",
            "302 to `/login` so the user can switch accounts",
            "200 with an empty body, so the UI can show nothing",
          ],
          correctIndex: 0,
          explanation:
            "401 means the request isn't authenticated; this user is authenticated but not authorized (Broken Object Level Authorization, API1:2023). Many APIs return 404 for other tenants' objects to avoid confirming that the id exists.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-protected-routes-q8",
          prompt:
            "You wrap the whole account area in one pathless layout route: `<Route element={<RequireAuth />}>` with `billing` and `team` children, where `RequireAuth` renders `<Outlet />` when signed in. Which statements are true? (Select all that apply.)",
          options: [
            "One guard protects every nested route, including routes added later",
            "The pathless route adds no segment to the URLs of its children",
            "The children's code is still downloaded by anonymous users unless those routes are lazy-loaded",
            "The guard runs on the server before the HTML is sent, even in declarative mode",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A pathless layout route is the standard way to guard a subtree without repeating wrappers or changing URLs. Hiding a route doesn't hide its code, and declarative mode is purely client-side.",
        },
        {
          id: "react-eco-protected-routes-q9",
          prompt:
            "Your SPA calls its own API on the same site. To limit what an XSS bug can do with the session, where should the session credential live?",
          options: [
            "An `HttpOnly; Secure; SameSite=Lax` cookie set by the server",
            "`localStorage`, read into an `Authorization` header on each request",
            "`sessionStorage`, so it's cleared when the tab closes",
            "A JavaScript module variable, restored from `localStorage` on reload",
          ],
          correctIndex: 0,
          explanation:
            "Script can't read an `HttpOnly` cookie, so injected code can act as the user while the page is open but can't exfiltrate the credential. Anything in Web Storage or JS memory is readable by that same script; cookies do need CSRF protection (SameSite plus a token or Origin checks).",
        },
        {
          id: "react-eco-protected-routes-q10",
          prompt:
            "The access token expires mid-session, and three parallel API calls return 401 at once. What should the client do?",
          options: [
            "Start one silent refresh, queue the failed calls behind it, retry each once, and send the user to login if the refresh fails",
            "Refresh once per failed call so each request gets its own new token",
            "Retry the three requests in a loop until they succeed",
            "Immediately log the user out on any 401 and drop the requests",
          ],
          correctIndex: 0,
          explanation:
            "Deduplicating the refresh avoids a stampede and races between refresh tokens (rotation often invalidates the old one on first use). Retrying forever hides real revocations, and logging out on the first 401 throws away a recoverable session.",
        },
      ],
    },
    {
      id: "react-eco-data-loaders-actions",
      moduleId: "fe-react-ecosystem",
      trackId: "frontend",
      title: "Data Loaders, Actions & Fetchers",
      summary:
        "Loaders and actions move data fetching and mutation out of components and into the route definition. Because the router knows every route a URL matches before it renders anything, it can start all of their loaders at once, in parallel, and render when they settle. Fetching in `useEffect` ties requests to rendering instead: a parent has to render, fetch and resolve its spinner before its child even mounts and starts its own fetch, so three nested 300 ms requests take roughly 900 ms as a render-then-fetch waterfall rather than roughly 300 ms. Errors thrown by a loader (including `throw data(\"Not found\", { status: 404 })`) render the nearest `ErrorBoundary`, which removes per-component loading and error plumbing.\n\nActions are the write side. A `<Form method=\"post\">` or `useSubmit` call runs the route's action as a navigation (a new history entry), and then React Router revalidates: it re-runs the loaders of every active route, so the UI reflects the server without hand-written cache updates. Submissions that come back 4xx/5xx don't revalidate by default. `useFetcher` calls loaders and actions without navigating, tracks its own `state` and `formData` (the natural fit for per-row buttons and optimistic UI), and cancels its own superseded requests, so a type-ahead never renders results for an old query. The server still processes cancelled requests.\n\nThe tradeoff is coarse revalidation: after any action every active loader runs again, and in data mode a GET navigation that changes a param or any search param re-runs all active loaders. Skip an expensive loader with `shouldRevalidate` (fall back to `defaultShouldRevalidate` rather than always returning `false`) or pass `defaultShouldRevalidate={false}` for one submission. In framework mode `loader` runs on the server, so it can use secrets and is stripped from client bundles, while `clientLoader` runs in the browser.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "React Router: Data Loading (framework mode)", url: "https://reactrouter.com/start/framework/data-loading", kind: "docs" },
        { label: "React Router: Using Fetchers", url: "https://reactrouter.com/how-to/fetchers", kind: "docs" },
        { label: "Remix blog: Remixing React Router (render+fetch chains)", url: "https://remix.run/blog/remixing-react-router", kind: "article" },
        { label: "React Router: Revalidation Optimization", url: "https://reactrouter.com/how-to/optimize-revalidation", kind: "docs" },
      ],
      video: {
        title: "React Router 7 Tutorial (framework mode)",
        channel: "Remix",
        url: "https://www.youtube.com/watch?v=pw8FAg07kdo",
        videoId: "pw8FAg07kdo",
        durationLabel: "35:30",
      },
      alternateVideos: [
        {
          title: "Learn React Router v7 from the Maintainers",
          channel: "CodeTV",
          url: "https://www.youtube.com/watch?v=KVfzu1awjO4",
          videoId: "KVfzu1awjO4",
          durationLabel: "1:25:12",
          startSeconds: 1175,
          chapterLabel: "Creating Routes and Loading Data",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-eco-data-loaders-actions-q1",
          prompt:
            "The root layout, `projects` and `projects/:id` each fetch their data in `useEffect` and render a spinner (not their children) until it arrives. Every request takes 300 ms. Roughly how long until the project page is fully rendered, and how long with route loaders instead?",
          options: [
            "About 900 ms with effects; about 300 ms with loaders, which all start before rendering",
            "About 300 ms either way, because effects in a tree run in parallel",
            "About 900 ms either way, because loaders run parent-first",
            "About 300 ms with effects; loaders add a round trip, so about 600 ms",
          ],
          correctIndex: 0,
          explanation:
            "Each child only mounts, and so only starts fetching, after its parent's data has arrived: a render-then-fetch waterfall. The router knows all matched routes up front and runs their loaders concurrently.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-data-loaders-actions-q2",
          prompt:
            "In data mode, a `<Form method=\"post\">` submits to a route action that succeeds. Which statements are true? (Select all that apply.)",
          options: [
            "The loaders of all active routes on the page re-run after the action",
            "The submission is a navigation, so it adds a history entry",
            "Only the loader of the route that owns the action re-runs",
            "Had the action returned `data(errors, { status: 400 })`, loaders wouldn't revalidate by default",
            "Loader data is left untouched until you call `useRevalidator().revalidate()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "After a successful action React Router revalidates every active loader, and `<Form>` navigations push history entries. Failed submissions (4xx/5xx) skip revalidation by default; manual revalidation is only needed for changes the router didn't see.",
        },
        {
          id: "react-eco-data-loaders-actions-q3",
          prompt:
            "Each row in a 200-item list has a star button that should call an action without changing the URL or adding history entries, and several rows can be saving at once. What should each row use?",
          options: [
            "`useFetcher()` and render `<fetcher.Form method=\"post\">`",
            "A `<Form method=\"post\">` with `preventScrollReset`",
            "`useSubmit()` from the parent list component",
            "`useNavigation()` to read the pending form data",
          ],
          correctIndex: 0,
          explanation:
            "Fetchers submit without navigating and each tracks its own independent state. `<Form>` and `useSubmit` perform navigations, and `useNavigation` reflects the single global navigation, not concurrent row saves.",
        },
        {
          id: "react-eco-data-loaders-actions-q4",
          prompt:
            "A city combobox calls `fetcher.submit(event.target.form)` on every keystroke, sending `?q=` to a resource route's loader. The user types \"par\" quickly and the response for \"pa\" arrives after the one for \"par\". What does the combobox show?",
          options: [
            "Results for \"par\": resubmitting a fetcher cancels its in-flight request, so the stale response is ignored",
            "Results for \"pa\", because it arrived last",
            "Both result sets merged, because fetcher data accumulates",
            "An error, because a fetcher can't be resubmitted while pending",
          ],
          correctIndex: 0,
          explanation:
            "A fetcher interrupting itself cancels the earlier request, like a browser handling a second link click. The server may still process the cancelled request, so this protects the UI, not your backend's data integrity.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-data-loaders-actions-q5",
          prompt:
            "A fetcher form renames a project. Which expression shows the new title immediately while the action is still running?",
          options: [
            "`fetcher.formData?.get(\"title\") ?? loaderData.title`",
            "`fetcher.data?.title ?? loaderData.title`",
            "`useActionData()?.title ?? loaderData.title`",
            "`loaderData.title`, since loader data updates optimistically",
          ],
          correctIndex: 0,
          explanation:
            "`fetcher.formData` holds the submitted values while the fetcher is pending, which is exactly what optimistic UI needs. `fetcher.data` and `useActionData` only exist after the action returns, and loader data changes only after revalidation.",
        },
        {
          id: "react-eco-data-loaders-actions-q6",
          prompt:
            "An analytics `POST` from the dashboard makes its expensive loader re-run after every click. What's the least risky way to stop that?",
          options: [
            "In the dashboard's `shouldRevalidate`, return `false` when `formAction` is the analytics route and `defaultShouldRevalidate` otherwise",
            "Export `shouldRevalidate = () => false` from the dashboard route",
            "Wrap the loader's result in `useMemo`",
            "Switch the analytics call to a GET form",
          ],
          correctIndex: 0,
          explanation:
            "Targeting the one submission keeps the default behavior everywhere else. Always returning `false` also skips param changes and explicit revalidations, and turning a mutation into a GET changes its semantics (and still revalidates on search-param changes).",
        },
        {
          id: "react-eco-data-loaders-actions-q7",
          prompt: "The loader for `/projects/:projectId` finds no such project. What should it do?",
          options: [
            "`throw data(\"Project not found\", { status: 404 })` so the nearest ErrorBoundary renders (and SSR responds with a 404)",
            "Return `null` and let the component render an empty state",
            "Call `navigate(\"/404\")` from inside the loader",
            "Return `{ error: \"not found\" }` with a 200 so the page stays mounted",
          ],
          correctIndex: 0,
          explanation:
            "Throwing a response short-circuits rendering to the route's `ErrorBoundary` (check it with `isRouteErrorResponse`) and carries the status code. Loaders don't have `navigate`, and a 200 with an error payload hides the failure from crawlers and caches.",
        },
        {
          id: "react-eco-data-loaders-actions-q8",
          prompt: "What happens when the user submits `<Form method=\"get\" action=\"/search\">` containing `<input name=\"q\" />`?",
          options: [
            "It navigates to `/search?q=...` and runs that route's loaders; no action is called",
            "It calls the `/search` route's action with `q` in the request body",
            "It performs a full page reload to `/search?q=...`",
            "It calls the loader without changing the URL",
          ],
          correctIndex: 0,
          explanation:
            "GET submissions become navigations with the form data serialized into the search params, exactly like an HTML form, but client-side. Only non-GET methods call actions.",
        },
        {
          id: "react-eco-data-loaders-actions-q9",
          prompt:
            "In data mode (no SSR), the user clicks a `<Link>` from `/projects/1` to `/projects/1?tab=files`. Which loaders run by default?",
          options: [
            "All active loaders, because a search param changed",
            "Only the leaf route's loader",
            "None, because the pathname didn't change",
            "Only loaders that read `tab` from the request URL",
          ],
          correctIndex: 0,
          explanation:
            "Data mode revalidates active loaders on GET navigations when a dynamic param or any search param changes; the router can't know which loaders read `tab`. Use `shouldRevalidate` (comparing `currentUrl` and `nextUrl`) to opt specific routes out.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-data-loaders-actions-q10",
          prompt: "In framework mode with SSR, which statements about a route module's `loader` are true? (Select all that apply.)",
          options: [
            "It runs on the server for the initial document request",
            "On client-side navigations the browser gets its result from a `.data` request to the server",
            "It can read secrets and query the database, because it's removed from client bundles",
            "On client-side navigations it runs in the browser",
            "It replaces the need for an `ErrorBoundary`, since thrown errors are logged on the server",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`loader` is server-only code; `clientLoader` is the browser-side variant. Thrown errors still render the nearest `ErrorBoundary` in the UI.",
        },
        {
          id: "react-eco-data-loaders-actions-q11",
          prompt:
            "A v6 app is upgraded straight to React Router v8, and `import { useLoaderData } from \"react-router-dom\"` no longer resolves. Why?",
          options: [
            "v8 removed the `react-router-dom` re-export package; import from `react-router` (and `RouterProvider` from `react-router/dom`)",
            "`useLoaderData` was renamed to `useRouteData` in v8",
            "Loaders were removed in v8 in favor of React Server Components",
            "v8 moved all hooks into `@react-router/dev`",
          ],
          correctIndex: 0,
          explanation:
            "v7 collapsed the DOM APIs into `react-router` and `react-router/dom` but kept `react-router-dom` as a convenience re-export; v8 dropped it. The hooks themselves are unchanged.",
        },
      ],
    },
    {
      id: "react-eco-redux-toolkit",
      moduleId: "fe-react-ecosystem",
      trackId: "frontend",
      title: "Redux Toolkit: Slices, Thunks & the Store",
      summary:
        "Redux exists to make state changes explicit and replayable: every change is a plain, serializable action handled by a pure reducer, which is what makes action logs, time-travel debugging, persistence and reducer tests cheap. Hand-written Redux paid for that with boilerplate and easy mistakes, so Redux Toolkit (RTK 2.x) is now the only recommended way to write Redux; the core `createStore` is even marked deprecated to steer people towards `configureStore`.\n\n`createSlice` generates action creators and a reducer from case reducers that use Immer: you \"mutate\" a draft and get an immutable update. The rule is to either mutate the draft or return a new value, never both, so `(state) => (state.items = [])` throws (the arrow returns the assigned array), and `state = initialState` silently does nothing. `configureStore` adds thunks, DevTools and, in development only, immutability and serializability checks; the serializability check logs an error rather than throwing when a Date, Map, class instance or Promise lands in state or an action, which breaks DevTools and persistence. `createAsyncThunk` dispatches pending/fulfilled/rejected actions, and the promise returned by `dispatch(thunk())` always resolves, so use `.unwrap()` to get the payload or a thrown error. RTK 2 removed the object syntax for `extraReducers` in favor of the builder callback.\n\nMost \"Redux state\" in real apps is cached server data, and RTK Query (built in) handles fetching, deduplication and tag-based invalidation: `invalidatesTags` refetches subscribed queries that `providesTags` the same tags and drops unsubscribed data. The main performance lever is selector hygiene. `useSelector` re-renders when the selected value changes by reference, so `state.todos.filter(...)` inline re-renders on every dispatch; derive with `createSelector`, and keep collections normalized with `createEntityAdapter`.",
      level: "advanced",
      estMinutes: 150,
      isMilestone: true,
      webRefs: [
        { label: "Redux Toolkit: createSlice", url: "https://redux-toolkit.js.org/api/createSlice", kind: "docs" },
        { label: "Redux: Style Guide", url: "https://redux.js.org/style-guide/", kind: "article" },
        { label: "Redux Toolkit: RTK Query Overview", url: "https://redux-toolkit.js.org/rtk-query/overview", kind: "docs" },
        { label: "Redux: Deriving Data with Selectors", url: "https://redux.js.org/usage/deriving-data-selectors", kind: "article" },
      ],
      video: {
        title: "Learn React 18 with Redux Toolkit – Full Tutorial for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=2-crBg6wpp0",
        videoId: "2-crBg6wpp0",
        durationLabel: "14:11:42",
        startSeconds: 43905,
        chapterLabel: "Redux Toolkit",
      },
      alternateVideos: [
        {
          title: "Learn RTK Query in 30 Minutes - React Redux Toolkit RTK Query Tutorial For Beginners",
          channel: "PedroTech",
          url: "https://www.youtube.com/watch?v=sKJU5_3Vx0A",
          videoId: "sKJU5_3Vx0A",
          durationLabel: "33:30",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-eco-redux-toolkit-q1",
          prompt:
            "What happens when `clear` is dispatched?\n\n```js\nconst todosSlice = createSlice({\n  name: \"todos\",\n  initialState: { items: [1, 2] },\n  reducers: {\n    clear: (state) => (state.items = []),\n  },\n});\n```",
          options: [
            "Immer throws, because the reducer both modified the draft and returned a new value",
            "`items` becomes `[]`, the same as with curly braces",
            "The whole slice state is replaced by `[]`",
            "Nothing, because arrow-function reducers can't mutate the draft",
          ],
          correctIndex: 0,
          explanation:
            "An assignment expression evaluates to the assigned value, so the arrow returns `[]` after mutating the draft, and Immer rejects doing both. Use braces (`(state) => { state.items = []; }`) or `void`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-redux-toolkit-q2",
          prompt:
            "Which case reducers correctly reset the slice to `initialState`? (Select all that apply.)",
          options: [
            "`reset: () => initialState`",
            "`reset: (state) => { state = initialState; }`",
            "`reset: (state) => { Object.assign(state, initialState); }`",
            "`reset: (state) => initialState`",
            "`reset: (state) => (state.items = initialState.items)`",
          ],
          correctIndex: 0,
          correctIndices: [0, 2, 3],
          explanation:
            "Returning a new value (without touching the draft) or mutating the draft in place both work. Reassigning the `state` parameter only rebinds a local variable, and the last one mutates and returns, which Immer rejects.",
        },
        {
          id: "react-eco-redux-toolkit-q3",
          prompt:
            "In development, a component dispatches `{ type: \"filters/dateChanged\", payload: new Date() }` to a `configureStore` store with default middleware. What happens?",
          options: [
            "The reducer runs and state updates, and the serializability middleware logs an error with the offending path",
            "The dispatch throws a `TypeError` and the state is unchanged",
            "The Date is silently converted to an ISO string",
            "Nothing special; the check only applies to state, not actions",
          ],
          correctIndex: 0,
          explanation:
            "The serializability check inspects both actions and state and logs via `console.error` rather than throwing, and it isn't included in production builds. Store an ISO string or timestamp instead.",
        },
        {
          id: "react-eco-redux-toolkit-q4",
          prompt:
            "The API is down. What does this log?\n\n```js\nconst fetchUser = createAsyncThunk(\"user/fetch\", async (id) => {\n  const res = await api.get(`/users/${id}`); // throws\n  return res.data;\n});\n\ntry {\n  const result = await dispatch(fetchUser(1));\n  console.log(\"ok\", result.type);\n} catch (e) {\n  console.log(\"caught\", e.message);\n}\n```",
          options: [
            "`ok user/fetch/rejected`",
            "`caught` followed by the API error message",
            "`ok user/fetch/fulfilled`",
            "Nothing: the unhandled rejection crashes the app",
          ],
          correctIndex: 0,
          explanation:
            "Thunks from `createAsyncThunk` always return a resolved promise containing the fulfilled or rejected action. Call `.unwrap()` on the returned promise to get the payload or have the error thrown into your `catch`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-redux-toolkit-q5",
          prompt:
            "`getPosts` has `providesTags: [\"Post\"]` and `addPost` has `invalidatesTags: [\"Post\"]`. After `addPost` succeeds, which statements are true? (Select all that apply.)",
          options: [
            "Components currently subscribed to `getPosts` see it refetch automatically",
            "Cached `getPosts` data with no active subscribers is removed rather than refetched",
            "Every query endpoint in the API slice refetches",
            "Nothing refetches until you call `refetch()` on the query",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Invalidation refetches providing queries that still have subscribers and removes invalidated data nobody is using; it only touches endpoints whose provided tags match.",
        },
        {
          id: "react-eco-redux-toolkit-q6",
          prompt:
            "Why does this component re-render after every action dispatched anywhere in the app?\n\n```js\nconst done = useSelector((state) => state.todos.filter((t) => t.done));\n```",
          options: [
            "`filter` returns a new array on every call, and `useSelector` compares results by reference",
            "`useSelector` always re-renders on every dispatch",
            "Arrow-function selectors can't be cached by React",
            "The component isn't wrapped in `React.memo`",
          ],
          correctIndex: 0,
          explanation:
            "`useSelector` reruns the selector after each dispatch and re-renders when the result isn't `===` the previous one. A memoized selector (`createSelector`) returns the same array until `state.todos` changes; react-redux's dev-mode stability check warns about exactly this.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-redux-toolkit-q7",
          prompt: "Why normalize 10,000 posts into `{ ids: [...], entities: { [id]: post } }` (as `createEntityAdapter` does)?",
          options: [
            "Updates and lookups by id don't scan the array, and unchanged posts keep their references",
            "Normalized state is required for the serializability check to pass",
            "Redux can't store arrays longer than a few thousand items",
            "It lets you mutate posts outside reducers safely",
          ],
          correctIndex: 0,
          explanation:
            "Keyed entities make updates O(1) and keep every other entity's reference stable, so memoized selectors and `React.memo` rows skip work. Arrays are perfectly serializable; it's about update cost and reference stability.",
        },
        {
          id: "react-eco-redux-toolkit-q8",
          prompt:
            "After upgrading to RTK 2, this slice fails to compile and throws at runtime. What changed?\n\n```js\nextraReducers: {\n  [fetchUser.fulfilled]: (state, action) => {\n    state.user = action.payload;\n  },\n},\n```",
          options: [
            "The object syntax for `extraReducers` was removed; use `extraReducers: (builder) => builder.addCase(fetchUser.fulfilled, ...)`",
            "Thunk action creators can no longer be used as keys because they're functions",
            "`extraReducers` was renamed to `asyncReducers`",
            "Case reducers in `extraReducers` must now return a new state",
          ],
          correctIndex: 0,
          explanation:
            "RTK 2 dropped the object form of `createReducer` and `extraReducers`; the builder callback is type-safe and handles `addMatcher`/`addDefaultCase`. Immer rules are unchanged.",
        },
        {
          id: "react-eco-redux-toolkit-q9",
          prompt: "What does `configureStore({ reducer })` set up for you by default? (Select all that apply.)",
          options: [
            "The thunk middleware",
            "Redux DevTools Extension integration",
            "Immutability and serializability checks in development builds",
            "The RTK Query middleware for any API slice you define",
            "Persistence of the store to `localStorage`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Thunks, DevTools and the dev-only checks are the defaults. An RTK Query API slice's middleware must be added with `getDefaultMiddleware().concat(api.middleware)`, and persistence needs a library such as redux-persist.",
        },
        {
          id: "react-eco-redux-toolkit-q10",
          prompt:
            "Most of your store is API responses plus hand-written `isLoading`/`error` flags and refetch logic in thunks. What would the Redux maintainers recommend?",
          options: [
            "Move server data to RTK Query (or another server-cache library) and keep Redux slices for genuinely client-side state",
            "Split the store into one slice per endpoint so each has its own loading flags",
            "Store the promises in state so components can await them",
            "Replace Redux with React Context, which handles caching automatically",
          ],
          correctIndex: 0,
          explanation:
            "Server state needs caching, deduplication, invalidation and refetching, which RTK Query provides. Promises in state break serializability, and Context has no cache at all.",
        },
        {
          id: "react-eco-redux-toolkit-q11",
          prompt: "Where should \"send an analytics event whenever `cart/itemAdded` is dispatched\" live?",
          options: [
            "In a listener middleware (`createListenerMiddleware`) or the thunk that adds the item",
            "Inside the `itemAdded` case reducer, right after the push",
            "In a selector that runs when the cart changes",
            "In a `useEffect` in whichever component happens to render the cart",
          ],
          correctIndex: 0,
          explanation:
            "Reducers and selectors must be pure (they can run multiple times, for example on replay), so side effects belong in middleware. An effect in a component only fires while that component is mounted.",
        },
      ],
    },
    {
      id: "react-eco-zustand",
      moduleId: "fe-react-ecosystem",
      trackId: "frontend",
      title: "Zustand as a Lightweight Alternative to Redux",
      summary:
        "Zustand is a hook-first store with almost no ceremony: `create((set, get) => ({ ...state, ...actions }))` returns a hook, the store lives outside React (so `useStore.getState()`, `setState` and `subscribe` work in plain modules, socket handlers and tests), and no provider is needed. Components subscribe with a selector and re-render only when the selected value changes by `Object.is`. That's the whole performance model, and it's why Zustand avoids the \"every consumer re-renders\" problem of putting app state in one React Context.\n\nThe gotchas follow from it. `useStore()` with no selector subscribes to the whole state object, which is replaced on every `set`, so the component re-renders on any change. A selector that builds a new object or array (`(s) => ({ a: s.a, b: s.b })`) returns a fresh reference on every call; v5 follows React's `useSyncExternalStore` semantics, so that can throw \"Maximum update depth exceeded\". Wrap it in `useShallow`, or select primitives separately. Selectors run on every store update for every subscribed component, so keep them cheap. And `set` merges only the top level: nested objects must be spread by hand (or use the immer middleware).\n\nMiddleware wraps the store creator. `persist` writes JSON to `localStorage` by default (Dates, Maps and Sets need custom storage), supports `partialize`, `version` and `migrate`, discards stored state whose version doesn't match unless you migrate it, and since v5 no longer writes the initial state at creation. On a server, a module-level store is shared by every request, so Next.js apps create one store per request behind a context.\n\nChoose Zustand for small-to-medium client state and a minimal API. Choose Redux Toolkit when a large team benefits from enforced structure, actions as a serializable event log, RTK Query and listener middleware. Neither should hold server data that a query cache can own.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Zustand: Introduction", url: "https://zustand.docs.pmnd.rs/learn/getting-started/introduction", kind: "docs" },
        { label: "Zustand: useShallow", url: "https://zustand.docs.pmnd.rs/reference/hooks/use-shallow", kind: "docs" },
        { label: "TkDodo: Working with Zustand", url: "https://tkdodo.eu/blog/working-with-zustand", kind: "article" },
        { label: "Zustand: Comparison with other tools", url: "https://zustand.docs.pmnd.rs/learn/getting-started/comparison", kind: "article" },
      ],
      video: {
        title: "Zustand - Complete Tutorial",
        channel: "Cosden Solutions",
        url: "https://www.youtube.com/watch?v=_ngCLZ5Iz-0",
        videoId: "_ngCLZ5Iz-0",
        durationLabel: "19:27",
      },
      alternateVideos: [
        {
          title: "Why Everyone Loves Zustand",
          channel: "Theo - t3․gg",
          url: "https://www.youtube.com/watch?v=14B85quRQhw",
          videoId: "14B85quRQhw",
          durationLabel: "29:27",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-eco-zustand-q1",
          prompt:
            "Does `BearCount` re-render when `addFish()` runs?\n\n```js\nconst useStore = create((set) => ({\n  bears: 0,\n  fish: 0,\n  addFish: () => set((s) => ({ fish: s.fish + 1 })),\n}));\n\nfunction BearCount() {\n  const { bears } = useStore();\n  return <p>{bears}</p>;\n}\n```",
          options: [
            "Yes: calling `useStore()` without a selector subscribes to the whole state, which is a new object after every `set`",
            "No: destructuring `bears` means only `bears` is tracked",
            "No: Zustand compares the previous and next state shallowly",
            "Only in development, because of Strict Mode",
          ],
          correctIndex: 0,
          explanation:
            "Zustand has no proxy-based tracking: it compares whatever the selector returns, and the identity selector returns the whole (new) state object. `useStore((s) => s.bears)` re-renders only when `bears` changes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-zustand-q2",
          prompt:
            "After upgrading to Zustand v5, this line crashes with \"Maximum update depth exceeded\". Why, and what's the fix?\n\n```js\nconst [value, setValue] = useStore((s) => [s.searchValue, s.setSearchValue]);\n```",
          options: [
            "The selector returns a new array on every call; wrap it in `useShallow` so the result is stable while its items are equal",
            "Actions can't be selected together with state; call `useStore.getState().setSearchValue` instead",
            "v5 forbids array selectors; select an object instead",
            "The store must be wrapped in a Provider in v5",
          ],
          correctIndex: 0,
          explanation:
            "v5 relies on React's `useSyncExternalStore`, which expects a stable snapshot; a fresh array every time looks like a change every time. `useShallow` (or two separate primitive selectors) fixes it, and returning a new object literal has the same problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-zustand-q3",
          prompt:
            "State is `{ user: { name: \"Ada\", email: \"ada@example.com\" }, theme: \"dark\" }`. What is the state after `set({ user: { name: \"Grace\" } })`?",
          options: [
            "`{ user: { name: \"Grace\" }, theme: \"dark\" }`",
            "`{ user: { name: \"Grace\", email: \"ada@example.com\" }, theme: \"dark\" }`",
            "`{ user: { name: \"Grace\" } }`",
            "It throws, because partial nested updates need `replace: true`",
          ],
          correctIndex: 0,
          explanation:
            "`set` shallow-merges the top level only: `theme` survives, but `user` is replaced wholesale, so `email` is gone. Spread nested objects yourself (`user: { ...s.user, name: \"Grace\" }`) or use the immer middleware.",
        },
        {
          id: "react-eco-zustand-q4",
          prompt:
            "Which of these re-render the component only when `count` changes, and never loop? (Select all that apply.)",
          options: [
            "`const count = useStore((s) => s.count)`",
            "`const { count } = useStore(useShallow((s) => ({ count: s.count })))`",
            "`const { count } = useStore()`",
            "`const { count } = useStore((s) => ({ count: s.count }))`",
            "`const count = useStore.getState().count`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "A primitive selector or a `useShallow`-wrapped object both produce stable results. No selector re-renders on everything, a bare object selector returns a new reference each time, and `getState()` isn't a subscription at all, so it never re-renders.",
        },
        {
          id: "react-eco-zustand-q5",
          prompt: "A WebSocket handler in a plain `.js` module (not a component) needs to push incoming messages into the store. What works?",
          options: [
            "`useChatStore.setState((s) => ({ messages: [...s.messages, msg] }))`",
            "Calling `useChatStore()` inside the handler to get the actions",
            "Dispatching a DOM `CustomEvent` that a component forwards to the store",
            "It can't be done; Zustand state is only reachable inside React",
          ],
          correctIndex: 0,
          explanation:
            "The hook returned by `create` also exposes `getState`, `setState` and `subscribe`, because the store lives outside React. Calling the hook outside a component breaks the Rules of Hooks.",
        },
        {
          id: "react-eco-zustand-q6",
          prompt:
            "A store persisted with the default `persist` options holds `lastSynced: new Date()`. After a page reload, what is `lastSynced`?",
          options: [
            "An ISO date string, because the default storage is JSON in `localStorage`",
            "A `Date` object, restored automatically by `persist`",
            "`undefined`, because non-serializable fields are skipped",
            "The initial value, because `persist` only restores primitives",
          ],
          correctIndex: 0,
          explanation:
            "`createJSONStorage(() => localStorage)` is the default, and `JSON.stringify` turns a Date into a string that comes back as a string. Store a timestamp, or give `createJSONStorage` a reviver/replacer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-zustand-q7",
          prompt:
            "A Next.js app creates `export const useCartStore = create(...)` at module level and fills it during server rendering with the signed-in user's cart. What's the danger?",
          options: [
            "The server process shares that one store across concurrent requests, so one user's cart can leak into another user's HTML",
            "Server Components will re-render on every store update",
            "The store is recreated on every client navigation, losing the cart",
            "None: module state is isolated per request on the server",
          ],
          correctIndex: 0,
          explanation:
            "Module state lives as long as the server process. Zustand's Next.js guide says to avoid global stores there: create a store per request and provide it through a context.",
        },
        {
          id: "react-eco-zustand-q8",
          prompt:
            "You ship `persist(..., { name: \"cart\", version: 2 })`; users have data saved under version 1 and you didn't add a `migrate` function. What happens on load?",
          options: [
            "The stored state isn't used, so users start from the initial state",
            "The version-1 data is merged in unchanged",
            "Loading throws until a `migrate` function is provided",
            "`persist` keeps both versions and picks the newer field values",
          ],
          correctIndex: 0,
          explanation:
            "When the stored version doesn't match, `persist` ignores the stored value unless `migrate` transforms it. Bumping `version` without a migration is effectively a reset for every user.",
        },
        {
          id: "react-eco-zustand-q9",
          prompt:
            "A team of 40 wants every state change recorded as a named, serializable event, strong conventions, a built-in server-cache layer and middleware reacting to specific actions. Which fits better, and why?",
          options: [
            "Redux Toolkit: actions are serializable events by design, and it ships RTK Query and listener middleware",
            "Zustand: its `set` calls are automatically named and logged",
            "Zustand, because Redux can't be used with TypeScript",
            "Either; they have identical feature sets",
          ],
          correctIndex: 0,
          explanation:
            "Zustand can add a devtools middleware, but its updates are function calls, not an enforced event log. For a small app or a single feature, Zustand's minimal API usually wins.",
        },
        {
          id: "react-eco-zustand-q10",
          prompt: "A component selects `(s) => s.items.slice().sort(byPrice)` wrapped in `useShallow`. How often does the sort run?",
          options: [
            "On every store update for this component (and on its renders), even when `items` didn't change",
            "Only when `items` changes, because `useShallow` memoizes the selector",
            "Once, when the component mounts",
            "Only when the component re-renders",
          ],
          correctIndex: 0,
          explanation:
            "Selectors run whenever the store changes so their result can be compared; `useShallow` only stabilizes the returned reference. Store the sorted list, or memoize on the `items` reference, to avoid repeated O(n log n) work.",
        },
      ],
    },
    {
      id: "react-eco-tanstack-query",
      moduleId: "fe-react-ecosystem",
      trackId: "frontend",
      title: "TanStack Query: Caching, Invalidation & Mutations",
      summary:
        "TanStack Query treats server data as a cache you synchronize with, not state you own. Every query has a serializable array key; the key is hashed (object property order doesn't matter), and every component using the same key shares one cache entry, one in-flight request and one status. That removes the loading flags, race conditions and refetch plumbing that `useEffect` plus `useState` fetching accumulates, and it's why the key must include every input the query function uses, exactly like a dependency array.\n\nTwo timers drive the cache, and they're easy to confuse. `staleTime` (default `0`) is how long data counts as fresh. Stale data is still shown, but it's refetched in the background when a new observer mounts, the window regains focus or the network reconnects, so with the default every mount of a component using that query triggers a request. That's the usual \"why does it fetch so much?\" complaint, and the fix is a realistic `staleTime`, not switching the triggers off. `gcTime` (v5's name for `cacheTime`, default 5 minutes) only starts once a query has no observers and decides when the unused entry is deleted. `staleTime: Infinity` still allows manual invalidation; `staleTime: \"static\"` blocks even that.\n\nIn v5, status has two axes: `status` describes data (`pending` means no data yet, renamed from `loading`) and `fetchStatus` describes the network (`fetching`, `paused` or `idle`), so `isPending` and `isFetching` are independent and `isLoading` is `isPending && isFetching`. After a mutation, `invalidateQueries({ queryKey: [\"todos\"] })` prefix-matches every `todos` query, marks them stale and refetches only the active ones. Optimistic updates either render the mutation's `variables`, or patch the cache in `onMutate` after `cancelQueries` (so an in-flight fetch can't overwrite the optimistic value), roll back in `onError` and invalidate in `onSettled`. v5 also removed `onSuccess`/`onError` from `useQuery` and accepts only the object syntax.",
      level: "advanced",
      estMinutes: 120,
      isMilestone: true,
      webRefs: [
        { label: "TanStack Query: Important Defaults", url: "https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults", kind: "docs" },
        { label: "TanStack Query: Query Invalidation", url: "https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation", kind: "docs" },
        { label: "TkDodo: Practical React Query", url: "https://tkdodo.eu/blog/practical-react-query", kind: "article" },
        { label: "TanStack Query: Optimistic Updates", url: "https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates", kind: "docs" },
      ],
      video: {
        title: "TanStack React Query v5 - Full Guide (Setup, Mutations, Infinite Loading, Optimistic Updates)",
        channel: "Coding in Flow",
        url: "https://www.youtube.com/watch?v=_EuPZrr3faU",
        videoId: "_EuPZrr3faU",
        durationLabel: "1:30:20",
      },
      alternateVideos: [
        {
          title: "TanStack Query - How to become a React Query God",
          channel: "Austin Davis",
          url: "https://www.youtube.com/watch?v=mPaCnwpFvZY",
          videoId: "mPaCnwpFvZY",
          durationLabel: "28:55",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createQueryClient(config)`, a miniature of TanStack Query's cache. The driver `runQueryScenario` owns a fake clock and a fake server: every fetch takes `fetchMs` and resolves to `\"data@<time>\"`.\n\n`config` provides `staleTime`, `gcTime`, `now()`, `setTimeout(cb, ms)` and `clearTimeout(id)` (the fake clock: use them for garbage collection), and `fetchQuery(key, onSuccess)`, which starts a fetch and later calls `onSuccess(data)`. Return `{ mount, unmount, invalidate, focus, read, has }`:\n\n- Queries are identified by a hash of their key: arrays compare element by element, and plain objects by content regardless of property order (TanStack's `hashKey` is `JSON.stringify` with sorted object keys).\n- Each query tracks `data` (`null` until the first success), `dataUpdatedAt`, `status` (`\"pending\"` until the first success, then `\"success\"`), `fetchStatus` (`\"fetching\"` while a fetch is in flight, else `\"idle\"`), an invalidated flag and its observers.\n- A query is stale when it's invalidated, has no data, or `now() - dataUpdatedAt >= staleTime` (`staleTime` may be `Infinity`).\n- Fetching: if a fetch is already in flight, don't start another. When a fetch completes, store the data and time, set `\"success\"` and `\"idle\"`, clear the invalidated flag, and schedule garbage collection if the query has no observers.\n- `mount(observerId, key)`: find or create the query, cancel its gc timer, attach the observer, and fetch if the query is stale.\n- `unmount(observerId)`: detach it. When a query loses its last observer, schedule gc after `gcTime`; when that timer fires, remove the query only if it still has no observers and isn't fetching.\n- `invalidate(filterKey, { exact })`: mark matching queries invalidated and refetch the ones with observers. With `exact`, compare hashes; otherwise match partially: an array filter must be a prefix of the key, and an object inside it matches when every property it lists matches. If an active query is fetching and already has data, cancel that fetch (ignore its result) and start a new one; if it's still fetching its first data, keep that fetch.\n- `focus()`: refetch every stale query that has observers.\n- `read(observerId)` returns `{ status, fetchStatus, data, isStale }` for that observer's query, or `null` for an unknown observer. `has(key)` says whether the query is in the cache.\n\nThe expected results were cross-checked against `@tanstack/query-core` 5.x. Leave the driver as it is.",
        starterCode: "/**\n * @param {{ staleTime: number, gcTime: number, now: () => number,\n *           setTimeout: Function, clearTimeout: Function,\n *           fetchQuery: (key: unknown[], onSuccess: (data: unknown) => void) => void }} config\n */\nfunction createQueryClient(config) {\n  // Your code here: a Map of queries keyed by a stable hash of the query key.\n  return {\n    mount(observerId, key) {},\n    unmount(observerId) {},\n    invalidate(filterKey, { exact = false } = {}) {},\n    focus() {},\n    read(observerId) {\n      return null;\n    },\n    has(key) {\n      return false;\n    },\n  };\n}\n\n// ---- Test driver (leave as is) ----\n// steps: [\"mount\", observerId, key] | [\"unmount\", observerId] | [\"advance\", ms]\n//        [\"invalidate\", filterKey, exact?] | [\"focus\"] | [\"read\", observerId] | [\"has\", key] | [\"fetches\"]\n// Every fetch takes options.fetchMs on the fake clock and resolves to \"data@<time it resolved>\".\nfunction runQueryScenario(options, steps) {\n  const clock = createFakeClock();\n  let fetchCount = 0;\n  const client = createQueryClient({\n    staleTime: options.staleTime,\n    gcTime: options.gcTime,\n    now: clock.now,\n    setTimeout: clock.setTimeout,\n    clearTimeout: clock.clearTimeout,\n    fetchQuery(key, onSuccess) {\n      fetchCount++;\n      clock.setTimeout(() => onSuccess(\"data@\" + clock.now()), options.fetchMs);\n    },\n  });\n  const log = [];\n  for (const [op, a, b] of steps) {\n    if (op === \"mount\") client.mount(a, b);\n    else if (op === \"unmount\") client.unmount(a);\n    else if (op === \"advance\") clock.advance(a);\n    else if (op === \"invalidate\") client.invalidate(a, { exact: b === true });\n    else if (op === \"focus\") client.focus();\n    else if (op === \"read\") log.push(client.read(a));\n    else if (op === \"has\") log.push(client.has(a));\n    else if (op === \"fetches\") log.push(fetchCount);\n  }\n  return log;\n}\n\nfunction createFakeClock() {\n  let now = 0, nextId = 1, seq = 0, queue = [];\n  return {\n    now: () => now,\n    setTimeout(cb, ms = 0) {\n      const id = nextId++;\n      queue.push({ id, time: now + Math.max(0, ms), seq: seq++, cb });\n      return id;\n    },\n    clearTimeout(id) {\n      queue = queue.filter((t) => t.id !== id);\n    },\n    advance(ms) {\n      const end = now + ms;\n      for (;;) {\n        queue.sort((x, y) => x.time - y.time || x.seq - y.seq);\n        const next = queue[0];\n        if (!next || next.time > end) break;\n        queue.shift();\n        now = next.time;\n        next.cb();\n      }\n      now = end;\n    },\n  };\n}\n",
        functionName: "runQueryScenario",
        testCases: [
          {
            description: "first mount: pending + fetching, then success + idle (and stale at once with staleTime 0)",
            args: [
              { staleTime: 0, gcTime: 300000, fetchMs: 100 },
              [["mount", "a", ["todos"]], ["read", "a"], ["advance", 100], ["read", "a"], ["fetches"]],
            ],
            expected: [
              { status: "pending", fetchStatus: "fetching", data: null, isStale: true },
              { status: "success", fetchStatus: "idle", data: "data@100", isStale: true },
              1,
            ],
          },
          {
            description: "staleTime 0: a second observer shows cached data while refetching in the background",
            args: [
              { staleTime: 0, gcTime: 300000, fetchMs: 100 },
              [
                ["mount", "a", ["todos"]],
                ["advance", 100],
                ["mount", "b", ["todos"]],
                ["read", "b"],
                ["advance", 100],
                ["read", "a"],
                ["fetches"],
              ],
            ],
            expected: [
              { status: "success", fetchStatus: "fetching", data: "data@100", isStale: true },
              { status: "success", fetchStatus: "idle", data: "data@200", isStale: true },
              2,
            ],
          },
          {
            description: "staleTime 60 s: a mount inside the window is served from cache, after it refetches",
            args: [
              { staleTime: 60000, gcTime: 300000, fetchMs: 100 },
              [
                ["mount", "a", ["todos"]],
                ["advance", 30100],
                ["mount", "b", ["todos"]],
                ["read", "b"],
                ["fetches"],
                ["advance", 30000],
                ["mount", "c", ["todos"]],
                ["read", "c"],
                ["fetches"],
              ],
            ],
            expected: [
              { status: "success", fetchStatus: "idle", data: "data@100", isStale: false },
              1,
              { status: "success", fetchStatus: "fetching", data: "data@100", isStale: true },
              2,
            ],
          },
          {
            description: "mounting while a fetch is in flight deduplicates it",
            args: [
              { staleTime: 0, gcTime: 300000, fetchMs: 100 },
              [
                ["mount", "a", ["todos"]],
                ["advance", 50],
                ["mount", "b", ["todos"]],
                ["advance", 50],
                ["read", "b"],
                ["fetches"],
              ],
            ],
            expected: [{ status: "success", fetchStatus: "idle", data: "data@100", isStale: true }, 1],
          },
          {
            description: "keys hash the same regardless of object property order",
            args: [
              { staleTime: 60000, gcTime: 300000, fetchMs: 100 },
              [
                ["mount", "a", ["todos", { page: 1, done: false }]],
                ["advance", 100],
                ["mount", "b", ["todos", { done: false, page: 1 }]],
                ["read", "b"],
                ["fetches"],
              ],
            ],
            expected: [{ status: "success", fetchStatus: "idle", data: "data@100", isStale: false }, 1],
          },
          {
            description: "prefix invalidation refetches active matches and only marks inactive ones stale",
            args: [
              { staleTime: Infinity, gcTime: 300000, fetchMs: 100 },
              [
                ["mount", "list", ["todos", { page: 1 }]],
                ["mount", "detail", ["todos", 7]],
                ["mount", "users", ["users"]],
                ["advance", 100],
                ["unmount", "detail"],
                ["invalidate", ["todos"]],
                ["fetches"],
                ["read", "list"],
                ["read", "users"],
                ["advance", 100],
                ["read", "list"],
                ["mount", "detail2", ["todos", 7]],
                ["read", "detail2"],
                ["fetches"],
              ],
            ],
            expected: [
              4,
              { status: "success", fetchStatus: "fetching", data: "data@100", isStale: true },
              { status: "success", fetchStatus: "idle", data: "data@100", isStale: false },
              { status: "success", fetchStatus: "idle", data: "data@200", isStale: false },
              { status: "success", fetchStatus: "fetching", data: "data@100", isStale: true },
              5,
            ],
          },
          {
            description: "`exact` invalidation leaves longer keys alone",
            args: [
              { staleTime: Infinity, gcTime: 300000, fetchMs: 100 },
              [
                ["mount", "a", ["todos"]],
                ["mount", "b", ["todos", 1]],
                ["advance", 100],
                ["invalidate", ["todos"], true],
                ["read", "a"],
                ["read", "b"],
                ["fetches"],
              ],
            ],
            expected: [
              { status: "success", fetchStatus: "fetching", data: "data@100", isStale: true },
              { status: "success", fetchStatus: "idle", data: "data@100", isStale: false },
              3,
            ],
          },
          {
            description: "object parts of a filter key match partially",
            args: [
              { staleTime: Infinity, gcTime: 300000, fetchMs: 100 },
              [
                ["mount", "a", ["todos", { status: "done", page: 2 }]],
                ["mount", "b", ["todos", { status: "open" }]],
                ["advance", 100],
                ["invalidate", ["todos", { status: "done" }]],
                ["read", "a"],
                ["read", "b"],
                ["fetches"],
              ],
            ],
            expected: [
              { status: "success", fetchStatus: "fetching", data: "data@100", isStale: true },
              { status: "success", fetchStatus: "idle", data: "data@100", isStale: false },
              3,
            ],
          },
          {
            description: "unused queries are garbage-collected after gcTime; remounting earlier keeps the cache",
            args: [
              { staleTime: 0, gcTime: 1000, fetchMs: 100 },
              [
                ["mount", "a", ["todos"]],
                ["advance", 100],
                ["unmount", "a"],
                ["advance", 999],
                ["has", ["todos"]],
                ["mount", "b", ["todos"]],
                ["read", "b"],
                ["advance", 100],
                ["unmount", "b"],
                ["advance", 1000],
                ["has", ["todos"]],
              ],
            ],
            expected: [true, { status: "success", fetchStatus: "fetching", data: "data@100", isStale: true }, false],
            isEdgeCase: true,
          },
          {
            description: "a gc timer that fires mid-fetch doesn't remove the query; gc is rescheduled when the fetch ends",
            args: [
              { staleTime: 0, gcTime: 50, fetchMs: 100 },
              [
                ["mount", "a", ["todos"]],
                ["unmount", "a"],
                ["advance", 60],
                ["has", ["todos"]],
                ["advance", 40],
                ["has", ["todos"]],
                ["advance", 50],
                ["has", ["todos"]],
              ],
            ],
            expected: [true, true, false],
            isEdgeCase: true,
          },
          {
            description: "window focus refetches only stale queries that have observers",
            args: [
              { staleTime: 1000, gcTime: 300000, fetchMs: 100 },
              [
                ["mount", "a", ["a"]],
                ["mount", "b", ["b"]],
                ["advance", 100],
                ["unmount", "b"],
                ["advance", 1000],
                ["mount", "c", ["c"]],
                ["advance", 100],
                ["focus"],
                ["fetches"],
                ["read", "a"],
                ["read", "c"],
              ],
            ],
            expected: [
              4,
              { status: "success", fetchStatus: "fetching", data: "data@100", isStale: true },
              { status: "success", fetchStatus: "idle", data: "data@1200", isStale: false },
            ],
          },
          {
            description: "invalidating during a background refetch cancels it and starts a new fetch",
            args: [
              { staleTime: 0, gcTime: 300000, fetchMs: 100 },
              [
                ["mount", "a", ["todos"]],
                ["advance", 100],
                ["focus"],
                ["advance", 50],
                ["invalidate", ["todos"]],
                ["advance", 50],
                ["read", "a"],
                ["advance", 50],
                ["read", "a"],
                ["fetches"],
              ],
            ],
            expected: [
              { status: "success", fetchStatus: "fetching", data: "data@100", isStale: true },
              { status: "success", fetchStatus: "idle", data: "data@250", isStale: true },
              3,
            ],
            isEdgeCase: true,
          },
          {
            description: "invalidating during the very first fetch keeps that fetch",
            args: [
              { staleTime: 0, gcTime: 300000, fetchMs: 100 },
              [
                ["mount", "a", ["todos"]],
                ["advance", 50],
                ["invalidate", ["todos"]],
                ["advance", 50],
                ["read", "a"],
                ["fetches"],
              ],
            ],
            expected: [{ status: "success", fetchStatus: "idle", data: "data@100", isStale: true }, 1],
            isEdgeCase: true,
          },
          {
            description: "after gc, a remount starts again from a hard loading state",
            args: [
              { staleTime: Infinity, gcTime: 300000, fetchMs: 100 },
              [
                ["mount", "a", ["todos"]],
                ["advance", 100],
                ["unmount", "a"],
                ["advance", 999999],
                ["mount", "b", ["todos"]],
                ["read", "b"],
                ["fetches"],
              ],
            ],
            expected: [{ status: "pending", fetchStatus: "fetching", data: null, isStale: true }, 2],
          },
          {
            description: "reading an unknown observer returns `null`",
            args: [{ staleTime: 0, gcTime: 300000, fetchMs: 100 }, [["read", "ghost"]]],
            expected: [null],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "react-eco-forms",
      moduleId: "fe-react-ecosystem",
      trackId: "frontend",
      title: "Form Libraries: React Hook Form vs Formik",
      summary:
        "Forms are where React's controlled-input model gets expensive. Keeping every field in state re-renders the form on every keystroke, and validation, touched and dirty tracking, error-display timing and async submission add a pile of hand-written state. Form libraries package that bookkeeping, and they differ mainly in where the values live.\n\nReact Hook Form (v7) is built on uncontrolled inputs: `register` wires each DOM input by `ref`, values live in the DOM and an internal store, and only the components that subscribe (to `formState.errors`, `useWatch` or a `Controller`) re-render. `formState` is a Proxy, so read the fields you need during render or you won't be subscribed to them. Validation timing is explicit: `mode` (default `\"onSubmit\"`) governs validation before the first submit, `reValidateMode` (default `\"onChange\"`) after it, and `\"onTouched\"` validates on the first blur and then on every change. A resolver runs a schema instead of per-field rules (Zod via `@hookform/resolvers`, which also gives you inferred TypeScript types), and controlled UI kits such as date pickers need `Controller` or `useController`.\n\nFormik stores values in React state, so every change re-renders the `<Formik>` tree unless fields are split out (`FastField`). It still works, but releases have slowed to a trickle (2.4.6 in April 2024, then 2.4.8 and 2.4.9 in November 2025, with hundreds of open issues), so new code usually picks React Hook Form, TanStack Form, or React 19 form actions for simple server-driven forms.\n\nGotchas in any library: a cross-field rule (confirm password, end date after start) is only re-checked when its own field is validated, so declare the dependency (`deps` in `register`) or call `trigger`; `minLength`-style rules skip empty values and don't imply `required`; RHF's `required` doesn't trim, so `\"   \"` passes; and client-side validation is UX, so the server validates again.",
      level: "intermediate",
      estMinutes: 70,
      webRefs: [
        { label: "React Hook Form: useForm", url: "https://react-hook-form.com/docs/useform", kind: "docs" },
        { label: "react-hook-form/resolvers (Zod, Valibot, Yup…)", url: "https://github.com/react-hook-form/resolvers", kind: "repo" },
        { label: "Formik: Overview", url: "https://formik.org/docs/overview", kind: "docs" },
        { label: "React: <input> (controlled vs uncontrolled)", url: "https://react.dev/reference/react-dom/components/input", kind: "docs" },
      ],
      video: {
        title: "React Hook Form - Complete Tutorial (with Zod)",
        channel: "Cosden Solutions",
        url: "https://www.youtube.com/watch?v=cc_xmawJ8Kg",
        videoId: "cc_xmawJ8Kg",
        durationLabel: "28:22",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createForm(schema, mode, defaultValues)`, a small form controller that mimics React Hook Form's validation timing. It returns `{ change(name, value), blur(name), submit(), getErrors() }`; the driver `runForm` replays events and snapshots the errors after each one.\n\nValues start as a deep copy of `defaultValues`. Field names can be dotted paths (`\"address.zip\"` reads and writes `values.address.zip`), and `getErrors()` returns a flat object keyed by field name that holds only fields that currently have an error.\n\n`schema[name].rules` are checked in order and the first failing rule's `message` is the field's error. A value is empty if it's `undefined`, `null`, `false`, an empty array, or a string that is empty after `trim()` (stricter than RHF's built-in `required`, which accepts `\"   \"`).\n\n- `required`: fails when empty.\n- `minLength` / `maxLength` (`value`) compare string length, `pattern` (`value` is a regex source string) must match, and `min` / `max` (`value`) compare `Number(v)`, where `NaN` fails. All four skip empty values.\n- `sameAs` (`field`): fails unless the value is `===` that field's value (checked even when empty).\n- `requiredIf` (`field`, `equals`): fails when that field's value is `===` `equals` and this value is empty.\n- `after` (`field`): skipped if either value is empty; otherwise fails unless `String(v) > String(other)` (ISO dates compare correctly as strings).\n\nValidating a field recomputes its error (set or delete), then validates each field in `schema[name].deps` the same way. Whether an event validates depends on `mode`, as in RHF with `reValidateMode: \"onChange\"`:\n\n- `\"all\"`: validate on every change and blur, before and after submitting.\n- Before the first submit: `\"onTouched\"` validates on blur, and on change once the field has been blurred; `\"onBlur\"` on blur only; `\"onChange\"` on change only; `\"onSubmit\"` never.\n- After the first submit (every mode except `\"all\"`): validate on change only.\n- `blur(name)` marks the field touched. `submit()` marks the form submitted, replaces the errors with a fresh validation of every field in `schema`, and returns `true` when there are none.\n\nLeave the driver as it is.",
        starterCode: "/**\n * @param {Record<string, { rules: object[], deps?: string[] }>} schema\n * @param {\"onSubmit\" | \"onBlur\" | \"onChange\" | \"onTouched\" | \"all\"} mode\n * @param {object} defaultValues\n */\nfunction createForm(schema, mode, defaultValues) {\n  // Your code here\n  return {\n    change(name, value) {},\n    blur(name) {},\n    submit() {\n      return true;\n    },\n    getErrors() {\n      return {};\n    },\n  };\n}\n\n// ---- Test driver (leave as is) ----\n// events: [\"change\", name, value] | [\"blur\", name] | [\"submit\"]\n// Returns one snapshot per event: { errors } (plus { ok } for submits).\nfunction runForm(schema, mode, defaultValues, events) {\n  const form = createForm(schema, mode, defaultValues);\n  return events.map(([type, name, value]) => {\n    if (type === \"change\") form.change(name, value);\n    else if (type === \"blur\") form.blur(name);\n    else if (type === \"submit\") return { ok: form.submit(), errors: form.getErrors() };\n    return { errors: form.getErrors() };\n  });\n}\n",
        functionName: "runForm",
        testCases: [
          {
            description: "onSubmit: nothing shows before the first submit; afterwards fields re-validate on change",
            args: [
              SIGNUP_SCHEMA,
              "onSubmit",
              SIGNUP_EMPTY,
              [
                ["change", "email", "ada"],
                ["blur", "email"],
                ["submit"],
                ["change", "email", "ada@example.com"],
                ["change", "email", "ada@"],
                ["blur", "email"],
              ],
            ],
            expected: [
              { errors: {} },
              { errors: {} },
              { ok: false, errors: { email: "Enter a valid email", password: "Password is required" } },
              { errors: { password: "Password is required" } },
              { errors: { password: "Password is required", email: "Enter a valid email" } },
              { errors: { password: "Password is required", email: "Enter a valid email" } },
            ],
          },
          {
            description: "onBlur: validates on blur only, so fixing a field doesn't clear its error until the next blur",
            args: [
              SIGNUP_SCHEMA,
              "onBlur",
              SIGNUP_EMPTY,
              [
                ["change", "email", "ada"],
                ["blur", "email"],
                ["change", "email", "ada@example.com"],
                ["blur", "email"],
              ],
            ],
            expected: [
              { errors: {} },
              { errors: { email: "Enter a valid email" } },
              { errors: { email: "Enter a valid email" } },
              { errors: {} },
            ],
          },
          {
            description: "onTouched: first validation on blur, then on every change",
            args: [
              SIGNUP_SCHEMA,
              "onTouched",
              SIGNUP_EMPTY,
              [
                ["change", "email", "a"],
                ["blur", "email"],
                ["change", "email", "ada@example.com"],
                ["change", "email", "ada@"],
              ],
            ],
            expected: [
              { errors: {} },
              { errors: { email: "Enter a valid email" } },
              { errors: {} },
              { errors: { email: "Enter a valid email" } },
            ],
          },
          {
            description: "onChange: validates on change, ignores blur",
            args: [
              SIGNUP_SCHEMA,
              "onChange",
              SIGNUP_EMPTY,
              [
                ["change", "email", "a"],
                ["change", "email", ""],
                ["blur", "email"],
                ["change", "email", "ada@example.com"],
              ],
            ],
            expected: [
              { errors: { email: "Enter a valid email" } },
              { errors: { email: "Email is required" } },
              { errors: { email: "Email is required" } },
              { errors: {} },
            ],
          },
          {
            description: "all: validates on blur and on change",
            args: [SIGNUP_SCHEMA, "all", SIGNUP_EMPTY, [["blur", "email"], ["change", "email", "ada@example.com"]]],
            expected: [{ errors: { email: "Email is required" } }, { errors: {} }],
          },
          {
            description: "`deps`: changing the password re-validates the confirmation",
            args: [
              SIGNUP_SCHEMA,
              "onChange",
              SIGNUP_EMPTY,
              [
                ["change", "password", "hunter22x"],
                ["change", "confirm", "hunter22x"],
                ["change", "password", "hunter22y"],
                ["change", "password", "hunter22x"],
              ],
            ],
            expected: [
              { errors: { confirm: "Passwords don't match" } },
              { errors: {} },
              { errors: { confirm: "Passwords don't match" } },
              { errors: {} },
            ],
          },
          {
            description: "without `deps`, a cross-field error goes stale until that field is validated again",
            args: [
              NO_DEPS_SCHEMA,
              "onChange",
              { password: "", confirm: "" },
              [
                ["change", "password", "hunter22x"],
                ["change", "confirm", "hunter22"],
                ["change", "password", "hunter22"],
                ["submit"],
              ],
            ],
            expected: [
              { errors: {} },
              { errors: { confirm: "Passwords don't match" } },
              { errors: { confirm: "Passwords don't match" } },
              { ok: true, errors: {} },
            ],
            isEdgeCase: true,
          },
          {
            description: "onBlur mode after a submit: blur no longer validates (reValidateMode is onChange), so a stale mismatch waits for the next submit",
            args: [
              NO_DEPS_SCHEMA,
              "onBlur",
              { password: "", confirm: "" },
              [
                ["change", "password", "hunter22x"],
                ["change", "confirm", "hunter22x"],
                ["submit"],
                ["change", "password", "hunter22"],
                ["blur", "confirm"],
                ["submit"],
              ],
            ],
            expected: [
              { errors: {} },
              { errors: {} },
              { ok: true, errors: {} },
              { errors: {} },
              { errors: {} },
              { ok: false, errors: { confirm: "Passwords don't match" } },
            ],
            isEdgeCase: true,
          },
          {
            description: "a valid submission returns ok with no errors",
            args: [
              SIGNUP_SCHEMA,
              "onSubmit",
              SIGNUP_EMPTY,
              [
                ["change", "email", "ada@example.com"],
                ["change", "password", "correct-horse"],
                ["change", "confirm", "correct-horse"],
                ["submit"],
              ],
            ],
            expected: [{ errors: {} }, { errors: {} }, { errors: {} }, { ok: true, errors: {} }],
          },
          {
            description: "profile submit: optional rules skip empty values, requiredIf, nested paths and date order",
            args: [
              PROFILE_SCHEMA,
              "onSubmit",
              PROFILE_DEFAULTS,
              [
                ["change", "contact", "phone"],
                ["change", "trip.start", "2026-10-02"],
                ["change", "trip.end", "2026-10-01"],
                ["submit"],
              ],
            ],
            expected: [
              { errors: {} },
              { errors: {} },
              { errors: {} },
              {
                ok: false,
                errors: { phone: "Phone is required for phone contact", "trip.end": "End must be after start" },
              },
            ],
          },
          {
            description: "after submit, a change re-validates only that field: age and ZIP clear, but switching `contact` leaves `phone`'s error until the next submit",
            args: [
              PROFILE_SCHEMA,
              "onSubmit",
              PROFILE_DEFAULTS,
              [
                ["change", "nickname", "ab"],
                ["change", "age", "abc"],
                ["change", "address.zip", "123"],
                ["change", "contact", "phone"],
                ["submit"],
                ["change", "age", "17"],
                ["change", "age", "42"],
                ["change", "address.zip", "02139"],
                ["change", "contact", "email"],
                ["submit"],
              ],
            ],
            expected: [
              { errors: {} },
              { errors: {} },
              { errors: {} },
              { errors: {} },
              {
                ok: false,
                errors: {
                  nickname: "At least 3 characters",
                  age: "You must be 18 or older",
                  phone: "Phone is required for phone contact",
                  "address.zip": "ZIP must be 5 digits",
                  "trip.start": "Start date is required",
                },
              },
              {
                errors: {
                  nickname: "At least 3 characters",
                  age: "You must be 18 or older",
                  phone: "Phone is required for phone contact",
                  "address.zip": "ZIP must be 5 digits",
                  "trip.start": "Start date is required",
                },
              },
              {
                errors: {
                  nickname: "At least 3 characters",
                  phone: "Phone is required for phone contact",
                  "address.zip": "ZIP must be 5 digits",
                  "trip.start": "Start date is required",
                },
              },
              {
                errors: {
                  nickname: "At least 3 characters",
                  phone: "Phone is required for phone contact",
                  "trip.start": "Start date is required",
                },
              },
              {
                errors: {
                  nickname: "At least 3 characters",
                  phone: "Phone is required for phone contact",
                  "trip.start": "Start date is required",
                },
              },
              {
                ok: false,
                errors: { nickname: "At least 3 characters", "trip.start": "Start date is required" },
              },
            ],
          },
          {
            description: "whitespace-only input fails `required`, and `false` counts as empty",
            args: [
              {
                name: { rules: [{ type: "required", message: "Name is required" }] },
                terms: { rules: [{ type: "required", message: "Accept the terms" }] },
              },
              "onSubmit",
              { name: "", terms: false },
              [
                ["change", "name", "   "],
                ["submit"],
                ["change", "name", "Ada"],
                ["change", "terms", true],
                ["submit"],
              ],
            ],
            expected: [
              { errors: {} },
              { ok: false, errors: { name: "Name is required", terms: "Accept the terms" } },
              { errors: { terms: "Accept the terms" } },
              { errors: {} },
              { ok: true, errors: {} },
            ],
            isEdgeCase: true,
          },
          {
            description: "no events, no snapshots",
            args: [SIGNUP_SCHEMA, "onSubmit", SIGNUP_EMPTY, []],
            expected: [],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "react-eco-testing-rtl",
      moduleId: "fe-react-ecosystem",
      trackId: "frontend",
      title: "Unit & Component Testing with Vitest + React Testing Library",
      summary:
        "React Testing Library's premise is that tests should resemble how the software is used: find elements the way a user or assistive technology would, interact like a user, and assert on what they'd perceive, never on component state, props or which hooks ran. Tests written that way survive refactors (swap `useState` for `useReducer`, split a component) and fail when behavior actually breaks. Tests of implementation details do the opposite: they fail on harmless refactors and pass while the UI is broken.\n\nThe query priority encodes that idea: `getByRole` with an accessible name first (which doubles as an accessibility check), then `getByLabelText`, `getByPlaceholderText` and `getByText`, with `getByTestId` as the last resort. The variants matter. `getBy*` throws when nothing, or more than one thing, matches; `queryBy*` returns `null` and exists for asserting absence; `findBy*` returns a promise (a `getBy` inside `waitFor`, 1000 ms timeout by default) for things that appear asynchronously.\n\n`user-event` v14 simulates whole interactions: `await user.type()` produces focus, keydown, input and keyup for each character, and clicks respect `disabled` and `pointer-events: none`. `fireEvent` dispatches a single DOM event. Create the user with `userEvent.setup()`, `await` every call, and with fake timers pass `advanceTimers: vi.advanceTimersByTime` or the test hangs. Vitest 5 runs these tests in jsdom or happy-dom (or a real browser with Browser Mode) behind a Jest-compatible API (`vi.fn`, `vi.mock`, `vi.useFakeTimers`). jsdom has no layout engine, so anything depending on sizes or scrolling belongs in Browser Mode or E2E. Mock the network at its boundary with MSW rather than mocking your own data hooks, so the real fetching code runs.\n\nCommon smells: wrapping updates in `act()` by hand (RTL already does, and an act warning usually means you didn't await the UI change), side effects inside `waitFor`, whole-tree snapshots, and test ids everywhere.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        { label: "Testing Library: About Queries", url: "https://testing-library.com/docs/queries/about/", kind: "docs" },
        { label: "Testing Library: user-event Introduction", url: "https://testing-library.com/docs/user-event/intro/", kind: "docs" },
        { label: "Kent C. Dodds: Common mistakes with React Testing Library", url: "https://kentcdodds.com/blog/common-mistakes-with-react-testing-library", kind: "article" },
        { label: "Kent C. Dodds: Testing Implementation Details", url: "https://kentcdodds.com/blog/testing-implementation-details", kind: "article" },
      ],
      video: {
        title: "React Testing Course for Beginners – Code and Test 3 Apps",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=8vfQ6SWBZ-U",
        videoId: "8vfQ6SWBZ-U",
        durationLabel: "2:04:20",
        startSeconds: 2534,
        chapterLabel: "Birthday Reminder React App with Full Testing",
      },
      alternateVideos: [
        {
          title: "React Testing Full Course 2026 | Vitest and React Testing Library Tutorial",
          channel: "RoadsideCoder",
          url: "https://www.youtube.com/watch?v=6dOpQIwyV6g",
          videoId: "6dOpQIwyV6g",
          durationLabel: "48:21",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-eco-testing-rtl-q1",
          prompt: "Which query should find the form's submit button, `<button type=\"submit\">Save changes</button>`?",
          options: [
            "`screen.getByRole(\"button\", { name: /save changes/i })`",
            "`screen.getByTestId(\"save-button\")` after adding a `data-testid`",
            "`container.querySelector(\"button[type=submit]\")`",
            "`screen.getByText(\"Save changes\").closest(\"button\")`",
          ],
          correctIndex: 0,
          explanation:
            "Role plus accessible name is how users and screen readers find the button, and it fails if the button loses its name or role. Test ids and CSS selectors pass even when the control is inaccessible.",
        },
        {
          id: "react-eco-testing-rtl-q2",
          prompt: "How do you assert that an error message is not rendered?",
          options: [
            "`expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()`",
            "`expect(screen.getByText(/something went wrong/i)).not.toBeInTheDocument()`",
            "`expect(await screen.findByText(/something went wrong/i)).toBeNull()`",
            "`expect(screen.getAllByText(/something went wrong/i)).toHaveLength(0)`",
          ],
          correctIndex: 0,
          explanation:
            "`queryBy*` returns `null` when nothing matches, which is what an absence assertion needs. `getBy*`, `getAllBy*` and `findBy*` throw (or reject) when nothing matches, so the test fails before the assertion runs.",
        },
        {
          id: "react-eco-testing-rtl-q3",
          prompt:
            "This test fails even though the app works. Why?\n\n```jsx\nit(\"shows users after loading\", async () => {\n  const user = userEvent.setup();\n  render(<UserList />);\n  await user.click(screen.getByRole(\"button\", { name: \"Load\" }));\n  expect(screen.getByText(\"Ada Lovelace\")).toBeInTheDocument();\n});\n```",
          options: [
            "The list renders after the fetch resolves; use `expect(await screen.findByText(\"Ada Lovelace\")).toBeInTheDocument()`",
            "`user.click` should not be awaited",
            "`getByText` can't match text with a space in it",
            "`render` must be wrapped in `act()`",
          ],
          correctIndex: 0,
          explanation:
            "Awaiting the click only waits for the interaction, not for the network. `findBy*` retries until the element appears (1000 ms by default), which models what the user actually waits for.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-testing-rtl-q4",
          prompt: "Which statements about `user-event` v14 and `fireEvent` are true? (Select all that apply.)",
          options: [
            "`await user.type(input, \"hi\")` fires keyboard and input events for each character, after focusing the input",
            "`await user.click(button)` on a `disabled` button doesn't call its `onClick`",
            "`fireEvent.change(input, { target: { value: \"hi\" } })` dispatches one change event without focusing or typing",
            "`user-event` methods are synchronous in v14, so `await` is optional",
            "`fireEvent` is deprecated and removed in React Testing Library 16",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`user-event` simulates the whole interaction and applies the browser's rules; `fireEvent` is a thin wrapper around `dispatchEvent`, still available for events user-event doesn't cover. v14's APIs return promises and must be awaited.",
        },
        {
          id: "react-eco-testing-rtl-q5",
          prompt: "Which test is most likely to break during a harmless refactor while missing a real bug?",
          options: [
            "Spying on `React.useState` and asserting the setter was called with `true` after clicking \"Open\"",
            "Clicking \"Open\" and asserting `screen.getByRole(\"dialog\", { name: \"Settings\" })` is visible",
            "Typing into \"Email\", submitting, and asserting the success message appears",
            "Asserting the \"Delete\" button is disabled until a row is selected",
          ],
          correctIndex: 0,
          explanation:
            "Asserting on hooks couples the test to how the component is written: moving to `useReducer` breaks it, and it still passes if the dialog never renders. The other three assert on what a user sees.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-testing-rtl-q6",
          prompt:
            "What's wrong with this?\n\n```js\nawait waitFor(() => {\n  fireEvent.click(screen.getByRole(\"button\", { name: \"Retry\" }));\n  expect(screen.getByText(\"Loaded\")).toBeInTheDocument();\n});\n```",
          options: [
            "`waitFor` re-runs its callback until it passes, so the click may fire many times; interact outside `waitFor` and keep only assertions inside",
            "`waitFor` can't contain `expect` calls",
            "`fireEvent.click` is asynchronous and must be awaited inside `waitFor`",
            "Nothing: this is the recommended pattern for retries",
          ],
          correctIndex: 0,
          explanation:
            "The callback runs on an interval and on DOM mutations until it stops throwing, so side effects inside it repeat. Click once, then `await screen.findByText(\"Loaded\")`.",
        },
        {
          id: "react-eco-testing-rtl-q7",
          prompt:
            "After adding `vi.useFakeTimers()` to a test, `await user.click(button)` never resolves and the test times out. What's the fix?",
          options: [
            "Create the user with `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`",
            "Replace `user.click` with `user.click.sync`",
            "Call `vi.useRealTimers()` inside the component",
            "Wrap the click in `act()` so React flushes timers",
          ],
          correctIndex: 0,
          explanation:
            "user-event waits between actions using timers (`delay` defaults to 0, which still schedules a timeout); with fake timers nothing advances them unless you tell user-event how. There's no sync variant in v14.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-testing-rtl-q8",
          prompt: "A component fetches through a custom `useOrders()` hook built on TanStack Query. How should its tests control the data?",
          options: [
            "Intercept the HTTP request with MSW so the real hook, cache and loading states run",
            "`vi.mock` the `useOrders` module to return fixed data",
            "Pass the orders in as a prop that exists only for tests",
            "Point the component at the staging API",
          ],
          correctIndex: 0,
          explanation:
            "Mocking at the network boundary keeps the code you ship in the test; mocking the hook skips the loading, error and caching behavior you most need to cover. Real APIs make tests slow and flaky.",
        },
        {
          id: "react-eco-testing-rtl-q9",
          prompt:
            "`screen.getByRole(\"button\", { name: \"Delete\" })` can't find `<div className=\"btn\" onClick={remove}>Delete</div>`. What does that tell you?",
          options: [
            "The control has no button role, so keyboard and screen-reader users can't use it either; render a real `<button>`",
            "`getByRole` only works for elements with a `data-testid`",
            "The query needs `{ hidden: true }` to find clickable divs",
            "Role queries don't support `name` for divs, so use `getByText`",
          ],
          correctIndex: 0,
          explanation:
            "Role queries use the accessibility tree, so a failing role query is often a real accessibility bug, not a test problem. Switching to `getByText` would hide it.",
        },
        {
          id: "react-eco-testing-rtl-q10",
          prompt: "Which statements about running these tests in jsdom under Vitest are true? (Select all that apply.)",
          options: [
            "jsdom doesn't do layout, so `getBoundingClientRect()` returns zeros",
            "Navigation other than hash changes isn't implemented",
            "It renders CSS exactly like Chromium, so visual checks are reliable",
            "It runs inside Node, which makes it much faster than a real browser",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "jsdom implements the DOM and many web APIs in Node, but not layout or rendering. Size-, scroll- or visibility-dependent behavior needs Vitest Browser Mode or an E2E test.",
        },
        {
          id: "react-eco-testing-rtl-q11",
          prompt:
            "A test passes but logs \"An update to UserList inside a test was not wrapped in act(...)\". What is the usual cause and fix?",
          options: [
            "State updated after an async operation the test didn't wait for; await the resulting UI change with `findBy*` or `waitFor`",
            "`render` should be wrapped in `act()` in every test",
            "The component must use `useEffect` instead of an event handler",
            "The warning is harmless noise from React 19 and can be silenced",
          ],
          correctIndex: 0,
          explanation:
            "RTL already wraps `render`, events and its async utilities in `act`. The warning usually means an update landed while nothing was awaiting it, so the test may not be asserting on the final UI.",
        },
      ],
    },
    {
      id: "react-eco-e2e-testing",
      moduleId: "fe-react-ecosystem",
      trackId: "frontend",
      title: "End-to-End Testing with Playwright or Cypress",
      summary:
        "End-to-end tests drive a real browser against a running app, so they're the only layer that proves routing, network calls, auth cookies, CSS and third-party scripts work together. They're also the slowest and flakiest layer, so keep them few and focused on critical journeys (sign-up, checkout, permissions) and let unit and component tests cover the combinations.\n\nFlakiness nearly always comes from timing assumptions: a fixed `waitForTimeout(2000)` or `cy.wait(2000)` is usually too slow and occasionally too short. Playwright auto-waits before every action (the locator must resolve to exactly one element that is visible, stable, receiving events and enabled), and its web-first assertions (`await expect(locator).toHaveText(...)`) retry until they pass or time out, 5 seconds by default. Cypress retries queries and assertions for up to 4 seconds (`defaultCommandTimeout`) and waits for actionability before `.click()`. Wait for what the user waits for (a row appears, `waitForResponse`, `cy.wait(\"@alias\")`), and prefer role- and label-based locators to CSS chains.\n\nThe tools differ architecturally. Playwright (~1.63) drives Chromium, Firefox and WebKit from outside the page, so multiple tabs, origins and isolated browser contexts in one test (two users chatting) are first-class; every test gets a fresh context, `page.route` intercepts the network, and the trace viewer records DOM snapshots, network and console for each step of a failed CI run. Cypress (16.x) runs commands inside the browser next to your app, which buys an excellent interactive runner, time-travel snapshots and easy `cy.intercept` stubbing, at the cost of no driving two browsers at once, no native multi-tab support, and cross-origin steps wrapped in `cy.origin`. Its commands are queued, not promises, so `const el = cy.get(\"h1\")` never holds an element.\n\nIsolation beats cleverness: seed data per test through the API, log in programmatically (`storageState`, `cy.session`) rather than through the UI every time, and never depend on another test's leftovers.",
      level: "advanced",
      estMinutes: 90,
      webRefs: [
        { label: "Playwright: Auto-waiting (actionability checks)", url: "https://playwright.dev/docs/actionability", kind: "docs" },
        { label: "Cypress: Trade-offs", url: "https://docs.cypress.io/app/references/trade-offs", kind: "docs" },
        { label: "Playwright: Best Practices", url: "https://playwright.dev/docs/best-practices", kind: "article" },
        { label: "Martin Fowler: The Practical Test Pyramid", url: "https://martinfowler.com/articles/practical-test-pyramid.html", kind: "article" },
      ],
      video: {
        title: "Testing JavaScript with Cypress – Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=u8vMu7viCm8",
        videoId: "u8vMu7viCm8",
        durationLabel: "2:39:33",
      },
      alternateVideos: [
        {
          title: "Software Testing Course – Playwright, E2E, and AI Agents",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=jydYq7oAtD8",
          videoId: "jydYq7oAtD8",
          durationLabel: "1:03:30",
          startSeconds: 852,
          chapterLabel: "Playwright Framework Installation & Setup",
        },
        {
          title: "Cypress vs Playwright side-by-side coding comparison.",
          channel: "Artem Bondar",
          url: "https://www.youtube.com/watch?v=4W7TWu8NmTM",
          videoId: "4W7TWu8NmTM",
          durationLabel: "23:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-eco-e2e-testing-q1",
          prompt:
            "A checkout test does `await page.click(\"#submit\"); await page.waitForTimeout(3000);` and then asserts the order number. It fails about once in 30 CI runs. What's the right fix?",
          options: [
            "Replace the sleep with `await expect(page.getByRole(\"heading\", { name: /order #\\d+/i })).toBeVisible()`",
            "Increase the timeout to 10 seconds",
            "Add `retries: 3` so the flake is hidden",
            "Run the test serially instead of in parallel",
          ],
          correctIndex: 0,
          explanation:
            "Fixed sleeps are wrong in both directions: too long most of the time and occasionally too short. A web-first assertion waits exactly as long as needed (up to its timeout). Retries only hide the race.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-e2e-testing-q2",
          prompt: "Before `await page.getByRole(\"button\", { name: \"Pay\" }).click()`, what does Playwright wait for? (Select all that apply.)",
          options: [
            "The locator resolves to exactly one element",
            "The element is visible and not animating",
            "The element isn't covered by another element, so it would receive the click",
            "The page's network has been idle for 500 ms",
            "The element has a `data-testid` attribute",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Actionability checks cover a single match, visible, stable, receives events and enabled. Playwright doesn't wait for network idle before actions (and discourages relying on it), and test ids are optional.",
        },
        {
          id: "react-eco-e2e-testing-q3",
          prompt:
            "Why is the first assertion flaky and the second one not?\n\n```ts\n// A\nexpect(await page.locator(\".cart-count\").textContent()).toBe(\"3\");\n// B\nawait expect(page.locator(\".cart-count\")).toHaveText(\"3\");\n```",
          options: [
            "A reads the text once, possibly before the update; B is a web-first assertion that retries until it passes or times out",
            "A uses the wrong matcher; `toBe` can't compare strings from the page",
            "B is flaky too; both read the DOM exactly once",
            "A fails because `textContent()` isn't awaited",
          ],
          correctIndex: 0,
          explanation:
            "`textContent()` resolves once with whatever is there, and a generic `expect` doesn't retry. Locator assertions such as `toHaveText` poll until the condition holds (5 s by default).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-e2e-testing-q4",
          prompt: "You need one test in which Alice sends a chat message and Bob, logged in separately, sees it live. Which tool handles that natively?",
          options: [
            "Playwright: create two browser contexts (two sessions) in the same test",
            "Cypress: open a second tab with `cy.visit` and switch to it",
            "Either, with no extra plugins",
            "Neither; this can only be tested manually",
          ],
          correctIndex: 0,
          explanation:
            "Playwright contexts are isolated browser profiles you can drive side by side. Cypress runs inside one browser and can't drive two at once (its docs point to a Puppeteer plugin for multi-tab cases).",
        },
        {
          id: "react-eco-e2e-testing-q5",
          prompt: "What does this log in a Cypress test?\n\n```js\nconst title = cy.get(\"h1\").invoke(\"text\");\nconsole.log(title);\n```",
          options: [
            "A Cypress chainer object, not the heading text",
            "The heading's text",
            "`undefined`, because the command hasn't run yet",
            "A promise that resolves to the text",
          ],
          correctIndex: 0,
          explanation:
            "Cypress commands are enqueued and run later; they return chainers, not values or promises. Read values inside `.then((text) => ...)` or alias them with `.as()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-eco-e2e-testing-q6",
          prompt: "A Playwright test fails only in CI. What gives you the most information about the failing step?",
          options: [
            "Enable `trace: \"on-first-retry\"` and open the trace in the trace viewer",
            "Add `console.log` calls before each step",
            "Take one screenshot at the end of the test",
            "Rerun the test locally until it fails",
          ],
          correctIndex: 0,
          explanation:
            "A trace records every action with before/after DOM snapshots, network requests, console output and the source line, so you can replay the CI run. A final screenshot shows only the end state.",
        },
        {
          id: "react-eco-e2e-testing-q7",
          prompt: "Which of these make `GET /api/orders` return a 500 so you can test the error UI? (Select all that apply.)",
          options: [
            "`await page.route(\"**/api/orders\", (route) => route.fulfill({ status: 500 }))`",
            "`cy.intercept(\"GET\", \"/api/orders\", { statusCode: 500 })`",
            "`await page.waitForResponse(\"**/api/orders\")`",
            "`cy.request(\"GET\", \"/api/orders\")`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`page.route` and `cy.intercept` stub responses. `waitForResponse` only waits for a real response, and `cy.request` makes its own HTTP request outside the app.",
        },
        {
          id: "react-eco-e2e-testing-q8",
          prompt: "Every one of 120 tests logs in through the UI first, which takes 40% of the suite's time and is the most common flake. What should you do?",
          options: [
            "Log in once programmatically and reuse the session (`storageState` in Playwright, `cy.session` in Cypress), keeping one test that covers the real login UI",
            "Delete the login tests; authentication is covered by unit tests",
            "Share one browser page across all tests so the login persists",
            "Add a longer timeout to the login steps",
          ],
          correctIndex: 0,
          explanation:
            "Reusing an authenticated state keeps tests isolated and fast while one dedicated test still exercises the login screen. Sharing a page couples tests to each other's leftovers.",
        },
        {
          id: "react-eco-e2e-testing-q9",
          prompt: "A signup form has 30 combinations of validation rules. Where should most of those cases be tested?",
          options: [
            "Component or unit tests, with one E2E test for the happy path through signup",
            "30 E2E tests, because only a real browser proves validation works",
            "Only in manual QA, because forms change often",
            "In the backend only, since the server validates anyway",
          ],
          correctIndex: 0,
          explanation:
            "Combinatorial logic is cheap and deterministic to test below the UI; E2E tests are best spent proving the journey works end to end. The server must validate too, but that doesn't test the form's UX.",
        },
        {
          id: "react-eco-e2e-testing-q10",
          prompt: "Tests pass individually but fail when the whole suite runs. What's the most likely cause?",
          options: [
            "Shared state between tests, such as leftover database rows, storage or reused accounts, making them order-dependent",
            "The browser runs out of memory after a few tests",
            "E2E tests are nondeterministic by nature",
            "Parallel workers always share cookies",
          ],
          correctIndex: 0,
          explanation:
            "Order dependence is an isolation failure: seed each test's data, use fresh contexts, and never rely on another test's side effects. Playwright gives each test a new browser context precisely to prevent this.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
  ],
} satisfies Module;
