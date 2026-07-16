"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractErrorMessage } from "@/lib/formError";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  MOMO: "Mobile Money",
  BANK: "Bank transfer",
};

const RECIPIENT_METHOD_LABELS: Record<string, string> = {
  ALIPAY_QR: "Upload Alipay QR code",
  ACCOUNT_DETAILS: "Type bank / vendor account details",
};

const INITIAL_FORM = {
  amountGHS: "",
  paymentMethod: "MOMO",
  paymentRef: "",
  payerMomoName: "",
  payerMomoNumber: "",
  payerBankName: "",
  payerBankAccountNumber: "",
  payerBankAccountName: "",
  recipientMethod: "ALIPAY_QR",
  recipientDetails: "",
  contactPhone: "",
};

export function ExchangeRequestForm({ rate }: { rate: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [recipientQrFile, setRecipientQrFile] = useState<File | null>(null);

  const numericRate = Number(rate);
  const numericAmount = Number(form.amountGHS);
  const amountRMBPreview =
    form.amountGHS && !Number.isNaN(numericAmount)
      ? (numericAmount * numericRate).toFixed(2)
      : "0.00";

  function resetForm() {
    setForm(INITIAL_FORM);
    setProofFile(null);
    setRecipientQrFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!proofFile) {
      setError("Upload your payment proof / screenshot before submitting");
      return;
    }
    if (form.recipientMethod === "ALIPAY_QR" && !recipientQrFile) {
      setError("Upload the recipient's Alipay QR code, or switch to typed account details");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/client/exchanges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amountGHS: Number(form.amountGHS),
      }),
    });

    if (!res.ok) {
      setLoading(false);
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to submit exchange request"));
      return;
    }

    const { exchange } = await res.json();

    async function uploadImage(endpoint: string, file: File, failureLabel: string) {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(`/api/client/exchanges/${exchange.id}/${endpoint}`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        toast.error(extractErrorMessage(body.error, `Request submitted, but ${failureLabel} failed`));
      }
    }

    if (proofFile) await uploadImage("proof", proofFile, "payment proof upload");
    if (recipientQrFile) await uploadImage("recipient-qr", recipientQrFile, "recipient QR upload");

    setLoading(false);
    toast.success(`Exchange request ${exchange.referenceCode} submitted`);
    resetForm();
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New exchange request
      </Button>

      {open && (
        <Modal
          title="Request an RMB exchange"
          description="Submit your payment details for verification. The merchant MoMo details are shown on this page."
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ex-amount" className="mb-1.5">
                  Amount to pay (GHS)
                </Label>
                <Input
                  id="ex-amount"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amountGHS}
                  onChange={(e) => setForm({ ...form, amountGHS: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1.5">Recipient gets (RMB)</Label>
                <div className="flex h-9 items-center rounded-md border border-border-subtle bg-surface-sunken px-3 text-sm font-medium text-text-primary">
                  ¥ {amountRMBPreview}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="ex-method" className="mb-1.5">
                Payment method
              </Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(value) => value && setForm({ ...form, paymentMethod: value })}
              >
                <SelectTrigger id="ex-method" className="w-full">
                  <SelectValue>{(value: string) => PAYMENT_METHOD_LABELS[value] ?? value}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ex-ref" className="mb-1.5">
                  Payment reference
                </Label>
                <Input
                  id="ex-ref"
                  required
                  value={form.paymentRef}
                  onChange={(e) => setForm({ ...form, paymentRef: e.target.value })}
                  placeholder={
                    form.paymentMethod === "MOMO" ? "e.g. 4-digit MoMo reference" : "Bank transfer reference"
                  }
                />
                <p className="mt-1 text-xs text-text-muted">
                  {form.paymentMethod === "MOMO"
                    ? "Use the exact reference shown in your MoMo payment confirmation, so we can match it quickly."
                    : "If your bank provides a transfer reference, enter it here. Otherwise, this may not apply."}
                </p>
              </div>
              <div>
                <Label htmlFor="ex-contact" className="mb-1.5">
                  Contact phone
                </Label>
                <Input
                  id="ex-contact"
                  required
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                />
              </div>
            </div>

            {form.paymentMethod === "MOMO" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ex-payer-name" className="mb-1.5">
                    Name on paying MoMo account
                  </Label>
                  <Input
                    id="ex-payer-name"
                    required
                    value={form.payerMomoName}
                    onChange={(e) => setForm({ ...form, payerMomoName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ex-payer-number" className="mb-1.5">
                    Paying MoMo number
                  </Label>
                  <Input
                    id="ex-payer-number"
                    required
                    value={form.payerMomoNumber}
                    onChange={(e) => setForm({ ...form, payerMomoNumber: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="ex-payer-bank-name" className="mb-1.5">
                      Bank name
                    </Label>
                    <Input
                      id="ex-payer-bank-name"
                      required
                      value={form.payerBankName}
                      onChange={(e) => setForm({ ...form, payerBankName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ex-payer-bank-account-number" className="mb-1.5">
                      Account number
                    </Label>
                    <Input
                      id="ex-payer-bank-account-number"
                      required
                      value={form.payerBankAccountNumber}
                      onChange={(e) => setForm({ ...form, payerBankAccountNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ex-payer-bank-account-name" className="mb-1.5">
                    Account holder name
                  </Label>
                  <Input
                    id="ex-payer-bank-account-name"
                    required
                    value={form.payerBankAccountName}
                    onChange={(e) => setForm({ ...form, payerBankAccountName: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="ex-proof" className="mb-1.5">
                Your payment proof / screenshot
              </Label>
              <Input
                id="ex-proof"
                type="file"
                required
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-text-muted">
                Proof that you sent the GHS payment to us: a screenshot of the MoMo/bank confirmation.
              </p>
            </div>

            <div>
              <Label htmlFor="ex-recipient-method" className="mb-1.5">
                How should the recipient receive payment?
              </Label>
              <Select
                value={form.recipientMethod}
                onValueChange={(value) => value && setForm({ ...form, recipientMethod: value })}
              >
                <SelectTrigger id="ex-recipient-method" className="w-full">
                  <SelectValue>{(value: string) => RECIPIENT_METHOD_LABELS[value] ?? value}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECIPIENT_METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-text-muted">
                Different suppliers accept payment differently. Pick whichever the recipient requires.
              </p>
            </div>

            {form.recipientMethod === "ACCOUNT_DETAILS" ? (
              <div>
                <Label htmlFor="ex-recipient" className="mb-1.5">
                  Recipient details
                </Label>
                <Textarea
                  id="ex-recipient"
                  required
                  rows={3}
                  value={form.recipientDetails}
                  onChange={(e) => setForm({ ...form, recipientDetails: e.target.value })}
                  placeholder="Chinese bank account (bank, account number, account name) OR vendor platform + payment ID (Alibaba/Taobao/1688)"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="ex-recipient-qr" className="mb-1.5">
                  Recipient&apos;s Alipay QR code
                </Label>
                <Input
                  id="ex-recipient-qr"
                  type="file"
                  required
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => setRecipientQrFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-brand-red">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit request"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
