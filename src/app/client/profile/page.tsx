import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { ClientNav } from "@/components/ClientNav";
import { ClientProfileForm } from "@/components/ClientProfileForm";
import { Lock, IdCard } from "lucide-react";

export default async function ClientProfilePage() {
  const session = await auth();
  const client = await prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <AppShell
      navItems={ClientNav("profile")}
      pageTitle="My Profile"
      pageDescription="Your contact details on file with BQUICK Logistics"
      userName={session!.user.name ?? ""}
      roleLabel="Client"
    >
      <div className="mx-auto max-w-xl space-y-6">
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-[var(--shadow-glow-blue)]"
          style={{ background: "var(--gradient-ocean)" }}
        >
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <IdCard className="size-5" />
              </span>
              <div>
                <p className="text-xs font-medium text-white/70">Client ID</p>
                <p className="font-mono text-lg font-semibold tracking-tight">
                  {client.clientCode ?? "Not assigned"}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70">
              <Lock className="size-3" /> Fixed
            </span>
          </div>
          <p className="relative mt-3 text-xs text-white/60">
            This is your permanent reference ID and cannot be changed.
          </p>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Contact details</h2>
          <ClientProfileForm
            initial={{
              name: client.name,
              email: client.email,
              phone: client.phone ?? "",
              secondaryPhone: client.secondaryPhone ?? "",
              address: client.address ?? "",
              country: client.country ?? "",
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
