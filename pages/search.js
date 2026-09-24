import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MosqueIcon from "../components/MosqueIcon";
import api from "../lib/api";
import { normalizeProduct } from "../lib/normalizeProduct";
import { useCart } from "../lib/cart-context";
import { useWishlist } from "../lib/wishlist-context";
import {
  Heart,
  Clock,
  Flame,
  X,
  ChevronDown,
  Search as SearchIcon,
  SlidersHorizontal,
} from "lucide-react";

const CATEGORIES = [
  { slug: "books", label: "Books" },
  { slug: "attars", label: "Attars" },
  { slug: "caps", label: "Caps" },
  { slug: "shalwar-kameez", label: "Shalwar Kameez" },
  { slug: "abayas", label: "Abayas" },
  { slug: "jilbabs", label: "Jilbabs" },
  { slug: "prayer-quran-accessories", label: "Prayer & Quran Accessories" },
];

// Curated shortlist for "Popular Searches" — these are app-curated shortcuts
// into existing categories, not user data, so they're fine as a fixed list.
const POPULAR_SEARCHES = ["Books", "Attars", "Caps", "Abayas"];

const PRICE_OPTIONS = [
  { value: "", label: "Any Price" },
  { value: "under-500", label: "Under ₹500" },
  { value: "500-1000", label: "₹500 - ₹1000" },
  { value: "above-1000", label: "Above ₹1000" },
];

// Rating intentionally omitted — no ratings/reviews anywhere in this app.
const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price Low \u2192 High" },
  { value: "newest", label: "Newest" },
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

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="flex-1 min-w-0">
      <label className="block text-[11px] text-neutral-400 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none text-sm border border-neutral-300 rounded-lg pl-3 pr-7 py-2 bg-white text-ink"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400"
        />
      </div>
    </div>
  );
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

