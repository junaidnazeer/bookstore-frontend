import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import api from "../../lib/api";
import { normalizeProduct } from "../../lib/normalizeProduct";
import { useCart } from "../../lib/cart-context";
import { useWishlist } from "../../lib/wishlist-context";
import { Heart, Search } from "lucide-react";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "books", label: "Books" },
  { value: "attars", label: "Attars" },
  { value: "caps", label: "Caps" },
  { value: "shalwar-kameez", label: "Shalwar Kameez" },
  { value: "abayas", label: "Abayas" },
  { value: "jilbabs", label: "Jilbabs" },
  { value: "prayer-quran-accessories", label: "Prayer & Quran Accessories" },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
];

function ProductGridCard({ product }) {
  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-3 flex flex-col relative">
      <button
        onClick={() => toggleWishlist(product)}
        className="absolute top-4 right-4 z-10 bg-white/90 rounded-full p-1.5"
        aria-label="Toggle wishlist"
      >
        <Heart
          size={16}
          className={
            wishlisted ? "fill-red-500 text-red-500" : "text-neutral-400"
          }
        />
      </button>

      <a href={`/products/${product.id}`} className="block">
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
      </a>

      <div className="flex items-center gap-2 mt-1">
        <p className="text-brass font-semibold">₹{product.price}</p>
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

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    if (router.query.category) setCategory(router.query.category);
    if (router.query.search) setSearchTerm(router.query.search);
  }, [router.query.category, router.query.search]);

  useEffect(() => {
    setLoading(true);
    const query = category ? `?category=${category}` : "";
    api
      .get(`/products${query}`)
      .then((res) => setProducts(res.data.map(normalizeProduct)))
      .catch(() => setError("Could not load products. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [category]);

  function matchesSearch(product, term) {
    const normalized = term.toLowerCase().trim();
    const singular = normalized.endsWith("s")
      ? normalized.slice(0, -1)
      : normalized;
    const haystack =
      `${product.name} ${product.categoryName || ""}`.toLowerCase();
    return haystack.includes(normalized) || haystack.includes(singular);
  }

  let visibleProducts = searchTerm
    ? products.filter((p) => matchesSearch(p, searchTerm))
    : products;

  // Book subcategory chips only appear if at least one product actually has one.
  const availableSubcategories =
    category === "books"
      ? [...new Set(products.map((p) => p.subcategory).filter(Boolean))]
      : [];

  if (subcategory) {
    visibleProducts = visibleProducts.filter(
      (p) => p.subcategory === subcategory,
    );
  }

  visibleProducts = [...visibleProducts].sort((a, b) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "newest")
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return 0;
  });

  return (
    <div>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="font-serif text-xl text-ink mb-2">Browse products</h1>
        {searchTerm && (
          <p className="text-sm text-neutral-500 mb-4">
            Showing results for "{searchTerm}"{" "}
            <button
              onClick={() => {
                setSearchTerm("");
                router.push("/products");
              }}
              className="text-spine underline ml-1"
            >
              Clear
            </button>
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setCategory(c.value);
                setSubcategory("");
              }}
              className={`px-3 py-1 rounded-full text-sm border ${
                category === c.value
                  ? "bg-spine text-white border-spine"
                  : "border-neutral-300 text-ink"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {availableSubcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSubcategory("")}
              className={`px-3 py-1 rounded-full text-xs border ${
                subcategory === ""
                  ? "bg-brass text-white border-brass"
                  : "border-neutral-300 text-neutral-500"
              }`}
            >
              All
            </button>
            {availableSubcategories.map((sc) => (
              <button
                key={sc}
                onClick={() => setSubcategory(sc)}
                className={`px-3 py-1 rounded-full text-xs border ${
                  subcategory === sc
                    ? "bg-brass text-white border-brass"
                    : "border-neutral-300 text-neutral-500"
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-500">
            {visibleProducts.length} product
            {visibleProducts.length === 1 ? "" : "s"}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border border-neutral-300 rounded px-2 py-1.5"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-neutral-500">Loading products...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && visibleProducts.length === 0 && (
          <p className="text-neutral-500">No products found.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visibleProducts.map((product) => (
            <ProductGridCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  );
}
