# Eloquent & Migrations research notes (2026-09-23)

Second Laravel camp in the v3 PHP track, covering the whole data layer. Scope boundaries held
deliberately: routing/controllers/validation stay in `laravel-foundations`, auth in `laravel-auth`,
API resources as an HTTP concern in `laravel-apis`, queues in `laravel-queues-events`, testing in
`laravel-testing`. The serialisation topic here is therefore about the *model's* JSON shape
(`toArray`, `#[Hidden]`, `#[Appends]`, `serializeDate`) and stops at the point where a resource
class becomes the right answer — it says so explicitly and hands off.

14 topics, 146 quiz questions, all `quiz` (the sandbox is a V8 isolate and cannot grade PHP —
same decision as the rest of the PHP track, logged under `## v3 decisions` in `docs/PROGRESS.md`).

Topic order: migrations → query builder → models/conventions/mass assignment → retrieving and
persisting → relationships → polymorphic → **N+1 (milestone, expert)** → accessors/mutators/casts →
scopes → collections → factories and seeding → soft deletes/events/observers → transactions and
locking → serialisation.

One milestone only, `lv-eloquent-n-plus-one`, per the brief's framing that it is the single most
valuable thing in the camp. `lv-eloquent-transactions` is the other `expert` topic but is not
marked a milestone, to keep the emphasis where the brief put it.

Relationships are one topic rather than two (12 questions covering `hasOne`/`hasMany`/`belongsTo`
conventions, pivot tables and `hasManyThrough`), which is how the Laravel docs group them and is
what kept the camp at the requested 12–14 rather than 15.

## Videos

Every id below was produced by `yt.mjs search` and confirmed with `yt.mjs info`; all 22 report
`embeddable: true`, and the titles/durations in the module are copied from `info` output.

Three spines plus dedicated videos where one clearly beats a chapter.

- **`SqTdHCTWqks`** — "30 Days to Learn Laravel - Complete 8 Hour Course" (**Laracasts**, 8:29:58).
  Best-chaptered free Laravel course there is. Used at **6231s "09 Meet Eloquent"**
  (`lv-eloquent-models`), **7328s "10 Model Factories"** and **11242s "15 Understanding Database
  Seeders"** (`lv-eloquent-factories-seeding`), **8485s "11 Two Key Eloquent Relationship Types"**
  and **8953s "12 Pivot Tables and BelongsToMany Relationships"** (`lv-eloquent-relationships`).
  Chapter 13 (9822s) is the N+1 episode, but Laracasts also publishes it standalone — see below —
  so the standalone version is used instead of a deep link into an 8-hour file.
- **`0M84Nk7iWkA`** — "Laravel 12 in 11 hours" (**The Codeholic**, 10:54:51). Database chapters
  only, as instructed; the earlier ones belong to `laravel-foundations` and were left alone.
  Used at **17787s "Migrations"** (alternate), **20112s "Eloquent ORM Basics"**
  (`lv-eloquent-retrieving`), **27051s "Factories"** (alternate) and **35642s "Database Where
  Clause"** (`lv-eloquent-query-builder`). Unused but confirmed: 17020s Introduction to Databases,
  24316s Eloquent ORM Relationships, 29787s Data Seeding, 31284s Output Data on the Website,
  36598s Data Pagination (pagination is an HTTP concern and went to another camp).
- **`ZkDTqAi2_6s`** — "Getting Started with Databases & Migrations in Laravel" (**Program With
  Gio**, 35:36, Feb 2025). Primary for `lv-eloquent-migrations`: recent, focused, and a better fit
  than a chapter of either long course.

Dedicated videos:

