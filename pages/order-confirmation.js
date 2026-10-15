import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CheckCircle2, Truck, CreditCard, MapPin } from "lucide-react";
import FocusedHeader from "../components/FocusedHeader";
import api from "../lib/api";
import { useShipping } from "../lib/useShipping";

// Uses the method from the API if it sends one, otherwise just says "Paid online".
function paymentLabel(order) {
  const raw = order.paymentMethod || order.payment?.method;
  if (raw) {
    const m = String(raw);
    return `Paid via ${
      m.toLowerCase() === "upi" ? "UPI" : m.charAt(0).toUpperCase() + m.slice(1)
    }`;
  }
  return order.status === "PAID" ? "Paid online" : null;
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
// Shipping charged on the order. null = the API didn't send it.
function orderShippingCharge(order) {
  const v = order.shippingCharge;
  return v !== undefined && v !== null && Number.isFinite(Number(v))
    ? Number(v)
    : null;
}

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  // Set in admin Settings → Shipping → "Delivery estimate".
  const { deliveryEstimate } = useShipping();

  useEffect(() => {
    if (!orderId) return;

    // Try fetching this specific order directly first.
    api
      .get(`/orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch(() => {
        // Fall back to the list endpoint and find it there.
        api
          .get("/orders")
          .then((res) => {
            const found = res.data.find(
              (o) => String(o.id) === String(orderId),
            );
            setOrder(found || null);
          })
          .catch(() => setOrder(null));
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const address = order?.shippingAddress;
  const payment = order ? paymentLabel(order) : null;
  const estimate = deliveryEstimate ? String(deliveryEstimate).trim() : "";
  const shortId = orderId ? String(orderId).slice(0, 8).toUpperCase() : "";
  const total = order ? (order.totalAmount ?? order.total) : null;
  const shipping = order ? orderShippingCharge(order) : null;

  return (
    <div>
      <FocusedHeader title="Order placed" href="/" />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <CheckCircle2 size={56} className="mx-auto mb-3 text-green-600" />
          <h1 className="font-serif text-2xl text-ink mb-2">Order placed!</h1>
          <p className="text-neutral-500">
            Order{shortId ? ` #${shortId}` : ""} has been received. You can
            follow its progress anytime from My Orders.
          </p>
        </div>

        {loading && (
          <p className="text-center text-neutral-400">
            Loading order details...
          </p>
        )}

        {!loading && order && (
          <>
            {(estimate || payment || address) && (
              <div className="border border-neutral-200 rounded-lg p-5 mb-4 flex flex-col gap-4">
                {estimate && (
                  <div className="flex items-start gap-3">
                    <Truck
                      size={20}
                      className="text-spine mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs text-neutral-400">
                        Estimated delivery
                      </p>
                      <p className="font-medium text-ink">{estimate}</p>
                    </div>
                  </div>
                )}

                {payment && (
                  <div className="flex items-start gap-3">
                    <CreditCard
                      size={20}
                      className="text-spine mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs text-neutral-400">Payment</p>
                      <p className="font-medium text-ink">{payment}</p>
                    </div>
                  </div>
                )}

                {address && (
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={20}
                      className="text-spine mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs text-neutral-400">Delivering to</p>
                      <p className="text-sm text-neutral-600">{address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border border-neutral-200 rounded-lg p-5 mb-8">
              <h2 className="font-medium text-ink mb-3">Order summary</h2>
              <div className="flex flex-col gap-2">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-neutral-600">
                      {itemName(item)}
                      {item.variantInfo?.size
                        ? ` (${item.variantInfo.size})`
                        : ""}
                      {item.variantInfo?.color
                        ? ` - ${item.variantInfo.color}`
                        : ""}{" "}
                      × {item.quantity}
                    </span>
                    <span className="text-ink">
                      ₹{itemPrice(item) * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {total != null && (
                <div className="pt-3 mt-3 border-t border-neutral-200 flex flex-col gap-1">
                  {shipping !== null && (
                    <>
                      <div className="flex justify-between text-sm text-neutral-500">
                        <span>Subtotal</span>
                        <span>₹{Number(total) - shipping}</span>
                      </div>
                      <div className="flex justify-between text-sm text-neutral-500">
                        <span>Delivery</span>
                        <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span className="text-brass">₹{total}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!loading && !order && (
          <p className="text-center text-neutral-400 mb-8">
            We couldn&apos;t load the full order details right now, but your
            order has been placed successfully.
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push("/products")}
            className="px-5 py-2 border border-spine text-spine rounded hover:bg-spine hover:text-white transition-colors"
          >
            Continue shopping
          </button>
          {orderId && (
            <button
              onClick={() => router.push(`/orders/${orderId}`)}
              className="px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity"
            >
              Track Order
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
