import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
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

function WhatsappIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29z" />
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
  const router = useRouter();
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
        onClick={() =>
          product.sizes && product.sizes.length > 0
            ? router.push(`/products/${product.slug}`)
            : addItem(product)
        }
        className="mt-2 px-3 py-1.5 bg-spine text-white text-sm rounded hover:opacity-90 transition-opacity"
      >
        {product.sizes && product.sizes.length > 0
          ? "Select Size"
          : "Add to Cart"}
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
        className="relative h-[360px] md:h-[420px] bg-cover rounded-2xl overflow-hidden mx-4 mt-4 max-w-7xl md:mx-auto md:w-[calc(100%_-_2rem)]"
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
              className={`flex items-center gap-2.5 sm:gap-3 border border-neutral-200 rounded-xl bg-white p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-shadow ${
                i === CATEGORIES.length - 1 ? "col-span-2" : ""
              }`}
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CATEGORY_IMAGE_URLS[c.slug]}
                  alt={c.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-[13px] sm:text-sm leading-tight break-words">
                  {c.label}
                </p>
                <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 whitespace-nowrap">
                  {counts[c.slug] || 0} product{counts[c.slug] === 1 ? "" : "s"}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="hidden sm:block text-neutral-300 flex-shrink-0"
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
          <div className="flex gap-4 mb-2">
            <a
              href="https://www.facebook.com/share/1WEKELPW56/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Maktabah Islamiyah on Facebook"
              className="text-white/90 hover:text-white transition-colors"
            >
              <FacebookIcon size={22} />
            </a>
            <a
              href="https://whatsapp.com/channel/0029Va7UNes6BIEjaVFhLb3B"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Maktabah Islamiyah on WhatsApp"
              className="text-white/90 hover:text-white transition-colors"
            >
              <WhatsappIcon size={22} />
            </a>
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
            <Link href="/help" className="block">
              Contact Us
            </Link>
            <Link href="/orders" className="block">
              Orders
            </Link>
          </FooterAccordion>

          <FooterAccordion title="Policies">
            <Link href="/account/legal/privacy-policy" className="block">
              Privacy Policy
            </Link>
            <Link href="/account/legal/terms" className="block">
              Terms &amp; Conditions
            </Link>
          </FooterAccordion>
        </div>
        <div className="border-t border-white/10 px-6 py-4 text-xs text-white/50 text-center">
          © 2026 Maktabah Islamiyah. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
