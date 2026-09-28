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
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white border-t border-neutral-200 flex justify-around"
      style={{
        zIndex: 1000,
        boxSizing: "border-box",
        // Explicit height with room for icon + label + a buffer below the
        // labels, so a slightly-off mobile viewport edge can't clip them.
        height: "calc(72px + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)",
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = router.pathname === tab.href.split("?")[0];
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-1 ${
              active ? "text-spine" : "text-neutral-400"
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] leading-none">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
