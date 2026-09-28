import { Menu } from "lucide-react";
import { useSidebar } from "../lib/sidebar-context";

const SPINE = "#1e3d32";

// Floating open-button, shown only while the sidebar is collapsed. Lives
// outside SideNav itself so it's reachable even when the sidebar is
// off-screen, and works from every page regardless of which header
// (Navbar vs. a page's own compact header) that page uses.
export default function SidebarToggleButton() {
  const { open, toggle } = useSidebar();

  if (open) return null;

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
