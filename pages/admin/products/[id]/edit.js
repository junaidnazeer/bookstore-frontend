import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { PackageX } from "lucide-react";
import AdminLayout, {
  useAdminUI,
} from "../../../../components/admin/AdminLayout";
import ProductForm from "../../../../components/admin/ProductForm";
import {
  BackLink,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  TableSkeleton,
} from "../../../../components/admin/ui";
import api from "../../../../lib/api";
import { fetchCategories } from "../../../../lib/categories";
import { apiStatus, getApiError, toArray } from "../../../../lib/admin";

export default function EditProduct() {
  const router = useRouter();
  const { toast } = useAdminUI();
  const { id } = router.query;
  const [state, setState] = useState({ status: "loading" });
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState(null);

  async function loadProduct(productId) {
    setState({ status: "loading" });
    try {
      const res = await api.get(`/admin/products/${productId}`);
      setState({ status: "ready", product: res.data });
    } catch (err) {
      // If the single-product endpoint isn't deployed yet, fall back to the list.
      if ([404, 405].includes(apiStatus(err))) {
        try {
          const list = await api.get("/admin/products");
          const found = toArray(list.data).find(
            (p) => String(p.id) === String(productId),
          );
          setState(
            found ? { status: "ready", product: found } : { status: "missing" },
          );
          return;
        } catch (err2) {
          setState({
            status: "error",
            error: getApiError(err2, "Could not load this product."),
          });
          return;
        }
      }
      setState({
        status: "error",
        error: getApiError(err, "Could not load this product."),
      });
    }
  }

  useEffect(() => {
    if (!router.isReady) return;
    loadProduct(id);
    fetchCategories()
      .then((r) => setCategories(r.categories))
      .catch(() =>
        setCategoriesError(
          "Could not load categories. Refresh the page to try again.",
        ),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, id]);

  async function handleSubmit(payload) {
    await api.put(`/admin/products/${id}`, payload);
    toast("Product updated.");
    router.push("/admin/products");
  }

  return (
    <AdminLayout title="Edit Product">
      <PageHeader
        back={<BackLink href="/admin/products">Back to Products</BackLink>}
        title="Edit Product"
        subtitle={
          state.status === "ready"
            ? state.product.name
            : "Update product details."
        }
      />
      {state.status === "loading" && (
        <Card className="max-w-4xl">
          <TableSkeleton rows={6} cols={2} />
        </Card>
      )}
      {state.status === "error" && (
        <Card className="max-w-4xl">
          <ErrorState message={state.error} onRetry={() => loadProduct(id)} />
        </Card>
      )}
      {state.status === "missing" && (
        <Card className="max-w-4xl">
          <EmptyState
            icon={PackageX}
            title="Product not found"
            message="It may have been deleted."
          />
        </Card>
      )}
      {state.status === "ready" && (
        <ProductForm
          key={state.product.id}
          initial={state.product}
          categories={categories}
          categoriesError={categoriesError}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
        />
      )}
    </AdminLayout>
  );
}
