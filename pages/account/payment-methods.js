import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  ArrowLeft,
  Smartphone,
  CreditCard,
  Building2,
  Banknote,
  Trash2,
  ShieldCheck,
  User,
} from "lucide-react";

const SPINE = "#1e3d32";

// Same storage key/shape used by pages/account/details.js — this page is
// where it actually gets managed. No backend API for payment methods yet
// (nothing in API_REFERENCE.md), so only safe, non-sensitive fields are
// ever kept: a UPI handle, and a card's last 4 digits + detected network.
// Full card numbers, CVV, and UPI PINs are never asked for or stored.
const PAYMENT_STORAGE_KEY = "savedPaymentMethods";

function loadPaymentMethods() {
  try {
    const raw = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { upis: [], cards: [] };
  } catch {
    return { upis: [], cards: [] };
  }
}

function savePaymentMethods(data) {
  window.localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(data));
}

function detectCardType(digits) {
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  if (/^6/.test(digits)) return "RuPay";
  return "Card";
}

function PaymentHeader({ router }) {
  return (
    <header className="flex items-center gap-3 px-4 py-4 max-w-xl mx-auto">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex-shrink-0"
        style={{ color: SPINE }}
      >
        <ArrowLeft size={22} />
      </button>
      <h1 className="font-serif text-lg font-semibold" style={{ color: SPINE }}>
        Payment Methods
      </h1>
    </header>
  );
}

