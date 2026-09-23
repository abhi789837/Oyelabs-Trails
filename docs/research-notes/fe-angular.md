# Angular research notes (2026-09-23)

15 topics: 12 quizzes (118 questions, 39 edge-case/interview, 21 multi-select) and 3 code challenges
(34 tests, 9 edge cases; reference solutions in `content-tests/solutions/`). Milestones: `ng-signals`,
`ng-router`, `ng-change-detection`. No search-URL fallbacks — every video id came from
`node scripts/research/yt.mjs search` and was confirmed with `yt.mjs info` (exists, `embeddable: true`,
exact title/channel/duration). All 57 non-YouTube URLs return 200 via `check-urls.mjs`.

## Version check (the biggest accuracy risk in this camp)

`CONTENT_GUIDE` §10b said Angular 22, standalone by default, signals recommended, `@if`/`@for`/`@switch`
current. Re-checked and **all of that holds**, plus four things §10b does not mention that materially
change what "current Angular" means:

- **Angular 22.1.7** is `latest` on npm (`registry.npmjs.org/@angular/core`), and angular.dev's footer
  reports "Built by Angular at v22.1.7". v22.0 shipped **2026-06-03**.
- **`OnPush` is the default change-detection strategy since v22**, and the old default was renamed
  `ChangeDetectionStrategy.Eager`; `Default` is now a deprecated alias for `Eager`
  (`/api/core/ChangeDetectionStrategy`, `/best-practices/skipping-subtrees`, v22 blog).
- **Zoneless is the default since v21** — `/guide/zoneless` states it outright and tells v20 users to
  add `provideZonelessChangeDetection()` themselves.
- **Angular moved to a 12-month major cycle with v22** (it was 6 months up to v21), with a 24-month
  support window: 12 active + 12 LTS. v23 is scheduled for ~June 2027 (`/reference/releases`).
- Other v22 facts used: `@Service()` decorator, `injectAsync`, Signal Forms / Angular Aria /
  asynchronous-reactivity APIs stable, `@default never;` exhaustiveness in `@switch`, inline arrow
  functions allowed in templates, `@boundary` announced as dev preview for Q3 2026 (not taught here).
- **New CLI projects run `ng test` on Vitest + jsdom**, not Karma (`/guide/testing`).

### angular.dev returns HTTP 200 for URLs that do not exist

`check-urls.mjs` alone is **not sufficient** for angular.dev: it is an SSR'd SPA that serves a soft-404
with status 200. `https://angular.dev/guide/this-page-does-not-exist-xyz` checks out as 200. The tell is
the `<title>`: a missing page renders `"Home • Angular"`. Every angular.dev URL in this module was
additionally title-checked, and several plausible-looking paths turned out to be soft-404s or
client-side redirects:

- `https://angular.dev/guide/forms/signals` → soft-404. The real page is `/guide/forms/signals/overview`.
- `/guide/di/dependency-injection` → JS redirect to `/guide/di`.
- `/guide/di/dependency-injection-providers` → JS redirect to `/guide/di/defining-dependency-providers`.
- `/guide/components/importing` → JS redirect to `/guide/components#using-components`.
- `/guide/forms/typed-forms` is the real path (not `/guide/forms/reactive-forms/typed-forms`).
- `blog.angular.dev` (Medium) behaves the same way: an invented slug still returns 200. The real v22
  post was resolved from the `goo.gle/angular-v22-blog` shortlink on `/events/v22` and is
  `https://blog.angular.dev/announcing-angular-v22-c52bb83a4664`. It was used as a research source
  only, not as a `webRef`, because Medium blocks framing.

The real URL map was recovered by scraping the sidebar `href`s out of several rendered doc pages.

## Videos

Most Angular video content on YouTube is v8–v15 and teaches NgModules, `*ngIf` and RxJS-everywhere, so
selection was biased hard towards post-v17 uploads and towards channels that track releases
(official **Angular**, **Brian Treese**, **Decoded Frontend**, **Joshua Morony**, **Deborah Kurata**).

