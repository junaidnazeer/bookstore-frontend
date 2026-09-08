import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Load saved cart from this browser on first render.
  useEffect(() => {
    const saved = window.localStorage.getItem("cart");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  // Save whenever the cart changes.
  useEffect(() => {
    window.localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  function addItem(book) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === book.id);
      if (existing) {
        return prev.map((i) =>
          i.id === book.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { ...book, quantity: 1 }];
    });
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateQuantity(id, quantity) {
    if (quantity < 1) return removeItem(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
