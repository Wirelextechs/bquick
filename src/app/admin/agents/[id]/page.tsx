import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { SuspendAgentButton } from "@/components/SuspendAgentButton";
import { EditAgentModal } from "@/components/EditAgentModal";
import { FilterForm } from "@/components/FilterForm";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Prisma } from "@prisma/client";

export default async function AgentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ trackingCode?: string; date?: string }>;
}) {
  const { id } = await params;
  const filters = await searchParams;

  const agent = await prisma.user.findUnique({ where: { id } });
  if (!agent || agent.role !== "AGENT") notFound();

  const where: Prisma.OrderWhereInput = {
    OR: [{ createdById: id }, { lastUpdatedById: id }],
  };
  if (filters.trackingCode) {
    where.trackingCode = { contains: filters.trackingCode, mode: "insensitive" };
  }
  if (filters.date) {
    const start = new Date(filters.date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    where.createdAt = { gte: start, lt: end };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      client: { select: { name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader
        title={agent.name}
        description={agent.agentLocation === "GHANA" ? "Home team (Ghana)" : "Origin team (abroad)"}
      />
      <Link href="/admin/agents" className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-brand-blue">
        ← Back to agents
      </Link>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[var(--shadow-card)] lg:col-span-1">
          <div className="h-16" style={{ background: "var(--gradient-ocean)" }} />
          <div className="px-5 pb-5">
            <div className="-mt-8 mb-3">
              <div className="inline-flex rounded-full bg-surface p-1 shadow-[var(--shadow-card)]">
                <Avatar name={agent.name} size={56} />
              </div>
            </div>
            <div className="mb-4">
              <p className="font-semibold text-text-primary">{agent.name}</p>
              <p className="text-xs text-text-muted">
                {agent.agentLocation === "GHANA" ? "Ghana" : "Abroad"}
              </p>
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-text-muted">Email</dt>
                <dd className="text-text-primary">{agent.email}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Joined</dt>
                <dd className="text-text-primary">{agent.createdAt.toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Status</dt>
                <dd>
                  {agent.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-red">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-red" /> Suspended
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center gap-2 border-t border-border-subtle pt-4">
              <EditAgentModal
                agentId={agent.id}
                initial={{
                  name: agent.name,
                  email: agent.email,
                  agentLocation: agent.agentLocation ?? "ABROAD",
                }}
              />
              <SuspendAgentButton agentId={agent.id} isActive={agent.isActive} />
            </div>
          </div>
        </section>

        <div className="lg:col-span-2">
          <FilterForm className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-surface p-3 shadow-[var(--shadow-xs)]">
            <Input
              type="text"
              name="trackingCode"
              placeholder="Search tracking code"
              defaultValue={filters.trackingCode ?? ""}
              className="w-auto"
            />
            <Input type="date" name="date" defaultValue={filters.date ?? ""} className="w-auto" />
            <Button type="submit">Filter</Button>
          </FilterForm>

          <p className="mb-2 text-xs text-text-muted">
            Shipments this agent added or was the last to update
          </p>

          {orders.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-surface px-5 py-16 text-center text-sm text-text-muted shadow-[var(--shadow-card)]">
              No shipments match these filters.
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="space-y-3 md:hidden">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block rounded-2xl border border-border-subtle bg-surface p-4 shadow-[var(--shadow-xs)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-mono text-xs font-medium text-brand-navy">
                        {order.trackingCode}
                      </p>
                      <StatusBadge status={order.status} />
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-text-muted">Client</dt>
                        <dd className="truncate text-text-secondary">{order.client.name}</dd>
                      </div>
                      <div>
                        <dt className="text-text-muted">Role</dt>
                        <dd className="text-text-secondary">
                          {order.createdBy.id === id ? "Added it" : "Updated it"}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-text-muted">Created</dt>
                        <dd className="text-text-secondary">{order.createdAt.toLocaleDateString()}</dd>
                      </div>
                    </dl>
                  </Link>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden rounded-xl border border-border-subtle bg-surface shadow-[var(--shadow-card)] md:block">
                <Table className="min-w-[560px] text-sm">
                  <TableHeader>
                    <TableRow className="border-border-subtle bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-muted hover:bg-surface-muted">
                      <TableHead className="h-auto px-5 py-3 text-inherit">Tracking</TableHead>
                      <TableHead className="h-auto px-5 py-3 text-inherit">Client</TableHead>
                      <TableHead className="h-auto px-5 py-3 text-inherit">Status</TableHead>
                      <TableHead className="h-auto px-5 py-3 text-inherit">Role</TableHead>
                      <TableHead className="h-auto px-5 py-3 text-inherit">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="border-border-subtle last:border-0 transition hover:bg-surface-muted"
                      >
                        <TableCell className="whitespace-normal px-5 py-3.5 font-mono text-xs font-medium text-brand-navy">
                          <Link href={`/orders/${order.id}`} className="hover:underline">
                            {order.trackingCode}
                          </Link>
                        </TableCell>
                        <TableCell className="whitespace-normal px-5 py-3.5 text-text-secondary">
                          {order.client.name}
                        </TableCell>
                        <TableCell className="whitespace-normal px-5 py-3.5">
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="whitespace-normal px-5 py-3.5 text-xs text-text-muted">
                          {order.createdBy.id === id ? "Added it" : "Updated it"}
                        </TableCell>
                        <TableCell className="whitespace-normal px-5 py-3.5 text-text-muted">
                          {order.createdAt.toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
