import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { normalizeProduct } from "../lib/normalizeProduct";
import { ChevronRight } from "lucide-react";

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
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-spine text-white rounded-lg p-6 mb-6">
          <h1 className="font-serif text-xl mb-1">Explore Our Categories</h1>
          <p className="text-sm text-white/80">
            Authentic products for your spiritual journey.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className="flex items-center gap-3 border border-neutral-200 rounded-lg bg-white p-3 hover:shadow-sm transition-shadow"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CATEGORY_IMAGE_URLS[c.slug]}
                  alt={c.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-ink">{c.label}</p>
                <p className="text-xs text-neutral-400">
                  {loading
                    ? "Loading..."
                    : `${counts[c.slug] || 0} product${counts[c.slug] === 1 ? "" : "s"}`}
                </p>
              </div>
              <ChevronRight size={18} className="text-neutral-300" />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
