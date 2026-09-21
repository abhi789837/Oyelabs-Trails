import type { Module } from "@/types/curriculum";

// Shared fixtures for the mern-react-express challenge.
const apiCookie = { name: "sid", domain: "api.example.com", hostOnly: true, path: "/", secure: true, sameSite: "Lax" };
const appServer = {
  origin: ["https://app.example.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
};
const splitDeploy = (browser: "chrome" | "safari") => ({
  browser,
  pageUrl: "https://shop-web.vercel.app/checkout",
  publicSuffixes: ["app", "com", "vercel.app", "onrender.com"],
  request: {
    url: "https://shop-api.onrender.com/api/orders",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  },
  cookie: { name: "sid", domain: "shop-api.onrender.com", hostOnly: true, path: "/", secure: true, sameSite: "None" },
  server: { origin: ["https://shop-web.vercel.app"], credentials: true, methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] },
});
const crossResult = (crossOrigin: boolean, crossSite: boolean, preflight: boolean, cookieSent: boolean, readable: boolean, blockedBy: string | null) => ({
  crossOrigin,
  crossSite,
  preflight,
  cookieSent,
  readable,
  blockedBy,
});

export default {
  id: "fs-mern",
  trackId: "fullstack",
  name: "MERN End-to-End",
  description:
    "How React, Express, Node and MongoDB actually connect once they leave localhost: the HTTP contract between tiers, CORS and cookies across origins and sites, Mongoose inside a real API, JWT access and refresh tokens end to end, and deploying the pieces to separate hosts without breaking auth. It assumes you know each technology; this camp is about the seams between them.",
  refs: [
    { label: "MongoDB: MERN Stack Explained", url: "https://www.mongodb.com/resources/languages/mern-stack", kind: "docs" },
    { label: "MongoDB: MERN Stack Tutorial", url: "https://www.mongodb.com/resources/languages/mern-stack-tutorial", kind: "article" },
    { label: "MDN: Cross-Origin Resource Sharing (CORS)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS", kind: "docs" },
    { label: "Express: Production best practices, security", url: "https://expressjs.com/en/advanced/best-practice-security/", kind: "docs" },
  ],
  topics: [
    {
      id: "mern-architecture",
      moduleId: "fs-mern",
      trackId: "fullstack",
      title: "MERN Architecture Overview",
      summary:
        "MERN splits one product across two runtimes: a React bundle that runs in the user's browser and a Node/Express API that owns every rule, secret and MongoDB connection. The browser can't be trusted, so the API re-checks everything the UI enforces; route guards, hidden buttons and client-side validation are UX, not security. The only thing the tiers share is an HTTP contract (JSON shapes, status codes, error bodies, how auth travels), and it deserves the care of a versioned interface, because JSON quietly changes types in transit: a Mongoose `Date` arrives as an ISO string, an `ObjectId` as a string, and `undefined` fields vanish.\n\nTopology decides most of your integration pain. Serving the built React app from Express, or putting both behind one domain with a reverse proxy, makes every call same-origin: no CORS, first-party cookies, one deploy. Splitting them (static host plus API host) buys CDN-cached assets and independent scaling, but every request becomes cross-origin and, unless both share a registrable domain, cross-site, which is exactly where cookies and CORS start failing. Vite's `server.proxy` hides all of this in development by making the browser talk to its own origin; it doesn't exist in production, so these bugs first appear after deploy.\n\nConfiguration crosses the tiers differently too. `import.meta.env.VITE_*` values are inlined into the bundle at build time: they're public, and changing them on the host does nothing until you rebuild. `MONGODB_URI` and JWT keys live only in the API's runtime environment. If the browser needs a value, it isn't a secret.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "MongoDB: MERN Stack Explained", url: "https://www.mongodb.com/resources/languages/mern-stack", kind: "docs" },
        { label: "Vite: Env Variables and Modes", url: "https://vite.dev/guide/env-and-mode", kind: "docs" },
        { label: "OWASP: HTML5 Security Cheat Sheet (Local Storage)", url: "https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html", kind: "article" },
        { label: "sudheerj: JavaScript Interview Questions", url: "https://github.com/sudheerj/javascript-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "MERN Stack Tutorial #1 - What is the MERN Stack?",
        channel: "Net Ninja",
        url: "https://www.youtube.com/watch?v=98BzS5Oz5E4",
        videoId: "98BzS5Oz5E4",
        durationLabel: "7:05",
      },
      alternateVideos: [
        {
          title: "Learn the MERN Stack - Full Tutorial (MongoDB, Express, React, Node.js)",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=7CqJlxBYj-M",
          videoId: "7CqJlxBYj-M",
          durationLabel: "1:47:02",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mern-architecture-q1",
          prompt:
            "A Vite React app on a static host reads `import.meta.env.VITE_API_URL`. After moving the API, you change `VITE_API_URL` in the host's dashboard but don't trigger a new build. What happens?",
          options: [
            "The deployed bundle keeps calling the old URL until the app is rebuilt and redeployed",
            "The new value is used on the next page load, because Vite reads env variables at runtime",
            "The browser fetches the variable from the host's environment on each request",
            "Only visitors with an empty cache get the new URL",
          ],
          correctIndex: 0,
          explanation:
            "`vite build` statically replaces `import.meta.env.VITE_*` with string literals, so the value is baked into the JavaScript files. Nothing reads the host's environment at runtime; a rebuild is the only way to change it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-architecture-q2",
          prompt: "Which values are acceptable to expose through `VITE_`-prefixed variables in a MERN frontend? (Select all that apply.)",
          options: [
            "The public base URL of the API",
            "A Stripe publishable key (`pk_live_...`)",
            "A Sentry DSN used by the browser SDK",
            "The `JWT_SECRET` the API uses to sign access tokens",
            "The MongoDB Atlas connection string",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Everything in a `VITE_` variable ships in the bundle, so only values designed to be public belong there: API URLs, publishable keys and Sentry DSNs. A signing secret or a database URI in the bundle hands an attacker your tokens or your data.",
        },
        {
          id: "mern-architecture-q3",
          prompt:
            "In development the React app calls `fetch('/api/posts')`, and Vite's `server.proxy` forwards `/api` to `http://localhost:4000`. You deploy the built frontend to a static host at `app.example.com` and the API to `api.example.com` without changing the code. What's the first failure you'll see?",
          options: [
            "`/api/posts` now goes to the static host, which has no API and returns a 404 or `index.html`, because the proxy only ever existed in the dev server",
            "CORS errors, because the proxy was adding `Access-Control-Allow-Origin` in development",
            "Cookies stop working because the proxy was rewriting `SameSite`",
            "Nothing: `vite build` bundles the proxy configuration into the production build",
          ],
          correctIndex: 0,
          explanation:
            "A relative URL resolves against the page's origin, and in production nothing forwards it. The proxy never added CORS headers; it made requests same-origin, which is why CORS shows up as the next problem once you point the client at `api.example.com`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-architecture-q4",
          prompt:
            "An engineer restricts the Express `cors()` origin to `https://app.example.com` and declares the API protected from other clients. What's wrong with that reasoning?",
          options: [
            "CORS only tells browsers whether page scripts may read responses; curl, servers and scripts ignore it, so authentication and authorization are still required",
            "CORS also has to be configured in MongoDB Atlas before it's enforced",
            "The origin needs a trailing slash (`https://app.example.com/`) to be enforced",
            "CORS only applies to `GET` requests, so writes are still open",
          ],
          correctIndex: 0,
          explanation:
            "The server still receives and processes every request; CORS headers only control whether browser JavaScript on another origin can read the response. Protection comes from authenticating and authorizing each request. A trailing slash would actually break the match, since an origin has no path.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-architecture-q5",
          prompt:
            "The API answers `404` with the body `{ \"error\": \"Post not found\" }`. What does `loadPost(\"42\")` return?\n\n```js\nasync function loadPost(id) {\n  try {\n    const res = await fetch(\"/api/posts/\" + id);\n    return await res.json();\n  } catch {\n    return null;\n  }\n}\n```",
          options: ["`{ error: \"Post not found\" }`", "`null`", "It throws a `404` error to the caller", "`undefined`"],
          correctIndex: 0,
          explanation:
            "`fetch` only rejects on network failures (DNS, connection refused, CORS). A `404` or `500` resolves normally, so the error body is parsed and returned as if it were a post. Check `res.ok` (or `res.status`) before trusting the body.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-architecture-q6",
          prompt:
            "A Mongoose schema has `createdAt: Date`. The React component gets the post from `res.json()` and calls `post.createdAt.getFullYear()`. What happens?",
          options: [
            "It throws a `TypeError`: `createdAt` arrived as an ISO string, not a `Date`",
            "It works, because Express tags Dates so that `res.json()` restores them",
            "It returns `NaN`",
            "It works only if the schema uses `timestamps: true`",
          ],
          correctIndex: 0,
          explanation:
            "JSON has no date type: `Date.prototype.toJSON` produces an ISO string and `JSON.parse` leaves it a string. Parse it on the client (or validate the response with a schema that coerces dates); `timestamps` only controls how the server sets the field.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-architecture-q7",
          prompt: "Which of these actually stop a logged-in user from deleting someone else's post? (Select all that apply.)",
          options: [
            "Checking `post.author.equals(req.user.id)` in the Express handler before deleting",
            "Deleting with `Post.deleteOne({ _id: id, author: req.user.id })` and returning 404 when nothing was deleted",
            "Hiding the Delete button unless `post.author === currentUser.id`",
            "A React Router guard that redirects non-authors away from `/posts/:id/edit`",
            "Restricting CORS to the frontend's origin",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Only checks on the server count, whether in code or folded into the query filter. Anyone can send `DELETE /api/posts/42` with their own valid token from curl, so UI hiding, client-side route guards and CORS change nothing about what the API allows.",
        },
        {
          id: "mern-architecture-q8",
          prompt:
            "You want first-party `SameSite=Lax` cookies, no CORS configuration at all, and a single deploy. Which topology gives you all three?",
          options: [
            "Build React and serve it with `express.static` from the API process, or put both behind one domain with a reverse proxy",
            "Frontend on `yourapp.netlify.app`, API on `yourapp.onrender.com`",
            "Frontend on Vercel and API on Render, both with `cors({ origin: \"*\" })`",
            "Frontend on a CDN, with the API URL in a `VITE_` variable",
          ],
          correctIndex: 0,
          explanation:
            "Only a single origin makes every call same-origin and every cookie first-party. The split topologies are cross-origin (so they need CORS) and, with different registrable domains, cross-site (so `Lax` cookies aren't sent on `fetch`).",
        },
        {
          id: "mern-architecture-q9",
          prompt:
            "The React app keeps the JWT access token in `localStorage`, and a compromised npm dependency injects script into the page. Compared with keeping the token in an `HttpOnly` cookie, what does the attacker gain?",
          options: [
            "They can read and exfiltrate the token and replay it from their own machine until it expires; with an `HttpOnly` cookie they can still send requests from the victim's page but can't steal the token",
            "Nothing: injected scripts can read `HttpOnly` cookies through `document.cookie` too",
            "Nothing: browsers encrypt `localStorage` per origin",
            "They gain access only if the token is signed with HS256 rather than RS256",
          ],
          correctIndex: 0,
          explanation:
            "`HttpOnly` limits the blast radius: the token never leaves the browser, so the attack ends when the tab closes. It doesn't make XSS harmless, since the script can still act as the user, which is why CSP and dependency hygiene matter in both designs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-architecture-q10",
          prompt:
            "On Express 5, `GET /api/posts/abc` makes Mongoose throw a `CastError` inside this handler. What happens?\n\n```js\napp.get(\"/api/posts/:id\", async (req, res) => {\n  const post = await Post.findById(req.params.id);\n  res.json(post);\n});\n```",
          options: [
            "The rejected promise is passed to the error-handling middleware (a 500 by default), so map `CastError` to a 400 or 404 there",
            "Node crashes the process with an unhandled rejection, as it would under Express 4",
            "The request hangs until the client times out",
            "Express 5 automatically responds `404` for a `CastError`",
          ],
          correctIndex: 0,
          explanation:
            "Express 5 forwards rejected promises from handlers to `next(err)`. Express 4 didn't, so on modern Node the same code produced an unhandled rejection that terminates the process by default. Express has no Mongoose-specific status mapping; that's your error middleware's job.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-architecture-q11",
          prompt:
            "The React API client reacts to `401` by refreshing the token and retrying, and to `403` by showing \"You don't have access\". The API returns `401` when a logged-in user edits a post they don't own. What goes wrong?",
          options: [
            "Every forbidden action triggers a pointless refresh and a retry that fails again, possibly logging the user out, instead of showing a permissions error",
            "Nothing: clients treat `401` and `403` the same way",
            "The browser shows its native login dialog for every `401`",
            "CORS blocks `401` responses from being read",
          ],
          correctIndex: 0,
          explanation:
            "`401` means the credentials are missing or invalid; `403` means they're valid but not allowed. The contract drives client behaviour, so the wrong code sends the client down the re-authentication path. Browsers only show a native prompt for `WWW-Authenticate: Basic` challenges.",
        },
      ],
    },
    {
      id: "mern-react-express",
      moduleId: "fs-mern",
      trackId: "fullstack",
      title: "Connecting a React Frontend to an Express API",
      summary:
        "Between your React code and your Express API sits a browser applying two independent rule sets. **CORS** decides whether page JavaScript may *read* a cross-origin response: the browser enforces it, the server configures it with `Access-Control-*` headers, and curl never cares. **Cookie rules** decide whether a cookie is *attached*: `SameSite` compares *sites* (scheme plus registrable domain, per the Public Suffix List), not origins, while `Domain`, `Path` and `Secure` filter by host, path and scheme. Conflating the two causes most \"works locally, broken in production\" auth bugs.\n\nA request that isn't simple (a method other than GET, HEAD or POST, a JSON `Content-Type`, an `Authorization` header) triggers an `OPTIONS` preflight, and when the preflight fails the real request is never sent. A simple request is always sent; CORS only hides the response. That's why `cors({ origin: \"*\" })` with `credentials: \"include\"` fails in an instructive way: the request runs with the user's cookie and the page just can't see the result. Credentialed requests need an exact `Access-Control-Allow-Origin` plus `Access-Control-Allow-Credentials: true`, and a `*` in `Allow-Headers` never covers `Authorization`.\n\nTopology decides whether cookie auth works at all. `app.example.com` calling `api.example.com` is cross-origin but same-site, so `SameSite=Lax` cookies flow once the client opts in with `credentials: \"include\"` (axios: `withCredentials`). `web.vercel.app` calling `api.onrender.com`, or even two `*.vercel.app` projects, is cross-site because those are public suffixes: only `SameSite=None; Secure` cookies are sent, and Safari blocks them anyway. Different localhost ports are the same site, which hides all of this in development.",
      level: "advanced",
      estMinutes: 95,
      webRefs: [
        { label: "MDN: Cross-Origin Resource Sharing (CORS)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS", kind: "docs" },
        { label: "web.dev: Understanding \"same-site\" and \"same-origin\"", url: "https://web.dev/articles/same-site-same-origin", kind: "article" },
        { label: "Express: cors middleware", url: "https://expressjs.com/en/resources/middleware/cors/", kind: "docs" },
        { label: "MDN: Set-Cookie", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie", kind: "docs" },
      ],
      video: {
        title: "MERN Stack Tutorial for Beginners with Deployment – 2025",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=F9gB5b4jgOI",
        videoId: "F9gB5b4jgOI",
        durationLabel: "3:34:54",
        startSeconds: 7320,
        chapterLabel: "8- Home Page",
      },
      alternateVideos: [
        {
          title: "CORS Explained - Cross-Origin Resource Sharing",
          channel: "Piyush Garg",
          url: "https://www.youtube.com/watch?v=WWnR4xptSRk",
          videoId: "WWnR4xptSRk",
          durationLabel: "28:39",
        },
        {
          title: "Full Stack Web Development for Beginners (Full Course on HTML, CSS, JavaScript, Node.js, MongoDB)",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=nu_pCVPKzTk",
          videoId: "nu_pCVPKzTk",
          durationLabel: "7:29:11",
          startSeconds: 24572,
          chapterLabel: "Connect Frontend with Backend",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `analyzeRequest(scenario)`. Given the page the React app runs on, one `fetch` it makes to the API, the one cookie the browser holds for the API, and the API's CORS configuration, predict what the browser does. Every request is a `fetch` call, never a navigation. Return `{ crossOrigin, crossSite, preflight, cookieSent, readable, blockedBy }`.\n\n- **Origin** is scheme, host and port (`new URL(url).origin`). `crossOrigin` compares the page's origin with the request's.\n- **Site** is the scheme plus the registrable domain; ports don't count. The registrable domain is the longest entry of `publicSuffixes` that equals the host or ends it after a dot, plus the one label to its left. `localhost`, IPv4 addresses, hosts matching no suffix and hosts that are themselves a suffix are their own registrable domain. `crossSite` compares the two sites.\n- **Preflight** is needed only when cross-origin and either the method isn't `GET`, `HEAD` or `POST`, or a request header isn't safelisted. Safelisted header names (case-insensitive) are `Accept`, `Accept-Language`, `Content-Language`, and `Content-Type` only when its MIME type (before any `;`) is `application/x-www-form-urlencoded`, `multipart/form-data` or `text/plain`.\n- **Credentials**: `request.credentials` defaults to `\"same-origin\"` (fetch's default). `\"include\"` makes the request credentialed.\n- **CORS check** (for the preflight and for the response): a missing `server` or `server.origin` of `null` sends no `Access-Control-Allow-Origin`; `\"*\"` sends `*`; a string is sent as is; an array sends the page origin back if it's listed, otherwise nothing. The check passes when the header is `*` and the request isn't credentialed, or when it equals the page origin and, for credentialed requests, `server.credentials` is `true`.\n- **Preflight check**: the CORS check must pass; a method other than `GET`, `HEAD` or `POST` must be in `server.methods` (default `[\"GET\", \"HEAD\", \"PUT\", \"PATCH\", \"POST\", \"DELETE\"]`), or `methods` contains `\"*\"` and the request isn't credentialed; every non-safelisted header must be in `server.allowedHeaders` (case-insensitive), where `\"*\"` matches any header except `Authorization`, and only for non-credentialed requests. If `allowedHeaders` is omitted, the server echoes back whatever headers were requested (the `cors` package default). A failed preflight means the real request is never sent: `cookieSent: false`, `readable: false`, `blockedBy: \"preflight\"`.\n- **Cookie** (`cookieSent`): there must be a cookie; the credentials mode must allow it (`\"include\"`, or `\"same-origin\"` on a same-origin request); a `SameSite=None` cookie without `Secure` was rejected when it was set; a host-only cookie needs an exact host match and a domain cookie matches its domain and any subdomain; the path must match (equal, or a prefix followed by `/`, or a cookie path ending in `/`); `Secure` needs `https:` except on `localhost`. On a cross-site request only `SameSite=None` cookies are sent (a `null` SameSite counts as `Lax`, Chrome's default), and `\"safari\"` sends no cookies on cross-site requests at all.\n- **Response**: `readable` is `true` for a same-origin request or when the CORS check passes. Otherwise `blockedBy` is `\"cors\"`: the request reached the server, cookie and all, but the page can't see the response. `blockedBy` is `null` when nothing blocked the request.",
        starterCode: `/**
 * Predict what the browser does with one fetch() from the React app to the API.
 *
 * @param {{
 *   browser: "chrome" | "safari",
 *   pageUrl: string,
 *   publicSuffixes: string[],
 *   request: { url: string, method: string, headers?: Record<string, string>, credentials?: "omit" | "same-origin" | "include" },
 *   cookie: null | { name: string, domain: string, hostOnly: boolean, path: string, secure: boolean, sameSite: "Strict" | "Lax" | "None" | null },
 *   server: null | { origin: "*" | string | string[] | null, credentials?: boolean, methods?: string[], allowedHeaders?: string[] },
 * }} scenario
 * @returns {{ crossOrigin: boolean, crossSite: boolean, preflight: boolean, cookieSent: boolean, readable: boolean, blockedBy: null | "preflight" | "cors" }}
 */
function analyzeRequest(scenario) {
  // Your code here
}
`,
        functionName: "analyzeRequest",
        testCases: [
          {
            description: "same-origin JSON POST (Express serves the React build): no CORS, no preflight, cookie sent",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://shop.example.com/cart",
                publicSuffixes: ["com"],
                request: { url: "https://shop.example.com/api/cart", method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin" },
                cookie: { name: "sid", domain: "shop.example.com", hostOnly: true, path: "/", secure: true, sameSite: "Strict" },
                server: null,
              },
            ],
            expected: crossResult(false, false, false, true, true, null),
          },
          {
            description: "an API on a sibling subdomain is cross-origin but same-site, so a Lax cookie is sent with credentials: 'include'",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://app.example.com/",
                publicSuffixes: ["com"],
                request: { url: "https://api.example.com/api/me", method: "GET", headers: {}, credentials: "include" },
                cookie: apiCookie,
                server: appServer,
              },
            ],
            expected: crossResult(true, false, false, true, true, null),
          },
          {
            description: "fetch's default credentials mode never attaches a cookie to a cross-origin call",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://app.example.com/",
                publicSuffixes: ["com"],
                request: { url: "https://api.example.com/api/me", method: "GET", headers: {} },
                cookie: apiCookie,
                server: appServer,
              },
            ],
            expected: crossResult(true, false, false, false, true, null),
          },
          {
            description: "Vercel frontend and Render API: the JSON POST is preflighted and a SameSite=None; Secure cookie is sent in Chrome",
            args: [splitDeploy("chrome")],
            expected: crossResult(true, true, true, true, true, null),
          },
          {
            description: "the same deployment in Safari: the cross-site cookie is blocked, so the API sees an anonymous request",
            args: [splitDeploy("safari")],
            expected: crossResult(true, true, true, false, true, null),
            isEdgeCase: true,
          },
          {
            description: "a wildcard origin with credentials: the simple GET still goes out with the cookie, but the page can't read the response",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://app.example.com/",
                publicSuffixes: ["com"],
                request: { url: "https://api.example.com/api/me", method: "GET", headers: {}, credentials: "include" },
                cookie: apiCookie,
                server: { origin: "*", credentials: true },
              },
            ],
            expected: crossResult(true, false, false, true, false, "cors"),
            isEdgeCase: true,
          },
          {
            description: "a PUT with an Authorization header fails the preflight when only Content-Type is allowed, so nothing is sent",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://app.example.com/posts/42/edit",
                publicSuffixes: ["com"],
                request: {
                  url: "https://api.example.com/api/posts/42",
                  method: "PUT",
                  headers: { "Content-Type": "application/json", Authorization: "Bearer abc" },
                  credentials: "include",
                },
                cookie: apiCookie,
                server: appServer,
              },
            ],
            expected: crossResult(true, false, true, false, false, "preflight"),
          },
          {
            description: "Access-Control-Allow-Headers: * never covers Authorization",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://dashboard.example.org/reports",
                publicSuffixes: ["org", "io"],
                request: { url: "https://api.partner.io/v1/reports", method: "GET", headers: { Authorization: "Bearer t0k3n" }, credentials: "omit" },
                cookie: null,
                server: { origin: "*", allowedHeaders: ["*"] },
              },
            ],
            expected: crossResult(true, true, true, false, false, "preflight"),
            isEdgeCase: true,
          },
          {
            description: "Access-Control-Allow-Headers: * does cover other custom headers on a non-credentialed request",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://dashboard.example.org/reports",
                publicSuffixes: ["org", "io"],
                request: { url: "https://api.partner.io/v1/reports", method: "GET", headers: { "X-Api-Key": "k-123" }, credentials: "omit" },
                cookie: null,
                server: { origin: "*", allowedHeaders: ["*"] },
              },
            ],
            expected: crossResult(true, true, true, false, true, null),
          },
          {
            description: "two *.vercel.app projects are different sites (vercel.app is a public suffix), so a Lax cookie stays home",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://acme-web.vercel.app/",
                publicSuffixes: ["app", "vercel.app"],
                request: { url: "https://acme-api.vercel.app/api/me", method: "GET", headers: {}, credentials: "include" },
                cookie: { name: "sid", domain: "acme-api.vercel.app", hostOnly: true, path: "/", secure: true, sameSite: "Lax" },
                server: { origin: ["https://acme-web.vercel.app"], credentials: true },
              },
            ],
            expected: crossResult(true, true, false, false, true, null),
            isEdgeCase: true,
          },
          {
            description: "a SameSite=None cookie without Secure was rejected when set, so it's never sent",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://app.example.com/",
                publicSuffixes: ["com"],
                request: { url: "https://api.example.com/api/me", method: "GET", headers: {}, credentials: "include" },
                cookie: { name: "sid", domain: "api.example.com", hostOnly: true, path: "/", secure: false, sameSite: "None" },
                server: appServer,
              },
            ],
            expected: crossResult(true, false, false, false, true, null),
            isEdgeCase: true,
          },
          {
            description: "Vite dev server to a local API: different ports are cross-origin but the same site, and Secure works on localhost",
            args: [
              {
                browser: "chrome",
                pageUrl: "http://localhost:5173/",
                publicSuffixes: ["com"],
                request: { url: "http://localhost:3000/api/me", method: "GET", headers: {}, credentials: "include" },
                cookie: { name: "sid", domain: "localhost", hostOnly: true, path: "/", secure: true, sameSite: "Lax" },
                server: { origin: ["http://localhost:5173"], credentials: true },
              },
            ],
            expected: crossResult(true, false, false, true, true, null),
            isEdgeCase: true,
          },
          {
            description: "a refresh cookie scoped to Path=/api/auth/refresh isn't sent to /api/auth/refresh-token",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://app.example.com/",
                publicSuffixes: ["com"],
                request: { url: "https://api.example.com/api/auth/refresh-token", method: "POST", headers: {}, credentials: "include" },
                cookie: { name: "rt", domain: "api.example.com", hostOnly: true, path: "/api/auth/refresh", secure: true, sameSite: "Strict" },
                server: appServer,
              },
            ],
            expected: crossResult(true, false, false, false, true, null),
            isEdgeCase: true,
          },
          {
            description: "the same refresh cookie is sent to its exact path",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://app.example.com/",
                publicSuffixes: ["com"],
                request: { url: "https://api.example.com/api/auth/refresh", method: "POST", headers: {}, credentials: "include" },
                cookie: { name: "rt", domain: "api.example.com", hostOnly: true, path: "/api/auth/refresh", secure: true, sameSite: "Strict" },
                server: appServer,
              },
            ],
            expected: crossResult(true, false, false, true, true, null),
          },
          {
            description: "a host-only cookie set by app.example.com is never sent to api.example.com",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://app.example.com/",
                publicSuffixes: ["com"],
                request: { url: "https://api.example.com/api/me", method: "GET", headers: {}, credentials: "include" },
                cookie: { name: "sid", domain: "app.example.com", hostOnly: true, path: "/", secure: true, sameSite: "Lax" },
                server: appServer,
              },
            ],
            expected: crossResult(true, false, false, false, true, null),
          },
          {
            description: "a Domain=example.com cookie is shared with every subdomain, even in Safari, because the request is same-site",
            args: [
              {
                browser: "safari",
                pageUrl: "https://app.example.com/",
                publicSuffixes: ["com"],
                request: { url: "https://api.example.com/api/me", method: "GET", headers: {}, credentials: "include" },
                cookie: { name: "sid", domain: "example.com", hostOnly: false, path: "/", secure: true, sameSite: "Lax" },
                server: appServer,
              },
            ],
            expected: crossResult(true, false, false, true, true, null),
          },
          {
            description: "a DELETE the server doesn't list in its allowed methods is stopped at the preflight",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://app.example.com/",
                publicSuffixes: ["com"],
                request: { url: "https://api.example.com/api/posts/42", method: "DELETE", headers: {}, credentials: "include" },
                cookie: apiCookie,
                server: { origin: ["https://app.example.com"], credentials: true, methods: ["GET", "POST"] },
              },
            ],
            expected: crossResult(true, false, true, false, false, "preflight"),
          },
          {
            description: "multi-label public suffixes: www.shop.co.uk and api.shop.co.uk are the same site",
            args: [
              {
                browser: "chrome",
                pageUrl: "https://www.shop.co.uk/",
                publicSuffixes: ["uk", "co.uk"],
                request: { url: "https://api.shop.co.uk/basket", method: "GET", headers: {}, credentials: "include" },
                cookie: { name: "sid", domain: "api.shop.co.uk", hostOnly: true, path: "/", secure: true, sameSite: "Lax" },
                server: { origin: "https://www.shop.co.uk", credentials: true },
              },
            ],
            expected: crossResult(true, false, false, true, true, null),
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "mern-mongoose",
      moduleId: "fs-mern",
      trackId: "fullstack",
      title: "MongoDB + Mongoose in a Full App",
      summary:
        "In a MERN API, Mongoose is the boundary where untrusted JSON becomes documents, so its production problems are about lifecycle and trust more than syntax. Connect once at startup and reuse the connection: each connection owns a driver pool (`maxPoolSize` defaults to 100), and model calls made before the connection is ready are buffered, then fail after `bufferTimeoutMS` (10 seconds) with \"buffering timed out\". That message almost always means a wrong URI or an Atlas IP access list blocking the host, not a slow query. On serverless hosts, keep the connection promise in module scope so warm invocations reuse it.\n\nRequest validation and schema validation do different jobs. Validate bodies at the edge (zod, Joi, express-validator) so clients get a `400` with field errors and only allow-listed fields reach the model; `User.create(req.body)` happily saves `role: \"admin\"` if the schema has a `role` path. Treat Mongoose validators as the last line of defence and know their gaps: `unique` builds an index rather than validating (a duplicate surfaces as an E11000 error, or not at all if the index was never built), and update validators are off unless you pass `runValidators: true`, so `findByIdAndUpdate` skips `min`, `enum` and custom validators.\n\nFor reads, `.lean()` returns plain objects (around 3x smaller, no change tracking), ideal for GET endpoints, but getters, virtuals and `toJSON` transforms don't run, so a transform that hides `passwordHash` silently stops protecting you; `select: false` on the path is the safer guard. `populate()` sends one extra query per populated path, not per document. Design compound indexes for your real query shapes and turn off `autoIndex` in production. Mongoose 9 also dropped the `next` callback from pre middleware.",
      level: "advanced",
      estMinutes: 70,
      webRefs: [
        { label: "Mongoose: Connections", url: "https://mongoosejs.com/docs/connections.html", kind: "docs" },
        { label: "Mongoose: Validation", url: "https://mongoosejs.com/docs/validation.html", kind: "docs" },
        { label: "Mongoose: Faster Mongoose Queries With Lean", url: "https://mongoosejs.com/docs/tutorials/lean.html", kind: "article" },
        { label: "Mongoose: Migrating to Mongoose 9", url: "https://mongoosejs.com/docs/migrating_to_9.html", kind: "docs" },
      ],
      video: {
        title: "Mongoose Crash Course - Beginner Through Advanced",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=DZBGEVgL2eE",
        videoId: "DZBGEVgL2eE",
        durationLabel: "33:36",
      },
      alternateVideos: [
        {
          title: "MERN Stack Tutorial for Beginners with Deployment – 2025",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=F9gB5b4jgOI",
          videoId: "F9gB5b4jgOI",
          durationLabel: "3:34:54",
          startSeconds: 2632,
          chapterLabel: "4- Setting Up Our Database (MongoDB)",
        },
        {
          title: "Learn the MERN Stack - Full Tutorial (MongoDB, Express, React, Node.js)",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=7CqJlxBYj-M",
          videoId: "7CqJlxBYj-M",
          durationLabel: "1:47:02",
          startSeconds: 1004,
          chapterLabel: "Connecting to MongoDB Atlas with Mongoose",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mern-mongoose-q1",
          prompt:
            "Under load, this API starts failing with connection errors from Atlas. Why?\n\n```js\napp.get(\"/api/posts\", async (req, res) => {\n  const conn = await mongoose.createConnection(process.env.MONGODB_URI).asPromise();\n  const Post = conn.model(\"Post\", postSchema);\n  res.json(await Post.find().lean());\n});\n```",
          options: [
            "Every request opens a new connection with its own pool and never closes it, so connections pile up until the cluster's limit is reached",
            "`lean()` keeps the connection open until the response object is garbage-collected",
            "Mongoose allows one connection per process, so the extra ones are rejected",
            "Atlas rejects connections that weren't opened with `mongoose.connect()`",
          ],
          correctIndex: 0,
          explanation:
            "A connection is a pool of sockets (up to `maxPoolSize`, 100 by default), meant to be created once and shared. Creating one per request multiplies sockets without bound. Connect at startup, register models once, and reuse them in handlers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-mongoose-q2",
          prompt:
            "A freshly deployed API logs `Operation posts.find() buffering timed out after 10000ms` on every request, while it works locally. What's the most likely cause?",
          options: [
            "The API never connected: typically the Atlas IP access list doesn't include the host's outbound IPs, or `MONGODB_URI` isn't set in production",
            "The `posts` collection has no index, so queries take longer than 10 seconds",
            "Mongoose buffers large result sets, and this one exceeded 10,000 documents",
            "The event loop is blocked by `JSON.stringify` on large responses",
          ],
          correctIndex: 0,
          explanation:
            "Buffering means a model was used before the connection was established; Mongoose waits `bufferTimeoutMS` (10 seconds by default) and then gives up. A slow query would show up as a slow response, not a buffering timeout.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-mongoose-q3",
          prompt:
            "A schema declares `email: { type: String, unique: true }`, yet the production collection contains duplicate emails. Which explanations are plausible? (Select all that apply.)",
          options: [
            "`unique` only asks Mongoose to build a unique index; it isn't a validator, so nothing stops duplicates when that index doesn't exist",
            "`autoIndex` is disabled in production and nobody created the index another way",
            "Duplicates already existed when the index build was attempted, so the build failed",
            "`unique` is enforced by `save()` only, and the duplicates came from `insertMany()`",
            "MongoDB doesn't enforce unique indexes on string fields",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Uniqueness is enforced by the database index, and once it exists it rejects every write path with an E11000 error, `insertMany` included. If the index was never built (autoIndex off, or the build failed on existing duplicates), nothing enforces it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-mongoose-q4",
          prompt:
            "What happens when this runs?\n\n```js\nconst productSchema = new Schema({ price: { type: Number, min: 0 } });\nconst Product = model(\"Product\", productSchema);\nawait Product.findByIdAndUpdate(id, { price: -5 });\n```",
          options: [
            "The update succeeds and stores `-5`, because update validators are off unless you pass `runValidators: true`",
            "It throws a `ValidationError` because `min: 0` is violated",
            "Mongoose clamps the value to `0`",
            "It fails because `findByIdAndUpdate` requires an explicit `$set`",
          ],
          correctIndex: 0,
          explanation:
            "Validators run on `save()`/`validate()`; query-based updates skip them unless `runValidators: true` is set (and even then with caveats around `this`). Mongoose does cast `-5` to a number and wraps the update in `$set` for you, but it doesn't validate the range.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-mongoose-q5",
          prompt:
            "The User schema hides secrets with `toJSON: { transform: (doc, ret) => { delete ret.passwordHash; return ret; } }`. For speed, someone changes `GET /api/users/:id` to `res.json(await User.findById(id).lean())`. What changes?",
          options: [
            "`passwordHash` now appears in the response: lean results are plain objects, so the document `toJSON` transform never runs",
            "Nothing: `res.json()` always applies schema transforms",
            "Virtuals disappear but `passwordHash` is still removed",
            "`lean()` throws because the schema defines a transform",
          ],
          correctIndex: 0,
          explanation:
            "Transforms, getters and virtuals are document features, and `lean()` skips hydrating documents. Marking the path `select: false` excludes it at the query level, so it stays hidden with or without `lean()` unless a query explicitly selects it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-mongoose-q6",
          prompt:
            "`POST /api/users` runs `await User.create(req.body)`. The schema has `name`, `email` and `role` (default `\"user\"`). Which statements are true? (Select all that apply.)",
          options: [
            "A client can send `role: \"admin\"` and it will be saved",
            "Keys that aren't in the schema, like `isVerified`, are dropped by Mongoose's default strict mode, but that doesn't protect `role`",
            "Validating the body and picking allowed fields at the API edge (for example with zod) prevents this mass assignment",
            "Declaring `role: { type: String, immutable: true }` stops a client from setting it on create",
            "Strict mode rejects the whole document when a sensitive field like `role` is present",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Strict mode only filters paths the schema doesn't know about; `role` is a real path, so the client's value wins over the default. `immutable` blocks changes after creation, not the initial value, so the fix is an explicit allow-list at the edge.",
        },
        {
          id: "mern-mongoose-q7",
          prompt: "How many queries does `await Post.find().limit(20).populate(\"author\").populate(\"comments\")` send to MongoDB?",
          options: [
            "3: one for the posts, then one `$in` query per populated path",
            "41: one query per post for each populated path",
            "1: `populate` compiles to a `$lookup` stage",
            "21: one for the posts and one per post",
          ],
          correctIndex: 0,
          explanation:
            "Mongoose collects the referenced IDs from all 20 posts and issues one query per path. It's still an application-side join (no `$lookup`), so it costs extra round trips but not N+1.",
        },
        {
          id: "mern-mongoose-q8",
          prompt:
            "The feed runs `Post.find({ author: userId }).sort({ createdAt: -1 }).limit(20)` and slows down as the collection reaches millions of posts. Which index serves it best?",
          options: [
            "`{ author: 1, createdAt: -1 }`",
            "`{ createdAt: -1, author: 1 }`",
            "Two single-field indexes, one on `author` and one on `createdAt`",
            "A text index on `author`",
          ],
          correctIndex: 0,
          explanation:
            "Equality fields first, then the sort field: the index jumps to one author's entries, which are already ordered by `createdAt`, so the first 20 come straight off the index with no in-memory sort. Leading with `createdAt` means walking every post in date order to find that author's.",
        },
        {
          id: "mern-mongoose-q9",
          prompt:
            "After upgrading to Mongoose 9, what's wrong with this hook?\n\n```js\nuserSchema.pre(\"save\", function (next) {\n  if (this.isModified(\"password\")) this.password = bcrypt.hashSync(this.password, 12);\n  next();\n});\n```",
          options: [
            "Pre middleware no longer receives `next`; write it as an `async function` (or return a promise) instead",
            "Mongoose 9 runs pre hooks after the document is saved",
            "`isModified` was removed in Mongoose 9",
            "Pre hooks must be arrow functions in Mongoose 9",
          ],
          correctIndex: 0,
          explanation:
            "Mongoose 9 dropped the `next()` callback for pre middleware, so this hook has to become async or promise-returning. Arrow functions would actually break it, because the hook needs `this` to be the document.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-mongoose-q10",
          prompt:
            "An order endpoint uses `session.withTransaction()` to decrement stock and create the order atomically. It works against Atlas but fails against a developer's plain local `mongod`. Why?",
          options: [
            "Multi-document transactions need a replica set or sharded cluster; a standalone `mongod` doesn't support them",
            "Transactions require MongoDB Enterprise",
            "Local servers disable transactions unless started with `--transactions`",
            "Mongoose only implements transactions for Atlas",
          ],
          correctIndex: 0,
          explanation:
            "Atlas clusters are always replica sets. Locally, run a single-node replica set (`mongod --replSet rs0` plus `rs.initiate()`, or a Docker image configured that way) so development matches production.",
        },
        {
          id: "mern-mongoose-q11",
          prompt:
            "An admin table pages with `.sort({ _id: 1 }).skip((page - 1) * 50).limit(50)`. Page 1 is instant; page 20,000 takes seconds. Why, and what's the usual fix?",
          options: [
            "`skip` still walks past every skipped index entry; paginate by range instead (`{ _id: { $gt: lastSeenId } }` with the same sort)",
            "`limit` stops the index from being used; drop it and slice the array in Node",
            "MongoDB caches only early pages, so deep pages need a warm-up",
            "Sorting by `_id` forces a collection scan; sort by `createdAt` instead",
          ],
          correctIndex: 0,
          explanation:
            "Skip cost grows linearly with the offset because the server has to step over those entries. Keyset (cursor) pagination seeks straight to the last seen key, so every page costs the same. `_id` is indexed by default, so the sort itself is fine.",
        },
      ],
    },
    {
      id: "mern-jwt-auth",
      moduleId: "fs-mern",
      trackId: "fullstack",
      title: "JWT Auth End-to-End",
      summary:
        "JWT auth in a MERN app is really two credentials with different jobs. The **access token** is short-lived (minutes), sent on every API call, and verified statelessly by Express: signature, an allow-listed `alg`, `exp`, `iss` and `aud`. The **refresh token** is long-lived, sent only to the refresh endpoint, and must be revocable, so the server stores it (or its hash) and rotates it on every use; a refresh token presented twice is a theft signal that should revoke the whole token family. Logout deletes the server-side refresh record and clears the cookie. Access tokens can't be recalled, which is exactly why they're short.\n\nWhere the browser keeps them is the central tradeoff. `localStorage` is readable by any script, so one XSS bug or compromised dependency exfiltrates tokens that keep working from the attacker's machine. An `HttpOnly; Secure` cookie can't be read by JavaScript, but the browser attaches it automatically, which reintroduces CSRF: `SameSite=Lax` or `Strict` blocks most of it, while a cross-site deployment that needs `SameSite=None` also needs an explicit defence (a token the attacker can't read, plus an `Origin` check). A common split keeps the access token in memory and the refresh token in an `HttpOnly` cookie scoped to the refresh path.\n\nThe client has its own concurrency bug. When the access token expires, every in-flight request gets a `401` at once, and a naive interceptor fires one refresh per request; with rotation, the second refresh presents the token the first just consumed, reuse detection fires, and the user is logged out. The fix is single-flight: one refresh, everyone else waits and retries once, a late `401` for an already-replaced token retries instead of refreshing, and only a definitive refresh failure, not a network blip, logs out.",
      level: "expert",
      estMinutes: 110,
      webRefs: [
        { label: "RFC 8725: JSON Web Token Best Current Practices", url: "https://datatracker.ietf.org/doc/html/rfc8725", kind: "spec" },
        { label: "OWASP: JSON Web Token Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html", kind: "article" },
        { label: "Auth0: Refresh Token Rotation", url: "https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation", kind: "docs" },
        { label: "OWASP: Cross-Site Request Forgery Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "React Login Authentication with JWT Access, Refresh Tokens, Cookies and Axios",
        channel: "Dave Gray",
        url: "https://www.youtube.com/watch?v=nI8PYZNFtac",
        videoId: "nI8PYZNFtac",
        durationLabel: "41:00",
      },
      alternateVideos: [
        {
          title: "Refresh Token Rotation and Reuse Detection in Node.js JWT Authentication",
          channel: "Dave Gray",
          url: "https://www.youtube.com/watch?v=s-4k5TcGKHg",
          videoId: "s-4k5TcGKHg",
          durationLabel: "35:07",
        },
        {
          title: "Authentication in React with JWTs, Access & Refresh Tokens (Complete Tutorial)",
          channel: "Cosden Solutions",
          url: "https://www.youtube.com/watch?v=AcYF18oGn6Y",
          videoId: "AcYF18oGn6Y",
          durationLabel: "23:45",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createAuthClient({ callApi, refreshToken, initialToken, onLogout })`, the layer of a React app's API client that deals with expired access tokens. It returns `{ request(path), getToken() }`.\n\n- `request(path)` calls `callApi(path, token)` with the current access token and resolves with the response (`{ status, body }`) unless the status is `401`. Every other status passes through untouched, `403` included: the user is authenticated but not allowed, and a refresh won't change that.\n- On a `401`, if the token used for that call is still the current one, refresh: call `refreshToken()`, or join the refresh already in flight. At most one refresh may be in flight. When it succeeds (`{ status: 200, accessToken }`), store the new token and retry the original request once with it.\n- If the token changed while the call was in flight (another request already refreshed), don't refresh again: just retry once with the current token. With rotating refresh tokens, a second refresh would present an already-used token and get the whole session revoked.\n- If `request` is called while a refresh is in flight, wait for it and make the first call with the new token.\n- A request makes at most two API calls. A `401` on the retry is resolved as is.\n- If the refresh resolves with any other status, the session is over: set the token to `null`, call `onLogout()` exactly once, and resolve every request waiting on that refresh with `{ status: 401, error: \"session_expired\" }`. After logout, `request()` resolves `{ status: 401, error: \"logged_out\" }` without calling the API, and so does any request whose `401` arrives after the logout.\n- If `refreshToken()` rejects (a network failure), don't log out: keep the current token, resolve the waiting requests with `{ status: 0, error: \"network\" }`, and let a later `401` start a fresh refresh.\n- `getToken()` returns the current access token.\n\nThe tests call `runAuthScenario`, which replays timed requests against a scripted fake API on a fake clock. It reports every API and refresh call in order (`\"<ms> <path> <token>\"` or `\"<ms> refresh\"`), the results in request order, how many refreshes and logouts happened, and the final token. Leave the driver as it is.",
        starterCode: `/**
 * The token-refresh layer of a React app's API client.
 *
 * @param {{
 *   callApi: (path: string, token: string | null) => Promise<{ status: number, body: unknown }>,
 *   refreshToken: () => Promise<{ status: number, accessToken?: string }>,
 *   initialToken: string | null,
 *   onLogout: () => void,
 * }} deps
 * @returns {{ request: (path: string) => Promise<object>, getToken: () => string | null }}
 */
function createAuthClient({ callApi, refreshToken, initialToken, onLogout }) {
  let token = initialToken;

  async function request(path) {
    // Your code here. This naive version never refreshes.
    return callApi(path, token);
  }

  return { request, getToken: () => token };
}

// ---- Test driver (leave as is) ----
// Replays timed requests against a scripted fake API on a fake clock.
// script: {
//   initialToken, serverToken,           // the token the client starts with / the one the API accepts
//   refreshOutcomes: [...],              // per refresh call: "tok" (issued and accepted), "!tok" (issued but
//                                        // rejected by the API), "NETWORK" (request fails), null (refresh token expired)
//   latency: { [path]: ms },             // API latency per path (default 10 ms); refreshLatency default 20 ms
//   requests: [[atMs, path], ...]
// }
// Paths starting with /admin answer 403 even with a valid token.
async function runAuthScenario(script) {
  const clock = createFakeClock();
  const calls = [];
  let refreshes = 0;
  let logouts = 0;
  let serverToken = script.serverToken ?? null;
  const outcomes = [...(script.refreshOutcomes ?? [])];
  const latency = script.latency ?? {};
  const callApi = (path, token) => {
    calls.push(clock.now() + " " + path + " " + token);
    const valid = token !== null && token === serverToken;
    const res = !valid ? { status: 401, body: null } : path.startsWith("/admin") ? { status: 403, body: null } : { status: 200, body: path + ":ok" };
    return new Promise((resolve) => clock.setTimeout(() => resolve(res), latency[path] ?? 10));
  };
  const refreshToken = () => {
    refreshes++;
    calls.push(clock.now() + " refresh");
    return new Promise((resolve, reject) =>
      clock.setTimeout(() => {
        const next = outcomes.length ? outcomes.shift() : null;
        if (next === "NETWORK") return reject(new TypeError("Failed to fetch"));
        if (typeof next !== "string") return resolve({ status: 401 });
        const accepted = !next.startsWith("!");
        const issued = accepted ? next : next.slice(1);
        if (accepted) serverToken = issued;
        resolve({ status: 200, accessToken: issued });
      }, script.refreshLatency ?? 20),
    );
  };
  const client = createAuthClient({ callApi, refreshToken, initialToken: script.initialToken ?? null, onLogout: () => { logouts++; } });
  const results = script.requests.map(() => null);
  script.requests.forEach(([at, path], i) =>
    clock.at(at, () => {
      Promise.resolve(client.request(path)).then(
        (res) => { results[i] = res; },
        (err) => { results[i] = { threw: String((err && err.message) || err) }; },
      );
    }),
  );
  await clock.runAll();
  return { results, calls, refreshes, logouts, token: client.getToken() };
}

function createFakeClock() {
  let now = 0, nextId = 1, seq = 0, queue = [];
  const schedule = (time, cb) => {
    const id = nextId++;
    queue.push({ id, time, seq: seq++, cb });
    return id;
  };
  const flush = async () => {
    for (let i = 0; i < 200; i++) await Promise.resolve();
  };
  return {
    now: () => now,
    setTimeout: (cb, ms = 0) => schedule(now + Math.max(0, ms), cb),
    at: (time, cb) => schedule(time, cb),
    async runAll() {
      await flush();
      for (let step = 0; step < 100000; step++) {
        queue.sort((a, b) => a.time - b.time || a.seq - b.seq);
        const next = queue.shift();
        if (!next) break;
        now = next.time;
        next.cb();
        await flush();
      }
    },
  };
}
`,
        functionName: "runAuthScenario",
        testCases: [
          {
            description: "a valid token: one call, no refresh",
            args: [{ initialToken: "A", serverToken: "A", requests: [[0, "/me"]] }],
            expected: { results: [{ status: 200, body: "/me:ok" }], calls: ["0 /me A"], refreshes: 0, logouts: 0, token: "A" },
          },
          {
            description: "an expired token: 401, one refresh, one retry with the new token",
            args: [{ initialToken: "old", serverToken: null, refreshOutcomes: ["new1"], requests: [[0, "/me"]] }],
            expected: {
              results: [{ status: 200, body: "/me:ok" }],
              calls: ["0 /me old", "10 refresh", "30 /me new1"],
              refreshes: 1,
              logouts: 0,
              token: "new1",
            },
          },
          {
            description: "three concurrent 401s share a single refresh, and each request retries once",
            args: [{ initialToken: "old", serverToken: null, refreshOutcomes: ["new1"], requests: [[0, "/me"], [0, "/orders"], [0, "/cart"]] }],
            expected: {
              results: [
                { status: 200, body: "/me:ok" },
                { status: 200, body: "/orders:ok" },
                { status: 200, body: "/cart:ok" },
              ],
              calls: ["0 /me old", "0 /orders old", "0 /cart old", "10 refresh", "30 /me new1", "30 /orders new1", "30 /cart new1"],
              refreshes: 1,
              logouts: 0,
              token: "new1",
            },
          },
          {
            description: "a request made while a refresh is in flight waits and makes its first call with the new token",
            args: [{ initialToken: "old", serverToken: null, refreshOutcomes: ["new1"], requests: [[0, "/me"], [15, "/cart"]] }],
            expected: {
              results: [
                { status: 200, body: "/me:ok" },
                { status: 200, body: "/cart:ok" },
              ],
              calls: ["0 /me old", "10 refresh", "30 /me new1", "30 /cart new1"],
              refreshes: 1,
              logouts: 0,
              token: "new1",
            },
          },
          {
            description: "a slow request whose 401 arrives after the refresh finished retries with the new token instead of refreshing again",
            args: [{ initialToken: "old", serverToken: null, refreshOutcomes: ["new1"], latency: { "/slow": 50 }, requests: [[0, "/me"], [0, "/slow"]] }],
            expected: {
              results: [
                { status: 200, body: "/me:ok" },
                { status: 200, body: "/slow:ok" },
              ],
              calls: ["0 /me old", "0 /slow old", "10 refresh", "30 /me new1", "50 /slow new1"],
              refreshes: 1,
              logouts: 0,
              token: "new1",
            },
            isEdgeCase: true,
          },
          {
            description: "a failed refresh logs out once: waiting requests get session_expired and later ones never reach the API",
            args: [{ initialToken: "old", serverToken: null, refreshOutcomes: [null], requests: [[0, "/me"], [0, "/orders"], [40, "/cart"]] }],
            expected: {
              results: [
                { status: 401, error: "session_expired" },
                { status: 401, error: "session_expired" },
                { status: 401, error: "logged_out" },
              ],
              calls: ["0 /me old", "0 /orders old", "10 refresh"],
              refreshes: 1,
              logouts: 1,
              token: null,
            },
            isEdgeCase: true,
          },
          {
            description: "a network error during refresh doesn't log out, and a later 401 starts a fresh refresh",
            args: [{ initialToken: "old", serverToken: null, refreshOutcomes: ["NETWORK", "new1"], requests: [[0, "/me"], [100, "/me"]] }],
            expected: {
              results: [
                { status: 0, error: "network" },
                { status: 200, body: "/me:ok" },
              ],
              calls: ["0 /me old", "10 refresh", "100 /me old", "110 refresh", "130 /me new1"],
              refreshes: 2,
              logouts: 0,
              token: "new1",
            },
            isEdgeCase: true,
          },
          {
            description: "a 403 is passed through without refreshing",
            args: [{ initialToken: "A", serverToken: "A", requests: [[0, "/admin/users"]] }],
            expected: { results: [{ status: 403, body: null }], calls: ["0 /admin/users A"], refreshes: 0, logouts: 0, token: "A" },
            isEdgeCase: true,
          },
          {
            description: "a retry that gets 401 again is returned as is: no loop and no second refresh",
            args: [{ initialToken: "old", serverToken: null, refreshOutcomes: ["!new1"], requests: [[0, "/me"]] }],
            expected: {
              results: [{ status: 401, body: null }],
              calls: ["0 /me old", "10 refresh", "30 /me new1"],
              refreshes: 1,
              logouts: 0,
              token: "new1",
            },
            isEdgeCase: true,
          },
          {
            description: "a 401 that arrives after logout doesn't start another refresh",
            args: [{ initialToken: "old", serverToken: null, refreshOutcomes: [null], latency: { "/slow": 50 }, requests: [[0, "/me"], [0, "/slow"]] }],
            expected: {
              results: [
                { status: 401, error: "session_expired" },
                { status: 401, error: "logged_out" },
              ],
              calls: ["0 /me old", "0 /slow old", "10 refresh"],
              refreshes: 1,
              logouts: 1,
              token: null,
            },
            isEdgeCase: true,
          },
          {
            description: "100 concurrent requests with an expired token trigger exactly one refresh",
            args: [
              {
                initialToken: "old",
                serverToken: null,
                refreshOutcomes: ["new1"],
                requests: Array.from({ length: 100 }, (_, i) => [0, "/items/" + i]),
              },
            ],
            expected: {
              results: Array.from({ length: 100 }, (_, i) => ({ status: 200, body: "/items/" + i + ":ok" })),
              calls: [
                ...Array.from({ length: 100 }, (_, i) => "0 /items/" + i + " old"),
                "10 refresh",
                ...Array.from({ length: 100 }, (_, i) => "30 /items/" + i + " new1"),
              ],
              refreshes: 1,
              logouts: 0,
              token: "new1",
            },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "mern-deploy",
      moduleId: "fs-mern",
      trackId: "fullstack",
      title: "Deploying a MERN App",
      summary:
        "A deployed MERN app usually spans three hosts: static React assets on a CDN (Vercel, Netlify, Cloudflare Pages), the Express API on a Node host (Render, Railway, Fly.io, a container), and MongoDB Atlas. Each seam fails in ways localhost never shows. Atlas only accepts connections from its IP access list, and most platforms egress from dynamic or shared IP ranges, so teams reach for `0.0.0.0/0`; that works, but leaves the database guarded only by credentials and TLS. Static egress IPs, the host's published ranges, or private endpoints and peering are the grown-up options. Secrets live in the API host's environment, differ per environment, and never go near a `VITE_` variable.\n\nDomains decide whether auth works. Sibling subdomains of a domain you own (`app.example.com`, `api.example.com`) are same-site, so `SameSite=Lax` cookies plus a strict CORS allow-list are enough. Split across `*.vercel.app` and `*.onrender.com` and every call is cross-site: cookies need `SameSite=None; Secure`, you need CSRF protection again, and Safari blocks the cookie anyway. Rewriting `/api/*` through the frontend host, or serving the SPA from Express, removes the whole class of problems. Behind a TLS-terminating proxy, Express needs `trust proxy`, or `req.secure` is false and `express-session` won't send a `Secure` cookie.\n\nOperationally, keep liveness checks cheap and put dependency checks in readiness, drain connections on `SIGTERM` before exiting, add an SPA fallback so deep links don't 404, and cache hashed assets forever but `index.html` never. Free tiers bring their own surprises: Render's free web services spin down after 15 minutes without traffic, take about a minute to wake, and have an ephemeral filesystem, so uploads belong in object storage.",
      level: "expert",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "MongoDB Atlas: Configure IP Access List Entries", url: "https://www.mongodb.com/docs/atlas/security/ip-access-list/", kind: "docs" },
        { label: "web.dev: SameSite cookies explained", url: "https://web.dev/articles/samesite-cookies-explained", kind: "article" },
        { label: "Express: Health Checks and Graceful Shutdown", url: "https://expressjs.com/en/advanced/healthcheck-graceful-shutdown/", kind: "docs" },
        { label: "Express: Express behind proxies", url: "https://expressjs.com/en/guide/behind-proxies/", kind: "docs" },
      ],
      video: {
        title: "MERN Stack Tutorial for Beginners with Deployment – 2025",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=F9gB5b4jgOI",
        videoId: "F9gB5b4jgOI",
        durationLabel: "3:34:54",
        startSeconds: 11486,
        chapterLabel: "12- Super Detailed Deployment",
      },
      alternateVideos: [
        {
          title: "MERN Stack Tutorial with Deployment – Beginner's Course",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=O3BUHwfHf84",
          videoId: "O3BUHwfHf84",
          durationLabel: "2:16:25",
          startSeconds: 7230,
          chapterLabel: "Detailed Deployment",
        },
        {
          title: "SameSite Cookie Attribute Explained by Example (Strict, Lax, None & No SameSite)",
          channel: "Hussein Nasser",
          url: "https://www.youtube.com/watch?v=aUF2QCEudPo",
          videoId: "aUF2QCEudPo",
          durationLabel: "13:56",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mern-deploy-q1",
          prompt:
            "The API on a PaaS can't reach Atlas: connections time out. The platform's outbound IPs aren't fixed. Which options actually fix it? (Select all that apply.)",
          options: [
            "Add the platform's published outbound IP ranges, or a static egress IP add-on, to the Atlas IP access list",
            "Connect over a private endpoint or VPC peering, where both the platform and your Atlas tier support it",
            "Allow `0.0.0.0/0` and rely on strong database credentials and TLS, accepting the wider exposure",
            "Raise `serverSelectionTimeoutMS` to 120000 so the driver waits longer",
            "Switch the connection string from `mongodb+srv://` to `mongodb://`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Atlas only accepts connections from entries in the project's access list (or private networking), so the fix is to make the host's traffic match one. Waiting longer or changing the URI scheme doesn't change where the traffic comes from.",
        },
        {
          id: "mern-deploy-q2",
          prompt:
            "The SPA runs on `https://shop-web.vercel.app` and the API on `https://shop-api.onrender.com`. Login responds with `Set-Cookie: sid=...; HttpOnly; Secure; SameSite=Lax`, the client uses `credentials: \"include\"`, and CORS allows the SPA's origin with credentials. The next call to `/api/me` returns `401`. Why?",
          options: [
            "The two hosts are different sites, and a `SameSite=Lax` cookie isn't sent on a cross-site `fetch`",
            "CORS drops cookies unless the server sends `Access-Control-Expose-Headers: Set-Cookie`",
            "`HttpOnly` cookies can't be sent by `fetch`",
            "Render requires cookies to carry `Domain=onrender.com`",
          ],
          correctIndex: 0,
          explanation:
            "`Lax` only allows cross-site cookies on top-level GET navigations, never on `fetch`. `Set-Cookie` is never readable by page scripts, and `Domain=onrender.com` would be rejected because `onrender.com` is a public suffix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-deploy-q3",
          prompt:
            "You deploy the frontend as `acme-web.vercel.app` and the API as `acme-api.vercel.app`, reasoning that sharing `vercel.app` makes them same-site. Is that right?",
          options: [
            "No: `vercel.app` is on the Public Suffix List, so each project's subdomain is its own site, as if they were unrelated domains",
            "Yes: any two hosts ending in the same two labels are same-site",
            "Yes, as long as both projects belong to the same Vercel team",
            "No, because a site also includes the port and path",
          ],
          correctIndex: 0,
          explanation:
            "A site is the scheme plus the registrable domain, which is one label below the longest matching public suffix. Hosting platforms put their shared domains on the list precisely so customers can't share or read each other's cookies. Ports and paths don't factor into sites.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-deploy-q4",
          prompt:
            "You must keep the frontend and API on different sites and use a `SameSite=None; Secure` session cookie. What do you need to add? (Select all that apply.)",
          options: [
            "CSRF protection, such as a token sent in a custom header plus an `Origin` check on state-changing requests",
            "An exact CORS origin allow-list with `credentials: true`, never a reflected or wildcard origin",
            "A plan for browsers that block third-party cookies, such as Safari, like moving to a shared parent domain or proxying `/api` through the frontend host",
            "`Access-Control-Allow-Origin: *` so that every browser accepts the cookie",
            "A copy of the session ID in `localStorage` as a fallback",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`SameSite=None` means any site can make the browser send your cookie, so CSRF defences are back on you, and a sloppy CORS config would let those sites read responses too. A wildcard origin can't be combined with credentials at all, and copying the session ID into `localStorage` reopens it to XSS.",
        },
        {
          id: "mern-deploy-q5",
          prompt:
            "What's the security problem with this CORS configuration?\n\n```js\napp.use(cors({ origin: /example\\.com$/, credentials: true }));\n```",
          options: [
            "The pattern also matches origins like `https://evil-example.com`, and with credentials those pages can read authenticated responses",
            "The `cors` package doesn't accept regular expressions for `origin`",
            "It rejects `https://www.example.com` because of the `www`",
            "Credentials can't be combined with a regex origin, so every request fails",
          ],
          correctIndex: 0,
          explanation:
            "The `cors` package reflects any request origin that matches the pattern, and this one only checks the ending. Anchor it to a scheme and a dot boundary, or better, list the exact origins you serve.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-deploy-q6",
          prompt:
            "On Render, the Express API uses `express-session` with `cookie: { secure: true }`. The site is served over HTTPS, yet browsers never receive the session cookie. What's missing?",
          options: [
            "`app.set(\"trust proxy\", 1)`: TLS ends at Render's proxy, so Express sees plain HTTP and `express-session` refuses to set a `Secure` cookie",
            "`sameSite: \"none\"`, which `Secure` cookies require",
            "A `domain` attribute matching the Render hostname",
            "`exposedHeaders: [\"Set-Cookie\"]` in the CORS options",
          ],
          correctIndex: 0,
          explanation:
            "Without `trust proxy`, Express ignores `X-Forwarded-Proto`, so `req.secure` is false. The same setting fixes `req.ip`, which otherwise shows the proxy's address to every rate limiter. `Secure` doesn't require `SameSite=None`; it's the other way round.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-deploy-q7",
          prompt:
            "The React Router app works when you click through it, but reloading `https://app.example.com/orders/42` on the static host returns a 404. What's the fix?",
          options: [
            "A rewrite that serves `index.html` for unknown paths (an SPA fallback), while real asset URLs still 404 when missing",
            "Switching to hash-based URLs is the only option",
            "Adding a `<base href>` tag to `index.html`",
            "Serving `index.html` with `Cache-Control: no-store`",
          ],
          correctIndex: 0,
          explanation:
            "The static host looks for a file at `/orders/42`, finds none, and 404s before React Router ever loads. Hash URLs are a workaround, not the only one, and neither `<base href>` nor cache headers change which file is served.",
        },
        {
          id: "mern-deploy-q8",
          prompt:
            "After upgrading the API to Express 5, this SPA fallback throws at startup. Why, and what replaces it?\n\n```js\napp.use(express.static(path.join(__dirname, \"../frontend/dist\")));\napp.get(\"*\", (req, res) => {\n  res.sendFile(path.join(__dirname, \"../frontend/dist/index.html\"));\n});\n```",
          options: [
            "Express 5's path matching requires named wildcards: use `/*splat`, or `/{*splat}` to match `/` as well",
            "`res.sendFile` was removed in Express 5; use `res.sendfile`",
            "`express.static` must be registered after the catch-all in Express 5",
            "Express 5 no longer supports `GET` routes on the root path",
          ],
          correctIndex: 0,
          explanation:
            "Express 5 uses path-to-regexp v8, where a bare `*` is a syntax error. It's the lowercase `res.sendfile()` that was removed, and static files must still come before the catch-all so real assets aren't answered with `index.html`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mern-deploy-q9",
          prompt:
            "After a deploy, some users hit `Failed to fetch dynamically imported module` when they navigate. The build emits content-hashed chunk files. What's the likely cause?",
          options: [
            "Their cached `index.html`, or a tab left open, references chunk hashes from the previous build that the new deploy removed",
            "Content-hashed filenames break HTTP caching",
            "The CDN compressed the JavaScript twice",
            "React Router can't lazy-load routes in production builds",
          ],
          correctIndex: 0,
          explanation:
            "Hashed assets are safe to cache forever precisely because each build gets new names, so the HTML that points at them must be revalidated on every load. Keep the previous build's chunks around for a while and reload once when a chunk fails to load.",
        },
        {
          id: "mern-deploy-q10",
          prompt:
            "The platform restarts the API whenever `/healthz` fails, and `/healthz` pings MongoDB. During a five-minute Atlas incident, what happens, and what's better?",
          options: [
            "Every instance fails its check and gets restarted in a loop, which can't fix the database; keep liveness cheap (the process is up) and report dependencies through a separate readiness signal",
            "Nothing: platforms ignore health checks during database incidents",
            "The restarts re-resolve Atlas's DNS records, which ends the outage",
            "It's correct: an API that can't reach its database should always be restarted",
          ],
          correctIndex: 0,
          explanation:
            "Liveness answers \"should this process be killed?\"; readiness answers \"should it get traffic right now?\". Tying liveness to a shared dependency turns a database blip into a restart storm that also drops in-flight requests.",
        },
        {
          id: "mern-deploy-q11",
          prompt:
            "During every deploy, a few in-flight checkout requests fail with connection resets. The platform sends `SIGTERM`, then waits 30 seconds before killing the old instance. What should the API do?",
          options: [
            "On `SIGTERM`, stop accepting new connections with `server.close()`, let in-flight requests finish, then close the MongoDB connection and exit",
            "Ignore `SIGTERM` so the old instance keeps serving until it's killed",
            "Call `process.exit(0)` immediately so the new instance takes over sooner",
            "Disable HTTP keep-alive on the platform's load balancer",
          ],
          correctIndex: 0,
          explanation:
            "Graceful shutdown uses the grace period the platform already gives you. Exiting immediately is what causes the resets, and ignoring the signal just ends in a hard kill mid-request.",
        },
        {
          id: "mern-deploy-q12",
          prompt:
            "A demo MERN app on Render's free tier saves uploaded avatars to `./uploads`. Users say the first request after lunch takes about a minute and that avatars randomly disappear. Which statements explain this or fix it? (Select all that apply.)",
          options: [
            "Free web services spin down after 15 minutes without traffic and take about a minute to spin back up",
            "The filesystem is ephemeral, so files written locally vanish on redeploys, restarts and spin-downs",
            "Avatars should go to object storage (S3, R2, Cloudinary) with only the URL stored in MongoDB",
            "Atlas deletes documents that reference local file paths",
            "`express.static` evicts files older than an hour",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Render documents both behaviours for free web services. Any instance-local disk should be treated as scratch space, because the next deploy or restart starts from a clean image.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
  ],
} satisfies Module;
