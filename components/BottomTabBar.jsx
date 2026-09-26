import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Grid, Search, Heart, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/categories", label: "Categories", icon: Grid },
  { href: "/search", label: "Search", icon: Search },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account", label: "Account", icon: User },
];

export default function BottomTabBar() {
  const router = useRouter();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around py-2 z-40">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        // Account stays highlighted across its whole section (nested
        // /account/* pages and /help, which is reached from the Account menu).
        const active =
          tab.href === "/account"
            ? router.pathname.startsWith("/account") ||
              router.pathname === "/help"
            : router.pathname === tab.href.split("?")[0];
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 text-[10px] px-2 ${
              active ? "text-spine" : "text-neutral-400"
            }`}
          >
            <Icon size={20} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
