import Navbar from "../components/Navbar";
import { useCart } from "../lib/cart-context";
import Link from "next/link";

export default function Cart() {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div>
        <Navbar />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="font-serif text-2xl text-ink mb-3">
            Your cart is empty
          </h1>
          <p className="text-neutral-500 mb-6">
            Looks like you haven't added any books yet.
          </p>
          <Link
            href="/books"
            className="inline-block px-5 py-2 bg-spine text-white rounded"
          >
            Browse books
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-serif text-2xl text-ink mb-6">Your cart</h1>

        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 border-l-4 border-spine bg-white p-4 rounded shadow-sm"
            >
              <div className="w-16 h-24 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                {item.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.coverUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-medium text-ink">{item.title}</h3>
                <p className="text-sm text-neutral-500">{item.author}</p>
                <p className="text-brass font-semibold mt-1">₹{item.price}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 border border-neutral-300 rounded text-ink"
                >
                  −
                </button>
                <span className="w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 border border-neutral-300 rounded text-ink"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="text-sm text-neutral-400 hover:text-red-600 ml-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-4">
          <span className="font-serif text-xl text-ink">Total</span>
          <span className="font-serif text-xl text-brass">₹{total}</span>
        </div>

        <button className="mt-6 w-full py-3 bg-spine text-white rounded font-medium hover:opacity-90 transition-opacity">
          Proceed to checkout
        </button>
      </main>
    </div>
  );
}
