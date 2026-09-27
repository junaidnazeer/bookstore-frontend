import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Grid, Search, Heart, User } from "lucide-react";
import MosqueIcon from "./MosqueIcon";

const SPINE = "#1e3d32";

// Same 5 destinations as BottomTabBar — this is the desktop equivalent,
// shown as a persistent left sidebar instead of a bottom bar once there's
// enough width for it (md and up).
const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/categories", label: "Categories", icon: Grid },
  { href: "/search", label: "Search", icon: Search },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account", label: "Account", icon: User },
];

export default function SideNav() {
  const router = useRouter();

  return (
    <nav
      className="hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-neutral-200 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-5 flex-shrink-0"
      >
        <MosqueIcon
          size={26}
          style={{ color: SPINE }}
          className="flex-shrink-0"
        />
        <div>
          <div
            className="font-serif text-sm font-semibold leading-tight"
            style={{ color: SPINE }}
          >
            Maktabah Islamiyah
          </div>
          <div className="text-[10px] text-neutral-400">
            Faith · Knowledge · Lifestyle
          </div>
        </div>
      </Link>

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
