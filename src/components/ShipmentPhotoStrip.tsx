"use client";

import { useState } from "react";
import { Lightbox } from "./Lightbox";

export function ShipmentPhotoStrip({ photos }: { photos: { id: string; url: string }[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="mt-3 flex gap-1.5">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="cursor-zoom-in"
            aria-label="View photo full size"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt="Shipment"
              className="h-12 w-12 rounded-md border border-border-subtle object-cover"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={photos.map((p) => p.url)}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