- `ng-what-is-angular`: "Angular Tutorial for Beginners 2026 … Angular 21" (Interview Happy, 2:15:07,
  Apr 2026) from "Angular fundamentals" at 92. Newest full tutorial from a credible source with real
  chapters. Alternates: official "What's new in Angular v22" (`h5OJUSS_8IA`, 17:19, Jun 2026) and
  Code with Ahsan's crash course at the "Angular vs React" chapter (330).
- `ng-standalone-components`: FED Learning "Angular 19 Tutorial | Full Angular Course" (`jYV2enNmplM`,
  9:19:25, Mar 2025) from "Standalone Components" at 844 — the only long-form English course found that
  is standalone-first, signals-aware and chaptered. Alternates: procademy "Standalone Components
  Explained (v17 & Higher)" (29:37, Dec 2025), official "Getting Started with Standalone Components"
  (Aug 2022, kept only as an alternate because it predates the v19 default).
- `ng-templates-control-flow`: Decoded Frontend "Angular 17 - New Build-In Control Flow Overview"
  (14:01). Alternates: Brian Treese "The Angular @switch upgrades you should know about" (7:48,
  May 2026 — covers `@default never;`) and the FED Learning chapter "*ngFor vs @for()" at 4680.
- `ng-content-projection`: Decoded Frontend "Content Projection in Angular - Complete Guide" (26:17,
  May 2024) — the only current, genuinely deep one; everything else found was 5–7 years old.
  Alternate: Brian Treese "The beginner's guide to content projection" (10:32).
- `ng-signals`: Joshua Morony "How to deeply understand Angular signals" (10:51, Dec 2024) — it builds
  the mental model the code challenge asks you to implement. Alternates: Decoded Frontend
  "LinkedSignal in Angular 19" (14:05) and the FED Learning "Signals" chapter at 8270.
- `ng-signal-inputs-outputs`: Brian Treese "How Angular components should communicate in 2025" (7:52).
  Alternates: Decoded Frontend on input signals (14:34) and on `model()` (12:51).
- `ng-dependency-injection`: Joshua Morony "Why I decided to switch to the inject() function" (6:09).
  Alternates: Deborah Kurata "Angular Injection Context Explained" (7:08), Web Tech Talk
  "Dependency Injection in-depth" (8:48).
- `ng-services-providers`: Brian Treese "Angular 22 @Service vs @Injectable" (7:42, May 2026) — the only
  video found that covers the v22 decorator. Alternates: the official v22 video at its
  "Introducing the new @Service decorator" chapter (703), Web Tech Talk "Dependency Providers" (8:59).
- `ng-rxjs-interop`: Deborah Kurata "How Angular Signals and RxJS Work Together" (16:15). Alternates:
  her shorter `toSignal`/`toObservable` video (6:41) and Joshua Morony's "Why didn't the Angular team
  just use RxJS instead of Signals?" (8:14) for the framing argument.
- `ng-http-interceptors`: Decoded Frontend "Angular Interceptors — Auth & Global HTTP Error Handling
  (Basics, 2025)" (15:58, Sep 2025) — functional interceptors, current API, recent.
- `ng-router`: Monsterlessons Academy "Angular Routing Essentials" (21:29, Sep 2024). Alternates:
  Decoded Frontend "CanMatch Guard" (17:49) and the FED Learning "Routing" chapter at 9919.
  Nothing current and focused was found on functional guards specifically; the summary and quiz carry
  that load.
- `ng-forms`: official "Typed Forms in Angular" (10:59, 2022). It is old, but typed forms have not
  changed since v14 and this is the authoritative explanation. Alternates: Joshua Morony on typed-form
  ergonomics (5:02), Brian Treese "Build Modern Angular Forms with Signals" (7:03, Mar 2026) for the
  Signal Forms direction, and the FED Learning "Reactive Form" chapter at 18961.
