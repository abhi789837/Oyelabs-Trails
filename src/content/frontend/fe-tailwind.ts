import type { Module } from "@/types/curriculum";

export default {
  id: "fe-tailwind",
  trackId: "frontend",
  name: "Tailwind CSS",
  description:
    "Tailwind CSS v4.3 taught the way it works now: CSS-first configuration with `@import \"tailwindcss\"`, `@theme` and `@custom-variant`, automatic source detection, variants from breakpoints and container queries to `group`, `peer`, `has`, `data` and `aria`, dark mode strategies, component extraction and class merging, and plugins. Many popular videos still teach v3's `tailwind.config.js`, so every summary spells out what changed.",
  refs: [
    { label: "Tailwind CSS: Installation with Vite", url: "https://tailwindcss.com/docs/installation/using-vite", kind: "docs" },
    { label: "Tailwind CSS: Upgrade guide (v3 to v4)", url: "https://tailwindcss.com/docs/upgrade-guide", kind: "docs" },
    { label: "Tailwind CSS blog: Tailwind CSS v4.0", url: "https://tailwindcss.com/blog/tailwindcss-v4", kind: "article" },
    { label: "Tailwind CSS blog: Tailwind CSS v4.3", url: "https://tailwindcss.com/blog/tailwindcss-v4-3", kind: "article" },
    { label: "tailwind-merge", url: "https://github.com/dcastil/tailwind-merge", kind: "repo" },
  ],
  topics: [
    {
      id: "tw-utility-first",
      moduleId: "fe-tailwind",
      trackId: "frontend",
      title: "Utility-First Fundamentals",
      summary:
        "Utility-first CSS replaces \"name a thing, then style the name\" with single-purpose classes applied in markup. The payoff is locality and constraint: styles live on the element they affect, values come from a shared scale, you never invent a class name, and deleting markup deletes its styles. The costs are long class attributes and repetition, which you manage with components and loops rather than new CSS. Unlike inline styles, utilities can target hover, focus and breakpoints, and they draw on design tokens instead of magic numbers.\n\nTailwind v4 is configured in CSS, not JavaScript: install `tailwindcss` with `@tailwindcss/vite` (or the PostCSS plugin or CLI) and write `@import \"tailwindcss\";`. There is no `content` array. The engine scans your project as plain text, skipping `.gitignore`d files, `node_modules`, binaries, CSS and lockfiles, and generates CSS only for tokens it recognises. Because it never runs your code, `bg-${color}-500` produces nothing; map props to complete class strings instead, use `@source` to scan an ignored package, and `@source inline()` to safelist. Arbitrary values (`top-[117px]`, `grid-cols-[1fr_2fr]`, with `_` for spaces), the CSS variable shorthand `bg-(--brand)` (v3 wrote `bg-[--brand]`) and arbitrary properties (`[mask-type:luminance]`) cover the gaps.\n\nTwo gotchas. When two utilities set the same property, the one later in the generated stylesheet wins, not the one later in the class attribute, so `class=\"grid flex\"` is a grid. And v4 renamed utilities: v3's `shadow-sm` is now `shadow-xs` and `shadow` is `shadow-sm` (likewise for `rounded`, `blur` and `drop-shadow`), `outline-none` became `outline-hidden`, `ring` is 1px (use `ring-3`), borders default to `currentColor`, and the important modifier moved to the end (`bg-red-500!`).",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Tailwind CSS: Styling with utility classes", url: "https://tailwindcss.com/docs/styling-with-utility-classes", kind: "docs" },
        { label: "Tailwind CSS: Detecting classes in source files", url: "https://tailwindcss.com/docs/detecting-classes-in-source-files", kind: "docs" },
        { label: "Adam Wathan: CSS Utility Classes and \"Separation of Concerns\"", url: "https://adamwathan.me/css-utility-classes-and-separation-of-concerns/", kind: "article" },
      ],
      video: {
        title: "Learn Tailwind CSS – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=ft30zcMlFao",
        videoId: "ft30zcMlFao",
        durationLabel: "4:12:18",
        startSeconds: 156,
        chapterLabel: "Setup",
      },
      alternateVideos: [
        {
          title: "Tailwind CSS v4 Full Course 2026 | Master Tailwind in One Hour",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=6biMWgD6_JY",
          videoId: "6biMWgD6_JY",
          durationLabel: "54:20",
          startSeconds: 275,
          chapterLabel: "How does Tailwind work?",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tw-utility-first-q1",
          prompt:
            "Assuming `bg-red-500` appears nowhere else in the project, what background does this render with `color=\"red\"`?\n\n```jsx\nfunction Badge({ color }) {\n  return <span className={`bg-${color}-500 px-2`}>New</span>;\n}\n```",
          options: [
            "No background colour: `bg-red-500` never appears as a complete string, so its CSS is never generated",
            "Red, because Tailwind evaluates the template literal at build time",
            "Red in development, but nothing in production",
            "A build error for the dynamic class name",
          ],
          correctIndex: 0,
          explanation:
            "Tailwind scans source files as plain text and only sees `bg-`, `-500` and `px-2`. Map props to complete class names (`{ red: \"bg-red-500\" }[color]`) so the full strings are in the source.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-utility-first-q2",
          prompt: "An element has `class=\"grid flex\"`. What is its `display` value?",
          options: [
            "`grid`, because `.grid` is emitted after `.flex` in the generated stylesheet",
            "`flex`, because it comes last in the class attribute",
            "`grid`, because it comes first in the class attribute",
            "It depends on which class the browser parses first",
          ],
          correctIndex: 0,
          explanation:
            "Both classes have the same specificity, so the cascade picks the rule that appears later in the CSS, and Tailwind decides that order. The order of names in the attribute is irrelevant, which is why you shouldn't apply two conflicting utilities.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-utility-first-q3",
          prompt: "Which files does Tailwind v4's automatic source detection skip by default? (Select all that apply.)",
          options: [
            "Files listed in `.gitignore`",
            "Anything inside `node_modules`",
            "CSS files",
            "`.vue` and `.svelte` components",
            "Markdown files",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Tailwind scans every file in the project except gitignored files, `node_modules`, binary files, CSS files and common lockfiles. Framework components and Markdown are scanned like any other text.",
        },
        {
          id: "tw-utility-first-q4",
          prompt:
            "Your app uses an internal component library, `@acme/ui`, installed in `node_modules` and styled with Tailwind classes. Its classes are missing from your CSS. What's the v4 fix?",
          options: [
            "Add `@source \"../node_modules/@acme/ui\";` to your main stylesheet",
            "Add the path to a `content` array in `tailwind.config.js`",
            "Import the library's CSS file with `@import`",
            "Remove `node_modules` from `.gitignore`",
          ],
          correctIndex: 0,
          explanation:
            "`@source` registers extra paths (relative to the stylesheet) for scanning. v4 doesn't auto-detect a JS config, and un-ignoring `node_modules` would make Tailwind scan every dependency.",
        },
        {
          id: "tw-utility-first-q5",
          prompt:
            "A v3 project used `shadow-sm` on inputs and `shadow` on cards. You upgrade to v4 without touching the markup. What happens to the inputs?",
          options: [
            "They get a larger shadow, because v4's `shadow-sm` is the old `shadow`; they should use `shadow-xs`",
            "Nothing: `shadow-sm` means the same in both versions",
            "They lose their shadow, because `shadow-sm` was removed",
            "The build fails on the deprecated class",
          ],
          correctIndex: 0,
          explanation:
            "v4 renamed the scales so every step has a name: `shadow-sm` became `shadow-xs`, and bare `shadow` became `shadow-sm` (the same happened to `rounded`, `blur` and `drop-shadow`). The old names still compile, so the change is silent. The upgrade tool rewrites them for you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-utility-first-q6",
          prompt: "In v4, how do you set `background-color: var(--brand-color)` with a utility?",
          options: ["`bg-(--brand-color)`", "`bg-[--brand-color]`", "`bg-{--brand-color}`", "`bg-var(--brand-color)`"],
          correctIndex: 0,
          explanation:
            "v4 uses parentheses as shorthand for `var()`. The v3 bracket form `bg-[--brand-color]` became ambiguous with newer CSS syntax, so the upgrade guide replaces it; `bg-[var(--brand-color)]` also works.",
        },
        {
          id: "tw-utility-first-q7",
          prompt: "How do you write `grid-template-columns: 1fr 500px 2fr` as an arbitrary value?",
          options: ["`grid-cols-[1fr_500px_2fr]`", "`grid-cols-[1fr,500px,2fr]`", "`grid-cols-[1fr 500px 2fr]`", "`grid-cols-(1fr_500px_2fr)`"],
          correctIndex: 0,
          explanation:
            "Class names can't contain spaces, so Tailwind converts underscores to spaces in arbitrary values. v3's special case that turned commas into spaces in `grid-cols-*` is gone in v4.",
        },
        {
          id: "tw-utility-first-q8",
          prompt: "Which of these changed from v3 to v4? (Select all that apply.)",
          options: [
            "`border` without a colour now uses `currentColor` instead of gray-200",
            "The important modifier goes at the end: `flex!`",
            "A bare `ring` is now 1px wide, so the old 3px ring is `ring-3`",
            "`@tailwind base; @tailwind components; @tailwind utilities;` is still the recommended entry point",
            "`tailwind.config.js` is detected automatically when present",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "v4 imports Tailwind with `@import \"tailwindcss\"` and only loads a JS config through an explicit `@config`. The border, ring and important-modifier changes are silent visual or syntax changes worth checking after an upgrade.",
        },
        {
          id: "tw-utility-first-q9",
          prompt: "What can a utility class do that an inline `style` attribute can't?",
          options: [
            "Apply a style only on hover, focus or above a breakpoint",
            "Set a single CSS property on a single element",
            "Override a rule from a stylesheet with higher specificity",
            "Avoid shipping any CSS at all",
          ],
          correctIndex: 0,
          explanation:
            "Inline styles can't express pseudo-classes or media queries, while variants like `hover:` and `md:` can. Inline styles actually beat stylesheet rules on specificity, and utilities do ship CSS (only what's used).",
        },
        {
          id: "tw-utility-first-q10",
          prompt: "`text-(--my-var)` is generated as a text colour, but you want the variable used as a font size. What do you write?",
          options: ["`text-(length:--my-var)`", "`text-size-(--my-var)`", "`font-(--my-var)`", "`text-[--my-var]!`"],
          correctIndex: 0,
          explanation:
            "`text-*` covers both colour and font size, and with a bare variable Tailwind can't tell which you mean, so it defaults to colour. A CSS data-type hint (`length:`, `color:`) resolves the ambiguity.",
        },
      ],
    },
    {
      id: "tw-responsive-variants",
      moduleId: "fe-tailwind",
      trackId: "frontend",
      title: "Responsive Variants & Container Queries",
      summary:
        "Tailwind's breakpoints are mobile-first `min-width` media queries: unprefixed utilities apply everywhere, and `md:flex` means \"from 48rem up\", not \"on medium screens\". So `sm:text-center` doesn't centre text on phones; write the mobile style unprefixed and override upward. Every breakpoint also has a `max-*` variant, and stacking makes ranges: `md:max-lg:flex` applies only in the md band. In v4 breakpoints are theme variables (`--breakpoint-sm: 40rem` and so on) set in `@theme`, so you add `--breakpoint-3xl`, remove one with `--breakpoint-2xl: initial`, or reset them all with `--breakpoint-*: initial`. Keep them in one unit: mixing `px` with the default `rem` values can sort the generated media queries in the wrong order. One-offs use `min-[320px]:` and `max-[600px]:`.\n\nViewport breakpoints answer the wrong question for reusable components: the same card in a sidebar and in the main column sees the same viewport. Container queries, in core since v4 (v3 needed a plugin), let children respond to their container. Mark the parent `@container`, use `@sm:`, `@md:` or `@max-md:` on descendants, name nested containers (`@container/main` with `@lg/main:`), and use `@min-[475px]:` for one-offs. Container sizes come from `--container-*`, so `@sm` is 24rem, not the 40rem of `sm:`.\n\nThe trade-off is containment. `@container` sets `container-type: inline-size`, so the container's width can't depend on its contents: inside a shrink-to-fit parent (an auto-width flex item, a float, an inline-block) it can collapse to zero, and it needs a width from its layout. Queries on height, or `cqb`/`cqh` units, need a size container, which v4.3 adds as `@container-size`.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "Tailwind CSS: Responsive design", url: "https://tailwindcss.com/docs/responsive-design", kind: "docs" },
        { label: "MDN: CSS container queries", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries", kind: "docs" },
        { label: "Josh W. Comeau: A Friendly Introduction to Container Queries", url: "https://www.joshwcomeau.com/css/container-queries-introduction/", kind: "article" },
      ],
      video: {
        title: "Tailwind CSS v4 Full Course 2026 | Master Tailwind in One Hour",
        channel: "JavaScript Mastery",
        url: "https://www.youtube.com/watch?v=6biMWgD6_JY",
        videoId: "6biMWgD6_JY",
        durationLabel: "54:20",
        startSeconds: 1405,
        chapterLabel: "Media Queries & Responsive Design",
      },
      alternateVideos: [
        {
          title: "\"Smart\" design patterns with container queries",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=DHj7JhH8ins",
          videoId: "DHj7JhH8ins",
          durationLabel: "15:26",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tw-responsive-variants-q1",
          prompt: "A heading has `class=\"sm:text-center\"`. How is it aligned on a 375px-wide phone?",
          options: [
            "Not centred: `sm:` applies from 40rem (640px) up, so the phone gets the default alignment",
            "Centred, because `sm:` targets small screens",
            "Centred only in portrait orientation",
            "Centred, because unprefixed and `sm:` utilities both apply below 640px",
          ],
          correctIndex: 0,
          explanation:
            "Breakpoint variants are `min-width` queries. Style mobile with unprefixed utilities and override at larger breakpoints: `text-center sm:text-left`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-responsive-variants-q2",
          prompt: "Which class makes an element `display: flex` only between the `md` and `lg` breakpoints?",
          options: ["`md:max-lg:flex`", "`md-lg:flex`", "`md:flex lg:flex`", "`between-md-lg:flex`"],
          correctIndex: 0,
          explanation:
            "Stacking a breakpoint variant with the `max-*` variant of the next breakpoint targets a range. `md:flex lg:flex` applies from md upward with no upper bound.",
        },
        {
          id: "tw-responsive-variants-q3",
          prompt: "Which statements about container queries in Tailwind v4 are true? (Select all that apply.)",
          options: [
            "A parent needs the `@container` class before descendants can use `@md:` and friends",
            "`@md:` applies when the container is at least 28rem wide",
            "Nested containers can be named, as in `@container/sidebar` with `@lg/sidebar:`",
            "They still require the `@tailwindcss/container-queries` plugin",
            "`@md:` uses the same width as the `md:` viewport breakpoint",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Container queries moved into core in v4. Container sizes come from the `--container-*` scale, which is smaller than the breakpoint scale (`@md` is 28rem, `md` is 48rem), a common source of confusion.",
        },
        {
          id: "tw-responsive-variants-q4",
          prompt:
            "You add `--breakpoint-xs: 480px;` to `@theme` while keeping the default breakpoints. Some `xs:` styles unexpectedly override `sm:` styles. Why?",
          options: [
            "Mixing units with the default rem breakpoints can sort the generated media queries in the wrong order; define it as `30rem`",
            "`xs` is a reserved name that always sorts last",
            "Custom breakpoints are emitted as `max-width` queries",
            "Breakpoints can't be smaller than `sm`",
          ],
          correctIndex: 0,
          explanation:
            "Tailwind orders breakpoint variants by their values, and it can't reliably compare `px` with `rem`. Keep every breakpoint in the same unit as the defaults.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-responsive-variants-q5",
          prompt: "How do you remove the default `2xl` breakpoint in v4?",
          options: [
            "Set `--breakpoint-2xl: initial;` inside `@theme`",
            "Delete `2xl` from `theme.screens` in `tailwind.config.js`",
            "Add `@source not \"2xl\";`",
            "Set `--breakpoint-2xl: none;` in `:root`",
          ],
          correctIndex: 0,
          explanation:
            "Setting a theme variable to `initial` removes it and the variant it drives; `--breakpoint-*: initial` clears the whole namespace. Variables in `:root` don't affect which variants exist.",
        },
        {
          id: "tw-responsive-variants-q6",
          prompt:
            "You add `@container` to a card that sits in a flex row with no explicit width. The card collapses to zero width. Why?",
          options: [
            "`@container` applies inline-size containment, so the card's contents no longer contribute to its width",
            "Container queries only work on grid children",
            "`@container` sets `display: contents`",
            "Tailwind adds `width: 0` to containers until a query matches",
          ],
          correctIndex: 0,
          explanation:
            "A query container can't size itself from its children (that would be circular), so in a shrink-to-fit context it has no intrinsic width. Give it a width from the layout, for example `flex-1` or `w-full`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-responsive-variants-q7",
          prompt:
            "A child uses `h-[50cqb]` inside a parent marked `@container`, but its height doesn't follow the parent's height. What's the v4.3 fix?",
          options: [
            "Mark the parent `@container-size`, which creates a size container that exposes its block size",
            "Replace `cqb` with `vh`",
            "Add `h-full` to the parent",
            "Use `@container/height` on the parent",
          ],
          correctIndex: 0,
          explanation:
            "`@container` creates an inline-size container, which only provides width information. Units such as `cqb` and `cqh` need a size container, which v4.3 added as `@container-size`.",
        },
        {
          id: "tw-responsive-variants-q8",
          prompt: "What media query does `max-md:hidden` generate?",
          options: ["`@media (width < 48rem)`", "`@media (width >= 48rem)`", "`@media (max-width: 768px) and (hover: hover)`", "`@container (width < 28rem)`"],
          correctIndex: 0,
          explanation:
            "`max-*` variants are strict less-than queries at the breakpoint value, so `max-md` and `md` never overlap.",
        },
        {
          id: "tw-responsive-variants-q9",
          prompt: "You need a one-off layout change at 900px that doesn't belong in the theme. What do you write?",
          options: ["`min-[900px]:grid-cols-3`", "`screen-900:grid-cols-3`", "`md900:grid-cols-3`", "`@900:grid-cols-3`"],
          correctIndex: 0,
          explanation:
            "`min-[...]` and `max-[...]` create arbitrary breakpoints on the fly. For recurring breakpoints, add a `--breakpoint-*` theme variable instead.",
        },
        {
          id: "tw-responsive-variants-q10",
          prompt: "When do container queries beat viewport breakpoints?",
          options: [
            "When a component is reused in regions of different widths, like a card in both a sidebar and the main column",
            "When styling the page-level layout shell",
            "When supporting browsers from before 2020",
            "When the element's own width depends on its content",
          ],
          correctIndex: 0,
          explanation:
            "Container queries make components respond to the space they're given rather than the window. Page-level layout still suits viewport breakpoints, and content-sized elements can't be query containers.",
        },
      ],
    },
    {
      id: "tw-state-variants",
      moduleId: "fe-tailwind",
      trackId: "frontend",
      title: "State Variants: hover, focus, group, peer, has, data & aria",
      summary:
        "Variants are selector or at-rule templates stacked in front of a utility: `hover:`, `focus-visible:`, `disabled:`, `first:`, `odd:`, pseudo-elements like `before:` and `placeholder:`, and media features like `motion-reduce:`. In v4 they apply left to right like nested CSS (v3 went right to left, which matters for order-sensitive stacks such as `*:first:`), and `hover:` only applies under `@media (hover: hover)`, so touch devices no longer get sticky hover states. Prefer `focus-visible:` for focus rings that shouldn't appear after a mouse click.\n\nRelational variants let markup respond to other elements without JavaScript. Mark a parent `group` and use `group-hover:` in children, naming groups (`group/item`, `group-hover/item:`) when they nest; `in-*` needs no marker class but reacts to any ancestor. `peer` does the same for siblings, but only previous siblings, because CSS's `~` combinator only looks forward, so the peer must come first in the DOM. `has-*` wraps `:has()` to style an element by its descendants (`has-checked:`, `has-[img]:`), with `group-has-*` and `peer-has-*` versions, and `not-*` negates (`hover:not-focus:`).\n\nState that lives in attributes is best styled from them. `data-active:` matches a bare `data-active` attribute and `data-[state=open]:` a value, while `aria-expanded:` and `aria-checked:` style the ARIA state you already set for assistive technology, so visuals and semantics can't drift; headless UI libraries expose state exactly this way. Arbitrary variants (`[&.is-dragging]:cursor-grabbing`) and `@custom-variant` cover the rest. One gotcha: a parent's `*:` styles beat a utility on the child itself, because the child rules are generated later with the same specificity.",
      level: "advanced",
      estMinutes: 50,
      webRefs: [
        { label: "Tailwind CSS: Hover, focus, and other states", url: "https://tailwindcss.com/docs/hover-focus-and-other-states", kind: "docs" },
        { label: "MDN: :has()", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has", kind: "docs" },
        { label: "MDN: Subsequent-sibling combinator", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Subsequent-sibling_combinator", kind: "docs" },
        { label: "Josh W. Comeau: The Undeniable Utility Of CSS :has", url: "https://www.joshwcomeau.com/css/has/", kind: "article" },
      ],
      video: {
        title: "Learn Tailwind CSS – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=ft30zcMlFao",
        videoId: "ft30zcMlFao",
        durationLabel: "4:12:18",
        startSeconds: 14191,
        chapterLabel: "Core concepts",
      },
      alternateVideos: [
        {
          title: "10 Tailwind Tricks You NEED To Know!",
          channel: "Ravi Ships",
          url: "https://www.youtube.com/watch?v=aSlK3GhRuXA",
          videoId: "aSlK3GhRuXA",
          durationLabel: "10:45",
          startSeconds: 12,
          chapterLabel: "1 - Peer and Group",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tw-state-variants-q1",
          prompt:
            "Does the label text turn red when the email is invalid?\n\n```html\n<label>\n  <span class=\"peer-invalid:text-red-600\">Email</span>\n  <input type=\"email\" class=\"peer\" />\n</label>\n```",
          options: [
            "No: `peer-*` only works when the peer is a previous sibling, and here the input comes after the span",
            "Yes: `peer` works for any sibling",
            "Yes, but only after the input loses focus",
            "No: `peer-invalid` requires a `<form>` element",
          ],
          correctIndex: 0,
          explanation:
            "`peer-invalid:` compiles to a selector using the subsequent-sibling combinator (`.peer:invalid ~ *`), which can only reach elements after the peer. Put the input first (and reorder visually if needed), or make the label a `group` and give the span `group-has-invalid:text-red-600`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-state-variants-q2",
          prompt:
            "In a list where each row is inside a hoverable card, a \"Call\" link should appear only when its own row is hovered, not when the whole card is. The card already uses `group`. What do you write?",
          options: [
            "Give each row `group/item` and the link `invisible group-hover/item:visible`",
            "Give the link `invisible group-hover:visible`",
            "Give the link `invisible hover:visible`",
            "Give each row `peer` and the link `peer-hover:visible`",
          ],
          correctIndex: 0,
          explanation:
            "Plain `group-hover:` compiles to `:where(.group):hover *`, so it reacts to any hovered `.group` ancestor, including the card. A named group (`group/item`) ties the variant to one specific ancestor. Hovering the invisible link itself isn't practical, and `peer` needs a sibling.",
        },
        {
          id: "tw-state-variants-q3",
          prompt:
            "Given `<button aria-expanded=\"true\" data-state=\"open\" class=\"...\">`, which of these classes apply? (Select all that apply.)",
          options: [
            "`aria-expanded:bg-sky-700`",
            "`data-[state=open]:rotate-180`",
            "`data-open:ring-2`",
            "`aria-[expanded=false]:opacity-50`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`aria-expanded:` matches `[aria-expanded=\"true\"]` and `data-[state=open]:` matches that attribute value. `data-open:` checks for a `data-open` attribute, which this element doesn't have, a frequent mix-up with libraries that set `data-state=\"open\"`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-state-variants-q4",
          prompt:
            "After upgrading to v4, a dropdown that opened via `group-hover:block` no longer opens when tapped on phones. What changed?",
          options: [
            "`hover` variants now only apply when the primary input supports hover (`@media (hover: hover)`)",
            "`group-hover` was removed in v4",
            "Touch events are no longer mapped to `:hover` by mobile browsers",
            "v4 requires `touch:` variants for mobile",
          ],
          correctIndex: 0,
          explanation:
            "v4 wraps `hover:` in a hover media query so taps don't leave sticky hover styles. Treat hover as an enhancement and open menus on click or focus, or override the variant with `@custom-variant hover (&:hover);`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-state-variants-q5",
          prompt: "In v4, which class removes the top padding from only the first direct child of a `<ul>`?",
          options: ["`*:first:pt-0`", "`first:*:pt-0`", "`first-child:pt-0`", "`[&>li]:pt-0`"],
          correctIndex: 0,
          explanation:
            "v4 applies stacked variants left to right: `*:first:` means \"children that are the first child\". `first:*:` means \"children of the ul, when the ul is itself a first child\". v3 read them the other way round, so these classes swap meaning during an upgrade.",
        },
        {
          id: "tw-state-variants-q6",
          prompt:
            "What background does the first item get?\n\n```html\n<ul class=\"*:bg-sky-50\">\n  <li class=\"bg-red-50\">Sales</li>\n  <li>Marketing</li>\n</ul>\n```",
          options: [
            "Sky: the parent's `*:` rule is generated later with the same specificity, so it wins over the child's utility",
            "Red: a class on the element itself always beats inherited styles",
            "Red, because `bg-red-50` is more specific",
            "Neither, because the two conflict and cancel out",
          ],
          correctIndex: 0,
          explanation:
            "`*:bg-sky-50` compiles to `:is(.\\*\\:bg-sky-50 > *)`, whose specificity equals a single class, and child-selector rules are emitted after plain utilities. Tailwind's docs call this out: children can't override styles given to them by the parent's `*:` variant.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-state-variants-q7",
          prompt: "You want a focus ring for keyboard users but not after mouse clicks. Which variant do you use?",
          options: ["`focus-visible:ring-2`", "`focus:ring-2`", "`focus-within:ring-2`", "`active:ring-2`"],
          correctIndex: 0,
          explanation:
            "`:focus-visible` matches when the browser decides focus should be shown, which excludes most mouse clicks on buttons. `focus:` applies on every focus and `focus-within:` targets ancestors of the focused element.",
        },
        {
          id: "tw-state-variants-q8",
          prompt: "What's the trade-off of `in-focus:opacity-100` compared with `group-focus:opacity-100`?",
          options: [
            "`in-focus:` needs no `group` class on the parent but reacts to focus on any ancestor, so it's less precise",
            "`in-focus:` only works on direct parents",
            "`in-focus:` is the v3 name and is deprecated",
            "`in-focus:` requires JavaScript",
          ],
          correctIndex: 0,
          explanation:
            "`in-*` compiles to a `:where(...) &` selector that matches any ancestor in that state. When you need to target one specific ancestor, a (named) `group` is still the tool.",
        },
        {
          id: "tw-state-variants-q9",
          prompt: "A payment-method `<label>` contains a radio input. How do you highlight the label when its radio is checked, without JavaScript?",
          options: [
            "`has-checked:bg-indigo-50` on the label",
            "`checked:bg-indigo-50` on the label",
            "`peer-checked:bg-indigo-50` on the label, with `peer` on the radio inside it",
            "`group-checked:bg-indigo-50` on the radio",
          ],
          correctIndex: 0,
          explanation:
            "`has-checked:` compiles to `:has(:checked)` and styles an element based on its descendants. `checked:` applies to the checked element itself, and `peer` only reaches later siblings, not ancestors.",
        },
        {
          id: "tw-state-variants-q10",
          prompt: "How do you apply `cursor-grabbing` to an `<li>` only while it has the class `is-dragging`?",
          options: ["`[&.is-dragging]:cursor-grabbing`", "`is-dragging:cursor-grabbing`", "`group-[.is-dragging]:cursor-grabbing`", "`data-[is-dragging]:cursor-grabbing`"],
          correctIndex: 0,
          explanation:
            "An arbitrary variant is a selector template where `&` is the element, so `[&.is-dragging]` means \"this element when it also has `.is-dragging`\". The `group-[...]` form would look at an ancestor instead.",
        },
        {
          id: "tw-state-variants-q11",
          prompt: "Why style a disclosure button with `aria-expanded:` instead of toggling a separate `open` class from JavaScript?",
          options: [
            "The attribute you already have to set for screen readers drives the visuals too, so they can't get out of sync",
            "Attribute selectors are faster than class selectors",
            "`aria-*` variants work without the attribute being present",
            "Class names can't be toggled in React",
          ],
          correctIndex: 0,
          explanation:
            "With one source of truth, forgetting to update the ARIA state shows up as a visual bug instead of a silent accessibility bug. Performance isn't the reason; the variant only matches when the attribute is `\"true\"`.",
        },
      ],
    },
    {
      id: "tw-dark-mode",
      moduleId: "fe-tailwind",
      trackId: "frontend",
      title: "Dark Mode Strategies",
      summary:
        "Dark mode in Tailwind is the `dark:` variant; the strategy question is what activates it. By default in v4 it's the `prefers-color-scheme: dark` media query: no JavaScript, follows the OS, but users can't choose per site. For a toggle, redefine the variant in CSS with `@custom-variant dark (&:where(.dark, .dark *));` and put `class=\"dark\"` on `<html>`. The `:where()` adds zero specificity, so `dark:bg-black` beats `bg-white` purely by stylesheet order, and listing `.dark` as well as `.dark *` lets the `<html>` element itself match. A data attribute (`[data-theme=dark]`) works the same way and scales to more than two themes. This replaces v3's `darkMode: 'class'` (or `'selector'`) in `tailwind.config.js`.\n\nA three-way toggle (light, dark, system) stores an explicit choice in `localStorage`, falls back to `matchMedia('(prefers-color-scheme: dark)')`, and must run as an inline script in `<head>` before first paint. Setting the class from a React effect flashes the light theme first, and with server rendering the server can't know the choice unless it's in a cookie. When the choice is \"system\", listen for the media query's `change` event so the page follows the OS live.\n\nTwo things are easy to miss. Native UI (scrollbars, form controls, the page canvas) only turns dark if you set `color-scheme`, which Tailwind exposes as `scheme-dark` and `scheme-light-dark`. And `dark:` on every element doesn't scale: define semantic colours as CSS variables that your theme selectors switch (`:root { --surface: white } .dark { --surface: black }`), map them with `@theme inline { --color-surface: var(--surface); }`, and components just use `bg-surface`.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "Tailwind CSS: Dark mode", url: "https://tailwindcss.com/docs/dark-mode", kind: "docs" },
        { label: "MDN: prefers-color-scheme", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme", kind: "docs" },
        { label: "MDN: color-scheme", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme", kind: "docs" },
        { label: "Josh W. Comeau: The Quest for the Perfect Dark Mode", url: "https://www.joshwcomeau.com/react/dark-mode/", kind: "article" },
      ],
      video: {
        title: "Learn Tailwind CSS – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=ft30zcMlFao",
        videoId: "ft30zcMlFao",
        durationLabel: "4:12:18",
        startSeconds: 14726,
        chapterLabel: "Dark mode",
      },
      alternateVideos: [
        {
          title: "Tailwind CSS v4 Full Course 2026 | Master Tailwind in One Hour",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=6biMWgD6_JY",
          videoId: "6biMWgD6_JY",
          durationLabel: "54:20",
          startSeconds: 1786,
          chapterLabel: "Dark Mode in Tailwind",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tw-dark-mode-q1",
          prompt: "With a default Tailwind v4 setup and no custom variant, what activates `dark:` utilities?",
          options: [
            "The `prefers-color-scheme: dark` media query",
            "A `dark` class on the `<html>` element",
            "A `data-theme=\"dark\"` attribute",
            "Nothing: dark mode must be enabled in `tailwind.config.js` first",
          ],
          correctIndex: 0,
          explanation:
            "Out of the box `dark:` follows the operating system through the media query. Class- or attribute-based toggling requires overriding the variant with `@custom-variant`.",
        },
        {
          id: "tw-dark-mode-q2",
          prompt: "How do you switch a v4 project to class-based dark mode?",
          options: [
            "Add `@custom-variant dark (&:where(.dark, .dark *));` to your main CSS file",
            "Set `darkMode: 'class'` in `tailwind.config.js`",
            "Add `--dark-mode: class;` inside `@theme`",
            "Import `tailwindcss/dark-class.css`",
          ],
          correctIndex: 0,
          explanation:
            "v4 configures variants in CSS. The v3 config option only works if you explicitly load that JS config with `@config`, and it isn't the idiomatic v4 approach.",
        },
        {
          id: "tw-dark-mode-q3",
          prompt:
            "A project defines `@custom-variant dark (&:where(.dark *));`. What background does this element get?\n\n```html\n<html class=\"dark bg-white dark:bg-gray-950\">\n```",
          options: [
            "White: `.dark *` only matches descendants of `.dark`, not the `<html>` element that has the class",
            "Gray-950, because the element has the `dark` class",
            "Gray-950, because `dark:` utilities always win",
            "Transparent, because the two utilities cancel out",
          ],
          correctIndex: 0,
          explanation:
            "That's why the documented selector is `&:where(.dark, .dark *)`: the extra `.dark` branch lets the element carrying the class match too.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-dark-mode-q4",
          prompt:
            "A React app reads the saved theme from `localStorage` in a `useEffect` and then adds `dark` to `<html>`. Users with dark mode saved report a white flash on every load. Why, and what's the fix?",
          options: [
            "The page paints before the effect runs; apply the class with a small inline script in `<head>` before first paint",
            "`localStorage` is asynchronous; switch to `sessionStorage`",
            "Tailwind generates dark styles lazily; add `@source inline(\"dark:\")`",
            "The flash comes from the `hover` media query; override it with `@custom-variant`",
          ],
          correctIndex: 0,
          explanation:
            "Effects run after the browser has painted the initial HTML, which renders in light mode. A render-blocking inline script sets the class before anything is shown.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-dark-mode-q5",
          prompt: "You're building a light / dark / system theme switcher. Which parts belong in it? (Select all that apply.)",
          options: [
            "Store an explicit `\"light\"` or `\"dark\"` choice and remove the stored value when the user picks system",
            "When nothing is stored, decide with `matchMedia(\"(prefers-color-scheme: dark)\")`",
            "In system mode, listen for the media query's `change` event so the page follows OS switches live",
            "Put a `system` class on `<html>` and let Tailwind resolve it",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Tailwind only knows the selector you gave it; \"system\" is logic you implement by toggling the `dark` class from the media query. There's no built-in `system` class.",
        },
        {
          id: "tw-dark-mode-q6",
          prompt: "In dark mode your page is dark, but scrollbars, date pickers and select dropdowns stay light. What fixes it?",
          options: [
            "Set `color-scheme` for dark mode, for example `dark:scheme-dark` on `<html>` (or `scheme-light-dark`)",
            "Add `dark:bg-gray-900` to every form control",
            "Use `@custom-variant dark` with a media query instead of a class",
            "Nothing: native controls can't be themed",
          ],
          correctIndex: 0,
          explanation:
            "Browsers draw native UI according to the `color-scheme` property, not your background colours. Tailwind exposes it as `scheme-*` utilities.",
        },
        {
          id: "tw-dark-mode-q7",
          prompt:
            "With `@custom-variant dark (&:where(.dark, .dark *));`, an element inside `<html class=\"dark\">` has `class=\"bg-white dark:bg-black\"`. Why does `dark:bg-black` win?",
          options: [
            "`:where()` adds no specificity, so both rules weigh one class and the variant rule wins because Tailwind emits it later",
            "`dark:` utilities are marked `!important`",
            "The `:where()` selector has higher specificity than a single class",
            "The browser prefers rules with more selectors in them",
          ],
          correctIndex: 0,
          explanation:
            "Keeping specificity flat is deliberate: it means ordinary utilities, variants and your own overrides compose through stylesheet order instead of specificity wars.",
        },
        {
          id: "tw-dark-mode-q8",
          prompt: "A project uses `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`. How do you turn dark mode on for the whole page?",
          options: ["`<html data-theme=\"dark\">`", "`<html class=\"dark\">`", "`<html theme=\"dark\">`", "`<meta name=\"color-scheme\" content=\"dark\">`"],
          correctIndex: 0,
          explanation:
            "The variant matches whatever selector you defined, here the `data-theme` attribute. A `dark` class does nothing unless the variant references it.",
        },
        {
          id: "tw-dark-mode-q9",
          prompt:
            "A server-rendered app keeps the theme preference only in `localStorage`, so the server always renders light HTML. What's the most robust way to avoid the flash and hydration mismatches?",
          options: [
            "Store the preference in a cookie so the server can render the right class, keeping an inline script for the system fallback",
            "Read `localStorage` during server rendering",
            "Hide the page with `opacity-0` until React hydrates",
            "Render both themes and remove one after hydration",
          ],
          correctIndex: 0,
          explanation:
            "The server can read cookies but not `localStorage`. Hiding the page until hydration trades a flash for a slower first paint, and `localStorage` doesn't exist on the server.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-dark-mode-q10",
          prompt: "Design wants to add a third \"dim\" theme next quarter. Which approach scales best?",
          options: [
            "Semantic colour variables switched by theme selectors, mapped with `@theme inline { --color-surface: var(--surface); }`, so components use `bg-surface`",
            "Add `dim:` variants next to every `dark:` utility in the codebase",
            "Duplicate the stylesheet per theme",
            "Toggle Tailwind's `invert` filter on `<html>`",
          ],
          correctIndex: 0,
          explanation:
            "Components reference roles (surface, text, border) and each theme only redefines the variables, so a new theme touches one place. `inline` makes the utility use `var(--surface)` directly, so it resolves wherever the theme selector changes it.",
        },
      ],
    },
    {
      id: "tw-theme-customization",
      moduleId: "fe-tailwind",
      trackId: "frontend",
      title: "Customizing the Theme: @theme & CSS-First Config",
      summary:
        "In v4 the design system is CSS. Theme variables declared in `@theme` do two jobs: they become ordinary custom properties on `:root`, and they tell Tailwind which utilities and variants exist. Namespaces map to APIs: `--color-mint-500` creates `bg-mint-500`, `text-mint-500` and `fill-mint-500`; `--font-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--ease-*` and `--animate-*` drive their utilities; `--breakpoint-*` and `--container-*` create variants; and the single `--spacing` value drives every spacing and sizing utility (`p-4` is `calc(var(--spacing) * 4)`). Use `:root` for variables that shouldn't generate utilities. Redefine a variable to override it, set `--color-*: initial` to drop a namespace, or `--*: initial` for a fully custom theme. `@theme inline` inlines values that reference other variables, since `var()` otherwise resolves where the variable is defined, and `@theme static` emits every variable even when unused. Sharing a theme across a monorepo is just an `@import`.\n\nThis replaces `tailwind.config.js` and `theme.extend`. A JS config still loads through `@config`, but it isn't detected automatically, and `corePlugins`, `safelist` and `separator` are gone (safelist with `@source inline()`). `theme()` is deprecated in favour of `var(--color-red-500)`, with `--alpha()` and `--spacing()` as build-time helpers. Custom utilities use `@utility`, including functional ones via `--value()` (with `--default()` since v4.3), and custom variants use `@custom-variant`. Unlike v3, plain classes in `@layer utilities` or `@layer components` don't become variant-aware utilities.\n\nThe migration gotcha: separately bundled stylesheets, such as Vue or Svelte `<style>` blocks and CSS modules, can't see your theme or custom utilities. Add `@reference \"../app.css\";` (which imports definitions without duplicating CSS) or use the CSS variables directly.",
      level: "advanced",
      estMinutes: 60,
      isMilestone: true,
      webRefs: [
        { label: "Tailwind CSS: Theme variables", url: "https://tailwindcss.com/docs/theme", kind: "docs" },
        { label: "Tailwind CSS: Functions and directives", url: "https://tailwindcss.com/docs/functions-and-directives", kind: "docs" },
        { label: "Tailwind CSS: Adding custom styles", url: "https://tailwindcss.com/docs/adding-custom-styles", kind: "docs" },
        { label: "Tailwind CSS blog: Tailwind CSS v4.0", url: "https://tailwindcss.com/blog/tailwindcss-v4", kind: "article" },
      ],
      video: {
        title: "Learn Tailwind CSS – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=ft30zcMlFao",
        videoId: "ft30zcMlFao",
        durationLabel: "4:12:18",
        startSeconds: 1751,
        chapterLabel: "Customization",
      },
      alternateVideos: [
        {
          title: "The NEW CSS-first configuration with Tailwind CSS v4 (No more tailwind.config.js)",
          channel: "Lukas | Web Development & Design",
          url: "https://www.youtube.com/watch?v=bupetqS1SMU",
          videoId: "bupetqS1SMU",
          durationLabel: "9:43",
        },
        {
          title: "Tailwind CSS v4 for Beginners | Full Course 2026",
          channel: "Coder Coder",
          url: "https://www.youtube.com/watch?v=9I3JQ1q4IMk",
          videoId: "9I3JQ1q4IMk",
          durationLabel: "2:16:08",
          startSeconds: 6181,
          chapterLabel: "Custom Theme",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tw-theme-customization-q1",
          prompt: "You add `@theme { --color-mint-500: oklch(0.72 0.11 178); }`. What becomes available? (Select all that apply.)",
          options: [
            "`bg-mint-500`",
            "`text-mint-500`",
            "`var(--color-mint-500)` in your own CSS and inline styles",
            "A `mint-500:` variant",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The `--color-*` namespace feeds every colour utility, and theme variables are also emitted as real CSS variables. Colour variables don't create variants; `--breakpoint-*` and `--container-*` do.",
        },
        {
          id: "tw-theme-customization-q2",
          prompt: "A teammate adds `:root { --color-brand: #e11d48; }` and then writes `class=\"bg-brand\"`. What happens?",
          options: [
            "No background: variables in `:root` don't create utilities, only `@theme` variables do",
            "The background is `#e11d48`, because Tailwind reads every `--color-*` variable",
            "The build fails with an unknown utility error",
            "It works in development only",
          ],
          correctIndex: 0,
          explanation:
            "`@theme` exists precisely so that creating utilities is explicit. `:root` is the right place for variables that shouldn't map to classes, and an unknown class in markup is simply ignored.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-theme-customization-q3",
          prompt:
            "Your theme contains:\n\n```css\n@theme {\n  --color-*: initial;\n  --color-midnight: #121063;\n  --color-white: #fff;\n}\n```\n\nWhat happens to `bg-red-500` in your markup?",
          options: [
            "It's no longer generated: the whole default colour namespace was removed",
            "It still works, because defaults are always kept",
            "It falls back to `bg-midnight`",
            "The build fails because `bg-red-500` is used",
          ],
          correctIndex: 0,
          explanation:
            "Setting a namespace to `initial` drops every default in it, leaving only the values you define. `--*: initial` does the same for the entire theme.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-theme-customization-q4",
          prompt: "Why write `@theme inline { --font-sans: var(--font-inter); }` instead of plain `@theme`?",
          options: [
            "So `font-sans` uses `var(--font-inter)` directly; otherwise `var()` would resolve where `--font-sans` is defined, where `--font-inter` may not exist",
            "Inline themes are faster to compile",
            "Plain `@theme` can't reference other variables at all",
            "It embeds the font file into the CSS",
          ],
          correctIndex: 0,
          explanation:
            "CSS resolves a variable's `var()` references at the element where that variable is declared. With `inline`, the utility gets the referenced value itself, so it resolves correctly wherever `--font-inter` is set.",
        },
        {
          id: "tw-theme-customization-q5",
          prompt: "With `@theme { --spacing: 4px; }`, how much padding does `p-4` produce?",
          options: ["16px", "4px", "1rem, regardless of `--spacing`", "4rem"],
          correctIndex: 0,
          explanation:
            "Spacing utilities are multiples of the single `--spacing` variable: `p-4` compiles to `calc(var(--spacing) * 4)`. The default is `0.25rem`, which is why `p-4` is usually 1rem.",
        },
        {
          id: "tw-theme-customization-q6",
          prompt: "After upgrading to v4 with a manual install, your customised `tailwind.config.js` seems to be ignored. Why?",
          options: [
            "v4 doesn't detect JS configs automatically; load it with `@config \"./tailwind.config.js\";` or migrate it to `@theme`",
            "v4 reads only `tailwind.config.ts`, not `.js`",
            "The config must now live in `package.json`",
            "JS configs work only with the PostCSS plugin, not with Vite",
          ],
          correctIndex: 0,
          explanation:
            "JS configs are supported for compatibility but must be loaded explicitly. The upgrade tool (`npx @tailwindcss/upgrade`) migrates most configs to CSS for you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-theme-customization-q7",
          prompt: "Which JS config options are not supported in v4, even through `@config`? (Select all that apply.)",
          options: ["`corePlugins`", "`safelist`", "`separator`", "`theme.extend.colors`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Theme values from a JS config still load via `@config`, but `corePlugins`, `safelist` and `separator` were dropped. Safelisting moved to `@source inline()`.",
        },
        {
          id: "tw-theme-customization-q8",
          prompt: "Classes like `bg-red-500` and `hover:bg-red-600` are built from CMS data and never appear in your source files. How do you make sure v4 generates them?",
          options: [
            "`@source inline(\"{hover:,}bg-red-{500,600}\");`",
            "Add them to `safelist` in `tailwind.config.js`",
            "`@theme { --safelist: bg-red-500; }`",
            "Nothing: v4 generates every colour utility by default",
          ],
          correctIndex: 0,
          explanation:
            "`@source inline()` feeds brace-expanded class names to the engine as if they were in your source. v4 only generates what it detects.",
        },
        {
          id: "tw-theme-customization-q9",
          prompt:
            "A Vue single-file component contains `<style> h1 { @apply text-brand; } </style>`, and the build fails with \"Cannot apply unknown utility class\", although `text-brand` works in templates. What's the fix?",
          options: [
            "Add `@reference \"../app.css\";` at the top of the `<style>` block",
            "Use `@import \"../app.css\";` in the `<style>` block",
            "Move `--color-brand` from `@theme` to `:root`",
            "Rename the utility to `text-[brand]`",
          ],
          correctIndex: 0,
          explanation:
            "Component style blocks are processed separately and can't see the theme defined in your main stylesheet. `@reference` makes those definitions available without emitting the CSS again; `@import` would duplicate the whole stylesheet into the component.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-theme-customization-q10",
          prompt:
            "A v3 project defines `@layer utilities { .content-auto { content-visibility: auto; } }` and uses `hover:content-auto`. After upgrading to v4 the hover version stops working. What's the v4 way?",
          options: [
            "`@utility content-auto { content-visibility: auto; }`",
            "`@layer components { .content-auto { ... } }`",
            "Add `content-auto` to `@theme`",
            "Use `@apply hover:content-auto` in a base style",
          ],
          correctIndex: 0,
          explanation:
            "v4 uses native cascade layers and no longer treats classes inside `@layer utilities` as Tailwind utilities, so variants can't be applied to them. `@utility` registers a real utility that works with every variant.",
        },
        {
          id: "tw-theme-customization-q11",
          prompt: "Given `@utility gutter-* { --gutter: --value(integer); }`, which class is generated?",
          options: ["`gutter-4`", "`gutter-[3]`", "`gutter-1.5`", "`gutter-lg`"],
          correctIndex: 0,
          explanation:
            "`--value(integer)` accepts bare integers only. Arbitrary values need `--value([integer])`, a named value like `lg` needs a theme key such as `--value(--gutter-*)`, and `1.5` isn't an integer.",
        },
      ],
    },
    {
      id: "tw-apply-vs-components",
      moduleId: "fe-tailwind",
      trackId: "frontend",
      title: "Extracting Components: @apply vs Composition",
      summary:
        "Utility classes repeat, and the instinct is to hide the repetition in `.btn { @apply px-4 py-2 rounded-lg ...; }`. Tailwind's own guidance is the opposite: extract a component or template partial, which reuses markup and behaviour as well as styles and keeps every override visible where it's used. `@apply` still earns its place for styling third-party markup you can't add classes to, or a tiny element in a server template where a partial is overkill, and there plain CSS with theme variables (`var(--color-violet-500)`, `--spacing(5)`) inside `@layer components` is often clearer. In v4, `@apply` only accepts utilities Tailwind knows (built-in or `@utility`), classes in `@layer components` sit in a lower cascade layer so utilities still override them, and separately bundled styles need `@reference`.\n\nComposition moves the problem into class strings. A `Button` that accepts `className` gets conflicts: `px-4` from the component and `px-6` from the caller both apply, and the winner is whichever Tailwind emitted later, not the one written last. `tailwind-merge` (v3 for Tailwind v4) fixes this by sorting each class into a group, keeping the last one per group and variant context, allowing refinements (`p-3 px-5` keeps both) and knowing that `text-lg` and `text-red-500` don't conflict. `clsx` handles conditionals, the common `cn()` helper is `twMerge(clsx(...))`, and `cva` maps props like `size` and `intent` to class sets.\n\nMerging costs runtime and bundle size, and it guesses from naming patterns, so a custom class that looks like a utility can be dropped. For design-system components, prefer explicit variant props over open-ended `className` overrides. `prettier-plugin-tailwindcss` sorts classes into the order Tailwind emits them, which makes conflicting pairs easy to spot in review.",
      level: "advanced",
      estMinutes: 110,
      isMilestone: true,
      webRefs: [
        { label: "Tailwind CSS: Styling with utility classes (managing duplication and conflicts)", url: "https://tailwindcss.com/docs/styling-with-utility-classes", kind: "docs" },
        { label: "tailwind-merge: Features (merging behaviour)", url: "https://github.com/dcastil/tailwind-merge/blob/main/packages/tailwind-merge/docs/features.md", kind: "repo" },
        { label: "cva: Variants", url: "https://cva.style/getting-started/variants/", kind: "docs" },
        { label: "prettier-plugin-tailwindcss", url: "https://github.com/tailwindlabs/prettier-plugin-tailwindcss", kind: "repo" },
      ],
      video: {
        title: "Learn Tailwind CSS – Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=ft30zcMlFao",
        videoId: "ft30zcMlFao",
        durationLabel: "4:12:18",
        startSeconds: 11308,
        chapterLabel: "Design System",
      },
      alternateVideos: [
        {
          title: "Tailwind-Merge Is Incredibly Useful — And Here's Why!",
          channel: "simonswiss",
          url: "https://www.youtube.com/watch?v=tfgLd5ZSNPc",
          videoId: "tfgLd5ZSNPc",
          durationLabel: "12:58",
        },
        {
          title: "Tailwind CSS v4 Full Course 2026 | Master Tailwind in One Hour",
          channel: "JavaScript Mastery",
          url: "https://www.youtube.com/watch?v=6biMWgD6_JY",
          videoId: "6biMWgD6_JY",
          durationLabel: "54:20",
          startSeconds: 2081,
          chapterLabel: "Custom Styles & Reusability",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `mergeClasses(classList)`, a small `tailwind-merge`. When a component combines its own classes with ones passed in by a caller, the class written last should win for each property, whatever order Tailwind emits the rules in.\n\nSplit `classList` on any whitespace and return the surviving classes in their original order, joined by single spaces (`\"\"` for no classes).\n\nEach class is `variant:variant:...:base`, optionally ending in `!` (important). Split variants on `:` characters that aren't inside square brackets, so `[&:hover]:bg-[color:red]` has one variant. A class's context is its set of variants (order doesn't matter: `hover:focus:` equals `focus:hover:`) plus whether it's important. Classes in different contexts never conflict.\n\nKnown groups (`*` is any non-empty value); anything else is not a known utility and is always kept:\n\n- `display`: `block`, `inline-block`, `inline`, `flex`, `inline-flex`, `grid`, `inline-grid`, `contents`, `hidden`\n- Padding: `p-*`, `px-*`, `py-*`, `pt-*`, `pr-*`, `pb-*`, `pl-*`, each its own group. Margin: the same with `m`, and margins may be negative (`-mt-2`).\n- `w-*`, `h-*`, `size-*`, `leading-*`, and `bg-*` (treat every `bg-*` as a background colour)\n- `text-left`, `text-center`, `text-right`, `text-justify`, `text-start`, `text-end`: text alignment\n- `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl` to `text-9xl`, optionally followed by `/` and a line height (`text-lg/7`), or an arbitrary value starting with a digit (`text-[14px]`): font size\n- Any other `text-*`: text colour\n\nA class removes every earlier class in the same group and context. Some groups also override others: `p` overrides `px py pt pr pb pl`, `px` overrides `pr pl`, `py` overrides `pt pb` (the same for margins), `size` overrides `w` and `h`, and font size overrides `leading`. Overrides only reach backwards: `p-3 px-5` keeps both (a refinement), while `px-5 p-3` keeps only `p-3`.\n\nReal tailwind-merge knows hundreds of groups and treats a few variants (like `*` and arbitrary variants) as order-sensitive; ignore that here.",
        starterCode:
          "/**\n * A small tailwind-merge: the last class per group and variant context wins.\n * @param {string} classList e.g. \"px-2 py-1 p-3 hover:bg-red-500\"\n * @returns {string} surviving classes in their original order, separated by single spaces\n */\nfunction mergeClasses(classList) {\n  // Your code here\n}\n",
        functionName: "mergeClasses",
        testCases: [
          { description: "the last conflicting class wins", args: ["p-5 p-2 p-4"], expected: "p-4" },
          { description: "a later axis class refines an earlier shorthand, so both stay", args: ["p-3 px-5"], expected: "p-3 px-5" },
          { description: "a later shorthand overrides earlier axis classes", args: ["px-2 py-1 p-3"], expected: "p-3" },
          {
            description: "survivors keep their original order (the tailwind-merge README example)",
            args: ["px-2 py-1 bg-red-500 hover:bg-red-700 p-3 bg-[#B91C1C]"],
            expected: "hover:bg-red-700 p-3 bg-[#B91C1C]",
          },
          {
            description: "`text-*` splits into font-size, colour and alignment groups",
            args: ["text-lg text-red-500 text-center text-sm text-[#0f172a]"],
            expected: "text-center text-sm text-[#0f172a]",
          },
          { description: "an arbitrary length is a font size", args: ["text-[14px] text-base"], expected: "text-base" },
          {
            description: "variant order doesn't matter, but different variants are different contexts",
            args: ["hover:focus:p-2 focus:hover:p-4 p-1 md:p-6"],
            expected: "focus:hover:p-4 p-1 md:p-6",
          },
          { description: "important classes form their own context", args: ["p-3! p-4! p-5"], expected: "p-4! p-5" },
          {
            description: "a font size overrides earlier `leading-*`, but a later `leading-*` refines it",
            args: ["leading-6 text-sm text-lg/7 leading-8"],
            expected: "text-lg/7 leading-8",
          },
          { description: "`size-*` overrides earlier width and height; a later `w-*` refines it", args: ["w-4 h-4 size-8 w-2"], expected: "size-8 w-2" },
          { description: "negative margins share the margin groups", args: ["mt-4 -mt-2 m-1 mx-auto"], expected: "m-1 mx-auto" },
          {
            description: "stacked variants in either order are the same context",
            args: ["md:dark:bg-black dark:md:bg-white dark:bg-slate-900"],
            expected: "dark:md:bg-white dark:bg-slate-900",
          },
          { description: "an empty string returns an empty string", args: [""], expected: "", isEdgeCase: true },
          {
            description: "whitespace is normalised and unknown classes (even duplicates) are kept",
            args: ["  flex\n\tblock   card  inline-flex  card "],
            expected: "card inline-flex card",
            isEdgeCase: true,
          },
          {
            description: "colons inside square brackets aren't variant separators",
            args: ["[&:nth-child(3)]:py-0 [&:nth-child(3)]:py-4 md:py-2 bg-[color:var(--brand)] bg-white"],
            expected: "[&:nth-child(3)]:py-4 md:py-2 bg-white",
            isEdgeCase: true,
          },
          {
            description: "5,000 conflicting classes collapse to the last one per context",
            args: [Array.from({ length: 5000 }, (_, i) => `p-${i}`).join(" ") + " hover:p-1"],
            expected: "p-4999 hover:p-1",
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "tw-plugins",
      moduleId: "fe-tailwind",
      trackId: "frontend",
      title: "Tailwind Plugins in v4",
      summary:
        "In v3, plugins were the extension mechanism: JavaScript functions registered in `tailwind.config.js` that called `addUtilities`, `matchUtilities`, `addComponents`, `addBase` and `addVariant`. v4 moves most of that into CSS. A static or functional utility is `@utility`, with `--value()` and `--modifier()` resolving theme keys, bare values and arbitrary values; a variant is `@custom-variant`, using `@slot` when it needs nested rules; base styles go in `@layer base`; tokens go in `@theme`. Because these are plain CSS, they're versioned with the stylesheet, shared with `@import`, and understood by editor tooling.\n\nJavaScript plugins still work. Load them with `@plugin \"@tailwindcss/typography\";` (a package name or a local path), which the docs now list under v3 compatibility, and pass options in a CSS block: `@plugin \"@tailwindcss/forms\" { strategy: \"class\"; }` or `@plugin \"@tailwindcss/typography\" { className: wysiwyg; }`. Where a plugin and your CSS define the same thing, CSS takes precedence. Several v3 plugins are obsolete: container queries moved into core in v4, and aspect ratio and line clamp were already core utilities.\n\nThe first-party plugins are still worth knowing. Typography adds `prose` for HTML you don't control, like Markdown or CMS output, with element modifiers such as `prose-headings:`, `prose-invert` for dark backgrounds, and `not-prose` to opt a block out. Forms resets form controls to a consistent baseline that utilities can style. Before writing a plugin, reach for `@utility` or `@custom-variant`; a JavaScript plugin is worth it when you generate many classes from data or share a package across projects. And check that third-party plugins, especially component kits like daisyUI, explicitly support v4.",
      level: "advanced",
      estMinutes: 45,
      webRefs: [
        { label: "Tailwind CSS: Functions and directives (@plugin, @utility, @custom-variant)", url: "https://tailwindcss.com/docs/functions-and-directives", kind: "docs" },
        { label: "Tailwind CSS: Adding custom styles", url: "https://tailwindcss.com/docs/adding-custom-styles", kind: "docs" },
        { label: "tailwindcss-typography", url: "https://github.com/tailwindlabs/tailwindcss-typography", kind: "repo" },
        { label: "Tailwind CSS v3: Plugins (the JavaScript plugin API)", url: "https://v3.tailwindcss.com/docs/plugins", kind: "docs" },
      ],
      video: {
        title: "Effortless typography, even in dark mode — Tailwind CSS Typography v0.5",
        channel: "Tailwind Labs",
        url: "https://www.youtube.com/watch?v=GEYkwfYytAM",
        videoId: "GEYkwfYytAM",
        durationLabel: "7:12",
      },
      alternateVideos: [
        {
          title: "The NEW CSS-first configuration with Tailwind CSS v4 (No more tailwind.config.js)",
          channel: "Lukas | Web Development & Design",
          url: "https://www.youtube.com/watch?v=bupetqS1SMU",
          videoId: "bupetqS1SMU",
          durationLabel: "9:43",
          startSeconds: 102,
          chapterLabel: "Plugins",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "tw-plugins-q1",
          prompt: "How do you enable `@tailwindcss/typography` in a Tailwind v4 project?",
          options: [
            "`@plugin \"@tailwindcss/typography\";` in the main CSS file",
            "Add it to the `plugins` array in `tailwind.config.js`, which v4 detects automatically",
            "`@import \"@tailwindcss/typography\";`",
            "`@theme { --plugin: typography; }`",
          ],
          correctIndex: 0,
          explanation:
            "`@plugin` loads a JavaScript plugin by package name or local path. A JS config's `plugins` array only works if you load that config with `@config`, and importing the package as CSS doesn't run the plugin.",
        },
        {
          id: "tw-plugins-q2",
          prompt: "Which v3 plugin APIs have CSS-first replacements in v4? (Select all that apply.)",
          options: [
            "`addUtilities`, replaced by `@utility`",
            "`addVariant`, replaced by `@custom-variant`",
            "Extending `theme` in a plugin, replaced by `@theme` variables",
            "None for `matchUtilities`: utilities that take a value still need JavaScript",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Functional utilities are covered too: `@utility tab-* { tab-size: --value(integer); }` accepts values the way `matchUtilities` did, with `--modifier()` for modifiers.",
        },
        {
          id: "tw-plugins-q3",
          prompt: "You want `@tailwindcss/forms` to generate only opt-in classes (like `form-input`) instead of global base styles. How do you configure it in v4?",
          options: [
            "`@plugin \"@tailwindcss/forms\" { strategy: \"class\"; }`",
            "`@plugin \"@tailwindcss/forms?strategy=class\";`",
            "`@import \"@tailwindcss/forms/class.css\";`",
            "Options can only be passed through a JS config",
          ],
          correctIndex: 0,
          explanation:
            "v4 passes plugin options in a CSS block after `@plugin`. The same mechanism sets typography's `className`.",
        },
        {
          id: "tw-plugins-q4",
          prompt: "A v3 project depends on `@tailwindcss/container-queries`. What should you do when moving to v4?",
          options: [
            "Remove it: container queries are built in (`@container`, `@md:`, `@max-md:`)",
            "Load it with `@plugin`, since v4 has no container query support",
            "Replace it with `@tailwindcss/aspect-ratio`",
            "Keep it in `tailwind.config.js`; v4 picks it up automatically",
          ],
          correctIndex: 0,
          explanation:
            "v4 brought container queries into core, including max-width and named containers, so the plugin is obsolete. v3 had already made aspect ratio and line clamp core utilities.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-plugins-q5",
          prompt: "A live code demo inside an `<article class=\"prose\">` picks up unwanted typography styles. How do you exclude it?",
          options: [
            "Wrap the demo in an element with `not-prose`",
            "Add `prose-none` to the demo",
            "Give the demo `all-unset`",
            "Move `prose` to every paragraph individually",
          ],
          correctIndex: 0,
          explanation:
            "`not-prose` sandboxes a block from the typography styles. Note that you can't start a new `prose` region inside a `not-prose` block.",
        },
        {
          id: "tw-plugins-q6",
          prompt: "Your Markdown articles use `prose`. How do you make them readable on a dark background in dark mode?",
          options: ["`prose dark:prose-invert`", "`prose dark:text-white`", "`prose-dark`", "`prose dark:invert`"],
          correctIndex: 0,
          explanation:
            "`prose-invert` swaps the plugin's whole colour palette (headings, links, code, quotes) for a dark background. Setting `text-white` only changes inherited text colour, and the `invert` filter would also invert images.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "tw-plugins-q7",
          prompt: "Which of these justifies writing a JavaScript plugin rather than using CSS directives?",
          options: [
            "Generating a large family of utilities from a JSON token file, published as a package for several apps",
            "Adding one `content-auto` utility",
            "Adding a variant for `[data-theme=midnight]`",
            "Adding brand colours",
          ],
          correctIndex: 0,
          explanation:
            "Single utilities, variants and tokens are one-liners with `@utility`, `@custom-variant` and `@theme`. Programmatic generation from data, packaged for reuse, is where a JS plugin still pays off.",
        },
        {
          id: "tw-plugins-q8",
          prompt: "Which definition creates an `any-hover:` variant that applies on hover only when some input device can hover?",
          options: [
            "`@custom-variant any-hover { @media (any-hover: hover) { &:hover { @slot; } } }`",
            "`@custom-variant any-hover (&:hover);`",
            "`@utility any-hover { &:hover { @slot; } }`",
            "`@theme { --variant-any-hover: hover; }`",
          ],
          correctIndex: 0,
          explanation:
            "When a variant needs nested rules, the block form of `@custom-variant` uses `@slot` to mark where the utility's declarations go. The shorthand form takes a single selector, and `@utility` defines utilities, not variants.",
        },
        {
          id: "tw-plugins-q9",
          prompt: "A plugin and your own `@theme` block both define a value for the same theme key. Which one wins?",
          options: [
            "Your CSS: values defined in CSS take precedence over plugins and JS configs",
            "The plugin, because it loads after the theme",
            "Whichever appears last in the file",
            "Tailwind reports a conflict and stops the build",
          ],
          correctIndex: 0,
          explanation:
            "Tailwind merges CSS-defined configuration with plugins and configs where it can, and otherwise lets the CSS win, which is what makes incremental migration to CSS-first config safe.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
  ],
} satisfies Module;
