import Head from "next/head";
import "../styles/globals.css";
import { CartProvider } from "../lib/cart-context";
import { WishlistProvider } from "../lib/wishlist-context";
import BottomTabBar from "../components/BottomTabBar";

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1"
          />
        </Head>
        <Component {...pageProps} />
        <BottomTabBar />
      </WishlistProvider>
    </CartProvider>
  );
}
