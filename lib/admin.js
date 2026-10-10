// Shared helpers for the admin panel. Nothing here talks to the network —
// pages use the existing `lib/api.js` client directly.

export const PAGE_SIZE = 10;
export const LOW_STOCK_THRESHOLD = 10; // same threshold the old dashboard used

// The backend's real order statuses (API_REFERENCE.md → PUT /admin/orders/:id).
export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const ORDER_STATUS_META = {
  PENDING: { label: "Pending", tone: "amber" },
  PAID: { label: "Paid", tone: "blue" },
  SHIPPED: { label: "Shipped", tone: "indigo" },
  DELIVERED: { label: "Delivered", tone: "green" },
  CANCELLED: { label: "Cancelled", tone: "red" },
};

// Only these statuses mean money was actually received. PENDING is unpaid and
// CANCELLED is not revenue either.
const REVENUE_STATUSES = ["PAID", "SHIPPED", "DELIVERED"];

export function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function formatDate(value, withTime = false) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

/* ---------- order readers ----------
   API_REFERENCE.md doesn't spell out the order object, so every reader accepts
   the shapes the backend could reasonably send and falls back to "nothing"
   rather than inventing a value. */
export const orderDate = (o) => o.createdAt || null;
export const orderTotal = (o) => {
  const t = o.totalAmount ?? o.total;
  if (t !== undefined && t !== null && Number.isFinite(Number(t)))
    return Number(t);
  return (o.items || []).reduce(
    (s, i) => s + itemPrice(i) * Number(i.quantity || 0),
    0,
  );
};
// Shipping charged on the order, when the backend stores it (so the subtotal is
// exactly total - shippingCharge). null = not provided.
export const orderShipping = (o) => {
  const v = o.shippingCharge;
  return v !== undefined && v !== null && Number.isFinite(Number(v))
    ? Number(v)
    : null;
};
export const isRevenueOrder = (o) => REVENUE_STATUSES.includes(o.status);

// A UUID is unreadable in a table, so show a short reference when there is no
// human order number. Search still matches the full id.
export function orderRef(o) {
  if (o.orderNumber) return String(o.orderNumber);
  const id = String(o.id ?? "");
  return id.length > 12 ? id.slice(0, 8).toUpperCase() : id;
}

export const orderCustomerObj = (o) => o.user || o.customer || null;
export const orderCustomerName = (o) =>
  o.customerName || orderCustomerObj(o)?.name || "";
export const orderCustomerEmail = (o) =>
  o.customerEmail || orderCustomerObj(o)?.email || "";
export const orderCustomerPhone = (o) =>
  o.customerPhone || orderCustomerObj(o)?.phone || "";
export const orderCustomerId = (o) =>
  orderCustomerObj(o)?.id || o.userId || null;

export const itemName = (i) =>
  i.name || i.productName || i.product?.name || "Item";
// priceAtPurchase is what the customer was charged. Only fall back to the
// product's current price if the backend sent nothing else, because that price
// may have changed since the order was placed.
export const itemPrice = (i) =>
  Number(i.priceAtPurchase ?? i.price ?? i.unitPrice ?? i.product?.price ?? 0);
export const itemImage = (i) => i.product?.imageUrls?.[0] || i.imageUrl || null;

export function orderMatches(o, term) {
  const t = term.trim();
  if (!t) return true;
  return (
    includesText(orderRef(o), t.replace(/^#/, "")) ||
    includesText(o.id, t.replace(/^#/, "")) ||
    includesText(orderCustomerName(o), t) ||
    includesText(orderCustomerEmail(o), t)
  );
}

export function stockStatus(stock) {
  const n = Number(stock);
  if (!(n > 0)) return { label: "Out of Stock", tone: "red" };
  if (n <= LOW_STOCK_THRESHOLD) return { label: "Low Stock", tone: "amber" };
  return { label: "In Stock", tone: "green" };
}

// Tolerate a bare array or a future { items: [] } / { data: [] } envelope.
export function toArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export const apiStatus = (err) => err?.response?.status;
// 404 / 405 / 501 on an admin endpoint = the backend doesn't implement it.
export const isUnsupported = (err) => [404, 405, 501].includes(apiStatus(err));

// The backend sometimes passes a raw database error straight through. That text
// is long, confusing and shows internals, so recognise it and say something useful.
const DB_NOISE =
  /prisma|invocation|unique constraint|foreign key|argument `|invalid `/i;

export function getApiError(err, fallback) {
  if (!err?.response) return "Could not reach the server. Please try again.";
  const raw = err.response.data?.error || err.response.data?.message;
  if (typeof raw === "string" && DB_NOISE.test(raw)) {
    if (/unique constraint/i.test(raw)) {
      if (/sku/i.test(raw))
        return "That SKU is already used by another product.";
      if (/slug/i.test(raw))
        return "That name is too close to an existing one. Try a different name.";
      return "That value is already in use.";
    }
    if (/foreign key/i.test(raw))
      return "This is still in use elsewhere, so it can’t be removed.";
    return fallback;
  }
  return raw || fallback;
}

export function paginate(items, page, size = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * size;
  return {
    rows: items.slice(start, start + size),
    page: current,
    pageCount,
    start,
  };
}

export function includesText(haystack, term) {
  return String(haystack ?? "")
    .toLowerCase()
    .includes(term.trim().toLowerCase());
}

// Sum / count of items in [from, to) by a date accessor.
export function windowTotal(items, dateOf, valueOf, from, to) {
  return items.reduce((sum, it) => {
    const d = dateOf(it);
    if (!d) return sum;
    const t = new Date(d).getTime();
    return t >= from && t < to ? sum + valueOf(it) : sum;
  }, 0);
}

// Last 30 days vs the 30 days before — only when there IS history to compare
// (previous window > 0), otherwise null so the UI shows nothing.
export function trendVsPrevious(items, dateOf, valueOf = () => 1) {
  const DAY = 86400000;
  const now = Date.now();
  const cur = windowTotal(items, dateOf, valueOf, now - 30 * DAY, now + DAY);
  const prev = windowTotal(
    items,
    dateOf,
    valueOf,
    now - 60 * DAY,
    now - 30 * DAY,
  );
  if (!(prev > 0)) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

export const SESSION_KEYS = ["token", "role", "userName", "userEmail"];
export function clearAdminSession() {
  SESSION_KEYS.forEach((k) => window.localStorage.removeItem(k));
}
