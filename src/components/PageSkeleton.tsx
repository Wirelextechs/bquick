// Shown instantly by Next.js while a route segment's server component is
// still fetching data, so navigation feels immediate instead of frozen.
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4 p-4 sm:p-6">
      <div className="h-7 w-40 rounded-md bg-surface-sunken" />
      <div className="h-9 w-full max-w-md rounded-lg bg-surface-sunken" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 w-full rounded-xl bg-surface-sunken" />
        ))}
      </div>
    </div>
  );
}
