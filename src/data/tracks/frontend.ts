import type { Track } from "@/types/curriculum";

export const frontendTrack: Track = {
  id: "frontend",
  name: "Frontend",
  tagline: "From semantic HTML to production React, Next.js and Vue.",
  accentToken: "trailmark",
  topics: [
    {
      id: "html-css-foundations",
      trackId: "frontend",
      title: "HTML & CSS Foundations",
      summary:
        "Semantic HTML, the CSS box model, Flexbox for one-dimensional layout, Grid for two-dimensional layout, and mobile-first responsive design with media queries.",
      level: "beginner",
      estMinutes: 90,
      webRef: { label: "MDN: Learn web development", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development" },
      videoRef: {
        label: "freeCodeCamp: CSS Tutorial, Full Course for Beginners",
        url: "https://www.youtube.com/watch?v=OXGznpKZ_sA",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "html-css-foundations-q1",
          prompt: "Which element should wrap a site's main navigation links?",
          options: ['<div class="nav">', "<nav>", "<section>", "<menu>"],
          correctIndex: 1,
          explanation:
            "<nav> marks a major block of navigation links, which screen readers expose as a navigation landmark.",
        },
        {
          id: "html-css-foundations-q2",
          prompt: "You're marking up a self-contained blog post that would still make sense syndicated on its own. Which element fits best?",
          options: ["<section>", "<aside>", "<article>", "<div>"],
          correctIndex: 2,
          explanation:
            "<article> is for self-contained, independently distributable content such as posts, comments or cards.",
        },
        {
          id: "html-css-foundations-q3",
          prompt: "You need a layout where items line up in both rows and columns at once, like a gallery with fixed column tracks. Which tool is designed for that?",
          options: ["Flexbox", "CSS Grid", "Floats", "position: absolute"],
          correctIndex: 1,
          explanation:
            "Grid lays out content in two dimensions; Flexbox distributes items along one axis at a time.",
        },
        {
          id: "html-css-foundations-q4",
          prompt: "With box-sizing: border-box, an element has width: 200px, padding: 20px and a 5px border. How wide does it render?",
          options: ["200px", "240px", "250px", "210px"],
          correctIndex: 0,
          explanation:
            "border-box includes padding and border inside the declared width, so the box stays 200px wide.",
        },
        {
          id: "html-css-foundations-q5",
          prompt: "Which unit is relative to the root element's font size, so spacing and type scale together when a user changes their browser font size?",
          options: ["em", "px", "vw", "rem"],
          correctIndex: 3,
          explanation:
            "rem is relative to the <html> font size; em compounds with the parent's font size instead.",
        },
      ],
    },
    {
      id: "js-fundamentals",
      trackId: "frontend",
      title: "JavaScript Fundamentals",
      summary:
        "Variables and scope, control flow, functions, arrays and objects, and working with the DOM and events.",
      level: "beginner",
      estMinutes: 120,
      webRef: { label: "MDN: JavaScript Guide", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide" },
      videoRef: {
        label: "freeCodeCamp: JavaScript Programming, Full Course",
        url: "https://www.youtube.com/watch?v=jS4aFq5-91M",
      },
      challengeType: "code",
      codeChallenge: {
        instructions: `Write \`filterByProperty(items, key, value)\` that returns a new array containing only the objects whose \`key\` property strictly equals (\`===\`) \`value\`.

- Keep the original order.
- Don't mutate the input array.
- Watch out for falsy values: filtering by \`false\` or \`0\` must still work.`,
        starterCode: `/**
 * Return only the items whose \`key\` property strictly equals \`value\`.
 * @param {object[]} items
 * @param {string} key
 * @param {unknown} value
 * @returns {object[]}
 */
function filterByProperty(items, key, value) {
  // Your code here
}
`,
        functionName: "filterByProperty",
        testCases: [
          {
            description: "keeps only matching items, in order",
            args: [
              [
                { name: "Ada", role: "admin" },
                { name: "Linus", role: "dev" },
                { name: "Grace", role: "admin" },
              ],
              "role",
              "admin",
            ],
            expected: [
              { name: "Ada", role: "admin" },
              { name: "Grace", role: "admin" },
            ],
          },
          {
            description: "works when filtering by a falsy value",
            args: [
              [
                { id: 1, active: true },
                { id: 2, active: false },
                { id: 3, active: true },
              ],
              "active",
              false,
            ],
            expected: [{ id: 2, active: false }],
          },
          {
            description: 'uses strict equality ("3" is not 3)',
            args: [
              [
                { id: 1, qty: "3" },
                { id: 2, qty: 3 },
                { id: 3, qty: 4 },
              ],
              "qty",
              3,
            ],
            expected: [{ id: 2, qty: 3 }],
          },
        ],
      },
    },
    {
      id: "js-advanced",
      trackId: "frontend",
      title: "Closures, Async & the Event Loop",
      summary:
        "How closures capture variables, how promises and async/await work, and how the event loop schedules tasks and microtasks on a single thread.",
      level: "intermediate",
      estMinutes: 120,
      isMilestone: true,
      webRef: { label: "MDN: Closures", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures" },
      videoRef: {
        label: "Lydia Hallie: JavaScript Visualized, Event Loop and (Micro)task Queue",
        url: "https://www.youtube.com/watch?v=eiC58R16hb8",
      },
      challengeType: "code",
      codeChallenge: {
        instructions: `Implement \`memoize(fn)\` for single-argument functions. It should return a new function that:

- keeps a cache in a closure (a \`Map\` works well), so nothing outside can touch it
- calls \`fn\` only for arguments it hasn't seen before
- returns the cached result for repeat arguments, including falsy results like \`0\`

The tests call the provided \`countComputations\` driver, which counts how often the real function runs. Leave the driver as it is.`,
        starterCode: `/**
 * Return a memoized version of \`fn\`.
 * The first call with an argument computes the result;
 * later calls with the same argument return the cached value.
 */
function memoize(fn) {
  // Your code here
}

// ---- Test driver (leave as is) ----
// Memoizes a "slow" square function, calls it once per input,
// and reports the results plus how many times the real function ran.
function countComputations(inputs) {
  let computations = 0;
  const slowSquare = (n) => {
    computations += 1;
    return n * n;
  };
  const fastSquare = memoize(slowSquare);
  const results = inputs.map((n) => fastSquare(n));
  return { results, computations };
}
`,
        functionName: "countComputations",
        testCases: [
          {
            description: "repeat arguments come from the cache",
            args: [[2, 3, 2, 2]],
            expected: { results: [4, 9, 4, 4], computations: 2 },
          },
          {
            description: "falsy results like 0 are cached too",
            args: [[0, 0, 0]],
            expected: { results: [0, 0, 0], computations: 1 },
          },
          {
            description: "every distinct argument is computed once",
            args: [[1, 2, 3, 4]],
            expected: { results: [1, 4, 9, 16], computations: 4 },
          },
        ],
      },
    },
    {
      id: "typescript-essentials",
      trackId: "frontend",
      title: "TypeScript Essentials",
      summary:
        "Static types for JavaScript: annotations, interfaces and type aliases, generics, narrowing and the built-in utility types.",
      level: "intermediate",
      estMinutes: 90,
      webRef: { label: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" },
      videoRef: {
        label: "freeCodeCamp: Learn TypeScript, Full Tutorial",
        url: "https://www.youtube.com/watch?v=30LWjhZzg50",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "typescript-essentials-q1",
          prompt: "Which statement about interface and type aliases is accurate?",
          options: [
            "Declaring the same interface twice merges the declarations; type aliases can't be re-declared",
            "Type aliases can't describe object shapes",
            'Interfaces can describe union types like "a" | "b"',
            "They compile to different JavaScript at runtime",
          ],
          correctIndex: 0,
          explanation:
            "Interfaces support declaration merging, while a type alias name can only be declared once; both are erased at compile time.",
        },
        {
          id: "typescript-essentials-q2",
          prompt: "What does function first<T>(items: T[]): T | undefined give you over first(items: any[]): any?",
          options: [
            "Runtime checks that every item has the same type",
            "The return type follows the argument, so first([1, 2]) is typed number | undefined",
            "It restricts T to primitive types",
            "It makes the function run faster",
          ],
          correctIndex: 1,
          explanation:
            "Generics preserve the relationship between input and output types; any throws that information away.",
        },
        {
          id: "typescript-essentials-q3",
          prompt: 'Given value: string | number, what is the type of value inside if (typeof value === "string") { … }?',
          options: ["string | number", "unknown", "string", "never"],
          correctIndex: 2,
          explanation:
            "A typeof check is a type guard, so TypeScript narrows value to string inside that branch.",
        },
        {
          id: "typescript-essentials-q4",
          prompt: "Which utility type makes every property of User optional?",
          options: ["Required<User>", "Partial<User>", "Readonly<User>", "Pick<User, keyof User>"],
          correctIndex: 1,
          explanation: "Partial<T> maps every property of T to an optional property.",
        },
        {
          id: "typescript-essentials-q5",
          prompt: "Why prefer unknown over any for values from JSON.parse or an external API?",
          options: [
            "unknown values are validated at runtime automatically",
            "unknown compiles to faster JavaScript",
            "any can't hold objects",
            "You must narrow an unknown value before using it, so mistakes are caught at compile time",
          ],
          correctIndex: 3,
          explanation:
            "unknown forces a check (typeof, a type guard or a schema) before use, while any silently disables type checking.",
        },
      ],
    },
    {
      id: "tailwind-css",
      trackId: "frontend",
      title: "Tailwind CSS",
      summary:
        "Utility-first styling: composing small classes in markup, stacking variants like hover:, md: and dark:, and defining design tokens in CSS with Tailwind v4's @theme.",
      level: "beginner",
      estMinutes: 60,
      webRef: { label: "Tailwind CSS docs", url: "https://tailwindcss.com/docs" },
      videoRef: {
        label: "JavaScript Mastery: Tailwind CSS v4 Full Course",
        url: "https://www.youtube.com/watch?v=6biMWgD6_JY",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "tailwind-css-q1",
          prompt: "What does md:flex do?",
          options: [
            "Applies display: flex only between the md and lg breakpoints",
            "Applies display: flex below the md breakpoint",
            "Applies display: flex at the md breakpoint and wider",
            "Applies display: flex on medium-density screens",
          ],
          correctIndex: 2,
          explanation:
            "Tailwind is mobile-first: an unprefixed utility applies everywhere and md: applies from that breakpoint up.",
        },
        {
          id: "tailwind-css-q2",
          prompt: "In Tailwind CSS v4, where do you define custom design tokens such as brand colors and fonts?",
          options: [
            "In your CSS, with the @theme directive",
            "In a purge array inside tailwind.config.js",
            "In data- attributes on the <html> element",
            "Only through inline style attributes",
          ],
          correctIndex: 0,
          explanation:
            "v4 is configured in CSS: variables declared in @theme become both CSS variables and matching utility classes.",
        },
        {
          id: "tailwind-css-q3",
          prompt: "How do you change a child's style when the user hovers over its parent, marked with the group class?",
          options: ["parent-hover:", "peer-hover:", "hover:group", "group-hover:"],
          correctIndex: 3,
          explanation:
            "group-hover: styles an element based on the hover state of its nearest .group ancestor; peer- is for siblings.",
        },
        {
          id: "tailwind-css-q4",
          prompt: "Which class applies a one-off value that isn't in your theme?",
          options: ["top-117px", "top-[117px]", "top={117px}", "top:117px"],
          correctIndex: 1,
          explanation:
            "Square brackets create an arbitrary value, generating the utility on the fly without editing the theme.",
        },
      ],
    },
    {
      id: "react-fundamentals",
      trackId: "frontend",
      title: "React Fundamentals",
      summary:
        "Components and JSX, passing props, adding state, handling events and rendering lists with keys.",
      level: "intermediate",
      estMinutes: 120,
      webRef: { label: "React docs: Learn React", url: "https://react.dev/learn" },
      videoRef: {
        label: "JavaScript Mastery: React JS 19 Full Course",
        url: "https://www.youtube.com/watch?v=dCLhUialKPQ",
      },
      challengeType: "code",
      codeChallenge: {
        instructions: `In React, values you can calculate from props or state should be computed during render, not copied into extra state. Write \`deriveTodoView(todos, filter)\` that returns everything a \`<TodoList>\` needs:

- \`visible\`: the todos matching \`filter\`: \`"all"\`, \`"active"\` (not done) or \`"done"\`, in their original order
- \`remaining\`: how many todos are not done, counted across all todos regardless of the filter
- \`allDone\`: \`true\` only when there is at least one todo and every todo is done`,
        starterCode: `/**
 * @param {{ id: number, text: string, done: boolean }[]} todos
 * @param {"all" | "active" | "done"} filter
 * @returns {{ visible: object[], remaining: number, allDone: boolean }}
 */
function deriveTodoView(todos, filter) {
  // Your code here
}
`,
        functionName: "deriveTodoView",
        testCases: [
          {
            description: '"active" shows unfinished todos; remaining counts all',
            args: [
              [
                { id: 1, text: "Write docs", done: true },
                { id: 2, text: "Fix bug", done: false },
                { id: 3, text: "Review PR", done: false },
              ],
              "active",
            ],
            expected: {
              visible: [
                { id: 2, text: "Fix bug", done: false },
                { id: 3, text: "Review PR", done: false },
              ],
              remaining: 2,
              allDone: false,
            },
          },
          {
            description: "allDone is true when every todo is finished",
            args: [
              [
                { id: 1, text: "Ship it", done: true },
                { id: 2, text: "Celebrate", done: true },
              ],
              "all",
            ],
            expected: {
              visible: [
                { id: 1, text: "Ship it", done: true },
                { id: 2, text: "Celebrate", done: true },
              ],
              remaining: 0,
              allDone: true,
            },
          },
          {
            description: "an empty list is not \"all done\"",
            args: [[], "done"],
            expected: { visible: [], remaining: 0, allDone: false },
          },
        ],
      },
    },
    {
      id: "react-hooks",
      trackId: "frontend",
      title: "React Hooks in Depth",
      summary:
        "The core hooks (useState, useEffect, useContext, useReducer, useMemo, useCallback), React 19's useActionState and useOptimistic, and how to extract your own custom hooks.",
      level: "intermediate",
      estMinutes: 120,
      isMilestone: true,
      webRef: { label: "React docs: Built-in React Hooks", url: "https://react.dev/reference/react/hooks" },
      videoRef: {
        label: "Fireship: 10 React Hooks Explained",
        url: "https://www.youtube.com/watch?v=TNhaISOUy6Q",
      },
      challengeType: "code",
      codeChallenge: {
        instructions: `A \`useReducer\` reducer must be pure: given the current state and an action, return the next state without mutating the old one. Write \`cartReducer\` for a \`useCart()\` custom hook. State looks like \`{ items: [{ id, name, qty }] }\`.

- \`{ type: "added", item: { id, name } }\`: add the item with \`qty: 1\`, or add 1 to its \`qty\` if that id is already in the cart
- \`{ type: "removed", id }\`: remove the item with that id
- \`{ type: "cleared" }\`: empty the cart
- Any other action type: return the current state unchanged`,
        starterCode: `/**
 * Reducer behind a useCart() custom hook:
 *   const [cart, dispatch] = useReducer(cartReducer, { items: [] });
 */
function cartReducer(state, action) {
  switch (action.type) {
    // Your code here

    default:
      return state;
  }
}
`,
        functionName: "cartReducer",
        testCases: [
          {
            description: "adding a new item sets qty to 1",
            args: [{ items: [] }, { type: "added", item: { id: "tee", name: "T-shirt" } }],
            expected: { items: [{ id: "tee", name: "T-shirt", qty: 1 }] },
          },
          {
            description: "adding an item already in the cart increments qty",
            args: [
              { items: [{ id: "tee", name: "T-shirt", qty: 1 }] },
              { type: "added", item: { id: "tee", name: "T-shirt" } },
            ],
            expected: { items: [{ id: "tee", name: "T-shirt", qty: 2 }] },
          },
          {
            description: "removing drops only that item",
            args: [
              {
                items: [
                  { id: "tee", name: "T-shirt", qty: 2 },
                  { id: "mug", name: "Mug", qty: 1 },
                ],
              },
              { type: "removed", id: "tee" },
            ],
            expected: { items: [{ id: "mug", name: "Mug", qty: 1 }] },
          },
        ],
      },
    },
    {
      id: "react-router-state",
      trackId: "frontend",
      title: "Routing & State Management",
      summary:
        "Client-side routing with React Router (declarative, data and framework modes), sharing state with Context, and when to reach for Zustand or Redux Toolkit.",
      level: "intermediate",
      estMinutes: 90,
      webRef: { label: "React Router docs", url: "https://reactrouter.com/home" },
      videoRef: {
        label: "PedroTech: React Router v7 Tutorial",
        url: "https://www.youtube.com/watch?v=h7MTWLv3xvw",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "react-router-state-q1",
          prompt: "Which component renders the matched child route inside a parent layout route?",
          options: ["<Slot />", "<Outlet />", "<Children />", "<RouteView />"],
          correctIndex: 1,
          explanation: "A parent route renders <Outlet /> where its matching child route should appear.",
        },
        {
          id: "react-router-state-q2",
          prompt: "For a route path of /projects/:projectId, how does the component read projectId?",
          options: ["useSearchParams()", "useLocation().projectId", "useParams()", 'useRoute("projectId")'],
          correctIndex: 2,
          explanation: "useParams() returns the dynamic segments of the current URL, keyed by name.",
        },
        {
          id: "react-router-state-q3",
          prompt: "In React Router's data APIs, what is a route loader for?",
          options: [
            "Fetching the data a route needs before it renders, read with useLoaderData()",
            "Lazy-loading the route's CSS",
            "Showing a spinner during navigation",
            "Registering a service worker for the route",
          ],
          correctIndex: 0,
          explanation:
            "Loaders run before the route renders so data and UI arrive together; the component reads the result with useLoaderData().",
        },
        {
          id: "react-router-state-q4",
          prompt: "When is React Context a good fit on its own?",
          options: [
            "State that changes on every keystroke and is read by hundreds of components",
            "Caching and refetching server data",
            "Low-frequency, app-wide values like theme, locale or the signed-in user",
            "Values you could compute during render",
          ],
          correctIndex: 2,
          explanation:
            "Every consumer re-renders when a context value changes, so it suits values that change rarely.",
        },
        {
          id: "react-router-state-q5",
          prompt: "Which statement best describes Zustand compared with Redux Toolkit?",
          options: [
            "Zustand only works with class components",
            "Zustand stores are plain hooks with no Provider required; Redux Toolkit organises state into slices inside one store provided with <Provider>",
            "Redux Toolkit can't handle async logic",
            "Zustand state can't be persisted to localStorage",
          ],
          correctIndex: 1,
          explanation:
            "Zustand trades structure for minimal boilerplate, while Redux Toolkit adds conventions (slices, actions, a single store) that help large teams.",
        },
      ],
    },
    {
      id: "nextjs-app-router",
      trackId: "frontend",
      title: "Next.js & the App Router",
      summary:
        "File-system routing and layouts in the app directory, Server vs Client Components, and how Next.js 16 prerenders static shells, streams dynamic parts and caches work with \"use cache\".",
      level: "advanced",
      estMinutes: 150,
      webRef: { label: "Next.js docs", url: "https://nextjs.org/docs" },
      videoRef: {
        label: "JavaScript Mastery: Next.js 16 Full Course",
        url: "https://www.youtube.com/watch?v=I1V9YWqRIeI",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "nextjs-app-router-q1",
          prompt: "By default, components inside the app directory are…",
          options: ["Client Components", "React Server Components", "Static HTML with no React", "Web Components"],
          correctIndex: 1,
          explanation:
            "App Router pages and layouts are Server Components unless a file opts into the client with \"use client\".",
        },
        {
          id: "nextjs-app-router-q2",
          prompt: 'When do you need to add "use client" at the top of a file?',
          options: [
            "Whenever the component fetches data",
            "For every component inside app/",
            "When the component uses state, effects, event handlers or browser-only APIs",
            "To enable TypeScript in that file",
          ],
          correctIndex: 2,
          explanation:
            "Interactivity needs JavaScript in the browser, so components using state, effects or event handlers must be Client Components.",
        },
        {
          id: "nextjs-app-router-q3",
          prompt: "What does a layout.tsx file do?",
          options: [
            "Wraps a route segment and its children in shared UI that stays mounted across navigations",
            "Defines the error boundary for a segment",
            "Runs once on the first page load, then unmounts",
            "Configures the bundler for that folder",
          ],
          correctIndex: 0,
          explanation:
            "Layouts persist between navigations within their segment, keeping state and avoiding re-renders of shared UI.",
        },
        {
          id: "nextjs-app-router-q4",
          prompt: "Which file creates a route that matches /blog/hello-world and receives the slug?",
          options: [
            "app/blog/:slug/page.tsx",
            "app/blog/{slug}.tsx",
            "app/blog/[slug]/page.tsx",
            "app/blog/$slug/page.tsx",
          ],
          correctIndex: 2,
          explanation: "Square-bracket folder names create dynamic segments, passed to the page as params.",
        },
        {
          id: "nextjs-app-router-q5",
          prompt: "What does adding loading.tsx to a route segment give you?",
          options: [
            "A service worker cache for the segment",
            "An instant loading state, shown through React Suspense while the segment's content streams in",
            "A spinner that only appears for client-side fetches",
            "Automatic image preloading",
          ],
          correctIndex: 1,
          explanation:
            "loading.tsx wraps the segment in a Suspense boundary, so the server can stream the shell first and the content when it's ready.",
        },
        {
          id: "nextjs-app-router-q6",
          prompt:
            "With Cache Components enabled in Next.js 16, a page has a static header and a panel that reads cookies(). How is it rendered?",
          options: [
            "Everything is rendered at build time, including the cookie values",
            "The static shell is prerendered and the cookie-dependent panel streams in at request time behind a <Suspense> boundary",
            "The whole route becomes a Client Component",
            "The build fails until the panel is moved to a Route Handler",
          ],
          correctIndex: 1,
          explanation:
            "Partial Prerendering serves the static shell instantly and streams request-time parts like cookies() in behind Suspense, instead of making the whole route dynamic.",
        },
      ],
    },
    {
      id: "vuejs-essentials",
      trackId: "frontend",
      title: "Vue.js Essentials",
      summary:
        "Vue's reactivity system, single-file components with the Composition API and <script setup>, and shared state with Pinia.",
      level: "intermediate",
      estMinutes: 120,
      webRef: { label: "Vue.js guide: Introduction", url: "https://vuejs.org/guide/introduction.html" },
      videoRef: {
        label: "freeCodeCamp: Vue.js Course for Beginners",
        url: "https://www.youtube.com/watch?v=8pn9KEuXG28",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "vuejs-essentials-q1",
          prompt: "In the Composition API, what does ref(0) return?",
          options: [
            "A plain number",
            "A template reference to a DOM node only",
            "A reactive wrapper you read and write through .value in script, unwrapped automatically in templates",
            "A computed getter that can't be changed",
          ],
          correctIndex: 2,
          explanation:
            "ref() wraps a value in a reactive object; writing .value triggers updates wherever it's used.",
        },
        {
          id: "vuejs-essentials-q2",
          prompt: "What is <script setup>?",
          options: [
            "A block that runs only during server-side rendering",
            "Compile-time sugar for the Composition API in single-file components, where top-level bindings are available to the template",
            "The required entry point for the Options API",
            "A way to register global components",
          ],
          correctIndex: 1,
          explanation:
            "<script setup> removes setup() boilerplate: imports, variables and functions declared at the top level are usable in the template.",
        },
        {
          id: "vuejs-essentials-q3",
          prompt: "When should you use computed() instead of calling a method in the template?",
          options: [
            "For derived values that should be cached and only recalculated when their reactive dependencies change",
            "For anything that makes a network request",
            "Whenever you need to mutate state",
            "Only inside Pinia stores",
          ],
          correctIndex: 0,
          explanation:
            "Computed refs cache their result; a method call runs again on every re-render.",
        },
        {
          id: "vuejs-essentials-q4",
          prompt: "What is Pinia?",
          options: [
            "Vue's official router",
            "A component testing library",
            "Vue's official state management library, with stores created by defineStore()",
            "A CSS framework for Vue",
          ],
          correctIndex: 2,
          explanation: "Pinia is the recommended store for Vue 3, replacing Vuex.",
        },
        {
          id: "vuejs-essentials-q5",
          prompt: "Which directive creates two-way binding between a form input and state?",
          options: ["v-bind", "v-on", "v-if", "v-model"],
          correctIndex: 3,
          explanation:
            "v-model binds the input's value and listens for its input events in one directive.",
        },
      ],
    },
    {
      id: "frontend-testing",
      trackId: "frontend",
      title: "Frontend Testing",
      summary:
        "Unit tests with Vitest, component tests that query the DOM the way users do (getByRole) with React Testing Library, and end-to-end checks in real browsers with Playwright.",
      level: "advanced",
      estMinutes: 90,
      isMilestone: true,
      webRef: { label: "Testing Library docs", url: "https://testing-library.com/docs/" },
      videoRef: {
        label: "Programming with Mosh: React Testing for Beginners (Vitest + RTL)",
        url: "https://www.youtube.com/watch?v=8Xwq35cPwYg",
      },
      challengeType: "code",
      codeChallenge: {
        instructions: `Vitest and Jest let you add custom matchers with \`expect.extend\`. A matcher is a plain function that returns \`{ pass, message }\`. Write \`toBeWithinRange(received, floor, ceiling)\`:

- \`pass\` is \`true\` when \`floor <= received <= ceiling\` (inclusive)
- When it passes, \`message\` is \`"expected <received> not to be within range <floor> - <ceiling>"\` (that's what \`.not\` shows)
- When it fails, \`message\` is \`"expected <received> to be within range <floor> - <ceiling>"\`

Real matchers return \`message\` as a function; a plain string keeps this exercise simple.`,
        starterCode: `/**
 * Custom matcher logic, used in a test like:
 *   expect.extend({ toBeWithinRange });
 *   expect(response.durationMs).toBeWithinRange(0, 200);
 */
function toBeWithinRange(received, floor, ceiling) {
  // Your code here
  return { pass: false, message: "" };
}
`,
        functionName: "toBeWithinRange",
        testCases: [
          {
            description: "passes for a value inside the range",
            args: [15, 10, 20],
            expected: { pass: true, message: "expected 15 not to be within range 10 - 20" },
          },
          {
            description: "fails for a value above the range",
            args: [25, 10, 20],
            expected: { pass: false, message: "expected 25 to be within range 10 - 20" },
          },
          {
            description: "the range is inclusive",
            args: [10, 10, 20],
            expected: { pass: true, message: "expected 10 not to be within range 10 - 20" },
          },
        ],
      },
    },
  ],
};
