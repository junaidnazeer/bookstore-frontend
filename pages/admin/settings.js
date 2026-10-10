import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ImagePlus, X } from "lucide-react";
import AdminLayout, { useAdminUI } from "../../components/admin/AdminLayout";
import {
  Card,
  ErrorState,
  Field,
  NotSupported,
  PageHeader,
  Pill,
  TableSkeleton,
  btnOutline,
  btnPrimary,
  inputCls,
  textareaCls,
} from "../../components/admin/ui";
import api from "../../lib/api";
import { getApiError, isUnsupported } from "../../lib/admin";

const TABS = [
  { id: "general", label: "General" },
  { id: "payment", label: "Payment" },
  { id: "shipping", label: "Shipping" },
  { id: "email", label: "Email" },
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The editable fields, grouped the way the backend groups them
// (GET / PUT /api/admin/settings). `kind` decides the input and the checks.
// Payment is read-only: its keys live on the server, and the backend's checkout
// doesn't read the on/off switches, so none are offered here.
const FIELDS = {
  general: [
    {
      key: "storeName",
      label: "Store name",
      kind: "text",
      required: true,
      max: 80,
    },
    {
      key: "tagline",
      label: "Tagline",
      kind: "text",
      max: 80,
      placeholder: "Faith • Knowledge • Lifestyle",
    },
    {
      key: "storeEmail",
      label: "Contact email",
      kind: "email",
      hint: "The address customers can write to.",
    },
    {
      key: "phone",
      label: "Phone",
      kind: "phone",
      hint: "10-digit mobile number.",
    },
    { key: "address", label: "Address", kind: "textarea", max: 300 },
  ],
  shipping: [
    {
      key: "shippingCharge",
      label: "Shipping charge (₹)",
      kind: "money",
      required: true,
      hint: "Added to every order below the free-shipping amount. Enter 0 for free delivery.",
    },
    {
      key: "freeShippingThreshold",
      label: "Free shipping from (₹)",
      kind: "money",
      required: true,
      hint: "Orders of this amount or more ship free. Enter 0 for no free shipping.",
    },
    {
      key: "deliveryEstimate",
      label: "Delivery estimate",
      kind: "text",
      max: 60,
      placeholder: "5–8 working days",
    },
    {
      key: "courierName",
      label: "Courier",
      kind: "text",
      max: 40,
      placeholder: "India Post",
    },
    {
      key: "trackingUrlTemplate",
      label: "Tracking link",
      kind: "url",
      max: 300,
      hint: "Put {trackingNumber} where the number goes, for example https://example.com/track?id={trackingNumber}",
    },
  ],
  email: [
    {
      key: "senderName",
      label: "Sender name",
      kind: "text",
      max: 60,
      hint: "The name on the emails the store sends (sign-up and password-reset codes).",
    },
    {
      key: "replyToEmail",
      label: "Reply-to email",
      kind: "email",
      hint: "Where replies to those emails go.",
    },
  ],
};

const SECTIONS = ["general", "shipping", "email"];

const norm = (kind, v) => {
  const t = String(v ?? "").trim();
  return kind === "money" && t !== "" && Number.isFinite(Number(t))
    ? String(Number(t))
    : t;
};

// Server object -> plain strings for the form inputs.
function toDraft(data) {
  const out = {};
  for (const section of SECTIONS) {
    out[section] = {};
    for (const f of FIELDS[section])
      out[section][f.key] = String(data?.[section]?.[f.key] ?? "");
  }
  out.general.logoUrl = String(data?.general?.logoUrl ?? "");
  return out;
}

function validate(draft) {
  const errors = {};
  for (const section of SECTIONS) {
    for (const f of FIELDS[section]) {
      const v = String(draft[section][f.key] ?? "").trim();
      const id = `${section}.${f.key}`;
      if (!v) {
        if (f.required)
          errors[id] =
            f.kind === "money"
              ? "Enter an amount, 0 or more."
              : "This can’t be empty.";
        continue;
      }
      if (f.max && v.length > f.max)
        errors[id] = `Keep this under ${f.max} characters.`;
      else if (f.kind === "email" && !EMAIL_RE.test(v))
        errors[id] = "Enter a valid email address.";
      else if (f.kind === "phone" && !/^\d{10}$/.test(v))
        errors[id] = "Enter a 10-digit phone number.";
      else if (
        f.kind === "money" &&
        !(/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 1000000)
      )
        errors[id] = "Enter an amount like 60 or 59.50.";
      else if (
        f.kind === "url" &&
        !(v.startsWith("https://") && v.includes("{trackingNumber}"))
      )
        errors[id] = "Start with https:// and include {trackingNumber}.";
    }
  }
  return errors;
}

function LogoField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setError(`${file.name} isn’t an image.`);
    if (file.size > MAX_IMAGE_BYTES)
      return setError(`${file.name} is larger than 5 MB.`);
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/admin/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(res.data.url);
    } catch (err) {
      setError(getApiError(err, "Could not upload the logo."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-spine">
        Store logo
      </span>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-400">
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
          {value && (
            <button
              type="button"
              aria-label="Remove logo"
              onClick={() => onChange("")}
              className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <label
          className={`${btnOutline} h-9 cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}
        >
          <ImagePlus size={15} />{" "}
          {busy ? "Uploading…" : value ? "Change logo" : "Upload logo"}
          <input
            type="file"
            accept="image/*"
            onChange={pick}
            className="sr-only"
          />
        </label>
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-neutral-500">PNG or JPG, up to 5 MB.</p>
      )}
    </div>
  );
}

export default function AdminSettings() {
  const { toast } = useAdminUI();
  const [state, setState] = useState({ status: "loading" });
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("general");

  const load = useCallback(() => {
    setState({ status: "loading" });
    api
      .get("/admin/settings")
      .then((res) => {
        setState({ status: "ready", raw: res.data });
        setSaved(toDraft(res.data));
        setDraft(toDraft(res.data));
      })
      .catch((err) => {
        if (isUnsupported(err)) setState({ status: "unsupported" });
        else
          setState({
            status: "error",
            error: getApiError(err, "Could not load settings."),
          });
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Which fields differ from what's saved, per section.
  const changes = useMemo(() => {
    const out = {};
    if (!draft || !saved) return out;
    for (const section of SECTIONS) {
      const keys = FIELDS[section].map((f) => f.key);
      if (section === "general") keys.push("logoUrl");
      for (const key of keys) {
        const kind = FIELDS[section].find((f) => f.key === key)?.kind;
        if (
          norm(kind, draft[section][key]) !== norm(kind, saved[section][key])
        ) {
          (out[section] ||= []).push(key);
        }
      }
    }
    return out;
  }, [draft, saved]);

  const dirty = Object.keys(changes).length > 0;

  // Warn before the page is closed with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function setField(section, key, value) {
    setDraft((d) => ({ ...d, [section]: { ...d[section], [key]: value } }));
    setErrors((e) =>
      e[`${section}.${key}`] ? { ...e, [`${section}.${key}`]: undefined } : e,
    );
    setServerError(null);
  }

  async function handleSave() {
    const found = validate(draft);
    setErrors(found);
    const firstBad = TABS.find((t) =>
      Object.keys(found).some((k) => k.startsWith(`${t.id}.`)),
    );
    if (firstBad) {
      setTab(firstBad.id);
      return;
    }

    // Send only what changed; the backend leaves everything else as it is.
    const body = {};
    for (const [section, keys] of Object.entries(changes)) {
      body[section] = {};
      for (const key of keys) {
        const f = FIELDS[section].find((x) => x.key === key);
        const t = String(draft[section][key] ?? "").trim();
        if (f?.kind === "money") body[section][key] = Number(t);
        else body[section][key] = t === "" && !f?.required ? null : t;
      }
    }

    setSaving(true);
    setServerError(null);
    try {
      const res = await api.put("/admin/settings", body);
      setState({ status: "ready", raw: res.data });
      setSaved(toDraft(res.data));
      setDraft(toDraft(res.data));
      toast("Settings saved.");
    } catch (err) {
      setServerError(getApiError(err, "Could not save the settings."));
    } finally {
      setSaving(false);
    }
  }

  function renderField(section, f) {
    const id = `${section}.${f.key}`;
    const common = {
      id: `s-${section}-${f.key}`,
      value: draft[section][f.key],
      placeholder: f.placeholder,
      onChange: (e) => setField(section, f.key, e.target.value),
    };
    return (
      <Field
        key={id}
        label={f.required ? `${f.label} *` : f.label}
        htmlFor={common.id}
        hint={f.hint}
        error={errors[id]}
      >
        {f.kind === "textarea" ? (
          <textarea rows={3} className={textareaCls} {...common} />
        ) : f.kind === "money" ? (
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className={inputCls}
            {...common}
          />
        ) : f.kind === "email" ? (
          <input type="email" className={inputCls} {...common} />
        ) : f.kind === "phone" ? (
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            className={inputCls}
            {...common}
            onChange={(e) =>
              setField(section, f.key, e.target.value.replace(/\D/g, ""))
            }
          />
        ) : (
          <input type="text" className={inputCls} {...common} />
        )}
      </Field>
    );
  }

  const payment = state.status === "ready" ? state.raw?.payment || {} : {};
  const hasProblem = (id) =>
    Object.keys(errors).some((k) => errors[k] && k.startsWith(`${id}.`));

  return (
    <AdminLayout title="Settings">
      <PageHeader title="Settings" subtitle="Manage your store settings." />

      {state.status === "loading" && (
        <Card>
          <TableSkeleton rows={6} cols={2} />
        </Card>
      )}
      {state.status === "error" && (
        <Card>
          <ErrorState message={state.error} onRetry={load} />
        </Card>
      )}
      {state.status === "unsupported" && (
        <Card>
          <NotSupported
            what="Settings"
            endpoint="GET / PUT /api/admin/settings"
          />
        </Card>
      )}

      {state.status === "ready" && draft && (
        <Card>
          <div
            role="tablist"
            aria-label="Settings sections"
            className="flex flex-wrap gap-1 border-b border-neutral-100 px-3 pt-3"
          >
            {TABS.map((t) => {
              const marked = !!changes[t.id] || hasProblem(t.id);
              return (
                <button
                  key={t.id}
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`panel-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className={`-mb-px flex h-10 items-center gap-1.5 border-b-2 px-4 text-sm transition ${
                    tab === t.id
                      ? "border-spine font-medium text-spine"
                      : "border-transparent text-neutral-500 hover:text-ink"
                  }`}
                >
                  {t.label}
                  {marked && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${hasProblem(t.id) ? "bg-red-500" : "bg-amber-500"}`}
                      title={
                        hasProblem(t.id) ? "Needs attention" : "Unsaved changes"
                      }
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            className="max-w-3xl p-5 sm:p-6"
          >
            {tab === "general" && (
              <div className="flex flex-col gap-5">
                <LogoField
                  value={draft.general.logoUrl}
                  onChange={(url) => setField("general", "logoUrl", url)}
                />
                {FIELDS.general.map((f) => renderField("general", f))}
              </div>
            )}

            {tab === "shipping" && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {FIELDS.shipping.map((f) => (
                  <div
                    key={f.key}
                    className={f.kind === "url" ? "md:col-span-2" : ""}
                  >
                    {renderField("shipping", f)}
                  </div>
                ))}
              </div>
            )}

            {tab === "email" && (
              <div className="flex flex-col gap-5">
                {FIELDS.email.map((f) => renderField("email", f))}
              </div>
            )}

            {tab === "payment" && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-neutral-600">
                  Customers pay online through Razorpay. These details are set
                  on the server, so they can be checked here but not changed.
                </p>
                <dl className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <dt className="text-neutral-500">Mode</dt>
                    <dd>
                      <Pill tone={payment.mode === "live" ? "green" : "amber"}>
                        {payment.mode === "live" ? "Live" : "Test"}
                      </Pill>
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <dt className="text-neutral-500">Razorpay key ID</dt>
                    <dd className="break-all font-mono text-xs text-ink">
                      {payment.razorpayKeyId || "—"}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <dt className="text-neutral-500">Secret key</dt>
                    <dd
                      className={`flex items-center gap-1.5 font-medium ${
                        payment.secretsConfigured
                          ? "text-emerald-700"
                          : "text-red-600"
                      }`}
                    >
                      {payment.secretsConfigured ? (
                        <>
                          <CheckCircle2 size={15} /> Configured
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={15} /> Not configured
                        </>
                      )}
                    </dd>
                  </div>
                </dl>
                {payment.mode !== "live" && (
                  <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    The store is in test mode, so no real money is taken. Switch
                    the Razorpay keys on the server to go live.
                  </p>
                )}
                <p className="text-xs text-neutral-500">
                  Cash on delivery isn’t available yet, so there is no payment
                  switch to change here.
                </p>
              </div>
            )}

            {serverError && (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {serverError}
              </p>
            )}
          </div>

          {(dirty || Object.keys(errors).some((k) => errors[k])) && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50/60 px-5 py-3 sm:px-6">
              <p className="text-sm text-neutral-600">
                {Object.keys(errors).some((k) => errors[k])
                  ? "Fix the highlighted fields to save."
                  : "You have unsaved changes."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDraft(saved);
                    setErrors({});
                    setServerError(null);
                  }}
                  disabled={saving || !dirty}
                  className={btnOutline}
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  className={btnPrimary}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </AdminLayout>
  );
}
