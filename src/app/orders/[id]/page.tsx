import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { AdminNav } from "@/components/AdminNav";
import { AgentNav } from "@/components/AgentNav";
import { ClientNav } from "@/components/ClientNav";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { OrderStatusUpdater } from "@/components/OrderStatusUpdater";
import { OrderMoreActions } from "@/components/OrderMoreActions";
import { EditOrderModal } from "@/components/EditOrderModal";
import { PhotoGallery } from "@/components/PhotoGallery";
import { canEditOrder } from "@/lib/orderPermissions";
import {
  ArrowLeft,
  Package,
  User,
  ShieldCheck,
  History,
  ArrowLeftRight,
  RefreshCcw,
  Pencil,
} from "lucide-react";

function describeLog(entry: {
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  fromClientName: string | null;
  toClientName: string | null;
}) {
  if (entry.action === "CLIENT_REASSIGNED") {
    return `Reassigned from ${entry.fromClientName ?? "unknown"} to ${entry.toClientName ?? "unknown"}`;
  }
  if (entry.action === "DETAILS_EDITED") {
    return "Shipment details edited";
  }
  return `Status changed ${entry.fromStatus?.replace("_", " ") ?? "?"} → ${entry.toStatus?.replace("_", " ") ?? "?"}`;
}

function logIcon(action: string) {
  if (action === "CLIENT_REASSIGNED") return <ArrowLeftRight className="size-3.5" />;
  if (action === "DETAILS_EDITED") return <Pencil className="size-3.5" />;
  return <RefreshCcw className="size-3.5" />;
}

