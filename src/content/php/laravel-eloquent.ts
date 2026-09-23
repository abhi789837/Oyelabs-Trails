import type { Module } from "@/types/curriculum";

export default {
  id: "laravel-eloquent",
  trackId: "php",
  name: "Eloquent & Migrations",
  description:
    "Laravel's data layer, from the schema up: migrations, the query builder, Eloquent models and relationships, and the performance work that separates an app that survives production from one that melts under it. The N+1 camp is the one to linger on.",
  refs: [
    { label: "Laravel 13: Eloquent ORM", url: "https://laravel.com/framework/docs/13.x/eloquent", kind: "docs" },
    { label: "Laravel 13: Database Migrations", url: "https://laravel.com/framework/docs/13.x/migrations", kind: "docs" },
    { label: "Laravel 13: Query Builder", url: "https://laravel.com/framework/docs/13.x/queries", kind: "docs" },
    { label: "Martin Fowler: Active Record", url: "https://martinfowler.com/eaaCatalog/activeRecord.html", kind: "article" },
  ],
  topics: [
    {
      id: "lv-eloquent-migrations",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Migrations and the Schema Builder",
      summary:
        "A migration is a versioned, executable description of a schema change, checked into the same repository as the code that depends on it. That is the whole point: without migrations, \"what shape is the database on staging?\" is answered by a human, and the answer drifts. With them, the schema is a function of the commit you have checked out, and `migrate` on a fresh machine reproduces it exactly.\n\nThe schema builder is a thin, portable layer over `CREATE TABLE` and `ALTER TABLE`. Portability is a real benefit — the same migration runs on SQLite in CI and MySQL in production — but it is also the trap, because it hides how expensive the underlying DDL is. `$table->string('name', 50)->change()` is one line in PHP and a full table rebuild on an older MySQL, holding a metadata lock while it runs. Laravel 13 exposes MySQL's algorithm and lock modes directly (`->instant()`, `->lock('none')`) precisely so you can stop guessing. On a table with fifty million rows, the migration you write is a deployment risk, not a formality.\n\nTwo gotchas worth internalising. First, `change()` is declarative: it replaces the column definition wholesale, so any modifier you leave out — `unsigned`, `default`, `comment`, `nullable` — is dropped. Second, a `down()` method nobody ever runs is a lie; `migrate:rollback` in production is rare and dangerous, and the honest strategy on a live database is roll-forward with a new migration. Write `down()` anyway, because local development and `migrate:refresh` depend on it.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel 13: Database Migrations", url: "https://laravel.com/framework/docs/13.x/migrations", kind: "docs" },
        { label: "MySQL: Online DDL Operations", url: "https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-operations.html", kind: "docs" },
        { label: "Use The Index, Luke: Anatomy of an SQL Index", url: "https://use-the-index-luke.com/sql/anatomy", kind: "article" },
        { label: "SQLite: ALTER TABLE limitations", url: "https://www.sqlite.org/lang_altertable.html", kind: "docs" },
      ],
      video: {
        title: "Getting Started with Databases & Migrations in Laravel | Learn Laravel The Right Way",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=ZkDTqAi2_6s",
        videoId: "ZkDTqAi2_6s",
        durationLabel: "35:36",
      },
      alternateVideos: [
        {
          title: "Laravel 12 in 11 hours - Laravel for Beginners Full Course",
          channel: "The Codeholic",
          url: "https://www.youtube.com/watch?v=0M84Nk7iWkA",
          videoId: "0M84Nk7iWkA",
          startSeconds: 17787,
          chapterLabel: "Migrations",
          durationLabel: "10:54:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-migrations-q1",
          prompt:
            "A `votes` column is currently `INTEGER UNSIGNED NOT NULL DEFAULT 1` with a comment. A migration runs:\n\n```php\nSchema::table('users', function (Blueprint $table) {\n    $table->integer('votes')->change();\n});\n```\n\nWhat is the resulting column?",
          options: [
            "A signed `INTEGER` with no default and no comment",
            "`INTEGER UNSIGNED NOT NULL DEFAULT 1` with the comment intact",
            "`INTEGER UNSIGNED` with the default kept but the comment dropped",
            "Nothing changes, because the type is already `integer`",
          ],
          correctIndex: 0,
          explanation:
            "`change()` replaces the whole column definition, so every modifier you want to keep must be restated — `unsigned()`, `default(1)` and `comment(...)` are all lost here. It is not a partial patch of the existing definition.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-migrations-q2",
          prompt: "What column does `$table->foreignId('user_id')` create, and what does chaining `->constrained()` add?",
          options: [
            "An `UNSIGNED BIGINT` column; `constrained()` adds a foreign key to the `users` table inferred from the column name",
            "A signed `INT` column; `constrained()` adds a unique index on `user_id`",
            "An `UNSIGNED BIGINT` column; `constrained()` adds a plain index but no foreign key",
            "A `CHAR(36)` column; `constrained()` adds a foreign key to whatever table you pass it",
          ],
          correctIndex: 0,
          explanation:
            "`foreignId` matches the `UNSIGNED BIGINT` that `$table->id()` produces, and `constrained()` strips the `_id` suffix and pluralises it to guess the referenced table. A plain index is a side effect of the constraint, not the point of it.",
        },
        {
          id: "lv-eloquent-migrations-q3",
          prompt:
            "You ran `php artisan migrate` once and it applied four pending migrations. You then run `php artisan migrate:rollback`. What happens?",
          options: [
            "All four are rolled back, because they share one batch number",
            "Only the last migration is rolled back",
            "Nothing happens; you must pass `--step`",
            "All migrations ever run are rolled back",
          ],
          correctIndex: 0,
          explanation:
            "`rollback` reverses the most recent *batch*, and everything applied by a single `migrate` call is one batch. Running `migrate --step` puts each migration in its own batch, which is what makes per-migration rollback possible later.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-migrations-q4",
          prompt: "What is the difference between `migrate:refresh` and `migrate:fresh`?",
          options: [
            "`refresh` rolls back every migration via its `down()` and re-runs them; `fresh` drops all tables and re-runs",
            "`refresh` drops all tables; `fresh` only re-runs pending migrations",
            "They are aliases for the same command",
            "`refresh` re-runs the seeders; `fresh` re-runs the migrations",
          ],
          correctIndex: 0,
          explanation:
            "`refresh` depends on your `down()` methods actually working, so it fails on a broken or missing one. `fresh` sidesteps `down()` entirely by dropping every table — including ones no migration created, which is why it is dangerous on a shared database.",
        },
        {
          id: "lv-eloquent-migrations-q5",
          prompt: "Which statements about `php artisan schema:dump` are true? (Select all that apply.)",
          options: [
            "It writes the current schema to a single SQL file that new installs load instead of replaying every migration",
            "With `--prune` it deletes the migration files that have been rolled into the dump",
            "It only works on MariaDB, MySQL, PostgreSQL and SQLite, because it shells out to the database's CLI client",
            "It converts your migrations into a single new migration class",
            "It removes the need for a `migrations` table",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Squashing produces a schema file plus optionally prunes the now-redundant migrations, and it relies on the vendor's dump tool, so SQL Server is not supported. It does not generate a migration class, and the `migrations` table is still how Laravel tracks what has run.",
        },
        {
          id: "lv-eloquent-migrations-q6",
          prompt:
            "You need to add a nullable column to a 50-million-row MySQL table with as little disruption as possible. Which migration is most likely to complete near-instantly?",
          options: [
            "`$table->string('nickname')->nullable()->instant();`",
            "`$table->string('nickname')->nullable()->after('name')->instant();`",
            "`$table->string('nickname')->nullable()->first();`",
            "`$table->string('nickname')->nullable()->change();`",
          ],
          correctIndex: 0,
          explanation:
            "MySQL's INSTANT algorithm can only append a column to the end of the row format, so it cannot be combined with `after()` or `first()` — MySQL raises an error instead of silently falling back. `change()` on a column that does not exist is a different operation entirely.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-migrations-q7",
          prompt: "What does `php artisan migrate --pretend` do?",
          options: [
            "Prints the SQL the migrations would run without executing any of it",
            "Runs the migrations inside a transaction and rolls back at the end",
            "Runs the migrations against the `testing` connection",
            "Marks the migrations as run without executing them",
          ],
          correctIndex: 0,
          explanation:
            "`--pretend` is a dry run that dumps the statements, which is how you get a DBA to review a risky deploy. Nothing touches the database, so it is not a transaction-and-rollback trick and it does not update the `migrations` table.",
        },
        {
          id: "lv-eloquent-migrations-q8",
          prompt:
            "A migration adds a column for a feature that is still behind a flag and must not be applied yet. Which mechanism does Laravel provide for that?",
          options: [
            "A `shouldRun()` method on the migration that returns `false` to skip it",
            "A `$pending = true` property on the migration class",
            "Renaming the file so it sorts after the others",
            "Wrapping `up()` in `if (app()->isProduction())`",
          ],
          correctIndex: 0,
          explanation:
            "`shouldRun()` lets a migration opt out and stay pending, so it runs later without being edited. Wrapping `up()` in a condition is worse: the migration is recorded as run, so it will never execute again once the flag flips.",
        },
        {
          id: "lv-eloquent-migrations-q9",
          prompt: "Why do generated Laravel migrations return an anonymous class (`return new class extends Migration { ... };`) rather than a named one?",
          options: [
            "So two migrations can describe the same table without colliding on a class name",
            "Because named migration classes are not autoloadable from `database/migrations`",
            "Because anonymous classes run faster than named ones",
            "So the migration can be serialised into the `migrations` table",
          ],
          correctIndex: 0,
          explanation:
            "`database/migrations` is not PSR-4 autoloaded — files are required directly — so historically two `AddColumnToUsersTable` classes in the same run caused a fatal redeclaration error. Anonymous classes remove the name entirely.",
        },
        {
          id: "lv-eloquent-migrations-q10",
          prompt:
            "Your CI runs migrations against SQLite while production is MySQL. Which of these are genuine risks of that setup? (Select all that apply.)",
          options: [
            "SQLite's limited `ALTER TABLE` means Laravel rebuilds the table, so a change that is cheap in CI can be expensive in production",
            "Column types differ — several MySQL types map to SQLite `TEXT`, so a length or type bug passes CI",
            "Foreign key enforcement behaves differently unless it is explicitly enabled",
            "SQLite cannot run migrations inside a transaction, so a failed migration always leaves a half-built schema",
            "Index names are silently truncated on SQLite but not on MySQL",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Type mapping, ALTER semantics and foreign key pragmas are the three real divergences, and all three let a bad migration pass CI. SQLite does support transactional DDL, and index-name truncation is a MySQL identifier-length problem, not a SQLite one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "lv-eloquent-query-builder",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "The Query Builder",
      summary:
        "The query builder is the layer underneath Eloquent: a fluent, driver-aware SQL composer that returns plain `stdClass` rows rather than models. Every Eloquent query is a query builder query with a model hydrator bolted on, so understanding it is how you stop treating Eloquent as magic.\n\nReach for `DB::table(...)` when you want a set operation and not objects: a reporting aggregate over a million rows, a bulk `update` or `delete`, an `insert` of ten thousand rows. Hydrating a model per row costs memory and time for nothing if you are only summing a column. Reach for Eloquent when you want the model's behaviour — casts, accessors, relationships, events, scopes — because the query builder gives you none of it, and that cuts both ways: a `DB::table('users')->delete()` also skips your global scopes, your `SoftDeletes` trait and your observers.\n\nThe safety property that matters is bindings. Values passed to `where`, `whereIn` and friends go through PDO parameter binding and cannot be injected. Anything inside `DB::raw`, `selectRaw`, `orderByRaw` or `whereRaw` is concatenated into the SQL string, so the moment user input reaches one of those without going through the bindings array, you have written an injection. The second trap is `chunk()` while mutating: the chunks are `OFFSET`-paginated, so updating rows out of the filter as you go makes later chunks skip records. `chunkById()` walks the primary key instead and is the correct tool whenever the loop writes.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel 13: Query Builder", url: "https://laravel.com/framework/docs/13.x/queries", kind: "docs" },
        { label: "Laravel 13: Query Builder — Raw Expressions", url: "https://laravel.com/framework/docs/13.x/queries#raw-expressions", kind: "docs" },
        { label: "Use The Index, Luke: The Where Clause", url: "https://use-the-index-luke.com/sql/where-clause", kind: "article" },
        { label: "spatie/laravel-query-builder", url: "https://github.com/spatie/laravel-query-builder", kind: "repo" },
      ],
      video: {
        title: "Laravel 12 in 11 hours - Laravel for Beginners Full Course",
        channel: "The Codeholic",
        url: "https://www.youtube.com/watch?v=0M84Nk7iWkA",
        videoId: "0M84Nk7iWkA",
        startSeconds: 35642,
        chapterLabel: "Database Where Clause",
        durationLabel: "10:54:51",
      },
      alternateVideos: [
        {
          title: "Eloquent or Query Builder: When to Use Which?",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=uVsY_OXRq5o",
          videoId: "uVsY_OXRq5o",
          durationLabel: "5:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-query-builder-q1",
          prompt:
            "Which of these is vulnerable to SQL injection when `$sort` comes from a query string?\n\n```php\n// A\nDB::table('users')->where('name', $search)->get();\n// B\nDB::table('users')->orderByRaw(\"created_at $sort\")->get();\n// C\nDB::table('users')->whereRaw('votes > ?', [$min])->get();\n```",
          options: ["B only", "B and C", "A and B", "None of them — the builder always escapes"],
          correctIndex: 0,
          explanation:
            "A and C pass values as PDO bindings, which can never become SQL syntax. B interpolates `$sort` straight into the string, so `created_at; DROP TABLE users` is now your ORDER BY clause.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-query-builder-q2",
          prompt:
            "This loop is supposed to flag every unflagged user. Why does it miss records?\n\n```php\nDB::table('users')->where('flagged', false)\n    ->chunk(100, function ($users) {\n        foreach ($users as $user) {\n            DB::table('users')->where('id', $user->id)->update(['flagged' => true]);\n        }\n    });\n```",
          options: [
            "`chunk` pages with `OFFSET`, and updating rows out of the `where` shifts every later page",
            "`chunk` caches the first page and replays it, so the same 100 rows are processed repeatedly",
            "`chunk` requires an explicit `orderBy`, and without one the driver returns rows at random",
            "The nested `update` opens a second connection that cannot see uncommitted rows",
          ],
          correctIndex: 0,
          explanation:
            "Each chunk re-runs the query with a bigger `OFFSET`, but the result set shrank because the rows you just flagged no longer match, so roughly half the records are skipped. `chunkById` paginates on the primary key and is immune to this.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-query-builder-q3",
          prompt: "What does `DB::table('users')->get()` return the rows as?",
          options: [
            "A `Collection` of `stdClass` objects",
            "A `Collection` of `User` models",
            "A plain PHP array of associative arrays",
            "An `Illuminate\\Database\\Eloquent\\Collection`",
          ],
          correctIndex: 0,
          explanation:
            "The query builder hydrates nothing: you get a support `Collection` wrapping `stdClass` rows, so no casts, accessors or relationships are available. Model hydration is exactly what the Eloquent builder adds on top.",
        },
        {
          id: "lv-eloquent-query-builder-q4",
          prompt:
            "What SQL does this produce, logically?\n\n```php\nDB::table('users')\n    ->where('active', 1)\n    ->where('role', 'admin')\n    ->orWhere('role', 'owner')\n    ->get();\n```",
          options: [
            "`(active = 1 AND role = 'admin') OR role = 'owner'`",
            "`active = 1 AND (role = 'admin' OR role = 'owner')`",
            "`active = 1 OR role = 'admin' OR role = 'owner'`",
            "It throws, because `orWhere` cannot follow two `where` calls",
          ],
          correctIndex: 0,
          explanation:
            "`orWhere` is appended flatly, and SQL's `AND` binds tighter than `OR`, so an inactive owner is returned. The fix is `->where(fn ($q) => $q->where('role', 'admin')->orWhere('role', 'owner'))`, which groups the alternatives in parentheses.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-query-builder-q5",
          prompt: "You need only to know whether any matching row exists. Which is the best call?",
          options: [
            "`->exists()`",
            "`->count() > 0`",
            "`->get()->isNotEmpty()`",
            "`->first() !== null`",
          ],
          correctIndex: 0,
          explanation:
            "`exists()` issues a `select exists(...)` that the engine can stop at the first matching row. `count()` makes the database count every match, and `get()` transfers and hydrates them all just to throw them away.",
        },
        {
          id: "lv-eloquent-query-builder-q6",
          prompt: "Which pairs of builder methods and their return values are correct? (Select all that apply.)",
          options: [
            "`value('email')` returns the single column value from the first row",
            "`pluck('email', 'id')` returns a collection keyed by `id`",
            "`update([...])` returns the number of affected rows",
            "`insert([...])` returns the inserted primary key",
            "`first()` returns an empty collection when nothing matches",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`insert` returns a boolean — `insertGetId` is the one that returns the new key — and `first()` returns `null`, not an empty collection, which is why `?->` and `firstOrFail()` exist.",
        },
        {
          id: "lv-eloquent-query-builder-q7",
          prompt:
            "What is the point of `when()` in a filter-building method?\n\n```php\n$query->when($request->status, fn ($q, $status) => $q->where('status', $status));\n```",
          options: [
            "It applies the closure only when the value is truthy, keeping the chain unbroken",
            "It defers the closure until the query executes, so the value can change later",
            "It caches the query when the condition is met",
            "It runs the closure inside a transaction",
          ],
          correctIndex: 0,
          explanation:
            "`when` is conditional chaining sugar — the closure receives the value as its second argument — which removes a pile of `if` statements around a builder. It has nothing to do with deferral or caching.",
        },
        {
          id: "lv-eloquent-query-builder-q8",
          prompt: "Laravel 13 adds `whereVectorSimilarTo`. Which statements about it are accurate? (Select all that apply.)",
          options: [
            "It filters by cosine similarity and, by default, also orders results most-similar-first",
            "It accepts a `minSimilarity` threshold between 0.0 and 1.0",
            "It is supported on PostgreSQL with pgvector and on MariaDB 11.7+",
            "It works on any connection, falling back to an in-PHP similarity scan",
            "It requires the column to be a JSON column",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Vector clauses compile to the driver's own vector operators, so they need a database that has them — there is no PHP fallback, and the column is a dedicated vector type, not JSON.",
        },
        {
          id: "lv-eloquent-query-builder-q9",
          prompt: "You need to compare two columns on the same row, e.g. rows where `updated_at` is later than `created_at`. Which is correct?",
          options: [
            "`->whereColumn('updated_at', '>', 'created_at')`",
            "`->where('updated_at', '>', 'created_at')`",
            "`->where('updated_at', '>', DB::raw('created_at'))`",
            "`->having('updated_at', '>', 'created_at')`",
          ],
          correctIndex: 0,
          explanation:
            "`whereColumn` tells the builder the right-hand side is an identifier, not a value. Plain `where` binds `'created_at'` as the *string* `'created_at'` and compares a timestamp with it, which is almost always false rather than an error.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-query-builder-q10",
          prompt: "Your model has a `SoftDeletes` trait and a global `published` scope. You run `DB::table('posts')->delete()`. What happens?",
          options: [
            "Every row is hard-deleted; neither the scope nor soft deletes apply",
            "Only published rows are soft-deleted",
            "Every row is soft-deleted by setting `deleted_at`",
            "It throws, because the table is managed by a model with global scopes",
          ],
          correctIndex: 0,
          explanation:
            "`DB::table` bypasses the model entirely, so scopes, traits, casts and events do not exist for that query. That is occasionally what you want for a maintenance script, and a disaster when you thought you were talking to the model.",
        },
      ],
    },
    {
      id: "lv-eloquent-models",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Models, Conventions and Mass Assignment",
      summary:
        "An Eloquent model is Active Record: one class that is simultaneously the row, the table gateway and the domain object. Fowler's pattern note is still the honest framing — it is wonderful for CRUD-shaped applications and it gets uncomfortable when domain logic outgrows the table, because the model inherits persistence whether it wants it or not. That tradeoff is the reason larger Laravel codebases push behaviour into services, actions and value objects while leaving the model as a thin, well-typed row.\n\nThe conventions are worth knowing exactly, because every one of them is a silent default you will eventually need to override: the table is the snake-case plural of the class, the key is an auto-incrementing `id`, and `created_at`/`updated_at` are maintained for you unless `$timestamps` is false. Convention makes the first hundred models free; it makes the one model mapped to a legacy table with a `CustomerNumber` key confusing until you set `$table`, `$primaryKey`, `$keyType` and `$incrementing` explicitly.\n\nMass assignment protection is the one convention that is a security control, not a convenience. `Model::create($request->all())` takes whatever the client sent, so without a whitelist a stray `is_admin=1` field becomes a privilege escalation. Laravel 13 expresses the whitelist as PHP attributes — `#[Fillable([...])]`, `#[Guarded([...])]`, `#[Unguarded]` — alongside the classic `$fillable`/`$guarded` properties. The trap is that non-fillable keys are *silently dropped*, so \"my update isn't saving\" is usually a forgotten `$fillable` entry; turn on `Model::preventSilentlyDiscardingAttributes()` locally and it becomes an exception instead of an afternoon.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel 13: Eloquent — Model Conventions", url: "https://laravel.com/framework/docs/13.x/eloquent#eloquent-model-conventions", kind: "docs" },
        { label: "Laravel 13: Eloquent — Mass Assignment", url: "https://laravel.com/framework/docs/13.x/eloquent#mass-assignment", kind: "docs" },
        { label: "Martin Fowler: Active Record", url: "https://martinfowler.com/eaaCatalog/activeRecord.html", kind: "article" },
        { label: "PHP Manual: Attributes overview", url: "https://www.php.net/manual/en/language.attributes.overview.php", kind: "docs" },
      ],
      video: {
        title: "30 Days to Learn Laravel - Complete 8 Hour Course",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=SqTdHCTWqks",
        videoId: "SqTdHCTWqks",
        startSeconds: 6231,
        chapterLabel: "09 Meet Eloquent",
        durationLabel: "8:29:58",
      },
      alternateVideos: [
        {
          title: "Laravel mass assignment and fillable vs guarded",
          channel: "cdruc",
          url: "https://www.youtube.com/watch?v=onA9syquR9w",
          videoId: "onA9syquR9w",
          durationLabel: "6:30",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-models-q1",
          prompt: "Which table does an Eloquent model `App\\Models\\BlogPost` use by default?",
          options: ["`blog_posts`", "`blogposts`", "`BlogPosts`", "`blog_post`"],
          correctIndex: 0,
          explanation:
            "The class name is converted to snake case and pluralised. Only the plural is pluralised — `BlogPost` becomes `blog_posts`, not `blogs_posts` — and anything else needs an explicit `$table`.",
        },
        {
          id: "lv-eloquent-models-q2",
          prompt:
            "A `User` model is mapped to a legacy table whose key is a non-incrementing `uuid` string column named `user_uuid`. Which properties must you set? (Select all that apply.)",
          options: [
            "`protected $primaryKey = 'user_uuid';`",
            "`public $incrementing = false;`",
            "`protected $keyType = 'string';`",
            "`protected $casts = ['user_uuid' => 'string'];`",
            "`public $timestamps = false;`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Without `$incrementing = false` and `$keyType = 'string'`, Eloquent casts the key to an integer, and a UUID casts to 0 — so `find()` quietly returns nothing. A cast on the key is not what controls this, and timestamps are an unrelated decision.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-models-q3",
          prompt:
            "A controller does `User::create($request->all())` and the model declares `#[Fillable(['name', 'email'])]`. The request body includes `is_admin=1`. What happens?",
          options: [
            "The user is created and `is_admin` is silently ignored",
            "A `MassAssignmentException` is thrown",
            "The user is created with `is_admin` set to 1",
            "The request is rejected by the framework before it reaches the controller",
          ],
          correctIndex: 0,
          explanation:
            "Unfillable keys are discarded without a word by default. That is the safe outcome here but the same silence is why a legitimate field you forgot to whitelist \"doesn't save\" — hence `preventSilentlyDiscardingAttributes()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-models-q4",
          prompt: "What does `Model::preventSilentlyDiscardingAttributes()` change, and where should it be enabled?",
          options: [
            "It throws when you fill a non-fillable attribute; enable it in non-production environments from `AppServiceProvider::boot()`",
            "It throws when you read an attribute that was not selected; enable it globally",
            "It makes every attribute fillable; enable it only in tests",
            "It logs discarded attributes to the query log; enable it in production",
          ],
          correctIndex: 0,
          explanation:
            "It converts a silent drop into a loud failure, which is what you want while developing. Gating it on `! app()->isProduction()` keeps a forgotten whitelist entry from taking a live request down.",
        },
        {
          id: "lv-eloquent-models-q5",
          prompt:
            "Which of these is the genuine risk of `#[Unguarded]` (or `protected $guarded = [];`) on a model?",
          options: [
            "Any array you pass to `create`/`fill`/`update` can set any column, so unfiltered request input becomes privilege escalation",
            "Eloquent stops applying casts to that model's attributes",
            "The model's timestamps are no longer maintained",
            "Validation rules defined on form requests are skipped",
          ],
          correctIndex: 0,
          explanation:
            "Unguarding is fine if every array reaching the model is hand-built, e.g. `create($request->validated())` with a strict rule set. It becomes a vulnerability the first time someone writes `create($request->all())`.",
        },
        {
          id: "lv-eloquent-models-q6",
          prompt: "Which statement about `$fillable` and `$guarded` is correct?",
          options: [
            "They are mutually exclusive whitelisting/blacklisting strategies; you pick one",
            "Both must be declared, or `create()` throws",
            "`$guarded` takes precedence, so listing a column in both makes it fillable",
            "`$fillable` protects reads and `$guarded` protects writes",
          ],
          correctIndex: 0,
          explanation:
            "`$fillable` is an allow list and `$guarded` a deny list; declaring one is enough, and mixing them is a source of confusion rather than a feature. Neither has anything to do with reading attributes.",
        },
        {
          id: "lv-eloquent-models-q7",
          prompt:
            "You want a new `Order` to default to `status = 'pending'` even before it is saved, without touching the database default. What does Eloquent offer?",
          options: [
            "`protected $attributes = ['status' => 'pending'];` on the model",
            "`protected $defaults = ['status' => 'pending'];` on the model",
            "A `creating` event that sets the attribute",
            "A `default` entry in the `casts()` array",
          ],
          correctIndex: 0,
          explanation:
            "`$attributes` seeds the attribute array for new instances, so `new Order()->status` is already `'pending'`. A `creating` listener also works but only fires at save time, so the in-memory model is inconsistent until then.",
        },
        {
          id: "lv-eloquent-models-q8",
          prompt: "Which of these are true about Eloquent's timestamp handling? (Select all that apply.)",
          options: [
            "`created_at` and `updated_at` are maintained automatically unless `$timestamps` is `false`",
            "A mass update via `Model::where(...)->update([...])` still sets `updated_at`",
            "`touch()` updates `updated_at` without changing any other attribute",
            "`save()` on an unchanged model still bumps `updated_at`",
            "Timestamps are stored in the application's display timezone",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Eloquent's builder adds `updated_at` to mass updates, which is why `DB::table()` and `Model::where()` behave differently. `save()` on a clean model performs no update at all, and timestamps are stored in UTC.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-models-q9",
          prompt:
            "What is the practical consequence of Eloquent being an Active Record implementation with no identity map?",
          options: [
            "`User::find(1)` twice gives two separate objects, so a change to one is invisible to the other",
            "Models cannot be compared with `is()`",
            "Two models of different classes can never share a primary key",
            "Relationships must always be eager loaded",
          ],
          correctIndex: 0,
          explanation:
            "Unlike Doctrine, Eloquent does not track one canonical instance per row, so the same row can exist as several diverging PHP objects in one request. `$a->is($b)` compares keys, table and connection precisely because object identity will not do it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-models-q10",
          prompt: "Which `make:model` invocation generates the model plus a migration, factory, seeder and controller in one go?",
          options: ["`php artisan make:model Flight -mfsc`", "`php artisan make:model Flight --all-the-things`", "`php artisan make:model Flight -crR`", "`php artisan make:model Flight --resource`"],
          correctIndex: 0,
          explanation:
            "`-m`, `-f`, `-s` and `-c` are migration, factory, seeder and controller and combine freely. `-crR` is the controller/resource/form-request combination, which is a different set.",
        },
      ],
    },
    {
      id: "lv-eloquent-retrieving",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Retrieving and Persisting Models",
      summary:
        "Every Eloquent model doubles as a query builder, so `Flight::where('active', 1)->orderBy('name')->limit(10)->get()` is one object graph, not two APIs. What you need to hold in your head is which terminal method hydrates what: `get()` returns a collection, `first()` and `find()` return a model or `null`, the `...OrFail()` variants throw a `ModelNotFoundException` that Laravel renders as a 404, and `value()` and `pluck()` skip hydration for a single column.\n\nMemory is the axis on which this topic actually matters. `all()` and `get()` load the entire result set into PHP objects, which is fine for a page of results and fatal for a nightly export. `chunk()` and `chunkById()` hold one page at a time; `lazy()` gives you a `LazyCollection` that still chunks underneath but reads like a single stream; `cursor()` runs one query and hydrates one model at a time via a generator, which is the cheapest option and the one that cannot eager load relationships. Pick `lazy()` when you need relationships, `cursor()` when you do not.\n\nOn the write side the distinction that catches people is instance versus mass operations. `$model->save()`, `->update()`, `->delete()` and `Model::destroy($ids)` all load models and fire events; `Model::where(...)->update([...])` and `->delete()` do not, because no model is ever instantiated. That makes mass operations fast and makes them skip your observers, your `SoftDeletes` bookkeeping expectations and anything you assumed would run on save. `isDirty()`, `getOriginal()`, `getChanges()` and `wasChanged()` are how you inspect what actually moved — before the save and after it, respectively.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel 13: Eloquent — Retrieving Models", url: "https://laravel.com/framework/docs/13.x/eloquent#retrieving-models", kind: "docs" },
        { label: "Laravel 13: Eloquent — Inserting and Updating Models", url: "https://laravel.com/framework/docs/13.x/eloquent#inserting-and-updating-models", kind: "docs" },
        { label: "PHP Manual: Generators overview", url: "https://www.php.net/manual/en/language.generators.overview.php", kind: "docs" },
        { label: "MySQL: INSERT ... ON DUPLICATE KEY UPDATE", url: "https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html", kind: "docs" },
      ],
      video: {
        title: "Laravel 12 in 11 hours - Laravel for Beginners Full Course",
        channel: "The Codeholic",
        url: "https://www.youtube.com/watch?v=0M84Nk7iWkA",
        videoId: "0M84Nk7iWkA",
        startSeconds: 20112,
        chapterLabel: "Eloquent ORM Basics",
        durationLabel: "10:54:51",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-retrieving-q1",
          prompt: "What is the difference between `Flight::find(99)` and `Flight::findOrFail(99)` when row 99 does not exist?",
          options: [
            "`find` returns `null`; `findOrFail` throws a `ModelNotFoundException`, which renders as a 404",
            "`find` returns an empty model; `findOrFail` returns `null`",
            "`find` throws; `findOrFail` returns `false`",
            "Both return `null`, but `findOrFail` also logs a warning",
          ],
          correctIndex: 0,
          explanation:
            "The `OrFail` variants exist so controllers can skip null checks — Laravel's exception handler turns `ModelNotFoundException` into a 404 response. `find` returning `null` is why `$flight->name` then dies with a null-property error three lines later.",
        },
        {
          id: "lv-eloquent-retrieving-q2",
          prompt: "You need to iterate 2 million rows and read one relationship per row. Which approach is correct?",
          options: [
            "`Model::with('relation')->lazy()` — it chunks under the hood and supports eager loading",
            "`Model::with('relation')->cursor()` — one query, one model in memory",
            "`Model::with('relation')->all()` — Eloquent streams `all()` automatically",
            "`Model::with('relation')->get()->chunk(1000)`",
          ],
          correctIndex: 0,
          explanation:
            "`cursor()` keeps only a single model in memory and therefore cannot eager load anything. `get()` (and `all()`) materialise all 2 million models before `chunk()` ever runs, which is the memory blow-up you were trying to avoid.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-retrieving-q3",
          prompt:
            "Which of these fire the `updating`/`updated` model events? (Select all that apply.)",
          options: [
            "`$flight->update(['delayed' => 1]);`",
            "`$flight->delayed = 1; $flight->save();`",
            "`Flight::where('active', 1)->update(['delayed' => 1]);`",
            "`Flight::destroy([1, 2, 3]);`",
            "`DB::table('flights')->update(['delayed' => 1]);`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Events need a model instance. A mass update never retrieves one, so nothing fires; `destroy()` does load each model but fires `deleting`/`deleted`, not `updating`. `DB::table` is outside Eloquent altogether.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-retrieving-q4",
          prompt: "What is the difference between `firstOrCreate` and `firstOrNew`?",
          options: [
            "`firstOrCreate` persists the new model; `firstOrNew` returns an unsaved instance you must `save()`",
            "`firstOrNew` persists; `firstOrCreate` only builds the query",
            "`firstOrCreate` throws if the record exists; `firstOrNew` updates it",
            "They are aliases; `firstOrNew` is the older name",
          ],
          correctIndex: 0,
          explanation:
            "Both look the record up by the first array and merge the second array in when creating. Only `firstOrCreate` writes — which is why `firstOrNew` is handy when you still want to mutate the instance before saving.",
        },
        {
          id: "lv-eloquent-retrieving-q5",
          prompt:
            "What does this print?\n\n```php\n$user = User::find(1);   // name = 'John'\n$user->name = 'Jack';\necho $user->getOriginal('name');\n$user->save();\necho $user->getChanges()['name'] ?? 'none';\n```",
          options: ["`John` then `Jack`", "`Jack` then `Jack`", "`John` then `none`", "`Jack` then `John`"],
          correctIndex: 0,
          explanation:
            "`getOriginal()` reports the state as loaded, regardless of in-memory edits. `getChanges()` reports what moved during the last save, so it is empty before `save()` and contains `name` after it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-retrieving-q6",
          prompt: "When is `isDirty()` true versus `wasChanged()`?",
          options: [
            "`isDirty()` before saving, for pending modifications; `wasChanged()` after saving, for what the save actually wrote",
            "They are the same; `wasChanged()` is deprecated",
            "`isDirty()` checks the database; `wasChanged()` checks memory",
            "`isDirty()` is true only for mass-assigned attributes",
          ],
          correctIndex: 0,
          explanation:
            "`isDirty()` compares current attributes with the original set and goes false after a successful save. `wasChanged()` is the post-save view, which is what an `updated` observer should inspect.",
        },
        {
          id: "lv-eloquent-retrieving-q7",
          prompt:
            "`Flight::upsert($rows, uniqueBy: ['departure', 'destination'], update: ['price'])` is run against MySQL. Which statements are true? (Select all that apply.)",
          options: [
            "The columns in `uniqueBy` must be covered by a primary or unique index",
            "It sets `created_at`/`updated_at` automatically when the model uses timestamps",
            "MySQL ignores the `uniqueBy` argument and uses the table's own unique indexes to detect conflicts",
            "It fires the `saving`/`saved` events for every affected row",
            "It falls back to one `SELECT` plus one `INSERT` or `UPDATE` per row",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`upsert` compiles to a single bulk statement — `ON DUPLICATE KEY UPDATE` on MySQL — so there are no per-row round trips and no model events. The MySQL/MariaDB drivers genuinely ignore `uniqueBy` and rely on the table's indexes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-retrieving-q8",
          prompt: "What is the difference between `$model->fresh()` and `$model->refresh()`?",
          options: [
            "`fresh()` returns a new instance reloaded from the database; `refresh()` reloads the current instance in place",
            "`fresh()` clears the attributes; `refresh()` clears loaded relationships",
            "`fresh()` re-runs the model's global scopes; `refresh()` skips them",
            "They are identical; `refresh()` is the fluent alias",
          ],
          correctIndex: 0,
          explanation:
            "`fresh()` leaves your existing object untouched and hands back a second one; `refresh()` discards unsaved changes on the object you already hold and re-hydrates its loaded relationships too.",
        },
        {
          id: "lv-eloquent-retrieving-q9",
          prompt: "Why does `Flight::destroy([1, 2, 3])` cost three `SELECT`s plus three `DELETE`s rather than a single `DELETE ... WHERE id IN (1,2,3)`?",
          options: [
            "It loads each model individually so the `deleting`/`deleted` events fire for each one",
            "It cannot build an `IN` clause from an array",
            "It runs each delete in its own transaction for safety",
            "It re-checks each model against the global scopes",
          ],
          correctIndex: 0,
          explanation:
            "`destroy` is deliberately the model-aware path. If you want a single statement and can live without events, `Flight::whereIn('id', $ids)->delete()` is the mass-delete version.",
        },
        {
          id: "lv-eloquent-retrieving-q10",
          prompt: "Which retrieval call issues the least work for \"the email address of the most recently created user\"?",
          options: [
            "`User::latest()->value('email')`",
            "`User::latest()->first()->email`",
            "`User::all()->sortByDesc('created_at')->first()->email`",
            "`User::latest()->get()->pluck('email')->first()`",
          ],
          correctIndex: 0,
          explanation:
            "`value()` selects one column from one row and skips model hydration entirely. The `all()` option is the worst of the four: it drags the whole table into PHP and sorts it there instead of in the database.",
        },
      ],
    },
    {
      id: "lv-eloquent-relationships",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Relationships: One-to-One, One-to-Many and Many-to-Many",
      summary:
        "A relationship method returns a relation object, not data. That single fact explains most of Eloquent's relationship behaviour: `$user->posts()` hands you a query builder you can keep constraining, while `$user->posts` executes it and caches the resulting collection on the model. Calling the property twice costs one query; calling the method twice costs two.\n\nThe conventions differ between the two sides and the difference bites. On `hasOne`/`hasMany`, the foreign key is derived from the **parent model's** name — `User::posts()` looks for `user_id` on `posts`. On `belongsTo`, it is derived from the **relationship method's** name — a method called `author()` looks for `author_id`, even though the related class is `User`. Rename the method and you silently change the column it queries. For `belongsToMany`, the pivot table defaults to the two model names, singular, snake-cased and joined in alphabetical order (`role_user`), and pivot columns are invisible unless you declare them with `withPivot`.\n\nMany-to-many writes are where correctness lives. `attach` adds rows and happily creates duplicates; `sync` makes the set match exactly, detaching anything not in the array; `syncWithoutDetaching` adds without removing; `toggle` flips membership. A \"remove from cart\" bug is usually `sync` where `syncWithoutDetaching` was meant, or the reverse. `hasManyThrough` is a read-only convenience over two joins — it saves you a loop, it does not give you a place to write, and on a deep chain it is often clearer to eager load both hops explicitly.",
      level: "advanced",
      estMinutes: 70,
      webRefs: [
        { label: "Laravel 13: Eloquent Relationships", url: "https://laravel.com/framework/docs/13.x/eloquent-relationships", kind: "docs" },
        { label: "Laravel 13: Many to Many Relationships", url: "https://laravel.com/framework/docs/13.x/eloquent-relationships#many-to-many", kind: "docs" },
        { label: "Jonathan Reinink: Dynamic relationships in Laravel using subqueries", url: "https://reinink.ca/articles/dynamic-relationships-in-laravel-using-subqueries", kind: "article" },
        { label: "laravel/framework: BelongsToMany.php", url: "https://github.com/laravel/framework/blob/13.x/src/Illuminate/Database/Eloquent/Relations/BelongsToMany.php", kind: "repo" },
      ],
      video: {
        title: "30 Days to Learn Laravel - Complete 8 Hour Course",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=SqTdHCTWqks",
        videoId: "SqTdHCTWqks",
        startSeconds: 8485,
        chapterLabel: "11 Two Key Eloquent Relationship Types",
        durationLabel: "8:29:58",
      },
      alternateVideos: [
        {
          title: "30 Days to Learn Laravel - Complete 8 Hour Course",
          channel: "Laracasts",
          url: "https://www.youtube.com/watch?v=SqTdHCTWqks",
          videoId: "SqTdHCTWqks",
          startSeconds: 8953,
          chapterLabel: "12 Pivot Tables and BelongsToMany Relationships",
          durationLabel: "8:29:58",
        },
        {
          title: "NEW in Laravel 9.51: hasManyThrough Shorter Syntax",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=6DvUNEwICno",
          videoId: "6DvUNEwICno",
          durationLabel: "5:56",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-relationships-q1",
          prompt:
            "Which column does Eloquent look for here?\n\n```php\nclass Post extends Model\n{\n    public function author(): BelongsTo\n    {\n        return $this->belongsTo(User::class);\n    }\n}\n```",
          options: ["`author_id` on `posts`", "`user_id` on `posts`", "`post_id` on `users`", "`author_id` on `users`"],
          correctIndex: 0,
          explanation:
            "`belongsTo` derives the foreign key from the *method* name plus `_id`, not from the related class. Renaming `user()` to `author()` therefore changes the column queried, which is why this relationship breaks silently during a refactor unless you pass the key explicitly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-relationships-q2",
          prompt: "What is the difference between `$user->posts` and `$user->posts()`?",
          options: [
            "The property runs the query once and caches the collection; the method returns a query builder you can constrain further",
            "The property returns an array; the method returns a collection",
            "The property is lazy; the method is eager",
            "The property only works after `with('posts')`",
          ],
          correctIndex: 0,
          explanation:
            "`$user->posts()->where('active', 1)->get()` is the constrainable form. Accessing the property a second time reuses the cached relation, which is also why `$user->posts` does not see rows inserted after the first access until you `refresh()` or `load()`.",
        },
        {
          id: "lv-eloquent-relationships-q3",
          prompt: "A `User` belongsToMany `Role` with no arguments. What pivot table and columns does Eloquent expect?",
          options: [
            "`role_user` with `user_id` and `role_id`",
            "`user_role` with `user_id` and `role_id`",
            "`users_roles` with `users_id` and `roles_id`",
            "`role_user` with `users_id` and `roles_id`",
          ],
          correctIndex: 0,
          explanation:
            "The table name is the two model names, singular and snake-cased, joined in alphabetical order — so `role_user`, not `user_role`. The key columns are the singular model names plus `_id`.",
        },
        {
          id: "lv-eloquent-relationships-q4",
          prompt:
            "`$user->roles` currently contains roles 1 and 2. What is the state after `$user->roles()->sync([2, 3]);`?",
          options: [
            "Roles 2 and 3; role 1 is detached",
            "Roles 1, 2 and 3",
            "Roles 2 and 3, plus a duplicate pivot row for role 2",
            "Roles 1 and 2 are unchanged and role 3 is ignored",
          ],
          correctIndex: 0,
          explanation:
            "`sync` makes the set match the array exactly, so anything absent is detached and existing rows are left alone rather than duplicated. Use `syncWithoutDetaching([3])` when you only want to add.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-relationships-q5",
          prompt:
            "The pivot table `role_user` has an `active` column, but `$user->roles->first()->pivot->active` is `null`. Why?",
          options: [
            "Pivot columns beyond the two keys are not selected unless you declare `->withPivot('active')`",
            "Pivot attributes are only available after calling `->attach()`",
            "`pivot` only exposes columns that are in the model's `$fillable`",
            "Pivot columns must be cast before they can be read",
          ],
          correctIndex: 0,
          explanation:
            "Eloquent only selects the two foreign keys by default to keep the join narrow. `withPivot('active')` adds it to the select list; `withTimestamps()` does the same for the pivot's `created_at`/`updated_at`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-relationships-q6",
          prompt: "Which statements about `hasManyThrough` are true? (Select all that apply.)",
          options: [
            "It reads distant records through an intermediate model, e.g. `Application` → `Environment` → `Deployment`",
            "The foreign keys live on the intermediate and final tables, not on the parent",
            "It is a read relationship — you cannot `create()` through it the way you can with `hasMany`",
            "It requires a pivot table between the parent and the distant model",
            "It automatically eager loads the intermediate model onto each result",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`hasManyThrough` is a join, not a pivot relationship, and it does not hydrate the intermediate model — if you need the `Environment` for each `Deployment`, load it explicitly.",
        },
        {
          id: "lv-eloquent-relationships-q7",
          prompt:
            "You want posts that have at least one published comment, and you want the query to stay in SQL. Which is right?",
          options: [
            "`Post::whereHas('comments', fn ($q) => $q->where('published', true))->get()`",
            "`Post::with('comments')->get()->filter(fn ($p) => $p->comments->where('published', true)->isNotEmpty())`",
            "`Post::has('comments', '>', 0)->where('published', true)->get()`",
            "`Post::join('comments')->where('published', true)->get()`",
          ],
          correctIndex: 0,
          explanation:
            "`whereHas` compiles to a correlated `EXISTS` subquery, so the database does the filtering. The `with(...)->filter(...)` version pulls every post and every comment into PHP first, and the `has(...)->where('published')` version applies `published` to `posts`, not to `comments`.",
        },
        {
          id: "lv-eloquent-relationships-q8",
          prompt: "What does `->withDefault()` on a `belongsTo` relationship do?",
          options: [
            "Returns an empty model instead of `null` when the related row is missing, so `$post->author->name` does not fatal",
            "Creates the related row in the database if it is missing",
            "Eager loads the relationship on every query",
            "Sets a default foreign key value on insert",
          ],
          correctIndex: 0,
          explanation:
            "It is the null-object pattern for relationships, and it accepts an array or closure to populate the placeholder. It never writes anything — `firstOrCreate` on the relation is what creates a row.",
        },
        {
          id: "lv-eloquent-relationships-q9",
          prompt: "Which of these attach a `Comment` to a `Post` correctly and set the foreign key? (Select all that apply.)",
          options: [
            "`$post->comments()->save($comment);`",
            "`$post->comments()->create(['body' => '…']);`",
            "`$comment->post()->associate($post); $comment->save();`",
            "`$post->comments()->attach($comment);`",
            "`$post->comments->push($comment);`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`save`, `create` and `associate` all write the foreign key. `attach` is a many-to-many operation and will fail on a `hasMany`, and `push` only mutates the in-memory collection.",
        },
        {
          id: "lv-eloquent-relationships-q10",
          prompt:
            "How many queries does this run, assuming 10 posts each with comments?\n\n```php\n$posts = Post::withCount('comments')->get();\nforeach ($posts as $post) {\n    echo $post->comments_count;\n}\n```",
          options: ["1", "2", "11", "21"],
          correctIndex: 0,
          explanation:
            "`withCount` adds a correlated subquery to the same `SELECT`, producing a `comments_count` attribute with no extra round trip. `with('comments')` would be two queries and would load every comment row you did not need.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-relationships-q11",
          prompt: "`$user->roles()->attach($roleId)` is called twice with the same role. What happens by default?",
          options: [
            "Two pivot rows exist, unless a unique index on the pivot prevents it",
            "The second call is a no-op because Eloquent checks first",
            "The second call throws a `RelationNotFoundException`",
            "The pivot row is updated rather than duplicated",
          ],
          correctIndex: 0,
          explanation:
            "`attach` is a plain insert with no existence check, so duplicate membership is a real and common bug. A composite unique index on the pivot keys — or `syncWithoutDetaching` — is the fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-relationships-q12",
          prompt: "What does `updateExistingPivot($roleId, ['active' => false])` do that `sync` cannot?",
          options: [
            "Updates pivot columns on one existing row without touching membership",
            "Adds the role if it is missing and updates it otherwise",
            "Updates the related `roles` row rather than the pivot row",
            "Removes every other role while updating this one",
          ],
          correctIndex: 0,
          explanation:
            "`sync` is about which rows exist; `updateExistingPivot` is about the payload on one row that already exists. `sync([$roleId => ['active' => false]])` can also set pivot data, but it detaches every other role as a side effect.",
        },
      ],
    },
    {
      id: "lv-eloquent-polymorphic",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Polymorphic Relationships",
      summary:
        "A polymorphic relationship lets one table point at rows in several others: one `comments` table serving posts, videos and products, rather than `post_comments`, `video_comments` and `product_comments`. The mechanism is two columns — `commentable_id` and `commentable_type` — where the type column stores which model the id refers to. `$table->morphs('commentable')` creates both plus a composite index on `(type, id)`, which is the index order the lookup actually needs.\n\nThe cost is that the database can no longer help you. A foreign key constraint points at exactly one table, so polymorphic columns cannot have one: nothing stops a `commentable_id` from outliving the row it named, and `ON DELETE CASCADE` is not available, so orphan cleanup becomes application code (an observer, or a scheduled prune). You also lose efficient joins in raw SQL and reporting, because every query needs the type predicate. Reach for polymorphism when the child genuinely has identical shape and behaviour across parents — comments, tags, attachments, audit entries — and resist it when each parent wants different columns; two tables with real constraints beat one table with a discriminator you have to trust.\n\nThe gotcha that eventually costs a migration: by default the type column stores the fully-qualified class name, so `App\\Models\\Post` is baked into your data. Move or rename that class and every stored row is wrong. `Relation::enforceMorphMap(['post' => Post::class, …])` in a service provider maps short aliases to classes and makes the strict form throw on any unmapped model — do it on day one, not after the first rename.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel 13: Polymorphic Relationships", url: "https://laravel.com/framework/docs/13.x/eloquent-relationships#polymorphic-relationships", kind: "docs" },
        { label: "Laravel 13: Migrations — the morphs() column method", url: "https://laravel.com/framework/docs/13.x/migrations#column-method-morphs", kind: "docs" },
        { label: "PostgreSQL: Constraints (foreign keys)", url: "https://www.postgresql.org/docs/current/ddl-constraints.html", kind: "docs" },
        { label: "Use The Index, Luke: Concatenated keys", url: "https://use-the-index-luke.com/sql/where-clause/the-equals-operator/concatenated-keys", kind: "article" },
      ],
      video: {
        title: "Eloquent Polymorphic Relations: Properly Explained",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=rx1DQBE01b0",
        videoId: "rx1DQBE01b0",
        durationLabel: "9:55",
      },
      alternateVideos: [
        {
          title: "Laravel 12 Polymorphic Relationships Explained | One Model to Multiple Tables",
          channel: "Code With ERaufi",
          url: "https://www.youtube.com/watch?v=8aLPIjSnaug",
          videoId: "8aLPIjSnaug",
          durationLabel: "9:34",
        },
        {
          title: "Laravel MorphMap Explained | Clean Your Polymorphic Relationships",
          channel: "Tony Xhepa",
          url: "https://www.youtube.com/watch?v=Ko_1A9LjRuY",
          videoId: "Ko_1A9LjRuY",
          durationLabel: "13:52",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-polymorphic-q1",
          prompt: "What does `$table->morphs('commentable')` add to a migration?",
          options: [
            "A `commentable_id` column, a `commentable_type` string column, and a composite index across both",
            "A single `commentable` JSON column holding the type and id",
            "A `commentable_id` column plus a foreign key to every possible parent table",
            "A `commentable_type` column only; the id must be added separately",
          ],
          correctIndex: 0,
          explanation:
            "`morphs` is shorthand for the id column, the type column and the index they are queried by together. `nullableMorphs`, `uuidMorphs` and `ulidMorphs` are the variants for nullable and non-integer keys.",
        },
        {
          id: "lv-eloquent-polymorphic-q2",
          prompt: "What is stored in `commentable_type` by default?",
          options: [
            "The fully-qualified class name, e.g. `App\\Models\\Post`",
            "The table name, e.g. `posts`",
            "A short alias derived from the class, e.g. `post`",
            "An integer id from a `morph_types` lookup table",
          ],
          correctIndex: 0,
          explanation:
            "That is why renaming or moving a model breaks stored rows: the namespace is data. A morph map replaces the class name with a stable alias you control.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-polymorphic-q3",
          prompt:
            "Your team moves `App\\Models\\Post` to `App\\Domain\\Blog\\Post`. Comments stop resolving. What is the correct fix going forward?",
          options: [
            "Register `Relation::enforceMorphMap(['post' => Post::class, …])` and backfill existing rows to the alias",
            "Add a `$morphClass` property to the `Comment` model",
            "Re-run `migrate:fresh` so the type column is regenerated",
            "Override `getMorphClass()` on every parent to return the old namespace forever",
          ],
          correctIndex: 0,
          explanation:
            "A morph map decouples the stored value from the class location, and `enforceMorphMap` additionally throws for any model you forgot to map. Pinning `getMorphClass()` to a dead namespace works but leaves stale strings in the database permanently.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-polymorphic-q4",
          prompt: "Why can you not put a foreign key constraint on `commentable_id`?",
          options: [
            "A foreign key references exactly one table, and this column references several",
            "The column is nullable, and foreign keys cannot be nullable",
            "Laravel strips foreign keys from morph columns during migration",
            "The composite index already occupies the constraint slot",
          ],
          correctIndex: 0,
          explanation:
            "Referential integrity is simply unavailable here — which means no `ON DELETE CASCADE` either, so deleting a post leaves its comments orphaned unless a `deleting` observer or a prune job cleans them up.",
        },
        {
          id: "lv-eloquent-polymorphic-q5",
          prompt: "Which method pair defines a many-to-many polymorphic relationship such as tags on posts and videos?",
          options: [
            "`morphToMany` on the taggable models and `morphedByMany` on `Tag`",
            "`morphMany` on `Tag` and `morphTo` on the taggable models",
            "`belongsToMany` on both sides with a `taggable_type` pivot column",
            "`morphToMany` on both sides",
          ],
          correctIndex: 0,
          explanation:
            "`Post::tags()` uses `morphToMany(Tag::class, 'taggable')`, while `Tag::posts()` uses `morphedByMany(Post::class, 'taggable')` to walk the pivot in reverse. `morphMany`/`morphTo` is the one-to-many form.",
        },
        {
          id: "lv-eloquent-polymorphic-q6",
          prompt:
            "You run `Comment::with('commentable')->get()` over 300 comments spread across posts and videos. How many queries does Eloquent issue?",
          options: [
            "3 — one for the comments and one per distinct parent type",
            "1 — Eloquent joins all parent tables in a single statement",
            "301 — a `morphTo` cannot be eager loaded",
            "2 — one for the comments and one union across parent tables",
          ],
          correctIndex: 0,
          explanation:
            "Eloquent groups the comments by `commentable_type` and issues one `whereIn` per type, so the count grows with the number of distinct types, not with the number of rows. `morphWith` lets you nest eager loads per type on top of that.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-polymorphic-q7",
          prompt: "Which are genuine tradeoffs of choosing polymorphism over separate child tables? (Select all that apply.)",
          options: [
            "No database-level referential integrity, so orphans are possible",
            "Reporting SQL must always filter on the type column, and joins get awkward",
            "Every parent shares one column set, so per-parent fields have to be nullable or go in JSON",
            "Eager loading a `morphTo` is impossible, so N+1 is unavoidable",
            "The type column cannot be indexed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are the real costs. `morphTo` eager loading works fine (one query per type), and the type column is not only indexable — `morphs()` indexes it for you.",
        },
        {
          id: "lv-eloquent-polymorphic-q8",
          prompt: "How do you query \"comments whose parent is a `Post` with a title containing 'Laravel'\"?",
          options: [
            "`Comment::whereHasMorph('commentable', [Post::class], fn ($q) => $q->where('title', 'like', '%Laravel%'))`",
            "`Comment::whereHas('commentable', fn ($q) => $q->where('title', 'like', '%Laravel%'))`",
            "`Comment::where('commentable_type', Post::class)->whereHas('post', …)`",
            "`Comment::with('commentable')->where('commentable.title', 'like', '%Laravel%')`",
          ],
          correctIndex: 0,
          explanation:
            "Plain `whereHas` cannot build the subquery because it does not know which table to target. `whereHasMorph` takes the list of types to consider and applies the closure per type.",
        },
        {
          id: "lv-eloquent-polymorphic-q9",
          prompt: "When is a polymorphic relationship the wrong tool?",
          options: [
            "When each parent needs genuinely different columns on the child, so the shared table fills with nullable fields",
            "When more than two parent types exist",
            "When the child table will exceed a million rows",
            "When the parents live in different namespaces",
          ],
          correctIndex: 0,
          explanation:
            "Polymorphism pays off when the child's shape and behaviour are identical across parents. Divergent shapes turn the table into a sparse grab-bag that no constraint can police — at which point separate tables with real foreign keys are the simpler design.",
        },
        {
          id: "lv-eloquent-polymorphic-q10",
          prompt: "Why does `morphs()` create the index as `(commentable_type, commentable_id)` rather than two separate indexes?",
          options: [
            "Lookups always supply both columns, and a concatenated index on the pair serves that access path with one B-tree traversal",
            "MySQL forbids two indexes on columns created in the same migration",
            "The type column is a string and cannot be indexed alone",
            "It halves the storage cost compared with two indexes",
          ],
          correctIndex: 0,
          explanation:
            "Every polymorphic read filters on type and id together, which is exactly what a concatenated index is for. Two single-column indexes would force an index merge or a scan of every row sharing a type.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "lv-eloquent-n-plus-one",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Eager Loading and the N+1 Problem",
      summary:
        "N+1 is the single most common performance defect in ORM code, and it is invisible in the source: `foreach ($books as $book) { echo $book->author->name; }` reads like a property access and executes one `SELECT` per iteration. One query for the books, N for the authors. On a dev database with 20 rows it is imperceptible; on production with 5,000 rows it is 5,001 round trips and a page that times out.\n\nEager loading fixes it by inverting the order: `Book::with('author')->get()` issues `select * from books` and then a single `select * from authors where id in (…)`, matching them up in PHP. Two queries, regardless of N. The variants matter — `with()` loads up front, `load()` loads onto models you already have, `loadMissing()` loads only what is absent, and `withCount()`/`withSum()` answer aggregate questions with a subquery instead of hydrating rows you will only count. `whereHas()` is not a loader at all: it filters and leaves the relationship unloaded, so pairing it with `with()` (or using `withWhereHas()`) is usually what you meant.\n\nTwo deeper traps. First, eager loading nests multiplicatively: `with('posts.comments')` is three queries, but the second `IN` list is every post of every user and the third is every comment of every post, so the row volume — not the query count — is what kills you. Second, eager loading the child does not hydrate the parent back onto it, so `$post->comments` then `$comment->post` inside the inner loop reintroduces N+1; `chaperone()` fixes exactly that. The durable defence is to stop relying on discipline: `Model::preventLazyLoading(! app()->isProduction())` turns a lazy load into an exception in development, and Laravel's `automaticallyEagerLoadRelationships()` will lazy-eager-load an entire collection's relation on first access rather than one row at a time.",
      level: "expert",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "Laravel 13: Eager Loading", url: "https://laravel.com/framework/docs/13.x/eloquent-relationships#eager-loading", kind: "docs" },
        { label: "Laravel 13: Preventing Lazy Loading", url: "https://laravel.com/framework/docs/13.x/eloquent-relationships#preventing-lazy-loading", kind: "docs" },
        { label: "PlanetScale: What is the N+1 query problem and how to solve it", url: "https://planetscale.com/blog/what-is-n-1-query-problem-and-how-to-solve-it", kind: "article" },
        { label: "beyondcode/laravel-query-detector", url: "https://github.com/beyondcode/laravel-query-detector", kind: "repo" },
      ],
      video: {
        title: "30 Days to Learn Laravel, Ep 13 - Eager Loading and the N+1 Problem",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=gaW9KODumUg",
        videoId: "gaW9KODumUg",
        durationLabel: "10:35",
      },
      alternateVideos: [
        {
          title: "Laravel Just Destroyed Your... N+1 Problem",
          channel: "Laracasts",
          url: "https://www.youtube.com/watch?v=p1X-j4Mob1E",
          videoId: "p1X-j4Mob1E",
          durationLabel: "5:12",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-n-plus-one-q1",
          prompt:
            "There are 25 books, each belonging to an author. How many queries does this run?\n\n```php\n$books = Book::all();\n\nforeach ($books as $book) {\n    echo $book->author->name;\n}\n```",
          options: ["26", "2", "25", "1"],
          correctIndex: 0,
          explanation:
            "One query for the books plus one lazy load per book: the \"+1\" is the parent query and the \"N\" is the 25 relationship loads. `Book::with('author')->get()` makes it 2.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-n-plus-one-q2",
          prompt:
            "How many queries does this run, given 10 users, 100 posts and 900 comments?\n\n```php\n$users = User::with('posts.comments')->get();\n```",
          options: ["3", "2", "111", "1010"],
          correctIndex: 0,
          explanation:
            "One query per level: users, then posts `where user_id in (…)`, then comments `where post_id in (…)`. Nesting adds queries linearly but the `IN` lists — and the hydrated row count — grow multiplicatively, which is the real cost.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-n-plus-one-q3",
          prompt:
            "You already have a `$posts` collection in hand and now need their authors. Which call is correct, and what does it cost?",
          options: [
            "`$posts->load('author')` — one additional query for all posts",
            "`$posts->with('author')` — one additional query for all posts",
            "`$posts->each->load('author')` — one query, batched internally",
            "`Post::with('author')->get()` — reuse the original query",
          ],
          correctIndex: 0,
          explanation:
            "`with()` is a builder method and does not exist on a collection; `load()` is the lazy-eager-load for models you already fetched. `$posts->each->load(...)` would issue one query per post — the N+1 you were fixing.",
        },
        {
          id: "lv-eloquent-n-plus-one-q4",
          prompt:
            "This is supposed to show each post with its comments' authors. What is wrong with it?\n\n```php\n$posts = Post::with('comments')->get();\n\nforeach ($posts as $post) {\n    foreach ($post->comments as $comment) {\n        echo $comment->post->title;\n    }\n}\n```",
          options: [
            "`$comment->post` lazy loads the parent for every comment, because eager loading children does not hydrate the parent back onto them",
            "`with('comments')` does not actually load the comments unless `get()` is replaced by `all()`",
            "The inner loop re-runs the comments query for each post",
            "Nothing — Eloquent caches the parent automatically",
          ],
          correctIndex: 0,
          explanation:
            "Each `Comment` has no idea which `Post` object it came from, so reading `$comment->post` issues a query per comment. `hasMany(Comment::class)->chaperone()` — or `->chaperone()` at eager-load time — hydrates the parent onto each child and removes it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-n-plus-one-q5",
          prompt: "What does `Model::preventLazyLoading()` do, and how should it be configured?",
          options: [
            "It throws a `LazyLoadingViolationException` when an unloaded relationship is accessed; enable it everywhere except production",
            "It silently eager loads any relationship you touch; enable it everywhere",
            "It logs lazy loads to the query log; enable it in production only",
            "It disables relationship access entirely unless `with()` was used; enable it in tests only",
          ],
          correctIndex: 0,
          explanation:
            "It converts a silent performance bug into a loud failure during development and testing. Passing `! app()->isProduction()` keeps a missed `with()` from taking down a live request while still catching it in CI.",
        },
        {
          id: "lv-eloquent-n-plus-one-q6",
          prompt: "You only need the number of comments per post, not the comments. Which of these avoid hydrating comment models? (Select all that apply.)",
          options: [
            "`Post::withCount('comments')->get()`",
            "`Post::withExists('comments')->get()` when you only need \"any at all\"",
            "`$posts->loadCount('comments')`",
            "`Post::with('comments')->get()` then `$post->comments->count()`",
            "`Post::all()` then `$post->comments()->count()` in the loop",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three push the counting into SQL subqueries. `with('comments')` transfers and hydrates every comment row, and counting on the relation inside a loop is an N+1 that just happens to return integers.",
        },
        {
          id: "lv-eloquent-n-plus-one-q7",
          prompt:
            "What does this return, and what is loaded?\n\n```php\n$users = User::whereHas('posts', fn ($q) => $q->where('published', true))->get();\n```",
          options: [
            "Users with at least one published post, with `posts` not loaded",
            "Users with at least one published post, with only their published posts loaded",
            "All users, each with only their published posts loaded",
            "Users with at least one published post, with all their posts loaded",
          ],
          correctIndex: 0,
          explanation:
            "`whereHas` compiles to an `EXISTS` subquery used purely for filtering — accessing `$user->posts` afterwards lazy loads *all* posts, published or not. `withWhereHas` filters and eager loads the matching rows in one step.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-n-plus-one-q8",
          prompt:
            "A colleague optimises an eager load to fetch fewer columns:\n\n```php\n$books = Book::with('author:id,name')->get();\n```\n\nand then the same code with `with('author:name')`. Why does the second version return `null` authors?",
          options: [
            "The matching pass needs the related model's key, so the primary key (and any relevant foreign key) must be in the column list",
            "Column-limited eager loads require at least two columns",
            "`name` collides with the books table's own `name` column",
            "Column selection is only supported on `hasMany`, not `belongsTo`",
          ],
          correctIndex: 0,
          explanation:
            "Eager loading is a second query plus an in-PHP join on the keys. Without `id` in the select list there is nothing to match the books' `author_id` against, so every relation comes back empty.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-n-plus-one-q9",
          prompt: "Which statements about `Model::automaticallyEagerLoadRelationships()` are true? (Select all that apply.)",
          options: [
            "When a relationship is accessed on one model, it is lazy-eager-loaded for every model in that collection",
            "It can be enabled per collection with `withRelationshipAutoloading()` instead of globally",
            "It is enabled in `AppServiceProvider::boot()`",
            "It removes the need to think about query shape, because it always produces the optimal plan",
            "It is a replacement for `withCount()` when you only need aggregates",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Autoloading collapses N+1 into one extra query per relation, but it still loads full rows you may not need, and it cannot know you only wanted a count. It is a safety net, not a substitute for designing the query.",
        },
        {
          id: "lv-eloquent-n-plus-one-q10",
          prompt: "Why can `Model::where(...)->cursor()` not eager load relationships?",
          options: [
            "It holds one hydrated model in memory at a time, so there is no batch of keys to build the relationship query from",
            "Cursors run outside the Eloquent builder",
            "Generators cannot execute further queries",
            "Eager loading is disabled whenever a query returns more than 1,000 rows",
          ],
          correctIndex: 0,
          explanation:
            "Eager loading needs the full set of parent keys before it can issue the `whereIn`. `lazy()` chunks under the hood, so it keeps a batch around and supports `with()` — that is the version to reach for when you need both streaming and relationships.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-n-plus-one-q11",
          prompt:
            "How would you load only each user's *published* posts in a single extra query?",
          options: [
            "`User::with(['posts' => fn ($q) => $q->where('published', true)])->get()`",
            "`User::with('posts')->where('posts.published', true)->get()`",
            "`User::with('posts')->get()->each->posts->where('published', true)`",
            "`User::has('posts', '=', 'published')->with('posts')->get()`",
          ],
          correctIndex: 0,
          explanation:
            "A closure on the eager load constrains the relationship query itself, so only published posts are fetched. Filtering after `get()` still transfers every post, and `where('posts.published', …)` references a table that is not joined.",
        },
        {
          id: "lv-eloquent-n-plus-one-q12",
          prompt:
            "A Blade view renders `$order->customer->country->name` for 200 orders on a page that already calls `Order::with('customer')->get()`. What is the query count and the fix?",
          options: [
            "201 queries — `with('customer.country')` makes it 3",
            "201 queries — `load('country')` on each customer makes it 3",
            "3 queries already; the view is fine",
            "401 queries — only `withCount` can fix it",
          ],
          correctIndex: 0,
          explanation:
            "Customers are eager loaded, but `country` is not, so each customer lazy loads one country: 1 + 1 + 199 ≈ 201. Nested eager loading covers the whole chain in one pass; calling `load()` inside the loop would be the same N+1 by another name.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "lv-eloquent-accessors-casts",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Accessors, Mutators and Casts",
      summary:
        "Casts and accessors are the boundary layer between what the database stores and what your PHP code deserves to work with. A column is `tinyint(1)`; your code should see `true`. A column is `text` holding JSON; your code should see an array. A column is `datetime`; your code should see a `Carbon` instance with timezone handling attached. Without that layer, every consumer of the model re-implements the same conversion and one of them gets it wrong.\n\nSince Laravel 9 an accessor is a single `protected` method returning an `Attribute`, with `get:` and `set:` closures in one place instead of the old `getFooAttribute`/`setFooAttribute` pair. The method name is the camel-case form of the underlying attribute, so `firstName()` serves `first_name`. Casts live in a `casts()` method returning an array — a method rather than a property since Laravel 11, which is what lets you reference enum and custom cast classes with parameters. Prefer a cast when the transformation is type-shaped and reusable (`array`, `boolean`, `decimal:2`, an enum, an encrypted value); prefer an accessor when it is derived, like `fullName` from two columns.\n\nThe surprises are worth memorising. Accessors that return objects are cached, so the same instance comes back on every access and mutating it syncs on save — convenient for value objects, wrong for anything time-dependent, which is what `withoutObjectCaching()` is for. The plain `array` cast returns a primitive, so `$user->options['key'] = $value` is a PHP error; you must reassign the whole array, or use `AsArrayObject`/`AsCollection` if you want in-place mutation. And `decimal:2` returns a *string*, deliberately, because a float cannot represent money — which means `===` comparisons against numbers fail.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel 13: Eloquent Mutators & Casting", url: "https://laravel.com/framework/docs/13.x/eloquent-mutators", kind: "docs" },
        { label: "Laravel 13: Custom Casts", url: "https://laravel.com/framework/docs/13.x/eloquent-mutators#custom-casts", kind: "docs" },
        { label: "PHP Watch: PHP 8.1 Enums", url: "https://php.watch/versions/8.1/enums", kind: "article" },
        { label: "briannesbitt/Carbon", url: "https://github.com/briannesbitt/Carbon", kind: "repo" },
      ],
      video: {
        title: "The New Way to Define Eloquent Accessors and Mutators",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=i4RGuYj7zi0",
        videoId: "i4RGuYj7zi0",
        durationLabel: "8:38",
      },
      alternateVideos: [
        {
          title: "Eloquent Accessors: Dates, Casts, and \"Wrong Way\"",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=t_wtC3qR-n0",
          videoId: "t_wtC3qR-n0",
          durationLabel: "5:56",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-accessors-casts-q1",
          prompt:
            "Which attribute does this accessor serve?\n\n```php\nprotected function firstName(): Attribute\n{\n    return Attribute::make(\n        get: fn (string $value) => ucfirst($value),\n    );\n}\n```",
          options: ["`first_name`", "`firstName`", "`first-name`", "Both `firstName` and `first_name`"],
          correctIndex: 0,
          explanation:
            "The method name is the camel-case representation of the underlying snake-case attribute, so `firstName()` intercepts reads of `$user->first_name`. Reading `$user->firstName` does not go through the accessor.",
        },
        {
          id: "lv-eloquent-accessors-casts-q2",
          prompt:
            "Why does this raise a PHP error when `options` is cast to `array`?\n\n```php\n$user = User::find(1);\n$user->options['key'] = 'value';\n```",
          options: [
            "The `array` cast returns a primitive array by value, so the offset cannot be mutated in place",
            "`options` is not in `$fillable`, so writes are blocked",
            "Array casts are read-only by design",
            "The JSON column has not been decoded yet at that point",
          ],
          correctIndex: 0,
          explanation:
            "You have to read the array, change it and assign the whole thing back. `AsArrayObject::class` or `AsCollection::class` return mutable objects and exist precisely to make this pattern work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-accessors-casts-q3",
          prompt: "An `amount` column is cast with `'amount' => 'decimal:2'`. What does `$order->amount === 19.99` evaluate to?",
          options: [
            "`false` — the cast returns the string `\"19.99\"`",
            "`true` — the cast returns a float rounded to 2 places",
            "`false` — the cast returns an integer number of cents",
            "It throws, because decimals cannot be compared with `===`",
          ],
          correctIndex: 0,
          explanation:
            "`decimal:n` returns a formatted string so that no precision is lost through a float. That is the right default for money and the reason strict comparisons and `array_sum` against these values surprise people.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-accessors-casts-q4",
          prompt: "Since Laravel 11, how are casts declared?",
          options: [
            "A `protected function casts(): array` method on the model",
            "A `protected $casts` property only",
            "A `#[Cast]` attribute on each property",
            "In `config/eloquent.php`, per model class",
          ],
          correctIndex: 0,
          explanation:
            "A method can build the array at runtime, which is how enum classes and parameterised custom casts are referenced cleanly. The `$casts` property still works for backwards compatibility.",
        },
        {
          id: "lv-eloquent-accessors-casts-q5",
          prompt:
            "An accessor returns a value object built from two columns. You mutate a property on it and call `save()`. What happens by default?",
          options: [
            "Eloquent caches the returned object, so the mutation is synced back to the model's attributes and saved",
            "Nothing is saved, because accessors are read-only",
            "A new object is built on every access, so the mutation is lost",
            "It throws, because value objects are immutable in Eloquent",
          ],
          correctIndex: 0,
          explanation:
            "Object caching is what makes `$user->address->lineOne = '…'; $user->save();` work. `withoutObjectCaching()` turns it off when you need a freshly computed object each time.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-accessors-casts-q6",
          prompt: "Which of these are real built-in cast types in Laravel 13? (Select all that apply.)",
          options: [
            "`hashed`",
            "`encrypted:array`",
            "`AsStringable::class`",
            "`immutable_datetime`",
            "`slug`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "`hashed` hashes on set, `encrypted:*` encrypts at rest and decrypts on read, `AsStringable` wraps the value in a fluent string object, and the `immutable_*` date casts return `CarbonImmutable`. There is no `slug` cast — that is a mutator or a package.",
        },
        {
          id: "lv-eloquent-accessors-casts-q7",
          prompt: "You want a `status` column stored as a string but exposed as a PHP 8.1 backed enum. What do you write?",
          options: [
            "`'status' => OrderStatus::class` in the `casts()` array",
            "`'status' => 'enum:' . OrderStatus::class` in the `casts()` array",
            "An accessor calling `OrderStatus::from($value)` — enums cannot be cast",
            "`#[Enum(OrderStatus::class)]` on the model",
          ],
          correctIndex: 0,
          explanation:
            "Naming the enum class directly is the cast. Eloquent calls `from()` on read and stores `->value` on write, so an unknown database value throws rather than quietly becoming `null`.",
        },
        {
          id: "lv-eloquent-accessors-casts-q8",
          prompt: "When would you write a custom cast class (`CastsAttributes`) instead of an accessor?",
          options: [
            "When the same bidirectional transformation is needed on several models and you want it reusable and testable",
            "When the value is derived from two or more columns",
            "When you only need to transform the value on read",
            "When the attribute has no database column at all",
          ],
          correctIndex: 0,
          explanation:
            "A cast class is a reusable pair of `get`/`set` you can point many models at. A value derived from several columns, or one with no column, is accessor territory — and an appended accessor if it must appear in JSON.",
        },
        {
          id: "lv-eloquent-accessors-casts-q9",
          prompt: "A mutator needs to write two columns from one assignment, e.g. `$user->address = new Address($one, $two)`. How is that expressed?",
          options: [
            "The `set:` closure returns an array of column => value pairs",
            "The `set:` closure calls `$this->attributes[...] = ...` directly and returns `null`",
            "It is not supported; use two separate mutators",
            "The `set:` closure returns a `Collection` of columns",
          ],
          correctIndex: 0,
          explanation:
            "Returning `['address_line_one' => $value->lineOne, 'address_line_two' => $value->lineTwo]` from `set:` writes both underlying attributes. Returning a scalar writes only the attribute the method is named for.",
        },
        {
          id: "lv-eloquent-accessors-casts-q10",
          prompt: "Laravel 13 adds an `AsVector` cast alongside a `vector` column type. What is it for?",
          options: [
            "Storing embedding vectors so they can be used with vector similarity search on pgvector or MariaDB",
            "Casting an array of integers to a fixed-length PHP `SplFixedArray`",
            "Serialising geometry columns for mapping libraries",
            "Compressing large JSON payloads before storage",
          ],
          correctIndex: 0,
          explanation:
            "It is the model-side counterpart of `$table->vector(...)` and `whereVectorSimilarTo(...)`, which is how Laravel 13 supports retrieval over embeddings without a separate vector store.",
        },
      ],
    },
    {
      id: "lv-eloquent-scopes",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Query Scopes: Local and Global",
      summary:
        "A scope is a named, reusable fragment of a query that lives on the model instead of being copy-pasted through controllers. Local scopes are opt-in: `Post::published()->latest()->get()`. Global scopes are opt-out: once registered, every query for that model carries the constraint until someone explicitly removes it. `SoftDeletes` is itself a global scope — that is how `deleted_at is null` appears in queries nobody wrote.\n\nLaravel 13 documents local scopes as `protected` methods carrying the `#[Scope]` attribute; the historical `scopePublished()` naming convention still works, and you will meet both in any codebase with history. Attributed scopes have one sharp edge: because the method is `protected` and resolution goes through the builder, calling one from inside the model must go through `static::query()->published()` rather than `$this->published()`.\n\nGlobal scopes are powerful and quietly dangerous. They are invisible at the call site, so a developer reading `Tenant::count()` has no way to know a tenant filter is applied — which is exactly why they are the right tool for multi-tenancy and the wrong tool for \"usually we only want active records\". They also do not exist below Eloquent: `DB::table('posts')->delete()` ignores every global scope, soft deletes included. And the classic bug is boolean precedence — a global scope adding `where('published', true)` combines with a later `orWhere('author_id', $id)` as `(published AND …) OR author_id = …`, leaking unpublished rows unless the `or` branch is wrapped in a closure.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel 13: Eloquent — Query Scopes", url: "https://laravel.com/framework/docs/13.x/eloquent#query-scopes", kind: "docs" },
        { label: "Laravel 13: Eloquent — Global Scopes", url: "https://laravel.com/framework/docs/13.x/eloquent#global-scopes", kind: "docs" },
        { label: "PHP Manual: Attributes overview", url: "https://www.php.net/manual/en/language.attributes.overview.php", kind: "docs" },
      ],
      video: {
        title: "Eloquent Query Scopes: Local and Global",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=F8Q2ZTbT4MA",
        videoId: "F8Q2ZTbT4MA",
        durationLabel: "11:11",
      },
      alternateVideos: [
        {
          title: "Write Cleaner Laravel Code: Query Scopes Complete Guide (Laravel 12)",
          channel: "code with SJM",
          url: "https://www.youtube.com/watch?v=IB0NHhNYDRI",
          videoId: "IB0NHhNYDRI",
          durationLabel: "31:43",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-scopes-q1",
          prompt:
            "How do you call this scope from a controller?\n\n```php\nuse Illuminate\\Database\\Eloquent\\Attributes\\Scope;\n\n#[Scope]\nprotected function popular(Builder $query): void\n{\n    $query->where('votes', '>', 100);\n}\n```",
          options: ["`User::popular()->get()`", "`User::scopePopular()->get()`", "`User::query()->scope('popular')->get()`", "`(new User)->popular()->get()`"],
          correctIndex: 0,
          explanation:
            "The builder resolves `popular()` to the attributed method and passes itself as the first argument. The older convention was a `public function scopePopular(Builder $query)` and was called the same way — `User::popular()`.",
        },
        {
          id: "lv-eloquent-scopes-q2",
          prompt:
            "Inside the `User` model, a method wants to reuse the attributed `ofType` scope. Which call works?",
          options: [
            "`static::query()->ofType('admin')`",
            "`$this->ofType('admin')`",
            "`self::ofType('admin')`",
            "`$this->scopeOfType('admin')`",
          ],
          correctIndex: 0,
          explanation:
            "Attributed scopes are `protected` methods that only mean anything when routed through Eloquent's builder. Calling `$this->ofType(...)` invokes the raw method with no query argument, which is a `TypeError`, not a scoped query.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-scopes-q3",
          prompt:
            "A `Post` model has a global scope adding `where('published', true)`. What rows does this return?\n\n```php\nPost::where('author_id', 7)->orWhere('featured', true)->get();\n```",
          options: [
            "Posts that are (published AND author 7) OR featured — including unpublished featured posts",
            "Only published posts that are by author 7 or featured",
            "All posts by author 7 plus all featured posts",
            "Nothing, because a global scope cannot combine with `orWhere`",
          ],
          correctIndex: 0,
          explanation:
            "The global scope's condition is just another `where` in the list, and SQL's `AND` binds tighter than `OR`, so the `orWhere` escapes it. Wrapping the alternatives in a closure — `->where(fn ($q) => $q->where(...)->orWhere(...))` — restores the intent.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-scopes-q4",
          prompt: "Which are valid ways to register a global scope on a model? (Select all that apply.)",
          options: [
            "The `#[ScopedBy([AncientScope::class])]` attribute on the model class",
            "`static::addGlobalScope(new AncientScope)` inside the model's `booted()` method",
            "`static::addGlobalScope('ancient', fn (Builder $q) => $q->where(...))` with a closure and a name",
            "Listing the scope class in `config/eloquent.php`",
            "Adding the scope class to the model's `$fillable` array",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The attribute, a class instance in `booted()`, and a named closure are the three supported registrations. The name in the closure form is what `withoutGlobalScope('ancient')` later refers to.",
        },
        {
          id: "lv-eloquent-scopes-q5",
          prompt: "How do you run one query without a particular global scope, and without one at all?",
          options: [
            "`Model::withoutGlobalScope(AncientScope::class)` and `Model::withoutGlobalScopes()`",
            "`Model::ignoreScope(AncientScope::class)` and `Model::raw()`",
            "`Model::withoutScope('ancient')` and `Model::unscoped()`",
            "`Model::query(false)` in both cases",
          ],
          correctIndex: 0,
          explanation:
            "`withoutGlobalScope` takes the class name or the string name used at registration; `withoutGlobalScopes` drops them all, and `withoutGlobalScopesExcept([...])` keeps a chosen few.",
        },
        {
          id: "lv-eloquent-scopes-q6",
          prompt: "A multi-tenant app registers a global scope filtering by `tenant_id`. Which query bypasses it?",
          options: [
            "`DB::table('invoices')->sum('total')`",
            "`Invoice::sum('total')`",
            "`Invoice::withTrashed()->sum('total')`",
            "`Invoice::where('status', 'paid')->sum('total')`",
          ],
          correctIndex: 0,
          explanation:
            "Global scopes are an Eloquent-builder feature; the query builder knows nothing about them. That is why a single `DB::table` call in a reporting job can leak one tenant's data into another's dashboard.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-scopes-q7",
          prompt: "How do you write a local scope that takes an argument, e.g. `User::ofType('admin')`?",
          options: [
            "Add the parameter after `$query` in the method signature",
            "Pass an array to the `#[Scope]` attribute declaring the parameters",
            "Return a closure from the scope method",
            "Dynamic scopes are not supported; use a query builder macro",
          ],
          correctIndex: 0,
          explanation:
            "`protected function ofType(Builder $query, string $type)` receives the builder first and your arguments after, so the call site reads `User::ofType('admin')`.",
        },
        {
          id: "lv-eloquent-scopes-q8",
          prompt: "What does `withAttributes` do inside a scope?",
          options: [
            "Adds the attributes as `where` conditions and applies them to models created through the scope",
            "Appends the attributes to the model's JSON output",
            "Eager loads the listed attributes from a related table",
            "Declares which columns the scope selects",
          ],
          correctIndex: 0,
          explanation:
            "`Post::draft()->create(['title' => '…'])` then produces a post that is already `hidden = true`, because the scope's constraints double as pending attributes. It keeps a `draft` scope and a `draft` factory from drifting apart.",
        },
        {
          id: "lv-eloquent-scopes-q9",
          prompt: "When is a global scope the wrong choice compared with a local scope?",
          options: [
            "When the constraint is merely the common case, because hiding it makes every count and report subtly wrong without any visible cause",
            "When more than one model needs it",
            "When the constraint involves a relationship",
            "When the application has more than one database connection",
          ],
          correctIndex: 0,
          explanation:
            "Invisibility is the whole feature and the whole risk. It is right for an invariant that must never be violated (tenancy, soft deletes) and wrong for a default someone will need to override constantly.",
        },
        {
          id: "lv-eloquent-scopes-q10",
          prompt: "Which statements about `SoftDeletes` and scopes are true? (Select all that apply.)",
          options: [
            "The trait registers a global scope that adds `deleted_at is null` to every query",
            "`withTrashed()` works by removing that global scope for the query",
            "Relationships on a soft-deleting model also exclude trashed rows by default",
            "`DB::table(...)` queries still exclude trashed rows",
            "`onlyTrashed()` is a local scope you must define yourself",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Soft deletes are implemented as a global scope, which is why `withTrashed()`/`onlyTrashed()` are scope manipulations the trait provides. The query builder never sees any of it.",
        },
      ],
    },
    {
      id: "lv-eloquent-collections",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Eloquent Collections",
      summary:
        "Every Eloquent query that can return more than one row returns an `Illuminate\\Database\\Eloquent\\Collection`, a subclass of Laravel's base `Collection` with model-aware extras like `modelKeys()`, `find()`, `load()` and `toQuery()`. The base class is the general-purpose fluent array wrapper: `map`, `filter`, `reduce`, `groupBy`, `keyBy`, `partition`, `sum`, and a hundred others, almost all returning a new collection so chains read top to bottom.\n\nThe judgement call is where work happens. `$posts->filter(...)` is expressive and runs in PHP over rows you already paid to transfer and hydrate; `Post::where(...)` runs in the database over an index. Collections are the right tool for shaping data you already have, and the wrong tool for selecting it. The moment you find yourself calling `Model::all()` so you can filter the result, you have moved a `WHERE` clause into PHP.\n\nTwo behaviours that catch people. `filter`, `reject` and `where` preserve the original keys, so a filtered collection has gaps and `json_encode` turns it into an object rather than an array — `->values()` before serialising. And the return type is not always Eloquent: `pluck`, `keys`, `flatten`, `collapse`, `flip` and `zip` return a base collection, as does any `map` whose callback stops returning models, so `->load('author')` on the result of a `pluck` does not exist. For very large sets, `LazyCollection` (via `cursor()` or `lazy()`) keeps the same API while holding one item at a time.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel 13: Eloquent Collections", url: "https://laravel.com/framework/docs/13.x/eloquent-collections", kind: "docs" },
        { label: "Laravel 13: Collections", url: "https://laravel.com/framework/docs/13.x/collections", kind: "docs" },
        { label: "PHP Manual: Generators overview", url: "https://www.php.net/manual/en/language.generators.overview.php", kind: "docs" },
      ],
      video: {
        title: "Organizing data with Laravel Collections",
        channel: "Andrew Schmelyun",
        url: "https://www.youtube.com/watch?v=a2QvlLs0uEk",
        videoId: "a2QvlLs0uEk",
        durationLabel: "32:51",
      },
      alternateVideos: [
        {
          title: "Laravel Collections & Eloquent Methods: 44 Essential Methods for Beginners - Mastering in Laravel",
          channel: "Code With Dary",
          url: "https://www.youtube.com/watch?v=XWKnMU6MnIw",
          videoId: "XWKnMU6MnIw",
          startSeconds: 821,
          chapterLabel: "count(), countBy(), max(), min(), median(), mode(), random() & sum()",
          durationLabel: "1:25:35",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-collections-q1",
          prompt: "Which of these return a base `Illuminate\\Support\\Collection` rather than an Eloquent collection? (Select all that apply.)",
          options: [
            "`$users->pluck('email')`",
            "`$users->modelKeys()`",
            "`$users->map(fn ($u) => $u->email)`",
            "`$users->filter(fn ($u) => $u->active)`",
            "`$users->sortBy('name')`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`pluck` and `modelKeys` extract scalars, and a `map` whose callback stops returning models degrades to a base collection. `filter` and `sortBy` still hold models, so they stay Eloquent collections with `load()` and friends available.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-collections-q2",
          prompt:
            "A collection of 5 users is filtered down to the 2nd and 4th, then returned from a controller as JSON. Why does the response come back as a JSON object rather than an array?",
          options: [
            "`filter` preserves the original keys, so the array is `[1 => …, 3 => …]`, which is not a list",
            "Eloquent collections always serialise as objects",
            "The models have string primary keys",
            "`json_encode` cannot encode nested models as an array",
          ],
          correctIndex: 0,
          explanation:
            "PHP only serialises a sequentially-indexed array as a JSON array. Calling `->values()` after filtering reindexes it, which is why it appears at the end of so many collection chains.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-collections-q3",
          prompt: "What is the main difference between `Collection` and `LazyCollection`?",
          options: [
            "`LazyCollection` uses PHP generators and keeps one item in memory at a time, so it can process sets larger than memory",
            "`LazyCollection` defers execution until `->get()` is called, then behaves identically",
            "`LazyCollection` runs the callbacks on a queue worker",
            "`LazyCollection` caches results between requests",
          ],
          correctIndex: 0,
          explanation:
            "`cursor()` and `lazy()` return lazy collections with the same fluent API. The tradeoff is that methods needing the whole set — `sort`, `count` on an unbounded source — force it back into memory.",
        },
        {
          id: "lv-eloquent-collections-q4",
          prompt:
            "Which of these is doing work in the wrong place?\n\n```php\n// A\n$active = User::where('active', true)->get();\n// B\n$active = User::all()->filter(fn ($u) => $u->active);\n```",
          options: [
            "B — it transfers and hydrates every user just to discard most of them",
            "A — the database cannot index a boolean column",
            "Neither; they compile to the same SQL",
            "B is faster because PHP filtering avoids a WHERE clause",
          ],
          correctIndex: 0,
          explanation:
            "B is a `WHERE` clause moved into PHP: full table scan, full transfer, full hydration. Collections are for shaping data you already have a reason to hold.",
        },
        {
          id: "lv-eloquent-collections-q5",
          prompt: "What does `$users->toQuery()` give you?",
          options: [
            "An Eloquent builder constrained by `whereIn` on the collection's primary keys",
            "The SQL string that produced the collection",
            "A new collection of query builders, one per model",
            "The original query builder including its eager loads",
          ],
          correctIndex: 0,
          explanation:
            "It is the bridge back to the database, so `$users->toQuery()->update(['active' => false])` is a single mass update over exactly those rows rather than a save per model.",
        },
        {
          id: "lv-eloquent-collections-q6",
          prompt: "What do higher-order messages like `$users->each->markAsVerified()` do?",
          options: [
            "Call the named method on every item, as shorthand for `each(fn ($u) => $u->markAsVerified())`",
            "Queue the method call for every item",
            "Call the method once on the collection itself",
            "Build a new collection of the method's return values",
          ],
          correctIndex: 0,
          explanation:
            "`each`, `map`, `filter`, `sum`, `every` and several others expose a property proxy for this shorthand. `$users->sum->votes` is the same trick for a property.",
        },
        {
          id: "lv-eloquent-collections-q7",
          prompt: "Which statement about `$collection->contains($user)` on an Eloquent collection is correct?",
          options: [
            "It compares by primary key when given a model instance, not by object identity",
            "It uses `===`, so two hydrations of the same row are not equal",
            "It compares the full attribute arrays",
            "It always returns `false` unless the model was loaded by the same query",
          ],
          correctIndex: 0,
          explanation:
            "Eloquent has no identity map, so two objects can represent one row; the collection therefore compares keys. `contains()` also accepts a key, a closure, or a key/value pair.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-collections-q8",
          prompt: "You need posts grouped by author name for a view. Which is the idiomatic collection call?",
          options: [
            "`$posts->groupBy(fn ($p) => $p->author->name)`",
            "`$posts->keyBy(fn ($p) => $p->author->name)`",
            "`$posts->partition(fn ($p) => $p->author->name)`",
            "`$posts->chunk(fn ($p) => $p->author->name)`",
          ],
          correctIndex: 0,
          explanation:
            "`groupBy` maps each key to a collection of the items sharing it. `keyBy` keeps only the last item per key, and `partition` splits into exactly two collections by a boolean test.",
        },
        {
          id: "lv-eloquent-collections-q9",
          prompt: "How do you make a model return a custom collection class for all its result sets?",
          options: [
            "Add `#[CollectedBy(UserCollection::class)]` to the model, or override `newCollection()`",
            "Set `protected $collection = UserCollection::class` on the model",
            "Register the class in `AppServiceProvider` with `Collection::macro`",
            "Return the custom class from the model's `casts()` method",
          ],
          correctIndex: 0,
          explanation:
            "Either mechanism makes every `get()`, `all()` and relationship load hand back your class, which is where domain methods like `$invoices->totalOutstanding()` belong. Define `newCollection()` on a base model to apply it everywhere.",
        },
        {
          id: "lv-eloquent-collections-q10",
          prompt: "What does `$posts->load('author')` do that `$posts->map(fn ($p) => $p->author)` does not?",
          options: [
            "It fetches every author in one query and attaches them to the models; the `map` version lazy loads one author per post",
            "It filters out posts with no author",
            "It caches the authors for the rest of the request across all collections",
            "It returns a collection of authors rather than posts",
          ],
          correctIndex: 0,
          explanation:
            "`load()` is lazy eager loading: one `whereIn` for the whole collection. The `map` reads `$p->author` per post, which is the N+1 pattern with a functional coat of paint.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "lv-eloquent-factories-seeding",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Factories and Seeding",
      summary:
        "Factories exist so that a test or a local database can say what it cares about and nothing else. `Order::factory()->for($customer)->has(Line::factory()->count(3))->create()` states \"an order for this customer with three lines\" and lets the factory invent a plausible reference number, timestamp and status. The alternative — hand-built arrays in every test — couples each test to every column, so adding a non-nullable column breaks two hundred tests instead of one factory.\n\nThe distinction to internalise is `make()` versus `create()`: `make()` builds unsaved instances, `create()` persists them. States (`->state([...])`, or named methods on the factory) express variation, `Sequence` cycles values across a batch, `for()` and `has()` wire relationships in the right order, and `recycle()` makes a batch share one related model instead of creating a hundred. Callbacks belong in `configure()` via `afterMaking`/`afterCreating`. In Laravel 13, `#[UseFactory(FlightFactory::class)]` overrides the `Database\\Factories\\<Model>Factory` naming convention when your layout does not match it.\n\nSeeders are a different job that uses the same tools: reference data a running application needs (roles, countries, plans) versus demo data for a local environment. Keep them separable, because `migrate:fresh --seed` on a developer machine and a production deploy want very different things. Two traps: seeding with `factory()->count(10000)->create()` fires ten thousand inserts and every model event, which is why `WithoutModelEvents` and bulk `insert()` exist; and any seeder that depends on random data is a flaky test waiting to happen, so pin the values you assert on.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Laravel 13: Eloquent Factories", url: "https://laravel.com/framework/docs/13.x/eloquent-factories", kind: "docs" },
        { label: "Laravel 13: Database Seeding", url: "https://laravel.com/framework/docs/13.x/seeding", kind: "docs" },
        { label: "fakerphp/faker", url: "https://github.com/fakerphp/faker", kind: "repo" },
      ],
      video: {
        title: "30 Days to Learn Laravel - Complete 8 Hour Course",
        channel: "Laracasts",
        url: "https://www.youtube.com/watch?v=SqTdHCTWqks",
        videoId: "SqTdHCTWqks",
        startSeconds: 7328,
        chapterLabel: "10 Model Factories",
        durationLabel: "8:29:58",
      },
      alternateVideos: [
        {
          title: "30 Days to Learn Laravel - Complete 8 Hour Course",
          channel: "Laracasts",
          url: "https://www.youtube.com/watch?v=SqTdHCTWqks",
          videoId: "SqTdHCTWqks",
          startSeconds: 11242,
          chapterLabel: "15 Understanding Database Seeders",
          durationLabel: "8:29:58",
        },
        {
          title: "Laravel 12 in 11 hours - Laravel for Beginners Full Course",
          channel: "The Codeholic",
          url: "https://www.youtube.com/watch?v=0M84Nk7iWkA",
          videoId: "0M84Nk7iWkA",
          startSeconds: 27051,
          chapterLabel: "Factories",
          durationLabel: "10:54:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-factories-seeding-q1",
          prompt: "What is the difference between `User::factory()->count(3)->make()` and `->create()`?",
          options: [
            "`make()` returns three unsaved models; `create()` inserts them and returns the persisted models",
            "`make()` returns an array; `create()` returns a collection",
            "`make()` runs the factory definition; `create()` skips it and uses column defaults",
            "`make()` is for tests; `create()` is for seeders — they are otherwise identical",
          ],
          correctIndex: 0,
          explanation:
            "`make()` is the right choice for a unit test that never touches the database. Note that `make()` also skips any `afterCreating` callbacks, since nothing was created.",
        },
        {
          id: "lv-eloquent-factories-seeding-q2",
          prompt: "Where does Laravel look for `Flight`'s factory by convention, and how do you override it?",
          options: [
            "`Database\\Factories\\FlightFactory`; override with the `#[UseFactory(...)]` attribute on the model",
            "`App\\Factories\\FlightFactory`; override with a `$factory` property",
            "`Database\\Factories\\Flight`; override by renaming the class",
            "Anywhere autoloadable; Laravel scans for a matching `$model` property",
          ],
          correctIndex: 0,
          explanation:
            "The convention is the model name suffixed with `Factory` in the `Database\\Factories` namespace. `#[UseFactory]` is the Laravel 13 escape hatch for layouts that do not match.",
        },
        {
          id: "lv-eloquent-factories-seeding-q3",
          prompt:
            "You need 10 posts that all belong to one existing `$user`, with 3 comments each. Which is correct?",
          options: [
            "`Post::factory()->count(10)->for($user)->has(Comment::factory()->count(3))->create()`",
            "`Post::factory()->count(10)->has($user)->for(Comment::factory()->count(3))->create()`",
            "`Post::factory()->count(10)->with('user', $user)->with('comments', 3)->create()`",
            "`Post::factory()->count(10)->create(['user' => $user, 'comments' => 3])`",
          ],
          correctIndex: 0,
          explanation:
            "`for()` attaches the \"belongs to\" side and `has()` creates the \"has many\" side. Getting them backwards is the most common factory mistake — `for()` takes a model, `has()` takes a factory.",
        },
        {
          id: "lv-eloquent-factories-seeding-q4",
          prompt: "What does `Sequence` do in `User::factory()->count(10)->state(new Sequence(['admin' => 'Y'], ['admin' => 'N']))->create()`?",
          options: [
            "Alternates the two states across the ten models, producing five of each",
            "Applies both states to all ten models, with the second winning",
            "Creates ten models with `admin` set randomly to Y or N",
            "Creates two models, one per state",
          ],
          correctIndex: 0,
          explanation:
            "The sequence cycles through its values as the batch is built, which is how you get a deterministic mix. A closure value receives the `Sequence` instance, whose `$index` tells you which iteration you are on.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-factories-seeding-q5",
          prompt: "What problem does `recycle()` solve?",
          options: [
            "It reuses one related model across a whole batch instead of creating a new one per record",
            "It reuses primary keys freed by earlier deletes",
            "It re-runs a factory definition until it produces a unique value",
            "It restores soft-deleted models created by earlier tests",
          ],
          correctIndex: 0,
          explanation:
            "Without it, creating 50 orders whose factory creates a `Customer` gives you 50 customers. `recycle($customer)` passes one instance down through every nested relationship that needs it.",
        },
        {
          id: "lv-eloquent-factories-seeding-q6",
          prompt: "Where should `afterCreating` callbacks be registered?",
          options: [
            "In a `configure()` method on the factory, which Laravel calls when the factory is instantiated",
            "In the factory's `definition()` return array",
            "In the model's `booted()` method",
            "In `DatabaseSeeder::run()` before calling the factory",
          ],
          correctIndex: 0,
          explanation:
            "`configure()` is the hook Laravel invokes on instantiation, so the callbacks apply to every use of the factory. `definition()` returns attributes only, and has no access to the created model.",
        },
        {
          id: "lv-eloquent-factories-seeding-q7",
          prompt: "Which statements about seeders are true? (Select all that apply.)",
          options: [
            "`php artisan db:seed` runs `Database\\Seeders\\DatabaseSeeder` unless `--class` names another",
            "`php artisan migrate:fresh --seed` drops every table, re-migrates and then seeds",
            "The `WithoutModelEvents` trait stops model events firing, including for seeders invoked via `$this->call(...)`",
            "Seeders run inside a transaction and roll back if any of them throws",
            "`db:seed` refuses to run in production unless `--force` is passed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation:
            "There is no implicit transaction around seeding — a seeder that fails halfway leaves partial data, so wrap it yourself if that matters. The production guard and `WithoutModelEvents` both behave as described.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-factories-seeding-q8",
          prompt: "Why might a seeder creating 50,000 rows with `factory()->count(50000)->create()` be unacceptably slow?",
          options: [
            "It performs one insert per model and fires every model event and observer along the way",
            "Faker is limited to 1,000 unique values per run",
            "Factories open a new database connection per model",
            "Laravel wraps each factory call in its own transaction",
          ],
          correctIndex: 0,
          explanation:
            "Per-model inserts and events dominate. Building the rows and handing them to a chunked `insert()` — accepting that you lose events, casts and timestamps — is the usual fix, alongside `WithoutModelEvents`.",
        },
        {
          id: "lv-eloquent-factories-seeding-q9",
          prompt: "A test asserts that a user's name is `'Taylor'` after using a factory whose definition calls `fake()->name()`. What is wrong?",
          options: [
            "The definition generates a random name; the test should pass the value it asserts on, e.g. `->create(['name' => 'Taylor'])`",
            "Faker is disabled in the testing environment, so `name` is `null`",
            "Factories ignore `$fillable`, so `name` is discarded",
            "Nothing — Faker is seeded deterministically per test run",
          ],
          correctIndex: 0,
          explanation:
            "A factory's job is plausible defaults for the fields you do not care about. Anything an assertion depends on must be stated explicitly, or the test is coupled to Faker's randomness.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-factories-seeding-q10",
          prompt: "Why can a factory set attributes that are not in the model's `$fillable` list?",
          options: [
            "Factories build the model with mass assignment protection disabled, since the attributes come from your code and not from a request",
            "Factories write directly with the query builder, bypassing the model",
            "`$fillable` only applies to `update()`, never to `create()`",
            "They cannot — the attributes are silently discarded",
          ],
          correctIndex: 0,
          explanation:
            "Mass assignment protection guards against untrusted input; a factory definition is trusted code. That is also why a factory test passing does not prove a controller's `create($request->validated())` will work.",
        },
      ],
    },
    {
      id: "lv-eloquent-soft-deletes-events",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Soft Deletes, Model Events and Observers",
      summary:
        "Soft deletes trade referential simplicity for recoverability: the `SoftDeletes` trait adds a global scope excluding rows with a non-null `deleted_at`, so `delete()` becomes an update and the row stays reachable through `withTrashed()` and `onlyTrashed()`. That is the right call when \"undo\" is a product requirement or an audit trail is a legal one, and the wrong call when it is cargo cult — because the rows never leave, every index keeps growing, every unique constraint now conflicts with a deleted row's value, and every raw SQL report has to remember a predicate the ORM was adding for free.\n\nModel events are the other half of this topic because they are how soft deletes behave at all. Eloquent dispatches `retrieved`, `creating`, `created`, `updating`, `updated`, `saving`, `saved`, `deleting`, `deleted`, `trashed`, `forceDeleting`, `forceDeleted`, `restoring`, `restored` and `replicating`. `-ing` events fire before persistence and can cancel it by returning `false`; `-ed` events fire after. An observer groups the listeners for one model into a class, registered with `#[ObservedBy([UserObserver::class])]` or in a service provider.\n\nThe rule that decides most production bugs: events need a model instance. `Model::where(...)->update([...])` and `->delete()` never hydrate one, so none of your observers run — no cache busting, no search-index update, no audit row. `destroy($ids)` deliberately loads each model so events do fire, at the cost of a query per id. And an observer that does work inside a transaction will act on data that may still roll back, unless it implements `ShouldHandleEventsAfterCommit`.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Laravel 13: Eloquent — Soft Deleting", url: "https://laravel.com/framework/docs/13.x/eloquent#soft-deleting", kind: "docs" },
        { label: "Laravel 13: Eloquent — Events and Observers", url: "https://laravel.com/framework/docs/13.x/eloquent#events", kind: "docs" },
        { label: "laravel/framework: SoftDeletes.php", url: "https://github.com/laravel/framework/blob/13.x/src/Illuminate/Database/Eloquent/SoftDeletes.php", kind: "repo" },
        { label: "PostgreSQL: Constraints (unique and partial indexes)", url: "https://www.postgresql.org/docs/current/ddl-constraints.html", kind: "docs" },
      ],
      video: {
        title: "Eloquent Soft Deletes: Things You May Not Know",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=ffAt9Np-zEM",
        videoId: "ffAt9Np-zEM",
        durationLabel: "10:57",
      },
      alternateVideos: [
        {
          title: "Laravel Best Practices: Observers vs Event Listeners Explained",
          channel: "Code with Burt",
          url: "https://www.youtube.com/watch?v=yBWcJrwswuU",
          videoId: "yBWcJrwswuU",
          durationLabel: "6:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-soft-deletes-events-q1",
          prompt: "What two things must be in place for soft deletes to work on a model?",
          options: [
            "The `SoftDeletes` trait on the model and a nullable `deleted_at` column from `$table->softDeletes()`",
            "The `SoftDeletes` trait and a `deleted` boolean column",
            "A `deleted_at` column and `$softDelete = true` on the model",
            "The `SoftDeletes` trait alone — it adds the column on first use",
          ],
          correctIndex: 0,
          explanation:
            "The trait supplies the global scope, the `restore`/`forceDelete` methods and the date cast; the migration supplies the column. Forgetting the column produces an \"unknown column deleted_at\" error on the very next query.",
        },
        {
          id: "lv-eloquent-soft-deletes-events-q2",
          prompt:
            "A `users` table has a unique index on `email` and uses soft deletes. A user is soft-deleted and then tries to sign up again with the same address. What happens?",
          options: [
            "The insert fails on the unique index, because the soft-deleted row is still physically present",
            "It succeeds, because the unique index ignores soft-deleted rows",
            "It succeeds and restores the original row",
            "It fails with a `ModelNotFoundException`",
          ],
          correctIndex: 0,
          explanation:
            "The database has no idea `deleted_at` means anything. The usual remedies are a composite unique index on `(email, deleted_at)`, a partial/filtered unique index where `deleted_at is null`, or scrambling the email on delete.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-soft-deletes-events-q3",
          prompt: "Which of these bypass a model's observers entirely? (Select all that apply.)",
          options: [
            "`Post::where('draft', true)->delete()`",
            "`Post::where('draft', true)->update(['archived' => true])`",
            "`DB::table('posts')->delete()`",
            "`Post::destroy([1, 2, 3])`",
            "`$post->delete()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Mass updates and deletes never instantiate a model, and `DB::table` is outside Eloquent altogether. `destroy()` loads each model precisely so `deleting`/`deleted` fire, and the instance `delete()` obviously does.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-soft-deletes-events-q4",
          prompt:
            "In what order do the events fire when an existing model is modified and `save()` is called?",
          options: [
            "`saving`, `updating`, `updated`, `saved`",
            "`updating`, `saving`, `saved`, `updated`",
            "`saving`, `saved`, `updating`, `updated`",
            "`updating`, `updated` only — `saving`/`saved` are for inserts",
          ],
          correctIndex: 0,
          explanation:
            "`saving`/`saved` wrap both inserts and updates, with the more specific pair nested inside. An insert follows the same shape with `creating`/`created` in the middle.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-soft-deletes-events-q5",
          prompt: "How do you save a model once without dispatching any events?",
          options: [
            "`$user->saveQuietly()`",
            "`$user->save(['quiet' => true])`",
            "`Model::withoutEvents(fn () => $user->save())` is the only way",
            "Unset the model's `$dispatchesEvents` array first",
          ],
          correctIndex: 0,
          explanation:
            "`saveQuietly()` is the per-call form; `Model::withoutEvents(closure)` mutes everything inside a block, which is the one to use when a whole seeding or migration routine should stay silent.",
        },
        {
          id: "lv-eloquent-soft-deletes-events-q6",
          prompt: "How is an observer registered in Laravel 13?",
          options: [
            "With `#[ObservedBy([UserObserver::class])]` on the model, or `User::observe(UserObserver::class)` in a service provider",
            "By placing it in `app/Observers` — Laravel autodiscovers it",
            "In the `$observers` array in `config/app.php`",
            "In `bootstrap/app.php` via `->withObservers()`",
          ],
          correctIndex: 0,
          explanation:
            "The attribute keeps the wiring next to the model it affects; the service-provider call is still there for conditional registration. There is no autodiscovery by directory.",
        },
        {
          id: "lv-eloquent-soft-deletes-events-q7",
          prompt:
            "An observer's `created` method pushes the new record to a search index. The model is created inside `DB::transaction(...)`, which later throws. What goes wrong, and what fixes it?",
          options: [
            "The index gets a record for a row that was rolled back; implement `ShouldHandleEventsAfterCommit` on the observer",
            "The observer never runs, because events are queued until commit; nothing to fix",
            "The transaction cannot commit while an observer is running; move the indexing to a job",
            "The observer runs twice, once per attempt; add an idempotency key",
          ],
          correctIndex: 0,
          explanation:
            "Model events fire immediately, transaction or not. `ShouldHandleEventsAfterCommit` defers the handlers until commit, and runs them straight away when no transaction is open.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-soft-deletes-events-q8",
          prompt: "What do `restore()` and `forceDelete()` do on a soft-deleting model?",
          options: [
            "`restore()` nulls `deleted_at`; `forceDelete()` removes the row permanently",
            "`restore()` re-inserts the row from an archive table; `forceDelete()` nulls `deleted_at`",
            "Both are aliases for `delete()` with different event names",
            "`restore()` reverts the last save; `forceDelete()` cascades to related models",
          ],
          correctIndex: 0,
          explanation:
            "They fire `restoring`/`restored` and `forceDeleting`/`forceDeleted` respectively, which is where you hook cleanup like removing uploaded files that only a permanent delete should destroy.",
        },
        {
          id: "lv-eloquent-soft-deletes-events-q9",
          prompt: "A `Post` soft-deletes, and `Comment` belongsTo `Post`. What does `$comment->post` return after the post is soft-deleted?",
          options: [
            "`null`, because the relationship query inherits the soft-delete global scope",
            "The trashed post, because relationships ignore global scopes",
            "A `ModelNotFoundException`",
            "An empty `Post` instance",
          ],
          correctIndex: 0,
          explanation:
            "Relationship queries are ordinary Eloquent queries and the trait's global scope applies, so the comment appears orphaned. `$comment->post()->withTrashed()->first()` is how you reach it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-soft-deletes-events-q10",
          prompt: "Which are legitimate reasons to prefer an observer over a `booted()` closure? (Select all that apply.)",
          options: [
            "Several events on one model belong together and would clutter the model class",
            "The listeners have dependencies you want resolved from the container",
            "You want the behaviour to be testable in isolation from the model",
            "Closures registered in `booted()` cannot listen to `deleting`",
            "Observers fire for mass updates while closures do not",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Observers are an organisational choice — grouping, injection and testability. Both mechanisms listen to the same events and both are skipped by mass operations.",
        },
        {
          id: "lv-eloquent-soft-deletes-events-q11",
          prompt: "What does returning `false` from a `deleting` observer method do?",
          options: [
            "Cancels the delete",
            "Nothing — the return value is ignored on `-ing` events",
            "Converts the delete into a soft delete",
            "Throws a `ModelNotFoundException` to the caller",
          ],
          correctIndex: 0,
          explanation:
            "`-ing` events are the veto point: returning `false` aborts the operation and `delete()` returns false. `-ed` events fire after the write and cannot undo it.",
        },
      ],
    },
    {
      id: "lv-eloquent-transactions",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Transactions and Locking",
      summary:
        "`DB::transaction(function () { … })` is the shape you want: the closure runs inside `BEGIN`/`COMMIT`, any exception triggers a rollback and is rethrown, and there is no path where a `return` leaves the transaction open. Manual `beginTransaction()`/`commit()`/`rollBack()` exists for the cases a closure cannot express, and is where leaked transactions come from — one early `return` between `begin` and `commit` and the connection holds locks until the request dies.\n\nAtomicity is not the only property you need. A read-modify-write — \"fetch the balance, subtract 100, save\" — is a lost-update race even inside a transaction, because two concurrent transactions can both read the same starting balance. The fixes are pessimistic (`lockForUpdate()` so the second reader blocks until the first commits, `sharedLock()` when readers may coexist but writers must not) or optimistic (a version column plus a conditional update), or you push the arithmetic into SQL with `increment()`/`decrement()` so the database does the read and the write in one statement.\n\nThree things that surprise people. Laravel supports nesting: an inner `DB::transaction` inside an outer one issues a `SAVEPOINT` rather than a second `BEGIN`, so an inner rollback unwinds to the savepoint and the outer transaction lives on — and a rollback of the outer one discards the inner \"committed\" work too. The `attempts` argument retries the whole closure on deadlock, which is only safe if the closure is idempotent, because side effects outside the database (emails, HTTP calls) run again. And DDL — `create table`, `alter table` — causes an implicit commit on MySQL, silently ending the transaction and leaving Laravel's nesting counter out of step with reality.",
      level: "expert",
      estMinutes: 60,
      webRefs: [
        { label: "Laravel 13: Database Transactions", url: "https://laravel.com/framework/docs/13.x/database#database-transactions", kind: "docs" },
        { label: "Laravel 13: Pessimistic Locking", url: "https://laravel.com/framework/docs/13.x/queries#pessimistic-locking", kind: "docs" },
        { label: "PostgreSQL: Transaction Isolation", url: "https://www.postgresql.org/docs/current/transaction-iso.html", kind: "docs" },
        { label: "MySQL: InnoDB Deadlocks", url: "https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html", kind: "docs" },
      ],
      video: {
        title: "Laravel DB Transaction with Try-Catch for Deadlocks",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=GeoxHso_-qI",
        videoId: "GeoxHso_-qI",
        durationLabel: "3:50",
      },
      alternateVideos: [
        {
          title: "Laravel: Avoid Race Conditions with Atomic Locks in Cache",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=zybiFatkoCo",
          videoId: "zybiFatkoCo",
          durationLabel: "3:38",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-transactions-q1",
          prompt: "What happens when the closure passed to `DB::transaction(...)` throws?",
          options: [
            "The transaction is rolled back and the exception is rethrown to the caller",
            "The transaction is rolled back and the exception is swallowed; the method returns `false`",
            "The transaction is committed up to the point of the throw",
            "Nothing is rolled back unless you call `DB::rollBack()` in a catch block",
          ],
          correctIndex: 0,
          explanation:
            "Rollback plus rethrow is the point: your calling code still gets to handle the failure, and you never have to remember the `rollBack()` call. Catching inside the closure and not rethrowing is how people accidentally commit a half-finished transaction.",
        },
        {
          id: "lv-eloquent-transactions-q2",
          prompt:
            "Two requests run this concurrently for the same account, which starts at 500. What is the classic outcome, and why?\n\n```php\nDB::transaction(function () use ($id) {\n    $account = Account::find($id);\n    $account->balance -= 100;\n    $account->save();\n});\n```",
          options: [
            "The balance can end at 400 instead of 300, because both transactions read 500 before either wrote",
            "The balance always ends at 300, because the transaction serialises the two requests",
            "The second request throws a deadlock exception and is retried automatically",
            "The balance ends at 500, because the second write is rejected",
          ],
          correctIndex: 0,
          explanation:
            "A transaction gives atomicity, not mutual exclusion — under the usual READ COMMITTED or REPEATABLE READ isolation, both reads see 500. `Account::whereKey($id)->lockForUpdate()->first()` or `decrement('balance', 100)` fixes it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-transactions-q3",
          prompt: "What is the difference between `lockForUpdate()` and `sharedLock()`?",
          options: [
            "`lockForUpdate` blocks other readers taking either lock type and all writers; `sharedLock` lets other shared readers through but blocks writers",
            "`lockForUpdate` locks the table; `sharedLock` locks the row",
            "`lockForUpdate` is advisory; `sharedLock` is enforced by the engine",
            "`sharedLock` is for reads inside a transaction; `lockForUpdate` works outside one too",
          ],
          correctIndex: 0,
          explanation:
            "A shared lock is the \"nobody may change this while I read it\" lock; an exclusive `FOR UPDATE` lock is the \"I am about to change this\" lock. Both only mean anything inside a transaction — outside one they are released immediately.",
        },
        {
          id: "lv-eloquent-transactions-q4",
          prompt: "What does the `attempts` argument do in `DB::transaction($callback, attempts: 5)`?",
          options: [
            "Retries the whole closure up to 5 times when a deadlock occurs, then rethrows",
            "Retries only the failing statement, up to 5 times",
            "Waits up to 5 seconds for a lock before giving up",
            "Splits the work into 5 sub-transactions",
          ],
          correctIndex: 0,
          explanation:
            "Because the entire closure re-runs, retries are only safe if it is idempotent inside the database *and* free of external side effects — an email sent on attempt 1 is not un-sent by the rollback.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-transactions-q5",
          prompt: "An inner `DB::transaction()` is nested inside an outer one and the inner block throws and is caught. What is the state?",
          options: [
            "The inner work is rolled back to a savepoint; the outer transaction continues and can still commit",
            "Both transactions are rolled back immediately",
            "The inner block commits independently of the outer one",
            "Laravel throws, because nested transactions are not supported",
          ],
          correctIndex: 0,
          explanation:
            "Laravel issues `SAVEPOINT trans2` rather than a second `BEGIN` on drivers that support it. The corollary is that an inner \"commit\" is not durable — rolling back the outer transaction discards it too.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-transactions-q6",
          prompt: "Which of these are real hazards of manual `DB::beginTransaction()`? (Select all that apply.)",
          options: [
            "An early `return` between begin and commit leaves the transaction open, holding locks",
            "An exception on a path with no `try`/`catch` leaves the transaction open",
            "Forgetting `commit()` means the work is silently discarded when the connection closes",
            "Manual transactions cannot be nested at all",
            "Manual transactions ignore the `attempts` deadlock retry, which the closure form provides",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation:
            "All of the failure modes are about control flow escaping the begin/commit pair. Nesting works the same way for manual transactions — it is the savepoint mechanism, not the API, that provides it.",
        },
        {
          id: "lv-eloquent-transactions-q7",
          prompt:
            "Why can `DB::unprepared('create table …')` inside a transaction corrupt Laravel's transaction bookkeeping on MySQL?",
          options: [
            "DDL causes an implicit commit, so the transaction ends without Laravel knowing, and its nesting counter is now wrong",
            "`unprepared` opens a second connection that is not part of the transaction",
            "DDL statements are queued until the transaction commits",
            "MySQL rejects DDL inside a transaction and the statement is skipped",
          ],
          correctIndex: 0,
          explanation:
            "MySQL commits the open transaction before executing DDL. Laravel still believes it is one level deep, so a later `rollBack()` targets a transaction that no longer exists — which is one reason migrations and data changes belong in separate steps.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-transactions-q8",
          prompt: "A job is dispatched from inside a transaction and the queue worker picks it up before the commit. What is the symptom?",
          options: [
            "The worker cannot find the model the job refers to, because the row is not visible outside the uncommitted transaction",
            "The job is executed twice, once before and once after the commit",
            "The job silently fails with a serialisation error",
            "The transaction blocks until the job finishes",
          ],
          correctIndex: 0,
          explanation:
            "A classic race, and the reason for after-commit dispatching on connections that support it. The same reasoning drives `ShouldHandleEventsAfterCommit` for observers.",
        },
        {
          id: "lv-eloquent-transactions-q9",
          prompt: "Which approach makes \"decrement stock by 1, never below zero\" safe under concurrency, with the least locking?",
          options: [
            "A single conditional update: `Product::whereKey($id)->where('stock', '>', 0)->decrement('stock')`, checking the affected-row count",
            "Read the row, check `stock > 0` in PHP, then `save()` inside a transaction",
            "Read with `sharedLock()`, then update",
            "Wrap the read and write in `DB::transaction()` with `attempts: 3`",
          ],
          correctIndex: 0,
          explanation:
            "One statement does the read and the write atomically inside the engine, and an affected count of 0 tells you it was already exhausted. Every other option still has a window between the read and the write, except an exclusive lock, which serialises more than it needs to.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-transactions-q10",
          prompt: "Why does keeping an HTTP call to a payment provider inside `DB::transaction()` tend to cause problems?",
          options: [
            "The transaction holds locks for the whole round trip, and a timeout can leave the provider charged while the database rolls back",
            "Laravel forbids network calls inside transactions",
            "The HTTP client opens its own transaction on the same connection",
            "Rolling back also cancels any in-flight HTTP request",
          ],
          correctIndex: 0,
          explanation:
            "Transactions should be short and contain only database work. External effects are not transactional, so the durable pattern is to record intent, commit, then perform the call — and reconcile with a webhook.",
        },
        {
          id: "lv-eloquent-transactions-q11",
          prompt: "Which statements about isolation levels are accurate? (Select all that apply.)",
          options: [
            "InnoDB's default is REPEATABLE READ; PostgreSQL's default is READ COMMITTED",
            "SERIALIZABLE can make a transaction fail at commit time, so the application must be prepared to retry",
            "A higher isolation level reduces anomalies at the cost of more blocking or more aborts",
            "Isolation level has no effect on lost updates in a read-modify-write",
            "Laravel sets SERIALIZABLE by default for Eloquent queries",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Laravel does not change the connection's isolation level — you get the engine's default. Isolation absolutely affects lost updates, which is precisely why explicit locking or atomic statements are the reliable answer rather than hoping the level is strict enough.",
        },
      ],
    },
    {
      id: "lv-eloquent-serialization",
      moduleId: "laravel-eloquent",
      trackId: "php",
      title: "Serialising Models for APIs",
      summary:
        "Returning a model from a controller works because Eloquent implements `JsonSerializable` and `Arrayable`: Laravel casts it to JSON for you. That convenience is also the hazard, because the default shape of the JSON is the shape of your table. Add a column and it appears in the API. Rename one and every client breaks. The model's serialisation controls — `#[Hidden]`, `#[Visible]`, `#[Appends]`, and the runtime `makeVisible`/`makeHidden`/`append` — are how you draw that boundary at the model level.\n\n`toArray()` is recursive over attributes and **loaded** relationships, running casts and accessors on the way, and relationship keys are snake-cased even though the methods are camel-cased: an `orderItems()` relationship serialises as `order_items`. Because only loaded relations are included, the same endpoint can emit two different response shapes depending on whether something upstream called `with()` — a subtle, real API bug. `attributesToArray()` is the version that excludes relations.\n\nThe model-level controls have a ceiling, and knowing where it is matters. They are global to the model, so \"admins see the email, everyone else does not\" cannot be expressed with `#[Hidden]` alone; that is what API resources are for, and why Laravel 13 ships first-party JSON:API resources on top of them. Use `#[Hidden]` as a safety net for things that must never leak — `password`, `remember_token`, API secrets — and a resource class for anything shaped by the audience. And remember `#[Hidden]` only affects serialisation: the attribute is still loaded, still readable in PHP, and still in `toArray()` if someone calls `makeVisible`.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Laravel 13: Eloquent Serialization", url: "https://laravel.com/framework/docs/13.x/eloquent-serialization", kind: "docs" },
        { label: "Laravel 13: Eloquent — Appending Values to JSON", url: "https://laravel.com/framework/docs/13.x/eloquent-serialization#appending-values-to-json", kind: "docs" },
        { label: "PHP Manual: JsonSerializable", url: "https://www.php.net/manual/en/class.jsonserializable.php", kind: "docs" },
        { label: "JSON:API specification", url: "https://jsonapi.org/", kind: "spec" },
      ],
      video: {
        title: "What Is Eloquent Serialization? | Laravel For Beginners | Learn Laravel",
        channel: "Code With Dary",
        url: "https://www.youtube.com/watch?v=kJL-kq-LCAA",
        videoId: "kJL-kq-LCAA",
        durationLabel: "8:03",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "lv-eloquent-serialization-q1",
          prompt: "What does `$user->toArray()` include?",
          options: [
            "All visible attributes plus any relationships that are currently loaded, recursively",
            "All attributes and all relationships, loading any that are missing",
            "Only the attributes; relationships are never included",
            "Only the attributes listed in `$fillable`",
          ],
          correctIndex: 0,
          explanation:
            "It never triggers a query — unloaded relations are simply absent. `attributesToArray()` is the variant that excludes relations even when they are loaded.",
        },
        {
          id: "lv-eloquent-serialization-q2",
          prompt:
            "A model has an `orderItems()` relationship. Under what key does it appear in `toJson()` output?",
          options: ["`order_items`", "`orderItems`", "`order_items_relation`", "`items`"],
          correctIndex: 0,
          explanation:
            "Relationship methods are camel-cased in PHP and snake-cased in the serialised output. It is the same convention that makes an `isAdmin()` accessor append as `is_admin`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-serialization-q3",
          prompt:
            "The same endpoint returns `{ \"id\": 1, \"title\": \"…\" }` in one deploy and `{ \"id\": 1, \"title\": \"…\", \"author\": {…} }` in the next, with no controller change. What is the likely cause?",
          options: [
            "Something upstream now eager loads `author`, and `toArray()` includes loaded relationships",
            "The `author` column was added to `$fillable`",
            "A new global scope joined the authors table",
            "The model gained an `author` accessor",
          ],
          correctIndex: 0,
          explanation:
            "Serialisation shape is coupled to load state, so an unrelated `with('author')` for a performance fix silently changes the API contract. An explicit resource class is the fix, because it states the shape regardless of what is loaded.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-serialization-q4",
          prompt: "What is the difference between `#[Hidden([...])]` and `#[Visible([...])]`?",
          options: [
            "`Hidden` is a deny list; `Visible` is an allow list where everything unlisted is hidden",
            "`Hidden` applies to JSON only; `Visible` applies to arrays only",
            "`Hidden` removes the attribute from the model; `Visible` only affects output",
            "They are the same, with `Visible` being the newer name",
          ],
          correctIndex: 0,
          explanation:
            "An allow list is safer for a model whose table will grow, because a new column is hidden by default. Both only affect `toArray()`/`toJson()` — the attribute is still there in PHP.",
        },
        {
          id: "lv-eloquent-serialization-q5",
          prompt:
            "You need an `is_admin` value in the JSON that has no database column. What is the complete recipe?",
          options: [
            "Define an `isAdmin(): Attribute` accessor, then add `is_admin` to the model's `#[Appends([...])]` list",
            "Define an `isAdmin(): Attribute` accessor — appended attributes are automatic",
            "Add `is_admin` to `#[Appends([...])]` — Laravel derives it from the model",
            "Add `'is_admin' => 'boolean'` to the `casts()` method",
          ],
          correctIndex: 0,
          explanation:
            "Accessors are lazy by design, so they only serialise when explicitly appended, and the appends list uses the snake-case name even though the method is camel-case. A cast needs a real column to cast.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-serialization-q6",
          prompt: "Which of these are true about runtime visibility changes? (Select all that apply.)",
          options: [
            "`$user->makeVisible('email')->toArray()` exposes a normally-hidden attribute for that instance",
            "`$user->append('is_admin')` adds an appended accessor for that instance only",
            "`setHidden([...])` replaces the hidden list wholesale rather than merging",
            "`makeVisible` persists the change for every future instance in the request",
            "Appended attributes ignore the hidden and visible lists",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "All of these are per-instance overrides, which is what makes them safe inside a single response. Appended attributes do respect the visible/hidden configuration, and `mergeVisible`/`mergeHidden` are the additive counterparts to `setVisible`/`setHidden`.",
        },
        {
          id: "lv-eloquent-serialization-q7",
          prompt: "What does overriding `serializeDate(DateTimeInterface $date): string` change?",
          options: [
            "The format dates take in array and JSON output, with no effect on how they are stored",
            "Both the JSON format and the format written to the database",
            "The timezone used for all Carbon instances in the application",
            "The format accepted when parsing incoming dates",
          ],
          correctIndex: 0,
          explanation:
            "It is a presentation hook only — storage format is the driver's business. Note that changing it to something like `Y-m-d` throws away time and offset information that clients may be relying on.",
        },
        {
          id: "lv-eloquent-serialization-q8",
          prompt: "A `#[Hidden(['password'])]` model is dumped with `dd($user)` during debugging. Is the password visible?",
          options: [
            "Yes — `#[Hidden]` only affects `toArray()`/`toJson()`, not the model's attributes",
            "No — hidden attributes are never loaded from the database",
            "No — hidden attributes are stripped from the model after hydration",
            "Only if `makeVisible` was called earlier in the request",
          ],
          correctIndex: 0,
          explanation:
            "Hiding is a serialisation concern, not a security boundary inside PHP. The attribute is loaded, readable, and will appear in a `dd()`, a log of `$user->getAttributes()`, or an exception report.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "lv-eloquent-serialization-q9",
          prompt: "When should you stop using model-level serialisation and write an API resource class instead?",
          options: [
            "As soon as the output shape depends on the audience, the endpoint or a version — one model cannot have two shapes",
            "As soon as the model has more than ten columns",
            "Only when the API must follow the JSON:API specification",
            "When relationships need to be included in the response",
          ],
          correctIndex: 0,
          explanation:
            "`#[Hidden]`/`#[Appends]` are global to the class, so per-role or per-version shapes force runtime juggling that quickly becomes unreadable. Resources make the transformation explicit per endpoint; Laravel 13 additionally ships JSON:API resources for teams that want that convention.",
        },
        {
          id: "lv-eloquent-serialization-q10",
          prompt: "Why does `return User::all();` from a route produce JSON without any explicit conversion?",
          options: [
            "Models and collections implement `JsonSerializable`, and Laravel casts returned values to a JSON response",
            "The router runs `json_encode` on every return value regardless of type",
            "`all()` returns an array, which Laravel encodes",
            "A middleware converts Eloquent objects to arrays before the response is sent",
          ],
          correctIndex: 0,
          explanation:
            "Casting a model to a string also triggers `toJson()` for the same reason. The convenience is real, and it is also how an unfiltered model shape reaches production without anyone deciding to publish it.",
        },
      ],
    },
  ],
} satisfies Module;
