import { useEffect, useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import api from "../../../lib/api";
import { Search, RefreshCw } from "lucide-react";

const STATUS_OPTIONS = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  function loadOrders() {
    setLoading(true);
    api
      .get("/admin/orders")
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleStatusChange(order, newStatus) {
    setUpdatingId(order.id);
    try {
      await api.put(`/admin/orders/${order.id}`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)),
      );
    } catch (err) {
      alert("Could not update order status. Try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = orders.filter((o) => {
    const term = search.toLowerCase();
    return (
      o.customerName?.toLowerCase().includes(term) ||
      String(o.orderNumber || o.id)
        .toLowerCase()
        .includes(term)
    );
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Orders</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={loadOrders}
            className="flex items-center gap-1 text-sm text-neutral-500 border border-neutral-300 rounded px-3 py-1.5"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <div className="flex items-center border border-neutral-300 rounded px-3 bg-white">
            <Search size={14} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Search by customer name or order #"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-2 py-1.5 outline-none text-sm w-56"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {loading ? (
          <p className="p-6 text-neutral-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-neutral-400">No orders found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="p-3">Order #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-neutral-100">
                  <td className="p-3 text-ink">#{o.orderNumber || o.id}</td>
                  <td className="p-3 text-ink">{o.customerName || "—"}</td>
                  <td className="p-3 text-neutral-500">
                    {(o.items || [])
                      .map((i) => `${i.quantity} × ${i.name}`)
                      .join(", ")}
                  </td>
                  <td className="p-3 text-ink">₹{o.total}</td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o, e.target.value)}
                      disabled={updatingId === o.id}
                      className={`text-xs rounded px-2 py-1 border-0 font-medium ${
                        STATUS_STYLES[o.status] ||
                        "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <button className="px-3 py-1 border border-neutral-300 rounded text-xs">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
