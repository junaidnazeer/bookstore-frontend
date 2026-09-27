import { useRouter } from "next/router";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const SPINE = "#1e3d32";

function LegalHeader({ router, title }) {
  return (
    <header className="flex items-center gap-3 px-4 py-4 max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex-shrink-0"
        style={{ color: SPINE }}
      >
        <ArrowLeft size={22} />
      </button>
      <h1 className="font-serif text-lg font-semibold" style={{ color: SPINE }}>
        {title}
      </h1>
    </header>
  );
}

export default function TermsAndConditions() {
  const router = useRouter();
  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <LegalHeader router={router} title="Terms & Conditions" />
      <main className="max-w-2xl mx-auto px-4 pb-10">
        <div className="border border-neutral-200 rounded-xl bg-white p-5 text-sm text-neutral-600 flex flex-col gap-4">
          <section>
            <h2 className="font-medium text-ink mb-1">1. Using this site</h2>
            <p>
              By placing an order with Maktabah Islamiyah, you agree to provide
              accurate delivery and contact information and to use this store
              only for lawful purchases.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-ink mb-1">2. Orders & pricing</h2>
            <p>
              Prices are shown in Indian Rupees (₹) and may change without
              notice. We reserve the right to cancel an order if a product is
              out of stock or listed at an incorrect price.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-ink mb-1">3. Payments</h2>
            <p>
              Payments are processed through our payment gateway partner. We do
              not store your full card number, CVV, or UPI PIN.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-ink mb-1">
              4. Shipping & delivery
            </h2>
            <p>
              Delivery timelines are estimates and may vary by location. Risk of
              loss passes to you upon delivery to the address provided.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-ink mb-1">5. Contact</h2>
            <p>
              Questions about these terms can be sent to our support team
              through the Help &amp; Support page.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
