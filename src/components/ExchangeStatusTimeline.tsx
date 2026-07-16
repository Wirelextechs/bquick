import { EXCHANGE_STATUS_ORDER } from "@/lib/exchangeStatusFlow";

const STEP_LABELS: Record<string, string> = {
  PENDING: "Request submitted",
  PROCESSING: "Payment verified",
  COMPLETED: "RMB sent",
};

export function ExchangeStatusTimeline({
  status,
  failureNote,
}: {
  status: string;
  failureNote?: string | null;
}) {
  if (status === "FAILED") {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
        <p className="text-sm font-medium text-brand-red">Request failed</p>
        {failureNote && <p className="mt-1 text-xs text-brand-red/80">&ldquo;{failureNote}&rdquo;</p>}
      </div>
    );
  }

  const currentIndex = EXCHANGE_STATUS_ORDER.indexOf(
    status as (typeof EXCHANGE_STATUS_ORDER)[number]
  );

  return (
    <div className="flex items-center">
      {EXCHANGE_STATUS_ORDER.map((step, i) => {
        const done = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === EXCHANGE_STATUS_ORDER.length - 1;
        return (
          <div key={step} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                  done ? "border-transparent" : "border-border-strong bg-surface"
                } ${isCurrent ? "scale-110 ring-4 ring-brand-cyan/25" : ""}`}
                style={done ? { background: "var(--gradient-action)" } : undefined}
              >
                {done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`mt-1.5 w-16 text-center text-[9px] leading-tight sm:w-20 sm:text-[10px] ${
                  done ? "font-medium text-text-primary" : "text-text-muted"
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className="mx-1 mb-4 h-0.5 flex-1 rounded bg-border-subtle"
                style={i < currentIndex ? { background: "var(--gradient-action)" } : undefined}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
