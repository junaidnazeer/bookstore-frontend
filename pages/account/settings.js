import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import api from "../../lib/api";
import {
  ArrowLeft,
  Bell,
  Globe,
  Lock,
  ShieldCheck,
  FileText,
  Info,
  Trash2,
  ChevronRight,
  User,
} from "lucide-react";

const SPINE = "#1e3d32";
const NOTIF_KEY = "notificationsEnabled";

function extractErrorMessage(err, fallback) {
  // Backend returns { error: "..." }, not { message: "..." }.
  if (err.response) return err.response.data?.error || fallback;
  if (err.request) return "Could not reach the server. Please try again.";
  return fallback;
}

function SettingsHeader({ router }) {
  return (
    <header className="flex items-center gap-3 px-4 py-4 max-w-xl mx-auto">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex-shrink-0"
        style={{ color: SPINE }}
      >
        <ArrowLeft size={22} />
      </button>
      <h1 className="font-serif text-lg font-semibold" style={{ color: SPINE }}>
        Settings
      </h1>
    </header>
  );
}

function SectionLabel({ children, danger }) {
  return (
    <p
      className="text-xs font-medium uppercase tracking-wide mb-2"
      style={{ color: danger ? "#dc2626" : "#a3a3a3" }}
    >
      {children}
    </p>
  );
}

function Row({ icon: Icon, label, href, onClick, danger, right }) {
  const content = (
    <div
      className="flex items-center gap-3 border rounded-lg bg-white p-3.5 hover:shadow-sm transition-shadow"
      style={{ borderColor: danger ? "#fecaca" : "#e5e5e5" }}
    >
      <Icon
        size={18}
        style={{ color: danger ? "#ef4444" : SPINE }}
        className="flex-shrink-0"
      />
      <span
        className="flex-1 text-sm"
        style={{ color: danger ? "#dc2626" : "#1a1a1a" }}
      >
        {label}
      </span>
      {right !== undefined ? (
        right
      ) : (
        <ChevronRight size={16} className="text-neutral-300" />
      )}
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

export default function Settings() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    setIsLoggedIn(!!token);
    const saved = window.localStorage.getItem(NOTIF_KEY);
    setNotifications(saved === null ? true : saved === "true");
    setChecked(true);
  }, []);

  function toggleNotifications() {
    const next = !notifications;
    setNotifications(next);
    window.localStorage.setItem(NOTIF_KEY, String(next));
  }

  async function handleDeleteConfirm() {
    setDeleteError(null);
    setDeleting(true);
    try {
      // Real soft-delete/anonymize endpoint — clears personal info and
      // blocks login, but preserves order history for accounting purposes.
      await api.delete("/auth/me");
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("role");
      window.localStorage.removeItem("userName");
      window.localStorage.removeItem("userEmail");
      router.push("/login");
    } catch (err) {
      setDeleteError(
        extractErrorMessage(
          err,
          "Could not delete your account. Please try again.",
        ),
      );
      setDeleting(false);
    }
  }

  if (!checked) return null;

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
        <SettingsHeader router={router} />
        <main className="max-w-md mx-auto px-6 py-16 text-center">
          <User size={40} className="text-neutral-300 mx-auto mb-3" />
          <h1 className="font-serif text-2xl text-ink mb-2">
            Sign in to view settings
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

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <SettingsHeader router={router} />
      <main className="max-w-xl mx-auto px-4 pb-10">
        <SectionLabel>Preferences</SectionLabel>
        <div className="flex flex-col gap-2 mb-6">
          <Row
            icon={Bell}
            label="Notifications"
            onClick={toggleNotifications}
            right={
              <div
                className="w-10 h-6 rounded-full flex items-center px-0.5 transition-colors"
                style={{
                  backgroundColor: notifications ? SPINE : "#d4d4d4",
                  justifyContent: notifications ? "flex-end" : "flex-start",
                }}
              >
                <div className="w-5 h-5 rounded-full bg-white" />
              </div>
            }
          />
          <Row
            icon={Globe}
            label="Language: English"
            href="#"
            right={<span />}
          />
        </div>

        <SectionLabel>Security</SectionLabel>
        <div className="flex flex-col gap-2 mb-6">
          <Row
            icon={Lock}
            label="Change Password"
            href="/account/change-password"
          />
          <Row icon={ShieldCheck} label="Privacy & Security" href="#" />
        </div>

        <SectionLabel>Legal</SectionLabel>
        <div className="flex flex-col gap-2 mb-6">
          <Row icon={FileText} label="Terms & Conditions" href="#" />
          <Row icon={ShieldCheck} label="Privacy Policy" href="#" />
        </div>

        <SectionLabel>About</SectionLabel>
        <div className="flex flex-col gap-2 mb-6">
          <Row icon={Info} label="About Maktabah Islamiyah" href="#" />
        </div>

        <SectionLabel danger>Danger Zone</SectionLabel>
        <Row
          icon={Trash2}
          label="Delete Account"
          danger
          onClick={() => {
            setDeleteConfirmText("");
            setDeleteError(null);
            setConfirmDelete(true);
          }}
        />
      </main>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="font-medium text-ink mb-1">Delete your account?</h2>
            <p className="text-sm text-neutral-500 mb-3">
              This will remove your personal information and you won't be able
              to log in again. Your past orders are kept for our records, but
              your account is permanently closed. This cannot be undone.
            </p>
            <label className="block text-xs text-neutral-500 mb-1">
              Type DELETE to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none mb-3"
            />
            {deleteError && (
              <p className="text-red-600 text-sm mb-3">{deleteError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
