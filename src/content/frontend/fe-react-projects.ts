import type { Module } from "@/types/curriculum";

// Shared test fixtures for the capstone challenges.
const CART_STORE = {
  products: [
    { id: "phone", name: "Pixel 9", priceCents: 79900, stock: 5 },
    { id: "case", name: "Clear case", priceCents: 1999, stock: 10 },
    { id: "cable", name: "USB-C cable", priceCents: 999, stock: 2 },
    { id: "earbuds", name: "Earbuds", priceCents: 12950, stock: 0 },
    { id: "charger", name: "65W charger", priceCents: 2600, stock: 3 },
  ],
  taxRateBps: 825,
  shippingCents: 599,
  freeShippingThresholdCents: 5000,
  coupons: {
    SAVE10: { type: "percent", percent: 10 },
    FIVEOFF: { type: "fixed", amountCents: 500, minSubtotalCents: 2500 },
    GIFT50: { type: "fixed", amountCents: 5000, minSubtotalCents: 0 },
    SHIPFREE: { type: "freeShipping" },
  },
};

const EMPTY_CART_SUMMARY = {
  lines: [],
  itemCount: 0,
  subtotalCents: 0,
  discountCents: 0,
  taxCents: 0,
  shippingCents: 0,
  totalCents: 0,
  couponCode: null,
  couponError: null,
};

// Open Trivia DB-shaped questions (entities included, as the API returns them).
const TRIVIA = [
  {
    id: "q1",
    category: "Science &amp; Nature",
    question: "What is the chemical symbol for gold?",
    correct_answer: "Au",
    incorrect_answers: ["Ag", "Gd", "Go"],
  },
  {
    id: "q2",
    category: "Science &amp; Nature",
    question: "Which planet is known as the &quot;Red Planet&quot;?",
    correct_answer: "Mars",
    incorrect_answers: ["Venus", "Jupiter", "Saturn"],
  },
  {
    id: "q3",
    category: "History",
    question: "In which year did the Berlin Wall fall?",
    correct_answer: "1989",
    incorrect_answers: ["1987", "1991", "1985"],
  },
  {
    id: "q4",
    category: "Entertainment: Film",
    question: "Which film features the line &quot;I&#039;ll be back&quot;?",
    correct_answer: "The Terminator",
    incorrect_answers: ["Predator", "Commando", "Total Recall"],
  },
  {
    id: "q5",
    category: "General Knowledge",
    question: "Which character is called an ampersand?",
    correct_answer: "&amp;",
    incorrect_answers: ["&#64;", "#", "%"],
  },
];

// What startQuiz(TRIVIA, createRandom(42)) must produce.
const TRIVIA_SEED_42 = {
  order: ["q1", "q5", "q3", "q2", "q4"],
  prompts: [
    "What is the chemical symbol for gold?",
    "Which character is called an ampersand?",
    "In which year did the Berlin Wall fall?",
    "Which planet is known as the \"Red Planet\"?",
    "Which film features the line \"I'll be back\"?",
  ],
  answers: [
    ["Gd", "Go", "Ag", "Au"],
    ["@", "&", "%", "#"],
    ["1985", "1987", "1991", "1989"],
    ["Jupiter", "Saturn", "Mars", "Venus"],
    ["Total Recall", "The Terminator", "Predator", "Commando"],
  ],
};

const TRIVIA_FULL_RUN = [
  { type: "answer", answer: "Au" },
  { type: "next" },
  { type: "answer", answer: "&" },
  { type: "next" },
  { type: "answer", answer: "1991" },
  { type: "next" },
  { type: "skip" },
  { type: "next" },
  { type: "answer", answer: "The Terminator" },
  { type: "next" },
];

const TRIVIA_FULL_RUN_RESULT = {
  ...TRIVIA_SEED_42,
  index: 4,
  status: "finished",
  results: {
    score: 3,
    answered: 4,
    skipped: 1,
    total: 5,
    percent: 60,
    byCategory: {
      "Science & Nature": { correct: 1, total: 2 },
      "General Knowledge": { correct: 1, total: 1 },
      History: { correct: 0, total: 1 },
      "Entertainment: Film": { correct: 1, total: 1 },
    },
  },
};

const TRIVIA_NOTHING_ANSWERED = {
  score: 0,
  answered: 0,
  skipped: 0,
  total: 5,
  percent: 0,
  byCategory: {
    "Science & Nature": { correct: 0, total: 2 },
    "General Knowledge": { correct: 0, total: 1 },
    History: { correct: 0, total: 1 },
    "Entertainment: Film": { correct: 0, total: 1 },
  },
};

// Todoist-style data; the tests use today = "2026-09-21".
const TODO_DATA = {
  projects: [
    { id: "inbox", name: "Inbox", archived: false },
    { id: "work", name: "Work", archived: false },
    { id: "home", name: "Home", archived: false },
    { id: "old", name: "Old Side Project", archived: true },
  ],
  tasks: [
    { id: "t1", title: "Reply to Sam", projectId: "inbox", due: "2026-09-21", priority: 2, archived: false },
    { id: "t2", title: "Buy milk", projectId: "home", due: "2026-09-21", priority: 4, archived: false },
    { id: "t3", title: "Ship release notes", projectId: "work", due: "2026-09-20", priority: 1, archived: false },
    { id: "t4", title: "Book dentist", projectId: "home", due: "2026-09-15", priority: 3, archived: false },
    { id: "t5", title: "Plan offsite", projectId: "work", due: "2026-09-24", priority: 2, archived: false },
    { id: "t6", title: "Renew passport", projectId: "inbox", due: "2026-09-27", priority: 1, archived: false },
    { id: "t7", title: "Quarterly review", projectId: "work", due: "2026-09-28", priority: 1, archived: false },
    { id: "t8", title: "Read book", projectId: "inbox", due: null, archived: false },
    { id: "t9", title: "Update old README", projectId: "old", due: "2026-09-22", priority: 1, archived: false },
    { id: "t10", title: "File taxes", projectId: "home", due: "2026-09-10", priority: 1, archived: true },
    { id: "t11", title: "Fix bike", projectId: "work", due: "22/09/2026", priority: 2, archived: false },
    { id: "t12", title: "Call mom", projectId: "home", due: "2026-09-21", priority: 1, archived: false },
    { id: "t13", title: "Orphaned note", projectId: "deleted-project", due: null, priority: 3, archived: false },
    { id: "t14", title: "Water plants", projectId: "home", due: "2026-09-24", priority: 2, archived: false },
    { id: "t15", title: "Send invoice", projectId: "work", due: null, priority: 2, archived: true },
  ],
};

