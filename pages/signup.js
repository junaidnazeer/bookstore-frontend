import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import api from "../lib/api";

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = enter phone, 2 = enter OTP + details
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { phone });
      setStep(2);
    } catch (err) {
      setError("Could not send OTP. Check the number and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndSignup(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/signup", {
        name,
        email,
        phone,
        password,
        otp,
      });
      window.localStorage.setItem("token", res.data.token);
      router.push("/");
    } catch (err) {
      setError("Invalid OTP or details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-sm mx-auto px-6 py-10">
        <h1 className="font-serif text-2xl text-ink mb-6">Create account</h1>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2"
              required
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={handleVerifyAndSignup}
            className="flex flex-col gap-3"
          >
            <p className="text-sm text-neutral-500">
              OTP sent to {phone}.{" "}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-spine underline"
              >
                Change number
              </button>
            </p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Full name"
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
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-neutral-300 rounded px-3 py-2"
              required
              minLength={6}
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Sign up"}
            </button>
          </form>
        )}

        <p className="mt-4 text-sm text-neutral-500 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-spine underline">
            Log in
          </a>
        </p>
      </main>
    </div>
  );
}
