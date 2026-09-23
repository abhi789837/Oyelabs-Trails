import type { Module } from "@/types/curriculum";

export default {
  id: "mobile-react-native",
  trackId: "mobile",
  name: "React Native & Expo",
  description:
    "React Native for engineers who already write React on the web. The React part transfers; the host platform does not. This camp is about what is genuinely different on native — the New Architecture that replaced the bridge, Expo's build and release path, native layout and lists, platform-specific code, animations on the UI thread, and shipping through EAS. Written against React Native 0.87 and Expo SDK 57 (which ships React Native 0.86), on which the legacy bridge no longer exists.",
  refs: [
    { label: "React Native: Documentation", url: "https://reactnative.dev/docs/environment-setup", kind: "docs" },
    { label: "React Native: About the New Architecture", url: "https://reactnative.dev/architecture/landing-page", kind: "docs" },
    { label: "Expo: Documentation", url: "https://docs.expo.dev/", kind: "docs" },
    { label: "React Native blog: 0.87 release notes", url: "https://reactnative.dev/blog/2026/08/11/react-native-0.87", kind: "article" },
  ],
  topics: [
    {
      id: "rn-vs-react-dom",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "React Native vs React on the Web",
      summary:
        "React is a reconciler with pluggable host renderers. `react-dom` mounts your tree into a DOM document; `react-native` mounts it into a tree of real platform views — a `UIView` on iOS, an `android.view.View` on Android. Everything above the host stays identical: components, props, state, hooks, context, `Suspense`, TanStack Query, Zustand. Everything below it changes, and that is the whole difficulty of the transition.\n\nThere is no DOM and no CSS engine. There are no `div`, `span` or `button` elements: you compose `View`, `Text`, `Image`, `ScrollView` and `Pressable`. Raw strings must live inside a `Text`, because native text rendering is not a general box model — a bare string inside a `View` throws. Styles are plain JavaScript objects passed per component; there is no cascade, no selectors, no media queries and no inheritance, with the single exception that a nested `Text` inherits from its parent `Text`. Numbers are density-independent points, not CSS pixels, so `padding: 16` means 16pt and there is no unit to write. Every `View` is already a flex container laid out in a column, positioned `relative`.\n\nThe practical trap is assuming parity. `overflow: scroll` does nothing — scrolling is a component (`ScrollView`, or `FlatList` once the list is long). There is no `z-index` stacking-context model; on Android, overlap follows child order and `elevation`. Any dependency that touches `window`, `document` or `localStorage` will not run, which rules out a surprising share of npm before you have written a line of app code. Budget the migration cost at the library layer, not the component layer.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "React Native: Core Components and Native Components", url: "https://reactnative.dev/docs/intro-react-native-components", kind: "docs" },
        { label: "React Native: Style", url: "https://reactnative.dev/docs/style", kind: "docs" },
        { label: "React Native: Threading Model", url: "https://reactnative.dev/architecture/threading-model", kind: "article" },
      ],
      video: {
        title: "From React to React Native in 12 Minutes",
        channel: "Simon Grimm",
        url: "https://www.youtube.com/watch?v=6UB3gw3SKfY",
        videoId: "6UB3gw3SKfY",
        durationLabel: "12:33",
      },
      alternateVideos: [
        {
          title: "React Native in 100 Seconds",
          channel: "Fireship",
          url: "https://www.youtube.com/watch?v=gvkqT_Uoahw",
          videoId: "gvkqT_Uoahw",
          durationLabel: "2:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "rn-vs-react-dom-q1",
          prompt: "What does `<View style={{ padding: 16 }} />` produce at runtime on iOS?",
          options: [
            "A native `UIView` created and laid out by React Native's renderer",
            "A `<div>` rendered inside a hidden `WKWebView`",
            "A Core Graphics rectangle drawn by a JavaScript canvas polyfill",
            "A SwiftUI `VStack` generated at compile time from the JSX",
          ],
          correctIndex: 0,
          explanation:
            "React Native drives real platform view instances; there is no WebView anywhere in the pipeline. Nothing is transpiled into SwiftUI either — the JSX is evaluated at runtime and the renderer creates native views from it.",
        },
        {
          id: "rn-vs-react-dom-q2",
          prompt: "What happens with this component?\n\n```jsx\nfunction Badge() {\n  return <View>New</View>;\n}\n```",
          options: [
            "It throws: text strings must be rendered inside a `<Text>` component",
            "It renders the word `New` with the platform's default font",
            "It renders nothing and logs a warning in development only",
            "It renders `New` on iOS but throws on Android",
          ],
          correctIndex: 0,
          explanation:
            "Native views have no notion of a text node, so a raw string child of a `View` is an error rather than a warning. Wrapping it in `<Text>New</Text>` fixes it on both platforms.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-vs-react-dom-q3",
          prompt: "Which of these behave differently in React Native than in React DOM? (Select all that apply.)",
          options: [
            "Styling: there is no cascade, so a colour set on a parent `View` does not reach a child `Text`",
            "Layout: a container defaults to `flexDirection: \"column\"` rather than being a block box",
            "Scrolling: `overflow: \"scroll\"` has no effect and you use a scrolling component instead",
            "The rules of hooks, such as not calling a hook inside a condition",
            "How `useState` batches updates within an event handler",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Styling, layout defaults and scrolling all belong to the host platform and change. Hook rules and state batching belong to React itself and are identical, because both renderers sit on the same reconciler.",
        },
        {
          id: "rn-vs-react-dom-q4",
          prompt: "A component sets `style={{ marginTop: 16 }}`. What unit is `16`?",
          options: [
            "Density-independent points, scaled by the device's pixel ratio",
            "CSS pixels, exactly as on the web",
            "Physical device pixels, so it is smaller on a high-DPI screen",
            "Percent of the parent's height",
          ],
          correctIndex: 0,
          explanation:
            "React Native measures in density-independent units and multiplies by `PixelRatio` when it hits the screen, so 16 looks the same physical size across devices. Physical pixels would make the gap shrink as density rises.",
        },
        {
          id: "rn-vs-react-dom-q5",
          prompt: "Which replaces an `onClick` handler on a `<button>` in React Native?",
          options: [
            "`<Pressable onPress={...}>`, which exposes press, hover and focus states",
            "`<View onClick={...}>`, since `View` forwards DOM events",
            "`<Button onClick={...}>`, the cross-platform button primitive",
            "An `addEventListener(\"click\", ...)` call in a `useEffect`",
          ],
          correctIndex: 0,
          explanation:
            "`Pressable` is the current primitive and gives you `pressed`, `hovered` and `focused` state alongside `onPress`. There is no DOM event system, so `onClick` and `addEventListener` simply do not exist.",
        },
        {
          id: "rn-vs-react-dom-q6",
          prompt: "A teammate adds a date-picker library that works in the web app. It fails at runtime on device with `ReferenceError: document is not defined`. What is the correct read?",
          options: [
            "The library targets the DOM, so it needs a React Native equivalent rather than a polyfill",
            "Metro failed to transpile the package; adding it to `transformIgnorePatterns` will fix it",
            "The New Architecture removed `document`, so an older React Native version would work",
            "It only fails in development because Fast Refresh clears globals",
          ],
          correctIndex: 0,
          explanation:
            "There has never been a `document` in React Native, on any architecture. Transpilation is a syntax concern and cannot invent a DOM, so the answer is to swap the library, not to configure the bundler.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-vs-react-dom-q7",
          prompt: "Which statement about styling is true in React Native?",
          options: [
            "Style objects apply only to the component they are passed to, except that a nested `Text` inherits from its parent `Text`",
            "Styles cascade to descendants exactly as CSS does, with specificity deciding conflicts",
            "Styles cascade only for layout properties such as `flexDirection`",
            "Styles are global once registered with `StyleSheet.create`",
          ],
          correctIndex: 0,
          explanation:
            "There is no cascade and no specificity: each component gets exactly the style you hand it. Nested `Text` is the one inheritance path, because native text spans genuinely nest.",
        },
        {
          id: "rn-vs-react-dom-q8",
          prompt: "Which of these transfer unchanged from a web React codebase to React Native? (Select all that apply.)",
          options: [
            "Custom hooks that hold state and derive values",
            "React Context for dependency injection",
            "A Zustand store holding app state",
            "A CSS Modules stylesheet imported into the component",
            "A `ResizeObserver`-based hook that measures an element",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that is pure React or plain JavaScript moves across untouched. CSS Modules needs a CSS engine and `ResizeObserver` needs a DOM element, so both need native replacements (`onLayout` or `useWindowDimensions` for measurement).",
        },
        {
          id: "rn-vs-react-dom-q9",
          prompt: "What is the practical reason to use `FlatList` instead of putting 5,000 rows inside a `ScrollView`?",
          options: [
            "`ScrollView` mounts every child immediately, so 5,000 native views are created before the first frame",
            "`ScrollView` cannot scroll vertically past a fixed content height",
            "`ScrollView` re-renders all children on every scroll event",
            "`FlatList` renders on a background thread, while `ScrollView` renders on the UI thread",
          ],
          correctIndex: 0,
          explanation:
            "`ScrollView` is eager: all children are mounted up front, which costs memory and blocks the first paint. `FlatList` virtualizes, mounting only a window of rows. Neither renders off the UI thread.",
        },
        {
          id: "rn-vs-react-dom-q10",
          prompt: "Why is there no `z-index` stacking-context model like the web's?",
          options: [
            "Overlap is resolved by the native view hierarchy, so sibling order (and `elevation` on Android) decides what is on top",
            "React Native flattens all views into a single layer, so nothing can overlap",
            "`zIndex` is unsupported and always ignored on both platforms",
            "Stacking is computed by Yoga during layout and cannot be influenced from JavaScript",
          ],
          correctIndex: 0,
          explanation:
            "Native view systems paint children in order, and Android adds `elevation` on top of that; `zIndex` is supported but maps onto that model rather than creating CSS stacking contexts. Yoga computes geometry, not paint order.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "rn-new-architecture",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "The New Architecture: JSI, Fabric & TurboModules",
      summary:
        "For a decade, JavaScript and native code in React Native talked over the bridge: an asynchronous queue that serialised every call into JSON. That single design choice caused most of the framework's historic limitations. Layout measurement could not be synchronous, so a tooltip that had to measure its target visibly jumped. Large payloads — a camera frame, a long list's props — paid a serialisation tax proportional to their size. Native modules were all eagerly constructed at startup, whether the app used them or not.\n\nThe New Architecture removes the bridge and replaces it with three pieces. **JSI** (JavaScript Interface) lets JavaScript hold a reference to a C++ object and call its methods directly, with no serialisation and no queue. **TurboModules** are native modules built on JSI: lazily instantiated on first use, with their JavaScript/native interface generated by Codegen from a typed spec, so the type mismatch that used to surface as a runtime crash is now a build error. **Fabric** is the renderer: a C++ core shared by both platforms that keeps an immutable shadow tree, runs render → commit → mount, supports React's concurrent features (transitions, automatic batching, `Suspense`), and makes `useLayoutEffect` able to measure and reposition in a single commit.\n\nThe rollout matters for reading material. Experimental opt-in landed in 0.68; bridgeless mode in 0.74; **0.76 (October 2024) made the New Architecture the default**; 0.80 froze the legacy architecture and introduced the Strict TypeScript API; **0.82 (October 2025) was the first release that runs entirely on the New Architecture**; 0.84 made Hermes V1 the default engine and kept deleting legacy code; 0.87 (August 2026) made the Strict TypeScript API the default and raised the floor to Node 22, AGP 9 and Kotlin 2.0+. The consequence is blunt: most React Native content online — including highly-ranked tutorials and almost every StackOverflow answer about performance — describes the bridge, `react-native init` and the JSON boundary, none of which exist any more. A library that was never migrated does not work on a current version at all.",
      level: "expert",
      estMinutes: 80,
      isMilestone: true,
      webRefs: [
        { label: "React Native: About the New Architecture", url: "https://reactnative.dev/architecture/landing-page", kind: "docs" },
        { label: "React Native: Fabric Renderer", url: "https://reactnative.dev/architecture/fabric-renderer", kind: "docs" },
        { label: "React Native blog: 0.82 — A New Era", url: "https://reactnative.dev/blog/2025/10/08/react-native-0.82", kind: "article" },
        { label: "React Native blog: The New Architecture is here", url: "https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here", kind: "article" },
      ],
      video: {
        title: "The Bridge is Dead — React Native New Architecture Explained (2026)",
        channel: "Akshat Paul",
        url: "https://www.youtube.com/watch?v=pQ36rnURgT0",
        videoId: "pQ36rnURgT0",
        durationLabel: "12:10",
      },
      alternateVideos: [
        {
          title: "Phillip Pan – React Native under the hood | App.js Conf 2024",
          channel: "Software Mansion",
          url: "https://www.youtube.com/watch?v=oLmGInjKU2U",
          videoId: "oLmGInjKU2U",
          durationLabel: "21:19",
        },
        {
          title: "Getting React Native New Architecture to You — Arushi Kesarwani | React Universe Conf 2024",
          channel: "Callstack",
          url: "https://www.youtube.com/watch?v=cRAqyCmeV0g",
          videoId: "cRAqyCmeV0g",
          durationLabel: "24:48",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "rn-new-architecture-q1",
          prompt: "What does JSI actually replace?",
          options: [
            "The asynchronous, JSON-serialising bridge between JavaScript and native code",
            "The Hermes JavaScript engine",
            "Yoga, the layout engine",
            "Metro, the JavaScript bundler",
          ],
          correctIndex: 0,
          explanation:
            "JSI is a C++ interface that lets JavaScript hold references to native objects and invoke them directly, removing the serialisation boundary. Hermes, Yoga and Metro are separate pieces that the New Architecture kept.",
        },
        {
          id: "rn-new-architecture-q2",
          prompt: "A tutorial from 2023 says: \"to make this fast, batch your calls so fewer messages cross the bridge.\" Why is that advice now misleading?",
          options: [
            "There is no bridge: JSI calls are direct, so the per-call serialisation cost the advice optimised for is gone",
            "Batching is now done automatically by Metro at build time",
            "The bridge still exists but batches messages itself, so manual batching is redundant",
            "It only applied to Android; iOS never used the bridge",
          ],
          correctIndex: 0,
          explanation:
            "The optimisation existed because every call was serialised onto a queue. With JSI the boundary is a direct function call, so the cost model it assumed no longer applies. The bridge was cross-platform and is fully removed, not merely optimised.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-new-architecture-q3",
          prompt: "Which of these does Fabric make possible that the legacy renderer could not? (Select all that apply.)",
          options: [
            "Synchronous layout measurement inside `useLayoutEffect`, avoiding a visible reposition",
            "React concurrent features such as `startTransition` and automatic batching from native events",
            "A single C++ renderer core shared between iOS and Android",
            "Running your React components on a background thread instead of the JavaScript thread",
            "Removing the need for a JavaScript engine entirely",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Fabric's shadow tree and commit phase enable synchronous measurement, concurrent React and a shared C++ core. Your components still run on the JavaScript thread, and a JavaScript engine is still very much required.",
        },
        {
          id: "rn-new-architecture-q4",
          prompt: "What is Codegen's role in a TurboModule?",
          options: [
            "It generates the native interface and JavaScript bindings from a typed spec, so mismatches fail at build time",
            "It compiles your JavaScript to native ARM code ahead of time",
            "It generates the Fabric shadow tree from your JSX",
            "It converts CommonJS modules in `node_modules` to ES modules for Metro",
          ],
          correctIndex: 0,
          explanation:
            "You declare the module's shape in a TypeScript or Flow spec and Codegen emits the glue for both sides, turning what used to be a runtime type crash into a compile error. It does not compile application JavaScript.",
        },
        {
          id: "rn-new-architecture-q5",
          prompt: "Why are TurboModules described as \"lazy\"?",
          options: [
            "A module is instantiated the first time JavaScript touches it, rather than all modules being constructed at startup",
            "Their methods return promises that resolve on the next frame",
            "They defer native work to a background thread automatically",
            "Their native code is downloaded on demand at runtime",
          ],
          correctIndex: 0,
          explanation:
            "Legacy native modules were all created during startup, which cost time-to-interactive even for modules the session never used. TurboModules are created on first access. Nothing is downloaded at runtime — native code still ships in the binary.",
        },
        {
          id: "rn-new-architecture-q6",
          prompt: "Which React Native release first ran **entirely** on the New Architecture, with no legacy path?",
          options: ["0.82", "0.76", "0.68", "0.87"],
          correctIndex: 0,
          explanation:
            "0.76 made the New Architecture the *default* but kept the legacy path available; 0.82 removed the option. 0.68 was the first experimental opt-in, and 0.87 is simply a later release.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-new-architecture-q7",
          prompt: "Your app is on a current React Native version and a dependency that was last published in 2023 crashes on launch with a native module error. What is the most likely cause?",
          options: [
            "The library still registers itself as a legacy bridge module, which no longer exists",
            "The library's JavaScript uses syntax Hermes cannot parse",
            "Metro is resolving the wrong entry point from the package's `exports` field",
            "The library needs `newArchEnabled=false`, which current versions still honour",
          ],
          correctIndex: 0,
          explanation:
            "Unmigrated libraries hook into a registration mechanism that has been deleted, so they fail as soon as the module is resolved. Turning the New Architecture off is no longer an option on current versions — the legacy code is gone.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-new-architecture-q8",
          prompt: "The New Architecture is enabled and a colleague expects an automatic frame-rate win. What is the honest answer?",
          options: [
            "It removes a class of overhead and unlocks new capabilities, but an app whose bottleneck was its own render work sees little change until the code is refactored",
            "Frame rates roughly double on both platforms with no code changes",
            "It is slower until you migrate every dependency to TurboModules",
            "Performance is identical; the New Architecture is purely an internal refactor",
          ],
          correctIndex: 0,
          explanation:
            "The docs are explicit that enabling it may not immediately improve performance: serialisation may never have been your bottleneck. The gains come from using what it unlocks — synchronous layout, concurrent features, JSI-based libraries.",
        },
        {
          id: "rn-new-architecture-q9",
          prompt: "Which claims about the current rendering pipeline are true? (Select all that apply.)",
          options: [
            "Rendering goes through render, commit and mount phases over an immutable shadow tree",
            "View flattening can collapse a layout-only `View` so no native view is created for it",
            "The renderer core is written in C++ and shared across platforms",
            "Each `View` in your JSX always maps one-to-one onto a native view",
            "Layout is computed in JavaScript and the results are posted to native",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The shadow tree, view flattening and the shared C++ core are all part of Fabric. View flattening is precisely why the one-to-one mapping does not hold, and layout is computed by Yoga in C++, not in JavaScript.",
        },
        {
          id: "rn-new-architecture-q10",
          prompt: "Why did the legacy architecture make it impossible to measure a view and reposition a tooltip without a visible jump?",
          options: [
            "Measurement came back through an asynchronous callback, so the resulting state update could land after the previous render had painted",
            "Measurement was accurate only after two full frames had rendered",
            "`onLayout` reported sizes in physical pixels, which had to be converted before use",
            "The JavaScript thread could not read native view properties at all",
          ],
          correctIndex: 0,
          explanation:
            "With `onLayout` plus `measureInWindow`, the state update was not guaranteed to be in the same commit, so users saw an intermediate frame. Fabric lets `useLayoutEffect` measure and update synchronously in one commit.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "rn-expo-vs-bare",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "Expo vs Bare React Native",
      summary:
        "The React Native docs now tell you to start a new app with a framework, and the framework they name is Expo. That recommendation is less about convenience than about who maintains your `ios/` and `android/` directories. Expo's answer is **Continuous Native Generation**: you describe the app in `app.json` and config plugins, and `npx expo prebuild` regenerates the native projects from that description whenever they are needed. Native projects become build output rather than source you hand-edit and merge.\n\nThe old \"managed vs bare workflow\" vocabulary is deprecated — every Expo project uses CNG now, and the only real decision is whether you check `ios/` and `android/` into version control. Checking them in means you can hand-edit native files, at the cost of doing every upgrade manually; leaving them out means upgrades are mostly a config change and a regenerate, at the cost of having to express every native customisation as a config plugin. Brownfield apps, where React Native is embedded in an existing native app, and teams with deep platform-specific work are the honest cases for owning the native projects.\n\nThe second decision is how you run the app during development. **Expo Go** is a prebuilt sandbox containing exactly the native modules Expo ships; the moment you add a dependency with its own native code, it stops being able to run your app. A **development build** is your own binary, containing your native dependencies, with the dev client attached — the same build/install loop as bare React Native, but produced by EAS in the cloud if you do not have Xcode. Teams routinely start on Expo Go, hit the first native dependency, and mistake the resulting crash for a bug in the library rather than a signal to move to a development build. Plan for that transition on day one, not in the sprint before launch.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "Expo: Continuous Native Generation (CNG)", url: "https://docs.expo.dev/workflow/continuous-native-generation/", kind: "docs" },
        { label: "Expo: Development builds", url: "https://docs.expo.dev/develop/development-builds/introduction/", kind: "docs" },
        { label: "React Native: Get Started without a framework", url: "https://reactnative.dev/docs/getting-started-without-a-framework", kind: "docs" },
        { label: "Expo: Development process overview", url: "https://docs.expo.dev/workflow/overview/", kind: "docs" },
      ],
      video: {
        title: "Expo Go & Development Builds: Which should you use?",
        channel: "Expo",
        url: "https://www.youtube.com/watch?v=FdjczjkwQKE",
        videoId: "FdjczjkwQKE",
        durationLabel: "21:36",
      },
      alternateVideos: [
        {
          title: "More proof you need to use Expo...",
          channel: "Theo - t3․gg",
          url: "https://www.youtube.com/watch?v=gntZth3mIbM",
          videoId: "gntZth3mIbM",
          durationLabel: "20:49",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "rn-expo-vs-bare-q1",
          prompt: "What does `npx expo prebuild` do?",
          options: [
            "Generates the `ios/` and `android/` directories from the app config, installed packages and config plugins",
            "Compiles the JavaScript bundle ahead of time so the first launch is faster",
            "Uploads the project to EAS and starts a cloud build",
            "Converts an Expo project into a bare React Native project permanently",
          ],
          correctIndex: 0,
          explanation:
            "Prebuild is code generation: it applies the template, your app config and each config plugin to produce native projects. It is repeatable, which is why it is not a one-way conversion.",
        },
        {
          id: "rn-expo-vs-bare-q2",
          prompt: "A developer installs a library with native code and it crashes in Expo Go. What is the correct fix?",
          options: [
            "Create a development build, which includes that library's native code alongside the dev client",
            "Clear the Metro cache and restart the packager",
            "Add the library to `expo.plugins` in `app.json`, which loads it into Expo Go",
            "Downgrade the library to its last pure-JavaScript release",
          ],
          correctIndex: 0,
          explanation:
            "Expo Go is a fixed binary containing only the native modules Expo ships, so no configuration can add native code to it. A development build is your own binary and can contain anything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-expo-vs-bare-q3",
          prompt: "Which statements about CNG are true? (Select all that apply.)",
          options: [
            "Native projects are treated as generated output rather than hand-maintained source",
            "Config plugins express native customisations in a versioned, repeatable way",
            "Checking `ios/` and `android/` into git and editing them by hand opts you out of the benefits",
            "CNG removes the need for a native build to ship native dependency changes",
            "CNG only works for apps that use Expo's own SDK modules",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are the core of the model. Native dependency changes still require a native build — generation is not the same as shipping. And CNG works with any React Native library, with or without an Expo module.",
        },
        {
          id: "rn-expo-vs-bare-q4",
          prompt: "Is \"bare workflow\" still the right term for a project that keeps its `ios/` and `android/` directories in version control?",
          options: [
            "No — the managed/bare workflow distinction is deprecated; it is just a CNG project whose native directories are checked in",
            "Yes, and it is the only way to use native modules",
            "Yes, and it disables Expo SDK packages entirely",
            "No — checking in native directories is no longer supported at all",
          ],
          correctIndex: 0,
          explanation:
            "Expo's docs explicitly retired the managed/bare vocabulary. Keeping the native directories is a supported choice with a known cost, not a different product, and Expo SDK packages keep working either way.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-expo-vs-bare-q5",
          prompt: "What is the main cost of *not* checking `ios/` and `android/` into version control?",
          options: [
            "Every native customisation has to be expressed as a config plugin rather than an edit to a native file",
            "You cannot build the app without an internet connection",
            "You lose the ability to debug native crashes",
            "You have to re-run `prebuild` before every JavaScript change",
          ],
          correctIndex: 0,
          explanation:
            "Anything you would have typed into `Info.plist`, a Gradle file or `AndroidManifest.xml` has to go through a plugin instead. Local builds and native crash debugging are unaffected, and prebuild is only needed when native inputs change.",
        },
        {
          id: "rn-expo-vs-bare-q6",
          prompt: "Why does the React Native documentation recommend starting with a framework rather than a plain CLI project?",
          options: [
            "Routing, native module maintenance, asset handling and release tooling are all problems every app hits, and the core repo does not solve them",
            "The community CLI no longer works on current React Native versions",
            "A framework project is the only way to enable the New Architecture",
            "Plain CLI projects cannot use TypeScript",
          ],
          correctIndex: 0,
          explanation:
            "The core repo is deliberately narrow, so a bare project leaves you to assemble navigation, native module upgrades and a release pipeline yourself. The CLI still exists and works; TypeScript and the New Architecture are available either way.",
        },
        {
          id: "rn-expo-vs-bare-q7",
          prompt: "Which situations genuinely argue for owning the native projects rather than regenerating them? (Select all that apply.)",
          options: [
            "Embedding React Native into an existing native app (brownfield adoption)",
            "A native customisation with no config plugin that the team is not willing to write one for",
            "A build pipeline that already depends on hand-written Gradle or Xcode configuration",
            "Wanting to use TypeScript in the JavaScript layer",
            "Wanting over-the-air updates",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are real platform-ownership reasons. TypeScript is orthogonal, and over-the-air updates work in either setup — `expo-updates` does not require checked-in native directories.",
        },
        {
          id: "rn-expo-vs-bare-q8",
          prompt: "A team runs `npx expo prebuild --clean` after hand-editing `android/app/build.gradle`. What happens?",
          options: [
            "The directory is regenerated and the hand edit is lost, because it was not expressed as a config plugin",
            "The edit is detected and merged into the regenerated project",
            "The command refuses to run while there are uncommitted native changes",
            "Only `ios/` is regenerated; `android/` is left alone once it has local modifications",
          ],
          correctIndex: 0,
          explanation:
            "`--clean` deletes and regenerates from the config, which is the whole point of the model. There is no merge step — a customisation only survives if it lives in a plugin.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-expo-vs-bare-q9",
          prompt: "What does a development build give you that a release build does not?",
          options: [
            "The dev client: loading JavaScript from a dev server, Fast Refresh and the developer menu",
            "Access to native modules, which release builds strip out",
            "Over-the-air updates, which are disabled in release builds",
            "A smaller binary, since debug symbols are removed",
          ],
          correctIndex: 0,
          explanation:
            "A development build bundles `expo-dev-client` so it can connect to Metro and expose developer tooling. Native modules exist in both, updates work in release builds, and debug binaries are larger, not smaller.",
        },
      ],
    },
    {
      id: "rn-styling-flexbox",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "StyleSheet & Flexbox on Native",
      summary:
        "Layout in React Native is computed by **Yoga**, a C++ implementation of a subset of Flexbox, not by a browser engine. It is close enough to feel familiar and different enough to bite. `flexDirection` defaults to `column` rather than `row`, because screens are tall. `alignContent` defaults to `flex-start` rather than `stretch`. Most consequentially, **`flexShrink` defaults to `0`** rather than `1`: a long `Text` in a row will happily overflow its container instead of shrinking, which is the single most common \"why is my text cut off\" bug on native.\n\nThe `flex` shorthand takes one number, not three values. A positive `flex: n` means `flexGrow: n, flexShrink: 1, flexBasis: 0` — note the `flexBasis: 0`, which is why `flex: 1` distributes space proportionally rather than sizing to content. `flex: 0` sizes the component by its `width`/`height` and makes it inflexible. Everything is `position: \"relative\"` by default, there is no `display: grid`, and `gap` works on flex containers.\n\n`StyleSheet.create` is essentially an identity function today: it returns your objects. What it buys you is static type checking against valid native style props, a stable object identity across renders (useful when a style is a prop and you care about reference equality), and the discipline of keeping styles out of the render body. The `style` prop also accepts an array, merged left to right with later entries winning and falsy entries ignored — `style={[styles.base, isActive && styles.active]}` is the idiomatic conditional. Reach for `StyleSheet.flatten` when you need to read a resolved value, `StyleSheet.hairlineWidth` for a genuinely thin divider, and remember that inline object literals create a new object every render, which defeats any memoisation downstream.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "React Native: Layout with Flexbox", url: "https://reactnative.dev/docs/flexbox", kind: "docs" },
        { label: "React Native: Layout Props reference", url: "https://reactnative.dev/docs/layout-props", kind: "docs" },
        { label: "React Native: StyleSheet API", url: "https://reactnative.dev/docs/stylesheet", kind: "docs" },
        { label: "Yoga: the layout engine React Native uses", url: "https://www.yogalayout.dev/", kind: "article" },
      ],
      video: {
        title: "React Native Flexbox Explained: How to Create Powerful UI",
        channel: "Hitesh Choudhary",
        url: "https://www.youtube.com/watch?v=MJ7P1JUyuFA",
        videoId: "MJ7P1JUyuFA",
        durationLabel: "17:14",
      },
      alternateVideos: [
        {
          title: "Styling React Native Components: The Fundamentals of Stylesheet",
          channel: "Hitesh Choudhary",
          url: "https://www.youtube.com/watch?v=9yhlhKX7ZYM",
          videoId: "9yhlhKX7ZYM",
          durationLabel: "17:51",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "rn-styling-flexbox-q1",
          prompt: "What is the default `flexDirection` of a `View`?",
          options: ["`column`", "`row`", "`row-reverse`", "There is no default; it must be set explicitly"],
          correctIndex: 0,
          explanation:
            "React Native defaults to `column` because mobile screens are taller than they are wide. Web CSS defaults to `row`, which is the usual source of confusion when porting a layout.",
        },
        {
          id: "rn-styling-flexbox-q2",
          prompt: "A row contains an avatar with a fixed width and a `<Text>` holding a long name. The text runs past the edge of the screen instead of truncating. What is the cause?",
          options: [
            "`flexShrink` defaults to `0` in React Native, so the text never shrinks below its natural width",
            "`numberOfLines` defaults to `0`, which disables truncation",
            "`Text` ignores `flexDirection` and always lays out horizontally",
            "The parent is missing `overflow: \"hidden\"`",
          ],
          correctIndex: 0,
          explanation:
            "Web CSS shrinks flex items by default; React Native does not. Adding `flexShrink: 1` (or `flex: 1`) to the text lets it shrink so `numberOfLines` and `ellipsizeMode` can do their job.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-styling-flexbox-q3",
          prompt: "What does `flex: 2` expand to?",
          options: [
            "`flexGrow: 2, flexShrink: 1, flexBasis: 0`",
            "`flexGrow: 2, flexShrink: 0, flexBasis: \"auto\"`",
            "`flexGrow: 2, flexShrink: 2, flexBasis: \"auto\"`",
            "`flexGrow: 1, flexShrink: 1, flexBasis: 2`",
          ],
          correctIndex: 0,
          explanation:
            "A positive `flex` sets grow to that number, shrink to 1 and basis to 0. The `flexBasis: 0` is what makes siblings share space in proportion to their flex values rather than to their content sizes.",
        },
        {
          id: "rn-styling-flexbox-q4",
          prompt: "Two sibling `View`s are in a row: the first has `flex: 1`, the second `flex: 3`. The container is 400 wide with no padding. What widths result?",
          options: ["100 and 300", "200 and 200", "133 and 267", "Both are sized by their content"],
          correctIndex: 0,
          explanation:
            "With `flexBasis: 0` on both, all 400 points are free space, shared 1:3. Content sizes never enter the calculation, which is exactly why `flexBasis: 0` matters.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-styling-flexbox-q5",
          prompt: "Which of these are true about the `style` prop? (Select all that apply.)",
          options: [
            "It accepts an array, merged left to right with later entries winning",
            "Falsy entries in the array are ignored, so `cond && styles.x` is safe",
            "`StyleSheet.create` returns the style objects themselves in current React Native",
            "Styles declared with `StyleSheet.create` cascade to child components",
            "The array form is resolved by CSS specificity rules",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Arrays merge in order, falsy entries drop out, and `create` is effectively an identity function that adds type checking. There is no cascade and no specificity anywhere in React Native styling.",
        },
        {
          id: "rn-styling-flexbox-q6",
          prompt: "Which CSS layout feature does React Native **not** support?",
          options: ["`display: grid`", "`gap` between flex children", "`position: \"absolute\"`", "`aspectRatio`"],
          correctIndex: 0,
          explanation:
            "Yoga implements Flexbox, not Grid. `gap`, absolute positioning and `aspectRatio` are all available, with `aspectRatio` being a layout prop rather than a CSS-only trick.",
        },
        {
          id: "rn-styling-flexbox-q7",
          prompt: "What is the default `position` value for every component?",
          options: ["`\"relative\"`", "`\"static\"`", "`\"absolute\"`", "It is inherited from the nearest positioned ancestor"],
          correctIndex: 0,
          explanation:
            "Everything is `relative` by default, so an absolutely positioned child is always placed against its immediate parent. There is no `static` and therefore no search up the tree for a containing block.",
        },
        {
          id: "rn-styling-flexbox-q8",
          prompt: "Why does passing `style={{ marginTop: 8 }}` inline to a memoised child component defeat the memoisation?",
          options: [
            "The object literal is recreated on every render, so the prop is never referentially equal",
            "Inline styles bypass `StyleSheet` validation and force a full re-layout",
            "`React.memo` ignores props whose names start with `style`",
            "Inline styles are applied on the UI thread and cannot be compared",
          ],
          correctIndex: 0,
          explanation:
            "`React.memo` uses shallow comparison, and a fresh object is never `===` to the previous one. Hoisting the style into a `StyleSheet.create` block gives it a stable identity.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-styling-flexbox-q9",
          prompt: "What is `StyleSheet.hairlineWidth` for?",
          options: [
            "The thinnest line the current screen density can draw, for dividers and borders",
            "A fixed value of `0.5` on every platform",
            "The width of the device's safe-area inset",
            "The minimum touch-target width recommended by the platform guidelines",
          ],
          correctIndex: 0,
          explanation:
            "It is a platform- and density-dependent constant so a divider looks like a hairline rather than a thick bar on high-density screens. It is not a fixed number and has nothing to do with touch targets.",
        },
        {
          id: "rn-styling-flexbox-q10",
          prompt: "`alignItems: \"center\"` is set on a column container and a child looks narrower than expected. Why?",
          options: [
            "On the cross axis, `alignItems: \"center\"` replaces the default stretch, so the child is sized by its content",
            "`alignItems` has no effect on a column container",
            "`alignContent` defaults to `flex-start`, which overrides `alignItems`",
            "Children in a column container always size to their content regardless of alignment",
          ],
          correctIndex: 0,
          explanation:
            "The default cross-axis behaviour stretches children to the container's width; centring them removes that stretch. `alignContent` governs multiple flex lines and does not override `alignItems` here.",
        },
      ],
    },
    {
      id: "rn-navigation",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "Navigation: Expo Router & React Navigation",
      summary:
        "Mobile navigation is not a URL bar with a back button. It is a stack of screens that the platform animates and keeps mounted, and that is expected to behave like a native app: a swipe-back gesture on iOS, a hardware back button on Android, tab bars that preserve each tab's own history, and deep links that can open any screen cold.\n\n**Expo Router** brings file-based routing to that model. Files under `app/` become routes; `index.tsx` is a directory's default route; `_layout.tsx` is not a screen but the navigator that wraps everything under it; `[id].tsx` is a dynamic segment read with `useLocalSearchParams`; a `(group)` directory organises files without contributing a URL segment; `+not-found` catches unmatched links, `+native-intent` handles deep links that match no route, and `+middleware` runs before a route renders, which is where auth redirects belong. Every screen is deep-linkable by construction, and the same tree renders on web.\n\n**React Navigation** is the component-based alternative: you build the navigator tree in code instead of deriving it from the file system. The relationship changed in Expo SDK 56 — Expo Router no longer supports importing from `@react-navigation/*` in application code, and you import the equivalents from Expo Router's own entry points (`expo-router/react-navigation`, `expo-router/js-stack`, `expo-router/js-tabs`). The runtime API is unchanged; only the module specifiers moved, and Expo CLI rewrites third-party libraries' `@react-navigation/core` imports for you.\n\nThe tradeoff worth understanding is native stacks versus JavaScript stacks. A native stack (backed by `react-native-screens`) hands the transition to the platform, so it looks and feels correct for free but is less customisable; a JavaScript stack animates inside your app and lets you do anything, at the cost of running the animation on your own budget. The common mistake is treating `app/` as a source directory: anything you drop in there, including a helpers file, becomes a route.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "Expo Router: Introduction", url: "https://docs.expo.dev/router/introduction/", kind: "docs" },
        { label: "Expo Router: File notation reference", url: "https://docs.expo.dev/router/basics/notation/", kind: "docs" },
        { label: "Expo Router: Migrating from SDK 55 to 56", url: "https://docs.expo.dev/router/migrate/sdk-55-to-56/", kind: "article" },
        { label: "React Navigation: Getting started", url: "https://reactnavigation.org/docs/getting-started/", kind: "docs" },
      ],
      video: {
        title: "Introduction to Expo Router Layout Files",
        channel: "Expo",
        url: "https://www.youtube.com/watch?v=Yh6Qlg2CYwQ",
        videoId: "Yh6Qlg2CYwQ",
        durationLabel: "12:54",
      },
      alternateVideos: [
        {
          title: "10 Tips You NEED For Expo Router in 2026!",
          channel: "Simon Grimm",
          url: "https://www.youtube.com/watch?v=mzRgSxf5oRk",
          videoId: "mzRgSxf5oRk",
          durationLabel: "19:17",
        },
        {
          title: "React Navigation v8 Crash Course — Liquid Glass, Tabs & More",
          channel: "Code with Beto",
          url: "https://www.youtube.com/watch?v=zUfPhL_EU2Y",
          videoId: "zUfPhL_EU2Y",
          durationLabel: "47:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "rn-navigation-q1",
          prompt: "What is `_layout.tsx` in Expo Router?",
          options: [
            "A file that renders the navigator wrapping every route beneath its directory, rather than being a screen itself",
            "A screen shown while the sibling routes load",
            "A configuration file read at build time that never renders",
            "The route that matches `/layout`",
          ],
          correctIndex: 0,
          explanation:
            "A layout renders before any route under it and is where you declare a `Stack`, `Tabs` or `Drawer`, plus shared providers. It is not addressable as a URL, and it does render at runtime.",
        },
        {
          id: "rn-navigation-q2",
          prompt: "A file lives at `app/(tabs)/settings.tsx`. What URL does it match?",
          options: ["`/settings`", "`/(tabs)/settings`", "`/tabs/settings`", "Nothing: group directories are not routable"],
          correctIndex: 0,
          explanation:
            "A parenthesised directory is a route group: it organises files and gives them a shared layout without contributing a path segment. The route is still fully routable and deep-linkable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-navigation-q3",
          prompt: "Which of these are real Expo Router file conventions? (Select all that apply.)",
          options: [
            "`[id].tsx` for a dynamic segment read with `useLocalSearchParams`",
            "`+not-found.tsx` for unmatched routes",
            "`_layout.tsx` for the navigator around a directory",
            "`$id.tsx` for a dynamic segment",
            "`__tests__.tsx` for colocated tests that routing ignores",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Square brackets, the `+` prefix for special routes and the `_layout` convention are all real. `$id` is another framework's syntax, and there is no test-file convention — test files belong outside `app/`.",
        },
        {
          id: "rn-navigation-q4",
          prompt: "An engineer adds `app/utils/formatDate.ts` and is surprised by a routing warning. Why?",
          options: [
            "Everything under `app/` is treated as a route, so a helper file becomes a route with no screen to render",
            "Expo Router requires every file under `app/` to use `.tsx`",
            "`utils` is a reserved directory name in Expo Router",
            "Metro cannot resolve nested directories inside `app/`",
          ],
          correctIndex: 0,
          explanation:
            "The `app/` directory is the routing manifest, not a general source folder. Helpers belong in `src/` or anywhere outside `app/`, which is why Expo's templates keep `app/` focused on routing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-navigation-q5",
          prompt: "Since Expo SDK 56, what happened to `import { useNavigation } from \"@react-navigation/native\"` inside an Expo Router app?",
          options: [
            "It is no longer supported in application code; you import from `expo-router/react-navigation` instead, with the same runtime API",
            "React Navigation was removed entirely, so there is no equivalent",
            "It still works, but only when the package is listed in `expo.plugins`",
            "It works on web builds only",
          ],
          correctIndex: 0,
          explanation:
            "Expo Router now owns those entry points; only the module specifier moved, so the hook behaves identically. Expo CLI rewrites third-party libraries' imports automatically, so you do not have to patch them.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-navigation-q6",
          prompt: "What is the practical advantage of a native stack over a JavaScript stack?",
          options: [
            "The platform owns the transition, so gestures, animation curves and header behaviour match the OS without custom work",
            "Screens render on a background thread, leaving the JavaScript thread free",
            "It supports deep linking, which JavaScript stacks do not",
            "It is the only stack that works with the New Architecture",
          ],
          correctIndex: 0,
          explanation:
            "A native stack delegates presentation to the platform's own navigation controller through `react-native-screens`. Screens are not rendered off-thread, deep linking works with both, and both run on the New Architecture.",
        },
        {
          id: "rn-navigation-q7",
          prompt: "Where does an auth redirect belong in an Expo Router app?",
          options: [
            "In a layout or `+middleware`, so an unauthenticated deep link is intercepted before the protected screen renders",
            "In a `useEffect` inside each protected screen",
            "In `app.json`, as a `protectedRoutes` array",
            "In `+not-found.tsx`, which receives all unauthorised navigations",
          ],
          correctIndex: 0,
          explanation:
            "Redirecting from inside the screen means the protected screen mounts, and usually fetches, first — which flashes content and can leak data. Layouts and middleware run before the route does; `+not-found` only handles unmatched paths.",
        },
        {
          id: "rn-navigation-q8",
          prompt: "Why does every Expo Router screen get deep linking without extra configuration?",
          options: [
            "The route tree is derived from the file system, so each screen's URL is already known",
            "Expo registers every screen with the App Store and Play Store at submission time",
            "Deep links are resolved at runtime by scanning the rendered navigator tree",
            "Each screen exports a `linking` object that Expo Router collects",
          ],
          correctIndex: 0,
          explanation:
            "File paths *are* the link configuration, so there is no separate mapping to maintain. React Navigation can do the same thing, but through an explicit `linking` config you keep in sync by hand.",
        },
        {
          id: "rn-navigation-q9",
          prompt: "A tab bar has three tabs, each containing a stack. The user drills two screens deep in tab A, switches to tab B, then returns to tab A. What should happen?",
          options: [
            "Tab A is still two screens deep, because each tab keeps its own navigation history",
            "Tab A resets to its root screen, because switching tabs unmounts the stack",
            "The app navigates back to tab B's root, because only one stack can be active",
            "The behaviour is undefined and differs per platform",
          ],
          correctIndex: 0,
          explanation:
            "Per-tab history is the expected native behaviour, and both Expo Router and React Navigation implement it. Resetting on switch is a common bug caused by remounting the navigator instead of keeping it mounted.",
        },
        {
          id: "rn-navigation-q10",
          prompt: "Which are true about Expo Router on web? (Select all that apply.)",
          options: [
            "The same route tree renders, so URLs map to the same screens",
            "Static rendering is supported, which matters for search engines",
            "`+html.tsx` lets you customise the HTML document shell",
            "Native stack transitions are reproduced exactly in the browser",
            "Deep links must be declared separately for web",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Universal routing, static rendering and the `+html` escape hatch are all part of the web story. Platform transitions are approximated rather than reproduced, and the route tree is shared, so links are not re-declared.",
        },
      ],
    },
    {
      id: "rn-lists-performance",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "Lists at Scale: FlatList & FlashList",
      summary:
        "Lists are where most React Native apps first feel slow, because a list is the one screen that asks the framework to create and destroy views continuously while the user's finger is on the glass. `ScrollView` mounts every child at once, so it is only correct for a bounded, small set. `FlatList`, built on `VirtualizedList`, keeps a window of rows mounted and discards the rest.\n\nThe tuning knobs are all about that window. `initialNumToRender` (default 10) controls first paint; `windowSize` (default 21, meaning ten viewports either side plus the visible one) controls how much stays mounted; `maxToRenderPerBatch` (default 10) and `updateCellsBatchingPeriod` (default 50 ms) control how aggressively new rows render during a scroll; `removeClippedSubviews` (default `true` on Android) detaches offscreen views from the native hierarchy. Tuning is a real tradeoff: a larger window means less blank space when scrolling fast, and more memory and more work per commit. **`getItemLayout` is the highest-leverage prop when rows have a predictable size**, because it lets the list skip asynchronous measurement and jump straight to any offset — and it is also the prop people get wrong, by forgetting that a separator's height belongs in the offset.\n\n`keyExtractor` matters for the same reason keys matter in React. It defaults to `item.key`, then `item.id`, then the index — and the index fallback is exactly what breaks when the data reorders.\n\nFlashList takes the other approach: it recycles a small pool of views instead of mounting and unmounting. In version 2 the estimation props (`estimatedItemSize`, `estimatedListSize`, `estimatedFirstItemOffset`) are gone because sizing is automatic, and it adds `masonry`, `onStartReached` and `maintainVisibleContentPosition`, plus `useRecyclingState` for per-item state that must reset when a view is reused. The thing to internalise is that recycling hands your row component different data without unmounting it, so anything kept in local state, in a ref, or in an uncontrolled input leaks between rows unless it is tied to the item's identity.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "React Native: Optimizing FlatList configuration", url: "https://reactnative.dev/docs/optimizing-flatlist-configuration", kind: "docs" },
        { label: "React Native: FlatList API", url: "https://reactnative.dev/docs/flatlist", kind: "docs" },
        { label: "FlashList: What's new in v2", url: "https://shopify.github.io/flash-list/docs/v2-changes/", kind: "docs" },
        { label: "React Native: VirtualizedList", url: "https://reactnative.dev/docs/virtualizedlist", kind: "docs" },
      ],
      video: {
        title: "You've Been Building React Native Lists Wrong All Along",
        channel: "Simon Grimm",
        url: "https://www.youtube.com/watch?v=oxMoQKO9CRE",
        videoId: "oxMoQKO9CRE",
        durationLabel: "13:42",
      },
      alternateVideos: [
        {
          title: "Top 6 React Native Tips to Survive 2026",
          channel: "Code with Beto",
          url: "https://www.youtube.com/watch?v=zMM0d1d1_X4",
          videoId: "zMM0d1d1_X4",
          startSeconds: 533,
          chapterLabel: "Prefer FlatList over ScrollView for large lists",
          durationLabel: "13:55",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `createGetItemLayout(heights, separatorHeight)`, the factory behind a `FlatList`'s `getItemLayout` prop.\n\nIt takes an array of row heights in render order and the height of the separator drawn **between** rows, and returns a function `(data, index)` that reports where a row sits.\n\nThe returned function must produce an object with exactly these keys:\n\n- `length` — the height of the row at `index`, **not** including any separator.\n- `offset` — the distance from the top of the content to the top of that row: the sum of all earlier row heights, plus one separator for each earlier row (row `index` has `index` separators above it).\n- `index` — the index it was called with, unchanged.\n\nRules:\n\n- If `index` is negative, not an integer, or past the end of `heights`, return `{ length: 0, offset: 0, index }`.\n- `getItemLayout` is called for every visible row on every scroll frame, so do the summing **once** inside `createGetItemLayout` and make each call a lookup, not a loop over `heights`.\n- The `data` argument is what `FlatList` passes through; you do not need it.\n\nThe tests call `runGetItemLayout`, which builds the function and queries it at a list of indices. Leave the driver as it is.",
        starterCode:
          "/**\n * @param {number[]} heights          Height of each row, in render order.\n * @param {number} separatorHeight     Height of the separator drawn between rows.\n * @returns {(data: unknown, index: number) => { length: number, offset: number, index: number }}\n */\nfunction createGetItemLayout(heights, separatorHeight) {\n  // Your code here\n}\n\n// ---- Test driver (leave as is) ----\nfunction runGetItemLayout(heights, separatorHeight, indices) {\n  const getItemLayout = createGetItemLayout(heights, separatorHeight);\n  const data = heights.map((height, id) => ({ id, height }));\n  return indices.map((index) => getItemLayout(data, index));\n}\n",
        functionName: "runGetItemLayout",
        testCases: [
          {
            description: "uniform rows with no separator stack cleanly",
            args: [[60, 60, 60], 0, [0, 1, 2]],
            expected: [
              { length: 60, offset: 0, index: 0 },
              { length: 60, offset: 60, index: 1 },
              { length: 60, offset: 120, index: 2 },
            ],
          },
          {
            description: "variable row heights accumulate",
            args: [[40, 80, 20, 100], 0, [0, 1, 2, 3]],
            expected: [
              { length: 40, offset: 0, index: 0 },
              { length: 80, offset: 40, index: 1 },
              { length: 20, offset: 120, index: 2 },
              { length: 100, offset: 140, index: 3 },
            ],
          },
          {
            description: "separators count towards the offset but not the length",
            args: [[50, 50, 50], 8, [0, 1, 2]],
            expected: [
              { length: 50, offset: 0, index: 0 },
              { length: 50, offset: 58, index: 1 },
              { length: 50, offset: 116, index: 2 },
            ],
          },
          {
            description: "zero-height rows still shift later offsets by their separators",
            args: [[0, 0, 25], 4, [1, 2]],
            expected: [
              { length: 0, offset: 4, index: 1 },
              { length: 25, offset: 8, index: 2 },
            ],
          },
          {
            description: "an empty list reports nothing at index 0",
            args: [[], 0, [0]],
            expected: [{ length: 0, offset: 0, index: 0 }],
            isEdgeCase: true,
          },
          {
            description: "negative and out-of-range indices report as empty",
            args: [[30, 30], 10, [-1, 2, 5]],
            expected: [
              { length: 0, offset: 0, index: -1 },
              { length: 0, offset: 0, index: 2 },
              { length: 0, offset: 0, index: 5 },
            ],
            isEdgeCase: true,
          },
          {
            description: "5,000 rows: the last offset is still exact",
            args: [Array.from({ length: 5000 }, () => 44), 1, [0, 1, 4999]],
            expected: [
              { length: 44, offset: 0, index: 0 },
              { length: 44, offset: 45, index: 1 },
              { length: 44, offset: 224955, index: 4999 },
            ],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "rn-images-assets",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "Images, Assets & Caching",
      summary:
        "Images are the largest thing most apps move and the easiest place to blow a memory budget. React Native distinguishes two cases sharply. A **static asset** is written `require(\"./logo.png\")`, and the path has to be a literal string so Metro can resolve it at build time: that is how it finds the `@2x`/`@3x` variants, knows the intrinsic dimensions (so you need not set a size), and includes the file in the bundle. A **remote image** is `{ uri }` and has none of that — you must give it an explicit width and height, because nothing knows the size until the bytes arrive.\n\nThe core `Image` component makes no promise of a disk cache. `expo-image` exists largely to fix that: memory and disk caching with a controllable `cachePolicy`, a `placeholder` (including a blurhash or thumbhash) that shows instantly, `contentFit` in place of `resizeMode`, a cross-fade `transition`, and prefetching for images you know are about to appear. SDK 57 added explicit cache seeding and reading through `writeToCacheAsync` and `readFromCacheAsync`, which is what you want when an image arrives from somewhere other than an HTTP GET.\n\nTwo failure modes catch experienced people. First, decoded size, not file size, is what occupies memory: a 4000×3000 JPEG is roughly 1.5 MB on disk and roughly 48 MB once decoded to a bitmap, whatever size you display it at — so ask the server or CDN for a rendition near the display size. Second, images in a recycled list flicker or briefly show the previous row's picture, because the view is reused before the new source has loaded; a stable cache key, a placeholder, and a recycling key tied to item identity are the fixes. App icons and splash screens are a separate concern, configured in the app config and generated into the native projects at prebuild — not something you render.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "React Native: Images", url: "https://reactnative.dev/docs/images", kind: "docs" },
        { label: "Expo: expo-image reference", url: "https://docs.expo.dev/versions/latest/sdk/image/", kind: "docs" },
        { label: "Expo: Adding assets to your app", url: "https://docs.expo.dev/develop/user-interface/assets/", kind: "docs" },
      ],
      video: {
        title: "How to handle Images in React Native",
        channel: "Hitesh Choudhary",
        url: "https://www.youtube.com/watch?v=zI69kpGoFRI",
        videoId: "zI69kpGoFRI",
        durationLabel: "18:08",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "rn-images-assets-q1",
          prompt: "Why must the path in `require(\"./logo.png\")` be a literal string rather than a variable?",
          options: [
            "Metro resolves asset references statically at build time, to bundle the file and read its dimensions",
            "The native image loader cannot handle runtime paths",
            "A computed path would break Fast Refresh",
            "It is only a lint rule; a variable works fine at runtime",
          ],
          correctIndex: 0,
          explanation:
            "Bundling is static analysis: if the path is computed, the bundler has nothing to follow and the asset is never included. It is a hard requirement, not a convention.",
        },
        {
          id: "rn-images-assets-q2",
          prompt: "A remote image renders as a zero-sized box. What is the most likely cause?",
          options: [
            "No explicit width and height were set, and a remote image's intrinsic size is unknown at layout time",
            "The URL uses HTTPS, which the image loader blocks by default",
            "`resizeMode` was not set, so it defaults to `none`",
            "Remote images need `require()` like local ones",
          ],
          correctIndex: 0,
          explanation:
            "Static assets carry their dimensions from build time; a URI does not, so layout has nothing to size the view with until you supply it. HTTPS is the encouraged scheme, not a blocked one.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-images-assets-q3",
          prompt: "A 4000×3000 JPEG is 1.5 MB on disk and is displayed in a 100×75 thumbnail. Roughly how much memory does decoding it take?",
          options: [
            "Tens of megabytes, because memory is governed by the decoded pixel buffer, not the file size",
            "About 1.5 MB, the same as the file",
            "About 30 KB, matching the displayed size",
            "None: the decoder downsamples to the display size automatically",
          ],
          correctIndex: 0,
          explanation:
            "4000 × 3000 × 4 bytes per pixel is roughly 48 MB regardless of display size. This is why a grid of \"small\" thumbnails served at full resolution is a reliable way to get killed for memory pressure.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-images-assets-q4",
          prompt: "Which problems does `expo-image` address that the core `Image` component does not? (Select all that apply.)",
          options: [
            "A configurable memory and disk cache policy",
            "A `placeholder` that can be a blurhash shown before the image loads",
            "A cross-fade `transition` when the source changes",
            "Resizing the source file on the server",
            "Removing the need to declare a size for a remote image",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Caching, placeholders and transitions are the headline reasons to use it. It cannot change what the server sends, and layout still needs a size for a remote source.",
        },
        {
          id: "rn-images-assets-q5",
          prompt: "How does the `logo.png` / `logo@2x.png` / `logo@3x.png` convention work?",
          options: [
            "All the variants ship, and the platform picks the one matching the device's pixel density at runtime",
            "Only the `@3x` version ships and is downscaled as needed",
            "One is chosen at build time based on the target platform",
            "You require each one explicitly and branch on `PixelRatio.get()`",
          ],
          correctIndex: 0,
          explanation:
            "The suffix convention lets a single `require` resolve to a density-appropriate file on device. Shipping only `@3x` wastes bundle size and decode memory on lower-density screens.",
        },
        {
          id: "rn-images-assets-q6",
          prompt: "Rows in a recycled list briefly show the previous row's photo. What is going on?",
          options: [
            "The view is reused before the new source finishes loading, so the old decoded image is still attached",
            "The list re-sorts the data on every scroll frame",
            "The image cache returns a stale entry for the new URL",
            "`keyExtractor` is missing, so React remounts every row",
          ],
          correctIndex: 0,
          explanation:
            "Recycling hands an existing view new props; until the new bytes are decoded, the old content is what is on screen. A placeholder plus a recycling key tied to item identity clears it immediately.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-images-assets-q7",
          prompt: "When is prefetching an image worth it?",
          options: [
            "Ahead of a screen transition, to warm the cache for images the next screen will show",
            "For every image in a long list, at mount time",
            "Instead of setting width and height, since prefetching reveals the size",
            "Only for local assets, which are otherwise loaded lazily",
          ],
          correctIndex: 0,
          explanation:
            "Prefetching pays off when you can predict what is about to be needed. Prefetching an entire list defeats virtualization by downloading and decoding everything, and local assets are already in the bundle.",
        },
        {
          id: "rn-images-assets-q8",
          prompt: "What is the difference between `resizeMode` on core `Image` and `contentFit` on `expo-image`?",
          options: [
            "They express the same idea, but `contentFit` follows the CSS `object-fit` vocabulary (`cover`, `contain`, `fill`, `none`, `scale-down`)",
            "`contentFit` resizes the underlying file, while `resizeMode` only crops the view",
            "`contentFit` applies before decoding and therefore saves memory",
            "`resizeMode` is deprecated and removed from core React Native",
          ],
          correctIndex: 0,
          explanation:
            "It is a naming alignment with the web, not a different mechanism. Neither prop changes the source file or the decoded buffer, and `resizeMode` is still part of core `Image`.",
        },
        {
          id: "rn-images-assets-q9",
          prompt: "Where do an Expo app's icon and splash screen come from?",
          options: [
            "The app config, applied to the native projects at prebuild — they are not components you render",
            "A `<SplashScreen />` component mounted at the root of `app/_layout.tsx`",
            "The first image `require`d in the entry file",
            "An EAS Build setting configured in the Expo dashboard",
          ],
          correctIndex: 0,
          explanation:
            "Icons and splash screens are native resources generated from the app config when the native projects are built. `expo-splash-screen` only controls when the native splash is hidden; it does not draw it.",
        },
      ],
    },
    {
      id: "rn-platform-specific-code",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "Platform-Specific Code",
      summary:
        "\"Learn once, write anywhere\" was never \"write once, run anywhere\". Some of your app should differ per platform, and React Native gives you two tools with quite different costs.\n\nThe runtime tool is the `Platform` module. `Platform.OS` is `\"ios\"` or `\"android\"`, and `\"web\"`, `\"macos\"` or `\"windows\"` on those targets. `Platform.select(spec)` resolves in priority order: the exact platform key, then `native` (which every native platform matches but web does not), then `default`. `Platform.Version` is deliberately inconsistent and catches people out: on iOS it is a **string** like `\"18.2\"` that you have to `parseInt`, and on Android it is a **number** that is the API level, not the marketing version.\n\nThe build-time tool is the platform file extension. `Button.ios.tsx` and `Button.android.tsx` beside an import of `./Button` let Metro pick the right file per bundle, and `.native.tsx` covers both native platforms as distinct from a web bundler's `.tsx`. This is almost always the better choice when the difference is structural, because the other platform's implementation — and everything it imports — never enters the bundle at all. A runtime `if (Platform.OS === \"ios\")` ships both branches, and both dependency trees, to both platforms.\n\nThe gotcha to design around is that `Platform.select` looks keys up by presence, not truthiness. A key explicitly set to `null`, `0` or `false` is chosen and does **not** fall through to `native` or `default` — which is exactly what you want when you mean \"no shadow on Android\", and exactly what surprises people expecting `??`-style behaviour. Keep the branching shallow, too: a component with five scattered `Platform.OS` checks is two components wearing a trench coat.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "React Native: Platform-Specific Code", url: "https://reactnative.dev/docs/platform-specific-code", kind: "docs" },
        { label: "React Native: Platform module reference", url: "https://reactnative.dev/docs/platform", kind: "docs" },
        { label: "Expo Router: Platform-specific modules", url: "https://docs.expo.dev/router/advanced/platform-specific-modules/", kind: "docs" },
      ],
      video: {
        title: "Platform Specific Components, Layouts & Styling with React Native (iOS, Android & Web)",
        channel: "Simon Grimm",
        url: "https://www.youtube.com/watch?v=b8hKskhFt04",
        videoId: "b8hKskhFt04",
        durationLabel: "17:20",
      },
      alternateVideos: [
        {
          title: "Top 6 React Native Tips to Survive 2026",
          channel: "Code with Beto",
          url: "https://www.youtube.com/watch?v=zMM0d1d1_X4",
          videoId: "zMM0d1d1_X4",
          startSeconds: 239,
          chapterLabel: "Use platform file extensions, not runtime checks",
          durationLabel: "13:55",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `platformSelect(os, spec)`, a faithful reimplementation of React Native's `Platform.select`.\n\nGiven the current platform `os` (one of `\"ios\"`, `\"android\"`, `\"web\"`, `\"macos\"` or `\"windows\"`) and a `spec` object, return the most specific matching value, checking in this order:\n\n1. The key equal to `os`.\n2. The key `\"native\"` — but only when `os` is **not** `\"web\"`.\n3. The key `\"default\"`.\n\nIf none of those keys is present, return `undefined`.\n\nThe critical detail: a key counts as present when the object **has** it, even if its value is `null`, `0`, `false` or an empty string. `spec = { ios: null, default: \"x\" }` on iOS must return `null`, not `\"x\"`. Use an own-property check, not a truthiness check.\n\nReturn the value exactly as stored — do not clone or transform it. Treat a missing or `null` `spec` as having no keys.",
        starterCode:
          "/**\n * @param {\"ios\"|\"android\"|\"web\"|\"macos\"|\"windows\"} os\n * @param {Record<string, unknown>} spec\n * @returns {unknown} the selected value, or undefined when nothing matches\n */\nfunction platformSelect(os, spec) {\n  // Your code here\n}\n",
        functionName: "platformSelect",
        testCases: [
          {
            description: "an exact platform key beats `native` and `default`",
            args: ["ios", { ios: "A", native: "B", default: "C" }],
            expected: "A",
          },
          {
            description: "with no platform key, a native platform falls back to `native`",
            args: ["android", { ios: "A", native: "B", default: "C" }],
            expected: "B",
          },
          {
            description: "web skips `native` and lands on `default`",
            args: ["web", { ios: "A", native: "B", default: "C" }],
            expected: "C",
          },
          {
            description: "macos counts as a native platform",
            args: ["macos", { native: "B", default: "C" }],
            expected: "B",
          },
          {
            description: "object values come back as they are",
            args: ["ios", { ios: { backgroundColor: "red" }, default: { backgroundColor: "blue" } }],
            expected: { backgroundColor: "red" },
          },
          {
            description: "a key present with value `null` is selected and does not fall through",
            args: ["ios", { ios: null, default: "C" }],
            expected: null,
            isEdgeCase: true,
          },
          {
            description: "a falsy `0` is selected and does not fall through to `native`",
            args: ["android", { android: 0, native: 9 }],
            expected: 0,
            isEdgeCase: true,
          },
          {
            description: "nothing matches, so the result is undefined",
            args: ["web", { ios: "A", native: "B" }],
            expected: undefined,
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "rn-native-modules",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "Native Modules & the Expo Modules API",
      summary:
        "Most of the time you should not write a native module. Someone has already wrapped the camera, the keychain, Bluetooth and the file system, and a wrapper you maintain yourself is a wrapper you have to keep building for two platforms every time the OS changes. The honest reasons to write one are: an SDK your company depends on that nobody has wrapped, work that must run off the JavaScript thread for performance, and access to a platform API that has no JavaScript surface at all.\n\nThere are two ways to do it. A **TurboModule** is React Native's own mechanism: you write a typed spec, Codegen generates the C++/Objective-C/Kotlin glue, and the module is exposed through JSI — instantiated lazily on first use, callable synchronously, with argument types checked at build time instead of failing as a runtime crash. A **pure C++ TurboModule** skips the platform layer entirely and shares one implementation across both platforms, which is the right shape for logic rather than OS integration.\n\nThe **Expo Modules API** is the higher-level alternative: Swift and Kotlin instead of Objective-C++ and JNI, a small declarative DSL (`Function`, `AsyncFunction`, `Property`, `View`, `Events`), and — importantly — the module ships with a **config plugin** so consumers get the native configuration (permissions strings, manifest entries, Gradle changes) without hand-editing anything. It works in any React Native app, not just Expo-managed ones.\n\nThe cost that surprises people is not the writing, it is the lifetime. A native module pins you to a build: it cannot be shipped over the air, it breaks when the platform SDK changes, it needs CI that can build both platforms, and it is the reason your Expo SDK upgrade takes a week. The cheapest native module is the one you replace with an existing library, and the second cheapest is the smallest possible surface area — return plain data, keep the API narrow, and put the logic in JavaScript.",
      level: "advanced",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "React Native: Turbo Native Modules introduction", url: "https://reactnative.dev/docs/turbo-native-modules-introduction", kind: "docs" },
        { label: "React Native: Pure C++ Turbo Native Modules", url: "https://reactnative.dev/docs/the-new-architecture/pure-cxx-modules", kind: "docs" },
        { label: "Expo: Expo Modules API overview", url: "https://docs.expo.dev/modules/overview/", kind: "docs" },
        { label: "Expo: Module API reference", url: "https://docs.expo.dev/modules/module-api/", kind: "docs" },
      ],
      video: {
        title: "How to create a native module with the Expo modules API",
        channel: "Expo",
        url: "https://www.youtube.com/watch?v=CdaQSlyGik8",
        videoId: "CdaQSlyGik8",
        durationLabel: "19:08",
      },
      alternateVideos: [
        {
          title: "Building React Native TurboModules with Swift - Complete Tutorial",
          channel: "Oskar Kwaśniewski",
          url: "https://www.youtube.com/watch?v=cMAgfQ6Fz9U",
          videoId: "cMAgfQ6Fz9U",
          durationLabel: "17:47",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "rn-native-modules-q1",
          prompt: "What does Codegen produce for a TurboModule?",
          options: [
            "The native interfaces and JavaScript bindings derived from your typed spec, so a mismatch is a build error",
            "An optimised Hermes bytecode bundle for the module's JavaScript",
            "A config plugin that wires the module into `app.json`",
            "A mock implementation used by Jest",
          ],
          correctIndex: 0,
          explanation:
            "The spec is the single source of truth and Codegen emits the glue for both sides from it. That is what turns a historically runtime-only type failure into a compile-time one.",
        },
        {
          id: "rn-native-modules-q2",
          prompt: "Which of these are legitimate reasons to write your own native module? (Select all that apply.)",
          options: [
            "A vendor SDK your company must integrate that nobody has wrapped for React Native",
            "Work that must run off the JavaScript thread to keep the UI responsive",
            "A platform API with no existing JavaScript surface",
            "Making an existing JavaScript library run faster by rewriting it in Kotlin",
            "Avoiding a dependency because the team dislikes its API",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are genuine capability gaps. Rewriting working JavaScript in Kotlin buys a permanent two-platform maintenance cost for a speedup you have not measured, and taste is not worth a native module.",
        },
        {
          id: "rn-native-modules-q3",
          prompt: "What is the main practical advantage of the Expo Modules API over writing a TurboModule by hand?",
          options: [
            "Swift and Kotlin with a small declarative DSL, plus a config plugin so consumers get the native setup automatically",
            "It generates JavaScript that runs without any native code at all",
            "It is the only approach compatible with the New Architecture",
            "Modules built with it can be shipped over the air, unlike TurboModules",
          ],
          correctIndex: 0,
          explanation:
            "Modern languages plus automatic consumer configuration is the pitch. Native code is native code — both approaches need a build, and both work on the New Architecture.",
        },
        {
          id: "rn-native-modules-q4",
          prompt: "Your app adds a native module and the team asks whether the next release can go out over the air. What is the correct answer?",
          options: [
            "No — new native code has to ship in a new binary, so a store build is required",
            "Yes, as long as the module's JavaScript wrapper is unchanged",
            "Yes, because `expo-updates` bundles native modules alongside the JavaScript",
            "Only on Android; iOS requires a store review either way",
          ],
          correctIndex: 0,
          explanation:
            "Over-the-air updates carry JavaScript and assets, never compiled native code. Adding a native module changes the native layer, which means a new build and a new runtime version.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-native-modules-q5",
          prompt: "When is a **pure C++** TurboModule the right shape?",
          options: [
            "When the work is platform-independent logic, so one implementation serves both platforms with no Swift or Kotlin",
            "When you need to render a native view",
            "When the module must access iOS-only frameworks",
            "When you want the module to be usable from Expo Go",
          ],
          correctIndex: 0,
          explanation:
            "Pure C++ removes the per-platform layer entirely, which is ideal for computation or a cross-platform C library. Views and OS-specific frameworks still need the platform layer, and nothing you write can be added to Expo Go.",
        },
        {
          id: "rn-native-modules-q6",
          prompt: "Why does a native module make an Expo SDK upgrade harder?",
          options: [
            "It is built against a specific React Native and platform SDK, so each upgrade may need the native code changed and rebuilt on both platforms",
            "Expo refuses to upgrade projects containing third-party native code",
            "Native modules are recompiled from source on every app launch",
            "It forces the project to stop using Continuous Native Generation",
          ],
          correctIndex: 0,
          explanation:
            "The module is coupled to the native ABI and toolchain of the version it was written against, so each bump is real work. Nothing about it blocks upgrades or disables CNG — it just makes them expensive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-native-modules-q7",
          prompt: "What is the role of a config plugin shipped alongside a native module?",
          options: [
            "It applies the module's required native configuration during prebuild, so consumers do not hand-edit native project files",
            "It registers the module with the TurboModule registry at runtime",
            "It generates the TypeScript types consumers import",
            "It uploads the module's binary artefacts to EAS",
          ],
          correctIndex: 0,
          explanation:
            "Permissions strings, manifest entries and Gradle changes belong in a plugin so they survive every regeneration. Registration is Codegen's job and types come from the spec.",
        },
        {
          id: "rn-native-modules-q8",
          prompt: "Which API-design choices keep a native module cheap to maintain? (Select all that apply.)",
          options: [
            "Returning plain serializable data rather than native object handles",
            "Keeping the exposed surface as small as the use case allows",
            "Putting orchestration and business logic in JavaScript, not in the native layer",
            "Exposing every method of the underlying SDK so the JavaScript side is never blocked",
            "Making every method synchronous, since JSI allows it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A narrow, data-shaped boundary is what you can change without touching two platforms. Mirroring a whole SDK doubles the surface you maintain, and synchronous calls block the JavaScript thread even though JSI permits them.",
        },
        {
          id: "rn-native-modules-q9",
          prompt: "A library documented for React Native 0.6x crashes on launch on a current version with a native registration error. What is going on?",
          options: [
            "It was written for the legacy bridge module system, which no longer exists",
            "Metro cannot resolve its `main` entry point",
            "Its JavaScript uses syntax Hermes cannot parse",
            "It needs a `newArchEnabled=false` flag that current versions still support",
          ],
          correctIndex: 0,
          explanation:
            "Bridge-era modules register through a mechanism that has been deleted, so they fail as soon as they are touched. There is no flag to bring it back on current versions.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "rn-animations-gestures",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "Reanimated, Gestures & the UI Thread",
      summary:
        "Animation on native is a threading problem before it is an API problem. Your React code runs on the JavaScript thread; the screen is composited on the UI thread. If an animation's every frame has to be computed in JavaScript and handed over, then any expensive render, JSON parse or list commit stutters the animation — and on mobile, a stuttering gesture reads as a broken app.\n\nThe core `Animated` API's answer is `useNativeDriver: true`, which serialises the whole animation description up front so native can run it without further JavaScript. The catch is that it only works for properties the native side can change without re-running layout: `transform` and `opacity`, not `width`, `height` or `flex`. Animating layout properties with the native driver is not slow, it is unsupported.\n\n**Reanimated** solves it differently, with **worklets**: functions marked `\"worklet\"` that the Babel plugin (`react-native-worklets/plugin`) compiles so they can run on the UI thread. State lives in **shared values** (`useSharedValue`, read and written through `.value`) that both threads can see, and `useAnimatedStyle` recomputes style on the UI thread every frame. `runOnJS` is how a worklet calls back into React, and it is the boundary people forget — calling `setState` directly from a worklet is a crash, not a slow path. Reanimated 4 requires the New Architecture and splits worklets into a separate `react-native-worklets` package you install explicitly.\n\n**Gesture Handler** replaces React Native's JavaScript responder system with native recognisers, so a pan or pinch is tracked on the UI thread and composes with Reanimated worklets with no round trip. Gestures are built with `Gesture.Pan()`, `Gesture.Tap()` and friends, combined with `Gesture.Simultaneous`, `Gesture.Race` and `Gesture.Exclusive`, and the tree must be wrapped in a `GestureHandlerRootView`. The classic bug is a pan that works in the simulator and drops frames on a mid-range Android device, because the handler's callback was never a worklet and every frame made the round trip after all.",
      level: "advanced",
      estMinutes: 65,
      webRefs: [
        { label: "Reanimated: Glossary of terms (worklets, shared values, UI thread)", url: "https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/glossary/", kind: "docs" },
        { label: "Reanimated: Your first animation", url: "https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/your-first-animation/", kind: "docs" },
        { label: "React Native Gesture Handler: Documentation", url: "https://docs.swmansion.com/react-native-gesture-handler/docs/", kind: "docs" },
        { label: "React Native: Animations (Animated & useNativeDriver)", url: "https://reactnative.dev/docs/animations", kind: "docs" },
      ],
      video: {
        title: "React Native Animations just got WAY EASIER (Reanimated v4)",
        channel: "Simon Grimm",
        url: "https://www.youtube.com/watch?v=QgCLSR9EbDc",
        videoId: "QgCLSR9EbDc",
        durationLabel: "11:01",
      },
      alternateVideos: [
        {
          title: "Introducing React Native Reanimated 4",
          channel: "Software Mansion",
          url: "https://www.youtube.com/watch?v=Wr2fOM_xD2I",
          videoId: "Wr2fOM_xD2I",
          durationLabel: "5:53",
        },
        {
          title: "Swiping — React Native Gestures and Animations",
          channel: "William Candillon",
          url: "https://www.youtube.com/watch?v=1j-g21kKc3s",
          videoId: "1j-g21kKc3s",
          durationLabel: "33:23",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "rn-animations-gestures-q1",
          prompt: "What is a worklet?",
          options: [
            "A JavaScript function compiled so it can run on the UI thread, separately from the main JavaScript context",
            "A Web Worker that React Native spawns for background work",
            "A native module written in C++ and exposed through JSI",
            "A memoised component that skips re-rendering during animation",
          ],
          correctIndex: 0,
          explanation:
            "The Babel plugin extracts marked functions so the UI thread's runtime can execute them each frame. It is not a Web Worker and not a native module, though it exists so that animation logic never waits for the JavaScript thread.",
        },
        {
          id: "rn-animations-gestures-q2",
          prompt: "Why does `useNativeDriver: true` refuse to animate `width`?",
          options: [
            "The native driver only handles properties that can change without re-running layout, so it supports `transform` and `opacity`",
            "`width` animations are always handled by Yoga and cannot be driven at all",
            "It works but silently falls back to the JavaScript driver",
            "It is a bug that was fixed in the New Architecture",
          ],
          correctIndex: 0,
          explanation:
            "The whole point is to run frames without touching JavaScript, which is only possible for properties that do not invalidate layout. It throws rather than falling back, and the limitation is by design.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-animations-gestures-q3",
          prompt: "What happens if a worklet calls `setCount(count + 1)` directly?",
          options: [
            "It fails, because React state updates must be marshalled back with `runOnJS`",
            "It works, but the update is delayed until the next frame",
            "It works and is the recommended way to sync animation state",
            "It silently does nothing in release builds only",
          ],
          correctIndex: 0,
          explanation:
            "A worklet runs in a separate runtime that cannot touch React's. `runOnJS(setCount)(next)` is the supported boundary — and you should cross it rarely, because each crossing costs a hop.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-animations-gestures-q4",
          prompt: "Which statements about Reanimated 4 are true? (Select all that apply.)",
          options: [
            "It works only with the New Architecture (Fabric)",
            "`react-native-worklets` is a separate package that must be installed",
            "The Babel plugin is `react-native-worklets/plugin`",
            "It removes the need for `react-native-gesture-handler`",
            "Shared values are read with a hook rather than a `.value` property",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Version 4 dropped the legacy architecture and split worklets into their own package with its own plugin. Gesture Handler is still the gesture layer, and shared values are still accessed through `.value`.",
        },
        {
          id: "rn-animations-gestures-q5",
          prompt: "What is a shared value?",
          options: [
            "A mutable container readable and writable from both the JavaScript and UI threads, usually driving `useAnimatedStyle`",
            "A React context value shared between animated components",
            "A native constant exposed by the animation module at startup",
            "A memoised style object cached across renders",
          ],
          correctIndex: 0,
          explanation:
            "Shared values are the data channel between the two runtimes; writing `.value` from either side is what makes a frame-by-frame animation possible without re-rendering React.",
        },
        {
          id: "rn-animations-gestures-q6",
          prompt: "Why does Gesture Handler exist when React Native already has `PanResponder`?",
          options: [
            "Gestures are recognised natively on the UI thread, so tracking stays smooth even when the JavaScript thread is busy",
            "`PanResponder` cannot detect multi-touch gestures",
            "It is the only way to get a tap handler on Android",
            "It replaces the need for `Pressable`",
          ],
          correctIndex: 0,
          explanation:
            "`PanResponder` runs recognition in JavaScript, so a busy thread means a laggy drag. Gesture Handler delegates to native recognisers, which is also why it composes cleanly with Reanimated worklets.",
        },
        {
          id: "rn-animations-gestures-q7",
          prompt: "A drag is smooth in the iOS simulator and drops frames on a mid-range Android device. What is the most likely cause?",
          options: [
            "The gesture callback is not a worklet, so every frame round-trips to the JavaScript thread",
            "Android caps animations at 30 fps unless high refresh is requested",
            "`GestureHandlerRootView` is missing, which halves the event rate",
            "The simulator runs a different version of Gesture Handler",
          ],
          correctIndex: 0,
          explanation:
            "A desktop-class simulator hides the cost of the round trip; a real mid-range device does not. Without `GestureHandlerRootView` gestures typically do not fire at all rather than firing slowly.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-animations-gestures-q8",
          prompt: "A horizontal pan inside a vertical `ScrollView` fights with the scroll. Which Gesture Handler concept addresses it?",
          options: [
            "Gesture composition and relations — `Gesture.Simultaneous`, `Gesture.Race` and `Gesture.Exclusive` decide which recogniser wins",
            "Setting `zIndex` so the pan handler is on top",
            "Wrapping the pan in a second `GestureHandlerRootView`",
            "Disabling the native driver on the scroll view",
          ],
          correctIndex: 0,
          explanation:
            "Conflicts between recognisers are resolved by declaring their relationship, which is exactly what the composition API is for. Nesting root views is wrong and stacking order does not affect gesture arbitration.",
        },
        {
          id: "rn-animations-gestures-q9",
          prompt: "Which work belongs on the UI thread rather than the JavaScript thread? (Select all that apply.)",
          options: [
            "Mapping a pan's translation to a card's `transform` every frame",
            "Interpolating a scroll offset into a header's opacity",
            "Deciding, at the end of a swipe, whether it passed the dismissal threshold",
            "Fetching the next page of results when the swipe completes",
            "Persisting the reordered list to the server",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that must produce a value for the current frame belongs in a worklet. Network calls and persistence are one-off side effects that belong on the JavaScript thread via `runOnJS`.",
        },
        {
          id: "rn-animations-gestures-q10",
          prompt: "What does `useAnimatedStyle` return, and where does its body run?",
          options: [
            "A style object that Reanimated updates on the UI thread; the body is a worklet re-evaluated per frame, not per React render",
            "A memoised style object recomputed whenever React re-renders the component",
            "A native style handle that must be passed to `Animated.createAnimatedComponent`",
            "A promise that resolves once the animation completes",
          ],
          correctIndex: 0,
          explanation:
            "The hook body is a worklet, so it runs on the UI thread every frame that its shared values change — which is precisely why animating through it does not cost React renders.",
        },
      ],
    },
    {
      id: "rn-forms-keyboard",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "Text Input, Forms & Keyboard Handling",
      summary:
        "Forms on mobile are harder than on the web for one reason: the keyboard is a large, animated window that appears on top of your layout and is managed by the OS, not by you. A form that looks fine in a screenshot can have its submit button permanently hidden under the keyboard on a small device.\n\n`TextInput` is controlled the way you expect (`value` plus `onChangeText`), but the props that matter most are the ones that tell the OS what kind of input this is. `keyboardType` picks the keypad, `returnKeyType` labels the return key, `autoCapitalize` and `autoCorrect` stop it \"helpfully\" mangling an email address, `secureTextEntry` masks a password, and `autoComplete`/`textContentType` are what let the password manager fill credentials and the OS autofill a one-time code from a text message. Skipping them is the difference between a form people complete and one they abandon.\n\nAvoiding the keyboard is the layout problem. `KeyboardAvoidingView` needs different `behavior` values per platform — usually `\"padding\"` on iOS, while Android often handles it through the window's soft-input mode and needs no behavior or a different one — which is why nearly every real app ends up on `react-native-keyboard-controller` for a consistent, animated result. Two smaller fixes solve most of the remaining complaints: `keyboardShouldPersistTaps=\"handled\"` on the scroll container, so a tap on the submit button registers instead of being swallowed by the tap that dismisses the keyboard; and chaining focus with refs plus `onSubmitEditing`, so the return key moves down the form.\n\nThe gotcha that separates experience levels is the controlled-input race. `TextInput` echoes keystrokes natively and *then* waits for `value` to come back from React. If that round trip is slow — an expensive re-render, a validation pass, a debounce implemented wrongly — fast typing drops or reorders characters. The fix is to keep the input's own render cheap, keep the state that drives it local, and push validation and side effects out of the keystroke path.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "React Native: TextInput", url: "https://reactnative.dev/docs/textinput", kind: "docs" },
        { label: "React Native: KeyboardAvoidingView", url: "https://reactnative.dev/docs/keyboardavoidingview", kind: "docs" },
        { label: "React Native: Keyboard module", url: "https://reactnative.dev/docs/keyboard", kind: "docs" },
      ],
      video: {
        title: "Keyboard Handling tutorial for React Native apps",
        channel: "Expo",
        url: "https://www.youtube.com/watch?v=Y51mDfAhd4E",
        videoId: "Y51mDfAhd4E",
        durationLabel: "32:51",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "rn-forms-keyboard-q1",
          prompt: "A submit button inside a `ScrollView` needs two taps while the keyboard is open: the first only dismisses the keyboard. What fixes it?",
          options: [
            "`keyboardShouldPersistTaps=\"handled\"` on the scroll container",
            "`keyboardDismissMode=\"on-drag\"` on the scroll container",
            "Calling `Keyboard.dismiss()` in the button's `onPressIn`",
            "Wrapping the button in a `KeyboardAvoidingView`",
          ],
          correctIndex: 0,
          explanation:
            "By default the first tap is consumed by dismissing the keyboard. `\"handled\"` lets the tap reach a child that handles it while still dismissing on taps that nothing handles.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-forms-keyboard-q2",
          prompt: "Which props actually change what the OS does for the user, rather than just how the field looks? (Select all that apply.)",
          options: [
            "`keyboardType`, which selects the keypad layout",
            "`autoComplete` / `textContentType`, which enable password-manager fill and SMS code autofill",
            "`autoCapitalize` and `autoCorrect`, which stop the OS rewriting the value",
            "`placeholder`, which describes the expected value",
            "`style`, which sets the font size",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three are instructions to the platform's text system. A placeholder and a style are purely presentational — useful, but they change nothing about the OS behaviour.",
        },
        {
          id: "rn-forms-keyboard-q3",
          prompt: "Why does `KeyboardAvoidingView` usually need a different `behavior` on iOS and Android?",
          options: [
            "The platforms resize or pan the app window differently when the keyboard appears, so the same behavior does not fit both",
            "Android does not report keyboard height, so the component cannot work there",
            "iOS applies the behavior at layout time and Android at paint time",
            "`behavior` is ignored on Android and exists only for API symmetry",
          ],
          correctIndex: 0,
          explanation:
            "On Android the window's soft-input mode often already resizes the layout, so adding padding double-counts; on iOS nothing resizes for you. That inconsistency is why the community gravitated to a dedicated keyboard library.",
        },
        {
          id: "rn-forms-keyboard-q4",
          prompt: "Fast typing in a controlled `TextInput` drops characters on a mid-range Android device. What is the mechanism?",
          options: [
            "The native field echoes keystrokes immediately but then waits for `value` to return from React; a slow render lets the value lag behind the input",
            "Android's keyboard coalesces keystrokes when an app is busy",
            "`onChangeText` is throttled to 60 Hz by React Native",
            "Controlled inputs are unsupported on Android and must be uncontrolled",
          ],
          correctIndex: 0,
          explanation:
            "Controlling the value makes React's render latency part of the typing loop. Keeping the field's state local and moving validation out of the keystroke path is the fix, not abandoning controlled inputs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-forms-keyboard-q5",
          prompt: "How do you make the return key move focus to the next field?",
          options: [
            "Hold a ref to the next input and call `.focus()` from the current field's `onSubmitEditing`, with `returnKeyType=\"next\"`",
            "Set `tabIndex` on each input, as on the web",
            "Set `blurOnSubmit={false}` and React Native advances focus automatically",
            "Wrap the fields in a `<Form>` component, which handles focus order",
          ],
          correctIndex: 0,
          explanation:
            "There is no tab order on mobile, so focus chaining is explicit. `blurOnSubmit={false}` stops the keyboard flickering between fields but does not move focus by itself, and there is no built-in `Form`.",
        },
        {
          id: "rn-forms-keyboard-q6",
          prompt: "What is `Keyboard.addListener(\"keyboardDidShow\", ...)` good for?",
          options: [
            "Reacting to the keyboard's real height and animation, for example to resize a custom footer",
            "Intercepting individual keystrokes before they reach the input",
            "Preventing the keyboard from appearing for a read-only field",
            "Detecting which language the keyboard is set to",
          ],
          correctIndex: 0,
          explanation:
            "The `Keyboard` module reports show/hide events and geometry, which is what you need for custom avoidance. It is not a key-event API — use `editable={false}` to suppress the keyboard.",
        },
        {
          id: "rn-forms-keyboard-q7",
          prompt: "Which is the right way to collect a one-time passcode sent by SMS?",
          options: [
            "Give the input the autofill hint for one-time codes so the OS offers the code from the message",
            "Poll the clipboard on an interval and parse anything that looks like a code",
            "Read the SMS inbox directly through a native module",
            "Ask the user to switch apps and copy the code manually",
          ],
          correctIndex: 0,
          explanation:
            "Both platforms surface OTP autofill when the field declares itself as one. Clipboard polling triggers privacy warnings, and reading SMS needs a permission stores treat as high-risk.",
        },
        {
          id: "rn-forms-keyboard-q8",
          prompt: "Why do teams reach for `react-native-keyboard-controller` instead of `KeyboardAvoidingView`?",
          options: [
            "It gives consistent, frame-synced behaviour across platforms, including following the keyboard's own animation",
            "`KeyboardAvoidingView` was removed from React Native core",
            "It is the only way to dismiss the keyboard programmatically",
            "It eliminates the need for a `ScrollView` around a long form",
          ],
          correctIndex: 0,
          explanation:
            "The core component works but leaves the per-platform tuning to you and cannot track the keyboard's animation curve. It is still in core, and `Keyboard.dismiss()` needs no library.",
        },
        {
          id: "rn-forms-keyboard-q9",
          prompt: "A password field shows suggestions from the dictionary and capitalises the first letter. What is wrong?",
          options: [
            "`autoCorrect` and `autoCapitalize` were left at their defaults instead of being disabled",
            "`secureTextEntry` is not supported on that platform",
            "The field is missing a `keyboardType` of `\"password\"`",
            "The OS applies corrections to all fields and cannot be stopped",
          ],
          correctIndex: 0,
          explanation:
            "Correction and capitalisation are opt-out, not opt-in. There is no `\"password\"` keyboard type — masking is `secureTextEntry`, and it does not by itself disable correction on every platform.",
        },
      ],
    },
    {
      id: "rn-networking-offline",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "Networking & Offline-First Data",
      summary:
        "A mobile app is a client on a hostile network. It goes through tunnels, switches from Wi-Fi to cellular mid-request, gets suspended by the OS with requests in flight, and is resumed hours later with stale state. \"Offline\" is not a rare state you handle with an error screen; it is a normal part of the session.\n\nThe primitives are familiar — `fetch` and `XMLHttpRequest` are both implemented, and `AbortController` works — but the defaults are wrong for mobile. There is no timeout unless you add one, a request that resolves while the app is backgrounded may deliver its result into a screen that is gone, and retrying blindly on a flaky connection turns one failed request into a burst. `NetInfo` tells you the connection type and, more usefully, whether the internet is actually *reachable*, which is not the same as having an interface up: a captive portal reports a perfectly healthy Wi-Fi connection and drops everything.\n\nThe practical architecture is a cache-first query layer plus an outbox. TanStack Query is the common answer for reads: serve the cached value immediately, revalidate in the background, persist the cache so a cold start is not a blank screen, and wire its online manager to `NetInfo` so it retries when connectivity actually returns. Writes are the harder half. A mutation made offline has to be queued, replayed in order, and reconciled with what the server did in the meantime; optimistic updates mean the UI is showing a state the server has not agreed to yet.\n\nThe subtlety worth internalising is that a naive queue replays history rather than intent. A user who creates a note, edits it four times and then deletes it while offline should send **nothing**, not six requests ending in a `404`. Collapsing queued writes per entity before replaying them — merging updates, cancelling a create that was later deleted — is what separates a sync layer that works from one that generates support tickets.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "React Native: Networking", url: "https://reactnative.dev/docs/network", kind: "docs" },
        { label: "TanStack Query: React Native", url: "https://tanstack.com/query/latest/docs/framework/react/react-native", kind: "docs" },
        { label: "TanStack Query: persistQueryClient", url: "https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient", kind: "docs" },
        { label: "react-native-netinfo", url: "https://github.com/react-native-netinfo/react-native-netinfo", kind: "repo" },
      ],
      video: {
        title: "Devlin Duldulao – TanStack Query in Expo Apps: Improving DX and UX Like No Other | App.js Conf 2025",
        channel: "Software Mansion",
        url: "https://www.youtube.com/watch?v=QTQm4TbarsI",
        videoId: "QTQm4TbarsI",
        durationLabel: "19:23",
      },
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `coalesceOutbox(ops)`: collapse a queue of offline writes into the smallest set of requests that produces the same final state.\n\n`ops` is an ordered array of `{ entityId, type, fields }`, where `type` is `\"create\"`, `\"update\"` or `\"delete\"` and `fields` is a plain object (`{}` for a delete). Process them in order, per entity:\n\n- **create** — start a pending `create` carrying a copy of `fields`.\n- **update** — merge `fields` into the entity's pending op (later keys win). If the pending op is a `create`, it stays a `create` with merged fields. If there is no pending op, start a pending `update`.\n- **delete** — if the pending op is a `create`, the entity never reached the server: drop it entirely. Otherwise the pending op becomes a `delete` with empty `fields`, discarding any queued updates.\n- An `update` or a repeated `delete` after the entity is already pending `delete` changes nothing. An entity dropped by a create-then-delete stays dropped unless a later `create` revives it.\n\nReturn an array of `{ entityId, type, fields }` — exactly those three keys, with `fields` being `{}` for a delete — ordered by the position at which each surviving entity **first appears** in `ops`. An empty or missing input returns `[]`.\n\nAssume no entity is created again after being dropped.",
        starterCode:
          "/**\n * @param {{ entityId: string, type: \"create\"|\"update\"|\"delete\", fields: Record<string, unknown> }[]} ops\n * @returns {{ entityId: string, type: string, fields: Record<string, unknown> }[]}\n */\nfunction coalesceOutbox(ops) {\n  // Your code here\n}\n",
        functionName: "coalesceOutbox",
        testCases: [
          {
            description: "an update after a create is folded into the create",
            args: [
              [
                { entityId: "t1", type: "create", fields: { title: "Buy milk", done: false } },
                { entityId: "t1", type: "update", fields: { done: true } },
              ],
            ],
            expected: [{ entityId: "t1", type: "create", fields: { title: "Buy milk", done: true } }],
          },
          {
            description: "consecutive updates merge, with later keys winning",
            args: [
              [
                { entityId: "t1", type: "update", fields: { title: "A" } },
                { entityId: "t1", type: "update", fields: { title: "B", done: true } },
              ],
            ],
            expected: [{ entityId: "t1", type: "update", fields: { title: "B", done: true } }],
          },
          {
            description: "creating then deleting sends nothing at all",
            args: [
              [
                { entityId: "t1", type: "create", fields: { title: "Draft" } },
                { entityId: "t1", type: "delete", fields: {} },
              ],
            ],
            expected: [],
          },
          {
            description: "updates before a delete are discarded, leaving just the delete",
            args: [
              [
                { entityId: "t7", type: "update", fields: { title: "Renamed" } },
                { entityId: "t7", type: "delete", fields: {} },
              ],
            ],
            expected: [{ entityId: "t7", type: "delete", fields: {} }],
          },
          {
            description: "entities keep the order in which they first appear",
            args: [
              [
                { entityId: "a", type: "create", fields: { n: 1 } },
                { entityId: "b", type: "create", fields: { n: 2 } },
                { entityId: "a", type: "update", fields: { n: 3 } },
              ],
            ],
            expected: [
              { entityId: "a", type: "create", fields: { n: 3 } },
              { entityId: "b", type: "create", fields: { n: 2 } },
            ],
          },
          {
            description: "an empty queue produces an empty plan",
            args: [[]],
            expected: [],
            isEdgeCase: true,
          },
          {
            description: "a repeated delete, and an update after a delete, change nothing",
            args: [
              [
                { entityId: "t9", type: "delete", fields: {} },
                { entityId: "t9", type: "update", fields: { title: "Zombie" } },
                { entityId: "t9", type: "delete", fields: {} },
              ],
            ],
            expected: [{ entityId: "t9", type: "delete", fields: {} }],
            isEdgeCase: true,
          },
          {
            description: "1,000 queued edits to one record collapse into a single request",
            args: [Array.from({ length: 1000 }, (_, i) => ({ entityId: "t1", type: "update", fields: { count: i } }))],
            expected: [{ entityId: "t1", type: "update", fields: { count: 999 } }],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "rn-debugging-devtools",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "Debugging with React Native DevTools",
      summary:
        "Debugging React Native used to mean choosing between bad options. \"Remote JS debugging\" moved your JavaScript into Chrome's V8, which meant you were no longer running on Hermes, no longer on the device, and no longer reproducing the bug you were chasing — timing changed, native calls became asynchronous, and plenty of problems simply vanished while the debugger was attached. Flipper was the other route and is retired.\n\n**React Native DevTools** replaced both. It is the Chrome DevTools frontend speaking the Chrome DevTools Protocol to Hermes **on the device**, so nothing about the runtime changes while you debug. You open it from the terminal or the Dev Menu. Console, Sources with real breakpoints, and Memory heap snapshots are there; Network inspection and a Performance panel arrived in 0.83, and the React Components tree and React Profiler are integrated rather than being a separate app.\n\nIts limits are worth knowing before you go hunting. Network inspection covers `fetch`, `XMLHttpRequest` and `<Image>` requests, but not WebSockets, and it offers no response mocking and no throttling — so a proxy such as Charles or mitmproxy is still the tool for those. Response previews are capped at a 100 MB buffer, oldest evicted first. Expo apps get their own \"Expo Network\" panel with a narrower feature set.\n\nThe boundary that matters most: DevTools debugs the React layer. A crash inside a native module, a Gradle or CocoaPods failure, an `EXC_BAD_ACCESS`, or a permission dialog that never appears are native problems, and the tools for them are Xcode, Android Studio and `adb logcat`. Knowing which side of that line a symptom sits on is most of the skill — a stack trace that ends in JavaScript is yours; one that ends in Objective-C or Kotlin is not.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "React Native: React Native DevTools", url: "https://reactnative.dev/docs/react-native-devtools", kind: "docs" },
        { label: "React Native: Debugging basics", url: "https://reactnative.dev/docs/debugging", kind: "docs" },
        { label: "Expo: Debugging runtime issues", url: "https://docs.expo.dev/debugging/runtime-issues/", kind: "docs" },
        { label: "React Native: Fast Refresh", url: "https://reactnative.dev/docs/fast-refresh", kind: "docs" },
      ],
      video: {
        title: "React Native Debugging: From JS to Native",
        channel: "Simon Grimm",
        url: "https://www.youtube.com/watch?v=FXn1vUGCci8",
        videoId: "FXn1vUGCci8",
        durationLabel: "14:24",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "rn-debugging-devtools-q1",
          prompt: "Why was \"remote JS debugging\" a problem rather than a convenience?",
          options: [
            "It ran your JavaScript in Chrome's V8 instead of Hermes on the device, changing timing and behaviour",
            "It could not set breakpoints, only log",
            "It only worked on Android",
            "It required a physical device and could not attach to a simulator",
          ],
          correctIndex: 0,
          explanation:
            "Moving execution off the device changes the engine and makes native calls asynchronous, so bugs disappear or appear only under the debugger. React Native DevTools debugs Hermes in place instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-debugging-devtools-q2",
          prompt: "Which panels does React Native DevTools provide? (Select all that apply.)",
          options: [
            "Console and Sources with breakpoints",
            "Network inspection for `fetch`, `XMLHttpRequest` and `<Image>` requests",
            "React Components and the React Profiler",
            "A native view hierarchy inspector for `UIView` and Android view trees",
            "An SQLite browser for the device's databases",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "It covers the JavaScript and React layers. Native view hierarchies belong to Xcode's view debugger and Android Studio's layout inspector, and there is no database browser.",
        },
        {
          id: "rn-debugging-devtools-q3",
          prompt: "You need to inspect a WebSocket connection and simulate a 3G connection. Can DevTools do it?",
          options: [
            "No — WebSocket inspection and network throttling are not supported; use a proxy tool instead",
            "Yes, both are in the Network panel",
            "WebSockets yes, throttling no",
            "Only in an Expo development build",
          ],
          correctIndex: 0,
          explanation:
            "The documented limitations are explicit: no WebSocket support, no response mocking and no throttling. A proxy such as Charles or mitmproxy covers all three.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-debugging-devtools-q4",
          prompt: "An app crashes with a stack trace ending inside a Kotlin class in a third-party library. Which tool do you reach for?",
          options: [
            "Android Studio and `adb logcat`, because this is a native-layer crash",
            "The Memory panel in React Native DevTools",
            "The React Profiler, to find which component triggered it",
            "Fast Refresh, to reload and reproduce it faster",
          ],
          correctIndex: 0,
          explanation:
            "DevTools debugs React app concerns; the docs say to use the platform IDEs for the native layer. A native stack trace is a native problem regardless of which JavaScript call started it.",
        },
        {
          id: "rn-debugging-devtools-q5",
          prompt: "What does Fast Refresh preserve, and when does it fall back to a full reload?",
          options: [
            "It preserves component state while editing a component, and does a full reload for edits outside a component or when a module's exports change shape",
            "It preserves state for every edit, including changes to modules outside components",
            "It never preserves state; it just reloads faster than the old live reload",
            "It preserves state only for class components",
          ],
          correctIndex: 0,
          explanation:
            "Fast Refresh remounts as little as it can, but a change to a plain module or to the shape of a file's exports leaves it no safe way to reconcile, so it reloads. This is why a \"state keeps resetting\" complaint usually points at where the edit was, not at a bug.",
        },
        {
          id: "rn-debugging-devtools-q6",
          prompt: "What does the React Profiler tell you that the Performance panel does not?",
          options: [
            "Which components re-rendered, how long each render took, and why it was triggered",
            "Which native views were allocated during the recording",
            "How long each network request took",
            "How much memory the JavaScript heap is using",
          ],
          correctIndex: 0,
          explanation:
            "The React Profiler is component-centric: commits, render durations and causes. Frames, tasks and network timings come from the Performance panel, and heap usage from Memory.",
        },
        {
          id: "rn-debugging-devtools-q7",
          prompt: "A colleague reports a bug that \"only happens when the debugger is closed\". What is the most useful first hypothesis?",
          options: [
            "Timing: attaching a debugger slows execution and can mask a race that only shows at full speed",
            "The bundler serves a different bundle when DevTools is open",
            "Hermes disables optimisations while debugging, which fixes the bug",
            "The Dev Menu resets app state each time it opens",
          ],
          correctIndex: 0,
          explanation:
            "Heisenbugs in mobile apps are usually races — a request resolving after unmount, an animation frame budget, a startup ordering issue — and the debugger perturbs exactly that. The bundle served is the same.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-debugging-devtools-q8",
          prompt: "Why does a large download show a truncated response preview in the Network panel?",
          options: [
            "Response bodies share a capped buffer, with the oldest entries evicted as it fills",
            "Bodies over 1 MB are never captured",
            "Previews are disabled for binary content types",
            "The panel only stores the last ten responses",
          ],
          correctIndex: 0,
          explanation:
            "The documented cap is a 100 MB buffer with oldest-first eviction, so previews from a long session or a big transfer can disappear. It is not a per-response size rule or a fixed count.",
        },
        {
          id: "rn-debugging-devtools-q9",
          prompt: "Which of these should make you stop debugging in JavaScript and look at the native build instead? (Select all that apply.)",
          options: [
            "A CocoaPods or Gradle error during the build",
            "A permission dialog that never appears on device",
            "An `EXC_BAD_ACCESS` crash with no JavaScript frames",
            "A `TypeError: undefined is not an object` in a reducer",
            "A component re-rendering more often than expected",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Build failures, missing permission declarations and memory-access crashes all live below the JavaScript layer. A `TypeError` and an over-rendering component are exactly what DevTools is for.",
        },
      ],
    },
    {
      id: "rn-eas-build-submit",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "EAS Build & EAS Submit",
      summary:
        "Shipping a mobile app means producing signed binaries for two stores from two toolchains, one of which legally requires macOS. EAS Build is Expo's answer: a hosted build service that takes your project, runs prebuild if needed, compiles on the right machine and hands back an `.ipa` or `.aab`. EAS Submit then uploads that artefact to App Store Connect or Google Play. They are deliberately separate steps, because \"can we build it\" and \"can we release it\" fail for completely different reasons.\n\n`eas.json` defines **build profiles**, and the three-profile convention is worth adopting as-is. `development` sets `developmentClient: true` and `distribution: \"internal\"` — a debug build with the dev client, never submitted to a store. `preview` is a production-like build with the dev tools removed, still distributed internally for QA and stakeholders. `production` is what goes to the stores and to TestFlight. Profiles can `extends` one another, so a variant is an override rather than a copy. Each profile can also carry its own environment and its own app variant, which is how you get a staging build installed next to the production app.\n\nCredentials are the part that quietly costs teams the most. EAS can generate and store the iOS distribution certificate, the provisioning profile and the Android keystore for you, which removes the ritual of one person holding the signing key on their laptop — and makes it painfully clear why losing an Android upload key means you cannot update that listing, ever. Build numbers matter too: stores reject a duplicate, so let the service increment them rather than remembering to.\n\nThe mental model to keep straight is the one that decides your release cadence. A build is native: it carries the compiled code, the SDK version and every native dependency, and it goes through review. An over-the-air update carries JavaScript and assets only, and rides on top of a build it is compatible with. Everything about a release plan follows from which of the two a given change requires.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Expo: EAS Build introduction", url: "https://docs.expo.dev/build/introduction/", kind: "docs" },
        { label: "Expo: Configuring EAS Build with eas.json", url: "https://docs.expo.dev/build/eas-json/", kind: "docs" },
        { label: "Expo: Submit to app stores", url: "https://docs.expo.dev/deploy/submit-to-app-stores/", kind: "docs" },
        { label: "Expo: App versions and build numbers", url: "https://docs.expo.dev/build-reference/app-versions/", kind: "docs" },
      ],
      video: {
        title: "How to create a production build for Android | EAS Tutorial",
        channel: "Expo",
        url: "https://www.youtube.com/watch?v=nxlt8uwqhpE",
        videoId: "nxlt8uwqhpE",
        durationLabel: "19:25",
      },
      alternateVideos: [
        {
          title: "How to create a production build for iOS | EAS Tutorial",
          channel: "Expo",
          url: "https://www.youtube.com/watch?v=VZL_e0cEwo8",
          videoId: "VZL_e0cEwo8",
          durationLabel: "9:55",
        },
        {
          title: "EAS Workflows: React Native CI/CD for app developers",
          channel: "Expo",
          url: "https://www.youtube.com/watch?v=OJ2u9tQCpr4",
          videoId: "OJ2u9tQCpr4",
          durationLabel: "6:30",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "rn-eas-build-submit-q1",
          prompt: "What distinguishes the `development` profile from the `preview` profile in a conventional `eas.json`?",
          options: [
            "`development` sets `developmentClient: true` so the build can load JavaScript from a dev server; `preview` is a production-like build without dev tooling",
            "`development` builds for simulators only and `preview` builds for devices",
            "`preview` is submitted to TestFlight and `development` is not",
            "`development` skips prebuild while `preview` runs it",
          ],
          correctIndex: 0,
          explanation:
            "The dev client is the difference: one is for developing against Metro, the other is a realistic build for testers. Both usually use internal distribution, and both run prebuild when native directories are not checked in.",
        },
        {
          id: "rn-eas-build-submit-q2",
          prompt: "What does `\"distribution\": \"internal\"` mean?",
          options: [
            "The artefact can be installed directly on registered devices via a link, without going through a store",
            "The build is encrypted and only Expo can open it",
            "The build is limited to iOS simulators",
            "The build is submitted to the store but only visible to your organisation",
          ],
          correctIndex: 0,
          explanation:
            "Internal distribution produces an installable artefact for testers, bypassing review entirely. It is not store distribution and it is not simulator-only.",
        },
        {
          id: "rn-eas-build-submit-q3",
          prompt: "Why are `eas build` and `eas submit` separate commands?",
          options: [
            "Building and releasing fail for different reasons and often happen at different times — you may submit an artefact days after building it",
            "Submitting requires a different EAS account tier",
            "Builds are produced locally and submissions run in the cloud",
            "Store APIs cannot accept an artefact from the same session that produced it",
          ],
          correctIndex: 0,
          explanation:
            "Keeping them separate means a compile failure and a store-metadata rejection are distinct events, and the same artefact can be promoted later. Both run as cloud jobs.",
        },
        {
          id: "rn-eas-build-submit-q4",
          prompt: "Which changes require a new native build rather than an over-the-air update? (Select all that apply.)",
          options: [
            "Adding a library with native code",
            "Upgrading the Expo SDK",
            "Adding a new iOS permission usage description",
            "Fixing a formatting bug in a utility function",
            "Replacing a bundled PNG with a new one",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that changes the native layer — dependencies, the SDK, the app config's native output — has to be compiled in. Pure JavaScript and bundled assets ride on an update.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-eas-build-submit-q5",
          prompt: "A team loses the Android upload keystore. What is the consequence?",
          options: [
            "They cannot publish an update to that listing unless Google resets the key, which is why a managed, backed-up keystore matters",
            "Nothing: a new keystore is generated automatically on the next build",
            "Only internal distribution is affected; store updates continue",
            "The app is removed from the store within 30 days",
          ],
          correctIndex: 0,
          explanation:
            "The signing identity is what proves an update comes from the same publisher, so losing it is close to losing the listing. Letting EAS hold credentials exists precisely to stop this being one laptop's problem.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-eas-build-submit-q6",
          prompt: "Why let the build service auto-increment build numbers?",
          options: [
            "Stores reject an upload whose build number is already taken, and remembering to bump it by hand is a reliable way to waste a release slot",
            "The build number is used as the over-the-air update's runtime version",
            "Auto-incrementing is required for internal distribution",
            "It keeps the version string in sync with the git tag",
          ],
          correctIndex: 0,
          explanation:
            "Build numbers must be unique per version on both stores, and the failure surfaces at submit time, after the compile. The runtime version is a separate concept, and git tags are not involved.",
        },
        {
          id: "rn-eas-build-submit-q7",
          prompt: "What does `extends` in a build profile do?",
          options: [
            "Inherits another profile's settings so a variant only declares its overrides",
            "Chains two builds so the second starts when the first succeeds",
            "Merges the profile with the matching submit configuration",
            "Extends the build timeout for large projects",
          ],
          correctIndex: 0,
          explanation:
            "It is plain configuration inheritance, which keeps a staging profile from drifting away from production by copy-paste. It has nothing to do with job ordering or timeouts.",
        },
        {
          id: "rn-eas-build-submit-q8",
          prompt: "A build succeeds but the submission is rejected. Which of these are plausible causes? (Select all that apply.)",
          options: [
            "A missing or inadequate privacy declaration",
            "A permission used without a usage description the reviewer accepts",
            "Store metadata or screenshots that do not meet requirements",
            "A TypeScript error in the app's source",
            "A failing unit test",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Submission failures are policy and metadata failures — the binary already compiled. Type errors and tests would have stopped the build (or should have stopped CI) long before an artefact existed.",
        },
        {
          id: "rn-eas-build-submit-q9",
          prompt: "What is the relationship between a build and an over-the-air update?",
          options: [
            "The build carries the native layer; an update carries JavaScript and assets and must be compatible with the build it lands on",
            "An update replaces the build entirely once installed",
            "Every update triggers a new build behind the scenes",
            "They are alternative distribution channels for the same artefact",
          ],
          correctIndex: 0,
          explanation:
            "An update is a swappable layer on top of a fixed native layer, which is why compatibility is tracked explicitly. Nothing about an update replaces or rebuilds the binary.",
        },
      ],
    },
    {
      id: "rn-ota-updates",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "Over-the-Air Updates with EAS Update",
      summary:
        "An installed app is split in two: a **native layer** compiled into the binary, and an **update layer** — the JavaScript bundle and its assets — that can be swapped for a compatible one. EAS Update ships a new update layer to devices already in the field, so a crash-on-launch regression is a fifteen-minute fix instead of a review cycle. What it cannot do is change the native layer, and every rule about updates follows from that one fact.\n\n**Runtime version** is the compatibility contract. A build declares one; an update is published with one; a device only accepts an update whose runtime version matches its build's. The policies differ in how conservative they are: `appVersion` ties it to your app version, `sdkVersion` to the Expo SDK, `nativeVersion` to the native version, and `fingerprint` hashes everything that could affect the native runtime — the most conservative option, which makes an incompatible update extremely unlikely at the cost of more native builds. Getting this wrong is the failure mode that matters: publish JavaScript that calls a native module the installed binary does not contain, and the update either fails to load or crashes and falls back through error recovery, on devices you cannot reach.\n\nUpdates are organised by **branch** and delivered through a **channel**. A build points at a channel (`production`, `staging`), a channel maps to a branch, and you promote a branch's update from staging to production rather than rebuilding. That indirection is what lets you roll a fix forward — and, just as importantly, roll one back by republishing an earlier update.\n\nUpdates are not a way around review. App Store guidelines permit changing an app's JavaScript, not changing what the app fundamentally is; shipping a feature over the air that you would not have got past a reviewer is a policy problem, not a technical one. The operational discipline is the same as any deploy: stage first, watch the adoption and crash rate, and keep the ability to revert one command away.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "Expo: EAS Update introduction", url: "https://docs.expo.dev/eas-update/introduction/", kind: "docs" },
        { label: "Expo: Runtime versions and updates", url: "https://docs.expo.dev/eas-update/runtime-versions/", kind: "docs" },
        { label: "Expo: How EAS Update works", url: "https://docs.expo.dev/eas-update/how-it-works/", kind: "docs" },
        { label: "Expo: Deployment patterns", url: "https://docs.expo.dev/eas-update/deployment-patterns/", kind: "docs" },
      ],
      video: {
        title: "Sending Over-the-Air (OTA) Updates with EAS Update | Step-by-Step Guide",
        channel: "Code with Beto",
        url: "https://www.youtube.com/watch?v=DWpcD6bvTRA",
        videoId: "DWpcD6bvTRA",
        durationLabel: "42:52",
      },
      alternateVideos: [
        {
          title: "When to use over the air updates | Three important OTA use cases",
          channel: "Expo",
          url: "https://www.youtube.com/watch?v=PMRekmaeb1o",
          videoId: "PMRekmaeb1o",
          durationLabel: "2:42",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `planRelease(changes, runtimeVersion)`: decide whether a release can go out over the air, and what runtime version it should carry.\n\n`changes` is an array of `{ kind, name }`. Two kinds are safe to ship in an update layer:\n\n- `\"js\"` — JavaScript or TypeScript source\n- `\"asset\"` — a bundled image, font or other asset\n\nThese force a new native build:\n\n- `\"native-dependency\"` — a library with native code added or upgraded\n- `\"app-config\"` — a config change that lands in the native project (permissions, plugins, identifiers)\n- `\"sdk-upgrade\"` — an Expo SDK bump\n- **any kind you do not recognise** — fail safe and require a build\n\n`runtimeVersion` is always `\"MAJOR.MINOR.PATCH\"` with non-negative integers.\n\nReturn an object with exactly these keys:\n\n- `channel` — `\"update\"` when every change is safe (including when `changes` is empty), otherwise `\"build\"`.\n- `reasons` — the `name` of every change that forces a build, deduplicated and sorted with the default string sort. `[]` when `channel` is `\"update\"`.\n- `runtimeVersion` — unchanged when `channel` is `\"update\"`. When a build is required: bump the **major** (and zero the rest) if any change is an `\"sdk-upgrade\"`, otherwise bump the **minor** and zero the patch.",
        starterCode:
          "/**\n * @param {{ kind: string, name: string }[]} changes\n * @param {string} runtimeVersion  e.g. \"1.4.2\"\n * @returns {{ channel: \"update\" | \"build\", reasons: string[], runtimeVersion: string }}\n */\nfunction planRelease(changes, runtimeVersion) {\n  // Your code here\n}\n",
        functionName: "planRelease",
        testCases: [
          {
            description: "a JavaScript-only change ships over the air",
            args: [
              [
                { kind: "js", name: "src/screens/Home.tsx" },
                { kind: "js", name: "src/api/client.ts" },
              ],
              "1.4.2",
            ],
            expected: { channel: "update", reasons: [], runtimeVersion: "1.4.2" },
          },
          {
            description: "bundled assets are part of the update layer too",
            args: [
              [
                { kind: "js", name: "src/app.tsx" },
                { kind: "asset", name: "assets/logo.png" },
              ],
              "3.0.0",
            ],
            expected: { channel: "update", reasons: [], runtimeVersion: "3.0.0" },
          },
          {
            description: "one native dependency forces a build and a minor bump",
            args: [
              [
                { kind: "js", name: "src/app.tsx" },
                { kind: "native-dependency", name: "expo-camera" },
              ],
              "1.4.2",
            ],
            expected: { channel: "build", reasons: ["expo-camera"], runtimeVersion: "1.5.0" },
          },
          {
            description: "an SDK upgrade bumps the major and zeroes the rest",
            args: [
              [
                { kind: "native-dependency", name: "react-native-mmkv" },
                { kind: "sdk-upgrade", name: "expo@57" },
              ],
              "1.9.7",
            ],
            expected: { channel: "build", reasons: ["expo@57", "react-native-mmkv"], runtimeVersion: "2.0.0" },
          },
          {
            description: "an app-config change is a native change",
            args: [[{ kind: "app-config", name: "ios.infoPlist.NSCameraUsageDescription" }], "0.9.14"],
            expected: {
              channel: "build",
              reasons: ["ios.infoPlist.NSCameraUsageDescription"],
              runtimeVersion: "0.10.0",
            },
          },
          {
            description: "no changes at all is still a valid update plan",
            args: [[], "2.3.1"],
            expected: { channel: "update", reasons: [], runtimeVersion: "2.3.1" },
            isEdgeCase: true,
          },
          {
            description: "an unrecognised kind fails safe and requires a build",
            args: [
              [
                { kind: "js", name: "src/app.tsx" },
                { kind: "gradle-tweak", name: "android/build.gradle" },
              ],
              "1.0.0",
            ],
            expected: { channel: "build", reasons: ["android/build.gradle"], runtimeVersion: "1.1.0" },
            isEdgeCase: true,
          },
          {
            description: "duplicate reasons are collapsed and sorted",
            args: [
              [
                { kind: "native-dependency", name: "expo-camera" },
                { kind: "native-dependency", name: "expo-camera" },
                { kind: "app-config", name: "android.permissions" },
              ],
              "4.2.9",
            ],
            expected: {
              channel: "build",
              reasons: ["android.permissions", "expo-camera"],
              runtimeVersion: "4.3.0",
            },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "rn-performance-profiling",
      moduleId: "mobile-react-native",
      trackId: "mobile",
      title: "Performance Profiling",
      summary:
        "Performance work on React Native starts with one rule that people break constantly: **measure a release build**. A development build runs without minification, with dev-only warnings and prop validation, with the bundle served over the network, and with the React DevTools hooks installed. Numbers taken there are not merely noisy, they are systematically wrong — and they send teams optimising the wrong thing.\n\nThe second thing to internalise is that there are two frame rates, and \"the app is janky\" means different things for each. The **UI thread** at 60 fps or below means native rendering is behind: too many views, too much shadow and overdraw, huge images being decoded, an animation driven from JavaScript instead of natively. The **JavaScript thread** dropping means your own code is blocking: an expensive render, a synchronous parse of a large payload, a list committing too many rows at once. A gesture that drags smoothly while the list stutters is a JavaScript-thread problem; a gesture that stutters too is a UI-thread one.\n\nStartup is its own axis. Hermes precompiles to bytecode at build time, so the engine does not parse JavaScript on launch — one reason Hermes V1 becoming the default in 0.84 mattered. Beyond that, time to interactive is mostly about how much of your bundle runs before the first screen: inline requires and lazy imports defer module evaluation, and moving work out of module scope into an effect usually beats micro-optimising the work itself.\n\nThe tooling has finally converged. React Native DevTools' Performance panel and React Performance tracks (from 0.83) show JavaScript execution, React commits and network events on one timeline, and the React Profiler attributes render cost to components. Below that line, Xcode Instruments and Android Studio's profiler are the only way to see native allocations, GPU overdraw and thread contention. The senior instinct is not knowing more knobs, it is refusing to turn any of them until a profile says which thread is short of time.",
      level: "expert",
      estMinutes: 65,
      webRefs: [
        { label: "React Native: Performance overview", url: "https://reactnative.dev/docs/performance", kind: "docs" },
        { label: "React Native: Profiling", url: "https://reactnative.dev/docs/profiling", kind: "docs" },
        { label: "React Native: Optimizing JavaScript loading", url: "https://reactnative.dev/docs/optimizing-javascript-loading", kind: "docs" },
        { label: "React Native: View Flattening", url: "https://reactnative.dev/architecture/view-flattening", kind: "article" },
      ],
      video: {
        title: "7 Tips to Make Your React Native App Blazing Fast! 🚀",
        channel: "Simon Grimm",
        url: "https://www.youtube.com/watch?v=rSym-q9soFk",
        videoId: "rSym-q9soFk",
        durationLabel: "13:06",
      },
      alternateVideos: [
        {
          title: "Profiling with React Performance tracks",
          channel: "React Conf",
          url: "https://www.youtube.com/watch?v=CclO4tPoebs",
          videoId: "CclO4tPoebs",
          durationLabel: "18:27",
        },
        {
          title: "Performance Tracing and Observability in React Native and Native Code",
          channel: "Amazon Developer",
          url: "https://www.youtube.com/watch?v=lgC9VDVt7BQ",
          videoId: "lgC9VDVt7BQ",
          durationLabel: "15:39",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "rn-performance-profiling-q1",
          prompt: "Why must performance be measured in a release build?",
          options: [
            "Development builds add dev-only checks, skip minification and serve the bundle over the network, so the numbers do not reflect production",
            "Release builds report frame rates at a higher resolution",
            "The profiler is disabled in development builds",
            "Development builds run on a different JavaScript engine",
          ],
          correctIndex: 0,
          explanation:
            "The overhead in a dev build is real but is not present for users, so it hides the bottlenecks that matter and invents ones that do not exist. The engine is the same.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-performance-profiling-q2",
          prompt: "A list scrolls smoothly, but tapping a row takes half a second to respond. Which thread is starved?",
          options: [
            "The JavaScript thread: scrolling is driven natively, while the tap has to run your handler and a render",
            "The UI thread: the scroll is handled in JavaScript and the tap natively",
            "Neither; this is a network problem by definition",
            "Both equally, since they share a single run loop",
          ],
          correctIndex: 0,
          explanation:
            "Native scrolling continues even when JavaScript is blocked, which is exactly why a smooth scroll with unresponsive taps points at the JavaScript thread. The two threads are separate.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-performance-profiling-q3",
          prompt: "How does Hermes improve startup?",
          options: [
            "The bundle is precompiled to bytecode at build time, so the engine does not parse JavaScript on launch",
            "It compiles the whole bundle to native ARM code ahead of time",
            "It loads the bundle in a background thread while the splash screen shows",
            "It caches the parsed AST from the previous launch",
          ],
          correctIndex: 0,
          explanation:
            "Ahead-of-time bytecode removes the parse cost from every cold start and lowers memory. It is not an AOT native compiler, and nothing is cached between launches to achieve it.",
        },
        {
          id: "rn-performance-profiling-q4",
          prompt: "Which symptoms point at the **UI thread** rather than the JavaScript thread? (Select all that apply.)",
          options: [
            "Deeply nested views with shadows causing visible overdraw",
            "Large images being decoded while scrolling",
            "A complex layout that takes a long time to measure and mount",
            "A `JSON.parse` of a 5 MB response blocking for 300 ms",
            "A context value change re-rendering half the tree",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Overdraw, image decoding and layout are native rendering work. Parsing and re-rendering are your own JavaScript and stall the other thread.",
        },
        {
          id: "rn-performance-profiling-q5",
          prompt: "What do inline requires and lazy imports buy you?",
          options: [
            "Module bodies are evaluated on first use instead of at startup, cutting time to interactive",
            "A smaller download, because unused modules are omitted from the bundle",
            "Parallel module evaluation across threads",
            "Automatic memoisation of the exported values",
          ],
          correctIndex: 0,
          explanation:
            "The bundle is the same size; what changes is when each module's top-level code runs. Modules are still evaluated on one thread, and nothing is memoised beyond the usual module cache.",
        },
        {
          id: "rn-performance-profiling-q6",
          prompt: "What is view flattening?",
          options: [
            "The renderer omitting native views for layout-only elements, reducing the size of the native hierarchy",
            "Collapsing nested style objects into one before applying them",
            "Rasterising a subtree into a single texture for faster scrolling",
            "Merging sibling `Text` components into one native text node",
          ],
          correctIndex: 0,
          explanation:
            "A `View` that only contributes layout and no visual output need not exist natively, so the renderer drops it. It is a structural optimisation, not a style merge or a rasterisation trick.",
        },
        {
          id: "rn-performance-profiling-q7",
          prompt: "An animation stutters only while a background sync is running. What is the right fix?",
          options: [
            "Drive the animation on the UI thread — a Reanimated worklet or the native driver — so it no longer depends on the JavaScript thread",
            "Raise the animation's duration so fewer frames are needed",
            "Move the sync into a `setTimeout` so it yields between chunks",
            "Disable the animation while syncing",
          ],
          correctIndex: 0,
          explanation:
            "An animation computed in JavaScript inherits every stall on that thread. Running it natively decouples it. A `setTimeout` still runs on the same thread, and hiding the symptom is not a fix.",
        },
        {
          id: "rn-performance-profiling-q8",
          prompt: "The React Profiler shows a component rendering 40 times per second while the user drags a slider. Is that necessarily a problem?",
          options: [
            "Not necessarily — what matters is the time per render and whether any frame is missed; a cheap component rendering often can be fine",
            "Yes: more than 10 renders per second always drops frames",
            "Yes: any render during a gesture blocks the UI thread",
            "No, because the Profiler only counts renders in development",
          ],
          correctIndex: 0,
          explanation:
            "Render count without duration is not a metric. Optimising a 0.1 ms component while a 40 ms sibling re-renders is the classic wasted afternoon — look at the commit durations and the frame timeline.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "rn-performance-profiling-q9",
          prompt: "Which questions can only be answered with Xcode Instruments or Android Studio's profiler? (Select all that apply.)",
          options: [
            "How much native memory the app allocates and where",
            "Whether the GPU is overdrawing pixels",
            "Whether a native thread is contended or blocked",
            "Which React component took longest to render",
            "How long a `fetch` took to resolve",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Native memory, GPU work and thread contention are below the JavaScript layer. Component render cost and network timings are exactly what React Native DevTools reports.",
        },
        {
          id: "rn-performance-profiling-q10",
          prompt: "A team wants to \"make the app faster\" before the next release. What is the first step?",
          options: [
            "Profile a release build to find which thread is short of time on the screens users actually complain about",
            "Wrap every component in `React.memo` and every callback in `useCallback`",
            "Replace every `FlatList` with a FlashList",
            "Enable Hermes, since it is the largest single win available",
          ],
          correctIndex: 0,
          explanation:
            "Every other option is a guess about the bottleneck. Blanket memoisation adds comparison cost and complexity, list libraries only help list-bound screens, and Hermes has been the default engine for years.",
        },
      ],
    },
  ],
} satisfies Module;