- `ng-change-detection`: Decoded Frontend "Change Detection Pt.3 - OnPush" (16:52). Alternates:
  Deborah Kurata "Zoneless Angular Applications in V18" (14:00), Joshua Morony "WTF is Zone.js" (13:20),
  and the official v22 chapter "New helpful defaults" at 583, which is where the OnPush-by-default and
  `Eager` rename are announced.
- `ng-testing`: Joshua Morony "I bet you can write an Angular UNIT TEST after this video" (8:34).
  Alternate: Let's Program "Angular Unit Testing Crash Course" (1:55:40). **Both predate the Vitest
  default and show Jasmine/Karma**; the summary says so explicitly and the quiz tests the current
  Vitest/zoneless behaviour. No post-v20 Angular+Vitest testing video was found on a roster channel.
- `ng-ssr-hydration`: Angular University "Angular SSR Deep Dive (With Client HYDRATION)" (24:55).
  Alternate: Code with Ahsan "Angular 20: SSR vs CSR vs Pre-rendering" (19:24, Jun 2025). Neither
  covers incremental hydration in depth; the summary and quiz do.
- Two videos are reused across topics at different start times (`jYV2enNmplM` at 844/4680/9919/18961 and
  `h5OJUSS_8IA` at 0/583/703), always as alternates except for `ng-standalone-components`.

## References

- Every angular.dev page allows iframe embedding (no `X-Frame-Options`, no restrictive
  `frame-ancestors`), so reference previews actually render for the primary docs of every topic.
  So do `blog.angular-university.io`, `justangular.com`, `www.angulararchitects.io` and `rxjs.dev`.
  `github.com` sends `frame-ancestors 'none'` and `blog.angular.dev` (Medium) sends
  `frame-ancestors 'self' https://medium.com`, so both fall back to the link card.
- `justangular.com/blog/<slug>` 301s to a trailing-slash URL; the final URLs are used.
- `angular.love` sends `X-Frame-Options: SAMEORIGIN` (not used in the end).
- `www.angulararchitects.io` has drifted mostly to German; the English mirror is under `/en/blog/`.
- Interview-prep resource: `https://github.com/sudheerj/angular-interview-questions`
  ("List of 300 Angular Interview Questions and answers"), used on four topics.

## Facts verified

Checked against angular.dev (v22.1.7 build) unless noted.

- Standalone defaults to `true` **since v19**; a component in an NgModule's `declarations` must set
  `standalone: false`; a standalone component goes in an NgModule's `imports`, never `declarations`.
- The standalone migration is `ng g @angular/core:standalone`, run three times (convert declarations →
  remove unnecessary NgModules → bootstrap with standalone APIs).
- `@for` **requires** `track`; unlike `*ngFor` it prefers view reuse, so a changed tracked property on
  the same object reference updates bindings instead of remounting (documented as a breaking change).
  `@for` exposes `$index`, `$count`, `$first`, `$last`, `$even`, `$odd` and supports `@empty`.
  `@switch` compares with `===`, has no fall-through, allows consecutive `@case`, and supports
  `@default never;` exhaustiveness — which does **not** work on a signal call, because TypeScript
  narrowing needs a variable (`@let m = mySignal();` is the documented workaround).
- `<ng-content>` is compile-time only, must not be wrapped in `@if`/`@for`/`@switch` (content is
  instantiated regardless), supports fallback content, a catch-all slot and `ngProjectAs` (static only).
  Projected content is checked with the **parent's** change detection and resolves DI from the parent's
  injector, so `viewProviders` are invisible to it while `providers` are.
- Signals: `computed` is lazy + memoised with dynamic dependencies; default equality is `Object.is`;
  `equal` is accepted by `signal`, `computed` and `toSignal`; reactive contexts are `effect`,
  `afterRenderEffect`, `computed`, `linkedSignal`, `resource` params/loader and template rendering;
  the reactive context ends at the first `await`; `untracked` opts out; `isSignal`/`isWritableSignal`.
  `linkedSignal(computation)` resets on source change, and the `{ source, computation }` form receives
  `previous.source` / `previous.value`. Effects are scheduled (view effects run before their component
  is checked, root effects before all components) and are the documented last resort.
