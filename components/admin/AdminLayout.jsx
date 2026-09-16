import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import MosqueIcon from "../MosqueIcon";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const role = window.localStorage.getItem("role");
    if (role !== "ADMIN") {
      router.push("/admin/login");
      return;
    }
    setChecked(true);
  }, [router]);

  // Close the mobile sidebar automatically on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

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

  const sidebarContent = (
    <>
      <div className="px-5 py-5 flex items-center justify-between border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <MosqueIcon size={28} className="text-spine" />
          <div>
            <p className="font-serif text-sm text-spine leading-tight">
              Maktabah Islamiyah
            </p>
            <p className="text-[10px] text-neutral-400">Admin</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden text-neutral-400"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = router.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-spine text-white shadow-sm"
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
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-100 w-full transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <MosqueIcon size={22} className="text-spine" />
          <p className="font-serif text-sm text-spine">Admin</p>
        </div>
        <button onClick={() => setSidebarOpen(true)} className="text-ink">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: static on desktop, slide-in on mobile */}
      <aside
        className={`w-64 md:w-56 bg-white border-r border-neutral-200 flex flex-col shadow-sm fixed md:static inset-y-0 left-0 z-50 transition-transform duration-200 md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {sidebarContent}
      </aside>

      <main
        className="flex-1 p-4 pt-20 md:p-8 md:pt-8"
        style={{ backgroundColor: "#F3ECDD" }}
      >
        {children}
      </main>
    </div>
  );
}
