"use client";

import { useRouter, usePathname } from "next/navigation";

// Drop-in replacement for a native `<form method="get">` filter bar: submits
// via the client-side router instead of a full browser navigation, so the
// sidebar/shell don't get torn down and rebuilt on every filter change.
export function FilterForm({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        for (const [key, value] of formData.entries()) {
          if (typeof value === "string" && value) params.set(key, value);
        }
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
    >
      {children}
    </form>
  );
}
