import Link from "next/link";

// Works for any category: books show author, clothing shows size range.
export default function ProductCard({ product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="block border-l-4 border-spine bg-white p-3 rounded shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-neutral-100 mb-3 rounded overflow-hidden">
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <h3 className="font-medium text-ink">{product.name}</h3>

      {product.category === "books" && product.author && (
        <p className="text-sm text-neutral-500">{product.author}</p>
      )}

      {product.sizes && product.sizes.length > 0 && (
        <p className="text-xs text-neutral-400 mt-0.5">
          Sizes: {product.sizes.join(", ")}
        </p>
      )}

      <p className="mt-1 font-semibold text-brass">₹{product.price}</p>
    </Link>
  );
}
