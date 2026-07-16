import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { ExchangeStatusBadge } from "@/components/ExchangeStatusBadge";
import { ExchangeProcessModal } from "@/components/ExchangeProcessModal";
import { UpdateExchangeRateControl } from "@/components/UpdateExchangeRateControl";
import { ExchangePaymentSettingsForm } from "@/components/ExchangePaymentSettingsForm";
import { Avatar } from "@/components/Avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, RefreshCcw, CheckCircle2 } from "lucide-react";
import { Prisma, ExchangeStatus } from "@prisma/client";

export default async function AdminExchangePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const where: Prisma.ExchangeTransactionWhereInput = {};
  if (params.status) where.status = params.status as ExchangeStatus;

  const [exchanges, stats, latestRate, settings] = await Promise.all([
    prisma.exchangeTransaction.findMany({
      where,
      include: { client: { select: { id: true, name: true, clientCode: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.exchangeTransaction.groupBy({ by: ["status"], _count: true }),
    prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.exchangePaymentSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const statCounts = Object.fromEntries(stats.map((s) => [s.status, s._count]));
  const totalExchanges = stats.reduce((sum, s) => sum + s._count, 0);
  const rate = latestRate?.rate.toString() ?? "0";

  return (
    <AppShell
      navItems={AdminNav("exchange")}
      pageTitle="RMB Exchange"
      pageDescription="Review and process client exchange requests"
      userName={session!.user.name ?? ""}
      roleLabel="Administrator"
      actions={<UpdateExchangeRateControl currentRate={rate} />}
    >
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total requests" value={totalExchanges} hero />
        <StatCard label="Pending" value={statCounts.PENDING ?? 0} icon={<Clock className="size-4" />} tone="slate" />
        <StatCard label="Processing" value={statCounts.PROCESSING ?? 0} icon={<RefreshCcw className="size-4" />} tone="amber" />
        <StatCard label="Completed" value={statCounts.COMPLETED ?? 0} icon={<CheckCircle2 className="size-4" />} tone="emerald" />
      </div>

      <div className="mb-6">
        <ExchangePaymentSettingsForm
          momoNumber={settings?.momoNumber ?? ""}
          momoName={settings?.momoName ?? ""}
        />
      </div>

      <form
        className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-surface p-3 shadow-[var(--shadow-xs)]"
        method="get"
      >
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>
        <button
          type="submit"
          className="h-8 rounded-lg bg-[image:var(--gradient-action)] px-3.5 text-sm font-medium text-white"
        >
          Apply
        </button>
      </form>

      <div className="rounded-xl border border-border-subtle bg-surface shadow-[var(--shadow-card)]">
        <Table className="min-w-[900px] text-sm">
          <TableHeader>
            <TableRow className="border-border-subtle bg-surface-muted text-xs font-semibold uppercase tracking-wide text-text-muted hover:bg-surface-muted">
              <TableHead className="h-auto px-5 py-3 text-inherit">Reference</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Client</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Amount</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Method</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Status</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Submitted</TableHead>
              <TableHead className="h-auto px-5 py-3 text-inherit">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exchanges.map((exchange) => (
              <TableRow
                key={exchange.id}
                className="border-border-subtle last:border-0 transition hover:bg-surface-muted"
              >
                <TableCell className="whitespace-normal px-5 py-3.5 font-mono text-xs font-medium text-brand-navy">
                  <Link href={`/exchanges/${exchange.id}`} className="hover:underline">
                    {exchange.referenceCode}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-normal px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={exchange.client.name} />
                    <div>
                      <div className="font-medium text-text-primary">{exchange.client.name}</div>
                      <div className="text-xs text-text-muted">
                        {exchange.client.clientCode ?? "—"} · {exchange.client.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal px-5 py-3.5 text-text-secondary">
                  ₵{exchange.amountGHS.toString()} → ¥{exchange.amountRMB.toString()}
                </TableCell>
                <TableCell className="whitespace-normal px-5 py-3.5 text-text-secondary">
                  {exchange.paymentMethod}
                </TableCell>
                <TableCell className="whitespace-normal px-5 py-3.5">
                  <ExchangeStatusBadge status={exchange.status} />
                </TableCell>
                <TableCell className="whitespace-normal px-5 py-3.5 text-text-muted">
                  {exchange.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="whitespace-normal px-5 py-3.5">
                  {exchange.status === "PENDING" || exchange.status === "PROCESSING" ? (
                    <ExchangeProcessModal
                      exchange={{
                        id: exchange.id,
                        referenceCode: exchange.referenceCode,
                        status: exchange.status,
                        amountGHS: exchange.amountGHS.toString(),
                        amountRMB: exchange.amountRMB.toString(),
                        paymentMethod: exchange.paymentMethod,
                        paymentRef: exchange.paymentRef,
                        payerMomoName: exchange.payerMomoName,
                        payerMomoNumber: exchange.payerMomoNumber,
                        payerBankName: exchange.payerBankName,
                        payerBankAccountNumber: exchange.payerBankAccountNumber,
                        payerBankAccountName: exchange.payerBankAccountName,
                        proofUrl: exchange.proofUrl,
                        recipientMethod: exchange.recipientMethod,
                        recipientDetails: exchange.recipientDetails,
                        recipientQrUrl: exchange.recipientQrUrl,
                      }}
                    />
                  ) : (
                    <Link
                      href={`/exchanges/${exchange.id}`}
                      className="text-xs font-medium text-brand-blue hover:underline"
                    >
                      View
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {exchanges.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="px-5 py-16 text-center text-text-muted">
                  No exchange requests match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}

const STAT_TONES = {
  slate: "bg-slate-100 text-slate-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  red: "bg-red-50 text-brand-red",
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
