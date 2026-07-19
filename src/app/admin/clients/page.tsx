import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { CreateClientForm } from "@/components/CreateClientForm";
import { Avatar } from "@/components/Avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminClientsPage() {
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: { _count: { select: { ordersAsClient: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length === 1 ? "" : "s"} on the platform`}
        actions={<CreateClientForm />}
      />
      {clients.length === 0 ? (
        <div className="rounded-xl border border-border-subtle bg-surface px-5 py-16 text-center text-sm text-text-muted shadow-[var(--shadow-card)]">
          No clients yet. Create one to get started.
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className="block rounded-2xl border border-border-subtle bg-surface p-4 shadow-[var(--shadow-xs)]"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={client.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text-primary">{client.name}</p>
                    <p className="font-mono text-xs text-text-muted">{client.clientCode ?? "—"}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-medium tabular-nums text-text-secondary">
                    {client._count.ordersAsClient} shipment{client._count.ordersAsClient === 1 ? "" : "s"}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border-subtle pt-3 text-xs">
                  <div>
                    <dt className="text-text-muted">Contact</dt>
                    <dd className="truncate text-text-secondary">{client.email}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Country</dt>
                    <dd className="text-text-secondary">{client.country ?? "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-text-muted">Joined</dt>
                    <dd className="text-text-secondary">{client.createdAt.toLocaleDateString()}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden rounded-xl border border-border-subtle bg-surface shadow-[var(--shadow-card)] md:block">
            <Table className="min-w-[760px] text-sm">
              <TableHeader>
                <TableRow className="border-border-subtle bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-muted hover:bg-surface-muted">
                  <TableHead className="h-auto px-5 py-3 text-inherit">Client ID</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Name</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Contact</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Country</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Shipments</TableHead>
                  <TableHead className="h-auto px-5 py-3 text-inherit">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="border-border-subtle last:border-0 transition hover:bg-surface-muted"
                  >
                    <TableCell className="whitespace-normal px-5 py-3.5 font-mono text-xs font-medium text-brand-navy">
                      {client.clientCode ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="flex items-center gap-2.5 hover:underline"
                      >
                        <Avatar name={client.name} />
                        <span className="font-medium text-text-primary">{client.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5">
                      <div className="text-text-secondary">{client.email}</div>
                      <div className="text-xs text-text-muted">{client.phone ?? "—"}</div>
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5 text-text-secondary">
                      {client.country ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5">
                      <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-medium tabular-nums text-text-secondary">
                        {client._count.ordersAsClient}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-normal px-5 py-3.5 text-text-muted">
                      {client.createdAt.toLocaleDateString()}
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