- `input()` returns a read-only `InputSignal`; no default ⇒ `InputSignal<T | undefined>`;
  `input.required<T>()` is enforced at build time; transforms must be statically analysable and pure;
  `booleanAttribute` treats the literal string `"false"` as `false`; `numberAttribute` yields `NaN`;
  **`model()` does not support transforms**; `model()` creates an implicit `<name>Change` output;
  two-way binding to a model input passes the **signal instance**, not its value. Angular custom
  outputs do **not** bubble.
- DI: two-phase resolution (element injectors, then environment injectors, then `NullInjector`).
  Modifiers are `optional`, `self`, `skipSelf`, `host`; `host` + `skipSelf` cannot be combined.
  Injection contexts: constructors, field initializers, `useFactory`, `InjectionToken` factories and
  frames Angular runs in one (guards, interceptors); `runInInjectionContext` /
  `assertInInjectionContext` are the escape hatches. If two directives on one element provide the same
  token, the winner is documented as **undefined**.
- `@Service()` vs `@Injectable()` (docs table): `@Service` supports `inject()` and a custom `factory`
  and is an implicit root singleton; it does **not** support constructor DI, advanced provider keys
  (`useClass` etc.) or non-root scopes. `useClass` creates a new instance, `useExisting` aliases the
  same one. `injectAsync` (v22) needs an auto-provided service.
- RxJS interop: `toSignal` subscribes immediately, needs `initialValue` or `requireSync` or returns
  `undefined`, rethrows source errors **on read**, keeps the last value after completion, accepts
  `equal`, and must run in an injection context (or take an `injector`). `toObservable` uses an effect
  and a `ReplaySubject`, so `set(1); set(2); set(3)` emits only `3`.
- Interceptors: `withInterceptors([...])` runs them in listed order; requests/responses are immutable
  and cloned; `HttpContext` is deliberately **mutable** and survives retries; interceptors run in the
  injection context of the registering injector; they need not call `next`; the response stream carries
  every `HttpEvent`, so check `event.type === HttpEventType.Response`. DI-based interceptors still work
  via `withInterceptorsFromDi()` + `HTTP_INTERCEPTORS` (`multi: true`), with hard-to-predict ordering.
- Router: guard return types are `boolean | UrlTree | RedirectCommand | Promise | Observable` (first
  emission wins); `CanMatch` returning `false` falls through to later routes instead of blocking;
  `canActivateChild` applies to the whole child subtree; `loadComponent`/`loadChildren` run in the
  route's injection context; a `default` export needs no `.then(...)`; route `providers` create an
  environment injector for the subtree. `provideRouter` features include `withComponentInputBinding`,
  `withPreloading`, `withRouterConfig`, `withViewTransitions`, `withHashLocation`,
  `withInMemoryScrolling`, `withNavigationErrorHandler`. The docs open the guards page with an explicit
  "never rely on client-side guards as the sole source of access control".
- Forms: reactive forms are strictly typed since v14; `new FormControl('x')` is
  `FormControl<string | null>` because `reset()` nulls it, and `{ nonNullable: true }` changes that
  behaviour; `group.value` is a `Partial<...>` because disabled controls are excluded, and
  `getRawValue()` includes them; `FormRecord` for dynamic keys; `NonNullableFormBuilder`;
  `UntypedFormGroup`/`UntypedFormControl` for incremental migration. Signal Forms became **stable in
  v22** and live under `/guide/forms/signals/*`.
- Change detection: `OnPush` compares inputs with `==`; the notification list is `markForCheck`
  (called by `AsyncPipe`), `ComponentRef.setInput`, a signal read in a template changing, bound host or
  template listeners, and attaching a dirty view. Under zoneless, `NgZone.isStable` is always `true` and
  `onMicrotaskEmpty`/`onUnstable`/`onStable` never emit; `afterNextRender`/`afterEveryRender` replace
  them and SSR uses `PendingTasks`; `NgZone.run`/`runOutsideAngular` remain compatible and useful.
