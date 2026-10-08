import { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import "../styles/globals.css";
import { CartProvider } from "../lib/cart-context";
import { WishlistProvider } from "../lib/wishlist-context";
import { SidebarProvider, useSidebar } from "../lib/sidebar-context";
import BottomTabBar from "../components/BottomTabBar";
import SideNav from "../components/SideNav";
import SidebarToggleButton from "../components/SidebarToggleButton";

// Pages that must NOT get the customer menu button, sidebar or mobile tab bar:
// the admin panel (own layout) and the login / signup / forgot-password pages.
const CHROME_FREE_PREFIXES = [
  "/admin",
  "/login",
  "/signup",
  "/forgot-password",
];

// Needs to read sidebar state to shift page content, so it has to live
// inside SidebarProvider rather than alongside it.
function AppShell({ Component, pageProps }) {
  const { open } = useSidebar();
  const router = useRouter();
  const chromeFree = CHROME_FREE_PREFIXES.some((p) =>
    router.pathname.startsWith(p),
  );

  // "admin-route" also removes the extra bottom padding that the mobile tab
  // bar needs, so no empty gap is left on these pages.
  useEffect(() => {
    document.body.classList.toggle("admin-route", chromeFree);
  }, [chromeFree]);

  if (chromeFree) return <Component {...pageProps} />;

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
