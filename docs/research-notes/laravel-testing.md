# Testing with Pest & PHPUnit research notes (2026-09-23)

Thirteen topics, one per bullet of the camp brief. All challenges are **quiz** — the in-app sandbox
is a JavaScript worker and cannot grade PHP, so difficulty is carried by predict-the-behaviour and
judgement questions instead (same decision as the rest of the PHP track, logged in
`docs/PROGRESS.md`). 139 questions; every topic has at least two
`isEdgeCaseOrInterviewQuestion` and at least one multi-select.

Scope discipline: this camp **tests** things other camps teach. Validation rules, Eloquent,
queues, auth and API resources are only present as subjects under test. The topic order goes
tooling → environment → shapes of test → database → data → rules → doubles → time → async →
browser → speed → judgement, so the two milestones (`lv-test-fakes`, `lv-test-what-to-test`) land
on the two things that actually separate a senior Laravel engineer here: knowing what a fake costs
you, and knowing what not to write.

## Topics

| id | level | milestone |
| --- | --- | --- |
| `lv-test-pest-phpunit` | intermediate | |
| `lv-test-environment` | intermediate | |
| `lv-test-unit-vs-feature` | intermediate | |
| `lv-test-http` | intermediate | |
| `lv-test-database` | advanced | |
| `lv-test-factories` | intermediate | |
| `lv-test-validation-authorization` | advanced | |
| `lv-test-fakes` | advanced | ✅ |
| `lv-test-time` | advanced | |
| `lv-test-jobs-console` | advanced | |
| `lv-test-browser` | advanced | |
| `lv-test-speed` | advanced | |
| `lv-test-what-to-test` | expert | ✅ |

## Videos

Every id below came from `yt.mjs search` and was confirmed with `yt.mjs info` —
all `embeddable: true`, titles/channels/durations copied from that output. No search-URL
fallbacks were needed.

Two recent spines carry most of the camp:

- **`0DxZlKfO4QY`** — "Let's Build Task Tracker App With Laravel | Part 4: Testing, Mocking,
  Profile Page & Deployment" (**Program With Gio**, 2:21:17, Apr 2026). The single best find: its
  chapter list maps almost one-to-one onto this camp, and it is recent enough to be Laravel-13
  shaped. Chapters used: **774 Test Anatomy & Writing Feature Tests** (`lv-test-http`),
  **1189 Resetting Database & Running Tests** (alt for `lv-test-database`), **3319 Factory States**
  (`lv-test-factories`), **4331 Mocking & Facade Fakes** (`lv-test-fakes`), **5242 Time Travel In
  Tests** (`lv-test-time`). Unused markers, noted for anyone extending the camp: 0 Intro To
  Testing, 1803 More Feature Tests, 2947 Data Providers, 3685 Unit Tests, 5770 User Profile Page,
  7658 Upgrade Laravel With Boost, 7814 Deploy.
- **`qfN-rJ-K5WI`** — "Laravel Testing Crash Course: From Zero to Pest v4" (**The Codeholic**,
  2:41:53, Dec 2025). Used at **1154 Configuration** (`lv-test-environment`) and **4568 Database
  Testing** (`lv-test-database`). Other markers: 170 Introduction to Testing, 520 Getting Started
  with Pest, 1452 Expectations, 2067 Writing Unit Tests, 3077 Writing Feature Tests,
  3377 Browser Testing, 4980 Hooks, 5159 DataSets, 5530 Snapshot and Screenshot Testing,
  5887 Organizing and Grouping Tests, 6015 Filtering and Skipping, 6193 Testing APIs,
  6482 Real World Project, 9018 Deployment with CI/CD.

Dedicated primaries where one beats a chapter:

- `lv-test-pest-phpunit` → **`4ubp_IF6kqY`** "Laravel Testing 21/24: What is PEST and How It Works"
  (Laravel Daily, 13:40). Three years old but the Pest↔PHPUnit framing has not changed.
  Alternate **`71bMyZcDlM4`** "Introducing Pest 5 | Nuno Maduro at Laracon US 2026" (Laravel,
  26:21, Aug 2026) supplies the current-state view from Pest's author.
