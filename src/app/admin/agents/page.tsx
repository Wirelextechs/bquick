import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { CreateAgentForm } from "@/components/CreateAgentForm";
import { SuspendAgentButton } from "@/components/SuspendAgentButton";
import { Avatar } from "@/components/Avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminAgentsPage() {
  const session = await auth();

  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    include: { _count: { select: { ordersCreated: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell
      navItems={AdminNav("agents")}
      pageTitle="Agents"
      pageDescription={`${agents.length} agent${agents.length === 1 ? "" : "s"} across origin and home teams`}
      userName={session!.user.name ?? ""}
      roleLabel="Administrator"
      actions={<CreateAgentForm />}
    >
      <div className="rounded-xl border border-border-subtle bg-surface shadow-[var(--shadow-card)]">
        <Table className="min-w-[720px] text-sm">
          <TableHeader>
            <TableRow className="border-border-subtle bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-muted hover:bg-surface-muted">
              <TableHead className="h-auto px-5 py-3 text-inherit">Name</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Email</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Location</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Orders created</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Status</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow
                key={agent.id}
                className="border-border-subtle last:border-0 transition hover:bg-surface-muted"
              >
                <TableCell className="whitespace-normal px-5 py-3.5">
                  <Link
                    href={`/admin/agents/${agent.id}`}
                    className="flex items-center gap-2.5 hover:underline"
                  >
                    <Avatar name={agent.name} />
                    <span className="font-medium text-text-primary">{agent.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="whitespace-normal px-5 py-3.5 text-text-secondary">
                  {agent.email}
                </TableCell>
                <TableCell className="whitespace-normal px-5 py-3.5">
                  <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-medium text-text-secondary">
                    {agent.agentLocation === "GHANA" ? "Ghana" : "Abroad"}
                  </span>
                </TableCell>
                <TableCell className="whitespace-normal px-5 py-3.5 tabular-nums text-text-secondary">
                  {agent._count.ordersCreated}
                </TableCell>
                <TableCell className="whitespace-normal px-5 py-3.5">
                  {agent.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-red">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-red" /> Suspended
                    </span>
                  )}
                </TableCell>
                <TableCell className="whitespace-normal px-5 py-3.5">
                  <SuspendAgentButton agentId={agent.id} isActive={agent.isActive} />
                </TableCell>
              </TableRow>
            ))}
            {agents.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-5 py-16 text-center text-text-muted">
                  No agents yet — create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
