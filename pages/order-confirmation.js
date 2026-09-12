import { useRouter } from "next/router";
import Navbar from "../components/Navbar";

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = router.query;

  return (
    <div>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h1 className="font-serif text-2xl text-ink mb-2">Order placed!</h1>
        <p className="text-neutral-500 mb-2">
          Your order{orderId ? ` #${orderId}` : ""} has been received.
        </p>
        <p className="text-neutral-500 mb-8">We'll notify you once it ships.</p>
        <button
          onClick={() => router.push("/products")}
          className="px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity"
        >
          Continue shopping
        </button>
      </main>
    </div>
  );
}
