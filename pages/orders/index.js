import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import api from "../../lib/api";
import { Package, ChevronRight } from "lucide-react";

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
};

export default function Orders() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    api
      .get("/orders")
      .then((res) => setOrders(res.data))
      .catch(() => setError("Could not load your orders."))
      .finally(() => setLoading(false));
  }, [checked]);

  if (!checked) return null;

  return (
    <div>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-serif text-2xl text-ink mb-6">My Orders</h1>

        {loading && <p className="text-neutral-400">Loading orders...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-16">
            <Package size={40} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-400 mb-4">
              You haven't placed any orders yet.
            </p>
            <Link
              href="/products"
              className="inline-block px-5 py-2 bg-spine text-white rounded"
            >
              Start Shopping
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center gap-3 border border-neutral-200 rounded-lg bg-white p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex-1">
                <p className="font-medium text-ink">
                  Order #{order.orderNumber || order.id}
                </p>
                <p className="text-xs text-neutral-400">
                  {(order.items || []).length} item
                  {(order.items || []).length === 1 ? "" : "s"} · ₹
                  {order.totalAmount ?? order.total}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded font-medium ${
                  STATUS_STYLES[order.status] ||
                  "bg-neutral-100 text-neutral-500"
                }`}
              >
                {order.status}
              </span>
              <ChevronRight size={16} className="text-neutral-300" />
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
