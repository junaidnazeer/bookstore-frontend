import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import api from "../../lib/api";
import { getToken } from "../../lib/auth";
import { Package, ChevronRight, ArrowLeft } from "lucide-react";

const SPINE = "#1e3d32";

// Friendly labels instead of the raw ALL-CAPS status from the API.
const STATUS_BADGE = {
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  PAID: { label: "Paid", cls: "bg-blue-100 text-blue-700" },
  SHIPPED: { label: "Shipped", cls: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Delivered", cls: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
};

// The API may nest product details or use different field names.
function itemName(item) {
  return (
    item.name ||
    item.productName ||
    item.title ||
    item.product?.name ||
    item.product?.title ||
    "Item"
  );
}

function itemImage(item) {
  return item.product?.imageUrls?.[0] || item.imageUrl || null;
}

function shortOrderNumber(order) {
  return order.orderNumber || String(order.id).slice(0, 8).toUpperCase();
}

function orderDate(order) {
  const raw = order.createdAt || order.created_at || order.placedAt;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function orderTime(order) {
  const raw = order.createdAt || order.created_at || order.placedAt;
  const t = raw ? new Date(raw).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
}

export default function Orders() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    api
      .get("/orders")
      .then((res) =>
        // Newest first (orders without a date keep their original order).
        setOrders([...res.data].sort((a, b) => orderTime(b) - orderTime(a))),
      )
      .catch(() => setError("Could not load your orders."))
      .finally(() => setLoading(false));
  }, [checked]);

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/account");
    }
  }

  if (!checked) return null;

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <header
        className="flex items-center gap-3 px-4 pb-4 max-w-2xl mx-auto"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
      >
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="flex-shrink-0"
          style={{ color: SPINE }}
        >
          <ArrowLeft size={22} />
        </button>
        <h1
          className="font-serif text-lg font-semibold"
          style={{ color: SPINE }}
        >
          My Orders
        </h1>
      </header>
      <main className="max-w-2xl mx-auto px-6 pb-8">
        {loading && <p className="text-neutral-400">Loading orders...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-16">
            <Package size={40} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-400 mb-4">
              You haven&apos;t placed any orders yet.
            </p>
            <Link
              href="/products"
              className="inline-block px-5 py-2 bg-spine text-white rounded"
            >
              Start Shopping
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const items = order.items || [];
            const total = order.totalAmount ?? order.total;
            const date = orderDate(order);
            const firstItem = items[0] || null;
            const firstName = firstItem ? itemName(firstItem) : null;
            const img = firstItem ? itemImage(firstItem) : null;
            const more = items.length > 1 ? ` +${items.length - 1} more` : "";
            const badge = STATUS_BADGE[order.status] || {
              label: order.status,
              cls: "bg-neutral-100 text-neutral-500",
            };

            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center gap-3 border border-neutral-200 rounded-lg bg-white p-3 hover:shadow-sm transition-shadow"
              >
                {/* Product thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 grid place-items-center">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={firstName || "Order item"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={22} className="text-neutral-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink">
                    Order #{shortOrderNumber(order)}
                  </p>
                  {firstName && (
                    <p className="text-sm text-neutral-600 truncate">
                      {firstName}
                      {more}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400">
                    {items.length} item{items.length === 1 ? "" : "s"}
                    {total != null ? ` · ₹${total}` : ""}
                    {date ? ` · ${date}` : ""}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                  <ChevronRight size={16} className="text-neutral-300" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
