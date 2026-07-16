import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { ClientNav } from "@/components/ClientNav";
import { ExchangeStatusBadge } from "@/components/ExchangeStatusBadge";
import { ExchangeRateCalculator } from "@/components/ExchangeRateCalculator";
import { ExchangeRequestForm } from "@/components/ExchangeRequestForm";
import { ArrowLeftRight } from "lucide-react";

export default async function ClientExchangePage() {
  const session = await auth();

  const [latestRate, settings, exchanges] = await Promise.all([
    prisma.exchangeRate.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.exchangePaymentSettings.findUnique({ where: { id: "singleton" } }),
    prisma.exchangeTransaction.findMany({
      where: { clientId: session!.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rate = latestRate?.rate.toString() ?? "0";

  return (
    <AppShell
      navItems={ClientNav("exchange")}
      pageTitle="RMB Exchange"
      pageDescription="Convert Ghana Cedis to Chinese Yuan for supplier payments"
      userName={session!.user.name ?? ""}
      roleLabel="Client"
    >
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <ExchangeRateCalculator rate={rate} />

        <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">How to pay</h2>
          {settings ? (
            <div className="space-y-2 text-sm text-text-secondary">
              <p>
                1. Send the GHS amount via Mobile Money to{" "}
                <span className="font-semibold text-text-primary">{settings.momoNumber}</span>{" "}
                (registered name: <span className="font-medium">{settings.momoName}</span>).
              </p>
              <p>2. Submit a new request below with your payment reference and a screenshot of your payment.</p>
              <p>3. Upload your recipient&apos;s Alipay QR code (not a QR of the payment you just made), or type their account details instead.</p>
              <p>4. We verify the payment against our MoMo account and send the RMB to your recipient.</p>
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              Payment collection details haven&apos;t been configured yet. Contact support.
            </p>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Your requests</h2>
        <ExchangeRequestForm rate={rate} />
      </div>

      {exchanges.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface py-24 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[var(--shadow-glow-blue)]"
            style={{ background: "var(--gradient-ocean)" }}
          >
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-text-primary">No exchange requests yet</p>
          <p className="mt-1 text-sm text-text-muted">
            Submit a request above once you&apos;ve made a MoMo payment.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {exchanges.map((exchange) => (
            <Link
              key={exchange.id}
              href={`/exchanges/${exchange.id}`}
              className="relative flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: "var(--gradient-ocean)" }}
              />
              <div className="mb-3 flex items-start justify-between">
                <span className="font-mono text-sm font-semibold text-brand-navy">
                  {exchange.referenceCode}
                </span>
                <ExchangeStatusBadge status={exchange.status} />
              </div>
              <p className="text-sm text-text-secondary">
                ₵{exchange.amountGHS.toString()} → ¥{exchange.amountRMB.toString()}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {exchange.createdAt.toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
