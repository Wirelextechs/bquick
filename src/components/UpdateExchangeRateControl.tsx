"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/formError";

export function UpdateExchangeRateControl({ currentRate }: { currentRate: string }) {
  const router = useRouter();
  const [rate, setRate] = useState(currentRate);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/exchange-rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rate: Number(rate) }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(extractErrorMessage(body.error, "Failed to update rate"));
      return;
    }
    toast.success("Exchange rate updated");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <span className="text-xs text-text-muted whitespace-nowrap">1 GHS =</span>
      <Input
        type="number"
        min="0"
        step="0.0001"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        className="h-8 w-24"
      />
      <span className="text-xs text-text-muted">RMB</span>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Saving..." : "Update"}
      </Button>
    </form>
  );
}
