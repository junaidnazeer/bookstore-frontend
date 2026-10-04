import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Card, NotSupported, PageHeader } from "../../components/admin/ui";

// There is no settings API in the backend (API_REFERENCE.md has no /settings
// route), so none of these tabs can load or save anything real. Rather than a
// form whose Save button does nothing, each tab says what it needs.
const TABS = [
  {
    id: "general",
    label: "General",
    what: "General settings",
    body: "Store name, contact email, phone, address and logo.",
  },
  {
    id: "payment",
    label: "Payment",
    what: "Payment settings",
    body: "Which payment methods are on. Payment secret keys stay on the server and are never shown here.",
  },
  {
    id: "shipping",
    label: "Shipping",
    what: "Shipping settings",
    body: "Shipping charges and the free-shipping threshold.",
  },
  {
    id: "email",
    label: "Email",
    what: "Email settings",
    body: "Which notifications are sent. Email credentials stay on the server and are never shown here.",
  },
];

export default function AdminSettings() {
  const [tab, setTab] = useState("general");
  const current = TABS.find((t) => t.id === tab);

  return (
    <AdminLayout title="Settings">
      <PageHeader title="Settings" subtitle="Manage your store settings." />

      <Card>
        <div
          role="tablist"
          aria-label="Settings sections"
          className="flex gap-1 overflow-x-auto border-b border-neutral-100 px-3 pt-3"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-px h-10 flex-shrink-0 border-b-2 px-4 text-sm transition ${
                tab === t.id
                  ? "border-spine font-medium text-spine"
                  : "border-transparent text-neutral-500 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`panel-${current.id}`}
          aria-labelledby={`tab-${current.id}`}
        >
          <NotSupported
            what={current.what}
            endpoint="GET / PUT /api/admin/settings"
          >
            <p className="mt-3 max-w-md text-sm text-neutral-500">
              This tab will hold: {current.body}
            </p>
          </NotSupported>
        </div>
      </Card>
    </AdminLayout>
  );
}
