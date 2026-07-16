"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";

type LogEntry = {
  id: string;
  action: "STATUS_CHANGE" | "CLIENT_REASSIGNED" | "DETAILS_EDITED";
  fromStatus: string | null;
  toStatus: string | null;
  fromClientName: string | null;
  toClientName: string | null;
  note: string | null;
  timestamp: string;
  agent: { name: string; role: string };
};

function describe(entry: LogEntry) {
  if (entry.action === "CLIENT_REASSIGNED") {
    return `Reassigned from ${entry.fromClientName ?? "unknown"} to ${entry.toClientName ?? "unknown"}`;
  }
  if (entry.action === "DETAILS_EDITED") {
    return "Shipment details edited";
  }
  return `Status changed ${entry.fromStatus?.replace("_", " ") ?? "?"} → ${entry.toStatus?.replace("_", " ") ?? "?"}`;
}

export function OrderHistoryButton({
  orderId,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  orderId: string;
  /** Custom trigger element; pass `null` to render no trigger (fully externally controlled via `open`/`onOpenChange`). */
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const loading = open && logs === null;

  useEffect(() => {
    if (!open || logs !== null) return;
    let cancelled = false;
    fetch(`/api/admin/orders/${orderId}/logs`)
      .then((res) => res.json().catch(() => ({ logs: [] })))
      .then((body) => {
        if (!cancelled) setLogs(body.logs ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orderId, logs]);

  return (
    <>
      {trigger !== undefined ? (
        trigger
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <History className="size-3.5" /> History
        </Button>
      )}

      {open && (
        <Modal title="Shipment history" description="Full audit trail for this shipment" onClose={() => setOpen(false)}>
          {loading && <p className="text-sm text-text-muted">Loading…</p>}
          {!loading && logs && logs.length === 0 && (
            <p className="text-sm text-text-muted">No changes recorded yet.</p>
          )}
          {!loading && logs && logs.length > 0 && (
            <ol className="space-y-4">
              {logs.map((entry) => (
                <li key={entry.id} className="border-l-2 border-border-strong pl-4">
                  <p className="text-sm font-medium text-text-primary">{describe(entry)}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {entry.agent.name} ({entry.agent.role.toLowerCase()}) ·{" "}
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                  {entry.note && (
                    <p className="mt-1 text-xs italic text-text-secondary">“{entry.note}”</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Modal>
      )}
    </>
  );
}
