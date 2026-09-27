import { useRouter } from "next/router";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  ChevronRight,
  ShieldCheck,
  Eye,
  Database,
} from "lucide-react";

const SPINE = "#1e3d32";

function PrivacyHeader({ router }) {
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
        Privacy & Security
      </h1>
    </header>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="border border-neutral-200 rounded-xl bg-white p-4 mb-3">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(30,61,50,0.08)" }}
        >
          <Icon size={16} style={{ color: SPINE }} />
        </div>
        <div>
          <p className="text-sm font-medium text-ink mb-1">{title}</p>
          <p className="text-xs text-neutral-500 leading-relaxed">{children}</p>
        </div>
      </div>
    </div>
  );
}

export default function PrivacySecurity() {
  const router = useRouter();

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <PrivacyHeader router={router} />
      <main className="max-w-xl mx-auto px-4 pb-10">
        {/* Change Password — the one real security action available today */}
        <Link
          href="/account/change-password"
          className="flex items-center gap-3 border border-neutral-200 rounded-xl bg-white p-3.5 mb-6 hover:shadow-sm transition-shadow"
        >
          <Lock size={18} style={{ color: SPINE }} className="flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">Change Password</p>
            <p className="text-xs text-neutral-400">
              Update your password regularly to keep your account secure
            </p>
          </div>
          <ChevronRight size={16} className="text-neutral-300" />
        </Link>

        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
          How we protect you
        </p>

        <InfoCard icon={ShieldCheck} title="Payment security">
          We never store your full card number, CVV, or UPI PIN. Payments are
          processed securely through Razorpay, and only a masked reference (like
          the last 4 digits of a card) is kept for your convenience.
        </InfoCard>

        <InfoCard icon={Eye} title="Account visibility">
          Your name, email, and order history are only visible to you and to our
          team when handling your orders or support requests. They are never
          shown to other customers.
        </InfoCard>

        <InfoCard icon={Database} title="Your data">
          Your information is used only to process orders, provide support, and
          improve your experience with Maktabah Islamiyah. You can update your
          details anytime from Account Details, or request account deletion from
          Settings.
        </InfoCard>
      </main>
    </div>
  );
}
