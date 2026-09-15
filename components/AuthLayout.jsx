import Link from "next/link";
import MosqueIcon from "./MosqueIcon";

function HangingLantern({ side = "left" }) {
  const position =
    side === "left" ? "left-6 md:left-16" : "right-6 md:right-16";
  return (
    <div className={`hidden md:block absolute top-0 ${position} z-0`}>
      <svg width="90" height="220" viewBox="0 0 90 220" fill="none">
        <line
          x1="45"
          y1="0"
          x2="45"
          y2="60"
          stroke="#A6791F"
          strokeWidth="1.5"
        />
        <circle cx="45" cy="62" r="4" fill="#A6791F" />
        <path
          d="M45 68 L60 78 L60 130 L45 140 L30 130 L30 78 Z"
          fill="#A6791F"
        />
        <rect
          x="37"
          y="86"
          width="6"
          height="38"
          rx="2"
          fill="#FAF9F6"
          fillOpacity="0.6"
        />
        <rect
          x="47"
          y="86"
          width="6"
          height="38"
          rx="2"
          fill="#FAF9F6"
          fillOpacity="0.6"
        />
        <path d="M33 140 L57 140 L45 155 Z" fill="#A6791F" />
      </svg>
    </div>
  );
}

function MosqueSkyline() {
  const domes = Array.from({ length: 7 });
  return (
    <div className="absolute bottom-0 left-0 w-full h-32 flex items-end justify-around opacity-[0.08] pointer-events-none overflow-hidden">
      {domes.map((_, i) => (
        <svg key={i} width="80" height="128" viewBox="0 0 80 128" fill="none">
          <rect x="30" y="60" width="20" height="68" fill="currentColor" />
          <circle cx="40" cy="55" r="16" fill="currentColor" />
          <rect x="37" y="15" width="6" height="25" fill="currentColor" />
          <circle cx="40" cy="12" r="4" fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}

export default function AuthLayout({ children }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden py-16 px-6 text-ink"
      style={{ backgroundColor: "#F3ECDD" }}
    >
      <HangingLantern side="left" />
      <HangingLantern side="right" />
      <MosqueSkyline />

      <div className="relative max-w-md mx-auto bg-white rounded-2xl shadow-lg p-10 z-10">
        <Link href="/" className="block text-center mb-6">
          <MosqueIcon size={40} className="text-spine mx-auto mb-2" />
          <p className="font-serif text-xl text-spine leading-tight">
            Maktabah Islamiyah
          </p>
          <p className="text-xs text-neutral-400">
            Faith · Knowledge · Lifestyle
          </p>
        </Link>
        {children}
      </div>

      <p className="relative z-10 text-center text-xs text-neutral-400 mt-8">
        © 2026 Maktabah Islamiyah Jammu And Kashmir. All rights reserved.
      </p>
    </div>
  );
}
