import { useEffect, useMemo, useState } from "react";
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

/* ---------- category-specific fields ----------
   One reusable form; the section below the common fields changes with the
   category. Values are stored in the product's `attributes`, so they work with
   the existing API. Subcategory is NOT in here: the admin controls it. */
const CLOTHING_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];
const ROBE_SIZES = ["50", "52", "54", "56", "58", "60"];
const GENDER_ALL = ["Men", "Women", "Unisex", "Kids"];
const GENDER_MEN = ["Men", "Boys", "Unisex"];

const SPECS = [
  {
    test: /book/,
    title: "Book Details",
    fields: [
      { key: "author", label: "Author", required: true },
      { key: "publisher", label: "Publisher" },
      { key: "isbn", label: "ISBN" },
      { key: "pages", label: "Number of Pages", type: "number" },
      { key: "language", label: "Language", placeholder: "e.g. Urdu" },
      {
        key: "format",
        label: "Format",
        type: "select",
        options: ["Hardcover", "Paperback", "Other"],
      },
      { key: "edition", label: "Edition" },
      { key: "publication_date", label: "Publication Date", type: "date" },
      {
        key: "dimensions",
        label: "Book Dimensions",
        placeholder: "e.g. 14 x 21 cm",
      },
      { key: "weight", label: "Weight", placeholder: "e.g. 350 g" },
    ],
    variants: null,
  },
  {
    test: /attar/,
    title: "Attar Details",
    fields: [
      { key: "scent", label: "Fragrance / Scent", required: true },
      { key: "fragrance_type", label: "Fragrance Type" },
      {
        key: "scent_notes",
        label: "Fragrance Notes",
        placeholder: "e.g. woody, floral, musky",
      },
      { key: "volume_ml", label: "Volume", type: "volume" },
      { key: "concentration", label: "Concentration" },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: GENDER_ALL,
      },
      { key: "longevity", label: "Longevity", placeholder: "e.g. 8+ hours" },
      { key: "country_of_origin", label: "Country of Origin" },
      { key: "ingredients", label: "Ingredients", type: "textarea" },
    ],
    variants: null,
  },
  {
    test: /\bcaps?\b/,
    title: "Cap Details",
    fields: [
      { key: "material", label: "Material", required: true },
      { key: "pattern_design", label: "Pattern / Design" },
      { key: "closure_fit", label: "Closure / Fit" },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: GENDER_MEN,
      },
    ],
    variants: {
      required: true,
      presets: ["S", "M", "L", "XL", "Free size"],
    },
  },
  {
    test: /shalwar|kameez/,
    title: "Shalwar Kameez Details",
    fields: [
      { key: "fabric", label: "Fabric / Material", required: true },
      { key: "design_pattern", label: "Design / Pattern" },
      { key: "fit", label: "Fit" },
      { key: "collar_style", label: "Collar / Neck Style" },
      { key: "sleeve_type", label: "Sleeve Type" },
      {
        key: "set_includes",
        label: "Set Includes",
        placeholder: "e.g. Kameez + Shalwar",
      },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: GENDER_MEN,
      },
      {
        key: "care_instructions",
        label: "Care Instructions",
        type: "textarea",
      },
    ],
    variants: { required: true, presets: CLOTHING_SIZES },
  },
  {
    test: /abaya/,
    title: "Abaya Details",
    fields: [
      { key: "fabric", label: "Fabric / Material", required: true },
      { key: "design_pattern", label: "Design / Pattern" },
      { key: "abaya_style", label: "Abaya Style" },
      { key: "sleeve_style", label: "Sleeve Style" },
      { key: "closure_type", label: "Closure Type" },
      { key: "embroidery", label: "Embroidery" },
      { key: "length", label: "Length", placeholder: "e.g. 54 in" },
      {
        key: "care_instructions",
        label: "Care Instructions",
        type: "textarea",
      },
    ],
    variants: { required: true, presets: ROBE_SIZES },
  },
  {
    test: /jilbab/,
    title: "Jilbab Details",
    fields: [
      { key: "fabric", label: "Fabric / Material", required: true },
      { key: "design_pattern", label: "Design / Pattern" },
      { key: "jilbab_style", label: "Jilbab Style" },
      { key: "length", label: "Length", placeholder: "e.g. 54 in" },
      { key: "sleeve_style", label: "Sleeve Style" },
      { key: "closure_type", label: "Closure Type" },
      {
        key: "care_instructions",
        label: "Care Instructions",
        type: "textarea",
      },
    ],
    variants: { required: true, presets: ROBE_SIZES },
  },
  {
    test: /prayer|quran|accessor/,
    title: "Accessory Details",
    fields: [
      { key: "product_type", label: "Product Type" },
      { key: "material", label: "Material" },
      {
        key: "size_dimensions",
        label: "Size / Dimensions",
        placeholder: "e.g. 70 x 110 cm",
      },
      { key: "weight", label: "Weight" },
      { key: "design_pattern", label: "Design / Pattern" },
      { key: "suitable_for", label: "Suitable For" },
      {
        key: "care_instructions",
        label: "Care Instructions",
        type: "textarea",
      },
    ],
    variants: { required: false, presets: [] },
  },
];

