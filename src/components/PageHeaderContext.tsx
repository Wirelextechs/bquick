"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type HeaderContent = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

type PageHeaderContextValue = {
  header: HeaderContent | null;
  setHeader: (header: HeaderContent) => void;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

// Wraps a role section's persistent AppShell so individual pages (which no
// longer wrap AppShell themselves, and can suspend/re-render independently)
// can still control the sticky header's title/description/actions.
export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<HeaderContent | null>(null);
  return (
    <PageHeaderContext.Provider value={{ header, setHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeaderContext() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error("usePageHeaderContext must be used within a PageHeaderProvider");
  return ctx;
}
