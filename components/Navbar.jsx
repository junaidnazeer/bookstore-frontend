import Link from "next/link";
import MosqueIcon from "./MosqueIcon";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCart } from "../lib/cart-context";
import {
  Search,
  ShoppingCart,
  User,
  Truck,
  ShieldCheck,
  Users,
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

export default function Navbar() {
  const { count } = useCart();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setIsLoggedIn(!!window.localStorage.getItem("token"));
  }, [router.pathname]);

  function handleLogout() {
    window.localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/");
  }

  function handleSearch(e) {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  }

  return (
    <div>
      {/* Top promo strip */}
      <div className="bg-spine text-white text-xs py-2 px-6 hidden sm:flex justify-center gap-8">
        <span className="flex items-center gap-1">
          <Truck size={14} /> Free shipping on orders above ₹999
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck size={14} /> Authentic Islamic products
        </span>
        <span className="flex items-center gap-1">
          <Users size={14} /> Trusted by thousands
        </span>
      </div>

      {/* Main row */}
      <div className="border-b border-neutral-200 px-6 py-4 flex items-center gap-6 bg-paper">
        <Link href="/" className="flex-shrink-0 flex items-center gap-2">
          <MosqueIcon className="text-spine" />
          <div>
            <div className="font-serif text-xl text-spine leading-tight">
              Maktabah Islamiyah
            </div>
            <div className="text-xs text-neutral-400 hidden sm:block">
              Books · Attars · Clothing · More
            </div>
          </div>
        </Link>
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto">
          <div className="flex border border-neutral-300 rounded overflow-hidden">
            <input
              type="text"
              placeholder="Search books, attars, clothing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 text-sm outline-none"
            />
            <button type="submit" className="px-3 text-neutral-400">
              <Search size={18} />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-4 flex-shrink-0">
          <Link href="/cart" className="relative text-ink">
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-spine text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {count}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm text-ink flex items-center gap-1"
            >
              <User size={18} /> Logout
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <User size={18} className="text-ink" />
              <Link href="/login" className="text-ink hover:text-spine">
                Login
              </Link>
              <span className="text-neutral-300">/</span>
              <Link href="/signup" className="text-ink hover:text-spine">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Category row */}
      <nav className="border-b border-neutral-200 px-6 py-2 flex justify-center gap-5 text-sm text-ink overflow-x-auto bg-white">
        <Link
          href="/"
          className={router.pathname === "/" ? "text-spine font-medium" : ""}
        >
          Home
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/products?category=${c.slug}`}
            className="whitespace-nowrap hover:text-spine transition-colors"
          >
            {c.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
