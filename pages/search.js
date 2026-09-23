import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { normalizeProduct } from "../lib/normalizeProduct";
import { useCart } from "../lib/cart-context";
import { useWishlist } from "../lib/wishlist-context";
import { Heart, Search as SearchIcon, X, Clock } from "lucide-react";

const CATEGORIES = [
  { slug: "books", label: "Books" },
  { slug: "attars", label: "Attars" },
  { slug: "caps", label: "Caps" },
  { slug: "shalwar-kameez", label: "Shalwar Kameez" },
  { slug: "abayas", label: "Abayas" },
  { slug: "jilbabs", label: "Jilbabs" },
  { slug: "prayer-quran-accessories", label: "Prayer & Quran Accessories" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
];

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT = 8;

function loadRecentSearches() {
  try {
    const saved = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(terms) {
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(terms));
}

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

      <a href={`/products/${product.slug}`} className="block">
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

export default function SearchPage() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [submittedTerm, setSubmittedTerm] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("relevance");
  const [category, setCategory] = useState("");

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    if (router.query.q) {
      const q = String(router.query.q);
      setTerm(q);
      runSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.q]);

  function runSearch(rawTerm) {
    const q = rawTerm.trim();
    if (!q) return;

    setSubmittedTerm(q);
    setLoading(true);

    api
      .get("/products")
      .then((res) => {
        setAllProducts(res.data.map(normalizeProduct));
      })
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));

    setRecentSearches((prev) => {
      const next = [
        q,
        ...prev.filter((t) => t.toLowerCase() !== q.toLowerCase()),
      ].slice(0, MAX_RECENT);
      saveRecentSearches(next);
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(term)}`, undefined, {
      shallow: true,
    });
    runSearch(term);
  }

  function clearRecent() {
    setRecentSearches([]);
    saveRecentSearches([]);
  }

  function removeRecent(t) {
    setRecentSearches((prev) => {
      const next = prev.filter((x) => x !== t);
      saveRecentSearches(next);
      return next;
    });
  }

  function matchesSearch(product, rawTerm) {
    const normalized = rawTerm.toLowerCase().trim();
    const singular = normalized.endsWith("s")
      ? normalized.slice(0, -1)
      : normalized;
    const haystack =
      `${product.name} ${product.categoryName || ""}`.toLowerCase();
    return haystack.includes(normalized) || haystack.includes(singular);
  }

  let results = submittedTerm
    ? allProducts.filter((p) => matchesSearch(p, submittedTerm))
    : [];

  if (category) {
    results = results.filter((p) => p.category === category);
  }

  results = [...results].sort((a, b) => {
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
        <form
          onSubmit={handleSubmit}
          className="flex items-center border border-neutral-300 rounded-lg px-3 bg-white mb-6"
        >
          <SearchIcon size={18} className="text-neutral-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search books, attars, clothing..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="flex-1 min-w-0 px-2 py-2.5 outline-none text-sm"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              className="text-neutral-400"
              aria-label="Clear search input"
            >
              <X size={16} />
            </button>
          )}
        </form>

        {!submittedTerm && (
          <>
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-ink flex items-center gap-1">
                    <Clock size={14} /> Recent Searches
                  </p>
                  <button
                    onClick={clearRecent}
                    className="text-xs text-spine underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((t) => (
                    <div
                      key={t}
                      className="flex items-center gap-1 border border-neutral-300 rounded-full pl-3 pr-2 py-1 text-sm text-ink"
                    >
                      <button
                        onClick={() => {
                          setTerm(t);
                          router.push(
                            `/search?q=${encodeURIComponent(t)}`,
                            undefined,
                            {
                              shallow: true,
                            },
                          );
                          runSearch(t);
                        }}
                      >
                        {t}
                      </button>
                      <button
                        onClick={() => removeRecent(t)}
                        aria-label={`Remove ${t} from recent searches`}
                        className="text-neutral-400 hover:text-ink"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-ink mb-2">
                Browse Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => {
                      setTerm(c.label);
                      router.push(
                        `/search?q=${encodeURIComponent(c.label)}`,
                        undefined,
                        {
                          shallow: true,
                        },
                      );
                      runSearch(c.label);
                    }}
                    className="px-3 py-1.5 rounded-full text-sm border border-neutral-300 text-ink hover:border-spine hover:text-spine transition-colors"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {submittedTerm && (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-sm text-neutral-500">
                {loading
                  ? "Searching..."
                  : `${results.length} result${results.length === 1 ? "" : "s"} for "${submittedTerm}"`}
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-sm border border-neutral-300 rounded px-2 py-1.5"
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
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
            </div>

            {!loading && results.length === 0 && (
              <p className="text-neutral-500">
                No products found for "{submittedTerm}". Try a different search
                term.
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {results.map((product) => (
                <ProductGridCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
