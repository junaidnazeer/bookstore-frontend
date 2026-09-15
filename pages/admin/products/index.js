import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "../../../components/admin/AdminLayout";
import api from "../../../lib/api";
import { Search } from "lucide-react";

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "books", label: "Books" },
  { value: "attars", label: "Attars" },
  { value: "caps", label: "Caps" },
  { value: "shalwar-kameez", label: "Shalwar Kameez" },
  { value: "abayas", label: "Abayas" },
  { value: "jilbabs", label: "Jilbabs" },
  { value: "prayer-quran-accessories", label: "Prayer & Quran Accessories" },
];

function RestockModal({ product, onClose, onSaved }) {
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    const addAmount = parseInt(quantity, 10);
    if (!addAmount || addAmount <= 0) {
      setError("Enter a valid quantity to add.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const newStock = product.stock + addAmount;
      await api.put(`/admin/products/${product.id}`, { stock: newStock });
      onSaved();
    } catch (err) {
      setError("Could not update stock. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">Restock Product</h2>
          <button onClick={onClose} className="text-neutral-400">
            ✕
          </button>
        </div>
        <p className="font-medium text-ink">{product.name}</p>
        <p className="text-sm text-neutral-500 mb-4">
          Current stock: {product.stock}
        </p>
        <label className="text-sm text-neutral-600 mb-1 block">
          Add stock quantity
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border border-neutral-300 rounded px-3 py-2 mb-2"
          placeholder="e.g. 10"
        />
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 bg-spine text-white rounded font-medium mb-2 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Stock"}
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 border border-neutral-300 rounded text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [restockTarget, setRestockTarget] = useState(null);

  function loadProducts() {
    setLoading(true);
    api
      .get("/admin/products")
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleDelete(product) {
    if (!confirm(`Are you sure you want to remove "${product.name}"?`)) return;
    try {
      await api.delete(`/admin/products/${product.id}`);
      loadProducts();
    } catch (err) {
      alert("Could not delete product. Try again.");
    }
  }

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || p.category?.slug === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Products</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-spine text-white rounded text-sm font-medium"
        >
          + Add New Product
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex items-center border border-neutral-300 rounded px-3 flex-1 bg-white">
          <Search size={16} className="text-neutral-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-2 py-2 outline-none text-sm"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-neutral-300 rounded px-3 py-2 text-sm bg-white"
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {loading ? (
          <p className="p-6 text-neutral-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-neutral-400">No products found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="p-3">Image</th>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100">
                  <td className="p-3">
                    <div className="w-10 h-10 bg-neutral-100 rounded overflow-hidden">
                      {p.imageUrls?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrls[0]}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-ink font-medium">{p.name}</td>
                  <td className="p-3 text-neutral-500 capitalize">
                    {p.category?.name}
                  </td>
                  <td className="p-3 text-ink">₹{p.price}</td>
                  <td className="p-3">
                    <span
                      className={
                        p.stock <= 10 ? "text-red-600 font-medium" : "text-ink"
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2 flex-wrap">
                    <button
                      onClick={() => setRestockTarget(p)}
                      className="px-3 py-1 border border-neutral-300 rounded text-xs"
                    >
                      Restock
                    </button>
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="px-3 py-1 border border-spine text-spine rounded text-xs"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p)}
                      className="px-3 py-1 border border-red-300 text-red-600 rounded text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {restockTarget && (
        <RestockModal
          product={restockTarget}
          onClose={() => setRestockTarget(null)}
          onSaved={() => {
            setRestockTarget(null);
            loadProducts();
          }}
        />
      )}
    </AdminLayout>
  );
}
