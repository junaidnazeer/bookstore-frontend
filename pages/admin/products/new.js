import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout, { useAdminUI } from "../../../components/admin/AdminLayout";
import ProductForm from "../../../components/admin/ProductForm";
import { BackLink, PageHeader } from "../../../components/admin/ui";
import api from "../../../lib/api";
import { fetchCategories } from "../../../lib/categories";

export default function NewProduct() {
  const router = useRouter();
  const { toast } = useAdminUI();
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState(null);

  // The backend needs a real category id (UUID), so the dropdown is built from
  // the live category list rather than hardcoded names.
  useEffect(() => {
    fetchCategories()
      .then((r) => setCategories(r.categories))
      .catch(() =>
        setCategoriesError(
          "Could not load categories. Refresh the page to try again.",
        ),
      );
  }, []);

  async function handleSubmit(payload) {
    await api.post("/admin/products", payload);
    toast("Product added.");
    router.push("/admin/products");
  }

  return (
    <AdminLayout title="Add Product">
      <PageHeader
        back={<BackLink href="/admin/products">Back to Products</BackLink>}
        title="Add Product"
        subtitle="Create a new product."
      />
      <ProductForm
        categories={categories}
        categoriesError={categoriesError}
        onSubmit={handleSubmit}
        submitLabel="Save Product"
      />
    </AdminLayout>
  );
}
