import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, LayoutGrid } from "lucide-react";
import AdminLayout from "../../../components/admin/AdminLayout";
import {
  Card,
  EmptyState,
  ErrorState,
  Notice,
  PageHeader,
  Pagination,
  TableSkeleton,
  iconBtn,
  tdCls,
  thCls,
} from "../../../components/admin/ui";
import api from "../../../lib/api";
import {
  getApiError,
  includesText,
  paginate,
  toArray,
} from "../../../lib/admin";

const MAX_SUBS = 4;

export default function AdminCategories() {
  const [state, setState] = useState({ status: "loading" });
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setState((s) => (s.status === "ready" ? s : { status: "loading" }));
    Promise.allSettled([
      api.get("/categories"),
      api.get("/admin/products"),
    ]).then(([c, p]) => {
      if (c.status === "rejected") {
        setState({
          status: "error",
          error: getApiError(c.reason, "Could not load categories."),
        });
        return;
      }
      setState({
        status: "ready",
        categories: toArray(c.value.data),
        products: p.status === "fulfilled" ? toArray(p.value.data) : null,
      });
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Counts, subcategories and a cover image all come from the real products.
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
        count: state.products ? mine.length : null,
        subs,
        image: mine.find((p) => p.imageUrls?.[0])?.imageUrls[0] || null,
      };
    });
  }, [state]);

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

  return (
    <AdminLayout title="Categories" search={search}>
      <PageHeader title="Categories" subtitle="Manage product categories." />

      <Notice>
        Adding, renaming and deleting categories needs admin category endpoints
        in the backend (
        <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">
          POST / PUT / DELETE /api/admin/categories
        </code>
        ), which don’t exist yet. Until then this page shows the live
        categories. Subcategories come from the products themselves, so you set
        them when you add or edit a product.
      </Notice>

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
              message="The backend didn’t return any categories."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title="No matching categories"
              message="Try a different name."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/60">
                      <th className={thCls}>Image</th>
                      <th className={thCls}>Name</th>
                      <th className={thCls}>Products</th>
                      <th className={thCls}>Subcategories</th>
                      <th className={`${thCls} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {view.rows.map((r) => (
                      <tr key={r.id}>
                        <td className={tdCls}>
                          <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-lg bg-neutral-100 text-neutral-400">
                            {r.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={r.image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <LayoutGrid size={18} />
                            )}
                          </div>
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
                        <td className={`${tdCls} text-right`}>
                          <Link
                            href={`/admin/products?category=${encodeURIComponent(r.slug)}`}
                            className={iconBtn}
                            aria-label={`View ${r.name} products`}
                            title="View products"
                          >
                            <Eye size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
    </AdminLayout>
  );
}
