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

// A server cart line -> the item shape the rest of the app uses.
// `catalogProduct` (optional) supplies the original price and sizes.
export function fromServerLine(line, catalogProduct) {
  const price = Number(line.price);
  const stock = Number(line.stock);
  const original = catalogProduct?.originalPrice;
  return {
    id: line.productId,
    slug: line.slug,
    name: line.name,
    image: line.imageUrl || null,
    price,
    originalPrice: original && original > price ? original : undefined,
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
    // Keep what we already know about the product (original price, sizes)
    // when the catalog couldn't be loaded.
    next.push({
      ...(old || {}),
      ...fresh,
      originalPrice: fresh.originalPrice ?? old?.originalPrice,
      sizes: fresh.sizes ?? old?.sizes,
    });
  });
  return { items: next, changed };
}

export const CART_NOTICE =
  "Some items in your cart were removed or reduced because they are no longer available in that quantity.";
