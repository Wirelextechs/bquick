import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderStatusUpdater } from "@/components/OrderStatusUpdater";
import { CreateOrderForm } from "@/components/CreateOrderForm";
import { Avatar } from "@/components/Avatar";
import { AgentNav } from "@/components/AgentNav";
import { FilterForm } from "@/components/FilterForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Prisma, OrderStatus } from "@prisma/client";

export default async function AgentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; trackingCode?: string; date?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const where: Prisma.OrderWhereInput = {};
  if (params.status) where.status = params.status as OrderStatus;
  if (params.trackingCode) {
    where.trackingCode = { contains: params.trackingCode, mode: "insensitive" };
  }
  if (params.date) {
    const start = new Date(params.date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    where.createdAt = { gte: start, lt: end };
  }

  // All agents (home and abroad) share one pipeline, so every agent sees every
  // order — not just ones they personally created or last touched — otherwise
  // the receiving team could never find a shipment to mark as arrived.
  const [clients, orders] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      select: { id: true, clientCode: true, name: true, email: true, phone: true },
      orderBy: { name: "asc" },
    }),
    prisma.order.findMany({
      where,
      include: { client: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <AppShell
      navItems={AgentNav("shipments")}
      pageTitle="Shipments"
      pageDescription="Every shipment in the pipeline, home and abroad"
      userName={session!.user.name ?? ""}
      roleLabel="Agent"
      actions={<CreateOrderForm clients={clients} />}
    >
      {clients.length === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No client accounts exist yet. Ask an admin to create one before you can register a shipment.
        </div>
      )}

      <FilterForm className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-surface p-3 shadow-[var(--shadow-xs)]">
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_TRANSIT">In transit</option>
          <option value="AT_PORT">At port</option>
          <option value="AT_WAREHOUSE">At warehouse</option>
          <option value="PICKED_UP">Picked up</option>
        </select>
        <Input
          type="text"
          name="trackingCode"
          placeholder="Search tracking code"
          defaultValue={params.trackingCode ?? ""}
          className="w-auto"
        />
        <Input type="date" name="date" defaultValue={params.date ?? ""} className="w-auto" />
        <Button type="submit">Apply filters</Button>
      </FilterForm>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface px-5 py-16 text-center text-sm text-text-muted shadow-[var(--shadow-card)]">
          No shipments match these filters.
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-[var(--shadow-xs)]">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/orders/${order.id}`} className="min-w-0">
                    <p className="truncate font-mono text-xs font-medium text-brand-navy">
                      {order.trackingCode}
                    </p>
                  </Link>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <Avatar name={order.client.name} />
                  <span className="truncate text-sm font-medium text-text-primary">{order.client.name}</span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border-subtle pt-3 text-xs">
                  <div>
                    <dt className="text-text-muted">Origin</dt>
                    <dd className="text-text-secondary">{order.originCountry}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Created</dt>
                    <dd className="text-text-secondary">{order.createdAt.toLocaleDateString()}</dd>
                  </div>
                </dl>
                <div className="mt-3 border-t border-border-subtle pt-3">
                  <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden rounded-xl border border-border-subtle bg-surface shadow-[var(--shadow-card)] md:block">
            <Table className="min-w-[720px] text-sm">
              <TableHeader>
                <TableRow className="border-border-subtle bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-muted hover:bg-surface-muted">
                  <TableHead className="h-auto px-5 py-3 text-inherit">Tracking</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Client</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Origin</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Status</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Created</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Action</TableHead>
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
                    <TableCell className="whitespace-normal px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={order.client.name} />
                        <span className="font-medium text-text-primary">{order.client.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5 text-text-secondary">
                      {order.originCountry}
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5 text-text-muted">
                      {order.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5">
                      <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </AppShell>
  );
}
