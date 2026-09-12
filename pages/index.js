import Navbar from "../components/Navbar";
import Link from "next/link";

const CATEGORIES = [
  { value: "books", label: "Books" },
  { value: "attars", label: "Attars" },
  { value: "clothing", label: "Clothing" },
];

export default function Home() {
  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="font-serif text-3xl text-ink">
          Quality Islamic essentials, delivered to your door
        </h1>
        <p className="mt-3 text-neutral-500">
          Books, attars, and modest clothing — across India.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/products?category=${c.value}`}
              className="border-l-4 border-spine bg-white p-6 rounded shadow-sm hover:shadow-md transition-shadow text-ink font-medium"
            >
              {c.label}
            </Link>
          ))}
        </div>

        <Link
          href="/products"
          className="inline-block mt-10 px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity"
        >
          Browse all products
        </Link>
      </main>
    </div>
  );
}
