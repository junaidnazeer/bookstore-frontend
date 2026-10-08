import { useState } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import api from "../lib/api";

const SPINE = "#1e3d32";

function GoogleIcon({ size = 18 }) {
  // Official multicolor Google "G" mark, not a placeholder.
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

const REMEMBER_KEY = "rememberMe";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });

      // Remembered → localStorage (survives closing the browser). Not
      // remembered → sessionStorage (cleared when the tab/browser closes).
      const storage = rememberMe ? window.localStorage : window.sessionStorage;
      storage.setItem("token", res.data.token);
      storage.setItem("role", res.data.user?.role || "CUSTOMER");
      storage.setItem("userName", res.data.user?.name || "");
      storage.setItem("userEmail", res.data.user?.email || "");

      if (res.data.user?.role === "ADMIN") {
        router.push("/admin/products");
      } else {
        const redirectTo =
          typeof router.query.redirect === "string"
            ? router.query.redirect
            : "/";
        router.push(redirectTo);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Login failed. Check your email and password.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  }

  return (
    <AuthLayout>
      <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink text-center mb-1">
        Welcome Back
      </h1>
      <p className="text-sm text-neutral-500 text-center mb-6 leading-snug">
        Log in to your Maktabah Islamiyah account
        <br className="hidden sm:block" /> and continue your journey.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            Password
          </label>
          <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
            <Lock size={16} className="text-neutral-400 flex-shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
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
        </div>

        <div className="flex items-center justify-between -mt-1">
          <label className="flex items-center gap-2 text-sm text-neutral-600 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 accent-current"
              style={{ accentColor: SPINE }}
            />
            Remember me
          </label>
          <a
            href="/forgot-password"
            className="text-sm"
            style={{ color: SPINE }}
          >
            Forgot password?
          </a>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: SPINE }}
        >
          <>Log In</>
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-xs text-neutral-400">OR</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-2.5 px-5 py-3 border border-neutral-300 rounded-lg text-ink hover:bg-neutral-50 transition-colors text-sm"
      >
        <GoogleIcon size={18} />
        Continue with Google
      </button>

      <p className="mt-6 text-sm text-neutral-500 text-center">
        Don't have an account?{" "}
        <a href="/signup" className="underline" style={{ color: SPINE }}>
          Sign Up
        </a>
      </p>
    </AuthLayout>
  );
}
