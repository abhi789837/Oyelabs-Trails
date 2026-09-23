import type { Module } from "@/types/curriculum";

export default {
  id: "php-composer-psr",
  trackId: "php",
  name: "Composer & PSR Standards",
  description:
    "How PHP code is organised, shared and depended on. Namespaces and PSR-4 autoloading, Composer's resolution and lock model, publishing to Packagist, and the FIG interop standards — PSR-3, PSR-7/15, PSR-11 — that let one project's code talk to another's without adapters.",
  refs: [
    { label: "Composer: Documentation", url: "https://getcomposer.org/doc/", kind: "docs" },
    { label: "PHP-FIG: PHP Standards Recommendations", url: "https://www.php-fig.org/psr/", kind: "spec" },
    { label: "PHP Manual: Namespaces", url: "https://www.php.net/manual/en/language.namespaces.rationale.php", kind: "docs" },
  ],
  topics: [
    {
      id: "php-psr-namespaces",
      moduleId: "php-composer-psr",
      trackId: "php",
      title: "Namespaces, `use` and Aliasing",
      summary:
        "PHP has one global symbol table for classes, functions and constants, and before 5.3 the only way to avoid collisions was a prefix convention — `Zend_Db_Table_Abstract`, `Twig_Environment`. Namespaces replaced the convention with a language feature, and PSR-4 then turned the namespace into the directory layout. That pairing is the whole reason two libraries can both ship a `Client` class today.\n\nA namespace is resolved entirely at compile time and costs nothing at runtime. `use App\\Models\\User;` does not load, include or touch anything — it creates an alias valid only inside that one file, so a `use` statement in a file you included does not carry over. Importing is per file even when two files sit in the same namespace, which is the single most common confusion when a class \"exists\" but PHP can't see it.\n\nThe resolution rules are deliberately asymmetric and that is where people get burnt. Inside a namespace, an unqualified class name always resolves against the current namespace — `new Exception()` inside `namespace App;` means `App\\Exception`, not the built-in one, so you need `\\Exception` or a `use`. Unqualified *function* and *constant* names do fall back to the global namespace, which is why `strlen()` keeps working but `new DateTime()` does not. Class names built as strings (`$class = 'App\\Models\\User'; new $class;`) skip aliasing entirely — they are always treated as fully qualified, so `use` has no effect on them.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "PHP Manual: Namespaces overview", url: "https://www.php.net/manual/en/language.namespaces.rationale.php", kind: "docs" },
        { label: "PHP Manual: Using namespaces — aliasing/importing", url: "https://www.php.net/manual/en/language.namespaces.importing.php", kind: "docs" },
        { label: "PHP Manual: Fallback to global space", url: "https://www.php.net/manual/en/language.namespaces.fallback.php", kind: "docs" },
        { label: "PHP: The Right Way", url: "https://phptherightway.com/", kind: "article" },
      ],
      video: {
        title: "PHP Namespace Tutorial - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=Jni9c0-NjrY",
        videoId: "Jni9c0-NjrY",
        durationLabel: "20:14",
      },
      alternateVideos: [
        {
          title: "PHP For Beginners, Ep 31 - Namespacing: What, Why, How",
          channel: "Laracasts",
          url: "https://www.youtube.com/watch?v=qPBcMEpcNpE",
          videoId: "qPBcMEpcNpE",
          durationLabel: "12:09",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-psr-namespaces-q1",
          prompt:
            "What happens here, assuming no `use` statements and no `App\\Exception` class?\n\n```php\nnamespace App;\n\nthrow new Exception('boom');\n```",
          options: [
            "A fatal error: class `App\\Exception` not found",
            "It throws the built-in `\\Exception` with message `boom`",
            "A warning, and the throw is ignored",
            "A parse error, because `throw` needs a fully qualified name",
          ],
          correctIndex: 0,
          explanation:
            "Unqualified class names resolve against the current namespace and never fall back to global, so PHP looks for `App\\Exception`. You need `\\Exception` or `use Exception;` at the top of the file.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-namespaces-q2",
          prompt:
            "Why does `strlen($s)` still work unqualified inside `namespace App;` when `new DateTime()` does not?",
          options: [
            "Function and constant names fall back to the global namespace; class names do not",
            "`strlen` is a language construct rather than a function",
            "Internal functions are automatically imported into every namespace by the engine",
            "The fallback applies to anything declared in an extension, including classes",
          ],
          correctIndex: 0,
          explanation:
            "PHP resolves unqualified functions and constants against the current namespace first and then the global one; classes only ever use the current namespace. `strlen` is an ordinary function, not a construct.",
        },
        {
          id: "php-psr-namespaces-q3",
          prompt: "What does `use App\\Services\\Mailer;` actually do at runtime?",
          options: [
            "Nothing — it is a compile-time alias, resolved before any code runs",
            "It includes the file that declares `Mailer`",
            "It triggers the registered autoloaders so the class is ready",
            "It registers the class in a global import table shared by every file",
          ],
          correctIndex: 0,
          explanation:
            "Importing is purely a naming shortcut for the current file. Loading is a separate concern handled by the autoloader, and only when the name is actually used.",
        },
        {
          id: "php-psr-namespaces-q4",
          prompt:
            "Two packages both provide a `Client` class. How do you use both in one file?\n\n```php\nuse Stripe\\Client;\nuse Aws\\Client;\n```",
          options: [
            "Alias at least one of them: `use Aws\\Client as AwsClient;`",
            "Nothing needed — PHP disambiguates by the order of the `use` statements",
            "Wrap one of them in a sub-namespace declared in the same file",
            "Refer to both by their short name and let the autoloader pick the right file",
          ],
          correctIndex: 0,
          explanation:
            "Importing two different classes under the same short name is a compile-time fatal error. `as` renames the alias for this file only; the class itself is unchanged.",
        },
        {
          id: "php-psr-namespaces-q5",
          prompt:
            "What class does this instantiate?\n\n```php\nnamespace App;\n\nuse App\\Models\\User;\n\n$class = 'User';\n$u = new $class();\n```",
          options: [
            "`\\User` — a dynamic class name is always treated as fully qualified",
            "`App\\Models\\User`, because the `use` alias applies",
            "`App\\User`, resolved against the current namespace",
            "It is a parse error: dynamic class names may not be used inside a namespace",
          ],
          correctIndex: 0,
          explanation:
            "Aliases are resolved at compile time and a string is not. A class name held in a variable is interpreted as fully qualified from the global namespace, so you must write the full `App\\Models\\User` — this is why `::class` exists.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-namespaces-q6",
          prompt: "Which statements about `use` are true? (Select all that apply.)",
          options: [
            "An alias is scoped to the file it appears in",
            "`use Foo\\Bar;` does not trigger the autoloader by itself",
            "`use function Foo\\helper;` and `use const Foo\\LIMIT;` import a function and a constant",
            "An alias is inherited by any file that `require`s this one",
            "`use` must appear before the `namespace` declaration",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Imports are per file, purely lexical, and available for classes, functions and constants. They do not travel across includes, and they come after the `namespace` line, not before it.",
        },
        {
          id: "php-psr-namespaces-q7",
          prompt:
            "What does this file do?\n\n```php\n<?php\necho \"starting\\n\";\nnamespace App;\n```",
          options: [
            "Fatal error: the namespace declaration must be the first statement in the file",
            "Prints `starting` and then declares the namespace for the rest of the file",
            "Prints `starting` and silently ignores the namespace declaration",
            "Declares the namespace first because declarations are hoisted",
          ],
          correctIndex: 0,
          explanation:
            "Apart from `declare()`, the `namespace` keyword must be the very first statement. Any output or code before it — including a stray blank line outside the PHP tags — is a fatal error.",
        },
        {
          id: "php-psr-namespaces-q8",
          prompt:
            "Inside `namespace App\\Http;`, what does `\\App\\Models\\User` mean compared with `App\\Models\\User`?",
          options: [
            "The leading backslash makes it fully qualified; without it the name is relative and resolves to `App\\Http\\App\\Models\\User`",
            "They are identical — the leading backslash is decorative",
            "The leading backslash forces the autoloader to skip the classmap",
            "Without the backslash PHP falls back to the global namespace if the relative name is missing",
          ],
          correctIndex: 0,
          explanation:
            "A qualified name that does not start with `\\` is relative to the current namespace, so it gets prefixed. There is no global fallback for class names, so the relative form simply fails to resolve.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-namespaces-q9",
          prompt:
            "What is the effect of this group `use` statement?\n\n```php\nuse App\\Models\\{User, Post, Comment as PostComment};\n```",
          options: [
            "It imports three classes from `App\\Models`, the last one aliased to `PostComment`",
            "It imports the `App\\Models` namespace so all of its classes are available unqualified",
            "It creates a new namespace containing those three classes",
            "It is only valid for functions, not classes",
          ],
          correctIndex: 0,
          explanation:
            "Group use (PHP 7+) is shorthand for three separate `use` lines and supports `as` per entry. PHP never imports a whole namespace — you always import individual symbols.",
        },
        {
          id: "php-psr-namespaces-q10",
          prompt:
            "One of these produces a class-name string that is not what it looks like. Which, and why?\n\n```php\n$a = \"App\\Models\\User\";\n$b = \"App\\repositories\\UserRepo\";\n$c = 'App\\Services\\Mailer';\n```",
          options: [
            "`$b` — `\\r` is a carriage-return escape in a double-quoted string",
            "`$a` — `\\M` and `\\U` are invalid escapes and raise a warning",
            "`$c` — single quotes strip the backslashes entirely",
            "None of them; backslashes are never escapes in PHP strings",
          ],
          correctIndex: 0,
          explanation:
            "Double-quoted strings interpret `\\r`, `\\n`, `\\t` and friends, so a lowercase segment after a backslash can silently mangle the name. Unknown escapes like `\\M` are left alone, and single quotes keep every backslash — which is why class-name strings belong in single quotes, or better, use `App\\Models\\User::class`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "php-psr-autoloading",
      moduleId: "php-composer-psr",
      trackId: "php",
      title: "PSR-4 Autoloading and How Composer's Autoloader Works",
      summary:
        "Autoloading exists because a manually maintained list of `require` calls does not survive a codebase of any size. `spl_autoload_register()` lets you hand PHP a callback that receives a class name the moment PHP needs a class it has not seen, and PHP will try every registered autoloader in turn before giving up with an `Error`. PSR-4 standardises what that callback should do: map a namespace prefix to a base directory, replace the remaining separators with directory separators, append `.php`.\n\nThe standard is deliberately narrow, and its details matter. Underscores have no meaning in PSR-4 (they did in PSR-0, where `Acme_Log_Writer` became directories) — that is the main difference between the two and the reason PSR-0 is deprecated but still supported for old packages. Prefixes must end in a backslash so `Foo\\` and `FooBar\\` stay distinct. Case must match exactly, which is invisible on a case-insensitive macOS or Windows filesystem and a production outage on Linux. And an autoloader MUST NOT throw or raise errors: it either loads the file or returns quietly so the next autoloader gets a turn.\n\nComposer merges every package's `autoload` block into generated maps under `vendor/composer/` — `autoload_psr4.php`, `autoload_classmap.php`, `autoload_files.php` — and `vendor/autoload.php` registers the loader that reads them. The three strategies trade differently: `psr-4` resolves by convention and costs a filesystem check per new class, `classmap` is a lookup table built at dump time (fast, but blind to classes added since), and `files` is eagerly `require`d on every single request, which is how packages ship global helper functions and also how a careless `files` entry taxes every page load.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "PHP-FIG: PSR-4 Autoloader", url: "https://www.php-fig.org/psr/psr-4/", kind: "spec" },
        { label: "Composer: composer.json schema — autoload", url: "https://getcomposer.org/doc/04-schema.md", kind: "docs" },
        { label: "PHP Manual: spl_autoload_register", url: "https://www.php.net/manual/en/function.spl-autoload-register.php", kind: "docs" },
        { label: "PHP-FIG: PSR-4 example implementations", url: "https://www.php-fig.org/psr/psr-4/examples/", kind: "spec" },
      ],
      video: {
        title: "Autoloading Classes in PHP: PSR-4 and Composer",
        channel: "Dave Hollingworth",
        url: "https://www.youtube.com/watch?v=93pCiZT99Ks",
        videoId: "93pCiZT99Ks",
        startSeconds: 175,
        chapterLabel: "spl_autoload_register",
        durationLabel: "17:49",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-psr-autoloading-q1",
          prompt:
            "Given this mapping, where does `App\\Models\\User` have to live?\n\n```json\n{ \"autoload\": { \"psr-4\": { \"App\\\\\": \"src/\" } } }\n```",
          options: ["`src/Models/User.php`", "`src/App/Models/User.php`", "`app/Models/User.php`", "`src/Models/user.php`"],
          correctIndex: 0,
          explanation:
            "The matched prefix is stripped, not repeated in the path — that is exactly what PSR-4 changed from PSR-0. The remaining sub-namespaces become directories and the class name becomes the file name, case for case.",
        },
        {
          id: "php-psr-autoloading-q2",
          prompt:
            "Prefix `Acme\\Log\\Writer` maps to `./acme-log-writer/lib/`. Where does PSR-4 expect `\\Acme\\Log\\Writer\\File_Writer` to be?",
          options: [
            "`./acme-log-writer/lib/File_Writer.php`",
            "`./acme-log-writer/lib/File/Writer.php`",
            "`./acme-log-writer/lib/Acme/Log/Writer/File_Writer.php`",
            "`./acme-log-writer/lib/file_writer.php`",
          ],
          correctIndex: 0,
          explanation:
            "Underscores have no special meaning anywhere in a PSR-4 class name, so the terminating class name maps straight to the file name. Under PSR-0 the same name would have become `File/Writer.php`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-autoloading-q3",
          prompt: "A legacy package still uses `\"psr-0\"` in its `autoload` block. What is the practical difference from `psr-4`?",
          options: [
            "PSR-0 keeps the full namespace in the path and turns underscores in the class name into directory separators",
            "PSR-0 only works for classes, while PSR-4 also covers interfaces and traits",
            "PSR-0 requires a classmap to be dumped first, PSR-4 does not",
            "PSR-0 resolves case-insensitively, PSR-4 is case-sensitive",
          ],
          correctIndex: 0,
          explanation:
            "Those two rules are the whole difference, and both existed to support pre-namespace `Zend_`-style names. PSR-0 is deprecated by the FIG but Composer still honours it so old packages keep working; both cover any class-like structure and both are case-sensitive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-autoloading-q4",
          prompt:
            "A class loads fine on a developer's macOS machine and throws `Class \"App\\Services\\PDFExporter\" not found` on the Linux server. The file is `src/Services/PdfExporter.php`. What is going on?",
          options: [
            "PSR-4 requires the file name to match the class name exactly, and Linux has a case-sensitive filesystem",
            "The Linux box is missing a PHP extension the class depends on",
            "Composer's classmap was dumped on macOS and is not portable",
            "PHP class names are case-insensitive, so the autoloader never even ran",
          ],
          correctIndex: 0,
          explanation:
            "PHP class names are case-insensitive but file systems on Linux are not, so `PDFExporter` never finds `PdfExporter.php`. The default macOS and Windows filesystems hide the bug until deploy — run `composer dump-autoload --optimize --strict-psr` in CI to catch it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-autoloading-q5",
          prompt: "Which statements about Composer's `autoload` strategies are true? (Select all that apply.)",
          options: [
            "`files` entries are `require`d on every request, whether or not anything uses them",
            "`classmap` scans the given paths at dump time and records an exact class-to-file map",
            "`psr-0` is deprecated by the FIG but still supported by Composer for legacy packages",
            "A `psr-4` prefix can only map to a single directory",
            "`classmap` entries are resolved lazily, so new files are picked up without re-dumping",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`files` is the eager escape hatch for global functions, which cannot be autoloaded at all. A `psr-4` prefix may map to an array of directories, searched in order. A classmap is a snapshot: add a class and it is invisible until you dump again.",
        },
        {
          id: "php-psr-autoloading-q6",
          prompt: "What must a PSR-4 autoloader do when it cannot find a file for the requested class?",
          options: [
            "Return quietly without throwing or raising an error, so the next registered autoloader can try",
            "Throw a `ClassNotFoundException` so the caller can handle it",
            "Trigger an `E_WARNING` naming the missing file",
            "Return `false` so PHP knows to stop searching",
          ],
          correctIndex: 0,
          explanation:
            "The spec says autoloaders MUST NOT throw exceptions or raise errors and SHOULD NOT return a value. PHP only raises `Error: Class ... not found` after every registered autoloader has had a turn — which is also what makes `class_exists()` safe to call.",
        },
        {
          id: "php-psr-autoloading-q7",
          prompt:
            "You add `src/Support/Money.php` to a project whose `autoload` block maps `\"App\\\\\": \"src/\"`. You do not run any Composer command. Does `new App\\Support\\Money()` work?",
          options: [
            "Yes — PSR-4 resolves by convention, so it finds the new file on the next request",
            "No — every new class needs `composer dump-autoload` before it can be found",
            "Only after restarting PHP-FPM so opcache picks up the file",
            "Only if you also add the class to `autoload.classmap`",
          ],
          correctIndex: 0,
          explanation:
            "PSR-4 is resolved at runtime with a filesystem check, so new classes just work in development. You only need to re-dump when the mapping itself changes, or when you are using `classmap` or an optimised autoloader.",
        },
        {
          id: "php-psr-autoloading-q8",
          prompt: "Why must a PSR-4 namespace prefix in `composer.json` end in a backslash, as in `\"Foo\\\\\"`?",
          options: [
            "So that `Foo\\` and `FooBar\\` are treated as distinct prefixes rather than one matching the other",
            "Because JSON requires the escaped backslash for any namespace string",
            "So Composer knows to generate a PSR-4 rule rather than a classmap rule",
            "To mark the prefix as a directory rather than a file",
          ],
          correctIndex: 0,
          explanation:
            "Prefix matching is a string prefix match, so a bare `Foo` would also match every class in `FooBar`. The trailing separator is what keeps neighbouring vendor namespaces apart.",
        },
        {
          id: "php-psr-autoloading-q9",
          prompt: "What does `require 'vendor/autoload.php';` actually do?",
          options: [
            "Registers Composer's `ClassLoader` with `spl_autoload_register` and eagerly includes every `autoload.files` entry",
            "Loads every class in `vendor/` into memory so later lookups are instant",
            "Builds the class map by scanning `vendor/` on each request",
            "Registers one autoloader per installed package, in dependency order",
          ],
          correctIndex: 0,
          explanation:
            "It bootstraps a single `ClassLoader` populated from the generated maps under `vendor/composer/`, then requires the `files` entries immediately because functions cannot be autoloaded. Nothing else is loaded until a class is referenced.",
        },
        {
          id: "php-psr-autoloading-q10",
          prompt:
            "A package's `composer.json` maps `\"\": \"src/\"` — an empty PSR-4 prefix. What does that do, and why is it usually a bad idea in an application?",
          options: [
            "It makes `src/` a fallback directory searched for any namespace, which adds a filesystem check to every unresolved class",
            "It disables PSR-4 for that package and falls back to a classmap",
            "It is invalid: Composer rejects an empty prefix",
            "It maps only the global namespace, so namespaced classes are unaffected",
          ],
          correctIndex: 0,
          explanation:
            "An empty prefix matches everything, so it becomes a catch-all searched after the specific prefixes fail. It works, but it turns every genuine miss — including the `class_exists()` probes libraries do — into extra stat calls.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "php-psr-composer-json",
      moduleId: "php-composer-psr",
      trackId: "php",
      title: "`composer.json`, `composer.lock` and Reproducible Installs",
      summary:
        "`composer.json` is a statement of intent: the constraints you are willing to accept. `composer.lock` is the answer the solver arrived at — every package in the resolved graph pinned to an exact version and source reference, including transitive dependencies you never named. The split is what makes an install reproducible: intent can be loose while the deployed artefact is exact.\n\nThat gives the two commands very different jobs. `composer install` reads the lock and installs precisely those versions, ignoring anything newer; if there is no lock it resolves and writes one. `composer update` ignores the lock, re-solves the whole graph against `composer.json`, and rewrites it. This is the single most expensive mistake in a PHP team: a developer who wants one new package runs `composer update`, bumps forty unrelated dependencies, and ships a diff nobody reviewed. `composer require vendor/pkg` and `composer update vendor/pkg` are the scoped alternatives.\n\nApplications commit the lock; that is the entire point. Libraries may commit one for their own CI, but it is never used by consumers — Composer only reads the lock of the root package, so a dependency's lock is inert. The lock also stores a `content-hash` of the dependency-relevant parts of `composer.json`, which is where the familiar \"lock file is not up to date\" warning comes from: someone hand-edited a constraint without re-solving. `composer update --lock` refreshes the hash without changing versions. And when two branches both add a package, the lock conflicts — the fix is to take either side, restore `composer.json` with both requirements, and re-run Composer, never to hand-merge JSON that encodes a solver result.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Composer: Basic usage", url: "https://getcomposer.org/doc/01-basic-usage.md", kind: "docs" },
        { label: "Composer: The composer.json schema", url: "https://getcomposer.org/doc/04-schema.md", kind: "docs" },
        { label: "Composer: CLI — install, update, require", url: "https://getcomposer.org/doc/03-cli.md", kind: "docs" },
      ],
      video: {
        title: "Use Composer to Easily Manage PHP Packages",
        channel: "Dave Hollingworth",
        url: "https://www.youtube.com/watch?v=1eH43qVMCOU",
        videoId: "1eH43qVMCOU",
        startSeconds: 426,
        chapterLabel: "composer.json",
        durationLabel: "15:39",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-psr-composer-json-q1",
          prompt:
            "A teammate wants the one package you just added. They pull your branch and run `composer update`. What happens?",
          options: [
            "Every dependency is re-resolved to the newest versions the constraints allow, and the lock is rewritten",
            "Only the package that is in `composer.json` but missing from the lock is installed",
            "Nothing changes, because the lock already pins the versions",
            "Composer refuses and tells them to run `composer install` instead",
          ],
          correctIndex: 0,
          explanation:
            "`update` ignores the lock entirely and re-solves the graph, so it can move dozens of unrelated packages. `composer install` is what reproduces your versions; `composer update vendor/pkg` is what scopes an update to one package.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-composer-json-q2",
          prompt:
            "`composer.json` requires `^9.0` of a package. The lock pins `9.2.1` and `9.5.0` has since been released. What does `composer install` install?",
          options: ["`9.2.1`", "`9.5.0`", "`9.2.1` and warns that a newer version exists", "The highest 9.x present in the local cache"],
          correctIndex: 0,
          explanation:
            "With a lock present, `install` installs exactly what the lock says and never consults the constraint. That determinism is why CI and production run `install`, not `update`.",
        },
        {
          id: "php-psr-composer-json-q3",
          prompt: "You maintain a library that other projects depend on. Should you commit `composer.lock`?",
          options: [
            "It is optional and only affects your own CI — consumers never read a dependency's lock file",
            "Yes, because consumers resolve against your lock to get the versions you tested",
            "No, committing it makes your library uninstallable alongside other packages",
            "Yes, it is required for Packagist to index the package",
          ],
          correctIndex: 0,
          explanation:
            "Composer only ever reads the root package's lock. Committing one in a library pins what your test suite runs against, which is useful, but it has no effect on anybody installing you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-composer-json-q4",
          prompt:
            "Composer prints: *\"The lock file is not up to date with the latest changes in composer.json. You may be getting outdated dependencies.\"* What caused it?",
          options: [
            "`composer.json`'s dependency-relevant content changed without re-solving, so its hash no longer matches the lock's `content-hash`",
            "A package in the lock has a newer release on Packagist",
            "The lock was generated by a different Composer major version",
            "`vendor/` is out of sync with the lock file",
          ],
          correctIndex: 0,
          explanation:
            "The lock stores a hash of the parts of `composer.json` that affect resolution. Editing a constraint by hand breaks it. `composer update --lock` recomputes the hash without changing any versions.",
        },
        {
          id: "php-psr-composer-json-q5",
          prompt: "Which of these does `composer.lock` record? (Select all that apply.)",
          options: [
            "The exact resolved version of every package, including transitive ones you never required",
            "The dist URL and source reference (commit hash) each package was resolved to",
            "A `content-hash` of the dependency-relevant parts of `composer.json`",
            "The contents of the `vendor/` directory, so it can be restored offline",
            "The exact PHP binary path used when the lock was written",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The lock is the solver's full answer plus enough provenance to fetch the same bytes again, and a hash so Composer can tell when the question changed. It stores no files and nothing about your local PHP installation beyond declared platform overrides.",
        },
        {
          id: "php-psr-composer-json-q6",
          prompt: "What does `composer require monolog/monolog` do, in order?",
          options: [
            "Adds the requirement to `composer.json`, resolves it with the rest of the graph, updates the lock, then installs",
            "Downloads the package into `vendor/` and leaves `composer.json` untouched",
            "Adds the requirement to `composer.json` and waits for you to run `composer update`",
            "Rewrites the whole lock file from scratch by re-resolving every dependency",
          ],
          correctIndex: 0,
          explanation:
            "`require` is a scoped update: it picks a sensible constraint, solves for the new package (keeping the others locked unless `-w`/`-W` is passed), and writes both files. It is not a full `update`.",
        },
        {
          id: "php-psr-composer-json-q7",
          prompt:
            "Two feature branches each added a different package. Merging produces a conflict in `composer.lock`. What is the correct resolution?",
          options: [
            "Resolve `composer.json` by hand, take either side of the lock, then re-run Composer so it re-solves and rewrites it",
            "Hand-merge the conflicting blocks in the lock so both packages appear",
            "Delete `composer.lock` and run `composer update` to rebuild it",
            "Keep the lock from the branch that was merged last and run `composer install`",
          ],
          correctIndex: 0,
          explanation:
            "The lock is generated output from a solver, so merging it textually can produce a graph that was never actually solved. Deleting it and running a full `update` works but silently bumps everything else too.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-composer-json-q8",
          prompt:
            "You need a security patch in one package only, without touching anything else. Which command comes closest?",
          options: [
            "`composer update vendor/package`",
            "`composer update --prefer-lowest`",
            "`composer install vendor/package`",
            "`composer require vendor/package:*`",
          ],
          correctIndex: 0,
          explanation:
            "A partial update re-solves just that package (add `-w` if its own dependencies must move too) and leaves the rest of the lock alone. `install` never takes a package argument, and requiring `*` throws away the constraint.",
        },
        {
          id: "php-psr-composer-json-q9",
          prompt: "Why is `vendor/` normally in `.gitignore` for an application?",
          options: [
            "The lock plus `composer install` reproduces it exactly, so committing thousands of third-party files adds noise and merge pain for no gain",
            "Composer refuses to run if `vendor/` is tracked by git",
            "Because `vendor/` contains machine-specific absolute paths that break on another machine",
            "Because Packagist requires that published packages omit it",
          ],
          correctIndex: 0,
          explanation:
            "Reproducibility comes from the lock, not from checked-in vendor code. Teams that cannot run Composer on the deploy target sometimes do commit it, but then they own every dependency's diff.",
        },
        {
          id: "php-psr-composer-json-q10",
          prompt: "A fresh clone has `composer.json` but no `composer.lock`. What does `composer install` do?",
          options: [
            "Resolves the constraints, installs the result, and writes a new lock file",
            "Fails with an error telling you to run `composer update` first",
            "Installs only the packages that are already in `vendor/`",
            "Installs the lowest version allowed by each constraint",
          ],
          correctIndex: 0,
          explanation:
            "Without a lock there is nothing to reproduce, so `install` behaves like `update` and records the outcome. That also means a missing lock quietly removes your version guarantees.",
        },
      ],
    },
    {
      id: "php-psr-versioning",
      moduleId: "php-composer-psr",
      trackId: "php",
      title: "Semantic Versioning and Version Constraints",
      summary:
        "Semantic versioning is a promise, not a fact: `MAJOR.MINOR.PATCH`, where a major bump means the maintainer believes they broke something. Composer's constraint operators exist to let you encode how much of that promise you are willing to trust. `^1.2.3` means `>=1.2.3 <2.0.0` — take anything that claims to be backwards compatible. `~1.2.3` means `>=1.2.3 <1.3.0` and `~1.2` means `>=1.2 <2.0.0`: the last digit you wrote is the one allowed to move.\n\nThe edges are where teams get surprised. Caret treats pre-1.0 releases as having no compatibility promise at all, so `^0.3` resolves to `>=0.3.0 <0.4.0` and `^0.0.3` to `>=0.0.3 <0.0.4` — a `0.x` dependency will never auto-upgrade its minor. Hyphen ranges complete a partial right-hand bound with a wildcard, so `1.0 - 2.0` actually means `>=1.0.0 <2.1`, not `<=2.0.0`. And no range picks up a pre-release unless the stability is explicit: `~1.2` will not install `2.0-beta.1` even though it sorts before `2.0`, because `minimum-stability` defaults to `stable`.\n\nThe practical rule is that libraries should be permissive and applications should be specific, because an over-tight constraint deep in the tree blocks everyone above it. When the solver refuses, it is almost never Composer being wrong: `composer why vendor/pkg` shows who required it and `composer why-not vendor/pkg 3.0` shows exactly which constraint blocks the version you want. Unbounded constraints like `>=2.0` are the opposite failure — they will happily install the next major and break you at runtime rather than at install time.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Composer: Versions and constraints", url: "https://getcomposer.org/doc/articles/versions.md", kind: "docs" },
        { label: "Semantic Versioning 2.0.0", url: "https://semver.org/", kind: "spec" },
        { label: "madewithlove: Composer constraint checker", url: "https://semver.madewithlove.com/", kind: "article" },
        { label: "Composer FAQ: why unbound version constraints are a bad idea", url: "https://getcomposer.org/doc/faqs/why-are-unbound-version-constraints-a-bad-idea.md", kind: "docs" },
      ],
      video: {
        title: "Composer Package Versions: Caret, Tilde, or Asterisk?",
        channel: "Laravel Daily",
        url: "https://www.youtube.com/watch?v=kebz0Y2apZ0",
        videoId: "kebz0Y2apZ0",
        durationLabel: "5:29",
      },
      alternateVideos: [
        {
          title: "PHP Composer and Packagist Tutorial",
          channel: "Gary Clarke",
          url: "https://www.youtube.com/watch?v=jLEUZrbAUF4",
          videoId: "jLEUZrbAUF4",
          startSeconds: 1334,
          chapterLabel: "Semantic versioning",
          durationLabel: "35:12",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-psr-versioning-q1",
          prompt: "What range does `^1.2.3` allow?",
          options: ["`>=1.2.3 <2.0.0`", "`>=1.2.3 <1.3.0`", "`=1.2.3` exactly", "`>=1.2.3` with no upper bound"],
          correctIndex: 0,
          explanation:
            "Caret allows anything up to but excluding the next major, which is the whole semver bargain. `>=1.2.3 <1.3.0` is what `~1.2.3` means.",
        },
        {
          id: "php-psr-versioning-q2",
          prompt: "Which pair correctly describes `~1.2` and `~1.2.3`?",
          options: [
            "`~1.2` is `>=1.2 <2.0.0`; `~1.2.3` is `>=1.2.3 <1.3.0`",
            "`~1.2` is `>=1.2 <1.3.0`; `~1.2.3` is `>=1.2.3 <2.0.0`",
            "Both are equivalent to the matching caret constraint",
            "`~1.2` is `>=1.2 <2.0.0`; `~1.2.3` is `>=1.2.3 <2.0.0`",
          ],
          correctIndex: 0,
          explanation:
            "Tilde lets the last digit you actually wrote increase. Write two digits and the minor can move; write three and only the patch can.",
        },
        {
          id: "php-psr-versioning-q3",
          prompt: "A package is at `0.3.4`. What does `^0.3` resolve to?",
          options: ["`>=0.3.0 <0.4.0`", "`>=0.3.0 <1.0.0`", "`>=0.3.0` with no upper bound", "`=0.3.0` exactly"],
          correctIndex: 0,
          explanation:
            "Caret assumes pre-1.0 packages make no compatibility promise, so it pins the minor. It is why a `0.x` dependency needs a manual constraint bump for every minor release — and `^0.0.3` is stricter still, allowing only `<0.0.4`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-versioning-q4",
          prompt:
            "Your constraint is `~1.2`. The maintainer tags `2.0-beta.1`, which sorts before `2.0`. Does Composer install it?",
          options: [
            "No — `~1.2` fixes the major at 1, and `minimum-stability` defaults to `stable` anyway",
            "Yes — it is strictly less than `2.0`, so it satisfies the upper bound",
            "Yes, but only with `--prefer-stable`",
            "Only if the package has no stable 1.x release",
          ],
          correctIndex: 0,
          explanation:
            "Two separate guards stop it: the tilde only lets the `.2` move, and pre-release stabilities are excluded unless you raise `minimum-stability` or add a stability flag such as `~1.2@beta`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-versioning-q5",
          prompt: "What does the hyphen range `1.0 - 2.0` actually mean in Composer?",
          options: [
            "`>=1.0.0 <2.1` — the partial right-hand bound is completed with a wildcard",
            "`>=1.0.0 <=2.0.0` — inclusive of exactly 2.0.0",
            "`>=1.0.0 <2.0.0` — exclusive of the 2.0 line",
            "It is invalid syntax; ranges need explicit comparison operators",
          ],
          correctIndex: 0,
          explanation:
            "A partial version on the right becomes `2.0.*`, so `2.0.7` is included. Writing `1.0.0 - 2.0.0` gives the inclusive `<=2.0.0` most people actually meant.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-versioning-q6",
          prompt: "Which of these constraints allow version `1.3.0` to be installed? (Select all that apply.)",
          options: ["`^1.2`", "`~1.2`", "`>=1.0 <2.0`", "`~1.2.3`", "`1.2.*`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`^1.2` and `~1.2` both allow the minor to move up to 2.0, and the explicit range obviously does. `~1.2.3` caps at `<1.3.0` and `1.2.*` means `>=1.2 <1.3`, so both stop just short.",
        },
        {
          id: "php-psr-versioning-q7",
          prompt: "What is the risk of requiring `\"vendor/pkg\": \">=2.0\"`?",
          options: [
            "It has no upper bound, so the next major release installs silently and breaks you at runtime",
            "Composer rejects unbounded constraints and the install fails",
            "It forces the lowest matching version, so you never get fixes",
            "It only matches 2.x, so major upgrades need a manual bump anyway",
          ],
          correctIndex: 0,
          explanation:
            "An unbounded constraint says \"anything forever\", including the major that deletes the API you use. Caret gives the same floor with a sane ceiling.",
        },
        {
          id: "php-psr-versioning-q8",
          prompt:
            "You need an unreleased fix from the `main` branch of a dependency. What constraint form asks Composer for a branch rather than a tag?",
          options: [
            "`dev-main`",
            "`main`",
            "`^main`",
            "`main-dev`",
          ],
          correctIndex: 0,
          explanation:
            "Branches use the `dev-` prefix (version-like branch names such as `v1` use the `v1.x-dev` suffix form instead). Branch constraints have `dev` stability, so you also need `minimum-stability` or an inline `@dev` flag, and you are pinning to a moving target.",
        },
        {
          id: "php-psr-versioning-q9",
          prompt: "Composer refuses to install `vendor/pkg 3.0` and you cannot tell why. Which command answers that directly?",
          options: [
            "`composer why-not vendor/pkg 3.0`",
            "`composer why vendor/pkg`",
            "`composer show --tree`",
            "`composer validate --strict`",
          ],
          correctIndex: 0,
          explanation:
            "`why-not` (alias `prohibits`) names the packages and constraints blocking a given version. `why` (`depends`) answers the opposite question — who pulled this package in.",
        },
        {
          id: "php-psr-versioning-q10",
          prompt:
            "Under semver, a library adds a new optional parameter to a public method with a default value, and fixes a bug. What should the next release be, given the current version is `2.4.1`?",
          options: [
            "`2.5.0` — new backwards-compatible functionality is a minor bump",
            "`2.4.2` — nothing was removed, so it is a patch",
            "`3.0.0` — any signature change is breaking",
            "`2.4.1+1` — build metadata is enough for additive changes",
          ],
          correctIndex: 0,
          explanation:
            "Adding functionality without breaking existing callers is exactly what a minor bump signals; the bug fix rides along. In PHP the caveat is that a new parameter *is* breaking for anyone who subclassed and overrode the method — a real-world reason maintainers sometimes go major anyway.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-versioning-q11",
          prompt: "What is `minimum-stability` set to by default, and what does a constraint like `^2.0@beta` do?",
          options: [
            "Default `stable`; the flag relaxes stability for that one package to `beta` and above",
            "Default `dev`; the flag pins the package to the latest beta tag",
            "Default `stable`; the flag makes the whole project accept beta releases",
            "There is no default; the field is required in every `composer.json`",
          ],
          correctIndex: 0,
          explanation:
            "Composer only considers stable releases unless told otherwise. A stability flag is per-constraint, which is far safer than lowering `minimum-stability` project-wide (pair that with `\"prefer-stable\": true` if you must).",
        },
      ],
    },
    {
      id: "php-psr-dev-dependencies",
      moduleId: "php-composer-psr",
      trackId: "php",
      title: "Dev Dependencies, Scripts and Project Automation",
      summary:
        "`require-dev` holds the things you need to build and test the project but not to run it: PHPUnit or Pest, PHPStan, PHP-CS-Fixer, a faker. The distinction is load-bearing at deploy time — `composer install --no-dev` skips them, and it also skips the `autoload-dev` rules, so your `Tests\\` namespace simply stops resolving in production. That is the correct behaviour and it is also the reason a test helper accidentally used by a seeder blows up only on the server.\n\nThe asymmetry worth knowing is that `require-dev` is only honoured for the root package. If a library you depend on lists PHPUnit in its own `require-dev`, you never get it: Composer resolves a dependency's `require` and ignores everything else. That is why installing a small package does not drag in a test framework, and why a library that puts a runtime need in `require-dev` is broken for its users even though its own CI passes.\n\nScripts turn `composer.json` into the project's task runner. Named events (`post-install-cmd`, `post-update-cmd`, `post-autoload-dump`) fire during Composer's own lifecycle; arbitrary names become commands, so `composer test` can mean `phpunit --colors` and every newcomer gets the same invocation. The same root-only rule applies — a dependency's scripts never run — and `--no-scripts` and `--no-plugins` exist because scripts and plugins are arbitrary code execution. Composer 2.2 made that explicit with `config.allow-plugins`, which defaults to allowing nothing and prompts on first sight of a new plugin; in CI, where nobody can answer a prompt, an unlisted plugin is a build failure rather than a silent trust decision.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Composer: composer.json schema — require-dev and autoload-dev", url: "https://getcomposer.org/doc/04-schema.md", kind: "docs" },
        { label: "Composer: Scripts", url: "https://getcomposer.org/doc/articles/scripts.md", kind: "docs" },
        { label: "Composer: Config", url: "https://getcomposer.org/doc/06-config.md", kind: "docs" },
      ],
      video: {
        title: "Use Composer to Easily Manage PHP Packages",
        channel: "Dave Hollingworth",
        url: "https://www.youtube.com/watch?v=1eH43qVMCOU",
        videoId: "1eH43qVMCOU",
        startSeconds: 842,
        chapterLabel: "Development packages",
        durationLabel: "15:39",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-psr-dev-dependencies-q1",
          prompt:
            "A library you require lists `phpunit/phpunit` in its `require-dev`. After `composer install` in your application, is PHPUnit installed?",
          options: [
            "No — only the root package's `require-dev` is installed",
            "Yes — dev requirements are transitive like normal requirements",
            "Yes, but only into `vendor/bin`",
            "Only if you pass `--dev` explicitly",
          ],
          correctIndex: 0,
          explanation:
            "Composer reads a dependency's `require` and nothing else. If it read `require-dev` transitively, installing one small package would pull in half of Packagist.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-dev-dependencies-q2",
          prompt:
            "Production deploys run `composer install --no-dev`. A database seeder references a class under the `Tests\\Support\\` namespace mapped in `autoload-dev`. What happens on the server?",
          options: [
            "A class-not-found error, because `--no-dev` also drops the `autoload-dev` rules from the generated autoloader",
            "It works, because `autoload-dev` is merged into the normal autoloader regardless",
            "It works, because the class is still on disk even if the package was skipped",
            "Composer refuses to install and reports the dangling reference",
          ],
          correctIndex: 0,
          explanation:
            "`--no-dev` removes both the dev packages and the dev autoload rules, so the namespace is unmapped even though the files may still exist in your own repository. Anything production needs belongs in `autoload`, not `autoload-dev`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-dev-dependencies-q3",
          prompt: "Which of these belongs in `require` rather than `require-dev`?",
          options: [
            "`monolog/monolog`, used by the application's logging service at runtime",
            "`phpstan/phpstan`, run in CI",
            "`fakerphp/faker`, used by test factories",
            "`friendsofphp/php-cs-fixer`, run by a pre-commit hook",
          ],
          correctIndex: 0,
          explanation:
            "The test is simple: would production break without it? A logger would; a static analyser would not. Note that Laravel ships Faker in `require-dev`, so factories used by production seeders are a classic trap.",
        },
        {
          id: "php-psr-dev-dependencies-q4",
          prompt: "Which statements about Composer scripts are true? (Select all that apply.)",
          options: [
            "Only scripts defined in the root package's `composer.json` are executed",
            "A script entry can be a shell command or a `Vendor\\Class::method` static callable",
            "`--no-scripts` skips them for a single command",
            "Scripts defined by your dependencies run during `install` so packages can self-configure",
            "Scripts run inside a sandbox with no filesystem access",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Composer explicitly does not execute a dependency's scripts — that is what plugins are for, and why they need `allow-plugins`. A script is an ordinary process with your full privileges; there is no sandbox.",
        },
        {
          id: "php-psr-dev-dependencies-q5",
          prompt:
            "What does this enable?\n\n```json\n{ \"scripts\": { \"test\": \"phpunit --colors=always\" } }\n```",
          options: [
            "Running `composer test`, with `vendor/bin` added to `PATH` for the duration",
            "Running `composer run test` only — custom names are not exposed as top-level commands",
            "Running the command automatically after every `composer install`",
            "Nothing until the name is also listed under `scripts-descriptions`",
          ],
          correctIndex: 0,
          explanation:
            "Any name that is not a reserved event becomes a command, and Composer prepends `vendor/bin` to `PATH` so the binary resolves without a path. `composer run-script test` is the explicit form, useful when a name collides with a built-in command.",
        },
        {
          id: "php-psr-dev-dependencies-q6",
          prompt: "Which Composer event is the right place to rebuild a generated file that must exist before any class is used?",
          options: [
            "`post-autoload-dump`, which fires after the autoloader is written during install, update or `dump-autoload`",
            "`pre-install-cmd`, which runs before anything is downloaded",
            "`post-package-install`, which runs once per installed package",
            "`pre-autoload-dump`, which runs before dependencies are resolved",
          ],
          correctIndex: 0,
          explanation:
            "`post-autoload-dump` is the first point at which `vendor/autoload.php` is valid, which is why framework cache-building hooks live there. `pre-install-cmd` runs before `vendor/` exists at all, so your own classes are not loadable yet.",
        },
        {
          id: "php-psr-dev-dependencies-q7",
          prompt: "What does `config.allow-plugins` do, and what is its default?",
          options: [
            "It allow-lists which packages may execute code as Composer plugins; by default none are allowed and new ones prompt",
            "It lists plugins to install automatically; by default it is empty so no plugins are installed",
            "It disables plugin auto-updates; by default plugins update with every `composer update`",
            "It restricts plugins to `require-dev`; by default any package may be a plugin",
          ],
          correctIndex: 0,
          explanation:
            "Since Composer 2.2 a plugin is a deliberate trust decision because it runs arbitrary code during install. In a non-interactive CI run an unlisted plugin fails the build instead of quietly executing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-dev-dependencies-q8",
          prompt: "What does a package's `bin` key do?",
          options: [
            "Declares executables that Composer symlinks or proxies into `vendor/bin` when the package is installed",
            "Sets the PHP binary Composer uses for scripts",
            "Marks the package as an application rather than a library",
            "Points at the directory where compiled assets should be written",
          ],
          correctIndex: 0,
          explanation:
            "That is how `vendor/bin/phpunit` appears. It is also why `vendor/bin` should be in `.gitignore` along with the rest of `vendor/` — the entries are generated at install time.",
        },
        {
          id: "php-psr-dev-dependencies-q9",
          prompt: "Why might a team set `\"sort-packages\": true` under `config`?",
          options: [
            "It keeps `require` and `require-dev` alphabetically ordered as packages are added, which makes diffs and merges cleaner",
            "It makes Composer install packages in alphabetical order for reproducibility",
            "It sorts the lock file, reducing its size",
            "It orders autoload rules so the most specific prefix wins",
          ],
          correctIndex: 0,
          explanation:
            "It is purely cosmetic and purely worth it: without it, `composer require` appends, so two branches adding packages conflict on the same line every time.",
        },
        {
          id: "php-psr-dev-dependencies-q10",
          prompt: "When would you deliberately run `composer install --no-scripts --no-plugins`?",
          options: [
            "When installing untrusted or third-party code, or when debugging whether a script rather than the install itself is failing",
            "On every production deploy, because scripts are not needed there",
            "Whenever the lock file is out of date, to avoid rewriting it",
            "To install dev dependencies without running the test suite",
          ],
          correctIndex: 0,
          explanation:
            "Both flags exist because scripts and plugins are arbitrary code execution on your machine. Skipping them in production by default is usually wrong, though — framework hooks that build caches live in exactly those events.",
        },
      ],
    },
    {
      id: "php-psr-optimised-autoload",
      moduleId: "php-composer-psr",
      trackId: "php",
      title: "Optimised Autoloading and Production Installs",
      summary:
        "PSR-4 resolution is convenient precisely because it is lazy: the loader turns a class name into a candidate path and asks the filesystem. That stat call per class is invisible in development and measurable under load, because a request touching 300 classes does 300 filesystem lookups that will give the same answer every time until the next deploy.\n\nComposer offers three levels. Level 1, `--optimize-autoloader` / `-o`, converts the PSR-4 and PSR-0 rules into an explicit classmap at dump time — an array lookup instead of a filesystem check, and one that opcache keeps in memory. It has essentially no downside in production and should always be on. Level 2/A, `--classmap-authoritative` / `-a` (which implies `-o`), goes further: if a class is not in the map it does not exist, so misses are free too. That is a real behaviour change — anything generating classes at runtime, and any library probing with `class_exists()` for optional integrations, can start failing. Level 2/B, `--apcu-autoloader`, caches hits *and* misses in APCu instead, which is safe but needs the extension. 2/A and 2/B are mutually exclusive, and none of them belong in a development environment, where they just hide newly added classes.\n\nThe deploy command itself is the other half: `composer install --no-dev --optimize-autoloader --no-interaction` installs exactly the locked graph, without dev packages or dev autoload rules, and never re-solves. Composer 2 also writes `vendor/composer/platform_check.php`, which fails loudly at bootstrap if the runtime PHP is older than what was resolved against — worth knowing because `config.platform` lets you *pretend* to be a different PHP version when resolving, which is how a CI box running 8.5 can produce a lock valid for an 8.3 server, and also how you deploy something your server cannot actually run if you never call `composer check-platform-reqs`.",
      level: "advanced",
      estMinutes: 45,
      isMilestone: true,
      webRefs: [
        { label: "Composer: Autoloader optimization", url: "https://getcomposer.org/doc/articles/autoloader-optimization.md", kind: "docs" },
        { label: "Composer: CLI — install options and dump-autoload", url: "https://getcomposer.org/doc/03-cli.md", kind: "docs" },
        { label: "Composer: Platform dependencies", url: "https://getcomposer.org/doc/articles/composer-platform-dependencies.md", kind: "docs" },
      ],
      video: {
        title: "Autoloading Classes in PHP: PSR-4 and Composer",
        channel: "Dave Hollingworth",
        url: "https://www.youtube.com/watch?v=93pCiZT99Ks",
        videoId: "93pCiZT99Ks",
        startSeconds: 859,
        chapterLabel: "dump-autoload",
        durationLabel: "17:49",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-psr-optimised-autoload-q1",
          prompt: "What does `composer dump-autoload --optimize` actually change?",
          options: [
            "It converts the PSR-4/PSR-0 rules into an explicit classmap, so a known class resolves by array lookup instead of a filesystem check",
            "It compiles all classes into a single PHP file that is included at bootstrap",
            "It removes unused classes from `vendor/` to shrink the deployed tree",
            "It caches resolved paths in APCu on the first request",
          ],
          correctIndex: 0,
          explanation:
            "Optimisation is a dump-time scan producing `autoload_classmap.php`; nothing is merged or deleted. The APCu cache is a different, separate option.",
        },
        {
          id: "php-psr-optimised-autoload-q2",
          prompt:
            "A deploy adds `--classmap-authoritative`. A package that generates a proxy class at runtime now fails with \"class not found\". Why?",
          options: [
            "Authoritative mode says anything missing from the classmap does not exist, so the loader never falls back to PSR-4 rules",
            "It disables `spl_autoload_register` entirely, so only pre-loaded classes work",
            "It strips the PSR-4 rules from `composer.json` during the dump",
            "It requires APCu, which is missing on the server",
          ],
          correctIndex: 0,
          explanation:
            "That is the whole trade: misses become instant, but there is no second chance for a class written after the dump. Anything with runtime code generation wants `--apcu-autoloader` instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-optimised-autoload-q3",
          prompt: "Which statements about Composer's autoloader optimisation levels are true? (Select all that apply.)",
          options: [
            "`--classmap-authoritative` implicitly enables `--optimize-autoloader`",
            "`--classmap-authoritative` and `--apcu-autoloader` address the same problem and cannot be combined",
            "None of the optimisations should be enabled in a development environment",
            "`--apcu-autoloader` generates the classmap for you, so level 1 is unnecessary",
            "Level 1 optimisation changes which classes can be loaded",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Both level-2 options exist to make *misses* cheap and are mutually exclusive. APCu does not build a classmap — you still want `-o` alongside it. Level 1 is purely a speed change with no behavioural difference, which is why it is safe to always enable in production.",
        },
        {
          id: "php-psr-optimised-autoload-q4",
          prompt: "Why does Composer advise against optimising the autoloader in development?",
          options: [
            "Newly added or moved classes are invisible until you re-dump, which costs more time than the lookup ever saves",
            "The optimised loader is slower for small projects",
            "The classmap contains absolute paths that break when you switch branches",
            "It conflicts with Xdebug",
          ],
          correctIndex: 0,
          explanation:
            "In production the class set is fixed between deploys, so the snapshot is always accurate. In development it goes stale the moment you create a file.",
        },
        {
          id: "php-psr-optimised-autoload-q5",
          prompt: "Which command line is the right one to run on a production server during deploy?",
          options: [
            "`composer install --no-dev --optimize-autoloader --no-interaction`",
            "`composer update --no-dev --optimize-autoloader`",
            "`composer install --no-dev --no-autoloader`",
            "`composer require --update-no-dev --optimize-autoloader`",
          ],
          correctIndex: 0,
          explanation:
            "`install` reproduces the reviewed lock; `update` re-solves on the server and ships versions nobody tested. `--no-autoloader` would leave you without `vendor/autoload.php` at all.",
        },
        {
          id: "php-psr-optimised-autoload-q6",
          prompt: "What is `vendor/composer/platform_check.php` for, and when is it generated?",
          options: [
            "Composer 2 writes it as part of the autoloader bootstrap; it aborts with a clear message if the running PHP is older than what the dependencies require",
            "It records the extensions present when the lock was written so CI can recreate them",
            "It runs `composer check-platform-reqs` automatically on every request",
            "It is only generated when `config.platform` is set",
          ],
          correctIndex: 0,
          explanation:
            "It turns an obscure downstream fatal into a readable \"your PHP version does not satisfy this requirement\" at bootstrap. `config.platform-check` defaults to `php-only`; set it to `true` to check extensions too, or `false` to skip the file.",
        },
        {
          id: "php-psr-optimised-autoload-q7",
          prompt:
            "A CI runner has PHP 8.5; the production server runs 8.3. How do you make the lock file reflect what production can actually install?",
          options: [
            "Set `config.platform.php` to the production version so the solver resolves against it, and run `composer check-platform-reqs` on the server",
            "Run `composer install --ignore-platform-reqs` on CI so the version difference is ignored",
            "Add `\"php\": \"8.3\"` to `require` and nothing else",
            "Run the install on production instead and copy the lock back",
          ],
          correctIndex: 0,
          explanation:
            "`config.platform` makes the solver pretend, which is exactly what you want when the build box differs from the target. It is a fiction, though — nothing verifies it at runtime, which is why the docs pair it with `check-platform-reqs` in the deploy script. (Declaring `\"php\": \"^8.3\"` in `require` is also right, but on its own it still lets the solver pick packages needing 8.5.)",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-optimised-autoload-q8",
          prompt:
            "A dependency requires `php: ^8`. You must install it on a box the package has not been tested against. Which is the narrowest override?",
          options: [
            "`--ignore-platform-req=php+`, which ignores only the upper bound of the PHP requirement",
            "`--ignore-platform-reqs`, which ignores every platform requirement",
            "`--ignore-platform-req=php`, which ignores the PHP requirement entirely",
            "Setting `config.platform.php` to the version the package wants",
          ],
          correctIndex: 0,
          explanation:
            "The trailing `+` relaxes only the ceiling, so installing on a newer PHP is allowed while an older one still fails. Ignoring the requirement outright removes both guards, and faking the platform lies to the solver rather than overriding one check.",
        },
        {
          id: "php-psr-optimised-autoload-q9",
          prompt: "Why does opcache matter to an optimised autoloader?",
          options: [
            "The generated classmap is a plain PHP array file, so opcache keeps it compiled in memory and the loader initialises almost instantly",
            "Opcache caches the results of filesystem stat calls, which is what makes PSR-4 fast",
            "Without opcache, `--classmap-authoritative` has no effect",
            "Opcache stores the autoloader's resolved class list in shared memory across requests",
          ],
          correctIndex: 0,
          explanation:
            "The classmap is just PHP source, so opcache removes the parse cost on every request. Opcache never caches filesystem probes, which is precisely why converting probes into an array is the win.",
        },
        {
          id: "php-psr-optimised-autoload-q10",
          prompt: "Which command reports known security advisories affecting the packages you have installed?",
          options: [
            "`composer audit`",
            "`composer diagnose`",
            "`composer validate --strict`",
            "`composer outdated --direct`",
          ],
          correctIndex: 0,
          explanation:
            "`composer audit` (added in Composer 2.4) checks the installed or locked packages against the Packagist advisory database and also flags abandoned packages. Current Composer 2.x goes further and blocks installing versions with active advisories by default — `composer outdated` only reports newer releases, not vulnerable ones.",
        },
        {
          id: "php-psr-optimised-autoload-q11",
          prompt:
            "CI runs `composer install --no-dev -o` and the build fails with a PSR-4 mapping error you have never seen locally. Which flag makes that check explicit and deterministic in CI?",
          options: [
            "`--strict-psr-autoloader`, which exits non-zero when the project's own PSR-4/PSR-0 mappings do not resolve",
            "`--dry-run`, which reports mapping problems without installing",
            "`--no-cache`, which forces a clean resolution",
            "`--prefer-dist`, which validates archives against the mapping",
          ],
          correctIndex: 0,
          explanation:
            "`--strict-psr-autoloader` (which needs `-o` to work) turns a warning about a class whose file does not match its name into a failed build — the reliable way to catch the case-sensitivity bug before the Linux server does.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "php-psr-packagist",
      moduleId: "php-composer-psr",
      trackId: "php",
      title: "Publishing a Package to Packagist",
      summary:
        "Packagist is not a file host. It is an index over VCS repositories: you give it a Git URL, it reads the `composer.json` at each tag and branch, and it publishes the resulting version list. Everything else follows from that. Versions come from tags, which is why `composer.json` should have no `version` field at all — hardcoding one means every release needs two edits and eventually they disagree. Pushing a tag plus a webhook is the entire release process.\n\nA publishable package needs a `vendor/name` in lowercase, a `description`, a `license` (SPDX identifier — omitting it makes the package legally unusable inside a company), an `autoload` block, and honest `require` constraints including a PHP version. The constraint discipline differs from an application's: a library should be as permissive as it can defend, because its constraints intersect with everyone else's. A library pinned to `~9.2.1` of a common dependency is unusable in half the projects that would otherwise adopt it.\n\nNot everything should be public. A `vcs` repository entry points Composer straight at a private Git URL and works with no index at all; a `path` repository symlinks a sibling directory, which is how you develop a package and its consumer together; and Private Packagist exists for teams that want the index without the exposure. Repository entries declared in the root `composer.json` take priority over Packagist for the same package name, which is both how you override a dependency with a fork and how a typo'd private package name can silently resolve to somebody else's public one — the dependency-confusion attack that `\"packagist.org\": false` or a canonical private repository is there to prevent.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Composer: Libraries — publishing a package", url: "https://getcomposer.org/doc/02-libraries.md", kind: "docs" },
        { label: "Composer: Repositories", url: "https://getcomposer.org/doc/05-repositories.md", kind: "docs" },
        { label: "Packagist: About", url: "https://packagist.org/about", kind: "docs" },
      ],
      video: {
        title: "PHP Composer and Packagist Tutorial",
        channel: "Gary Clarke",
        url: "https://www.youtube.com/watch?v=jLEUZrbAUF4",
        videoId: "jLEUZrbAUF4",
        startSeconds: 842,
        chapterLabel: "Registering on Packagist",
        durationLabel: "35:12",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-psr-packagist-q1",
          prompt: "How does Packagist decide what versions your package has?",
          options: [
            "From the Git tags and branches in the repository, with the `v` prefix stripped",
            "From the `version` field in `composer.json`, which you bump before each release",
            "From the GitHub release titles",
            "From a `versions.json` file you publish alongside the package",
          ],
          correctIndex: 0,
          explanation:
            "Composer reads the VCS. The docs explicitly recommend omitting `version` from `composer.json` precisely because a hand-maintained field drifts from the tags and creates confusing releases.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-packagist-q2",
          prompt: "Which is a valid Packagist package name?",
          options: ["`oyelabs/http-client`", "`Oyelabs/HttpClient`", "`oyelabs.http.client`", "`http-client`"],
          correctIndex: 0,
          explanation:
            "The format is `vendor/name`, lowercase, with words separated by dashes. The vendor half is what reserves your namespace on the index.",
        },
        {
          id: "php-psr-packagist-q3",
          prompt: "You push a new tag but Packagist still shows the old version. What is the usual cause?",
          options: [
            "The repository webhook that notifies Packagist is missing or failing, so the index has not re-crawled",
            "Packagist only indexes tags once a day and you have to wait",
            "The tag is missing a `v` prefix, which Packagist requires",
            "You must upload the release archive to Packagist manually",
          ],
          correctIndex: 0,
          explanation:
            "Packagist is push-driven: GitHub, GitLab and friends call a hook on every push. Without it you can trigger an update by hand on the package page, but the hook is the fix.",
        },
        {
          id: "php-psr-packagist-q4",
          prompt: "Which of these belong in a published library's `composer.json`? (Select all that apply.)",
          options: [
            "A `license` using an SPDX identifier such as `MIT`",
            "An `autoload` block mapping a PSR-4 prefix to `src/`",
            "A `require` entry constraining the supported PHP versions",
            "A `version` field kept in sync with the latest tag",
            "The `composer.lock` file's contents inlined so consumers get tested versions",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Licence, autoload rules and an honest platform constraint are the minimum for a package others can legally and reliably use. `version` should be omitted, and a lock file is never consulted for a dependency.",
        },
        {
          id: "php-psr-packagist-q5",
          prompt:
            "Your library needs a common dependency. Which constraint is the better citizen for consumers?",
          options: [
            "`\"^3.0\"` — permissive within the major, so it intersects with other packages' constraints",
            "`\"3.4.2\"` — exact, so you know precisely what you tested against",
            "`\"~3.4.2\"` — patch-level only, which is safest for your own CI",
            "`\"*\"` — maximally permissive, letting the application decide entirely",
          ],
          correctIndex: 0,
          explanation:
            "Library constraints are intersected with everyone else's, so an over-tight one makes your package unusable in projects that are otherwise fine. `*` is the opposite failure — it promises compatibility with majors that do not exist yet.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-packagist-q6",
          prompt: "How do you install a package from a private Git repository without publishing it anywhere?",
          options: [
            "Add a `vcs` repository entry pointing at the Git URL, then require the package by its `composer.json` name",
            "Commit the package into `vendor/` and add it to the classmap",
            "Publish it to Packagist and mark the package private on the package page",
            "Use a `files` autoload entry pointing at a checkout outside `vendor/`",
          ],
          correctIndex: 0,
          explanation:
            "A `vcs` repository makes Composer read the tags of that repository directly — no index required, credentials handled by `auth.json` or an SSH key. A `path` repository does the same for a local directory, usually with a symlink.",
        },
        {
          id: "php-psr-packagist-q7",
          prompt:
            "You need to ship a fix to a third-party package before upstream merges it. What is the standard approach?",
          options: [
            "Fork it, add a `vcs` repository for the fork in the root `composer.json`, and keep the original package name so it takes priority over Packagist",
            "Rename the fork and require it alongside the original",
            "Edit the files in `vendor/` and commit `vendor/` to git",
            "Add the fork as a `path` repository and copy it into place during deploy",
          ],
          correctIndex: 0,
          explanation:
            "Repositories declared in the root `composer.json` are checked before Packagist for the same name, so the fork substitutes cleanly and transitive requirements still match. Editing `vendor/` survives exactly until the next install.",
        },
        {
          id: "php-psr-packagist-q8",
          prompt: "What does a package's `type` field affect?",
          options: [
            "Installation behaviour — `library` (the default) lands in `vendor/`, while types like `wordpress-plugin` need a matching installer plugin to place files elsewhere",
            "Whether the package is indexed by Packagist",
            "Which autoload strategies the package may declare",
            "The stability of releases when no tag matches",
          ],
          correctIndex: 0,
          explanation:
            "`type` is a hook for custom installation logic, which is how CMS plugin packages end up in `wp-content/plugins` instead of `vendor/`. `project` and `metapackage` are the other built-in types.",
        },
        {
          id: "php-psr-packagist-q9",
          prompt:
            "An internal package is called `acme/internal-utils` and is served from a private repository. Someone publishes a package with that exact name to Packagist. What is the risk, and what prevents it?",
          options: [
            "A dependency-confusion attack if resolution ever falls through to Packagist; declaring the private repository as canonical, or disabling `packagist.org`, prevents it",
            "None — Composer always prefers the most recently updated repository",
            "None — package names on Packagist are reserved globally the moment you first install one",
            "Composer will install both copies side by side and the autoloader picks one at random",
          ],
          correctIndex: 0,
          explanation:
            "Root repositories take priority, but a misconfigured or removed entry makes Composer fall back to Packagist and quietly install a stranger's code under a name you trust. `{\"packagist.org\": false}` or a canonical private repository closes the hole.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-packagist-q10",
          prompt: "What does `composer create-project vendor/skeleton my-app` do?",
          options: [
            "Clones the package's files into `my-app` and runs an install there, rather than adding it as a dependency",
            "Adds `vendor/skeleton` to the current project's `require` and scaffolds from it",
            "Registers a new package named `my-app` on Packagist",
            "Creates an empty `composer.json` pre-filled with the skeleton's requirements",
          ],
          correctIndex: 0,
          explanation:
            "It is the \"start a project from a template\" command, which is why framework skeletons use `\"type\": \"project\"`. The result is a standalone codebase, not a dependency.",
        },
      ],
    },
    {
      id: "php-psr-coding-style",
      moduleId: "php-composer-psr",
      trackId: "php",
      title: "PSR-1, PSR-12 and PER Coding Style",
      summary:
        "Coding standards are not about taste; they exist so that diffs show intent rather than formatting, and so code from four projects reads as one. PSR-1 is the minimum interoperability layer: `<?php` and `<?=` only, UTF-8 without BOM, `StudlyCaps` class names, `camelCase` methods, class constants in `UPPER_SNAKE_CASE`, and the rule that catches people out — a file should *either* declare symbols *or* cause side effects, not both, so that including a class file can never change your ini settings or print output.\n\nPSR-12 is the extended style guide layered on top: four spaces and never tabs, a soft limit of 120 characters with no hard limit, a brace on its own line for classes and methods but on the same line for control structures, visibility declared on every property, method and constant, and `declare(strict_types=1);` in an exact prescribed form. Since PSR-12 was accepted in 2019, PHP gained enums, readonly properties, constructor promotion, first-class callables and more, none of which it covers — so the FIG published **PER Coding Style**, an Evolving Recommendation that \"extends, expands and replaces PSR-12\" and ships versioned releases (3.1 at the time of writing). PSR-12 is still Accepted and not going anywhere, but new tooling targets PER, and PSR-2 before it is formally Deprecated.\n\nNone of this should be enforced by humans in code review. **PHP_CodeSniffer** (`phpcs`) reports violations against a standard and `phpcbf` fixes what it can; **PHP-CS-Fixer** is rule-based and fixer-first, with presets for PSR-12 and PER; **Laravel Pint** is a zero-config wrapper around PHP-CS-Fixer with an opinionated preset. Pick one — running two against each other is a classic own goal — and wire it into CI in check mode (`--dry-run --diff`, or `phpcs` rather than `phpcbf`) so the build fails instead of a reviewer nitpicking.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "PHP-FIG: PSR-12 Extended Coding Style", url: "https://www.php-fig.org/psr/psr-12/", kind: "spec" },
        { label: "PHP-FIG: PER Coding Style", url: "https://www.php-fig.org/per/coding-style/", kind: "spec" },
        { label: "PHP-FIG: PSR-1 Basic Coding Standard", url: "https://www.php-fig.org/psr/psr-1/", kind: "spec" },
        { label: "PHP CS Fixer: documentation", url: "https://cs.symfony.com/", kind: "docs" },
      ],
      video: {
        title: "Development tips: PHP CS Fixer to format your code",
        channel: "Amitav Roy",
        url: "https://www.youtube.com/watch?v=YLTuR9oz_S0",
        videoId: "YLTuR9oz_S0",
        durationLabel: "10:31",
      },
      alternateVideos: [
        {
          title: "New Laravel Pint: Code Styling Made Easier",
          channel: "Laravel Daily",
          url: "https://www.youtube.com/watch?v=5khyIHIYIK4",
          videoId: "5khyIHIYIK4",
          durationLabel: "7:58",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-psr-coding-style-q1",
          prompt: "What is the current relationship between PSR-12 and PER Coding Style?",
          options: [
            "PER Coding Style extends and replaces PSR-12, and is released in versions so it can keep up with new PHP syntax",
            "PER Coding Style is a draft proposal that will become PSR-22 if accepted",
            "PSR-12 replaced PER Coding Style when it was accepted in 2019",
            "They are alternatives for different PHP versions: PSR-12 for PHP 7, PER for PHP 8",
          ],
          correctIndex: 0,
          explanation:
            "PSR-12 is frozen the way every accepted PSR is, which is a problem for a style guide when the language keeps adding syntax. A PHP Evolving Recommendation is the FIG's answer: same content, versioned releases.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-coding-style-q2",
          prompt:
            "PSR-1 says a file should either declare symbols or cause side effects, but not both. Which file breaks that rule?\n\n```php\n<?php\nini_set('display_errors', '1');\n\nclass Config\n{\n}\n```",
          options: [
            "This one — it declares a class and also changes an ini setting at include time",
            "No rule is broken; `ini_set` is a declaration, not a side effect",
            "It only breaks the rule if the class is autoloaded rather than required",
            "It breaks PSR-12's indentation rule, not PSR-1's side-effect rule",
          ],
          correctIndex: 0,
          explanation:
            "Autoloading means including a file becomes implicit, so any behaviour hidden in it fires at an unpredictable moment. Output, `include`, connecting to services and modifying globals all count as side effects.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-coding-style-q3",
          prompt: "Which naming rules does PSR-1 actually specify?",
          options: [
            "Classes in `StudlyCaps`, methods in `camelCase`, class constants in upper case with underscores",
            "Classes in `StudlyCaps`, methods and properties in `camelCase`, constants in `camelCase`",
            "Everything in `snake_case` except class names",
            "Classes in `StudlyCaps` and everything else left to the project",
          ],
          correctIndex: 0,
          explanation:
            "PSR-1 deliberately says nothing about property names, because projects disagree and interoperability does not depend on it. It is prescriptive only where it has to be.",
        },
        {
          id: "php-psr-coding-style-q4",
          prompt: "What does PSR-12 say about line length?",
          options: [
            "There MUST NOT be a hard limit; the soft limit is 120 characters and lines SHOULD NOT exceed 80",
            "Lines MUST NOT exceed 120 characters",
            "Lines MUST NOT exceed 80 characters, with no soft limit",
            "It leaves line length entirely to the project",
          ],
          correctIndex: 0,
          explanation:
            "The distinction matters for tooling: a linter should warn past 120 and never fail a build on length alone, because a hard limit produces worse line breaks than the long line it replaced.",
        },
        {
          id: "php-psr-coding-style-q5",
          prompt: "Which of these does PSR-12 specify? (Select all that apply.)",
          options: [
            "An indent of 4 spaces, never tabs",
            "Visibility declared on all properties, methods and (on supported versions) constants",
            "The opening brace of a class or method on its own line",
            "A maximum number of public methods per class",
            "That services must be injected through the constructor rather than resolved from a container",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "PSR-12 is purely about the shape of the source text. Class size and dependency style are design concerns, which is why they belong to a static analyser or a reviewer, not to a formatter.",
        },
        {
          id: "php-psr-coding-style-q6",
          prompt: "What is the practical difference between PHP_CodeSniffer and PHP-CS-Fixer?",
          options: [
            "`phpcs` reports violations against a standard (with `phpcbf` fixing a subset); PHP-CS-Fixer is fixer-first, applying configured rules to rewrite the file",
            "PHP_CodeSniffer only checks PSR-2, while PHP-CS-Fixer only checks PSR-12",
            "PHP_CodeSniffer runs at commit time, PHP-CS-Fixer runs in CI",
            "PHP-CS-Fixer only reports problems; PHP_CodeSniffer is the one that rewrites files",
          ],
          correctIndex: 0,
          explanation:
            "They overlap heavily and either can enforce PSR-12, but their configuration models differ — sniffs plus reports versus rules plus fixers. Running both on one codebase means they can fight over the same lines.",
        },
        {
          id: "php-psr-coding-style-q7",
          prompt: "What is Laravel Pint?",
          options: [
            "A zero-config wrapper around PHP-CS-Fixer with an opinionated default preset",
            "A separate formatter written from scratch for Blade and PHP",
            "A PHP_CodeSniffer standard shipped with the framework",
            "A static analyser that also checks types",
          ],
          correctIndex: 0,
          explanation:
            "Pint is PHP-CS-Fixer underneath with the configuration decisions already made, and you can still swap the preset to `psr12` or hand-pick rules in `pint.json`. It does not do static analysis — that is PHPStan or Psalm.",
        },
        {
          id: "php-psr-coding-style-q8",
          prompt: "How should a style fixer be wired into CI so it is useful rather than annoying?",
          options: [
            "Run it in check mode (for example `--dry-run --diff`) so the build fails with the exact diff, and let developers fix locally",
            "Run it in write mode and commit the changes back to the branch automatically",
            "Run it only on the default branch after merge",
            "Skip CI entirely and rely on an editor-on-save integration",
          ],
          correctIndex: 0,
          explanation:
            "Check mode makes the standard non-negotiable without CI rewriting history under the author. Editor integration is a good complement but cannot be relied on across a team.",
        },
        {
          id: "php-psr-coding-style-q9",
          prompt: "What is the status of PSR-2 today?",
          options: [
            "Deprecated — it was superseded by PSR-12, which is itself now extended by PER Coding Style",
            "Accepted and still the recommended style guide for PHP 8",
            "Abandoned before it was ever accepted",
            "Merged into PSR-1, which now covers both basic and extended style",
          ],
          correctIndex: 0,
          explanation:
            "PSR-2 and PSR-0 are the two formally Deprecated PSRs on the FIG index. Tooling still ships a `PSR2` ruleset for legacy projects, but new work should target PSR-12 or PER.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-coding-style-q10",
          prompt:
            "A pull request diff is 400 lines but the author says they changed one method. What went wrong and what is the fix?",
          options: [
            "Their editor reformatted the file to a different standard; commit a shared config and run the fixer over the codebase once, in its own commit",
            "They forgot to rebase, so unrelated commits are included",
            "The file has mixed line endings, which no style tool can control",
            "Nothing is wrong; large diffs are unavoidable without a formatter in CI",
          ],
          correctIndex: 0,
          explanation:
            "This is the whole reason to commit `.php-cs-fixer.dist.php` or `pint.json` alongside the code. The one-off reformat should be a separate, reviewable commit so it never mixes with behaviour changes again.",
        },
      ],
    },
    {
      id: "php-psr-fig-process",
      moduleId: "php-composer-psr",
      trackId: "php",
      title: "The FIG Process and the PSR Landscape",
      summary:
        "The PHP Framework Interop Group has no authority over anyone. It is a voluntary body of project representatives that publishes recommendations, and a PSR matters only because enough projects chose to implement it. That is worth internalising, because it explains both the shape of the standards — small interfaces, shipped as tiny packages like `psr/log` and `psr/container` — and their limits: a PSR describes how code from different vendors interoperates, never how you should structure your application.\n\nA proposal moves through Draft, then Review, then a vote to Accepted, after which it is frozen and only errata are applied. Two other statuses appear on the index: Deprecated (PSR-0 autoloading and PSR-2 coding style, both superseded) and Abandoned. Freezing is the right call for an interface — `LoggerInterface` changing under you would be a disaster — but it is the wrong call for a coding style, which is why the FIG added PHP Evolving Recommendations, versioned documents that keep releasing. PER Coding Style is the first one.\n\nThe practical value is dependency shape. Because `psr/log` contains only interfaces, a library can require it, accept a `LoggerInterface` and log usefully without forcing Monolog on anyone; the application picks the implementation. The same pattern gives you PSR-3 logging, PSR-4 autoloading, PSR-6 and PSR-16 caching (pool-and-item versus a simple get/set facade), PSR-7 HTTP messages, PSR-11 containers, PSR-14 event dispatch, PSR-15 middleware, PSR-17 HTTP factories, PSR-18 HTTP clients and PSR-20 clocks. Packages that provide an implementation advertise it with a virtual package such as `psr/log-implementation`, so a library can require the contract and let the consumer satisfy it.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "PHP-FIG: PHP Standards Recommendations index", url: "https://www.php-fig.org/psr/", kind: "spec" },
        { label: "PHP-FIG: PSR Workflow Bylaw", url: "https://www.php-fig.org/bylaws/psr-workflow/", kind: "docs" },
        { label: "PHP-FIG: PHP Evolving Recommendations", url: "https://www.php-fig.org/per/", kind: "spec" },
      ],
      video: {
        title: "PHP Coding Standards, Autoloading (PSR-4) & Composer - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=rqzYdHdyMH0",
        videoId: "rqzYdHdyMH0",
        startSeconds: 352,
        chapterLabel: "PSR",
        durationLabel: "21:49",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-psr-fig-process-q1",
          prompt: "What is the PHP-FIG's actual authority?",
          options: [
            "None — it is a voluntary group whose recommendations matter only because projects choose to adopt them",
            "It is the standards body of the PHP internals team and its PSRs ship with PHP",
            "It certifies packages on Packagist, which rejects non-compliant submissions",
            "It controls the Composer project and enforces PSRs through it",
          ],
          correctIndex: 0,
          explanation:
            "FIG is an interop group, entirely separate from PHP internals and from Composer. Adoption is the only enforcement mechanism there is, which is why the accepted PSRs are the narrow ones everyone could agree on.",
        },
        {
          id: "php-psr-fig-process-q2",
          prompt: "What happens to a PSR once it reaches Accepted status?",
          options: [
            "It is frozen: only errata are applied, and changing it means writing a new PSR that supersedes it",
            "It enters a rolling maintenance mode where the editor can revise it as PHP evolves",
            "It becomes mandatory for all FIG member projects",
            "It is re-voted every two years and expires if not renewed",
          ],
          correctIndex: 0,
          explanation:
            "Freezing is what makes an interface safe to depend on. It is also exactly why a coding style needed a different vehicle, which is where PHP Evolving Recommendations came from.",
        },
        {
          id: "php-psr-fig-process-q3",
          prompt: "Which two PSRs are formally marked Deprecated on the FIG index?",
          options: [
            "PSR-0 (autoloading) and PSR-2 (coding style)",
            "PSR-6 (caching) and PSR-16 (simple cache)",
            "PSR-5 (PHPDoc) and PSR-19 (PHPDoc tags)",
            "PSR-7 (HTTP message) and PSR-17 (HTTP factories)",
          ],
          correctIndex: 0,
          explanation:
            "Both were superseded — PSR-0 by PSR-4, PSR-2 by PSR-12. PSR-5 and PSR-19 are still Draft; PSR-6 and PSR-16 are both Accepted and intentionally coexist as different levels of abstraction.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-fig-process-q4",
          prompt: "Which of these PSRs are currently Accepted? (Select all that apply.)",
          options: [
            "PSR-3, the logger interface",
            "PSR-11, the container interface",
            "PSR-20, the clock interface",
            "PSR-5, the PHPDoc standard",
            "PSR-2, the coding style guide",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "PSR-3, PSR-11 and PSR-20 are all Accepted and shipped as `psr/*` packages. PSR-5 has been Draft for years — PHPDoc turned out to be much harder to standardise than an interface — and PSR-2 is Deprecated.",
        },
        {
          id: "php-psr-fig-process-q5",
          prompt: "Why is `psr/log` worth requiring in a library even though it contains no working logger?",
          options: [
            "It is interfaces only, so your library can accept a `LoggerInterface` and let the application choose Monolog or anything else",
            "It provides a default file logger you can fall back to",
            "Composer requires an interface package before it will resolve an implementation",
            "It installs Monolog automatically as a suggested dependency",
          ],
          correctIndex: 0,
          explanation:
            "Depending on the contract rather than an implementation is the entire point of the PSR interface packages, and it is why adding logging to a library costs consumers nothing. `NullLogger` is the built-in do-nothing fallback.",
        },
        {
          id: "php-psr-fig-process-q6",
          prompt:
            "A package declares `\"provide\": { \"psr/log-implementation\": \"3.0\" }`. What does that mean?",
          options: [
            "It advertises that it satisfies the PSR-3 contract, so a library requiring `psr/log-implementation` is happy with it installed",
            "It forces Composer to install `psr/log` version 3.0 alongside it",
            "It replaces `psr/log` so the interface package is not installed at all",
            "It reserves the `psr/log-implementation` name on Packagist",
          ],
          correctIndex: 0,
          explanation:
            "`provide` declares a virtual package. A library can require `psr/log-implementation` to say \"somebody must actually provide a logger\" without naming which one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-fig-process-q7",
          prompt: "What distinguishes a PHP Evolving Recommendation (PER) from a PSR?",
          options: [
            "A PER is released in versions and is expected to keep changing; a PSR is frozen once accepted",
            "A PER is binding on FIG member projects while a PSR is advisory",
            "A PER covers interfaces while a PSR covers documents",
            "A PER is a PSR that failed its acceptance vote",
          ],
          correctIndex: 0,
          explanation:
            "The PER workflow exists for documents whose subject matter keeps moving — coding style being the obvious one, since every PHP release adds syntax the previous guide never considered.",
        },
        {
          id: "php-psr-fig-process-q8",
          prompt: "PSR-6 and PSR-16 both cover caching and are both Accepted. Why do both exist?",
          options: [
            "PSR-6 is a pool-and-item abstraction with deferred saves; PSR-16 is a simpler `get`/`set`/`delete` facade over the same idea",
            "PSR-6 is for object caches and PSR-16 is for HTTP caches",
            "PSR-16 replaced PSR-6 but PSR-6 cannot be deprecated while frameworks still use it",
            "PSR-6 is for PHP 5 and PSR-16 for PHP 7 and later",
          ],
          correctIndex: 0,
          explanation:
            "PSR-6's item objects buy you metadata and deferred writes at the cost of ceremony; PSR-16 (\"Simple Cache\") is the everyday API. Most libraries bridge one to the other rather than picking a side.",
        },
        {
          id: "php-psr-fig-process-q9",
          prompt: "Which of these is *not* something a PSR is designed to tell you?",
          options: [
            "How to structure your application's layers and folders",
            "What methods a logger must expose",
            "Where an autoloader should look for a class file",
            "What interfaces an HTTP request object should implement",
          ],
          correctIndex: 0,
          explanation:
            "PSRs standardise the seams between packages, not the design inside one. Architecture is deliberately out of scope, which is why there is no PSR telling you to use a service layer.",
        },
        {
          id: "php-psr-fig-process-q10",
          prompt:
            "You are choosing between two HTTP client libraries. One implements PSR-18, the other has its own `send()` API. What does the PSR-18 one buy you?",
          options: [
            "Anything written against `Psr\\Http\\Client\\ClientInterface` works with it, and swapping the client later is a container binding rather than a refactor",
            "Guaranteed better performance, because PSR implementations are benchmarked by the FIG",
            "Automatic retry and timeout behaviour, which the standard specifies",
            "It will be maintained longer, because the FIG maintains PSR implementations",
          ],
          correctIndex: 0,
          explanation:
            "The value is substitutability, and it compounds when the SDKs you use also accept the interface. A PSR specifies a contract, not behaviour like retries, and the FIG maintains no implementations at all.",
        },
      ],
    },
    {
      id: "php-psr-psr3-logging",
      moduleId: "php-composer-psr",
      trackId: "php",
      title: "PSR-3: The Logger Interface",
      summary:
        "PSR-3 exists so a library can log without choosing your logger. It defines `Psr\\Log\\LoggerInterface` with eight level methods matching RFC 5424 — `emergency`, `alert`, `critical`, `error`, `warning`, `notice`, `info`, `debug` — plus a generic `log($level, $message, array $context = [])`. A library requires `psr/log`, type-hints the interface, and the application decides whether that goes to a file, to stderr, to Sentry, or nowhere at all.\n\nThe context array is the part people underuse. A message is a template with `{placeholder}` tokens, and the values live in the context array rather than being concatenated in — `$log->error('Payment {id} failed for user {user}', ['id' => $id, 'user' => $userId])`. That keeps the message a stable, groupable string for your log aggregator instead of a million unique lines, and it lets the handler decide how to render values. There is one reserved key: an exception MUST be passed as `context['exception']` so implementations can extract a stack trace, and implementations MUST still verify it really is a `Throwable` before treating it as one.\n\nThe interface's other strong requirement is leniency: a context value MUST NOT cause the logger to throw or emit a warning, because logging failing is never an acceptable way for an application to die. Calling `log()` with a level the implementation does not recognise is the exception — that MUST throw `Psr\\Log\\InvalidArgumentException`. The package also ships `AbstractLogger` and `LoggerTrait` (implement `log()`, get the eight methods free), `NullLogger` (the black hole for when no logger is injected — though a `if ($this->logger)` check is better when building the context is expensive), and `LoggerAwareInterface`/`LoggerAwareTrait` for setter injection. Monolog is the de-facto implementation: a `Logger` is a channel holding a stack of handlers, each with a minimum level and a `bubble` flag, plus processors that enrich every record.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "PHP-FIG: PSR-3 Logger Interface", url: "https://www.php-fig.org/psr/psr-3/", kind: "spec" },
        { label: "Monolog: Usage", url: "https://github.com/Seldaek/monolog/blob/main/doc/01-usage.md", kind: "repo" },
        { label: "RFC 5424: The Syslog Protocol", url: "https://www.rfc-editor.org/info/rfc5424/", kind: "spec" },
      ],
      video: {
        title: "PHP Logging with Monolog",
        channel: "Better Stack",
        url: "https://www.youtube.com/watch?v=GLbeuxNAcn8",
        videoId: "GLbeuxNAcn8",
        durationLabel: "24:36",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-psr-psr3-logging-q1",
          prompt: "PSR-3 defines eight levels taken from RFC 5424. Which is the most severe?",
          options: ["`emergency`", "`critical`", "`alert`", "`error`"],
          correctIndex: 0,
          explanation:
            "The order from most to least severe is emergency, alert, critical, error, warning, notice, info, debug. `emergency` means the system is unusable — it is not the level for a failed validation.",
        },
        {
          id: "php-psr-psr3-logging-q2",
          prompt:
            "Why write `$log->error('Payment {id} failed', ['id' => $id])` instead of `$log->error(\"Payment $id failed\")`?",
          options: [
            "The message stays a constant string so an aggregator can group occurrences, while the value is available as structured data",
            "String interpolation is slower than placeholder replacement",
            "PSR-3 forbids interpolated messages and implementations must reject them",
            "Placeholders are escaped by the logger, preventing log injection in every implementation",
          ],
          correctIndex: 0,
          explanation:
            "One template with a thousand contexts is searchable; a thousand unique strings are not. The spec also tells users *not* to pre-escape placeholder values, because only the handler knows the destination format.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-psr3-logging-q3",
          prompt: "How must an exception be passed to a PSR-3 logger?",
          options: [
            "In the context array under the key `exception`",
            "As the message, by relying on `__toString()`",
            "As a third argument after the context array",
            "Via a dedicated `logException()` method on the interface",
          ],
          correctIndex: 0,
          explanation:
            "`exception` is the one reserved context key, and it is how handlers know to extract a stack trace. The spec still requires implementations to check the value really is a `Throwable`, because the array can contain anything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-psr3-logging-q4",
          prompt: "What must happen when `log()` is called with a level string the implementation does not know?",
          options: [
            "It MUST throw `Psr\\Log\\InvalidArgumentException`",
            "It MUST silently downgrade the call to `debug`",
            "It MUST ignore the call and return",
            "It MAY do anything; the spec does not say",
          ],
          correctIndex: 0,
          explanation:
            "This is the one place PSR-3 requires a logger to throw. Everything else about logging is supposed to be forgiving, which is why the contrast is worth remembering.",
        },
        {
          id: "php-psr-psr3-logging-q5",
          prompt: "Which of these ship inside the `psr/log` package? (Select all that apply.)",
          options: [
            "`AbstractLogger`, which implements the eight level methods in terms of `log()`",
            "`NullLogger`, a no-op implementation for when no logger is supplied",
            "`LoggerAwareInterface`, with a single `setLogger()` method",
            "`StreamHandler`, which writes records to a file or stream",
            "A `FileLogger` reference implementation that writes to disk",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The package is interfaces plus small helpers and deliberately contains no working logger — `StreamHandler` is Monolog's. That is what makes it safe for a library to require.",
        },
        {
          id: "php-psr-psr3-logging-q6",
          prompt:
            "A context value is an object whose `__toString()` throws. According to PSR-3, what must the logger do?",
          options: [
            "Handle it leniently — a context value MUST NOT cause the logger to throw or raise a warning",
            "Let the exception propagate so the caller learns about the bad value",
            "Throw `InvalidArgumentException`, as it does for an unknown level",
            "Drop the whole log record silently and return `false`",
          ],
          correctIndex: 0,
          explanation:
            "The spec is explicit that implementors must treat context data with as much lenience as possible. A logger that can crash the request it is describing is worse than no logger.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-psr3-logging-q7",
          prompt: "Your service class needs to log. What should the constructor type-hint be?",
          options: [
            "`Psr\\Log\\LoggerInterface`",
            "`Monolog\\Logger`, so you can use its handler API",
            "`Psr\\Log\\AbstractLogger`, the base class implementations extend",
            "`Psr\\Log\\LoggerTrait`, so the container can inject the trait",
          ],
          correctIndex: 0,
          explanation:
            "Type-hinting the interface is what makes the class testable with a fake and portable across applications. `AbstractLogger` is an implementation detail loggers may or may not extend, and traits cannot be type-hints.",
        },
        {
          id: "php-psr-psr3-logging-q8",
          prompt: "When is `NullLogger` the wrong answer for \"no logger was injected\"?",
          options: [
            "When building the message or context is expensive, since the work happens before the no-op call discards it",
            "When the class also implements `LoggerAwareInterface`",
            "When the application uses Monolog, which rejects null loggers",
            "When logging happens inside a loop, because `NullLogger` allocates per call",
          ],
          correctIndex: 0,
          explanation:
            "The spec notes this directly: a no-op logger still forces you to compute the arguments. A nullable logger plus a guard is better when the context requires serialising something big.",
        },
        {
          id: "php-psr-psr3-logging-q9",
          prompt:
            "In Monolog, a channel has a `StreamHandler` at level `debug` and, above it, a `SlackHandler` at level `error` with `bubble` left at its default. What does an `error` record do?",
          options: [
            "It is handled by the Slack handler first and then continues down the stack to the stream handler",
            "It stops at the Slack handler, because a handled record does not continue",
            "It goes only to the stream handler, since it was registered first",
            "It is duplicated into both handlers in parallel threads",
          ],
          correctIndex: 0,
          explanation:
            "Monolog walks its handler stack from the last registered to the first, and a record keeps bubbling unless a handler is constructed with `bubble` set to false. That flag is the usual reason \"my file log is missing the errors\".",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-psr3-logging-q10",
          prompt: "What is `LoggerAwareInterface` for, and what is its downside compared with constructor injection?",
          options: [
            "It declares `setLogger()` so a framework can wire a logger in after construction, but it leaves the object usable in a state where no logger is set",
            "It marks a class as a logger implementation so the container can auto-register it",
            "It lets a class change its log level at runtime, at the cost of thread safety",
            "It is the only way to inject a logger into a class that already has constructor arguments",
          ],
          correctIndex: 0,
          explanation:
            "Setter injection is convenient for framework auto-wiring of an optional dependency, which is why `LoggerAwareTrait` defaults `$this->logger` to null. A required dependency belongs in the constructor where it cannot be forgotten.",
        },
      ],
    },
    {
      id: "php-psr-http-messages",
      moduleId: "php-composer-psr",
      trackId: "php",
      title: "PSR-7 and PSR-15: HTTP Messages and Middleware",
      summary:
        "PSR-7 models HTTP messages as value objects: `RequestInterface`, `ServerRequestInterface`, `ResponseInterface`, `UriInterface`, `StreamInterface`, `UploadedFileInterface`. The design decision that shapes everything else is immutability — every mutator is a `with*()` method that returns a *new* instance, so `$request->withHeader('X-Id', $id);` on its own does nothing at all. You must reassign. That is the single most common PSR-7 bug and it is a deliberate trade: when a request passes through ten middleware, nobody can mutate it out from under anyone else, and a handler that keeps a reference keeps the request it was given.\n\nThe immutability is not total, and pretending otherwise causes the second classic bug: the body is a `StreamInterface` wrapping a real resource. Reading it moves the cursor, so a middleware that reads the body for logging and does not `rewind()` hands the next component an empty body. The spec acknowledges this and recommends read-only streams server-side.\n\nPSR-15 builds the request pipeline on top with two tiny interfaces. `RequestHandlerInterface::handle(ServerRequestInterface): ResponseInterface` is anything that can produce a response; `MiddlewareInterface::process(ServerRequestInterface, RequestHandlerInterface): ResponseInterface` is a layer that may inspect or replace the request before calling `$handler->handle()`, may transform the response after, and may short-circuit by returning a response without delegating at all — which is exactly how auth, rate limiting and caching work. Because the request is immutable, the way a middleware passes data downstream is `withAttribute()`, which is how route parameters and the authenticated user arrive at the controller. PSR-17 factories exist because you cannot `new` an interface: a framework-agnostic library takes a `ResponseFactoryInterface` rather than hard-coding Nyholm or Guzzle. Symfony and Laravel use their own HTTP objects and reach PSR-7 through a bridge package, which is worth knowing before you promise a client \"framework-agnostic\".",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "PHP-FIG: PSR-7 HTTP message interfaces", url: "https://www.php-fig.org/psr/psr-7/", kind: "spec" },
        { label: "PHP-FIG: PSR-15 HTTP Server Request Handlers", url: "https://www.php-fig.org/psr/psr-15/", kind: "spec" },
        { label: "PHP-FIG: PSR-17 HTTP Factories", url: "https://www.php-fig.org/psr/psr-17/", kind: "spec" },
        { label: "Slim: Middleware", url: "https://www.slimframework.com/docs/v4/concepts/middleware.html", kind: "docs" },
      ],
      video: {
        title: "DPC2021: HTTP Patterns: PSR 7 & 15 By Example - Tim Lytle",
        channel: "Dutch PHP Conference",
        url: "https://www.youtube.com/watch?v=dutrUmKcTng",
        videoId: "dutrUmKcTng",
        startSeconds: 1010,
        chapterLabel: "Interfaces",
        durationLabel: "51:38",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-psr-http-messages-q1",
          prompt:
            "What is wrong with this middleware?\n\n```php\npublic function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface\n{\n    $request->withAttribute('user', $this->auth->user());\n\n    return $handler->handle($request);\n}\n```",
          options: [
            "`withAttribute()` returns a new request; the result is discarded, so the handler never sees the attribute",
            "Attributes may only be set on a `RequestInterface`, not a `ServerRequestInterface`",
            "`withAttribute()` must be called after `handle()`, not before",
            "Nothing — `withAttribute()` mutates the request in place",
          ],
          correctIndex: 0,
          explanation:
            "Every `with*()` method on a PSR-7 message returns a modified copy. The fix is `$request = $request->withAttribute(...)`, and forgetting it is the most common PSR-7 mistake there is.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-http-messages-q2",
          prompt: "Why did PSR-7 make messages immutable?",
          options: [
            "A message passes through many components, and immutability guarantees none of them can change what another already holds",
            "Immutable objects are faster to construct in PHP",
            "It was required to support HTTP/2 multiplexing",
            "So messages can be safely shared between processes",
          ],
          correctIndex: 0,
          explanation:
            "In a middleware pipeline, shared mutable state means any layer can invalidate assumptions made elsewhere. Copies cost a little memory and buy reasoning you can actually rely on.",
        },
        {
          id: "php-psr-http-messages-q3",
          prompt:
            "A logging middleware calls `(string) $request->getBody()` and then delegates. The controller now sees an empty body. Why?",
          options: [
            "The body is a `StreamInterface` over a real resource, so reading consumed it; the middleware needed to `rewind()` it",
            "Casting a stream to string destroys it, so a new body must be attached",
            "`getBody()` returns a copy, so the controller is reading a different, empty stream",
            "PSR-7 forbids reading the body before the handler runs",
          ],
          correctIndex: 0,
          explanation:
            "Message immutability does not extend to the stream the body wraps — the spec says so explicitly. Read it and rewind, or read once and re-attach a fresh in-memory stream with `withBody()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-http-messages-q4",
          prompt: "What are the two interfaces PSR-15 defines?",
          options: [
            "`RequestHandlerInterface::handle(ServerRequestInterface): ResponseInterface` and `MiddlewareInterface::process(ServerRequestInterface, RequestHandlerInterface): ResponseInterface`",
            "`MiddlewareInterface::handle(Request, Closure $next)` and `KernelInterface::terminate()`",
            "`RequestHandlerInterface::__invoke(Request, Response)` and `MiddlewareInterface::__invoke(Request, Response, callable $next)`",
            "`ServerRequestFactoryInterface` and `ResponseFactoryInterface`",
          ],
          correctIndex: 0,
          explanation:
            "Middleware receives the *next handler* rather than a `$next` closure, which is what makes a middleware composable and individually testable. The double-pass `(Request, Response, $next)` shape is the pre-PSR-15 style that PSR-15 deliberately replaced.",
        },
        {
          id: "php-psr-http-messages-q5",
          prompt: "Which of these may a PSR-15 middleware legitimately do? (Select all that apply.)",
          options: [
            "Return a response without ever calling `$handler->handle()`",
            "Replace the request with a modified copy before delegating",
            "Transform the response returned by the handler before returning it",
            "Mutate the request object in place so later middleware observe the change",
            "Change the handler's own middleware stack at runtime through the passed handler",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Short-circuiting is how auth and rate limiting work; wrapping the call is how compression and timing work. In-place mutation is impossible by design, and `RequestHandlerInterface` exposes only `handle()`, so there is nothing to reconfigure.",
        },
        {
          id: "php-psr-http-messages-q6",
          prompt:
            "Middleware A, then B, then the handler. Each logs before and after delegating. What is the output order?",
          options: [
            "A-before, B-before, handler, B-after, A-after",
            "A-before, B-before, handler, A-after, B-after",
            "handler, B-before, B-after, A-before, A-after",
            "A-before, A-after, B-before, B-after, handler",
          ],
          correctIndex: 0,
          explanation:
            "The pipeline is an onion: each middleware wraps the rest, so the code after `$handler->handle()` unwinds in reverse. That is also why an exception-handling middleware has to be the outermost one to catch anything thrown deeper in.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-http-messages-q7",
          prompt: "How does a middleware pass data — say the authenticated user — to the controller downstream?",
          options: [
            "`$request = $request->withAttribute('user', $user)` and the controller reads `getAttribute('user')`",
            "By setting a request header, since headers are the only mutable part of a message",
            "Through a static registry, because the request is immutable",
            "By returning the value, which the pipeline forwards to the next component",
          ],
          correctIndex: 0,
          explanation:
            "Attributes are the standard side-channel on `ServerRequestInterface` and are exactly how routers attach path parameters. Headers would leak your internal state onto the wire.",
        },
        {
          id: "php-psr-http-messages-q8",
          prompt: "Why does PSR-17 exist alongside PSR-7?",
          options: [
            "You cannot instantiate an interface, so a framework-agnostic library needs an injected factory to create requests, responses, streams and URIs",
            "PSR-7 implementations are too slow, and PSR-17 provides pooled objects",
            "PSR-17 replaces PSR-7's constructors with named constructors for immutability",
            "PSR-17 defines the HTTP client that sends PSR-7 requests",
          ],
          correctIndex: 0,
          explanation:
            "Without factories, a library that needs to build a response must hard-code Nyholm, Guzzle or Laminas. Taking a `ResponseFactoryInterface` keeps the choice with the application. PSR-18 is the client standard.",
        },
        {
          id: "php-psr-http-messages-q9",
          prompt: "How does `ServerRequestInterface` relate to the superglobals?",
          options: [
            "It models the same data as explicit methods — `getQueryParams()`, `getParsedBody()`, `getUploadedFiles()`, `getServerParams()` — so code takes it as a parameter instead of reading globals",
            "It is a thin wrapper that reads `$_GET` and `$_POST` lazily on each call",
            "It replaces the superglobals at runtime, so `$_GET` is empty once the request is built",
            "It only covers headers and the URI; body and query data are still read from globals",
          ],
          correctIndex: 0,
          explanation:
            "Turning ambient global state into an argument is what makes a handler unit-testable without a web server. The superglobals still exist — the request object is built from them once, at the edge.",
        },
        {
          id: "php-psr-http-messages-q10",
          prompt: "How do Laravel and Symfony relate to PSR-7?",
          options: [
            "Both use their own HTTP objects and convert to and from PSR-7 through a bridge package when it is needed",
            "Both implement PSR-7 natively, so their request objects are `ServerRequestInterface` instances",
            "Neither can interoperate with PSR-7 at all",
            "Both dropped their own objects in favour of PSR-7 once PSR-15 was accepted",
          ],
          correctIndex: 0,
          explanation:
            "Laravel documents installing the Symfony HTTP Message Bridge (plus a PSR-7 implementation) to type-hint a PSR-7 request. Slim, Mezzio and most micro-frameworks are PSR-7 native, which is worth checking before promising portability.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-http-messages-q11",
          prompt: "Where should an exception-handling middleware sit in the stack, and why?",
          options: [
            "Outermost, so it wraps every other component and can guarantee a response is always produced",
            "Innermost, closest to the handler where exceptions are actually thrown",
            "It does not matter, because PSR-15 catches exceptions at the pipeline level",
            "Immediately after routing, so it knows which route failed",
          ],
          correctIndex: 0,
          explanation:
            "PSR-15 explicitly recommends it as the first component executed. Anything it does not wrap can throw past it, and PSR-15 itself specifies no exception handling — a handler may throw and the type is undefined.",
        },
      ],
    },
    {
      id: "php-psr-container",
      moduleId: "php-composer-psr",
      trackId: "php",
      title: "PSR-11 Containers and Dependency Injection",
      summary:
        "Dependency injection is the plain idea that an object should be handed what it needs rather than constructing it — `new PaymentService($gateway, $logger)` instead of a class that news up a Stripe client internally. The payoff is not abstraction for its own sake: it is that the collaborators become visible in the signature, swappable in a test, and configurable per environment. A DI container is the machinery that assembles that graph for you, usually by reading constructor type hints through Reflection (autowiring) and by consulting explicit bindings for the things Reflection cannot guess — interfaces, scalars, anything needing a factory.\n\nPSR-11 standardises only the *reading* half: `ContainerInterface` has exactly two methods, `get(string $id)` and `has(string $id)`. There is deliberately no `set()`, because how entries get registered is where containers legitimately differ, and standardising it would have frozen the design space. The contract is small but precise: if `has($id)` is false then `get($id)` MUST throw a `NotFoundExceptionInterface` (which extends `ContainerExceptionInterface`); `has($id)` returning true does *not* promise `get($id)` will succeed, only that any failure will not be a not-found error; and two successive `get()` calls SHOULD return the same value, though the spec warns consumers not to depend on it.\n\nThe standard also carries an explicit warning worth more than the interface: users SHOULD NOT pass the container into an object so it can fetch its own dependencies. That is the Service Locator pattern, and it moves dependencies out of the signature and into the body, which is precisely the property DI was adopted for. A container belongs at the composition root — the framework's bootstrap — and nowhere else. In an application container that means binding interfaces to concrete classes once and letting autowiring do the rest; the shape of a constructor is your design, and the container is only the thing that obeys it.",
      level: "advanced",
      estMinutes: 50,
      isMilestone: true,
      webRefs: [
        { label: "PHP-FIG: PSR-11 Container interface", url: "https://www.php-fig.org/psr/psr-11/", kind: "spec" },
        { label: "PHP-FIG: PSR-11 Meta Document", url: "https://www.php-fig.org/psr/psr-11/meta/", kind: "spec" },
        { label: "PHP-DI: Best practices", url: "https://php-di.org/doc/best-practices.html", kind: "docs" },
        { label: "Martin Fowler: Inversion of Control Containers and the Dependency Injection pattern", url: "https://martinfowler.com/articles/injection.html", kind: "article" },
      ],
      video: {
        title: "Dependency Injection in PHP | Create a Service Container from Scratch | Use PHP-DI",
        channel: "Dave Hollingworth",
        url: "https://www.youtube.com/watch?v=TqMXzEK0nsA",
        videoId: "TqMXzEK0nsA",
        durationLabel: "16:02",
      },
      alternateVideos: [
        {
          title: "Dependency Injection Container With & Without Reflection API Autowiring - Full PHP 8 Tutorial",
          channel: "Program With Gio",
          url: "https://www.youtube.com/watch?v=78Vpg97rQwE",
          videoId: "78Vpg97rQwE",
          durationLabel: "29:44",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-psr-container-q1",
          prompt: "Why does `ContainerInterface` define only `get()` and `has()`, with no `set()`?",
          options: [
            "PSR-11 standardises consuming a container, not configuring one — registration is where implementations legitimately differ",
            "`set()` was removed in PSR-11 2.0 after it proved unsafe",
            "Because entries are always resolved by autowiring, so nothing is ever registered manually",
            "Because a container must be immutable to be thread-safe",
          ],
          correctIndex: 0,
          explanation:
            "A library that receives a container only ever reads from it. Standardising registration would have forced every container — compiled, annotation-driven, PHP-config-driven — into one shape for no interoperability gain.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-container-q2",
          prompt: "Under PSR-11, what does `has($id)` returning `true` guarantee about `get($id)`?",
          options: [
            "Only that it will not throw a `NotFoundExceptionInterface`; it may still throw a `ContainerExceptionInterface`",
            "That it will return a value without throwing",
            "That it will return the same value on every call",
            "Nothing at all — the two methods are unrelated",
          ],
          correctIndex: 0,
          explanation:
            "The spec spells this out: a known entry can still fail to build — a missing scalar, a bad config value, a failing factory. The guarantee runs the other way too: if `has()` is false, `get()` MUST throw `NotFoundExceptionInterface`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-container-q3",
          prompt:
            "A class takes the container in its constructor and calls `$this->container->get(Mailer::class)` inside a method. What is the objection?",
          options: [
            "It is the Service Locator pattern: the real dependencies vanish from the signature and only surface at runtime",
            "It is slower, because `get()` resolves on every call",
            "PSR-11 forbids it and compliant containers throw when injected into a service",
            "It breaks autowiring, since the container cannot resolve itself",
          ],
          correctIndex: 0,
          explanation:
            "PSR-11 itself says users SHOULD NOT do this. You lose the compile-time and test-time visibility that made DI worth adopting; the class now needs a configured container to be tested at all.",
        },
        {
          id: "php-psr-container-q4",
          prompt:
            "Autowiring resolves constructor arguments by Reflection. Which of these can it *not* figure out on its own?",
          options: [
            "An `int $maxRetries` parameter with no default",
            "A `LoggerInterface $logger` parameter, given an explicit interface-to-class binding",
            "A concrete `Mailer $mailer` parameter whose own dependencies are all concrete classes",
            "A parameter with a default value it can fall back to",
          ],
          correctIndex: 0,
          explanation:
            "Reflection reveals the type, not the value — there is no way to infer that `$maxRetries` should be 3. Interfaces are the other gap, which is why the binding map exists; concrete types resolve recursively.",
        },
        {
          id: "php-psr-container-q5",
          prompt: "Which of these are real benefits of constructor injection? (Select all that apply.)",
          options: [
            "Dependencies are visible in the signature rather than hidden in the method bodies",
            "A test can pass a fake or stub without touching global state",
            "An object cannot be constructed in a half-configured state",
            "It reduces the number of objects created per request",
            "It removes the need to define interfaces for collaborators",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The wins are all about visibility, substitutability and validity at construction time. It creates no fewer objects — if anything a container creates more — and it says nothing about whether you need an interface, which is a separate design decision.",
        },
        {
          id: "php-psr-container-q6",
          prompt: "What does PSR-11 say about calling `get('config')` twice?",
          options: [
            "The container SHOULD return the same value both times, but consumers SHOULD NOT rely on it",
            "It MUST return the same instance — containers are singleton registries by definition",
            "It MUST return a new instance each time unless the entry is explicitly shared",
            "The spec does not address repeated calls",
          ],
          correctIndex: 0,
          explanation:
            "Most containers share by default, but some support per-resolution factories, so the spec hedges. Code that genuinely needs a fresh object each time should inject a factory rather than assume container behaviour.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-container-q7",
          prompt: "How do PSR-11's two exception interfaces relate?",
          options: [
            "`NotFoundExceptionInterface` extends `ContainerExceptionInterface`, so catching the latter catches both",
            "They are unrelated interfaces, so you must catch both separately",
            "`ContainerExceptionInterface` extends `NotFoundExceptionInterface`",
            "Both extend `InvalidArgumentException` from the SPL",
          ],
          correctIndex: 0,
          explanation:
            "Not-found is a specialisation of \"the container failed\", which lets a caller handle the missing-entry case specifically or treat every container failure uniformly. Neither extends a concrete class — they are interfaces so implementations can use their own exception hierarchies.",
        },
        {
          id: "php-psr-container-q8",
          prompt: "Why bind an interface to a concrete class in the container rather than type-hinting the class directly?",
          options: [
            "It lets you swap the implementation per environment or in tests by changing one binding, with no consumer changes",
            "Containers cannot autowire concrete classes, only interfaces",
            "Interfaces resolve faster because Reflection can skip the constructor",
            "It is required by PSR-11 for any entry with dependencies",
          ],
          correctIndex: 0,
          explanation:
            "The substitution point is the whole reason for the indirection — a fake gateway in tests, a different driver in staging. It is also worth *not* doing when there will only ever be one implementation; the interface costs a file and buys nothing.",
        },
        {
          id: "php-psr-container-q9",
          prompt:
            "`A`'s constructor requires `B`, and `B`'s constructor requires `A`. What does a typical autowiring container do with `get(A::class)`?",
          options: [
            "Detects the cycle and throws a container exception (or recurses until it exhausts the stack)",
            "Resolves it by injecting a lazily initialised proxy automatically",
            "Injects `null` for one of them to break the loop",
            "Returns a partially constructed `A` with `B` unset",
          ],
          correctIndex: 0,
          explanation:
            "There is no valid construction order, so good containers report the cycle by name rather than blowing the stack. The real fix is a design change — extract the shared behaviour, or invert one dependency into an event.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-psr-container-q10",
          prompt: "Where should a container be referenced in a well-structured application?",
          options: [
            "Only at the composition root — the bootstrap that builds the object graph and hands the entry point to the framework",
            "In every service, so dependencies can be resolved on demand",
            "In the base controller, so controllers stay free of constructor arguments",
            "In static helpers, so any code can reach it without wiring",
          ],
          correctIndex: 0,
          explanation:
            "Restricting the container to one place keeps every other class an ordinary object with explicit dependencies. Frameworks bend this (Laravel's facades resolve through the container at call time), which is convenient and is also why facade-heavy code is harder to test in isolation.",
        },
        {
          id: "php-psr-container-q11",
          prompt: "When is a DI container genuinely not worth it?",
          options: [
            "In a small script or library with a shallow object graph, where explicit wiring is shorter than the configuration would be",
            "In any application with more than one environment",
            "Whenever the code base uses interfaces, since those must be bound manually",
            "In long-running processes, where containers leak memory by design",
          ],
          correctIndex: 0,
          explanation:
            "A container is a solution to assembly complexity; with three objects there is none to solve. Libraries in particular should accept their dependencies as constructor arguments and let the consumer's container — whichever one it is — do the assembling.",
        },
      ],
    },
  ],
} satisfies Module;
