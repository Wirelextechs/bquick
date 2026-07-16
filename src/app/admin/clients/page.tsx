import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { CreateClientForm } from "@/components/CreateClientForm";
import { Avatar } from "@/components/Avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminClientsPage() {
  const session = await auth();

  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: { _count: { select: { ordersAsClient: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell
      navItems={AdminNav("clients")}
      pageTitle="Clients"
      pageDescription={`${clients.length} client${clients.length === 1 ? "" : "s"} on the platform`}
      userName={session!.user.name ?? ""}
      roleLabel="Administrator"
      actions={<CreateClientForm />}
    >
      <div className="rounded-xl border border-border-subtle bg-surface shadow-[var(--shadow-card)]">
        <Table className="min-w-[760px] text-sm">
          <TableHeader>
            <TableRow className="border-border-subtle bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-muted hover:bg-surface-muted">
              <TableHead className="h-auto px-5 py-3 text-inherit">Client ID</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Name</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Contact</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Country</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Orders</TableHead>
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
            {clients.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-5 py-16 text-center text-text-muted">
                  No clients yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