| Topic | Video | Why |
| --- | --- | --- |
| `lv-eloquent-n-plus-one` | `gaW9KODumUg` Laracasts, "30 Days to Learn Laravel, Ep 13 - Eager Loading and the N+1 Problem" (10:35) | The standalone cut of the chapter, so the milestone gets a 10-minute video rather than a seek into 8 hours. Alternate `p1X-j4Mob1E` "Laravel Just Destroyed Your... N+1 Problem" (5:12, Apr 2025) covers automatic eager loading, which the quiz asks about. |
| `lv-eloquent-polymorphic` | `rx1DQBE01b0` Laravel Daily, "Eloquent Polymorphic Relations: Properly Explained" (9:55) | 44k views and still accurate — the `morphTo`/`morphMany`/morph-map API has not changed. It is from 2018, so two recent alternates are attached: `8aLPIjSnaug` (Laravel 12, Apr 2025) and `Ko_1A9LjRuY` ("Laravel MorphMap Explained", Oct 2025). |
| `lv-eloquent-accessors-casts` | `i4RGuYj7zi0` Laracasts, "The New Way to Define Eloquent Accessors and Mutators" (8:38) | Teaches the `Attribute::make(get:, set:)` form that is current, not the `getFooAttribute` form. Alternate `t_wtC3qR-n0` Laravel Daily on dates and casts. |
| `lv-eloquent-scopes` | `F8Q2ZTbT4MA` Laravel Daily, "Eloquent Query Scopes: Local and Global" (11:11) | The mechanism is unchanged; only the declaration syntax moved to `#[Scope]`, which the summary and quiz cover. Alternate `IB0NHhNYDRI` is a Laravel 12 guide (Feb 2026) for the current syntax. |
| `lv-eloquent-collections` | `a2QvlLs0uEk` Andrew Schmelyun, "Organizing data with Laravel Collections" (32:51) | Problem-first rather than a method tour. Alternate `XWKnMU6MnIw` (Code With Dary, 1:25:35) deep-linked at 821s for the method reference. |
| `lv-eloquent-soft-deletes-events` | `ffAt9Np-zEM` Laravel Daily, "Eloquent Soft Deletes: Things You May Not Know" (10:57) | The "things you may not know" framing is the right depth. Alternate `yBWcJrwswuU` (Apr 2025) for observers vs event listeners. |
| `lv-eloquent-transactions` | `GeoxHso_-qI` Laravel Daily, "Laravel DB Transaction with Try-Catch for Deadlocks" (3:50, Dec 2025) | Short but exactly on topic, including the `attempts` retry. Alternate `zybiFatkoCo` on atomic locks for the race-condition angle. |
| `lv-eloquent-serialization` | `kJL-kq-LCAA` Code With Dary, "What Is Eloquent Serialization?" (8:03) | The only focused free video found on `toArray`/`$hidden`/`$appends`; adequate, and the quiz carries the depth. |
| `lv-eloquent-models` (alt) | `onA9syquR9w` cdruc, "Laravel mass assignment and fillable vs guarded" (6:30) | |
| `lv-eloquent-query-builder` (alt) | `uVsY_OXRq5o` Laravel Daily, "Eloquent or Query Builder: When to Use Which?" (5:48, 93k views) | The decision framing the topic is built around. |
| `lv-eloquent-relationships` (alt) | `6DvUNEwICno` Laravel Daily, "NEW in Laravel 9.51: hasManyThrough Shorter Syntax" (5:56) | |

**No search-URL fallbacks.** Every topic has a real, embeddable video.

Searched and rejected: the query-builder results are dominated by Hindi/Urdu tutorials and
sub-1k-view channels, which is why that topic uses the Codeholic chapter rather than a standalone
video. Nothing current and English was found for `lv-eloquent-serialization` beyond the 2021 Code
With Dary video — flagged as the weakest video pick in the camp, though the API it describes is
unchanged apart from the Laravel 13 attribute syntax.

## References

All 51 reference URLs checked with `check-urls.mjs`; every one returns 200.

- **`laravel.com/docs/13.x/…` 302s to `laravel.com/framework/docs/13.x/…`** — the final URL is what
  is in `webRefs`, as instructed. Slugs confirmed: `eloquent`, `eloquent-relationships`,
  `eloquent-collections`, `eloquent-mutators`, `eloquent-serialization`, `eloquent-factories`,
  `migrations`, `queries`, `seeding`, `database`, `collections`, `pagination`, `eloquent-resources`.
