import type { Module } from "@/types/curriculum";

export default {
  id: "fe-react-hooks",
  trackId: "frontend",
  name: "React Hooks & Advanced Patterns",
  description:
    "The React a senior engineer is expected to reason about, not just use: effects as synchronisation, context and reducers, refs, referential stability and memoisation, custom hooks, error boundaries and portals, composition patterns, Suspense and code splitting, concurrent rendering, Server Components and the reconciler itself. Written against React 19.3, with nasty quizzes and five implement-it-yourself challenges (a reducer, `shallowEqual` + `memo`, a race-safe `useFetch`, `lazy`, and a keyed children diff).",
  refs: [
    { label: "react.dev: Built-in React Hooks", url: "https://react.dev/reference/react/hooks", kind: "docs" },
    { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
  ],
  topics: [
    {
      id: "react-adv-use-effect",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "useEffect Deep Dive: Dependencies, Cleanup & Common Bugs",
      summary:
        "`useEffect` exists to synchronise a component with something React doesn't control: a socket, a subscription, a non-React widget, a timer. The model that prevents most bugs is synchronisation, not lifecycle. An effect says how to start syncing with the current props and state, and its cleanup says how to stop. Whenever a dependency changes (compared with `Object.is`), React runs the old cleanup with the old values, then the new setup; with no array it does this after every commit. An empty array doesn't mean \"on mount\", it means \"depends on nothing reactive\".\n\nThe dependency array is a declaration the linter checks, not a knob you tune. Leave out a value you read and you get a stale closure that keeps seeing the render it came from. Objects and functions created during render are new every time, so as dependencies they re-run the effect on every render, and an effect that sets state from them can loop forever. The fixes are structural: move the object into the effect, depend on primitives, use functional updates, or move non-reactive logic into `useEffectEvent` (stable since React 19.2).\n\nMany effects shouldn't exist: derived values belong in render, reactions to user actions in event handlers, and fetching in a framework or cache library (a hand-rolled fetch effect must ignore stale responses or it races). In development, StrictMode runs an extra setup-and-cleanup cycle on mount to prove the cleanup mirrors the setup; fix the cleanup rather than skipping the second run with a ref. Ordering is a classic interview trap: child effects run before their parent's, all cleanups run before any new setups, and `useLayoutEffect` runs before paint while `useEffect` usually runs after it.",
      level: "advanced",
      estMinutes: 90,
      isMilestone: true,
      webRefs: [
        { label: "react.dev: useEffect", url: "https://react.dev/reference/react/useEffect", kind: "docs" },
        { label: "react.dev: Lifecycle of Reactive Effects", url: "https://react.dev/learn/lifecycle-of-reactive-effects", kind: "docs" },
        { label: "react.dev: You Might Not Need an Effect", url: "https://react.dev/learn/you-might-not-need-an-effect", kind: "docs" },
        { label: "Overreacted: A Complete Guide to useEffect", url: "https://overreacted.io/a-complete-guide-to-useeffect/", kind: "article" },
      ],
      video: {
        title: "Full React Course 2020 - Learn Fundamentals, Hooks, Context API, React Router, Custom Hooks",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=4UZrsTqkcW4",
        videoId: "4UZrsTqkcW4",
        durationLabel: "10:07:52",
        startSeconds: 17247,
        chapterLabel: "useEffect - Basics",
      },
      alternateVideos: [
        {
          title: "Goodbye, useEffect - David Khourshid",
          channel: "BeJS",
          url: "https://www.youtube.com/watch?v=bGzanfKVFeU",
          videoId: "bGzanfKVFeU",
          durationLabel: "29:58",
        },
        {
          title: "React 19.2 New useEffectEvent Hook: Game Changer or Gimmick?",
          channel: "Jack Herrington",
          url: "https://www.youtube.com/watch?v=hT2yWeHU37U",
          videoId: "hT2yWeHU37U",
          durationLabel: "11:28",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-adv-use-effect-q1",
          prompt:
            "The app is mounted once with `createRoot(el).render(<Parent />)` (no StrictMode). In what order are the lines logged?\n\n```jsx\nfunction Child() {\n  console.log(\"render Child\");\n  useEffect(() => console.log(\"effect Child\"), []);\n  return null;\n}\n\nfunction Parent() {\n  console.log(\"render Parent\");\n  useEffect(() => console.log(\"effect Parent\"), []);\n  return <Child />;\n}\n```",
          options: [
            "render Parent, render Child, effect Child, effect Parent",
            "render Parent, effect Parent, render Child, effect Child",
            "render Parent, render Child, effect Parent, effect Child",
            "render Child, render Parent, effect Child, effect Parent",
          ],
          correctIndex: 0,
          explanation:
            "Rendering is top-down (the parent has to run to produce the child element), but effects are committed bottom-up: a subtree's effects run before its parent's. That's why a parent's effect can rely on its children's effects having already run.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-effect-q2",
          prompt:
            "After mounting with `n = 1`, the app re-renders with `n = 2`. What does that update log?\n\n```jsx\nfunction Child({ n }) {\n  useEffect(() => {\n    console.log(\"setup Child \" + n);\n    return () => console.log(\"cleanup Child \" + n);\n  }, [n]);\n  return null;\n}\n\nfunction Parent({ n }) {\n  useEffect(() => {\n    console.log(\"setup Parent \" + n);\n    return () => console.log(\"cleanup Parent \" + n);\n  }, [n]);\n  return <Child n={n} />;\n}\n```",
          options: [
            "cleanup Child 1, cleanup Parent 1, setup Child 2, setup Parent 2",
            "cleanup Child 1, setup Child 2, cleanup Parent 1, setup Parent 2",
            "cleanup Parent 1, cleanup Child 1, setup Parent 2, setup Child 2",
            "cleanup Child 2, cleanup Parent 2, setup Child 2, setup Parent 2",
          ],
          correctIndex: 0,
          explanation:
            "Since React 17 every passive-effect cleanup in a commit runs before any new setup, and both passes go child-before-parent. Each cleanup closes over the render that created it, so it logs 1, not the new value.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-effect-q3",
          prompt:
            "After about 3 seconds, what does the screen show and what has been logged?\n\n```jsx\nfunction Ticker() {\n  const [count, setCount] = useState(0);\n  useEffect(() => {\n    const id = setInterval(() => {\n      setCount((c) => c + 1);\n      console.log(count);\n    }, 1000);\n    return () => clearInterval(id);\n  }, []);\n  return <p>{count}</p>;\n}\n```",
          options: [
            "Shows 3; logged 0, 0, 0",
            "Shows 3; logged 0, 1, 2",
            "Shows 1; logged 0, 0, 0",
            "Shows 3; logged 1, 2, 3",
          ],
          correctIndex: 0,
          explanation:
            "The functional update reads the latest queued state, so the screen advances. The interval callback, though, closed over `count` from the first render, which is 0 forever. Reading state through the updater hides a stale closure; it doesn't remove it.",
        },
        {
          id: "react-adv-use-effect-q4",
          prompt:
            "Why does this component re-render forever? (`search` is synchronous and returns a new array.)\n\n```jsx\nfunction Results({ query }) {\n  const [items, setItems] = useState([]);\n  const options = { query, limit: 20 };\n  useEffect(() => {\n    setItems(search(options));\n  }, [options]);\n  return <List items={items} />;\n}\n```",
          options: [
            "`options` is a new object on every render, so the effect runs after every commit, and setting a new array triggers another render",
            "An effect with a dependency array always runs twice, and the second run schedules a third",
            "`search` runs during render because it's referenced from the dependency array",
            "State updates inside effects aren't batched, so `setItems` re-renders synchronously in a loop",
          ],
          correctIndex: 0,
          explanation:
            "Dependencies are compared with `Object.is`, and a fresh object literal never equals the previous one. Each run stores a new array (never equal to the old one), which renders again and creates another `options`. Build the object inside the effect and depend on `query`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-effect-q5",
          prompt: "Which statements about `<StrictMode>` in development are true? (Select all that apply.)",
          options: [
            "Every effect gets one extra setup + cleanup cycle when its component mounts",
            "Component bodies and the functions passed to `useState`, `useMemo` and `useReducer` are called twice",
            "Callback refs get an extra setup + cleanup cycle on mount",
            "The extra effect cycle also runs in production builds, once per page load",
            "Guarding the effect body with a `useRef` flag so it only runs once is the recommended fix",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "All three are development-only stress tests. A ref guard only hides the symptom: the component still breaks when React legitimately unmounts and remounts it (Fast Refresh, a hidden `<Activity>`, back navigation), so write a cleanup that undoes the setup instead.",
        },
        {
          id: "react-adv-use-effect-q6",
          prompt:
            "`userId` changes from 1 to 2 quickly, and the response for user 1 arrives after the response for user 2. What does the heading end up showing, and what's the fix?\n\n```jsx\nfunction Profile({ userId }) {\n  const [user, setUser] = useState(null);\n  useEffect(() => {\n    fetchUser(userId).then(setUser);\n  }, [userId]);\n  return <h1>{user?.name}</h1>;\n}\n```",
          options: [
            "User 1's name; ignore stale responses with a flag (or abort the request) in the effect's cleanup",
            "User 2's name; React drops state updates from effects whose dependencies have changed",
            "User 1's name; add `user` to the dependency array so the effect re-runs",
            "User 2's name; `.then(setUser)` is cancelled automatically when the effect re-runs",
          ],
          correctIndex: 0,
          explanation:
            "Nothing cancels the first request, so its late `setUser` overwrites the newer data. A cleanup that sets `ignore = true` or calls `controller.abort()` turns the stale response into a no-op. Adding `user` as a dependency would just refetch in a loop.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-effect-q7",
          prompt:
            "`roomId` changes from `\"general\"` to `\"music\"`. What does this effect log for that change?\n\n```jsx\nuseEffect(() => {\n  console.log(\"connect \" + roomId);\n  return () => console.log(\"disconnect \" + roomId);\n}, [roomId]);\n```",
          options: [
            "disconnect general, then connect music",
            "disconnect music, then connect music",
            "connect music, then disconnect general",
            "Only connect music: cleanups run only on unmount",
          ],
          correctIndex: 0,
          explanation:
            "Each render's effect closes over its own `roomId`, and React runs the previous effect's cleanup (with the old value) before the next setup. Cleanup runs on every re-synchronisation, not just on unmount.",
        },
        {
          id: "react-adv-use-effect-q8",
          prompt:
            "The previous render's dependency array was `[obj, NaN, 0, \"a\", list]`. Which of these next-render changes make the effect re-run? (Select all that apply.)",
          options: [
            "`obj` is replaced by `{ ...obj }` with identical contents",
            "`NaN` is still `NaN`",
            "`0` becomes `-0`",
            "`\"a\"` is still `\"a\"`",
            "`list` is the same array after `list.push(4)`",
          ],
          correctIndex: 0,
          correctIndices: [0, 2],
          explanation:
            "React compares each dependency with `Object.is`: a copy is a different reference, `Object.is(NaN, NaN)` is true, and `Object.is(0, -0)` is false. Mutating an array in place keeps the same reference, so the effect never sees the change, which is one reason state must be updated immutably.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-effect-q9",
          prompt:
            "Toggling the theme reconnects the chat. What's the idiomatic fix in React 19.2+?\n\n```jsx\nfunction ChatRoom({ roomId, theme }) {\n  useEffect(() => {\n    const conn = createConnection(roomId);\n    conn.on(\"connected\", () => showNotification(\"Connected!\", theme));\n    conn.connect();\n    return () => conn.disconnect();\n  }, [roomId, theme]);\n}\n```",
          options: [
            "Wrap the notification in `useEffectEvent`, call that from the effect, and drop `theme` from the dependencies",
            "Remove `theme` from the dependency array and add an eslint-disable comment so the linter stops complaining",
            "Wrap the notification callback in `useCallback` with `[theme]` and list that callback as the dependency instead",
            "Copy `theme` into a state variable inside the effect so it stops counting as a reactive dependency",
          ],
          correctIndex: 0,
          explanation:
            "An Effect Event always sees the latest props and state but isn't reactive, so it isn't (and mustn't be) a dependency. Silencing the linter freezes `theme` at its first value, and a `useCallback` over `theme` changes whenever `theme` does, so it reconnects just the same.",
        },
        {
          id: "react-adv-use-effect-q10",
          prompt:
            "What's wrong with this component?\n\n```jsx\nfunction Greeting({ first, last }) {\n  const [fullName, setFullName] = useState(\"\");\n  useEffect(() => {\n    setFullName(first + \" \" + last);\n  }, [first, last]);\n  return <p>{fullName}</p>;\n}\n```",
          options: [
            "It commits a stale `fullName` on every change, then renders again; derive it during render instead",
            "Nothing is wrong: syncing derived state from props in an effect is the pattern react.dev recommends",
            "It loops forever: `setFullName` re-renders the parent, which passes new `first` and `last` props",
            "The effect never runs, because string dependencies are compared by reference and never change",
          ],
          correctIndex: 0,
          explanation:
            "Effects run after commit, so the stale value reaches the screen and the subtree renders twice per change. Anything computable from props or state belongs in render, wrapped in `useMemo` only if it's measurably expensive.",
        },
        {
          id: "react-adv-use-effect-q11",
          prompt:
            "A click handler calls `setOpen(true)`, and an effect with `[open]` calls `alert(\"opened\")`. Users see the alert before the dialog is painted. According to the React docs, why?",
          options: [
            "When an effect is caused by a discrete interaction such as a click, React may run it before the browser paints",
            "`useEffect` always runs before paint; only `useLayoutEffect` waits until after paint",
            "`alert` is asynchronous, so it jumps ahead of React's commit phase",
            "StrictMode delays painting in development until all effects have run",
          ],
          correctIndex: 0,
          explanation:
            "Effects normally run after paint, but for updates caused by discrete events React may flush them early so their results are observable by the event system. Work that must wait for paint can be deferred with `setTimeout`; work that must block paint belongs in `useLayoutEffect`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-effect-q12",
          prompt:
            "A tooltip measures its own height in an effect and then moves itself above the anchor. With `useEffect` it flickers in the wrong position for a frame. What does switching to `useLayoutEffect` change?",
          options: [
            "It runs after React updates the DOM but before the browser paints, so only the corrected position is ever painted",
            "It runs before React updates the DOM, so the tooltip is measured before it's inserted",
            "It also runs on the server, so the measured position is included in the HTML",
            "It moves the measurement off the main thread so it no longer blocks rendering",
          ],
          correctIndex: 0,
          explanation:
            "Layout effects, and state updates made inside them, are processed synchronously before paint, so the user never sees the first position. The price is that they block painting, which is why they're reserved for measurement-driven layout.",
        },
      ],
    },
    {
      id: "react-adv-use-context",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "useContext & Avoiding Prop Drilling",
      summary:
        "Context solves one specific problem: a value that many components at different depths need, where threading it through every intermediate prop list (prop drilling) couples components that don't care about it. A component reads the value from the closest provider above it, or the `createContext` default when there is none. In React 19 you render `<ThemeContext value={...}>` directly (`Context.Provider` still works but is slated for deprecation), and `use(ThemeContext)` reads it like `useContext` but may be called inside conditions.\n\nContext is dependency injection, not a state manager, and its update model is blunt: when a provider receives a value that isn't `Object.is`-equal to the previous one, every component that reads that context re-renders, `memo` or not. There are no selectors, so reading one field of a big object subscribes you to all of it. The classic performance bug is `value={{ user, setUser }}`, a new object on every render of the provider's owner, which re-renders every consumer even when nothing changed. Memoise the value, split fast- and slow-changing data into separate contexts (state and `dispatch` are the textbook pair, since `dispatch` is stable), or move high-frequency shared state into an external store read through `useSyncExternalStore` or a library with selectors.\n\nBefore reaching for context, try composition: passing JSX as `children` or as props lets the intermediate layers stop knowing about the data. Gotchas that survive code review: a provider without a `value` prop provides `undefined`, not the default; `useContext` never sees a provider rendered by the same component; and two copies of a package (a duplicate version or a symlink) create two different context objects, so consumers silently get the default.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "react.dev: useContext", url: "https://react.dev/reference/react/useContext", kind: "docs" },
        { label: "react.dev: Passing Data Deeply with Context", url: "https://react.dev/learn/passing-data-deeply-with-context", kind: "docs" },
        { label: "Kent C. Dodds: How to use React Context effectively", url: "https://kentcdodds.com/blog/how-to-use-react-context-effectively", kind: "article" },
        { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Full React Course 2020 - Learn Fundamentals, Hooks, Context API, React Router, Custom Hooks",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=4UZrsTqkcW4",
        videoId: "4UZrsTqkcW4",
        durationLabel: "10:07:52",
        startSeconds: 28856,
        chapterLabel: "Prop Drilling",
      },
      alternateVideos: [
        {
          title: "This Context API Mistake Ruins Your Whole React App (All Components Re-Render)",
          channel: "ByteGrad",
          url: "https://www.youtube.com/watch?v=16yMmAJSGek",
          videoId: "16yMmAJSGek",
          durationLabel: "5:36",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-adv-use-context-q1",
          prompt:
            "`tick` changes every second. `MemoProfileMenu` is `memo(ProfileMenu)`, and `ProfileMenu` calls `useContext(UserContext)`. How often does `ProfileMenu` re-render?\n\n```jsx\nfunction App() {\n  const [user, setUser] = useState(null);\n  const tick = useTick(1000); // custom Hook: a counter that changes every second\n  return (\n    <UserContext value={{ user, setUser }}>\n      <Clock tick={tick} />\n      <MemoProfileMenu />\n    </UserContext>\n  );\n}\n```",
          options: [
            "Every second: each `App` render creates a new value object, and context changes bypass `memo`",
            "Never after mount: `memo` skips it because it has no props",
            "Only when `setUser` runs, because React compares context values deeply",
            "Every second, because `memo` components always re-render with their parent",
          ],
          correctIndex: 0,
          explanation:
            "The provider's value is compared with `Object.is`, and a new object literal is never equal, so every consumer re-renders on every `App` render; `memo` only compares props. `useMemo(() => ({ user, setUser }), [user])` fixes it, since `setUser` is stable.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-context-q2",
          prompt:
            "A component does `const { theme } = useContext(AppContext)`, where the provided value is a memoised `{ theme, user, cart }`. The cart changes (so the memoised object is rebuilt). Does the component re-render?",
          options: [
            "Yes: a new context value re-renders every consumer; there are no per-field subscriptions",
            "No: React tracks which properties each consumer destructures and skips unrelated changes",
            "No, as long as the component is wrapped in `memo`, which compares the context value shallowly",
            "Only if the component also reads `cart` somewhere in its render output",
          ],
          correctIndex: 0,
          explanation:
            "Subscriptions are per context, not per field. Split the value into separate contexts, or put high-frequency slices in an external store with selectors (`useSyncExternalStore`, Zustand, Redux).",
        },
        {
          id: "react-adv-use-context-q3",
          prompt:
            "What is `theme` inside `Button`?\n\n```jsx\nconst ThemeContext = createContext(\"light\");\n\nfunction App() {\n  return (\n    <ThemeContext>\n      <Button />\n    </ThemeContext>\n  );\n}\n\nfunction Button() {\n  const theme = useContext(ThemeContext);\n  return <button className={theme}>OK</button>;\n}\n```",
          options: ["`undefined`", "`\"light\"`", "`null`", "It throws, because a provider needs a `value`"],
          correctIndex: 0,
          explanation:
            "A provider without `value` behaves like `value={undefined}`. The default is used only when there's no provider above the consumer at all, not when a provider supplies `undefined`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-context-q4",
          prompt:
            "`Panel` is rendered as `<ThemeContext value=\"light\"><Panel /></ThemeContext>`. What does the paragraph show?\n\n```jsx\nfunction Panel() {\n  const theme = useContext(ThemeContext);\n  return (\n    <ThemeContext value=\"dark\">\n      <p>{theme}</p>\n    </ThemeContext>\n  );\n}\n```",
          options: ["`light`", "`dark`", "Nothing: `theme` is `undefined`", "It depends on which provider renders first"],
          correctIndex: 0,
          explanation:
            "`useContext` looks for the closest provider above the calling component; a provider that the component renders itself is below it and doesn't count. Read the context in a child component to get `dark`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-context-q5",
          prompt: "Which of these are valid in React 19? (Select all that apply.)",
          options: [
            "Rendering `<ThemeContext value=\"dark\">` as a provider",
            "Calling `use(ThemeContext)` inside an `if` block",
            "Calling `useContext(ThemeContext)` inside an `if` block",
            "Rendering `<ThemeContext.Provider value=\"dark\">`",
            "Calling `useContext(ThemeContext)` inside a click handler",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "React 19 lets you render the context itself as its provider, and `.Provider` still works (a future release will deprecate it). `use` isn't a Hook, so it may be called conditionally; `useContext` follows the Rules of Hooks, so it can't go in conditions or event handlers.",
        },
        {
          id: "react-adv-use-context-q6",
          prompt:
            "A reducer's state and `dispatch` are provided through two separate contexts from the same component. A deeply nested `AddButton` reads only the dispatch context. When the state changes, what happens to `AddButton`?",
          options: [
            "It isn't re-rendered by the context change, because `dispatch` keeps the same identity",
            "It re-renders, because both contexts are provided by the same component",
            "It re-renders, because consumers re-render whenever any provider above them re-renders",
            "It throws, because functions can't be passed through context",
          ],
          correctIndex: 0,
          explanation:
            "A consumer re-renders for a context only when that context's value changes by `Object.is`, and `dispatch` is stable. `AddButton` can still re-render for ordinary reasons, such as its own parent re-rendering.",
        },
        {
          id: "react-adv-use-context-q7",
          prompt:
            "`Layout` passes `user` through `Header` and `Nav` only so that `Avatar` can read it. Which change removes the drilling without using context?",
          options: [
            "Have `Layout` build `<Avatar user={user} />` itself and pass it down as a prop or `children`",
            "Store `user` in a module-level variable that `Avatar` imports directly, skipping the props",
            "Wrap `Header` and `Nav` in `memo` so they stop receiving and re-rendering for the prop",
            "Pass `user` down through a ref so the intermediate components never re-render for it",
          ],
          correctIndex: 0,
          explanation:
            "Passing elements (as `children` or other props) lets the component that owns the data build the leaf itself, and the layers in between just place a slot. react.dev recommends trying this before context. A module variable isn't reactive, and `memo` doesn't remove a prop.",
        },
        {
          id: "react-adv-use-context-q8",
          prompt:
            "`Toolbar` isn't memoised and renders `<ThemedButton />`, which calls `useContext(ThemeContext)`. After the button is clicked, which components re-render? (Select all that apply.)\n\n```jsx\nfunction App() {\n  const [count, setCount] = useState(0);\n  const value = useMemo(() => ({ theme: \"dark\" }), []);\n  return (\n    <ThemeContext value={value}>\n      <Toolbar />\n      <button onClick={() => setCount(count + 1)}>{count}</button>\n    </ThemeContext>\n  );\n}\n```",
          options: [
            "`App`",
            "`Toolbar`, because `App`'s render creates a new `<Toolbar />` element",
            "`ThemedButton`, because its parent `Toolbar` re-rendered",
            "Nothing below the provider, because the context value didn't change",
            "Only `ThemedButton`, because it's the only context consumer",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A stable context value only prevents context-driven re-renders. Ordinary rendering still cascades from `App` down through `Toolbar` and `ThemedButton` unless something is memoised or the subtree is passed in as `children` from above.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-context-q9",
          prompt:
            "In a monorepo, a component always gets the context's default value even though React DevTools shows the provider above it. Both files import `ThemeContext` from `@acme/ui`. What's the most likely cause?",
          options: [
            "Two copies of `@acme/ui` are bundled (a symlink or duplicate version), so the provider and the consumer use different context objects",
            "The provider's value is memoised, so React skips propagating it",
            "Context only works when provider and consumer are in the same file",
            "The consumer uses `useContext` instead of `use`, which doesn't see providers from other packages",
          ],
          correctIndex: 0,
          explanation:
            "A context is identified by the object `createContext` returned, so a second module instance means a second, unrelated context. react.dev suggests comparing the two objects via globals and fixing the duplication in the bundler.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-context-q10",
          prompt:
            "The pointer position, updated on every `pointermove`, is shared through context with 200 consumers, and the page janks. What's the problem and the better tool?",
          options: [
            "Every move re-renders all 200 consumers; an external store with selectors lets each re-render only for its slice",
            "Context can't carry frequently changing primitives, so the position must live in a ref instead",
            "Nothing is wrong: React throttles context updates so each consumer renders at most once a second",
            "Call `useDeferredValue` inside the provider, which stops the consumers from re-rendering at all",
          ],
          correctIndex: 0,
          explanation:
            "Context is a broadcast, so a high-frequency value fans out to every reader on every change. A store with selectors lets a component skip updates to slices it doesn't use. React doesn't throttle context updates.",
        },
        {
          id: "react-adv-use-context-q11",
          prompt: "What is the argument to `createContext(defaultValue)` actually for?",
          options: [
            "The value consumers get when no matching provider is above them, for example in an isolated test",
            "The provider's initial state, which the provider then updates over time",
            "A fallback React substitutes whenever a provider's value is `undefined`",
            "The value used only during server rendering",
          ],
          correctIndex: 0,
          explanation:
            "The default never changes and is used only when there's no provider above; a provider passing `undefined` still yields `undefined`. To make context change over time, render the provider with a state value.",
        },
      ],
    },
    {
      id: "react-adv-use-reducer",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "useReducer for Complex State",
      summary:
        "`useReducer` moves state transitions out of event handlers into one pure function, `(state, action) => nextState`. That buys three things: every way the state can change is listed in one place, the logic is testable without rendering anything, and handlers shrink to describing what happened (`dispatch({ type: \"added\", text })`) instead of how to update. Reach for it when several values change together, when the next state depends on the previous one in non-trivial ways, or when many handlers touch the same state; `useState` stays simpler for independent values.\n\nThe reducer must be pure, because React may call it more than once: StrictMode double-invokes it in development, and queued updates can be re-applied when higher-priority work interrupts a render. So no fetching, no `Date.now()`, no mutation. Immutability isn't style here, it's how React detects change: return the same object and React bails out of rendering (`Object.is`); mutate and return the same reference and the update is silently lost. The converse matters for performance: returning a fresh object for a no-op action forces a render, and rebuilding every item on each change defeats `memo` on list rows. Good reducers use structural sharing and copy only the path that changed.\n\n`dispatch` has a stable identity, so it can travel through context or into effects without becoming a dependency, and reducer-plus-context is react.dev's own scaling pattern. Two gotchas: state read right after `dispatch` in the same handler is still the old snapshot, and an unknown action should throw rather than quietly return `state`, so typos fail loudly. Undo/redo, where history is just more state in the reducer, shows why the pattern scales.",
      level: "intermediate",
      estMinutes: 90,
      webRefs: [
        { label: "react.dev: useReducer", url: "https://react.dev/reference/react/useReducer", kind: "docs" },
        { label: "react.dev: Extracting State Logic into a Reducer", url: "https://react.dev/learn/extracting-state-logic-into-a-reducer", kind: "docs" },
        { label: "react.dev: Scaling Up with Reducer and Context", url: "https://react.dev/learn/scaling-up-with-reducer-and-context", kind: "docs" },
        { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Full React Course 2020 - Learn Fundamentals, Hooks, Context API, React Router, Custom Hooks",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=4UZrsTqkcW4",
        videoId: "4UZrsTqkcW4",
        durationLabel: "10:07:52",
        startSeconds: 26180,
        chapterLabel: "useReducer - UseState Setup",
      },
      alternateVideos: [
        {
          title: "Learn useReducer In 20 Minutes",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=kK_Wqx3RnHk",
          videoId: "kK_Wqx3RnHk",
          durationLabel: "20:12",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `historyReducer(state, action)`, an undoable todo-list reducer of the kind you'd pass to `useReducer`. State is `{ past, present, future }`: `present` is an array of todos `{ id, text, done }`, and `past` / `future` are arrays of earlier / later `present` arrays.\n\nActions:\n\n- `{ type: \"add\", id, text }`: append `{ id, text: text.trim(), done: false }`. It's a no-op if the trimmed text is empty or a todo with that `id` already exists.\n- `{ type: \"toggle\", id }`: flip that todo's `done`. No-op if the id doesn't exist.\n- `{ type: \"remove\", id }`: remove that todo. No-op if the id doesn't exist.\n- `{ type: \"clearCompleted\" }`: remove every done todo. No-op if none are done.\n- `{ type: \"undo\" }` / `{ type: \"redo\" }`: step back / forward through history. No-op when there's nothing to undo / redo.\n- Any other type: throw `new Error(\"Unknown action: \" + action.type)`.\n\nRules:\n\n- Every real change (add, toggle, remove, clearCompleted) pushes the old `present` onto `past` and clears `future`. Keep at most `MAX_HISTORY` (5) entries in `past`, dropping the oldest.\n- A no-op must return the exact same `state` object, so React can bail out of re-rendering.\n- Never mutate `state`, its arrays or its todos.\n- Todos you don't change must keep their object identity, so memoised rows can skip rendering.\n\nThe tests call `runHistory(initialTodos, actions)`, which dispatches the actions in order and reports the final `present`, the history lengths, which action indices were no-ops, whether anything was mutated, and whether unchanged todos kept their identity. Leave the driver as it is.",
        starterCode: `const MAX_HISTORY = 5;

/**
 * @typedef {{ id: number, text: string, done: boolean }} Todo
 * @typedef {{ past: Todo[][], present: Todo[], future: Todo[][] }} HistoryState
 * @param {HistoryState} state
 * @param {{ type: string, id?: number, text?: string }} action
 * @returns {HistoryState}
 */
function historyReducer(state, action) {
  // Your code here
  return state;
}

// ---- Test driver (leave as is) ----
// Dispatches the actions one by one, the way useReducer would, and reports the final state
// plus what React would care about: which dispatches were no-ops (same state object, so
// React bails out), whether any state was mutated, and whether unchanged todos kept their
// object identity (so memoized rows can skip re-rendering).
function runHistory(initialTodos, actions) {
  let state = { past: [], present: initialTodos, future: [] };
  const noops = [];
  let mutated = false;
  let identityPreserved = true;
  for (const [i, action] of actions.entries()) {
    const before = JSON.stringify(state);
    let next;
    try {
      next = historyReducer(state, action);
    } catch (e) {
      return { error: String((e && e.message) || e) };
    }
    if (JSON.stringify(state) !== before) mutated = true;
    if (!next || !Array.isArray(next.present) || !Array.isArray(next.past) || !Array.isArray(next.future)) {
      return { error: "reducer must return { past, present, future }" };
    }
    if (next === state) noops.push(i);
    for (const todo of next.present) {
      const old = state.present.find((t) => t.id === todo.id);
      if (old && old !== todo && old.text === todo.text && old.done === todo.done) identityPreserved = false;
    }
    state = next;
  }
  return {
    present: state.present,
    pastLength: state.past.length,
    futureLength: state.future.length,
    noops,
    mutated,
    identityPreserved,
  };
}
`,
        functionName: "runHistory",
        testCases: [
          {
            description: "adding and toggling builds history, trims text and keeps other todos' identity",
            args: [
              [],
              [
                { type: "add", id: 1, text: "Write tests" },
                { type: "add", id: 2, text: " Ship it " },
                { type: "toggle", id: 1 },
              ],
            ],
            expected: {
              present: [
                { id: 1, text: "Write tests", done: true },
                { id: 2, text: "Ship it", done: false },
              ],
              pastLength: 3,
              futureLength: 0,
              noops: [],
              mutated: false,
              identityPreserved: true,
            },
          },
          {
            description: "undo twice, then redo once",
            args: [
              [],
              [
                { type: "add", id: 1, text: "a" },
                { type: "add", id: 2, text: "b" },
                { type: "toggle", id: 2 },
                { type: "undo" },
                { type: "undo" },
                { type: "redo" },
              ],
            ],
            expected: {
              present: [
                { id: 1, text: "a", done: false },
                { id: 2, text: "b", done: false },
              ],
              pastLength: 2,
              futureLength: 1,
              noops: [],
              mutated: false,
              identityPreserved: true,
            },
          },
          {
            description: "a new change after an undo clears the redo stack, so the redo is a no-op",
            args: [
              [],
              [
                { type: "add", id: 1, text: "a" },
                { type: "add", id: 2, text: "b" },
                { type: "undo" },
                { type: "add", id: 3, text: "c" },
                { type: "redo" },
              ],
            ],
            expected: {
              present: [
                { id: 1, text: "a", done: false },
                { id: 3, text: "c", done: false },
              ],
              pastLength: 2,
              futureLength: 0,
              noops: [4],
              mutated: false,
              identityPreserved: true,
            },
          },
          {
            description: "no-op actions return the very same state object and don't touch history",
            args: [
              [{ id: 1, text: "a", done: false }],
              [
                { type: "toggle", id: 99 },
                { type: "add", id: 2, text: "   " },
                { type: "undo" },
                { type: "redo" },
                { type: "clearCompleted" },
                { type: "remove", id: 42 },
                { type: "add", id: 1, text: "duplicate id" },
              ],
            ],
            expected: {
              present: [{ id: 1, text: "a", done: false }],
              pastLength: 0,
              futureLength: 0,
              noops: [0, 1, 2, 3, 4, 5, 6],
              mutated: false,
              identityPreserved: true,
            },
            isEdgeCase: true,
          },
          {
            description: "history is capped at MAX_HISTORY entries, so only 5 undos are possible",
            args: [
              [],
              [
                ...Array.from({ length: 7 }, (_, i) => ({ type: "add", id: i + 1, text: "t" + (i + 1) })),
                ...Array.from({ length: 6 }, () => ({ type: "undo" })),
              ],
            ],
            expected: {
              present: [
                { id: 1, text: "t1", done: false },
                { id: 2, text: "t2", done: false },
              ],
              pastLength: 0,
              futureLength: 5,
              noops: [12],
              mutated: false,
              identityPreserved: true,
            },
            isEdgeCase: true,
          },
          {
            description: "an unknown action type throws",
            args: [[{ id: 1, text: "a", done: false }], [{ type: "toggle", id: 1 }, { type: "rename", id: 1, text: "b" }]],
            expected: { error: "Unknown action: rename" },
            isEdgeCase: true,
          },
          {
            description: "clearCompleted and remove leave untouched todos as the same objects",
            args: [
              [
                { id: 1, text: "a", done: true },
                { id: 2, text: "b", done: false },
                { id: 3, text: "c", done: true },
                { id: 4, text: "d", done: false },
              ],
              [{ type: "clearCompleted" }, { type: "toggle", id: 4 }, { type: "remove", id: 2 }],
            ],
            expected: {
              present: [{ id: 4, text: "d", done: true }],
              pastLength: 3,
              futureLength: 0,
              noops: [],
              mutated: false,
              identityPreserved: true,
            },
          },
        ],
      },
    },
    {
      id: "react-adv-use-ref",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "useRef & Imperative Escape Hatches",
      summary:
        "A ref is a mutable box, `{ current }`, that survives re-renders without causing them. That is the whole contract, and it's why refs are the escape hatch for anything that shouldn't drive rendering: DOM nodes you need to focus, measure or scroll; timer and subscription ids; an instance of a non-React library; the latest version of a callback used by a long-lived listener. If a value shows up in the JSX, it belongs in state; if changing it should never repaint anything, a ref is right.\n\nThe rule people break is reading or writing `ref.current` during render (lazy initialisation excepted). Rendering must be pure: concurrent React can run a render several times or throw it away, and React Compiler assumes purity, so output that depends on a mutable box becomes unpredictable. Touch refs in event handlers and effects instead. Also, `useRef(expensive())` evaluates its argument on every render and simply ignores it after the first; the `if (ref.current === null)` lazy-init pattern avoids that.\n\nDOM refs are `null` during the first render; React sets them during commit, before layout effects run, so read them in effects or handlers. Callback refs (`ref={node => ...}`) run when the node attaches and, since React 19, may return a cleanup function. An inline callback is a new function on every render, so React detaches and re-attaches it each time, and StrictMode adds an extra ref setup-and-cleanup cycle in development to expose missing cleanup. When the DOM must reflect a state change before you touch it, such as scrolling to an item you just added, `flushSync` commits the update synchronously first.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "react.dev: useRef", url: "https://react.dev/reference/react/useRef", kind: "docs" },
        { label: "react.dev: Referencing Values with Refs", url: "https://react.dev/learn/referencing-values-with-refs", kind: "docs" },
        { label: "react.dev: Manipulating the DOM with Refs", url: "https://react.dev/learn/manipulating-the-dom-with-refs", kind: "docs" },
        { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Full React Course 2020 - Learn Fundamentals, Hooks, Context API, React Router, Custom Hooks",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=4UZrsTqkcW4",
        videoId: "4UZrsTqkcW4",
        durationLabel: "10:07:52",
        startSeconds: 25589,
        chapterLabel: "useRef",
      },
      alternateVideos: [
        {
          title: "Learn useRef in 11 Minutes",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=t2ypzz6gJm0",
          videoId: "t2ypzz6gJm0",
          durationLabel: "10:20",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-adv-use-ref-q1",
          prompt:
            "The user clicks the button three times and nothing else causes a render. What does the button say?\n\n```jsx\nfunction Counter() {\n  const clicks = useRef(0);\n  return (\n    <button onClick={() => { clicks.current += 1; }}>\n      Clicked {clicks.current} times\n    </button>\n  );\n}\n```",
          options: ["Clicked 0 times", "Clicked 3 times", "Clicked 1 times", "It throws, because refs are read-only inside event handlers"],
          correctIndex: 0,
          explanation:
            "Mutating `ref.current` doesn't schedule a render, so the text keeps the first render's value; it would jump to 3 the next time something else re-rendered the component. Reading a ref during render is against the rules for exactly this reason.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-ref-q2",
          prompt: "Which of these belong in a ref rather than in state? (Select all that apply.)",
          options: [
            "The id returned by `setInterval`, used only to clear it later",
            "A DOM node you need to call `.focus()` on",
            "An instance of a third-party chart library created in an effect",
            "The text of a controlled input that is shown on screen",
            "Whether a dropdown is open, used to decide what to render",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Values that never affect the rendered output go in refs. Anything the JSX depends on must be state, so that changing it re-renders the component.",
        },
        {
          id: "react-adv-use-ref-q3",
          prompt: "Why do the React docs forbid reading or writing `ref.current` during rendering (lazy initialisation aside)?",
          options: [
            "Rendering must be pure: renders can be repeated or discarded, so output that depends on a mutable box becomes unpredictable",
            "`ref.current` always reads as `null` during rendering, whatever was stored in it earlier",
            "Reading `ref.current` during render subscribes the component, so every later write triggers an extra render",
            "Refs are created only after the first commit, so reading one during render throws a ReferenceError",
          ],
          correctIndex: 0,
          explanation:
            "Under concurrent rendering and StrictMode React may call a component several times per commit, and a render that mutates or depends on a ref can give different output each time. React Compiler also relies on components being pure.",
        },
        {
          id: "react-adv-use-ref-q4",
          prompt:
            "What's wasteful here, and what's the fix?\n\n```jsx\nfunction Player() {\n  const playerRef = useRef(new VideoPlayer());\n  // ...\n}\n```",
          options: [
            "`new VideoPlayer()` runs on every render and is discarded after the first; create it lazily when `playerRef.current` is `null`",
            "Nothing: `useRef` only evaluates its argument once, on the first render, like a lazy initialiser",
            "A new player replaces `playerRef.current` on every render, so the player loses its playback state",
            "`useRef` can't hold class instances, so the player has to be stored in state instead",
          ],
          correctIndex: 0,
          explanation:
            "Like any function argument, the expression is evaluated on every render; `useRef` just ignores it after mounting. The docs' `if (playerRef.current === null) playerRef.current = new VideoPlayer()` pattern is the one sanctioned write during render.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-ref-q5",
          prompt:
            "What's logged when this mounts (no StrictMode)?\n\n```jsx\nfunction Search() {\n  const inputRef = useRef(null);\n  console.log(\"render\", inputRef.current);\n  useEffect(() => {\n    console.log(\"effect\", inputRef.current);\n  }, []);\n  return <input ref={inputRef} />;\n}\n```",
          options: [
            "`render null`, then `effect` with the input element",
            "`render` with the input element, then `effect` with the input element",
            "`render null`, then `effect null`",
            "`render undefined`, then `effect` with the input element",
          ],
          correctIndex: 0,
          explanation:
            "During the first render the DOM node doesn't exist yet. React sets `ref.current` during commit, right after updating the DOM and before layout effects and effects run.",
        },
        {
          id: "react-adv-use-ref-q6",
          prompt:
            "The row mounts, then the user hovers it once (no StrictMode). What's logged?\n\n```jsx\nfunction Row({ item }) {\n  const [hover, setHover] = useState(false);\n  return (\n    <div\n      ref={(node) => {\n        console.log(node ? \"attach\" : \"detach\");\n      }}\n      onMouseEnter={() => setHover(true)}\n    >\n      {item.name}\n    </div>\n  );\n}\n```",
          options: [
            "attach, then detach, attach",
            "attach only: a callback ref runs once per DOM node",
            "attach, then attach again (no detach)",
            "Nothing until the row unmounts",
          ],
          correctIndex: 0,
          explanation:
            "The inline arrow is a different ref callback on every render, so on the re-render React calls the old one with `null` (it returned no cleanup) and the new one with the node. Hoist it or wrap it in `useCallback` if attaching is expensive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-ref-q7",
          prompt: "In React 19, what happens when a ref callback returns a function?",
          options: [
            "React calls that function when the ref is detached, instead of calling the callback with `null`",
            "React ignores the return value, exactly as it did in React 18",
            "React calls the returned function immediately after attaching the node",
            "React uses the returned function as the ref callback for the next render",
          ],
          correctIndex: 0,
          explanation:
            "Ref cleanup functions arrived in React 19; when one is returned, React skips the legacy `null` call. It's also why TypeScript now rejects implicit returns such as `ref={(el) => (myRef.current = el)}`.",
        },
        {
          id: "react-adv-use-ref-q8",
          prompt:
            "This scrolls to the item before the one just added. Why, and what fixes it?\n\n```jsx\nfunction handleAdd() {\n  setTodos([...todos, newTodo]);\n  listRef.current.lastChild.scrollIntoView();\n}\n```",
          options: [
            "The update is committed after the handler returns, so the DOM doesn't have the new item yet; wrap the update in `flushSync`",
            "`scrollIntoView` is asynchronous, so the handler must `await` it before the scroll position is correct",
            "The ref is only refreshed on the next render, so it still points at a stale copy of the list element",
            "`lastChild` skips nodes that React rendered in the current tick, so query the last element by id instead",
          ],
          correctIndex: 0,
          explanation:
            "React batches updates and commits them after the event handler finishes, so the DOM is one step behind. `flushSync(() => setTodos(...))` commits synchronously, so the next line sees the new node.",
        },
        {
          id: "react-adv-use-ref-q9",
          prompt: "Which approach do the React docs recommend for tracking what a prop was on the previous render?",
          options: [
            "Keep the previous value in state and, during render, update it when the prop differs",
            "Copy the prop into a ref in an effect and read the ref during render (the classic `usePrevious`)",
            "Read `ref.previous`, which React fills in automatically for every ref object",
            "Store it in a module-level variable that each render overwrites after reading",
          ],
          correctIndex: 0,
          explanation:
            "The `useState` docs show storing the previous value in state and calling its setter during render when the prop changes. The popular `usePrevious` reads a ref during render, which the docs forbid because it breaks under repeated or discarded renders.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-use-ref-q10",
          prompt:
            "A resize handler writes the new width to `sizeRef.current`. When does `report` run?\n\n```jsx\nconst sizeRef = useRef(0);\nuseEffect(() => {\n  report(sizeRef.current);\n}, [sizeRef.current]);\n```",
          options: [
            "Only if something else re-renders the component after the ref changed; the write alone never triggers it",
            "Every time `sizeRef.current` changes, because React watches every value listed as a dependency",
            "Once on mount only, because React ignores ref values that appear in dependency arrays",
            "On every render, because the ref object is recreated and compared by reference each time",
          ],
          correctIndex: 0,
          explanation:
            "Dependencies are only compared when the component renders, and writing to a ref doesn't cause a render. If a change should re-run the effect, it has to be state (or a subscription that sets state).",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "react-adv-memo-callback",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "useMemo & useCallback: When They're Actually Worth It",
      summary:
        "`useMemo` caches the result of a calculation and `useCallback` caches a function (it is literally `useMemo(() => fn, deps)`), both keyed on dependencies compared with `Object.is`. They exist for referential stability as much as for speed. JavaScript creates new objects and functions on every render, and that only matters when something downstream compares identities: a `memo` child's props, another hook's dependency array, or a context value. `useCallback` on a handler passed to a plain, non-memoised child buys nothing but a comparison and some memory.\n\nMeasure before memoising. The docs' rule of thumb is about 1 ms of work, timed in a production build with CPU throttling (your laptop is faster than your users' phones), and memoisation only speeds up re-renders, never the first render. It fails silently in predictable ways: an inline object in the dependency list, a `children` prop (fresh JSX elements every render) passed to a `memo` child, or a callback that reads state and so changes on every keystroke, where a functional update (`setItems(prev => ...)`) removes the dependency.\n\nThe key caveat is semantic: memoisation is a performance hint, not a guarantee. React may discard the cache (in development when you edit the file, when a component suspends during its first mount, and possibly in future features), so code that's wrong without `useMemo` is simply wrong; use state or a ref when identity must persist. React Compiler, stable since v1.0, now inserts this memoisation automatically for components and hooks that follow the Rules of React, which turns manual `useMemo` and `useCallback` into escape hatches, typically for pinning an effect dependency.",
      level: "advanced",
      estMinutes: 55,
      webRefs: [
        { label: "react.dev: useMemo", url: "https://react.dev/reference/react/useMemo", kind: "docs" },
        { label: "react.dev: useCallback", url: "https://react.dev/reference/react/useCallback", kind: "docs" },
        { label: "Josh W. Comeau: Understanding useMemo and useCallback", url: "https://www.joshwcomeau.com/react/usememo-and-usecallback/", kind: "article" },
        { label: "react.dev: Introduction to React Compiler", url: "https://react.dev/learn/react-compiler/introduction", kind: "docs" },
      ],
      video: {
        title: "Full React Course 2020 - Learn Fundamentals, Hooks, Context API, React Router, Custom Hooks",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=4UZrsTqkcW4",
        videoId: "4UZrsTqkcW4",
        durationLabel: "10:07:52",
        startSeconds: 35390,
        chapterLabel: "useCallback",
      },
      alternateVideos: [
        {
          title: "React Compiler: In-Depth Beyond React Conf 2024",
          channel: "Jack Herrington",
          url: "https://www.youtube.com/watch?v=PYHBHK37xlE",
          videoId: "PYHBHK37xlE",
          durationLabel: "15:16",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-adv-memo-callback-q1",
          prompt:
            "`Row` is a plain function component (not wrapped in `memo`). When `Page` re-renders, what does `useCallback` buy here?\n\n```jsx\nfunction Page({ items }) {\n  const handleSelect = useCallback((id) => select(id), []);\n  return items.map((item) => (\n    <Row key={item.id} item={item} onSelect={handleSelect} />\n  ));\n}\n```",
          options: [
            "Nothing for `Row`: it isn't memoised, so it re-renders anyway, and the hook just adds a comparison",
            "Each `Row` skips re-rendering, because all of its props are referentially equal",
            "It stops `Page` itself from re-rendering when its parent does",
            "It caches `select(id)` so the selection logic runs only once per id",
          ],
          correctIndex: 0,
          explanation:
            "A stable identity only helps when something compares it: `memo`, a dependency array or a context value. Without `memo`, children re-render whenever their parent does, whatever their props are.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-memo-callback-q2",
          prompt:
            "`Page` re-renders because `n` changed. Does `Card` re-render?\n\n```jsx\nconst Card = memo(function Card({ title, children }) {\n  return <section><h2>{title}</h2>{children}</section>;\n});\n\nfunction Page() {\n  const [n, setN] = useState(0);\n  return (\n    <Card title=\"Stats\">\n      <Chart />\n    </Card>\n  );\n}\n```",
          options: [
            "Yes: `<Chart />` creates a new element object on every render, so the `children` prop is never equal",
            "No: `title` is the same string and `children` is compared by component type",
            "No: `memo` deliberately leaves the `children` prop out of its comparison",
            "Only if `Chart` has its own state that changed in the meantime",
          ],
          correctIndex: 0,
          explanation:
            "JSX compiles to element objects created during render, so `children` is a fresh value each time and the shallow comparison fails. Memoise the element or restructure so it's created somewhere that doesn't re-render.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-memo-callback-q3",
          prompt: "According to the React docs, which statements about `useMemo` are true? (Select all that apply.)",
          options: [
            "React may discard the cached value, for example when a component suspends during its initial mount",
            "In StrictMode during development, the calculation function is called twice",
            "Your code should still be correct if every `useMemo` were removed",
            "The cached value is shared by every instance of the component",
            "It guarantees the calculation runs at most once per component lifetime",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`useMemo` is a performance optimisation, not a semantic guarantee: the cache is per component instance and can be thrown away. When you need a value created exactly once, use state or a lazily initialised ref.",
        },
        {
          id: "react-adv-memo-callback-q4",
          prompt:
            "How often does `filterTodos` run?\n\n```jsx\nconst visible = useMemo(\n  () => filterTodos(todos, { tab, sort }),\n  [todos, { tab, sort }]\n);\n```",
          options: [
            "On every render, because the inline `{ tab, sort }` dependency is a new object each time",
            "Only when `todos`, `tab` or `sort` change",
            "Once, because objects in dependency arrays are compared deeply",
            "Never, because React skips calculations whose dependencies contain objects",
          ],
          correctIndex: 0,
          explanation:
            "Dependencies are compared with `Object.is`, and an object literal is new on every render. List `tab` and `sort` directly instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-memo-callback-q5",
          prompt: "Which expression is equivalent to `useCallback(fn, deps)`?",
          options: ["`useMemo(() => fn, deps)`", "`useMemo(fn, deps)`", "`useRef(fn).current`", "`memo(fn)`"],
          correctIndex: 0,
          explanation:
            "`useCallback` caches the function itself. `useMemo(fn, deps)` would call `fn` and cache its return value, and a ref would never update when `deps` change.",
        },
        {
          id: "react-adv-memo-callback-q6",
          prompt:
            "`addTodo` is passed to a memoised `<NewTodoForm>`, which still re-renders after every added todo. What's the fix?\n\n```jsx\nconst addTodo = useCallback((text) => {\n  setTodos([...todos, { id: nextId(), text }]);\n}, [todos]);\n```",
          options: [
            "Use `setTodos((prev) => [...prev, { id: nextId(), text }])` and drop `todos` from the dependencies",
            "Keep the body as it is and just remove `todos` from the dependency array",
            "Replace `useCallback` with `useMemo`, which caches functions more aggressively",
            "Wrap `setTodos` in its own `useCallback` so its identity becomes stable",
          ],
          correctIndex: 0,
          explanation:
            "Because the callback reads `todos`, it must depend on it and changes whenever the list does. A functional update reads the latest state inside React, so no dependency is needed; dropping the dependency without it creates a stale closure that silently loses todos.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-memo-callback-q7",
          prompt: "Which statements about React Compiler are true? (Select all that apply.)",
          options: [
            "It memoises components and hooks automatically at build time",
            "Its memoisation isn't shared across components, so an expensive helper used in many components still runs in each",
            "`useMemo` and `useCallback` remain useful as escape hatches, for example to keep an effect dependency stable",
            "It memoises every function in the module, including plain utility functions",
            "It optimises components correctly even when they break the Rules of React, such as mutating props",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The compiler only memoises React components and hooks, per component, and relies on the Rules of React to do so safely. The docs keep `useMemo`/`useCallback` as escape hatches for precise control, such as effect dependencies.",
        },
        {
          id: "react-adv-memo-callback-q8",
          prompt: "Before wrapping a filter in `useMemo`, how do the React docs suggest deciding whether it's worth it?",
          options: [
            "Time the calculation in a production build with CPU throttling, and consider memoising around 1 ms or more",
            "Memoise every calculation that loops over an array, since array work is always expensive",
            "Memoise if the component renders more than once per second in the development build",
            "Memoise only calculations that are asynchronous, since synchronous ones are always cheap",
          ],
          correctIndex: 0,
          explanation:
            "Measure with something like `console.time`, in a production build, on a throttled CPU; development timings are distorted (StrictMode renders twice). Around 1 ms or more per interaction is the docs' rough threshold.",
        },
        {
          id: "react-adv-memo-callback-q9",
          prompt: "What does `useMemo` do to the cost of a component's first render?",
          options: [
            "It can't make it faster: the calculation still runs, plus bookkeeping; it only helps later renders",
            "It moves the calculation off the main thread so the first paint isn't blocked",
            "It postpones the calculation until the memoised value is first read",
            "It precomputes the value at build time so the first render skips it",
          ],
          correctIndex: 0,
          explanation:
            "Memoisation is a cache: the first render has nothing cached, so it pays for the calculation and the dependency bookkeeping. The benefit only appears on updates whose dependencies haven't changed.",
        },
        {
          id: "react-adv-memo-callback-q10",
          prompt:
            "This works, but what do the docs recommend instead, and why?\n\n```jsx\nfunction ChatRoom({ roomId }) {\n  const options = useMemo(() => ({ serverUrl, roomId }), [roomId]);\n  useEffect(() => {\n    const conn = createConnection(options);\n    conn.connect();\n    return () => conn.disconnect();\n  }, [options]);\n}\n```",
          options: [
            "Create `options` inside the effect and depend on `roomId`, since a discarded `useMemo` cache would reconnect",
            "Nothing better exists: `useMemo` is the only way to keep an object dependency stable",
            "Put `options` in a context provider so that its identity is shared and stable app-wide",
            "Depend on `JSON.stringify(options)` so React compares the object by value",
          ],
          correctIndex: 0,
          explanation:
            "Because `useMemo` is only a hint, React may throw the cached object away, which would make the effect re-fire and reconnect. Moving the object inside the effect removes the object dependency altogether.",
        },
        {
          id: "react-adv-memo-callback-q11",
          prompt:
            "`SlowList` is wrapped in `memo`, and the parent renders `<SlowList items={todos.filter((t) => !t.done)} />`. Typing in an unrelated input re-renders the parent. What happens?",
          options: [
            "`SlowList` re-renders on every keystroke, because `filter` returns a new array each render",
            "`SlowList` is skipped, because `memo` compares arrays element by element",
            "React throws, because `memo` components can't receive arrays as props",
            "`SlowList` is skipped, but the filter runs twice per render because of `memo`",
          ],
          correctIndex: 0,
          explanation:
            "`memo` compares each prop with `Object.is`, and a new array is never equal to the old one. Memoise the filtered array with `useMemo(() => todos.filter(...), [todos])`, or let React Compiler do it.",
        },
      ],
    },
    {
      id: "react-adv-custom-hooks",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "Building Custom Hooks",
      summary:
        "A custom Hook is a function whose name starts with `use` and that calls other Hooks. The prefix isn't cosmetic: it tells readers, the linter and React Compiler that state and effects may live inside and that the Rules of Hooks apply. Custom Hooks share stateful logic, not state: two components calling `useOnlineStatus()` each get independent state, and the Hook's body re-runs on every render of its caller, so it must be as pure as a component. A function that calls no Hooks shouldn't get the prefix.\n\nThey replaced mixins, HOCs and render props for logic reuse because they compose without wrapper nesting or prop-name collisions, and their inputs and outputs are explicit. Good ones have a narrow, concrete purpose (`useChatRoom(roomId)`, `useMediaQuery(query)`) rather than lifecycle wrappers like `useMount`, which hide dependencies from the linter. They should return stable identities (memoised callbacks, a `dispatch`) so callers can use them as dependencies. For subscribing to external mutable sources such as browser APIs or stores, `useSyncExternalStore` beats a hand-rolled `useEffect` plus `useState`: it can't tear under concurrent rendering and it supports a server snapshot.\n\nThe canonical tutorial Hook, `useFetch`, is also the canonical bug farm. A naive version races (a slow response for the old URL overwrites the new one), sets state after unmount, refetches forever when an options object is recreated each render, and has no cache, deduplication or retries. The core fix is to model it as a state machine keyed by a request id, driven by an effect whose cleanup aborts the request and ignores late responses. In production, reach for TanStack Query, SWR or your framework's loaders instead of reinventing the cache.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        { label: "react.dev: Reusing Logic with Custom Hooks", url: "https://react.dev/learn/reusing-logic-with-custom-hooks", kind: "docs" },
        { label: "react.dev: useSyncExternalStore", url: "https://react.dev/reference/react/useSyncExternalStore", kind: "docs" },
        { label: "TkDodo: Why You Want React Query", url: "https://tkdodo.eu/blog/why-you-want-react-query", kind: "article" },
        { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Full React Course 2020 - Learn Fundamentals, Hooks, Context API, React Router, Custom Hooks",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=4UZrsTqkcW4",
        videoId: "4UZrsTqkcW4",
        durationLabel: "10:07:52",
        startSeconds: 30382,
        chapterLabel: "Custom Hooks - useFetch",
      },
      alternateVideos: [
        {
          title: "Custom Hooks in React (Design Patterns)",
          channel: "Cosden Solutions",
          url: "https://www.youtube.com/watch?v=I2Bgi0Qcdvc",
          videoId: "I2Bgi0Qcdvc",
          durationLabel: "12:55",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement the core of a race-safe `useFetch(url)` as the two pieces that would sit inside the Hook.\n\n`fetchReducer(state, event)` is the pure state machine you'd pass to `useReducer`. State is `{ status, data, error, requestId }` and starts as `initialFetchState`.\n\n- `{ type: \"start\", requestId }`: `status: \"loading\"`, `error: null`, store the new `requestId`, and keep the previous `data` (stale-while-revalidate).\n- `{ type: \"resolve\", requestId, data }`: `status: \"success\"`, the new `data`, `error: null`.\n- `{ type: \"reject\", requestId, error }`: `status: \"error\"`, the `error` message, keeping the previous `data`.\n- For `resolve` and `reject`: if `event.requestId` isn't the current `requestId`, return the same `state` object unchanged.\n- `{ type: \"reset\" }`: return `initialFetchState`.\n- Any other type: throw `new Error(\"Unknown event: \" + event.type)`.\n\n`fetchEffect(url, fetcher, dispatch, nextId)` is the effect body, as in `useEffect(() => fetchEffect(url, fetcher, dispatch, nextId), [url])`, and returns the cleanup.\n\n- If `url` is `null`, dispatch `reset` and fetch nothing.\n- Otherwise take an id from `nextId()`, dispatch `start`, and call `fetcher(url, signal)` with the `signal` of a new `AbortController`. Dispatch `resolve` with the data, or `reject` with the error's `message`.\n- The cleanup must abort the request and guarantee that nothing is dispatched after it has run, even when the fetcher ignores the signal and resolves anyway, or rejects with an `AbortError`.\n\nThe tests call `runUseFetch(scenario)`. With `reducerEvents` it feeds events straight into your reducer and reports each state and whether the same object came back. With `steps` it simulates a component re-rendering with changing URLs, responses arriving in any order, and unmounting; it reports the state after each step, how many requests started, which URLs had their signal aborted, and `lateDispatches` (dispatches made after that effect's cleanup ran), which must be 0. Leave the driver as it is.",
        starterCode: `const initialFetchState = { status: "idle", data: null, error: null, requestId: 0 };

/**
 * The state machine behind useFetch. Pure: no side effects, never mutates \`state\`.
 * @param {{ status: string, data: any, error: string | null, requestId: number }} state
 * @param {{ type: string, requestId?: number, data?: any, error?: string }} event
 */
function fetchReducer(state, event) {
  // Your code here
  return state;
}

/**
 * The body of useFetch's effect: useEffect(() => fetchEffect(url, fetcher, dispatch, nextId), [url]).
 * Returns the effect's cleanup function (or undefined).
 * @param {string | null} url
 * @param {(url: string, signal: AbortSignal) => PromiseLike<any>} fetcher
 * @param {(event: object) => void} dispatch
 * @param {() => number} nextId
 */
function fetchEffect(url, fetcher, dispatch, nextId) {
  // Your code here
}

// ---- Test driver (leave as is) ----
// scenario.reducerEvents: feeds events straight into fetchReducer and reports each state and
//   whether the reducer returned the very same object (a bail-out).
// scenario.steps: simulates a component that calls useFetch(url):
//   ["render", url]        re-render with this url; like deps [url], the effect re-runs only if url changed
//   ["resolve", url, data] the oldest pending request for url succeeds
//   ["reject", url, msg]   the oldest pending request for url fails with new Error(msg)
//   ["unmount"]            the component unmounts
//   With scenario.ignoresAbort the fake fetcher ignores its AbortSignal, like a library that
//   doesn't support cancellation.
async function runUseFetch(scenario) {
  const view = (s) => ({ status: s.status, data: s.data, error: s.error });
  if (scenario.reducerEvents) {
    let state = initialFetchState;
    const out = [];
    for (const event of scenario.reducerEvents) {
      let next;
      try {
        next = fetchReducer(state, event);
      } catch (e) {
        out.push({ threw: String((e && e.message) || e) });
        continue;
      }
      out.push({ ...view(next), same: next === state });
      state = next;
    }
    return out;
  }

  let state = initialFetchState;
  let id = 0;
  const nextId = () => ++id;
  const pending = [];
  const aborted = [];
  let lateDispatches = 0;
  const fetcher = (url, signal) =>
    new Promise((resolve, reject) => {
      const req = { url, resolve, reject, settled: false };
      pending.push(req);
      if (signal && typeof signal.addEventListener === "function") {
        signal.addEventListener("abort", () => {
          aborted.push(url);
          if (!scenario.ignoresAbort && !req.settled) {
            req.settled = true;
            const e = new Error("The operation was aborted");
            e.name = "AbortError";
            reject(e);
          }
        });
      }
    });
  let cleanup;
  let currentUrl;
  let mounted = false;
  const runEffect = (url) => {
    let cleanedUp = false;
    const dispatch = (event) => {
      if (cleanedUp) lateDispatches++;
      state = fetchReducer(state, event);
    };
    const c = fetchEffect(url, fetcher, dispatch, nextId);
    cleanup = () => {
      cleanedUp = true;
      if (typeof c === "function") c();
    };
  };
  const flush = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  };
  const states = [];
  for (const step of scenario.steps) {
    const [kind, url, payload] = step;
    if (kind === "render") {
      if (!mounted || url !== currentUrl) {
        if (cleanup) cleanup();
        cleanup = undefined;
        currentUrl = url;
        mounted = true;
        runEffect(url);
      }
    } else if (kind === "resolve" || kind === "reject") {
      const req = pending.find((r) => r.url === url && !r.settled);
      if (req) {
        req.settled = true;
        if (kind === "resolve") req.resolve(payload);
        else req.reject(new Error(payload));
      }
    } else if (kind === "unmount") {
      if (cleanup) cleanup();
      cleanup = undefined;
    }
    await flush();
    states.push(view(state));
  }
  return { states, requests: pending.length, aborted, lateDispatches };
}
`,
        functionName: "runUseFetch",
        testCases: [
          {
            description: "a request moves from loading to success",
            args: [{ steps: [["render", "/a"], ["resolve", "/a", { name: "A" }]] }],
            expected: {
              states: [
                { status: "loading", data: null, error: null },
                { status: "success", data: { name: "A" }, error: null },
              ],
              requests: 1,
              aborted: [],
              lateDispatches: 0,
            },
          },
          {
            description: "switching URL mid-flight aborts the old request and never shows its late response",
            args: [{ steps: [["render", "/a"], ["render", "/b"], ["resolve", "/a", "late A"], ["resolve", "/b", "B"]] }],
            expected: {
              states: [
                { status: "loading", data: null, error: null },
                { status: "loading", data: null, error: null },
                { status: "loading", data: null, error: null },
                { status: "success", data: "B", error: null },
              ],
              requests: 2,
              aborted: ["/a"],
              lateDispatches: 0,
            },
          },
          {
            description: "an out-of-order response can't overwrite newer data, even when the fetcher ignores abort",
            args: [{ ignoresAbort: true, steps: [["render", "/a"], ["render", "/b"], ["resolve", "/b", "B"], ["resolve", "/a", "A"]] }],
            expected: {
              states: [
                { status: "loading", data: null, error: null },
                { status: "loading", data: null, error: null },
                { status: "success", data: "B", error: null },
                { status: "success", data: "B", error: null },
              ],
              requests: 2,
              aborted: ["/a"],
              lateDispatches: 0,
            },
            isEdgeCase: true,
          },
          {
            description: "a failed refetch reports the error and keeps the last good data",
            args: [{ steps: [["render", "/a"], ["resolve", "/a", "A"], ["render", "/b"], ["reject", "/b", "500 Internal Server Error"]] }],
            expected: {
              states: [
                { status: "loading", data: null, error: null },
                { status: "success", data: "A", error: null },
                { status: "loading", data: "A", error: null },
                { status: "error", data: "A", error: "500 Internal Server Error" },
              ],
              requests: 2,
              aborted: ["/a"],
              lateDispatches: 0,
            },
          },
          {
            description: "nothing is dispatched after unmount, even if the fetcher resolves anyway",
            args: [{ ignoresAbort: true, steps: [["render", "/a"], ["unmount"], ["resolve", "/a", "A"]] }],
            expected: {
              states: [
                { status: "loading", data: null, error: null },
                { status: "loading", data: null, error: null },
                { status: "loading", data: null, error: null },
              ],
              requests: 1,
              aborted: ["/a"],
              lateDispatches: 0,
            },
            isEdgeCase: true,
          },
          {
            description: "the AbortError from your own cleanup is not reported as an error",
            args: [{ steps: [["render", "/a"], ["unmount"]] }],
            expected: {
              states: [
                { status: "loading", data: null, error: null },
                { status: "loading", data: null, error: null },
              ],
              requests: 1,
              aborted: ["/a"],
              lateDispatches: 0,
            },
            isEdgeCase: true,
          },
          {
            description: "a null URL resets to idle, and the in-flight response is ignored",
            args: [{ ignoresAbort: true, steps: [["render", "/a"], ["render", null], ["resolve", "/a", "A"]] }],
            expected: {
              states: [
                { status: "loading", data: null, error: null },
                { status: "idle", data: null, error: null },
                { status: "idle", data: null, error: null },
              ],
              requests: 1,
              aborted: ["/a"],
              lateDispatches: 0,
            },
            isEdgeCase: true,
          },
          {
            description: "re-rendering with the same URL doesn't refetch",
            args: [{ steps: [["render", "/a"], ["render", "/a"], ["resolve", "/a", "A"], ["render", "/a"]] }],
            expected: {
              states: [
                { status: "loading", data: null, error: null },
                { status: "loading", data: null, error: null },
                { status: "success", data: "A", error: null },
                { status: "success", data: "A", error: null },
              ],
              requests: 1,
              aborted: [],
              lateDispatches: 0,
            },
          },
          {
            description: "the reducer bails out on stale ids (same object) and throws on unknown events",
            args: [
              {
                reducerEvents: [
                  { type: "start", requestId: 1 },
                  { type: "start", requestId: 2 },
                  { type: "resolve", requestId: 1, data: "stale" },
                  { type: "reject", requestId: 1, error: "stale" },
                  { type: "resolve", requestId: 2, data: "fresh" },
                  { type: "refetch" },
                  { type: "reset" },
                ],
              },
            ],
            expected: [
              { status: "loading", data: null, error: null, same: false },
              { status: "loading", data: null, error: null, same: false },
              { status: "loading", data: null, error: null, same: true },
              { status: "loading", data: null, error: null, same: true },
              { status: "success", data: "fresh", error: null, same: false },
              { threw: "Unknown event: refetch" },
              { status: "idle", data: null, error: null, same: false },
            ],
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "react-adv-react-memo",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "React.memo & Render Performance",
      summary:
        "By default, when a component renders, React re-renders all of its children, whatever their props. That's usually fine: rendering is just calling functions and diffing, and the DOM is only touched where the output changed. `React.memo` opts a component out: React compares the new props with the previous ones and skips the component when they are shallowly equal. Shallow means each prop is compared with `Object.is`, so primitives compare by value while objects, arrays, functions and JSX elements compare by reference.\n\nThat's why `memo` so often does nothing. An inline `style={{...}}`, an arrow-function handler, a `.filter()` result or a `children` prop is a new reference on every render, and one unstable prop defeats the whole comparison. `memo` pays off only together with stable props (`useMemo`, `useCallback`, constants hoisted out of render) or with React Compiler, which applies the equivalent automatically. It also doesn't block re-renders caused by the component's own state or by a context it reads. Before memoising, try the structural fixes from \"Before You memo()\": move state down into the part that changes, or lift the expensive subtree up and pass it in as `children`, so it isn't re-created when the state changes.\n\nA custom `arePropsEqual(prev, next)` can replace the comparison, but it must compare every prop, including functions (skip a callback and the child keeps calling a stale closure), and a deep comparison there can freeze the app once the data grows. The comparison's edge cases are interview favourites: `Object.is(NaN, NaN)` is true, `Object.is(0, -0)` is false, only own keys count, and `{ a: undefined }` doesn't equal `{ b: undefined }`.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "react.dev: memo", url: "https://react.dev/reference/react/memo", kind: "docs" },
        { label: "Overreacted: Before You memo()", url: "https://overreacted.io/before-you-memo/", kind: "article" },
        { label: "Josh W. Comeau: Why React Re-Renders", url: "https://www.joshwcomeau.com/react/why-react-re-renders/", kind: "article" },
        { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Full React Course 2020 - Learn Fundamentals, Hooks, Context API, React Router, Custom Hooks",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=4UZrsTqkcW4",
        videoId: "4UZrsTqkcW4",
        durationLabel: "10:07:52",
        startSeconds: 34671,
        chapterLabel: "React Optimization Warning",
      },
      alternateVideos: [
        {
          title: "Preventing re-renders with React.memo",
          channel: "Developer Way",
          url: "https://www.youtube.com/watch?v=feEY3Qajrwg",
          videoId: "feEY3Qajrwg",
          durationLabel: "11:38",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement the two halves of `React.memo`.\n\n`shallowEqual(a, b)` must match React's own comparison:\n\n- If `Object.is(a, b)`, return `true` (so `NaN` equals `NaN`, but `0` and `-0` differ).\n- Otherwise, if either value is not a non-null object, return `false` (functions count as non-objects here).\n- Otherwise compare own enumerable keys (`Object.keys`): the key counts must match, and every key of `a` must be an own property of `b` whose value is `Object.is`-equal. Don't recurse: nested objects compare by reference.\n\n`memo(component, arePropsEqual = shallowEqual)` returns a function that takes `props`:\n\n- The first call always calls `component(props)`.\n- A later call returns the previous result without calling `component` when `arePropsEqual(previousProps, props)` returns `true`, where `previousProps` are the props from the last time the component actually rendered.\n- Otherwise it calls `component(props)`, remembers those props and the result, and returns the result.\n\nTest data can't contain functions, shared references, `NaN` or `-0`, so the driver `runMemo(scenario)` decodes tags: `{ $ref: \"s\" }` (the same object everywhere it appears in one test), `{ $fn: \"f\" }` (the same function), `{ $new: {...} }` (a fresh copy each time), `{ $nan: true }`, `{ $negzero: true }` and `{ $proto: {...} }` (an object that only inherits those keys). A `compare` scenario returns `shallowEqual(a, b)`; a `renders` scenario passes a series of props to a memoised row and returns its outputs and how many times it really rendered. Leave the driver as it is.",
        starterCode: `/**
 * Shallow equality with React's semantics (the default comparison React.memo uses).
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
function shallowEqual(a, b) {
  // Your code here
}

/**
 * A miniature React.memo for plain render functions.
 * @param {(props: object) => any} component
 * @param {(prevProps: object, nextProps: object) => boolean} [arePropsEqual]
 * @returns {(props: object) => any}
 */
function memo(component, arePropsEqual = shallowEqual) {
  // Your code here
  return component;
}

// ---- Test driver (leave as is) ----
// Test data can't hold functions, shared references, NaN or -0 directly, so values are
// described with tags that the driver turns into real values:
//   { $ref: "s" }  the same object instance everywhere "s" appears in one test
//   { $fn: "f" }   the same function instance everywhere "f" appears in one test
//   { $new: {...} } a fresh copy of the object every time it appears
//   { $nan: true } NaN      { $negzero: true } -0      { $proto: {...} } an object whose
//   properties are inherited (Object.create), so it has no own keys
function runMemo(scenario) {
  const refs = new Map();
  const fns = new Map();
  const decode = (v) => {
    if (Array.isArray(v)) return v.map(decode);
    if (v === null || typeof v !== "object") return v;
    if ("$ref" in v) {
      if (!refs.has(v.$ref)) refs.set(v.$ref, { id: v.$ref });
      return refs.get(v.$ref);
    }
    if ("$fn" in v) {
      if (!fns.has(v.$fn)) fns.set(v.$fn, () => v.$fn);
      return fns.get(v.$fn);
    }
    if ("$new" in v) return decode(v.$new);
    if ("$nan" in v) return NaN;
    if ("$negzero" in v) return -0;
    if ("$proto" in v) return Object.create(decode(v.$proto));
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = decode(x);
    return out;
  };
  if (scenario.compare) {
    const [a, b] = scenario.compare.map(decode);
    return shallowEqual(a, b);
  }
  // scenario.renders: the props a parent passes on each of its renders.
  // scenario.comparator: "default" | "sameId" (custom arePropsEqual comparing props.id only)
  let calls = 0;
  const Row = (props) => "Row#" + ++calls + (props.label ? ":" + props.label : "");
  const comparators = { sameId: (prev, next) => prev.id === next.id };
  const Memo = scenario.comparator && scenario.comparator !== "default"
    ? memo(Row, comparators[scenario.comparator])
    : memo(Row);
  const outputs = scenario.renders.map((p) => Memo(decode(p)));
  return { outputs, renders: calls };
}
`,
        functionName: "runMemo",
        testCases: [
          {
            description: "equal contents in a new nested object are not shallowly equal",
            args: [{ compare: [{ label: "Save", style: { $new: { color: "red" } } }, { label: "Save", style: { $new: { color: "red" } } }] }],
            expected: false,
          },
          {
            description: "the same nested object and the same function instance compare equal",
            args: [{ compare: [{ label: "Save", style: { $ref: "s" }, onClick: { $fn: "f" } }, { label: "Save", style: { $ref: "s" }, onClick: { $fn: "f" } }] }],
            expected: true,
          },
          {
            description: "NaN props are equal (Object.is, not ===)",
            args: [{ compare: [{ ratio: { $nan: true } }, { ratio: { $nan: true } }] }],
            expected: true,
            isEdgeCase: true,
          },
          {
            description: "0 and -0 props are not equal (Object.is, not ===)",
            args: [{ compare: [{ offset: 0 }, { offset: { $negzero: true } }] }],
            expected: false,
            isEdgeCase: true,
          },
          {
            description: "{ a: undefined } and { b: undefined } differ: keys must be own properties of the other object",
            args: [{ compare: [{ a: undefined }, { b: undefined }] }],
            expected: false,
            isEdgeCase: true,
          },
          {
            description: "an extra key set to undefined still changes the key count",
            args: [{ compare: [{ a: 1 }, { a: 1, b: undefined }] }],
            expected: false,
            isEdgeCase: true,
          },
          {
            description: "inherited properties are ignored; only own keys count",
            args: [{ compare: [{ $proto: { a: 1 } }, {}] }],
            expected: true,
            isEdgeCase: true,
          },
          {
            description: "arrays compare index by index, one level deep",
            args: [{ compare: [[1, "x", { $ref: "r" }], [1, "x", { $ref: "r" }]] }],
            expected: true,
          },
          {
            description: "two different function instances are not equal",
            args: [{ compare: [{ $fn: "a" }, { $fn: "b" }] }],
            expected: false,
          },
          {
            description: "a memoised row skips rendering while every prop is referentially equal",
            args: [
              {
                renders: [
                  { label: "A", onClick: { $fn: "f1" } },
                  { label: "A", onClick: { $fn: "f1" } },
                  { label: "A", onClick: { $fn: "f2" } },
                  { label: "B", onClick: { $fn: "f2" } },
                ],
              },
            ],
            expected: { outputs: ["Row#1:A", "Row#1:A", "Row#2:A", "Row#3:B"], renders: 3 },
          },
          {
            description: "a fresh inline object prop defeats memo on every render",
            args: [{ renders: [{ label: "A", style: { $new: { bold: true } } }, { label: "A", style: { $new: { bold: true } } }] }],
            expected: { outputs: ["Row#1:A", "Row#2:A"], renders: 2 },
          },
          {
            description: "a custom comparator decides alone, and can leave stale output on screen",
            args: [{ comparator: "sameId", renders: [{ id: 1, label: "first" }, { id: 1, label: "changed" }, { id: 2, label: "other" }] }],
            expected: { outputs: ["Row#1:first", "Row#1:first", "Row#2:other"], renders: 2 },
            isEdgeCase: true,
          },
          {
            description: "the first render always happens, whatever the comparator would say",
            args: [{ comparator: "sameId", renders: [{ id: 1 }] }],
            expected: { outputs: ["Row#1"], renders: 1 },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "react-adv-error-boundaries",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "Error Boundaries",
      summary:
        "By default, an error thrown while rendering removes the whole root's UI: React would rather show nothing than a corrupted screen. Error boundaries hand that decision back to you. A boundary is a class component that implements `static getDerivedStateFromError` (pure, called during render, returns state that switches to a fallback) and usually `componentDidCatch` (called after commit, where you log to an error service with `info.componentStack`). There is still no Hook equivalent, so in practice you write one class or use the `react-error-boundary` package, which adds `resetKeys`, `onReset` and a `useErrorBoundary` hook.\n\nBoundaries catch errors thrown while rendering their subtree, in lifecycle methods and effects, and from rejected `use(promise)` reads and `lazy` loads. They don't catch errors in event handlers, in asynchronous callbacks such as `setTimeout`, during server rendering, or in the boundary itself. The React 19 exception worth knowing: errors thrown inside a function passed to `startTransition` from `useTransition` (an Action) are routed to the nearest boundary. For everything else, catch the error and either render an error state or re-throw it during render, which is what `showBoundary(error)` does.\n\nThe real design questions are placement and recovery. One boundary at the root turns any bug into a blank page; one around every avatar is noise. Put them where a fallback makes sense to the user: routes, panels, independent widgets. A tripped boundary stays tripped until its state resets, so navigating away still shows the fallback unless you reset it with `resetKeys` or a `key`. React 19's root options `onCaughtError` and `onUncaughtError` centralise reporting. And in development, caught errors still bubble to `window.onerror`; in production they don't.",
      level: "advanced",
      estMinutes: 40,
      webRefs: [
        { label: "react.dev: Catching rendering errors with an Error Boundary", url: "https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary", kind: "docs" },
        { label: "react.dev: createRoot (onCaughtError / onUncaughtError)", url: "https://react.dev/reference/react-dom/client/createRoot", kind: "docs" },
        { label: "GitHub: bvaughn/react-error-boundary", url: "https://github.com/bvaughn/react-error-boundary", kind: "repo" },
        { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Learn React Error Boundaries In 7 Minutes",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=_FuDMEgIy7I",
        videoId: "_FuDMEgIy7I",
        durationLabel: "7:06",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "react-adv-error-boundaries-q1",
          prompt: "Which errors does an error boundary above the component catch? (Select all that apply.)",
          options: [
            "An error thrown while a child renders",
            "An error thrown inside a child's `useEffect`",
            "An error thrown inside a function passed to `startTransition` from `useTransition`",
            "An error thrown in a child's `onClick` handler",
            "An error thrown in a `setTimeout` callback scheduled by a child",
            "An error thrown by the boundary's own `render` method",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Boundaries handle errors from React's own work on their subtree: rendering, lifecycles and effects, plus (since React 19) transition functions from `useTransition`. Event handlers and timers run outside rendering, and a boundary can't catch its own errors; the next boundary up has to.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-error-boundaries-q2",
          prompt:
            "What does this pattern achieve?\n\n```jsx\nfunction SaveButton() {\n  const [error, setError] = useState(null);\n  if (error) throw error;\n  return (\n    <button\n      onClick={async () => {\n        try {\n          await save();\n        } catch (e) {\n          setError(e);\n        }\n      }}\n    >\n      Save\n    </button>\n  );\n}\n```",
          options: [
            "It re-throws the handler's error during render, so the nearest error boundary can show its fallback",
            "Nothing useful: errors thrown during render are swallowed when they came from state",
            "It crashes the whole root, because boundaries ignore errors that began in a handler",
            "It retries `save()` automatically until the boundary is reset by the user",
          ],
          correctIndex: 0,
          explanation:
            "Boundaries only see errors thrown during React's work. Storing the error in state and throwing it on the next render bridges the gap; `react-error-boundary`'s `showBoundary(error)` does the same thing for you.",
        },
        {
          id: "react-adv-error-boundaries-q3",
          prompt: "Why must an error boundary still be written as a class component in React 19?",
          options: [
            "There's no Hook equivalent of `getDerivedStateFromError` or `componentDidCatch` yet",
            "Function components can't hold state, so they can't remember that an error happened",
            "Only class components are allowed to render fallback UI during the commit phase",
            "Hooks run only after an error has been thrown, so they're too late to intercept it",
          ],
          correctIndex: 0,
          explanation:
            "The docs state there's currently no way to write an error boundary as a function component. Write one class and reuse it everywhere, or use `react-error-boundary`, which wraps that class for you.",
        },
        {
          id: "react-adv-error-boundaries-q4",
          prompt: "Which statement correctly splits the jobs of the two error-boundary methods?",
          options: [
            "`getDerivedStateFromError` runs during render, must be pure and returns fallback state; `componentDidCatch` runs after commit and is where you log",
            "`componentDidCatch` returns the fallback state; `getDerivedStateFromError` is the place for side effects such as logging",
            "Both run during render, so neither of them may perform side effects such as logging",
            "`getDerivedStateFromError` runs only in development builds; `componentDidCatch` runs only in production",
          ],
          correctIndex: 0,
          explanation:
            "`getDerivedStateFromError` is a pure, render-phase function that returns the state that shows the fallback. `componentDidCatch` runs in the commit phase with `info.componentStack`, which makes it the place for reporting. Calling `setState` in `componentDidCatch` for the fallback is deprecated.",
        },
        {
          id: "react-adv-error-boundaries-q5",
          prompt:
            "A route-level boundary shows its fallback after a crash on `/reports`. The user clicks a link to `/settings`, which renders fine on its own, but the fallback is still shown. Why, and what's the fix?",
          options: [
            "The boundary's error state persists until reset; key it on the location or pass `resetKeys` so navigation resets it",
            "The router caches the fallback element per route, so its cache has to be cleared on navigation",
            "Error boundaries also catch errors from sibling routes, so `/settings` must have thrown as well",
            "React pauses rendering beneath a tripped boundary for a fixed cooldown before trying again",
          ],
          correctIndex: 0,
          explanation:
            "A boundary is a component with state; once it has an error it keeps rendering the fallback until that state changes. Remounting it with a new `key` or using `resetKeys` (from `react-error-boundary`) gives the new route a fresh boundary.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-error-boundaries-q6",
          prompt:
            "Your `window.addEventListener(\"error\", ...)` reporter also receives errors that an error boundary already caught, but only in development. Is that a bug?",
          options: [
            "No: in development, caught errors still bubble up to `window`; in production they don't",
            "Yes: error boundaries don't work in development builds, only in production",
            "Yes: `componentDidCatch` must call `event.preventDefault()` to stop the bubbling",
            "No: boundaries never stop errors from reaching `window`, in any build",
          ],
          correctIndex: 0,
          explanation:
            "The docs note that development and production differ here: in development errors caught by `componentDidCatch` still reach `window.onerror`, while in production only uncaught errors do. Don't count dev-mode reports as proof that a boundary failed.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-error-boundaries-q7",
          prompt: "With streaming server rendering, a component throws on the server. What does React do?",
          options: [
            "It keeps streaming, sends the nearest Suspense fallback, and retries that part on the client, where an error boundary can catch it",
            "The nearest error boundary renders its fallback on the server and sends that fallback as part of the HTML",
            "The server responds with a 500 status and aborts the stream, so nothing is shown to the user",
            "React silently renders an empty element in place of the component and never retries it",
          ],
          correctIndex: 0,
          explanation:
            "Error boundaries don't run during server rendering; Suspense boundaries handle server errors. On the client React renders that component again, and only if it fails there too does the closest error boundary show.",
        },
        {
          id: "react-adv-error-boundaries-q8",
          prompt: "Where does it usually make sense to place error boundaries?",
          options: [
            "Around routes and independent panels or widgets, wherever a fallback makes sense to the user",
            "Only once at the root, so every error is handled and reported in one place",
            "Around every single component, so that no error can ever escape its owner",
            "Only around components that make network requests, since only they can fail",
          ],
          correctIndex: 0,
          explanation:
            "A single root boundary turns any bug into a blank app, while one around every avatar adds noise. The docs' messaging-app example puts boundaries around the conversation list and each message, not each avatar.",
        },
        {
          id: "react-adv-error-boundaries-q9",
          prompt:
            "The server returns 500. What happens?\n\n```jsx\nuseEffect(() => {\n  fetch(url).then((r) => {\n    if (!r.ok) throw new Error(\"HTTP \" + r.status);\n  });\n}, [url]);\n```",
          options: [
            "An unhandled promise rejection; the boundary never sees it, because the throw happens in a promise callback",
            "The nearest error boundary shows its fallback, because the effect belongs to its subtree",
            "React retries the effect once and then unmounts the component if it fails again",
            "The whole root unmounts, because errors inside effects always bypass boundaries",
          ],
          correctIndex: 0,
          explanation:
            "The effect function itself returned normally; the rejection happens later, outside React's work. Catch it and store it in state (optionally re-throwing it during render), or use a Suspense-enabled data source whose rejected promise reaches the boundary through `use`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-error-boundaries-q10",
          prompt: "Which failures reach the nearest error boundary without any extra code? (Select all that apply.)",
          options: [
            "A promise read with `use(promise)` rejects",
            "A `lazy(() => import(\"./Chart\"))` chunk fails to load",
            "A `fetch` inside `useEffect` rejects and nothing catches it",
            "A `setInterval` callback throws",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`use` and `lazy` throw the rejection during render, so the boundary handles it. The other two fail outside React's rendering work and surface as unhandled rejections or global errors instead.",
        },
        {
          id: "react-adv-error-boundaries-q11",
          prompt: "In React 19, where can you centrally observe errors caught by boundaries, and errors nothing caught?",
          options: [
            "In the `onCaughtError` and `onUncaughtError` options passed to `createRoot`",
            "In the global `window.onReactError` and `window.onReactUncaught` handlers",
            "In an `onError` prop passed to `<StrictMode>` at the top of the tree",
            "In a `useErrorHandler` Hook exported from the `react` package",
          ],
          correctIndex: 0,
          explanation:
            "React 19 added root options: `onCaughtError` (caught by a boundary), `onUncaughtError` (not caught) and `onRecoverableError`. Each receives the error and an `errorInfo` with the component stack, which is where error reporting belongs.",
        },
      ],
    },
    {
      id: "react-adv-portals",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "Portals",
      summary:
        "`createPortal(children, domNode)` renders part of your tree into a different DOM node, typically `document.body`, while leaving it in the same place in the React tree. The DOM placement is the only thing that changes: the portal's children still read context from their React parents, still re-render with them, and their events bubble through React ancestors rather than DOM ancestors.\n\nPortals exist because of CSS, not React. A modal, tooltip or dropdown rendered inline is trapped by its ancestors: `overflow: hidden` clips it, and any ancestor that creates a stacking context (`transform`, `filter`, `opacity` below 1, a `z-index` on a positioned element) caps how high its own `z-index` can reach. Rendering at the end of `body` escapes both. Today the native `<dialog>` element opened with `showModal()` (and the Popover API) solve the same problem by using the browser's top layer, with an inert background built in, so a portal is no longer the only answer for modals.\n\nThe gotchas come from the two trees disagreeing. A click inside a portal fires `onClick` on a React ancestor that is nowhere near it in the DOM, which surprises anyone with a clickable wrapper. The reverse bites too: a \"click outside to close\" check using `ref.current.contains(event.target)` treats clicks in a nested portal (a date picker inside a modal) as outside, because `contains` walks the DOM. Native listeners on the component's DOM ancestors, such as the app root, never see portal events. The target node must already exist (a problem during SSR), passing a different `domNode` recreates the portal's content and loses its state, and focus management and `aria-modal` remain your job.",
      level: "intermediate",
      estMinutes: 35,
      webRefs: [
        { label: "react.dev: createPortal", url: "https://react.dev/reference/react-dom/createPortal", kind: "docs" },
        { label: "MDN: The Dialog element", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog", kind: "docs" },
        { label: "Josh W. Comeau: What The Heck, z-index??", url: "https://www.joshwcomeau.com/css/stacking-contexts/", kind: "article" },
        { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Learn React Portal In 12 Minutes By Building A Modal",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=LyLa7dU5tp8",
        videoId: "LyLa7dU5tp8",
        durationLabel: "12:10",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "react-adv-portals-q1",
          prompt:
            "The button ends up at the end of `document.body`. What happens when it's clicked?\n\n```jsx\nfunction Card() {\n  return (\n    <div onClick={() => console.log(\"card clicked\")}>\n      <h2>Card</h2>\n      {createPortal(<button>Open menu</button>, document.body)}\n    </div>\n  );\n}\n```",
          options: [
            "`card clicked` is logged, because React events bubble through the React tree",
            "Nothing is logged, because the button isn't inside the card's `<div>` in the DOM",
            "`card clicked` is logged twice, once for each tree the event travels through",
            "It throws, because event handlers can't be attached across a portal boundary",
          ],
          correctIndex: 0,
          explanation:
            "A portal changes only where the DOM nodes live. For events, the button is still a child of the `<div>` in the React tree, so the click bubbles to its `onClick`. Stop propagation inside the portal or move the portal up the tree if that's unwanted.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-portals-q2",
          prompt:
            "A native listener is attached with `document.getElementById(\"root\").addEventListener(\"click\", log)`, and the app portals a menu into `document.body`, outside `#root`. Does a click inside the menu call `log`?",
          options: [
            "No: native events follow the DOM, and the menu's DOM path runs through `body`, not `#root`",
            "Yes: React re-dispatches every portal event through the root container's native listeners",
            "Yes, but only in development builds, where React mirrors events for debugging",
            "Only if the menu's elements also have React `onClick` handlers attached",
          ],
          correctIndex: 0,
          explanation:
            "React's synthetic events follow the React tree, but a native listener sees the real DOM propagation path: menu, `body`, `html`, `document`. `#root` isn't on that path.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-portals-q3",
          prompt:
            "A `ThemeContext` provider wraps the app, and a modal is portaled into `document.body`. What does `useContext(ThemeContext)` return inside the modal?",
          options: [
            "The provider's value, because context follows the React tree",
            "The context's default value, because the modal is outside the provider's DOM",
            "`undefined`, because every portal starts a separate React root",
            "It throws unless the modal is wrapped in its own provider",
          ],
          correctIndex: 0,
          explanation:
            "Everything except physical DOM placement behaves as if the portal's children were rendered inline, including context, state and re-rendering with the parent. Portals don't create a new root.",
        },
        {
          id: "react-adv-portals-q4",
          prompt: "Which are genuine reasons to render a dropdown through a portal? (Select all that apply.)",
          options: [
            "An ancestor has `overflow: hidden`, which would clip the dropdown",
            "An ancestor with a `transform` creates a stacking context that caps the dropdown's `z-index`",
            "An ancestor has `opacity: 0.99`, which also creates a stacking context",
            "Portaled content renders faster because React skips diffing it",
            "It isolates the dropdown's state from its parent's re-renders",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Portals escape CSS containment: clipping and stacking contexts. They don't change React's work at all: the content is diffed and re-rendered with its parent like any other child.",
        },
        {
          id: "react-adv-portals-q5",
          prompt:
            "A tooltip is portaled into `container`, and a layout change passes a different DOM node as `container`. What happens to the tooltip's internal state?",
          options: [
            "It's lost: passing a different DOM node recreates the portal's content",
            "It's kept: React moves the existing DOM nodes into the new container",
            "React throws, because a portal's container can't change after mounting",
            "It's kept, but only if the tooltip element has an explicit `key`",
          ],
          correctIndex: 0,
          explanation:
            "The `createPortal` docs state that passing a different DOM node during an update recreates the portal content, so state inside it resets. Keep the container stable if the content has state worth preserving.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-portals-q6",
          prompt:
            "The modal contains a date picker whose calendar is portaled into `body`. Picking a date closes the modal. Why?\n\n```jsx\nuseEffect(() => {\n  function onPointerDown(e) {\n    if (!modalRef.current.contains(e.target)) onClose();\n  }\n  document.addEventListener(\"pointerdown\", onPointerDown);\n  return () => document.removeEventListener(\"pointerdown\", onPointerDown);\n}, [onClose]);\n```",
          options: [
            "`contains` walks the DOM, where the calendar isn't inside the modal, so the click counts as outside",
            "`pointerdown` fires before React attaches the calendar, so `e.target` is still `null` at that point",
            "The listener closes over a stale `modalRef`, because refs aren't listed as dependencies",
            "React's event system hides portal events from native listeners, so `e.target` is `body`",
          ],
          correctIndex: 0,
          explanation:
            "The React tree says the calendar is inside the modal; the DOM says it's a sibling in `body`. Detect \"inside\" through the React tree instead (for example, mark events in an `onPointerDownCapture` on the modal root), or render nested layers inside the modal's DOM.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-portals-q7",
          prompt:
            "In a server-rendered app, a component calls `createPortal(ui, document.getElementById(\"modal-root\"))` directly during render. What goes wrong?",
          options: [
            "It fails on the server (no `document`, and portals aren't supported there); render it only after mount",
            "Nothing: React automatically defers every portal until hydration has finished on the client",
            "The portal is rendered on the server straight into the `modal-root` element's HTML",
            "React turns the portal into an ordinary child during SSR and moves it into place later",
          ],
          correctIndex: 0,
          explanation:
            "`document` doesn't exist on the server, and React's server renderer throws for portals anyway, asking you to render them conditionally on the client. The target node must exist when the portal renders.",
        },
        {
          id: "react-adv-portals-q8",
          prompt: "What does `createPortal` do for a modal's accessibility?",
          options: [
            "Nothing by itself: focus trapping, returning focus, `aria-modal` and an inert background are still your job",
            "It moves keyboard focus into the portal automatically and traps it there until unmount",
            "It sets `aria-modal=\"true\"` on the container node while the portal is mounted",
            "It marks the rest of the page as `inert` for as long as the portal is mounted",
          ],
          correctIndex: 0,
          explanation:
            "The docs point you to the WAI-ARIA modal patterns because portals only move DOM nodes. A native `<dialog>` opened with `showModal()` does give you an inert background and implicit `aria-modal`.",
        },
        {
          id: "react-adv-portals-q9",
          prompt: "Why can a native `<dialog>` opened with `showModal()` often replace a portal for modals?",
          options: [
            "It's shown in the browser's top layer, above every stacking context, and makes the rest of the page inert",
            "React automatically portals every `<dialog>` element into `document.body` when it opens",
            "It escapes ancestor `overflow` only when the `open` attribute is set directly in the markup",
            "The browser renders it into a separate document, the same way an iframe is rendered",
          ],
          correctIndex: 0,
          explanation:
            "Modal dialogs are added to the top layer and everything outside them becomes inert, which covers the CSS escape and most of the accessibility work. Setting the `open` attribute shows a non-modal dialog, which gets neither.",
        },
        {
          id: "react-adv-portals-q10",
          prompt:
            "A card renders `<div onClick={openDetails}>` and, inside it, a menu portaled into `body`. Clicks inside the menu shouldn't trigger `openDetails`. Which fixes does react.dev suggest? (Select all that apply.)",
          options: [
            "Call `e.stopPropagation()` in a handler inside the portal",
            "Move the portal higher up the React tree, outside the card",
            "Render the portal into the card's own DOM node instead of `body`",
            "Set `pointer-events: none` on `body` while the menu is open",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Propagation follows the React tree, so either stop it inside the portal or change the React parent. Changing the DOM container doesn't change the React parent, and `pointer-events: none` on `body` would disable the menu itself.",
        },
      ],
    },
    {
      id: "react-adv-ref-forwarding",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "Ref Forwarding: `ref` as a Prop, forwardRef & useImperativeHandle",
      summary:
        "Refs let a parent reach into a child imperatively: focus an input, scroll a list, play a video. A component's DOM nodes are private by default, so a parent rendering `<MyInput ref={inputRef} />` needs the child's cooperation. For years that meant `forwardRef((props, ref) => ...)`, because `ref`, like `key`, was stripped from props. React 19 made `ref` a regular prop for function components: write `function MyInput({ ref, ...props })` and pass it to the element that should receive it. `forwardRef` still works but isn't needed for new code and will be deprecated in a future release, while a ref on a class component still points at the instance rather than arriving as a prop.\n\nForwarding the raw DOM node exposes everything and couples the parent to the child's markup. `useImperativeHandle(ref, () => ({ focus, scrollIntoView }), deps)` exposes a small, deliberate API instead, so the child can change its internals freely; leave out the dependency array and the handle is recreated on every render. The docs' warning applies strongly here: if something can be expressed as a prop (`<Modal isOpen>` rather than `modalRef.current.open()`), make it a prop, and keep handles for what can't be, such as focus, scroll, text selection or starting an animation.\n\nPractical wrinkles: when a component needs its own ref to the node it also forwards, merge them with a callback ref or a small `mergeRefs` helper. React 19 callback refs may return a cleanup, which is why TypeScript now rejects implicit returns like `ref={el => (x.current = el)}`. The parent can read the node in layout effects, effects and handlers, never during render. And wrappers or HOCs that spread `{...props}` now forward `ref` automatically, because it's just another prop.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "react.dev: React 19 (ref as a prop)", url: "https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop", kind: "article" },
        { label: "react.dev: forwardRef", url: "https://react.dev/reference/react/forwardRef", kind: "docs" },
        { label: "react.dev: useImperativeHandle", url: "https://react.dev/reference/react/useImperativeHandle", kind: "docs" },
        { label: "Developer Way: Refs in React: from access to DOM to imperative API", url: "https://www.developerway.com/posts/refs-from-dom-to-api", kind: "article" },
      ],
      video: {
        title: "Goodbye, forwardRef",
        channel: "UI Engineering",
        url: "https://www.youtube.com/watch?v=m4QbeS9BTNU",
        videoId: "m4QbeS9BTNU",
        durationLabel: "15:59",
      },
      alternateVideos: [
        {
          title: "Refs in React: from access to DOM to imperative API",
          channel: "Developer Way",
          url: "https://www.youtube.com/watch?v=H9KhRiO1UeU",
          videoId: "H9KhRiO1UeU",
          durationLabel: "12:52",
        },
        {
          title: "What's new in React 19 | Lydia Hallie",
          channel: "React Conf",
          url: "https://www.youtube.com/watch?v=AJOGzVygGcY",
          videoId: "AJOGzVygGcY",
          durationLabel: "20:03",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-adv-ref-forwarding-q1",
          prompt:
            "In React 19, what happens when the button is clicked?\n\n```jsx\nfunction MyInput({ label, ref }) {\n  return (\n    <label>\n      {label}\n      <input ref={ref} />\n    </label>\n  );\n}\n\nfunction Form() {\n  const inputRef = useRef(null);\n  return (\n    <>\n      <MyInput label=\"Name\" ref={inputRef} />\n      <button onClick={() => inputRef.current.focus()}>Edit</button>\n    </>\n  );\n}\n```",
          options: [
            "The input is focused, because `ref` is a regular prop for function components in React 19",
            "It throws, because function components can only receive refs through `forwardRef`",
            "`inputRef.current` is the `MyInput` component instance, so `.focus` is undefined",
            "`ref` arrives as `undefined`, because React strips it from props exactly like `key`",
          ],
          correctIndex: 0,
          explanation:
            "Since React 19, function components receive `ref` in their props and can pass it to any element. The parent's ref ends up pointing at the `<input>` DOM node.",
        },
        {
          id: "react-adv-ref-forwarding-q2",
          prompt:
            "This code runs on React 18. What happens when the button is clicked?\n\n```jsx\nfunction MyInput({ ref }) {\n  return <input ref={ref} />;\n}\n\nfunction Form() {\n  const inputRef = useRef(null);\n  return (\n    <>\n      <MyInput ref={inputRef} />\n      <button onClick={() => inputRef.current.focus()}>Edit</button>\n    </>\n  );\n}\n```",
          options: [
            "`ref` is stripped from props, so `inputRef.current` stays `null` (with a dev warning) and the click throws",
            "It works exactly as in React 19, because destructuring `ref` opts the component into forwarding",
            "The ref points at the `<input>` anyway, because React 18 attaches it to the first host element",
            "React 18 wraps `MyInput` in `forwardRef` automatically the first time it receives a ref",
          ],
          correctIndex: 0,
          explanation:
            "Before React 19, `ref` was reserved like `key`: function components never saw it, and React warned that function components can't be given refs. You needed `forwardRef` to receive it as a second argument.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-ref-forwarding-q3",
          prompt: "In React 19, what does a ref attached to a class component point to?",
          options: [
            "The class instance; refs to classes aren't passed as props",
            "The class component's root DOM node",
            "Nothing; it arrives as `this.props.ref` for the class to forward",
            "Nothing; class components can't receive refs in React 19",
          ],
          correctIndex: 0,
          explanation:
            "The React 19 notes call this out: refs passed to classes aren't passed as props, because they reference the component instance. The ref-as-prop change applies to function components.",
        },
        {
          id: "react-adv-ref-forwarding-q4",
          prompt:
            "What does the parent's `playerRef.current` hold after `<VideoPlayer ref={playerRef} src={url} />` mounts?\n\n```jsx\nfunction VideoPlayer({ src, ref }) {\n  const videoRef = useRef(null);\n  useImperativeHandle(ref, () => ({\n    play: () => videoRef.current.play(),\n    pause: () => videoRef.current.pause(),\n  }), []);\n  return <video ref={videoRef} src={src} />;\n}\n```",
          options: [
            "An object with only `play` and `pause`; the `<video>` element itself isn't exposed",
            "The `<video>` element, with its `play` and `pause` methods replaced by the handle's",
            "The `<video>` element with the handle's methods merged onto it as extra properties",
            "`null`, because the component attaches its own ref to the video element instead",
          ],
          correctIndex: 0,
          explanation:
            "Whatever `createHandle` returns is what the parent's ref receives. Exposing a narrow handle keeps the parent from depending on the child's DOM structure.",
        },
        {
          id: "react-adv-ref-forwarding-q5",
          prompt:
            "A `Modal` exposes `open()` and `close()` through `useImperativeHandle`, and parents call `modalRef.current.open()`. What do the React docs recommend instead?",
          options: [
            "Accept an `isOpen` prop: anything expressible as a prop shouldn't be an imperative handle",
            "Keep the handle, and additionally forward the underlying dialog's DOM node to parents",
            "Move the handle into a context so that any component in the tree can open the modal",
            "Replace the handle with a global event emitter that the modal subscribes to on mount",
          ],
          correctIndex: 0,
          explanation:
            "The `useImperativeHandle` pitfall says exactly this: don't overuse refs; use them for things like focus and scrolling that can't be expressed as props, and drive open/closed state declaratively.",
        },
        {
          id: "react-adv-ref-forwarding-q6",
          prompt:
            "After upgrading to the React 19 types, `<input ref={(el) => (inputRef.current = el)} />` fails to type-check. Why?",
          options: [
            "Ref callbacks may now return a cleanup function, so returning anything else is rejected; use a block body",
            "Callback refs were removed in React 19 in favour of object refs created with `useRef`",
            "`inputRef.current` became read-only in React 19, so assigning to it is a type error",
            "React 19 requires every ref callback to be wrapped in `useCallback` to type-check",
          ],
          correctIndex: 0,
          explanation:
            "The arrow function implicitly returns the assigned element, and TypeScript can't tell whether that was meant as a cleanup. Writing `(el) => { inputRef.current = el; }` fixes it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-ref-forwarding-q7",
          prompt:
            "`Input` needs its own ref to its `<input>` (to measure it) and must also give the parent's `ref` the same node. Which approaches work? (Select all that apply.)",
          options: [
            "Attach a callback ref that assigns the node to both the local ref and the parent's ref (object or function)",
            "Keep a local ref and expose the node with `useImperativeHandle(ref, () => localRef.current, [])`",
            "Pass an array, `ref={[localRef, ref]}`, and React assigns the node to both",
            "Assign `ref.current = localRef.current` directly in the component body during render",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "A merging callback ref is the usual solution, and an imperative handle returning the local node also works because it runs after the child's refs are attached. React doesn't accept arrays of refs, and writing refs during render is forbidden (the node doesn't even exist on the first render).",
        },
        {
          id: "react-adv-ref-forwarding-q8",
          prompt: "Where can a parent reliably read `inputRef.current` as the child's `<input>` node? (Select all that apply.)",
          options: [
            "In the parent's `useLayoutEffect`",
            "In the parent's `useEffect`",
            "In an event handler after the component has mounted",
            "In the parent's render body during the first render",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "React attaches refs during commit, before layout effects run, so effects and later event handlers can use them. During the first render the node doesn't exist yet.",
        },
        {
          id: "react-adv-ref-forwarding-q9",
          prompt:
            "In React 19, does `<TrackedInput ref={inputRef} />` give the parent the `<input>` node? `MyInput` reads `{ ref }` from its props and passes it to an `<input>`.\n\n```jsx\nfunction withTracking(Component) {\n  return function Tracked(props) {\n    useTrackRender(Component.name);\n    return <Component {...props} />;\n  };\n}\n\nconst TrackedInput = withTracking(MyInput);\n```",
          options: [
            "Yes: `ref` is an ordinary prop now, so spreading `props` forwards it",
            "No: HOCs always swallow refs, so `Tracked` still needs `forwardRef`",
            "No: React removes `ref` whenever props are spread onto a component",
            "Only if `Tracked` is rewritten as a class component that forwards it",
          ],
          correctIndex: 0,
          explanation:
            "The classic \"HOCs don't pass refs through\" problem disappears for function components in React 19, because `ref` travels with the rest of the props. In React 18 the wrapper had to use `forwardRef`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-ref-forwarding-q10",
          prompt:
            "In development with StrictMode, a callback ref `(node) => { if (node) registry.push(node); }` leaves each node in `registry` twice. Why?",
          options: [
            "StrictMode runs an extra ref setup and cleanup in development, and nothing removes the node, so it's pushed twice",
            "React calls every callback ref twice, in development and in production builds alike",
            "The callback runs once for the `<input>` and once again for its parent `<label>` element",
            "StrictMode renders the component twice and keeps both resulting DOM nodes in the page",
          ],
          correctIndex: 0,
          explanation:
            "Since React 19, StrictMode re-runs ref callbacks once on mount (setup, cleanup, setup) to expose missing cleanup. Return a cleanup that removes the node from the registry and the count stays correct.",
        },
      ],
    },
    {
      id: "react-adv-compound-components",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "Compound Components Pattern",
      summary:
        "Compound components are a set of components that work together while sharing implicit state: `<Tabs>`, `<Tabs.List>`, `<Tabs.Tab>`, `<Tabs.Panel>`, the way `<select>` and `<option>` work in HTML. The root owns the state (which tab is selected) and the parts read it, so consumers control structure and markup (reordering, wrapping, adding their own elements) without the component growing a prop for every variation. That inversion of control is the backbone of headless libraries such as Radix, React Aria and Headless UI. The alternative, a configuration prop like `<Tabs items={[...]} />`, is simpler and more constrained, and often wins for internal components with one fixed look.\n\nThe old implementation used `Children.map` and `cloneElement` to inject props into direct children. It breaks as soon as a consumer wraps a tab in a `<div>`, a Fragment or their own component, because `Children` doesn't look inside those, and react.dev now calls the `Children` APIs fragile. The modern implementation shares state through context: the root provides `{ selected, select }`, each part reads it through a Hook that throws a helpful error outside the root, and each part carries an explicit `value` instead of relying on render order.\n\nThe details separate good from broken. Support both controlled (`value` + `onValueChange`) and uncontrolled (`defaultValue`) use, like native inputs. Memoise the context value, or every part re-renders whenever the root does. Wire accessibility with the right roles and `useId` for `aria-controls` and `aria-labelledby`. And with Server Components, dot notation has a catch: a Server Component can't read `Tabs.List` off a component imported from a `\"use client\"` module (React throws \"You cannot dot into a client module\"), so export each part by name too.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "patterns.dev: Compound Pattern", url: "https://www.patterns.dev/react/compound-pattern/", kind: "article" },
        { label: "Kent C. Dodds: React Hooks: Compound Components", url: "https://kentcdodds.com/blog/compound-components-with-react-hooks", kind: "article" },
        { label: "react.dev: Children (and its alternatives)", url: "https://react.dev/reference/react/Children", kind: "docs" },
        { label: "Radix Primitives: Composition", url: "https://www.radix-ui.com/primitives/docs/guides/composition", kind: "docs" },
      ],
      video: {
        title: "Compound Components in React (Design Patterns)",
        channel: "Cosden Solutions",
        url: "https://www.youtube.com/watch?v=N_WgBU3S9W8",
        videoId: "N_WgBU3S9W8",
        durationLabel: "18:21",
      },
      alternateVideos: [
        {
          title: "Composition Is All You Need | Fernando Rojo at React Universe Conf 2025",
          channel: "Callstack",
          url: "https://www.youtube.com/watch?v=4KvbVq3Eg5w",
          videoId: "4KvbVq3Eg5w",
          durationLabel: "22:17",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-adv-compound-components-q1",
          prompt:
            "What goes wrong with this `Tabs`?\n\n```jsx\nfunction Tabs({ children }) {\n  const [selected, setSelected] = useState(0);\n  return Children.map(children, (child, index) =>\n    cloneElement(child, {\n      isSelected: index === selected,\n      onSelect: () => setSelected(index),\n    })\n  );\n}\n\n<Tabs>\n  <Tab>Profile</Tab>\n  <>\n    <Tab>Billing</Tab>\n    <Tab>Team</Tab>\n  </>\n</Tabs>\n```",
          options: [
            "The Fragment counts as one child: it gets the injected props, and the two tabs inside never do",
            "`Children.map` flattens the Fragment, so all three tabs receive their props correctly",
            "React throws, because a Fragment can't be passed as one of a component's children",
            "Each tab inside the Fragment receives the injected props twice, once per level",
          ],
          correctIndex: 0,
          explanation:
            "The `Children` APIs don't traverse into Fragments or into other components' output, so cloning only reaches direct children. Sharing state through context works at any depth and under any wrapper.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-compound-components-q2",
          prompt: "Why is context the preferred way for a compound `Tabs` to share state with its parts?",
          options: [
            "Parts can be wrapped, reordered or nested at any depth and still read the state",
            "Context updates are cheaper than props, so the parts re-render less often",
            "`cloneElement` was removed in React 19, so context is the only option left",
            "Reading context lets the parts ignore the Rules of Hooks inside loops",
          ],
          correctIndex: 0,
          explanation:
            "Context reaches any descendant regardless of the markup in between, which is exactly the freedom compound components promise. `cloneElement` still exists (as a legacy API), and context doesn't make re-renders cheaper.",
        },
        {
          id: "react-adv-compound-components-q3",
          prompt:
            "Why default the context to `null` and throw in the Hook?\n\n```jsx\nconst TabsContext = createContext(null);\n\nfunction useTabs() {\n  const ctx = useContext(TabsContext);\n  if (ctx === null) throw new Error(\"<Tabs.Tab> must be used inside <Tabs>\");\n  return ctx;\n}\n```",
          options: [
            "A part rendered outside its root fails immediately with a clear message instead of misbehaving on a fake default",
            "A `null` default makes the context faster to read, because React skips the provider search",
            "React requires the context of every compound component to default to `null`",
            "It stops the root from re-rendering its parts whenever the selected tab changes",
          ],
          correctIndex: 0,
          explanation:
            "A realistic-looking default (say, a no-op `select`) lets a misplaced part render and silently do nothing. Failing loudly with a named error points the developer straight at the mistake.",
        },
        {
          id: "react-adv-compound-components-q4",
          prompt:
            "What happens when `page.jsx`, a Server Component, renders this?\n\n```jsx\n// tabs.jsx\n\"use client\";\nexport function Tabs(props) { /* ... */ }\nTabs.List = function TabsList(props) { /* ... */ };\n\n// page.jsx (Server Component)\nimport { Tabs } from \"./tabs\";\nexport default function Page() {\n  return (\n    <Tabs>\n      <Tabs.List>{/* ... */}</Tabs.List>\n    </Tabs>\n  );\n}\n```",
          options: [
            "It throws: a Server Component can't dot into a client module's export, so export `TabsList` by name and import it",
            "It works: the static `List` property is serialised to the client together with the `Tabs` reference",
            "It renders, but `Tabs.List` becomes a Server Component and silently loses its state and handlers",
            "React silently renders nothing for `Tabs.List` and logs a hydration warning in development",
          ],
          correctIndex: 0,
          explanation:
            "On the server, an import from a `\"use client\"` module is a client reference, not the real function, and reading a property from it throws \"You cannot dot into a client module from a server component\". Export every part by name (you can still attach them for client-side use).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-compound-components-q5",
          prompt:
            "You want `<Tabs>` to work both controlled and uncontrolled, like a native input. Which design choices are correct? (Select all that apply.)",
          options: [
            "Accept `value` + `onValueChange` for controlled use, and `defaultValue` for uncontrolled use",
            "Treat it as controlled when `value !== undefined`, and use internal state otherwise",
            "Call `onValueChange` in both modes when the user selects a tab",
            "Copy `value` into internal state with a `useEffect` whenever the prop changes",
            "Let consumers switch between controlled and uncontrolled freely at runtime",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "This mirrors native inputs and Radix: the prop wins when present, internal state is used otherwise, and change callbacks fire either way. Syncing props into state with an effect renders a stale value first, and switching modes mid-life is the same bug React warns about for inputs.",
        },
        {
          id: "react-adv-compound-components-q6",
          prompt:
            "The `Tabs` root keeps `hoveredId` in state (used only for styling the root) and provides `value={{ selected, select }}` to its parts, which are passed in as `children`. Hovering re-renders the root. What happens to the parts?",
          options: [
            "Every part re-renders on each hover change, because the provided object is new; memoising it lets them skip",
            "Nothing at all: parts passed in as `children` never re-render when their parent's state changes",
            "Only the hovered part re-renders, because React tracks which part caused the state change",
            "Every part unmounts and remounts, because the context object itself changed identity",
          ],
          correctIndex: 0,
          explanation:
            "The `children` elements came from above and are the same objects, so React would normally skip them. A fresh context value forces every consumer to re-render anyway; `useMemo(() => ({ selected, select }), [selected])` restores the skip.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-compound-components-q7",
          prompt:
            "Parts identify themselves by render order (the third `<Tab>` is index 2). What breaks when a consumer renders `{isAdmin && <Tab>Admin</Tab>}` before the other tabs?",
          options: [
            "Indexes shift when the admin tab appears or disappears, so the selection jumps to a different tab",
            "Nothing: React's keys stop the indexes from shifting when a conditional tab appears",
            "Conditionally rendered parts can't read context, so the admin tab can never be selected",
            "The admin tab is always moved to the end of the list, whatever its position in the JSX",
          ],
          correctIndex: 0,
          explanation:
            "Identity by position is fragile. Give each part an explicit `value`, the way `<option value>` works, or register descendants with stable ids.",
        },
        {
          id: "react-adv-compound-components-q8",
          prompt: "Which wiring makes a compound `Tabs` accessible?",
          options: [
            "Tablist/tab/tabpanel roles, `aria-selected`, and `aria-controls` / `aria-labelledby` ids from `useId`",
            "`role=\"button\"` on every tab and `aria-hidden` on inactive panels, with no id links",
            "`tabIndex={0}` on every tab and every panel, relying on the DOM order instead of roles",
            "Tab and panel ids generated with `Math.random()` during render to link them together",
          ],
          correctIndex: 0,
          explanation:
            "That's the WAI-ARIA tabs pattern (plus arrow-key navigation with a roving `tabIndex`). `useId` produces ids that match between server and client; `Math.random()` in render changes every render and breaks hydration.",
        },
        {
          id: "react-adv-compound-components-q9",
          prompt: "When is a configuration prop such as `<Tabs items={[{ label, content }]} />` the better API?",
          options: [
            "When the component has one fixed look and consumers shouldn't restructure it",
            "When consumers need to wrap individual tabs in their own components",
            "When different pages need different markup between the tab list and panels",
            "Always, because it avoids needing context or any shared state at all",
          ],
          correctIndex: 0,
          explanation:
            "Configuration props are simpler to use and harder to misuse, which is ideal when flexibility isn't needed. Compound components earn their complexity when consumers need to control structure.",
        },
        {
          id: "react-adv-compound-components-q10",
          prompt:
            "What does `Children.count(children)` return inside `List`?\n\n```jsx\n<List>\n  <Item />\n  {null}\n  {[<Item key=\"a\" />, <Item key=\"b\" />]}\n  <>\n    <Item />\n    <Item />\n  </>\n</List>\n```",
          options: ["5", "6", "4", "3"],
          correctIndex: 0,
          explanation:
            "Per the docs, empty nodes like `null` count, arrays don't count themselves but their items do, and Fragments aren't traversed: 1 + 1 + 2 + 1 = 5. This is exactly why `Children`-based compound components break when consumers group parts.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "react-adv-render-props-hocs",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "Render Props & HOCs (and Why Hooks Mostly Replaced Them)",
      summary:
        "Before Hooks, React had two ways to share stateful logic between components. A higher-order component is a function that takes a component and returns a wrapped one (`withRouter(Profile)`, `connect(mapState)(List)`) that injects props. A render prop is a component that owns the logic and calls a function you pass to decide what to render (`<Mouse render={pos => <Cursor {...pos} />} />`, or `children` as a function). Both work, and plenty of code you'll maintain is built on them.\n\nTheir costs are why Hooks replaced them for logic reuse. HOCs hide where props come from, collide silently when two wrappers inject the same prop name, need statics hoisted and (before React 19) refs forwarded, and stack into \"wrapper hell\" in DevTools. Render props avoid the naming problem but nest into pyramids when composed, and an inline render function is a new prop on every render, which defeats `memo` on the component receiving it. A custom Hook delivers the same reuse as a plain function call: explicit inputs and outputs, no extra tree depth, and composition by calling one Hook from another.\n\nThey aren't dead. Render props remain the right tool when a component must hand rendering control back to the caller: `renderItem` in virtualised lists, slot-like APIs, and headless components that expose render-time state. HOC-style wrappers still fit cross-cutting concerns applied once at module level (`memo` itself is one), and anything that must wrap a subtree, such as an error boundary, has to be a component because a Hook can only return values. The classic HOC bug is applying one during render: `withTheme(Button)` called inside a component returns a new component type every time, so React remounts the whole subtree on every render and wipes its state. Create wrapped components once, at module scope.",
      level: "advanced",
      estMinutes: 65,
      webRefs: [
        { label: "React legacy docs: Higher-Order Components", url: "https://legacy.reactjs.org/docs/higher-order-components.html", kind: "docs" },
        { label: "React legacy docs: Render Props", url: "https://legacy.reactjs.org/docs/render-props.html", kind: "docs" },
        { label: "patterns.dev: HOC Pattern", url: "https://www.patterns.dev/react/hoc-pattern/", kind: "article" },
        { label: "react.dev: Reusing Logic with Custom Hooks", url: "https://react.dev/learn/reusing-logic-with-custom-hooks", kind: "docs" },
      ],
      video: {
        title: "Michael Jackson - Composing Behavior in React or Why React Hooks are Awesome",
        channel: "React Loop",
        url: "https://www.youtube.com/watch?v=nUzLlHFVXx0",
        videoId: "nUzLlHFVXx0",
        durationLabel: "31:56",
      },
      alternateVideos: [
        {
          title: "Michael Jackson - Never Write Another HoC",
          channel: "Phoenix ReactJS",
          url: "https://www.youtube.com/watch?v=BcVAq3YFiuc",
          videoId: "BcVAq3YFiuc",
          durationLabel: "51:07",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-adv-render-props-hocs-q1",
          prompt:
            "`Button` keeps internal state (a ripple animation in progress). What happens on each click?\n\n```jsx\nfunction Toolbar() {\n  const ThemedButton = withTheme(Button);\n  const [count, setCount] = useState(0);\n  return (\n    <ThemedButton onClick={() => setCount(count + 1)}>\n      Clicked {count}\n    </ThemedButton>\n  );\n}\n```",
          options: [
            "`withTheme` returns a new component type on every render, so React remounts the button and resets its state",
            "Nothing unusual: React caches HOC results per wrapped component, so the type stays the same",
            "The button renders twice per click, once for the old component type and once for the new",
            "React throws, because calling a HOC inside a component violates the Rules of Hooks",
          ],
          correctIndex: 0,
          explanation:
            "Reconciliation compares element types by identity, and each render creates a brand-new `ThemedButton` function. React treats it as a different component, unmounting the old subtree (state and DOM) and mounting a new one. Wrap components once, at module scope.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-render-props-hocs-q2",
          prompt:
            "`export default withUser(withRouter(Profile))`, and both HOCs inject a prop named `data`. What does `Profile` receive?",
          options: [
            "One `data` value silently overwrites the other, depending on each HOC's spread order",
            "Both values, which React merges into an array because the prop name repeats",
            "Nothing: React throws a duplicate-prop error when the component tree is built",
            "Both values, with the inner one renamed to `data2` and a warning in the console",
          ],
          correctIndex: 0,
          explanation:
            "Props are a flat object, so the last write wins and nothing warns you. Hooks avoid this entirely because you name each result yourself: `const user = useUser(); const route = useRoute();`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-render-props-hocs-q3",
          prompt: "Which are real drawbacks of higher-order components? (Select all that apply.)",
          options: [
            "Reading a component, you can't tell which HOC supplied a given prop",
            "Static methods on the wrapped component aren't copied to the wrapper unless hoisted",
            "Every HOC adds a layer to the component tree (\"wrapper hell\" in DevTools)",
            "HOCs can't pass the caller's props through to the wrapped component",
            "HOCs only work when the wrapped component is a class",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The legacy docs list the statics and naming caveats, and indirection plus tree depth are the everyday costs. HOCs pass props through by spreading them, and they wrap function components just as well as classes.",
        },
        {
          id: "react-adv-render-props-hocs-q4",
          prompt:
            "Why does `DataTable` re-render on every keystroke?\n\n```jsx\nconst DataTable = memo(function DataTable({ rows, renderRow }) {\n  return <table><tbody>{rows.map(renderRow)}</tbody></table>;\n});\n\nfunction Page({ rows }) {\n  const [query, setQuery] = useState(\"\");\n  return (\n    <>\n      <input value={query} onChange={(e) => setQuery(e.target.value)} />\n      <DataTable rows={rows} renderRow={(row) => <Row key={row.id} row={row} />} />\n    </>\n  );\n}\n```",
          options: [
            "The inline `renderRow` arrow is a new function on each render, so `memo`'s shallow comparison fails",
            "Render props always bypass `memo` by design, because React can't know what they will render",
            "`rows` is recreated on every keystroke, because it's a prop coming from the parent component",
            "`memo` doesn't apply to components that call functions received through their props",
          ],
          correctIndex: 0,
          explanation:
            "`rows` is stable (it comes from `Page`'s props), but the arrow function is new every time. Hoist it outside the component, wrap it in `useCallback`, or let React Compiler memoise it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-render-props-hocs-q5",
          prompt: "Why did custom Hooks largely replace HOCs and render props for sharing stateful logic?",
          options: [
            "They compose as plain function calls with explicit inputs and outputs, adding no wrapper components",
            "They're faster, because Hooks run outside rendering and skip reconciliation entirely",
            "HOCs and render props were removed from React 18, so migrating to Hooks became mandatory",
            "Hooks automatically share a single state instance between every component that calls them",
          ],
          correctIndex: 0,
          explanation:
            "Hooks give the same reuse with less indirection and no tree depth. They don't share state between callers (each call is independent), they run during rendering, and HOCs and render props still work in current React.",
        },
        {
          id: "react-adv-render-props-hocs-q6",
          prompt: "Where do render props still make sense today? (Select all that apply.)",
          options: [
            "A virtualised list's `renderItem`, which the list calls only for the rows that are visible",
            "A headless component letting the caller decide the markup using the component's render-time state",
            "Sharing a window-width subscription between two unrelated components",
            "Reading a context value in a deeply nested component",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Render props shine when a component has to hand rendering control back to its caller at specific points. Reusing a subscription is a custom Hook's job, and reading context is what `useContext` or `use` are for.",
        },
        {
          id: "react-adv-render-props-hocs-q7",
          prompt: "`withWindowWidth(Component)` is rewritten as `useWindowWidth()`, and two components each call it. What's true?",
          options: [
            "Each call has its own state and its own resize subscription; Hooks share logic, not state",
            "Both components share one state value, because they call the very same Hook function",
            "Only the first component to mount subscribes, and the second one reads its value",
            "React notices the identical Hook calls and merges the two subscriptions into one",
          ],
          correctIndex: 0,
          explanation:
            "Every Hook call is independent, exactly like two instances of a HOC-wrapped component. To share one subscription, put it in a store (read with `useSyncExternalStore`) or lift it into context.",
        },
        {
          id: "react-adv-render-props-hocs-q8",
          prompt:
            "Why do well-behaved HOCs set `Wrapped.displayName = \"withTheme(\" + getDisplayName(Component) + \")\"`?",
          options: [
            "So DevTools and component stacks show which component is wrapped instead of a generic name",
            "React requires a `displayName` on every component that is returned from a function",
            "React caches HOC results by `displayName`, so each wrapper needs a unique one",
            "`memo` compares wrapped components by `displayName` when deciding whether to skip",
          ],
          correctIndex: 0,
          explanation:
            "It's a debugging convention from the HOC docs. Without it, every wrapper shows up under the inner function's name, and error stacks full of anonymous wrappers are painful to read.",
        },
        {
          id: "react-adv-render-props-hocs-q9",
          prompt:
            "How must `Toggle` be implemented for this to work?\n\n```jsx\n<Toggle>\n  {({ on, toggle }) => (\n    <button onClick={toggle}>{on ? \"On\" : \"Off\"}</button>\n  )}\n</Toggle>\n```",
          options: [
            "It keeps `on` in state and returns `children({ on, toggle })`",
            "It renders `{children}` directly, and React calls the function for it",
            "It passes `on` and `toggle` to `children` with `cloneElement`",
            "It must be a class, because function children only work with classes",
          ],
          correctIndex: 0,
          explanation:
            "A function isn't a valid React child (React warns if you try to render one), so the component itself must call it with its state. `cloneElement` needs an element, not a function.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-render-props-hocs-q10",
          prompt: "Which of these can't be written as a custom Hook and still needs a component?",
          options: [
            "Catching rendering errors thrown anywhere in a subtree",
            "Subscribing to window resize and returning the current width",
            "Fetching data and returning `{ data, error, isLoading }`",
            "Tracking whether an element is hovered through a ref",
          ],
          correctIndex: 0,
          explanation:
            "A Hook runs inside one component and can only return values; it can't wrap other components' rendering. Error boundaries (and providers or Suspense boundaries) must sit in the tree as components.",
        },
      ],
    },
    {
      id: "react-adv-lazy-suspense",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "Code Splitting with lazy & Suspense",
      summary:
        "Code splitting exists because users shouldn't download the admin dashboard to read the landing page. `lazy(() => import(\"./Chart\"))` turns a dynamic `import()` into a component that loads on first render, and the nearest `<Suspense fallback>` above it shows the fallback until the chunk arrives. Split at route boundaries first (most of the win for the least UX cost), then at heavy, rarely used widgets such as editors, charts and maps; splitting tiny components only adds requests and loading flashes.\n\nUnder the hood `lazy` is a small state machine. On first render it calls your loader once and caches the promise; while it's pending, rendering throws that promise, and React shows the nearest fallback and retries when it settles. Once fulfilled, the module's `default` export renders from then on. Once rejected, the error goes to the nearest error boundary and stays cached, so retrying a failed chunk needs a new `lazy` or a reload. That's why lazy components must be declared at module level: declared inside a component, a new one is created every render, which re-suspends and resets state. The loader must resolve to a module with a `default` export, and nothing loads before first render unless you preload it (say, by calling `import()` on hover).\n\nSuspense's display rules are where people get surprised. React reveals loaded content at most once every 300 ms, so nearby boundaries appear together rather than flickering in one by one. If a boundary already showing content suspends again, the fallback replaces that content, unless the update was a transition (`startTransition` or `useDeferredValue`), in which case React keeps the old UI on screen. Changing a boundary's `key` deliberately resets it, and a tree that suspends before its first mount keeps no state.",
      level: "advanced",
      estMinutes: 70,
      webRefs: [
        { label: "react.dev: lazy", url: "https://react.dev/reference/react/lazy", kind: "docs" },
        { label: "react.dev: Suspense", url: "https://react.dev/reference/react/Suspense", kind: "docs" },
        { label: "web.dev: Code splitting with React.lazy and Suspense", url: "https://web.dev/articles/code-splitting-suspense", kind: "article" },
        { label: "sudheerj: React Interview Questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Speed Up Your React Apps With Code Splitting",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=JU6sl_yyZqs",
        videoId: "JU6sl_yyZqs",
        durationLabel: "16:49",
      },
      alternateVideos: [
        {
          title: "How does react Suspense work?",
          channel: "Web Dev Cody",
          url: "https://www.youtube.com/watch?v=8YQXeqgSSeM",
          videoId: "8YQXeqgSSeM",
          durationLabel: "10:36",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `lazy(load)`, a miniature `React.lazy`. It returns an object with two methods.\n\n`read()` is what React does when it renders the lazy component:\n\n- On the first call, call `load()` exactly once and remember the thenable it returns.\n- While that thenable is pending, throw the thenable itself. That's how a component suspends.\n- Once it fulfils with a module object, return the module's `default` export on every call. If the module has no `default` key, throw `new Error(\"lazy: module has no default export\")`.\n- Once it rejects, throw the rejection reason on every later call, without calling `load` again.\n\n`preload()` starts loading if nothing has started yet, without throwing, and returns the thenable.\n\nAlso:\n\n- Don't call `load` when `lazy` is created: nothing loads until the first `read()` or `preload()`, and `load` must never be called more than once.\n- `load` may return a bare thenable (an object with only a `then` method), so don't rely on `catch`, `finally` or `instanceof Promise`.\n\nThe tests call `runLazyScenario(spec)`, which creates one lazy component and runs its steps: `\"render\"` is a Suspense-like loop that logs `\"fallback\"` and waits whenever `read()` throws a thenable, logs `\"error: <message>\"` like an error boundary when it throws anything else, and otherwise logs the component's output; `\"preload\"` calls `preload()`; `\"flush\"` lets pending work settle. It returns the log and how many times `load` was called. Leave the driver as it is.",
        starterCode: `/**
 * A miniature React.lazy.
 * @param {() => PromiseLike<{ default?: Function }>} load
 * @returns {{ read: () => Function, preload: () => PromiseLike<any> }}
 */
function lazy(load) {
  // Your code here
  return {
    read() {},
    preload() {},
  };
}

// ---- Test driver (leave as is) ----
// Creates one lazy component whose loader resolves (or rejects) after spec.ticks microtasks,
// then runs spec.steps:
//   "render"   render it inside a <Suspense>-like loop: if read() throws a thenable, log
//              "fallback", wait for the thenable to settle and retry; if it throws anything
//              else, log "error: <message>" (an error boundary); otherwise call the component
//              and log its output
//   "preload"  call preload() (hover-to-prefetch)
//   "flush"    let pending microtasks run
// spec.module: "ok" (a default export), "noDefault", or "fail" (rejects with ChunkLoadError).
// spec.thenable: return a bare thenable instead of a real Promise from the loader.
async function runLazyScenario(spec) {
  const log = [];
  let loadCalls = 0;
  const settleAfter = (ticks, settle) => {
    let n = ticks;
    const step = () => (n-- > 0 ? Promise.resolve().then(step) : settle());
    step();
  };
  const loader = () => {
    loadCalls++;
    const outcome = (resolve, reject) =>
      settleAfter(spec.ticks ?? 2, () => {
        if (spec.module === "fail") reject(new Error("ChunkLoadError"));
        else if (spec.module === "noDefault") resolve({ Greeting: (p) => "Hello " + p.name });
        else resolve({ default: (p) => "Hello " + p.name });
      });
    if (!spec.thenable) return new Promise(outcome);
    // A minimal thenable: no catch, no finally, not instanceof Promise.
    let state = "pending", value, callbacks = [];
    const settle = (s, v) => {
      if (state !== "pending") return;
      state = s;
      value = v;
      callbacks.forEach((cb) => cb());
      callbacks = [];
    };
    outcome((v) => settle("fulfilled", v), (e) => settle("rejected", e));
    return {
      then(onFulfilled, onRejected) {
        return new Promise((resolve, reject) => {
          const run = () => {
            try {
              if (state === "fulfilled") resolve(onFulfilled ? onFulfilled(value) : value);
              else if (onRejected) resolve(onRejected(value));
              else reject(value);
            } catch (e) {
              reject(e);
            }
          };
          if (state === "pending") callbacks.push(run);
          else Promise.resolve().then(run);
        });
      },
    };
  };
  const flush = async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
  };
  let Lazy;
  try {
    Lazy = lazy(loader);
  } catch (e) {
    return { threw: String((e && e.message) || e) };
  }
  if (!Lazy || typeof Lazy.read !== "function") return { threw: "lazy() must return { read, preload }" };
  for (const step of spec.steps) {
    if (step === "flush") await flush();
    else if (step === "preload") {
      try {
        Lazy.preload();
      } catch (e) {
        log.push("preload threw: " + String((e && e.message) || e));
      }
    } else if (step === "render") {
      let done = false;
      for (let attempt = 0; attempt < 5 && !done; attempt++) {
        let Component;
        try {
          Component = Lazy.read();
        } catch (thrown) {
          if (thrown && typeof thrown.then === "function") {
            log.push("fallback");
            try {
              await thrown;
            } catch {
              // React retries the render whether the thenable fulfilled or rejected
            }
            await flush();
            continue;
          }
          log.push("error: " + String((thrown && thrown.message) || thrown));
          done = true;
          continue;
        }
        log.push(typeof Component === "function" ? Component({ name: "Ada" }) : "not a component");
        done = true;
      }
      if (!done) log.push("gave up");
    }
  }
  return { log, loadCalls };
}
`,
        functionName: "runLazyScenario",
        testCases: [
          {
            description: "the first render suspends, then shows the component",
            args: [{ module: "ok", steps: ["render"] }],
            expected: { log: ["fallback", "Hello Ada"], loadCalls: 1 },
          },
          {
            description: "once loaded, later renders neither suspend nor load again",
            args: [{ module: "ok", steps: ["render", "render"] }],
            expected: { log: ["fallback", "Hello Ada", "Hello Ada"], loadCalls: 1 },
          },
          {
            description: "creating the lazy component doesn't start loading",
            args: [{ module: "ok", steps: ["flush"] }],
            expected: { log: [], loadCalls: 0 },
            isEdgeCase: true,
          },
          {
            description: "preloading before the first render avoids the fallback",
            args: [{ module: "ok", steps: ["preload", "flush", "render"] }],
            expected: { log: ["Hello Ada"], loadCalls: 1 },
          },
          {
            description: "repeated preloads and a render during loading share one load",
            args: [{ module: "ok", ticks: 10, steps: ["preload", "preload", "render", "render"] }],
            expected: { log: ["fallback", "Hello Ada", "Hello Ada"], loadCalls: 1 },
          },
          {
            description: "a failed chunk reaches the error boundary, and the failure is cached",
            args: [{ module: "fail", steps: ["render", "render"] }],
            expected: { log: ["fallback", "error: ChunkLoadError", "error: ChunkLoadError"], loadCalls: 1 },
            isEdgeCase: true,
          },
          {
            description: "a module without a default export is an error",
            args: [{ module: "noDefault", steps: ["render"] }],
            expected: { log: ["fallback", "error: lazy: module has no default export"], loadCalls: 1 },
            isEdgeCase: true,
          },
          {
            description: "a bare thenable (not a real Promise) works",
            args: [{ module: "ok", thenable: true, steps: ["render", "render"] }],
            expected: { log: ["fallback", "Hello Ada", "Hello Ada"], loadCalls: 1 },
            isEdgeCase: true,
          },
          {
            description: "a bare thenable that rejects still reaches the error boundary",
            args: [{ module: "fail", thenable: true, steps: ["render"] }],
            expected: { log: ["fallback", "error: ChunkLoadError"], loadCalls: 1 },
          },
        ],
      },
    },
    {
      id: "react-adv-concurrent",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "Concurrent React: useTransition & useDeferredValue",
      summary:
        "Before React 18, rendering was synchronous: once an update started, a slow tree blocked input until it finished. Concurrent rendering makes the render phase interruptible. Updates carry priorities, internally lanes: a 31-bit mask with separate lanes for discrete input such as clicks, continuous input such as pointer moves, default updates, transitions, retries and idle work. The work loop processes one fiber at a time and checks `shouldYield()` between units so the browser can handle input. A render can be paused, restarted or thrown away; the commit is still synchronous, and effects run only for renders that commit, which is why rendering must be pure.\n\n`startTransition` (and `useTransition`, which adds `isPending`) marks state updates as non-urgent: typing stays responsive while the expensive re-render happens in the background, gets restarted by newer input, and doesn't replace already-revealed content with a Suspense fallback. In React 19 it accepts async functions (Actions), and `isPending` stays true until they finish, but state updates after an `await` must be wrapped in `startTransition` again, a documented limitation. Transitions can't drive a controlled text input's value, and they need access to the state setter; for a value you only receive, such as a prop, use `useDeferredValue`.\n\n`useDeferredValue(value)` first renders with the old value, then schedules an interruptible background render with the new one. It has no fixed delay (fast devices catch up at once), doesn't reduce network requests, and only helps if the slow child is wrapped in `memo` so the urgent render can skip it. Paired with Suspense it keeps stale results visible instead of a fallback. The limit to remember: React yields only between components, so a single component that takes 200 ms to render still blocks for 200 ms.",
      level: "expert",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "react.dev: useTransition", url: "https://react.dev/reference/react/useTransition", kind: "docs" },
        { label: "react.dev: useDeferredValue", url: "https://react.dev/reference/react/useDeferredValue", kind: "docs" },
        { label: "React 18 Working Group: New feature: startTransition", url: "https://github.com/reactwg/react-18/discussions/41", kind: "article" },
        { label: "GitHub: Initial Lanes implementation (react#18796)", url: "https://github.com/react/react/pull/18796", kind: "repo" },
      ],
      video: {
        title: "Modern React Patterns: Concurrent Rendering, Actions & What’s Next | Aurora Scharff at RUC 2025",
        channel: "Callstack",
        url: "https://www.youtube.com/watch?v=I3AsmAWWGEs",
        videoId: "I3AsmAWWGEs",
        durationLabel: "26:31",
      },
      alternateVideos: [
        {
          title: "useTransition() vs useDeferredValue | React 18",
          channel: "Academind",
          url: "https://www.youtube.com/watch?v=lDukIAymutM",
          videoId: "lDukIAymutM",
          durationLabel: "16:22",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-adv-concurrent-q1",
          prompt:
            "Why is this wrong, and what's the usual fix?\n\n```jsx\nfunction Search() {\n  const [query, setQuery] = useState(\"\");\n  const [isPending, startTransition] = useTransition();\n  return (\n    <>\n      <input\n        value={query}\n        onChange={(e) => startTransition(() => setQuery(e.target.value))}\n      />\n      <Results query={query} />\n    </>\n  );\n}\n```",
          options: [
            "Transition updates can't control a text input; keep `setQuery` urgent and defer the slow part, e.g. `useDeferredValue(query)`",
            "Nothing is wrong: wrapping every input update in a transition is the pattern the docs recommend",
            "`startTransition` can't be called from event handlers, only from effects or Server Actions",
            "`isPending` must be read during render, otherwise React discards the transition update",
          ],
          correctIndex: 0,
          explanation:
            "The input's value must update synchronously with each keystroke; as a transition it can lag or be interrupted, which breaks controlled inputs. Update the input urgently and let the expensive consumer (`Results`) work from a deferred copy.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-concurrent-q2",
          prompt:
            "In React 19, what's the problem with `setQuantity` here?\n\n```jsx\nstartTransition(async () => {\n  const saved = await saveQuantity(q);\n  setQuantity(saved);\n});\n```",
          options: [
            "Updates after an `await` aren't marked as a transition; wrap `setQuantity(saved)` in another `startTransition`",
            "Async functions can't be passed to `startTransition`; only synchronous callbacks are accepted",
            "`setQuantity` runs before `saveQuantity` resolves, because transitions don't wait for promises",
            "React silently discards state updates made after an `await` inside any transition",
          ],
          correctIndex: 0,
          explanation:
            "React 19 accepts async Actions and keeps `isPending` true until they finish, but it can't yet track the transition context across an `await`. The docs call this a known limitation: wrap post-`await` updates in `startTransition` again.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-concurrent-q3",
          prompt:
            "`SlowList` isn't wrapped in `memo`, and typing still lags. Why?\n\n```jsx\nfunction App() {\n  const [text, setText] = useState(\"\");\n  const deferredText = useDeferredValue(text);\n  return (\n    <>\n      <input value={text} onChange={(e) => setText(e.target.value)} />\n      <SlowList text={deferredText} />\n    </>\n  );\n}\n```",
          options: [
            "During the urgent render `SlowList` re-renders anyway, because its parent did, so deferring its prop saves nothing",
            "`useDeferredValue` only works on values that were set inside a `startTransition` call",
            "In development builds the deferred value updates synchronously, so the lag only appears there",
            "`useDeferredValue` needs an explicit delay argument, such as 300 ms, before it defers anything",
          ],
          correctIndex: 0,
          explanation:
            "The trick is that the urgent render passes the old `deferredText`, so a memoised `SlowList` can skip. Without `memo` it re-renders with the old value during the urgent pass and again in the background, which is worse than before.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-concurrent-q4",
          prompt: "Which statements about `useDeferredValue` are true? (Select all that apply.)",
          options: [
            "It has no fixed delay: on a fast device the background render happens almost immediately",
            "Its background render is interruptible and restarts if the value changes again",
            "If the background render suspends, the user keeps seeing the old value instead of a fallback",
            "It reduces the number of network requests, the way debouncing does",
            "Inside a transition it defers again, adding a second background pass",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Deferral adapts to the device and is integrated with Suspense. It doesn't stop extra requests on its own, and when the update is already a transition it returns the new value directly without spawning another deferred render.",
        },
        {
          id: "react-adv-concurrent-q5",
          prompt:
            "Switching tabs renders a component that suspends inside a `<Suspense>` boundary that's already showing content. What happens without a transition, and what changes with `startTransition`?",
          options: [
            "Without it, the visible content is replaced by the fallback; with it, React keeps the old tab on screen until the new one is ready",
            "Nothing changes: a Suspense boundary always shows its fallback whenever something inside it suspends",
            "Without it, React keeps the old tab on screen; with it, the fallback appears immediately instead",
            "With it, React skips Suspense entirely and commits the new tab with whatever parts are ready",
          ],
          correctIndex: 0,
          explanation:
            "The Suspense docs: if a boundary that was showing content suspends again, the fallback is shown unless the update came from `startTransition` or `useDeferredValue`. A transition only waits long enough to avoid hiding revealed content; brand-new nested boundaries still show their fallbacks.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-concurrent-q6",
          prompt: "When does `isPending` from `useTransition` go back to `false` for an async Action?",
          options: [
            "When all Actions in the transition have completed and the final state is shown",
            "As soon as the async function has been called and returned its promise",
            "After a fixed 300 ms, whether or not the Action has finished",
            "When the first `await` inside the Action resolves",
          ],
          correctIndex: 0,
          explanation:
            "`isPending` switches to true at the first `startTransition` call and stays true until every Action completes and the resulting state is committed, which avoids flashing intermediate states.",
        },
        {
          id: "react-adv-concurrent-q7",
          prompt: "Which statements about concurrent rendering are true? (Select all that apply.)",
          options: [
            "A transition's render can be interrupted by an urgent update and restarted later",
            "The commit phase is synchronous: once React starts applying DOM changes, it finishes",
            "Effects don't run for a render that was abandoned before committing",
            "Each component renders exactly once per committed update",
            "An interrupted render leaves a half-updated DOM on screen until it resumes",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Only the render phase is interruptible, and its work lives in a work-in-progress tree, so nothing half-done reaches the DOM. Components can render several times per commit, which is one more reason rendering must be free of side effects.",
        },
        {
          id: "react-adv-concurrent-q8",
          prompt:
            "Inside a transition, one component's render function does 200 ms of synchronous work, and the user types while it runs. What happens to the keystroke?",
          options: [
            "It waits until that render function returns, because React can only yield between components",
            "React pauses the function midway, handles the keystroke, then resumes where it stopped",
            "React moves the slow component into a Web Worker, so typing is never blocked by it",
            "React cancels the render immediately and skips that component for the rest of the transition",
          ],
          correctIndex: 0,
          explanation:
            "JavaScript can't be pre-empted mid-function. React's work loop checks `shouldYield()` between units of work (fibers), so one huge component is an unbreakable block. Split the work across components, virtualise, or memoise.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-concurrent-q9",
          prompt: "Since the lanes refactor, how does React represent update priorities internally?",
          options: [
            "As bitmask lanes: separate bits for discrete input, continuous input, default updates, transitions, retries and idle work",
            "As a single numeric expiration time per update, with smaller values meaning higher priority",
            "As `requestIdleCallback` deadlines that the browser assigns to each pending update",
            "As the order of Promise microtasks, with urgent updates scheduled on earlier ticks",
          ],
          correctIndex: 0,
          explanation:
            "The lanes model (PR #18796) replaced expiration times. Bitmasks make it cheap to batch groups of updates, such as all pending transitions, and to check whether a render includes a given priority.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-concurrent-q10",
          prompt:
            "`useDeferredValue(tab)` receives a `tab` that was just updated inside `startTransition`. What does it return during that render?",
          options: [
            "The new value right away, without scheduling a deferred render, because the update is already non-urgent",
            "The old value first, and then the new value in a second, deferred background render",
            "`undefined` until the transition has committed its changes to the screen",
            "The value it was given on the component's first render, until the transition completes",
          ],
          correctIndex: 0,
          explanation:
            "The docs state that inside a transition `useDeferredValue` always returns the new value and doesn't spawn a deferred render, because the update is already deferred.",
        },
        {
          id: "react-adv-concurrent-q11",
          prompt: "What does `useDeferredValue(query, \"\")` do on a component's first render in React 19?",
          options: [
            "Renders with `\"\"` first, then schedules a background render with `query`",
            "Renders with `query`, falling back to `\"\"` only when `query` is `undefined`",
            "Throws, because `useDeferredValue` accepts exactly one argument",
            "Holds back the first render until `query` differs from `\"\"`",
          ],
          correctIndex: 0,
          explanation:
            "React 19 added the optional `initialValue`: the initial render uses it, and React immediately schedules a background re-render with the real value. It's useful when the real value is expensive to render on mount.",
        },
        {
          id: "react-adv-concurrent-q12",
          prompt:
            "A parent you don't control passes `filter` as a prop, and you need typing elsewhere on the page to stay responsive while a heavy chart re-renders for it. Which tool fits?",
          options: [
            "`useDeferredValue(filter)`, with the chart wrapped in `memo`",
            "`useTransition`, wrapping the incoming prop in `startTransition` inside the child",
            "`useLayoutEffect`, so the chart renders before the browser paints",
            "`flushSync` around the chart's update so it finishes immediately",
          ],
          correctIndex: 0,
          explanation:
            "A transition needs access to the state setter, and here you only receive the value. The docs point to `useDeferredValue` for exactly this case; `flushSync` and layout effects make updates more urgent, not less.",
        },
      ],
    },
    {
      id: "react-adv-server-components",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "React Server Components: The Conceptual Model",
      summary:
        "React Server Components split one React tree across two environments. Server Components run ahead of time, at build time or per request, and their code never ships to the browser: they can be `async`, `await` a database or the filesystem directly, and use heavy libraries at zero bundle cost. Client Components are the React you already know, with state, effects, refs and browser APIs. What travels to the client isn't HTML but a serialised description of the rendered tree (the RSC payload) with slots where Client Components go, so it can be refetched and merged into a live page without losing client state. SSR is a separate, optional step that turns the tree into initial HTML.\n\nThe boundary lives in the module graph, not the render tree. `\"use client\"` at the top of a file marks that module and everything it imports as client code. There is no directive for Server Components (they're the default); `\"use server\"` marks Server Functions. A Client Component can't import a Server Component, but it can render one passed in as `children` or another prop, because the server has already rendered it. That composition, a server shell around interactive client islands, is the core design skill, and it's why `\"use client\"` belongs as low in the tree as possible.\n\nEverything crossing the boundary must be serialisable: primitives, plain objects, arrays, `Map`, `Set`, `Date`, typed arrays, JSX, promises and Server Functions are fine; ordinary functions, class instances and unregistered symbols aren't, so passing an `onClick` from a Server Component throws. Server Components can't use state, effects or `useContext`, though they can render a provider imported from a client module. Promises are the elegant part: start a query without awaiting it, pass the promise down, and `use()` it inside `<Suspense>` to stream it in.",
      level: "expert",
      estMinutes: 80,
      webRefs: [
        { label: "react.dev: Server Components", url: "https://react.dev/reference/rsc/server-components", kind: "docs" },
        { label: "react.dev: 'use client'", url: "https://react.dev/reference/rsc/use-client", kind: "docs" },
        { label: "Josh W. Comeau: Making Sense of React Server Components", url: "https://www.joshwcomeau.com/react/server-components/", kind: "article" },
        { label: "Overreacted: The Two Reacts", url: "https://overreacted.io/the-two-reacts/", kind: "article" },
      ],
      video: {
        title: "React for Two Computers | Dan Abramov",
        channel: "React Conf",
        url: "https://www.youtube.com/watch?v=ozI4V_29fj4",
        videoId: "ozI4V_29fj4",
        durationLabel: "28:55",
      },
      alternateVideos: [
        {
          title: "React Server Components: A Comprehensive Breakdown",
          channel: "Theo - t3․gg",
          url: "https://www.youtube.com/watch?v=VIwWgV3Lc6s",
          videoId: "VIwWgV3Lc6s",
          durationLabel: "52:41",
        },
        {
          title: "React Server Components Change Everything",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=rGPpQdbDbwo",
          videoId: "rGPpQdbDbwo",
          durationLabel: "15:47",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-adv-server-components-q1",
          prompt:
            "A Server Component renders `<Chart ... />`, where `Chart` is a Client Component. Which props can it pass? (Select all that apply.)",
          options: [
            "`createdAt={new Date()}`",
            "`series={new Map([[\"a\", 1]])}`",
            "`dataPromise={db.query(sql)}`, an un-awaited promise",
            "`formatLabel={(v) => v.toFixed(2)}`",
            "`client={new ApiClient()}`, a class instance",
            "`tag={Symbol(\"chart\")}`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Dates, Maps and promises are on the serialisable list (a promise's resolved value must be serialisable too). Ordinary functions, class instances and symbols not registered with `Symbol.for` can't cross the boundary.",
        },
        {
          id: "react-adv-server-components-q2",
          prompt:
            "A Server Component renders `<Counter />`. Where does `formatCount` run?\n\n```jsx\n// Counter.jsx\n\"use client\";\nimport { formatCount } from \"./format\";\nexport default function Counter() {\n  const [n, setN] = useState(0);\n  return <button onClick={() => setN(n + 1)}>{formatCount(n)}</button>;\n}\n\n// format.js (no directive)\nexport function formatCount(n) {\n  return n.toLocaleString();\n}\n```",
          options: [
            "In the client bundle: modules imported by a `\"use client\"` module are client code, directive or not",
            "Only on the server, because `format.js` has no directive and defaults to being server code",
            "Nowhere: a client module can't import a module that doesn't declare a directive itself",
            "On the server only, with the formatted result serialised into the RSC payload",
          ],
          correctIndex: 0,
          explanation:
            "`\"use client\"` marks a boundary in the module dependency tree: the module and all of its transitive imports are client modules and ship in the browser bundle. (With SSR, client code also runs on the server once to produce the initial HTML, and `format.js` could separately be evaluated as server code if a Server Component imported it directly.)",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-server-components-q3",
          prompt:
            "Where does `Comments` run?\n\n```jsx\n// Page.jsx (Server Component)\nimport Tabs from \"./Tabs\";         // \"use client\"\nimport Comments from \"./Comments\"; // no directive, reads the database\n\nexport default function Page() {\n  return (\n    <Tabs>\n      <Comments />\n    </Tabs>\n  );\n}\n```",
          options: [
            "On the server: `Page` renders it, and `Tabs` receives the rendered result as `children`",
            "On the client, because it's nested inside a Client Component in the render tree",
            "Nowhere: it throws, because Client Components can't contain Server Components",
            "On both: once on the server, then again in the browser during hydration",
          ],
          correctIndex: 0,
          explanation:
            "What matters is who imports and renders `Comments`: `Page`, a Server Component. `Tabs` never imports it, it just places the already-rendered output in its slot. This is how server content ends up inside interactive client wrappers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-server-components-q4",
          prompt: "A teammate adds `\"use server\"` to the top of a data-fetching component file to make it a Server Component. What's wrong?",
          options: [
            "There's no directive for Server Components; `\"use server\"` marks Server Functions that the client can call",
            "Nothing: `\"use server\"` is the directive that marks a module's components as Server Components",
            "Only its position: the directive has to come after the imports to take effect",
            "It makes the component render in both environments instead of only on the server",
          ],
          correctIndex: 0,
          explanation:
            "The docs call this a common misunderstanding: in an RSC app components are server components by default, and `\"use server\"` exposes functions as Server Functions, which become callable endpoints from the client.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-server-components-q5",
          prompt: "Which of these can a Server Component do? (Select all that apply.)",
          options: [
            "Be an `async` function that `await`s a database query",
            "Import a large Markdown library without adding it to the client bundle",
            "Render a context provider imported from a `\"use client\"` module",
            "Call `useState` to track whether a panel is expanded",
            "Attach `onClick={() => track(\"buy\")}` to a `<button>` it renders",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Async rendering, zero-bundle dependencies and rendering client-side providers are all supported. State and event handlers need a Client Component: Server Components never run in the browser, and functions can't be serialised to it.",
        },
        {
          id: "react-adv-server-components-q6",
          prompt: "Which statement about Server Components and SSR is correct?",
          options: [
            "They're independent: RSC yields a refetchable component payload, SSR yields HTML, and an app can use either or both",
            "RSC is simply the new name for server-side rendering; the two terms describe the same mechanism",
            "Server Components need a running server on every request, so they can't execute at build time",
            "Server Components can't work without SSR, because their payload has to be hydrated from HTML",
          ],
          correctIndex: 0,
          explanation:
            "The docs describe Server Components running at build time or per request, with SSR as an optional step that turns the result into initial HTML. RSC is about where components run; SSR is about producing HTML.",
        },
        {
          id: "react-adv-server-components-q7",
          prompt:
            "After a mutation, the framework refetches the RSC payload for the current page. What happens to the `useState` value of a Client Component on that page?",
          options: [
            "It's preserved: the new payload is reconciled into the existing tree, like a re-render",
            "It's reset, because the page is replaced with freshly rendered HTML from the server",
            "It's sent to the server with the request, then serialised back in the new payload",
            "It's reset, but only for Client Components that were rendered with a `key`",
          ],
          correctIndex: 0,
          explanation:
            "That's the point of RSC over full page reloads: the server output is merged into the live tree, so client state and DOM state (focus, scroll) survive where the component type and position are unchanged.",
        },
        {
          id: "react-adv-server-components-q8",
          prompt:
            "What happens?\n\n```jsx\n// ProductPage.jsx (Server Component)\nimport BuyButton from \"./BuyButton\"; // \"use client\"\n\nexport default async function ProductPage({ id }) {\n  const product = await db.products.find(id);\n  return <BuyButton onBuy={() => cart.add(product.id)} />;\n}\n```",
          options: [
            "It errors: a plain function isn't serialisable; pass `productId` and handle the click in `BuyButton`, or pass a Server Function",
            "It works: the closure is serialised along with the captured `product.id` and rebuilt on the client",
            "It works, but the arrow function runs on the server every time the button is clicked",
            "`BuyButton` quietly receives `undefined` for `onBuy`, and nothing is reported",
          ],
          correctIndex: 0,
          explanation:
            "Only Server Functions (marked `\"use server\"`) can be passed as function props across the boundary, and they run on the server when called. Ordinary closures can't be serialised, so React throws.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-server-components-q9",
          prompt:
            "Why would a Server Component pass an un-awaited promise to a Client Component that calls `use(promise)` inside `<Suspense>`?",
          options: [
            "The rest of the page can be sent immediately, and that part streams in when the promise resolves",
            "Promises are the only way to pass data from a Server Component to a Client Component",
            "It moves the database query into the browser, which takes load off the server",
            "It removes the need for any Suspense boundary around the Client Component",
          ],
          correctIndex: 0,
          explanation:
            "Awaiting in the Server Component would hold back everything below it. Starting the query and handing over the promise lets the important content render first while the slower data streams in behind a fallback.",
        },
        {
          id: "react-adv-server-components-q10",
          prompt: "Deeply nested Client Components need the current user, which a Server Component loads. What works?",
          options: [
            "Render a provider exported from a `\"use client\"` module, passing the user as its `value`",
            "Call `createContext` in the Server Component module and render that context's provider",
            "Call `useContext` in the Server Component and pass the value down through props",
            "Store the user in a module-level variable that the Client Components import",
          ],
          correctIndex: 0,
          explanation:
            "Server Components can't create or read context, but they can render a provider defined in a client module, and Client Components below read it with `useContext` or `use`. A module variable would leak between requests on the server and be a different instance in the browser.",
        },
        {
          id: "react-adv-server-components-q11",
          prompt:
            "A `\"use client\"` component imports `getSecret()` from `lib/secrets.js`, which reads `process.env.API_SECRET`. What's the risk?",
          options: [
            "`lib/secrets.js` joins the client module graph and is bundled for the browser, so the secret leaks or reads as undefined",
            "None: modules without a directive always stay on the server, whoever imports them",
            "None: React strips every `process.env` read from client bundles automatically",
            "The build always fails, because client modules are never allowed to import from `lib/`",
          ],
          correctIndex: 0,
          explanation:
            "Everything a client module imports is client code and ships to the browser. Keep secrets in server-only modules (many teams add the `server-only` package so such an import fails the build) and pass only the data the client needs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-adv-server-components-q12",
          prompt: "A page is mostly static content with one interactive search box. Where should `\"use client\"` go?",
          options: [
            "In the search box's own module, keeping the page and its content as Server Components",
            "At the top of the page module, so that everything below it is able to use state",
            "At the top of every module in the app, so no component can accidentally break",
            "In the root layout, because the directive is inherited down the render tree",
          ],
          correctIndex: 0,
          explanation:
            "The directive pulls a module and all its imports into the client bundle, so put it at the leaves. It follows the module graph, not the render tree, and marking everything client-side throws away the benefits of RSC.",
        },
      ],
    },
    {
      id: "react-adv-reconciliation",
      moduleId: "fe-react-hooks",
      trackId: "frontend",
      title: "React Reconciliation & the Virtual DOM: How Diffing Actually Works",
      summary:
        "Every render produces a new tree of React elements, plain objects describing what the UI should look like. Reconciliation turns the difference between the previous tree and the new one into DOM operations. A general tree diff is O(n³), so React uses heuristics that make it O(n). Elements of different types produce different trees: if a `<div>` becomes a `<section>`, or `ProfileA` becomes `ProfileB` at the same position, React unmounts the old subtree, state and DOM included, and mounts a new one. Elements of the same type at the same position are updated in place and keep their state. Keys tell React which list children are the same across renders.\n\nThose rules explain famous bugs. A component defined inside another component is a new type on every render, so its subtree remounts and its state vanishes. Array indexes as keys tie state to positions rather than items, so inserting at the top shifts every row's input text. A changed `key` is the sanctioned way to reset a subtree. React's keyed diff is itself a heuristic: a single left-to-right pass keeps a node in place only if its old index is at least the highest old index kept so far, and moves the rest, so moving the last item to the front moves every other item instead of one. Vue 3 and Inferno instead keep a longest increasing subsequence to minimise moves, as the challenge does.\n\nSince React 16 the work runs on Fiber: each element gets a fiber, a unit of work linked to its child, sibling and parent, and render builds a work-in-progress copy of the tree (double buffering). Render walks fibers depth-first and can yield between them according to lane priorities; commit then applies every DOM mutation synchronously, attaches refs, runs layout effects and schedules passive effects.",
      level: "expert",
      estMinutes: 110,
      isMilestone: true,
      webRefs: [
        { label: "react.dev: Preserving and Resetting State", url: "https://react.dev/learn/preserving-and-resetting-state", kind: "docs" },
        { label: "React legacy docs: Reconciliation", url: "https://legacy.reactjs.org/docs/reconciliation.html", kind: "docs" },
        { label: "GitHub: acdlite/react-fiber-architecture", url: "https://github.com/acdlite/react-fiber-architecture", kind: "repo" },
        { label: "React source: ReactChildFiber.js (the keyed children diff)", url: "https://github.com/react/react/blob/main/packages/react-reconciler/src/ReactChildFiber.js", kind: "repo" },
      ],
      video: {
        title: "Lin Clark - A Cartoon Intro to Fiber - React Conf 2017",
        channel: "Meta Developers",
        url: "https://www.youtube.com/watch?v=ZCuYPiUIONs",
        videoId: "ZCuYPiUIONs",
        durationLabel: "31:47",
      },
      alternateVideos: [
        {
          title: "React Fiber Reconciliation: How it Works (Part 1)",
          channel: "Tejas Kumar",
          url: "https://www.youtube.com/watch?v=rKk4XJYzSQA",
          videoId: "rKk4XJYzSQA",
          durationLabel: "13:43",
        },
        {
          title: "A Guide to React Rendering Behavior - Mark Erikson - React Rally 2023",
          channel: "ReactRally",
          url: "https://www.youtube.com/watch?v=IGzfMDs2A5o",
          videoId: "IGzfMDs2A5o",
          durationLabel: "28:08",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `diffKeyedChildren(oldKeys, newKeys)`. Given the keys of a list's children before and after a render, return the DOM operations that turn the old list into the new one, applied in order, the way a renderer calls `removeChild` and `insertBefore`.\n\nOperations:\n\n- `{ op: \"remove\", key }`: remove an existing node.\n- `{ op: \"insert\", key, before }`: create the node for a new key and insert it before the node whose key is `before`, or at the end if `before` is `null`.\n- `{ op: \"move\", key, before }`: move an existing node before `before`, or to the end if `before` is `null`.\n\nRules:\n\n- Operations are applied one at a time to the live list, so a `before` anchor must be in the list when its operation runs.\n- Remove exactly the keys that disappear, and insert exactly the keys that are new.\n- Use the minimum possible number of moves: nodes whose relative order is unchanged stay put. Keep a longest increasing subsequence of old positions and move only the other surviving nodes. (React itself doesn't: its single pass keeps a node only if its old index is at least the highest old index kept so far, so moving the last item to the front costs it n − 1 moves instead of 1.)\n- If either list contains a duplicate key, throw `new Error(\"Duplicate key: \" + key)`.\n- Aim for O(n log n); the largest tests have 1,000 children.\n\nThe tests call `runKeyedDiff(oldKeys, newKeys)`, which replays your operations on a simulated DOM list and reports whether the final order matches `newKeys`, plus how many removes, inserts and moves you used (or why an operation was invalid). Leave the driver as it is.",
        starterCode: `/**
 * @param {string[]} oldKeys
 * @param {string[]} newKeys
 * @returns {{ op: "remove" | "insert" | "move", key: string, before?: string | null }[]}
 */
function diffKeyedChildren(oldKeys, newKeys) {
  // Your code here
  return [];
}

// ---- Test driver (leave as is) ----
// Applies your operations, in order, to a live list that starts as oldKeys (like DOM
// insertBefore/removeChild calls) and reports what happened.
function runKeyedDiff(oldKeys, newKeys) {
  let ops;
  try {
    ops = diffKeyedChildren(oldKeys.slice(), newKeys.slice());
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
  if (!Array.isArray(ops)) return { ok: false, invalid: "diffKeyedChildren must return an array" };
  const live = oldKeys.slice();
  const wanted = new Set(newKeys);
  const counts = { removes: 0, inserts: 0, moves: 0 };
  const placeBefore = (key, before) => {
    if (before === null || before === undefined) {
      live.push(key);
      return true;
    }
    const at = live.indexOf(before);
    if (at === -1) return false;
    live.splice(at, 0, key);
    return true;
  };
  for (const [i, o] of ops.entries()) {
    const where = "operation " + i + " (" + JSON.stringify(o) + ")";
    if (!o || typeof o !== "object") return { ok: false, invalid: where + " is not an object" };
    const at = live.indexOf(o.key);
    if (o.op === "remove") {
      if (at === -1) return { ok: false, invalid: where + ": key is not in the list" };
      live.splice(at, 1);
      counts.removes++;
    } else if (o.op === "insert") {
      if (at !== -1) return { ok: false, invalid: where + ": key is already in the list" };
      if (!wanted.has(o.key)) return { ok: false, invalid: where + ": key is not in newKeys" };
      if (!placeBefore(o.key, o.before)) return { ok: false, invalid: where + ": anchor is not in the list" };
      counts.inserts++;
    } else if (o.op === "move") {
      if (at === -1) return { ok: false, invalid: where + ": key is not in the list" };
      if (o.before === o.key) return { ok: false, invalid: where + ": a node can't be moved before itself" };
      live.splice(at, 1);
      if (!placeBefore(o.key, o.before)) return { ok: false, invalid: where + ": anchor is not in the list" };
      counts.moves++;
    } else {
      return { ok: false, invalid: where + ": unknown op" };
    }
  }
  const ok = live.length === newKeys.length && live.every((k, i) => k === newKeys[i]);
  return ok ? { ok, ...counts } : { ok, final: live, ...counts };
}
`,
        functionName: "runKeyedDiff",
        testCases: [
          {
            description: "an unchanged list needs no operations",
            args: [["a", "b", "c", "d", "e"], ["a", "b", "c", "d", "e"]],
            expected: { ok: true, removes: 0, inserts: 0, moves: 0 },
          },
          {
            description: "new keys at both ends are inserts, and nothing moves",
            args: [["b", "c"], ["a", "b", "c", "d"]],
            expected: { ok: true, removes: 0, inserts: 2, moves: 0 },
          },
          {
            description: "keys that disappear are removed, and nothing moves",
            args: [["a", "b", "c", "d"], ["a", "c"]],
            expected: { ok: true, removes: 2, inserts: 0, moves: 0 },
          },
          {
            description: "moving the last item to the front is one move (React's heuristic would use four)",
            args: [["a", "b", "c", "d", "e"], ["e", "a", "b", "c", "d"]],
            expected: { ok: true, removes: 0, inserts: 0, moves: 1 },
          },
          {
            description: "moving the first item to the end is one move",
            args: [["a", "b", "c", "d", "e"], ["b", "c", "d", "e", "a"]],
            expected: { ok: true, removes: 0, inserts: 0, moves: 1 },
          },
          {
            description: "reversing five items takes four moves",
            args: [["a", "b", "c", "d", "e"], ["e", "d", "c", "b", "a"]],
            expected: { ok: true, removes: 0, inserts: 0, moves: 4 },
          },
          {
            description: "removes, inserts and moves in one update",
            args: [["a", "b", "c", "d", "e", "f"], ["f", "b", "x", "d", "a", "y"]],
            expected: { ok: true, removes: 2, inserts: 2, moves: 2 },
          },
          {
            description: "an empty old list is all inserts",
            args: [[], ["a", "b", "c"]],
            expected: { ok: true, removes: 0, inserts: 3, moves: 0 },
            isEdgeCase: true,
          },
          {
            description: "an empty new list is all removes",
            args: [["a", "b", "c"], []],
            expected: { ok: true, removes: 3, inserts: 0, moves: 0 },
            isEdgeCase: true,
          },
          {
            description: "a duplicate key throws",
            args: [["a", "b", "b"], ["a", "b"]],
            expected: { error: "Duplicate key: b" },
            isEdgeCase: true,
          },
          {
            description: "1,000 children rotated by one need a single move",
            args: [
              Array.from({ length: 1000 }, (_, i) => "k" + i),
              ["k999", ...Array.from({ length: 999 }, (_, i) => "k" + i)],
            ],
            expected: { ok: true, removes: 0, inserts: 0, moves: 1 },
            isEdgeCase: true,
          },
          {
            description: "1,000 children reversed need 999 moves",
            args: [
              Array.from({ length: 1000 }, (_, i) => "k" + i),
              Array.from({ length: 1000 }, (_, i) => "k" + (999 - i)),
            ],
            expected: { ok: true, removes: 0, inserts: 0, moves: 999 },
            isEdgeCase: true,
          },
        ],
      },
    },
  ],
} satisfies Module;
