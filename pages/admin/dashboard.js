import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Package,
  ShoppingCart,
  Users,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Eye,
  AlertTriangle,
  ShoppingBag,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import SalesChart from "../../components/admin/SalesChart";
import {
  Card,
  PageHeader,
  OrderStatusBadge,
  EmptyState,
  ErrorState,
  TableSkeleton,
  thCls,
  tdCls,
  useIsDesktop,
} from "../../components/admin/ui";
import api from "../../lib/api";
import {
  LOW_STOCK_THRESHOLD,
  formatCurrency,
  getApiError,
  isRevenueOrder,
  isUnsupported,
  orderCustomerName,
  orderDate,
  orderMatches,
  orderRef,
  orderTotal,
  toArray,
  trendVsPrevious,
} from "../../lib/admin";

const PERIODS = [
  { months: 3, label: "Last 3 Months" },
  { months: 6, label: "Last 6 Months" },
  { months: 12, label: "Last 12 Months" },
];

const settled = (r) =>
  r.status === "fulfilled" ? toArray(r.value.data) : null;

function StatCard({ icon: Icon, label, value, trend, trendLabel, note, hint }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3" title={hint}>
        <div className="min-w-0">
          <p className="text-sm text-neutral-500">{label}</p>
          <p
            className="mt-1.5 text-[26px] font-semibold leading-none text-ink"
            data-testid={`stat-${label}`}
          >
            {value}
          </p>
        </div>
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-spine/10 text-spine">
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-3 min-h-[18px] text-xs" data-testid={`trend-${label}`}>
        {trend !== null && trend !== undefined ? (
          <span
            className={`inline-flex flex-wrap items-center gap-x-1 font-medium ${
              trend > 0
                ? "text-emerald-700"
                : trend < 0
                  ? "text-red-600"
                  : "text-neutral-500"
            }`}
          >
            {trend > 0 ? (
              <TrendingUp size={13} />
            ) : trend < 0 ? (
              <TrendingDown size={13} />
            ) : null}
            {trend > 0 ? "+" : ""}
            {trend}%
            <span className="font-normal text-neutral-400"> {trendLabel}</span>
          </span>
        ) : (
          note && <span className="text-neutral-400">{note}</span>
        )}
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [state, setState] = useState({ status: "loading" });
  const [months, setMonths] = useState(6);
  const [term, setTerm] = useState("");
  const [today, setToday] = useState("");

  const load = useCallback(() => {
    setState({ status: "loading" });
    Promise.allSettled([
      api.get("/admin/products"),
      api.get("/admin/orders"),
      api.get("/admin/users"),
    ]).then(([p, o, u]) => {
      const products = settled(p);
      const orders = settled(o);
      if (products === null && orders === null) {
        setState({
          status: "error",
          error: getApiError(p.reason, "Could not load dashboard data."),
        });
        return;
      }
      setState({
        status: "ready",
        products,
        orders,
        users: settled(u),
        usersUnsupported: u.status === "rejected" && isUnsupported(u.reason),
      });
    });
  }, []);

  useEffect(() => {
    load();
    setToday(
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, [load]);

  const { products, orders, users } = state;

  const stats = useMemo(() => {
    if (state.status !== "ready") return null;
    const paid = (orders || []).filter(isRevenueOrder);
    return {
      revenue: paid.reduce((s, o) => s + orderTotal(o), 0),
      revenueTrend: orders
        ? trendVsPrevious(paid, orderDate, orderTotal)
        : null,
      ordersTrend: orders ? trendVsPrevious(orders, orderDate) : null,
      productsTrend: products
        ? trendVsPrevious(products, (p) => p.createdAt)
        : null,
      usersTrend: users ? trendVsPrevious(users, (u) => u.createdAt) : null,
      lowStock: (products || []).filter(
        (p) => Number(p.stock) <= LOW_STOCK_THRESHOLD,
      ),
    };
  }, [state, products, orders, users]);

  // Revenue per calendar month for the selected window — real orders only.
  const chart = useMemo(() => {
    if (state.status !== "ready" || !orders)
      return { points: [], hasDates: false };
    const now = new Date();
    const buckets = Array.from({ length: months }, (_, i) => {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - (months - 1 - i),
        1,
      );
      const m = d.toLocaleDateString("en-IN", { month: "short" });
      const label =
        d.getFullYear() === now.getFullYear()
          ? m
          : `${m} '${String(d.getFullYear()).slice(2)}`;
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label, value: 0 };
    });
    let hasDates = false;
    orders.filter(isRevenueOrder).forEach((o) => {
      const raw = orderDate(o);
      if (!raw) return;
      hasDates = true;
      const d = new Date(raw);
      const b = buckets.find(
        (x) => x.key === `${d.getFullYear()}-${d.getMonth()}`,
      );
      if (b) b.value += orderTotal(o);
    });
    return {
      points: buckets,
      hasDates,
      total: buckets.reduce((s, b) => s + b.value, 0),
    };
  }, [state, orders, months]);

  const recent = useMemo(() => {
    if (!orders) return [];
    const sorted = [...orders].sort(
      (a, b) => new Date(orderDate(b) || 0) - new Date(orderDate(a) || 0),
    );
    return sorted.filter((o) => orderMatches(o, term)).slice(0, 5);
  }, [orders, term]);

  const search = {
    value: term,
    onChange: setTerm,
    placeholder: "Search anything",
    // Enter hands the query to the Orders page, which understands ?q=
    onSubmit: (v) =>
      v.trim() &&
      router.push(`/admin/orders?q=${encodeURIComponent(v.trim())}`),
  };

  return (
    <AdminLayout title="Dashboard" search={search}>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Admin!"
        action={
          <p className="hidden text-sm text-neutral-500 sm:block">{today}</p>
        }
      />

      {state.status === "loading" && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="h-[118px] animate-pulse bg-neutral-50" />
            ))}
          </div>
          <Card>
            <TableSkeleton rows={5} cols={4} />
          </Card>
        </>
      )}

      {state.status === "error" && (
        <Card>
          <ErrorState message={state.error} onRetry={load} />
        </Card>
      )}

      {state.status === "ready" && stats && (
        <>
          {stats.lowStock.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span>
                {stats.lowStock.length} product
                {stats.lowStock.length > 1 ? "s are" : " is"} low or out of
                stock ({LOW_STOCK_THRESHOLD} or fewer left).
              </span>
              <Link
                href="/admin/products"
                className="font-medium text-spine underline"
              >
                View products
              </Link>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Package}
              label="Total Products"
              value={products ? products.length : "—"}
              trend={stats.productsTrend}
              trendLabel="new vs previous 30 days"
              hint="Products added in the last 30 days compared with the 30 days before"
              note={products ? null : "Couldn’t load products"}
            />
            <StatCard
              icon={ShoppingCart}
              label="Total Orders"
              value={orders ? orders.length : "—"}
              trend={stats.ordersTrend}
              trendLabel="new vs previous 30 days"
              hint="Orders placed in the last 30 days compared with the 30 days before"
              note={orders ? null : "Couldn’t load orders"}
            />
            <StatCard
              icon={Users}
              label="Total Users"
              value={users ? users.length : "—"}
              trend={stats.usersTrend}
              trendLabel="new vs previous 30 days"
              hint="Sign-ups in the last 30 days compared with the 30 days before"
              note={
                users
                  ? null
                  : state.usersUnsupported
                    ? "Users API not available yet"
                    : "Couldn’t load users"
              }
            />
            <StatCard
              icon={IndianRupee}
              label="Total Revenue"
              value={orders ? formatCurrency(stats.revenue) : "—"}
              trend={stats.revenueTrend}
              trendLabel="vs previous 30 days"
              hint="Revenue counts paid, shipped and delivered orders only — pending and cancelled orders are excluded"
              note={
                orders
                  ? "Paid, shipped & delivered orders"
                  : "Couldn’t load orders"
              }
            />
          </div>

          <Card className="mb-6 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold text-spine">
                Sales Overview
              </h2>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                aria-label="Sales period"
                className="h-9 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-ink outline-none focus:border-spine"
              >
                {PERIODS.map((p) => (
                  <option key={p.months} value={p.months}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            {!orders ? (
              <ErrorState
                message="Orders couldn’t be loaded, so there is nothing to chart."
                onRetry={load}
              />
            ) : !chart.hasDates ? (
              <EmptyState
                icon={TrendingUp}
                title="No sales history yet"
                message={
                  orders.some(isRevenueOrder)
                    ? "Orders from the backend don’t include a date, so a sales trend can’t be drawn."
                    : "Once orders are paid, monthly revenue will appear here."
                }
              />
            ) : chart.total === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No sales in this period"
                message="Try a longer period."
              />
            ) : (
              <SalesChart points={chart.points} />
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="font-serif text-lg font-semibold text-spine">
                Recent Orders
              </h2>
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-spine hover:underline"
              >
                View All →
              </Link>
            </div>
            {!orders ? (
              <ErrorState message="Orders couldn’t be loaded." onRetry={load} />
            ) : recent.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title={term ? "No matching orders" : "No orders yet"}
                message={
                  term
                    ? "Try a different order ID or customer name."
                    : "New orders will show up here."
                }
              />
            ) : isDesktop ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-y border-neutral-100 bg-neutral-50/60">
                      <th className={thCls}>Order ID</th>
                      <th className={thCls}>Customer</th>
                      <th className={thCls}>Amount</th>
                      <th className={thCls}>Status</th>
                      <th className={`${thCls} text-right`}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {recent.map((o) => (
                      <tr key={o.id}>
                        <td className={`${tdCls} font-medium`}>
                          #{orderRef(o)}
                        </td>
                        <td className={tdCls}>{orderCustomerName(o) || "—"}</td>
                        <td className={tdCls}>
                          {formatCurrency(orderTotal(o))}
                        </td>
                        <td className={tdCls}>
                          <OrderStatusBadge status={o.status} />
                        </td>
                        <td className={`${tdCls} text-right`}>
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-spine hover:underline"
                          >
                            <Eye size={15} /> View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-neutral-100 border-t border-neutral-100">
                {recent.map((o) => (
                  <li key={o.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">#{orderRef(o)}</p>
                        <p className="text-sm text-neutral-600">
                          {orderCustomerName(o) || "—"}
                        </p>
                      </div>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {formatCurrency(orderTotal(o))}
                      </span>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-spine hover:underline"
                      >
                        <Eye size={15} /> View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
