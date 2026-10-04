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

// Needs to read sidebar state to shift page content, so it has to live
// inside SidebarProvider rather than alongside it.
function AppShell({ Component, pageProps }) {
  const { open } = useSidebar();
  const router = useRouter();
  // The admin panel has its own sidebar and top bar. The customer sidebar,
  // floating menu button and mobile tab bar must not render on top of it.
  const isAdmin = router.pathname.startsWith("/admin");

  useEffect(() => {
    document.body.classList.toggle("admin-route", isAdmin);
  }, [isAdmin]);

  if (isAdmin) return <Component {...pageProps} />;

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
