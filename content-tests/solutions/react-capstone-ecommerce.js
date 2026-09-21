/**
 * store: { products: { id, name, priceCents, stock }[], taxRateBps, shippingCents,
 *          freeShippingThresholdCents, coupons: Record<CODE, coupon> }
 * coupon: { type: "percent", percent } | { type: "fixed", amountCents, minSubtotalCents } | { type: "freeShipping" }
 */
function createCart() {
  return { lines: [], couponCode: null, couponError: null };
}

function findProduct(store, id) {
  return store.products.find((product) => product.id === id);
}

// n / d rounded to the nearest integer, halves up, without floating-point error (n, d >= 0).
function divRoundHalfUp(n, d) {
  return Math.floor((2 * n + d) / (2 * d));
}

function cartReducer(state, action, store) {
  switch (action.type) {
    case "add": {
      const qty = action.qty === undefined ? 1 : action.qty;
      const product = findProduct(store, action.productId);
      if (!product || !Number.isInteger(qty) || qty < 1) return state;
      const index = state.lines.findIndex((line) => line.productId === product.id);
      const current = index === -1 ? 0 : state.lines[index].qty;
      const nextQty = Math.min(current + qty, product.stock);
      if (nextQty === current) return state; // out of stock, or already at the limit
      const lines =
        index === -1
          ? [...state.lines, { productId: product.id, qty: nextQty }]
          : state.lines.map((line, i) => (i === index ? { ...line, qty: nextQty } : line));
      return { ...state, lines };
    }
    case "setQty": {
      const index = state.lines.findIndex((line) => line.productId === action.productId);
      if (index === -1 || !Number.isInteger(action.qty) || action.qty < 0) return state;
      if (action.qty === 0) return { ...state, lines: state.lines.filter((_, i) => i !== index) };
      const nextQty = Math.min(action.qty, findProduct(store, action.productId).stock);
      if (nextQty === state.lines[index].qty) return state;
      return { ...state, lines: state.lines.map((line, i) => (i === index ? { ...line, qty: nextQty } : line)) };
    }
    case "remove": {
      if (!state.lines.some((line) => line.productId === action.productId)) return state;
      return { ...state, lines: state.lines.filter((line) => line.productId !== action.productId) };
    }
    case "applyCoupon": {
      const code = String(action.code ?? "").trim().toUpperCase();
      if (Object.hasOwn(store.coupons, code)) {
        if (state.couponCode === code && state.couponError === null) return state;
        return { ...state, couponCode: code, couponError: null };
      }
      if (state.couponError === "Unknown coupon") return state;
      return { ...state, couponError: "Unknown coupon" };
    }
    case "removeCoupon":
      if (state.couponCode === null && state.couponError === null) return state;
      return { ...state, couponCode: null, couponError: null };
    case "clear":
      if (state.lines.length === 0 && state.couponCode === null && state.couponError === null) return state;
      return createCart();
    default:
      return state;
  }
}

function selectCartSummary(state, store) {
  const lines = state.lines.map((line) => {
    const product = findProduct(store, line.productId);
    return {
      productId: product.id,
      name: product.name,
      qty: line.qty,
      unitCents: product.priceCents,
      lineCents: product.priceCents * line.qty,
      maxed: line.qty >= product.stock,
    };
  });
  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineCents, 0);
  const coupon = state.couponCode === null ? null : store.coupons[state.couponCode];
  let discountCents = 0;
  if (coupon && coupon.type === "percent") {
    discountCents = divRoundHalfUp(subtotalCents * coupon.percent, 100);
  } else if (coupon && coupon.type === "fixed" && subtotalCents >= coupon.minSubtotalCents) {
    discountCents = Math.min(coupon.amountCents, subtotalCents);
  }
  const taxableCents = subtotalCents - discountCents;
  const taxCents = divRoundHalfUp(taxableCents * store.taxRateBps, 10000);
  const freeShipping =
    lines.length === 0 || (coupon && coupon.type === "freeShipping") || taxableCents >= store.freeShippingThresholdCents;
  const shippingCents = freeShipping ? 0 : store.shippingCents;
  return {
    lines,
    itemCount,
    subtotalCents,
    discountCents,
    taxCents,
    shippingCents,
    totalCents: taxableCents + taxCents + shippingCents,
    couponCode: state.couponCode,
    couponError: state.couponError,
  };
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
