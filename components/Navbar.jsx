import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useCart } from "../lib/cart-context";

export default function Navbar() {
  const { count } = useCart();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check on mount and whenever the route changes (e.g. right after login).
    setIsLoggedIn(!!window.localStorage.getItem("token"));
  }, [router.pathname]);

  function handleLogout() {
    window.localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/");
  }

  return (
    <nav className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between bg-paper">
      <Link href="/" className="font-serif text-xl text-spine">
        Bookstore
      </Link>
      <div className="flex gap-6 text-sm text-ink items-center">
        <Link href="/products">Browse</Link>
        <Link href="/cart" className="relative">
          Cart
          {count > 0 && (
            <span className="ml-1 bg-spine text-white text-xs px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </Link>
        {isLoggedIn ? (
          <button onClick={handleLogout} className="text-ink">
            Logout
          </button>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}
