import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Navbar from "../components/Navbar";
import {
  Package,
  Heart,
  MapPin,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Phone,
  Mail,
} from "lucide-react";

const SUPPORT_PHONES = ["7006218923", "7006886439"];
const SUPPORT_EMAIL = "Maktabahislamiyahjk@gmail.com";

function AccountRow({ icon: Icon, label, sublabel, href, onClick }) {
  const content = (
    <div className="flex items-center gap-3 border border-neutral-200 rounded-lg bg-white p-4 hover:shadow-sm transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-spine/10 text-spine flex items-center justify-center flex-shrink-0">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-ink">{label}</p>
        {sublabel && <p className="text-xs text-neutral-400">{sublabel}</p>}
      </div>
      <ChevronRight size={18} className="text-neutral-300" />
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="text-left w-full">
        {content}
      </button>
    );
  }

  return <Link href={href}>{content}</Link>;
}

export default function Account() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    setIsLoggedIn(!!token);
    setUserName(window.localStorage.getItem("userName") || "");
    setUserEmail(window.localStorage.getItem("userEmail") || "");
    setChecked(true);
  }, []);

  function handleLogout() {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("role");
    window.localStorage.removeItem("userName");
    window.localStorage.removeItem("userEmail");
    router.push("/");
  }

  function callSupport(phone) {
    window.location.href = "tel:+91" + phone;
  }

  function emailSupport() {
    window.location.href = "mailto:" + SUPPORT_EMAIL;
  }

  if (!checked) return null;

  if (!isLoggedIn) {
    return (
      <div>
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-16 text-center">
          <User size={40} className="text-neutral-300 mx-auto mb-3" />
          <h1 className="font-serif text-2xl text-ink mb-2">
            Sign in to view your account
          </h1>
          <p className="text-neutral-500 mb-6">
            Manage your orders, wishlist and account details.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2 bg-spine text-white rounded"
          >
            Login
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-serif text-2xl text-ink mb-1">My Account</h1>
        <p className="text-neutral-500 mb-6">
          {userName || userEmail || "Welcome back"}
        </p>

        <div className="flex flex-col gap-3">
          <AccountRow
            icon={Package}
            label="My Orders"
            sublabel="Track and view your past orders"
            href="/orders"
          />
          <AccountRow
            icon={Heart}
            label="Wishlist"
            sublabel="Products you've saved"
            href="/wishlist"
          />
          <AccountRow
            icon={MapPin}
            label="Saved Addresses"
            sublabel="Not available yet"
            href="#"
          />
          <AccountRow
            icon={User}
            label="Account Details"
            sublabel={userEmail || "No email on file"}
            href="/account-details"
          />
          <AccountRow
            icon={Settings}
            label="Settings"
            sublabel="Coming soon"
            href="#"
          />
          <AccountRow
            icon={HelpCircle}
            label="Help & Support"
            sublabel="Call or message us"
            onClick={() => setShowHelp((v) => !v)}
          />

          {showHelp && (
            <div className="border border-neutral-200 rounded-lg bg-neutral-50 p-4 -mt-1">
              <p className="text-sm font-medium text-ink mb-2 flex items-center gap-2">
                <Phone size={14} /> Reach us
              </p>
              {SUPPORT_PHONES.map((phone) => (
                <button
                  key={phone}
                  onClick={() => callSupport(phone)}
                  className="block text-sm text-spine underline mb-1"
                >
                  +91 {phone}
                </button>
              ))}
              <button
                onClick={emailSupport}
                className="flex items-center gap-1 text-sm text-spine underline mt-2"
              >
                <Mail size={14} /> {SUPPORT_EMAIL}
              </button>
            </div>
          )}

          <AccountRow icon={LogOut} label="Logout" onClick={handleLogout} />
        </div>
      </main>
    </div>
  );
}
