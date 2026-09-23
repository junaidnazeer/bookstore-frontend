import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import MosqueIcon from "../components/MosqueIcon";
import api from "../lib/api";
import { normalizeProduct } from "../lib/normalizeProduct";
import { useCart } from "../lib/cart-context";
import { useWishlist } from "../lib/wishlist-context";
import {
  Truck,
  ShieldCheck,
  Package,
  Heart,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

// Order matches the requested 2-column row pairing:
// Row1: Books/Attars, Row2: Caps/Abayas, Row3: Shalwar Kameez/Jilbabs, Row4: Prayer & Quran Accessories
const CATEGORIES = [
  { slug: "books", label: "Books" },
  { slug: "attars", label: "Attars" },
  { slug: "caps", label: "Caps" },
  { slug: "abayas", label: "Abayas" },
  { slug: "shalwar-kameez", label: "Shalwar Kameez" },
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

function FacebookIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 22v-9h3l1-4h-4V7c0-1.1.3-2 2-2h2V1.1C16.7 1 15.5 1 14 1c-3 0-5 1.8-5 5v3H6v4h3v9h4z" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M10 9l5 3-5 3z" />
    </svg>
  );
}

// Subtle repeating arch/dome motif, drawn as original SVG (not copied
// from any reference), low opacity, sitting behind all page content.
function IslamicPatternBackground() {
  return (
    <svg
      className="fixed inset-0 w-full h-full opacity-[0.05] pointer-events-none -z-10"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="homeArches"
          x="0"
          y="0"
          width="70"
          height="70"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M8 55 Q8 25 35 25 Q62 25 62 55"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        fill="url(#homeArches)"
        className="text-spine"
      />
    </svg>
  );
}

function HorizontalProductRow({ products, addItem }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      {products.map((p) => (
        <div key={p.id} className="w-36 flex-shrink-0">
          <ProductTile product={p} addItem={addItem} />
        </div>
      ))}
    </div>
  );
}

function ProductTile({ product, addItem }) {
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  return (
    <div className="border border-neutral-200 rounded-lg bg-white p-3 flex flex-col relative h-full">
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
      <Link href={`/products/${product.slug}`}>
        <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || CATEGORY_IMAGE_URLS[product.category]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-sm font-medium text-ink truncate">
          {product.name}
        </h3>
      </Link>
      <p className="text-spine font-semibold mt-1">₹{product.price}</p>
      <button
        onClick={() => addItem(product)}
        className="mt-2 px-3 py-1.5 bg-spine text-white text-sm rounded hover:opacity-90 transition-opacity"
      >
        Add to Cart
      </button>
    </div>
  );
}

function FooterAccordion({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-white/10 py-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-white font-medium"
      >
        {title}
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-2 text-sm text-white/70 space-y-1">{children}</div>
      )}
    </div>
  );
}

