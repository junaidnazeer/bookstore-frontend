import { useState } from "react";
import Link from "next/link";
import MosqueIcon from "../components/MosqueIcon";
import { useCart } from "../lib/cart-context";
import { useWishlist } from "../lib/wishlist-context";
import { Heart, Trash2 } from "lucide-react";

function ProductGridCard({ product }) {
  const { addItem } = useCart();
  const { toggleWishlist } = useWishlist();

  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-3 flex flex-col relative">
      <button
        onClick={() => toggleWishlist(product)}
        className="absolute top-4 right-4 z-10 bg-white/90 rounded-full p-1.5"
        aria-label="Remove from wishlist"
      >
        <Heart size={16} className="fill-red-500 text-red-500" />
      </button>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden mb-3">
          {product.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <h3 className="text-sm font-medium text-ink truncate">
          {product.name}
        </h3>
      </Link>

      <div className="flex items-center gap-2 mt-1">
        <p className="text-spine font-semibold">₹{product.price}</p>
        {/* Only shows once backend actually provides discount data — never faked. */}
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
  );
}

function ClearWishlistDialog({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-lg">
        <h2 className="font-serif text-lg text-ink mb-1">Clear Wishlist?</h2>
        <p className="text-sm text-neutral-500 mb-5">
          Are you sure you want to remove all saved items?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 text-ink text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:opacity-90 transition-opacity"
          >
            Clear Wishlist
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Wishlist() {
  const { items, clearWishlist } = useWishlist();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleClear() {
    clearWishlist();
    setConfirmOpen(false);
  }

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      {/* Header: branding on the left, clear-wishlist trash icon on the right */}
      <header className="flex items-center justify-between px-4 py-4 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <MosqueIcon size={28} className="text-spine flex-shrink-0" />
          <div>
            <div
              className="font-serif text-base sm:text-xl leading-tight"
              style={{ color: "#1e3d32" }}
            >
              Maktabah Islamiyah
            </div>
            <div className="text-[11px] sm:text-xs text-neutral-400">
              Faith · Knowledge · Lifestyle
            </div>
          </div>
        </Link>

        {items.length > 0 && (
          <button
            onClick={() => setConfirmOpen(true)}
            aria-label="Clear wishlist"
            className="text-spine"
          >
            <Trash2 size={22} />
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-8">
        <h1 className="font-serif text-2xl text-ink mb-1">My Wishlist</h1>
        <p className="text-sm text-neutral-500 mb-5">
          {items.length} saved item{items.length === 1 ? "" : "s"}
        </p>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-white border border-neutral-200 flex items-center justify-center mx-auto mb-4">
              <Heart size={28} className="text-neutral-300" />
            </div>
            <h2 className="text-ink font-medium mb-1">
              Your Wishlist is Empty
            </h2>
            <p className="text-neutral-500 text-sm mb-5">
              Save products you love and find them here later.
            </p>
            <Link
              href="/products"
              className="inline-block px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity text-sm"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((product) => (
              <ProductGridCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {confirmOpen && (
        <ClearWishlistDialog
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleClear}
        />
      )}
    </div>
  );
}
