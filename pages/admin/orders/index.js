import { useEffect, useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import api from "../../../lib/api";
import { Search, RefreshCw, ShoppingBag } from "lucide-react";

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
  const [shipModalOrder, setShipModalOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState("");

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

  async function submitStatusUpdate(order, newStatus, trackingNumber) {
    setUpdatingId(order.id);
    try {
      const body = { status: newStatus };
      if (trackingNumber) body.trackingNumber = trackingNumber;
      await api.put(`/admin/orders/${order.id}`, body);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: newStatus,
                ...(trackingNumber ? { trackingNumber } : {}),
              }
            : o,
        ),
      );
    } catch (err) {
      alert("Could not update order status. Try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleStatusChange(order, newStatus) {
    if (newStatus === "SHIPPED") {
      setTrackingInput(order.trackingNumber || "");
      setShipModalOrder(order);
      return;
    }
    submitStatusUpdate(order, newStatus);
  }

  function confirmShipModal() {
    if (!trackingInput.trim()) {
      alert("Enter a tracking number to mark this order as shipped.");
      return;
    }
    submitStatusUpdate(shipModalOrder, "SHIPPED", trackingInput.trim());
    setShipModalOrder(null);
    setTrackingInput("");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="font-serif text-3xl font-semibold text-ink">Orders</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={loadOrders}
            className="flex items-center justify-center gap-1 text-sm text-neutral-500 border border-neutral-300 rounded-lg px-3 py-2 hover:bg-neutral-50 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <div className="flex items-center border border-neutral-300 rounded-lg px-3 bg-white">
            <Search size={14} className="text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by customer name or order #"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-2 py-1.5 outline-none text-sm w-full sm:w-56 min-w-0"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        {loading ? (
          <p className="p-6 text-neutral-400">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag size={32} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-400">No orders found.</p>
          </div>
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
                      className={`text-xs rounded-full px-3 py-1 border-0 font-medium ${
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
                    <button className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs hover:bg-neutral-50 transition-colors">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {shipModalOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="font-medium text-ink mb-1">
              Mark #{shipModalOrder.orderNumber || shipModalOrder.id} as Shipped
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Enter the India Post tracking number for this order.
            </p>
            <input
              type="text"
              autoFocus
              placeholder="e.g. RXXXXXXXXXIN"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShipModalOrder(null);
                  setTrackingInput("");
                }}
                className="px-4 py-2 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmShipModal}
                disabled={updatingId === shipModalOrder.id}
                className="px-4 py-2 text-sm rounded-lg bg-spine text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {updatingId === shipModalOrder.id ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
