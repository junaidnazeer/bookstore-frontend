import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ShieldUser,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import MosqueIcon from "../../components/MosqueIcon";
import api from "../../lib/api";

// One message for "wrong password", "unknown email" AND "valid account that
// isn't an admin" — so this page never reveals which accounts exist or which
// of them have admin access.
const INVALID_CREDENTIALS = "Invalid email or password. Please try again.";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      // Same endpoint the storefront login uses; the backend decides who is
      // an ADMIN, this page only checks the role it hands back.
      const res = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });
      const user = res.data?.user;

      if (!res.data?.token || user?.role !== "ADMIN") {
        // Valid customer account (or malformed reply): never start a session.
        setError(INVALID_CREDENTIALS);
        setLoading(false);
        return;
      }

      window.localStorage.setItem("token", res.data.token);
      window.localStorage.setItem("role", user.role);
      router.push("/admin/dashboard");
      // keep the button in its "Signing in..." state until the page changes
    } catch (err) {
      const status = err.response?.status;
      if (!err.response) {
        setError(
          "Could not reach the server. Please check your connection and try again.",
        );
      } else if (status === 429) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else if (status >= 500) {
        setError("Something went wrong on our side. Please try again shortly.");
      } else {
        setError(INVALID_CREDENTIALS);
      }
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Admin Login | Maktabah Islamiyah</title>
      </Head>

      {/* Warm Islamic backdrop: wide scene on laptops/desktops, a narrower
          portrait composition on phones and tablets. */}
      <div className="relative min-h-dvh w-full overflow-x-hidden max-md:-mb-[calc(80px+env(safe-area-inset-bottom,0px))] bg-[#efe8da] bg-cover bg-bottom bg-no-repeat bg-[url('/admin-login/admin-bg-mobile.jpg')] lg:bg-[url('/admin-login/admin-bg-desktop.jpg')]">
        <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[520px] flex-col items-center justify-center px-4 py-4 [@media(min-height:881px)]:sm:py-10">
          {/* Brand */}
          <div className="mb-4 flex flex-col items-center text-center [@media(min-height:881px)]:sm:mb-8">
            <MosqueIcon
              size={84}
              className="h-12 w-12 text-spine [@media(min-height:881px)]:sm:h-[84px] [@media(min-height:881px)]:sm:w-[84px]"
            />
            <div className="mt-2 font-serif text-[30px] font-semibold leading-none tracking-tight text-spine [@media(min-height:881px)]:sm:text-[42px]">
              Maktabah Islamiyah
            </div>
            <p className="mt-2.5 text-[12px] tracking-[0.16em] text-spine sm:text-[15px]">
              Faith • Knowledge • Lifestyle
            </p>
          </div>

          {/* Card */}
          <div className="w-full rounded-xl border border-white/70 bg-paper px-5 py-5 shadow-[0_12px_40px_-14px_rgba(30,61,50,0.28)] sm:px-10 [@media(min-height:881px)]:sm:py-9">
            <div className="text-center">
              <ShieldUser
                size={52}
                strokeWidth={1.5}
                className="mx-auto h-11 w-11 text-spine [@media(min-height:881px)]:sm:h-[52px] [@media(min-height:881px)]:sm:w-[52px]"
              />
              <h1 className="mt-2 font-serif text-[28px] font-semibold text-spine [@media(min-height:881px)]:sm:text-[36px]">
                Admin Login
              </h1>
              <p className="mt-1 text-[15px] text-neutral-500 sm:text-base">
                Access your admin panel
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-5 flex flex-col gap-3.5 [@media(min-height:881px)]:sm:mt-7 [@media(min-height:881px)]:sm:gap-5"
            >
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-1.5 block text-[15px] font-medium text-spine [@media(min-height:881px)]:sm:mb-2"
                >
                  Email Address
                </label>
                <div className="flex h-12 items-center gap-3 rounded-lg border border-neutral-300 bg-white/60 px-4 transition focus-within:border-spine focus-within:ring-2 focus-within:ring-spine/15 [@media(min-height:881px)]:sm:h-14">
                  <Mail size={20} className="flex-shrink-0 text-spine" />
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-neutral-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-1.5 block text-[15px] font-medium text-spine [@media(min-height:881px)]:sm:mb-2"
                >
                  Password
                </label>
                <div className="flex h-12 items-center gap-3 rounded-lg border border-neutral-300 bg-white/60 px-4 transition focus-within:border-spine focus-within:ring-2 focus-within:ring-spine/15 [@media(min-height:881px)]:sm:h-14">
                  <Lock size={20} className="flex-shrink-0 text-spine" />
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-neutral-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="flex-shrink-0 text-neutral-500 transition-colors hover:text-spine"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>

              <div className="-mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-spine underline underline-offset-2 hover:opacity-80"
                >
                  Forgot Password?
                </Link>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-spine text-base font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 [@media(min-height:881px)]:sm:h-14"
              >
                <>
                  Login
                  <ArrowRight size={18} />
                </>
              </button>
            </form>

            <div className="mt-4 [@media(min-height:881px)]:sm:mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[15px] text-neutral-600 transition-colors hover:text-spine"
              >
                <ArrowLeft size={18} />
                Back to Store
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
