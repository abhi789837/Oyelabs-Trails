# React Hooks & Advanced Patterns research notes (2026-09-21)

## Videos

Chapter-split from the brief's primary video, "Full React Course 2020 - Learn Fundamentals, Hooks, Context API, React Router, Custom Hooks" (freeCodeCamp.org, 10:07:52, `4UZrsTqkcW4`, embeddable, 79 chapters). It's from 2020, so every chapter-split topic also has a focused, newer alternate:

- react-adv-use-effect: from "useEffect - Basics" at 4:47:27 (17247 s), running through "useEffect - Fetch Data" (~44 min). Alternates: "Goodbye, useEffect - David Khourshid" (BeJS, 29:58) for effects-as-synchronisation, and "React 19.2 New useEffectEvent Hook: Game Changer or Gimmick?" (Jack Herrington, 11:28).
- react-adv-use-context: from "Prop Drilling -" at 8:00:56 (28856 s; label trimmed to "Prop Drilling"), through "Context API / - useContext" (~25 min). Alternate: "This Context API Mistake Ruins Your Whole React App" (ByteGrad, 5:36).
- react-adv-use-reducer: from "useReducer - UseState Setup" at 7:16:20 (26180 s), the four useReducer chapters (~45 min). Alternate: "Learn useReducer In 20 Minutes" (Web Dev Simplified, 20:12).
- react-adv-use-ref: "useRef" at 7:06:29 (25589 s, ~10 min). Alternate: "Learn useRef in 11 Minutes" (Web Dev Simplified, 10:20).
- react-adv-memo-callback: from "useCallback" at 9:49:50 (35390 s) through "useMemo" and "useCallback - Fetch Example" (~18 min). Alternate: "React Compiler: In-Depth Beyond React Conf 2024" (Jack Herrington, 15:16), because the course predates the compiler.
- react-adv-custom-hooks: "Custom Hooks - useFetch" at 8:26:22 (30382 s, ~12 min). The course's `useFetch` has no cancellation or race handling; the code challenge is built around fixing exactly that. Alternate: "Custom Hooks in React (Design Patterns)" (Cosden Solutions, 12:55).
- react-adv-react-memo: from "React Optimization Warning" at 9:37:51 (34671 s) through "React.memo" (~12 min). Alternate: "Preventing re-renders with React.memo" (Developer Way, 11:38).

Focused videos for topics the course doesn't cover, or covers in pre-React-19 ways:

- react-adv-error-boundaries: "Learn React Error Boundaries In 7 Minutes" (Web Dev Simplified, 7:06, 2023); short and correct on the class + `react-error-boundary` split.
- react-adv-portals: "Learn React Portal In 12 Minutes By Building A Modal" (Web Dev Simplified, 12:10, 2020); the `createPortal` API is unchanged since.
- react-adv-ref-forwarding: "Goodbye, forwardRef" (UI Engineering, 15:59, 2024), specifically about React 19's ref-as-prop. Alternates: "Refs in React: from access to DOM to imperative API" (Developer Way, 12:52) and "What's new in React 19 | Lydia Hallie" (React Conf, 20:03).
- react-adv-compound-components: "Compound Components in React (Design Patterns)" (Cosden Solutions, 18:21, 2024). Alternate: "Composition Is All You Need | Fernando Rojo at React Universe Conf 2025" (Callstack, 22:17).
- react-adv-render-props-hocs: "Michael Jackson - Composing Behavior in React or Why React Hooks are Awesome" (React Loop, 31:56, 2019), which argues the topic's exact thesis. Alternate: "Michael Jackson - Never Write Another HoC" (Phoenix ReactJS, 51:07, 2017).
- react-adv-lazy-suspense: "Speed Up Your React Apps With Code Splitting" (Web Dev Simplified, 16:49, 2022). Alternate: "How does react Suspense work?" (Web Dev Cody, 10:36).
- react-adv-concurrent: "Modern React Patterns: Concurrent Rendering, Actions & What's Next | Aurora Scharff at RUC 2025" (Callstack, 26:31; no chapters), current with React 19 Actions. Alternate: "useTransition() vs useDeferredValue | React 18" (Academind, 16:22).
- react-adv-server-components: "React for Two Computers | Dan Abramov" (React Conf 2024, 28:55), the conceptual model from first principles. Alternates: "React Server Components: A Comprehensive Breakdown" (Theo, 52:41) and "React Server Components Change Everything" (Web Dev Simplified, 15:47).
- react-adv-reconciliation: "Lin Clark - A Cartoon Intro to Fiber - React Conf 2017" (Meta Developers, 31:47), still the clearest Fiber explainer, though it predates lanes (it describes expiration-time priorities). Alternates: "React Fiber Reconciliation: How it Works (Part 1)" (Tejas Kumar, 13:43) and "A Guide to React Rendering Behavior - Mark Erikson - React Rally 2023" (ReactRally, 28:08; low view count but authoritative).

No search-URL fallbacks. Every video and alternate was confirmed with `yt.mjs info` (`embeddable: true`).

## References