const SPEC_KEYS = new Set(
  SPECS.flatMap((s) => s.fields.map((f) => f.key)).concat("sizes_available"),
);
const VOLUME_PRESETS = ["3", "6", "12", "15"];

function specFor(category) {
  const name = String(category?.name || "").toLowerCase();
  return SPECS.find((s) => s.test.test(name)) || null;
}

/* ---------- extra attributes (anything not in the category fields) ----------
   Each row remembers what kind of value it came from so numbers and lists
   are not turned into plain text when saved. */
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

function extraRowsFrom(attributes) {
  const entries = Object.entries(attributes || {}).filter(
    ([k]) => !SPEC_KEYS.has(k),
  );
  return entries.length
    ? entries.map(([k, v]) => attrToRow(k, v))
    : [{ key: "", value: "", kind: "string" }];
}

function buildExtraAttributes(rows) {
  const out = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    const text = row.value.trim();
    if (row.kind === "array") {
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

/* ---------- small pieces ---------- */
function Section({ title, hint, children }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-serif text-lg text-spine">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-neutral-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

// A list of values (sizes / colours): tap presets, or type your own and add.
function ChipInput({
  label,
  required,
  values,
  onChange,
  presets = [],
  placeholder,
  error,
}) {
  const [draft, setDraft] = useState("");
  const has = (v) => values.some((x) => x.toLowerCase() === v.toLowerCase());
  const remove = (v) =>
    onChange(values.filter((x) => x.toLowerCase() !== v.toLowerCase()));
  function add() {
    const t = draft.trim();
    setDraft("");
    if (t && !has(t)) onChange([...values, t]);
  }
  const custom = values.filter(
    (v) => !presets.some((p) => p.toLowerCase() === v.toLowerCase()),
  );
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-spine">
        {label}
        {required ? " *" : ""}
      </span>
      {presets.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => (has(p) ? remove(p) : onChange([...values, p]))}
              className={`h-9 min-w-[44px] rounded-lg border px-3 text-sm transition ${
                has(p)
                  ? "border-spine bg-spine text-white"
                  : "border-neutral-300 bg-white text-ink hover:border-spine"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      {custom.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {custom.map((v) => (
            <span
              key={v}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-spine/10 pl-3 pr-1.5 text-sm text-spine"
            >
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => remove(v)}
                className="grid h-6 w-6 place-items-center rounded-full hover:bg-spine/10"
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" onClick={add} className={`${btnOutline} h-10`}>
          <Plus size={15} /> Add
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const smallInput =
  "h-9 w-full rounded-lg border border-neutral-300 bg-white px-2.5 text-sm text-ink outline-none transition placeholder:text-neutral-400 focus:border-spine focus:ring-2 focus:ring-spine/15";

export default function ProductForm({
  initial,
  categories,
  categoriesError,
  onSubmit,
  submitLabel,
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? initial?.category?.id ?? "",
  );
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? "");
  const [existingSubs, setExistingSubs] = useState([]);
  const [addingNewSub, setAddingNewSub] = useState(false);

  const [price, setPrice] = useState(
    initial?.price != null ? String(initial.price) : "",
  );
  const [originalPrice, setOriginalPrice] = useState(
    initial?.originalPrice != null ? String(initial.originalPrice) : "",
  );
  const [stock, setStock] = useState(
    initial?.stock != null ? String(initial.stock) : "",
  );
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState(initial?.status ?? "ACTIVE");
  const [featured, setFeatured] = useState(Boolean(initial?.featured));

  // Category-specific values, e.g. { author: "...", fabric: "..." }.
  const [vals, setVals] = useState(() => {
    const out = {};
    for (const [k, v] of Object.entries(initial?.attributes || {})) {
      if (v !== null && typeof v !== "object") out[k] = String(v);
    }
    return out;
  });
  const [volumeCustom, setVolumeCustom] = useState(() => {
    const v = initial?.attributes?.volume_ml;
    return v != null && v !== "" && !VOLUME_PRESETS.includes(String(v));
  });
  const [extraRows, setExtraRows] = useState(() =>
    extraRowsFrom(initial?.attributes),
  );

  // Variants: lists of sizes / colours, plus one row of data per combination.
  const [sizes, setSizes] = useState(() => {
    const fromVariants = (initial?.variants || [])
      .map((v) => v.size)
      .filter(Boolean);
    const legacy = initial?.attributes?.sizes_available;
    const list = fromVariants.length
      ? fromVariants
      : Array.isArray(legacy)
        ? legacy
        : [];
    return [...new Set(list.map(String))];
  });
  const [colors, setColors] = useState(() => [
    ...new Set((initial?.variants || []).map((v) => v.color).filter(Boolean)),
  ]);
  const [variantData, setVariantData] = useState(() => {
    const out = {};
    for (const v of initial?.variants || []) {
      out[`${v.size ?? ""}|${v.color ?? ""}`] = {
        sku: v.sku ?? "",
        price: v.price != null ? String(v.price) : "",
        stock: v.stock != null ? String(v.stock) : "",
      };
    }
    return out;
  });

  // Images: one ordered list. The first one is the cover.
  const [images, setImages] = useState(() =>
    (initial?.imageUrls ?? []).map((url) => ({ id: url, url, file: null })),
  );

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const category = categories?.find((c) => String(c.id) === String(categoryId));
  const catSpec = specFor(category);

  // Subcategories already used in this category, so the admin can pick one
  // instead of retyping it. The admin can always add a brand-new one.
  useEffect(() => {
    if (!category) {
      setExistingSubs([]);
      return;
    }
    const slug =
      category.slug ||
      String(category.name || "")
        .toLowerCase()
        .replace(/&/g, "")
        .trim()
        .replace(/\s+/g, "-");
    let cancelled = false;
    api
      .get(`/products/subcategories?category=${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!cancelled)
          setExistingSubs(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setExistingSubs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  const subOptions = useMemo(() => {
    const list = [...existingSubs];
    const cur = subcategory.trim();
    if (cur && !list.some((x) => x.toLowerCase() === cur.toLowerCase()))
      list.push(cur);
    return list.sort((a, b) => a.localeCompare(b));
  }, [existingSubs, subcategory]);

  const discount = useMemo(() => {
    const p = parseFloat(price);
    const o = parseFloat(originalPrice);
    if (Number.isFinite(p) && Number.isFinite(o) && o > p && p > 0)
      return Math.round(((o - p) / o) * 100);
    return null;
  }, [price, originalPrice]);

  const variantRows = useMemo(() => {
    if (!catSpec?.variants) return [];
    if (!sizes.length && !colors.length) return [];
    const S = sizes.length ? sizes : [null];
    const C = colors.length ? colors : [null];
    const out = [];
    for (const c of C)
      for (const s of S)
        out.push({ size: s, color: c, key: `${s ?? ""}|${c ?? ""}` });
    return out;
  }, [catSpec, sizes, colors]);
  const hasVariants = variantRows.length > 0;
  const totalVariantStock = variantRows.reduce(
    (sum, r) => sum + (parseInt(variantData[r.key]?.stock, 10) || 0),
    0,
  );

  function changeCategory(id) {
    // Different category, different fields: clear the old ones.
    setCategoryId(id);
    setSubcategory("");
    setAddingNewSub(false);
    setVals({});
    setVolumeCustom(false);
    setSizes([]);
    setColors([]);
    setVariantData({});
    setFieldErrors({});
  }

  const setVal = (key, value) => setVals((v) => ({ ...v, [key]: value }));
  const setVariant = (key, patch) =>
    setVariantData((d) => ({ ...d, [key]: { ...d[key], ...patch } }));

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
      else {
        const preview = URL.createObjectURL(file);
        accepted.push({ id: preview, url: preview, file });
      }
    }
    const room = MAX_IMAGES - images.length;
    if (accepted.length > room)
      problems.push(`You can add up to ${MAX_IMAGES} images.`);
    setImages((prev) => [...prev, ...accepted.slice(0, Math.max(room, 0))]);
    setFieldErrors((f) => ({ ...f, images: problems[0] }));
  }

  const makeCover = (id) =>
    setImages((list) => {
      const item = list.find((i) => i.id === id);
      return item ? [item, ...list.filter((i) => i.id !== id)] : list;
    });

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
    if (!description.trim()) errs.description = "Add a short description.";
    if (images.length === 0) errs.images = "Add at least one product image.";

    for (const f of catSpec?.fields || []) {
      if (f.required && !String(vals[f.key] ?? "").trim())
        errs[`a_${f.key}`] = `Enter ${f.label.toLowerCase()}.`;
      if (f.type === "number" || f.type === "volume") {
        const t = String(vals[f.key] ?? "").trim();
        if (t !== "" && !(Number(t) >= 0))
          errs[`a_${f.key}`] = "Enter a valid number.";
      }
    }

    if (catSpec?.variants?.required) {
      if (!sizes.length) errs.sizes = "Add at least one size.";
      if (!colors.length) errs.colors = "Add at least one colour.";
    }

    if (hasVariants) {
      const seen = new Set();
      for (const r of variantRows) {
        const d = variantData[r.key] || {};
        const st = String(d.stock ?? "").trim();
        if (st === "" || !Number.isInteger(Number(st)) || Number(st) < 0) {
          errs.variants = "Enter the stock (0 or more) for every variant.";
          break;
        }
        if (String(d.price ?? "").trim() !== "") {
          const vp = Number(d.price);
          if (!Number.isFinite(vp) || vp <= 0) {
            errs.variants = "A variant price must be above 0 (or left blank).";
            break;
          }
        }
        const s = String(d.sku ?? "")
          .trim()
          .toLowerCase();
        if (s) {
          if (seen.has(s)) {
            errs.variants = `The SKU “${d.sku.trim()}” is used twice.`;
            break;
          }
          seen.add(s);
        }
      }
    } else {
      const s = Number(stock);
      if (stock.trim() === "" || !Number.isInteger(s) || s < 0)
        errs.stock = "Enter a whole number, 0 or more.";
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const errs = validate();
    const extra = buildExtraAttributes(extraRows);
    if (extra.error) errs.attributes = extra.error;
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setError("Please fix the highlighted fields.");
      return;
    }

    // Category fields -> attributes (numbers stay numbers).
    const specAttrs = {};
    for (const f of catSpec?.fields || []) {
      const t = String(vals[f.key] ?? "").trim();
      if (!t) continue;
      specAttrs[f.key] =
        f.type === "number" || f.type === "volume" ? Number(t) : t;
    }
    const attributes = { ...extra.attributes, ...specAttrs };
    // Kept so the storefront size picker keeps working.
    if (sizes.length) attributes.sizes_available = sizes;

    // Optional text fields: leave out when empty, but clear them on edit.
    const optional = (value, before) =>
      value.trim() ? value.trim() : before ? null : undefined;

    setBusy(true);
    try {
      const imageUrls = [];
      for (const img of images) {
        if (img.file) {
          const fd = new FormData();
          fd.append("image", img.file);
          const res = await api.post("/admin/upload-image", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          imageUrls.push(res.data.url);
        } else {
          imageUrls.push(img.url);
        }
      }

      const payload = {
        name: name.trim(),
        brand: optional(brand, initial?.brand),
        categoryId,
        subcategory: subcategory.trim(),
        price: parseFloat(price),
        originalPrice: originalPrice.trim() ? parseFloat(originalPrice) : null,
        stock: hasVariants ? totalVariantStock : parseInt(stock, 10),
        description: description.trim(),
        imageUrls,
        attributes,
        status,
        featured,
      };
      if (!hasVariants) {
        const s = optional(sku, initial?.sku);
        if (s !== undefined) payload.sku = s;
      }
      if (hasVariants) {
        payload.variants = variantRows.map((r) => {
          const d = variantData[r.key] || {};
          const v = { stock: parseInt(d.stock, 10) };
          if (r.size) v.size = r.size;
          if (r.color) v.color = r.color;
          if (String(d.sku ?? "").trim()) v.sku = d.sku.trim();
          v.price = String(d.price ?? "").trim()
            ? parseFloat(d.price)
            : parseFloat(price);
          return v;
        });
      } else if (initial?.variants?.length) {
        payload.variants = []; // editing: remove the old variants
      }
      await onSubmit(payload);
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

  function renderField(f) {
    const id = `a-${f.key}`;
    const value = vals[f.key] ?? "";
    const err = fieldErrors[`a_${f.key}`];
    let control;
    if (f.type === "select") {
      control = (
        <select
          id={id}
          className={inputCls}
          value={value}
          onChange={(e) => setVal(f.key, e.target.value)}
        >
          <option value="">Select</option>
          {f.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    } else if (f.type === "textarea") {
      control = (
        <textarea
          id={id}
          rows={2}
          className={textareaCls}
          value={value}
          onChange={(e) => setVal(f.key, e.target.value)}
        />
      );
    } else if (f.type === "volume") {
      control = (
        <div className="flex gap-2">
          <select
            id={id}
            className={inputCls}
            value={volumeCustom ? "custom" : value}
            onChange={(e) => {
              if (e.target.value === "custom") {
                setVolumeCustom(true);
                setVal(f.key, "");
              } else {
                setVolumeCustom(false);
                setVal(f.key, e.target.value);
              }
            }}
          >
            <option value="">Select</option>
            {VOLUME_PRESETS.map((v) => (
              <option key={v} value={v}>
                {v} ml
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          {volumeCustom && (
            <input
              type="number"
              min="0"
              step="0.1"
              aria-label="Custom volume in ml"
              className={inputCls}
              value={value}
              onChange={(e) => setVal(f.key, e.target.value)}
              placeholder="ml"
            />
          )}
        </div>
      );
    } else {
      control = (
        <input
          id={id}
          type={f.type === "number" ? "number" : f.type || "text"}
          min={f.type === "number" ? "0" : undefined}
          className={inputCls}
          value={value}
          onChange={(e) => setVal(f.key, e.target.value)}
          placeholder={f.placeholder || ""}
        />
      );
    }
    return (
      <div
        key={f.key}
        className={f.type === "textarea" ? "md:col-span-2" : undefined}
      >
        <Field
          label={`${f.label}${f.required ? " *" : ""}`}
          htmlFor={id}
          error={err}
        >
          {control}
        </Field>
      </div>
    );
  }

  const updateExtra = (i, patch) =>
    setExtraRows((r) =>
      r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
    );

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-4xl space-y-5">
      {/* ---- Basic information ---- */}
      <Section title="Basic Information">
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

          <Field label="Brand" htmlFor="p-brand">
            <input
              id="p-brand"
              className={inputCls}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Brand or maker"
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
              onChange={(e) => changeCategory(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Subcategory"
            htmlFor="p-sub"
            error={fieldErrors.subcategory}
            hint={
              categoryId
                ? "Pick an existing one, or add a new subcategory."
                : "Choose a category first."
            }
          >
            {addingNewSub ? (
              <div className="flex gap-2">
                <input
                  id="p-sub"
                  autoFocus
                  className={inputCls}
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  onBlur={() => {
                    const match = existingSubs.find(
                      (x) =>
                        x.toLowerCase() === subcategory.trim().toLowerCase(),
                    );
                    if (match) setSubcategory(match);
                  }}
                  placeholder="New subcategory name"
                />
                <button
                  type="button"
                  className={btnOutline}
                  onClick={() => {
                    setAddingNewSub(false);
                    setSubcategory("");
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                id="p-sub"
                className={inputCls}
                disabled={!categoryId}
                value={subcategory}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setSubcategory("");
                    setAddingNewSub(true);
                  } else {
                    setSubcategory(e.target.value);
                  }
                }}
              >
                <option value="">Select subcategory</option>
                {subOptions.map((sc) => (
                  <option key={sc} value={sc}>
                    {sc}
                  </option>
                ))}
                <option value="__new__">+ Add new subcategory…</option>
              </select>
            )}
          </Field>
        </div>
      </Section>

      {/* ---- Pricing & inventory ---- */}
      <Section title="Pricing & Inventory">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
            hint="Fill this in to show a discount. Leave it blank if the product isn’t on sale."
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

          <Field label="Discount" htmlFor="p-disc">
            <input
              id="p-disc"
              readOnly
              tabIndex={-1}
              className={`${inputCls} bg-neutral-50`}
              value={discount !== null ? `${discount}% off` : "No discount"}
            />
          </Field>

          {hasVariants ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-600 md:self-end">
              Stock and SKU are set for each variant below. Total stock:{" "}
              <strong className="text-spine">{totalVariantStock}</strong>
            </div>
          ) : (
            <>
              <Field
                label="Stock quantity *"
                htmlFor="p-stock"
                error={fieldErrors.stock}
              >
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
              <Field label="SKU" htmlFor="p-sku">
                <input
                  id="p-sku"
                  className={inputCls}
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Unique product code"
                />
              </Field>
            </>
          )}
        </div>
      </Section>

      {/* ---- Category details: only the chosen category's fields ---- */}
      {catSpec && (
        <Section title={catSpec.title}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {catSpec.fields.map(renderField)}
          </div>
        </Section>
      )}

      {/* ---- Variants ---- */}
      {catSpec?.variants && (
        <Section
          title="Variants"
          hint={
            catSpec.variants.required
              ? "Add every size and colour you sell. A row appears below for each combination."
              : "Optional. Add sizes or colours only if this product comes in more than one."
          }
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ChipInput
              label="Available sizes"
              required={catSpec.variants.required}
              values={sizes}
              onChange={setSizes}
              presets={catSpec.variants.presets}
              placeholder="Add a custom size"
              error={fieldErrors.sizes}
            />
            <ChipInput
              label="Available colours"
              required={catSpec.variants.required}
              values={colors}
              onChange={setColors}
              placeholder="e.g. Black, then press Add"
              error={fieldErrors.colors}
            />
          </div>

          {hasVariants && (
            <div className="mt-5">
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-500">
                    <tr>
                      <th className="px-3 py-2">Size</th>
                      <th className="px-3 py-2">Colour</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Price (₹)</th>
                      <th className="px-3 py-2">Stock *</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantRows.map((r) => {
                      const d = variantData[r.key] || {};
                      return (
                        <tr key={r.key} className="border-t border-neutral-100">
                          <td className="px-3 py-2 text-ink">
                            {r.size || "—"}
                          </td>
                          <td className="px-3 py-2 text-ink">
                            {r.color || "—"}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              aria-label={`SKU for ${r.size || ""} ${r.color || ""}`}
                              className={smallInput}
                              value={d.sku ?? ""}
                              onChange={(e) =>
                                setVariant(r.key, { sku: e.target.value })
                              }
                              placeholder="Optional"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              aria-label={`Price for ${r.size || ""} ${r.color || ""}`}
                              className={smallInput}
                              value={d.price ?? ""}
                              onChange={(e) =>
                                setVariant(r.key, { price: e.target.value })
                              }
                              placeholder={price || "Same as price"}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              aria-label={`Stock for ${r.size || ""} ${r.color || ""}`}
                              className={smallInput}
                              value={d.stock ?? ""}
                              onChange={(e) =>
                                setVariant(r.key, { stock: e.target.value })
                              }
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {fieldErrors.variants ? (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.variants}
                </p>
              ) : (
                <p className="mt-1 text-xs text-neutral-500">
                  Leave a price blank to use the product price.
                </p>
              )}
            </div>
          )}
        </Section>
      )}

      {/* ---- Images ---- */}
      <Section title="Product Images">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {images.map((img, i) => (
            <div key={img.id} className="space-y-1">
              <div
                className={`relative aspect-square overflow-hidden rounded-lg border bg-neutral-100 ${
                  img.file
                    ? "border-dashed border-spine/50"
                    : "border-neutral-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() =>
                    setImages((list) => list.filter((x) => x.id !== img.id))
                  }
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
                >
                  <X size={13} />
                </button>
              </div>
              {i === 0 ? (
                <p className="text-center text-xs font-medium text-spine">
                  Cover
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(img.id)}
                  className="w-full text-center text-xs text-neutral-500 underline hover:text-spine"
                >
                  Make cover
                </button>
              )}
            </div>
          ))}
          {images.length < MAX_IMAGES && (
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
          <p className="mt-2 text-xs text-red-600">{fieldErrors.images}</p>
        ) : (
          <p className="mt-2 text-xs text-neutral-500">
            PNG or JPG, up to 5 MB each. The first image is the cover.
          </p>
        )}
      </Section>

      {/* ---- Description ---- */}
      <Section title="Description">
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
      </Section>

      {/* ---- Publishing ---- */}
      <Section title="Publishing">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="Product status"
            htmlFor="p-status"
            hint="Draft products can’t be bought by customers."
          >
            <select
              id="p-status"
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </Field>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink md:self-center">
            <input
              type="checkbox"
              className={checkCls}
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Featured product
          </label>
        </div>

        <details className="mt-5 rounded-lg border border-neutral-200 px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-spine">
            More details (advanced)
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            {extraRows.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input
                  aria-label="Detail name"
                  className={`${inputCls} w-2/5`}
                  placeholder="Name"
                  value={row.key}
                  onChange={(e) => updateExtra(i, { key: e.target.value })}
                />
                <input
                  aria-label="Detail value"
                  className={inputCls}
                  placeholder={
                    row.kind === "array" ? "Comma-separated" : "Value"
                  }
                  value={row.value}
                  onChange={(e) => updateExtra(i, { value: e.target.value })}
                />
                <button
                  type="button"
                  aria-label="Remove detail"
                  onClick={() =>
                    setExtraRows((r) =>
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
                setExtraRows((r) => [
                  ...r,
                  { key: "", value: "", kind: "string" },
                ])
              }
              className={`${btnOutline} h-9 self-start`}
            >
              <Plus size={15} /> Add detail
            </button>
            {fieldErrors.attributes && (
              <p className="text-xs text-red-600">{fieldErrors.attributes}</p>
            )}
          </div>
        </details>
      </Section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href="/admin/products" className={btnOutline}>
          Cancel
        </Link>
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy
            ? images.some((i) => i.file)
              ? "Uploading and saving…"
              : "Saving…"
            : submitLabel}
        </button>
      </div>
    </form>
  );
}
