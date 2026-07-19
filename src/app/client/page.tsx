import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusTimeline } from "@/components/StatusTimeline";
import { ShipmentPhotoStrip } from "@/components/ShipmentPhotoStrip";
import { Package } from "lucide-react";

export default async function ClientPage() {
  const session = await auth();

  const orders = await prisma.order.findMany({
    where: { clientId: session!.user.id },
    include: { items: true, photos: { orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="My Shipments" description="Track your goods from origin to your door" />
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface py-24 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[var(--shadow-glow-blue)]"
            style={{ background: "var(--gradient-ocean)" }}
          >
            <Package className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-medium text-text-primary">No shipments yet</p>
          <p className="mt-1 text-sm text-text-muted">
            Once an agent registers a shipment for you, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="relative flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: "var(--gradient-ocean)" }}
              />

              <div className="mb-3 flex items-start justify-between">
                <div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="font-mono text-sm font-semibold text-brand-navy hover:underline"
                  >
                    {order.trackingCode}
                  </Link>
                  <p className="mt-0.5 text-xs text-text-muted">From {order.originCountry}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <p className="text-sm text-text-secondary">{order.description}</p>

              {order.items.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-text-muted">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}× {item.description}
                    </li>
                  ))}
                </ul>
              )}

              {order.estimatedArrival && (
                <p className="mt-2 text-xs text-text-muted">
                  Estimated arrival {order.estimatedArrival.toLocaleDateString()}
                </p>
              )}

              <ShipmentPhotoStrip photos={order.photos} />

              <div className="mt-5 border-t border-border-subtle pt-4">
                <StatusTimeline status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
