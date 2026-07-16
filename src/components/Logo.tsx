import Image from "next/image";

// Intrinsic size of /public/logo/quicklogistics-mark.png
const MARK_WIDTH = 482;
const MARK_HEIGHT = 197;
const ASPECT_RATIO = MARK_WIDTH / MARK_HEIGHT;

export function Logo({ size = 28, dark = false }: { size?: number; dark?: boolean }) {
  const height = Math.round(size * 1.6);
  const width = Math.round(height * ASPECT_RATIO);

  const mark = (
    <Image
      src="/logo/quicklogistics-mark.png"
      alt="BQUICK Logistics"
      width={width}
      height={height}
      priority
    />
  );

  // The mark's navy ink (sail icon, "LOGISTICS" wordmark) disappears against
  // a navy surface, so give it a light chip to sit on wherever it's placed
  // on a dark background (sidebar, login brand panel).
  if (!dark) return mark;

  return (
    <span className="inline-flex items-center rounded-lg bg-white px-2.5 py-1.5">
      {mark}
    </span>
  );
}