- Anchors were read out of each page's own HTML rather than guessed, so the deep links
  (`#mass-assignment`, `#eloquent-model-conventions`, `#query-scopes`, `#global-scopes`,
  `#soft-deleting`, `#events`, `#eager-loading`, `#preventing-lazy-loading`,
  `#polymorphic-relationships`, `#many-to-many`, `#custom-casts`, `#pessimistic-locking`,
  `#raw-expressions`, `#database-transactions`, `#column-method-morphs`,
  `#appending-values-to-json`) all exist.
- **`github.com/barryvdh/laravel-debugbar` redirects to `github.com/fruitcake/laravel-debugbar`** —
  noted, but not used in the end; `beyondcode/laravel-query-detector` is the N+1 repo reference.
- **Dead ends** (all 404, none shipped): `laravel-news.com/laravel-query-scopes`,
  `/custom-eloquent-casts`, `/polymorphic-relationships`, `/model-observers`,
  `/eloquent-vs-query-builder`, `/collection-macros`, `/laravel-13-json-api-resources` — guessing
  laravel-news slugs does not work. Also `reinink.ca/articles/ordering-database-queries-by-
  relationship-columns` and `carbon.nesbot.com/docs` (the Carbon GitHub repo is used instead).
- **No interview-prep ref.** Same finding as `php-foundations`: there is no Laravel equivalent of
  `lydiahallie/javascript-questions` worth shipping. The `isEdgeCaseOrInterviewQuestion` questions
  carry that weight — 59 of the 146 across the camp, alongside 23 multi-select questions.
- **Iframe previews:** `laravel.com` (`X-Frame-Options: SAMEORIGIN`), `martinfowler.com` (`DENY`),
  `php.net`, `php.watch`, `use-the-index-luke.com`, `dev.mysql.com` (all SAMEORIGIN),
  `github.com` and `postgresql.org` (`CSP frame-ancestors 'none'`) all **block** framing, so almost
  every card in this camp falls back to a link preview. The three that do preview inline:
  `planetscale.com`, `reinink.ca`, `jsonapi.org`, `sqlite.org`.

## Facts verified

Read off the live Laravel 13.x docs and, where the docs are silent, off the `13.x` framework
source on 2026-09-23. Nothing here is from memory.

### Laravel 13 moved Eloquent configuration onto PHP attributes

The 13.x docs now lead with attributes where they previously showed properties. Confirmed on the
live pages: `#[Fillable([...])]`, `#[Guarded([...])]`, `#[Unguarded]`, `#[Hidden([...])]`,
`#[Visible([...])]`, `#[Appends([...])]`, `#[Scope]`, `#[ScopedBy([...])]`, `#[ObservedBy([...])]`,
`#[CollectedBy(...)]`, `#[UseFactory(...)]`. The old properties still work; the quizzes teach the
attribute form and never assert that the property form is gone.

### Migrations

- `change()` replaces the whole column definition — "any missing attribute will be dropped" —
  and does not touch indexes; index modifiers must be restated.
- **Laravel 13 additions:** `->instant()` (MySQL INSTANT algorithm; cannot combine with `after()`
  or `first()` because instant additions only append) and `->lock('none'|'shared'|'exclusive'|
  'default')` for DDL locking. Both raise a MySQL error rather than silently falling back.
- `foreignId()` = `UNSIGNED BIGINT`; `foreignIdFor(Model::class)` picks `UNSIGNED BIGINT`,
  `CHAR(36)` or `CHAR(26)` from the model's key type.
- `migrate:rollback` reverses the last **batch**; `migrate --step` puts each migration in its own
  batch. `--pretend` prints SQL without executing. `shouldRun(): bool` skips a migration and leaves
  it pending. `schema:dump [--prune]` squashes; supported on MariaDB/MySQL/PostgreSQL/SQLite only,
  because it shells out to the vendor CLI.
