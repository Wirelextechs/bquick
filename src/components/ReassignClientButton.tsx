"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserCog } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientCombobox, type ClientOption } from "./ClientCombobox";
import { extractErrorMessage } from "@/lib/formError";

export function ReassignClientButton({
  orderId,
  currentClientName,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  orderId: string;
  currentClientName: string;
  /** Custom trigger element; pass `null` to render no trigger (fully externally controlled via `open`/`onOpenChange`). */
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newClientId, setNewClientId] = useState("");
  const [note, setNote] = useState("");
  const [clients, setClients] = useState<ClientOption[] | null>(null);

  // Client list is only needed once this modal is actually opened, so fetch
  // it on demand instead of loading it on every page render.
  useEffect(() => {
    if (!open || clients !== null) return;
    let cancelled = false;
    fetch("/api/admin/clients")
      .then((res) => res.json().catch(() => ({ clients: [] })))
      .then((body) => {
        if (!cancelled) setClients(body.clients ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [open, clients]);

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
      setError(extractErrorMessage(body.error, "Failed to reassign shipment"));
      return;
    }
    toast.success("Shipment reassigned to a new client");
    setNewClientId("");
    setNote("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {trigger !== undefined ? (
        trigger
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <UserCog className="size-3.5" /> Reassign
        </Button>
      )}

      {open && (
        <Modal
          title="Reassign shipment to a different client"
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
                clients={clients ?? []}
                value={newClientId}
                onChange={setNewClientId}
              />
              {clients === null && (
                <p className="mt-1 text-xs text-text-muted">Loading clients…</p>
              )}
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
                {loading ? "Reassigning..." : "Reassign shipment"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
