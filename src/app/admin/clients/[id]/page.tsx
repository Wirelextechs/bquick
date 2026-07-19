import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { FilterForm } from "@/components/FilterForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Prisma, OrderStatus } from "@prisma/client";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; trackingCode?: string; date?: string }>;
}) {
  const { id } = await params;
  const filters = await searchParams;

  const client = await prisma.user.findUnique({ where: { id } });
  if (!client || client.role !== "CLIENT") notFound();

  const where: Prisma.OrderWhereInput = { clientId: id };
  if (filters.status) where.status = filters.status as OrderStatus;
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
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PageHeader title={client.name} description={client.clientCode ?? undefined} />
      <Link href="/admin/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-brand-blue">
        ← Back to clients
      </Link>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[var(--shadow-card)] lg:col-span-1">
          <div className="h-16" style={{ background: "var(--gradient-ocean)" }} />
          <div className="px-5 pb-5">
            <div className="-mt-8 mb-3">
              <div className="inline-flex rounded-full bg-surface p-1 shadow-[var(--shadow-card)]">
                <Avatar name={client.name} size={56} />
              </div>
            </div>
            <div className="mb-4">
              <p className="font-semibold text-text-primary">{client.name}</p>
              <p className="font-mono text-xs text-text-muted">{client.clientCode ?? "No client ID"}</p>
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-text-muted">Email</dt>
                <dd className="text-text-primary">{client.email}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Phone</dt>
                <dd className="text-text-primary">{client.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Address</dt>
                <dd className="text-text-primary">{client.address ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Country</dt>
                <dd className="text-text-primary">{client.country ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Joined</dt>
                <dd className="text-text-primary">{client.createdAt.toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Status</dt>
                <dd>
                  {client.isActive ? (
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
          </div>
        </section>

        <div className="lg:col-span-2">
          <FilterForm className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-surface p-3 shadow-[var(--shadow-xs)]">
            <select
              name="status"
              defaultValue={filters.status ?? ""}
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
              defaultValue={filters.trackingCode ?? ""}
              className="w-auto"
            />
            <Input type="date" name="date" defaultValue={filters.date ?? ""} className="w-auto" />
            <Button type="submit">Filter</Button>
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
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-border-subtle bg-surface p-4 shadow-[var(--shadow-xs)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-medium text-brand-navy">
                        {order.trackingCode}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">{order.createdAt.toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </Link>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden rounded-xl border border-border-subtle bg-surface shadow-[var(--shadow-card)] md:block">
                <Table className="min-w-[500px] text-sm">
                  <TableHeader>
                    <TableRow className="border-border-subtle bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-muted hover:bg-surface-muted">
                      <TableHead className="h-auto px-5 py-3 text-inherit">Tracking</TableHead>
                      <TableHead className="h-auto px-5 py-3 text-inherit">Status</TableHead>
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
                        <TableCell className="whitespace-normal px-5 py-3.5">
                          <StatusBadge status={order.status} />
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