- `lv-test-unit-vs-feature` → **`0bVlUy2L9tM`** "Laravel Feature or Unit Tests: The Difference"
  (Laravel Daily, 9:47). Alternate **`-4RRo6CTUgA`** (Acadea.io, 57:46) at **2 "Ep22 - Unit Test vs
  Feature Test vs E2E Test"**; its **1156 "Ep24 - Testing API routes"** is the alternate for
  `lv-test-http` and **3124 "Ep28 - Opinion on Testing: how much is enough?"** for
  `lv-test-what-to-test`.
- `lv-test-validation-authorization` → **`g0Jsmzt8Eg4`** "Better Testing in Laravel - Kai
  Sassnowski" (Laracon EU, 33:58) at **859 "Validation"** — the data-driven validation-testing
  argument, which is exactly this topic's thesis. Alternate `M3s8aTR42Cw` (Laravel Daily, 7:48)
  covers the authorization half.
- `lv-test-jobs-console` → **`jJX6QxxK2qY`** "What's New in Laravel 11, Ep 14 - Simple Tests for
  Complex Jobs" (Laracasts, 5:14). Short, but it is the video about `withFakeQueueInteractions()`,
  which is the topic's core API. No good dedicated video exists for Laravel *console* testing —
  everything found was 6–8 years old or a tiny non-English channel — so that half is carried by the
  summary and the quiz.
- `lv-test-browser` → **`f5gAgwwwwOI`** "Pest 4: Modern Browser Testing, Sharding, Visual Diffs &
  more | Nuno Maduro at Laracon US 2025" (Laravel, 29:48) at **136 "Browser Testing"**. Its
  **607 "Debugging and Code Coverage"** is an alternate on `lv-test-speed` (different start, so no
  duplicated embed). Alternates `2M23skx2TK8` (Aaron Francis, Dusk, 20:49), `pnkXtIZyZy4`
  (Laracasts, 26:25), `M5i5-87HoHw` (Laravel Daily Pest 4 browser, 17:24).
- `lv-test-speed` → **`_t3EXMGB3nc`** "Test Coverage 'Myth' and What is The Goal Instead?"
  (Laravel Daily, 7:07) — coverage-as-a-floor is the topic's argument. Alternate `WgbeoiD4TFM`
  (Codecourse, 1:35) is thin but is the only on-topic parallel-testing clip found.
- `lv-test-what-to-test` → **`jQ1vYzoCubA`** "Lies you've been told about Unit Testing - Adam
  Wathan" (Laracon Online, 55:30). The definitive talk for this topic; its chapter
  **2572 "Testing external services"** is an alternate on `lv-test-fakes`.

Other alternates: `loA8bKZvSmw` (Laravel Daily, phpunit.xml/.env.testing, 5:06), `G4c6EPQ7c7A` and
`McrdcQ09OxI` (factories/states), `hB1s7I14HXc` (HTTP fake, 6:05), `qYZvpvVs6hk`
(Laravel channel, `Sleep` helper, 2:58), `0O_ue5dkU7E` (what to test, 4:00).

**Weak spots, flagged honestly:** there is no good dedicated video anywhere on YouTube for Laravel
*time travel in tests* or for *console command testing*. The Program With Gio chapter covers the
first properly; the second leans on the Laracasts jobs video plus the written docs. Several Laravel
Daily episodes used are ~3 years old; they were kept only where the concept is version-independent,
and any Laravel-13-specific fact in the quizzes comes from the docs, not from the video.

## References

- Every `webRefs` URL was checked with `check-urls.mjs` — 40 distinct URLs, all 200.
- **`laravel.com/docs/13.x/…` 302s to `laravel.com/framework/docs/13.x/…`**; the final URL is what
  is shipped. Slugs confirmed: `testing`, `http-tests`, `database-testing`, `mocking`,
  `console-tests`, `dusk`, `queues`, `mail`, `notifications`, `events`, `filesystem`,
  `http-client`, `eloquent-factories`, `validation`, `authorization`, `scheduling`, `helpers`,
  `configuration`.
- Anchors were verified by extracting `id="…"` from the fetched pages, not guessed:
  `testing#environment`, `testing#running-tests-in-parallel`,
  `database-testing#resetting-the-database-after-each-test`, `database-testing#model-factories`,
  `http-tests#available-assertions`, `mocking#interacting-with-time`,
  `dusk#resetting-the-database-after-each-test`, `queues#testing`,
  `mail#testing-mailable-sending`, `notifications#testing`, `events#testing`,
  `filesystem#testing`, `http-client#testing`, `eloquent-factories#factory-states`,
  `validation#form-request-validation`, `helpers#sleep`.
