import type { Module } from "@/types/curriculum";

export default {
  id: "fe-react-fundamentals",
  trackId: "frontend",
  name: "React Fundamentals",
  description:
    "The mental model behind React 19.3: JSX and rendering, props, state snapshots and batching, events, conditional rendering, keys and reconciliation, forms, lifting state and composition. For engineers who have shipped React (or are arriving from another framework) and want to understand why the classic bugs happen. Some course videos predate Hooks and use class components or Create React App; each topic says what's different today.",
  refs: [
    { label: "react.dev: Learn React", url: "https://react.dev/learn", kind: "docs" },
    { label: "React blog: React 19.3", url: "https://react.dev/blog/2026/09/09/react-19-3", kind: "article" },
    { label: "React blog: Sunsetting Create React App", url: "https://react.dev/blog/2025/02/14/sunsetting-create-react-app", kind: "article" },
    { label: "sudheerj: React interview questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
  ],
  topics: [
    {
      id: "react-jsx-rendering",
      moduleId: "fe-react-fundamentals",
      trackId: "frontend",
      title: "JSX & How React Renders",
      summary:
        "JSX is syntax, not a template language. The compiler turns `<Button color=\"red\">Hi</Button>` into `jsx(Button, { color: \"red\", children: \"Hi\" })` (the automatic runtime from `react/jsx-runtime`, React 17+), and that call returns a plain, immutable object called a React element. Lowercase tags become strings (`\"div\"`); capitalised tags are references to your component function. Because it's JavaScript, braces take expressions only, attributes are camelCase DOM properties (`className`, `htmlFor`, `onClick`), `style` takes an object, and a component returns one root (use `<>…</>`, or `<Fragment key>` in lists; React 19.3 also lets a Fragment take a `ref`).\n\nRendering means React calling your components to get elements; committing means applying the minimal DOM changes. A state change re-renders that component and, by default, every component it renders whether or not their props changed, so a re-render is not a DOM update. The model only works if render is pure: same props, state and context in, same JSX out, no mutation of values that existed before the render. `<StrictMode>` calls component bodies twice in development to expose impurity, and React Compiler (1.0 since October 2025) relies on the same Rules of React to memoise automatically, which is why most new code no longer needs hand-written `useMemo` and `useCallback`.\n\nText in braces is escaped, so `{userInput}` can't inject markup; `dangerouslySetInnerHTML` is the deliberate, reviewable escape hatch. `false`, `null`, `undefined` and `true` render nothing, but `0` and `NaN` render as text and a plain object throws. Older tutorials call `ReactDOM.render` (removed in React 19) and scaffold with Create React App (sunset in February 2025); today it's `createRoot(el).render(<App />)` in a Vite app or a framework.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "react.dev: Writing Markup with JSX", url: "https://react.dev/learn/writing-markup-with-jsx", kind: "docs" },
        { label: "react.dev: Render and Commit", url: "https://react.dev/learn/render-and-commit", kind: "docs" },
        { label: "Overreacted: Why Do React Elements Have a $$typeof Property?", url: "https://overreacted.io/why-do-react-elements-have-typeof-property/", kind: "article" },
        { label: "Josh W. Comeau: Why React Re-Renders", url: "https://www.joshwcomeau.com/react/why-react-re-renders/", kind: "article" },
      ],
      video: {
        title: "React Fundamentals - Full Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=6Ied4aZxUzc",
        videoId: "6Ied4aZxUzc",
        durationLabel: "1:03:47",
        startSeconds: 165,
        chapterLabel: "2. React Elements (then 3. JSX)",
      },
      alternateVideos: [
        {
          title: "React 19 Tutorial - 6 - JSX",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=6sg98ju4O-w",
          videoId: "6sg98ju4O-w",
          durationLabel: "8:35",
        },
        {
          title: "Why React components re-render?",
          channel: "Developer Way",
          url: "https://www.youtube.com/watch?v=ARWX1XdghLk",
          videoId: "ARWX1XdghLk",
          durationLabel: "13:29",
        },
        {
          title: "React Compiler Deep Dive | Mofei Zhang & Sathya Gunasekaran",
          channel: "React Conf",
          url: "https://www.youtube.com/watch?v=uA_PVyZP7AI",
          videoId: "uA_PVyZP7AI",
          durationLabel: "31:08",
        },
        {
          title: "🚀🔥 React & Redux Complete Course (2024) with Projects | Notes | Free Certification",
          channel: "Complete Coding by Prashant Sir",
          url: "https://www.youtube.com/watch?v=eILUmCJhl64",
          videoId: "eILUmCJhl64",
          durationLabel: "19:53:36",
          startSeconds: 4081,
          chapterLabel: "Ch-10-16: Creating React Components, JSX (in Hindi)",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-jsx-rendering-q1",
          prompt: "With the automatic JSX runtime, what does this compile to?\n\n```jsx\n<Button color=\"red\">Hi</Button>\n```",
          options: [
            "`jsx(Button, { color: \"red\", children: \"Hi\" })`",
            "`jsx(\"Button\", { color: \"red\" }, \"Hi\")`",
            "`new Button({ color: \"red\", children: \"Hi\" })`",
            "`document.createElement(\"button\")` with a `color` attribute",
          ],
          correctIndex: 0,
          explanation:
            "A capitalised tag compiles to a reference to the component, and children travel inside the props object as `children`. A string type is only used for lowercase DOM tags, and nothing is instantiated or touched in the DOM at this point: the call just builds an element object.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-jsx-rendering-q2",
          prompt: "What happens when this renders?\n\n```jsx\nconst name = '<img src=x onerror=\"alert(1)\">';\nreturn <p>Hello {name}</p>;\n```",
          options: [
            "The markup appears as literal text and no script runs",
            "An `<img>` element is created and the alert fires",
            "React strips the tags and renders `Hello `",
            "React throws because strings can't contain `<`",
          ],
          correctIndex: 0,
          explanation:
            "React sets string children as text content, so they're escaped. Only `dangerouslySetInnerHTML` parses a string as HTML, which is why it's named to stand out in code review.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-jsx-rendering-q3",
          prompt: "Which of these render nothing at all when placed as `{value}` inside a `<div>`? (Select all that apply.)",
          options: ["`false`", "`null`", "`undefined`", "`true`", "`0`", "`NaN`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2, 3],
          explanation:
            "Booleans, `null` and `undefined` are holes in the tree. Numbers always render, including `0` and `NaN`, which is the root of the `count && <X />` bug.",
        },
        {
          id: "react-jsx-rendering-q4",
          prompt: "`user` is `{ name: \"Ann\", age: 30 }`. What happens when a component returns `<p>{user}</p>`?",
          options: [
            "React throws: objects are not valid as a React child",
            "It renders `[object Object]`",
            "It renders the JSON `{\"name\":\"Ann\",\"age\":30}`",
            "It renders nothing and logs a warning",
          ],
          correctIndex: 0,
          explanation:
            "React can render strings, numbers, elements, arrays of those, and holes. A plain object is none of them, so rendering fails; render `user.name`, or map the fields you want.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-jsx-rendering-q5",
          prompt:
            "`Parent` holds a `count` state and renders `<Child />`, which takes no props and isn't memoised. `count` changes. What does React do with `Child`?",
          options: [
            "Calls `Child` again, then updates only the DOM nodes whose output changed",
            "Skips `Child` because its props didn't change",
            "Unmounts and remounts `Child` so it picks up the new state",
            "Calls `Child` and replaces its entire DOM subtree",
          ],
          correctIndex: 0,
          explanation:
            "Re-rendering cascades to children by default; skipping needs `memo` (or React Compiler's automatic memoisation). The commit phase then applies only the differences, so an unchanged `Child` costs a function call but no DOM writes.",
        },
        {
          id: "react-jsx-rendering-q6",
          prompt:
            "What do the three cups show in development under `<StrictMode>`?\n\n```jsx\nlet guest = 0;\n\nfunction Cup() {\n  guest = guest + 1;\n  return <h2>Tea cup for guest #{guest}</h2>;\n}\n\nexport default function TeaSet() {\n  return (\n    <>\n      <Cup />\n      <Cup />\n      <Cup />\n    </>\n  );\n}\n```",
          options: ["#2, #4, #6", "#1, #2, #3", "#1, #1, #1", "#3, #3, #3"],
          correctIndex: 0,
          explanation:
            "Strict Mode calls each component function twice in development, and `Cup` mutates a module-level variable during render, so every cup increments twice before its output is used. Passing `guest` as a prop makes `Cup` pure, and then double rendering changes nothing.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-jsx-rendering-q7",
          prompt: "Which of these are valid on a DOM element in React 19 and behave as intended? (Select all that apply.)",
          options: [
            "`<label htmlFor=\"email\">`",
            "`<div style={{ marginTop: 8 }}>` (an 8px top margin)",
            "`<input readOnly value=\"x\" />`",
            "`<div style=\"color: red\">`",
            "`<button onclick={save}>`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "JSX uses camelCase DOM property names, and `style` takes an object in which unitless numbers become pixels for properties like `marginTop`. A style string is rejected, and lowercase `onclick` isn't an event prop React recognises, so the handler is never attached (React warns).",
        },
        {
          id: "react-jsx-rendering-q8",
          prompt:
            "What happens here?\n\n```jsx\nfunction card() {\n  return <div className=\"card\">Hi</div>;\n}\n\nexport default function App() {\n  return <card />;\n}\n```",
          options: [
            "React creates an unknown `<card>` DOM element instead of calling the function",
            "React calls `card` and renders the div",
            "The build fails because components must be exported",
            "React calls `card` but logs a naming warning",
          ],
          correctIndex: 0,
          explanation:
            "JSX decides by case: lowercase compiles to the string `\"card\"` (a DOM tag) and capitalised compiles to a variable reference. React warns that the tag is unrecognised and suggests an uppercase name; rename it `Card`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-jsx-rendering-q9",
          prompt:
            "You're upgrading a 2019 tutorial app to React 19. Its entry file calls `ReactDOM.render(<App />, document.getElementById(\"root\"))`. What's the correct replacement?",
          options: [
            "`createRoot(document.getElementById(\"root\")).render(<App />)`, imported from `react-dom/client`",
            "Keep `ReactDOM.render`; it still works with a deprecation warning",
            "`ReactDOM.hydrate(<App />, document.getElementById(\"root\"))`",
            "`new ReactRoot(<App />).mount(\"#root\")`",
          ],
          correctIndex: 0,
          explanation:
            "`ReactDOM.render` was deprecated in React 18 and removed in React 19. `hydrate` (now `hydrateRoot`) is only for attaching to server-rendered HTML, and `ReactRoot` doesn't exist.",
        },
        {
          id: "react-jsx-rendering-q10",
          prompt: "What does React Compiler assume about your components in order to memoise them safely?",
          options: [
            "That they follow the Rules of React: render is pure, and props, state and Hook values aren't mutated",
            "That every component is already wrapped in `memo`",
            "That components are class-based, so lifecycle methods can be cached",
            "Nothing: it memoises at runtime by comparing the rendered DOM",
          ],
          correctIndex: 0,
          explanation:
            "The compiler is a build-time tool that analyses data flow and inserts memoisation. Code that mutates during render breaks its assumptions, which is why it skips components it can't prove safe. It needs no `memo` wrappers and never inspects the DOM.",
        },
      ],
    },
    {
      id: "react-components-props",
      moduleId: "fe-react-fundamentals",
      trackId: "frontend",
      title: "Components & Props",
      summary:
        "A component is a function from props to UI, and props are its inputs: a read-only snapshot for one render. Every render receives a fresh props object, and a component never mutates it; sorting an array you were handed also sorts the parent's state, invisibly. If a child needs to change something, the parent owns that state and passes a callback such as `onChange`. `children` is just another prop, which is what makes wrappers and layouts composable.\n\nReact 19 cleaned up the API that older videos teach. `propTypes` are silently ignored and `defaultProps` no longer apply to function components: use TypeScript and default parameters, which only kick in for `undefined`, not `null`. `ref` is now an ordinary prop for function components, so new code doesn't need `forwardRef`. `key` is consumed by React and never reaches the component. Class components reading `this.props` still work, but new code is written as functions with Hooks.\n\nThe design tradeoff is explicitness versus plumbing. Passing data down several layers (prop drilling) is verbose but easy to trace, while context and composition trade some traceability for less wiring. Spreading `{...props}` onto a DOM element is convenient but hides the component's real API and forwards stray attributes.\n\nThe classic correctness and performance trap is defining a component inside another component. Each render creates a new function, so React sees a different component type at that position, unmounts the old subtree and mounts a new one: inputs lose focus and state resets on every keystroke. Declare components at module top level. And remember that props are captured per render: a timeout started in a handler sees the props of the render that created it.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "react.dev: Passing Props to a Component", url: "https://react.dev/learn/passing-props-to-a-component", kind: "docs" },
        { label: "React blog: React 19 Upgrade Guide", url: "https://react.dev/blog/2024/04/25/react-19-upgrade-guide", kind: "docs" },
        { label: "Overreacted: How Are Function Components Different from Classes?", url: "https://overreacted.io/how-are-function-components-different-from-classes/", kind: "article" },
        { label: "sudheerj: React interview questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "React Fundamentals - Full Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=6Ied4aZxUzc",
        videoId: "6Ied4aZxUzc",
        durationLabel: "1:03:47",
        startSeconds: 577,
        chapterLabel: "4. Components (then 5. Props)",
      },
      alternateVideos: [
        {
          title: "React 19 Tutorial - 8 - Props",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=JQBaytmgmGo",
          videoId: "JQBaytmgmGo",
          durationLabel: "9:35",
        },
        {
          title: "Learn React JS - Full Course for Beginners - Tutorial 2019",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=DLX62G4lc44",
          videoId: "DLX62G4lc44",
          durationLabel: "5:05:34",
          startSeconds: 4362,
          chapterLabel: "Props Part 1 - Understanding the Concept",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-components-props-q1",
          prompt: "What does `size` equal inside `Avatar`?\n\n```jsx\nfunction Avatar({ size = 100 }) {\n  /* ... */\n}\n\n<Avatar size={null} />\n```",
          options: ["`null`", "`100`", "`undefined`", "`0`"],
          correctIndex: 0,
          explanation:
            "Default parameters (and destructuring defaults) only apply when the value is `undefined`. `null` is an explicit value, so the default is skipped; omit the prop, or pass `undefined`, to get 100.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-components-props-q2",
          prompt: "What text does `Row` render?\n\n```jsx\nfunction Row({ key, label }) {\n  return <li>{key}: {label}</li>;\n}\n\n<Row key=\"a\" label=\"Apples\" />\n```",
          options: ["`: Apples`, because `key` is `undefined`", "`a: Apples`", "Nothing: React throws because `key` is reserved", "`[object Object]: Apples`"],
          correctIndex: 0,
          explanation:
            "React consumes `key` for reconciliation and never passes it to the component (it warns if you try to read it). If the component needs the value, pass it again under another name such as `id`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-components-props-q3",
          prompt: "Which statements are true in React 19? (Select all that apply.)",
          options: [
            "A function component can receive `ref` as a regular prop, without `forwardRef`",
            "`propTypes` on a component are silently ignored",
            "`defaultProps` no longer apply to function components; use default parameters",
            "Class components can no longer receive props",
            "`children` must be declared explicitly before a component can read it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "React 19 made `ref` a prop for function components and removed `propTypes` checks and function-component `defaultProps`. Class components still work (and keep `defaultProps`), and `children` is always available as a prop.",
        },
        {
          id: "react-components-props-q4",
          prompt:
            "Typing into this input loses focus after every keystroke. Why?\n\n```jsx\nfunction Form() {\n  const [text, setText] = useState(\"\");\n\n  function Field() {\n    return <input value={text} onChange={(e) => setText(e.target.value)} />;\n  }\n\n  return <Field />;\n}\n```",
          options: [
            "`Field` is a new function on every render, so React treats it as a different component type and remounts the input",
            "Controlled inputs always lose focus when their state changes",
            "`setText` is asynchronous, so the input re-renders before the value is stored",
            "The input needs a `key` so React can track its focus",
          ],
          correctIndex: 0,
          explanation:
            "Component identity is the function reference. A nested definition changes identity on every render, so the old `<input>` is destroyed and a new one mounted. Move `Field` to the top level and pass `text` and `setText` as props.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-components-props-q5",
          prompt:
            "The user clicks Follow while `name` is \"Ann\". Within 3 seconds the parent re-renders `ProfilePage` with `name=\"Bob\"`. What does the alert show?\n\n```jsx\nfunction ProfilePage({ name }) {\n  function handleClick() {\n    setTimeout(() => alert(\"Followed \" + name), 3000);\n  }\n  return <button onClick={handleClick}>Follow</button>;\n}\n```",
          options: ["`Followed Ann`", "`Followed Bob`", "`Followed undefined`", "It depends on whether React batched the update"],
          correctIndex: 0,
          explanation:
            "Each render's handler closes over that render's props, so the timeout sees `Ann`. A class component reading `this.props.name` inside the timeout would show `Bob`, because `this` is mutable; function components capture values instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-components-props-q6",
          prompt: "Which of these are fine inside a component's render body? (Select all that apply.)",
          options: [
            "Computing `const total = items.reduce((sum, i) => sum + i.price, 0)` from props",
            "Creating a new array and pushing into it before returning it",
            "Reading `props.user.name`",
            "Calling `props.items.sort()` to display the items in order",
            "Incrementing a module-level `renderCount` variable",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Mutating values created during this render is fine; mutating anything that existed before it isn't. `sort()` sorts the parent's array in place (use `toSorted()` or copy first), and module-level writes make the output depend on how many times React rendered.",
        },
        {
          id: "react-components-props-q7",
          prompt: "A page renders `<Pager pageSize=\"10\" />`, and `Pager` computes `const next = pageSize + 1;`. What is `next`?",
          options: ["`\"101\"`", "`11`", "`NaN`", "`11`, because React converts numeric-looking strings"],
          correctIndex: 0,
          explanation:
            "A quoted attribute is always a string, so `+` concatenates. Use braces for other types, `pageSize={10}`; a TypeScript prop type would have caught this at compile time.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-components-props-q8",
          prompt:
            "A `<QuantityPicker value={qty} />` must let the user change a quantity that its parent stores. What's the idiomatic design?",
          options: [
            "The parent keeps `qty` in state and also passes `onChange`; the picker calls `onChange(next)`",
            "The picker assigns `props.value = next` and forces a re-render",
            "The picker copies `value` into its own state and never tells the parent",
            "The picker writes the value to a module-level variable that the parent reads",
          ],
          correctIndex: 0,
          explanation:
            "Data flows down and changes flow up: whoever owns the state changes it. Copying the prop into local state creates two sources of truth that drift apart as soon as the parent changes `qty`.",
        },
        {
          id: "react-components-props-q9",
          prompt: "Inside `Card`, what is `children` here?\n\n```jsx\n<Card>\n  <h2>Title</h2>\n  <p>Body</p>\n</Card>\n```",
          options: [
            "An opaque value holding both elements (in practice an array of two elements) that `Card` renders with `{children}`",
            "A single fragment element that React creates automatically",
            "A string of HTML",
            "`undefined`, unless `Card` declares `children` in its props type",
          ],
          correctIndex: 0,
          explanation:
            "Several JSX children arrive together (currently as an array; a single child isn't wrapped). Treat the value as opaque: render it, or use the `Children` utilities, rather than indexing into it.",
        },
        {
          id: "react-components-props-q10",
          prompt: "A component is used as `<Profile />`, with no attributes at all. What does it receive as its props argument?",
          options: [
            "An empty object, `{}`, so `function Profile({ name })` destructures safely",
            "`undefined`, so destructuring in the signature throws",
            "`null`",
            "The props of its parent component",
          ],
          correctIndex: 0,
          explanation:
            "React always passes a props object, even when it's empty, which is why destructuring in the parameter list is safe. Missing props are `undefined`, which is exactly when default parameters apply.",
        },
      ],
    },
    {
      id: "react-usestate",
      moduleId: "fe-react-fundamentals",
      trackId: "frontend",
      title: "State with useState",
      summary:
        "State is a component's memory: values that must survive re-renders and whose change should update the screen. React stores it outside your function, attached to the component's position in the tree, and hands back the current value on each render. Calling a setter doesn't change the variable you're holding; it queues an update and schedules a render, so each render sees a fixed snapshot. That's why `console.log(count)` right after `setCount(count + 1)` prints the old value, and why three `setCount(count + 1)` calls in one handler add one: all three read the same snapshot. `setCount(c => c + 1)` queues a function that receives the pending value, so three of those add three.\n\nSince React 18, updates are batched automatically everywhere (event handlers, timeouts, promises, native listeners), so several setters produce one render. React bails out when the next value is `Object.is`-equal to the current one, which is why mutating an object and passing it back does nothing: replace objects and arrays (spread, `map`, `filter`, `toSorted`) or use Immer. Write `useState(createTodos)`, not `useState(createTodos())`, to run an expensive initialiser once; and because a setter treats a function argument as an updater, storing a function takes `setFn(() => fn)`. Strict Mode calls initialisers and updaters twice in development, so they must be pure.\n\nThe real skill is choosing minimal state. Store what the user changed and derive the rest during render (full names, filtered lists, counts). Don't copy props into state, which silently ignores later prop changes; reset a component with a `key` instead. Reach for `useReducer` when many transitions touch the same data. React Compiler memoises derived values for you but doesn't change any of these semantics.",
      level: "advanced",
      estMinutes: 70,
      isMilestone: true,
      webRefs: [
        { label: "react.dev: useState", url: "https://react.dev/reference/react/useState", kind: "docs" },
        { label: "react.dev: Queueing a Series of State Updates", url: "https://react.dev/learn/queueing-a-series-of-state-updates", kind: "docs" },
        { label: "react.dev: State as a Snapshot", url: "https://react.dev/learn/state-as-a-snapshot", kind: "article" },
        { label: "sudheerj: React interview questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "Learn useState In 15 Minutes - React Hooks Explained",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=O6P86uwfdR0",
        videoId: "O6P86uwfdR0",
        durationLabel: "15:45",
      },
      alternateVideos: [
        {
          title: "UseState: Asynchronous or what?",
          channel: "Jack Herrington",
          url: "https://www.youtube.com/watch?v=RAJD4KpX8LA",
          videoId: "RAJD4KpX8LA",
          durationLabel: "17:00",
        },
        {
          title: "React 19 Tutorial - 23 - How React Batches Updates",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=IXrMupqNlog",
          videoId: "IXrMupqNlog",
          durationLabel: "4:04",
        },
        {
          title: "🚀🔥 React & Redux Complete Course (2024) with Projects | Notes | Free Certification",
          channel: "Complete Coding by Prashant Sir",
          url: "https://www.youtube.com/watch?v=eILUmCJhl64",
          videoId: "eILUmCJhl64",
          durationLabel: "19:53:36",
          startSeconds: 20325,
          chapterLabel: "Ch-26-27: State Management, useState, State vs Props (in Hindi)",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-usestate-q1",
          prompt:
            "`count` is 0. What is it after one click?\n\n```jsx\nfunction handleClick() {\n  setCount(count + 1);\n  setCount(count + 1);\n  setCount(count + 1);\n}\n```",
          options: ["`1`", "`3`", "`0`", "It depends on whether the updates are batched"],
          correctIndex: 0,
          explanation:
            "All three calls read `count` from the same render's snapshot, so each asks for 0 + 1. Batching doesn't change the result: the queue simply holds \"replace with 1\" three times.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-usestate-q2",
          prompt:
            "`number` is 0. What is it after one click?\n\n```jsx\nfunction handleClick() {\n  setNumber(number + 5);\n  setNumber((n) => n + 1);\n  setNumber(42);\n  setNumber((n) => n * 2);\n}\n```",
          options: ["`84`", "`42`", "`12`", "`10`"],
          correctIndex: 0,
          explanation:
            "React processes the queue in order: replace with 5, then 5 + 1 = 6, then replace with 42, then 42 × 2 = 84. Plain values replace the pending state; updater functions transform whatever is pending.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-usestate-q3",
          prompt: "What does this log when `count` is 0?\n\n```jsx\nfunction handleClick() {\n  setCount(count + 1);\n  console.log(count);\n}\n```",
          options: ["`0`", "`1`", "`undefined`", "`0` in development and `1` in production"],
          correctIndex: 0,
          explanation:
            "The setter schedules the next render; it doesn't reassign the `count` constant this render closed over. If you need the new value right away, compute it into a variable first and use that.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-usestate-q4",
          prompt:
            "Clicking Rename doesn't update the screen. Why?\n\n```jsx\nconst [user, setUser] = useState({ name: \"Ann\" });\n\nfunction rename() {\n  user.name = \"Bob\";\n  setUser(user);\n}\n```",
          options: [
            "The next state is the same object (`Object.is`-equal), so React bails out of the render",
            "`setUser` is asynchronous and needs `await`",
            "Objects can't be stored in `useState`; use `useReducer`",
            "React only re-renders when a primitive state value changes",
          ],
          correctIndex: 0,
          explanation:
            "React compares by reference, so pass a new object: `setUser({ ...user, name: \"Bob\" })`. The mutation also leaks: the next unrelated render suddenly shows Bob, which is why mutation bugs look intermittent.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-usestate-q5",
          prompt:
            "What's the difference between these two lines?\n\n```jsx\nconst [todos, setTodos] = useState(createInitialTodos());\nconst [todos, setTodos] = useState(createInitialTodos);\n```",
          options: [
            "The first calls `createInitialTodos` on every render and ignores the result after the first; the second calls it only on the initial render",
            "They're identical; React only evaluates the initial value once",
            "The second stores the function itself as the state",
            "The first is only evaluated once in production builds",
          ],
          correctIndex: 0,
          explanation:
            "Arguments are evaluated before `useState` runs, so the first form pays the cost on every render. Passing the function makes it an initialiser that React calls once (twice in Strict Mode development).",
        },
        {
          id: "react-usestate-q6",
          prompt:
            "`customSave` is a function. What ends up in `onSave` after the second line runs?\n\n```jsx\nconst [onSave, setOnSave] = useState(() => defaultSave);\n// later, in a handler:\nsetOnSave(customSave);\n```",
          options: [
            "Whatever `customSave(previousOnSave)` returns, because React treats it as an updater",
            "`customSave` itself",
            "`defaultSave`, because functions in state can't be replaced",
            "Nothing: React throws because state can't hold functions",
          ],
          correctIndex: 0,
          explanation:
            "A function passed to a setter is always treated as an updater and called with the pending state. To store a function, wrap it: `setOnSave(() => customSave)`, exactly as the initialiser already does for `defaultSave`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-usestate-q7",
          prompt:
            "How many times does the component re-render when this timeout fires in React 19? Assume each value actually changes.\n\n```jsx\nsetTimeout(() => {\n  setA(1);\n  setB(2);\n  setC(3);\n}, 0);\n```",
          options: ["Once", "Three times", "Twice", "Zero: updates outside event handlers are ignored"],
          correctIndex: 0,
          explanation:
            "React 18 introduced automatic batching for updates in timeouts, promises and native handlers, not only React event handlers. Before that, each setter here caused its own render.",
        },
        {
          id: "react-usestate-q8",
          prompt: "Which of these correctly add `item` to an array held in state? (Select all that apply.)",
          options: [
            "`setItems((prev) => [...prev, item])`",
            "`setItems((prev) => prev.concat(item))`",
            "`setItems([...items, item])` (one update per event)",
            "`setItems((prev) => { prev.push(item); return prev; })`",
            "`items.push(item); setItems(items);`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Anything that produces a new array works. The last two return the same array reference, so React bails out, and they mutate a snapshot that the current render and any queued updaters still read.",
        },
        {
          id: "react-usestate-q9",
          prompt:
            "The parent later changes `initialColor` from \"blue\" to \"red\". What does `Message` show?\n\n```jsx\nfunction Message({ initialColor }) {\n  const [color, setColor] = useState(initialColor);\n  return <p style={{ color }}>Hello</p>;\n}\n```",
          options: [
            "Still blue: the argument to `useState` is ignored after the first render",
            "Red: `useState` re-reads its argument when it changes",
            "Red, but only after a second render",
            "Blue in production and red in development",
          ],
          correctIndex: 0,
          explanation:
            "`useState` only reads its argument on mount. Use the prop directly and drop the state, or, if a resettable local copy is really what you want, have the parent render `<Message key={initialColor} … />` to remount it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-usestate-q10",
          prompt: "Which of these should NOT be stored in state? (Select all that apply.)",
          options: [
            "`fullName`, when `firstName` and `lastName` are already in state",
            "`visibleTodos`, computed from `todos` and `filter`",
            "A copy of a prop that the component never changes locally",
            "The text currently typed into a search box",
            "Whether a dropdown is open",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Derived values should be computed during render so they can't fall out of sync; memoise only when it's measurably expensive, or let React Compiler do it. Typed text and UI toggles are real state because nothing else can reconstruct them.",
        },
        {
          id: "react-usestate-q11",
          prompt:
            "Typing the first character logs \"A component is changing an uncontrolled input to be controlled\". Why?\n\n```jsx\nconst [name, setName] = useState();\nreturn <input value={name} onChange={(e) => setName(e.target.value)} />;\n```",
          options: [
            "`name` starts as `undefined`, so the input began uncontrolled and became controlled once `name` held a string",
            "Text fields need `onInput` instead of `onChange`",
            "A controlled input needs both `defaultValue` and `value`",
            "A state setter can't be called from inside an event handler",
          ],
          correctIndex: 0,
          explanation:
            "React decides between controlled and uncontrolled by whether `value` is defined, and switching mid-life is ambiguous. Initialise with `useState(\"\")`, and write `value={x ?? \"\"}` when the source can be `null`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-usestate-q12",
          prompt:
            "`App` renders `<Counter />` twice, side by side, and `Counter` calls `useState(0)`. The user clicks the first counter's button. What happens?",
          options: [
            "Only the first counter increments: each instance's state belongs to its own position in the tree",
            "Both increment, because they share the same `useState` call in the source code",
            "Both increment, unless each `Counter` has a `key`",
            "React throws, because a component can't be rendered twice",
          ],
          correctIndex: 0,
          explanation:
            "Hooks are matched by call order within one component instance, and each instance lives at its own position. `key` matters for reordering and resetting, not for isolating siblings.",
        },
      ],
    },
    {
      id: "react-event-handling",
      moduleId: "fe-react-fundamentals",
      trackId: "frontend",
      title: "Event Handling in React",
      summary:
        "React event handlers are props that take functions: `onClick={handleClick}` passes the function, while `onClick={handleClick()}` calls it during render (and, if it sets state, loops until React throws \"Too many re-renders\"). To pass arguments, wrap it: `onClick={() => remove(id)}`. Handlers receive a SyntheticEvent, a cross-browser wrapper with the familiar `target`, `currentTarget`, `preventDefault()` and `stopPropagation()`, plus `nativeEvent` when you need the raw one. Unlike rendering, handlers are where side effects belong, and state updates inside them are batched into one render.\n\nReact doesn't attach a listener to every element. Since React 17 it registers one listener per event type on the root container you passed to `createRoot` and dispatches through its own component tree. Two consequences surprise people. Events bubble through the React tree, so a click inside a portal rendered into `document.body` still reaches an `onClick` on the portal's React parent. And some semantics differ from the DOM: `onChange` on a text input fires on every keystroke (it's the native `input` event), every event propagates except `onScroll`, capture-phase handlers are spelled `onClickCapture`, and returning `false` prevents nothing. Event pooling was removed in React 17, so reading `e.target` in a timeout works and the `e.persist()` that old tutorials call is a no-op.\n\nInline arrow functions allocate a new function on each render. That's almost never a problem: it only matters when the handler goes to a memoised child, and React Compiler memoises such callbacks for you. Name props `onSomething` and the functions behind them `handleSomething`. For logic inside an Effect that must read the latest props without re-subscribing, the tool is `useEffectEvent`, not an event handler.",
      level: "intermediate",
      estMinutes: 40,
      webRefs: [
        { label: "react.dev: Responding to Events", url: "https://react.dev/learn/responding-to-events", kind: "docs" },
        { label: "react.dev: Common components (React event object)", url: "https://react.dev/reference/react-dom/components/common", kind: "docs" },
        { label: "React blog: React v17.0 Release Candidate (event delegation changes)", url: "https://legacy.reactjs.org/blog/2020/08/10/react-v17-rc.html", kind: "article" },
        { label: "sudheerj: React interview questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "React 19 Tutorial - 15 - Event Handling",
        channel: "Codevolution",
        url: "https://www.youtube.com/watch?v=peewECGtPCI",
        videoId: "peewECGtPCI",
        durationLabel: "7:29",
      },
      alternateVideos: [
        {
          title: "Learn React JS - Full Course for Beginners - Tutorial 2019",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=DLX62G4lc44",
          videoId: "DLX62G4lc44",
          durationLabel: "5:05:34",
          startSeconds: 8525,
          chapterLabel: "Handling Events in React",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-event-handling-q1",
          prompt:
            "What happens when this component renders?\n\n```jsx\nfunction Counter() {\n  const [n, setN] = useState(0);\n  return <button onClick={setN(n + 1)}>{n}</button>;\n}\n```",
          options: [
            "`setN` runs during render, which schedules another render, and React throws \"Too many re-renders\"",
            "The counter increments once per click, as intended",
            "The button renders, but clicking it does nothing",
            "It increments once on mount and then works normally",
          ],
          correctIndex: 0,
          explanation:
            "The braces evaluate `setN(n + 1)` while rendering and pass its return value, `undefined`, as the handler. Setting state during render triggers another render, forever; wrap it: `onClick={() => setN(n + 1)}`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-event-handling-q2",
          prompt: "Which of these call `remove(item.id)` only when the button is clicked? (Select all that apply.)",
          options: [
            "`onClick={() => remove(item.id)}`",
            "`onClick={remove.bind(null, item.id)}`",
            "`onClick={function () { remove(item.id); }}`",
            "`onClick={remove(item.id)}`",
            "`onClick=\"remove(item.id)\"`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three all pass a function for React to call later. `remove(item.id)` in braces runs during render, and a string handler isn't supported: React expects a function and reports an error.",
        },
        {
          id: "react-event-handling-q3",
          prompt:
            "What's logged when the button is clicked?\n\n```jsx\n<div\n  onClickCapture={() => console.log(\"div capture\")}\n  onClick={() => console.log(\"div bubble\")}\n>\n  <button\n    onClick={(e) => {\n      e.stopPropagation();\n      console.log(\"button\");\n    }}\n  >\n    Go\n  </button>\n</div>\n```",
          options: ["`div capture`, then `button`", "`button` only", "`button`, then `div bubble`", "`div capture`, `button`, then `div bubble`"],
          correctIndex: 0,
          explanation:
            "Capture handlers run top-down before the target's handler, so `stopPropagation` in the button can't cancel them. It only stops the bubble phase, which would have reached `div bubble`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-event-handling-q4",
          prompt:
            "A form uses `<form onSubmit={handleSubmit}>` with `function handleSubmit() { save(); return false; }`. What happens on submit?",
          options: [
            "The browser still submits and reloads: React ignores the return value, so call `e.preventDefault()`",
            "The submission is cancelled, as with inline HTML handlers",
            "React throws because handlers must return `undefined`",
            "The submission is cancelled only in development",
          ],
          correctIndex: 0,
          explanation:
            "Returning `false` is an inline-HTML-attribute convention (`onsubmit=\"return false\"`). React handlers must call `e.preventDefault()`; with a React 19 form action (`<form action={fn}>`) you don't need it at all.",
        },
        {
          id: "react-event-handling-q5",
          prompt: "When does `onChange` fire on a React text `<input>`?",
          options: [
            "On every keystroke, like the native `input` event",
            "Only when the input loses focus, like the native `change` event",
            "Only when the user presses Enter",
            "On every keystroke in development and on blur in production",
          ],
          correctIndex: 0,
          explanation:
            "React's `onChange` for text fields maps to the DOM `input` event, which is what makes controlled inputs possible. The native `change` event on a text input fires when the value is committed (usually on blur), which is why vanilla-JS habits mislead here.",
        },
        {
          id: "react-event-handling-q6",
          prompt:
            "In React 19, what does this log one second after the user types \"a\" into an empty input (and nothing else)?\n\n```jsx\nfunction handleChange(e) {\n  setTimeout(() => console.log(e.target.value), 1000);\n}\n```",
          options: [
            "`a`: event pooling was removed in React 17, so the event object stays intact",
            "`null`, because synthetic events are pooled and cleared after the handler",
            "It throws unless you call `e.persist()` first",
            "`undefined`, because `target` is only set during the capture phase",
          ],
          correctIndex: 0,
          explanation:
            "React 16 reused event objects and nulled their fields after the handler, which is why old code calls `e.persist()`. React 17 removed pooling and left `persist()` as a no-op.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-event-handling-q7",
          prompt:
            "A modal is rendered with `createPortal(<Modal />, document.body)` from inside `<div onClick={closeMenu}>`. The user clicks a button inside the modal that doesn't stop propagation. Does `closeMenu` run?",
          options: [
            "Yes: React events propagate through the React tree, not the DOM tree",
            "No: the modal's DOM node isn't inside the div",
            "Only if the div uses `onClickCapture`",
            "Only in development builds",
          ],
          correctIndex: 0,
          explanation:
            "A portal changes where the DOM nodes live, not the element's place in React's tree, and React dispatches along the React tree. Stop propagation inside the portal if the parent shouldn't hear the click.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-event-handling-q8",
          prompt: "Since React 17, where does React DOM attach its event listeners?",
          options: [
            "On the root container passed to `createRoot`",
            "On `document`",
            "On each element that has an `onX` prop",
            "On `window`",
          ],
          correctIndex: 0,
          explanation:
            "React 16 delegated to `document`, which broke when several React versions or other libraries shared a page. Attaching at the root makes nested React apps and micro-frontends behave predictably.",
        },
        {
          id: "react-event-handling-q9",
          prompt:
            "A `<button onClick={handle}>` contains `<span>Save</span>`, and the user clicks the text. Inside `handle`, what are `e.target` and `e.currentTarget`?",
          options: [
            "`target` is the span; `currentTarget` is the button",
            "Both are the button",
            "`target` is the button; `currentTarget` is the span",
            "`target` is the span; `currentTarget` is the root container",
          ],
          correctIndex: 0,
          explanation:
            "`target` is where the event started; `currentTarget` is the element whose handler is running. React sets `currentTarget` to the element you put the prop on, even though its real listener lives on the root.",
        },
        {
          id: "react-event-handling-q10",
          prompt:
            "You put `onScroll` on an outer `<div>` to track scrolling of a scrollable list nested inside it. The inner list scrolls. Does the outer `onScroll` run?",
          options: [
            "No: `onScroll` is the one React event that doesn't propagate, so attach it to the element that scrolls",
            "Yes: all React events bubble",
            "Only if the inner list has `overflow: auto`",
            "Yes, but only once the scrolling stops",
          ],
          correctIndex: 0,
          explanation:
            "React 17 stopped emulating bubbling for `onScroll` to match the browser, where `scroll` doesn't bubble. Put the handler on the scrolling element itself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-event-handling-q11",
          prompt: "Is `onClick={() => setOpen(true)}` on a plain `<button>` a performance problem?",
          options: [
            "Not in practice: a new function per render only matters when it's passed to a memoised child, and React Compiler memoises it anyway",
            "Yes: React re-attaches a DOM listener on every render",
            "Yes: every inline arrow function forces the whole tree to re-render",
            "Only in Strict Mode, which calls the handler twice",
          ],
          correctIndex: 0,
          explanation:
            "React doesn't add or remove DOM listeners when a handler prop changes; it reads the current prop when the event is dispatched. The cost is one allocation, which only defeats memoisation for `memo` children receiving the function.",
        },
        {
          id: "react-event-handling-q12",
          prompt: "You render `<input value={query} />` and forget `onChange`. What happens when the user types?",
          options: [
            "The field doesn't change, and React warns that `value` without `onChange` renders a read-only field",
            "The field updates, but `query` stays stale",
            "React throws during render",
            "React quietly falls back to an uncontrolled input",
          ],
          correctIndex: 0,
          explanation:
            "A `value` prop means React owns the field and puts that value back after every keystroke. Add `onChange`, mark it `readOnly` on purpose, or use `defaultValue` if you only meant an initial value.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "react-conditional-rendering",
      moduleId: "fe-react-fundamentals",
      trackId: "frontend",
      title: "Conditional Rendering Patterns",
      summary:
        "Conditional rendering is plain JavaScript: an `if` with an early return, a ternary, `&&`, a lookup object, or `return null`. The choice is mostly about readability (early returns for loading and error states, ternaries for either/or, a lookup map once there are more than two branches). What matters is what React ends up seeing in the tree. `false`, `null`, `undefined` and `true` are empty holes, but numbers render, so `{items.length && <List />}` prints a literal `0` for an empty list. Make the left side a real boolean: `items.length > 0 &&`.\n\nThe deeper issue is state. React keeps a component's state while the same component type stays at the same position, and destroys it when the type or position changes. So `{isA ? <Counter person=\"A\" /> : <Counter person=\"B\" />}` keeps one counter's state across the switch (same type, same slot), while swapping a wrapping `<div>` for a `<section>` resets everything beneath it. To reset on purpose, give each branch its own `key` or render the branches in different positions; to keep state across a switch, keep the position stable.\n\nUnmounting and hiding are different tools. `{open && <Panel />}` destroys the panel's state and DOM when it closes; toggling CSS keeps both but still renders the hidden subtree. React 19.2's `<Activity mode=\"hidden\">` keeps state and DOM, hides the content with `display: none`, cleans up its Effects and renders its updates at lower priority, which suits tabs and back navigation. Finally, conditional rendering must never become conditional Hooks: an early return placed above a `useState` call changes the Hook order between renders, and React throws.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "react.dev: Conditional Rendering", url: "https://react.dev/learn/conditional-rendering", kind: "docs" },
        { label: "react.dev: Preserving and Resetting State", url: "https://react.dev/learn/preserving-and-resetting-state", kind: "docs" },
        { label: "react.dev: <Activity>", url: "https://react.dev/reference/react/Activity", kind: "docs" },
        { label: "Kent C. Dodds: Use ternaries rather than && in JSX", url: "https://kentcdodds.com/blog/use-ternaries-rather-than-and-and-in-jsx", kind: "article" },
      ],
      video: {
        title: "React Fundamentals - Full Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=6Ied4aZxUzc",
        videoId: "6Ied4aZxUzc",
        durationLabel: "1:03:47",
        startSeconds: 2403,
        chapterLabel: "13. Conditional Rendering",
      },
      alternateVideos: [
        {
          title: "React 19 Tutorial - 10 - Conditional Rendering",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=VwuwodgrIaU",
          videoId: "VwuwodgrIaU",
          durationLabel: "11:41",
        },
        {
          title: "Stop Conditional Rendering in React Without Knowing This (&& vs Ternary Operator)",
          channel: "ByteGrad",
          url: "https://www.youtube.com/watch?v=Rr5AqASIyxw",
          videoId: "Rr5AqASIyxw",
          durationLabel: "4:05",
        },
        {
          title: "🚀🔥 React & Redux Complete Course (2024) with Projects | Notes | Free Certification",
          channel: "Complete Coding by Prashant Sir",
          url: "https://www.youtube.com/watch?v=eILUmCJhl64",
          videoId: "eILUmCJhl64",
          durationLabel: "19:53:36",
          startSeconds: 11004,
          chapterLabel: "Ch-18-22: Fragments, Lists, Conditional Rendering, Props (in Hindi)",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-conditional-rendering-q1",
          prompt: "What does this render when `messages` is an empty array?\n\n```jsx\n<div>{messages.length && <Badge count={messages.length} />}</div>\n```",
          options: ["`<div>0</div>`", "`<div></div>`", "`<div>false</div>`", "Nothing: it throws because `0` isn't a valid child"],
          correctIndex: 0,
          explanation:
            "`&&` returns its left operand when that operand is falsy, so the expression evaluates to `0`, and React renders numbers. Use `messages.length > 0 && …` or a ternary.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-conditional-rendering-q2",
          prompt: "Which of these render nothing when `count` is `0` and `<Badge />` otherwise? (Select all that apply.)",
          options: [
            "`{count > 0 && <Badge />}`",
            "`{!!count && <Badge />}`",
            "`{count ? <Badge /> : null}`",
            "`{count && <Badge />}`",
            "`{count || <Badge />}`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The first three turn `count` into a real boolean before choosing. `count && …` renders `0`, and `count || <Badge />` renders the badge exactly when `count` is 0 (and the number otherwise).",
        },
        {
          id: "react-conditional-rendering-q3",
          prompt:
            "`Counter` keeps a `score` in `useState`. The user scores 3 for Taylor, then clicks \"Next player\". What does Sarah's counter show?\n\n```jsx\n{isPlayerA ? (\n  <Counter person=\"Taylor\" />\n) : (\n  <Counter person=\"Sarah\" />\n)}\n```",
          options: ["`3`", "`0`", "`0`, then `3` after the next render", "Whatever Sarah's score was last time"],
          correctIndex: 0,
          explanation:
            "Both branches put a `Counter` in the same slot, so React sees the same component at the same position and keeps its state; only the `person` prop changes. State belongs to the position in the tree, not to the JSX you wrote.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-conditional-rendering-q4",
          prompt: "In the previous example, which changes make each player's counter start from 0 when switching? (Select all that apply.)",
          options: [
            "Add `key=\"Taylor\"` and `key=\"Sarah\"` to the two `Counter` elements",
            "Render them in separate slots: `{isPlayerA && <Counter person=\"Taylor\" />}{!isPlayerA && <Counter person=\"Sarah\" />}`",
            "Wrap `Counter` in `memo`",
            "Add `useEffect(() => setScore(0), [])` inside `Counter`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "A different key tells React these are different components, so it unmounts one and mounts the other; separate slots achieve the same through position. `memo` only skips renders, and an Effect with `[]` runs once on mount, which never happens here.",
        },
        {
          id: "react-conditional-rendering-q5",
          prompt:
            "A settings panel holds a half-typed draft in local state. The user closes and reopens it. Which approaches keep the draft? (Select all that apply.)",
          options: [
            "Hiding it with CSS (`display: none` or the `hidden` attribute) instead of unmounting it",
            "`<Activity mode={open ? \"visible\" : \"hidden\"}><Panel /></Activity>`",
            "Lifting the draft into a parent that stays mounted",
            "`{open && <Panel />}`",
            "`{open ? <Panel /> : null}`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`&&` and the ternary both unmount `Panel`, destroying its state. Keeping it mounted (CSS or `<Activity>`) or moving the state above the boundary preserves the draft; `<Activity>` also cleans up the hidden panel's Effects.",
        },
        {
          id: "react-conditional-rendering-q6",
          prompt: "What does `<Activity mode=\"hidden\">` do to its children?",
          options: [
            "Hides them with `display: none`, keeps their state, destroys their Effects, and renders their updates at lower priority",
            "Unmounts them but caches their last HTML for an instant restore",
            "Keeps them visible but pauses all of their re-renders",
            "Removes them from the DOM and saves their state to `sessionStorage`",
          ],
          correctIndex: 0,
          explanation:
            "That's the documented contract: state and DOM survive, Effects are cleaned up (and set up again when shown), and hidden content keeps rendering at low priority, which also makes it useful for pre-rendering.",
        },
        {
          id: "react-conditional-rendering-q7",
          prompt:
            "`user` starts as `null` and loads a moment later. What happens when it arrives?\n\n```jsx\nfunction Profile({ user }) {\n  if (!user) return <Spinner />;\n  const [tab, setTab] = useState(\"posts\");\n  return <Tabs value={tab} onChange={setTab} />;\n}\n```",
          options: [
            "React throws because more Hooks ran than during the previous render",
            "It works: Hooks may be called after an early return",
            "The `useState` call is skipped until the next render",
            "`tab` starts as `undefined` and later becomes \"posts\"",
          ],
          correctIndex: 0,
          explanation:
            "Hooks are matched by call order, so they must run unconditionally at the top level. Move `useState` above the early return, or move the loaded view into its own component.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-conditional-rendering-q8",
          prompt:
            "`Counter` holds state. What happens to it when `isFancy` toggles?\n\n```jsx\nreturn isFancy ? (\n  <div className=\"fancy\">\n    <Counter />\n  </div>\n) : (\n  <section>\n    <Counter />\n  </section>\n);\n```",
          options: [
            "It resets: the parent element's type changed, so React rebuilds the whole subtree",
            "It's kept: `Counter` is at the same position inside its parent",
            "It's kept, because only the wrapper's `className` differs",
            "It resets only in Strict Mode",
          ],
          correctIndex: 0,
          explanation:
            "React compares types from the top down; when a `div` becomes a `section`, everything under it is unmounted and remounted. Keep the wrapper type stable and vary its `className` if the state should survive.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-conditional-rendering-q9",
          prompt:
            "An `EditContact` form copies its `contact` prop into local draft state. When the user selects a different contact, the old draft stays on screen. What's the cleanest fix?",
          options: [
            "Render `<EditContact key={contact.id} contact={contact} />` so React remounts it for each contact",
            "Add `useEffect(() => setDraft(contact), [contact])`",
            "Store the draft in a module-level variable",
            "Wrap `EditContact` in `memo`",
          ],
          correctIndex: 0,
          explanation:
            "A new key produces a fresh component with fresh state in the same render. The Effect version works, but it first renders once with the stale draft and then again, and its dependency list is easy to get wrong.",
        },
        {
          id: "react-conditional-rendering-q10",
          prompt: "A component ends with a bare `return;` in one branch. In React 19, what happens when that branch runs?",
          options: [
            "It renders nothing, like `return null`",
            "React throws: nothing was returned from render",
            "React renders the previous output again",
            "It renders the text `undefined`",
          ],
          correctIndex: 0,
          explanation:
            "Since React 18, components may return `undefined`; earlier versions threw to catch a forgotten `return`. Lint rules now catch that mistake instead.",
        },
      ],
    },
    {
      id: "react-lists-keys",
      moduleId: "fe-react-fundamentals",
      trackId: "frontend",
      title: "Lists & Keys",
      summary:
        "Rendering a list is just `items.map((item) => <Row key={item.id} … />)`; the interesting part is the `key`. When a list re-renders, React matches old children to new ones by key (and type), reusing a matched component's state and DOM, creating unmatched new ones and destroying unmatched old ones. Keys must be unique among siblings and stable across renders, and they're compared as strings (`'' + key`), so `1` and `\"1\"` collide. Take them from your data (a database id, or an id generated once with `crypto.randomUUID()` when the item is created), never from `Math.random()` during render, which remounts every row on every render.\n\nIndex keys are what React falls back to when you omit keys, and they're only safe for lists that never reorder or change in the middle. Prepend an item with index keys and React sees every row's props change, while each row's state (a typed draft, an open menu, focus, an uncontrolled input's value) stays with its index, so drafts appear next to the wrong items. That's a correctness bug, not just a performance one.\n\nReact's matching is a fast heuristic, not a minimal diff. It walks the new list tracking `lastPlacedIndex`, the highest old index it has kept in place so far; a matched child whose old index is lower gets moved, otherwise it stays. Moving the last item to the front therefore moves every other row, while moving the first item to the end moves one. Keys also work outside lists: changing a component's `key` is the idiomatic way to reset its state, and `<Fragment key>` keys a group of siblings. In this challenge you implement that matching, including what happens to row state under index keys.",
      level: "advanced",
      estMinutes: 80,
      isMilestone: true,
      webRefs: [
        { label: "react.dev: Rendering Lists", url: "https://react.dev/learn/rendering-lists", kind: "docs" },
        { label: "Developer Way: React key attribute: best practices for performant lists", url: "https://www.developerway.com/posts/react-key-attribute", kind: "article" },
        { label: "React source: ReactChildFiber.js (reconcileChildrenArray, placeChild)", url: "https://github.com/react/react/blob/main/packages/react-reconciler/src/ReactChildFiber.js", kind: "repo" },
        { label: "sudheerj: React interview questions", url: "https://github.com/sudheerj/reactjs-interview-questions", kind: "interview-prep" },
      ],
      video: {
        title: "The mystery of React key: how to write performant lists",
        channel: "Developer Way",
        url: "https://www.youtube.com/watch?v=76OedwmXlYY",
        videoId: "76OedwmXlYY",
        durationLabel: "13:21",
      },
      alternateVideos: [
        {
          title: "React Fundamentals - Full Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=6Ied4aZxUzc",
          videoId: "6Ied4aZxUzc",
          durationLabel: "1:03:47",
          startSeconds: 1782,
          chapterLabel: "10. Lists and Keys",
        },
        {
          title: "React 19 Tutorial - 13 - Index as Key Anti-Pattern",
          channel: "Codevolution",
          url: "https://www.youtube.com/watch?v=919gHAelBfw",
          videoId: "919gHAelBfw",
          durationLabel: "8:24",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `reconcileList(oldItems, newItems, keyMode)`, a model of how React matches a re-rendered list to the previous one.\n\nEach item is `{ id, label }`. Old items may also carry `draft`: the local state its row component was holding, such as text typed into an uncontrolled input. `keyMode` decides the keys: `\"id\"` uses `String(item.id)` and `\"index\"` uses `String(position)`. React compares keys as strings, so `1` and `\"1\"` are the same key.\n\nReturn `{ inserted, removed, moved, kept, rows }`:\n\n- `inserted`: keys in the new list with no match in the old one, in new-list order.\n- `removed`: old keys with no match in the new list, in old-list order.\n- `moved` and `kept`: the matched keys, in new-list order, split the way React's `placeChild` does it. Walk the new list with `lastPlacedIndex = 0`. A matched key whose old index is less than `lastPlacedIndex` is moved; otherwise it's kept and `lastPlacedIndex` becomes its old index. Inserted items don't change `lastPlacedIndex`.\n- `rows`: one `{ label, draft }` per new item, in order. `label` comes from the new item (props update); `draft` comes from the matched old item (state is preserved by key), or is `\"\"` for an inserted row. An old item without `draft` counts as `\"\"`.\n\nErrors: validate the old list first, then the new list, item by item, and throw an `Error` with exactly this message:\n\n- in `\"id\"` mode, an item whose `id` is `null` or `undefined`: `Missing key at index <i>`\n- a key already seen earlier in the same list: `Duplicate key: <key>`\n\nThe tests call `runReconcile`, which reports a thrown error as `{ error: message }`. Leave the driver as it is.",
        starterCode: `/**
 * @param {{ id?: string | number, label: string, draft?: string }[]} oldItems
 * @param {{ id?: string | number, label: string }[]} newItems
 * @param {"id" | "index"} keyMode
 * @returns {{ inserted: string[], removed: string[], moved: string[], kept: string[], rows: { label: string, draft: string }[] }}
 */
function reconcileList(oldItems, newItems, keyMode) {
  // Your code here
}

// ---- Test driver (leave as is) ----
function runReconcile(oldItems, newItems, keyMode) {
  try {
    return reconcileList(oldItems, newItems, keyMode);
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
}
`,
        functionName: "runReconcile",
        testCases: [
          {
            description: "an unchanged list keeps every row and its state",
            args: [
              [{ id: "a", label: "Apple", draft: "ripe" }, { id: "b", label: "Banana" }, { id: "c", label: "Cherry", draft: "sour" }],
              [{ id: "a", label: "Apple" }, { id: "b", label: "Banana" }, { id: "c", label: "Cherry" }],
              "id",
            ],
            expected: {
              inserted: [],
              removed: [],
              moved: [],
              kept: ["a", "b", "c"],
              rows: [{ label: "Apple", draft: "ripe" }, { label: "Banana", draft: "" }, { label: "Cherry", draft: "sour" }],
            },
          },
          {
            description: "prepending with id keys: one insertion, and each draft stays with its item",
            args: [
              [{ id: "a", label: "Apple", draft: "ripe" }, { id: "b", label: "Banana", draft: "soft" }],
              [{ id: "z", label: "Zucchini" }, { id: "a", label: "Apple" }, { id: "b", label: "Banana" }],
              "id",
            ],
            expected: {
              inserted: ["z"],
              removed: [],
              moved: [],
              kept: ["a", "b"],
              rows: [{ label: "Zucchini", draft: "" }, { label: "Apple", draft: "ripe" }, { label: "Banana", draft: "soft" }],
            },
          },
          {
            description: "prepending with index keys: drafts shift onto the wrong items",
            args: [
              [{ id: "a", label: "Apple", draft: "ripe" }, { id: "b", label: "Banana", draft: "soft" }],
              [{ id: "z", label: "Zucchini" }, { id: "a", label: "Apple" }, { id: "b", label: "Banana" }],
              "index",
            ],
            expected: {
              inserted: ["2"],
              removed: [],
              moved: [],
              kept: ["0", "1"],
              rows: [{ label: "Zucchini", draft: "ripe" }, { label: "Apple", draft: "soft" }, { label: "Banana", draft: "" }],
            },
          },
          {
            description: "deleting from the middle with id keys removes exactly that row",
            args: [
              [{ id: "a", label: "Apple", draft: "ripe" }, { id: "b", label: "Banana", draft: "soft" }, { id: "c", label: "Cherry", draft: "sour" }],
              [{ id: "a", label: "Apple" }, { id: "c", label: "Cherry" }],
              "id",
            ],
            expected: {
              inserted: [],
              removed: ["b"],
              moved: [],
              kept: ["a", "c"],
              rows: [{ label: "Apple", draft: "ripe" }, { label: "Cherry", draft: "sour" }],
            },
          },
          {
            description: "deleting from the middle with index keys removes the last key and misplaces state",
            args: [
              [{ id: "a", label: "Apple", draft: "ripe" }, { id: "b", label: "Banana", draft: "soft" }, { id: "c", label: "Cherry", draft: "sour" }],
              [{ id: "a", label: "Apple" }, { id: "c", label: "Cherry" }],
              "index",
            ],
            expected: {
              inserted: [],
              removed: ["2"],
              moved: [],
              kept: ["0", "1"],
              rows: [{ label: "Apple", draft: "ripe" }, { label: "Cherry", draft: "soft" }],
            },
          },
          {
            description: "moving the last item to the front moves every other row",
            args: [
              [
                { id: "a", label: "Apple", draft: "1" },
                { id: "b", label: "Banana", draft: "2" },
                { id: "c", label: "Cherry", draft: "3" },
                { id: "d", label: "Date", draft: "4" },
              ],
              [{ id: "d", label: "Date" }, { id: "a", label: "Apple" }, { id: "b", label: "Banana" }, { id: "c", label: "Cherry" }],
              "id",
            ],
            expected: {
              inserted: [],
              removed: [],
              moved: ["a", "b", "c"],
              kept: ["d"],
              rows: [
                { label: "Date", draft: "4" },
                { label: "Apple", draft: "1" },
                { label: "Banana", draft: "2" },
                { label: "Cherry", draft: "3" },
              ],
            },
          },
          {
            description: "moving the first item to the end moves only that item",
            args: [
              [
                { id: "a", label: "Apple", draft: "1" },
                { id: "b", label: "Banana", draft: "2" },
                { id: "c", label: "Cherry", draft: "3" },
                { id: "d", label: "Date", draft: "4" },
              ],
              [{ id: "b", label: "Banana" }, { id: "c", label: "Cherry" }, { id: "d", label: "Date" }, { id: "a", label: "Apple" }],
              "id",
            ],
            expected: {
              inserted: [],
              removed: [],
              moved: ["a"],
              kept: ["b", "c", "d"],
              rows: [
                { label: "Banana", draft: "2" },
                { label: "Cherry", draft: "3" },
                { label: "Date", draft: "4" },
                { label: "Apple", draft: "1" },
              ],
            },
          },
          {
            description: "reversing a list keeps only the first new row in place",
            args: [
              [
                { id: "a", label: "Apple", draft: "1" },
                { id: "b", label: "Banana", draft: "2" },
                { id: "c", label: "Cherry", draft: "3" },
                { id: "d", label: "Date", draft: "4" },
              ],
              [{ id: "d", label: "Date" }, { id: "c", label: "Cherry" }, { id: "b", label: "Banana" }, { id: "a", label: "Apple" }],
              "id",
            ],
            expected: {
              inserted: [],
              removed: [],
              moved: ["c", "b", "a"],
              kept: ["d"],
              rows: [
                { label: "Date", draft: "4" },
                { label: "Cherry", draft: "3" },
                { label: "Banana", draft: "2" },
                { label: "Apple", draft: "1" },
              ],
            },
          },
          {
            description: "insert, delete, move and relabel in one update",
            args: [
              [
                { id: "a", label: "Apple", draft: "1" },
                { id: "b", label: "Banana", draft: "2" },
                { id: "c", label: "Cherry", draft: "3" },
                { id: "d", label: "Date", draft: "4" },
              ],
              [{ id: "c", label: "Cherry (sale)" }, { id: "x", label: "Xigua" }, { id: "a", label: "Apple" }, { id: "d", label: "Date" }],
              "id",
            ],
            expected: {
              inserted: ["x"],
              removed: ["b"],
              moved: ["a"],
              kept: ["c", "d"],
              rows: [
                { label: "Cherry (sale)", draft: "3" },
                { label: "Xigua", draft: "" },
                { label: "Apple", draft: "1" },
                { label: "Date", draft: "4" },
              ],
            },
          },
          {
            description: "an empty previous list: everything is inserted",
            args: [[], [{ id: "a", label: "Apple" }, { id: "b", label: "Banana" }], "id"],
            expected: {
              inserted: ["a", "b"],
              removed: [],
              moved: [],
              kept: [],
              rows: [{ label: "Apple", draft: "" }, { label: "Banana", draft: "" }],
            },
            isEdgeCase: true,
          },
          {
            description: "an empty new list: everything is removed",
            args: [[{ id: "a", label: "Apple", draft: "ripe" }, { id: "b", label: "Banana", draft: "soft" }], [], "id"],
            expected: { inserted: [], removed: ["a", "b"], moved: [], kept: [], rows: [] },
            isEdgeCase: true,
          },
          {
            description: "keys are compared as strings, so the number 1 matches the string \"1\"",
            args: [
              [{ id: 1, label: "One", draft: "x" }, { id: 2, label: "Two", draft: "y" }],
              [{ id: "2", label: "Two" }, { id: 1, label: "One" }],
              "id",
            ],
            expected: {
              inserted: [],
              removed: [],
              moved: ["1"],
              kept: ["2"],
              rows: [{ label: "Two", draft: "y" }, { label: "One", draft: "x" }],
            },
            isEdgeCase: true,
          },
          {
            description: "1 and \"1\" in the same list are duplicate keys",
            args: [[], [{ id: 1, label: "One" }, { id: "1", label: "Uno" }], "id"],
            expected: { error: "Duplicate key: 1" },
            isEdgeCase: true,
          },
          {
            description: "a missing id is an error in id mode",
            args: [[{ id: "a", label: "Apple" }], [{ id: "a", label: "Apple" }, { label: "Mystery" }], "id"],
            expected: { error: "Missing key at index 1" },
            isEdgeCase: true,
          },
          {
            description: "the old list is validated before the new one",
            args: [[{ id: "a", label: "Apple" }, { id: "a", label: "Apricot" }], [{ label: "Mystery" }], "id"],
            expected: { error: "Duplicate key: a" },
            isEdgeCase: true,
          },
          {
            description: "index mode needs no ids, and state follows the position",
            args: [[{ label: "A", draft: "typed" }], [{ label: "B" }, { label: "A" }], "index"],
            expected: {
              inserted: ["1"],
              removed: [],
              moved: [],
              kept: ["0"],
              rows: [{ label: "B", draft: "typed" }, { label: "A", draft: "" }],
            },
            isEdgeCase: true,
          },
          {
            description: "rotating 1,000 rows by one position moves 999 of them",
            args: [
              Array.from({ length: 1000 }, (_, i) => ({ id: i, label: `Row ${i}`, draft: `d${i}` })),
              [{ id: 999, label: "Row 999" }, ...Array.from({ length: 999 }, (_, i) => ({ id: i, label: `Row ${i}` }))],
              "id",
            ],
            expected: {
              inserted: [],
              removed: [],
              moved: Array.from({ length: 999 }, (_, i) => String(i)),
              kept: ["999"],
              rows: [
                { label: "Row 999", draft: "d999" },
                ...Array.from({ length: 999 }, (_, i) => ({ label: `Row ${i}`, draft: `d${i}` })),
              ],
            },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "react-controlled-forms",
      moduleId: "fe-react-fundamentals",
      trackId: "frontend",
      title: "Controlled vs Uncontrolled Forms",
      summary:
        "A controlled input takes its `value` (or `checked`) from React state and reports every change through `onChange`, so the state is the single source of truth: you can validate on each keystroke, format, disable submit, or drive several fields from one value. An uncontrolled input keeps its value in the DOM; you give it a starting point with `defaultValue` and read it when needed, via `FormData` on submit or a ref. Controlled costs a render per keystroke, which is usually fine but adds up on very large forms, and it obliges you to store exactly what the user typed (keep `\"1.\"` while they're mid-number, trim only when validating) or the caret jumps.\n\nReact 19 moved the default back toward the platform. `<form action={fn}>` calls `fn(formData)` inside a Transition without `preventDefault`, `useActionState` tracks the action's result and pending state, `useFormStatus` lets a submit button read it, and after a successful action React resets the form's uncontrolled fields. Libraries such as React Hook Form lean on uncontrolled inputs for speed; controlled state remains the right fit when the UI reacts to every change.\n\nThe gotchas are consistent. `value` without `onChange` gives a read-only field and a warning. Switching `value` between `undefined` and a string triggers \"changing an uncontrolled input to be controlled\" (initialise with `\"\"`). Every DOM value is a string, even from `type=\"number\"`, and file inputs are always uncontrolled. Store raw values, derive errors from them instead of storing errors that go stale (a confirm-password error must react to later password edits), and show an error only once its field has been touched or a submit was attempted. This challenge builds that state machine as a reducer.",
      level: "advanced",
      estMinutes: 95,
      webRefs: [
        { label: "react.dev: <input>", url: "https://react.dev/reference/react-dom/components/input", kind: "docs" },
        { label: "react.dev: <form>", url: "https://react.dev/reference/react-dom/components/form", kind: "docs" },
        { label: "react.dev: useActionState", url: "https://react.dev/reference/react/useActionState", kind: "docs" },
        { label: "Josh W. Comeau: Data Binding in React", url: "https://www.joshwcomeau.com/react/data-binding/", kind: "article" },
      ],
      video: {
        title: "React JS Forms | Controlled Inputs | Learn ReactJS",
        channel: "Dave Gray",
        url: "https://www.youtube.com/watch?v=r5ombQn3fHY",
        videoId: "r5ombQn3fHY",
        durationLabel: "37:31",
      },
      alternateVideos: [
        {
          title: "What’s New in React 19: Exploring Actions, use(), Compiler, and more",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=81uAxzeyL2I",
          videoId: "81uAxzeyL2I",
          durationLabel: "1:07:57",
          startSeconds: 785,
          chapterLabel: "Form action",
        },
        {
          title: "Learn useActionState In 8 Minutes - React Hooks Simplified",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=-aBKrvK5Vn8",
          videoId: "-aBKrvK5Vn8",
          durationLabel: "8:44",
        },
        {
          title: "🚀🔥 React & Redux Complete Course (2024) with Projects | Notes | Free Certification",
          channel: "Complete Coding by Prashant Sir",
          url: "https://www.youtube.com/watch?v=eILUmCJhl64",
          videoId: "eILUmCJhl64",
          durationLabel: "19:53:36",
          startSeconds: 26630,
          chapterLabel: "Ch-28-34: Forms in React, useRef, Functional updates (in Hindi)",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "A signup form keeps every field controlled. Implement its logic as three pure functions:\n\n- `validate(values)` returns an object with a message for each invalid field and no key for valid ones.\n- `formReducer(state, action)` returns the next state.\n- `selectVisibleErrors(state)` returns the errors the UI should show right now.\n\nState is `{ values, touched, serverErrors, submitCount, status }`, built by `createInitialState()` in the starter. The fields are `email`, `password`, `confirm` and `age`, and every value is a string.\n\nValidation rules for `validate`:\n\n- `email`: after trimming, empty gives `\"Required\"`; otherwise it must match `/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/` or gives `\"Invalid email\"`.\n- `password`: never trimmed (spaces are valid characters). Empty gives `\"Required\"`; fewer than 8 characters gives `\"At least 8 characters\"`.\n- `confirm`: if it differs from `password`, `\"Passwords do not match\"`.\n- `age`: optional. After trimming, empty is valid; otherwise it must be digits only (`\"Whole number only\"`) and between 13 and 120 inclusive (`\"Must be between 13 and 120\"`).\n\nActions for `formReducer`. Never mutate `state` (the driver freezes it), and return the same `state` object when nothing changes so React can bail out:\n\n- `{ type: \"change\", field, value }`: store `String(value)` untrimmed and remove that field's server error; a `\"submitted\"` status becomes `\"editing\"`. Ignored for unknown fields, while `\"submitting\"`, or when the stored value is already equal.\n- `{ type: \"blur\", field }`: mark the field touched. Ignored for unknown fields, while `\"submitting\"`, or if it's already touched.\n- `{ type: \"submit\" }`: ignored while `\"submitting\"`. Otherwise increment `submitCount`, mark every field touched, clear `serverErrors`, and set the status to `\"submitting\"` if `validate` finds no errors, or `\"editing\"` if it does.\n- `{ type: \"submitSuccess\" }`: only while `\"submitting\"`. Return a fresh initial state with status `\"submitted\"` (React 19 resets a form after a successful action, too).\n- `{ type: \"submitFailure\", errors }`: only while `\"submitting\"`. The status becomes `\"editing\"` and `serverErrors` becomes a copy of `errors`, for example `{ email: \"Email already registered\" }`.\n- Any other action returns `state` unchanged.\n\n`selectVisibleErrors(state)`: for each touched field, in field order, its client error from `validate` or, if there's none, its server error. Omit fields with nothing to show. Derive this on every call; errors are never stored.\n\nThe tests call `runForm(actions)`, which starts from `createInitialState()`, applies the actions and returns the final `values`, `status`, `submitCount`, visible `errors`, and `renders` (how many actions produced a new state object). Leave the driver as it is.",
        starterCode: `const FIELDS = ["email", "password", "confirm", "age"];

function createInitialState() {
  return {
    values: { email: "", password: "", confirm: "", age: "" },
    touched: { email: false, password: false, confirm: false, age: false },
    serverErrors: {},
    submitCount: 0,
    status: "editing", // "editing" | "submitting" | "submitted"
  };
}

/**
 * @param {{ email: string, password: string, confirm: string, age: string }} values
 * @returns {Record<string, string>} a message for each invalid field only
 */
function validate(values) {
  // Your code here
  return {};
}

function formReducer(state, action) {
  // Your code here
  return state;
}

function selectVisibleErrors(state) {
  // Your code here
  return {};
}

// ---- Test driver (leave as is) ----
function runForm(actions) {
  let state = deepFreeze(createInitialState());
  let renders = 0;
  for (const action of actions) {
    const next = formReducer(state, action);
    if (next !== state) renders++;
    state = deepFreeze(next);
  }
  return {
    values: state.values,
    status: state.status,
    submitCount: state.submitCount,
    errors: selectVisibleErrors(state),
    renders,
  };
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
`,
        functionName: "runForm",
        testCases: [
          {
            description: "typing without blurring shows no errors yet",
            args: [[{ type: "change", field: "email", value: "ann" }]],
            expected: {
              values: { email: "ann", password: "", confirm: "", age: "" },
              status: "editing",
              submitCount: 0,
              errors: {},
              renders: 1,
            },
          },
          {
            description: "blurring an invalid email reveals its error",
            args: [
              [
                { type: "change", field: "email", value: "ann" },
                { type: "blur", field: "email" },
              ],
            ],
            expected: {
              values: { email: "ann", password: "", confirm: "", age: "" },
              status: "editing",
              submitCount: 0,
              errors: { email: "Invalid email" },
              renders: 2,
            },
          },
          {
            description: "submitting an empty form touches every field",
            args: [[{ type: "submit" }]],
            expected: {
              values: { email: "", password: "", confirm: "", age: "" },
              status: "editing",
              submitCount: 1,
              errors: { email: "Required", password: "Required" },
              renders: 1,
            },
          },
          {
            description: "the confirm error is derived, so it follows a later password edit",
            args: [
              [
                { type: "change", field: "password", value: "hunter22" },
                { type: "change", field: "confirm", value: "hunter22" },
                { type: "blur", field: "confirm" },
                { type: "change", field: "password", value: "hunter222" },
              ],
            ],
            expected: {
              values: { email: "", password: "hunter222", confirm: "hunter22", age: "" },
              status: "editing",
              submitCount: 0,
              errors: { confirm: "Passwords do not match" },
              renders: 4,
            },
          },
          {
            description: "a valid submit followed by success resets the form",
            args: [
              [
                { type: "change", field: "email", value: "ann@example.com" },
                { type: "change", field: "password", value: "correct horse" },
                { type: "change", field: "confirm", value: "correct horse" },
                { type: "submit" },
                { type: "submitSuccess" },
              ],
            ],
            expected: {
              values: { email: "", password: "", confirm: "", age: "" },
              status: "submitted",
              submitCount: 0,
              errors: {},
              renders: 5,
            },
          },
          {
            description: "a server error shows after a failed submit",
            args: [
              [
                { type: "change", field: "email", value: "ann@example.com" },
                { type: "change", field: "password", value: "password1" },
                { type: "change", field: "confirm", value: "password1" },
                { type: "submit" },
                { type: "submitFailure", errors: { email: "Email already registered" } },
              ],
            ],
            expected: {
              values: { email: "ann@example.com", password: "password1", confirm: "password1", age: "" },
              status: "editing",
              submitCount: 1,
              errors: { email: "Email already registered" },
              renders: 5,
            },
          },
          {
            description: "editing the field clears its server error",
            args: [
              [
                { type: "change", field: "email", value: "ann@example.com" },
                { type: "change", field: "password", value: "password1" },
                { type: "change", field: "confirm", value: "password1" },
                { type: "submit" },
                { type: "submitFailure", errors: { email: "Email already registered" } },
                { type: "change", field: "email", value: "ann2@example.com" },
              ],
            ],
            expected: {
              values: { email: "ann2@example.com", password: "password1", confirm: "password1", age: "" },
              status: "editing",
              submitCount: 1,
              errors: {},
              renders: 6,
            },
          },
          {
            description: "resubmitting clears old server errors before validating again",
            args: [
              [
                { type: "change", field: "email", value: "ann@example.com" },
                { type: "change", field: "password", value: "password1" },
                { type: "change", field: "confirm", value: "password1" },
                { type: "submit" },
                { type: "submitFailure", errors: { email: "Email already registered" } },
                { type: "change", field: "age", value: "abc" },
                { type: "submit" },
              ],
            ],
            expected: {
              values: { email: "ann@example.com", password: "password1", confirm: "password1", age: "abc" },
              status: "editing",
              submitCount: 2,
              errors: { age: "Whole number only" },
              renders: 7,
            },
          },
          {
            description: "age must be between 13 and 120",
            args: [
              [
                { type: "change", field: "age", value: "12" },
                { type: "blur", field: "age" },
              ],
            ],
            expected: {
              values: { email: "", password: "", confirm: "", age: "12" },
              status: "editing",
              submitCount: 0,
              errors: { age: "Must be between 13 and 120" },
              renders: 2,
            },
          },
          {
            description: "typing after a successful submit returns to editing",
            args: [
              [
                { type: "change", field: "email", value: "ann@example.com" },
                { type: "change", field: "password", value: "password1" },
                { type: "change", field: "confirm", value: "password1" },
                { type: "submit" },
                { type: "submitSuccess" },
                { type: "change", field: "email", value: "b" },
              ],
            ],
            expected: {
              values: { email: "b", password: "", confirm: "", age: "" },
              status: "editing",
              submitCount: 0,
              errors: {},
              renders: 6,
            },
          },
          {
            description: "a second submit while submitting is ignored",
            args: [
              [
                { type: "change", field: "email", value: "ann@example.com" },
                { type: "change", field: "password", value: "password1" },
                { type: "change", field: "confirm", value: "password1" },
                { type: "submit" },
                { type: "submit" },
              ],
            ],
            expected: {
              values: { email: "ann@example.com", password: "password1", confirm: "password1", age: "" },
              status: "submitting",
              submitCount: 1,
              errors: {},
              renders: 4,
            },
            isEdgeCase: true,
          },
          {
            description: "fields are locked while submitting",
            args: [
              [
                { type: "change", field: "email", value: "ann@example.com" },
                { type: "change", field: "password", value: "password1" },
                { type: "change", field: "confirm", value: "password1" },
                { type: "submit" },
                { type: "change", field: "email", value: "x@y.zz" },
                { type: "blur", field: "age" },
              ],
            ],
            expected: {
              values: { email: "ann@example.com", password: "password1", confirm: "password1", age: "" },
              status: "submitting",
              submitCount: 1,
              errors: {},
              renders: 4,
            },
            isEdgeCase: true,
          },
          {
            description: "no-op actions return the same state, so nothing re-renders",
            args: [
              [
                { type: "change", field: "email", value: "a@b.co" },
                { type: "change", field: "email", value: "a@b.co" },
                { type: "blur", field: "email" },
                { type: "blur", field: "email" },
                { type: "blur", field: "nickname" },
                { type: "change", field: "nickname", value: "x" },
                { type: "reset" },
              ],
            ],
            expected: {
              values: { email: "a@b.co", password: "", confirm: "", age: "" },
              status: "editing",
              submitCount: 0,
              errors: {},
              renders: 2,
            },
            isEdgeCase: true,
          },
          {
            description: "success and failure without a submit in flight are ignored",
            args: [[{ type: "submitSuccess" }, { type: "submitFailure", errors: { email: "Taken" } }]],
            expected: {
              values: { email: "", password: "", confirm: "", age: "" },
              status: "editing",
              submitCount: 0,
              errors: {},
              renders: 0,
            },
            isEdgeCase: true,
          },
          {
            description: "values are stored raw and coerced to strings",
            args: [
              [
                { type: "change", field: "email", value: "  ann@example.com  " },
                { type: "change", field: "age", value: 42 },
                { type: "blur", field: "email" },
                { type: "blur", field: "age" },
              ],
            ],
            expected: {
              values: { email: "  ann@example.com  ", password: "", confirm: "", age: "42" },
              status: "editing",
              submitCount: 0,
              errors: {},
              renders: 4,
            },
            isEdgeCase: true,
          },
          {
            description: "age in scientific notation is not a whole number",
            args: [
              [
                { type: "change", field: "age", value: "1e2" },
                { type: "blur", field: "age" },
              ],
            ],
            expected: {
              values: { email: "", password: "", confirm: "", age: "1e2" },
              status: "editing",
              submitCount: 0,
              errors: { age: "Whole number only" },
              renders: 2,
            },
            isEdgeCase: true,
          },
          {
            description: "a whitespace-only password isn't trimmed to empty",
            args: [
              [
                { type: "change", field: "password", value: "   " },
                { type: "blur", field: "password" },
              ],
            ],
            expected: {
              values: { email: "", password: "   ", confirm: "", age: "" },
              status: "editing",
              submitCount: 0,
              errors: { password: "At least 8 characters" },
              renders: 2,
            },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "react-lifting-state-up",
      moduleId: "fe-react-fundamentals",
      trackId: "frontend",
      title: "Lifting State Up",
      summary:
        "When two components need to agree on a value (a search box and the list it filters, a selection and the toolbar that acts on it), keeping a copy in each means syncing them, and synced copies drift. Lifting state up moves the value to their closest common parent, which passes it down as props together with callbacks to change it. The children become controlled by the parent, and each piece of data has exactly one source of truth.\n\nThe partner rule is derive, don't store. Once the canonical state lives in one place, everything computable from it (the filtered rows, how many are selected, whether the header checkbox is checked, unchecked or indeterminate) is calculated during render instead of being stored and updated in parallel. Stored derived values are where the bugs live: select an item, filter it out, delete a few rows, refetch the data, and that's four chances for a stored `selectedCount` to disagree with reality. Store ids rather than copies of objects, too, so an edited or refetched item can't leave a stale copy behind in `selected`.\n\nThe tradeoff is where the state ends up. Lifting too high makes a large subtree re-render on every keystroke and couples unrelated components; colocation (keep state as low as possible and lift it only as far as needed) is also a performance strategy. When lifted state has to travel through many layers, try composition first, then context, often paired with `useReducer`. And when a child needs its own editable copy of lifted data, remount it with a `key` rather than mirroring props into state with an Effect. In this challenge you design the parent's minimal state for a filterable, selectable table and derive the view that both children need.",
      level: "advanced",
      estMinutes: 75,
      webRefs: [
        { label: "react.dev: Sharing State Between Components", url: "https://react.dev/learn/sharing-state-between-components", kind: "docs" },
        { label: "react.dev: Choosing the State Structure", url: "https://react.dev/learn/choosing-the-state-structure", kind: "docs" },
        { label: "Kent C. Dodds: Don't Sync State. Derive It!", url: "https://kentcdodds.com/blog/dont-sync-state-derive-it", kind: "article" },
        { label: "Kent C. Dodds: State Colocation will make your React app faster", url: "https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster", kind: "article" },
      ],
      video: {
        title: "React 19 Tutorial - 26 - Sharing State Between Components",
        channel: "Codevolution",
        url: "https://www.youtube.com/watch?v=YpjvL5SvVhM",
        videoId: "YpjvL5SvVhM",
        durationLabel: "12:16",
      },
      alternateVideos: [
        {
          title: "Learn React JS - Full Course for Beginners - Tutorial 2019",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=DLX62G4lc44",
          videoId: "DLX62G4lc44",
          durationLabel: "5:05:34",
          startSeconds: 15869,
          chapterLabel: "Container/Component Architecture",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "A page shows a search box, a bulk-action toolbar and a table of selectable rows. None of them can own this data alone: the toolbar needs to know what the table has selected, and the table needs the search box's query. So the state is lifted into their parent, which stores only the minimum: `{ items: [{ id, name }], query: \"\", selectedIds: [] }`.\n\nImplement `tableReducer(state, action)` and `selectTableView(state)`. Everything the UI shows is derived by `selectTableView`. Don't add fields to the state (the driver reports its keys, and the tests expect exactly `items`, `query` and `selectedIds`), and don't mutate it (the driver freezes it).\n\n`selectTableView(state)` returns:\n\n- `rows`: the visible items in their original order, each as `{ id, name, selected }`. An item is visible when its `name` contains the query case-insensitively, after trimming the query; an empty query shows everything.\n- `visibleCount`: the number of rows.\n- `selectedCount`: selected items that still exist in `items`, visible or not. Ids in `selectedIds` that match no item are ignored.\n- `hiddenSelectedCount`: selected existing items that the filter hides.\n- `headerCheckbox`: `\"checked\"` when there's at least one row and every row is selected, `\"indeterminate\"` when some but not all rows are selected, otherwise `\"unchecked\"`.\n- `canDelete`: `true` when `selectedCount` is greater than 0.\n\n`tableReducer(state, action)` handles:\n\n- `{ type: \"setQuery\", query }`: store the raw query. It's a controlled input, so don't trim it.\n- `{ type: \"toggle\", id }`: add `id` to the selection or remove it. Ignore ids that aren't in `items`.\n- `{ type: \"toggleAllVisible\" }`: if the header checkbox is `\"checked\"`, deselect every visible row; otherwise select every visible row. Selections hidden by the filter are kept either way. With no visible rows, do nothing.\n- `{ type: \"deleteSelected\" }`: remove every selected item, hidden ones included (that's what `hiddenSelectedCount` warns about), and clear the selection.\n- `{ type: \"replaceItems\", items }`: replace `items`, as after a refetch. Leave `selectedIds` alone; the view ignores ids that disappeared.\n- Any other action returns `state` unchanged.\n\nThe tests call `runTable(items, actions)`, which starts from `{ items, query: \"\", selectedIds: [] }`, applies the actions and returns `selectTableView` of the final state plus its `query` and `storedKeys`. Leave the driver as it is.",
        starterCode: `/**
 * The parent's minimal state: { items: { id, name }[], query: string, selectedIds: id[] }.
 */
function selectTableView(state) {
  // Your code here
}

function tableReducer(state, action) {
  // Your code here
  return state;
}

// ---- Test driver (leave as is) ----
function runTable(items, actions) {
  let state = deepFreeze({ items, query: "", selectedIds: [] });
  for (const action of actions) state = deepFreeze(tableReducer(state, action));
  return { ...selectTableView(state), query: state.query, storedKeys: Object.keys(state).sort() };
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
`,
        functionName: "runTable",
        testCases: [
          {
            description: "the initial view shows every row with nothing selected",
            args: [
              [
                { id: 1, name: "Apple iPhone 15" },
                { id: 2, name: "Apple Watch" },
                { id: 3, name: "Samsung Galaxy S24" },
                { id: 4, name: "Google Pixel 9" },
                { id: 5, name: "Apple AirPods" },
              ],
              [],
            ],
            expected: {
              rows: [
                { id: 1, name: "Apple iPhone 15", selected: false },
                { id: 2, name: "Apple Watch", selected: false },
                { id: 3, name: "Samsung Galaxy S24", selected: false },
                { id: 4, name: "Google Pixel 9", selected: false },
                { id: 5, name: "Apple AirPods", selected: false },
              ],
              visibleCount: 5,
              selectedCount: 0,
              hiddenSelectedCount: 0,
              headerCheckbox: "unchecked",
              canDelete: false,
              query: "",
              storedKeys: ["items", "query", "selectedIds"],
            },
          },
          {
            description: "the query filters case-insensitively after trimming, but is stored raw",
            args: [
              [
                { id: 1, name: "Apple iPhone 15" },
                { id: 2, name: "Apple Watch" },
                { id: 3, name: "Samsung Galaxy S24" },
                { id: 4, name: "Google Pixel 9" },
                { id: 5, name: "Apple AirPods" },
              ],
              [{ type: "setQuery", query: "  APPLE " }],
            ],
            expected: {
              rows: [
                { id: 1, name: "Apple iPhone 15", selected: false },
                { id: 2, name: "Apple Watch", selected: false },
                { id: 5, name: "Apple AirPods", selected: false },
              ],
              visibleCount: 3,
              selectedCount: 0,
              hiddenSelectedCount: 0,
              headerCheckbox: "unchecked",
              canDelete: false,
              query: "  APPLE ",
              storedKeys: ["items", "query", "selectedIds"],
            },
          },
          {
            description: "a partial selection makes the header checkbox indeterminate",
            args: [
              [
                { id: 1, name: "Apple iPhone 15" },
                { id: 2, name: "Apple Watch" },
                { id: 3, name: "Samsung Galaxy S24" },
                { id: 4, name: "Google Pixel 9" },
                { id: 5, name: "Apple AirPods" },
              ],
              [
                { type: "toggle", id: 1 },
                { type: "toggle", id: 2 },
              ],
            ],
            expected: {
              rows: [
                { id: 1, name: "Apple iPhone 15", selected: true },
                { id: 2, name: "Apple Watch", selected: true },
                { id: 3, name: "Samsung Galaxy S24", selected: false },
                { id: 4, name: "Google Pixel 9", selected: false },
                { id: 5, name: "Apple AirPods", selected: false },
              ],
              visibleCount: 5,
              selectedCount: 2,
              hiddenSelectedCount: 0,
              headerCheckbox: "indeterminate",
              canDelete: true,
              query: "",
              storedKeys: ["items", "query", "selectedIds"],
            },
          },
          {
            description: "a selected row hidden by the filter still counts",
            args: [
              [
                { id: 1, name: "Apple iPhone 15" },
                { id: 2, name: "Apple Watch" },
                { id: 3, name: "Samsung Galaxy S24" },
                { id: 4, name: "Google Pixel 9" },
                { id: 5, name: "Apple AirPods" },
              ],
              [
                { type: "toggle", id: 3 },
                { type: "setQuery", query: "apple" },
              ],
            ],
            expected: {
              rows: [
                { id: 1, name: "Apple iPhone 15", selected: false },
                { id: 2, name: "Apple Watch", selected: false },
                { id: 5, name: "Apple AirPods", selected: false },
              ],
              visibleCount: 3,
              selectedCount: 1,
              hiddenSelectedCount: 1,
              headerCheckbox: "unchecked",
              canDelete: true,
              query: "apple",
              storedKeys: ["items", "query", "selectedIds"],
            },
          },
          {
            description: "select-all picks only the visible rows and keeps hidden selections",
            args: [
              [
                { id: 1, name: "Apple iPhone 15" },
                { id: 2, name: "Apple Watch" },
                { id: 3, name: "Samsung Galaxy S24" },
                { id: 4, name: "Google Pixel 9" },
                { id: 5, name: "Apple AirPods" },
              ],
              [{ type: "toggle", id: 3 }, { type: "setQuery", query: "apple" }, { type: "toggleAllVisible" }],
            ],
            expected: {
              rows: [
                { id: 1, name: "Apple iPhone 15", selected: true },
                { id: 2, name: "Apple Watch", selected: true },
                { id: 5, name: "Apple AirPods", selected: true },
              ],
              visibleCount: 3,
              selectedCount: 4,
              hiddenSelectedCount: 1,
              headerCheckbox: "checked",
              canDelete: true,
              query: "apple",
              storedKeys: ["items", "query", "selectedIds"],
            },
          },
          {
            description: "select-all on a fully selected view deselects only the visible rows",
            args: [
              [
                { id: 1, name: "Apple iPhone 15" },
                { id: 2, name: "Apple Watch" },
                { id: 3, name: "Samsung Galaxy S24" },
                { id: 4, name: "Google Pixel 9" },
                { id: 5, name: "Apple AirPods" },
              ],
              [
                { type: "toggle", id: 3 },
                { type: "setQuery", query: "apple" },
                { type: "toggleAllVisible" },
                { type: "toggleAllVisible" },
              ],
            ],
            expected: {
              rows: [
                { id: 1, name: "Apple iPhone 15", selected: false },
                { id: 2, name: "Apple Watch", selected: false },
                { id: 5, name: "Apple AirPods", selected: false },
              ],
              visibleCount: 3,
              selectedCount: 1,
              hiddenSelectedCount: 1,
              headerCheckbox: "unchecked",
              canDelete: true,
              query: "apple",
              storedKeys: ["items", "query", "selectedIds"],
            },
          },
          {
            description: "select-all on a partially selected view selects the rest",
            args: [
              [
                { id: 1, name: "Apple iPhone 15" },
                { id: 2, name: "Apple Watch" },
                { id: 3, name: "Samsung Galaxy S24" },
                { id: 4, name: "Google Pixel 9" },
                { id: 5, name: "Apple AirPods" },
              ],
              [{ type: "setQuery", query: "apple" }, { type: "toggle", id: 2 }, { type: "toggleAllVisible" }],
            ],
            expected: {
              rows: [
                { id: 1, name: "Apple iPhone 15", selected: true },
                { id: 2, name: "Apple Watch", selected: true },
                { id: 5, name: "Apple AirPods", selected: true },
              ],
              visibleCount: 3,
              selectedCount: 3,
              hiddenSelectedCount: 0,
              headerCheckbox: "checked",
              canDelete: true,
              query: "apple",
              storedKeys: ["items", "query", "selectedIds"],
            },
          },
          {
            description: "deleting removes hidden selected items too and clears the selection",
            args: [
              [
                { id: 1, name: "Apple iPhone 15" },
                { id: 2, name: "Apple Watch" },
                { id: 3, name: "Samsung Galaxy S24" },
                { id: 4, name: "Google Pixel 9" },
                { id: 5, name: "Apple AirPods" },
              ],
              [
                { type: "toggle", id: 3 },
                { type: "setQuery", query: "apple" },
                { type: "toggle", id: 1 },
                { type: "deleteSelected" },
              ],
            ],
            expected: {
              rows: [
                { id: 2, name: "Apple Watch", selected: false },
                { id: 5, name: "Apple AirPods", selected: false },
              ],
              visibleCount: 2,
              selectedCount: 0,
              hiddenSelectedCount: 0,
              headerCheckbox: "unchecked",
              canDelete: false,
              query: "apple",
              storedKeys: ["items", "query", "selectedIds"],
            },
          },
          {
            description: "a refetch that renames a selected item keeps it selected, because the selection stores ids",
            args: [
              [
                { id: 1, name: "Apple iPhone 15" },
                { id: 2, name: "Apple Watch" },
                { id: 3, name: "Samsung Galaxy S24" },
              ],
              [
                { type: "toggle", id: 2 },
                {
                  type: "replaceItems",
                  items: [
                    { id: 1, name: "Apple iPhone 15" },
                    { id: 2, name: "Apple Watch Ultra" },
                    { id: 3, name: "Samsung Galaxy S24" },
                  ],
                },
              ],
            ],
            expected: {
              rows: [
                { id: 1, name: "Apple iPhone 15", selected: false },
                { id: 2, name: "Apple Watch Ultra", selected: true },
                { id: 3, name: "Samsung Galaxy S24", selected: false },
              ],
              visibleCount: 3,
              selectedCount: 1,
              hiddenSelectedCount: 0,
              headerCheckbox: "indeterminate",
              canDelete: true,
              query: "",
              storedKeys: ["items", "query", "selectedIds"],
            },
          },
          {
            description: "a refetch that drops a selected item: the stale id is ignored",
            args: [
              [
                { id: 1, name: "Apple iPhone 15" },
                { id: 2, name: "Apple Watch" },
                { id: 3, name: "Samsung Galaxy S24" },
                { id: 4, name: "Google Pixel 9" },
                { id: 5, name: "Apple AirPods" },
              ],
              [
                { type: "toggle", id: 2 },
                { type: "toggle", id: 4 },
                {
                  type: "replaceItems",
                  items: [
                    { id: 1, name: "Apple iPhone 15" },
                    { id: 2, name: "Apple Watch" },
                    { id: 3, name: "Samsung Galaxy S24" },
                    { id: 5, name: "Apple AirPods" },
                  ],
                },
              ],
            ],
            expected: {
              rows: [
                { id: 1, name: "Apple iPhone 15", selected: false },
                { id: 2, name: "Apple Watch", selected: true },
                { id: 3, name: "Samsung Galaxy S24", selected: false },
                { id: 5, name: "Apple AirPods", selected: false },
              ],
              visibleCount: 4,
              selectedCount: 1,
              hiddenSelectedCount: 0,
              headerCheckbox: "indeterminate",
              canDelete: true,
              query: "",
              storedKeys: ["items", "query", "selectedIds"],
            },
            isEdgeCase: true,
          },
          {
            description: "with no visible rows the header is unchecked and select-all does nothing",
            args: [
              [
                { id: 1, name: "Apple iPhone 15" },
                { id: 2, name: "Apple Watch" },
                { id: 3, name: "Samsung Galaxy S24" },
              ],
              [{ type: "toggle", id: 1 }, { type: "setQuery", query: "nokia" }, { type: "toggleAllVisible" }],
            ],
            expected: {
              rows: [],
              visibleCount: 0,
              selectedCount: 1,
              hiddenSelectedCount: 1,
              headerCheckbox: "unchecked",
              canDelete: true,
              query: "nokia",
              storedKeys: ["items", "query", "selectedIds"],
            },
            isEdgeCase: true,
          },
          {
            description: "toggling an unknown id is ignored, and toggling twice deselects",
            args: [
              [
                { id: 1, name: "Apple iPhone 15" },
                { id: 2, name: "Apple Watch" },
              ],
              [{ type: "toggle", id: 99 }, { type: "toggle", id: 2 }, { type: "toggle", id: 2 }, { type: "noSuchAction" }],
            ],
            expected: {
              rows: [
                { id: 1, name: "Apple iPhone 15", selected: false },
                { id: 2, name: "Apple Watch", selected: false },
              ],
              visibleCount: 2,
              selectedCount: 0,
              hiddenSelectedCount: 0,
              headerCheckbox: "unchecked",
              canDelete: false,
              query: "",
              storedKeys: ["items", "query", "selectedIds"],
            },
            isEdgeCase: true,
          },
          {
            description: "an empty table survives every action",
            args: [[], [{ type: "toggleAllVisible" }, { type: "deleteSelected" }, { type: "setQuery", query: "x" }]],
            expected: {
              rows: [],
              visibleCount: 0,
              selectedCount: 0,
              hiddenSelectedCount: 0,
              headerCheckbox: "unchecked",
              canDelete: false,
              query: "x",
              storedKeys: ["items", "query", "selectedIds"],
            },
            isEdgeCase: true,
          },
          {
            description: "select-all with no filter selects every row and checks the header",
            args: [
              [
                { id: "a", name: "Pixel Buds" },
                { id: "b", name: "Galaxy Buds" },
              ],
              [{ type: "toggleAllVisible" }],
            ],
            expected: {
              rows: [
                { id: "a", name: "Pixel Buds", selected: true },
                { id: "b", name: "Galaxy Buds", selected: true },
              ],
              visibleCount: 2,
              selectedCount: 2,
              hiddenSelectedCount: 0,
              headerCheckbox: "checked",
              canDelete: true,
              query: "",
              storedKeys: ["items", "query", "selectedIds"],
            },
          },
        ],
      },
    },
    {
      id: "react-composition",
      moduleId: "fe-react-fundamentals",
      trackId: "frontend",
      title: "Composition vs Inheritance in React",
      summary:
        "React's answer to reuse is composition, not inheritance: the React team wrote that across thousands of components at Facebook they found no case where they'd recommend component inheritance hierarchies. Inheritance couples a subclass to its parent's internals (the fragile base class problem) and captures only one axis of variation, while composition combines independent pieces. The tools are `children` and other element props (slots such as `header={<Title />}`), specialisation (a `DangerButton` that renders `Button` with fixed props), custom Hooks for sharing stateful logic, and context for data that many levels need.\n\nComposition is also the first fix for prop drilling. Instead of threading `user` through `Layout` and `Header` so that `Avatar` can read it, the owner renders `<Layout header={<Header avatar={<Avatar user={user} />} />} />`, and the middle layers no longer know `user` exists. react.dev suggests passing props or JSX as children before reaching for context, which adds implicit coupling and re-renders every consumer when its value changes.\n\nThere's a performance side that experienced developers often miss. Elements passed as `children` are created by the component that writes the JSX, so when a wrapper's own state changes (scroll position, hover, an open flag), its `children` are the same element objects as last time and React skips re-rendering them. Moving state down into a small wrapper and lifting expensive content up as children fixes many slow screens without `memo`.\n\nThe gotchas: passing a component (`sidebar={Nav}`) where an element is expected (`sidebar={<Nav />}`) renders nothing; creating HOCs or components during render remounts subtrees; and `Children.map` plus `cloneElement` are fragile because they don't see through fragments or wrapper components. Prefer explicit props or context.",
      level: "intermediate",
      estMinutes: 50,
      webRefs: [
        { label: "react.dev: Passing JSX as children", url: "https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children", kind: "docs" },
        { label: "React legacy docs: Composition vs Inheritance", url: "https://legacy.reactjs.org/docs/composition-vs-inheritance.html", kind: "docs" },
        { label: "Overreacted: Before You memo()", url: "https://overreacted.io/before-you-memo/", kind: "article" },
        { label: "Developer Way: The mystery of React Element, children, parents and re-renders", url: "https://www.developerway.com/posts/react-elements-children-parents", kind: "article" },
      ],
      video: {
        title: "Using Composition in React to Avoid \"Prop Drilling\"",
        channel: "React Training",
        url: "https://www.youtube.com/watch?v=3XaXKiXtNjw",
        videoId: "3XaXKiXtNjw",
        durationLabel: "15:42",
      },
      alternateVideos: [
        {
          title: "Preventing React re-renders with composition",
          channel: "Developer Way",
          url: "https://www.youtube.com/watch?v=7sgBhmLjVws",
          videoId: "7sgBhmLjVws",
          durationLabel: "12:11",
        },
        {
          title: "🚀🔥 React & Redux Complete Course (2024) with Projects | Notes | Free Certification",
          channel: "Complete Coding by Prashant Sir",
          url: "https://www.youtube.com/watch?v=eILUmCJhl64",
          videoId: "eILUmCJhl64",
          durationLabel: "19:53:36",
          startSeconds: 17445,
          chapterLabel: "Ch-23-25: Passing Components as Children, Handling Events, Passing Functions via Props (in Hindi)",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "react-composition-q1",
          prompt: "Which are idiomatic ways to reuse UI or behaviour in modern React? (Select all that apply.)",
          options: [
            "Accepting `children` and rendering it inside a wrapper",
            "Extracting shared stateful logic into a custom Hook",
            "Passing elements as named props, such as `header={<Title />}`",
            "`class FancyButton extends MyButton` to override its `render`",
            "Mixins",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Slots, element props and custom Hooks compose freely. Component inheritance ties you to a parent's internals, and mixins were dropped along with `createClass` because they collided and hid dependencies.",
        },
        {
          id: "react-composition-q2",
          prompt:
            "`ScrollTracker` updates `y` on every scroll event. Does `ExpensiveTree` re-render on scroll?\n\n```jsx\nfunction ScrollTracker({ children }) {\n  const [y, setY] = useState(0);\n  return (\n    <div onScroll={(e) => setY(e.currentTarget.scrollTop)}>\n      <p>{y}px</p>\n      {children}\n    </div>\n  );\n}\n\nfunction Page() {\n  return (\n    <ScrollTracker>\n      <ExpensiveTree />\n    </ScrollTracker>\n  );\n}\n```",
          options: [
            "No: `Page` created the `<ExpensiveTree />` element and didn't re-render, so React sees the same element and skips it",
            "Yes: every child of a re-rendering component re-renders",
            "Only if `ExpensiveTree` isn't wrapped in `memo`",
            "Yes, but React batches scroll renders so it's cheap",
          ],
          correctIndex: 0,
          explanation:
            "React skips a subtree when it gets back the identical element object. Had `ScrollTracker` rendered `<ExpensiveTree />` itself, a new element would be created each time and it would re-render; this is the \"lift content up\" technique from Before You memo().",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-composition-q3",
          prompt:
            "`App` owns `user`, and only `Avatar` (inside `Header`, inside `Layout`) uses it. Which change removes the prop drilling without context?",
          options: [
            "`App` renders `<Layout header={<Header avatar={<Avatar user={user} />} />} />`, and `Layout` and `Header` just place the slots they receive",
            "Store `user` in a module-level variable that `Avatar` imports",
            "Make `Layout` and `Header` extend a `UserAware` base class",
            "Have `Avatar` read `user` from `window`",
          ],
          correctIndex: 0,
          explanation:
            "Passing the finished element means the middle components don't need to know about `user`. Context is the better tool for data that many distant components need (theme, locale, the signed-in user); a module variable or `window` wouldn't trigger re-renders at all.",
        },
        {
          id: "react-composition-q4",
          prompt: "What does this render?\n\n```jsx\nfunction Layout({ sidebar }) {\n  return <aside>{sidebar}</aside>;\n}\n\n<Layout sidebar={Nav} />\n```",
          options: [
            "An empty `<aside>`, with a warning that functions are not valid as a React child",
            "The `Nav` component inside the aside",
            "The source code of `Nav` as text",
            "Nothing: it throws because objects are not valid as a React child",
          ],
          correctIndex: 0,
          explanation:
            "`Nav` is the component function; `<Nav />` is an element. Pass `sidebar={<Nav />}`, or accept a component prop and render it with a capitalised name: `const Sidebar = sidebar; return <Sidebar />;`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-composition-q5",
          prompt:
            "`Tabs` injects props with `Children.map(children, (child) => cloneElement(child, { active }))`. A consumer writes the following. What receives the `active` prop?\n\n```jsx\n<Tabs>\n  <>\n    <Tab label=\"One\" />\n    <Tab label=\"Two\" />\n  </>\n</Tabs>\n```",
          options: [
            "The fragment, treated as a single child; neither `Tab` gets it",
            "Both `Tab` elements, because `Children.map` flattens fragments",
            "Only the first `Tab`",
            "Nothing: `cloneElement` throws on fragments",
          ],
          correctIndex: 0,
          explanation:
            "The `Children` utilities don't traverse into fragments or into what custom components render, so injected props land on the wrong element. That fragility is why react.dev files `Children` and `cloneElement` under legacy APIs and suggests context or explicit props instead.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-composition-q6",
          prompt:
            "`function DangerButton(props) { return <Button {...props} variant=\"danger\" />; }` is used as `<DangerButton variant=\"primary\" />`. Which `variant` does `Button` receive?",
          options: ["`danger`", "`primary`", "Both, as an array", "React throws on the duplicate prop"],
          correctIndex: 0,
          explanation:
            "Props behave like object spread, so whatever comes last wins: a prop after the spread is fixed, and one before it is a default the caller can override. Specialisation through props is React's replacement for subclassing.",
        },
        {
          id: "react-composition-q7",
          prompt:
            "Several unrelated components need the current window width, re-render when it changes, and render different things with it. What's the modern tool?",
          options: [
            "A custom Hook, such as `useWindowWidth()`, called by each component",
            "A `WindowWidthBase` class that the components extend",
            "A higher-order component wrapped around the entire app that injects `width` everywhere",
            "A module-level variable updated by a resize listener",
          ],
          correctIndex: 0,
          explanation:
            "Custom Hooks share stateful logic without adding wrapper layers, and each call gets its own state. Render props and HOCs still work but add nesting, and a module variable can't trigger re-renders.",
        },
        {
          id: "react-composition-q8",
          prompt: "What's wrong with this?\n\n```jsx\nfunction Page() {\n  const Protected = withAuth(Dashboard);\n  return <Protected />;\n}\n```",
          options: [
            "`withAuth` returns a new component type on every render, so `Dashboard` remounts and loses its state each time",
            "HOCs can't wrap function components",
            "Nothing, as long as `withAuth` is pure",
            "It only fails in Strict Mode",
          ],
          correctIndex: 0,
          explanation:
            "Apply HOCs once, at module level, outside any component. It's the same identity problem as defining a component inside another component.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "react-composition-q9",
          prompt: "A `theme` prop passes through five components that don't use it. According to react.dev, what should you try before context?",
          options: [
            "Extracting components and passing JSX as `children`, so the middle layers stop forwarding it",
            "Converting the tree to class components",
            "Copying `theme` into each component's state",
            "Moving `theme` into `localStorage`",
          ],
          correctIndex: 0,
          explanation:
            "Composition often removes the middle layers from the picture entirely. If many distant components genuinely need the value, context is then the right tool.",
        },
        {
          id: "react-composition-q10",
          prompt: "Which statements about `children` are true? (Select all that apply.)",
          options: [
            "It can hold a function that the component calls, which is the render-prop-as-children pattern",
            "A component can accept several slots as separate element props alongside `children`",
            "Elements passed as `children` are created by the component that writes the JSX, not by the one that renders them",
            "It's always an array, even when there's a single child",
            "A component must render its `children` exactly once",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`children` is just a prop: it can be a function or sit next to other slot props, and its elements come from whoever wrote the JSX, which is why they can skip re-rendering. A single child isn't wrapped in an array, and a component may render `children` zero, one or several times.",
        },
      ],
    },
  ],
} satisfies Module;
