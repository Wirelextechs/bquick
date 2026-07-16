import Link from "next/link";
import { SearchX } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Logo size={28} />
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[var(--shadow-glow-blue)]"
        style={{ background: "var(--gradient-ocean)" }}
      >
        <SearchX className="size-6" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Page not found</h1>
        <p className="mt-1 text-sm text-text-muted">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-glow-blue)] transition hover:opacity-90"
        style={{ background: "var(--gradient-action)" }}
      >
        Back to dashboard
      </Link>
    </div>
  );
}
