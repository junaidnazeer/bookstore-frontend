import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { User, Phone, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import api from "../lib/api";

function extractErrorMessage(err, fallback) {
  if (err.response) return err.response.data?.message || fallback;
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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      setChecked(true);
      return;
    }
    setIsLoggedIn(true);
    api
      .get("/auth/me")
      .then((res) => {
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

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      const res = await api.put("/auth/me", { name, phone });
      setUser(res.data);
      window.localStorage.setItem("userName", res.data.name || "");
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(extractErrorMessage(err, "Could not save changes."));
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (!currentPassword || !newPassword) {
      setPasswordError("Enter both your current and new password.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from your current password.",
      );
      return;
    }
    if (!isPasswordValid(newPassword)) {
      setPasswordError(getPasswordErrorMessage(newPassword));
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put("/auth/me", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(
        extractErrorMessage(err, "Could not change your password."),
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  if (!checked) return null;

  if (!isLoggedIn) {
    return (
      <div>
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-16 text-center">
          <User size={40} className="text-neutral-300 mx-auto mb-3" />
          <h1 className="font-serif text-2xl text-ink mb-2">
            Sign in to view your account details
          </h1>
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
      <main className="max-w-xl mx-auto px-6 py-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-ink mb-4"
        >
          <ArrowLeft size={14} /> Back to Account
        </Link>

        <h1 className="font-serif text-2xl text-ink mb-1">Account Details</h1>
        <p className="text-neutral-500 mb-6">
          Manage your name, phone number, and password.
        </p>

        {loadError && <p className="text-red-600 text-sm mb-4">{loadError}</p>}

        <form
          onSubmit={handleProfileSubmit}
          className="border border-neutral-200 rounded-lg bg-white p-5 mb-6 flex flex-col gap-4"
        >
          <h2 className="font-medium text-ink">Profile</h2>

          <div>
            <label className="text-sm text-neutral-600 mb-1 block">Email</label>
            <div className="flex items-center border border-neutral-200 bg-neutral-50 rounded-lg px-3 py-2">
              <span className="text-sm text-neutral-500">
                {user?.email || ""}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Email address cannot be changed.
            </p>
          </div>

          <div>
            <label className="text-sm text-neutral-600 mb-1 block">
              Full Name
            </label>
            <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
              <User size={16} className="text-neutral-400 flex-shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-2 py-2 outline-none text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-neutral-600 mb-1 block">
              Phone Number
            </label>
            <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
              <Phone size={16} className="text-neutral-400 flex-shrink-0" />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="flex-1 px-2 py-2 outline-none text-sm"
                required
              />
            </div>
          </div>

          {profileError && (
            <p className="text-red-600 text-sm">{profileError}</p>
          )}
          {profileSuccess && (
            <p className="text-green-600 text-sm">Profile updated.</p>
          )}

          <button
            type="submit"
            disabled={profileLoading}
            className="self-start px-5 py-2.5 bg-spine text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {profileLoading ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          className="border border-neutral-200 rounded-lg bg-white p-5 flex flex-col gap-4"
        >
          <h2 className="font-medium text-ink">Change Password</h2>

          <div>
            <label className="text-sm text-neutral-600 mb-1 block">
              Current Password
            </label>
            <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
              <Lock size={16} className="text-neutral-400 flex-shrink-0" />
              <input
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="flex-1 px-2 py-2 outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="text-neutral-400 hover:text-ink flex-shrink-0 pr-1 sm:pr-0"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-neutral-600 mb-1 block">
              New Password
            </label>
            <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
              <Lock size={16} className="text-neutral-400 flex-shrink-0" />
              <input
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 px-2 py-2 outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="text-neutral-400 hover:text-ink flex-shrink-0 pr-1 sm:pr-0"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword.length > 0 && !isPasswordValid(newPassword) ? (
              <p className="text-xs text-red-500 mt-1">
                {getPasswordErrorMessage(newPassword)}
              </p>
            ) : (
              <p className="text-xs text-neutral-400 mt-1">
                Must be 8+ characters with uppercase, lowercase, number &
                special character.
              </p>
            )}
          </div>

          {passwordError && (
            <p className="text-red-600 text-sm">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-green-600 text-sm">Password changed.</p>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="self-start px-5 py-2.5 bg-spine text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </main>
    </div>
  );
}
