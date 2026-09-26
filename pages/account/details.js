import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import api from "../../lib/api";
import {
  ArrowLeft,
  Camera,
  User as UserIcon,
  Mail,
  Phone,
  Wallet,
  CreditCard,
  Building2,
  Banknote,
  Lock,
  ChevronRight,
} from "lucide-react";

const SPINE = "#1e3d32";

// Matches the storage key/shape already established elsewhere in this app
// for payment methods (no backend API for these yet — safe fields only,
// never CVV/PIN/full card number).
const PAYMENT_STORAGE_KEY = "savedPaymentMethods";

function loadPaymentMethods() {
  try {
    const raw = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { upis: [], cards: [] };
  } catch {
    return { upis: [], cards: [] };
  }
}

function extractErrorMessage(err, fallback) {
  if (err.response) return err.response.data?.error || fallback;
  if (err.request) return "Could not reach the server. Please try again.";
  return fallback;
}

function DetailsHeader({ router }) {
  return (
    <header className="flex items-center gap-3 px-4 py-4 max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex-shrink-0"
        style={{ color: SPINE }}
      >
        <ArrowLeft size={22} />
      </button>
      <h1 className="font-serif text-lg font-semibold" style={{ color: SPINE }}>
        Account Details
      </h1>
    </header>
  );
}

function PaymentPreviewRow({ icon: Icon, label, sublabel, href }) {
  const content = (
    <div className="flex items-center gap-3 border border-neutral-200 rounded-lg bg-white p-3.5">
      <Icon size={18} style={{ color: SPINE }} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-neutral-400 truncate">{sublabel}</p>
      </div>
      {href && (
        <ChevronRight size={16} className="text-neutral-300 flex-shrink-0" />
      )}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function AccountDetails() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [user, setUser] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [payment, setPayment] = useState({ upis: [], cards: [] });

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      setChecked(true);
      return;
    }
    setIsLoggedIn(true);
    setPayment(loadPaymentMethods());
    // Real profile data from the backend — not localStorage, not hardcoded.
    api
      .get("/auth/me")
      .then((res) => {
        // If the account was soft-deleted/anonymized, the token might
        // still technically authenticate — don't render ghost data.
        if (res.data.email?.startsWith("deleted-")) {
          window.localStorage.removeItem("token");
          window.localStorage.removeItem("role");
          window.localStorage.removeItem("userName");
          window.localStorage.removeItem("userEmail");
          router.push("/login");
          return;
        }
        setUser(res.data);
        setName(res.data.name || "");
        setPhone(res.data.phone || "");
      })
      .catch((err) => {
        setLoadError(
          extractErrorMessage(err, "Could not load your account details."),
        );
      })
      .finally(() => setChecked(true));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      const res = await api.put("/auth/me", { name, phone });
      setUser(res.data);
      window.localStorage.setItem("userName", res.data.name || "");
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (err) {
      setProfileError(extractErrorMessage(err, "Could not save changes."));
    } finally {
      setProfileLoading(false);
    }
  }

  if (!checked) return null;

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
        <DetailsHeader router={router} />
        <main className="max-w-md mx-auto px-6 py-16 text-center">
          <UserIcon size={40} className="text-neutral-300 mx-auto mb-3" />
          <h1 className="font-serif text-2xl text-ink mb-2">
            Sign in to view your details
          </h1>
          <Link
            href="/login"
            className="inline-block px-5 py-2 rounded text-white text-sm"
            style={{ backgroundColor: SPINE }}
          >
            Login
          </Link>
        </main>
      </div>
    );
  }

  const defaultUpi = payment.upis.find((u) => u.isDefault) || payment.upis[0];
  const defaultCard =
    payment.cards.find((c) => c.isDefault) || payment.cards[0];

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <DetailsHeader router={router} />
      <main className="max-w-2xl mx-auto px-4 pb-10">
        {loadError && <p className="text-red-600 text-sm mb-4">{loadError}</p>}

        {/* Profile */}
        <h2 className="font-medium text-ink mb-3">Profile</h2>
        <form
          onSubmit={handleSave}
          className="border border-neutral-200 rounded-xl bg-white p-4 mb-6"
        >
          <div className="flex flex-col items-center mb-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-2 relative"
              style={{ backgroundColor: "rgba(30,61,50,0.08)" }}
            >
              <UserIcon size={32} style={{ color: SPINE }} />
              <button
                type="button"
                aria-label="Change photo"
                title="Photo upload isn't available yet"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white"
                style={{ backgroundColor: SPINE }}
              >
                <Camera size={13} className="text-white" />
              </button>
            </div>
            <p className="text-xs text-neutral-400">Change Photo</p>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-neutral-500 mb-1">
              Full Name
            </label>
            <div className="flex items-center gap-2 border border-neutral-300 rounded-lg px-3 py-2.5 bg-white">
              <UserIcon size={16} className="text-neutral-400 flex-shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 min-w-0 text-sm outline-none bg-transparent"
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-neutral-500 mb-1">Email</label>
            <div className="flex items-center gap-2 border border-neutral-200 rounded-lg px-3 py-2.5 bg-neutral-50">
              <Mail size={16} className="text-neutral-400 flex-shrink-0" />
              <span className="text-sm text-neutral-500 truncate">
                {user?.email || ""}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Email address cannot be changed.
            </p>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-neutral-500 mb-1">
              Phone Number
            </label>
            <div className="flex items-center gap-2 border border-neutral-300 rounded-lg px-3 py-2.5 bg-white">
              <Phone size={16} className="text-neutral-400 flex-shrink-0" />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit phone number"
                className="flex-1 min-w-0 text-sm outline-none bg-transparent"
              />
            </div>
          </div>

          {profileError && (
            <p className="text-red-600 text-sm mb-2">{profileError}</p>
          )}

          <button
            type="submit"
            disabled={profileLoading}
            className="w-full mt-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: SPINE }}
          >
            {profileLoading
              ? "Saving..."
              : profileSuccess
                ? "Saved ✓"
                : "Save Changes"}
          </button>
        </form>

        {/* Payment Methods preview */}
        <h2 className="font-medium text-ink mb-3">Payment Methods</h2>
        <div className="flex flex-col gap-2 mb-6">
          <PaymentPreviewRow
            icon={Wallet}
            label="UPI"
            sublabel={
              defaultUpi ? `${defaultUpi.handle} (Default)` : "No UPI added yet"
            }
            href="/account/payment-methods"
          />
          <PaymentPreviewRow
            icon={CreditCard}
            label="Credit / Debit Cards"
            sublabel={
              defaultCard
                ? `${defaultCard.type} •••• ${defaultCard.last4}`
                : "No card added yet"
            }
            href="/account/payment-methods"
          />
          <PaymentPreviewRow
            icon={Building2}
            label="Net Banking"
            sublabel="Available at checkout"
          />
          <PaymentPreviewRow
            icon={Banknote}
            label="Cash on Delivery"
            sublabel="Available at checkout"
          />
        </div>

        <PaymentPreviewRow
          icon={Lock}
          label="Change Password"
          sublabel="Update your account password"
          href="/account/change-password"
        />
      </main>
    </div>
  );
}
