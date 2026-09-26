import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import api from "../../lib/api";
import { ArrowLeft, Lock, Eye, EyeOff, User } from "lucide-react";

const SPINE = "#1e3d32";

function extractErrorMessage(err, fallback) {
  // Backend returns { error: "..." }, not { message: "..." }.
  if (err.response) return err.response.data?.error || fallback;
  if (err.request) return "Could not reach the server. Please try again.";
  return fallback;
}

function getPasswordChecks(password) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function isPasswordValid(password) {
  return Object.values(getPasswordChecks(password)).every(Boolean);
}

function getPasswordErrorMessage(password) {
  const checks = getPasswordChecks(password);
  const missing = [];
  if (!checks.length) missing.push("at least 8 characters");
  if (!checks.uppercase) missing.push("one uppercase letter");
  if (!checks.lowercase) missing.push("one lowercase letter");
  if (!checks.number) missing.push("one number");
  if (!checks.special) missing.push("one special character");
  if (missing.length === 0) return null;
  return `Password must contain ${missing.join(", ")}.`;
}

function PasswordHeader({ router }) {
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
        Change Password
      </h1>
    </header>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-neutral-500 mb-1">{label}</label>
      <div className="flex items-center gap-2 border border-neutral-300 rounded-lg px-3 py-2.5 bg-white">
        <Lock size={16} className="text-neutral-400 flex-shrink-0" />
        <input
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 text-sm outline-none bg-transparent"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="text-neutral-400 hover:text-ink flex-shrink-0"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePassword() {
  const router = useRouter();
  const [isLoggedIn] = useState(
    typeof window !== "undefined" && !!window.localStorage.getItem("token"),
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
        <PasswordHeader router={router} />
        <main className="max-w-md mx-auto px-6 py-16 text-center">
          <User size={40} className="text-neutral-300 mx-auto mb-3" />
          <h1 className="font-serif text-2xl text-ink mb-2">
            Sign in to change your password
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setError("New password must be different from your current password.");
      return;
    }
    if (!isPasswordValid(newPassword)) {
      setError(getPasswordErrorMessage(newPassword));
      return;
    }

    setLoading(true);
    try {
      await api.put("/auth/me", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not change your password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <PasswordHeader router={router} />
      <main className="max-w-xl mx-auto px-4 pb-10">
        <div className="flex items-center gap-3 border border-neutral-200 rounded-xl bg-white p-4 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(30,61,50,0.08)" }}
          >
            <Lock size={20} style={{ color: SPINE }} />
          </div>
          <p className="text-sm text-ink">
            Update your password for better security.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-neutral-200 rounded-xl bg-white p-4"
        >
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggleShow={() => setShowCurrent((v) => !v)}
            autoComplete="current-password"
          />
          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew((v) => !v)}
            autoComplete="new-password"
          />
          {newPassword.length > 0 && !isPasswordValid(newPassword) ? (
            <p className="text-xs text-red-500 -mt-2 mb-3">
              {getPasswordErrorMessage(newPassword)}
            </p>
          ) : (
            <p className="text-xs text-neutral-400 -mt-2 mb-3">
              Must be 8+ characters with uppercase, lowercase, number & special
              character.
            </p>
          )}
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggleShow={() => setShowConfirm((v) => !v)}
            autoComplete="new-password"
          />

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          {success && (
            <p className="text-green-600 text-sm mb-3">
              Password changed successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: SPINE }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </main>
    </div>
  );
}
