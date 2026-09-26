import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import api from "../lib/api";

function extractErrorMessage(err, fallback) {
  if (err.response) return err.response.data?.error || fallback;
  if (err.request) return "Could not reach the server. Please try again.";
  return fallback;
}

const RESEND_SECONDS = 30;

function maskEmail(email) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  return `${user.slice(0, 4)}${"*".repeat(Math.max(user.length - 4, 2))}@${domain}`;
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

function OtpInput({ digits, setDigits, refs }) {
  function handleChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex justify-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete="one-time-code"
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-10 h-12 text-center border border-neutral-300 rounded-lg text-lg"
        />
      ))}
    </div>
  );
}

// Steps: 1 = enter email, 2 = enter code, 3 = enter new password, 4 = success
export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleSendCode(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setStep(2);
      setResendTimer(RESEND_SECONDS);
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          "Could not send reset code. Check the email and try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setError(null);
    try {
      await api.post("/auth/forgot-password", { email });
      setResendTimer(RESEND_SECONDS);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not resend code."));
    }
  }

  function handleContinueFromCode(e) {
    e.preventDefault();
    setError(null);
    const code = codeDigits.join("");
    if (code.length !== 6) {
      setError("Enter the complete 6-digit code.");
      return;
    }
    // Note: the backend has no separate "verify code" endpoint — the code is
    // only actually checked when /auth/reset-password is called on the next
    // step. If it's wrong, the error will surface there instead of here.
    setStep(3);
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError(null);
    const code = codeDigits.join("");
    if (!isPasswordValid(newPassword)) {
      setError(getPasswordErrorMessage(newPassword));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email,
        otp: code,
        newPassword,
      });
      setStep(4);
    } catch (err) {
      setError(extractErrorMessage(err, "Invalid or expired code."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {step === 1 && (
        <>
          <h1 className="font-serif text-3xl font-semibold text-ink text-center mb-1">
            Forgot Password
          </h1>
          <p className="text-sm text-neutral-500 text-center mb-6">
            Enter your email and we'll send you a reset code
          </p>

          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-neutral-600 mb-1 block">
                Email
              </label>
              <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
                <Mail size={16} className="text-neutral-400 flex-shrink-0" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-2 py-2 outline-none text-sm"
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-spine text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>

          <p className="mt-6 text-sm text-neutral-500 text-center">
            Remembered your password?{" "}
            <a href="/login" className="text-spine underline">
              Login
            </a>
          </p>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="font-serif text-3xl font-semibold text-ink text-center mb-1">
            Enter the code
          </h1>
          <p className="text-sm text-neutral-500 text-center mb-6">
            We sent a 6-digit code to
            <br />
            <span className="text-ink">{maskEmail(email)}</span>
          </p>
          <form
            onSubmit={handleContinueFromCode}
            className="flex flex-col gap-4"
          >
            <OtpInput
              digits={codeDigits}
              setDigits={setCodeDigits}
              refs={codeRefs}
            />

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className="px-5 py-3 bg-spine text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Continue
            </button>

            <p className="text-sm text-neutral-500 text-center">
              Didn't receive the code?{" "}
              {resendTimer > 0 ? (
                <span className="text-neutral-400">
                  Resend in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={resendCode}
                  className="text-spine underline"
                >
                  Resend Code
                </button>
              )}
            </p>
          </form>
        </>
      )}

      {step === 3 && (
        <>
          <h1 className="font-serif text-3xl font-semibold text-ink text-center mb-1">
            Set a new password
          </h1>
          <p className="text-sm text-neutral-500 text-center mb-6">
            Choose a new password for your account
          </p>
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-neutral-600 mb-1 block">
                New Password
              </label>
              <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
                <Lock size={16} className="text-neutral-400 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 px-2 py-2 outline-none text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-neutral-400 hover:text-ink flex-shrink-0 pr-1 sm:pr-0"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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

            <div>
              <label className="text-sm text-neutral-600 mb-1 block">
                Confirm New Password
              </label>
              <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
                <Lock size={16} className="text-neutral-400 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 px-2 py-2 outline-none text-sm"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-spine text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </>
      )}

      {step === 4 && (
        <div className="text-center">
          <div className="text-4xl mb-4">✓</div>
          <h1 className="font-serif text-3xl font-semibold text-ink mb-2">
            Password reset!
          </h1>
          <p className="text-neutral-500 mb-8">
            Your password has been changed successfully.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-5 py-3 bg-spine text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Back to Login
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
