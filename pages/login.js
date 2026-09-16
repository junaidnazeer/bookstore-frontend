import { useState } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import api from "../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      window.localStorage.setItem("token", res.data.token);
      window.localStorage.setItem("role", res.data.user?.role || "CUSTOMER");
      if (res.data.user?.role === "ADMIN") {
        router.push("/admin/products");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setError("Google login isn't set up yet.");
  }

  return (
    <AuthLayout>
      <h1 className="font-serif text-3xl font-semibold text-ink text-center mb-1">
        Login
      </h1>
      <p className="text-sm text-neutral-500 text-center mb-6">
        Login to your account
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-neutral-600 mb-1 block">Email</label>
          <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
            <Mail size={16} className="text-neutral-400 flex-shrink-0" />
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-2 py-2 outline-none text-sm"
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
        </div>

        <a
          href="/forgot-password"
          className="text-sm text-spine text-right -mt-2"
        >
          Forgot Password?
        </a>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 bg-spine text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-xs text-neutral-400">OR</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full px-5 py-3 border border-neutral-300 rounded-lg text-ink hover:bg-neutral-50 transition-colors text-sm"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-sm text-neutral-500 text-center">
        Don't have an account?{" "}
        <a href="/signup" className="text-spine underline">
          Sign Up
        </a>
      </p>
    </AuthLayout>
  );
}
