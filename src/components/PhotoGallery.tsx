"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbox } from "./Lightbox";
import { extractErrorMessage } from "@/lib/formError";

type Photo = { id: string; url: string };

export function PhotoGallery({
  orderId,
  photos,
  canEdit,
}: {
  orderId: string;
  photos: Photo[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    const res = await fetch(`/api/orders/${orderId}/photos`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to upload photos"));
      return;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  async function handleDelete(photoId: string) {
    setDeletingId(photoId);
    setError(null);
    const res = await fetch(`/api/orders/${orderId}/photos/${photoId}`, {
      method: "DELETE",
    });
    setDeletingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to delete photo"));
      return;
    }
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Photos</h2>
        {canEdit && (
          <label className="cursor-pointer text-xs font-medium text-brand-blue hover:underline">
            {uploading ? "Uploading..." : "+ Add photos"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              disabled={uploading}
              onChange={handleFilesSelected}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && <p className="mb-3 text-xs text-brand-red">{error}</p>}

      {photos.length === 0 ? (
        <p className="text-sm text-text-muted">No photos uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, i) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border-subtle">
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="block h-full w-full cursor-zoom-in"
                aria-label="View photo full size"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt="Shipment"
                  className="h-full w-full object-cover"
                />
              </button>
              {canEdit && (
                <button
                  onClick={() => handleDelete(photo.id)}
                  disabled={deletingId === photo.id}
                  aria-label="Delete photo"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-100"
                >
                  {deletingId === photo.id ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M6 6L18 18M6 18L18 6"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={photos.map((p) => p.url)}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
}
