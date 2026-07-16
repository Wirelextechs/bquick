"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/formError";

export function ExchangePaymentSettingsForm({
  momoNumber,
  momoName,
}: {
  momoNumber: string;
  momoName: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ momoNumber, momoName });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/exchange-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to update payment settings"));
      return;
    }
    toast.success("Payment collection details updated");
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-3 text-sm font-semibold text-text-primary">MoMo collection details</h2>
      <p className="mb-4 text-xs text-text-muted">
        Shown to clients on the RMB Exchange page as the number/name to send Mobile Money
        payments to.
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="momo-number" className="mb-1.5">
            MoMo number
          </Label>
          <Input
            id="momo-number"
            required
            value={form.momoNumber}
            onChange={(e) => setForm({ ...form, momoNumber: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="momo-name" className="mb-1.5">
            Registered account name
          </Label>
          <Input
            id="momo-name"
            required
            value={form.momoName}
            onChange={(e) => setForm({ ...form, momoName: e.target.value })}
          />
        </div>
        {error && (
          <div className="col-span-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-brand-red">
            {error}
          </div>
        )}
        <div className="col-span-2 flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save details"}
          </Button>
        </div>
      </form>
    </section>
  );
}
