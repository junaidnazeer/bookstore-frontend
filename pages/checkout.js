import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { useCart } from "../lib/cart-context";
import api from "../lib/api";

export default function Checkout() {
  const router = useRouter();
  const { items, total } = useCart();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/orders", {
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          size: i.size || null,
          color: i.color || null,
        })),
        shippingAddress: {
          fullName,
          phone,
          addressLine,
          city,
          state,
          pincode,
        },
      });
      router.push(`/order-confirmation?orderId=${res.data.orderId}`);
    } catch (err) {
      setError("Could not place order. Please try again.");
    } finally {
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

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Placing order..." : `Place order — ₹${total}`}
            </button>
          </form>

          <div>
            <h2 className="font-medium text-ink mb-3">Order summary</h2>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    {item.name}
                    {item.size ? ` (${item.size})` : ""}
                    {item.color ? ` - ${item.color}` : ""} × {item.quantity}
                  </span>
                  <span className="text-ink">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-between font-medium">
              <span>Total</span>
              <span className="text-brass">₹{total}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
