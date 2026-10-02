import { createContext, useContext, useState } from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(false);
  // True while some page's own header (e.g. Navbar) is already rendering
  // an in-header hamburger — tells SidebarToggleButton not to also render
  // its floating fallback, so there's never a duplicate.
  const [hasInlineTrigger, setHasInlineTrigger] = useState(false);

  function toggle() {
    setOpen((v) => !v);
  }

  return (
    <SidebarContext.Provider
      value={{ open, setOpen, toggle, hasInlineTrigger, setHasInlineTrigger }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
