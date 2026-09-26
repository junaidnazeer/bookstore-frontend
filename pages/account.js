import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import MosqueIcon from "../components/MosqueIcon";
import {
  Package,
  Heart,
  MapPin,
  User,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";

const SPINE = "#1e3d32";

// Exact 7 menu items, routes and subtitles as specified.
const MENU_ITEMS = [
  {
    icon: Package,
    label: "My Orders",
    sublabel: "View order history & track your orders",
    href: "/orders",
  },
  {
    icon: Heart,
    label: "Wishlist",
    sublabel: "Saved products",
    href: "/wishlist",
  },
  {
    icon: MapPin,
    label: "Saved Addresses",
    sublabel: "Manage delivery addresses",
    href: "/account/addresses",
  },
  {
    icon: User,
    label: "Account Details",
    sublabel: "Name, email, phone, payment & password",
    href: "/account/details",
  },
  {
    icon: SettingsIcon,
    label: "Settings",
    sublabel: "App preferences & notifications",
    href: "/account/settings",
  },
  {
    icon: HelpCircle,
    label: "Help & Support",
    sublabel: "FAQs, contact us & support",
    href: "/help",
  },
];

function MenuRow({ icon: Icon, label, sublabel, href }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border border-neutral-200 rounded-lg bg-white p-3.5 hover:shadow-sm transition-shadow"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "rgba(30,61,50,0.08)" }}
      >
        <Icon size={18} style={{ color: SPINE }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink text-sm">{label}</p>
        <p className="text-xs text-neutral-400 truncate">{sublabel}</p>
      </div>
      <ChevronRight size={18} className="text-neutral-300 flex-shrink-0" />
    </Link>
  );
}

function LogoutDialog({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-lg">
        <h2 className="font-serif text-lg text-ink mb-1">Log out?</h2>
        <p className="text-sm text-neutral-500 mb-5">
          You'll need to sign in again to access your account.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-neutral-300 text-ink text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:opacity-90 transition-opacity"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Account() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    setIsLoggedIn(!!token);
    // Real values from the actual logged-in session — never hardcoded.
    setUserName(window.localStorage.getItem("userName") || "");
    setUserEmail(window.localStorage.getItem("userEmail") || "");
    setChecked(true);
  }, []);

  function handleLogoutConfirmed() {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("role");
    window.localStorage.removeItem("userName");
    window.localStorage.removeItem("userEmail");
    setConfirmLogout(false);
    router.push("/login");
  }

  // Avoid a flash of the wrong state before we've checked localStorage.
  if (!checked) return null;

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
        <header className="px-4 py-4 max-w-2xl mx-auto flex items-center gap-2">
          <MosqueIcon
            size={28}
            style={{ color: SPINE }}
            className="flex-shrink-0"
          />
          <div>
            <div
              className="font-serif text-base sm:text-xl leading-tight"
              style={{ color: SPINE }}
            >
              Maktabah Islamiyah
            </div>
            <div className="text-[11px] sm:text-xs text-neutral-400">
              Faith · Knowledge · Lifestyle
            </div>
          </div>
        </header>
        <main className="max-w-md mx-auto px-6 py-16 text-center">
          <User size={40} className="text-neutral-300 mx-auto mb-3" />
          <h1 className="font-serif text-2xl text-ink mb-2">
            Sign in to view your account
          </h1>
          <p className="text-neutral-500 mb-6 text-sm">
            Manage your orders, wishlist and account details.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2 rounded text-white text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: SPINE }}
          >
            Login
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <header className="px-4 py-4 max-w-2xl mx-auto flex items-center gap-2">
        <MosqueIcon
          size={28}
          style={{ color: SPINE }}
          className="flex-shrink-0"
        />
        <div>
          <div
            className="font-serif text-base sm:text-xl leading-tight"
            style={{ color: SPINE }}
          >
            Maktabah Islamiyah
          </div>
          <div className="text-[11px] sm:text-xs text-neutral-400">
            Faith · Knowledge · Lifestyle
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-8">
        {/* Profile summary — real name/email from the logged-in session */}
        <div className="flex items-center gap-3 border border-neutral-200 rounded-lg bg-white p-4 mb-5">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(30,61,50,0.08)" }}
          >
            <User size={20} style={{ color: SPINE }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-ink truncate">
              {userName || "Welcome back"}
            </p>
            <p className="text-xs text-neutral-400 truncate">
              {userEmail || "No email on file"}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {MENU_ITEMS.map((item) => (
            <MenuRow key={item.label} {...item} />
          ))}

          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-3 border rounded-lg bg-white p-3.5 mt-2"
            style={{ borderColor: SPINE }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(30,61,50,0.08)" }}
            >
              <LogOut size={18} style={{ color: SPINE }} />
            </div>
            <span className="font-medium text-sm" style={{ color: SPINE }}>
              Logout
            </span>
          </button>
        </div>
      </main>

      {confirmLogout && (
        <LogoutDialog
          onCancel={() => setConfirmLogout(false)}
          onConfirm={handleLogoutConfirmed}
        />
      )}
    </div>
  );
}
