import { useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/admin/AdminLayout";
import api from "../../../lib/api";

const CATEGORY_OPTIONS = [
  { value: "", label: "Select category" },
  { value: "books", label: "Books" },
  { value: "attars", label: "Attars" },
  { value: "caps", label: "Caps" },
  { value: "shalwar-kameez", label: "Shalwar Kameez" },
  { value: "abayas", label: "Abayas" },
  { value: "jilbabs", label: "Jilbabs" },
  { value: "prayer-quran-accessories", label: "Prayer & Quran Accessories" },
];

export default function NewProduct() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function updateAttribute(index, field, value) {
    setAttributes((prev) =>
      prev.map((attr, i) => (i === index ? { ...attr, [field]: value } : attr)),
    );
  }

  function addAttributeRow() {
    setAttributes((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeAttributeRow(index) {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name || !category || !price || !stock || !description) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await api.post("/admin/upload-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = uploadRes.data.url;
      }

      const attributesObject = {};
      attributes.forEach((attr) => {
        if (attr.key.trim()) attributesObject[attr.key.trim()] = attr.value;
      });

      await api.post("/admin/products", {
        name,
        category,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        description,
        imageUrls: imageUrl ? [imageUrl] : [],
        attributes: attributesObject,
      });

      router.push("/admin/products");
    } catch (err) {
      setError("Could not create product. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-ink">Add New Product</h1>
        <button
          onClick={() => router.push("/admin/products")}
          className="text-sm text-spine"
        >
          ← Back to Products
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-neutral-200 rounded-lg p-6 max-w-3xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-neutral-600 mb-1 block">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600 mb-1 block">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-600 mb-1 block">
              Price (₹) *
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-600 mb-1 block">
              Stock *
            </label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Enter stock quantity"
              className="w-full border border-neutral-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-neutral-600 mb-1 block">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter product description..."
            rows={3}
            className="w-full border border-neutral-300 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-neutral-600 mb-1 block">
              Product Image
            </label>
            <label className="border border-dashed border-neutral-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer text-center text-sm text-neutral-400 overflow-hidden">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <p>Click to upload or drag and drop</p>
                  <p className="text-xs">PNG, JPG up to 5MB</p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="text-sm text-neutral-600 mb-1 block">
              Attributes (optional)
            </label>
            <div className="flex flex-col gap-2">
              {attributes.map((attr, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Author"
                    value={attr.key}
                    onChange={(e) => updateAttribute(i, "key", e.target.value)}
                    className="w-1/3 border border-neutral-300 rounded px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Enter value"
                    value={attr.value}
                    onChange={(e) =>
                      updateAttribute(i, "value", e.target.value)
                    }
                    className="flex-1 border border-neutral-300 rounded px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttributeRow(i)}
                    className="text-neutral-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addAttributeRow}
                className="text-sm text-spine border border-spine rounded px-3 py-1.5 self-start"
              >
                + Add Attribute
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-spine text-white rounded font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add Product"}
        </button>
      </form>
    </AdminLayout>
  );
}
