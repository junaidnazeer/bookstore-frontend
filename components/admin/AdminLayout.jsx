import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LayoutGrid,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  Store,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import MosqueIcon from "../MosqueIcon";
import api from "../../lib/api";
import { clearAdminSession } from "../../lib/admin";
import { subscribeToasts, toast } from "../../lib/admin-toast";
import { BackLink } from "./ui";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// Section pages opened from the sidebar or a dashboard link get a "back" link at
// the top. (Detail and form pages draw their own, because where "back" goes
// depends on where you came from.)
const SECTION_PAGES = [
  "/admin/products",
  "/admin/orders",
  "/admin/users",
  "/admin/categories",
  "/admin/settings",
];

const EXPANDED_KEY = "adminSidebarExpanded";
const DESKTOP_QUERY = "(min-width: 1024px)";

// Every admin page renders its own <AdminLayout>, so it remounts on each
// navigation. This flag survives client-side navigation, which stops the
// "Checking access..." flash on every click. It is false on the server and on
// the first client render, so hydration still matches.
let authedThisSession = false;
// Who is logged in, from GET /auth/me. Cached so it isn't re-fetched on every
// page change.
let cachedProfile = null;

// Kept as a hook so pages read naturally: const { toast } = useAdminUI();
// It works anywhere (see lib/admin-toast.js), not just below the layout.
export const useAdminUI = () => ({ toast });

