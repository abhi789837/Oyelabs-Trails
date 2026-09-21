import type { Module } from "@/types/curriculum";

export default {
  id: "fe-html-css",
  trackId: "frontend",
  name: "HTML & CSS Foundations",
  description:
    "The platform layer under every framework: semantic, accessible HTML and the CSS cascade, box model and layout algorithms, taught for engineers who already ship UI and want to know why it behaves the way it does.",
  refs: [
    { label: "MDN: Learn web development", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development", kind: "docs" },
    { label: "web.dev: Learn CSS", url: "https://web.dev/learn/css", kind: "article" },
    { label: "web.dev: Learn Accessibility", url: "https://web.dev/learn/accessibility", kind: "article" },
    { label: "Kevin Powell: CSS videos (YouTube)", url: "https://www.youtube.com/@KevinPowell", kind: "article" },
  ],
  topics: [
    {
      id: "html-semantic-structure",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "Semantic HTML & Document Structure",
      summary:
        "Semantic elements exist so machines can understand a page without seeing it. Browsers turn your markup into an accessibility tree: `<header>`, `<nav>`, `<main>`, `<aside>` and `<footer>` become landmarks that screen-reader users jump between, `<h1>`–`<h6>` become the outline they skim, and `<button>`, `<a href>` and form controls arrive with a role, keyboard behaviour and focusability built in. A `<div onclick>` gets none of that, so every piece has to be rebuilt with ARIA and JavaScript, and it usually isn't.\n\nThe details are where experienced developers slip. The HTML outline algorithm, which would have let every `<section>` restart at `<h1>`, was never implemented by browsers or assistive technology and is gone from the standard: heading level is the only structure that counts, so jumping from `<h2>` to `<h5>` for a smaller font is a real bug. A `<section>` is only exposed as a `region` landmark when it has an accessible name, and `<header>`/`<footer>` only map to banner/contentinfo when they aren't inside `<article>`, `<aside>`, `<main>`, `<nav>` or `<section>`. A document may have only one `<main>` without the `hidden` attribute.\n\nThe document shell matters as much as the body. Without `<!DOCTYPE html>` the page renders in quirks mode, which emulates old browser bugs such as unitless lengths being treated as pixels and tables not inheriting font size. `lang` on `<html>` drives screen-reader pronunciation, hyphenation and translation, and the viewport meta tag decides whether your media queries ever see a phone's real width. Pick elements for what they mean and style them afterwards: `<button>` for actions, `<a href>` for navigation, `<strong>` and `<em>` for importance and emphasis.",
      level: "intermediate",
      estMinutes: 70,
      webRefs: [
        { label: "MDN: Structuring documents", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Structuring_documents", kind: "docs" },
        { label: "HTML Standard: Sections", url: "https://html.spec.whatwg.org/multipage/sections.html", kind: "spec" },
        { label: "web.dev Learn HTML: Semantic HTML", url: "https://web.dev/learn/html/semantic-html", kind: "article" },
        { label: "W3C: ARIA in HTML (implicit roles)", url: "https://w3c.github.io/html-aria/", kind: "spec" },
      ],
      video: {
        title: "HTML Tutorial - Website Crash Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=916GWv2Qs08",
        videoId: "916GWv2Qs08",
        durationLabel: "45:19",
      },
      alternateVideos: [
        {
          title: "HTML section elements are a lie (sort of)",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=ULdkpU51hTQ",
          videoId: "ULdkpU51hTQ",
          durationLabel: "7:59",
        },
        {
          title: "The most common HTML mistake //  The incorrect use of HTML heading levels",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=NexL5_Vdoq8",
          videoId: "NexL5_Vdoq8",
          durationLabel: "15:49",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "html-semantic-structure-q1",
          prompt:
            "Which elements in this page are exposed as landmarks? (Select all that apply.)\n\n```html\n<body>\n  <header>…</header>\n  <main>\n    <section>…</section>\n    <section aria-labelledby=\"faq\"><h2 id=\"faq\">FAQ</h2>…</section>\n    <article><header>…</header>…</article>\n  </main>\n</body>\n```",
          options: [
            "The `<header>` directly inside `<body>` (banner)",
            "The `<main>` element (main)",
            "The `<section>` labelled by the FAQ heading (region)",
            "The unlabelled `<section>` (region)",
            "The `<header>` inside the `<article>` (banner)",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A `<section>` only becomes a region landmark when it has an accessible name, so the unlabelled one is generic. A `<header>` nested in `<article>` (or `<main>`, `<section>`, `<aside>`, `<nav>`) is also generic, not a second banner.",
        },
        {
          id: "html-semantic-structure-q2",
          prompt:
            "A designer wants the sidebar heading to look small, so the page goes straight from `<h2>Pricing</h2>` to `<h5 class=\"sidebar-title\">Related</h5>`. What's the actual problem?",
          options: [
            "Screen-reader users navigating by headings hear a jump from level 2 to level 5 that implies missing sections; the size should come from CSS",
            "Nothing: browsers renumber headings to match their sectioning elements",
            "`<h5>` isn't allowed inside `<aside>`",
            "Search engines ignore headings below `<h3>`",
          ],
          correctIndex: 0,
          explanation:
            "Heading levels are the page's outline for assistive technology, so pick the level for structure (`<h3>` here) and style it small with a class. No browser renumbers headings for you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-semantic-structure-q3",
          prompt:
            "A CMS wraps every block in `<section>` and starts each with `<h1>`. How do current screen readers expose those headings?",
          options: [
            "All as level 1, because the outline algorithm that would renumber them by nesting was never implemented and has been removed from the spec",
            "As levels 1, 2, 3… according to how deeply each `<section>` is nested",
            "The first as level 1 and every later one as level 2",
            "As level 1 in Chrome but as nested levels in Firefox and Safari",
          ],
          correctIndex: 0,
          explanation:
            "The level is simply the number in the tag (or `aria-level`). The standard has also dropped the old UA styles that shrank nested `<h1>`s, so not even the visual size hints at depth any more.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-semantic-structure-q4",
          prompt:
            "Which elements fit these two controls: \"Delete draft\", which calls an API and re-renders a list, and \"View invoice\", which opens `/invoices/42`?",
          options: [
            "`<button type=\"button\">` for Delete draft and `<a href=\"/invoices/42\">` for View invoice",
            "`<a href=\"#\">` with a click handler for both",
            "`<button>` for both, setting `location.href` for the invoice",
            "`<a>` for Delete draft because it's styled as a link, `<button>` for View invoice because it's styled as a button",
          ],
          correctIndex: 0,
          explanation:
            "Buttons perform actions; links navigate. A real `href` gives the invoice link middle-click, open in new tab, copy link and history, which `href=\"#\"` and `location.href` throw away. How it looks is a CSS decision.",
        },
        {
          id: "html-semantic-structure-q5",
          prompt:
            "What happens when the user clicks \"Show password\"?\n\n```html\n<form action=\"/login\" method=\"post\">\n  <input type=\"password\" name=\"pw\">\n  <button onclick=\"togglePassword()\">Show password</button>\n  <button type=\"submit\">Log in</button>\n</form>\n```",
          options: [
            "`togglePassword()` runs, then the form submits, because a `<button>` in a form defaults to `type=\"submit\"`",
            "Only `togglePassword()` runs; a button without a `type` does nothing by default",
            "The form submits and `togglePassword()` never runs",
            "Nothing happens until the user presses Enter",
          ],
          correctIndex: 0,
          explanation:
            "The handler runs first, then the default action submits the form unless the handler calls `event.preventDefault()`. Give every non-submitting button in a form `type=\"button\"`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-semantic-structure-q6",
          prompt:
            "A legacy page is missing `<!DOCTYPE html>`, so it renders in quirks mode. Which of these can happen? (Select all that apply.)",
          options: [
            "`width: 300` (no unit) in CSS is treated as `300px` instead of being ignored",
            "Tables stop inheriting `font-size` and other font properties from their parent",
            "Scripts run in sloppy mode instead of strict mode",
            "`<main>` and `<nav>` stop being exposed as landmarks",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "Quirks mode emulates old rendering bugs: quirky unitless lengths, font properties that don't inherit into tables, odd percentage heights and line-height behaviour. It doesn't touch JavaScript semantics or how elements map to accessibility roles.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-semantic-structure-q7",
          prompt: "What does `<html lang=\"en\">` actually affect? (Select all that apply.)",
          options: [
            "Which pronunciation rules and voice a screen reader uses",
            "Whether `hyphens: auto` can hyphenate words correctly",
            "Whether `:lang(en)` selectors match",
            "Whether the page renders in standards mode",
            "Which web fonts the browser downloads",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Language metadata feeds assistive technology (WCAG 3.1.1), hyphenation dictionaries, spellcheck, translation offers and `:lang()`. Rendering mode comes from the doctype, and fonts only load when CSS asks for them.",
        },
        {
          id: "html-semantic-structure-q8",
          prompt:
            "A site's `@media (max-width: 600px)` rules never apply on phones, although they work in a narrow desktop window. The CSS is correct. What's the most likely cause?",
          options: [
            "The page lacks `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`, so mobile browsers lay it out on a virtual viewport about 980px wide",
            "Phones only match `device-width` queries, not `width`",
            "Media queries need `only screen` to apply on iOS",
            "`max-width` queries are ignored while the page is zoomed",
          ],
          correctIndex: 0,
          explanation:
            "Without the viewport meta tag, mobile browsers use a desktop-width layout viewport and scale the page down, so `width` never gets near 600px. `device-width` is deprecated in Media Queries Level 4, and `only` does nothing in modern browsers.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-semantic-structure-q9",
          prompt:
            "What does opening a `<dialog>` with `showModal()` give you that toggling a positioned `<div>` doesn't? (Select all that apply.)",
          options: [
            "It renders in the top layer, above everything regardless of `z-index`",
            "Content outside the dialog becomes inert, so it can't be focused or clicked",
            "Pressing Esc closes it",
            "Clicking the backdrop closes it by default",
            "The page behind it stops scrolling automatically",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A modal dialog gets top-layer rendering, a `::backdrop`, an inert background and close-on-Esc. Backdrop clicks only close it if you opt in (the newer `closedby=\"any\"` attribute or your own handler), and scroll locking is still up to your CSS.",
        },
        {
          id: "html-semantic-structure-q10",
          prompt: "Which of these is conforming HTML?",
          options: [
            "Several `<main>` elements where every one except the current view has the `hidden` attribute",
            "One visible `<main>` inside each `<article>` on a blog index page",
            "A `<main>` nested inside the page `<header>`",
            "Two visible `<main>` elements, one for content and one for the sidebar",
          ],
          correctIndex: 0,
          explanation:
            "The standard allows only one `<main>` without `hidden`, and it must not sit inside `<article>`, `<aside>`, `<header>`, `<footer>` or `<nav>`. Hiding inactive views with `hidden` is how a single-page app can keep several in the DOM.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "html-forms-validation",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "Forms & Client-Side Validation",
      summary:
        "Native forms come with a validation engine: `required`, `type=\"email\"`, `min`/`max`/`step`, `minlength` and `pattern` block submission, expose state through `:invalid` and `:user-invalid`, and feed the Constraint Validation API (`validity`, `checkValidity()`, `reportValidity()`, `setCustomValidity()`). Use it for fast, accessible feedback, never as security: anyone can edit the DOM or POST directly, so the server validates everything again.\n\nThe API has sharp edges. `setCustomValidity(\"msg\")` keeps a field invalid until you call it again with an empty string, so a custom error that's set but never cleared blocks submission forever. `checkValidity()` fires `invalid` events but shows nothing, while `reportValidity()` shows the browser's bubbles. `novalidate` only stops the browser blocking submission and showing its UI; `validity` and `:invalid` still work, which is what you want when rendering your own messages. `pattern` must match the whole value and is compiled with the `v` flag, empty optional fields skip every constraint except `required`, `minlength` only flags values the user edited, and disabled or readonly controls are barred from validation (disabled ones aren't even submitted). Style errors with `:user-invalid` so a pristine form doesn't start out red.\n\nChoose `type` for semantics and `inputmode` for the keyboard. `type=\"number\"` is for quantities: it accepts `e`, adds a spinner, can change value on scroll and treats the value as a number, so card numbers, PINs and postcodes are `type=\"text\" inputmode=\"numeric\"` with the right `autocomplete` token. Every control needs a programmatic label (`<label for>` or a wrapping `<label>`); a placeholder isn't one. Tie error text to its field with `aria-describedby`, set `aria-invalid`, and move focus to the first invalid field on submit so the error is announced, not just coloured red.",
      level: "intermediate",
      estMinutes: 70,
      webRefs: [
        { label: "MDN: Client-side form validation", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation", kind: "docs" },
        { label: "MDN: Constraint validation", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation", kind: "docs" },
        { label: "web.dev Learn Forms: Help users enter the right data", url: "https://web.dev/learn/forms/validation", kind: "article" },
        { label: "MDN: inputmode", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inputmode", kind: "docs" },
      ],
      video: {
        title: "How to set custom error messages for your HTML forms",
        channel: "Kevin Powell",
        url: "https://www.youtube.com/watch?v=h5qqmE83Tes",
        videoId: "h5qqmE83Tes",
        durationLabel: "39:26",
      },
      alternateVideos: [
        {
          title: "HTML Tutorial - Website Crash Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=916GWv2Qs08",
          videoId: "916GWv2Qs08",
          durationLabel: "45:19",
          startSeconds: 1464,
          chapterLabel: "Forms and Input Elements",
        },
        {
          title: "Learn HTML Forms In 25 Minutes",
          channel: "Web Dev Simplified",
          url: "https://www.youtube.com/watch?v=fNcJuPIZ2WE",
          videoId: "fNcJuPIZ2WE",
          durationLabel: "24:55",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "html-forms-validation-q1",
          prompt:
            "The user types a mismatched confirmation, then corrects it so both fields match. What happens when they submit?\n\n```js\nconst confirm = form.elements.confirm;\nconfirm.addEventListener(\"input\", () => {\n  if (confirm.value !== form.elements.password.value) {\n    confirm.setCustomValidity(\"Passwords must match\");\n  }\n});\n```",
          options: [
            "Submission is still blocked, because the custom error is never cleared with `setCustomValidity(\"\")`",
            "It submits, because custom errors are re-evaluated on submit",
            "It submits, because `setCustomValidity()` only affects `reportValidity()`",
            "It submits, but the browser shows a warning bubble first",
          ],
          correctIndex: 0,
          explanation:
            "A non-empty custom message sets `validity.customError` until you replace it with an empty string, so the handler needs an `else { confirm.setCustomValidity(\"\"); }`. The browser never re-runs your logic for you.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-forms-validation-q2",
          prompt: "Which statements about the Constraint Validation API are true? (Select all that apply.)",
          options: [
            "`form.checkValidity()` returns `false` and fires an `invalid` event at each invalid control",
            "`form.reportValidity()` does the same and also shows the browser's validation messages",
            "`checkValidity()` shows the browser's error bubble on the first invalid field",
            "Calling `checkValidity()` submits the form when everything is valid",
            "With `novalidate` on the form, `checkValidity()` always returns `true`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "`checkValidity()` is silent apart from the `invalid` events; `reportValidity()` adds the UI. Neither submits, and `novalidate` doesn't change what they report.",
        },
        {
          id: "html-forms-validation-q3",
          prompt: "A form has `novalidate` and a required, empty email input. Which is true?",
          options: [
            "Submitting isn't blocked by the browser, but `validity.valueMissing` is `true` and `:invalid` still matches",
            "The field is treated as valid until `novalidate` is removed",
            "`required` is ignored entirely, including by `:invalid`",
            "The browser still blocks submission but hides its error bubble",
          ],
          correctIndex: 0,
          explanation:
            "`novalidate` only skips interactive validation on submit. The constraints still exist, which is the usual setup for a custom error UI: turn off the bubbles, then read `validity` yourself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-forms-validation-q4",
          prompt:
            "You style `input:invalid { border-color: red; }` and users complain the signup form is covered in red before they've typed anything. What's the best fix?",
          options: [
            "Use `:user-invalid`, which only matches after the user has interacted with the field or tried to submit",
            "Use `input:not(:focus):invalid`",
            "Use `:out-of-range` instead",
            "Remove `required` and validate on the server only",
          ],
          correctIndex: 0,
          explanation:
            "`:invalid` matches from page load for every required empty field. `:user-invalid` (Baseline since November 2023) waits for interaction, whereas `:not(:focus)` still paints every untouched field red.",
        },
        {
          id: "html-forms-validation-q5",
          prompt:
            "Which values pass this field's validation? (Select all that apply.)\n\n```html\n<input name=\"zip\" pattern=\"\\d{5}\">\n```",
          options: ["`12345`", "`123456`", "An empty value", "`12345 ` (with a trailing space)", "`zip 12345`"],
          correctIndex: 0,
          correctIndices: [0, 2],
          explanation:
            "`pattern` is implicitly anchored, as if wrapped in `^(?:…)$`, so any extra character fails. Constraints other than `required` don't apply to an empty value, so add `required` if the field is mandatory.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-forms-validation-q6",
          prompt: "Which markup is best for a credit card number field?",
          options: [
            "`<input type=\"text\" inputmode=\"numeric\" autocomplete=\"cc-number\">`",
            "`<input type=\"number\" autocomplete=\"cc-number\">`",
            "`<input type=\"tel\" autocomplete=\"cc-number\">`",
            "`<input type=\"number\" inputmode=\"numeric\" pattern=\"[0-9]*\">`",
          ],
          correctIndex: 0,
          explanation:
            "`type=\"number\"` is for quantities: it allows `e`, adds a spinner, can change on scroll and treats a long digit string as a number. `inputmode=\"numeric\"` gives the digit keypad while the value stays a string, and `type=\"tel\"` misdescribes the field as a phone number.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-forms-validation-q7",
          prompt:
            "What does this log?\n\n```js\n// <input id=\"username\" minlength=\"8\">\nconst input = document.querySelector(\"#username\");\ninput.value = \"abc\";\nconsole.log(input.validity.tooShort, input.checkValidity());\n```",
          options: ["`false true`", "`true false`", "`true true`", "It throws, because the value is shorter than `minlength`"],
          correctIndex: 0,
          explanation:
            "`tooShort` and `tooLong` only apply to values the user has edited, so a value set from script passes. It's one more reason the server has to validate everything itself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-forms-validation-q8",
          prompt: "Which statements about `disabled` and `readonly` are true? (Select all that apply.)",
          options: [
            "Disabled controls aren't included in the submitted form data",
            "Readonly controls are submitted with the form",
            "Both are barred from constraint validation, so `required` has no effect on them",
            "Readonly text inputs can't receive focus",
            "`readonly` makes checkboxes and `<select>` elements uneditable",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Readonly fields can be focused and selected but not edited, and `readonly` only applies to text-like inputs and `<textarea>`. For checkboxes and selects you need `disabled` (which also drops them from submission) or script.",
        },
        {
          id: "html-forms-validation-q9",
          prompt:
            "Which of these programmatically associate visible text with the input as its label? (Select all that apply.)",
          options: [
            "`<label for=\"email\">Email</label> <input id=\"email\">`",
            "`<label>Email <input></label>`",
            "`<span id=\"em\">Email</span> <input aria-labelledby=\"em\">`",
            "`<input placeholder=\"Email\">` on its own",
            "`<p>Email</p>` placed directly before the `<input>`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Explicit `for`/`id`, implicit wrapping and `aria-labelledby` all feed the accessible name. A placeholder vanishes as soon as the user types and is only a last-resort fallback in name computation; adjacent text has no programmatic link at all.",
        },
        {
          id: "html-forms-validation-q10",
          prompt:
            "After a failed submit you render `<p class=\"error\">Enter a valid email</p>` under the email field. Which pattern makes the error perceivable to screen-reader users?",
          options: [
            "Give the paragraph an `id`, reference it from the input's `aria-describedby`, set `aria-invalid=\"true\"` and move focus to the first invalid field",
            "Add `title=\"Enter a valid email\"` to the paragraph",
            "Colour the input's border red and add an error icon",
            "Put `role=\"presentation\"` on the paragraph so it's read inline",
          ],
          correctIndex: 0,
          explanation:
            "When focus lands on the field, its name, invalid state and description are announced together. Colour alone fails WCAG 1.4.1 (Use of Color), and a `title` on a non-focusable element is rarely announced.",
        },
        {
          id: "html-forms-validation-q11",
          prompt: "Which value passes built-in `type=\"email\"` validation?",
          options: ["`a@b`", "`first last@example.com`", "`user@example..com`", "`@example.com`"],
          correctIndex: 0,
          explanation:
            "The HTML email grammar needs a local part, an `@` and a domain made of valid labels, but no dot, so `a@b` passes. Spaces, empty labels and a missing local part fail. Only sending mail proves an address works.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "html-accessibility-fundamentals",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "Accessibility Fundamentals (ARIA, Landmarks, Focus Order)",
      summary:
        "Accessibility is mostly about exposing the right information in the accessibility tree and keeping every interaction operable from a keyboard. Assistive technology doesn't read pixels: it reads each node's role, accessible name, state and value, plus the landmarks and headings that make a page navigable. WCAG 2.2 is the benchmark that laws such as the ADA and the European Accessibility Act (applied since June 2025) lean on; it added criteria including Focus Not Obscured, a 24×24 px minimum target size and Accessible Authentication, and removed 4.1.1 Parsing.\n\nThe first rule of ARIA is not to use it when a native element does the job, because ARIA changes only what's announced, never behaviour. `role=\"button\"` on a `<div>` still needs `tabindex=\"0\"`, Enter and Space handling and a disabled state you manage yourself. Bad ARIA is worse than none: `aria-hidden=\"true\"` on a focusable element creates a silent tab stop, and `aria-label` on a plain `<div>` or `<span>` is ignored because naming is prohibited on the generic role. Accessible names follow a fixed precedence (`aria-labelledby`, then `aria-label`, then the native label or content, then `title`), and an `aria-label` that doesn't contain the visible text breaks speech-recognition users who say what they see (WCAG 2.5.3, Label in Name).\n\nFocus order follows the DOM, not the layout: CSS `order`, `row-reverse`, grid placement and positive `tabindex` values all make Tab jump around the screen. Remove outlines only when you replace them, preferably via `:focus-visible`, which shows rings for keyboard users without flashing them on mouse clicks. Manage focus when content changes (into a modal, back to its trigger on close, with the background made `inert`), keep text contrast at 4.5:1 (3:1 for large text), and announce status updates through a live region that already exists in the DOM.",
      level: "advanced",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "MDN: ARIA", url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA", kind: "docs" },
        { label: "W3C: Web Content Accessibility Guidelines (WCAG) 2.2", url: "https://w3c.github.io/wcag/guidelines/22/", kind: "spec" },
        { label: "W3C: Using ARIA", url: "https://w3c.github.io/using-aria/", kind: "spec" },
        { label: "web.dev: Learn Accessibility", url: "https://web.dev/learn/accessibility", kind: "article" },
      ],
      video: {
        title: "The Only Accessibility Video You Will Ever Need",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=2oiBKSjOOFE",
        videoId: "2oiBKSjOOFE",
        durationLabel: "37:32",
      },
      alternateVideos: [
        {
          title: "Why you shouldn't use a div for everything - creating accessible buttons and navigations",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=YAqRQoN8ykI",
          videoId: "YAqRQoN8ykI",
          durationLabel: "31:46",
        },
        {
          title: "Learn Accessibility - Full a11y Tutorial",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=e2nkq3h1P68",
          videoId: "e2nkq3h1P68",
          durationLabel: "1:33:05",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "html-accessibility-fundamentals-q1",
          prompt:
            "This custom button looks right and works with a mouse. Which problems remain? (Select all that apply.)\n\n```html\n<div role=\"button\" class=\"btn\" onclick=\"save()\">Save</div>\n```",
          options: [
            "Keyboard users can't reach it with Tab",
            "Pressing Enter or Space doesn't activate it",
            "Screen readers won't announce it as a button",
            "`onclick` won't fire for touch users",
            "Its text won't be read",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "The role fixes the announcement but not the behaviour: you'd still need `tabindex=\"0\"`, key handlers (native buttons activate on Enter, and on Space when the key is released) and disabled handling. `<button type=\"button\">` gives you all of it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-accessibility-fundamentals-q2",
          prompt:
            "What accessible name does the input get?\n\n```html\n<label for=\"q\">Search products</label>\n<input id=\"q\" type=\"search\" aria-label=\"Query\">\n```",
          options: ["`Query`", "`Search products`", "`Search products Query`", "No name, because the two labels conflict"],
          correctIndex: 0,
          explanation:
            "`aria-label` outranks a native `<label>` in the name computation; only `aria-labelledby` beats it. Here it also hides the visible label from speech users, who'll say \"Search products\" and get no match.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-accessibility-fundamentals-q3",
          prompt:
            "A button shows the text \"Send\" but has `aria-label=\"Submit your message\"`. Which user is most directly harmed?",
          options: [
            "A speech-recognition user who says \"click Send\"",
            "A sighted keyboard user tabbing through the form",
            "A screen-reader user, who hears the more descriptive name",
            "A user who zooms the page to 400%",
          ],
          correctIndex: 0,
          explanation:
            "Speech-control software matches spoken words against accessible names. WCAG 2.5.3 (Label in Name) requires the name to contain the visible text, ideally at the start: `aria-label=\"Send message\"`, or no `aria-label` at all.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-accessibility-fundamentals-q4",
          prompt: "What's the effect of `<a href=\"/cart\" aria-hidden=\"true\">Cart</a>`?",
          options: [
            "It's removed from the accessibility tree but stays focusable, so keyboard and screen-reader users land on an unnamed, silent tab stop",
            "It's removed from both the accessibility tree and the tab order",
            "It's visually hidden but still announced",
            "Nothing, because `aria-hidden` is ignored on links",
          ],
          correctIndex: 0,
          explanation:
            "`aria-hidden` never affects focus or rendering. Use `hidden` or `display: none` to hide something from everyone, and `inert` to take a subtree out of interaction entirely.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-accessibility-fundamentals-q5",
          prompt:
            "`<div aria-label=\"Product details\">…</div>` has no `role`. What do most screen readers do with the label?",
          options: [
            "Ignore it: a plain `<div>` has the generic role, on which author naming is prohibited",
            "Announce the `<div>` as a \"Product details\" region landmark",
            "Read \"Product details\" instead of the div's content",
            "Announce it only when the div receives focus",
          ],
          correctIndex: 0,
          explanation:
            "Give the element a role that supports naming (a `<section>` with `aria-labelledby`, or `role=\"region\"`) or use visible text. ARIA in HTML marks naming as prohibited for elements exposed as generic.",
        },
        {
          id: "html-accessibility-fundamentals-q6",
          prompt:
            "A button row uses `flex-direction: row-reverse` so that \"Next\" appears on the right, although it comes first in the DOM. What happens for keyboard users?",
          options: [
            "Tab follows DOM order, so focus starts on the right and moves left, against the visual reading order",
            "Browsers reorder focus to match the visual order",
            "Focus order and screen-reader order are both reversed, so everything stays consistent",
            "The buttons become unfocusable until `order` is set",
          ],
          correctIndex: 0,
          explanation:
            "Visual reordering with `row-reverse`, `order` or grid placement changes neither focus nor reading order (WCAG 2.4.3 Focus Order, 1.3.2 Meaningful Sequence). Put the DOM in the order people should use it, then lay it out.",
        },
        {
          id: "html-accessibility-fundamentals-q7",
          prompt: "What does `tabindex=\"1\"` on a search input do?",
          options: [
            "Puts it ahead of every element with `tabindex=\"0\"` or no tabindex on the whole page, so Tab order no longer follows the document",
            "Makes it first within its parent section only",
            "Behaves exactly like `tabindex=\"0\"`",
            "Lets it receive focus only once",
          ],
          correctIndex: 0,
          explanation:
            "Positive values create a separate, page-wide ordering that's brittle and confusing. Use `0` to add an element to the natural order and `-1` to make it focusable only from script.",
        },
        {
          id: "html-accessibility-fundamentals-q8",
          prompt: "Which statements about `:focus-visible` are true? (Select all that apply.)",
          options: [
            "A button clicked with a mouse usually doesn't match `:focus-visible`",
            "A text input focused by a mouse click usually does match it",
            "`button:focus { outline: none; }` without a replacement removes the ring for keyboard users too",
            "It matches any element that has a `tabindex`, focused or not",
            "It only works on native form controls",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Browsers use heuristics: keyboard focus and fields that need typing get a visible indicator, pointer clicks on buttons don't. Styling `:focus-visible` customises the ring without changing when it appears; removing `:focus` outlines fails WCAG 2.4.7 (Focus Visible).",
        },
        {
          id: "html-accessibility-fundamentals-q9",
          prompt:
            "Body text in `#767676` on a white background has a contrast ratio of about 4.54:1. How does it do against WCAG 2.2?",
          options: [
            "Passes AA for normal text but not AAA",
            "Fails AA for normal text",
            "Passes AAA for normal text",
            "Passes AA only for large text",
          ],
          correctIndex: 0,
          explanation:
            "AA needs 4.5:1 for normal text and 3:1 for large text (24px, or about 18.7px bold); AAA needs 7:1 and 4.5:1. `#767676` is known as roughly the lightest grey that passes AA on white.",
        },
        {
          id: "html-accessibility-fundamentals-q10",
          prompt:
            "A \"Saved\" message is shown by creating `<div role=\"status\">Saved</div>` and appending it to the page. Screen readers often say nothing. Why?",
          options: [
            "Live regions announce changes to their content; a region inserted with its text already inside may not be tracked yet, so render the empty region first and update its text",
            "`role=\"status\"` is only announced when it receives focus",
            "Text set from JavaScript is never announced",
            "Status messages must use `aria-live=\"assertive\"`",
          ],
          correctIndex: 0,
          explanation:
            "Keep an empty `role=\"status\"` (polite) or `role=\"alert\"` (assertive) container in the DOM from the start and change its text. WCAG 4.1.3 (Status Messages) expects such updates to be announced without moving focus.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-accessibility-fundamentals-q11",
          prompt: "Which success criteria were added in WCAG 2.2? (Select all that apply.)",
          options: [
            "2.4.11 Focus Not Obscured (Minimum)",
            "2.5.8 Target Size (Minimum), 24 by 24 CSS pixels",
            "3.3.8 Accessible Authentication (Minimum)",
            "1.4.3 Contrast (Minimum)",
            "4.1.1 Parsing",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "1.4.3 dates from WCAG 2.0, and 4.1.1 Parsing was removed in 2.2 as obsolete. The new AA criteria target sticky headers hiding the focused element, tiny tap targets, and logins that demand a cognitive test such as retyping a code without paste or password-manager support.",
        },
      ],
    },
    {
      id: "html-tables-media",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "Tables & Media Elements",
      summary:
        "Tables and media carry more hidden information than any other HTML. A data table's structure is what lets a screen reader say \"Q3, Revenue, 1.2M\" as you move between cells: `<th>` with `scope` (or `headers`/`id` for complex tables), a `<caption>` that names the table, and `<thead>`/`<tbody>`. Tables for layout are long dead; tables for tabular data are correct. Making them responsive by switching rows and cells to `display: block` or grid has stripped table semantics in some browsers, so test with a screen reader and restore the roles, or keep the table and give it a scrollable, focusable wrapper.\n\nImages are a performance problem first. `srcset` with `w` descriptors plus `sizes` lets the browser pick a file for the slot's rendered width and the device pixel ratio; leave out `sizes` and it assumes `100vw`, downloading a hero-sized file for a thumbnail, because the choice is made before layout. `srcset` is a hint the browser may override (for example with a larger cached file), while `<picture>` with `<source media>` is art direction it must obey and `<source type=\"image/avif\">` is format negotiation. Always set `width` and `height`: browsers derive an aspect ratio and reserve space before the file arrives, preventing layout shift. `loading=\"lazy\"` saves bandwidth below the fold but delays the LCP image if you put it on the hero, which wants `fetchpriority=\"high\"` instead.\n\n`alt` describes purpose: say what the image conveys, use `alt=\"\"` for decoration so it's skipped, and never omit it, or screen readers may read out the file name. For video, autoplay generally needs `muted` (plus `playsinline` on iOS), `<track kind=\"captions\">` adds WebVTT captions, and `preload=\"none\"` or `\"metadata\"` stops a page full of players downloading video nobody plays.",
      level: "intermediate",
      estMinutes: 45,
      webRefs: [
        { label: "MDN: Responsive images", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images", kind: "docs" },
        { label: "MDN: HTML table accessibility", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Table_accessibility", kind: "docs" },
        { label: "web.dev: Browser-level image lazy loading for the web", url: "https://web.dev/articles/browser-level-image-lazy-loading", kind: "article" },
        { label: "MDN: The Video Embed element", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video", kind: "docs" },
      ],
      video: {
        title: "Make Your Site Lightning Fast With Responsive Images",
        channel: "Web Dev Simplified",
        url: "https://www.youtube.com/watch?v=fp9eVtkQ4EA",
        videoId: "fp9eVtkQ4EA",
        durationLabel: "14:13",
      },
      alternateVideos: [
        {
          title: "How to create a responsive HTML table",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=czZ1PvNW5hk",
          videoId: "czZ1PvNW5hk",
          durationLabel: "27:19",
        },
        {
          title: "srcset and sizes attributes - [ images on the web | part one ]",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=2QYpkrX2N48",
          videoId: "2QYpkrX2N48",
          durationLabel: "30:08",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "html-tables-media-q1",
          prompt:
            "On a 1440px-wide desktop screen at 1x density, which file does the browser most likely download?\n\n```html\n<!-- CSS: .thumb { width: 200px; } -->\n<img src=\"thumb-400.jpg\"\n     srcset=\"thumb-400.jpg 400w, photo-1600.jpg 1600w\"\n     alt=\"Mountain lake at dawn\"\n     class=\"thumb\">\n```",
          options: [
            "`photo-1600.jpg`, because without `sizes` the browser assumes the image is `100vw` wide",
            "`thumb-400.jpg`, because the CSS makes the image 200px wide",
            "Both files, keeping whichever matches better",
            "`thumb-400.jpg`, because `src` wins when it's also listed in `srcset`",
          ],
          correctIndex: 0,
          explanation:
            "The browser picks a candidate before layout, when your CSS width isn't known, so it relies on `sizes`. With `sizes=\"200px\"` it would choose the 400w file, which even covers 2x screens.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-tables-media-q2",
          prompt: "Which statements about responsive images are true? (Select all that apply.)",
          options: [
            "The browser must use the first `<source>` in a `<picture>` whose `media` query matches",
            "With `srcset` and `sizes` on an `<img>`, the browser may choose a different candidate than the ideal one, such as a larger file it already has cached",
            "A `<source type=\"image/avif\">` is skipped by browsers that can't decode AVIF",
            "A `<picture>` without an `<img>` child still renders the matching source",
            "Each `<source>` needs its own `alt` attribute",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`<picture>` sources are instructions (art direction, format fallback), while `srcset` candidates are hints. The `<img>` inside `<picture>` is required: it's the element that renders, and it carries the one `alt`.",
        },
        {
          id: "html-tables-media-q3",
          prompt:
            "Why add `width=\"1200\" height=\"800\"` to an `<img>` that CSS already sizes with `max-width: 100%; height: auto`?",
          options: [
            "The browser derives a 3:2 aspect ratio and reserves space before the file loads, preventing layout shift",
            "It forces the image to render at 1200×800 regardless of CSS",
            "It makes the browser download a smaller file",
            "It's only needed for SVG images",
          ],
          correctIndex: 0,
          explanation:
            "Browsers map the attributes to an `aspect-ratio`, so a responsive image gets the right height as soon as its width is known. CSS still controls the rendered size, and Cumulative Layout Shift stays low.",
        },
        {
          id: "html-tables-media-q4",
          prompt:
            "Lighthouse reports a poor Largest Contentful Paint on a landing page whose hero `<img>` has `loading=\"lazy\"`. What's the best fix?",
          options: [
            "Remove `loading=\"lazy\"` from the hero and consider `fetchpriority=\"high\"`; keep lazy loading for images below the fold",
            "Add `decoding=\"sync\"` to the hero image",
            "Lazy-load every image, including the hero, and show a blurred placeholder",
            "Move the hero into a CSS `background-image` so it loads earlier",
          ],
          correctIndex: 0,
          explanation:
            "Lazy images wait until layout shows they're near the viewport, which delays the LCP element. A CSS background is discovered even later, because the preload scanner can't see it.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-tables-media-q5",
          prompt: "Which `alt` choices are correct? (Select all that apply.)",
          options: [
            "`alt=\"Acme home\"` on the logo inside a link to `/`",
            "`alt=\"\"` on a decorative flourish between sections",
            "No `alt` attribute at all on decorative images, so screen readers skip them",
            "`alt=\"image\"` on a product photo",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "When an image is a link's only content, its `alt` is the link's name, so describe the destination. A missing `alt` isn't the same as an empty one: screen readers may fall back to reading the file name.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-tables-media-q6",
          prompt: "Which of these make a data table understandable to screen-reader users? (Select all that apply.)",
          options: [
            "`<th scope=\"col\">` cells in the header row",
            "`<th scope=\"row\">` for the first cell of each body row",
            "A `<caption>` that names the table",
            "Bold `<td>` cells styled to look like headers",
            "`role=\"presentation\"` on the `<table>`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Header cells let screen readers announce the row and column headers as you move through data cells, and the caption names the table. Styled `<td>`s only look like headers, and `role=\"presentation\"` erases the table semantics.",
        },
        {
          id: "html-tables-media-q7",
          prompt:
            "To make a pricing table fit on phones, a developer sets `table, tr, td, th { display: block; }`. What's the main risk?",
          options: [
            "Some browsers drop the table semantics from the accessibility tree, so screen readers can no longer navigate by row and column",
            "The table can no longer be printed",
            "Cells stop inheriting fonts from the table",
            "None: `display` never affects semantics",
          ],
          correctIndex: 0,
          explanation:
            "CSS `display` values have historically changed how browsers expose tables. If you restyle cells as blocks, restore the semantics with ARIA table roles (`table`, `row`, `columnheader`, `cell`), or keep the table and put it in a horizontally scrolling wrapper.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "html-tables-media-q8",
          prompt:
            "A decorative hero `<video autoplay loop src=\"bg.mp4\">` doesn't start in Chrome or iOS Safari. What's missing?",
          options: [
            "`muted`, plus `playsinline` for inline playback on iOS",
            "`preload=\"auto\"`",
            "`controls`",
            "A `type=\"video/mp4\"` attribute on the `<video>` element",
          ],
          correctIndex: 0,
          explanation:
            "Browser autoplay policies generally allow muted autoplay but block sound without a user gesture. Looping decorative motion should also respect `prefers-reduced-motion` and offer a way to pause it (WCAG 2.2.2).",
        },
        {
          id: "html-tables-media-q9",
          prompt: "Which markup provides captions for a `<video>` in the standard way?",
          options: [
            "`<track kind=\"captions\" src=\"talk.en.vtt\" srclang=\"en\" label=\"English\">` inside the `<video>`",
            "A `<caption>` element inside the `<video>`",
            "`aria-describedby` on the video pointing at a transcript",
            "A `<figcaption>` next to the video",
          ],
          correctIndex: 0,
          explanation:
            "`<track>` loads a WebVTT file that the player shows in sync and users can toggle. `<caption>` belongs to tables, and a transcript or `<figcaption>` is useful extra context, not synchronised captions (WCAG 1.2.2).",
        },
        {
          id: "html-tables-media-q10",
          prompt:
            "Which statements about this image are true? (Select all that apply.)\n\n```html\n<img src=\"logo.png\" srcset=\"logo@2x.png 2x\" width=\"120\" height=\"40\" alt=\"Acme\">\n```",
          options: [
            "A phone with a device pixel ratio of 2 will likely download `logo@2x.png`",
            "Density (`x`) descriptors suit images with a fixed CSS size like this one",
            "Adding a `sizes` attribute would change which file is chosen",
            "The browser downloads both files",
            "`logo.png` is never used once `srcset` exists",
          ],
          correctIndex: 0,
          correctIndices: [0, 1],
          explanation:
            "With density descriptors, `src` acts as the 1x candidate and `sizes` is ignored; `sizes` only matters with `w` descriptors, which suit fluid images. The browser downloads just one candidate.",
        },
      ],
    },
    {
      id: "css-box-model",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "The CSS Box Model",
      summary:
        "Every element generates boxes made of content, padding, border and margin, and most layout bugs come back to how those are sized. By default `width` sets the content box (`box-sizing: content-box`), so padding and border are added on top; nearly every codebase resets to `border-box` so `width: 50%` plus padding still fits. Percentage padding and margin, top and bottom included, resolve against the containing block's inline size (its width in horizontal writing modes), which is how `padding-top: 56.25%` made 16:9 boxes before `aspect-ratio` existed.\n\nMargins have their own rules. Vertical margins between adjacent blocks collapse to the larger one (with mixed signs, the largest positive and most negative are added), and a first child's top margin can collapse through a parent that has no border, padding, inline content or new formatting context, pushing the parent down instead. Margins never collapse horizontally, between flex or grid items, or on floats and absolutely positioned boxes; `display: flow-root` is the clean way to contain them. Many teams sidestep the whole thing by spacing with `gap` or with margins in one direction only.\n\nStacking is the other half of the model. `z-index` only orders siblings inside the same stacking context, and many properties create one silently: `opacity` below 1, any `transform`, `filter`, `position: fixed` or `sticky`, `isolation: isolate`, `will-change`, `container-type`, and a positioned element with a non-auto `z-index`. That's why a `z-index: 9999` dropdown still hides under a sibling: its parent formed a context at a lower level. `transform` and `filter` also become the containing block for `position: fixed` descendants, which breaks \"fixed\" modals nested inside animated containers. Logical properties (`margin-inline`, `padding-block`, `inline-size`) express all of this relative to the writing direction, so RTL and vertical layouts work without overrides.",
      level: "intermediate",
      estMinutes: 55,
      webRefs: [
        { label: "MDN: Introduction to the CSS basic box model", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Box_model/Introduction", kind: "docs" },
        { label: "MDN: Mastering margin collapsing", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Box_model/Margin_collapsing", kind: "docs" },
        { label: "Josh W. Comeau: The Rules of Margin Collapse", url: "https://www.joshwcomeau.com/css/rules-of-margin-collapse/", kind: "article" },
        { label: "Josh W. Comeau: What The Heck, z-index??", url: "https://www.joshwcomeau.com/css/stacking-contexts/", kind: "article" },
      ],
      video: {
        title: "CSS Tutorial – Full Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=OXGznpKZ_sA",
        videoId: "OXGznpKZ_sA",
        durationLabel: "11:08:10",
        startSeconds: 4316,
        chapterLabel: "Chapter 5: Box Model",
      },
      challengeType: "quiz",
      quiz: [
        {
          id: "css-box-model-q1",
          prompt:
            "What is the rendered border-box width of `.card`?\n\n```css\n.card {\n  width: 300px;\n  padding: 20px;\n  border: 5px solid;\n  margin: 10px;\n}\n```",
          options: ["`350px`", "`300px`", "`370px`", "`340px`"],
          correctIndex: 0,
          explanation:
            "With the default `box-sizing: content-box`, `width` sizes only the content: 300 + 2×20 + 2×5 = 350px. Margin sits outside the border box; with `border-box` the card would be exactly 300px.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-box-model-q2",
          prompt:
            "A block container is 800px wide and 200px tall. Its child has `padding-top: 10%`. How tall is that padding?",
          options: [
            "`80px`",
            "`20px`",
            "10% of the child's own height",
            "`0`, because percentage padding needs an explicit parent height",
          ],
          correctIndex: 0,
          explanation:
            "Percentage padding and margin, vertical ones included, resolve against the containing block's inline size, which is its width in horizontal writing modes. Vertical percentages relative to height would create circular dependencies.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-box-model-q3",
          prompt:
            "How far apart are the two paragraphs?\n\n```html\n<p style=\"margin-bottom: 30px\">A</p>\n<p style=\"margin-top: 20px\">B</p>\n```",
          options: ["`30px`", "`50px`", "`20px`", "`25px`"],
          correctIndex: 0,
          explanation:
            "Adjacent vertical margins of blocks in normal flow collapse into the larger one. If the paragraphs were flex or grid items, the margins would add up to 50px, because those never collapse.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-box-model-q4",
          prompt:
            "Same two paragraphs, but now the first has `margin-bottom: 40px` and the second `margin-top: -15px`. What's the gap?",
          options: ["`25px`", "`40px`", "`55px`", "`0`, because a negative margin cancels collapsing"],
          correctIndex: 0,
          explanation:
            "When collapsing margins mix signs, the largest positive margin and the most negative margin are added: 40 + (−15) = 25px.",
        },
        {
          id: "css-box-model-q5",
          prompt:
            "Where does the grey background start?\n\n```html\n<section style=\"background: #eee\">\n  <h2 style=\"margin-top: 40px\">Title</h2>\n</section>\n```",
          options: [
            "At the top of the heading: the h2's margin collapses through the section and appears above it, outside the grey",
            "40px above the heading: the margin sits inside the section's grey background",
            "At the top of the heading, and the margin is discarded",
            "80px above the heading, because the margin applies to both elements",
          ],
          correctIndex: 0,
          explanation:
            "With no border, padding, inline content or new formatting context between them, a first child's top margin collapses with its parent's, so the gap ends up outside the section. A background doesn't prevent that.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-box-model-q6",
          prompt:
            "Which changes to that `<section>` stop the heading's margin from collapsing through it? (Select all that apply.)",
          options: [
            "`padding-top: 1px`",
            "`display: flow-root`",
            "`display: flex; flex-direction: column`",
            "`position: relative`",
            "`overflow: clip`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Padding separates the margins, `flow-root` establishes a new block formatting context, and flex items never collapse margins with their container. `position: relative` doesn't create a formatting context, and unlike `overflow: hidden`, `overflow: clip` doesn't either.",
        },
        {
          id: "css-box-model-q7",
          prompt:
            "The dropdown should overlap the sticky header, but it renders underneath it. Why?\n\n```html\n<header style=\"position: sticky; top: 0; z-index: 2\">…</header>\n<div class=\"card\" style=\"transform: translateY(0)\">\n  <ul class=\"menu\" style=\"position: absolute; z-index: 9999\">…</ul>\n</div>\n```",
          options: [
            "`.card`'s `transform` creates a stacking context, so the menu's `z-index` only competes inside `.card`, which itself paints at level 0, below the header's `z-index: 2`",
            "`z-index` values above 999 are ignored",
            "Absolutely positioned elements can never overlap sticky ones",
            "The menu needs `position: fixed` for its `z-index` to work across parents",
          ],
          correctIndex: 0,
          explanation:
            "Stacking contexts are atomic: descendants can't escape them however large their `z-index`. Remove the transform, give `.card` a `z-index` above 2, or render the menu in the top layer (for example as a popover).",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-box-model-q8",
          prompt: "Which declarations create a new stacking context on their own? (Select all that apply.)",
          options: [
            "`opacity: 0.99`",
            "`transform: translateZ(0)`",
            "`isolation: isolate`",
            "`position: relative` with `z-index: auto`",
            "`overflow: hidden`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Opacity below 1, any transform, filters, `isolation: isolate`, `will-change` naming such a property, `position: fixed` or `sticky`, and a positioned element with a non-auto `z-index` all create one. `z-index: auto` on a relative element and `overflow: hidden` don't.",
        },
        {
          id: "css-box-model-q9",
          prompt:
            "A modal with `position: fixed; inset: 0` is rendered inside a card that has `transform: scale(1)`. What happens?",
          options: [
            "The card becomes the modal's containing block, so the modal covers only the card and scrolls with it",
            "It covers the viewport as usual; `transform` doesn't affect fixed descendants",
            "The browser ignores the card's transform while the modal is open",
            "The modal is converted to `position: absolute` relative to `<body>`",
          ],
          correctIndex: 0,
          explanation:
            "A `transform`, `filter`, `perspective` or `contain: paint` on an ancestor makes it the containing block for fixed-position descendants. That's why modals are portalled to `<body>` or shown with `<dialog>` in the top layer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-box-model-q10",
          prompt:
            "Why do many resets use `html { box-sizing: border-box; } *, *::before, *::after { box-sizing: inherit; }` instead of `* { box-sizing: border-box; }`?",
          options: [
            "A component can switch its whole subtree back to `content-box` by setting it once on its root",
            "`box-sizing` has no effect unless it's inherited",
            "`inherit` is faster for the browser to compute",
            "The universal selector doesn't match `<html>`",
          ],
          correctIndex: 0,
          explanation:
            "`box-sizing` isn't inherited by default, so `inherit` makes every element follow its parent. A third-party widget built for `content-box` can then be fixed with one declaration on its container.",
        },
        {
          id: "css-box-model-q11",
          prompt: "In a `dir=\"rtl\"` layout with horizontal text, which side does `margin-inline-start: 1rem` apply to?",
          options: ["The right", "The left", "The top", "Both left and right"],
          correctIndex: 0,
          explanation:
            "Inline-start follows the writing direction, so in right-to-left text it's the right edge. Logical properties such as `margin-inline`, `padding-block` and `inline-size` let one stylesheet serve LTR, RTL and vertical writing modes.",
        },
      ],
    },
    {
      id: "css-selectors-specificity",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "Selectors & Specificity",
      summary:
        "Specificity is the cascade's tie-breaker between declarations from the same origin, importance and cascade layer, and it's compared as a tuple, not a number: (IDs, classes/attributes/pseudo-classes, types/pseudo-elements), column by column. One ID beats any number of classes; eleven classes never overflow into the ID column. Only when specificity ties does source order decide, which is why repeating a class (`.btn.btn`) is a legitimate way to add weight without an ID, and why the order in which bundles concatenate equal-weight rules can silently change a UI.\n\nModern selectors changed the arithmetic. `:is()`, `:not()` and `:has()` contribute the specificity of their most specific argument, so `:is(#app, .x) a` weighs (1,0,1) even when an element matches through `.x`. `:where()` always contributes zero, which makes it the tool for library defaults and resets that anyone can override with one class. `:nth-child(2n of .item)` adds the pseudo-class plus its selector argument. The universal selector and combinators add nothing; pseudo-elements count as types, including the legacy single-colon `:before`; attribute selectors count as classes whatever they contain, so the dot in `[href$=\".pdf\"]` isn't a class.\n\nSpecificity is only consulted after earlier cascade steps: origin and `!important`, then inline `style` attributes, then cascade layer order. An unlayered `a { color: red }` beats a layered `#nav a.active`, and escalating with IDs and `!important` usually signals an architecture problem rather than a selector one. Keep selectors short and flat, put base styles in layers or `:where()`, and treat specificity wars as a smell. DevTools shows each selector's specificity on hover, and that tuple is exactly what you'll compute in this challenge.",
      level: "advanced",
      estMinutes: 95,
      isMilestone: true,
      webRefs: [
        { label: "MDN: Specificity", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity", kind: "docs" },
        { label: "Selectors Level 4: Calculating a selector's specificity", url: "https://drafts.csswg.org/selectors-4/#specificity-rules", kind: "spec" },
        { label: "web.dev Learn CSS: Specificity", url: "https://web.dev/learn/css/specificity", kind: "article" },
        { label: "web.dev Learn CSS: The cascade", url: "https://web.dev/learn/css/the-cascade", kind: "article" },
      ],
      video: {
        title: "These CSS features give us more control on the cascade and specificity",
        channel: "Kevin Powell",
        url: "https://www.youtube.com/watch?v=jhjVKZB9yc0",
        videoId: "jhjVKZB9yc0",
        durationLabel: "42:54",
      },
      alternateVideos: [
        {
          title: "CSS Specificity explained",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=c0kfcP_nD9E",
          videoId: "c0kfcP_nD9E",
          durationLabel: "13:27",
        },
        {
          title: "CSS Tutorial – Full Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=OXGznpKZ_sA",
          videoId: "OXGznpKZ_sA",
          durationLabel: "11:08:10",
          startSeconds: 890,
          chapterLabel: "Chapter 2: Selectors",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `specificity(selector)`. It returns the specificity of a single complex selector as `[a, b, c]`, the three columns browsers compare from left to right:\n\n- `a`: ID selectors (`#main`).\n- `b`: class selectors (`.btn`), attribute selectors (`[disabled]`, `[type=\"email\"]`) and pseudo-classes (`:hover`, `:root`, `:nth-child(2n+1)`).\n- `c`: type selectors (`div`, in any case) and pseudo-elements (`::before`), including the legacy single-colon forms `:before`, `:after`, `:first-line` and `:first-letter`.\n- `*` and combinators (whitespace, `>`, `+`, `~`) add nothing.\n\nFunctional pseudo-classes:\n\n- `:is()`, `:not()` and `:has()` add the specificity of their most specific argument (compare `a`, then `b`, then `c`). Arguments are comma-separated selectors, may nest, and inside `:has()` may start with a combinator, as in `:has(> img)`.\n- `:where()` adds nothing, whatever it contains.\n- `:nth-child(An+B of S)` and `:nth-last-child(An+B of S)` add one pseudo-class plus the most specific selector in `S`. Any other functional pseudo-class (`:nth-child(2n)`, `:lang(en)`, `:dir(rtl)`) adds one pseudo-class; ignore its argument.\n\nText inside quoted attribute values doesn't count: `[href$=\".pdf\"]` is one attribute selector, and a comma inside quotes isn't a separator. A backslash escapes the next character in a name, so `.md\\:flex` is one class.\n\nReturn `null` unless the input is exactly one valid complex selector. That rules out an empty or whitespace-only string, a top-level selector list such as `h1, h2` (each selector in a list is matched and weighted on its own), unbalanced parentheses, brackets or quotes, a missing name after `#`, `.` or `:`, and a combinator with nothing after it (or, outside `:has()`, nothing before it). You don't need forgiving parsing, namespaces, `&` nesting, `:host` or pseudo-element arguments such as `::part()`.",
        starterCode:
          "/**\n * Returns the specificity of one complex selector as [ids, classes, types],\n * or null if the input isn't exactly one valid complex selector.\n * @param {string} selector\n * @returns {[number, number, number] | null}\n */\nfunction specificity(selector) {\n  // Your code here\n}\n",
        functionName: "specificity",
        testCases: [
          { description: "counts IDs, classes, pseudo-classes and types separately", args: ["#nav .item a:hover"], expected: [1, 2, 1] },
          { description: "pseudo-elements count as types", args: ["ul li::before"], expected: [0, 0, 3] },
          { description: "a dot inside a quoted attribute value isn't a class", args: ["a[href$=\".pdf\"]:not(.external)"], expected: [0, 2, 1] },
          { description: ":is() takes its most specific argument", args: [":is(#main, .sidebar) p"], expected: [1, 0, 1] },
          { description: ":where() always contributes zero", args: [":where(#main, .sidebar) p"], expected: [0, 0, 1] },
          { description: ":has() with a relative selector argument", args: ["article:has(> img, .hero figure)"], expected: [0, 1, 2] },
          { description: ":nth-child(An+B of S) adds its selector argument", args: ["li:nth-child(2n+1 of .active)"], expected: [0, 2, 1] },
          { description: "an attribute selector inside :not() plus another pseudo-class", args: ["input:not([type=\"checkbox\"]):focus-visible"], expected: [0, 2, 1] },
          { description: "nested :is() and :not() arguments", args: [":is(:not(#x), .y .z)"], expected: [1, 0, 0] },
          { description: "a legacy single-colon pseudo-element counts as a type", args: ["p:first-line"], expected: [0, 0, 2], isEdgeCase: true },
          { description: "universal selectors and combinators add nothing", args: ["* > *"], expected: [0, 0, 0], isEdgeCase: true },
          { description: "eleven classes stay in the class column", args: [".a.b.c.d.e.f.g.h.i.j.k"], expected: [0, 11, 0], isEdgeCase: true },
          { description: ":not() whose only argument is a :where() adds nothing", args: ["a:not(:where(#x))"], expected: [0, 0, 1], isEdgeCase: true },
          { description: "an escaped colon is part of the class name", args: [".md\\:flex:hover"], expected: [0, 2, 0], isEdgeCase: true },
          { description: "uppercase names and extra whitespace around a combinator", args: ["DIV#Main.Card   >   P"], expected: [1, 1, 2], isEdgeCase: true },
          { description: "a comma inside quotes isn't a list separator", args: ["[data-x=\"a,b\"] span"], expected: [0, 1, 1], isEdgeCase: true },
          { description: "empty string", args: [""], expected: null, isEdgeCase: true },
          { description: "whitespace only", args: ["   "], expected: null, isEdgeCase: true },
          { description: "a selector list has no single specificity", args: ["h1, h2"], expected: null, isEdgeCase: true },
          { description: "unclosed parenthesis", args: ["div:not(.a"], expected: null, isEdgeCase: true },
          { description: "unclosed attribute bracket", args: ["a[href"], expected: null, isEdgeCase: true },
          { description: "dangling combinator at the end", args: ["ul >"], expected: null, isEdgeCase: true },
          { description: "leading combinator outside :has()", args: ["> p"], expected: null, isEdgeCase: true },
          { description: "an ID selector with no name", args: ["nav#"], expected: null, isEdgeCase: true },
        ],
      },
    },
    {
      id: "css-flexbox",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "Flexbox Deep Dive",
      summary:
        "Flexbox is a one-dimensional layout algorithm: it distributes space along a main axis and aligns items on the cross axis, negotiating sizes from the content outward. That content-first behaviour suits navbars, toolbars, media objects, centring and wrapping tag lists, and fails when you want strict columns that line up across rows, which is Grid's job.\n\nThe sizing algorithm is where seniors earn their keep. Each item starts from its `flex-basis` (falling back to `width`, then to its content size when both are `auto`); leftover space is shared out by `flex-grow` ratios, and overflow is taken back by `flex-shrink` weighted by each item's basis, so bigger items give up more pixels. `flex: 1` sets a zero basis (`1 1 0%`), so items end up equal regardless of content, while `flex: auto` (`1 1 auto`) grows from content size, so longer items stay longer. The initial value is `0 1 auto`: items shrink but don't grow. `min-width` and `max-width` still clamp the result, whatever the basis says.\n\nThe most common flex bug is the automatic minimum size. Flex items default to `min-width: auto`, which for items that aren't scroll containers means roughly their min-content width, so a long URL, a `<pre>`, a wide table or a nested flex row refuses to shrink and blows out the container; `text-overflow: ellipsis` silently fails for the same reason. Set `min-width: 0` (or `overflow: hidden`) on the flex item itself, not on the overflowing grandchild. Other traps: margins don't collapse inside flex containers, and `margin-inline-start: auto` absorbs free space (the cleanest way to push one item to the end); `align-items` defaults to stretching, which distorts images in a row; `justify-self` does nothing in flexbox; and `order` or `row-reverse` change only the visual order, never tab or reading order.",
      level: "intermediate",
      estMinutes: 65,
      webRefs: [
        { label: "MDN: Basic concepts of flexbox", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout/Basic_concepts", kind: "docs" },
        { label: "CSS Flexbox Level 1: Automatic minimum size of flex items", url: "https://drafts.csswg.org/css-flexbox-1/#min-size-auto", kind: "spec" },
        { label: "Josh W. Comeau: An Interactive Guide to Flexbox", url: "https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/", kind: "article" },
        { label: "CSS-Tricks: A Complete Guide to Flexbox", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/", kind: "article" },
      ],
      video: {
        title: "Learn flexbox the easy way",
        channel: "Kevin Powell",
        url: "https://www.youtube.com/watch?v=u044iM9xsWU",
        videoId: "u044iM9xsWU",
        durationLabel: "34:04",
      },
      alternateVideos: [
        {
          title: "CSS Tutorial – Full Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=OXGznpKZ_sA",
          videoId: "OXGznpKZ_sA",
          durationLabel: "11:08:10",
          startSeconds: 14273,
          chapterLabel: "Chapter 14: Flexbox",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "css-flexbox-q1",
          prompt:
            "Two flex items contain \"Hi\" and \"A much longer label\". How is the row's space shared with `flex: 1` on both, and with `flex: auto` on both?",
          options: [
            "`flex: 1`: equal widths; `flex: auto`: only the leftover space is shared, so the longer item stays wider",
            "Equal widths in both cases",
            "`flex: 1`: the longer item is wider; `flex: auto`: equal widths",
            "Both size to their content and leave the remaining space empty",
          ],
          correctIndex: 0,
          explanation:
            "`flex: 1` means `1 1 0%`: with a zero basis all the space is free space split by the grow ratio, so the items match as long as their content fits. `flex: auto` (`1 1 auto`) starts from content size and only shares what's left.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-flexbox-q2",
          prompt:
            "On a narrow screen the long `<pre>` pushes the whole row wider than the viewport instead of scrolling. What's the fix?\n\n```css\n.row { display: flex; }\n.sidebar { flex: 0 0 200px; }\n.content { flex: 1; }\n.content pre { overflow-x: auto; }\n```",
          options: [
            "Add `min-width: 0` to `.content`",
            "Add `flex-shrink: 1` to `.content`",
            "Add `overflow-x: auto` to `.row`",
            "Add `width: 100%` to the `pre`",
          ],
          correctIndex: 0,
          explanation:
            "`.content` has `min-width: auto`, which resolves to its min-content width: the `pre`'s longest line. `min-width: 0` lets the item shrink so the `pre`'s own scrollbar can work; `flex-shrink` is already 1.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-flexbox-q3",
          prompt: "Which statements about a flex item's automatic minimum size are true? (Select all that apply.)",
          options: [
            "With `overflow: visible`, `min-width: auto` usually resolves to the item's min-content width",
            "An item with `overflow: hidden` has an automatic minimum of 0",
            "It's why `text-overflow: ellipsis` inside a flex item often does nothing until you add `min-width: 0`",
            "`flex-shrink: 999` lets an item shrink below its min-content width",
            "It only applies when `flex-wrap: wrap` is set",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The content-based minimum only applies to items that aren't scroll containers, so `overflow: hidden`, `auto` or `scroll` removes it. Shrink factors distribute negative space but can't break through a minimum size.",
        },
        {
          id: "css-flexbox-q4",
          prompt:
            "The container is 500px wide with no gap. Ignoring content minimums, how wide do the items end up?\n\n```css\n.a { flex: 0 1 400px; }\n.b { flex: 0 1 200px; }\n```",
          options: [
            "`.a` ≈ 333.33px, `.b` ≈ 166.67px",
            "`.a` 350px, `.b` 150px",
            "`.a` 400px, `.b` 100px",
            "`.a` 300px, `.b` 200px",
          ],
          correctIndex: 0,
          explanation:
            "They overflow by 100px. Shrinking is weighted by `flex-shrink × flex-basis` (400 vs 200), so `.a` gives up two thirds (66.67px) and `.b` one third (33.33px). Equal shrink factors don't mean equal shrinking.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-flexbox-q5",
          prompt:
            "In a flex navbar, how do you push the last item (\"Log out\") to the far end while the others stay at the start?",
          options: [
            "`margin-inline-start: auto` on the last item",
            "`justify-self: end` on the last item",
            "`float: right` on the last item",
            "`align-self: flex-end` on the last item",
          ],
          correctIndex: 0,
          explanation:
            "Auto margins absorb free space along the main axis before `justify-content` is applied. `justify-self` is ignored in flex layout, floats don't apply to flex items, and `align-self` works on the cross axis.",
        },
        {
          id: "css-flexbox-q6",
          prompt:
            "An `<img>` in a `display: flex` row is stretched vertically to match a taller text column next to it. Which fix works?",
          options: [
            "`align-self: flex-start` (or `start`) on the image",
            "`height: auto` on the image",
            "`flex-shrink: 0` on the image",
            "`justify-content: flex-start` on the container",
          ],
          correctIndex: 0,
          explanation:
            "Items stretch on the cross axis when `align-self` resolves to stretch and their cross size is `auto`, so `height: auto` is exactly what gets stretched. `flex-shrink` and `justify-content` act on the main axis.",
        },
        {
          id: "css-flexbox-q7",
          prompt:
            "A form uses `flex-direction: row-reverse` to show \"Submit\" on the right. Which statements are true? (Select all that apply.)",
          options: [
            "Tab order still follows the DOM order",
            "Screen readers still read the items in DOM order",
            "`justify-content: flex-start` now packs the items against the right edge",
            "`order: -1` on an item also moves it earlier in the tab order",
            "Assistive technology sees the reversed order",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`row-reverse` swaps main-start and main-end, so `flex-start` means the right edge in a left-to-right page. Visual reordering never touches the DOM, which is what focus and assistive technology follow.",
        },
        {
          id: "css-flexbox-q8",
          prompt:
            "In a row flex container with plenty of space, how wide is this item?\n\n```css\n.item { width: 300px; flex: 0 0 200px; }\n```",
          options: ["`200px`", "`300px`", "`500px`", "Its content width"],
          correctIndex: 0,
          explanation:
            "A `flex-basis` other than `auto` overrides `width` along the main axis. `width` only acts as the basis when `flex-basis` is `auto`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-flexbox-q9",
          prompt: "And this one?\n\n```css\n.item { flex: 0 0 400px; max-width: 250px; }\n```",
          options: ["`250px`", "`400px`", "`325px`", "`0`, because the constraints conflict"],
          correctIndex: 0,
          explanation:
            "The basis is where the algorithm starts, but `min-width` and `max-width` clamp the final size. The same rule is why a `min-width` on an item stops it shrinking.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-flexbox-q10",
          prompt:
            "A card list uses `display: flex; flex-wrap: wrap;` with `flex: 1 1 250px` on each card. The last row has two cards that stretch much wider than the cards above. Why?",
          options: [
            "Each flex line distributes its own free space, so the last line's space is shared by only two cards; Grid keeps columns aligned across rows",
            "`flex-wrap` resets `flex-grow` on the last line",
            "The last line ignores `flex-basis`",
            "It's a browser bug that adding `gap` fixes",
          ],
          correctIndex: 0,
          explanation:
            "Flexbox has no columns to align to: every line is laid out on its own. `grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))` gives the same wrapping with consistent columns.",
        },
      ],
    },
    {
      id: "css-grid",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "CSS Grid Deep Dive",
      summary:
        "Grid is two-dimensional: you define tracks on both axes and place items into the resulting cells, so rows and columns line up whatever the content, which Flexbox can't guarantee. Reach for it for page layout, card grids, forms with aligned labels and any component where things must line up across rows; reach for Flexbox when content should decide each item's size along a single line.\n\nTrack sizing is the part worth really understanding. `fr` shares out the space left after fixed and content-sized tracks are resolved, but `1fr` really means `minmax(auto, 1fr)`: a track can't shrink below its content's minimum, so one long word or unshrinkable image makes \"equal\" columns unequal. `minmax(0, 1fr)` gives truly equal columns. `auto` tracks size to content and only stretch into free space when there are no `fr` tracks. `repeat(auto-fill, minmax(min(100%, 16rem), 1fr))` is a responsive grid without media queries: `auto-fit` collapses empty tracks so items stretch, `auto-fill` keeps them, and the inner `min()` prevents overflow in containers narrower than 16rem. `min-content`, `max-content` and `fit-content()` let content drive track sizes deliberately.\n\nPlacement is automatic until you say otherwise. Explicitly placed items go first, the rest fill the next free cell in order (leaving holes when a spanning item doesn't fit), and anything beyond the template lands in implicit tracks sized by `grid-auto-rows`/`grid-auto-columns`. `grid-auto-flow: dense` backfills holes but makes visual order diverge from DOM and focus order. Named areas keep layouts readable and are easy to rearrange in a media query, but every row must have the same number of cells and each area must be a rectangle. `subgrid` (Baseline since 2023) lets nested elements such as a card's title, body and footer align to the parent's tracks, fixing \"the card footers don't line up\" without fixed heights or JavaScript.",
      level: "advanced",
      estMinutes: 75,
      isMilestone: true,
      webRefs: [
        { label: "MDN: Basic concepts of grid layout", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Basic_concepts", kind: "docs" },
        { label: "MDN: Subgrid", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Subgrid", kind: "docs" },
        { label: "Josh W. Comeau: An Interactive Guide to CSS Grid", url: "https://www.joshwcomeau.com/css/interactive-guide-to-grid/", kind: "article" },
        { label: "CSS-Tricks: A Complete Guide to CSS Grid Layout", url: "https://css-tricks.com/complete-guide-css-grid-layout/", kind: "article" },
      ],
      video: {
        title: "Learn CSS Grid the easy way",
        channel: "Kevin Powell",
        url: "https://www.youtube.com/watch?v=rg7Fvvl3taU",
        videoId: "rg7Fvvl3taU",
        durationLabel: "37:03",
      },
      alternateVideos: [
        {
          title: "CSS Tutorial – Full Course for Beginners",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=OXGznpKZ_sA",
          videoId: "OXGznpKZ_sA",
          durationLabel: "11:08:10",
          startSeconds: 15699,
          chapterLabel: "Chapter 15: Grid Layout",
        },
        {
          title: "Easy and more consistent layouts using subgrid",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=IIQa9f0REtM",
          videoId: "IIQa9f0REtM",
          durationLabel: "8:01",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "css-grid-q1",
          prompt:
            "The first cell contains an unshrinkable 400px-wide image (no `max-width`). How wide are the three columns?\n\n```css\n.grid {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n  width: 600px;\n}\n```",
          options: [
            "400px, 100px and 100px: `1fr` can't go below its content's minimum, so the other tracks share what's left",
            "200px each, with the image overflowing the first cell",
            "200px each, with the image scaled down to fit",
            "The grid grows to 1200px so the columns can stay equal at 400px",
          ],
          correctIndex: 0,
          explanation:
            "`1fr` is `minmax(auto, 1fr)`. The first track's minimum is the image's 400px, so it's treated as inflexible and the remaining 200px is split between the other two `fr` tracks.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-grid-q2",
          prompt:
            "Which change makes those three columns truly equal (200px each), leaving the image to overflow or be constrained by `max-width: 100%`?",
          options: [
            "`grid-template-columns: repeat(3, minmax(0, 1fr));`",
            "`grid-template-columns: repeat(3, auto);`",
            "`grid-template-columns: repeat(3, 1fr); justify-items: stretch;`",
            "`grid-auto-columns: 1fr;`",
          ],
          correctIndex: 0,
          explanation:
            "A minimum of 0 removes the content-based floor, so space is divided purely by the flex factor. `auto` tracks size to content, and `justify-items` aligns items inside tracks without changing track sizes.",
        },
        {
          id: "css-grid-q3",
          prompt:
            "The container is 1000px wide (no gap) and holds only two items. How wide is each item with `repeat(auto-fill, minmax(200px, 1fr))`, and with `repeat(auto-fit, minmax(200px, 1fr))`?",
          options: [
            "`auto-fill`: 200px each, with three empty tracks left over; `auto-fit`: 500px each, because empty tracks collapse",
            "500px each in both cases",
            "200px each in both cases",
            "`auto-fill`: 500px each; `auto-fit`: 200px each",
          ],
          correctIndex: 0,
          explanation:
            "Both create as many 200px-minimum tracks as fit (five). `auto-fill` keeps the empty ones, so five tracks share the space; `auto-fit` collapses empty tracks to zero, so the two items take everything.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-grid-q4",
          prompt:
            "A header uses `grid-template-columns: auto 1fr auto` for logo, navigation and actions. Which statements are true? (Select all that apply.)",
          options: [
            "The `auto` columns size to their content",
            "The `1fr` column takes all the remaining space",
            "It's a common pattern for a flexible middle between content-sized sides",
            "The `auto` columns also stretch to share the free space",
            "`auto` behaves exactly like `1fr` here",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`auto` tracks only stretch into free space when there are no flexible (`fr`) tracks. With a `1fr` track present, the leftover goes to it and the `auto` tracks stay at their content size.",
        },
        {
          id: "css-grid-q5",
          prompt:
            "With default auto-placement, where do C and D end up?\n\n```css\n.grid { display: grid; grid-template-columns: repeat(3, 1fr); }\n.c { grid-column: span 2; }\n```\n\n```html\n<div class=\"grid\">\n  <div>A</div><div>B</div><div class=\"c\">C</div><div>D</div>\n</div>\n```",
          options: [
            "C spans columns 1–2 of row 2, D goes to row 2 column 3, and row 1 column 3 stays empty",
            "C wraps from row 1 column 3 into row 2 column 1",
            "D moves up to fill row 1 column 3",
            "C creates an implicit fourth column in row 1",
          ],
          correctIndex: 0,
          explanation:
            "The auto-placement cursor only moves forward: C doesn't fit in the single free cell left in row 1, so it starts row 2, and D follows it. `grid-auto-flow: dense` would backfill the hole with D.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-grid-q6",
          prompt: "What's the main cost of `grid-auto-flow: dense`?",
          options: [
            "Items can appear in a different visual order from the DOM, so focus and reading order jump around",
            "It disables `grid-template-areas`",
            "It forces every row to the height of the tallest item in the grid",
            "It only works with fixed-size tracks",
          ],
          correctIndex: 0,
          explanation:
            "Backfilling moves later items into earlier holes. That's fine for a gallery of equivalent images but confusing wherever order matters (WCAG 1.3.2 and 2.4.3).",
        },
        {
          id: "css-grid-q7",
          prompt:
            "A grid has `grid-template-columns: repeat(3, 1fr); grid-template-rows: 100px 100px;` and nine items. How tall is the third row?",
          options: [
            "As tall as its content: it's an implicit row sized by `grid-auto-rows`, which defaults to `auto`",
            "100px, because the row template repeats",
            "0, because only two rows were defined",
            "There's no third row: the last three items overflow the grid",
          ],
          correctIndex: 0,
          explanation:
            "Items beyond the explicit template create implicit tracks. Set `grid-auto-rows: 100px` (or `minmax(100px, auto)`) if they should match the explicit rows.",
        },
        {
          id: "css-grid-q8",
          prompt:
            "Cards in a grid each span three rows and use `display: grid; grid-template-rows: subgrid;`. Which statements are true? (Select all that apply.)",
          options: [
            "Each card's title, body and footer sit on the parent's row tracks, so they line up across cards",
            "The card must be a grid item that spans the rows it subgrids",
            "The subgrid uses the parent's `row-gap` unless it sets its own",
            "The subgrid can add extra implicit rows beyond its span",
            "Subgrid only works in Chromium-based browsers",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "A subgrid adopts the parent's tracks for the area it spans, gap included by default, so the tallest title in a row sizes that track for every card. It can't create implicit tracks in the subgridded axis, and it has been Baseline since September 2023.",
        },
        {
          id: "css-grid-q9",
          prompt:
            "What happens with this declaration?\n\n```css\n.layout {\n  display: grid;\n  grid-template-columns: 200px 1fr;\n  grid-template-areas:\n    \"header header\"\n    \"sidebar main\"\n    \"footer\";\n}\n```",
          options: [
            "The `grid-template-areas` declaration is invalid, because every row must have the same number of cells, so it's ignored",
            "The footer spans both columns",
            "The footer sits in the first column and the second cell stays empty",
            "The grid creates an implicit third column for the footer row",
          ],
          correctIndex: 0,
          explanation:
            "Invalid declarations are dropped at parse time, so none of the named areas exist and items with `grid-area: footer` land in implicit tracks. Write `\"footer footer\"`; areas must also be rectangles, so L-shapes are invalid too.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-grid-q10",
          prompt:
            "A sidebar placed in an `auto` grid column gets `container-type: inline-size` so its widgets can use container queries. The column collapses to almost nothing. Why?",
          options: [
            "Inline-size containment means the sidebar's width can't be computed from its children, so its content contribution to the `auto` track is zero",
            "Container queries only work inside flex containers",
            "`container-type` sets `width: 0` by default",
            "Grid items can't be query containers",
          ],
          correctIndex: 0,
          explanation:
            "A size container has to get its size from outside: give the track a definite or flexible size (`16rem`, `minmax(12rem, 20%)`) or the sidebar an explicit width. Floats and flex items sized from their content collapse the same way.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-grid-q11",
          prompt: "A 1000px-wide grid has three 200px columns. Which property centres the column tracks inside the container?",
          options: ["`justify-content: center`", "`justify-items: center`", "`align-content: center`", "`place-self: center` on each item"],
          correctIndex: 0,
          explanation:
            "`justify-content` distributes tracks when they don't fill the container; `justify-items` aligns each item inside its own cell. `align-content` works on the block axis, the rows.",
        },
      ],
    },
    {
      id: "css-responsive-media-queries",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "Responsive Design & Media Queries",
      summary:
        "Responsive design is about letting layouts adapt to the space they get and to the people using them, not about targeting device models. The modern toolkit has three layers: intrinsic layouts that need no breakpoints (wrapping flex rows, `repeat(auto-fit, minmax(min(100%, 16rem), 1fr))`, `clamp()` for fluid type and spacing), container queries for components that adapt to the space their parent gives them, and media queries for page-level decisions and user preferences such as `prefers-reduced-motion`, `prefers-color-scheme`, `hover` and `pointer`.\n\nMedia queries have precise semantics that trip people up. A comma-separated list matches if any query matches; `not` negates a whole query (`not screen and (color)` means \"not (screen and color)\"); an invalid query is dropped on its own without killing the rest of the list. `min-width` and `max-width` are inclusive, which is why frameworks write `max-width: 767.98px`; Level 4 range syntax (`(width < 768px)`, `(400px <= width <= 700px)`), Baseline since 2023, removes that hack. `em` and `rem` in a media query are relative to the browser's initial font size (the user's setting, usually 16px), never your `html { font-size }`, so em-based breakpoints respond to users who enlarge their default text. None of it works on phones without the viewport meta tag.\n\nContainer queries (`container-type: inline-size` plus `@container (width > 30rem)`) answer \"how much room does this component have?\" instead of \"how wide is the window?\", which is what reusable components need. The catch is size containment: a container can't size itself from its content, so one in a shrink-to-fit context (a float, a flex item or an `auto` grid column sized by content) can collapse to zero, and an element can only query an ancestor container, never itself. On mobile, prefer `dvh`/`svh` to `100vh`, which is measured with the browser toolbars retracted and overflows the visible area while they're showing.",
      level: "advanced",
      estMinutes: 90,
      webRefs: [
        { label: "MDN: Using media queries", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using", kind: "docs" },
        { label: "Media Queries Level 4", url: "https://drafts.csswg.org/mediaqueries-4/", kind: "spec" },
        { label: "MDN: CSS container queries", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries", kind: "docs" },
        { label: "Josh W. Comeau: The Surprising Truth About Pixels and Accessibility", url: "https://www.joshwcomeau.com/css/surprising-truth-about-pixels-and-accessibility/", kind: "article" },
      ],
      video: {
        title: "CSS Tutorial – Full Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=OXGznpKZ_sA",
        videoId: "OXGznpKZ_sA",
        durationLabel: "11:08:10",
        startSeconds: 19960,
        chapterLabel: "Chapter 17: Media Queries",
      },
      alternateVideos: [
        {
          title: "Learn how to use Media queries & Container queries",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=2rlWBZ17Wes",
          videoId: "2rlWBZ17Wes",
          durationLabel: "34:32",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `matchesMedia(query, env)`: return `true` if the media query list `query` matches the environment `env`, as `window.matchMedia(query).matches` would in a browser that follows Media Queries Level 4.\n\n`env` always has `width` and `height` (the viewport in CSS pixels). Optional fields and their defaults: `type` (`\"screen\"`, or `\"print\"`), `defaultFontSize` (`16`, the user's browser setting), `hover` (`\"hover\"`, or `\"none\"`), `pointer` (`\"fine\"`, or `\"coarse\"` or `\"none\"`), `prefersReducedMotion` (`\"no-preference\"`, or `\"reduce\"`) and `prefersColorScheme` (`\"light\"`, or `\"dark\"`). It may also contain `rootFontSize` (the page's `html { font-size }`), which media queries must ignore.\n\nGrammar (keywords, names and units are case-insensitive):\n\n- A list of queries separated by top-level commas matches if any query matches. An empty or whitespace-only list matches.\n- A query is either `[not | only] <type> [and <condition>]` or just a `<condition>`. `<type>` is `all` (always matches), `screen`, `print` or any other identifier (never matches). A leading `not` negates the whole query; `only` changes nothing.\n- A `<condition>` is `not <term>`, or terms joined only by `and`, or only by `or`. After a media type, `or` isn't allowed. Mixing `and` and `or` at one level without extra parentheses is a syntax error.\n- A `<term>` is `( <condition> )` or `( <feature> )`. A feature is `(name: value)`, `(name)` (boolean context), `(name op value)`, `(value op name)` or `(value op name op value)`, where `op` is `<`, `<=`, `>`, `>=` or `=`. `=` is only allowed in the single-comparison forms, and in the double form both operators must point the same way.\n- Range features: `width` and `height`, which also accept `min-` and `max-` prefixes (both inclusive) in the `name: value` form. Values are numbers with `px`, `em` or `rem` (1em = 1rem = `env.defaultFontSize` px), or a bare `0`.\n- Discrete features: `orientation` (`portrait` when `height >= width`, otherwise `landscape`), `hover`, `pointer`, `prefers-reduced-motion` and `prefers-color-scheme`. They accept only their listed values, with no prefixes and no range syntax.\n- Boolean context `(name)` is true unless the feature's value is `0`, `none` or `no-preference`.\n\nErrors:\n\n- A syntax error (unbalanced parentheses, a missing or extra `and`, mixed `and`/`or`, a keyword glued to a parenthesis such as `and(`, stray tokens) makes only that query false. An unclosed parenthesis swallows the rest of the string, commas included.\n- An unknown feature, an invalid value (such as a unitless `600`), a prefix on a discrete feature, or parenthesised content that isn't a valid condition or feature is `unknown`. Combine with three-valued logic: `not unknown` is unknown, `false and unknown` is false, `true or unknown` is true. A query whose final value is unknown is false.\n\nThe starter includes a `tokenize(str)` helper that splits a query into tokens; use it or write your own.",
        starterCode:
          "/**\n * Returns true if the media query list `query` matches `env`.\n * @param {string} query\n * @param {{ width: number, height: number, type?: string, defaultFontSize?: number, rootFontSize?: number,\n *   hover?: string, pointer?: string, prefersReducedMotion?: string, prefersColorScheme?: string }} env\n * @returns {boolean}\n */\nfunction matchesMedia(query, env) {\n  // Your code here\n}\n\n/**\n * Splits a media query string into tokens (whitespace is skipped):\n * - { type: \"ident\", value }       identifiers, lower-cased\n * - { type: \"function\", value }    an identifier immediately followed by \"(\" (the \"(\" is part of it)\n * - { type: \"number\", value, unit } e.g. 600px -> { value: 600, unit: \"px\" }; unit is \"\" for bare numbers\n * - { type: \"op\", value }          \"<\", \"<=\", \">\", \">=\" or \"=\"\n * - { type: \"(\" }, { type: \")\" }, { type: \",\" }, { type: \":\" }\n * - { type: \"delim\", value }       any other character\n */\nfunction tokenize(str) {\n  const tokens = [];\n  let i = 0;\n  while (i < str.length) {\n    const ch = str[i];\n    if (/\\s/.test(ch)) {\n      i++;\n      continue;\n    }\n    if (ch === \"(\" || ch === \")\" || ch === \",\" || ch === \":\") {\n      tokens.push({ type: ch });\n      i++;\n      continue;\n    }\n    if (ch === \"<\" || ch === \">\") {\n      const op = str[i + 1] === \"=\" ? ch + \"=\" : ch;\n      tokens.push({ type: \"op\", value: op });\n      i += op.length;\n      continue;\n    }\n    if (ch === \"=\") {\n      tokens.push({ type: \"op\", value: \"=\" });\n      i++;\n      continue;\n    }\n    const num = /^[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)([a-z%]*)/i.exec(str.slice(i));\n    if (num) {\n      tokens.push({ type: \"number\", value: parseFloat(num[0]), unit: num[1].toLowerCase() });\n      i += num[0].length;\n      continue;\n    }\n    const ident = /^-?[a-z_][\\w-]*/i.exec(str.slice(i));\n    if (ident) {\n      i += ident[0].length;\n      if (str[i] === \"(\") {\n        tokens.push({ type: \"function\", value: ident[0].toLowerCase() });\n        i++;\n      } else {\n        tokens.push({ type: \"ident\", value: ident[0].toLowerCase() });\n      }\n      continue;\n    }\n    tokens.push({ type: \"delim\", value: ch });\n    i++;\n  }\n  return tokens;\n}\n",
        functionName: "matchesMedia",
        testCases: [
          { description: "a basic min-width query", args: ["(min-width: 768px)", { width: 1024, height: 768 }], expected: true },
          { description: "max-width is inclusive at the boundary", args: ["(max-width: 600px)", { width: 600, height: 800 }], expected: true, isEdgeCase: true },
          { description: "range syntax `<` is exclusive at the boundary", args: ["(width < 600px)", { width: 600, height: 800 }], expected: false, isEdgeCase: true },
          { description: "a between-breakpoints query joined with `and`", args: ["(min-width: 768px) and (max-width: 1023.98px)", { width: 1024, height: 768 }], expected: false },
          { description: "a double-sided range", args: ["(400px <= width <= 700px)", { width: 700, height: 900 }], expected: true },
          { description: "a comma means OR", args: ["(max-width: 600px), print", { type: "print", width: 1200, height: 800 }], expected: true },
          { description: "the media type must match", args: ["screen and (max-width: 600px)", { type: "print", width: 500, height: 800 }], expected: false },
          { description: "`not` negates the whole query, not just the media type", args: ["not screen and (orientation: portrait)", { width: 800, height: 600 }], expected: true, isEdgeCase: true },
          { description: "`not` turns a matching query into a non-match", args: ["not screen and (orientation: portrait)", { width: 400, height: 800 }], expected: false },
          { description: "em ignores the page's root font size", args: ["(min-width: 40em)", { width: 500, height: 800, rootFontSize: 10 }], expected: false, isEdgeCase: true },
          { description: "em follows the user's default font size", args: ["(min-width: 40em)", { width: 700, height: 800, defaultFontSize: 20 }], expected: false, isEdgeCase: true },
          { description: "keywords, names and units are case-insensitive, and `only` changes nothing", args: ["ONLY Screen AND (Min-Width: 37.5EM)", { width: 600, height: 900 }], expected: true },
          { description: "a user-preference feature", args: ["(prefers-reduced-motion: reduce)", { width: 1280, height: 720, prefersReducedMotion: "reduce" }], expected: true },
          { description: "boolean context: `no-preference` is false", args: ["(prefers-reduced-motion)", { width: 1280, height: 720 }], expected: false, isEdgeCase: true },
          { description: "interaction features on a touch phone", args: ["(hover: hover) and (pointer: fine)", { width: 390, height: 844, hover: "none", pointer: "coarse" }], expected: false },
          { description: "Level 4 `or` between conditions", args: ["(width > 600px) or (orientation: portrait)", { width: 500, height: 800 }], expected: true },
          { description: "`not` on a condition after a media type", args: ["screen and not (min-width: 600px)", { width: 500, height: 800 }], expected: true },
          { description: "an empty media query list matches", args: ["", { width: 320, height: 640 }], expected: true, isEdgeCase: true },
          { description: "a syntax error drops only that query", args: ["screen and, (orientation: landscape)", { width: 1024, height: 768 }], expected: true, isEdgeCase: true },
          { description: "an unclosed parenthesis swallows the rest of the list", args: ["(min-width: 100px, (orientation: landscape)", { width: 1024, height: 768 }], expected: false, isEdgeCase: true },
          { description: "mixing `and` and `or` without parentheses is a syntax error", args: ["(min-width: 600px) and (max-width: 900px) or (orientation: portrait)", { width: 700, height: 900 }], expected: false, isEdgeCase: true },
          { description: "discrete features take no min-/max- prefix", args: ["(min-orientation: portrait)", { width: 400, height: 800 }], expected: false, isEdgeCase: true },
          { description: "a unitless non-zero length is invalid", args: ["(min-width: 600)", { width: 1024, height: 768 }], expected: false, isEdgeCase: true },
          { description: "unknown feature: true or unknown is true", args: ["(max-weight: 3kg) or (min-width: 1px)", { width: 320, height: 640 }], expected: true, isEdgeCase: true },
          { description: "not unknown is still unknown, so the query fails", args: ["not (max-weight: 3kg)", { width: 320, height: 640 }], expected: false, isEdgeCase: true },
          { description: "`and(` is a function token, not a keyword", args: ["screen and(min-width: 100px)", { width: 1024, height: 768 }], expected: false, isEdgeCase: true },
        ],
      },
    },
    {
      id: "css-custom-properties",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "CSS Custom Properties (Variables)",
      summary:
        "Custom properties are real CSS properties whose values get substituted into other properties with `var()`. Unlike Sass variables, which vanish at compile time, they live in the cascade: they inherit, can be scoped to a component, and can be overridden by a media query, a `:hover` state, a `[data-theme]` attribute or JavaScript (`el.style.setProperty`). That makes them the runtime layer for design tokens and theming, while preprocessors still handle loops and build-time maths.\n\nTheir semantics are unusual. An unregistered custom property holds an unparsed token stream, and nothing is validated until `var()` substitution. If the substituted value is invalid for the property, the declaration is invalid at computed-value time: the property behaves as `unset` (its inherited or initial value), and an earlier valid declaration in the same rule is not used, because it already lost the cascade. The fallback in `var(--x, fallback)` only applies when `--x` is missing or guaranteed-invalid (never set, set to `initial`, or part of a cycle), not when it holds a value the property rejects. Relative units stay tokens: `--space: 2em` on `:root` resolves against the font size of each element that uses it. Names are case-sensitive, and `var()` doesn't work in media query conditions or selectors.\n\n`@property` (Baseline since July 2024) registers a custom property with a `syntax`, `inherits` and `initial-value`. Registration adds type checking (a value that doesn't match the syntax falls back to the inherited or initial value), lets you turn inheritance off, computes values eagerly (a `<length>` becomes absolute pixels where it's declared), and makes the property animatable: unregistered properties can only flip discretely, while a registered `<color>`, `<angle>` or `<percentage>` interpolates, enabling animated gradients in pure CSS. Changing an inherited property on `:root` restyles every element that inherits it, so set fast-changing values, like pointer coordinates, on the element that uses them.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "MDN: Using CSS custom properties (variables)", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties", kind: "docs" },
        { label: "CSS Values Level 5: Invalid at computed-value time", url: "https://drafts.csswg.org/css-values-5/#invalid-at-computed-value-time", kind: "spec" },
        { label: "MDN: @property", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property", kind: "docs" },
        { label: "CSS-Tricks: A Complete Guide to Custom Properties", url: "https://css-tricks.com/a-complete-guide-to-custom-properties/", kind: "article" },
      ],
      video: {
        title: "CSS Tutorial – Full Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=OXGznpKZ_sA",
        videoId: "OXGznpKZ_sA",
        durationLabel: "11:08:10",
        startSeconds: 24776,
        chapterLabel: "Chapter 20: Variables",
      },
      alternateVideos: [
        {
          title: "Using CSS custom properties like this is a waste",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=_2LwjfYc1x8",
          videoId: "_2LwjfYc1x8",
          durationLabel: "16:12",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "css-custom-properties-q1",
          prompt:
            "The title sits inside `<body style=\"color: navy\">`. What colour is it?\n\n```css\n:root { --brand: 20px; }\n.title {\n  color: red;\n  color: var(--brand);\n}\n```",
          options: ["Navy", "Red", "Black, the initial value", "Transparent"],
          correctIndex: 0,
          explanation:
            "The second declaration wins the cascade, then turns out to be invalid at computed-value time, so `color` behaves as `unset`, which for an inherited property means inheriting navy. The earlier `red` already lost and isn't a fallback.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-custom-properties-q2",
          prompt:
            "With `--bg: 42` set on `:root`, what background does `.box` get?\n\n```css\n.box { background: var(--bg, hotpink); }\n```",
          options: ["Transparent", "Hot pink", "The parent's background colour", "Black"],
          correctIndex: 0,
          explanation:
            "`--bg` is defined, so the fallback is never considered. `42` isn't a valid background, so the declaration is invalid at computed-value time and `background` takes its initial value (transparent), because it isn't inherited.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-custom-properties-q3",
          prompt: "When is the fallback in `var(--gap, 1rem)` used? (Select all that apply.)",
          options: [
            "`--gap` isn't declared on the element or any ancestor",
            "`--gap` is part of a cycle, such as `--gap: var(--pad); --pad: var(--gap);`",
            "`--gap` is set to `initial`",
            "`--gap` is set to `red` and used in `margin`",
            "`--gap` is registered with `@property` and has an `initial-value`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The fallback applies when the referenced property holds the guaranteed-invalid value: never set, set to `initial` (an unregistered custom property's initial value), or invalidated by a cycle. A registered property always has a value, and a present-but-wrong value never triggers the fallback.",
        },
        {
          id: "css-custom-properties-q4",
          prompt:
            "What's `.card`'s padding?\n\n```css\n:root { font-size: 16px; --space: 2em; }\n.card { font-size: 20px; padding: var(--space); }\n```",
          options: ["`40px`", "`32px`", "`2rem`, so 32px", "`0`, because `em` values can't be stored in a variable"],
          correctIndex: 0,
          explanation:
            "An unregistered custom property inherits as the tokens `2em`, which are only resolved where `var()` is used, against `.card`'s 20px font size.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-custom-properties-q5",
          prompt:
            "Same CSS as before, but `--space` is now registered. What's `.card`'s padding?\n\n```css\n@property --space {\n  syntax: \"<length>\";\n  inherits: true;\n  initial-value: 0px;\n}\n```",
          options: ["`32px`", "`40px`", "`0px`, the initial value", "It's invalid, because `2em` isn't a `<length>`"],
          correctIndex: 0,
          explanation:
            "A registered `<length>` computes to an absolute length on the element where it's declared: 2em × 16px = 32px on `:root`, and descendants inherit 32px. Registration switches inheritance from tokens to computed values.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-custom-properties-q6",
          prompt: "Which statements about animating custom properties are true? (Select all that apply.)",
          options: [
            "Unregistered custom properties animate discretely, flipping from one value to the other partway through",
            "Registering a `syntax` such as `<angle>` or `<color>` lets the browser interpolate the value",
            "A registered property can drive a smoothly animated `conic-gradient()` in pure CSS",
            "`transition: all` makes unregistered custom properties interpolate smoothly",
            "`@property` only works when called from JavaScript via `CSS.registerProperty()`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Without a type, the browser can't know how to interpolate `0deg` to `360deg` inside a token stream, so it swaps values. `@property` is the CSS way to register; `CSS.registerProperty()` is the JavaScript equivalent.",
        },
        {
          id: "css-custom-properties-q7",
          prompt: "What happens with `@media (min-width: var(--bp-md)) { … }`, given `--bp-md: 48rem` on `:root`?",
          options: [
            "The rule never applies: `var()` isn't valid in media query conditions, which aren't evaluated against any element",
            "It works, because custom properties on `:root` are global",
            "It works in Chromium-based browsers only",
            "It works, but only with `px` values",
          ],
          correctIndex: 0,
          explanation:
            "Custom properties belong to elements, while media queries are evaluated for the whole document. Use a preprocessor variable, a build step for custom media queries, or container queries.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-custom-properties-q8",
          prompt: "`--Brand-Color: teal;` is set on `:root`, and a heading uses `color: var(--brand-color);`. What happens?",
          options: [
            "The reference doesn't match, because custom property names are case-sensitive, so `color` is invalid at computed-value time and the heading inherits its colour",
            "The heading turns teal, because CSS property names are case-insensitive",
            "The heading turns teal in every browser except Safari",
            "The whole stylesheet fails to parse",
          ],
          correctIndex: 0,
          explanation:
            "Standard property names are case-insensitive, but custom property names aren't: `--Brand-Color` and `--brand-color` are different properties. With no fallback, the undefined reference makes the declaration invalid at computed-value time.",
        },
        {
          id: "css-custom-properties-q9",
          prompt: "Which approach lets one component switch to a dark palette without touching its internal rules?",
          options: [
            "Redefine its token custom properties on the component root, e.g. `.card[data-theme=\"dark\"] { --surface: #111; --text: #eee; }`",
            "Reassign the Sass variables inside `.card[data-theme=\"dark\"]`",
            "Add `!important` overrides to every rule inside the component",
            "Apply `filter: invert(1)` to the component",
          ],
          correctIndex: 0,
          explanation:
            "Descendants read the tokens through `var()` and inherit the new values, so one rule re-themes the subtree at runtime. Sass variables are resolved at compile time and don't cascade.",
        },
        {
          id: "css-custom-properties-q10",
          prompt:
            "A page updates `--mouse-x` on `document.documentElement` on every `pointermove`, but only one spotlight element uses it. What's the better approach?",
          options: [
            "Set `--mouse-x` on the spotlight element itself, so each update doesn't restyle the whole inheriting tree",
            "Throttle the updates to once per second",
            "Move the value into a Sass variable",
            "Add `!important` to the custom property",
          ],
          correctIndex: 0,
          explanation:
            "An inherited custom property changed on the root has to be recomputed for every descendant that inherits it. Scoping the value to the one element that uses it keeps each update cheap without making the effect laggy.",
        },
      ],
    },
    {
      id: "css-transitions-animations",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "Transitions & Keyframe Animations",
      summary:
        "Transitions animate between two states when a computed value changes (a hover, a class toggle, a new custom-property value); keyframe animations run a timeline you define with `@keyframes`, with iterations, direction, delays and fill modes. Use transitions for interactive state changes and animations for anything that plays on its own or has more than two steps. Scroll-driven animations and view transitions, still rolling out across browsers, now cover choreography that used to need JavaScript.\n\nPerformance depends on which properties you animate. `transform` and `opacity` can usually run on the compositor without layout or paint, so they stay smooth even when the main thread is busy; animating `width`, `height`, `top`, `left` or `margin` triggers layout every frame, and `box-shadow` or `background-color` trigger paint. Move with `translate`, grow with `scale`, fade with `opacity`. `will-change: transform` promotes an element to its own layer ahead of time, but layers cost memory, so apply it around an interaction rather than to everything. `transform` and `opacity` below 1 also create stacking contexts, which can reorder `z-index` in the middle of an animation.\n\nSeveral behaviours surprise experienced developers. A transition needs a before-change style, so an element that's just been inserted or switched from `display: none` doesn't animate; `@starting-style` plus `transition-behavior: allow-discrete` (Baseline since 2024) fixes enter and exit animations. `transition: all` animates properties you never meant to animate. `animation-fill-mode: forwards` keeps the last keyframe applied after the run, overriding normal declarations, and `transitionend` fires once per property and not at all if the transition is cancelled. Respect `prefers-reduced-motion: reduce` by removing large movement, parallax and auto-playing loops; reduced doesn't have to mean none, and short fades are usually fine.",
      level: "intermediate",
      estMinutes: 70,
      webRefs: [
        { label: "MDN: Using CSS transitions", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Transitions/Using", kind: "docs" },
        { label: "MDN: Using CSS animations", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using", kind: "docs" },
        { label: "web.dev: How to create high-performance CSS animations", url: "https://web.dev/articles/animations-guide", kind: "article" },
        { label: "Josh W. Comeau: An Interactive Guide to CSS Transitions", url: "https://www.joshwcomeau.com/animation/css-transitions/", kind: "article" },
      ],
      video: {
        title: "CSS Tutorial – Full Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=OXGznpKZ_sA",
        videoId: "OXGznpKZ_sA",
        durationLabel: "11:08:10",
        startSeconds: 28205,
        chapterLabel: "Chapter 22: Animations",
      },
      alternateVideos: [
        {
          title: "10 CSS animation tips and tricks",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=y8-F5-2EIcg",
          videoId: "y8-F5-2EIcg",
          durationLabel: "20:13",
        },
        {
          title: "We can now transition to and from display: none",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=vmDEHAzj2XE",
          videoId: "vmDEHAzj2XE",
          durationLabel: "21:19",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "css-transitions-animations-q1",
          prompt:
            "Adding `.open` shows the panel instantly, without fading. Why?\n\n```css\n.panel { display: none; opacity: 0; transition: opacity 300ms; }\n.panel.open { display: block; opacity: 1; }\n```",
          options: [
            "An element coming out of `display: none` has no before-change style to transition from; `@starting-style { .panel.open { opacity: 0; } }` supplies one",
            "`opacity` can't be transitioned in the same rule that changes `display`",
            "The transition must be declared on `.panel.open`, not `.panel`",
            "300ms is below the browser's minimum transition duration",
          ],
          correctIndex: 0,
          explanation:
            "Transitions start from the element's previous computed style, and an element with `display: none` isn't rendered, so there's nothing to start from. `@starting-style` defines those starting values; to animate the exit too, add `transition-behavior: allow-discrete` and transition `display`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-transitions-animations-q2",
          prompt:
            "Which properties can typically be animated without triggering layout or paint on every frame? (Select all that apply.)",
          options: ["`transform`", "`opacity`", "`translate`", "`width`", "`box-shadow`", "`margin-left`"],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Transforms (including the individual `translate`, `scale` and `rotate` properties) and opacity can be applied by the compositor to an already-painted layer. `width` and `margin-left` change geometry, so layout runs every frame, and `box-shadow` repaints.",
        },
        {
          id: "css-transitions-animations-q3",
          prompt:
            "After the toast has slid in, adding `.hide` doesn't move it. Why?\n\n```css\n.toast { animation: slide-in 300ms forwards; }\n@keyframes slide-in {\n  from { transform: translateY(100%); }\n  to { transform: translateY(0); }\n}\n.toast.hide { transform: translateY(100%); }\n```",
          options: [
            "The forwards-filled animation keeps applying `translateY(0)`, and animation values override normal declarations",
            "`.toast.hide` has lower specificity than `.toast`",
            "`transform` can't change once an animation has run on the element",
            "The browser caches the final keyframe until the page reloads",
          ],
          correctIndex: 0,
          explanation:
            "Animations sit above all normal author declarations in the cascade, and `forwards` keeps the last keyframe applied indefinitely. Remove the animation when it ends, or drop `forwards` and put the final state in the rule itself.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-transitions-animations-q4",
          prompt:
            "You wait for `transitionend` before removing an element that has `transition: opacity 200ms, transform 300ms`. Which is true?",
          options: [
            "It fires once per transitioned property, and not at all if a transition is cancelled, so check `event.propertyName` and don't rely on it arriving",
            "It fires once, after the longest transition",
            "It fires even when the transition is interrupted",
            "It only fires for `transform`",
          ],
          correctIndex: 0,
          explanation:
            "Interrupted transitions fire `transitioncancel` instead. Removal code should filter by property and have a fallback (a timeout, or awaiting `element.getAnimations()`), or elements get stranded.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-transitions-animations-q5",
          prompt: "Which changes are sensible under `@media (prefers-reduced-motion: reduce)`? (Select all that apply.)",
          options: [
            "Replace a large slide-in with a short fade",
            "Turn off parallax scrolling effects",
            "Stop auto-playing carousels and looping background animations",
            "Remove every animation, including a spinner that shows a request is in progress",
            "Nothing: the setting only affects native apps",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The preference asks for less motion, particularly large movement that can trigger vestibular symptoms, not for zero feedback. Keep meaningful state indicators and swap big motion for fades or instant changes.",
        },
        {
          id: "css-transitions-animations-q6",
          prompt: "Why is `transition: all 300ms` risky on a component?",
          options: [
            "It animates every property that changes, including layout properties and theme colours you never meant to animate",
            "`all` isn't a valid value for `transition-property`",
            "It disables hardware acceleration",
            "It only animates properties declared later in the stylesheet",
          ],
          correctIndex: 0,
          explanation:
            "List the properties you mean (`transition: opacity 200ms, transform 200ms`). With `all`, a theme switch or a width change from a media query suddenly animates too, and layout properties animate at layout cost.",
        },
        {
          id: "css-transitions-animations-q7",
          prompt: "In `transition: opacity 200ms 1s ease-in;`, what is `1s`?",
          options: [
            "The delay",
            "The duration",
            "Nothing: two time values make the declaration invalid",
            "The length of the easing curve",
          ],
          correctIndex: 0,
          explanation:
            "In the `transition` and `animation` shorthands, the first time value is the duration and the second is the delay, so this fade waits one second and then runs for 200ms.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-transitions-animations-q8",
          prompt:
            "How many distinct frames does this sprite animation show per cycle?\n\n```css\n.sprite { animation: walk 1s steps(4) infinite; }\n@keyframes walk { to { background-position: -400px 0; } }\n```",
          options: [
            "4: offsets 0, -100px, -200px and -300px",
            "5: every 100px from 0 to -400px",
            "3",
            "None: it animates smoothly",
          ],
          correctIndex: 0,
          explanation:
            "`steps(4)` defaults to `jump-end`, so the value jumps at the end of each quarter and the final `-400px` is never shown while it loops, which is exactly what a four-frame sprite sheet needs.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-transitions-animations-q9",
          prompt: "Which use of `will-change` is appropriate?",
          options: [
            "Setting `will-change: transform` on a drawer just before it animates and removing it afterwards",
            "`* { will-change: transform; }` so every animation is smooth",
            "`will-change: all` on the page's main container",
            "Permanently adding `will-change: opacity` to every card in a long list",
          ],
          correctIndex: 0,
          explanation:
            "Every promoted layer costs memory and compositing work, so blanket `will-change` can make performance worse. Use it as a targeted hint for an animation you know is about to happen.",
        },
        {
          id: "css-transitions-animations-q10",
          prompt:
            "Cards fade in with a keyframe animation from `opacity: 0` to `opacity: 1`. While a card is fading, its open dropdown (`z-index: 100`) renders under the next card; once the fade ends, it's fine. Why?",
          options: [
            "While `opacity` is below 1 the card forms a stacking context that traps the dropdown's `z-index`; at `opacity: 1` that context disappears",
            "Animated elements always render below static ones",
            "`z-index` is ignored during animations",
            "The dropdown inherits `opacity: 0` and becomes click-through",
          ],
          correctIndex: 0,
          explanation:
            "Stacking contexts appear and disappear as values change, so an animation can reorder painting mid-flight. Raise the card that owns the open menu (for example `position: relative; z-index: 1`), or render the dropdown in the top layer as a popover.",
          isEdgeCaseOrInterviewQuestion: true,
        },
      ],
    },
    {
      id: "css-architecture-bem-utility",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "CSS Architecture: BEM vs Utility-First",
      summary:
        "CSS has one global namespace and a cascade that rewards whoever wrote the most specific or the latest selector, so every large codebase needs a strategy for keeping styles predictable. The strategies differ in where they put the abstraction. BEM (`.card`, `.card__title`, `.card--featured`) keeps every selector a single class, so specificity stays flat and a class name tells you which component owns a style; it pairs well with Sass and CSS Modules. Utility-first (Tailwind and its predecessors) inverts that: small single-purpose classes composed in markup, with your framework's components providing reuse. You trade longer class lists for no naming, CSS that stops growing with the codebase, and design tokens enforced by the class vocabulary. CUBE CSS and similar hybrids keep global typography and layout primitives, add utilities, and reserve blocks for genuinely unique components.\n\nThe failure modes are predictable. BEM elements shouldn't encode DOM depth (`.card__header__title` should be `.card__title`), modifiers sit alongside the base class (`class=\"btn btn--primary\"`), and nesting BEM selectors in Sass (`.card { .card__title {} }`) quietly doubles specificity. With utilities, extracting everything into `@apply` rebuilds a worse BEM; extract a component in your framework instead.\n\nNative CSS now does some of this work. Cascade layers (`@layer reset, base, components, utilities;`) make precedence explicit regardless of specificity: later layers win, unlayered styles beat all layered ones, and for `!important` the order reverses, so a reset layer's important rules beat a utilities layer's. Tailwind v4 emits real layers (`theme`, `base`, `components`, `utilities`), which is why one unlayered third-party rule can override any utility. `:where()` gives zero-specificity defaults, and `@scope` (Baseline since March 2026) limits styles to a subtree with an optional lower boundary. Pick one primary strategy per codebase and document it; mixing three makes debugging slower than any single choice.",
      level: "advanced",
      estMinutes: 60,
      webRefs: [
        { label: "MDN: Organizing your CSS", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Organizing", kind: "docs" },
        { label: "MDN: @layer", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer", kind: "docs" },
        { label: "Adam Wathan: CSS Utility Classes and \"Separation of Concerns\"", url: "https://adamwathan.me/css-utility-classes-and-separation-of-concerns/", kind: "article" },
        { label: "CSS-Tricks: A Complete Guide to CSS Cascade Layers", url: "https://css-tricks.com/css-cascade-layers/", kind: "article" },
      ],
      video: {
        title: "CSS Tutorial – Full Course for Beginners",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=OXGznpKZ_sA",
        videoId: "OXGznpKZ_sA",
        durationLabel: "11:08:10",
        startSeconds: 31053,
        chapterLabel: "Chapter 23: Organization",
      },
      alternateVideos: [
        {
          title: "Why you don't need BEM with utility-first CSS",
          channel: "Adam Wathan",
          url: "https://www.youtube.com/watch?v=ab8RePo5ZYU",
          videoId: "ab8RePo5ZYU",
          durationLabel: "7:01",
        },
        {
          title: "Why I use the BEM naming convention for my CSS",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=SLjHSVwXYq4",
          videoId: "SLjHSVwXYq4",
          durationLabel: "7:03",
        },
        {
          title: "No more specificity issues?! (or all new ones 🤔) - A look at CSS Cascade Layers",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=NDNRGW-_1EE",
          videoId: "NDNRGW-_1EE",
          durationLabel: "17:44",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "css-architecture-bem-utility-q1",
          prompt:
            "What colour is an active nav link?\n\n```css\n@layer base, components;\n\n@layer components {\n  #nav a.active { color: blue; }\n}\n\na { color: red; }\n```",
          options: [
            "Red",
            "Blue, because `#nav a.active` is far more specific",
            "Blue, because `components` is the last layer",
            "The inherited colour",
          ],
          correctIndex: 0,
          explanation:
            "For normal declarations, unlayered styles beat every layer, and layer order is settled before specificity is even compared. Specificity only breaks ties within the same layer.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-architecture-bem-utility-q2",
          prompt:
            "What colour is `<a class=\"text-blue\">`?\n\n```css\n@layer reset, utilities;\n\n@layer reset {\n  a { color: gray !important; }\n}\n@layer utilities {\n  .text-blue { color: blue !important; }\n}\n```",
          options: [
            "Gray",
            "Blue, because `utilities` comes later",
            "Blue, because `.text-blue` is more specific",
            "Whichever rule appears last in the file",
          ],
          correctIndex: 0,
          explanation:
            "Important declarations reverse layer order: earlier layers win, and layered `!important` also beats unlayered `!important`. That lets a reset protect a few rules that no later layer can override.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-architecture-bem-utility-q3",
          prompt: "Which statements about cascade layers are true? (Select all that apply.)",
          options: [
            "Layer order is fixed by the first time each layer name appears",
            "`@import url(\"vendor.css\") layer(vendor);` puts a third-party stylesheet into a layer",
            "An inline `style` attribute beats normal declarations from any layer and from unlayered rules",
            "Inside a layer, specificity no longer matters",
            "A `@layer base { }` block written later in the file moves `base` to the end of the order",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Declaring `@layer reset, base, components, utilities;` up front locks the order, and later blocks add rules to existing layers without reordering them. Specificity still decides between rules in the same layer, and element-attached styles are compared before layers.",
        },
        {
          id: "css-architecture-bem-utility-q4",
          prompt: "Which class usages follow BEM correctly? (Select all that apply.)",
          options: [
            "`card__title` for the title inside a card",
            "`class=\"card card--featured\"` for a highlighted card",
            "`card__header__title` for a title inside the card's header",
            "`card__title--large` for a bigger title variant",
            "`class=\"btn--primary\"` on its own, without `btn`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 3],
          explanation:
            "Elements belong to the block, not to other elements, so the name stays flat however deep the DOM goes. Modifiers describe a variation and are applied alongside the base class, which keeps the shared styles in one place.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-architecture-bem-utility-q5",
          prompt: "What's the problem with this Sass?\n\n```scss\n.card {\n  .card__title { font-size: 1.25rem; }\n}\n```",
          options: [
            "It compiles to `.card .card__title`, doubling specificity and tying the style to DOM nesting; `&__title` would compile to a flat `.card__title`",
            "Sass can't nest a class inside another class",
            "It compiles to `.card.card__title`, which never matches",
            "Nothing: BEM requires nested selectors",
          ],
          correctIndex: 0,
          explanation:
            "The parent selector `&` concatenates, so `&__title` produces `.card__title` with single-class specificity. Accidental descendant selectors are how BEM codebases drift into specificity wars.",
        },
        {
          id: "css-architecture-bem-utility-q6",
          prompt:
            "A design system wants default button styles that any app can override with a single class, regardless of stylesheet order. Which selector fits best?",
          options: ["`:where(.ds-button)`", "`:is(.ds-button)`", "`.ds-button.ds-button`", "`#ds .button`"],
          correctIndex: 0,
          explanation:
            "`:where()` contributes zero specificity, so any class selector in the app outranks it. `:is(.ds-button)` keeps the class's (0,1,0), and the other two make overriding harder. Putting the library in an early cascade layer achieves the same.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-architecture-bem-utility-q7",
          prompt:
            "After moving to Tailwind v4, a third-party widget's unlayered `button { background: white; }` overrides your `bg-blue-600` utility. Why?",
          options: [
            "Tailwind v4 puts utilities in a native `@layer utilities`, and unlayered CSS beats layered CSS regardless of specificity",
            "Type selectors outrank class selectors",
            "Tailwind v4 generates utilities with zero specificity",
            "The widget's CSS loads later, and source order beats specificity",
          ],
          correctIndex: 0,
          explanation:
            "Put the vendor CSS in a layer ordered before `utilities`: declare `@layer theme, base, vendor, components, utilities;` first, then `@import \"widget.css\" layer(vendor);`. A new layer declared after Tailwind's would land after `utilities` and still win.",
        },
        {
          id: "css-architecture-bem-utility-q8",
          prompt: "Which are genuine advantages of utility-first CSS? (Select all that apply.)",
          options: [
            "The CSS bundle stops growing roughly in step with the number of components",
            "You don't have to invent and maintain class names",
            "Design tokens are enforced by a constrained class vocabulary",
            "Markup stays shorter than with BEM",
            "It removes the need for components in your framework",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "The cost is long class lists in markup, which is why utility-first relies on components (React, Vue, server templates) for reuse rather than replacing them.",
        },
        {
          id: "css-architecture-bem-utility-q9",
          prompt: "Why does the Tailwind team discourage building everything with `@apply`?",
          options: [
            "It recreates named-class abstractions, with the naming, growing CSS and ordering problems utility-first was meant to avoid; extract a component in your framework instead",
            "`@apply` was removed in Tailwind v4",
            "`@apply` rules are always `!important`",
            "`@apply` only works with arbitrary values",
          ],
          correctIndex: 0,
          explanation:
            "`@apply` is still supported and handy in small doses, such as styling third-party markup you can't add classes to. As the main abstraction, it brings back everything BEM needed discipline for.",
        },
        {
          id: "css-architecture-bem-utility-q10",
          prompt: "What does this rule style?\n\n```css\n@scope (.card) to (.card__content) {\n  img { border-radius: 8px; }\n}\n```",
          options: [
            "Images inside `.card`, except those inside `.card__content`",
            "Every image on the page once a `.card` exists",
            "Only images that are direct children of `.card`",
            "Only images inside `.card__content`",
          ],
          correctIndex: 0,
          explanation:
            "`@scope` sets a root and an optional lower boundary (a \"donut\" scope), so a component's styles stop where slotted content begins. It's been Baseline since March 2026; before that, BEM names or CSS Modules did the same job by convention.",
        },
      ],
    },
    {
      id: "css-bootstrap-sass",
      moduleId: "fe-html-css",
      trackId: "frontend",
      title: "Bootstrap & Sass Fundamentals",
      summary:
        "Bootstrap and Sass are worth knowing because a lot of production code still runs on them, and because they show the trade-offs Tailwind made differently. Bootstrap is a component framework: ready-made classes (`.btn`, `.card`, `.navbar`), a 12-column flexbox grid with breakpoints at 576, 768, 992, 1200 and 1400px, utility classes, and JavaScript plugins for dropdowns, modals and tooltips. Bootstrap 5 dropped jQuery (plugins are plain JavaScript, though they still register with jQuery if it's on the page), dropped Internet Explorer, namespaced data attributes as `data-bs-*`, and uses Popper to position dropdowns, popovers and tooltips (tooltips and popovers are opt-in and must be initialised). Version 5.3, the current line, added colour modes through `data-bs-theme`. It's quick for admin panels and prototypes; the costs are sites that look like Bootstrap and fighting its styles when a design diverges.\n\nCustomise it through Sass rather than by overriding compiled CSS. Bootstrap declares every variable with `!default` (\"assign only if not already set\"), so your overrides must come after its `functions` partial and before `variables`, and importing only the partials you use trims the bundle. Maps such as `$theme-colors` and the utilities API generate classes from data, which is where Sass loops and mixins pay off.\n\nSass itself has moved on. `@import` has been deprecated since Dart Sass 1.80 and is due to be removed in Dart Sass 3.0, along with global functions such as `darken()` in favour of module functions (`color.adjust`, `math.div`). `@use` loads a file once, namespaces its members (`tokens.$brand`), keeps `$-private` members private, and configures `!default` variables with `@use \"config\" with ($brand: teal)`; `@forward` re-exports. Bootstrap 5.3's own source still uses `@import`, so current Dart Sass prints deprecation warnings that Bootstrap says you can ignore for now. LibSass and `node-sass` are deprecated; use the `sass` package.",
      level: "intermediate",
      estMinutes: 70,
      webRefs: [
        { label: "Bootstrap 5.3: Sass", url: "https://getbootstrap.com/docs/5.3/customize/sass/", kind: "docs" },
        { label: "Bootstrap 5.3: JavaScript", url: "https://getbootstrap.com/docs/5.3/getting-started/javascript/", kind: "docs" },
        { label: "Sass: @use", url: "https://sass-lang.com/documentation/at-rules/use/", kind: "docs" },
        { label: "Sass blog: @import is Deprecated", url: "https://sass-lang.com/blog/import-is-deprecated/", kind: "article" },
      ],
      video: {
        title: "Learn Bootstrap 5 and SASS by Building a Portfolio Website - Full Course",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=iJKCj8uAHz8",
        videoId: "iJKCj8uAHz8",
        durationLabel: "5:02:23",
        startSeconds: 133,
        chapterLabel: "Part 2-1: SASS Setup",
      },
      alternateVideos: [
        {
          title: "Stop using @import with Sass | @use and @forward explained",
          channel: "Kevin Powell",
          url: "https://www.youtube.com/watch?v=CR-a8upNjJ0",
          videoId: "CR-a8upNjJ0",
          durationLabel: "13:12",
        },
      ],
      challengeType: "quiz",
      quiz: [
        {
          id: "css-bootstrap-sass-q1",
          prompt:
            "Buttons are still Bootstrap's default blue. Why?\n\n```scss\n@import \"bootstrap/scss/functions\";\n@import \"bootstrap/scss/variables\";\n$primary: #6f42c1;\n@import \"bootstrap/scss/variables-dark\";\n@import \"bootstrap/scss/maps\";\n@import \"bootstrap/scss/mixins\";\n@import \"bootstrap/scss/root\";\n@import \"bootstrap/scss/buttons\";\n```",
          options: [
            "The override comes after `variables`, which had already set `$primary` and built `$theme-colors` from it; overrides belong between `functions` and `variables`",
            "`!default` makes Bootstrap's value win over any later assignment",
            "`$primary` can only be changed with `!important`",
            "Buttons read their colour from a CSS custom property, never from Sass",
          ],
          correctIndex: 0,
          explanation:
            "`!default` only skips an assignment when the variable is already set, so your value has to exist before Bootstrap's variables run. Assigning afterwards changes `$primary` but not the maps and derived variables already built from the old value.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-bootstrap-sass-q2",
          prompt: "Which of these changed in Bootstrap 5 compared with Bootstrap 4? (Select all that apply.)",
          options: [
            "jQuery is no longer required",
            "Data attributes are namespaced, as in `data-bs-toggle`",
            "Internet Explorer support was dropped",
            "Popper was removed entirely",
            "The grid moved from 12 to 16 columns",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "Bootstrap 5's plugins are plain JavaScript that also register with jQuery if it's present. Popper is still used for dropdowns, popovers and tooltips, and the grid is still 12 columns.",
        },
        {
          id: "css-bootstrap-sass-q3",
          prompt:
            "A button has `data-bs-toggle=\"tooltip\" data-bs-title=\"Copy\"`, and the page includes `bootstrap.bundle.min.js`, but no tooltip appears. Why?",
          options: [
            "Tooltips are opt-in for performance, so you must initialise them, e.g. `new bootstrap.Tooltip(el)`",
            "Tooltips require jQuery in Bootstrap 5",
            "The bundle doesn't include Popper, so it has to be added separately",
            "`data-bs-title` isn't supported; tooltips only read the `title` attribute",
          ],
          correctIndex: 0,
          explanation:
            "The bundle includes Popper (the plain `bootstrap.min.js` doesn't). Tooltips and popovers are the documented components that data attributes alone don't activate.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-bootstrap-sass-q4",
          prompt: "What does `<div class=\"col-12 col-md-6\">` do?",
          options: [
            "Full width below 768px, half width from 768px up",
            "Half width only between 768px and 991.98px",
            "Half width below 768px, full width above it",
            "Always half width, with a 768px minimum",
          ],
          correctIndex: 0,
          explanation:
            "Bootstrap's grid is mobile-first: a breakpoint infix like `md` applies from that breakpoint up, until a class for a larger breakpoint overrides it.",
        },
        {
          id: "css-bootstrap-sass-q5",
          prompt: "In Bootstrap 5, what does `@include media-breakpoint-down(md) { … }` compile to?",
          options: [
            "`@media (max-width: 767.98px)`",
            "`@media (max-width: 991.98px)`",
            "`@media (max-width: 768px)`",
            "`@media (min-width: 768px)`",
          ],
          correctIndex: 0,
          explanation:
            "In v5 the `-down` mixins target widths below the named breakpoint (v4 used the next breakpoint up, which gave 991.98px). The `.02px` avoids overlapping inclusive queries at fractional viewport widths; range syntax such as `(width < 768px)` makes it unnecessary.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-bootstrap-sass-q6",
          prompt: "Which are true of Sass `@use` compared with `@import`? (Select all that apply.)",
          options: [
            "A module's CSS is emitted once, however many files `@use` it",
            "Members are namespaced by default, as in `colors.$brand`",
            "Members whose names start with `-` or `_` are private to their module",
            "`@use` can appear anywhere, including inside a style rule",
            "`@use` makes a module's variables global, just like `@import`",
          ],
          correctIndex: 0,
          correctIndices: [0, 1, 2],
          explanation:
            "`@use` rules must come before other rules (only `@forward` and variable declarations may precede them), and that strictness is what makes loading predictable. `@forward` re-exports a module's members through another file.",
        },
        {
          id: "css-bootstrap-sass-q7",
          prompt: "What's the status of Sass `@import` in current Dart Sass releases?",
          options: [
            "Deprecated since 1.80 with warnings, and scheduled for removal in Dart Sass 3.0",
            "Removed in Dart Sass 2.0",
            "Still the recommended way to split files",
            "Deprecated only in the indented `.sass` syntax",
          ],
          correctIndex: 0,
          explanation:
            "The Sass team deprecated `@import` and global built-in functions in 1.80 and plans removal no sooner than two years later, in 3.0. `sass-migrator module` automates most of the move to `@use`.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-bootstrap-sass-q8",
          prompt:
            "Which statement about this configuration is true?\n\n```scss\n// _config.scss\n$brand: blue !default;\n\n// main.scss\n@use \"config\" with ($brand: teal);\n```",
          options: [
            "`config.$brand` is teal, and `with` can only configure variables declared with `!default`",
            "`$brand` becomes teal globally, without a namespace",
            "`with` can override any variable, `!default` or not",
            "The configuration only applies the second time the module is loaded",
          ],
          correctIndex: 0,
          explanation:
            "A module is configured once, the first time it's loaded, and only its `!default` variables are configurable. Configuring a non-default variable, or a module that's already been loaded, is an error.",
        },
        {
          id: "css-bootstrap-sass-q9",
          prompt: "What's the module-system replacement for `darken($brand, 10%)`?",
          options: [
            "`color.adjust($brand, $lightness: -10%, $space: hsl)` from `sass:color`",
            "`color.darken($brand, 10%)`",
            "`math.div($brand, 10%)`",
            "Keep `darken()`, because global functions aren't deprecated",
          ],
          correctIndex: 0,
          explanation:
            "`sass:color` deliberately leaves out `darken()` and `lighten()`; `color.adjust()` reproduces the fixed change and `color.scale()` gives a proportional one, which is usually what you want. Global built-ins were deprecated alongside `@import` in Dart Sass 1.80.",
          isEdgeCaseOrInterviewQuestion: true,
        },
        {
          id: "css-bootstrap-sass-q10",
          prompt: "When is Bootstrap usually a better fit than Tailwind?",
          options: [
            "An internal admin tool where ready-made components and JavaScript plugins matter more than a bespoke design",
            "A marketing site with a unique, custom design system",
            "A project that wants the smallest possible CSS for a highly custom UI",
            "Any project that uses React",
          ],
          correctIndex: 0,
          explanation:
            "Bootstrap's value is pre-built components with behaviour; the price is fighting its defaults when the design is custom. Tailwind makes the opposite trade: no components, full control over the design.",
        },
      ],
    },
  ],
} satisfies Module;
