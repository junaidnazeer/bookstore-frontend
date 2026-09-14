import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { normalizeProduct } from "../lib/normalizeProduct";
import { useCart } from "../lib/cart-context";
import { Truck, ShieldCheck, Package, Headphones } from "lucide-react";

const CATEGORIES = [
  { slug: "books", label: "Books" },
  { slug: "attars", label: "Attars" },
  { slug: "caps", label: "Caps" },
  { slug: "shalwar-kameez", label: "Shalwar Kameez" },
  { slug: "abayas", label: "Abayas" },
  { slug: "jilbabs", label: "Jilbabs" },
  { slug: "prayer-quran-accessories", label: "Prayer & Quran Accessories" },
];

// Real, safely-licensed stock photos from Pexels/Unsplash, picked to match
// each category. Swap these for actual product photos once available.
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

function ProductTile({ product, addItem }) {
  return (
    <div className="border border-neutral-200 rounded bg-white p-3 flex flex-col">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square bg-neutral-100 rounded overflow-hidden mb-3">
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
        <p className="text-xs text-neutral-400 capitalize">
          {product.categoryName}
        </p>
      </Link>
      <p className="text-brass font-semibold mt-2">₹{product.price}</p>
      <button
        onClick={() => addItem(product)}
        className="mt-2 px-3 py-1.5 bg-spine text-white text-sm rounded hover:opacity-90 transition-opacity"
      >
        Add to Cart
      </button>
    </div>
  );
}

export default function Home() {
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data.map(normalizeProduct)))
      .catch(() => setProducts([]));
  }, []);

  const featured = CATEGORIES.map((c) =>
    products.find((p) => p.category === c.slug),
  ).filter(Boolean);

  const newArrivals = [...products]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section
        className="relative w-full h-[420px] md:h-[480px] bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/37697015/pexels-photo-37697015.jpeg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/80 to-transparent" />

        <button
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-ink hover:bg-white transition-colors z-10"
        >
          ‹
        </button>
        <button
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-ink hover:bg-white transition-colors z-10"
        >
          ›
        </button>

        <div className="relative max-w-6xl mx-auto px-6 h-full flex items-center">
          <div className="max-w-md">
            <p className="text-sm text-neutral-600 mb-2">
              Quality Islamic Essentials
            </p>
            <h1 className="font-serif text-4xl text-ink leading-tight mb-4">
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

      {/* Shop by category */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-ink">Shop by Category</h2>
          <Link href="/products" className="text-sm text-spine">
            View All Categories →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className="border border-neutral-200 rounded bg-white overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-neutral-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CATEGORY_IMAGE_URLS[c.slug]}
                  alt={c.label}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-ink px-2 py-2 truncate">{c.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured collection */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-ink">Featured Collection</h2>
            <Link href="/products" className="text-sm text-spine">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {featured.map((p) => (
              <ProductTile key={p.id} product={p} addItem={addItem} />
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-ink">New Arrivals</h2>
            <Link href="/products" className="text-sm text-spine">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {newArrivals.map((p) => (
              <ProductTile key={p.id} product={p} addItem={addItem} />
            ))}
          </div>
        </section>
      )}

      {/* Mid-page banner */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        <div className="bg-spine text-white rounded p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl mb-2">
              Build Your Islamic Library
            </h2>
            <p className="text-white/80">
              Find books that help you learn, understand, and grow in your
              faith.
            </p>
          </div>
          <Link
            href="/products?category=books"
            className="px-5 py-2 bg-white text-spine rounded hover:opacity-90 transition-opacity flex-shrink-0"
          >
            Explore Books →
          </Link>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-t border-neutral-200 mt-6">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <Truck className="mx-auto mb-2 text-spine" />
            <p className="text-sm font-medium text-ink">Reliable Delivery</p>
            <p className="text-xs text-neutral-400">Fast and safe shipping</p>
          </div>
          <div>
            <ShieldCheck className="mx-auto mb-2 text-spine" />
            <p className="text-sm font-medium text-ink">Secure Payments</p>
            <p className="text-xs text-neutral-400">Your data is protected</p>
          </div>
          <div>
            <Package className="mx-auto mb-2 text-spine" />
            <p className="text-sm font-medium text-ink">Carefully Packed</p>
            <p className="text-xs text-neutral-400">Quality packaging</p>
          </div>
          <div>
            <Headphones className="mx-auto mb-2 text-spine" />
            <p className="text-sm font-medium text-ink">Customer Support</p>
            <p className="text-xs text-neutral-400">We're here to help</p>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-spine text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-medium">Stay Updated</p>
            <p className="text-sm text-white/70">
              Get notified about new products, offers and updates.
            </p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-2 w-full md:w-auto"
          >
            <input
              type="email"
              placeholder="Enter your email address"
              className="px-3 py-2 rounded bg-white text-ink placeholder:text-neutral-400 border-0 outline-none flex-1 md:w-64"
            />
            <button className="px-4 py-2 bg-white text-spine rounded font-medium">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <p className="font-serif text-lg mb-2">
              Maktabah Islamiyah Jammu And Kashmir
            </p>
            <p className="text-xs text-white/50">
              Books · Attars · Shalwar Kameez · Abayas · Jilbabs · More
            </p>
          </div>
          <div>
            <p className="font-medium mb-2 text-sm">Quick Links</p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>
                <Link href="/">Home</Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link href={`/products?category=${c.slug}`}>{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2 text-sm">Customer Care</p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>Contact Us</li>
              <li>Orders</li>
              <li>Shipping</li>
              <li>Returns</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2 text-sm">Policies</p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>Privacy Policy</li>
              <li>Terms & Conditions</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-4 text-xs text-white/40 text-center">
          © 2026 Maktabah Islamiyah Jammu And Kashmir. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
