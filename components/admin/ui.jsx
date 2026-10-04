import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCw,
  X,
} from "lucide-react";
import { ORDER_STATUS_META, stockStatus } from "../../lib/admin";

/* ---------- shared class strings (one place = one look) ---------- */
export const btnBase =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btnBase} bg-spine text-white hover:bg-spine/90`;
export const btnOutline = `${btnBase} border border-neutral-300 bg-white text-ink hover:bg-neutral-50`;
export const btnDanger = `${btnBase} bg-red-600 text-white hover:bg-red-700`;
export const iconBtn =
  "grid h-8 w-8 place-items-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-spine focus-visible:outline-2 focus-visible:outline-spine/40 disabled:opacity-40";
export const inputCls =
  "h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-ink outline-none transition placeholder:text-neutral-400 focus:border-spine focus:ring-2 focus:ring-spine/15 disabled:bg-neutral-50 disabled:text-neutral-500";
export const textareaCls =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-neutral-400 focus:border-spine focus:ring-2 focus:ring-spine/15";
export const labelCls = "mb-1.5 block text-sm font-medium text-spine";
export const checkCls =
  "h-4 w-4 cursor-pointer rounded border-neutral-300 accent-[#1e3d32]";
export const thCls =
  "whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-neutral-500";
export const tdCls = "px-4 py-3 align-middle text-sm text-ink";

/* ---------- layout bits ---------- */
export function BackLink({ href, children }) {
  return (
    <Link
      href={href}
      className="mb-2 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition hover:text-spine"
    >
      <ArrowLeft size={14} /> {children}
    </Link>
  );
}

export function PageHeader({ title, subtitle, action, back }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="font-serif text-[26px] font-semibold leading-tight text-spine sm:text-[30px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}

export function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(30,61,50,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      )}
    </div>
  );
}

/* ---------- badges ---------- */
const TONES = {
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-sky-100 text-sky-800",
  indigo: "bg-indigo-100 text-indigo-800",
  gray: "bg-neutral-100 text-neutral-600",
};

export function Pill({ tone = "gray", children }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }) {
  const meta = ORDER_STATUS_META[status];
  return (
    <Pill tone={meta?.tone || "gray"}>{meta?.label || status || "—"}</Pill>
  );
}

export function StockBadge({ stock }) {
  const s = stockStatus(stock);
  return <Pill tone={s.tone}>{s.label}</Pill>;
}

/* ---------- states ---------- */
export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-spine/10 text-spine">
          <Icon size={22} />
        </div>
      )}
      <p className="font-medium text-ink">{title}</p>
      {message && (
        <p className="mt-1 max-w-sm text-sm text-neutral-500">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div
      className="flex flex-col items-center px-6 py-14 text-center"
      role="alert"
    >
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-600">
        <AlertCircle size={22} />
      </div>
      <p className="font-medium text-ink">Something went wrong</p>
      <p className="mt-1 max-w-sm text-sm text-neutral-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className={`${btnOutline} mt-4`}>
          <RefreshCw size={15} /> Try again
        </button>
      )}
    </div>
  );
}

// Shown when the backend doesn't implement an endpoint this page needs.
export function NotSupported({ what, endpoint, children }) {
  return (
    <div
      className="flex flex-col items-center px-6 py-14 text-center"
      role="status"
    >
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-700">
        <Info size={22} />
      </div>
      <p className="font-medium text-ink">{what} isn’t available yet</p>
      <p className="mt-1 max-w-md text-sm text-neutral-500">
        The backend doesn’t expose this feature yet, so nothing is shown rather
        than made-up data. It needs{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-ink">
          {endpoint}
        </code>
        .
      </p>
      {children}
    </div>
  );
}

// A slim notice that sits above content that IS working but is limited.
export function Notice({ children, tone = "amber" }) {
  const cls =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-sky-200 bg-sky-50 text-sky-900";
  return (
    <div
      role="status"
      className={`mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${cls}`}
    >
      <Info size={16} className="mt-0.5 flex-shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div
      className="animate-pulse divide-y divide-neutral-100"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="h-4 flex-1 rounded bg-neutral-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- pagination ---------- */
function pageWindow(page, count) {
  if (count <= 5) return Array.from({ length: count }, (_, i) => i + 1);
  const start = Math.min(Math.max(1, page - 2), count - 4);
  return Array.from({ length: 5 }, (_, i) => start + i);
}

export function Pagination({
  page,
  pageCount,
  onPage,
  total,
  shown,
  start,
  noun = "items",
}) {
  if (!total) return null;
  const from = start + 1;
  const to = start + shown;
  const num = (active) =>
    `grid h-8 min-w-8 place-items-center rounded-md px-2 text-sm transition ${
      active ? "bg-spine text-white" : "text-neutral-600 hover:bg-neutral-100"
    }`;
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 sm:flex-row">
      <p className="text-sm text-neutral-500">
        Showing {from}–{to} of {total} {noun}
      </p>
      {pageCount > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className={`${iconBtn} border border-neutral-200`}
          >
            <ChevronLeft size={16} />
          </button>
          {pageWindow(page, pageCount).map((p) => (
            <button
              key={p}
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={num(p === page)}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => onPage(page + 1)}
            disabled={page === pageCount}
            aria-label="Next page"
            className={`${iconBtn} border border-neutral-200`}
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}

/* ---------- dialogs ---------- */
export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  // Parents usually pass a fresh onClose on every render. Keeping it in a ref
  // means the effect below runs once — otherwise every keystroke in a form
  // inside the modal would re-run it and yank focus away from the input.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = ref.current;
    (
      el?.querySelector("[data-autofocus]") ||
      el?.querySelector("input, select, textarea") ||
      el?.querySelector("button")
    )?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && closeRef.current()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[90dvh] w-full overflow-y-auto rounded-xl bg-white p-6 shadow-xl ${
          wide ? "max-w-lg" : "max-w-md"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold text-spine">
            {title}
          </h2>
          <button
            onClick={() => closeRef.current()}
            aria-label="Close"
            className={iconBtn}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={() => !busy && onCancel()}>
      <div className="text-sm text-neutral-600">{message}</div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={busy}
          data-autofocus
          className={btnOutline}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className={danger ? btnDanger : btnPrimary}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
