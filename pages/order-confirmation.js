import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import api from "../lib/api";

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h1 className="font-serif text-2xl text-ink mb-2">Order placed!</h1>
        <p className="text-neutral-500 mb-8">
          Order{orderId ? ` #${orderId}` : ""} has been received. We'll notify
          you once it ships.
        </p>

        {loading && (
          <p className="text-neutral-400">Loading order details...</p>
        )}

        {!loading && order && (
          <div className="text-left border border-neutral-200 rounded-lg p-6 mb-8">
            <h2 className="font-medium text-ink mb-3">Order summary</h2>
            <div className="flex flex-col gap-2 mb-4">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    {item.name || item.productName}
                    {item.size ? ` (${item.size})` : ""}
                    {item.color ? ` - ${item.color}` : ""} × {item.quantity}
                  </span>
                  <span className="text-ink">
                    ₹{(item.price || 0) * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {order.totalAmount != null && (
              <div className="flex justify-between font-medium pt-3 border-t border-neutral-200 mb-4">
                <span>Total</span>
                <span className="text-brass">₹{order.totalAmount}</span>
              </div>
            )}

            {address && (
              <>
                <h2 className="font-medium text-ink mb-2">
                  Delivery information
                </h2>
                <p className="text-sm text-neutral-600">
                  {address.fullName}
                  <br />
                  {address.addressLine}, {address.city}, {address.state} -{" "}
                  {address.pincode}
                  <br />
                  Phone: {address.phone}
                </p>
              </>
            )}
          </div>
        )}

        {!loading && !order && (
          <p className="text-neutral-400 mb-8">
            We couldn't load the full order details right now, but your order
            has been placed successfully.
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
              View Order
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
