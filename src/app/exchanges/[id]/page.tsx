import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { ClientNav } from "@/components/ClientNav";
import { ExchangeStatusBadge } from "@/components/ExchangeStatusBadge";
import { ExchangeStatusTimeline } from "@/components/ExchangeStatusTimeline";
import { ExchangeProcessModal } from "@/components/ExchangeProcessModal";
import { ExchangeProofUpload } from "@/components/ExchangeProofUpload";
import { ArrowLeft, ArrowLeftRight, User, History } from "lucide-react";

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

export default async function ExchangeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const exchange = await prisma.exchangeTransaction.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, clientCode: true, email: true, phone: true } },
      processedBy: { select: { id: true, name: true } },
      logs: {
        include: { admin: { select: { name: true, role: true } } },
        orderBy: { timestamp: "desc" },
      },
    },
  });
  if (!exchange) notFound();

  const role = session.user.role;
  if (role === "CLIENT" && exchange.clientId !== session.user.id) redirect("/client/exchange");

  const backHref = role === "ADMIN" ? "/admin/exchange" : "/client/exchange";
  const navItems = role === "ADMIN" ? AdminNav("exchange") : ClientNav("exchange");

  return (
    <AppShell
      navItems={navItems}
      pageTitle={exchange.referenceCode}
      pageDescription="RMB Exchange request"
      userName={session.user.name ?? ""}
      roleLabel={role === "ADMIN" ? "Administrator" : "Client"}
    >
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-brand-blue"
      >
        <ArrowLeft className="size-3.5" /> Back
      </Link>

      <div
        className="relative mb-6 overflow-hidden rounded-2xl p-6 text-white shadow-[var(--shadow-glow-blue)]"
        style={{ background: "var(--gradient-ocean)" }}
      >
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-brand-cyan/20 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-semibold tracking-tight">
                {exchange.referenceCode}
              </span>
              <ExchangeStatusBadge status={exchange.status} light />
            </div>
            <p className="mt-1 text-sm text-white/65">
              Submitted {exchange.createdAt.toLocaleDateString()}
            </p>
          </div>

          {role === "ADMIN" && (exchange.status === "PENDING" || exchange.status === "PROCESSING") && (
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
          )}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
        <ExchangeStatusTimeline status={exchange.status} failureNote={exchange.processingNote} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
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
                <dt className="text-text-muted">Rate</dt>
                <dd className="mt-0.5 font-medium text-text-primary">1 GHS = {exchange.rate.toString()} RMB</dd>
              </div>
              <div>
                <dt className="text-text-muted">Payment method</dt>
                <dd className="mt-0.5 font-medium text-text-primary">{exchange.paymentMethod}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Payment reference</dt>
                <dd className="mt-0.5 font-medium text-text-primary">{exchange.paymentRef}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Contact phone</dt>
                <dd className="mt-0.5 font-medium text-text-primary">{exchange.contactPhone}</dd>
              </div>
              {exchange.paymentMethod === "MOMO" ? (
                <>
                  <div>
                    <dt className="text-text-muted">Payer MoMo name</dt>
                    <dd className="mt-0.5 font-medium text-text-primary">{exchange.payerMomoName}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Payer MoMo number</dt>
                    <dd className="mt-0.5 font-medium text-text-primary">{exchange.payerMomoNumber}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <dt className="text-text-muted">Payer bank</dt>
                    <dd className="mt-0.5 font-medium text-text-primary">{exchange.payerBankName}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Payer account</dt>
                    <dd className="mt-0.5 font-medium text-text-primary">
                      {exchange.payerBankAccountName} · {exchange.payerBankAccountNumber}
                    </dd>
                  </div>
                </>
              )}
              <div className="col-span-2">
                <dt className="text-text-muted">Recipient receives via</dt>
                <dd className="mt-0.5 font-medium text-text-primary">
                  {exchange.recipientMethod === "ALIPAY_QR"
                    ? "Alipay QR code (see below)"
                    : (exchange.recipientDetails ?? "—")}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
            <SectionHeading icon={<ArrowLeftRight className="size-3.5" />}>Your payment proof</SectionHeading>
            {exchange.proofUrl ? (
              <a href={exchange.proofUrl} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={exchange.proofUrl}
                  alt="Payment proof"
                  className="max-h-72 rounded-lg border border-border-subtle object-contain"
                />
              </a>
            ) : role === "CLIENT" && exchange.status === "PENDING" ? (
              <ExchangeProofUpload
                exchangeId={exchange.id}
                endpoint="proof"
                label="Upload payment proof / MoMo screenshot"
              />
            ) : (
              <p className="text-sm text-text-muted">No payment proof uploaded.</p>
            )}
          </section>

          {exchange.recipientMethod === "ALIPAY_QR" && (
            <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
              <SectionHeading icon={<ArrowLeftRight className="size-3.5" />}>Recipient&apos;s Alipay QR</SectionHeading>
              {exchange.recipientQrUrl ? (
                <a href={exchange.recipientQrUrl} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={exchange.recipientQrUrl}
                    alt="Recipient Alipay QR"
                    className="max-h-72 rounded-lg border border-border-subtle object-contain"
                  />
                </a>
              ) : role === "CLIENT" && exchange.status === "PENDING" ? (
                <ExchangeProofUpload
                  exchangeId={exchange.id}
                  endpoint="recipient-qr"
                  label="Upload recipient's Alipay QR code"
                />
              ) : (
                <p className="text-sm text-text-muted">No recipient QR uploaded yet.</p>
              )}
            </section>
          )}

          {role === "ADMIN" && (
            <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
              <SectionHeading icon={<History className="size-3.5" />}>Audit trail</SectionHeading>
              {exchange.logs.length === 0 ? (
                <p className="text-sm text-text-muted">No changes recorded yet.</p>
              ) : (
                <ol className="space-y-4">
                  {exchange.logs.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue">
                        <ArrowLeftRight className="size-3.5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {entry.fromStatus?.replace("_", " ") ?? "?"} → {entry.toStatus?.replace("_", " ") ?? "?"}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {entry.admin.name} ({entry.admin.role.toLowerCase()}) ·{" "}
                          {entry.timestamp.toLocaleString()}
                        </p>
                        {entry.note && (
                          <p className="mt-1 text-xs italic text-text-secondary">&ldquo;{entry.note}&rdquo;</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
            <SectionHeading icon={<User className="size-3.5" />}>Client</SectionHeading>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-text-muted">Name</dt>
                <dd className="font-medium text-text-primary">{exchange.client.name}</dd>
              </div>
              {role !== "CLIENT" && (
                <>
                  <div>
                    <dt className="text-text-muted">Client ID</dt>
                    <dd className="font-mono text-text-primary">{exchange.client.clientCode ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Email</dt>
                    <dd className="text-text-primary">{exchange.client.email}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Phone</dt>
                    <dd className="text-text-primary">{exchange.client.phone ?? "—"}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          {role === "ADMIN" && exchange.processedBy && (
            <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
              <SectionHeading icon={<History className="size-3.5" />}>Processing</SectionHeading>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-text-muted">Last handled by</dt>
                  <dd className="text-text-primary">{exchange.processedBy.name}</dd>
                </div>
                {exchange.processedAt && (
                  <div>
                    <dt className="text-text-muted">At</dt>
                    <dd className="text-text-primary">{exchange.processedAt.toLocaleString()}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
