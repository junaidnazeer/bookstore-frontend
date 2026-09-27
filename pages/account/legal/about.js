import { useRouter } from "next/router";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import MosqueIcon from "../../../components/MosqueIcon";

const SPINE = "#1e3d32";

export default function About() {
  const router = useRouter();
  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex-shrink-0"
          style={{ color: SPINE }}
        >
          <ArrowLeft size={22} />
        </button>
        <h1
          className="font-serif text-lg font-semibold"
          style={{ color: SPINE }}
        >
          About Maktabah Islamiyah
        </h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-10">
        <div className="flex flex-col items-center text-center border border-neutral-200 rounded-xl bg-white p-6 mb-5">
          <MosqueIcon size={40} style={{ color: SPINE }} className="mb-3" />
          <h2 className="font-serif text-xl text-ink mb-1">
            Maktabah Islamiyah
          </h2>
          <p className="text-xs text-neutral-400">
            Faith · Knowledge · Lifestyle
          </p>
        </div>

        <div className="border border-neutral-200 rounded-xl bg-white p-5 text-sm text-neutral-600 flex flex-col gap-4">
          <p>
            Maktabah Islamiyah is an online store bringing together authentic
            Islamic books, attars, modest clothing, and prayer essentials in one
            place — carefully selected to support your faith and daily life.
          </p>
          <p>
            Our goal is to make it simple to find trustworthy Islamic products,
            from scholarly texts and Tajweed editions of the Quran to everyday
            essentials like prayer caps and abayas.
          </p>
          <p>
            Have a question, suggestion, or feedback? Reach out any time through
            the Help &amp; Support page.
          </p>
        </div>
      </main>
    </div>
  );
}
