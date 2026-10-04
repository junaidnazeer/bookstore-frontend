import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Check, Mail, Phone, ShoppingBag, SquarePen, User } from "lucide-react";
import AdminLayout from "../../../components/admin/AdminLayout";
import OrderStatusModal from "../../../components/admin/OrderStatusModal";
import {
  BackLink,
  Card,
  EmptyState,
  ErrorState,
  OrderStatusBadge,
  PageHeader,
  TableSkeleton,
  btnPrimary,
  tdCls,
  thCls,
} from "../../../components/admin/ui";
import api from "../../../lib/api";
import {
  formatCurrency,
  formatDate,
  getApiError,
  itemImage,
  itemName,
  itemPrice,
  orderCustomerEmail,
  orderCustomerName,
  orderCustomerPhone,
  orderDate,
  orderRef,
  orderTotal,
  toArray,
} from "../../../lib/admin";

const FLOW = [
  { status: "PENDING", label: "Order placed" },
  { status: "PAID", label: "Payment received" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

function formatAddress(a) {
  if (!a) return "";
  if (typeof a === "string") return a;
  return Object.values(a).filter(Boolean).join(", ");
}

function variantText(item) {
  const v = item.variantInfo;
  if (!v || typeof v !== "object") return "";
  return [v.size && `Size ${v.size}`, v.color && `Colour ${v.color}`]
    .filter(Boolean)
    .join(" · ");
}

export default function AdminOrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [state, setState] = useState({ status: "loading" });
  const [editing, setEditing] = useState(false);

  const load = useCallback(async (orderId) => {
    setState({ status: "loading" });
    try {
      // The admin list always carries the customer's details, so look there first.
      const res = await api.get("/admin/orders");
      const found = toArray(res.data).find(
        (o) => String(o.id) === String(orderId),
      );
      if (found) {
        setState({ status: "ready", order: found });
        return;
      }
      // Not in the list: ask for it directly (admins may read any order).
      const one = await api.get(`/orders/${orderId}`);
      setState({ status: "ready", order: one.data });
    } catch (err) {
      if (
        [403, 404].includes(err?.response?.status) &&
        err.config?.url?.includes("/orders/")
      ) {
        setState({ status: "missing" });
      } else {
        setState({
          status: "error",
          error: getApiError(err, "Could not load this order."),
        });
      }
    }
  }, []);

  useEffect(() => {
    if (router.isReady) load(id);
  }, [router.isReady, id, load]);

  const order = state.status === "ready" ? state.order : null;
  const items = order?.items || [];
  const subtotal = items.reduce(
    (s, i) => s + itemPrice(i) * Number(i.quantity || 0),
    0,
  );
  const total = order ? orderTotal(order) : 0;
  const extra = total - subtotal;
  const showBreakdown = subtotal > 0 && extra > 0.009;
  const flowIndex = order
    ? FLOW.findIndex((f) => f.status === order.status)
    : -1;
  const cancelled = order?.status === "CANCELLED";
  const paymentId = order?.razorpayPaymentId || order?.paymentId;
  const address = formatAddress(order?.shippingAddress);

  return (
    <AdminLayout title={order ? `Order #${orderRef(order)}` : "Order"}>
      <PageHeader
        back={<BackLink href="/admin/orders">Back to Orders</BackLink>}
        title={order ? `#${orderRef(order)}` : "Order"}
        subtitle={order ? formatDate(orderDate(order), true) : undefined}
        action={
          order && (
            <>
              <OrderStatusBadge status={order.status} />
              <button onClick={() => setEditing(true)} className={btnPrimary}>
                <SquarePen size={15} /> Update status
              </button>
            </>
          )
        }
      />

      {state.status === "loading" && (
        <Card>
          <TableSkeleton rows={6} cols={3} />
        </Card>
      )}
      {state.status === "error" && (
        <Card>
          <ErrorState message={state.error} onRetry={() => load(id)} />
        </Card>
      )}
      {state.status === "missing" && (
        <Card>
          <EmptyState
            icon={ShoppingBag}
            title="Order not found"
            message="It may have been removed, or the link is wrong."
          />
        </Card>
      )}

      {order && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="flex flex-col gap-5 xl:col-span-2">
            <Card className="p-5">
              <h2 className="mb-3 font-serif text-lg font-semibold text-spine">
                Customer information
              </h2>
              {orderCustomerName(order) ||
              orderCustomerEmail(order) ||
              orderCustomerPhone(order) ? (
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-spine/10 text-spine">
                    <User size={22} />
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-ink">
                      {orderCustomerName(order) || "—"}
                    </p>
                    {orderCustomerEmail(order) && (
                      <p className="mt-1 flex items-center gap-2 break-all text-neutral-600">
                        <Mail
                          size={14}
                          className="flex-shrink-0 text-neutral-400"
                        />{" "}
                        {orderCustomerEmail(order)}
                      </p>
                    )}
                    {orderCustomerPhone(order) && (
                      <p className="mt-1 flex items-center gap-2 text-neutral-600">
                        <Phone
                          size={14}
                          className="flex-shrink-0 text-neutral-400"
                        />{" "}
                        {orderCustomerPhone(order)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  The backend didn’t send customer details for this order.
                </p>
              )}
            </Card>

            <Card>
              <h2 className="px-5 pt-5 font-serif text-lg font-semibold text-spine">
                Order items
              </h2>
              {items.length === 0 ? (
                <p className="px-5 py-6 text-sm text-neutral-500">
                  No items were returned for this order.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-y border-neutral-100 bg-neutral-50/60">
                        <th className={thCls}>Item</th>
                        <th className={`${thCls} hidden sm:table-cell`}>
                          Price
                        </th>
                        <th className={thCls}>Qty</th>
                        <th className={`${thCls} text-right`}>Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {items.map((it, i) => (
                        <tr key={it.id || i}>
                          <td className={tdCls}>
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                                {itemImage(it) && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={itemImage(it)}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium leading-snug">
                                  {itemName(it)}
                                </p>
                                {variantText(it) && (
                                  <p className="text-xs text-neutral-500">
                                    {variantText(it)}
                                  </p>
                                )}
                                <p className="text-xs text-neutral-500 sm:hidden">
                                  {formatCurrency(itemPrice(it))} each
                                </p>
                              </div>
                            </div>
                          </td>
                          <td
                            className={`${tdCls} hidden whitespace-nowrap sm:table-cell`}
                          >
                            {formatCurrency(itemPrice(it))}
                          </td>
                          <td className={tdCls}>{it.quantity}</td>
                          <td
                            className={`${tdCls} whitespace-nowrap text-right`}
                          >
                            {formatCurrency(
                              itemPrice(it) * Number(it.quantity || 0),
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 font-serif text-lg font-semibold text-spine">
                Shipping address
              </h2>
              {address ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                  {address}
                </p>
              ) : (
                <p className="text-sm text-neutral-500">
                  No shipping address was returned for this order.
                </p>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-5">
            <Card className="p-5">
              <h2 className="mb-3 font-serif text-lg font-semibold text-spine">
                Order summary
              </h2>
              <dl className="flex flex-col gap-2 text-sm">
                {showBreakdown && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Subtotal</dt>
                      <dd>{formatCurrency(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">
                        Shipping and other charges
                      </dt>
                      <dd>{formatCurrency(extra)}</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="text-spine">{formatCurrency(total)}</dd>
                </div>
                <div className="flex justify-between pt-1">
                  <dt className="text-neutral-500">Payment</dt>
                  <dd>
                    {["PAID", "SHIPPED", "DELIVERED"].includes(order.status)
                      ? "Paid online"
                      : cancelled
                        ? "Cancelled"
                        : "Awaiting payment"}
                  </dd>
                </div>
                {paymentId && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-neutral-500">Payment ID</dt>
                    <dd className="break-all text-right text-xs">
                      {paymentId}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 font-serif text-lg font-semibold text-spine">
                Tracking
              </h2>
              {cancelled ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  This order was cancelled.
                </p>
              ) : (
                <ol className="flex flex-col">
                  {FLOW.map((f, i) => {
                    const done = i <= flowIndex;
                    return (
                      <li key={f.status} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-white ${
                              done ? "bg-spine" : "bg-neutral-200"
                            }`}
                          >
                            {done && <Check size={14} />}
                          </span>
                          {i < FLOW.length - 1 && (
                            <span
                              className={`my-1 w-0.5 flex-1 ${i < flowIndex ? "bg-spine" : "bg-neutral-200"}`}
                            />
                          )}
                        </div>
                        <div className="pb-5 text-sm">
                          <p
                            className={
                              done ? "font-medium text-ink" : "text-neutral-400"
                            }
                          >
                            {f.label}
                          </p>
                          {i === 0 && (
                            <p className="text-xs text-neutral-500">
                              {formatDate(orderDate(order), true)}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
              <div className="mt-1 border-t border-neutral-100 pt-3 text-sm">
                <p className="text-neutral-500">Tracking number</p>
                <p className="mt-0.5 break-all font-medium text-ink">
                  {order.trackingNumber || "Not added yet"}
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {editing && order && (
        <OrderStatusModal
          order={order}
          onClose={() => setEditing(false)}
          onSaved={(patch) => {
            setState({ status: "ready", order: { ...order, ...patch } });
            setEditing(false);
          }}
        />
      )}
    </AdminLayout>
  );
}
