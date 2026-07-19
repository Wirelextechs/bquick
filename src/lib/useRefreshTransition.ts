"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

// router.refresh() alone gives no visual feedback while the server
// re-fetches page data, so a click can look like it did nothing for a beat.
// Wrapping it in a transition exposes `isPending` so callers can keep a
// button/modal in its busy state until the refreshed data actually lands.
export function useRefreshTransition() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return { isPending, refresh };
}
