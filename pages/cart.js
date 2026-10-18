import { useRouter } from "next/router";
import { useCart } from "../lib/cart-context";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useShipping } from "../lib/useShipping";

const SPINE = "#1e3d32";

// Money from the server can carry tiny floating-point errors (e.g. 299.99999).
const money = (n) => Math.round(n * 100) / 100;

function CartHeader({ router }) {
  function goBack() {
    // A cart opened straight from a link has no page to go back to.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/products");
    }
  }
  return (
    <header className="flex items-center gap-3 px-4 py-4 max-w-3xl mx-auto">
      <button
        onClick={goBack}
        aria-label="Go back"
        className="flex-shrink-0"
        style={{ color: SPINE }}
      >
        <ArrowLeft size={22} />
      </button>
      <h1 className="font-serif text-lg font-semibold" style={{ color: SPINE }}>
        Your Cart
      </h1>
    </header>
  );
}

// Shown when the saved cart was changed because of stock (items removed or
// quantities reduced).
function CartNotice({ notice, onDismiss }) {
  if (!notice) return null;
  return (
    <div
      role="status"
      className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      <span>{notice}</span>
      <button onClick={onDismiss} className="font-medium underline">
        OK
      </button>
    </div>
  );
}

export default function Cart() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    total,
    keyOf,
    notice,
    dismissNotice,
  } = useCart();
  const { loaded, shippingFor, threshold } = useShipping();
  const shipping = shippingFor(total);
  const grandTotal = money(total + shipping);

  if (items.length === 0) {
    return (
      <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
        <CartHeader router={router} />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <div className="text-left">
            <CartNotice notice={notice} onDismiss={dismissNotice} />
          </div>
          <h1 className="font-serif text-2xl text-ink mb-3">
            Your cart is empty
          </h1>
          <p className="text-neutral-500 mb-6">
            Looks like you haven&apos;t added anything yet.
          </p>
          <Link
            href="/products"
            className="inline-block px-5 py-2 rounded text-white"
            style={{ backgroundColor: SPINE }}
          >
            Browse products
          </Link>
        </main>
      </div>
    );
  }

  // List price total (before discounts), from real per-item prices only.
  const listPrice = (item) =>
    item.originalPrice > item.price ? item.originalPrice : item.price;
  const mrpTotal = money(
    items.reduce((sum, item) => sum + listPrice(item) * item.quantity, 0),
  );
  const totalSavings = money(mrpTotal - total);
  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <CartHeader router={router} />
      <main className="max-w-3xl mx-auto px-4 pb-10">
        <CartNotice notice={notice} onDismiss={dismissNotice} />
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={keyOf(item)}
              className="border-l-4 bg-white p-4 rounded shadow-sm"
              style={{ borderColor: SPINE }}
            >
              {/* Top row: image + full product name/price, no truncation */}
              <div className="flex gap-4">
                <div className="w-16 h-24 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-ink break-words">
                    {item.name}
                  </h3>
                  {(item.size || item.color) && (
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {[item.size, item.color].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-semibold" style={{ color: SPINE }}>
                      ₹{item.price}
                    </p>
                    {item.originalPrice > item.price && (
                      <p className="text-xs text-neutral-400 line-through">
                        ₹{item.originalPrice}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom row: quantity + Remove, no longer competing with the name for space */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateQuantity(keyOf(item), item.quantity - 1)
                    }
                    className="w-7 h-7 border border-neutral-300 rounded text-ink"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(keyOf(item), item.quantity + 1)
                    }
                    disabled={item.quantity >= item.stock}
                    className="w-7 h-7 border border-neutral-300 rounded text-ink disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(keyOf(item))}
                  className="text-sm text-neutral-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-neutral-200 pt-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>Subtotal</span>
            <span>₹{mrpTotal}</span>
          </div>

          {totalSavings > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>−₹{totalSavings}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>Delivery</span>
            {!loaded ? (
              <span className="text-neutral-400">Calculating…</span>
            ) : shipping === 0 ? (
              <span className="text-green-600 font-medium">Free</span>
            ) : (
              <span>₹{shipping}</span>
            )}
          </div>
          {loaded && shipping > 0 && threshold > 0 && (
            <p className="text-xs text-neutral-500">
              Add ₹{money(threshold - total)} more for free delivery.
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
            <span className="font-serif text-xl text-ink">Total</span>
            <span className="font-serif text-xl" style={{ color: SPINE }}>
              ₹{grandTotal}
            </span>
          </div>
        </div>

        <button
          onClick={() => router.push("/checkout")}
          className="mt-6 w-full py-3 rounded text-white font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: SPINE }}
        >
          Proceed to checkout
        </button>
      </main>
    </div>
  );
}
