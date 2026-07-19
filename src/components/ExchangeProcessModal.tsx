"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "./Modal";
import { useRefreshTransition } from "@/lib/useRefreshTransition";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/formError";

type Exchange = {
  id: string;
  referenceCode: string;
  status: string;
  amountGHS: string;
  amountRMB: string;
  paymentMethod: string;
  paymentRef: string;
  payerMomoName: string | null;
  payerMomoNumber: string | null;
  payerBankName: string | null;
  payerBankAccountNumber: string | null;
  payerBankAccountName: string | null;
  proofUrl: string | null;
  recipientMethod: string;
  recipientDetails: string | null;
  recipientQrUrl: string | null;
};

export function ExchangeProcessModal({ exchange }: { exchange: Exchange }) {
  const { isPending, refresh } = useRefreshTransition();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (confirmed && !isPending) {
      setConfirmed(false);
      setOpen(false);
      setNote("");
    }
  }, [confirmed, isPending]);

  async function runAction(action: "process" | "complete" | "fail") {
    if (action === "fail" && !note.trim()) {
      setError("A reason is required to fail a request");
      return;
    }
    setLoading(action);
    setError(null);
    const res = await fetch(`/api/admin/exchanges/${exchange.id}/${action}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note || undefined }),
    });
    setLoading(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, `Failed to ${action} request`));
      return;
    }
    toast.success(
      action === "process"
        ? "Marked as processing"
        : action === "complete"
          ? "Marked as completed"
          : "Marked as failed"
    );
    setConfirmed(true);
    refresh();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Review
      </Button>

      {open && (
        <Modal
          title={`Process ${exchange.referenceCode}`}
          description="Cross-check the details below against the merchant MoMo/bank account before acting."
          onClose={() => setOpen(false)}
        >
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border-subtle bg-surface-sunken p-3 text-sm">
              <div>
                <dt className="text-text-muted">Amount</dt>
                <dd className="font-medium text-text-primary">
                  ₵{exchange.amountGHS} → ¥{exchange.amountRMB}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Method</dt>
                <dd className="font-medium text-text-primary">{exchange.paymentMethod}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Payment ref</dt>
                <dd className="font-medium text-text-primary">{exchange.paymentRef}</dd>
              </div>
              <div>
                <dt className="text-text-muted">{exchange.paymentMethod === "MOMO" ? "Payer MoMo" : "Payer bank"}</dt>
                <dd className="font-medium text-text-primary">
                  {exchange.paymentMethod === "MOMO"
                    ? `${exchange.payerMomoName} · ${exchange.payerMomoNumber}`
                    : `${exchange.payerBankName} · ${exchange.payerBankAccountName} · ${exchange.payerBankAccountNumber}`}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-text-muted">Recipient</dt>
                <dd className="font-medium text-text-primary">
                  {exchange.recipientMethod === "ALIPAY_QR"
                    ? "Pays via Alipay QR (see below)"
                    : (exchange.recipientDetails ?? "—")}
                </dd>
              </div>
            </dl>

            <div className={exchange.recipientMethod === "ALIPAY_QR" ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : ""}>
              <div>
                <p className="mb-1 text-xs font-medium text-text-muted">Your payment proof</p>
                {exchange.proofUrl ? (
                  <a href={exchange.proofUrl} target="_blank" rel="noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={exchange.proofUrl}
                      alt="Payment proof"
                      className="max-h-40 w-full rounded-lg border border-border-subtle object-contain"
                    />
                  </a>
                ) : (
                  <p className="text-xs text-text-muted">Not uploaded.</p>
                )}
              </div>
              {exchange.recipientMethod === "ALIPAY_QR" && (
                <div>
                  <p className="mb-1 text-xs font-medium text-text-muted">Recipient&apos;s Alipay QR</p>
                  {exchange.recipientQrUrl ? (
                    <a href={exchange.recipientQrUrl} target="_blank" rel="noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={exchange.recipientQrUrl}
                        alt="Recipient Alipay QR"
                        className="max-h-40 w-full rounded-lg border border-border-subtle object-contain"
                      />
                    </a>
                  ) : (
                    <p className="text-xs text-text-muted">Not uploaded yet.</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="ex-process-note" className="mb-1.5">
                Note (required to fail)
              </Label>
              <Textarea
                id="ex-process-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Payment confirmed in merchant MoMo account"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-brand-red">
                {error}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading !== null || confirmed}
                className="border-brand-red text-brand-red hover:bg-red-50"
                onClick={() => runAction("fail")}
              >
                {loading === "fail" ? "Failing..." : "Fail"}
              </Button>
              {exchange.status === "PENDING" && (
                <Button type="button" disabled={loading !== null || confirmed} onClick={() => runAction("process")}>
                  {loading === "process" || confirmed ? "Saving..." : "Verify payment → Processing"}
                </Button>
              )}
              {exchange.status === "PROCESSING" && (
                <Button type="button" disabled={loading !== null || confirmed} onClick={() => runAction("complete")}>
                  {loading === "complete" || confirmed ? "Saving..." : "RMB sent → Completed"}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
