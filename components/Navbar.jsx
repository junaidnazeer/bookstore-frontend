import Link from "next/link";
import MosqueIcon from "./MosqueIcon";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCart } from "../lib/cart-context";
import { useWishlist } from "../lib/wishlist-context";
import { useSidebar } from "../lib/sidebar-context";
import {
  Search,
  ShoppingCart,
  User,
  SlidersHorizontal,
  Heart,
  Menu,
} from "lucide-react";

const SPINE = "#1e3d32";

export default function Navbar() {
  const { count } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { toggle, setHasInlineTrigger } = useSidebar();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setIsLoggedIn(!!window.localStorage.getItem("token"));
  }, [router.pathname]);

  // Tell SidebarToggleButton a real, in-header hamburger already exists on
  // this page, so it doesn't also render its own floating one — avoids a
  // duplicate hamburger on every page that uses Navbar.
  useEffect(() => {
    setHasInlineTrigger(true);
    return () => setHasInlineTrigger(false);
  }, [setHasInlineTrigger]);

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
    <div className="bg-paper md:sticky md:top-0 md:z-40">
      {/* Main row */}
      <div className="px-4 sm:px-6 pt-4 pb-3 flex flex-col md:grid md:grid-cols-3 md:items-center gap-3 md:gap-6">
        <div className="flex items-center justify-between gap-3 md:contents">
          <div className="flex items-center gap-2 min-w-0 md:col-start-1 md:row-start-1 md:justify-self-start">
            <button
              onClick={toggle}
              aria-label="Open menu"
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0"
              style={{ color: SPINE }}
            >
              <Menu size={20} />
            </button>
            <Link
              href="/"
              className="flex-shrink-0 flex items-center gap-2 min-w-0"
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
          </div>

          <div className="flex items-center gap-2 sm:gap-5 flex-shrink-0 md:col-start-3 md:row-start-1 md:justify-self-end">
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="hidden md:flex relative text-spine flex-shrink-0"
            >
              <Heart size={22} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-spine text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative text-spine flex-shrink-0">
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
                className="md:hidden text-xs sm:text-sm text-spine flex items-center gap-1 flex-shrink-0 whitespace-nowrap"
              >
                <User size={18} className="hidden sm:block" /> Logout
              </button>
            ) : (
              <div className="md:hidden flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-spine flex-shrink-0 whitespace-nowrap">
                <User size={18} className="hidden sm:block" />
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
          className="w-full md:col-start-2 md:row-start-1 md:justify-self-center md:w-full md:max-w-md"
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
