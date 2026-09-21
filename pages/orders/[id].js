import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import api from "../../lib/api";

const STATUS_STEPS = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div>
        <Navbar />
        <p className="max-w-2xl mx-auto px-6 py-10 text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Navbar />
        <p className="max-w-2xl mx-auto px-6 py-10 text-red-600">
          {error || "Order not found."}
        </p>
      </div>
    );
  }

  const address = order.shippingAddress;
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-serif text-2xl text-ink mb-1">
          Order #{order.orderNumber || order.id}
        </h1>
        <p className="text-neutral-500 mb-6">Status: {order.status}</p>

        {currentStepIndex >= 0 && (
          <div className="flex items-center mb-8">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    i <= currentStepIndex ? "bg-spine text-white" : "bg-neutral-200 text-neutral-400"
                  }`}
                >
                  {i + 1}
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      i < currentStepIndex ? "bg-spine" : "bg-neutral-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="border border-neutral-200 rounded-lg p-5 mb-4">
          <h2 className="font-medium text-ink mb-3">Items</h2>
          <div className="flex flex-col gap-2">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-neutral-600">
                  {item.name || item.productName}
                  {item.size ? ` (${item.size})` : ""}
                  {item.color ? ` - ${item.color}` : ""} × {item.quantity}
                </span>
                <span className="text-ink">₹{(item.price || 0) * item.quantity}</span>
              </div>
            ))}
          </div>
          {(order.totalAmount ?? order.total) != null && (
            <div className="flex justify-between font-medium pt-3 mt-3 border-t border-neutral-200">
              <span>Total</span>
              <span className="text-brass">₹{order.totalAmount ?? order.total}</span>
            </div>
          )}
        </div>

        {address && (
          <div className="border border-neutral-200 rounded-lg p-5">
            <h2 className="font-medium text-ink mb-2">Shipping Address</h2>
            <p className="text-sm text-neutral-600">
              {address.fullName}
              <br />
              {address.addressLine}, {address.city}, {address.state} - {address.pincode}
              <br />
              Phone: {address.phone}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}