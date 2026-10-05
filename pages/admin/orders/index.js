import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Eye, RefreshCw, ShoppingBag, SquarePen } from "lucide-react";
import AdminLayout from "../../../components/admin/AdminLayout";
import OrderStatusModal from "../../../components/admin/OrderStatusModal";
import {
  Card,
  EmptyState,
  ErrorState,
  OrderStatusBadge,
  PageHeader,
  Pagination,
  TableSkeleton,
  btnOutline,
  btnSmall,
  iconBtn,
  inputCls,
  tdCls,
  thCls,
  useIsDesktop,
} from "../../../components/admin/ui";
import api from "../../../lib/api";
import {
  ORDER_STATUSES,
  ORDER_STATUS_META,
  formatCurrency,
  formatDate,
  getApiError,
  orderCustomerEmail,
  orderCustomerName,
  orderDate,
  orderMatches,
  orderRef,
  orderTotal,
  paginate,
  toArray,
} from "../../../lib/admin";

export default function AdminOrders() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [state, setState] = useState({ status: "loading" });
  const [term, setTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    setState((s) => (s.status === "ready" ? s : { status: "loading" }));
    api
      .get("/admin/orders")
      .then((res) => setState({ status: "ready", orders: toArray(res.data) }))
      .catch((err) =>
        setState({
          status: "error",
          error: getApiError(err, "Could not load orders."),
        }),
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The dashboard search box hands its query over as ?q=
  useEffect(() => {
    if (!router.isReady) return;
    if (typeof router.query.q === "string") setTerm(router.query.q);
    if (typeof router.query.status === "string")
      setStatusFilter(router.query.status.toUpperCase());
  }, [router.isReady, router.query.q, router.query.status]);

  const orders = state.status === "ready" ? state.orders : [];

  const filtered = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) => new Date(orderDate(b) || 0) - new Date(orderDate(a) || 0),
        )
        .filter(
          (o) =>
            (!statusFilter || o.status === statusFilter) &&
            orderMatches(o, term),
        ),
    [orders, term, statusFilter],
  );

  const view = paginate(filtered, page);

  const search = {
    value: term,
    onChange: (v) => {
      setTerm(v);
      setPage(1);
    },
    placeholder: "Search orders",
  };

  function applySaved(id, patch) {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
    setEditing(null);
  }

  return (
    <AdminLayout title="Orders" search={search}>
      <PageHeader title="Orders" subtitle="View and manage customer orders." />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 p-4">
          <p className="text-sm text-neutral-500">
            {state.status === "ready"
              ? `${filtered.length} of ${orders.length} orders`
              : "\u00A0"}
          </p>
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={`${inputCls} h-9 w-auto`}
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_META[s].label}
                </option>
              ))}
            </select>
            <button
              onClick={load}
              className={`${btnOutline} h-9 px-3`}
              aria-label="Refresh orders"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {state.status === "loading" && <TableSkeleton rows={6} cols={6} />}
        {state.status === "error" && (
          <ErrorState message={state.error} onRetry={load} />
        )}

        {state.status === "ready" &&
          (orders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              message="Orders will appear here once customers check out."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No matching orders"
              message="Try a different order ID, customer, or status."
            />
          ) : (
            <>
              {isDesktop ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50/60">
                        <th className={thCls}>Order ID</th>
                        <th className={thCls}>Customer</th>
                        <th className={thCls}>Date</th>
                        <th className={thCls}>Amount</th>
                        <th className={thCls}>Status</th>
                        <th className={`${thCls} text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {view.rows.map((o) => (
                        <tr key={o.id}>
                          <td className={`${tdCls} font-medium`}>
                            #{orderRef(o)}
                          </td>
                          <td className={tdCls}>
                            <p>{orderCustomerName(o) || "—"}</p>
                            {orderCustomerEmail(o) && (
                              <p className="text-xs text-neutral-500">
                                {orderCustomerEmail(o)}
                              </p>
                            )}
                          </td>
                          <td
                            className={`${tdCls} whitespace-nowrap text-neutral-600`}
                          >
                            {formatDate(orderDate(o))}
                          </td>
                          <td className={`${tdCls} whitespace-nowrap`}>
                            {formatCurrency(orderTotal(o))}
                          </td>
                          <td className={tdCls}>
                            <OrderStatusBadge status={o.status} />
                          </td>
                          <td className={`${tdCls} text-right`}>
                            <div className="inline-flex items-center gap-0.5">
                              <Link
                                href={`/admin/orders/${o.id}`}
                                className={iconBtn}
                                aria-label={`View order ${orderRef(o)}`}
                                title="View order"
                              >
                                <Eye size={16} />
                              </Link>
                              <button
                                onClick={() => setEditing(o)}
                                className={iconBtn}
                                aria-label={`Update status of order ${orderRef(o)}`}
                                title="Update status"
                              >
                                <SquarePen size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {view.rows.map((o) => (
                    <li key={o.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">#{orderRef(o)}</p>
                          <p className="text-sm">
                            {orderCustomerName(o) || "—"}
                          </p>
                          {orderCustomerEmail(o) && (
                            <p className="break-all text-xs text-neutral-500">
                              {orderCustomerEmail(o)}
                            </p>
                          )}
                        </div>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-neutral-600">
                        <span>{formatDate(orderDate(o))}</span>
                        <span className="font-medium text-ink">
                          {formatCurrency(orderTotal(o))}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className={btnSmall}
                          aria-label={`View order ${orderRef(o)}`}
                        >
                          <Eye size={15} /> View
                        </Link>
                        <button
                          onClick={() => setEditing(o)}
                          className={btnSmall}
                          aria-label={`Update status of order ${orderRef(o)}`}
                        >
                          <SquarePen size={15} /> Update status
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Pagination
                page={view.page}
                pageCount={view.pageCount}
                onPage={setPage}
                total={filtered.length}
                shown={view.rows.length}
                start={view.start}
                noun="orders"
              />
            </>
          ))}
      </Card>

      {editing && (
        <OrderStatusModal
          order={editing}
          onClose={() => setEditing(null)}
          onSaved={(patch) => applySaved(editing.id, patch)}
        />
      )}
    </AdminLayout>
  );
}