export default function Home() {
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    api
      .get("/products")
      .then((res) => {
        const list = res.data.map(normalizeProduct);
        setProducts(list);
        const tally = {};
        list.forEach((p) => {
          tally[p.category] = (tally[p.category] || 0) + 1;
        });
        setCounts(tally);
      })
      .catch(() => setProducts([]));
  }, []);

  const featured = CATEGORIES.map((c) =>
    products.find((p) => p.category === c.slug),
  ).filter(Boolean);

  const newArrivals = [...products]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);

  return (
    <div className="relative" style={{ backgroundColor: "#F3ECDD" }}>
      <IslamicPatternBackground />
      <Navbar />

      {/* Hero */}
      <section
        className="relative w-full h-[360px] md:h-[420px] bg-cover rounded-2xl overflow-hidden mx-4 mt-4 max-w-6xl md:mx-auto"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/37697015/pexels-photo-37697015.jpeg')",
          backgroundPosition: "center 30%",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(243,236,221,0.5)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #F3ECDD, rgba(243,236,221,0.7), transparent)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 h-full flex items-center">
          <div className="max-w-md">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
              Authentic Islamic Essentials
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-ink leading-tight mb-4">
              Discover Knowledge. Live the Sunnah.
            </h1>
            <p className="text-neutral-600 mb-6">
              Authentic books, attars, modest clothing and more — carefully
              selected for you.
            </p>
            <div className="flex gap-3">
              <Link
                href="/products?category=books"
                className="px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity"
              >
                Shop Now →
              </Link>
              <Link
                href="/products"
                className="px-5 py-2 border border-spine text-spine rounded bg-white/70 hover:bg-spine hover:text-white transition-colors"
              >
                Explore All
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by category - always 2 columns, exact row pairing via array order */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-ink">Shop by Category</h2>
          <Link
            href="/categories"
            className="text-sm text-spine flex items-center gap-1"
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className={`flex items-center gap-3 border border-neutral-200 rounded-xl bg-white p-3 shadow-sm hover:shadow-md transition-shadow ${
                i === CATEGORIES.length - 1 ? "col-span-2" : ""
              }`}
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
                  {counts[c.slug] || 0} product{counts[c.slug] === 1 ? "" : "s"}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-neutral-300 flex-shrink-0"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured collection - horizontal scroll */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-ink">Featured Collection</h2>
            <Link
              href="/products"
              className="text-sm text-spine flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <HorizontalProductRow products={featured} addItem={addItem} />
        </section>
      )}

      {/* New arrivals - horizontal scroll */}
      {newArrivals.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-ink">New Arrivals</h2>
            <Link
              href="/products"
              className="text-sm text-spine flex items-center gap-1"
            >
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <HorizontalProductRow products={newArrivals} addItem={addItem} />
        </section>
      )}

      {/* Build Your Islamic Library banner */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <div
          className="relative rounded-2xl overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg')",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #F3ECDD 40%, rgba(243,236,221,0.55) 70%, transparent)",
            }}
          />
          <div className="relative p-6 md:p-8 max-w-xs">
            <h2 className="font-serif text-2xl text-spine mb-2 leading-tight font-semibold">
              Build Your
              <br />
              Islamic Library
            </h2>
            <p className="text-neutral-600 text-sm mb-4">
              Timeless knowledge for a better tomorrow.
            </p>
            <Link
              href="/products?category=books"
              className="inline-block px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity text-sm"
            >
              Explore Books →
            </Link>
          </div>
        </div>
      </section>

      {/* Why shop with us */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="font-serif text-xl text-ink mb-4">Why Shop With Us</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-neutral-100 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-spine/10 flex items-center justify-center flex-shrink-0">
              <Truck size={16} className="text-spine" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">Reliable Delivery</p>
              <p className="text-xs text-neutral-500">
                Safe & timely delivery across India
              </p>
            </div>
            <ChevronRight
              size={14}
              className="text-neutral-300 flex-shrink-0"
            />
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-neutral-100 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-spine/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={16} className="text-spine" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">Secure Payments</p>
              <p className="text-xs text-neutral-500">
                Multiple secure payment options
              </p>
            </div>
            <ChevronRight
              size={14}
              className="text-neutral-300 flex-shrink-0"
            />
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-neutral-100 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-spine/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={16} className="text-spine" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">Authentic Products</p>
              <p className="text-xs text-neutral-500">
                100% genuine & handpicked items
              </p>
            </div>
            <ChevronRight
              size={14}
              className="text-neutral-300 flex-shrink-0"
            />
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-neutral-100 shadow-sm">
            <div className="w-9 h-9 rounded-full bg-spine/10 flex items-center justify-center flex-shrink-0">
              <Package size={16} className="text-spine" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">Easy Returns</p>
              <p className="text-xs text-neutral-500">
                Hassle-free returns & exchanges
              </p>
            </div>
            <ChevronRight
              size={14}
              className="text-neutral-300 flex-shrink-0"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-spine text-white relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-2">
            <MosqueIcon size={28} className="text-white" />
            <div>
              <p className="font-serif text-lg leading-tight">
                Maktabah Islamiyah
              </p>
              <p className="text-xs text-white/60">
                Faith · Knowledge · Lifestyle
              </p>
            </div>
          </div>
          <p className="text-sm text-white/70 mb-4">
            Authentic Islamic products for a meaningful life.
          </p>
          <div className="flex gap-3 mb-2">
            <FacebookIcon />
            <InstagramIcon />
            <YoutubeIcon />
          </div>

          <FooterAccordion title="Quick Links">
            <Link href="/" className="block">
              Home
            </Link>
            <Link href="/categories" className="block">
              Categories
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/products?category=${c.slug}`}
                className="block"
              >
                {c.label}
              </Link>
            ))}
            <Link href="/products" className="block">
              New Arrivals
            </Link>
          </FooterAccordion>

          <FooterAccordion title="Customer Care">
            <p>Contact Us</p>
            <p>Orders</p>
            <p>Shipping</p>
            <p>Returns</p>
          </FooterAccordion>

          <FooterAccordion title="Policies">
            <p>Privacy Policy</p>
            <p>Terms & Conditions</p>
          </FooterAccordion>
        </div>
        <div className="border-t border-white/10 px-6 py-4 text-xs text-white/50 text-center">
          © 2026 Maktabah Islamiyah. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
