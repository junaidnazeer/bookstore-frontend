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

export default function PrivacyPolicy() {
  const router = useRouter();
  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <LegalHeader router={router} title="Privacy Policy" />
      <main className="max-w-2xl mx-auto px-4 pb-10">
        <div className="border border-neutral-200 rounded-xl bg-white p-5 text-sm text-neutral-600 flex flex-col gap-4">
          <section>
            <h2 className="font-medium text-ink mb-1">
              1. Information we collect
            </h2>
            <p>
              We collect your name, email, phone number, and delivery address to
              process orders, along with account information you provide when
              signing up.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-ink mb-1">
              2. Payment information
            </h2>
            <p>
              We never store your full card number, CVV, UPI PIN, or bank login
              details. Payments are handled securely by our payment gateway
              partner.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-ink mb-1">3. How we use data</h2>
            <p>
              Your information is used to fulfil orders, provide customer
              support, and communicate updates about your account or purchases.
              We do not sell your personal data.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-ink mb-1">4. Your choices</h2>
            <p>
              You can update your profile details or delete your account at any
              time from Account Settings. Deleting your account anonymizes your
              personal information; past order records are retained for
              accounting purposes.
            </p>
          </section>
          <section>
            <h2 className="font-medium text-ink mb-1">5. Contact</h2>
            <p>
              Questions about this policy can be sent to our support team
              through the Help &amp; Support page.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