- **Redirects found:** `pestphp.com/docs/coverage` → `/docs/test-coverage`;
  `pestphp.com/docs/underlying-test-case` → `/docs/configuring-tests`;
  `pestphp.com/docs/higher-order-tests` → `/docs/higher-order-testing`. Final URLs shipped.
- PHPUnit docs are pinned to **12.5**, because `laravel/laravel` 13.x requires
  `phpunit/phpunit: ^12.5.12`. 13.0/13.1/13.2 doc trees exist but are ahead of what a Laravel 13
  app installs.
- **Iframe previews:** `laravel.com` sends `X-Frame-Options: SAMEORIGIN`, `pestphp.com` sends
  `X-Frame-Options: deny`, and `martinfowler.com`, `kentcdodds.com` and `github.com` all block
  framing too. So **every reference card in this camp falls back to a link preview** except
  `docs.phpunit.de`, which has no framing restrictions.
- No interview-prep repo is used. There is no PHP/Laravel equivalent of
  `lydiahallie/javascript-questions` worth shipping; the edge-case questions carry that load, as
  agreed for the rest of the PHP track.

## Facts verified

Checked against the Laravel 13 docs, the `laravel/framework` 13.x and `laravel/laravel` 13.x
sources, and the Pest docs on 2026-09-23 — not from memory.

### Environment (from `laravel/laravel` 13.x `phpunit.xml`, read directly)

- The shipped env block is: `APP_ENV=testing`, `APP_MAINTENANCE_DRIVER=file`, `BCRYPT_ROUNDS=4`,
  `BROADCAST_CONNECTION=null`, `CACHE_STORE=array`, `DB_CONNECTION=sqlite`,
  `DB_DATABASE=:memory:`, `DB_URL=""`, `MAIL_MAILER=array`, `QUEUE_CONNECTION=sync`,
  `SESSION_DRIVER=array`, `PULSE_ENABLED=false`, `TELESCOPE_ENABLED=false`,
  `NIGHTWATCH_ENABLED=false`. There is **no** `APP_DEBUG` entry and nothing regenerates `APP_KEY`.
- `QUEUE_CONNECTION=sync` ⇒ an undispatched-to-a-worker job runs **inline** in the test, and its
  exceptions fail the test. `MAIL_MAILER=array` ⇒ mail is collected in memory with or without
  `Mail::fake()`. Both are used as edge-case questions.
- `.env.testing` is used **instead of** `.env` for Pest/PHPUnit runs or `--env=testing`.
- The docs explicitly warn to run `config:clear` before tests when the config is cached.
- `laravel/laravel` 13.x `require-dev` is `phpunit/phpunit ^12.5.12`, `mockery/mockery ^1.6`,
  `nunomaduro/collision ^8.6`, `fakerphp/faker`, `laravel/pail`, `laravel/pao`, `laravel/pint`.
  **Pest is not in the base skeleton** — it comes from the installer's choice — so the content says
  "the installer offers it" rather than "it ships with it". `tests/Pest.php` does not exist in the
  skeleton repo either; the docs' `pest()->use(...)` form is what is quoted.
- `tests/TestCase.php` is now just `abstract class TestCase extends Illuminate\Foundation\Testing\TestCase`
  — the old `CreatesApplication` trait is gone.

### Laravel 13 additions used

- **`#[UnitTest]`** attribute — skips booting the application for one method inside a feature test
  class. Documented in Testing: Getting Started.
- **`WithCachedConfig`** trait — builds the configuration once and reuses it for the whole run
  (the docs state plainly that Laravel boots the application for each individual test method).
