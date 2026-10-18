import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import api from "./api";
import { getToken } from "./auth";
import { getCatalog } from "./catalog";
import {
  CART_NOTICE,
  applyServerLines,
  fromServerLine,
  linesOf,
  mergeCarts,
  toPayload,
} from "./cart-sync";

const CartContext = createContext(null);

// Set once this browser's cart has been matched with the logged-in user's
// saved cart. If the login later disappears (logout or expired session), the
// cart is cleared from this device so the next person doesn't see it.
const SYNCED_FLAG = "cartSynced";

export function CartProvider({ children }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const readyRef = useRef(false); // saved cart loaded for the logged-in user
  const syncingRef = useRef(false);
  const skipSaveRef = useRef(false); // don't echo a server answer back
  const saveTimer = useRef(null);

  // Load the cart saved in this browser on first render.
  useEffect(() => {
    const saved = window.localStorage.getItem("cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed))
          setItems(
            parsed.map((i) =>
              Number.isFinite(i.stock) && i.stock > 0
                ? { ...i, quantity: Math.min(i.quantity, i.stock) }
                : i,
            ),
          );
      } catch {
        window.localStorage.removeItem("cart");
      }
    }
    setHydrated(true);
  }, []);

  // Pull the saved cart for a logged-in user, merge anything added as a guest,
  // save the result, and show it. Nothing is saved until the first GET is done.
  async function syncFromServer() {
    let serverItems;
    let catalog = null;
    try {
      const [res, cat] = await Promise.all([
        api.get("/cart"),
        getCatalog().catch(() => null),
      ]);
      catalog = cat;
      serverItems = linesOf(res.data)
        .filter((l) => l.available !== false)
        .map((l) => fromServerLine(l, catalog?.get(l.productId)));
    } catch {
      return; // leave the local cart alone and try again later
    }

    const merged = mergeCarts(itemsRef.current, serverItems);
    try {
      const put = await api.put("/cart", toPayload(merged));
      const result = applyServerLines(merged, linesOf(put.data), catalog);
      skipSaveRef.current = true;
      setItems(result.items);
      if (result.changed > 0) setNotice(CART_NOTICE);
    } catch {
      // Couldn't save: keep the merged cart on screen and try again later.
      skipSaveRef.current = true;
      setItems(merged);
      return;
    }
    window.localStorage.setItem(SYNCED_FLAG, "1");
    readyRef.current = true;
  }

  // Send the whole cart to the server (PUT replaces the saved list).
  async function pushToServer() {
    if (!readyRef.current || !getToken()) return;
    const payload = toPayload(itemsRef.current);
    const sent = JSON.stringify(payload);
    try {
      const put = await api.put("/cart", payload);
      // The user kept editing while this was in flight: the next save
      // will carry the newer cart, so ignore this answer.
      if (JSON.stringify(toPayload(itemsRef.current)) !== sent) return;
      let catalog = null;
      try {
        catalog = await getCatalog();
      } catch {
        // fine: original prices are kept from what we already have
      }
      const result = applyServerLines(
        itemsRef.current,
        linesOf(put.data),
        catalog,
      );
      if (result.changed > 0) {
        skipSaveRef.current = true;
        setItems(result.items);
        setNotice(CART_NOTICE);
      }
    } catch {
      // Network or validation problem: the cart still works locally and the
      // next change tries again.
    }
  }

  // Decide what to do for the current login state.
  function checkAuth() {
    if (!hydrated) return;
    if (!getToken()) {
      // Logged out (or the session ended).
      readyRef.current = false;
      clearTimeout(saveTimer.current);
      if (window.localStorage.getItem(SYNCED_FLAG)) {
        window.localStorage.removeItem(SYNCED_FLAG);
        window.localStorage.removeItem("cart");
        setItems([]);
      }
      return;
    }
    if (readyRef.current || syncingRef.current) return;
    syncingRef.current = true;
    syncFromServer().finally(() => {
      syncingRef.current = false;
    });
  }

  // Check on first load, after every page change (covers logging in), and
  // when the login is cleared in this tab.
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, router.asPath]);

  useEffect(() => {
    const onAuthChanged = () => checkAuth();
    window.addEventListener("auth-changed", onAuthChanged);
    return () => window.removeEventListener("auth-changed", onAuthChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Save whenever the cart changes: always to this browser, and to the
  // account too (shortly after the last change) when logged in.
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("cart", JSON.stringify(items));
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    if (!readyRef.current || !getToken()) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(pushToServer, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hydrated]);

  // One cart line per product + size + colour.
  const keyOf = (i) => `${i.id}-${i.size || ""}-${i.color || ""}`;

  // Stock is one number per product, shared across all its sizes.
  const maxFor = (list, item) => {
    const stock = Number.isFinite(item.stock) ? item.stock : Infinity;
    const others = list
      .filter((i) => i.id === item.id && keyOf(i) !== keyOf(item))
      .reduce((s, i) => s + i.quantity, 0);
    return Math.max(0, stock - others);
  };

  function addItem(product) {
    const qty = Math.max(1, Number(product.quantity) || 1);
    setItems((prev) => {
      const key = keyOf(product);
      const existing = prev.find((i) => keyOf(i) === key);
      const room = maxFor(prev, product);
      if (existing) {
        const next = Math.min(existing.quantity + qty, room);
        return prev.map((i) =>
          keyOf(i) === key ? { ...i, quantity: next } : i,
        );
      }
      const first = Math.min(qty, room);
      if (first < 1) return prev;
      return [...prev, { ...product, quantity: first }];
    });
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((i) => keyOf(i) !== key));
  }

  function updateQuantity(key, quantity) {
    if (quantity < 1) return removeItem(key);
    setItems((prev) => {
      const target = prev.find((i) => keyOf(i) === key);
      if (!target) return prev;
      const next = Math.min(quantity, maxFor(prev, target));
      return prev.map((i) => (keyOf(i) === key ? { ...i, quantity: next } : i));
    });
  }

  function clearCart() {
    setItems([]);
  }

  function dismissNotice() {
    setNotice(null);
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        keyOf,
        clearCart,
        total,
        count,
        notice,
        dismissNotice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
