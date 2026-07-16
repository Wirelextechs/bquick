"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientCombobox, type ClientOption } from "./ClientCombobox";
import { extractErrorMessage } from "@/lib/formError";

const MAX_PHOTOS = 6;

export function CreateOrderForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: "",
    trackingCode: "",
    originCountry: "",
    description: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);

  function handlePhotosSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotos((prev) => [...prev, ...files].slice(0, MAX_PHOTOS));
    e.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId) {
      setError("Select a client from the search results first.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        trackingCode: form.trackingCode || undefined,
      }),
    });

    if (!res.ok) {
      setLoading(false);
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to create shipment"));
      return;
    }

    const { order } = await res.json();

    if (photos.length > 0) {
      const formData = new FormData();
      photos.forEach((file) => formData.append("files", file));
      const photoRes = await fetch(`/api/orders/${order.id}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!photoRes.ok) {
        // The order was created successfully; only the photo upload failed.
        // Don't block the flow — surface it and let them add photos from the detail page.
        setLoading(false);
        toast.warning("Shipment created, but photo upload failed", {
          description: "You can add photos from the shipment page.",
        });
        setOpen(false);
        router.refresh();
        return;
      }
    }

    setLoading(false);
    toast.success(`Shipment ${order.trackingCode} created`);
    setForm({ clientId: "", trackingCode: "", originCountry: "", description: "" });
    setPhotos([]);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={clients.length === 0}>
        <Plus /> New shipment
      </Button>

      {open && (
        <Modal
          title="Register new shipment"
          description="Enter goods details for a client's incoming shipment"
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="order-client" className="mb-1.5">
                Client
              </Label>
              <ClientCombobox
                id="order-client"
                clients={clients}
                value={form.clientId}
                onChange={(clientId) => setForm({ ...form, clientId })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="order-origin" className="mb-1.5">
                  Origin country
                </Label>
                <Input
                  id="order-origin"
                  required
                  value={form.originCountry}
                  onChange={(e) => setForm({ ...form, originCountry: e.target.value })}
                  placeholder="China"
                />
              </div>
              <div>
                <Label htmlFor="order-tracking" className="mb-1.5">
                  Tracking code
                </Label>
                <Input
                  id="order-tracking"
                  value={form.trackingCode}
                  onChange={(e) => setForm({ ...form, trackingCode: e.target.value })}
                  placeholder="Auto-generated if blank"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="order-description" className="mb-1.5">
                Goods description
              </Label>
              <Input
                id="order-description"
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="2 boxes of electronics"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>Photos (optional)</Label>
                {photos.length < MAX_PHOTOS && (
                  <label className="cursor-pointer text-xs font-medium text-brand-blue hover:underline">
                    + Add photos
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      multiple
                      onChange={handlePhotosSelected}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {photos.map((file, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border-subtle">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        aria-label="Remove photo"
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                      >
                        <X className="size-2.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                {loading ? "Creating..." : "Create shipment"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
