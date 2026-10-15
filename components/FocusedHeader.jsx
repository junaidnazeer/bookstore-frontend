import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";

export default function FocusedHeader({
  title,
  href,
  fallbackHref = "/orders",
}) {
  const router = useRouter();

  function handleBack() {
    if (href) {
      router.replace(href);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  }

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-paper border-b border-neutral-200"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
    >
      <button
        type="button"
        onClick={handleBack}
        aria-label="Back"
        className="flex items-center justify-center w-9 h-9 -ml-1 rounded-full text-spine hover:bg-neutral-100 transition-colors"
      >
        <ArrowLeft size={22} />
      </button>
      <h1 className="font-medium text-ink text-base truncate">{title}</h1>
    </header>
  );
}
