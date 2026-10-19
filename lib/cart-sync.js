// Pure helpers for syncing the cart with the server (no React in here).

export const MAX_LINES = 50; // backend limit: different lines in one cart
export const MAX_QTY = 100; // backend limit: quantity per line

// One cart line per product + size + colour (same rule the cart uses).
export const lineKey = (i) => `${i.id}-${i.size || ""}-${i.color || ""}`;

// The request body for PUT /cart.
export function toPayload(items) {
  return {
    items: items.slice(0, MAX_LINES).map((i) => ({
      productId: i.id,
      size: i.size || null,
      color: i.color || null,
      quantity: Math.min(
        MAX_QTY,
        Math.max(1, Math.floor(Number(i.quantity)) || 1),
      ),
    })),
  };
}

// The list of lines in a /cart response, whatever wrapper it comes in.
export function linesOf(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

// The original (pre-sale) price for a cart line.
// 1. If the server sends an originalPrice field at all, trust it: a number
//    above the current price is the sale's original price, and null (or a
//    number that isn't higher) means "no sale".
// 2. If the field is missing (older backend), fall back to the product's
//    original price from the product list, but only for products WITHOUT
//    variants. A variant has its own price, so the product-level original
//    price could be wrong for it (a made-up discount).
function originalPriceFor(line, catalogProduct, price) {
  if (line.originalPrice !== undefined) {
    const n = Number(line.originalPrice);
    return line.originalPrice !== null && Number.isFinite(n) && n > price
      ? n
      : undefined;
  }
  const hasVariants = (catalogProduct?.variants?.length || 0) > 0;
  const fromCatalog = catalogProduct?.originalPrice;
  if (!hasVariants && fromCatalog && fromCatalog > price) return fromCatalog;
  return undefined;
}

// A server cart line -> the item shape the rest of the app uses.
// `catalogProduct` (optional) supplies the sizes and, until the server sends
// originalPrice on cart lines, the original price for non-variant products.
export function fromServerLine(line, catalogProduct) {
  const price = Number(line.price);
  const stock = Number(line.stock);
  return {
    id: line.productId,
    slug: line.slug,
    name: line.name,
    image: line.imageUrl || null,
    price,
    originalPrice: originalPriceFor(line, catalogProduct, price),
    stock: Number.isFinite(stock) ? stock : undefined,
    sizes: catalogProduct?.sizes,
    size: line.size || undefined,
    color: line.color || undefined,
    quantity: Math.max(1, Math.floor(Number(line.quantity)) || 1),
  };
}

// Combine a guest cart with the saved one. Same product/size/colour keeps the
// higher quantity (not the sum, so logging in again never doubles a cart).
export function mergeCarts(localItems, serverItems) {
  const map = new Map();
  serverItems.forEach((s) => map.set(lineKey(s), s));
  localItems.forEach((l) => {
    const k = lineKey(l);
    const s = map.get(k);
    map.set(k, s ? { ...s, quantity: Math.max(s.quantity, l.quantity) } : l);
  });
  return [...map.values()];
}

// Apply the server's answer to a PUT. The server cuts quantities down to
// the available stock and flags lines that can't be bought any more.
// Returns the new items and how many lines were changed or dropped.
export function applyServerLines(currentItems, serverLines, catalog) {
  const byKey = new Map(currentItems.map((i) => [lineKey(i), i]));
  const next = [];
  let changed = 0;
  serverLines.forEach((line) => {
    const key = lineKey({
      id: line.productId,
      size: line.size,
      color: line.color,
    });
    if (line.available === false) {
      changed += 1;
      return;
    }
    const fresh = fromServerLine(line, catalog?.get(line.productId));
    const old = byKey.get(key);
    if (old && old.quantity !== fresh.quantity) changed += 1;
    // Keep what we already know about the product (sizes, and the original
    // price when the server doesn't send one and the sale still applies).
    const serverSentOriginal = line.originalPrice !== undefined;
    const keepOldOriginal =
      !serverSentOriginal && old?.originalPrice > fresh.price
        ? old.originalPrice
        : undefined;
    next.push({
      ...(old || {}),
      ...fresh,
      originalPrice: fresh.originalPrice ?? keepOldOriginal,
      sizes: fresh.sizes ?? old?.sizes,
    });
  });
  return { items: next, changed };
}

export const CART_NOTICE =
  "Some items in your cart were removed or reduced because they are no longer available in that quantity.";
