import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import api from "../lib/api";
import { Eye, EyeOff } from "lucide-react";

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
      router.push("/");
    } catch (err) {
      setError("Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    // TEMPORARY: placeholder until Google OAuth is set up with Murtaza's backend.
    setError("Google login isn't set up yet.");
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-sm mx-auto px-6 py-10">
        <h1 className="font-serif text-2xl text-ink mb-1 text-center">Login</h1>
        <p className="text-sm text-neutral-500 mb-6 text-center">
          Login to your account
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-neutral-300 rounded px-3 py-2"
            required
          />

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
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <a
            href="/forgot-password"
            className="text-sm text-spine text-right -mt-1"
          >
            Forgot Password?
          </a>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
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
          className="w-full px-5 py-2 border border-neutral-300 rounded text-ink hover:bg-neutral-50 transition-colors"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-sm text-neutral-500 text-center">
          Don't have an account?{" "}
          <a href="/signup" className="text-spine underline">
            Sign Up
          </a>
        </p>
      </main>
    </div>
  );
}
