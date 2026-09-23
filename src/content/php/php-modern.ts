import type { Module } from "@/types/curriculum";

export default {
  id: "php-modern",
  trackId: "php",
  name: "Modern PHP 8.x",
  description:
    "What actually changed between PHP 7.x and 8.5, and why it matters. Attributes, first-class callables, property hooks, lazy objects, fibers, the pipe operator — plus the unglamorous half: the support cycle, deprecations, opcache and the JIT.",
  refs: [
    { label: "PHP Manual: Appendices — Migration guides", url: "https://www.php.net/manual/en/migration85.php", kind: "docs" },
    { label: "PHP: Supported Versions", url: "https://www.php.net/supported-versions.php", kind: "docs" },
    { label: "PHP.Watch: version-by-version changes", url: "https://php.watch/versions", kind: "article" },
  ],
  topics: [
    {
      id: "php-modern-release-cycle",
      moduleId: "php-modern",
      trackId: "php",
      title: "The PHP Release and Support Cycle",
      summary:
        "PHP ships a minor version every November and supports each one for four years: two years of active support, where ordinary bugs and security holes are both fixed, then two more years where only critical security issues are. At the time of writing 8.5 (November 2025) is current, 8.4 is in active support until the end of 2026, 8.3 is security-only until the end of 2027, and 8.2 leaves security support at the end of 2026. Everything below that is unpatched, whatever your hosting panel says.\n\nThis matters more in PHP than in ecosystems with long-term-support branches, because PHP has no LTS: the language moves in minors and the clock never stops. The release-process RFC promises that *source* backward compatibility is kept from `x.y` to `x.y+1`, so walking a codebase from 8.1 to 8.5 is mostly a matter of clearing deprecations, each of which emits `E_DEPRECATED` on a version where the behaviour still works. That is years of warning before a major removes anything. Staying on an end-of-life branch is therefore almost never a language problem — it is an extension, vendor or fear problem.\n\nThe part that catches teams out is that *binary* compatibility is explicitly not kept between minors. Every compiled extension — redis, imagick, xdebug, the PDO drivers — is built against one ABI, so each minor bump needs every extension rebuilt or reinstalled from the matching 8.x packages. A Dockerfile pinned to `php:8.3-fpm` with a list of `pecl install` lines does not simply flip to 8.5 by editing the tag.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "PHP: Supported Versions", url: "https://www.php.net/supported-versions.php", kind: "docs" },
        { label: "PHP Manual: Migrating from PHP 8.4.x to PHP 8.5.x", url: "https://www.php.net/manual/en/migration85.php", kind: "docs" },
        { label: "PHP RFC: Release Process", url: "https://wiki.php.net/rfc/releaseprocess", kind: "spec" },
        { label: "PHP.Watch: Versions", url: "https://php.watch/versions", kind: "article" },
      ],
      video: {
        title: "PHP 8.5: Full Review – What’s New & What Changed!",
        channel: "nunomaduro",
        url: "https://www.youtube.com/watch?v=M1ksgzGbS60",
        videoId: "M1ksgzGbS60",
        durationLabel: "16:00",
      },
      alternateVideos: [
        {
          title: "PHP 8.6 First Look: What’s Coming and What’s Leaving",
          channel: "PHP Annotated",
          url: "https://www.youtube.com/watch?v=vmSiuI2tVQ4",
          videoId: "vmSiuI2tVQ4",
          durationLabel: "4:59",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-modern-release-cycle-q1",
          prompt: "How long is a given PHP minor branch supported after its release?",
          options: [
            "Two years of active support, then two years of security-only fixes",
            "Three years of active support, then one year of security-only fixes",
            "Five years, with an LTS branch every third minor",
            "Until the next minor ships, then it is immediately end of life",
          ],
          correctIndex: 0,
          explanation:
            "Each branch gets two years of active support (all bugs plus security) followed by two years where only critical security issues are patched. PHP has no LTS branch — every minor is treated the same way.",
        },
        {
          id: "php-modern-release-cycle-q2",
          prompt: "A branch is described as being in \"security fixes only\" maintenance. What does that actually mean for you?",
          options: [
            "Functional bugs you report will not be fixed on that branch; only critical security issues are",
            "Nothing is released for that branch at all any more",
            "Only bugs that affect more than one supported branch are fixed",
            "Fixes are released but must be applied by recompiling from source patches",
          ],
          correctIndex: 0,
          explanation:
            "Security-only branches still get releases, but ordinary bug reports are closed as out of scope. That is the signal to plan the upgrade, not the signal that you are fine for another two years.",
        },
        {
          id: "php-modern-release-cycle-q3",
          prompt: "Which of these are promised by PHP's release-process policy for a minor upgrade such as 8.3 → 8.4? (Select all that apply.)",
          options: [
            "Source backward compatibility for userland code, apart from narrowly documented exceptions",
            "New features and new deprecations may be introduced",
            "Binary (ABI) compatibility for compiled extensions",
            "That no existing function will ever emit a new deprecation notice",
            "That the `php` binary can be swapped without touching the extension set",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Minors keep source compatibility and are where features and deprecations land. Binary compatibility is explicitly *not* kept between feature releases, which is exactly why extensions must be rebuilt.",
        },
        {
          id: "php-modern-release-cycle-q4",
          prompt: "You bump a server from PHP 8.3 to 8.5 by installing the new packages and switching the FPM pool. The application dies with `Class \"Redis\" not found`, although nothing in the code changed. What is the most likely cause?",
          options: [
            "The `redis` extension was built against the 8.3 ABI and has not been reinstalled for 8.5",
            "`Redis` was removed from PHP in 8.4",
            "The class needs a leading backslash as of PHP 8.4",
            "Composer's autoloader must be regenerated after a PHP upgrade",
          ],
          correctIndex: 0,
          explanation:
            "Compiled extensions are tied to one minor's ABI and must be reinstalled per version. `Redis` is a PECL extension, never a bundled class, so nothing about the language removed it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-release-cycle-q5",
          prompt: "How does a feature normally travel from \"deprecated\" to \"gone\" in PHP?",
          options: [
            "It emits `E_DEPRECATED` while still working in minors, and is only removed in a major release",
            "It emits `E_WARNING` for one minor, then throws in the next minor",
            "It is removed in the next minor, with the deprecation notice as the only warning",
            "It is removed immediately but kept behind an INI flag for one release",
          ],
          correctIndex: 0,
          explanation:
            "Deprecation is a diagnostic, not a behaviour change: the code keeps working and only stops in a major. That is why an 8.x codebase that has silenced `E_DEPRECATED` has no idea how much work a future 9.0 will be.",
        },
        {
          id: "php-modern-release-cycle-q6",
          prompt: "A `composer.json` declares `\"require\": { \"php\": \"^8.2\" }`. Which runtimes satisfy it?",
          options: [
            "8.2.0 up to but not including 9.0.0",
            "Only the 8.2.x series",
            "8.2.0 up to but not including 8.3.0",
            "Any PHP 8 or later, including 9.x",
          ],
          correctIndex: 0,
          explanation:
            "The caret allows changes that do not modify the leftmost non-zero digit, so `^8.2` means `>=8.2.0 <9.0.0`. A library that wants to pin a single minor has to write `~8.2.0`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-release-cycle-q7",
          prompt: "What changes are allowed in a patch release such as 8.4.12 → 8.4.13?",
          options: [
            "Bug and security fixes only, with backward compatibility kept",
            "Bug fixes plus small new functions, if they are additive",
            "Anything that does not change the public API of an extension",
            "New deprecations, so that the next minor can remove the behaviour",
          ],
          correctIndex: 0,
          explanation:
            "Patch releases are fixes only. Features and deprecations are minor-release material, which is why reading one migration guide per minor is enough to plan an upgrade.",
        },
        {
          id: "php-modern-release-cycle-q8",
          prompt:
            "Your production `php.ini` has `error_reporting = E_ALL & ~E_DEPRECATED` and the logs are clean. What can you conclude about how ready the codebase is for the next major PHP release?",
          options: [
            "Nothing — you have switched off exactly the signal that would tell you",
            "That it is ready, since deprecations are the only pre-major warning",
            "That only third-party packages could still be a problem",
            "That it is ready, provided every dependency is on its latest version",
          ],
          correctIndex: 0,
          explanation:
            "Suppressing `E_DEPRECATED` hides the entire runway a major gives you. Turning it back on in staging (or running the test suite with `E_ALL`) is usually the first real step of an upgrade.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-release-cycle-q9",
          prompt: "Why do teams so often end up stranded on an end-of-life PHP version, given that minors keep source compatibility?",
          options: [
            "The blockers are usually unmaintained extensions, vendor packages or hosting images, not the language",
            "Because each minor rewrites a large part of the standard library",
            "Because PHP requires a paid support contract past the first two years",
            "Because `composer update` cannot resolve across a PHP minor boundary",
          ],
          correctIndex: 0,
          explanation:
            "The language itself is the easy part. What stalls upgrades is an abandoned package with a `<8.0` constraint, an extension nobody has rebuilt, or a managed host that has not published the image yet.",
        },
      ],
    },
    {
      id: "php-modern-attributes",
      moduleId: "php-modern",
      trackId: "php",
      title: "Attributes and Reflection",
      summary:
        "Attributes, added in PHP 8.0, are structured metadata attached to declarations and read back through Reflection. Before them, frameworks encoded the same information in docblock comments and parsed it with regular expressions or a custom lexer — which is why `opcache.save_comments=0` used to break Doctrine, and why a typo in `@ORM\\Column` produced silence rather than an error. Attributes are parsed by the engine itself, survive opcache, and resolve to real class names, so an IDE can complete them and a static analyser can check them.\n\nThe design decision worth understanding is laziness. `ReflectionClass::getAttributes()` gives you `ReflectionAttribute` objects that know only the attribute's name and raw arguments; nothing is instantiated, and the attribute class need not even exist, until you call `newInstance()`. That is also when target restrictions (`Attribute::TARGET_METHOD`, and so on) and constructor type errors are enforced. So an attribute applied to the wrong kind of declaration is a *runtime* error at the moment something reflects over it, not a compile-time one — the opposite of most people's intuition.\n\nThe cost is that reading attributes means reflecting, and reflecting on every request is the kind of overhead that shows up as a flat tax on a busy application. This is why Laravel and Symfony compile routes, containers and ORM metadata into cached PHP files at deploy time rather than reflecting per request. Treat attribute scanning as a build step, not a request-time operation, and the ergonomics come free.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "PHP Manual: Attributes", url: "https://www.php.net/manual/en/language.attributes.php", kind: "docs" },
        { label: "PHP Manual: Reading Attributes with the Reflection API", url: "https://www.php.net/manual/en/language.attributes.reflection.php", kind: "docs" },
        { label: "PHP RFC: Attributes v2", url: "https://wiki.php.net/rfc/attributes_v2", kind: "spec" },
        { label: "PHP.Watch: PHP Attributes", url: "https://php.watch/articles/php-attributes", kind: "article" },
      ],
      video: {
        title: "PHP Attributes - Simple Router With Attributes - Full PHP 8 Tutorial",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=I7WJa-he5oM",
        videoId: "I7WJa-he5oM",
        durationLabel: "22:59",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-modern-attributes-q1",
          prompt:
            "When is the attribute class actually instantiated?\n\n```php\n#[Route('/users')]\nclass UserController {}\n\n$attrs = (new ReflectionClass(UserController::class))->getAttributes();\n```",
          options: [
            "Only when `$attrs[0]->newInstance()` is called",
            "At compile time, when the file is parsed",
            "When `getAttributes()` returns, one instance per attribute",
            "When the class containing the attribute is first autoloaded",
          ],
          correctIndex: 0,
          explanation:
            "`getAttributes()` returns `ReflectionAttribute` handles carrying only the name and raw arguments. Instantiation — and therefore argument validation — is deferred to `newInstance()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-attributes-q2",
          prompt:
            "`#[Cacheable]` is declared with `#[Attribute(Attribute::TARGET_METHOD)]` but someone writes it above a class. When does that fail?",
          options: [
            "At runtime, when `newInstance()` is called on that attribute",
            "At compile time, when the class file is parsed",
            "Never — targets are advisory only",
            "When `getAttributes()` is called on the class",
          ],
          correctIndex: 0,
          explanation:
            "Target bitmasks are enforced during instantiation, so the exception surfaces at `newInstance()`. Nothing complains at parse time, which is why a misplaced attribute can sit in a codebase unnoticed until the one code path that reflects over it runs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-attributes-q3",
          prompt: "Which of these are valid arguments to an attribute? (Select all that apply.)",
          options: [
            "A literal such as `'/users'` or `42`",
            "A class constant like `self::VALUE` or an enum case",
            "A constant expression such as `100 + 200`",
            "A call to a helper function like `config('app.name')`",
            "A variable such as `$defaultPath`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Attribute arguments must be constant expressions, evaluated when the attribute is instantiated — so function calls and variables are out. PHP 8.1's \"new in initializers\" did add `new` to that list, which is what makes nested attributes such as `#[Route(new Options(...))]` possible.",
        },
        {
          id: "php-modern-attributes-q4",
          prompt: "What happens if you apply the same attribute twice to one declaration without declaring it repeatable?",
          options: [
            "An error is raised when the attribute is instantiated via reflection",
            "Both copies are silently kept and returned by `getAttributes()`",
            "The second one overwrites the first",
            "It is a parse error",
          ],
          correctIndex: 0,
          explanation:
            "By default an attribute may appear once per declaration; repeating it requires `Attribute::IS_REPEATABLE` in the bitmask. Like target checks, the failure is raised when the attribute is instantiated.",
        },
        {
          id: "php-modern-attributes-q5",
          prompt:
            "What does this print?\n\n```php\ninterface Color {}\n#[Attribute] class Fruit {}\n#[Attribute] class Red implements Color {}\n\n#[Fruit] #[Red]\nclass Apple {}\n\n$r = new ReflectionClass(Apple::class);\nvar_dump(count($r->getAttributes(Color::class)));\n```",
          options: [
            "`int(0)`",
            "`int(1)`",
            "`int(2)`",
            "It throws, because `Color` is not an attribute class",
          ],
          correctIndex: 0,
          explanation:
            "By default the `name` filter matches the attribute class exactly, and nothing is literally named `Color`. Passing `ReflectionAttribute::IS_INSTANCEOF` as the second argument switches to `instanceof` matching and would return 1.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-attributes-q6",
          prompt: "Which are genuine advantages of attributes over docblock annotations? (Select all that apply.)",
          options: [
            "They are parsed by the engine, so `opcache.save_comments=0` cannot strip them",
            "Their names resolve through `use` statements like any other class reference",
            "A misspelled attribute class fails loudly instead of being ignored",
            "They are evaluated at compile time, so reading them costs nothing at runtime",
            "They can hold arbitrary runtime values computed per request",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Attributes are real syntax with real name resolution and real failure modes. But reading them still means reflection at runtime, and their arguments must be constant expressions, so neither of the last two is true.",
        },
        {
          id: "php-modern-attributes-q7",
          prompt: "A route-discovery pass reflects over 400 controller classes on every request to read `#[Route]`. What is the correct fix?",
          options: [
            "Run the scan once at deploy time and cache the result as a compiled PHP file",
            "Move the attributes to docblocks, which are cheaper to read",
            "Enable the JIT so reflection is compiled to machine code",
            "Cache the `ReflectionClass` objects in a static array",
          ],
          correctIndex: 0,
          explanation:
            "Attribute scanning is a build step: frameworks compile routes and container metadata into plain PHP that opcache then serves for free. Caching `ReflectionClass` objects within a request does nothing across requests, and the JIT does not speed up reflection.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-attributes-q8",
          prompt: "What does `$attribute->getArguments()` return for `#[Route(path: '/users', methods: ['GET'])]`?",
          options: [
            "The raw argument list, with named arguments as string keys, uninstantiated",
            "A `Route` instance with its properties populated",
            "A positional array in declaration order, with names discarded",
            "`null`, because named arguments require `newInstance()`",
          ],
          correctIndex: 0,
          explanation:
            "`getArguments()` exposes exactly what was written, preserving named arguments as string keys. Turning that into an object — and validating it against the constructor signature — is what `newInstance()` does.",
        },
        {
          id: "php-modern-attributes-q9",
          prompt: "Which reflection entry points can carry attributes?",
          options: [
            "Classes, methods, functions, properties, parameters and class constants",
            "Classes and methods only",
            "Classes, methods and properties, but not parameters",
            "Any declaration except class constants",
          ],
          correctIndex: 0,
          explanation:
            "`getAttributes()` exists on all of those reflection types, which is why attribute-driven dependency injection can annotate a single constructor parameter. PHP 8.5 additionally allows attributes on compile-time constants declared outside a class.",
        },
        {
          id: "php-modern-attributes-q10",
          prompt:
            "A colleague writes `#[Loggable]` but forgets to create the `Loggable` class. When does this break?",
          options: [
            "Only when something calls `newInstance()` on that attribute",
            "Immediately, at parse time",
            "When the class is autoloaded",
            "When `getAttributes()` is called, which triggers autoloading",
          ],
          correctIndex: 0,
          explanation:
            "Attribute names are not resolved until instantiation, so a non-existent attribute class is invisible until some code asks for an instance. That laziness is deliberate — it lets you annotate with attributes from optional packages.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "php-modern-first-class-callables",
      moduleId: "php-modern",
      trackId: "php",
      title: "First-Class Callables and the Pipe Operator",
      summary:
        "PHP's old callable syntax was a set of conventions rather than a type: the string `'strlen'`, the array `[$obj, 'method']`, the string `'Foo::bar'`. None of them are statically analysable, none of them survive a rename refactor, and all of them resolve visibility at the *call* site rather than where they were written. First-class callable syntax — `strlen(...)`, `$this->handle(...)`, `Foo::make(...)` — fixes all three by producing a real `Closure` with the semantics of `Closure::fromCallable()`, capturing the scope where it was acquired. A private method handed out as `$this->privateMethod(...)` stays callable from outside; the array form does not.\n\nPHP 8.5's pipe operator builds directly on that. `$value |> f(...) |> g(...)` is exactly `g(f($value))` read left to right, which matters most for the deeply nested standard-library calls PHP is notorious for. The right-hand side must evaluate to a callable that takes a single parameter; anything with a second required parameter fails exactly as if you had called it with too few arguments, and a by-reference parameter is rejected outright — so `sort(...)` can never appear in a pipe.\n\nThe friction, and the reason the feature was contentious, is that PHP's own array functions take the array in different positions and in different orders. `array_map` wants the callback first, `array_filter` wants it second, so both need an arrow-function wrapper in a pipe — and arrow functions must be parenthesised there, or you get a fatal error. Piping is genuinely nice for string and scalar transformation chains and awkward for collection work, which is the honest summary.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: First class callable syntax", url: "https://www.php.net/manual/en/functions.first_class_callable_syntax.php", kind: "docs" },
        { label: "PHP Manual: Functional Operators (the pipe operator)", url: "https://www.php.net/manual/en/language.operators.functional.php", kind: "docs" },
        { label: "PHP RFC: Pipe operator v3", url: "https://wiki.php.net/rfc/pipe-operator-v3", kind: "spec" },
        { label: "PHP.Watch: First-class callable syntax", url: "https://php.watch/versions/8.1/first-class-callable-syntax", kind: "article" },
      ],
      video: {
        title: "An overview of PHP 8.5's pipe operator",
        channel: "PHP Annotated",
        url: "https://www.youtube.com/watch?v=UG_yb_WOutE",
        videoId: "UG_yb_WOutE",
        durationLabel: "11:56",
      },
      alternateVideos: [
        {
          title: "PHP 8.5 Is Going to Be Insane: The Pipe Operator 🔥",
          channel: "nunomaduro",
          url: "https://www.youtube.com/watch?v=mNWA0N2mCFM",
          videoId: "mNWA0N2mCFM",
          durationLabel: "9:20",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-modern-first-class-callables-q1",
          prompt: "What is the type of `$f` after `$f = strlen(...);`?",
          options: ["`Closure`", "`callable`", "`string`", "`ReflectionFunction`"],
          correctIndex: 0,
          explanation:
            "First-class callable syntax produces a `Closure` object — the same thing `Closure::fromCallable('strlen')` returns. `callable` is a type declaration, not a runtime class.",
        },
        {
          id: "php-modern-first-class-callables-q2",
          prompt:
            "What happens when this runs?\n\n```php\nclass Foo {\n    public function get(): callable { return [$this, 'secret']; }\n    private function secret(): string { return 'shh'; }\n}\n$fn = (new Foo())->get();\necho $fn();\n```",
          options: [
            "A fatal error: the private method is called from global scope",
            "It prints `shh`",
            "It prints nothing and returns `null`",
            "A `TypeError`, because an array is not a `callable`",
          ],
          correctIndex: 0,
          explanation:
            "Array callables resolve visibility where they are *invoked*, so calling it outside the class fails. Returning `$this->secret(...)` instead captures the scope where it was created and works.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-first-class-callables-q3",
          prompt: "Which of these are valid first-class callable expressions? (Select all that apply.)",
          options: [
            "`$obj->method(...)`",
            "`Foo::staticMethod(...)`",
            "`$invokableObject(...)`",
            "`new Foo(...)`",
            "`$obj?->method(...)`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that can be directly called works, including an object with `__invoke`. `new Foo()` is not a call, and combining `(...)` with the nullsafe operator is a compile-time error because the result would have to be conditionally a closure.",
        },
        {
          id: "php-modern-first-class-callables-q4",
          prompt: "What is `$result` after `$result = \"  Oyelabs \" |> trim(...) |> strtoupper(...);`?",
          options: ["`\"OYELABS\"`", "`\"  OYELABS \"`", "`\"oyelabs\"`", "A fatal error — `trim` takes two parameters"],
          correctIndex: 0,
          explanation:
            "Pipes are read left to right: the string is trimmed, then upper-cased, so this is `strtoupper(trim(\"  Oyelabs \"))`. `trim`'s second parameter is optional, so it is a valid single-parameter pipe target.",
        },
        {
          id: "php-modern-first-class-callables-q5",
          prompt: "Why is `$numbers |> sort(...)` rejected by the pipe operator?",
          options: [
            "`sort()` takes its array by reference, and by-reference parameters are not allowed on the right of `|>`",
            "`sort()` returns `bool`, and pipes require a non-boolean return",
            "`sort()` is an internal function, and pipes only accept userland functions",
            "It is allowed, but it silently discards the sorted result",
          ],
          correctIndex: 0,
          explanation:
            "The right-hand side must be a callable whose single parameter is passed by value. Functions that mutate an argument by reference are rejected, which rules out the whole `sort`/`shuffle` family.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-first-class-callables-q6",
          prompt:
            "Which of these compiles?\n\n```php\n// A\n$r = $items |> fn($x) => array_map(strtoupper(...), $x);\n// B\n$r = $items |> (fn($x) => array_map(strtoupper(...), $x));\n```",
          options: [
            "Only B — an arrow function on the right of a pipe must be parenthesised",
            "Only A — the parentheses in B make it a call, not a callable",
            "Both compile and behave identically",
            "Neither — `array_map` cannot appear inside a pipe",
          ],
          correctIndex: 0,
          explanation:
            "Without parentheses the parser cannot tell where the arrow function's body ends, so PHP requires them and emits a fatal error otherwise. It is the most common papercut when piping into `array_map` or `array_filter`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-first-class-callables-q7",
          prompt: "What happens if the right-hand side of a pipe is a function with two *required* parameters, e.g. `$x |> str_repeat(...)`?",
          options: [
            "An `ArgumentCountError`, exactly as if the function had been called with one argument",
            "A compile-time error when the file is parsed",
            "The second parameter receives `null`",
            "The pipe returns the callable itself, curried",
          ],
          correctIndex: 0,
          explanation:
            "The pipe is not currying: it simply calls the callable with one argument. A missing required argument fails the same way it always does.",
        },
        {
          id: "php-modern-first-class-callables-q8",
          prompt: "What is the practical advantage of `$this->handle(...)` over `'App\\\\Jobs\\\\Handler::handle'` as a callable?",
          options: [
            "It is a real reference the IDE and static analyser can follow and rename",
            "It is faster, because no string parsing happens at call time",
            "It allows the method to be called with named arguments",
            "It binds `$this` lazily, so the object can be swapped later",
          ],
          correctIndex: 0,
          explanation:
            "The point of the syntax is that it is ordinary code: tooling resolves it, renames follow it and a typo is a compile error. String callables are opaque to every tool you own.",
        },
        {
          id: "php-modern-first-class-callables-q9",
          prompt: "Which PHP version first allowed a first-class callable in a constant expression, such as an attribute argument or a property default?",
          options: ["8.5", "8.1, the same release that introduced the syntax", "8.3", "It is still not allowed"],
          correctIndex: 0,
          explanation:
            "The syntax arrived in 8.1 but only for runtime expressions. PHP 8.5 extended closures and first-class callables to constant expressions, which is what lets an attribute take a callable argument.",
        },
        {
          id: "php-modern-first-class-callables-q10",
          prompt:
            "Rewrite `array_sum(array_map(fn($o) => $o->total, $orders))` as a pipe. Which is correct?",
          options: [
            "`$orders |> (fn($x) => array_map(fn($o) => $o->total, $x)) |> array_sum(...)`",
            "`$orders |> array_map(fn($o) => $o->total) |> array_sum(...)`",
            "`$orders |> array_map(...) |> array_sum(...)`",
            "`array_sum(...) |> array_map(...) |> $orders`",
          ],
          correctIndex: 0,
          explanation:
            "`array_map` takes the callback first and the array second, so it has to be wrapped in a parenthesised arrow function that puts the piped value in the right slot. This is the awkwardness the pipe operator does not remove.",
        },
      ],
    },
    {
      id: "php-modern-readonly-dnf",
      moduleId: "php-modern",
      trackId: "php",
      title: "readonly Classes and DNF Types (PHP 8.2)",
      summary:
        "PHP 8.1 gave properties a `readonly` modifier; 8.2 let you put it on the class. `readonly class Money {}` marks every declared property readonly and, more usefully, hard-blocks dynamic properties — attempting to opt back in with `#[\\AllowDynamicProperties]` is a compile-time error. That turns a value object from a convention enforced by code review into something the engine enforces, and it removes the per-property boilerplate that made value objects tedious to write.\n\nThe constraints follow from readonly properties rather than being new: a readonly class may only declare typed properties (use `mixed` when you genuinely cannot narrow it), may not declare static properties at all, and may only be extended by another readonly class. That last rule is the one people trip over — `readonly` is a promise about the whole object graph, so a mutable subclass would break it. Traits, interfaces and enums cannot be declared readonly at all.\n\nAlongside it, 8.2 finished the type system's long march by allowing disjunctive normal form types: a union whose members may be intersections, written `(Countable&ArrayAccess)|null`. DNF is a real restriction, not just notation — the union must be on the outside. `(A|B)&C` is invalid, and so are redundant parentheses. 8.2 also made `null`, `false` and `true` usable as standalone types. The practical payoff is being able to type \"a collection-ish object, or nothing\" honestly, instead of widening to `mixed` and documenting the truth in a docblock.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: Classes and Objects — readonly classes", url: "https://www.php.net/manual/en/language.oop5.basic.php", kind: "docs" },
        { label: "PHP.Watch: readonly Classes", url: "https://php.watch/versions/8.2/readonly-classes", kind: "article" },
        { label: "PHP RFC: Disjunctive Normal Form Types", url: "https://wiki.php.net/rfc/dnf_types", kind: "spec" },
        { label: "PHP.Watch: DNF Types", url: "https://php.watch/versions/8.2/dnf-types", kind: "article" },
      ],
      video: {
        title: "PHP Is Not Dead - Let's Review PHP 8.2 Changes",
        channel: "Program With Gio",
        url: "https://www.youtube.com/watch?v=1c00s84VZjE",
        videoId: "1c00s84VZjE",
        startSeconds: 224,
        chapterLabel: "New Feature: Type System Improvements",
        durationLabel: "14:19",
      },
      alternateVideos: [
        {
          title: "Readonly classes in PHP 8.2",
          channel: "PHP Annotated",
          url: "https://www.youtube.com/watch?v=2cyJq08q6xE",
          videoId: "2cyJq08q6xE",
          durationLabel: "3:15",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-modern-readonly-dnf-q1",
          prompt:
            "What does marking a class `readonly` do?\n\n```php\nreadonly class Money {\n    public function __construct(public int $amount, public string $currency) {}\n}\n```",
          options: [
            "Makes every declared property readonly and forbids dynamic properties",
            "Makes every property and method final",
            "Makes the class immutable, so `clone` is also blocked",
            "Only documents intent — the modifier has no runtime effect on properties",
          ],
          correctIndex: 0,
          explanation:
            "The modifier is distributed to every declared property and additionally blocks dynamic properties outright. Methods are untouched, and cloning still works.",
        },
        {
          id: "php-modern-readonly-dnf-q2",
          prompt: "Which of these declarations are rejected inside a `readonly class`? (Select all that apply.)",
          options: [
            "`public $bar;` — an untyped property",
            "`public static int $count = 0;` — a static property",
            "`#[\\AllowDynamicProperties]` on the class",
            "`public readonly int $id;` — an explicitly readonly property",
            "`public const RATE = 0.2;` — a class constant",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Readonly properties must be typed and cannot be static, so a readonly class inherits both restrictions; `#[\\AllowDynamicProperties]` is a fatal error there. Re-stating `readonly` on a property is redundant but legal, and constants are unaffected.",
        },
        {
          id: "php-modern-readonly-dnf-q3",
          prompt: "`readonly class Base {}` exists. What must `class Child extends Base {}` look like?",
          options: [
            "`readonly class Child extends Base {}` — the child must also be readonly",
            "Anything: readonly is not inherited",
            "It cannot extend at all; readonly classes are implicitly final",
            "It must be readonly *and* final",
          ],
          correctIndex: 0,
          explanation:
            "A child may not opt out of readonly, because that would let it add mutable state to something callers were told was immutable. Readonly classes are not implicitly final — a readonly child is fine.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-readonly-dnf-q4",
          prompt:
            "What is the result?\n\n```php\nclass Config {\n    public function __construct(public readonly array $items) {}\n    public function add(string $k, string $v): void { $this->items[$k] = $v; }\n}\n(new Config([]))->add('a', 'b');\n```",
          options: [
            "An `Error`: cannot modify readonly property `Config::$items`",
            "It works — readonly only blocks reassigning the whole property",
            "It works, but silently discards the write",
            "A `TypeError` on the array append",
          ],
          correctIndex: 0,
          explanation:
            "Writing to an array offset is an indirect modification of the property, and readonly blocks that too. To \"change\" a readonly array you must build a new object with the new array.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-readonly-dnf-q5",
          prompt: "Which of these type declarations is valid in PHP 8.2+?",
          options: [
            "`(Countable&ArrayAccess)|null`",
            "`(Countable|ArrayAccess)&Traversable`",
            "`(Countable)&ArrayAccess`",
            "`Countable&(ArrayAccess|null)`",
          ],
          correctIndex: 0,
          explanation:
            "DNF means the union is on the outside and intersections are the members. Putting a union inside an intersection is not DNF, and redundant parentheses around a single type are rejected.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-readonly-dnf-q6",
          prompt: "What did PHP 8.2 add to the type system besides DNF?",
          options: [
            "`null`, `false` and `true` as standalone types",
            "Generics for classes and arrays",
            "Typed class constants",
            "Intersection types",
            "The `never` return type",
          ],
          correctIndex: 0,
          explanation:
            "8.2 allowed `null` and `false` standalone and added `true`. Intersection types and `never` came in 8.1, typed class constants in 8.3, and PHP still has no generics.",
        },
        {
          id: "php-modern-readonly-dnf-q7",
          prompt: "Where can a readonly property be initialised?",
          options: [
            "Only from inside the scope of the class that declares it, and only once",
            "Anywhere, until the constructor returns",
            "Only in the constructor, by the `__construct` method itself",
            "Anywhere, as long as the property is still uninitialised",
          ],
          correctIndex: 0,
          explanation:
            "Initialisation is scope-limited, not constructor-limited: any method of the declaring class may set it once. A factory method on the same class can therefore fill it, but nothing outside the class can.",
        },
        {
          id: "php-modern-readonly-dnf-q8",
          prompt: "PHP 8.3 relaxed one readonly restriction. Which?",
          options: [
            "Readonly properties can be reinitialised inside `__clone()`, enabling `withX()` copy methods",
            "Readonly properties can be modified from a child class",
            "Readonly classes may declare static properties",
            "Readonly properties no longer need a type declaration",
          ],
          correctIndex: 0,
          explanation:
            "8.3 allowed reinitialisation during cloning and readonly anonymous classes, which made the wither pattern possible. PHP 8.5's `clone()` function later made the same thing a one-liner.",
        },
        {
          id: "php-modern-readonly-dnf-q9",
          prompt: "Why does a readonly class block dynamic properties rather than just deprecating them?",
          options: [
            "A dynamic property would be mutable state on an object the type system promises is immutable",
            "Dynamic properties cannot be typed, and readonly requires types",
            "Dynamic properties break `serialize()` on readonly objects",
            "It is purely for performance: the engine can skip the property-table lookup",
          ],
          correctIndex: 0,
          explanation:
            "The guarantee only holds if there is no way to add state after construction, so the class-level modifier upgrades the 8.2 dynamic-property deprecation to a hard error for these classes.",
        },
        {
          id: "php-modern-readonly-dnf-q10",
          prompt: "Which of these can be declared `readonly`? (Select all that apply.)",
          options: [
            "A class",
            "An abstract class",
            "An anonymous class (PHP 8.3+)",
            "An interface",
            "A trait",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`abstract readonly class` and `final readonly class` are both legal, and 8.3 added readonly anonymous classes. Interfaces and traits declare no properties of their own, so `readonly interface` and `readonly trait` are parse errors.",
        },
      ],
    },
    {
      id: "php-modern-builtin-attributes",
      moduleId: "php-modern",
      trackId: "php",
      title: "#[\\Override], #[\\Deprecated] and #[\\NoDiscard]",
      summary:
        "Three attributes PHP ships itself turn conventions that used to live in docblocks into things the engine checks. `#[\\Override]` (8.3) says \"this member is meant to override a parent or implement an interface\" and produces a compile-time fatal error when it does not — which is what catches the class of bug where a parent renames a hook method and every child silently becomes dead code. PHP 8.5 extended it from methods to properties. It cannot be used on `__construct()`, which is exempt from signature checks anyway.\n\n`#[\\Deprecated(message:, since:)]` (8.4) gives userland the same deprecation mechanism PHP uses internally: calling the marked function emits a diagnostic that your existing error handler, logger and test suite already understand. Note the level — it is `E_USER_DEPRECATED`, not `E_DEPRECATED`, so error-reporting masks that filter one do not necessarily filter the other. 8.5 extended it to traits and to compile-time constants.\n\n`#[\\NoDiscard]` (8.5) warns when a return value is thrown away, for the functions where ignoring the result is almost always a bug — a `withX()` that returns a new immutable object, a batch operation returning per-item errors. `(void)` casts the call to say the discard is intentional. The subtlety worth knowing: the attribute applies to the declaration actually invoked, so putting it on an interface or abstract method does *not* make implementations warn, while a method pulled in from a trait keeps it, because trait methods are copied into the using class. And because unknown attributes are inert, adding `#[\\NoDiscard]` is safe in a library that still supports 8.4.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "PHP Manual: The Override attribute", url: "https://www.php.net/manual/en/class.override.php", kind: "docs" },
        { label: "PHP Manual: The Deprecated attribute", url: "https://www.php.net/manual/en/class.deprecated.php", kind: "docs" },
        { label: "PHP Manual: The NoDiscard attribute", url: "https://www.php.net/manual/en/class.nodiscard.php", kind: "docs" },
        { label: "PHP.Watch: #[\\Override] attribute", url: "https://php.watch/versions/8.3/override-attr", kind: "article" },
      ],
      video: {
        title: "Readonly clones, #[Override], and json_validate: what's new in PHP 8.3",
        channel: "PHP Annotated",
        url: "https://www.youtube.com/watch?v=nJFsD0bnlTI",
        videoId: "nJFsD0bnlTI",
        durationLabel: "5:22",
      },
      alternateVideos: [
        {
          title: "What’s New in PHP 8.5? (Release Date + Must-Know Features)",
          channel: "PHP Architect",
          url: "https://www.youtube.com/watch?v=Wmsy2O_WysA",
          videoId: "Wmsy2O_WysA",
          startSeconds: 218,
          chapterLabel: "#[\\NoDiscard] Attribute",
          durationLabel: "8:22",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-modern-builtin-attributes-q1",
          prompt:
            "What happens here?\n\n```php\nclass Base { protected function handle(): void {} }\nfinal class Child extends Base {\n    #[\\Override]\n    protected function handel(): void {}\n}\n```",
          options: [
            "A fatal error at compile time: no matching parent method exists",
            "Nothing — the attribute is only read by static analysers",
            "A deprecation notice when `handel()` is first called",
            "A `ReflectionException` when the class is reflected over",
          ],
          correctIndex: 0,
          explanation:
            "`#[\\Override]` is enforced by the engine when the class is compiled, so the typo fails immediately. This is unusual — most attributes do nothing until something reflects over them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-builtin-attributes-q2",
          prompt: "Which member can `#[\\Override]` never be applied to?",
          options: [
            "`__construct()`",
            "A method implementing an interface",
            "A protected method overriding a protected parent method",
            "A property, on PHP 8.5+",
          ],
          correctIndex: 0,
          explanation:
            "Constructors are exempt from signature checks in PHP, so the attribute is disallowed there. Interface implementations are a legitimate target, and 8.5 added properties.",
        },
        {
          id: "php-modern-builtin-attributes-q3",
          prompt: "What diagnostic level does `#[\\Deprecated]` emit when the marked function is called?",
          options: ["`E_USER_DEPRECATED`", "`E_DEPRECATED`", "`E_USER_NOTICE`", "`E_WARNING`"],
          correctIndex: 0,
          explanation:
            "Userland deprecations use `E_USER_DEPRECATED`; only PHP's own deprecations use `E_DEPRECATED`. An `error_reporting` mask that excludes just one of the two will still show the other.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-builtin-attributes-q4",
          prompt:
            "Given `#[\\NoDiscard] function validate(array $rows): array {}`, which of these avoid the warning on PHP 8.5? (Select all that apply.)",
          options: [
            "`$errors = validate($rows);`",
            "`if (validate($rows)) { /* ... */ }`",
            "`(void) validate($rows);`",
            "`validate($rows);`",
            "`validate($rows); // discard is intentional`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Assigning the value, using it in a condition and casting the call to `(void)` all count. A bare call still warns, and a comment is not a language construct — `(void)` exists precisely so the intent is expressed in code.",
        },
        {
          id: "php-modern-builtin-attributes-q5",
          prompt:
            "An interface method is marked `#[\\NoDiscard]`. A class implements it without repeating the attribute, and a caller discards the return value of the implementation. What happens?",
          options: [
            "No warning — the attribute applies to the declaration that is actually invoked",
            "A warning, because the attribute is inherited from the interface",
            "A fatal error: `#[\\NoDiscard]` may not be used on interface methods",
            "A warning only when the value is discarded through the interface type",
          ],
          correctIndex: 0,
          explanation:
            "`#[\\NoDiscard]` is not inherited by overriding or implementing methods, so it has to be repeated on each implementation. A method copied in from a trait does keep it, because trait methods are compiled as if declared in the using class.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-builtin-attributes-q6",
          prompt: "A library supports PHP 8.3 and above. Is it safe to add `#[\\NoDiscard]` to its methods?",
          options: [
            "Yes — unknown attributes are inert, so it simply does nothing below 8.5",
            "No — the attribute class does not exist below 8.5, so the file fails to compile",
            "Only if the attribute is written as `#[\\NoDiscard]` with a leading backslash",
            "Only behind a `PHP_VERSION_ID` check, since attributes are evaluated at compile time",
          ],
          correctIndex: 0,
          explanation:
            "Attributes are designed to be backward compatible: an attribute whose class does not exist is never instantiated and never complains. On 8.5 it starts warning; below that it is a comment with syntax.",
        },
        {
          id: "php-modern-builtin-attributes-q7",
          prompt: "What do the `message` and `since` arguments of `#[\\Deprecated]` do?",
          options: [
            "Both are folded into the emitted deprecation message; `since` is a free-form string PHP does not validate",
            "`since` is validated as a semantic version and compared against the current release",
            "They are metadata only, readable via reflection but never shown at runtime",
            "`message` replaces the default text and `since` suppresses the notice until that version",
          ],
          correctIndex: 0,
          explanation:
            "They exist to make the runtime message useful — \"deprecated since 1.5, use safeReplacement() instead\". PHP does not interpret `since`; its own deprecations just happen to use a `Major.Minor` string.",
        },
        {
          id: "php-modern-builtin-attributes-q8",
          prompt: "Which problem does `#[\\Override]` solve that a static analyser alone does not?",
          options: [
            "It fails the build for everyone at compile time, including in environments that never run the analyser",
            "It prevents the parent method from being renamed",
            "It makes the child method's signature covariant automatically",
            "It registers the method with the parent class for late static binding",
          ],
          correctIndex: 0,
          explanation:
            "The value is that the check is in the language, so it holds in CI, in production and in a colleague's editor with no configuration. It does not change dispatch or signatures in any way.",
        },
        {
          id: "php-modern-builtin-attributes-q9",
          prompt: "Which is the best candidate for `#[\\NoDiscard]`?",
          options: [
            "`public function withTimeout(int $s): static` on an immutable request object",
            "`public function setTimeout(int $s): void` on a mutable config object",
            "`public function log(string $msg): bool` where the bool is a best-effort status",
            "`public function __toString(): string`",
          ],
          correctIndex: 0,
          explanation:
            "A wither returns a new object and changes nothing in place, so discarding the result is always a bug — the textbook case. A best-effort status is exactly the kind of return people legitimately ignore.",
        },
      ],
    },
    {
      id: "php-modern-property-hooks",
      moduleId: "php-modern",
      trackId: "php",
      title: "Property Hooks (PHP 8.4)",
      summary:
        "Property hooks let a property carry `get` and `set` logic without becoming a method call at the call site. The problem they solve is a design tax PHP developers have paid for twenty years: because a public property could never later grow behaviour, the defensive move was to make everything private and write `getX()`/`setX()` pairs up front, just in case. Hooks remove the \"just in case\" — you can expose a plain public property now and add validation later without changing a single caller.\n\nThe distinction that matters is backed versus virtual. A property whose hooks reference `$this->foo` by that exact syntax is *backed*: real storage exists behind the hook. A property whose hooks never touch it is *virtual* and occupies no space at all — `public int $area { get => $this->w * $this->h; }` is a computed value that reads like a field. Hooks also participate in inheritance like methods: a child can override just the `set`, declare a hook `final`, and reach the parent's storage with `parent::$prop::get()`. If a child adds hooks to a property, any default value on the parent's declaration is dropped and must be redeclared.\n\nTwo gotchas. Hooks are incompatible with `readonly` — if you want \"readable by everyone, writable by me\", that is asymmetric visibility, not a hook. And serialisation is inconsistent on purpose: `json_encode()`, `var_export()` and `get_object_vars()` read *through* the `get` hook, while `var_dump()`, `serialize()`, an `(array)` cast and `get_mangled_object_vars()` read the raw backing value. A virtual property therefore appears in your JSON and vanishes from your `var_dump`.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "PHP Manual: Property Hooks", url: "https://www.php.net/manual/en/language.oop5.property-hooks.php", kind: "docs" },
        { label: "PHP RFC: Property Hooks", url: "https://wiki.php.net/rfc/property-hooks", kind: "spec" },
        { label: "stitcher.io: What's new in PHP 8.4", url: "https://stitcher.io/blog/new-in-php-84", kind: "article" },
      ],
      video: {
        title: "PHP 8.4 with Sabatino & Brent (Property hooks, Asymmetric visibility, Lazy objects and more)",
        channel: "Sabatino Develops",
        url: "https://www.youtube.com/watch?v=NrpPs52OwBM",
        videoId: "NrpPs52OwBM",
        startSeconds: 1090,
        chapterLabel: "Property Hooks",
        durationLabel: "1:13:40",
      },
      alternateVideos: [
        {
          title: "Property hooks in PHP 8.4",
          channel: "PHP Annotated",
          url: "https://www.youtube.com/watch?v=Y4B9QK1rXSM",
          videoId: "Y4B9QK1rXSM",
          durationLabel: "4:18",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-modern-property-hooks-q1",
          prompt:
            "Is `$fullName` backed or virtual?\n\n```php\nclass Person {\n    public string $first;\n    public string $last;\n    public string $fullName {\n        get => $this->first . ' ' . $this->last;\n    }\n}\n```",
          options: [
            "Virtual — neither hook references `$this->fullName`, so no storage is allocated",
            "Backed — every declared property has storage",
            "Backed, but the storage is only allocated on first read",
            "Virtual, but only because it has no `set` hook",
          ],
          correctIndex: 0,
          explanation:
            "A property is backed only if one of its hooks refers to the property itself by exact syntax. This one reads two other properties, so it is a computed value with no backing slot.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-property-hooks-q2",
          prompt: "Can a property be both `readonly` and have hooks?",
          options: [
            "No — hooks and `readonly` are incompatible; use asymmetric visibility instead",
            "Yes, but only a `get` hook is allowed",
            "Yes, and the `set` hook runs once during construction",
            "Only on virtual properties, which have nothing to write",
          ],
          correctIndex: 0,
          explanation:
            "The manual is explicit that the two features do not combine. If the goal is \"anyone can read, only the class can write\", that is `public private(set)`, which composes fine with hooks.",
        },
        {
          id: "php-modern-property-hooks-q3",
          prompt:
            "Which of these read a hooked property *through* its `get` hook rather than from the raw backing value? (Select all that apply.)",
          options: [
            "`json_encode($obj)`",
            "`get_object_vars($obj)`",
            "`var_export($obj)`",
            "`var_dump($obj)`",
            "`(array) $obj`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`json_encode`, `var_export` and `get_object_vars` go through the hook; `var_dump`, `serialize`, array casting and `get_mangled_object_vars` all read raw storage. That is why a virtual property shows up in JSON but not in a `var_dump`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-property-hooks-q4",
          prompt:
            "What does this print?\n\n```php\nclass Example {\n    public string $name = 'default' {\n        set => strtoupper($value);\n    }\n}\n$e = new Example();\n$e->name = 'oyelabs';\necho $e->name;\n```",
          options: ["`OYELABS`", "`oyelabs`", "`default`", "A fatal error: the `set` hook has no explicit parameter"],
          correctIndex: 0,
          explanation:
            "When the `set` parameter type matches the property type it may be omitted and is named `$value`; the arrow form writes whatever the expression evaluates to into the backing value. There is no `get` hook, so reading returns that stored value.",
        },
        {
          id: "php-modern-property-hooks-q5",
          prompt: "A property is declared `public string $email`. What types may its `set` hook accept?",
          options: [
            "`string`, or a wider type such as `string|Stringable`",
            "Only `string` — the hook parameter must match exactly",
            "Any type, including narrower ones such as a specific enum",
            "Only `mixed`, since hooks are typed dynamically",
          ],
          correctIndex: 0,
          explanation:
            "The set hook's parameter must be the property type or contravariant (wider) to it, so it can normalise a broader input into the declared type. Narrowing would let a valid assignment be rejected.",
        },
        {
          id: "php-modern-property-hooks-q6",
          prompt:
            "A promoted constructor property declares `public DateTimeInterface $created { set(string|DateTimeInterface $value) { ... } }`. What can the *constructor* accept for that parameter?",
          options: [
            "Only `DateTimeInterface` — the constructor parameter uses the property's declared type",
            "`string|DateTimeInterface`, matching the set hook",
            "`mixed`, because promotion erases the type",
            "Nothing — hooks cannot be used with constructor promotion",
          ],
          correctIndex: 0,
          explanation:
            "Promotion decomposes into a property plus a constructor parameter typed as the *property*, regardless of what the hook widens to. If you need the wider constructor signature, you cannot use promotion here.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-property-hooks-q7",
          prompt: "How does a child class run the parent's hook for the same property?",
          options: [
            "`parent::$prop::get()` or `parent::$prop::set($value)`",
            "`parent::$prop`",
            "`parent->$prop`",
            "It cannot — hooks are always fully replaced by the child",
          ],
          correctIndex: 0,
          explanation:
            "Hooks behave like methods: overriding replaces the parent's implementation unless you call it explicitly with that syntax, which also reaches the parent's storage. Hooks may only access their own parent hook on their own property.",
        },
        {
          id: "php-modern-property-hooks-q8",
          prompt:
            "`class Point { public int $x = 10; }` and `class Positive extends Point { public int $x { set { /* validate */ $this->x = $value; } } }`. What is `(new Positive())->x`?",
          options: [
            "Uninitialised — adding hooks in the child drops the parent's default value",
            "`10` — the default is inherited with the property",
            "`0` — integer properties default to zero once hooked",
            "A fatal error: a child cannot add hooks to a hook-less property",
          ],
          correctIndex: 0,
          explanation:
            "Redeclaring a property to add hooks removes any default from the parent declaration; it has to be restated in the child. Adding hooks to a previously hook-less property is otherwise perfectly legal.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-property-hooks-q9",
          prompt: "Why does a hooked property need `&get` before you can write to one of its array elements?",
          options: [
            "Writing `$obj->arr['k'] = 1` needs a reference, which would bypass the `set` hook unless `get` returns by reference",
            "Because array properties are copy-on-write and hooks disable that",
            "Because `set` hooks cannot receive array values",
            "It does not — array element writes always work on hooked properties",
          ],
          correctIndex: 0,
          explanation:
            "Indirect modification requires a reference to the underlying value, and handing one out would let callers write around the `set` hook. So a backed array property with hooks may only be written element-wise if it defines `&get` — and `&get` plus `set` on a backed property is disallowed for the same reason.",
        },
        {
          id: "php-modern-property-hooks-q10",
          prompt: "What is the main design argument for hooks over conventional getters and setters?",
          options: [
            "A public property can gain behaviour later without any caller changing, so the defensive getter/setter pair is no longer needed up front",
            "They are faster, because hooks are inlined by the JIT",
            "They allow properties to be declared in interfaces for the first time",
            "They make properties lazily evaluated by default",
          ],
          correctIndex: 0,
          explanation:
            "The whole point is that the public API — `$user->email` — never has to change when the implementation grows. Nothing about hooks is about speed, and they are not lazy.",
        },
        {
          id: "php-modern-property-hooks-q11",
          prompt: "Which of these are true about hooks? (Select all that apply.)",
          options: [
            "A hook body runs in the object's scope and may call private methods",
            "A hook may be declared `final` so a child cannot override it",
            "Reading another hooked property from inside a hook still goes through that property's hooks",
            "Hooks are available on static properties too",
            "Defining both `get` and `&get` on the same property is allowed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Hooks are scoped like methods, can be final, and do not bypass other properties' hooks. They exist only on non-static properties, and `get` together with `&get` on one property is a syntax error.",
        },
      ],
    },
    {
      id: "php-modern-write-control",
      moduleId: "php-modern",
      trackId: "php",
      title: "Asymmetric Visibility and Clone-With",
      summary:
        "Asymmetric visibility (PHP 8.4) separates who may read a property from who may write it: `public private(set) string $status` is readable everywhere and writable only inside the declaring class. It fills the gap between a public property, which anyone can corrupt, and `readonly`, which nobody can change after construction — the very common case of an entity whose fields change over its lifetime but only through its own methods. It also removes a pile of getters whose sole job was to expose a private field.\n\nThe rules are small but sharp. Only typed properties may use it. The set visibility must be the same as or narrower than the get visibility, so `protected public(set)` is a syntax error. `public private(set)` and bare `private(set)` mean the same thing. A `private(set)` property is implicitly **final** and cannot be redeclared by a child at all. And because a reference can be used to write, taking `&$obj->prop` is checked against the *set* visibility, not the get one — as is writing to an array element of the property, which involves both operations. PHP 8.5 extended asymmetric visibility to static properties.\n\nThe partner feature is PHP 8.5's `clone()` *function*, which takes a second `withProperties` array: `clone($this, ['x' => $x])`. It turns the wither pattern into one line, and crucially it can overwrite `readonly` properties on the copy even when they were already initialised on the original. The order matters — the overrides are applied *after* `__clone()` has run, so a `__clone()` that deep-copies a property cannot then be second-guessed by an override of the same name. Visibility is still enforced, so you cannot reach into another object's private state this way.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "PHP Manual: Visibility (asymmetric property visibility)", url: "https://www.php.net/manual/en/language.oop5.visibility.php", kind: "docs" },
        { label: "PHP Manual: Object Cloning (cloning with property overrides)", url: "https://www.php.net/manual/en/language.oop5.cloning.php", kind: "docs" },
        { label: "PHP RFC: Asymmetric Visibility v2", url: "https://wiki.php.net/rfc/asymmetric-visibility-v2", kind: "spec" },
        { label: "PHP RFC: Clone with v2", url: "https://wiki.php.net/rfc/clone_with_v2", kind: "spec" },
      ],
      video: {
        title: "PHP 8.4 with Sabatino & Brent (Property hooks, Asymmetric visibility, Lazy objects and more)",
        channel: "Sabatino Develops",
        url: "https://www.youtube.com/watch?v=NrpPs52OwBM",
        videoId: "NrpPs52OwBM",
        startSeconds: 2607,
        chapterLabel: "Asymmetric Visibility",
        durationLabel: "1:13:40",
      },
      alternateVideos: [
        {
          title: "What’s New in PHP 8.5? (Release Date + Must-Know Features)",
          channel: "PHP Architect",
          url: "https://www.youtube.com/watch?v=Wmsy2O_WysA",
          videoId: "Wmsy2O_WysA",
          startSeconds: 276,
          chapterLabel: "Clone()",
          durationLabel: "8:22",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-modern-write-control-q1",
          prompt: "What does `public private(set) string $status;` mean?",
          options: [
            "Readable from anywhere, writable only from inside the declaring class",
            "Readable only inside the class, writable from anywhere",
            "Readable anywhere, writable anywhere, but only once",
            "Readable and writable inside the class hierarchy only",
          ],
          correctIndex: 0,
          explanation:
            "The first modifier is the get visibility and the one in parentheses is the set visibility. `private(set)` restricts writes to the declaring class — subclasses cannot write it either.",
        },
        {
          id: "php-modern-write-control-q2",
          prompt: "Which of these declarations are invalid? (Select all that apply.)",
          options: [
            "`protected public(set) string $name;`",
            "`private(set) $name;` — an untyped property",
            "`private( set ) string $name;`",
            "`public protected(set) string $name;`",
            "`private(set) string $name;`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Set visibility can only be the same or narrower, only typed properties qualify, and the parser does not allow whitespace inside `private(set)`. The last two are fine — and bare `private(set)` implies `public` for reads.",
        },
        {
          id: "php-modern-write-control-q3",
          prompt:
            "`class Order { public private(set) string $ref; }`. What happens in `class Rush extends Order { public protected(set) string $ref; }`?",
          options: [
            "A fatal error — a `private(set)` property is implicitly final and cannot be redeclared",
            "It works, widening the write access for subclasses",
            "It works, but the child gets a separate property with a mangled name",
            "A fatal error, because the child cannot widen set visibility at all",
          ],
          correctIndex: 0,
          explanation:
            "`private(set)` implies final: nothing may redeclare it. Widening set visibility is legal in general — a `protected(set)` property can become `public(set)` in a child — but not from `private(set)`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-write-control-q4",
          prompt:
            "Given `public private(set) array $tags;`, what happens when outside code runs `$order->tags[] = 'rush';`?",
          options: [
            "An `Error` — writing to an array element follows the set visibility",
            "It works, because reading `$order->tags` is public",
            "It works but modifies a copy, leaving the property unchanged",
            "A `TypeError`, because arrays cannot use asymmetric visibility",
          ],
          correctIndex: 0,
          explanation:
            "Appending involves both a get and a set internally, so the stricter set visibility applies. The same rule makes `&$order->tags` fail from outside the class.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-write-control-q5",
          prompt: "When should you prefer `public private(set)` over `readonly`?",
          options: [
            "When the value legitimately changes over the object's lifetime, but only through the object's own methods",
            "When the value must never change after construction",
            "When the property is untyped",
            "When the property is static, which `readonly` does not support",
          ],
          correctIndex: 0,
          explanation:
            "`readonly` is \"write once\"; asymmetric visibility is \"write as often as I like, but only I may do it\". An order whose `$status` moves through a workflow is the canonical case for the latter.",
        },
        {
          id: "php-modern-write-control-q6",
          prompt:
            "What does this print on PHP 8.5?\n\n```php\nclass Point {\n    public function __construct(public readonly int $x, public readonly int $y) {}\n    public function withX(int $x): static { return clone($this, ['x' => $x]); }\n}\n$p = new Point(1, 2);\necho $p->withX(10)->x, ' ', $p->x;\n```",
          options: ["`10 1`", "`10 10`", "`1 1`", "An `Error`: cannot modify readonly property"],
          correctIndex: 0,
          explanation:
            "`clone()` as a function may reinitialise readonly properties *on the copy*; the original is untouched. That is the whole point of the wither pattern.",
        },
        {
          id: "php-modern-write-control-q7",
          prompt: "In what order do `__clone()` and the `withProperties` overrides run?",
          options: [
            "`__clone()` runs first, then the overrides are applied to the copy",
            "The overrides are applied first, then `__clone()` runs and may change them",
            "They run in parallel; the order is unspecified",
            "`__clone()` is skipped entirely when `withProperties` is used",
          ],
          correctIndex: 0,
          explanation:
            "Overrides win, because they are applied after `__clone()`. If your `__clone()` deep-copies a property that is also overridden, the deep copy is discarded — worth knowing before combining the two.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-write-control-q8",
          prompt: "Can `clone($other, ['secret' => 'x'])` set a `private` property of `$other` from outside its class?",
          options: [
            "No — the function honours normal property visibility",
            "Yes — `clone()` bypasses visibility, like `ReflectionProperty::setValue()`",
            "Yes, but only for `readonly` properties",
            "Only if the property is declared with `private(set)`",
          ],
          correctIndex: 0,
          explanation:
            "Visibility is still enforced; `clone()` relaxes the readonly write-once rule for the copy, nothing more. Reaching into private state still requires reflection.",
        },
        {
          id: "php-modern-write-control-q9",
          prompt: "What did PHP 8.5 add to asymmetric visibility?",
          options: [
            "Support for static properties",
            "Support for untyped properties",
            "The ability to widen `private(set)` in a subclass",
            "Asymmetric visibility on class constants",
          ],
          correctIndex: 0,
          explanation:
            "8.4 shipped it for instance properties only; 8.5 extended it to statics, so a counter can be publicly readable and privately incremented. The other three remain disallowed.",
        },
        {
          id: "php-modern-write-control-q10",
          prompt: "Before 8.5, how did you write a `withX()` method on a class with `readonly` properties?",
          options: [
            "Construct a new instance passing every property through, or clone and reassign inside `__clone()` (PHP 8.3+)",
            "Mark the property `private(set)` and assign to it directly",
            "Use `ReflectionProperty::setValue()` on the clone",
            "It was impossible before 8.5",
          ],
          correctIndex: 0,
          explanation:
            "The usual answer was a constructor call listing every field — noisy and easy to get wrong when a field is added. PHP 8.3's readonly-reinitialisation-during-clone made a `__clone()`-based variant possible; 8.5 reduced both to one line.",
        },
      ],
    },
    {
      id: "php-modern-lazy-objects",
      moduleId: "php-modern",
      trackId: "php",
      title: "Lazy Objects (PHP 8.4)",
      summary:
        "Lazy objects move a trick every serious PHP framework already implemented into the engine. Doctrine generated proxy subclasses on disk to defer hydrating an entity; Symfony's container generated lazy service proxies the same way. Both approaches had the same failure modes: generated code that had to be regenerated, `final` classes that could not be proxied, and objects whose class name was not the class name you asked for. PHP 8.4 gives you `ReflectionClass::newLazyGhost()` and `newLazyProxy()` instead, with no code generation at all.\n\nA **ghost** initialises in place: the object is a real instance of the class from the start, and the first access to any property runs your initializer, which typically calls `$object->__construct(...)`. Afterwards it is indistinguishable from an object that was never lazy, so it can be handed to code that has no idea laziness exists. A **proxy** instead calls a factory that returns the real instance and forwards everything to it, which is what you need when you do not control instantiation — but the proxy and the real instance are two different objects, so anything comparing with `===` or using `SplObjectStorage` needs care.\n\nThe important detail is the trigger list, because it is not \"any use of the object\". Reading or writing a property, `foreach`, `get_object_vars()`, `serialize()` and cloning all initialise. Calling a method that never touches state does *not*. Neither does `var_dump()`, `get_mangled_object_vars()` or an `(array)` cast — which means a debugger view can show you an uninitialised object without initialising it, and `var_dump` output is not evidence of anything. If the initializer throws, the object is rolled back to its lazy state rather than being left half-built, and a ghost's destructor only runs if it was ever initialised.",
      level: "expert",
      estMinutes: 50,
      webRefs: [
        { label: "PHP Manual: Lazy Objects", url: "https://www.php.net/manual/en/language.oop5.lazy-objects.php", kind: "docs" },
        { label: "PHP Manual: ReflectionClass::newLazyGhost", url: "https://www.php.net/manual/en/reflectionclass.newlazyghost.php", kind: "docs" },
        { label: "PHP RFC: Lazy Objects", url: "https://wiki.php.net/rfc/lazy-objects", kind: "spec" },
      ],
      video: {
        title: "Lazy objects in PHP 8.4",
        channel: "PHP Annotated",
        url: "https://www.youtube.com/watch?v=rwp8_eWLDv8",
        videoId: "rwp8_eWLDv8",
        durationLabel: "34:37",
      },
      alternateVideos: [
        {
          title: "PHP 8.4: Lazy Objects Explained (So Cool!)",
          channel: "nunomaduro",
          url: "https://www.youtube.com/watch?v=7J6Z0F4vItw",
          videoId: "7J6Z0F4vItw",
          durationLabel: "5:07",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-modern-lazy-objects-q1",
          prompt: "What is the essential difference between a lazy ghost and a lazy proxy?",
          options: [
            "A ghost initialises itself in place; a proxy forwards to a separate real instance created by a factory",
            "A ghost is created by reflection, a proxy by a generated subclass",
            "A ghost defers only the constructor, a proxy defers property access as well",
            "A ghost works on internal classes, a proxy only on userland classes",
          ],
          correctIndex: 0,
          explanation:
            "The ghost *is* the object and hydrates itself; the proxy wraps another object. That is why a ghost is fully transparent afterwards while a proxy keeps a distinct identity.",
        },
        {
          id: "php-modern-lazy-objects-q2",
          prompt:
            "Which of these trigger initialisation of a lazy object? (Select all that apply.)",
          options: [
            "Reading a property",
            "`get_object_vars($obj)`",
            "Cloning the object",
            "`var_dump($obj)`",
            "`(array) $obj`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that observes or modifies state initialises, including `foreach`, `serialize()` and `clone`. `var_dump()`, `get_mangled_object_vars()` and array casting deliberately read raw storage so debugging does not change behaviour.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-lazy-objects-q3",
          prompt: "A lazy proxy is compared with its real instance using `===`. What is the result?",
          options: [
            "`false` — the proxy and the real instance are distinct objects",
            "`true` — the proxy is replaced by the real instance on initialisation",
            "`true`, because `===` on objects compares class and properties",
            "It throws, because identity comparison initialises the proxy first",
          ],
          correctIndex: 0,
          explanation:
            "The proxy object is never substituted; it forwards. This is the one place where proxies leak, and why ghosts are preferred whenever you control instantiation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-lazy-objects-q4",
          prompt: "Which classes can be made lazy?",
          options: [
            "Any user-defined class, plus `stdClass`",
            "Any class at all, including internal ones like `DateTime`",
            "Only non-final user-defined classes",
            "Only classes that implement a marker interface",
          ],
          correctIndex: 0,
          explanation:
            "Internal classes other than `stdClass` are unsupported because they can carry state the engine cannot defer. `final` is not a problem — unlike the generated-subclass approach it replaces.",
        },
        {
          id: "php-modern-lazy-objects-q5",
          prompt: "The initializer of a lazy ghost throws an exception. What state is the object left in?",
          options: [
            "Its pre-initialisation state — it is marked lazy again and can be retried",
            "Partially initialised, with whatever properties were set before the throw",
            "Fully initialised but with uninitialised typed properties",
            "Unusable: any further access throws the same exception",
          ],
          correctIndex: 0,
          explanation:
            "Effects on the object itself are rolled back, so callers never see a half-built instance. Side effects elsewhere — a row inserted, a file written — are of course not undone.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-lazy-objects-q6",
          prompt:
            "An ORM knows an entity's `id` before loading it. How does it expose `$post->id` without triggering a database round trip?",
          options: [
            "`ReflectionProperty::setRawValueWithoutLazyInitialization()` (or `skipLazyInitialization()` then `setValue()`)",
            "By declaring `id` as `readonly`, which is exempt from initialisation",
            "By making the initializer check which property was accessed",
            "It cannot — any property read initialises the object",
          ],
          correctIndex: 0,
          explanation:
            "Those two reflection methods exist exactly for known-in-advance identity columns. Note that if *every* property is marked non-lazy this way, the object counts as initialised.",
        },
        {
          id: "php-modern-lazy-objects-q7",
          prompt: "When is `__destruct()` called on a lazy ghost that is never touched?",
          options: [
            "Never — a ghost's destructor only runs if it was initialised",
            "Immediately when it goes out of scope, like any object",
            "At script shutdown, after all initialised objects",
            "Only if the class declares the destructor `final`",
          ],
          correctIndex: 0,
          explanation:
            "Running a destructor for state that was never created would be wrong, so the engine skips it. For proxies, the destructor runs on the real instance if one exists.",
        },
        {
          id: "php-modern-lazy-objects-q8",
          prompt: "Does calling a method on an uninitialised lazy object always initialise it?",
          options: [
            "No — only if the method actually observes or modifies the object's state",
            "Yes — any method call is a trigger",
            "Only for public methods",
            "Only if the method is not declared `static`",
          ],
          correctIndex: 0,
          explanation:
            "Triggers are about state access, not about dispatch. A method returning a constant, or a magic method that never touches a property, leaves the object lazy.",
        },
        {
          id: "php-modern-lazy-objects-q9",
          prompt: "What does cloning an initialised lazy proxy return?",
          options: [
            "A clone of the proxy, linked to a clone of the real instance; `__clone()` runs on the real instance",
            "A clone of the real instance, so the proxy disappears",
            "A new lazy proxy with the same factory",
            "A shallow copy sharing the same real instance",
          ],
          correctIndex: 0,
          explanation:
            "Both halves are cloned and re-linked so the copy has independent state and is still an object of the expected class. `__clone()` is invoked on the real instance, not the proxy.",
        },
        {
          id: "php-modern-lazy-objects-q10",
          prompt: "What advantage do engine-level lazy objects have over the generated-proxy approach frameworks used before 8.4?",
          options: [
            "No code generation, and `final` classes can be made lazy",
            "They are faster once initialised, because the engine caches the hydrated state",
            "They can defer internal classes such as `PDO` as well",
            "They remove the need for an ORM identity map",
          ],
          correctIndex: 0,
          explanation:
            "Generated proxies were subclasses, so `final` was fatal and the generated files had to be built and shipped. Post-initialisation performance is the same, internal classes are still out, and identity maps solve a different problem.",
        },
      ],
    },
    {
      id: "php-modern-array-functions",
      moduleId: "php-modern",
      trackId: "php",
      title: "array_find, array_any, array_all and Friends",
      summary:
        "PHP 8.4 finally added the four array predicates everyone had been writing by hand: `array_find`, `array_find_key`, `array_any` and `array_all`. Each takes the array first and a callback with the signature `fn($value, $key): bool` — note that the key is passed too, which `array_filter` only does with a flag. All four short-circuit: they stop calling the callback as soon as the answer is known, which is the actual reason to prefer them over `array_filter(...)` followed by a `count()` or a `reset()` on a fully materialised result array.\n\nThe semantics have one sharp edge. `array_find` returns the matching *value*, or `null` if nothing matched — so it cannot distinguish \"found an element whose value is `null`\" from \"found nothing\". When the array may legitimately contain nulls, use `array_find_key`, which returns the key (and `null` only when there is genuinely no match, a case you can then confirm). Also worth knowing for the boundary case: `array_all([])` is `true` and `array_any([])` is `false`, which is vacuous truth and matches every other language, but surprises people reading a validation rule for the first time.\n\nPHP 8.5 rounded the set out with `array_first` and `array_last`. They return the first and last *values* in insertion order — not the values at the lowest and highest keys — without moving the internal array pointer the way `reset()` and `end()` do. On an empty array they return `null`, with the same ambiguity as `array_find`, so pair them with `array_key_first`/`array_key_last` or an `empty()` check when nulls are possible.",
      level: "intermediate",
      estMinutes: 30,
      webRefs: [
        { label: "PHP Manual: array_find", url: "https://www.php.net/manual/en/function.array-find.php", kind: "docs" },
        { label: "PHP Manual: array_any", url: "https://www.php.net/manual/en/function.array-any.php", kind: "docs" },
        { label: "PHP Manual: array_first", url: "https://www.php.net/manual/en/function.array-first.php", kind: "docs" },
        { label: "PHP.Watch: array_find, array_find_key, array_any, array_all", url: "https://php.watch/versions/8.4/array_find-array_find_key-array_any-array_all", kind: "article" },
      ],
      video: {
        title: "Array_find in PHP 8.4",
        channel: "PHP Annotated",
        url: "https://www.youtube.com/watch?v=yuCTnlEUJ4c",
        videoId: "yuCTnlEUJ4c",
        durationLabel: "13:41",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "php-modern-array-functions-q1",
          prompt: "What is the callback signature for `array_find`, `array_any` and `array_all`?",
          options: [
            "`fn(mixed $value, mixed $key): bool`",
            "`fn(mixed $value): bool`",
            "`fn(mixed $key, mixed $value): bool`",
            "`fn(mixed $carry, mixed $value): bool`",
          ],
          correctIndex: 0,
          explanation:
            "Value first, key second — the same order `array_walk` uses. `array_filter` only passes the key if you opt in with `ARRAY_FILTER_USE_BOTH`, which is one of the small inconsistencies these functions avoid.",
        },
        {
          id: "php-modern-array-functions-q2",
          prompt: "What does `array_all([], fn($v) => false)` return?",
          options: ["`true`", "`false`", "`null`", "A `ValueError` for the empty array"],
          correctIndex: 0,
          explanation:
            "Vacuous truth: there is no element for which the callback returns false, so the answer is `true`. Symmetrically, `array_any([])` is `false` because no element ever returned true.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-array-functions-q3",
          prompt:
            "What does this print?\n\n```php\n$rows = ['a' => null, 'b' => 2];\nvar_dump(array_find($rows, fn($v) => $v === null));\n```",
          options: [
            "`NULL` — indistinguishable from \"no match found\"",
            "`string(1) \"a\"`",
            "`bool(true)`",
            "`int(0)`",
          ],
          correctIndex: 0,
          explanation:
            "`array_find` returns the matched value, which here *is* `null`, exactly the sentinel it uses for \"nothing matched\". `array_find_key` returns `'a'` and removes the ambiguity.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-array-functions-q4",
          prompt: "Why prefer `array_any($users, $isAdmin)` over `count(array_filter($users, $isAdmin)) > 0`?",
          options: [
            "`array_any` stops at the first match instead of scanning the whole array and building a result",
            "`array_filter` cannot receive a closure as a callback",
            "`array_filter` reindexes the array, which is slower",
            "`array_any` runs the callback in C, so no PHP frames are pushed",
          ],
          correctIndex: 0,
          explanation:
            "Short-circuiting is the win, and it matters most exactly when the array is large. The callback is still ordinary PHP, invoked once per element until the answer is known.",
        },
        {
          id: "php-modern-array-functions-q5",
          prompt: "How does `array_find_key` differ from `array_search`?",
          options: [
            "It matches with a callback; `array_search` matches a value with `==` or `===`",
            "It returns `false` when nothing matches, while `array_search` returns `null`",
            "It only works on list-style arrays",
            "It searches from the end of the array",
          ],
          correctIndex: 0,
          explanation:
            "`array_search` answers \"where is this exact value\"; `array_find_key` answers \"where is the first element satisfying this predicate\". Note the different miss values too: `array_search` returns `false`, `array_find_key` returns `null`.",
        },
        {
          id: "php-modern-array-functions-q6",
          prompt:
            "What does `array_first([3 => 'x', 1 => 'y', 2 => 'z'])` return?",
          options: [
            "`'x'` — the first value in insertion order",
            "`'y'` — the value at the lowest key",
            "`3` — the first key",
            "`null`, because the array is not a list",
          ],
          correctIndex: 0,
          explanation:
            "PHP arrays are ordered hash maps, and `array_first` reads insertion order, not key order. It also leaves the internal pointer alone, unlike `reset()`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-array-functions-q7",
          prompt: "Which of these are true of the PHP 8.4/8.5 array additions? (Select all that apply.)",
          options: [
            "`array_find` returns the value; `array_find_key` returns the key",
            "All four predicates short-circuit as soon as the result is determined",
            "`array_first` does not move the internal array pointer",
            "`array_any` is just an alias of `in_array` with a callback",
            "They preserve keys in their return value, like `array_filter`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The predicates return a scalar, not a filtered array, so there are no keys to preserve. `in_array` compares a value; `array_any` evaluates a predicate, which is a different operation.",
        },
        {
          id: "php-modern-array-functions-q8",
          prompt: "You need every element to pass a rule *and* you need the list of failures for an error message. What is the right tool?",
          options: [
            "`array_filter` with the inverse predicate — `array_all` only answers yes or no",
            "`array_all`, then re-run the callback on the failures",
            "`array_find`, which returns all matches",
            "`array_any` with a by-reference collector in the closure",
          ],
          correctIndex: 0,
          explanation:
            "The predicates deliberately answer one bit. Once you need the failing items you want a filter, and the short-circuit advantage is gone anyway because you have to visit every element.",
        },
        {
          id: "php-modern-array-functions-q9",
          prompt: "How do you write the equivalent of `array_any` in a way that also runs on PHP 8.3?",
          options: [
            "A `foreach` that returns `true` on the first match, or a polyfill package",
            "`array_reduce` with a boolean accumulator, which short-circuits automatically",
            "`array_walk`, which can be aborted by returning `false`",
            "`array_filter` with `ARRAY_FILTER_USE_BOTH`, which stops at the first match",
          ],
          correctIndex: 0,
          explanation:
            "A plain loop is the honest answer, and it is exactly what these functions replace. `array_reduce` visits every element, and neither `array_walk` nor `array_filter` can stop early.",
        },
      ],
    },
    {
      id: "php-modern-fibers",
      moduleId: "php-modern",
      trackId: "php",
      title: "Fibers and the State of Async PHP",
      summary:
        "Fibers (PHP 8.1) are full-stack interruptible functions: `Fiber::suspend()` pauses the entire call stack of the current fiber, wherever it is, and control returns to whoever called `start()` or `resume()`. Compare that with generators, which are stack-*less* — a `yield` only suspends the generator function itself, so every caller up the chain has to become a generator too and `yield from` the one below it. That colouring problem is why pre-8.1 async PHP libraries forced you to rewrite an entire call path. With fibers, a function that suspends does not change its return type, and its callers do not have to know.\n\nThe thing to be clear about is what fibers are *not*. They add no concurrency of their own: PHP is still single-threaded and a fiber only runs when something resumes it. The scheduler is userland — Revolt is the event loop, AMPHP and ReactPHP the ecosystems on top — and it is the non-blocking I/O drivers, not the fibers, that let one request wait on ten HTTP calls at once. Put a plain `file_get_contents()` or a blocking PDO query inside a fiber and the whole process stops, exactly as before. Fibers are the primitive that let those libraries hide the scheduler, not a replacement for it.\n\nThis matters practically because of where PHP runs. Classic PHP-FPM tears down the world after every request, so an event loop has nowhere to live; async PHP belongs to long-running workers, queue consumers and application servers (FrankenPHP, RoadRunner, Swoole, Laravel Octane). The gotcha to remember: calling `Fiber::suspend()` when no fiber is running throws a `FiberError`, which is how a library discovers at runtime that it was used outside an event loop.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "PHP Manual: Fibers", url: "https://www.php.net/manual/en/language.fibers.php", kind: "docs" },
        { label: "PHP Manual: The Fiber class", url: "https://www.php.net/manual/en/class.fiber.php", kind: "docs" },
        { label: "PHP RFC: Fibers", url: "https://wiki.php.net/rfc/fibers", kind: "spec" },
        { label: "Revolt: the concurrency framework for PHP", url: "https://revolt.run/", kind: "docs" },
      ],
      video: {
        title: "PHP Fibers & Asynchronous Under 11 Minutes",
        channel: "Desk Nook",
        url: "https://www.youtube.com/watch?v=Db-GFBGyD4w",
        videoId: "Db-GFBGyD4w",
        durationLabel: "10:45",
      },
      alternateVideos: [
        {
          title: "Unlock Parallel Processing in PHP with Fibers | IPC",
          channel: "International PHP Conference",
          url: "https://www.youtube.com/watch?v=HWD0Cl7PJxo",
          videoId: "HWD0Cl7PJxo",
          durationLabel: "38:55",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-modern-fibers-q1",
          prompt: "What is the core difference between a fiber and a generator?",
          options: [
            "A fiber suspends the whole call stack; a generator only suspends its own frame",
            "A fiber runs on a separate OS thread; a generator does not",
            "A fiber can be resumed many times; a generator only once",
            "A fiber is an object; a generator is a language construct with no object",
          ],
          correctIndex: 0,
          explanation:
            "Fibers are stackful, so `Fiber::suspend()` can sit ten frames deep and nothing in between needs to know. Generators are stackless, which is why async-by-generator required `yield from` all the way up.",
        },
        {
          id: "php-modern-fibers-q2",
          prompt:
            "What does this print?\n\n```php\n$fiber = new Fiber(function (): void {\n    $x = Fiber::suspend('paused');\n    echo $x;\n});\necho $fiber->start();\n$fiber->resume('resumed');\n```",
          options: ["`pausedresumed`", "`resumedpaused`", "`pausedpaused`", "Nothing — `start()` returns `null`"],
          correctIndex: 0,
          explanation:
            "`start()` returns whatever `suspend()` was given, and `suspend()` returns whatever `resume()` was given. The two values travel in opposite directions, which is the whole handshake.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-fibers-q3",
          prompt: "What happens if `Fiber::suspend()` is called when no fiber is currently running?",
          options: [
            "A `FiberError` is thrown",
            "It returns `null` and execution continues",
            "A fatal error stops the script",
            "The main script is suspended until something resumes it",
          ],
          correctIndex: 0,
          explanation:
            "There is nothing to suspend to, so the engine throws. In practice this is how an async library tells you that you called it outside an event loop.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-fibers-q4",
          prompt:
            "A fiber calls `file_get_contents('https://api.example.com/slow')`. What happens to the other fibers the event loop is managing?",
          options: [
            "They are all blocked — the stream call blocks the whole process",
            "They continue, because fibers make I/O non-blocking",
            "They continue, but only if `opcache.jit` is enabled",
            "The event loop transparently moves the call to a worker thread",
          ],
          correctIndex: 0,
          explanation:
            "Fibers provide suspension, not non-blocking I/O. Concurrency only appears when you use drivers that register with the loop and suspend the fiber while waiting, such as AMPHP's HTTP client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-fibers-q5",
          prompt: "Which of these are true about fibers? (Select all that apply.)",
          options: [
            "They are cooperatively scheduled — a fiber runs until it suspends or returns",
            "`Fiber::suspend()` may be called from a callback passed to `array_map()`",
            "A function that suspends keeps its ordinary return type",
            "They give PHP true parallelism across CPU cores",
            "PHP ships an event loop to schedule them",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Fibers are cooperative, stackful and transparent to signatures — you can suspend from inside a VM-invoked callback. There is no parallelism (one thread) and no bundled scheduler; Revolt fills that gap in userland.",
        },
        {
          id: "php-modern-fibers-q6",
          prompt: "When can `Fiber::getReturn()` be called safely?",
          options: [
            "Only after the fiber has terminated, which `isTerminated()` reports",
            "At any time; it returns `null` while the fiber is suspended",
            "Only from inside the fiber itself",
            "After the first `suspend()`, since the return value is computed eagerly",
          ],
          correctIndex: 0,
          explanation:
            "The return value does not exist until the callback has actually returned. Calling it earlier throws, which is what `isTerminated()` is for.",
        },
        {
          id: "php-modern-fibers-q7",
          prompt: "Why is async PHP largely irrelevant under classic PHP-FPM?",
          options: [
            "FPM tears the process state down after each request, so a long-lived event loop has nowhere to live",
            "FPM disables the Fiber class for security reasons",
            "FPM already runs each request in its own fiber",
            "Fibers require the `pcntl` extension, which FPM does not load",
          ],
          correctIndex: 0,
          explanation:
            "The shared-nothing model is exactly what makes PHP easy and exactly what makes an event loop pointless per request. Async PHP lives in long-running workers and application servers instead.",
        },
        {
          id: "php-modern-fibers-q8",
          prompt: "What is the relationship between fibers, Revolt and AMPHP?",
          options: [
            "Fibers are the language primitive; Revolt is the event loop; AMPHP is the library ecosystem built on both",
            "Revolt is a PHP extension that implements fibers; AMPHP wraps it",
            "AMPHP is the event loop and Revolt is its HTTP client",
            "All three are alternative implementations of the same idea",
          ],
          correctIndex: 0,
          explanation:
            "The engine gives you suspension only. Revolt decides what runs next, and AMPHP supplies the non-blocking clients, streams and synchronisation primitives on top.",
        },
        {
          id: "php-modern-fibers-q9",
          prompt: "How do you resume a fiber with an exception rather than a value?",
          options: [
            "`$fiber->throw($e)` — the exception is thrown from the `Fiber::suspend()` call",
            "`$fiber->resume(new Exception())`, which PHP detects and rethrows",
            "You cannot; you must let the fiber time out",
            "`throw $e` inside the resuming scope, which propagates into the fiber",
          ],
          correctIndex: 0,
          explanation:
            "`throw()` is the error-path counterpart to `resume()`, which is how a cancelled or failed I/O operation surfaces inside the suspended code as a normal exception.",
        },
        {
          id: "php-modern-fibers-q10",
          prompt: "Which PHP version lifted the restriction on switching fibers inside an object destructor?",
          options: ["8.4", "8.2", "8.5", "The restriction still applies"],
          correctIndex: 0,
          explanation:
            "Prior to 8.4 suspending during destruction was not allowed, which made cleanup code in async libraries awkward. It is a small change with real consequences for connection-pool teardown.",
        },
      ],
    },
    {
      id: "php-modern-opcache-jit",
      moduleId: "php-modern",
      trackId: "php",
      title: "Opcache, Preloading and the JIT",
      summary:
        "Opcache is the single largest performance lever in PHP and it is not the JIT. Without it every request re-reads, re-tokenises, re-parses and re-compiles every file it touches; with it, compiled opcodes live in shared memory and are reused across requests. The knobs that matter are `opcache.memory_consumption` (128 MB by default), `opcache.max_accelerated_files` (10,000, rounded up to a prime — a large framework plus vendor tree can exceed it and silently start evicting), `opcache.interned_strings_buffer` (8 MB) and `opcache.validate_timestamps`, which defaults to on and stats every file every `opcache.revalidate_freq` seconds. Turning validation off is a real production win, but it means a deploy that swaps files in place serves stale bytecode until the pool is reloaded.\n\nPreloading (7.4) goes one step further: `opcache.preload` runs a script at server start that loads classes, functions, interfaces and traits permanently into memory, skipping autoloading entirely. Constants are not preloaded. It only makes sense with a persistent process, it is not supported on Windows, and clearing it requires restarting PHP — which makes it a production-only feature and a genuine complication for zero-downtime deploys.\n\nThe JIT lives inside opcache and compiles hot opcodes to machine code via DynASM. It is worth understanding what it does not do: typical web requests are dominated by I/O and by calls into C functions that were already compiled, so JIT usually moves the needle by a few percent at most, while making stack traces and profiling harder. Tight numeric loops in pure PHP are where it genuinely wins. Note the default change: through 8.3 `opcache.jit` defaulted to `tracing` but `opcache.jit_buffer_size` defaulted to `0`, so JIT was off; from 8.4 the defaults are `opcache.jit=disable` with a 64 MB buffer — still off, but you now have to set `opcache.jit=tracing` explicitly to turn it on.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "PHP Manual: OPcache Runtime Configuration", url: "https://www.php.net/manual/en/opcache.configuration.php", kind: "docs" },
        { label: "PHP Manual: Preloading", url: "https://www.php.net/manual/en/opcache.preloading.php", kind: "docs" },
        { label: "PHP.Watch: PHP JIT in Depth", url: "https://php.watch/articles/jit-in-depth", kind: "article" },
        { label: "PHP.Watch: Opcache JIT INI default changes (8.4)", url: "https://php.watch/versions/8.4/opcache-jit-ini-default-changes", kind: "article" },
      ],
      video: {
        title: "Everything about OPcache to increase PHP performance (2026)",
        channel: "Tideways",
        url: "https://www.youtube.com/watch?v=LcIkUpcaXZc",
        videoId: "LcIkUpcaXZc",
        durationLabel: "25:20",
      },
      alternateVideos: [
        {
          title: "OPcache Preloading - A miracle cure to improve PHP performance?",
          channel: "Tideways",
          url: "https://www.youtube.com/watch?v=wkhpNd7aYV8",
          videoId: "wkhpNd7aYV8",
          durationLabel: "12:06",
        },
        {
          title: "PHP 8 Tips Chapter 10: Working with the JIT Compiler",
          channel: "Doug Bierer",
          url: "https://www.youtube.com/watch?v=eJHEpZZtc0c",
          videoId: "eJHEpZZtc0c",
          durationLabel: "7:57",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-modern-opcache-jit-q1",
          prompt: "What does opcache actually store?",
          options: [
            "Compiled opcodes for each script, in shared memory reused across requests",
            "The rendered HTML output of each request",
            "Machine code produced by the JIT, only",
            "The result of every function call, keyed by arguments",
          ],
          correctIndex: 0,
          explanation:
            "It caches the output of the compile step — tokenise, parse, build opcodes — so subsequent requests skip it. Nothing about it caches your application's data or output.",
        },
        {
          id: "php-modern-opcache-jit-q2",
          prompt: "Your deploy replaces files in place on a server with `opcache.validate_timestamps=0`. What do users see?",
          options: [
            "The old code, until the FPM pool is reloaded or the cache is reset",
            "The new code immediately — file changes always invalidate the cache",
            "A mix, depending on `opcache.revalidate_freq`",
            "A fatal error, because the cached opcodes no longer match the files",
          ],
          correctIndex: 0,
          explanation:
            "With validation off the engine never stats the files, which is the performance point. Deploys must therefore reload the pool or call `opcache_reset()`; atomic symlink switches plus a reload are the usual pattern.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-opcache-jit-q3",
          prompt: "A large application has more PHP files than `opcache.max_accelerated_files` allows. What is the symptom?",
          options: [
            "Files are evicted and recompiled repeatedly, so latency rises and the cache hit rate falls",
            "A fatal error on the first request past the limit",
            "Opcache disables itself and logs a warning at startup",
            "Nothing — the limit only applies to preloaded files",
          ],
          correctIndex: 0,
          explanation:
            "The hash table is bounded, so overflow causes thrash rather than failure — which makes it easy to miss. `opcache_get_status()` exposes the cached-script count and hit rate to check against.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-opcache-jit-q4",
          prompt: "Why can setting `opcache.save_comments=0` break an application?",
          options: [
            "Frameworks and tools that read docblocks — Doctrine annotations, PHPUnit — lose the comments they parse",
            "Reflection cannot resolve class names without comments",
            "Attributes are stored as comments and disappear",
            "It corrupts the opcode cache for files that contain docblocks",
          ],
          correctIndex: 0,
          explanation:
            "Stripping comments saves memory but removes the docblocks annotation-based tooling depends on. Attributes are real syntax, not comments, which is one of the reasons they replaced annotations.",
        },
        {
          id: "php-modern-opcache-jit-q5",
          prompt: "Which of these are true of preloading? (Select all that apply.)",
          options: [
            "Classes, functions, interfaces and traits are made globally available without autoloading",
            "Global constants defined in preloaded files are *not* preloaded",
            "Clearing preloaded code requires restarting the PHP process",
            "It works well in CLI scripts, which is its main use case",
            "It is supported on Windows as of PHP 8.0",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Preloading needs a persistent process to amortise the cost, so it is pointless for a one-shot CLI script (FFI aside), and it is not supported on Windows at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-opcache-jit-q6",
          prompt: "What is the difference between using `include` and `opcache_compile_file()` in a preload script?",
          options: [
            "`include` executes the file, so declaration order matters; `opcache_compile_file()` does not execute, so files can be loaded in any order",
            "`opcache_compile_file()` executes the file twice, once to compile and once to run",
            "`include` preloads only classes, `opcache_compile_file()` preloads constants too",
            "There is no difference; one is an alias of the other",
          ],
          correctIndex: 0,
          explanation:
            "Because `include` runs the code, a class must be preloaded after its parent, and conditional declarations work. `opcache_compile_file()` only compiles, which is more flexible for autoloader-style codebases.",
        },
        {
          id: "php-modern-opcache-jit-q7",
          prompt: "Through PHP 8.3, what were the defaults for `opcache.jit` and `opcache.jit_buffer_size`, and what did they mean?",
          options: [
            "`tracing` and `0` — the mode was set but the zero-sized buffer meant the JIT was effectively off",
            "`disable` and `0` — the JIT was off in both respects",
            "`tracing` and `64M` — the JIT was on by default",
            "`function` and `128M` — the JIT was on in function mode",
          ],
          correctIndex: 0,
          explanation:
            "That combination confused everyone, because `phpinfo()` showed `tracing` while nothing was actually compiled. PHP 8.4 swapped it for the honest `opcache.jit=disable` with a 64 MB buffer, so you now opt in by setting the mode.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-opcache-jit-q8",
          prompt: "Which workload is most likely to get a meaningful speedup from the JIT?",
          options: [
            "A tight numeric loop in pure PHP, such as image or matrix processing",
            "A typical CRUD endpoint that queries a database and renders a template",
            "A script dominated by `preg_match` and `json_decode` calls",
            "A queue worker that spends most of its time waiting on HTTP calls",
          ],
          correctIndex: 0,
          explanation:
            "The JIT removes VM dispatch overhead, which only matters when the VM is the bottleneck. Database work, network waits and calls into C extensions like PCRE or JSON are already outside the VM.",
        },
        {
          id: "php-modern-opcache-jit-q9",
          prompt: "What is the relationship between the JIT and opcache?",
          options: [
            "The JIT is implemented inside the opcache extension and requires opcache to be enabled",
            "They are independent extensions that can be enabled separately",
            "The JIT replaces opcache; enabling it makes the opcode cache redundant",
            "Opcache is a fallback used only when the JIT buffer is full",
          ],
          correctIndex: 0,
          explanation:
            "JIT compiles from opcodes that opcache already produced, and its buffer is carved out of the same shared memory segment — the total is `opcache.memory_consumption` plus `opcache.jit_buffer_size`.",
        },
        {
          id: "php-modern-opcache-jit-q10",
          prompt: "What is the difference between tracing JIT and function JIT?",
          options: [
            "Tracing compiles hot paths identified at runtime; function JIT compiles whole functions without tracing hot structures",
            "Tracing compiles on script load; function JIT compiles on first call",
            "Tracing works on typed code only; function JIT works on any code",
            "Tracing runs in a background thread; function JIT runs inline",
          ],
          correctIndex: 0,
          explanation:
            "Tracing (the `tracing` alias, `1254`) watches execution and compiles hot loops and paths, which is usually the better trade of compile time against benefit. `function` (`1205`) compiles at function granularity.",
        },
        {
          id: "php-modern-opcache-jit-q11",
          prompt: "Why does strictly typed code tend to benefit more from the JIT?",
          options: [
            "Known types let the compiler use CPU registers and specialised instructions instead of generic variant handling",
            "Type declarations are compiled to native assertions that replace runtime checks",
            "`declare(strict_types=1)` switches the JIT from function mode to tracing mode",
            "Untyped code is excluded from JIT compilation entirely",
          ],
          correctIndex: 0,
          explanation:
            "PHP values are tagged variants; when the compiler can prove a variable is always an `int`, it can keep it in a register. Where types cannot be inferred, the generated code falls back to the generic path.",
        },
        {
          id: "php-modern-opcache-jit-q12",
          prompt: "What is the honest cost of enabling the JIT in production?",
          options: [
            "Harder debugging and profiling, plus memory for the buffer, for usually small gains on web workloads",
            "Slower cold starts only; steady-state behaviour is identical",
            "It disables opcache's opcode cache, so first requests get slower",
            "It requires recompiling every extension against the JIT ABI",
          ],
          correctIndex: 0,
          explanation:
            "Compiled machine code is opaque to standard PHP debuggers and complicates profiling, and the buffer is real memory. For an I/O-bound application that is a poor trade; measure before enabling it.",
        },
      ],
    },
    {
      id: "php-modern-upgrading",
      moduleId: "php-modern",
      trackId: "php",
      title: "Upgrading a Codebase Across PHP Versions",
      summary:
        "Upgrading PHP is mostly an exercise in making warnings visible and then reading them. The order that works: raise `error_reporting` to `E_ALL` in CI and staging so `E_DEPRECATED` and `E_USER_DEPRECATED` stop being invisible; run the test suite on the *current* version with deprecations failing the build; fix them; only then bump the runtime. Doing it the other way round means debugging deprecations and genuine breakages at the same time, on a version where you cannot easily roll back.\n\nTwo tools do most of the work. PHPStan or Psalm find the static problems — wrong types, calls to removed functions, signatures that no longer satisfy an interface — without executing anything. Rector applies mechanical fixes by rewriting the AST: it has version sets (`LevelSetList::UP_TO_PHP_84` and friends) that convert implicit nullable parameters, replace removed functions and modernise syntax across thousands of files in one run. Neither is a substitute for tests, and Rector's output must be reviewed like any other diff, but hand-editing 400 call sites is not a good use of a week.\n\nThe deprecations most likely to bite an older codebase, in rough order: dynamic properties (deprecated in 8.2, with `#[\\AllowDynamicProperties]` as the explicit opt-out), implicitly nullable parameters (`function f(Foo $a = null)` must become `?Foo` in 8.4), `E_STRICT` removed and `trigger_error(..., E_USER_ERROR)` deprecated in 8.4, and the PHP 8.0 comparison change that made `0 == \"foo\"` false. On the dependency side, `composer why-not php 8.5` tells you which package is holding the constraint, and `config.platform.php` in `composer.json` lets you resolve against a version you have not deployed yet.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "PHP Manual: Deprecated Features in PHP 8.4", url: "https://www.php.net/manual/en/migration84.deprecated.php", kind: "docs" },
        { label: "PHP.Watch: Implicitly marking a parameter type nullable is deprecated", url: "https://php.watch/versions/8.4/implicitly-marking-parameter-type-nullable-deprecated", kind: "article" },
        { label: "Rector: Instant Upgrades and Automated Refactoring", url: "https://getrector.com/", kind: "repo" },
        { label: "PHPStan: PHP Static Analysis Tool", url: "https://phpstan.org/", kind: "docs" },
      ],
      video: {
        title: "Modernizing Code with Rector - Laravel In Practice EP12",
        channel: "Laravel News",
        url: "https://www.youtube.com/watch?v=ldpNCNNm7i8",
        videoId: "ldpNCNNm7i8",
        durationLabel: "7:34",
      },
      alternateVideos: [
        {
          title: "Why You Should Start Using Rector PHP Today – Upgrade Legacy PHP to Modern in Seconds!",
          channel: "nunomaduro",
          url: "https://www.youtube.com/watch?v=15tsiv6AvnE",
          videoId: "15tsiv6AvnE",
          durationLabel: "3:56",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "php-modern-upgrading-q1",
          prompt: "What is the right first step when planning a jump from PHP 8.1 to 8.5?",
          options: [
            "Turn `E_DEPRECATED` back on in CI and staging and fix what appears, while still on 8.1",
            "Bump the runtime in staging and fix whatever breaks",
            "Run `composer update` to pull in packages that support 8.5",
            "Rewrite the affected code by hand against the 8.5 manual",
          ],
          correctIndex: 0,
          explanation:
            "Deprecations are fixable on the old version, where everything still works and rollback is trivial. Bumping first mixes deprecation cleanup with real failures on a runtime you cannot easily revert.",
        },
        {
          id: "php-modern-upgrading-q2",
          prompt:
            "PHP 8.4 deprecates this. What is the correct rewrite?\n\n```php\nfunction find(Repo $repo = null): ?Entity {}\n```",
          options: [
            "`function find(?Repo $repo = null): ?Entity {}`",
            "`function find(Repo|false $repo = false): ?Entity {}`",
            "`function find(mixed $repo = null): ?Entity {}`",
            "Nothing — the deprecation is about the return type, not the parameter",
          ],
          correctIndex: 0,
          explanation:
            "Implicitly widening a parameter type to accept `null` because its default is `null` is deprecated; you must write `?Repo` (or `Repo|null`) explicitly. Rector's 8.4 set does this rewrite mechanically.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-upgrading-q3",
          prompt:
            "How must `function f(T1 $a, T2 $b = null, T3 $c)` be rewritten for PHP 8.4?",
          options: [
            "`function f(T1 $a, ?T2 $b, T3 $c)` — the `= null` must also go, because an optional parameter before a required one is deprecated",
            "`function f(T1 $a, ?T2 $b = null, T3 $c)` — only the type changes",
            "`function f(T1 $a, T3 $c, ?T2 $b = null)` — required parameters must be reordered first",
            "It is already valid; the deprecation only applies when the parameter is last",
          ],
          correctIndex: 0,
          explanation:
            "Keeping `= null` would leave an optional parameter before a required one, which is itself deprecated (since 8.0). Making the type explicitly nullable and dropping the default fixes both without changing any call site.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-upgrading-q4",
          prompt: "What does Rector do that PHPStan does not?",
          options: [
            "It rewrites the code, applying fixes to the AST rather than only reporting problems",
            "It executes the test suite against multiple PHP versions",
            "It checks types at runtime via an extension",
            "It resolves Composer constraints for the target PHP version",
          ],
          correctIndex: 0,
          explanation:
            "PHPStan reports; Rector refactors. They are complementary — the usual loop is Rector for the mechanical changes, PHPStan to catch what is left, tests to prove nothing moved.",
        },
        {
          id: "php-modern-upgrading-q5",
          prompt: "A package blocks the upgrade and you need to know which one. What tells you?",
          options: [
            "`composer why-not php 8.5`",
            "`composer show --outdated`",
            "`composer validate --strict`",
            "`composer dump-autoload --optimize`",
          ],
          correctIndex: 0,
          explanation:
            "`why-not` (an alias of `prohibits`) lists exactly which installed packages forbid a given version. `show --outdated` tells you what is old, which is a different question.",
        },
        {
          id: "php-modern-upgrading-q6",
          prompt: "Why set `config.platform.php` in `composer.json`?",
          options: [
            "To make Composer resolve dependencies against a chosen PHP version regardless of the local runtime",
            "To force the application to run on that PHP version at boot",
            "To make Composer install a matching PHP binary",
            "To add `php` as an explicit dependency in `require`",
          ],
          correctIndex: 0,
          explanation:
            "It decouples resolution from whatever is on the developer's machine, so CI, laptops and production all produce the same lock file. It has no effect on which PHP actually runs.",
        },
        {
          id: "php-modern-upgrading-q7",
          prompt:
            "A class assigns `$this->cache = [];` to a property that was never declared, and 8.2 now logs a deprecation. Which responses are legitimate? (Select all that apply.)",
          options: [
            "Declare the property on the class",
            "Add `#[\\AllowDynamicProperties]` to the class as an explicit opt-out",
            "Make the class extend `stdClass`",
            "Implement `__get`/`__set` with an internal array",
            "Silence `E_DEPRECATED` in production",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "Declaring the property is the right fix; the attribute is the sanctioned escape hatch for classes that are dynamic by design, and magic methods are a deliberate alternative. Extending `stdClass` is not how the exemption works, and silencing the notice just hides the countdown.",
        },
        {
          id: "php-modern-upgrading-q8",
          prompt: "Which of these changed in PHP 8.4?",
          options: [
            "The `E_STRICT` constant was deprecated, and calling `trigger_error()` with `E_USER_ERROR` was deprecated",
            "Dynamic properties became a fatal error",
            "`readonly` classes were introduced",
            "The nullsafe operator was introduced",
          ],
          correctIndex: 0,
          explanation:
            "The `E_STRICT` error level had already gone, so 8.4 deprecated the leftover constant, and it deprecated `trigger_error(..., E_USER_ERROR)` in favour of throwing or calling `exit()`. Dynamic properties are still only deprecated, readonly classes are 8.2 and nullsafe is 8.0.",
        },
        {
          id: "php-modern-upgrading-q9",
          prompt:
            "A legacy authorisation check reads `if (in_array($userId, $adminNames))` where `$userId` is `0` and `$adminNames` holds strings. What changed in PHP 8.0?",
          options: [
            "It used to return `true` and now returns `false`, because comparing a number with a non-numeric string casts the number to string",
            "It used to return `false` and now returns `true`, because loose comparison got looser",
            "Nothing changed; `in_array` has always used strict comparison",
            "It now throws a `TypeError` for mixed-type arrays",
          ],
          correctIndex: 0,
          explanation:
            "Under PHP 7, `0 == \"admin\"` was true, so this accidentally granted access. PHP 8 compares the number as a string instead, which fixes the bug — and can equally break code that relied on the old behaviour, so it cuts both ways during an upgrade.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "php-modern-upgrading-q10",
          prompt: "What is the safest way to run Rector's PHP version set on a large codebase?",
          options: [
            "Run it in `--dry-run` first, then apply one rule set at a time and review each diff against a passing test suite",
            "Run the whole set with `--no-diffs` and rely on tests to catch regressions",
            "Apply it only to `vendor/`, where the mechanical changes are safe",
            "Run it in production first, since staging has different PHP settings",
          ],
          correctIndex: 0,
          explanation:
            "Rector output is a diff like any other and occasionally changes behaviour, so small reviewable batches over a green suite is the way. `vendor/` is regenerated by Composer and must never be edited.",
        },
      ],
    },
  ],
} satisfies Module;
