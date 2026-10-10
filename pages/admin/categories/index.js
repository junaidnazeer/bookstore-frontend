import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Eye,
  ImagePlus,
  LayoutGrid,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import AdminLayout, { useAdminUI } from "../../../components/admin/AdminLayout";
import {
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  Notice,
  PageHeader,
  Pagination,
  Pill,
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
  getApiError,
  includesText,
  paginate,
  toArray,
} from "../../../lib/admin";

const MAX_SUBS = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_NAME = 60;

function StatusPill({ active }) {
  return (
    <Pill tone={active ? "green" : "gray"}>
      {active ? "Active" : "Inactive"}
    </Pill>
  );
}

function CategoryThumb({ src, size }) {
  return (
    <div
      className={`grid flex-shrink-0 place-items-center overflow-hidden rounded-lg bg-neutral-100 text-neutral-400 ${size}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <LayoutGrid size={18} />
      )}
    </div>
  );
}

// Add / edit popup. `category` is null when adding.
function CategoryForm({ category, existingNames, onClose, onSaved }) {
  const { toast } = useAdminUI();
  const editing = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? null);
  const [file, setFile] = useState(null); // { file, preview }
  const [active, setActive] = useState(category?.isActive ?? true);
  const [fieldError, setFieldError] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const preview = file?.preview || imageUrl;

  function pickFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/"))
      return setFieldError((x) => ({
        ...x,
        image: `${f.name} isn’t an image.`,
      }));
    if (f.size > MAX_IMAGE_BYTES)
      return setFieldError((x) => ({
        ...x,
        image: `${f.name} is larger than 5 MB.`,
      }));
    setFieldError((x) => ({ ...x, image: undefined }));
    setFile({ file: f, preview: URL.createObjectURL(f) });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    const errs = {};
    if (!trimmed) errs.name = "Enter a category name.";
    else if (trimmed.length > MAX_NAME)
      errs.name = `Keep the name under ${MAX_NAME} characters.`;
    else if (
      existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())
    )
      errs.name = "A category with this name already exists.";
    setFieldError(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    setError(null);
    try {
      let finalImage = imageUrl;
      if (file) {
        const fd = new FormData();
        fd.append("image", file.file);
        const up = await api.post("/admin/upload-image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        finalImage = up.data.url;
      }
      // The slug is never sent: the backend creates it on add and keeps it on
      // rename, so links to the category in the store don't break.
      const body = { name: trimmed, isActive: active };
      if (editing) body.imageUrl = finalImage || null;
      else if (finalImage) body.imageUrl = finalImage;
      if (editing) await api.put(`/admin/categories/${category.id}`, body);
      else await api.post("/admin/categories", body);
      toast(editing ? `Saved “${trimmed}”.` : `Added “${trimmed}”.`);
      onSaved();
    } catch (err) {
      setError(getApiError(err, "Could not save the category."));
      setBusy(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit category" : "Add category"}
      onClose={busy ? () => {} : onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field
          label="Category name *"
          htmlFor="cat-name"
          error={fieldError.name}
        >
          <input
            id="cat-name"
            className={inputCls}
            value={name}
            maxLength={MAX_NAME + 20}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Prayer Rugs"
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-spine">
            Image
          </span>
          <div className="flex items-center gap-3">
            <div className="relative">
              <CategoryThumb src={preview} size="h-16 w-16" />
              {preview && (
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => {
                    setFile(null);
                    setImageUrl(null);
                  }}
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <label className={`${btnOutline} h-9 cursor-pointer`}>
              <ImagePlus size={15} /> {preview ? "Change" : "Upload"}
              <input
                type="file"
                accept="image/*"
                onChange={pickFile}
                className="sr-only"
              />
            </label>
          </div>
          {fieldError.image ? (
            <p className="mt-1 text-xs text-red-600">{fieldError.image}</p>
          ) : (
            <p className="mt-1 text-xs text-neutral-500">
              PNG or JPG, up to 5 MB.
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className={`${checkCls} mt-0.5`}
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          <span className="text-sm">
            <span className="font-medium text-ink">Active</span>
            <span className="block text-xs text-neutral-500">
              Switch off to hide this category and its products from customers.
            </span>
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={btnOutline}
          >
            Cancel
          </button>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : editing ? "Save changes" : "Add category"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminCategories() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { toast } = useAdminUI();
  const [state, setState] = useState({ status: "loading" });
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); // { category } | null
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setState((s) => (s.status === "ready" ? s : { status: "loading" }));
    Promise.allSettled([fetchCategories(), api.get("/admin/products")]).then(
      ([c, p]) => {
        if (c.status === "rejected") {
          setState({
            status: "error",
            error: getApiError(c.reason, "Could not load categories."),
          });
          return;
        }
        setState({
          status: "ready",
          categories: c.value.categories,
          manageable: c.value.admin,
          products: p.status === "fulfilled" ? toArray(p.value.data) : null,
        });
      },
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Counts come from the backend when it sends them; subcategories and a cover
  // image come from the products themselves.
  const rows = useMemo(() => {
    if (state.status !== "ready") return [];
    return state.categories.map((c) => {
      const mine = (state.products || []).filter(
        (p) => (p.categoryId ?? p.category?.id) === c.id,
      );
      const subs = [
        ...new Set(
          mine.map((p) => (p.subcategory || "").trim()).filter(Boolean),
        ),
      ].sort();
      return {
        ...c,
        count:
          typeof c.productCount === "number"
            ? c.productCount
            : state.products
              ? mine.length
              : null,
        subs,
        isActive: typeof c.isActive === "boolean" ? c.isActive : null,
        image:
          c.imageUrl ||
          mine.find((p) => p.imageUrls?.[0])?.imageUrls[0] ||
          null,
      };
    });
  }, [state]);

  const manageable = state.status === "ready" && state.manageable;
  const statusKnown = rows.some((r) => r.isActive !== null);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !term.trim() ||
          includesText(r.name, term) ||
          r.subs.some((s) => includesText(s, term)),
      ),
    [rows, term],
  );
  const view = paginate(filtered, page);

  const search = {
    value: term,
    onChange: (v) => {
      setTerm(v);
      setPage(1);
    },
    placeholder: "Search categories",
  };

  async function confirmDelete() {
    setBusy(true);
    try {
      await api.delete(`/admin/categories/${deleteTarget.id}`);
      toast(`Deleted “${deleteTarget.name}”.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      // e.g. 409 when the category still has products: show the server's reason.
      toast(getApiError(err, "Could not delete the category."), "error");
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  }

  const productsHref = (r) =>
    `/admin/products?category=${encodeURIComponent(r.slug)}`;
  const hasProducts =
    deleteTarget &&
    typeof deleteTarget.count === "number" &&
    deleteTarget.count > 0;

  return (
    <AdminLayout title="Categories" search={search}>
      <PageHeader
        title="Categories"
        subtitle="Manage product categories."
        action={
          manageable && (
            <button
              onClick={() => setForm({ category: null })}
              className={btnPrimary}
            >
              <Plus size={16} /> Add Category
            </button>
          )
        }
      />

      {state.status === "ready" && !state.manageable && (
        <Notice>
          Adding, editing and deleting categories needs the admin category
          endpoints (
          <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">
            GET /api/admin/categories
          </code>{" "}
          and POST / PUT / DELETE). They didn’t respond, so this page is
          read-only for now.
        </Notice>
      )}

      <Card>
        {state.status === "loading" && <TableSkeleton rows={6} cols={5} />}
        {state.status === "error" && (
          <ErrorState message={state.error} onRetry={load} />
        )}

        {state.status === "ready" &&
          (rows.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title="No categories yet"
              message="Add your first category to start organising products."
              action={
                manageable && (
                  <button
                    onClick={() => setForm({ category: null })}
                    className={btnPrimary}
                  >
                    <Plus size={16} /> Add Category
                  </button>
                )
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title="No matching categories"
              message="Try a different name."
            />
          ) : (
            <>
              {isDesktop ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50/60">
                        <th className={thCls}>Image</th>
                        <th className={thCls}>Name</th>
                        <th className={thCls}>Products</th>
                        <th className={thCls}>Subcategories</th>
                        {statusKnown && <th className={thCls}>Status</th>}
                        <th className={`${thCls} text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {view.rows.map((r) => (
                        <tr key={r.id}>
                          <td className={tdCls}>
                            <CategoryThumb src={r.image} size="h-11 w-11" />
                          </td>
                          <td className={`${tdCls} font-medium`}>{r.name}</td>
                          <td className={tdCls}>{r.count ?? "—"}</td>
                          <td className={tdCls}>
                            {r.subs.length === 0 ? (
                              <span className="text-neutral-400">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {r.subs.slice(0, MAX_SUBS).map((s) => (
                                  <span
                                    key={s}
                                    className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600"
                                  >
                                    {s}
                                  </span>
                                ))}
                                {r.subs.length > MAX_SUBS && (
                                  <span className="px-1 text-xs text-neutral-500">
                                    +{r.subs.length - MAX_SUBS} more
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          {statusKnown && (
                            <td className={tdCls}>
                              {r.isActive === null ? (
                                "—"
                              ) : (
                                <StatusPill active={r.isActive} />
                              )}
                            </td>
                          )}
                          <td className={`${tdCls} text-right`}>
                            <div className="inline-flex items-center gap-0.5">
                              <Link
                                href={productsHref(r)}
                                className={iconBtn}
                                aria-label={`View ${r.name} products`}
                                title="View products"
                              >
                                <Eye size={16} />
                              </Link>
                              {manageable && (
                                <>
                                  <button
                                    onClick={() => setForm({ category: r })}
                                    className={iconBtn}
                                    aria-label={`Edit ${r.name}`}
                                    title="Edit"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(r)}
                                    className={`${iconBtn} hover:!bg-red-50 hover:!text-red-600`}
                                    aria-label={`Delete ${r.name}`}
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {view.rows.map((r) => (
                    <li key={r.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <CategoryThumb src={r.image} size="h-14 w-14" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium">{r.name}</p>
                            {r.isActive !== null && (
                              <StatusPill active={r.isActive} />
                            )}
                          </div>
                          <p className="text-sm text-neutral-500">
                            {r.count === null ? "—" : r.count} product
                            {r.count === 1 ? "" : "s"}
                          </p>
                          {r.subs.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {r.subs.map((s) => (
                                <span
                                  key={s}
                                  className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={productsHref(r)}
                          className={btnSmall}
                          aria-label={`View ${r.name} products`}
                        >
                          <Eye size={15} /> View products
                        </Link>
                        {manageable && (
                          <>
                            <button
                              onClick={() => setForm({ category: r })}
                              className={btnSmall}
                              aria-label={`Edit ${r.name}`}
                            >
                              <Pencil size={15} /> Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(r)}
                              className={`${btnSmall} text-red-600 hover:!bg-red-50`}
                              aria-label={`Delete ${r.name}`}
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Pagination
                page={view.page}
                pageCount={view.pageCount}
                onPage={setPage}
                total={filtered.length}
                shown={view.rows.length}
                start={view.start}
                noun="categories"
              />
            </>
          ))}
      </Card>

      {form && (
        <CategoryForm
          category={form.category}
          existingNames={rows
            .filter((r) => r.id !== form.category?.id)
            .map((r) => r.name)}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            load();
          }}
        />
      )}

      {deleteTarget &&
        (hasProducts ? (
          // The backend refuses this anyway (409), so explain instead of letting it fail.
          <ConfirmDialog
            title={`Can’t delete ${deleteTarget.name}`}
            message={`It still has ${deleteTarget.count} product${deleteTarget.count === 1 ? "" : "s"}. Move them to another category or delete them first, then you can delete this category.`}
            confirmLabel="View products"
            danger={false}
            onConfirm={() => router.push(productsHref(deleteTarget))}
            onCancel={() => setDeleteTarget(null)}
          />
        ) : (
          <ConfirmDialog
            title="Delete category?"
            message={
              <>
                <strong className="text-ink">{deleteTarget.name}</strong> will
                be removed. This can’t be undone.
              </>
            }
            busy={busy}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        ))}
    </AdminLayout>
  );
}
