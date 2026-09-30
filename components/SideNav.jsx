import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Home,
  Grid,
  Search,
  Heart,
  User,
  X,
  ChevronRight,
  Headphones,
  LogOut,
  LogIn,
} from "lucide-react";
import MosqueIcon from "./MosqueIcon";
import { useSidebar } from "../lib/sidebar-context";

// Desktop-only slide-in drawer. Everything here is behind `md:` so the
// mobile layout (BottomTabBar) is completely unaffected.

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/categories", label: "Categories", icon: Grid, chevron: true },
  { href: "/search", label: "Search", icon: Search },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account", label: "Account", icon: User, chevron: true },
];

// Soft sage — a light tint of the brand green, matching the reference.
const ACTIVE_BG = "#E4EBE2";

const ITEM_CLASS =
  "flex w-full items-center gap-3.5 min-h-[48px] px-3.5 py-2 rounded-xl text-[15px] font-medium text-left transition-colors hover:bg-spine/5 focus-visible:outline-2 focus-visible:outline-spine/40";

function isActive(router, href) {
  const path = router.pathname;
  // /account/details, /account/addresses, ... all belong to Account.
  if (href === "/account")
    return path === "/account" || path.startsWith("/account/");
  return path === href;
}

export default function SideNav() {
  const router = useRouter();
  const { open, setOpen } = useSidebar();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);

  const close = () => setOpen(false);

  // Keep the Login/Logout slot in sync with the stored session.
  useEffect(() => {
    setIsLoggedIn(!!window.localStorage.getItem("token"));
  }, [open, router.pathname]);

  // Close after any navigation.
  useEffect(() => {
    const handle = () => setOpen(false);
    router.events.on("routeChangeComplete", handle);
    return () => router.events.off("routeChangeComplete", handle);
  }, [router.events, setOpen]);

  // While open: Escape to close, Tab trapped inside, page scroll locked,
  // and auto-close if the window shrinks into the mobile layout.
  useEffect(() => {
    if (!open) return;

    const mq = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = () => {
      if (!mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onBreakpoint);

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          "a[href], button:not([disabled])",
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // html carries overflow-x: clip in globals.css, so lock on <html> (that's
    // what propagates to the viewport) and compensate for the scrollbar so
    // the page doesn't jump sideways.
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyPad = body.style.paddingRight;
    const scrollbar = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    // The drawer is still visibility:hidden on the very first frame of its
    // transition, so focusing synchronously would silently fail.
    const focusTimer = setTimeout(() => closeBtnRef.current?.focus(), 40);

    return () => {
      clearTimeout(focusTimer);
      mq.removeEventListener("change", onBreakpoint);
      document.removeEventListener("keydown", onKeyDown);
      html.style.overflow = prevHtmlOverflow;
      body.style.paddingRight = prevBodyPad;
      // Hand focus back to the hamburger button for keyboard users.
      requestAnimationFrame(() => {
        document.querySelector('button[aria-label="Open menu"]')?.focus();
      });
    };
  }, [open, setOpen]);

  // Same session cleanup and redirect the Account page already uses.
  function handleLogout() {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("role");
    window.localStorage.removeItem("userName");
    window.localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    close();
    router.push("/login");
  }

  const helpActive = router.pathname === "/help";

  return (
    <>
      {/* Overlay — sits under the drawer, above the page. */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`hidden md:block fixed inset-0 z-[90] bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        className={`hidden md:flex md:flex-col fixed left-0 top-0 bottom-0 z-[100] w-[340px] max-w-[90vw] bg-white shadow-2xl overflow-y-auto overscroll-contain transition-[translate,visibility] duration-200 ease-out ${
          open ? "translate-x-0 visible" : "-translate-x-full invisible"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 flex-shrink-0">
          <Link
            href="/"
            onClick={close}
            className="flex items-center gap-2.5 min-w-0"
          >
            <MosqueIcon size={32} className="text-spine flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-serif text-[15px] font-semibold leading-tight truncate text-spine">
                Maktabah Islamiyah
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                Faith · Knowledge · Lifestyle
              </div>
            </div>
          </Link>
          <button
            ref={closeBtnRef}
            onClick={close}
            aria-label="Close menu"
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-spine hover:bg-neutral-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 pt-1 flex-shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(router, tab.href);
            return (
              <Link
                key={tab.label}
                href={tab.href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={`${ITEM_CLASS} text-ink`}
                style={active ? { backgroundColor: ACTIVE_BG } : undefined}
              >
                <Icon size={21} className="text-spine flex-shrink-0" />
                <span className="flex-1 min-w-0 truncate">{tab.label}</span>
                {tab.chevron && (
                  <ChevronRight
                    size={16}
                    className="text-spine/60 flex-shrink-0"
                  />
                )}
              </Link>
            );
          })}

          <div className="my-2.5 mx-3.5 border-t border-neutral-200" />

          <Link
            href="/help"
            onClick={close}
            aria-current={helpActive ? "page" : undefined}
            className={`${ITEM_CLASS} text-ink`}
            style={helpActive ? { backgroundColor: ACTIVE_BG } : undefined}
          >
            <Headphones size={21} className="text-spine flex-shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block leading-tight">Help &amp; Support</span>
              <span className="block text-xs font-normal text-neutral-400 mt-0.5">
                FAQs · Contact Us
              </span>
            </span>
          </Link>

          <div className="my-2.5 mx-3.5 border-t border-neutral-200" />

          {isLoggedIn ? (
            <button onClick={handleLogout} className={`${ITEM_CLASS} text-ink`}>
              <LogOut size={21} className="text-spine flex-shrink-0" />
              <span className="flex-1">Logout</span>
            </button>
          ) : (
            <Link
              href="/login"
              onClick={close}
              className={`${ITEM_CLASS} text-ink`}
            >
              <LogIn size={21} className="text-spine flex-shrink-0" />
              <span className="flex-1">Login</span>
            </Link>
          )}
        </nav>

        {/* Footer blessing */}
        <div className="mt-auto flex-shrink-0 px-6 pt-10 pb-6 text-center">
          <MosqueIcon
            size={84}
            className="text-spine opacity-[0.07] mx-auto mb-2"
          />
          <p className="font-serif text-[13px] leading-relaxed text-neutral-500 max-w-[240px] mx-auto">
            May your journey be filled with knowledge, peace and barakah.
          </p>
        </div>
      </aside>
    </>
  );
}
