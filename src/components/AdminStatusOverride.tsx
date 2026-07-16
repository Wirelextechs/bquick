"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractErrorMessage } from "@/lib/formError";
import { STATUS_ORDER } from "@/lib/statusFlow";

export function AdminStatusOverride({
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
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/orders/override-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, newStatus, note }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to override status"));
      return;
    }
    toast.success("Status manually corrected");
    setNote("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-text-secondary underline decoration-dotted underline-offset-2 hover:text-brand-blue"
      >
        Correct status
      </button>

      {open && (
        <Modal
          title="Manually correct status"
          description="Use this only to fix a mistaken update — it bypasses the normal forward-only flow and is logged as a manual override."
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="override-status" className="mb-1.5">
                Correct status
              </Label>
              <Select value={newStatus} onValueChange={(value) => value && setNewStatus(value)}>
                <SelectTrigger id="override-status" className="w-full">
                  <SelectValue>{(value: string) => value.replace("_", " ")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="override-note" className="mb-1.5">
                Reason (required)
              </Label>
              <Input
                id="override-note"
                required
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Agent tapped the wrong status by mistake"
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
              <Button
                type="submit"
                disabled={loading}
                className="bg-brand-red text-white hover:opacity-90"
              >
                {loading ? "Saving..." : "Apply correction"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
