import "../styles/globals.css";
import { CartProvider } from "../lib/cart-context";

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}
