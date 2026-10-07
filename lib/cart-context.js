import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Load saved cart from this browser on first render.
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
  }, []);

  // Save whenever the cart changes.
  useEffect(() => {
    window.localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
