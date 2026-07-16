"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extractErrorMessage } from "@/lib/formError";

export function ExchangeProofUpload({
  exchangeId,
  endpoint,
  label,
}: {
  exchangeId: string;
  endpoint: "proof" | "recipient-qr";
  label: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/client/exchanges/${exchangeId}/${endpoint}`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to upload image"));
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <label className="inline-flex cursor-pointer items-center rounded-lg border border-border-subtle bg-surface-sunken px-3.5 py-2 text-sm font-medium text-brand-blue hover:bg-surface-muted">
        {uploading ? "Uploading..." : label}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          disabled={uploading}
          onChange={handleFileSelected}
          className="hidden"
        />
      </label>
      {error && <p className="mt-2 text-xs text-brand-red">{error}</p>}
    </div>
  );
}
