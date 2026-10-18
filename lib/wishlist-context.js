import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import api from "./api";
import { getToken } from "./auth";
import { getCatalog } from "./catalog";

const WishlistContext = createContext(null);

// Set once this browser's wishlist has been matched with the logged-in user's
// saved one. If the login later disappears, the list is cleared from this
// device so the next person on it doesn't see it.
const SYNCED_FLAG = "wishlistSynced";
const MAX_PRODUCTS = 200; // backend limit

// The ids in a /wishlist response, whatever wrapper it comes in.
function idsOf(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.productIds)) return data.productIds;
  return [];
}

export function WishlistProvider({ children }) {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const readyRef = useRef(false);
  const syncingRef = useRef(false);
  const skipSaveRef = useRef(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("wishlist");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      } catch {
        window.localStorage.removeItem("wishlist");
      }
    }
    setHydrated(true);
  }, []);

  // Load the saved wishlist (ids only), add anything saved here as a guest,
  // save the combined list, and show it with full product details.
  async function syncFromServer() {
    let merged;
    try {
      const [res, catalog] = await Promise.all([
        api.get("/wishlist"),
        getCatalog(),
      ]);
      const local = itemsRef.current;
      const ids = [];
      [...idsOf(res.data), ...local.map((p) => p.id)].forEach((id) => {
        if (!ids.includes(id)) ids.push(id);
      });
      merged = ids
        .map((id) => catalog.get(id) || local.find((p) => p.id === id))
        .filter(Boolean)
        .slice(0, MAX_PRODUCTS);
    } catch {
      // Without the product list we can't tell which saved ids are still
      // valid, and saving now could delete them. Try again later.
      return;
    }
    try {
      await api.put("/wishlist", { productIds: merged.map((p) => p.id) });
    } catch {
      return;
    }
    skipSaveRef.current = true;
    setItems(merged);
    window.localStorage.setItem(SYNCED_FLAG, "1");
    readyRef.current = true;
  }

  async function pushToServer() {
    if (!readyRef.current || !getToken()) return;
    try {
      await api.put("/wishlist", {
        productIds: itemsRef.current.map((p) => p.id).slice(0, MAX_PRODUCTS),
      });
    } catch {
      // The list still works locally and the next change tries again.
    }
  }

  function checkAuth() {
    if (!hydrated) return;
    if (!getToken()) {
      readyRef.current = false;
      clearTimeout(saveTimer.current);
      if (window.localStorage.getItem(SYNCED_FLAG)) {
        window.localStorage.removeItem(SYNCED_FLAG);
        window.localStorage.removeItem("wishlist");
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

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("wishlist", JSON.stringify(items));
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    if (!readyRef.current || !getToken()) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(pushToServer, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hydrated]);

  function toggleWishlist(product) {
    setItems((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev.filter((p) => p.id !== product.id);
      return [...prev, product];
    });
  }

  function isWishlisted(id) {
    return items.some((p) => p.id === id);
  }

  function clearWishlist() {
    setItems([]);
  }

  return (
    <WishlistContext.Provider
      value={{ items, toggleWishlist, isWishlisted, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
