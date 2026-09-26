import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { useCart } from "../lib/cart-context";
import api from "../lib/api";

export default function Checkout() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Only computed from real per-item discount data — never fabricated.
  const totalSavings = items.reduce((sum, item) => {
    if (!item.originalPrice) return sum;
    return sum + (item.originalPrice - item.price) * item.quantity;
  }, 0);

  // Backend expects the shipping address as a single formatted string, not an object.
  const shippingAddress = `${fullName}, ${addressLine}, ${city}, ${state} - ${pincode}, Phone: ${phone}`;

  const cartItems = items.map((i) => ({
    productId: i.id,
    quantity: i.quantity,
    variantInfo: {
      size: i.size || null,
      color: i.color || null,
    },
  }));
  async function handlePlaceOrder(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay hasn't loaded yet. Please try again in a moment.",
        );
      }

      const { data } = await api.post("/checkout/create-order", {
        items: cartItems,
      });

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "Maktabah Islamiyah",
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          try {
            const result = await api.post("/checkout/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items: cartItems,
              shippingAddress,
            });
            clearCart();
            router.push(`/order-confirmation?orderId=${result.data.id}`);
          } catch (err) {
            setError(
              "Payment succeeded but we couldn't confirm your order. Please contact support.",
            );
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        prefill: {
          name: fullName,
          contact: phone,
        },
        theme: { color: "#1E3D32" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setLoading(false);
      });
      razorpay.open();
    } catch (err) {
      if (err.response) {
        setError(
          err.response.data?.error ||
            `Checkout failed (${err.response.status}). Is the backend's /checkout/create-order endpoint ready?`,
        );
      } else if (err.request) {
        setError(
          "Could not reach the server. Is the backend running and NEXT_PUBLIC_API_URL correct?",
        );
      } else {
        setError("Checkout error: " + err.message);
      }
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <Navbar />
        <main className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h1 className="font-serif text-2xl text-ink mb-3">
            Your cart is empty
          </h1>
          <p className="text-neutral-500">Add something to your cart first.</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-serif text-2xl text-ink mb-6">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <form onSubmit={handlePlaceOrder} className="flex flex-col gap-3">
            <h2 className="font-medium text-ink mb-1">Shipping address</h2>

            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2"
              required
            />

            <div className="flex border border-neutral-300 rounded overflow-hidden">
              <span className="px-3 py-2 bg-neutral-50 text-neutral-500 border-r border-neutral-300">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="flex-1 px-3 py-2 outline-none"
                required
              />
            </div>

            <input
              type="text"
              placeholder="Address line"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border border-neutral-300 rounded px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="border border-neutral-300 rounded px-3 py-2"
                required
              />
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              className="border border-neutral-300 rounded px-3 py-2"
              required
            />

            <div className="mt-2 border border-neutral-200 rounded px-3 py-2 bg-neutral-50">
              <p className="text-sm font-medium text-ink">Payment method</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Secure payment via Razorpay — card, UPI, netbanking & wallets.
              </p>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Processing..." : `Place order — ₹${total}`}
            </button>
          </form>

          <div>
            <h2 className="font-medium text-ink mb-3">Order summary</h2>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="text-neutral-600 min-w-0 truncate">
                    {item.name}
                    {item.size ? ` (${item.size})` : ""}
                    {item.color ? ` - ${item.color}` : ""} × {item.quantity}
                  </span>
                  <span className="text-ink flex-shrink-0">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-200 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>−₹{totalSavings}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t border-neutral-200">
                <span>Total</span>
                <span className="text-brass">₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
