import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Grid, Search, Heart, User, X } from "lucide-react";
import MosqueIcon from "./MosqueIcon";
import { useSidebar } from "../lib/sidebar-context";

const SPINE = "#1e3d32";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/categories", label: "Categories", icon: Grid },
  { href: "/search", label: "Search", icon: Search },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account", label: "Account", icon: User },
];

export default function SideNav() {
  const router = useRouter();
  const { open, toggle } = useSidebar();

  return (
    <nav
      className={`hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-neutral-200 z-40 transition-transform duration-200 ${
        open ? "md:translate-x-0" : "md:-translate-x-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-between gap-2 px-5 py-5 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <MosqueIcon
            size={26}
            style={{ color: SPINE }}
            className="flex-shrink-0"
          />
          <div className="min-w-0">
            <div
              className="font-serif text-sm font-semibold leading-tight truncate"
              style={{ color: SPINE }}
            >
              Maktabah Islamiyah
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              Faith · Knowledge · Lifestyle
            </div>
          </div>
        </Link>
        <button
          onClick={toggle}
          aria-label="Close menu"
          className="flex-shrink-0 text-neutral-400 hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-1 px-3 mt-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = router.pathname === tab.href.split("?")[0];
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={
                active
                  ? {
                      backgroundColor: "rgba(30,61,50,0.08)",
                      color: SPINE,
                      fontWeight: 500,
                    }
                  : { color: "#737373" }
              }
            >
              <Icon size={19} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
