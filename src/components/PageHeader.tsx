"use client";

import { useEffect, type ReactNode } from "react";
import { usePageHeaderContext } from "./PageHeaderContext";

// Registers this page's title/description/actions into the persistent
// AppShell's sticky header. Renders nothing itself. No cleanup-on-unmount:
// leaving the previous title visible until the next page's PageHeader
// overwrites it is far less jarring than blanking it during navigation.
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const { setHeader } = usePageHeaderContext();

  useEffect(() => {
    setHeader({ title, description, actions });
  }, [title, description, actions, setHeader]);

  return null;
}
