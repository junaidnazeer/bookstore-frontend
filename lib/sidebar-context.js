import { createContext, useContext, useState } from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  // Collapsed by default, per the "menu bar should be hidden" requirement —
  // the hamburger button reveals it on click.
  const [open, setOpen] = useState(false);

  function toggle() {
    setOpen((v) => !v);
  }

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
