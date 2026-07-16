import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AgentNav } from "@/components/AgentNav";
import { Avatar } from "@/components/Avatar";
import { Lock } from "lucide-react";

export default async function AgentProfilePage() {
  const session = await auth();
  const agent = await prisma.user.findUniqueOrThrow({ where: { id: session!.user.id } });

  return (
    <AppShell
      navItems={AgentNav("profile")}
      pageTitle="My Profile"
      userName={session!.user.name ?? ""}
      roleLabel="Agent"
    >
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Lock className="size-4 shrink-0" />
          Your profile is read-only. To update any of these details, contact an
          administrator — they can make the change on your behalf.
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={agent.name} size={44} />
            <div>
              <p className="font-semibold text-text-primary">{agent.name}</p>
              <p className="text-xs text-text-muted">
                {agent.agentLocation === "GHANA" ? "Ghana (home team)" : "Abroad (origin team)"}
              </p>
            </div>
          </div>
          <dl className="space-y-3 border-t border-border-subtle pt-4 text-sm">
            <div>
              <dt className="text-text-muted">Email</dt>
              <dd className="mt-0.5 text-text-primary">{agent.email}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Joined</dt>
              <dd className="mt-0.5 text-text-primary">{agent.createdAt.toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Status</dt>
              <dd className="mt-0.5">
                {agent.isActive ? (
                  <span className="text-emerald-600">Active</span>
                ) : (
                  <span className="text-brand-red">Suspended</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </AppShell>
  );
}
