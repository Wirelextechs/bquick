"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, TriangleAlert } from "lucide-react";
import { nextStatus } from "@/lib/statusFlow";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="size-3" /> Completed
      </Badge>
    );
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
    toast.success(`Shipment marked as ${target!.replace("_", " ").toLowerCase()}`);
    setNote("");
    setEstimatedArrival("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Advance to {target.replace("_", " ")}
        <ArrowRight className="size-3.5" />
      </Button>

      {open && (
        <Modal
          title={`Mark as ${target.replace("_", " ").toLowerCase()}?`}
          description={`Are you sure? This moves the shipment from ${currentStatus.replace("_", " ").toLowerCase()} to ${target.replace("_", " ").toLowerCase()} and can't be undone from here.`}
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <p>
                Confirm you want to advance this shipment to{" "}
                <span className="font-semibold">{target.replace("_", " ").toLowerCase()}</span>.
                This is logged in the audit trail.
              </p>
            </div>
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
                {loading ? "Updating..." : `Yes, mark as ${target.replace("_", " ").toLowerCase()}`}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
