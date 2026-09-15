import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Package, ShoppingCart, LogOut } from "lucide-react";
import MosqueIcon from "../MosqueIcon";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const role = window.localStorage.getItem("role");
    if (role !== "ADMIN") {
      router.push("/admin/login");
      return;
    }
    setChecked(true);
  }, [router]);

  function handleLogout() {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("role");
    router.push("/login");
  }

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400">
        Checking access...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside className="w-56 bg-white border-r border-neutral-200 flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-neutral-200">
          <MosqueIcon size={28} className="text-spine" />
          <div>
            <p className="font-serif text-sm text-spine leading-tight">
              Maktabah Islamiyah
            </p>
            <p className="text-[10px] text-neutral-400">Admin</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = router.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                  active
                    ? "bg-spine text-white"
                    : "text-ink hover:bg-neutral-100"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-neutral-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm text-neutral-500 hover:bg-neutral-100 w-full"
          >
            <LogOut size={16} />
            Logout
          </button>
          <p className="text-xs text-neutral-400 px-3 mt-2">Admin</p>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
