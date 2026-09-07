import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import api from "../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      window.localStorage.setItem("token", res.data.token);
      router.push("/");
    } catch (err) {
      setError("Login failed. Check your email and password.");
    }
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-sm mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6">Log in</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="mt-2 px-5 py-2 bg-neutral-900 text-white rounded"
          >
            Log in
          </button>
        </form>
      </main>
    </div>
  );
}