- **`#[Seed]` / `#[Seeder(...)]`** attributes for auto-seeding under `RefreshDatabase` (mentioned in
  the database topic's framing, not quizzed).
- `php artisan test --profile` lists the **ten slowest** tests; `--coverage --min=80.3`;
  `--parallel --processes=N`; `--recreate-databases`.

### Database traits (read from framework source, not docs prose)

- `RefreshDatabase::refreshTestDatabase()` runs `migrate:fresh` **only when
  `RefreshDatabaseState::$migrated` is false** — i.e. once per process — then calls
  `beginDatabaseTransaction()`. For `:memory:` connections it caches and restores the PDO handle so
  the database survives between tests. Docs wording: "does not migrate your database if your schema
  is up to date. Instead, it will only execute the test within a database transaction."
- `DatabaseMigrations::runDatabaseMigrations()` runs `migrate:fresh` **before every test** and
  registers a `migrate:rollback` on teardown, resetting `RefreshDatabaseState::$migrated`.
- `DatabaseTruncation` migrates on the first test, then truncates all tables except `migrations`;
  `$tablesToTruncate` customises it.
- **`Illuminate\Foundation\Testing\DatabaseTransactions` still exists in framework 13.x** (source
  fetched and read) but is **no longer named in the Laravel 13 database-testing docs**, which list
  `RefreshDatabase`, `DatabaseMigrations` and `DatabaseTruncation`. The content therefore explains
  it as "the transaction half on its own" without claiming it is the documented path.
- Dusk docs: transactions "will not be applicable or available across HTTP requests", and
  "SQLite in-memory databases may not be used when executing Dusk tests."

### Fakes (the milestone topic)

- Laravel 13 moved the per-subsystem fakes **out of the mocking page** and into each feature's own
  docs. `mocking` now covers only object mocking, facade mocking/spies and time. Hence the
  `queues#testing` / `http-client#testing` refs on `lv-test-fakes`.
- `Queue::fake()`: `assertPushed`, `assertPushedOnce`, `assertPushedTimes`, `assertPushedOn`,
  `assertNotPushed`, `assertNothingPushed`, `assertClosurePushed`, `assertCount`;
  `Queue::fake([Job::class])` and `Queue::fake()->except([...])` for subsets.
- **`Bus::fake()` is required for chains and batches** — `assertChained`, `assertBatched`,
  `assertDispatchedSync`, `assertDispatchedAfterResponse`, `assertDispatchedWithoutChain`
  (method list read from `BusFake`). `dispatchSync` goes through the dispatcher, not the queue, so
  `Queue::fake()` does not stop it.
- **`Mail::assertQueued` vs `assertSent`**: the docs say directly, "If you are queueing mailables
  for delivery in the background, you should use the `assertQueued` method instead of
  `assertSent`."
- **`Event::fake()` silences model observers.** Docs: "After calling `Event::fake()`, no event
  listeners will be executed. So, if your tests use model factories that rely on events, such as
  creating a UUID during a model's `creating` event, you should call `Event::fake()` after using
  your factories." Subsets via `Event::fake([...])` / `fakeFor`.
- `Notification::fake()`: `assertSentTo`, `assertNotSentTo`, `assertSentTimes`,
  `assertSentToOnce`, `assertCount`, `assertNothingSent`.
- **`Http::fake()` with no arguments returns an empty 200 for every request**, and — the important
  one — "Any requests made to URLs that have not been faked will actually be executed."
  `Http::preventStrayRequests()` turns that into an exception; `allowStrayRequests([...])` carves
  out exceptions; `Http::recorded()` returns request/response pairs.
- **`Storage::fake($disk)`** (read from `Support/Facades/Storage.php`): resolves the disk root,
  appends `_test_{token}` under parallel testing, calls `(new Filesystem)->cleanDirectory($root)`,
  then binds a local driver. `persistentFake()` skips the cleaning. `UploadedFile::fake()->image()`
  needs the GD extension.
- `$this->mock()` / `$this->partialMock()` / `$this->spy()` / `$this->instance()` bind into the
  container, so only container-resolved dependencies are replaced. Facades are mockable because
  they resolve through the container; the docs warn **not** to mock the `Request` or `Config`
  facades.

### Time

- `travel(n)->days()` etc., `travelTo($moment)`, `travelBack()`, `freezeTime()`, `freezeSecond()`;
  closure forms restore afterwards.
- **Teardown resets the clock**: `Concerns/InteractsWithTestCaseLifecycle::tearDownTheTestEnvironment()`
  calls `Carbon::setTestNow()` and `CarbonImmutable::setTestNow()` with no argument (and also runs
  `Mockery::close()`, adding Mockery's expectation count to the assertion count).
- Time travel is Carbon-only: PHP's `time()` and anything the database evaluates
  (`CURRENT_TIMESTAMP`) are unaffected. Used as the topic's main edge-case question.
- `Sleep::fake()` exists for code written against Laravel's `Sleep` class.

### HTTP tests

- `assertJson` is a **subset** assertion; `assertExactJson` is exact; `assertJsonPath` targets one
  value.
- `assertSee` / `assertSeeInOrder` / `assertSeeText` **escape the given value** unless a second
  argument of `false` is passed; `assertSeeText` additionally `strip_tags` the response.
- `assertInvalid` / `assertValid` work against **both** a JSON error body and session-flashed
  errors — which is why they are recommended over `assertSessionHasErrors`/`assertJsonValidationErrors`.
- `withoutExceptionHandling()` for the raw throw; `Exceptions::fake()` + `assertReported` /
  `assertNotReported` / `assertNothingReported` for asserting reporting while the app still renders
  its normal response.
- Confirmed by the brief and consistent with the docs: form-request `authorize()` false ⇒ **403**;
  validation failure ⇒ **422 JSON** when the request expects JSON, otherwise a redirect with a
  flashed error bag.
- Since Laravel 11 there is **no `app/Http/Kernel.php`** and the default **`api` group is
  `SubstituteBindings` only — no throttle** — which is the point of the rate-limiting question in
  `lv-test-validation-authorization`.

### Jobs, console, scheduling

- `withFakeQueueInteractions()` → `assertReleased(delay: 30)`, `assertDeleted()`,
  `assertNotDeleted()`, `assertFailed()`, `assertFailedWith(Exception::class)`, `assertNotFailed()`.
- `withFakeBatch()` returns `[$job, $batch]`.
- Console: `expectsQuestion`, `expectsSearch`, `expectsOutput`, `doesntExpectOutput`,
  `expectsOutputToContain`, `doesntExpectOutputToContain`, `assertExitCode`, `assertNotExitCode`,
  `assertSuccessful`, `assertFailed`.
- **`schedule:test` exists** in framework 13.x (`Console/Scheduling/ScheduleTestCommand.php`,
  signature `schedule:test {--name=}`, description "Run a scheduled command") — but it is a manual
  run-one-now tool, not an assertion API, and the **Laravel 13 scheduling docs contain no testing
  section**. The content says exactly that rather than implying a scheduler assertion exists.

### Parallel testing and coverage

- Needs `brianium/paratest` as a dev dependency. Laravel creates and migrates one database per
  process, suffixed with the token (`your_db_test_1`, `your_db_test_2`); they persist between runs
  unless `--recreate-databases`.
- `ParallelTesting::setUpProcess` / `setUpTestCase` / `setUpTestDatabase` / `tearDownTestCase` /
  `tearDownProcess`, and `ParallelTesting::token()`.
- Coverage requires **Xdebug or PCOV** (stated in the docs as a warning box).

### Pest

- Pest compiles to PHPUnit test cases; `phpunit.xml`, PHPUnit CLI options and coverage drivers all
  still apply.
- Laravel 13 docs use the `pest()->use(TraitName::class)` form in their Pest tabs.
- **Pest browser testing is Playwright-based** (`composer require pestphp/pest-plugin-browser --dev`
  plus `npm install playwright`), uses `visit('/')`, supports `->on()->mobile()->firefox()`,
  `--debug` for headed runs, and screenshots under `tests/Browser/Screenshots`. Crucially, the Pest
  docs' own example uses `RefreshDatabase`, `Event::fake()` and `$this->assertAuthenticated()`
  **inside a browser test** — the plugin runs in the test process, which is the genuine
  Dusk-vs-Pest distinction and is the basis of that topic's question 5.
- Pest 5 exists (Nuno Maduro, Laracon US 2026) but no version-specific Pest claim is made in any
  quiz answer — the questions are about mechanisms, per the guide's advice.

## Judgement calls

1. **13 topics, one per brief bullet.** The brief's "mocking, fakes and the facade fakes" bullet is
   kept as a single milestone topic (12 questions) rather than split, because the tradeoff it
   teaches — what a fake costs you — is one idea, and splitting it would have pushed the camp to 14.
2. `Http::fake()` lives in the fakes topic rather than a separate outbound-HTTP topic, since it is
   a facade fake with the same cost model as the others.
3. Coverage/parallel/speed is kept as its own topic rather than folded into the database topic,
   because the brief names it and because the coverage-as-a-metric argument is a judgement lesson,
   not a performance one.
4. `lv-test-what-to-test` is `expert` and a milestone. It is the only topic in the camp with no
   API surface at all, which is the point.
5. No content shows `app/Http/Kernel.php`, and the rate-limiting question exists specifically to
   catch learners carrying a pre-Laravel-11 mental model.
