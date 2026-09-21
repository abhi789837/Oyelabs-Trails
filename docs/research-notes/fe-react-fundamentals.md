# React Fundamentals research notes (2026-09-21)

## Videos
All ids verified with `scripts/research/yt.mjs info` (oEmbed 200, `embeddable: true`). Late in the session YouTube started
serving a captcha for watch pages, but every id below had already been verified with a full `info` call.

Brief's courses:
- `6Ied4aZxUzc` "React Fundamentals - Full Course for Beginners" (freeCodeCamp.org, 1:03:47, May 2018, by Edvinas Daugirdas).
  It has no YouTube chapter markers, but its description lists "Course Contents" in a `⌨️N. (m:ss) Title` format that
  `info --chapters` doesn't parse, so start times were taken from the description by hand: React Elements 2:45 (165),
  Components 9:37 (577), Lists and Keys 29:42 (1782), Conditional Rendering 40:03 (2403). It uses class components
  (`this.state`, `componentDidMount`), so focused Hooks-era videos are primary where state and events matter.
- `DLX62G4lc44` "Learn React JS - Full Course for Beginners - Tutorial 2019" (freeCodeCamp.org, 5:05:34, Dec 2018, Bob Ziroll).
  Real chapters. Used as an alternate: Props Part 1 (4362), Handling Events in React (8525), Container/Component
  Architecture (15869). Also class-based.
- `eILUmCJhl64` turned out to be "🚀🔥 React & Redux Complete Course (2024) with Projects | Notes | Free Certification"
  (Complete Coding by Prashant Sir, 19:53:36, published Nov 2023, ~4M views). It is taught in **Hindi** (captions are Hindi
  auto-generated only), uses Vite, function components and Hooks, and has chapter markers. It fits this module and the
  ecosystem module (it also covers Context, useReducer, React Router loaders/actions, Redux and Redux Toolkit). Used here as
  an alternate with `(in Hindi)` appended to the chapter label: Ch-10-16 JSX/components (4081), Ch-18-22 lists/conditional
  rendering (11004), Ch-23-25 children/events (17445), Ch-26-27 useState (20325), Ch-28-34 forms/useRef (26630).
  Chapters it has that other modules could use: Ch-35-36 Context + useReducer (31110), Ch-37-42 useEffect (42082),
  Ch-43-45 useCallback/useMemo/custom Hooks (47345), Ch-47-51 React Router (50410), Ch-52-58 Redux + RTK (53723, 59725).

Per topic (primary first):
- react-jsx-rendering: 6Ied4aZxUzc from "2. React Elements" at 165 (then JSX); alternates Codevolution "React 19 Tutorial - 6 - JSX"
  (8:35, Nov 2025), Developer Way "Why React components re-render?" (13:29), React Conf "React Compiler Deep Dive" (31:08, 2024),
  eILUmCJhl64 Ch-10-16.
- react-components-props: 6Ied4aZxUzc "4. Components" at 577 (runs into Props); alternates Codevolution "8 - Props" (9:35),
  DLX62G4lc44 Props Part 1.
- react-usestate: Web Dev Simplified "Learn useState In 15 Minutes" (15:45, 1.36M views); alternates Jack Herrington
  "UseState: Asynchronous or what?" (17:00, batching/async), Codevolution "23 - How React Batches Updates" (4:04),
  eILUmCJhl64 Ch-26-27. The primary course's State chapter is class-based, so a Hooks video is primary.
- react-event-handling: Codevolution "React 19 Tutorial - 15 - Event Handling" (7:29, Nov 2025); alternate DLX62G4lc44.
- react-conditional-rendering: 6Ied4aZxUzc "13. Conditional Rendering" at 2403; alternates Codevolution "10 - Conditional
  Rendering" (11:41), ByteGrad "&& vs Ternary Operator" (4:05), eILUmCJhl64 Ch-18-22.
- react-lists-keys: Developer Way (Nadia Makarevich) "The mystery of React key" (13:21), focused on reconciliation, which the
  challenge is about; alternates 6Ied4aZxUzc "10. Lists and Keys" at 1782 and Codevolution "13 - Index as Key Anti-Pattern".
- react-controlled-forms: Dave Gray "React JS Forms | Controlled Inputs" (37:31, 2021, Hooks); alternates freeCodeCamp
  "What's New in React 19" from "Form action" at 785, Web Dev Simplified "Learn useActionState In 8 Minutes",
  eILUmCJhl64 Ch-28-34.
- react-lifting-state-up: Codevolution "React 19 Tutorial - 26 - Sharing State Between Components" (12:16, Dec 2025);
  alternate DLX62G4lc44 Container/Component Architecture. Other search hits were Hindi-only or 2017-era class videos.
- react-composition: React Training (Michael Jackson) "Using Composition in React to Avoid 'Prop Drilling'" (15:42);
  alternates Developer Way "Preventing React re-renders with composition" (12:11), eILUmCJhl64 Ch-23-25.
- Rejected: SuperSimpleDev "React Tutorial Full Course (React 19, 2025)" `TtPXvEcE11E` is not embeddable (oEmbed 401).
- No search-URL fallbacks.

## References
- `https://github.com/facebook/react/...` now redirects to `https://github.com/react/react/...`; the final URL is used for
  ReactChildFiber.js.
- Block iframe previews: kentcdodds.com (CSP `frame-ancestors 'self'`), github.com (`frame-ancestors 'none'`).
  react.dev, legacy.reactjs.org, overreacted.io, joshwcomeau.com and developerway.com allow framing.

## Facts verified
- React 19.3.0 released 2026-09-09 (react.dev/versions and the 19.3 blog post): `<ViewTransition>` and Fragment refs are
  stable, `use(browser())`, Trusted Types support, `<Context>` renderable in Server Components.
- React 19.2 (2025-10-01): `<Activity>`, `useEffectEvent`, `cacheSignal`. Activity docs: hidden mode uses `display: none`,
  destroys Effects, keeps state, re-renders hidden children at lower priority.
- React Compiler 1.0 released 2025-10-07 (react.dev blog).
- React 19 upgrade guide: `ReactDOM.render` removed; `propTypes` silently ignored; `defaultProps` removed for function
  components (kept for classes). React 19 blog: `ref` as a prop for function components.
- React 18: automatic batching in timeouts/promises/native handlers; components may return `undefined`.
- React 17 RC blog: listeners attached to the root container instead of `document`; `onScroll` no longer bubbles; event
  pooling removed and `e.persist()` is a no-op.
- react.dev: `0 &&` pitfall (conditional rendering); index is the implicit key and `Math.random()` keys remount
  (rendering lists); nested component definitions reset state, and a different `key` resets (preserving state); portal
  events propagate through the React tree (createPortal); `onScroll` is the only non-propagating event (responding to
  events); the Tea cup example shows #2, #4, #6 under Strict Mode (keeping components pure); Strict Mode double-calls
  component bodies, `useState`/`useMemo`/`useReducer` functions and set-function updaters; `setFn(() => fn)` to store a
  function and Object.is bail-out (useState); `value` without `onChange` warning and the uncontrolled-to-controlled
  warning (input); uncontrolled fields reset after a successful form action (form); `Children` doesn't traverse fragments.
- React source (ReactChildFiber.js `placeChild`): a matched fiber whose old index is below `lastPlacedIndex` is a move,
  otherwise it stays and `lastPlacedIndex` becomes its old index. ReactJSXElement.js coerces keys with `'' + config.key`.
  The lists-keys challenge models exactly this.
- Legacy docs: "At Facebook, we use React in thousands of components, and we haven't found any use cases where we would
  recommend creating component inheritance hierarchies."