export default function PaymentMethods() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [payments, setPayments] = useState({ upis: [], cards: [] });

  const [showAddUpi, setShowAddUpi] = useState(false);
  const [newUpi, setNewUpi] = useState("");

  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [cardError, setCardError] = useState(null);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (token) setPayments(loadPaymentMethods());
    setChecked(true);
  }, []);

  function addUpi(e) {
    e.preventDefault();
    const handle = newUpi.trim();
    if (!handle || !handle.includes("@")) return;
    const next = {
      ...payments,
      upis: [
        ...payments.upis.map((u) => ({ ...u, isDefault: false })),
        {
          id: Date.now().toString(),
          handle,
          isDefault: payments.upis.length === 0,
        },
      ],
    };
    setPayments(next);
    savePaymentMethods(next);
    setNewUpi("");
    setShowAddUpi(false);
  }

  function removeUpi(id) {
    const next = {
      ...payments,
      upis: payments.upis.filter((u) => u.id !== id),
    };
    setPayments(next);
    savePaymentMethods(next);
  }

  function setDefaultUpi(id) {
    const next = {
      ...payments,
      upis: payments.upis.map((u) => ({ ...u, isDefault: u.id === id })),
    };
    setPayments(next);
    savePaymentMethods(next);
  }

  function addCard(e) {
    e.preventDefault();
    setCardError(null);
    const digits = newCardNumber.replace(/\D/g, "");
    if (digits.length < 12) {
      setCardError("Enter a valid card number.");
      return;
    }
    const last4 = digits.slice(-4);
    const type = detectCardType(digits);
    const next = {
      ...payments,
      cards: [
        ...payments.cards.map((c) => ({ ...c, isDefault: false })),
        {
          id: Date.now().toString(),
          last4,
          type,
          expiry: newCardExpiry.trim(),
          isDefault: payments.cards.length === 0,
        },
      ],
    };
    setPayments(next);
    savePaymentMethods(next);
    // Discard the full number immediately — never held onto beyond this point.
    setNewCardNumber("");
    setNewCardExpiry("");
    setShowAddCard(false);
  }

  function removeCard(id) {
    const next = {
      ...payments,
      cards: payments.cards.filter((c) => c.id !== id),
    };
    setPayments(next);
    savePaymentMethods(next);
  }

  function setDefaultCard(id) {
    const next = {
      ...payments,
      cards: payments.cards.map((c) => ({ ...c, isDefault: c.id === id })),
    };
    setPayments(next);
    savePaymentMethods(next);
  }

  if (!checked) return null;

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
        <PaymentHeader router={router} />
        <main className="max-w-md mx-auto px-6 py-16 text-center">
          <User size={40} className="text-neutral-300 mx-auto mb-3" />
          <h1 className="font-serif text-2xl text-ink mb-2">
            Sign in to manage payment methods
          </h1>
          <Link
            href="/login"
            className="inline-block px-5 py-2 rounded text-white text-sm"
            style={{ backgroundColor: SPINE }}
          >
            Login
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <PaymentHeader router={router} />
      <main className="max-w-xl mx-auto px-4 pb-10">
        {/* UPI */}
        <h2 className="font-medium text-ink mb-3">UPI</h2>
        <div className="flex flex-col gap-2 mb-3">
          {payments.upis.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 border border-neutral-200 rounded-xl bg-white p-3.5"
            >
              <Smartphone
                size={18}
                style={{ color: SPINE }}
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-400 mb-0.5">UPI ID</p>
                <p className="text-sm text-ink truncate">{u.handle}</p>
              </div>
              {u.isDefault ? (
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: SPINE }}
                >
                  Default
                </span>
              ) : (
                <button
                  onClick={() => setDefaultUpi(u.id)}
                  className="text-xs underline flex-shrink-0"
                  style={{ color: SPINE }}
                >
                  Set default
                </button>
              )}
              <button
                onClick={() => removeUpi(u.id)}
                aria-label="Remove UPI ID"
                className="text-red-500 flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {showAddUpi ? (
          <form onSubmit={addUpi} className="flex gap-2 mb-6">
            <input
              type="text"
              autoFocus
              placeholder="e.g. yourname@upi"
              value={newUpi}
              onChange={(e) => setNewUpi(e.target.value)}
              className="flex-1 border border-neutral-300 rounded-lg px-3 py-2.5 text-sm outline-none bg-white"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg text-sm text-white flex-shrink-0"
              style={{ backgroundColor: SPINE }}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddUpi(false);
                setNewUpi("");
              }}
              className="px-4 py-2.5 border border-neutral-300 rounded-lg text-sm flex-shrink-0"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowAddUpi(true)}
            className="w-full border border-dashed rounded-lg py-2.5 text-sm mb-6 hover:bg-white transition-colors"
            style={{ borderColor: SPINE, color: SPINE }}
          >
            + Add UPI ID
          </button>
        )}

        {/* Credit/Debit cards */}
        <h2 className="font-medium text-ink mb-3">Credit / Debit Cards</h2>
        <div className="flex flex-col gap-2 mb-3">
          {payments.cards.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 border border-neutral-200 rounded-xl bg-white p-3.5"
            >
              <CreditCard
                size={18}
                style={{ color: SPINE }}
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink font-medium">
                  {c.type} •••• {c.last4}
                </p>
                {c.expiry && (
                  <p className="text-xs text-neutral-400">Expires {c.expiry}</p>
                )}
              </div>
              {c.isDefault ? (
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: SPINE }}
                >
                  Default
                </span>
              ) : (
                <button
                  onClick={() => setDefaultCard(c.id)}
                  className="text-xs underline flex-shrink-0"
                  style={{ color: SPINE }}
                >
                  Set default
                </button>
              )}
              <button
                onClick={() => removeCard(c.id)}
                aria-label="Remove card"
                className="text-red-500 flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {showAddCard ? (
          <form
            onSubmit={addCard}
            className="flex flex-col gap-2 mb-6 border border-neutral-200 rounded-xl bg-white p-3.5"
          >
            <input
              type="text"
              autoFocus
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="Card number"
              value={newCardNumber}
              onChange={(e) =>
                setNewCardNumber(e.target.value.replace(/[^\d ]/g, ""))
              }
              className="border border-neutral-300 rounded-lg px-3 py-2.5 text-sm outline-none"
            />
            <input
              type="text"
              autoComplete="cc-exp"
              placeholder="Expiry (MM/YY)"
              value={newCardExpiry}
              onChange={(e) => setNewCardExpiry(e.target.value)}
              className="border border-neutral-300 rounded-lg px-3 py-2.5 text-sm outline-none"
            />
            <p className="text-xs text-neutral-400">
              We never ask for or store your CVV. Only the last 4 digits are
              saved.
            </p>
            {cardError && <p className="text-red-600 text-xs">{cardError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg text-sm text-white"
                style={{ backgroundColor: SPINE }}
              >
                Add Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCard(false);
                  setNewCardNumber("");
                  setNewCardExpiry("");
                  setCardError(null);
                }}
                className="flex-1 py-2.5 border border-neutral-300 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddCard(true)}
            className="w-full border border-dashed rounded-lg py-2.5 text-sm mb-6 hover:bg-white transition-colors"
            style={{ borderColor: SPINE, color: SPINE }}
          >
            + Add Card
          </button>
        )}

        {/* Security note */}
        <p className="flex items-start gap-2 text-xs text-neutral-500 bg-white border border-neutral-100 rounded-xl p-3.5 mb-6">
          <ShieldCheck
            size={16}
            style={{ color: SPINE }}
            className="flex-shrink-0 mt-0.5"
          />
          Your payment information is secure. We do not store your card details,
          CVV or UPI PIN.
        </p>

        {/* Net Banking / COD — checkout-only, nothing to save here */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 border border-neutral-200 rounded-xl bg-white p-3.5">
            <Building2 size={18} className="text-neutral-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-ink font-medium">Net Banking</p>
              <p className="text-xs text-neutral-400">Available at checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border border-neutral-200 rounded-xl bg-white p-3.5">
            <Banknote size={18} className="text-neutral-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-ink font-medium">Cash on Delivery</p>
              <p className="text-xs text-neutral-400">Available at checkout</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
