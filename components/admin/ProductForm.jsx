import { useMemo, useState } from "react";
import Link from "next/link";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import api from "../../lib/api";
import { getApiError } from "../../lib/admin";
import {
  Card,
  Field,
  btnOutline,
  btnPrimary,
  checkCls,
  inputCls,
  textareaCls,
} from "./ui";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 8;

/* ---------- attributes ----------
   Products store `attributes` as a free-form object, and the storefront relies
   on the TYPE of some values (e.g. sizes_available is an array). Editing them
   as plain text would silently turn arrays and numbers into strings, so each
   row remembers what kind of value it came from and converts back on save. */
function attrToRow(key, value) {
  if (Array.isArray(value))
    return { key, value: value.join(", "), kind: "array" };
  if (value !== null && typeof value === "object")
    return { key, value: JSON.stringify(value), kind: "json" };
  if (typeof value === "number")
    return { key, value: String(value), kind: "number" };
  if (typeof value === "boolean")
    return { key, value: String(value), kind: "boolean" };
  return { key, value: value == null ? "" : String(value), kind: "string" };
}

function rowsFromAttributes(attributes) {
  const entries = Object.entries(attributes || {});
  return entries.length
    ? entries.map(([k, v]) => attrToRow(k, v))
    : [{ key: "", value: "", kind: "string" }];
}

function buildAttributes(rows) {
  const out = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    const text = row.value.trim();
    if (
      row.kind === "array" ||
      (row.kind === "string" && key === "sizes_available")
    ) {
      out[key] = text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (row.kind === "json") {
      try {
        out[key] = JSON.parse(text);
      } catch {
        return { error: `The “${key}” attribute must stay valid JSON.` };
      }
    } else if (row.kind === "number") {
      const n = Number(text);
      if (text === "" || !Number.isFinite(n))
        return { error: `The “${key}” attribute must be a number.` };
      out[key] = n;
    } else if (row.kind === "boolean") {
      out[key] = text.toLowerCase() === "true";
    } else {
      out[key] = row.value;
    }
  }
  return { attributes: out };
}

