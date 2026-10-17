import { useState } from "react";
import api from "../../lib/api";
import {
  ORDER_STATUSES,
  ORDER_STATUS_META,
  getApiError,
  orderRef,
} from "../../lib/admin";
import { toast } from "../../lib/admin-toast";
import { Field, Modal, btnOutline, btnPrimary, inputCls } from "./ui";

// Updates an order's status through PUT /admin/orders/:id. Marking an order as
// shipped requires an India Post tracking number (same rule as the old page).
// A tracking number can also be cleared: an empty value is sent as "" and the
// backend treats it as "no tracking number".
export default function OrderStatusModal({ order, onClose, onSaved }) {
  const [status, setStatus] = useState(order.status || "PENDING");
  const [tracking, setTracking] = useState(order.trackingNumber || "");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // The backend refuses to move an order out of CANCELLED (its items already went
  // back into stock), so the panel doesn't offer it.
  const locked = order.status === "CANCELLED";
  const currentTracking = order.trackingNumber || "";
  const orderShipped = status === "SHIPPED" || status === "DELIVERED";
  // Show the field when the order is shipped/delivered, and also whenever the
  // order already has a number, so a wrong or test number can be cleared.
  const showTracking = !locked && (orderShipped || Boolean(currentTracking));
  const trackingChanged = showTracking && tracking.trim() !== currentTracking;
  const changed = status !== order.status || trackingChanged;

  async function handleSave(e) {
    e.preventDefault();
    if (status === "SHIPPED" && !tracking.trim()) {
      setError("Enter a tracking number to mark this order as shipped.");
      return;
    }
    setSaving(true);
    setError(null);
    // Send only what changed.
    const body = {};
    if (status !== order.status) body.status = status;
    if (trackingChanged) body.trackingNumber = tracking.trim(); // "" clears it
    try {
      await api.put(`/admin/orders/${order.id}`, body);
      const clearedOnly = !body.status && body.trackingNumber === "";
      toast(
        body.status
          ? `Order #${orderRef(order)} is now ${ORDER_STATUS_META[status]?.label || status}.`
          : clearedOnly
            ? `Tracking number cleared for order #${orderRef(order)}.`
            : `Tracking number updated for order #${orderRef(order)}.`,
      );
      onSaved({
        ...(body.status ? { status } : {}),
        ...("trackingNumber" in body
          ? { trackingNumber: body.trackingNumber || null }
          : {}),
      });
    } catch (err) {
      setError(getApiError(err, "Could not update the order."));
      setSaving(false);
    }
  }

  return (
    <Modal title={`Update order #${orderRef(order)}`} onClose={onClose}>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Field label="Status" htmlFor="order-status">
          <select
            id="order-status"
            className={inputCls}
            disabled={locked}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setError(null);
            }}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_META[s].label}
              </option>
            ))}
          </select>
        </Field>

        {locked && (
          <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
            This order was cancelled and its items went back into stock, so its
            status can’t be changed.
          </p>
        )}

        {showTracking && (
          <Field
            label={
              status === "SHIPPED" ? "Tracking number *" : "Tracking number"
            }
            htmlFor="order-tracking"
            hint={
              orderShipped
                ? "India Post tracking number. Customers see it on their order page. Clear the field and save to remove it."
                : "This order hasn’t shipped. Clear the field and save to remove a number that was added by mistake."
            }
          >
            <input
              id="order-tracking"
              className={inputCls}
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="e.g. RXXXXXXXXXIN"
            />
          </Field>
        )}

        {status === "CANCELLED" && order.status !== "CANCELLED" && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Cancelling puts the items back in stock. Refunds aren’t processed
            from this panel, so refund the customer separately if they’ve paid.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnOutline}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !changed || locked}
            className={btnPrimary}
          >
            {saving ? "Saving…" : "Save status"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
