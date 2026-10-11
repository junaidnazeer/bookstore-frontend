import { useCallback, useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import AdminLayout, { useAdminUI } from "../../components/admin/AdminLayout";
import {
  Card,
  ErrorState,
  Field,
  Notice,
  PageHeader,
  Pill,
  TableSkeleton,
  btnPrimary,
  checkCls,
  inputCls,
  textareaCls,
} from "../../components/admin/ui";
import api from "../../lib/api";
import { getApiError } from "../../lib/admin";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

// The four sections of GET / PUT /api/admin/settings. Payment mode, key and
// secrets are read-only (they live on the server), so only the online-payments
// switch is editable there. There is no cash-on-delivery switch: the server
// doesn't support it yet.
const SECTIONS = [
  {
    id: "general",
    label: "General",
    fields: [
      { key: "storeName", label: "Store name", required: true },
      { key: "tagline", label: "Tagline" },
      { key: "storeEmail", label: "Store email", type: "email" },
      {
        key: "phone",
        label: "Phone",
        type: "phone",
        hint: "10-digit number, without +91.",
      },
      { key: "address", label: "Address", type: "textarea", wide: true },
      { key: "logoUrl", label: "Logo", type: "logo", wide: true },
    ],
  },
  { id: "payment", label: "Payment", fields: [] },
  {
    id: "shipping",
    label: "Shipping",
    fields: [
      {
        key: "shippingCharge",
        required: true,
        label: "Delivery charge (₹)",
        type: "money",
        hint: "Charged on every order. Enter 0 for free delivery.",
      },
      {
        key: "freeShippingThreshold",
        required: true,
        label: "Free delivery above (₹)",
        type: "money",
        hint: "Orders at or above this amount ship free. 0 means no free-delivery offer.",
      },
      {
        key: "deliveryEstimate",
        label: "Delivery estimate",
        placeholder: "e.g. 2-5 working days",
      },
      {
        key: "courierName",
        label: "Courier name",
        placeholder: "e.g. India Post",
      },
      {
        key: "trackingUrlTemplate",
        label: "Tracking link",
        type: "template",
        wide: true,
        placeholder: "https://example.com/track?id={trackingNumber}",
        hint: "Must start with http(s) and include {trackingNumber}, which is replaced by each order's tracking number.",
      },
    ],
  },
  {
    id: "email",
    label: "Email",
    fields: [
      {
        key: "senderName",
        label: "Sender name",
        placeholder: "Shown as the sender of emails",
      },
      { key: "replyToEmail", label: "Reply-to email", type: "email" },
      {
        key: "lowStockThreshold",
        required: true,
        label: "Low stock level",
        type: "int",
        hint: "A product at or below this many items is flagged as low stock.",
      },
    ],
  },
];

const toText = (v) => (v === null || v === undefined ? "" : String(v));

// Turn the server's object into editable strings (and the payment switch).
function toValues(data) {
  const out = {};
  for (const sec of SECTIONS) {
    out[sec.id] = {};
    for (const f of sec.fields)
      out[sec.id][f.key] = toText(data?.[sec.id]?.[f.key]);
  }
  out.payment.onlinePaymentsEnabled =
    data?.payment?.onlinePaymentsEnabled !== false;
  return out;
}

function validateField(f, raw) {
  const v = String(raw ?? "").trim();
  if (!v) return f.required ? `Enter ${f.label.toLowerCase()}.` : null;
  switch (f.type) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
        ? null
        : "Enter a valid email address.";
    case "phone":
      return /^\d{10}$/.test(v) ? null : "Enter exactly 10 digits.";
    case "money": {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 && n <= 1000000
        ? null
        : "Enter an amount from 0 to 10,00,000.";
    }
    case "int": {
      const n = Number(v);
      return Number.isInteger(n) && n >= 0
        ? null
        : "Enter a whole number, 0 or more.";
    }
    case "template":
      if (!/^https?:\/\//i.test(v))
        return "The link must start with http:// or https://.";
      if (!v.includes("{trackingNumber}"))
        return "The link must include {trackingNumber}.";
      return null;
    default:
      return null;
  }
}

// Money and whole-number fields go to the API as numbers; empty text clears.
function toPayload(f, raw) {
  const v = String(raw ?? "").trim();
  if (f.type === "money" || f.type === "int")
    return v === "" ? null : Number(v);
  return v;
}

export default function AdminSettings() {
  const { toast } = useAdminUI();
  const [state, setState] = useState({ status: "loading" });
  const [saved, setSaved] = useState(null); // what the server has
  const [values, setValues] = useState(null); // what's in the forms
  const [raw, setRaw] = useState(null); // full server object (read-only parts)
  const [tab, setTab] = useState("general");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await api.get("/admin/settings");
      const data = res.data?.settings || res.data;
      setRaw(data);
      setSaved(toValues(data));
      setValues(toValues(data));
      setState({ status: "ready" });
    } catch (err) {
      setState({
        status: "error",
        error: getApiError(err, "Could not load the settings."),
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const section = SECTIONS.find((s) => s.id === tab);

  function setField(key, value) {
    setValues((v) => ({ ...v, [tab]: { ...v[tab], [key]: value } }));
    setErrors((e) => ({ ...e, [key]: null }));
    setFormError(null);
  }

  // Which fields in the open tab differ from what's saved.
  function changedKeys(sec) {
    if (!values) return [];
    const keys = sec.fields.map((f) => f.key);
    if (sec.id === "payment") keys.push("onlinePaymentsEnabled");
    return keys.filter((k) => values[sec.id][k] !== saved[sec.id][k]);
  }
  const dirty =
    state.status === "ready" ? changedKeys(section).length > 0 : false;

  async function uploadLogo(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((x) => ({ ...x, logoUrl: "Choose an image file." }));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setErrors((x) => ({ ...x, logoUrl: "The image must be under 5 MB." }));
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/admin/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setField("logoUrl", res.data.url);
    } catch (err) {
      setErrors((x) => ({
        ...x,
        logoUrl: getApiError(err, "Could not upload the logo."),
      }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError(null);
    const errs = {};
    for (const f of section.fields) {
      const msg = validateField(f, values[section.id][f.key]);
      if (msg) errs[f.key] = msg;
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    // Send only what changed, inside its section.
    const body = {};
    for (const key of changedKeys(section)) {
      const f = section.fields.find((x) => x.key === key);
      body[key] = f
        ? toPayload(f, values[section.id][key])
        : values[section.id][key];
    }
    setSaving(true);
    try {
      const res = await api.put("/admin/settings", { [section.id]: body });
      const data = res.data?.settings || res.data;
      setRaw(data);
      const fresh = toValues(data);
      setSaved(fresh);
      setValues(fresh);
      toast(`${section.label} settings saved.`);
    } catch (err) {
      setFormError(getApiError(err, "Could not save the settings."));
    } finally {
      setSaving(false);
    }
  }

  function renderField(f) {
    const id = `s-${f.key}`;
    const value = values[section.id][f.key];
    let control;
    if (f.type === "textarea") {
      control = (
        <textarea
          id={id}
          rows={3}
          className={textareaCls}
          value={value}
          onChange={(e) => setField(f.key, e.target.value)}
        />
      );
    } else if (f.type === "logo") {
      control = (
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 flex-shrink-0 place-items-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt="Store logo"
                className="h-full w-full object-contain"
              />
            ) : (
              <ImagePlus size={20} />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-neutral-300 bg-white px-3 text-sm text-ink hover:bg-neutral-50">
              {uploading ? "Uploading…" : value ? "Change logo" : "Upload logo"}
              <input
                id={id}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={uploadLogo}
              />
            </label>
            {value && (
              <button
                type="button"
                onClick={() => setField("logoUrl", "")}
                className="text-sm text-neutral-500 underline hover:text-red-600"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      );
    } else {
      control = (
        <input
          id={id}
          type={
            f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text"
          }
          inputMode={
            f.type === "phone" || f.type === "int"
              ? "numeric"
              : f.type === "money"
                ? "decimal"
                : undefined
          }
          maxLength={f.type === "phone" ? 10 : undefined}
          className={inputCls}
          value={value}
          placeholder={f.placeholder || ""}
          onChange={(e) =>
            setField(
              f.key,
              f.type === "phone"
                ? e.target.value.replace(/\D/g, "")
                : e.target.value,
            )
          }
        />
      );
    }
    return (
      <div key={f.key} className={f.wide ? "md:col-span-2" : undefined}>
        <Field
          label={`${f.label}${f.required ? " *" : ""}`}
          htmlFor={id}
          hint={f.hint}
          error={errors[f.key]}
        >
          {control}
        </Field>
      </div>
    );
  }

  const payment = raw?.payment || {};

  return (
    <AdminLayout title="Settings">
      <PageHeader title="Settings" subtitle="Manage your store settings." />

      <Card>
        {state.status === "loading" && <TableSkeleton rows={5} cols={2} />}
        {state.status === "error" && (
          <ErrorState message={state.error} onRetry={load} />
        )}

        {state.status === "ready" && (
          <>
            <div
              role="tablist"
              aria-label="Settings sections"
              className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-3 pt-3"
            >
              {SECTIONS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`panel-${t.id}`}
                  onClick={() => {
                    setTab(t.id);
                    setErrors({});
                    setFormError(null);
                  }}
                  className={`-mb-px h-10 flex-shrink-0 border-b-2 px-4 text-sm transition ${
                    tab === t.id
                      ? "border-spine font-medium text-spine"
                      : "border-transparent text-neutral-500 hover:text-ink"
                  }`}
                >
                  {t.label}
                  {changedKeys(t).length > 0 && (
                    <span
                      aria-label="unsaved changes"
                      className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle"
                    />
                  )}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSave}
              noValidate
              role="tabpanel"
              id={`panel-${section.id}`}
              aria-labelledby={`tab-${section.id}`}
              className="p-5 sm:p-6"
            >
              {section.id === "payment" ? (
                <div className="space-y-5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      id="s-onlinePaymentsEnabled"
                      className={`${checkCls} mt-0.5`}
                      checked={values.payment.onlinePaymentsEnabled}
                      onChange={(e) => {
                        setValues((v) => ({
                          ...v,
                          payment: {
                            ...v.payment,
                            onlinePaymentsEnabled: e.target.checked,
                          },
                        }));
                        setFormError(null);
                      }}
                    />
                    <span>
                      <span className="block text-sm font-medium text-ink">
                        Accept online payments
                      </span>
                      <span className="block text-sm text-neutral-500">
                        Customers pay by card, UPI, netbanking or wallet through
                        Razorpay.
                      </span>
                    </span>
                  </label>

                  {!values.payment.onlinePaymentsEnabled && (
                    <Notice tone="amber">
                      While this is off, customers can’t check out. Turn it back
                      on to sell again.
                    </Notice>
                  )}

                  <div className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-neutral-500">Mode</p>
                      <div className="mt-1">
                        <Pill
                          tone={
                            String(payment.mode).toLowerCase() === "live"
                              ? "green"
                              : "amber"
                          }
                        >
                          {payment.mode
                            ? String(payment.mode).charAt(0).toUpperCase() +
                              String(payment.mode).slice(1).toLowerCase()
                            : "Unknown"}
                        </Pill>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-500">
                        Razorpay key ID
                      </p>
                      <p className="mt-1 break-all font-mono text-sm text-ink">
                        {payment.razorpayKeyId || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Secret keys</p>
                      <div className="mt-1">
                        <Pill
                          tone={payment.secretsConfigured ? "green" : "red"}
                        >
                          {payment.secretsConfigured
                            ? "Set on server"
                            : "Not set"}
                        </Pill>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500">
                    The mode and keys are set on the server and can’t be changed
                    here. Secret keys are never shown.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {section.fields.map(renderField)}
                </div>
              )}

              {section.id === "email" && (
                <p className="mt-5 text-xs text-neutral-500">
                  Right now the store only emails sign-up and password-reset
                  codes. Order emails and low-stock alerts aren’t built yet.
                </p>
              )}

              {formError && (
                <p
                  role="alert"
                  className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                {dirty && (
                  <span className="text-xs text-amber-700">
                    Unsaved changes
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving || !dirty || uploading}
                  className={btnPrimary}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </>
        )}
      </Card>
    </AdminLayout>
  );
}
