import type { Module } from "@/types/curriculum";

// Starter code for the three code challenges, kept out of the topic objects for readability.
const SIGNAL_GRAPH_STARTER = `/**
 * Create a writable signal. Reading it inside a reactive context (a \`computed\`,
 * a \`linkedSignal\` computation or an \`effect\`) must register a dependency.
 * \`options.equal\` defaults to \`Object.is\`; an equal value is not a change.
 */
function signal(initialValue, options) {
  // Your code here (this placeholder notifies nobody)
  let value = initialValue;
  const read = () => value;
  read.set = (next) => {
    value = next;
  };
  read.update = (fn) => read.set(fn(value));
  return read;
}

/**
 * Create a read-only derived signal: lazy, memoized, with dynamic dependencies.
 */
function computed(fn, options) {
  // Your code here (this placeholder re-runs \`fn\` on every read)
  return () => fn();
}

/**
 * Create a writable signal whose value resets to \`computation()\` whenever the
 * value that computation produces changes.
 */
function linkedSignal(computation) {
  // Your code here (this placeholder never resets)
  let overridden = false;
  let value;
  const read = () => (overridden ? value : computation());
  read.set = (next) => {
    overridden = true;
    value = next;
  };
  read.update = (fn) => read.set(fn(read()));
  return read;
}

/**
 * Register a side effect. It does not run immediately: it is scheduled, and
 * \`flushEffects()\` runs it. Returns \`{ destroy() }\`.
 */
function effect(fn) {
  // Your code here (this placeholder never runs)
  return {
    destroy() {},
  };
}

/** Run every scheduled effect whose dependencies really changed. */
function flushEffects() {
  // Your code here
}

/** Read signals without registering them as dependencies. */
function untracked(fn) {
  // Your code here
  return fn();
}

// ---- Test driver (leave as is) ----
function runSignalScenario(name) {
  const scenarios = {
    lazyMemoizedComputed() {
      const count = signal(1);
      let runs = 0;
      const double = computed(() => {
        runs++;
        return count() * 2;
      });
      const log = [runs];
      log.push(double(), double(), runs);
      count.set(5);
      log.push(runs, double(), runs);
      return log;
    },
    equalityStopsPropagation() {
      const count = signal(0);
      let runs = 0;
      const parity = computed(() => (count() % 2 === 0 ? "even" : "odd"));
      const effectLog = [];
      effect(() => {
        runs++;
        effectLog.push(parity());
      });
      flushEffects();
      count.set(2);
      flushEffects();
      count.set(3);
      flushEffects();
      return { runs, effectLog };
    },
    dynamicDependencies() {
      const showCount = signal(false);
      const count = signal(0);
      let runs = 0;
      const label = computed(() => {
        runs++;
        return showCount() ? "count " + count() : "hidden";
      });
      const log = [label(), runs];
      count.set(10);
      log.push(label(), runs);
      showCount.set(true);
      log.push(label(), runs);
      count.set(11);
      log.push(label(), runs);
      showCount.set(false);
      log.push(label(), runs);
      count.set(12);
      log.push(label(), runs);
      return log;
    },
    effectsAreScheduled() {
      const count = signal(0);
      const seen = [];
      effect(() => seen.push(count()));
      const beforeFlush = seen.slice();
      flushEffects();
      const afterFlush = seen.slice();
      count.set(1);
      count.set(2);
      count.set(3);
      const beforeSecondFlush = seen.slice();
      flushEffects();
      return { beforeFlush, afterFlush, beforeSecondFlush, seen };
    },
    customEquality() {
      const point = signal({ x: 0 }, { equal: (a, b) => a.x === b.x });
      const seen = [];
      effect(() => seen.push(point().x));
      flushEffects();
      point.set({ x: 0 });
      flushEffects();
      point.set({ x: 1 });
      flushEffects();
      return seen;
    },
    untrackedRead() {
      const user = signal("ada");
      const counter = signal(0);
      const seen = [];
      effect(() => seen.push(user() + ":" + untracked(counter)));
      flushEffects();
      counter.set(1);
      flushEffects();
      user.set("grace");
      flushEffects();
      return seen;
    },
    destroyStopsEffect() {
      const count = signal(0);
      const seen = [];
      const ref = effect(() => seen.push(count()));
      flushEffects();
      count.set(1);
      flushEffects();
      ref.destroy();
      count.set(2);
      count.set(3);
      flushEffects();
      return seen;
    },
    linkedSignalResets() {
      const options = signal(["ground", "air", "sea"]);
      const selected = linkedSignal(() => options()[0]);
      const log = [selected()];
      selected.set("sea");
      log.push(selected());
      options.set(["email", "will-call", "post"]);
      log.push(selected());
      selected.set("post");
      log.push(selected());
      return log;
    },
    linkedSignalNotifies() {
      const options = signal(["a", "b"]);
      const selected = linkedSignal(() => options()[0]);
      const seen = [];
      effect(() => seen.push(selected()));
      flushEffects();
      selected.set("b");
      flushEffects();
      options.set(["x", "y"]);
      flushEffects();
      return seen;
    },
    diamondNoGlitch() {
      const base = signal(1);
      const left = computed(() => base() + 1);
      const right = computed(() => base() * 10);
      const runs = [];
      const sum = computed(() => {
        runs.push("sum");
        return left() + right();
      });
      const seen = [];
      effect(() => seen.push(sum()));
      flushEffects();
      base.set(2);
      flushEffects();
      return { seen, sumRuns: runs.length };
    },
    deepChain() {
      const source = signal(0);
      let current = computed(() => source());
      for (let i = 0; i < 200; i++) {
        const previous = current;
        current = computed(() => previous() + 1);
      }
      const seen = [];
      effect(() => seen.push(current()));
      flushEffects();
      source.set(5);
      flushEffects();
      source.set(5);
      flushEffects();
      return seen;
    },
    noSubscribersNoWork() {
      const count = signal(0);
      let runs = 0;
      const derived = computed(() => {
        runs++;
        return count() * 2;
      });
      for (let i = 1; i <= 1000; i++) count.set(i);
      const beforeRead = runs;
      const value = derived();
      return { beforeRead, runs, value };
    },
  };
  if (!scenarios[name]) throw new Error("Unknown scenario " + name);
  return scenarios[name]();
}
`;

const INTERCEPTOR_STARTER = `/**
 * Compose functional interceptors into a single request handler.
 *
 * @param {Array<(req: object, next: (req: object) => object) => object>} interceptors
 * @param {(req: object) => object} backend
 * @returns {(req: object) => object}
 */
function createHttpHandler(interceptors, backend) {
  // Your code here (this placeholder skips the interceptors entirely)
  return (req) => backend(req);
}

// ---- Test driver (leave as is) ----
function runInterceptorScenario(name) {
  const clone = (req, patch) => ({ ...req, ...patch, headers: { ...req.headers, ...(patch && patch.headers) } });
  const ok = (req, body) => ({ status: 200, body, url: req.url });

  const scenarios = {
    order() {
      const log = [];
      const tag = (id) => (req, next) => {
        log.push("req:" + id);
        const res = next(req);
        log.push("res:" + id);
        return res;
      };
      const handle = createHttpHandler([tag("a"), tag("b"), tag("c")], (req) => {
        log.push("backend");
        return ok(req, "hi");
      });
      const res = handle({ url: "/things", headers: {} });
      return { log, status: res.status, body: res.body };
    },
    immutableRequest() {
      const auth = (req, next) => next(clone(req, { headers: { authorization: "Bearer t" } }));
      const handle = createHttpHandler([auth], (req) => ok(req, req.headers));
      const original = { url: "/me", headers: { accept: "json" } };
      const res = handle(original);
      return { sent: res.body, original };
    },
    shortCircuit() {
      let backendCalls = 0;
      const cache = new Map([["/cached", "from-cache"]]);
      const caching = (req, next) => {
        if (cache.has(req.url)) return { status: 200, body: cache.get(req.url), url: req.url };
        return next(req);
      };
      const handle = createHttpHandler([caching], (req) => {
        backendCalls++;
        return ok(req, "from-network");
      });
      const cached = handle({ url: "/cached", headers: {} });
      const fresh = handle({ url: "/fresh", headers: {} });
      return { cached: cached.body, fresh: fresh.body, backendCalls };
    },
    retry() {
      let attempts = 0;
      const retrying = (req, next) => {
        let res = next(req);
        let tries = 1;
        while (res.status >= 500 && tries < 3) {
          res = next(clone(req, { headers: { "x-retry": String(tries) } }));
          tries++;
        }
        return { ...res, tries };
      };
      const handle = createHttpHandler([retrying], (req) => {
        attempts++;
        return attempts < 3 ? { status: 503, body: "busy", url: req.url } : ok(req, "done");
      });
      const res = handle({ url: "/flaky", headers: {} });
      return { attempts, status: res.status, body: res.body, tries: res.tries };
    },
    noInterceptors() {
      const handle = createHttpHandler([], (req) => ok(req, "direct"));
      const res = handle({ url: "/direct", headers: {} });
      return { status: res.status, body: res.body, url: res.url };
    },
    reusedHandler() {
      const seen = [];
      const record = (req, next) => {
        seen.push(req.url);
        return next(req);
      };
      const handle = createHttpHandler([record, record], (req) => ok(req, req.url));
      const first = handle({ url: "/one", headers: {} }).body;
      const second = handle({ url: "/two", headers: {} }).body;
      return { seen, first, second };
    },
    mutableContext() {
      const attemptsByRequest = [];
      const counting = (req, next) => {
        req.context.attempt = (req.context.attempt || 0) + 1;
        const res = next(req);
        if (res.status >= 500 && req.context.attempt < 3) return counting(req, next);
        attemptsByRequest.push(req.context.attempt);
        return res;
      };
      const handle = createHttpHandler([counting], (req) =>
        req.context.attempt < 3 ? { status: 500, body: "err", url: req.url } : ok(req, "ok"),
      );
      const res = handle({ url: "/ctx", headers: {}, context: {} });
      return { attemptsByRequest, status: res.status, body: res.body };
    },
    transformResponse() {
      const upper = (req, next) => {
        const res = next(req);
        return { ...res, body: String(res.body).toUpperCase() };
      };
      const exclaim = (req, next) => {
        const res = next(req);
        return { ...res, body: res.body + "!" };
      };
      const handle = createHttpHandler([upper, exclaim], (req) => ok(req, "hello"));
      return handle({ url: "/t", headers: {} }).body;
    },
    thrownError() {
      const boom = (req, next) => {
        if (req.url === "/boom") throw new Error("interceptor exploded");
        return next(req);
      };
      const handle = createHttpHandler([boom], (req) => ok(req, "fine"));
      let message = null;
      try {
        handle({ url: "/boom", headers: {} });
      } catch (e) {
        message = e.message;
      }
      const after = handle({ url: "/ok", headers: {} }).body;
      return { message, after };
    },
    longChain() {
      const marks = [];
      const chain = Array.from({ length: 500 }, (_, i) => (req, next) => {
        marks.push(i);
        return next(clone(req, { headers: { depth: String(i) } }));
      });
      const handle = createHttpHandler(chain, (req) => ok(req, req.headers.depth));
      const res = handle({ url: "/deep", headers: {} });
      return { first: marks[0], last: marks[marks.length - 1], calls: marks.length, body: res.body };
    },
  };
  if (!scenarios[name]) throw new Error("Unknown scenario " + name);
  return scenarios[name]();
}
`;

const FORM_VALIDATION_STARTER = `/**
 * Validate a flat form group.
 *
 * @param {{ fields: Record<string, { validators?: object[], disabled?: boolean }>, validators?: object[] }} schema
 * @param {Record<string, unknown>} value
 * @returns {{ status: string, value: object, rawValue: object, errors: object|null, fieldErrors: object }}
 */
function validateForm(schema, value) {
  // Your code here (this placeholder validates nothing)
  return {
    status: "VALID",
    value: { ...value },
    rawValue: { ...value },
    errors: null,
    fieldErrors: {},
  };
}
`;

