import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Package, PackagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import AdminLayout, { useAdminUI } from "../../../components/admin/AdminLayout";
import {
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  Pagination,
  PageHeader,
  StockBadge,
  TableSkeleton,
  btnOutline,
  btnPrimary,
  btnSmall,
  checkCls,
  iconBtn,
  inputCls,
  tdCls,
  thCls,
  useIsDesktop,
} from "../../../components/admin/ui";
import api from "../../../lib/api";
import { fetchCategories } from "../../../lib/categories";
import {
  formatCurrency,
  getApiError,
  includesText,
  paginate,
  toArray,
} from "../../../lib/admin";

function RestockModal({ product, onClose, onSaved }) {
  const { toast } = useAdminUI();
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave(e) {
    e.preventDefault();
    const add = Number(quantity);
    if (!Number.isInteger(add) || add <= 0) {
      setError("Enter a whole number above 0.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.put(`/admin/products/${product.id}`, {
        stock: Number(product.stock) + add,
      });
      toast(`Added ${add} to ${product.name}.`);
      onSaved();
    } catch (err) {
      setError(getApiError(err, "Could not update stock."));
      setSaving(false);
    }
  }

  return (
    <Modal title="Restock product" onClose={onClose}>
      <form onSubmit={handleSave}>
        <p className="font-medium text-ink">{product.name}</p>
        <p className="mb-4 text-sm text-neutral-500">
          Current stock: {product.stock}
        </p>
        <Field label="Quantity to add" htmlFor="restock-qty" error={error}>
          <input
            id="restock-qty"
            type="number"
            min="1"
            step="1"
            className={inputCls}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 10"
          />
        </Field>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnOutline}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? "Saving…" : "Save stock"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminProducts() {
  const router = useRouter();
  const { toast } = useAdminUI();
  const isDesktop = useIsDesktop();
  const [state, setState] = useState({ status: "loading" });
  const [categories, setCategories] = useState([]);
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [restockTarget, setRestockTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setState((s) => (s.status === "ready" ? s : { status: "loading" }));
    Promise.allSettled([api.get("/admin/products"), fetchCategories()]).then(
      ([p, c]) => {
        if (p.status === "rejected") {
          setState({
            status: "error",
            error: getApiError(p.reason, "Could not load products."),
          });
          return;
        }
        setState({ status: "ready", products: toArray(p.value.data) });
        if (c.status === "fulfilled") setCategories(c.value.categories);
      },
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The Categories page links here with ?category=<slug>.
  useEffect(() => {
    if (!router.isReady) return;
    if (typeof router.query.category === "string")
      setCategory(router.query.category);
    if (typeof router.query.q === "string") setTerm(router.query.q);
  }, [router.isReady, router.query.category, router.query.q]);

  const products = state.status === "ready" ? state.products : [];

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (!term.trim() ||
            includesText(p.name, term) ||
            includesText(p.subcategory, term)) &&
          (!category || p.category?.slug === category),
      ),
    [products, term, category],
  );

  const view = paginate(filtered, page);

  // Changing what's visible resets to page 1 and clears the selection so a
  // bulk action can never touch rows the admin can no longer see.
  function changeFilter(fn) {
    fn();
    setPage(1);
    setSelected(new Set());
  }

  const pageIds = view.rows.map((p) => p.id);
  const allOnPage =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPage) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await api.delete(`/admin/products/${deleteTarget.id}`);
      toast(`Deleted “${deleteTarget.name}”.`);
      setSelected((s) => {
        const n = new Set(s);
        n.delete(deleteTarget.id);
        return n;
      });
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast(getApiError(err, "Could not delete the product."), "error");
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  }

  async function confirmBulkDelete() {
    setBusy(true);
    const ids = [...selected];
    const results = await Promise.allSettled(
      ids.map((id) => api.delete(`/admin/products/${id}`)),
    );
    const failed = ids.filter((_, i) => results[i].status === "rejected");
    const done = ids.length - failed.length;
    if (done) toast(`Deleted ${done} product${done > 1 ? "s" : ""}.`);
    if (failed.length)
      toast(
        `${failed.length} couldn’t be deleted. They’re still selected.`,
        "error",
      );
    setSelected(new Set(failed));
    setBulkOpen(false);
    setBusy(false);
    load();
  }

  const search = {
    value: term,
    onChange: (v) => changeFilter(() => setTerm(v)),
    placeholder: "Search products",
  };

  return (
    <AdminLayout title="Products" search={search}>
      <PageHeader
        title="Products"
        subtitle="Manage your store products."
        action={
          <Link href="/admin/products/new" className={btnPrimary}>
            <Plus size={16} /> Add Product
          </Link>
        }
      />

      <Card>
        {categories.length > 0 && (
          <div
            className="flex flex-wrap gap-2 border-b border-neutral-100 p-4"
            role="group"
            aria-label="Filter by category"
          >
            {[{ id: "", slug: "", name: "All" }, ...categories].map((c) => {
              const active = category === c.slug;
              return (
                <button
                  key={c.id || "all"}
                  onClick={() => changeFilter(() => setCategory(c.slug))}
                  aria-pressed={active}
                  className={`h-8 flex-shrink-0 rounded-full px-4 text-sm transition ${
                    active
                      ? "bg-spine text-white"
                      : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {c.name}
                  {c.isActive === false ? " (inactive)" : ""}
                </button>
              );
            })}
          </div>
        )}

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-neutral-100 bg-spine/5 px-4 py-2.5 text-sm">
            <span className="font-medium text-spine">
              {selected.size} selected
            </span>
            <button
              onClick={() => setBulkOpen(true)}
              className="font-medium text-red-600 hover:underline"
            >
              Delete selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-neutral-500 hover:underline"
            >
              Clear
            </button>
          </div>
        )}

        {state.status === "loading" && <TableSkeleton rows={6} cols={6} />}
        {state.status === "error" && (
          <ErrorState message={state.error} onRetry={load} />
        )}

        {state.status === "ready" &&
          (products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No products yet"
              message="Add your first product to start selling."
              action={
                <Link href="/admin/products/new" className={btnPrimary}>
                  <Plus size={16} /> Add Product
                </Link>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No matching products"
              message="Try a different search or category."
            />
          ) : (
            <>
              {isDesktop ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px]">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50/60">
                        <th className={`${thCls} w-10`}>
                          <input
                            type="checkbox"
                            className={checkCls}
                            checked={allOnPage}
                            onChange={toggleAll}
                            aria-label="Select all products on this page"
                          />
                        </th>
                        <th className={thCls}>Image</th>
                        <th className={thCls}>Name</th>
                        <th className={thCls}>Category</th>
                        <th className={thCls}>Price</th>
                        <th className={thCls}>Stock</th>
                        <th className={thCls}>Status</th>
                        <th className={`${thCls} text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {view.rows.map((p) => {
                        const onSale =
                          Number(p.originalPrice) > Number(p.price);
                        return (
                          <tr
                            key={p.id}
                            className={
                              selected.has(p.id) ? "bg-spine/[0.03]" : undefined
                            }
                          >
                            <td className={tdCls}>
                              <input
                                type="checkbox"
                                className={checkCls}
                                checked={selected.has(p.id)}
                                onChange={() => toggleOne(p.id)}
                                aria-label={`Select ${p.name}`}
                              />
                            </td>
                            <td className={tdCls}>
                              <div className="h-11 w-11 overflow-hidden rounded-lg bg-neutral-100">
                                {p.imageUrls?.[0] && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={p.imageUrls[0]}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                            </td>
                            <td className={tdCls}>
                              <p className="max-w-[240px] font-medium leading-snug">
                                {p.name}
                              </p>
                              {p.subcategory && (
                                <p className="text-xs text-neutral-500">
                                  {p.subcategory}
                                </p>
                              )}
                            </td>
                            <td className={`${tdCls} text-neutral-600`}>
                              {p.category?.name || "—"}
                            </td>
                            <td className={tdCls}>
                              <span className="whitespace-nowrap">
                                {formatCurrency(p.price)}
                              </span>
                              {onSale && (
                                <span className="block whitespace-nowrap text-xs text-neutral-400 line-through">
                                  {formatCurrency(p.originalPrice)}
                                </span>
                              )}
                            </td>
                            <td className={tdCls}>{p.stock}</td>
                            <td className={tdCls}>
                              <StockBadge stock={p.stock} />
                            </td>
                            <td className={`${tdCls} text-right`}>
                              <div className="inline-flex items-center gap-0.5">
                                <button
                                  onClick={() => setRestockTarget(p)}
                                  aria-label={`Restock ${p.name}`}
                                  title="Restock"
                                  className={iconBtn}
                                >
                                  <PackagePlus size={16} />
                                </button>
                                <Link
                                  href={`/admin/products/${p.id}/edit`}
                                  aria-label={`Edit ${p.name}`}
                                  title="Edit"
                                  className={iconBtn}
                                >
                                  <Pencil size={16} />
                                </Link>
                                <button
                                  onClick={() => setDeleteTarget(p)}
                                  aria-label={`Delete ${p.name}`}
                                  title="Delete"
                                  className={`${iconBtn} hover:!bg-red-50 hover:!text-red-600`}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50/60 px-4 py-2.5">
                    <input
                      type="checkbox"
                      className={checkCls}
                      checked={allOnPage}
                      onChange={toggleAll}
                      aria-label="Select all products on this page"
                    />
                    <span className="text-xs text-neutral-500">
                      Select all on this page
                    </span>
                  </div>
                  <ul className="divide-y divide-neutral-100">
                    {view.rows.map((p) => {
                      const onSale = Number(p.originalPrice) > Number(p.price);
                      return (
                        <li
                          key={p.id}
                          className={`p-4 ${selected.has(p.id) ? "bg-spine/[0.03]" : ""}`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className={`${checkCls} mt-1 flex-shrink-0`}
                              checked={selected.has(p.id)}
                              onChange={() => toggleOne(p.id)}
                              aria-label={`Select ${p.name}`}
                            />
                            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                              {p.imageUrls?.[0] && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.imageUrls[0]}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium leading-snug">
                                {p.name}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {[p.category?.name, p.subcategory]
                                  .filter(Boolean)
                                  .join(" · ") || "—"}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                                <span className="font-medium">
                                  {formatCurrency(p.price)}
                                </span>
                                {onSale && (
                                  <span className="text-xs text-neutral-400 line-through">
                                    {formatCurrency(p.originalPrice)}
                                  </span>
                                )}
                                <span className="text-neutral-500">
                                  Stock {p.stock}
                                </span>
                                <StockBadge stock={p.stock} />
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => setRestockTarget(p)}
                              className={btnSmall}
                              aria-label={`Restock ${p.name}`}
                            >
                              <PackagePlus size={15} /> Restock
                            </button>
                            <Link
                              href={`/admin/products/${p.id}/edit`}
                              className={btnSmall}
                              aria-label={`Edit ${p.name}`}
                            >
                              <Pencil size={15} /> Edit
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(p)}
                              className={`${btnSmall} text-red-600 hover:!bg-red-50`}
                              aria-label={`Delete ${p.name}`}
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              <Pagination
                page={view.page}
                pageCount={view.pageCount}
                onPage={setPage}
                total={filtered.length}
                shown={view.rows.length}
                start={view.start}
                noun="products"
              />
            </>
          ))}
      </Card>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete product?"
          message={
            <>
              <strong className="text-ink">{deleteTarget.name}</strong> will be
              removed from the store. This can’t be undone.
            </>
          }
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {bulkOpen && (
        <ConfirmDialog
          title={`Delete ${selected.size} product${selected.size > 1 ? "s" : ""}?`}
          message="The selected products will be removed from the store. This can’t be undone."
          confirmLabel={`Delete ${selected.size}`}
          busy={busy}
          onConfirm={confirmBulkDelete}
          onCancel={() => setBulkOpen(false)}
        />
      )}

      {restockTarget && (
        <RestockModal
          product={restockTarget}
          onClose={() => setRestockTarget(null)}
          onSaved={() => {
            setRestockTarget(null);
            load();
          }}
        />
      )}
    </AdminLayout>
  );
}
