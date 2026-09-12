import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { Eye, EyeOff } from "lucide-react";
import api from "../lib/api";

const RESEND_SECONDS = 30;

function maskEmail(email) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  return `${user.slice(0, 4)}${"*".repeat(Math.max(user.length - 4, 2))}@${domain}`;
}

function maskPhone(phone) {
  return `+91 ${"*".repeat(6)}${phone.slice(-4)}`;
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
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-10 h-12 text-center border border-neutral-300 rounded text-lg"
        />
      ))}
    </div>
  );
}

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailDigits, setEmailDigits] = useState(["", "", "", "", "", ""]);
  const [phoneDigits, setPhoneDigits] = useState(["", "", "", "", "", ""]);
  const emailRefs = useRef([]);
  const phoneRefs = useRef([]);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  function handleCreateAccount(e) {
    e.preventDefault();
    setError(null);
    if (!isPasswordValid(password)) {
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      setError("Please agree to the Terms & Conditions.");
      return;
    }
    // TEMPORARY: skips real signup + email OTP API calls for UI testing
    // since backend isn't ready. Revert to real api.post("/auth/signup", ...)
    // and api.post("/auth/send-email-otp", ...) once Murtaza's endpoints exist.
    setStep(2);
    setResendTimer(RESEND_SECONDS);
  }

  function handleVerifyEmail(e) {
    e.preventDefault();
    setError(null);
    const code = emailDigits.join("");
    if (code.length !== 6) {
      setError("Enter the complete 6-digit code.");
      return;
    }
    setStep(3);
    setResendTimer(RESEND_SECONDS);
  }

  function handleVerifyPhone(e) {
    e.preventDefault();
    setError(null);
    const code = phoneDigits.join("");
    if (code.length !== 6) {
      setError("Enter the complete 6-digit OTP.");
      return;
    }
    setStep(4);
  }

  function resendCode() {
    setResendTimer(RESEND_SECONDS);
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-sm mx-auto px-6 py-10">
        {step === 1 && (
          <>
            <h1 className="font-serif text-2xl text-ink mb-1">
              Create your account
            </h1>
            <p className="text-sm text-neutral-500 mb-6">
              Sign up to start shopping
            </p>
            <form
              onSubmit={handleCreateAccount}
              className="flex flex-col gap-3"
            >
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-neutral-300 rounded px-3 py-2"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-neutral-300 rounded px-3 py-2"
                required
              />
              <div className="flex border border-neutral-300 rounded overflow-hidden">
                <span className="px-3 py-2 bg-neutral-50 text-neutral-500 border-r border-neutral-300">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 px-3 py-2 outline-none"
                  required
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-neutral-300 rounded px-3 py-2 w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password.length > 0 && !isPasswordValid(password) ? (
                <p className="text-xs text-red-500 -mt-1">
                  {getPasswordErrorMessage(password)}
                </p>
              ) : (
                <p className="text-xs text-neutral-400 -mt-1">
                  Must be 8+ characters with uppercase, lowercase, number &
                  special character.
                </p>
              )}

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border border-neutral-300 rounded px-3 py-2 w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-ink transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                I agree to Terms & Conditions
              </label>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Create Account
              </button>
            </form>
            <p className="mt-4 text-sm text-neutral-500 text-center">
              Already have an account?{" "}
              <a href="/login" className="text-spine underline">
                Login
              </a>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-serif text-2xl text-ink mb-1 text-center">
              Verify your email
            </h1>
            <p className="text-sm text-neutral-500 mb-6 text-center">
              We sent a 6-digit code to
              <br />
              <span className="text-ink">{maskEmail(email)}</span>
            </p>
            <form onSubmit={handleVerifyEmail} className="flex flex-col gap-4">
              <OtpInput
                digits={emailDigits}
                setDigits={setEmailDigits}
                refs={emailRefs}
              />
              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                className="px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity"
              >
                Verify Email
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
            <h1 className="font-serif text-2xl text-ink mb-1 text-center">
              Verify your phone
            </h1>
            <p className="text-sm text-neutral-500 mb-6 text-center">
              We sent a 6-digit OTP to
              <br />
              <span className="text-ink">{maskPhone(phone)}</span>
            </p>
            <form onSubmit={handleVerifyPhone} className="flex flex-col gap-4">
              <OtpInput
                digits={phoneDigits}
                setDigits={setPhoneDigits}
                refs={phoneRefs}
              />
              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                className="px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity"
              >
                Verify Phone
              </button>
              <p className="text-sm text-neutral-500 text-center">
                Didn't receive the OTP?{" "}
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
                    Resend OTP
                  </button>
                )}
              </p>
            </form>
          </>
        )}

        {step === 4 && (
          <div className="text-center">
            <div className="text-4xl mb-4">✓</div>
            <h1 className="font-serif text-2xl text-ink mb-2">
              Account verified!
            </h1>
            <p className="text-neutral-500 mb-8">Welcome to Bookstore 🎉</p>
            <button
              onClick={() => router.push("/products")}
              className="px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity"
            >
              Start Shopping
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
