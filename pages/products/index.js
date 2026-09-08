import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import ProductCard from "../../components/ProductCard";
import api from "../../lib/api";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "books", label: "Books" },
  { value: "attars", label: "Attars" },
  { value: "caps", label: "Caps" },
  { value: "shalwar-kameez", label: "Shalwar Kameez" },
  { value: "abayas", label: "Abayas" },
  { value: "jilbabs", label: "Jilbabs" },
];

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (router.query.category) setCategory(router.query.category);
  }, [router.query.category]);

  useEffect(() => {
    setLoading(true);
    const query = category ? `?category=${category}` : "";
    api
      .get(`/products${query}`)
      .then((res) => setProducts(res.data))
      .catch(() => setError("Could not load products. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-serif text-2xl text-ink mb-6">Browse products</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1 rounded-full text-sm border ${
                category === c.value
                  ? "bg-spine text-white border-spine"
                  : "border-neutral-300 text-ink"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-neutral-500">Loading products...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  );
}