- Testing: Vitest + jsdom by default (`happy-dom` supported as a swap); `angular.json` test options
  include `include`, `exclude`, `setupFiles`, `providersFile`, `coverage`, `browsers`;
  `TestBed.createComponent` **freezes** the TestBed; `compileComponents()` is only needed for `@defer`;
  the generated spec awaits `fixture.whenStable()` for the initial render.
- SSR: `ServerRoute[]` with `RenderMode.Client | Prerender | Server`, wired with
  `provideServerRendering(withRoutes(serverRoutes))`; `ng new --ssr` / `ng add @angular/ssr`;
  `outputMode: 'static'` drops the server. Hydration requires an identical DOM including whitespace and
  comment nodes; `innerHTML`/direct DOM work breaks it; `ngSkipHydration` opts a component **and its
  children** out. Event replay exists since v18 (`withEventReplay()`); **incremental hydration is on by
  default** with `provideClientHydration()`, enables event replay automatically, and is disabled with
  `withNoIncrementalHydration()`. Hydrate triggers: `on idle | viewport | interaction | hover |
  immediate | timer`, plus `hydrate when` and `hydrate never`. i18n blocks skip hydration by default.

## Code challenges

Three topics are `code` because their logic is plain JavaScript that stands alone; the other twelve are
about template syntax, DI wiring or configuration, where a quiz is the honest test.

- **`ng-signals`** — build `signal`, `computed`, `effect`, `linkedSignal`, `flushEffects`, `untracked`.
  A pull-based, version-checked graph is exactly what Angular's own implementation is, and the observable
  behaviours (lazy memoised `computed`, dynamic dependencies, equality stopping propagation, scheduled
  and batched effects, a diamond recomputing once) are the things the quiz version of this topic could
  only ask about. 12 tests, 4 edge cases (destroy, diamond, a 200-deep chain, 1,000 writes with no
  subscriber). Deliberately different in shape from the Vue camp's `reactive`/`effect` Proxy challenge.
- **`ng-http-interceptors`** — implement `createHttpHandler(interceptors, backend)`, i.e. the
  composition behind `withInterceptors([...])`. Pure function composition with real consequences: order,
  short-circuiting, a re-entrant `next` (which is how retry works), handler reuse, and a mutable
  context surviving retries. 10 tests, 4 edge cases (empty chain, mutable context, thrown error,
  500-deep chain).
- **`ng-forms`** — implement `validateForm(schema, value)`, mirroring `FormGroup` semantics: merged
  (never short-circuiting) validators, disabled controls excluded from `value` but present in
  `rawValue`, group-level cross-field validators, and Angular's actual emptiness rule
  (`null`/`undefined`/empty string/empty array, but **not** `false` or `0`) and pattern anchoring
  (`^`/`$` prepended/appended unless already present, with the anchored source reported as
  `requiredPattern`). Validators are declared as plain data so `args` stay JSON-cloneable.
  12 tests, 5 edge cases.
- All three reference solutions were run against the real test cases and against the untouched starter
  (which fails 11/12, 9/10 and 10/12 respectively).

## Scope judgement

- The brief asked for 12–15 topics and listed 15 concepts; DI and "services and providers" were split
  into two topics (`ng-dependency-injection` for injector mechanics, `ng-services-providers` for the
  provider recipes and scopes) because the v22 `@Service` decorator makes the second a real subject.
- `@defer` and deferrable views are covered only where incremental hydration needs them, not as their
  own topic, to stay inside the topic budget.
- Angular Aria, Angular MCP/Agent Skills and `@boundary` are mentioned in the v22 context but not
  taught: Aria is a large separate surface and `@boundary` is a Q3 2026 developer preview.
- Signal Forms are named and positioned in `ng-forms` but the topic teaches reactive/template-driven
  and typed forms, as the brief asked. If this camp is revisited after Signal Forms adoption picks up,
  it deserves its own topic.