const LOG_TONES: Record<string, string> = {
  CLIENT_REASSIGNED: "bg-amber-50 text-amber-600",
  DETAILS_EDITED: "bg-violet-50 text-violet-600",
  STATUS_CHANGE: "bg-brand-blue-light text-brand-blue",
};

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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: true,
      createdBy: { select: { id: true, name: true, email: true, agentLocation: true } },
      lastUpdatedBy: { select: { id: true, name: true } },
      items: true,
      photos: { orderBy: { createdAt: "desc" } },
      logs: {
        include: { agent: { select: { name: true, role: true } } },
        orderBy: { timestamp: "desc" },
      },
    },
  });
  if (!order) notFound();

  const role = session.user.role;
  if (role === "CLIENT" && order.clientId !== session.user.id) redirect("/client");

  const canEdit = canEditOrder(session.user, order);

  const backHref = role === "ADMIN" ? "/admin" : role === "AGENT" ? "/agent" : "/client";
  const navItems =
    role === "ADMIN"
      ? AdminNav("orders")
      : role === "AGENT"
        ? AgentNav("shipments")
        : ClientNav("shipments");

  const stageTimestamps = [
    { label: "Estimated arrival", value: order.estimatedArrival },
    { label: "Shipped", value: order.shippedAt },
    { label: "Arrived at Ghana port", value: order.arrivedAtPortAt },
    { label: "Arrived at warehouse", value: order.arrivedAtWarehouseAt },
    { label: "Picked up", value: order.pickedUpAt },
  ].filter((t) => t.value);

  return (
    <AppShell
      navItems={navItems}
      pageTitle={order.trackingCode}
      pageDescription={`Shipment from ${order.originCountry}`}
      userName={session.user.name ?? ""}
      roleLabel={role === "ADMIN" ? "Administrator" : role === "AGENT" ? "Agent" : "Client"}
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
                {order.trackingCode}
              </span>
              <StatusBadge status={order.status} light />
            </div>
            <p className="mt-1 text-sm text-white/65">
              Created {order.createdAt.toLocaleDateString()} by {order.createdBy.name}
            </p>
          </div>

          {(role === "AGENT" || role === "ADMIN") && (
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
              {canEdit && (
                <EditOrderModal
                  orderId={order.id}
                  initial={{
                    trackingCode: order.trackingCode,
                    originCountry: order.originCountry,
                    description: order.description,
                    weightKg: order.weightKg?.toString() ?? "",
                    declaredValue: order.declaredValue?.toString() ?? "",
                    items: order.items.map((item) => ({
                      id: item.id,
                      description: item.description,
                      quantity: item.quantity,
                      weightKg: item.weightKg?.toString() ?? "",
                      value: item.value?.toString() ?? "",
                    })),
                  }}
                />
              )}
              {role === "ADMIN" && (
                <OrderMoreActions
                  orderId={order.id}
                  currentClientName={order.client.name}
                  currentStatus={order.status}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
        <StatusTimeline status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
            <SectionHeading icon={<Package className="size-3.5" />}>Shipment details</SectionHeading>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-text-muted">Origin</dt>
                <dd className="mt-0.5 font-medium text-text-primary">{order.originCountry}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Weight</dt>
                <dd className="mt-0.5 font-medium text-text-primary">
                  {order.weightKg ? `${order.weightKg} kg` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Declared value</dt>
                <dd className="mt-0.5 font-medium text-text-primary">
                  {order.declaredValue ? `${order.declaredValue}` : "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-text-muted">Description</dt>
                <dd className="mt-0.5 font-medium text-text-primary">{order.description}</dd>
              </div>
            </dl>

            {order.items.length > 0 && (
              <div className="mt-4 border-t border-border-subtle pt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Itemized goods
                </h3>
                <ul className="space-y-1.5 text-sm text-text-secondary">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {item.quantity}× {item.description}
                      </span>
                      <span className="text-text-muted">
                        {item.weightKg ? `${item.weightKg} kg` : ""}
                        {item.value ? ` · ${item.value}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stageTimestamps.length > 0 && (
              <div className="mt-4 border-t border-border-subtle pt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Timeline
                </h3>
                <ul className="space-y-1 text-sm text-text-secondary">
                  {stageTimestamps.map((t) => (
                    <li key={t.label} className="flex justify-between">
                      <span>{t.label}</span>
                      <span className="text-text-muted">{t.value!.toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <PhotoGallery orderId={order.id} photos={order.photos} canEdit={canEdit} />

          {role === "ADMIN" && (
            <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
              <SectionHeading icon={<History className="size-3.5" />}>Audit trail</SectionHeading>
              {order.logs.length === 0 ? (
                <p className="text-sm text-text-muted">No changes recorded yet.</p>
              ) : (
                <ol className="space-y-4">
                  {order.logs.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          LOG_TONES[entry.action] ?? LOG_TONES.STATUS_CHANGE
                        }`}
                      >
                        {logIcon(entry.action)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{describeLog(entry)}</p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {entry.agent.name} ({entry.agent.role.toLowerCase()}) ·{" "}
                          {entry.timestamp.toLocaleString()}
                        </p>
                        {entry.note && (
                          <p className="mt-1 text-xs italic text-text-secondary">“{entry.note}”</p>
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
                <dd className="font-medium text-text-primary">{order.client.name}</dd>
              </div>
              {role !== "CLIENT" && (
                <>
                  <div>
                    <dt className="text-text-muted">Client ID</dt>
                    <dd className="font-mono text-text-primary">{order.client.clientCode ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Email</dt>
                    <dd className="text-text-primary">{order.client.email}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Phone</dt>
                    <dd className="text-text-primary">{order.client.phone ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Address</dt>
                    <dd className="text-text-primary">{order.client.address ?? "—"}</dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          {role === "ADMIN" && (
            <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
              <SectionHeading icon={<ShieldCheck className="size-3.5" />}>Provenance</SectionHeading>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-text-muted">Added by</dt>
                  <dd className="text-text-primary">
                    {order.createdBy.name}
                    {order.createdBy.agentLocation
                      ? ` (${order.createdBy.agentLocation === "GHANA" ? "Ghana" : "Abroad"})`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted">Last updated by</dt>
                  <dd className="text-text-primary">{order.lastUpdatedBy?.name ?? "—"}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