export default {
  id: "fe-angular",
  trackId: "frontend",
  name: "Angular",
  description:
    "Angular 22 for engineers who already ship React or Vue: standalone components (NgModules are legacy), the built-in `@if` / `@for` / `@switch` control flow, signals as the reactivity primitive, signal inputs and outputs, dependency injection and `inject()`, the signals/RxJS interop that the ecosystem is mid-migration on, the Router, forms, `HttpClient` and interceptors, change detection with OnPush and zoneless, TestBed, and SSR with hydration. Three topics are code challenges: a signal graph, the functional interceptor chain, and a form validation engine.",
  refs: [
    { label: "Angular: What is Angular?", url: "https://angular.dev/overview", kind: "docs" },
    { label: "Angular: Signals overview", url: "https://angular.dev/guide/signals", kind: "docs" },
    { label: "Angular: NgModules (legacy)", url: "https://angular.dev/guide/ngmodules/overview", kind: "docs" },
    { label: "sudheerj: Angular Interview Questions", url: "https://github.com/sudheerj/angular-interview-questions", kind: "interview-prep" },
  ],
  topics: [
    {
      id: "ng-what-is-angular",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "What Angular Is, and How It Differs",
      summary:
        "Angular is a framework rather than a library: routing, forms, an HTTP client, a dependency-injection container, a test setup and a build pipeline all ship from the same team on the same release train. React gives you a rendering library and asks you to assemble the rest; Angular gives you one opinionated answer per problem. That is the whole trade. You lose the freedom to pick your own router or data layer, and you gain a codebase where any Angular engineer can find things, plus first-party migration schematics (`ng update`) that rewrite your code when the framework changes.\n\nThe second structural difference is that templates are a separate, compiled language, not JavaScript. Angular's compiler parses the template ahead of time, type-checks every binding against the component class when `strictTemplates` is on, and emits instructions that know which nodes are static. JSX is just function calls, so nothing checks that `<Foo bar={x} />` matches `Foo`'s props beyond what TypeScript can infer at the call site; Angular catches a misspelled input or a wrong-typed binding at build time.\n\nThe Angular of 2026 is not the Angular most tutorials teach. Standalone components are the default (since v19), NgModules are documented under \"Extended Ecosystem\" as legacy, signals are the recommended reactivity primitive, `@if` / `@for` / `@switch` replaced `*ngIf` / `*ngFor`, zoneless change detection is the default (v21) and `OnPush` is the default change-detection strategy (v22). From v22 Angular also moved from a six-month to a twelve-month major release cycle, with 12 months of active support plus 12 months of LTS. If a video or article shows `NgModule`, `*ngIf` and `platformBrowserDynamic()`, it is describing a version that is out of support.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Angular: What is Angular?", url: "https://angular.dev/overview", kind: "docs" },
        { label: "Angular: Versioning and releases", url: "https://angular.dev/reference/releases", kind: "docs" },
        { label: "ANGULARarchitects: Angular 22 - The Most Important New Features at a Glance", url: "https://www.angulararchitects.io/en/blog/angular-22-the-most-important-new-features-at-a-glance/", kind: "article" },
        { label: "sudheerj: Angular Interview Questions", url: "https://github.com/sudheerj/angular-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Angular Tutorial for Beginners 2026 - Zero to Interview Ready | Angular 21",
        channel: "Interview Happy",
        url: "https://www.youtube.com/watch?v=Bf0SJZwd5Ck",
        videoId: "Bf0SJZwd5Ck",
        durationLabel: "2:15:07",
        startSeconds: 92,
        chapterLabel: "Angular fundamentals",
      },
      alternateVideos: [
        {
          title: "What’s new in Angular v22",
          channel: "Angular",
          url: "https://www.youtube.com/watch?v=h5OJUSS_8IA",
          videoId: "h5OJUSS_8IA",
          durationLabel: "17:19",
        },
        {
          title: "Angular Crash Course for beginners | Learn Angular in 90 Minutes",
          channel: "Code with Ahsan",
          url: "https://www.youtube.com/watch?v=oUmVFHlwZsI",
          videoId: "oUmVFHlwZsI",
          durationLabel: "1:29:08",
          startSeconds: 330,
          chapterLabel: "Angular vs React",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ng-what-is-angular-q1",
          prompt: "Which of these are maintained by the Angular team and versioned with the framework? (Select all that apply.)",
          options: [
            "The router (`@angular/router`)",
            "The HTTP client (`@angular/common/http`)",
            "Reactive forms (`@angular/forms`)",
            "The NgRx store",
            "Apollo Angular for GraphQL",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Routing, HTTP and forms ship in Angular's own packages on the same release train, which is what \"batteries included\" means in practice. NgRx and Apollo Angular are community packages with their own versioning and upgrade timelines.",
        },
        {
          id: "ng-what-is-angular-q2",
          prompt: "A component class declares `count = 0` and its template contains `<p>{{ cuont }}</p>`. What happens?",
          options: [
            "The Angular compiler reports a template type error at build time",
            "It renders an empty paragraph, because unknown template identifiers resolve to `undefined`",
            "It throws at runtime the first time the component renders",
            "It renders the literal text `cuont`",
          ],
          correctIndex: 0,
          explanation:
            "Angular compiles templates ahead of time and type-checks every binding against the component class, so a typo is a build error, not a silent blank. The \"renders nothing\" behaviour is what AngularJS did and what an untyped template language would do.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-what-is-angular-q3",
          prompt: "You see one component with `standalone: true` and another with no `standalone` property at all, both in an Angular 22 codebase. What is true?",
          options: [
            "Both are standalone; the explicit `true` is redundant because `standalone` has defaulted to `true` since v19",
            "Only the first is standalone; omitting the flag means the component must be declared in an NgModule",
            "The second is invalid and will not compile",
            "Both are standalone only if the application was bootstrapped with `bootstrapApplication`",
          ],
          correctIndex: 0,
          explanation:
            "`standalone` defaults to `true` from Angular 19 onwards, so writing it is harmless noise. Opting out now requires an explicit `standalone: false`, which is the flag you'll see on components that are still declared in an NgModule.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-what-is-angular-q4",
          prompt: "What is the role of zone.js in a new Angular 22 application?",
          options: [
            "There isn't one: zoneless change detection is the default since v21, and `zone.js` can be removed from the build",
            "It still patches browser APIs, but only for `setTimeout` and `Promise`",
            "It is required, because Angular has no other way to know when to run change detection",
            "It is only used by the testing utilities and is stripped from production builds",
          ],
          correctIndex: 0,
          explanation:
            "Zoneless is the default from v21: Angular schedules change detection from explicit notifications (a signal read in a template changing, `markForCheck`, `AsyncPipe`, bound listeners) instead of from monkey-patched browser APIs. Existing apps can still opt back in with `provideZoneChangeDetection()`.",
        },
        {
          id: "ng-what-is-angular-q5",
          prompt: "In Angular 22, what is `ChangeDetectionStrategy.Default`?",
          options: [
            "A deprecated alias for `ChangeDetectionStrategy.Eager`, which is no longer the default",
            "The strategy every component gets unless it opts into `OnPush`",
            "A removed enum member that no longer compiles",
            "The strategy used only for components rendered on the server",
          ],
          correctIndex: 0,
          explanation:
            "v22 made `OnPush` the default and renamed the old default to `Eager`, keeping `Default` as a deprecated alias. The name change matters because \"Default\" no longer describes what you get by default.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-what-is-angular-q6",
          prompt: "How long is a given Angular major version supported, and how often do majors ship as of v22?",
          options: [
            "A major every 12 months, supported for 24 months (12 active plus 12 LTS)",
            "A major every 6 months, supported for 18 months (6 active plus 12 LTS)",
            "A major every 12 months, supported until the next major ships",
            "There is no fixed cadence; majors ship when breaking changes accumulate",
          ],
          correctIndex: 0,
          explanation:
            "Angular moved from a six-month to a twelve-month major cadence with v22, with 12 months of active support followed by 12 months of LTS. The six-month/18-month answer is the policy that held up to v21 and is what older articles describe.",
        },
        {
          id: "ng-what-is-angular-q7",
          prompt: "Which of these are genuine architectural differences between Angular and React, rather than marketing? (Select all that apply.)",
          options: [
            "Angular has a hierarchical dependency-injection container built into the framework",
            "Angular templates are a compiled, separately type-checked language rather than JavaScript expressions",
            "Angular ships first-party codemods (`ng update`) that rewrite application code across major versions",
            "Angular re-renders a component only when its own state changes, while React re-renders the whole tree",
            "Angular cannot be used to build a single-page application without server-side rendering",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "DI, an ahead-of-time compiled template language and first-party migration schematics are real structural differences. The fourth option describes neither framework accurately, and Angular has always been usable as a pure client-side SPA.",
        },
        {
          id: "ng-what-is-angular-q8",
          prompt: "A tutorial you found shows `platformBrowserDynamic().bootstrapModule(AppModule)`, `*ngIf`, and `@Input()` decorators. What should you conclude?",
          options: [
            "It targets a pre-v17 Angular and teaches patterns that current docs treat as legacy",
            "It's the standard way to write Angular; the newer syntax is optional sugar",
            "It won't compile at all on Angular 22",
            "It's server-side rendering setup, which still uses the older APIs",
          ],
          correctIndex: 0,
          explanation:
            "All three still compile — Angular keeps backwards compatibility for a long time — but current docs bootstrap with `bootstrapApplication`, use `@if`, and use signal `input()`. Most Angular material online is from the v8–v15 era, which is the single biggest source of wrong mental models.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-what-is-angular-q9",
          prompt: "What does `ng test` run in a project generated by the current Angular CLI?",
          options: [
            "Vitest with jsdom, both installed by default",
            "Karma driving a real Chrome instance",
            "Jest with a custom Angular preset",
            "Playwright component tests",
          ],
          correctIndex: 0,
          explanation:
            "New Angular projects ship with Vitest and jsdom, and Karma is now the legacy path with its own migration guide. Jest was never the first-party choice, and Playwright is for end-to-end tests.",
        },
        {
          id: "ng-what-is-angular-q10",
          prompt: "Your team is choosing between Angular and React for a long-lived internal product with ten engineers rotating through it. Which argument for Angular is actually supported by how the framework works?",
          options: [
            "Upgrades are a framework-wide, schematic-assisted event rather than N independent library upgrades",
            "Angular applications are always faster because change detection is more efficient than React's",
            "Angular removes the need for state management entirely",
            "Angular bundles are smaller than React bundles for equivalent applications",
          ],
          correctIndex: 0,
          explanation:
            "The defensible argument is coordination cost: one version, one upgrade, `ng update` codemods, and one obvious way to route, fetch and validate. Performance and bundle size depend far more on what you build than on which of the two you pick.",
        },
      ],
    },
    {
      id: "ng-standalone-components",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "Standalone Components (NgModules Are Legacy)",
      summary:
        "For a decade every Angular component, directive and pipe had to be `declarations` of exactly one `NgModule`, and anything it used had to be reachable through that module's `imports`. The module was a second dependency graph that duplicated the import statements you'd already written, and getting it wrong produced errors about symbols that were obviously in scope. Standalone components delete that layer: a component declares its own `imports` array listing exactly the components, directives and pipes its template uses, and the compiler checks it directly.\n\nStandalone is the default from Angular v19 — `standalone: true` is now redundant, and a component that still belongs to an NgModule must say `standalone: false`. Bootstrapping changed to match: `bootstrapApplication(App, { providers: [...] })` replaces `platformBrowserDynamic().bootstrapModule(AppModule)`, and library setup moved from `SomeModule.forRoot(config)` to environment-provider functions such as `provideRouter(routes)` and `provideHttpClient(withInterceptors([...]))`. Lazy loading no longer needs a module either: a route's `loadComponent: () => import('./admin-page')` is enough.\n\nThe tree-shaking argument is the one people get backwards. NgModules were opaque to the bundler — importing a module pulled in everything it declared — while a standalone component's `imports` are ordinary ES module references, so unused declarations genuinely drop out. The gotcha that bites newcomers is asymmetric: forget to import a *component*, and the compiler errors with \"not a known element\"; forget to import an *attribute directive*, and the selector simply never matches, so the directive silently does nothing and the template compiles clean.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Angular: Anatomy of components (imports and standalone)", url: "https://angular.dev/guide/components", kind: "docs" },
        { label: "Angular: NgModules (documented as legacy)", url: "https://angular.dev/guide/ngmodules/overview", kind: "docs" },
        { label: "Angular University: Angular Standalone Components - Complete Guide", url: "https://blog.angular-university.io/angular-standalone-components/", kind: "article" },
        { label: "sudheerj: Angular Interview Questions", url: "https://github.com/sudheerj/angular-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Angular 19 Tutorial | Full Angular Course In One Video | Angular From Scratch in 2026",
        channel: "FED Learning",
        url: "https://www.youtube.com/watch?v=jYV2enNmplM",
        videoId: "jYV2enNmplM",
        durationLabel: "9:19:25",
        startSeconds: 844,
        chapterLabel: "Standalone Components",
      },
      alternateVideos: [
        {
          title: "Angular Standalone Components Explained: The Complete Guide (v17 & Higher)",
          channel: "procademy",
          url: "https://www.youtube.com/watch?v=2SubpkPOE7M",
          videoId: "2SubpkPOE7M",
          durationLabel: "29:37",
        },
        {
          title: "Getting Started with Standalone Components in Angular",
          channel: "Angular",
          url: "https://www.youtube.com/watch?v=x5PZwb4XurU",
          videoId: "x5PZwb4XurU",
          durationLabel: "11:49",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ng-standalone-components-q1",
          prompt: "What can legitimately appear in a standalone component's `imports` array? (Select all that apply.)",
          options: [
            "Another standalone component",
            "A standalone directive",
            "A standalone pipe",
            "An NgModule such as `ReactiveFormsModule`",
            "A service class marked `@Service()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "`imports` lists template dependencies: standalone components, directives and pipes, plus NgModules when you need what a legacy or third-party module exports. Services are never imported — they come from dependency injection, through `providers` or `@Service()`.",
        },
        {
          id: "ng-standalone-components-q2",
          prompt: "You write a custom attribute directive with selector `[appAutofocus]`, use `<input appAutofocus>` in a standalone component's template, and forget to add the directive to `imports`. What happens?",
          options: [
            "The template compiles and the input renders, but the directive never runs",
            "The compiler reports that `appAutofocus` is not a known attribute",
            "It throws a runtime error when the component is created",
            "Angular falls back to searching the application's other components for a matching selector",
          ],
          correctIndex: 0,
          explanation:
            "An unmatched attribute selector is indistinguishable from a plain HTML attribute, so nothing errors — the directive is simply never instantiated. Missing *components* do error (\"not a known element\"), which is why this asymmetry catches people.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-standalone-components-q3",
          prompt: "A component in a legacy area of the codebase is listed in an NgModule's `declarations`. What must its `@Component` metadata contain in Angular 22?",
          options: [
            "`standalone: false`",
            "`standalone: true`",
            "Nothing special; `declarations` accepts any component",
            "`imports: []`",
          ],
          correctIndex: 0,
          explanation:
            "Since the default flipped to `true`, a component can only be declared in an NgModule if it explicitly opts out with `standalone: false`. Leaving it off now makes it standalone, and Angular rejects declaring a standalone component in a module.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-standalone-components-q4",
          prompt: "What replaced `SomeLibraryModule.forRoot(config)` in a standalone application?",
          options: [
            "Environment-provider functions such as `provideRouter(routes)` passed to `bootstrapApplication`",
            "Adding the module to the root component's `imports` array",
            "A global `providers` field on the `@Component` decorator of the root component",
            "A `forRoot` call inside the root component's constructor",
          ],
          correctIndex: 0,
          explanation:
            "`bootstrapApplication(App, { providers: [provideRouter(routes), provideHttpClient()] })` is the standalone equivalent, and those `provide*` functions return `EnvironmentProviders`. Importing a `forRoot`-style module into a component would scope its providers to that component, which is not what `forRoot` meant.",
        },
        {
          id: "ng-standalone-components-q5",
          prompt: "How do you lazy-load a standalone page component from a route?",
          options: [
            "`{ path: 'admin', loadComponent: () => import('./admin-page') }`",
            "`{ path: 'admin', loadChildren: () => import('./admin.module').then(m => m.AdminModule) }`",
            "`{ path: 'admin', component: () => import('./admin-page') }`",
            "`{ path: 'admin', lazy: true, component: AdminPage }`",
          ],
          correctIndex: 0,
          explanation:
            "`loadComponent` takes a loader returning a promise for a component; if the file uses a default export you can return the `import()` promise directly. `loadChildren` still exists but is for lazily loading a set of child *routes*, and it no longer needs an NgModule either.",
        },
        {
          id: "ng-standalone-components-q6",
          prompt: "Which statements about tree-shaking and standalone components are true? (Select all that apply.)",
          options: [
            "A standalone component's `imports` are ordinary ES module references, so unused symbols can be dropped by the bundler",
            "Importing an NgModule pulls in everything it declares and exports, whether the template uses it or not",
            "Replacing `CommonModule` with the built-in `@if` / `@for` blocks removes an import entirely",
            "Standalone components are always smaller at runtime because Angular skips creating an injector for them",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The win is that the dependency graph is now the module graph the bundler already understands, and built-in control flow removes the need to import `CommonModule` at all. Standalone components still get an element injector — that's unrelated to bundle size.",
        },
        {
          id: "ng-standalone-components-q7",
          prompt: "Can a standalone component be used from a component that is still declared in an NgModule?",
          options: [
            "Yes — add the standalone component to that NgModule's `imports`",
            "Yes — add it to that NgModule's `declarations`",
            "No — the two systems can't be mixed in one application",
            "Only if the NgModule sets `schemas: [CUSTOM_ELEMENTS_SCHEMA]`",
          ],
          correctIndex: 0,
          explanation:
            "A standalone component behaves like a tiny module of its own, so NgModules consume it through `imports`. Putting it in `declarations` is an error, because a standalone component isn't owned by any module — that interop is exactly what makes incremental migration possible.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-standalone-components-q8",
          prompt: "What does `ng generate @angular/core:standalone` do?",
          options: [
            "Runs a codemod that converts declarations to standalone, removes unnecessary NgModules and switches bootstrapping",
            "Creates a new standalone component in the current directory",
            "Adds `standalone: true` to every component and stops there",
            "Generates a report of which components could be made standalone, without changing code",
          ],
          correctIndex: 0,
          explanation:
            "It's a multi-step migration schematic: convert declarations, prune modules, then move bootstrap to `bootstrapApplication`. Generating a single component is plain `ng generate component`.",
        },
        {
          id: "ng-standalone-components-q9",
          prompt: "Where should an application-wide service live in a standalone codebase?",
          options: [
            "In a class marked `@Service()` (or `@Injectable({ providedIn: 'root' })`), with no module involved",
            "In the `providers` array of an NgModule imported once at the root",
            "In the root component's `providers` array",
            "In `bootstrapApplication`'s `providers` array, always",
          ],
          correctIndex: 0,
          explanation:
            "Root-provided services are tree-shakable and need no registration anywhere. Bootstrap `providers` are for configuration that can't be expressed on the class (tokens, `provide*` functions), and a root component's `providers` would create an element-injector instance rather than a true application singleton.",
        },
        {
          id: "ng-standalone-components-q10",
          prompt: "An existing large application still has a hundred NgModules. What's the realistic migration path?",
          options: [
            "Convert leaf components to standalone first, then delete modules whose declarations are all standalone, keeping both styles compiling side by side",
            "Rewrite the whole application in one branch, because the two styles can't coexist",
            "Leave it alone: NgModules are not deprecated and standalone offers nothing for existing code",
            "Set `standalone: true` on every component at once and delete all modules in the same commit",
          ],
          correctIndex: 0,
          explanation:
            "Interop in both directions is deliberate so migration can be incremental, and the official schematic works file by file. Flipping everything at once breaks on the components whose templates depended on a module's transitive exports.",
        },
      ],
    },
    {
      id: "ng-templates-control-flow",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "Templates and the Built-In Control Flow",
      summary:
        "Angular templates used to express conditionals and loops with structural directives: `*ngIf`, `*ngFor` and `*ngSwitchCase` were syntactic sugar for `<ng-template>` plus a directive, which meant every conditional cost a directive instance, needed `CommonModule` in scope, and produced type-narrowing that the template checker had to special-case. Angular 17 replaced them with `@if`, `@for` and `@switch` — blocks understood by the compiler itself. They're always in scope, they narrow types properly, and they compile to smaller, faster instructions.\n\n`@for` made one deliberate breaking change: `track` is mandatory. Angular refuses to guess identity, because a wrong guess shows up as scrambled DOM state rather than a crash. `@for` also reuses views more aggressively than `*ngFor` did — if the tracked key changes but the object reference is the same, Angular updates the existing view's bindings instead of destroying and recreating it. `@switch` compares with `===`, never falls through, and since v22 supports exhaustiveness checking with `@default never;`, which turns an unhandled union member into a compile error.\n\nTwo gotchas are worth memorising. Exhaustiveness relies on TypeScript narrowing, which only works on variables, so `@switch (state())` on a signal silently opts out — assign it to a `@let` first. And template expressions remain a restricted language: one expression per binding, no statements, only an allow-list of globals. Angular 22 relaxed this slightly by allowing inline arrow functions, but a template is still not a place to compute anything expensive, because it re-evaluates on every check of that view.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Angular: Control flow (@if, @for, @switch)", url: "https://angular.dev/guide/templates/control-flow", kind: "docs" },
        { label: "Angular: Control flow syntax migration", url: "https://angular.dev/reference/migrations/control-flow", kind: "docs" },
        { label: "Angular University: Angular @for - Complete Guide", url: "https://blog.angular-university.io/angular-for/", kind: "article" },
        { label: "justangular: It's ok to use function calls in Angular templates", url: "https://justangular.com/blog/its-ok-to-use-function-calls-in-angular-templates/", kind: "article" },
      ],
      video: {
        title: "Angular 17 - New Build-In Control Flow Overview 🚀",
        channel: "Decoded Frontend",
        url: "https://www.youtube.com/watch?v=DOffmVeBk0o",
        videoId: "DOffmVeBk0o",
        durationLabel: "14:01",
      },
      alternateVideos: [
        {
          title: "The Angular @switch upgrades you should know about",
          channel: "Brian Treese",
          url: "https://www.youtube.com/watch?v=hkN68hCbzHU",
          videoId: "hkN68hCbzHU",
          durationLabel: "7:48",
        },
        {
          title: "Angular 19 Tutorial | Full Angular Course In One Video | Angular From Scratch in 2026",
          channel: "FED Learning",
          url: "https://www.youtube.com/watch?v=jYV2enNmplM",
          videoId: "jYV2enNmplM",
          durationLabel: "9:19:25",
          startSeconds: 4680,
          chapterLabel: "Structural Directive - *ngFor vs @for()",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ng-templates-control-flow-q1",
          prompt: "What does the Angular compiler do with this?\n\n```html\n@for (item of items) {\n  <li>{{ item.name }}</li>\n}\n```",
          options: [
            "Rejects it: `@for` requires a `track` expression",
            "Compiles it and tracks by identity (`===`) as a default",
            "Compiles it and tracks by `$index` as a default",
            "Compiles it but logs a development-mode warning",
          ],
          correctIndex: 0,
          explanation:
            "`track` is mandatory in `@for` — the compiler won't pick a default, because a wrong identity choice shows up as mangled DOM state rather than an error. Use `track item.id`, or `track $index` for a collection that never reorders.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-templates-control-flow-q2",
          prompt: "Which implicit variables are available inside a `@for` block? (Select all that apply.)",
          options: ["`$index`", "`$count`", "`$first` and `$last`", "`$even` and `$odd`", "`$key`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "`@for` exposes `$index`, `$count`, `$first`, `$last`, `$even` and `$odd`, and you can alias any of them with `let idx = $index` — which is how you read an outer loop's index from a nested one. There is no `$key`; `@for` iterates values, not entries.",
        },
        {
          id: "ng-templates-control-flow-q3",
          prompt: "A `@for` block tracks by `user.id`. The array is replaced with new objects, but one of them has the same `id` and a different `name`. What does Angular do with that row?",
          options: [
            "Keeps the existing view and updates its bindings, including any child component inputs",
            "Destroys the view and creates a new one, because the object reference changed",
            "Leaves the row untouched, because the tracked key didn't change",
            "Throws a duplicate-key error",
          ],
          correctIndex: 0,
          explanation:
            "`@for` prioritises view reuse: same tracked key means same view, with bindings updated in place. `*ngFor` with `trackBy` behaved differently here — a new object reference remounted the element — which is a documented breaking change of the migration.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-templates-control-flow-q4",
          prompt: "What does `@empty` do?\n\n```html\n@for (item of items; track item.id) {\n  <li>{{ item.name }}</li>\n} @empty {\n  <li>Nothing here yet.</li>\n}\n```",
          options: [
            "Renders its content when the collection has no items",
            "Renders its content when any item is `null` or `undefined`",
            "Renders once after the last item, like a footer row",
            "Renders while the collection is still being loaded",
          ],
          correctIndex: 0,
          explanation:
            "`@empty` is the zero-length fallback, and it must come immediately after the `@for` block. It has no notion of loading state — that's what `@defer`'s `@loading` block or a signal on the component is for.",
        },
        {
          id: "ng-templates-control-flow-q5",
          prompt: "What does this render when `userPermissions` is `'editor'`?\n\n```html\n@switch (userPermissions) {\n  @case ('admin') { <admin-panel /> }\n  @case ('reviewer')\n  @case ('editor') { <editor-panel /> }\n  @default { <viewer-panel /> }\n}\n```",
          options: [
            "`<editor-panel />` only",
            "`<editor-panel />` and `<viewer-panel />`, because `@switch` falls through",
            "`<viewer-panel />`, because consecutive `@case` blocks are invalid",
            "Nothing, because `'editor'` has no block of its own",
          ],
          correctIndex: 0,
          explanation:
            "Consecutive `@case` statements share the block that follows them, so `'reviewer'` and `'editor'` both render the editor panel. `@switch` has no fall-through, so there's no `break` and `@default` is not also rendered.",
        },
        {
          id: "ng-templates-control-flow-q6",
          prompt: "`state` is typed `'loggedOut' | 'loading' | 'loggedIn'` and the template has `@case ('loggedOut')`, `@case ('loggedIn')` and `@default never;`. What happens?",
          options: [
            "A compile error, because `'loading'` is not handled",
            "It compiles; `@default never;` just means \"render nothing by default\"",
            "A runtime error the first time `state` is `'loading'`",
            "A compile error, because `@default never;` is only allowed with `@case` on numbers",
          ],
          correctIndex: 0,
          explanation:
            "`@default never;` (Angular 22) asks the template type checker to prove the union is exhausted, so an unhandled member fails the build — the same trick as assigning to a `never`-typed variable in TypeScript. It's how you make adding a union member break every switch that forgot it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-templates-control-flow-q7",
          prompt: "`mode` is a signal of type `'a' | 'b'`. Why does `@switch (mode()) { … @default never; }` fail to narrow exhaustively?",
          options: [
            "TypeScript narrowing works on variables, not on function-call results, so you must assign it with `@let m = mode();` first",
            "Signals aren't supported in `@switch` at all",
            "`@default never;` only works with string literal unions written inline",
            "Calling a signal inside `@switch` creates a new dependency on every check, which disables narrowing",
          ],
          correctIndex: 0,
          explanation:
            "Exhaustiveness checking is built on TypeScript narrowing, which needs a stable reference; a call expression is re-evaluated so it can't be narrowed. The documented workaround is `@let m = mode();` and then `@switch (m)`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-templates-control-flow-q8",
          prompt: "What does `as` do here?\n\n```html\n@if (user.profile.settings.startDate; as startDate) {\n  {{ startDate }}\n}\n```",
          options: [
            "Binds the truthy result of the condition to a local name for use inside the block",
            "Declares a two-way binding between the block and `startDate`",
            "Creates a template reference variable usable anywhere in the template",
            "Caches the expression for the lifetime of the component",
          ],
          correctIndex: 0,
          explanation:
            "`@if (expr; as name)` stores the evaluated condition so you don't repeat a long path, and it narrows the type inside the block. Its scope is the block, unlike `@let`, which is visible for the rest of the enclosing template.",
        },
        {
          id: "ng-templates-control-flow-q9",
          prompt: "Which of these are true about template expressions in Angular 22? (Select all that apply.)",
          options: [
            "Only an allow-list of globals is visible, so `window` and `localStorage` are not",
            "Inline arrow functions are now allowed in templates",
            "`@if`, `@for` and `@switch` need no import, unlike `*ngIf` which needed `CommonModule`",
            "A binding expression is re-evaluated every time Angular checks that view",
            "Assignments and statements such as `i++` are allowed inside interpolations",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Templates are a restricted expression language with an allow-list of globals, no statements in interpolations, and re-evaluation on every check of the view — which is why expensive work belongs in a `computed`. v22 added inline arrow functions for short callbacks.",
        },
        {
          id: "ng-templates-control-flow-q10",
          prompt: "You need to loop over a list and skip finished items. Which is the correct current-Angular approach?",
          options: [
            "Expose a `computed()` of the filtered list and `@for` over that",
            "Put `@if` and `@for` on the same element, the way `*ngIf` and `*ngFor` used to be combined",
            "Use `@for` with a `filter` clause in the block header",
            "Use `@for` and `continue` inside the block when the item is finished",
          ],
          correctIndex: 0,
          explanation:
            "`@for` has no `filter` clause and no flow-modifying statements such as `continue` or `break`, so filtering belongs in the component as a `computed`, where it is memoised. Nesting an `@if` inside the `@for` also works but re-renders empty views for skipped items.",
        },
      ],
    },
    {
      id: "ng-content-projection",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "Content Projection with ng-content",
      summary:
        "`<ng-content>` is Angular's answer to `children` in React and `<slot>` in Vue: a placeholder in a component's template that says \"whatever the caller put between my tags renders here\". It is not a component or a DOM element — the compiler resolves every `<ng-content>` at build time, so you cannot create, remove or bind to one at runtime. Multiple slots are selected with CSS selectors via `select`, a slot without `select` catches everything unmatched, `ngProjectAs` lets a caller pretend an element matches a different selector, and child content inside the `<ng-content>` tags acts as fallback when nothing is projected.\n\nThe part that separates people who use Angular from people who understand it is *ownership*. Projected content is rendered inside the receiving component but still belongs to the declaring component's view. Two consequences follow. Change detection: the content is checked when the parent is checked, so wrapping an expensive component in an `OnPush` shell does not protect it. Dependency injection: projected content resolves tokens against the parent's injector, which is why a receiving component's `viewProviders` are invisible to it while its `providers` are — that distinction exists almost entirely for this case.\n\nThe common trap is conditional projection. Angular always instantiates content destined for an `<ng-content>` placeholder, even one inside a block that never renders, so `@if (open) { <ng-content /> }` still constructs the projected children (and runs their constructors and HTTP calls). When you need genuinely lazy or repeated content, take a `TemplateRef` — `<ng-template>` plus `ngTemplateOutlet`, or a content query — instead of a slot.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Angular: Content projection with ng-content", url: "https://angular.dev/guide/components/content-projection", kind: "docs" },
        { label: "Angular: Slotting child content with ng-content", url: "https://angular.dev/guide/templates/ng-content", kind: "docs" },
        { label: "Angular University: ng-content and Content Projection - The Complete Guide", url: "https://blog.angular-university.io/angular-ng-content/", kind: "article" },
        { label: "sudheerj: Angular Interview Questions", url: "https://github.com/sudheerj/angular-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Content Projection in Angular - Complete Guide (Beginners/Advanced)",
        channel: "Decoded Frontend",
        url: "https://www.youtube.com/watch?v=N8S2mPuGkgg",
        videoId: "N8S2mPuGkgg",
        durationLabel: "26:17",
      },
      alternateVideos: [
        {
          title: "The beginner's guide to content projection in Angular",
          channel: "Brian Treese",
          url: "https://www.youtube.com/watch?v=1uyOR8oWKeM",
          videoId: "1uyOR8oWKeM",
          durationLabel: "10:32",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ng-content-projection-q1",
          prompt: "A card component's template is `@if (expanded()) { <ng-content /> }` and `expanded()` is `false`. The caller passes `<expensive-widget />` as content. What happens?",
          options: [
            "`ExpensiveWidget` is still constructed; only its DOM is not placed in the card",
            "`ExpensiveWidget` is not constructed until `expanded()` becomes `true`",
            "The template fails to compile, because `<ng-content>` can't appear inside `@if`",
            "`ExpensiveWidget` is constructed and destroyed on every toggle",
          ],
          correctIndex: 0,
          explanation:
            "Angular always instantiates content bound for an `<ng-content>` placeholder, hidden or not — the docs explicitly warn against conditionally including one. For genuinely lazy content, accept a `TemplateRef` and render it with `ngTemplateOutlet`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-content-projection-q2",
          prompt: "A receiving component declares `viewProviders: [ThemeService]` and the caller projects a child that injects `ThemeService`. Which instance does the child get?",
          options: [
            "The one from the caller's injector, because projected content belongs to the caller's view",
            "The one from `viewProviders`, because the child renders inside the receiving component",
            "A new instance created per projected child",
            "None — injection fails with a NullInjectorError in every case",
          ],
          correctIndex: 0,
          explanation:
            "`viewProviders` are visible only inside the component's own view; projected content is owned by the declaring component, so it resolves against that injector. Using `providers` instead of `viewProviders` is exactly how you make a service visible to projected content.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-content-projection-q3",
          prompt: "Which statements about `<ng-content>` are true? (Select all that apply.)",
          options: [
            "It is resolved at compile time and cannot be added or removed at runtime",
            "You cannot put directives, styles or arbitrary attributes on it",
            "Content inside the `<ng-content>` tags is rendered as a fallback when nothing matches",
            "A `<ng-content>` with no `select` captures everything that no other slot matched",
            "It renders a real DOM element that you can style with CSS",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "`<ng-content>` is a compiler placeholder, not an element — it produces no node of its own, which is why you can't style or decorate it. The catch-all slot and fallback content are both supported.",
        },
        {
          id: "ng-content-projection-q4",
          prompt: "Given the component template\n\n```html\n<ng-content select=\"card-title\" />\n<ng-content />\n```\n\nand the usage\n\n```html\n<custom-card>\n  <h3 ngProjectAs=\"card-title\">Hello</h3>\n  <p>Body</p>\n</custom-card>\n```\n\nwhere does the `<h3>` go, and what is rendered for it?",
          options: [
            "Into the first slot, rendered as a plain `<h3>Hello</h3>`",
            "Into the catch-all slot, because `<h3>` doesn't match `card-title`",
            "Into the first slot, rendered as `<card-title><h3>Hello</h3></card-title>`",
            "Nowhere — `ngProjectAs` only works on `<ng-template>`",
          ],
          correctIndex: 0,
          explanation:
            "`ngProjectAs` changes only what the element is *matched against*; the element itself is projected unchanged, with no wrapper added. It accepts a static value only, so you can't bind it to an expression.",
        },
        {
          id: "ng-content-projection-q5",
          prompt: "A wrapper component uses `ChangeDetectionStrategy.OnPush` and the caller projects a heavy component into it. The caller uses `Eager` change detection. How often is the heavy component checked?",
          options: [
            "Every time the caller is checked, because the projected content is part of the caller's view",
            "Only when the wrapper's inputs change, because the wrapper is OnPush",
            "Only when an event fires inside the heavy component",
            "Never, unless the heavy component reads a signal",
          ],
          correctIndex: 0,
          explanation:
            "`OnPush` on the receiving component can let Angular skip that component's *own* template, but projected content is checked with the declaring component. Putting an `OnPush` wrapper around slow content is a very common non-fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-content-projection-q6",
          prompt: "You need to read the projected children of a component from its class. Which query do you use?",
          options: [
            "`contentChildren(TabPanel)` — a content query",
            "`viewChildren(TabPanel)` — a view query",
            "`inject(ElementRef)` and walk the DOM",
            "`@Input() children: TabPanel[]`",
          ],
          correctIndex: 0,
          explanation:
            "Content queries find nodes projected *into* the component; view queries find nodes declared in the component's own template. Walking the DOM works only in a browser and breaks under SSR and hydration.",
        },
        {
          id: "ng-content-projection-q7",
          prompt: "Why do library components such as menus, tabs and lists often break when you wrap their items in your own component and project them?",
          options: [
            "Their `ContentChildren` queries still find the items, but the wiring they do assumes the items live directly in their own content view",
            "Angular refuses to project content through more than one component level",
            "`ngProjectAs` is required for any two-level projection and is easy to forget",
            "Projected items lose their component instances and become plain DOM nodes",
          ],
          correctIndex: 0,
          explanation:
            "The query usually matches, which is why the bug is subtle: what fails is the keyboard navigation, focus management and ARIA wiring these components set up assuming they own their children. Angular's own docs call this out for components such as `mat-menu`.",
        },
        {
          id: "ng-content-projection-q8",
          prompt: "What is the difference between a component's *content* and its *view*?",
          options: [
            "Content is what the caller passed between the component's tags; the view is what the component's own template declares",
            "Content is the rendered DOM; the view is the virtual representation of it",
            "Content is everything inside `<ng-content>` tags as fallback; the view is everything else",
            "They're the same thing; Angular uses both words interchangeably",
          ],
          correctIndex: 0,
          explanation:
            "That split is why there are two query families (`contentChild`/`contentChildren` versus `viewChild`/`viewChildren`) and two provider arrays (`providers` versus `viewProviders`). Getting it wrong is the usual reason a query returns `undefined`.",
        },
      ],
    },
    {
      id: "ng-signals",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "Signals: signal, computed, effect, linkedSignal",
      summary:
        "Signals are Angular's answer to a problem zone.js solved badly: knowing *what* changed. zone.js patched every asynchronous browser API and told Angular \"something might have happened\", after which Angular re-checked every binding in the application. A signal instead records, at read time, exactly which templates and derivations depend on it, so a write can mark precisely those consumers dirty. That is what makes zoneless change detection possible, and it's why signals are now the recommended primitive rather than one more state option.\n\nThe graph is pull-based and lazy. `computed()` does not run its derivation when a dependency changes; it marks itself stale and recomputes on the next read, then memoises. Dependencies are dynamic: only the signals actually read during the last evaluation count, so a branch that wasn't taken creates no subscription. Equality matters at every edge — the default is `Object.is`, and a write of an equal value notifies nobody, which is also why mutating an array in place and calling `set` with the same reference silently does nothing. Pass `{ equal }` when you need value semantics. Because a stale computed compares versions before recomputing downstream work, a change that cancels out (`0 → 2` through an `isEven` computed) stops propagating at that node.\n\n`effect()` is the escape hatch, not the tool: it is scheduled rather than synchronous, batches multiple writes into one run, and belongs on the boundary where signals meet non-reactive APIs (`localStorage`, a charting library, analytics). Copying one signal into another with an effect is the anti-pattern the docs warn about — use `computed` for derived values, and `linkedSignal` for state that is derived *and* user-writable, which resets to its computation whenever the source it's linked to changes.",
      level: "advanced",
      estMinutes: 95,
      isMilestone: true,
      webRefs: [
        { label: "Angular: Signals overview", url: "https://angular.dev/guide/signals", kind: "docs" },
        { label: "Angular: Dependent state with linkedSignal", url: "https://angular.dev/guide/signals/linked-signal", kind: "docs" },
        { label: "Angular: Side effects for non-reactive APIs (effect)", url: "https://angular.dev/guide/signals/effect", kind: "docs" },
        { label: "Angular University: Angular Signals - Complete Guide", url: "https://blog.angular-university.io/angular-signals/", kind: "article" },
      ],
      video: {
        title: "How to deeply understand Angular signals (...or anything)",
        channel: "Joshua Morony",
        url: "https://www.youtube.com/watch?v=C_xXv27_gHg",
        videoId: "C_xXv27_gHg",
        durationLabel: "10:51",
      },
      alternateVideos: [
        {
          title: "LinkedSignal in Angular 19: The Gem We Were Missing",
          channel: "Decoded Frontend",
          url: "https://www.youtube.com/watch?v=IPVwJmD2ZFQ",
          videoId: "IPVwJmD2ZFQ",
          durationLabel: "14:05",
        },
        {
          title: "Angular 19 Tutorial | Full Angular Course In One Video | Angular From Scratch in 2026",
          channel: "FED Learning",
          url: "https://www.youtube.com/watch?v=jYV2enNmplM",
          videoId: "jYV2enNmplM",
          durationLabel: "9:19:25",
          startSeconds: 8270,
          chapterLabel: "Signals",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Build a miniature version of Angular's signal graph: `signal`, `computed`, `effect`, `linkedSignal`, `flushEffects` and `untracked`.\n\n**`signal(initialValue, options?)`** returns a getter function with `.set(value)` and `.update(fn)`. Reading it inside a reactive context registers a dependency. `options.equal` defaults to `Object.is`; setting an equal value is not a change and must notify nobody.\n\n**`computed(fn, options?)`** returns a read-only getter. It is *lazy* (the derivation does not run until the value is read), *memoised* (a second read without any dependency change does not re-run it) and has *dynamic dependencies* (only signals read during the last evaluation count). A computed whose recomputed value is equal to its previous value must not cause its own consumers to re-run.\n\n**`effect(fn)`** registers a side effect and returns `{ destroy() }`. It does **not** run at creation: it is scheduled. `flushEffects()` runs every scheduled effect whose dependencies really changed, and keeps going until nothing is left scheduled. A destroyed effect never runs again.\n\n**`linkedSignal(computation)`** returns a writable getter. Its value is `computation()` until you `.set(...)` it; when the value produced by `computation()` changes, the override is discarded and the linked signal goes back to the computed value. Consumers must be notified both when it is set and when its source changes.\n\n**`untracked(fn)`** runs `fn` without registering any signal it reads as a dependency, and returns the result.\n\nThe tests call `runSignalScenario(name)`, which runs one named scenario and returns plain data. Leave the driver as it is.",
        starterCode: SIGNAL_GRAPH_STARTER,
        functionName: "runSignalScenario",
        testCases: [
          {
            description: "a computed is lazy and memoised: it runs on first read, not on creation or on set",
            args: ["lazyMemoizedComputed"],
            expected: [0, 2, 2, 1, 1, 10, 2],
          },
          {
            description: "a computed whose value doesn't change stops propagation to its consumers",
            args: ["equalityStopsPropagation"],
            expected: { runs: 2, effectLog: ["even", "odd"] },
          },
          {
            description: "dependencies are dynamic: an untaken branch creates no subscription",
            args: ["dynamicDependencies"],
            expected: ["hidden", 1, "hidden", 1, "count 10", 2, "count 11", 3, "hidden", 4, "hidden", 4],
          },
          {
            description: "effects are scheduled, and several writes collapse into one run with the latest value",
            args: ["effectsAreScheduled"],
            expected: { beforeFlush: [], afterFlush: [0], beforeSecondFlush: [0], seen: [0, 3] },
          },
          {
            description: "a custom `equal` suppresses a write that is equal by value but not by reference",
            args: ["customEquality"],
            expected: [0, 1],
          },
          {
            description: "`untracked` reads the latest value without subscribing to it",
            args: ["untrackedRead"],
            expected: ["ada:0", "grace:1"],
          },
          {
            description: "a destroyed effect stops running and unsubscribes",
            args: ["destroyStopsEffect"],
            expected: [0, 1],
            isEdgeCase: true,
          },
          {
            description: "a linkedSignal keeps an override until its source value changes",
            args: ["linkedSignalResets"],
            expected: ["ground", "sea", "email", "post"],
          },
          {
            description: "a linkedSignal notifies consumers when it is set and when its source changes",
            args: ["linkedSignalNotifies"],
            expected: ["a", "b", "x"],
          },
          {
            description: "a diamond dependency recomputes the shared node once per change, with no intermediate value",
            args: ["diamondNoGlitch"],
            expected: { seen: [12, 23], sumRuns: 2 },
            isEdgeCase: true,
          },
          {
            description: "a 200-deep chain updates once, and a write of the same value updates nothing",
            args: ["deepChain"],
            expected: [200, 205],
            isEdgeCase: true,
          },
          {
            description: "1,000 writes to a signal nobody watches do no derivation work at all",
            args: ["noSubscribersNoWork"],
            expected: { beforeRead: 0, runs: 1, value: 2000 },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "ng-signal-inputs-outputs",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "Signal Inputs, Outputs and model()",
      summary:
        "The `@Input()` decorator gave you a plain property that Angular assigned to, which meant reacting to a change required `ngOnChanges` and a `SimpleChanges` object full of `any`. `input()` returns an `InputSignal<T>` instead: a read-only signal you can feed straight into a `computed` or an `effect`, so derived state is expressed as a derivation rather than as imperative lifecycle code. `input.required<T>()` drops `undefined` from the type and is enforced at build time, which is the first time Angular could express \"this input is not optional\" in the type system.\n\n`output()` is the counterpart, and it is deliberately *not* an `EventEmitter`. It returns an `OutputEmitterRef` with `emit()`, no RxJS in sight, and Angular unsubscribes template listeners automatically. Custom outputs do not bubble — unlike DOM events — so a grandparent cannot listen to a grandchild's output without the parent re-emitting it. `model()` is an input plus an implicitly created `<name>Change` output, which is what makes `[(value)]` work; the component writes to it with `set`/`update` and the value propagates back to the caller's signal or plain property.\n\nThree details bite in review. Inputs are recorded statically at compile time, and `transform` functions must be statically analysable and pure — you cannot compute one conditionally, and `booleanAttribute`/`numberAttribute` exist because attribute coercion is the common case. Model inputs do not support transforms at all. And bound values are not available in the constructor: input signals hold their declared default until Angular sets them during the first change detection, so read them in a `computed`, an `effect` or `ngOnInit`, not in a field initializer that needs the caller's value.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Angular: Accepting data with input properties", url: "https://angular.dev/guide/components/inputs", kind: "docs" },
        { label: "Angular: Custom events with outputs", url: "https://angular.dev/guide/components/outputs", kind: "docs" },
        { label: "justangular: Angular Signal Inputs are here to change the game", url: "https://justangular.com/blog/signal-inputs-are-here-to-change-the-game/", kind: "article" },
        { label: "Angular University: Angular Signal Inputs - Complete Guide to input()", url: "https://blog.angular-university.io/angular-signal-inputs/", kind: "article" },
      ],
      video: {
        title: "How Angular components should communicate in 2025",
        channel: "Brian Treese",
        url: "https://www.youtube.com/watch?v=fTejxZ6W-90",
        videoId: "fTejxZ6W-90",
        durationLabel: "7:52",
      },
      alternateVideos: [
        {
          title: "Input Signals in Angular 17.1 - How To Use & Test",
          channel: "Decoded Frontend",
          url: "https://www.youtube.com/watch?v=U8YXaWwyd9k",
          videoId: "U8YXaWwyd9k",
          durationLabel: "14:34",
        },
        {
          title: "Angular Model - The New Signal-Based 2-way Data Binding",
          channel: "Decoded Frontend",
          url: "https://www.youtube.com/watch?v=0b43U-l3yGA",
          videoId: "0b43U-l3yGA",
          durationLabel: "12:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ng-signal-inputs-outputs-q1",
          prompt: "What is the type of `value` here?\n\n```ts\nexport class Slider {\n  value = input<number>();\n}\n```",
          options: [
            "`InputSignal<number | undefined>`",
            "`InputSignal<number>`",
            "`WritableSignal<number | undefined>`",
            "`number | undefined`",
          ],
          correctIndex: 0,
          explanation:
            "An optional input with no default can be left unbound, so `undefined` is part of the type. `input.required<number>()` gives `InputSignal<number>` and is enforced at build time; input signals are never writable from inside the component.",
        },
        {
          id: "ng-signal-inputs-outputs-q2",
          prompt: "What does this log, given `<user-card [name]=\"'Ada'\" />`?\n\n```ts\nexport class UserCard {\n  name = input('unknown');\n  greeting = this.name();\n  constructor() { console.log(this.greeting); }\n}\n```",
          options: [
            "`unknown`",
            "`Ada`",
            "`undefined`",
            "It throws, because an input can't be read in a constructor",
          ],
          correctIndex: 0,
          explanation:
            "Field initializers and the constructor run before Angular applies the bindings, so the input still holds its declared default. Reading it eagerly into a plain property also freezes the value; `greeting = computed(() => this.name())` is the fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-signal-inputs-outputs-q3",
          prompt: "Which statements about `output()` are true? (Select all that apply.)",
          options: [
            "It returns an `OutputEmitterRef`, not an `EventEmitter`",
            "Custom outputs do not bubble up the DOM",
            "Template subscriptions are cleaned up automatically when the component is destroyed",
            "You can subscribe programmatically via `OutputRef.subscribe` on a dynamically created component",
            "It emits synchronously through an RxJS `Subject` you can `pipe`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "`output()` is a plain emitter with no RxJS dependency; `outputToObservable` in `@angular/core/rxjs-interop` is what gives you a stream. Because custom events don't bubble, a grandparent has to go through the parent.",
        },
        {
          id: "ng-signal-inputs-outputs-q4",
          prompt: "A component declares `checked = model(false)`. What does Angular create alongside it?",
          options: [
            "An output named `checkedChange`, emitted whenever the component calls `set` or `update`",
            "An output named `modelChange`, emitted on every change detection run",
            "Nothing extra; `[(checked)]` works because `model()` is a two-way input",
            "A second input named `checkedValue` used for the write direction",
          ],
          correctIndex: 0,
          explanation:
            "`[(x)]` is sugar for `[x]` plus `(xChange)`, so `model()` declares both halves. The event fires only when the component writes to the model, not on every check.",
        },
        {
          id: "ng-signal-inputs-outputs-q5",
          prompt: "Which of these is NOT allowed?",
          options: [
            "`disabled = model(false, { transform: booleanAttribute })`",
            "`disabled = input(false, { transform: booleanAttribute })`",
            "`value = input(0, { alias: 'sliderValue' })`",
            "`count = input.required<number>()`",
          ],
          correctIndex: 0,
          explanation:
            "Model inputs don't support transforms — the value has to round-trip unchanged for two-way binding to be coherent. Transforms, aliases and required inputs are all fine on a plain `input()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-signal-inputs-outputs-q6",
          prompt: "A component declares `disabled = input(false, { transform: booleanAttribute })`. What is the value of `disabled()` for `<my-btn disabled=\"false\" />`?",
          options: [
            "`false`",
            "`true`, because the attribute is present",
            "`true`, because the non-empty string `\"false\"` is truthy",
            "It fails to compile, because a boolean input can't receive a string",
          ],
          correctIndex: 0,
          explanation:
            "`booleanAttribute` follows HTML's presence rule — an empty or valueless attribute is `true` — but Angular deliberately special-cases the literal string `\"false\"` as `false`, which is the one place it departs from the HTML spec.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-signal-inputs-outputs-q7",
          prompt: "You need to run an analytics call whenever the `userId` input changes. What's the idiomatic current approach?",
          options: [
            "`effect(() => track(this.userId()))` in the constructor",
            "`ngOnChanges(changes)` reading `changes['userId'].currentValue`",
            "A setter on the input property that calls `track`",
            "`ngDoCheck` comparing the current value to a stored previous one",
          ],
          correctIndex: 0,
          explanation:
            "An input signal read inside an effect gives you change notifications with no lifecycle hook and no `SimpleChanges` casting. `ngOnChanges` still works for decorator inputs, but signal inputs are exactly what replaced it.",
        },
        {
          id: "ng-signal-inputs-outputs-q8",
          prompt: "What does `<custom-slider [(value)]=\"volume\" />` pass when `volume` is `signal(0)`?",
          options: [
            "The signal instance itself, so the component can write through it",
            "The signal's current value, `0`",
            "A getter function that returns `0`",
            "A `WritableSignal` wrapper Angular creates around `volume`",
          ],
          correctIndex: 0,
          explanation:
            "Two-way binding to a model input passes the signal, not its value — which is why the docs call it out explicitly. Two-way binding to a plain property also works; Angular then assigns back to the property.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-signal-inputs-outputs-q9",
          prompt: "Which of these are true about input transforms? (Select all that apply.)",
          options: [
            "The transform's parameter type decides what a template is allowed to bind",
            "The transform must be statically analysable at build time",
            "Transforms should be pure, because Angular gives no guarantee about when they run",
            "`numberAttribute` produces `NaN` when the value can't be parsed",
            "The transform also runs when the component writes to the input from inside",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "A transform lets the template accept a wider type than the signal exposes, and it runs when Angular sets the input. A component can't write to a plain input at all, so the last option describes something that can't happen.",
        },
        {
          id: "ng-signal-inputs-outputs-q10",
          prompt: "A grandchild component emits `(saved)`. The grandparent adds `(saved)=\"onSaved()\"` on the child element in its own template. What happens?",
          options: [
            "Nothing fires, and the compiler reports that `saved` is not an output of the child",
            "It fires, because Angular outputs bubble like DOM events",
            "It fires only if the child also declares `saved = output()`",
            "It fires, but `$event` is `undefined`",
          ],
          correctIndex: 0,
          explanation:
            "Outputs are component API, not DOM events, so they don't bubble and binding to a name the child doesn't declare is a template type error. The child has to re-expose it, or both can talk to a shared service.",
        },
      ],
    },
    {
      id: "ng-dependency-injection",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "Dependency Injection and inject()",
      summary:
        "Angular's DI container is the piece with no React equivalent. Every component, directive and service resolves its dependencies from a hierarchy of injectors rather than importing concrete classes, which is what makes swapping an implementation in a test, per route or per component subtree a configuration change instead of a refactor. Resolution happens in two phases: first up the *element* injector chain (the component tree, populated by `providers`/`viewProviders` on components and directives), then up the *environment* injector chain (root, plus one per lazily loaded route with `providers`), and finally the `NullInjector`, which throws.\n\n`inject()` replaced constructor parameters as the recommended form. It works in field initializers, it composes — you can write a plain function that calls `inject()` and reuse it across components, which is how functional guards, resolvers and interceptors work — and it avoids the `useDefineForClassFields`/decorator-metadata problems that constructor injection has under modern TypeScript targets. The constraint is that `inject()` only works in an *injection context*: a constructor, a field initializer, a `useFactory` or `InjectionToken` factory, or a stack frame Angular explicitly runs inside one. Outside that, it throws, and `runInInjectionContext(injector, fn)` is the escape hatch.\n\nThe resolution modifiers are where seniority shows. `optional: true` returns `null` instead of throwing; `skipSelf: true` starts the search at the parent; `self: true` refuses to look past the current injector; `host: true` stops at the host component. `host` and `skipSelf` can't be combined. The classic bug is providing a service on a component to \"scope\" it and then injecting it in a sibling: the sibling walks up to the root and gets a different instance, with no error to tell you.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Angular: Dependency injection overview", url: "https://angular.dev/guide/di", kind: "docs" },
        { label: "Angular: Hierarchical injectors", url: "https://angular.dev/guide/di/hierarchical-dependency-injection", kind: "docs" },
        { label: "Angular: Injection context", url: "https://angular.dev/guide/di/dependency-injection-context", kind: "docs" },
        { label: "Angular University: Angular Dependency Injection - Complete Guide", url: "https://blog.angular-university.io/angular-dependency-injection/", kind: "article" },
      ],
      video: {
        title: "Why I decided to switch to the inject() function in Angular",
        channel: "Joshua Morony",
        url: "https://www.youtube.com/watch?v=_quyWq4NnRM",
        videoId: "_quyWq4NnRM",
        durationLabel: "6:09",
      },
      alternateVideos: [
        {
          title: "Angular Injection Context Explained",
          channel: "Deborah Kurata",
          url: "https://www.youtube.com/watch?v=rsLW9znsp4E",
          videoId: "rsLW9znsp4E",
          durationLabel: "7:08",
        },
        {
          title: "Dependency Injection in-depth | Advanced Angular",
          channel: "Web Tech Talk",
          url: "https://www.youtube.com/watch?v=z7-Uk3WPYHE",
          videoId: "z7-Uk3WPYHE",
          durationLabel: "8:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ng-dependency-injection-q1",
          prompt: "In which of these is `inject()` guaranteed to work? (Select all that apply.)",
          options: [
            "A component's field initializer",
            "A component's constructor",
            "A `useFactory` provider function",
            "A functional route guard (`CanActivateFn`)",
            "Inside a `setTimeout` callback scheduled from `ngOnInit`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "An injection context is a synchronous stack frame Angular set up: construction, field initializers, provider and token factories, and APIs such as guards that Angular deliberately runs inside one. A deferred callback has left that frame, so `inject()` throws there — use `runInInjectionContext` or capture the dependency earlier.",
        },
        {
          id: "ng-dependency-injection-q2",
          prompt: "`ListComponent` declares `providers: [SelectionService]`. A sibling `ToolbarComponent`, also a child of the same page, injects `SelectionService`. What does it get?",
          options: [
            "A different instance, resolved from the root injector",
            "The same instance, because both are on the same page",
            "`null`, because the token isn't visible to it",
            "A NullInjectorError, because the service is scoped to `ListComponent`",
          ],
          correctIndex: 0,
          explanation:
            "Element-injector providers are visible to the declaring component and its descendants only. A sibling walks up past the shared parent to the root, and if the service is also `providedIn: 'root'` it silently gets a second instance — a bug with no error message.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-dependency-injection-q3",
          prompt: "What does `inject(Logger, { optional: true, skipSelf: true })` do?",
          options: [
            "Starts the search at the parent injector and returns `null` if nothing provides `Logger`",
            "Searches the current injector only and returns `null` if it doesn't provide `Logger`",
            "Searches from the root down and returns `null` if nothing provides `Logger`",
            "Throws, because `optional` and `skipSelf` can't be combined",
          ],
          correctIndex: 0,
          explanation:
            "`skipSelf` changes where the search starts, `optional` changes what happens when it fails. The only combination Angular forbids is `host` with `skipSelf`.",
        },
        {
          id: "ng-dependency-injection-q4",
          prompt: "In what order does Angular resolve a token requested by a component?",
          options: [
            "The component's element injector and its ancestors, then the environment injector chain, then `NullInjector` (which throws)",
            "The root environment injector, then down the element injector tree",
            "The environment injector chain, then the element injector chain, then `NullInjector`",
            "Only the component's own element injector; environment providers are a separate, unrelated lookup",
          ],
          correctIndex: 0,
          explanation:
            "Element injectors are searched first, walking up the component tree; only when that runs out does Angular fall back to the environment chain (route injectors, then root, then platform). This is exactly why a component-level provider wins over a root one.",
        },
        {
          id: "ng-dependency-injection-q5",
          prompt: "Which are genuine advantages of `inject()` over constructor parameter injection? (Select all that apply.)",
          options: [
            "It works in field initializers, so a dependency can be used to initialise another field",
            "It composes into reusable plain functions that components and guards can both call",
            "It avoids the awkward inheritance problem where a subclass must repeat every base-class constructor parameter",
            "It resolves dependencies lazily, only when the field is first read",
            "It is required by the `@Service` decorator, which doesn't support constructor injection",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation:
            "`inject()` runs eagerly at the point it appears — there's no laziness, which is what `injectAsync` was added for. Everything else is real: field initializers, composable helper functions, cleaner inheritance, and `@Service` classes where `inject()` is the only option.",
        },
        {
          id: "ng-dependency-injection-q6",
          prompt: "What is an `InjectionToken` used for?",
          options: [
            "Providing a value that has no class to use as a key — configuration objects, feature flags, functions",
            "Marking a class as injectable without a decorator",
            "Creating a token that bypasses the injector hierarchy and is always resolved from the root",
            "Tagging a provider so that it can be tree-shaken",
          ],
          correctIndex: 0,
          explanation:
            "Interfaces and type aliases vanish at runtime, so a non-class dependency needs a unique runtime key; an `InjectionToken` can also carry a `providedIn: 'root'` factory so the default value is tree-shakable.",
        },
        {
          id: "ng-dependency-injection-q7",
          prompt: "A service method needs a dependency it didn't inject at construction. What's the supported way to get one?",
          options: [
            "Inject an `Injector` at construction and call `runInInjectionContext(this.injector, () => inject(Thing))`",
            "Call `inject(Thing)` directly inside the method",
            "Import the class and call `new Thing()`",
            "Store the injector on `window` during bootstrap and read it from there",
          ],
          correctIndex: 0,
          explanation:
            "A method call isn't an injection context, so a bare `inject()` throws; capturing an `Injector` and re-entering a context is the documented escape hatch. `assertInInjectionContext(fn)` is the matching helper for writing APIs that require one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-dependency-injection-q8",
          prompt: "How do route-level `providers` interact with lazily loaded routes?",
          options: [
            "They create an environment injector for that route subtree, so the service is a singleton for that feature and is destroyed with it",
            "They are merged into the root injector at bootstrap regardless of whether the route is visited",
            "They create one instance per activated component in the subtree",
            "They are ignored unless the route also declares `loadChildren`",
          ],
          correctIndex: 0,
          explanation:
            "Route providers sit between the root environment injector and the component tree, which is how a feature gets its own configured instance of a shared service without leaking it to the rest of the app.",
        },
        {
          id: "ng-dependency-injection-q9",
          prompt: "What does `inject(Thing, { self: true })` do differently from a plain `inject(Thing)`?",
          options: [
            "It refuses to look beyond the current injector, throwing (or returning `null` with `optional`) instead of walking up",
            "It creates a fresh instance instead of reusing the parent's",
            "It looks only at the host component's injector, skipping directives on the same element",
            "It resolves the token from the root injector directly",
          ],
          correctIndex: 0,
          explanation:
            "`self` sets where the search *stops*, which is how a directive asserts that a token must be provided on its own element. `host` is the looser version that stops at the host component instead.",
        },
        {
          id: "ng-dependency-injection-q10",
          prompt: "Why does `@Service()` (or `@Injectable({ providedIn: 'root' })`) let the bundler drop an unused service, while listing the class in a `providers` array does not?",
          options: [
            "`providedIn` puts the provider on the class, so nothing references it unless something injects it; a `providers` array is a live reference from code that's already in the bundle",
            "`providedIn` services are compiled to lazy chunks that load on first injection",
            "`providers` arrays are evaluated at runtime, and the compiler can't see inside them",
            "The compiler strips `providers` arrays in production builds and relies on `providedIn` instead",
          ],
          correctIndex: 0,
          explanation:
            "Tree-shaking is a reachability question: `providedIn` inverts the reference so the service points at the injector rather than the injector configuration pointing at the service. A component-level `providers` entry always ships with that component, even if the token is never injected.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "ng-services-providers",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "Services, Providers and Injection Scopes",
      summary:
        "A service in Angular is just a class the injector knows how to create, and Angular 22 added `@Service()` as the ergonomic default: it means \"a root singleton, auto-provided, tree-shakable\", which is what `@Injectable({ providedIn: 'root' })` meant and what the overwhelming majority of services want. `@Injectable` stays for the cases `@Service` deliberately doesn't cover — constructor injection, non-root scopes such as `'platform'`, and being the target of provider recipes like `useClass`. `@Service` accepts a `factory` option when you need to control construction, and that factory runs in an injection context so it can call `inject()`.\n\nThe provider recipes are the other half. `useClass` substitutes a different implementation for a token (and creates a *separate* instance); `useExisting` aliases one token onto another so both resolve to the *same* instance; `useValue` supplies a ready-made object; `useFactory` computes one. `multi: true` turns a token into an array that several providers contribute to — the mechanism behind `HTTP_INTERCEPTORS` and most extension points. Getting `useClass` and `useExisting` confused is the classic cause of \"why do I have two loggers\".\n\nScope is a lifetime decision, not a style one. Root-provided services live for the application; route-level providers give a feature its own instance, destroyed when you navigate away; component-level `providers` give one instance per component instance, destroyed with it — which is how a modal gets isolated state, at the cost of the class always shipping in that component's bundle. `viewProviders` is the narrow variant that hides the service from projected content. And if two directives on the same element provide the same token, Angular documents the winner as undefined, so don't build on it.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Angular: Creating and using services", url: "https://angular.dev/guide/di/creating-and-using-services", kind: "docs" },
        { label: "Angular: Defining dependency providers", url: "https://angular.dev/guide/di/defining-dependency-providers", kind: "docs" },
        { label: "justangular: Lazy loading services in Angular. What?! Yes, we can.", url: "https://justangular.com/blog/lazy-loading-services-in-angular-what-yes-we-can/", kind: "article" },
        { label: "sudheerj: Angular Interview Questions", url: "https://github.com/sudheerj/angular-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Angular 22 @Service vs @Injectable (what you need to know)",
        channel: "Brian Treese",
        url: "https://www.youtube.com/watch?v=59J8c3ZBOBQ",
        videoId: "59J8c3ZBOBQ",
        durationLabel: "7:42",
      },
      alternateVideos: [
        {
          title: "What’s new in Angular v22",
          channel: "Angular",
          url: "https://www.youtube.com/watch?v=h5OJUSS_8IA",
          videoId: "h5OJUSS_8IA",
          durationLabel: "17:19",
          startSeconds: 703,
          chapterLabel: "Introducing the new @Service decorator",
        },
        {
          title: "Dependency Providers in Angular | Advanced Angular",
          channel: "Web Tech Talk",
          url: "https://www.youtube.com/watch?v=JQcBiClPRYs",
          videoId: "JQcBiClPRYs",
          durationLabel: "8:59",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ng-services-providers-q1",
          prompt: "What is `@Service()` equivalent to?",
          options: [
            "`@Injectable({ providedIn: 'root' })`",
            "`@Injectable()` plus a matching entry in the root `providers` array",
            "`@Injectable({ providedIn: 'platform' })`",
            "`@Injectable()` with constructor injection enabled",
          ],
          correctIndex: 0,
          explanation:
            "`@Service()` is an ergonomic shorthand for the root-provided, tree-shakable singleton that most services are. It's narrower on purpose: no constructor injection, no non-root scopes, and it can't be the target of `useClass`.",
        },
        {
          id: "ng-services-providers-q2",
          prompt: "Which of these still require `@Injectable` rather than `@Service`? (Select all that apply.)",
          options: [
            "A service that takes its dependencies as constructor parameters",
            "A class you want to swap in with `{ provide: Api, useClass: MockApi }`",
            "A service scoped to `providedIn: 'platform'`",
            "A service that reads another service with `inject()` in a field initializer",
            "A service that needs a custom construction factory",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`@Service` covers `inject()`-based dependencies and even accepts a `factory` option, but it doesn't support constructor DI, advanced provider keys, or scopes other than root.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-services-providers-q3",
          prompt: "What's the difference between these two?\n\n```ts\nproviders: [NewLogger, { provide: OldLogger, useClass: NewLogger }]\nproviders: [NewLogger, { provide: OldLogger, useExisting: NewLogger }]\n```",
          options: [
            "`useClass` creates a second `NewLogger` instance; `useExisting` aliases both tokens onto the same instance",
            "They are identical; `useExisting` is just older syntax",
            "`useClass` aliases the tokens; `useExisting` creates a second instance",
            "`useExisting` only works when the target is provided in the root injector",
          ],
          correctIndex: 0,
          explanation:
            "`useClass` is a construction recipe, so the injector builds another object; `useExisting` is an alias that resolves the other token. Mixing them up is the usual reason a \"singleton\" turns out to have two instances with diverging state.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-services-providers-q4",
          prompt: "What does `multi: true` do?",
          options: [
            "Makes the token resolve to an array of every value provided for it",
            "Allows the same token to be provided at more than one level of the injector hierarchy",
            "Creates a new instance of the service for each injection site",
            "Marks the provider as safe to instantiate more than once",
          ],
          correctIndex: 0,
          explanation:
            "Multi providers turn a token into a contribution point, which is how interceptor and initializer registries work. Providing the same non-multi token twice at the same level just means the last one wins.",
        },
        {
          id: "ng-services-providers-q5",
          prompt: "`ModalComponent` declares `providers: [ModalStateService]` and three modals are open. How many `ModalStateService` instances exist, and when are they destroyed?",
          options: [
            "Three, each destroyed with its own modal instance",
            "One, destroyed when the last modal closes",
            "Three, all destroyed when the application shuts down",
            "One per route, destroyed on navigation",
          ],
          correctIndex: 0,
          explanation:
            "An element-injector provider is instantiated per component instance and torn down with it, which is exactly why you'd use it for per-instance state. The cost is that the class is bundled with the component whether or not it's ever injected.",
        },
        {
          id: "ng-services-providers-q6",
          prompt: "When would you reach for `useFactory` instead of `useValue`?",
          options: [
            "When the value has to be computed at injection time, possibly from other injected dependencies",
            "When the value is an object rather than a primitive",
            "When the provider is registered on a component rather than at the root",
            "When you want the value to be recreated on every injection",
          ],
          correctIndex: 0,
          explanation:
            "`useValue` hands over an object you already have; `useFactory` runs in an injection context so it can call `inject()` and branch on configuration. Neither re-runs per injection — the injector caches the result per injector.",
        },
        {
          id: "ng-services-providers-q7",
          prompt: "Two directives on the same element both provide `TooltipConfig`. Which one does a component on that element get?",
          options: [
            "Undefined behaviour — Angular documents that one wins but not which",
            "The first one in the template's attribute order",
            "The one from the directive whose class name sorts first",
            "Both, as an array",
          ],
          correctIndex: 0,
          explanation:
            "Components and directives on one element share a single element injector, and the docs explicitly say the winner among duplicate tokens is undefined. Give each directive a distinct token if you need both.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-services-providers-q8",
          prompt: "Which statements about `providers` versus `viewProviders` on a component are true? (Select all that apply.)",
          options: [
            "Both create providers in the component's element injector",
            "`viewProviders` are not visible to content projected through `<ng-content>`",
            "`providers` are visible to both the component's own template and projected content",
            "`viewProviders` are visible to the component's descendants in its own template",
            "`viewProviders` makes the service a singleton for the whole application",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "The single difference between them is visibility to projected content, because projected content belongs to the caller's view. Neither has anything to do with application-wide singletons.",
        },
        {
          id: "ng-services-providers-q9",
          prompt: "What does `injectAsync` (Angular 22) make possible?",
          options: [
            "Code-splitting a service so its implementation is fetched on demand at the point of injection",
            "Injecting a dependency from outside an injection context",
            "Waiting for an asynchronous factory to settle before the application bootstraps",
            "Resolving a token that is only provided on the server",
          ],
          correctIndex: 0,
          explanation:
            "Components and routes could already be lazily loaded; `injectAsync` extends that to services, so a heavy dependency isn't in the initial bundle. The service has to be auto-provided, which `@Service()` handles for you.",
        },
        {
          id: "ng-services-providers-q10",
          prompt: "A feature needs its own configured `ReportExporter` while the rest of the app keeps the default. Where do you provide it?",
          options: [
            "In the feature route's `providers`, so the override applies to that route subtree only",
            "In `bootstrapApplication`'s `providers`, with a feature flag checked inside the service",
            "On every component in the feature, so each gets the right instance",
            "In a shared NgModule that the feature imports",
          ],
          correctIndex: 0,
          explanation:
            "Route providers create an environment injector for the subtree, so the feature's components resolve the override and everyone else resolves the root default. Providing it on every component would give each one a separate instance.",
        },
      ],
    },
    {
      id: "ng-rxjs-interop",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "RxJS in Angular Today, and the Signals Interop",
      summary:
        "Angular was built on RxJS: `HttpClient` returns Observables, the Router exposes `params` and `queryParams` as Observables, and for a decade `async` pipe plus `switchMap` was the idiomatic way to render server state. Signals did not replace that — they replaced the part RxJS was bad at. A signal is a synchronous value that always has a current reading, which is what a template needs; an Observable is a push stream over time with cancellation, retry, debounce and concurrency operators, which is what a *process* needs. The honest split is: signals for state, RxJS for events and async pipelines.\n\n`@angular/core/rxjs-interop` is the seam. `toSignal(obs$)` subscribes immediately (like `async` pipe), unsubscribes when the injection context is destroyed, and needs a starting value — either `initialValue`, or `requireSync: true` for sources such as `BehaviorSubject` that are guaranteed to emit synchronously, or it returns `undefined` until the first emission. `toObservable(sig)` goes the other way using an effect, and `rxResource` lets a `resource` be driven by a stream.\n\nThe timing asymmetry is the thing to internalise. Observables notify per emission; signals notify per *settled value*. So `toObservable(s)` after `s.set(1); s.set(2); s.set(3)` emits only `3` — every intermediate value is lost, because the effect runs once the graph has stabilised. Two more sharp edges: an error in the source is rethrown when you *read* the signal, not where you subscribed, and a completed source leaves the signal stuck on its last value forever. And `toSignal` creates a subscription each time it's called, so calling it inside a `computed` or a loop quietly opens a new subscription per call. For teardown of everything else, `takeUntilDestroyed()` replaced the hand-rolled `destroy$` Subject.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Angular: RxJS interop with Angular signals", url: "https://angular.dev/ecosystem/rxjs-interop", kind: "docs" },
        { label: "Angular: Unsubscribing with takeUntilDestroyed", url: "https://angular.dev/ecosystem/rxjs-interop/take-until-destroyed", kind: "docs" },
        { label: "justangular: A sweet spot between signals and observables", url: "https://justangular.com/blog/a-sweet-spot-between-signals-and-observables/", kind: "article" },
        { label: "RxJS: Introduction", url: "https://rxjs.dev/guide/overview", kind: "docs" },
      ],
      video: {
        title: "How Angular Signals and RxJS Work Together",
        channel: "Deborah Kurata",
        url: "https://www.youtube.com/watch?v=5SD995zKvbk",
        videoId: "5SD995zKvbk",
        durationLabel: "16:15",
      },
      alternateVideos: [
        {
          title: "Using toSignal and toObservable for RxJS interop",
          channel: "Deborah Kurata",
          url: "https://www.youtube.com/watch?v=xQIOWkBe5wQ",
          videoId: "xQIOWkBe5wQ",
          durationLabel: "6:41",
        },
        {
          title: "Why didn't the Angular team just use RxJS instead of Signals?",
          channel: "Joshua Morony",
          url: "https://www.youtube.com/watch?v=iA6iyoantuo",
          videoId: "iA6iyoantuo",
          durationLabel: "8:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ng-rxjs-interop-q1",
          prompt: "What does this log?\n\n```ts\nconst s = signal(0);\nconst obs$ = toObservable(s);\nobs$.subscribe((v) => console.log(v));\ns.set(1);\ns.set(2);\ns.set(3);\n```",
          options: [
            "`0` then `3`",
            "`0`, `1`, `2`, `3`",
            "`1`, `2`, `3`",
            "`3` only",
          ],
          correctIndex: 0,
          explanation:
            "`toObservable` tracks the signal with an effect and a `ReplaySubject`: the current value may arrive synchronously on subscribe, and afterwards it emits only once the graph has settled, so the intermediate `1` and `2` never reach a subscriber. Signals have no notion of \"every value\", only \"current value\".",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-rxjs-interop-q2",
          prompt: "What is `count` here, and why?\n\n```ts\ncount = toSignal(this.countObservable$);\n```",
          options: [
            "`Signal<number | undefined>` — without `initialValue` the signal returns `undefined` until the source first emits",
            "`Signal<number>` — Angular waits for the first emission before the component renders",
            "`Signal<number | null>` — it mirrors the `async` pipe, which starts at `null`",
            "A compile error — `toSignal` requires either `initialValue` or `requireSync`",
          ],
          correctIndex: 0,
          explanation:
            "A signal must always have a value but an Observable may not emit synchronously, so the default is `undefined` in both the type and at runtime. `initialValue` and `requireSync: true` are the two ways to remove that `undefined`.",
        },
        {
          id: "ng-rxjs-interop-q3",
          prompt: "When is `requireSync: true` appropriate?",
          options: [
            "When the source is guaranteed to emit synchronously on subscribe, such as a `BehaviorSubject`",
            "When you want `toSignal` to block until the first emission arrives",
            "When the source completes immediately after its first value",
            "When the source is an `HttpClient` request that is already cached",
          ],
          correctIndex: 0,
          explanation:
            "`requireSync` is an assertion, not a wait: Angular throws if nothing arrives during subscription. An HTTP request never emits synchronously, cached or not, so it always needs `initialValue`.",
        },
        {
          id: "ng-rxjs-interop-q4",
          prompt: "An Observable passed to `toSignal` errors. What happens?",
          options: [
            "The error is thrown when the resulting signal is read",
            "The error is thrown at the point where `toSignal` was called",
            "The signal returns `undefined` and the error is swallowed",
            "The signal keeps its last value and logs the error to the console",
          ],
          correctIndex: 0,
          explanation:
            "There is no subscriber callback to receive the error, so `toSignal` rethrows it on read — often inside a template, far from the pipeline that failed. Handle errors in the stream (`catchError`) if you want a value instead of a throw.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-rxjs-interop-q5",
          prompt: "Which of these are still genuinely better solved with RxJS than with signals? (Select all that apply.)",
          options: [
            "Debouncing a search box and cancelling the in-flight request when the term changes",
            "Retrying a failed request with exponential backoff",
            "Combining a websocket stream with a polling stream",
            "Deriving a filtered list from an array held in component state",
            "Holding the currently selected row id",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything about time, cancellation or merging concurrent sources is what operators are for — `switchMap` cancelling the previous request has no signal equivalent. Derived values and plain state are exactly what `computed` and `signal` do better.",
        },
        {
          id: "ng-rxjs-interop-q6",
          prompt: "What's wrong with this?\n\n```ts\nrows = computed(() => toSignal(this.http.get<Row[]>('/rows'), { initialValue: [] })());\n```",
          options: [
            "Every recomputation calls `toSignal` again, opening a new subscription and a new request",
            "`toSignal` can't be used with `HttpClient` because the request completes",
            "`initialValue` must be `null` for array types",
            "Nothing — this is the documented way to fetch inside a computed",
          ],
          correctIndex: 0,
          explanation:
            "`toSignal` creates a subscription as a side effect, so it must be called once and its result reused; calling it in a reactive context multiplies subscriptions. `httpResource` or `rxResource` is the API designed for signal-driven fetching.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-rxjs-interop-q7",
          prompt: "What does `takeUntilDestroyed()` replace?",
          options: [
            "A hand-rolled `destroy$` Subject completed in `ngOnDestroy` and piped through `takeUntil`",
            "The `async` pipe in templates",
            "`toSignal`'s automatic unsubscription",
            "`Subscription.unsubscribe()` in `ngOnDestroy` for HTTP requests, which are otherwise leaks",
          ],
          correctIndex: 0,
          explanation:
            "It reads `DestroyRef` from the injection context and completes the stream when that context is destroyed, which is the boilerplate every Angular codebase used to hand-write. `HttpClient` requests complete on their own, so they were never the leak.",
        },
        {
          id: "ng-rxjs-interop-q8",
          prompt: "A source passed to `toSignal` completes. What does the signal do afterwards?",
          options: [
            "Keeps returning the last value it emitted, forever",
            "Returns `undefined` once the source completes",
            "Throws on the next read",
            "Automatically resubscribes to the source",
          ],
          correctIndex: 0,
          explanation:
            "Completion is not an error and not a value, so the signal simply holds the last emission. That's fine for a one-shot request and a trap for a stream you expected to keep updating.",
        },
        {
          id: "ng-rxjs-interop-q9",
          prompt: "Where must `toSignal` and `toObservable` be called by default?",
          options: [
            "In an injection context, or with an explicit `injector` passed in the options",
            "Anywhere; they're plain utility functions",
            "Only inside a component, never inside a service",
            "Only inside an `effect`",
          ],
          correctIndex: 0,
          explanation:
            "Both need a `DestroyRef` to know when to tear down, so they need an injection context — constructor or field initializer — unless you hand them an `Injector` explicitly.",
        },
        {
          id: "ng-rxjs-interop-q10",
          prompt: "You want a signal that only updates when a temperature reading actually changes, from a stream that emits objects every second. What's the cleanest interop option?",
          options: [
            "`toSignal(temp$, { initialValue: ..., equal: (a, b) => a.temperature === b.temperature })`",
            "Pipe the source through `distinctUntilChanged()` and then wrap it in a `computed`",
            "Wrap `toSignal` in a `linkedSignal` that compares the previous value",
            "Nothing is needed — signals deduplicate object emissions automatically",
          ],
          correctIndex: 0,
          explanation:
            "`toSignal` accepts an `equal` option, so equal-by-value emissions don't update the signal and nothing downstream re-runs. The default is `Object.is`, so fresh objects always look different.",
        },
      ],
    },
    {
      id: "ng-http-interceptors",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "HttpClient and Functional Interceptors",
      summary:
        "`HttpClient` is the framework's HTTP layer, and the reason to use it over `fetch` is not the API — it is that every request passes through a configurable chain you control from dependency injection. `provideHttpClient(withInterceptors([auth, retry, logging]))` composes ordinary functions of the shape `(req, next) => Observable<HttpEvent>` into a pipeline: the first listed sees the request first and the response last, exactly like server-side middleware. Because an interceptor runs in the injection context of the injector that registered it, it can `inject()` an auth store or a router without any ceremony.\n\nRequests and responses are immutable, which is a design decision rather than a style choice: an interceptor mutates by `req.clone({ headers: req.headers.set(...) })`, and that immutability is what makes an interceptor idempotent when a retry pushes the same request through the chain a second time. The deliberate exception is `req.context`, an `HttpContext` map keyed by `HttpContextToken`s, which *is* mutable — that's how per-request flags (\"don't cache this\", \"attempt number 2\") travel with a request and survive retries. Interceptors are also not obliged to call `next`: returning a constructed `HttpResponse` gives you a cache or an offline stub.\n\nTwo notes for real codebases. The older class-based `HttpInterceptor` API still works via `withInterceptorsFromDi()` and the `HTTP_INTERCEPTORS` multi-provider, but its order depends on provider registration across the whole injector hierarchy, which is very hard to predict — functional interceptors exist largely to fix that. And the response stream carries every `HttpEvent`, not just the final body, so anything inspecting a response must check `event.type === HttpEventType.Response` or it will also see upload-progress events.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        { label: "Angular: HTTP interceptors", url: "https://angular.dev/guide/http/interceptors", kind: "docs" },
        { label: "Angular: Making HTTP requests", url: "https://angular.dev/guide/http/making-requests", kind: "docs" },
        { label: "justangular: Create configurable Angular interceptors", url: "https://justangular.com/blog/create-configurable-angular-interceptors/", kind: "article" },
        { label: "Angular University: Angular HTTP Client - QuickStart Guide", url: "https://blog.angular-university.io/angular-http/", kind: "article" },
      ],
      video: {
        title: "Angular Interceptors — Auth & Global HTTP Error Handling (Basics, 2025)",
        channel: "Decoded Frontend",
        url: "https://www.youtube.com/watch?v=BNM5203kxgs",
        videoId: "BNM5203kxgs",
        durationLabel: "15:58",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createHttpHandler(interceptors, backend)`, the composition step behind `provideHttpClient(withInterceptors([...]))`.\n\nAn interceptor is a function `(req, next) => response`. `next` forwards the request to the rest of the chain. The last interceptor's `next` is the `backend`. `createHttpHandler` returns a single `handle(req)` function.\n\nThe contract:\n\n- Interceptors run **in array order**: the first listed receives the request first and therefore sees the response last.\n- With **no interceptors**, `handle(req)` is just `backend(req)`.\n- An interceptor may **skip `next`** entirely and return a response it built itself; the backend must not be called in that case.\n- `next` is **re-entrant**: calling it twice runs the rest of the chain twice, which is how a retry interceptor works. It must be callable with a different request object each time.\n- The returned handler is **reusable**: composition happens once, and calling `handle` again with a new request must work with no leftover state.\n- Pass each request through **untouched**: whatever an interceptor gives to `next` is exactly what the next interceptor receives. Don't clone, freeze or normalise anything yourself.\n- Let exceptions **propagate** out of `handle`, and leave the composed chain usable afterwards.\n\nThe tests call `runInterceptorScenario(name)`, which builds interceptors for one named scenario and returns plain data. Leave the driver as it is.",
        starterCode: INTERCEPTOR_STARTER,
        functionName: "runInterceptorScenario",
        testCases: [
          {
            description: "interceptors run in array order on the way in and reverse order on the way out",
            args: ["order"],
            expected: {
              log: ["req:a", "req:b", "req:c", "backend", "res:c", "res:b", "res:a"],
              status: 200,
              body: "hi",
            },
          },
          {
            description: "a cloned request reaches the backend while the caller's original object is untouched",
            args: ["immutableRequest"],
            expected: {
              sent: { accept: "json", authorization: "Bearer t" },
              original: { url: "/me", headers: { accept: "json" } },
            },
          },
          {
            description: "an interceptor that never calls next short-circuits the backend",
            args: ["shortCircuit"],
            expected: { cached: "from-cache", fresh: "from-network", backendCalls: 1 },
          },
          {
            description: "next is re-entrant, so a retry interceptor can run the rest of the chain again",
            args: ["retry"],
            expected: { attempts: 3, status: 200, body: "done", tries: 3 },
          },
          {
            description: "an empty interceptor list forwards straight to the backend",
            args: ["noInterceptors"],
            expected: { status: 200, body: "direct", url: "/direct" },
            isEdgeCase: true,
          },
          {
            description: "one composed handler serves several requests with no leaked state",
            args: ["reusedHandler"],
            expected: { seen: ["/one", "/one", "/two", "/two"], first: "/one", second: "/two" },
          },
          {
            description: "the mutable request context survives retries through the same chain",
            args: ["mutableContext"],
            expected: { attemptsByRequest: [3], status: 200, body: "ok" },
            isEdgeCase: true,
          },
          {
            description: "response transforms apply from the innermost interceptor outwards",
            args: ["transformResponse"],
            expected: "HELLO!",
          },
          {
            description: "an exception propagates out of the handler and the chain still works afterwards",
            args: ["thrownError"],
            expected: { message: "interceptor exploded", after: "fine" },
            isEdgeCase: true,
          },
          {
            description: "a 500-interceptor chain composes without blowing up",
            args: ["longChain"],
            expected: { first: 0, last: 499, calls: 500, body: "499" },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "ng-router",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "The Router: Lazy Loading, Guards and Resolvers",
      summary:
        "Angular's router maps URL segments onto a tree of components rendered into `<router-outlet>`s, and it is configuration-first: a `Routes` array declares paths, children, providers, guards and resolvers, and `provideRouter(routes, ...features)` wires it up. Lazy loading needs no module — `loadComponent: () => import('./admin-page')` splits a chunk per route, and `loadChildren` does the same for a set of child routes. Those loader functions run inside the route's injection context, so you can `inject()` a feature-flag service and choose which chunk to import.\n\nGuards are plain functions, which is what made them composable: `CanActivateFn`, `CanActivateChildFn`, `CanDeactivateFn<T>` and `CanMatchFn` all take route information, call `inject()` for whatever they need, and return `boolean`, a `UrlTree`/`RedirectCommand`, or a `Promise`/`Observable` whose first emitted value the router uses before unsubscribing. Returning a `UrlTree` is how you redirect; returning `false` and then calling `router.navigate()` races the cancellation the router is already performing. `CanMatch` is the odd one out and the most useful: a `false` result doesn't block navigation, it makes the router keep looking at later routes, which is how you serve two different components for the same path behind a feature flag.\n\nThe gotcha that survives every Angular generation is route reuse. Navigating from `/users/1` to `/users/2` matches the same route, so the router keeps the component instance alive and does not re-run the constructor — code that read `route.snapshot.paramMap` once will happily show user 1's data forever. Subscribe to `paramMap`, convert it with `toSignal`, or turn on `withComponentInputBinding()` so params arrive as ordinary inputs. And remember that a guard is a UX affordance: everything it protects must be enforced again on the server.",
      level: "advanced",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Angular: Control route access with guards", url: "https://angular.dev/guide/routing/route-guards", kind: "docs" },
        { label: "Angular: Route loading strategies", url: "https://angular.dev/guide/routing/loading-strategies", kind: "docs" },
        { label: "Angular: Route data resolvers", url: "https://angular.dev/guide/routing/data-resolvers", kind: "docs" },
        { label: "justangular: Bind Route Info to Component Inputs", url: "https://justangular.com/blog/bind-route-info-to-component-inputs-new-router-feature/", kind: "article" },
      ],
      video: {
        title: "Angular Routing Essentials: All You Need to Know in One Video!",
        channel: "Monsterlessons Academy",
        url: "https://www.youtube.com/watch?v=BUDQTd1DQAg",
        videoId: "BUDQTd1DQAg",
        durationLabel: "21:29",
      },
      alternateVideos: [
        {
          title: "CanMatch Guard in Angular 14.1 Router (2022)",
          channel: "Decoded Frontend",
          url: "https://www.youtube.com/watch?v=OpBFhnLlhdE",
          videoId: "OpBFhnLlhdE",
          durationLabel: "17:49",
        },
        {
          title: "Angular 19 Tutorial | Full Angular Course In One Video | Angular From Scratch in 2026",
          channel: "FED Learning",
          url: "https://www.youtube.com/watch?v=jYV2enNmplM",
          videoId: "jYV2enNmplM",
          durationLabel: "9:19:25",
          startSeconds: 9919,
          chapterLabel: "Routing - router-outlet, routerLink & routerLinkActive",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ng-router-q1",
          prompt: "A user is on `/users/1` and clicks a link to `/users/2`. Both match `{ path: 'users/:id', component: UserPage }`. What happens to `UserPage`?",
          options: [
            "The same instance is reused; the constructor and `ngOnInit` do not run again",
            "It is destroyed and recreated, so the constructor runs again",
            "It is reused, but Angular calls `ngOnInit` again for the new params",
            "The router throws unless `runGuardsAndResolvers` is configured",
          ],
          correctIndex: 0,
          explanation:
            "The router reuses a component when the matched route configuration is unchanged, so anything read once from `route.snapshot` goes stale. Subscribe to `paramMap`, wrap it with `toSignal`, or use `withComponentInputBinding()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-router-q2",
          prompt: "What is different about `CanMatch` compared with the other guards?",
          options: [
            "Returning `false` makes the router try later matching routes instead of cancelling navigation",
            "It is the only guard that can return a `UrlTree`",
            "It runs after the route's component has been loaded",
            "It cannot use `inject()`, because it runs outside an injection context",
          ],
          correctIndex: 0,
          explanation:
            "`CanMatch` participates in *matching*, so a rejection is a fall-through, not a block — which is how you register two routes on the same path and pick between them at runtime. All four guard types can `inject()` and all can redirect.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-router-q3",
          prompt: "An auth guard needs to send unauthenticated users to `/login`. What should it return?",
          options: [
            "A `UrlTree` (or `RedirectCommand`) for `/login`",
            "`false`, and call `router.navigate(['/login'])` just before returning",
            "`false`, and let a `withNavigationErrorHandler` do the redirect",
            "A `Promise` that never resolves, so the navigation stalls",
          ],
          correctIndex: 0,
          explanation:
            "Returning a `UrlTree` tells the router to redirect as part of the same navigation. Returning `false` and navigating separately starts a second navigation while the first is being cancelled, which produces flicker and occasional lost redirects.",
        },
        {
          id: "ng-router-q4",
          prompt: "Which return types are valid from a route guard? (Select all that apply.)",
          options: [
            "`boolean`",
            "`UrlTree`",
            "`Observable<boolean>` — the router takes the first emitted value and unsubscribes",
            "`Promise<boolean>`",
            "`void`, meaning \"allow\"",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Guards return a boolean, a redirect, or an async wrapper around either; the router consumes only the first emission. There is no implicit allow — a guard returning nothing resolves to `undefined`, which is falsy and blocks.",
        },
        {
          id: "ng-router-q5",
          prompt: "Why does `loadComponent: () => import('./admin-page')` sometimes need a `.then(m => m.AdminPage)` and sometimes not?",
          options: [
            "Not needed when the file uses a `default` export; needed when the component is a named export",
            "Not needed for standalone components; needed for components declared in an NgModule",
            "Not needed in development builds; the production build requires the explicit selector",
            "Not needed when the path is relative; needed for package imports",
          ],
          correctIndex: 0,
          explanation:
            "The loader must resolve to a component, and Angular unwraps a module namespace's `default` export for you. Any other export name has to be selected explicitly.",
        },
        {
          id: "ng-router-q6",
          prompt: "What does `withComponentInputBinding()` do?",
          options: [
            "Binds route params, query params, matrix params and route `data` to matching component inputs",
            "Makes `ActivatedRoute` available as an input on every routed component",
            "Turns `ActivatedRoute` observables into signals throughout the application",
            "Binds `@Input()` properties of a routed component to the parent route's resolved data only",
          ],
          correctIndex: 0,
          explanation:
            "With it on, a routed component just declares `id = input.required<string>()` and the router keeps it up to date, including across param-only navigations — which sidesteps the stale-snapshot bug entirely.",
        },
        {
          id: "ng-router-q7",
          prompt: "Where do you put a service that should be a singleton for one lazily loaded feature and destroyed when the user leaves it?",
          options: [
            "In the feature route's `providers` array",
            "In `bootstrapApplication`'s `providers` array",
            "On the feature's top-level component with `providers`",
            "In a `@Service()` class, which the bundler will scope to the lazy chunk automatically",
          ],
          correctIndex: 0,
          explanation:
            "Route-level providers create an environment injector for that route subtree, with a lifetime tied to the route. A `@Service()` is always a root singleton no matter which chunk it happens to be bundled in.",
        },
        {
          id: "ng-router-q8",
          prompt: "A `canDeactivate` guard on an edit page warns about unsaved changes. When does it run?",
          options: [
            "When the router is about to leave the route, with the component instance passed as the first argument",
            "In `ngOnDestroy`, after the component has been torn down",
            "On every navigation in the application, including ones that stay on the page",
            "Only when the browser's back button is used",
          ],
          correctIndex: 0,
          explanation:
            "`CanDeactivateFn<T>` receives the live component plus current and next router states, which is what lets it ask the component whether it's dirty. It cannot intercept a full page reload or tab close — that needs `beforeunload`.",
        },
        {
          id: "ng-router-q9",
          prompt: "Which statements about `canActivateChild` are true? (Select all that apply.)",
          options: [
            "It runs for every child route under the route that declares it",
            "It runs again for grandchildren, not just direct children",
            "It receives the future `ActivatedRouteSnapshot` of the child being activated",
            "It replaces `canActivate` on the parent route",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`canActivateChild` is declared once on a parent and applies down the subtree, which is how you protect a whole admin area with one guard. It's additive — the parent's own `canActivate` still runs for the parent route itself.",
        },
        {
          id: "ng-router-q10",
          prompt: "Your route guard checks `authService.isAdmin()` before showing an admin dashboard that loads data from `/api/admin/stats`. What else is required?",
          options: [
            "The server must authorise `/api/admin/stats` independently; the guard only controls which UI renders",
            "Nothing — the guard runs before the component, so the request can't be made without passing it",
            "The guard should also be registered as an HTTP interceptor so it applies to requests",
            "`CanMatch` instead of `CanActivate`, so the route isn't even matched",
          ],
          correctIndex: 0,
          explanation:
            "Every guard runs in the user's own browser and can be bypassed by calling the API directly; the docs open with exactly this warning. Client-side guards are about not showing broken UI, never about access control.",
        },
      ],
    },
    {
      id: "ng-forms",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "Forms: Reactive, Template-Driven and Typed",
      summary:
        "Angular has two long-standing form systems and, since v22, a third. **Template-driven** forms build the model implicitly from directives (`ngModel`, `required`) in the markup: minimal setup, asynchronous data flow, hard to test because assertions depend on change detection having run. **Reactive** forms build the model explicitly in the class (`FormGroup`, `FormControl`, `FormArray`), give you synchronous access to values and validity, and are what any form with real logic should use. **Signal Forms** became stable in Angular 22 as the intended future: a signal-native model with schema-based validation, sitting alongside the other two rather than replacing them overnight.\n\nReactive forms have been strictly typed since v14, and the types encode real runtime behaviour rather than decorating it. `new FormControl('a@b.co')` is `FormControl<string | null>` because `reset()` sets a control to `null` — `{ nonNullable: true }` changes the *behaviour* so reset returns to the initial value, and only then does the `null` leave the type. `group.value` is a `Partial<...>` because disabled controls are excluded from a group's value; `getRawValue()` is the escape hatch that includes them. `FormRecord` covers dynamic keys, and `NonNullableFormBuilder` removes the per-control boilerplate.\n\nValidators are just functions from a control to `ValidationErrors | null`, and composition merges every error object — validators do not stop at the first failure, so a field can report `required` and `minlength` together. Most built-in validators deliberately skip empty values so that only `required` speaks about emptiness, and a string `pattern` is anchored with `^`/`$` before it's tested, which is why `Validators.pattern('\\\\d+')` rejects `'12a'` where a bare `RegExp.test` would accept it. Cross-field rules live on the group, not on a control, because a control can't see its siblings.",
      level: "advanced",
      estMinutes: 85,
      webRefs: [
        { label: "Angular: Strictly typed reactive forms", url: "https://angular.dev/guide/forms/typed-forms", kind: "docs" },
        { label: "Angular: Reactive forms", url: "https://angular.dev/guide/forms/reactive-forms", kind: "docs" },
        { label: "Angular: Signal Forms overview", url: "https://angular.dev/guide/forms/signals/overview", kind: "docs" },
        { label: "Angular University: Angular Custom Form Validators", url: "https://blog.angular-university.io/angular-custom-validators/", kind: "article" },
      ],
      video: {
        title: "Typed Forms in Angular",
        channel: "Angular",
        url: "https://www.youtube.com/watch?v=L-odCf4MfJc",
        videoId: "L-odCf4MfJc",
        durationLabel: "10:59",
      },
      alternateVideos: [
        {
          title: "Knowing this makes Angular typed forms WAY less awkward",
          channel: "Joshua Morony",
          url: "https://www.youtube.com/watch?v=xpRlijg6spo",
          videoId: "xpRlijg6spo",
          durationLabel: "5:02",
        },
        {
          title: "Build Modern Angular Forms with Signals (Full Course Preview)",
          channel: "Brian Treese",
          url: "https://www.youtube.com/watch?v=fZZ1UVkyB4I",
          videoId: "fZZ1UVkyB4I",
          durationLabel: "7:03",
        },
        {
          title: "Angular 19 Tutorial | Full Angular Course In One Video | Angular From Scratch in 2026",
          channel: "FED Learning",
          url: "https://www.youtube.com/watch?v=jYV2enNmplM",
          videoId: "jYV2enNmplM",
          durationLabel: "9:19:25",
          startSeconds: 18961,
          chapterLabel: "Reactive Form",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `validateForm(schema, value)` — a miniature of Angular's `FormGroup` validation, with the same rules the real one uses.\n\n`schema` is `{ fields: { [name]: { validators?: Spec[], disabled?: boolean } }, validators?: Spec[] }`. Every validator is plain data with a `kind`.\n\nReturn `{ status, value, rawValue, errors, fieldErrors }`:\n\n- `rawValue` — every declared field, enabled or not. A name missing from `value` counts as `null`.\n- `value` — only the enabled fields (Angular leaves disabled controls out of a group's value).\n- `fieldErrors` — field name to its merged errors object; fields with no errors are left out.\n- `errors` — the merged group-level errors object, or `null`.\n- `status` — `\"DISABLED\"` if there is at least one field and all of them are disabled; otherwise `\"INVALID\"` if there is any field error or group error; otherwise `\"VALID\"`.\n\nRules:\n\n- All of a field's validators run, in order, and every error object is merged into one (later keys overwrite earlier ones). Validators never short-circuit.\n- Disabled fields are never validated.\n- Group validators always run, against the enabled values only, even when a field is already invalid.\n- A value is *empty* when it is `null`, `undefined`, or a string or array of length 0. `false` and `0` are **not** empty.\n\nField validator kinds:\n\n- `{ kind: \"required\" }` — `{ required: true }` when the value is empty.\n- `{ kind: \"minLength\", length: n }` — skipped when the value is empty or has no numeric `length`; otherwise `{ minlength: { requiredLength: n, actualLength: value.length } }` when it is shorter.\n- `{ kind: \"maxLength\", length: n }` — skipped when the value is `null`/`undefined` or has no numeric `length`; otherwise `{ maxlength: { requiredLength: n, actualLength: value.length } }` when it is longer.\n- `{ kind: \"min\", value: n }` and `{ kind: \"max\", value: n }` — skipped when the value is empty or `Number(value)` is `NaN`; otherwise `{ min: { min: n, actual } }` / `{ max: { max: n, actual } }`, where `actual` is the coerced number.\n- `{ kind: \"pattern\", pattern: \"...\" }` — skipped when empty. Anchor it the way Angular does: prepend `^` unless the pattern already starts with one, append `$` unless it already ends with one. On failure return `{ pattern: { requiredPattern: <the anchored source>, actualValue: value } }`.\n\nGroup validator kinds:\n\n- `{ kind: \"matchFields\", fields: [...] }` — passes when fewer than two of those names are present in the enabled value; otherwise every present one must be `===` the first. On failure `{ fieldsMismatch: { fields: <the declared list> } }`.\n- `{ kind: \"atLeastOne\", fields: [...] }` — passes when at least one present name holds a non-empty value. On failure `{ atLeastOne: { fields: <the declared list> } }`.\n\nAny unknown `kind` is ignored.",
        starterCode: FORM_VALIDATION_STARTER,
        functionName: "validateForm",
        testCases: [
          {
            description: "a valid form reports VALID with no errors",
            args: [
              { fields: { email: { validators: [{ kind: "required" }, { kind: "pattern", pattern: ".+@.+" }] }, age: { validators: [{ kind: "min", value: 18 }] } } },
              { email: "a@b.co", age: 30 },
            ],
            expected: {
              status: "VALID",
              value: { email: "a@b.co", age: 30 },
              rawValue: { email: "a@b.co", age: 30 },
              errors: null,
              fieldErrors: {},
            },
          },
          {
            description: "every failing validator on a field merges into one errors object",
            args: [{ fields: { name: { validators: [{ kind: "required" }, { kind: "minLength", length: 3 }] } } }, { name: "" }],
            expected: {
              status: "INVALID",
              value: { name: "" },
              rawValue: { name: "" },
              errors: null,
              fieldErrors: { name: { required: true } },
            },
          },
          {
            description: "a string pattern is anchored before it is tested",
            args: [{ fields: { code: { validators: [{ kind: "pattern", pattern: "\\d+" }] } } }, { code: "12a" }],
            expected: {
              status: "INVALID",
              value: { code: "12a" },
              rawValue: { code: "12a" },
              errors: null,
              fieldErrors: { code: { pattern: { requiredPattern: "^\\d+$", actualValue: "12a" } } },
            },
          },
          {
            description: "a disabled field is excluded from value and never validated",
            args: [
              { fields: { a: { validators: [{ kind: "required" }] }, b: { disabled: true, validators: [{ kind: "required" }] } } },
              { a: "x", b: "" },
            ],
            expected: {
              status: "VALID",
              value: { a: "x" },
              rawValue: { a: "x", b: "" },
              errors: null,
              fieldErrors: {},
            },
          },
          {
            description: "a group whose every field is disabled is DISABLED",
            args: [{ fields: { a: { disabled: true, validators: [{ kind: "required" }] } } }, { a: null }],
            expected: { status: "DISABLED", value: {}, rawValue: { a: null }, errors: null, fieldErrors: {} },
            isEdgeCase: true,
          },
          {
            description: "a cross-field validator reports group-level errors",
            args: [
              {
                fields: { password: { validators: [{ kind: "required" }] }, confirm: { validators: [{ kind: "required" }] } },
                validators: [{ kind: "matchFields", fields: ["password", "confirm"] }],
              },
              { password: "abc", confirm: "abd" },
            ],
            expected: {
              status: "INVALID",
              value: { password: "abc", confirm: "abd" },
              rawValue: { password: "abc", confirm: "abd" },
              errors: { fieldsMismatch: { fields: ["password", "confirm"] } },
              fieldErrors: {},
            },
          },
          {
            description: "min skips an empty value while maxLength still measures length",
            args: [
              {
                fields: {
                  score: { validators: [{ kind: "min", value: 1 }, { kind: "max", value: 10 }] },
                  note: { validators: [{ kind: "maxLength", length: 4 }] },
                },
              },
              { score: "", note: "hello" },
            ],
            expected: {
              status: "INVALID",
              value: { score: "", note: "hello" },
              rawValue: { score: "", note: "hello" },
              errors: null,
              fieldErrors: { note: { maxlength: { requiredLength: 4, actualLength: 5 } } },
            },
            isEdgeCase: true,
          },
          {
            description: "a schema with no fields is VALID, not DISABLED",
            args: [{ fields: {} }, {}],
            expected: { status: "VALID", value: {}, rawValue: {}, errors: null, fieldErrors: {} },
            isEdgeCase: true,
          },
          {
            description: "atLeastOne fails when every listed field is empty",
            args: [
              {
                fields: { phone: { validators: [] }, mail: { validators: [] } },
                validators: [{ kind: "atLeastOne", fields: ["phone", "mail"] }],
              },
              { phone: "", mail: null },
            ],
            expected: {
              status: "INVALID",
              value: { phone: "", mail: null },
              rawValue: { phone: "", mail: null },
              errors: { atLeastOne: { fields: ["phone", "mail"] } },
              fieldErrors: {},
            },
          },
          {
            description: "a key missing from the value object is treated as null",
            args: [{ fields: { nickname: { validators: [{ kind: "required" }] } } }, {}],
            expected: {
              status: "INVALID",
              value: { nickname: null },
              rawValue: { nickname: null },
              errors: null,
              fieldErrors: { nickname: { required: true } },
            },
            isEdgeCase: true,
          },
          {
            description: "required treats an empty array as missing but false as present",
            args: [
              {
                fields: {
                  tags: { validators: [{ kind: "required" }, { kind: "minLength", length: 2 }] },
                  flag: { validators: [{ kind: "required" }] },
                },
              },
              { tags: [], flag: false },
            ],
            expected: {
              status: "INVALID",
              value: { tags: [], flag: false },
              rawValue: { tags: [], flag: false },
              errors: null,
              fieldErrors: { tags: { required: true } },
            },
            isEdgeCase: true,
          },
          {
            description: "numeric strings are coerced for min and max, and unparseable ones are skipped",
            args: [
              {
                fields: {
                  qty: { validators: [{ kind: "min", value: 1 }, { kind: "max", value: 5 }] },
                  other: { validators: [{ kind: "max", value: 5 }] },
                },
              },
              { qty: "9", other: "abc" },
            ],
            expected: {
              status: "INVALID",
              value: { qty: "9", other: "abc" },
              rawValue: { qty: "9", other: "abc" },
              errors: null,
              fieldErrors: { qty: { max: { max: 5, actual: 9 } } },
            },
          },
        ],
      },
    },
    {
      id: "ng-change-detection",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "Change Detection, OnPush and Zoneless",
      summary:
        "Change detection is the answer to \"the model changed — which bindings do I re-evaluate?\" Classic Angular answered it with zone.js: monkey-patch every asynchronous browser API so that when a timeout, a promise or an event settles, Angular knows *something* happened, then walk the entire component tree from the root and dirty-check every binding. That is correct and completely uninformed — zone.js knows that a task ran, never that any state changed — so Angular re-checked the whole application far more often than necessary, cost payload and startup time, could not patch `async`/`await` without downlevelling, and made stack traces much harder to read.\n\n`OnPush` was the first fix: mark a subtree `CheckOnce`, so it is skipped unless one of a small set of notifications fires — the root of the subtree gets a new input value from a template binding (compared with `==`), an event is handled inside the subtree, something calls `markForCheck` (which `AsyncPipe` does for you), or a signal read in its template changes. Angular 22 made `OnPush` the default and renamed the old default to `Eager`, because \"Default\" no longer described the default. Signals are what made this safe to flip: a signal read in a template registers a precise dependency, so Angular no longer needs a conservative full-tree sweep to stay correct.\n\nZoneless (the default since v21) removes zone.js entirely and schedules change detection purely from those explicit notifications. The compatibility work is mostly deletion: `NgZone.onMicrotaskEmpty`, `onUnstable` and `onStable` never fire and `NgZone.isStable` is always `true`, so code that waited on them moves to `afterNextRender` or `afterEveryRender`; SSR uses `PendingTasks` instead of zone stability to decide when to serialise. `NgZone.run` and `runOutsideAngular` still work and are still worth keeping in libraries. The subtle failure mode is a component that mutates an object in place and relies on nothing in particular to notice — under `Eager` plus zone.js it happened to update; zoneless will simply not re-render it.",
      level: "expert",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Angular: Skipping component subtrees (OnPush)", url: "https://angular.dev/best-practices/skipping-subtrees", kind: "docs" },
        { label: "Angular: Angular without ZoneJS (Zoneless)", url: "https://angular.dev/guide/zoneless", kind: "docs" },
        { label: "Angular: Zone pollution", url: "https://angular.dev/best-practices/zone-pollution", kind: "docs" },
        { label: "justangular: A change detection, zone.js, zoneless, local change detection, and signals story", url: "https://justangular.com/blog/a-change-detection-zone-js-zoneless-local-change-detection-and-signals-story/", kind: "article" },
      ],
      video: {
        title: "Change Detection in Angular Pt.3 - OnPush Change Detection Strategy",
        channel: "Decoded Frontend",
        url: "https://www.youtube.com/watch?v=WAu7omIoerM",
        videoId: "WAu7omIoerM",
        durationLabel: "16:52",
      },
      alternateVideos: [
        {
          title: "Zoneless Angular Applications in V18",
          channel: "Deborah Kurata",
          url: "https://www.youtube.com/watch?v=MZ6s5EL7hKk",
          videoId: "MZ6s5EL7hKk",
          durationLabel: "14:00",
        },
        {
          title: "WTF is \"Zone.js\" and is it making your app slow?",
          channel: "Joshua Morony",
          url: "https://www.youtube.com/watch?v=lmrf_gPIOZU",
          videoId: "lmrf_gPIOZU",
          durationLabel: "13:20",
        },
        {
          title: "What’s new in Angular v22",
          channel: "Angular",
          url: "https://www.youtube.com/watch?v=h5OJUSS_8IA",
          videoId: "h5OJUSS_8IA",
          durationLabel: "17:19",
          startSeconds: 583,
          chapterLabel: "New helpful defaults",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ng-change-detection-q1",
          prompt: "An `OnPush` component has `@Input() user: User`. The parent mutates `this.user.name = 'New'` without replacing the object. What does the child render?",
          options: [
            "The old name, because the input reference didn't change so the child is never marked dirty",
            "The new name, because Angular deep-compares input objects",
            "The new name, because mutating a bound object always triggers a check",
            "Nothing — Angular throws an ExpressionChangedAfterItHasBeenChecked error",
          ],
          correctIndex: 0,
          explanation:
            "`OnPush` compares the old and new input value with `==`, so a mutated object is the same value and produces no notification. Replace the object, use a signal, or call `markForCheck` — this is the single most common OnPush bug.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-change-detection-q2",
          prompt: "Which of these notify Angular that a view needs checking? (Select all that apply.)",
          options: [
            "A signal read in a component's template changing value",
            "`ChangeDetectorRef.markForCheck()`",
            "A listener bound in the template or with `@HostListener` firing",
            "`ComponentRef.setInput()`",
            "Mutating a property of an object that a template binding reads",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Those four are exactly the notification mechanisms the zoneless guide lists, and `AsyncPipe` works by calling `markForCheck` for you. In-place mutation notifies nothing, which is why it used to \"work\" only as a side effect of zone.js checking everything.",
        },
        {
          id: "ng-change-detection-q3",
          prompt: "In Angular 22, what does a component get if it doesn't specify `changeDetection`?",
          options: [
            "`ChangeDetectionStrategy.OnPush`",
            "`ChangeDetectionStrategy.Eager`",
            "`ChangeDetectionStrategy.Default`, which is distinct from both",
            "It inherits the strategy of its parent component",
          ],
          correctIndex: 0,
          explanation:
            "v22 flipped the default to `OnPush` and renamed the old default to `Eager`; `Default` survives as a deprecated alias for `Eager`. Strategies are never inherited — each component declares its own.",
        },
        {
          id: "ng-change-detection-q4",
          prompt: "A button inside an `OnPush` grandchild is clicked. Which views does Angular check?",
          options: [
            "The grandchild and all of its ancestors up to the root, plus any other view marked dirty",
            "Only the grandchild, because it handled the event",
            "The whole application, because an event always triggers a full pass",
            "Only the grandchild and its own descendants",
          ],
          correctIndex: 0,
          explanation:
            "Handling an event marks the component and everything on the path up to the root as dirty, because an ancestor's template may bind to state the handler changed. Sibling `OnPush` subtrees that received no new inputs are still skipped.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-change-detection-q5",
          prompt: "Under zoneless change detection, what is the value of `NgZone.isStable`?",
          options: [
            "Always `true`, and `onMicrotaskEmpty`/`onStable` never emit",
            "`false` until the first render, then `true`",
            "It still tracks pending tasks accurately",
            "Reading it throws, because `NgZone` isn't provided",
          ],
          correctIndex: 0,
          explanation:
            "With no zone to observe, there is nothing to be unstable, so the observables never emit and the flag is pinned to `true`. Code that waited on them should use `afterNextRender`/`afterEveryRender`, and SSR should use `PendingTasks`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-change-detection-q6",
          prompt: "Are `NgZone.run` and `NgZone.runOutsideAngular` still useful in a zoneless application?",
          options: [
            "Yes — they're zoneless-compatible, and removing them from a library can regress apps that still use zone.js",
            "No — both throw once zone.js is removed from the build",
            "No — they become no-ops, so they should be deleted for clarity",
            "Only `run` is useful; `runOutsideAngular` is meaningless without a zone",
          ],
          correctIndex: 0,
          explanation:
            "The docs explicitly say to keep them: they're harmless without a zone and still prevent unnecessary change detection for consumers that haven't migrated. That matters most for library code with mixed consumers.",
        },
        {
          id: "ng-change-detection-q7",
          prompt: "Why did signals make it safe to make `OnPush` the default?",
          options: [
            "A signal read in a template registers that view as a consumer, so a write marks exactly the right views dirty",
            "Signals force every component to re-render on every write, which is always correct",
            "Signals run change detection synchronously, so no scheduling is needed",
            "Signals replace templates with imperative DOM updates that bypass change detection",
          ],
          correctIndex: 0,
          explanation:
            "`OnPush` is only usable when there's a reliable notification for every state change; the signal graph provides exactly that, per view. Without signals, teams had to remember `markForCheck` and got it wrong.",
        },
        {
          id: "ng-change-detection-q8",
          prompt: "A third-party charting library polls with `setInterval` every 16 ms. Under zone.js, what's the effect and the fix?",
          options: [
            "Every tick triggers application-wide change detection; run the library inside `NgZone.runOutsideAngular`",
            "Nothing happens, because timers aren't patched by zone.js",
            "Only the chart component is checked; no fix is needed",
            "The interval is throttled to once per animation frame automatically",
          ],
          correctIndex: 0,
          explanation:
            "That's zone pollution: a patched timer makes Angular re-check the whole tree 60 times a second for state that never changed. `runOutsideAngular` keeps the callback out of the zone and you re-enter with `run` only when you actually need a render.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-change-detection-q9",
          prompt: "What does `ExpressionChangedAfterItHasBeenCheckedError` indicate?",
          options: [
            "A binding produced a different value on the development-mode verification pass than on the first pass",
            "Two components wrote to the same signal in the same tick",
            "A template read a value that was `undefined` during the first check",
            "Change detection ran while a previous run was still in progress",
          ],
          correctIndex: 0,
          explanation:
            "Development builds run a second, read-only pass and compare; a difference means something mutated state during rendering, which would leave the DOM out of sync in production. It's usually a parent reading a value a child changed in a lifecycle hook.",
        },
        {
          id: "ng-change-detection-q10",
          prompt: "Which statements about migrating an existing app to zoneless are true? (Select all that apply.)",
          options: [
            "`OnPush` everywhere is recommended preparation but not strictly required",
            "Components using `Eager` are fine as long as they notify Angular (signals, `AsyncPipe`, `markForCheck`)",
            "`zone.js` and `zone.js/testing` should be removed from the `polyfills` in `angular.json`",
            "A library component that hosts user components created with `ViewContainerRef.createComponent` may not be able to use `OnPush`",
            "Every `setTimeout` in application code must be wrapped in `NgZone.run`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "The requirement is notification, not a particular strategy, which is why `Eager` components that use signals or `AsyncPipe` are compatible. A `setTimeout` that writes a signal notifies Angular by itself — no zone re-entry needed.",
        },
      ],
    },
    {
      id: "ng-testing",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "Testing with TestBed",
      summary:
        "`TestBed` is a miniature Angular application you assemble per test: `configureTestingModule({ imports, providers })` builds an environment injector, `createComponent(Cmp)` instantiates the component into the test DOM and hands back a `ComponentFixture`. That fixture is the whole API — `componentInstance` for the class, `nativeElement`/`debugElement` for the DOM, `componentRef.setInput()` for inputs, `whenStable()` for \"let rendering settle\". Current CLI projects run this under **Vitest with jsdom** rather than Karma and a real browser, which is why tests start in milliseconds now.\n\nThe ordering rule people trip over is that `createComponent` *freezes* the TestBed: after it, `configureTestingModule`, `overrideProvider` and friends throw. So all configuration — including swapping a real service for a fake — happens before the first `createComponent`, which is a good reason to use a `setup(overrides)` helper function rather than a fixed `beforeEach`. `compileComponents()` is only needed when the component under test contains `@defer` blocks.\n\nThe zoneless default changes the async idiom. `fakeAsync`/`tick` are zone.js utilities, so in a zoneless project the equivalent is `await fixture.whenStable()` after the action that should cause a render — including the initial render, which the CLI's generated spec awaits in `beforeEach`. For HTTP, `provideHttpClientTesting()` plus `HttpTestingController` lets you assert on the request (`expectOne`), supply the response (`flush`) and prove nothing is outstanding (`verify`) — a real seam, unlike stubbing `HttpClient` itself, which tests your mock rather than your interceptors. And you cannot assign to a signal input from a test; go through `fixture.componentRef.setInput('user', value)`, which is also one of the notifications that marks the view dirty.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Angular: Testing (setup, Vitest, configuration)", url: "https://angular.dev/guide/testing", kind: "docs" },
        { label: "Angular: Basics of testing components", url: "https://angular.dev/guide/testing/components-basics", kind: "docs" },
        { label: "Angular: Testing requests with HttpTestingController", url: "https://angular.dev/guide/http/testing", kind: "docs" },
        { label: "Angular University: Modern Angular Testing with Vitest - The Fundamentals", url: "https://blog.angular-university.io/angular-testing-vitest/", kind: "article" },
      ],
      video: {
        title: "I bet you can write an Angular UNIT TEST after this video",
        channel: "Joshua Morony",
        url: "https://www.youtube.com/watch?v=c57llB8QA2E",
        videoId: "c57llB8QA2E",
        durationLabel: "8:34",
      },
      alternateVideos: [
        {
          title: "Angular Unit Testing Crash Course | Unit Testing for Beginners | Test Angular Components Like a Pro",
          channel: "Let's Program",
          url: "https://www.youtube.com/watch?v=66o_Th-FT7w",
          videoId: "66o_Th-FT7w",
          durationLabel: "1:55:40",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ng-testing-q1",
          prompt: "What happens if you call `TestBed.configureTestingModule({ providers: [...] })` after `TestBed.createComponent(Cmp)` in the same test?",
          options: [
            "It throws: `createComponent` freezes the TestBed definition",
            "It applies to the next component you create",
            "It silently replaces the providers of the existing fixture",
            "It works, but only for providers that were not already resolved",
          ],
          correctIndex: 0,
          explanation:
            "`createComponent` closes the TestBed to further configuration, so every `configureTestingModule`, `overrideProvider` and `overrideComponent` call must come first. Wrapping setup in a parameterised helper is the usual way to keep per-test overrides possible.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-testing-q2",
          prompt: "How do you set a signal input from a test?",
          options: [
            "`fixture.componentRef.setInput('user', value)`",
            "`fixture.componentInstance.user.set(value)`",
            "`fixture.componentInstance.user = value`",
            "`TestBed.overrideComponent(Cmp, { set: { inputs: { user: value } } })`",
          ],
          correctIndex: 0,
          explanation:
            "Input signals are read-only inside the component and cannot be assigned from outside either, so `setInput` is the supported path — and it's one of the notifications that marks the view for check, which matters under zoneless.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-testing-q3",
          prompt: "Where does a standalone component under test go in the TestBed configuration?",
          options: [
            "`imports` — and an empty TestBed also works, because the component carries its own `imports`",
            "`declarations`, the same as any other component",
            "`providers`, so the injector can construct it",
            "`bootstrap`, mirroring `bootstrapApplication`",
          ],
          correctIndex: 0,
          explanation:
            "A standalone component brings its own template dependencies, so `createComponent` can instantiate it from an empty TestBed; you list it in `imports` when you need to override one of those dependencies. `declarations` is the NgModule-era field and rejects standalone components.",
        },
        {
          id: "ng-testing-q4",
          prompt: "Which `HttpTestingController` calls make an HTTP test meaningful? (Select all that apply.)",
          options: [
            "`expectOne('/api/users')` to assert exactly one matching request was made",
            "`req.flush(body)` to supply the response",
            "`verify()` in an `afterEach` to fail on unexpected outstanding requests",
            "`req.error(new ProgressEvent('error'))` to exercise the failure path",
            "`TestBed.inject(HttpClient).get = vi.fn()` to stub the client",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "`provideHttpClientTesting` swaps the backend, so your real `HttpClient`, your interceptors and your parsing all still run. Stubbing `HttpClient` itself removes exactly the code you wanted to test.",
        },
        {
          id: "ng-testing-q5",
          prompt: "A zoneless project's test clicks a button and then asserts on the rendered text. What should come between?",
          options: [
            "`await fixture.whenStable()`",
            "`tick()` inside `fakeAsync`",
            "`fixture.autoDetectChanges(true)` once in `beforeEach`",
            "Nothing — rendering is synchronous in tests",
          ],
          correctIndex: 0,
          explanation:
            "`fakeAsync` and `tick` are zone.js utilities and don't apply once zone.js is gone. Awaiting `whenStable()` lets the scheduled change detection run, which is also why the CLI's generated spec awaits it after the initial `createComponent`.",
        },
        {
          id: "ng-testing-q6",
          prompt: "When is `TestBed.compileComponents()` actually required?",
          options: [
            "When the component under test contains `@defer` blocks",
            "Whenever the component uses `templateUrl` instead of an inline template",
            "Before every `createComponent` call, as the generated spec shows",
            "Only when testing components declared in an NgModule",
          ],
          correctIndex: 0,
          explanation:
            "The CLI's build inlines external templates and styles, so the historical `compileComponents` ceremony is unnecessary; the current docs list `@defer` as the one remaining case.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-testing-q7",
          prompt: "What's the difference between `fixture.nativeElement` and `fixture.debugElement`?",
          options: [
            "`nativeElement` is shorthand for `debugElement.nativeElement`; `DebugElement` is Angular's platform-independent wrapper with query helpers",
            "`nativeElement` is the host element and `debugElement` is the first child",
            "`debugElement` exists only in development builds and is `undefined` in production test configurations",
            "`nativeElement` returns a detached clone, so mutations to it don't affect the rendered DOM",
          ],
          correctIndex: 0,
          explanation:
            "`DebugElement` wraps the platform element so tests can work on non-browser platforms and query by directive with `By.directive(...)`. Since these tests run in jsdom, `nativeElement` is a normal `HTMLElement`.",
        },
        {
          id: "ng-testing-q8",
          prompt: "You want to replace a real `AuthService` with a fake in one test only. What's the cleanest supported approach?",
          options: [
            "Call `configureTestingModule({ providers: [{ provide: AuthService, useValue: fake }] })` in a setup helper before `createComponent`",
            "Assign `component.authService = fake` after `createComponent`",
            "Use `TestBed.overrideProvider` after `createComponent`",
            "Re-export the module with the fake and import that instead",
          ],
          correctIndex: 0,
          explanation:
            "Overriding through DI exercises the same resolution path the application uses, and it has to happen before the TestBed is frozen. Assigning to a private field bypasses DI and breaks as soon as the component switches to `inject()` in a field initializer.",
        },
        {
          id: "ng-testing-q9",
          prompt: "What does the `providersFile` option in `angular.json`'s test target do?",
          options: [
            "Points at a file whose default export is an array of providers injected into every test's environment",
            "Lists the services that should be automatically mocked",
            "Declares which providers are allowed to be overridden in tests",
            "Replaces the application's root providers at build time",
          ],
          correctIndex: 0,
          explanation:
            "It's the global equivalent of putting providers in every `configureTestingModule`, alongside `setupFiles` for polyfills and global mocks — both are Vitest-era configuration surfaced through the Angular CLI.",
        },
        {
          id: "ng-testing-q10",
          prompt: "Which of these is a component harness good for?",
          options: [
            "Driving a component through a stable API (`click()`, `getText()`) so tests don't couple to its DOM structure",
            "Replacing TestBed entirely for component tests",
            "Running the same test in both jsdom and a real browser without any code change",
            "Generating test doubles for a component's injected services",
          ],
          correctIndex: 0,
          explanation:
            "Harnesses (`@angular/cdk/testing`) put an interaction API in front of a component so a template refactor doesn't break every consumer's tests. They run on top of TestBed, not instead of it.",
        },
      ],
    },
    {
      id: "ng-ssr-hydration",
      moduleId: "fe-angular",
      trackId: "frontend",
      title: "SSR, Hydration and Incremental Hydration",
      summary:
        "Angular's server story is now \"hybrid rendering\": a `ServerRoute[]` config assigns each route a `RenderMode` — `Client` (plain CSR), `Prerender` (static HTML at build time) or `Server` (rendered per request) — and `provideServerRendering(withRoutes(serverRoutes))` wires it up. `ng new --ssr` or `ng add @angular/ssr` sets it up, prerendering everything by default; `outputMode: 'static'` drops the server entirely. Choosing per route is the point: a marketing page is `Prerender`, a personalised dashboard is `Server`, and an admin tool nobody indexes is `Client`.\n\nHydration is what happens next in the browser. Without it, Angular throws the server's DOM away and re-renders from scratch, producing a visible flicker and a Cumulative Layout Shift hit. `provideClientHydration()` instead walks the existing DOM and claims the nodes, which is why it improves LCP and CLS. The price is a constraint: the DOM the client builds must match the DOM the server produced, down to whitespace and comment nodes, and nothing may rewrite the HTML in between. Components that use `innerHTML`, query the `document`, or `appendChild` their own nodes break that assumption and produce hydration mismatch errors; `ngSkipHydration` is the escape hatch, and it opts that component *and its children* out of hydration entirely.\n\nIncremental hydration, on by default with `provideClientHydration()`, is the interesting part. A `@defer` block with a `hydrate` trigger (`on idle`, `on viewport`, `on interaction`, `on hover`, `on immediate`, `on timer`, `when <expr>`, or `never`) is rendered fully on the server — so there's no placeholder and no layout shift — but its JavaScript stays unloaded on the client until the trigger fires. That makes `@defer` usable above the fold for the first time. It also depends on event replay, which captures clicks that land before hydration finishes and replays them afterwards, and enables it automatically.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Angular: Server-side and hybrid rendering", url: "https://angular.dev/guide/ssr", kind: "docs" },
        { label: "Angular: Hydration", url: "https://angular.dev/guide/hydration", kind: "docs" },
        { label: "Angular: Incremental hydration", url: "https://angular.dev/guide/incremental-hydration", kind: "docs" },
        { label: "Angular University: Angular Universal - Complete Practical Guide", url: "https://blog.angular-university.io/angular-universal/", kind: "article" },
      ],
      video: {
        title: "💥 Angular SSR Deep Dive (With Client HYDRATION) #angular",
        channel: "Angular University",
        url: "https://www.youtube.com/watch?v=U1MP4uCuUVI",
        videoId: "U1MP4uCuUVI",
        durationLabel: "24:55",
      },
      alternateVideos: [
        {
          title: "Angular 20: SSR vs CSR vs Pre-rendering - A Deep Dive",
          channel: "Code with Ahsan",
          url: "https://www.youtube.com/watch?v=CEWR1P5EpeY",
          videoId: "CEWR1P5EpeY",
          durationLabel: "19:24",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "ng-ssr-hydration-q1",
          prompt: "What does an Angular application do on the client when SSR is enabled but hydration is not?",
          options: [
            "Destroys the server-rendered DOM and re-renders it, which flickers and hurts CLS",
            "Leaves the server DOM in place but attaches no event listeners",
            "Refuses to bootstrap and logs a mismatch error",
            "Renders into a second root element alongside the server output",
          ],
          correctIndex: 0,
          explanation:
            "Pre-hydration Angular replaced the server markup wholesale, which is exactly the flicker `provideClientHydration()` removes by reusing the existing nodes. It's why hydration shows up as an LCP and CLS improvement rather than a correctness fix.",
        },
        {
          id: "ng-ssr-hydration-q2",
          prompt: "A component builds part of its UI with `element.innerHTML = markup` in `ngOnInit`. What happens under hydration?",
          options: [
            "A hydration mismatch error, because the client's DOM no longer matches what the server produced",
            "Nothing special — `innerHTML` is applied after hydration completes",
            "The markup is sanitised away and silently dropped",
            "The component is automatically excluded from hydration",
          ],
          correctIndex: 0,
          explanation:
            "Hydration expects a node-for-node match, so anything Angular didn't render itself breaks the walk. Refactor to template constructs, or apply `ngSkipHydration` to that component as a stopgap — at the cost of hydration for it and all its children.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-ssr-hydration-q3",
          prompt: "Which `RenderMode` should a personalised, authenticated dashboard route use?",
          options: [
            "`RenderMode.Server`",
            "`RenderMode.Prerender`",
            "`RenderMode.Client`",
            "`RenderMode.Prerender` with `withAppShell`",
          ],
          correctIndex: 0,
          explanation:
            "`Server` renders per request, which is the only mode that can see the request's user. `Prerender` builds one HTML file at build time, so per-user content would be baked in for everybody.",
        },
        {
          id: "ng-ssr-hydration-q4",
          prompt: "What is `withEventReplay()` for, and what is its relationship to incremental hydration?",
          options: [
            "It captures user events that fire before hydration finishes and replays them after; incremental hydration enables it automatically",
            "It records user sessions for debugging and is unrelated to hydration",
            "It replays the server's rendering steps on the client to verify the DOM matches",
            "It re-dispatches events from the server to the client over a websocket",
          ],
          correctIndex: 0,
          explanation:
            "Server-rendered HTML is visible and clickable before listeners are attached, so without replay those first clicks are lost. Turning on incremental hydration turns on event replay too, so you can drop an explicit `withEventReplay()`.",
        },
        {
          id: "ng-ssr-hydration-q5",
          prompt: "Which statements about incremental hydration are true? (Select all that apply.)",
          options: [
            "It is enabled by default when you call `provideClientHydration()`",
            "A `@defer` block with a `hydrate` trigger renders its main template on the server, not its `@placeholder`",
            "It makes `@defer` usable above the fold without causing a layout shift",
            "You opt out with `withNoIncrementalHydration()`",
            "It requires every deferred component to be marked `ngSkipHydration`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "The trick is that the server renders the real content while the client keeps the JavaScript dehydrated until the trigger fires, which is what removes the placeholder-then-swap layout shift. `ngSkipHydration` is the opposite — it disables hydration for a subtree.",
        },
        {
          id: "ng-ssr-hydration-q6",
          prompt: "Which of these are valid `hydrate` triggers on a `@defer` block? (Select all that apply.)",
          options: ["`hydrate on viewport`", "`hydrate on interaction`", "`hydrate when isReady()`", "`hydrate never`", "`hydrate on scroll`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "`hydrate on` supports `idle`, `viewport`, `interaction`, `hover`, `immediate` and `timer`; `hydrate when` takes a condition and `hydrate never` keeps a block static forever. There is no `on scroll` trigger — viewport entry is expressed with an `IntersectionObserver`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-ssr-hydration-q7",
          prompt: "Why does the HTTP transfer cache exist in an SSR Angular app?",
          options: [
            "So a request the server already made isn't made again by the client immediately after hydration",
            "So the server can cache rendered HTML between requests",
            "So `HttpClient` responses are stored in `localStorage` for offline use",
            "So the client can prefetch data for routes it hasn't navigated to yet",
          ],
          correctIndex: 0,
          explanation:
            "Without it, every `GET` issued during server rendering is repeated in the browser the moment the app boots — doubling load on the API and often causing a visible re-render. The responses are serialised into the page and replayed to the client's `HttpClient`.",
        },
        {
          id: "ng-ssr-hydration-q8",
          prompt: "A component needs to read `window.innerWidth`. What's the correct way to keep it SSR-safe?",
          options: [
            "Read it in an `afterNextRender` callback, or guard with `isPlatformBrowser(inject(PLATFORM_ID))`",
            "Read it in the constructor and catch the `ReferenceError` on the server",
            "Read it in `ngOnInit`, which only runs in the browser",
            "Add `ngSkipHydration` so the component only runs on the client",
          ],
          correctIndex: 0,
          explanation:
            "`afterNextRender` runs only in the browser and is the intended hook for DOM measurement; the platform check is the general-purpose guard. `ngOnInit` runs on the server too, and `ngSkipHydration` disables hydration rather than server rendering.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "ng-ssr-hydration-q9",
          prompt: "What does `outputMode: 'static'` do to a project created with `ng new --ssr`?",
          options: [
            "Prerenders every route to HTML at build time and produces no server entry point",
            "Disables prerendering so all routes are rendered per request",
            "Keeps the server but serves cached HTML instead of rendering",
            "Disables hydration, since static HTML has nothing to hydrate",
          ],
          correctIndex: 0,
          explanation:
            "It's the fully static output for hosts with no Node runtime. Prerendered pages still hydrate in the browser — static generation is about when the HTML is produced, not about whether the app becomes interactive.",
        },
        {
          id: "ng-ssr-hydration-q10",
          prompt: "What is the cost of adding `ngSkipHydration` to a component?",
          options: [
            "That component and its whole subtree are destroyed and re-rendered on the client, losing hydration's benefit there",
            "The component is not rendered on the server at all, so it's missing from the HTML",
            "Its event listeners are never attached until the user interacts with it",
            "Nothing — it's a pure annotation that only silences the mismatch warning",
          ],
          correctIndex: 0,
          explanation:
            "It restores the old destroy-and-re-render behaviour for that subtree, which is a targeted regression, not a fix. The docs frame it as a stopgap while you refactor the DOM manipulation that caused the mismatch.",
        },
      ],
    },
  ],
} satisfies Module;
