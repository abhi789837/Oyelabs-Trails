import type { Module } from "@/types/curriculum";

export default {
  id: "mobile-dart",
  trackId: "mobile",
  name: "The Dart Language",
  description:
    "Dart on its own terms, written for an engineer who already thinks in JavaScript or TypeScript and is about to learn Flutter. The value is in the mismatches: sound null safety is not `strictNullChecks`, `const` does not mean \"cannot reassign\", generics are reified rather than erased, and isolates are not workers with shared memory.",
  refs: [
    { label: "dart.dev: Language documentation", url: "https://dart.dev/language", kind: "docs" },
    { label: "dart.dev: Language evolution (what changed in each release)", url: "https://dart.dev/resources/language/evolution", kind: "docs" },
    { label: "dart.dev: Effective Dart — Usage", url: "https://dart.dev/effective-dart/usage", kind: "article" },
  ],
  topics: [
    {
      id: "dart-why-dart",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "Why Flutter Runs on Dart: JIT, AOT and Hot Reload",
      summary:
        "Dart exists because Google wanted one language that could be loaded into a running process fast enough for a sub-second edit-refresh loop *and* compiled tightly enough to ship as a native mobile binary. It gets both by having two compilers: a JIT used during development, which is what makes stateful hot reload possible at all, and an AOT compiler that emits machine code for release. Hot reload is not a framework trick — it is a property of the runtime, and it is the clearest reason Flutter was not built on JavaScript.\n\nThat split shapes the rest of the language. AOT output has to be tree-shaken aggressively, so Dart has no usable runtime reflection in Flutter (`dart:mirrors` is unsupported), which is why the ecosystem leans on build-time code generation where a JS project would reach for a decorator or a proxy. AOT also rewards a *sound* static type system: because the compiler can prove a `List<int>` really only holds `int`, it can skip checks and lay out memory directly, which is a guarantee TypeScript deliberately does not make.\n\nThe practical gotcha is that debug and release builds are genuinely different runtimes. Debug (JIT) performance numbers mean nothing — animations that judder in debug are often fine in release — and `assert` statements are ignored entirely in production, arguments unevaluated. Benchmark in profile or release mode, never debug.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "dart.dev: Introduction to Dart", url: "https://dart.dev/overview", kind: "docs" },
        { label: "dart.dev: dart compile", url: "https://dart.dev/tools/dart-compile", kind: "docs" },
        { label: "dart.dev: Language evolution", url: "https://dart.dev/resources/language/evolution", kind: "article" },
      ],
      video: {
        title: "#1 - Dart Language, Type System, Soundness, Type Inference, Null Safety, JIT & AOT Compilers",
        channel: "Flutterly",
        url: "https://www.youtube.com/watch?v=nQRW0_Q9RFI",
        videoId: "nQRW0_Q9RFI",
        durationLabel: "16:56",
      },
      alternateVideos: [
        {
          title: "Why Flutter uses Dart",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=5F-6n_2XWR8",
          videoId: "5F-6n_2XWR8",
          durationLabel: "1:36",
        },
        {
          title: "Dart in 100 Seconds",
          channel: "Fireship",
          url: "https://www.youtube.com/watch?v=NrO0CJCbYLA",
          videoId: "NrO0CJCbYLA",
          durationLabel: "2:30",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-why-dart-q1",
          prompt: "Which compilation mode does a Flutter debug build use, and why does that choice matter?",
          options: [
            "JIT, because hot reload needs to inject changed code into an already-running VM",
            "AOT, because debug builds need the fastest possible frame times",
            "An interpreter only, because the JIT is reserved for release builds",
            "Both at once, with the JIT used for UI code and AOT for business logic",
          ],
          correctIndex: 0,
          explanation:
            "Debug builds run the JIT so new code can be compiled and swapped in while the app keeps its state. Release builds use AOT, which is why release binaries start faster but cannot hot reload.",
        },
        {
          id: "dart-why-dart-q2",
          prompt: "What is the difference between hot reload and hot restart?",
          options: [
            "Hot reload injects changed code and keeps app state; hot restart rebuilds and starts from a clean state",
            "Hot reload recompiles the whole app; hot restart only re-renders the current screen",
            "Hot reload works in release builds; hot restart only works in debug builds",
            "They are two names for the same operation",
          ],
          correctIndex: 0,
          explanation:
            "Hot reload keeps the running isolate and its in-memory state; hot restart throws that away. Changes to top-level state, `main()`, or static initialisers usually need a restart because reload will not re-run them.",
        },
        {
          id: "dart-why-dart-q3",
          prompt: "Which of these are true of a Dart AOT release build? (Select all that apply.)",
          options: [
            "Hot reload is unavailable",
            "Unreachable code is tree-shaken out of the binary",
            "`assert` statements are ignored and their arguments are not evaluated",
            "Runtime reflection via `dart:mirrors` is unavailable",
            "Startup is slower than the JIT build because code must be compiled at launch",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "AOT trades the ability to load new code for a smaller, faster binary. Startup is *faster*, not slower — there is nothing left to compile at launch, which is the whole point of compiling ahead of time.",
        },
        {
          id: "dart-why-dart-q4",
          prompt:
            "A library you are porting from Node relies on reading class metadata at runtime to wire up dependency injection. Why does the equivalent approach fail in a Flutter release build?",
          options: [
            "AOT compilation tree-shakes anything it cannot prove is reachable, so runtime reflection over arbitrary types is unsupported",
            "Dart forbids reading type information at runtime because generics are erased",
            "Flutter blocks reflection for security reasons on iOS only",
            "Reflection works, but only on classes annotated with `@pragma('vm:entry-point')`",
          ],
          correctIndex: 0,
          explanation:
            "Reflection defeats tree shaking: if any type could be looked up by name, nothing can be dropped. That is why the Dart ecosystem uses build-time code generation where a JS project would reflect. Generics are *not* erased in Dart — they are reified.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-why-dart-q5",
          prompt: "What does `dart compile exe` produce?",
          options: [
            "A standalone native executable with the Dart runtime bundled in",
            "A JavaScript bundle suitable for a browser",
            "A kernel module that still requires `dart run` to execute",
            "A WebAssembly module plus a JavaScript loader",
          ],
          correctIndex: 0,
          explanation:
            "`exe` produces a self-contained AOT executable. `js` and `wasm` target the web, `kernel` produces an intermediate module, and `aot-snapshot` produces a snapshot that needs `dartaotruntime`.",
        },
        {
          id: "dart-why-dart-q6",
          prompt:
            "A colleague reports that a list animation \"stutters badly\" and wants to rewrite it. What should you check first?",
          options: [
            "Whether they measured in a debug (JIT) build rather than profile or release",
            "Whether the list uses `final` instead of `const` for its items",
            "Whether the app was compiled with `dart compile js` instead of `exe`",
            "Whether the device has hot reload enabled",
          ],
          correctIndex: 0,
          explanation:
            "Debug builds are unoptimised and JIT-compiled, so frame times there are not representative. Performance conclusions drawn from a debug build are the single most common false alarm in Flutter work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-why-dart-q7",
          prompt: "What does it mean that Dart's type system is *sound*, in contrast to TypeScript's?",
          options: [
            "A value's static type is guaranteed to match its runtime type, enforced by static checks plus runtime checks where needed",
            "Every variable must carry an explicit type annotation",
            "The compiler rejects any program containing `dynamic`",
            "Types are checked only at compile time and erased before execution",
          ],
          correctIndex: 0,
          explanation:
            "Soundness means the type can't lie at runtime; Dart backs static analysis with runtime checks. TypeScript is deliberately unsound — `as`, `any` and structural gaps let a value's real shape differ from its declared type, and the types vanish before execution anyway.",
        },
        {
          id: "dart-why-dart-q8",
          prompt: "Which targets can the Dart SDK compile to today? (Select all that apply.)",
          options: [
            "Native machine code for desktop and mobile",
            "JavaScript",
            "WebAssembly",
            "JVM bytecode",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`dart compile` has `exe`/`aot-snapshot` for native, `js` for JavaScript and `wasm` for WebAssembly. There is no JVM backend; Dart interoperates with Java and Kotlin through interop, not by targeting the JVM.",
        },
        {
          id: "dart-why-dart-q9",
          prompt:
            "You add `assert(items.isNotEmpty, 'items must not be empty');` to a hot code path and worry about the cost in production. What actually happens?",
          options: [
            "Nothing: in production the assertion is ignored and neither the condition nor the message is evaluated",
            "The condition runs but the message string is skipped",
            "It throws an `AssertionError` in production just as it does in debug",
            "It is compiled to a no-op but the message string is still allocated",
          ],
          correctIndex: 0,
          explanation:
            "Assertions are a development-only tool: Flutter enables them in debug mode, and in production both the condition and the arguments go unevaluated. That makes them free to leave in — and useless as a production validation mechanism.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "dart-variables-types",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "Variables, Type Inference, `final` and `const`",
      summary:
        "Dart infers types aggressively, so idiomatic Dart looks almost as untyped as JavaScript while being checked as strictly as a fully annotated language. `var` is not JavaScript's `var`: it declares a variable whose type is inferred *once* from the initialiser and then fixed, so `var n = 1; n = 'x';` is a compile error. The genuine escape hatch is `dynamic`, which turns off static checking entirely, and `Object?`, which keeps checking but accepts anything — reaching for `dynamic` when you meant `Object?` is how type errors get deferred to runtime.\n\n`final` and `const` are not two spellings of the same idea. `final` means assigned once, at runtime, and says nothing about what the object contains: a `final List` can still be mutated. `const` means *compile-time constant* — the value has to be knowable when the program is compiled, and the object plus everything it transitively holds is deeply immutable. `const` is also a property of the value, not just the variable: `var xs = const [1, 2];` gives a reassignable variable holding a constant list.\n\nThe gotcha that catches people is laziness in two directions. Top-level and `static` variables are initialised on first use, not at program start, so an expensive global costs nothing until touched. And `const` collections really are unmodifiable — `const [1, 2].add(3)` compiles fine and throws at runtime, because `add` exists on `List` and only the underlying storage refuses.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "dart.dev: Variables", url: "https://dart.dev/language/variables", kind: "docs" },
        { label: "dart.dev: The Dart type system", url: "https://dart.dev/language/type-system", kind: "docs" },
        { label: "dart.dev: Effective Dart — Usage", url: "https://dart.dev/effective-dart/usage", kind: "article" },
      ],
      video: {
        title: "#10 - Dart Variables and the differences between Late, Var, Dynamic, Final & Const",
        channel: "Flutterly",
        url: "https://www.youtube.com/watch?v=Efaq4LvS-es",
        videoId: "Efaq4LvS-es",
        durationLabel: "32:04",
      },
      alternateVideos: [
        {
          title: "Dart Crash Course #3 - Type Annotations",
          channel: "Net Ninja",
          url: "https://www.youtube.com/watch?v=sYG8aTg2a9s",
          videoId: "sYG8aTg2a9s",
          durationLabel: "7:12",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-variables-types-q1",
          prompt:
            "What happens here?\n\n```dart\nvar n = 1;\nn = 'hello';\n```",
          options: [
            "A compile-time error: `n` was inferred as `int`",
            "It works — `var` in Dart is untyped, like JavaScript's `var`",
            "It works, but `n` is silently widened to `Object`",
            "A runtime type error when `n` is next read",
          ],
          correctIndex: 0,
          explanation:
            "`var` means \"infer the type from the initialiser and keep it\". It is closer to TypeScript's `let` with inference than to JavaScript's `var`. Only `dynamic` allows the reassignment.",
        },
        {
          id: "dart-variables-types-q2",
          prompt: "What is the difference between `dynamic` and `Object?`?",
          options: [
            "`dynamic` disables static checking on that value; `Object?` keeps checking and only allows members that exist on `Object`",
            "`dynamic` cannot hold `null`; `Object?` can",
            "They are identical — `dynamic` is an alias for `Object?`",
            "`Object?` disables static checking; `dynamic` is the safe supertype",
          ],
          correctIndex: 0,
          explanation:
            "Both accept any value, but `dynamic` tells the analyser to stop looking, so `d.whatever()` compiles and fails at runtime. `Object?` is the honest \"anything\" type: you must test or cast before calling anything specific.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-variables-types-q3",
          prompt:
            "What does this print?\n\n```dart\nfinal items = [1, 2];\nitems.add(3);\nprint(items.length);\n```",
          options: ["`3`", "`2`", "A compile-time error on `items.add(3)`", "A runtime error on `items.add(3)`"],
          correctIndex: 0,
          explanation:
            "`final` freezes the *binding*, not the object. `items = [4]` would be an error, but mutating the list it points at is fine. Only `const` makes the contents immutable.",
        },
        {
          id: "dart-variables-types-q4",
          prompt:
            "And this?\n\n```dart\nconst items = [1, 2];\nitems.add(3);\nprint(items.length);\n```",
          options: [
            "It compiles, then throws at runtime because a `const` list is unmodifiable",
            "It prints `3` — `const` only prevents reassignment",
            "It prints `2` because `add` silently does nothing on a const list",
            "It is a compile-time error because `add` doesn't exist on a const list",
          ],
          correctIndex: 0,
          explanation:
            "`add` is declared on `List`, so the call type-checks. The const list's backing store refuses the write and throws `UnsupportedError`. A `const` object and everything it holds is deeply immutable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-variables-types-q5",
          prompt: "Which of these are valid at the top level of a Dart file? (Select all that apply.)",
          options: [
            "`const seconds = 60 * 60;`",
            "`final startedAt = DateTime.now();`",
            "`const startedAt = DateTime.now();`",
            "`var list = const [1, 2];`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "Arithmetic on number literals is a compile-time constant, and a `var` can hold a constant value. `DateTime.now()` can only be known at runtime, so it is fine for `final` and illegal for `const`.",
        },
        {
          id: "dart-variables-types-q6",
          prompt: "Why can an instance variable be `final` but never `const`?",
          options: [
            "`const` values must be known at compile time, before any instance exists; class-level constants use `static const` instead",
            "`const` is reserved for collections and cannot be applied to scalars",
            "Instance variables are always nullable, and `const` requires non-nullable types",
            "It is only a style rule enforced by the linter, not the compiler",
          ],
          correctIndex: 0,
          explanation:
            "A per-instance value depends on construction, which happens at runtime. `static const` belongs to the class, not an instance, so it can be a compile-time constant — and a `const` constructor is how you make whole instances constant.",
        },
        {
          id: "dart-variables-types-q7",
          prompt:
            "A top-level variable does expensive work in its initialiser:\n\n```dart\nfinal config = parseHugeConfigFile();\n```\n\nWhen does `parseHugeConfigFile()` run?",
          options: [
            "On the first read of `config`",
            "At program start, before `main()`",
            "Once per isolate, immediately after `main()` returns",
            "Never — top-level `final` requires a `const` initialiser",
          ],
          correctIndex: 0,
          explanation:
            "Top-level and `static` variables are lazily initialised on first use. That makes expensive globals free until touched, and it also means initialisation order depends on access order — a real source of surprise in tests.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-variables-types-q8",
          prompt:
            "What is the effect of the `const` keyword here?\n\n```dart\nvar xs = const [1, 2];\nxs = [3, 4];\n```",
          options: [
            "The first list is a compile-time constant; the variable is still reassignable, so this is legal",
            "It is a compile-time error: a `const` value cannot be stored in a `var`",
            "`xs` becomes implicitly `final`, so the reassignment fails",
            "Both lists become compile-time constants",
          ],
          correctIndex: 0,
          explanation:
            "`const` before a literal makes the *value* constant; it says nothing about the variable. `const xs = [1, 2];` would be the other thing — a constant variable, implicitly final.",
        },
        {
          id: "dart-variables-types-q9",
          prompt: "Which statement about type inference in Dart is correct?",
          options: [
            "An uninitialised `var` declaration with no annotation infers `dynamic`",
            "Omitting a type annotation always means the variable is `dynamic`",
            "Inference only applies to locals, never to fields or return types",
            "`var x = null;` infers `Never`",
          ],
          correctIndex: 0,
          explanation:
            "With no initialiser there is nothing to infer from, so `var x;` is `dynamic` — which is why the lint rules push you to annotate in that case. Elsewhere inference produces a real, fixed type; `var x = null;` infers `Null`, not `Never`.",
        },
        {
          id: "dart-variables-types-q10",
          prompt:
            "Which of these are legal Dart in a current SDK? (Select all that apply.)",
          options: [
            "`const pop = 1_400_000_000;` — digit separators in a number literal",
            "`for (final _ in items) { count++; }` — a wildcard variable",
            "`var x = 0x1F;` — a hexadecimal literal",
            "`let total = 0;` — `let` as a variable declaration",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Digit separators arrived in Dart 3.6 and non-binding `_` wildcards in Dart 3.7; hex literals have always been there. `let` is not a Dart keyword — use `var`, `final` or `const`.",
        },
      ],
    },

    {
      id: "dart-null-safety",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "Sound Null Safety",
      summary:
        "Dart's null safety is sound, which is a stronger claim than TypeScript's `strictNullChecks`. In TypeScript the types are erased before the code runs, and a cast, an `any`, or an untyped JSON payload can smuggle `null` into a variable the compiler believes is non-nullable. In Dart, the compiler and the runtime agree: if the static type is `String`, a `null` cannot be in there, so the compiler is free to stop emitting null checks at all. That is a performance feature as much as a correctness one.\n\nThe cost is that you have to say what you mean. `String?` is the nullable type; `?.`, `??` and `??=` are the ergonomic ways to handle it; `!` is the assertion that throws at runtime if you are wrong. Type promotion does most of the work — after `if (x != null)` a local `String?` is simply a `String` inside the branch — but promotion has hard limits. It does not apply to a mutable field, because something else could write to it between the check and the use, and it never applies to a public field of another class. Copy the field into a local and the promotion works.\n\n`late` is the loaded gun. It tells the compiler \"trust me, this will be non-null before anyone reads it\", moving a compile-time guarantee to a runtime crash. It has a legitimate use — a field genuinely initialised in a lifecycle callback rather than a constructor — and a lazy-initialisation use where `late final x = expensive();` runs on first read. Used to silence an inconvenient error, it converts a bug the compiler would have found into one a user finds.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "dart.dev: Sound null safety", url: "https://dart.dev/null-safety", kind: "docs" },
        { label: "dart.dev: Understanding null safety", url: "https://dart.dev/null-safety/understanding-null-safety", kind: "article" },
        { label: "dart.dev: Fixing type promotion failures", url: "https://dart.dev/tools/non-promotion-reasons", kind: "docs" },
      ],
      video: {
        title: "#9 - Understanding Null Safety in Dart - Type Promotions, Null Assertion, Late, Required",
        channel: "Flutterly",
        url: "https://www.youtube.com/watch?v=ZZ4VVlggIVk",
        videoId: "ZZ4VVlggIVk",
        durationLabel: "27:21",
      },
      alternateVideos: [
        {
          title: "Null safety in Dart - Introduction",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=iYhOU9AuaFs",
          videoId: "iYhOU9AuaFs",
          durationLabel: "5:27",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-null-safety-q1",
          prompt: "What makes Dart's null safety *sound*, where TypeScript's `strictNullChecks` is not?",
          options: [
            "The runtime enforces the same guarantee as the compiler, so a non-nullable type can never hold null at execution time",
            "Dart forbids `null` entirely; there is no null value in the language",
            "Dart checks nullability at compile time only, but with stricter rules",
            "Dart requires an explicit annotation on every variable, so nothing can be missed",
          ],
          correctIndex: 0,
          explanation:
            "TypeScript's types are erased, so a cast or an `any` can put `null` in a `string`. Dart's guarantee holds at runtime too, which lets the compiler omit null checks from generated code.",
        },
        {
          id: "dart-null-safety-q2",
          prompt:
            "Why does this fail to compile, and what is the smallest correct fix?\n\n```dart\nclass Profile {\n  String? name;\n  int nameLength() {\n    if (name != null) {\n      return name.length; // error here\n    }\n    return 0;\n  }\n}\n```",
          options: [
            "`name` is a mutable field so it can't promote; copy it into a local first: `final n = name;`",
            "Promotion never works inside a method; move the check to the constructor",
            "`length` doesn't exist on `String?`; change the return type to `int?`",
            "The field needs `late`, which enables promotion",
          ],
          correctIndex: 0,
          explanation:
            "Something else could reassign `name` between the check and the read, so Dart refuses to promote a mutable field. A local variable can't be changed by anyone else, so `final n = name; if (n != null) return n.length;` promotes cleanly. Marking the field `final` also works.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-null-safety-q3",
          prompt:
            "What does this evaluate to?\n\n```dart\nString? s;\nfinal n = s?.trim().length;\n```",
          options: [
            "`null`, because `?.` short-circuits the whole rest of the chain",
            "`0`, because `trim()` on null returns an empty string",
            "A runtime error, because `.length` is called on null",
            "A compile-time error, because `?.` cannot be followed by more calls",
          ],
          correctIndex: 0,
          explanation:
            "When the receiver of `?.` is null, the entire remaining chain is skipped and the expression is `null`. You do not need `s?.trim()?.length` — one `?.` guards everything after it in that chain.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-null-safety-q4",
          prompt: "What are the two distinct jobs the `late` modifier does?",
          options: [
            "Deferring the non-null check to first read, and making an initialiser lazy so it runs on first access",
            "Making a variable nullable, and deferring its type inference",
            "Making a field thread-safe, and caching its value across isolates",
            "Allowing reassignment of a `final`, and skipping the constructor",
          ],
          correctIndex: 0,
          explanation:
            "`late String description;` promises the value will exist before anyone reads it. `late String temperature = readThermometer();` additionally defers the initialiser until first read, which is how you make an expensive field lazy.",
        },
        {
          id: "dart-null-safety-q5",
          prompt:
            "What happens when this runs?\n\n```dart\nlate final String token;\n\nvoid main() {\n  token = 'a';\n  token = 'b';\n  print(token);\n}\n```",
          options: [
            "A runtime error on the second assignment: a `late final` can only be written once",
            "It prints `b` — `late` removes the single-assignment rule",
            "A compile-time error on the second assignment",
            "It prints `a`; the second assignment is silently ignored",
          ],
          correctIndex: 0,
          explanation:
            "`late final` moves the single-assignment check from compile time to runtime — it does not remove it. Writing twice throws, and reading before any write throws too.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-null-safety-q6",
          prompt: "What does `!` actually compile to?",
          options: [
            "A runtime check that throws if the value is null, and otherwise yields the non-nullable type",
            "A compile-time cast with no runtime cost",
            "A silent coercion of null to the type's default value",
            "The same thing as `?? throw`, but only in debug builds",
          ],
          correctIndex: 0,
          explanation:
            "The null-assertion operator is an assertion the runtime really performs — that's what keeps the system sound. It is not free and it is not erased; if you are wrong, it throws where you wrote it rather than three frames later.",
        },
        {
          id: "dart-null-safety-q7",
          prompt: "Which of these resolve a \"field can't be promoted\" analyser error? (Select all that apply.)",
          options: [
            "Assigning the field to a local variable and testing that",
            "Making the field `final`",
            "Making the field private (`_name`) and `final`",
            "Adding `?` to the field's type",
            "Wrapping the read in `try`/`catch`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Promotion needs a binding nobody else can change: a local, or a final field (private final fields have promoted since Dart 3.2, including from outside the class). Adding `?` makes it *more* nullable, and `try`/`catch` has nothing to do with static promotion.",
        },
        {
          id: "dart-null-safety-q8",
          prompt:
            "What is the difference between `a ?? b` and `a ??= b`?",
          options: [
            "`??` returns `b` when `a` is null; `??=` additionally assigns `b` back into `a`",
            "`??` works on any value; `??=` only works on nullable fields",
            "`??=` evaluates `b` eagerly; `??` evaluates it lazily",
            "They are equivalent; `??=` is only shorter",
          ],
          correctIndex: 0,
          explanation:
            "`??=` is the compound assignment form, useful for lazy caching: `_cache ??= compute();`. Both short-circuit — the right-hand side is not evaluated when the left is non-null.",
        },
        {
          id: "dart-null-safety-q9",
          prompt: "What is the `Never` type for?",
          options: [
            "It is the bottom type, used for expressions that never return — a function that always throws",
            "It is an alias for `void`",
            "It marks a variable that can only hold `null`",
            "It is the supertype of every type, including `dynamic`",
          ],
          correctIndex: 0,
          explanation:
            "`Never` has no values, so a `Never`-returning call tells flow analysis that the code after it is unreachable. `Null` is the type whose only value is `null`; `Object?` is the top type.",
        },
        {
          id: "dart-null-safety-q10",
          prompt:
            "A team lead rejects a PR that adds `late` to six fields to clear analyser errors. What is the strongest argument?",
          options: [
            "Each `late` converts a compile-time guarantee into a runtime crash, hiding exactly the bugs null safety exists to catch",
            "`late` fields cannot be used inside constructors, so the code will not build in release mode",
            "`late` disables type inference on those fields, so they become `dynamic`",
            "`late` fields are re-initialised on every read, which is a performance problem",
          ],
          correctIndex: 0,
          explanation:
            "`late` is a promise the compiler cannot check. It is right when a value genuinely arrives after construction; it is wrong when it is used to make an error message go away, because the failure just moves to a user's device.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-null-safety-q11",
          prompt:
            "You decode JSON into `Map<String, dynamic>` and write `final name = json['name'] as String;`. What is the null-safety risk?",
          options: [
            "The cast throws at runtime if the key is missing or null, because `dynamic` bypassed static checking",
            "Nothing — the cast is checked at compile time",
            "`json['name']` returns `String?`, so the cast is always safe",
            "The cast silently produces an empty string when the key is absent",
          ],
          correctIndex: 0,
          explanation:
            "`dynamic` is where soundness is *enforced* rather than proven: the analyser says nothing, and the runtime cast throws. Decoding through `as String?` plus an explicit fallback, or a pattern match on the map, makes the missing case visible.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-null-safety-q12",
          prompt:
            "In a named-parameter list, what does `required` do?",
          options: [
            "It makes a named parameter mandatory at the call site; without it named parameters are optional",
            "It makes a parameter non-nullable; nullable parameters are always optional",
            "It forces the argument to be a compile-time constant",
            "It is only needed on parameters whose type is nullable",
          ],
          correctIndex: 0,
          explanation:
            "Named parameters default to optional, which forces either a default value or a nullable type. `required` is what lets a named parameter be non-nullable with no default — and it is a keyword now, not the old `@required` annotation.",
        },
      ],
    },

    {
      id: "dart-collections",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "Lists, Sets, Maps and Collection Literals",
      summary:
        "Dart's three core collections map onto familiar JavaScript shapes — `List` is an array, `Set` is a `Set`, `Map` is a `Map` — but the literal syntax overlaps in a way that trips people immediately: `{}` is an empty **Map**, not a Set, because map literals existed first. An empty set needs a type argument (`<String>{}`) or a typed variable. Maps keep insertion order by default, like JavaScript's, and unlike a plain object.\n\nThe deeper difference is laziness. `Iterable` is Dart's sequence abstraction, and `map`, `where` and `expand` return lazy iterables that do no work until something iterates them. Chaining five transforms allocates nothing and runs nothing; `.toList()` or a `for-in` is what forces the pipeline. That's closer to a generator chain than to `Array.prototype.map`, and the practical consequence is that a `map` with a side effect may never run, or may run twice if you iterate the result twice.\n\nLiterals carry real expressive power that JS handles with `concat`, `filter` and ternaries: the spread `...`, the null-aware spread `...?`, `if` and `for` elements inside a literal, and (from Dart 3.8) the null-aware element `?value` that omits a null instead of inserting it. The performance gotcha worth knowing is `List.filled(n, <int>[])`, which puts the *same* list object in every slot — and that `List.filled` is fixed-length unless you pass `growable: true`, so a later `add` throws.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "dart.dev: Collections", url: "https://dart.dev/language/collections", kind: "docs" },
        { label: "dart.dev: Iterable collections", url: "https://dart.dev/libraries/collections/iterables", kind: "docs" },
        { label: "Dart API: Iterable class", url: "https://api.dart.dev/dart-core/Iterable-class.html", kind: "docs" },
        { label: "dart.dev: Effective Dart — Usage", url: "https://dart.dev/effective-dart/usage", kind: "article" },
      ],
      video: {
        title: "#11 - Dart Built-in Types - num, int, double, String, List, Set, Map & Runes",
        channel: "Flutterly",
        url: "https://www.youtube.com/watch?v=fXMX7frTKIA",
        videoId: "fXMX7frTKIA",
        durationLabel: "39:53",
      },
      alternateVideos: [
        {
          title: "Dart Features For Better Code: Spreads, Collection-If, Collection-For",
          channel: "Andrea Bizzotto",
          url: "https://www.youtube.com/watch?v=mnaN_6465Gk",
          videoId: "mnaN_6465Gk",
          durationLabel: "7:21",
        },
        {
          title: "Dart Crash Course #5 - Lists & Sets",
          channel: "Net Ninja",
          url: "https://www.youtube.com/watch?v=OjX0lOCn-8Q",
          videoId: "OjX0lOCn-8Q",
          durationLabel: "10:20",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-collections-q1",
          prompt:
            "What is the static type of `x`?\n\n```dart\nvar x = {};\n```",
          options: [
            "`Map<dynamic, dynamic>`",
            "`Set<dynamic>`",
            "`List<dynamic>`",
            "It is a compile-time error — the literal is ambiguous",
          ],
          correctIndex: 0,
          explanation:
            "Map literals came first, so bare `{}` defaults to `Map`. For an empty set you need `<String>{}` or `Set<String> names = {};` — this bites almost everyone once.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-collections-q2",
          prompt:
            "What does this print?\n\n```dart\nfinal ids = [1, 2, 3];\nfinal doubled = ids.map((i) {\n  print('mapping $i');\n  return i * 2;\n});\nprint('built');\n```",
          options: [
            "`built` only — nothing is mapped, because `map` returns a lazy `Iterable`",
            "`mapping 1`, `mapping 2`, `mapping 3`, then `built`",
            "`built`, then `mapping 1`, `mapping 2`, `mapping 3`",
            "A compile-time error: the callback must return before `print`",
          ],
          correctIndex: 0,
          explanation:
            "Unlike `Array.prototype.map`, `Iterable.map` is lazy: the callback runs only when the result is iterated. Add `.toList()` or a `for-in` and the three lines appear.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-collections-q3",
          prompt:
            "What does this produce?\n\n```dart\nfinal base = [1, 2];\nList<int>? extra;\nfinal all = [0, ...base, ...?extra, 9];\n```",
          options: [
            "`[0, 1, 2, 9]`",
            "`[0, 1, 2, null, 9]`",
            "A runtime error, because `extra` is null",
            "A compile-time error: `...?` is not valid Dart",
          ],
          correctIndex: 0,
          explanation:
            "`...?` is the null-aware spread: a null operand contributes nothing. Plain `...` on a nullable value is a compile-time error, which is the analyser pushing you toward the null-aware form.",
        },
        {
          id: "dart-collections-q4",
          prompt:
            "What is `rows`?\n\n```dart\nfinal showAll = false;\nfinal rows = [\n  'header',\n  for (final n in [1, 2]) 'row $n',\n  if (showAll) 'footer',\n];\n```",
          options: ["`['header', 'row 1', 'row 2']`", "`['header', 'row 1', 'row 2', 'footer']`", "`['header', 'row 1', 'row 2', null]`", "A compile-time error: `for` is not allowed inside a list literal"],
          correctIndex: 0,
          explanation:
            "Collection-`for` and collection-`if` are elements, not statements: a false `if` contributes nothing at all rather than a null. This is how Dart replaces the `[...a, ...(cond ? [x] : [])]` dance.",
        },
        {
          id: "dart-collections-q5",
          prompt:
            "What is the length of `grid[0]` after this?\n\n```dart\nfinal grid = List.filled(3, <int>[]);\ngrid[0].add(1);\n```",
          options: [
            "`1`, and `grid[1]` and `grid[2]` also have length 1",
            "`1`, while `grid[1]` and `grid[2]` stay empty",
            "`0`, because `List.filled` copies the fill value",
            "A runtime error, because `List.filled` produces a fixed-length list",
          ],
          correctIndex: 0,
          explanation:
            "`List.filled` stores the *same* object reference in every slot. Use `List.generate(3, (_) => <int>[])` when each element must be distinct. The fixed-length restriction applies to `grid` itself, not to the inner lists.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-collections-q6",
          prompt: "What happens on the `add` here?\n\n```dart\nfinal slots = List.filled(3, 0);\nslots.add(4);\n```",
          options: [
            "A runtime `UnsupportedError`: `List.filled` is fixed-length unless `growable: true`",
            "It works — Dart lists are always growable",
            "A compile-time error: `add` is not defined on a fixed-length list",
            "It works, but silently replaces the last element",
          ],
          correctIndex: 0,
          explanation:
            "`growable` defaults to `false` on `List.filled`. The type is still `List<int>`, so `add` type-checks and the failure is at runtime — a good example of why the analyser cannot catch everything.",
        },
        {
          id: "dart-collections-q7",
          prompt: "Which statements about Dart `Map` are true? (Select all that apply.)",
          options: [
            "The default implementation preserves insertion order when iterated",
            "Keys may be of any type, and equality uses `==` and `hashCode`",
            "Reading a missing key returns `null` rather than throwing",
            "Iterating a map yields `MapEntry` objects from `entries`, and `keys`/`values` are lazy iterables",
            "Keys are automatically converted to strings, as with a JavaScript object",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Dart's default `Map` is insertion-ordered and keyed by `==`/`hashCode` on arbitrary objects — which is why overriding `==` without `hashCode` breaks map lookups. Nothing is stringified; that is a plain JavaScript object, not a `Map`.",
        },
        {
          id: "dart-collections-q8",
          prompt:
            "What does the `?` do in this Dart 3.8+ literal?\n\n```dart\nString? nickname;\nfinal names = ['Ada', ?nickname, 'Grace'];\n```",
          options: [
            "It is a null-aware element: a null value is omitted instead of being inserted",
            "It marks the list as nullable",
            "It is a shorthand for `nickname ?? ''`",
            "It is invalid syntax; only `...?` exists",
          ],
          correctIndex: 0,
          explanation:
            "Null-aware elements were added in Dart 3.8 and work in list, set and map literals (including on a map key or value). They remove the `if (x != null) x` boilerplate.",
        },
        {
          id: "dart-collections-q9",
          prompt: "You need to check membership of ten thousand ids many times per frame. Which is the right structure and why?",
          options: [
            "A `Set`, because `contains` is a hash lookup rather than a linear scan",
            "A `List`, because `contains` on a list is optimised to a binary search",
            "A `Map` with `true` values, because `Set` has no `contains`",
            "Any of them — all three have the same `contains` cost in Dart",
          ],
          correctIndex: 0,
          explanation:
            "`List.contains` walks the list element by element. `Set.contains` hashes. The same reasoning as JavaScript, but it comes up more in Dart because `List` is the default literal and people reach for it reflexively.",
        },
        {
          id: "dart-collections-q10",
          prompt:
            "What is the relationship between `List`, `Set` and `Iterable`?",
          options: [
            "`List` and `Set` both implement `Iterable`, which defines `map`, `where`, `fold` and the rest of the lazy pipeline",
            "`Iterable` implements `List`, adding lazy evaluation on top",
            "`Set` extends `List` with uniqueness; `Iterable` is unrelated",
            "`Iterable` is a marker interface with no members",
          ],
          correctIndex: 0,
          explanation:
            "`Iterable` is where the transformation methods live, which is why `map` on a `Set` gives you back an `Iterable` rather than a `Set` — and why so much Dart code ends in `.toList()` or `.toSet()`.",
        },
      ],
    },

    {
      id: "dart-functions-parameters",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "Functions, Named and Optional Parameters",
      summary:
        "Dart's named arguments look like a JavaScript options object and are nothing like one. `Widget build({required Key key, double? width})` declares real parameters: each has its own type, its own default, and its own required-ness, and the call site `build(key: k, width: 4)` allocates no object and is fully checked. In JavaScript you pass one bag and destructure it; in Dart the names *are* the signature — which also means renaming a named parameter is a breaking API change in a way that renaming a destructured property inside a function is not.\n\nThere are two flavours of optional parameter and you cannot mix them in the same signature: optional positional in square brackets, `greet(String name, [String? title])`, and named in braces, `greet(String name, {String? title})`. Named parameters are optional by default, so a non-nullable named parameter needs either a default value or `required`. Defaults use `=`; the old `:` form was removed in Dart 3, which is why some older snippets no longer compile.\n\nThe closure gotcha is the pleasant kind: unlike JavaScript's `var`, Dart's `for` loop closures capture the value of the loop variable for that iteration, so the classic `for (var i = 0; i < 3; i++) fns.add(() => i)` prints `0 1 2`, not `3 3 3`. Everything else is familiar — functions are first-class, tear-offs let you write `xs.forEach(print)`, and `=>` is sugar for a single-expression body.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "dart.dev: Functions", url: "https://dart.dev/language/functions", kind: "docs" },
        { label: "dart.dev: Effective Dart — Design", url: "https://dart.dev/effective-dart/design", kind: "article" },
        { label: "dart.dev: Typedefs", url: "https://dart.dev/language/typedefs", kind: "docs" },
      ],
      video: {
        title: "#12 - Dart Functions - Anonymous Functions, Positional & Named Parameters, Lambdas, Closures, Scope",
        channel: "Flutterly",
        url: "https://www.youtube.com/watch?v=xL_uC8qm2L4",
        videoId: "xL_uC8qm2L4",
        durationLabel: "19:30",
      },
      alternateVideos: [
        {
          title: "Dart Crash Course #4 - Functions",
          channel: "Net Ninja",
          url: "https://www.youtube.com/watch?v=NsrlCADdWdw",
          videoId: "NsrlCADdWdw",
          durationLabel: "9:07",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-functions-parameters-q1",
          prompt:
            "Why does this fail to compile?\n\n```dart\nvoid send(String body, {int retries}) {}\n```",
          options: [
            "Named parameters are optional by default, so `retries` needs `required`, a default, or a nullable type",
            "Named parameters must come before positional ones",
            "`int` is not allowed as a named parameter type",
            "A function with a named parameter must return a value",
          ],
          correctIndex: 0,
          explanation:
            "An optional non-nullable parameter has no value to fall back to. Write `{required int retries}`, `{int retries = 3}` or `{int? retries}` — the choice is a real API decision, not boilerplate.",
        },
        {
          id: "dart-functions-parameters-q2",
          prompt: "How do Dart's named parameters differ from a JavaScript options object?",
          options: [
            "They are part of the function's signature: individually typed, individually optional, and checked at the call site with no object allocated",
            "They are the same thing — Dart desugars them into a `Map` argument",
            "They must all be nullable, because a caller can omit any of them",
            "They can only be used on top-level functions, not methods or constructors",
          ],
          correctIndex: 0,
          explanation:
            "A JS options bag is one runtime object whose shape the callee inspects. Dart's named parameters are compiled positions with names, so they cost nothing and the analyser knows exactly which are missing. The tradeoff: their names are public API.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-functions-parameters-q3",
          prompt:
            "What does this print in current Dart?\n\n```dart\nfinal fns = <void Function()>[];\nfor (var i = 0; i < 3; i++) {\n  fns.add(() => print(i));\n}\nfor (final f in fns) f();\n```",
          options: ["`0 1 2`", "`3 3 3`", "`2 2 2`", "A compile-time error: `i` escapes its scope"],
          correctIndex: 0,
          explanation:
            "Closures in a Dart `for` loop capture the value of the loop variable for that iteration, so there is no `var`-versus-`let` trap here. The equivalent JavaScript with `var` would print `3 3 3`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-functions-parameters-q4",
          prompt: "Which signature is illegal in Dart?",
          options: [
            "`void f(int a, [int b = 1], {int c = 2})`",
            "`void f(int a, [int b = 1, int c = 2])`",
            "`void f(int a, {int b = 1, int c = 2})`",
            "`void f({required int a, int b = 1})`",
          ],
          correctIndex: 0,
          explanation:
            "A function can have optional positional parameters *or* named parameters, never both. Required positional parameters can be combined with either group.",
        },
        {
          id: "dart-functions-parameters-q5",
          prompt:
            "A tutorial from 2021 contains `void f({int count: 0})` and it no longer compiles. Why?",
          options: [
            "Dart 3 made `:` before a default value a compile-time error; use `=`",
            "Named parameters can no longer have default values at all",
            "`int` defaults must now be `const`",
            "The parameter needs `required`, which replaced default values",
          ],
          correctIndex: 0,
          explanation:
            "`:` as the default-value separator was deprecated for years and removed in Dart 3. It is a reliable marker that a snippet predates Dart 3 and may be stale in other ways too.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-functions-parameters-q6",
          prompt: "What is a tear-off?",
          options: [
            "Referring to a method or constructor by name to get a function value, e.g. `xs.forEach(print)`",
            "A closure that captures no variables and so can be shared",
            "An anonymous function written with `=>`",
            "A function whose parameters are all optional",
          ],
          correctIndex: 0,
          explanation:
            "`print` alone is the function object; `(x) => print(x)` is a wrapper around it. Dart also supports constructor tear-offs (`Point.new`) and generic tear-offs.",
        },
        {
          id: "dart-functions-parameters-q7",
          prompt: "Which of these are true about calling a function with named arguments? (Select all that apply.)",
          options: [
            "The arguments may be written in any order at the call site",
            "They are evaluated in the order they appear at the call site",
            "Omitting a `required` named argument is a compile-time error",
            "Passing a named argument the function doesn't declare is a compile-time error",
            "Named arguments may be passed positionally if the order matches the declaration",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Order is free at the call site but evaluation follows the written order, which matters when arguments have side effects. A named parameter can *only* be passed by name — there is no positional fallback.",
        },
        {
          id: "dart-functions-parameters-q8",
          prompt: "How do you write the type of \"a function taking an `int` and returning a `String`\"?",
          options: [
            "`String Function(int)`",
            "`(int) => String`",
            "`Function<int, String>`",
            "`Func<int, String>`",
          ],
          correctIndex: 0,
          explanation:
            "Dart's function type syntax reads like a declaration with the name removed. `typedef Formatter = String Function(int);` gives it a name; the arrow form is only for function *bodies*, not types.",
        },
        {
          id: "dart-functions-parameters-q9",
          prompt:
            "What does the `_` mean in this Dart 3.7+ code?\n\n```dart\nitems.fold(0, (sum, _) => sum + 1);\n```",
          options: [
            "A wildcard parameter: non-binding, so the name can even be reused without collision",
            "A private parameter, visible only inside the library",
            "A parameter whose type is inferred as `dynamic`",
            "A placeholder that must still be referenced somewhere in the body",
          ],
          correctIndex: 0,
          explanation:
            "Since Dart 3.7 a local or parameter named `_` binds nothing, so `(_, _) => 0` is legal where it used to be a duplicate-name error. Before 3.7, `_` was an ordinary (if conventional) variable name.",
        },
        {
          id: "dart-functions-parameters-q10",
          prompt:
            "In Dart 3.12+, what does this constructor let callers write?\n\n```dart\nclass Point {\n  final int _x;\n  final int _y;\n  Point({required this._x, required this._y});\n}\n```",
          options: [
            "`Point(x: 1, y: 2)` — the leading underscore is stripped to derive the public parameter name",
            "`Point(_x: 1, _y: 2)` — private names are used verbatim at the call site",
            "Nothing: private fields still cannot be initialising formals",
            "`Point(1, 2)` — private named parameters become positional",
          ],
          correctIndex: 0,
          explanation:
            "Private named parameters (Dart 3.12) let a private field be an initialising formal while exposing an unprefixed public name. Before this you had to take a public parameter and assign it in the initialiser list.",
        },
      ],
    },

    {
      id: "dart-classes-constructors",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "Classes, Constructors and Initialiser Lists",
      summary:
        "Dart gives constructors far more structure than JavaScript's single `constructor` method. Initialising formals (`Point(this.x, this.y);`) assign a parameter straight to a field with no body at all. Named constructors (`Point.origin()`) give a class several clearly-labelled ways to be built instead of one overloaded entry point. Factory constructors return an instance rather than creating one, so they can hand back a cache entry, a subtype, or a parsed value — the `Logger('ui')` singleton-per-name pattern is a factory, not a static method, precisely so callers don't have to care.\n\nThe ordering rules matter because non-nullable final fields have to be set before anything can observe them. The initialiser list runs first, before the superclass constructor and before the body, and its right-hand side cannot touch `this` — nothing is initialised yet. That is also why factory constructors cannot use `this`: there is no instance until they return one. `assert` in an initialiser list is the idiomatic place for constructor preconditions, and super parameters (`super.key`) forward to the superclass without restating every argument.\n\nTwo modern conveniences change how new code reads. Dart 3.12's private named parameters let `Point({required this._x})` be called as `Point(x: 1)`. Dart 3.13's primary constructors declare fields and the main constructor in the header — `class Point(var int x, var int y);` — where a parameter without `var`/`final` stays an ordinary parameter and induces no field. Both are recent enough that almost every tutorial online still shows the long form.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "dart.dev: Constructors", url: "https://dart.dev/language/constructors", kind: "docs" },
        { label: "dart.dev: Primary constructors", url: "https://dart.dev/language/primary-constructors", kind: "docs" },
        { label: "Code with Andrea: Dart Primary Constructors", url: "https://codewithandrea.com/articles/dart-primary-constructors/", kind: "article" },
      ],
      video: {
        title: "Dart Classes Explained I - All Fields, Methods, Constructors, Operators, Getters/Setters & Singleton",
        channel: "Flutterly",
        url: "https://www.youtube.com/watch?v=7rfehxYBukk",
        videoId: "7rfehxYBukk",
        durationLabel: "37:15",
      },
      alternateVideos: [
        {
          title: "Factory Constructor in Dart | Dart factory constructor | Dart Tutorials #38",
          channel: "Flutter Teacher",
          url: "https://www.youtube.com/watch?v=vTC-jTkF1Ik",
          videoId: "vTC-jTkF1Ik",
          durationLabel: "34:18",
        },
        {
          title: "Dart Crash Course #8 - Classes",
          channel: "Net Ninja",
          url: "https://www.youtube.com/watch?v=R5wAK_kgqjo",
          videoId: "R5wAK_kgqjo",
          durationLabel: "14:06",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-classes-constructors-q1",
          prompt:
            "What does `this.x` mean here, and when does the assignment happen?\n\n```dart\nclass Point {\n  final double x;\n  final double y;\n  Point(this.x, this.y);\n}\n```",
          options: [
            "It is an initialising formal: the parameter is assigned to the field before the constructor body runs",
            "It is a normal parameter; the assignment happens when `x` is first read",
            "It declares a new field named `x` shadowing the class field",
            "It is a compile-time error — `final` fields must be set in an initialiser list",
          ],
          correctIndex: 0,
          explanation:
            "Initialising formals exist specifically so `final` and non-nullable fields can be set without a body. There is no body here at all, which is idiomatic Dart.",
        },
        {
          id: "dart-classes-constructors-q2",
          prompt:
            "Why is this a compile-time error?\n\n```dart\nclass Circle {\n  final double r;\n  final double area;\n  Circle(this.r) : area = 3.14 * this.r * this.r;\n}\n```",
          options: [
            "The right-hand side of an initialiser list cannot access `this`; write `r` without `this.`",
            "`area` must be `late` because it is derived",
            "An initialiser list may only contain one assignment",
            "`final` fields cannot be computed from other fields",
          ],
          correctIndex: 0,
          explanation:
            "The initialiser list runs before the instance is fully formed, so `this` is off limits there — but the *parameter* `r` is in scope, so `: area = 3.14 * r * r` compiles. The same restriction applies to arguments passed to a superclass constructor.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-classes-constructors-q3",
          prompt: "What can a factory constructor do that a generative constructor cannot? (Select all that apply.)",
          options: [
            "Return an already-existing instance from a cache",
            "Return an instance of a subtype",
            "Run arbitrary logic before deciding what to return",
            "Access `this` before returning",
            "Be invoked with `new` or bare, like any other constructor",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A factory *returns* an object instead of initialising one, so caching and subtype dispatch are its whole point. It has no `this` — there is no instance yet. Both kinds are called the same way, which is why a factory is a non-breaking replacement for a generative constructor.",
        },
        {
          id: "dart-classes-constructors-q4",
          prompt:
            "`Vehicle` defines `Vehicle.fromJson(Map json)`. `Car extends Vehicle`. Can you call `Car.fromJson({})`?",
          options: [
            "No — named constructors are not inherited; `Car` must declare its own",
            "Yes — all superclass constructors are inherited by subclasses",
            "Only if `Vehicle.fromJson` is declared `factory`",
            "Only if `Car` declares no constructors of its own",
          ],
          correctIndex: 0,
          explanation:
            "Constructors are never inherited in Dart. A subclass declares its own and forwards with `: super.fromJson(json)` if it wants the parent's behaviour — which is why every Flutter widget subclass restates its constructor.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-classes-constructors-q5",
          prompt: "What does a redirecting constructor look like, and what constraint does it carry?",
          options: [
            "`Point.origin() : this(0, 0);` — it must have an empty body",
            "`Point.origin() { this(0, 0); }` — the call must be the first statement",
            "`Point.origin() => Point(0, 0);` — it returns a new instance",
            "`factory Point.origin() : this(0, 0);` — redirection requires `factory`",
          ],
          correctIndex: 0,
          explanation:
            "A generative redirecting constructor delegates entirely to another constructor in the same class, so there is nothing left for a body to do. A *redirecting factory* uses `= OtherClass;` and can target a different class.",
        },
        {
          id: "dart-classes-constructors-q6",
          prompt: "When does a class get an implicit default constructor?",
          options: [
            "Only when it declares no constructors at all",
            "Always, in addition to any constructors you declare",
            "Only when all its fields have initialisers",
            "Never — every Dart class must declare at least one constructor",
          ],
          correctIndex: 0,
          explanation:
            "Declaring any constructor, including a named one, removes the implicit no-argument default. That is why adding `Point.origin()` can break callers who were writing `Point()`.",
        },
        {
          id: "dart-classes-constructors-q7",
          prompt:
            "What does `super.key` do here?\n\n```dart\nclass Child extends Parent {\n  Child({super.key, required this.label});\n  final String label;\n}\n```",
          options: [
            "It is a super parameter: the argument is forwarded straight to the superclass constructor",
            "It reads the superclass's `key` field into a local",
            "It overrides the superclass's `key` with a new field on `Child`",
            "It is shorthand for `: super(key: key)` but only works for positional parameters",
          ],
          correctIndex: 0,
          explanation:
            "Super parameters remove the `Child({Key? key}) : super(key: key)` boilerplate. They work for both positional and named parameters, with the restriction that you can't mix a positional super parameter with an explicit `super(...)` call.",
        },
        {
          id: "dart-classes-constructors-q8",
          prompt: "Where do constructor preconditions idiomatically go?",
          options: [
            "In an `assert` in the initialiser list, e.g. `Circle(this.r) : assert(r > 0);`",
            "In the constructor body, throwing `ArgumentError`, because asserts are stripped in release",
            "In a `static` validation method called before construction",
            "In the field declarations themselves",
          ],
          correctIndex: 0,
          explanation:
            "`assert` in the initialiser list is the standard idiom and is what the Flutter SDK uses — it documents and enforces the invariant in development at zero production cost. Throwing in the body is the right choice when the input is untrusted data rather than a programming error.",
        },
        {
          id: "dart-classes-constructors-q9",
          prompt:
            "In Dart 3.13, what does this declare?\n\n```dart\nclass Point(var int x, var int y);\n```",
          options: [
            "A primary constructor: fields `x` and `y` plus the main constructor, in the header",
            "A record type alias named `Point`",
            "A constructor whose parameters are two mutable locals but no fields",
            "An extension type wrapping a pair of ints",
          ],
          correctIndex: 0,
          explanation:
            "Primary constructors (Dart 3.13) are pure shorthand — runtime behaviour is unchanged. A parameter *without* `var` or `final`, as in `class User(String name);`, does not induce a field; it behaves like an ordinary constructor parameter.",
        },
        {
          id: "dart-classes-constructors-q10",
          prompt:
            "Which is the better reason to expose `Logger('network')` as a factory rather than `Logger.get('network')` as a static method?",
          options: [
            "Callers use ordinary constructor syntax, so caching can be added or removed without changing a single call site",
            "Factory constructors are faster than static methods",
            "Static methods cannot return instances of their own class",
            "A factory guarantees only one instance ever exists",
          ],
          correctIndex: 0,
          explanation:
            "The factory keyword exists so that \"how the instance is obtained\" is an implementation detail. Nothing about it guarantees a singleton — the caching is code you write inside it.",
        },
      ],
    },

    {
      id: "dart-const-constructors",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "`const` Constructors and Canonicalisation",
      summary:
        "This is the Dart feature that exists mostly to serve Flutter, and the one a JavaScript developer is most likely to misread. `const` on a constructor does not mean \"the reference can't be reassigned\" — it means the instance can be built at compile time, and that two structurally identical const instances are *the same object*. `identical(const Point(1, 1), const Point(1, 1))` is `true`. The compiler builds one canonical instance and hands out the same pointer everywhere it appears.\n\nThe requirements follow from that: every instance field must be `final`, the constructor must have no body, and every argument must itself be a compile-time constant. A const constructor does not force const usage — `Point(1, 1)` without the keyword builds an ordinary, non-canonical object from the same declaration. Inside a const context (a const collection, another const constructor's arguments) the inner `const` may be omitted, which is why a large const tree often has the keyword only at the root.\n\nThe payoff is identity. A framework that rebuilds a tree of objects on every state change can compare old and new with `identical` and skip an entire subtree the instant the pointers match — an O(1) check that no amount of deep equality would beat. That is why `prefer_const_constructors` is a real performance lint rather than a style preference, and why immutability is not decoration in Dart: it is what makes the identity shortcut sound.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "dart.dev: Constant constructors", url: "https://dart.dev/language/constructors", kind: "docs" },
        { label: "dart.dev: Using constructors (canonical instances)", url: "https://dart.dev/language/classes", kind: "docs" },
        { label: "dart.dev: Linter rule prefer_const_constructors", url: "https://dart.dev/tools/linter-rules/prefer_const_constructors", kind: "docs" },
        { label: "dart.dev: Effective Dart — Usage", url: "https://dart.dev/effective-dart/usage", kind: "article" },
      ],
      video: {
        title: "Dart \"const\" Tutorial – All You Need to Know (Const Expressions, Constructors, Canonical Instances)",
        channel: "Reso Coder",
        url: "https://www.youtube.com/watch?v=B1fIqdqwWw8",
        videoId: "B1fIqdqwWw8",
        durationLabel: "21:26",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-const-constructors-q1",
          prompt:
            "What does this print?\n\n```dart\nclass P {\n  final int x;\n  const P(this.x);\n}\n\nvoid main() {\n  print(identical(const P(1), const P(1)));\n}\n```",
          options: ["`true`", "`false`", "`null`", "A compile-time error: `identical` needs `==` to be overridden"],
          correctIndex: 0,
          explanation:
            "Two identical compile-time constants are canonicalised to a single instance, so they are the same object. This is the core of the feature — not just equality, but identity.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-const-constructors-q2",
          prompt:
            "And this, with the same class `P`?\n\n```dart\nprint(identical(P(1), P(1)));\n```",
          options: [
            "`false` — without `const` these are two ordinary instances",
            "`true` — a class with a const constructor is always canonicalised",
            "A compile-time error: a const constructor must be invoked with `const`",
            "`true` in release builds, `false` in debug",
          ],
          correctIndex: 0,
          explanation:
            "Constant constructors don't always create constants. Dropping the keyword gives a normal object — which is exactly the mistake `prefer_const_constructors` is designed to catch.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-const-constructors-q3",
          prompt: "Which of these are required for a constructor to be `const`? (Select all that apply.)",
          options: [
            "Every instance field of the class is `final`",
            "The constructor has no body",
            "Every argument passed at a const call site is itself a compile-time constant",
            "The class has no superclass other than `Object`",
            "The class overrides `==` and `hashCode`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Deep immutability plus no side effects is what lets the value be built at compile time. Inheritance is fine as long as the superclass constructor is also const, and canonicalisation works on identity, so no custom `==` is needed.",
        },
        {
          id: "dart-const-constructors-q4",
          prompt:
            "Why does this fail?\n\n```dart\nfinal n = 2;\nconst p = P(n);\n```",
          options: [
            "`n` is `final`, not `const`, so it isn't a compile-time constant",
            "`P` needs a named constructor to be used in a const declaration",
            "`const` variables cannot take constructor arguments",
            "`n` must be `late` for the compiler to read it early enough",
          ],
          correctIndex: 0,
          explanation:
            "`final` is a runtime guarantee — assigned once, but not necessarily before compilation finishes. Only `const` values (and literals, and arithmetic on them) can feed a const expression.",
        },
        {
          id: "dart-const-constructors-q5",
          prompt:
            "How many `const` keywords are strictly required here?\n\n```dart\nconst config = {\n  'points': [P(0), P(1)],\n};\n```",
          options: [
            "One — inside a const context the inner `const`s may be omitted",
            "Four — every literal and constructor call needs its own",
            "Three — the map, the list and the outer declaration",
            "Zero — a `const` variable makes its initialiser constant automatically, even for `final` values",
          ],
          correctIndex: 0,
          explanation:
            "Everything inside a const context is already a const context, so repeating the keyword is redundant (and flagged by `unnecessary_const`). The last option is wrong in a subtle way: the context makes constructor calls const, but it cannot turn a non-constant value into one.",
        },
        {
          id: "dart-const-constructors-q6",
          prompt:
            "A UI framework rebuilds a tree of description objects on every state change. Why does marking the unchanging parts `const` make rebuilds cheaper?",
          options: [
            "The same canonical instance is reused, so an `identical` check lets the framework skip that subtree entirely",
            "Const objects are allocated on the stack rather than the heap",
            "Const objects are compared with a faster deep-equality routine",
            "Const objects are rebuilt in a background isolate",
          ],
          correctIndex: 0,
          explanation:
            "An O(1) pointer comparison beats any structural comparison. Nothing is stack-allocated and nothing moves off the main isolate — the win is purely that the new object *is* the old object.",
        },
        {
          id: "dart-const-constructors-q7",
          prompt: "What is the difference between `static const x = 1;` and `final int x = 1;` on a class?",
          options: [
            "`static const` belongs to the class and is a compile-time constant; `final` belongs to each instance and is set at construction",
            "They are equivalent; `static const` is just shorthand",
            "`static const` is lazily initialised on first use; `final` is initialised eagerly",
            "`final` fields can be `const`; `static const` fields cannot be `final`",
          ],
          correctIndex: 0,
          explanation:
            "An instance field can never be `const`, because the instance doesn't exist at compile time. Moving a value to `static const` also means it is stored once rather than once per instance.",
        },
        {
          id: "dart-const-constructors-q8",
          prompt:
            "What does this print?\n\n```dart\nprint(identical(const [1, 2], const [1, 2]));\nprint(identical([1, 2], [1, 2]));\n```",
          options: ["`true` then `false`", "`true` then `true`", "`false` then `false`", "`false` then `true`"],
          correctIndex: 0,
          explanation:
            "Canonicalisation applies to const collection literals as well as const constructor calls. Two ordinary list literals are always two distinct objects, exactly as in JavaScript.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-const-constructors-q9",
          prompt: "Why can a const constructor not have a body?",
          options: [
            "A body could run arbitrary code, which the compiler cannot execute while producing a compile-time value",
            "Bodies are only allowed on factory constructors",
            "A body would make the fields mutable",
            "It can have a body, as long as the body only contains `assert` statements",
          ],
          correctIndex: 0,
          explanation:
            "Everything a const constructor does has to be expressible as a value the compiler can compute, so the work goes in initialising formals and the initialiser list. Asserts in the initialiser list are allowed; a statement body is not.",
        },
        {
          id: "dart-const-constructors-q10",
          prompt:
            "A class holds `final List<int> items;` and you want a const constructor. What must callers pass?",
          options: [
            "A const list, e.g. `const Holder(const [1, 2])` — the whole graph must be constant",
            "Any list; `final` on the field is sufficient",
            "An unmodifiable view created with `List.unmodifiable`",
            "Nothing — a const constructor cannot take a collection parameter",
          ],
          correctIndex: 0,
          explanation:
            "Constness is transitive: a const object cannot reference something mutable, or its immutability guarantee would be a lie. `List.unmodifiable` is a runtime wrapper, not a compile-time constant.",
        },
      ],
    },

    {
      id: "dart-inheritance-mixins",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "`extends`, `implements`, `with` and Class Modifiers",
      summary:
        "Dart has three inheritance verbs where JavaScript has one. `extends` is ordinary single inheritance: you get the superclass's implementation and can call `super`. `implements` takes only the *interface* — every class in Dart implicitly defines one, so you can `implements` a concrete class and are then obliged to reimplement every one of its members from scratch. `with` applies a mixin: a bundle of implementation, reusable across unrelated hierarchies, applied in order so that `with A, B` puts `B` closest to the class and lets it win a name clash.\n\nA mixin's `on` clause is the piece people miss. It exists so a mixin can call `super`: `mixin Musical on Performer` both restricts the mixin to subclasses of `Performer` and tells the compiler what `super.perform()` resolves to. Dart 3 also tightened the rules — a plain `class` can no longer be used as a mixin; it must be declared `mixin` or `mixin class`, which is why a lot of pre-3.0 code fails to compile unchanged.\n\nThe class modifiers (`abstract`, `base`, `interface`, `final`, `sealed`) are about controlling how *other libraries* use your types, and they only restrict across library boundaries. `base` forbids `implements` from outside, so your implementations can't be faked. `interface` forbids `extends`, so nobody depends on your internals. `final` forbids both, which makes adding a method a non-breaking change. `sealed` is `final` plus a compile-time list of subtypes, which is what makes a `switch` over them provably exhaustive. If you publish a package, picking one of these deliberately is the difference between being able to evolve it and being frozen by your users.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "dart.dev: Extend a class", url: "https://dart.dev/language/extend", kind: "docs" },
        { label: "dart.dev: Mixins", url: "https://dart.dev/language/mixins", kind: "docs" },
        { label: "dart.dev: Class modifiers", url: "https://dart.dev/language/class-modifiers", kind: "docs" },
        { label: "dart.dev: Class modifiers for API maintainers", url: "https://dart.dev/language/class-modifiers-for-apis", kind: "article" },
      ],
      video: {
        title: "Dart Classes Explained II - Inheritance(extends) vs. Abstraction(implements) vs. Mixins(with)",
        channel: "Flutterly",
        url: "https://www.youtube.com/watch?v=OThpFGSzV1g",
        videoId: "OThpFGSzV1g",
        durationLabel: "31:57",
      },
      alternateVideos: [
        {
          title: "Class Modifiers in Dart 3 | Base, Abstract, Final, Sealed, Mixin",
          channel: "Coding With Flutter",
          url: "https://www.youtube.com/watch?v=n5WuBICxv_8",
          videoId: "n5WuBICxv_8",
          durationLabel: "8:07",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-inheritance-mixins-q1",
          prompt:
            "`Engine` is an ordinary concrete class with three methods. What does `class MockEngine implements Engine` oblige you to do?",
          options: [
            "Provide your own implementation of all three methods — no code is inherited",
            "Nothing; the implementations are inherited as with `extends`",
            "Override only the abstract members, of which there are none",
            "Nothing, but you must also add `with Engine`",
          ],
          correctIndex: 0,
          explanation:
            "Every class defines an implicit interface, and `implements` takes only that. It is the standard way to hand-write a test double for a concrete dependency, at the cost of restating the whole surface.",
        },
        {
          id: "dart-inheritance-mixins-q2",
          prompt:
            "Both mixins define `describe()`. What does this print?\n\n```dart\nmixin A { String describe() => 'A'; }\nmixin B { String describe() => 'B'; }\nclass C with A, B {}\n\nvoid main() => print(C().describe());\n```",
          options: ["`B`", "`A`", "`AB`", "A compile-time error: conflicting members"],
          correctIndex: 0,
          explanation:
            "Mixins are applied left to right, each one layered on top of the last, so the rightmost wins. Reordering the `with` clause silently changes behaviour — a good reason to avoid overlapping mixin APIs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-inheritance-mixins-q3",
          prompt: "What does the `on` clause in `mixin Musical on Performer { ... }` do?",
          options: [
            "Restricts the mixin to subclasses of `Performer`, and defines what `super` resolves to inside the mixin",
            "Makes `Musical` a subclass of `Performer`",
            "Automatically applies `Performer` to any class that uses `Musical`",
            "Declares that `Performer` must use `Musical`",
          ],
          correctIndex: 0,
          explanation:
            "A mixin has no superclass of its own, so `super.foo()` inside it is meaningless until `on` names a type to resolve against. Only use `on` when the mixin actually needs a `super` call or a member from the host.",
        },
        {
          id: "dart-inheritance-mixins-q4",
          prompt:
            "Pre-Dart-3 code does `class Logger { void log(String m) {} }` and then `class Service with Logger {}`. Why does it fail on Dart 3?",
          options: [
            "A plain class can no longer be used as a mixin; it must be declared `mixin` or `mixin class`",
            "Mixins must be declared `abstract` since Dart 3",
            "`with` now requires an `on` clause on the mixin",
            "Mixin names must not collide with a class name in the same library",
          ],
          correctIndex: 0,
          explanation:
            "Dart 3 made mixin-ability opt-in, so a class author is no longer forced to support a use they never intended. `mixin class Logger` restores the old behaviour, and a `mixin class` cannot have `extends`, `with` or `on`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-inheritance-mixins-q5",
          prompt: "Which are true of a `sealed` class? (Select all that apply.)",
          options: [
            "It is implicitly abstract and cannot be instantiated",
            "It cannot be extended or implemented outside its own library",
            "A `switch` over its subtypes can be checked for exhaustiveness at compile time",
            "Its direct subclasses are implicitly abstract too",
            "It cannot declare any concrete methods",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Sealing means the compiler knows the full set of subtypes, which is what enables exhaustiveness checking. The subclasses are ordinary classes — instantiable and concrete — and a sealed class can carry as much shared implementation as you like.",
        },
        {
          id: "dart-inheritance-mixins-q6",
          prompt:
            "You publish a package and want callers to be able to subclass your type but not to hand-write fake implementations of it. Which modifier?",
          options: ["`base`", "`interface`", "`final`", "`sealed`"],
          correctIndex: 0,
          explanation:
            "`base` disallows `implements` from outside the library while still allowing `extends`, which guarantees every instance really runs your code. `interface` is the mirror image, and `final` blocks both.",
        },
        {
          id: "dart-inheritance-mixins-q7",
          prompt:
            "A consumer of your package writes `class Fake implements YourType {}` and it stops compiling when you add a method. Which modifier would have prevented that whole class of breakage?",
          options: [
            "`final` — it blocks both `extends` and `implements` outside the library, so adding a member is non-breaking",
            "`abstract` — abstract classes cannot be implemented",
            "`sealed` — sealed classes can still be implemented in other libraries",
            "`mixin` — mixins cannot be implemented",
          ],
          correctIndex: 0,
          explanation:
            "Once someone implements your interface, every member you add is a breaking change for them. `final` is the strong option for types you intend to keep evolving. `abstract` says nothing about who may implement, and `sealed` is about exhaustiveness within your own library.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-inheritance-mixins-q8",
          prompt: "What does `abstract interface class Repository` mean?",
          options: [
            "It cannot be instantiated, and outside libraries may implement it but not extend it",
            "It cannot be instantiated and cannot be implemented either",
            "It is the same as `abstract class`; `interface` is documentation only",
            "It can be instantiated but all members must be overridden",
          ],
          correctIndex: 0,
          explanation:
            "Modifiers compose. `abstract interface class` is the closest Dart gets to a pure Java-style interface, and it is the recommended way to declare a contract intended purely for implementation.",
        },
        {
          id: "dart-inheritance-mixins-q9",
          prompt: "Which combination is legal in a single class declaration?",
          options: [
            "`class C extends A with M1, M2 implements I1, I2`",
            "`class C extends A extends B`",
            "`class C with M1 on A`",
            "`mixin class M extends A`",
          ],
          correctIndex: 0,
          explanation:
            "One superclass, any number of mixins, any number of interfaces — in that order. `on` belongs to a mixin declaration, not a `with` clause, and a `mixin class` may not have an `extends` clause.",
        },
        {
          id: "dart-inheritance-mixins-q10",
          prompt:
            "When is a mixin the right tool instead of an abstract superclass?",
          options: [
            "When the behaviour must be shared by classes in unrelated hierarchies",
            "When the behaviour needs constructor parameters",
            "When you want to prevent the behaviour from being overridden",
            "When the behaviour needs its own instance fields with initial values passed in",
          ],
          correctIndex: 0,
          explanation:
            "Single inheritance is the constraint mixins relieve. They cannot declare constructors, so anything that needs construction-time configuration belongs in a superclass or a collaborator object instead.",
        },
        {
          id: "dart-inheritance-mixins-q11",
          prompt: "What is the difference between `abstract` and `sealed` for enabling exhaustive `switch`?",
          options: [
            "`sealed` restricts subtypes to the same library so the compiler knows them all; `abstract` alone puts no such limit, so exhaustiveness cannot be proven",
            "Both enable exhaustiveness; `sealed` is just shorter",
            "`abstract` enables exhaustiveness; `sealed` only prevents instantiation",
            "Neither does — exhaustiveness requires an `enum`",
          ],
          correctIndex: 0,
          explanation:
            "Exhaustiveness is only decidable if the full subtype list is closed. That is exactly what sealing buys, and it is why sealed hierarchies plus pattern matching are Dart's answer to algebraic data types.",
        },
      ],
    },

    {
      id: "dart-extension-methods",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "Extension Methods",
      summary:
        "Extensions let you add methods, getters, setters and operators to a type you don't own — `String`, `int`, a class from a package — without subclassing it and without monkey-patching a prototype. `extension NumberParsing on String { int get asInt => int.parse(this); }` then makes `'42'.asInt` work everywhere the extension is imported. Compared with JavaScript's `String.prototype.foo = ...`, the crucial difference is scope: an extension is visible only where it is imported, so two packages adding a `parse` getter to `String` cannot silently break each other.\n\nThat is because extension members are resolved **statically**, against the declared type of the receiver. Two consequences follow, and both surprise people. You cannot call an extension member on a `dynamic` value at all — there is no static type to resolve against, and the call fails at runtime. And an extension can never override a real instance member: if the class already declares `length`, the class wins, always. Extensions are therefore additive, not a patching mechanism.\n\nWhen conflicts do arise between two imported extensions, you resolve them with `show`/`hide`, an import prefix, or an explicit `NumberParsing('42').asInt`. Unnamed extensions are library-private and can't be disambiguated that way, which is a reason to name them. Dart 3.3's **extension types** are the adjacent feature people confuse with this one: an extension type is a compile-time-only wrapper that defines a *new* type with its own restricted interface and zero runtime cost, where an extension leaves the original type alone and only adds to it.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "dart.dev: Extension methods", url: "https://dart.dev/language/extension-methods", kind: "docs" },
        { label: "dart.dev: Extension types", url: "https://dart.dev/language/extension-types", kind: "docs" },
        { label: "Dart blog: Extension methods", url: "https://medium.com/dartlang/extension-methods-2d466cd8b308", kind: "article" },
      ],
      video: {
        title: "Dart Extensions: Full Introduction and Practical Use Cases",
        channel: "Andrea Bizzotto",
        url: "https://www.youtube.com/watch?v=LaSWpdXrQ54",
        videoId: "LaSWpdXrQ54",
        durationLabel: "13:10",
      },
      alternateVideos: [
        {
          title: "Dart extension methods",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=D3j0OSfT9ZI",
          videoId: "D3j0OSfT9ZI",
          durationLabel: "6:14",
        },
        {
          title: "Dart Extension Methods Tutorial (incl. Generic Extensions, Properties & Operators)",
          channel: "Reso Coder",
          url: "https://www.youtube.com/watch?v=GkEuRVkeLpw",
          videoId: "GkEuRVkeLpw",
          durationLabel: "17:41",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-extension-methods-q1",
          prompt:
            "What happens here?\n\n```dart\nextension P on String {\n  int get asInt => int.parse(this);\n}\n\nvoid main() {\n  dynamic d = '2';\n  print(d.asInt);\n}\n```",
          options: [
            "It fails at runtime: extension members can't be invoked on `dynamic`",
            "It prints `2`",
            "It is a compile-time error on `d.asInt`",
            "It prints `null`",
          ],
          correctIndex: 0,
          explanation:
            "Extensions resolve against the *static* type, and `dynamic` provides none, so the analyser lets the call through and the runtime finds no such member. Annotating `String d = '2';` fixes it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-extension-methods-q2",
          prompt:
            "A class already declares `int get count => 1;`. An imported extension on the same class declares `int get count => 2;`. What does `obj.count` return?",
          options: [
            "`1` — an instance member always wins over an extension member",
            "`2` — the extension shadows the instance member",
            "It is a compile-time error: ambiguous member",
            "Whichever is declared later in the file",
          ],
          correctIndex: 0,
          explanation:
            "Extensions are strictly additive. This is a deliberate safety property: importing a package can never change the behaviour of code that already compiled, unlike prototype patching in JavaScript.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-extension-methods-q3",
          prompt: "Which members can an extension declare? (Select all that apply.)",
          options: [
            "Methods",
            "Getters and setters",
            "Operators",
            "Static fields and static helpers",
            "Instance fields",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "An extension has nowhere to store per-instance state — it doesn't change the object's layout — so instance fields are out. Static fields belong to the extension itself, not to any receiver, and are fine.",
        },
        {
          id: "dart-extension-methods-q4",
          prompt: "Two imported libraries both define an extension adding `.parsed` to `String`. How do you resolve the conflict?",
          options: [
            "Use `show`/`hide` on the import, an import prefix, or call it explicitly as `MyExt('x').parsed`",
            "Declare a third extension; the most recently declared one wins",
            "Add `@override` to the one you want",
            "Cast the receiver to `dynamic` to force late binding",
          ],
          correctIndex: 0,
          explanation:
            "Naming the extension is what makes explicit invocation possible, which is the main practical reason to prefer named extensions over unnamed ones in a public library.",
        },
        {
          id: "dart-extension-methods-q5",
          prompt: "What is true of an unnamed extension, `extension on String { ... }`?",
          options: [
            "Its members are visible only within the library that declares it",
            "It is visible everywhere the library is imported, like a named one",
            "It can only declare a single member",
            "It can only be applied to core library types",
          ],
          correctIndex: 0,
          explanation:
            "An unnamed extension is a convenience for local helpers. Because it has no name, a consumer could neither disambiguate it nor invoke it explicitly — so it isn't exported.",
        },
        {
          id: "dart-extension-methods-q6",
          prompt: "How does an extension type (Dart 3.3) differ from an extension method?",
          options: [
            "An extension type declares a new compile-time type with its own interface wrapping a representation value; an extension only adds members to an existing type",
            "An extension type is the same feature with a clearer name",
            "An extension type allocates a wrapper object at runtime; extensions do not",
            "An extension type can only wrap classes you own",
          ],
          correctIndex: 0,
          explanation:
            "`extension type Meters(int value)` gives you a distinct type that will not accept a bare `int` and does not expose `int`'s members unless you say so — a zero-cost newtype. An extension on `int` would add members to *every* `int` in scope.",
        },
        {
          id: "dart-extension-methods-q7",
          prompt:
            "Can you write `class MyThing implements SomeExtension` to require that a type provides the extension's members?",
          options: [
            "No — extensions do not appear in a type's interface and cannot be implemented",
            "Yes, as long as the extension is named",
            "Yes, but only for extensions on `Object`",
            "Only if the extension is declared `abstract`",
          ],
          correctIndex: 0,
          explanation:
            "Extension members are resolved statically at the call site and are not part of the receiver's type. If you need a contract, that's what an interface (or a `base`/`interface` class) is for.",
        },
        {
          id: "dart-extension-methods-q8",
          prompt:
            "What does `T` bind to here?\n\n```dart\nextension Last<T> on List<T> {\n  T? get lastOrNull => isEmpty ? null : this[length - 1];\n}\n\nfinal xs = <int>[1, 2];\nfinal v = xs.lastOrNull;\n```",
          options: [
            "`int`, inferred from the static type of `xs`, so `v` is `int?`",
            "`dynamic`, because extensions cannot infer type arguments",
            "`Object?`, the default bound",
            "`List<int>`, the receiver type",
          ],
          correctIndex: 0,
          explanation:
            "Generic extensions infer their type arguments from the receiver's static type, so the result stays precisely typed. This is how packages add typed helpers to core collections.",
        },
        {
          id: "dart-extension-methods-q9",
          prompt: "What is the runtime cost of calling an extension method?",
          options: [
            "The same as a static function call — resolution happens at compile time",
            "A dynamic dispatch through a lookup table, slower than a method call",
            "An allocation per call for the extension wrapper object",
            "It depends on the number of extensions imported into the library",
          ],
          correctIndex: 0,
          explanation:
            "Because the target is chosen statically, the call compiles to a direct static invocation with the receiver passed as an argument. That is precisely why the `dynamic` restriction exists.",
        },
      ],
    },

    {
      id: "dart-generics",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "Generics, Bounds and Variance",
      summary:
        "Dart's generics look like TypeScript's and behave like neither TypeScript's nor Java's, because they are **reified**: the type argument survives to runtime. `<int>[] is List<String>` is `false` at runtime, `xs.runtimeType` prints `List<int>`, and a `List<int>` will refuse an `Object` at the point of insertion. Java erases type arguments and TypeScript deletes the type system entirely, so both those checks are impossible there. Reification is what lets Dart's type system stay sound while still being ergonomic.\n\nBounds use `extends`: `class Cache<T extends Object>` rules out nullable arguments, `T extends Comparable<T>` is the F-bound that says \"comparable to itself\". The default bound when you write nothing is `Object?`, which is why an unconstrained `T` supports almost no operations. Generic methods carry their own parameters — `T first<T>(List<T> xs)` — and infer them from the arguments at the call site.\n\nThe part worth real attention is variance. Dart generics are **covariant** by default: `List<MaineCoon>` is a subtype of `List<Cat>`, which is convenient and, strictly speaking, unsound. Dart accepts it and inserts runtime checks to catch the consequences, so passing a `List<Cat>` where a `List<Animal>` is expected type-checks, and adding a `Dog` to it throws at runtime rather than corrupting the list. If you have fought `Array<T>` variance in TypeScript, the tradeoff is the same one — Dart just chose to make the failure loud rather than silent.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "dart.dev: Generics", url: "https://dart.dev/language/generics", kind: "docs" },
        { label: "dart.dev: The Dart type system", url: "https://dart.dev/language/type-system", kind: "docs" },
        { label: "dart.dev: Typedefs", url: "https://dart.dev/language/typedefs", kind: "docs" },
      ],
      video: {
        title: "#17 - Dart Generics, Generic Types, Generic Classes, Generic Methods",
        channel: "Flutterly",
        url: "https://www.youtube.com/watch?v=q2PMQPV7JRg",
        videoId: "q2PMQPV7JRg",
        durationLabel: "25:37",
      },
      alternateVideos: [
        {
          title: "Dart Crash Course #10 - Generics",
          channel: "Net Ninja",
          url: "https://www.youtube.com/watch?v=8MywaeBqFmI",
          videoId: "8MywaeBqFmI",
          durationLabel: "8:06",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-generics-q1",
          prompt:
            "What does this print?\n\n```dart\nvar names = <String>[];\nprint(names is List<String>);\nprint(names is List<int>);\n```",
          options: ["`true` then `false`", "`true` then `true`", "`false` then `false`", "A compile-time error on the second check"],
          correctIndex: 0,
          explanation:
            "Dart generics are reified, so the list carries `String` at runtime and the second test fails. In Java both checks would be impossible to express precisely, and in TypeScript there is nothing left to check at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-generics-q2",
          prompt:
            "What happens here?\n\n```dart\nList<Cat> cats = [Cat()];\nList<Animal> animals = cats;\nanimals.add(Dog());\n```",
          options: [
            "It compiles — generics are covariant — and throws at runtime on `add`",
            "It is a compile-time error on the assignment: `List<Cat>` is not a `List<Animal>`",
            "It compiles and runs; the list ends up holding a `Cat` and a `Dog`",
            "It is a compile-time error on `add`",
          ],
          correctIndex: 0,
          explanation:
            "Covariance makes the assignment legal, which is genuinely unsound for a mutable container, so Dart inserts a runtime check at the insertion point. Soundness is preserved by failing loudly rather than by rejecting the assignment.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-generics-q3",
          prompt: "What is the implicit bound of `T` in `class Box<T> {}`?",
          options: ["`Object?`", "`Object`", "`dynamic`", "`Never`"],
          correctIndex: 0,
          explanation:
            "With no bound, `T` can be any type including nullable ones, so only `Object?`'s members are available. Writing `<T extends Object>` is how you exclude nullable arguments.",
        },
        {
          id: "dart-generics-q4",
          prompt:
            "What does the bound in `int compareAndOffset<T extends Comparable<T>>(T a, T b)` express?",
          options: [
            "`T` must be comparable to itself — a self-referential (F-) bound",
            "`T` must implement `Comparable` for at least one type",
            "`T` must be a subtype of `int`",
            "`T` may be any type; the bound is documentation only",
          ],
          correctIndex: 0,
          explanation:
            "`Comparable<T>` referring back to `T` is the classic F-bound, and it is what stops you from passing a `String` and a `DateTime` to the same call.",
        },
        {
          id: "dart-generics-q5",
          prompt: "Which of these are true because Dart's generics are reified? (Select all that apply.)",
          options: [
            "`xs.runtimeType` can report `List<int>` rather than just `List`",
            "`value is T` inside a generic method tests the actual type argument",
            "A `List<int>` rejects a non-`int` at insertion time, even via an `Object` alias",
            "Two lists with different type arguments can be distinguished at runtime",
            "Type arguments are removed by the compiler, making generic code smaller",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Reification is the opposite of erasure: the type argument is real at runtime, which is what enables all four. Erasure is Java's approach, and its only advantage is code size.",
        },
        {
          id: "dart-generics-q6",
          prompt:
            "Why does this fail to compile?\n\n```dart\nT makeOne<T>() => T();\n```",
          options: [
            "A type parameter cannot be used as a constructor; `T` is a type, not a class you can invoke",
            "Generic functions cannot have a generic return type",
            "`T` needs a bound before it can be returned",
            "Generic functions must take at least one parameter",
          ],
          correctIndex: 0,
          explanation:
            "Even reified, `T` carries no guarantee of a particular constructor. The usual workaround is to pass a factory function — `T makeOne<T>(T Function() create) => create();`.",
        },
        {
          id: "dart-generics-q7",
          prompt: "What is the difference between `List<dynamic>` and `List<Object?>`?",
          options: [
            "`List<dynamic>` lets you call any member on its elements with no static checking; `List<Object?>` requires a test or cast first",
            "`List<dynamic>` cannot contain null; `List<Object?>` can",
            "They are identical at both compile time and runtime",
            "`List<Object?>` is not a valid type argument",
          ],
          correctIndex: 0,
          explanation:
            "Both hold anything, but only `dynamic` turns off the analyser for the elements. `List<Object?>` is the type to prefer when you genuinely mean \"heterogeneous\" and still want checking.",
        },
        {
          id: "dart-generics-q8",
          prompt:
            "You want a `Repository<T>` whose `T` must have an `id`. What is the idiomatic Dart?",
          options: [
            "Declare an interface with the `id` member and bound the parameter: `class Repository<T extends Identifiable>`",
            "Use `dynamic` and read `.id` at runtime",
            "Use `T extends Object` and cast inside each method",
            "Use a `where` clause after the class declaration",
          ],
          correctIndex: 0,
          explanation:
            "Bounds are how you make members available on a type parameter — inside the class, `T` now has everything `Identifiable` declares. Dart has no `where` clause; the bound goes in the angle brackets.",
        },
        {
          id: "dart-generics-q9",
          prompt:
            "What is inferred for `T` here?\n\n```dart\nT firstOr<T>(List<T> xs, T fallback) => xs.isEmpty ? fallback : xs.first;\nfinal v = firstOr(<int>[], 0);\n```",
          options: ["`int`, so `v` is `int`", "`dynamic`, because the list is empty", "`Object?`, the union of the argument types", "`num`, the common supertype of the arguments"],
          correctIndex: 0,
          explanation:
            "Inference uses the static types of the arguments, not the runtime contents, so an empty `List<int>` still pins `T` to `int`. Explicit `firstOr<int>(...)` is available when inference picks something too wide.",
        },
        {
          id: "dart-generics-q10",
          prompt: "What does a generic typedef such as `typedef Json = Map<String, dynamic>;` buy you?",
          options: [
            "A name for a structural type, improving readability without creating a new type",
            "A distinct type that will not accept a plain `Map<String, dynamic>`",
            "Runtime validation that the map's values match a schema",
            "Automatic JSON serialisation for the aliased type",
          ],
          correctIndex: 0,
          explanation:
            "A typedef is a pure alias — assignability is unchanged. If you want a genuinely distinct type with no runtime cost, that is what an extension type is for.",
        },
      ],
    },

    {
      id: "dart-records-patterns",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "Records, Patterns and Exhaustive `switch`",
      summary:
        "Dart 3 added records and pattern matching together, and they are the features most likely to be missing from anything you find online — a huge amount of Dart content predates May 2023. A record is an anonymous, immutable, structurally-typed tuple: `(int, String)` or `({int code, String message})`. Two records are equal when their shapes and values match, `==` and `hashCode` come for free, and there is no class to declare. Positional fields are read through `$1`, `$2` getters, which *skip* named fields — so in `('a', x: 1, 'b')`, `$2` is `'b'`.\n\nPatterns are the other half. They match and destructure in one step, in `switch` cases, in `if-case`, in variable declarations (`final (a, b) = pair;`) and in `for-in` loops. Object patterns destructure through getters: `case Circle(radius: var r)`. Map and list patterns make validating a decoded JSON payload a single expression instead of a ladder of null checks, and `when` guards attach an arbitrary condition to a case without duplicating the pattern.\n\nSwitch is now an expression as well as a statement, and this is where it pays off: switching over a `sealed` hierarchy is checked for exhaustiveness at compile time, so adding a new subtype turns every switch that forgot it into a build error rather than a silent fallthrough. That combination — sealed types plus exhaustive switch expressions — is Dart's version of algebraic data types, and it is the reason to reach for it over a chain of `is` checks. One syntactic trap: `(123)` is just a parenthesised number; a one-field record needs the trailing comma, `(123,)`.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "dart.dev: Records", url: "https://dart.dev/language/records", kind: "docs" },
        { label: "dart.dev: Patterns", url: "https://dart.dev/language/patterns", kind: "docs" },
        { label: "dart.dev: Pattern types", url: "https://dart.dev/language/pattern-types", kind: "docs" },
        { label: "Google Codelabs: Dive into Dart's patterns and records", url: "https://codelabs.developers.google.com/codelabs/dart-patterns-records", kind: "article" },
      ],
      video: {
        title: "Dart 3 Records and Patterns Codelab notes",
        channel: "Randal L. Schwartz on Dart and Flutter",
        url: "https://www.youtube.com/watch?v=a0jNJg7VLUc",
        videoId: "a0jNJg7VLUc",
        durationLabel: "21:37",
      },
      alternateVideos: [
        {
          title: "Pattern Matching in Dart 3 is Powerful!",
          channel: "Robert Brunhage",
          url: "https://www.youtube.com/watch?v=j3fzeDpd2ts",
          videoId: "j3fzeDpd2ts",
          durationLabel: "7:14",
        },
        {
          title: "Records & Patterns - Get started with the newest addition in Dart 3.0",
          channel: "Flutter Explained",
          url: "https://www.youtube.com/watch?v=IybAuSPDucY",
          videoId: "IybAuSPDucY",
          durationLabel: "11:30",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-records-patterns-q1",
          prompt:
            "What does this print?\n\n```dart\nvar record = ('first', a: 2, b: true, 'last');\nprint(record.$2);\n```",
          options: ["`last`", "`2`", "`true`", "A compile-time error: `$2` is out of range"],
          correctIndex: 0,
          explanation:
            "Positional getters number the *positional* fields only, skipping named ones, so `$1` is `'first'` and `$2` is `'last'`. Named fields are read by their own names.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-records-patterns-q2",
          prompt:
            "What does this print?\n\n```dart\nfinal a = (x: 1, y: 2);\nfinal b = (y: 2, x: 1);\nprint(a == b);\n```",
          options: [
            "`true` — named field order is not part of a record's shape",
            "`false` — records compare by identity",
            "`false` — the field order differs, so the shapes differ",
            "A compile-time error: records of different shapes cannot be compared",
          ],
          correctIndex: 0,
          explanation:
            "A record's shape is its set of fields, their types and their names. Records define `==` and `hashCode` structurally, so equal shape plus equal values means equal records.",
        },
        {
          id: "dart-records-patterns-q3",
          prompt:
            "What are the static types of `p` and `q`?\n\n```dart\nfinal p = (123);\nfinal q = (123,);\n```",
          options: [
            "`p` is `int`; `q` is a one-field record",
            "Both are one-field records",
            "`p` is a one-field record; `q` is a compile-time error",
            "Both are `int` — the trailing comma is ignored",
          ],
          correctIndex: 0,
          explanation:
            "`(123)` is indistinguishable from a parenthesised expression, so the language requires a trailing comma to mean \"record\". A one-positional-field record without the comma is a compile-time error.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-records-patterns-q4",
          prompt:
            "What does this switch expression return when `shape` is `Circle(radius: 2)`?\n\n```dart\nfinal label = switch (shape) {\n  Circle(radius: var r) when r > 10 => 'big circle',\n  Circle(radius: var r) => 'circle $r',\n  Square() => 'square',\n};\n```",
          options: ["`circle 2`", "`big circle`", "`square`", "A runtime error: no case matched"],
          correctIndex: 0,
          explanation:
            "Cases are tried in order. The first `Circle` pattern matches structurally but its `when` guard fails, so evaluation continues to the second. Guards do not abandon the switch, they just fail that case.",
        },
        {
          id: "dart-records-patterns-q5",
          prompt: "Why does a `switch` over a `sealed` hierarchy need no `default` clause?",
          options: [
            "The compiler knows every subtype, so it can verify the cases are exhaustive",
            "Dart adds an implicit `default` that throws",
            "Sealed classes can only have two subtypes",
            "Switch expressions never require a default clause",
          ],
          correctIndex: 0,
          explanation:
            "Sealing closes the subtype list within the library, so exhaustiveness is decidable. Leaving out `default` is the point: adding a new subtype then becomes a compile error everywhere you forgot to handle it.",
        },
        {
          id: "dart-records-patterns-q6",
          prompt:
            "A teammate adds a `default: return '';` to an exhaustive switch over a sealed type \"just to be safe\". What have they given up?",
          options: [
            "The compile-time error that would have flagged every switch when a new subtype is added",
            "Nothing — the default is unreachable and free",
            "Runtime performance, because the default adds a branch",
            "The ability to use `when` guards in that switch",
          ],
          correctIndex: 0,
          explanation:
            "A `default` makes any switch trivially exhaustive, which silences exactly the diagnostic you wanted. This is the single most common way teams lose the benefit of sealed hierarchies.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-records-patterns-q7",
          prompt:
            "What does this do?\n\n```dart\nif (json case {'user': {'name': String name, 'age': int age}}) {\n  print('$name is $age');\n}\n```",
          options: [
            "Matches the nested map shape and binds `name` and `age` only if both keys exist with the right types",
            "Throws if any key is missing",
            "Binds `name` and `age` to null when the keys are missing",
            "Is a compile-time error: map patterns cannot be nested",
          ],
          correctIndex: 0,
          explanation:
            "A map pattern checks the keys it mentions and the types of their values, all in one refutable match. This replaces the usual ladder of lookups, null checks and casts when validating decoded JSON.",
        },
        {
          id: "dart-records-patterns-q8",
          prompt:
            "What does `rest` hold after this?\n\n```dart\nfinal [first, ...rest] = [1, 2, 3, 4];\n```",
          options: ["`[2, 3, 4]`", "`[1, 2, 3, 4]`", "`4`", "A compile-time error: rest patterns only work in switch cases"],
          correctIndex: 0,
          explanation:
            "A list pattern with a rest element binds the remaining elements. This is an *irrefutable* pattern in a declaration, so the list must have at least one element or it throws at runtime.",
        },
        {
          id: "dart-records-patterns-q9",
          prompt: "Which of these are true of records compared with a small data class? (Select all that apply.)",
          options: [
            "Records give you structural `==` and `hashCode` with no code",
            "Records are immutable — their fields have getters but no setters",
            "Records need no declaration, so two libraries can produce the same record type independently",
            "Records can declare methods and implement interfaces",
            "Records can be used as map keys because they hash structurally",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 4],
          explanation:
            "Records are anonymous aggregates: no declaration, no behaviour. The moment you want a method, a named constructor, a validation rule or a documented type name, you want a class.",
        },
        {
          id: "dart-records-patterns-q10",
          prompt: "What is the difference between a *refutable* and an *irrefutable* pattern?",
          options: [
            "Refutable patterns can fail to match (switch cases, `if-case`); irrefutable ones must match and throw otherwise (declarations, assignments)",
            "Refutable patterns can bind variables; irrefutable ones cannot",
            "Irrefutable patterns are only allowed inside sealed hierarchies",
            "Refutable patterns are checked at compile time; irrefutable ones at runtime",
          ],
          correctIndex: 0,
          explanation:
            "`final (a, b) = pair;` is a destructuring declaration and has nowhere to go if it fails, so a mismatch throws. Case patterns exist precisely to be tested, so a failure just moves to the next case.",
        },
        {
          id: "dart-records-patterns-q11",
          prompt:
            "How do you return two values from a function without declaring a class?",
          options: [
            "`(int, String) parse() => (1, 'ok');` and destructure with `final (code, msg) = parse();`",
            "Return a `List<Object>` and index into it",
            "Use an out parameter marked `ref`",
            "Return a `Map<String, dynamic>` and read the keys",
          ],
          correctIndex: 0,
          explanation:
            "This is the headline use case for records — a typed multiple return with no boilerplate. The `List` and `Map` workarounds both throw away the types, which is what records exist to stop.",
        },
        {
          id: "dart-records-patterns-q12",
          prompt:
            "What does `||` mean in this case pattern?\n\n```dart\ncase Square(size: var s) || Circle(size: var s) when s > 0:\n```",
          options: [
            "A logical-or pattern: either branch may match, and both must bind the same variables so the guard and body can use `s`",
            "A bitwise or of the two size values",
            "A fallthrough to the next case",
            "A compile-time error: patterns cannot be combined",
          ],
          correctIndex: 0,
          explanation:
            "Logical-or patterns let several shapes share one body and one guard. Every branch must bind the same set of variables with consistent types, otherwise the body could reference an unbound name.",
        },
      ],
    },

    {
      id: "dart-errors-exceptions",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "Errors, Exceptions and `assert`",
      summary:
        "Dart splits thrown things into two families that look similar and mean opposite things. `Exception` is for conditions a caller could reasonably anticipate and recover from — a malformed input, a failed request. `Error` is for programming mistakes: `TypeError`, `RangeError`, `StateError`, a failed null assertion. The convention is that you catch `Exception` and you *fix* `Error`; wrapping the whole app in a catch-all that swallows `Error` turns a crash you would have noticed in testing into corrupted state in production.\n\nThe mechanics differ from JavaScript in several specific ways. `on Type catch (e, stackTrace)` gives you a typed clause and an optional second parameter holding the stack trace, which Dart passes explicitly rather than hanging off the error object. `rethrow` preserves the original stack; `throw e` inside a catch block resets it, which is how the actual origin of a bug goes missing. There are no checked exceptions, so nothing in the signature tells you what a function throws — the docs are the only contract. And `throw` is an expression, so `final v = map[k] ?? (throw StateError('missing'))` is valid Dart.\n\nThe gotcha that matters in Flutter work is `assert`. It is a development-only construct: in production the condition is ignored and its arguments are never even evaluated. That makes it perfect for invariants and completely wrong for validating untrusted input — the check simply is not there in the shipped app. For anything a user or a server can cause, throw a real error.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "dart.dev: Error handling", url: "https://dart.dev/language/error-handling", kind: "docs" },
        { label: "Dart API: Error class", url: "https://api.dart.dev/dart-core/Error-class.html", kind: "docs" },
        { label: "Code with Andrea: Exception handling with try/catch and the Result type", url: "https://codewithandrea.com/articles/flutter-exception-handling-try-catch-result-type/", kind: "article" },
      ],
      video: {
        title: "Dart/Flutter Exceptions best practices",
        channel: "Randal L. Schwartz on Dart and Flutter",
        url: "https://www.youtube.com/watch?v=b7NAW9jZ3Qk",
        videoId: "b7NAW9jZ3Qk",
        durationLabel: "17:51",
      },
      alternateVideos: [
        {
          title: "Dart Exceptions: Best Practices -  Randal Schwartz | Fluttercon USA 2025",
          channel: "nextapp devCon",
          url: "https://www.youtube.com/watch?v=AKqaivvB3vg",
          videoId: "AKqaivvB3vg",
          durationLabel: "35:43",
        },
        {
          title: "Dart Exception Handling | How to handle Exceptions in Dart. Dart Tutorial for Flutter #7.1",
          channel: "Smartherd",
          url: "https://www.youtube.com/watch?v=JMEIO1RwZfU",
          videoId: "JMEIO1RwZfU",
          durationLabel: "8:47",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-errors-exceptions-q1",
          prompt: "What is the intended distinction between `Error` and `Exception` in Dart?",
          options: [
            "`Error` signals a programming bug that should be fixed rather than caught; `Exception` signals a condition a caller can anticipate and handle",
            "`Error` is fatal and terminates the isolate; `Exception` is recoverable",
            "`Error` is used by the SDK and `Exception` by application code",
            "`Exception` carries a stack trace; `Error` does not",
          ],
          correctIndex: 0,
          explanation:
            "Both are throwable and both can be caught — the difference is intent. Catching `Error` usually means you are papering over a bug like an out-of-range index or a bad cast.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-errors-exceptions-q2",
          prompt:
            "What does the second parameter capture?\n\n```dart\ntry {\n  risky();\n} on FormatException catch (e, s) {\n  log(e, s);\n}\n```",
          options: [
            "The `StackTrace` for the thrown object",
            "The exception's inner cause",
            "The zone in which the error occurred",
            "The line number as an `int`",
          ],
          correctIndex: 0,
          explanation:
            "Dart passes the stack trace alongside the thrown object rather than attaching it to the object, so you must declare the second parameter to get it. Logging without it is the most common reason a production bug report is useless.",
        },
        {
          id: "dart-errors-exceptions-q3",
          prompt: "What is the difference between `rethrow` and `throw e` inside a catch block?",
          options: [
            "`rethrow` preserves the original stack trace; `throw e` starts a new one from the current line",
            "`rethrow` can only be used for `Error`s; `throw e` works for anything",
            "They are identical; `rethrow` is only shorter",
            "`rethrow` skips any enclosing `finally` blocks",
          ],
          correctIndex: 0,
          explanation:
            "Re-throwing with `throw e` is how the original throw site disappears from the report. Use `rethrow` whenever you are logging or partially handling and want the error to keep travelling.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-errors-exceptions-q4",
          prompt:
            "Which clauses catch a `RangeError`? (Select all that apply.)",
          options: [
            "`catch (e)` with no `on` clause",
            "`on Error catch (e)`",
            "`on RangeError catch (e)`",
            "`on Exception catch (e)`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`RangeError` is an `Error`, not an `Exception`, so an `on Exception` clause misses it entirely — which is a frequent surprise for people who write `on Exception` expecting a catch-all.",
        },
        {
          id: "dart-errors-exceptions-q5",
          prompt: "What does Dart require you to declare about the exceptions a function can throw?",
          options: [
            "Nothing — Dart has no checked exceptions; the signature says nothing about throwing",
            "A `throws` clause listing each exception type",
            "That the return type is nullable",
            "An `@throws` annotation, enforced by the analyser",
          ],
          correctIndex: 0,
          explanation:
            "Like JavaScript and unlike Java, Dart has no checked exceptions. The tradeoff is that documentation and, increasingly, a `Result`-style return type are the only way callers learn what can go wrong.",
        },
        {
          id: "dart-errors-exceptions-q6",
          prompt:
            "Why is this legal Dart?\n\n```dart\nfinal v = cache[key] ?? (throw StateError('missing $key'));\n```",
          options: [
            "`throw` is an expression in Dart, so it can appear anywhere a value is expected",
            "`??` special-cases `throw` on its right-hand side",
            "It isn't — this is a compile-time error",
            "`StateError` has an implicit conversion to the value type",
          ],
          correctIndex: 0,
          explanation:
            "Because `throw` is an expression, it works in `=>` bodies, in `??` and inside a switch expression arm. Its static type is `Never`, which is why it can stand in for any type.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-errors-exceptions-q7",
          prompt: "Can you `throw` an object that is neither an `Error` nor an `Exception`?",
          options: [
            "Yes — any non-null object can be thrown, though the convention is to throw an `Exception` or `Error` subtype",
            "No — the compiler requires a subtype of `Exception` or `Error`",
            "Only inside an `async` function",
            "Only if the object implements `Throwable`",
          ],
          correctIndex: 0,
          explanation:
            "`throw 'oops';` compiles. It is also a lint violation (`only_throw_errors`) for good reason: a `String` carries no type to catch on and no structure for a handler to use.",
        },
        {
          id: "dart-errors-exceptions-q8",
          prompt:
            "What does this print?\n\n```dart\nString f() {\n  try {\n    return 'a';\n  } finally {\n    print('cleanup');\n  }\n}\n\nvoid main() => print(f());\n```",
          options: ["`cleanup` then `a`", "`a` then `cleanup`", "`a` only — `finally` is skipped on return", "`cleanup` only"],
          correctIndex: 0,
          explanation:
            "`finally` runs before control actually leaves the function, including on `return` and while an exception is propagating. That ordering is what makes it reliable for releasing resources.",
        },
        {
          id: "dart-errors-exceptions-q9",
          prompt:
            "You add `assert(userInput.length < 100);` to validate a text field. What goes wrong in production?",
          options: [
            "The assertion is ignored entirely, so the input is never validated in the shipped app",
            "It throws `AssertionError` and crashes real users",
            "It logs a warning but continues, which is usually acceptable",
            "Nothing — assertions behave identically in debug and release",
          ],
          correctIndex: 0,
          explanation:
            "Assertions are stripped from production and their arguments are not even evaluated. Use them for invariants you control; throw a real error for anything a user or a server can supply.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-errors-exceptions-q10",
          prompt: "When is a `Result`-style return type (a sealed `Success`/`Failure` pair) preferable to throwing?",
          options: [
            "When the failure is an expected outcome the caller must handle, so the compiler can force them to handle it",
            "Always — throwing is deprecated in modern Dart",
            "Only in isolates, where exceptions cannot cross isolate boundaries",
            "Only for errors of type `Error`, which should never be thrown",
          ],
          correctIndex: 0,
          explanation:
            "Because Dart has no checked exceptions, encoding expected failures in the return type is the only way to make handling them mandatory — and an exhaustive `switch` over the sealed result is what enforces it. Genuine bugs should still throw.",
        },
      ],
    },

    {
      id: "dart-async",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "Futures, Streams and the Event Loop",
      summary:
        "Dart's asynchrony will feel immediately familiar and then diverge in precise, consequential ways. The event loop is the same two-queue design as JavaScript's: a microtask queue that drains completely before the event loop touches the next event, and an event queue for timers and I/O. `async` functions behave the same way too — the body runs synchronously up to the first `await`, then returns a `Future` and resumes later. `await` on a non-Future value still works; the value is wrapped.\n\nThe divergences are worth memorising. `Future.wait` is not `Promise.all`: by default it waits for *every* future to settle and then completes with the first error, rather than rejecting the instant one fails — pass `eagerError: true` for `Promise.all` semantics. And `Stream` is not `AsyncIterable`. A stream is either single-subscription (one `listen` ever, buffering until you attach) or broadcast (many listeners, no buffering, events fired while nobody is listening are simply gone). `listen` returns a `StreamSubscription` with `pause`, `resume` and `cancel`, so backpressure is first-class in a way `for await` never exposed.\n\nGenerators mirror the split: `sync*` with `yield` produces a lazy `Iterable`, `async*` produces a `Stream`, and `yield*` delegates to another generator. The failure mode that costs real time is the unawaited future: calling an async function without `await` and without `unawaited()` means its error has no handler and surfaces as an unhandled asynchronous error far from where it happened. The `unawaited_futures` lint exists for exactly that.",
      level: "advanced",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "dart.dev: Asynchronous programming", url: "https://dart.dev/language/async", kind: "docs" },
        { label: "dart.dev: Using streams", url: "https://dart.dev/libraries/async/using-streams", kind: "docs" },
        { label: "dart.dev: Concurrency in Dart (the event loop)", url: "https://dart.dev/language/concurrency", kind: "docs" },
        { label: "Dart blog: Asynchronous programming — Streams", url: "https://medium.com/dartlang/dart-asynchronous-programming-streams-2b229b1ce012", kind: "article" },
      ],
      video: {
        title: "#22 - Dart Asynchronous Workflows - All Futures, Streams, Async Generator Functions",
        channel: "Flutterly",
        url: "https://www.youtube.com/watch?v=Ky8RxFF4kug",
        videoId: "Ky8RxFF4kug",
        durationLabel: "43:18",
      },
      alternateVideos: [
        {
          title: "Async/Await - Flutter in Focus",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=SmTCmDMi4BY",
          videoId: "SmTCmDMi4BY",
          durationLabel: "9:11",
        },
        {
          title: "Dart Streams - Flutter in Focus",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=nQBpOIHE4eE",
          videoId: "nQBpOIHE4eE",
          durationLabel: "8:00",
        },
        {
          title: "#21 - Dart Synchronous Workflows, Iterables, sync* generator functions, yield, yield*",
          channel: "Flutterly",
          url: "https://www.youtube.com/watch?v=60UdftkluF8",
          videoId: "60UdftkluF8",
          durationLabel: "14:04",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-async-q1",
          prompt:
            "What is printed?\n\n```dart\nvoid main() {\n  print('1');\n  Future(() => print('2'));\n  scheduleMicrotask(() => print('3'));\n  Future.microtask(() => print('4'));\n  print('5');\n}\n```",
          options: ["`1 5 3 4 2`", "`1 2 3 4 5`", "`1 5 2 3 4`", "`1 5 4 3 2`"],
          correctIndex: 0,
          explanation:
            "Synchronous code first (`1`, `5`), then the microtask queue in FIFO order (`3`, `4`), then the event queue (`2`). The `Future()` constructor schedules on the event queue; `Future.microtask` and `scheduleMicrotask` do not.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-async-q2",
          prompt:
            "What is printed?\n\n```dart\nFuture<void> fetch() async {\n  print('B');\n  await Future<void>.delayed(Duration.zero);\n  print('D');\n}\n\nFuture<void> main() async {\n  print('A');\n  final f = fetch();\n  print('C');\n  await f;\n  print('E');\n}\n```",
          options: ["`A B C D E`", "`A C B D E`", "`A B D C E`", "`A C D B E`"],
          correctIndex: 0,
          explanation:
            "Calling an `async` function runs its body synchronously until the first `await`, so `B` prints before control returns to `main` and `C` runs. Exactly the same rule as a JavaScript `async` function.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-async-q3",
          prompt:
            "Three futures are passed to `Future.wait([a, b, c])` and `b` fails after 10 ms while `c` takes 2 s. When does the returned future complete, with the default options?",
          options: [
            "After about 2 s, with `b`'s error",
            "After about 10 ms, with `b`'s error",
            "After about 2 s, with a list containing `null` for `b`",
            "It never completes, because one future failed",
          ],
          correctIndex: 0,
          explanation:
            "By default `eagerError` is `false`, so `Future.wait` lets everything settle and then reports the first error, discarding the rest. `Promise.all` rejects immediately — pass `eagerError: true` for that behaviour.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-async-q4",
          prompt: "What is the difference between a single-subscription stream and a broadcast stream?",
          options: [
            "A single-subscription stream allows exactly one `listen` and buffers until then; a broadcast stream allows many listeners and drops events fired while nobody is listening",
            "A single-subscription stream is synchronous; a broadcast stream is asynchronous",
            "A broadcast stream can be awaited with `await for`; a single-subscription stream cannot",
            "A broadcast stream buffers; a single-subscription stream does not",
          ],
          correctIndex: 0,
          explanation:
            "Listening twice to a single-subscription stream throws. Converting with `asBroadcastStream()` is the usual fix, at the cost of losing anything emitted before the second listener attached.",
        },
        {
          id: "dart-async-q5",
          prompt: "What do `sync*` and `async*` return, respectively?",
          options: [
            "An `Iterable` and a `Stream`",
            "A `Stream` and an `Iterable`",
            "Both return a `Stream`; `sync*` just produces values eagerly",
            "An `Iterator` and a `StreamSubscription`",
          ],
          correctIndex: 0,
          explanation:
            "`sync*` is the lazy pull-based generator and `async*` the push-based one. Both use `yield` for a single value and `yield*` to delegate to another generator of the same kind.",
        },
        {
          id: "dart-async-q6",
          prompt:
            "What does `yield*` do inside a generator?",
          options: [
            "Delegates to another generator, emitting all of its values in place",
            "Yields the value and immediately ends the generator",
            "Yields a future that resolves to the value",
            "Yields the value to every listener of a broadcast stream",
          ],
          correctIndex: 0,
          explanation:
            "It is the same delegation idea as JavaScript's `yield*`. It is what makes recursive generators — walking a tree, flattening nested data — readable.",
        },
        {
          id: "dart-async-q7",
          prompt:
            "What is the risk in this line?\n\n```dart\nvoid onTap() {\n  saveToServer();\n}\n```\n\nwhere `saveToServer()` returns `Future<void>`.",
          options: [
            "If it fails, the error has no handler and surfaces as an unhandled asynchronous error far from this line",
            "It blocks the event loop until the save completes",
            "It runs on a separate isolate and cannot touch UI state",
            "It is a compile-time error: a `Future` must be awaited or returned",
          ],
          correctIndex: 0,
          explanation:
            "Nothing forces you to await, so a rejected future silently escapes. Either `await` it, return it, or wrap it in `unawaited(...)` to say the omission was deliberate — the `unawaited_futures` lint checks for this.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-async-q8",
          prompt: "Which of these are true about `await`? (Select all that apply.)",
          options: [
            "`await` on a non-Future value works; the value is wrapped in a completed future",
            "`await` may only appear inside a function marked `async`",
            "An `await` inside a `try` block catches errors from the awaited future",
            "`await for` iterates a stream and can only be used in an `async` function",
            "`await` blocks the isolate's thread until the future completes",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Awaiting suspends the *function*, not the thread — the event loop keeps running, which is exactly why a UI stays responsive across an `await` and why a long synchronous loop, which does block, is a different problem.",
        },
        {
          id: "dart-async-q9",
          prompt: "What does `StreamSubscription.pause()` give you that a JavaScript `for await` loop does not?",
          options: [
            "Explicit backpressure: the source can be told to stop producing until you resume",
            "The ability to replay events from the beginning",
            "Synchronous access to the most recent event",
            "Cancellation, which `for await` cannot do",
          ],
          correctIndex: 0,
          explanation:
            "`listen` hands you a subscription object with `pause`, `resume` and `cancel`, so flow control is part of the API rather than an implicit property of the consuming loop.",
        },
        {
          id: "dart-async-q10",
          prompt: "What is a `Completer` for?",
          options: [
            "Creating a future you complete manually, typically to bridge a callback-based API",
            "Waiting for several futures and combining their results",
            "Converting a stream into a future",
            "Scheduling work on the microtask queue",
          ],
          correctIndex: 0,
          explanation:
            "It is Dart's equivalent of constructing a `Promise` with explicit `resolve`/`reject`. If an `async` function or `Future.value` will do the job, use those instead — a `Completer` you forget to complete hangs forever.",
        },
        {
          id: "dart-async-q11",
          prompt:
            "A screen freezes for two seconds during a `Future` that parses a large JSON string. Why doesn't `async` help?",
          options: [
            "`async` only interleaves work on one thread; the synchronous parse still occupies the event loop for two seconds",
            "`Future` always runs its body on a background thread, so the freeze must be elsewhere",
            "The parse is fine; the freeze is caused by awaiting inside a loop",
            "`async` helps, but only if the function also returns a `Stream`",
          ],
          correctIndex: 0,
          explanation:
            "Asynchrony is about *scheduling*, not parallelism. A long synchronous computation blocks the loop regardless of how many `async` keywords surround it — that is what isolates are for.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-async-q12",
          prompt: "How do you handle an error emitted by a stream you are consuming with `await for`?",
          options: [
            "Wrap the `await for` loop in `try`/`catch` — the error is thrown at the loop",
            "Pass an `onError` callback to `await for`",
            "Errors on a stream cannot be caught; they always terminate the isolate",
            "Register a handler with `Stream.catchError` before awaiting",
          ],
          correctIndex: 0,
          explanation:
            "`await for` rethrows the stream's error at the loop, so ordinary `try`/`catch` works. `listen` is the alternative, and it takes an explicit `onError` because there is no enclosing statement to throw from.",
        },
      ],
    },

    {
      id: "dart-isolates",
      moduleId: "mobile-dart",
      trackId: "mobile",
      title: "Isolates and Shared-Nothing Concurrency",
      summary:
        "An isolate is the unit of concurrency in Dart, and its defining property is what it *lacks*: shared memory. Each isolate has its own heap and its own single thread running its own event loop, and two isolates cannot see each other's objects at all. Everything crosses the boundary as a message. That is not a limitation Dart works around — it is the design, and it is why there are no locks, no mutexes, no `volatile`, and no data races to reason about.\n\nThe contrast with Web Workers is instructive because the shapes are similar and the details are not. Workers also copy messages, but they can opt into genuinely shared memory with `SharedArrayBuffer`; Dart has no equivalent, only `TransferableTypedData`, which *moves* a buffer rather than sharing it. Dart's compensation is isolate groups: isolates spawned with `Isolate.spawn` share the same compiled code and runtime structures, which makes spawning cheap and message passing fast, while `Isolate.spawnUri` starts a fresh group and does not. `Isolate.exit()` hands its result over without copying, and only works within a group.\n\nIn practice `Isolate.run(() => parseHugeJson(text))` is the whole API most code needs: it spawns, runs one computation, transfers the result rather than copying it, and shuts down. Reach for it when a *synchronous* computation is long enough to drop frames — parsing, image manipulation, cryptography. Do not reach for it for I/O, which is already non-blocking; adding an isolate there buys nothing and costs a message round trip. And note that the web platform has no isolates at all, so anything you put behind `Isolate.run` needs a different plan if the app also targets the browser.",
      level: "expert",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        { label: "dart.dev: Isolates", url: "https://dart.dev/language/isolates", kind: "docs" },
        { label: "dart.dev: Concurrency in Dart", url: "https://dart.dev/language/concurrency", kind: "docs" },
        { label: "Dart blog: Isolates and event loops", url: "https://medium.com/dartlang/dart-asynchronous-programming-isolates-and-event-loops-bffc3e296a6a", kind: "article" },
        { label: "Code with Andrea: Parsing large JSON with isolates", url: "https://codewithandrea.com/articles/parse-large-json-dart-isolates/", kind: "article" },
      ],
      video: {
        title: "#20 - Dart Isolates, Threads, The Event Loop, Microtasks, Synchronous & Asynchronous workflows",
        channel: "Flutterly",
        url: "https://www.youtube.com/watch?v=ArbJhSsEwTk",
        videoId: "ArbJhSsEwTk",
        durationLabel: "24:39",
      },
      alternateVideos: [
        {
          title: "Isolates and Event Loops - Flutter in Focus",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=vl_AaCgudcY",
          videoId: "vl_AaCgudcY",
          durationLabel: "5:48",
        },
        {
          title: "Async vs Isolates | Decoding Flutter",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=5AxWC49ZMzs",
          videoId: "5AxWC49ZMzs",
          durationLabel: "4:24",
        },
        {
          title: "Learn to use Isolates in Flutter | Simplified",
          channel: "CodeX",
          url: "https://www.youtube.com/watch?v=WFfaaLwLobA",
          videoId: "WFfaaLwLobA",
          durationLabel: "10:27",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "dart-isolates-q1",
          prompt: "What does each isolate own?",
          options: [
            "Its own memory heap and a single thread running its own event loop",
            "A shared heap with per-isolate stacks",
            "A thread pool sized to the number of CPU cores",
            "A copy of the event loop but the same heap as its spawner",
          ],
          correctIndex: 0,
          explanation:
            "Isolation of memory is the whole idea. Because nothing is shared, no isolate can observe another mid-mutation, which removes data races as a category rather than as a bug to be avoided.",
        },
        {
          id: "dart-isolates-q2",
          prompt:
            "You send a large `Map` to a worker isolate with `SendPort.send`. What does the worker receive?",
          options: [
            "A deep copy of the map; mutating it in the worker cannot affect the original",
            "A reference to the same map, so both isolates see mutations",
            "A read-only view of the original map",
            "A serialized JSON string that must be decoded",
          ],
          correctIndex: 0,
          explanation:
            "Messages are copied across the boundary (immutable values such as strings, numbers and const objects can be shared by reference because nobody can change them). The copy is what makes the shared-nothing guarantee real, and it is also the cost.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-isolates-q3",
          prompt:
            "Wrapping a 300 ms synchronous computation in `async`/`await` does not stop the UI from stuttering. Why?",
          options: [
            "`async` schedules work on the same single thread; only an isolate gives you a second thread",
            "The computation needs to be marked `async*` instead",
            "`await` requires a `Duration` to yield to the event loop",
            "The stutter is caused by the microtask queue, not the computation",
          ],
          correctIndex: 0,
          explanation:
            "Asynchrony interleaves; it does not parallelise. Anything that holds the event loop for longer than a frame budget has to move to another isolate — this is the single most common performance misunderstanding in Dart.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-isolates-q4",
          prompt: "What does `Isolate.run(computation)` do?",
          options: [
            "Spawns an isolate, runs one computation, returns a `Future` of the result and shuts the isolate down",
            "Runs the computation on the current isolate's microtask queue",
            "Spawns a long-lived worker you communicate with through ports",
            "Runs the computation on a thread pool shared across the app",
          ],
          correctIndex: 0,
          explanation:
            "It packages the spawn/send/receive/shutdown dance into one call and transfers the result's memory instead of copying it where it can. For repeated work, a long-lived isolate with ports avoids paying the spawn cost each time.",
        },
        {
          id: "dart-isolates-q5",
          prompt: "How do `ReceivePort` and `SendPort` relate?",
          options: [
            "A `ReceivePort` creates one `SendPort` automatically, and a single `ReceivePort` can be fed by many `SendPort`s",
            "Each `SendPort` has exactly one matching `ReceivePort` and vice versa",
            "A `SendPort` can deliver to several `ReceivePort`s at once",
            "They are two names for the same object, used for readability",
          ],
          correctIndex: 0,
          explanation:
            "The pattern is like a `StreamController`: one receiver, many senders. Two-way communication means each side creating its own `ReceivePort` and sending the matching `SendPort` across.",
        },
        {
          id: "dart-isolates-q6",
          prompt: "What is an isolate group, and why does it matter?",
          options: [
            "Isolates spawned with `Isolate.spawn` share compiled code and runtime structures, making spawn cheap and messaging faster",
            "A pool of isolates managed automatically by the runtime",
            "A set of isolates that share a single heap",
            "A debugging construct with no runtime effect",
          ],
          correctIndex: 0,
          explanation:
            "Sharing code — not data — is what makes spawning an isolate affordable. `Isolate.spawnUri` starts a new group and loses that benefit, and `Isolate.exit()` only works between isolates in the same group.",
        },
        {
          id: "dart-isolates-q7",
          prompt: "Which of these are correct reasons to move work to an isolate? (Select all that apply.)",
          options: [
            "Parsing a multi-megabyte JSON payload",
            "Resizing or encoding an image in Dart code",
            "Running an expensive cryptographic key derivation",
            "Awaiting an HTTP response",
            "Reading a small value from local storage",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Isolates are for CPU-bound synchronous work that would hold the event loop. I/O is already non-blocking, so moving it just adds a message round trip and a spawn.",
        },
        {
          id: "dart-isolates-q8",
          prompt: "Why does Dart need no locks or mutexes?",
          options: [
            "No two isolates can reach the same object, so there is nothing to protect",
            "The runtime takes a global lock on every field write",
            "All Dart objects are immutable",
            "The event loop serialises access across all isolates",
          ],
          correctIndex: 0,
          explanation:
            "Removing shared mutable state removes the need for mutual exclusion. The price is that coordinating isolates means designing a message protocol rather than reaching into shared memory.",
        },
        {
          id: "dart-isolates-q9",
          prompt: "How do isolates differ from Web Workers?",
          options: [
            "Workers can share memory via `SharedArrayBuffer`; isolates have no shared-memory mechanism, only copying and transfer",
            "Workers copy messages while isolates share references",
            "Workers run on the same thread as the page; isolates always get a dedicated core",
            "There is no meaningful difference; isolates compile to Web Workers",
          ],
          correctIndex: 0,
          explanation:
            "Both copy by default, but only workers offer genuine shared memory. Dart's closest equivalent is `TransferableTypedData`, which moves ownership of a buffer rather than sharing it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-isolates-q10",
          prompt:
            "Your app targets mobile and the web, and a hot path uses `Isolate.run`. What must you plan for?",
          options: [
            "The web platform does not support isolates, so that path needs a different implementation there",
            "Nothing — `Isolate.run` compiles to a Web Worker automatically with identical semantics",
            "Isolates work on the web but messages are not copied",
            "Web builds run isolates on the main thread, so behaviour is identical but slower",
          ],
          correctIndex: 0,
          explanation:
            "Dart's web platform has no isolates; Web Workers exist but have a different API and cannot be created from a closure. Conditional imports or a platform-aware abstraction are the usual answer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "dart-isolates-q11",
          prompt:
            "A worker isolate throws an uncaught exception. What happens to the isolate that spawned it?",
          options: [
            "It is unaffected unless it registered an error listener or used an API such as `Isolate.run` that surfaces the error",
            "It is terminated as well, because isolates share a failure domain",
            "The exception propagates synchronously into the spawner's call stack",
            "The runtime restarts the worker automatically and retries",
          ],
          correctIndex: 0,
          explanation:
            "Isolates fail independently; an error does not cross the boundary by itself. `Isolate.run` forwards it into the returned future, and `Isolate.spawn` takes `onError` for the manual case — without either, the failure is easy to miss.",
        },
      ],
    },
  ],
} satisfies Module;
