import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import {
  Headphones,
  Phone,
  Mail,
  HelpCircle,
  MessageCircle,
  ChevronDown,
} from "lucide-react";

// Real, existing contact details (previously used on /account) — not
// invented for this page.
const SUPPORT_PHONES = ["7006218923", "7006886439"];
const SUPPORT_EMAIL = "Maktabahislamiyahjk@gmail.com";

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Most orders across India are delivered within 5–8 business days, depending on your location.",
  },
  {
    q: "How do I track my order?",
    a: "Go to My Orders in your account, open the order, and once it's shipped you'll see a Track Package button with your tracking number.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept UPI, credit/debit cards, net banking, and Cash on Delivery.",
  },
  {
    q: "Can I return or exchange a product?",
    a: "Yes — reach out to our support team within 7 days of delivery and we'll help sort out a return or exchange.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-neutral-200 rounded-lg bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <span className="text-sm font-medium text-ink">{q}</span>
        <ChevronDown
          size={16}
          className={`text-neutral-400 flex-shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && <p className="px-4 pb-4 text-sm text-neutral-500">{a}</p>}
    </div>
  );
}

export default function Help() {
  function callSupport(phone) {
    window.location.href = "tel:+91" + phone;
  }

  function emailSupport() {
    window.location.href = "mailto:" + SUPPORT_EMAIL;
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="font-serif text-2xl text-ink mb-6">
          Help &amp; Support
        </h1>

        <div className="flex items-center gap-3 border border-neutral-200 rounded-lg bg-white p-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-spine/10 text-spine flex items-center justify-center flex-shrink-0">
            <Headphones size={20} />
          </div>
          <div>
            <p className="font-medium text-ink">Need Help?</p>
            <p className="text-xs text-neutral-400">
              We're here to assist you.
            </p>
          </div>
        </div>

        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
          Contact Us
        </p>
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-3 border border-neutral-200 rounded-lg bg-white p-3.5">
            <Phone size={18} className="text-spine flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">Call Us</p>
              <div className="flex flex-col">
                {SUPPORT_PHONES.map((phone) => (
                  <button
                    key={phone}
                    onClick={() => callSupport(phone)}
                    className="text-xs text-spine underline text-left"
                  >
                    +91 {phone}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={emailSupport}
            className="flex items-center gap-3 border border-neutral-200 rounded-lg bg-white p-3.5 text-left"
          >
            <Mail size={18} className="text-spine flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-ink">Email Us</p>
              <p className="text-xs text-spine underline">{SUPPORT_EMAIL}</p>
            </div>
          </button>
        </div>

        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
          FAQs
        </p>
        <div className="flex flex-col gap-2 mb-6">
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>

        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
          Quick Links
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 border border-neutral-200 rounded-lg bg-white p-3.5">
            <HelpCircle size={18} className="text-spine flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-ink">FAQs</p>
              <p className="text-xs text-neutral-400">
                Frequently asked questions
              </p>
            </div>
          </div>
          <button
            onClick={emailSupport}
            className="flex items-center gap-3 border border-neutral-200 rounded-lg bg-white p-3.5 text-left"
          >
            <MessageCircle size={18} className="text-spine flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-ink">Contact Support</p>
              <p className="text-xs text-neutral-400">
                Get in touch with our team
              </p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
