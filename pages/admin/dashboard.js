import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../lib/api";
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";

const LOW_STOCK_THRESHOLD = 10;

function StatCard({ icon: Icon, label, value, tone = "neutral" }) {
  const tones = {
    neutral: { card: "bg-white text-ink", badge: "bg-spine/10 text-spine" },
    warning: {
      card: "bg-red-50 text-red-700",
      badge: "bg-red-100 text-red-600",
    },
  };
  const t = tones[tone];
  return (
    <div
      className={`rounded-xl border border-neutral-200 shadow-sm p-5 flex items-center gap-4 ${t.card}`}
    >
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${t.badge}`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/products").catch(() => ({ data: [] })),
      api.get("/admin/orders").catch(() => ({ data: [] })),
    ]).then(([productsRes, ordersRes]) => {
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setLoading(false);
    });
  }, []);

  const lowStock = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Dashboard
        </h1>
      </div>

      {loading ? (
        <p className="text-neutral-400">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Package}
              label="Total Products"
              value={products.length}
            />
            <StatCard
              icon={ShoppingCart}
              label="Total Orders"
              value={orders.length}
            />
            <StatCard
              icon={AlertTriangle}
              label="Low Stock"
              value={lowStock.length}
              tone={lowStock.length > 0 ? "warning" : "neutral"}
            />
            <StatCard
              icon={IndianRupee}
              label="Total Revenue"
              value={`₹${totalRevenue}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
              <p className="font-medium text-ink mb-3">Quick Actions</p>
              <div className="flex gap-3">
                <Link
                  href="/admin/products"
                  className="px-4 py-2.5 bg-spine text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Manage Products
                </Link>
                <Link
                  href="/admin/orders"
                  className="px-4 py-2.5 border border-spine text-spine rounded-lg text-sm font-medium hover:bg-spine/5 transition-colors"
                >
                  Manage Orders
                </Link>
              </div>
            </div>

            {lowStock.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm p-6">
                <p className="font-medium text-amber-800 mb-1 flex items-center gap-2">
                  <AlertTriangle size={16} /> Low Stock Alert
                </p>
                <p className="text-sm text-amber-700 mb-3">
                  {lowStock.length} product
                  {lowStock.length > 1 ? "s are" : " is"} running low on stock.
                </p>
                <Link
                  href="/admin/products"
                  className="text-sm text-spine underline"
                >
                  View Products
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
