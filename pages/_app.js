import Head from "next/head";
import { useRouter } from "next/router";
import "../styles/globals.css";
import { CartProvider } from "../lib/cart-context";
import { WishlistProvider } from "../lib/wishlist-context";
import { SidebarProvider } from "../lib/sidebar-context";
import BottomTabBar from "../components/BottomTabBar";
import SideNav from "../components/SideNav";
import SidebarToggleButton from "../components/SidebarToggleButton";

// Standalone auth pages (and anything under /admin, which has its own
// layout) never get the shop's bottom nav / sidebar chrome.
const CHROME_FREE_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/admin",
];

function AppShell({ Component, pageProps }) {
  const router = useRouter();

  const hideChrome = CHROME_FREE_PREFIXES.some((p) =>
    router.pathname.startsWith(p),
  );

  if (hideChrome) {
    return <Component {...pageProps} />;
  }

  // The drawer is an overlay, so page content no longer needs to be shifted
  // when it opens.
  return (
    <>
      <SideNav />
      <SidebarToggleButton />
      <div>
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
              content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
            />
          </Head>
          <AppShell Component={Component} pageProps={pageProps} />
        </SidebarProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
