"use client";

import { useState } from "react";
import { Modal } from "./Modal";

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
    return "Order details edited";
  }
  return `Status changed ${entry.fromStatus?.replace("_", " ") ?? "?"} → ${entry.toStatus?.replace("_", " ") ?? "?"}`;
}

export function OrderHistoryButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[] | null>(null);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    const res = await fetch(`/api/admin/orders/${orderId}/logs`);
    const body = await res.json().catch(() => ({ logs: [] }));
    setLogs(body.logs ?? []);
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs font-medium text-text-secondary underline decoration-dotted underline-offset-2 hover:text-brand-blue"
      >
        History
      </button>

      {open && (
        <Modal title="Order history" description="Full audit trail for this order" onClose={() => setOpen(false)}>
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
