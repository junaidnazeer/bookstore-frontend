import api from "./api";
import { normalizeProduct } from "./normalizeProduct";

// One shared copy of the product list, kept for a few minutes. The wishlist
// only stores product ids on the server, and the cart response has no
// original (pre-sale) price, so both look products up here.
const MAX_AGE_MS = 5 * 60 * 1000;
let cache = null;
let cachedAt = 0;

// Resolves to a Map of product id -> normalized product.
// Throws if the product list can't be loaded.
export async function getCatalog() {
  if (cache && Date.now() - cachedAt < MAX_AGE_MS) return cache;
  const res = await api.get("/products");
  if (!Array.isArray(res.data)) {
    throw new Error("Unexpected response shape from /products");
  }
  cache = new Map(res.data.map(normalizeProduct).map((p) => [p.id, p]));
  cachedAt = Date.now();
  return cache;
}
