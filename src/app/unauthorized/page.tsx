import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Logo size={28} />
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_6px_20px_rgba(154,4,16,0.28)]"
        style={{ background: "linear-gradient(135deg, var(--brand-red), var(--brand-red-bright))" }}
      >
        <TriangleAlert className="size-6" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Not authorized</h1>
        <p className="mt-1 text-sm text-text-muted">
          Your account doesn&apos;t have access to this page.
        </p>
      </div>
      <Link
        href="/login"
        className="rounded-lg px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-glow-blue)] transition hover:opacity-90"
        style={{ background: "var(--gradient-action)" }}
      >
        Back to login
      </Link>
    </div>
  );
}
