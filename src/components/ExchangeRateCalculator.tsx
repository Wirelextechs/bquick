"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExchangeRateCalculator({ rate }: { rate: string }) {
  const [amountGHS, setAmountGHS] = useState("");
  const numericRate = Number(rate);
  const numericAmount = Number(amountGHS);
  const amountRMB =
    amountGHS && !Number.isNaN(numericAmount) ? (numericAmount * numericRate).toFixed(2) : "0.00";

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Rate calculator</h2>
        <p className="text-xs text-text-muted">1 GHS = {numericRate.toFixed(4)} RMB</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="calc-ghs" className="mb-1.5">
            You pay (GHS)
          </Label>
          <Input
            id="calc-ghs"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amountGHS}
            onChange={(e) => setAmountGHS(e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1.5">Recipient gets (RMB)</Label>
          <div className="flex h-9 items-center rounded-md border border-border-subtle bg-surface-sunken px-3 text-sm font-medium text-text-primary">
            ¥ {amountRMB}
          </div>
        </div>
      </div>
    </div>
  );
}
