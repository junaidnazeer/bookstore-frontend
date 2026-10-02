import { Menu } from "lucide-react";
import { useSidebar } from "../lib/sidebar-context";

const SPINE = "#1e3d32";

// Floating fallback hamburger — only for pages that DON'T use Navbar (e.g.
// the compact Account sub-pages with their own back-arrow header). Pages
// that do use Navbar render their own in-header hamburger and set
// hasInlineTrigger, so this never duplicates it.
export default function SidebarToggleButton() {
  const { open, toggle, hasInlineTrigger } = useSidebar();

  if (open || hasInlineTrigger) return null;

  return (
    <button
      onClick={toggle}
      aria-label="Open menu"
      className="hidden md:flex fixed top-4 left-4 z-50 items-center justify-center w-10 h-10 rounded-lg bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50 transition-colors"
      style={{ color: SPINE }}
    >
      <Menu size={20} />
    </button>
  );
}
