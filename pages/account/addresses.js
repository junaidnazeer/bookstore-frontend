import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import api from "../../lib/api";
import {
  ArrowLeft,
  MapPin,
  Home,
  Briefcase,
  Building,
  Pencil,
  Trash2,
  User,
  Plus,
} from "lucide-react";

const SPINE = "#1e3d32";
const LABEL_ICONS = { Home, Work: Briefcase, Other: Building };

const EMPTY_FORM = {
  label: "Home",
  fullName: "",
  phone: "",
  street: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
};

function extractErrorMessage(err, fallback) {
  if (err.response) return err.response.data?.error || fallback;
  if (err.request) return "Could not reach the server. Please try again.";
  return fallback;
}

function AddressesHeader({ router }) {
  return (
    <header className="flex items-center gap-3 px-4 py-4 max-w-xl mx-auto">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex-shrink-0"
        style={{ color: SPINE }}
      >
        <ArrowLeft size={22} />
      </button>
      <h1 className="font-serif text-lg font-semibold" style={{ color: SPINE }}>
        Saved Addresses
      </h1>
    </header>
  );
}

export default function SavedAddresses() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function loadAddresses() {
    api
      .get("/addresses")
      .then((res) => setAddresses(Array.isArray(res.data) ? res.data : []))
      .catch((err) =>
        setLoadError(
          extractErrorMessage(err, "Could not load your addresses."),
        ),
      );
  }

  useEffect(() => {
    const token = window.localStorage.getItem("token");
    setIsLoggedIn(!!token);
    if (token) loadAddresses();
    setChecked(true);
  }, []);

  function openAddForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
    setShowForm(true);
  }

  function openEditForm(addr) {
    setForm({ ...addr });
    setEditingId(addr.id);
    setError(null);
    setShowForm(true);
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/addresses/${id}`);
      loadAddresses();
    } catch (err) {
      setLoadError(extractErrorMessage(err, "Could not delete this address."));
    }
  }

  async function handleSetDefault(id) {
    try {
      await api.put(`/addresses/${id}/default`);
      loadAddresses();
    } catch (err) {
      setLoadError(extractErrorMessage(err, "Could not set this as default."));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.street.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError("Enter a valid 6-digit PIN code.");
      return;
    }

    const body = {
      label: form.label,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      street: form.street.trim(),
      area: form.area.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, body);
      } else {
        await api.post("/addresses", body);
      }
      loadAddresses();
      setShowForm(false);
    } catch (err) {
      setError(extractErrorMessage(err, "Could not save this address."));
    } finally {
      setSaving(false);
    }
  }

  if (!checked) return null;

  if (!isLoggedIn) {
    return (
      <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
        <AddressesHeader router={router} />
        <main className="max-w-md mx-auto px-6 py-16 text-center">
          <MapPin size={40} className="text-neutral-300 mx-auto mb-3" />
          <h1 className="font-serif text-2xl text-ink mb-2">
            Sign in to manage addresses
          </h1>
          <Link
            href="/login"
            className="inline-block px-5 py-2 rounded text-white text-sm"
            style={{ backgroundColor: SPINE }}
          >
            Login
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <AddressesHeader router={router} />
      <main className="max-w-xl mx-auto px-4 pb-10">
        {loadError && <p className="text-red-600 text-sm mb-4">{loadError}</p>}

        <button
          onClick={openAddForm}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white text-sm font-medium mb-5 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: SPINE }}
        >
          <Plus size={16} /> Add New Address
        </button>

        {addresses.length === 0 && !showForm && (
          <div className="text-center py-16 border border-dashed border-neutral-300 rounded-lg bg-white">
            <MapPin size={32} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">No saved addresses yet.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {addresses.map((addr) => {
            const Icon = LABEL_ICONS[addr.label] || MapPin;
            return (
              <div
                key={addr.id}
                className="border border-neutral-200 rounded-xl bg-white p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  {addr.isDefault && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: SPINE }}
                    >
                      Default
                    </span>
                  )}
                  <Icon
                    size={16}
                    style={{ color: SPINE }}
                    className="flex-shrink-0"
                  />
                  <span className="font-medium text-ink">{addr.label}</span>
                </div>
                <p className="text-sm text-ink">{addr.fullName}</p>
                <p className="text-sm text-neutral-500">
                  {addr.street}, {addr.area ? `${addr.area}, ` : ""}
                  {addr.city}, {addr.state} – {addr.pincode}
                </p>
                <p className="text-sm text-neutral-500">+91 {addr.phone}</p>

                <div className="flex items-center gap-4 mt-3 text-sm">
                  <button
                    onClick={() => openEditForm(addr)}
                    className="flex items-center gap-1"
                    style={{ color: SPINE }}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="flex items-center gap-1 text-red-500"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-neutral-500 underline ml-auto"
                    >
                      Set default
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-6 w-full max-w-md flex flex-col gap-3"
          >
            <h2 className="font-medium text-ink mb-1">
              {editingId ? "Edit Address" : "Add New Address"}
            </h2>

            <div className="flex gap-2">
              {["Home", "Work", "Other"].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, label }))}
                  className="flex-1 py-2 rounded-lg text-sm border"
                  style={
                    form.label === label
                      ? {
                          backgroundColor: SPINE,
                          borderColor: SPINE,
                          color: "#fff",
                        }
                      : { borderColor: "#d4d4d4", color: "#1a1a1a" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center border border-neutral-300 rounded-lg px-3 py-0.5">
              <User size={16} className="text-neutral-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Full Name"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                className="flex-1 px-2 py-2 outline-none text-sm"
              />
            </div>

            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  phone: e.target.value.replace(/\D/g, ""),
                }))
              }
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none"
            />

            <input
              type="text"
              placeholder="House / Building / Street"
              value={form.street}
              onChange={(e) =>
                setForm((f) => ({ ...f, street: e.target.value }))
              }
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none"
            />

            <input
              type="text"
              placeholder="Area / Locality"
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none"
            />

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="City"
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <input
                type="text"
                placeholder="State"
                value={form.state}
                onChange={(e) =>
                  setForm((f) => ({ ...f, state: e.target.value }))
                }
                className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="PIN Code"
              value={form.pincode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  pincode: e.target.value.replace(/\D/g, ""),
                }))
              }
              className="border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none"
            />

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-2 justify-end mt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: SPINE }}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Address"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
