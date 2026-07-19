"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  guestName: "",
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

// Public "fast request" widget on the landing page — no login required.
// Unlike the authenticated ExchangeRequestForm (create, then two follow-up
// uploads), this submits everything, including the proof/QR files, in one
// multipart request to /api/exchanges/public, since there's no dashboard to
// come back to for a guest.
export function PublicExchangeRequestForm({ rate }: { rate: string }) {
  const router = useRouter();
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

    const formData = new FormData();
    for (const [key, value] of Object.entries(form)) {
      formData.append(key, value);
    }
    formData.append("proof", proofFile);
    if (recipientQrFile) formData.append("recipientQr", recipientQrFile);
    // Honeypot: real visitors never see this field (hidden via CSS below).
    formData.append("companyWebsite", "");

    const res = await fetch("/api/exchanges/public", {
      method: "POST",
      body: formData,
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(extractErrorMessage(body.error, "Failed to submit exchange request"));
      return;
    }

    const { referenceCode } = await res.json();
    router.push(`/track/${referenceCode}`);
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-1 text-sm font-semibold text-text-primary">Request an RMB exchange</h2>
      <p className="mb-4 text-xs text-text-muted">
        No account needed. Submit your payment details below and we&apos;ll verify it against our
        MoMo account.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot field: hidden from real users via CSS, not display:none
            (which some bots skip), and off-screen rather than opacity so
            screen readers don't announce it either. */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="pub-ex-company">Company website</label>
          <input id="pub-ex-company" name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div>
          <Label htmlFor="pub-ex-name" className="mb-1.5">
            Your name
          </Label>
          <Input
            id="pub-ex-name"
            required
            value={form.guestName}
            onChange={(e) => setForm({ ...form, guestName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pub-ex-amount" className="mb-1.5">
              Amount to pay (GHS)
            </Label>
            <Input
              id="pub-ex-amount"
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
          <Label htmlFor="pub-ex-method" className="mb-1.5">
            Payment method
          </Label>
          <Select
            value={form.paymentMethod}
            onValueChange={(value) => value && setForm({ ...form, paymentMethod: value })}
          >
            <SelectTrigger id="pub-ex-method" className="w-full">
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
            <Label htmlFor="pub-ex-ref" className="mb-1.5">
              Payment reference
            </Label>
            <Input
              id="pub-ex-ref"
              required
              value={form.paymentRef}
              onChange={(e) => setForm({ ...form, paymentRef: e.target.value })}
              placeholder={
                form.paymentMethod === "MOMO" ? "e.g. 4-digit MoMo reference" : "Bank transfer reference"
              }
            />
          </div>
          <div>
            <Label htmlFor="pub-ex-contact" className="mb-1.5">
              Contact phone
            </Label>
            <Input
              id="pub-ex-contact"
              required
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </div>
        </div>

        {form.paymentMethod === "MOMO" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pub-ex-payer-name" className="mb-1.5">
                Name on paying MoMo account
              </Label>
              <Input
                id="pub-ex-payer-name"
                required
                value={form.payerMomoName}
                onChange={(e) => setForm({ ...form, payerMomoName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="pub-ex-payer-number" className="mb-1.5">
                Paying MoMo number
              </Label>
              <Input
                id="pub-ex-payer-number"
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
                <Label htmlFor="pub-ex-payer-bank-name" className="mb-1.5">
                  Bank name
                </Label>
                <Input
                  id="pub-ex-payer-bank-name"
                  required
                  value={form.payerBankName}
                  onChange={(e) => setForm({ ...form, payerBankName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pub-ex-payer-bank-account-number" className="mb-1.5">
                  Account number
                </Label>
                <Input
                  id="pub-ex-payer-bank-account-number"
                  required
                  value={form.payerBankAccountNumber}
                  onChange={(e) => setForm({ ...form, payerBankAccountNumber: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pub-ex-payer-bank-account-name" className="mb-1.5">
                Account holder name
              </Label>
              <Input
                id="pub-ex-payer-bank-account-name"
                required
                value={form.payerBankAccountName}
                onChange={(e) => setForm({ ...form, payerBankAccountName: e.target.value })}
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="pub-ex-proof" className="mb-1.5">
            Your payment proof / screenshot
          </Label>
          <Input
            id="pub-ex-proof"
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
          <Label htmlFor="pub-ex-recipient-method" className="mb-1.5">
            How should the recipient receive payment?
          </Label>
          <Select
            value={form.recipientMethod}
            onValueChange={(value) => value && setForm({ ...form, recipientMethod: value })}
          >
            <SelectTrigger id="pub-ex-recipient-method" className="w-full">
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
        </div>

        {form.recipientMethod === "ACCOUNT_DETAILS" ? (
          <div>
            <Label htmlFor="pub-ex-recipient" className="mb-1.5">
              Recipient details
            </Label>
            <Textarea
              id="pub-ex-recipient"
              required
              rows={3}
              value={form.recipientDetails}
              onChange={(e) => setForm({ ...form, recipientDetails: e.target.value })}
              placeholder="Chinese bank account (bank, account number, account name) OR vendor platform + payment ID (Alibaba/Taobao/1688)"
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="pub-ex-recipient-qr" className="mb-1.5">
              Recipient&apos;s Alipay QR code
            </Label>
            <Input
              id="pub-ex-recipient-qr"
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

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Submitting..." : "Submit request"}
        </Button>
      </form>
    </div>
  );
}
