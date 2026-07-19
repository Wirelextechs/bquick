import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { CreateAgentForm } from "@/components/CreateAgentForm";
import { SuspendAgentButton } from "@/components/SuspendAgentButton";
import { Avatar } from "@/components/Avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminAgentsPage() {
  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    include: { _count: { select: { ordersCreated: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Agents"
        description={`${agents.length} agent${agents.length === 1 ? "" : "s"} across origin and home teams`}
        actions={<CreateAgentForm />}
      />
      {agents.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface px-5 py-16 text-center text-sm text-text-muted shadow-[var(--shadow-card)]">
          No agents yet. Create one to get started.
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {agents.map((agent) => (
              <div key={agent.id} className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-[var(--shadow-xs)]">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/admin/agents/${agent.id}`} className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={agent.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">{agent.name}</p>
                      <p className="truncate text-xs text-text-muted">{agent.email}</p>
                    </div>
                  </Link>
                  {agent.isActive ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-brand-red">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-red" /> Suspended
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3">
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-medium">
                      {agent.agentLocation === "GHANA" ? "Ghana" : "Abroad"}
                    </span>
                    <span className="tabular-nums">
                      {agent._count.ordersCreated} shipment{agent._count.ordersCreated === 1 ? "" : "s"}
                    </span>
                  </div>
                  <SuspendAgentButton agentId={agent.id} isActive={agent.isActive} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden rounded-xl border border-border-subtle bg-surface shadow-[var(--shadow-card)] md:block">
            <Table className="min-w-[720px] text-sm">
              <TableHeader>
                <TableRow className="border-border-subtle bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-muted hover:bg-surface-muted">
                  <TableHead className="h-auto px-5 py-3 text-inherit">Name</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Email</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Location</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Shipments created</TableHead>
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
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}