export default function SearchPage() {
  const router = useRouter();
  const [submittedTerm, setSubmittedTerm] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const [sort, setSort] = useState("relevance");
  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.q) {
      setInputValue(String(router.query.q));
      runSearch(String(router.query.q));
    } else {
      setInputValue("");
      setSubmittedTerm("");
      setStatus("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.q]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (inputValue.trim()) goToSearch(inputValue.trim());
  }

  function runSearch(rawTerm) {
    const q = rawTerm.trim();
    if (!q) return;

    setSubmittedTerm(q);
    setStatus("loading");

    api
      .get("/products")
      .then((res) => {
        if (!Array.isArray(res.data)) {
          throw new Error("Unexpected response shape from /products");
        }
        setAllProducts(res.data.map(normalizeProduct));
        setStatus("success");
      })
      .catch(() => setStatus("error"));

    setRecentSearches((prev) => {
      const next = [
        q,
        ...prev.filter((t) => t.toLowerCase() !== q.toLowerCase()),
      ].slice(0, MAX_RECENT);
      saveRecentSearches(next);
      return next;
    });
  }

  function goToSearch(q) {
    router.push(`/search?q=${encodeURIComponent(q)}`, undefined, {
      shallow: true,
    });
    runSearch(q);
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

  function clearFilters() {
    setCategory("");
    setPriceRange("");
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

  if (priceRange === "under-500") {
    results = results.filter((p) => p.price < 500);
  } else if (priceRange === "500-1000") {
    results = results.filter((p) => p.price >= 500 && p.price <= 1000);
  } else if (priceRange === "above-1000") {
    results = results.filter((p) => p.price > 1000);
  }

  results = [...results].sort((a, b) => {
    if (sort === "price-low") return a.price - b.price;
    if (sort === "newest")
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return 0;
  });

  const hasActiveFilters = category || priceRange;

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      {/* Branding-only header — no cart, no login/logout, matching the
          reference (Search is a bottom-tab page, not a drill-down page). */}
      <header className="px-4 py-4 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mb-4 w-fit">
          <MosqueIcon
            size={28}
            style={{ color: "#1e3d32" }}
            className="flex-shrink-0"
          />
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

        <form onSubmit={handleSearchSubmit}>
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-full pl-4 pr-2 py-2.5 shadow-sm">
            <SearchIcon size={18} className="text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search books, attars, clothing..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 min-w-0 text-sm outline-none bg-transparent"
            />
            <button
              type="submit"
              className="text-neutral-400 flex-shrink-0 p-1"
              aria-label="Search"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </form>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-8 pt-2">
        {!submittedTerm && (
          <>
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-ink flex items-center gap-1.5">
                    <Clock size={15} className="text-spine" /> Recent Searches
                  </p>
                  <button
                    onClick={clearRecent}
                    className="text-xs text-spine underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((t) => (
                    <div
                      key={t}
                      className="flex items-center gap-1 border border-neutral-300 rounded-full pl-3 pr-2 py-1.5 text-sm text-ink bg-white"
                    >
                      <Clock size={12} className="text-neutral-400 mr-0.5" />
                      <button onClick={() => goToSearch(t)}>{t}</button>
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

            <div className="mb-6">
              <p className="text-sm font-medium text-ink mb-2 flex items-center gap-1.5">
                <Flame size={15} className="text-spine" /> Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => goToSearch(term)}
                    className="px-3.5 py-1.5 rounded-full text-sm border border-neutral-300 bg-white text-ink hover:border-spine hover:text-spine transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-ink mb-2">
                Browse Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => goToSearch(c.label)}
                    className="px-3 py-1.5 rounded-full text-sm border border-neutral-300 bg-white text-ink hover:border-spine hover:text-spine transition-colors"
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
            {/* Filters */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-ink">Filters</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-spine underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <FilterSelect
                  label="Category"
                  value={category}
                  onChange={setCategory}
                  options={[
                    { value: "", label: "All Categories" },
                    ...CATEGORIES.map((c) => ({
                      value: c.slug,
                      label: c.label,
                    })),
                  ]}
                />
                <FilterSelect
                  label="Price"
                  value={priceRange}
                  onChange={setPriceRange}
                  options={PRICE_OPTIONS}
                />
              </div>
            </div>

            {/* Sort By */}
            <div className="mb-5">
              <p className="text-sm font-medium text-ink mb-2">Sort By</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSort(s.value)}
                    className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                      sort === s.value
                        ? "bg-spine text-white border-spine"
                        : "border-neutral-300 text-ink bg-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-ink">
                {status === "success" &&
                  `Search Results (${results.length} product${
                    results.length === 1 ? "" : "s"
                  })`}
                {status === "loading" && "Searching..."}
              </p>
            </div>

            {status === "loading" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-neutral-200 rounded-lg bg-white p-3 animate-pulse"
                  >
                    <div className="aspect-square bg-neutral-200 rounded-lg mb-3" />
                    <div className="h-3.5 bg-neutral-200 rounded w-4/5 mb-2" />
                    <div className="h-3.5 bg-neutral-200 rounded w-1/3 mb-3" />
                    <div className="h-8 bg-neutral-200 rounded" />
                  </div>
                ))}
              </div>
            )}

            {status === "error" && (
              <div className="text-center py-12">
                <p className="text-red-600 mb-3">
                  Something went wrong running this search.
                </p>
                <button
                  onClick={() => runSearch(submittedTerm)}
                  className="px-4 py-2 bg-spine text-white rounded text-sm hover:opacity-90 transition-opacity"
                >
                  Retry
                </button>
              </div>
            )}

            {status === "success" && results.length === 0 && (
              <div className="text-center py-12">
                <p className="text-neutral-500 mb-1">
                  No products found for "{submittedTerm}".
                </p>
                <p className="text-neutral-400 text-sm">
                  Try a different search term or clear your filters.
                </p>
              </div>
            )}

            {status === "success" && results.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {results.map((product) => (
                  <ProductGridCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
