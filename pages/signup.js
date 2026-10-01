import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff, User, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import api from "../lib/api";

const SPINE = "#1e3d32";

function GoogleIcon({ size = 18 }) {
  // Same official multicolor Google "G" mark used on the Login page.
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001 6.19 5.238 6.19 5.238C39.605 40.235 44 33.5 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

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
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-10 h-12 text-center border border-neutral-300 rounded-lg text-lg"
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
  const emailRefs = useRef([]);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Button stays disabled until every real requirement is actually met —
  // not just checked on submit.
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    isPasswordValid(password) &&
    confirmPassword.length > 0 &&
    agreedToTerms;

  async function handleCreateAccount(e) {
    e.preventDefault();
    setError(null);
    if (!isPasswordValid(password)) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreedToTerms) {
      setError("Please agree to the Terms & Conditions.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { email });
      setStep(2);
      setResendTimer(RESEND_SECONDS);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not send verification code."));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmail(e) {
    e.preventDefault();
    setError(null);
    const code = emailDigits.join("");
    if (code.length !== 6) {
      setError("Enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-signup", {
        name,
        email,
        phone,
        password,
        otp: code,
      });
      window.localStorage.setItem("token", res.data.token);
      window.localStorage.setItem("role", res.data.user?.role || "CUSTOMER");
      window.localStorage.setItem("userName", res.data.user?.name || "");
      window.localStorage.setItem("userEmail", res.data.user?.email || "");
      setStep(3);
    } catch (err) {
      setError(extractErrorMessage(err, "Invalid or expired code."));
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSignup() {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  }

  async function resendCode() {
    setError(null);
    try {
      await api.post("/auth/send-otp", { email });
      setResendTimer(RESEND_SECONDS);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not resend code."));
    }
  }

  return (
    <AuthLayout>
      {step === 1 && (
        <>
          <h1
            className="font-serif text-2xl sm:text-3xl font-semibold text-center mb-1"
            style={{ color: SPINE }}
          >
            Create Your Account
          </h1>
          <p className="text-sm text-neutral-500 text-center mb-6 leading-snug">
            Join Maktabah Islamiyah and explore
            <br className="hidden sm:block" /> authentic Islamic products.
          </p>

          <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-neutral-600 mb-1 block">
                Full Name
              </label>
              <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
                <User size={16} className="text-neutral-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-2 py-2.5 outline-none text-sm min-w-0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-neutral-600 mb-1 block">
                Email Address
              </label>
              <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
                <Mail size={16} className="text-neutral-400 flex-shrink-0" />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-2 py-2.5 outline-none text-sm min-w-0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-neutral-600 mb-1 block">
                Phone Number{" "}
                <span className="text-neutral-400 font-normal"></span>
              </label>
              <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
                <Phone size={16} className="text-neutral-400 flex-shrink-0" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 px-2 py-2.5 outline-none text-sm min-w-0"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-neutral-600 mb-1 block">
                Password
              </label>
              <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
                <Lock size={16} className="text-neutral-400 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 px-2 py-2.5 outline-none text-sm min-w-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-neutral-400 hover:text-ink flex-shrink-0"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && !isPasswordValid(password) ? (
                <p className="text-xs text-red-500 mt-1">
                  {getPasswordErrorMessage(password)}
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
                Confirm Password
              </label>
              <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
                <Lock size={16} className="text-neutral-400 flex-shrink-0" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 px-2 py-2.5 outline-none text-sm min-w-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="text-neutral-400 hover:text-ink flex-shrink-0"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-neutral-300"
                style={{ accentColor: SPINE }}
              />
              <span>
                I agree to the{" "}
                <a
                  href="/legal/terms"
                  className="underline"
                  style={{ color: SPINE }}
                >
                  Terms &amp; Conditions
                </a>{" "}
                and{" "}
                <a
                  href="/legal/privacy-policy"
                  className="underline"
                  style={{ color: SPINE }}
                >
                  Privacy Policy
                </a>
              </span>
            </label>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="flex items-center justify-center gap-2 px-5 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: SPINE }}
            >
              {loading ? (
                "Creating account..."
              ) : (
                <>
                  Create Account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400">OR</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 border border-neutral-300 rounded-lg text-ink hover:bg-neutral-50 transition-colors text-sm"
          >
            <GoogleIcon size={18} />
            Continue with Google
          </button>

          <p className="mt-6 text-sm text-neutral-500 text-center">
            Already have an account?{" "}
            <a href="/login" className="underline" style={{ color: SPINE }}>
              Log In
            </a>
          </p>
        </>
      )}

      {step === 2 && (
        <>
          <h1
            className="font-serif text-2xl sm:text-3xl font-semibold text-center mb-1"
            style={{ color: SPINE }}
          >
            Verify your email
          </h1>
          <p className="text-sm text-neutral-500 text-center mb-6">
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
              disabled={loading}
              className="px-5 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: SPINE }}
            >
              {loading ? "Verifying..." : "Verify Email"}
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
                  className="underline"
                  style={{ color: SPINE }}
                >
                  Resend Code
                </button>
              )}
            </p>
          </form>
        </>
      )}

      {step === 3 && (
        <div className="text-center">
          <div className="text-4xl mb-4">✓</div>
          <h1
            className="font-serif text-2xl sm:text-3xl font-semibold mb-2"
            style={{ color: SPINE }}
          >
            Account verified!
          </h1>
          <p className="text-neutral-500 mb-8">
            Welcome to Maktabah Islamiyah 🎉
          </p>
          <button
            onClick={() => router.push("/products")}
            className="px-5 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: SPINE }}
          >
            Start Shopping
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
