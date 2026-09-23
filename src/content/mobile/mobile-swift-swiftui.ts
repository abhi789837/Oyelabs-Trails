import type { Module } from "@/types/curriculum";

export default {
  id: "mobile-swift-swiftui",
  trackId: "mobile",
  name: "Swift & SwiftUI",
  description:
    "Swift the language and SwiftUI the framework, written for an engineer who already knows another modern language. Value semantics, ARC, protocols, closures and Swift 6's data-race safety; then SwiftUI's declarative model, state, identity, layout and UIKit interop.",
  refs: [
    {
      label: "The Swift Programming Language",
      url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/",
      kind: "docs",
    },
    { label: "Apple: SwiftUI documentation", url: "https://developer.apple.com/documentation/swiftui", kind: "docs" },
    { label: "Swift.org: Swift 6 migration guide", url: "https://www.swift.org/migration/documentation/migrationguide/", kind: "docs" },
    { label: "Hacking with Swift: SwiftUI by Example", url: "https://www.hackingwithswift.com/quick-start/swiftui", kind: "article" },
  ],
  topics: [
    {
      id: "swift-tour-arc",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Swift's Shape and Automatic Reference Counting",
      summary:
        "Swift is a statically typed, compiled language with aggressive type inference, no implicit numeric conversions, and value types as the default. Coming from TypeScript or Kotlin the syntax is familiar within an hour; what is genuinely different is that Swift has no tracing garbage collector. Memory for class instances is managed by **ARC**, which is not a runtime scanner but the compiler inserting `retain` and `release` calls around your code.\n\nThat trade is deliberate. ARC gives deterministic deallocation — `deinit` runs at a knowable point, so a file handle or observer can be released in it — and no GC pause, which matters on a 120 Hz phone display where a 10 ms stall is a dropped frame. The cost is that ARC cannot collect a reference cycle. Two objects that strongly reference each other leak forever, which is why `weak` and `unowned` exist and why Instruments has a leak detector at all. A tracing collector would sweep those up; ARC never will.\n\nThe second cost is traffic. Every copy of a reference is a pair of atomic refcount operations, so a struct holding ten `String` fields is not free to copy: it is ten retains. The optimiser removes most of this, which produces the gotcha that catches experienced people — **ARC does not guarantee an object lives to the end of its scope.** If nothing reads a variable after a certain line, the compiler may release it there. Code that relies on a lifetime for its side effects needs `withExtendedLifetime` or an explicit use, not a hopeful `let keepAlive = thing`.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        {
          label: "Swift book: The Basics",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/thebasics/",
          kind: "docs",
        },
        {
          label: "Swift book: Automatic Reference Counting",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/automaticreferencecounting/",
          kind: "docs",
        },
        { label: "Swift.org: API Design Guidelines", url: "https://www.swift.org/documentation/api-design-guidelines/", kind: "spec" },
      ],
      video: {
        title: "WWDC24: A Swift Tour: Explore Swift’s features and design | Apple",
        channel: "Apple Developer",
        url: "https://www.youtube.com/watch?v=boiLzazJ9j4",
        videoId: "boiLzazJ9j4",
        durationLabel: "27:36",
      },
      alternateVideos: [
        {
          title: "WWDC21: ARC in Swift: Basics and beyond | Apple",
          channel: "Apple Developer",
          url: "https://www.youtube.com/watch?v=GFq6sV2jD_c",
          videoId: "GFq6sV2jD_c",
          durationLabel: "20:42",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-tour-arc-q1",
          prompt: "What is the fundamental difference between ARC and a tracing garbage collector?",
          options: [
            "ARC is compile-time bookkeeping of reference counts, so it cannot detect or collect reference cycles",
            "ARC scans the heap on a background thread but with a smaller pause than a generational GC",
            "ARC frees memory only when the app is backgrounded, whereas a GC frees it continuously",
            "ARC counts references for both value and reference types, so it needs no cycle detection",
          ],
          correctIndex: 0,
          explanation:
            "The compiler inserts retain/release; nothing at runtime walks the object graph, so a cycle keeps both objects' counts above zero forever. A tracing collector would find them unreachable from the roots and free them.",
        },
        {
          id: "swift-tour-arc-q2",
          prompt: "Which of these are managed by ARC? (Select all that apply.)",
          options: [
            "A class instance",
            "A closure that has been stored in a property",
            "An `actor` instance",
            "A local `Int`",
            "A `struct` with only `Int` and `Bool` stored properties",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "ARC manages reference types: classes, actors, and closures (which are reference types boxed on the heap when they escape). A struct of trivial values carries no refcount at all, though a struct that *contains* a class reference makes ARC traffic when it is copied.",
        },
        {
          id: "swift-tour-arc-q3",
          prompt: "What does this print?\n\n```swift\nclass Logger {\n    let name: String\n    init(_ name: String) { self.name = name }\n    deinit { print(\"bye \\(name)\") }\n}\n\nfunc run() {\n    var a: Logger? = Logger(\"a\")\n    let b = a\n    a = nil\n    print(\"mid\")\n    _ = b\n}\nrun()\nprint(\"done\")\n```",
          options: ["`mid`, `bye a`, `done`", "`bye a`, `mid`, `done`", "`mid`, `done`, `bye a`", "`mid`, `done` — `deinit` never runs"],
          correctIndex: 0,
          explanation:
            "Setting `a` to nil drops one strong reference but `b` still holds one, so nothing is freed yet. `b` goes out of scope at the end of `run()`, the count hits zero and `deinit` runs before `run()` returns.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-tour-arc-q4",
          prompt: "What is the difference between `weak` and `unowned`?",
          options: [
            "`weak` must be an optional `var` and is set to nil automatically when the object is deallocated; `unowned` is non-optional and traps if accessed afterwards",
            "`weak` is checked at compile time; `unowned` is checked at runtime and returns nil on failure",
            "`weak` works only on class types; `unowned` works on any type including structs",
            "They are identical; `unowned` is the older spelling kept for Objective-C compatibility",
          ],
          correctIndex: 0,
          explanation:
            "Zeroing weak references cost a side-table entry but are always safe to read. `unowned` skips that bookkeeping and promises the referent outlives you; break that promise and you get a runtime trap, not nil.",
        },
        {
          id: "swift-tour-arc-q5",
          prompt: "Does this compile, and if not why?\n\n```swift\nlet count = 3\nlet ratio = 0.5\nlet result = count * ratio\n```",
          options: [
            "No — Swift has no implicit numeric conversion, so `Int * Double` has no matching operator",
            "Yes — `count` is promoted to `Double` and `result` is `1.5`",
            "Yes — `ratio` is truncated to `Int` and `result` is `0`",
            "No — `let` constants cannot be used in arithmetic expressions",
          ],
          correctIndex: 0,
          explanation:
            "Integer literals can be inferred as `Double`, but an already-typed `Int` value never converts implicitly. You must write `Double(count) * ratio`. This is a deliberate rejection of C's promotion rules.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-tour-arc-q6",
          prompt: "A team adds `let keepAlive = tracker` at the top of a function so a `Tracker` object survives until the function returns, because its `deinit` flushes analytics. Is that reliable?",
          options: [
            "No — if nothing reads `keepAlive` afterwards the optimiser may release it early; use `withExtendedLifetime` instead",
            "Yes — a `let` binding guarantees the object lives until the end of its lexical scope",
            "Yes, but only in debug builds; release builds need `@inline(never)`",
            "No — `deinit` is never guaranteed to run at all, so the flush must be called explicitly",
          ],
          correctIndex: 0,
          explanation:
            "Swift guarantees an object lives as long as it is *used*, not as long as it is *named*. ARC optimisation can shorten the lifetime to the last use, which for an unread binding is the assignment itself. `withExtendedLifetime(tracker) { ... }` states the dependency the compiler cannot see.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-tour-arc-q7",
          prompt: "What does this print?\n\n```swift\nclass Node { var next: Node?; deinit { print(\"gone\") } }\n\nfunc build() {\n    let a = Node()\n    let b = Node()\n    a.next = b\n    b.next = a\n}\nbuild()\nprint(\"after\")\n```",
          options: ["`after`", "`gone`, `gone`, `after`", "`after`, `gone`, `gone`", "`gone`, `after`"],
          correctIndex: 0,
          explanation:
            "`a` and `b` reference each other strongly, so when the local bindings go away both counts are still 1. Neither `deinit` ever runs — a textbook leak, and exactly what a tracing collector would have swept up.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-tour-arc-q8",
          prompt: "Which statements about `deinit` are true? (Select all that apply.)",
          options: [
            "It runs at a deterministic point — when the last strong reference goes away",
            "Only classes and actors can have one; structs and enums cannot",
            "It cannot be called directly",
            "It is guaranteed to run before the process exits, even for leaked objects",
            "It can be marked `throws` to report cleanup failures",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Deterministic destruction is ARC's main benefit over a collector. Value types are destroyed with their storage and have no deinitialiser, you never call `deinit` yourself, and it cannot throw. Leaked objects simply never deinitialise.",
        },
        {
          id: "swift-tour-arc-q9",
          prompt: "Why does copying a `struct` that holds several `String` and array properties still cost something at runtime?",
          options: [
            "Each stored property that wraps a heap buffer needs a retain, so a copy is several atomic refcount operations",
            "Structs are heap-allocated like classes, so a copy is a full heap allocation",
            "Swift deep-copies the contents of every string and array on assignment",
            "Copying a struct always goes through the Objective-C runtime for bridging",
          ],
          correctIndex: 0,
          explanation:
            "`String` and `Array` are structs wrapping a reference-counted buffer. Copying the outer struct copies the references and retains each one. Nothing is deep-copied — that only happens on the first write, under copy-on-write.",
        },
        {
          id: "swift-tour-arc-q10",
          prompt: "Which of these is the strongest argument for ARC over a tracing GC on a phone?",
          options: [
            "Deterministic deallocation and no collector pause, which matters for a frame budget of about 8 ms",
            "ARC uses less CPU in aggregate than any tracing collector under all workloads",
            "ARC removes the possibility of memory leaks in application code",
            "ARC allows manual `free()` calls when finer control is needed",
          ],
          correctIndex: 0,
          explanation:
            "Predictable latency is the win; total throughput is often worse than a good generational collector because of the atomic refcount traffic. ARC certainly does not prevent leaks — cycles are leaks — and there is no manual free.",
        },
      ],
    },
    {
      id: "swift-optionals",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Optionals, `if let` and `guard let`",
      summary:
        "`Optional<Wrapped>` is not a compiler flag on a type — it is an ordinary generic enum in the standard library with cases `.none` and `.some(Wrapped)`, and `String?` is only sugar for it. That single design decision is what separates Swift's nullability from Kotlin's and Dart's, where nullable types are a property of the type system rather than a value you can hold. Because Swift's optional is a real value you can pattern match it, `map` and `flatMap` over it, store `[String?]`, and — the consequence people trip over — nest it, so `String??` is a genuinely different type from `String?`.\n\nThe unwrapping tools express intent, not just syntax. `if let` narrows into a branch; `guard let` unwraps into the *rest of the function* and forces the failure path to leave the scope, which is why it reads better at the top of a function than a pyramid of `if let`. `??` supplies a default, `?.` short-circuits a chain and always yields an optional result, and `!` is a load-bearing assertion that this cannot be nil — a crash is the intended behaviour if you are wrong.\n\nThe gotcha worth memorising is subscripting a dictionary whose values are themselves optional. `dict[\"key\"]` returns `Value?`, so for `[String: String?]` you get `String??`, and `if let v = dict[\"key\"]` succeeds for a key that exists with a nil value. Kotlin and Dart simply cannot express that shape, so engineers arriving from them read the code as obviously equivalent when it is not.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        {
          label: "Swift book: Optional Chaining",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/optionalchaining/",
          kind: "docs",
        },
        { label: "Apple: Optional", url: "https://developer.apple.com/documentation/swift/optional", kind: "docs" },
        {
          label: "Hacking with Swift: When to use guard let rather than if let",
          url: "https://www.hackingwithswift.com/quick-start/understanding-swift/when-to-use-guard-let-rather-than-if-let",
          kind: "article",
        },
      ],
      video: {
        title: "Swift Optionals - How to Unwrap (real examples)",
        channel: "Sean Allen",
        url: "https://www.youtube.com/watch?v=L3FuDHIv5Ws",
        videoId: "L3FuDHIv5Ws",
        durationLabel: "14:19",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-optionals-q1",
          prompt: "What is `String?` actually, at the type level?",
          options: [
            "Sugar for `Optional<String>`, an enum with cases `.none` and `.some(String)`",
            "A compiler annotation on `String` that enables nil checks, erased at runtime",
            "A protocol that `String` conditionally conforms to",
            "A reference wrapper that boxes the string on the heap",
          ],
          correctIndex: 0,
          explanation:
            "It is a real generic enum you can switch over, store, and nest. Kotlin's `String?` and Dart's `String?` are type-system nullability, which is why neither language has an equivalent of `String??`.",
        },
        {
          id: "swift-optionals-q2",
          prompt: "What does this print?\n\n```swift\nlet settings: [String: String?] = [\"theme\": nil]\nif let value = settings[\"theme\"] {\n    print(\"found: \\(value ?? \"nil inside\")\")\n} else {\n    print(\"missing key\")\n}\n```",
          options: ["`found: nil inside`", "`missing key`", "`found: nil`", "It does not compile"],
          correctIndex: 0,
          explanation:
            "The subscript returns `String??`. The key exists, so the outer optional is `.some`, and `if let` binds a `String?` that happens to be nil. A missing key would take the `else` branch — the two failures are genuinely different here.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-optionals-q3",
          prompt: "Why does `guard let` require its `else` block to exit the current scope?",
          options: [
            "Because the unwrapped binding stays in scope after the statement, so the failure path must not fall through",
            "Because `guard` is implemented as a `switch` and needs an exhaustive default",
            "Because otherwise the optional would be retained for the rest of the function",
            "It does not — `guard let` with an empty `else` is allowed since Swift 5.7",
          ],
          correctIndex: 0,
          explanation:
            "That is exactly what makes `guard let` useful: the binding lives on in the enclosing scope, which is only sound if the nil case never reaches the following code. `if let` scopes its binding to the branch, so it has no such rule.",
        },
        {
          id: "swift-optionals-q4",
          prompt: "What is the type of `result`?\n\n```swift\nstruct User { var nickname: String? }\nlet user: User? = User(nickname: \"ada\")\nlet result = user?.nickname\n```",
          options: ["`String?`", "`String??`", "`String`", "`Optional<User>`"],
          correctIndex: 0,
          explanation:
            "Optional chaining flattens: a chain of `?.` produces a single level of optionality no matter how many links it has. Writing `user?.nickname?.count` is still one `Int?`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-optionals-q5",
          prompt: "Which of these produce an optional result? (Select all that apply.)",
          options: [
            "`Int(\"42x\")`",
            "`array.first`",
            "`value as? Duck`",
            "`array[0]`",
            "`\"hello\".count`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Failable initialisers, `first`/`last` on a possibly empty collection, and conditional casts all model failure as nil. Array subscripting deliberately does not — an out-of-range index is a programmer error and traps.",
        },
        {
          id: "swift-optionals-q6",
          prompt: "What does this print?\n\n```swift\nlet names: [String?] = [\"ada\", nil, \"grace\"]\nfor case let name? in names {\n    print(name)\n}\n```",
          options: ["`ada` then `grace`", "`ada`, `nil`, `grace`", "`Optional(\"ada\")` then `Optional(\"grace\")`", "Nothing — the pattern never matches"],
          correctIndex: 0,
          explanation:
            "`case let name?` is the optional pattern: it matches only `.some` and binds the wrapped value, so nils are skipped. It is the pattern-matching equivalent of `compactMap`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-optionals-q7",
          prompt: "What does `try?` produce for a function declared `func load() throws -> Data?`?",
          options: [
            "`Data?` — since Swift 5, `try?` flattens rather than producing `Data??`",
            "`Data??` — one level for the throw, one for the declared return type",
            "`Data` — `try?` unwraps both levels and traps on nil",
            "`Result<Data?, Error>`",
          ],
          correctIndex: 0,
          explanation:
            "SE-0230 made `try?` flatten an already-optional result, because `Data??` was almost never what anyone wanted. The trade-off is that you can no longer distinguish 'threw' from 'returned nil' at the call site.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-optionals-q8",
          prompt: "When is `!` the right tool rather than a code smell?",
          options: [
            "When nil genuinely indicates a programming error you want to crash on, such as a missing bundled resource",
            "Whenever the surrounding code has already checked the value on a previous line",
            "In any performance-sensitive path, since optional unwrapping costs a branch",
            "Never — `!` is banned by the Swift API design guidelines",
          ],
          correctIndex: 0,
          explanation:
            "Force unwrapping is an assertion: 'this cannot be nil, and if it is, the build is broken.' Using it because a previous line checked is fragile — that check can move — and optional unwrapping is not a meaningful cost.",
        },
        {
          id: "swift-optionals-q9",
          prompt: "What is an implicitly unwrapped optional (`var view: UIView!`) at the type level?",
          options: [
            "Still an `Optional`, with a compiler hint that lets it be used without explicit unwrapping — and it traps if it is nil",
            "A non-optional value that the compiler initialises to a zero value",
            "A distinct type that can never be assigned nil after initialisation",
            "A `weak` reference with automatic unwrapping",
          ],
          correctIndex: 0,
          explanation:
            "It is `Optional` all the way down; you can still assign nil to it and still bind it with `if let`. It exists mainly for two-phase initialisation and Objective-C interop, and each use site is a hidden force unwrap.",
        },
        {
          id: "swift-optionals-q10",
          prompt: "What does this print?\n\n```swift\nvar note: String? = \"draft\"\nnote?.append(\"!\")\nprint(note ?? \"empty\")\nnote = nil\nnote?.append(\"?\")\nprint(note ?? \"empty\")\n```",
          options: ["`draft!` then `empty`", "`draft` then `empty`", "It crashes on the second `append`", "`draft!` then `draft!?`"],
          correctIndex: 0,
          explanation:
            "Optional chaining works for mutating methods on a `var`: the first call mutates in place. The second call short-circuits on nil and does nothing — chaining never traps, which is the whole difference from `!`.",
        },
      ],
    },
    {
      id: "swift-structs-classes",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Structs vs Classes: Value and Reference Semantics",
      summary:
        "This is the decision that shapes every other Swift design choice, and Apple's guidance is unusually blunt: reach for a struct first, and choose a class only when you need identity, inheritance, `deinit`, or Objective-C interop. A struct is copied on assignment, so two variables can never surprise each other; a class hands out a shared reference, so they always can. Everything downstream — why `mutating` exists, why `let` means different things for each, why SwiftUI views are structs — follows from that.\n\nThe standard library makes value semantics affordable with copy-on-write. `Array`, `Dictionary`, `Set` and `String` are structs wrapping a heap buffer; copying one copies a reference and retains it, and the buffer is only really duplicated when you write to a copy that is not uniquely referenced. You can build the same thing yourself with `isKnownUniquelyReferenced(&storage)`, which is how you keep value semantics for a type that holds a large payload.\n\nTwo things catch experienced people. First, value semantics are **shallow**: a struct holding a `var` of class type copies the reference, so mutating through one copy is visible through the other — the type looks like a value and behaves like a reference. Second, `let` on a struct freezes the whole value (you cannot even call a `mutating` method on it), while `let` on a class only freezes the pointer; `let box = Box(); box.count = 5` compiles happily. Get these two wrong and you ship a data race or a mysterious shared-state bug.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        {
          label: "Swift book: Structures and Classes",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/classesandstructures/",
          kind: "docs",
        },
        {
          label: "Apple: Choosing Between Structures and Classes",
          url: "https://developer.apple.com/documentation/swift/choosing-between-structures-and-classes",
          kind: "docs",
        },
        {
          label: "Hacking with Swift: Why does Swift have both classes and structs?",
          url: "https://www.hackingwithswift.com/quick-start/understanding-swift/why-does-swift-have-both-classes-and-structs",
          kind: "article",
        },
      ],
      video: {
        title: "WWDC25: Improve memory usage and performance with Swift | Apple",
        channel: "Apple Developer",
        url: "https://www.youtube.com/watch?v=LzBZjwEY9as",
        videoId: "LzBZjwEY9as",
        startSeconds: 497,
        chapterLabel: "Allocations",
        durationLabel: "31:31",
      },
      alternateVideos: [
        {
          title: "Swift - Class vs. Struct Explained",
          channel: "Sean Allen",
          url: "https://www.youtube.com/watch?v=LtlbB4-6k_U",
          videoId: "LtlbB4-6k_U",
          durationLabel: "7:27",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-structs-classes-q1",
          prompt: "What does this print?\n\n```swift\nclass Engine { var hp = 100 }\nstruct Car { var engine = Engine(); var name = \"A\" }\n\nvar first = Car()\nvar second = first\nsecond.engine.hp = 250\nsecond.name = \"B\"\nprint(first.engine.hp, first.name)\n```",
          options: ["`250 A`", "`100 A`", "`250 B`", "`100 B`"],
          correctIndex: 0,
          explanation:
            "Copying a struct copies its stored properties, and the stored property here is a *reference*. `name` is genuinely copied; `engine` is shared. A type with value semantics on the outside and reference semantics inside is the classic hybrid bug.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-structs-classes-q2",
          prompt: "Which of these compile? (Select all that apply.)\n\n```swift\nstruct SCounter { var n = 0; mutating func bump() { n += 1 } }\nclass CCounter { var n = 0; func bump() { n += 1 } }\n```",
          options: [
            "`let c = CCounter(); c.bump()`",
            "`let c = CCounter(); c.n = 5`",
            "`var s = SCounter(); s.bump()`",
            "`let s = SCounter(); s.bump()`",
            "`let s = SCounter(); s.n = 5`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`let` on a class fixes the reference, not the object, so its `var` properties stay mutable. `let` on a struct freezes the entire value, which bans both direct assignment and any `mutating` method.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-structs-classes-q3",
          prompt: "Why do struct methods that change stored properties need the `mutating` keyword?",
          options: [
            "Because `self` is a value passed to the method, and mutating it means writing back to the caller's storage — which is only legal for a `var`",
            "Because the compiler needs to insert a lock around the mutation",
            "Because structs are immutable by default and `mutating` makes a mutable copy",
            "Because `mutating` marks the method for dynamic dispatch",
          ],
          correctIndex: 0,
          explanation:
            "`mutating` makes `self` an `inout` parameter. A class method needs no such marker because it mutates the object behind a reference, not the caller's copy.",
        },
        {
          id: "swift-structs-classes-q4",
          prompt: "What does copy-on-write actually do in `Array`?",
          options: [
            "Assignment copies a reference to a shared buffer; a write checks whether the buffer is uniquely referenced and only then duplicates it",
            "Every assignment duplicates the buffer, but lazily on a background thread",
            "It copies the buffer immediately but shares the elements until they are read",
            "It stores the array on the stack until it grows past a threshold, then moves it to the heap",
          ],
          correctIndex: 0,
          explanation:
            "`isKnownUniquelyReferenced` on the buffer is the whole trick. It is why `let b = a` on a million-element array is O(1) and why the first `b.append` after that is O(n).",
        },
        {
          id: "swift-structs-classes-q5",
          prompt: "What does this print?\n\n```swift\nvar a = [1, 2, 3]\nvar b = a\nb.append(4)\na[0] = 99\nprint(a.count, b.count, b[0])\n```",
          options: ["`3 4 1`", "`4 4 99`", "`3 4 99`", "`4 3 1`"],
          correctIndex: 0,
          explanation:
            "`b.append` triggers the copy, so the two arrays have separate buffers from that point. Writing `a[0]` afterwards cannot be seen through `b`.",
        },
        {
          id: "swift-structs-classes-q6",
          prompt: "When is a class the right choice over a struct? (Select all that apply.)",
          options: [
            "The type models something with identity, where two instances with equal contents are still different things",
            "You need `deinit` to release a non-memory resource",
            "The type must be subclassed by, or bridged to, Objective-C",
            "The type is large, so copying it would be expensive",
            "The type needs to conform to several protocols",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Identity, deinitialisation and Objective-C interop are the real reasons. Size alone is not: copy-on-write handles large payloads while keeping value semantics, and protocol conformance works identically for both kinds.",
        },
        {
          id: "swift-structs-classes-q7",
          prompt: "What does `===` compare, and what happens if you use it on two structs?",
          options: [
            "It compares object identity and is only available for class and other reference types — it will not compile for structs",
            "It compares memory layout bit by bit and works for any type",
            "It is a stricter `==` that also checks the dynamic type",
            "It compares identity for classes and falls back to `==` for structs",
          ],
          correctIndex: 0,
          explanation:
            "`===` is declared on `AnyObject`. Structs have no identity to compare — two copies of the same value genuinely are the same thing as far as the language is concerned — so the question does not arise.",
        },
        {
          id: "swift-structs-classes-q8",
          prompt: "A struct holds ten `String` properties and is passed through a hot loop. What is the real cost of each copy?",
          options: [
            "Ten retains on the strings' storage buffers, plus copying the inline struct bytes",
            "A deep copy of all ten strings' character data",
            "One heap allocation for the struct plus one retain",
            "Nothing — struct copies are always free after optimisation",
          ],
          correctIndex: 0,
          explanation:
            "Each `String` is a struct around a refcounted buffer, so the copy is mostly atomic refcount traffic. This is why 'structs are cheap' is a half-truth: it depends entirely on how many references they contain.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-structs-classes-q9",
          prompt: "Why are SwiftUI `View` types structs rather than classes?",
          options: [
            "Views are short-lived descriptions that SwiftUI creates, compares and discards constantly; value semantics make that cheap and thread-safe",
            "Because SwiftUI needs to subclass them internally to add rendering behaviour",
            "Because classes cannot conform to protocols with associated types",
            "Because the rendering engine stores views directly in the layout tree and needs a stable pointer",
          ],
          correctIndex: 0,
          explanation:
            "A view value is a recipe, not the rendered object. Making them values means recreating one has no aliasing risk and no refcount churn — and it is why `@State` storage must live outside the struct.",
        },
        {
          id: "swift-structs-classes-q10",
          prompt: "Which statement about dispatch is correct?",
          options: [
            "Methods on a struct are statically dispatched; methods on a non-`final` class go through a vtable unless the optimiser can devirtualise them",
            "Both struct and class methods are always dynamically dispatched, for consistency with Objective-C",
            "Struct methods are dynamically dispatched when the struct conforms to a protocol, even through a concrete type",
            "`final` has no effect on dispatch in Swift; it is purely documentation",
          ],
          correctIndex: 0,
          explanation:
            "Structs cannot be subclassed, so the callee is always known. Marking a class `final` (or its members `private`) gives the compiler the same guarantee and removes the vtable lookup.",
        },
      ],
    },
    {
      id: "swift-enums-patterns",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Enums, Associated Values and Pattern Matching",
      summary:
        "Swift enums are sum types, not the integer constants the keyword suggests in C or Java. A case can carry an arbitrary payload — `case failure(Error)`, `case loaded(items: [Item], page: Int)` — which makes an enum the natural way to model a state machine where each state has different data. The nearest thing a React engineer will know is a TypeScript discriminated union, with the significant improvement that the compiler enforces exhaustiveness at every `switch` and will tell you about the case you forgot when you add one.\n\nPattern matching is a first-class part of the language rather than a feature of `switch`. Value-binding patterns, `where` clauses, tuple and range patterns, the optional pattern `case let x?`, the type pattern `case let e as NetworkError`, and the expression pattern driven by `~=` all work in `switch`, `if case`, `guard case`, `for case` and `catch`. Learning to read them is most of what makes idiomatic Swift look terse.\n\nTwo practical points. `CaseIterable` synthesises `allCases` only when no case has an associated value — the set is not enumerable otherwise. And exhaustiveness has a seam: for an enum from another module that can grow, you need `@unknown default`, which still warns you when a new case appears but keeps the code compiling against a newer library. Reaching for a plain `default` instead silences exactly the diagnostic you wanted.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        {
          label: "Swift book: Enumerations",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/enumerations/",
          kind: "docs",
        },
        {
          label: "Swift book: Patterns",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/patterns/",
          kind: "spec",
        },
        {
          label: "Hacking with Swift: Why associate a value with an enum case?",
          url: "https://www.hackingwithswift.com/quick-start/understanding-swift/why-would-you-want-to-associate-a-value-with-an-enum-case",
          kind: "article",
        },
      ],
      video: {
        title: "Mastering Switch Statements in Swift: Pattern Matching, Enums, and Real SwiftUI Examples",
        channel: "Stewart Lynch",
        url: "https://www.youtube.com/watch?v=84HoS9W2tpw",
        videoId: "84HoS9W2tpw",
        durationLabel: "37:22",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-enums-patterns-q1",
          prompt: "What does this print?\n\n```swift\nenum Planet: Int {\n    case mercury = 1, venus, earth, mars\n}\nprint(Planet.earth.rawValue, Planet(rawValue: 9) == nil)\n```",
          options: ["`3 true`", "`2 true`", "`3 false`", "It does not compile — only the first case has a raw value"],
          correctIndex: 0,
          explanation:
            "Integer raw values auto-increment from the last one given, so `earth` is 3. `init(rawValue:)` is failable precisely because an arbitrary integer need not name a case.",
        },
        {
          id: "swift-enums-patterns-q2",
          prompt: "Which of these can an enum case do? (Select all that apply.)",
          options: [
            "Carry associated values of different types per case",
            "Be recursive, if the enum is marked `indirect`",
            "Have a raw value, if every case's raw value is a literal of the same type",
            "Carry both a raw value and associated values on the same case",
            "Store a `var` property that changes per instance",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Raw values and associated values are mutually exclusive: a raw value is a fixed constant per case, an associated value is data carried per instance. Enums can have computed properties but no stored ones.",
        },
        {
          id: "swift-enums-patterns-q3",
          prompt: "What does this print?\n\n```swift\nenum Result2 { case ok(Int), fail(String) }\nlet r = Result2.ok(7)\nswitch r {\ncase .ok(let n) where n > 10: print(\"big\")\ncase .ok(let n): print(\"small \\(n)\")\ncase .fail(let m): print(m)\n}\n```",
          options: ["`small 7`", "`big`", "`7`", "It does not compile — two `.ok` cases"],
          correctIndex: 0,
          explanation:
            "`where` refines a pattern, and cases are tried top to bottom, so the guarded one is checked first and falls through to the general one. Duplicate case patterns with different guards are perfectly legal.",
        },
        {
          id: "swift-enums-patterns-q4",
          prompt: "Why does this fail to compile?\n\n```swift\nenum Token: CaseIterable {\n    case number(Int)\n    case plus\n}\n```",
          options: [
            "`CaseIterable` cannot be synthesised when a case has an associated value, because the set of values is not finite",
            "`CaseIterable` requires an explicit raw value type",
            "`CaseIterable` requires every case to be `Equatable`",
            "It compiles — `allCases` would contain `number(0)` and `plus`",
          ],
          correctIndex: 0,
          explanation:
            "`allCases` would have to enumerate every `Int`. You can conform manually and pick representative values, but the compiler will not guess them for you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-enums-patterns-q5",
          prompt: "You `switch` over an enum from a third-party framework that may gain cases in a future release. What should the last clause be?",
          options: [
            "`@unknown default:` — it compiles against future cases but still warns you that the switch is no longer exhaustive",
            "`default:` — it is the same thing with less ceremony",
            "Nothing; leave the switch exhaustive and let the compiler error when the library updates",
            "`case _:` — this is the documented spelling for non-frozen enums",
          ],
          correctIndex: 0,
          explanation:
            "`@unknown default` is the only form that keeps the diagnostic. A plain `default` silently swallows new cases, which is the exact class of bug the feature was added to surface.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-enums-patterns-q6",
          prompt: "What does this print?\n\n```swift\nlet point = (2, 0)\nswitch point {\ncase (let x, 0): print(\"on x axis at \\(x)\")\ncase (0, let y): print(\"on y axis at \\(y)\")\ncase let (x, y) where x == y: print(\"diagonal\")\ndefault: print(\"elsewhere\")\n}\n```",
          options: ["`on x axis at 2`", "`elsewhere`", "`diagonal`", "`on y axis at 0`"],
          correctIndex: 0,
          explanation:
            "Tuple patterns match component by component, mixing literals with bindings. The first clause matches because the second component is 0, and matching stops there — Swift `switch` has no fall-through unless you ask for it.",
        },
        {
          id: "swift-enums-patterns-q7",
          prompt: "How would you model 'loading, loaded with items, or failed with an error' in Swift?",
          options: [
            "An enum with three cases, two of which carry associated values, so impossible combinations cannot be represented",
            "A struct with `isLoading: Bool`, `items: [Item]` and `error: Error?`, checked in that order",
            "A class hierarchy with a base `State` class and three subclasses",
            "A dictionary keyed by a string state name",
          ],
          correctIndex: 0,
          explanation:
            "The enum makes 'loading *and* failed' unrepresentable and forces every consumer to handle all three. The boolean-plus-optionals struct allows eight states when only three are meaningful.",
        },
        {
          id: "swift-enums-patterns-q8",
          prompt: "What does this print?\n\n```swift\nenum Status { case active, archived(reason: String) }\nlet statuses: [Status] = [.active, .archived(reason: \"spam\"), .active]\nvar count = 0\nfor case .archived(let reason) in statuses {\n    print(reason)\n    count += 1\n}\nprint(count)\n```",
          options: ["`spam` then `1`", "`spam` then `3`", "`0`", "It does not compile — `for case` needs a `where` clause"],
          correctIndex: 0,
          explanation:
            "`for case` filters as it iterates, running the body only for elements that match the pattern. It is the loop form of the same pattern matching `switch` uses.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-enums-patterns-q9",
          prompt: "When does Swift synthesise `==` for an enum with associated values?",
          options: [
            "When you declare conformance to `Equatable` and every associated value type is itself `Equatable`",
            "Always — enums are compared by case and payload bit pattern",
            "Only for enums with a raw value type",
            "Never — you must write `==` by hand for any enum with a payload",
          ],
          correctIndex: 0,
          explanation:
            "Conformance synthesis is opt-in and conditional on the payloads. The same rule applies to `Hashable` and `Codable`.",
        },
        {
          id: "swift-enums-patterns-q10",
          prompt: "What does `~=` have to do with pattern matching?",
          options: [
            "It is the operator `switch` calls for expression patterns, so overloading it lets your own types be matched in a `case`",
            "It is the regular-expression match operator introduced in Swift 5.7",
            "It compares two values approximately, for floating-point `case` clauses",
            "It is how `where` clauses are desugared",
          ],
          correctIndex: 0,
          explanation:
            "`case 1...5:` works because `Range` defines `~=`. Defining it for your own type is how you make custom expression patterns; the regular-expression literals of Swift 5.7 are a separate feature.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "swift-errors",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Error Handling: `throws`, `try` and Typed Throws",
      summary:
        "Swift's error handling is deliberately not exceptions. A `throws` function returns through a second channel that the compiler tracks: callers must write `try`, and the call site is visibly a place control flow can leave. There is no stack unwinding across arbitrary frames and no catching of programmer errors — index out of range and force-unwrapping nil trap the process rather than throwing, because they are bugs, not conditions.\n\nUntil Swift 6 the thrown type was always erased to `any Error`, so `throws` told you *that* a function could fail but never *how*. **Typed throws** (SE-0413, Swift 6.0) added `func load() throws(LoadError)`, where plain `throws` is now shorthand for `throws(any Error)` and a non-throwing function is `throws(Never)`. It is genuinely useful for generic code that wants to propagate a caller's error type and for embedded Swift where existential boxing costs too much — but Apple's own guidance is to keep using untyped `throws` for most API, because a precise error type is a compatibility promise you have to keep forever.\n\nThe sugar matters more than it looks. `try?` converts a throw into nil and, since Swift 5, flattens an already-optional result rather than producing `T??` — which means it also erases the distinction between 'failed' and 'returned nil'. `try!` asserts. `defer` blocks run on every exit path including a throw, in reverse order of declaration, which is the idiomatic way to guarantee cleanup without a `finally`.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        {
          label: "Swift book: Error Handling",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/errorhandling/",
          kind: "docs",
        },
        {
          label: "Swift Evolution: SE-0413 Typed throws",
          url: "https://github.com/swiftlang/swift-evolution/blob/main/proposals/0413-typed-throws.md",
          kind: "spec",
        },
        { label: "Hacking with Swift: Typed throws", url: "https://www.hackingwithswift.com/swift/6.0/typed-throws", kind: "article" },
        {
          label: "Hacking with Swift: When should you use optional try?",
          url: "https://www.hackingwithswift.com/quick-start/understanding-swift/when-should-you-use-optional-try",
          kind: "article",
        },
      ],
      video: {
        title: "How to use Do, Try, Catch, and Throws in Swift | Swift Concurrency #1",
        channel: "Swiftful Thinking",
        url: "https://www.youtube.com/watch?v=ss50RX7F7nE",
        videoId: "ss50RX7F7nE",
        durationLabel: "26:34",
      },
      alternateVideos: [
        {
          title: "Handle Errors Like a PRO with Typed Throws | NEW Swift 6 Feature",
          channel: "AppStuff",
          url: "https://www.youtube.com/watch?v=N7a_hOqkhkY",
          videoId: "N7a_hOqkhkY",
          durationLabel: "12:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-errors-q1",
          prompt: "What does this print?\n\n```swift\nenum E: Error { case boom }\n\nfunc work() throws -> Int {\n    defer { print(\"cleanup\") }\n    print(\"start\")\n    throw E.boom\n}\n\ndo { _ = try work() } catch { print(\"caught\") }\n```",
          options: ["`start`, `cleanup`, `caught`", "`start`, `caught`, `cleanup`", "`start`, `caught`", "`cleanup`, `start`, `caught`"],
          correctIndex: 0,
          explanation:
            "A `defer` block runs on every exit from its scope, including a throw, and it runs before control leaves the function — so cleanup happens before the `catch` body.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-errors-q2",
          prompt: "What does this print?\n\n```swift\nfunc run() {\n    defer { print(1) }\n    defer { print(2) }\n    print(3)\n}\nrun()\n```",
          options: ["`3 2 1`", "`3 1 2`", "`1 2 3`", "`2 1 3`"],
          correctIndex: 0,
          explanation:
            "Deferred blocks run in reverse order of declaration, so the most recently registered cleanup runs first — the same discipline as unwinding a stack of acquired resources.",
        },
        {
          id: "swift-errors-q3",
          prompt: "Which of these trap (crash) rather than throw? (Select all that apply.)",
          options: [
            "`array[10]` on a three-element array",
            "Force unwrapping a nil optional",
            "An arithmetic overflow such as `Int.max + 1`",
            "`Data(contentsOf: url)` when the file is missing",
            "`JSONDecoder().decode(_:from:)` on malformed JSON",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Swift draws the line at programmer error: bad indices, broken assertions and overflow trap, because no caller could sensibly recover. Missing files and bad input are conditions, so they throw.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-errors-q4",
          prompt: "With typed throws, what is plain `throws` shorthand for, and what is a non-throwing function?",
          options: [
            "`throws(any Error)` and `throws(Never)` respectively",
            "`throws(Error)` and `throws(Void)` respectively",
            "`throws(NSError)` and an unannotated function with no throw channel at all",
            "Nothing — plain `throws` and typed throws are unrelated features",
          ],
          correctIndex: 0,
          explanation:
            "SE-0413 unified the three forms on one spelling, which is what lets `rethrows`-style generic code propagate a caller's concrete error type precisely.",
        },
        {
          id: "swift-errors-q5",
          prompt: "Why is `throws(MyError)` usually the wrong default for a public API?",
          options: [
            "The exact error type becomes part of the contract, so adding a new failure mode is a source-breaking change",
            "Typed throws are slower because the error must be boxed on every throw",
            "Typed throws cannot be caught with `do`/`catch`, only with `Result`",
            "Typed throws are unavailable outside embedded Swift",
          ],
          correctIndex: 0,
          explanation:
            "It is the checked-exceptions trade-off. Untyped `throws` keeps the freedom to add failure modes; typed throws is worth it for generic plumbing and constrained environments where existential boxing is too costly.",
        },
        {
          id: "swift-errors-q6",
          prompt: "What is the type of `value`?\n\n```swift\nfunc lookup() throws -> String? { nil }\nlet value = try? lookup()\n```",
          options: ["`String?`", "`String??`", "`String`", "`Result<String?, Error>`"],
          correctIndex: 0,
          explanation:
            "Since Swift 5 (SE-0230) `try?` flattens rather than adding a second optional layer. Convenient, but it means you can no longer tell a thrown error from a legitimate nil at the call site.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-errors-q7",
          prompt: "What does `rethrows` mean on a function like `map`?",
          options: [
            "The function only throws if the closure the caller passed throws, so calling it with a non-throwing closure needs no `try`",
            "The function catches any error and rethrows it wrapped in a standard error type",
            "The function retries the operation once before throwing",
            "It is a deprecated spelling of `throws` kept for Objective-C interop",
          ],
          correctIndex: 0,
          explanation:
            "`rethrows` makes the throwing-ness conditional on the argument, which is why `[1,2].map { $0 * 2 }` needs no `try` while `try items.map(parse)` does.",
        },
        {
          id: "swift-errors-q8",
          prompt: "Which of these is a correct way to catch only one specific case?",
          options: [
            "`catch LoadError.notFound { … }`",
            "`catch is LoadError.notFound { … }`",
            "`catch error == .notFound { … }`",
            "`catch (LoadError.notFound) as e { … }`",
          ],
          correctIndex: 0,
          explanation:
            "`catch` takes a pattern, so an enum case pattern works directly; `catch let e as LoadError` matches by type. The other forms are not patterns.",
        },
        {
          id: "swift-errors-q9",
          prompt: "What happens to an error thrown inside a `Task { }` closure that nothing awaits?",
          options: [
            "It is stored in the task's result and silently discarded unless someone awaits `task.value`",
            "It crashes the process, like an uncaught exception",
            "It propagates to the enclosing function's `catch` block",
            "It is forwarded to the task's parent, which logs it automatically",
          ],
          correctIndex: 0,
          explanation:
            "An unstructured task's failure is only observable through its `value` or `result`. Fire-and-forget tasks swallowing errors is one of the most common sources of silently broken async code.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-errors-q10",
          prompt: "When is `Result<Success, Failure>` a better fit than `throws`?",
          options: [
            "When the outcome has to be stored, passed around or compared as a value rather than handled immediately at the call site",
            "Whenever the error type is known at compile time, since `throws` cannot express that",
            "In any asynchronous code, because `throws` does not work with `await`",
            "Never — `Result` was deprecated when typed throws arrived",
          ],
          correctIndex: 0,
          explanation:
            "`Result` is a value you can put in an array or a `@State` property; `throws` is control flow you must deal with now. Typed throws narrowed the gap but did not remove the storage use case.",
        },
      ],
    },
    {
      id: "swift-protocols",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Protocols and Protocol-Oriented Design",
      summary:
        "Protocols are Swift's answer to the problem that inheritance solves badly: sharing behaviour without a base class. A protocol declares requirements — properties, methods, initialisers, subscripts, associated types — and a protocol *extension* can supply default implementations, so a struct or enum gets shared behaviour without a superclass and without reference semantics. That combination is what 'protocol-oriented programming' actually names, and it is why most Swift codebases have very shallow class hierarchies.\n\nThe subtlety is how a call is dispatched. Members declared in the protocol body are requirements and go through the witness table, so a conforming type's own implementation always wins. Members that exist *only* in an extension are statically dispatched on the static type: call one through a variable of type `any Greeter` and you get the extension's version, even if the concrete type defines its own. It compiles, it looks polymorphic, and it isn't — this is the single most-asked Swift interview gotcha.\n\nThe second thing to internalise is the cost of `any`. An existential boxes the value and dispatches dynamically; `some` keeps one concrete type and lets the optimiser specialise. Protocols with `associatedtype` or `Self` requirements could not be used as existentials at all before Swift 5.7, and even now `any Collection` is far more limited than a generic parameter. Reach for a generic constraint first, and for `any` only when you genuinely need a heterogeneous collection.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        {
          label: "Swift book: Protocols",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/protocols/",
          kind: "docs",
        },
        {
          label: "Swift book: Extensions",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/extensions/",
          kind: "docs",
        },
        {
          label: "Hacking with Swift: How is protocol-oriented programming different from OOP?",
          url: "https://www.hackingwithswift.com/quick-start/understanding-swift/how-is-protocol-oriented-programming-different-from-object-oriented-programming",
          kind: "article",
        },
      ],
      video: {
        title: "How to use Protocols in Swift | Advanced Learning #15",
        channel: "Swiftful Thinking",
        url: "https://www.youtube.com/watch?v=0gM1wmW1Xvc",
        videoId: "0gM1wmW1Xvc",
        durationLabel: "28:37",
      },
      alternateVideos: [
        {
          title: "WWDC22: Design protocol interfaces in Swift | Apple",
          channel: "Apple Developer",
          url: "https://www.youtube.com/watch?v=5jkTI3Ojmqg",
          videoId: "5jkTI3Ojmqg",
          durationLabel: "25:31",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-protocols-q1",
          prompt: "What does this print?\n\n```swift\nprotocol Greeter { func hello() }\nextension Greeter {\n    func hello() { print(\"protocol hello\") }\n    func bye()   { print(\"protocol bye\") }\n}\nstruct Host: Greeter {\n    func hello() { print(\"host hello\") }\n    func bye()   { print(\"host bye\") }\n}\nlet g: any Greeter = Host()\ng.hello()\ng.bye()\n```",
          options: [
            "`host hello` then `protocol bye`",
            "`host hello` then `host bye`",
            "`protocol hello` then `protocol bye`",
            "`protocol hello` then `host bye`",
          ],
          correctIndex: 0,
          explanation:
            "`hello()` is a protocol requirement, so it goes through the witness table and finds `Host`'s version. `bye()` exists only in the extension, so it is dispatched statically on the declared type `any Greeter` — `Host.bye` is never consulted.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-protocols-q2",
          prompt: "What is the difference between `some P` and `any P` as a function parameter type?",
          options: [
            "`some P` is sugar for a generic parameter — one concrete type per call, specialisable; `any P` is an existential box that can hold different types and dispatches dynamically",
            "`some P` can only be used for return types; `any P` only for parameters",
            "They are identical in behaviour; `any` is the newer spelling",
            "`some P` requires the protocol to have associated types; `any P` forbids them",
          ],
          correctIndex: 0,
          explanation:
            "`func draw(_ s: some Shape)` is `func draw<T: Shape>(_ s: T)`. `any Shape` erases the type, costs a box and a dynamic dispatch, and is what you need when a single array must hold several conforming types.",
        },
        {
          id: "swift-protocols-q3",
          prompt: "Which of these are legal protocol requirements? (Select all that apply.)",
          options: [
            "`var title: String { get }`",
            "`init(id: String)`",
            "`associatedtype Element`",
            "`var count = 0`",
            "`func draw() { print(\"default\") }`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A protocol declares requirements, not storage or bodies: property requirements state `{ get }`/`{ get set }`, initialisers and associated types are allowed. Default bodies belong in a protocol extension.",
        },
        {
          id: "swift-protocols-q4",
          prompt: "Before Swift 5.7, why could a protocol with an `associatedtype` not be used as a plain existential (`let x: Collection`)?",
          options: [
            "The associated type is not known at the use site, so the compiler cannot type the members that mention it",
            "Associated types are only resolved by the Objective-C runtime, which existentials bypass",
            "Existentials require a fixed memory layout, which associated types make impossible",
            "It was an arbitrary restriction with no technical reason, removed once `any` was introduced",
          ],
          correctIndex: 0,
          explanation:
            "`any Collection` still cannot let you call a method whose signature mentions `Element` without opening the existential. Primary associated types (`any Collection<Int>`) pin the type down enough to make many of those uses work.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-protocols-q5",
          prompt: "What does a protocol inheriting from `AnyObject` mean?",
          options: [
            "Only class types can conform, which is what makes `weak` references to it possible",
            "Any type can conform, including structs, but conformance is boxed",
            "The protocol is bridged to Objective-C automatically",
            "Conforming types get reference semantics even if they are structs",
          ],
          correctIndex: 0,
          explanation:
            "A class-bound protocol is required for `weak var delegate: SomeDelegate?`, because `weak` only applies to reference types. It is the standard shape for the delegate pattern.",
        },
        {
          id: "swift-protocols-q6",
          prompt: "What is conditional conformance?",
          options: [
            "Conforming a generic type to a protocol only when its type parameters satisfy a constraint, e.g. `extension Array: Drawable where Element: Drawable`",
            "Conforming at runtime based on a feature flag",
            "Declaring a conformance that the compiler may drop if it is unused",
            "Conforming a type to a protocol it does not fully implement, with the missing members trapping",
          ],
          correctIndex: 0,
          explanation:
            "It is how `Array` is `Equatable` only when its elements are, and it composes: conditional conformances feed each other so `[[Int]]` is `Equatable` too.",
        },
        {
          id: "swift-protocols-q7",
          prompt: "Why does adding a conformance for a type you don't own to a protocol you don't own warn in Swift 6?",
          options: [
            "Either module could add the same conformance later, and two conformances for one type/protocol pair is undefined behaviour — `@retroactive` acknowledges the risk",
            "Retroactive conformance is forbidden entirely in Swift 6",
            "It forces whole-module optimisation off for the whole target",
            "The conformance would only apply within the file that declares it",
          ],
          correctIndex: 0,
          explanation:
            "The runtime cannot arbitrate duplicate conformance records, so the library evolution story is to either own one side or write `extension Foo: @retroactive Bar` to say you accept the hazard.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-protocols-q8",
          prompt: "Why does a protocol method that mutates a conforming struct need to be declared `mutating` in the protocol?",
          options: [
            "Requirements are declared once for all conforming types, and a struct cannot satisfy a non-`mutating` requirement with a mutating implementation",
            "Because protocol dispatch cannot pass `inout` parameters otherwise",
            "It does not — `mutating` is inferred from the conforming type",
            "Because class conformances also require `mutating` for symmetry",
          ],
          correctIndex: 0,
          explanation:
            "Classes can ignore the marker, but value types cannot add it, so the requirement must permit mutation up front. Leaving it off is a common mistake when a protocol is written class-first.",
        },
        {
          id: "swift-protocols-q9",
          prompt: "You need an array holding several different shape types and you will call `area()` on each. What is the right tool?",
          options: [
            "`[any Shape]` — a heterogeneous collection genuinely needs existentials",
            "`[some Shape]` — it avoids the boxing cost",
            "A generic `Array<T: Shape>` with `T` chosen per element",
            "A class hierarchy with `Shape` as an abstract base class",
          ],
          correctIndex: 0,
          explanation:
            "`some Shape` would mean every element is the *same* concrete type, which defeats the purpose. This is exactly the case existentials exist for, and the boxing is the price of the heterogeneity.",
        },
        {
          id: "swift-protocols-q10",
          prompt: "What is the practical fix for the static-dispatch surprise in protocol extensions?",
          options: [
            "Declare the member as a requirement in the protocol body as well as giving it a default in the extension",
            "Mark the extension method `final`",
            "Mark the extension method `dynamic`",
            "Use a class instead of a struct for the conforming type",
          ],
          correctIndex: 0,
          explanation:
            "Once the member is a requirement it enters the witness table and the conforming type's override is honoured. The extension keeps serving as the default for types that do not implement it.",
        },
      ],
    },
    {
      id: "swift-generics-opaque",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Generics, Constraints and Opaque Types (`some`)",
      summary:
        "Generics in Swift are not erased. A generic function is specialised per concrete type where the optimiser can see both sides, so `max<T: Comparable>` on `Int` compiles down to an integer comparison with no boxing and no dynamic dispatch. That is the fundamental difference from Java's erased generics and from TypeScript's, which vanish entirely at runtime. Constraints (`where Element: Equatable`, `where C.Element == String`) are how you tell the compiler what a type parameter can do, and the error messages are checked at the definition, not at each instantiation as in C++ templates.\n\nOpaque types are the mirror image. `-> some View` says: I return exactly one concrete type, the compiler knows which, you do not. The caller keeps full type identity — two values of the same opaque type are known to have the same type, so they can be compared or stored together — while the implementation stays free to change. That is what makes SwiftUI's `body` possible without spelling out `VStack<TupleView<(Text, Button<Text>)>>`.\n\nThe rule that bites is that `some` is *one* type, decided at compile time. Returning a `Circle` from one branch and a `Square` from another does not compile, which is exactly why SwiftUI's `@ViewBuilder` wraps `if`/`else` into `_ConditionalContent<A, B>` — a single type covering both branches. The escape hatch, `AnyView`, erases the type and with it much of SwiftUI's ability to diff efficiently, so it should be a last resort rather than a habit.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        {
          label: "Swift book: Generics",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/generics/",
          kind: "docs",
        },
        {
          label: "Swift book: Opaque and Boxed Protocol Types",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/opaquetypes/",
          kind: "docs",
        },
        {
          label: "Swift Evolution: SE-0244 Opaque Result Types",
          url: "https://github.com/swiftlang/swift-evolution/blob/main/proposals/0244-opaque-result-types.md",
          kind: "spec",
        },
        {
          label: "Hacking with Swift: Why does SwiftUI use \"some View\"?",
          url: "https://www.hackingwithswift.com/books/ios-swiftui/why-does-swiftui-use-some-view-for-its-view-type",
          kind: "article",
        },
      ],
      video: {
        title: "WWDC22: Embrace Swift generics | Apple",
        channel: "Apple Developer",
        url: "https://www.youtube.com/watch?v=AvRirfTKR9g",
        videoId: "AvRirfTKR9g",
        durationLabel: "27:29",
      },
      alternateVideos: [
        {
          title: "How to use Generics in Swift | Advanced Learning #8",
          channel: "Swiftful Thinking",
          url: "https://www.youtube.com/watch?v=rx3uRICZr5I",
          videoId: "rx3uRICZr5I",
          durationLabel: "19:24",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-generics-opaque-q1",
          prompt: "Why does this fail to compile?\n\n```swift\nprotocol Shape { func area() -> Double }\nstruct Circle: Shape { func area() -> Double { 3.14 } }\nstruct Square: Shape { func area() -> Double { 1 } }\n\nfunc make(round: Bool) -> some Shape {\n    if round { return Circle() } else { return Square() }\n}\n```",
          options: [
            "`some Shape` must resolve to a single concrete type, and the two branches return different ones",
            "`Shape` needs an `associatedtype` before it can be used with `some`",
            "Opaque return types cannot be used with a `Bool` parameter",
            "`some` is only allowed on computed properties, not functions",
          ],
          correctIndex: 0,
          explanation:
            "The compiler must pick one underlying type. Changing the return type to `any Shape` compiles, at the cost of boxing and losing type identity.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-generics-opaque-q2",
          prompt: "How does SwiftUI make `if`/`else` work inside a `body` that returns `some View`?",
          options: [
            "`@ViewBuilder` rewrites the branches into a single `_ConditionalContent<TrueBody, FalseBody>` type",
            "SwiftUI wraps each branch in `AnyView` automatically",
            "`some View` is special-cased by the compiler to allow multiple return types",
            "The branches are evaluated eagerly and merged into a `Group`",
          ],
          correctIndex: 0,
          explanation:
            "The result builder's `buildEither` produces one static type that covers both branches — which is also why switching branches changes a view's structural identity and triggers a transition rather than an animation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-generics-opaque-q3",
          prompt: "Which are true of Swift generics compared with Java's? (Select all that apply.)",
          options: [
            "Swift can specialise a generic function into a version dedicated to one concrete type",
            "A Swift generic parameter can be a value type without boxing",
            "Swift checks the generic definition against its constraints, so errors surface at the definition rather than only at instantiation",
            "Swift generic parameters are erased at runtime, like Java's",
            "Swift requires a wrapper type for primitives, as Java requires `Integer` for `int`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Swift keeps type information at runtime (via metadata) and can specialise. It has no primitive/object split, so `Array<Int>` really stores `Int`s inline.",
        },
        {
          id: "swift-generics-opaque-q4",
          prompt: "What does `func longest<C: Collection>(_ items: C) -> C.Element? where C.Element: Comparable` express?",
          options: [
            "Any collection whose elements are comparable, returning an optional element of that same collection's element type",
            "Only arrays whose elements conform to `Comparable`",
            "A collection of `Comparable` existentials, boxed",
            "A function that requires the caller to specify `C` explicitly at the call site",
          ],
          correctIndex: 0,
          explanation:
            "The `where` clause constrains an associated type of the parameter, and the return type is expressed in terms of it. Type inference picks `C` from the argument — you never write it at the call site.",
        },
        {
          id: "swift-generics-opaque-q5",
          prompt: "What is the difference in type identity between `some Equatable` and `any Equatable`?",
          options: [
            "Two values of the same `some Equatable` are known to have the same underlying type and can be compared; two `any Equatable` values cannot be compared with `==`",
            "There is no difference in type identity, only in memory layout",
            "`any Equatable` preserves the concrete type while `some Equatable` erases it",
            "Both preserve type identity; `some` only affects documentation",
          ],
          correctIndex: 0,
          explanation:
            "`==` on `Equatable` has a `Self` requirement, so the compiler must know both sides are the same type. An existential does not carry that guarantee, which is why `any Equatable == any Equatable` is rejected.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-generics-opaque-q6",
          prompt: "What does `some` mean in a *parameter* position, as in `func render(_ view: some View)`?",
          options: [
            "It is shorthand for an unnamed generic parameter: `func render<V: View>(_ view: V)`",
            "It means the parameter is an opaque existential box",
            "It means the parameter type is inferred at runtime",
            "It is only legal on the last parameter of a function",
          ],
          correctIndex: 0,
          explanation:
            "Swift 5.7 added this spelling so you can write a generic function without inventing a type-parameter name you never use. The semantics are exactly a generic parameter, including specialisation.",
        },
        {
          id: "swift-generics-opaque-q7",
          prompt: "What is the cost of sprinkling `AnyView` through a SwiftUI hierarchy?",
          options: [
            "SwiftUI loses the static type structure it uses to diff, so it cannot tell whether the wrapped view changed type and updates more aggressively",
            "Each `AnyView` allocates a new window-server surface",
            "`AnyView` disables animations entirely on its subtree",
            "There is no cost; `AnyView` is optimised away in release builds",
          ],
          correctIndex: 0,
          explanation:
            "The generic type of a view tree is what SwiftUI compares. Erasing it hides structure, so use `@ViewBuilder`, `Group` or a generic parameter first and keep `AnyView` for genuinely dynamic cases.",
        },
        {
          id: "swift-generics-opaque-q8",
          prompt: "What do primary associated types add, as in `any Collection<String>`?",
          options: [
            "They let you constrain an associated type on an existential or opaque type without a full `where` clause",
            "They make the protocol usable as a generic constraint for the first time",
            "They allow a protocol to have more than one associated type",
            "They make existentials as fast as generics by removing the box",
          ],
          correctIndex: 0,
          explanation:
            "Declaring `protocol Collection<Element>` lets callers write `any Collection<String>` and `some Collection<String>`. The box is still there for `any`; what changes is how much you can express about it.",
        },
        {
          id: "swift-generics-opaque-q9",
          prompt: "What does this print?\n\n```swift\nfunc describe<T>(_ value: T) -> String { \"generic\" }\nfunc describe(_ value: Int) -> String { \"int\" }\nprint(describe(5))\n```",
          options: ["`int`", "`generic`", "It is ambiguous and does not compile", "`int` in debug builds and `generic` in release builds"],
          correctIndex: 0,
          explanation:
            "Overload resolution prefers the more specialised, non-generic candidate. This is static resolution, so calling it through a variable typed as a generic parameter would pick the generic version instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-generics-opaque-q10",
          prompt: "You are designing an API that returns a sequence of results. What does returning `some Sequence<Item>` buy you over returning `[Item]`?",
          options: [
            "You can change the concrete implementation — a lazy view, a custom sequence — without breaking callers, while they still get static dispatch",
            "It guarantees the sequence is computed lazily",
            "It allows callers to mutate the sequence in place",
            "It removes the need for callers to import your module's types",
          ],
          correctIndex: 0,
          explanation:
            "The opaque return type is an abstraction boundary with no runtime cost. Whether it is lazy is up to your implementation — `some Sequence` says nothing about evaluation strategy.",
        },
      ],
    },
    {
      id: "swift-closures-capture",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Closures, Escaping Closures and Capture Lists",
      summary:
        "Closures are reference types that capture their environment, and the default is capture *by reference*: the closure shares the variable with the enclosing scope, so a value read inside it reflects later mutations. A capture list, `{ [value] in … }`, changes that to capture-by-value at the moment the closure is created. Writing `[weak self]` is the same mechanism — capture `self` without a strong reference — rather than a special memory keyword.\n\n`@escaping` marks a closure that outlives the call: stored in a property, put on a queue, handed to a network client. Non-escaping is the default precisely because a closure that cannot outlive the call cannot create a cycle, which is why `[weak self]` inside `map` or `forEach` is noise. The retain cycle that does matter has a simple shape: an object stores a closure, and the closure strongly captures that object. Neither refcount ever reaches zero, ARC cannot break it, and nothing crashes — the memory just never comes back.\n\nThe fix is a capture list, and choosing between `weak` and `unowned` is a claim about lifetimes. `[weak self]` makes `self` optional inside, and `guard let self else { return }` unwraps it once for the rest of the closure — Swift 5.8 then lets you drop the `self.` prefix on every member access after that unwrapping. `[unowned self]` keeps it non-optional and traps if the object is gone, which is right only when self is guaranteed to outlive the closure. The gotcha that separates people is that a one-shot closure like `DispatchQueue.main.async { self.refresh() }` is *not* a cycle: it holds self briefly and is then released, so `[weak self]` there is about cancelling stale work, not about leaks.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        {
          label: "Swift book: Closures",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/closures/",
          kind: "docs",
        },
        {
          label: "Swift book: Automatic Reference Counting — strong reference cycles for closures",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/automaticreferencecounting/#Strong-Reference-Cycles-for-Closures",
          kind: "docs",
        },
        {
          label: "Swift by Sundell: Swift's closure capturing mechanics",
          url: "https://www.swiftbysundell.com/articles/swifts-closure-capturing-mechanics/",
          kind: "article",
        },
        {
          label: "Hacking with Swift: Capture lists — weak, strong and unowned",
          url: "https://www.hackingwithswift.com/articles/179/capture-lists-in-swift-whats-the-difference-between-weak-strong-and-unowned-references",
          kind: "article",
        },
      ],
      video: {
        title: "Swift Closures Explained",
        channel: "Sean Allen",
        url: "https://www.youtube.com/watch?v=ND44vQ5iJyc",
        videoId: "ND44vQ5iJyc",
        durationLabel: "14:23",
      },
      alternateVideos: [
        {
          title: "Swift Closures: @escaping Explained",
          channel: "Sean Allen",
          url: "https://www.youtube.com/watch?v=xiS5gJOIQxI",
          videoId: "xiS5gJOIQxI",
          durationLabel: "4:44",
        },
        {
          title: "How to use weak self in Swift | Continued Learning #18",
          channel: "Swiftful Thinking",
          url: "https://www.youtube.com/watch?v=TPHp9kR0Go8",
          videoId: "TPHp9kR0Go8",
          durationLabel: "20:33",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-closures-capture-q1",
          prompt: "What does this print?\n\n```swift\nvar value = 1\nlet byList = { [value] in print(\"list \\(value)\") }\nlet byRef  = { print(\"ref \\(value)\") }\nvalue = 99\nbyList()\nbyRef()\n```",
          options: ["`list 1` then `ref 99`", "`list 99` then `ref 99`", "`list 1` then `ref 1`", "`list 99` then `ref 1`"],
          correctIndex: 0,
          explanation:
            "A capture list copies the value when the closure is created; the default capture shares the variable, so the second closure sees the later assignment. This is the whole mechanism behind `[weak self]`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-closures-capture-q2",
          prompt: "What does this print?\n\n```swift\nvar count = 0\nlet bump = { count += 1 }\nbump()\nbump()\nprint(count)\n```",
          options: ["`2`", "`0`", "`1`", "It does not compile — closures cannot mutate captured variables"],
          correctIndex: 0,
          explanation:
            "Capturing by reference means the closure and the enclosing scope share one variable, so mutations through the closure are visible outside it. Adding `[count]` would capture a copy and the mutation would not compile.",
        },
        {
          id: "swift-closures-capture-q3",
          prompt: "Which of these create a retain cycle? (Select all that apply.)",
          options: [
            "A class stores `var onDone: (() -> Void)?` and assigns `{ self.finish() }` to it",
            "A class holds a `Timer` whose repeating block calls `self.tick()`",
            "A view model stores a `Task` whose closure calls `self.load()` and never finishes",
            "`items.map { self.transform($0) }` inside a method",
            "`DispatchQueue.main.async { self.refresh() }`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A cycle needs the object to hold the closure *and* the closure to hold the object. `map` is non-escaping, so it cannot outlive the call; the `async` block holds `self` only until it runs and is then released.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-closures-capture-q4",
          prompt: "What does `@escaping` actually tell the compiler?",
          options: [
            "The closure may be stored and called after the function returns, so captured values must be kept alive and `self` must be written explicitly",
            "The closure runs on a background thread",
            "The closure is heap-allocated rather than stack-allocated, which non-escaping closures never are",
            "The closure may throw out of the enclosing function",
          ],
          correctIndex: 0,
          explanation:
            "Lifetime, not threading. Non-escaping is the default so the compiler can assume the closure dies with the call — which also rules out retain cycles and permits stack allocation in many cases.",
        },
        {
          id: "swift-closures-capture-q5",
          prompt: "When is `[unowned self]` the correct choice over `[weak self]`?",
          options: [
            "When `self` is guaranteed to outlive the closure, so an optional check would only add noise — and a crash on violation is acceptable",
            "Whenever the closure is escaping, since `weak` does not work for escaping closures",
            "Whenever you want the closure to keep `self` alive without a strong reference",
            "In SwiftUI views, because struct views cannot be referenced weakly",
          ],
          correctIndex: 0,
          explanation:
            "`unowned` skips the side-table bookkeeping and the optional, but it is an assertion about lifetime. If you are not certain, `weak` is the safe default — the cost is one optional check.",
        },
        {
          id: "swift-closures-capture-q6",
          prompt: "What does this print?\n\n```swift\nclass Store {\n    var items: [Int] = [1, 2, 3]\n    lazy var total: () -> Int = { self.items.reduce(0, +) }\n    deinit { print(\"deinit\") }\n}\nvar store: Store? = Store()\n_ = store?.total()\nstore = nil\nprint(\"end\")\n```",
          options: ["`end`", "`deinit` then `end`", "`end` then `deinit`", "It crashes when `store` is set to nil"],
          correctIndex: 0,
          explanation:
            "The lazy stored closure is held by the instance and strongly captures `self` — a textbook cycle, so `deinit` never runs. `lazy var total: () -> Int = { [unowned self] in … }` breaks it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-closures-capture-q7",
          prompt: "What is the type of `self` inside `{ [weak self] in … }`, and what is the idiomatic way to use it?",
          options: [
            "`Self?` — `guard let self else { return }` unwraps it once for the rest of the closure",
            "`Self` — `weak` only affects the reference count, not the type",
            "`Unmanaged<Self>` — you call `takeUnretainedValue()` on it",
            "`Any?` — you cast it back to the concrete type",
          ],
          correctIndex: 0,
          explanation:
            "Weak references are optional by construction, so the closure has to unwrap before it can do anything. Swift 5.8 (SE-0365) additionally lets you write members without the `self.` prefix once `self` has been unwrapped.",
        },
        {
          id: "swift-closures-capture-q8",
          prompt: "What does `@autoclosure` do?",
          options: [
            "Wraps the argument expression in a closure automatically, so it is only evaluated if the callee calls it",
            "Automatically adds `[weak self]` to any closure argument",
            "Marks a closure that runs automatically when the enclosing scope exits",
            "Converts a synchronous closure into an async one",
          ],
          correctIndex: 0,
          explanation:
            "It is how `assert(condition, message)` avoids building the message string in release builds and how `??` avoids evaluating its right side when the left is non-nil. Overuse hides evaluation order from the reader.",
        },
        {
          id: "swift-closures-capture-q9",
          prompt: "A view model does `URLSession.shared.dataTask(with: url) { data, _, _ in self.items = decode(data) }`. Why should this be `[weak self]`?",
          options: [
            "Not to avoid a leak but to avoid keeping a dismissed screen's model alive and writing state for a screen nobody is looking at",
            "Because the closure and the view model reference each other, so it is a true retain cycle",
            "Because `@escaping` closures always require a capture list to compile",
            "Because `URLSession` retains its completion handlers permanently",
          ],
          correctIndex: 0,
          explanation:
            "`URLSession` releases the handler once the task completes, so the strong capture is temporary, not a cycle. The reason to weaken it is lifecycle: it lets a cancelled screen deallocate instead of finishing work nobody needs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-closures-capture-q10",
          prompt: "Why can a closure that captures an `inout` parameter not escape?",
          options: [
            "`inout` is a temporary window onto the caller's storage that ends when the function returns, so a stored closure would outlive it",
            "`inout` parameters are always value types and cannot be captured at all",
            "Escaping closures run on a different thread, and `inout` is not thread-safe",
            "It can escape, as long as the capture list copies the value",
          ],
          correctIndex: 0,
          explanation:
            "The compiler rejects it outright. If you need the value later, capture a copy explicitly with a capture list — which is precisely the writeback semantics `inout` cannot promise past the call.",
        },
      ],
    },
    {
      id: "swift-property-wrappers",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Property Wrappers",
      summary:
        "A property wrapper factors out the *access pattern* of a property — clamping, persistence, thread confinement, change notification — so it can be reused by annotation instead of copy-pasted accessors. You write a type marked `@propertyWrapper` with a `wrappedValue` property; the compiler then rewrites `@Clamped(0...10) var level = 5` into a private stored property `_level` of the wrapper type plus a computed `level` that forwards through it. Nothing magical happens at runtime: it is a mechanical source transformation.\n\nThe second half of the feature is `projectedValue`, exposed as `$name`. That is where SwiftUI's syntax comes from — `@State var count` gives you `count` (the `Int`) and `$count` (a `Binding<Int>`), and a `TextField($text)` is just passing the projection. Understanding that `$` is an ordinary property and not language magic makes SwiftUI's data flow far less mysterious.\n\nTwo practical notes. Wrappers can be applied to stored instance properties, local variables and function parameters, but not to computed properties, and not inside a protocol — a protocol can only require the plain property. And be careful not to confuse mechanisms: `@Observable` is a **macro**, which generates code for an entire class, while `@State` and `@Binding` are property wrappers. SwiftUI's wrappers also depend on being installed in a live view hierarchy, which is why `@State` read from an `init` or from a plain unit test gives you the default rather than the current value.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        {
          label: "Swift book: Properties — Property Wrappers",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/properties/",
          kind: "docs",
        },
        {
          label: "Swift Evolution: SE-0258 Property Wrappers",
          url: "https://github.com/swiftlang/swift-evolution/blob/main/proposals/0258-property-wrappers.md",
          kind: "spec",
        },
        {
          label: "Swift by Sundell: Property wrappers in Swift",
          url: "https://www.swiftbysundell.com/articles/property-wrappers-in-swift/",
          kind: "article",
        },
        {
          label: "Hacking with Swift: Understanding property wrappers in Swift and SwiftUI",
          url: "https://www.hackingwithswift.com/quick-start/swiftui/understanding-property-wrappers-in-swift-and-swiftui",
          kind: "article",
        },
      ],
      video: {
        title: "Why property Wrappers are so important in Swift?",
        channel: "Swift and Tips",
        url: "https://www.youtube.com/watch?v=cCOHJkd3kBE",
        videoId: "cCOHJkd3kBE",
        durationLabel: "17:47",
      },
      alternateVideos: [
        {
          title: "How to create custom Property Wrappers in SwiftUI (PART 1/2) | Advanced Learning #30",
          channel: "Swiftful Thinking",
          url: "https://www.youtube.com/watch?v=2wzq6SQkSJE",
          videoId: "2wzq6SQkSJE",
          durationLabel: "51:33",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-property-wrappers-q1",
          prompt: "What does this print?\n\n```swift\n@propertyWrapper struct Clamped {\n    private var storage = 0\n    let range: ClosedRange<Int>\n    var wrappedValue: Int {\n        get { storage }\n        set { storage = min(max(newValue, range.lowerBound), range.upperBound) }\n    }\n    init(wrappedValue: Int, _ range: ClosedRange<Int>) {\n        self.range = range\n        self.wrappedValue = wrappedValue\n    }\n}\n\nstruct Volume { @Clamped(0...10) var level = 15 }\nprint(Volume().level)\n```",
          options: ["`10`", "`15`", "`0`", "It does not compile — the initial value is outside the range"],
          correctIndex: 0,
          explanation:
            "`= 15` is passed to `init(wrappedValue:_:)`, which assigns through the setter and clamps it. Note that the clamp happens because the initialiser routes through `wrappedValue`; assigning `storage` directly would have kept 15.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-property-wrappers-q2",
          prompt: "What does the compiler generate for `@Clamped(0...10) var level = 5`?",
          options: [
            "A private stored property `_level` of type `Clamped`, and a computed `level` whose accessors forward to `_level.wrappedValue`",
            "A stored `level` of type `Int` plus a runtime observer registered with the wrapper",
            "A macro expansion that replaces every read of `level` at the call site",
            "A subclass of `Clamped` specialised for `Int`",
          ],
          correctIndex: 0,
          explanation:
            "It is a purely syntactic rewrite you can see in Xcode's expanded output. Knowing the shape explains why `_level` is accessible inside the type and why the wrapper's access level must be at least the property's.",
        },
        {
          id: "swift-property-wrappers-q3",
          prompt: "What is `projectedValue` for?",
          options: [
            "It is the value exposed as `$name`, letting a wrapper hand out something other than the wrapped value — such as a `Binding` or a publisher",
            "It is the value used before the wrapper is initialised",
            "It is a read-only mirror of `wrappedValue` used by the debugger",
            "It is required by the `@propertyWrapper` attribute and must always be declared",
          ],
          correctIndex: 0,
          explanation:
            "`projectedValue` is optional. `@State`'s projection is a `Binding`, which is why `$count` can be passed to a `TextField` — there is no special `$` syntax beyond looking up this property.",
        },
        {
          id: "swift-property-wrappers-q4",
          prompt: "Which of these can a property wrapper be applied to? (Select all that apply.)",
          options: [
            "A stored instance property of a struct or class",
            "A local variable inside a function",
            "A function parameter",
            "A computed property",
            "A property requirement declared in a protocol",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The wrapper needs storage to own, so computed properties are out; a protocol declares a requirement, not storage, so the attribute has nothing to attach to. Local variables and function parameters were both added after the original proposal shipped.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-property-wrappers-q5",
          prompt: "Is `@Observable` a property wrapper?",
          options: [
            "No — it is a macro that rewrites the whole class to add observation tracking; `@State` and `@Binding` are the property wrappers",
            "Yes — it wraps each stored property in an observable box",
            "Yes, but only on classes; on structs it behaves as a macro",
            "No — it is a compiler attribute with no source-level expansion",
          ],
          correctIndex: 0,
          explanation:
            "The two mechanisms look alike because both use `@`. `@Observable` expands into conformance and per-property accessor rewriting for the entire type; a property wrapper only ever affects one property.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-property-wrappers-q6",
          prompt: "Why is `@AppStorage(\"theme\") var theme = \"light\"` more than a convenience over reading `UserDefaults` in a computed property?",
          options: [
            "The wrapper both persists on write and participates in SwiftUI's dependency tracking, so views that read it re-render when it changes",
            "It encrypts the stored value, unlike raw `UserDefaults`",
            "It writes synchronously to disk on every change, which a computed property cannot do",
            "It works without a key, deriving one from the property name",
          ],
          correctIndex: 0,
          explanation:
            "Persistence plus invalidation is the point. A plain computed property would read the right value but nothing would tell SwiftUI to re-evaluate the body when the default changed.",
        },
        {
          id: "swift-property-wrappers-q7",
          prompt: "What happens with `@Clamped(0...10) @Logged var level = 5` (two wrappers on one property)?",
          options: [
            "Wrappers compose: the outermost wraps the next one's `wrappedValue`, forming a chain",
            "It does not compile — only one property wrapper is allowed per property",
            "Only the first attribute is applied; the second is ignored with a warning",
            "The two wrappers are merged into a single synthesised type",
          ],
          correctIndex: 0,
          explanation:
            "Composition nests them in the order written. It is legal but hard to reason about, because each layer's `wrappedValue` type must line up with the next.",
        },
        {
          id: "swift-property-wrappers-q8",
          prompt: "You need a wrapper whose behaviour depends on the object it is declared in — for example, notifying that object on every write. Why is that awkward?",
          options: [
            "A wrapper is initialised before `self` is fully available, so it cannot capture the enclosing instance through ordinary means",
            "Wrappers cannot have stored properties of reference type",
            "Wrappers are structs and cannot conform to protocols",
            "Property wrappers cannot define a setter at all",
          ],
          correctIndex: 0,
          explanation:
            "This is exactly the limitation that observation macros exist to work around. There is an underscored static-subscript mechanism the standard library uses for it, but it is not a supported public feature.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-property-wrappers-q9",
          prompt: "Why does reading a SwiftUI `@State` property from a view's `init` give the initial value rather than the current one?",
          options: [
            "The wrapper's storage is owned by SwiftUI and attached to the view's identity, and it is not connected yet while the struct is being constructed",
            "`@State` values are only written on the main actor and `init` may run on another thread",
            "`init` runs before the property wrapper's `wrappedValue` is synthesised",
            "It does not — `init` sees the current value; the confusion comes from `body` being cached",
          ],
          correctIndex: 0,
          explanation:
            "View structs are recreated constantly; the state lives outside them, keyed by identity. The default expression is evaluated every time the struct is built but only used the first time SwiftUI installs the state.",
        },
        {
          id: "swift-property-wrappers-q10",
          prompt: "What is the main reason to prefer a property wrapper over a computed property calling a helper?",
          options: [
            "It attaches the behaviour to the declaration, so every use of the property is guaranteed to go through it",
            "It is faster, because the accessor is inlined while a helper call is not",
            "It allows the property to be mutated from a non-`mutating` method",
            "It makes the property automatically thread-safe",
          ],
          correctIndex: 0,
          explanation:
            "It is an enforcement mechanism: nobody can bypass the clamp or the persistence by touching the stored property, because there is no plain stored property to touch.",
        },
      ],
    },
    {
      id: "swift-async-await",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "`async`/`await` and Structured Concurrency",
      summary:
        "`await` does not block a thread. It marks a **potential suspension point**: the function may give up its thread there and resume later, possibly on a different thread, while the runtime uses the freed thread for other work. That is the whole reason Swift concurrency replaced completion handlers — the cooperative thread pool has roughly one thread per core rather than a thread per blocked operation, so a thousand in-flight requests do not become a thousand threads.\n\nStructured concurrency is the part that differs most from JavaScript's promises. `async let` and `withTaskGroup` create **child tasks** with a lifetime bounded by the enclosing scope: the scope cannot exit until they finish, cancellation flows from parent to children automatically, and priority and task-local values are inherited. A dangling promise has no equivalent — the structure is enforced. `Task { }` steps outside that structure (it inherits isolation and priority but nothing owns it), and `Task.detached` inherits nothing at all, which is why it should be rare.\n\nCancellation is cooperative, not pre-emptive. Cancelling a task sets a flag; your code has to notice, via `try Task.checkCancellation()`, `Task.isCancelled`, or an API like `Task.sleep` that throws on cancellation. The performance gotcha everyone writes once: `for url in urls { results.append(await fetch(url)) }` is strictly sequential. Concurrency comes from `async let` for a fixed set of operations or a task group for a dynamic one — `await` in a loop is just a slower `for` loop.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        {
          label: "Swift book: Concurrency",
          url: "https://docs.swift.org/latest/documentation/the-swift-programming-language/concurrency/",
          kind: "docs",
        },
        { label: "Apple: Swift Concurrency", url: "https://developer.apple.com/documentation/swift/concurrency", kind: "docs" },
        {
          label: "Hacking with Swift: What are tasks and task groups?",
          url: "https://www.hackingwithswift.com/quick-start/concurrency/what-are-tasks-and-task-groups",
          kind: "article",
        },
        {
          label: "Hacking with Swift: async let vs tasks vs task groups",
          url: "https://www.hackingwithswift.com/quick-start/concurrency/whats-the-difference-between-async-let-tasks-and-task-groups",
          kind: "article",
        },
      ],
      video: {
        title: "WWDC25: Embracing Swift concurrency | Apple",
        channel: "Apple Developer",
        url: "https://www.youtube.com/watch?v=u2rYp8AMuSg",
        videoId: "u2rYp8AMuSg",
        startSeconds: 360,
        chapterLabel: "Asynchronous tasks",
        durationLabel: "28:01",
      },
      alternateVideos: [
        {
          title: "WWDC21: Explore structured concurrency in Swift | Apple",
          channel: "Apple Developer",
          url: "https://www.youtube.com/watch?v=nyuq9qc-2H8",
          videoId: "nyuq9qc-2H8",
          durationLabel: "27:54",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-async-await-q1",
          prompt: "Each `fetch` takes about one second. Roughly how long does this take?\n\n```swift\nfunc loadAll(_ urls: [URL]) async throws -> [Data] {\n    var out: [Data] = []\n    for url in urls { out.append(try await fetch(url)) }\n    return out\n}\n```",
          options: [
            "About `urls.count` seconds — the loop is sequential",
            "About one second — `await` in a loop runs the iterations concurrently",
            "About one second, because the cooperative pool parallelises the loop automatically",
            "It depends on the number of CPU cores",
          ],
          correctIndex: 0,
          explanation:
            "`await` suspends and resumes one at a time; nothing about the loop is concurrent. `withThrowingTaskGroup` is the fix for a dynamic number of operations.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-async-await-q2",
          prompt: "What does `await` guarantee about the thread the function resumes on?",
          options: [
            "Nothing — it may resume on a different thread, though it does resume in the same isolation context (the same actor, if any)",
            "It always resumes on the thread it suspended from",
            "It always resumes on the main thread unless marked `@concurrent`",
            "It resumes on whichever thread has the lowest load, and isolation is not preserved",
          ],
          correctIndex: 0,
          explanation:
            "Isolation, not thread identity, is what the model guarantees. Code that assumed thread-affinity — thread-local storage, a lock held across the await — breaks here.",
        },
        {
          id: "swift-async-await-q3",
          prompt: "What does `async let` do that `Task { }` does not?",
          options: [
            "It creates a child task whose lifetime is bounded by the enclosing scope, so it is awaited or cancelled automatically when the scope exits",
            "It runs the work on a background thread, whereas `Task` runs on the caller's actor",
            "It allows the result to be used without `await`",
            "It guarantees the work starts immediately, whereas a `Task` is lazy",
          ],
          correctIndex: 0,
          explanation:
            "That scope binding is what 'structured' means: the compiler will not let the function return with an un-awaited child, and cancelling the parent cancels it.",
        },
        {
          id: "swift-async-await-q4",
          prompt: "Which of these are inherited by `Task { }` but not by `Task.detached { }`? (Select all that apply.)",
          options: [
            "Actor isolation of the enclosing context",
            "Task priority",
            "Task-local values",
            "The enclosing task's cancellation state",
            "The enclosing function's error-handling context",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`Task { }` inherits isolation, priority and task-local values; `Task.detached` deliberately inherits none of them. Neither is a child task, so neither is cancelled when the creating scope is cancelled.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-async-await-q5",
          prompt: "What happens when a task is cancelled?",
          options: [
            "A flag is set; the task keeps running until it checks `Task.isCancelled`, calls `try Task.checkCancellation()`, or hits an API that throws on cancellation",
            "The task is stopped immediately at its current instruction",
            "The task is suspended and resumed only if cancellation is revoked",
            "The task throws `CancellationError` at its next statement automatically",
          ],
          correctIndex: 0,
          explanation:
            "Cancellation is cooperative, which is why long CPU-bound loops need an explicit check. `Task.sleep` and most async standard-library APIs throw `CancellationError` for you.",
        },
        {
          id: "swift-async-await-q6",
          prompt: "What does this print?\n\n```swift\nfunc tag(_ s: String) async -> String { s }\n\nfunc run() async {\n    async let a = tag(\"a\")\n    async let b = tag(\"b\")\n    print(\"before\")\n    print(await a, await b)\n}\n```",
          options: [
            "`before` then `a b`",
            "`a b` then `before`",
            "`before` then `b a`, because task order is not deterministic",
            "It does not compile — `async let` must be awaited on the next line",
          ],
          correctIndex: 0,
          explanation:
            "`async let` starts the work but does not suspend, so `before` prints first. The two `await`s then collect the results in the order written, regardless of which child finished first.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-async-await-q7",
          prompt: "What is the rule for `withCheckedContinuation` when bridging a callback API?",
          options: [
            "The continuation must be resumed exactly once — resuming twice traps and never resuming leaks the task forever",
            "The continuation must be resumed on the main actor",
            "The continuation may be resumed any number of times; only the first result is used",
            "The continuation must be stored in a task-local value before use",
          ],
          correctIndex: 0,
          explanation:
            "The 'checked' variant exists precisely to diagnose both mistakes at runtime. A callback API with an error path that sometimes fires neither success nor failure will hang the awaiting task silently.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-async-await-q8",
          prompt: "What is the correct way to run a dynamic number of fetches concurrently and collect all results?",
          options: [
            "`withThrowingTaskGroup`, adding a child task per item and collecting results with `for try await`",
            "A `for` loop of `async let` bindings",
            "`Task.detached` per item, storing each task in an array and awaiting `.value` afterwards",
            "`DispatchQueue.concurrentPerform` wrapped in a continuation",
          ],
          correctIndex: 0,
          explanation:
            "`async let` needs a statically known set of bindings. Task groups are the structured tool for a runtime-determined count, and they propagate cancellation and errors correctly.",
        },
        {
          id: "swift-async-await-q9",
          prompt: "Swift 6.2 changed the default execution context for `nonisolated` async functions. What is it now, when the upcoming feature is enabled?",
          options: [
            "They run in the caller's execution context; `@concurrent` opts a function into the concurrent thread pool instead",
            "They always run on the main actor unless marked `nonisolated`",
            "They always run on the global concurrent pool, as before, and `@concurrent` is only documentation",
            "They run on a dedicated serial executor created per call",
          ],
          correctIndex: 0,
          explanation:
            "Previously a nonisolated async function always hopped to the global pool, which made writing async methods on ordinary classes painful. Running in the caller's context by default, with `@concurrent` to opt out, is the Swift 6.2 'approachable concurrency' change.",
        },
        {
          id: "swift-async-await-q10",
          prompt: "Why is a completion-handler API harder to get right than the `async` equivalent?",
          options: [
            "Nothing forces the handler to be called exactly once, on every path, and errors on the paths that forget it are invisible",
            "Completion handlers cannot capture `self`",
            "Completion handlers always run on a background thread, which async functions never do",
            "Completion handlers cannot return values, only side effects",
          ],
          correctIndex: 0,
          explanation:
            "The compiler checks that an `async` function returns or throws on every path. A callback API's contract lives only in documentation, which is why 'forgot to call the handler in the guard' is such a common bug.",
        },
      ],
    },
    {
      id: "swift-actors-data-race",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Actors and Swift 6 Data-Race Safety",
      summary:
        "An actor is a reference type whose mutable state is protected by the compiler: only one task runs its isolated code at a time, and every access from outside is `await`ed. That turns a whole class of race conditions into compile errors rather than heisenbugs. `@MainActor` is the same mechanism as a global actor — a single shared isolation domain that UI code lives in — and `Sendable` is the protocol that marks a type safe to pass between domains.\n\nSwift 6 language mode is the breaking change to understand. In Swift 5 mode, strict concurrency checking produces warnings; in Swift 6 mode those become **errors**, and the compiler enforces that non-`Sendable` values do not cross isolation boundaries and that global mutable state is isolated. Most concurrency material written before this compiles as shown under Swift 5 and does not compile under Swift 6. Swift 6.2 then softened the ergonomics rather than the rules: `nonisolated` async functions run in the caller's context, `@concurrent` opts into the pool, and a target can default all its code to `@MainActor`, which is the right setting for an app module.\n\nThe expert-level gotcha is **actor reentrancy**. An actor guarantees mutual exclusion between suspension points, not across them. Every `await` inside an isolated method is a point where another task can enter the actor and mutate state, so `let old = value; await something(); value = old + 1` loses updates exactly like an unsynchronised counter. Actors prevent data races — simultaneous memory access — not race conditions in your logic. Re-read state after every `await`, and do not assume an invariant checked before a suspension still holds after it.",
      level: "expert",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        {
          label: "Swift.org: Swift 6 migration guide",
          url: "https://www.swift.org/migration/documentation/migrationguide/",
          kind: "docs",
        },
        { label: "Apple: Actor", url: "https://developer.apple.com/documentation/swift/actor", kind: "docs" },
        {
          label: "Swift Evolution: SE-0306 Actors",
          url: "https://github.com/swiftlang/swift-evolution/blob/main/proposals/0306-actors.md",
          kind: "spec",
        },
        {
          label: "Hacking with Swift: What is actor reentrancy and how can it cause problems?",
          url: "https://www.hackingwithswift.com/quick-start/concurrency/what-is-actor-reentrancy-and-how-can-it-cause-problems",
          kind: "article",
        },
      ],
      video: {
        title: "WWDC25: Embracing Swift concurrency | Apple",
        channel: "Apple Developer",
        url: "https://www.youtube.com/watch?v=u2rYp8AMuSg",
        videoId: "u2rYp8AMuSg",
        startSeconds: 898,
        chapterLabel: "Sharing data",
        durationLabel: "28:01",
      },
      alternateVideos: [
        {
          title: "WWDC24: Migrate your app to Swift 6 | Apple",
          channel: "Apple Developer",
          url: "https://www.youtube.com/watch?v=75-c6jSE8kU",
          videoId: "75-c6jSE8kU",
          durationLabel: "41:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-actors-data-race-q1",
          prompt: "1,000 tasks call `bump()` concurrently. What is `count` afterwards?\n\n```swift\nactor Counter {\n    var count = 0\n    func bump() async {\n        let old = count\n        await Task.yield()\n        count = old + 1\n    }\n}\n```",
          options: [
            "Possibly far less than 1,000 — the actor can admit another task at the `await`, so updates are lost",
            "Exactly 1,000 — actor isolation serialises the whole method",
            "Exactly 1,000, but only if the actor is `@MainActor`",
            "It cannot compile — `count` is mutated after a suspension point",
          ],
          correctIndex: 0,
          explanation:
            "Actor reentrancy: mutual exclusion holds between suspension points, not across them. Removing the `await`, or recomputing from `count` after it, fixes this. Actors prevent data races, not logical race conditions.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-actors-data-race-q2",
          prompt: "What changes when a target moves from Swift 5 mode with strict concurrency checking to Swift 6 language mode?",
          options: [
            "Data-race safety diagnostics become errors instead of warnings",
            "Actors become value types rather than reference types",
            "`await` starts blocking the calling thread",
            "`Sendable` conformance is inferred for every type, including classes",
          ],
          correctIndex: 0,
          explanation:
            "That is the whole migration. It is why so much existing sample code 'stops compiling' on Swift 6 — the diagnostics were already there as warnings and are now enforced.",
        },
        {
          id: "swift-actors-data-race-q3",
          prompt: "Which of these are `Sendable` without extra work? (Select all that apply.)",
          options: [
            "A struct whose stored properties are all `Sendable`",
            "An `actor`",
            "An enum with `Sendable` associated values",
            "A non-final class with `var` stored properties",
            "A closure that captures a mutable local variable",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Value types compose their conformance; actors are `Sendable` by construction because their state is isolated. A mutable class needs `@unchecked Sendable` plus your own synchronisation, or isolation to a global actor.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-actors-data-race-q4",
          prompt: "What does `@MainActor` on a class mean?",
          options: [
            "Every member is isolated to the main actor, so calls from other isolation domains must `await`",
            "The class is allocated on the main thread but can be used from anywhere",
            "The class's methods are dispatched through `DispatchQueue.main.sync`",
            "The class is automatically `@unchecked Sendable`",
          ],
          correctIndex: 0,
          explanation:
            "A global actor is one shared isolation domain. It is the right tool for view models and anything touching UIKit or SwiftUI, and it is what a Swift 6.2 app target can now default to for all of its code.",
        },
        {
          id: "swift-actors-data-race-q5",
          prompt: "Why does a `let` property of `Sendable` type on an actor not require `await` to read?",
          options: [
            "It is immutable and safely copyable, so there is no state to protect and the compiler treats it as nonisolated",
            "Because reads are always safe; even `var` properties can be read without `await`",
            "Because `let` properties are stored outside the actor's isolation domain, on the caller's stack",
            "It does require `await`; the compiler just infers it silently",
          ],
          correctIndex: 0,
          explanation:
            "No mutation means no race. `var` properties are a different matter: they can only be read with `await` from outside, and cannot be written from outside at all.",
        },
        {
          id: "swift-actors-data-race-q6",
          prompt: "Why does Apple's guidance advise against making a SwiftUI view model a plain `actor`?",
          options: [
            "The view needs to read its state synchronously during `body`, and actor-isolated state can only be read with `await`; `@MainActor` is the right isolation for UI state",
            "Actors cannot conform to `Observable`",
            "Actors cannot hold reference-type properties",
            "Actors are not `Sendable`, so they cannot be captured by a view",
          ],
          correctIndex: 0,
          explanation:
            "`body` is synchronous. Pushing UI state onto a custom actor forces awkward mirroring back to the main actor; isolating the model to `@MainActor` and doing expensive work in `@concurrent` or actor-isolated helpers is the pattern.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-actors-data-race-q7",
          prompt: "Under Swift 6, what is wrong with `var shared = Cache()` at file scope?",
          options: [
            "Global mutable state is reachable from every isolation domain, so it is a data-race error unless it is isolated to a global actor or made a `Sendable` `let`",
            "Globals are forbidden entirely in Swift 6",
            "It compiles but the variable is thread-local, giving each task its own copy",
            "It is only an error if `Cache` is a class",
          ],
          correctIndex: 0,
          explanation:
            "The escape hatches, in order of preference: make it `let` and `Sendable`, isolate it with `@MainActor` or a custom global actor, or — knowing what you are doing — `nonisolated(unsafe)`.",
        },
        {
          id: "swift-actors-data-race-q8",
          prompt: "What does region-based isolation (SE-0414) allow that earlier strict checking did not?",
          options: [
            "Passing a non-`Sendable` value across an isolation boundary when the compiler can prove no other code still references it",
            "Making any class `Sendable` by adding a lock",
            "Calling actor-isolated methods without `await` from the main actor",
            "Turning off data-race checking for one file",
          ],
          correctIndex: 0,
          explanation:
            "It tracks disconnected 'regions' of values, so handing off a freshly created object is fine even though its type is not `Sendable`. `sending` parameters express the same idea in an API signature.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-actors-data-race-q9",
          prompt: "Three tasks are suspended awaiting the same actor. In what order are they resumed?",
          options: [
            "Unspecified — actors make no FIFO ordering guarantee, so you must not rely on arrival order",
            "Strictly first-in, first-out",
            "By task priority, then FIFO within a priority",
            "Last-in, first-out, to keep the hottest data in cache",
          ],
          correctIndex: 0,
          explanation:
            "The runtime reorders, partly to support priority escalation. Any code that needs ordered processing has to model the queue explicitly, for example with an `AsyncStream`.",
        },
        {
          id: "swift-actors-data-race-q10",
          prompt: "What does `nonisolated` on an actor member mean?",
          options: [
            "The member does not touch the actor's mutable state, so it can be called synchronously without `await`",
            "The member runs on the global concurrent pool instead of the actor's executor",
            "The member is excluded from data-race checking",
            "The member can mutate state without isolation, at your own risk",
          ],
          correctIndex: 0,
          explanation:
            "It is a promise checked by the compiler: a `nonisolated` member may only touch immutable or non-isolated state. It is how an actor conforms to protocols such as `Hashable` and `CustomStringConvertible`.",
        },
      ],
    },
    {
      id: "swift-ui-views",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Views as Values: the Declarative Model and View Identity",
      summary:
        "A SwiftUI `View` is a struct — a cheap, throwaway *description* of what the UI should look like for the current state, not an object that owns pixels. SwiftUI creates it, reads `body`, compares the result with what it had, and discards the value. If you come from React the bridge is exact: `body` is `render`, and the returned tree is a description that gets diffed. The bridge then breaks in an instructive way, because React elements are objects diffed by type and `key`, while a SwiftUI view's *type itself* encodes the structure — `VStack<TupleView<(Text, Button<Text>)>>` — and identity is largely structural.\n\n**Identity is the concept to get right**, because it decides three things at once: whether `@State` survives, whether a change animates or transitions, and whether `onAppear` runs again. A view has *structural* identity from its position in that static type — the `if` branch it is in, its index in a container — and *explicit* identity from `.id(_:)` or the id of a `ForEach` element. Change the identity and SwiftUI treats it as a different view: old state is discarded, removal and insertion transitions fire. Keep identity and the same view is simply updated, and property changes animate.\n\nThe practical consequences: `if a { Text(x) } else { Text(y) }` produces two structural identities via `_ConditionalContent`, so state is not shared between the branches, while `Text(a ? x : y)` is one view that updates. `.id(someValue)` is the deliberate way to *reset* a subtree's state. And `body` may be called far more often than you expect, so it must be a pure function of state — never start a network request or mutate state in it.",
      level: "advanced",
      estMinutes: 55,
      isMilestone: true,
      webRefs: [
        {
          label: "Apple: View fundamentals",
          url: "https://developer.apple.com/documentation/swiftui/view-fundamentals",
          kind: "docs",
        },
        {
          label: "Apple: Declaring a custom view",
          url: "https://developer.apple.com/documentation/swiftui/declaring-a-custom-view",
          kind: "docs",
        },
        { label: "Apple: View.id(_:)", url: "https://developer.apple.com/documentation/swiftui/view/id(_:)", kind: "docs" },
      ],
      video: {
        title: "WWDC21: Demystify SwiftUI | Apple",
        channel: "Apple Developer",
        url: "https://www.youtube.com/watch?v=XwdVz0Ef1vU",
        videoId: "XwdVz0Ef1vU",
        durationLabel: "40:17",
      },
      alternateVideos: [
        {
          title: "WWDC24: SwiftUI essentials | Apple",
          channel: "Apple Developer",
          url: "https://www.youtube.com/watch?v=HyQgpxX__-A",
          videoId: "HyQgpxX__-A",
          durationLabel: "24:16",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-ui-views-q1",
          prompt: "A SwiftUI `View` struct is created and destroyed many times per second. Where does its `@State` live?",
          options: [
            "In storage SwiftUI owns, keyed by the view's identity — not in the struct instance",
            "In the struct's stored property, which is why views must be `mutating`",
            "In a hidden singleton keyed by the view's type name",
            "On the heap, reference-counted by the `@State` property wrapper itself",
          ],
          correctIndex: 0,
          explanation:
            "That indirection is the entire reason `body` can be non-mutating on a struct while state changes persist. It also explains the failure mode: change the view's identity and the state SwiftUI was holding for it is thrown away.",
        },
        {
          id: "swift-ui-views-q2",
          prompt: "What happens to the typed text when `showAdvanced` flips?\n\n```swift\nstruct Form1: View {\n    @State private var showAdvanced = false\n    var body: some View {\n        VStack {\n            if showAdvanced {\n                NameField()   // has its own @State text\n            } else {\n                NameField()\n            }\n            Toggle(\"Advanced\", isOn: $showAdvanced)\n        }\n    }\n}\n```",
          options: [
            "It is lost — the two branches are different structural identities, so the second `NameField` starts fresh",
            "It is preserved — both branches construct the same view type, so SwiftUI reuses the state",
            "It is preserved only if `NameField` conforms to `Equatable`",
            "It is lost only on the first toggle and preserved afterwards",
          ],
          correctIndex: 0,
          explanation:
            "`@ViewBuilder` turns the `if`/`else` into `_ConditionalContent<NameField, NameField>`; the branch is part of the identity even though the types match. Hoisting `NameField()` out of the conditional keeps its state.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-views-q3",
          prompt: "Which of these change a view's identity? (Select all that apply.)",
          options: [
            "Switching which branch of an `if`/`else` is taken",
            "Changing the value passed to `.id(_:)`",
            "Changing the id of the element a `ForEach` row is built from",
            "Changing a value the view displays, such as the text of a `Label`",
            "Adding a `.padding()` modifier based on a state value",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Identity is about *which* view this is, not what it currently shows. Changing displayed values or modifier arguments updates the same view — which is exactly what lets SwiftUI animate the difference.",
        },
        {
          id: "swift-ui-views-q4",
          prompt: "What is the idiomatic way to deliberately reset a subtree's state when a selected item changes?",
          options: [
            "Attach `.id(selectedItem.id)` so a new identity discards the old state",
            "Call a `reset()` method on the child view from `onChange`",
            "Wrap the subtree in `AnyView` so SwiftUI rebuilds it",
            "Add `.animation(nil)` to force a full rebuild",
          ],
          correctIndex: 0,
          explanation:
            "`.id()` is the supported lever for identity. `AnyView` erases type information and hurts diffing without reliably resetting state, and `.animation` has nothing to do with identity.",
        },
        {
          id: "swift-ui-views-q5",
          prompt: "Why is calling a network request directly in `body` a bug rather than a style preference?",
          options: [
            "`body` is evaluated whenever SwiftUI needs a description and may run many times per state change, so side effects there fire unpredictably",
            "`body` runs off the main actor, so networking from it is unsafe",
            "`body` is memoised, so the request would only ever run once",
            "It compiles but `body` cannot contain `await`, so the request could never complete",
          ],
          correctIndex: 0,
          explanation:
            "Treat `body` as a pure function from state to description. `.task { }` and `.onAppear { }` are the lifecycle hooks — and they are themselves tied to identity, so they re-run when identity changes.",
        },
        {
          id: "swift-ui-views-q6",
          prompt: "What is the difference between how React and SwiftUI decide that two renders describe 'the same' element?",
          options: [
            "React matches by element type plus an explicit `key`; SwiftUI matches mainly by position in the statically typed view tree, with `.id()` as the explicit override",
            "React matches by object identity; SwiftUI matches by comparing every property for equality",
            "React has no notion of identity; only SwiftUI does",
            "Both match purely by explicit keys; SwiftUI's is called `.tag()`",
          ],
          correctIndex: 0,
          explanation:
            "The structural half has no React analogue: the generic type of the view tree carries the structure, which is why `AnyView` (erasing it) is discouraged and why `ForEach` needs stable element ids for the dynamic part.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-views-q7",
          prompt: "What does `some View` as the return type of `body` accomplish?",
          options: [
            "It hides the exact composed generic type from callers while keeping it a single, statically known type for SwiftUI to diff",
            "It boxes the view so different bodies can return different types",
            "It defers building the view until it is needed",
            "It allows `body` to return a view that does not conform to `View`",
          ],
          correctIndex: 0,
          explanation:
            "Without opaque types you would write `VStack<TupleView<(Text, Spacer, Button<Text>)>>` by hand. `AnyView` would also hide it — but by erasing it, which is the thing SwiftUI needs for diffing.",
        },
        {
          id: "swift-ui-views-q8",
          prompt: "`ForEach(users, id: \\.self)` is used on a list where two users happen to be equal. What goes wrong?",
          options: [
            "Two rows claim the same identity, so state, animations and scroll position behave erratically",
            "It fails to compile because `User` is not `Identifiable`",
            "The duplicate row is silently dropped from the list",
            "Nothing — `id: \\.self` is the recommended approach for value types",
          ],
          correctIndex: 0,
          explanation:
            "`id: \\.self` makes the value its own identity, so duplicates collide. A stable unique id — conforming to `Identifiable` — is what dynamic content needs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-views-q9",
          prompt: "Why is `AnyView` discouraged in view hierarchies?",
          options: [
            "It erases the static type SwiftUI relies on to compare structure, so SwiftUI has less information for diffing and animation",
            "It allocates a new UIView on every update",
            "It prevents the view from receiving environment values",
            "It disables `@State` inside the wrapped view",
          ],
          correctIndex: 0,
          explanation:
            "`@ViewBuilder`, `Group` or a generic parameter express 'one of several views' without erasing the type. `AnyView` is for genuinely dynamic cases, such as a plugin returning an unknown view.",
        },
        {
          id: "swift-ui-views-q10",
          prompt: "SwiftUI calls `body` on a view whose inputs have not changed. Why might that happen, and does it matter?",
          options: [
            "SwiftUI may re-evaluate more broadly than strictly necessary; it is cheap as long as `body` is pure and does no heavy work",
            "It never happens — SwiftUI guarantees `body` runs only when an input changes",
            "It means the view is leaking and should be wrapped in `EquatableView`",
            "It indicates an identity change and the view's state has already been discarded",
          ],
          correctIndex: 0,
          explanation:
            "Building a description is meant to be cheap. Expensive sorting or formatting inside `body` is what turns a harmless extra evaluation into a dropped frame — hoist that work into the model.",
        },
      ],
    },
    {
      id: "swift-ui-state",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "State: `@State`, `@Binding`, `@Observable` and `@Environment`",
      summary:
        "SwiftUI's data flow is four tools with four jobs. `@State` is storage SwiftUI owns on behalf of one view, for a value type that belongs to that view — the direct analogue of `useState`, except that the storage lives outside the struct and is keyed by identity. `@Binding` is a read-write reference to state owned somewhere else, handed down as `$value`; it is `[value, setValue]` passed as one thing. `@Environment` reads values injected above you in the tree, which is React context with type- or key-path-based lookup instead of a provider object. And `@Observable` is the model layer.\n\n**`@Observable` replaced `ObservableObject` for new code**, and this is the single biggest gap between current SwiftUI and most tutorials still online. The Observation framework's macro rewrites a class's stored properties so SwiftUI can record *which properties a particular `body` actually read* and invalidate only the views that read the one that changed. `ObservableObject` could only fire one `objectWillChange` for the whole object, so every observing view re-evaluated. With `@Observable` you own the model with `@State private var model = Model()`, pass it to children as a plain property, get bindings with `@Bindable`, and inject it with `.environment(model)` / `@Environment(Model.self)`. `@StateObject`, `@ObservedObject`, `@EnvironmentObject` and `@Published` still work but are the previous generation. React has no analogue for the tracking part — it is closer to MobX or Vue's reactivity than to `useState`.\n\nThe classic bug this fixed: creating an `ObservableObject` with `@ObservedObject var vm = VM()` recreated it on every view update, because only `@StateObject` had first-initialisation semantics. With `@Observable`, `@State` provides those semantics, so the shape of the mistake moved rather than disappearing — reading a property outside `body` does not register a dependency at all.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        {
          label: "Apple: Migrating from ObservableObject to the Observable macro",
          url: "https://developer.apple.com/documentation/swiftui/migrating-from-the-observable-object-protocol-to-the-observable-macro",
          kind: "docs",
        },
        {
          label: "Apple: Managing model data in your app",
          url: "https://developer.apple.com/documentation/swiftui/managing-model-data-in-your-app",
          kind: "docs",
        },
        { label: "Apple: State", url: "https://developer.apple.com/documentation/swiftui/state", kind: "docs" },
        {
          label: "Fatbobman: Exploring key property wrappers in SwiftUI",
          url: "https://fatbobman.com/en/posts/exploring-key-property-wrappers-in-swiftui/",
          kind: "article",
        },
      ],
      video: {
        title: "SwiftUI Data Flow: When to Use @State, @Observable and @Environment",
        channel: "tundsdev",
        url: "https://www.youtube.com/watch?v=AiP7KGFvZ6Q",
        videoId: "AiP7KGFvZ6Q",
        durationLabel: "38:26",
      },
      alternateVideos: [
        {
          title: "SwiftUI Data Flow in iOS 17 - Observation & @Observable",
          channel: "Sean Allen",
          url: "https://www.youtube.com/watch?v=EK7SthdWV2w",
          videoId: "EK7SthdWV2w",
          durationLabel: "7:56",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-ui-state-q1",
          prompt: "What does `@Observable` do that `ObservableObject` could not?",
          options: [
            "Track which individual properties a view's `body` read, so only views that read a changed property are invalidated",
            "Allow structs as well as classes to be observed",
            "Publish changes without requiring the object to be a reference type",
            "Remove the need for the model to be on the main actor",
          ],
          correctIndex: 0,
          explanation:
            "`ObservableObject` had a single `objectWillChange` publisher for the whole object, so any change re-evaluated every observing view. Property-level tracking is the performance reason Apple moved new code to Observation.",
        },
        {
          id: "swift-ui-state-q2",
          prompt: "With `@Observable`, what is the correct way for a view to *own* its model?",
          options: [
            "`@State private var model = Model()`",
            "`@StateObject private var model = Model()`",
            "`@ObservedObject private var model = Model()`",
            "`let model = Model()`",
          ],
          correctIndex: 0,
          explanation:
            "`@State` now carries the 'create once per identity' semantics for reference-type models too. `@StateObject` and `@ObservedObject` belong to the `ObservableObject` generation, and a plain `let` would be recreated on every view update.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-state-q3",
          prompt: "Which of these are true of `@Binding`? (Select all that apply.)",
          options: [
            "It does not own storage; it reads and writes state owned elsewhere",
            "It is what `$value` produces for a `@State` property",
            "It can be created by hand with `Binding(get:set:)`",
            "It creates a copy of the value that is synced back on view disappearance",
            "It requires the wrapped value to conform to `Observable`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A `Binding` is a pair of closures over someone else's storage. Nothing is copied, and it works with any type — `Binding<Bool>` for a `Toggle` is the common case.",
        },
        {
          id: "swift-ui-state-q4",
          prompt: "A view reads `model.name` only inside `onAppear`, never in `body`. The name changes later. Does the view update?",
          options: [
            "No — Observation records dependencies from the property accesses made while evaluating `body`, and `onAppear` is not part of that",
            "Yes — any read of an `@Observable` property registers a dependency for the lifetime of the view",
            "Yes, but only if the property is also declared `@Published`",
            "No, and it would also fail to compile without `@Bindable`",
          ],
          correctIndex: 0,
          explanation:
            "Tracking is scoped to the body evaluation. This is the new shape of the old 'why isn't my view updating' bug — the fix is to read the property in `body`, even indirectly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-state-q5",
          prompt: "How do you get a `Binding` to a property of an `@Observable` model passed into a child view as a plain property?",
          options: [
            "Declare it `@Bindable var model: Model` in the child, then use `$model.title`",
            "Declare it `@Binding var model: Model`",
            "Declare it `@ObservedObject var model: Model`",
            "Wrap it with `Binding(get:set:)` manually — `@Observable` models cannot produce bindings",
          ],
          correctIndex: 0,
          explanation:
            "`@Bindable` exists precisely to project bindings from an observable reference type you do not own. `@Binding` is for value types whose storage lives in a parent.",
        },
        {
          id: "swift-ui-state-q6",
          prompt: "Why does SwiftUI warn 'Modifying state during view update, this will cause undefined behavior'?",
          options: [
            "State was written while `body` was being evaluated, which would invalidate the update SwiftUI is in the middle of performing",
            "State was written from a background thread",
            "A `@State` property was declared without `private`",
            "Two views wrote to the same `@Binding` in the same frame",
          ],
          correctIndex: 0,
          explanation:
            "It is the SwiftUI equivalent of `setState` during render in React. Move the write into `.task`, `.onAppear`, `.onChange` or an action closure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-state-q7",
          prompt: "How do you inject and read an `@Observable` model through the environment?",
          options: [
            "`.environment(model)` on an ancestor, and `@Environment(Model.self) private var model` in the descendant",
            "`.environmentObject(model)` and `@EnvironmentObject var model: Model`",
            "`.environment(\\.model, model)` and `@Environment(\\.model) var model`, with a custom `EnvironmentKey`",
            "`.modelContext(model)` and `@Environment(\\.modelContext) var model`",
          ],
          correctIndex: 0,
          explanation:
            "Observation added the type-keyed `environment(_:)` overload. `.environmentObject` is the `ObservableObject` equivalent, and a custom `EnvironmentKey` is still how you inject plain values such as a theme.",
        },
        {
          id: "swift-ui-state-q8",
          prompt: "What does `@State private var count = Int.random(in: 0...100)` do across view updates?",
          options: [
            "The initial expression is evaluated every time the struct is built, but only the first value is installed as the state for that identity",
            "The random number is regenerated on every update, because the struct is recreated",
            "It does not compile — `@State` initial values must be literals",
            "The expression is evaluated lazily, only the first time `count` is read",
          ],
          correctIndex: 0,
          explanation:
            "That mismatch — the expression runs repeatedly, the value is used once — is why expensive or side-effecting initialisers here are wasteful, and why the state is discarded only when identity changes.",
        },
        {
          id: "swift-ui-state-q9",
          prompt: "Which SwiftUI tool corresponds most closely to React's context?",
          options: [
            "`@Environment` — values injected by an ancestor and read by any descendant without threading props through",
            "`@Binding` — a value plus a setter passed down the tree",
            "`@State` — storage owned by a component and managed by the framework",
            "`@Bindable` — a two-way reference to a shared model",
          ],
          correctIndex: 0,
          explanation:
            "`@Environment` is the ambient lookup, though it is keyed by type or key path rather than by a provider object, and SwiftUI supplies many built-in values such as `\\.colorScheme` and `\\.dismiss`.",
        },
        {
          id: "swift-ui-state-q10",
          prompt: "A list of 500 rows observes one `@Observable` store, and each row reads only its own item. One item's title changes. What re-evaluates?",
          options: [
            "Only the views whose `body` read the property that changed",
            "Every row, because they all observe the same store object",
            "Only the root view, which then diffs the rows",
            "Nothing until the next frame, when SwiftUI batches all observations",
          ],
          correctIndex: 0,
          explanation:
            "This is the concrete payoff of property-level tracking. Under `ObservableObject` the single `objectWillChange` would have invalidated all 500 rows.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "swift-ui-layout",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Layout: Stacks, Frames, GeometryReader and Modifier Order",
      summary:
        "SwiftUI layout is a negotiation, not a constraint solver and not CSS. A parent **proposes** a size to each child, the child **chooses** its own size, and the parent then places it. A parent cannot force a size on a child — which is the single sentence that explains most confusing layouts. A proposal can also be unspecified (`nil` in a dimension, meaning 'size yourself ideally') or infinite, and different views answer very differently: `Text` takes what it needs and truncates, `Color` takes everything offered, `Image` without `.resizable()` ignores the proposal entirely.\n\nThat is why `.frame(width: 100)` does not resize the child. It inserts a new view 100 points wide that proposes 100 to the child and centres whatever the child decides to be. `.frame(maxWidth: .infinity)` is the idiom for 'accept all the width offered'. Stacks divide space among children by flexibility, giving the least flexible their size first, with `Spacer` maximally flexible and `layoutPriority` as the override.\n\n**Modifier order matters because modifiers wrap.** `.padding().background(.red)` puts red behind the padded content; `.background(.red).padding()` paints red behind the bare content and then adds space outside it. Nothing about this resembles CSS, where declaration order is mostly irrelevant. `GeometryReader` is the escape hatch that reports the proposal it received — and its cost is that it accepts the full proposal itself and top-leading-aligns its child, so wrapping a whole screen in one is a common way to destroy the intrinsic sizing you wanted. Reach for it last, after `frame`, alignment guides, `ViewThatFits` and, for real custom arrangement, the `Layout` protocol.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Apple: Layout protocol", url: "https://developer.apple.com/documentation/swiftui/layout", kind: "docs" },
        { label: "Apple: GeometryReader", url: "https://developer.apple.com/documentation/swiftui/geometryreader", kind: "docs" },
        {
          label: "Hacking with Swift: Why modifier order matters",
          url: "https://www.hackingwithswift.com/books/ios-swiftui/why-modifier-order-matters",
          kind: "article",
        },
        {
          label: "Hacking with Swift: Understanding frames and coordinates inside GeometryReader",
          url: "https://www.hackingwithswift.com/books/ios-swiftui/understanding-frames-and-coordinates-inside-geometryreader",
          kind: "article",
        },
      ],
      video: {
        title: "WWDC22: Compose custom layouts with SwiftUI | Apple",
        channel: "Apple Developer",
        url: "https://www.youtube.com/watch?v=ao0s5rMCIgc",
        videoId: "ao0s5rMCIgc",
        durationLabel: "27:01",
      },
      alternateVideos: [
        {
          title: "Frames and Alignments in SwiftUI | Bootcamp #8",
          channel: "Swiftful Thinking",
          url: "https://www.youtube.com/watch?v=BN8IEiM_3qI",
          videoId: "BN8IEiM_3qI",
          durationLabel: "12:07",
        },
        {
          title: "GeometryReader in SwiftUI to get a view's size and location | Continued Learning #6",
          channel: "Swiftful Thinking",
          url: "https://www.youtube.com/watch?v=lMteVjlOIbM",
          videoId: "lMteVjlOIbM",
          durationLabel: "16:02",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-ui-layout-q1",
          prompt: "What is the SwiftUI layout algorithm, in one sentence?",
          options: [
            "The parent proposes a size, the child chooses its own size, and the parent places the child",
            "The parent computes constraints and the layout engine solves them simultaneously",
            "The child requests a size and the parent grants or clips it",
            "Sizes flow bottom-up only; parents never influence children",
          ],
          correctIndex: 0,
          explanation:
            "Parents propose and place; children decide. That is why `.frame(width: 50)` on an `Image` without `.resizable()` changes nothing about the image — the child simply declines the proposal.",
        },
        {
          id: "swift-ui-layout-q2",
          prompt: "How do these two differ?\n\n```swift\nText(\"Hi\").padding(20).background(.red)\nText(\"Hi\").background(.red).padding(20)\n```",
          options: [
            "The first paints red behind the text *and* its 20-point padding; the second paints red only behind the text and puts the padding outside",
            "They render identically; modifier order only affects performance",
            "The first is invalid because `.background` must come before `.padding`",
            "The second paints red behind the padding as well, because `.padding` inherits the background",
          ],
          correctIndex: 0,
          explanation:
            "Each modifier wraps the view produced by the previous one, so the order builds a tree. This is the clearest break from CSS, where property order in a rule almost never matters.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-layout-q3",
          prompt: "What does `.frame(width: 100, height: 100)` actually do?",
          options: [
            "It inserts a view of that size which proposes 100×100 to the child and centres the child's chosen size inside it",
            "It forces the child to be exactly 100×100, clipping if necessary",
            "It sets the child's intrinsic content size to 100×100",
            "It only takes effect when the parent is a `GeometryReader`",
          ],
          correctIndex: 0,
          explanation:
            "The frame is a container, not a resize. The default `alignment: .center` is why a small child sits in the middle, and `alignment:` is how you move it.",
        },
        {
          id: "swift-ui-layout-q4",
          prompt: "Which of these accept whatever size the parent proposes? (Select all that apply.)",
          options: [
            "`Color.red`",
            "`Rectangle()`",
            "A view with `.frame(maxWidth: .infinity, maxHeight: .infinity)`",
            "`Text(\"Hello\")` with no modifiers",
            "`Image(\"logo\")` without `.resizable()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Shapes and colours are maximally flexible; `maxWidth: .infinity` asks for everything offered. `Text` takes only what it needs (truncating if it must), and a non-resizable `Image` reports its pixel size regardless of the proposal.",
        },
        {
          id: "swift-ui-layout-q5",
          prompt: "Why does putting a whole screen inside a `GeometryReader` so often break the layout?",
          options: [
            "`GeometryReader` accepts the entire proposed size and top-leading aligns its content, so intrinsic sizing and centring are lost",
            "`GeometryReader` cannot contain stacks",
            "`GeometryReader` re-evaluates its body on every frame, so layout never settles",
            "`GeometryReader` proposes zero to its children until the first layout pass completes",
          ],
          correctIndex: 0,
          explanation:
            "It is greedy and its alignment default surprises people. Use it on the smallest subtree that needs the measurement, or prefer `.containerRelativeFrame`, alignment guides or `ViewThatFits`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-layout-q6",
          prompt: "An `HStack` contains a `Text`, a `Spacer` and an `Image`. How is the width divided?",
          options: [
            "The least flexible children are sized first from the remaining space, and the `Spacer` absorbs whatever is left",
            "The width is divided equally among the three children",
            "The `Spacer` is sized first, then the remainder is split between the other two",
            "Each child gets width proportional to its intrinsic content size",
          ],
          correctIndex: 0,
          explanation:
            "Stacks offer space to their least flexible children first so text and images get what they need. `Spacer` is maximally flexible, which is why it ends up with the remainder.",
        },
        {
          id: "swift-ui-layout-q7",
          prompt: "Two `Text` views in an `HStack` both truncate, but you want the first to win. What is the right tool?",
          options: [
            "`.layoutPriority(1)` on the first text",
            "`.frame(maxWidth: .infinity)` on the first text",
            "`.fixedSize()` on the second text",
            "`.lineLimit(nil)` on the first text",
          ],
          correctIndex: 0,
          explanation:
            "Layout priority changes the order in which the stack offers space. `.fixedSize()` on the *second* would make it refuse to shrink at all, which is the opposite of the goal.",
        },
        {
          id: "swift-ui-layout-q8",
          prompt: "What does `.fixedSize()` do?",
          options: [
            "It makes the view ignore the parent's proposal and take its ideal size instead — commonly used to stop `Text` truncating",
            "It freezes the view's size at whatever it was on first layout",
            "It sets a fixed size that the parent must honour",
            "It disables animations of the view's frame",
          ],
          correctIndex: 0,
          explanation:
            "'Fixed' means fixed at the *ideal* size, not at a number you supply. Applying it in both axes on a long piece of text is a common way to produce a view that overflows its parent.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-layout-q9",
          prompt: "What does the `Layout` protocol require you to implement?",
          options: [
            "`sizeThatFits(proposal:subviews:cache:)` and `placeSubviews(in:proposal:subviews:cache:)`",
            "`layoutSubviews()` and `intrinsicContentSize`",
            "`body` returning a `some View` built from the subviews",
            "`measure(subviews:)` and `arrange(subviews:in:)`",
          ],
          correctIndex: 0,
          explanation:
            "Those two methods are the two halves of the negotiation: report the size you want given a proposal, then place each subview. It is the supported replacement for GeometryReader gymnastics.",
        },
        {
          id: "swift-ui-layout-q10",
          prompt: "Why is a `ZStack` sized the way it is?",
          options: [
            "It proposes its own proposal to every child and then takes the size of its largest child",
            "It always takes the full proposed size, like `Color`",
            "It takes the size of its first child, and later children are clipped to it",
            "It sums the sizes of its children in both dimensions",
          ],
          correctIndex: 0,
          explanation:
            "That is why adding a full-bleed `Color` to a `ZStack` makes the whole stack greedy — the largest child decides. `.background` is usually what you wanted instead, because a background does not participate in sizing.",
        },
      ],
    },
    {
      id: "swift-ui-lists-navigation",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Lists and `NavigationStack`",
      summary:
        "`List` is SwiftUI's lazy scrolling container: it only builds the rows it needs, recycles them as you scroll, and brings platform behaviours — separators, swipe actions, selection, pull-to-refresh, search — with it. Its dynamic content comes from `ForEach`, which needs a stable identity per element, either from `Identifiable` or from an explicit `id:` key path. Identity is not a formality here: it is what makes insert/delete animate correctly and what keeps per-row state attached to the right row after a sort.\n\n`NavigationStack` (iOS 16) replaced `NavigationView` with a model where navigation is *state*. You bind the stack to a `path` — a typed array or a `NavigationPath` for heterogeneous, `Codable` routes — and push by appending to it, pop by removing. `NavigationLink(value:)` puts a value on the path, and `.navigationDestination(for: Item.self)` says how to turn that value into a screen. Deep links, restore-on-launch and 'pop to root' all become ordinary data manipulation instead of imperative controller calls.\n\nThe performance trap worth knowing is the old `NavigationLink(destination:)` form inside a `List`: the destination view is constructed eagerly for every visible row, so an expensive detail view is built dozens of times for screens nobody opens. The value-based API defers construction until the push happens. The second trap is placing `.navigationDestination` inside a lazy container — put it on the stack's content, not on a row, or the modifier may not be installed when the push occurs.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Apple: NavigationStack", url: "https://developer.apple.com/documentation/swiftui/navigationstack", kind: "docs" },
        { label: "Apple: List", url: "https://developer.apple.com/documentation/swiftui/list", kind: "docs" },
        {
          label: "Hacking with Swift: How to push a new view onto a NavigationStack",
          url: "https://www.hackingwithswift.com/quick-start/swiftui/how-to-push-a-new-view-onto-a-navigationstack",
          kind: "article",
        },
        {
          label: "Hacking with Swift: How to create a list of dynamic items",
          url: "https://www.hackingwithswift.com/quick-start/swiftui/how-to-create-a-list-of-dynamic-items",
          kind: "article",
        },
      ],
      video: {
        title: "NavigationStack - SwiftUI Programmatic Navigation - iOS 16",
        channel: "Sean Allen",
        url: "https://www.youtube.com/watch?v=oxp8Qqwr4AY",
        videoId: "oxp8Qqwr4AY",
        durationLabel: "20:19",
      },
      alternateVideos: [
        {
          title: "How to use NavigationStack in SwiftUI | Bootcamp #62",
          channel: "Swiftful Thinking",
          url: "https://www.youtube.com/watch?v=GZ-hQWMjT0s",
          videoId: "GZ-hQWMjT0s",
          durationLabel: "23:59",
        },
        {
          title: "How to use ForEach loops in SwiftUI | Bootcamp #14",
          channel: "Swiftful Thinking",
          url: "https://www.youtube.com/watch?v=CKmsqRN-VM0",
          videoId: "CKmsqRN-VM0",
          durationLabel: "13:29",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-ui-lists-navigation-q1",
          prompt: "Why is `NavigationLink(value:)` plus `.navigationDestination(for:)` preferred over `NavigationLink(destination:)` inside a `List`?",
          options: [
            "The destination is only built when the push actually happens, instead of once per visible row",
            "The value-based form supports animations, which the destination-based form does not",
            "The destination-based form was removed in iOS 16",
            "The value-based form avoids requiring the rows to be `Identifiable`",
          ],
          correctIndex: 0,
          explanation:
            "Eagerly constructing detail views for every row is a real, measurable cost when the detail view does work in its initialiser. Decoupling the value from the destination also gives you programmatic navigation for free.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-lists-navigation-q2",
          prompt: "How do you programmatically pop to the root of a `NavigationStack` bound to `@State private var path: [Route] = []`?",
          options: [
            "`path.removeAll()`",
            "Call `dismiss()` once for each pushed screen",
            "Set `path = [.root]`",
            "Toggle the stack's `.id()` to rebuild it",
          ],
          correctIndex: 0,
          explanation:
            "The path *is* the navigation state, so emptying it returns to the root. That is the whole point of the iOS 16 redesign: navigation became data you can set, save and restore.",
        },
        {
          id: "swift-ui-lists-navigation-q3",
          prompt: "What does `ForEach(0..<items.count, id: \\.self)` do badly when the collection can be reordered or filtered?",
          options: [
            "It uses positions as identities, so rows keep the previous occupant's state and animations move the wrong views",
            "It fails to compile because `Range` is not `RandomAccessCollection`",
            "It rebuilds every row on every update, which is slow but correct",
            "It silently drops rows past the initial count",
          ],
          correctIndex: 0,
          explanation:
            "Index-as-identity means 'row 2' is always the same view even when a different item is in it. A stable per-item id keeps state and animations attached to the item.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-lists-navigation-q4",
          prompt: "Which of these does `List` give you over a `ScrollView` + `VStack`? (Select all that apply.)",
          options: [
            "Lazy construction and recycling of rows",
            "Platform row separators, swipe actions and selection",
            "Support for `onDelete` and `onMove` on a `ForEach`",
            "Automatic pagination of a remote data source",
            "Guaranteed constant-height rows",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`List` is the platform list, with the platform behaviours. It knows nothing about your network layer, and rows are free to be any height.",
        },
        {
          id: "swift-ui-lists-navigation-q5",
          prompt: "When would you use `NavigationPath` rather than a typed array as the stack's path?",
          options: [
            "When the stack can contain screens driven by several different value types, since `NavigationPath` is type-erased and `Codable`",
            "When you need the path to be observable",
            "When the stack has more than ten levels",
            "When the destinations are defined in a different module",
          ],
          correctIndex: 0,
          explanation:
            "A `[Route]` array is simpler and type-safe when one enum covers every screen. `NavigationPath` buys heterogeneity and, with `CodableRepresentation`, state restoration across launches.",
        },
        {
          id: "swift-ui-lists-navigation-q6",
          prompt: "Where should `.navigationDestination(for:)` be attached?",
          options: [
            "Inside the `NavigationStack`'s content, in a part of the hierarchy that is always present — not inside a lazily built row",
            "On the `NavigationStack` itself, outside its content closure",
            "On each `NavigationLink`",
            "In the app's root `WindowGroup`",
          ],
          correctIndex: 0,
          explanation:
            "Declaring it inside a lazy container means it may not exist when the push happens — which produces the runtime warning about a destination declared in a view that is not on screen.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-lists-navigation-q7",
          prompt: "What does `@Environment(\\.dismiss)` give you?",
          options: [
            "An action you call to dismiss the current presentation — popping a pushed view or closing a sheet",
            "A `Bool` telling you whether the view is being dismissed",
            "A binding to the enclosing `NavigationStack`'s path",
            "A callback invoked after the view disappears",
          ],
          correctIndex: 0,
          explanation:
            "It is the context-aware way for a child to close itself without knowing how it was presented. Manipulating the path is for the owner of the stack, not the presented screen.",
        },
        {
          id: "swift-ui-lists-navigation-q8",
          prompt: "What does `Identifiable` require, and why does `List` care?",
          options: [
            "An `id` property that is `Hashable` and stable for the same logical item, so SwiftUI can match rows across updates",
            "Conformance to `Equatable`, so SwiftUI can compare whole rows",
            "A `hashValue` recomputed each update, so changed rows get new identities",
            "An integer index into the source collection",
          ],
          correctIndex: 0,
          explanation:
            "Stability is the requirement people get wrong: an id derived from mutable content changes when the content changes, which SwiftUI reads as a delete plus an insert.",
        },
        {
          id: "swift-ui-lists-navigation-q9",
          prompt: "What is the right structure for a tab-based app where each tab has its own navigation history?",
          options: [
            "A `NavigationStack` inside each tab's content",
            "One `NavigationStack` wrapping the whole `TabView`",
            "A single `NavigationSplitView` with the tabs as the sidebar",
            "A `NavigationStack` per tab plus one wrapping the `TabView`",
          ],
          correctIndex: 0,
          explanation:
            "Each tab keeps its own path, which is what users expect when switching tabs. Wrapping the whole `TabView` gives one shared history, and the tab bar ends up inside the pushed screens.",
        },
        {
          id: "swift-ui-lists-navigation-q10",
          prompt: "You need `onDelete` swipe-to-delete on a dynamic list. What must be true?",
          options: [
            "The `onDelete` modifier is applied to a `ForEach` inside a `List`, and the closure removes the items at the given `IndexSet`",
            "The modifier is applied to the `List` itself",
            "The rows must be wrapped in `.swipeActions` first",
            "The data source must conform to `RangeReplaceableCollection` and `Identifiable`",
          ],
          correctIndex: 0,
          explanation:
            "`onDelete` is a `ForEach` modifier and hands you an `IndexSet` into the collection the `ForEach` iterated. `.swipeActions` is the more general, custom alternative.",
        },
      ],
    },
    {
      id: "swift-ui-animation",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "Animation and Transitions",
      summary:
        "SwiftUI does not animate code, it animates *values*. When state changes, SwiftUI computes the new view description, finds the animatable properties that differ — position, size, opacity, colour, anything conforming to `Animatable` — and interpolates between the old and new rendered values over time. You never write a frame loop; you declare that a change should be animated and the framework tweens it.\n\nThere are two ways to declare it, and they answer different questions. `withAnimation { isExpanded.toggle() }` is explicit: *this state change* and everything that depends on it should animate. `.animation(_:value:)` is implicit and scoped: *this view and its children* animate whenever `value` changes. The no-argument `.animation(_)` is deprecated precisely because it animated everything downstream, including changes you never intended.\n\nThe distinction people miss is animation versus **transition**. Animation interpolates a property of a view that continues to exist. A transition describes how a view appears or disappears — and that only happens when its *identity* changes, so `.transition(.slide)` on a view inside an `if` needs the state change that flips the `if` to be animated, or nothing happens at all. Modifier order matters here too: modifiers applied after `.animation(_:value:)` are outside its scope. And since iOS 17, springs are the default curve family (`.smooth`, `.snappy`, `.bouncy`), which is worth knowing before you reach for `.easeInOut` out of habit.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Apple: Animations", url: "https://developer.apple.com/documentation/swiftui/animations", kind: "docs" },
        { label: "Apple: Transition", url: "https://developer.apple.com/documentation/swiftui/transition", kind: "docs" },
        {
          label: "Hacking with Swift: How to create an explicit animation",
          url: "https://www.hackingwithswift.com/quick-start/swiftui/how-to-create-an-explicit-animation",
          kind: "article",
        },
        {
          label: "Hacking with Swift: Animating bindings",
          url: "https://www.hackingwithswift.com/books/ios-swiftui/animating-bindings",
          kind: "article",
        },
      ],
      video: {
        title: "WWDC23: Explore SwiftUI animation | Apple",
        channel: "Apple Developer",
        url: "https://www.youtube.com/watch?v=IuSuHJs5-KE",
        videoId: "IuSuHJs5-KE",
        durationLabel: "30:01",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-ui-animation-q1",
          prompt: "What is the difference between `withAnimation { … }` and `.animation(_:value:)`?",
          options: [
            "`withAnimation` animates everything caused by that state change; `.animation(_:value:)` animates this view and its children whenever the given value changes",
            "`withAnimation` is for transitions and `.animation` is for property changes",
            "`withAnimation` runs on the main actor and `.animation` runs on the render thread",
            "They are equivalent; `withAnimation` is the older spelling",
          ],
          correctIndex: 0,
          explanation:
            "One scopes by *cause* (the mutation), the other by *place* (the subtree) and by which value it watches. Mixing them unintentionally is how a single toggle ends up animating half the screen.",
        },
        {
          id: "swift-ui-animation-q2",
          prompt: "Why does `.transition(.slide)` on a view inside an `if` sometimes do nothing?",
          options: [
            "A transition only runs when the identity change is itself animated — the state flip must happen inside `withAnimation` or be covered by an `.animation(_:value:)`",
            "`.slide` is only supported on `List` rows",
            "Transitions require the view to conform to `Animatable`",
            "The transition must be applied to the `if` statement's container, not the view",
          ],
          correctIndex: 0,
          explanation:
            "Insertion and removal are driven by identity changes, and an unanimated identity change is instantaneous. The transition describes *how* to animate; something still has to say *that* it animates.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-animation-q3",
          prompt: "Which of these are animatable by SwiftUI? (Select all that apply.)",
          options: [
            "A view's frame and offset",
            "Opacity and foreground colour",
            "A custom `Shape`'s parameter exposed through `animatableData`",
            "A `Text` view's string content",
            "The number of children in a `VStack`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "SwiftUI interpolates values that conform to `VectorArithmetic`. A string has no midpoint, and adding or removing children is an identity change — a transition, not an interpolation.",
        },
        {
          id: "swift-ui-animation-q4",
          prompt: "What does `.animation(.easeInOut, value: isOn)` watch?",
          options: [
            "Changes to `isOn` specifically — other state changes affecting the same view are not animated by this modifier",
            "Any change to the view, with `isOn` used only to pick the duration",
            "Changes to `isOn` in any view in the hierarchy, not just this subtree",
            "Nothing at runtime; the `value:` argument is only for diagnostics",
          ],
          correctIndex: 0,
          explanation:
            "The `value:` parameter was added because the old parameterless form animated every downstream change. Scoping to one value makes the intent explicit and the behaviour predictable.",
        },
        {
          id: "swift-ui-animation-q5",
          prompt: "Why does modifier order matter for `.animation(_:value:)`?",
          options: [
            "The modifier applies to the view it wraps, so modifiers written after it are outside its scope and are not animated",
            "It does not — `.animation` is hoisted to the top of the modifier chain",
            "Because `.animation` must be the last modifier or it is ignored",
            "Because only the first `.animation` in a chain is honoured",
          ],
          correctIndex: 0,
          explanation:
            "Everything in SwiftUI's modifier chain wraps, and `.animation` is no exception. `.offset(x).animation(a, value: x)` animates the offset; `.animation(a, value: x).offset(x)` does not.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-animation-q6",
          prompt: "What does `matchedGeometryEffect` do?",
          options: [
            "Links two views in the same namespace by id so SwiftUI interpolates one's frame into the other's, producing a hero effect",
            "Forces two views to have exactly the same size at all times",
            "Measures a view's geometry and publishes it through a preference key",
            "Synchronises the animation curves of two independent views",
          ],
          correctIndex: 0,
          explanation:
            "Only one of the matched pair should be present at a time in the classic hero case. On iOS 18, `NavigationTransition.zoom` covers the common push-from-a-card version without the manual namespace work.",
        },
        {
          id: "swift-ui-animation-q7",
          prompt: "What does `$isOn.animation()` on a binding do?",
          options: [
            "Any write through that binding animates, which is how you animate a change driven by a control such as a `Toggle`",
            "It animates only the binding's initial read",
            "It converts the binding into an `Animation` value",
            "It debounces writes to the binding to one per frame",
          ],
          correctIndex: 0,
          explanation:
            "It moves the `withAnimation` to where the write happens, which is useful when the write is inside a framework control you do not control.",
        },
        {
          id: "swift-ui-animation-q8",
          prompt: "Since iOS 17, what is the default animation family in SwiftUI?",
          options: [
            "Springs — `.smooth`, `.snappy` and `.bouncy`, with `.spring(duration:bounce:)` for custom ones",
            "`.easeInOut` with a 0.35-second duration",
            "`.linear`, to keep animations frame-accurate",
            "There is no default; every animation must be specified explicitly",
          ],
          correctIndex: 0,
          explanation:
            "Springs are interruptible and preserve velocity, which is why they feel right for gesture-driven UI. The duration/bounce parameterisation replaced having to reason about mass, stiffness and damping.",
        },
        {
          id: "swift-ui-animation-q9",
          prompt: "A view animates its position correctly but its text changes abruptly halfway through. Why?",
          options: [
            "The string has no interpolable representation, so SwiftUI swaps it at the animation's midpoint rather than tweening it",
            "Text rendering runs on a separate thread that ignores the animation clock",
            "The `Text` view is missing `.animation(_:value:)`",
            "The font has not been loaded yet when the animation starts",
          ],
          correctIndex: 0,
          explanation:
            "Only `VectorArithmetic` values interpolate. If you want a visible change of content, cross-fade two views with a transition, or give them different identities so a transition applies.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-animation-q10",
          prompt: "How would you animate a custom `Shape` whose path depends on a `progress: Double`?",
          options: [
            "Conform the shape to `Animatable` and expose `progress` through `animatableData`",
            "Wrap the shape in `withAnimation` each time `progress` changes",
            "Apply `.animation(_:value: progress)` — shapes are animated automatically",
            "Rebuild the shape on a `Timer` at 60 Hz",
          ],
          correctIndex: 0,
          explanation:
            "SwiftUI needs a value it can interpolate and feed back into `path(in:)`. `animatableData` is that channel; without it the shape jumps between its start and end states.",
        },
      ],
    },
    {
      id: "swift-ui-uikit-interop",
      moduleId: "mobile-swift-swiftui",
      trackId: "mobile",
      title: "UIKit Interop with `UIViewRepresentable`",
      summary:
        "SwiftUI is the recommended framework for new UI, but a large amount of iOS surface area predates it or is still only exposed through UIKit — `WKWebView`, PDFKit, camera capture, the full `UITextView` editing API, and any in-house component a team has been maintaining for a decade. `UIViewRepresentable` and `UIViewControllerRepresentable` are the bridge, and they are supported, first-class API rather than an escape hatch to feel bad about.\n\nThe protocol has a shape that maps onto SwiftUI's model exactly: `makeUIView(context:)` runs once to create the object, and `updateUIView(_:context:)` runs whenever SwiftUI's state says the view should change. That split is the whole contract — the representable *struct* is recreated constantly like any other view, so it must hold no state; anything that must persist lives in the UIKit object or in the `Coordinator` returned from `makeCoordinator()`. The coordinator is also where delegates and target-action handlers go, because it is the object with a stable lifetime that can own them.\n\nTwo failure modes are worth anticipating. First, `updateUIView` is called more often than the value actually changes, so blindly assigning `textView.text = text` resets the selection and makes the cursor jump — guard every write with a comparison. Second, writing SwiftUI state from inside `updateUIView` can loop: the write invalidates the view, which calls `updateUIView` again. Route changes back through a `@Binding` from a delegate callback, not from the update pass. On sizing, a UIKit view brings its intrinsic content size and its hugging/compression priorities; implementing `sizeThatFits(_:uiView:context:)` is how you make it participate properly in SwiftUI's proposal-and-choose layout.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        {
          label: "Apple: UIViewRepresentable",
          url: "https://developer.apple.com/documentation/swiftui/uiviewrepresentable",
          kind: "docs",
        },
        {
          label: "Apple: UIHostingController",
          url: "https://developer.apple.com/documentation/swiftui/uihostingcontroller",
          kind: "docs",
        },
        {
          label: "Hacking with Swift: How to wrap a custom UIView for SwiftUI",
          url: "https://www.hackingwithswift.com/quick-start/swiftui/how-to-wrap-a-custom-uiview-for-swiftui",
          kind: "article",
        },
        {
          label: "Hacking with Swift: Migrating from UIKit to SwiftUI",
          url: "https://www.hackingwithswift.com/quick-start/swiftui/migrating-from-uikit-to-swiftui",
          kind: "article",
        },
      ],
      video: {
        title: "Use UIViewRepresentable to convert UIKit views to SwiftUI | Advanced Learning #13",
        channel: "Swiftful Thinking",
        url: "https://www.youtube.com/watch?v=1GYKyQHVDWw",
        videoId: "1GYKyQHVDWw",
        durationLabel: "28:25",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "swift-ui-uikit-interop-q1",
          prompt: "How often are `makeUIView(context:)` and `updateUIView(_:context:)` called?",
          options: [
            "`makeUIView` once per view identity; `updateUIView` on every update SwiftUI decides is relevant",
            "Both once, when the view first appears",
            "`makeUIView` on every update and `updateUIView` only when the bound values change",
            "Both on every frame while the view is visible",
          ],
          correctIndex: 0,
          explanation:
            "The split mirrors SwiftUI's own model: creation is tied to identity, updating is tied to state. Putting creation work in `updateUIView` means rebuilding the UIKit object repeatedly.",
        },
        {
          id: "swift-ui-uikit-interop-q2",
          prompt: "Where should a `UITextViewDelegate` implementation live?",
          options: [
            "In the `Coordinator` returned by `makeCoordinator()`, which the representable retains",
            "In the representable struct itself, which conforms to the delegate protocol",
            "In the SwiftUI parent view, passed in as a closure",
            "In the `UITextView` subclass, as an override",
          ],
          correctIndex: 0,
          explanation:
            "Delegates are held weakly, so the delegate needs an owner with a stable lifetime. The struct is recreated constantly and cannot be that owner — and it is a value type, so it could not be referenced weakly anyway.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-uikit-interop-q3",
          prompt: "A wrapped `UITextView`'s cursor jumps to the end while typing. What is the usual cause?",
          options: [
            "`updateUIView` assigns `uiView.text = text` unconditionally, which resets the selected range even when the text is unchanged",
            "The coordinator is being recreated on each update",
            "The binding is being written from a background thread",
            "`makeUIView` is being called on every keystroke",
          ],
          correctIndex: 0,
          explanation:
            "`updateUIView` runs more often than the value changes. Guarding with `if uiView.text != text` is the fix, and it generalises: every write in `updateUIView` should be conditional.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-uikit-interop-q4",
          prompt: "Which of these belong in the `Coordinator` rather than the representable struct? (Select all that apply.)",
          options: [
            "Delegate and data-source conformances",
            "Target-action selectors for UIKit controls",
            "A reference to the parent representable so callbacks can write back through its `@Binding`",
            "The `@Binding` property the SwiftUI parent passes in",
            "The `makeUIView` implementation",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The coordinator is the long-lived object: it owns callbacks and holds a reference back to the current struct. The bindings and the protocol methods stay on the struct.",
        },
        {
          id: "swift-ui-uikit-interop-q5",
          prompt: "Why can writing SwiftUI state directly inside `updateUIView` cause an infinite loop?",
          options: [
            "The write invalidates the view, which triggers another update pass, which writes again",
            "`updateUIView` is called recursively by UIKit's layout pass",
            "State writes from `updateUIView` are queued and replayed on every frame",
            "It cannot loop; SwiftUI coalesces writes during an update",
          ],
          correctIndex: 0,
          explanation:
            "The update pass must be a function of state, not a producer of it. Changes should flow back from delegate callbacks, which happen outside the update pass.",
        },
        {
          id: "swift-ui-uikit-interop-q6",
          prompt: "What decides a wrapped UIKit view's size inside a SwiftUI layout?",
          options: [
            "Its intrinsic content size and content hugging/compression priorities, unless you implement `sizeThatFits(_:uiView:context:)`",
            "SwiftUI always stretches it to the full proposed size",
            "It is always zero-sized until you add an explicit `.frame`",
            "Auto Layout constraints added inside `makeUIView` are the only thing that matters",
          ],
          correctIndex: 0,
          explanation:
            "`sizeThatFits` (iOS 16) is how the representable participates in the proposal-and-choose negotiation properly. Without it you are relying on UIKit's own sizing rules, which is often why a wrapped view ends up too big or too small.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "swift-ui-uikit-interop-q7",
          prompt: "How do you embed SwiftUI inside an existing UIKit screen?",
          options: [
            "Wrap the SwiftUI view in a `UIHostingController` and add it as a child view controller",
            "Call `SwiftUIView().makeUIView()` and add the result as a subview",
            "Conform the SwiftUI view to `UIViewRepresentable` in reverse",
            "Use `UIView(swiftUI:)`, added in iOS 16",
          ],
          correctIndex: 0,
          explanation:
            "`UIHostingController` is the other half of the bridge and is how incremental migrations work — one screen, or even one cell, at a time.",
        },
        {
          id: "swift-ui-uikit-interop-q8",
          prompt: "What does `context.environment` give a representable?",
          options: [
            "The SwiftUI environment values in effect at that point, such as colour scheme, layout direction and dynamic type size",
            "The UIKit trait collection of the hosting window",
            "A dictionary of the representable's own stored properties",
            "The coordinator, under a different name",
          ],
          correctIndex: 0,
          explanation:
            "Reading it in `updateUIView` is how a wrapped view honours dark mode, right-to-left layout and accessibility text sizes instead of ignoring them.",
        },
        {
          id: "swift-ui-uikit-interop-q9",
          prompt: "Why must the representable struct itself hold no mutable state?",
          options: [
            "It is a `View` value that SwiftUI recreates on every update, so anything stored in it is discarded",
            "SwiftUI marks representables as immutable to guarantee thread safety",
            "Mutable properties would prevent the struct from conforming to `UIViewRepresentable`",
            "UIKit objects cannot be referenced from a struct",
          ],
          correctIndex: 0,
          explanation:
            "It obeys exactly the same rule as any other SwiftUI view. Durable state goes in the UIKit object, the coordinator, or SwiftUI state passed in as a binding.",
        },
        {
          id: "swift-ui-uikit-interop-q10",
          prompt: "When is reaching for `UIViewRepresentable` the right call today?",
          options: [
            "When the capability has no SwiftUI equivalent, or the SwiftUI version lacks control you need — web views, advanced text editing, camera capture, an existing in-house component",
            "Whenever a layout is hard to express in SwiftUI, since UIKit's Auto Layout is more capable",
            "For any view that needs to be performant, since SwiftUI adds overhead to every view",
            "Only when targeting iOS versions before SwiftUI's `NavigationStack`",
          ],
          correctIndex: 0,
          explanation:
            "Bridge for missing capability, not for familiarity. Reaching for it to avoid learning SwiftUI's layout model produces a hybrid that is harder to maintain than either framework alone.",
        },
      ],
    },
  ],
} satisfies Module;
