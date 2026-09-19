import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import api from "../../lib/api";
import { normalizeProduct } from "../../lib/normalizeProduct";
import { useCart } from "../../lib/cart-context";
import { useWishlist } from "../../lib/wishlist-context";
import { Heart, Minus, Plus } from "lucide-react";

const DISPLAY_ATTRIBUTES = {
  books: ["author", "language"],
  attars: ["volume", "scent"],
  "shalwar-kameez": ["fabric"],
  abayas: ["fabric"],
  jilbabs: ["fabric"],
  caps: ["fabric"],
};

function RelatedProductCard({ product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="border border-neutral-200 rounded-lg bg-white p-3 block"
    >
      <div className="aspect-square bg-neutral-100 rounded overflow-hidden mb-2">
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <p className="text-sm font-medium text-ink truncate">{product.name}</p>
      <p className="text-brass font-semibold text-sm">₹{product.price}</p>
    </Link>
  );
}

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    if (!id) return;
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(normalizeProduct(res.data)))
      .catch(() => setProduct(null));
  }, [id]);

  useEffect(() => {
    if (!product?.category) return;
    api
      .get(`/products?category=${product.category}`)
      .then((res) => {
        const others = res.data
          .map(normalizeProduct)
          .filter((p) => p.id !== product.id)
          .slice(0, 4);
        setRelatedProducts(others);
      })
      .catch(() => setRelatedProducts([]));
  }, [product]);

  function handleAddToCart() {
    addItem({ ...product, size: selectedSize, color: selectedColor, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (!product) {
    return (
      <div>
        <Navbar />
        <p className="max-w-3xl mx-auto px-4 py-10 text-neutral-500">
          Loading...
        </p>
      </div>
    );
  }

  const needsVariants =
    (product.sizes && product.sizes.length > 0) ||
    (product.colors && product.colors.length > 0);
  const attributeKeys = DISPLAY_ATTRIBUTES[product.category] || [];
  const attributes = product.attributes || {};
  const wishlisted = isWishlisted(product.id);
  const inStock = product.stock > 0;

  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
              {product.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <button
              onClick={() => toggleWishlist(product)}
              className="absolute top-3 right-3 bg-white/90 rounded-full p-2"
              aria-label="Toggle wishlist"
            >
              <Heart
                size={18}
                className={
                  wishlisted ? "fill-red-500 text-red-500" : "text-neutral-400"
                }
              />
            </button>
          </div>

          <div>
            <h1 className="font-serif text-2xl text-ink">{product.name}</h1>
            <p className="text-xs text-neutral-400 capitalize mt-1">
              {product.categoryName}
            </p>

            {attributeKeys.map((key) =>
              attributes[key] ? (
                <p key={key} className="text-sm text-neutral-500 mt-1">
                  <span className="capitalize">{key}</span>: {attributes[key]}
                </p>
              ) : null,
            )}

            <div className="flex items-center gap-2 mt-3">
              <p className="text-2xl font-semibold text-brass">
                ₹{product.price}
              </p>
              {product.originalPrice && (
                <>
                  <p className="text-sm text-neutral-400 line-through">
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

            <p
              className={`text-sm mt-2 ${inStock ? "text-green-600" : "text-red-600"}`}
            >
              {inStock
                ? `In stock (${product.stock} available)`
                : "Out of stock"}
            </p>

            <p className="mt-4 text-neutral-600 text-sm">
              {product.description}
            </p>

            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-neutral-500 mb-1">Size</p>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 rounded border text-sm ${
                        selectedSize === size
                          ? "bg-spine text-white border-spine"
                          : "border-neutral-300 text-ink"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-neutral-500 mb-1">Color</p>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 rounded border text-sm ${
                        selectedColor === color
                          ? "bg-spine text-white border-spine"
                          : "border-neutral-300 text-ink"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mt-4">
              <p className="text-sm text-neutral-500">Quantity</p>
              <div className="flex items-center border border-neutral-300 rounded">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2"
                >
                  <Minus size={14} />
                </button>
                <span className="px-3 text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-2"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={
                !inStock ||
                (needsVariants &&
                  ((product.sizes?.length > 0 && !selectedSize) ||
                    (product.colors?.length > 0 && !selectedColor)))
              }
              className="mt-6 w-full px-5 py-2.5 bg-spine text-white rounded hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {!inStock ? "Out of Stock" : added ? "Added ✓" : "Add to Cart"}
            </button>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-10">
            <h2 className="font-serif text-lg text-ink mb-3">
              Related Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedProducts.map((p) => (
                <RelatedProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
