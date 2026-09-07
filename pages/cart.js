import Navbar from "../components/Navbar";

export default function Cart() {
  // TODO: replace with real cart state (context or a store) once
  // the "add to cart" flow is wired up.
  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6">Your cart</h1>
        <p className="text-neutral-500">Your cart is empty.</p>
      </main>
    </div>
  );
}
