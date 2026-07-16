import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { StatusBadge } from "@/components/StatusBadge";
import { OrderStatusUpdater } from "@/components/OrderStatusUpdater";
import { ShipmentRowActions } from "@/components/ShipmentRowActions";
import { FilterForm } from "@/components/FilterForm";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Ship, Anchor, Warehouse, PackageCheck } from "lucide-react";
import { Prisma, OrderStatus } from "@prisma/client";

export default async function AdminPage({
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

  const [orders, stats] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        client: { select: { id: true, clientCode: true, name: true, email: true, phone: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        lastUpdatedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);

  const statCounts = Object.fromEntries(stats.map((s) => [s.status, s._count]));
  const totalOrders = stats.reduce((sum, s) => sum + s._count, 0);

  return (
    <AppShell
      navItems={AdminNav("orders")}
      pageTitle="Shipments"
      pageDescription="Every shipment across all clients and agents"
      userName={session!.user.name ?? ""}
      roleLabel="Administrator"
    >
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total shipments" value={totalOrders} hero />
        <StatCard label="Pending" value={statCounts.PENDING ?? 0} icon={<Clock className="size-4" />} tone="slate" />
        <StatCard label="In transit" value={statCounts.IN_TRANSIT ?? 0} icon={<Ship className="size-4" />} tone="blue" />
        <StatCard label="At port" value={statCounts.AT_PORT ?? 0} icon={<Anchor className="size-4" />} tone="amber" />
        <StatCard label="Warehouse" value={statCounts.AT_WAREHOUSE ?? 0} icon={<Warehouse className="size-4" />} tone="violet" />
        <StatCard label="Picked up" value={statCounts.PICKED_UP ?? 0} icon={<PackageCheck className="size-4" />} tone="emerald" />
      </div>

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

                <Link
                  href={`/admin/clients/${order.client.id}`}
                  className="mt-2 flex items-center gap-2.5"
                >
                  <Avatar name={order.client.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">{order.client.name}</p>
                    <p className="truncate text-xs text-text-muted">
                      {order.client.clientCode ?? "—"} · {order.client.email}
                    </p>
                  </div>
                </Link>

                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border-subtle pt-3 text-xs">
                  <div>
                    <dt className="text-text-muted">Created by</dt>
                    <dd className="truncate text-text-secondary">{order.createdBy.name}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Last updated by</dt>
                    <dd className="truncate text-text-secondary">{order.lastUpdatedBy?.name ?? "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-text-muted">Created</dt>
                    <dd className="text-text-secondary">{order.createdAt.toLocaleDateString()}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-center gap-1.5 border-t border-border-subtle pt-3">
                  <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                  <ShipmentRowActions orderId={order.id} currentClientName={order.client.name} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden rounded-xl border border-border-subtle bg-surface shadow-[var(--shadow-card)] md:block">
            <Table className="min-w-[900px] text-sm">
              <TableHeader>
                <TableRow className="border-border-subtle bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-muted hover:bg-surface-muted">
                  <TableHead className="h-auto px-5 py-3 text-inherit">Tracking</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Client</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Status</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Created by</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Last updated by</TableHead>
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
                      <Link
                        href={`/admin/clients/${order.client.id}`}
                        className="flex items-center gap-2.5 hover:underline"
                      >
                        <Avatar name={order.client.name} />
                        <div>
                          <div className="font-medium text-text-primary">{order.client.name}</div>
                          <div className="text-xs text-text-muted">
                            {order.client.clientCode ?? "—"} · {order.client.email}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5 text-text-secondary">
                      {order.createdBy.role === "AGENT" ? (
                        <Link href={`/admin/agents/${order.createdBy.id}`} className="hover:underline">
                          {order.createdBy.name}
                        </Link>
                      ) : (
                        order.createdBy.name
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5 text-text-secondary">
                      {!order.lastUpdatedBy ? (
                        "—"
                      ) : order.lastUpdatedBy.role === "AGENT" ? (
                        <Link href={`/admin/agents/${order.lastUpdatedBy.id}`} className="hover:underline">
                          {order.lastUpdatedBy.name}
                        </Link>
                      ) : (
                        order.lastUpdatedBy.name
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5 text-text-muted">
                      {order.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                        <ShipmentRowActions orderId={order.id} currentClientName={order.client.name} />
                      </div>
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

const STAT_TONES = {
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-brand-blue-light text-brand-blue",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
} as const;

function StatCard({
  label,
  value,
  icon,
  tone,
  hero = false,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone?: keyof typeof STAT_TONES;
  hero?: boolean;
}) {
  if (hero) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl p-4 text-white shadow-[var(--shadow-glow-blue)]"
        style={{ background: "var(--gradient-ocean)" }}
      >
        <div className="pointer-events-none absolute -right-4 -top-6 h-20 w-20 rounded-full bg-white/15 blur-2xl" />
        <p className="relative text-xs font-medium text-white/75">{label}</p>
        <p className="relative mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-card)]">
      {icon && (
        <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${STAT_TONES[tone ?? "slate"]}`}>
          {icon}
        </div>
      )}
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums text-text-primary">{value}</p>
    </div>
  );
}
