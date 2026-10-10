import { useEffect, useState } from "react";
import api from "./api";

// Public store settings (GET /api/settings): shipping charge, free-shipping
// amount, delivery estimate. The cart and checkout read them so the delivery
// fee they show is the one the server will actually charge.
let cached = null;

export function useStoreSettings() {
  const [settings, setSettings] = useState(cached);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/settings")
      .then((res) => {
        cached = { loaded: true, ...res.data };
        if (!cancelled) setSettings(cached);
      })
      .catch(() => {
        // Leave it unknown rather than guessing a delivery fee.
        if (!cancelled && !cached) setSettings(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
}

// Same rule as the server: free when a free-shipping amount is set (above 0)
// and the subtotal reaches it, otherwise the flat shipping charge.
export function deliveryFor(subtotal, settings) {
  if (!settings?.loaded) return { known: false, fee: 0, remaining: 0 };
  const charge = Number(settings.shippingCharge) || 0;
  const threshold = Number(settings.freeShippingThreshold) || 0;
  const free = threshold > 0 && subtotal >= threshold;
  const fee = free ? 0 : charge;
  const remaining =
    threshold > 0 && subtotal < threshold && charge > 0
      ? threshold - subtotal
      : 0;
  return { known: true, fee, remaining };
}

// Amounts like 15.99 * 3 pick up floating-point noise (47.970000000000006).
export const rupees = (n) => Number(Number(n).toFixed(2));
