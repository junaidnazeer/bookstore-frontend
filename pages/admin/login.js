import { useState } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff } from "lucide-react";
import MosqueIcon from "../../components/MosqueIcon";
import api from "../../lib/api";

export default function AdminLogin() {
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
      if (res.data.user?.role !== "ADMIN") {
        setError("This account doesn't have admin access.");
        setLoading(false);
        return;
      }
      window.localStorage.setItem("token", res.data.token);
      window.localStorage.setItem("role", res.data.user.role);
      router.push("/admin/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left: dark hero panel */}
      <div
        className="hidden md:flex flex-col justify-end p-10 text-white relative"
        style={{
          backgroundColor: "#1E3D32",
          backgroundImage:
            "url('https://images.pexels.com/photos/37697015/pexels-photo-37697015.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <MosqueIcon size={32} className="text-white" />
            <div>
              <p className="font-serif text-lg leading-tight">
                Maktabah Islamiyah
              </p>
              <p className="text-xs text-white/70">Islamic Store</p>
            </div>
          </div>
          <h1 className="font-serif text-3xl mb-2">Admin Portal</h1>
          <p className="text-white/80">Sign in to manage your store</p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-ink mb-6">Admin Login</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-neutral-600 mb-1 block">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-neutral-300 rounded px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-sm text-neutral-600 mb-1 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-spine text-white rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm text-neutral-500 hover:text-spine"
          >
            ← Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}
