import type { Module } from "@/types/curriculum";

// Test fixtures for the service-worker strategy challenge.
const SERVER = {
  "/": { status: 200, body: "<home v1>" },
  "/about": { status: 200, body: "<about v1>" },
  "/assets/app.3f9a1c.js": { status: 200, body: "app bundle" },
  "/api/feed": { status: 200, body: "[feed v1]" },
  "/img/avatar.png": { status: 200, body: "avatar v1" },
  "/manifest.webmanifest": { status: 200, body: "{manifest v1}" },
  "https://fonts.gstatic.com/s/inter/v13/inter.woff2": { status: 200, body: "font" },
  "https://cdn.example.com/widget.js": { status: 200, body: "widget" },
};

const PRECACHE = { "/offline.html": "<offline page>" };

export default {
  id: "fe-meta-mobile",
  trackId: "frontend",
  name: "Meta-Frameworks, Mobile & Bonus",
  description:
    "Three ways to take React-era skills beyond the classic SPA: Astro's islands architecture for content-heavy sites that ship almost no JavaScript, React Native with the New Architecture and Expo for real native apps, and Progressive Web Apps for installable, offline-capable web apps. Each topic is about the architectural tradeoff first, and the API second.",
  refs: [
    { label: "Astro: Islands architecture", url: "https://docs.astro.build/en/concepts/islands/", kind: "docs" },
    { label: "React Native: Get Started", url: "https://reactnative.dev/docs/environment-setup", kind: "docs" },
    { label: "web.dev: Learn PWA", url: "https://web.dev/learn/pwa", kind: "docs" },
  ],
  topics: [
    {
      id: "bonus-astro-islands",
      moduleId: "fe-meta-mobile",
      trackId: "frontend",
      title: "Astro & the Islands Architecture",
      summary:
        "Astro is built for content-driven sites (marketing pages, docs, blogs, storefronts) where most of the page is static and only a few widgets need JavaScript. It renders every component to HTML at build or request time and, by default, ships no client-side JavaScript for it, even for React, Vue or Svelte components. A `client:*` directive opts a component into hydration and makes it an island: an independently hydrated widget in a sea of static HTML (Katie Sylor-Miller coined the term; Jason Miller popularized the pattern in 2020).\n\nEach directive is a loading-priority decision: `client:load` hydrates immediately, `client:idle` when the main thread is idle, `client:visible` when the island scrolls into view, `client:media` when a media query matches, and `client:only` skips server rendering and renders only in the browser. Islands load in parallel and hydrate in isolation, so a heavy carousel below the fold doesn't delay the header, and a framework's runtime is sent once per page however many islands use it. Server islands (`server:defer`) apply the same idea on the server: a personalized fragment such as an avatar renders separately, so the rest of the page can stay static and cacheable.\n\nThe tradeoffs follow from isolation. Islands don't share a React tree, so React context can't span them; share state through a small framework-agnostic store (Astro's docs use Nano Stores). Props passed to hydrated islands must be serializable (objects, arrays, `Date`, `Map`, `Set`, `URL` and so on, but no functions), and a component rendered without a directive is plain HTML whose event handlers silently do nothing. When most of the screen is interactive and stateful, an SPA or React framework fits better; for content-heavy sites, islands usually win on JavaScript shipped, LCP and INP. The Astro team joined Cloudflare in January 2026, and the framework remains open source.",
      level: "advanced",
      estMinutes: 100,
      webRefs: [
        { label: "Astro: Islands architecture", url: "https://docs.astro.build/en/concepts/islands/", kind: "docs" },
        { label: "Astro: Template directives reference", url: "https://docs.astro.build/en/reference/directives-reference/", kind: "docs" },
        { label: "Jason Miller: Islands Architecture", url: "https://jasonformat.com/islands-architecture/", kind: "article" },
        { label: "patterns.dev: Islands Architecture", url: "https://www.patterns.dev/vanilla/islands-architecture/", kind: "article" },
      ],
      video: {
        title: "Astro Web Framework Crash Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=e-hTm5VmofI",
        videoId: "e-hTm5VmofI",
        durationLabel: "1:16:48",
      },
      alternateVideos: [
        {
          title: "Islands Architecture, Astro, and You | Nate Moore | ViteConf 2022",
          channel: "ViteConf",
          url: "https://www.youtube.com/watch?v=SICd8tTEqvs",
          videoId: "SICd8tTEqvs",
          durationLabel: "22:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bonus-astro-islands-q1",
          prompt:
            "A React `<LikeButton />` with an `onClick` handler is rendered in an `.astro` page as `<LikeButton />`. The button appears, but clicking it does nothing and there are no console errors. Why?",
          options: [
            "Without a `client:*` directive the component is rendered to static HTML and none of its JavaScript is sent",
            "Astro strips `onClick` props for security unless they're whitelisted",
            "React components need `client:only` to render at all in Astro",
            "The page must set `export const prerender = false` for events to work",
          ],
          correctIndex: 0,
          explanation:
            "Astro's default is zero client JavaScript: framework components render to HTML only. Adding `client:load` (or another directive) turns it into a hydrated island.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bonus-astro-islands-q2",
          prompt: "A newsletter signup widget sits in the footer of long articles. Which directive fits best?",
          options: ["`client:visible`", "`client:load`", "`client:only=\"react\"`", "No directive"],
          correctIndex: 0,
          explanation:
            "`client:visible` defers the widget's JavaScript until it scrolls into view, so readers who never reach the footer never download it. `client:load` competes with above-the-fold work, and no directive leaves the form non-interactive.",
        },
        {
          id: "bonus-astro-islands-q3",
          prompt: "What does `client:only=\"react\"` change compared with `client:load`?",
          options: [
            "The component isn't server-rendered at all: nothing is in the HTML until its JavaScript runs in the browser",
            "It hydrates earlier, before the HTML finishes parsing",
            "It prevents the React runtime from being sent to the browser",
            "It renders on the server only and never hydrates",
          ],
          correctIndex: 0,
          explanation:
            "`client:only` is for components that can't render on the server (they touch `window` or `localStorage` during render). The cost is an empty slot until JS loads, which hurts LCP, can shift layout and hides the content from crawlers that don't run JS.",
        },
        {
          id: "bonus-astro-islands-q4",
          prompt: "Which props can you pass from an `.astro` page to a hydrated React island? (Select all that apply.)",
          options: [
            "A plain object of product data",
            "A `Date`",
            "A `Map` of SKU to price",
            "An `onSave` callback function",
            "An instance of a class with methods",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Island props are serialized into the HTML; Astro supports plain objects, arrays, numbers, strings, `Date`, `Map`, `Set`, `RegExp`, `URL`, `BigInt` and typed arrays. Functions and class behavior can't be serialized, so they only exist during server rendering.",
        },
        {
          id: "bonus-astro-islands-q5",
          prompt:
            "A cart badge island in the header and an \"Add to cart\" island in the product body are both React components. How should the badge learn about additions?",
          options: [
            "Through a shared framework-agnostic store (such as Nano Stores) that both islands import",
            "Wrap both islands in one React context provider in the Astro layout",
            "Pass a `setCount` callback from the layout to both islands",
            "It can't: islands are fully isolated and can never communicate",
          ],
          correctIndex: 0,
          explanation:
            "Each island is a separate React root, so a provider can't span them and callbacks can't be serialized as props. A module-level store (or custom DOM events) works across islands and even across frameworks.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bonus-astro-islands-q6",
          prompt: "A page shows the same product description to everyone plus a personalized \"Welcome back, Ada\" header. What do server islands (`server:defer`) let you do?",
          options: [
            "Serve the page as static, cacheable HTML while the personalized header renders separately on the server and is filled in afterwards",
            "Hydrate the header on the client without sending any JavaScript",
            "Render the whole page per request but cache the header at the CDN",
            "Move the header's rendering into a service worker",
          ],
          correctIndex: 0,
          explanation:
            "A server island moves slow or personalized server work out of the main render, so one dynamic fragment doesn't force the whole page to be rendered per request.",
        },
        {
          id: "bonus-astro-islands-q7",
          prompt: "A page contains three React islands and one Svelte island. How many times are the React and Svelte runtimes sent?",
          options: [
            "React once and Svelte once",
            "React three times and Svelte once",
            "Neither; Astro compiles framework runtimes away",
            "Once in total, because Astro bundles every framework into one runtime",
          ],
          correctIndex: 0,
          explanation:
            "Astro sends each framework's runtime once per page, shared by every island that uses it. Mixing frameworks is possible, but each additional one adds its runtime's weight.",
        },
        {
          id: "bonus-astro-islands-q8",
          prompt:
            "Compared with hydrating the entire page as an SPA, what does an islands architecture typically improve? (Select all that apply.)",
          options: [
            "Less JavaScript downloaded, parsed and executed",
            "Less main-thread hydration work, which helps INP and Total Blocking Time",
            "Content is present in the server HTML, which helps LCP and crawlers",
            "Automatic shared state between all interactive widgets",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Only the islands hydrate, and the rest arrives as ready HTML. Shared state is exactly what islands make harder, not easier.",
        },
        {
          id: "bonus-astro-islands-q9",
          prompt: "Where does the code in an `.astro` component's frontmatter (between the `---` fences) run?",
          options: [
            "On the server, at build time for static pages or per request for on-demand pages; never in the browser",
            "In the browser after the page loads",
            "Both on the server and again in the browser during hydration",
            "In a Web Worker so it doesn't block rendering",
          ],
          correctIndex: 0,
          explanation:
            "Frontmatter is server-only, so it can read files, secrets and databases. Browser code goes in `<script>` tags, which Astro processes and bundles, or in hydrated framework islands.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bonus-astro-islands-q10",
          prompt: "For which product is Astro's islands model the weakest fit?",
          options: [
            "A collaborative design editor where nearly the whole screen is interactive and shares state",
            "A documentation site with a search widget",
            "A marketing site with a pricing calculator",
            "A blog with a comments widget",
          ],
          correctIndex: 0,
          explanation:
            "When most of the UI is interactive and tightly coupled, you'd end up with one giant island, which is an SPA with extra steps. Islands shine when interactivity is the exception.",
        },
      ],
    },
    {
      id: "bonus-react-native",
      moduleId: "fe-meta-mobile",
      trackId: "frontend",
      title: "React Native Fundamentals: From Web React to Native Apps",
      summary:
        "React Native lets you write React components that render real platform views (`<View>` becomes a `UIView` on iOS and an `android.view.View` on Android, `<Text>` a native text view), not HTML inside a WebView. Your React knowledge transfers directly: components, props, state, hooks, context, TanStack Query, Zustand. The host environment is what changes. There's no DOM and no CSS cascade: styles are JavaScript objects, layout is Flexbox with `flexDirection: \"column\"` by default, raw text must be inside `<Text>` (and only nested `<Text>` inherits text styles), long lists must be virtualized with `FlatList` or FlashList, and navigation is a stack-and-tabs model (Expo Router or React Navigation).\n\nThe architecture underneath changed fundamentally. The legacy bridge serialized every JavaScript-to-native call into JSON messages on an asynchronous queue, which made layout measurement asynchronous and large data transfers slow. The New Architecture replaces it: JSI lets JavaScript hold references to C++ objects and call them directly without serialization, TurboModules are lazily loaded, type-safe native modules built on JSI (with Codegen from typed specs), and Fabric is the new renderer that supports React's concurrent features and synchronous layout reads, so `useLayoutEffect` can measure and position a tooltip without a visible jump. It became the default in 0.76 (October 2024); 0.82 was the first release that runs only on the New Architecture, and 0.84 made Hermes V1 the default engine while continuing to remove legacy code. Libraries that were never migrated don't work on current versions.\n\nThe React Native docs recommend starting new apps with a framework, and name Expo: `create-expo-app`, file-based routing with Expo Router, maintained native modules, config plugins instead of hand-editing Xcode and Gradle projects, development builds, and EAS for cloud builds, store submission and over-the-air updates. OTA updates can ship JavaScript and assets, but new native code or permissions still need a store release.",
      level: "advanced",
      estMinutes: 150,
      webRefs: [
        { label: "React Native: About the New Architecture", url: "https://reactnative.dev/architecture/landing-page", kind: "docs" },
        { label: "React Native blog: The New Architecture is here", url: "https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here", kind: "article" },
        { label: "React Native: Get Started (use a framework)", url: "https://reactnative.dev/docs/environment-setup", kind: "docs" },
        { label: "Expo: Documentation", url: "https://docs.expo.dev/", kind: "docs" },
      ],
      video: {
        title: "React Native Course – Android and iOS App Development",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=obH0Po_RdWk",
        videoId: "obH0Po_RdWk",
        durationLabel: "4:40:39",
      },
      alternateVideos: [
        {
          title: "React Native Crash Course 2026 - Build a Complete Mobile App",
          channel: "Traversy Media",
          url: "https://www.youtube.com/watch?v=XCifkDC0yXA",
          videoId: "XCifkDC0yXA",
          durationLabel: "1:38:36",
        },
        {
          title: "Mastering React Native’s New Architecture for High-Performance Apps | Omkar Kolate | GeekSpeak",
          channel: "GeekyAnts",
          url: "https://www.youtube.com/watch?v=ObypwcPI6sQ",
          videoId: "ObypwcPI6sQ",
          durationLabel: "19:39",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "bonus-react-native-q1",
          prompt: "What does `<View style={{ padding: 16 }} />` become on iOS?",
          options: [
            "A native `UIView` managed by React Native's renderer",
            "A `<div>` inside a WebView",
            "A canvas element drawn by a JavaScript layout engine",
            "A SwiftUI view generated at build time",
          ],
          correctIndex: 0,
          explanation:
            "React Native renders platform views, which is what separates it from WebView wrappers such as Cordova. Flutter draws its own pixels; React Native uses the platform's views.",
        },
        {
          id: "bonus-react-native-q2",
          prompt: "What happens when this renders?\n\n```jsx\n<View>\n  Hello {user.name}\n</View>\n```",
          options: [
            "It errors: text strings must be rendered within a `<Text>` component",
            "It renders the text with the platform's default font",
            "The text is silently dropped",
            "It works on Android but not on iOS",
          ],
          correctIndex: 0,
          explanation:
            "Unlike the DOM, a `View` can't contain raw text nodes; all text goes through `<Text>`, which also determines what can inherit text styles.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bonus-react-native-q3",
          prompt: "Two `<View>` boxes are placed inside a parent `<View>` with no styles. How are they laid out?",
          options: [
            "Stacked vertically, because `flexDirection` defaults to `\"column\"`",
            "Side by side, because `flexDirection` defaults to `\"row\"` like the web",
            "On top of each other, because views are absolutely positioned by default",
            "In a grid, because React Native uses CSS Grid",
          ],
          correctIndex: 0,
          explanation:
            "Every view is a flex container and the default direction is column (the web's default is row). There's also no `display: block` or grid layout to fall back on.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bonus-react-native-q4",
          prompt: "Which statements about React Native's New Architecture are true? (Select all that apply.)",
          options: [
            "JSI lets JavaScript call C++ objects directly without serializing arguments to JSON",
            "TurboModules are lazily loaded, type-safe native modules built on JSI",
            "Fabric is the new renderer, supporting concurrent React features and synchronous layout",
            "The asynchronous bridge is the New Architecture's main way to call native code",
            "Hermes is the CSS engine that replaced Yoga",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The bridge is what the New Architecture replaced. Hermes is the JavaScript engine (Hermes V1 became the default in 0.84), and Yoga is still the layout engine.",
        },
        {
          id: "bonus-react-native-q5",
          prompt: "A dependency only supports the legacy bridge and was never migrated. What happens on React Native 0.82 or later?",
          options: [
            "It won't work: 0.82+ runs only on the New Architecture, so you need a migrated version or a replacement",
            "It keeps working through the interop layer forever",
            "It works in development builds but not in release builds",
            "React Native falls back to the legacy architecture for that module only",
          ],
          correctIndex: 0,
          explanation:
            "0.82 was the first release that runs entirely on the New Architecture, and later versions keep removing legacy code. Checking New Architecture support is now part of choosing any native library.",
        },
        {
          id: "bonus-react-native-q6",
          prompt: "How do the React Native docs recommend starting a new app in 2026?",
          options: [
            "With a framework, and they name Expo (`npx create-expo-app`)",
            "With `react-native init` and hand-configured Xcode and Gradle projects",
            "With Create React App plus a React Native adapter",
            "By wrapping a web build in a WebView",
          ],
          correctIndex: 0,
          explanation:
            "The docs recommend a framework for new apps because it provides routing, native modules, builds and updates. You can still use React Native without one, but you then maintain that tooling yourself.",
        },
        {
          id: "bonus-react-native-q7",
          prompt: "A screen renders 5,000 transactions with `<ScrollView>{items.map(renderRow)}</ScrollView>` and is sluggish. What's the fix?",
          options: [
            "Use a virtualized list (`FlatList` or FlashList) with a stable `keyExtractor`, so only visible rows are rendered",
            "Wrap every row in `React.memo`",
            "Move the list into a WebView",
            "Increase the JavaScript thread's priority",
          ],
          correctIndex: 0,
          explanation:
            "`ScrollView` mounts every child up front, so 5,000 native views are created and kept in memory. Virtualized lists render a window around the viewport; `memo` doesn't reduce the number of mounted rows.",
        },
        {
          id: "bonus-react-native-q8",
          prompt: "Which changes can reach users through an Expo over-the-air update, without a new store build? (Select all that apply.)",
          options: [
            "Fixing a bug in a screen's JavaScript",
            "Updating images bundled with the JavaScript",
            "Adding a library that includes new native code",
            "Adding a new camera permission to the app's config",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "OTA updates replace the JavaScript bundle and assets that run on top of an existing native binary. New native modules and permission changes alter the binary, so they need a new build and store review.",
        },
        {
          id: "bonus-react-native-q9",
          prompt: "You set `color: \"red\"` and `fontSize: 18` on a parent `<View>`. What happens to a `<Text>` inside it?",
          options: [
            "Nothing: views don't pass text styles down; only a parent `<Text>` shares them with nested `<Text>`",
            "It turns red and 18 px, like CSS inheritance",
            "It turns red, but `fontSize` needs `StyleSheet.create`",
            "It throws, because `View` doesn't accept `color`",
          ],
          correctIndex: 0,
          explanation:
            "React Native has limited style inheritance: text styles flow only between nested `<Text>` elements. Apps usually create their own `AppText` component to apply a font everywhere.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "bonus-react-native-q10",
          prompt: "A tooltip must be positioned from its anchor's measured size. What does the New Architecture enable here?",
          options: [
            "Measuring in `useLayoutEffect` and updating position in the same commit, so the tooltip never visibly jumps",
            "Measuring with `document.getElementById(...).getBoundingClientRect()`",
            "Reading layout from the `onLayout` event before the first frame on all platforms",
            "Positioning with CSS `anchor()` functions",
          ],
          correctIndex: 0,
          explanation:
            "The legacy architecture only exposed layout asynchronously (via `onLayout`), so the first frame showed the wrong position. Fabric allows synchronous layout reads and updates scheduled before paint.",
        },
      ],
    },
    {
      id: "bonus-pwa",
      moduleId: "fe-meta-mobile",
      trackId: "frontend",
      title: "Progressive Web Apps: Service Workers, Manifest & Offline",
      summary:
        "A Progressive Web App is a website that earns app-like capabilities (installation, its own window, offline support, push where supported) from one codebase at one URL, with updates that ship like any web deploy. The web app manifest (`name`, 192 and 512 px `icons`, `start_url`, `display: \"standalone\"`) describes the installed app; the service worker, a script that receives every `fetch` in its scope, provides the offline behavior.\n\nCaching strategy is a per-request decision. Content-hashed assets are immutable, so cache-first is safe. HTML navigations need freshness: network-first, with a cached copy or an offline page as the fallback. Avatars and non-critical data suit stale-while-revalidate, which answers from cache instantly and refreshes in the background at the cost of one stale view. Never cache non-GET requests, and only cache successful responses, or a transient error becomes permanent.\n\nThe lifecycle is the classic trap. An updated service worker installs, then waits until no tab is controlled by the old one; a reload isn't enough, because the old and new pages overlap during navigation. `skipWaiting()` activates it at once (pages loaded by the old version may then request assets the new one deleted), `clients.claim()` takes over open pages, and versioned caches cleaned up in `activate` keep the old version working until it's gone. Browsers check for updates on navigation, ignore HTTP caching of the worker script by default, and compare it byte for byte.\n\nInstallability varies. Chrome needs HTTPS, a manifest with those fields and some user engagement before `beforeinstallprompt` fires; a service worker is no longer required. iOS has no install prompt (Share, then Add to Home Screen), web push works only for home-screen apps (iOS 16.4+), and WebKit can evict storage for sites that aren't installed and haven't been used recently, so treat client storage as a cache.",
      level: "advanced",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "MDN: Progressive web apps", url: "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps", kind: "docs" },
        { label: "web.dev: The service worker lifecycle", url: "https://web.dev/articles/service-worker-lifecycle", kind: "article" },
        { label: "Chrome for Developers: Workbox caching strategies", url: "https://developer.chrome.com/docs/workbox/caching-strategies-overview", kind: "article" },
        { label: "web.dev: What does it take to be installable?", url: "https://web.dev/articles/install-criteria", kind: "docs" },
      ],
      video: {
        title: "Progressive Web Apps in 100 Seconds // Build a PWA from Scratch",
        channel: "Fireship",
        url: "https://www.youtube.com/watch?v=sFsRylCQblw",
        videoId: "sFsRylCQblw",
        durationLabel: "8:09",
      },
      alternateVideos: [
        {
          title: "Introduction to PWAs [1 of 17] | PWA for Beginners",
          channel: "Microsoft Developer",
          url: "https://www.youtube.com/watch?v=BByUknfLTuA",
          videoId: "BByUknfLTuA",
          durationLabel: "13:46",
        },
        {
          title: "Introduction to Service Workers",
          channel: "Chrome for Developers",
          url: "https://www.youtube.com/watch?v=jVfXiv03y5c",
          videoId: "jVfXiv03y5c",
          durationLabel: "12:53",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement the routing and caching logic of a service worker's `fetch` handler, the way Workbox's strategies work, against a simulated cache and network.\n\n`pickStrategy(request)` gets `{ url, method, mode, destination }` and returns `\"network-only\"`, `\"cache-first\"`, `\"network-first\"` or `\"stale-while-revalidate\"`, applying these rules in order:\n\n- Any method other than `GET`: `\"network-only\"`.\n- Cross-origin URLs (starting with `http://` or `https://`): `\"cache-first\"` for URLs starting with `https://fonts.gstatic.com/`, otherwise `\"network-only\"`.\n- `mode === \"navigate\"`: `\"network-first\"`.\n- Paths starting with `/assets/` (content-hashed build output): `\"cache-first\"`.\n- Paths starting with `/api/`: `\"network-first\"`.\n- Everything else: `\"stale-while-revalidate\"`.\n\n`handleFetch(request, strategy, cache, network)` returns `{ status, body, from }`, where `from` is `\"network\"`, `\"cache\"`, `\"fallback\"` or `\"error\"`. `cache.get(url)` returns a stored `{ status, body }` or `undefined`, `cache.put(url, response)` stores one, and `network.fetch(url)` returns `{ status, body }`, or `null` when offline.\n\n- Only ever store responses with status 200.\n- network-only: return the network response as-is.\n- cache-first: return the cached copy if there is one; otherwise fetch, store and return.\n- network-first: fetch, store and return. Only when the network is unreachable (`null`) fall back to the cached copy. An error status such as 500 is still a response: return it, don't fall back, don't cache it.\n- stale-while-revalidate: with a cached copy, return it and also fetch in the background to refresh the cache (the fresh response is not what you return); without one, fetch, store and return.\n- When nothing can answer: navigations get the precached `/offline.html` with `from: \"fallback\"` if it exists; everything else gets `{ status: 503, body: null, from: \"error\" }`.\n\nThe driver `runServiceWorker(server, precache, steps)` replays `fetch`, `offline`, `online` and `deploy` (change a server resource) steps and reports every response, the number of network calls and the cached URLs. Leave it as it is.",
        starterCode: "/**\n * Decide how the service worker should handle a request.\n * @param {{ url: string, method: string, mode: string, destination: string }} request\n * @returns {\"network-only\" | \"cache-first\" | \"network-first\" | \"stale-while-revalidate\"}\n */\nfunction pickStrategy(request) {\n  // Your code here\n  return \"network-only\";\n}\n\n/**\n * Run a strategy against the simulated cache and network.\n * cache: get(url) -> { status, body } | undefined, put(url, response)\n * network: fetch(url) -> { status, body } | null (null means offline)\n * @returns {{ status: number, body: unknown, from: \"network\" | \"cache\" | \"fallback\" | \"error\" }}\n */\nfunction handleFetch(request, strategy, cache, network) {\n  // Your code here\n  const res = network.fetch(request.url);\n  return res ? { status: res.status, body: res.body, from: \"network\" } : { status: 503, body: null, from: \"error\" };\n}\n\n// ---- Test driver (leave as is) ----\n// server: { [url]: { status, body } } (unknown URLs answer 404). precache: { [url]: body }.\n// steps: [\"fetch\", request] | [\"offline\"] | [\"online\"] | [\"deploy\", url, body, status = 200]\nfunction runServiceWorker(server, precache, steps) {\n  const store = new Map(Object.entries(precache).map(([url, body]) => [url, { status: 200, body }]));\n  const origin = new Map(Object.entries(server));\n  let online = true;\n  let networkCalls = 0;\n  const cache = {\n    get: (url) => (store.has(url) ? { ...store.get(url) } : undefined),\n    put: (url, res) => store.set(url, { status: res.status, body: res.body }),\n  };\n  const network = {\n    fetch(url) {\n      networkCalls++;\n      if (!online) return null;\n      const res = origin.get(url);\n      return res ? { ...res } : { status: 404, body: \"Not Found\" };\n    },\n  };\n  const log = [];\n  for (const [op, a, b, c] of steps) {\n    if (op === \"offline\") online = false;\n    else if (op === \"online\") online = true;\n    else if (op === \"deploy\") origin.set(a, { status: c === undefined ? 200 : c, body: b });\n    else if (op === \"fetch\") {\n      const request = { method: \"GET\", mode: \"cors\", destination: \"\", ...a };\n      const strategy = pickStrategy(request);\n      log.push({ url: request.url, strategy, ...handleFetch(request, strategy, cache, network) });\n    }\n  }\n  return { log, networkCalls, cached: [...store.keys()].sort() };\n}\n",
        functionName: "runServiceWorker",
        testCases: [
          {
            description: "a content-hashed asset is fetched once, then served cache-first",
            args: [
              SERVER,
              PRECACHE,
              [
                ["fetch", { url: "/assets/app.3f9a1c.js", destination: "script" }],
                ["fetch", { url: "/assets/app.3f9a1c.js", destination: "script" }],
              ],
            ],
            expected: {
              log: [
                {
                  url: "/assets/app.3f9a1c.js",
                  strategy: "cache-first",
                  status: 200,
                  body: "app bundle",
                  from: "network",
                },
                {
                  url: "/assets/app.3f9a1c.js",
                  strategy: "cache-first",
                  status: 200,
                  body: "app bundle",
                  from: "cache",
                },
              ],
              networkCalls: 1,
              cached: ["/assets/app.3f9a1c.js", "/offline.html"],
            },
          },
          {
            description: "navigations are network-first: cached copy offline, offline page for unvisited URLs",
            args: [
              SERVER,
              PRECACHE,
              [
                ["fetch", { url: "/", mode: "navigate", destination: "document" }],
                ["offline"],
                ["fetch", { url: "/", mode: "navigate", destination: "document" }],
                ["fetch", { url: "/about", mode: "navigate", destination: "document" }],
              ],
            ],
            expected: {
              log: [
                { url: "/", strategy: "network-first", status: 200, body: "<home v1>", from: "network" },
                { url: "/", strategy: "network-first", status: 200, body: "<home v1>", from: "cache" },
                {
                  url: "/about",
                  strategy: "network-first",
                  status: 200,
                  body: "<offline page>",
                  from: "fallback",
                },
              ],
              networkCalls: 3,
              cached: ["/", "/offline.html"],
            },
          },
          {
            description: "stale-while-revalidate answers from cache and refreshes in the background",
            args: [
              SERVER,
              PRECACHE,
              [
                ["fetch", { url: "/img/avatar.png", destination: "image" }],
                ["deploy", "/img/avatar.png", "avatar v2"],
                ["fetch", { url: "/img/avatar.png", destination: "image" }],
                ["fetch", { url: "/img/avatar.png", destination: "image" }],
              ],
            ],
            expected: {
              log: [
                {
                  url: "/img/avatar.png",
                  strategy: "stale-while-revalidate",
                  status: 200,
                  body: "avatar v1",
                  from: "network",
                },
                {
                  url: "/img/avatar.png",
                  strategy: "stale-while-revalidate",
                  status: 200,
                  body: "avatar v1",
                  from: "cache",
                },
                {
                  url: "/img/avatar.png",
                  strategy: "stale-while-revalidate",
                  status: 200,
                  body: "avatar v2",
                  from: "cache",
                },
              ],
              networkCalls: 3,
              cached: ["/img/avatar.png", "/offline.html"],
            },
          },
          {
            description: "network-first returns a 500 as-is without caching it; offline still gets the last good copy",
            args: [
              SERVER,
              PRECACHE,
              [
                ["fetch", { url: "/api/feed" }],
                ["deploy", "/api/feed", "upstream down", 500],
                ["fetch", { url: "/api/feed" }],
                ["offline"],
                ["fetch", { url: "/api/feed" }],
              ],
            ],
            expected: {
              log: [
                {
                  url: "/api/feed",
                  strategy: "network-first",
                  status: 200,
                  body: "[feed v1]",
                  from: "network",
                },
                {
                  url: "/api/feed",
                  strategy: "network-first",
                  status: 500,
                  body: "upstream down",
                  from: "network",
                },
                { url: "/api/feed", strategy: "network-first", status: 200, body: "[feed v1]", from: "cache" },
              ],
              networkCalls: 3,
              cached: ["/api/feed", "/offline.html"],
            },
          },
          {
            description: "non-GET requests always go to the network and are never cached",
            args: [
              SERVER,
              PRECACHE,
              [
                ["fetch", { url: "/api/feed", method: "POST" }],
                ["fetch", { url: "/api/feed", method: "POST" }],
                ["offline"],
                ["fetch", { url: "/api/feed", method: "POST" }],
              ],
            ],
            expected: {
              log: [
                {
                  url: "/api/feed",
                  strategy: "network-only",
                  status: 200,
                  body: "[feed v1]",
                  from: "network",
                },
                {
                  url: "/api/feed",
                  strategy: "network-only",
                  status: 200,
                  body: "[feed v1]",
                  from: "network",
                },
                { url: "/api/feed", strategy: "network-only", status: 503, body: null, from: "error" },
              ],
              networkCalls: 3,
              cached: ["/offline.html"],
            },
          },
          {
            description: "cross-origin: fonts are cache-first, other third-party scripts network-only",
            args: [
              SERVER,
              PRECACHE,
              [
                ["fetch", { url: "https://fonts.gstatic.com/s/inter/v13/inter.woff2", destination: "font" }],
                ["fetch", { url: "https://fonts.gstatic.com/s/inter/v13/inter.woff2", destination: "font" }],
                ["fetch", { url: "https://cdn.example.com/widget.js", destination: "script" }],
                ["offline"],
                ["fetch", { url: "https://cdn.example.com/widget.js", destination: "script" }],
              ],
            ],
            expected: {
              log: [
                {
                  url: "https://fonts.gstatic.com/s/inter/v13/inter.woff2",
                  strategy: "cache-first",
                  status: 200,
                  body: "font",
                  from: "network",
                },
                {
                  url: "https://fonts.gstatic.com/s/inter/v13/inter.woff2",
                  strategy: "cache-first",
                  status: 200,
                  body: "font",
                  from: "cache",
                },
                {
                  url: "https://cdn.example.com/widget.js",
                  strategy: "network-only",
                  status: 200,
                  body: "widget",
                  from: "network",
                },
                {
                  url: "https://cdn.example.com/widget.js",
                  strategy: "network-only",
                  status: 503,
                  body: null,
                  from: "error",
                },
              ],
              networkCalls: 3,
              cached: ["/offline.html", "https://fonts.gstatic.com/s/inter/v13/inter.woff2"],
            },
          },
          {
            description: "a 404 under cache-first is returned but not cached",
            args: [
              SERVER,
              PRECACHE,
              [
                ["fetch", { url: "/assets/missing.1a2b.js", destination: "script" }],
                ["fetch", { url: "/assets/missing.1a2b.js", destination: "script" }],
              ],
            ],
            expected: {
              log: [
                {
                  url: "/assets/missing.1a2b.js",
                  strategy: "cache-first",
                  status: 404,
                  body: "Not Found",
                  from: "network",
                },
                {
                  url: "/assets/missing.1a2b.js",
                  strategy: "cache-first",
                  status: 404,
                  body: "Not Found",
                  from: "network",
                },
              ],
              networkCalls: 2,
              cached: ["/offline.html"],
            },
            isEdgeCase: true,
          },
          {
            description: "stale-while-revalidate with an empty cache while offline is an error, not a fallback",
            args: [
              SERVER,
              PRECACHE,
              [["offline"], ["fetch", { url: "/manifest.webmanifest", destination: "manifest" }]],
            ],
            expected: {
              log: [
                {
                  url: "/manifest.webmanifest",
                  strategy: "stale-while-revalidate",
                  status: 503,
                  body: null,
                  from: "error",
                },
              ],
              networkCalls: 1,
              cached: ["/offline.html"],
            },
            isEdgeCase: true,
          },
          {
            description: "an offline navigation with nothing precached fails with 503",
            args: [
              SERVER,
              {},
              [["offline"], ["fetch", { url: "/about", mode: "navigate", destination: "document" }]],
            ],
            expected: {
              log: [{ url: "/about", strategy: "network-first", status: 503, body: null, from: "error" }],
              networkCalls: 1,
              cached: [],
            },
            isEdgeCase: true,
          },
          {
            description: "no steps",
            args: [SERVER, PRECACHE, []],
            expected: { log: [], networkCalls: 0, cached: ["/offline.html"] },
            isEdgeCase: true,
          },
        ],
      },
    },
  ],
} satisfies Module;
