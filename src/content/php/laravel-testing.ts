import type { Module } from "@/types/curriculum";

export default {
  id: "laravel-testing",
  trackId: "php",
  name: "Testing with Pest & PHPUnit",
  description:
    "How a Laravel application is actually tested: the two syntaxes and the one runner underneath, the test environment, HTTP and database tests, the facade fakes, time control, and the judgement call about what is worth testing at all.",
  refs: [
    { label: "Laravel: Testing — Getting Started", url: "https://laravel.com/framework/docs/13.x/testing", kind: "docs" },
    { label: "Pest: Writing Tests", url: "https://pestphp.com/docs/writing-tests", kind: "docs" },
    { label: "PHPUnit: Writing Tests", url: "https://docs.phpunit.de/en/12.5/writing-tests-for-phpunit.html", kind: "docs" },
    { label: "Martin Fowler: Mocks Aren't Stubs", url: "https://martinfowler.com/articles/mocksArentStubs.html", kind: "article" },
  ],
  topics: [
    {
      id: "lv-test-pest-phpunit",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "Pest and PHPUnit: Two Front Ends, One Runner",
      summary:
        "Pest is not a competing test runner. It is a layer on top of PHPUnit: `test()` and `it()` compile down to PHPUnit test cases, `expect()` is a fluent wrapper over PHPUnit assertions, and the run is still a PHPUnit run — same `phpunit.xml`, same `--filter`, same coverage drivers, same paratest. \"Pest or PHPUnit\" is therefore a question about how you want to write tests, not about what executes them.\n\nLaravel's current documentation leads with Pest and the installer offers it when you scaffold an app, because the closure style removes a lot of ceremony: no class, no namespace, no method name that has to double as a sentence. The costs are real though. Static analysers, refactoring tools and IDEs reason about classes and methods more reliably than about closures; a team with several thousand class-based tests has no reason to convert them; and inheritance-based shared setup maps more naturally onto PHPUnit's structure. Both styles run side by side in the same suite, so this is rarely an all-or-nothing decision.\n\nThe detail that trips people up is `$this`. Inside a Pest closure, `$this` is the underlying TestCase instance — and *which* TestCase depends on what `tests/Pest.php` binds to that directory. A test that calls `$this->get('/')` from a directory that was never bound to `Tests\\TestCase` fails with an undefined method, which looks like a Pest bug and is really a configuration one.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Testing — Getting Started", url: "https://laravel.com/framework/docs/13.x/testing", kind: "docs" },
        { label: "Pest: Writing Tests", url: "https://pestphp.com/docs/writing-tests", kind: "docs" },
        { label: "Pest: Migrating from PHPUnit", url: "https://pestphp.com/docs/migrating-from-phpunit-guide", kind: "docs" },
        { label: "Pest: Configuring Tests (Pest.php)", url: "https://pestphp.com/docs/configuring-tests", kind: "docs" },
      ],
      video: {
        title: "Laravel Testing 21/24: What is PEST and How It Works",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=4ubp_IF6kqY",
        videoId: "4ubp_IF6kqY",
        durationLabel: "13:40",
      },
      alternateVideos: [
        {
          title: "Introducing Pest 5 | Nuno Maduro at Laracon US 2026",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=71bMyZcDlM4",
          videoId: "71bMyZcDlM4",
          durationLabel: "26:21",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-pest-phpunit-q1",
          prompt: "Architecturally, what is Pest?",
          options: [
            "A layer on top of PHPUnit — Pest tests become PHPUnit test cases and PHPUnit executes them",
            "A complete replacement runner that reimplements PHPUnit from scratch",
            "A Laravel-only package that cannot be used in a plain PHP project",
            "A static analysis tool that generates PHPUnit test classes from your code",
          ],
          correctIndex: 0,
          explanation:
            "Pest wraps PHPUnit rather than replacing it, which is why `phpunit.xml`, PHPUnit CLI options and coverage drivers all keep working. It is also not Laravel-specific — it runs in any PHP project.",
        },
        {
          id: "lv-test-pest-phpunit-q2",
          prompt: "What does `php artisan test` do?",
          options: [
            "Runs Pest or PHPUnit underneath and wraps the output in Collision's reporter, forwarding any options you pass",
            "Runs its own test runner that is independent of PHPUnit",
            "Runs only the tests in `tests/Feature`",
            "Compiles the test suite to a standalone binary and executes it",
          ],
          correctIndex: 0,
          explanation:
            "It is a wrapper: `php artisan test --testsuite=Feature --stop-on-failure` passes those flags straight through. `vendor/bin/pest` and `vendor/bin/phpunit` run exactly the same tests with plainer output.",
        },
        {
          id: "lv-test-pest-phpunit-q3",
          prompt: "You add Pest to a project that already has hundreds of PHPUnit test classes. Which statements are true? (Select all that apply.)",
          options: [
            "The existing PHPUnit classes keep running unchanged, alongside the new Pest files",
            "PHPUnit CLI options such as `--filter` still apply to the whole run",
            "Coverage still requires Xdebug or PCOV, exactly as before",
            "Every existing test must be converted before Pest will run at all",
            "`phpunit.xml` is ignored once Pest is installed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Because Pest runs on PHPUnit, the two styles coexist and the existing configuration is still read. Nothing has to be converted, and coverage is still provided by a PHP extension, not by the test framework.",
        },
        {
          id: "lv-test-pest-phpunit-q4",
          prompt: "Inside `test('it works', function () { ... })`, what is `$this`?",
          options: [
            "The underlying TestCase instance, so framework helpers are available when that directory is bound to a Laravel TestCase",
            "`null` — Pest closures are static and have no bound object",
            "The Pest expectation object returned by `expect()`",
            "The service container instance",
          ],
          correctIndex: 0,
          explanation:
            "Pest binds each closure to the test case it generates, which is how `$this->get()`, `$this->assertDatabaseHas()` and `$this->mock()` work. Which test case that is comes from the bindings in `tests/Pest.php`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-pest-phpunit-q5",
          prompt: "How do Pest expectations relate to PHPUnit assertions?",
          options: [
            "Expectations are a fluent API over assertions — a failed expectation fails the test exactly as a failed assertion would",
            "Expectations are non-fatal: they record a warning and the test continues",
            "Expectations only work inside `it()` blocks, not `test()` blocks",
            "Expectations run in a separate pass before the assertions",
          ],
          correctIndex: 0,
          explanation:
            "`expect($x)->toBe(1)` ends up calling the same PHPUnit assertion machinery as `assertSame(1, $x)`. There is no separate pass and no softer failure mode.",
        },
        {
          id: "lv-test-pest-phpunit-q6",
          prompt:
            "A Pest file in `tests/Unit` calls `$this->get('/health')` and fails with a call to an undefined method. What is the most likely cause?",
          options: [
            "That directory is not bound to `Tests\\TestCase`, so the test extends PHPUnit's bare test case and the application was never booted",
            "HTTP requests are not allowed from Pest tests",
            "The `/health` route does not exist, and Pest reports that as an undefined method",
            "`get()` was renamed to `getJson()` in Laravel 13",
          ],
          correctIndex: 0,
          explanation:
            "HTTP helpers live on Laravel's test case. Unit test files are deliberately left on PHPUnit's plain TestCase so they cannot reach the framework — which is the whole point of that directory.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-pest-phpunit-q7",
          prompt: "Why do Laravel's docs show Pest examples first?",
          options: [
            "It is the style the installer offers when scaffolding a new app and it reads with less ceremony; PHPUnit remains fully supported",
            "PHPUnit support is deprecated in Laravel 13 and will be removed",
            "PHPUnit cannot make assertions against HTTP responses",
            "`php artisan test` only works when Pest is installed",
          ],
          correctIndex: 0,
          explanation:
            "Every documentation page shows both tabs. PHPUnit is still the engine and still a first-class way to write Laravel tests — the application skeleton's `require-dev` lists PHPUnit, and Pest is added on top when you choose it.",
        },
        {
          id: "lv-test-pest-phpunit-q8",
          prompt: "What is the difference between `it('returns a 404', ...)` and `test('returns a 404', ...)`?",
          options: [
            "They are aliases; `it` simply prefixes the description with \"it\" in the output",
            "`it` is reserved for unit tests and `test` for feature tests",
            "`it` runs the test in an isolated process",
            "`test` is deprecated in favour of `it`",
          ],
          correctIndex: 0,
          explanation:
            "The only difference is how the description reads in the report. Neither changes isolation, scope or which test case is used.",
        },
        {
          id: "lv-test-pest-phpunit-q9",
          prompt: "Why might a team deliberately keep writing class-based PHPUnit tests? (Select all that apply.)",
          options: [
            "Refactoring tools and static analysers reason about classes and methods more reliably than about closures",
            "They already have a large suite whose structure and base classes work",
            "Shared setup via inheritance maps naturally onto how their tests are organised",
            "PHPUnit runs measurably faster than Pest on the same tests",
            "Pest cannot run in a CI pipeline",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The real reasons are tooling and existing structure. Speed is not one of them — Pest delegates execution to PHPUnit — and Pest runs in CI like any other Composer-installed binary.",
        },
        {
          id: "lv-test-pest-phpunit-q10",
          prompt: "In a Pest suite, where does a shared trait such as `RefreshDatabase` normally get applied?",
          options: [
            "In `tests/Pest.php`, bound to a directory with `pest()->use(...)` / `uses(...)`, or per file at the top of the test",
            "In `phpunit.xml`, under the `<php>` block",
            "It cannot be used from Pest — traits require a test class",
            "Automatically, for every test that touches the database",
          ],
          correctIndex: 0,
          explanation:
            "Pest applies traits through its configuration file, scoped to a directory, or per file. Nothing is applied automatically, which is exactly why a stray test can end up with no database reset at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "lv-test-environment",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "The Test Environment and `php artisan test`",
      summary:
        "A Laravel test run is not your development environment with a different database. The `<php><env>` block in `phpunit.xml` rewrites the application's configuration before anything boots: `APP_ENV=testing`, `DB_CONNECTION=sqlite` with `DB_DATABASE=:memory:`, `CACHE_STORE=array`, `SESSION_DRIVER=array`, `MAIL_MAILER=array`, `QUEUE_CONNECTION=sync`, `BCRYPT_ROUNDS=4`. Every one of those is a deliberate trade, and two of them change what your tests mean: with a `sync` queue a dispatched job runs inline inside the test, and with the `array` mailer a \"sent\" email is collected in memory and never leaves the process.\n\n`.env.testing` is the second lever: when it exists it is used instead of `.env` for test runs, which is how you point a suite at a real MySQL or Postgres instance rather than SQLite. The classic failure is a cached configuration file — if `config:cache` has run, the cached array wins and your careful `phpunit.xml` edits do nothing until `config:clear`.\n\nLaravel boots the whole application for each test method, so boot cost is multiplied by your test count. `php artisan test` is a thin wrapper over the underlying runner: it forwards every PHPUnit/Pest flag and adds `--parallel`, `--coverage` and `--profile` on top. `--profile` lists the ten slowest tests and is usually the fastest way to find out why a suite that used to take 40 seconds now takes four minutes.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Testing — Environment", url: "https://laravel.com/framework/docs/13.x/testing#environment", kind: "docs" },
        { label: "Laravel: Configuration", url: "https://laravel.com/framework/docs/13.x/configuration", kind: "docs" },
        { label: "PHPUnit: The XML Configuration File", url: "https://docs.phpunit.de/en/12.5/configuration.html", kind: "docs" },
      ],
      video: {
        title: "Laravel Testing Crash Course: From Zero to Pest v4",
        channel: "The Codeholic",
        url: "https://www.youtube.com/watch?v=qfN-rJ-K5WI",
        videoId: "qfN-rJ-K5WI",
        startSeconds: 1154,
        chapterLabel: "Configuration",
        durationLabel: "2:41:53",
      },
      alternateVideos: [
        {
          title: "Laravel Testing 04/24: Database Configuration: RefreshDatabase, Phpunit.xml and .env.testing",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=loA8bKZvSmw",
          videoId: "loA8bKZvSmw",
          durationLabel: "5:06",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-environment-q1",
          prompt: "In a default Laravel application, where does `APP_ENV=testing` come from during a test run?",
          options: [
            "The `<php><env>` block in `phpunit.xml`",
            "The `.env` file, which Laravel rewrites while tests run",
            "It is hard-coded in `bootstrap/app.php`",
            "Nowhere — you must pass `--env=testing` on every run",
          ],
          correctIndex: 0,
          explanation:
            "`phpunit.xml` sets the environment variables before the application boots, which is why the framework can promise that the session and cache use array drivers during tests.",
        },
        {
          id: "lv-test-environment-q2",
          prompt:
            "The shipped `phpunit.xml` sets `QUEUE_CONNECTION=sync`. A controller dispatches `ShipOrder` and the test does **not** call `Queue::fake()`. What happens?",
          options: [
            "The job runs inline during the request, inside the test — and an exception in the job fails the test",
            "The job is silently discarded because no worker is running",
            "The job is pushed onto the default Redis queue and left there",
            "The test fails immediately with \"no queue connection configured\"",
          ],
          correctIndex: 0,
          explanation:
            "`sync` executes jobs immediately in the dispatching process. That is often what you want in a feature test, but it means the job's runtime is part of your test's runtime and its failures are your test's failures.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-environment-q3",
          prompt: "`MAIL_MAILER=array` is the default in the test environment. Without `Mail::fake()`, what happens when the code sends an email?",
          options: [
            "The message is collected in memory and never delivered anywhere",
            "SMTP is contacted and the test fails when no server answers",
            "An exception is thrown because mail is disabled in testing",
            "The rendered message is written to `storage/logs/laravel.log`",
          ],
          correctIndex: 0,
          explanation:
            "The array transport keeps messages in memory. `Mail::fake()` goes further by swapping the whole mailer for a recorder with assertions — but even without it, no real mail escapes a default test run.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-environment-q4",
          prompt: "When is a `.env.testing` file used?",
          options: [
            "Instead of `.env`, when running Pest or PHPUnit, or when running an Artisan command with `--env=testing`",
            "Merged on top of `.env` for every command, in every environment",
            "Only by `php artisan test`, never by `vendor/bin/pest`",
            "Never — values in `phpunit.xml` make it redundant",
          ],
          correctIndex: 0,
          explanation:
            "It replaces `.env` rather than layering on it. Values in `phpunit.xml` are applied on top of whichever env file was loaded, which is how the SQLite default survives a `.env.testing` pointing at MySQL unless you override it there too.",
        },
        {
          id: "lv-test-environment-q5",
          prompt: "You changed a value in `phpunit.xml`, but the tests still see the old configuration. What is the most likely cause?",
          options: [
            "A cached configuration file is in place — run `config:clear` before the tests",
            "Env entries in `phpunit.xml` only apply to the Unit test suite",
            "Env entries need `force=\"true\"` before PHPUnit will set them at all",
            "PHP-FPM needs restarting for the change to be picked up",
          ],
          correctIndex: 0,
          explanation:
            "`config:cache` bakes the resolved config into one file that ignores the environment, and the Laravel testing docs call this out directly. PHP-FPM is irrelevant — the test runner is a CLI process.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-environment-q6",
          prompt: "Which of these defaults in the shipped `phpunit.xml` exist to make tests faster or more isolated? (Select all that apply.)",
          options: [
            "`BCRYPT_ROUNDS=4`",
            "`CACHE_STORE=array`",
            "`DB_DATABASE=:memory:`",
            "`APP_KEY` is regenerated before every test",
            "`APP_DEBUG=false`, so exceptions render as plain 500s",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Cheap hashing, an in-memory cache and an in-memory database are all there for speed and isolation. The application key is not regenerated, and `APP_DEBUG` is not part of the default block at all.",
        },
        {
          id: "lv-test-environment-q7",
          prompt: "What happens to the flags in `php artisan test --testsuite=Feature --stop-on-failure`?",
          options: [
            "They are forwarded to the underlying Pest/PHPUnit process",
            "Artisan rejects any flag it does not define itself",
            "Only Artisan-specific flags are honoured; the rest are dropped silently",
            "They apply only when `--parallel` is also given",
          ],
          correctIndex: 0,
          explanation:
            "The Artisan command exists for nicer output, not for a different feature set. Anything the runner accepts, you can pass through it.",
        },
        {
          id: "lv-test-environment-q8",
          prompt: "What does `php artisan test --profile` report?",
          options: [
            "The ten slowest tests in the run",
            "A line-by-line coverage report",
            "Every SQL query executed, grouped by test",
            "Peak memory usage per test class",
          ],
          correctIndex: 0,
          explanation:
            "It is a targeted tool for finding the handful of tests that dominate a slow suite, which is almost always a better first move than blanket optimisation.",
        },
        {
          id: "lv-test-environment-q9",
          prompt: "Laravel boots the application for each test method. What does the `WithCachedConfig` trait change about that?",
          options: [
            "The configuration is built once and reused for the whole run, instead of loading every config file for every test",
            "It caches the database schema so migrations only run once",
            "It skips booting service providers entirely",
            "It caches compiled routes between tests",
          ],
          correctIndex: 0,
          explanation:
            "Config loading is per-test overhead that produces an identical result every time, so caching it is safe and measurable. Migrating once per run is what `RefreshDatabase` already handles separately.",
        },
        {
          id: "lv-test-environment-q10",
          prompt: "Your suite runs on in-memory SQLite while production runs MySQL. Name a genuine consequence.",
          options: [
            "Behaviour can diverge — column typing, constraint enforcement, JSON and date functions and locking all differ from the production engine",
            "Migrations cannot run at all against SQLite",
            "Transactions are unavailable, so `RefreshDatabase` cannot work",
            "Foreign key behaviour is guaranteed identical, so only performance differs",
          ],
          correctIndex: 0,
          explanation:
            "SQLite is fast and disposable, which is why it is the default — but it is a different engine. A suite that must prove production SQL behaviour should point `.env.testing` at the real engine and accept the slower run.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "lv-test-unit-vs-feature",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "Unit Tests and Feature Tests, Laravel's Sense of the Words",
      summary:
        "Laravel gives \"unit test\" a very specific, local meaning: a test in `tests/Unit` does not boot the application. No container, no config, no database, no facades. A feature test boots the whole thing and usually drives a real request through the kernel. The split is about what is *available*, not about how many classes are involved — which is why it does not line up neatly with the classical test-pyramid definition, and why arguments about it go in circles.\n\nLaravel's own documentation takes a clear position: most of your tests should be feature tests, because they give the most confidence that the system works. That is not laziness. In a framework application most defects live in the wiring — a route bound to the wrong middleware, a validation rule that never fires, a policy that is never consulted, a cast that mangles a value on the way out — and none of that is reachable from a test that refuses to boot the framework.\n\nThe practical trap is a test in `tests/Unit` that calls `User::factory()->create()` and passes. That only works because something bound that directory to Laravel's test case, so it is a feature test wearing the wrong label: paying the full boot cost while claiming to be cheap. Laravel 13 offers the opposite escape hatch — the `#[UnitTest]` attribute marks one method inside a feature test class so the application is not booted for that method alone.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Testing — Getting Started", url: "https://laravel.com/framework/docs/13.x/testing", kind: "docs" },
        { label: "Martin Fowler: UnitTest", url: "https://martinfowler.com/bliki/UnitTest.html", kind: "article" },
        { label: "Kent C. Dodds: Write tests. Not too many. Mostly integration.", url: "https://kentcdodds.com/blog/write-tests", kind: "article" },
      ],
      video: {
        title: "Laravel Feature or Unit Tests: The Difference",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=0bVlUy2L9tM",
        videoId: "0bVlUy2L9tM",
        durationLabel: "9:47",
      },
      alternateVideos: [
        {
          title: "Testing in Laravel - All you need to know",
          channel: "Acadea.io",
          url: "https://www.youtube.com/watch?v=-4RRo6CTUgA",
          videoId: "-4RRo6CTUgA",
          startSeconds: 2,
          chapterLabel: "Ep22 - Unit Test vs Feature Test vs E2E Test",
          durationLabel: "57:46",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-unit-vs-feature-q1",
          prompt: "In a default Laravel application, what actually distinguishes `tests/Unit` from `tests/Feature`?",
          options: [
            "Unit tests do not boot the application, so the container, configuration and database are unavailable",
            "Unit tests may not use assertions from the framework's assertion library",
            "Each unit test runs in its own PHP process",
            "Unit tests are excluded from `php artisan test` unless you pass `--testsuite=Unit`",
          ],
          correctIndex: 0,
          explanation:
            "The directories differ in which test case they extend and therefore whether the framework is booted. Both suites run by default; `--testsuite` merely lets you pick one.",
        },
        {
          id: "lv-test-unit-vs-feature-q2",
          prompt: "A test in `tests/Unit` calls `User::factory()->create()` and passes. What does that tell you?",
          options: [
            "That directory has been bound to Laravel's test case, so the app is booted and it is not a unit test in Laravel's sense",
            "Factories work without the framework, because they only build arrays",
            "Eloquent falls back to a static in-memory connection when no application is booted",
            "The test is being skipped silently",
          ],
          correctIndex: 0,
          explanation:
            "Creating a model needs a container, a config, a connection and a migrated schema. If it works, the application booted — so the test pays feature-test cost while sitting in the cheap-looking directory.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-unit-vs-feature-q3",
          prompt: "What balance does Laravel's documentation explicitly recommend?",
          options: [
            "Most tests should be feature tests, because they give the most confidence that the system as a whole works",
            "Most tests should be unit tests, following the classical test pyramid",
            "Only browser tests genuinely prove anything",
            "Exactly one test class per application class",
          ],
          correctIndex: 0,
          explanation:
            "The testing chapter says so in as many words. It reflects where framework-application bugs actually live: in the wiring between pieces rather than inside a single method.",
        },
        {
          id: "lv-test-unit-vs-feature-q4",
          prompt: "Which of these are genuine unit-test candidates — testable with no framework booted? (Select all that apply.)",
          options: [
            "A money value object's rounding and currency rules",
            "A pure function that converts an amount using an injected exchange rate",
            "A parser that turns a CSV row into a data transfer object",
            "A controller action that redirects with a flash message",
            "An Eloquent scope that adds constraints to a query builder",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three depend on nothing but their inputs. A controller needs a request, a response and usually middleware; an Eloquent scope needs a booted model and a connection before an assertion means anything.",
        },
        {
          id: "lv-test-unit-vs-feature-q5",
          prompt: "What does Laravel 13's `#[UnitTest]` attribute do?",
          options: [
            "Marks a single test method inside a feature test class so the application is not booted for that method",
            "Moves the generated test file into `tests/Unit` when it runs",
            "Declares that the method under test is a pure function",
            "Disables database access for the whole test class",
          ],
          correctIndex: 0,
          explanation:
            "It is a per-method escape hatch: keep a test next to its siblings but skip the boot cost when that particular test genuinely does not need the framework.",
        },
        {
          id: "lv-test-unit-vs-feature-q6",
          prompt:
            "Why is a suite that is mostly isolated unit tests around mocked collaborators often *less* useful than a smaller set of feature tests?",
          options: [
            "Mocks encode your assumptions about collaborators; when those assumptions are wrong, the tests still pass while production breaks",
            "Unit tests are slower to execute than feature tests",
            "PHPUnit cannot assert against mock objects reliably",
            "Isolated tests cannot be run in continuous integration",
          ],
          correctIndex: 0,
          explanation:
            "Every mock is a second, untested specification of how a collaborator behaves. Integration points are exactly where the two specifications drift apart, and that is precisely what an isolated test cannot see.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-unit-vs-feature-q7",
          prompt: "What dominates the runtime of a typical Laravel feature test?",
          options: [
            "Booting the application for each test method, plus the database work the test performs",
            "Parsing and autoloading the test file",
            "The assertion library's comparison logic",
            "Composer's autoloader resolving a class per assertion",
          ],
          correctIndex: 0,
          explanation:
            "The framework is created fresh per test method. That cost is why `WithCachedConfig`, parallel runs and \"create only the rows you need\" all move the needle, and why the assertions never do.",
        },
        {
          id: "lv-test-unit-vs-feature-q8",
          prompt: "Where does `php artisan make:test UserTest --unit` put the generated file?",
          options: ["`tests/Unit`", "`tests/Feature`", "`tests/Browser`", "`app/Tests`"],
          correctIndex: 0,
          explanation:
            "Without `--unit` the default is `tests/Feature` — a small nudge towards the kind of test the framework's documentation recommends writing more of.",
        },
        {
          id: "lv-test-unit-vs-feature-q9",
          prompt: "Which statements about the two default test suites are true? (Select all that apply.)",
          options: [
            "They are declared in `phpunit.xml` and can be selected individually with `--testsuite`",
            "You can add suites of your own for, say, integration or browser tests",
            "The Unit/Feature split is a convention, not something the framework enforces",
            "Laravel refuses to run a test that lives outside those two directories",
            "The Unit suite always runs first and blocks the Feature suite if anything fails",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The suites are just directory globs in the configuration file. Nothing enforces the split and nothing gates one suite on another unless you asked for `--stop-on-failure`.",
        },
        {
          id: "lv-test-unit-vs-feature-q10",
          prompt: "You define your own `setUp()` in a Laravel test class. What must you not forget?",
          options: [
            "Call `parent::setUp()` first, otherwise the application is never created",
            "Nothing — Laravel calls the parent implementation for you",
            "Declare it `public static` so PHPUnit can find it",
            "Rename it to `setUpBeforeClass()`",
          ],
          correctIndex: 0,
          explanation:
            "The parent's `setUp` is what creates the application and applies traits such as `RefreshDatabase`. Skipping it produces confusing null-container errors that look nothing like the real cause.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "lv-test-http",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "HTTP Tests and Response Assertions",
      summary:
        "`$this->get('/orders')` does not open a socket. It builds an `Illuminate\\Http\\Request` and pushes it through the same HTTP kernel a real request goes through — global middleware, route resolution, route middleware, model binding, the controller, the response. That is why it is the highest-value test shape in a Laravel application: one call exercises all the wiring that a unit test around the controller class would skip.\n\nThe returned `TestResponse` is where the design decisions live. `assertJson()` checks that the array you gave is present *as a subset*, so a response that quietly grew or lost a sibling key still passes — use `assertExactJson()` when the contract matters and `assertJsonPath()` when one value does. `assertSee()` escapes the needle as HTML before searching, which is right for Blade output and surprising the first time you hit it. And `withoutExceptionHandling()` is the difference between \"expected 200, got 500\" and an actual stack trace.\n\nThe brittleness comes from asserting on the wrong things. A test that pins the literal redirect path breaks when someone renames a URL segment, even though the behaviour is unchanged; a test that asserts the exact flash sentence breaks on a copy edit. Prefer `assertRedirectToRoute()` over a hard-coded string, assert the state change you actually care about, and leave the prose to the designers.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel: HTTP Tests", url: "https://laravel.com/framework/docs/13.x/http-tests", kind: "docs" },
        { label: "Laravel: HTTP Tests — Available Assertions", url: "https://laravel.com/framework/docs/13.x/http-tests#available-assertions", kind: "docs" },
        { label: "Pest: Expectations", url: "https://pestphp.com/docs/expectations", kind: "docs" },
      ],
      video: {
        title: "Let's Build Task Tracker App With Laravel | Part 4: Testing, Mocking, Profile Page & Deployment",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=0DxZlKfO4QY",
        videoId: "0DxZlKfO4QY",
        startSeconds: 774,
        chapterLabel: "Test Anatomy & Writing Feature Tests",
        durationLabel: "2:21:17",
      },
      alternateVideos: [
        {
          title: "Testing in Laravel - All you need to know",
          channel: "Acadea.io",
          url: "https://www.youtube.com/watch?v=-4RRo6CTUgA",
          videoId: "-4RRo6CTUgA",
          startSeconds: 1156,
          chapterLabel: "Ep24 - Testing API routes | Feature Testing",
          durationLabel: "57:46",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-http-q1",
          prompt: "What actually happens when a feature test calls `$this->get('/orders')`?",
          options: [
            "A request object is built and dispatched through the HTTP kernel in the same process — middleware, routing and the controller all run",
            "An HTTP request is sent over the network to a development server the test runner started",
            "The route's closure or controller method is invoked directly, skipping middleware",
            "cURL is used to hit the URL configured in `APP_URL`",
          ],
          correctIndex: 0,
          explanation:
            "It is an in-process request through the real kernel, which is why middleware, model binding and exception rendering all apply. No server and no network are involved.",
        },
        {
          id: "lv-test-http-q2",
          prompt: "A test expects 200 and gets 500, and the failure message tells you nothing useful. What is the first move?",
          options: [
            "Add `$this->withoutExceptionHandling()` before the request so the underlying exception is thrown instead of rendered",
            "Set `APP_DEBUG=true` in `.env` and rerun",
            "Change the assertion to `assertStatus(500)` and investigate later",
            "Rerun with `--stop-on-failure` to get a stack trace",
          ],
          correctIndex: 0,
          explanation:
            "By default the exception handler converts the error into a response, which is what you are asserting against. Disabling it for that request surfaces the real exception and its stack trace.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-http-q3",
          prompt: "`$response->assertJson(['name' => 'Ada'])` passes. Does that mean the response body is exactly `{\"name\":\"Ada\"}`?",
          options: [
            "No — `assertJson` checks that the given array is present as a subset; use `assertExactJson` for an exact match",
            "Yes, `assertJson` is an exact structural comparison",
            "Only when the status code is 200; otherwise it is a subset check",
            "Only top-level keys are compared exactly; nested ones are a subset check",
          ],
          correctIndex: 0,
          explanation:
            "Subset matching is convenient and hides regressions: an API that starts leaking an extra field, or drops a sibling one, still passes. Decide deliberately between `assertJson`, `assertExactJson` and `assertJsonPath`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-http-q4",
          prompt: "What does `$response->assertSee($value)` do with `$value` before searching the response?",
          options: [
            "HTML-escapes it, unless you pass `false` as the second argument",
            "Strips HTML tags from it",
            "Lowercases it and collapses whitespace",
            "Nothing — it is a raw substring search",
          ],
          correctIndex: 0,
          explanation:
            "Escaping by default matches Blade's escaped output. `assertSeeText` additionally runs the *response* through `strip_tags` first, which is what you want for text that may be wrapped in markup.",
        },
        {
          id: "lv-test-http-q5",
          prompt:
            "A `store` action redirects to the new order. Which assertions survive a harmless URL or copy change better than `assertRedirect('/orders/5')`? (Select all that apply.)",
          options: [
            "`assertRedirectToRoute('orders.show', $order)`",
            "`assertRedirect(route('orders.show', $order))`",
            "`assertSessionHasNoErrors()` plus `assertDatabaseHas('orders', [...])` for the state that should have changed",
            "`assertSee('Order #5 created successfully!')`, matching the flash message word for word",
            "`assertRedirect('/orders/'.$order->id)`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Naming the route lets the URL change freely, and asserting the state change tests the behaviour rather than the plumbing. Hard-coding a path shape or a marketing sentence couples the test to things that are meant to change.",
        },
        {
          id: "lv-test-http-q6",
          prompt: "Which is the framework's helper for running a request as a given user?",
          options: [
            "`$this->actingAs($user)` — optionally with a guard name — before making the request",
            "Setting the session cookie manually on the request",
            "Calling `Auth::login($user)` inside the route being tested",
            "Posting credentials to `/login` at the start of every test",
          ],
          correctIndex: 0,
          explanation:
            "`actingAs` sets the authenticated user for the guard you name. Driving the real login form is worth doing once, in the test that covers logging in — not in every test that happens to need a user.",
        },
        {
          id: "lv-test-http-q7",
          prompt: "`$this->postJson('/orders', [])` hits an action whose form request validation fails. What comes back?",
          options: [
            "422, with the messages in a JSON `errors` object",
            "302, redirecting back with the errors flashed to the session",
            "403, because the request was rejected",
            "500, because the exception was not handled",
          ],
          correctIndex: 0,
          explanation:
            "Laravel picks the response shape from what the request expects. A JSON request gets 422 with `errors`; the same endpoint hit as a normal form post gets a redirect instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-http-q8",
          prompt: "The same endpoint, same invalid payload, but hit with `$this->post(...)` from a normal form submission. What comes back?",
          options: [
            "A 302 redirect back, with the errors flashed to the session",
            "422 JSON, because the response shape does not depend on the request",
            "200 with an empty body",
            "419, because the CSRF token is missing",
          ],
          correctIndex: 0,
          explanation:
            "This is the pair to the previous question, and the reason people write a test that passes for JSON and fails for HTML. CSRF is not the issue: middleware that verifies request forgery is disabled for tests.",
        },
        {
          id: "lv-test-http-q9",
          prompt: "Which single assertion works for both of those response shapes?",
          options: [
            "`assertInvalid(['email'])`, which understands both a JSON error body and errors flashed to the session",
            "`assertSessionHasErrors(['email'])`, which also inspects JSON bodies",
            "`assertJsonValidationErrors(['email'])`, which falls back to the session",
            "`assertStatus(422)`, which Laravel normalises for redirects",
          ],
          correctIndex: 0,
          explanation:
            "`assertInvalid` and `assertValid` are deliberately shape-agnostic, so the same validation test reads the same whether the endpoint serves a form or an API.",
        },
        {
          id: "lv-test-http-q10",
          prompt: "Which statements about `$this->get()` in a feature test are true? (Select all that apply.)",
          options: [
            "Route middleware runs, including auth and any throttle the route actually has applied",
            "For a view response, the test response exposes the view name and the data it was given",
            "Assertions can be chained, because each one returns the test response",
            "The request travels over the network to a running web server",
            "Sessions are unavailable, because there is no browser",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Everything short of the network is real: middleware, sessions, views and all. That is exactly why feature tests catch the wiring bugs that unit tests around a controller cannot.",
        },
        {
          id: "lv-test-http-q11",
          prompt: "What is `Exceptions::fake()` for?",
          options: [
            "Asserting that an exception was reported during a request, while the application still renders its normal response",
            "Disabling exception handling so the exception propagates to the test",
            "Faking the handler so that exceptions never fail a test",
            "Recording PHP deprecation notices raised during the request",
          ],
          correctIndex: 0,
          explanation:
            "It fakes the *reporting* side, so you can assert \"this was logged\" alongside \"the user still got a friendly 500\". `withoutExceptionHandling()` is the opposite tool: it removes the rendering so you see the raw throw.",
        },
      ],
    },

    {
      id: "lv-test-database",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "Resetting the Database: Refresh, Transactions, Migrations, Truncation",
      summary:
        "`RefreshDatabase` is the default for a reason, and its cost model is worth knowing exactly. It runs `migrate:fresh` **once per test process** — guarded by a static flag — and then wraps each individual test in a database transaction that is rolled back at teardown. With in-memory SQLite it also keeps the same PDO handle alive between tests, because closing it would destroy the database. So the migration cost is paid once; the per-test cost is a `BEGIN` and a `ROLLBACK`.\n\nThe siblings trade differently. `DatabaseTransactions` does only the transaction half and never migrates, which is what you want when the schema is already there — say a suite pointed at a persistent MySQL database. `DatabaseMigrations` runs `migrate:fresh` before **every** test and rolls back after, which is correct and dramatically slower. `DatabaseTruncation` migrates on the first test and then truncates every table except `migrations` between tests: slower than a rollback, but it works when a transaction cannot span the code under test.\n\nThat last case is where the real gotchas live. A transaction that is never committed means `afterCommit` jobs and `ShouldDispatchAfterCommit` events never fire, so a feature that works in production is invisible in tests. Application code that calls `DB::commit()` can end the test's own transaction early and leak rows into later tests. And a browser test drives the application from another process, which cannot see anything inside your uncommitted transaction at all — which is why Dusk documents migrations and truncation rather than `RefreshDatabase`.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel: Database Testing", url: "https://laravel.com/framework/docs/13.x/database-testing", kind: "docs" },
        { label: "Laravel: Database Testing — Resetting the Database", url: "https://laravel.com/framework/docs/13.x/database-testing#resetting-the-database-after-each-test", kind: "docs" },
        { label: "Laravel: Dusk — Database Migrations", url: "https://laravel.com/framework/docs/13.x/dusk#resetting-the-database-after-each-test", kind: "docs" },
        { label: "Pest: Optimizing Tests", url: "https://pestphp.com/docs/optimizing-tests", kind: "docs" },
      ],
      video: {
        title: "Laravel Testing Crash Course: From Zero to Pest v4",
        channel: "The Codeholic",
        url: "https://www.youtube.com/watch?v=qfN-rJ-K5WI",
        videoId: "qfN-rJ-K5WI",
        startSeconds: 4568,
        chapterLabel: "Database Testing",
        durationLabel: "2:41:53",
      },
      alternateVideos: [
        {
          title: "Let's Build Task Tracker App With Laravel | Part 4: Testing, Mocking, Profile Page & Deployment",
          channel: "Program With Gio",
          url: "https://www.youtube.com/watch?v=0DxZlKfO4QY",
          videoId: "0DxZlKfO4QY",
          startSeconds: 1189,
          chapterLabel: "Resetting Database & Running Tests",
          durationLabel: "2:21:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-database-q1",
          prompt: "How often does `RefreshDatabase` run migrations?",
          options: [
            "Once per test process — after that, each test runs inside a transaction that is rolled back",
            "Before every test method",
            "Never; it assumes the schema already exists",
            "Once per test class",
          ],
          correctIndex: 0,
          explanation:
            "A static flag guards the `migrate:fresh` call, so the migration cost is paid once per process. The per-test work is just a transaction, which is why this trait is both safe and fast.",
        },
        {
          id: "lv-test-database-q2",
          prompt: "What does `DatabaseTransactions` do that `RefreshDatabase` does not?",
          options: [
            "Nothing extra — it only wraps each test in a transaction and never migrates, so it assumes the schema already exists",
            "It truncates every table between tests as well as rolling back",
            "It re-seeds reference data between tests",
            "It replays migrations in reverse after the suite",
          ],
          correctIndex: 0,
          explanation:
            "It is the transaction half on its own. That is useful against a persistent, already-migrated database, and dangerous if the schema has drifted from your migrations — nothing will tell you.",
        },
        {
          id: "lv-test-database-q3",
          prompt: "What does `DatabaseMigrations` do?",
          options: [
            "Runs `migrate:fresh` before each test and rolls back afterwards — correct, and the slowest of the options",
            "Runs migrations once and then relies on transactions",
            "Runs only the migrations that have not been applied yet",
            "It is an alias for `RefreshDatabase` kept for backwards compatibility",
          ],
          correctIndex: 0,
          explanation:
            "Dropping and recreating every table per test is thorough and expensive. It exists for the cases — browser tests especially — where a rollback cannot do the job.",
        },
        {
          id: "lv-test-database-q4",
          prompt:
            "A job is dispatched with `->afterCommit()`. Under `RefreshDatabase`, the test never sees it. Why?",
          options: [
            "The test's surrounding transaction is never committed, so after-commit callbacks never fire",
            "Because the queue connection is `sync` in the test environment",
            "Because `RefreshDatabase` implies `Queue::fake()`",
            "Because SQLite does not support transactions, so the callback is skipped",
          ],
          correctIndex: 0,
          explanation:
            "Everything the test does happens inside one open transaction that is rolled back. Anything keyed on a real commit — after-commit jobs, `ShouldDispatchAfterCommit` events — is therefore invisible unless you arrange a commit or test that piece separately.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-database-q5",
          prompt: "The code under test issues its own `DB::commit()` (or raw `COMMIT`). What happens under a transaction-based trait?",
          options: [
            "The test's outer transaction can be ended early, so the rollback no longer cleans up and rows leak into later tests",
            "Nothing — Laravel intercepts and ignores commits during tests",
            "The test is automatically skipped",
            "SQLite raises a deadlock and the run aborts",
          ],
          correctIndex: 0,
          explanation:
            "Laravel tracks transaction levels, but code that commits outside that model breaks the containment the trait relies on. The symptom is a test that only fails when run after some other test.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-database-q6",
          prompt: "Why can a Dusk browser test not use `RefreshDatabase`?",
          options: [
            "The browser hits the application in a separate process, which cannot see data inside the test's uncommitted transaction",
            "Dusk does not support SQLite at all, and `RefreshDatabase` is SQLite-only",
            "Dusk runs migrations itself and the two would conflict",
            "`RefreshDatabase` is a Pest-only trait",
          ],
          correctIndex: 0,
          explanation:
            "Transactions are per-connection. The Dusk docs say exactly this and point you at `DatabaseMigrations` or `DatabaseTruncation` instead — and they also rule out in-memory SQLite for the same reason.",
        },
        {
          id: "lv-test-database-q7",
          prompt: "What does `DatabaseTruncation` do?",
          options: [
            "Migrates on the first test, then truncates the tables (leaving `migrations` alone) between tests",
            "Drops and recreates the whole database between tests",
            "Rolls back a transaction, exactly like `DatabaseTransactions`",
            "Deletes only the rows created through factories",
          ],
          correctIndex: 0,
          explanation:
            "Truncating is cheaper than re-running every migration and works across processes, which makes it the usual choice for browser tests against a persistent engine.",
        },
        {
          id: "lv-test-database-q8",
          prompt: "Which of these genuinely make a database-backed suite faster? (Select all that apply.)",
          options: [
            "Running with `--parallel`, so each process gets its own test database",
            "Keeping the test database in memory or on a RAM-backed filesystem where the engine allows it",
            "Creating only the rows a test needs, instead of seeding everything up front",
            "Switching every test to `DatabaseMigrations` for consistency",
            "Adding a short `sleep()` between tests to let the database settle",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Parallelism, cheaper storage and less data are the three levers. `DatabaseMigrations` moves the cost in the wrong direction, and sleeping does nothing but make the suite slower.",
        },
        {
          id: "lv-test-database-q9",
          prompt: "A test that uses no database trait at all creates rows. What happens to them?",
          options: [
            "They persist — nothing wraps or resets that test — and later tests can see them",
            "They are rolled back when the suite finishes",
            "Laravel refuses to write to the database without a reset trait",
            "They are written to a separate schema that is discarded",
          ],
          correctIndex: 0,
          explanation:
            "The Laravel docs warn about this directly: records added by tests that do not use the trait may still exist. It produces order-dependent failures that are miserable to track down.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-database-q10",
          prompt: "What is `$this->assertDatabaseHas('orders', ['status' => 'paid'])` actually doing?",
          options: [
            "Running a query against the test connection with those constraints and asserting at least one row matches",
            "Comparing the in-memory state of loaded Eloquent models",
            "Inspecting the query log for a matching insert statement",
            "Reading the model's `$attributes` array after `save()`",
          ],
          correctIndex: 0,
          explanation:
            "It queries the database, which is why it catches a model that was never persisted, a mutator that rewrote the value, and a column that was silently truncated — none of which an in-memory check would notice.",
        },
        {
          id: "lv-test-database-q11",
          prompt: "Which are real risks of testing on SQLite when production runs MySQL or Postgres? (Select all that apply.)",
          options: [
            "Type affinity means a column can accept values the production engine would reject",
            "Vendor-specific SQL in a raw query or a migration may not run at all",
            "JSON, regular-expression and date functions differ between the engines",
            "Eloquent relationships resolve differently on SQLite",
            "Migrations execute in a different order on SQLite",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The divergences are all at the SQL layer. Eloquent's relationship logic and the migration order are framework-side and identical everywhere.",
        },
      ],
    },

    {
      id: "lv-test-factories",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "Factories and States in Tests",
      summary:
        "A factory exists so a test can say only what matters. `Order::factory()->create(['total' => 0])` reads as \"an order whose total is zero\"; everything else is noise the factory fills in. The moment a test starts setting fifteen columns by hand, the reader can no longer tell which of them the assertion depends on.\n\nStates are the second half of that idea: `->suspended()`, `->unverified()`, `->trashed()` name a meaningful variation once, so tests express intent instead of raw column values, and a change to what \"suspended\" means happens in one place. Relationships work the same way — `->for($user)` for the parent side, `->has(Comment::factory()->count(3))` for the child side, `recycle()` to make a whole graph share one tenant instead of creating a new one at every level.\n\nThe costs are easy to miss. A factory definition that eagerly creates an address, a subscription and three orders makes every test in the suite pay for them. `make()` instead of `create()` is free when the test never queries. And never assert on a value the factory made up: Faker output varies per run, so a passing assertion on a default is either a coincidence or a test of Faker. Assert on values your test set explicitly.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Eloquent Factories", url: "https://laravel.com/framework/docs/13.x/eloquent-factories", kind: "docs" },
        { label: "Laravel: Eloquent Factories — Factory States", url: "https://laravel.com/framework/docs/13.x/eloquent-factories#factory-states", kind: "docs" },
        { label: "Laravel: Database Testing — Model Factories", url: "https://laravel.com/framework/docs/13.x/database-testing#model-factories", kind: "docs" },
      ],
      video: {
        title: "Let's Build Task Tracker App With Laravel | Part 4: Testing, Mocking, Profile Page & Deployment",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=0DxZlKfO4QY",
        videoId: "0DxZlKfO4QY",
        startSeconds: 3319,
        chapterLabel: "Factory States",
        durationLabel: "2:21:17",
      },
      alternateVideos: [
        {
          title: "Laravel Testing 08/24: Factories: create many testing records",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=G4c6EPQ7c7A",
          videoId: "G4c6EPQ7c7A",
          durationLabel: "4:55",
        },
        {
          title: "Laravel Testing: Two Tips - Assert Collections and Factory States",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=McrdcQ09OxI",
          videoId: "McrdcQ09OxI",
          durationLabel: "5:20",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-factories-q1",
          prompt: "What is the difference between `User::factory()->make()` and `User::factory()->create()`?",
          options: [
            "`make()` builds the model in memory only; `create()` also persists it to the database",
            "`make()` persists the model and `create()` only builds it",
            "They are aliases — `create()` is the older name",
            "`make()` returns an array of attributes rather than a model",
          ],
          correctIndex: 0,
          explanation:
            "`make()` is free of database round-trips, which matters when a test only needs an object to pass into something. Anything the test will query for afterwards has to be `create()`d.",
        },
        {
          id: "lv-test-factories-q2",
          prompt: "What is a factory *state* for?",
          options: [
            "Naming a reusable, meaningful variation — `->suspended()`, `->unverified()` — so tests express intent instead of raw column values",
            "Caching factory output so repeated calls are cheaper",
            "Choosing which database connection the factory writes to",
            "Declaring the table name when it does not follow the convention",
          ],
          correctIndex: 0,
          explanation:
            "A state gives a name to a business condition and puts its definition in one place. When \"suspended\" grows a second column, every test that used the state keeps working.",
        },
        {
          id: "lv-test-factories-q3",
          prompt: "Why is asserting on a factory's *default* attribute value a bad idea?",
          options: [
            "Defaults usually come from Faker and vary per run — assert on values your test set explicitly",
            "Defaults are not persisted by `create()`, only by `make()`",
            "Factories skip defaults whenever any attribute is overridden",
            "Faker values are identical every run, so the assertion proves nothing either way",
          ],
          correctIndex: 0,
          explanation:
            "A test that asserts on a generated name is either flaky or accidentally pinned to a seed. If a value matters to the assertion, the test should be the thing that decided it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-factories-q4",
          prompt: "Which of these reduce factory cost across a large suite? (Select all that apply.)",
          options: [
            "Keeping the default definition minimal and attaching relationships only where a test needs them",
            "Using `make()` when the test never queries the database for the record",
            "Using `recycle()` so a graph of related models shares one parent instead of creating a new one at each level",
            "Calling `create()` for every model the application has in a global `beforeEach`",
            "Seeding the entire database before every test so the data is always consistent",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The winning move is always \"create less\". A global seed or blanket `beforeEach` multiplies its cost by the number of tests, and the tests that do not need the data pay for it anyway.",
        },
        {
          id: "lv-test-factories-q5",
          prompt: "What does `User::factory()->count(3)->create()` return?",
          options: [
            "A collection of three persisted models",
            "A single model, because `create()` collapses the count",
            "An array of attribute arrays",
            "A query builder scoped to the three new rows",
          ],
          correctIndex: 0,
          explanation:
            "With a count you get an Eloquent collection; without one you get a single model. That difference catches people who destructure the result the wrong way.",
        },
        {
          id: "lv-test-factories-q6",
          prompt:
            "A test calls `Event::fake()` and then `Post::factory()->create()`. The model's `creating` observer, which generates the slug, never runs. What is the fix?",
          options: [
            "Call `Event::fake()` *after* creating the factory data, or fake only the specific events the test cares about",
            "Move the factory call into a `beforeEach` hook",
            "Use `make()` instead of `create()` so the observer is bypassed consistently",
            "Disable the observer in the test environment's configuration",
          ],
          correctIndex: 0,
          explanation:
            "Model events go through the same dispatcher as everything else, so `Event::fake()` silences observers too. The Laravel docs call this out and recommend faking after the factory data exists, or passing a list of events to fake.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-factories-q7",
          prompt: "What does `Post::factory()->for($user)->create()` express?",
          options: [
            "The belongsTo side: the post is created belonging to that existing user",
            "The hasMany side: a user is created for each post",
            "A polymorphic relationship, resolved from the model class",
            "An attachment to a pivot table",
          ],
          correctIndex: 0,
          explanation:
            "`for()` attaches the parent you already have, so you control the identity of the related record. `has()` is its mirror image for the child side.",
        },
        {
          id: "lv-test-factories-q8",
          prompt: "What does `Post::factory()->has(Comment::factory()->count(3))->create()` express?",
          options: [
            "One post with three comments created for it",
            "Three posts, each with one comment",
            "A belongsTo relationship from post to comment",
            "An eager load of the comments relationship",
          ],
          correctIndex: 0,
          explanation:
            "`has()` creates children for the model being built. The count applies to the child factory, not to the parent.",
        },
        {
          id: "lv-test-factories-q9",
          prompt: "What is `sequence()` genuinely good for? (Select all that apply.)",
          options: [
            "Creating a batch where one attribute cycles through a list of values",
            "Producing deterministic variation across created rows without writing a loop",
            "Setting up a filter or grouping test that needs several distinct statuses in one call",
            "Pinning Faker's seed so every run generates identical data",
            "Guaranteeing the rows come back ordered by primary key",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A sequence cycles values across the created models, which is exactly what a filtering or grouping test needs. It has nothing to do with Faker's seed or with result ordering.",
        },
        {
          id: "lv-test-factories-q10",
          prompt: "A pagination test creates 50 rows through a factory and has become one of the slowest in the suite. What is usually the real fix?",
          options: [
            "Create the smallest number of rows that proves the behaviour, and set the page size in the test rather than matching production's",
            "Switch the factory to `make()` so nothing is written",
            "Add an index to the test database for the ordering column",
            "Run only that test with `--parallel`",
          ],
          correctIndex: 0,
          explanation:
            "Pagination behaviour is about boundaries, not volume: three rows with a page size of two proves the same thing. `make()` cannot work here, because pagination reads from the database.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "lv-test-validation-authorization",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "Testing Validation and Authorization",
      summary:
        "Validation and authorization are the two rule sets most likely to be quietly wrong and the cheapest to test properly, because both are fully observable at the HTTP boundary. Test them through the route. A test that instantiates a form request and compares `rules()` to an array asserts the configuration, not the behaviour: the rule list can be perfect while the endpoint still accepts rubbish, because the field is named differently on the wire, a cast ran first, or the request class was never bound to that route at all.\n\nThe response shapes are worth memorising because tests hinge on them. A failed `authorize()` on a form request is a **403**. Validation failure is **422 with a JSON `errors` object** when the request expects JSON, and a **redirect with a flashed error bag** otherwise. `assertInvalid()` and `assertValid()` understand both, which is why they are usually the right assertion rather than `assertSessionHasErrors` or `assertStatus(422)`.\n\nThe shape of a good suite here is a dataset, not fifteen near-identical methods: one row per input — missing, wrong type, just inside the boundary, just outside — asserting the field key is invalid rather than the exact sentence, which belongs to the language files and will be edited. And for authorization, the interesting case is always the negative one. \"An admin can reach this\" is table stakes; \"a member of another team gets a 403\" is the test that would have stopped the incident.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel: HTTP Tests — assertInvalid", url: "https://laravel.com/framework/docs/13.x/http-tests#available-assertions", kind: "docs" },
        { label: "Laravel: Validation — Form Request Validation", url: "https://laravel.com/framework/docs/13.x/validation#form-request-validation", kind: "docs" },
        { label: "Laravel: Authorization", url: "https://laravel.com/framework/docs/13.x/authorization", kind: "docs" },
        { label: "Pest: Datasets", url: "https://pestphp.com/docs/datasets", kind: "docs" },
      ],
      video: {
        title: "Better Testing in Laravel - Kai Sassnowski - Laracon EU Online 2021",
        channel: "Laracon EU",
        url: "https://www.youtube.com/watch?v=g0Jsmzt8Eg4",
        videoId: "g0Jsmzt8Eg4",
        startSeconds: 859,
        chapterLabel: "Validation",
        durationLabel: "33:58",
      },
      alternateVideos: [
        {
          title: "Laravel Testing 11/24: Testing roles: only Admin can access creating products",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=M3s8aTR42Cw",
          videoId: "M3s8aTR42Cw",
          durationLabel: "7:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-validation-authorization-q1",
          prompt: "A form request's `authorize()` method returns `false`. What status does the endpoint return?",
          options: ["403", "401", "422", "419"],
          correctIndex: 0,
          explanation:
            "A failed authorization check produces a 403. 422 is validation, 401 is \"not authenticated\", and 419 is a request-forgery/session failure — three statuses people routinely confuse in assertions.",
        },
        {
          id: "lv-test-validation-authorization-q2",
          prompt: "The same route sits behind the `auth` middleware and the test makes the request without authenticating. What comes back?",
          options: [
            "401 when the request expects JSON; a redirect to the login route otherwise",
            "403 in both cases, since the user has no permission",
            "401 in both cases, regardless of what the request expects",
            "302 in both cases, since the middleware always redirects",
          ],
          correctIndex: 0,
          explanation:
            "The authentication middleware branches on what the request accepts, exactly like validation does. Asserting 401 on an HTML form post is a common source of confusing failures.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-validation-authorization-q3",
          prompt: "How does a validation failure differ between `postJson()` and `post()` against the same endpoint?",
          options: [
            "422 with an `errors` object for JSON; a 302 back with the errors flashed to the session otherwise",
            "422 in both cases — the response shape is fixed by the framework",
            "302 in both cases, with the JSON client expected to follow the redirect",
            "500 in both cases, because the validation exception is unhandled",
          ],
          correctIndex: 0,
          explanation:
            "Laravel decides from the request's `Accept` header and `X-Requested-With`. Writing the test one way and shipping the other is how an API ends up redirecting its clients to a login page.",
        },
        {
          id: "lv-test-validation-authorization-q4",
          prompt: "Which assertion works for both of those shapes?",
          options: [
            "`assertInvalid(['email'])`",
            "`assertSessionHasErrors(['email'])`",
            "`assertJsonValidationErrors(['email'])`",
            "`assertStatus(422)`",
          ],
          correctIndex: 0,
          explanation:
            "`assertInvalid` inspects a JSON error body or a flashed error bag, whichever is present. The other three each only understand one of the two shapes.",
        },
        {
          id: "lv-test-validation-authorization-q5",
          prompt: "Which of these are good practice for a validation test suite? (Select all that apply.)",
          options: [
            "Driving the rules through the real route, so middleware and the form request both run",
            "Using a dataset so each rule is one row rather than one hand-written method",
            "Asserting that the field key is invalid, rather than matching the exact message text",
            "Instantiating the form request and comparing `rules()` with an expected array",
            "Asserting the exact sentence produced by the language file",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Test behaviour at the boundary, parameterise the inputs, and stay off the copy. Message strings are translated and edited; the field being rejected is the thing you actually care about.",
        },
        {
          id: "lv-test-validation-authorization-q6",
          prompt: "Why is asserting that `rules()` returns a particular array a weak test?",
          options: [
            "It asserts the configuration, not the behaviour — the array can be right while the endpoint still accepts bad input",
            "`rules()` is private, so the test needs reflection to reach it",
            "PHPUnit cannot compare nested arrays reliably",
            "Form requests do not have a `rules()` method in Laravel 13",
          ],
          correctIndex: 0,
          explanation:
            "The rule array is only half the story: the request class has to be type-hinted on the action, the field names have to match the payload, and nothing earlier in the pipeline may have rewritten the input.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-validation-authorization-q7",
          prompt: "When testing a policy, which case carries the most value?",
          options: [
            "The negative one: a user who should not be allowed is actually refused",
            "The positive one: an authorised user gets through",
            "That the policy class exists and can be instantiated",
            "That the policy is discovered and registered",
          ],
          correctIndex: 0,
          explanation:
            "The positive path gets exercised by every other feature test that acts as a permitted user. The refusal is the one nobody notices is broken until it is in the incident report.",
        },
        {
          id: "lv-test-validation-authorization-q8",
          prompt:
            "A `show` route uses a scoped route-model binding. A user from another team requests it and gets 404 rather than 403. Should the test be changed to expect 403?",
          options: [
            "No — hiding the existence of a record the user may not see is a deliberate design choice; the test should assert what the application intends",
            "Yes — authorization failures must always surface as 403",
            "Yes — a scoped binding returning 404 is a framework bug",
            "No, but only because it is an API route; web routes must return 403",
          ],
          correctIndex: 0,
          explanation:
            "404-instead-of-403 avoids leaking that a resource exists, which is a legitimate decision. The point of the test is to pin whichever behaviour the team chose so it cannot drift silently.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-validation-authorization-q9",
          prompt: "Which inputs belong in a validation dataset for an `amount` field with a minimum and a maximum? (Select all that apply.)",
          options: [
            "The values just inside and just outside each boundary",
            "A non-numeric string",
            "A payload with the key missing entirely",
            "The exact value the happy-path test already uses",
            "A value that is valid in every respect",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Boundaries, wrong types and absence are where rules break. A valid value is already covered by the happy-path test, so repeating it in the invalid-input dataset adds runtime and no information.",
        },
        {
          id: "lv-test-validation-authorization-q10",
          prompt: "Which of these gives the most confidence that an authorization rule actually works?",
          options: [
            "Acting as a user who genuinely fails the policy and asserting the endpoint refuses them",
            "Mocking the gate to return `false` and asserting the controller took the deny branch",
            "Unit-testing the policy method in isolation and nothing else",
            "Asserting that the policy is bound in the container",
          ],
          correctIndex: 0,
          explanation:
            "Mocking the gate proves your controller handles a `false` — not that the gate would ever return one for that user. The end-to-end check covers the policy, its registration and the call site together.",
        },
        {
          id: "lv-test-validation-authorization-q11",
          prompt: "You want to test that an API endpoint is rate limited. What has changed about the setup since Laravel 11?",
          options: [
            "The default `api` middleware group contains only `SubstituteBindings`, so no throttle applies unless the application added one — the test must exercise whatever the app configures in `bootstrap/app.php`",
            "Throttling is applied to every API route by default, so the test only needs to send enough requests",
            "`throttle:api` is still registered by `RouteServiceProvider`, which every application has",
            "Rate limiting cannot be tested, because the limiter uses real time",
          ],
          correctIndex: 0,
          explanation:
            "Since Laravel 11 there is no `app/Http/Kernel.php` and no throttle in the default `api` group; middleware, routing and exception handling are configured in `bootstrap/app.php`. A rate-limit test that assumes the old default will never see a 429.",
        },
      ],
    },

    {
      id: "lv-test-fakes",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "Mocking, Fakes and the Facade Fakes",
      summary:
        "Two different tools travel under the same word. A Mockery mock replaces one collaborator with an object carrying expectations — `$this->mock(PaymentGateway::class, ...)` binds it into the container as an instance, so anything resolved from the container gets the double (and anything built with `new` does not). A facade fake replaces a whole subsystem — the queue, the dispatcher, the mailer, a disk, the HTTP client — with an in-memory recorder that also brings its own assertions. Neither would be possible if facades were real static calls: they are container bindings, which is the entire reason `Queue::fake()` works at all.\n\nA fake always costs you something. `Queue::fake()` stops the job running, so the only thing you can now assert is that it was pushed with the right payload; everything inside `handle()` is untested until you write a second test that instantiates the job and calls it. The same applies to `Event::fake()` and listeners, and `Mail::fake()` and the mailable's content. Faking buys speed and isolation and hands you a second test to write — and a Laravel suite that forgot to write it is exactly how you end up with a green board over broken code.\n\nThe gotchas cluster. `Event::fake()` silences model observers too, so calling it before your factories stops the `creating` hook that generates a slug. A `ShouldQueue` mailable is caught by `Mail::assertQueued`, never by `assertSent`. `Queue::fake()` does not stop `dispatchSync`, which bypasses the queue entirely. Chains and batches need `Bus::fake()`, not `Queue::fake()`. And `Http::fake()` with no arguments returns an empty 200 for everything, while `Http::fake(['api.example.com/*' => ...])` lets every *unlisted* URL be really called — which is what `Http::preventStrayRequests()` is for.\n\nThe judgement call underneath all of it: a test that mocks the thing it is testing proves nothing. If the subject is the double, every assertion describes the double.",
      level: "advanced",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Laravel: Mocking", url: "https://laravel.com/framework/docs/13.x/mocking", kind: "docs" },
        { label: "Laravel: Queues — Testing", url: "https://laravel.com/framework/docs/13.x/queues#testing", kind: "docs" },
        { label: "Laravel: HTTP Client — Testing", url: "https://laravel.com/framework/docs/13.x/http-client#testing", kind: "docs" },
        { label: "Martin Fowler: Mocks Aren't Stubs", url: "https://martinfowler.com/articles/mocksArentStubs.html", kind: "article" },
      ],
      video: {
        title: "Let's Build Task Tracker App With Laravel | Part 4: Testing, Mocking, Profile Page & Deployment",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=0DxZlKfO4QY",
        videoId: "0DxZlKfO4QY",
        startSeconds: 4331,
        chapterLabel: "Mocking & Facade Fakes",
        durationLabel: "2:21:17",
      },
      alternateVideos: [
        {
          title: "Lies you've been told about Unit Testing - Adam Wathan",
          channel: "Laracon Online",
          url: "https://www.youtube.com/watch?v=jQ1vYzoCubA",
          videoId: "jQ1vYzoCubA",
          startSeconds: 2572,
          chapterLabel: "Testing external services",
          durationLabel: "55:30",
        },
        {
          title: "Advanced Laravel Testing: 3rd-Party APIs with HTTP Fake",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=hB1s7I14HXc",
          videoId: "hB1s7I14HXc",
          durationLabel: "6:05",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-fakes-q1",
          prompt: "Why can a Laravel facade be faked when a plain PHP static method cannot?",
          options: [
            "A facade resolves an instance out of the service container, so the binding can be swapped for a fake",
            "PHP allows static methods to be redefined at runtime",
            "Facades are rewritten at build time by the framework's compiler",
            "Mockery patches the opcode cache to intercept static calls",
          ],
          correctIndex: 0,
          explanation:
            "The static call is a façade over `app()->make(...)`. Everything testable about facades — `fake()`, `spy()`, `shouldReceive()` — follows from that one design decision.",
        },
        {
          id: "lv-test-fakes-q2",
          prompt:
            "A controller dispatches `ShipOrder`. Your test calls `Queue::fake()` and asserts `Queue::assertPushed(ShipOrder::class)`. What is now untested?",
          options: [
            "Everything inside `ShipOrder::handle()` — the fake stopped it from ever running",
            "The controller's response status code",
            "The route's middleware stack",
            "Nothing: `assertPushed` runs the job before asserting",
          ],
          correctIndex: 0,
          explanation:
            "The fake intercepts the push, so the handler never executes. That is the correct trade for a controller test — as long as the job gets its own test that actually calls `handle()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-fakes-q3",
          prompt: "The test environment ships with `QUEUE_CONNECTION=sync`. Without any fake, what happens when the code dispatches a job?",
          options: [
            "It runs inline in the same process, and an exception inside it fails the test",
            "Nothing happens, because no worker is listening",
            "It is pushed to the default Redis queue for a worker to pick up later",
            "It is deferred and executed after the test finishes",
          ],
          correctIndex: 0,
          explanation:
            "`sync` means \"handle it now\". This is useful — the whole path gets exercised — but it makes the job's cost and its failures part of every test that triggers it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-fakes-q4",
          prompt: "`Queue::fake()` is active and the code calls `ShipOrder::dispatchSync()`. What happens?",
          options: [
            "The job still runs, because `dispatchSync` bypasses the queue entirely",
            "It is recorded and `Queue::assertPushed` will find it",
            "An exception is thrown, because the queue is faked",
            "It is silently dropped",
          ],
          correctIndex: 0,
          explanation:
            "`Queue::fake()` intercepts pushes onto a queue; a synchronous dispatch never touches one. `Bus::fake()` is the fake that sits at the dispatcher level and records it, via `assertDispatchedSync`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-fakes-q5",
          prompt: "You need to assert that three jobs were dispatched as a chain, in order. What do you reach for?",
          options: [
            "`Bus::fake()` with `Bus::assertChained([...])`",
            "`Queue::fake()` with three `Queue::assertPushed` calls",
            "`Event::fake()` with `Event::assertDispatched` for each job",
            "`Bus::fake()` with `Queue::assertPushedOn`",
          ],
          correctIndex: 0,
          explanation:
            "Chains and batches are a dispatcher concept, so they need the dispatcher's fake. `Queue::assertPushed` would at best see the first job and tell you nothing about the ordering.",
        },
        {
          id: "lv-test-fakes-q6",
          prompt:
            "`Mail::fake()` is in place, the mailable implements `ShouldQueue`, and `Mail::assertSent(OrderShipped::class)` fails. Why?",
          options: [
            "Queued mailables are recorded as queued — assert with `Mail::assertQueued` instead",
            "`Mail::fake()` does not intercept queued mail at all",
            "The mailable must be dispatched through the bus for the fake to see it",
            "`assertSent` only matches the first mailable of the run",
          ],
          correctIndex: 0,
          explanation:
            "The fake keeps two ledgers: sent and queued. A mailable that implements `ShouldQueue` always lands in the second one, even when the calling code used `send()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-fakes-q7",
          prompt:
            "A test calls `Event::fake()` at the top, then creates a model via a factory. The `creating` observer that generates the slug never runs. What is the recommended fix?",
          options: [
            "Fake after the factory data is created, or pass only the events the test cares about to `Event::fake([...])`",
            "Move the factory call into a `beforeEach` hook",
            "Use `make()` instead of `create()` so no model events fire either way",
            "Turn the observer off in the testing configuration",
          ],
          correctIndex: 0,
          explanation:
            "Model events travel through the same dispatcher, so faking it silences observers. The Laravel docs give exactly this advice, and `Event::fake([OrderCreated::class])` is the surgical version.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-fakes-q8",
          prompt: "What does `Http::fake()` with no arguments do?",
          options: [
            "Returns an empty 200 response for every outbound request made through Laravel's HTTP client",
            "Throws an exception on every outbound request",
            "Records outbound requests but still sends them for real",
            "Fakes only the URLs that a previous test recorded",
          ],
          correctIndex: 0,
          explanation:
            "An empty 200 for everything is a safe default for \"this test does not care about the third party\". When the response body matters, pass an array of URL patterns to stubbed responses.",
        },
        {
          id: "lv-test-fakes-q9",
          prompt:
            "`Http::fake(['api.stripe.com/*' => Http::response(['ok' => true])])` is active. Which statements are true? (Select all that apply.)",
          options: [
            "Requests to URLs you did not list are still genuinely sent over the network",
            "`Http::preventStrayRequests()` makes any unfaked request throw instead of being sent",
            "The fake only covers Laravel's HTTP client — a Guzzle client you construct yourself, or a raw cURL call, is unaffected",
            "The fake also intercepts inbound requests made with `$this->get()`",
            "Faked requests and responses are persisted to the database for later inspection",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Partial fakes fall through to the real network, which is how a CI run ends up calling a payment provider. `preventStrayRequests` turns that silent fall-through into a loud failure — and neither helps if the code bypasses the facade.",
        },
        {
          id: "lv-test-fakes-q10",
          prompt: "What does `Storage::fake('photos')` do, concretely?",
          options: [
            "Swaps that disk for a local disk rooted under `storage/framework/testing/disks`, clears it first, and adds assertion methods",
            "Keeps every written file purely in memory, never touching the filesystem",
            "Points the disk at the system temp directory and leaves the files there afterwards",
            "Makes every write to that disk a no-op that always reports success",
          ],
          correctIndex: 0,
          explanation:
            "The files are real, in a scratch directory that is cleaned at the start of each fake — `persistentFake()` skips the cleaning. Under `--parallel` the root gets the process token appended so processes cannot collide.",
        },
        {
          id: "lv-test-fakes-q11",
          prompt: "Which statements about `$this->mock(PaymentGateway::class, ...)` are true? (Select all that apply.)",
          options: [
            "It binds a Mockery mock into the container as an instance, so anything resolving that class receives the mock",
            "Code that does `new PaymentGateway(...)` directly will not receive the mock",
            "`$this->spy()` is the same idea but records calls for assertion afterwards instead of setting expectations up front",
            "It rewrites the class on disk for the duration of the test",
            "It also intercepts objects constructed inside another class's constructor with `new`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Container mocking only reaches code that asks the container. That is the practical argument for injecting dependencies rather than newing them up — testability follows from the wiring, not from the test.",
        },
        {
          id: "lv-test-fakes-q12",
          prompt:
            "A test for `InvoiceService::charge()` mocks `InvoiceService` itself and asserts that `charge` was called. What has it proved?",
          options: [
            "Nothing about `charge` — the assertion describes the mock, not the code under test",
            "That charging works end to end",
            "That the container binding for `InvoiceService` is correct",
            "That the method signature matches its callers",
          ],
          correctIndex: 0,
          explanation:
            "Once the subject is replaced by a double, the test can only observe the double. This shows up in real suites as a class with \"full coverage\" and no assertion that its behaviour is right.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "lv-test-time",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "Time Travel and Time-Dependent Tests",
      summary:
        "Time is a hidden dependency, and any behaviour that depends on it — a trial that expires, a token that lives an hour, a rate limiter's decay window, a digest that only goes out on Mondays — is untestable until you can control it. Laravel's test case gives you `travel(5)->days()`, `travelTo($moment)`, `travelBack()`, `freezeTime()` and `freezeSecond()`. Underneath, these set Carbon's test-now, so `now()`, `Carbon::now()` and the timestamps Eloquent writes all move together. The closure forms restore the clock as soon as the closure returns, and the framework resets it in teardown either way, so travel does not leak between tests.\n\nWhat does not move is everything outside PHP's Carbon. The database still has the real time, so a query comparing against `CURRENT_TIMESTAMP` is unaffected — compare against a PHP value you control instead. PHP's own `time()` and `new DateTime()` are untouched. A queue worker in another process has its own clock. And code that sleeps really sleeps, unless it was written against Laravel's `Sleep` class, which `Sleep::fake()` can then short-circuit.\n\nThe quieter win is a test that does not need any of this. A class that takes the reference time as an argument, or a clock as a constructor dependency, is testable with a plain value and no global state at all. Reach for `travelTo` when you are testing framework-level behaviour; reach for an injected time when you are designing a domain class.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel: Mocking — Interacting With Time", url: "https://laravel.com/framework/docs/13.x/mocking#interacting-with-time", kind: "docs" },
        { label: "Laravel: Helpers — Sleep", url: "https://laravel.com/framework/docs/13.x/helpers#sleep", kind: "docs" },
        { label: "Martin Fowler: Eradicating Non-Determinism in Tests", url: "https://martinfowler.com/articles/nonDeterminism.html", kind: "article" },
      ],
      video: {
        title: "Let's Build Task Tracker App With Laravel | Part 4: Testing, Mocking, Profile Page & Deployment",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=0DxZlKfO4QY",
        videoId: "0DxZlKfO4QY",
        startSeconds: 5242,
        chapterLabel: "Time Travel In Tests",
        durationLabel: "2:21:17",
      },
      alternateVideos: [
        {
          title: "Laravel Weekly Update #8: New Sleep Helper Class",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=qYZvpvVs6hk",
          videoId: "qYZvpvVs6hk",
          durationLabel: "2:58",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-time-q1",
          prompt: "What do `travelTo()` and `freezeTime()` actually change?",
          options: [
            "Carbon's idea of \"now\" for this process, which `now()`, `Carbon::now()` and Eloquent's timestamps all read",
            "The operating system clock for the duration of the test",
            "The database server's clock",
            "PHP's built-in `time()` function",
          ],
          correctIndex: 0,
          explanation:
            "They set Carbon's test-now. Everything that goes through Carbon moves; everything that does not — the OS, the database, another process — carries on with the real time.",
        },
        {
          id: "lv-test-time-q2",
          prompt:
            "A test travels 30 days forward, then asserts a query using `whereRaw('expires_at < CURRENT_TIMESTAMP')` finds the expired row. It fails. Why?",
          options: [
            "`CURRENT_TIMESTAMP` is evaluated by the database, which still has the real time — compare against a PHP-side value instead",
            "Travelling forward only affects future timestamps, not comparisons",
            "`whereRaw` bypasses Eloquent, so timestamps are not cast",
            "Travelling invalidates the query builder's compiled SQL cache",
          ],
          correctIndex: 0,
          explanation:
            "Time travel is a PHP-side illusion. Any comparison the database performs against its own clock is outside it — which is a good argument for binding `now()` as a parameter rather than letting SQL decide what time it is.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-time-q3",
          prompt: "What is the difference between `travelTo($moment)` with and without a closure?",
          options: [
            "With a closure, the clock is restored as soon as the closure returns; without one it stays changed until `travelBack()` or the end of the test",
            "The closure form runs asynchronously",
            "Without a closure the call has no effect until `freezeTime()` is also called",
            "The closure form only affects database queries",
          ],
          correctIndex: 0,
          explanation:
            "The closure form scopes the change to exactly the code that needs it, which keeps the rest of the test on real time and makes the intent obvious to a reader.",
        },
        {
          id: "lv-test-time-q4",
          prompt:
            "A test asserts `$model->created_at->toDateTimeString() === now()->toDateTimeString()` and fails roughly once a week in CI. What is going on?",
          options: [
            "The two values landed either side of a second boundary — freeze time so they cannot",
            "The database rounds timestamps to the nearest minute",
            "Carbon caches `now()` for sixty seconds, so the values drift apart",
            "Eloquent lets the database set the timestamp, so it is never equal to the PHP value",
          ],
          correctIndex: 0,
          explanation:
            "Laravel sets timestamps in PHP, so they are normally equal — until the clock ticks between the insert and the assertion. `freezeTime()` (or `freezeSecond()`) removes the race entirely.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-time-q5",
          prompt: "What is the difference between `freezeTime()` and `freezeSecond()`?",
          options: [
            "`freezeSecond()` freezes at the start of the current second, dropping sub-second precision",
            "They are identical aliases",
            "`freezeSecond()` only freezes the clock for one second and then resumes",
            "`freezeTime()` also freezes the database's clock",
          ],
          correctIndex: 0,
          explanation:
            "Sub-second differences are a common source of flaky equality assertions against values that were stored with second precision, and `freezeSecond` removes that mismatch.",
        },
        {
          id: "lv-test-time-q6",
          prompt: "Which of these are affected by Laravel's time-travel helpers? (Select all that apply.)",
          options: [
            "`now()`",
            "`Carbon::now()`",
            "Eloquent's `created_at` / `updated_at`, which Laravel sets in PHP",
            "PHP's `time()`",
            "`CURRENT_TIMESTAMP` evaluated by the database engine",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The helpers reach exactly as far as Carbon does. PHP's own time functions and anything the database evaluates are outside that boundary.",
        },
        {
          id: "lv-test-time-q7",
          prompt: "Your retry loop calls `sleep(5)` between attempts. How do you test it without waiting fifteen seconds?",
          options: [
            "Use Laravel's `Sleep` class in the code, then `Sleep::fake()` in the test",
            "Mock PHP's `sleep` function with Mockery",
            "Lower `max_execution_time` so the sleeps are cut short",
            "Travel in time — `sleep` reads Carbon's clock",
          ],
          correctIndex: 0,
          explanation:
            "`Sleep` exists precisely so that sleeping becomes an injectable, fakeable thing rather than a language built-in. Time travel cannot help: `sleep()` blocks the process regardless of what Carbon thinks.",
        },
        {
          id: "lv-test-time-q8",
          prompt: "A test travels forward and never calls `travelBack()`. Does the next test see the travelled time?",
          options: [
            "No — the framework resets Carbon's test-now during teardown; but a value your code cached in a static or the container can still leak",
            "Yes — every subsequent test in the process inherits the travelled clock",
            "Yes, and the system clock stays changed until the machine is restarted",
            "Only if the test used the closure form, which restores lazily",
          ],
          correctIndex: 0,
          explanation:
            "Teardown calls `Carbon::setTestNow()` (and the immutable equivalent) with no argument, clearing it. What teardown cannot undo is a timestamp your own code memoised somewhere that outlives the application instance.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-time-q9",
          prompt: "What is the design-level alternative to calling `now()` deep inside a domain class?",
          options: [
            "Inject a clock, or take the reference time as a parameter, so the test passes a value instead of manipulating global state",
            "Read the current time from the database so it is consistent everywhere",
            "Always use `time()` instead, since it is faster",
            "Store the current time in a static property set at boot",
          ],
          correctIndex: 0,
          explanation:
            "Passing time in makes the dependency explicit and the test trivial. Time travel is the right tool when you are testing framework behaviour you do not control, not a substitute for the design.",
        },
        {
          id: "lv-test-time-q10",
          prompt: "Which behaviours genuinely need time control in their tests? (Select all that apply.)",
          options: [
            "A trial that expires fourteen days after sign-up",
            "A password reset token that is valid for one hour",
            "A rate limiter whose window decays after a minute",
            "A query that filters rows by `status = 'active'`",
            "A helper that generates a UUID",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three have a clock in their definition. The last two are deterministic with respect to time — reaching for `travelTo` there adds noise and hides what the test is really about.",
        },
      ],
    },

    {
      id: "lv-test-jobs-console",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "Testing Jobs, Queues and Console Commands",
      summary:
        "Once you have faked the queue at the dispatch site, the job owes you its own test. The straightforward version instantiates it and calls `handle()` — resolving whatever it type-hints — and asserts the side effects. When the behaviour under test *is* the queue interaction, `withFakeQueueInteractions()` gives you a job you can call `handle()` on and then assert `assertReleased(delay: 30)`, `assertDeleted()` or `assertFailedWith(SomeException::class)`. A job that participates in a batch gets `withFakeBatch()`, which hands back the job and a fake batch you can inspect.\n\nCalling `handle()` directly skips one thing production does: the serialization round trip. A job is serialised onto the queue and rebuilt on the other side, and `SerializesModels` re-fetches models by key rather than restoring the object you passed. A job holding a closure, a PDO handle or an open resource passes every test and explodes the moment a real worker picks it up.\n\nConsole commands get `$this->artisan('report:generate')`, with `expectsQuestion` / `expectsSearch` to script the input, `expectsOutput` (exact line) and `expectsOutputToContain` (looser) for the output, and `assertExitCode` / `assertSuccessful` / `assertFailed` for the result. Scheduled tasks are the odd one out: the schedule is configuration, so what you test automatically is the command it invokes. `schedule:list` shows you what is registered and `schedule:test` runs one on demand — both are eyeball tools, not assertions.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel: Queues — Testing", url: "https://laravel.com/framework/docs/13.x/queues#testing", kind: "docs" },
        { label: "Laravel: Console Tests", url: "https://laravel.com/framework/docs/13.x/console-tests", kind: "docs" },
        { label: "Laravel: Task Scheduling", url: "https://laravel.com/framework/docs/13.x/scheduling", kind: "docs" },
      ],
      video: {
        title: "What's New in Laravel 11, Ep 14 - Simple Tests for Complex Jobs",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=jJX6QxxK2qY",
        videoId: "jJX6QxxK2qY",
        durationLabel: "5:14",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-jobs-console-q1",
          prompt: "You faked the queue in the controller test. How do you now test the job itself?",
          options: [
            "Instantiate the job and call `handle()`, letting the container resolve its dependencies, then assert the side effects",
            "There is no supported way to test a job's body",
            "Start a `queue:work` process from the test and wait for it",
            "Pass a closure to `Queue::assertPushed` — that executes the handler as part of the assertion",
          ],
          correctIndex: 0,
          explanation:
            "A job is an ordinary class. The closure form of `assertPushed` only inspects the queued instance; it never runs anything.",
        },
        {
          id: "lv-test-jobs-console-q2",
          prompt: "What is `withFakeQueueInteractions()` for?",
          options: [
            "Asserting that a job released, deleted or failed itself, without a real queue behind it",
            "Faking the job's injected dependencies",
            "Running the job against a real queue connection in the test",
            "Asserting that the job was dispatched from somewhere else",
          ],
          correctIndex: 0,
          explanation:
            "It fakes the queue interactions a job can perform on itself, so `assertReleased(delay: 30)` and `assertFailedWith(...)` become available after you call `handle()`.",
        },
        {
          id: "lv-test-jobs-console-q3",
          prompt: "Calling a job's `handle()` directly in a test skips something production does. What?",
          options: [
            "The serialization round trip — `SerializesModels` re-fetches models by key, and an unserialisable property only blows up on a real worker",
            "Nothing; the worker also just calls `handle()`",
            "The surrounding database transaction",
            "The route middleware stack",
          ],
          correctIndex: 0,
          explanation:
            "A job is serialised on the way to the queue and rebuilt on the way out. Direct invocation skips both, which hides the class of bug where the job holds something that cannot survive the trip.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-jobs-console-q4",
          prompt: "`Bus::assertChained([...])` requires which fake to be in place?",
          options: ["`Bus::fake()`", "`Queue::fake()`", "A running queue worker", "`Event::fake()`"],
          correctIndex: 0,
          explanation:
            "Chains and batches are dispatcher-level constructs, so they are recorded by the bus fake. The queue fake sees pushes and knows nothing about the chain that produced them.",
        },
        {
          id: "lv-test-jobs-console-q5",
          prompt: "What does `$this->artisan('report:generate')->assertSuccessful()` assert?",
          options: [
            "That the command exited with status code 0",
            "That the command wrote something to standard output",
            "That the command finished within a time limit",
            "That the command is registered in the scheduler",
          ],
          correctIndex: 0,
          explanation:
            "`assertSuccessful` and `assertFailed` are shorthands over `assertExitCode`. Asserting the exit code is often the single most valuable thing to check about a command that runs from cron.",
        },
        {
          id: "lv-test-jobs-console-q6",
          prompt: "Which of these console-test methods actually exist in Laravel? (Select all that apply.)",
          options: [
            "`expectsQuestion`",
            "`expectsOutputToContain`",
            "`assertExitCode`",
            "`expectsDatabaseWrite`",
            "`assertScheduled`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Input scripting, output matching and exit codes are what the console test API covers. Database effects are asserted with the usual database assertions, and there is no built-in schedule assertion.",
        },
        {
          id: "lv-test-jobs-console-q7",
          prompt: "`expectsOutput('Done.')` fails even though the command clearly prints \"Done.\" What is the likely cause?",
          options: [
            "`expectsOutput` matches an output line exactly — formatting, padding or a Prompts component means the emitted line differs; `expectsOutputToContain` is the looser check",
            "Output assertions only work under PHPUnit, not Pest",
            "The command must return `void` for output assertions to apply",
            "Output is buffered and discarded during tests",
          ],
          correctIndex: 0,
          explanation:
            "Anything that decorates the line — a components helper, a table, an emoji, trailing spaces — breaks an exact match. This is also a good argument for not asserting on presentation at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-jobs-console-q8",
          prompt: "How do you test a scheduled task?",
          options: [
            "Test the command it invokes as a normal console test; the schedule entry itself is configuration you can inspect with `schedule:list` or run once with `schedule:test`",
            "Use `$this->schedule()->assertRuns('report:generate')`",
            "Run `schedule:run` in a loop until the due time arrives",
            "Scheduled tasks cannot be tested at all",
          ],
          correctIndex: 0,
          explanation:
            "Almost all the risk is in the command, and that is ordinary to test. `schedule:list` and `schedule:test` exist for checking the registration and firing one by hand, not for assertions.",
        },
        {
          id: "lv-test-jobs-console-q9",
          prompt: "Which of these are worth asserting about a queued job? (Select all that apply.)",
          options: [
            "That the work it performs actually happened — rows written, mail queued, a file produced",
            "That it releases itself with the expected delay when a dependency is unavailable",
            "That it fails with the expected exception for input it cannot process",
            "That Laravel serialised the job's payload correctly",
            "That a worker process is currently running",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The effects, the retry behaviour and the failure path are yours. Serialisation is the framework's job, and the state of your workers is an operations concern, not a test one.",
        },
        {
          id: "lv-test-jobs-console-q10",
          prompt: "A test dispatches a job in the default test environment and the job throws. What does the test see?",
          options: [
            "The exception propagates and fails the test, because the `sync` connection runs the job inline",
            "The job is recorded as failed and the test still passes",
            "The test hangs waiting for a worker",
            "The exception is logged and swallowed by the queue",
          ],
          correctIndex: 0,
          explanation:
            "On `sync` there is no queue to absorb the failure, so the exception surfaces in the dispatching code. That is useful early-warning behaviour — and a reason a controller test can fail for reasons that have nothing to do with the controller.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-jobs-console-q11",
          prompt: "What does `Queue::assertPushedOn('emails', SendInvoice::class)` check?",
          options: [
            "That the job was pushed onto the queue named `emails`",
            "That a worker listening to `emails` processed the job",
            "That an `emails` connection exists in the queue configuration",
            "That the job was pushed and then completed successfully",
          ],
          correctIndex: 0,
          explanation:
            "It asserts the destination queue name recorded at push time. Nothing is processed under a fake, so \"completed\" is not something the assertion could know.",
        },
      ],
    },

    {
      id: "lv-test-browser",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "Browser Testing: Dusk and Pest Browser Tests",
      summary:
        "A browser test drives a real browser against a really-running application, which makes it the only way to prove anything about JavaScript-driven behaviour — and the slowest, flakiest layer you own. You want few of them, on the journeys that would cost real money if they broke: sign-up, checkout, the thing your support team gets paged about.\n\nDusk is the long-standing option: ChromeDriver, a `DuskTestCase`, and a fluent `$browser->visit()->type()->press()->assertSee()` API. Because the browser reaches the app through a separate process, Dusk cannot use `RefreshDatabase` — its transaction is invisible across connections — and it cannot use in-memory SQLite at all, since that database only exists inside the test process. The documented options are `DatabaseMigrations` (drop and recreate per test) or `DatabaseTruncation` (migrate once, truncate between tests).\n\nPest's browser plugin is the newer option: Playwright underneath, `visit('/')` inside an ordinary Pest test, real Chromium/Firefox/WebKit, mobile viewports and visual diffing. Its headline difference is that it runs inside your test process, so `RefreshDatabase`, `Event::fake()` and `assertAuthenticated()` all work in the same test as the browser assertions — the two worlds you normally have to keep apart.\n\nFlakiness is a discipline, not a property of the tool. Wait for state, never for a duration. Select on a stable test attribute or accessible name, not on a CSS class that exists for styling. Freeze time and fake outbound HTTP so a run means the same thing twice. And treat a flaky browser test as a bug to fix or a test to delete — a retry loop teaches the whole team to ignore red.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel: Dusk", url: "https://laravel.com/framework/docs/13.x/dusk", kind: "docs" },
        { label: "Laravel: Dusk — Resetting the Database", url: "https://laravel.com/framework/docs/13.x/dusk#resetting-the-database-after-each-test", kind: "docs" },
        { label: "Pest: Browser Testing", url: "https://pestphp.com/docs/browser-testing", kind: "docs" },
        { label: "Martin Fowler: TestPyramid", url: "https://martinfowler.com/bliki/TestPyramid.html", kind: "article" },
      ],
      video: {
        title: "Pest 4: Modern Browser Testing, Sharding, Visual Diffs & more | Nuno Maduro at Laracon US 2025",
        channel: "Laravel",
        url: "https://www.youtube.com/watch?v=f5gAgwwwwOI",
        videoId: "f5gAgwwwwOI",
        startSeconds: 136,
        chapterLabel: "Browser Testing",
        durationLabel: "29:48",
      },
      alternateVideos: [
        {
          title: "Laravel Dusk: painless browser automation",
          channel: "Aaron Francis",
          url: "https://www.youtube.com/watch?v=2M23skx2TK8",
          videoId: "2M23skx2TK8",
          durationLabel: "20:49",
        },
        {
          title: "Browser Testing Is No Longer Horrible",
          channel: "Laracasts",
          url: "https://www.youtube.com/watch?v=pnkXtIZyZy4",
          videoId: "pnkXtIZyZy4",
          durationLabel: "26:25",
        },
        {
          title: "I've Tried Pest 4 Browser Testing: My Examples",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=M5i5-87HoHw",
          videoId: "M5i5-87HoHw",
          durationLabel: "17:24",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-browser-q1",
          prompt: "Why can a Dusk test not use `RefreshDatabase`?",
          options: [
            "The browser reaches the application through a separate process, which cannot see rows inside the test's uncommitted transaction",
            "Dusk tests never touch the database",
            "`RefreshDatabase` only works with the Pest test case",
            "Chrome caches query results between page loads",
          ],
          correctIndex: 0,
          explanation:
            "Transactions are scoped to a connection. This is the reason the Dusk documentation points you at `DatabaseMigrations` or `DatabaseTruncation` instead.",
        },
        {
          id: "lv-test-browser-q2",
          prompt: "Can Dusk tests run against an in-memory SQLite database?",
          options: [
            "No — the database exists only inside the test process's connection, and the browser's requests are served by another process",
            "Yes, it is the recommended configuration for speed",
            "Yes, provided you enable the right PRAGMA",
            "Only when Dusk runs in headless mode",
          ],
          correctIndex: 0,
          explanation:
            "The Dusk docs state this explicitly. A browser test needs a database that more than one process can open — a file-backed SQLite database or a real server.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-browser-q3",
          prompt: "Which of these genuinely reduce browser-test flakiness? (Select all that apply.)",
          options: [
            "Waiting for an element or a state to appear rather than for a fixed number of seconds",
            "Selecting elements by a stable test attribute or accessible name",
            "Freezing time and faking outbound HTTP so two runs mean the same thing",
            "Adding a five-second sleep before every assertion",
            "Retrying the whole suite until it goes green",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Determinism comes from waiting on conditions and removing real-world variation. Sleeps make the suite slower without making it reliable, and blanket retries hide the bug rather than finding it.",
        },
        {
          id: "lv-test-browser-q4",
          prompt: "What does a Dusk test need that a feature test does not?",
          options: [
            "An application the browser can actually reach over HTTP, plus a ChromeDriver binary",
            "A second database connection configured in `config/database.php`",
            "A running queue worker",
            "A compiled test binary produced by `php artisan dusk:build`",
          ],
          correctIndex: 0,
          explanation:
            "That extra infrastructure — a served application and a driver process — is most of why browser tests are slower and more fragile than in-process feature tests.",
        },
        {
          id: "lv-test-browser-q5",
          prompt: "What is the headline difference between Pest's browser testing and Dusk?",
          options: [
            "Pest's plugin drives Playwright from inside the test process, so `RefreshDatabase`, `Event::fake()` and auth assertions work alongside the browser assertions",
            "Pest's browser tests run without a browser at all",
            "Pest's browser tests do not need the application to be running",
            "Pest's browser tests replace the need for feature tests",
          ],
          correctIndex: 0,
          explanation:
            "Keeping the browser assertions and the framework's own test helpers in one test is the plugin's whole pitch, and it removes the database-reset compromise Dusk has to make.",
        },
        {
          id: "lv-test-browser-q6",
          prompt: "A browser test passes locally and fails only in CI. What is the most common cause?",
          options: [
            "A timing assumption — CI is slower, so an element the test assumed was rendered is not there yet",
            "CI runs a different PHP version",
            "The browser is not installed on the CI machine",
            "Assertions behave differently when the browser is headless",
          ],
          correctIndex: 0,
          explanation:
            "A missing browser fails every run, not one in five. Environment-sensitive timing is what produces the \"works on my machine\" browser test, and waiting for state instead of duration is the fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-browser-q7",
          prompt: "Where do browser tests belong in a Laravel suite?",
          options: [
            "A small number covering the journeys that would hurt most if they broke; everything else is cheaper to prove at the HTTP layer",
            "One per route, so the whole application is covered by real browsers",
            "They should replace feature tests entirely, since they are more realistic",
            "One per Blade component",
          ],
          correctIndex: 0,
          explanation:
            "They are the most realistic and the most expensive per unit of confidence. Spend them where realism is the thing you are buying — JavaScript behaviour and full user journeys.",
        },
        {
          id: "lv-test-browser-q8",
          prompt: "A browser test selects the submit button by the CSS class `.btn-primary-2`. Why is that a problem?",
          options: [
            "It couples the test to styling, so a design change breaks tests that have nothing to do with behaviour",
            "CSS class selectors are not supported by browser drivers",
            "Class names are always minified in production builds",
            "Class selectors are slower than XPath expressions",
          ],
          correctIndex: 0,
          explanation:
            "A dedicated test attribute, or the button's accessible name, expresses what the test means. The class exists for designers, and they should be able to change it without opening the test suite.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-browser-q9",
          prompt: "Which database strategies can a Dusk test use? (Select all that apply.)",
          options: [
            "`DatabaseMigrations`",
            "`DatabaseTruncation`",
            "A dedicated file-backed test database that the suite resets between runs",
            "`RefreshDatabase`",
            "In-memory SQLite",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that commits its changes works, because the browser's process has to be able to see them. Transaction-based isolation and in-memory SQLite are both ruled out by the process boundary.",
        },
        {
          id: "lv-test-browser-q10",
          prompt: "What are screenshot or visual-diff assertions genuinely good for?",
          options: [
            "Catching unintended visual regressions that no behavioural assertion would ever notice",
            "Making the suite run faster",
            "Replacing accessibility testing",
            "Asserting the resulting database state",
          ],
          correctIndex: 0,
          explanation:
            "A layout that collapses on a narrow viewport still passes every functional assertion. Visual diffs cover that gap — at the cost of needing a baseline that someone has to maintain.",
        },
      ],
    },

    {
      id: "lv-test-speed",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "Coverage, Parallel Testing and Suite Speed",
      summary:
        "Coverage measures which lines executed, not which behaviours were checked. A test that calls a method and asserts nothing produces exactly the same coverage as one that asserts everything, which is why a team can hit 90% and still ship regressions weekly. It is genuinely useful as a floor — `--coverage --min=80` in CI stops the number sliding — and as a way to find files nobody tests at all. It is useless as a target, because the cheapest way to raise it is to write the tests that are worth the least.\n\nParallel testing is the biggest single speed lever: install `brianium/paratest`, run `php artisan test --parallel`, and Laravel gives every process its own test database suffixed with a process token (`your_db_test_1`, `your_db_test_2`). What breaks is anything that shares state outside that boundary — two tests writing to the same fixed path, a hard-coded port, a cache key that ignores the token, or a test that depends on rows another test created. The `ParallelTesting` hooks exist for per-process and per-database setup, and `ParallelTesting::token()` lets your own code segment its resources the same way the framework does.\n\nFor everything else, measure before you optimise. `php artisan test --profile` names the ten slowest tests, and the causes are usually the same short list: booting the application per test, seeding far more data than the test needs, real sleeps, real HTTP calls, and expensive hashing. `BCRYPT_ROUNDS=4` and `WithCachedConfig` are the framework's own answers to the last two of those.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel: Testing — Running Tests in Parallel", url: "https://laravel.com/framework/docs/13.x/testing#running-tests-in-parallel", kind: "docs" },
        { label: "Pest: Test Coverage", url: "https://pestphp.com/docs/test-coverage", kind: "docs" },
        { label: "Martin Fowler: TestCoverage", url: "https://martinfowler.com/bliki/TestCoverage.html", kind: "article" },
        { label: "ParaTest (source)", url: "https://github.com/paratestphp/paratest", kind: "repo" },
      ],
      video: {
        title: "Laravel Testing 18/24: Test Coverage \"Myth\" and What is The Goal Instead?",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=_t3EXMGB3nc",
        videoId: "_t3EXMGB3nc",
        durationLabel: "7:07",
      },
      alternateVideos: [
        {
          title: "Pest 4: Modern Browser Testing, Sharding, Visual Diffs & more | Nuno Maduro at Laracon US 2025",
          channel: "Laravel",
          url: "https://www.youtube.com/watch?v=f5gAgwwwwOI",
          videoId: "f5gAgwwwwOI",
          startSeconds: 607,
          chapterLabel: "Debugging and Code Coverage",
          durationLabel: "29:48",
        },
        {
          title: "Up And Running with Pest: Running tests in parallel (22/35)",
          channel: "Codecourse",
          url: "https://www.youtube.com/watch?v=WgbeoiD4TFM",
          videoId: "WgbeoiD4TFM",
          durationLabel: "1:35",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-speed-q1",
          prompt: "What does `php artisan test --coverage` require?",
          options: [
            "Xdebug or PCOV installed in the PHP runtime",
            "Nothing beyond a standard Laravel install",
            "A running database server",
            "The `--parallel` flag as well",
          ],
          correctIndex: 0,
          explanation:
            "Coverage is collected by a PHP extension, not by the test framework. This is also why coverage runs are noticeably slower than ordinary ones.",
        },
        {
          id: "lv-test-speed-q2",
          prompt: "A file reports 100% line coverage. What does that actually guarantee?",
          options: [
            "Only that every line was executed at least once during the run",
            "That the file is free of bugs",
            "That every branch and condition was exercised",
            "That every edge case has a test",
          ],
          correctIndex: 0,
          explanation:
            "Line coverage records execution, not verification — a test with no assertions at all raises it. Branch coverage is a separate, stricter metric, and neither one says anything about edge cases nobody thought of.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-speed-q3",
          prompt: "What does `--coverage --min=80` do?",
          options: [
            "Fails the run when total coverage falls below that percentage",
            "Runs a randomly chosen 80% of the tests",
            "Sets the number of parallel processes to 80",
            "Prints a warning but still exits successfully",
          ],
          correctIndex: 0,
          explanation:
            "It is a ratchet for CI. Used as a floor it stops silent erosion; used as a target it mostly generates assertion-free tests.",
        },
        {
          id: "lv-test-speed-q4",
          prompt: "How does Laravel handle databases under `php artisan test --parallel`?",
          options: [
            "It creates and migrates one test database per process, suffixed with that process's token",
            "All processes share a single database, isolated by transactions",
            "Every individual test gets its own database",
            "Database access is disabled while running in parallel",
          ],
          correctIndex: 0,
          explanation:
            "You end up with `your_db_test_1`, `your_db_test_2` and so on. They persist between runs for speed; `--recreate-databases` forces them to be rebuilt.",
        },
        {
          id: "lv-test-speed-q5",
          prompt: "Which of these are likely to break when you turn on `--parallel`? (Select all that apply.)",
          options: [
            "Two tests writing to the same fixed path under `storage/app`",
            "A test that binds a fixed port on localhost",
            "A test that relies on rows another test created earlier in the run",
            "A test that uses `RefreshDatabase`",
            "A test that creates records through factories",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything sharing state outside the per-process database boundary collides. `RefreshDatabase` and factories are fine — each process gets its own database, and `Storage::fake()` even appends the process token to its root.",
        },
        {
          id: "lv-test-speed-q6",
          prompt: "What is `ParallelTesting::setUpTestDatabase(...)` for?",
          options: [
            "Work that must run once for each test database that gets created, such as seeding reference data",
            "Running a single test simultaneously in several processes",
            "Choosing how many processes the run uses",
            "Merging the per-process databases back together afterwards",
          ],
          correctIndex: 0,
          explanation:
            "It is the per-database hook. There are sibling hooks for process and test-case setup and teardown, plus `ParallelTesting::token()` for segmenting your own resources.",
        },
        {
          id: "lv-test-speed-q7",
          prompt: "Someone adds a global hook that seeds the entire database before every test. Why is that expensive even under `RefreshDatabase`?",
          options: [
            "The seed runs for every test, inside the transaction, so the insert cost is paid hundreds of times",
            "Seeding disables the transaction, forcing a full migration per test",
            "It triggers a fresh migration before each test",
            "It forces the suite to fall back to serial execution",
          ],
          correctIndex: 0,
          explanation:
            "`RefreshDatabase` only makes the *migration* a once-per-process cost. Anything you insert per test you pay for per test, whether it gets rolled back afterwards or not.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-speed-q8",
          prompt: "What does `php artisan test --profile` give you?",
          options: [
            "A list of the ten slowest tests in the run",
            "A flame graph of function calls",
            "A breakdown of SQL queries by test",
            "Peak memory consumption per test",
          ],
          correctIndex: 0,
          explanation:
            "Slow suites are usually slow because of a handful of tests, not uniformly. Profiling first stops you optimising the 400 tests that were already fast.",
        },
        {
          id: "lv-test-speed-q9",
          prompt: "Which of these make a Laravel suite faster without weakening it? (Select all that apply.)",
          options: [
            "Replacing real sleeps and real outbound HTTP calls with fakes",
            "Running across cores with `--parallel`",
            "Creating only the rows each test needs instead of seeding everything",
            "Deleting the slowest tests",
            "Lowering the coverage threshold in CI",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three remove work without removing confidence. Deleting slow tests and lowering the coverage floor make the number look better while giving up exactly what the suite was for.",
        },
        {
          id: "lv-test-speed-q10",
          prompt: "The shipped `phpunit.xml` sets `BCRYPT_ROUNDS=4`. What is the trade?",
          options: [
            "Hashing becomes fast enough for tests; it is a test-only setting and must never reach production configuration",
            "It switches to a weaker hashing algorithm",
            "It disables password hashing entirely during tests",
            "It makes password verification fail for hashes created outside the test suite",
          ],
          correctIndex: 0,
          explanation:
            "The algorithm is unchanged — only the work factor is. Four rounds is deliberately cheap, which is fine for a disposable test database and unacceptable anywhere real.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-speed-q11",
          prompt: "What is the honest use of a coverage number for a team?",
          options: [
            "A floor that stops coverage sliding, and a way to spot files nobody tests at all",
            "A performance metric each engineer is measured on",
            "Evidence that a release is safe to ship",
            "A substitute for code review on well-covered files",
          ],
          correctIndex: 0,
          explanation:
            "Turn it into a target and you get the tests that are cheapest to write rather than the ones worth having. As a floor and a gap-finder it is a genuinely useful signal.",
        },
      ],
    },

    {
      id: "lv-test-what-to-test",
      moduleId: "laravel-testing",
      trackId: "php",
      title: "What's Actually Worth Testing",
      summary:
        "The senior skill in this camp is deciding what *not* to test. A test costs you twice: once to write, and then forever, every time someone changes the code near it. A test that breaks on every refactor and has never caught a bug is a tax on change with no safety in return — and the correct response to one of those is to delete it.\n\nIn a Laravel application the value concentrates in a few places. The HTTP boundary, because that is where the wiring is: does this endpoint accept what it should, refuse what it should not, and leave the database in the state it claims. Money, permissions and anything irreversible. And every behaviour that was once a bug, because a regression test is the cheapest documentation of \"correct\" you will ever write. The low-value end is just as consistent: framework behaviour (Eloquent saves, a validation rule exists), accessors that return what you set, config arrays, and any assertion that is a restatement of the implementation.\n\nAssert on observable outcomes — the response, the stored state, the message emitted — rather than on how the code got there. A suite written that way survives the refactor where a controller's logic moves into a service class; a suite built on mocked collaborators and method-call assertions has to be rewritten alongside it, and proves nothing extra for the trouble.\n\nOne trap worth naming: coverage-shaped incentives push you towards exactly the wrong tests, because the cheapest way to execute lines is to call methods without asserting much. And one non-negotiable: a flaky test is a bug. A suite people do not trust gets ignored, and an ignored suite is worse than no suite, because it still costs money to run.",
      level: "expert",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Martin Fowler: TestPyramid", url: "https://martinfowler.com/bliki/TestPyramid.html", kind: "article" },
        { label: "Martin Fowler: TestDouble", url: "https://martinfowler.com/bliki/TestDouble.html", kind: "article" },
        { label: "Kent C. Dodds: Write tests. Not too many. Mostly integration.", url: "https://kentcdodds.com/blog/write-tests", kind: "article" },
        { label: "Laravel: Testing — Getting Started", url: "https://laravel.com/framework/docs/13.x/testing", kind: "docs" },
      ],
      video: {
        title: "Lies you've been told about Unit Testing - Adam Wathan",
        channel: "Laracon Online",
        url: "https://www.youtube.com/watch?v=jQ1vYzoCubA",
        videoId: "jQ1vYzoCubA",
        durationLabel: "55:30",
      },
      alternateVideos: [
        {
          title: "Testing in Laravel - All you need to know",
          channel: "Acadea.io",
          url: "https://www.youtube.com/watch?v=-4RRo6CTUgA",
          videoId: "-4RRo6CTUgA",
          startSeconds: 3124,
          chapterLabel: "Ep28 - Opinion on Testing: how much is enough?",
          durationLabel: "57:46",
        },
        {
          title: "Laravel Testing 19/24: Should we test packages? Or Laravel models?",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=0O_ue5dkU7E",
          videoId: "0O_ue5dkU7E",
          durationLabel: "4:00",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-test-what-to-test-q1",
          prompt: "What is the strongest argument for writing a test for a specific bug you just fixed?",
          options: [
            "It pins the behaviour so the same regression cannot return, and it records what \"correct\" means for a case nobody had thought about",
            "It raises the coverage percentage for that file",
            "It is required before the pull request can be merged",
            "It replaces the changelog entry",
          ],
          correctIndex: 0,
          explanation:
            "A bug is proof that the case was not obvious. That makes a regression test one of the few kinds whose value is demonstrated before you write it.",
        },
        {
          id: "lv-test-what-to-test-q2",
          prompt: "Which of these usually earn their keep in a Laravel application's test suite? (Select all that apply.)",
          options: [
            "Authorization — specifically, who gets refused",
            "Money calculations and their rounding rules",
            "The request-to-persistence path of the endpoints the business actually runs on",
            "That `$user->name` returns the value you just assigned to it",
            "That a configuration file contains the keys you wrote into it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Risk is the filter: permissions, money and the main flows. A property assignment and a config array cannot fail independently of the code you can already read.",
        },
        {
          id: "lv-test-what-to-test-q3",
          prompt: "Why is a test that asserts \"Eloquent saved the model\" low value?",
          options: [
            "It tests the framework, which has its own suite — your test only fails when Laravel itself is broken",
            "Models are not really part of the application",
            "It needs a database, and database tests are always slow",
            "Factories already assert it internally",
          ],
          correctIndex: 0,
          explanation:
            "Asserting that a *specific business rule* produced a specific row is valuable; asserting that `save()` writes to a table is testing someone else's code.",
        },
        {
          id: "lv-test-what-to-test-q4",
          prompt: "A test asserts only `$service->shouldHaveReceived('calculate')`. What is its failure mode?",
          options: [
            "It pins the implementation: a refactor producing the same correct output breaks it, and a wrong result does not",
            "It is slow, because spies record every interaction",
            "It cannot run under `--parallel`",
            "It requires Mockery, which is not installed by default",
          ],
          correctIndex: 0,
          explanation:
            "An interaction assertion describes how the code is wired, not what it does. It fails on the changes you want to be free to make and passes through the failures you care about.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-what-to-test-q5",
          prompt: "What does \"test at the seams\" mean in practice for a Laravel application?",
          options: [
            "Choose the boundaries where the system's contract is observable — a request in, a response plus stored state and emitted messages out — and assert there",
            "Put a test on every class boundary in the application",
            "Only write tests against interfaces, never concrete classes",
            "Split each test into separate setup and assertion files",
          ],
          correctIndex: 0,
          explanation:
            "Testing at a contract boundary leaves everything behind it free to change. Testing at every class boundary turns each internal design decision into a public API you must maintain.",
        },
        {
          id: "lv-test-what-to-test-q6",
          prompt: "A team has 92% coverage and still ships regressions most weeks. What is the most likely explanation?",
          options: [
            "The tests execute code without asserting the behaviour that matters, and the risky paths are not covered by intent",
            "92% is simply not a high enough threshold",
            "They need to convert their feature tests into unit tests",
            "Their coverage tool is measuring the wrong directories",
          ],
          correctIndex: 0,
          explanation:
            "Coverage counts executed lines. A suite optimised for that number is, by construction, optimised for the tests that assert least — which is exactly the suite that lets regressions through.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-what-to-test-q7",
          prompt: "Which tests are reasonable candidates for deletion? (Select all that apply.)",
          options: [
            "One that asserts a private helper's return value and breaks whenever the helper is renamed",
            "One whose assertions restate the implementation line by line",
            "A near-duplicate of another test that differs only in which factory it used",
            "The only test covering the refund path",
            "A slow browser test covering the checkout journey",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Delete the ones that cost maintenance and return nothing. The refund test and the checkout journey are slow and valuable — that is a reason to keep them and make them reliable, not to cut them.",
        },
        {
          id: "lv-test-what-to-test-q8",
          prompt: "What is the practical argument for leaning on feature tests in Laravel specifically?",
          options: [
            "Most Laravel bugs live in the wiring — routes, middleware, validation, authorization, casting, serialisation — which only a request through the kernel exercises",
            "Feature tests execute faster than unit tests",
            "Unit tests cannot use the framework's assertion helpers",
            "The framework does not support unit tests properly",
          ],
          correctIndex: 0,
          explanation:
            "Framework applications are mostly configuration and glue. A test that skips the glue skips where the defects are, however thoroughly it exercises a single method.",
        },
        {
          id: "lv-test-what-to-test-q9",
          prompt: "A refactor moves logic out of a controller into a service class. Which suite needed no changes?",
          options: [
            "One whose tests drive the endpoint and assert the response plus the resulting database state",
            "One that unit-tests the controller's methods directly",
            "One that mocks the controller's collaborators and asserts the calls between them",
            "One that asserts on the controller's constructor dependencies",
          ],
          correctIndex: 0,
          explanation:
            "This is the acid test for a suite's design. Behaviour-level tests are indifferent to where the code lives; structure-level tests have to be rewritten alongside it and catch nothing extra in exchange.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-test-what-to-test-q10",
          prompt: "When is reaching for a mock the right call? (Select all that apply.)",
          options: [
            "The collaborator is a third-party network service you cannot call from a test",
            "The collaborator is slow or non-deterministic, and its own behaviour is covered by its own tests",
            "You specifically need to prove that a particular message is sent to a downstream system",
            "The collaborator is the class under test",
            "You want to raise the coverage number on the collaborator",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Mocks are for boundaries you cannot or should not cross in a test. Mocking the subject makes the test meaningless, and mocking to move a metric is the metric driving the design.",
        },
        {
          id: "lv-test-what-to-test-q11",
          prompt: "What does a test suite owe a team on its worst day?",
          options: [
            "A fast, trustworthy answer to \"did I break anything?\" — which means no flakes, because a suite people stop trusting gets ignored",
            "A complete coverage report for the release notes",
            "One test per public method, so nothing is missed",
            "A record of every scenario the product team described",
          ],
          correctIndex: 0,
          explanation:
            "Trust and speed are what make people run it before pushing. Everything else is secondary to a suite that is actually consulted when it matters.",
        },
        {
          id: "lv-test-what-to-test-q12",
          prompt: "A test fails roughly one run in twenty with no code change. What is the correct response?",
          options: [
            "Treat it as a bug and remove the non-determinism — time, ordering, shared state, real network — or delete the test",
            "Wrap it in a retry loop so the suite goes green",
            "Mark it skipped and revisit it when there is time",
            "Increase the test's timeout until it stops failing",
          ],
          correctIndex: 0,
          explanation:
            "A flaky test teaches everyone to rerun instead of investigate, which is how a real failure gets waved through. Either it is worth making deterministic or it is not worth keeping.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
  ],
} satisfies Module;
