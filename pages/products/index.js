import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import api from "../../lib/api";
import { normalizeProduct } from "../../lib/normalizeProduct";
import { useCart } from "../../lib/cart-context";
import { useWishlist } from "../../lib/wishlist-context";
import { ArrowLeft, Search as SearchIcon, Heart } from "lucide-react";

// One entry per category — drives the banner title/tagline/image below.
// Add a category here and it gets full support automatically; nothing is
// hardcoded to Books.
const CATEGORY_INFO = {
  "": {
    title: "All Products",
    tagline: "Browse our full collection of authentic Islamic products.",
    image:
      "https://images.pexels.com/photos/37697015/pexels-photo-37697015.jpeg",
  },
  books: {
    title: "Books",
    tagline: "Knowledge is the light of the heart.",
    image:
      "https://images.pexels.com/photos/31679271/pexels-photo-31679271.jpeg",
  },
  attars: {
    title: "Attars",
    tagline: "Fragrance rooted in tradition and purity.",
    image: "https://images.unsplash.com/photo-1612784642053-15614e602ed7",
  },
  caps: {
    title: "Caps",
    tagline: "Simple, dignified, and made for daily prayer.",
    image: "https://images.pexels.com/photos/3068176/pexels-photo-3068176.jpeg",
  },
  "shalwar-kameez": {
    title: "Shalwar Kameez",
    tagline: "Modest comfort, timeless style.",
    image: "https://images.pexels.com/photos/8692253/pexels-photo-8692253.jpeg",
  },
  abayas: {
    title: "Abayas",
    tagline: "Elegant modesty for every occasion.",
    image:
      "https://images.pexels.com/photos/32279501/pexels-photo-32279501.jpeg",
  },
  jilbabs: {
    title: "Jilbabs",
    tagline: "Graceful covering, gentle on the soul.",
    image:
      "https://images.pexels.com/photos/20841544/pexels-photo-20841544.jpeg",
  },
  "prayer-quran-accessories": {
    title: "Prayer & Quran Accessories",
    tagline: "Essentials to elevate your daily worship.",
    image:
      "https://images.pexels.com/photos/11663268/pexels-photo-11663268.jpeg",
  },
};

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

function ProductCardSkeleton() {
  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-3 animate-pulse">
      <div className="aspect-square bg-neutral-200 rounded-lg mb-3" />
      <div className="h-3.5 bg-neutral-200 rounded w-4/5 mb-2" />
      <div className="h-3.5 bg-neutral-200 rounded w-1/3 mb-3" />
      <div className="h-8 bg-neutral-200 rounded" />
    </div>
  );
}

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState("featured");
  // Bumping this re-runs the fetch effect below — used by the Retry button.
  const [retryCount, setRetryCount] = useState(0);

  // Read category/subcategory/search straight from the URL so links like
  // /products?category=books&subcategory=Quran and browser back/forward work.
  useEffect(() => {
    if (!router.isReady) return;
    setCategory(router.query.category || "");
    setSubcategory(router.query.subcategory || "");
    setSearchTerm(router.query.search || "");
  }, [
    router.isReady,
    router.query.category,
    router.query.subcategory,
    router.query.search,
  ]);

  const fetchProducts = useCallback(() => {
    if (!router.isReady) return;
    setStatus("loading");
    const query = category ? `?category=${category}` : "";
    api
      .get(`/products${query}`)
      .then((res) => {
        // Guard against a response shape the frontend doesn't expect, rather
        // than silently rendering nothing.
        if (!Array.isArray(res.data)) {
          throw new Error("Unexpected response shape from /products");
        }
        setProducts(res.data.map(normalizeProduct));
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [category, router.isReady]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, retryCount]);

  function selectSubcategory(sc) {
    const query = { ...router.query };
    if (sc) {
      query.subcategory = sc;
    } else {
      delete query.subcategory;
    }
    router.push({ pathname: "/products", query }, undefined, { shallow: true });
  }

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

  // Subcategory chips are computed from whatever the backend actually
  // returned for this category — for ANY category, not just Books. If a
  // category's products don't carry a subcategory yet, no chips render.
  const availableSubcategories = [
    ...new Set(products.map((p) => p.subcategory).filter(Boolean)),
  ];

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

  const info = CATEGORY_INFO[category] || CATEGORY_INFO[""];

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      {/* Compact page header: back arrow, category title, search icon */}
      <header className="flex items-center justify-between px-4 py-4 max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="text-ink"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-serif text-lg text-ink">{info.title}</h1>
        <Link href="/search" aria-label="Search" className="text-ink">
          <SearchIcon size={20} />
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-8">
        {/* Category banner — same data-driven banner used for every category */}
        <div
          className="relative rounded-2xl overflow-hidden mb-4 bg-cover bg-center h-[110px] sm:h-[130px]"
          style={{
            backgroundImage: `url('${info.image}')`,
            backgroundPosition: "center 35%",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(30,61,50,0.92), rgba(30,61,50,0.75), rgba(30,61,50,0.35))",
            }}
          />
          <div className="relative h-full flex flex-col justify-center px-5">
            <h2 className="font-serif text-xl sm:text-2xl text-white leading-tight mb-1">
              {info.title}
            </h2>
            <p className="text-sm text-white/80 max-w-xs">{info.tagline}</p>
          </div>
        </div>

        {searchTerm && (
          <p className="text-sm text-neutral-500 mb-4">
            Showing results for "{searchTerm}"{" "}
            <button
              onClick={() => router.push("/products")}
              className="text-spine underline ml-1"
            >
              Clear
            </button>
          </p>
        )}

        {/* Subcategory chips — appear for ANY category once its products
            carry a subcategory value. "All" clears the filter. */}
        {availableSubcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => selectSubcategory("")}
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
                onClick={() => selectSubcategory(sc)}
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
            {status === "success"
              ? `${visibleProducts.length} product${
                  visibleProducts.length === 1 ? "" : "s"
                }`
              : "\u00A0"}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border border-neutral-300 rounded px-2 py-1.5 bg-white"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* LOADING state — real skeleton, shown only while the request is in flight */}
        {status === "loading" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ERROR state — never leaves the user stuck; always offers Retry */}
        {status === "error" && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-3">
              Something went wrong loading these products.
            </p>
            <button
              onClick={() => setRetryCount((n) => n + 1)}
              className="px-4 py-2 bg-spine text-white rounded text-sm hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        )}

        {/* EMPTY state — a real zero-results response, not a stuck loader */}
        {status === "success" && visibleProducts.length === 0 && (
          <p className="text-neutral-500 text-center py-12">
            {category
              ? "No products found in this category."
              : "No products found."}
          </p>
        )}

        {/* SUCCESS state */}
        {status === "success" && visibleProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {visibleProducts.map((product) => (
              <ProductGridCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
