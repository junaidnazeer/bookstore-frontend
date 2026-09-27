import Head from "next/head";
import "../styles/globals.css";
import { CartProvider } from "../lib/cart-context";
import { WishlistProvider } from "../lib/wishlist-context";
import BottomTabBar from "../components/BottomTabBar";
import SideNav from "../components/SideNav";

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
          />
        </Head>
        <SideNav />
        {/* md:ml-56 matches SideNav's width, so desktop content shifts right
            instead of being covered by the fixed sidebar. No effect below
            md, where the sidebar is hidden and BottomTabBar takes over. */}
        <div className="md:ml-56">
          <Component {...pageProps} />
        </div>
        <BottomTabBar />
      </WishlistProvider>
    </CartProvider>
  );
}
