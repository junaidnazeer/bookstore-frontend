import Link from "next/link";
import MosqueIcon from "./MosqueIcon";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCart } from "../lib/cart-context";
import { Search, ShoppingCart, User, SlidersHorizontal } from "lucide-react";

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
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  }

  return (
    <div className="bg-paper">
      {/* Main row */}
      <div className="px-4 sm:px-6 pt-4 pb-3 flex flex-col md:grid md:grid-cols-3 md:items-center gap-3 md:gap-6">
        <div className="flex items-center justify-between gap-3 md:contents">
          <Link
            href="/"
            className="flex-shrink-0 flex items-center gap-2 min-w-0 md:col-start-1 md:justify-self-start"
          >
            <MosqueIcon size={28} className="text-spine flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-serif text-base sm:text-xl text-spine leading-tight truncate">
                Maktabah Islamiyah
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-400">
                Faith · Knowledge · Lifestyle
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-4 sm:gap-5 flex-shrink-0 md:col-start-3 md:justify-self-end">
            <Link href="/cart" className="relative text-spine">
              <ShoppingCart size={22} />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-spine text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {count}
                </span>
              )}
            </Link>

            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-sm text-spine flex items-center gap-1"
              >
                <User size={18} /> Logout
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-sm text-spine">
                <User size={18} />
                <Link href="/login" className="hover:opacity-80">
                  Login
                </Link>
                <span className="text-spine/50">/</span>
                <Link href="/signup" className="hover:opacity-80">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="w-full md:col-start-2 md:justify-self-center md:w-full md:max-w-md"
        >
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-full pl-4 pr-2 py-2.5 shadow-sm">
            <Search size={18} className="text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search books, attars, clothing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-0 text-sm outline-none bg-transparent"
            />
            <button
              type="submit"
              className="text-neutral-400 flex-shrink-0 p-1"
              aria-label="Search filters"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
