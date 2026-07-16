"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { nextStatus } from "@/lib/statusFlow";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/formError";

export function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const target = nextStatus(currentStatus);

  if (!target) {
    return <span className="text-xs font-medium text-emerald-600">Completed</span>;
  }

  const requiresEta = target === "IN_TRANSIT";

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (requiresEta && !estimatedArrival) {
      setError("Estimated arrival is required when marking a shipment as shipped.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/orders/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        newStatus: target,
        note: note || undefined,
        estimatedArrival: estimatedArrival ? new Date(estimatedArrival).toISOString() : undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to update status"));
      return;
    }
    toast.success(`Order marked as ${target!.replace("_", " ").toLowerCase()}`);
    setNote("");
    setEstimatedArrival("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
      >
        Advance to {target.replace("_", " ")}
      </Button>

      {open && (
        <Modal
          title={`Mark as ${target.replace("_", " ").toLowerCase()}`}
          description={`This will move the order from ${currentStatus.replace("_", " ").toLowerCase()} to ${target.replace("_", " ").toLowerCase()}.`}
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleConfirm} className="space-y-4">
            {requiresEta && (
              <div>
                <Label htmlFor="status-eta" className="mb-1.5">
                  Estimated arrival in Ghana
                </Label>
                <Input
                  id="status-eta"
                  type="date"
                  required
                  value={estimatedArrival}
                  onChange={(e) => setEstimatedArrival(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor="status-note" className="mb-1.5">
                Note (optional)
              </Label>
              <Input
                id="status-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any detail worth recording for this change"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-brand-red">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Confirm"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
