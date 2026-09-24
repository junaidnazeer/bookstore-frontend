import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import api from "../lib/api";
import { normalizeProduct } from "../lib/normalizeProduct";
import { ArrowLeft, Search as SearchIcon, ChevronRight } from "lucide-react";

// Same 7 categories, same order, same slugs and images as the finalized
// Home Page — kept in sync so /products?category=<slug> filtering keeps working.
const CATEGORIES = [
  { slug: "books", label: "Books" },
  { slug: "attars", label: "Attars" },
  { slug: "caps", label: "Caps" },
  { slug: "shalwar-kameez", label: "Shalwar Kameez" },
  { slug: "abayas", label: "Abayas" },
  { slug: "jilbabs", label: "Jilbabs" },
  { slug: "prayer-quran-accessories", label: "Prayer & Quran Accessories" },
];

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

export default function Categories() {
  const router = useRouter();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real counts only, computed from actual product data — no made-up numbers.
    api
      .get("/products")
      .then((res) => {
        const products = res.data.map(normalizeProduct);
        const tally = {};
        products.forEach((p) => {
          tally[p.category] = (tally[p.category] || 0) + 1;
        });
        setCounts(tally);
      })
      .catch(() => setCounts({}))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F3ECDD" }}>
      {/* Compact page header: back arrow, title, search icon */}
      <header className="flex items-center justify-between px-4 py-4 max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="text-ink"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-serif text-lg text-ink">Categories</h1>
        <Link href="/search" aria-label="Search" className="text-ink">
          <SearchIcon size={20} />
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-8">
        {/* Hero banner */}
        <div
          className="relative rounded-2xl overflow-hidden mb-6 bg-cover bg-center h-[130px] sm:h-[150px]"
          style={{
            backgroundImage:
              "url('https://images.pexels.com/photos/37697015/pexels-photo-37697015.jpeg')",
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
              Explore Our Categories
            </h2>
            <p className="text-sm text-white/80 max-w-xs">
              Authentic products for your spiritual journey.
            </p>
          </div>
        </div>

        {/* Category list - exactly 7 categories, no products, no New Arrivals */}
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className="flex items-center gap-3 border border-neutral-200 rounded-xl bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CATEGORY_IMAGE_URLS[c.slug]}
                  alt={c.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm truncate">
                  {c.label}
                </p>
                <p className="text-xs text-neutral-400">
                  {loading
                    ? "Loading..."
                    : `${counts[c.slug] || 0} product${
                        counts[c.slug] === 1 ? "" : "s"
                      }`}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-neutral-300 flex-shrink-0"
              />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
