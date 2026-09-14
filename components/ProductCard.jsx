import Link from "next/link";

// Real, safely-licensed stock photos, used as a fallback when a product
// has no real photo yet. Keep this in sync with pages/index.js.
const CATEGORY_IMAGE_URLS = {
  books: "https://images.pexels.com/photos/31679271/pexels-photo-31679271.jpeg",
  attars: "https://images.unsplash.com/photo-1612784642053-15614e602ed7",
  caps: "https://images.pexels.com/photos/3068176/pexels-photo-3068176.jpeg",
  "shalwar-kameez":
    "https://images.pexels.com/photos/8692253/pexels-photo-8692253.jpeg",
  abayas:
    "https://images.pexels.com/photos/32279501/pexels-photo-32279501.jpeg",
  jilbabs:
    "https://images.pexels.com/photos/20841544/pexels-photo-20841544.jpeg",
  "prayer-quran-accessories":
    "https://images.pexels.com/photos/11663268/pexels-photo-11663268.jpeg",
};

// Works for any category: books show author, clothing shows sizes.
export default function ProductCard({ product }) {
  const attributes = product.attributes || {};
  const sizes = attributes.sizes_available || [];

  return (
    <Link
      href={`/products/${product.id}`}
      className="block border-l-4 border-spine bg-white p-3 rounded shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-neutral-100 mb-3 rounded overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || CATEGORY_IMAGE_URLS[product.category]}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <h3 className="font-medium text-ink">{product.name}</h3>

      {product.category === "books" && attributes.author && (
        <p className="text-sm text-neutral-500">{attributes.author}</p>
      )}

      {sizes.length > 0 && (
        <p className="text-xs text-neutral-400 mt-0.5">
          Sizes: {sizes.join(", ")}
        </p>
      )}

      <p className="mt-1 font-semibold text-brass">₹{product.price}</p>
    </Link>
  );
}
