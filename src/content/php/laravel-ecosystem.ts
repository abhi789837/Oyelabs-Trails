import type { Module } from "@/types/curriculum";

export default {
  id: "laravel-ecosystem",
  trackId: "php",
  name: "The Laravel Ecosystem",
  description:
    "The first-party packages that sit around the framework — and, more importantly, when each one is the right call. Livewire or Inertia, Telescope or Pulse, Horizon, Octane, Scout, the AI SDK, Cashier, Reverb, Pint and Sail, judged on what they cost as well as on what they do.",
  refs: [
    { label: "Laravel: Starter Kits", url: "https://laravel.com/framework/docs/13.x/starter-kits", kind: "docs" },
    { label: "Laravel: Release Notes", url: "https://laravel.com/framework/docs/13.x/releases", kind: "docs" },
    { label: "Livewire: Quickstart", url: "https://livewire.laravel.com/docs/4.x/quickstart", kind: "docs" },
    { label: "Inertia: Who Is Inertia.js For?", url: "https://inertiajs.com/docs/v3/core-concepts/who-is-it-for", kind: "article" },
  ],
  topics: [
    {
      id: "lv-eco-starter-kits",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Starter Kits: What Laravel Scaffolds Now",
      summary:
        "Almost every Laravel tutorial written before 2025 tells you to `composer require laravel/breeze`. That is out of date. Laravel's scaffolding story is now starter kits, chosen interactively when you run `laravel new`, and Breeze and Jetstream no longer appear in the documentation's package list. There are four: React, Svelte and Vue — each built on Inertia, TypeScript, Tailwind and a shadcn-family component library — and Livewire, built on Flux UI. Each also has a WorkOS AuthKit variant that swaps Laravel's own login for hosted social auth, passkeys, magic links and SSO.\n\nThe design decision that matters is code ownership. A starter kit is not a dependency you track: the routes, controllers, views and frontend components are copied into your application and are yours to edit. The official answer to \"how do I upgrade the starter kit?\" is that you don't, because there is nothing to upgrade. That is liberating on day one and it is the whole cost — you will never get upstream fixes or new auth features for free, and two applications generated a year apart will have drifted.\n\nUnderneath, authentication is provided by Fortify, a headless auth backend. That is why two-factor authentication, password confirmation and login rate limiting are configured in `config/fortify.php` and `FortifyServiceProvider` rather than in the copied controllers. The common trap is assuming everything is switched on: email verification is not — you implement `MustVerifyEmail` on the `User` model yourself.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel: Starter Kits", url: "https://laravel.com/framework/docs/13.x/starter-kits", kind: "docs" },
        { label: "Laravel: Fortify", url: "https://laravel.com/framework/docs/13.x/fortify", kind: "docs" },
        { label: "Laravel News: Laravel Starter Kits", url: "https://laravel-news.com/laravel-starter-kits", kind: "article" },
      ],
      video: {
        title: "Laravel Just Dropped Brand New Starter Kits",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=SefjBZvKhTw",
        videoId: "SefjBZvKhTw",
        durationLabel: "12:44",
      },
      alternateVideos: [
        {
          title: "Laravel Starter Kits: What's New w/ Wendell Adriel",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=AbPSAt46Ja0",
          videoId: "AbPSAt46Ja0",
          durationLabel: "1:08:01",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-starter-kits-q1",
          prompt: "A blog post from 2024 tells your team to install Breeze to scaffold auth. What is the current guidance?",
          options: [
            "Use a starter kit, selected when running `laravel new`; Breeze and Jetstream are no longer the documented scaffolding path",
            "Breeze is still the recommended option; starter kits are only for teams using Inertia",
            "Install Fortify directly — starter kits only scaffold marketing pages",
            "Use Jetstream for teams and Breeze for everything else, as before",
          ],
          correctIndex: 0,
          explanation:
            "Starter kits replaced both, and the installer prompts you for one. Fortify is involved, but it is used by the starter kit rather than installed by you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-starter-kits-q2",
          prompt: "Which of these are true of the official starter kits? (Select all that apply.)",
          options: [
            "The React, Svelte and Vue kits all render their pages through Inertia",
            "The Livewire kit ships with the Flux UI component library",
            "All of the kits use Fortify for authentication",
            "There is an official Angular starter kit",
            "The frontend code lives in a vendor package you update with Composer",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The three JavaScript kits are Inertia-based and the Livewire kit uses Flux; all four sit on Fortify. There is no Angular kit, and the whole point of a starter kit is that the code is copied into your application rather than vendored.",
        },
        {
          id: "lv-eco-starter-kits-q3",
          prompt: "Where do you change the login rate limit or switch two-factor authentication on and off in a starter-kit application?",
          options: [
            "In `config/fortify.php` and `FortifyServiceProvider`, because Fortify provides the auth backend",
            "In the generated `LoginController`, which owns all auth behaviour",
            "In `bootstrap/app.php`, alongside middleware configuration",
            "In `config/auth.php`, which is where all authentication settings live",
          ],
          correctIndex: 0,
          explanation:
            "Fortify is headless: the copied views and routes are yours, but features and rate limiters are registered through Fortify's config and service provider. `config/auth.php` configures guards and user providers, which is a different concern.",
        },
        {
          id: "lv-eco-starter-kits-q4",
          prompt: "Six months after generating an app from a starter kit, a fix lands in the kit's repository. How do you get it?",
          options: [
            "Manually — the code was copied into your app, so there is no upgrade path and you apply the change yourself",
            "`composer update` picks it up, since the kit is a versioned dependency",
            "`php artisan starter-kit:upgrade` regenerates the scaffolding in place",
            "Automatically, because starter kits are thin wrappers that defer to framework code",
          ],
          correctIndex: 0,
          explanation:
            "Full code ownership is the trade: you can change anything, and nothing upstream reaches you again. The docs state plainly that there is no need — and no mechanism — to update the starter kit itself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-starter-kits-q5",
          prompt: "What does choosing the WorkOS AuthKit variant of a starter kit actually change?",
          options: [
            "Authentication moves to a hosted provider offering social login, passkeys, magic links and SSO — and your app stops storing passwords",
            "It only adds a \"Sign in with Google\" button on top of the normal password login",
            "It replaces Fortify with Passport so you can issue OAuth2 tokens",
            "It adds SAML support to Laravel's own session guard with no external service",
          ],
          correctIndex: 0,
          explanation:
            "AuthKit is an external identity provider; the docs even recommend disabling email + password inside WorkOS so your application never handles a password. That means a third-party dependency and an account on someone else's service, which is the real decision.",
        },
        {
          id: "lv-eco-starter-kits-q6",
          prompt: "A new starter-kit app lets users register and reach the dashboard without confirming their email address. Why?",
          options: [
            "Email verification is off by default; you implement `MustVerifyEmail` on the `User` model to turn it on",
            "Verification only runs when `APP_ENV` is `production`",
            "The mail driver defaults to `log`, so the email is sent but silently discarded",
            "Verification requires the WorkOS variant of the starter kit",
          ],
          correctIndex: 0,
          explanation:
            "The scaffolding ships the plumbing but leaves the contract commented out on the model. A `log` mailer would explain a missing email, but not the fact that unverified users can reach the dashboard.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-starter-kits-q7",
          prompt: "You generate a starter kit with the teams feature enabled. What changes about your routes?",
          options: [
            "Routes are scoped to the current team, so its slug appears in the URL and membership is verified automatically",
            "Nothing — teams only add a management screen and a `team_id` column",
            "Every route gains a `team` query string parameter you must pass manually",
            "Routes move behind a subdomain per team",
          ],
          correctIndex: 0,
          explanation:
            "Team-scoped routes carry a `{current_team}` segment, URL defaults are registered so `route('dashboard')` fills it in, and the kit checks that the authenticated user belongs to the requested team.",
        },
        {
          id: "lv-eco-starter-kits-q8",
          prompt: "Your team has a three-year-old Laravel application and wants the starter kit's settings and 2FA screens. What is the honest assessment?",
          options: [
            "Starter kits generate a new application; for an existing app you install Fortify and port the pieces you want by hand",
            "Run the starter kit installer inside the existing project — it merges non-destructively",
            "Publish the starter kit's views with `vendor:publish` and wire up the routes",
            "Starter kits are backwards compatible with any Laravel 10+ app and install via Composer",
          ],
          correctIndex: 0,
          explanation:
            "A starter kit is a project template consumed by `laravel new`, not an add-on. The reusable part for an existing app is Fortify, plus copying whatever UI you like out of a freshly generated kit.",
        },
        {
          id: "lv-eco-starter-kits-q9",
          prompt: "Which starter kit fits a team of backend-leaning PHP developers with no strong React or Vue skills, building an internal admin tool?",
          options: [
            "The Livewire kit, so the UI stays in Blade and PHP with no separate client-side state model to learn",
            "The React kit, because shadcn/ui gives the most components out of the box",
            "The Svelte kit, because it produces the smallest bundle",
            "None — build the SPA separately against an API so the frontend can evolve independently",
          ],
          correctIndex: 0,
          explanation:
            "Matching the kit to the team's existing skills is the point of having four. A separate SPA is the heaviest option and is hard to justify for an internal tool with one small team.",
        },
        {
          id: "lv-eco-starter-kits-q10",
          prompt: "Which of these are reasonable reasons to skip the starter kits entirely? (Select all that apply.)",
          options: [
            "The project is a headless JSON API with no server-rendered frontend at all",
            "You are adding Laravel to an existing codebase with its own established auth",
            "Your organisation mandates a design system that the shipped UI would have to be stripped out to satisfy",
            "You dislike Tailwind, so none of the scaffolding can be used",
            "The app will be deployed on-premise rather than to a cloud host",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Skipping makes sense when there is no UI to scaffold, when auth already exists, or when the shipped UI would be deleted anyway. Disliking Tailwind is a restyling job on code you own, and the deployment target is unrelated to scaffolding.",
        },
      ],
    },

    {
      id: "lv-eco-vite",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Laravel Vite and the Asset Pipeline",
      summary:
        "Laravel's frontend build is Vite plus a thin official plugin, and the integration reduces to one question: how does a Blade template know the URL of a hashed asset? In development the answer is a `hot` file written to disk by `npm run dev` — the `@vite` directive sees it and emits script tags pointing at the Vite dev server, along with the client that performs hot module replacement. In production it reads the build manifest and emits the hashed filenames from `public/build`. That is why a deploy that forgets `npm run build` fails with a missing-manifest error, and why a stale `hot` file shipped to a server makes a public page try to load from `localhost:5173`.\n\nComparing it with Laravel Mix, which it replaced, is instructive. Mix wrapped webpack and rebundled on every change; Vite serves unbundled ES modules in development and only bundles for production, which is why its startup time barely grows with project size. The cost is a second long-running process your team has to remember, and the fact that anything expecting a classic `public/js/app.js` path has to be taught otherwise.\n\nTwo things catch people repeatedly. Static assets referenced only from Blade are invisible to the bundler unless you declare them in the plugin's `assets` option and resolve them with `Vite::asset()` — otherwise the file is never hashed or emitted. And `refresh: true` is what makes a Blade edit reload the browser; without it you change a `.blade.php` file and nothing happens, because Vite is watching your JavaScript module graph, not your views.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Asset Bundling (Vite)", url: "https://laravel.com/framework/docs/13.x/vite", kind: "docs" },
        { label: "Vite: Getting Started", url: "https://vite.dev/guide/", kind: "docs" },
        { label: "laravel/vite-plugin", url: "https://github.com/laravel/vite-plugin", kind: "repo" },
      ],
      video: {
        title: "Bundling Assets with Laravel Vite",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=nuWSYP-BOKI",
        videoId: "nuWSYP-BOKI",
        durationLabel: "18:50",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-vite-q1",
          prompt: "How does `@vite(['resources/js/app.js'])` decide whether to point at the dev server or at a built file?",
          options: [
            "It checks for the `hot` file that `npm run dev` writes; if it is absent it falls back to the build manifest",
            "It reads `APP_ENV` and uses the dev server whenever the value is `local`",
            "It always reads the manifest, and the dev server rewrites the manifest on each change",
            "It probes `localhost:5173` over HTTP on every request and uses it if the port answers",
          ],
          correctIndex: 0,
          explanation:
            "The `hot` file is the switch. Keying off `APP_ENV` would break a colleague who runs `npm run build` locally, and probing a port on every request would be far too slow.",
        },
        {
          id: "lv-eco-vite-q2",
          prompt: "A production deploy fails with \"Unable to locate file in Vite manifest\". Which are plausible causes? (Select all that apply.)",
          options: [
            "`npm run build` never ran during the deploy, so `public/build` has no manifest",
            "The entry point named in `@vite(...)` is not listed in the plugin's `input` array",
            "Build output was generated on a machine whose artefacts were never copied to the server",
            "`APP_KEY` has not been generated",
            "The database migrations have not run",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The manifest lookup only cares about the build step and the entry point names. A missing `APP_KEY` and pending migrations break other things, loudly and differently.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-vite-q3",
          prompt: "An image is referenced only from Blade as `<img src=\"/images/logo.png\">`. It works locally and 404s after the production build. Why?",
          options: [
            "Vite never saw the file, so it was not processed; declare it in the plugin's `assets` option and resolve it with `Vite::asset()`",
            "Vite deleted it during the build because nothing imported it",
            "Blade caches asset URLs, and clearing the view cache fixes it",
            "Images must live under `resources/js` to be served in production",
          ],
          correctIndex: 0,
          explanation:
            "Vite only follows its module graph, so a path hard-coded in Blade is invisible to it and is neither hashed nor emitted. Vite does not reach outside its graph to delete your files either.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-vite-q4",
          prompt: "Why does editing a Blade file not reload the browser by default while `npm run dev` is running?",
          options: [
            "Vite watches the JavaScript module graph; watching Blade requires the plugin's `refresh` option",
            "Blade templates compile to cached PHP, so the browser can never see changes without `view:clear`",
            "Hot module replacement only works for CSS files",
            "The Vite dev server proxies PHP requests and always serves a cached response",
          ],
          correctIndex: 0,
          explanation:
            "`refresh: true` tells the plugin to trigger a full page reload when watched PHP and Blade paths change. Blade's compiled-view cache checks file timestamps, so it is not what is stopping you.",
        },
        {
          id: "lv-eco-vite-q5",
          prompt: "What is the main architectural difference between Vite and the Laravel Mix setup it replaced?",
          options: [
            "Vite serves unbundled ES modules in development and only bundles for production; Mix rebundled through webpack on every change",
            "Vite compiles on the server in PHP, whereas Mix needed Node",
            "Vite drops support for CSS preprocessors, which Mix supported",
            "Vite hashes filenames while Mix never versioned assets",
          ],
          correctIndex: 0,
          explanation:
            "Native ESM in development is why Vite's startup time barely grows with project size. Mix could version assets too, and Vite handles Sass and friends through plugins.",
        },
        {
          id: "lv-eco-vite-q6",
          prompt: "What does `Vite::prefetch(concurrency: 3)` in a service provider's `boot` method do?",
          options: [
            "Eagerly downloads code-split JavaScript and CSS chunks after page load, three at a time, so later navigations do not stall",
            "Preloads Eloquent relationships used by the page to avoid N+1 queries",
            "Warms the Vite dev server so the first request is faster",
            "Limits the browser to three concurrent requests for all assets",
          ],
          correctIndex: 0,
          explanation:
            "It is a frontend latency fix for code-split SPAs: fetch chunks before they are needed. It has nothing to do with Eloquent, and it governs prefetching only, not every request.",
        },
        {
          id: "lv-eco-vite-q7",
          prompt: "A public production page tries to load `http://localhost:5173/@vite/client` for every visitor. What happened?",
          options: [
            "A `hot` file was deployed or left behind, so `@vite` still believes the dev server is running",
            "The build was run with `--mode development`, which embeds the dev URL in the manifest",
            "The browser cached development HTML and is replaying it",
            "`APP_URL` is misconfigured and Laravel is rewriting asset URLs",
          ],
          correctIndex: 0,
          explanation:
            "The `hot` file is the only thing that makes the directive emit dev-server URLs, and it is easily shipped by a naive copy of the project directory. Browser caching would explain one stale visitor, not all of them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-vite-q8",
          prompt: "Which of these are bundler concerns rather than PHP-side concerns? (Select all that apply.)",
          options: [
            "Cache-busting a stylesheet after a deploy",
            "Code splitting a large React page bundle",
            "Compiling TypeScript for the browser",
            "Deciding which Eloquent relationships a controller eager-loads",
            "Signing a URL so it expires after an hour",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Hashed filenames, splitting and transpilation all happen at build time. Eager loading and signed URLs are framework concerns with no build-time component at all.",
        },
        {
          id: "lv-eco-vite-q9",
          prompt: "What has to be true for `npm run dev` to work when the application runs inside a container, for example under Sail?",
          options: [
            "The Vite port must be published from the container and the dev server bound so the host browser can reach it",
            "Vite must run on the host only; it cannot run inside a container",
            "Nothing — the `@vite` directive proxies dev-server requests through PHP",
            "The manifest must be generated first so the dev server knows the entry points",
          ],
          correctIndex: 0,
          explanation:
            "The browser talks to the Vite dev server directly, so its port has to be reachable from the host. The directive emits a URL; asset traffic never passes through PHP.",
        },
        {
          id: "lv-eco-vite-q10",
          prompt: "Your team wants one command that starts the PHP server, the queue worker, the log tail and Vite together for local development. What ships in a current Laravel app?",
          options: [
            "`composer run dev`, the script a fresh application includes for exactly this",
            "`php artisan serve --with-vite`, which supervises the Node process",
            "`npm run dev` alone, which boots PHP through the Laravel plugin",
            "Nothing — every team writes its own shell script",
          ],
          correctIndex: 0,
          explanation:
            "New applications ship a `dev` Composer script that runs the server, queue listener, logs and Vite concurrently. `artisan serve` has no Vite flag, and the Node process never boots PHP.",
        },
      ],
    },

    {
      id: "lv-eco-livewire",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Livewire and the Server-Driven UI",
      summary:
        "Livewire's proposition is that you can build a reactive interface without writing a client-side application. A component is a PHP class plus a Blade view; its public properties are serialised to JSON and embedded in the rendered HTML, and every interaction posts that state back, re-runs the class on the server, re-renders the view, and DOM-diffs the result into the page. The state of your UI lives in PHP, which means validation, authorisation and database access are all just normal Laravel code with no API layer between them.\n\nThat design has a hard physical consequence: interactivity costs a network round trip. A tab switch or a filter change is a request to your server, so the experience is bounded by latency and by how fast your component can re-render. Livewire mitigates this — `wire:model` is deferred by default and sends nothing until an action fires, `.live` adds a 150 ms debounce, `.renderless` skips the re-render — and it pairs with Alpine.js for the things that should never leave the browser, like toggling a dropdown. Reaching for Alpine is not an admission of defeat; knowing which interactions belong on which side is the skill.\n\nThe security model is the part experienced engineers get wrong. Public properties are round-tripped through the browser, so a user can edit them with DevTools, and class names and property names are visible to anyone who looks. Treat every public property as untrusted input: use `#[Locked]` for identifiers you set yourself, and remember that an Eloquent model assigned to a property is locked automatically but loses any query constraints when it is rehydrated on the next request.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Livewire: Properties", url: "https://livewire.laravel.com/docs/4.x/properties", kind: "docs" },
        { label: "Livewire: wire:model", url: "https://livewire.laravel.com/docs/4.x/wire-model", kind: "docs" },
        { label: "Livewire: Understanding Nesting", url: "https://livewire.laravel.com/docs/4.x/understanding-nesting", kind: "docs" },
        { label: "Alpine.js: Start Here", url: "https://alpinejs.dev/start-here", kind: "article" },
      ],
      video: {
        title: "Livewire in 11 Minutes: Main Things You Need to Know",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=9Ya6MvJPQ54",
        videoId: "9Ya6MvJPQ54",
        durationLabel: "11:08",
      },
      alternateVideos: [
        {
          title: "Livewire 4 Revealed | Caleb Porzio Laracon US 2025",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=M60-nxlrePc",
          videoId: "M60-nxlrePc",
          durationLabel: "43:35",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-livewire-q1",
          prompt: "What physically happens between requests to a Livewire component's public properties?",
          options: [
            "They are dehydrated to JSON, sent to the browser with the HTML, and hydrated back into PHP on the next request",
            "They are stored in the session and looked up by a component id",
            "They are held in a PHP process kept alive per user for the duration of the page",
            "They are recomputed from the database on every request, so nothing is transmitted",
          ],
          correctIndex: 0,
          explanation:
            "The snapshot travels with the page. Session storage would not survive multiple tabs cleanly, and PHP has no per-user process to keep alive between ordinary requests.",
        },
        {
          id: "lv-eco-livewire-q2",
          prompt: "A component has `public $userId;` set in `mount()` and used in `save()` to update a record. A user opens DevTools and edits the serialised value. What happens?",
          options: [
            "The edited value is hydrated into the property, so `save()` acts on the attacker's chosen record unless the property is `#[Locked]`",
            "Livewire rejects the request, because the snapshot's checksum covers all property values",
            "Nothing — public properties are only sent browser-ward and never read back",
            "The property is reset to its `mount()` value on every request",
          ],
          correctIndex: 0,
          explanation:
            "Round-tripped properties are user input. `#[Locked]` is the explicit way to say a property must not change client-side; without it, authorisation has to be re-checked in `save()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-livewire-q3",
          prompt: "You type into `<input wire:model=\"title\">` and the heading bound to `$title` does not update. Why?",
          options: [
            "`wire:model` is deferred by default and only syncs when an action runs; `.live` sends updates as you type",
            "The property is missing a `#[Reactive]` attribute",
            "Livewire needs `wire:key` on the input for binding to work",
            "Blade caches the rendered view, so the heading is stale until the cache clears",
          ],
          correctIndex: 0,
          explanation:
            "Deferring by default is a deliberate performance decision — it avoids a request per keystroke. `.live` opts in, with a 150 ms debounce you can tune.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-livewire-q4",
          prompt: "Which interactions are better handled by Alpine.js in the browser than by a Livewire round trip? (Select all that apply.)",
          options: [
            "Toggling a dropdown menu open and closed",
            "Showing and hiding a client-side confirmation modal",
            "Switching between tabs whose content is already rendered",
            "Checking whether the submitted email address is already registered",
            "Deleting a record after the user confirms",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that needs no server state should stay in the browser; anything that touches the database or authorisation must go to the server. Mixing them up is what makes a Livewire app feel slow.",
        },
        {
          id: "lv-eco-livewire-q5",
          prompt: "A component sets `public $posts = Post::where('published', true)->get();` in `mount()`. What is the practical risk?",
          options: [
            "The whole collection is serialised into the page on every request, so the payload and re-render cost grow with the result set",
            "Eloquent collections cannot be assigned to public properties at all",
            "The query re-runs on every keystroke regardless of `wire:model` modifiers",
            "The collection becomes read-only and mutations are silently dropped",
          ],
          correctIndex: 0,
          explanation:
            "Large public properties are shipped to the browser and back on every interaction. Computed properties, or querying inside `render()`, keep the snapshot small.",
        },
        {
          id: "lv-eco-livewire-q6",
          prompt: "An Eloquent model assigned to a public property was loaded with a `select('id', 'title')` constraint. What is true on the next request?",
          options: [
            "Livewire locks the model's identifier but the query constraint is lost, so the model is re-fetched in full",
            "The constraint is preserved because it is part of the serialised snapshot",
            "The property is reset to `null` because constrained models cannot be hydrated",
            "The model is hydrated from the snapshot without touching the database at all",
          ],
          correctIndex: 0,
          explanation:
            "Only the identifier travels; hydration re-queries the model. That is also why the ID is locked automatically — it is the one field an attacker would most like to change.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-livewire-q7",
          prompt: "What does adding `wire:key` to items inside a loop accomplish?",
          options: [
            "It gives the DOM-diffing algorithm a stable identity per item so state is not attached to the wrong element when the list reorders",
            "It caches each item's rendered HTML on the server between requests",
            "It marks the item as reactive so changes to it trigger a network request",
            "It prevents the item from being included in the serialised snapshot",
          ],
          correctIndex: 0,
          explanation:
            "This is the same problem React keys solve. Without a stable key, a reordered or filtered list can leave input values and child component state attached to the wrong row.",
        },
        {
          id: "lv-eco-livewire-q8",
          prompt: "A Livewire dashboard feels fast for the team in the same city as the server and sluggish for users on another continent. What is the underlying cause?",
          options: [
            "Every interaction is a round trip, so perceived responsiveness is bounded by network latency",
            "Livewire opens a WebSocket per component and long-haul connections drop",
            "The serialised snapshot is re-encrypted per request, which is CPU-bound",
            "Blade view compilation happens per request and scales with distance",
          ],
          correctIndex: 0,
          explanation:
            "This is the central trade of the server-driven model and the main reason to reach for Inertia or a client-side app when your users are globally distributed. Livewire uses ordinary HTTP requests, not WebSockets.",
        },
        {
          id: "lv-eco-livewire-q9",
          prompt: "Which of these are genuine advantages of Livewire over an Inertia + React setup for the same feature? (Select all that apply.)",
          options: [
            "Validation, authorisation and data access stay in one language and one mental model",
            "There is no separate client-side state store to keep in sync with the server",
            "Sensitive data can be used freely in components without it reaching the browser",
            "A junior team can ship interactive UI without learning a JavaScript framework",
            "The UI stays responsive when the network is slow or briefly unavailable",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "One language, one source of truth, and a lower skill floor are real wins. Sensitive data is not safe — public properties are serialised to the browser — and offline or high-latency responsiveness is exactly what Livewire gives up.",
        },
        {
          id: "lv-eco-livewire-q10",
          prompt: "What does the `.renderless` modifier on a live model binding do?",
          options: [
            "It sends the property update to the server without re-rendering the component's view",
            "It updates the property in the browser only and never contacts the server",
            "It renders the component but discards the DOM diff",
            "It defers the update until the next action, like the default behaviour",
          ],
          correctIndex: 0,
          explanation:
            "It is for properties the server needs to know about but whose change should not alter the markup — a search box that only affects a later submission, for example. Since it only affects the response, it is used together with `.live`.",
        },
        {
          id: "lv-eco-livewire-q11",
          prompt: "A large page is built from one Livewire component. A colleague suggests splitting it into several nested components. What is the main benefit, and the main cost?",
          options: [
            "Benefit: each child updates independently with a smaller payload. Cost: children are separate islands with their own state, so communication needs events or parameters",
            "Benefit: fewer HTTP requests overall. Cost: nested components cannot use `wire:model`",
            "Benefit: children render on the client. Cost: they cannot access the database",
            "Benefit: children share the parent's snapshot. Cost: any child update re-renders the whole tree",
          ],
          correctIndex: 0,
          explanation:
            "Nested components are independent units with their own lifecycle and snapshot, which is exactly why updates get cheaper and why sharing state becomes an explicit design question.",
        },
      ],
    },

    {
      id: "lv-eco-inertia",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Inertia, and Choosing Your Frontend",
      summary:
        "Inertia exists to answer one question: how do you get a React, Vue or Svelte frontend without building an API? Its answer is that you keep writing controllers that return views — except the \"view\" is a JavaScript page component and its props. Inertia's client library intercepts link clicks, issues an XHR with an `X-Inertia` header, and the server responds with JSON naming the component and its props instead of a full HTML document; the client swaps the page component and pushes history state. There is no REST layer, no client router, no duplicated authorisation, and no second repository.\n\nThat makes the three-way choice concrete. **Livewire** keeps state on the server and pays a round trip per interaction — best when your team is PHP-first and users are close to the server. **Inertia** keeps rendering on the client and state in components, so local interactions are instant, but you now maintain a real JavaScript application and its build, and you have to think about what you put in props because every prop is shipped to the browser. **A separate SPA with its own API** is the only option that lets the frontend deploy independently, serve a mobile client from the same API, or be owned by a different team — and it costs you the API, its auth, its versioning and its deployment.\n\nThe trap with Inertia is treating props as free. Every page response sends every prop, so a page with a heavy sidebar dataset re-sends it on each visit. Partial reloads (`only` and `except`), deferred props and shared data exist precisely to control that, and using them well is the difference between an Inertia app that feels like an SPA and one that feels like a slow server-rendered page.",
      level: "advanced",
      estMinutes: 65,
      isMilestone: true,
      webRefs: [
        { label: "Inertia: How It Works", url: "https://inertiajs.com/docs/v3/core-concepts/how-it-works", kind: "docs" },
        { label: "Inertia: The Protocol", url: "https://inertiajs.com/docs/v3/core-concepts/the-protocol", kind: "spec" },
        { label: "Inertia: Partial Reloads", url: "https://inertiajs.com/docs/v3/data-props/partial-reloads", kind: "docs" },
        { label: "Inertia: Who Is Inertia.js For?", url: "https://inertiajs.com/docs/v3/core-concepts/who-is-it-for", kind: "article" },
      ],
      video: {
        title: "Laravel Livewire vs. React/Svelte/Vue (Inertia)",
        channel: "Josh Cirre",
        url: "https://www.youtube.com/watch?v=6ZmypXuwcLU",
        videoId: "6ZmypXuwcLU",
        durationLabel: "12:44",
      },
      alternateVideos: [
        {
          title: "Inertia 2.0: It's like Next but better (and you can use React!)",
          channel: "Theo - t3․gg",
          url: "https://www.youtube.com/watch?v=OpXLWJd2iO0",
          videoId: "OpXLWJd2iO0",
          durationLabel: "19:01",
        },
        {
          title: "So We Tried to Build a Project with Livewire vs Vue vs React... (showdown)",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=ibnzNYFDofM",
          videoId: "ibnzNYFDofM",
          durationLabel: "14:18",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-inertia-q1",
          prompt: "What does an Inertia-aware Laravel controller actually return to the browser during a client-side visit?",
          options: [
            "A JSON response naming the page component and its props, which the client swaps in",
            "A full HTML document that the client parses and re-mounts",
            "A GraphQL response the client normalises into a cache",
            "A server-rendered HTML fragment that replaces part of the DOM",
          ],
          correctIndex: 0,
          explanation:
            "Inertia's protocol keys off the `X-Inertia` header: full HTML on the first load, JSON component-plus-props thereafter. Nothing is normalised or diffed as markup.",
        },
        {
          id: "lv-eco-inertia-q2",
          prompt: "Which problems does Inertia remove compared with building a separate SPA against a REST API? (Select all that apply.)",
          options: [
            "Designing, versioning and documenting an API surface",
            "Duplicating authorisation rules across server and client",
            "Maintaining a client-side router alongside your server routes",
            "The need to write and build JavaScript components at all",
            "The need to think about what data is sent to the browser",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Inertia removes the API layer, its duplicated auth and the parallel routing table. You still write a real JavaScript app, and props are still data leaving your server.",
        },
        {
          id: "lv-eco-inertia-q3",
          prompt: "Your app must also serve a native mobile client. How does that change the Livewire / Inertia / separate-SPA decision?",
          options: [
            "It pushes strongly toward a real API; Inertia's responses are shaped for its own client, and Livewire has no API surface at all",
            "It makes no difference — Inertia pages can be consumed directly by a mobile app",
            "It favours Livewire, because server-rendered HTML works in a WebView",
            "It favours Inertia, because its JSON responses are a REST API",
          ],
          correctIndex: 0,
          explanation:
            "Inertia's JSON is a page payload, not a resource API. A second non-web client is one of the clearest reasons to pay for a real API — though you can add API routes alongside an Inertia app rather than abandoning it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-inertia-q4",
          prompt: "A controller passes `'user' => $request->user()` as an Inertia prop so the page can show the user's name. What should worry you?",
          options: [
            "The whole model is serialised into the page payload, including any attribute not hidden on the model",
            "Passing models as props is not supported; only scalars can be props",
            "The model is re-fetched on every partial reload regardless of `only`",
            "Inertia rejects props larger than 64 KB",
          ],
          correctIndex: 0,
          explanation:
            "Props are JSON sent to the browser. Passing a whole model leaks whatever `$hidden` does not cover — pick fields explicitly, or use an API resource.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-inertia-q5",
          prompt: "An Inertia page sends a 2 MB `permissions` prop shared by every page, and navigation feels heavy. Which tools address this directly? (Select all that apply.)",
          options: [
            "Partial reloads, so a visit requests only the props that changed",
            "Deferred props, so expensive data loads after the page renders",
            "Trimming the shared data to what the layout genuinely needs",
            "Enabling server-side rendering, which removes props from the response",
            "Adding a client-side router to skip Inertia visits",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The three real levers are asking for less, asking later, and sharing less. SSR improves first paint and SEO but still sends the props, and replacing Inertia's router defeats the point.",
        },
        {
          id: "lv-eco-inertia-q6",
          prompt: "Why does Inertia need an asset version in its responses?",
          options: [
            "So that after a deploy the client can detect stale assets and do a full page reload instead of running old JavaScript against a new server",
            "So the server can decide which page component to render",
            "So browsers can cache page props between visits",
            "So the build can strip unused components from the bundle",
          ],
          correctIndex: 0,
          explanation:
            "It is the answer to the classic long-lived-SPA problem: a user with the page open through a deploy would otherwise keep running the previous bundle. Nothing about it affects component selection or bundling.",
        },
        {
          id: "lv-eco-inertia-q7",
          prompt: "Which statement best captures when a separate SPA with its own API is worth its cost?",
          options: [
            "When the frontend must deploy independently, be owned by another team, or serve clients beyond the browser",
            "Whenever the application has more than a handful of interactive pages",
            "Whenever the team prefers React to Blade",
            "Whenever the app needs real-time updates over WebSockets",
          ],
          correctIndex: 0,
          explanation:
            "The cost buys independence — separate deploys, separate ownership, multiple clients. Preferring React is satisfied by Inertia, and broadcasting works fine in all three architectures.",
        },
        {
          id: "lv-eco-inertia-q8",
          prompt: "A form submits via Inertia and validation fails. What does the server send back?",
          options: [
            "A redirect back, with the validation errors flashed and exposed to the page as an errors prop",
            "A 422 JSON response the page component must parse itself",
            "A full HTML re-render of the form with old input",
            "A 200 response containing the next page component, with errors in a header",
          ],
          correctIndex: 0,
          explanation:
            "Inertia keeps the classic server-side redirect-with-errors flow, which is why Laravel's `$request->validate()` works unchanged. That is the whole appeal: no client-side validation plumbing to duplicate.",
        },
        {
          id: "lv-eco-inertia-q9",
          prompt: "Your team is PHP-first, the app is an internal tool used from one office, and the UI is mostly forms and tables. Which choice is easiest to defend?",
          options: [
            "Livewire — the round trip is cheap on a LAN and the team never leaves PHP",
            "Inertia with React — forms and tables benefit most from client-side rendering",
            "A separate SPA — internal tools change most often and need independent deploys",
            "Blade with jQuery — the least new technology to learn",
          ],
          correctIndex: 0,
          explanation:
            "Livewire's one real cost, latency, is near zero here, and its one real benefit, staying in PHP, is at its maximum. Nothing about the scenario justifies a second application to maintain.",
        },
        {
          id: "lv-eco-inertia-q10",
          prompt: "What does enabling Inertia SSR actually change?",
          options: [
            "A Node process renders the first response's HTML on the server, improving first paint and crawlability; the client then hydrates as usual",
            "Page components are compiled to PHP so Node is no longer needed in production",
            "Props are rendered on the server and omitted from the response to save bandwidth",
            "Subsequent visits become server-rendered too, removing client-side routing",
          ],
          correctIndex: 0,
          explanation:
            "SSR is a first-response optimisation and adds a second long-running process to operate. After hydration, navigation is client-side exactly as before.",
        },
        {
          id: "lv-eco-inertia-q11",
          prompt: "Which of these is a fair criticism of Inertia rather than a misunderstanding?",
          options: [
            "Your frontend is coupled to your Laravel app's routes and deploys, so it cannot ship independently",
            "You have to write a REST API anyway, so the saving is illusory",
            "It only works with Vue, so React teams cannot use it",
            "Authorisation must be reimplemented in JavaScript because the server is not consulted",
          ],
          correctIndex: 0,
          explanation:
            "Coupling is the genuine trade-off and the exact thing a separate SPA buys back. The other three are false: no API is required, React and Svelte are first-class, and authorisation stays in PHP.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-inertia-q12",
          prompt: "A team adopts Inertia and then adds Redux to hold the current user, permissions and the sidebar's data. What is the concern?",
          options: [
            "Inertia already sends that state as props on every page, so a parallel store reintroduces the synchronisation problem Inertia was chosen to avoid",
            "Redux cannot be used in an Inertia application",
            "Shared props are encrypted and cannot be read by a store",
            "Redux forces server-side rendering to be disabled",
          ],
          correctIndex: 0,
          explanation:
            "Server-owned state arriving as props is the core idea; duplicating it client-side means two sources of truth that drift. Local UI state in a store is fine — mirroring server state is not.",
        },
      ],
    },

    {
      id: "lv-eco-telescope",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Telescope: Seeing Inside a Request",
      summary:
        "Telescope answers the question \"what did that request actually do?\". Watchers hook framework events and record every query with its bindings and duration, every job, mail, notification, cache hit and miss, every outgoing HTTP call, every exception and every `dump()`, then present them grouped by request in a local dashboard. It is the fastest way to find an N+1 query, to see the payload a queued job was dispatched with, or to read the email your app just \"sent\" without wiring up a mail catcher.\n\nThe cost is that it records everything, per request, into your database. The `telescope_entries` table grows alarmingly fast on any application with real traffic, which is why Telescope ships a `telescope:prune` command (24 hours of retention by default) and why the documented install for local-only use is `--dev`. Leaving Telescope enabled in production with the default filter is a genuine incident waiting to happen: heavy writes on every request, and a dashboard containing request payloads and query bindings — that is, credentials and personal data — behind nothing but a gate you may not have configured. The docs warn explicitly that if `APP_ENV` is not `production`, the dashboard is publicly available.\n\nThe right mental model is that Telescope is a debugger, not a monitor. It answers detailed questions about individual requests you already know are interesting; it will not tell you that p95 latency doubled overnight. That is Pulse's job, and the two are complements rather than alternatives.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Telescope", url: "https://laravel.com/framework/docs/13.x/telescope", kind: "docs" },
        { label: "Laravel: Pulse", url: "https://laravel.com/framework/docs/13.x/pulse", kind: "docs" },
        { label: "laravel/telescope", url: "https://github.com/laravel/telescope", kind: "repo" },
      ],
      video: {
        title: "Telescope - Debug locally like a pro",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=ribLN3pRyQc",
        videoId: "ribLN3pRyQc",
        durationLabel: "4:12",
      },
      alternateVideos: [
        {
          title: "Laravel Telescope: Monitor and Debug Slow API Queries",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=rrqNbzR_0pk",
          videoId: "rrqNbzR_0pk",
          durationLabel: "2:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-telescope-q1",
          prompt: "Which question is Telescope the right tool for?",
          options: [
            "\"Which 14 queries did this one page load run, and with what bindings?\"",
            "\"Has average response time degraded over the last week?\"",
            "\"Which of my queue workers is saturated right now?\"",
            "\"How many unique users hit the app yesterday?\"",
          ],
          correctIndex: 0,
          explanation:
            "Telescope records the full detail of individual requests, which is exactly what finding an N+1 needs. Trends, worker saturation and aggregate usage are monitoring questions, and Pulse or Horizon answer them.",
        },
        {
          id: "lv-eco-telescope-q2",
          prompt: "Why does the documentation suggest installing Telescope with `composer require laravel/telescope --dev` for local use?",
          options: [
            "So the package is never installed in production, where its per-request writes and stored payloads are a liability",
            "Because the production autoloader cannot resolve Telescope's service provider",
            "Because `--dev` enables the extra watchers that only work locally",
            "Because Telescope requires a dev database driver such as SQLite",
          ],
          correctIndex: 0,
          explanation:
            "It is a deployment decision, not a technical constraint: `--dev` keeps Telescope out of `composer install --no-dev` on the server entirely.",
        },
        {
          id: "lv-eco-telescope-q3",
          prompt: "A team enabled Telescope in production and now their primary database is under heavy write load and nearly full. What went wrong? (Select all that apply.)",
          options: [
            "Every request writes multiple entries into `telescope_entries`",
            "`telescope:prune` was never scheduled, so nothing was ever deleted",
            "The default filter records everything when the app is in the local environment, and their `APP_ENV` was not set to `production`",
            "Telescope replicates its data to every queue worker",
            "Telescope disables query caching while it is active",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Per-request writes plus no pruning plus an unfiltered environment is the classic three-part failure. Telescope neither replicates data to workers nor touches query caching.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-telescope-q4",
          prompt: "`telescope:prune` is scheduled daily with no options. What does it delete?",
          options: [
            "Entries older than 24 hours",
            "All entries, keeping the table empty between runs",
            "Entries older than 7 days",
            "Nothing until the table exceeds a configured size",
          ],
          correctIndex: 0,
          explanation:
            "24 hours is the default retention; `--hours=48` and friends adjust it. It never truncates the table wholesale, and it has no size-based trigger.",
        },
        {
          id: "lv-eco-telescope-q5",
          prompt: "You deploy a staging app with Telescope installed and `APP_ENV=staging`. What is the security consequence if you never touched the gate?",
          options: [
            "The Telescope dashboard is reachable by anyone, exposing request payloads and query bindings",
            "Telescope refuses to record anything outside `local`, so there is nothing to expose",
            "The dashboard requires the `APP_KEY` as a password by default",
            "Telescope only serves the dashboard over localhost regardless of environment",
          ],
          correctIndex: 0,
          explanation:
            "The `viewTelescope` gate only restricts access outside the local environment if you define it, and the docs warn that a non-production `APP_ENV` leaves the installation publicly available.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-telescope-q6",
          prompt: "You want Telescope in production but only for exceptions, failed jobs and slow queries. What is the mechanism?",
          options: [
            "The `Telescope::filter` closure in `TelescopeServiceProvider`, which the default scaffolding already writes for exactly this",
            "Deleting unwanted watchers from `config/telescope.php` is the only option",
            "A `TELESCOPE_PRODUCTION_MODE` environment variable",
            "Running `telescope:prune --only=exceptions` on a schedule",
          ],
          correctIndex: 0,
          explanation:
            "The generated provider already ships a filter that records everything locally and only reportable exceptions, failed jobs, scheduled tasks, slow queries and monitored tags elsewhere. Disabling watchers is a blunter, coarser tool.",
        },
        {
          id: "lv-eco-telescope-q7",
          prompt: "What is a `filterBatch` closure for, as distinct from `filter`?",
          options: [
            "It decides whether to keep all of a request's entries together, so you can retain full context for requests that contained something interesting",
            "It batches writes so entries are inserted in one statement",
            "It filters queued jobs only, as opposed to HTTP requests",
            "It applies the filter retroactively when pruning",
          ],
          correctIndex: 0,
          explanation:
            "Keeping the whole batch is what makes a retained exception useful — you get the queries and cache calls that led up to it, not a lone stack trace.",
        },
        {
          id: "lv-eco-telescope-q8",
          prompt: "Which of these does a Telescope watcher record out of the box? (Select all that apply.)",
          options: [
            "Every database query with its bindings and duration",
            "Outgoing HTTP client requests and their responses",
            "Mail that the application sent, with a preview",
            "CPU and memory usage of each application server",
            "Per-endpoint p95 latency over the last week",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Telescope records per-request artefacts. Server resource usage and rolling latency percentiles are aggregate monitoring, which is Pulse's territory.",
        },
        {
          id: "lv-eco-telescope-q9",
          prompt: "A junior engineer says \"we have Telescope, so we don't need any monitoring\". What is the most accurate correction?",
          options: [
            "Telescope answers detailed questions about requests you already suspect; it does not aggregate, alert or show trends",
            "Telescope covers monitoring but has no alerting, which can be added separately",
            "Telescope is fine for monitoring as long as pruning is configured",
            "Telescope replaces monitoring but not logging",
          ],
          correctIndex: 0,
          explanation:
            "The distinction is debugger versus monitor. Telescope stores individual entries and shows them to you; nothing in it aggregates over time or tells you when something changed.",
        },
        {
          id: "lv-eco-telescope-q10",
          prompt: "Your app is served by Octane and Telescope is installed locally. Which caveat applies?",
          options: [
            "Telescope's per-request data still accumulates in memory-resident state, so it adds to the memory pressure of a long-lived worker",
            "Telescope cannot be used with Octane at all",
            "Telescope silently records only the first request each worker handles",
            "Octane disables all service providers, so Telescope never boots",
          ],
          correctIndex: 0,
          explanation:
            "Telescope works under Octane, but a tool that buffers entries per request deserves scrutiny in a process that never dies. Octane boots providers once per worker rather than disabling them.",
        },
      ],
    },

    {
      id: "lv-eco-pulse",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Pulse: Production Health at a Glance",
      summary:
        "Pulse is the aggregate counterpart to Telescope. Rather than recording every request, its recorders capture summarised signals — slow queries, slow requests, slow jobs, slow outgoing HTTP calls, exception counts, cache hit rates, queue depth, server CPU and memory — and render them as a dashboard of cards over a rolling window. The questions it answers are \"is anything worse than it was yesterday?\" and \"which endpoint is responsible?\", not \"what did request 8f3a do?\".\n\nBeing designed for production means Pulse has to earn its keep on a busy box. By default it writes entries to your database after the response has been sent, which is cheap but still a write per interesting event; on high-traffic applications you enable sampling on the heavier recorders and switch the ingest driver to Redis, so entries land on a stream and a separate `pulse:work` process moves them into the database. The servers card needs a `pulse:check` daemon on each machine. All of these are long-lived processes, so `pulse:restart` belongs in your deploy script — and the Redis ingest should use a different Redis connection from your queue.\n\nThe decision worth internalising is that Pulse is a good first-party dashboard, not an APM. It does not do distributed tracing, per-request timelines or alerting, and its data lives in your own database rather than in a vendor's. If you need alerts and traces, that is what Laravel's hosted Nightwatch or a third-party APM is for; Pulse is what you reach for when you want to see the shape of your application's health without paying for or operating any of that.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel: Pulse", url: "https://laravel.com/framework/docs/13.x/pulse", kind: "docs" },
        { label: "Laravel: Telescope", url: "https://laravel.com/framework/docs/13.x/telescope", kind: "docs" },
        { label: "Laravel Nightwatch", url: "https://laravel.com/nightwatch", kind: "article" },
      ],
      video: {
        title: "Getting Started with Laravel Pulse 💗",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=di9fYHxdZ-8",
        videoId: "di9fYHxdZ-8",
        durationLabel: "19:09",
      },
      alternateVideos: [
        {
          title: "Customizing Laravel Pulse",
          channel: "Aaron Francis",
          url: "https://www.youtube.com/watch?v=oFxcWcP6bVE",
          videoId: "oFxcWcP6bVE",
          durationLabel: "21:42",
        },
        {
          title: "Laravel Nightwatch vs. Pulse",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=LNARw-SoTJs",
          videoId: "LNARw-SoTJs",
          durationLabel: "2:19",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-pulse-q1",
          prompt: "What is the fundamental difference in what Telescope and Pulse store?",
          options: [
            "Telescope stores per-request detail for debugging; Pulse stores aggregated signals over a rolling window",
            "Telescope stores data in Redis; Pulse stores it in the database",
            "Telescope is read-only; Pulse can also mutate application state",
            "Telescope samples requests; Pulse records every one",
          ],
          correctIndex: 0,
          explanation:
            "Detail versus aggregate is the whole distinction, and it explains why one is a local debugger and the other is safe to run in production. Both can use the database, and it is Pulse that offers sampling.",
        },
        {
          id: "lv-eco-pulse-q2",
          prompt: "Your app serves thousands of requests a minute and Pulse's database writes are now a visible cost. Which steps directly address that? (Select all that apply.)",
          options: [
            "Enable sampling on the heavier recorders so only a fraction of events are captured",
            "Switch `PULSE_INGEST_DRIVER` to Redis and run `pulse:work` to drain the stream",
            "Raise the slow-query and slow-request thresholds so fewer events qualify",
            "Schedule `pulse:check` more frequently",
            "Move the Pulse dashboard behind a gate",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Sampling, buffered ingest and higher thresholds all reduce writes on the request path. `pulse:check` polls server metrics, and gating the dashboard is an access control, not a performance measure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-pulse-q3",
          prompt: "The Servers card shows no data even though Pulse is installed and other cards work. What is missing?",
          options: [
            "The `pulse:check` daemon is not running on the servers you want to monitor",
            "The Redis ingest driver has not been enabled",
            "The servers recorder requires the Octane runtime",
            "`pulse:restart` has not been run since the last deploy",
          ],
          correctIndex: 0,
          explanation:
            "Most recorders hook framework events, but CPU, memory and disk have to be polled, which is what the `pulse:check` daemon does on each machine.",
        },
        {
          id: "lv-eco-pulse-q4",
          prompt: "Why must `pulse:restart` be part of your deployment script?",
          options: [
            "`pulse:check` and `pulse:work` are long-lived processes that hold old code in memory until restarted",
            "The Pulse dashboard caches its HTML and will otherwise serve the previous version",
            "Pulse's database tables must be re-created on every deploy",
            "Restarting resets the rolling window so the dashboard shows post-deploy data only",
          ],
          correctIndex: 0,
          explanation:
            "It is the same reason queue workers need restarting: a booted PHP process does not pick up new code. Nothing is truncated or re-created.",
        },
        {
          id: "lv-eco-pulse-q5",
          prompt: "The docs warn that the Redis ingest should use a different Redis connection from your queue. Why does that matter?",
          options: [
            "Pulse's stream and the queue would otherwise contend for the same instance, so a burst of telemetry can slow job processing (and commands like `flushdb` hit both)",
            "Laravel forbids two features sharing a Redis connection",
            "The queue serialises data in a format Pulse cannot read",
            "Redis streams and queue lists cannot coexist in one database",
          ],
          correctIndex: 0,
          explanation:
            "It is an isolation argument: monitoring should not be able to degrade the thing it monitors, and operational commands aimed at one should not wipe the other. Nothing technical prevents sharing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-pulse-q6",
          prompt: "Which of these can Pulse tell you out of the box? (Select all that apply.)",
          options: [
            "Which queries exceeded your configured slow threshold, and how often",
            "Which users are generating the most requests",
            "Cache hit and miss rates, grouped by key pattern",
            "A per-request timeline showing time spent in each downstream service",
            "Which line of code threw a given exception, with the full stack",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Slow queries, application usage and cache behaviour are Pulse cards. Distributed traces and full stack traces per exception are APM and debugger features respectively.",
        },
        {
          id: "lv-eco-pulse-q7",
          prompt: "A team wants alerting when the error rate spikes at 3 a.m. Is Pulse the answer?",
          options: [
            "No — Pulse is a dashboard with no alerting; that needs Nightwatch or a third-party APM",
            "Yes — Pulse's exceptions card sends notifications when a threshold is crossed",
            "Yes, once `pulse:check` is scheduled with the `--alert` flag",
            "No, but Telescope can alert instead",
          ],
          correctIndex: 0,
          explanation:
            "Knowing the difference between something you look at and something that pages you is the point. Neither Pulse nor Telescope alerts.",
        },
        {
          id: "lv-eco-pulse-q8",
          prompt: "What is the real trade-off of Pulse keeping its data in your own database rather than in a vendor's service?",
          options: [
            "No third party sees your telemetry and there is nothing to pay for, but your database absorbs the load and you lose the retention, correlation and alerting a hosted product provides",
            "There is no trade-off; self-hosted telemetry is strictly better",
            "It means Pulse data cannot be queried with SQL",
            "It requires a separate database server, which hosted tools do not",
          ],
          correctIndex: 0,
          explanation:
            "Data ownership and cost on one side; load and missing features on the other. Being in your database is precisely what makes it queryable with SQL.",
        },
        {
          id: "lv-eco-pulse-q9",
          prompt: "Your slow-requests card is dominated by one endpoint. What is the natural next step?",
          options: [
            "Reproduce that endpoint locally with Telescope to see its queries and outgoing calls in detail",
            "Increase the slow-request threshold so it stops appearing",
            "Enable sampling on the slow-requests recorder",
            "Add a custom Pulse card that logs the full request payload in production",
          ],
          correctIndex: 0,
          explanation:
            "Pulse points; Telescope explains. Raising the threshold hides the symptom, and recording full payloads in production is the Telescope-in-production mistake all over again.",
        },
        {
          id: "lv-eco-pulse-q10",
          prompt: "Reverb can report into Pulse. What does enabling that integration require operationally?",
          options: [
            "Running the `pulse:check` daemon on the Reverb server — and on exactly one server if Reverb is scaled horizontally",
            "Enabling the Redis ingest driver, which Reverb metrics require",
            "Running `pulse:work` on every Reverb node so each publishes its own connections",
            "Nothing beyond installing Pulse; connection counts are captured from framework events",
          ],
          correctIndex: 0,
          explanation:
            "Connection activity is polled rather than event-driven, so it needs the check daemon — and running it on several nodes would double-count the same aggregate.",
        },
      ],
    },

    {
      id: "lv-eco-horizon",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Horizon: Redis Queues You Can See",
      summary:
        "Without Horizon, queue workers are a set of `queue:work` invocations scattered across Supervisor configs on each server: opaque, hand-tuned, and impossible to review. Horizon replaces that with a single version-controlled `config/horizon.php` describing supervisors per environment, plus a dashboard showing throughput, runtime, wait times, tags, recent jobs and failures. The configuration being code is the real win — scaling a queue becomes a pull request rather than an SSH session.\n\nIt buys that with a hard constraint: Horizon requires Redis as the queue driver and is not compatible with Redis Cluster. If your queue is on SQS or the database, Horizon is not an option, and that is a decision you make when you choose the queue driver, not later. Horizon also reserves a Redis connection named `horizon` for its own bookkeeping.\n\nThe operational subtleties are where teams get hurt. The `auto` balancing strategy moves workers between queues based on load, using a configurable `autoScalingStrategy` of `time`, `size` or `log` — and because it allocates by load, the order of queues in a supervisor no longer expresses priority. If you genuinely need one queue to win, you define separate supervisors with their own process budgets. Timeouts must be layered correctly: the supervisor's timeout has to exceed any job-level timeout and sit a few seconds below `retry_after`, or jobs get killed mid-flight or processed twice. And because a worker is a long-lived PHP process, `horizon:terminate` belongs in every deploy, and `horizon:snapshot` on a schedule is what makes the metrics graphs exist at all.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel: Horizon", url: "https://laravel.com/framework/docs/13.x/horizon", kind: "docs" },
        { label: "Laravel: Queues", url: "https://laravel.com/framework/docs/13.x/queues", kind: "docs" },
        { label: "laravel/horizon", url: "https://github.com/laravel/horizon", kind: "repo" },
      ],
      video: {
        title: "Laravel Horizon: queue monitoring + configuration",
        channel: "Aaron Francis",
        url: "https://www.youtube.com/watch?v=r3c_qBvAHXA",
        videoId: "r3c_qBvAHXA",
        durationLabel: "14:53",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-horizon-q1",
          prompt: "Your application's queue connection is SQS. Can you use Horizon?",
          options: [
            "No — Horizon requires the Redis queue driver, so this is a decision made when choosing the driver",
            "Yes, with the `horizon-sqs` adapter package",
            "Yes, but only the dashboard works; auto-balancing is disabled",
            "Yes — Horizon reads jobs through Laravel's queue abstraction, so any driver works",
          ],
          correctIndex: 0,
          explanation:
            "Horizon's balancing and metrics depend on Redis data structures, and the docs state the requirement plainly. It is also not compatible with Redis Cluster.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-horizon-q2",
          prompt: "What does Horizon actually replace in a pre-Horizon setup?",
          options: [
            "Hand-written Supervisor configs of `queue:work` commands, by moving worker configuration into version-controlled PHP",
            "Redis itself, by providing its own job storage",
            "The `Queueable` job classes, which Horizon jobs must extend",
            "The scheduler, which Horizon runs internally",
          ],
          correctIndex: 0,
          explanation:
            "Horizon is a supervisor manager and dashboard over your existing Redis queue. Your job classes, Redis and the scheduler are all unchanged.",
        },
        {
          id: "lv-eco-horizon-q3",
          prompt: "A supervisor lists `'queue' => ['high', 'default']` with `balance => 'auto'`. A colleague assumes `high` is drained first. Are they right?",
          options: [
            "No — with `auto` balancing the order carries no priority; workers are allocated by load according to the `autoScalingStrategy`",
            "Yes — Horizon always processes queues left to right",
            "Yes, but only while `high` has fewer than `minProcesses` jobs",
            "No — order is ignored entirely, including under the `simple` strategy",
          ],
          correctIndex: 0,
          explanation:
            "This is the classic Horizon surprise: list order expresses priority in plain `queue:work`, but `auto` balancing replaces that with load-based allocation. Real priority needs separate supervisors with explicit process budgets.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-horizon-q4",
          prompt: "What do the three `autoScalingStrategy` options control?",
          options: [
            "How Horizon measures queue demand: `time` by estimated time to clear, `size` by job count, `log` by the logarithm of job count",
            "How quickly Horizon scales: slow, medium and fast",
            "Which metrics are recorded for the dashboard graphs",
            "How failed jobs are retried: immediately, with backoff, or never",
          ],
          correctIndex: 0,
          explanation:
            "The strategies differ in how demand is measured. `log` exists so one enormous queue does not take a disproportionate share of workers away from smaller ones.",
        },
        {
          id: "lv-eco-horizon-q5",
          prompt: "A job has a 120-second `timeout`. The supervisor's `timeout` is 60 and `retry_after` in `config/queue.php` is 90. What goes wrong? (Select all that apply.)",
          options: [
            "The worker kills jobs at 60 seconds, so the job's own 120-second budget is never honoured",
            "With `retry_after` below the job's runtime, the queue can hand the same job to a second worker while the first is still running",
            "Jobs can therefore be processed twice, which breaks anything that is not idempotent",
            "Horizon refuses to start when the timeouts are inconsistent",
            "The dashboard silently hides jobs affected by the mismatch",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The documented rule is that the worker timeout must exceed any job timeout and sit a few seconds below `retry_after`. Horizon does not validate this for you, and nothing is hidden — you just get duplicate work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-horizon-q6",
          prompt: "Why must `horizon:terminate` run as part of every deployment?",
          options: [
            "Workers are long-lived PHP processes holding the old code in memory; terminating lets them finish current jobs and be restarted with the new code",
            "It clears the Redis queue so stale jobs from the previous release do not run",
            "It releases the database connections held by the dashboard",
            "It regenerates `config/horizon.php` from the environment",
          ],
          correctIndex: 0,
          explanation:
            "It is a graceful restart: in-flight jobs complete, then the process exits and the process monitor starts it again. Queued jobs are deliberately not discarded.",
        },
        {
          id: "lv-eco-horizon-q7",
          prompt: "The Horizon metrics graphs are empty even though jobs are clearly being processed. What is missing?",
          options: [
            "`horizon:snapshot` is not scheduled, so no periodic metrics snapshots are being recorded",
            "The `metrics` recorder has not been enabled in `config/horizon.php`",
            "The dashboard gate is denying access to the metrics endpoints",
            "Jobs are not tagged, and metrics are keyed by tag",
          ],
          correctIndex: 0,
          explanation:
            "Graphs are built from snapshots taken on a schedule, typically every five minutes; `metrics.trim_snapshots` then caps how many are retained, which is what sets the effective window.",
        },
        {
          id: "lv-eco-horizon-q8",
          prompt: "Why would you silence a job in Horizon, via `silenced_tags` or the `Silenced` contract?",
          options: [
            "To keep an extremely high-volume, uninteresting job from flooding the recent-jobs list and drowning out the ones you care about",
            "To stop the job from being retried when it fails",
            "To prevent the job from being dispatched in certain environments",
            "To exclude the job from auto-balancing so it gets a dedicated worker",
          ],
          correctIndex: 0,
          explanation:
            "Silencing is purely about dashboard noise. Retries, dispatch conditions and worker allocation are configured elsewhere.",
        },
        {
          id: "lv-eco-horizon-q9",
          prompt: "Which of these are things Horizon gives you that plain `queue:work` does not? (Select all that apply.)",
          options: [
            "Version-controlled worker configuration per environment",
            "Automatic scaling of worker processes between queues based on load",
            "A dashboard showing throughput, runtime and failed jobs with their payloads",
            "The ability to run jobs without a Redis or database queue driver",
            "Guaranteed exactly-once job execution",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Config-as-code, auto-scaling and visibility are the package. Horizon narrows your driver choice rather than widening it, and exactly-once delivery is not something any of this provides — idempotent jobs are still your responsibility.",
        },
        {
          id: "lv-eco-horizon-q10",
          prompt: "Setting `maxProcesses` to 0 for a supervisor has what effect?",
          options: [
            "The supervisor spawns no worker processes at all, which is a way to stop consuming a queue without deleting the config",
            "It removes the cap, so Horizon scales without limit",
            "It falls back to one process per CPU core",
            "Horizon fails to boot with a configuration error",
          ],
          correctIndex: 0,
          explanation:
            "Zero means zero: a documented way to park a supervisor. Removing the cap is not an option, which is deliberate — an unbounded worker count would happily exhaust the box.",
        },
        {
          id: "lv-eco-horizon-q11",
          prompt: "Horizon is installed and the dashboard works locally, but on production it returns a 403 for everyone including admins. What is the most likely cause?",
          options: [
            "The `viewHorizon` gate was never defined for non-local environments, so nobody is authorised",
            "Horizon requires the Redis ingest driver in production",
            "The dashboard's assets were not published during the deploy",
            "`horizon:snapshot` has not run yet, so the dashboard has nothing to authorise against",
          ],
          correctIndex: 0,
          explanation:
            "Outside the local environment the gate decides who gets in, and an undefined or overly narrow gate locks everyone out. Missing assets would produce an unstyled page, not a 403.",
        },
      ],
    },

    {
      id: "lv-eco-octane",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Octane and the Long-Lived Worker",
      summary:
        "PHP's defining operational property is that every request starts from nothing: bootstrap the framework, register providers, handle the request, discard everything. That is why PHP is so forgiving — a leak cannot outlive a request — and it is also pure overhead repeated thousands of times a second. Octane deletes it by booting your application once inside FrankenPHP, Swoole or RoadRunner and feeding requests to workers that stay in memory. The framework boot disappears from the critical path, and throughput on boot-heavy applications can improve severalfold.\n\nWhat you give up is the guarantee that made PHP forgiving. Service providers' `register` and `boot` run once per worker, not once per request, so anything captured at boot is captured forever. Inject the container, the request or the config repository into a singleton's constructor and every later request sees a stale object — with the request, that means wrong headers, wrong input, wrong user. Append to a `static` array in a controller and you have a leak that grows until the worker dies. Octane resets first-party framework state between requests and gracefully recycles a worker after 500 requests by default, but it cannot know about state your code invented.\n\nThe container's `scoped()` binding is the purpose-built answer: like `singleton()`, but flushed whenever the application begins a new lifecycle — a new Octane request or a new queued job. For anything resolved per request, `scoped()` is what `singleton()` should have been. The rest of the discipline is ordinary hygiene: resolve the request and container through helpers rather than holding references, pass request data into methods rather than constructors, watch memory during development, and put `octane:reload` in the deploy script, because otherwise your new code is sitting on disk while the old code keeps serving.",
      level: "expert",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Laravel: Octane", url: "https://laravel.com/framework/docs/13.x/octane", kind: "docs" },
        { label: "Laravel: Service Container (scoped bindings)", url: "https://laravel.com/framework/docs/13.x/container", kind: "docs" },
        { label: "FrankenPHP documentation", url: "https://frankenphp.dev/docs/", kind: "docs" },
        { label: "laravel/octane", url: "https://github.com/laravel/octane", kind: "repo" },
      ],
      video: {
        title: "Laravel Octane: supercharge your Laravel applications",
        channel: "Aaron Francis",
        url: "https://www.youtube.com/watch?v=YGBvdAWt0W8",
        videoId: "YGBvdAWt0W8",
        durationLabel: "8:33",
      },
      alternateVideos: [
        {
          title: "Behind Laravel Octane | Mateus Guimaraes at Laracon US 2024 in Dallas, TX",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=dOXXL-98Zbs",
          videoId: "dOXXL-98Zbs",
          durationLabel: "35:31",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-octane-q1",
          prompt: "Where does Octane's speed actually come from?",
          options: [
            "The framework is booted once per worker and kept in memory, so bootstrapping leaves the per-request critical path",
            "PHP code is compiled to native machine code ahead of time",
            "Requests are served from an HTTP cache in front of the application",
            "Database connections are pooled, which is the dominant saving",
          ],
          correctIndex: 0,
          explanation:
            "Removing repeated bootstrap is the mechanism. Octane does not compile PHP, is not a cache, and while persistent connections are a side effect, they are not the headline.",
        },
        {
          id: "lv-eco-octane-q2",
          prompt: "What does this binding do under Octane?\n\n```php\n$this->app->singleton(Service::class, function (Application $app) {\n    return new Service($app['request']);\n});\n```",
          options: [
            "The service captures whichever request was current when it was first resolved, and every later request sees that stale request's headers, input and user",
            "It works correctly, because Octane re-resolves singletons on each request",
            "It throws, because the request is unavailable during container resolution under Octane",
            "It works, but only if the service is resolved inside a controller rather than a provider",
          ],
          correctIndex: 0,
          explanation:
            "This is the canonical Octane bug and a serious one: it can serve one user's data to another. The fix is to inject a resolver closure, pass the data into a method, or use the `request()` helper.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-octane-q3",
          prompt: "How does `$this->app->scoped(...)` differ from `$this->app->singleton(...)`?",
          options: [
            "A scoped instance is resolved once per lifecycle and flushed when a new one begins — a new Octane request or a new queued job",
            "A scoped instance is created fresh on every resolution, like `bind()`",
            "Scoped bindings are only available inside service providers",
            "Scoped bindings are stored in the session rather than the container",
          ],
          correctIndex: 0,
          explanation:
            "`scoped()` gives singleton-like reuse within one request or job and guarantees nothing leaks into the next. That flush is precisely what makes it Octane-safe.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-octane-q4",
          prompt: "Which of these are genuine Octane hazards in application code? (Select all that apply.)",
          options: [
            "Appending to a `static` array on each request",
            "Holding the container in a singleton's constructor",
            "Caching the authenticated user in a static property for convenience",
            "Using the `request()` helper inside a controller method",
            "Type-hinting `Illuminate\\Http\\Request` on a controller method",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that captures per-request state in a place that outlives the request is a hazard, and a cached user is a cross-request data leak. The helper and the controller type-hint both resolve the current request and are explicitly fine.",
        },
        {
          id: "lv-eco-octane-q5",
          prompt: "Why does Octane gracefully restart a worker after a number of requests by default?",
          options: [
            "As a safety net against slow memory leaks in application or extension code that Octane cannot detect",
            "To pick up code changes without a deploy step",
            "Because PHP cannot keep a socket open beyond a few hundred requests",
            "To rotate the database connection before it times out",
          ],
          correctIndex: 0,
          explanation:
            "`--max-requests` exists because no runtime can guarantee your code does not leak. It is not a code-reload mechanism — that is `octane:reload`.",
        },
        {
          id: "lv-eco-octane-q6",
          prompt: "You deploy new code to an Octane-served application and users keep seeing the old behaviour. What was forgotten?",
          options: [
            "`octane:reload`, which gracefully restarts the workers so the new code is loaded into memory",
            "`config:clear`, which Octane requires after every deploy",
            "`optimize:clear`, because Octane caches compiled views in memory",
            "Restarting Redis, which holds the booted application state",
          ],
          correctIndex: 0,
          explanation:
            "Workers hold the application in memory, so new files on disk change nothing until they restart. The caches mentioned are per-application concerns, and Redis holds no booted application.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-octane-q7",
          prompt: "Which application servers can Octane run on?",
          options: [
            "FrankenPHP, Swoole (and Open Swoole), and RoadRunner",
            "Only Swoole, which is why the PECL extension is required",
            "Nginx and Apache, using a persistent FPM pool",
            "Any PSR-7 compatible server, including plain PHP-FPM",
          ],
          correctIndex: 0,
          explanation:
            "Those three runtimes are what Octane supports; FrankenPHP is written in Go and installs its own binary. FPM is exactly the per-request model Octane replaces.",
        },
        {
          id: "lv-eco-octane-q8",
          prompt: "Your app boots quickly, is dominated by slow database queries, and runs on modest hardware. What should you expect from adopting Octane?",
          options: [
            "Little improvement — the time is in the queries, not in bootstrapping, so you would take on the state-leak risk for a small gain",
            "A large improvement, because Octane parallelises queries across workers",
            "A large improvement, because persistent connections eliminate query latency",
            "Slower responses, because keeping the app in memory adds overhead per request",
          ],
          correctIndex: 0,
          explanation:
            "Octane removes bootstrap time and nothing else. If bootstrap is not your bottleneck, the honest answer is to fix the queries first — the operational risk is not free.",
        },
        {
          id: "lv-eco-octane-q9",
          prompt: "Under Octane, when do a service provider's `register` and `boot` methods run?",
          options: [
            "Once per worker, when that worker boots the application, and never again for subsequent requests",
            "Once per request, exactly as under PHP-FPM",
            "Once per server process, shared by all workers",
            "Lazily, the first time something bound by the provider is resolved",
          ],
          correctIndex: 0,
          explanation:
            "This is the root of every other Octane caveat: anything decided at boot is decided once and then serves many requests.",
        },
        {
          id: "lv-eco-octane-q10",
          prompt: "How many request workers does Octane start by default, and what is the practical consequence?",
          options: [
            "One per CPU core, so memory use scales with core count — each worker holds a full copy of the booted application",
            "One, because PHP is single-threaded",
            "One per configured queue, matching Horizon's model",
            "As many as there are concurrent requests, spawned on demand",
          ],
          correctIndex: 0,
          explanation:
            "Workers are long-lived and each holds its own booted application, so memory planning matters far more than it does with short-lived FPM children.",
        },
        {
          id: "lv-eco-octane-q11",
          prompt: "A package you depend on registers a singleton that stores the current tenant, resolved from the request during boot. What is the correct response before enabling Octane?",
          options: [
            "Treat it as a blocker: verify or patch the package so tenant resolution happens per request, because otherwise one tenant's data can be served to another",
            "Enable Octane and add `--max-requests=1` so each worker handles a single request",
            "Enable Octane and rely on it resetting first-party framework state between requests",
            "Nothing — package code runs in an isolated container per request",
          ],
          correctIndex: 0,
          explanation:
            "Cross-tenant leakage is a correctness and security failure, not a performance nuance. Octane only resets framework state, `--max-requests=1` throws away the entire benefit, and there is no per-request isolation for package code.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-octane-q12",
          prompt: "Which of these does Octane reset for you between requests? (Select all that apply.)",
          options: [
            "First-party framework state, such as the current request and session",
            "Container bindings registered with `scoped()`",
            "Static properties your own classes populate",
            "Global variables set by a third-party package",
            "Memory allocated by a PHP extension",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Octane resets what it knows about — framework state and scoped bindings. Your statics, a package's globals and extension-level memory are all outside its knowledge, which is why the discipline falls to you.",
        },
      ],
    },

    {
      id: "lv-eco-scout",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Scout: Search Without Running a Search Cluster",
      summary:
        "Scout is a driver abstraction over search, and its value is that it lets you postpone — possibly forever — the decision to operate a search engine. Add the `Searchable` trait to a model and a model observer keeps the index in sync; `Model::search('star trek')` works the same whether the engine behind it is your own database, Meilisearch, Typesense, Algolia or Turbopuffer. The built-in `database` engine uses MySQL or PostgreSQL full-text indexes and `LIKE` with no extra infrastructure at all, and for most applications that genuinely is enough.\n\nYou upgrade when you need something a relational index does not do well: typo tolerance, relevance ranking people actually like, faceted filtering, synonyms, geo or vector search, or sub-50 ms queries over millions of documents. That is a real operational commitment — another service to run, secure, back up and keep in sync — so the honest framing is that you adopt an engine when a specific search requirement fails, not because search \"should\" be a separate system.\n\nTwo things reliably surprise people. First, indexing is eventually consistent: with `queue => true` Scout defers index writes to the queue, and Algolia and Meilisearch index asynchronously on their side regardless, so a record saved a moment ago may not appear in results yet. Tests that save and immediately search will flake. Second, Scout's `where()` is not Eloquent's: it supports simple equality and comparison filters that the engine can evaluate, not arbitrary SQL, joins or relationship constraints. When you need those, you search to get identifiers and then query the database — which is also why `collection` is only for prototypes, since it pulls every candidate row into PHP and filters there.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel: Scout", url: "https://laravel.com/framework/docs/13.x/scout", kind: "docs" },
        { label: "Laravel: Search", url: "https://laravel.com/framework/docs/13.x/search", kind: "docs" },
        { label: "Meilisearch documentation", url: "https://www.meilisearch.com/docs", kind: "docs" },
        { label: "laravel/scout", url: "https://github.com/laravel/scout", kind: "repo" },
      ],
      video: {
        title: "Lightning-Fast Laravel Search with Meilisearch: Build a Google-like Search Engine!",
        channel: "Glenn Raya",
        url: "https://www.youtube.com/watch?v=FY_x9_eX1AQ",
        videoId: "FY_x9_eX1AQ",
        durationLabel: "36:18",
      },
      alternateVideos: [
        {
          title: "Scout - Full-text search for Laravel",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=2s5E7tj1YVc",
          videoId: "2s5E7tj1YVc",
          durationLabel: "4:19",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-scout-q1",
          prompt: "A product search over 40,000 rows needs to be \"good enough\" and the team does not want another service to operate. What does Scout offer?",
          options: [
            "The `database` engine, which uses MySQL or PostgreSQL full-text indexes and needs no external service",
            "Nothing — Scout always requires an external engine such as Algolia or Meilisearch",
            "The `collection` engine, which is the production default for small datasets",
            "An embedded Meilisearch instance that Scout runs in-process",
          ],
          correctIndex: 0,
          explanation:
            "The database engine is the documented default answer for most applications. The collection engine loads candidates into PHP and is explicitly for prototypes and tests.",
        },
        {
          id: "lv-eco-scout-q2",
          prompt: "A feature test saves a model and immediately asserts it appears in `Model::search(...)`. It passes locally with the database engine and fails against Meilisearch. Why?",
          options: [
            "Indexing is asynchronous — Scout can queue the write, and Meilisearch indexes asynchronously on its side regardless of Scout's queue setting",
            "Meilisearch requires the model to be saved twice before it is indexed",
            "The `Searchable` trait does not register an observer for `created` events",
            "Scout only indexes models when `SCOUT_DRIVER` matches the test environment",
          ],
          correctIndex: 0,
          explanation:
            "The docs are explicit: even with queueing off, engines like Algolia and Meilisearch may not reflect a write immediately. The database engine has no separate index, which is why the test passes there.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-scout-q3",
          prompt: "Which of these are reasonable triggers for moving from the database engine to a dedicated search engine? (Select all that apply.)",
          options: [
            "Users expect results despite typos and near-misses",
            "The UI needs faceted filters with live counts per facet",
            "Search latency over millions of documents has become the page's bottleneck",
            "The result list needs to be paginated",
            "Search results must respect per-user authorisation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Typo tolerance, facets and scale are the things a relational full-text index does poorly. Pagination works in every engine, and authorisation is your application's job whichever engine you use.",
        },
        {
          id: "lv-eco-scout-q4",
          prompt: "What does `toSearchableArray()` on a model control?",
          options: [
            "Exactly which fields are sent to the index, which is both a relevance decision and a data-exposure decision",
            "Which models are eligible to be indexed at all",
            "The order in which results are returned",
            "How search results are hydrated back into Eloquent models",
          ],
          correctIndex: 0,
          explanation:
            "Everything in that array is copied into the engine, so leaving the default in place can push internal or personal fields into a third-party service. `shouldBeSearchable()` is what decides eligibility.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-scout-q5",
          prompt: "You try `Model::search('shoes')->whereHas('brand', fn ($q) => $q->where('active', true))->get()` and it does not work. Why?",
          options: [
            "Scout's query builder supports simple filters the engine can evaluate, not relationship constraints — it is not an Eloquent builder",
            "`whereHas` requires the model to be indexed with its relationships eager-loaded",
            "Relationship constraints only work with the database engine",
            "Scout requires `whereHas` to be called before `search`",
          ],
          correctIndex: 0,
          explanation:
            "Scout's builder is deliberately thin because the filtering happens inside the search engine. When you need relational logic, search for identifiers and then run an Eloquent query against them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-scout-q6",
          prompt: "Why does Scout recommend `'queue' => true` with a third-party engine?",
          options: [
            "So the HTTP request that saves a model does not wait on a network call to the search service",
            "Because those engines reject synchronous writes",
            "So indexing can be retried, since synchronous indexing has no failure handling",
            "Because queued indexing is the only way to keep the index consistent",
          ],
          correctIndex: 0,
          explanation:
            "It moves a third-party network call off the request path. It does make failures retryable as a bonus, but consistency is not improved — if anything it is deferred further.",
        },
        {
          id: "lv-eco-scout-q7",
          prompt: "In a write-heavy app, Scout is queueing many indexing jobs for the same records. What does Scout offer?",
          options: [
            "Unique indexing jobs, via the `MakeSearchableUniquely` and `RemoveFromSearchUniquely` classes, which use unique job locks to avoid duplicates",
            "A `scout:compact` command that merges pending jobs",
            "Automatic debouncing of index writes per model, on by default",
            "Nothing — duplicate indexing jobs are unavoidable",
          ],
          correctIndex: 0,
          explanation:
            "Opting into the unique job classes prevents a second job being queued for a record while a matching one is still pending. There is no built-in debounce or compaction command.",
        },
        {
          id: "lv-eco-scout-q8",
          prompt: "What is the `collection` engine for?",
          options: [
            "Prototypes, tiny datasets and tests — it pulls candidate records into PHP and filters them with string matching",
            "Searching Eloquent collections you have already loaded, as a performance optimisation",
            "Indexing collections of related models as a single document",
            "Production search when the dataset fits in the cache",
          ],
          correctIndex: 0,
          explanation:
            "It needs no index and no database-specific features, which makes it convenient and slow. The docs recommend the database engine for anything beyond trivial use.",
        },
        {
          id: "lv-eco-scout-q9",
          prompt: "A new engine is introduced and existing records need to appear in it. What do you run?",
          options: [
            "`scout:import` for each searchable model, to backfill the index from the database",
            "`scout:sync`, which continuously mirrors the database into the index",
            "Nothing — the observer indexes existing rows the first time they are searched",
            "`migrate:fresh --seed`, then let the observers index as records are created",
          ],
          correctIndex: 0,
          explanation:
            "Observers only fire on future writes, so the existing corpus needs an explicit backfill. Nothing indexes lazily at search time.",
        },
        {
          id: "lv-eco-scout-q10",
          prompt: "Search results must exclude records the current user may not see. Where does that belong?",
          options: [
            "In your application — either as an engine-evaluable filter on an indexed field, or by filtering after retrieval; the engine does not know your authorisation rules",
            "In the engine's configuration, which reads Laravel's gates",
            "In `toSearchableArray()`, which is evaluated per viewer at query time",
            "Nowhere — Scout applies the model's global scopes to search results automatically",
          ],
          correctIndex: 0,
          explanation:
            "Authorisation is yours. Indexing a tenant or visibility field and filtering on it is the common approach; `toSearchableArray()` runs at index time, not per viewer, and global scopes do not apply to a search query.",
        },
      ],
    },

    {
      id: "lv-eco-ai-sdk",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "The Laravel AI SDK",
      summary:
        "Laravel 13 ships a first-party AI SDK: `composer require laravel/ai` gives you one provider-agnostic API over OpenAI, Anthropic, Gemini, Groq, Mistral, xAI, Ollama and anything OpenAI-compatible, covering text generation, tool-calling agents, structured output, embeddings, images, audio and transcription. Its point is not that calling an HTTP API was hard; it is that every application that does so grows the same set of concerns — retries and failover, streaming to the browser, moving slow calls onto a queue, persisting conversation history, defining tools and their schemas, and testing any of it without hitting a provider. The SDK provides all of those as framework-shaped primitives.\n\nThe central abstraction is the agent: a PHP class with `instructions()`, optional `messages()` for conversation context, `tools()` for the functions the model may call, and `schema()` for structured output, generated with `make:agent` and prompted with `->prompt()`, `->stream()` or `->queue()`. Tools are classes with a description, a JSON-schema definition and a `handle()` method, which is the interesting part — the model chooses to call your PHP code, so a tool that writes to the database is a tool an LLM can be talked into invoking. Hence the `Approvable` contract for human approval on sensitive actions, which you should treat as the default for anything irreversible rather than an advanced feature.\n\nTwo details are worth holding onto. Failover across providers only triggers on failover-able exceptions — rate limits, provider overload, insufficient credits — not on a malformed request, so a bug in your prompt will not silently cost you money at a second vendor. And streaming a response straight from a route is convenient but ties up a PHP process for the duration; `queue()` with `then()`/`catch()` exists for the cases where the user does not have to watch the tokens arrive.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Laravel: AI SDK", url: "https://laravel.com/framework/docs/13.x/ai-sdk", kind: "docs" },
        { label: "Laravel: AI Assisted Development", url: "https://laravel.com/framework/docs/13.x/ai", kind: "docs" },
        { label: "Claude docs: Tool use overview", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview", kind: "docs" },
        { label: "laravel/ai", url: "https://github.com/laravel/ai", kind: "repo" },
      ],
      video: {
        title: "Laravel AI SDK Full Review: Agents, Images, Audio, Tools & More",
        channel: "nunomaduro",
        url: "https://www.youtube.com/watch?v=pE2yA25grGo",
        videoId: "pE2yA25grGo",
        durationLabel: "9:59",
      },
      alternateVideos: [
        {
          title: "Building AI Applications with the Laravel AI SDK",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=8MJ7r6niTus",
          videoId: "8MJ7r6niTus",
          durationLabel: "2:05:19",
        },
        {
          title: "Human Tool Approval With the Laravel AI SDK",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=9VAKbfh13u4",
          videoId: "9VAKbfh13u4",
          durationLabel: "9:57",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-ai-sdk-q1",
          prompt: "What does the Laravel AI SDK give you that writing your own HTTP client calls to a provider does not?",
          options: [
            "A provider-agnostic API plus framework-shaped primitives for agents, tools, structured output, streaming, queueing, failover and testing",
            "Cheaper token pricing through Laravel's bulk agreements with providers",
            "A locally hosted model so no external provider is needed",
            "Automatic prompt optimisation that rewrites your instructions",
          ],
          correctIndex: 0,
          explanation:
            "It is an abstraction and a set of conventions, not a commercial arrangement or a model. You still bring your own API keys and pay the provider directly.",
        },
        {
          id: "lv-eco-ai-sdk-q2",
          prompt: "An agent class implements `HasStructuredOutput` and defines a `schema()` method. What does that buy you?",
          options: [
            "The response comes back matching the schema you declared, so you can use it as data instead of parsing prose",
            "The prompt is validated against the schema before it is sent",
            "The conversation history is stored in the shape of the schema",
            "The model is restricted to tools whose parameters match the schema",
          ],
          correctIndex: 0,
          explanation:
            "Structured output is about constraining the response so the calling code gets typed data. Tool parameters have their own separate schemas.",
        },
        {
          id: "lv-eco-ai-sdk-q3",
          prompt: "You define a tool whose `handle()` method issues refunds. What should you do before shipping it?",
          options: [
            "Make it approvable — implement the `Approvable` contract so a human confirms before the action runs",
            "Rely on the system prompt telling the model never to refund without being asked",
            "Set the temperature to 0 so the model behaves deterministically",
            "Restrict the agent to a single provider so the behaviour is consistent",
          ],
          correctIndex: 0,
          explanation:
            "A tool is your code, invoked at a model's discretion. Prompt instructions are a request, not a control; approval is a control. Temperature and provider choice do not make an irreversible action safe.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-ai-sdk-q4",
          prompt: "You configure `provider: [Lab::OpenAI, Lab::Anthropic]` for failover. A prompt contains a malformed attachment and the first provider returns a 400. What happens?",
          options: [
            "No failover — only failover-able exceptions such as rate limits, overload and insufficient credits trigger it, so the error surfaces",
            "The request is retried on the second provider, which will also reject it",
            "The request is retried on the first provider with exponential backoff",
            "The SDK strips the attachment and retries automatically",
          ],
          correctIndex: 0,
          explanation:
            "Failing over on a bad request would just repeat a guaranteed failure, twice as expensively. Failover is scoped to conditions where a different provider plausibly succeeds.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-ai-sdk-q5",
          prompt: "Which of these are real capabilities of the SDK? (Select all that apply.)",
          options: [
            "Generating embeddings, including from a `Stringable` via `toEmbeddings()`",
            "Streaming an agent response directly from a route as server-sent events",
            "Queueing a prompt and handling the result with `then()` and `catch()` callbacks",
            "Fine-tuning a model on your application's data",
            "Running a model locally without any provider configured",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Embeddings, streaming and queued prompts are all first-class. Fine-tuning is not part of the SDK, and a local model still means configuring a provider — an Ollama or OpenAI-compatible endpoint.",
        },
        {
          id: "lv-eco-ai-sdk-q6",
          prompt: "A route streams an agent's response for a prompt that takes 40 seconds. What is the operational cost?",
          options: [
            "A PHP worker is occupied for the whole 40 seconds, so concurrent streams consume workers and can starve ordinary traffic",
            "None — streamed responses are handled outside PHP by the web server",
            "The response cannot be cached, which is the main concern",
            "Streaming doubles token cost because the response is generated twice",
          ],
          correctIndex: 0,
          explanation:
            "Long-lived streaming connections tie up a process each. That is the capacity question to answer before shipping it, and the reason `queue()` exists for cases where the user need not watch.",
        },
        {
          id: "lv-eco-ai-sdk-q7",
          prompt: "An agent implements `Conversational` and returns prior messages from `messages()`. What is the cost to be aware of?",
          options: [
            "Every prior message is re-sent with each prompt, so token usage and latency grow with conversation length — hence trimming to a recent window",
            "The provider stores the conversation, so you are billed for storage",
            "Conversational agents cannot use tools or structured output",
            "The framework locks the conversation, so only one request per user can be in flight",
          ],
          correctIndex: 0,
          explanation:
            "LLM APIs are stateless: history is context you resend. That is precisely why the documented example limits itself to the most recent messages rather than the whole history.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-ai-sdk-q8",
          prompt: "How do you test code that prompts an agent without calling a provider?",
          options: [
            "Use the SDK's testing helpers to fake agent, image, audio, embedding and reranking responses, then assert on what your code did",
            "Point the provider URL at a local stub server you write yourself; there is no built-in support",
            "Set the temperature to 0, which makes responses deterministic enough to assert on",
            "Record real responses once and replay them from a fixture directory the SDK manages",
          ],
          correctIndex: 0,
          explanation:
            "The SDK ships fakes for each media type in the same spirit as `Mail::fake()` or `Queue::fake()`. Temperature 0 reduces variance but is neither deterministic nor free.",
        },
        {
          id: "lv-eco-ai-sdk-q9",
          prompt: "Why would you configure a custom base URL for a provider rather than pointing at its public endpoint?",
          options: [
            "To route through a gateway or proxy that centralises API keys, enforces rate limits, or satisfies a corporate egress policy",
            "To reduce token cost, since gateways compress requests",
            "Because the SDK cannot reach public endpoints from a queued job",
            "To enable streaming, which the public endpoints do not support",
          ],
          correctIndex: 0,
          explanation:
            "Key management, rate limiting and controlled egress are exactly the reasons teams put a gateway such as LiteLLM in front of providers. None of it changes pricing or streaming support.",
        },
        {
          id: "lv-eco-ai-sdk-q10",
          prompt: "A colleague suggests an agent tool that runs arbitrary SQL supplied by the model against production. What is the strongest objection?",
          options: [
            "Tool arguments are model-generated and influenced by whatever text entered the context, so this is a prompt-injection path straight into your database",
            "Tool handlers cannot return large result sets, so the query would time out",
            "Tools cannot access the database because they run outside the container",
            "The model cannot produce valid SQL reliably enough to be useful",
          ],
          correctIndex: 0,
          explanation:
            "Anything that reaches the context — a support ticket, a scraped page, a filename — can steer tool arguments. Narrow, purpose-built tools with validated parameters are the mitigation, not a general query executor.",
        },
        {
          id: "lv-eco-ai-sdk-q11",
          prompt: "Which of these best describes when a sub-agent is worth introducing?",
          options: [
            "When a specialised task needs its own instructions, tools or model, and the parent can delegate to it as a tool",
            "Whenever a conversation exceeds the model's context window",
            "Whenever you want to run two prompts in parallel",
            "Whenever a tool needs to call another tool",
          ],
          correctIndex: 0,
          explanation:
            "A sub-agent returned from `tools()` is a scoping device: different instructions, different tools, possibly a cheaper model, invoked when the parent needs it. Context overflow and parallelism are separate problems with separate answers.",
        },
      ],
    },

    {
      id: "lv-eco-reverb",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Reverb and Broadcasting",
      summary:
        "Broadcasting is Laravel's abstraction for pushing server-side events to connected browsers; Reverb is the first-party WebSocket server that implements it. Before Reverb, using broadcasting meant paying Pusher or operating a community PHP server, so the interesting change is that running your own WebSocket infrastructure became a first-party, supported option — `install:broadcasting`, `reverb:start`, and Echo on the client, which speaks the Pusher protocol.\n\nThe framework side is worth understanding separately from the server. An event implementing `ShouldBroadcast` is dispatched through the queue, which is why a missing queue worker is the single most common reason \"broadcasting doesn't work\" — the event is sitting in a queue, not lost. `broadcastOn()` returns `Channel`, `PrivateChannel` or `PresenceChannel` instances; anything private is authorised by a callback in `routes/channels.php`, and that callback is the only thing standing between a user and someone else's data, since channel names are guessable. `ShouldBroadcastNow` bypasses the queue for latency-critical events at the cost of doing the work inside the request.\n\nOperationally, Reverb is a long-lived process holding every connection in memory, one file descriptor each — so the operating system's open-file limit is a real ceiling you will hit before CPU becomes interesting. Horizontal scaling works by setting `REVERB_SCALING_ENABLED` and giving every node a shared Redis instance to publish through, with a load balancer in front. And the honest framing on adoption: WebSockets are the right answer for genuinely bidirectional, low-latency features — chat, presence, collaborative cursors — but for a progress bar that updates every few seconds, polling costs nothing to operate and cannot silently stop working at 3 a.m.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel: Reverb", url: "https://laravel.com/framework/docs/13.x/reverb", kind: "docs" },
        { label: "Laravel: Broadcasting", url: "https://laravel.com/framework/docs/13.x/broadcasting", kind: "docs" },
        { label: "Pusher Channels protocol reference", url: "https://pusher.com/docs/channels/library_auth_reference/pusher-websockets-protocol/", kind: "spec" },
        { label: "laravel/reverb", url: "https://github.com/laravel/reverb", kind: "repo" },
      ],
      video: {
        title: "Build a Real-Time Web App with Laravel Reverb - COMPLETE TUTORIAL (Laravel, Livewire, Alpine & more)",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=ceOaI0O_LSA",
        videoId: "ceOaI0O_LSA",
        startSeconds: 484,
        chapterLabel: "Integrating Laravel Reverb",
        durationLabel: "1:07:48",
      },
      alternateVideos: [
        {
          title: "Laravel Reverb: The Easiest Way to Add Real-Time Magic to Your App",
          channel: "Glenn Raya",
          url: "https://www.youtube.com/watch?v=jMcIE1hnaYw",
          videoId: "jMcIE1hnaYw",
          durationLabel: "24:26",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-reverb-q1",
          prompt: "An event implements `ShouldBroadcast` and is dispatched, but nothing ever reaches the browser. Reverb is running and Echo is connected. What is the first thing to check?",
          options: [
            "That a queue worker is running — broadcast events are dispatched as queued jobs by default",
            "That the event class is registered in `EventServiceProvider`",
            "That `BROADCAST_CONNECTION` is set to `log`",
            "That the client subscribed before the event was dispatched",
          ],
          correctIndex: 0,
          explanation:
            "Broadcasting is queued so the response is not slowed by it, which means a stopped worker leaves events queued rather than delivered. Setting the connection to `log` would guarantee nothing is broadcast at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-reverb-q2",
          prompt: "What is the difference between `ShouldBroadcast` and `ShouldBroadcastNow`?",
          options: [
            "`ShouldBroadcastNow` broadcasts synchronously instead of going through the queue, trading request time for lower latency",
            "`ShouldBroadcastNow` skips channel authorisation to save a round trip",
            "`ShouldBroadcastNow` sends to all connected clients rather than to a channel",
            "`ShouldBroadcastNow` retries on failure, while `ShouldBroadcast` does not",
          ],
          correctIndex: 0,
          explanation:
            "It uses the sync queue, so the broadcast happens inside the request. Authorisation and channel targeting are unchanged, and going synchronous means losing the queue's retry behaviour rather than gaining it.",
        },
        {
          id: "lv-eco-reverb-q3",
          prompt: "A private channel is named `orders.{orderId}`. What actually stops user A from subscribing to user B's order?",
          options: [
            "The authorisation callback in `routes/channels.php`, which must check that the user owns that order",
            "The channel name being unguessable, since order IDs are not exposed in the UI",
            "Reverb's app secret, which the browser does not have",
            "Echo's client-side check that the channel matches the authenticated user",
          ],
          correctIndex: 0,
          explanation:
            "The server-side callback is the entire control. IDs are guessable, the app key is public by design, and anything enforced in the browser can be bypassed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-reverb-q4",
          prompt: "What does a presence channel add over a private channel?",
          options: [
            "Membership awareness — subscribers can see who else is on the channel and are notified when people join or leave",
            "Guaranteed message ordering across subscribers",
            "Message history, so a late subscriber receives earlier events",
            "Client-to-client messaging without server involvement",
          ],
          correctIndex: 0,
          explanation:
            "Presence is the \"who is here\" feature that powers avatars and typing indicators. WebSockets carry no history — a late subscriber has genuinely missed what it did not receive.",
        },
        {
          id: "lv-eco-reverb-q5",
          prompt: "An event's `broadcastWith()` is not defined, so all public properties are broadcast. A `User` model is one of them. What is the risk?",
          options: [
            "Every attribute not hidden on the model is serialised into the payload and delivered to every subscriber of that channel",
            "The model is broadcast by ID only, so subscribers see nothing useful",
            "Broadcasting fails because Eloquent models are not serialisable",
            "The payload is encrypted with the app secret, so there is no risk",
          ],
          correctIndex: 0,
          explanation:
            "A broadcast payload is JSON delivered to clients. Defining `broadcastWith()` to send only the needed fields is the standard mitigation, the same discipline as Inertia props.",
        },
        {
          id: "lv-eco-reverb-q6",
          prompt: "You need to run Reverb across three servers behind a load balancer. What makes that work?",
          options: [
            "Setting `REVERB_SCALING_ENABLED` and giving every node a shared Redis instance, so a message received by one node is published to the others",
            "Configuring sticky sessions so each client always reaches the same node",
            "Running Horizon, which coordinates Reverb nodes",
            "Nothing — Reverb nodes discover one another automatically on the local network",
          ],
          correctIndex: 0,
          explanation:
            "Redis pub/sub is the fan-out mechanism between nodes. Sticky sessions would keep a connection pinned but would not deliver an event published on a different node.",
        },
        {
          id: "lv-eco-reverb-q7",
          prompt: "Reverb starts refusing new connections well before CPU or memory are saturated. What is the usual cause?",
          options: [
            "The operating system's open-file limit — each connection is a file descriptor, and `ulimit` caps how many the process may hold",
            "The queue worker's memory limit, which bounds broadcast throughput",
            "Reverb's default cap of 1,000 connections per application",
            "Redis's client limit, which applies even without scaling enabled",
          ],
          correctIndex: 0,
          explanation:
            "Raising the open-file limit is a documented prerequisite for running Reverb at scale. Redis limits would only matter with scaling enabled, and would not be the first wall you hit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-reverb-q8",
          prompt: "Which of these are good reasons to choose polling over WebSockets? (Select all that apply.)",
          options: [
            "The update interval is measured in seconds and users would not notice the difference",
            "There is no appetite to operate another long-lived process in production",
            "Updates flow only from server to client, with no need for a persistent bidirectional channel",
            "The application has more than a few hundred concurrent users",
            "The data being pushed is sensitive",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Polling wins when latency requirements are loose, operational simplicity matters, and traffic is one-directional. Scale actually argues for WebSockets, and sensitivity is about authorisation, not transport.",
        },
        {
          id: "lv-eco-reverb-q9",
          prompt: "What does `allowed_origins` in `config/reverb.php` control?",
          options: [
            "Which origins may open a connection to the Reverb server, rejecting handshakes from anywhere else",
            "Which channels a connection may subscribe to",
            "Which servers may publish events into Reverb",
            "Which IP ranges the Reverb dashboard is reachable from",
          ],
          correctIndex: 0,
          explanation:
            "It is origin-level access control on the WebSocket handshake — useful, but it is not channel authorisation, which is still the job of `routes/channels.php`.",
        },
        {
          id: "lv-eco-reverb-q10",
          prompt: "Why does Reverb use the Pusher protocol rather than inventing its own?",
          options: [
            "So existing clients, Echo included, work unchanged and you can move between Reverb and a hosted provider without rewriting the frontend",
            "Because the Pusher protocol is required by the WebSocket specification",
            "Because Laravel licenses the protocol from Pusher",
            "So Reverb can fall back to Pusher automatically when it is overloaded",
          ],
          correctIndex: 0,
          explanation:
            "Protocol compatibility is portability: the same Echo configuration points at either, so the build-versus-buy decision stays reversible.",
        },
        {
          id: "lv-eco-reverb-q11",
          prompt: "You deploy new code while Reverb is running. What belongs in the deploy script, and why?",
          options: [
            "`reverb:restart`, because the server is a long-lived PHP process holding the old code — and it terminates connections gracefully so clients can reconnect",
            "Nothing, because Reverb reloads changed files automatically",
            "`reverb:start --force`, which replaces the running process in place",
            "`queue:restart` only, since Reverb itself holds no application code",
          ],
          correctIndex: 0,
          explanation:
            "Same reasoning as queue workers and Octane: booted PHP does not see new files. Restarting drops connections briefly, which is why clients need reconnect handling.",
        },
      ],
    },

    {
      id: "lv-eco-cashier-socialite",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Cashier and Socialite: Wrapping Someone Else's API",
      summary:
        "Cashier and Socialite look unrelated until you notice they solve the same shape of problem: a third party owns state your application depends on, and the integration is mostly about staying in sync with it. Socialite turns OAuth into two routes — redirect the user to a provider, receive them back with a profile — collapsing signature juggling and token exchange into `Socialite::driver('github')->redirect()` and `->user()`. Cashier turns Stripe or Paddle subscriptions into methods on your `User` model: `subscribed()`, `subscription()->swap()`, trials, grace periods, invoices, usage-based billing and Checkout redirects.\n\nIn both cases the provider is the source of truth and your database is a cache of it, which is why the webhook is the important part of Cashier rather than an appendix. A card that fails on renewal, a customer who cancels inside Stripe's portal, a dispute — none of those pass through your application, so without verified, signed webhooks your `subscribed()` check drifts from reality. `cashier:webhook` registers a Stripe endpoint for every event Cashier needs, `STRIPE_WEBHOOK_SECRET` verifies signatures, and the route sits outside CSRF protection because the caller is a server, not a browser.\n\nThe judgement in both is knowing where the package stops. Socialite hands you a verified identity and nothing else: account linking, what to do when two providers return the same email address, and what to do when a provider returns no email at all are decisions only you can make — and treating a provider-supplied email as proof of ownership is a well-worn account-takeover path. Cashier is Stripe-shaped or Paddle-shaped, not provider-agnostic: they are two separate packages with two APIs, so \"we'll switch billing providers later\" means a rewrite. Choosing Paddle because it acts as merchant of record and absorbs global sales-tax obligations is a legitimate reason to accept that; choosing it by coin flip is not.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel: Cashier (Stripe)", url: "https://laravel.com/framework/docs/13.x/billing", kind: "docs" },
        { label: "Laravel: Cashier (Paddle)", url: "https://laravel.com/framework/docs/13.x/cashier-paddle", kind: "docs" },
        { label: "Laravel: Socialite", url: "https://laravel.com/framework/docs/13.x/socialite", kind: "docs" },
        { label: "Stripe: Subscription webhooks", url: "https://docs.stripe.com/billing/subscriptions/webhooks", kind: "docs" },
      ],
      video: {
        title: "Cashier - Subscription Billing for Laravel",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=9tCYrrDu04E",
        videoId: "9tCYrrDu04E",
        durationLabel: "12:31",
      },
      alternateVideos: [
        {
          title: "Socialite - Social logins in minutes",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=JKOJpUi1gD0",
          videoId: "JKOJpUi1gD0",
          durationLabel: "4:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-cashier-socialite-q1",
          prompt: "Why are webhooks the load-bearing part of a Cashier integration rather than an optional extra?",
          options: [
            "Renewals, failed payments, cancellations inside the provider's portal and disputes never pass through your application, so without webhooks your local subscription state drifts from reality",
            "Stripe refuses to process a subscription unless a webhook endpoint is registered",
            "Cashier uses webhooks to authenticate its own API calls to Stripe",
            "Webhooks are how Cashier retrieves the customer's payment method during checkout",
          ],
          correctIndex: 0,
          explanation:
            "Your database mirrors the provider's state and the provider is authoritative. Anything that happens without a request to your app only reaches you as a webhook.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-cashier-socialite-q2",
          prompt: "Which of these are required for Cashier's Stripe webhooks to work safely in production? (Select all that apply.)",
          options: [
            "A webhook endpoint registered with Stripe for the events Cashier needs, which `cashier:webhook` can create",
            "`STRIPE_WEBHOOK_SECRET` set, so incoming calls can be verified as genuinely from Stripe",
            "The webhook route excluded from CSRF protection, since the caller is a server with no session",
            "The webhook route behind `auth` middleware so only logged-in users can reach it",
            "A queue worker, because Cashier's webhook handler must be queued",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Registration, signature verification and CSRF exemption are the three. Requiring authentication would block Stripe entirely, and signature verification — not a session — is what proves the caller.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-cashier-socialite-q3",
          prompt: "A team says \"we'll start on Stripe and move to Paddle later if we need to.\" How much does Cashier soften that migration?",
          options: [
            "Very little — Cashier Stripe and Cashier Paddle are separate packages with different APIs and data models, so it is a rewrite of the billing layer",
            "Completely — changing `CASHIER_DRIVER` swaps the provider behind one interface",
            "Mostly — the models are shared and only checkout differs",
            "Not at all — Cashier only supports Stripe, so Paddle means leaving Cashier",
          ],
          correctIndex: 0,
          explanation:
            "Cashier is two packages with separate documentation because the providers model billing differently. Cashier does support Paddle — it is just a different package, not a driver.",
        },
        {
          id: "lv-eco-cashier-socialite-q4",
          prompt: "What is the usual reason a team picks Paddle over Stripe?",
          options: [
            "Paddle acts as merchant of record, taking on global sales-tax and VAT obligations that would otherwise be yours",
            "Paddle's fees are always lower than Stripe's",
            "Paddle is the only one of the two Cashier supports for subscriptions",
            "Paddle does not require webhooks, simplifying the integration",
          ],
          correctIndex: 0,
          explanation:
            "Merchant-of-record status is a compliance decision, not a technical one, and is the substantive difference. Both support subscriptions through Cashier, and both rely on webhooks.",
        },
        {
          id: "lv-eco-cashier-socialite-q5",
          prompt: "Socialite returns a GitHub profile whose email matches an existing local account created with a password. What should the application do?",
          options: [
            "Treat it as a deliberate account-linking decision — a provider-supplied email is not proof that this person controls the existing account",
            "Log the user into the existing account, since the provider verified the email",
            "Create a second account with the same email address",
            "Reject the login permanently, because the email is already taken",
          ],
          correctIndex: 0,
          explanation:
            "Auto-linking on a matching email is a classic account-takeover path: not every provider verifies email, and some let users set an arbitrary address. Socialite hands you an identity; the linking policy is yours.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-cashier-socialite-q6",
          prompt: "A provider's callback returns a user object whose email is `null`. What has happened, and what is the correct handling?",
          options: [
            "The provider did not release an email — because of scope, privacy settings or a relay address — so the app must ask for one or key the account on the provider id instead",
            "Socialite failed to parse the response and the request should be retried",
            "The requested scopes were invalid, so the login should be rejected",
            "The user has no email with that provider, so registration is impossible",
          ],
          correctIndex: 0,
          explanation:
            "Missing or relayed email addresses are normal in OAuth. An integration keyed solely on email will break the first time it happens; the stable key is the provider's own user id.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-cashier-socialite-q7",
          prompt: "Where do Socialite's client id, client secret and redirect URL belong?",
          options: [
            "In `config/services.php`, under the provider's key, reading values from the environment",
            "In `config/auth.php`, alongside the guards that will use them",
            "Passed to `Socialite::driver()` at the call site in the controller",
            "In `.env` only — Socialite reads environment variables directly",
          ],
          correctIndex: 0,
          explanation:
            "`config/services.php` is the documented home for third-party credentials, which also keeps them cacheable by `config:cache`. Reading `env()` outside config files breaks once the config is cached.",
        },
        {
          id: "lv-eco-cashier-socialite-q8",
          prompt: "Which parts of subscription billing does Cashier genuinely handle for you? (Select all that apply.)",
          options: [
            "Creating, swapping, cancelling and resuming subscriptions, with trials and grace periods",
            "Redirecting to hosted Checkout and reconciling the result",
            "Generating invoice PDFs and handling payments that need extra confirmation",
            "Deciding which features each plan unlocks in your application",
            "Calculating and remitting sales tax on your behalf",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Cashier covers the subscription lifecycle and its paperwork. Plan-to-feature mapping is your domain logic, and tax is computed by Stripe Tax or absorbed by Paddle — not by Cashier.",
        },
        {
          id: "lv-eco-cashier-socialite-q9",
          prompt: "A user reports being billed twice after a checkout. Investigation shows the webhook handler ran twice for the same event. What is the correct lesson?",
          options: [
            "Webhook delivery is at-least-once, so handlers must be idempotent — keyed on the provider's event or object id",
            "The provider is at fault and the integration needs no change",
            "Webhooks should be queued so duplicates are automatically deduplicated",
            "Signature verification should be enabled, which prevents duplicate delivery",
          ],
          correctIndex: 0,
          explanation:
            "Every webhook provider retries on timeouts or non-2xx responses, so duplicates are normal traffic. Signature verification proves authenticity and says nothing about uniqueness.",
        },
        {
          id: "lv-eco-cashier-socialite-q10",
          prompt: "An application needs to issue its own OAuth2 tokens so third-party developers can build against its API. Is Socialite the right package?",
          options: [
            "No — Socialite is an OAuth client that consumes other providers; being an OAuth server is Passport's job",
            "Yes — Socialite works in both directions with `Socialite::server()`",
            "Yes, provided the application registers itself as a Socialite provider",
            "No — that requires Sanctum, which issues OAuth2 tokens",
          ],
          correctIndex: 0,
          explanation:
            "Consumer versus provider is the distinction. Sanctum issues simple API tokens and handles SPA session auth; full OAuth2 authorisation-server behaviour is Passport.",
        },
        {
          id: "lv-eco-cashier-socialite-q11",
          prompt: "Your app gates a feature with `$user->subscribed('default')`. A customer cancelled yesterday inside Stripe's billing portal, and the check still returns `true`. What is the most likely cause?",
          options: [
            "The cancellation webhook never reached or was never handled, so the local subscription row is stale",
            "`subscribed()` deliberately ignores cancellations until the period ends, so this is correct",
            "Cashier caches subscription status for 24 hours",
            "Portal cancellations are not exposed to integrations and must be polled",
          ],
          correctIndex: 0,
          explanation:
            "Nothing tells your app about a portal action except the webhook. A cancellation that leaves access until the period ends is a grace period, which is a different state that the local row would still have to record.",
        },
      ],
    },

    {
      id: "lv-eco-pint-sail",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Pint and Sail: the Local Toolchain",
      summary:
        "Pint and Sail are the two first-party tools that never reach production, and both are really about removing an argument from a team's day. Pint is a thin, opinionated wrapper over PHP CS Fixer, preconfigured with Laravel's own style and shipped in new applications. Its value is precisely that it is not configurable enough to argue about: run it, the diff is style-only, and code review goes back to discussing behaviour. The presets — `laravel`, `per`, `psr12`, `symfony` and `empty` — exist so a team with an existing standard can adopt the tool without adopting Laravel's taste.\n\nThe flags matter more than the presets. `--test` checks without writing and exits non-zero, which is the CI form; `--dirty` limits the run to uncommitted changes and `--diff=main` to changes against a branch, which is how you introduce Pint to a large legacy codebase without a 4,000-file reformatting commit that destroys `git blame`. Blade files are deliberately left alone unless you pass `--blade`. And a formatter is not a linter: Pint will not tell you a variable is undefined or a method does not exist — that is PHPStan or Psalm, a separate and complementary tool.\n\nSail is a `compose.yaml` and a shell script, giving a new developer MySQL, Redis, Mailpit and whatever else they picked without installing any of it natively. What it is not is a deployment artefact: the intro describes it as Laravel's local Docker development environment, and its image is optimised for convenience rather than for a small, hardened production container. Teams that try to ship the Sail image find that out slowly. The real judgement call is whether you need it at all — on macOS, Herd or Valet with a native database is meaningfully faster than containers, and Sail's strongest case is a mixed-OS team, a project with unusual service dependencies, or a shop that wants one identical onboarding command everywhere.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Laravel: Pint", url: "https://laravel.com/framework/docs/13.x/pint", kind: "docs" },
        { label: "Laravel: Sail", url: "https://laravel.com/framework/docs/13.x/sail", kind: "docs" },
        { label: "PHP CS Fixer", url: "https://github.com/PHP-CS-Fixer/PHP-CS-Fixer", kind: "repo" },
      ],
      video: {
        title: "New Laravel Pint: Code Styling Made Easier",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=5khyIHIYIK4",
        videoId: "5khyIHIYIK4",
        durationLabel: "7:58",
      },
      alternateVideos: [
        {
          title: "Pint - Code formatting. Zero config",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=YMQEmBKwfhA",
          videoId: "YMQEmBKwfhA",
          durationLabel: "1:45",
        },
        {
          title: "Sail - Docker for Laravel made simple",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=Vq9ZeN4Yhi0",
          videoId: "Vq9ZeN4Yhi0",
          durationLabel: "1:46",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-pint-sail-q1",
          prompt: "What is Pint, technically?",
          options: [
            "An opinionated wrapper around PHP CS Fixer, preconfigured with Laravel's style and included in new applications",
            "A static analyser that reports type errors and undefined variables",
            "A rewrite of PHP CS Fixer with its own independent rule engine",
            "A Composer plugin that enforces style at install time",
          ],
          correctIndex: 0,
          explanation:
            "Knowing it is PHP CS Fixer underneath is what lets you reach for specific rules when the preset is not quite right. Type errors are a static analyser's job, which Pint is not.",
        },
        {
          id: "lv-eco-pint-sail-q2",
          prompt: "Which Pint invocation belongs in CI?",
          options: [
            "`pint --test`, which reports violations without writing and exits non-zero",
            "`pint`, so CI fixes the code and commits the result",
            "`pint --repair`, which is the only mode that fails the build",
            "`pint --dirty`, which checks only what changed",
          ],
          correctIndex: 0,
          explanation:
            "CI should fail, not mutate the repository. `--repair` does fix and exit non-zero, but it writes files, which is a local convenience rather than CI behaviour.",
        },
        {
          id: "lv-eco-pint-sail-q3",
          prompt: "You are adding Pint to a 200,000-line legacy codebase. How do you avoid one enormous reformatting commit?",
          options: [
            "Run with `--dirty` or `--diff=main` so only touched files are formatted, letting the codebase converge as it is edited",
            "Configure the `empty` preset and add rules one at a time over several releases",
            "Format everything at once but commit with `--no-verify` so hooks do not run",
            "Run Pint only on new files by adding the old ones to `.gitignore`",
          ],
          correctIndex: 0,
          explanation:
            "Scoping to changed files is the documented approach and keeps `git blame` useful. The empty preset is about which rules apply, not which files are touched.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-pint-sail-q4",
          prompt: "Which of these would Pint never report? (Select all that apply.)",
          options: [
            "A call to a method that does not exist on the class",
            "A variable used before it is assigned",
            "An `if` block that can never be reached",
            "Inconsistent brace placement on a class declaration",
            "Import statements that are not sorted",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Pint fixes formatting. Missing methods, undefined variables and unreachable code are static analysis findings and need PHPStan or Psalm alongside it.",
        },
        {
          id: "lv-eco-pint-sail-q5",
          prompt: "A team has used PSR-12 for years and does not want Laravel's style. What does Pint offer?",
          options: [
            "The `psr12` preset, one of `laravel`, `per`, `psr12`, `symfony` and `empty`, set in `pint.json` or via `--preset`",
            "Nothing — Pint only enforces the Laravel style, which is why it needs no configuration",
            "A migration command that converts PSR-12 code to Laravel style",
            "A compatibility mode that disables all rules not shared by both standards",
          ],
          correctIndex: 0,
          explanation:
            "\"Zero config\" describes the default, not a limitation. A shared `pint.json` can also be published from an internal package and pointed at with `--config`.",
        },
        {
          id: "lv-eco-pint-sail-q6",
          prompt: "Running Pint leaves Blade templates untouched. Why?",
          options: [
            "Blade formatting is opt-in via the `--blade` flag or the corresponding rule; it is off by default",
            "Blade files are not PHP, so PHP CS Fixer cannot parse them at all",
            "Blade files must be listed explicitly in `pint.json` before they are discovered",
            "Blade formatting requires the `symfony` preset",
          ],
          correctIndex: 0,
          explanation:
            "Reformatting templates can shift whitespace that matters in rendered output, so it is deliberately opt-in rather than impossible.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-pint-sail-q7",
          prompt: "What is Sail, and what is it not?",
          options: [
            "It is a `compose.yaml` plus a CLI script for a local Docker development environment; it is not a production deployment artefact",
            "It is a production-ready Docker image with a local development mode",
            "It is a replacement for Docker that runs containers without a daemon",
            "It is a hosting product that deploys your containers to Laravel Cloud",
          ],
          correctIndex: 0,
          explanation:
            "The documentation frames Sail as the local Docker development environment. Its image favours developer convenience over the small, hardened footprint a production image wants.",
        },
        {
          id: "lv-eco-pint-sail-q8",
          prompt: "On what operating systems is Sail supported?",
          options: [
            "macOS, Linux and Windows via WSL2",
            "Linux only, since Docker is native there",
            "macOS and Linux; Windows requires Homestead instead",
            "Any OS with PHP 8.3 installed natively",
          ],
          correctIndex: 0,
          explanation:
            "WSL2 is the documented Windows path. Sail's whole point is that you do not install PHP or the services natively at all.",
        },
        {
          id: "lv-eco-pint-sail-q9",
          prompt: "Which situations make Sail a clearly good call? (Select all that apply.)",
          options: [
            "A mixed macOS/Windows/Linux team that wants one identical onboarding command",
            "A project depending on several services a developer would otherwise install by hand",
            "Onboarding developers with no prior Docker experience",
            "A production deployment that needs container parity with local development",
            "A macOS-only team whose main complaint is that their test suite is slow",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Uniformity, service complexity and a gentle Docker on-ramp are where Sail shines. It is not a production artefact, and on macOS the filesystem overhead typically makes a container-based test suite slower, not faster.",
        },
        {
          id: "lv-eco-pint-sail-q10",
          prompt: "A developer runs `php artisan migrate` and gets a connection refused, although `sail up` is running. What is the likely mistake?",
          options: [
            "The command is running on the host rather than inside the container — `sail artisan migrate` runs it where `DB_HOST=mysql` resolves",
            "The MySQL container needs `sail:add` to be run before it accepts connections",
            "Migrations must be run before `sail up`, while the containers are stopped",
            "`DB_HOST` should be `127.0.0.1`, and Sail sets it incorrectly",
          ],
          correctIndex: 0,
          explanation:
            "Service hostnames like `mysql` only resolve on the Compose network, which is why nearly every Sail command is `sail <something>` rather than the bare tool.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "lv-eco-choosing",
      moduleId: "laravel-ecosystem",
      trackId: "php",
      title: "Which of These Do You Actually Need",
      summary:
        "Having met a dozen packages, the useful skill is restraint. Every one of them is free to install and none of them is free to keep: each adds a dependency to upgrade, a dashboard to secure, a process to supervise, or a failure mode to understand at 3 a.m. First-party does not mean mandatory, and a small team that installs the whole catalogue on day one has bought an operations burden to run a product that does not exist yet.\n\nA workable ordering falls out of what actually costs a team time. Pint pays for itself immediately and costs nothing at runtime — take it. A starter kit is a one-time decision you should make deliberately at `laravel new`, because retrofitting is much harder. Telescope in development is nearly free and saves an afternoon the first time you meet an N+1. After that, wait for a real signal: Horizon when your queue is on Redis and you cannot see what workers are doing; Pulse when you need to know whether production is healthier or worse than last week; Scout's database engine when search appears, and an external engine only when a specific search requirement fails against it; Reverb when a feature is genuinely bidirectional rather than merely live-ish; Cashier when you are actually charging money; Octane last, and only after profiling says bootstrap is your bottleneck, because it is the one package that changes how your code must be written.\n\nTwo tests keep the list honest. The first is the on-call test: who supervises this process, what does its failure look like from the outside, and does it have a dashboard that needs an authorisation gate? Horizon, Pulse, Reverb and Octane all fail an honest answer to that question in a team with no operational capacity. The second is the removal test: if this package disappeared tomorrow, what would break? If the answer is \"nothing much\", you are carrying it for free, and free carrying is how a codebase becomes hard to upgrade.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Laravel: Release Notes", url: "https://laravel.com/framework/docs/13.x/releases", kind: "docs" },
        { label: "Laravel: Deployment", url: "https://laravel.com/framework/docs/13.x/deployment", kind: "docs" },
        { label: "Laravel: Starter Kits", url: "https://laravel.com/framework/docs/13.x/starter-kits", kind: "docs" },
      ],
      video: {
        title: "Everything New with Laravel and Cloud | Taylor Otwell Keynote at Laracon US 2026",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=92Xn3NqPGlw",
        videoId: "92Xn3NqPGlw",
        durationLabel: "1:17:04",
      },
      alternateVideos: [
        {
          title: "Laravel Pulse, First Party Packages, & the Future of Laravel",
          channel: "Laravel Podcast",
          url: "https://www.youtube.com/watch?v=ip4Spoz6s-Q",
          videoId: "ip4Spoz6s-Q",
          durationLabel: "40:32",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eco-choosing-q1",
          prompt: "A two-person team is starting a new SaaS. Which of these are defensible on day one? (Select all that apply.)",
          options: [
            "Pint, because it costs nothing at runtime and ends style debates immediately",
            "A starter kit, because choosing one later means retrofitting scaffolding into an existing app",
            "Telescope as a dev dependency, because the first N+1 will happen within the week",
            "Octane, because performance is easier to design in than to retrofit",
            "Horizon, because queues will be needed eventually",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are cheap, immediate or one-time decisions. Octane constrains how you write code for a benefit you cannot yet measure, and Horizon is trivial to add the day a Redis queue actually exists.",
        },
        {
          id: "lv-eco-choosing-q2",
          prompt: "What is the \"on-call test\" for adopting an ecosystem package?",
          options: [
            "Who supervises the process it adds, what its failure looks like from outside, and whether its dashboard needs an authorisation gate",
            "Whether the package is maintained by the Laravel core team",
            "Whether the package has more than a million Composer downloads",
            "Whether the package can be installed as a dev dependency",
          ],
          correctIndex: 0,
          explanation:
            "Horizon, Pulse, Reverb and Octane each add a long-lived process and, in three cases, a dashboard with access to production data. First-party status says nothing about your capacity to operate it.",
        },
        {
          id: "lv-eco-choosing-q3",
          prompt: "Which single package on this list changes how your application code must be written, rather than only what you operate?",
          options: [
            "Octane, because long-lived workers make captured state a correctness bug",
            "Horizon, because jobs must implement its interfaces",
            "Pulse, because recorders must be added to every controller",
            "Scout, because models must be rewritten around the index",
          ],
          correctIndex: 0,
          explanation:
            "Octane invalidates the per-request assumption the rest of your code was written under. Horizon needs no changes to job classes, Pulse hooks events, and Scout adds a trait.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-choosing-q4",
          prompt: "A team runs Telescope in production for observability and has no Pulse. What is the honest assessment?",
          options: [
            "It is backwards — Telescope's per-request writes and stored payloads are a production liability, and it cannot answer trend questions anyway",
            "It is fine, provided `telescope:prune` is scheduled",
            "It is fine, since Telescope's watchers are a superset of Pulse's recorders",
            "It is fine as long as the dashboard is gated",
          ],
          correctIndex: 0,
          explanation:
            "Pruning and gating mitigate two of the three problems and neither addresses the third: Telescope stores individual entries, so it can never tell you what changed week over week.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-choosing-q5",
          prompt: "An internal CRUD tool for 40 office users is being planned. Which of these would you argue against? (Select all that apply.)",
          options: [
            "Reverb, because nothing in the feature set is genuinely bidirectional",
            "Octane, because 40 users generate no load worth the state-leak risk",
            "An external search engine, because the database engine will comfortably serve this dataset",
            "Pint, because the team is small enough to agree on style informally",
            "A starter kit, because internal tools still need login, settings and 2FA",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Real-time infrastructure, a long-lived runtime and a search cluster are all unjustified at this size. Pint is free either way, and a starter kit saves exactly the work this tool would otherwise repeat.",
        },
        {
          id: "lv-eco-choosing-q6",
          prompt: "What is the \"removal test\"?",
          options: [
            "Asking what would break if the package disappeared tomorrow — if the answer is \"nothing much\", you are carrying a dependency for free",
            "Checking whether the package can be uninstalled without a migration",
            "Verifying the package has a documented uninstall command",
            "Confirming that removing it would not break your test suite",
          ],
          correctIndex: 0,
          explanation:
            "It is a way of asking whether a dependency is load-bearing. Unused dependencies are not neutral: they are upgrade work and attack surface that buy nothing.",
        },
        {
          id: "lv-eco-choosing-q7",
          prompt: "Which signal most honestly justifies adopting Octane?",
          options: [
            "Profiling shows framework bootstrap is a meaningful share of response time and the team has audited singletons and statics",
            "The application feels slow and the team wants a quick win",
            "Traffic has grown and the hosting bill is rising",
            "A competitor's blog post reported a large throughput improvement",
          ],
          correctIndex: 0,
          explanation:
            "Octane removes bootstrap and nothing else, so the case has to be measured — and the audit is part of the cost, not an optional extra.",
        },
        {
          id: "lv-eco-choosing-q8",
          prompt: "A feature needs to show live order status to customers, updating roughly every five seconds. What is the proportionate choice?",
          options: [
            "Poll the server; WebSocket infrastructure is not justified by a five-second, one-directional update",
            "Reverb, because live data always means WebSockets",
            "Livewire's polling helper plus Reverb, for redundancy",
            "Server-sent events via Octane's long-lived workers",
          ],
          correctIndex: 0,
          explanation:
            "Polling cannot silently stop working the way an unsupervised WebSocket server can, and it needs nothing new in production. Save Reverb for genuinely bidirectional, low-latency features.",
        },
        {
          id: "lv-eco-choosing-q9",
          prompt: "A team adopts eight first-party packages in a new app's first month. What is the most likely consequence eighteen months later?",
          options: [
            "A slow framework upgrade, because every package must be compatible before the application can move",
            "Better performance, because the packages are optimised together",
            "Lower hosting costs, since first-party packages share infrastructure",
            "No consequence — first-party packages release in lockstep with the framework",
          ],
          correctIndex: 0,
          explanation:
            "Every dependency is a constraint on the next major upgrade. First-party packages track the framework well, but they still gate your move until each one has released.",
        },
        {
          id: "lv-eco-choosing-q10",
          prompt: "Which of these are genuinely one-time, hard-to-reverse decisions rather than things you can add later? (Select all that apply.)",
          options: [
            "Whether the frontend is Livewire, Inertia or a separate SPA",
            "Which starter kit generated the application",
            "Whether billing runs on Stripe or Paddle",
            "Whether Telescope is installed",
            "Whether Pint uses the `laravel` or `psr12` preset",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The frontend model, the generated scaffolding and the billing provider all leave deep marks. Telescope is a dev dependency you can add in a minute, and switching Pint presets is one reformatting commit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eco-choosing-q11",
          prompt: "Your team has no operational capacity — no on-call rotation and no process supervision beyond what the host provides. Which adoptions should that fact veto?",
          options: [
            "Reverb and Octane, and arguably Horizon and Pulse, since each adds a long-lived process someone must keep alive",
            "Cashier and Socialite, since both depend on third parties",
            "Scout and Pint, since both add build-time steps",
            "None — all first-party packages are managed by the framework",
          ],
          correctIndex: 0,
          explanation:
            "The constraint is processes that must stay running and be restarted on deploy. Cashier and Socialite add no daemons, and Pint never runs in production at all.",
        },
        {
          id: "lv-eco-choosing-q12",
          prompt: "What is the strongest argument for preferring a first-party package over an equivalent community one, all else being equal?",
          options: [
            "It tracks the framework's release cycle and is documented alongside it, so upgrade risk and onboarding cost are lower",
            "First-party packages are always faster than community equivalents",
            "First-party packages cannot introduce breaking changes",
            "First-party packages are exempt from the framework's upgrade guide",
          ],
          correctIndex: 0,
          explanation:
            "Predictable upgrades and shared documentation are the real advantage — and note the caveat, all else being equal, since a mature community package that fits your problem better is often the right answer.",
        },
      ],
    },
  ],
} satisfies Module;
