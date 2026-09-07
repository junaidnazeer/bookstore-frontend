import Navbar from "../components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">
          Find your next book
        </h1>
        <p className="mt-3 text-neutral-500">
          Browse our collection and get books delivered across India.
        </p>
        <Link
          href="/books"
          className="inline-block mt-6 px-5 py-2 bg-neutral-900 text-white rounded"
        >
          Browse books
        </Link>
      </main>
    </div>
  );
}
