import Head from "next/head";
import "../styles/globals.css";
import { CartProvider } from "../lib/cart-context";
import { WishlistProvider } from "../lib/wishlist-context";
import { SidebarProvider, useSidebar } from "../lib/sidebar-context";
import BottomTabBar from "../components/BottomTabBar";
import SideNav from "../components/SideNav";
import SidebarToggleButton from "../components/SidebarToggleButton";

// Needs to read sidebar state to shift page content, so it has to live
// inside SidebarProvider rather than alongside it.
function AppShell({ Component, pageProps }) {
  const { open } = useSidebar();

  return (
    <>
      <SideNav />
      <SidebarToggleButton />
      {/* Only offset content when the sidebar is actually open — collapsed
          by default, so pages are full-width until the user opens it. */}
      <div className={open ? "md:ml-56" : ""}>
        <Component {...pageProps} />
      </div>
      <BottomTabBar />
    </>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <SidebarProvider>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, maximum-scale=1"
            />
          </Head>
          <AppShell Component={Component} pageProps={pageProps} />
        </SidebarProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
