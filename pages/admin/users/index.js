import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Users as UsersIcon } from "lucide-react";
import AdminLayout from "../../../components/admin/AdminLayout";
import {
  Card,
  EmptyState,
  ErrorState,
  Modal,
  Notice,
  PageHeader,
  Pagination,
  Pill,
  TableSkeleton,
  OrderStatusBadge,
  btnSmall,
  iconBtn,
  tdCls,
  thCls,
  useIsDesktop,
} from "../../../components/admin/ui";
import api from "../../../lib/api";
import {
  formatCurrency,
  formatDate,
  getApiError,
  includesText,
  isRevenueOrder,
  isUnsupported,
  orderCustomerEmail,
  orderCustomerId,
  orderCustomerName,
  orderCustomerPhone,
  orderDate,
  orderRef,
  orderTotal,
  paginate,
  toArray,
} from "../../../lib/admin";

const keyOf = (id, email) =>
  id ? `id:${id}` : email ? `email:${String(email).toLowerCase()}` : null;

// Only these fields are ever read from a user record. Passwords, tokens and
// anything else the backend might send are never rendered.
function pickUser(u) {
  return {
    id: u.id,
    name: u.name || "",
    email: u.email || "",
    phone: u.phone || "",
    role: u.role || "",
    createdAt: u.createdAt || null,
  };
}

