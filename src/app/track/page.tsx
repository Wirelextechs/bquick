"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ExchangeStatusBadge } from "@/components/ExchangeStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/formError";
import { ArrowLeft } from "lucide-react";

type PhoneResult = {
  referenceCode: string;
  status: string;
  amountGHS: string;
  amountRMB: string;
  createdAt: string;
};

export default function TrackLookupPage() {
  const router = useRouter();
  const [refCode, setRefCode] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [results, setResults] = useState<PhoneResult[] | null>(null);

  function handleRefSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = refCode.trim();
    if (!code) return;
    router.push(`/track/${encodeURIComponent(code)}`);
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = phone.trim();
    if (!value) return;
    setPhoneLoading(true);
    setPhoneError(null);
    setResults(null);
    const res = await fetch(`/api/exchanges/track-by-phone?phone=${encodeURIComponent(value)}`);
    setPhoneLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setPhoneError(extractErrorMessage(body.error, "Failed to look up requests"));
      return;
    }
    const body = await res.json();
    setResults(body.exchanges ?? []);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Logo size={26} />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-brand-blue">
            <ArrowLeft className="size-3.5" /> Back home
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Track your exchange</h1>
        <p className="mt-1 text-sm text-text-muted">
          Look it up by your reference code, or by the phone/MoMo number you used.
        </p>

        <div className="mt-6 rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-sm font-semibold text-text-primary">By reference code</h2>
          <form onSubmit={handleRefSubmit} className="flex gap-2">
            <Input
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="e.g. EX-2026-AB12CD"
              className="flex-1"
            />
            <Button type="submit">Track</Button>
          </form>
        </div>

        <div className="mt-4 rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-1 text-sm font-semibold text-text-primary">Lost your code? Search by phone number</h2>
          <p className="mb-3 text-xs text-text-muted">
            Shows your last 10 requests submitted without an account.
          </p>
          <form onSubmit={handlePhoneSubmit} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="track-phone" className="sr-only">
                Phone or MoMo number
              </Label>
              <Input
                id="track-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 024XXXXXXX"
              />
            </div>
            <Button type="submit" disabled={phoneLoading}>
              {phoneLoading ? "Searching..." : "Find"}
            </Button>
          </form>

          {phoneError && (
            <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-brand-red">
              {phoneError}
            </div>
          )}

          {results && results.length === 0 && (
            <p className="mt-3 text-sm text-text-muted">No requests found for that number.</p>
          )}

          {results && results.length > 0 && (
            <ul className="mt-4 space-y-2">
              {results.map((r) => (
                <li key={r.referenceCode}>
                  <Link
                    href={`/track/${r.referenceCode}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-sunken px-3.5 py-2.5 hover:bg-surface-muted"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-medium text-brand-navy">{r.referenceCode}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        ₵{r.amountGHS} → ¥{r.amountRMB} · {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ExchangeStatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
