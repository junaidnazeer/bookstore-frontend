import { useRouter } from "next/router";
import { useCart } from "../lib/cart-context";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SPINE = "#1e3d32";

function CartHeader({ router }) {
  return (
    <header className="flex items-center gap-3 px-4 py-4 max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
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

export default function Cart() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, total, keyOf } = useCart();

  if (items.length === 0) {
    return (
      <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
        <CartHeader router={router} />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="font-serif text-2xl text-ink mb-3">
            Your cart is empty
          </h1>
          <p className="text-neutral-500 mb-6">
            Looks like you haven't added anything yet.
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

  // Only computed from real per-item discount data — never fabricated.
  // If a product has no originalPrice, it contributes nothing here.
  const totalSavings = items.reduce((sum, item) => {
    if (!item.originalPrice) return sum;
    return sum + (item.originalPrice - item.price) * item.quantity;
  }, 0);

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <CartHeader router={router} />
      <main className="max-w-3xl mx-auto px-4 pb-10">
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={`${item.id}-${item.size || ""}-${item.color || ""}`}
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
                    {item.originalPrice && (
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
            <span>₹{total}</span>
          </div>

          {totalSavings > 0 && (
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>You saved</span>
              <span>−₹{totalSavings}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>Delivery</span>
            <span className="text-green-600 font-medium">Free</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
            <span className="font-serif text-xl text-ink">Total</span>
            <span className="font-serif text-xl" style={{ color: SPINE }}>
              ₹{total}
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
