import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { useCart } from "../lib/cart-context";
import api from "../lib/api";
import { MapPin, Plus, Pencil } from "lucide-react";

const EMPTY_FORM = {
  label: "Home",
  fullName: "",
  phone: "",
  street: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
};

function extractErrorMessage(err, fallback) {
  if (err.response) return err.response.data?.error || fallback;
  if (err.request) return "Could not reach the server. Please try again.";
  return fallback;
}

// Turns a saved address record into the single string the backend expects
// for shippingAddress — same format used everywhere else in the app.
function formatAddress(addr) {
  return `${addr.fullName}, ${addr.street}${addr.area ? ", " + addr.area : ""}, ${addr.city}, ${addr.state} - ${addr.pincode}, Phone: ${addr.phone}`;
}

export default function Checkout() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();

  const [checkedAuth, setCheckedAuth] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.replace("/login?redirect=" + encodeURIComponent("/checkout"));
      return;
    }
    setCheckedAuth(true);
  }, [router]);

  function loadAddresses(preferId) {
    setAddressesLoading(true);
    api
      .get("/addresses")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setAddresses(list);
        const preferred = preferId && list.find((a) => a.id === preferId);
        const fallback = list.find((a) => a.isDefault) || list[0];
        setSelectedAddressId((preferred || fallback)?.id || null);
        // No saved addresses at all — open the form immediately so a
        // first-time buyer isn't stuck with nothing to select.
        if (list.length === 0) setShowForm(true);
      })
      .catch((err) => {
        setError(extractErrorMessage(err, "Could not load your addresses."));
      })
      .finally(() => setAddressesLoading(false));
  }

  useEffect(() => {
    if (checkedAuth) loadAddresses();
  }, [checkedAuth]);

  // Only computed from real per-item discount data — never fabricated.
  const totalSavings = items.reduce((sum, item) => {
    if (!item.originalPrice) return sum;
    return sum + (item.originalPrice - item.price) * item.quantity;
  }, 0);

  const cartItems = items.map((i) => ({
    productId: i.id,
    quantity: i.quantity,
    variantInfo: {
      size: i.size || null,
      color: i.color || null,
    },
  }));

  function openAddForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(addr) {
    setForm({ ...addr });
    setEditingId(addr.id);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSaveAddress(e) {
    e.preventDefault();
    setFormError(null);
    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.street.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim()
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setFormError("Enter a valid 10-digit phone number.");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setFormError("Enter a valid 6-digit PIN code.");
      return;
    }

    const body = {
      label: form.label,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      street: form.street.trim(),
      area: form.area.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
    };

    setSavingAddress(true);
    try {
      let savedId = editingId;
      if (editingId) {
        await api.put(`/addresses/${editingId}`, body);
      } else {
        const res = await api.post("/addresses", body);
        savedId = res.data?.id;
      }
      setShowForm(false);
      loadAddresses(savedId);
    } catch (err) {
      setFormError(extractErrorMessage(err, "Could not save this address."));
    } finally {
      setSavingAddress(false);
    }
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    setError(null);

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddress) {
      setError("Please select or add a delivery address.");
      return;
    }
    const shippingAddress = formatAddress(selectedAddress);

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
          name: selectedAddress.fullName,
          contact: selectedAddress.phone,
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

  if (!checkedAuth) return null;

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
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-medium text-ink">Delivery address</h2>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="text-sm text-spine flex items-center gap-1"
                >
                  <Plus size={14} /> Add New
                </button>
              )}
            </div>

            {addressesLoading && (
              <p className="text-sm text-neutral-400">Loading addresses...</p>
            )}

            {!addressesLoading && addresses.length > 0 && (
              <div className="flex flex-col gap-2 mb-2">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer ${
                      selectedAddressId === addr.id
                        ? "border-spine bg-spine/5"
                        : "border-neutral-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={14}
                          className="text-spine flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-ink">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="text-xs bg-spine/10 text-spine px-1.5 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-ink mt-0.5">{addr.fullName}</p>
                      <p className="text-xs text-neutral-500">
                        {addr.street}, {addr.area ? `${addr.area}, ` : ""}
                        {addr.city}, {addr.state} – {addr.pincode}
                      </p>
                      <p className="text-xs text-neutral-500">
                        +91 {addr.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditForm(addr)}
                      className="text-neutral-400 hover:text-spine flex-shrink-0"
                      aria-label="Edit address"
                    >
                      <Pencil size={14} />
                    </button>
                  </label>
                ))}
              </div>
            )}

            {!addressesLoading && addresses.length === 0 && !showForm && (
              <button
                type="button"
                onClick={openAddForm}
                className="border border-dashed border-neutral-300 rounded-lg py-3 text-sm text-spine hover:bg-neutral-50 transition-colors"
              >
                + Add Delivery Address
              </button>
            )}

            {showForm && (
              <div className="border border-neutral-200 rounded-lg p-3 flex flex-col gap-2 mb-2">
                <p className="text-sm font-medium text-ink mb-1">
                  {editingId ? "Edit address" : "Add new address"}
                </p>

                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, label }))}
                      className={`flex-1 py-1.5 rounded text-xs border ${
                        form.label === label
                          ? "bg-spine text-white border-spine"
                          : "border-neutral-300 text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Full name"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  className="border border-neutral-300 rounded px-3 py-2 text-sm"
                />
                <div className="flex border border-neutral-300 rounded overflow-hidden">
                  <span className="px-3 py-2 bg-neutral-50 text-neutral-500 border-r border-neutral-300 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        phone: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    className="flex-1 px-3 py-2 outline-none text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="House / Building / Street"
                  value={form.street}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, street: e.target.value }))
                  }
                  className="border border-neutral-300 rounded px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Area / Locality (optional)"
                  value={form.area}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, area: e.target.value }))
                  }
                  className="border border-neutral-300 rounded px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    className="border border-neutral-300 rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={form.state}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, state: e.target.value }))
                    }
                    className="border border-neutral-300 rounded px-3 py-2 text-sm"
                  />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="PIN code"
                  value={form.pincode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pincode: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  className="border border-neutral-300 rounded px-3 py-2 text-sm"
                />

                {formError && (
                  <p className="text-red-600 text-sm">{formError}</p>
                )}

                <div className="flex gap-2 justify-end mt-1">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-3 py-1.5 text-sm rounded border border-neutral-300"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    disabled={savingAddress}
                    className="px-3 py-1.5 text-sm rounded bg-spine text-white disabled:opacity-50"
                  >
                    {savingAddress ? "Saving..." : "Save Address"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-2 border border-neutral-200 rounded px-3 py-2 bg-neutral-50">
              <p className="text-sm font-medium text-ink">Payment method</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Secure payment via Razorpay — card, UPI, netbanking & wallets.
              </p>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || addressesLoading || !selectedAddressId}
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