- `migrate:refresh` runs every `down()`; `migrate:fresh` drops all tables regardless of prefix.

### Query builder

- Values in `where`/`whereIn` go through PDO bindings; the docs state plainly that raw expressions
  are injected as strings and "Laravel cannot guarantee that any query using raw expressions is
  protected against SQL injection".
- `chunk` while mutating is documented as unsafe — use `chunkById` / `lazyById`, which paginate on
  the primary key and add their own `where`, so your conditions should be grouped in a closure.
- `whereColumn` compares two identifiers; plain `where` would bind the second column name as a
  string literal.
- **Laravel 13:** `whereVectorSimilarTo($column, $vector|$text, minSimilarity: 0.0–1.0,
  order: bool)` — cosine similarity, orders by distance by default, supported on **PostgreSQL with
  pgvector and MariaDB 11.7+** only. Paired with `$table->vector(...)` and the `AsVector::class`
  cast.
- `sharedLock()` / `lockForUpdate()` are the pessimistic locking pair.

### Models, retrieval and persistence

- `Illuminate\Database\Eloquent\Builder::update()` calls `addUpdatedAtColumn($values)` (verified in
  the 13.x source), so an Eloquent mass update **does** maintain `updated_at` — while
  `DB::table()->update()` does not.
- Mass updates and mass deletes **do not** fire model events ("the models are never actually
  retrieved"). `destroy()` explicitly "loads each model individually and calls the delete method so
  that the `deleting` and `deleted` events are properly dispatched".
- `getOriginal()` = state as loaded; `getChanges()` = what the last save wrote; `getPrevious()` =
  the values before the last save (present in 13.x); `isDirty`/`isClean` pre-save,
  `wasChanged` post-save.
- `upsert($values, uniqueBy:, update:)` sets timestamps automatically; every database except SQL
  Server needs a primary/unique index on the `uniqueBy` columns, and **MariaDB/MySQL ignore the
  `uniqueBy` argument entirely**, using the table's own indexes.
- `cursor()` runs one query, keeps one model in memory, uses PHP generators, and **cannot eager
  load**; `lazy()` chunks underneath and can.
- `preventSilentlyDiscardingAttributes()` and `preventLazyLoading()` are the two strictness knobs,
  both documented as `! $this->app->isProduction()` / `$this->app->isLocal()` in `AppServiceProvider`.

### Relationships

- `hasOne`/`hasMany` derive the foreign key from the **parent model name** (`user_id`).
  `belongsTo` derives it from the **relationship method name** plus `_id` — the docs are explicit:
  "examining the name of the relationship method and suffixing the method name with `_id`". This is
  the single most surprising convention in the camp and is a quiz question.
- `belongsToMany` pivot table = the two model names joined **in alphabetical order** (`role_user`).
  Pivot columns need `withPivot(...)`; pivot timestamps need `withTimestamps()`; `->as('alias')`
  renames the `pivot` accessor; `->using(Class::class)` gives a custom pivot model.
- `attach` does not deduplicate. `sync` detaches anything absent; `syncWithoutDetaching` does not;
  `toggle` flips. `updateExistingPivot` changes pivot columns on one row.
  **Laravel 13** adds the `…OrFail` variants (`attachOrFail`, `syncOrFail`,
  `syncWithoutDetachingOrFail`, `toggleOrFail`), which wrap the operation in a transaction.
- `hasManyThrough` / `hasOneThrough`, plus the newer `$this->through('environments')
  ->has('deployments')` syntax. `withDefault()` returns a null-object model.
- `withCount` / `withSum` / `withMin` / `withMax` / `withAvg` / `withExists` add subquery columns
  named `{relation}_{function}_{column}`; must be called **after** `select()`.

### N+1 and eager loading (milestone)

- Documented query counts: lazy = 1 + N; `with('author')` = "only two queries will be executed —
  one query to retrieve all of the books and one query to retrieve all of the authors for all of
  the books". Nested `with('posts.comments')` is one query per level.
- The docs name the parent-hydration trap directly: "even though comments were eager loaded for
  every Post model, Eloquent does not automatically hydrate the parent Post on each child Comment
  model". `->chaperone()` on the `hasMany` (or at eager-load time) fixes it.
- Column-limited eager loads (`with('author:id,name')`) "should always include the `id` column and
  any relevant foreign key columns" — omit the key and the relation comes back null.
- `withWhereHas` filters *and* eager loads with the same constraint; plain `whereHas` only filters.
- `Model::preventLazyLoading(bool)` throws on a lazy load.
  `Model::automaticallyEagerLoadRelationships()` (global) and
  `$collection->withRelationshipAutoloading()` (per collection) lazy-eager-load on first access.
- Eager loading a `morphTo` issues one query per distinct `*_type` value; `morphWith` /
  `loadMorph` nest per type.

### Accessors, mutators and casts

- Accessor = one `protected` method returning `Attribute`, named in camel case for the snake-case
  column. Returned **objects are cached** and mutations sync back on save; `shouldCache()` opts a
  primitive into caching and `withoutObjectCaching()` opts an object out.
- Casts are declared by a `casts(): array` **method**. The documented 13.x cast list:
  `array`, `AsFluent::class`, `AsStringable::class`, `AsUri::class`, **`AsVector::class`**,
  `boolean`, `collection`, `date`, `datetime`, `immutable_date`, `immutable_datetime`,
  `decimal:<precision>`, `double`, `encrypted`, `encrypted:array`, `encrypted:collection`,
  `encrypted:object`, `float`, `hashed`, `integer`, `object`, `real`, `string`, `timestamp`.
  There is no `slug` cast.
- The plain `array` cast returns a primitive, so `$user->options['key'] = $value` "will trigger a
  PHP error" — `AsArrayObject`/`AsCollection` exist for in-place mutation.
- `decimal:n` returns a string (that is the point — no float rounding on money).
- Enums are cast by naming the enum class. Custom casts: `CastsAttributes`,
  `CastsInboundAttributes` (`make:cast --inbound`), `ComparesCastableAttributes` for dirty-checking,
  plus castables and anonymous cast classes.
- A `set:` closure returning an array writes several underlying columns from one assignment.

### Scopes

- Local scopes in 13.x are **`protected` methods carrying `#[Scope]`**
  (`Illuminate\Database\Eloquent\Attributes\Scope`). The docs warn: "Attributed scope methods
  should be protected. When calling an attributed scope from within the model class, call the scope
  through a query builder instance, such as `static::query()->ofType('admin')`."
- Dynamic scopes take parameters after `$query`. `withAttributes([...])` inside a scope adds where
  conditions **and** applies those attributes to models created through the scope.
- Global scopes: `#[ScopedBy([...])]`, `addGlobalScope(new Scope)` in `booted()`, or a named
  closure. Removed with `withoutGlobalScope(class|name)`, `withoutGlobalScopes([...])`,
  `withoutGlobalScopesExcept([...])`.
- The `orWhere` precedence trap is documented: "Combining multiple Eloquent model scopes via an
  `or` query operator may require the use of closures to achieve the correct logical grouping."
  `User::popular()->orWhere->active()` is the higher-order shorthand.

### Collections

- "All Eloquent methods that return more than one model result will return instances of the
  `Illuminate\Database\Eloquent\Collection` class."
- **Base-collection returns:** "the `collapse`, `flatten`, `flip`, `keys`, `pluck`, and `zip`
  methods return a base collection instance. Likewise, if a `map` operation returns a collection
  that does not contain any Eloquent models, it will be converted to a base collection instance."
  `modelKeys` also returns a base collection.
- `toQuery()` returns a builder with a `whereIn` on the collection's primary keys.
- Custom collections via `#[CollectedBy(UserCollection::class)]` or `newCollection()`.

### Factories and seeding

- `Factory::make()`/`create()` run inside `Model::unguarded(...)` (verified in the 13.x source), so
  factories bypass `$fillable`.
- Convention: `Database\Factories\<Model>Factory`; **Laravel 13** `#[UseFactory(...)]` overrides it.
- `Sequence` cycles state across a batch and exposes `$sequence->index`. `recycle()` shares one
  related model across a batch. `afterMaking`/`afterCreating` are registered in `configure()`.
- `db:seed` runs `Database\Seeders\DatabaseSeeder` unless `--class`; `--force` is required in
  production; `migrate:fresh --seed`. `WithoutModelEvents` mutes events "even if additional seed
  classes are executed via the `call` method". **There is no implicit transaction around seeding.**

### Soft deletes, events and observers

- Full 13.x event list, verbatim: `retrieved, creating, created, updating, updated, saving, saved,
  deleting, deleted, trashed, forceDeleting, forceDeleted, restoring, restored, replicating`.
  `-ing` before persistence, `-ed` after; `-ing` handlers returning `false` cancel the operation.
- `SoftDeletes` adds a global scope and casts `deleted_at` to Carbon. `withTrashed`, `onlyTrashed`,
  `restore`, `forceDelete`, `trashed()`. Relationship queries inherit the scope, so a soft-deleted
  parent reads as `null` through `belongsTo`.
- Observers: `make:observer X --model=Y`, registered with `#[ObservedBy([...])]` or `Model::observe`.
  `ShouldHandleEventsAfterCommit` defers handlers to commit, and runs them immediately when no
  transaction is open.
- `saveQuietly()` for one save; `Model::withoutEvents(closure)` for a block.
- Unique indexes and soft deletes conflict (the deleted row is still physically present) — this is
  a database fact, not a Laravel one, hence the PostgreSQL constraints reference.

### Transactions and locking

- `DB::transaction($closure, attempts: n)`: exception ⇒ rollback ⇒ **rethrow**. `attempts` retries
  the **whole closure** on deadlock.
- **Nested transactions use savepoints** — verified in
  `Illuminate\Database\Concerns\ManagesTransactions`: `$this->transactions >= 1 &&
  $this->queryGrammar->supportsSavepoints()` ⇒ `createSavepoint()` compiling
  `SAVEPOINT trans{n+1}`, and rollback compiles `compileSavepointRollBack`.
- Implicit commits: the docs warn that `DB::statement`/`DB::unprepared` running DDL "will cause the
  database engine to indirectly commit the entire transaction, leaving Laravel unaware of the
  database's transaction level".
- Isolation-level facts used in one quiz (InnoDB default REPEATABLE READ, PostgreSQL default READ
  COMMITTED, SERIALIZABLE can abort at commit) come from the two vendor doc pages referenced on
  that topic. Laravel does not set an isolation level of its own.

### Serialisation

- `toArray()` is recursive over attributes and **loaded** relations; `attributesToArray()` excludes
  relations. Relationship keys are snake-cased even though methods are camel-cased.
- Models and collections serialise automatically when returned from a route, and `(string) $model`
  calls `toJson()`.
- `makeVisible`/`mergeVisible`/`setVisible` and `makeHidden`/`mergeHidden`/`setHidden` are
  per-instance; `append`/`mergeAppends`/`setAppends`/`withoutAppends` likewise. "Attributes in the
  appends array will also respect the `visible` and `hidden` settings configured on the model."
- `serializeDate(DateTimeInterface $date): string` changes array/JSON output only and "does not
  affect how your dates are formatted for storage in the database". The exact default format string
  is **not** stated on the 13.x page, so no quiz question asserts it.
- Laravel 13's first-party **JSON:API resources** are mentioned as the handoff point to
  `laravel-apis`; the spec is linked but not taught here.

## Checks

`npm run content:check -- --module laravel-eloquent` → 14 topics, 146 quiz questions, **0 errors,
0 warnings**. `npm run content:types` → clean. All 51 reference URLs return 200; all 22 video ids
re-confirmed `embeddable: true` after the module was written.