function readExpanded() {
  try {
    return window.localStorage.getItem(EXPANDED_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AdminLayout({ children, title, search }) {
  const router = useRouter();
  const [checked, setChecked] = useState(
    () => typeof window !== "undefined" && authedThisSession,
  );
  // Desktop: sidebar is hidden by default and slides in when opened, like the
  // storefront menu. The choice is remembered while moving between admin pages.
  const [expanded, setExpanded] = useState(() =>
    typeof window !== "undefined" && authedThisSession ? readExpanded() : false,
  );
  // Tablet / phone: drawer, hidden by default.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [profile, setProfile] = useState(() =>
    typeof window !== "undefined" ? cachedProfile : null,
  );
  const [profileFailed, setProfileFailed] = useState(false);
  const menuRef = useRef(null);

  /* ---------- session ---------- */
  const endSession = useCallback(() => {
    clearAdminSession();
    authedThisSession = false;
    cachedProfile = null;
    router.replace("/admin/login");
  }, [router]);

  useEffect(() => {
    const role = window.localStorage.getItem("role");
    const token = window.localStorage.getItem("token");
    if (role !== "ADMIN" || !token) {
      authedThisSession = false;
      router.replace("/admin/login");
      return;
    }
    authedThisSession = true;
    setExpanded(readExpanded());
    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  // The role in localStorage is only a UI hint. The backend is the authority:
  // if any admin API call comes back 401 (expired) or 403 (not an admin), the
  // session is cleared and the user is sent back to the admin login.
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err?.response?.status;
        if (
          (status === 401 || status === 403) &&
          window.localStorage.getItem("token")
        ) {
          endSession();
        }
        return Promise.reject(err);
      },
    );
    return () => api.interceptors.response.eject(id);
  }, [endSession]);

  // Ask the backend who this is. The role stored in the browser is only a hint,
  // so a non-admin account is signed out here straight away.
  useEffect(() => {
    if (!checked || cachedProfile) return;
    let cancelled = false;
    api
      .get("/auth/me")
      .then((res) => {
        if (cancelled) return;
        if (res.data?.role !== "ADMIN") {
          endSession();
          return;
        }
        cachedProfile = res.data;
        setProfile(res.data);
      })
      .catch(() => {
        if (!cancelled) setProfileFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [checked, endSession]);

  /* ---------- drawer / menu behaviour ---------- */
  useEffect(() => {
    const close = () => {
      setDrawerOpen(false);
      setMenuOpen(false);
    };
    router.events.on("routeChangeStart", close);
    return () => router.events.off("routeChangeStart", close);
  }, [router.events]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setDrawerOpen(false);
      setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  // Lock page scroll behind the drawer; drop the drawer if the window grows
  // into the desktop layout.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => mq.matches && setDrawerOpen(false);
    mq.addEventListener("change", onChange);
    return () => {
      document.body.style.overflow = prev;
      mq.removeEventListener("change", onChange);
    };
  }, [drawerOpen]);

  function closeSidebar() {
    setDrawerOpen(false);
    if (expanded) {
      setExpanded(false);
      try {
        window.localStorage.setItem(EXPANDED_KEY, "0");
      } catch {}
    }
  }

  function toggleSidebar() {
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      setExpanded((v) => {
        try {
          window.localStorage.setItem(EXPANDED_KEY, v ? "0" : "1");
        } catch {}
        return !v;
      });
    } else {
      setDrawerOpen((v) => !v);
    }
  }

  useEffect(
    () =>
      subscribeToasts((t) => {
        setToasts((list) =>
          list.some((x) => x.id === t.id) ? list : [...list, t],
        );
        setTimeout(
          () => setToasts((list) => list.filter((x) => x.id !== t.id)),
          4500,
        );
      }),
    [],
  );

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea] text-neutral-400">
        Checking access...
      </div>
    );
  }

  const displayName = (profile?.name || "").trim();
  const initial = (displayName[0] || "A").toUpperCase();
  const profileLoading = !profile && !profileFailed;
  // The Categories page links to "its" products, so go back there in that case.
  const fromCategories =
    router.pathname === "/admin/products" &&
    router.isReady &&
    typeof router.query.category === "string";
  const backTarget = SECTION_PAGES.includes(router.pathname)
    ? fromCategories
      ? { href: "/admin/categories", label: "Back to Categories" }
      : { href: "/admin/dashboard", label: "Back to Dashboard" }
    : null;
  const isActive = (href) =>
    router.pathname === href || router.pathname.startsWith(href + "/");

  return (
    <>
      <Head>
        <title>
          {title
            ? `${title} | Admin | Maktabah Islamiyah`
            : "Admin | Maktabah Islamiyah"}
        </title>
      </Head>

      <div className="min-h-screen overflow-x-clip bg-[#f7f3ea]">
        {/* Backdrop (tablet / phone only) */}
        <div
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden ${
            drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        {/* Sidebar */}
        <aside
          aria-label="Admin navigation"
          className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col overflow-y-auto bg-spine text-white transition-[translate,visibility] duration-200 lg:w-[248px] ${
            drawerOpen
              ? "visible translate-x-0 shadow-2xl"
              : "invisible -translate-x-full"
          } ${expanded ? "lg:visible lg:translate-x-0 lg:shadow-none" : "lg:invisible lg:-translate-x-full"}`}
        >
          <div className="flex h-16 flex-shrink-0 items-center justify-between gap-2 border-b border-white/10 px-5">
            <Link
              href="/admin/dashboard"
              className="flex min-w-0 items-center gap-3"
            >
              <MosqueIcon size={32} className="flex-shrink-0 text-white" />
              <div className="min-w-0">
                <p className="truncate font-serif text-[15px] font-semibold leading-tight">
                  Maktabah Islamiyah
                </p>
                <p className="text-[11px] tracking-wide text-white/60">
                  Admin Panel
                </p>
              </div>
            </Link>
            <button
              onClick={closeSidebar}
              aria-label="Close menu"
              className="flex-shrink-0 rounded-md p-1 text-white/60 transition hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                aria-current={isActive(href) ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-lg px-3.5 text-sm transition-colors ${
                  isActive(href)
                    ? "bg-white/15 font-medium text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex-shrink-0 border-t border-white/10 px-3 py-4">
            <button
              onClick={endSession}
              className="flex h-11 w-full items-center gap-3 rounded-lg px-3.5 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut size={20} className="flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main column */}
        <div
          className={`min-w-0 transition-[padding] duration-200 ${
            expanded ? "lg:pl-[248px]" : ""
          }`}
        >
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-neutral-200/70 bg-[#f7f3ea]/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <button
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              aria-expanded={drawerOpen || expanded}
              className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg border border-neutral-200 bg-white text-spine transition hover:bg-neutral-50"
            >
              <Menu size={20} />
            </button>

            <div className="flex min-w-0 flex-1 justify-center">
              {search && (
                <form
                  role="search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    search.onSubmit?.(search.value);
                  }}
                  className="relative w-full max-w-xl"
                >
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    type="search"
                    value={search.value}
                    onChange={(e) => search.onChange(e.target.value)}
                    placeholder={search.placeholder}
                    aria-label={search.placeholder}
                    className="h-10 w-full rounded-full border border-neutral-200 bg-white pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-neutral-400 focus:border-spine focus:ring-2 focus:ring-spine/15"
                  />
                </form>
              )}
            </div>

            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white pl-1.5 pr-3 text-sm text-ink transition hover:bg-neutral-50"
              >
                <span
                  className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-spine text-xs font-medium text-white ${
                    profileLoading ? "animate-pulse opacity-60" : ""
                  }`}
                >
                  {profileLoading ? "" : initial}
                </span>
                <span className="hidden max-w-[150px] truncate sm:inline">
                  {profileLoading ? "" : displayName || "Admin"}
                </span>
                <ChevronDown size={15} className="text-neutral-500" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
                >
                  <div className="border-b border-neutral-100 px-4 py-3">
                    <p className="truncate text-sm font-medium text-ink">
                      {displayName || "Admin"}
                    </p>
                    {profile?.email && (
                      <p className="truncate text-xs text-neutral-500">
                        {profile.email}
                      </p>
                    )}
                  </div>
                  <Link
                    href="/"
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-neutral-50"
                  >
                    <Store size={16} className="text-neutral-500" /> View Store
                  </Link>
                  <button
                    role="menuitem"
                    onClick={endSession}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </header>

          <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
            {backTarget && (
              <BackLink href={backTarget.href}>{backTarget.label}</BackLink>
            )}
            {children}
          </main>
        </div>

        {/* Toasts */}
        <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg ${
                t.type === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900"
              }`}
            >
              {t.type === "error" ? (
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
              )}
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
