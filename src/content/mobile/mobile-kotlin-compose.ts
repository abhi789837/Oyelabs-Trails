import type { Module } from "@/types/curriculum";

export default {
  id: "mobile-kotlin-compose",
  trackId: "mobile",
  name: "Kotlin & Jetpack Compose",
  description:
    "Kotlin the language and Compose the UI toolkit, for an engineer who already knows a modern language and React. Null safety, lambdas, coroutines and Flow first; then the declarative model, state, recomposition and the Modifier chain — with the places the React analogy stops holding.",
  refs: [
    { label: "Kotlin docs: Basic syntax overview", url: "https://kotlinlang.org/docs/basic-syntax.html", kind: "docs" },
    { label: "Android Developers: Jetpack Compose documentation", url: "https://developer.android.com/develop/ui/compose/documentation", kind: "docs" },
    { label: "Android Developers: Android Basics with Compose", url: "https://developer.android.com/courses/android-basics-compose/course", kind: "docs" },
  ],
  topics: [
    {
      id: "kt-language-shape",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Kotlin's Shape: Values, Inference and Data Classes",
      summary:
        "Kotlin exists because Java could not be changed. Android is pinned to whatever Java language level its toolchain desugars to, so JetBrains built a language that compiles to the same bytecode, calls Java both ways without a shim, and fixes the three things that hurt most: nullability lives in the type system, almost everything is an expression, and the boilerplate a Java value object needed collapses into one line. Google made it an officially supported Android language in 2017 and Kotlin-first in 2019 — not because it is fashionable but because an existing codebase can adopt it one file at a time.\n\n`val` and `var` are the first thing to get right, and the first thing people get wrong. `val` makes the *reference* read-only, not the object: `val items = mutableListOf(1)` still accepts `items.add(2)`. Type inference is local and complete, so `val count = 0` is an `Int` forever and `count = \"3\"` will not compile; the coding conventions still ask you to write return types on public API, because inference that crosses a module boundary is inference nobody can read.\n\nData classes generate `equals`/`hashCode`/`toString`/`copy`/`componentN` **from the primary constructor only** — a property declared in the class body is silently excluded from all of them, so two instances that differ only in a body property compare equal. `copy()` is shallow, so a nested `MutableList` is shared between original and copy. And `componentN` is positional: reordering two constructor properties of the same type keeps every destructuring declaration compiling while silently swapping the values.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Kotlin docs: Data classes", url: "https://kotlinlang.org/docs/data-classes.html", kind: "docs" },
        { label: "Android Developers: Kotlin and Android", url: "https://developer.android.com/kotlin/first", kind: "docs" },
        { label: "Kotlin docs: Destructuring declarations", url: "https://kotlinlang.org/docs/destructuring-declarations.html", kind: "docs" },
      ],
      video: {
        title: "Full 2025 Kotlin Crash Course For Beginners",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=dzUc9vrsldM",
        videoId: "dzUc9vrsldM",
        startSeconds: 692,
        chapterLabel: "val and var",
        durationLabel: "3:11:50",
      },
      alternateVideos: [
        {
          title: "Full 2025 Kotlin Crash Course For Beginners",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=dzUc9vrsldM",
          videoId: "dzUc9vrsldM",
          startSeconds: 7653,
          chapterLabel: "Normal class & data class",
          durationLabel: "3:11:50",
        },
        {
          title: "Kotlin in 100 Seconds",
          channel: "Fireship",
          url: "https://www.youtube.com/watch?v=xT8oP0wy-A0",
          videoId: "xT8oP0wy-A0",
          durationLabel: "2:21",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-language-shape-q1",
          prompt: "What does this print?\n\n```kotlin\nval items = mutableListOf(1, 2)\nitems.add(3)\nprintln(items.size)\n```",
          options: ["`3`", "It does not compile: `items` is a `val`", "`2`", "It throws `UnsupportedOperationException`"],
          correctIndex: 0,
          explanation:
            "`val` makes the reference read-only, not the object it points at. `items = mutableListOf()` would be rejected; `items.add(3)` is a method call on a mutable object and is fine. Immutability of the contents is `listOf` vs `mutableListOf`, a separate decision.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-language-shape-q2",
          prompt:
            "What does this print?\n\n```kotlin\ndata class Person(val name: String) {\n    var age: Int = 0\n}\n\nval a = Person(\"Ada\").apply { age = 36 }\nval b = Person(\"Ada\").apply { age = 12 }\nprintln(a == b)\n```",
          options: ["`true`", "`false`", "It does not compile", "`true` only if `age` is also a `val`"],
          correctIndex: 0,
          explanation:
            "The generated `equals` uses only properties declared in the *primary constructor*. `age` lives in the class body, so it is excluded from `equals`, `hashCode`, `toString` and `copy` — which is exactly how a data class ends up in a `HashSet` twice, or not at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-language-shape-q3",
          prompt:
            "What does this print?\n\n```kotlin\ndata class Employee(val name: String, val roles: MutableList<String>)\n\nval original = Employee(\"Jamie\", mutableListOf(\"developer\"))\nval duplicate = original.copy()\nduplicate.roles.add(\"team lead\")\nprintln(original.roles.size)\n```",
          options: ["`2`", "`1`", "It does not compile", "It throws `ConcurrentModificationException`"],
          correctIndex: 0,
          explanation:
            "`copy()` is a shallow copy: it passes the same `roles` reference to the new instance. Both objects now share one list. A deep copy has to be written by hand, or the property has to hold an immutable `List`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-language-shape-q4",
          prompt: "Which of these are true of Kotlin data classes? (Select all that apply.)",
          options: [
            "The primary constructor must have at least one parameter, and every parameter must be `val` or `var`",
            "`componentN()` functions are generated in declaration order, which is what makes destructuring positional",
            "A data class cannot be `abstract`, `open`, `sealed` or `inner`",
            "`copy()` performs a deep copy of nested objects",
            "Properties declared in the class body are included in `toString()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are the documented requirements. `copy()` is shallow and the generated members only ever consider primary-constructor properties, so the last two are the two misconceptions that cause real bugs.",
        },
        {
          id: "kt-language-shape-q5",
          prompt:
            "What does this print?\n\n```kotlin\ndata class Point(val x: Int, val y: Int)\n\nval a = Point(1, 2)\nval b = Point(1, 2)\nprintln(\"${a == b} ${a === b}\")\n```",
          options: ["`true false`", "`true true`", "`false false`", "`false true`"],
          correctIndex: 0,
          explanation:
            "`==` calls `equals`, which a data class generates structurally, so it is `true`. `===` is referential identity and these are two separate objects. In Java the operators are the other way round, which is why this trips people coming from Java.",
        },
        {
          id: "kt-language-shape-q6",
          prompt: "What happens here?\n\n```kotlin\nvar count = 0\ncount = \"3\"\n```",
          options: [
            "A compile error: `count` was inferred as `Int` at its declaration",
            "It compiles and `count` becomes the string `\"3\"`",
            "It compiles and `count` becomes the number `3`",
            "A runtime `ClassCastException`",
          ],
          correctIndex: 0,
          explanation:
            "Inference fixes the type once, at the declaration; it is not a dynamic-language `var`. Assigning a `String` to an `Int` variable is a type mismatch the compiler rejects. Writing `var count: Any = 0` is how you would opt out.",
        },
        {
          id: "kt-language-shape-q7",
          prompt:
            "How often does `total` run its body?\n\n```kotlin\nclass Cart(val items: List<Int>) {\n    val total: Int get() = items.sum()\n}\n```",
          options: [
            "Every time `total` is read — a custom getter means there is no backing field",
            "Once, when the `Cart` is constructed",
            "Once per instance, on the first read, and then cached",
            "It does not compile: a `val` cannot have a getter",
          ],
          correctIndex: 0,
          explanation:
            "`val` means \"no setter\", not \"computed once\". With a custom getter there is no backing field at all, so the body runs on every access. `by lazy` is what gives you compute-once-and-cache.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-language-shape-q8",
          prompt:
            "A colleague reorders a data class's constructor to put `name` first:\n\n```kotlin\n// before: data class User(val id: String, val name: String)\ndata class User(val name: String, val id: String)\n```\n\nElsewhere the code reads `val (id, name) = user`. What happens?",
          options: [
            "It still compiles, and `id` now holds the name while `name` holds the id",
            "A compile error, because the destructured names no longer match the properties",
            "A compile error, because the constructor signature changed",
            "It still compiles and the values are matched by name",
          ],
          correctIndex: 0,
          explanation:
            "Destructuring is positional: `val (a, b) = x` is `component1()`/`component2()`, and the local names are arbitrary. Two `String` properties swapping places is a silent behaviour change — which is why named arguments at the construction site and explicit property access are safer than destructuring for anything wider than a `Pair`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-language-shape-q9",
          prompt: "Why did Google adopt an existing JVM language for Android rather than raising Android's Java language level?",
          options: [
            "Kotlin compiles to the same bytecode and interoperates with Java in both directions, so an existing app can adopt it file by file",
            "Kotlin runs on its own runtime, which replaced ART on modern devices",
            "Kotlin source is transpiled to Java source before compilation, so no toolchain changes were needed",
            "Java's licensing prevented Android from shipping any Java language features after Java 7",
          ],
          correctIndex: 0,
          explanation:
            "Incremental adoption was the whole point: Kotlin and Java classes sit in the same module and call each other. It is not transpiled to Java source, and it targets the ordinary Android runtime.",
        },
      ],
    },

    {
      id: "kt-null-safety",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Null Safety",
      summary:
        "Kotlin moves nullability into the type system: `String` and `String?` are different types, and the compiler refuses to dereference the nullable one without proving it is not null. This is not a lint rule you can ignore — it removes Android's single most common crash as a category. Four operators do the work: `?.` (safe call: returns `null` and short-circuits the *rest of the chain*), `?:` (Elvis: supply a fallback, or `return`/`throw`, which type as `Nothing` and so satisfy any expected type), `!!` (assert non-null, throw otherwise) and `?.let { }` (run a block only when non-null).\n\nIf you know TypeScript, the difference is that TypeScript's `strictNullChecks` is erased at runtime — a value typed `string` really can be `null` if it came in from untyped JavaScript, and you find out three frames later. Kotlin emits real runtime null checks at public function boundaries, so a null arriving from Java fails where it crosses, naming the parameter. Dart's sound null safety is the closest relative, but Kotlin has an escape hatch Dart does not: a value from unannotated Java is a **platform type** (`String!`), where the compiler neither requires nor forbids a check. Platform types are the one place the guarantee is only as good as the Java library's `@Nullable`/`@NonNull` annotations.\n\nTwo gotchas worth internalising. `lateinit var` opts out of initialisation checking for a non-null `var` — reading it early throws `UninitializedPropertyAccessException`, not a `NullPointerException`, and it is illegal for `val` and for primitive types. And smart casts have a soundness rule: after `if (h.value != null)`, `h.value` is *not* smart-cast when `value` is a mutable property of another object, because nothing stops another thread changing it between the check and the use. Copy it into a local `val` first.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Kotlin docs: Null safety", url: "https://kotlinlang.org/docs/null-safety.html", kind: "docs" },
        { label: "Kotlin docs: Calling Java from Kotlin (platform types)", url: "https://kotlinlang.org/docs/java-interop.html", kind: "docs" },
        { label: "Kotlin docs: Type checks and casts", url: "https://kotlinlang.org/docs/typecasts.html", kind: "docs" },
      ],
      video: {
        title: "Full 2025 Kotlin Crash Course For Beginners",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=dzUc9vrsldM",
        videoId: "dzUc9vrsldM",
        startSeconds: 2201,
        chapterLabel: "Nullability & null-safe operators",
        durationLabel: "3:11:50",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-null-safety-q1",
          prompt: "What does this print?\n\n```kotlin\nval name: String? = null\nprintln(name?.length)\n```",
          options: ["`null`", "`0`", "It throws a `NullPointerException`", "It does not compile"],
          correctIndex: 0,
          explanation:
            "`?.` evaluates to `null` when the receiver is null, and `println` prints the string `null`. The expression's type is `Int?`, which is why you usually pair it with `?:`.",
        },
        {
          id: "kt-null-safety-q2",
          prompt:
            "What does this print?\n\n```kotlin\nclass Address(val city: String?)\nclass User(val address: Address?)\n\nval u = User(null)\nprintln(u.address?.city?.uppercase()?.length)\n```",
          options: ["`null`", "`0`", "It throws a `NullPointerException`", "It does not compile because `uppercase()` is not nullable"],
          correctIndex: 0,
          explanation:
            "The first `?.` short-circuits the entire remaining chain, so `city`, `uppercase()` and `length` are never evaluated. Each link only needs `?.` because the *previous* link's result is nullable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-null-safety-q3",
          prompt: "What does `val n: Int = maybe!!.length` do when `maybe` is `null`?",
          options: [
            "Throws a `NullPointerException` at that line",
            "Assigns `0` to `n`",
            "Fails to compile, because `!!` is only allowed on `var`",
            "Throws an `UninitializedPropertyAccessException`",
          ],
          correctIndex: 0,
          explanation:
            "`!!` is a deliberate assertion: \"I know better than the compiler.\" When you are wrong it throws an NPE naming that expression. It is the right tool roughly never in UI code, and occasionally at a boundary you have already validated.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-null-safety-q4",
          prompt: "Which of these are true of platform types (the `String!` you get from unannotated Java)? (Select all that apply.)",
          options: [
            "A Java method returning `String` with no nullability annotation appears in Kotlin as `String!`",
            "You can assign a platform type to either `String` or `String?` without a cast",
            "Adding `@Nullable` on the Java declaration makes Kotlin see a real `String?`",
            "You can write a platform type yourself in Kotlin source with the `!` suffix",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Platform types exist only as a compiler notation for values crossing from Java; you cannot declare one. Assigning to a non-null type inserts a runtime check, so a lying Java API fails at the boundary rather than deep inside your code.",
        },
        {
          id: "kt-null-safety-q5",
          prompt:
            "What happens here?\n\n```kotlin\nclass Screen {\n    private lateinit var adapter: Adapter\n\n    fun render() = adapter.itemCount\n}\n\nScreen().render()\n```",
          options: [
            "It throws `UninitializedPropertyAccessException`",
            "It throws `NullPointerException`",
            "It returns `0`",
            "It does not compile, because `adapter` is never assigned",
          ],
          correctIndex: 0,
          explanation:
            "`lateinit` suppresses the initialisation requirement, not the check: the generated getter throws a dedicated exception naming the property. `lateinit` is illegal on `val` and on primitives like `Int`, which is a common follow-up question.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-null-safety-q6",
          prompt:
            "Why does the marked line fail to compile?\n\n```kotlin\nclass Holder { var value: String? = null }\n\nfun show(h: Holder) {\n    if (h.value != null) {\n        println(h.value.length)   // <- error\n    }\n}\n```",
          options: [
            "`h.value` is a mutable property of another object, so the compiler cannot prove it is still non-null at the use site",
            "Smart casts never apply to properties, only to local variables",
            "`length` is not defined on `String?`, so an explicit cast is always required",
            "The `if` needs to be `if (h.value is String)` for a smart cast to happen",
          ],
          correctIndex: 0,
          explanation:
            "Another thread — or a getter with side effects — could change `h.value` between the check and the read, so the smart cast would be unsound. `val v = h.value ?: return` copies it into an immutable local, which does smart-cast.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-null-safety-q7",
          prompt:
            "What does this print?\n\n```kotlin\nval s: String? = null\nval out = s?.let { \"value: $it\" } ?: \"none\"\nprintln(out)\n```",
          options: ["`none`", "`value: null`", "`null`", "It throws a `NullPointerException`"],
          correctIndex: 0,
          explanation:
            "`?.let` skips the block entirely and yields `null` when the receiver is null, so the Elvis fallback supplies `\"none\"`. Inside the block, `it` is the smart-cast non-null `String`.",
        },
        {
          id: "kt-null-safety-q8",
          prompt: "What is `?:` doing in `val id = user?.id ?: return`, and why is it legal?",
          options: [
            "It returns from the enclosing function when `user` is null — `return` has type `Nothing`, which is a subtype of everything",
            "It assigns the special value `return` to `id` when `user` is null",
            "It is a compile error: `return` is a statement and cannot appear in an expression",
            "It throws a `NullPointerException` when `user` is null",
          ],
          correctIndex: 0,
          explanation:
            "`return` and `throw` are expressions of type `Nothing`, so they fit on the right of Elvis whatever the left side's type is. This is the standard early-return-plus-smart-cast idiom.",
        },
        {
          id: "kt-null-safety-q9",
          prompt:
            "A Java library method `getName()` is unannotated and actually returns `null`. Kotlin calls it as `val name: String = lib.getName()`. When and how does this fail?",
          options: [
            "Immediately at that assignment, with an NPE naming the expression, because the compiler inserts a runtime check",
            "Never — the platform type means Kotlin simply stores `null` in a `String`",
            "Later, the first time `name` is dereferenced",
            "At compile time, because Kotlin refuses to assign a platform type to a non-null type",
          ],
          correctIndex: 0,
          explanation:
            "This is the difference from TypeScript, whose types are erased: Kotlin's inserted intrinsic check fails at the boundary, where the bad value entered, rather than three frames later where it is used.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-null-safety-q10",
          prompt: "Which expression safely produces the length of a nullable `String?` called `s`, defaulting to `0`?",
          options: [
            "`s?.length ?: 0`",
            "`s!!.length ?: 0`",
            "`s.length ?: 0`",
            "`s ?: 0.length`",
          ],
          correctIndex: 0,
          explanation:
            "`?.` yields `Int?` and Elvis collapses it to `Int`. `s!!` throws instead of defaulting (and makes the `?:` unreachable), and `s.length` will not compile on a nullable receiver.",
        },
      ],
    },

    {
      id: "kt-functions-extensions",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Functions, Named Arguments and Extension Functions",
      summary:
        "Default and named arguments delete the telescoping-overload pattern: one function with five defaulted parameters replaces the five Java overloads that forwarded into each other. The cost is that parameter *names* become public API — renaming one is a source-breaking change for every caller that used it by name — and that defaults are a Kotlin-side convention. Java callers only see the full-arity signature plus a synthetic bridge unless you add `@JvmOverloads`, which matters the moment a Kotlin utility is called from legacy Java.\n\nExtension functions let you add methods to a type you do not own without inheritance or wrappers. The critical detail is that they are **resolved statically**: `fun View.describe()` compiles to a static method taking the receiver as its first parameter, and the call site picks an implementation from the *declared* type of the expression, not its runtime type. A member function always wins over an extension with the same signature. This is the opposite of virtual dispatch and it is the standard Kotlin interview question, because \"Kotlin monkey-patches the class\" is the intuitive and wrong model.\n\nIt is also why this camp cares. Compose's `Modifier` chain, `LazyListScope.item`, Gradle's Kotlin DSL and half the standard library are extensions plus receiver-scoped lambdas. Extension *properties* work the same way but cannot have backing fields — `val Foo.bar get() = …` only — because an extension adds no state to the class. And an extension declared on a nullable receiver (`fun String?.orDash(): String`) can be called without `?.`, which is occasionally exactly what you want and occasionally a null that quietly stops being visible.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "Kotlin docs: Extensions", url: "https://kotlinlang.org/docs/extensions.html", kind: "docs" },
        { label: "Kotlin docs: Functions", url: "https://kotlinlang.org/docs/functions.html", kind: "docs" },
        { label: "Effective Kotlin: Consider extracting non-essential API into extensions", url: "https://kt.academy/article/ek-extensions", kind: "article" },
      ],
      video: {
        title: "Full 2025 Kotlin Crash Course For Beginners",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=dzUc9vrsldM",
        videoId: "dzUc9vrsldM",
        startSeconds: 6123,
        chapterLabel: "Extension functions",
        durationLabel: "3:11:50",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-functions-extensions-q1",
          prompt:
            "What does this print?\n\n```kotlin\nopen class Base\nclass Derived : Base()\n\nfun Base.name() = \"Base\"\nfun Derived.name() = \"Derived\"\n\nval x: Base = Derived()\nprintln(x.name())\n```",
          options: ["`Base`", "`Derived`", "It does not compile: ambiguous call", "It throws at runtime"],
          correctIndex: 0,
          explanation:
            "Extensions are resolved statically from the declared type of the receiver expression, which is `Base`. Nothing is virtual here — the call compiles to a static method invocation. Making them members instead would print `Derived`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-functions-extensions-q2",
          prompt:
            "What does this print?\n\n```kotlin\nclass Box {\n    fun hello() = \"member\"\n}\n\nfun Box.hello() = \"extension\"\n\nprintln(Box().hello())\n```",
          options: [
            "`member`, and the compiler warns that the extension is shadowed",
            "`extension`, because extensions are applied last",
            "It does not compile: duplicate declaration",
            "`member` on the JVM and `extension` on other targets",
          ],
          correctIndex: 0,
          explanation:
            "A member always wins over an extension with the same receiver and signature. The extension is simply never callable on that type, which is why the compiler emits a \"shadowed by a member\" warning.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-functions-extensions-q3",
          prompt:
            "What does this print?\n\n```kotlin\nfun String?.orDash(): String = this ?: \"-\"\n\nval s: String? = null\nprintln(s.orDash())\n```",
          options: [
            "`-` — the receiver type is nullable, so no safe call is needed",
            "`null`",
            "It does not compile: `s` must be called with `s?.orDash()`",
            "It throws a `NullPointerException`",
          ],
          correctIndex: 0,
          explanation:
            "Declaring the extension on `String?` means `this` is nullable *inside* the function and the call site needs no `?.`. Handy for formatting helpers, and a trap if a reader assumes every dot-call proves non-nullness.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-functions-extensions-q4",
          prompt:
            "What does this print?\n\n```kotlin\nfun greet(name: String, greeting: String = \"Hello\", punctuation: String = \"!\") =\n    \"$greeting, $name$punctuation\"\n\nprintln(greet(\"Ada\", punctuation = \"?\"))\n```",
          options: ["`Hello, Ada?`", "`Hello, Ada!`", "`?, Ada!`", "It does not compile: `greeting` was skipped"],
          correctIndex: 0,
          explanation:
            "Named arguments let you skip a defaulted parameter in the middle. Without names you would have to pass `greeting` positionally just to reach `punctuation` — the exact problem overloads used to paper over.",
        },
        {
          id: "kt-functions-extensions-q5",
          prompt: "Which of these are genuine consequences of Kotlin's named and default arguments? (Select all that apply.)",
          options: [
            "Parameter names become part of your public API — renaming one breaks callers that used it by name",
            "Java callers see only the full-arity signature unless the function is annotated `@JvmOverloads`",
            "A default value expression is evaluated on each call that omits the argument, not once at declaration",
            "Adding a new parameter with a default value is binary-compatible for callers that were already compiled",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are the real trade-offs. The last is the one that bites library authors: adding a defaulted parameter is source-compatible but changes the generated signature, so already-compiled callers need recompiling.",
        },
        {
          id: "kt-functions-extensions-q6",
          prompt: "Why can an extension property have a getter but never a backing field?",
          options: [
            "An extension adds no state to the class — there is nowhere to store a field on an object you do not own",
            "Backing fields are only allowed on `var`, and extension properties are always `val`",
            "The compiler stores extension fields in a hidden map, which is disabled by default",
            "Backing fields would break Java interop, so they are prohibited in all Kotlin properties",
          ],
          correctIndex: 0,
          explanation:
            "Extensions compile to static functions; they cannot widen the receiver class's layout. So `val List<T>.secondOrNull get() = getOrNull(1)` is fine, and `val List<T>.cache = mutableMapOf<…>()` is not.",
        },
        {
          id: "kt-functions-extensions-q7",
          prompt: "How does Kotlin actually let you call `\"abc\".titleCase()` for a function you declared in your own file?",
          options: [
            "It compiles to a static function whose first parameter is the receiver; the call site is rewritten to pass it",
            "The Kotlin runtime reopens `java.lang.String` and installs the method at class-load time",
            "The compiler generates a subclass of `String` that carries the extra method",
            "It wraps the string in a hidden decorator object for the duration of the call",
          ],
          correctIndex: 0,
          explanation:
            "Nothing about `String` changes — Java code cannot see `titleCase()` at all. Thinking of extensions as Ruby-style monkey-patching is the misconception that makes the static-dispatch behaviour surprising.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-functions-extensions-q8",
          prompt: "Why does `Modifier.padding(8.dp).background(Color.Red)` read as a chain?",
          options: [
            "Each call is an extension on `Modifier` that returns a new `Modifier`, so the result can be extended again",
            "`Modifier` is a mutable builder and each call mutates it in place",
            "The Compose compiler plugin rewrites dotted calls on `Modifier` into a list literal",
            "`Modifier` overloads the `.` operator",
          ],
          correctIndex: 0,
          explanation:
            "They are ordinary extension functions returning a new immutable `Modifier` that wraps the previous one. That is also why order matters — covered in the layout topic.",
        },
        {
          id: "kt-functions-extensions-q9",
          prompt: "Kotlin's coding conventions say to declare the return type explicitly on public API even for single-expression functions. Why?",
          options: [
            "So a change to the body cannot silently change a published type, and so readers do not have to infer it",
            "Because the compiler cannot infer return types across module boundaries",
            "Because inferred return types are erased and become `Any` in the compiled class file",
            "Because single-expression functions cannot be called from Java without an explicit type",
          ],
          correctIndex: 0,
          explanation:
            "Inference works fine across modules; the argument is about API stability and readability. Editing `fun total() = items.sum()` to return a `Long` would silently change your published signature.",
        },
      ],
    },

    {
      id: "kt-lambdas-higher-order",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Lambdas, Higher-Order Functions and Trailing Lambdas",
      summary:
        "Function types are ordinary types in Kotlin — `(Int) -> String` can be a parameter, a return value or a property — so higher-order functions need no interfaces and no ceremony. On top of that sits one syntactic rule with outsized consequences: if the **last** parameter is a function type, the lambda may be written outside the parentheses, and if it is the only argument the parentheses disappear entirely. That single rule is why `Column { … }`, `LazyColumn { items(…) }`, `remember { … }` and Gradle's `android { … }` read like language constructs rather than function calls.\n\nA lambda with a receiver, `T.() -> Unit`, goes further: inside the block, `T`'s members are in scope unqualified. That is `apply`, `buildString`, `Modifier`-scoped helpers like `BoxScope.align`, and every type-safe builder DSL. The pattern to recognise is \"a function whose last parameter is a receiver lambda\" — once you see it, Compose's API design stops looking magic.\n\nThe performance story is `inline`. A non-inline lambda is a real object (`Function1`) plus a closure for whatever it captures; in a hot list that allocation is visible. `inline` copies both the function body and the lambda body into the call site, so there is no object at all — and, as a side effect, a bare `return` inside the lambda returns from the *enclosing* function (a non-local return), which is how `forEach { if (…) return x }` works and why `map`/`let`/`run`/`forEach` are all inline. `crossinline` forbids the non-local return when the lambda will be invoked from another context (a thread, a callback); `noinline` keeps one lambda as a real object so it can be stored or passed on. Marking a large function `inline`, or one with no function parameters, is a code-size regression and the compiler warns about the latter.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Kotlin docs: Higher-order functions and lambdas", url: "https://kotlinlang.org/docs/lambdas.html", kind: "docs" },
        { label: "Kotlin docs: Inline functions", url: "https://kotlinlang.org/docs/inline-functions.html", kind: "docs" },
        { label: "Kotlin docs: Type-safe builders", url: "https://kotlinlang.org/docs/type-safe-builders.html", kind: "docs" },
      ],
      video: {
        title: "Full 2025 Kotlin Crash Course For Beginners",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=dzUc9vrsldM",
        videoId: "dzUc9vrsldM",
        startSeconds: 6745,
        chapterLabel: "Lambda functions",
        durationLabel: "3:11:50",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-lambdas-higher-order-q1",
          prompt:
            "What does this return for `listOf(1, -4, 7)`?\n\n```kotlin\nfun firstNegative(nums: List<Int>): Int? {\n    nums.forEach {\n        if (it < 0) return it\n    }\n    return null\n}\n```",
          options: [
            "`-4` — `forEach` is `inline`, so the bare `return` exits `firstNegative`",
            "`null` — the `return` only exits the lambda",
            "It does not compile: `return` is not allowed inside a lambda",
            "`1` — the first element is returned regardless",
          ],
          correctIndex: 0,
          explanation:
            "A bare `return` inside a lambda passed to an inline function is a non-local return from the enclosing function. If `forEach` were not inline this would not compile, and you would need `return@forEach`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-lambdas-higher-order-q2",
          prompt:
            "What does this print?\n\n```kotlin\nfun countPositive(nums: List<Int>): Int {\n    var c = 0\n    nums.forEach {\n        if (it < 0) return@forEach\n        c++\n    }\n    return c\n}\n\nprintln(countPositive(listOf(1, -1, 2)))\n```",
          options: ["`2`", "`1`", "`3`", "`0`"],
          correctIndex: 0,
          explanation:
            "`return@forEach` is a labelled return: it ends *this iteration's* lambda, the Kotlin equivalent of `continue`. Two of the three values reach `c++`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-lambdas-higher-order-q3",
          prompt: "Which of these are true of the trailing-lambda convention? (Select all that apply.)",
          options: [
            "It applies only when the function type is the function's last parameter",
            "If the lambda is the only argument, the parentheses may be omitted entirely",
            "`Column(modifier = m) { … }` passes the block as the `content` parameter",
            "It is provided by the Compose compiler plugin, not by the Kotlin language",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "It is plain Kotlin syntax and it is why Compose's API reads the way it does — Compose simply puts `content: @Composable () -> Unit` last on purpose. A function-type parameter that is not last must be passed inside the parentheses.",
        },
        {
          id: "kt-lambdas-higher-order-q4",
          prompt:
            "What does this print?\n\n```kotlin\nval s = StringBuilder().apply {\n    append(\"a\")\n    append(\"b\")\n}.toString()\nprintln(s)\n```",
          options: ["`ab`", "`b`", "`ba`", "It does not compile: `append` is not in scope"],
          correctIndex: 0,
          explanation:
            "`apply` takes a lambda *with receiver*, so `this` is the `StringBuilder` and its members resolve unqualified. The same mechanism gives Compose scopes like `RowScope` their members.",
        },
        {
          id: "kt-lambdas-higher-order-q5",
          prompt:
            "What does this print, and how does it differ from Java?\n\n```kotlin\nvar sum = 0\nlistOf(1, 2, 3).forEach { sum += it }\nprintln(sum)\n```",
          options: [
            "`6` — Kotlin lambdas can capture and modify a `var`, unlike Java's effectively-final rule",
            "`0` — the lambda gets a copy of `sum`",
            "It does not compile: a captured variable must be `val`",
            "`6`, and Java allows exactly the same",
          ],
          correctIndex: 0,
          explanation:
            "Kotlin boxes a captured mutable local into a `Ref` object so the lambda can write through it. Java requires captured locals to be effectively final, which is why Java code reaches for arrays or `AtomicInteger` here.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-lambdas-higher-order-q6",
          prompt:
            "What does this print?\n\n```kotlin\nfun square(n: Int) = n * n\nprintln(listOf(1, 2, 3).map(::square))\n```",
          options: ["`[1, 4, 9]`", "`[1, 2, 3]`", "It does not compile: `map` needs a lambda, not a reference", "`[2, 4, 6]`"],
          correctIndex: 0,
          explanation:
            "`::square` is a function reference, usable anywhere a matching function type is expected. `Type::member` and `instance::member` work the same way, which is what `onClick = viewModel::submit` relies on.",
        },
        {
          id: "kt-lambdas-higher-order-q7",
          prompt: "What does marking a higher-order function `inline` actually do, and what is the cost?",
          options: [
            "It copies the function and lambda bodies into the call site, removing the function-object allocation and enabling non-local returns; the cost is code size",
            "It caches the lambda instance so only one is ever allocated; the cost is memory retention",
            "It runs the function on a background thread; the cost is thread scheduling",
            "It makes the function `final` so it cannot be overridden; there is no cost",
          ],
          correctIndex: 0,
          explanation:
            "Inlining is a compile-time copy. That is why it is right for tiny stdlib helpers called in hot loops and wrong for a large function, and why the compiler warns when you inline a function that takes no lambdas at all.",
        },
        {
          id: "kt-lambdas-higher-order-q8",
          prompt: "Why can you pass a lambda to the Java method `view.setOnClickListener(…)`, which expects an interface?",
          options: [
            "SAM conversion: Kotlin converts a lambda to an instance of a Java single-abstract-method interface automatically",
            "Kotlin interfaces and Java interfaces are the same thing at the bytecode level, so no conversion is needed",
            "The Android Gradle plugin rewrites listener calls at build time",
            "`setOnClickListener` is an extension function added by the Kotlin standard library",
          ],
          correctIndex: 0,
          explanation:
            "SAM conversion applies automatically to *Java* interfaces. A Kotlin interface needs `fun interface` to opt in — a deliberate difference, because Kotlin would rather you used a function type.",
        },
        {
          id: "kt-lambdas-higher-order-q9",
          prompt:
            "Why does this need `crossinline`?\n\n```kotlin\ninline fun runLater(crossinline block: () -> Unit) {\n    Thread { block() }.start()\n}\n```",
          options: [
            "The lambda is invoked from another execution context, where a non-local return would have no enclosing frame to return from",
            "`crossinline` is required whenever an inline function starts a thread",
            "Without it the lambda would be allocated on the heap",
            "It forces the lambda to run synchronously before the thread starts",
          ],
          correctIndex: 0,
          explanation:
            "Inlining normally permits a non-local return, but here the body ends up inside another lambda that runs later on a different thread. `crossinline` keeps the inlining and forbids the non-local return.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-lambdas-higher-order-q10",
          prompt:
            "What does this print?\n\n```kotlin\nfun adder(n: Int): (Int) -> Int = { it + n }\n\nval add5 = adder(5)\nprintln(add5(3))\n```",
          options: ["`8`", "`5`", "`3`", "It does not compile: a function cannot return a lambda"],
          correctIndex: 0,
          explanation:
            "The returned lambda closes over `n`. Function types being ordinary types is what makes currying, `Modifier` factories and Compose's `onClick: () -> Unit` parameters possible without any interface declarations.",
        },
      ],
    },

    {
      id: "kt-scope-functions",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Scope Functions: let, run, apply, also and with",
      summary:
        "Five standard-library functions do almost the same thing, and choosing between them is decided by exactly two questions. **How is the context object referenced** — as the receiver `this` (`run`, `with`, `apply`) or as the argument `it` (`let`, `also`)? And **what does the call return** — the lambda's result (`let`, `run`, `with`) or the context object itself (`apply`, `also`)?\n\nThat gives each one a job. `let` is the null-guarded transformation: `value?.let { … }`. `run` configures an object *and* computes a result, and its receiver-less form `run { … }` is a way to scope some locals to a single expression. `with` is `run` written as a normal function taking the object as an argument, so it cannot be chained off a nullable. `apply` is the builder: configure and hand the object back. `also` is for side effects that must not change what is flowing through a chain — logging, a validation check, `requireNotNull`.\n\nTwo gotchas earn their place. First, `apply` and `also` return the receiver *whatever the last expression in the block evaluates to*, so a block that computes something useful silently discards it — a bug that reads as correct. Second, inside `apply`/`run`/`with` the implicit receiver shadows the enclosing class's `this`, so an unqualified property name resolves to the context object first; `this@Outer.name` is how you reach past it. The style rule that follows from both: nest scope functions sparingly, and never nest two that both bind `this`, because the reader can no longer tell which object a bare name belongs to.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Kotlin docs: Scope functions", url: "https://kotlinlang.org/docs/scope-functions.html", kind: "docs" },
        { label: "Kotlin docs: Coding conventions", url: "https://kotlinlang.org/docs/coding-conventions.html", kind: "docs" },
        { label: "Android Interview Questions (Amit Shekhar)", url: "https://github.com/amitshekhariitbhu/android-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Let, Also, Apply, Run, With - Kotlin Scope Functions",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=Vy-dS2SVoHk",
        videoId: "Vy-dS2SVoHk",
        durationLabel: "11:44",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-scope-functions-q1",
          prompt:
            "What does this print?\n\n```kotlin\nval a = \"abc\".run { length }\nval b = \"abc\".apply { length }\nprintln(\"$a $b\")\n```",
          options: ["`3 abc`", "`3 3`", "`abc abc`", "`abc 3`"],
          correctIndex: 0,
          explanation:
            "`run` returns the lambda's result; `apply` returns the receiver and throws the block's value away. This is exactly the bug where someone writes a computation inside `apply` and wonders why the result is the object.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-scope-functions-q2",
          prompt:
            "What does this print?\n\n```kotlin\nval x: String? = \"kotlin\"\nprintln(x?.let { it.length })\n```",
          options: ["`6`", "`kotlin`", "`null`", "It does not compile: `it` is nullable inside the block"],
          correctIndex: 0,
          explanation:
            "`?.let` runs the block only when the receiver is non-null and yields the block's result. Inside, `it` is the non-null `String`, so `it.length` needs no further check.",
        },
        {
          id: "kt-scope-functions-q3",
          prompt:
            "What does this print?\n\n```kotlin\nval nums = mutableListOf(1, 2)\nval r = nums.also { it.add(3) }\nprintln(r.size)\n```",
          options: ["`3`", "`2`", "`1`", "It does not compile: `also` must return `Unit`"],
          correctIndex: 0,
          explanation:
            "`also` returns the context object, so `r` *is* `nums`, now with three elements. Its purpose is a side effect that leaves the value flowing through a chain untouched.",
        },
        {
          id: "kt-scope-functions-q4",
          prompt: "Which of these return the context object rather than the lambda's result? (Select all that apply.)",
          options: ["`apply`", "`also`", "`let`", "`run`", "`with`"],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`apply` and `also` return the receiver — they differ only in whether it is bound as `this` or `it`. `let`, `run` and `with` all return whatever the block evaluates to.",
        },
        {
          id: "kt-scope-functions-q5",
          prompt: "Which pair exposes the context object as `it` rather than as an implicit `this`?",
          options: ["`let` and `also`", "`run` and `with`", "`apply` and `also`", "`let` and `run`"],
          correctIndex: 0,
          explanation:
            "`let` and `also` pass the object as a lambda argument, which is why you can rename it (`user.let { u -> … }`) and why they read better when the object is not the subject of the block.",
        },
        {
          id: "kt-scope-functions-q6",
          prompt:
            "What is `Server().build().host`?\n\n```kotlin\nclass Config { var host: String = \"\" }\n\nclass Server {\n    private val host = \"prod.example.com\"\n\n    fun build(): Config = Config().apply {\n        host = \"staging.example.com\"\n    }\n}\n```",
          options: [
            "`staging.example.com` — inside `apply`, the unqualified `host` resolves to the `Config` receiver",
            "`prod.example.com` — the outer class's property wins",
            "An empty string — the assignment targets a local",
            "It does not compile: `host` is ambiguous",
          ],
          correctIndex: 0,
          explanation:
            "The innermost implicit receiver wins, so `host =` writes to the `Config`. Reaching the outer one needs `this@Server.host`. When two objects in scope share a property name, this is the shadowing bug that produces \"the value I set never arrived\".",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-scope-functions-q7",
          prompt:
            "A colleague writes `with(user) { … }` where `user` is a `User?`. What happens?",
          options: [
            "It compiles, but `this` is nullable inside the block, so every member access still needs `?.` — `user?.run { … }` is the null-guarded form",
            "It throws a `NullPointerException` when `user` is null",
            "It does not compile: `with` rejects nullable arguments",
            "The block is skipped when `user` is null, exactly like `?.let`",
          ],
          correctIndex: 0,
          explanation:
            "`with` is a normal function taking the object as its first argument, so there is no safe-call site to short-circuit. `run` and `let` are extensions, which is why they can be prefixed with `?.` — the real reason to prefer them on nullable values.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-scope-functions-q8",
          prompt:
            "What does this print?\n\n```kotlin\nval status = run {\n    val code = 404\n    if (code >= 400) \"error\" else \"ok\"\n}\nprintln(status)\n```",
          options: [
            "`error` — the receiver-less `run` scopes locals to a single expression",
            "It does not compile: `run` requires a receiver",
            "`ok`",
            "`kotlin.Unit`",
          ],
          correctIndex: 0,
          explanation:
            "There are two `run`s in the standard library: the extension `T.run` and this plain one. The plain form is useful for keeping a helper variable out of the enclosing scope while still producing a value.",
        },
        {
          id: "kt-scope-functions-q9",
          prompt: "You are creating an `Intent`, setting four properties on it and passing it to `startActivity`. Which scope function fits?",
          options: [
            "`apply`, because you configure the object and need the object back",
            "`let`, because you need the result of the last statement",
            "`also`, because configuration is a side effect",
            "`with`, because it reads more like a block",
          ],
          correctIndex: 0,
          explanation:
            "`apply` is the builder idiom: receiver as `this` so property assignments read unqualified, and the object returned so it can flow straight into the next call. `also` would also return the object but forces `it.` on every line.",
        },
        {
          id: "kt-scope-functions-q10",
          prompt:
            "What does `hasItems` evaluate to?\n\n```kotlin\nval list: List<Int>? = null\nval hasItems = list?.let { it.isNotEmpty() } ?: false\nprintln(hasItems)\n```",
          options: ["`false`", "`true`", "`null`", "It throws a `NullPointerException`"],
          correctIndex: 0,
          explanation:
            "`?.let` yields `null` for a null receiver, so Elvis supplies `false`. Note how easy the opposite mistake is: `list?.let { false } ?: true` returns `true` for a null list *and* `false` otherwise, which is rarely what the author meant.",
        },
      ],
    },

    {
      id: "kt-sealed-when",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Sealed Classes and when Exhaustiveness",
      summary:
        "A `sealed` class or interface declares a closed set of direct subtypes, all of which must live in the same package and the same compilation module. That closedness is the point: because the compiler can see the whole set, it can check a `when` for exhaustiveness. Add a new subtype and every `when` over the hierarchy that has no `else` stops compiling, handing you a list of the places that need a decision. It is a discriminated union with the compiler acting as the reviewer — TypeScript's tagged unions with a `never` check, but without the ceremony.\n\nThe rules: a `when` used as an **expression** must be exhaustive. Since Kotlin 1.7 a non-exhaustive `when` **statement** over a sealed, enum or Boolean subject is also a compile error (Kotlin 1.6 only warned). Inside an `is` branch the subject is smart-cast, so `is Success -> state.data` needs no cast. `data object` (stable since Kotlin 1.9) is the current idiom for the no-payload members of a hierarchy, because a plain `object` inherits `Any.toString()` and shows up in logs as `Loading@3f2a1c`.\n\nAnd the gotcha that undoes all of it: adding `else ->` makes the `when` permanently exhaustive, so the next subtype you introduce compiles silently and falls into the default. On a sealed subject, `else` is a decision to give up the checking you sealed the hierarchy for — worth it occasionally, never worth it by reflex. On Android you meet this shape constantly: `sealed interface UiState { data object Loading; data class Success(val items: List<Item>); data class Error(val message: String) }` rendered by one exhaustive `when` in a composable.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Kotlin docs: Sealed classes and interfaces", url: "https://kotlinlang.org/docs/sealed-classes.html", kind: "docs" },
        { label: "Kotlin docs: Conditions and loops (when)", url: "https://kotlinlang.org/docs/control-flow.html", kind: "docs" },
        { label: "Android Developers: State production in the UI layer", url: "https://developer.android.com/topic/architecture/ui-layer/state-production", kind: "docs" },
      ],
      video: {
        title: "Full 2025 Kotlin Crash Course For Beginners",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=dzUc9vrsldM",
        videoId: "dzUc9vrsldM",
        startSeconds: 9324,
        chapterLabel: "Sealed interface & sealed class",
        durationLabel: "3:11:50",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-sealed-when-q1",
          prompt:
            "What happens here?\n\n```kotlin\nsealed interface Result\ndata class Ok(val value: Int) : Result\ndata object Loading : Result\n\nfun label(r: Result): String = when (r) {\n    is Ok -> \"ok\"\n}\n```",
          options: [
            "A compile error: the `when` expression is not exhaustive",
            "It compiles and returns `null` for `Loading`",
            "It compiles and throws `NoWhenBranchMatchedException` for `Loading`",
            "It compiles with a warning",
          ],
          correctIndex: 0,
          explanation:
            "A `when` used as an expression must cover every case. Adding `Loading -> \"loading\"` fixes it and keeps the check; adding `else ->` fixes it and throws the check away.",
        },
        {
          id: "kt-sealed-when-q2",
          prompt:
            "A `when (state)` over a sealed `UiState` already has `else -> Unit`. A teammate adds a new `data class Retrying : UiState`. What happens?",
          options: [
            "Everything compiles, and `Retrying` silently falls into the `else` branch",
            "The `when` stops compiling until a `Retrying` branch is added",
            "The compiler emits a warning about an uncovered subtype",
            "It throws `NoWhenBranchMatchedException` at runtime",
          ],
          correctIndex: 0,
          explanation:
            "`else` makes any `when` exhaustive by definition, so the compiler has nothing left to tell you. That is the trade: on a sealed subject, `else` converts a compile-time error into a silent behaviour change.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-sealed-when-q3",
          prompt:
            "Does this compile, and why?\n\n```kotlin\nsealed interface Shape\ndata class Circle(val r: Double) : Shape\ndata class Rect(val w: Double, val h: Double) : Shape\n\nfun area(s: Shape): Double = when (s) {\n    is Circle -> 3.14 * s.r * s.r\n    is Rect -> s.w * s.h\n}\n```",
          options: [
            "Yes — the subject is smart-cast inside each `is` branch, and the two branches are exhaustive",
            "No — `s` must be cast explicitly with `as Circle` / `as Rect`",
            "No — an `else` branch is always required in a `when` expression",
            "Yes, but only because `Shape` is an interface rather than a class",
          ],
          correctIndex: 0,
          explanation:
            "Smart casts apply to an immutable subject inside a type-checked branch, so `s.r` resolves on `Circle`. A sealed class would behave identically.",
        },
        {
          id: "kt-sealed-when-q4",
          prompt: "Which of these are true of sealed classes in current Kotlin? (Select all that apply.)",
          options: [
            "Direct subclasses must be declared in the same package and the same compilation module",
            "A sealed class is implicitly abstract and cannot be instantiated directly",
            "A sealed class's constructors are `protected` by default",
            "All subclasses must be declared in the same *file* as the sealed class",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The same-file restriction was relaxed in Kotlin 1.5; same package and module is the current rule, and it is what lets the compiler see the whole hierarchy. Older tutorials still show every subclass nested inside the sealed class body.",
        },
        {
          id: "kt-sealed-when-q5",
          prompt: "When is an `enum class` the better choice than a sealed hierarchy?",
          options: [
            "When you need a fixed set of *instances* that all have the same shape — constants with no per-case payload",
            "Whenever the set has fewer than five members",
            "When you need exhaustiveness checking, which enums support and sealed classes do not",
            "When the cases need to carry different data from each other",
          ],
          correctIndex: 0,
          explanation:
            "Both give exhaustiveness. Enums are singletons with a uniform shape; sealed hierarchies are a fixed set of *types*, so each case can carry its own data — `Success(items)` next to `Error(message)`.",
        },
        {
          id: "kt-sealed-when-q6",
          prompt:
            "What does this print?\n\n```kotlin\nsealed interface State\nobject Loading : State\ndata object Ready : State\n\nprintln(\"$Loading $Ready\")\n```",
          options: [
            "Something like `Loading@3f2a1c Ready`",
            "`Loading Ready`",
            "`Loading@3f2a1c Ready@7b1d2e`",
            "It does not compile: `data object` is not valid Kotlin",
          ],
          correctIndex: 0,
          explanation:
            "`data object` (stable since Kotlin 1.9) generates a readable `toString()` and a consistent `equals`/`hashCode`, matching the `data class` siblings in the same hierarchy. A plain `object` falls back to `Any.toString()`, which is how identity hashes end up in your crash logs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-sealed-when-q7",
          prompt:
            "This `when` is a statement, not an expression — its value is unused. Does it compile on current Kotlin?\n\n```kotlin\nsealed interface Event\ndata object Click : Event\ndata object Swipe : Event\n\nfun handle(e: Event) {\n    when (e) {\n        Click -> log(\"click\")\n    }\n}\n```",
          options: [
            "No — since Kotlin 1.7 a non-exhaustive `when` statement on a sealed, enum or Boolean subject is a compile error",
            "Yes, with no diagnostic — statements never need to be exhaustive",
            "Yes, with a warning only",
            "Yes, but it throws `NoWhenBranchMatchedException` for `Swipe`",
          ],
          correctIndex: 0,
          explanation:
            "Kotlin 1.6 warned about this and 1.7 made it an error, closing the gap between statements and expressions. A `when` over a `String` or `Int` subject still does not need to be exhaustive as a statement.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-sealed-when-q8",
          prompt:
            "What happens here?\n\n```kotlin\nval size = 0\nval label = when {\n    size > 10 -> \"big\"\n    size > 0 -> \"small\"\n}\n```",
          options: [
            "A compile error: a subjectless `when` used as an expression must have an `else`",
            "`label` is `null`",
            "`label` is the empty string",
            "It compiles and throws at runtime",
          ],
          correctIndex: 0,
          explanation:
            "With no subject there is no closed set for the compiler to reason about, so `else` is mandatory for an expression. Exhaustiveness without `else` is only possible over a sealed, enum or Boolean subject.",
        },
        {
          id: "kt-sealed-when-q9",
          prompt:
            "What does this print?\n\n```kotlin\nval x = 7\nval s = when (x) {\n    1, 2, 3 -> \"low\"\n    in 4..10 -> \"mid\"\n    else -> \"high\"\n}\nprintln(s)\n```",
          options: ["`mid`", "`low`", "`high`", "It does not compile: `in` is not allowed in a `when` branch"],
          correctIndex: 0,
          explanation:
            "Branches can list several conditions with commas, test ranges and collections with `in`/`!in`, and test types with `is`/`!is`. Branches are evaluated top to bottom, so the first match wins.",
        },
        {
          id: "kt-sealed-when-q10",
          prompt: "Why must a sealed hierarchy's direct subtypes live in the same compilation module?",
          options: [
            "So the compiler can see the complete set when it checks exhaustiveness; a subtype added from another module later would invalidate every existing `when`",
            "Because cross-module inheritance is forbidden on the JVM",
            "Because sealed classes are compiled into a single class file together with their subtypes",
            "Because the runtime uses a module-local registry to dispatch `when` branches",
          ],
          correctIndex: 0,
          explanation:
            "The guarantee is compile-time and only holds if nobody can extend the hierarchy after your `when` was compiled. It is the same reason TypeScript's exhaustive union checks depend on the union being closed at the point of use.",
        },
      ],
    },

    {
      id: "kt-coroutines",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Coroutines: suspend, Scopes and Structured Concurrency",
      summary:
        "A `suspend` function can pause without blocking its thread. The compiler rewrites it into a state machine that takes a hidden `Continuation` parameter, so suspending is a return-and-resume, not a parked thread — which is why an app can have tens of thousands of in-flight coroutines over a handful of threads. `suspend` is viral the way `async` is in JavaScript: you can only call one from another suspending context, and the compiler enforces it.\n\nThe part that has no JavaScript equivalent is **structured concurrency**. Every coroutine has a parent `Job`. A scope does not complete until its children do; cancelling it cancels the whole subtree; and an unhandled failure in a child cancels its siblings and propagates upward — unless the parent is a `SupervisorJob`, which isolates failures without giving up the lifetime relationship. A JavaScript `Promise` has no parent and no cancellation, so \"fire a request and forget about it\" is a leak there and a compile-visible mistake here. On Android the scopes are handed to you: `viewModelScope` is cancelled in `onCleared()`, `lifecycleScope` follows the lifecycle owner, and `GlobalScope` is `@DelicateCoroutinesApi` precisely because it belongs to nothing.\n\nThree things separate people who have used coroutines from people who have debugged them. Cancellation is **cooperative**: a tight CPU loop with no suspension point ignores `cancel()` until it reaches one or checks `isActive`/`ensureActive()`/`yield()`. `CancellationException` is not a failure — it is how cancellation travels — so a blanket `catch (e: Exception)` swallows it and keeps a dead coroutine running. And dispatchers are about *blocking*, not *slowness*: `Dispatchers.Default` is sized to the CPU core count, `Dispatchers.IO` defaults to 64 threads or the core count, whichever is larger, and the two share a pool, so `withContext(Dispatchers.IO)` around a JSON parse buys nothing and starves the pool you actually wanted.",
      level: "advanced",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Kotlin docs: Coroutines basics", url: "https://kotlinlang.org/docs/coroutines-basics.html", kind: "docs" },
        { label: "Kotlin docs: Coroutine context and dispatchers", url: "https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html", kind: "docs" },
        { label: "Android Developers: Kotlin coroutines on Android", url: "https://developer.android.com/kotlin/coroutines", kind: "docs" },
        { label: "Roman Elizarov: Structured concurrency", url: "https://elizarov.medium.com/structured-concurrency-722d765aa952", kind: "article" },
      ],
      video: {
        title: "Threads vs. Kotlin Coroutines vs. Dispatchers - The Last Video You'll Need",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=0Hv5LTxAutw",
        videoId: "0Hv5LTxAutw",
        durationLabel: "27:13",
      },
      alternateVideos: [
        {
          title: "What Really Is Structured Concurrency In Kotlin? - Android Coding Interview Q&A",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=Of6cqKjEBGw",
          videoId: "Of6cqKjEBGw",
          durationLabel: "11:07",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-coroutines-q1",
          prompt:
            "What is printed, in order?\n\n```kotlin\nfun main() = runBlocking {\n    launch { println(\"A\") }\n    println(\"B\")\n    delay(100)\n    println(\"C\")\n}\n```",
          options: ["`B A C`", "`A B C`", "`B C A`", "`A C B`"],
          correctIndex: 0,
          explanation:
            "`launch` schedules the new coroutine on `runBlocking`'s single-threaded event loop but does not run it inline, so the current coroutine keeps going until it suspends at `delay` — at which point the queued body runs. Starting it with `CoroutineStart.UNDISPATCHED` would print `A B C`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-coroutines-q2",
          prompt:
            "Roughly how long does this take, and what does it print?\n\n```kotlin\nrunBlocking {\n    val a = async { delay(500); 1 }\n    val b = async { delay(500); 2 }\n    println(a.await() + b.await())\n}\n```",
          options: [
            "About 500 ms, printing `3`",
            "About 1000 ms, printing `3`",
            "About 500 ms, printing `1` then `2`",
            "It deadlocks: `runBlocking` has a single thread",
          ],
          correctIndex: 0,
          explanation:
            "Both `async` blocks start immediately and suspend concurrently; the first `await` then waits for work already in flight. Replacing `async`/`await` with two sequential `withContext` calls is what would take 1000 ms.",
        },
        {
          id: "kt-coroutines-q3",
          prompt:
            "What happens?\n\n```kotlin\nval job = launch(Dispatchers.Default) {\n    var i = 0L\n    while (i < 5_000_000_000) { i++ }   // no suspension point\n    println(\"done\")\n}\ndelay(10)\njob.cancel()\n```",
          options: [
            "The loop runs to completion and prints `done` — cancellation is cooperative",
            "The loop is interrupted immediately and `done` is never printed",
            "`cancel()` throws because the coroutine is not suspended",
            "The coroutine is cancelled at the next garbage collection",
          ],
          correctIndex: 0,
          explanation:
            "`cancel()` sets the job's state; the coroutine only notices at a suspension point or an explicit check. Adding `ensureActive()` (or `yield()`) inside the loop, or using `isActive` as the loop condition, makes it responsive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-coroutines-q4",
          prompt:
            "The enclosing scope is cancelled while this coroutine is in `delay`. What is printed?\n\n```kotlin\nlaunch {\n    try {\n        delay(1000)\n    } catch (e: Exception) {\n        println(\"caught\")\n    }\n    println(\"still here\")\n}\n```",
          options: [
            "`caught` then `still here` — the blanket catch swallowed the cancellation",
            "Nothing: cancellation bypasses `try`/`catch`",
            "`caught` only — the coroutine stops after the catch block",
            "`still here` only",
          ],
          correctIndex: 0,
          explanation:
            "Cancellation is delivered as a `CancellationException`, which `catch (e: Exception)` happily catches, so the coroutine carries on running work nobody wants. Catch `CancellationException` and rethrow it, or catch narrower exception types.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-coroutines-q5",
          prompt: "Which of these are true of structured concurrency? (Select all that apply.)",
          options: [
            "`coroutineScope { … }` does not return until every coroutine launched inside it has completed",
            "Cancelling a parent `Job` cancels all of its children",
            "In a plain `coroutineScope`, an unhandled failure in one child cancels its siblings",
            "`GlobalScope.launch` inside a `viewModelScope` block becomes a child of that scope",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are the whole contract. `GlobalScope` deliberately has no parent, which is why a coroutine started there outlives the ViewModel that started it — the classic Android leak.",
        },
        {
          id: "kt-coroutines-q6",
          prompt: "You need a value back from a background computation. Which builder, and what does it return?",
          options: [
            "`async`, which returns a `Deferred<T>` you `await()`",
            "`launch`, which returns a `Job` you `join()` and then read",
            "`runBlocking`, which returns the block's value directly",
            "`withTimeout`, which returns the value or `null`",
          ],
          correctIndex: 0,
          explanation:
            "`launch` is fire-and-forget and returns a `Job` with no value. `runBlocking` does return the value, but by blocking the calling thread — fine in `main()` or a test, wrong in app code.",
        },
        {
          id: "kt-coroutines-q7",
          prompt:
            "What is true of `withContext`?\n\n```kotlin\nsuspend fun load(): String = withContext(Dispatchers.IO) {\n    readFileBlocking()\n}\n```",
          options: [
            "It suspends until the block finishes and returns its value, resuming the caller on the caller's original dispatcher",
            "It starts a new coroutine and returns immediately with a `Deferred`",
            "It blocks the calling thread until the block finishes",
            "It permanently moves the calling coroutine onto `Dispatchers.IO`",
          ],
          correctIndex: 0,
          explanation:
            "`withContext` is the main-safety tool: shift dispatcher, do the blocking work, come back. It does not create a concurrent branch — two sequential `withContext` calls run one after the other.",
        },
        {
          id: "kt-coroutines-q8",
          prompt: "Parsing a 5 MB JSON string on Android takes 300 ms of pure CPU. Which dispatcher is correct, and why?",
          options: [
            "`Dispatchers.Default`, which is sized to the CPU core count and is meant for CPU-bound work",
            "`Dispatchers.IO`, because any work longer than a frame belongs on IO",
            "`Dispatchers.Main`, because the result updates the UI",
            "`Dispatchers.Unconfined`, which avoids a dispatch entirely",
          ],
          correctIndex: 0,
          explanation:
            "`IO` exists for work that *blocks a thread* — file and network calls — and defaults to 64 threads or the core count, whichever is larger. Running CPU work there oversubscribes the shared pool without making the parse any faster.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-coroutines-q9",
          prompt: "Why is `runBlocking` the wrong tool inside an Android app's UI code?",
          options: [
            "It blocks the calling thread until the coroutine finishes, which on the main thread means dropped frames or an ANR",
            "It cannot call suspend functions",
            "It creates a coroutine with no parent, so it leaks",
            "It is deprecated in current kotlinx.coroutines",
          ],
          correctIndex: 0,
          explanation:
            "`runBlocking` is a bridge from blocking code into suspending code: `main()` functions, tests, and command-line tools. Inside an app you already have a scope, so there is nothing to bridge.",
        },
        {
          id: "kt-coroutines-q10",
          prompt:
            "Inside a plain `coroutineScope`, `val d = async { error(\"boom\") }` is created and the code catches the exception at `d.await()`. Which is true?",
          options: [
            "The exception is exposed through `await()` **and** propagated to the parent, so the scope still fails despite the catch",
            "The exception is only ever thrown at `await()` and never reaches the parent",
            "`async` swallows exceptions entirely; `await()` returns `null`",
            "`async` rethrows immediately at the `async` call site, before `await()`",
          ],
          correctIndex: 0,
          explanation:
            "`async` exposes the failure to whoever awaits it, but a non-root `async` is still a child, and a failing child cancels its parent. Only when `async` is a *root* coroutine — directly on a scope with a `SupervisorJob`, or inside `supervisorScope` — is the exception purely the awaiter's problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-coroutines-q11",
          prompt: "What cancels `viewModelScope`, and why does that matter?",
          options: [
            "`ViewModel.onCleared()` — so work started in the ViewModel cannot outlive the screen it belongs to",
            "The first configuration change, so work restarts on rotation",
            "`Activity.onPause()`, so background work stops when the app is not visible",
            "Nothing — `viewModelScope` lives for the process lifetime",
          ],
          correctIndex: 0,
          explanation:
            "That is the point of tying a scope to a lifecycle owner: the ViewModel survives rotation (so the work is not restarted) but not the screen being finished (so the work is not leaked). `lifecycleScope` has the tighter lifetime of the Activity or Fragment view.",
        },
      ],
    },

    {
      id: "kt-flow",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Flow, StateFlow and SharedFlow",
      summary:
        "A `Flow` is the stream counterpart of `suspend`. The `flow { }` builder is **cold**: nothing runs until a terminal operator such as `collect` is called, and every collector gets its own independent execution of the block. That is the opposite of a JavaScript `Promise` (eager, single-shot, shared) and closer to a lazy `Observable` — except that because `collect` is a suspending call, backpressure is free. A slow collector simply suspends the emitter; there is no buffer to configure and no `onBackpressureDrop` to choose.\n\n`StateFlow` and `SharedFlow` are **hot**: they exist and emit whether or not anyone is collecting. `StateFlow` always has a current `.value`, conflates, applies `distinctUntilChanged` by `equals`, never completes, and replays its current value to every new collector — which is exactly the shape of UI state and the direct replacement for `LiveData`. `SharedFlow` is the general case: you choose `replay`, `extraBufferCapacity` and `onBufferOverflow`, and the default `replay = 0` means an emission with no subscribers is simply dropped.\n\nThe traps are all about conflation and context. `StateFlow` drops values, so two consecutive equal states are one emission and a slow collector can miss intermediate ones entirely — which makes it the wrong type for one-shot events like \"navigate\" or \"show this error once\"; use a `SharedFlow` or a `Channel`. `flowOn` changes the **upstream** context only, and emitting from a different coroutine inside `flow { }` throws \"Flow invariant is violated\" (use `channelFlow` for that). Finally, `stateIn`/`shareIn` with `SharingStarted.WhileSubscribed(5_000)` is the idiom that keeps an upstream alive across a configuration change without keeping it alive for the process lifetime — and in Compose you collect with `collectAsStateWithLifecycle()`, not `collectAsState()`, so collection stops when the screen is not started.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Kotlin docs: Asynchronous Flow", url: "https://kotlinlang.org/docs/flow.html", kind: "docs" },
        { label: "Android Developers: StateFlow and SharedFlow", url: "https://developer.android.com/kotlin/flow/stateflow-and-sharedflow", kind: "docs" },
        { label: "Roman Elizarov: Shared flows, broadcast channels", url: "https://elizarov.medium.com/shared-flows-broadcast-channels-899b675e805c", kind: "article" },
        { label: "Android Interview Questions (Amit Shekhar)", url: "https://github.com/amitshekhariitbhu/android-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Hot Flows vs. Cold Flows In Kotlin - When to Use What?",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=M8YtV47kaqA",
        videoId: "M8YtV47kaqA",
        durationLabel: "14:35",
      },
      alternateVideos: [
        {
          title: "StateFlow vs. Flow vs. SharedFlow vs. LiveData... When to Use What?! - Android Studio Tutorial",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=6Jc6-INantQ",
          videoId: "6Jc6-INantQ",
          durationLabel: "18:08",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-flow-q1",
          prompt:
            "What is printed?\n\n```kotlin\nval f = flow {\n    println(\"start\")\n    emit(1)\n}\n\nrunBlocking {\n    f.collect { }\n    f.collect { }\n}\n```",
          options: [
            "`start` twice — a cold flow re-executes its builder for every collector",
            "`start` once — the builder runs when the flow is created",
            "`start` once — the result is cached after the first collection",
            "Nothing, because the collector lambda is empty",
          ],
          correctIndex: 0,
          explanation:
            "Cold means the builder is the recipe, not the result. Two collectors means two independent executions — which is why collecting the same network-backed flow in two composables issues two requests unless you `shareIn` it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-flow-q2",
          prompt:
            "What is printed?\n\n```kotlin\nval f = flow { println(\"hello\"); emit(1) }\nval mapped = f.map { it * 2 }\nprintln(\"built\")\n```",
          options: [
            "`built` only — neither the builder nor `map` runs without a terminal operator",
            "`hello` then `built`",
            "`built` then `hello`",
            "`hello` only",
          ],
          correctIndex: 0,
          explanation:
            "Intermediate operators like `map` are cold too: they wrap the upstream and return a new flow. Only a terminal operator (`collect`, `first`, `toList`, `stateIn`) starts anything.",
        },
        {
          id: "kt-flow-q3",
          prompt:
            "A collector is attached to `state` from the start. What values does it see?\n\n```kotlin\nval state = MutableStateFlow(0)\n// collector attached here\nstate.value = 1\nstate.value = 1\nstate.value = 2\n```",
          options: [
            "`0, 1, 2` — the repeated `1` is dropped by `distinctUntilChanged`",
            "`0, 1, 1, 2` — every assignment emits",
            "`1, 1, 2` — the initial value is not replayed",
            "`2` only — earlier values are conflated away",
          ],
          correctIndex: 0,
          explanation:
            "`StateFlow` replays its current value to a new collector and compares each new value with `equals` before emitting. That is ideal for state and wrong for events: two identical \"show error\" states are indistinguishable from one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-flow-q4",
          prompt:
            "What does this print?\n\n```kotlin\nval events = MutableSharedFlow<String>()   // replay = 0, no buffer\n\nrunBlocking {\n    events.emit(\"a\")                       // no subscribers yet\n    val job = launch { events.collect { println(it) } }\n    delay(50)\n    events.emit(\"b\")\n    delay(50)\n    job.cancel()\n}\n```",
          options: [
            "`b` only — with `replay = 0` and no subscribers, `\"a\"` is dropped",
            "`a` then `b`",
            "`a` only",
            "Nothing — `emit` suspends forever waiting for a subscriber",
          ],
          correctIndex: 0,
          explanation:
            "A `MutableSharedFlow` with no replay and no buffer delivers only to current subscribers; with none, `emit` returns immediately and the value is lost. Set `replay = 1` if a late subscriber must see the last value.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-flow-q5",
          prompt: "Which of these are true of `StateFlow`? (Select all that apply.)",
          options: [
            "It always has a current value, readable synchronously through `.value`",
            "It conflates, so a slow collector may never see some intermediate values",
            "It never completes",
            "A new collector receives nothing until the next update",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A new collector immediately receives the current value — that is the point of a state holder. The conflation and the never-completing behaviour are what make it a poor fit for one-shot events.",
        },
        {
          id: "kt-flow-q6",
          prompt: "What does `stateIn(scope, SharingStarted.WhileSubscribed(5_000), initial)` buy you?",
          options: [
            "The upstream keeps running for 5 seconds after the last collector disappears, so a rotation does not restart it, but an app going to background eventually stops it",
            "Each collector waits up to 5 seconds for the first value before the initial value is used",
            "Emissions are throttled to at most one every 5 seconds",
            "The flow caches the last 5 seconds of values for late collectors",
          ],
          correctIndex: 0,
          explanation:
            "`WhileSubscribed` ties the upstream to subscriber count; the timeout spans the gap where a configuration change tears down and rebuilds the UI. `SharingStarted.Eagerly` and `Lazily` never stop, which is how a database query ends up running with no screen on it.",
        },
        {
          id: "kt-flow-q7",
          prompt:
            "Where does each part of this run?\n\n```kotlin\nflow { emit(readFile()) }\n    .map { parse(it) }\n    .flowOn(Dispatchers.IO)\n    .collect { updateUi(it) }\n```",
          options: [
            "The builder and `map` run on `Dispatchers.IO`; `collect` runs in the collector's own context",
            "Everything, including `collect`, runs on `Dispatchers.IO`",
            "The builder runs on `Dispatchers.IO`; `map` and `collect` run in the collector's context",
            "`flowOn` has no effect unless it is the first operator in the chain",
          ],
          correctIndex: 0,
          explanation:
            "`flowOn` affects the **upstream** — everything declared before it — and never the collector. That asymmetry is deliberate: the consumer always stays in the context it chose, which is how main-safety is preserved.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-flow-q8",
          prompt:
            "What happens?\n\n```kotlin\nflow {\n    withContext(Dispatchers.IO) {\n        emit(loadFromDisk())\n    }\n}\n```",
          options: [
            "It throws `IllegalStateException` at runtime: \"Flow invariant is violated\"",
            "It compiles and runs correctly — this is the normal way to do IO in a flow",
            "It does not compile: `emit` cannot be called inside `withContext`",
            "It silently drops the emission",
          ],
          correctIndex: 0,
          explanation:
            "A `flow { }` builder must emit from the coroutine that collects it, so context-preservation can be guaranteed. Use `.flowOn(Dispatchers.IO)` on the chain, or `channelFlow` if emissions genuinely come from other coroutines.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-flow-q9",
          prompt: "A ViewModel must tell the UI to navigate to a detail screen exactly once. Which type fits?",
          options: [
            "A `SharedFlow` (or a `Channel`), because the event must be delivered once and must not be replayed on rotation",
            "A `StateFlow<Boolean>`, toggled to `true` and back to `false`",
            "A `StateFlow<String?>` holding the destination",
            "A cold `flow { }` collected in the composable",
          ],
          correctIndex: 0,
          explanation:
            "A `StateFlow` re-delivers its current value to every new collector, so rotating the device navigates again — the bug the \"single live event\" wrappers used to paper over. A `SharedFlow` with `replay = 0`, or a `Channel` consumed as a flow, delivers once.",
        },
        {
          id: "kt-flow-q10",
          prompt: "In Compose, why prefer `collectAsStateWithLifecycle()` over `collectAsState()`?",
          options: [
            "It stops collecting when the lifecycle drops below `STARTED`, so an off-screen UI is not kept subscribed to an upstream",
            "It is the only one that works with `StateFlow`",
            "It avoids recomposition when the value is unchanged; `collectAsState` recomposes on every emission",
            "It runs collection on `Dispatchers.IO` automatically",
          ],
          correctIndex: 0,
          explanation:
            "`collectAsState` keeps collecting as long as the composable is in the composition, which on Android includes a backgrounded screen. The lifecycle-aware version lives in `androidx.lifecycle:lifecycle-runtime-compose`.",
        },
        {
          id: "kt-flow-q11",
          prompt: "Why does a `Flow` not need the backpressure strategies that RxJava's `Observable`/`Flowable` split exists for?",
          options: [
            "`collect` is a suspending call, so a slow collector suspends the emitter — backpressure is built into the suspension mechanism",
            "Flows buffer every emission indefinitely, so nothing is ever dropped",
            "Flows are always collected on `Dispatchers.Default`, which cannot be overwhelmed",
            "Flows drop values automatically when the collector falls behind",
          ],
          correctIndex: 0,
          explanation:
            "Emission and collection happen in the same coroutine by default, so the emitter simply cannot outpace the collector. You opt *out* of that with `buffer()`, `conflate()` or `collectLatest` when you want speed over completeness.",
        },
      ],
    },

    {
      id: "kt-delegation",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Delegation and the by Keyword",
      summary:
        "`by` does two unrelated jobs that share a keyword. **Class delegation** — `class Logging(inner: Repo) : Repo by inner` — makes the compiler generate a forwarding implementation of every interface member, so the Decorator pattern costs one line instead of thirty. **Property delegation** — `val config by lazy { … }` — routes a property's `get` (and, for `var`, `set`) through an object that provides `getValue`/`setValue` operator functions. It is convention-based, not interface-based: anything with the right operator signatures works, including a `Map`, which is why `val name: String by json` is a legal way to read a parsed document.\n\nThat convention is the reason Compose reads the way it does. `var text by remember { mutableStateOf(\"\") }` looks like an ordinary variable only because `MutableState<T>` ships `getValue`/`setValue` extensions; without the two imports the same line does not compile, which is the most common \"why won't this build\" for people new to Compose. The same mechanism gives you `by viewModels()`, `by activityViewModels()`, `by savedStateHandle` and `Delegates.observable`/`vetoable`.\n\nThe gotcha in class delegation is worth knowing before you need it: the compiler forwards *your* calls to the delegate, but the delegate's own internal calls stay inside the delegate. If `Repo.refresh()` calls `Repo.load()` and your wrapper overrides `load()`, the delegate still calls its own `load()` — overrides are invisible to the object you delegated to, because there is no inheritance and no vtable involved. On the property side, `by lazy` defaults to `LazyThreadSafetyMode.SYNCHRONIZED` (thread-safe, initialised once) and only works for `val`; its mutable counterpart is `lateinit var`, which throws `UninitializedPropertyAccessException` rather than handing you a null.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "Kotlin docs: Delegated properties", url: "https://kotlinlang.org/docs/delegated-properties.html", kind: "docs" },
        { label: "Kotlin docs: Delegation", url: "https://kotlinlang.org/docs/delegation.html", kind: "docs" },
        { label: "Kotlin docs: Properties", url: "https://kotlinlang.org/docs/properties.html", kind: "docs" },
      ],
      video: {
        title: "Full Guide to Delegation in Kotlin  - Android Studio Tutorial",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=MfJB-JhRAoQ",
        videoId: "MfJB-JhRAoQ",
        durationLabel: "18:10",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-delegation-q1",
          prompt:
            "What does this print?\n\n```kotlin\ninterface Base {\n    fun a()\n    fun b()\n}\n\nclass Impl : Base {\n    override fun a() { println(\"Impl.a\"); b() }\n    override fun b() { println(\"Impl.b\") }\n}\n\nclass Wrapper(inner: Base) : Base by inner {\n    override fun b() { println(\"Wrapper.b\") }\n}\n\nWrapper(Impl()).a()\n```",
          options: [
            "`Impl.a` then `Impl.b`",
            "`Impl.a` then `Wrapper.b`",
            "`Wrapper.b` then `Impl.a`",
            "It does not compile: you cannot override a delegated member",
          ],
          correctIndex: 0,
          explanation:
            "`Wrapper.a()` forwards to `Impl.a()`, and from inside `Impl` the call to `b()` is a plain virtual call on `Impl` — it has no idea a wrapper exists. Delegation is composition, not inheritance, so overrides only affect calls that go *through* the wrapper.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-delegation-q2",
          prompt:
            "What does this print?\n\n```kotlin\nval config by lazy { println(\"computing\"); 42 }\n\nfun main() {\n    println(config)\n    println(config)\n}\n```",
          options: ["`computing`, `42`, `42`", "`computing`, `42`, `computing`, `42`", "`42`, `42`", "`computing`, `computing`, `42`, `42`"],
          correctIndex: 0,
          explanation:
            "The initialiser runs on the first read and the value is cached. That is the difference from a custom getter (`val config get() = …`), which recomputes on every access.",
        },
        {
          id: "kt-delegation-q3",
          prompt: "What is the default thread-safety mode of `by lazy`, and what does it guarantee?",
          options: [
            "`SYNCHRONIZED` — only one thread can run the initialiser, and every thread sees the same value",
            "`NONE` — no synchronisation, for the fastest possible access",
            "`PUBLICATION` — several threads may run the initialiser but only the first result is used",
            "There is no default; the mode must always be passed explicitly",
          ],
          correctIndex: 0,
          explanation:
            "The safe default costs a lock check on first access. `LazyThreadSafetyMode.NONE` is the right choice inside a single-threaded context such as a Compose composable or an Activity, and is measurably cheaper in hot paths.",
        },
        {
          id: "kt-delegation-q4",
          prompt: "Which of these are true of property delegation? (Select all that apply.)",
          options: [
            "The delegate must provide an `operator fun getValue(...)`",
            "A `var` delegate must also provide an `operator fun setValue(...)`",
            "`getValue` receives the containing object and a `KProperty` describing the property",
            "A delegate must implement the `ReadOnlyProperty` or `ReadWriteProperty` interface",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "It is a compiler convention, not a nominal type: the interfaces exist for convenience but nothing requires them. That is precisely why `MutableState` can be delegated to via extension functions declared elsewhere.",
        },
        {
          id: "kt-delegation-q5",
          prompt: "Which `lateinit` declaration compiles?",
          options: [
            "`lateinit var name: String`",
            "`lateinit val name: String`",
            "`lateinit var count: Int`",
            "`lateinit var name: String?`",
          ],
          correctIndex: 0,
          explanation:
            "`lateinit` is only legal on a non-null `var` of a non-primitive type. A `val` has no setter to initialise it later, and a primitive has no null sentinel for the compiler to detect \"not yet set\".",
        },
        {
          id: "kt-delegation-q6",
          prompt: "Why does `var text by remember { mutableStateOf(\"\") }` fail to compile until you add two imports?",
          options: [
            "`by` needs `getValue`/`setValue`, which for `MutableState` are extension functions in `androidx.compose.runtime` that must be imported",
            "`remember` is only in scope after importing the Compose runtime",
            "`by` on a local variable requires the `kotlin.properties` package",
            "`mutableStateOf` returns a nullable type until the delegate imports narrow it",
          ],
          correctIndex: 0,
          explanation:
            "`MutableState` does not declare the operators as members; they are extensions, and extensions must be imported to be resolvable. Without them you fall back to `state.value`, which works identically and is what the error is telling you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-delegation-q7",
          prompt:
            "What does this print?\n\n```kotlin\nvar name: String by Delegates.observable(\"<none>\") { _, old, new ->\n    println(\"$old -> $new\")\n}\n\nname = \"first\"\nname = \"second\"\n```",
          options: [
            "`<none> -> first` then `first -> second`",
            "`first -> second` only",
            "`<none> -> first` only",
            "Nothing — `observable` only fires on read",
          ],
          correctIndex: 0,
          explanation:
            "`observable` runs its handler *after* each assignment, receiving old and new values. `vetoable` runs *before* and can reject the assignment by returning `false`.",
        },
        {
          id: "kt-delegation-q8",
          prompt:
            "What does this print?\n\n```kotlin\nclass User(map: Map<String, Any?>) {\n    val name: String by map\n}\n\nprintln(User(mapOf(\"name\" to \"Ada\")).name)\n```",
          options: [
            "`Ada` — the standard library provides `getValue` for `Map`, keyed by the property name",
            "It does not compile: a `Map` is not a property delegate",
            "`null`",
            "It throws `NoSuchElementException` unless the key is `\"User.name\"`",
          ],
          correctIndex: 0,
          explanation:
            "This is the clearest demonstration that delegation is convention-based — `Map` gains delegate behaviour from a stdlib extension, keyed by `property.name`. A missing key throws at access time, which is the cost of the trick.",
        },
        {
          id: "kt-delegation-q9",
          prompt: "When would you choose `lateinit var` over `by lazy`?",
          options: [
            "When the value is supplied from outside — injected, or created in `onCreate` — rather than computable on first use",
            "When the value is expensive to compute and may never be needed",
            "When the property must be thread-safe",
            "When the property is a primitive such as `Int`",
          ],
          correctIndex: 0,
          explanation:
            "`by lazy` needs an initialiser it can run itself; `lateinit` is for values pushed in later by a framework. Neither works for primitives (`lateinit` is illegal on them, and `by lazy` on an `Int` boxes it).",
        },
        {
          id: "kt-delegation-q10",
          prompt: "What can class delegation (`class C(b: B) : B by b`) *not* do?",
          options: [
            "Delegate to an abstract class — `by` only works with interfaces",
            "Forward more than one interface at a time",
            "Allow the wrapper to override any of the delegated members",
            "Be used when the delegate is passed as a constructor parameter",
          ],
          correctIndex: 0,
          explanation:
            "The supertype after `by` must be an interface, because the compiler generates forwarding methods for its members. Several interfaces can each be delegated to different objects, and overriding individual members is not only allowed but the usual reason to use it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },

    {
      id: "kt-compose-declarative",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "The Declarative Model and Composable Functions",
      summary:
        "In the View system you build a tree once and then mutate it — `findViewById`, `setText`, `setVisibility`, `notifyItemChanged`. Every one of those mutations is a place where the UI can disagree with the data behind it, and most Android UI bugs live in that gap. Compose deletes the category: a `@Composable` function takes data and *emits* UI, and when the data changes Compose runs the function again. For anyone who came through React, this is the same trade that web made in 2014 — give up imperative control of the tree, get consistency for free.\n\nThe rules follow from that. A `@Composable` can only be called from another `@Composable`. It returns `Unit` and emits rather than returning a tree. And it must be **idempotent and free of side effects**, because the runtime may call it in any order, call several in parallel, skip it entirely, or run it on every frame of an animation. Anything with a consequence — a request, a log, a listener registration — goes through the effect APIs, never in the body.\n\nWhere the React analogy stops: React's render returns a description that the runtime diffs against the previous one. A composable returns nothing to diff. Instead Compose's Kotlin compiler plugin rewrites every composable to take a hidden `$composer` and a `$changed` bitmask, and to record its output into a **slot table** keyed by call site — \"positional memoization\". That is why `remember` can work at all without a dependency array, why a state change can invalidate one leaf without re-running its parent, and why composition, layout and drawing are three separable phases rather than one render pass. It is also why \"just add `useMemo` everywhere\" does not translate: the compiler already knows things React's runtime cannot.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Android Developers: Thinking in Compose", url: "https://developer.android.com/develop/ui/compose/mental-model", kind: "docs" },
        { label: "Android Developers: Jetpack Compose phases", url: "https://developer.android.com/develop/ui/compose/phases", kind: "docs" },
        { label: "Leland Richardson: Compose From First Principles", url: "https://intelligiblebabble.com/compose-from-first-principles/", kind: "article" },
        { label: "androidx: Compose API guidelines", url: "https://github.com/androidx/androidx/blob/androidx-main/compose/docs/compose-api-guidelines.md", kind: "repo" },
      ],
      video: {
        title: "Intuitive: Thinking in Compose - MAD Skills",
        channel: "Android Developers",
        url: "https://www.youtube.com/watch?v=4zf30a34OOA",
        videoId: "4zf30a34OOA",
        durationLabel: "7:09",
      },
      alternateVideos: [
        {
          title: "From data to UI: Compose phases - MAD Skills",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=0yK7KoruhSM",
          videoId: "0yK7KoruhSM",
          durationLabel: "6:56",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-compose-declarative-q1",
          prompt: "Why does a UI-emitting `@Composable` function return `Unit` rather than some kind of UI object?",
          options: [
            "It emits into the composition through a hidden `Composer` parameter; there is no element tree to hand back",
            "Returning a value from a composable is possible but discouraged by convention",
            "Kotlin does not allow annotated functions to declare return types",
            "The return value would be a `View`, and Compose avoids the View system entirely",
          ],
          correctIndex: 0,
          explanation:
            "This is the concrete difference from React, whose components return elements the runtime then diffs. Composables that *compute* rather than emit — like `rememberScrollState()` — do return values, which is why the API guidelines name them differently.",
        },
        {
          id: "kt-compose-declarative-q2",
          prompt:
            "What happens here?\n\n```kotlin\nButton(onClick = { Text(\"clicked\") }) {\n    Text(\"Click me\")\n}\n```",
          options: [
            "A compile error: `Text` is `@Composable` and `onClick` is an ordinary lambda",
            "It compiles, and a second label appears when the button is clicked",
            "It compiles, but the emitted `Text` is discarded at runtime",
            "It compiles only if the enclosing function is also `@Composable`",
          ],
          correctIndex: 0,
          explanation:
            "`@Composable` is a calling convention enforced by the compiler: composables may only be called from composable contexts, and a click handler is not one. Emitting UI in response to an event means changing state that a composable reads.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-declarative-q3",
          prompt: "Which of these does the Compose runtime explicitly reserve the right to do? (Select all that apply.)",
          options: [
            "Execute composables in any order",
            "Execute composables in parallel",
            "Skip a composable entirely when its inputs have not changed",
            "Guarantee exactly one execution per state change, in declaration order",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "All three are documented in \"Thinking in Compose\", and together they are why composables must be side-effect free. Assuming ordered, once-per-change execution is what produces duplicated analytics events and double-fired network calls.",
        },
        {
          id: "kt-compose-declarative-q4",
          prompt:
            "What is wrong with this?\n\n```kotlin\n@Composable\nfun ItemList(items: List<String>, onSeen: (Int) -> Unit) {\n    onSeen(items.size)\n    Text(\"${items.size} items\")\n}\n```",
          options: [
            "`onSeen` runs on every composition and recomposition, an unknown number of times — it belongs in a `LaunchedEffect`",
            "Nothing; a callback in the body is the normal way to report state",
            "`onSeen` will never run, because composable bodies are lazy",
            "It does not compile: a non-composable lambda cannot be invoked from a composable body",
          ],
          correctIndex: 0,
          explanation:
            "Composition is not an event. This is the Compose version of calling `fetch()` directly in a React render, and it misfires in the same ways — except Compose may also run the body in parallel or throw the result away.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-declarative-q5",
          prompt: "Compose runs three phases per frame. Which order, and which one decides *what* to show?",
          options: [
            "Composition, then layout, then drawing — composition decides what to show",
            "Layout, then composition, then drawing — composition decides what to show",
            "Composition, then drawing, then layout — drawing decides what to show",
            "Measurement, then composition, then rendering — measurement decides what to show",
          ],
          correctIndex: 0,
          explanation:
            "Composition builds or updates the tree of what to show, layout measures and places it, drawing renders it. Keeping them separate is what lets a state read that only affects position re-run layout without re-running composition.",
        },
        {
          id: "kt-compose-declarative-q6",
          prompt: "What does the Compose compiler plugin add to a function you annotate `@Composable`?",
          options: [
            "A hidden `Composer` parameter and change-tracking bits, plus positional keys so its output can be stored in and patched within the slot table",
            "A wrapper that memoizes the return value keyed on the arguments",
            "A subclass of `View` generated from the function body",
            "A coroutine state machine, the same transform `suspend` functions get",
          ],
          correctIndex: 0,
          explanation:
            "Same idea as the `suspend` transform — a compiler-inserted extra parameter — but for a different purpose. The slot table plus call-site keys is what makes `remember` positional and lets the runtime update one leaf without touching its parent.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-declarative-q7",
          prompt: "A single `mutableStateOf` changes. How does Compose know what to re-run?",
          options: [
            "Reads are tracked per recompose scope, so only the scopes that actually read that state are invalidated",
            "The whole composition is re-executed from the root, and the diff decides what changed",
            "The nearest parent composable and its entire subtree are re-executed",
            "Every composable that takes the same parameter type is re-executed",
          ],
          correctIndex: 0,
          explanation:
            "This is the sharpest contrast with React, where a `setState` re-renders the component and (absent `memo`) its children. Compose's snapshot system records which scopes read which state objects, so a deeply nested `Text` can update alone.",
        },
        {
          id: "kt-compose-declarative-q8",
          prompt: "Can you call a `suspend` function directly in a composable body?",
          options: [
            "No — a composable body is not a coroutine; use `LaunchedEffect` or `rememberCoroutineScope`",
            "Yes, composables are implicitly `suspend`",
            "Yes, but only if the composable is annotated `@Composable suspend`",
            "Yes, and Compose will cancel it automatically when the composable leaves",
          ],
          correctIndex: 0,
          explanation:
            "`@Composable` and `suspend` are two different compiler transforms and do not combine. `LaunchedEffect` is the bridge, and it happens to give you the cancellation semantics people assume are automatic.",
        },
        {
          id: "kt-compose-declarative-q9",
          prompt: "What is the Compose equivalent of `findViewById<TextView>(R.id.title).text = name`?",
          options: [
            "Pass `name` to a `Text` composable — there is no handle to mutate, only state to change",
            "`rememberTextView(R.id.title).text = name`",
            "`LocalView.current.findViewById<TextView>(R.id.title).text = name`",
            "`Modifier.text(name)` applied to the title",
          ],
          correctIndex: 0,
          explanation:
            "There are no ids and no references to UI nodes. If two places need to change the same label, they change the same state; the framework works out the rest.",
        },
        {
          id: "kt-compose-declarative-q10",
          prompt: "Which statement about Compose versus React is accurate?",
          options: [
            "React returns a description that its runtime diffs; a composable returns nothing and instead records into a slot table the runtime patches in place",
            "Both maintain a virtual DOM and reconcile it against the previous tree",
            "Compose diffs its output tree, but at the layout level rather than the element level",
            "Neither re-runs user code after the first render; both update the tree imperatively",
          ],
          correctIndex: 0,
          explanation:
            "The declarative programming model is shared; the implementation is not. \"Compose has a virtual DOM\" is the most common wrong mental model an ex-React engineer brings, and it makes the stability and skipping rules impossible to predict.",
        },
      ],
    },

    {
      id: "kt-compose-state",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "State: remember, mutableStateOf and Hoisting",
      summary:
        "`mutableStateOf` creates an observable holder. Reading `.value` inside a composable subscribes that recompose scope to it; writing schedules recomposition of exactly the scopes that read it. `remember` is the other half: it stores a value in the slot table at this call position so it survives recomposition. `remember { mutableStateOf(0) }` is the pair you almost always want — `mutableStateOf(0)` on its own is recreated on every recomposition and therefore never appears to change.\n\nThe React mapping is close enough to be useful: `remember` is `useMemo`, `remember { mutableStateOf(x) }` is `useState`, state hoisting is lifting state up, and the stateless-child contract (`value: T`, `onValueChange: (T) -> Unit`) is a controlled component. Two differences matter. First, Compose tracks reads automatically, so there is no dependency array to get wrong — but equally no way to read without subscribing unless you go via `derivedStateOf` or `snapshotFlow`. Second, `remember` survives only recomposition. A configuration change or process death wipes it; `rememberSaveable` persists through the saved-instance-state `Bundle`, which is why its value must be `Parcelable`, a primitive, or accompanied by a custom `Saver`. Anything that should outlive the screen belongs in a `ViewModel`.\n\nThe first trap everybody hits: `remember { mutableListOf<String>() }` compiles and does nothing. A plain `MutableList` is not observable, so mutating it never triggers recomposition. Use `mutableStateListOf`, or hold an immutable `List` inside a `MutableState` and replace it wholesale. The second: reading a fast-changing state directly in composition — a scroll offset, a text length — recomposes on every frame; wrap the derived condition in `derivedStateOf` so recomposition happens only when the *result* changes.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Android Developers: State and Jetpack Compose", url: "https://developer.android.com/develop/ui/compose/state", kind: "docs" },
        { label: "Android Developers: Where to hoist state", url: "https://developer.android.com/develop/ui/compose/state-hoisting", kind: "docs" },
        { label: "Android Developers: State production in the UI layer", url: "https://developer.android.com/topic/architecture/ui-layer/state-production", kind: "docs" },
      ],
      video: {
        title: "State in Jetpack Compose",
        channel: "Android Developers",
        url: "https://www.youtube.com/watch?v=PMMY23F0CFg",
        videoId: "PMMY23F0CFg",
        startSeconds: 117,
        chapterLabel: "State",
        durationLabel: "43:45",
      },
      alternateVideos: [
        {
          title: "State in Jetpack Compose",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=PMMY23F0CFg",
          videoId: "PMMY23F0CFg",
          startSeconds: 998,
          chapterLabel: "State Hoisting",
          durationLabel: "43:45",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-compose-state-q1",
          prompt:
            "What does this button display after three clicks?\n\n```kotlin\n@Composable\nfun Counter() {\n    val count = mutableStateOf(0)      // no remember\n    Button(onClick = { count.value++ }) {\n        Text(\"${count.value}\")\n    }\n}\n```",
          options: [
            "`0` — each recomposition creates a brand-new state object starting at 0",
            "`3` — the state object is stable across recompositions",
            "`1` — only the first click registers",
            "It crashes with an `IllegalStateException`",
          ],
          correctIndex: 0,
          explanation:
            "Without `remember`, the composable's body allocates a fresh `MutableState` every time it runs, so the increment is written to an object that is immediately discarded. This is the Compose analogue of calling `useState` and ignoring the returned setter.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-state-q2",
          prompt:
            "What is wrong with this?\n\n```kotlin\n@Composable\nfun TodoList() {\n    val todos = remember { mutableListOf<String>() }\n    Button(onClick = { todos.add(\"new\") }) { Text(\"Add\") }\n    todos.forEach { Text(it) }\n}\n```",
          options: [
            "A plain `MutableList` is not observable, so adding to it never triggers recomposition and the UI never updates",
            "`remember` cannot hold a collection",
            "The `forEach` must be inside a `Column`, or nothing renders",
            "Nothing is wrong; `remember` makes the list observable",
          ],
          correctIndex: 0,
          explanation:
            "`remember` only makes the reference survive; it says nothing about change notification. `mutableStateListOf<String>()` is the observable version, or hold a `List` in a `MutableState` and assign a new list on every change.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-state-q3",
          prompt: "Which of these keep their value across a screen rotation, with no extra handling? (Select all that apply.)",
          options: [
            "`rememberSaveable { mutableStateOf(0) }`",
            "State held in a `ViewModel` scoped to the screen",
            "`remember { mutableStateOf(0) }`",
            "A plain local `var count = 0` declared in the composable",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Rotation destroys and recreates the Activity, which discards the whole composition — so `remember` is gone. `rememberSaveable` rides the saved-instance-state `Bundle`; a `ViewModel` outlives the configuration change entirely.",
        },
        {
          id: "kt-compose-state-q4",
          prompt: "What must be true of a value passed to `rememberSaveable` without a custom `Saver`?",
          options: [
            "It must be storable in a `Bundle` — a primitive, a `String`, an enum, or a `Parcelable`",
            "It must be a `data class`",
            "It must be immutable",
            "It must implement `java.io.Serializable` specifically",
          ],
          correctIndex: 0,
          explanation:
            "`rememberSaveable` uses the same saved-instance-state mechanism the View system uses. An arbitrary domain object needs `@Parcelize` or a `Saver` that maps it to and from something the bundle accepts.",
        },
        {
          id: "kt-compose-state-q5",
          prompt:
            "When does `formatted` recompute?\n\n```kotlin\nval formatted = remember(userId) { expensiveFormat(userId) }\n```",
          options: [
            "Only when `userId` differs from the previous composition's value",
            "On every recomposition, because `remember` cannot cache across them",
            "Once, ever — the key is ignored after the first composition",
            "Whenever the composable's parent recomposes",
          ],
          correctIndex: 0,
          explanation:
            "Keys to `remember` are compared with `equals()`; when they match, the stored value is reused. This is `useMemo`'s dependency array, with the important difference that forgetting the key means you *cache too long*, not too little.",
        },
        {
          id: "kt-compose-state-q6",
          prompt: "Which signature belongs to the hoisted, stateless version of a text field wrapper?",
          options: [
            "`fun NameField(value: String, onValueChange: (String) -> Unit, modifier: Modifier = Modifier)`",
            "`fun NameField(initialValue: String, modifier: Modifier = Modifier)`",
            "`fun NameField(state: MutableState<String>, modifier: Modifier = Modifier)`",
            "`fun NameField(viewModel: FormViewModel, modifier: Modifier = Modifier)`",
          ],
          correctIndex: 0,
          explanation:
            "State down as a value, events up as a callback — the same controlled-component contract React uses. Passing a `MutableState` or a ViewModel hands ownership downward and makes the composable harder to preview and test.",
        },
        {
          id: "kt-compose-state-q7",
          prompt:
            "Why wrap this in `derivedStateOf`?\n\n```kotlin\nval showScrollToTop by remember {\n    derivedStateOf { listState.firstVisibleItemIndex > 0 }\n}\n```",
          options: [
            "`firstVisibleItemIndex` changes on almost every frame of a scroll; `derivedStateOf` means recomposition only happens when the boolean itself flips",
            "`derivedStateOf` moves the calculation off the main thread",
            "Without it, `listState` would not be observable",
            "It caches the value for the lifetime of the screen, avoiding repeated reads",
          ],
          correctIndex: 0,
          explanation:
            "Reading the index directly in composition subscribes you to every change of the index. `derivedStateOf` interposes a state object whose value only notifies when the *derived* result changes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-state-q8",
          prompt: "Why does `mutableIntStateOf` exist alongside `mutableStateOf`?",
          options: [
            "To avoid autoboxing: `MutableState<Int>` boxes every value, and the specialised version stores a primitive",
            "Because `mutableStateOf` cannot infer `Int` without an explicit type argument",
            "Because integer state needs a different equality policy",
            "Because `mutableStateOf` is not thread-safe for numeric types",
          ],
          correctIndex: 0,
          explanation:
            "Same motivation as `IntArray` versus `Array<Int>`. It matters in hot paths such as animation counters and scroll offsets; elsewhere the difference is noise, and the lint rule exists mostly to keep the habit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-state-q9",
          prompt:
            "A `TextField` and a sibling submit `Button` both need the same text. Where should the state live?",
          options: [
            "In their lowest common ancestor (or a `ViewModel` if it must outlive the screen), passed down as a value and changed through callbacks",
            "Inside the `TextField` wrapper, with the `Button` reading it through a `CompositionLocal`",
            "Duplicated in both, kept in sync from the button's click handler",
            "In a top-level `var` outside any composable",
          ],
          correctIndex: 0,
          explanation:
            "This is lifting state up, unchanged from React. The rule of thumb in the docs is the *lowest* common ancestor that needs it — hoisting further than necessary makes every intermediate composable recompose for changes it does not care about.",
        },
        {
          id: "kt-compose-state-q10",
          prompt: "What does `by` add in `var name by remember { mutableStateOf(\"\") }`?",
          options: [
            "Property delegation, so `name` reads and writes `state.value` implicitly — identical behaviour, less noise",
            "It makes the state survive configuration changes",
            "It converts the `MutableState` into an immutable snapshot",
            "It defers the read until the layout phase",
          ],
          correctIndex: 0,
          explanation:
            "It is purely syntax, provided by `getValue`/`setValue` extensions on `MutableState`. `val state = remember { mutableStateOf(\"\") }` with `state.value` everywhere behaves exactly the same.",
        },
        {
          id: "kt-compose-state-q11",
          prompt: "What is unidirectional data flow in Compose, stated precisely?",
          options: [
            "State flows down as parameters and events flow up as callbacks, so only the state's owner can change it",
            "Data may only be read once per composition, to keep the flow deterministic",
            "State can only be created at the root of the composition",
            "Every composable must own the state it renders",
          ],
          correctIndex: 0,
          explanation:
            "The value of the rule is that there is exactly one writer per piece of state, so there is exactly one place to look when it is wrong. Passing a `MutableState` downward quietly gives you two.",
        },
      ],
    },

    {
      id: "kt-compose-recomposition",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Recomposition, Skipping and Stability",
      summary:
        "Recomposition is re-running a composable because state it read has changed. The interesting part is not that it happens — it is what Compose *avoids* running. Every restartable composable is a recompose scope; the runtime invalidates only the scopes that actually read the changed state, then, for each child call, decides whether to skip it by comparing this composition's parameters against the last.\n\nThat comparison is where **stability** enters, and there is no React analogue for it. The Compose compiler classifies types: *stable* means Compose can be told when the value changes (primitives, `String`, function types, `MutableState`, and classes whose public properties are all `val`s of stable types), *immutable* is the stronger promise that they never change, and everything else is *unstable*. Notably, every collection interface is unstable — a `List<T>` parameter could be a `MutableList` at runtime — as is any class with a `var` property or any class from a module the Compose compiler did not process. React re-renders children whatever you pass; Compose *tries to skip* them, so an unstable parameter is a silent performance regression rather than a correctness issue.\n\nSince Kotlin 2.0.20 **strong skipping** is on by default and changes the rules again. Every restartable composable becomes skippable even with unstable parameters; unstable parameters are then compared by **instance** equality (`===`) instead of `equals()`; and lambdas declared inside composables are automatically wrapped in `remember`, keyed by their captures. So the modern failure mode is not \"my lambda allocates\" — it is \"my unstable object is a new instance on every recomposition\", which `===` will never match. The fix is to make the type genuinely immutable, or annotate it `@Stable` so it is compared with `equals()` again. `@Stable` is a promise the runtime cannot verify, and a false one shows up as a UI that stops updating.\n\nTwo habits separate people who tune Compose from people who guess. Defer reads: `Modifier.offset { IntOffset(x, 0) }` reads the state during *layout*, so only layout re-runs, while `Modifier.offset(x.dp)` reads it during composition. And measure first — the compiler metrics report names the unstable parameters, and the Layout Inspector counts real recompositions.",
      level: "expert",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Android Developers: Stability in Compose", url: "https://developer.android.com/develop/ui/compose/performance/stability", kind: "docs" },
        { label: "Android Developers: Strong skipping mode", url: "https://developer.android.com/develop/ui/compose/performance/stability/strongskipping", kind: "docs" },
        { label: "Chris Banes: Composable metrics", url: "https://chrisbanes.me/posts/composable-metrics/", kind: "article" },
        { label: "Jorge Castillo: Jetpack Compose Internals", url: "https://jorgecastillo.dev/book/", kind: "article" },
      ],
      video: {
        title: "How You Get Your Compose UI From Hundreds of Recompositions to Almost Zero",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=d8SXNwy6VDs",
        videoId: "d8SXNwy6VDs",
        durationLabel: "30:22",
      },
      alternateVideos: [
        {
          title: "Performance Optimization with @Stable and @Immutable in Jetpack Compose",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=_FtKhWvHiTg",
          videoId: "_FtKhWvHiTg",
          durationLabel: "16:47",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-compose-recomposition-q1",
          prompt:
            "`count` changes. What happens?\n\n```kotlin\n@Composable\nfun Screen() {\n    var count by remember { mutableStateOf(0) }\n    Column {\n        Header()                                  // takes no parameters\n        Text(\"Count: $count\")\n        Button(onClick = { count++ }) { Text(\"+\") }\n    }\n}\n```",
          options: [
            "`Screen`'s body re-executes because it reads `count`, but `Header()` is skipped — its parameters are unchanged",
            "Only `Text` re-executes; `Screen`'s body does not run again",
            "`Screen`, `Header`, `Text` and `Button` all re-execute",
            "Nothing re-executes until the next frame boundary",
          ],
          correctIndex: 0,
          explanation:
            "The state is read inside `Screen`, so `Screen` is the invalidated scope and its body runs again — but each child call is a skip decision of its own, and a parameterless composable's parameters can never have changed. Moving the read into a smaller child is how you shrink the invalidated scope.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-recomposition-q2",
          prompt:
            "What is the practical difference?\n\n```kotlin\n// A\nBox(Modifier.offset(x = offsetX.dp))\n\n// B\nBox(Modifier.offset { IntOffset(offsetX.roundToInt(), 0) })\n```",
          options: [
            "A reads `offsetX` during composition, so every change recomposes; B reads it inside a lambda during the layout phase, so only layout re-runs",
            "They are identical; B is just a different overload",
            "B reads the state during the draw phase, so nothing above drawing re-runs",
            "A is more efficient, because `dp` values are cached and `IntOffset` is not",
          ],
          correctIndex: 0,
          explanation:
            "Deferring a state read to a later phase is the single highest-leverage Compose animation optimisation. The lambda overloads of `offset`, `graphicsLayer` and `drawBehind` all exist for this reason.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-recomposition-q3",
          prompt:
            "`User` is a `data class` with only `val` properties of stable types. Why does the compiler still treat `users` as unstable?\n\n```kotlin\n@Composable\nfun UserList(users: List<User>) { … }\n```",
          options: [
            "`List` is an interface, so the runtime instance could be a `MutableList` — Compose treats all collection types as unstable",
            "Generic parameters are always unstable",
            "`data class` types are unstable unless annotated `@Immutable`",
            "The list is unstable only if it is empty at first composition",
          ],
          correctIndex: 0,
          explanation:
            "The compiler reasons about the declared type, and nothing stops a caller passing a mutable implementation. The usual fixes are `kotlinx.collections.immutable`'s `ImmutableList`, or an `@Immutable` wrapper class around the list.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-recomposition-q4",
          prompt: "Which of these does the Compose compiler consider stable? (Select all that apply.)",
          options: [
            "`Int`",
            "`String`",
            "A `data class` whose properties are all `val`s of stable types",
            "`List<String>`",
            "A class with a public `var` property and no annotations",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Primitives, `String` and function types are stable by construction, and the compiler infers stability for classes it can see. A collection interface and a class with a mutable public property are the two unstable cases you meet daily.",
        },
        {
          id: "kt-compose-recomposition-q5",
          prompt: "With strong skipping enabled (the default since Kotlin 2.0.20), how does Compose compare an *unstable* parameter?",
          options: [
            "By instance equality (`===`)",
            "By `equals()`, the same as a stable parameter",
            "It does not compare it — an unstable parameter always forces recomposition",
            "By `hashCode()` only",
          ],
          correctIndex: 0,
          explanation:
            "That is precisely why strong skipping is not a cure-all: if the caller builds a new unstable object each time, `===` fails and the child recomposes anyway. Stable parameters keep using `equals()`, which is what `@Stable` buys you back.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-recomposition-q6",
          prompt: "With strong skipping on, do you still need to wrap lambdas declared inside a composable in `remember`?",
          options: [
            "No — the compiler wraps every such lambda in a `remember` keyed by its captures",
            "Yes — lambdas are never memoized automatically",
            "Only lambdas passed to `LaunchedEffect`",
            "Only lambdas that capture a `MutableState`",
          ],
          correctIndex: 0,
          explanation:
            "Automatic lambda memoization is the second half of strong skipping, and it removed most of the hand-written `remember { { … } }` noise. Note the key comparison follows the same rule as parameters: `===` for unstable captures.",
        },
        {
          id: "kt-compose-recomposition-q7",
          prompt: "What exactly are you promising the runtime when you annotate a class `@Stable`?",
          options: [
            "That `equals()` is consistent, that the public properties will not change without notifying the composition, and that those properties are themselves stable",
            "That the class is immutable and can never change",
            "That the class is safe to access from multiple threads",
            "That instances will be reused rather than reallocated",
          ],
          correctIndex: 0,
          explanation:
            "The compiler cannot check any of this, so a wrong `@Stable` means Compose skips a composable whose data really did change — a stale UI, which is much harder to track down than a slow one. `@Immutable` is the stronger claim that nothing ever changes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-recomposition-q8",
          prompt: "What does `@NonSkippableComposable` do?",
          options: [
            "Keeps a composable restartable but opts it out of skipping, so its body always re-runs when its scope is invalidated",
            "Prevents the composable from ever being recomposed",
            "Forces all of its children to recompose as well",
            "Disables strong skipping for the whole module",
          ],
          correctIndex: 0,
          explanation:
            "It exists because strong skipping makes everything skippable by default and a handful of composables genuinely need to re-run — typically ones whose output depends on something outside their parameters.",
        },
        {
          id: "kt-compose-recomposition-q9",
          prompt: "A child recomposes every time because its `List` parameter is unstable. Why does adding `remember` *inside the child* not fix it?",
          options: [
            "The skip decision is made at the call site in the parent, comparing the arguments it passes; nothing inside the child affects it",
            "`remember` is ignored inside a skippable composable",
            "`remember` only caches values, and the problem is the parameter's type",
            "It does fix it, as long as the list is the `remember` key",
          ],
          correctIndex: 0,
          explanation:
            "Instability is a property of what is passed *in*. Either stabilise the type, or `remember` the list in the parent so the same instance is passed each time and `===` succeeds.",
        },
        {
          id: "kt-compose-recomposition-q10",
          prompt: "Before optimising, how do you find out which composables are actually recomposing and why?",
          options: [
            "Enable the Compose compiler metrics report (skippable/restartable per function, stability per parameter) and use the Layout Inspector's recomposition counts",
            "Add `println` to each composable body and count the lines",
            "Read the generated slot table dump from the APK",
            "Run the app in the emulator and watch the frame-rate overlay",
          ],
          correctIndex: 0,
          explanation:
            "The compiler report is the only source that explains *why* something is not skippable, naming the offending parameter. Logging in a composable body is itself a side effect and can be reordered or parallelised.",
        },
        {
          id: "kt-compose-recomposition-q11",
          prompt: "What does wrapping content in `key(item.id) { … }` change?",
          options: [
            "It gives the content a positional identity based on the key, so `remember`ed state is not reused when the key changes",
            "It caches the content and skips recomposition while the key is unchanged",
            "It marks the content as stable for skipping purposes",
            "It is only meaningful inside `LazyColumn`",
          ],
          correctIndex: 0,
          explanation:
            "Slot-table identity is positional by default. `key` overrides that, which matters whenever the same call site renders different logical things over time — the same problem React's `key` prop solves.",
        },
        {
          id: "kt-compose-recomposition-q12",
          prompt: "Which comparison between `React.memo` and Compose's skipping is accurate?",
          options: [
            "Both compare props to decide whether to re-run, but Compose decides per parameter using compile-time stability information that React has no equivalent of",
            "Both use referential equality on every prop by default",
            "`React.memo` is automatic while Compose skipping must be opted into per composable",
            "Compose compares the rendered output; `React.memo` compares the inputs",
          ],
          correctIndex: 0,
          explanation:
            "React's default shallow compare is uniform and runtime-only. Compose's compiler decides, per parameter and ahead of time, whether `equals()` is trustworthy — which is why \"why isn't this skipping?\" is a question about types, not about memoization.",
        },
      ],
    },

    {
      id: "kt-compose-effects",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Side Effects: LaunchedEffect, DisposableEffect and rememberCoroutineScope",
      summary:
        "A composable body may run any number of times, in any order, possibly in parallel, and may be thrown away before it ever reaches the screen. So anything with a consequence — a request, a snackbar, a listener registration, an analytics event — must move into an API that understands the composition's lifecycle.\n\n`LaunchedEffect(keys)` launches a coroutine when it enters the composition and cancels it when it leaves *or when a key changes*. It is `useEffect` with a dependency array, except that cleanup for the common case is automatic and always correct, because cancelling a coroutine cancels everything structured beneath it. `DisposableEffect(keys)` is the non-coroutine version, and the compiler forces the block to end in `onDispose { }` — register a `LifecycleObserver`, a `BroadcastReceiver`, a sensor callback, and unregister it there. `rememberCoroutineScope()` gives you a scope bound to this call site, which you launch from **event handlers**: a click is not composition, so it cannot call `LaunchedEffect` at all.\n\nThe mistakes are predictable. `LaunchedEffect(Unit)` when you meant a parameter key never restarts, so the coroutine keeps working with the values captured on first composition — the stale-closure bug, with a Kotlin accent. The inverse is a key that is a new instance every recomposition (a lambda, or a class without `equals`), which restarts the effect on every frame; `LaunchedEffect` compares keys with `equals()`, so `listOf(a, b)` is fine and `Params(a, b)` without `data` is not. When an effect must *read* a changing value without restarting, that is exactly what `rememberUpdatedState` is for. Two smaller tools round it out: `SideEffect { }` publishes Compose state to non-Compose code after every successful composition, and `snapshotFlow { }` turns a state read into a cold `Flow` you can debounce, filter and collect.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Android Developers: Side-effects in Compose", url: "https://developer.android.com/develop/ui/compose/side-effects", kind: "docs" },
        { label: "Android Developers: Lifecycle of composables", url: "https://developer.android.com/develop/ui/compose/lifecycle", kind: "docs" },
        { label: "Android Developers: Kotlin coroutines on Android", url: "https://developer.android.com/kotlin/coroutines", kind: "docs" },
      ],
      video: {
        title: "Full Guide to Jetpack Compose Effect Handlers",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=gxWcfz3V2QE",
        videoId: "gxWcfz3V2QE",
        durationLabel: "24:56",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-compose-effects-q1",
          prompt:
            "The user navigates from profile `\"ada\"` to profile `\"grace\"` without leaving this composable. What happens?\n\n```kotlin\n@Composable\nfun Profile(userId: String, vm: ProfileViewModel) {\n    LaunchedEffect(Unit) { vm.load(userId) }\n    …\n}\n```",
          options: [
            "The effect never restarts, so the screen keeps showing Ada — the key should be `userId`",
            "The effect restarts, because `userId` is captured by the lambda",
            "The effect restarts, because any recomposition restarts a `LaunchedEffect`",
            "It crashes: `Unit` is not a valid key",
          ],
          correctIndex: 0,
          explanation:
            "`Unit` never changes, so the coroutine started at first composition just keeps running with the first `userId`. It is the same class of bug as a React `useEffect` with an empty dependency array reading a prop.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-effects-q2",
          prompt:
            "What happens?\n\n```kotlin\nButton(onClick = {\n    LaunchedEffect(Unit) { snackbarHostState.showSnackbar(\"Saved\") }\n}) { Text(\"Save\") }\n```",
          options: [
            "A compile error: `LaunchedEffect` is `@Composable` and cannot be called from a click handler — use `rememberCoroutineScope()`",
            "It compiles but the snackbar never shows",
            "It compiles and works, showing the snackbar once per click",
            "It compiles and shows the snackbar on every recomposition",
          ],
          correctIndex: 0,
          explanation:
            "Effects are declared during composition, not triggered from events. `val scope = rememberCoroutineScope()` in the composable and `scope.launch { … }` in the handler is the correct shape.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-effects-q3",
          prompt: "What does the compiler require of a `DisposableEffect` block?",
          options: [
            "It must end with an `onDispose { … }` clause",
            "It must be the first statement in the composable",
            "Its keys must be `Parcelable`",
            "It must not call suspend functions, and must return a `Job`",
          ],
          correctIndex: 0,
          explanation:
            "The API makes the cleanup non-optional, which is the whole reason to use it over a bare body: register in the block, unregister in `onDispose`, and the pairing is checked at compile time.",
        },
        {
          id: "kt-compose-effects-q4",
          prompt: "When a composable leaves the composition, which of these happen? (Select all that apply.)",
          options: [
            "A `DisposableEffect`'s `onDispose` block runs",
            "A `LaunchedEffect`'s coroutine is cancelled",
            "Coroutines launched from that composable's `rememberCoroutineScope()` are cancelled",
            "`SideEffect`'s block runs one final time",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Everything tied to the composition's lifecycle is torn down. `SideEffect` has no teardown at all — it runs after each successful composition and nothing else, which is why it is only appropriate for publishing values outward.",
        },
        {
          id: "kt-compose-effects-q5",
          prompt:
            "What does this do as the user types?\n\n```kotlin\nLaunchedEffect(query) {\n    delay(300)\n    viewModel.search(query)\n}\n```",
          options: [
            "It debounces: each keystroke changes the key, cancelling the pending coroutine and starting a new 300 ms wait",
            "It throttles: at most one search every 300 ms, with the first one running immediately",
            "It searches once per keystroke after a fixed 300 ms delay each",
            "Nothing: `delay` inside `LaunchedEffect` is not allowed",
          ],
          correctIndex: 0,
          explanation:
            "Restart-on-key-change plus cancellation gives debounce for free. The alternative shape is `snapshotFlow { query }.debounce(300).collectLatest { … }` inside a `LaunchedEffect(Unit)`.",
        },
        {
          id: "kt-compose-effects-q6",
          prompt: "What problem does `rememberUpdatedState` solve?",
          options: [
            "It lets a long-lived effect read the latest value of something without the effect restarting when that value changes",
            "It forces an effect to restart whenever the wrapped value changes",
            "It makes a value survive configuration changes",
            "It converts a `Flow` into Compose state",
          ],
          correctIndex: 0,
          explanation:
            "The canonical case is a timeout: the effect should start once, but the `onTimeout` callback it invokes at the end must be the current one. Passing the callback as a key would restart the timer on every recomposition.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-effects-q7",
          prompt: "When does a `SideEffect { }` block run, and what is it for?",
          options: [
            "After every successful (re)composition — for publishing Compose state to non-Compose code, such as an analytics or logging object",
            "Once, when the composable first enters the composition — for one-time initialisation",
            "Before each composition, so it can prepare data the body needs",
            "When the composable leaves the composition — for cleanup",
          ],
          correctIndex: 0,
          explanation:
            "\"Successful\" matters: a composition that is abandoned never runs it, which is the guarantee a raw statement in the body does not give you. It is not an initialisation hook — that is `LaunchedEffect` or `remember`.",
        },
        {
          id: "kt-compose-effects-q8",
          prompt: "What does `snapshotFlow { }` produce?",
          options: [
            "A cold `Flow` that emits whenever the state read inside the block changes value",
            "A hot `StateFlow` seeded with the current composition",
            "A snapshot of the whole composition tree for debugging",
            "A `Flow` that emits once per frame regardless of changes",
          ],
          correctIndex: 0,
          explanation:
            "It is the bridge from the snapshot system into the Flow world, so you can apply `debounce`, `distinctUntilChanged` or `filter` to something like a scroll position. It is cold, so it only runs while collected — typically inside a `LaunchedEffect`.",
        },
        {
          id: "kt-compose-effects-q9",
          prompt:
            "Why does this effect restart on every recomposition?\n\n```kotlin\nclass Params(val a: Int, val b: Int)   // no data, no equals override\n\nLaunchedEffect(Params(a, b)) { load(a, b) }\n```",
          options: [
            "`Params` uses identity equality, and a new instance is constructed on every recomposition, so the key never compares equal",
            "`LaunchedEffect` compares keys by reference regardless of the type",
            "Keys must be primitives; object keys are always treated as changed",
            "It does not restart — object keys are ignored",
          ],
          correctIndex: 0,
          explanation:
            "`LaunchedEffect` compares keys with `equals()`, so `listOf(a, b)` (structural equality) would be fine and a `data class Params` would be fine. A plain class inherits `Any.equals`, which is reference identity.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-effects-q10",
          prompt: "You need to register and unregister an `OnBackPressedCallback` while a screen is visible. Which API?",
          options: [
            "`DisposableEffect`, registering in the block and unregistering in `onDispose`",
            "`LaunchedEffect`, because registration is a one-time event",
            "`SideEffect`, because it runs after each composition",
            "A plain statement in the composable body, guarded by `remember`",
          ],
          correctIndex: 0,
          explanation:
            "The work is not suspending and it has a clear teardown, which is precisely `DisposableEffect`'s shape. `LaunchedEffect` would register it but give you no place to unregister.",
        },
        {
          id: "kt-compose-effects-q11",
          prompt: "A ViewModel exposes a one-shot `SharedFlow` of navigation events. How should a composable consume it?",
          options: [
            "Collect it inside a `LaunchedEffect` keyed on the flow (or on `Unit` if it never changes), calling the navigation callback per event",
            "Read it with `collectAsState()` and navigate whenever the value is non-null",
            "Call `navController.navigate()` directly in the composable body when the state says so",
            "Collect it inside a `SideEffect` so it runs after each composition",
          ],
          correctIndex: 0,
          explanation:
            "Collection is suspending work tied to the screen's lifetime, which is `LaunchedEffect`'s job. Navigating from the body is a side effect in composition, and turning events into observable state re-fires them on every new collector.",
        },
      ],
    },

    {
      id: "kt-compose-layout",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Row, Column, Box and the Modifier Chain",
      summary:
        "Three composables cover most screens: `Column` stacks vertically, `Row` horizontally, `Box` layers children on top of each other. `Arrangement` distributes children along the main axis, `Alignment` positions them on the cross axis, and `Modifier.weight()` is the flex-grow equivalent — weighted children are measured after the unweighted ones and split whatever space is left.\n\n`Modifier` is an ordered, immutable chain, and **order is the API, not a style preference**. `Modifier.padding(16.dp).background(Red)` paints the background *inside* the padding; swap them and the background fills the padded area too. `Modifier.clickable { }.padding(16.dp)` makes the padding part of the touch target; the other order gives you a smaller, harder-to-hit button. Each modifier wraps the rest of the chain, so reading left to right is reading outermost to innermost.\n\nThe mechanism underneath explains the rest. Compose measures in a **single pass**: constraints travel *down* the chain from left to right, and the resolved size comes back *up* from right to left. That is why `Modifier.size(100.dp).padding(8.dp)` produces a 100.dp box with 84.dp of usable content while `Modifier.padding(8.dp).size(100.dp)` produces a 116.dp footprint — same two modifiers, different question asked of the child. It is also why a child cannot be measured twice without opting into intrinsic measurements, and why putting a `LazyColumn` inside a `Column(Modifier.verticalScroll(…))` throws instead of degrading: an infinite height constraint has no finite size to hand back. One API-design rule falls out of all this and the Compose guidelines make it explicit: every public composable takes `modifier: Modifier = Modifier` as its first optional parameter and applies it to its root, so the caller — not the component — owns layout.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Android Developers: Compose layout basics", url: "https://developer.android.com/develop/ui/compose/layouts/basics", kind: "docs" },
        { label: "Android Developers: Compose modifiers", url: "https://developer.android.com/develop/ui/compose/modifiers", kind: "docs" },
        { label: "Android Developers: Constraints and modifier order", url: "https://developer.android.com/develop/ui/compose/layouts/constraints-modifiers", kind: "docs" },
      ],
      video: {
        title: "Fundamentals of Compose Layouts and Modifiers - MAD Skills",
        channel: "Android Developers",
        url: "https://www.youtube.com/watch?v=xc8nAcVvpxY",
        videoId: "xc8nAcVvpxY",
        durationLabel: "11:55",
      },
      alternateVideos: [
        {
          title: "Constraints and modifier order - MAD Skills",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=OeC5jMV342A",
          videoId: "OeC5jMV342A",
          durationLabel: "12:22",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-compose-layout-q1",
          prompt:
            "How do these two differ on screen?\n\n```kotlin\n// A\nText(\"Hi\", modifier = Modifier.padding(16.dp).background(Color.Red))\n\n// B\nText(\"Hi\", modifier = Modifier.background(Color.Red).padding(16.dp))\n```",
          options: [
            "A paints red only behind the text; B paints red behind the text *and* the 16.dp of padding",
            "They render identically — modifier order only affects performance",
            "B paints red only behind the text; A paints red behind text and padding",
            "A does not compile: `padding` must come after `background`",
          ],
          correctIndex: 0,
          explanation:
            "Each modifier wraps what follows it. In A the padding is applied first, so `background` only sees the inner region; in B the background is applied to the outer region and the padding insets the content within it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-layout-q2",
          prompt:
            "Which chain gives the larger touch target?\n\n```kotlin\n// A\nModifier.clickable { onClick() }.padding(16.dp)\n\n// B\nModifier.padding(16.dp).clickable { onClick() }\n```",
          options: [
            "A — `clickable` wraps the padding, so the padded area is part of the tappable region",
            "B — padding always expands the clickable area",
            "They are identical; padding never affects input handling",
            "Neither: `clickable` must be the last modifier in the chain",
          ],
          correctIndex: 0,
          explanation:
            "Input handling follows the same wrapping rule as drawing. This is a real accessibility issue: the B order produces icon buttons with a touch target smaller than the recommended 48.dp minimum.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-layout-q3",
          prompt:
            "What size does each `Box` occupy, and how much room does its content get?\n\n```kotlin\n// A\nBox(Modifier.size(100.dp).padding(8.dp))\n\n// B\nBox(Modifier.padding(8.dp).size(100.dp))\n```",
          options: [
            "A occupies 100.dp with 84.dp of content; B occupies 116.dp with 100.dp of content",
            "Both occupy 100.dp with 84.dp of content",
            "Both occupy 116.dp with 100.dp of content",
            "A occupies 116.dp with 100.dp of content; B occupies 100.dp with 84.dp of content",
          ],
          correctIndex: 0,
          explanation:
            "Constraints flow down the chain left to right. In A the 100.dp is the outer size and the padding eats into it; in B the padding is applied first, so the 100.dp is the inner size and 8.dp on each side is added outside it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-layout-q4",
          prompt: "Which of these are true of `Modifier`? (Select all that apply.)",
          options: [
            "It is an ordered chain, and changing the order changes behaviour",
            "Modifiers are immutable — each call returns a new `Modifier` wrapping the previous one",
            "During layout, constraints flow down the chain left to right and resolved sizes come back right to left",
            "Two adjacent `padding` calls are collapsed into one by the compiler",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Nothing is collapsed: `Modifier.padding(8.dp).padding(8.dp)` really does apply 16.dp in total. The immutability is what makes it safe to hoist a shared `Modifier` into a `val` and reuse it.",
        },
        {
          id: "kt-compose-layout-q5",
          prompt:
            "How is the width divided?\n\n```kotlin\nRow(Modifier.width(400.dp)) {\n    Box(Modifier.weight(1f))\n    Box(Modifier.width(100.dp))\n    Box(Modifier.weight(2f))\n}\n```",
          options: [
            "The fixed 100.dp is measured first, then the remaining 300.dp is split 100.dp / 200.dp between the weighted children",
            "Each child gets 400/3 dp, and the fixed width is ignored",
            "The weighted children split the full 400.dp as 133/267, overlapping the fixed one",
            "It throws: fixed and weighted children cannot be mixed in a `Row`",
          ],
          correctIndex: 0,
          explanation:
            "Unweighted children are measured with the incoming constraints first; the remainder is then divided in proportion to the weights. `weight(fill = false)` is the escape hatch for a child that should take at most its share.",
        },
        {
          id: "kt-compose-layout-q6",
          prompt: "In a `Box`, which child appears on top, and how do you position one?",
          options: [
            "The last child declared draws on top; position it with `Modifier.align(Alignment.…)` inside the `BoxScope`",
            "The first child draws on top; use `Modifier.zIndex(…)` to change it",
            "Children are positioned by `Arrangement`, and stacking order is undefined",
            "All children are centred and stacking order follows their measured size",
          ],
          correctIndex: 0,
          explanation:
            "`Box` draws in declaration order, last on top. `align` is a `BoxScope` member — the receiver-scoped extension pattern from the lambdas topic, which is why it is unavailable outside a `Box`.",
        },
        {
          id: "kt-compose-layout-q7",
          prompt:
            "What happens?\n\n```kotlin\nColumn(Modifier.verticalScroll(rememberScrollState())) {\n    Header()\n    LazyColumn { items(100) { Row(it) } }\n}\n```",
          options: [
            "It throws at runtime: \"Vertical viewport was given unbounded height\"",
            "It renders, but the inner list scrolls independently of the outer column",
            "It renders and both scroll together",
            "It compiles but the `LazyColumn` shows nothing",
          ],
          correctIndex: 0,
          explanation:
            "A scrolling parent offers infinite height, and a lazy list needs a finite viewport to know what to compose. Either drop the outer scroll and put `Header()` in an `item { }`, or give the `LazyColumn` a bounded height.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-layout-q8",
          prompt: "What is the difference between `Modifier.fillMaxWidth()` and `Modifier.wrapContentWidth()`?",
          options: [
            "`fillMaxWidth` makes the element as wide as the incoming max constraint; `wrapContentWidth` lets it be as wide as its content and positions it within the available space",
            "`fillMaxWidth` applies to the parent; `wrapContentWidth` applies to the child",
            "They are synonyms, kept for compatibility with the View system's `match_parent` and `wrap_content`",
            "`wrapContentWidth` forces a fixed width of zero unless combined with `width()`",
          ],
          correctIndex: 0,
          explanation:
            "`wrapContent*` also takes an alignment, which is how you centre a narrow child inside a wide slot without a `Box`. They are close cousins of `match_parent`/`wrap_content` but not the same thing, because Compose has no layout params.",
        },
        {
          id: "kt-compose-layout-q9",
          prompt: "Why do the Compose API guidelines say every public composable should take `modifier: Modifier = Modifier` and apply it to its root?",
          options: [
            "So the caller controls sizing, padding and behaviour from the outside, instead of the component guessing what its context needs",
            "Because the Compose runtime requires a modifier parameter to build the slot table",
            "Because it is the only way to pass a `Modifier` to a child composable",
            "To let the compiler skip the composable when the modifier is unchanged",
          ],
          correctIndex: 0,
          explanation:
            "It is the Compose equivalent of not baking margins into a reusable View. Applying it anywhere other than the root, or adding your own padding after it, silently overrides the caller's intent.",
        },
        {
          id: "kt-compose-layout-q10",
          prompt: "Which pair is correct for a `Row`?",
          options: [
            "`horizontalArrangement` controls spacing along the main axis; `verticalAlignment` positions children on the cross axis",
            "`verticalArrangement` controls the main axis; `horizontalAlignment` controls the cross axis",
            "`Arrangement` controls both axes; `Alignment` only applies inside a `Box`",
            "Both parameters apply to the main axis; the cross axis is always centred",
          ],
          correctIndex: 0,
          explanation:
            "A `Row`'s main axis is horizontal, so arrangement is horizontal and alignment is vertical. `Column` swaps them — which is the pair of parameter names people reach for by muscle memory and get wrong.",
        },
      ],
    },

    {
      id: "kt-compose-lists",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Lazy Lists, Keys and List Performance",
      summary:
        "`LazyColumn`, `LazyRow` and the lazy grids are Compose's `RecyclerView`: they compose and lay out only the items in or near the viewport. The API is a **DSL, not a composable body** — `LazyListScope` gives you `item { }`, `items(count)` and `items(list)`, and the code inside that block runs once to *describe* the list rather than once per row per frame. Putting a `for` loop inside a plain `Column` instead composes everything, which is fine for ten rows and fatal for a thousand.\n\n`key` is the part people skip, and it is the one that causes bugs rather than jank. By default an item's slot-table identity is its **index**, so prepending an item shifts every remembered state down by one row: a half-typed `TextField`, the scroll position of a nested `LazyRow`, an expanded/collapsed flag — all now attached to the wrong data. `items(messages, key = { it.id })` fixes that and is also what lets `Modifier.animateItem()` animate a reorder instead of cross-fading content in place. One constraint the docs are explicit about: the key's type must be storable in a `Bundle` — a primitive, an enum or a `Parcelable` — because `rememberSaveable` inside an item is restored through it.\n\nPerformance beyond keys is mostly about not fighting the design. Do not nest a scrollable in the same direction (it throws). Give a heterogeneous list a `contentType` so Compose reuses the right slot structure between item types. Avoid `Modifier.fillMaxSize()` on an item in the scroll direction. And remember that a `List` parameter is unstable to the Compose compiler, so with strong skipping the parent skips only when it passes *the same instance* — hoisting or remembering the list, or using an immutable collection type, is what keeps the lazy block from being re-described on every recomposition.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Android Developers: Lists and grids in Compose", url: "https://developer.android.com/develop/ui/compose/lists", kind: "docs" },
        { label: "Android Developers: Compose performance best practices", url: "https://developer.android.com/develop/ui/compose/performance/bestpractices", kind: "docs" },
        { label: "android/compose-samples", url: "https://github.com/android/compose-samples", kind: "repo" },
      ],
      video: {
        title: "Lazy layouts in Compose",
        channel: "Android Developers",
        url: "https://www.youtube.com/watch?v=1ANt65eoNhQ",
        videoId: "1ANt65eoNhQ",
        startSeconds: 11,
        chapterLabel: "Lazy Lists",
        durationLabel: "24:32",
      },
      alternateVideos: [
        {
          title: "Top 3 Hacks to Remove LazyColumn Lag in Jetpack Compose - Android Studio Tutorial",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=s8h7GJTZa4E",
          videoId: "s8h7GJTZa4E",
          durationLabel: "13:56",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-compose-lists-q1",
          prompt:
            "The user expands the third row, then a new message arrives and is prepended to `messages`. What do they see?\n\n```kotlin\nLazyColumn {\n    items(messages) { msg ->\n        var expanded by rememberSaveable { mutableStateOf(false) }\n        MessageRow(msg, expanded) { expanded = !expanded }\n    }\n}\n```",
          options: [
            "The wrong row is now expanded — without a `key`, remembered state is tied to the item's index",
            "The correct row stays expanded, because `rememberSaveable` keys on the item",
            "Every row collapses, because the list identity changed",
            "It throws, because `rememberSaveable` is not allowed inside a lazy item",
          ],
          correctIndex: 0,
          explanation:
            "Slot identity is positional by default, so state stays with position 2 while the data at position 2 changed. `items(messages, key = { it.id })` binds state to the item instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-lists-q2",
          prompt: "Can you use an arbitrary `data class` as a lazy-list item key?",
          options: [
            "Only if it is `Parcelable` — the key must be a type a `Bundle` can hold, because `rememberSaveable` inside the item is restored through it",
            "Yes — any type with `equals`/`hashCode` works",
            "No — keys must always be `Int` indices",
            "Yes, but only if the list is also `@Immutable`",
          ],
          correctIndex: 0,
          explanation:
            "The documented restriction catches people who build composite keys out of domain objects. A `String` or `Long` id, or an `@Parcelize` wrapper, is the practical answer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-lists-q3",
          prompt: "When does the lambda passed to `items(list) { … }` actually run for a given item?",
          options: [
            "When that item is at or near the viewport — items far off screen are never composed",
            "Once for every item, when the `LazyColumn` first enters the composition",
            "Once per frame for every item in the list",
            "Only after the user scrolls past the item at least once",
          ],
          correctIndex: 0,
          explanation:
            "That is the whole point of laziness. The surrounding `LazyListScope` block, by contrast, does run in full — it is cheap because it only records how many items there are and how to build each one.",
        },
        {
          id: "kt-compose-lists-q4",
          prompt: "Which of these are true of `LazyColumn`? (Select all that apply.)",
          options: [
            "The `LazyListScope` block describes the list; it is not a composable body that emits every row",
            "Items outside (and beyond the prefetch window of) the viewport are not composed",
            "Providing `key` lets remembered item state follow the item when its position changes",
            "It recycles `View` instances the way `RecyclerView` does",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "There are no `View`s and no `ViewHolder`s to recycle — Compose reuses slot-table structure instead, which is what `contentType` helps it do well for heterogeneous lists.",
        },
        {
          id: "kt-compose-lists-q5",
          prompt: "What does `contentType` on `items(...)` do, and when does it matter?",
          options: [
            "It tells Compose which items share a structure so their composition slots can be reused — it matters in lists that mix different row layouts",
            "It sets the MIME type used when the list is shared",
            "It chooses between `LazyColumn` and `LazyVerticalGrid` at runtime",
            "It forces the item to be treated as stable for skipping",
          ],
          correctIndex: 0,
          explanation:
            "Without it, a feed alternating headers, images and text rows keeps discarding and rebuilding incompatible slot structures. With it, scrolling reuses the structure of the previous item of the same type.",
        },
        {
          id: "kt-compose-lists-q6",
          prompt: "What does `Modifier.animateItem()` require to work?",
          options: [
            "Keys on the items, so the runtime can tell a move apart from a content change",
            "A fixed item height",
            "`LazyColumn` to be wrapped in an `AnimatedVisibility`",
            "Nothing — it animates any list",
          ],
          correctIndex: 0,
          explanation:
            "Without keys, item 2 becoming item 3 is indistinguishable from item 2's content changing, so there is no move to animate. The same information powers the correct state retention in the previous question.",
        },
        {
          id: "kt-compose-lists-q7",
          prompt:
            "Why does this recompose on every scrolled pixel, and what fixes it?\n\n```kotlin\nval state = rememberLazyListState()\nif (state.firstVisibleItemScrollOffset > 0) { ShowShadow() }\n```",
          options: [
            "Reading the offset directly in composition subscribes to every change; wrap the condition in `remember { derivedStateOf { … } }`",
            "`rememberLazyListState` must be hoisted into a `ViewModel`",
            "`if` statements always force recomposition; use `AnimatedVisibility`",
            "The offset is a `Flow`, so it must be collected with `collectAsStateWithLifecycle`",
          ],
          correctIndex: 0,
          explanation:
            "`derivedStateOf` interposes a state object that only notifies when the derived boolean flips, turning hundreds of recompositions per scroll into two.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-lists-q8",
          prompt: "What is the actual cost of rendering 1,000 rows in a plain `Column` instead of a `LazyColumn`?",
          options: [
            "All 1,000 rows are composed, measured and placed up front, even though only a handful are visible",
            "Nothing measurable — Compose culls off-screen children automatically",
            "It fails to compile: `Column` has a child limit",
            "Only the visible rows are composed, but all 1,000 are measured",
          ],
          correctIndex: 0,
          explanation:
            "`Column` is an eager layout with no viewport concept. It is the right choice for a handful of children — and using a `LazyColumn` for five rows adds machinery you do not need.",
        },
        {
          id: "kt-compose-lists-q9",
          prompt: "Why should an item composable avoid `Modifier.fillMaxSize()` inside a `LazyColumn`?",
          options: [
            "The list offers unbounded height in the scroll direction, so filling it is meaningless and forces awkward constraints",
            "`fillMaxSize` is not available inside `LazyItemScope`",
            "It disables key-based state retention",
            "It makes the item unstable for skipping",
          ],
          correctIndex: 0,
          explanation:
            "The cross axis is bounded; the scroll axis is not. `fillMaxWidth()` is fine, and `fillParentMaxSize()` exists in `LazyItemScope` for the deliberate \"one item per screen\" case.",
        },
        {
          id: "kt-compose-lists-q10",
          prompt: "What is the effect of passing a freshly built `List` to a composable containing a `LazyColumn` on every recomposition?",
          options: [
            "The list parameter is unstable, so instance comparison fails and the composable re-runs and re-describes the list each time",
            "Nothing — the `LazyColumn` diffs the contents and skips identical items",
            "The lazy items are all recomposed regardless, because lists are never compared",
            "It throws, because a lazy list requires a stable collection",
          ],
          correctIndex: 0,
          explanation:
            "With strong skipping, unstable parameters are compared with `===`, and a new list instance never matches. Hoist or `remember` the list, or use an `ImmutableList` — the fix is at the call site, not inside the list.",
        },
      ],
    },

    {
      id: "kt-compose-theming",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Theming with Material 3",
      summary:
        "`MaterialTheme` is not a wrapper that styles its children. It publishes three `CompositionLocal`s — `colorScheme`, `typography` and `shapes` — that every Material component reads implicitly, wherever it sits in the tree. Reading `MaterialTheme.colorScheme.primary` in your own composable is how you stay on theme; writing `Color(0xFF6650A4)` is how a dark-mode bug ships.\n\nMaterial 3 renamed the Material 2 vocabulary deliberately. `Colors` became `ColorScheme`, with role-based slots (`primary`/`onPrimary`, `surface`/`onSurface`, the `surfaceContainer` family) so a component asks for \"the colour that belongs on a surface\" rather than for a specific grey. That indirection is what makes dynamic colour possible: on Android 12 and above, `dynamicLightColorScheme(context)` / `dynamicDarkColorScheme(context)` derive an entire scheme from the user's wallpaper, and every correctly written component follows without a single change — while every hard-coded hex stays behind and looks wrong. A snippet that says `MaterialTheme.colors.primary` (no `Scheme`) is Material 2 and predates this.\n\nPractical notes. Dark mode is a *different `ColorScheme` instance*, not a flag: your theme composable picks one with `isSystemInDarkTheme()` at the root, and nothing below needs to know. Reading a `CompositionLocal` makes the reading composable recompose when it changes, which is exactly right for a theme switch and exactly wrong for a fast-changing value — and `staticCompositionLocalOf` skips read tracking entirely, so changing it recomposes the whole subtree instead. Finally, a custom design system is usually your own `CompositionLocal`s (spacing, brand colours, elevation tokens) provided *alongside* `MaterialTheme`, not a fork of it; `MaterialTheme` itself has no spacing scale.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "Android Developers: Material Design 3 in Compose", url: "https://developer.android.com/develop/ui/compose/designsystems/material3", kind: "docs" },
        { label: "Android Developers: Custom design systems in Compose", url: "https://developer.android.com/develop/ui/compose/designsystems/custom", kind: "docs" },
        { label: "Material Design 3: The color system", url: "https://m3.material.io/styles/color/system/overview", kind: "spec" },
      ],
      video: {
        title: "Introduction to Material 3 (Color Theming, Typography, Shapes)",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=I3eT32LXAKc",
        videoId: "I3eT32LXAKc",
        durationLabel: "18:04",
      },
      alternateVideos: [
        {
          title: "Implementing Material You using Jetpack Compose",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=jrfuHyMlehc",
          videoId: "jrfuHyMlehc",
          durationLabel: "14:18",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-compose-theming-q1",
          prompt: "Where does a `Button`'s default background colour come from?",
          options: [
            "`MaterialTheme.colorScheme`, read through a `CompositionLocal` provided by the enclosing theme",
            "A constant compiled into the Material library",
            "The `Modifier` chain passed to the button",
            "The Android theme in `res/values/themes.xml`",
          ],
          correctIndex: 0,
          explanation:
            "`CompositionLocal` is how a value reaches arbitrarily deep children without being threaded through every parameter list. It is also why a component placed outside any `MaterialTheme` falls back to default values rather than crashing.",
        },
        {
          id: "kt-compose-theming-q2",
          prompt: "A developer writes `Text(\"Total\", color = Color(0xFF1B1F27))`. What breaks, and when?",
          options: [
            "It stays near-black in dark mode, where the surface behind it is also dark — the text becomes unreadable",
            "Nothing: Compose inverts hard-coded colours automatically in dark mode",
            "It fails to compile without an `@Stable` annotation on the colour",
            "It breaks only on Android 12 and above, where dynamic colour is enabled",
          ],
          correctIndex: 0,
          explanation:
            "Nothing inverts anything. `MaterialTheme.colorScheme.onSurface` resolves differently per scheme, which is the entire purpose of role-based slots — and the same discipline is what makes dynamic colour work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-theming-q3",
          prompt: "Which of these does `MaterialTheme` provide in Compose Material 3? (Select all that apply.)",
          options: ["`colorScheme`", "`typography`", "`shapes`", "`spacing`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "There is no spacing scale in `MaterialTheme` — teams that want one add their own `CompositionLocal` next to it. That is the standard first step towards a custom design system.",
        },
        {
          id: "kt-compose-theming-q4",
          prompt: "What is the `onPrimary` slot for?",
          options: [
            "The colour for content (text, icons) drawn on top of a `primary`-coloured surface, guaranteed to contrast with it",
            "The colour used when a primary-coloured component is pressed",
            "The primary colour with reduced opacity, for disabled states",
            "The colour of the primary component's border",
          ],
          correctIndex: 0,
          explanation:
            "Every `x`/`onX` pair encodes a contrast guarantee. Using `onPrimary` instead of `Color.White` is what keeps a light-wallpaper dynamic scheme legible.",
        },
        {
          id: "kt-compose-theming-q5",
          prompt: "On which Android versions is dynamic colour available, and what should the theme do elsewhere?",
          options: [
            "Android 12 (API 31) and above; below that, fall back to your own light and dark schemes",
            "All versions supported by Compose — the library backports it",
            "Android 13 and above; below that, colours default to grey",
            "It is a Compose feature with no OS dependency",
          ],
          correctIndex: 0,
          explanation:
            "It reads wallpaper-derived system colours that only exist from API 31. The standard theme composable branches on `Build.VERSION.SDK_INT` and on a `dynamicColor` flag so the app is still brand-consistent on older devices.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-theming-q6",
          prompt: "How is dark mode expressed in a Compose Material 3 theme?",
          options: [
            "By choosing a different `ColorScheme` instance at the theme root, typically via `isSystemInDarkTheme()`",
            "By setting `MaterialTheme(darkMode = true)`",
            "By providing `LocalDarkMode` and letting each component read it",
            "By adding a `night` resource qualifier, as in the View system",
          ],
          correctIndex: 0,
          explanation:
            "Components never ask \"are we dark?\" — they ask for `surface` and get whatever the current scheme says. That is why a theme toggle in app state works without touching a single screen.",
        },
        {
          id: "kt-compose-theming-q7",
          prompt: "What is the difference between `compositionLocalOf` and `staticCompositionLocalOf`?",
          options: [
            "`compositionLocalOf` tracks reads so only readers recompose; `staticCompositionLocalOf` does not track, so changing it recomposes the whole subtree under the provider",
            "`staticCompositionLocalOf` can only hold compile-time constants",
            "`compositionLocalOf` is scoped to one composable; `staticCompositionLocalOf` is global",
            "They are identical; the static form is a deprecated alias",
          ],
          correctIndex: 0,
          explanation:
            "Read tracking has a cost, so the static form is the right choice for values that almost never change — which is exactly the case for the theme objects themselves. Put a fast-changing value in a static local and you recompose everything below it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-theming-q8",
          prompt: "A snippet reads `MaterialTheme.colors.primary`. What does that tell you about it?",
          options: [
            "It is Material 2 — Material 3 renamed the accessor to `MaterialTheme.colorScheme`",
            "It is current Material 3 code using the short form",
            "It is Compose Multiplatform rather than Android",
            "It predates Compose 1.0 and will not compile at all today",
          ],
          correctIndex: 0,
          explanation:
            "`Colors` versus `ColorScheme` is the fastest way to date an Android UI snippet after the XML/Compose split. M2 and M3 artifacts can coexist in one app during a migration, which is why both spellings are still findable online.",
        },
        {
          id: "kt-compose-theming-q9",
          prompt: "Your design system needs brand colours, a spacing scale and custom elevation tokens. What is the idiomatic approach?",
          options: [
            "Define your own `CompositionLocal`s and provide them alongside `MaterialTheme` in a single app-level theme composable",
            "Fork the Material 3 library and extend `ColorScheme`",
            "Pass a `DesignTokens` object as a parameter to every composable",
            "Store the tokens in `res/values` and read them with `stringResource`/`dimensionResource`",
          ],
          correctIndex: 0,
          explanation:
            "`CompositionLocalProvider` composes cleanly with `MaterialTheme`, so Material components keep working while your own tokens are available everywhere. Threading a token object through every parameter list is the problem `CompositionLocal` exists to solve.",
        },
      ],
    },

    {
      id: "kt-compose-navigation-interop",
      moduleId: "mobile-kotlin-compose",
      trackId: "mobile",
      title: "Navigation and Interop with the View System",
      summary:
        "Navigation in Compose has had three eras and you will meet all of them in real code. Fragments plus an XML nav graph is the legacy. **Navigation Compose** — the `androidx.navigation` 2.x line — gave you a `NavController` and a `NavHost` of `composable(\"detail/{id}\")` destinations with string routes and hand-parsed arguments; since 2.8 there is a type-safe form where a `@Serializable` class *is* the route and `composable<Detail> { }` hands it back typed. **Navigation 3** (`androidx.navigation3`, stable since 2026) inverts the model: you own the back stack as an ordinary observable `List` of keys and `NavDisplay` renders it, which turns adaptive multi-pane layouts, custom back behaviour and scoped state into ordinary code rather than library configuration.\n\nWhichever generation you are on, three rules survive. The `NavController` belongs at the `NavHost`, not inside leaf screens: screens take plain callbacks (`onItemClick: (String) -> Unit`) so they stay previewable, testable and reusable. A route argument should be an id, not a serialised object — routes end up in deep links and saved state. And navigation is a side effect: trigger it from a callback or a `LaunchedEffect`, never from a composable body.\n\nInterop is the other half, because almost no real app is pure Compose. `AndroidView` hosts a `View` inside the composition — a `MapView`, a `WebView`, an ad view — and its `factory`/`update` split matters: `factory` runs once to create the View, `update` runs afterwards whenever state it reads changes. `ComposeView` does the reverse, hosting composables inside an XML layout or a Fragment. The gotcha there is `ViewCompositionStrategy`: the default, `DisposeOnDetachedFromWindowOrReleasedFromPool`, is right for an Activity and for `RecyclerView` items, but inside a Fragment the view can detach and reattach while the Fragment is alive, so you set `DisposeOnViewTreeLifecycleDestroyed` — or lose composition state on every back-stack transaction.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Android Developers: Navigation", url: "https://developer.android.com/guide/navigation", kind: "docs" },
        { label: "Android Developers: Navigation 3", url: "https://developer.android.com/guide/navigation/navigation-3", kind: "docs" },
        { label: "Android Developers: Compose and View interoperability APIs", url: "https://developer.android.com/develop/ui/compose/migrate/interoperability-apis", kind: "docs" },
        { label: "Android Developers: Using Compose in Views", url: "https://developer.android.com/develop/ui/compose/migrate/interoperability-apis/compose-in-views", kind: "docs" },
      ],
      video: {
        title: "Type-Safe Navigation with the OFFICIAL Compose Navigation Library",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=AIC_OFQ1r3k",
        videoId: "AIC_OFQ1r3k",
        durationLabel: "10:03",
      },
      alternateVideos: [
        {
          title: "From Views to Compose: Where can I start?",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=y10I6Suhvtc",
          videoId: "y10I6Suhvtc",
          durationLabel: "5:31",
        },
        {
          title: "Let's Migrate an XML Project to Jetpack Compose!",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=qYzhqFdUEQg",
          videoId: "qYzhqFdUEQg",
          durationLabel: "15:49",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "kt-compose-navigation-interop-q1",
          prompt: "Why is passing a `NavController` into a screen composable discouraged?",
          options: [
            "It couples the screen to the navigation graph, so it cannot be previewed, tested or reused without one — plain callbacks decouple it",
            "`NavController` is not stable, so it forces recomposition",
            "`NavController` can only be read inside the `NavHost` lambda",
            "It leaks the Activity, because `NavController` holds a `Context`",
          ],
          correctIndex: 0,
          explanation:
            "It is the same argument as not passing a router into a React component. Keep navigation decisions at the `NavHost` and hand screens `onItemClick: (String) -> Unit`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-navigation-interop-q2",
          prompt:
            "What does the type-safe form of Navigation Compose let you write?\n\n```kotlin\n@Serializable data class Detail(val id: String)\n```",
          options: [
            "`composable<Detail> { entry -> … }`, receiving a typed `Detail` instead of parsing a string route",
            "`composable(\"detail/{id}\")`, with the class used only for documentation",
            "`NavHost(startDestination = Detail::class.java.name)`, with arguments read from a `Bundle`",
            "Nothing extra — `@Serializable` is only needed for deep links",
          ],
          correctIndex: 0,
          explanation:
            "Routes became objects in Navigation 2.8: the destination and its arguments are one serializable type, checked by the compiler. String routes with `{placeholders}` still work and are what most existing code and tutorials show.",
        },
        {
          id: "kt-compose-navigation-interop-q3",
          prompt: "Which of these are true of `AndroidView`? (Select all that apply.)",
          options: [
            "`factory` runs once to create the `View` instance",
            "`update` runs after the first composition and again whenever state it reads changes",
            "It is how you host a `MapView`, `WebView` or an existing custom `View` inside Compose",
            "It converts the `View` into a composable at compile time",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Nothing is converted — a real `View` is created and parented into the Compose hierarchy. Mixing creation and mutation in `factory` is the usual bug, because it recreates the View on every state change.",
        },
        {
          id: "kt-compose-navigation-interop-q4",
          prompt: "A `ComposeView` inside a Fragment loses its state whenever the Fragment goes onto the back stack and comes back. Why?",
          options: [
            "The default strategy disposes the composition when the view detaches from the window; a Fragment needs `DisposeOnViewTreeLifecycleDestroyed`",
            "`ComposeView` does not support Fragments and must be replaced with `setContent` on the Activity",
            "The Fragment's `ViewModel` is cleared on every back-stack transaction",
            "`rememberSaveable` does not work inside a `ComposeView`",
          ],
          correctIndex: 0,
          explanation:
            "`DisposeOnDetachedFromWindowOrReleasedFromPool` is the documented default and is right for an Activity or a pooling container. A Fragment's view detaches while the Fragment is still alive, so the composition should follow the view-tree lifecycle instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-navigation-interop-q5",
          prompt: "Why pass an id in a route rather than the whole object?",
          options: [
            "Routes are persisted in saved state and can arrive from deep links, so they must be small, stable and reconstructable from a data source",
            "Objects cannot be serialised into a route at all",
            "The `NavController` holds only one argument per destination",
            "Passing objects breaks the back button",
          ],
          correctIndex: 0,
          explanation:
            "A route is closer to a URL than to a function call. Ship the id and let the destination's own layer load the current data — otherwise you are rendering a snapshot taken at navigation time.",
        },
        {
          id: "kt-compose-navigation-interop-q6",
          prompt: "What changes in Navigation 3's model compared with Navigation 2's `NavHost`?",
          options: [
            "You own the back stack as an observable `List` of keys and `NavDisplay` renders it, instead of declaring a graph the library manages",
            "Routes must be strings again, because type-safe routes were removed",
            "Navigation moves back into XML graphs shared with Fragments",
            "The back stack becomes immutable and can only be changed by the system back gesture",
          ],
          correctIndex: 0,
          explanation:
            "Owning the list is what makes adaptive layouts (showing two entries side by side on a tablet) and custom back behaviour ordinary code. Navigation 2 remains supported and is what most existing apps and tutorials use.",
        },
        {
          id: "kt-compose-navigation-interop-q7",
          prompt: "Where should `navController.navigate(...)` be called from?",
          options: [
            "From an event callback, or from a `LaunchedEffect` when it is driven by state — never from a composable body",
            "Directly in the composable body, guarded by an `if` on the state",
            "From `SideEffect`, so it runs after composition succeeds",
            "From the `NavHost`'s `builder` lambda",
          ],
          correctIndex: 0,
          explanation:
            "Navigating is a side effect with a consequence that cannot be undone by a discarded composition. A body-level call can fire several times, or during a composition that is thrown away.",
        },
        {
          id: "kt-compose-navigation-interop-q8",
          prompt: "A tutorial you found uses `setContentView(R.layout.activity_main)` and `findViewById`. What does that tell you?",
          options: [
            "It predates Compose entirely and teaches the View system — the concepts still apply to legacy screens, but none of the Compose APIs appear",
            "It is a Compose tutorial using the interop APIs",
            "It is current best practice for a single-Activity app",
            "It is Compose Multiplatform, which still uses XML layouts on Android",
          ],
          correctIndex: 0,
          explanation:
            "A great deal of Android material online predates Compose, and an XML layout plus `findViewById` is the clearest tell — alongside `LiveData`, data binding and `RecyclerView.Adapter`. It is still worth reading when you maintain a legacy screen, and worth nothing when you are writing a new one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "kt-compose-navigation-interop-q9",
          prompt: "Should a new, Compose-only app still use Fragments for its screens?",
          options: [
            "No — the recommended architecture is a single Activity with composable destinations; Fragments are an interop tool for hybrid apps",
            "Yes — every Compose destination must be hosted by a Fragment",
            "Yes — Fragments are required for the back stack to work",
            "It makes no difference; both are equally recommended",
          ],
          correctIndex: 0,
          explanation:
            "The docs are explicit about this: Fragments and `ComposeView` are a migration step. Keeping them in a greenfield Compose app buys you two lifecycles to reason about instead of one.",
        },
        {
          id: "kt-compose-navigation-interop-q10",
          prompt: "You are adding one Compose screen to a large XML-based app. What is the smallest sensible first step?",
          options: [
            "Wrap one leaf screen's content in a `ComposeView` (or use `setContent` in a new Activity) and leave the rest of the navigation as it is",
            "Convert the navigation graph to Navigation Compose first, then migrate screens",
            "Rewrite the app's theme in Material 3 before touching any screen",
            "Replace every `RecyclerView` with a `LazyColumn` as a first pass",
          ],
          correctIndex: 0,
          explanation:
            "The documented migration strategy is bottom-up: leaf screens and self-contained components first, shared infrastructure last, so each step ships on its own. Migrating navigation first forces every screen to move at once.",
        },
        {
          id: "kt-compose-navigation-interop-q11",
          prompt: "What does `BackHandler { … }` do in a Compose screen?",
          options: [
            "Registers a back-press callback for as long as that composable is in the composition, and removes it when it leaves",
            "Pops the navigation back stack once",
            "Disables the system back gesture for the whole app",
            "Replaces `onBackPressed()` in the Activity permanently",
          ],
          correctIndex: 0,
          explanation:
            "It is the composition-scoped wrapper over `OnBackPressedDispatcher`, with the registration and removal handled for you — the same pattern you would write by hand with `DisposableEffect`.",
        },
      ],
    },
  ],
} satisfies Module;
