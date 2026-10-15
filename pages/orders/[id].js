import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  Check,
  Package,
  Truck,
  MapPin,
  CreditCard,
  LifeBuoy,
  ChevronRight,
} from "lucide-react";
import FocusedHeader from "../../components/FocusedHeader";
import api from "../../lib/api";
import { useShipping } from "../../lib/useShipping";

const FLOW = [
  { status: "PENDING", short: "Placed" },
  { status: "PAID", short: "Paid" },
  { status: "SHIPPED", short: "Shipped" },
  { status: "DELIVERED", short: "Delivered" },
];

// Used when no Tracking link is set in admin Settings. The home page is a
// safer target than a deep link, which can break when the site changes.
const INDIA_POST_TRACKING = "https://www.indiapost.gov.in/";

// Builds the courier link from the tracking link set in the admin Settings
// (it contains {trackingNumber}). Returns null when none is set.
function trackingLink(template, number) {
  if (
    template &&
    /^https?:\/\//i.test(template) &&
    template.includes("{trackingNumber}")
  )
    return template.split("{trackingNumber}").join(encodeURIComponent(number));
  return null;
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
// priceAtPurchase is what the customer was actually charged, so it comes first.
function itemPrice(item) {
  return Number(
    item.priceAtPurchase ??
      item.price ??
      item.unitPrice ??
      item.product?.price ??
      0,
  );
}
function itemImage(item) {
  return item.product?.imageUrls?.[0] || item.imageUrl || null;
}
// Shipping charged on the order. null = the API didn't send it.
function orderShippingCharge(order) {
  const v = order.shippingCharge;
  return v !== undefined && v !== null && Number.isFinite(Number(v))
    ? Number(v)
    : null;
}

// Big status line + sub-line, like the banner at the top of Amazon / Flipkart.
function statusInfo(order, deliveryEstimate) {
  switch (order.status) {
    case "PENDING":
      return {
        title: "Awaiting payment",
        sub: "We'll confirm your order once the payment is received.",
        color: "text-amber-700",
      };
    case "PAID":
      return {
        title: "Order confirmed",
        sub: deliveryEstimate
          ? `Estimated delivery: ${deliveryEstimate}`
          : "We're getting your order ready.",
        color: "text-spine",
      };
    case "SHIPPED":
      return {
        title: "Shipped",
        sub: "Your package is on its way.",
        color: "text-purple-700",
      };
    case "DELIVERED":
      return {
        title: "Delivered",
        sub: "Your order has been delivered.",
        color: "text-green-700",
      };
    case "CANCELLED":
      return {
        title: "Cancelled",
        sub: "This order was cancelled.",
        color: "text-red-700",
      };
    default:
      return { title: order.status, sub: "", color: "text-ink" };
  }
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white border border-neutral-200 rounded-xl p-4 mb-3 ${className}`}
    >
      {children}
    </div>
  );
}

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const { trackingUrlTemplate, courierName, deliveryEstimate } = useShipping();

  useEffect(() => {
    if (!id) return;
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => {
        api
          .get("/orders")
          .then((res) => {
            const found = res.data.find((o) => String(o.id) === String(id));
            if (found) setOrder(found);
            else setError("Order not found.");
          })
          .catch(() => setError("Could not load this order."));
      })
      .finally(() => setLoading(false));
  }, [id]);

  function copyTrackingNumber(number) {
    if (!navigator.clipboard) return;
    navigator.clipboard
      .writeText(number)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  if (loading) {
    return (
      <div>
        <FocusedHeader title="Order Details" fallbackHref="/orders" />
        <p className="max-w-2xl mx-auto px-6 py-10 text-neutral-400">
          Loading...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <FocusedHeader title="Order Details" fallbackHref="/orders" />
        <p className="max-w-2xl mx-auto px-6 py-10 text-red-600">
          {error || "Order not found."}
        </p>
      </div>
    );
  }

  const address = order.shippingAddress;
  const cancelled = order.status === "CANCELLED";
  const flowIndex = FLOW.findIndex((f) => f.status === order.status);
  const total = order.totalAmount ?? order.total;
  const shipping = orderShippingCharge(order);
  const paid = ["PAID", "SHIPPED", "DELIVERED"].includes(order.status);
  const orderedOn = formatDate(order.createdAt);
  const shortId =
    order.orderNumber || String(order.id).slice(0, 8).toUpperCase();
  const info = statusInfo(
    order,
    deliveryEstimate ? String(deliveryEstimate).trim() : "",
  );
  const link = order.trackingNumber
    ? trackingLink(trackingUrlTemplate, order.trackingNumber)
    : null;

  return (
    <div>
      <FocusedHeader title="Order Details" fallbackHref="/orders" />
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Order info line */}
        <p className="text-xs text-neutral-500 mb-3 px-1">
          {orderedOn ? `Ordered on ${orderedOn} · ` : ""}Order #{shortId}
        </p>

        {/* Status banner */}
        <Card>
          <p className={`text-lg font-semibold ${info.color}`}>{info.title}</p>
          {info.sub && (
            <p className="text-sm text-neutral-500 mt-0.5">{info.sub}</p>
          )}

          {!cancelled && flowIndex >= 0 && (
            <div className="flex items-start mt-5">
              {FLOW.map((f, i) => {
                const done = i <= flowIndex;
                return (
                  <div
                    key={f.status}
                    className="flex-1 flex flex-col items-center relative"
                  >
                    {i > 0 && (
                      <span
                        className={`absolute top-[11px] right-1/2 w-full h-0.5 ${
                          i <= flowIndex ? "bg-spine" : "bg-neutral-200"
                        }`}
                      />
                    )}
                    <span
                      className={`relative z-10 grid h-6 w-6 place-items-center rounded-full text-white ${
                        done ? "bg-spine" : "bg-neutral-200"
                      }`}
                    >
                      {done && <Check size={14} />}
                    </span>
                    <span
                      className={`mt-1.5 text-[11px] leading-tight text-center ${
                        done ? "text-ink font-medium" : "text-neutral-400"
                      }`}
                    >
                      {f.short}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {order.trackingNumber &&
            (order.status === "SHIPPED" || order.status === "DELIVERED") && (
              <div className="mt-5 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-500">
                  {courierName
                    ? `${courierName} tracking number`
                    : "Tracking number"}
                </p>
                <p className="font-medium text-ink break-all">
                  {order.trackingNumber}
                  <button
                    type="button"
                    onClick={() => copyTrackingNumber(order.trackingNumber)}
                    className="ml-3 text-xs font-normal text-spine underline"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </p>
                <a
                  href={link || INDIA_POST_TRACKING}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-spine text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Truck size={16} /> Track package
                </a>
                {!link && (
                  <p className="text-xs text-neutral-400 mt-2">
                    Copy the tracking number above, open the courier&apos;s
                    site, and look for &quot;Track N Trace&quot; to see live
                    status.
                  </p>
                )}
              </div>
            )}
        </Card>

        {/* Items */}
        <Card>
          <div className="flex flex-col gap-4">
            {(order.items || []).map((item, i) => {
              const img = itemImage(item);
              const slug = item.product?.slug;
              return (
                <div key={i} className="flex gap-3">
                  <div className="w-20 h-20 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0 grid place-items-center">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={itemName(item)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={24} className="text-neutral-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink leading-snug">
                      {itemName(item)}
                      {item.variantInfo?.size
                        ? ` (${item.variantInfo.size})`
                        : ""}
                      {item.variantInfo?.color
                        ? ` - ${item.variantInfo.color}`
                        : ""}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-sm font-medium text-ink mt-1">
                      ₹{itemPrice(item) * item.quantity}
                    </p>
                    {slug && (
                      <Link
                        href={`/products/${slug}`}
                        className="inline-block mt-2 px-3 py-1.5 border border-spine text-spine rounded-lg text-xs font-medium hover:bg-spine hover:text-white transition-colors"
                      >
                        Buy it again
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Delivery address */}
        {address && (
          <Card>
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-spine mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-ink mb-1">Delivery address</p>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {address}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Payment */}
        <Card>
          <div className="flex items-start gap-3">
            <CreditCard size={20} className="text-spine mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-ink mb-1">Payment</p>
              <p className="text-sm text-neutral-600">
                {paid
                  ? "Paid online"
                  : cancelled
                    ? "Cancelled"
                    : "Awaiting payment"}
              </p>
            </div>
          </div>
        </Card>

        {/* Order summary */}
        {total != null && (
          <Card>
            <p className="font-medium text-ink mb-3">Order summary</p>
            <dl className="flex flex-col gap-2 text-sm">
              {shipping !== null && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Items</dt>
                    <dd>₹{Number(total) - shipping}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Delivery</dt>
                    <dd>{shipping === 0 ? "Free" : `₹${shipping}`}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-neutral-200">
                <dt>Order total</dt>
                <dd className="text-spine">₹{total}</dd>
              </div>
            </dl>
          </Card>
        )}

        {/* Help */}
        <Link href="/help">
          <Card className="flex items-center gap-3 hover:shadow-sm transition-shadow">
            <LifeBuoy size={20} className="text-spine flex-shrink-0" />
            <span className="flex-1 font-medium text-ink">
              Need help with this order?
            </span>
            <ChevronRight size={16} className="text-neutral-300" />
          </Card>
        </Link>
      </main>
    </div>
  );
}