function UserDetails({ user, orders, onClose, showJoined }) {
  const recent = [...orders]
    .sort((a, b) => new Date(orderDate(b) || 0) - new Date(orderDate(a) || 0))
    .slice(0, 5);
  const spent = orders
    .filter(isRevenueOrder)
    .reduce((s, o) => s + orderTotal(o), 0);
  const rows = [
    ["Email", user.email || "—"],
    ["Phone", user.phone || "—"],
    ...(showJoined ? [["Joined", formatDate(user.createdAt)]] : []),
    ["Orders", orders.length],
    ["Total spent", formatCurrency(spent)],
  ];
  return (
    <Modal title={user.name || user.email || "Customer"} onClose={onClose} wide>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-neutral-500">{k}</dt>
            <dd className="break-words font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <h3 className="mb-2 mt-6 font-serif text-base font-semibold text-spine">
        Recent orders
      </h3>
      {recent.length === 0 ? (
        <p className="text-sm text-neutral-500">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
          {recent.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
            >
              <Link
                href={`/admin/orders/${o.id}`}
                className="font-medium text-spine hover:underline"
              >
                #{orderRef(o)}
              </Link>
              <span className="text-neutral-500">
                {formatDate(orderDate(o))}
              </span>
              <span>{formatCurrency(orderTotal(o))}</span>
              <OrderStatusBadge status={o.status} />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default function AdminUsers() {
  const isDesktop = useIsDesktop();
  const [state, setState] = useState({ status: "loading" });
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);

  const load = useCallback(() => {
    setState((s) => (s.status === "ready" ? s : { status: "loading" }));
    Promise.allSettled([
      api.get("/admin/users"),
      api.get("/admin/orders"),
    ]).then(([u, o]) => {
      const orders = o.status === "fulfilled" ? toArray(o.value.data) : null;
      if (u.status === "fulfilled") {
        setState({
          status: "ready",
          mode: "full",
          users: toArray(u.value.data).map(pickUser),
          orders,
        });
        return;
      }
      if (isUnsupported(u.reason) && orders) {
        // No user list yet: build one from the customers on real orders.
        const seen = new Map();
        orders.forEach((ord) => {
          const id = orderCustomerId(ord);
          const email = orderCustomerEmail(ord);
          const k = keyOf(id, email);
          if (!k || seen.has(k)) return;
          seen.set(
            k,
            pickUser({
              id,
              name: orderCustomerName(ord),
              email,
              phone: orderCustomerPhone(ord),
            }),
          );
        });
        setState({
          status: "ready",
          mode: "fallback",
          users: [...seen.values()],
          orders,
        });
        return;
      }
      setState({
        status: "error",
        error: getApiError(u.reason, "Could not load users."),
      });
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const users = state.status === "ready" ? state.users : [];
  const orders = state.status === "ready" ? state.orders || [] : [];

  const ordersByUser = useMemo(() => {
    const m = new Map();
    orders.forEach((o) => {
      [keyOf(orderCustomerId(o), null), keyOf(null, orderCustomerEmail(o))]
        .filter(Boolean)
        .forEach((k) => {
          m.set(k, [...(m.get(k) || []), o]);
        });
    });
    return m;
  }, [orders]);

  const ordersFor = (u) => {
    const byId = ordersByUser.get(keyOf(u.id, null)) || [];
    const byEmail = u.email ? ordersByUser.get(keyOf(null, u.email)) || [] : [];
    return [...new Map([...byId, ...byEmail].map((o) => [o.id, o])).values()];
  };

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          !term.trim() ||
          includesText(u.name, term) ||
          includesText(u.email, term),
      ),
    [users, term],
  );
  const view = paginate(filtered, page);
  const showJoined = users.some((u) => u.createdAt);
  const ordersKnown = state.status === "ready" && state.orders !== null;

  const search = {
    value: term,
    onChange: (v) => {
      setTerm(v);
      setPage(1);
    },
    placeholder: "Search users",
  };

  return (
    <AdminLayout title="Users" search={search}>
      <PageHeader title="Users" subtitle="Manage registered customers." />

      {state.status === "ready" && state.mode === "fallback" && (
        <Notice>
          The full user list isn’t available yet — it needs{" "}
          <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">
            GET /api/admin/users
          </code>
          . For now this shows customers who have placed an order.
        </Notice>
      )}

      <Card>
        {state.status === "loading" && <TableSkeleton rows={6} cols={6} />}
        {state.status === "error" && (
          <ErrorState message={state.error} onRetry={load} />
        )}

        {state.status === "ready" &&
          (users.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No customers yet"
              message="Registered customers will appear here."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No matching users"
              message="Try a different name or email."
            />
          ) : (
            <>
              {isDesktop ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50/60">
                        <th className={thCls}>User ID</th>
                        <th className={thCls}>Name</th>
                        <th className={thCls}>Email</th>
                        <th className={thCls}>Phone</th>
                        {showJoined && <th className={thCls}>Joined</th>}
                        {ordersKnown && <th className={thCls}>Orders</th>}
                        <th className={`${thCls} text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {view.rows.map((u, i) => (
                        <tr key={u.id || u.email || i}>
                          <td
                            className={`${tdCls} text-xs text-neutral-500`}
                            title={u.id || undefined}
                          >
                            {u.id ? String(u.id).slice(0, 8) : "—"}
                          </td>
                          <td className={tdCls}>
                            <span className="font-medium">{u.name || "—"}</span>{" "}
                            {u.role === "ADMIN" && (
                              <Pill tone="indigo">Admin</Pill>
                            )}
                          </td>
                          <td className={`${tdCls} text-neutral-600`}>
                            {u.email || "—"}
                          </td>
                          <td
                            className={`${tdCls} whitespace-nowrap text-neutral-600`}
                          >
                            {u.phone || "—"}
                          </td>
                          {showJoined && (
                            <td className={`${tdCls} whitespace-nowrap`}>
                              {formatDate(u.createdAt)}
                            </td>
                          )}
                          {ordersKnown && (
                            <td className={tdCls}>{ordersFor(u).length}</td>
                          )}
                          <td className={`${tdCls} text-right`}>
                            <button
                              onClick={() => setViewing(u)}
                              className={iconBtn}
                              aria-label={`View ${u.name || u.email}`}
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {view.rows.map((u, i) => (
                    <li key={u.id || u.email || i} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {u.name || "—"}{" "}
                            {u.role === "ADMIN" && (
                              <Pill tone="indigo">Admin</Pill>
                            )}
                          </p>
                          <p className="break-all text-sm text-neutral-600">
                            {u.email || "—"}
                          </p>
                        </div>
                        <button
                          onClick={() => setViewing(u)}
                          className={btnSmall}
                          aria-label={`View ${u.name || u.email}`}
                        >
                          <Eye size={15} /> View
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-neutral-500">
                        {[
                          u.phone && `+91 ${u.phone}`,
                          showJoined &&
                            u.createdAt &&
                            `Joined ${formatDate(u.createdAt)}`,
                          ordersKnown &&
                            `${ordersFor(u).length} order${ordersFor(u).length === 1 ? "" : "s"}`,
                          u.id && `ID ${String(u.id).slice(0, 8)}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
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
                noun="users"
              />
            </>
          ))}
      </Card>

      {viewing && (
        <UserDetails
          user={viewing}
          orders={ordersFor(viewing)}
          showJoined={showJoined}
          onClose={() => setViewing(null)}
        />
      )}
    </AdminLayout>
  );
}