- `github.com/facebook/react/...` now redirects to `github.com/react/react/...`; the final URLs are used (Lanes PR #18796, `ReactChildFiber.js`).
- Two deep links keep their `#anchor` (the URL checker drops fragments, so the anchor ids were checked in the page HTML): the Error Boundary section of `react.dev/reference/react/Component` and `#ref-as-a-prop` in the React 19 blog post.
- The W3C APG dialog pattern page returned 403 to the checker, so MDN's `<dialog>` page is used for native modals instead.
- Block iframe previews: GitHub (CSP `frame-ancestors 'none'`), kentcdodds.com (`frame-ancestors 'self'`), MDN (`X-Frame-Options: DENY`), web.dev (`frame-ancestors 'self' ...`). Allow framing: react.dev, legacy.reactjs.org, overreacted.io, joshwcomeau.com, patterns.dev, developerway.com, tkdodo.eu, radix-ui.com.

## Facts verified

- react.dev/versions: latest is 19.3. React 19.2 blog: `useEffectEvent` (stable), `<Activity>`, `cacheSignal`.
- useEffect reference: `Object.is` dependency comparison; StrictMode's extra setup + cleanup; effects caused by discrete interactions may run before paint. React 17 changelog: all cleanups run before any new effects. Child-before-parent order confirmed in `ReactFiberCommitWork.js` (subtree traversal runs before the fiber's own passive effects, for both unmount and mount passes).
- useEffectEvent reference: not reactive, identity changes every render, callable only from effects, must not be a dependency.
- StrictMode reference: double-invokes component bodies and the functions passed to `useState`, set functions, `useMemo`, `useReducer`; extra setup + cleanup for effects and (React 19) ref callbacks. `<Activity>` hidden mode destroys effects.
- Component reference (error boundaries): not caught for event handlers, SSR, the boundary's own errors, async code, except functions passed to `startTransition` from `useTransition`; no function-component equivalent; in development caught errors still reach `window.onerror`. createRoot: `onCaughtError`, `onUncaughtError`, `onRecoverableError`. `react-error-boundary` 6.1.6 exports `useErrorBoundary` (`showBoundary`, `resetBoundary`), `resetKeys`, `onReset`.
- createPortal reference: events propagate through the React tree; a different `domNode` recreates the content. React's server renderer (`ReactFizzServer.js`) throws for portals. MDN: `showModal()` dialogs use the top layer and make the rest of the page inert.
- React 19 blog: `ref` as a prop for function components; `forwardRef` to be deprecated; refs to classes aren't props; ref cleanup functions and the TypeScript implicit-return change; `<Context>` as a provider; `useDeferredValue` `initialValue`. useImperativeHandle: "don't overuse refs" pitfall. Common components page: a new ref callback each render is called with `null` then the node.
- useContext reference: `Object.is` comparison, `memo` doesn't block context updates, a provider without `value` provides `undefined`, duplicate module instances.
- useMemo / useCallback: performance hint, not a semantic guarantee (cache dropped on file edits and on suspending during initial mount); ~1 ms threshold, production build, CPU throttling; no first-render speed-up. memo reference: `Object.is` per prop, custom comparator must compare functions, avoid deep equality. `shallowEqual` semantics from `packages/shared/shallowEqual.js`.
- React Compiler introduction: stable; memoises only components and hooks; memoisation not shared across components; `useMemo`/`useCallback` remain escape hatches.
- lazy reference and `ReactLazy.js`: loader called once, promise and result cached, rejections cached and thrown to the nearest error boundary; declare at module level.
- Suspense reference: fallback shown again unless the update is a transition or deferred; reveals at most once every 300 ms; no state kept for trees that suspend before first mount; server errors fall back to the nearest Suspense boundary and retry on the client.
- useTransition / startTransition: can't control text inputs; updates after `await` need another `startTransition`; `isPending` semantics; concurrent transitions are batched. useDeferredValue: no fixed delay, interruptible, needs `memo` on the slow child, returns the new value inside a transition, doesn't reduce requests. useSyncExternalStore: store mutations during a transition fall back to a blocking render.
- `ReactFiberLane.js`: `TotalLanes = 31`; SyncLane, InputContinuousLane, DefaultLane, TransitionLanes, RetryLanes, IdleLane. `ReactFiberWorkLoop.js`: the stable path `workLoopConcurrentByScheduler` checks `shouldYield()` between units of work (Scheduler `frameYieldMs = 5`).
- `ReactChildFiber.js` `placeChild`: a node stays only if `oldIndex >= lastPlacedIndex`, so moving the last child to the front costs n − 1 moves.
- RSC ('use client' and Server Components pages): serialisable prop list; the boundary follows the module dependency tree; no directive for Server Components (`"use server"` is for Server Functions); Server Components can't create context but can render a client provider; promises can be passed and read with `use`. React's server build (`ReactServer.js`) exports only `use`, `useId`, `useCallback`, `useMemo` and `useDebugValue` among the Hooks. The client-reference proxy throws "You cannot dot into a client module from a server component" (`ReactFlightWebpackReferences.js`).
- Children reference: empty nodes count, arrays are flattened, Fragments aren't traversed; the APIs are called fragile.

## Code challenges

Five, each with a test driver and a reference solution in `content-tests/solutions/`: `react-adv-use-reducer` (undoable reducer with no-op bail-outs and structural sharing), `react-adv-custom-hooks` (race-safe `useFetch` reducer + effect), `react-adv-react-memo` (`shallowEqual` + `memo`), `react-adv-lazy-suspense` (`lazy` with a Suspense retry loop), `react-adv-reconciliation` (minimal keyed diff). The keyed-diff solution was checked against 3,000 random cases: moves always equal surviving nodes minus the LIS length.
