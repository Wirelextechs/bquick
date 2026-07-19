import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/Logo";
import { ExchangeStatusBadge } from "@/components/ExchangeStatusBadge";
import { ExchangeStatusTimeline } from "@/components/ExchangeStatusTimeline";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-blue-light text-brand-blue">
        {icon}
      </span>
      {children}
    </h2>
  );
}

// Public, read-only tracking page — no login required. Anyone who knows the
// reference code (or found it via the phone-number lookup on /track) can
// view status here. Everything for a guest request was submitted upfront,
// so there are no upload/edit controls here, unlike the authenticated
// /exchanges/[id] page.
export default async function PublicTrackPage({
  params,
}: {
  params: Promise<{ referenceCode: string }>;
}) {
  const { referenceCode } = await params;
  const exchange = await prisma.exchangeTransaction.findUnique({
    where: { referenceCode },
  });
  if (!exchange) notFound();

  const displayName = exchange.requesterRole === "GUEST" ? exchange.guestName : "Registered client";

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Logo size={26} />
          </Link>
          <Link href="/track" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-brand-blue">
            <ArrowLeft className="size-3.5" /> Track another
          </Link>
        </div>

        <div
          className="relative mb-6 overflow-hidden rounded-2xl p-6 text-white shadow-[var(--shadow-glow-blue)]"
          style={{ background: "var(--gradient-ocean)" }}
        >
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-semibold tracking-tight">
                  {exchange.referenceCode}
                </span>
                <ExchangeStatusBadge status={exchange.status} light />
              </div>
              <p className="mt-1 text-sm text-white/65">
                Submitted {exchange.createdAt.toLocaleDateString()} · {displayName}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
          <ExchangeStatusTimeline status={exchange.status} failureNote={exchange.processingNote} />
        </div>

        <section className="mb-6 rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
          <SectionHeading icon={<ArrowLeftRight className="size-3.5" />}>Exchange details</SectionHeading>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-text-muted">Amount paid</dt>
              <dd className="mt-0.5 font-medium text-text-primary">₵{exchange.amountGHS.toString()}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Amount received</dt>
              <dd className="mt-0.5 font-medium text-text-primary">¥{exchange.amountRMB.toString()}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Payment method</dt>
              <dd className="mt-0.5 font-medium text-text-primary">{exchange.paymentMethod}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Payment reference</dt>
              <dd className="mt-0.5 font-medium text-text-primary">{exchange.paymentRef}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-text-muted">Recipient receives via</dt>
              <dd className="mt-0.5 font-medium text-text-primary">
                {exchange.recipientMethod === "ALIPAY_QR"
                  ? "Alipay QR code"
                  : (exchange.recipientDetails ?? "—")}
              </dd>
            </div>
          </dl>
        </section>

        <p className="text-center text-xs text-text-muted">
          Questions about this request? Reach us on WhatsApp or call — the details are on the{" "}
          <Link href="/" className="text-brand-blue hover:underline">
            homepage
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
