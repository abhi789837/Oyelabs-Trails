import type { Module } from "@/types/curriculum";

export default {
  id: "mobile-flutter",
  trackId: "mobile",
  name: "Flutter UI & State",
  description:
    "Flutter from the rendering model up: why it draws its own pixels, the three trees that make a rebuild cheap, the constraint algorithm that decides every size on screen, and the state-management decision nobody makes well the first time. Written for engineers who already know React — the bridges are real, and so is the place each one breaks.",
  refs: [
    { label: "Flutter: Architectural overview", url: "https://docs.flutter.dev/resources/architectural-overview", kind: "docs" },
    { label: "Flutter: Understanding constraints", url: "https://docs.flutter.dev/ui/layout/constraints", kind: "docs" },
    { label: "Flutter API: BuildContext", url: "https://api.flutter.dev/flutter/widgets/BuildContext-class.html", kind: "docs" },
    { label: "Flutter: Inside Flutter", url: "https://docs.flutter.dev/resources/inside-flutter", kind: "article" },
  ],
  topics: [
    {
      id: "flutter-rendering-model",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "How Flutter Renders: Engine, Impeller and One Canvas",
      summary:
        "Flutter does not wrap platform widgets. It asks the operating system for a texture, a stream of input events and an accessibility bridge, then draws every single pixel itself. That is the whole architectural bet, and everything else in this camp follows from it. React Native's `View` becomes a real `android.view.View`; Flutter's `Container` becomes drawing commands.\n\nWhat that buys: pixel-identical output on both platforms, a UI toolkit that ships with your app rather than with the OS (so an old Android device gets the same Material 3 you tested on), a frame loop with no bridge in the hot path, and the freedom to add widgets without waiting for a platform release. What it costs: your app does not inherit new platform look-and-feel for free, text selection and IME behaviour have to be reimplemented rather than inherited, embedding a real native view (a map, a webview) means compositing an OS-drawn view into Flutter's scene and is measurably expensive, and the binary carries an engine.\n\nThe stack is three layers. The **framework** is Dart — widgets, rendering, painting, animation. The **engine** is C++ and owns the rasterizer, text layout and the Dart runtime. The **embedder** is platform-specific glue that supplies the surface and the event loop. `RenderObject` lives in the framework; the code that turns its paint commands into pixels lives in the engine.\n\nThe gotcha that dates most older material: **Impeller replaced Skia as the default rasterizer.** Skia compiled shaders lazily at runtime, so the first time an app ran a new effect it stuttered — the notorious first-run jank that spawned an entire genre of shader warm-up workarounds. Impeller compiles a small fixed shader set at engine-build time and builds its pipeline state objects up front, which is why that workflow has quietly disappeared from the docs. Any tutorial telling you to cache SkSL is describing a problem you no longer have.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Flutter: Architectural overview", url: "https://docs.flutter.dev/resources/architectural-overview", kind: "docs" },
        { label: "Flutter: Impeller rendering engine", url: "https://docs.flutter.dev/perf/impeller", kind: "docs" },
        { label: "Flutter: Inside Flutter", url: "https://docs.flutter.dev/resources/inside-flutter", kind: "article" },
      ],
      video: {
        title: "How Flutter Works: Architecture #DecodingFlutter (1/6)",
        channel: "Flutter",
        url: "https://www.youtube.com/watch?v=0Xn1QhNtPkQ",
        videoId: "0Xn1QhNtPkQ",
        durationLabel: "6:19",
      },
      alternateVideos: [
        {
          title: "How Flutter Works: The Flutter Engine and Embedders #DecodingFlutter (6/6)",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=Y2aBMjWVv2Y",
          videoId: "Y2aBMjWVv2Y",
          durationLabel: "7:34",
        },
        {
          title: "Introducing Impeller - Flutter's new rendering engine",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=vd5NqS01rlA",
          videoId: "vd5NqS01rlA",
          durationLabel: "14:49",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-rendering-model-q1",
          prompt: "A `Switch` widget is rendered by a Flutter app on Android. What object exists in the Android view hierarchy for it?",
          options: [
            "None — the whole Flutter app occupies a single view, and the switch is drawn into it",
            "An `android.widget.Switch`, themed by Flutter",
            "A `SwitchCompat` created by the engine's view factory",
            "A lightweight `android.view.View` per Flutter widget, created lazily",
          ],
          correctIndex: 0,
          explanation:
            "Flutter renders into one surface supplied by the embedder and paints every control itself. That is the opposite of React Native, where each `View` really does become a platform view.",
        },
        {
          id: "flutter-rendering-model-q2",
          prompt: "Which of these statements about Impeller are true as of Flutter 3.47? (Select all that apply.)",
          options: [
            "On iOS it is the only supported renderer, with no way to switch back to Skia",
            "On Android it is enabled by default on API 29+ and falls back to a legacy OpenGL renderer on older or non-Vulkan devices",
            "On macOS, Linux and Windows it became the default in 3.47",
            "Flutter web rasterizes with Impeller",
            "Impeller compiles shaders at runtime the first time each effect appears",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Web still rasterizes with Skia compiled to WebAssembly; Impeller on the web is a future item. And the whole point of Impeller is that it does *not* compile shaders at runtime — it precompiles a small fixed set at engine-build time.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-rendering-model-q3",
          prompt: "A user reports that the very first time they open the share sheet in your Flutter app the animation stutters, but it is smooth every time afterwards. On an older Skia-based Flutter release, what was the usual cause?",
          options: [
            "Shaders for that effect were being compiled on the fly during the first frame that needed them",
            "The Dart code for that screen was being JIT-compiled on first use",
            "The image assets were being decoded synchronously on the raster thread",
            "The platform channel for the share intent blocked the UI thread",
          ],
          correctIndex: 0,
          explanation:
            "Skia generated and compiled shader programs lazily, so a never-before-seen effect paid compilation cost inside a frame budget. Dart is AOT-compiled in release builds, so JIT is not the culprit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-rendering-model-q4",
          prompt: "A new Android release ships a redesigned system switch style. A Flutter app built a year earlier is installed on that device. What happens to its `Switch` widgets?",
          options: [
            "Nothing — they keep rendering exactly as the bundled Flutter version draws them",
            "They pick up the new system style automatically, because Material is a system component",
            "They render with the new style only if the app targets the new SDK level",
            "The engine downloads updated widget definitions at first launch",
          ],
          correctIndex: 0,
          explanation:
            "The UI toolkit ships inside your app, so its look is frozen at the Flutter version you compiled with. That is the flip side of the consistency guarantee: identical rendering everywhere, and also staleness unless you upgrade and re-ship.",
        },
        {
          id: "flutter-rendering-model-q5",
          prompt: "Which layer of the Flutter stack does `RenderObject` belong to?",
          options: [
            "The framework, written in Dart",
            "The engine, written in C++",
            "The embedder, written per platform",
            "It is generated at build time and belongs to none of them",
          ],
          correctIndex: 0,
          explanation:
            "Layout and paint instructions are computed in Dart in the framework layer; the engine consumes the resulting scene and rasterizes it. The embedder only supplies the surface, event loop and platform services.",
        },
        {
          id: "flutter-rendering-model-q6",
          prompt: "If Flutter never creates platform views for its widgets, how can TalkBack or VoiceOver read a Flutter app?",
          options: [
            "The framework builds a semantics tree from the render tree and hands it to the platform accessibility APIs",
            "It can't — Flutter apps are opaque to screen readers and need a native shell",
            "The engine creates a hidden native view per focusable widget at runtime",
            "Screen readers run OCR over the rendered surface",
          ],
          correctIndex: 0,
          explanation:
            "Semantics is a parallel tree derived from the render tree and exposed through each platform's accessibility bridge. It does mean `Semantics` annotations are your responsibility in a way they are not when you use real platform controls.",
        },
        {
          id: "flutter-rendering-model-q7",
          prompt: "You need to embed a native maps SDK view inside a Flutter screen. What is the performance concern?",
          options: [
            "The native view has to be composited into Flutter's scene, forcing extra layers and synchronisation between the platform and raster threads",
            "The native view forces the whole app onto the legacy OpenGL renderer",
            "Flutter must re-rasterize the entire screen on every native view frame",
            "There is none — platform views are drawn by the engine like any other widget",
          ],
          correctIndex: 0,
          explanation:
            "Platform views break the one-surface model, so the engine has to interleave OS-drawn content with its own. It works, and it is measurably more expensive than anything Flutter draws itself.",
        },
        {
          id: "flutter-rendering-model-q8",
          prompt: "Hot reload works in debug builds but not in release builds. Why?",
          options: [
            "Debug builds run Dart in the VM with JIT compilation, which can swap in recompiled classes; release builds are AOT-compiled to native machine code",
            "Release builds strip the widget tree metadata hot reload needs",
            "Hot reload requires Impeller, which is disabled in release",
            "Release builds run Dart in a separate isolate that cannot be restarted",
          ],
          correctIndex: 0,
          explanation:
            "The JIT lets the VM accept recompiled classes and rerun `build`. AOT output is fixed machine code — which is also why profiling has to be done in profile mode, not debug.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-rendering-model-q9",
          prompt: "Which of these are genuine consequences of Flutter owning its rendering pipeline rather than wrapping platform controls? (Select all that apply.)",
          options: [
            "Identical pixel output across iOS and Android for the same widget tree",
            "A larger minimum app binary, because the engine ships with the app",
            "Text input, selection handles and IME behaviour have to be implemented by Flutter rather than inherited",
            "Dart code can call any Android or iOS SDK API directly without a channel",
            "Flutter apps cannot use the device camera",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Owning the pipeline says nothing about calling native APIs — that still needs a platform channel or a generated binding — and plugins give full access to hardware like the camera.",
        },
        {
          id: "flutter-rendering-model-q10",
          prompt: "Coming from React, which analogy for Flutter's engine is the most accurate?",
          options: [
            "Closer to a game engine's renderer than to React DOM: it owns the frame loop and draws primitives rather than mutating a host tree",
            "Flutter's equivalent of React DOM, translating a virtual tree into platform nodes",
            "The scheduler, deciding which components re-render",
            "The bundler, compiling Dart into platform packages",
          ],
          correctIndex: 0,
          explanation:
            "React DOM's job is to mutate a host tree that someone else paints. Flutter's engine has no host tree to mutate — it paints. The part of Flutter that behaves like React's reconciler is the element tree.",
        },
      ],
    },
    {
      id: "flutter-widgets-and-setstate",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Everything Is a Widget: Stateless, Stateful and setState",
      summary:
        "A widget in Flutter is not a component instance. It is an immutable description of a piece of UI — closer to the object React's `createElement` returns than to a React component. Widgets are allocated in huge numbers and thrown away every frame, and every field on one is `final`. Padding is a widget. Centring is a widget. Opacity, gesture detection and theming are widgets. There is no separate styling language, which is why Flutter trees nest so deeply.\n\n`StatelessWidget` has exactly one job: a `build` method that maps configuration to more widgets. `StatefulWidget` splits into two objects for a specific reason — the widget itself is still immutable and still discarded every rebuild, while a separate `State` object is *retained* across rebuilds by the element tree. That split is why `State` is where every mutable field, controller, subscription and animation controller belongs, and why reading a value off `widget.something` inside `State` always gives you the latest configuration rather than a stale one.\n\n`setState` does very little. It runs your callback synchronously and then marks this element dirty so the framework rebuilds it on the next frame. It does not diff, it does not batch across frames, and its callback must not be `async` — returning a `Future` from it is an explicit error, because the framework has no way to know when your state actually finished changing. Mutating a field without `setState` leaves the value changed and the screen stale until something else triggers a rebuild, which is the single most confusing bug for newcomers.\n\nThe lifecycle traps worth memorising: `initState` runs before the element has resolved its inherited dependencies, so an `of(context)` call that registers a dependency belongs in `didChangeDependencies`, not `initState`. `didUpdateWidget` fires when the parent rebuilds with a new widget of the same type, and it is where you react to changed configuration. And `setState` after `dispose` throws — the fix is to cancel the timer or subscription in `dispose`, not to sprinkle `if (mounted)` everywhere.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Flutter API: StatefulWidget", url: "https://api.flutter.dev/flutter/widgets/StatefulWidget-class.html", kind: "docs" },
        { label: "Flutter API: State.setState", url: "https://api.flutter.dev/flutter/widgets/State/setState.html", kind: "docs" },
        { label: "Flutter API: State.didChangeDependencies", url: "https://api.flutter.dev/flutter/widgets/State/didChangeDependencies.html", kind: "docs" },
        { label: "Flutter: Adding interactivity", url: "https://docs.flutter.dev/ui/interactivity", kind: "article" },
      ],
      video: {
        title: "How Flutter Works: The State class #DecodingFlutter (3/6)",
        channel: "Flutter",
        url: "https://www.youtube.com/watch?v=FP737UMx7ss",
        videoId: "FP737UMx7ss",
        durationLabel: "7:40",
      },
      alternateVideos: [
        {
          title: "Stateful widgets in Flutter",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=Gzz8FwSlsUg",
          videoId: "Gzz8FwSlsUg",
          durationLabel: "3:34",
        },
        {
          title: "How Stateful Widgets Are Used Best - Flutter Widgets 101 Ep. 2",
          channel: "Google for Developers",
          url: "https://www.youtube.com/watch?v=AqCMFXEmf3w",
          videoId: "AqCMFXEmf3w",
          durationLabel: "7:09",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-widgets-and-setstate-q1",
          prompt: "Why is a `StatefulWidget` split into two classes instead of holding its own mutable fields?",
          options: [
            "The widget is immutable and discarded on every rebuild; the `State` object is retained across rebuilds so mutable data survives",
            "The `State` class exists purely to satisfy Dart's rule against mutable fields in constructors",
            "Splitting lets the framework run `build` on a background isolate",
            "The widget holds UI state and the `State` holds business state",
          ],
          correctIndex: 0,
          explanation:
            "Widgets are throwaway configuration. `State` is the long-lived object the element keeps, which is why controllers and subscriptions live there.",
        },
        {
          id: "flutter-widgets-and-setstate-q2",
          prompt: "What does this print when the button is tapped twice?\n\n```dart\nint count = 0;\n\n@override\nWidget build(BuildContext context) {\n  print('build $count');\n  return TextButton(\n    onPressed: () { count++; },\n    child: Text('$count'),\n  );\n}\n```",
          options: [
            "Nothing after the initial `build 0` — the field changes but no rebuild is scheduled",
            "`build 1` then `build 2`",
            "`build 0` then `build 0` — the rebuild happens but reads a stale value",
            "It throws, because `count` was mutated outside `setState`",
          ],
          correctIndex: 0,
          explanation:
            "`count` really does become 2; nothing told the framework to rebuild, so the screen still shows 0. Flutter does not observe your fields — `setState` is the notification, not the mutation.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-widgets-and-setstate-q3",
          prompt: "What happens with this code?\n\n```dart\nsetState(() async {\n  final user = await api.fetchUser();\n  this.user = user;\n});\n```",
          options: [
            "It throws: the `setState` callback must not return a `Future`",
            "It works, and the widget rebuilds once the future completes",
            "It works, but the rebuild happens before `user` is assigned",
            "It compiles but silently does nothing",
          ],
          correctIndex: 0,
          explanation:
            "The framework asserts that the callback returned nothing, because it rebuilds immediately after the callback and cannot wait on a future. Do the `await` first, then call `setState` with the synchronous assignment.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-widgets-and-setstate-q4",
          prompt: "Which of these belong in `State.dispose()`? (Select all that apply.)",
          options: [
            "`_animationController.dispose()`",
            "`_textController.dispose()`",
            "`_streamSubscription.cancel()`",
            "`setState(() => _isVisible = false)`",
            "The final `super.initState()` call",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything holding an OS resource, a listener or a ticker must be released. Calling `setState` in `dispose` is an error — the element is being removed and there is no rebuild to schedule.",
        },
        {
          id: "flutter-widgets-and-setstate-q5",
          prompt: "A `State` subclass needs the current theme to build a cached `TextStyle` once. Where should `Theme.of(context)` be read?",
          options: [
            "`didChangeDependencies`, which runs after `initState` and again whenever an inherited dependency changes",
            "`initState`, so it runs exactly once",
            "The constructor of the `State` class",
            "`dispose`, and cached in a static field",
          ],
          correctIndex: 0,
          explanation:
            "`Theme.of` registers an inherited dependency, and the framework asserts if you do that before `initState` has completed. `didChangeDependencies` is the hook that exists precisely for this and re-runs when the theme changes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-widgets-and-setstate-q6",
          prompt: "A parent rebuilds and produces a new `ProfileCard(userId: 7)` where it previously produced `ProfileCard(userId: 3)`. Neither has a key. What happens to the existing `_ProfileCardState`?",
          options: [
            "It is kept, `widget` is swapped to the new instance, and `didUpdateWidget` is called with the old one",
            "It is disposed and a fresh `State` is created with `initState`",
            "It is kept and nothing is called — you must compare `widget.userId` inside `build`",
            "It is kept only if `ProfileCard` overrides `operator ==`",
          ],
          correctIndex: 0,
          explanation:
            "Same runtime type and same (null) key means the element is reused, so `State` survives. `didUpdateWidget(oldWidget)` is where you'd cancel the request for user 3 and start one for user 7.",
        },
        {
          id: "flutter-widgets-and-setstate-q7",
          prompt: "Coming from React, which mapping is correct?",
          options: [
            "A Flutter widget is closest to a React *element* (the return value of `createElement`), and `State` is closest to the hook state a fibre holds",
            "A Flutter widget is closest to a React component class, and `State` is its `this.state`",
            "A Flutter widget is closest to a DOM node, and `State` is an attached data attribute",
            "A Flutter widget is closest to a React ref, and `State` is the ref's current value",
          ],
          correctIndex: 0,
          explanation:
            "Both a React element and a Flutter widget are cheap immutable descriptions created fresh on every render. The persistent object in React is the fibre; in Flutter it is the `Element`, and `State` hangs off it.",
        },
        {
          id: "flutter-widgets-and-setstate-q8",
          prompt: "A `Timer.periodic` started in `initState` calls `setState` every second. The user navigates away and the widget is disposed. What is the documented fix?",
          options: [
            "Cancel the timer in `dispose()`",
            "Guard every `setState` with `if (mounted)`",
            "Wrap the `setState` call in a try/catch",
            "Move the timer into the `build` method so it is recreated each frame",
          ],
          correctIndex: 0,
          explanation:
            "`setState` after `dispose` throws. The `mounted` guard hides the symptom while the timer keeps burning CPU; the docs are explicit that cancelling the subscription is the right answer.",
        },
        {
          id: "flutter-widgets-and-setstate-q9",
          prompt: "You need a reusable chunk of UI with no state of its own. What does the performance guidance say about writing it as a private method returning a `Widget` versus a `StatelessWidget`?",
          options: [
            "Prefer a `StatelessWidget`, because it gets its own element and can be skipped by the rebuild machinery, and can be `const`",
            "Prefer the method, because it avoids allocating an extra widget object",
            "They are exactly equivalent once compiled",
            "Prefer the method, because `StatelessWidget` forces a `RenderObject` to be created",
          ],
          correctIndex: 0,
          explanation:
            "A helper method's output is inlined into the caller's build, so it rebuilds whenever the caller does. A separate `StatelessWidget` gets its own element and, if `const`, is skipped entirely. A `StatelessWidget` does not create a `RenderObject`.",
        },
        {
          id: "flutter-widgets-and-setstate-q10",
          prompt: "In what order do these run when a `StatefulWidget` is first inserted into the tree and then its parent rebuilds it once?",
          options: [
            "`createState`, `initState`, `didChangeDependencies`, `build`, `didUpdateWidget`, `build`",
            "`createState`, `build`, `initState`, `didChangeDependencies`, `didUpdateWidget`, `build`",
            "`initState`, `createState`, `build`, `build`, `didUpdateWidget`",
            "`createState`, `initState`, `build`, `didChangeDependencies`, `build`",
          ],
          correctIndex: 0,
          explanation:
            "`didChangeDependencies` always runs after `initState` and before the first `build`. On a parent rebuild the framework calls `didUpdateWidget` first, then `build`.",
        },
      ],
    },
    {
      id: "flutter-three-trees",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Widget, Element and RenderObject: Why a Rebuild Is Cheap",
      summary:
        "This is the idea that makes Flutter make sense. There are three parallel trees, not one. The **widget tree** is immutable configuration, rebuilt wholesale and thrown away — allocating widgets is deliberately cheap. The **element tree** is the long-lived skeleton: one `Element` per widget position, holding the parent/child links, the `State` object and the inherited-widget lookup table. The **render tree** holds `RenderObject`s, which do layout and painting, are expensive, and are mutated in place rather than recreated.\n\nIf you know React, the element tree is the fibre tree and a widget is a React element. Calling `build` is `render()`; it produces a new description and nothing has been painted yet. The reconciliation rule is one line of real framework source:\n\n```dart\nstatic bool canUpdate(Widget oldWidget, Widget newWidget) {\n  return oldWidget.runtimeType == newWidget.runtimeType && oldWidget.key == newWidget.key;\n}\n```\n\nSame runtime type and same key at the same position means the existing element is *updated* — its `State` and its `RenderObject` survive, and only changed fields propagate down. Different type or different key means the element is unmounted, `State.dispose` runs, and a fresh subtree is built. Everything you will ever need to know about keys falls out of that single comparison.\n\nThe second half of \"rebuilds are cheap\" is `const`. Dart canonicalises constant instances, so `const Text('Save')` evaluated in two different `build` calls produces the *identical object*. `Element.updateChild` checks exactly that and short-circuits: if the new widget is the same instance as the current one, the child is not rebuilt at all. That makes `const` the compile-time equivalent of `React.memo`, with no comparison function and no runtime cost — which is why the performance guidance is simply \"use `const` constructors as much as possible\".\n\nThe gotcha that catches experienced people: do **not** reach for `operator ==` on widgets to get memoisation. The docs call this out specifically — it degrades reconciliation to O(N²) because the framework compares children pairwise. Reach for `const`, split the widget so `setState` sits lower in the tree, and pass an unchanging subtree in through a `child` parameter instead.",
      level: "expert",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Flutter API: Element", url: "https://api.flutter.dev/flutter/widgets/Element-class.html", kind: "docs" },
        { label: "Flutter API: Widget.canUpdate", url: "https://api.flutter.dev/flutter/widgets/Widget/canUpdate.html", kind: "docs" },
        { label: "Flutter API: Element.updateChild", url: "https://api.flutter.dev/flutter/widgets/Element/updateChild.html", kind: "docs" },
        { label: "Flutter: Performance best practices", url: "https://docs.flutter.dev/perf/best-practices", kind: "article" },
      ],
      video: {
        title: "How Flutter Works: The Three Trees #DecodingFlutter (2/6)",
        channel: "Flutter",
        url: "https://www.youtube.com/watch?v=xiW3ahr4CRU",
        videoId: "xiW3ahr4CRU",
        durationLabel: "7:40",
      },
      alternateVideos: [
        {
          title: "How Flutter Works: The RenderObjectWidget #DecodingFlutter (4/6)",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=zcJlHVVM84I",
          videoId: "zcJlHVVM84I",
          durationLabel: "4:19",
        },
        {
          title: "How Flutter Works: The RenderObject #DecodingFlutter (5/6)",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=EuG12bebwac",
          videoId: "EuG12bebwac",
          durationLabel: "9:47",
        },
        {
          title: "Flutter's Three Trees: Widget, Element, Render",
          channel: "Deven Joshi",
          url: "https://www.youtube.com/watch?v=aoxUOBJrqIw",
          videoId: "aoxUOBJrqIw",
          durationLabel: "4:31",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-three-trees-q1",
          prompt: "Which of the three trees persists across rebuilds and holds the `State` object?",
          options: ["The element tree", "The widget tree", "The render tree", "The semantics tree"],
          correctIndex: 0,
          explanation:
            "Widgets are recreated every build and render objects exist only for widgets that actually paint. The element is the stable node in between, and `State` hangs off `StatefulElement`.",
        },
        {
          id: "flutter-three-trees-q2",
          prompt: "Exactly what does `Widget.canUpdate(old, new)` compare?",
          options: [
            "`runtimeType` and `key`",
            "`runtimeType`, `key` and all `final` fields",
            "`hashCode` and `key`",
            "Whether `old == new` using the widget's `operator ==`",
          ],
          correctIndex: 0,
          explanation:
            "The whole reconciliation decision is `oldWidget.runtimeType == newWidget.runtimeType && oldWidget.key == newWidget.key`. Field values never enter into it — they are what gets pushed down after the element is reused.",
        },
        {
          id: "flutter-three-trees-q3",
          prompt: "A `build` method previously returned `Padding(child: MyCounter())` and now returns `Container(child: MyCounter())`. What happens to `MyCounter`'s state?",
          options: [
            "It is destroyed: the type changed at that position, so the whole subtree below it is unmounted and rebuilt",
            "It survives, because `MyCounter` itself is unchanged",
            "It survives only if `MyCounter` has a key",
            "It survives, but `didUpdateWidget` is called with a null old widget",
          ],
          correctIndex: 0,
          explanation:
            "`canUpdate` fails at the `Padding`/`Container` position, so that element and everything beneath it — including `MyCounter`'s element and its `State` — is torn down. Reparenting a subtree under a different wrapper silently resets it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-three-trees-q4",
          prompt: "What does this do on every rebuild of the parent?\n\n```dart\n@override\nWidget build(BuildContext context) {\n  return Column(children: [\n    const ExpensiveHeader(),\n    Text('count: $count'),\n  ]);\n}\n```",
          options: [
            "`ExpensiveHeader`'s element is left untouched — `updateChild` sees the identical canonicalised instance and returns early",
            "`ExpensiveHeader` rebuilds, but its render object is reused",
            "`ExpensiveHeader` rebuilds fully; `const` only affects compile-time allocation",
            "`ExpensiveHeader` is rebuilt unless it also overrides `operator ==`",
          ],
          correctIndex: 0,
          explanation:
            "Dart canonicalises `const` instances, so both builds produce the same object. `Element.updateChild` checks `child.widget == newWidget` and skips the update entirely — no `build` call, no diff.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-three-trees-q5",
          prompt: "Which of these widgets create a `RenderObject`? (Select all that apply.)",
          options: [
            "`Padding`",
            "`Opacity`",
            "`RichText`",
            "A `StatelessWidget` you wrote that returns a `Column`",
            "`Builder`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Only `RenderObjectWidget` subclasses produce render objects. `StatelessWidget`, `StatefulWidget` and `Builder` are composition-only: they get an element but contribute nothing to the render tree, which is why the render tree is much shallower than the widget tree.",
        },
        {
          id: "flutter-three-trees-q6",
          prompt: "A colleague overrides `operator ==` and `hashCode` on a widget so Flutter can \"skip rebuilding when props are equal\". What does the official performance guidance say?",
          options: [
            "Avoid it — it results in O(N²) behaviour across the tree and hurts performance",
            "Do it for any widget with more than three fields",
            "Do it, but only on `StatefulWidget`s",
            "It has no effect, because `canUpdate` uses identity comparison",
          ],
          correctIndex: 0,
          explanation:
            "The docs explicitly warn against it: element updates end up comparing children pairwise, which is quadratic. `const` gives you the same short-circuit for free, via identity.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-three-trees-q7",
          prompt: "What is a `BuildContext`, concretely?",
          options: [
            "The `Element` for that widget, exposed through a narrower interface",
            "A snapshot of the widget's props taken before `build` runs",
            "A handle to the render object that will paint the widget",
            "A per-frame object recreated on every build",
          ],
          correctIndex: 0,
          explanation:
            "`Element` implements `BuildContext`. That is why a context knows its position in the tree, can walk ancestors and outlives any individual widget — and why using the wrong one is such a common bug.",
        },
        {
          id: "flutter-three-trees-q8",
          prompt: "Adding `const` to a widget constructor gives no measurable benefit in one particular case. Which?",
          options: [
            "When the widget's arguments include a value only known at runtime, so the expression cannot be `const` at the call site",
            "When the widget is a `StatelessWidget` rather than a `StatefulWidget`",
            "When the widget has no children",
            "When the app runs in profile mode",
          ],
          correctIndex: 0,
          explanation:
            "A `const` *constructor* only helps where it is actually invoked as `const`. `const MyCard(title: someVariable)` will not compile, so the call site allocates a fresh instance each build and the identity short-circuit never fires.",
        },
        {
          id: "flutter-three-trees-q9",
          prompt: "Which of these genuinely reduce the work a `setState` causes? (Select all that apply.)",
          options: [
            "Moving `setState` into a smaller widget lower in the tree",
            "Marking unchanging subtrees `const`",
            "Passing a stable subtree in through a `child` parameter that the builder just re-inserts",
            "Overriding `operator ==` on the rebuilt widget",
            "Wrapping the whole screen in a `RepaintBoundary`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three all shrink the dirty subtree or short-circuit it by identity. `operator ==` is counter-productive, and a `RepaintBoundary` affects painting, not the build phase that `setState` triggers.",
        },
        {
          id: "flutter-three-trees-q10",
          prompt: "During layout, which tree does Flutter actually walk?",
          options: [
            "The render tree — layout and paint are `RenderObject` operations and never touch widgets",
            "The widget tree, which is why deep widget trees are slow to lay out",
            "The element tree, calling `build` on each node in order",
            "All three in sequence, once per frame",
          ],
          correctIndex: 0,
          explanation:
            "Build produces widgets, elements reconcile them and configure render objects, and then layout and paint operate purely on the (much smaller) render tree. This is why a hundred-deep widget tree of `Padding` and `Center` is far cheaper than it looks.",
        },
      ],
    },
    {
      id: "flutter-build-context",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "BuildContext, of(context) and InheritedWidget",
      summary:
        "`BuildContext` is the `Element`. It is not React's context object — it is a *pointer into the tree*, and the thing it is most useful for is asking \"what is above me here?\". `Theme.of(context)`, `MediaQuery.of(context)`, `Navigator.of(context)` and `Scaffold.of(context)` are all the same move: walk up from this position and find the nearest provider of some type.\n\nThe mechanism underneath is `InheritedWidget`, and it is the one piece of dependency injection Flutter ships. An inherited widget sits in the tree, and `dependOnInheritedWidgetOfExactType<T>()` does two things at once: it returns the nearest `T` above you, and it *registers this element as a dependent*. When the inherited widget is replaced and its `updateShouldNotify(old)` returns true, every registered dependent is marked dirty. That is Flutter's entire reactive-read primitive, and Provider, and by extension most of the ecosystem, is built directly on it.\n\nThe lookup is not a tree walk. Each element inherits a persistent hash map of type to `InheritedElement` from its parent, so `of(context)` is effectively a hash lookup, not O(depth). That is worth knowing because the common performance advice to \"avoid calling `Theme.of` too often\" is aimed at the *dependency* it creates, not the cost of finding it.\n\nTwo gotchas. First, the context you use decides where the walk starts, so calling `Scaffold.of(context)` in the same `build` method that *creates* the `Scaffold` fails — that context is above the scaffold. Wrap the caller in a `Builder`, or pull it out into its own widget. Second, a `BuildContext` captured before an `await` may belong to an element that has since been unmounted; the `use_build_context_synchronously` lint exists for exactly this, and `if (context.mounted)` is the guard. And because `MediaQuery.of(context)` depends on *every* field of `MediaQueryData`, a widget that only cares about width will rebuild when the keyboard opens — use `MediaQuery.sizeOf(context)`, which scopes the dependency to one aspect.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Flutter API: BuildContext", url: "https://api.flutter.dev/flutter/widgets/BuildContext-class.html", kind: "docs" },
        { label: "Flutter API: InheritedWidget", url: "https://api.flutter.dev/flutter/widgets/InheritedWidget-class.html", kind: "docs" },
        { label: "Flutter API: dependOnInheritedWidgetOfExactType", url: "https://api.flutter.dev/flutter/widgets/BuildContext/dependOnInheritedWidgetOfExactType.html", kind: "docs" },
        { label: "Dart: use_build_context_synchronously", url: "https://dart.dev/tools/linter-rules/use_build_context_synchronously", kind: "article" },
      ],
      video: {
        title: "InheritedWidgets | Decoding Flutter",
        channel: "Flutter",
        url: "https://www.youtube.com/watch?v=og-vJqLzg2c",
        videoId: "og-vJqLzg2c",
        durationLabel: "8:39",
      },
      alternateVideos: [
        {
          title: "BuildContext?! | Decoding Flutter",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=rIaaH87z1-g",
          videoId: "rIaaH87z1-g",
          durationLabel: "2:40",
        },
        {
          title: "Synchronous BuildContexts | Decoding Flutter",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=bzWaMpD1LHY",
          videoId: "bzWaMpD1LHY",
          durationLabel: "6:15",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-build-context-q1",
          prompt: "What happens when the button is tapped?\n\n```dart\n@override\nWidget build(BuildContext context) {\n  return Scaffold(\n    body: TextButton(\n      onPressed: () => ScaffoldMessenger.of(context).showSnackBar(\n        const SnackBar(content: Text('hi')),\n      ),\n      child: const Text('show'),\n    ),\n  );\n}\n```",
          options: [
            "The snack bar shows — `ScaffoldMessenger` is installed by `MaterialApp`, above this context",
            "It throws, because `context` is above the `Scaffold` this build creates",
            "It throws, because `of` cannot be called from a callback",
            "It throws only in release mode",
          ],
          correctIndex: 0,
          explanation:
            "This is the exception to the classic trap: `ScaffoldMessenger` is installed by `MaterialApp`, well above this widget, so the lookup succeeds. The same code with `Scaffold.of(context)` would fail, because that scaffold is below this context.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-build-context-q2",
          prompt: "`dependOnInheritedWidgetOfExactType<T>()` does two things. What are they?",
          options: [
            "Returns the nearest `T` ancestor, and registers this element to be rebuilt when that `T` changes",
            "Returns the nearest `T` ancestor, and caches it on the element permanently",
            "Creates a `T` if none exists, and returns it",
            "Returns all `T` ancestors, and subscribes to the closest one",
          ],
          correctIndex: 0,
          explanation:
            "The subscription is the important half and the one people forget. `getInheritedWidgetOfExactType` is the read-only variant that does not create a dependency.",
        },
        {
          id: "flutter-build-context-q3",
          prompt: "An `InheritedWidget` holds a `List<Todo>`. Its `updateShouldNotify(old)` is written as `return true;`. What is the consequence?",
          options: [
            "Every dependent rebuilds whenever any ancestor rebuilds this inherited widget, even when the list is identical",
            "Nothing — the framework compares the fields itself before notifying",
            "Dependents never rebuild, because `true` means \"already up to date\"",
            "It throws when the list contents are unchanged",
          ],
          correctIndex: 0,
          explanation:
            "`updateShouldNotify` is the only filter between an inherited widget being rebuilt and its dependents being marked dirty. Returning a constant `true` makes it a no-op, which is a very common cause of \"why is my whole screen rebuilding\".",
        },
        {
          id: "flutter-build-context-q4",
          prompt: "Why is `MediaQuery.sizeOf(context)` preferred over `MediaQuery.of(context).size`?",
          options: [
            "`sizeOf` depends only on the size aspect, so the widget does not rebuild when unrelated `MediaQueryData` fields such as view insets change",
            "`sizeOf` is a static read with no dependency at all, so it never rebuilds",
            "`sizeOf` returns physical pixels rather than logical pixels",
            "`of` is deprecated and will be removed",
          ],
          correctIndex: 0,
          explanation:
            "`of` creates a dependency on the whole `MediaQueryData`, so opening the keyboard (which changes `viewInsets`) rebuilds every widget that read it. Aspect-scoped accessors like `sizeOf`, `paddingOf` and `platformBrightnessOf` narrow that.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-build-context-q5",
          prompt: "What is the cost of `Theme.of(context)` in terms of tree depth?",
          options: [
            "Roughly constant — each element inherits a map of type to inherited element from its parent, so the lookup is a hash lookup",
            "O(depth) — it walks up parent by parent until it finds a `Theme`",
            "O(n) over the whole tree, which is why it should be hoisted out of `build`",
            "It depends on how many `Theme` widgets exist in the tree",
          ],
          correctIndex: 0,
          explanation:
            "The walk happens once, when the map is built; lookups after that are hash lookups. The real cost of `of(context)` is the rebuild dependency it registers, not the search.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-build-context-q6",
          prompt: "Which of these are safe things to do with a `BuildContext`? (Select all that apply.)",
          options: [
            "Pass it to `Theme.of` inside `build`",
            "Pass it to `Navigator.of` inside an `onPressed` callback",
            "Use it after an `await`, guarded by `if (context.mounted)`",
            "Store it in a global variable at app start and reuse it from anywhere",
            "Call `dependOnInheritedWidgetOfExactType` on it inside `dispose`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A stashed global context goes stale the moment its element is unmounted, and registering a dependency during `dispose` is an error — the element is being removed. The `mounted` check is exactly what the `use_build_context_synchronously` lint asks for.",
        },
        {
          id: "flutter-build-context-q7",
          prompt: "A dialog is shown after an async save. The widget is popped while the save is in flight. What does the lint want you to write?\n\n```dart\nawait repository.save(draft);\n// line X\n```",
          options: [
            "`if (!context.mounted) return;` before using `context`",
            "`if (mounted) await Future.delayed(Duration.zero);`",
            "Wrap the context use in a `try`/`catch`",
            "Capture `Navigator.of(context)` after the await instead of before",
          ],
          correctIndex: 0,
          explanation:
            "`context.mounted` asks the element whether it is still in the tree. Capturing the navigator *before* the await is the other accepted pattern; capturing it after is exactly the bug.",
        },
        {
          id: "flutter-build-context-q8",
          prompt: "Coming from React, where does the `BuildContext` analogy break down?",
          options: [
            "React's context is a value you subscribe to; `BuildContext` is a position in the tree that you use to *find* values",
            "React's context is per-component; `BuildContext` is global",
            "There is no difference — `InheritedWidget` is React context and `BuildContext` is the value",
            "React's context is synchronous; `BuildContext` lookups are asynchronous",
          ],
          correctIndex: 0,
          explanation:
            "`InheritedWidget` is the analogue of React's context *provider*, and `of(context)` is `useContext`. `BuildContext` itself has no React equivalent — it is closer to a handle on the fibre you are currently rendering.",
        },
        {
          id: "flutter-build-context-q9",
          prompt: "You want a widget to rebuild only when one field of a large inherited model changes. Which tool is designed for that?",
          options: [
            "`InheritedModel`, whose dependents declare which aspects they depend on",
            "`InheritedWidget` with `updateShouldNotify` returning false",
            "`InheritedNotifier` with a `ValueKey`",
            "Wrapping the dependent in a `RepaintBoundary`",
          ],
          correctIndex: 0,
          explanation:
            "`InheritedModel` extends the dependency system with per-aspect subscriptions — which is exactly what `MediaQuery`'s `sizeOf`-style accessors are built on. `updateShouldNotify: false` would stop all rebuilds, not scope them.",
        },
        {
          id: "flutter-build-context-q10",
          prompt: "In `build`, you call `Theme.of(context)` inside a `ListView.builder` item builder. Which context does that item builder receive?",
          options: [
            "A context for the item's own position in the tree, below the list — so the lookup starts there",
            "The same context as the enclosing `build` method",
            "A detached context with no ancestors, which is why `of` fails inside builders",
            "The root context of the `MaterialApp`",
          ],
          correctIndex: 0,
          explanation:
            "Builder callbacks are handed the context of the element being built, not the enclosing one. That is precisely why wrapping something in a `Builder` fixes the `Scaffold.of` problem: it creates a new element below the scaffold.",
        },
      ],
    },
    {
      id: "flutter-constraints",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Constraints Go Down, Sizes Go Up, Parent Sets Position",
      summary:
        "Flutter's layout is a **single pass**, and that one sentence is the whole algorithm. A parent hands each child a `BoxConstraints` — four doubles: `minWidth`, `maxWidth`, `minHeight`, `maxHeight`. The child picks a size *within* those constraints and reports it upward. The parent then decides where to put it. A child never learns its own position, and it never gets a second chance to resize once its parent has seen its answer.\n\nThe consequences are the part that surprises people coming from CSS. A widget usually **cannot have any size it wants** — `Container(width: 100, height: 100)` as the body of a `Scaffold` fills the whole screen, because the screen handed it *tight* constraints where min equals max and the width argument has nowhere to go. Wrap it in a `Center` and it becomes 100 by 100, because `Center` relaxes the constraints it passes down to loose ones. Widgets like `Center`, `Align`, `ConstrainedBox`, `SizedBox`, `UnconstrainedBox` and `OverflowBox` exist almost entirely to manipulate the constraints flowing through them.\n\nOne-pass layout is why Flutter is fast and why `IntrinsicWidth`/`IntrinsicHeight` carry a warning: asking \"how wide would you like to be?\" requires a speculative extra layout pass, and nesting those turns linear work quadratic. It is also why there is no CSS-style \"percentage of a parent that is sized by its children\" — that would need two passes by definition, and `FractionallySizedBox` or `LayoutBuilder` are the escape hatches.\n\nThe error you will read most often is `A RenderFlex overflowed by 128 pixels on the right`. It always means the same thing: a `Row` or `Column` handed its children unbounded space along the main axis, the children took more than the flex had, and the flex could not shrink to fit its own constraints. The three real fixes are to make a child flexible (`Expanded`/`Flexible`), to let the axis scroll, or to let the content shrink (`Text` with `overflow: TextOverflow.ellipsis`). The fix that is *not* real is adding a fixed height and hoping.\n\nThe complementary error, `BoxConstraints forces an infinite height`, is the mirror image: a widget that wants to be as large as possible was given unbounded space, usually a `ListView` inside a `Column`, or a `Column` inside a `SingleChildScrollView` with an `Expanded` child.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Flutter: Understanding constraints", url: "https://docs.flutter.dev/ui/layout/constraints", kind: "docs" },
        { label: "Flutter API: BoxConstraints", url: "https://api.flutter.dev/flutter/rendering/BoxConstraints-class.html", kind: "docs" },
        { label: "Flutter: Common Flutter errors", url: "https://docs.flutter.dev/testing/common-errors", kind: "article" },
      ],
      video: {
        title: "Flutter layout and constraints",
        channel: "Flutter",
        url: "https://www.youtube.com/watch?v=z8bY3XVAzgI",
        videoId: "z8bY3XVAzgI",
        durationLabel: "4:49",
      },
      alternateVideos: [
        {
          title: "Unbounded height / width | Decoding Flutter",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=jckqXR5CrPI",
          videoId: "jckqXR5CrPI",
          durationLabel: "4:54",
        },
        {
          title: "Flutter's Multi-Child Layout Algorithm",
          channel: "Flutter Community",
          url: "https://www.youtube.com/watch?v=_jlXS8chb7g",
          videoId: "_jlXS8chb7g",
          durationLabel: "53:01",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-constraints-q1",
          prompt: "What size is the red box?\n\n```dart\n// This Container is the body of a Scaffold, filling the screen area.\nContainer(width: 100, height: 100, color: Colors.red)\n```",
          options: [
            "It fills the whole available area — the tight constraints from above leave no room for 100x100",
            "100 x 100, centred",
            "100 x 100, in the top-left corner",
            "Zero — tight constraints and an explicit size conflict, so it collapses",
          ],
          correctIndex: 0,
          explanation:
            "The parent passes tight constraints (min equals max), so the child has exactly one legal size and its `width`/`height` arguments are ignored. This is the first thing the constraints guide teaches and the first thing that trips people up.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-constraints-q2",
          prompt: "What changes if the same container is wrapped in a `Center`?\n\n```dart\nCenter(child: Container(width: 100, height: 100, color: Colors.red))\n```",
          options: [
            "It becomes 100 x 100 and is centred — `Center` passes loose constraints down",
            "Nothing — `Center` only affects position, not size",
            "It fills the screen but the paint is centred",
            "It becomes 100 x 100 but is positioned at the top-left",
          ],
          correctIndex: 0,
          explanation:
            "`Center` makes itself as big as its parent allows, then tells its child it may be anything from zero up to that maximum. Loosening the constraints is what lets the child's own size preference take effect.",
        },
        {
          id: "flutter-constraints-q3",
          prompt: "What width does the container end up with?\n\n```dart\nCenter(\n  child: ConstrainedBox(\n    constraints: const BoxConstraints(minWidth: 70, maxWidth: 150),\n    child: Container(color: Colors.red, width: 10, height: 10),\n  ),\n)\n```",
          options: ["70", "10", "150", "The full parent width"],
          correctIndex: 0,
          explanation:
            "`ConstrainedBox` imposes *additional* constraints on top of what it received. The child asks for 10, the minimum is 70, and a child must obey its constraints — so 70 wins.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-constraints-q4",
          prompt: "Which of these are true about Flutter's single-pass layout? (Select all that apply.)",
          options: [
            "A widget can only choose a size within the constraints its parent gave it",
            "A widget does not know and does not decide its own position on screen",
            "A parent can ask a child its preferred size without laying it out, at extra cost, via the intrinsic protocol",
            "A child can report a size, see where the parent put it, and then resize",
            "A widget can read its own final size during its own `build` method",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "There is no second pass and no feedback loop, which is exactly why layout is linear in the number of render objects. Size is only known after layout, which is why `LayoutBuilder` gives you the *incoming constraints*, never your own size.",
        },
        {
          id: "flutter-constraints-q5",
          prompt: "What does this produce?\n\n```dart\nSingleChildScrollView(\n  child: Column(\n    children: [\n      Expanded(child: Text('hello')),\n    ],\n  ),\n)\n```",
          options: [
            "A layout assertion: `Expanded` needs a bounded main-axis extent, and a scroll view gives the column unbounded height",
            "A scrollable column with the text filling the viewport height",
            "A scrollable column with the text at its natural height",
            "A `RenderFlex overflowed` warning stripe",
          ],
          correctIndex: 0,
          explanation:
            "A scroll view hands its child infinite space along the scroll axis so the child can be as tall as it likes. `Expanded` divides *remaining* space, and there is no finite remainder to divide. Drop the `Expanded`, or give the column a bounded height.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-constraints-q6",
          prompt: "`A RenderFlex overflowed by 128 pixels on the right.` Which of these actually fix it? (Select all that apply.)",
          options: [
            "Wrap the offending child in `Expanded` or `Flexible`",
            "Give the `Text` child `overflow: TextOverflow.ellipsis` inside a flexible parent",
            "Replace the `Row` with a horizontally scrolling list",
            "Wrap the `Row` in a `SizedBox` with a larger width than the screen",
            "Add `mainAxisAlignment: MainAxisAlignment.spaceBetween` to the `Row`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Overflow means the children wanted more main-axis extent than the flex was allowed to occupy. You either let a child shrink, let the content ellipsise, or let the axis scroll. A wider `SizedBox` just moves the overflow up a level, and alignment never changes anyone's size.",
        },
        {
          id: "flutter-constraints-q7",
          prompt: "Why does the documentation warn against `IntrinsicHeight`?",
          options: [
            "It performs a speculative extra layout pass, so nesting them can make layout quadratic",
            "It is only supported on `Column`, not `Row`",
            "It forces a repaint of the whole subtree every frame",
            "It disables the one-pass guarantee for the entire app",
          ],
          correctIndex: 0,
          explanation:
            "Asking children \"how tall would you naturally be?\" is an additional traversal on top of the real layout. It is correct and sometimes necessary; it is just not free, and the cost compounds when nested.",
        },
        {
          id: "flutter-constraints-q8",
          prompt: "What does `LayoutBuilder` give its builder callback?",
          options: [
            "The `BoxConstraints` passed down from the parent, before the child has been sized",
            "The final size of the `LayoutBuilder` itself",
            "The size of the screen",
            "The size of the child after it has been laid out",
          ],
          correctIndex: 0,
          explanation:
            "It exposes the incoming constraints, which is all a single-pass algorithm can offer before the child exists. Knowing your own size during build would require a second pass.",
        },
        {
          id: "flutter-constraints-q9",
          prompt: "What error does this produce?\n\n```dart\nUnconstrainedBox(\n  child: Container(color: Colors.red, width: double.infinity, height: 100),\n)\n```",
          options: [
            "`BoxConstraints forces an infinite width` — Flutter cannot render an infinite size",
            "A `RenderFlex overflowed` stripe along the right edge",
            "Nothing — the container clips to the parent width",
            "`Vertical viewport was given unbounded height`",
          ],
          correctIndex: 0,
          explanation:
            "`UnconstrainedBox` removes the bound, and `double.infinity` then has nothing to clamp against. A child that is merely *too big* for its parent gets an overflow warning; a child that is literally infinite is an error.",
        },
        {
          id: "flutter-constraints-q10",
          prompt: "How does `OverflowBox` differ from `UnconstrainedBox`?",
          options: [
            "Both let the child exceed the parent's constraints, but `OverflowBox` clips silently without the debug overflow warning",
            "`OverflowBox` scrolls the overflowing content; `UnconstrainedBox` clips it",
            "`OverflowBox` works on the cross axis only",
            "They are aliases for the same render object",
          ],
          correctIndex: 0,
          explanation:
            "`UnconstrainedBox` paints the yellow-and-black warning stripes when the child does not fit, which is what makes it useful in development. `OverflowBox` is the deliberate, quiet version.",
        },
      ],
    },
    {
      id: "flutter-layout-widgets",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Row, Column, Stack, Expanded and Flexible",
      summary:
        "`Row` and `Column` are both `Flex` with a fixed axis, and they run a specific three-step algorithm you should be able to recite. First, lay out every **non-flexible** child with unbounded constraints along the main axis and record how much space they took. Second, divide whatever main-axis extent is *left over* among the flexible children in proportion to their `flex` factors. Third, position everything according to `mainAxisAlignment` and `crossAxisAlignment`. The \"remaining space\" detail is the one people get wrong: a `flex: 2` child does not get two-thirds of the row, it gets two-thirds of what the inflexible children did not claim.\n\n`Expanded` and `Flexible` differ by exactly one field. `Expanded` is `Flexible(fit: FlexFit.tight)`: the child is *forced* to fill its share. `Flexible` defaults to `FlexFit.loose`: the child may take up to its share and no more, but may also be smaller. Reach for `Flexible` when you want a child to shrink only if it must, and `Expanded` when you want it to claim its slice regardless. `Spacer` is just `Expanded` wrapping an empty box.\n\n`MainAxisSize` is the other lever. A `Row` defaults to `MainAxisSize.max`, so it occupies all the width it is offered even if its children are tiny — which is why a `Row` inside a `Card` stretches. `MainAxisSize.min` makes it hug its children, but only works if the incoming constraints are not tight.\n\n`Stack` is the overlap primitive. Non-positioned children are laid out with the stack's constraints loosened, and the stack sizes itself to the largest of them; `Positioned` children are laid out against the stack's final size and contribute nothing to it. That asymmetry is the source of the most common `Stack` bug: a stack containing *only* `Positioned` children collapses to the smallest size its parent allows, so the positions land somewhere unexpected. The fix is a non-positioned child (often a `SizedBox.expand`) or `StackFit.expand`.\n\nThe gotcha that costs an afternoon: putting an unwrapped `TextField` or `ListView` directly in a `Row` fails, because a `Row` offers unbounded main-axis width and both of those want to be as wide as possible. `Expanded` is almost always the answer.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Flutter: Layouts in Flutter", url: "https://docs.flutter.dev/ui/layout", kind: "docs" },
        { label: "Flutter API: Flexible", url: "https://api.flutter.dev/flutter/widgets/Flexible-class.html", kind: "docs" },
        { label: "Flutter API: Expanded", url: "https://api.flutter.dev/flutter/widgets/Expanded-class.html", kind: "docs" },
        { label: "Flutter API: Stack", url: "https://api.flutter.dev/flutter/widgets/Stack-class.html", kind: "docs" },
      ],
      video: {
        title: "The Ultimate Flutter Tutorial for Beginners - 2025 Full Course",
        channel: "Flutter Mapp",
        url: "https://www.youtube.com/watch?v=3kaGC_DrUnw",
        videoId: "3kaGC_DrUnw",
        startSeconds: 15460,
        chapterLabel: "Expanded & Flexible",
        durationLabel: "5:16:54",
      },
      alternateVideos: [
        {
          title: "Flutter Layouts Walkthrough: Row, Column, Stack, Expanded, Padding",
          channel: "Andrea Bizzotto",
          url: "https://www.youtube.com/watch?v=RJEnTRBxaSg",
          videoId: "RJEnTRBxaSg",
          durationLabel: "22:40",
        },
        {
          title: "Flutter Stack & Positioned Widget - Flutter Widget Essentials #5 | Flutter Tutorial",
          channel: "RetroPortal Studio",
          url: "https://www.youtube.com/watch?v=1qlgbNN0BaE",
          videoId: "1qlgbNN0BaE",
          durationLabel: "7:44",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-layout-widgets-q1",
          prompt: "A `Row` is 300 logical pixels wide. What widths do the children get?\n\n```dart\nRow(children: [\n  const SizedBox(width: 60),\n  Expanded(flex: 2, child: Container(color: Colors.red)),\n  Expanded(flex: 1, child: Container(color: Colors.blue)),\n])\n```",
          options: [
            "60, 160, 80",
            "60, 200, 100",
            "100, 133, 67",
            "60, 120, 120",
          ],
          correctIndex: 0,
          explanation:
            "Non-flexible children are laid out first: the `SizedBox` takes 60, leaving 240. That remainder is split 2:1, giving 160 and 80. Flex factors apply to leftover space, never to the container's full width.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-layout-widgets-q2",
          prompt: "What is the only difference between `Expanded` and `Flexible`?",
          options: [
            "`Expanded` is `Flexible` with `fit: FlexFit.tight`, forcing the child to fill its share; `Flexible` defaults to `FlexFit.loose`",
            "`Expanded` works on the main axis and `Flexible` on the cross axis",
            "`Flexible` accepts a `flex` factor and `Expanded` does not",
            "`Expanded` only works inside a `Row`",
          ],
          correctIndex: 0,
          explanation:
            "Both divide the same remaining space. Tight means the child's constraints have min equal to max, so it must fill; loose lets a small child stay small.",
        },
        {
          id: "flutter-layout-widgets-q3",
          prompt: "What does this render?\n\n```dart\nRow(children: [\n  const Icon(Icons.search),\n  TextField(controller: controller),\n])\n```",
          options: [
            "A layout error — the `Row` offers unbounded width and the text field tries to be as wide as possible",
            "The icon on the left and a text field sized to its hint text",
            "The icon and a full-width text field, correctly laid out",
            "A `RenderFlex overflowed` warning stripe on the right",
          ],
          correctIndex: 0,
          explanation:
            "An unwrapped child of a `Row` is laid out with unbounded main-axis width. `TextField` has no natural width, so this asserts. Wrapping it in `Expanded` is the standard fix.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-layout-widgets-q4",
          prompt: "Which of these are true about `Stack`? (Select all that apply.)",
          options: [
            "Non-positioned children are sized with the stack's loosened constraints and determine the stack's size",
            "`Positioned` children are laid out against the stack's final size and do not affect it",
            "A `Stack` containing only `Positioned` children shrinks to the smallest size its parent allows",
            "`Positioned` children are always painted below non-positioned children",
            "`alignment` controls where `Positioned` children land",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Paint order is list order regardless of positioning, and `alignment` applies to non-positioned children only. The first three together explain why an all-`Positioned` stack collapses.",
        },
        {
          id: "flutter-layout-widgets-q5",
          prompt: "What happens with this `Positioned`?\n\n```dart\nPositioned(\n  left: 0,\n  right: 0,\n  width: 100,\n  child: Container(color: Colors.red, height: 20),\n)\n```",
          options: [
            "An assertion error — `left`, `right` and `width` over-specify the horizontal placement",
            "`width` wins and the child is 100 wide, aligned left",
            "`left` and `right` win and the child stretches across",
            "The child is 100 wide and centred between left and right",
          ],
          correctIndex: 0,
          explanation:
            "Any two of `left`, `right` and `width` fully determine the horizontal layout; supplying all three is contradictory and asserts. The same rule applies to `top`, `bottom` and `height`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-layout-widgets-q6",
          prompt: "A `Column` inside a `Card` stretches to the full height of the card even though it has two short children. What is the fix?",
          options: [
            "Set `mainAxisSize: MainAxisSize.min` on the `Column`",
            "Set `crossAxisAlignment: CrossAxisAlignment.start`",
            "Wrap each child in `Flexible`",
            "Wrap the `Column` in an `IntrinsicHeight`",
          ],
          correctIndex: 0,
          explanation:
            "`MainAxisSize.max` is the default, so a flex claims all the main-axis extent it is offered. `min` makes it hug its children — provided the incoming constraints are not tight.",
        },
        {
          id: "flutter-layout-widgets-q7",
          prompt: "What is `Spacer` equivalent to?",
          options: [
            "`Expanded(flex: flex, child: SizedBox.shrink())`",
            "`SizedBox(width: 8, height: 8)`",
            "`Flexible(child: Container())`",
            "`Padding(padding: EdgeInsets.all(8))`",
          ],
          correctIndex: 0,
          explanation:
            "It is a flexible, empty child that soaks up leftover main-axis space. Because it is `Expanded`, it fails for the same reason `Expanded` does inside an unbounded flex.",
        },
        {
          id: "flutter-layout-widgets-q8",
          prompt: "What do the children get with `crossAxisAlignment: CrossAxisAlignment.stretch` on a `Column`?",
          options: [
            "Tight width constraints equal to the column's width, so each child fills it horizontally",
            "Loose width constraints, so each child may fill the width if it wants to",
            "Their natural width, centred",
            "An assertion error, because `stretch` is only valid on `Row`",
          ],
          correctIndex: 0,
          explanation:
            "`stretch` makes the cross-axis constraint tight, which is why a `Text` inside a stretched column still renders at its natural height but a `Container` fills the width.",
        },
        {
          id: "flutter-layout-widgets-q9",
          prompt: "A `ListView` is placed directly inside a `Column`. What goes wrong and why?",
          options: [
            "The column gives unbounded height on the main axis and the list wants to fill all of it, so layout asserts; `Expanded` bounds it",
            "The list renders at zero height because it has no items yet",
            "The list scrolls the whole column instead of itself",
            "Nothing — this is the recommended pattern",
          ],
          correctIndex: 0,
          explanation:
            "Both a `Column` (for non-flexible children) and a scroll view are greedy about the same axis. `Expanded`, a `SizedBox` with a fixed height, or `shrinkWrap: true` (at a cost) all resolve it.",
        },
        {
          id: "flutter-layout-widgets-q10",
          prompt: "Coming from CSS flexbox, which mapping is misleading?",
          options: [
            "`flex: 2` in Flutter behaves like `flex-grow: 2` on the *whole* container width",
            "`mainAxisAlignment` maps roughly to `justify-content`",
            "`crossAxisAlignment` maps roughly to `align-items`",
            "`Expanded` is roughly `flex: 1 1 0`",
          ],
          correctIndex: 0,
          explanation:
            "`flex-grow` and Flutter's `flex` both apply to *free* space, but CSS's `flex-basis` has no direct Flutter equivalent, and Flutter has no wrapping in `Row`/`Column` at all — `Wrap` is a separate widget.",
        },
      ],
    },
    {
      id: "flutter-keys",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Keys, and When You Actually Need One",
      summary:
        "Keys exist for exactly one reason, and it falls straight out of `canUpdate`: without a key, elements are matched to widgets by **type and position among siblings**. That is fine almost all of the time. It stops being fine the moment a list of same-typed, stateful children is reordered, inserted into or filtered, because position is no longer a stable identity and state ends up attached to the wrong row.\n\nThe symptom is memorable: delete the first item from a list of colour-swatch tiles and the *colours* shift up correctly while the per-tile state — a checkbox, a scroll offset, an animation — stays behind with its index. Adding a `ValueKey(item.id)` gives the framework a stable identity, and the multi-child element update algorithm then matches keyed children across the sibling list rather than by slot, moving elements instead of rebuilding them.\n\nThe rules worth internalising. **Put the key on the widget that moves**, at the top of the subtree, not on something inside it — a key deep in the subtree cannot save a parent whose element was already torn down. **`ValueKey`** for a value that identifies the item (an id, not an index — an index is just position again). **`ObjectKey`** when identity is the object itself. **`UniqueKey`** when you want to *force* a new element; using it is a deliberate reset, and creating one inside `build` destroys and rebuilds the subtree on every single frame, which is a spectacular and very common own-goal.\n\n**`GlobalKey`** is a different animal. It identifies a widget across the whole tree, gives you access to its `State`, `BuildContext` and render object from outside, and — uniquely — lets an element be *reparented* to a new position in the same frame while keeping its state. It is the right tool for `GlobalKey<FormState>` and for genuinely moving a subtree between parents. It is the wrong tool for reaching into a child to call a method, which is almost always a sign that state should have been lifted instead. Two live `GlobalKey`s with the same identity in the tree at once is a hard error.\n\nIf you know React: `ValueKey` is React's `key` prop, and the \"don't use the array index\" advice transfers verbatim. `GlobalKey` has no React equivalent — the closest thing is a ref, but refs cannot move a component's state to a new parent.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Flutter API: Key", url: "https://api.flutter.dev/flutter/foundation/Key-class.html", kind: "docs" },
        { label: "Flutter API: GlobalKey", url: "https://api.flutter.dev/flutter/widgets/GlobalKey-class.html", kind: "docs" },
        { label: "Flutter blog: Keys! What are they good for?", url: "https://flutter.dev/blog/keys-what-are-they-good-for", kind: "article" },
      ],
      video: {
        title: "When to Use Keys - Flutter Widgets 101 Ep. 4",
        channel: "Google for Developers",
        url: "https://www.youtube.com/watch?v=kn0EOS-ZiIc",
        videoId: "kn0EOS-ZiIc",
        durationLabel: "9:40",
      },
      alternateVideos: [
        {
          title: "Flutter Tutorial - Flutter Keys & Value Key",
          channel: "HeyFlutter․com",
          url: "https://www.youtube.com/watch?v=-F_5yHm_Zso",
          videoId: "-F_5yHm_Zso",
          durationLabel: "8:52",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-keys-q1",
          prompt: "A `Column` holds three `TodoTile` widgets (each a `StatefulWidget` with a local `bool _expanded`). The first item is deleted from the list and the widget rebuilds with two tiles. No keys are used. What happens?",
          options: [
            "The remaining tiles show the right text but keep the expansion state that belonged to the old items at those positions",
            "Both remaining tiles are disposed and rebuilt fresh, resetting expansion",
            "The framework throws, because the child count changed",
            "Expansion state follows the items correctly, because `TodoTile` is the same type",
          ],
          correctIndex: 0,
          explanation:
            "Elements match widgets by type and slot. Slot 0 still holds a `TodoTile`, so its element and `State` are reused with new configuration — the text updates, the private state does not move.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-keys-q2",
          prompt: "Where does the key go to fix that?",
          options: [
            "On the `TodoTile` itself, as `TodoTile(key: ValueKey(todo.id), ...)`",
            "On the `Column`",
            "On the innermost `Text` inside each tile",
            "On the `State` subclass, as a `globalKey` field",
          ],
          correctIndex: 0,
          explanation:
            "The key must be on the widget whose element is being matched — the top of the subtree that moves. A key further down cannot help once the parent element has already been reused for the wrong item.",
        },
        {
          id: "flutter-keys-q3",
          prompt: "What happens here on every rebuild?\n\n```dart\n@override\nWidget build(BuildContext context) {\n  return Counter(key: UniqueKey());\n}\n```",
          options: [
            "`Counter`'s element is destroyed and recreated each rebuild, so its state resets and any animation restarts",
            "Nothing changes — `UniqueKey` is stable for the lifetime of the widget",
            "It throws a duplicate-key error on the second build",
            "The element is reused, because the runtime type still matches",
          ],
          correctIndex: 0,
          explanation:
            "A fresh `UniqueKey` never equals the previous one, so `canUpdate` fails every time. This is a genuinely useful trick when you *want* a reset, and a disaster when it happens by accident inside `build`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-keys-q4",
          prompt: "Why is `ValueKey(index)` usually the wrong choice for a reorderable list?",
          options: [
            "The index is position, which is exactly the identity that was already broken — it changes when items move",
            "`ValueKey` requires a `String`, not an `int`",
            "Integer keys collide with `GlobalKey` hash codes",
            "It is correct; index keys are the recommended default",
          ],
          correctIndex: 0,
          explanation:
            "Keying by index restates the default behaviour with extra steps. Key by something intrinsic to the item — a database id, a uuid — so identity survives reordering.",
        },
        {
          id: "flutter-keys-q5",
          prompt: "Which of these are legitimate uses of `GlobalKey`? (Select all that apply.)",
          options: [
            "`GlobalKey<FormState>` so a submit button outside the form can call `validate()`",
            "Moving a subtree to a different parent in the same frame while preserving its state",
            "Reading a widget's render-object size after layout for a measurement-driven effect",
            "Calling a private method on a child's `State` to make it refresh its data",
            "Giving every item in a long list a unique identity",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Reaching into a child to trigger behaviour is a sign that state should be lifted or an event pushed down instead. And `GlobalKey` is comparatively expensive — for list identity, `ValueKey` is the right tool.",
        },
        {
          id: "flutter-keys-q6",
          prompt: "Two widgets in the tree are built with the same `GlobalKey` instance at the same time. What happens?",
          options: [
            "A hard error: a `GlobalKey` must be unique across the entire tree",
            "The second one silently wins and the first loses its state",
            "Both work; `GlobalKey` uniqueness is only enforced among siblings",
            "The framework generates a derived key for the duplicate",
          ],
          correctIndex: 0,
          explanation:
            "`GlobalKey` is a registry entry for the whole app, so duplicates are ambiguous by definition. The classic way to hit this is keeping a key in a field and rendering the widget in two branches of a conditional that are briefly both live.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-keys-q7",
          prompt: "Two `Checkbox`-holding stateful tiles sit in a `Column` and are swapped. Both have `ValueKey`s. What does the framework do?",
          options: [
            "It matches the keyed children across the sibling list and moves the existing elements, so each tile's state travels with it",
            "It disposes both elements and rebuilds them in the new order",
            "It reuses elements by slot, so the state stays put and only the keys move",
            "It throws, because keyed children cannot change order",
          ],
          correctIndex: 0,
          explanation:
            "The multi-child update algorithm does a keyed match rather than a slot match, so state follows identity. That is the entire payoff of adding keys.",
        },
        {
          id: "flutter-keys-q8",
          prompt: "A form switches between a `TextField` for email and a `TextField` for a phone number based on a toggle. Neither has a key. What does the user see?",
          options: [
            "The typed text carries over between modes, because the same element and its controller are reused",
            "The field resets, because the `keyboardType` changed",
            "A duplicate-key error the first time the toggle flips",
            "Both fields are shown at once",
          ],
          correctIndex: 0,
          explanation:
            "Same type, same slot, no key means the same element. Giving the two branches different `ValueKey`s forces a clean element per mode — the canonical case where you add a key to *avoid* reuse.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-keys-q9",
          prompt: "When do you not need a key at all?",
          options: [
            "When the children at a given position never change type and are not reordered, or hold no state of their own",
            "When the list is shorter than ten items",
            "When every child is a `StatelessWidget` created with `const`",
            "Whenever `ListView.builder` is used, since it keys items automatically",
          ],
          correctIndex: 0,
          explanation:
            "Keys are about preserving or discarding *state* across a structural change. Stateless children are a common case where it genuinely does not matter, but `ListView.builder` does not add keys for you.",
        },
        {
          id: "flutter-keys-q10",
          prompt: "Which React idea maps cleanly onto `ValueKey`, and which Flutter idea has no React counterpart?",
          options: [
            "`ValueKey` is React's `key` prop; `GlobalKey` has no counterpart, because React refs cannot reparent a component and keep its state",
            "`ValueKey` is React's `ref`; `GlobalKey` is React's `key`",
            "Both map exactly onto React's `key`; the difference is only naming",
            "Neither maps to React, because React reconciles by component identity rather than position",
          ],
          correctIndex: 0,
          explanation:
            "React reconciles children by position too, unless you give them keys — the same algorithm and the same index-key warning. `GlobalKey`'s reparenting ability is genuinely beyond what React offers.",
        },
      ],
    },
    {
      id: "flutter-state-management",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Choosing a State Solution: setState, Provider, Riverpod, BLoC",
      summary:
        "Every option here is solving the same two problems: **where does shared state live**, and **how does a widget deep in the tree read it and rebuild when it changes**. `setState` answers neither once state outlives a single widget, and lifting state up works until the lift reaches a widget that has no business knowing about it. Everything else is a different ergonomic wrapper over `InheritedWidget`, which remains the only mechanism Flutter itself provides.\n\n**Provider** is the thinnest layer: a `ChangeNotifier` (or any listenable) placed in the tree, read by `context.watch<T>()` to subscribe or `context.read<T>()` to grab a one-off reference in a callback. It is small, boring and well understood. Its weakness is that lookups are by type and resolved at runtime through the tree, so a missing provider is a `ProviderNotFoundException` at runtime, two providers of the same type are awkward, and everything hinges on having a `BuildContext`.\n\n**Riverpod** (now at v3) is the same author's answer to those specific complaints: providers are top-level objects rather than tree nodes, so the compiler catches a missing one, multiple providers of a type are trivial, and nothing needs a context. It adds real machinery — `Notifier`/`AsyncNotifier`, automatic disposal, caching and dependency graphs between providers — and that machinery is the cost. It is the option that moves fastest, so verify any tutorial's version before copying it; code written against Riverpod 1 or 2 will not compile unchanged.\n\n**BLoC** is the most opinionated: events in, states out, everything explicit and streamed. The boilerplate is real and so is the payoff — an auditable trail of what happened and why, easy testing, and a shape that survives a team of eight better than a bag of `ChangeNotifier`s. `Cubit` is the same library with the event layer removed, and is what most teams should actually start with.\n\nThe framing that matters more than the library: Flutter's own architecture guidance is deliberately library-neutral and cares about layering — a repository as the single source of truth, unidirectional data flow, UI as a function of state. A team that gets that right is fine with any of these. A team that gets it wrong has the same tangle in all of them. Pick for team familiarity and testing needs; the libraries differ far less than the arguments about them suggest.",
      level: "advanced",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "Flutter: List of state management approaches", url: "https://docs.flutter.dev/data-and-backend/state-mgmt/options", kind: "docs" },
        { label: "Flutter: Guide to app architecture", url: "https://docs.flutter.dev/app-architecture/guide", kind: "docs" },
        { label: "Riverpod: Why Riverpod over Provider", url: "https://riverpod.dev/docs/from_provider/motivation", kind: "article" },
        { label: "Bloc: Why Bloc?", url: "https://bloclibrary.dev/why-bloc/", kind: "article" },
      ],
      video: {
        title: "The Definitive Guide to our MVVM Architecture in Flutter",
        channel: "Hungrimind",
        url: "https://www.youtube.com/watch?v=62P2fbxo45M",
        videoId: "62P2fbxo45M",
        durationLabel: "7:32",
      },
      alternateVideos: [
        {
          title: "Flutter State Smackdown: Comparing BLoC, Provider, Riverpod - Premnath S | Fluttercon India 2025",
          channel: "nextapp devCon",
          url: "https://www.youtube.com/watch?v=OZGq565DtqA",
          videoId: "OZGq565DtqA",
          durationLabel: "21:42",
        },
        {
          title: "Flutter Riverpod EASY Tutorial",
          channel: "Flutter Mapp",
          url: "https://www.youtube.com/watch?v=7Cp1GlmHTGE",
          videoId: "7Cp1GlmHTGE",
          durationLabel: "8:16",
        },
        {
          title: "Flutter Bloc EASY Tutorial",
          channel: "Flutter Mapp",
          url: "https://www.youtube.com/watch?v=3bEkaRUVOeU",
          videoId: "3bEkaRUVOeU",
          durationLabel: "8:24",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-state-management-q1",
          prompt: "What do Provider, Riverpod and BLoC's `BlocProvider` all ultimately rely on to deliver state to a deeply nested widget?",
          options: [
            "`InheritedWidget`, the framework's only built-in mechanism for tree-scoped lookup and dependency registration",
            "A global singleton registry keyed by type",
            "The element tree's `visitAncestorElements` walk, performed on every build",
            "Platform channels carrying state from a native store",
          ],
          correctIndex: 0,
          explanation:
            "They differ in ergonomics, lifecycle and type safety, not in mechanism. Knowing that makes their behaviour and their rebuild characteristics predictable rather than magical.",
        },
        {
          id: "flutter-state-management-q2",
          prompt: "What is the difference between `context.watch<Cart>()` and `context.read<Cart>()` in Provider?",
          options: [
            "`watch` registers a dependency so the widget rebuilds on change and must be called in `build`; `read` does a one-off lookup and is for callbacks",
            "`watch` returns a stream and `read` returns a snapshot",
            "`read` is the asynchronous version of `watch`",
            "`watch` searches the whole tree while `read` only checks the immediate parent",
          ],
          correctIndex: 0,
          explanation:
            "`watch` is `dependOnInheritedWidgetOfExactType` in disguise. Calling it outside `build` (in `initState`, or in an `onPressed`) is the error; `read` is the escape hatch for exactly those places.",
        },
        {
          id: "flutter-state-management-q3",
          prompt: "What happens here?\n\n```dart\n@override\nvoid initState() {\n  super.initState();\n  final cart = context.watch<Cart>();\n  _count = cart.items.length;\n}\n```",
          options: [
            "It throws — `watch` registers an inherited dependency, which is not allowed during `initState`",
            "It works, and the widget rebuilds when the cart changes",
            "It works but the dependency is silently dropped",
            "It works only if `Cart` is provided above `MaterialApp`",
          ],
          correctIndex: 0,
          explanation:
            "Dependency registration is illegal before `initState` completes. Use `context.read<Cart>()` here, or move the dependent read to `didChangeDependencies`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-state-management-q4",
          prompt: "Which of these are genuine advantages Riverpod claims over Provider? (Select all that apply.)",
          options: [
            "A missing provider is a compile-time error rather than a runtime `ProviderNotFoundException`",
            "Providers can be read without a `BuildContext`, so logic is testable outside the widget tree",
            "Two providers exposing the same type can coexist without ambiguity",
            "It eliminates the need for a repository or data layer",
            "It makes rebuilds free, because it does not use `InheritedWidget`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are the motivation the docs actually give. Riverpod still surfaces state to widgets through an inherited scope, and it has nothing to say about how you structure your data layer.",
        },
        {
          id: "flutter-state-management-q5",
          prompt: "What is the difference between `Cubit` and `Bloc` in the bloc library?",
          options: [
            "A `Cubit` exposes methods that emit new states directly; a `Bloc` takes an event stream in and maps events to states",
            "A `Cubit` is synchronous and a `Bloc` is asynchronous",
            "A `Cubit` holds a single value and a `Bloc` holds a list",
            "`Cubit` is the deprecated predecessor of `Bloc`",
          ],
          correctIndex: 0,
          explanation:
            "The event layer is the only difference. It buys you a replayable, loggable record of intent, and it costs a class per interaction — which is why `Cubit` is the sensible default until you need that record.",
        },
        {
          id: "flutter-state-management-q6",
          prompt: "A `ChangeNotifier` calls `notifyListeners()` after its owning widget has been removed and the notifier disposed. What happens?",
          options: [
            "It throws — a disposed `ChangeNotifier` rejects further use",
            "Nothing; listeners were already removed so the call is a no-op",
            "The listeners fire and the disposed widgets rebuild",
            "It silently re-registers the notifier",
          ],
          correctIndex: 0,
          explanation:
            "This is the `ChangeNotifier` version of `setState` after `dispose`, and it is usually caused by an in-flight async request completing after navigation. Cancel the work, or check disposal before emitting.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-state-management-q7",
          prompt: "A screen watches a large `AppState` object and rebuilds entirely when any field changes. What is the standard fix, in Provider terms?",
          options: [
            "Use `context.select` or a `Selector` so the widget depends only on the fields it renders",
            "Wrap the screen in a `RepaintBoundary`",
            "Override `operator ==` on the state object",
            "Move the provider higher in the tree",
          ],
          correctIndex: 0,
          explanation:
            "Narrowing the dependency is the only thing that reduces the rebuild set — the same idea as `MediaQuery.sizeOf` versus `MediaQuery.of`. A repaint boundary affects painting, not building; moving the provider changes nothing.",
        },
        {
          id: "flutter-state-management-q8",
          prompt: "Why does Flutter's own architecture guidance decline to recommend a state-management library?",
          options: [
            "Its concerns are layering, a single source of truth and unidirectional data flow — properties any of these libraries can satisfy or violate",
            "Because the team considers the question already settled in favour of Riverpod",
            "Because state management is handled by the engine, not the framework",
            "Because the guidance targets only Flutter web",
          ],
          correctIndex: 0,
          explanation:
            "The guide is explicit that the architecture matters more than the tool. A team that puts business rules in widgets has the same problem in every library on the list.",
        },
        {
          id: "flutter-state-management-q9",
          prompt: "You are reviewing a three-year-old Riverpod tutorial that uses `StateNotifierProvider` and `ref.watch(provider.state)`. What should you assume?",
          options: [
            "It targets an older major version; check the version it was written for before copying, because the current API differs",
            "It is still the recommended API and can be copied as-is",
            "`StateNotifier` was never part of Riverpod, so the tutorial is wrong",
            "It only differs cosmetically from the current API",
          ],
          correctIndex: 0,
          explanation:
            "Riverpod has been through several breaking majors, and `Notifier`/`AsyncNotifier` with the `@riverpod` annotation is where the current documentation lives. This is the single biggest source of confusion in Flutter state-management material.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-state-management-q10",
          prompt: "Which factors should realistically drive the choice between these libraries on a team?",
          options: [
            "Existing team familiarity, how testable the logic needs to be outside the widget tree, and how much explicitness the codebase's size justifies",
            "Raw rebuild performance, since the differences are large and measurable",
            "Which one has the most GitHub stars this quarter",
            "Whether the app targets iOS or Android",
          ],
          correctIndex: 0,
          explanation:
            "All of these end up marking elements dirty through an inherited scope, so performance is a wash at typical app sizes. What genuinely differs is boilerplate, testability without a widget tree, and how well the shape scales to a large team.",
        },
      ],
    },
    {
      id: "flutter-navigation",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Navigation, Declarative Routing and go_router",
      summary:
        "`Navigator` is an imperative stack: `push` a route, `pop` it, and `await` the pushed route's result like a function call — which is genuinely elegant for a modal or a picker. The problem is that the stack is a side effect of the calls you happened to make, so nothing outside the widget tree knows what it contains. That is fine until you need deep links, browser URLs, or a \"restore the user where they were\" cold start, at which point you have an application state that lives nowhere you can inspect.\n\nDeclarative routing inverts it: you describe the routes and the current location, and the router derives the stack. `go_router` is the community-standard, Flutter-team-maintained package for this. A `GoRoute` has a path template with parameters (`/users/:id`, read back from `state.pathParameters`), a `builder`, and optional nested `routes`. `context.go('/users/7')` sets the location and rebuilds the stack the route tree implies; `context.push` adds on top of the current stack, which is the imperative behaviour when you actually want it. That distinction catches people constantly — `go` can shorten the stack, `push` never does.\n\nAuth guards become a pure function rather than a scattering of `pushReplacement` calls: a top-level `redirect` receives the state and returns either `null` (proceed) or a new location. Combine it with `refreshListenable` so a sign-out re-evaluates the redirect immediately. `ShellRoute` and `StatefulShellRoute` wrap a subtree in persistent chrome — the bottom navigation bar whose tabs each keep their own stack and scroll position.\n\nThe gotcha worth knowing: `Navigator.of(context)` walks up to the *nearest* navigator, so inside a `ShellRoute` or a nested navigator you will get the inner one. `Navigator.of(context, rootNavigator: true)` is how you reach the outermost one — which is what you want for a dialog that should cover the whole app rather than just one tab. And a `BuildContext` captured before an `await` is as dangerous in navigation callbacks as anywhere else; capture the navigator or router before you suspend, or check `context.mounted` after.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Flutter: Navigation and routing", url: "https://docs.flutter.dev/ui/navigation", kind: "docs" },
        { label: "Flutter API: Navigator", url: "https://api.flutter.dev/flutter/widgets/Navigator-class.html", kind: "docs" },
        { label: "pub.dev: go_router", url: "https://pub.dev/packages/go_router", kind: "docs" },
      ],
      video: {
        title: "Flutter GoRouter Tutorial - Easy Navigation Tutorial using GoRouter",
        channel: "Hussain Mustafa",
        url: "https://www.youtube.com/watch?v=h_zfsFKm5MY",
        videoId: "h_zfsFKm5MY",
        durationLabel: "17:37",
      },
      alternateVideos: [
        {
          title: "go_router (Package of the Week)",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=b6Z885Z46cU",
          videoId: "b6Z885Z46cU",
          durationLabel: "1:48",
        },
        {
          title: "Flutter GoRouter | Become Pro of Route Navigation in Flutter | Page Navigation in Flutter",
          channel: "Build with Akshit",
          url: "https://www.youtube.com/watch?v=QwlrHjBYQ2M",
          videoId: "QwlrHjBYQ2M",
          durationLabel: "33:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-navigation-q1",
          prompt: "The current stack is `/` then `/products` then `/products/42`. The user taps a link that calls `context.go('/cart')`. What is the resulting stack?",
          options: [
            "Whatever the route tree implies for `/cart` — typically `/` then `/cart`, discarding the products branch",
            "`/`, `/products`, `/products/42`, `/cart` — `go` always appends",
            "Just `/cart`, with no way to go back",
            "Unchanged; `go` only updates the URL",
          ],
          correctIndex: 0,
          explanation:
            "`go` sets a location and lets the route configuration rebuild the stack, so it can shorten it. `push` is the one that unconditionally adds a page on top.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-navigation-q2",
          prompt: "A route is declared as `GoRoute(path: '/users/:id', builder: ...)`. How is the id read inside the builder?",
          options: [
            "`state.pathParameters['id']`",
            "`state.queryParameters['id']`",
            "`state.extra['id']`",
            "`ModalRoute.of(context)!.settings.arguments`",
          ],
          correctIndex: 0,
          explanation:
            "Path template segments land in `pathParameters`; anything after a `?` is in the query parameters, reachable through `state.uri`. `extra` carries an arbitrary Dart object that cannot be encoded into a URL.",
        },
        {
          id: "flutter-navigation-q3",
          prompt: "Which of these are real advantages of declarative routing over a bare `Navigator` stack? (Select all that apply.)",
          options: [
            "Deep links and web URLs map onto app state without a separate parsing layer",
            "Auth redirects become one pure function instead of scattered `pushReplacement` calls",
            "The stack is derivable from the current location, so it can be restored after a cold start",
            "Route transitions become cheaper to render",
            "It removes the need for `BuildContext` when navigating",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The wins are all about making the stack a *derived value* rather than an accumulated side effect. Transition rendering is identical, and the extension methods still take a context.",
        },
        {
          id: "flutter-navigation-q4",
          prompt: "A top-level `redirect` callback returns a `String?`. What does returning `null` mean?",
          options: [
            "No redirect — let the navigation proceed to the requested location",
            "Redirect to the root route",
            "Cancel the navigation entirely",
            "Retry the navigation on the next frame",
          ],
          correctIndex: 0,
          explanation:
            "`null` is the \"nothing to do here\" answer, which is what makes the guard readable: return the login path when unauthenticated, otherwise `null`. Always returning a non-null value causes a redirect loop.",
        },
        {
          id: "flutter-navigation-q5",
          prompt: "Inside a screen nested in a `ShellRoute` with a bottom navigation bar, `Navigator.of(context).push(...)` is called. Which navigator receives it?",
          options: [
            "The inner navigator owned by the shell, so the new page appears inside the tab and the nav bar stays visible",
            "The root navigator, so the page covers the whole app",
            "Both, producing a duplicate page",
            "Neither — a `ShellRoute` disables the imperative API",
          ],
          correctIndex: 0,
          explanation:
            "`of` finds the nearest navigator in the tree, which is the point of a shell. Pass `rootNavigator: true` (or set `parentNavigatorKey` on the route) when you want the page to cover the chrome.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-navigation-q6",
          prompt: "What does `await Navigator.push<bool>(context, route)` return when the pushed route is dismissed with the system back gesture rather than an explicit `pop(true)`?",
          options: [
            "`null`",
            "`false`",
            "`true`",
            "It throws, because no result was supplied",
          ],
          correctIndex: 0,
          explanation:
            "The result type is nullable for exactly this reason — a back gesture pops with no value. Treating `null` as \"cancelled\" is the standard handling, and forgetting to is a routine source of null-check crashes.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-navigation-q7",
          prompt: "Why does `go_router` expose `refreshListenable` on the router?",
          options: [
            "So a change such as sign-out re-runs the `redirect` logic immediately instead of waiting for the next navigation",
            "So the router can rebuild its widget tree every frame",
            "So deep links can be polled from the platform",
            "So route transitions can be animated from a controller",
          ],
          correctIndex: 0,
          explanation:
            "`redirect` only runs when a navigation is evaluated. Handing the router a listenable tied to auth state makes a logout kick the user out of a protected page right away.",
        },
        {
          id: "flutter-navigation-q8",
          prompt: "What does `StatefulShellRoute` add over a plain `ShellRoute`?",
          options: [
            "Each branch keeps its own navigator and state, so tab stacks and scroll positions survive switching tabs",
            "It allows the shell itself to be a `StatefulWidget`",
            "It persists route state to disk across app restarts",
            "It makes the shell rebuild whenever the route changes",
          ],
          correctIndex: 0,
          explanation:
            "A plain `ShellRoute` has one inner navigator, so moving between tabs discards the previous tab's stack. The stateful variant keeps a navigator per branch, which is what users expect from a bottom nav bar.",
        },
        {
          id: "flutter-navigation-q9",
          prompt: "Why would you use `state.extra` rather than a path parameter?",
          options: [
            "To pass a full Dart object that cannot be encoded into a URL — accepting that it is lost on a deep link or a web refresh",
            "Because path parameters are limited to 32 characters",
            "Because `extra` is type-safe and path parameters are not",
            "Because `extra` survives a cold start while path parameters do not",
          ],
          correctIndex: 0,
          explanation:
            "`extra` is an in-memory hand-off, so it is convenient and it disappears exactly when you most need the route to be reconstructible. Anything required to rebuild the screen belongs in the path.",
        },
        {
          id: "flutter-navigation-q10",
          prompt: "Coming from React Router, which comparison is accurate?",
          options: [
            "`go_router`'s route tree and `redirect` map closely onto React Router's nested routes and loaders/guards; the extra concept is that Flutter still has a real page stack underneath",
            "`go_router` is the equivalent of React's `useNavigate` and nothing more",
            "React Router is imperative and `go_router` is declarative",
            "There is no comparison, because Flutter routes cannot nest",
          ],
          correctIndex: 0,
          explanation:
            "The declarative route-tree model is very familiar. What differs is that mobile has a physical back stack with transitions and gestures, so `go` versus `push` is a distinction React Router does not need to make.",
        },
      ],
    },
    {
      id: "flutter-async-ui",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "FutureBuilder, StreamBuilder and Async UI",
      summary:
        "`FutureBuilder` and `StreamBuilder` are the framework's built-in bridge from an asynchronous value to a widget. Both take an async source and a `builder` that receives an `AsyncSnapshot`, and both rebuild that builder as the source progresses through `ConnectionState.none`, `waiting`, `active` and `done`. They are the smallest possible thing that works, and they are worth understanding properly because every state-management library is ultimately reimplementing them with better lifecycle handling.\n\nThe documented trap is severe enough that the API docs lead with it: **the future must not be created inside `build`.** If you write `future: api.fetchUser()` in the builder's own `build` method, then every time the *parent* rebuilds — a theme change, a keyboard opening, an unrelated `setState` — a brand-new future is created and the request is fired again. The docs are explicit: obtain it in `initState`, `didChangeDependencies` or `didUpdateWidget` and store it in a field. The same applies to `StreamBuilder`, where the consequence is worse: resubscribing to a single-subscription stream throws outright.\n\n`AsyncSnapshot` has a shape that rewards care. Check `hasError` before `hasData`, because a completed-with-error snapshot is still `ConnectionState.done`, and a builder that only tests `hasData` renders its loading spinner forever on failure. `hasData` is false for a null value, so an API that legitimately returns null needs `connectionState` rather than `hasData`. And `initialData` lets you skip the waiting state entirely when you already have a cached value.\n\nWhen to reach for something else: if the only thing changing is one value you own, `ValueListenableBuilder` is leaner and has no connection states to get wrong. If several screens need the same fetched data, a `FutureBuilder` per screen means a request per screen, and that is the moment to move the future behind a repository with a cache — which is precisely the gap that Riverpod's async providers and BLoC's state classes exist to fill.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Flutter API: FutureBuilder", url: "https://api.flutter.dev/flutter/widgets/FutureBuilder-class.html", kind: "docs" },
        { label: "Flutter API: StreamBuilder", url: "https://api.flutter.dev/flutter/widgets/StreamBuilder-class.html", kind: "docs" },
        { label: "Flutter API: ValueListenableBuilder", url: "https://api.flutter.dev/flutter/widgets/ValueListenableBuilder-class.html", kind: "docs" },
      ],
      video: {
        title: "Futures and Streams (Flutter FutureBuilder, StreamBuilder)",
        channel: "HeyFlutter․com",
        url: "https://www.youtube.com/watch?v=lkpPg0ieklg",
        videoId: "lkpPg0ieklg",
        durationLabel: "13:09",
      },
      alternateVideos: [
        {
          title: "🏊‍♂️Streams in Flutter in 1 Shot | Learn about StreamController and StreamBuilder in Flutter",
          channel: "Build with Akshit",
          url: "https://www.youtube.com/watch?v=tnYTHacU8Z0",
          videoId: "tnYTHacU8Z0",
          durationLabel: "19:00",
        },
        {
          title: "The Ultimate Flutter Tutorial for Beginners - 2025 Full Course",
          channel: "Flutter Mapp",
          url: "https://www.youtube.com/watch?v=3kaGC_DrUnw",
          videoId: "3kaGC_DrUnw",
          startSeconds: 17227,
          chapterLabel: "FutureBuilder",
          durationLabel: "5:16:54",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-async-ui-q1",
          prompt: "What is wrong with this?\n\n```dart\n@override\nWidget build(BuildContext context) {\n  return FutureBuilder<User>(\n    future: api.fetchUser(id),\n    builder: (context, snapshot) => Text(snapshot.data?.name ?? '...'),\n  );\n}\n```",
          options: [
            "A new future — and therefore a new network request — is created on every rebuild of this widget",
            "`FutureBuilder` requires `initialData` when the type is non-nullable",
            "The builder must return a `Widget`, not a `Text`",
            "Nothing; this is the documented pattern",
          ],
          correctIndex: 0,
          explanation:
            "The docs state the future must not be created in `build`. Any parent rebuild restarts the task, which shows up as duplicate requests and a spinner that flashes back on.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-async-ui-q2",
          prompt: "Which of these are correct places to create the future? (Select all that apply.)",
          options: [
            "`initState`, assigned to a field",
            "`didChangeDependencies`, when it depends on an inherited value",
            "`didUpdateWidget`, when the id it depends on has changed",
            "The `builder` callback, so it re-fetches when the snapshot changes",
            "A getter on the widget, so it is recomputed lazily",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "All three of the correct answers run once per meaningful change and store a stable reference. A getter recomputes on every access, which is the same bug as creating it in `build`.",
        },
        {
          id: "flutter-async-ui-q3",
          prompt: "A request fails. What does this builder render?\n\n```dart\nbuilder: (context, snapshot) {\n  if (snapshot.hasData) return UserCard(snapshot.data!);\n  return const CircularProgressIndicator();\n}\n```",
          options: [
            "A spinner forever, because the error snapshot has no data and the error is never checked",
            "An error widget supplied by the framework",
            "A red error screen, because unhandled snapshot errors are rethrown",
            "An empty `UserCard`, because `data` defaults to a zero value",
          ],
          correctIndex: 0,
          explanation:
            "A failed future still reaches `ConnectionState.done`; it just has `hasError` true and `hasData` false. Check `hasError` first — this is the most common `FutureBuilder` bug in review.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-async-ui-q4",
          prompt: "What are the four values of `ConnectionState`?",
          options: [
            "`none`, `waiting`, `active`, `done`",
            "`idle`, `loading`, `success`, `error`",
            "`initial`, `pending`, `fulfilled`, `rejected`",
            "`none`, `loading`, `streaming`, `complete`",
          ],
          correctIndex: 0,
          explanation:
            "`active` is the one that matters for streams — a stream that has emitted but not closed sits in `active` indefinitely, so a builder that only handles `waiting` and `done` will never render for a long-lived stream.",
        },
        {
          id: "flutter-async-ui-q5",
          prompt: "A `StreamBuilder` is given `stream: controller.stream` where the controller is a plain (single-subscription) `StreamController`, created in `build`. The parent rebuilds. What happens?",
          options: [
            "The builder tries to listen to a stream that already has a listener, which throws",
            "It resubscribes cleanly and misses no events",
            "The old subscription is kept and the new stream is ignored",
            "Events are duplicated to both subscriptions",
          ],
          correctIndex: 0,
          explanation:
            "`StreamBuilder` unsubscribes and resubscribes whenever the `stream` identity changes. Single-subscription streams reject a second `listen`, so the stream and its controller must be created once and held.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-async-ui-q6",
          prompt: "An endpoint legitimately returns `null` for \"no profile set\". The builder checks `snapshot.hasData`. What goes wrong?",
          options: [
            "`hasData` is false for a null value, so the success case is indistinguishable from the loading case",
            "`hasData` throws on a null value",
            "The snapshot never reaches `ConnectionState.done`",
            "Nothing — `hasData` is true whenever the future completed",
          ],
          correctIndex: 0,
          explanation:
            "`hasData` is defined as \"data is non-null\". Distinguish the states with `connectionState == ConnectionState.done` plus `hasError`, and treat null as a valid result.",
        },
        {
          id: "flutter-async-ui-q7",
          prompt: "What is `initialData` for?",
          options: [
            "Supplying a value to render immediately so the builder can skip the waiting state when a cached value is already available",
            "Providing a fallback that replaces the result if the future fails",
            "Seeding the future's completion value",
            "Setting the first value emitted by a stream",
          ],
          correctIndex: 0,
          explanation:
            "It affects only what the snapshot carries before the source produces anything. It is not an error fallback, and it does not feed the future or the stream.",
        },
        {
          id: "flutter-async-ui-q8",
          prompt: "You need a widget that rebuilds whenever a single `int` you own changes, with no async source. What is the leanest option?",
          options: [
            "`ValueListenableBuilder` wrapping a `ValueNotifier<int>`",
            "`StreamBuilder` over a broadcast controller",
            "`FutureBuilder` with `initialData`",
            "A `StatefulWidget` calling `setState` from the parent",
          ],
          correctIndex: 0,
          explanation:
            "`ValueNotifier` plus `ValueListenableBuilder` has no connection states, no subscriptions to leak and rebuilds only the builder's subtree. It is the right size of tool for one value.",
        },
        {
          id: "flutter-async-ui-q9",
          prompt: "Three screens each use a `FutureBuilder` calling the same `fetchSettings()`. What is the consequence, and the fix?",
          options: [
            "Three network requests; move the call behind a repository that caches, and expose the cached future or stream",
            "One request, because Dart memoises identical future-returning calls",
            "Three requests, which is correct — each screen should own its own data",
            "One request, but only if the screens are in the same route",
          ],
          correctIndex: 0,
          explanation:
            "`FutureBuilder` has no notion of sharing or caching; it renders whatever future you hand it. Once data is needed in more than one place, the single-source-of-truth repository is the answer, not a fourth builder.",
        },
        {
          id: "flutter-async-ui-q10",
          prompt: "Coming from React, what is the closest analogue of `FutureBuilder`?",
          options: [
            "A hand-rolled `useEffect` + `useState` fetch hook — including the same \"why is this firing on every render\" dependency bug",
            "React's `Suspense` boundary, since both suspend rendering until data arrives",
            "`useMemo`, since both cache a computed value",
            "An error boundary, since both surface failures",
          ],
          correctIndex: 0,
          explanation:
            "`FutureBuilder` renders a loading branch rather than suspending, so it is the manual fetch-hook pattern, not `Suspense`. The stale-dependency bug is literally the same bug in both ecosystems.",
        },
      ],
    },
    {
      id: "flutter-forms",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Forms, Controllers and Validation",
      summary:
        "Flutter's form story is two independent layers, and conflating them is where most confusion starts. `TextField` is the raw input widget, driven by a `TextEditingController` you own. `Form` plus `TextFormField` is a coordination layer on top: the `Form` finds its `FormField` descendants and can validate, save or reset all of them at once. You can use either alone; you use both when you want group operations.\n\nThe handle to a `Form` is a `GlobalKey<FormState>` — one of the few places a `GlobalKey` is unambiguously the right call, because a submit button that sits *outside* the form subtree genuinely needs to reach in. `formKey.currentState!.validate()` runs every field's `validator` and returns a single bool; a validator returns `null` for valid and an error string otherwise. Calling `validate()` also rebuilds the fields so the messages appear, which is why validation feels instant without any `setState` of your own. `save()` fires every `onSaved`, and is the pattern for collecting values without holding a controller per field.\n\n`autovalidateMode` decides when validation runs. `disabled` is the default on `Form`, and that default is right: validating an empty form before the user has typed anything is hostile. `onUserInteraction` is the humane middle ground — quiet until the user touches a field, then live.\n\nThe gotchas that bite in review. A `TextEditingController` holds native resources and **must** be disposed in `State.dispose`, and a controller constructed inside `build` is recreated every rebuild, so the field appears to reset itself as the user types. `TextFormField` asserts if you pass both `controller` and `initialValue` — pick one, because a controller already carries the initial text. And a `validator` runs on every validation pass, not once, so anything expensive or side-effecting inside it (a network check, a log) will fire far more often than you expect; asynchronous uniqueness checks belong in the submit path, not the validator.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Flutter: Build a form with validation", url: "https://docs.flutter.dev/cookbook/forms/validation", kind: "docs" },
        { label: "Flutter API: Form", url: "https://api.flutter.dev/flutter/widgets/Form-class.html", kind: "docs" },
        { label: "Flutter API: FormField", url: "https://api.flutter.dev/flutter/widgets/FormField-class.html", kind: "docs" },
        { label: "Flutter API: TextEditingController", url: "https://api.flutter.dev/flutter/widgets/TextEditingController-class.html", kind: "docs" },
      ],
      video: {
        title: "Flutter Tutorial - How To Use Form and TextFormField",
        channel: "HeyFlutter․com",
        url: "https://www.youtube.com/watch?v=2rn3XbBijy4",
        videoId: "2rn3XbBijy4",
        durationLabel: "11:18",
      },
      alternateVideos: [
        {
          title: "Flutter Tutorial - TextField - Deep Dive",
          channel: "HeyFlutter․com",
          url: "https://www.youtube.com/watch?v=C5hJIKCTrvk",
          videoId: "C5hJIKCTrvk",
          durationLabel: "23:50",
        },
        {
          title: "The Ultimate Flutter Tutorial for Beginners - 2025 Full Course",
          channel: "Flutter Mapp",
          url: "https://www.youtube.com/watch?v=3kaGC_DrUnw",
          videoId: "3kaGC_DrUnw",
          startSeconds: 5912,
          chapterLabel: "TextField",
          durationLabel: "5:16:54",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-forms-q1",
          prompt: "What does a `TextFormField` validator return for a valid value?",
          options: ["`null`", "`true`", "An empty string", "The validated value"],
          correctIndex: 0,
          explanation:
            "Returning `null` means \"no error\"; any string is treated as the error message and displayed under the field. Returning an empty string reserves the error space without showing text, which is occasionally useful and usually a bug.",
        },
        {
          id: "flutter-forms-q2",
          prompt: "What happens with this widget?\n\n```dart\n@override\nWidget build(BuildContext context) {\n  final controller = TextEditingController();\n  return TextField(controller: controller);\n}\n```",
          options: [
            "A fresh controller is created on every rebuild, so the field appears to clear itself, and every controller leaks because none is disposed",
            "It works; the controller is garbage-collected between builds",
            "It throws immediately, because controllers cannot be created in `build`",
            "The text persists, because the field's element is reused",
          ],
          correctIndex: 0,
          explanation:
            "Controllers are mutable state and belong in `State`, created in `initState` and released in `dispose`. This is the exact analogue of creating a ref inside a React render.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-forms-q3",
          prompt: "What does this produce?\n\n```dart\nTextFormField(\n  controller: _emailController,\n  initialValue: 'a@b.com',\n)\n```",
          options: [
            "An assertion error — a controller already carries the initial text, so supplying both is contradictory",
            "The controller wins and `initialValue` is ignored",
            "`initialValue` wins on the first build, then the controller takes over",
            "The field shows `a@b.com` appended to the controller's text",
          ],
          correctIndex: 0,
          explanation:
            "`TextFormField` asserts `initialValue == null || controller == null`. Set the initial text as `TextEditingController(text: 'a@b.com')` instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-forms-q4",
          prompt: "Which of these are true about `Form` and `GlobalKey<FormState>`? (Select all that apply.)",
          options: [
            "`validate()` runs every descendant field's validator and returns whether all passed",
            "`validate()` also rebuilds the fields so error messages appear",
            "`save()` invokes every field's `onSaved` callback",
            "`Form` automatically submits to a URL when `validate()` returns true",
            "`reset()` restores each field to the value it had at the last `save()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`Form` has no notion of submission at all — that is entirely your code. `reset()` restores each field's `initialValue`, not the last saved value.",
        },
        {
          id: "flutter-forms-q5",
          prompt: "What is the default `autovalidateMode` on a `Form`, and why is it a sensible default?",
          options: [
            "`disabled` — showing \"required\" errors on an untouched empty form is hostile, so validation waits for an explicit `validate()`",
            "`always` — users should see constraints up front",
            "`onUserInteraction` — the middle ground is the default",
            "There is no default; it must be supplied",
          ],
          correctIndex: 0,
          explanation:
            "`disabled` puts you in control of when errors appear. `onUserInteraction` is the usual upgrade: quiet until a field is touched, live afterwards.",
        },
        {
          id: "flutter-forms-q6",
          prompt: "A validator makes an HTTP call to check whether a username is taken. What goes wrong?",
          options: [
            "Validators are synchronous and run on every validation pass, so the call cannot be awaited and fires far more often than intended",
            "It works, but the result is delivered one frame late",
            "The framework throws, because validators must be `async`",
            "The call runs once and the result is cached by `FormState`",
          ],
          correctIndex: 0,
          explanation:
            "A validator returns `String?`, not `Future<String?>`. Do the uniqueness check on submit (or debounced in `onChanged`), store the result in state, and have the validator read that stored result.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-forms-q7",
          prompt: "When is `onSaved` called on a `TextFormField`?",
          options: [
            "When `FormState.save()` is called, typically right after a successful `validate()`",
            "On every keystroke",
            "When the field loses focus",
            "Automatically when `validate()` returns true",
          ],
          correctIndex: 0,
          explanation:
            "`validate` and `save` are separate operations. The usual submit handler is `if (formKey.currentState!.validate()) { formKey.currentState!.save(); ... }`.",
        },
        {
          id: "flutter-forms-q8",
          prompt: "Why is a `GlobalKey<FormState>` an appropriate use of `GlobalKey`, when most uses are a smell?",
          options: [
            "The submit button is frequently outside the form's subtree, so there is no ancestor lookup or lifted state that reaches the form's state",
            "Because `Form` requires a key to be constructed at all",
            "Because `FormState` is a singleton and the key just names it",
            "Because global keys are cheap when the widget is stateless",
          ],
          correctIndex: 0,
          explanation:
            "It is the legitimate \"reach a sibling's state\" case. Note that `Form.of(context)` works when the caller *is* inside the form — use it when you can and the key when you can't.",
        },
        {
          id: "flutter-forms-q9",
          prompt: "What is the difference between `TextField` and `TextFormField`?",
          options: [
            "`TextFormField` wraps a `TextField` in a `FormField`, letting an enclosing `Form` validate, save and reset it as part of a group",
            "`TextFormField` supports validation; `TextField` cannot show errors at all",
            "`TextField` is stateless and `TextFormField` is stateful",
            "`TextFormField` is the Material version and `TextField` the Cupertino one",
          ],
          correctIndex: 0,
          explanation:
            "A plain `TextField` can absolutely show an error via `decoration.errorText` — you just manage it yourself. The form field adds group membership, not the ability to display errors.",
        },
        {
          id: "flutter-forms-q10",
          prompt: "A multi-field form needs the keyboard's \"next\" button to move focus to the following field. What supplies that?",
          options: [
            "`textInputAction: TextInputAction.next` plus an `onFieldSubmitted` that requests focus on the next `FocusNode`",
            "`autofocus: true` on every field",
            "Wrapping the fields in a `FocusScope` with `canRequestFocus: false`",
            "`keyboardType: TextInputType.multiline`",
          ],
          correctIndex: 0,
          explanation:
            "`textInputAction` changes the key's label and what the platform reports; moving focus is your handler's job. `FocusScope.of(context).nextFocus()` is the shorthand when the fields are in tree order.",
        },
      ],
    },
    {
      id: "flutter-theming",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Theming, Material 3 and Cupertino",
      summary:
        "A theme in Flutter is an `InheritedWidget` carrying a large immutable `ThemeData`, installed by `MaterialApp` and read by `Theme.of(context)`. Every Material widget you use already does that lookup, which is why setting `ThemeData` once changes buttons, dialogs and text across the app. Because it is an inherited dependency, changing the theme marks every widget that read it dirty — themes are cheap to read and not free to change.\n\nMaterial 3 is the default (`useMaterial3` is true), and its headline is `ColorScheme.fromSeed(seedColor: ...)`, which derives a complete, contrast-checked tonal palette from one colour. Reaching for `colorScheme.primary`, `onPrimary`, `surface` and `onSurface` instead of hard-coded hex values is what makes a dark theme a three-line change rather than a redesign. `themeMode` plus a `darkTheme` gives you the system-follows behaviour for free.\n\nFor design tokens Material does not model — a brand gradient, a custom spacing scale — the right tool is `ThemeExtension<T>`. It gets you typed access through `Theme.of(context).extension<MyTokens>()!` and, crucially, correct interpolation when the theme animates between light and dark. Stuffing custom values into a global constants file works right up to the first time you need them to differ per theme.\n\nMaterial versus Cupertino is a product decision, not a technical one. A single `MaterialApp` on both platforms is a legitimate, widely shipped choice — plenty of well-regarded apps look the same everywhere. If you want per-platform fidelity, `.adaptive` constructors (`Switch.adaptive`, `CircularProgressIndicator.adaptive`) swap the rendering per platform without branching, and `Theme.of(context).platform` lets you branch deliberately where it matters. What you should *not* do is scatter `Platform.isIOS` checks through widget code: it is untestable, it breaks on web and desktop, and `defaultTargetPlatform` (which the framework lets you override in tests) exists for exactly this.\n\nThe gotcha: `Theme.of(context)` inside the same `build` method that supplies `MaterialApp(theme: ...)` returns the *default* theme, not yours — the same wrong-context trap as `Scaffold.of`, and the same fix, a `Builder` or a separate widget.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Flutter: Use themes to share colors and font styles", url: "https://docs.flutter.dev/cookbook/design/themes", kind: "docs" },
        { label: "Flutter API: ThemeData", url: "https://api.flutter.dev/flutter/material/ThemeData-class.html", kind: "docs" },
        { label: "Flutter API: ColorScheme.fromSeed", url: "https://api.flutter.dev/flutter/material/ColorScheme/ColorScheme.fromSeed.html", kind: "docs" },
        { label: "Flutter: Platform adaptations", url: "https://docs.flutter.dev/ui/adaptive-responsive/platform-adaptations", kind: "article" },
      ],
      video: {
        title: "Material 3 from design to deployment",
        channel: "Flutter",
        url: "https://www.youtube.com/watch?v=7nrhTdS7dHg",
        videoId: "7nrhTdS7dHg",
        durationLabel: "16:10",
      },
      alternateVideos: [
        {
          title: "ThemeExtensions | Decoding Flutter",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=8-szcYzFVao",
          videoId: "8-szcYzFVao",
          durationLabel: "6:13",
        },
        {
          title: "Everything you don't know about building great native apps with Flutter",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=2z7U6GU7QwQ",
          videoId: "2z7U6GU7QwQ",
          startSeconds: 140,
          chapterLabel: "Decoupling design: Material & Cupertino evolution",
          durationLabel: "10:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-theming-q1",
          prompt: "What does `ColorScheme.fromSeed(seedColor: Colors.teal)` produce?",
          options: [
            "A full Material 3 tonal palette — primary, secondary, tertiary, surface and their `on` pairs — algorithmically derived from one colour with contrast in mind",
            "A scheme where every role is a shade of teal chosen by lightness alone",
            "Only the primary and `onPrimary` colours; the rest stay at defaults",
            "A palette sampled from the app's launcher icon",
          ],
          correctIndex: 0,
          explanation:
            "The point of the seed is that one input yields a coherent, accessible set of roles. Using those roles rather than literal colours is what makes `darkTheme` almost free.",
        },
        {
          id: "flutter-theming-q2",
          prompt: "What theme does `Theme.of(context)` return here?\n\n```dart\n@override\nWidget build(BuildContext context) {\n  return MaterialApp(\n    theme: ThemeData(colorSchemeSeed: Colors.purple),\n    home: Scaffold(\n      backgroundColor: Theme.of(context).colorScheme.surface,\n    ),\n  );\n}\n```",
          options: [
            "The default theme — this `context` is above the `MaterialApp` that installs the purple one",
            "The purple theme, because `MaterialApp` installs it before `home` is built",
            "Null, causing a runtime error",
            "The purple theme, but only after the first frame",
          ],
          correctIndex: 0,
          explanation:
            "Exactly the same wrong-context trap as `Scaffold.of`. `Theme.of` walks up from the context you give it, and the app's theme lives below this one. Wrap `home`'s content in a `Builder` or extract it into its own widget.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-theming-q3",
          prompt: "Why is `ThemeExtension<T>` preferable to a global constants file for brand tokens?",
          options: [
            "It is scoped to the theme, so values can differ between light and dark, and it interpolates correctly while the theme animates",
            "It is faster to read, because it avoids the inherited-widget lookup",
            "It is the only way to define custom colours in Material 3",
            "It allows tokens to be changed at runtime without a rebuild",
          ],
          correctIndex: 0,
          explanation:
            "A constants file has one value per token, full stop. An extension has one per theme and implements `lerp`, which is why a theme transition does not snap.",
        },
        {
          id: "flutter-theming-q4",
          prompt: "Which of these give per-platform fidelity without scattering `Platform.isIOS` through widget code? (Select all that apply.)",
          options: [
            "`.adaptive` constructors such as `Switch.adaptive` and `CircularProgressIndicator.adaptive`",
            "Branching on `Theme.of(context).platform`",
            "Branching on `defaultTargetPlatform`, which tests can override",
            "Checking `dart:io`'s `Platform.isIOS` inside `build`",
            "Setting `useMaterial3: false` on iOS",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`dart:io`'s `Platform` does not exist on web and cannot be faked in tests. `defaultTargetPlatform` and `Theme.of(context).platform` are both overridable, which is what makes platform-specific behaviour testable.",
        },
        {
          id: "flutter-theming-q5",
          prompt: "Changing `themeMode` from light to dark rebuilds which widgets?",
          options: [
            "Every widget that registered a dependency by calling `Theme.of(context)`, directly or through a Material widget",
            "Only the `MaterialApp`, which repaints its descendants",
            "The entire tree, unconditionally",
            "None until the next navigation, when routes are rebuilt",
          ],
          correctIndex: 0,
          explanation:
            "It is ordinary inherited-widget invalidation. In practice that is most of the Material widgets on screen, which is fine for a user-initiated theme switch and would not be fine on a per-frame value.",
        },
        {
          id: "flutter-theming-q6",
          prompt: "You want the system's light/dark setting to drive the app. What do you supply to `MaterialApp`?",
          options: [
            "`theme`, `darkTheme`, and `themeMode: ThemeMode.system`",
            "`theme` only, and Flutter derives the dark variant",
            "`darkTheme` only, and Flutter derives the light variant",
            "A `MediaQuery` listener that swaps `theme` on change",
          ],
          correctIndex: 0,
          explanation:
            "`ThemeMode.system` is also the default when `darkTheme` is provided. Flutter never derives one theme from the other — a seeded `ColorScheme.fromSeed(..., brightness: Brightness.dark)` is how you get close to free.",
        },
        {
          id: "flutter-theming-q7",
          prompt: "A colleague hard-codes `Color(0xFF1B1F27)` for text throughout the app, then adds a dark theme. What breaks, and what is the fix?",
          options: [
            "The text stays dark on a dark surface and becomes unreadable; use `colorScheme.onSurface` so the role resolves per theme",
            "Nothing — Flutter inverts hard-coded colours in dark mode",
            "Only the `AppBar` breaks, because it has its own colour slot",
            "The app throws, because literal colours are disallowed in Material 3",
          ],
          correctIndex: 0,
          explanation:
            "Material 3's whole value proposition is semantic roles. `onSurface` means \"whatever is readable on the current surface\", and that is what changes between themes.",
        },
        {
          id: "flutter-theming-q8",
          prompt: "What does `Theme.of(context).brightness` tell you that `MediaQuery.platformBrightnessOf(context)` does not?",
          options: [
            "The brightness of the theme actually in effect here, which may differ from the OS setting if the user chose a theme in-app or a subtree overrides it",
            "Nothing — they are aliases",
            "The brightness of the device's display hardware",
            "Whether the app is running in profile mode",
          ],
          correctIndex: 0,
          explanation:
            "`platformBrightnessOf` reports the OS preference; the theme reports what is actually being rendered. Use the theme's value for styling decisions, and the platform's only when you are deciding what the theme should be.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-theming-q9",
          prompt: "What is the cost of styling one screen differently with a nested `Theme` widget?",
          options: [
            "Descendants that depend on the theme rebuild when it changes, and the override applies only to that subtree — which is exactly what you want",
            "It replaces the app-wide theme globally until popped",
            "It forces a full repaint of the app on every frame",
            "It is disallowed; only `MaterialApp` may install a theme",
          ],
          correctIndex: 0,
          explanation:
            "`Theme` is just an inherited widget, so nesting one scopes the override to its subtree. `Theme(data: Theme.of(context).copyWith(...))` is the idiom that inherits everything else.",
        },
        {
          id: "flutter-theming-q10",
          prompt: "Is shipping one Material design on both iOS and Android a defensible choice?",
          options: [
            "Yes — a consistent brand identity across platforms is a legitimate product decision, and adaptive constructors let you match native behaviour selectively where it matters most",
            "No — Apple rejects apps that do not use Cupertino widgets",
            "No — Material widgets do not render correctly on iOS",
            "Only for internal apps that are not published to a store",
          ],
          correctIndex: 0,
          explanation:
            "This is a design call, not a constraint. The things genuinely worth adapting are interaction-level — scroll physics, back gestures, date pickers, text selection handles — and several of those Flutter already adapts for you.",
        },
      ],
    },
    {
      id: "flutter-animations",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Animations: Implicit, Explicit and AnimatedBuilder",
      summary:
        "Flutter splits animation into two families, and picking the wrong one is the main source of animation code that is three times longer than it needs to be.\n\n**Implicit** animations are the `Animated*` widgets — `AnimatedContainer`, `AnimatedOpacity`, `AnimatedAlign`, `AnimatedSwitcher`. You rebuild with a new target value and a `duration`, and the widget interpolates from wherever it currently is. There is no controller, nothing to dispose, and no lifecycle to manage. If the animation is \"this property should ease to its new value when state changes\", this is the answer and you should not be writing a controller.\n\n**Explicit** animations are for anything you need to drive, repeat, reverse, chain or interrupt. An `AnimationController` is a `Ticker` that emits a value from 0 to 1 on every frame; it needs a `TickerProvider` (`SingleTickerProviderStateMixin` on your `State`) and it **must** be disposed. A `Tween` is a stateless mapping from that 0..1 to your value range; `controller.drive(tween)` or `tween.animate(controller)` composes them, and `CurvedAnimation` applies the easing.\n\n`AnimatedBuilder` is where the performance lives. Its `builder` runs on every single tick — sixty or a hundred and twenty times a second — so anything inside it is rebuilt at that rate. The `child` parameter exists precisely to escape that: a widget passed as `child` is built **once**, handed to the builder as an argument, and simply re-inserted each tick. The documented anti-pattern is putting a subtree that does not depend on the animation inside the builder body, and it is the single most common cause of animation jank in application code.\n\nTwo gotchas. An `AnimatedContainer` does not animate on its first build — there is no previous value to interpolate from, so the first frame is a jump. And a ticker keeps firing while its widget is off-screen unless something mutes it; `TickerMode` (which route transitions use) is what stops an animation on an inactive route from burning frames.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Flutter: Introduction to animations", url: "https://docs.flutter.dev/ui/animations", kind: "docs" },
        { label: "Flutter API: AnimatedBuilder", url: "https://api.flutter.dev/flutter/widgets/AnimatedBuilder-class.html", kind: "docs" },
        { label: "Flutter API: AnimationController", url: "https://api.flutter.dev/flutter/animation/AnimationController-class.html", kind: "docs" },
        { label: "Flutter: Animations tutorial", url: "https://docs.flutter.dev/ui/animations/tutorial", kind: "article" },
      ],
      video: {
        title: "Creating custom explicit animations with AnimatedBuilder & AnimatedWidget - Flutter in Focus",
        channel: "Flutter",
        url: "https://www.youtube.com/watch?v=fneC7t4R_B0",
        videoId: "fneC7t4R_B0",
        durationLabel: "5:37",
      },
      alternateVideos: [
        {
          title: "Animation Basics with Implicit Animations",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=IVTjpW3W33s",
          videoId: "IVTjpW3W33s",
          durationLabel: "4:11",
        },
        {
          title: "Making Your First Directional Animations with Built-in Explicit Animations",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=CunyH6unILQ",
          videoId: "CunyH6unILQ",
          durationLabel: "6:34",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-animations-q1",
          prompt: "A card should fade its background colour whenever a `bool` in state flips. Which approach is right?",
          options: [
            "`AnimatedContainer` with a `duration` — rebuild with the new colour and let it interpolate",
            "An `AnimationController` plus a `ColorTween` driven from `didUpdateWidget`",
            "A `StreamBuilder` over a timer emitting intermediate colours",
            "`setState` in a loop with `Future.delayed`",
          ],
          correctIndex: 0,
          explanation:
            "This is the textbook implicit case: one property, one target, no need to reverse or interrupt. A controller here is four times the code for the same result.",
        },
        {
          id: "flutter-animations-q2",
          prompt: "How many times does the `builder` run per second here, and what is the problem?\n\n```dart\nAnimatedBuilder(\n  animation: _controller,\n  builder: (context, _) => Transform.rotate(\n    angle: _controller.value * 6.28,\n    child: ExpensiveChart(data: widget.data),\n  ),\n)\n```",
          options: [
            "Once per frame, and `ExpensiveChart` — which does not depend on the animation — is rebuilt every single tick",
            "Once per animation, because the controller only notifies on completion",
            "Twice per frame, once for layout and once for paint",
            "Once per second, matching the controller's default duration",
          ],
          correctIndex: 0,
          explanation:
            "Pass `ExpensiveChart` as the `child` argument and use the builder's second parameter. It is then built once and merely re-parented each tick — the documented fix and a large, measurable win.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-animations-q3",
          prompt: "What is an `AnimationController` without a `vsync`?",
          options: [
            "Impossible — it requires a `TickerProvider`, usually via `SingleTickerProviderStateMixin`, so its ticker can be bound to the frame callback",
            "Valid; `vsync` only controls whether the animation is frame-locked",
            "Valid, but it runs on a background isolate",
            "Valid only for durations under one second",
          ],
          correctIndex: 0,
          explanation:
            "The ticker is the link to the scheduler's frame callbacks, and binding it to a `State` is also what lets the framework mute it when the widget's route is inactive.",
        },
        {
          id: "flutter-animations-q4",
          prompt: "Which of these must happen for an explicit animation not to leak? (Select all that apply.)",
          options: [
            "`_controller.dispose()` in `State.dispose`",
            "The `State` mixes in `SingleTickerProviderStateMixin` (or `TickerProviderStateMixin` for several controllers)",
            "Listeners added with `addListener` are removed, or the controller that owns them is disposed",
            "The `Tween` is disposed alongside the controller",
            "`setState` is called once after the animation completes",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A `Tween` is a stateless pure mapping — there is nothing to dispose. Failing to dispose a controller is caught in debug with a \"ticker was disposed without being stopped\" style assertion.",
        },
        {
          id: "flutter-animations-q5",
          prompt: "What does an `AnimatedContainer` do on its very first build?",
          options: [
            "Renders at the target value immediately — there is no previous value to interpolate from, so nothing animates",
            "Animates from zero to the target over the given duration",
            "Throws, because it requires an initial value",
            "Waits one duration and then appears",
          ],
          correctIndex: 0,
          explanation:
            "Implicit animations interpolate between the old widget's values and the new one's. On the first build there is no old widget — which is why an entrance animation needs an explicit controller or a deliberate two-phase state change.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-animations-q6",
          prompt: "What is the role of `Tween` versus `CurvedAnimation`?",
          options: [
            "`Tween` maps the controller's 0..1 onto a value range; `CurvedAnimation` reshapes the 0..1 progression itself with an easing curve",
            "`Tween` applies easing and `CurvedAnimation` maps ranges",
            "They are interchangeable ways of writing the same mapping",
            "`Tween` is for colours and `CurvedAnimation` is for numbers",
          ],
          correctIndex: 0,
          explanation:
            "They compose: curve the controller first, then drive a tween with the curved animation. Getting them the wrong way round produces an animation that eases the wrong quantity.",
        },
        {
          id: "flutter-animations-q7",
          prompt: "An infinite `repeat()` animation runs on a screen the user has navigated away from. What stops it from burning frames?",
          options: [
            "`TickerMode`, which route transitions install — it mutes tickers in subtrees that are not active",
            "Nothing; you must call `stop()` in `deactivate`",
            "The engine throttles all animations when the app loses focus",
            "The controller pauses automatically once its widget is no longer painted",
          ],
          correctIndex: 0,
          explanation:
            "Because the ticker is bound to a `State` through the vsync provider, the framework can mute it when the enclosing `TickerMode` is disabled. This only works if you used a proper `TickerProvider` rather than a raw `Ticker`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-animations-q8",
          prompt: "You need two widgets to cross-fade whenever the displayed item changes. What is the least code?",
          options: [
            "`AnimatedSwitcher`, giving each child a distinct key so it can tell that the content changed",
            "Two `AnimatedOpacity` widgets in a `Stack`, toggled together",
            "An `AnimationController` with two `FadeTransition`s",
            "A `Hero` widget with a shared tag",
          ],
          correctIndex: 0,
          explanation:
            "`AnimatedSwitcher` handles the outgoing and incoming children for you — but it detects the change by key, so two `Text` widgets with different strings and no keys will not animate.",
        },
        {
          id: "flutter-animations-q9",
          prompt: "What is the difference between `FadeTransition` and `AnimatedOpacity`?",
          options: [
            "`FadeTransition` is driven by an `Animation` you supply (explicit); `AnimatedOpacity` interpolates automatically when its `opacity` argument changes (implicit)",
            "`FadeTransition` is more performant because it avoids a layer",
            "`AnimatedOpacity` works only on images",
            "`FadeTransition` animates colour and `AnimatedOpacity` animates alpha",
          ],
          correctIndex: 0,
          explanation:
            "The `*Transition` family is the explicit counterpart of the `Animated*` family throughout the framework. Both end up doing the same painting work.",
        },
        {
          id: "flutter-animations-q10",
          prompt: "The performance docs advise against the `Opacity` widget in animations. Why, and what should you use?",
          options: [
            "Animating `Opacity` can force an expensive offscreen buffer every frame; `AnimatedOpacity` or `FadeInImage` apply the fade more cheaply",
            "`Opacity` is deprecated and slated for removal",
            "`Opacity` does not repaint, so the animation appears frozen",
            "`Opacity` only works in debug builds",
          ],
          correctIndex: 0,
          explanation:
            "Compositing a partially transparent layer can require `saveLayer`, which allocates an offscreen buffer and forces a render-target switch. Drawing with a semi-transparent colour, where the shapes do not overlap, is cheaper still.",
        },
      ],
    },
    {
      id: "flutter-platform-channels",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Platform Channels and Native Interop",
      summary:
        "Everything the Dart side cannot do itself — reading a Bluetooth characteristic, presenting a native share sheet, talking to a vendor SDK — crosses a **platform channel**. A `MethodChannel` has a name, a codec and two ends: Dart invokes a named method with arguments, the platform side handles it and returns a result. It is asynchronous in both directions and always yields a `Future` on the Dart side, because the call hops to the platform thread and back.\n\nThe codec is the part people underestimate. `StandardMessageCodec` serialises a fixed set of types — null, bool, int, double, String, byte and number lists, plus `List` and `Map` of those. Your Kotlin data class is not on that list. Every argument and every result must be flattened into maps and primitives at one end and reconstructed at the other, by hand, with no compiler checking either side. Channel names are global strings within the app, which is why the convention is to namespace them (`com.oyelabs.app/battery`), and a typo produces a `MissingPluginException` at runtime rather than a build failure.\n\nThat stringly-typed hand-serialisation is exactly what **Pigeon** removes. You write a Dart file describing the interface, run the generator, and get type-safe Dart, Kotlin/Java and Swift/Objective-C bindings with the serialisation written for you. For new interop work this is the default recommendation, and it turns a whole class of runtime failures into compile errors. Beyond it sit the direct-binding generators — FFI for C libraries, and JNI/Swift binding generators for platform SDKs — which skip the channel entirely and are synchronous, at the cost of much sharper edges around threading and memory.\n\nTwo more things to know. `EventChannel` is the streaming counterpart, for a continuous feed such as sensor readings, and it maps to a Dart `Stream`. And embedding an actual native view — a map, a webview — is `PlatformView`, not a channel: it composites an OS-drawn view into Flutter's scene, and that is the one interop mechanism with a real, ongoing per-frame cost.\n\nThe gotcha: calling a channel before the bindings exist throws. Anything touching a channel before `runApp` needs `WidgetsFlutterBinding.ensureInitialized()` first.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Flutter: Writing custom platform-specific code", url: "https://docs.flutter.dev/platform-integration/platform-channels", kind: "docs" },
        { label: "pub.dev: pigeon", url: "https://pub.dev/packages/pigeon", kind: "docs" },
        { label: "Flutter: Hosting native Android views", url: "https://docs.flutter.dev/platform-integration/android/platform-views", kind: "article" },
      ],
      video: {
        title: "Flutter Tutorial - How To Call Android Native Code | 1/2 Java & Kotlin Platform Specific Code",
        channel: "HeyFlutter․com",
        url: "https://www.youtube.com/watch?v=j0cy_Z6IG_c",
        videoId: "j0cy_Z6IG_c",
        durationLabel: "6:35",
      },
      alternateVideos: [
        {
          title: "Everything you don't know about building great native apps with Flutter",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=2z7U6GU7QwQ",
          videoId: "2z7U6GU7QwQ",
          startSeconds: 497,
          chapterLabel: "Native interop solutions: JNI, NIGen, FFIGen, and SwiftGen",
          durationLabel: "10:03",
        },
        {
          title: "Flutter Tutorial - Generate Android Native Code Using PIGEON",
          channel: "HeyFlutter․com",
          url: "https://www.youtube.com/watch?v=ul4o3O6Kxu0",
          videoId: "ul4o3O6Kxu0",
          durationLabel: "8:37",
        },
        {
          title: "Flutter Tutorial - How To Call iOS Native Code | Swift Platform Specific Code",
          channel: "HeyFlutter․com",
          url: "https://www.youtube.com/watch?v=EHQTdB2qenU",
          videoId: "EHQTdB2qenU",
          durationLabel: "4:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-platform-channels-q1",
          prompt: "A `MethodChannel.invokeMethod` call returns a `Future` even when the native implementation is instantaneous. Why?",
          options: [
            "The call is serialised and dispatched to the platform thread, so the result cannot be available in the same synchronous turn",
            "Because Dart requires all channel APIs to be `async` by language rule",
            "Because the codec runs on a background isolate",
            "Because the result is cached and returned on the next frame",
          ],
          correctIndex: 0,
          explanation:
            "Channels are message passing across a thread boundary. If you genuinely need synchronous access to native code, FFI — not a channel — is the mechanism.",
        },
        {
          id: "flutter-platform-channels-q2",
          prompt: "Which of these can `StandardMessageCodec` carry across a `MethodChannel`? (Select all that apply.)",
          options: [
            "A `Map<String, dynamic>` of primitives",
            "A `Uint8List` of image bytes",
            "A `List<String>`",
            "An instance of your Dart `User` class",
            "A Dart `Function` callback the native side can invoke",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The codec handles a fixed set of primitives and collections of them. Custom objects must be flattened to maps by hand — the hand-written boilerplate that Pigeon exists to generate — and a function reference cannot cross at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-platform-channels-q3",
          prompt: "A release build throws `MissingPluginException(No implementation found for method getBattery on channel battery)`. What are the likely causes?",
          options: [
            "The channel name does not match on the two sides, or the native handler was never registered for this platform",
            "The codec version is mismatched between Dart and Kotlin",
            "The method was called before the first frame rendered",
            "The plugin needs to be added to `pubspec.yaml` under `dev_dependencies`",
          ],
          correctIndex: 0,
          explanation:
            "Channel names are plain strings matched at runtime, so a typo or a handler registered on Android but not iOS both surface this way. It is the cost of the stringly-typed design and the main thing Pigeon eliminates.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-platform-channels-q4",
          prompt: "What does Pigeon generate, and what problem does it solve?",
          options: [
            "Type-safe Dart, Kotlin/Java and Swift/Objective-C bindings from one Dart interface definition, removing hand-written serialisation and stringly-typed channel names",
            "Native UI widgets that match the platform look, generated from Flutter widgets",
            "A mock native layer so channels can be unit tested",
            "Platform-specific build configuration for Gradle and Xcode",
          ],
          correctIndex: 0,
          explanation:
            "It turns a runtime contract into a compile-time one on both sides. For new interop work it is the current recommendation rather than hand-rolled `MethodChannel` code.",
        },
        {
          id: "flutter-platform-channels-q5",
          prompt: "You need a continuous feed of accelerometer readings from the platform. Which channel type?",
          options: [
            "`EventChannel`, which exposes the native feed as a Dart `Stream`",
            "`MethodChannel`, polled on a `Timer.periodic`",
            "`BasicMessageChannel` with a custom codec",
            "FFI, since sensors are C APIs",
          ],
          correctIndex: 0,
          explanation:
            "`EventChannel` is designed for exactly this: the platform side pushes events and the Dart side gets a stream. Polling a method channel works and wastes both battery and frames.",
        },
        {
          id: "flutter-platform-channels-q6",
          prompt: "Code in `main()` calls a plugin before `runApp`. It throws. What is missing?",
          options: [
            "`WidgetsFlutterBinding.ensureInitialized()` before the plugin call",
            "An `await` on `runApp`",
            "Registration of the channel in `AndroidManifest.xml`",
            "A `try`/`catch` around the plugin call",
          ],
          correctIndex: 0,
          explanation:
            "The binding sets up the messenger that channels talk through, and `runApp` normally does it for you. Anything that runs earlier — reading shared preferences, initialising Firebase — must initialise it explicitly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-platform-channels-q7",
          prompt: "How does FFI differ from a platform channel?",
          options: [
            "FFI calls into a native library directly and synchronously with no serialisation, but gives you no help with threading or memory safety",
            "FFI is the asynchronous option and channels are synchronous",
            "FFI only works on Android",
            "FFI serialises through the same `StandardMessageCodec`",
          ],
          correctIndex: 0,
          explanation:
            "No message hop and no codec means it is much faster for chatty, data-heavy work with a C library. It also means a mistake is a segfault rather than an exception, and a long call blocks the calling isolate.",
        },
        {
          id: "flutter-platform-channels-q8",
          prompt: "Which of these needs a platform channel or plugin rather than pure Dart?",
          options: [
            "Presenting the operating system's native share sheet",
            "Parsing JSON from an HTTP response",
            "Computing an SHA-256 hash",
            "Persisting a value to a file in the app's documents directory using `dart:io`",
          ],
          correctIndex: 0,
          explanation:
            "Networking, crypto and file I/O all have pure-Dart or `dart:io` implementations. Anything that invokes an OS-level UI or a vendor SDK has to cross the boundary.",
        },
        {
          id: "flutter-platform-channels-q9",
          prompt: "A screen embeds a native map view. Why is this different in kind from a method channel call?",
          options: [
            "It is a `PlatformView`: an OS-drawn view composited into Flutter's scene, with a per-frame cost rather than a per-call cost",
            "It uses a faster binary codec optimised for pixels",
            "It runs the map on a separate isolate",
            "It is the same mechanism; only the arguments differ",
          ],
          correctIndex: 0,
          explanation:
            "A channel call is a discrete message. A platform view means the engine must interleave someone else's rendering with its own on every frame, which is why the advice is to use one deliberately rather than casually.",
        },
        {
          id: "flutter-platform-channels-q10",
          prompt: "How would you unit test Dart code that calls a `MethodChannel`, without a device?",
          options: [
            "Install a mock handler for that channel in the test binding, so `invokeMethod` returns canned results",
            "You cannot; channel code requires an integration test on a real device",
            "Replace the channel with an FFI stub at build time",
            "Run the test in profile mode so the channel short-circuits",
          ],
          correctIndex: 0,
          explanation:
            "The test binding lets you register a fake handler for a named channel, which is exactly why hiding channel calls behind a narrow interface pays off — the rest of your code then needs no mocking at all.",
        },
      ],
    },
    {
      id: "flutter-testing",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Widget Tests and Golden Tests",
      summary:
        "Widget tests are Flutter's best-value test tier by a wide margin. They run headless on the Dart VM with no device and no emulator, in milliseconds, against a real widget tree with real layout and real gesture dispatch. `testWidgets` gives you a `WidgetTester`: `pumpWidget` mounts a tree, `tap`/`drag`/`enterText` drive it, and finders (`find.text`, `find.byType`, `find.byKey`) locate widgets to assert on. A test suite of a few hundred of these runs faster than a single integration test launches.\n\nThe mental model that avoids most confusion is that **time does not pass unless you advance it.** `pump()` renders exactly one frame. `pump(Duration(milliseconds: 300))` advances the fake clock and renders one frame at that point. `pumpAndSettle()` keeps pumping until no frames are scheduled — which is why it hangs and then times out on an indefinitely repeating animation or a permanently spinning progress indicator. Reaching for `pumpAndSettle` reflexively and then debugging the timeout is a rite of passage.\n\nThe environment is deliberately minimal: a fixed logical test surface, no platform plugins unless you mock their channels, and no network. Network images fail by design; an `Image.network` in the tree under test needs a mock HTTP layer or a fake image provider. That constraint is a feature — it makes tests deterministic — but it does mean a component with an implicit dependency on the outside world is harder to test, which is a useful design signal.\n\n**Golden tests** (`matchesGoldenFile`) render a widget and compare it byte-for-byte with a stored PNG, regenerated with `flutter test --update-goldens`. They catch visual regressions nothing else does, and they are brittle in a specific way: the docs warn that fonts render differently across operating systems and across Flutter versions, so a golden generated on Windows will not match one produced elsewhere. The default test font is Ahem, which renders every glyph as a box unless you explicitly load real fonts. Golden tests therefore need a pinned platform and a pinned Flutter version in CI, and they are best scoped to individual components rather than whole screens — a full-screen golden fails for every unrelated change and gets regenerated without being read, which is worse than having no test at all.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Flutter: Testing Flutter apps", url: "https://docs.flutter.dev/testing/overview", kind: "docs" },
        { label: "Flutter: An introduction to widget testing", url: "https://docs.flutter.dev/cookbook/testing/widget/introduction", kind: "docs" },
        { label: "Flutter API: matchesGoldenFile", url: "https://api.flutter.dev/flutter/flutter_test/matchesGoldenFile.html", kind: "docs" },
        { label: "Flutter API: WidgetTester", url: "https://api.flutter.dev/flutter/flutter_test/WidgetTester-class.html", kind: "docs" },
      ],
      video: {
        title: "UI tests #DecodingFlutter",
        channel: "Flutter",
        url: "https://www.youtube.com/watch?v=vka33yBz5e4",
        videoId: "vka33yBz5e4",
        durationLabel: "6:15",
      },
      alternateVideos: [
        {
          title: "Widget Testing with Flutter",
          channel: "Tadas Petra",
          url: "https://www.youtube.com/watch?v=7N1qRivtCWI",
          videoId: "7N1qRivtCWI",
          durationLabel: "8:16",
        },
        {
          title: "How to make premium Golden tests | FluterVikings 2022",
          channel: "Flutter Community",
          url: "https://www.youtube.com/watch?v=TT22JBKyhXw",
          videoId: "TT22JBKyhXw",
          durationLabel: "9:31",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-testing-q1",
          prompt: "What is the difference between `tester.pump()` and `tester.pumpAndSettle()`?",
          options: [
            "`pump` renders exactly one frame; `pumpAndSettle` repeatedly pumps until no further frames are scheduled",
            "`pump` is synchronous and `pumpAndSettle` is asynchronous",
            "`pump` rebuilds and `pumpAndSettle` also lays out and paints",
            "`pump` is for stateless widgets and `pumpAndSettle` for stateful ones",
          ],
          correctIndex: 0,
          explanation:
            "Time in a widget test is entirely under your control. `pumpAndSettle` is a convenience for \"run the animation to completion\", and it is the wrong tool whenever something never settles.",
        },
        {
          id: "flutter-testing-q2",
          prompt: "A test calls `await tester.pumpAndSettle()` on a screen containing a `CircularProgressIndicator` with no value. What happens?",
          options: [
            "The test times out, because the indeterminate indicator schedules frames forever and the tree never settles",
            "It returns immediately, because a progress indicator is not an animation",
            "It pumps exactly one frame and returns",
            "It throws a `FlutterError` about an unbounded animation",
          ],
          correctIndex: 0,
          explanation:
            "An indeterminate spinner repeats indefinitely by design. Use a fixed `pump(Duration(...))` instead, or assert on the loading state before the data arrives.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-testing-q3",
          prompt: "Which of these can a widget test do? (Select all that apply.)",
          options: [
            "Tap a button and assert that the resulting text appears",
            "Enter text into a `TextField` and assert on the controller's value",
            "Assert on layout, such as a widget's rendered size",
            "Interact with a native permission dialog",
            "Verify that a real HTTP request reached a staging server",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Widget tests run a genuine widget tree with genuine layout, so all three of those work. Native platform UI and real network calls are outside the test environment by design — that is what integration tests and tools like `patrol` are for.",
        },
        {
          id: "flutter-testing-q4",
          prompt: "A golden test passes on a developer's Mac and fails in CI on Linux with a tiny pixel difference in the text. Why?",
          options: [
            "Font rasterisation differs across operating systems and Flutter versions, which the docs call out explicitly",
            "The CI machine has a different screen resolution",
            "Goldens are stored per-branch and CI checked out a stale one",
            "Linux does not support `matchesGoldenFile`",
          ],
          correctIndex: 0,
          explanation:
            "The comparison is byte-for-byte on rendered pixels. Golden tests need a pinned OS and Flutter version — usually a container image — or they will produce noise forever.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-testing-q5",
          prompt: "A newly written golden test produces an image where all the text is rectangles. What happened?",
          options: [
            "The test environment uses the Ahem font by default; real fonts have to be loaded explicitly with a `FontLoader`",
            "The golden was generated before the widget finished laying out",
            "The text colour matched the background",
            "`matchesGoldenFile` renders text as boxes to keep goldens locale-independent",
          ],
          correctIndex: 0,
          explanation:
            "Ahem draws every glyph as a filled box, which makes layout-only goldens deterministic. If you want to see real glyphs you must load the font family into the test binding.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-testing-q6",
          prompt: "How are golden files created or refreshed?",
          options: [
            "`flutter test --update-goldens`",
            "`flutter test --golden`",
            "By deleting the file, which regenerates it on the next run",
            "`flutter build goldens`",
          ],
          correctIndex: 0,
          explanation:
            "The same flag creates them the first time and overwrites them later. The danger is that regenerating is so easy it becomes reflexive — review the diff, or the test is decorative.",
        },
        {
          id: "flutter-testing-q7",
          prompt: "A widget under test renders `Image.network('https://…/avatar.png')`. What happens in a widget test?",
          options: [
            "The image request fails, because the test environment has no real HTTP client by default; use a fake image provider or mock the HTTP layer",
            "The image loads normally if CI has network access",
            "The test hangs until the request times out",
            "The image renders as a grey placeholder automatically",
          ],
          correctIndex: 0,
          explanation:
            "Determinism is the point — a test that depends on the network is a test that fails randomly. The usual pattern is injecting the image provider, which is also better design.",
        },
        {
          id: "flutter-testing-q8",
          prompt: "Which finder is the most robust against refactoring?",
          options: [
            "`find.byKey(const ValueKey('submit-button'))`",
            "`find.byType(ElevatedButton)` in a screen with several buttons",
            "`find.text('Submit')`, in an app with localisation",
            "`find.byWidgetPredicate` matching on padding values",
          ],
          correctIndex: 0,
          explanation:
            "An explicit key states intent and survives a change of widget type or copy. Finding by visible text breaks the moment the string is translated or reworded; finding by type breaks when a second button is added.",
        },
        {
          id: "flutter-testing-q9",
          prompt: "Where does each kind of test earn its place, according to the testing guidance?",
          options: [
            "Many fast unit tests for logic, a substantial layer of widget tests for UI behaviour, and a small number of integration tests for critical end-to-end flows",
            "Mostly integration tests, since they give the highest confidence",
            "Only widget tests, since they cover both logic and UI",
            "An equal number of each",
          ],
          correctIndex: 0,
          explanation:
            "The docs describe the usual trade: confidence rises and speed falls as you go up. Widget tests are unusually good value in Flutter because they are fast *and* exercise real layout.",
        },
        {
          id: "flutter-testing-q10",
          prompt: "What is the practical advice about golden-test scope?",
          options: [
            "Scope them to individual components; a whole-screen golden fails on every unrelated change and gets regenerated unread",
            "Prefer whole-screen goldens, since they catch the most regressions",
            "Generate one golden per supported device size for every screen",
            "Avoid them entirely; they never add value",
          ],
          correctIndex: 0,
          explanation:
            "A test that is always red is a test nobody reads. Component-level goldens keep the diff small enough that a reviewer can actually judge whether the change was intended.",
        },
      ],
    },
    {
      id: "flutter-devtools-performance",
      moduleId: "mobile-flutter",
      trackId: "mobile",
      title: "Profiling Performance with DevTools",
      summary:
        "Rule one: **profile in profile mode.** Debug builds run the Dart VM with JIT and every assertion enabled, so their timings are meaningless — an app that janks in debug and is smooth in release is the normal case, not a bug. `flutter run --profile` gives you AOT-compiled code with the instrumentation still attached.\n\nThe single most useful skill is reading the frame chart and deciding **which thread is slow**. Flutter splits work across the UI thread (Dart: your `build`, then layout and paint *instructions*) and the raster thread (the engine actually turning those instructions into pixels). A tall UI bar means you are doing too much in Dart — expensive work in `build`, rebuilding too large a subtree, parsing JSON on the main isolate. A tall raster bar means the *painting* is expensive — `saveLayer`, opacity, clipping, blurs, large images — and no amount of `const` will help. Getting this backwards and spending a day optimising rebuilds when the problem is a blur filter is the classic wasted afternoon.\n\nThe frame budget is about 16ms at 60Hz, and the guidance splits it evenly: roughly 8ms of UI work and 8ms of raster work. On a 120Hz display that halves, which is why devices that look smooth on a test phone jank on a flagship.\n\nThe Inspector is the other half of the tool. \"Track widget rebuilds\" shows rebuild counts per widget and is the fastest way to find a `setState` that is too high in the tree. \"Highlight repaints\" outlines layers as they repaint — if the whole screen flashes when one badge updates, you need a `RepaintBoundary`. Use that one sparingly, though: each boundary is an extra layer with memory and compositing cost, so blanket-wrapping is a regression, not a fix.\n\nWhat has changed: Impeller removed shader-compilation jank as a category, so the old shader warm-up and SkSL-caching workflow is gone from the docs. If a profiling guide tells you to capture and bundle shaders, it predates Impeller. The remaining big wins are unglamorous — lazy builders for long lists so only visible items are built, keeping expensive work out of `build`, avoiding `Opacity` in animations, and moving heavy computation to an isolate so it never touches the frame budget at all.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Flutter: Use the Performance view", url: "https://docs.flutter.dev/tools/devtools/performance", kind: "docs" },
        { label: "Flutter: Performance best practices", url: "https://docs.flutter.dev/perf/best-practices", kind: "docs" },
        { label: "Flutter: Improving rendering performance", url: "https://docs.flutter.dev/perf/rendering-performance", kind: "docs" },
        { label: "Flutter: Use the Flutter inspector", url: "https://docs.flutter.dev/tools/devtools/inspector", kind: "article" },
      ],
      video: {
        title: "Dive into DevTools",
        channel: "Flutter",
        url: "https://www.youtube.com/watch?v=_EYk-E29edo",
        videoId: "_EYk-E29edo",
        durationLabel: "14:26",
      },
      alternateVideos: [
        {
          title: "Debugging performance issues with the Flutter DevTools | Flutter Heroes 2024 Talk",
          channel: "Flutter Heroes",
          url: "https://www.youtube.com/watch?v=7i5YFxEZijo",
          videoId: "7i5YFxEZijo",
          durationLabel: "35:51",
        },
        {
          title: "Flutter performance tips - Flutter in Focus",
          channel: "Flutter",
          url: "https://www.youtube.com/watch?v=PKGguGUwSYE",
          videoId: "PKGguGUwSYE",
          durationLabel: "4:29",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "flutter-devtools-performance-q1",
          prompt: "Why must performance work be done in profile mode rather than debug mode?",
          options: [
            "Debug builds run with JIT compilation and assertions enabled, so their timings do not reflect the shipped app",
            "DevTools cannot attach to a debug build",
            "Debug builds disable Impeller",
            "Profile mode runs the app at a fixed 60fps, making measurement possible",
          ],
          correctIndex: 0,
          explanation:
            "Debug is routinely several times slower. Profile mode is AOT-compiled like release but keeps the tracing hooks — it is the only build worth measuring.",
        },
        {
          id: "flutter-devtools-performance-q2",
          prompt: "A frame shows 3ms of UI time and 22ms of raster time. Where is the problem?",
          options: [
            "In painting — look for `saveLayer`, opacity, clipping, blurs or very large images, not at rebuild counts",
            "In the `build` methods, which are clearly doing too much work",
            "In the platform channel, which is blocking the frame",
            "In garbage collection on the Dart heap",
          ],
          correctIndex: 0,
          explanation:
            "The UI thread produced its instructions in 3ms; the engine then spent 22ms rasterising them. Adding `const` or splitting widgets addresses the wrong thread entirely.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-devtools-performance-q3",
          prompt: "What is the frame budget the performance guidance gives for a 60Hz display?",
          options: [
            "About 16ms total, split roughly 8ms of UI work and 8ms of raster work",
            "About 16ms of UI work plus 16ms of raster work, since they run in parallel",
            "About 33ms total, matching the 30fps floor",
            "There is no fixed budget; the engine adapts to whatever the app produces",
          ],
          correctIndex: 0,
          explanation:
            "The two phases are pipelined but the whole frame must still fit in one refresh interval. On a 120Hz display the same guidance halves, which is why high-refresh devices expose jank that a 60Hz test device hides.",
        },
        {
          id: "flutter-devtools-performance-q4",
          prompt: "Which of these reduce UI-thread time? (Select all that apply.)",
          options: [
            "Moving `setState` down to the smallest widget that actually changes",
            "Using `ListView.builder` so only visible items are built",
            "Moving JSON parsing of a large payload onto an isolate",
            "Wrapping the screen in a `RepaintBoundary`",
            "Replacing `Opacity` with `AnimatedOpacity`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three all shrink the work Dart does per frame. `RepaintBoundary` and the opacity swap are raster-thread optimisations — real wins, just for the other bar in the chart.",
        },
        {
          id: "flutter-devtools-performance-q5",
          prompt: "\"Highlight repaints\" shows the entire screen outlined every time a small notification badge updates. What does that mean, and what is the fix?",
          options: [
            "The badge shares a layer with everything else; a `RepaintBoundary` around it lets it repaint independently",
            "The whole widget tree is rebuilding; add `const` constructors",
            "The display is refreshing at the wrong rate",
            "Impeller is disabled and falling back to full-surface repaints",
          ],
          correctIndex: 0,
          explanation:
            "Repaint boundaries partition the layer tree so a frequently changing region does not drag its neighbours along. Applied to everything, they cost memory and compositing time, so add them where the chart says to.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-devtools-performance-q6",
          prompt: "A profiling article recommends capturing SkSL shaders during a training run and bundling them with the app. What should you conclude?",
          options: [
            "It predates Impeller — that workflow existed to hide Skia's runtime shader compilation and is no longer part of the docs",
            "It is still the recommended way to eliminate first-run jank",
            "It applies only to Flutter web",
            "It is a Skia-only optimisation that Impeller also benefits from",
          ],
          correctIndex: 0,
          explanation:
            "Impeller precompiles its shaders at engine-build time, which is why the shader warm-up page no longer exists as a destination in the performance docs. Date-checking Flutter performance advice matters a lot.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "flutter-devtools-performance-q7",
          prompt: "What does the Inspector's rebuild-count tracking most directly help you find?",
          options: [
            "A `setState` or a theme dependency placed too high in the tree, causing widgets that never change to rebuild",
            "Which widgets allocate the most memory",
            "Which render objects trigger a `saveLayer`",
            "How long each `build` method takes to run",
          ],
          correctIndex: 0,
          explanation:
            "It answers \"what rebuilt, and how often\". Pairing a surprising rebuild count with the widget's position in the tree usually points straight at the offending state holder.",
        },
        {
          id: "flutter-devtools-performance-q8",
          prompt: "A list of 5,000 rows built with `Column(children: items.map(...).toList())` inside a `SingleChildScrollView` is slow to open. Why?",
          options: [
            "Every row is built and laid out at startup; `ListView.builder` builds only what is visible",
            "`SingleChildScrollView` disables the raster cache",
            "`Column` forces an intrinsic layout pass over all children",
            "The rows each get their own `RepaintBoundary`, exhausting layer memory",
          ],
          correctIndex: 0,
          explanation:
            "The docs are explicit that large lists should use the lazy builder constructors. A non-lazy `Column` materialises the whole list before the first frame.",
        },
        {
          id: "flutter-devtools-performance-q9",
          prompt: "An app's memory grows steadily as the user navigates between screens. What is the most likely cause in Flutter specifically?",
          options: [
            "`AnimationController`s, `TextEditingController`s, stream subscriptions or listeners not released in `dispose`",
            "Widget objects accumulating, since they are never garbage-collected",
            "The element tree retaining every route ever visited by design",
            "Impeller caching a texture for every screen rendered",
          ],
          correctIndex: 0,
          explanation:
            "Widgets are ordinary short-lived objects. The things that genuinely outlive their widget are the ones holding an external subscription — which is why `dispose` discipline is the first thing to audit.",
        },
        {
          id: "flutter-devtools-performance-q10",
          prompt: "Expensive image processing runs when a photo is picked, and the UI freezes for a second. What actually fixes it?",
          options: [
            "Move the work to a separate isolate with `Isolate.run`, so it never occupies the UI thread's frame budget",
            "Wrap the call in `Future` so it runs asynchronously",
            "Call it inside `WidgetsBinding.instance.addPostFrameCallback`",
            "Split the widget so a smaller subtree rebuilds",
          ],
          correctIndex: 0,
          explanation:
            "Dart is single-threaded per isolate: an `await` yields, but a long synchronous computation still blocks the event loop and therefore the frame. Only a separate isolate gets the work off that thread.",
        },
      ],
    },
  ],
} satisfies Module;
