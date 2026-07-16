"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SuspendAgentButton({
  agentId,
  isActive,
}: {
  agentId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/admin/agents/${agentId}/suspend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success(isActive ? "Agent suspended" : "Agent reactivated");
    }
    router.refresh();
  }

  return (
    <Button
      onClick={toggle}
      disabled={loading}
      variant="outline"
      size="sm"
      className={
        isActive
          ? "border-red-200 text-brand-red hover:bg-red-50"
          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
      }
    >
      {loading ? "..." : isActive ? "Suspend" : "Reactivate"}
    </Button>
  );
}
