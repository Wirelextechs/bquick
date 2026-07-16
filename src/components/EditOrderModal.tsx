"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/formError";

type ItemRow = {
  id?: string;
  description: string;
  quantity: number;
  weightKg: string;
  value: string;
};

export function EditOrderModal({
  orderId,
  initial,
}: {
  orderId: string;
  initial: {
    trackingCode: string;
    originCountry: string;
    description: string;
    weightKg: string;
    declaredValue: string;
    items: { id: string; description: string; quantity: number; weightKg: string; value: string }[];
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    trackingCode: initial.trackingCode,
    originCountry: initial.originCountry,
    description: initial.description,
    weightKg: initial.weightKg,
    declaredValue: initial.declaredValue,
    note: "",
  });
  const [items, setItems] = useState<ItemRow[]>(initial.items);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, weightKg: "", value: "" }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingCode: form.trackingCode,
        originCountry: form.originCountry,
        description: form.description,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        declaredValue: form.declaredValue ? Number(form.declaredValue) : null,
        note: form.note || undefined,
        items: items
          .filter((item) => item.description.trim())
          .map((item) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            weightKg: item.weightKg ? Number(item.weightKg) : null,
            value: item.value ? Number(item.value) : null,
          })),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to save changes"));
      return;
    }
    toast.success("Shipment details updated");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit shipment
      </Button>

      {open && (
        <Modal
          title="Edit shipment details"
          description="Changes are recorded in the shipment's audit trail."
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-order-tracking" className="mb-1.5">
                  Tracking code
                </Label>
                <Input
                  id="edit-order-tracking"
                  required
                  value={form.trackingCode}
                  onChange={(e) => setForm({ ...form, trackingCode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-order-origin" className="mb-1.5">
                  Origin country
                </Label>
                <Input
                  id="edit-order-origin"
                  required
                  value={form.originCountry}
                  onChange={(e) => setForm({ ...form, originCountry: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-order-description" className="mb-1.5">
                Description
              </Label>
              <Input
                id="edit-order-description"
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-order-weight" className="mb-1.5">
                  Weight (kg)
                </Label>
                <Input
                  id="edit-order-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-order-value" className="mb-1.5">
                  Declared value
                </Label>
                <Input
                  id="edit-order-value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.declaredValue}
                  onChange={(e) => setForm({ ...form, declaredValue: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>Itemized goods (optional)</Label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs font-medium text-brand-blue hover:underline"
                >
                  + Add item
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div
                    key={item.id ?? `new-${i}`}
                    className="space-y-2 rounded-lg border border-border-subtle p-2.5 sm:grid sm:grid-cols-12 sm:gap-2 sm:space-y-0 sm:border-0 sm:p-0"
                  >
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(i, { description: e.target.value })}
                      className="sm:col-span-6"
                    />
                    <div className="grid grid-cols-3 gap-2 sm:contents">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })}
                        className="sm:col-span-2"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="kg"
                        value={item.weightKg}
                        onChange={(e) => updateItem(i, { weightKg: e.target.value })}
                        className="sm:col-span-2"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeItem(i)}
                        className="text-brand-red hover:bg-red-50 sm:col-span-2"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-text-muted">No itemized goods. Using description only.</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-order-note" className="mb-1.5">
                Reason for edit (optional)
              </Label>
              <Input
                id="edit-order-note"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="e.g. Client corrected the declared value"
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
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