export default function ProductForm({
  initial,
  categories,
  categoriesError,
  onSubmit,
  submitLabel,
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? initial?.category?.id ?? "",
  );
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? "");
  const [price, setPrice] = useState(
    initial?.price != null ? String(initial.price) : "",
  );
  const [originalPrice, setOriginalPrice] = useState(
    initial?.originalPrice != null ? String(initial.originalPrice) : "",
  );
  const [stock, setStock] = useState(
    initial?.stock != null ? String(initial.stock) : "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [status, setStatus] = useState(initial?.status ?? "ACTIVE");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [keptUrls, setKeptUrls] = useState(initial?.imageUrls ?? []);
  const [newFiles, setNewFiles] = useState([]); // [{ file, preview }]
  const [rows, setRows] = useState(() =>
    rowsFromAttributes(initial?.attributes),
  );
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const discount = useMemo(() => {
    const p = parseFloat(price);
    const o = parseFloat(originalPrice);
    if (Number.isFinite(p) && Number.isFinite(o) && o > p && p > 0)
      return Math.round(((o - p) / o) * 100);
    return null;
  }, [price, originalPrice]);

  const imageCount = keptUrls.length + newFiles.length;

  // Make sure the product's current category is always selectable, even if the
  // list we got doesn't include it (for example a category that was switched off).
  const categoryOptions =
    initial?.category && !categories.some((c) => c.id === initial.category.id)
      ? [...categories, initial.category]
      : categories;

  function addFiles(e) {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    const problems = [];
    const accepted = [];
    for (const file of picked) {
      if (!file.type.startsWith("image/"))
        problems.push(`${file.name} isn’t an image.`);
      else if (file.size > MAX_IMAGE_BYTES)
        problems.push(`${file.name} is larger than 5 MB.`);
      else accepted.push({ file, preview: URL.createObjectURL(file) });
    }
    const room = MAX_IMAGES - imageCount;
    if (accepted.length > room)
      problems.push(`You can add up to ${MAX_IMAGES} images.`);
    setNewFiles((prev) => [...prev, ...accepted.slice(0, Math.max(room, 0))]);
    setFieldErrors((f) => ({ ...f, images: problems[0] }));
  }

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = "Enter a product name.";
    if (!categoryId) errs.categoryId = "Choose a category.";
    const p = parseFloat(price);
    if (!Number.isFinite(p) || p <= 0) errs.price = "Enter a price above 0.";
    if (originalPrice.trim() !== "") {
      const o = parseFloat(originalPrice);
      if (!Number.isFinite(o) || o <= p)
        errs.originalPrice =
          "The original price must be higher than the price.";
    }
    const s = Number(stock);
    if (stock.trim() === "" || !Number.isInteger(s) || s < 0)
      errs.stock = "Enter a whole number, 0 or more.";
    if (!description.trim()) errs.description = "Add a short description.";
    if (brand.trim().length > 60)
      errs.brand = "Keep the brand under 60 characters.";
    if (sku.trim().length > 40) errs.sku = "Keep the SKU under 40 characters.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const errs = validate();
    const attrs = buildAttributes(rows);
    if (attrs.error) errs.attributes = attrs.error;
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const uploaded = [];
      for (const { file } of newFiles) {
        const fd = new FormData();
        fd.append("image", file);
        const res = await api.post("/admin/upload-image", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploaded.push(res.data.url);
      }
      await onSubmit({
        name: name.trim(),
        categoryId,
        subcategory: subcategory.trim() || null,
        price: parseFloat(price),
        originalPrice: originalPrice.trim() ? parseFloat(originalPrice) : null,
        stock: parseInt(stock, 10),
        description: description.trim(),
        brand: brand.trim() || null,
        sku: sku.trim() || null,
        status,
        featured,
        imageUrls: [...keptUrls, ...uploaded],
        attributes: attrs.attributes,
      });
    } catch (err) {
      setError(
        getApiError(
          err,
          "Could not save the product. Check the details and try again.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  const updateRow = (i, patch) =>
    setRows((r) =>
      r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card className="max-w-4xl p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="Product name *"
            htmlFor="p-name"
            error={fieldErrors.name}
          >
            <input
              id="p-name"
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
            />
          </Field>

          <Field
            label="Category *"
            htmlFor="p-cat"
            error={fieldErrors.categoryId || categoriesError}
          >
            <select
              id="p-cat"
              className={inputCls}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select category</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isActive === false ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Subcategory"
            htmlFor="p-sub"
            hint="For example Quran or Hadith for books."
          >
            <input
              id="p-sub"
              className={inputCls}
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. Quran, Hadith"
            />
          </Field>

          <Field label="Stock *" htmlFor="p-stock" error={fieldErrors.stock}>
            <input
              id="p-stock"
              type="number"
              min="0"
              step="1"
              className={inputCls}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Enter stock quantity"
            />
          </Field>

          <Field
            label="Price (₹) *"
            htmlFor="p-price"
            error={fieldErrors.price}
          >
            <input
              id="p-price"
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
            />
          </Field>

          <Field
            label="Original price (₹)"
            htmlFor="p-orig"
            error={fieldErrors.originalPrice}
            hint={
              discount !== null
                ? `Shown to customers as ${discount}% off.`
                : "Fill this in to show a discount. Leave it blank if the product isn’t on sale."
            }
          >
            <input
              id="p-orig"
              type="number"
              min="0"
              step="0.01"
              className={inputCls}
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              placeholder="Price before discount"
            />
          </Field>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="Brand *"
            htmlFor="p-brand"
            error={fieldErrors.brand}
          >
            <input
              id="p-brand"
              className={inputCls}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Dar-us-Salam"
            />
          </Field>

          <Field
            label="SKU (stock keeping unit) *"
            htmlFor="p-sku"
            error={fieldErrors.sku}
            hint="A unique stock code. Two products can’t share one."
          >
            <input
              id="p-sku"
              className={inputCls}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. QT-001"
            />
          </Field>

          <Field label="Status" htmlFor="p-status">
            <select
              id="p-status"
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
            </select>
          </Field>

          <label className="flex cursor-pointer items-start gap-3 md:mt-7">
            <input
              type="checkbox"
              className={`${checkCls} mt-0.5`}
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            <span className="text-sm">
              <span className="font-medium text-ink">Featured product</span>
              <span className="block text-xs text-neutral-500">
                Mark products you want to highlight.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-5">
          <Field
            label="Description *"
            htmlFor="p-desc"
            error={fieldErrors.description}
          >
            <textarea
              id="p-desc"
              rows={4}
              className={textareaCls}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product description"
            />
          </Field>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-spine">
              Product images
            </span>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3">
              {keptUrls.map((url) => (
                <div
                  key={url}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() =>
                      setKeptUrls((u) => u.filter((x) => x !== url))
                    }
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              {newFiles.map(({ preview }, i) => (
                <div
                  key={preview}
                  className="relative aspect-square overflow-hidden rounded-lg border border-dashed border-spine/50 bg-neutral-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() =>
                      setNewFiles((f) => f.filter((_, idx) => idx !== i))
                    }
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              {imageCount < MAX_IMAGES && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-center text-xs text-neutral-500 transition hover:border-spine hover:text-spine">
                  <span className="flex flex-col items-center gap-1 px-1">
                    <ImagePlus size={20} />
                    Add image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={addFiles}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
            {fieldErrors.images ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.images}</p>
            ) : (
              <p className="mt-1 text-xs text-neutral-500">
                PNG or JPG, up to 5 MB each. The first image is the cover.
              </p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-spine">
              Attributes
            </span>
            <div className="flex flex-col gap-2">
              {rows.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    aria-label="Attribute name"
                    className={`${inputCls} w-2/5`}
                    placeholder="e.g. author"
                    value={row.key}
                    onChange={(e) => updateRow(i, { key: e.target.value })}
                  />
                  <input
                    aria-label="Attribute value"
                    className={inputCls}
                    placeholder={
                      row.kind === "array" ? "Comma-separated" : "Value"
                    }
                    value={row.value}
                    onChange={(e) => updateRow(i, { value: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label="Remove attribute"
                    onClick={() =>
                      setRows((r) =>
                        r.length > 1
                          ? r.filter((_, idx) => idx !== i)
                          : [{ key: "", value: "", kind: "string" }],
                      )
                    }
                    className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setRows((r) => [...r, { key: "", value: "", kind: "string" }])
                }
                className={`${btnOutline} h-9 self-start`}
              >
                <Plus size={15} /> Add attribute
              </button>
            </div>
            {fieldErrors.attributes && (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.attributes}
              </p>
            )}
            <p className="mt-1 text-xs text-neutral-500">
              Books use author and language. Sizes go in{" "}
              <code>sizes_available</code>, separated by commas.
            </p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href="/admin/products" className={btnOutline}>
            Cancel
          </Link>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy
              ? newFiles.length
                ? "Uploading and saving…"
                : "Saving…"
              : submitLabel}
          </button>
        </div>
      </Card>
    </form>
  );
}
