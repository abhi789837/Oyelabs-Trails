import type { Module } from "@/types/curriculum";

export default {
  id: "mobile-cross-cutting",
  trackId: "mobile",
  name: "Mobile Cross-Cutting Concerns",
  description:
    "Everything a mobile team needs that is not the UI framework: layering, persistence, sync, transport security, secrets, auth, testing, signing, rollout, observability and privacy. Framework-agnostic on purpose — the decisions here outlive whichever of Compose, SwiftUI, Flutter or React Native you picked.",
  refs: [
    { label: "Android Developers: Guide to app architecture", url: "https://developer.android.com/topic/architecture", kind: "docs" },
    { label: "OWASP MASVS: Storage", url: "https://mas.owasp.org/MASVS/05-MASVS-STORAGE/", kind: "docs" },
    { label: "Apple: User Privacy and Data Use", url: "https://developer.apple.com/app-store/user-privacy-and-data-use/", kind: "docs" },
    { label: "Play Console Help: Release app updates with staged rollouts", url: "https://support.google.com/googleplay/android-developer/answer/6346149", kind: "docs" },
  ],
  topics: [
    {
      id: "mob-x-architecture",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "Layering a Mobile App: Presentation, Domain, Data",
      summary:
        "Web apps tolerate weak layering because the process is cheap to restart: a bad render is one refresh away and the server holds the truth. Mobile removes both escapes. The process can be killed and recreated at any moment with the user expecting to land back where they were, the device is frequently the only copy of a write, and a fix ships behind a review queue and a staged rollout rather than a redeploy. That combination is what pushes mobile teams toward explicit layers far earlier than a web team of the same size would bother.\n\nThe standard shape is three layers with a one-way dependency rule. The **data layer** owns repositories: it decides whether an answer comes from the network, the local database or a cache, and it is the only layer that knows a network exists. The optional **domain layer** holds use cases — business rules that are functions of their inputs, reusable across screens, testable without a device. The **presentation layer** holds state holders (a ViewModel, a store, a bloc — the name changes, the job does not) that expose one immutable state object per screen and receive events back. Dependencies point inward: presentation knows domain, domain knows data interfaces, and nothing points back out.\n\nThe payoff is not purity, it is the two things mobile makes hard. Process death becomes survivable because screen state is a serialisable object owned by something outside the view, not scattered across widget fields. And offline becomes possible because \"where did this data come from\" is a single decision in one repository rather than a fetch call in forty components.\n\nThe gotcha is the opposite failure: a four-file ceremony for a screen that shows a static list. Layers cost indirection, and indirection has to be paid for by testability, reuse, or a genuine swap of implementation. Add the domain layer when two screens need the same rule or a rule is worth testing on its own; a use case that only forwards to a repository is a file you will maintain forever for nothing.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Android Developers: Guide to app architecture", url: "https://developer.android.com/topic/architecture", kind: "docs" },
        { label: "Android Developers: The domain layer", url: "https://developer.android.com/topic/architecture/domain-layer", kind: "docs" },
        { label: "Martin Fowler: Presentation Domain Data Layering", url: "https://martinfowler.com/bliki/PresentationDomainDataLayering.html", kind: "article" },
      ],
      video: {
        title: "The Ultimate Beginner's Roadmap to Android App Architecture",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=-QExSMcBvOg",
        videoId: "-QExSMcBvOg",
        durationLabel: "14:57",
      },
      alternateVideos: [
        {
          title: "Architecture: The data layer - MAD Skills",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=r5AseKQh2ZE",
          videoId: "r5AseKQh2ZE",
          durationLabel: "7:29",
        },
        {
          title: "Architecture: The Domain Layer - MAD Skills",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=gIhjCh3U88I",
          videoId: "gIhjCh3U88I",
          durationLabel: "8:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-x-architecture-q1",
          prompt: "In the standard presentation/domain/data layering, which direction do dependencies point?",
          options: [
            "Presentation depends on domain, domain depends on data abstractions; nothing depends outward",
            "Data depends on presentation, so repositories can push updates into the UI",
            "Every layer depends on every other layer through a shared service locator",
            "Domain depends on presentation so use cases can read the current screen state",
          ],
          correctIndex: 0,
          explanation:
            "The one-way rule is what makes the inner layers testable without a device or a UI toolkit. Letting data depend on presentation drags the UI framework into your business rules, which is exactly what the layering exists to prevent.",
        },
        {
          id: "mob-x-architecture-q2",
          prompt: "Which responsibility belongs in the data layer rather than the presentation layer?",
          options: [
            "Deciding whether a list is served from the local database or refetched from the API",
            "Deciding whether the empty state or the list is rendered",
            "Deciding which screen to navigate to after a button press",
            "Deciding how a date is formatted for the current locale",
          ],
          correctIndex: 0,
          explanation:
            "\"Where does this data come from\" is the repository's single job, and centralising it is what makes offline-first possible. The other three are presentation decisions driven by the state the data layer produced.",
        },
        {
          id: "mob-x-architecture-q3",
          prompt: "Why does process death make mobile architecture stricter than a typical web SPA's?",
          options: [
            "The OS can kill a backgrounded app and later recreate it expecting the same screen, so screen state must live somewhere serialisable outside the view",
            "Killed processes corrupt the local database, so all writes must be in-memory only",
            "The OS forbids holding any state in memory while backgrounded",
            "Recreated processes get a new user identity, so state cannot be reused",
          ],
          correctIndex: 0,
          explanation:
            "Restoration is the requirement: the user returns and expects their half-filled form back. That is only tractable when screen state is one object held by a state holder, not a hundred fields scattered through the view tree.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-architecture-q4",
          prompt: "A team adds a use case class for every repository method, each one a single forwarding call. What is the honest assessment?",
          options: [
            "It is cost without benefit; add use cases when a rule is shared or worth testing alone",
            "It is correct: a use case per repository method is what layered architecture requires",
            "It improves runtime performance by flattening the call stack",
            "It is required for the presentation layer to compile against the data layer",
          ],
          correctIndex: 0,
          explanation:
            "Android's own domain-layer guidance describes the layer as optional, for reusable or complex logic. Pass-through use cases add files and indirection while testing nothing the repository test did not already cover.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-architecture-q5",
          prompt: "Which of these are genuine reasons a mobile app benefits from layering more than an equivalent server-rendered web app? (Select all that apply.)",
          options: [
            "The device is often the only copy of an unsynced write",
            "The app can be killed and recreated mid-flow and must restore",
            "A fix ships through review and a rollout, not a redeploy",
            "Mobile languages cannot express dependency inversion without layers",
            "Layering is required by both app stores' review guidelines",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are real structural pressures unique to shipping a client that holds data and cannot be hot-fixed. Neither store reviews your architecture, and dependency inversion is a language-level idea available everywhere.",
        },
        {
          id: "mob-x-architecture-q6",
          prompt: "A state holder exposes a stream of immutable state objects and accepts events. What concrete problem does the immutability solve?",
          options: [
            "Rendering becomes a function of one value, so a half-applied update can never be drawn",
            "It removes the need for a data layer, since state is already the source of truth",
            "It guarantees the state survives process death without any serialisation",
            "It makes the app thread-safe without any concurrency discipline",
          ],
          correctIndex: 0,
          explanation:
            "One value in, one frame out — there is no window where two mutated fields disagree. Immutability does not persist anything for you and does not remove the need to reason about which thread produces the next state.",
        },
        {
          id: "mob-x-architecture-q7",
          prompt: "Where should the policy \"show cached data immediately, then refresh in the background\" be expressed?",
          options: [
            "In the repository, which emits cached data first and then the refreshed result",
            "In each screen's view code, which calls the cache and then the API",
            "In the networking client's interceptor chain",
            "In the navigation graph, as two separate destinations",
          ],
          correctIndex: 0,
          explanation:
            "Stale-while-revalidate is a data-source policy, so it belongs where the sources meet. Duplicating it per screen is how apps end up with four subtly different caching behaviours for the same entity.",
        },
        {
          id: "mob-x-architecture-q8",
          prompt: "Which statement about testing is true for a well-layered mobile app?",
          options: [
            "Domain and data logic can run as plain unit tests on the host machine, with no emulator or simulator",
            "All meaningful tests require an emulator, because the layers depend on platform APIs",
            "Layering removes the need for UI tests entirely",
            "Repositories can only be tested against a real backend",
          ],
          correctIndex: 0,
          explanation:
            "Keeping platform types out of the inner layers is precisely what buys you fast host-machine tests. UI tests are still needed — layering shrinks how many you need, it does not eliminate them.",
        },
        {
          id: "mob-x-architecture-q9",
          prompt: "A repository returns the networking library's own response type straight to the ViewModel. What is the most important consequence?",
          options: [
            "The networking library has leaked into the presentation layer, so swapping it or adding a local source now touches every screen",
            "Nothing: the ViewModel can simply ignore the fields it does not need",
            "The app will fail review for exposing network internals",
            "Responses become unserialisable, so process death restoration breaks",
          ],
          correctIndex: 0,
          explanation:
            "A leaked transport type turns \"change the HTTP client\" or \"serve this offline\" into a cross-cutting refactor. Mapping to a domain model at the repository boundary is the small, boring tax that prevents it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-architecture-q10",
          prompt: "Which of these belong in a state holder rather than in the view itself? (Select all that apply.)",
          options: [
            "Which items are currently selected",
            "Whether a request is in flight",
            "The validation result for a form field",
            "The scroll position of a lazy list that the toolkit already restores",
            "The measured pixel height of a rendered row",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Selection, loading and validation are screen state that must survive recreation and drive rendering. Scroll position is usually already restored by the toolkit, and measured geometry is a rendering detail the state holder should never know.",
        },
      ],
    },
    {
      id: "mob-x-dependency-injection",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "Dependency Injection and the Composition Root",
      summary:
        "Dependency injection is one idea with a lot of ceremony around it: a component declares what it needs instead of constructing it. The value on mobile is not decoupling for its own sake — it is that the graph of \"which implementation, with which configuration, living how long\" is the difference between an app you can test on a laptop and one that needs a device, a real backend and a staging account before a single assertion runs.\n\nThree approaches show up. **Manual construction** at a composition root — one place near app startup that builds the object graph and hands it down — is free, explicit, and perfectly adequate for a small app; its cost is the wiring boilerplate that grows with the graph. A **container or framework** (Hilt/Dagger and Koin on Android, swinject or plain initialiser injection on iOS, GetIt and Riverpod in Flutter, context providers in React Native) generates or resolves that wiring. **Service locators** — a global registry components reach into — look like DI but invert the benefit: a class's dependencies are no longer visible in its signature, so you discover them by running it and watching it crash.\n\nScoping is where mobile differs from the server. A server has request scope and singleton scope. A mobile app has application scope, a scope per logged-in user (which must be torn down completely on logout), a scope per screen or navigation graph, and objects whose lifetime is tied to a view that the OS can destroy and recreate. Getting the user scope wrong is a security bug, not a style issue: the next person to sign in inherits the previous user's cached repository.\n\nThe gotcha is startup cost. An eagerly-constructed graph runs on the main thread before your first frame, so a DI setup that opens a database, warms a network client and initialises three SDKs at application start shows up directly in cold-start numbers. Prefer lazy providers, and keep anything that touches disk or the network out of the critical path to first frame.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Android Developers: Dependency injection in Android", url: "https://developer.android.com/training/dependency-injection", kind: "docs" },
        { label: "Android Developers: Manual dependency injection", url: "https://developer.android.com/training/dependency-injection/manual", kind: "docs" },
        { label: "Martin Fowler: Inversion of Control Containers and the Dependency Injection pattern", url: "https://martinfowler.com/articles/injection.html", kind: "article" },
        { label: "Hilt documentation", url: "https://dagger.dev/hilt/", kind: "docs" },
      ],
      video: {
        title: "Dependency Injection, The Best Pattern",
        channel: "CodeAesthetic",
        url: "https://www.youtube.com/watch?v=J1f5b4vcxCQ",
        videoId: "J1f5b4vcxCQ",
        durationLabel: "13:15",
      },
      alternateVideos: [
        {
          title: "Hilt and dependency injection - MAD Skills",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=1Zt6aIqZnqU",
          videoId: "1Zt6aIqZnqU",
          durationLabel: "13:05",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-x-dependency-injection-q1",
          prompt: "What is a composition root?",
          options: [
            "The single place, near app startup, where the object graph is assembled",
            "The base class every injectable type must extend",
            "The root of the navigation hierarchy",
            "A generated file that lists every annotation in the project",
          ],
          correctIndex: 0,
          explanation:
            "Assembling in one place keeps every other class ignorant of how its collaborators are built. It is a location in your code, not a base class or a generated artefact.",
        },
        {
          id: "mob-x-dependency-injection-q2",
          prompt: "Why is a global service locator usually considered worse than constructor injection, even though both remove `new` calls from the class?",
          options: [
            "A class's dependencies stop being visible in its signature, so they are discovered by running it and watching it fail",
            "Service locators cannot return singletons",
            "Service locators are forbidden by both app stores",
            "Constructor injection is faster at runtime in every case",
          ],
          correctIndex: 0,
          explanation:
            "Honest constructors are the point: the compiler and the reader both see what a class needs. A locator hides that, and the failure mode is a missing registration at runtime rather than at build time.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-dependency-injection-q3",
          prompt: "A repository holding the signed-in user's cached data is registered as an application-wide singleton. The user logs out and a different account logs in. What is the bug?",
          options: [
            "The new user inherits the previous user's cached data, because nothing tore the object down",
            "The repository leaks memory but the data is correct",
            "The new session cannot construct the repository at all",
            "Nothing: singletons are re-created automatically on logout",
          ],
          correctIndex: 0,
          explanation:
            "Session-scoped state needs a session scope that is destroyed on logout. This is a data-leak class of bug, which is why \"which scope\" is a security question, not a style preference.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-dependency-injection-q4",
          prompt: "Which of these are legitimate reasons to inject a dependency rather than construct it inline? (Select all that apply.)",
          options: [
            "A test needs to substitute a fake implementation",
            "The object is expensive and should be shared",
            "Debug and release builds need different implementations",
            "It makes the class file shorter",
            "It removes the need to think about object lifetimes",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Substitution, sharing and build-variant differences are the three reasons that actually pay for the indirection. DI makes lifetimes more explicit, not less, and brevity is not a design argument.",
        },
        {
          id: "mob-x-dependency-injection-q5",
          prompt: "How can an eagerly-built dependency graph hurt cold start?",
          options: [
            "Constructing everything at application start runs on the main thread before the first frame",
            "The graph is rebuilt on every screen navigation",
            "Dependency resolution blocks the GPU thread",
            "It forces the OS to re-verify the app signature",
          ],
          correctIndex: 0,
          explanation:
            "Anything constructed at startup is startup work, and SDK initialisers that open databases or network clients are the usual culprits. Lazy providers keep that work off the path to first frame.",
        },
        {
          id: "mob-x-dependency-injection-q6",
          prompt: "Which scope is the right home for an object that must be recreated when the user navigates away from a screen and back?",
          options: [
            "A screen or navigation-destination scope",
            "Application scope",
            "Session scope",
            "No scope: construct it in the view's render method",
          ],
          correctIndex: 0,
          explanation:
            "Matching the object's lifetime to the screen's is the whole job of scoping. Application or session scope would keep stale screen state alive; constructing in render would rebuild it on every frame.",
        },
        {
          id: "mob-x-dependency-injection-q7",
          prompt: "A compile-time DI framework (such as Dagger/Hilt) is chosen over a runtime one. What is the main practical trade-off?",
          options: [
            "Missing bindings fail the build instead of failing at runtime, at the cost of build time and generated code",
            "It removes the need to define scopes",
            "It works only with Kotlin, never Java",
            "It guarantees a smaller binary than runtime resolution",
          ],
          correctIndex: 0,
          explanation:
            "Moving the failure from runtime to build time is the core benefit, and slower builds plus generated sources are the price. Scopes still have to be designed either way.",
        },
        {
          id: "mob-x-dependency-injection-q8",
          prompt: "You need a different analytics implementation in debug builds (log to console) and release builds (send to the backend). What is the cleanest approach?",
          options: [
            "Depend on an `Analytics` interface and bind a different implementation per build variant at the composition root",
            "Check a debug flag inside every call site",
            "Ship both implementations and pick one with a runtime feature flag fetched at launch",
            "Use `#if DEBUG` inside the production implementation",
          ],
          correctIndex: 0,
          explanation:
            "One binding decision at the root beats a conditional at every call site or inside the implementation. A remote flag would be worse: it makes local debugging depend on a network fetch.",
        },
        {
          id: "mob-x-dependency-injection-q9",
          prompt: "A class takes nine constructor dependencies. What is the most useful reading of that?",
          options: [
            "It is a design smell about the class's responsibilities, not a reason to switch to a locator",
            "It is normal; DI frameworks handle any number of parameters",
            "It proves the graph is not scoped correctly",
            "It means the class should be a singleton",
          ],
          correctIndex: 0,
          explanation:
            "A long constructor is honest feedback that the class does too much; the fix is to split it. Hiding the parameters behind a locator removes the signal without removing the problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-dependency-injection-q10",
          prompt: "Which of these make a dependency genuinely easy to fake in tests? (Select all that apply.)",
          options: [
            "It is referenced through an interface or protocol the test can implement",
            "It is passed in rather than created inside the class",
            "Its methods avoid touching global singletons such as the current time or a shared file path",
            "It is annotated for the DI framework",
            "It is declared as a singleton",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Substitutability comes from an abstraction, from injection, and from not reaching out to ambient global state. Annotations and singleton-ness are wiring details that do nothing for testability on their own.",
        },
      ],
    },
    {
      id: "mob-x-local-persistence",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "Choosing Local Persistence: Key-Value, SQLite, Object Store",
      summary:
        "Every mobile platform gives you the same four shapes of local storage, and the choice between them is usually made badly — once, early, by whoever wrote the first screen. A **key-value store** (UserDefaults on Apple platforms, SharedPreferences or DataStore on Android) is for small, flat settings: it is loaded whole into memory, so a multi-megabyte JSON blob shoved into a preference key becomes a permanent memory and startup cost. A **relational store** (SQLite, reached through Room, SQLDelight, Core Data, GRDB, Drift) is the right default for anything list-shaped, because queries, indexes and partial updates are exactly what a list screen needs. An **object store** (Realm, SwiftData, ObjectBox) removes the mapping layer and gives you live, observable objects, at the price of a vendor format and weaker ad-hoc querying. And the **file system** is for blobs: store the bytes on disk and only the path in the database.\n\nThe question that decides it is not \"which is fastest\" but \"what will I need to ask of this data in two years\". A key-value store cannot answer \"the twenty most recent unsynced orders for this account, newest first\" without loading everything. SQLite can, and adding that index later costs nothing. Pick the relational store whenever the data has more than one dimension.\n\nTwo platform details catch people out. First, the OS distinguishes **cache** directories from **documents** directories: anything you write to a cache directory can be purged while the app is not running, and on Apple platforms files in the documents directory are backed up to iCloud unless you explicitly exclude them — which is how apps end up rejected for backing up hundreds of megabytes of regenerable data. Second, everything you write is subject to the platform's file-level encryption and backup rules, which is why secrets never belong here (see the Keychain and Keystore topic).\n\nThe gotcha is migration. The database is on the user's device and you cannot run a script against it. A user can skip five versions, so migration code must carry every path you have ever shipped; \"drop and recreate\" destroys unsynced writes; and a migration that throws on launch is an unrecoverable crash loop that only a new build can fix. Test migrations against real fixtures of every shipped schema, in CI.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Android Developers: Data and file storage overview", url: "https://developer.android.com/training/data-storage", kind: "docs" },
        { label: "SQLite: Appropriate Uses For SQLite", url: "https://www.sqlite.org/whentouse.html", kind: "docs" },
        { label: "Apple: UserDefaults", url: "https://developer.apple.com/documentation/foundation/userdefaults", kind: "docs" },
        { label: "Android Developers: DataStore", url: "https://developer.android.com/topic/libraries/architecture/datastore", kind: "docs" },
      ],
      video: {
        title: "Everything about storage on Android",
        channel: "Android Developers",
        url: "https://www.youtube.com/watch?v=jcO6p5TlcGs",
        videoId: "jcO6p5TlcGs",
        durationLabel: "12:17",
      },
      alternateVideos: [
        {
          title: "Introduction to DataStore - MAD Skills",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=mdQjuZbLv9Y",
          videoId: "mdQjuZbLv9Y",
          durationLabel: "6:45",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-x-local-persistence-q1",
          prompt: "An app stores a 4 MB JSON array of cached products in a single preferences key. What is the main cost?",
          options: [
            "Key-value stores are loaded whole into memory, so the blob is paid for on every launch and every read",
            "Preferences keys are limited to 64 KB, so the write silently fails",
            "The data is stored unencrypted, unlike a SQLite database",
            "Nothing: preferences are backed by SQLite anyway",
          ],
          correctIndex: 0,
          explanation:
            "Preference stores are designed for small flat values and are read in full. The right home for a 4 MB list is a database you can query and update in parts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-local-persistence-q2",
          prompt: "Which requirement most strongly argues for SQLite over a key-value store?",
          options: [
            "\"Show the 20 most recent unsynced orders for this account, newest first\"",
            "\"Remember whether the user dismissed the onboarding banner\"",
            "\"Store the selected theme\"",
            "\"Remember the last screen the user was on\"",
          ],
          correctIndex: 0,
          explanation:
            "Filtering, ordering and limiting over a growing collection is what a query engine and an index are for. The other three are single flat values.",
        },
        {
          id: "mob-x-local-persistence-q3",
          prompt: "Where should a downloaded 30 MB video file and its metadata live?",
          options: [
            "The bytes on the file system, with the path and metadata in the database",
            "Both the bytes and the metadata as a BLOB row in the database",
            "The bytes in a preferences key, the metadata in the database",
            "Both in the cache directory, so the OS can reclaim them together",
          ],
          correctIndex: 0,
          explanation:
            "Databases are poor blob stores: large BLOBs bloat the file and slow unrelated queries. Keeping only the path in the database also lets you delete or re-download the file independently.",
        },
        {
          id: "mob-x-local-persistence-q4",
          prompt: "Which of these are true about a platform cache directory? (Select all that apply.)",
          options: [
            "The OS may delete its contents when storage is low and the app is not running",
            "Code must tolerate any file there being gone on the next launch",
            "It is a reasonable home for regenerable downloaded thumbnails",
            "It is the right place for the user's only copy of an unsynced draft",
            "Files there are encrypted differently from files in the documents directory",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Cache is defined as disposable, which makes it perfect for regenerable data and fatal for unsynced user work. File-level protection is governed by the data-protection class, not by which directory you chose.",
        },
        {
          id: "mob-x-local-persistence-q5",
          prompt: "Why is a local schema migration harder than a server-side one?",
          options: [
            "It runs on the user's device, can be skipped across several versions, and a failure is an unrecoverable crash loop",
            "Mobile databases do not support ALTER TABLE",
            "Migrations must be approved by app review before they run",
            "The OS reverts the database file if the app crashes during a migration",
          ],
          correctIndex: 0,
          explanation:
            "You cannot connect to the device and fix it. That is why migration code has to carry every path from every shipped schema and why it belongs in CI with fixtures.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-local-persistence-q6",
          prompt: "A team ships \"drop and recreate the database\" as its migration strategy, reasoning that everything can be refetched. What breaks?",
          options: [
            "Any write the user made offline that had not synced yet is silently destroyed",
            "The app will crash on first launch after the update",
            "The OS will refuse to delete a database that has open connections",
            "Nothing, provided the server is reachable at launch",
          ],
          correctIndex: 0,
          explanation:
            "Refetching only restores what the server already knows. Queued mutations live only on the device, so drop-and-recreate is data loss the user never consented to.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-local-persistence-q7",
          prompt: "What do object stores such as Realm or SwiftData buy you compared with SQLite plus a mapping layer?",
          options: [
            "Objects you observe directly, with no hand-written mapping, at the cost of a vendor format and weaker ad-hoc querying",
            "Strictly better read performance in every workload",
            "Automatic conflict-free sync with any backend",
            "Freedom from schema migrations",
          ],
          correctIndex: 0,
          explanation:
            "The trade is less boilerplate and live objects against portability and query flexibility. They still have schemas, and they still need migrations.",
        },
        {
          id: "mob-x-local-persistence-q8",
          prompt: "Which of these belong in a secure store (Keychain / Keystore) rather than in your local database? (Select all that apply.)",
          options: [
            "The refresh token",
            "A symmetric key used to encrypt local content",
            "The user's display name",
            "The list of products the user browsed",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Credentials and key material are the things whose theft compromises the account, so they get hardware-backed storage. Profile and browsing data is ordinary app data.",
        },
        {
          id: "mob-x-local-persistence-q9",
          prompt: "An app writes a 200 MB regenerable media cache into the Apple documents directory. What is the most likely consequence?",
          options: [
            "It is included in iCloud and device backups unless explicitly excluded, which wastes the user's backup quota and draws review attention",
            "The files become read-only after the first backup",
            "The OS silently moves the directory to the cache location",
            "Nothing: documents are never backed up",
          ],
          correctIndex: 0,
          explanation:
            "The documents directory is for user-generated data and is backed up by default. Regenerable caches belong in a cache directory, or must be marked as excluded from backup.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-local-persistence-q10",
          prompt: "Under what condition is a plain key-value store still the right choice for a growing list?",
          options: [
            "Essentially never: once it grows and needs filtering or ordering, move it to a database",
            "When the list is read on a background thread",
            "When the list is serialised as protocol buffers rather than JSON",
            "When the list is only written, never read",
          ],
          correctIndex: 0,
          explanation:
            "The format and the thread do not change the fundamental problem: a key-value store has to load and rewrite the whole value. Growth plus querying is the signal to move.",
        },
      ],
    },
    {
      id: "mob-x-offline-sync",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "Offline Sync and Conflict Resolution",
      summary:
        "Reading offline is easy; writing offline is the hard problem in mobile engineering. The moment two devices — or one device and the server — can both change the same record while partitioned, you have a distributed system, and the honest question is not \"how do I sync\" but \"what do I do when both copies changed and neither is wrong\".\n\n**Last-write-wins is usually the wrong answer.** It is not a merge strategy, it is a policy of discarding one user's work silently, and it depends on comparing clocks from two devices that do not agree about the time — a phone with a skewed clock can overwrite an edit made an hour later. If you must order events, order them with logical clocks. A **Lamport timestamp** gives you a total order that respects causality but cannot tell \"stale\" apart from \"concurrent\". A **vector clock** can: compare two versions element-wise, and if neither dominates, the writes are genuinely concurrent and something has to merge them. That distinction is the whole game, because a stale write should be dropped and a concurrent write must not be.\n\nOnce you can detect a conflict you can choose how to resolve it, and the choice is a product decision as much as a technical one: per-field merge (two people edited different fields, keep both), a semantic merge (two increments to a counter become one addition), asking the user, or a **CRDT**, which is a data model designed so that concurrent updates converge automatically without a coordinator — powerful, but it changes your schema and your API, so adopt it deliberately rather than retrofitting it. Deletions need tombstones: a record that is simply absent is indistinguishable from a record you have not synced yet.\n\nThe gotcha that bites every implementation is the outbox. Queued mutations need client-generated idempotency keys, because \"did that request reach the server before the connection dropped\" is unanswerable from the client, and a retried create without a key becomes a duplicate order. Queued mutations also need to survive app restarts, apply in order per entity, and have an escape hatch: a poison mutation that fails forever must eventually be surfaced to the user rather than retried until the battery dies.",
      level: "expert",
      estMinutes: 90,
      isMilestone: true,
      webRefs: [
        { label: "Apple: NSMergePolicy", url: "https://developer.apple.com/documentation/coredata/nsmergepolicy", kind: "docs" },
        { label: "crdt.tech: About CRDTs", url: "https://crdt.tech/", kind: "article" },
        { label: "Figma: How Figma's multiplayer technology works", url: "https://www.figma.com/blog/how-figmas-multiplayer-technology-works/", kind: "article" },
        { label: "Stripe API: Idempotent requests", url: "https://docs.stripe.com/api/idempotent_requests", kind: "docs" },
      ],
      video: {
        title: "Angelique Nehmzow (Notion) - Conflict Resolution x Notion Blocks",
        channel: "Local-First Conf",
        url: "https://www.youtube.com/watch?v=AKDcWRkbjYs",
        videoId: "AKDcWRkbjYs",
        durationLabel: "19:03",
      },
      alternateVideos: [
        {
          title: "CRDTs and the Quest for Distributed Consistency",
          channel: "InfoQ",
          url: "https://www.youtube.com/watch?v=B5NULPSiOGw",
          videoId: "B5NULPSiOGw",
          durationLabel: "43:39",
        },
        {
          title: "Adam Fish (Ditto) - CRDTS Solved Conflicts, Not Sync",
          channel: "Local-First Conf",
          url: "https://www.youtube.com/watch?v=UmLSpcausF0",
          videoId: "UmLSpcausF0",
          durationLabel: "20:43",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `mergeRecord(local, remote)`: the reconciliation step a sync engine runs when a device's copy of a record meets the server's copy.\n\nEach record looks like `{ clock, deleted?, fields }`:\n\n- `clock` is a vector clock: an object mapping a replica id to a counter. A replica missing from a clock counts as `0`.\n- `fields` maps a field name to a version `{ value, ts, replica }`.\n- `deleted` may be absent; treat that as `false`.\n\nCompare the two clocks element-wise over every replica id in either of them, and classify:\n\n- `\"identical\"` — every counter is equal.\n- `\"local\"` — local is greater or equal everywhere and strictly greater somewhere, so remote is an ancestor.\n- `\"remote\"` — the mirror image.\n- `\"merged\"` — neither dominates, so the writes are genuinely **concurrent**.\n\nReturn `{ status, clock, deleted, fields }` where:\n\n- `clock` is always the element-wise maximum over the replica ids appearing in either clock.\n- For `identical`, `local` and `remote`, take the winning side's `deleted` flag and its `fields` unchanged.\n- For `merged`, a tombstone wins: if either side has `deleted: true`, return `deleted: true`. Otherwise merge field by field over the union of field names — a field present on only one side is taken as is, and when both sides have it the higher `ts` wins, with a tie broken by the lexicographically greater `replica` id so the result is deterministic.\n- Whenever the result is deleted, `fields` is `{}`. `deleted` is always a boolean in the output.",
        starterCode:
          "/**\n * Reconcile two replicas of one record using their vector clocks.\n *\n * @param {{ clock: object, deleted?: boolean, fields: object }} local\n * @param {{ clock: object, deleted?: boolean, fields: object }} remote\n * @returns {{ status: string, clock: object, deleted: boolean, fields: object }}\n */\nfunction mergeRecord(local, remote) {\n  // Your code here\n}\n",
        functionName: "mergeRecord",
        testCases: [
          {
            description: "remote strictly dominates, so the local copy is stale and is discarded",
            args: [
              { clock: { A: 2, B: 1 }, fields: { title: { value: "Draft", ts: 10, replica: "A" } } },
              { clock: { A: 2, B: 3 }, fields: { title: { value: "Final", ts: 30, replica: "B" } } },
            ],
            expected: { status: "remote", clock: { A: 2, B: 3 }, deleted: false, fields: { title: { value: "Final", ts: 30, replica: "B" } } },
          },
          {
            description: "local strictly dominates, so the device's copy is kept whole",
            args: [
              { clock: { A: 5, B: 2 }, fields: { title: { value: "Final", ts: 30, replica: "A" }, tag: { value: "red", ts: 31, replica: "A" } } },
              { clock: { A: 4, B: 2 }, fields: { title: { value: "Draft", ts: 10, replica: "A" } } },
            ],
            expected: {
              status: "local",
              clock: { A: 5, B: 2 },
              deleted: false,
              fields: { title: { value: "Final", ts: 30, replica: "A" }, tag: { value: "red", ts: 31, replica: "A" } },
            },
          },
          {
            description: "identical clocks mean there is nothing to reconcile",
            args: [
              { clock: { A: 2, B: 2 }, fields: { title: { value: "Same", ts: 9, replica: "A" } } },
              { clock: { A: 2, B: 2 }, fields: { title: { value: "Same", ts: 9, replica: "A" } } },
            ],
            expected: { status: "identical", clock: { A: 2, B: 2 }, deleted: false, fields: { title: { value: "Same", ts: 9, replica: "A" } } },
          },
          {
            description: "concurrent edits to different fields both survive (last-write-wins would lose one)",
            args: [
              { clock: { A: 3, B: 1 }, fields: { title: { value: "Trip", ts: 20, replica: "A" }, notes: { value: "old", ts: 5, replica: "A" } } },
              { clock: { A: 2, B: 4 }, fields: { title: { value: "Trip", ts: 20, replica: "A" }, budget: { value: 500, ts: 25, replica: "B" } } },
            ],
            expected: {
              status: "merged",
              clock: { A: 3, B: 4 },
              deleted: false,
              fields: {
                title: { value: "Trip", ts: 20, replica: "A" },
                notes: { value: "old", ts: 5, replica: "A" },
                budget: { value: 500, ts: 25, replica: "B" },
              },
            },
          },
          {
            description: "concurrent edits to the same field: the higher field timestamp wins",
            args: [
              { clock: { A: 3 }, fields: { title: { value: "Mine", ts: 40, replica: "A" } } },
              { clock: { B: 3 }, fields: { title: { value: "Theirs", ts: 41, replica: "B" } } },
            ],
            expected: { status: "merged", clock: { A: 3, B: 3 }, deleted: false, fields: { title: { value: "Theirs", ts: 41, replica: "B" } } },
          },
          {
            description: "equal field timestamps fall back to the replica id so both devices agree",
            args: [
              { clock: { A: 1 }, fields: { title: { value: "Alpha", ts: 7, replica: "A" } } },
              { clock: { B: 1 }, fields: { title: { value: "Bravo", ts: 7, replica: "B" } } },
            ],
            expected: { status: "merged", clock: { A: 1, B: 1 }, deleted: false, fields: { title: { value: "Bravo", ts: 7, replica: "B" } } },
            isEdgeCase: true,
          },
          {
            description: "a concurrent tombstone beats a concurrent edit",
            args: [
              { clock: { A: 4, B: 1 }, deleted: true, fields: {} },
              { clock: { A: 1, B: 4 }, fields: { title: { value: "Edited", ts: 50, replica: "B" } } },
            ],
            expected: { status: "merged", clock: { A: 4, B: 4 }, deleted: true, fields: {} },
            isEdgeCase: true,
          },
          {
            description: "a replica missing from one clock counts as zero, so this is dominance and not a conflict",
            args: [
              { clock: { A: 1 }, fields: { title: { value: "One", ts: 1, replica: "A" } } },
              { clock: { A: 1, B: 1 }, fields: { title: { value: "Two", ts: 2, replica: "B" } } },
            ],
            expected: { status: "remote", clock: { A: 1, B: 1 }, deleted: false, fields: { title: { value: "Two", ts: 2, replica: "B" } } },
            isEdgeCase: true,
          },
          {
            description: "two empty records are identical",
            args: [
              { clock: {}, fields: {} },
              { clock: {}, fields: {} },
            ],
            expected: { status: "identical", clock: {}, deleted: false, fields: {} },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "mob-x-networking-layer",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "The Networking Layer: Retries, Timeouts and Pinning",
      summary:
        "A mobile networking layer is not \"a wrapper around fetch\". It is the one place where four cross-cutting concerns have to live so they are not reimplemented per screen: authentication, retries, deadlines and transport trust. On both platforms the mechanism is an interceptor or delegate chain that every request passes through, and the discipline is to put policy there rather than at call sites.\n\nToken refresh is the classic example. When a 401 comes back, exactly one refresh should run and every other in-flight request should wait for it — a single-flight refresh with a mutex. Without it, a screen that fires five parallel requests on launch will fire five refreshes, and whichever one lands last invalidates the tokens the other four just stored. Retries are the second: bounded attempts, exponential backoff, and **jitter**, because without randomisation every client that failed during an outage retries in lockstep and re-creates the outage. Retry only what is safe to retry — idempotent methods, or non-idempotent ones carrying an idempotency key — and never retry a 4xx other than 408 or 429. Deadlines are the third: the budget for a whole operation is not the same thing as a socket timeout, and a request the user is waiting on should give up long before one running in the background.\n\nTransport trust is the fourth, and it is where mobile gets an option the web does not have. Because you ship the client, you can **pin**: refuse connections whose certificate chain does not include a key you expect, which defeats an attacker who has installed a trusted root on the device. Prefer pinning the **subject public key info** of an intermediate or your own CA rather than a leaf certificate, and always ship at least one backup pin. Both platforms take pin sets declaratively, in the app's network security configuration, so you do not have to hand-roll certificate validation — the classic way to accidentally disable it.\n\nThe gotcha is that pinning is a self-inflicted outage waiting to happen. Certificates get rotated, and a build that pins only a certificate expiring on Tuesday bricks every installed copy of the app on Tuesday — and the fix requires a store review. Ship backup pins and treat rotation as a scheduled release task, not an emergency.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Android Developers: Network security configuration", url: "https://developer.android.com/privacy-and-security/security-config", kind: "docs" },
        { label: "Apple: Preventing Insecure Network Connections", url: "https://developer.apple.com/documentation/security/preventing-insecure-network-connections", kind: "docs" },
        { label: "OWASP: Certificate and Public Key Pinning", url: "https://community.owasp.org/controls/Certificate_and_Public_Key_Pinning", kind: "article" },
        { label: "Google SRE Book: Addressing Cascading Failures", url: "https://sre.google/sre-book/addressing-cascading-failures/", kind: "article" },
      ],
      video: {
        title: "Certificate Pinning - The MOST Important Security Measure for Network Traffic In Your App",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=hGdI7aKtVxI",
        videoId: "hGdI7aKtVxI",
        durationLabel: "21:23",
      },
      alternateVideos: [
        {
          title: "SSL Pinning Explained",
          channel: "Guardsquare",
          url: "https://www.youtube.com/watch?v=efIPpIYBNTc",
          videoId: "efIPpIYBNTc",
          durationLabel: "8:55",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-x-networking-layer-q1",
          prompt: "An app fires five requests at launch. All five get a 401 at the same moment and each one independently starts a token refresh. What goes wrong?",
          options: [
            "Four refreshes race the fifth; the last one to finish overwrites tokens the others already stored, and some requests retry with a token that is now invalid",
            "The server rejects the extra refreshes with 429, which is harmless",
            "Nothing: refresh endpoints are idempotent by definition",
            "The app deadlocks waiting on the refresh endpoint",
          ],
          correctIndex: 0,
          explanation:
            "Refresh-token rotation makes concurrent refreshes destructive: each one invalidates the previous token. The fix is single-flight — one refresh, everyone else awaits its result.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-networking-layer-q2",
          prompt: "Why does an exponential backoff schedule need jitter?",
          options: [
            "Without randomisation every client that failed during an outage retries at the same instant and re-creates the outage on recovery",
            "It makes the average delay shorter",
            "It prevents the OS from throttling the app's radio use",
            "It is required for retries to be idempotent",
          ],
          correctIndex: 0,
          explanation:
            "Synchronised clients produce a thundering herd the moment the backend comes back. Jitter spreads the load; it neither shortens the wait nor has anything to do with idempotency.",
        },
        {
          id: "mob-x-networking-layer-q3",
          prompt: "Which of these are safe to retry automatically? (Select all that apply.)",
          options: [
            "A GET that timed out",
            "A POST that carries a client-generated idempotency key",
            "A request that returned 429 with a Retry-After header",
            "A POST with no idempotency key that returned 500",
            "A request that returned 403",
          ],
          correctIndex: 0,
          explanation:
            "Safe methods and keyed writes can be replayed without duplicating an effect, and 429 explicitly asks you to come back. A bare POST may already have been applied, and 403 is a decision that will not change on the next attempt.",
          correctIndices: [0, 1, 2],
        },
        {
          id: "mob-x-networking-layer-q4",
          prompt: "What is the difference between an operation deadline and a socket read timeout?",
          options: [
            "The deadline bounds the whole operation including retries and redirects; the socket timeout only bounds one period of silence on one connection",
            "They are the same thing under different names on the two platforms",
            "The deadline applies only to background requests",
            "A socket timeout includes DNS resolution, the deadline does not",
          ],
          correctIndex: 0,
          explanation:
            "Three retries each under a 30-second socket timeout can keep a user waiting far past any reasonable budget. Only an operation-level deadline bounds what the user actually experiences.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-networking-layer-q5",
          prompt: "What threat does certificate pinning actually defend against?",
          options: [
            "An attacker who can get a certificate your device would otherwise trust, including one from a root installed on the device",
            "An attacker who has stolen your API keys from the app binary",
            "A compromised backend serving malicious data over a valid certificate",
            "A user on a public Wi-Fi network with no interception",
          ],
          correctIndex: 0,
          explanation:
            "Pinning narrows trust from \"any CA the device trusts\" to \"the key I expect\", which is exactly the proxy-with-an-installed-root scenario. It says nothing about what your own server sends or what is inside your binary.",
        },
        {
          id: "mob-x-networking-layer-q6",
          prompt: "A release pins only the SHA-256 of the current leaf certificate's public key. The certificate is rotated three months later. What happens?",
          options: [
            "Every installed copy of that build stops connecting, and the fix requires a new build through review",
            "The OS falls back to normal certificate validation",
            "Only new installs are affected",
            "The pin is refreshed automatically from the server",
          ],
          correctIndex: 0,
          explanation:
            "A pin that no longer matches is a hard failure by design, and you cannot hot-fix a shipped binary. Pin an intermediate or your own CA, always ship backup pins, and schedule rotations.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-networking-layer-q7",
          prompt: "Why is a declarative pin set (Android's network security config, Apple's ATS settings) preferred over implementing the trust check in code?",
          options: [
            "Hand-rolled trust callbacks are the classic way to accidentally accept every certificate, and the declarative form is reviewable and auditable",
            "Declarative pinning works without HTTPS",
            "Code-based validation is not permitted by either platform",
            "Declarative pinning updates itself over the air",
          ],
          correctIndex: 0,
          explanation:
            "\"Return true to make the test build work\" is a real and common bug, and it ships. Configuration keeps the decision in one auditable place; neither approach updates without a release.",
        },
        {
          id: "mob-x-networking-layer-q8",
          prompt: "Which concerns belong in the shared networking layer rather than at individual call sites? (Select all that apply.)",
          options: [
            "Attaching the auth header and refreshing it on 401",
            "Retry and backoff policy",
            "Adding correlation ids to outgoing requests for tracing",
            "Deciding which screen to show after a request fails",
            "Mapping a response into a screen's view state",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Auth, retries and tracing are identical for every request, so duplicating them guarantees drift. Navigation and view-state mapping are per-screen decisions that belong above the transport.",
        },
        {
          id: "mob-x-networking-layer-q9",
          prompt: "A captive portal answers every request with a login page and HTTP 200. What does this tell you about reachability checks?",
          options: [
            "\"The device reports connectivity\" is a hint for UI copy, never a gate on whether to attempt a request",
            "Reachability APIs are broken and should never be used",
            "You should retry until the portal is dismissed",
            "The OS filters captive portals out before your request is sent",
          ],
          correctIndex: 0,
          explanation:
            "Only the attempt tells you whether the request works. Gating on a reachability flag adds a failure mode without removing any, which is why the advice is to try and handle the failure.",
        },
        {
          id: "mob-x-networking-layer-q10",
          prompt: "A background upload is implemented as an in-process retry loop inside the app. What is the practical problem on mobile?",
          options: [
            "The OS can suspend or kill the process at any time, so the loop stops; platform background transfer or persistent work APIs survive that",
            "In-process loops cannot use HTTPS",
            "Background uploads require a foreground notification on both platforms",
            "The retry loop will be rejected during app review",
          ],
          correctIndex: 0,
          explanation:
            "Anything that must outlive the foreground has to be handed to the system scheduler, which can also apply constraints such as unmetered network or charging. A hand-rolled loop simply stops when the process does.",
        },
      ],
    },
    {
      id: "mob-x-secure-storage",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "Secure Storage: Keychain, Keystore and the Rooted Device",
      summary:
        "\"Store it securely\" means something specific on mobile, and it is narrower than most teams assume. Both platforms give you a system-managed secret store — the Keychain on Apple platforms, the Keystore system on Android — and both are built around the same idea: the secret is held by a separate process or by dedicated hardware, and your app asks for operations rather than for bytes.\n\nAndroid's Keystore protects key material from **extraction**. Key material never enters your process: plaintext, ciphertext and messages to be signed are handed to a system process that does the work. When the key is bound to secure hardware — the Trusted Execution Environment, or a StrongBox secure element with its own CPU, secure storage and true random number generator — the material never leaves that hardware at all. Apple's Keychain is an encrypted database whose items you retrieve through the system, and for private keys the Secure Enclave goes a step further: you never handle the plaintext key, it is created inside the enclave, it cannot be imported, and it supports only NIST P-256 keys for signing and key agreement.\n\nHere is the part that matters and that people get wrong. These systems stop an attacker **taking your key away**; they do not stop malware with your app's identity **using** it on that device. Android's own documentation is blunt about it: if the OS is compromised, an attacker may be able to use any app's Keystore keys on that device, but cannot extract them. So on a rooted or jailbroken device, \"the token is in the Keystore\" buys you very little — which is why the real mitigations are server-side: short-lived tokens, refresh-token rotation with reuse detection, binding a session to a device-attested key, and anomaly detection. Android **key attestation** lets you prove a key really is hardware-backed by validating a certificate chain rooted in Google's attestation root — and that validation must happen on your server, never on the device you are evaluating.\n\nThe gotchas are lifecycle ones. Keychain items are not automatically removed when the user deletes an iOS app, so a \"fresh install\" can find an old token. And Keystore key use authorisations — including \"only usable after a recent user authentication\" — are fixed at key creation, so design them before you generate the key.",
      level: "expert",
      estMinutes: 60,
      webRefs: [
        { label: "Android Developers: Android Keystore system", url: "https://developer.android.com/privacy-and-security/keystore", kind: "docs" },
        { label: "Apple: Protecting keys with the Secure Enclave", url: "https://developer.apple.com/documentation/security/protecting-keys-with-the-secure-enclave", kind: "docs" },
        { label: "Android Developers: Verify hardware-backed key pairs with key attestation", url: "https://developer.android.com/privacy-and-security/security-key-attestation", kind: "docs" },
        { label: "OWASP MASVS: Storage", url: "https://mas.owasp.org/MASVS/05-MASVS-STORAGE/", kind: "docs" },
      ],
      video: {
        title: "FULL Guide to Encryption & Decryption in Android (Keystore, Ciphers and more)",
        channel: "Philipp Lackner",
        url: "https://www.youtube.com/watch?v=aaSck7jBDbw",
        videoId: "aaSck7jBDbw",
        durationLabel: "27:53",
      },
      alternateVideos: [
        {
          title: "Demystifying attestation",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=Bc4ZLmTp4m0",
          videoId: "Bc4ZLmTp4m0",
          durationLabel: "14:06",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-x-secure-storage-q1",
          prompt: "What does the Android Keystore primarily protect against?",
          options: [
            "Extraction of key material from the app process or from the device",
            "Any use of the key by malware running on the device",
            "Reverse engineering of the app's code",
            "Interception of network traffic",
          ],
          correctIndex: 0,
          explanation:
            "Key material never enters the app process and, when hardware-backed, never leaves secure hardware. Android's documentation says plainly that a compromised OS may still allow keys to be *used* on that device.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-secure-storage-q2",
          prompt: "A refresh token is stored in the Keychain. The user's phone is jailbroken and running malware with the app's entitlements. What is the realistic assessment?",
          options: [
            "The secret store buys little on that device; short-lived tokens, rotation with reuse detection and server-side anomaly detection are the real mitigations",
            "The token is safe because the Keychain is encrypted at rest",
            "The token is safe as long as the device passcode is set",
            "Jailbreaking clears the Keychain, so there is nothing to steal",
          ],
          correctIndex: 0,
          explanation:
            "Local storage hardening raises the cost of theft; it cannot make a fully compromised device trustworthy. The defences that still work live on the server, where the attacker has no privileges.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-secure-storage-q3",
          prompt: "Which are true of a key generated inside Apple's Secure Enclave? (Select all that apply.)",
          options: [
            "Your code never handles the plaintext private key",
            "An existing key cannot be imported into the enclave",
            "Only NIST P-256 elliptic curve keys are supported",
            "It can be exported for backup to another device",
            "It can be used for RSA-4096 signing",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "No import, no export and P-256 only are the documented restrictions, and the lack of any transfer mechanism is fundamental to the design. RSA is not supported, and a key that cannot leave cannot be backed up.",
        },
        {
          id: "mob-x-secure-storage-q4",
          prompt: "What is StrongBox on Android?",
          options: [
            "A secure element implementation of the Keystore HAL with its own CPU, secure storage and true random number generator, supporting a restricted set of algorithms",
            "An encrypted SharedPreferences wrapper",
            "A cloud key-management service for Android apps",
            "The obfuscation pass applied to release builds",
          ],
          correctIndex: 0,
          explanation:
            "StrongBox is separate tamper-resistant hardware, stronger than the TEE but slower and limited to a subset of algorithms and key sizes. It has nothing to do with preferences or code obfuscation.",
        },
        {
          id: "mob-x-secure-storage-q5",
          prompt: "Your server needs to know a client key really is hardware-backed. Where should the attestation certificate chain be validated?",
          options: [
            "On your server, because a compromised device cannot be trusted to evaluate itself",
            "On the device, immediately after key generation, to fail fast",
            "In the app's CI pipeline at build time",
            "Either place: the result is cryptographically identical",
          ],
          correctIndex: 0,
          explanation:
            "Android's documentation explicitly cautions against validating on the same device, since a compromised system could make the check trust something untrustworthy. The whole point is to give a *remote* party confidence.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-secure-storage-q6",
          prompt: "A user deletes an iOS app and reinstalls it. What happens to the Keychain items the app wrote?",
          options: [
            "They can still be there, so treating a stored token as proof of a returning install is unreliable",
            "They are always deleted along with the app's container",
            "They are moved to iCloud and restored only after sign-in",
            "They become unreadable because the app gets a new bundle identifier",
          ],
          correctIndex: 0,
          explanation:
            "Keychain items are not tied to the app's sandbox container the way ordinary files are. Apps that need \"first run\" semantics clear their Keychain entries explicitly on first launch.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-secure-storage-q7",
          prompt: "Which items belong in the platform secret store rather than in ordinary app storage? (Select all that apply.)",
          options: [
            "The refresh token",
            "A symmetric key used to encrypt the local database",
            "A device-bound signing key used for request attestation",
            "The list of the user's saved addresses",
            "The current feature-flag values",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Credentials and key material are the assets whose theft compromises the account, so they get the hardware-backed store. Addresses are ordinary app data and flags are configuration.",
        },
        {
          id: "mob-x-secure-storage-q8",
          prompt: "A team wants a Keystore key that can only be used within 30 seconds of a biometric authentication. When must that be decided?",
          options: [
            "At key generation: key use authorisations are fixed when the key is created and cannot be changed afterwards",
            "At each use, by passing a flag to the cipher",
            "In the app manifest, which can be changed in any update",
            "In the server's policy, which the Keystore reads at runtime",
          ],
          correctIndex: 0,
          explanation:
            "Authorisations are bound to the key when it is generated or imported and are enforced outside your process from then on. Changing the policy means generating a new key and migrating whatever it protected.",
        },
        {
          id: "mob-x-secure-storage-q9",
          prompt: "Hard-coding an API secret in the app and \"protecting\" it with obfuscation is a common pattern. What is the correct framing?",
          options: [
            "Anything shipped in the binary is recoverable; a secret that must stay secret cannot live in a client at all",
            "Obfuscation is sufficient if the release build strips symbols",
            "It is safe as long as the string is encrypted with a Keystore key",
            "It is safe on iOS because the binary is encrypted by the App Store",
          ],
          correctIndex: 0,
          explanation:
            "The app must be able to use the secret, so the device must be able to derive it, so an attacker with the device can too. The fix is architectural: put the secret behind your backend and give the client a scoped, revocable credential.",
        },
        {
          id: "mob-x-secure-storage-q10",
          prompt: "What does an \"encrypted SharedPreferences\" style wrapper genuinely give you over plain preferences?",
          options: [
            "The value is encrypted with a Keystore-held key, so reading the file alone is not enough — but a running process with the app's identity can still decrypt it",
            "Complete protection against a rooted device",
            "Hardware isolation equivalent to StrongBox",
            "Nothing at all; it is purely cosmetic",
          ],
          correctIndex: 0,
          explanation:
            "It meaningfully defends against offline inspection of the file, for example from a backup or a stolen device image. It cannot defend against code running as your app, because that code can ask the Keystore to decrypt.",
        },
      ],
    },
    {
      id: "mob-x-auth",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "Authentication: Tokens, Biometrics and the System Browser",
      summary:
        "Mobile authentication differs from web authentication in one structural way: there is no browser origin, so there are no cookies scoped by the same-origin policy and nothing stops your own app from reading what it renders. Everything follows from that.\n\nA mobile app is a **public client**. It cannot keep a client secret, so the authorisation-code flow must be protected by **PKCE**: the app generates a random verifier, sends its hash as the challenge, and redeems the code with the verifier — so an attacker who intercepts the redirect cannot exchange the code. The implicit flow is obsolete, and collecting a third-party provider's password in your own form should never happen.\n\nThe rule people most often break is **where the login page renders**. The IETF best current practice for native apps is clear: authorisation requests go to an external user-agent — the system browser, or an in-app browser tab such as SFSafariViewController/ASWebAuthenticationSession on Apple platforms and Custom Tabs on Android — never an embedded webview. It is not pedantry. An embedded webview is controlled by your app, so it can read the password the user types and the user has no way to tell a legitimate prompt from a phishing one; and it does not share the system cookie jar, so single sign-on silently stops working. The in-app browser tab keeps the address bar and the shared session while still feeling native.\n\nToken handling then follows the usual rules: short-lived access tokens, refresh tokens in the platform secret store, rotation with reuse detection on the server, and a single-flight refresh in the networking layer. **Biometrics are a local unlock, not an authentication factor to your server.** The device tells you the user authenticated; it does not give you a credential. Use the biometric check to gate a Keystore- or Secure-Enclave-held key that then signs or decrypts — and remember that enrolling a new fingerprint or face invalidates biometric-bound keys on purpose, so you need a re-enrolment path that does not lock the user out.\n\nThe gotcha is logout. Clearing the token from local storage ends the session on that device only. Without server-side revocation, a stolen refresh token keeps working, and without clearing the shared browser session, the next \"log in\" in that app silently signs the same account straight back in.",
      level: "advanced",
      estMinutes: 70,
      webRefs: [
        { label: "RFC 8252: OAuth 2.0 for Native Apps", url: "https://datatracker.ietf.org/doc/html/rfc8252", kind: "spec" },
        { label: "RFC 7636: Proof Key for Code Exchange", url: "https://datatracker.ietf.org/doc/html/rfc7636", kind: "spec" },
        { label: "Apple: ASWebAuthenticationSession", url: "https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession", kind: "docs" },
        { label: "Android Developers: Credential Manager", url: "https://developer.android.com/identity/credential-manager", kind: "docs" },
      ],
      video: {
        title: "DroidKaigi 2025 - [EN] OAuth Done Right: Secure Authentication for Androi… | Chrystian Vieyra Cortes",
        channel: "DroidKaigi",
        url: "https://www.youtube.com/watch?v=jvLXj7Mzraw",
        videoId: "jvLXj7Mzraw",
        durationLabel: "35:50",
      },
      alternateVideos: [
        {
          title: "OAuth is Broken Without This | Meet PKCE",
          channel: "ByteMonk",
          url: "https://www.youtube.com/watch?v=5FrA0UzV1Aw",
          videoId: "5FrA0UzV1Aw",
          durationLabel: "10:00",
        },
        {
          title: "How to Implement Biometric Auth in Your Android App",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=_dCRQ9wta-I",
          videoId: "_dCRQ9wta-I",
          durationLabel: "22:32",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-x-auth-q1",
          prompt: "Why must a native app use PKCE with the authorisation-code flow?",
          options: [
            "It is a public client that cannot keep a client secret, so the code alone must not be enough to get tokens",
            "PKCE replaces the need for HTTPS on the redirect",
            "It lets the app skip the redirect entirely",
            "It allows the app to store a client secret safely in the Keystore",
          ],
          correctIndex: 0,
          explanation:
            "The verifier ties the token exchange to the client that started the flow, which is what a confidential client would have used its secret for. Nothing shipped in a binary counts as a secret.",
        },
        {
          id: "mob-x-auth-q2",
          prompt: "Which of these are real problems with rendering a third-party login page in an embedded webview? (Select all that apply.)",
          options: [
            "The host app can read the credentials the user types",
            "The user cannot verify the address bar, so phishing is indistinguishable from the real thing",
            "It does not share the system cookie jar, so single sign-on breaks",
            "Webviews cannot render HTTPS pages",
            "Webviews cannot execute JavaScript",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Those three are exactly why the native-app best current practice mandates an external user-agent. Webviews render HTTPS and run JavaScript perfectly well — that is part of the problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-auth-q3",
          prompt: "What does an in-app browser tab (ASWebAuthenticationSession, Custom Tabs) give you that a plain webview does not?",
          options: [
            "The system's cookie jar and a visible address bar, while staying inside your app's flow",
            "The ability to inject JavaScript into the login page",
            "Offline rendering of the login page",
            "Automatic token storage in the Keychain",
          ],
          correctIndex: 0,
          explanation:
            "It is a real browser rendered over your app: shared session for SSO, and a trustworthy origin indicator. Being unable to inject scripts into it is the security property, not a limitation.",
        },
        {
          id: "mob-x-auth-q4",
          prompt: "A user passes Face ID and the app calls the backend saying \"biometrics succeeded, issue a session\". What is wrong?",
          options: [
            "The server is trusting a claim from the client; the biometric check should instead unlock a hardware-held key that signs something the server verifies",
            "Nothing: the OS signs the biometric result for the server",
            "Face ID cannot be used for authentication at all",
            "The server should require the biometric template to be uploaded",
          ],
          correctIndex: 0,
          explanation:
            "A boolean from a client is not evidence. Binding the biometric prompt to a Keystore or Secure Enclave key turns a local unlock into something the server can actually verify, and biometric templates never leave the device.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-auth-q5",
          prompt: "A user adds a new fingerprint to the device. Keys created with biometric binding stop working. Why is this the intended behaviour?",
          options: [
            "Otherwise someone who coerced the device unlocked could enrol their own biometric and inherit access to keys the original user protected",
            "It is a bug in the platform's key rotation",
            "Enrolment re-encrypts the whole file system, invalidating all keys",
            "Biometric keys expire after a fixed period regardless of enrolment",
          ],
          correctIndex: 0,
          explanation:
            "Invalidation on enrolment change is a deliberate defence. The consequence for your code is that a permanent-key-invalidated error must lead to re-enrolment, not to a locked-out user.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-auth-q6",
          prompt: "Where should a refresh token live on a mobile device?",
          options: [
            "In the platform secret store, with rotation and reuse detection enforced by the server",
            "In preferences, encrypted with a key hard-coded in the app",
            "In the local database alongside the user profile",
            "In memory only, re-authenticating the user on every launch",
          ],
          correctIndex: 0,
          explanation:
            "The secret store raises the cost of offline theft, and server-side rotation limits the damage when it happens anyway. A key hard-coded in the binary is not a key, and memory-only means a login prompt on every cold start.",
        },
        {
          id: "mob-x-auth-q7",
          prompt: "Which of these are necessary for a logout that actually ends the session? (Select all that apply.)",
          options: [
            "Revoking the refresh token on the server",
            "Clearing tokens from the device's secret store",
            "Ending the shared browser session so the next login does not sign the same user straight back in",
            "Uninstalling and reinstalling the app",
            "Rotating the app's signing key",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Local deletion is not revocation, and a live browser session makes the next \"login\" a single silent redirect. Reinstalling is not something you can ask of a user, and signing keys are unrelated.",
        },
        {
          id: "mob-x-auth-q8",
          prompt: "Why are custom URL schemes (`myapp://callback`) a weaker redirect target than a verified https app link?",
          options: [
            "Any app can register the same scheme, so a malicious app may receive the authorisation code",
            "Custom schemes cannot carry query parameters",
            "The OS strips the authorisation code from custom-scheme URLs",
            "Custom schemes are blocked in release builds",
          ],
          correctIndex: 0,
          explanation:
            "Scheme registration is first-come-or-ambiguous and unverified, which is precisely the hijacking risk PKCE was designed to contain. Verified https links prove domain ownership, so the redirect cannot be claimed by another app.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-auth-q9",
          prompt: "What does a passkey change about mobile sign-in?",
          options: [
            "The credential is a device-bound key pair used with a challenge, so there is no shared secret to phish or to leak in a breach",
            "It stores the user's password in the platform credential manager",
            "It removes the need for any server-side account record",
            "It works only when the device is online",
          ],
          correctIndex: 0,
          explanation:
            "Public-key credentials are origin-bound and never transmitted, which kills both phishing and credential-stuffing. The server still holds an account and the corresponding public key.",
        },
        {
          id: "mob-x-auth-q10",
          prompt: "An access token is valid for 30 days so users \"never get logged out\". What is the trade-off being made?",
          options: [
            "A stolen token stays useful for 30 days and cannot be practically revoked, because the resource server never checks back",
            "Nothing, provided the token is stored in the Keychain",
            "The token becomes larger and slows every request",
            "Long-lived tokens require a confidential client",
          ],
          correctIndex: 0,
          explanation:
            "Short access tokens plus a refresh token exist precisely so revocation has a place to take effect. \"Never logged out\" is a refresh-token property; it does not require a long-lived access token.",
        },
      ],
    },
    {
      id: "mob-x-testing",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "Testing Strategy: Unit, UI and the Device Farm",
      summary:
        "Mobile test strategy is shaped by one economic fact: the further up the pyramid you go, the more you pay per run — not in seconds, but in **devices**. A unit test runs on the build machine in milliseconds. An instrumented or UI test needs an emulator or simulator to boot, an app to install, and a flaky animation to settle. A device-farm run needs real hardware, and you are billed by the device-minute. So the question is never \"what could we test here\" but \"what does this layer of test tell us that the cheaper layer below cannot\".\n\nThat pushes toward a specific split. Business rules, mappers, reducers, validation and repository logic belong in fast host-machine tests that never see a device — which is the real return on the layering from earlier in this camp. UI tests should be few and should cover **journeys**, not screens: sign in, add to cart, check out. And there is a middle layer people forget: screenshot or snapshot tests, which catch layout regressions across font scales, locales and screen sizes far more cheaply than driving the app.\n\nDevice farms — Firebase Test Lab, AWS Device Farm and the commercial equivalents — earn their cost for things an emulator genuinely cannot tell you: real GPU behaviour, OEM skins and their quirks, a two-year-old mid-range phone's timings, an actual camera or biometric sensor. Use them for a compatibility sweep on a matrix of representative devices per release, not as the runner for your whole suite. Android's automated crawler-style robo tests are a cheap way to shake out crashes on devices you do not own, and they need no test code at all.\n\nThe thing worth automating is whatever is both **expensive to get wrong** and **cheap to verify**: that a build boots on the oldest OS version you support, that the sign-in journey works, that a database migration from every shipped schema succeeds, that no screen regresses at the largest accessibility font size. The thing not worth automating is the pixel-perfect appearance of a screen that changes weekly.\n\nThe gotcha is flakiness. A UI suite that fails 5% of the time for reasons nobody understands does not protect anything — it trains the team to re-run until green, which is the same as having no gate. Treat a flaky test as a broken test: quarantine it, fix the synchronisation properly (wait for the app's idle state, never for a fixed sleep), and re-admit it once it is stable.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Android Developers: Fundamentals of testing Android apps", url: "https://developer.android.com/training/testing/fundamentals", kind: "docs" },
        { label: "Apple: XCTest", url: "https://developer.apple.com/documentation/xctest", kind: "docs" },
        { label: "Firebase: Test Lab", url: "https://firebase.google.com/docs/test-lab", kind: "docs" },
        { label: "Martin Fowler: The Practical Test Pyramid", url: "https://martinfowler.com/articles/practical-test-pyramid.html", kind: "article" },
      ],
      video: {
        title: "Android Testing Strategies",
        channel: "Android Developers",
        url: "https://www.youtube.com/watch?v=qeFWCYc7u3E",
        videoId: "qeFWCYc7u3E",
        durationLabel: "8:24",
      },
      alternateVideos: [
        {
          title: "The Ultimate Guide to Android Testing (Unit Tests, UI Tests, End-to-End Tests) - Clean Architecture",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=nDCCwyS0_MQ",
          videoId: "nDCCwyS0_MQ",
          durationLabel: "1:10:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-x-testing-q1",
          prompt: "Why does the test pyramid's shape matter more on mobile than on a backend service?",
          options: [
            "The upper layers need emulators, simulators or real hardware, so their cost per run is measured in devices and minutes rather than milliseconds",
            "Mobile unit tests are less reliable than backend ones",
            "Mobile apps cannot run integration tests at all",
            "App stores require a minimum ratio of unit to UI tests",
          ],
          correctIndex: 0,
          explanation:
            "Boot, install, settle and (on a farm) pay per device-minute is a real cost the backend equivalent does not have. Nobody reviews your test ratios.",
        },
        {
          id: "mob-x-testing-q2",
          prompt: "Which of these are best covered by fast host-machine unit tests? (Select all that apply.)",
          options: [
            "A pricing rule that applies a tiered discount",
            "Mapping an API response into the domain model",
            "A reducer that turns events into screen state",
            "Whether a list scrolls smoothly on a low-end device",
            "Whether the app renders correctly at the largest font size",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Pure logic with no platform dependency is exactly what belongs at the bottom of the pyramid. Scroll performance needs real hardware and font-size layout needs rendering.",
        },
        {
          id: "mob-x-testing-q3",
          prompt: "What should an end-to-end UI test suite cover?",
          options: [
            "A small number of critical user journeys, such as sign-in and checkout",
            "Every screen, so that coverage is complete",
            "Every validation rule in every form",
            "The exact pixel layout of each screen",
          ],
          correctIndex: 0,
          explanation:
            "Journeys are what actually break the product and what only an end-to-end test can verify. Per-field validation is cheaper as unit tests, and pixel layout is a snapshot test's job.",
        },
        {
          id: "mob-x-testing-q4",
          prompt: "A UI test fails about one run in twenty and the team re-runs until it is green. What is the real state of that gate?",
          options: [
            "It protects nothing, because a failure no longer carries information; quarantine and fix the synchronisation",
            "It is acceptable as long as the flake rate stays under 10%",
            "It is fine because re-running is automated",
            "It proves the app has a genuine 5% crash rate",
          ],
          correctIndex: 0,
          explanation:
            "Once re-running is the reflex, real regressions are re-run away too. Flakes are usually a synchronisation bug in the test — waiting on a fixed sleep instead of on the app's idle state.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-testing-q5",
          prompt: "What does a real-device farm tell you that an emulator or simulator genuinely cannot?",
          options: [
            "OEM-specific behaviour, real GPU and thermal characteristics, and the timings of an actual mid-range device",
            "Whether your business logic is correct",
            "Whether your API contract has changed",
            "Whether your code compiles for the target architecture",
          ],
          correctIndex: 0,
          explanation:
            "Vendor skins, real silicon and real thermal throttling are exactly the class of bug an emulator hides. Logic, contracts and compilation are all settled long before a device is involved.",
        },
        {
          id: "mob-x-testing-q6",
          prompt: "Which test would have caught \"the app crashes on launch for users upgrading from version 3.1\"?",
          options: [
            "A migration test that runs every shipped schema fixture through the current migration path",
            "A UI test that signs in and checks out",
            "A screenshot test of the home screen",
            "A device-farm compatibility sweep on the latest OS",
          ],
          correctIndex: 0,
          explanation:
            "Upgrade crashes come from the state on disk, not from the current build's fresh-install path. Only a fixture of the old schema exercises the migration that actually runs on the user's device.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-testing-q7",
          prompt: "What do screenshot (snapshot) tests buy that neither unit nor end-to-end tests do?",
          options: [
            "Cheap detection of layout regressions across font scales, locales, themes and screen sizes",
            "Proof that the app's networking layer retries correctly",
            "Confidence that the checkout journey completes",
            "Measurement of cold-start time",
          ],
          correctIndex: 0,
          explanation:
            "Rendering one component under many configurations is far cheaper than driving the whole app, and it catches the truncation and overlap bugs that only appear at 200% text size.",
        },
        {
          id: "mob-x-testing-q8",
          prompt: "Which of these are sensible uses of a device farm in CI? (Select all that apply.)",
          options: [
            "A compatibility sweep across a representative device matrix before each release",
            "Automated crawler-style tests on devices the team does not own",
            "Verifying the app launches on the oldest supported OS version",
            "Running the entire unit test suite on every commit",
            "Replacing local emulators for day-to-day development",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Pre-release sweeps, crawlers and minimum-OS checks are things only real hardware answers. Running unit tests or the daily inner loop on billed hardware is spending device-minutes on questions a laptop answers free.",
        },
        {
          id: "mob-x-testing-q9",
          prompt: "A team mocks the HTTP client in its repository tests by stubbing the library's own response type. What later breaks?",
          options: [
            "The tests pass while the real serialisation is wrong, because nothing ever parses a real response body",
            "The tests become too slow to run on every commit",
            "The repository can no longer be injected",
            "The mocks force the app to keep the networking library forever",
          ],
          correctIndex: 0,
          explanation:
            "Stubbing above the parsing layer skips the part most likely to be wrong — a renamed or newly nullable field. Serving recorded JSON through a fake transport keeps the test fast and still exercises decoding.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-testing-q10",
          prompt: "Which of these is the strongest candidate for automation, by the \"expensive to get wrong, cheap to verify\" rule?",
          options: [
            "That the app still launches and signs in on the oldest OS version you support",
            "That the marketing banner's gradient matches the design file",
            "That every string is spelled correctly in every locale",
            "That animations run at exactly 60 frames per second on all devices",
          ],
          correctIndex: 0,
          explanation:
            "A launch or sign-in break on a supported OS is a total outage for those users and takes one automated run to detect. The others are either cheap to notice by eye or expensive and unstable to assert.",
        },
      ],
    },
    {
      id: "mob-x-cicd",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "CI/CD for Mobile: Signing, Profiles and Keystores",
      summary:
        "Web CI produces artefacts that anyone can serve. Mobile CI produces artefacts that must be **cryptographically signed by an identity the platform vendor issued to your organisation**, and that single difference accounts for most of the extra difficulty.\n\nOn Android the signing identity is a keystore holding a private key. The key you generate is typically the **upload key**; with Play App Signing, Google holds the app signing key that actually signs what users install, and an upload key can be reset if it leaks. On Apple platforms the identity is a **certificate** plus a **provisioning profile** — a signed bundle tying an App ID, a certificate and (for development and ad-hoc builds) a list of device UDIDs, with its own expiry. The failure mode is the same on both sides and it is brutal: **lose the original Android app signing key with no Play App Signing enrolment and you cannot ship another update to that listing, ever.** Existing users cannot be upgraded; you publish a new app and start from zero installs.\n\nSo a mobile pipeline has concerns a web pipeline does not. Secrets are files, not just strings — a keystore, a `.p12`, a profile — so they live in a secret manager or an encrypted repository (fastlane `match` is the well-worn version of the latter) and are materialised into a short-lived keychain on the runner, not committed. Build numbers must be unique and monotonically increasing per upload, forever, which makes them shared state the pipeline owns rather than something a developer edits. And Apple builds require macOS runners, a capacity and cost constraint that shapes the whole design.\n\nThe delivery half is not \"deploy\". It is upload to TestFlight or a Play track, wait for processing and review, then release as a separate decision. Automate up to \"a build is available to testers on every merge to main\"; keep the human decision at \"promote to production\".\n\nThe gotcha is expiry. Certificates and profiles expire on dates nobody has in a calendar, and the symptom is a red pipeline on a Monday morning with no code change. Track the dates, rotate before they bite, and make sure more than one person can recover the signing material — a signing identity that only one laptop can reproduce is an outage with a notice period.",
      level: "expert",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Android Developers: Sign your app", url: "https://developer.android.com/studio/publish/app-signing", kind: "docs" },
        { label: "Play Console Help: Use Play App Signing", url: "https://support.google.com/googleplay/android-developer/answer/9842756", kind: "docs" },
        { label: "Apple: Create a development provisioning profile", url: "https://developer.apple.com/help/account/provisioning-profiles/create-a-development-provisioning-profile/", kind: "docs" },
        { label: "fastlane: match", url: "https://docs.fastlane.tools/actions/match/", kind: "docs" },
      ],
      video: {
        title: "Provisioning Profiles and Certificates | What, Why and How Explained",
        channel: "iCode",
        url: "https://www.youtube.com/watch?v=ZqL3n9bSMqw",
        videoId: "ZqL3n9bSMqw",
        durationLabel: "15:06",
      },
      alternateVideos: [
        {
          title: "SETUP CI/CD for iOS UNDER 10 MINS with Github Actions and Fastlane",
          channel: "Tim Dolenko",
          url: "https://www.youtube.com/watch?v=yNqCpMLmJqE",
          videoId: "yNqCpMLmJqE",
          durationLabel: "8:09",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-x-cicd-q1",
          prompt: "What is the single most consequential difference between mobile CI and web CI?",
          options: [
            "The artefact must be signed by a vendor-issued identity, and losing that identity can permanently block updates to the listing",
            "Mobile builds are slower",
            "Mobile CI cannot run tests",
            "Mobile artefacts are larger",
          ],
          correctIndex: 0,
          explanation:
            "Slowness and size are inconveniences. An unrecoverable signing identity is the difference between an incident and the end of that app listing.",
        },
        {
          id: "mob-x-cicd-q2",
          prompt: "A team loses the keystore for an Android app that is not enrolled in Play App Signing. What is the consequence?",
          options: [
            "They can no longer publish updates to that listing; they must publish a new app and lose their installs and reviews",
            "Google can re-sign the next upload after identity verification",
            "They regenerate the keystore with the same alias and password and continue",
            "Existing users are unaffected and updates continue as normal",
          ],
          correctIndex: 0,
          explanation:
            "Android requires every update to be signed by the same key so the system can verify continuity, and a key cannot be recreated from its alias. Play App Signing exists precisely so an upload key can be reset instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-cicd-q3",
          prompt: "With Play App Signing enabled, which key does the developer hold?",
          options: [
            "The upload key, used only to authenticate uploads to Play; Google holds the app signing key that signs what users install",
            "Both keys, with Play holding a backup copy",
            "Neither; Play generates and holds everything",
            "The app signing key, with Play holding the upload key",
          ],
          correctIndex: 0,
          explanation:
            "Splitting the two is the point: the key you can lose is replaceable, and the one that must never change is held by Google. An upload key compromise is a support request, not the end of the listing.",
        },
        {
          id: "mob-x-cicd-q4",
          prompt: "What is an Apple provisioning profile?",
          options: [
            "A signed bundle tying an App ID, entitlements and a certificate together (plus device UDIDs for development and ad-hoc builds), with its own expiry",
            "The private key used to sign the app",
            "A list of the app's third-party dependencies",
            "The App Store metadata for a release",
          ],
          correctIndex: 0,
          explanation:
            "It is the authorisation document, not the key: it says which identity may sign which app with which entitlements, on which devices. Its expiry is a separate date from the certificate's.",
        },
        {
          id: "mob-x-cicd-q5",
          prompt: "Which of these are genuinely harder in mobile CI than in web CI? (Select all that apply.)",
          options: [
            "Secrets are files (keystores, certificates, profiles) that must be materialised on the runner",
            "Build numbers must be unique and monotonically increasing across all uploads, forever",
            "Apple builds require macOS runners, which constrains capacity and cost",
            "Running unit tests on every commit",
            "Storing environment variables in the CI provider",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "File-shaped secrets, globally monotonic build numbers and macOS-only builds are all real structural constraints. Unit tests and environment variables work the same way everywhere.",
        },
        {
          id: "mob-x-cicd-q6",
          prompt: "Why should the build number be owned by the pipeline rather than edited by developers?",
          options: [
            "It must be unique and increasing for every upload forever, so a hand-edited value eventually collides and the upload is rejected",
            "The stores compute it themselves from the version name",
            "Developers are not allowed to change project files in CI",
            "It affects the app's signature",
          ],
          correctIndex: 0,
          explanation:
            "Two people branching from the same commit produce the same number, and the store rejects the second upload after the build has already run. Deriving it from a counter or the CI run number removes the whole class of failure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-cicd-q7",
          prompt: "A pipeline goes red on a Monday with no code change: \"no valid signing identity\". What is the most likely cause?",
          options: [
            "A certificate or provisioning profile expired over the weekend",
            "The runner ran out of disk space",
            "The app's bundle identifier changed",
            "The store changed its review policy",
          ],
          correctIndex: 0,
          explanation:
            "Signing material expires on fixed dates that nobody has in a calendar, and the failure arrives with no commit attached. Tracking and rotating those dates ahead of time is the only real fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-cicd-q8",
          prompt: "Where should the signing keystore and its password live?",
          options: [
            "In a secret manager or an encrypted store, injected into a short-lived location on the runner for the duration of the build",
            "Committed to the repository, protected by branch permissions",
            "On the release engineer's laptop only",
            "In the CI configuration file, base64-encoded",
          ],
          correctIndex: 0,
          explanation:
            "Anything in the repository is readable by everyone who can clone it, and base64 is encoding, not encryption. One laptop is a single point of failure — the material must be recoverable by more than one person.",
        },
        {
          id: "mob-x-cicd-q9",
          prompt: "Where should the automated part of the mobile pipeline stop?",
          options: [
            "At a build available to testers (TestFlight or an internal track) on every merge, with promotion to production as a human decision",
            "At publishing directly to production on every merge to main",
            "At compiling; distribution should always be manual",
            "At running the unit tests",
          ],
          correctIndex: 0,
          explanation:
            "Review queues, staged rollouts and the inability to roll back mean production is a decision, not a build step. Everything below that is repetitive and belongs to the machine.",
        },
        {
          id: "mob-x-cicd-q10",
          prompt: "What problem does a tool like fastlane `match` solve?",
          options: [
            "It keeps certificates and profiles in one encrypted, shared store so every machine and runner provisions the same identity reproducibly",
            "It signs builds without a certificate",
            "It bypasses provisioning profiles for CI builds",
            "It generates a new signing identity for each build",
          ],
          correctIndex: 0,
          explanation:
            "The problem it attacks is drift: each developer and each runner otherwise generates its own certificates until nobody knows which is valid. It does not remove the need for a real signing identity.",
        },
      ],
    },
    {
      id: "mob-x-release-management",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "Staged Rollouts, Feature Flags and Kill Switches",
      summary:
        "On the web, a bad deploy is reverted in minutes. On mobile there is no revert: the binary is on the user's device, halting a rollout does not remove it from anyone who already has it, and a fix has to be built, reviewed and rolled out again. That asymmetry is why release management is a distinct discipline here rather than a deployment detail.\n\nThe two stores give you different instruments, and the difference matters. Google Play's **staged rollout** is manual and available for updates only: you pick a percentage, it does not increase on its own, you can halt it, and you can target specific countries — but once started you cannot remove countries, and **halting does not roll anyone back**; users who already received the version keep it. Apple's **phased release** is automatic and fixed: over seven days it reaches 1%, 2%, 5%, 10%, 20%, 50% and 100% of users **who have automatic updates enabled**, you can pause it for up to 30 days in total, and anyone can still download the new version manually from the App Store at any time. Neither mechanism is a rollback; both are ways to limit how many people meet a bug before you notice it.\n\nWhich is why the real control plane is in your own binary. A **feature flag** decouples \"the code is shipped\" from \"the feature is on\", and a **kill switch** — a flag fetched at launch and cached, wired so that failing to fetch it leaves the safe value in place — is the only thing that lets you turn something off in minutes rather than days. Every genuinely risky change should ship dark behind one: a new payment provider, a rewritten sync engine, a new checkout screen.\n\nThe bucketing has to be right or the whole thing is useless. A user's assignment must be **sticky** (the same answer every launch), **independent per flag** (so two experiments do not accidentally correlate), and **monotone as you ramp** (raising 10% to 25% must only add users, never shuffle the set). All three fall out of hashing the flag key together with a stable user id and comparing the bucket against the percentage — which is what you will implement below.\n\nThe gotcha is flag debt. Every flag is a branch in production, and n flags is 2^n configurations you have not tested. Flags need owners and expiry dates, and \"remove the flag\" belongs in the same ticket as \"ramp to 100%\" — otherwise a codebase accumulates dead toggles that nobody dares delete.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        { label: "Play Console Help: Release app updates with staged rollouts", url: "https://support.google.com/googleplay/android-developer/answer/6346149", kind: "docs" },
        { label: "Apple: Release a version update in phases", url: "https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/", kind: "docs" },
        { label: "Martin Fowler: Feature Toggles (aka Feature Flags)", url: "https://martinfowler.com/articles/feature-toggles.html", kind: "article" },
        { label: "Firebase: Remote Config", url: "https://firebase.google.com/docs/remote-config", kind: "docs" },
      ],
      video: {
        title: "Ship faster with feature flags using Firebase Remote Config",
        channel: "Firebase",
        url: "https://www.youtube.com/watch?v=vWJ8wDzeEg0",
        videoId: "vWJ8wDzeEg0",
        durationLabel: "14:57",
      },
      alternateVideos: [
        {
          title: "Feature flagging with Remote Config and Google Analytics",
          channel: "Firebase",
          url: "https://www.youtube.com/watch?v=23T9SGLcDsM",
          videoId: "23T9SGLcDsM",
          durationLabel: "36:15",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement the two functions a percentage rollout is built from.\n\n- `bucketOf(flagKey, userId)` returns a stable integer in `[0, 99]`. Use the provided `fnv1a(string)` helper, and hash the **flag key together with the user id** so that two flags bucket the same user independently.\n- `isEnabled(flagKey, userId, percent)` returns a boolean: the user is in the rollout when their bucket is below `percent`. `percent <= 0` enables nobody and `percent >= 100` enables everybody.\n\nThe properties that matter, and that the tests check:\n\n- **Sticky** — the same user and flag give the same answer every time, with no randomness and no dependence on wall-clock time.\n- **Monotone** — raising the percentage only ever adds users, so a ramp never takes the feature away from someone who had it.\n- **Independent per flag** — the same users bucket differently under a different flag key.\n\nThe tests call `runRollout(flagKey, userIds, percents)`, which evaluates every user at every percentage and reports `counts` (how many were enabled at each percentage) and `sample` (which of the first five user ids were enabled, in input order). Leave the driver and `fnv1a` as they are.",
        starterCode:
          "/**\n * A stable bucket in [0, 99] for this flag and user.\n * @param {string} flagKey\n * @param {string} userId\n * @returns {number}\n */\nfunction bucketOf(flagKey, userId) {\n  // Your code here\n}\n\n/**\n * @param {string} flagKey\n * @param {string} userId\n * @param {number} percent\n * @returns {boolean}\n */\nfunction isEnabled(flagKey, userId, percent) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction fnv1a(str) {\n  let h = 0x811c9dc5;\n  for (let i = 0; i < str.length; i++) {\n    h ^= str.charCodeAt(i);\n    h = Math.imul(h, 0x01000193) >>> 0;\n  }\n  return h >>> 0;\n}\n\nfunction runRollout(flagKey, userIds, percents) {\n  const counts = [];\n  const sample = [];\n  for (const percent of percents) {\n    counts.push(userIds.filter((id) => Boolean(isEnabled(flagKey, id, percent))).length);\n    sample.push(userIds.slice(0, 5).filter((id) => Boolean(isEnabled(flagKey, id, percent))));\n  }\n  return { counts, sample };\n}\n",
        functionName: "runRollout",
        testCases: [
          {
            description: "a 0% rollout enables nobody",
            args: ["checkout-v2", ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6", "user-7", "user-8", "user-9", "user-10", "user-11", "user-12"], [0]],
            expected: { counts: [0], sample: [[]] },
          },
          {
            description: "a 100% rollout enables everybody",
            args: ["checkout-v2", ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6", "user-7", "user-8", "user-9", "user-10", "user-11", "user-12"], [100]],
            expected: { counts: [12], sample: [["user-1", "user-2", "user-3", "user-4", "user-5"]] },
          },
          {
            description: "ramping 10 -> 25 -> 50 -> 100 over 200 users only ever adds people",
            args: ["checkout-v2", ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6", "user-7", "user-8", "user-9", "user-10", "user-11", "user-12", "user-13", "user-14", "user-15", "user-16", "user-17", "user-18", "user-19", "user-20", "user-21", "user-22", "user-23", "user-24", "user-25", "user-26", "user-27", "user-28", "user-29", "user-30", "user-31", "user-32", "user-33", "user-34", "user-35", "user-36", "user-37", "user-38", "user-39", "user-40", "user-41", "user-42", "user-43", "user-44", "user-45", "user-46", "user-47", "user-48", "user-49", "user-50", "user-51", "user-52", "user-53", "user-54", "user-55", "user-56", "user-57", "user-58", "user-59", "user-60", "user-61", "user-62", "user-63", "user-64", "user-65", "user-66", "user-67", "user-68", "user-69", "user-70", "user-71", "user-72", "user-73", "user-74", "user-75", "user-76", "user-77", "user-78", "user-79", "user-80", "user-81", "user-82", "user-83", "user-84", "user-85", "user-86", "user-87", "user-88", "user-89", "user-90", "user-91", "user-92", "user-93", "user-94", "user-95", "user-96", "user-97", "user-98", "user-99", "user-100", "user-101", "user-102", "user-103", "user-104", "user-105", "user-106", "user-107", "user-108", "user-109", "user-110", "user-111", "user-112", "user-113", "user-114", "user-115", "user-116", "user-117", "user-118", "user-119", "user-120", "user-121", "user-122", "user-123", "user-124", "user-125", "user-126", "user-127", "user-128", "user-129", "user-130", "user-131", "user-132", "user-133", "user-134", "user-135", "user-136", "user-137", "user-138", "user-139", "user-140", "user-141", "user-142", "user-143", "user-144", "user-145", "user-146", "user-147", "user-148", "user-149", "user-150", "user-151", "user-152", "user-153", "user-154", "user-155", "user-156", "user-157", "user-158", "user-159", "user-160", "user-161", "user-162", "user-163", "user-164", "user-165", "user-166", "user-167", "user-168", "user-169", "user-170", "user-171", "user-172", "user-173", "user-174", "user-175", "user-176", "user-177", "user-178", "user-179", "user-180", "user-181", "user-182", "user-183", "user-184", "user-185", "user-186", "user-187", "user-188", "user-189", "user-190", "user-191", "user-192", "user-193", "user-194", "user-195", "user-196", "user-197", "user-198", "user-199", "user-200"], [10, 25, 50, 100]],
            expected: {
              counts: [21, 47, 99, 200],
              sample: [["user-1"], ["user-1"], ["user-1", "user-2", "user-3"], ["user-1", "user-2", "user-3", "user-4", "user-5"]],
            },
          },
          {
            description: "assignment is sticky: the same percentage asked three times gives the same set",
            args: ["checkout-v2", ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6", "user-7", "user-8", "user-9", "user-10", "user-11", "user-12"], [30, 30, 30]],
            expected: { counts: [5, 5, 5], sample: [["user-1", "user-2"], ["user-1", "user-2"], ["user-1", "user-2"]] },
          },
          {
            description: "the same users at 30% under the checkout flag",
            args: ["checkout-v2", ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6", "user-7", "user-8", "user-9", "user-10", "user-11", "user-12"], [30]],
            expected: { counts: [5], sample: [["user-1", "user-2"]] },
          },
          {
            description: "a different flag key buckets the same users differently",
            args: ["new-onboarding", ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6", "user-7", "user-8", "user-9", "user-10", "user-11", "user-12"], [30]],
            expected: { counts: [5], sample: [["user-2", "user-3", "user-4"]] },
          },
          {
            description: "no users at all",
            args: ["checkout-v2", [], [0, 50, 100]],
            expected: { counts: [0, 0, 0], sample: [[], [], []] },
            isEdgeCase: true,
          },
          {
            description: "percentages outside 0-100 behave as fully off and fully on",
            args: ["checkout-v2", ["user-1", "user-2", "user-3", "user-4", "user-5", "user-6", "user-7", "user-8", "user-9", "user-10", "user-11", "user-12"], [-10, 150]],
            expected: { counts: [0, 12], sample: [[], ["user-1", "user-2", "user-3", "user-4", "user-5"]] },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "mob-x-crash-observability",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "Crash Reporting, Symbolication and Mobile Observability",
      summary:
        "Server observability assumes you can log anything, ship it immediately, and go and look at the machine. Mobile assumes none of that. Telemetry is collected on a device you do not control, buffered because the network may be gone, sent on the user's battery and data plan, and it arrives from an app version you may have shipped six months ago and cannot change. Everything about mobile observability follows from those constraints.\n\nA release build is compiled, optimised and stripped, so the stack trace it produces is addresses and mangled names. **Symbolication** — on Apple platforms via the `dSYM` bundle produced by that exact build, on Android via the R8/ProGuard `mapping.txt` and, for native code, the unstripped `.so` files — is what turns it back into file names and line numbers. Those artefacts are generated per build and are useless from any other build, so uploading them is a release-pipeline step, not an afterthought: lose the mapping file and every crash from that version is permanently unreadable. Bitwise-identical rebuilds are not guaranteed, so \"we can rebuild it later\" is not a plan.\n\nCrashes are only half the story. **ANRs** on Android and their iOS equivalent, watchdog terminations, are often more damaging than crashes because the user sits through the freeze and often kills the app themselves. Both stores publish these as quality metrics, so they are not only an engineering concern. The headline number is not raw crash count but **crash-free sessions and crash-free users**, because raw counts move with install volume. Mobile RUM then adds what crash reporting misses: startup time, screen render time, network error rates by endpoint, and the sequence of user actions before a failure.\n\nThe gotcha is release-scoped adoption. A fix does not fix anything until users update, so every metric must be sliced by app version and read against how much of the install base has that version — a crash that \"disappeared\" usually just means the affected version stopped being installed. And PII belongs nowhere in these payloads: breadcrumbs and log lines are the classic accidental route for an email address or a token to leave the device.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Firebase: Get readable crash reports (Android)", url: "https://firebase.google.com/docs/crashlytics/android/get-deobfuscated-reports", kind: "docs" },
        { label: "Apple: Adding identifiable symbol names to a crash report", url: "https://developer.apple.com/documentation/xcode/adding-identifiable-symbol-names-to-a-crash-report", kind: "docs" },
        { label: "Android Developers: ANRs", url: "https://developer.android.com/topic/performance/issues/anr", kind: "docs" },
        { label: "OpenTelemetry: Client-side Apps", url: "https://opentelemetry.io/docs/platforms/client-apps/", kind: "docs" },
      ],
      video: {
        title: "Observability for Mobile with OpenTelemetry",
        channel: "OpenObservability Talks",
        url: "https://www.youtube.com/watch?v=kIid85wO8gc",
        videoId: "kIid85wO8gc",
        startSeconds: 102,
        chapterLabel: "the unique characteristics of mobile env",
        durationLabel: "1:03:01",
      },
      alternateVideos: [
        {
          title: "Android vitals on Google Play Console",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=C9MZNEW20B4",
          videoId: "C9MZNEW20B4",
          durationLabel: "5:05",
        },
        {
          title: "Sentry in Six Minutes",
          channel: "Sentry",
          url: "https://www.youtube.com/watch?v=4djseRVSan8",
          videoId: "4djseRVSan8",
          durationLabel: "6:14",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-x-crash-observability-q1",
          prompt: "Why is a stack trace from a release build unreadable without extra artefacts?",
          options: [
            "The build is optimised and stripped, so the trace holds addresses and mangled names rather than file and line information",
            "Release builds do not produce stack traces at all",
            "The OS encrypts crash reports with the app signing key",
            "Crash reports are truncated to 10 frames in release mode",
          ],
          correctIndex: 0,
          explanation:
            "Optimisation removes and renames symbols, which is exactly what makes the binary small and fast. The debug symbols are set aside at build time and have to be uploaded so the trace can be mapped back.",
        },
        {
          id: "mob-x-crash-observability-q2",
          prompt: "A team discards the `mapping.txt` from an Android release and keeps the source commit, planning to rebuild if needed. What is wrong with that plan?",
          options: [
            "Obfuscation is not guaranteed to be reproducible, so a rebuilt mapping may not match the shipped binary, and crashes from that version stay unreadable forever",
            "Nothing: the same commit always produces the same mapping",
            "The store keeps a copy of every mapping file",
            "The mapping file is only needed for native crashes",
          ],
          correctIndex: 0,
          explanation:
            "Toolchain versions, dependency resolution and build inputs all affect the output. The mapping belongs to that exact artefact, which is why uploading it is a pipeline step and not a manual chore.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-crash-observability-q3",
          prompt: "Why track crash-free sessions or crash-free users rather than the raw number of crashes?",
          options: [
            "Raw counts move with install and usage volume, so a growing app looks worse and a shrinking one looks better regardless of quality",
            "Raw counts are not available from any crash reporter",
            "Crash-free rates are the only metric the stores accept",
            "Raw counts cannot be sliced by app version",
          ],
          correctIndex: 0,
          explanation:
            "A rate normalises for traffic, which is the only way a number is comparable across weeks or between releases. Counts are still useful for ranking individual issues.",
        },
        {
          id: "mob-x-crash-observability-q4",
          prompt: "Why can an ANR (or a watchdog termination on iOS) be worse for the product than an outright crash?",
          options: [
            "The user sits through a frozen app and often kills it themselves, and the experience reads as \"slow and broken\" in reviews and store quality metrics",
            "ANRs cannot be detected or reported",
            "ANRs always corrupt the local database",
            "ANRs are counted twice in crash-free rates",
          ],
          correctIndex: 0,
          explanation:
            "A crash is instant and often invisible; a freeze is a bad experience the user endures and remembers. Both stores surface these as quality signals that can affect visibility.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-crash-observability-q5",
          prompt: "Which of these make mobile telemetry structurally harder than server telemetry? (Select all that apply.)",
          options: [
            "It must be buffered on-device and sent later, because the network may be unavailable",
            "It is sent on the user's battery and data plan, so volume has a real cost",
            "It arrives from app versions you shipped long ago and cannot change",
            "Mobile platforms forbid sending any telemetry without consent from the OS",
            "Mobile devices cannot generate timestamps",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Buffering, cost and long-lived old versions are the three constraints that shape every design decision here. Telemetry is allowed subject to your own privacy disclosures, and devices have clocks — untrustworthy ones, but clocks.",
        },
        {
          id: "mob-x-crash-observability-q6",
          prompt: "A crash \"disappears\" from the dashboard a week after a fix ships. What should you verify before believing it?",
          options: [
            "How much of the install base is actually on the fixed version — the old version may simply have fewer sessions now",
            "That the crash reporter's quota has not been exceeded",
            "That the stack trace was symbolicated",
            "That the fix was merged to main",
          ],
          correctIndex: 0,
          explanation:
            "Mobile metrics are a mixture of every version in the wild. Slicing by app version and reading against adoption is the only way to tell \"fixed\" from \"the affected cohort shrank\".",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-crash-observability-q7",
          prompt: "Which signals belong in mobile RUM rather than in a crash reporter?",
          options: [
            "Cold start time, screen render time and per-endpoint network error rates",
            "The stack trace of a fatal exception",
            "The device model on which a crash occurred",
            "The mapping file for the release",
          ],
          correctIndex: 0,
          explanation:
            "RUM covers the app that is working but slowly, which is where most user pain lives. Traces, device metadata and mapping artefacts are all part of crash reporting.",
        },
        {
          id: "mob-x-crash-observability-q8",
          prompt: "Breadcrumbs are added before every network call, including the full request URL. What is the risk?",
          options: [
            "URLs routinely carry identifiers and sometimes tokens, so personal data leaves the device inside crash payloads",
            "Breadcrumbs slow the app down measurably",
            "Breadcrumbs are stripped by the crash reporter anyway",
            "Breadcrumbs make symbolication fail",
          ],
          correctIndex: 0,
          explanation:
            "Diagnostic payloads are the classic accidental exfiltration route, and they also have to match what your privacy disclosures claim you collect. Log the route template and a request id, not the full URL.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-crash-observability-q9",
          prompt: "Which of these are good reasons to adopt OpenTelemetry for mobile signals? (Select all that apply.)",
          options: [
            "Client spans can join the same traces as backend spans instead of living in a separate vendor tool",
            "The instrumentation is not tied to one vendor's backend",
            "A shared data model means one query language across client and server",
            "It removes the need to upload symbolication artefacts",
            "It guarantees lower telemetry volume than a proprietary SDK",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Correlation, portability and a shared model are the real arguments. Symbolication is orthogonal, and volume depends on what you choose to emit, not on the protocol.",
        },
        {
          id: "mob-x-crash-observability-q10",
          prompt: "A native (NDK / C++) crash arrives as raw addresses even though the Java-side mapping was uploaded. What is missing?",
          options: [
            "The unstripped native libraries or their debug symbols for that exact build",
            "A second copy of the Java mapping file",
            "The provisioning profile",
            "A larger crash-report size limit",
          ],
          correctIndex: 0,
          explanation:
            "Native frames need native symbols; the managed-code mapping says nothing about them. Release pipelines have to upload both, and both are per-build artefacts.",
        },
      ],
    },
    {
      id: "mob-x-analytics-privacy",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "Analytics, Consent and What You May Not Collect",
      summary:
        "Mobile analytics is where engineering decisions are most directly constrained by platform policy, and where \"we'll sort the compliance out later\" produces rejected builds. The rules are not identical between the stores, but they rhyme: declare what you collect, get permission for what needs it, collect nothing you did not declare.\n\nApple's **App Tracking Transparency** is narrower than people assume. \"Tracking\" means linking user or device data from your app with data collected from **other companies'** apps, websites or offline properties for targeted advertising or ad measurement — or sharing user or device data with a data broker. Analytics that stays within your own apps is not tracking; linking third-party data **solely on the device** is not tracking; sharing with a data broker purely for fraud prevention is not tracking. If you do track, you need the ATT prompt and an `NSUserTrackingUsageDescription` purpose string, and until the user grants permission the advertising identifier (IDFA) is returned as all zeros. The identifier for vendor (IDFV) needs no ATT prompt for analytics across your own apps, but may not be combined with other companies' data. A third-party SDK can put you in scope even when you do not use it for advertising yourself, which is what **privacy manifests** surface: Xcode aggregates your app's and its dependencies' manifests into one report behind the Privacy Nutrition Label.\n\nGoogle Play's equivalent is the **Data safety** section: what you collect and share, why, whether it is encrypted in transit, and whether deletion can be requested. Both are promises about the whole binary, every SDK included, and both stores treat a mismatch between declaration and behaviour as an enforcement matter. On top of the stores sit real laws — GDPR, CCPA/CPRA and regional variations. The engineering consequence is the same everywhere: **consent must gate initialisation, not just transmission.** An analytics SDK started at launch has usually already minted an identifier and sent a session event before your consent dialog renders.\n\nThe gotcha is the event taxonomy. \"Log everything, decide later\" is exactly what you cannot do: every field is something you must declare, defend and be able to delete. Design a small, reviewed event schema, and treat adding a property with the same scrutiny as a schema migration.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Apple: User Privacy and Data Use", url: "https://developer.apple.com/app-store/user-privacy-and-data-use/", kind: "docs" },
        { label: "Apple: App Tracking Transparency", url: "https://developer.apple.com/documentation/apptrackingtransparency", kind: "docs" },
        { label: "Apple: Privacy manifest files", url: "https://developer.apple.com/documentation/bundleresources/privacy-manifest-files", kind: "docs" },
        { label: "Play Console Help: Provide information for Google Play's Data safety section", url: "https://support.google.com/googleplay/android-developer/answer/10787469", kind: "docs" },
      ],
      video: {
        title: "WWDC22: Create your Privacy Nutrition Label  | Apple",
        channel: "Apple Developer",
        url: "https://www.youtube.com/watch?v=UMijW-63MZk",
        videoId: "UMijW-63MZk",
        durationLabel: "12:14",
      },
      alternateVideos: [
        {
          title: "Google Play PolicyBytes - Data safety form walkthrough",
          channel: "Android Developers",
          url: "https://www.youtube.com/watch?v=4rfF3y4xchU",
          videoId: "4rfF3y4xchU",
          durationLabel: "15:09",
        },
        {
          title: "What is App Tracking Transparency (ATT)? Apple's Privacy Framework Explained",
          channel: "AppsFlyer",
          url: "https://www.youtube.com/watch?v=OdwbJdoH5FM",
          videoId: "OdwbJdoH5FM",
          durationLabel: "2:04",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-x-analytics-privacy-q1",
          prompt: "Which of these count as \"tracking\" under Apple's definition and therefore require the ATT prompt? (Select all that apply.)",
          options: [
            "Sharing device location data or an email list with a data broker",
            "Embedding a third-party SDK that combines your users' data with data from other developers' apps to target advertising",
            "Sharing advertising IDs with an ad network so it can retarget those users in other developers' apps",
            "Measuring which of your own app's screens users visit, with the data staying in your own systems",
            "Linking third-party data to your data solely on the device, with nothing identifying sent off it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Tracking is about linking or sharing across *other companies'* properties for advertising, or sharing with data brokers. First-party analytics and purely on-device linkage are explicitly outside the definition.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-analytics-privacy-q2",
          prompt: "An app requests the advertising identifier without ever presenting the ATT prompt. What does it get?",
          options: [
            "An identifier of all zeros",
            "A fresh random identifier on each launch",
            "The identifier for vendor instead",
            "A runtime exception",
          ],
          correctIndex: 0,
          explanation:
            "Apple returns all zeros until the user has been asked and has granted permission. Code that treats the zeroed value as a real id ends up attributing every unauthorised user to a single \"person\".",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-analytics-privacy-q3",
          prompt: "What is the difference between the IDFA and the IDFV?",
          options: [
            "The IDFA is for cross-company advertising and needs ATT permission; the IDFV identifies a device across apps from the same vendor and does not, but must not be combined with other companies' data",
            "They are the same value exposed by two frameworks",
            "The IDFV requires ATT permission and the IDFA does not",
            "The IDFV is unique per install and resets on every launch",
          ],
          correctIndex: 0,
          explanation:
            "Vendor-scoped analytics is the legitimate use of the IDFV and needs no prompt. Using it to build a cross-company profile would be tracking by another name, which the policy addresses directly.",
        },
        {
          id: "mob-x-analytics-privacy-q4",
          prompt: "An analytics SDK is initialised in the app's launch handler, and the consent dialog appears on the first screen. What is the defect?",
          options: [
            "The SDK has usually already generated an identifier and sent a session event before consent was given",
            "Nothing, as long as events are queued and only sent after consent",
            "The SDK cannot be initialised that early on either platform",
            "Consent dialogs are not allowed on the first screen",
          ],
          correctIndex: 0,
          explanation:
            "Consent has to gate initialisation, not just transmission — by the time your dialog renders, the identifier exists and the first event has left. The fix is a lazy start after the consent decision.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-analytics-privacy-q5",
          prompt: "What problem do Apple's privacy manifests solve?",
          options: [
            "Third-party SDKs declare what they collect and whether they track, and Xcode aggregates every manifest into one report you use to fill in the Privacy Nutrition Label",
            "They replace the App Store privacy questionnaire entirely",
            "They encrypt analytics payloads in transit",
            "They let users revoke consent per SDK at runtime",
          ],
          correctIndex: 0,
          explanation:
            "The declaration covers the whole binary, and you cannot read every dependency's source. Manifests push that knowledge to the parties who have it and roll it up for you.",
        },
        {
          id: "mob-x-analytics-privacy-q6",
          prompt: "Play's Data safety declaration says the app does not collect location. A newly added SDK starts collecting coarse location. What is the correct framing?",
          options: [
            "The declaration covers the whole binary including every SDK, so it is now inaccurate and must be updated — a mismatch is an enforcement matter",
            "SDK behaviour is out of scope; only first-party code is declared",
            "It is fine as long as the location is not sent to your own servers",
            "It only matters if the SDK collects precise rather than coarse location",
          ],
          correctIndex: 0,
          explanation:
            "You are responsible for what you ship, whoever wrote it. Adding a dependency is therefore a privacy-review event, not only a technical one.",
        },
        {
          id: "mob-x-analytics-privacy-q7",
          prompt: "Why is \"log every event with every available property and decide what matters later\" a bad default?",
          options: [
            "Every field is something you must declare, justify, secure and be able to delete on request",
            "Analytics providers cap the number of distinct properties",
            "It makes the app binary larger",
            "Events with many properties cannot be aggregated",
          ],
          correctIndex: 0,
          explanation:
            "Data you hold is data you are accountable for under both store policy and law. A small reviewed schema is cheaper to run and far cheaper to defend.",
        },
        {
          id: "mob-x-analytics-privacy-q8",
          prompt: "Which of these are reasonable engineering responses to a deletion request under a privacy regime? (Select all that apply.)",
          options: [
            "A stable internal user id in events, so records can be found and removed",
            "An in-app route to request account and data deletion",
            "Propagating the deletion to analytics and crash-reporting vendors",
            "Relying on the device's local cache being cleared when the app is uninstalled",
            "Hashing the email address in events so the data is considered anonymous",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "You need to be able to find the records, offer a route to ask, and reach every processor holding a copy. Uninstalling does not touch your servers, and a hash of a known identifier is still a pseudonymous identifier.",
        },
        {
          id: "mob-x-analytics-privacy-q9",
          prompt: "A team wants conversion measurement on iOS without asking for tracking permission. Which approach fits the policy?",
          options: [
            "Use Apple's privacy-preserving attribution framework, which reports aggregated, delayed conversions with no user-level identifier",
            "Fingerprint the device from screen size, locale and model, which is not an advertising identifier",
            "Use the IDFV to join with the ad network's data",
            "Ask for the prompt but proceed with tracking regardless of the answer",
          ],
          correctIndex: 0,
          explanation:
            "Aggregated attribution is the sanctioned path when the user has not consented. Fingerprinting is explicitly prohibited, joining IDFV with another company's data is tracking, and ignoring the answer is straightforward non-compliance.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-analytics-privacy-q10",
          prompt: "Why should the ATT prompt not be shown on the very first launch screen in most apps?",
          options: [
            "The user has no context yet, so a request explained by a purpose string they cannot evaluate is usually denied — and a denial is hard to reverse",
            "Apple forbids showing it before the user has signed in",
            "The prompt cannot be shown until the app has been used for 24 hours",
            "It causes the advertising identifier to be permanently zeroed",
          ],
          correctIndex: 0,
          explanation:
            "You may show it whenever you choose, but you get one shot at a good impression: after that the user has to go into Settings to change their mind. Ask after the user has seen enough of the app for the purpose string to mean something.",
        },
      ],
    },
    {
      id: "mob-x-app-size-startup",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "App Size and Startup as Engineering Budgets",
      summary:
        "Download size and cold start are not optimisations you do once; they are budgets that regress continuously, one innocuous dependency at a time. Treating them as numbers with owners and CI gates is the only approach that survives a growing team.\n\nOn the size side, the leverage comes from shipping each device only what it needs. Android app bundles let Play generate per-device artefacts, so a user does not download every architecture, density and language; Apple's app thinning does the equivalent, with on-demand resources for content that can arrive later. Then there is code shrinking and resource shrinking — R8 on Android, dead-code stripping on Apple platforms — which needs keep rules for anything reached only by reflection, a classic source of \"works in debug, crashes in release\". Beyond tooling, the biggest wins are usually boring: compressed and correctly sized images, no bundled fonts you do not use, and an honest look at what a dependency costs for the one function you imported from it.\n\nOn the startup side, the distinction that matters is between **time to initial display** — when the first frame appears — and **time to full display**, when the app is actually usable. Optimising only for the first produces a skeleton that renders in 200 ms and stays useless for four seconds: excellent on the metric, terrible for the person holding the phone. Cold start is the case to optimise, because it is the worst one and improving it improves warm and hot starts too. The work is almost always the same: SDK initialisers that run on the main thread before the first frame, a dependency graph built eagerly, disk or network I/O on the startup path, and layouts that are more expensive than they look. Android adds **baseline profiles**, which ship a list of hot methods so they are precompiled rather than interpreted on first run — a genuinely large win for first-launch performance that costs nothing at runtime.\n\nThe gotcha is measurement. A flagship phone with a warm cache, a debugger attached and an office network hides every one of these problems, and a debug build is not the build your users run. Budget against a mid-range device, a genuine cold start and a slow network; measure with the platform's own benchmarking harness rather than a stopwatch; and put the number in CI, because a startup regression arrives as a dependency bump nobody reviewed for performance.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Android Developers: Baseline Profiles overview", url: "https://developer.android.com/topic/performance/baselineprofiles/overview", kind: "docs" },
        { label: "Apple: Reducing your app's size", url: "https://developer.apple.com/documentation/xcode/reducing-your-app-s-size", kind: "docs" },
        { label: "Android Developers: About Android App Bundles", url: "https://developer.android.com/guide/app-bundle", kind: "docs" },
        { label: "Android Developers: Write a Macrobenchmark", url: "https://developer.android.com/topic/performance/benchmarking/macrobenchmark-overview", kind: "docs" },
      ],
      video: {
        title: "Making apps blazing fast with Baseline Profiles",
        channel: "Android Developers",
        url: "https://www.youtube.com/watch?v=yJm5On5Gp4c",
        videoId: "yJm5On5Gp4c",
        durationLabel: "19:55",
      },
      alternateVideos: [
        {
          title: "THIS Is How You Measure the Performance of Your Android App",
          channel: "Philipp Lackner",
          url: "https://www.youtube.com/watch?v=XHz_cFwdfoM",
          videoId: "XHz_cFwdfoM",
          durationLabel: "21:30",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "mob-x-app-size-startup-q1",
          prompt: "An app's time to initial display is 180 ms and its time to full display is 4.2 s. What does that describe?",
          options: [
            "A skeleton or splash that appears instantly while the app remains unusable — good on one metric, bad for the user",
            "A healthy startup, since the first frame is what users perceive",
            "A measurement error, since full display cannot exceed initial display by that much",
            "A warm start rather than a cold start",
          ],
          correctIndex: 0,
          explanation:
            "Time to initial display only says something was drawn. Usability is what full display measures, which is why optimising for the first number alone is the classic mistake.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-app-size-startup-q2",
          prompt: "Why is cold start the case to optimise?",
          options: [
            "It is the worst case, and the work that makes it faster also makes warm and hot starts faster",
            "It is the only one the stores measure",
            "Warm and hot starts cannot be improved",
            "Cold start is the most common start type for every app",
          ],
          correctIndex: 0,
          explanation:
            "Cold start includes process creation and all the initialisation that the other cases skip, so improvements there are a superset. How often it happens varies enormously by app.",
        },
        {
          id: "mob-x-app-size-startup-q3",
          prompt: "What do baseline profiles do?",
          options: [
            "Ship a list of hot code paths so they are precompiled ahead of time instead of being interpreted or JIT-compiled on first run",
            "Compress resources more aggressively in release builds",
            "Remove unused classes from the final binary",
            "Cache the first screen's rendered output on disk",
          ],
          correctIndex: 0,
          explanation:
            "They target the cost of first execution, which is why the win is largest on first launch and after an update. Shrinking and resource compression are separate tools with separate effects.",
        },
        {
          id: "mob-x-app-size-startup-q4",
          prompt: "Code shrinking is enabled for release and the app crashes with a class-not-found error that debug builds never show. What is the likely cause?",
          options: [
            "A class is reached only by reflection or from a configuration file, so the shrinker could not see the reference and removed it",
            "The shrinker corrupted the bytecode",
            "The release build used a different minimum OS version",
            "Shrinking is incompatible with dependency injection",
          ],
          correctIndex: 0,
          explanation:
            "Static analysis cannot follow a name resolved at runtime, which is why reflective entry points need keep rules. This is also why release builds must be tested, not assumed equivalent to debug.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-app-size-startup-q5",
          prompt: "What do Android app bundles and Apple's app thinning have in common?",
          options: [
            "The store generates a per-device artefact so a user does not download architectures, densities or languages they will never use",
            "They compress the binary with a stronger algorithm",
            "They defer all resources until first use",
            "They remove unused code automatically",
          ],
          correctIndex: 0,
          explanation:
            "Both move artefact assembly to the store, which is the only place that knows the target device. Code removal and deferred downloads are different mechanisms.",
        },
        {
          id: "mob-x-app-size-startup-q6",
          prompt: "Which of these commonly dominate cold start in a real app? (Select all that apply.)",
          options: [
            "Third-party SDK initialisers running on the main thread before the first frame",
            "An eagerly constructed dependency graph that opens a database at startup",
            "Disk or network I/O on the path to the first screen",
            "The number of source files in the project",
            "The size of the app's app store screenshots",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Startup cost is work done before the first usable frame, and SDKs, eager graphs and I/O are where that work hides. Source file count and store listing assets have nothing to do with runtime.",
        },
        {
          id: "mob-x-app-size-startup-q7",
          prompt: "Why do download size budgets matter commercially, not just technically?",
          options: [
            "Install conversion drops as size grows, most sharply where connections are slow or data is metered",
            "The stores charge per megabyte of distribution",
            "Large apps are ranked lower in search by policy",
            "Large apps are limited to fewer countries",
          ],
          correctIndex: 0,
          explanation:
            "Size is a funnel metric: people abandon a download they think is too big for their plan or their patience. Neither store bills you by size or demotes you for it directly.",
        },
        {
          id: "mob-x-app-size-startup-q8",
          prompt: "A team measures startup on the lead engineer's current flagship phone, debug build, office Wi-Fi, app recently used. What is wrong with that baseline?",
          options: [
            "Every one of those conditions hides a real cost, so the number is unrelated to what users experience",
            "Nothing: relative improvements are still comparable",
            "Debug builds are always slower, so the number is pessimistic and therefore safe",
            "Startup cannot be measured on a physical device",
          ],
          correctIndex: 0,
          explanation:
            "A warm cache removes cold start, a fast device removes the CPU cost, a fast network removes I/O latency and a debug build is not the code that ships. Budgets must be set on a representative device and a genuine cold start.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "mob-x-app-size-startup-q9",
          prompt: "What is the most durable way to stop startup time regressing over a year of development?",
          options: [
            "Measure it in CI on a fixed device configuration and fail the build when it crosses the budget",
            "Do an optimisation sprint each quarter",
            "Ask reviewers to consider performance in code review",
            "Add a startup dashboard that the team checks weekly",
          ],
          correctIndex: 0,
          explanation:
            "Regressions arrive one small change at a time, and only an automatic gate catches the change that caused them while it is still attributable. Dashboards and sprints find the damage after it has accumulated.",
        },
        {
          id: "mob-x-app-size-startup-q10",
          prompt: "An SDK must be initialised before the first screen but takes 400 ms. What is the best first move?",
          options: [
            "Check whether it can be initialised lazily or off the main thread, and defer the parts that are not needed for the first frame",
            "Move the call into a background thread and hope it finishes in time",
            "Accept it: SDK initialisation is outside your control",
            "Show a longer splash screen so the delay is not noticed",
          ],
          correctIndex: 0,
          explanation:
            "Most SDKs need far less at launch than their quick-start guide implies, and splitting initialisation is usually possible. Firing it off a thread without ordering guarantees just moves the bug, and a longer splash is the delay, not a fix.",
        },
      ],
    },
    {
      id: "mob-x-deep-links",
      moduleId: "mobile-cross-cutting",
      trackId: "mobile",
      title: "Deep Links, Universal Links and App Links",
      summary:
        "A deep link is a URL that opens a specific place inside your app, and the mobile web's original answer — a custom scheme such as `myapp://order/42` — is fundamentally insecure: any app can register the same scheme, so the OS cannot tell which one is legitimate. That is why both platforms replaced it with a **verified https link**, where opening the URL in a browser and opening it in the app are the same address, and the app proves it owns the domain.\n\nThe proof is a file. On Android, the system fetches `https://<host>/.well-known/assetlinks.json` for every host in an intent filter marked `android:autoVerify=\"true\"`, and matches your package name and signing certificate fingerprints. On Apple platforms you host `apple-app-site-association` — no file extension — at `https://<domain>/.well-known/`, served over HTTPS with a valid certificate and **no redirects**, listing the app identifiers and the path components it should claim; the app declares the matching associated-domains entitlement. Each subdomain needs its own entry and its own file. You can inspect the Android result on a device with `adb shell pm get-app-links <package>`, which reports each domain as `verified`, `none`, `legacy_failure` and so on.\n\nThe failure modes are silent. On Android 11 and lower, verification was all-or-nothing across every host in the manifest, so one unreachable domain broke app links for all of them; Android 12 made it per-domain and stricter. Only one app at a time can be associated with a given domain on a device, and an unverified link simply opens in the browser — no error, no crash, just a user who thinks your links are broken.\n\nOnce the link arrives, routing it is your problem, and that is where the second class of bug lives. A link can arrive on a cold start, while the app is backgrounded, or while the user is deep in an unrelated flow; it can point at content the user is not signed in to see, or is not entitled to, or that no longer exists. Each of those needs a defined behaviour — typically: park the destination, authenticate if needed, build a sensible back stack, then navigate — and every component of the URL is untrusted input, because anyone can craft one.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        { label: "Android Developers: Verify Android App Links", url: "https://developer.android.com/training/app-links/verify-applinks", kind: "docs" },
        { label: "Apple: Supporting associated domains", url: "https://developer.apple.com/documentation/xcode/supporting-associated-domains", kind: "docs" },
        { label: "Apple TN3155: Debugging universal links", url: "https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links", kind: "docs" },
        { label: "Android Developers: About deep links", url: "https://developer.android.com/training/app-links", kind: "docs" },
      ],
      video: {
        title: "How to set up iOS Universal Links and Android App Links with Expo Router",
        channel: "Expo",
        url: "https://www.youtube.com/watch?v=kNbEEYlFIPs",
        videoId: "kNbEEYlFIPs",
        durationLabel: "11:49",
      },
      alternateVideos: [
        {
          title: "Deep Links vs. Universal Links vs. App Links: The Ultimate Guide",
          channel: "Bharat Singh",
          url: "https://www.youtube.com/watch?v=2pzWWL0PQLA",
          videoId: "2pzWWL0PQLA",
          durationLabel: "15:02",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `matchDeepLink(patterns, url)`: the router that decides which screen an incoming https deep link opens.\n\n`url` is an https URL such as `https://example.com/orders/42?ref=email#top`. Use the provided `parseUrl` helper, which strips the fragment, percent-decodes the path into `segments` and returns the query as an object. Use `splitPattern` to split a pattern into its non-empty segments.\n\nA pattern segment is one of:\n\n- a literal, which must equal the segment exactly;\n- `:name`, which matches any one segment and captures it into `params.name`;\n- `*`, which must be the last segment and absorbs **zero or more** remaining segments, joined with `/` into `params.rest`.\n\nA pattern matches only if it consumes the whole path. Among all matching patterns, pick the most specific one by comparing position by position from the left, scoring a literal above `:name` above `*`; the first position where they differ decides. If they are equal for as far as both go, the pattern with more segments wins, and if they are still tied, the one declared earlier wins.\n\nReturn `{ pattern, params, query }` for the winner — `params` and `query` are always objects, empty when there is nothing to put in them — or `null` when nothing matches.",
        starterCode:
          "/**\n * Route an incoming https deep link to the most specific matching pattern.\n *\n * @param {string[]} patterns\n * @param {string} url\n * @returns {{ pattern: string, params: object, query: object } | null}\n */\nfunction matchDeepLink(patterns, url) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction splitPattern(pattern) {\n  return pattern.split(\"/\").filter((s) => s.length > 0);\n}\n\nfunction parseUrl(url) {\n  let rest = url.replace(/^https:\\/\\//, \"\");\n  const hash = rest.indexOf(\"#\");\n  if (hash >= 0) rest = rest.slice(0, hash);\n  let queryString = \"\";\n  const q = rest.indexOf(\"?\");\n  if (q >= 0) {\n    queryString = rest.slice(q + 1);\n    rest = rest.slice(0, q);\n  }\n  const slash = rest.indexOf(\"/\");\n  const path = slash >= 0 ? rest.slice(slash) : \"\";\n  const segments = path.split(\"/\").filter((s) => s.length > 0).map(decodeURIComponent);\n  const query = {};\n  for (const pair of queryString.split(\"&\")) {\n    if (!pair) continue;\n    const eq = pair.indexOf(\"=\");\n    const key = decodeURIComponent(eq >= 0 ? pair.slice(0, eq) : pair);\n    query[key] = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1)) : \"\";\n  }\n  return { segments, query };\n}\n",
        functionName: "matchDeepLink",
        testCases: [
          {
            description: "a literal route matches exactly",
            args: [["/", "/orders", "/orders/new", "/orders/:id", "/orders/:id/items/:itemId", "/help/*", "/a/*", "/a/:b", "/search/:term"], "https://example.com/orders"],
            expected: { pattern: "/orders", params: {}, query: {} },
          },
          {
            description: "a named segment is captured",
            args: [["/", "/orders", "/orders/new", "/orders/:id", "/orders/:id/items/:itemId", "/help/*", "/a/*", "/a/:b", "/search/:term"], "https://example.com/orders/42"],
            expected: { pattern: "/orders/:id", params: { id: "42" }, query: {} },
          },
          {
            description: "a literal beats a parameter at the same position",
            args: [["/", "/orders", "/orders/new", "/orders/:id", "/orders/:id/items/:itemId", "/help/*", "/a/*", "/a/:b", "/search/:term"], "https://example.com/orders/new"],
            expected: { pattern: "/orders/new", params: {}, query: {} },
          },
          {
            description: "a parameter beats a wildcard at the same position",
            args: [["/", "/orders", "/orders/new", "/orders/:id", "/orders/:id/items/:itemId", "/help/*", "/a/*", "/a/:b", "/search/:term"], "https://example.com/a/x"],
            expected: { pattern: "/a/:b", params: { b: "x" }, query: {} },
          },
          {
            description: "a wildcard absorbs the remaining segments",
            args: [["/", "/orders", "/orders/new", "/orders/:id", "/orders/:id/items/:itemId", "/help/*", "/a/*", "/a/:b", "/search/:term"], "https://example.com/help/billing/refunds"],
            expected: { pattern: "/help/*", params: { rest: "billing/refunds" }, query: {} },
          },
          {
            description: "nested parameters in one pattern",
            args: [["/", "/orders", "/orders/new", "/orders/:id", "/orders/:id/items/:itemId", "/help/*", "/a/*", "/a/:b", "/search/:term"], "https://example.com/orders/42/items/7"],
            expected: { pattern: "/orders/:id/items/:itemId", params: { id: "42", itemId: "7" }, query: {} },
          },
          {
            description: "the fragment is dropped and query values are percent-decoded",
            args: [["/", "/orders", "/orders/new", "/orders/:id", "/orders/:id/items/:itemId", "/help/*", "/a/*", "/a/:b", "/search/:term"], "https://example.com/orders/42?ref=email%20blast&utm=x#top"],
            expected: { pattern: "/orders/:id", params: { id: "42" }, query: { ref: "email blast", utm: "x" } },
          },
          {
            description: "a percent-encoded path segment is decoded before matching",
            args: [["/", "/orders", "/orders/new", "/orders/:id", "/orders/:id/items/:itemId", "/help/*", "/a/*", "/a/:b", "/search/:term"], "https://example.com/search/red%20shoes"],
            expected: { pattern: "/search/:term", params: { term: "red shoes" }, query: {} },
            isEdgeCase: true,
          },
          {
            description: "a wildcard with nothing left to absorb still matches, with an empty rest",
            args: [["/", "/orders", "/orders/new", "/orders/:id", "/orders/:id/items/:itemId", "/help/*", "/a/*", "/a/:b", "/search/:term"], "https://example.com/help"],
            expected: { pattern: "/help/*", params: { rest: "" }, query: {} },
            isEdgeCase: true,
          },
          {
            description: "a bare origin and a trailing slash both hit the root pattern",
            args: [["/", "/orders", "/orders/new", "/orders/:id", "/orders/:id/items/:itemId", "/help/*", "/a/*", "/a/:b", "/search/:term"], "https://example.com"],
            expected: { pattern: "/", params: {}, query: {} },
            isEdgeCase: true,
          },
          {
            description: "a trailing slash does not change the match",
            args: [["/", "/orders", "/orders/new", "/orders/:id", "/orders/:id/items/:itemId", "/help/*", "/a/*", "/a/:b", "/search/:term"], "https://example.com/orders/42/"],
            expected: { pattern: "/orders/:id", params: { id: "42" }, query: {} },
            isEdgeCase: true,
          },
          {
            description: "an unroutable path returns null rather than guessing",
            args: [["/", "/orders", "/orders/new", "/orders/:id", "/orders/:id/items/:itemId", "/help/*", "/a/*", "/a/:b", "/search/:term"], "https://example.com/nope/here"],
            expected: null,
            isEdgeCase: true,
          },
        ],
      },
    },
  ],
} satisfies Module;