const INBOX_ONLY = [{ id: "inbox", name: "Inbox", archived: false }];

export default {
  id: "fe-react-projects",
  trackId: "frontend",
  name: "React Practice Projects",
  description:
    "Three capstones built from real project walkthroughs: an e-commerce store, a React + TypeScript quiz app and a Todoist clone, each with alternate walkthroughs to choose from. The videos are from 2019–2020, so every capstone spells out what a 2026 build does differently (Vite, React 19 patterns, TanStack Query, server-side payments and auth, Vitest and Playwright) and what counts as done. Each one ends with a code challenge that implements the app's core logic.",
  refs: [
    { label: "react.dev: Creating a React App", url: "https://react.dev/learn/creating-a-react-app", kind: "docs" },
    { label: "Vite: Getting Started", url: "https://vite.dev/guide/", kind: "docs" },
    { label: "Vitest: Getting Started", url: "https://vitest.dev/guide/", kind: "docs" },
    { label: "Playwright: Installation", url: "https://playwright.dev/docs/intro", kind: "docs" },
  ],
  topics: [
    {
      id: "react-capstone-ecommerce",
      moduleId: "fe-react-projects",
      trackId: "frontend",
      title: "Capstone: E-commerce Store",
      summary:
        "The walkthrough (Coding Addict, January 2019) builds a phone store with Create React App, class components, a Context provider for products and cart, React Router v4, styled-components and a PayPal button, deployed to Netlify. It's a good tour of a store's moving parts and an even better code review: the cart handlers mutate product objects shared by `products` and `cart`, keep `cartSubTotal`, `cartTax` and `cartTotal` in state, and do money in floating point (`subTotal * 0.1`, then `toFixed`).\n\nA 2026 build starts from Vite (Create React App was sunset in February 2025) or a framework such as Next.js, with TypeScript and Hooks. Keep the cart as `{ productId, qty }` lines in a reducer or Zustand store and derive every total; treat the catalog as server state with TanStack Query or route loaders, so prices and stock come from the server; count money in integer cents. Never trust the client with payment: create a Stripe Checkout Session on the server from product ids and fulfil orders from a verified webhook, and use a hosted auth provider or Better Auth for accounts. `useOptimistic` suits add-to-cart, and React Compiler removes most manual memoisation. The alternates, a Weather App and an Autocomplete text box, practise data fetching and search on a smaller scale.\n\n\"Done\" means: product list and detail routes with loading, empty and error states; a cart that survives a reload and caps quantities at stock; totals that match the server to the cent; Stripe test-mode checkout working end to end, declined card included; an accessible, responsive UI; Vitest and React Testing Library tests for the cart logic and key components; a Playwright test of browse, add to cart and pay; and a deployed preview. The challenge below is the cart reducer and its derived totals.",
      level: "advanced",
      estMinutes: 500,
      isMilestone: true,
      webRefs: [
        { label: "react.dev: Scaling Up with Reducer and Context", url: "https://react.dev/learn/scaling-up-with-reducer-and-context", kind: "docs" },
        { label: "Stripe Docs: Fulfill orders (Checkout)", url: "https://docs.stripe.com/checkout/fulfillment", kind: "docs" },
        { label: "TanStack Query: Overview", url: "https://tanstack.com/query/latest/docs/framework/react/overview", kind: "docs" },
        { label: "Martin Fowler: Money", url: "https://martinfowler.com/eaaCatalog/money.html", kind: "article" },
      ],
      video: {
        title: "React Tutorial: Build an e-commerce site from scratch using React and Netlify",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=wPQ1-33teR4",
        videoId: "wPQ1-33teR4",
        durationLabel: "6:18:14",
      },
      alternateVideos: [
        {
          title: "React Tutorial: Weather App with RESTful APIs",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=cdBvSlVCOXw",
          videoId: "cdBvSlVCOXw",
          durationLabel: "2:43:47",
        },
        {
          title: "React Beginners Tutorial - Build an Autocomplete Text Box",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=NnpISZANByg",
          videoId: "NnpISZANByg",
          durationLabel: "45:09",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement the store's cart logic as two pure functions, `cartReducer(state, action, store)` and `selectCartSummary(state, store)`. Cart state is `{ lines: [{ productId, qty }], couponCode, couponError }` (see `createCart()`). Names, prices and stock always come from `store`, never from the cart, and money is integer cents throughout.\n\n`store` is `{ products: [{ id, name, priceCents, stock }], taxRateBps, shippingCents, freeShippingThresholdCents, coupons }`. `taxRateBps` is in basis points (825 means 8.25%), and each coupon is `{ type: \"percent\", percent }`, `{ type: \"fixed\", amountCents, minSubtotalCents }` or `{ type: \"freeShipping\" }`.\n\nActions for `cartReducer`. Never mutate `state` (the driver freezes it), and return the same `state` object whenever an action changes nothing:\n\n- `{ type: \"add\", productId, qty }`: `qty` defaults to 1 and must be a positive integer. Increase the existing line or append a new one, capped at the product's `stock`. Ignored for unknown products, invalid quantities, or when the cap leaves the quantity unchanged (out of stock, or already at the limit).\n- `{ type: \"setQty\", productId, qty }`: only for a product already in the cart, with `qty` a non-negative integer. `0` removes the line; anything else is capped at `stock`.\n- `{ type: \"remove\", productId }`: remove that line.\n- `{ type: \"applyCoupon\", code }`: normalise with `trim()` and `toUpperCase()`. A code that is a key of `store.coupons` becomes `couponCode` and clears `couponError`. An unknown code sets `couponError` to `\"Unknown coupon\"` and keeps the current `couponCode`.\n- `{ type: \"removeCoupon\" }`: clear `couponCode` and `couponError`.\n- `{ type: \"clear\" }`: back to `createCart()`.\n- Any other action returns `state`.\n\n`selectCartSummary(state, store)` returns `{ lines, itemCount, subtotalCents, discountCents, taxCents, shippingCents, totalCents, couponCode, couponError }`:\n\n- `lines`: `{ productId, name, qty, unitCents, lineCents, maxed }` in cart order, where `maxed` is `qty >= stock` (the UI disables its + button).\n- `discountCents`: a percent coupon takes `percent`% of the subtotal. A fixed coupon takes `min(amountCents, subtotal)` once the subtotal reaches `minSubtotalCents`, and 0 before that. A free-shipping coupon discounts nothing.\n- `taxCents`: `taxRateBps` applied to the subtotal after the discount.\n- `shippingCents`: 0 for an empty cart, with a free-shipping coupon, or when the discounted subtotal is at least `freeShippingThresholdCents`; otherwise `store.shippingCents`.\n- `totalCents`: subtotal − discount + tax + shipping.\n\nRound the percent discount and the tax to the nearest cent, halves up, with integer arithmetic: for `n / d`, use `Math.floor((2 * n + d) / (2 * d))`. Floating point gets halves wrong: `Math.round(3000 * 0.0725)` is 217, not 218, because 0.0725 has no exact binary representation.\n\nThe tests call `runCart(store, actions)`, which applies the actions to `createCart()` and returns the summary plus `renders`, the number of actions that produced a new state object. Leave the driver as it is.",
        starterCode: `function createCart() {
  return { lines: [], couponCode: null, couponError: null };
}

/**
 * @param {{ lines: { productId: string, qty: number }[], couponCode: string | null, couponError: string | null }} state
 * @param {{ type: string, [key: string]: any }} action
 * @param {{ products: { id: string, name: string, priceCents: number, stock: number }[], taxRateBps: number, shippingCents: number, freeShippingThresholdCents: number, coupons: Record<string, object> }} store
 */
function cartReducer(state, action, store) {
  // Your code here
  return state;
}

function selectCartSummary(state, store) {
  // Your code here
}

// ---- Test driver (leave as is) ----
function runCart(store, actions) {
  let state = deepFreeze(createCart());
  let renders = 0;
  for (const action of actions) {
    const next = cartReducer(state, action, store);
    if (next !== state) renders++;
    state = deepFreeze(next);
  }
  return { ...selectCartSummary(state, store), renders };
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
`,
        functionName: "runCart",
        testCases: [
          {
            description: "adding two products builds lines and totals in integer cents",
            args: [CART_STORE, [{ type: "add", productId: "case" }, { type: "add", productId: "cable" }]],
            expected: {
              lines: [
                { productId: "case", name: "Clear case", qty: 1, unitCents: 1999, lineCents: 1999, maxed: false },
                { productId: "cable", name: "USB-C cable", qty: 1, unitCents: 999, lineCents: 999, maxed: false },
              ],
              itemCount: 2,
              subtotalCents: 2998,
              discountCents: 0,
              taxCents: 247,
              shippingCents: 599,
              totalCents: 3844,
              couponCode: null,
              couponError: null,
              renders: 2,
            },
          },
          {
            description: "adding a product again increases its line in place, and a big enough cart ships free",
            args: [
              CART_STORE,
              [
                { type: "add", productId: "case" },
                { type: "add", productId: "cable" },
                { type: "add", productId: "case", qty: 2 },
              ],
            ],
            expected: {
              lines: [
                { productId: "case", name: "Clear case", qty: 3, unitCents: 1999, lineCents: 5997, maxed: false },
                { productId: "cable", name: "USB-C cable", qty: 1, unitCents: 999, lineCents: 999, maxed: false },
              ],
              itemCount: 4,
              subtotalCents: 6996,
              discountCents: 0,
              taxCents: 577,
              shippingCents: 0,
              totalCents: 7573,
              couponCode: null,
              couponError: null,
              renders: 3,
            },
          },
          {
            description: "setQty caps at stock and 0 removes the line",
            args: [
              CART_STORE,
              [
                { type: "add", productId: "phone" },
                { type: "setQty", productId: "phone", qty: 9 },
                { type: "add", productId: "case" },
                { type: "setQty", productId: "case", qty: 0 },
              ],
            ],
            expected: {
              lines: [{ productId: "phone", name: "Pixel 9", qty: 5, unitCents: 79900, lineCents: 399500, maxed: true }],
              itemCount: 5,
              subtotalCents: 399500,
              discountCents: 0,
              taxCents: 32959,
              shippingCents: 0,
              totalCents: 432459,
              couponCode: null,
              couponError: null,
              renders: 4,
            },
          },
          {
            description: "a percent coupon is normalised and applied before tax (599.7 rounds to 600)",
            args: [CART_STORE, [{ type: "add", productId: "case", qty: 3 }, { type: "applyCoupon", code: " save10 " }]],
            expected: {
              lines: [{ productId: "case", name: "Clear case", qty: 3, unitCents: 1999, lineCents: 5997, maxed: false }],
              itemCount: 3,
              subtotalCents: 5997,
              discountCents: 600,
              taxCents: 445,
              shippingCents: 0,
              totalCents: 5842,
              couponCode: "SAVE10",
              couponError: null,
              renders: 2,
            },
          },
          {
            description: "the free-shipping threshold is judged after the discount",
            args: [CART_STORE, [{ type: "add", productId: "charger", qty: 2 }, { type: "applyCoupon", code: "SAVE10" }]],
            expected: {
              lines: [{ productId: "charger", name: "65W charger", qty: 2, unitCents: 2600, lineCents: 5200, maxed: false }],
              itemCount: 2,
              subtotalCents: 5200,
              discountCents: 520,
              taxCents: 386,
              shippingCents: 599,
              totalCents: 5665,
              couponCode: "SAVE10",
              couponError: null,
              renders: 2,
            },
          },
          {
            description: "a fixed coupon stays applied but only discounts once the minimum is reached",
            args: [
              CART_STORE,
              [
                { type: "add", productId: "cable" },
                { type: "applyCoupon", code: "FIVEOFF" },
                { type: "add", productId: "case" },
              ],
            ],
            expected: {
              lines: [
                { productId: "cable", name: "USB-C cable", qty: 1, unitCents: 999, lineCents: 999, maxed: false },
                { productId: "case", name: "Clear case", qty: 1, unitCents: 1999, lineCents: 1999, maxed: false },
              ],
              itemCount: 2,
              subtotalCents: 2998,
              discountCents: 500,
              taxCents: 206,
              shippingCents: 599,
              totalCents: 3303,
              couponCode: "FIVEOFF",
              couponError: null,
              renders: 3,
            },
          },
          {
            description: "below the minimum, a fixed coupon discounts nothing",
            args: [CART_STORE, [{ type: "add", productId: "cable" }, { type: "applyCoupon", code: "FIVEOFF" }]],
            expected: {
              lines: [{ productId: "cable", name: "USB-C cable", qty: 1, unitCents: 999, lineCents: 999, maxed: false }],
              itemCount: 1,
              subtotalCents: 999,
              discountCents: 0,
              taxCents: 82,
              shippingCents: 599,
              totalCents: 1680,
              couponCode: "FIVEOFF",
              couponError: null,
              renders: 2,
            },
          },
          {
            description: "a free-shipping coupon removes shipping but discounts nothing, and replaces an error",
            args: [
              CART_STORE,
              [
                { type: "add", productId: "case" },
                { type: "applyCoupon", code: "BOGUS" },
                { type: "applyCoupon", code: "shipfree" },
              ],
            ],
            expected: {
              lines: [{ productId: "case", name: "Clear case", qty: 1, unitCents: 1999, lineCents: 1999, maxed: false }],
              itemCount: 1,
              subtotalCents: 1999,
              discountCents: 0,
              taxCents: 165,
              shippingCents: 0,
              totalCents: 2164,
              couponCode: "SHIPFREE",
              couponError: null,
              renders: 3,
            },
          },
          {
            description: "remove and removeCoupon",
            args: [
              CART_STORE,
              [
                { type: "add", productId: "case" },
                { type: "add", productId: "cable" },
                { type: "applyCoupon", code: "SAVE10" },
                { type: "remove", productId: "case" },
                { type: "removeCoupon" },
              ],
            ],
            expected: {
              lines: [{ productId: "cable", name: "USB-C cable", qty: 1, unitCents: 999, lineCents: 999, maxed: false }],
              itemCount: 1,
              subtotalCents: 999,
              discountCents: 0,
              taxCents: 82,
              shippingCents: 599,
              totalCents: 1680,
              couponCode: null,
              couponError: null,
              renders: 5,
            },
          },
          {
            description: "clear empties the cart and drops the coupon",
            args: [
              CART_STORE,
              [{ type: "add", productId: "phone" }, { type: "applyCoupon", code: "SAVE10" }, { type: "clear" }],
            ],
            expected: { ...EMPTY_CART_SUMMARY, renders: 3 },
          },
          {
            description: "quantities are capped at stock, and adding at the cap is a no-op",
            args: [CART_STORE, [{ type: "add", productId: "cable", qty: 5 }, { type: "add", productId: "cable" }]],
            expected: {
              lines: [{ productId: "cable", name: "USB-C cable", qty: 2, unitCents: 999, lineCents: 1998, maxed: true }],
              itemCount: 2,
              subtotalCents: 1998,
              discountCents: 0,
              taxCents: 165,
              shippingCents: 599,
              totalCents: 2762,
              couponCode: null,
              couponError: null,
              renders: 1,
            },
            isEdgeCase: true,
          },
          {
            description: "out-of-stock, unknown products and invalid quantities are ignored",
            args: [
              CART_STORE,
              [
                { type: "add", productId: "earbuds" },
                { type: "add", productId: "ghost" },
                { type: "add", productId: "case", qty: 0 },
                { type: "add", productId: "case", qty: 1.5 },
                { type: "add", productId: "case", qty: -1 },
              ],
            ],
            expected: { ...EMPTY_CART_SUMMARY, renders: 0 },
            isEdgeCase: true,
          },
          {
            description: "setQty to the capped current quantity, a fraction or a negative number changes nothing",
            args: [
              CART_STORE,
              [
                { type: "add", productId: "cable", qty: 2 },
                { type: "setQty", productId: "cable", qty: 7 },
                { type: "setQty", productId: "cable", qty: 2.5 },
                { type: "setQty", productId: "cable", qty: -1 },
              ],
            ],
            expected: {
              lines: [{ productId: "cable", name: "USB-C cable", qty: 2, unitCents: 999, lineCents: 1998, maxed: true }],
              itemCount: 2,
              subtotalCents: 1998,
              discountCents: 0,
              taxCents: 165,
              shippingCents: 599,
              totalCents: 2762,
              couponCode: null,
              couponError: null,
              renders: 1,
            },
            isEdgeCase: true,
          },
          {
            description: "an unknown coupon reports an error once and keeps the current coupon",
            args: [
              CART_STORE,
              [
                { type: "add", productId: "case" },
                { type: "applyCoupon", code: "SAVE10" },
                { type: "applyCoupon", code: "BOGUS" },
                { type: "applyCoupon", code: "NOPE" },
              ],
            ],
            expected: {
              lines: [{ productId: "case", name: "Clear case", qty: 1, unitCents: 1999, lineCents: 1999, maxed: false }],
              itemCount: 1,
              subtotalCents: 1999,
              discountCents: 200,
              taxCents: 148,
              shippingCents: 599,
              totalCents: 2546,
              couponCode: "SAVE10",
              couponError: "Unknown coupon",
              renders: 3,
            },
            isEdgeCase: true,
          },
          {
            description: "a fixed discount never exceeds the subtotal",
            args: [CART_STORE, [{ type: "add", productId: "cable" }, { type: "applyCoupon", code: "GIFT50" }]],
            expected: {
              lines: [{ productId: "cable", name: "USB-C cable", qty: 1, unitCents: 999, lineCents: 999, maxed: false }],
              itemCount: 1,
              subtotalCents: 999,
              discountCents: 999,
              taxCents: 0,
              shippingCents: 599,
              totalCents: 599,
              couponCode: "GIFT50",
              couponError: null,
              renders: 2,
            },
            isEdgeCase: true,
          },
          {
            description: "tax that lands exactly on half a cent rounds up (7.25% of $30.00 is 217.5 cents)",
            args: [
              {
                products: [{ id: "mug", name: "Mug", priceCents: 3000, stock: 10 }],
                taxRateBps: 725,
                shippingCents: 599,
                freeShippingThresholdCents: 5000,
                coupons: {},
              },
              [{ type: "add", productId: "mug" }],
            ],
            expected: {
              lines: [{ productId: "mug", name: "Mug", qty: 1, unitCents: 3000, lineCents: 3000, maxed: false }],
              itemCount: 1,
              subtotalCents: 3000,
              discountCents: 0,
              taxCents: 218,
              shippingCents: 599,
              totalCents: 3817,
              couponCode: null,
              couponError: null,
              renders: 1,
            },
            isEdgeCase: true,
          },
          {
            description: "no-op actions on an empty cart never create new state",
            args: [
              CART_STORE,
              [
                { type: "remove", productId: "case" },
                { type: "setQty", productId: "cable", qty: 3 },
                { type: "removeCoupon" },
                { type: "clear" },
                { type: "checkout" },
              ],
            ],
            expected: { ...EMPTY_CART_SUMMARY, renders: 0 },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "react-capstone-quiz-app-ts",
      moduleId: "fe-react-projects",
      trackId: "frontend",
      title: "Capstone: Quiz App with React & TypeScript",
      summary:
        "Thomas Weibenfalk's walkthrough (July 2020) builds a trivia quiz with React, TypeScript and styled-components on top of the Open Trivia Database API: fetch ten questions, shuffle the answers, lock in a choice, show right and wrong, keep score. It's compact, which makes it a good first React-plus-TypeScript project, and its shortcuts are instructive. Answers are shuffled with `[...array].sort(() => Math.random() - 0.5)`, which is biased: a random comparator is inconsistent, and sort algorithms don't give every permutation equal odds. The API returns HTML entities, which the app renders with `dangerouslySetInnerHTML`, handing third-party strings to your DOM. And six separate `useState` calls track what is really one state machine.\n\nA 2026 build starts from Vite's `react-ts` template (the video uses Create React App; the author's repo has since moved to Vite) with `strict` TypeScript. Fetch with TanStack Query (caching, retries, loading and error states), validate the response with a schema library such as Zod instead of casting it, decode entities to plain text and let React escape it, shuffle with Fisher–Yates, and model the quiz as a reducer over a discriminated union (`answering | reviewing | finished`). Inject the random source so tests are deterministic. The alternate walkthrough, Tetris with Hooks, is a harder exercise in the same skill: a game loop expressed as state plus custom Hooks.\n\n\"Done\" means: category and difficulty selection; one locked answer per question with clear feedback; keyboard support (answers are real buttons, and focus moves to the next question); results with per-category scores; graceful handling of API errors and empty responses; a seeded mode; Vitest tests for the engine, React Testing Library tests for answering and results, and a Playwright happy path. The challenge below implements the engine.",
      level: "advanced",
      estMinutes: 200,
      isMilestone: true,
      webRefs: [
        { label: "react.dev: Extracting State Logic into a Reducer", url: "https://react.dev/learn/extracting-state-logic-into-a-reducer", kind: "docs" },
        { label: "TypeScript Handbook: Narrowing (discriminated unions)", url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html", kind: "docs" },
        { label: "Mike Bostock: Will It Shuffle?", url: "https://bost.ocks.org/mike/shuffle/compare.html", kind: "article" },
        { label: "Open Trivia DB: API", url: "https://opentdb.com/api_config.php", kind: "docs" },
      ],
      video: {
        title: "React / Typescript Tutorial - Build a Quiz App",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=F2JCjVSZlG0",
        videoId: "F2JCjVSZlG0",
        durationLabel: "1:20:01",
      },
      alternateVideos: [
        {
          title: "How to Build Tetris in React - GameDev Tutorial (with React Hooks!)",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=ZGOaCxX8HIU",
          videoId: "ZGOaCxX8HIU",
          durationLabel: "2:34:18",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Build the engine behind the quiz app as five pure functions. The input is a list of questions in Open Trivia DB's shape, `{ id, category, question, correct_answer, incorrect_answers }`, with HTML entities in every string.\n\n`shuffle(items, random)`: return a shuffled copy using Fisher–Yates, exactly: copy the array, then for `i` from `length - 1` down to `1`, take `j = Math.floor(random() * (i + 1))` and swap the elements at `i` and `j`. Never mutate the input (the driver freezes it), and never sort with a random comparator, which is biased.\n\n`decodeEntities(text)`: in one left-to-right pass, replace `&quot;`, `&apos;`, `&amp;`, `&lt;`, `&gt;` and decimal entities such as `&#039;` with their characters, so React can render plain text instead of using `dangerouslySetInnerHTML`. Leave anything else unchanged, including other named entities and decimal entities above 1114111 (0x10FFFF). One pass means `&amp;lt;` becomes `&lt;`, not `<`.\n\n`startQuiz(rawQuestions, random)` returns `{ questions, index: 0, responses: {}, status }`:\n\n- Decode `category`, `question` and every answer. Each question becomes `{ id, category, prompt, correct, answers }`, where `answers` starts as `[correct, ...incorrect]`.\n- Drop malformed questions: `correct_answer` isn't a string, `incorrect_answers` isn't a non-empty array of strings, or the decoded answers aren't all different.\n- Shuffle the list of valid questions first, then shuffle each question's `answers` in the new question order, all with the same `random`.\n- `status` is `\"answering\"`, or `\"finished\"` if no questions are left.\n\n`quizReducer(state, action)`. Return the same `state` when an action doesn't apply:\n\n- `{ type: \"answer\", answer }`: only while `\"answering\"`, and only if `answer` is exactly one of the current question's answers. Store it in `responses[questionId]` and move to `\"reviewing\"`; the answer is now locked.\n- `{ type: \"skip\" }`: only while `\"answering\"`. Store `null` and move to `\"reviewing\"`.\n- `{ type: \"next\" }`: only while `\"reviewing\"`. Move to the next question with status `\"answering\"`, or to `\"finished\"` after the last one (leaving `index` on it).\n\n`selectResults(state)` returns `{ score, answered, skipped, total, percent, byCategory }`: the number of correct answers, of non-skipped responses, of skipped responses, and of questions; `Math.round(score * 100 / total)` (0 when there are no questions); and, for every category in the quiz, `{ correct, total }`.\n\nThe tests call `runQuiz(rawQuestions, seed, actions)`, which creates a seeded `random`, starts the quiz, applies the actions and reports the question order, the decoded prompts, the shuffled answers, `index`, `status` and the results. Leave the driver as it is.",
        starterCode: `/** Fisher–Yates shuffle that returns a new array. */
function shuffle(items, random) {
  // Your code here
}

function decodeEntities(text) {
  // Your code here
}

function startQuiz(rawQuestions, random) {
  // Your code here
}

function quizReducer(state, action) {
  // Your code here
  return state;
}

function selectResults(state) {
  // Your code here
}

// ---- Test driver (leave as is) ----
function runQuiz(rawQuestions, seed, actions) {
  const random = createRandom(seed);
  let state = deepFreeze(startQuiz(deepFreeze(rawQuestions), random));
  for (const action of actions) state = deepFreeze(quizReducer(state, action));
  return {
    order: state.questions.map((question) => question.id),
    prompts: state.questions.map((question) => question.prompt),
    answers: state.questions.map((question) => question.answers),
    index: state.index,
    status: state.status,
    results: selectResults(state),
  };
}

// mulberry32: a tiny seeded PRNG, so every run is deterministic.
function createRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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
        functionName: "runQuiz",
        testCases: [
          {
            description: "setup decodes entities and shuffles the questions, then each question's answers, with Fisher–Yates",
            args: [TRIVIA, 42, []],
            expected: { ...TRIVIA_SEED_42, index: 0, status: "answering", results: TRIVIA_NOTHING_ANSWERED },
          },
          {
            description: "another seed gives another order, deterministically",
            args: [TRIVIA, 7, []],
            expected: {
              order: ["q4", "q2", "q3", "q5", "q1"],
              prompts: [
                "Which film features the line \"I'll be back\"?",
                "Which planet is known as the \"Red Planet\"?",
                "In which year did the Berlin Wall fall?",
                "Which character is called an ampersand?",
                "What is the chemical symbol for gold?",
              ],
              answers: [
                ["Total Recall", "The Terminator", "Predator", "Commando"],
                ["Saturn", "Jupiter", "Venus", "Mars"],
                ["1991", "1985", "1989", "1987"],
                ["@", "%", "&", "#"],
                ["Gd", "Au", "Go", "Ag"],
              ],
              index: 0,
              status: "answering",
              results: TRIVIA_NOTHING_ANSWERED,
            },
          },
          {
            description: "answering records the choice and moves to reviewing",
            args: [TRIVIA, 42, [{ type: "answer", answer: "Au" }]],
            expected: {
              ...TRIVIA_SEED_42,
              index: 0,
              status: "reviewing",
              results: {
                score: 1,
                answered: 1,
                skipped: 0,
                total: 5,
                percent: 20,
                byCategory: {
                  "Science & Nature": { correct: 1, total: 2 },
                  "General Knowledge": { correct: 0, total: 1 },
                  History: { correct: 0, total: 1 },
                  "Entertainment: Film": { correct: 0, total: 1 },
                },
              },
            },
          },
          {
            description: "the first answer is locked, so a second answer is ignored",
            args: [TRIVIA, 42, [{ type: "answer", answer: "Ag" }, { type: "answer", answer: "Au" }]],
            expected: {
              ...TRIVIA_SEED_42,
              index: 0,
              status: "reviewing",
              results: { ...TRIVIA_NOTHING_ANSWERED, answered: 1 },
            },
          },
          {
            description: "a full run: score, skips, percent and results by category",
            args: [TRIVIA, 42, TRIVIA_FULL_RUN],
            expected: TRIVIA_FULL_RUN_RESULT,
          },
          {
            description: "percent rounds to the nearest whole number (2 of 3 is 67)",
            args: [
              [TRIVIA[0], TRIVIA[1], TRIVIA[2]],
              42,
              [
                { type: "answer", answer: "1989" },
                { type: "next" },
                { type: "answer", answer: "Au" },
                { type: "next" },
                { type: "answer", answer: "Venus" },
                { type: "next" },
              ],
            ],
            expected: {
              order: ["q3", "q1", "q2"],
              prompts: [
                "In which year did the Berlin Wall fall?",
                "What is the chemical symbol for gold?",
                "Which planet is known as the \"Red Planet\"?",
              ],
              answers: [
                ["1987", "1989", "1991", "1985"],
                ["Go", "Ag", "Au", "Gd"],
                ["Jupiter", "Mars", "Venus", "Saturn"],
              ],
              index: 2,
              status: "finished",
              results: {
                score: 2,
                answered: 3,
                skipped: 0,
                total: 3,
                percent: 67,
                byCategory: { History: { correct: 1, total: 1 }, "Science & Nature": { correct: 1, total: 2 } },
              },
            },
          },
          {
            description: "a skipped question counts as seen but not answered",
            args: [TRIVIA, 42, [{ type: "skip" }, { type: "next" }, { type: "skip" }]],
            expected: {
              ...TRIVIA_SEED_42,
              index: 1,
              status: "reviewing",
              results: { ...TRIVIA_NOTHING_ANSWERED, skipped: 2 },
            },
          },
          {
            description: "next is ignored until the current question is answered or skipped",
            args: [TRIVIA, 42, [{ type: "next" }, { type: "next" }]],
            expected: { ...TRIVIA_SEED_42, index: 0, status: "answering", results: TRIVIA_NOTHING_ANSWERED },
            isEdgeCase: true,
          },
          {
            description: "an answer that isn't exactly one of the options is ignored",
            args: [TRIVIA, 42, [{ type: "answer", answer: "Silver" }, { type: "answer", answer: "au" }]],
            expected: { ...TRIVIA_SEED_42, index: 0, status: "answering", results: TRIVIA_NOTHING_ANSWERED },
            isEdgeCase: true,
          },
          {
            description: "actions after the quiz has finished are ignored",
            args: [TRIVIA, 42, [...TRIVIA_FULL_RUN, { type: "answer", answer: "Predator" }, { type: "next" }, { type: "skip" }]],
            expected: TRIVIA_FULL_RUN_RESULT,
            isEdgeCase: true,
          },
          {
            description: "an empty question list starts finished",
            args: [[], 42, [{ type: "answer", answer: "x" }, { type: "next" }]],
            expected: {
              order: [],
              prompts: [],
              answers: [],
              index: 0,
              status: "finished",
              results: { score: 0, answered: 0, skipped: 0, total: 0, percent: 0, byCategory: {} },
            },
            isEdgeCase: true,
          },
          {
            description: "malformed questions are dropped before shuffling",
            args: [
              [
                TRIVIA[0],
                { id: "bad1", category: "History", question: "No wrong answers?", correct_answer: "Yes", incorrect_answers: [] },
                { id: "bad2", category: "History", question: "No right answer?", correct_answer: null, incorrect_answers: ["A", "B"] },
                { id: "bad3", category: "History", question: "Ambiguous?", correct_answer: "&amp;", incorrect_answers: ["&", "@"] },
                TRIVIA[2],
              ],
              42,
              [],
            ],
            expected: {
              order: ["q1", "q3"],
              prompts: ["What is the chemical symbol for gold?", "In which year did the Berlin Wall fall?"],
              answers: [
                ["Au", "Go", "Gd", "Ag"],
                ["1991", "1985", "1987", "1989"],
              ],
              index: 0,
              status: "answering",
              results: {
                score: 0,
                answered: 0,
                skipped: 0,
                total: 2,
                percent: 0,
                byCategory: { "Science & Nature": { correct: 0, total: 1 }, History: { correct: 0, total: 1 } },
              },
            },
            isEdgeCase: true,
          },
          {
            description: "decoding is a single pass and leaves unknown or out-of-range entities alone",
            args: [
              [
                {
                  id: "e1",
                  category: "Science: Computers",
                  question: "Is &amp;lt;b&amp;gt; escaped? &copy; &#9731; &#99999999;",
                  correct_answer: "Yes &amp; no",
                  incorrect_answers: ["&lt;No&gt;"],
                },
              ],
              3,
              [],
            ],
            expected: {
              order: ["e1"],
              prompts: ["Is &lt;b&gt; escaped? &copy; ☃ &#99999999;"],
              answers: [["Yes & no", "<No>"]],
              index: 0,
              status: "answering",
              results: {
                score: 0,
                answered: 0,
                skipped: 0,
                total: 1,
                percent: 0,
                byCategory: { "Science: Computers": { correct: 0, total: 1 } },
              },
            },
            isEdgeCase: true,
          },
        ],
      },
    },
    {
      id: "react-capstone-todoist-clone",
      moduleId: "fe-react-projects",
      trackId: "frontend",
      title: "Capstone: Todoist Clone",
      summary:
        "Karl Hadwen's Todoist clone (August 2019) is the most complete of these walkthroughs: Create React App, Firebase Firestore, custom Hooks (`useTasks`, `useProjects`), Context for the selected project, SCSS with dark mode, moment.js, an accessibility pass with Lighthouse, and about three hours of React Testing Library tests. It's worth watching for the testing and accessibility chapters alone. It also shows what to avoid: every query is hard-coded to one user id with no authentication, due dates are `DD/MM/YYYY` strings that can't be sorted or range-queried, \"Next 7 days\" uses a moment `diff` that also catches overdue tasks, and `useProjects` re-runs an Effect that depends on the state it sets, guarded by a `JSON.stringify` comparison.\n\nA 2026 build uses Vite or a framework and adds real authentication (Firebase Auth, Supabase, Clerk or Better Auth) with security rules or row-level security, so users can only read their own tasks. Store dates as ISO `YYYY-MM-DD` and compute ranges with date-fns or `Temporal` against an injected \"today\"; replace hand-rolled fetching Hooks with TanStack Query, or with real-time subscriptions that clean up; use `useOptimistic` for instant completes; retire moment (in maintenance mode) and node-sass (deprecated); and test with Vitest, React Testing Library and Playwright. The alternate walkthrough, a chat app with Redux-Saga and WebSockets, covers the real-time side.\n\n\"Done\" means: sign-in; projects you can add, rename and archive; tasks with due dates and priorities; Inbox, Today (with overdue) and Next 7 days views that stay correct across month, year and leap-day boundaries; a completed-tasks view; optimistic updates that roll back on failure; quick add from the keyboard; responsive dark mode; and tests that pin the date logic to a fixed today. The challenge below implements the view selector.",
      level: "advanced",
      estMinutes: 580,
      isMilestone: true,
      webRefs: [
        { label: "react.dev: useOptimistic", url: "https://react.dev/reference/react/useOptimistic", kind: "docs" },
        { label: "TanStack Query: Optimistic Updates", url: "https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates", kind: "docs" },
        { label: "MDN: Temporal", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal", kind: "docs" },
        { label: "Testing Library: React Testing Library", url: "https://testing-library.com/docs/react-testing-library/intro/", kind: "docs" },
      ],
      video: {
        title: "Intermediate React Tutorial - Todoist Clone (with Firebase, Custom Hooks, SCSS, React Testing)",
        channel: "freeCodeCamp.org",
        url: "https://www.youtube.com/watch?v=hT3j87FMR6M",
        videoId: "hT3j87FMR6M",
        durationLabel: "7:38:39",
      },
      alternateVideos: [
        {
          title: "Build a Chat Application using React, Redux, Redux-Saga, and Web Sockets - Tutorial",
          channel: "freeCodeCamp.org",
          url: "https://www.youtube.com/watch?v=x_fHXt9V3zQ",
          videoId: "x_fHXt9V3zQ",
          durationLabel: "1:24:54",
        },
      ],
      challengeType: "code",
      codeChallenge: {
        instructions:
          "Implement `selectView(data, view, today)`, the selector behind the clone's sidebar views. It must be pure and deterministic: `today` is injected as a `\"YYYY-MM-DD\"` string, so never call `new Date()` without arguments.\n\n`data` is `{ projects: [{ id, name, archived }], tasks: [{ id, title, projectId, due, priority, archived }] }`, and a project with id `\"inbox\"` always exists. For tasks:\n\n- `due` is a `\"YYYY-MM-DD\"` string or `null`. Anything that isn't a real calendar date in exactly that format (`\"22/09/2026\"`, `\"2026-9-21\"`, `\"2026-02-30\"`) counts as no due date. Leap years apply.\n- `priority` is 1 (highest) to 4; anything else, including a missing value, counts as 4.\n- `archived: true` means completed. Every view except Archived shows only active tasks.\n- A task whose `projectId` matches no project belongs to the Inbox.\n\nReturn `{ title, count, sections: [{ label, taskIds }] }`, where `count` is the number of task ids across all sections:\n\n- `{ type: \"inbox\" }`: title `\"Inbox\"` and one section labelled `\"Inbox\"` with the Inbox's active tasks.\n- `{ type: \"today\" }`: title `\"Today\"`. Active tasks due on or before `today`, excluding tasks in archived projects. An `\"Overdue\"` section (due before today) comes first, only when it has tasks, followed by a `\"Today\"` section, always.\n- `{ type: \"next7\" }`: title `\"Next 7 days\"`. Exactly seven sections labelled with the dates from `today` to `today` + 6 days, each holding the active tasks due that day, excluding archived projects. Overdue tasks don't appear, and month, year and leap-day boundaries must work.\n- `{ type: \"project\", projectId }`: the project's name is both the title and the single section's label, and the section holds its active tasks. Archived projects can still be opened. An unknown project returns `{ title: \"Not found\", count: 0, sections: [] }`.\n- `{ type: \"archived\" }`: title and label `\"Archived\"`, holding every archived task from any project.\n\nSort each section by due date ascending (tasks without a valid due date last), then priority (1 first), then title, then id, comparing strings with `<` and `>`.\n\nTip: valid ISO dates compare correctly as strings, and date arithmetic done in UTC (`Date.UTC`) can't be shifted by a time zone or a daylight-saving change.",
        starterCode: `/**
 * @param {{ projects: { id: string, name: string, archived: boolean }[], tasks: { id: string, title: string, projectId: string, due: string | null, priority?: number, archived: boolean }[] }} data
 * @param {{ type: "inbox" | "today" | "next7" | "archived" } | { type: "project", projectId: string }} view
 * @param {string} today "YYYY-MM-DD"
 * @returns {{ title: string, count: number, sections: { label: string, taskIds: string[] }[] }}
 */
function selectView(data, view, today) {
  // Your code here
}
`,
        functionName: "selectView",
        testCases: [
          {
            description: "Inbox: active Inbox tasks plus orphans, undated last",
            args: [TODO_DATA, { type: "inbox" }, "2026-09-21"],
            expected: { title: "Inbox", count: 4, sections: [{ label: "Inbox", taskIds: ["t1", "t6", "t13", "t8"] }] },
          },
          {
            description: "Today: an Overdue section first, then today's tasks by priority",
            args: [TODO_DATA, { type: "today" }, "2026-09-21"],
            expected: {
              title: "Today",
              count: 5,
              sections: [
                { label: "Overdue", taskIds: ["t4", "t3"] },
                { label: "Today", taskIds: ["t12", "t1", "t2"] },
              ],
            },
          },
          {
            description: "Next 7 days: seven dated sections, no archived projects, nothing on day 8",
            args: [TODO_DATA, { type: "next7" }, "2026-09-21"],
            expected: {
              title: "Next 7 days",
              count: 6,
              sections: [
                { label: "2026-09-21", taskIds: ["t12", "t1", "t2"] },
                { label: "2026-09-22", taskIds: [] },
                { label: "2026-09-23", taskIds: [] },
                { label: "2026-09-24", taskIds: ["t5", "t14"] },
                { label: "2026-09-25", taskIds: [] },
                { label: "2026-09-26", taskIds: [] },
                { label: "2026-09-27", taskIds: ["t6"] },
              ],
            },
          },
          {
            description: "a project view sorts by date, and an unparseable date sorts as undated",
            args: [TODO_DATA, { type: "project", projectId: "work" }, "2026-09-21"],
            expected: { title: "Work", count: 4, sections: [{ label: "Work", taskIds: ["t3", "t5", "t7", "t11"] }] },
          },
          {
            description: "a project view mixes overdue, today and future tasks in date order",
            args: [TODO_DATA, { type: "project", projectId: "home" }, "2026-09-21"],
            expected: { title: "Home", count: 4, sections: [{ label: "Home", taskIds: ["t4", "t12", "t2", "t14"] }] },
          },
          {
            description: "Archived: completed tasks from every project",
            args: [TODO_DATA, { type: "archived" }, "2026-09-21"],
            expected: { title: "Archived", count: 2, sections: [{ label: "Archived", taskIds: ["t10", "t15"] }] },
          },
          {
            description: "an archived project can still be opened directly",
            args: [TODO_DATA, { type: "project", projectId: "old" }, "2026-09-21"],
            expected: { title: "Old Side Project", count: 1, sections: [{ label: "Old Side Project", taskIds: ["t9"] }] },
            isEdgeCase: true,
          },
          {
            description: "an unknown project is Not found",
            args: [TODO_DATA, { type: "project", projectId: "nope" }, "2026-09-21"],
            expected: { title: "Not found", count: 0, sections: [] },
            isEdgeCase: true,
          },
          {
            description: "Next 7 days crosses a year boundary",
            args: [
              {
                projects: INBOX_ONLY,
                tasks: [
                  { id: "y1", title: "New Year's Eve party", projectId: "inbox", due: "2026-12-31", priority: 2, archived: false },
                  { id: "y2", title: "Back to work", projectId: "inbox", due: "2027-01-03", priority: 1, archived: false },
                  { id: "y3", title: "Dentist", projectId: "inbox", due: "2027-01-04", priority: 1, archived: false },
                  { id: "y4", title: "Christmas thank-you notes", projectId: "inbox", due: "2026-12-27", priority: 3, archived: false },
                ],
              },
              { type: "next7" },
              "2026-12-28",
            ],
            expected: {
              title: "Next 7 days",
              count: 2,
              sections: [
                { label: "2026-12-28", taskIds: [] },
                { label: "2026-12-29", taskIds: [] },
                { label: "2026-12-30", taskIds: [] },
                { label: "2026-12-31", taskIds: ["y1"] },
                { label: "2027-01-01", taskIds: [] },
                { label: "2027-01-02", taskIds: [] },
                { label: "2027-01-03", taskIds: ["y2"] },
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "Next 7 days includes 29 February in a leap year",
            args: [
              {
                projects: INBOX_ONLY,
                tasks: [
                  { id: "l1", title: "Leap day", projectId: "inbox", due: "2028-02-29", priority: 1, archived: false },
                  { id: "l2", title: "March 1st", projectId: "inbox", due: "2028-03-01", priority: 1, archived: false },
                  { id: "l3", title: "Not a real day", projectId: "inbox", due: "2027-02-29", priority: 1, archived: false },
                ],
              },
              { type: "next7" },
              "2028-02-25",
            ],
            expected: {
              title: "Next 7 days",
              count: 2,
              sections: [
                { label: "2028-02-25", taskIds: [] },
                { label: "2028-02-26", taskIds: [] },
                { label: "2028-02-27", taskIds: [] },
                { label: "2028-02-28", taskIds: [] },
                { label: "2028-02-29", taskIds: ["l1"] },
                { label: "2028-03-01", taskIds: ["l2"] },
                { label: "2028-03-02", taskIds: [] },
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "February has no 29th in a common year",
            args: [{ projects: INBOX_ONLY, tasks: [] }, { type: "next7" }, "2026-02-26"],
            expected: {
              title: "Next 7 days",
              count: 0,
              sections: [
                { label: "2026-02-26", taskIds: [] },
                { label: "2026-02-27", taskIds: [] },
                { label: "2026-02-28", taskIds: [] },
                { label: "2026-03-01", taskIds: [] },
                { label: "2026-03-02", taskIds: [] },
                { label: "2026-03-03", taskIds: [] },
                { label: "2026-03-04", taskIds: [] },
              ],
            },
            isEdgeCase: true,
          },
          {
            description: "impossible or badly formatted dates never count as today, and odd priorities count as 4",
            args: [
              {
                projects: INBOX_ONLY,
                tasks: [
                  { id: "b1", title: "Impossible date", projectId: "inbox", due: "2026-02-30", priority: 1, archived: false },
                  { id: "b2", title: "Unpadded date", projectId: "inbox", due: "2026-9-21", priority: 1, archived: false },
                  { id: "b3", title: "Real today", projectId: "inbox", due: "2026-09-21", priority: 0, archived: false },
                  { id: "b4", title: "Also today", projectId: "inbox", due: "2026-09-21", priority: 3, archived: false },
                  { id: "b5", title: "Month 13", projectId: "inbox", due: "2026-13-01", priority: 1, archived: false },
                ],
              },
              { type: "today" },
              "2026-09-21",
            ],
            expected: { title: "Today", count: 2, sections: [{ label: "Today", taskIds: ["b4", "b3"] }] },
            isEdgeCase: true,
          },
          {
            description: "an empty Today still has its Today section",
            args: [{ projects: INBOX_ONLY, tasks: [] }, { type: "today" }, "2026-09-21"],
            expected: { title: "Today", count: 0, sections: [{ label: "Today", taskIds: [] }] },
            isEdgeCase: true,
          },
        ],
      },
    },
  ],
} satisfies Module;
