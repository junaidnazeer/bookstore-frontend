import Link from "next/link";
import Navbar from "../components/Navbar";
import { useCart } from "../lib/cart-context";
import { useWishlist } from "../lib/wishlist-context";
import { Heart, HeartOff } from "lucide-react";

export default function Wishlist() {
  const { addItem } = useCart();
  const { items, toggleWishlist } = useWishlist();

  return (
    <div>
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="font-serif text-2xl text-ink mb-6">Your Wishlist</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={40} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-400 mb-4">
              You haven't added anything to your wishlist yet.
            </p>
            <Link
              href="/products"
              className="inline-block px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((product) => (
              <div
                key={product.id}
                className="border border-neutral-200 rounded-lg bg-white p-3 flex flex-col relative"
              >
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-4 right-4 z-10 bg-white/90 rounded-full p-1.5"
                  aria-label="Remove from wishlist"
                >
                  <HeartOff size={16} className="text-red-500" />
                </button>
                <Link href={`/products/${product.id}`}>
                  <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-ink truncate">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-brass font-semibold">₹{product.price}</p>
                  {product.originalPrice && (
                    <>
                      <p className="text-xs text-neutral-400 line-through">
                        ₹{product.originalPrice}
                      </p>
                      {product.discountPercent && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          {product.discountPercent}% OFF
                        </span>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={() => addItem(product)}
                  className="mt-2 px-3 py-1.5 bg-spine text-white text-sm rounded hover:opacity-90 transition-opacity"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
