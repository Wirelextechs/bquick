"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientCombobox, type ClientOption } from "./ClientCombobox";
import { extractErrorMessage } from "@/lib/formError";

export function ReassignClientButton({
  orderId,
  currentClientName,
  clients,
}: {
  orderId: string;
  currentClientName: string;
  clients: ClientOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newClientId, setNewClientId] = useState("");
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newClientId) {
      setError("Search and select the correct client first.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/orders/reassign-client", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, newClientId, note: note || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to reassign order"));
      return;
    }
    toast.success("Order reassigned to a new client");
    setNewClientId("");
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
        Reassign
      </button>

      {open && (
        <Modal
          title="Reassign order to a different client"
          description={`Currently assigned to ${currentClientName}. Use this to correct a mistaken selection at intake.`}
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="reassign-client" className="mb-1.5">
                New client
              </Label>
              <ClientCombobox
                id="reassign-client"
                clients={clients}
                value={newClientId}
                onChange={setNewClientId}
              />
            </div>
            <div>
              <Label htmlFor="reassign-note" className="mb-1.5">
                Reason (optional, logged for audit)
              </Label>
              <Input
                id="reassign-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Picked wrong client with a similar name at intake"
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
                {loading ? "Reassigning..." : "Reassign order"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
