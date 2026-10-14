import { useEffect, useState } from "react";
import api from "./api";

// Delivery rules come from the store settings (public endpoint), so the cart
// and checkout show the same charge the server will apply when the order is
// created: free when a free-delivery amount is set and the cart reaches it.
export function useShipping() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/settings")
      .then((res) => {
        if (!cancelled) setSettings(res.data || {});
      })
      .catch(() => {
        if (!cancelled) setSettings({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const charge = Number(settings?.shippingCharge) || 0;
  const threshold = Number(settings?.freeShippingThreshold) || 0;

  function shippingFor(subtotal) {
    if (!(charge > 0)) return 0;
    if (threshold > 0 && subtotal >= threshold) return 0;
    return charge;
  }

  return {
    loaded: settings !== null,
    shippingFor,
    charge,
    threshold,
    deliveryEstimate: settings?.deliveryEstimate || "",
    courierName: settings?.courierName || "",
    trackingUrlTemplate: settings?.trackingUrlTemplate || "",
    onlinePaymentsEnabled: settings?.onlinePaymentsEnabled !== false,
  };
}
